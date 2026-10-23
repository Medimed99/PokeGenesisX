"""Cartes de collection : illustrations pleine carte, une par generation.

Pour chaque legendaire, et chaque generation qui l'a dessine :
  - le sprite de cette generation, detoure (plus de carre blanc derriere les
    sprites Rouge/Bleu et Or/Argent) ;
  - une scene peinte dans l'ecriture de la meme generation (cardthemes.py) :
    les quatre teintes du sprite pour 1996, huit couleurs tramees pour 1999,
    vingt pour 2002, quarante pour 2010, une image lisse pour aujourd'hui ;
  - une couche de particules, animee sur la carte agrandie.

Deux atlas : « px » (pixel art, WebP sans perte) et « hd » (illustrations
lisses, WebP). src/_cardart.js les embarque avec le manifeste ; build_web.py
les sort en fichiers pour la version hebergee.

Substitutions (voir assets/cardart/LISEZMOI.txt) :
  {serie}_{numero}.png         remplace le sujet de la carte
  {serie}_{numero}_scene.png   remplace la scene entiere (format 5:7)

Usage : python3 build_cardart.py [--apercu dossier]
"""
import base64, io, json, math, os, re, sys
import numpy as np
from PIL import Image

from cardsrc import SERIES, GRID, YEAR, legendaries, load_subject, load_back, layout, scene_override
from cardscene import Ctx, write_era, fx_tile
from cardthemes import THEMES, META

FX_HD = (200, 280)          # la couche de particules lisses n'a pas besoin de plus


def u8(img):
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def rgba(rgb):
    return np.dstack([rgb, np.full(rgb.shape[:2], 255, np.uint8)])


def missingno():
    """Le sujet de la piece secrete : le sprite du jeu, sans son fond."""
    s = open("src/_chars.js", encoding="utf-8").read()
    m = re.search(r'MISSING_SPRITE\s*=\s*"data:image/png;base64,([A-Za-z0-9+/=]+)"', s)
    a = np.array(Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert("RGBA"))
    bg = np.all(a[..., :3] == (10, 7, 19), -1) | np.all(a[..., :3] == (42, 27, 70), -1)
    a[bg, 3] = 0
    ys, xs = np.nonzero(a[..., 3])
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def render(series, pid, sub, era_override=None):
    """Une carte : scene, sujet place, particules. Renvoie un dict de couches."""
    meta = META[pid]
    era = era_override or series
    x, y, w, h, k, W, H, ccx, ccy = layout(era, sub, meta["fly"])
    box = (x / W, y / H, (x + w) / W, (y + h) / H)
    custom_scene = scene_override(series, pid) if pid else None
    if custom_scene:
        im = Image.open(custom_scene).convert("RGB")
        tw, th = GRID["art"]
        s = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        l, t = (im.width - tw) // 2, (im.height - th) // 2
        scene = np.array(im.crop((l, t, l + tw, t + th)))
        scene_hd = True
    else:
        c = Ctx(W, H, era, pid or 999, box, core=(ccx, ccy))
        img = THEMES[pid](c)
        img = write_era(img, era, sprite_pal=sub.get("pal"), gamma=meta.get("g1", 1.15),
                        rng=np.random.default_rng(pid + 17))
        scene = u8(img)
        scene_hd = era == "art"
    pal = None if scene_hd else np.unique(scene.reshape(-1, 3), axis=0).astype(np.float32) / 255
    kind, cols, dens = meta["fx"]
    if era == "art":
        fx = fx_tile(FX_HD[0], FX_HD[1], "art", kind, cols, dens, pid + 7)
    else:
        fx = fx_tile(W, H, era, kind, cols, dens, pid + 7 + (SERIES.index(series) if series in SERIES else 9), pal)
    subj_hd = era == "art" or sub["custom"]
    return dict(scene=scene, scene_hd=scene_hd, subj=sub["rgba"], subj_hd=subj_hd, fx=fx, fx_hd=era == "art",
                box=[round(100 * v, 3) for v in (x / W, y / H, w / W, h / H)], k=k, grid=(W, H),
                core=[round(100 * ccx, 1), round(100 * ccy, 1)])


def pack(items, maxw, gutter=2):
    """Rangement en etageres. items : [(cle, tableau RGBA, opaque)].
    Les images opaques debordent d'un pixel sur leur marge : un echantillonnage
    au pixel pres en bord de case ne montre jamais la case voisine."""
    order = sorted(range(len(items)), key=lambda i: (-items[i][1].shape[0], -items[i][1].shape[1]))
    x = y = rowh = usedw = 0
    pos = {}
    for i in order:
        h, w = items[i][1].shape[:2]
        if x + w + 2 * gutter > maxw and x > 0:
            x, y, rowh = 0, y + rowh, 0
        pos[i] = (x + gutter, y + gutter)
        x += w + 2 * gutter
        usedw = max(usedw, x)
        rowh = max(rowh, h + 2 * gutter)
    Hh = y + rowh
    atlas = np.zeros((Hh, usedw, 4), np.uint8)
    rects = {}
    for i, (key, arr, opaque) in enumerate(items):
        px, py = pos[i]
        h, w = arr.shape[:2]
        if opaque:
            atlas[py - gutter:py + h + gutter, px - gutter:px + w + gutter] = np.pad(
                arr, ((gutter, gutter), (gutter, gutter), (0, 0)), mode="edge")
        else:
            atlas[py:py + h, px:px + w] = arr
        rects[key] = [px, py, w, h]
    return atlas, rects


def encode(atlas, lossless):
    im = Image.fromarray(atlas, "RGBA")
    buf = io.BytesIO()
    if lossless:
        im.save(buf, "WEBP", lossless=True, quality=100, method=6)
    else:
        im.save(buf, "WEBP", quality=84, alpha_quality=92, method=6)
    return buf.getvalue()


def main():
    preview = sys.argv[sys.argv.index("--apercu") + 1] if "--apercu" in sys.argv else None
    legs = legendaries()
    cards = {}
    for series in SERIES:
        for pid in legs:
            sub = load_subject(series, pid)
            if not sub or pid not in META:
                continue
            cards[f"{series}:{pid}"] = (series, pid, sub, render(series, pid, sub))
    mn_sub = dict(rgba=missingno(), pal=None, custom=False, colors=6, native=(64, 64))
    cards["mn:0"] = ("mn", 0, mn_sub, render("mn", 0, mn_sub, era_override="g3"))
    # la carte de Porygon-Z, ecrite a la fin ECRIRE (fetch_cardsprites.py telecharge son illustration)
    pz_sub = load_subject("art", 474)
    if pz_sub:
        pz_sub["key"] = "pz:474"
        cards["pz:474"] = ("pz", 474, pz_sub, render("pz", 474, pz_sub, era_override="art"))
    else:
        print("ATTENTION : sprites/cards/art_474.png manque (python3 fetch_cardsprites.py) : pas de carte de Porygon-Z")

    # les dos des sprites d'epoque : les apparences d'epoque s'en servent en combat (73h)
    backs = {}
    for key, (series, pid, sub, r) in cards.items():
        if series in ("g1", "g2", "g3") and not sub["custom"]:
            b = load_back(series, pid)
            if b:
                backs[key] = b

    px_items, hd_items = [], []
    for key, (series, pid, sub, r) in cards.items():
        (hd_items if r["scene_hd"] else px_items).append((key + "/s", rgba(r["scene"]), True))
        (hd_items if r["subj_hd"] else px_items).append((key + "/m", r["subj"], False))
        (hd_items if r["fx_hd"] else px_items).append((key + "/f", r["fx"], False))
    for key, b in backs.items():
        px_items.append((key + "/k", b["rgba"], False))
    px_atlas, px_rects = pack(px_items, 1024)
    hd_atlas, hd_rects = pack(hd_items, 2048)
    px_data, hd_data = encode(px_atlas, True), encode(hd_atlas, False)

    def rect(k):
        return (["px"] + px_rects[k]) if k in px_rects else (["hd"] + hd_rects[k])

    index = {}
    mn = pz = None
    for key, (series, pid, sub, r) in cards.items():
        kind = META[pid]["fx"][0]
        nw, nh = sub["native"]
        entry = {"s": rect(key + "/s"), "m": rect(key + "/m"), "f": rect(key + "/f"),
                 "b": r["box"], "c": r["core"], "p": kind, "l": META[pid]["light"],
                 "n": [nw, nh, sub["colors"]] if not sub["custom"] else None}
        if series in ("g1", "g2", "g3") and not sub["custom"]:
            # pour dessiner le sprite d'epoque a sa place dans son cadre d'origine : decalage et taille du cadre
            entry["o"] = [sub["off"][0], sub["off"][1], nw, nh]
            entry["q"] = sub["ramp"]
            if key in backs:
                b = backs[key]
                entry["k"] = rect(key + "/k")
                entry["ko"] = [b["off"][0], b["off"][1], b["native"][0], b["native"][1]]
        if key == "mn:0":
            mn = entry
        elif key == "pz:474":
            pz = entry
        else:
            index[key] = entry
    titles = {str(pid): META[pid]["t"] for pid in META}

    def uri(data):
        return "data:image/webp;base64," + base64.b64encode(data).decode()
    os.makedirs("build", exist_ok=True)
    open("build/card_px.webp", "wb").write(px_data)
    open("build/card_hd.webp", "wb").write(hd_data)
    js = ("/* Cartes de collection : scenes, sujets et particules (build_cardart.py).\n"
          "   « px » : pixel art, agrandi sans lissage ; « hd » : illustrations lisses. */\n"
          f'const CARD_ATLAS={{"px":{{"u":"{uri(px_data)}","w":{px_atlas.shape[1]},"h":{px_atlas.shape[0]}}},'
          f'"hd":{{"u":"{uri(hd_data)}","w":{hd_atlas.shape[1]},"h":{hd_atlas.shape[0]}}}}};\n'
          f"const CARD_INDEX={json.dumps(index, ensure_ascii=False, separators=(',', ':'))};\n"
          f"const CARD_MN={json.dumps(mn, ensure_ascii=False, separators=(',', ':'))};\n"
          f"const CARD_PZ={json.dumps(pz, ensure_ascii=False, separators=(',', ':'))};\n"
          f"const CARD_SCENES={json.dumps(titles, ensure_ascii=False)};\n"
          f"const CARD_YEARS={json.dumps(YEAR)};\n")
    open("src/_cardart.js", "w", encoding="utf-8").write(js)

    print(f"{len(cards)} cartes ({len(index)} illustrations, la piece secrete{', Porygon-Z' if pz else ''})")
    for s in SERIES:
        print(f"  {s:<4} {sum(1 for k in cards if k.startswith(s + ':')):>2}")
    print(f"  dos d'epoque : {len(backs)}")
    print("atlas px : %dx%d  %.0f Ko" % (px_atlas.shape[1], px_atlas.shape[0], len(px_data) / 1024))
    print("atlas hd : %dx%d  %.0f Ko" % (hd_atlas.shape[1], hd_atlas.shape[0], len(hd_data) / 1024))
    custom = sum(1 for (_, _, sub, _) in cards.values() if sub["custom"])
    if custom:
        print(f"dont {custom} sujet(s) fourni(s) dans assets/cardart/")

    if preview:
        os.makedirs(preview, exist_ok=True)
        for key, (series, pid, sub, r) in cards.items():
            W, H = 300, 420
            sc = Image.fromarray(r["scene"]).resize((W, H), Image.LANCZOS if r["scene_hd"] else Image.NEAREST)
            bx = r["box"]
            sp = Image.fromarray(r["subj"]).resize((max(1, round(bx[2] * W / 100)), max(1, round(bx[3] * H / 100))),
                                                   Image.LANCZOS if r["subj_hd"] else Image.NEAREST)
            sc.paste(sp, (round(bx[0] * W / 100), round(bx[1] * H / 100)), sp)
            sc.save(os.path.join(preview, key.replace(":", "_") + ".png"))


if __name__ == "__main__":
    main()
