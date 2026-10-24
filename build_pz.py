"""Porygon-Z, l'acteur principal des cinematiques : ses portraits et ses poses.

Source : PMDCollab / SpriteCollab (CC BY-NC 4.0 ; credits dans sprites/pz/*/credits.txt
et a l'ecran Credits du jeu). Les fichiers bruts sont ranges dans sprites/pz/ (dossier
ignore par git, comme tous les sprites bruts) : ce script ne touche pas au reseau.
Pour les retrouver, depuis le depot SpriteCollab (branche master), espece 0474 :
  portrait/0474/<Emotion>.png      -> sprites/pz/portrait/
  sprite/0474/<Pose>-Anim.png      -> sprites/pz/sprite/   (avec AnimData.xml et credits.txt)
Les sorties (src/_pzportrait.js, src/_pzanim.js) sont versionnees : le jeu se construit
sans ces fichiers bruts.

  src/_pzportrait.js   PZ_EMOS (17 humeurs), PZ_STRIP : la bande des portraits 40 x 40
  src/_pzanim.js       PZX : chaque pose en planche optimisee (8 directions), avec la
                       taille d'une image et la duree de chacune (images a 60 Hz)

Les poses servent a jouer la scene : se reveiller, sauter de joie, tourner sur
soi, se cabrer, avoir mal, se concentrer, dormir, rester couche, flotter.
"""
import base64, io, json, os, re
from PIL import Image

SRC = "sprites/pz"
# l'ordre des dix premieres humeurs ne change pas : les scenes existantes les citent par nom
EMOS = [("Normal", "Normal"), ("Happy", "Happy"), ("Joyous", "Joyous"), ("Determined", "Determined"),
        ("Worried", "Worried"), ("Sad", "Sad"), ("Angry", "Angry"), ("Surprised", "Surprised"),
        ("Stunned", "Stunned"), ("Pain", "Pain"),
        ("Crying", "Crying"), ("Shouting", "Shouting"), ("Teary", "Teary-Eyed"), ("Inspired", "Inspired"),
        ("Dizzy", "Dizzy"), ("Sigh", "Sigh"), ("Lucid", "Special0")]
# les poses : nom dans le jeu -> nom PMD
POSES = {"walk": "Walk", "idle": "Idle", "hurt": "Hurt", "charge": "Charge", "attack": "Attack",
         "shoot": "Shoot", "wake": "Wake", "hop": "Hop", "rotate": "Rotate", "sleep": "EventSleep",
         "laying": "Laying", "rearup": "RearUp", "float": "Float", "head": "Head", "swing": "Swing"}


def png_b64(im):
    buf = io.BytesIO()
    if im.mode == "P":
        im.save(buf, "PNG", optimize=True, transparency=im.info.get("transparency", 0))
    else:
        im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def quantize(im):
    """transparence nette puis palette : le pixel art n'a pas de demi-teintes"""
    im = im.convert("RGBA")
    a = im.getchannel("A").point(lambda v: 255 if v > 127 else 0)
    im.putalpha(a)
    p = im.quantize(colors=63, method=Image.FASTOCTREE)
    px, ap, trans = p.load(), a.load(), None
    for y in range(p.height):
        for x in range(p.width):
            if ap[x, y] == 0:
                trans = px[x, y]; break
        if trans is not None:
            break
    p.info["transparency"] = trans if trans is not None else 0
    return p


# --- les portraits ---
strip = Image.new("RGBA", (40 * len(EMOS), 40), (0, 0, 0, 0))
for i, (_, f) in enumerate(EMOS):
    strip.paste(Image.open(f"{SRC}/portrait/{f}.png").convert("RGBA"), (i * 40, 0))
open("src/_pzportrait.js", "w", encoding="utf-8").write(
    "/* Portraits expressifs de Porygon-Z, depot communautaire PMDCollab/SpriteCollab.\n"
    "   Licence CC BY-NC 4.0 : usage non commercial avec attribution (ecran Credits).\n"
    "   Embarques pour fonctionner sans reseau, comme l\"atlas de sprites. (build_pz.py) */\n"
    f"const PZ_EMOS = {json.dumps([e for e, _ in EMOS], ensure_ascii=False)};\n"
    "const PZ_W = 40, PZ_H = 40;\n"
    f'const PZ_STRIP = "{png_b64(strip)}";\n')

# --- les poses ---
xml = open(f"{SRC}/sprite/AnimData.xml", encoding="utf-8").read()
anims = {}
for m in re.finditer(r"<Anim>(.*?)</Anim>", xml, re.S):
    body = m.group(1)
    name = re.search(r"<Name>(\w+)</Name>", body).group(1)
    anims[name] = body
out, total = {}, 0
for key, pmd in POSES.items():
    body = anims[pmd]
    cp = re.search(r"<CopyOf>(\w+)</CopyOf>", body)
    if cp:
        body = anims[cp.group(1)]
    fw = int(re.search(r"<FrameWidth>(\d+)", body).group(1))
    fh = int(re.search(r"<FrameHeight>(\d+)", body).group(1))
    dur = [int(d) for d in re.findall(r"<Duration>(\d+)</Duration>", body)]
    im = quantize(Image.open(f"{SRC}/sprite/{pmd}-Anim.png"))
    cols, rows = im.width // fw, im.height // fh
    u = png_b64(im)
    total += len(u)
    out[key] = {"u": u, "fw": fw, "fh": fh, "n": cols, "rows": rows, "dur": dur[:cols] or [8] * cols}
open("src/_pzanim.js", "w", encoding="utf-8").write(
    "/* Les poses de Porygon-Z pour la mise en scene (PMDCollab/SpriteCollab, CC BY-NC 4.0).\n"
    "   Chaque planche : 8 rangees (bas, bas-droite, droite, haut-droite, haut, haut-gauche,\n"
    "   gauche, bas-gauche), n images de fw x fh, durees en images a 60 Hz. (build_pz.py) */\n"
    "const PZX = " + json.dumps(out, separators=(",", ":")) + ";\n")
print(f"portraits : {len(EMOS)} humeurs ; poses : {len(out)} planches, {total // 1024} Ko")
