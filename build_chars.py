"""Dessine les deux visuels non-Pokemon du jeu en pixel art, puis les embarque.

Prof. Racine est un personnage original : aucun sprite officiel n'existe, il
faut donc le dessiner. Le rendu vise le cadrage 40x40 des portraits PMD pour
rester coherent avec ceux de Porygon-Z.

MissingNo est une citation : colonne de tuiles non resolues, comme la
silhouette qu'affichait le jeu d'origine quand il lisait une definition vide.
"""
from PIL import Image, ImageDraw
import base64, io, random

# ---------------------------------------------------------------- palette
P = {
    "out":  (20, 16, 12, 255),
    "hair1":(214, 220, 228, 255), "hair2":(168, 178, 190, 255), "hair3":(120, 131, 145, 255),
    "sk1":  (247, 219, 184, 255), "sk2":  (224, 187, 146, 255), "sk3":  (189, 146, 104, 255),
    "gl":   (28, 34, 42, 255),    "lens": (126, 240, 222, 255), "lens2":(46, 150, 138, 255),
    "coat1":(248, 251, 253, 255), "coat2":(214, 222, 232, 255), "coat3":(170, 182, 198, 255),
    "cyan": (53, 240, 214, 255),  "brow": (138, 106, 76, 255),
    "bg":   (16, 26, 44, 255),    "bg2":  (11, 18, 32, 255),
    "mag":  (255, 61, 127, 255),  "vio":  (139, 92, 246, 255),
}

def prof_portrait():
    im = Image.new("RGBA", (40, 40), P["bg2"])
    d = ImageDraw.Draw(im)
    d.rectangle([2, 2, 37, 37], fill=P["bg"])

    # --- buste et blouse ---------------------------------------------------
    d.polygon([(6, 39), (9, 30), (30, 30), (33, 39)], fill=P["coat1"])
    d.polygon([(6, 39), (9, 30), (14, 30), (11, 39)], fill=P["coat2"])
    d.polygon([(33, 39), (30, 30), (25, 30), (28, 39)], fill=P["coat2"])
    d.polygon([(16, 30), (23, 30), (21, 39), (18, 39)], fill=P["coat3"])   # ouverture
    d.polygon([(17, 31), (22, 31), (21, 35), (18, 35)], fill=P["cyan"])    # badge
    d.line([(13, 31), (17, 36)], fill=P["coat3"])
    d.line([(26, 31), (22, 36)], fill=P["coat3"])

    # --- cou ---------------------------------------------------------------
    d.rectangle([16, 27, 23, 31], fill=P["sk3"])
    d.rectangle([16, 27, 23, 29], fill=P["sk2"])

    # --- visage ------------------------------------------------------------
    d.ellipse([10, 7, 29, 29], fill=P["sk1"])
    d.ellipse([10, 7, 29, 29], outline=P["out"])
    d.ellipse([10, 18, 29, 29], fill=P["sk1"])
    d.pieslice([10, 7, 29, 29], 20, 160, fill=P["sk2"])       # ombre sous le menton
    d.ellipse([11, 8, 28, 26], fill=P["sk1"])
    d.rectangle([9, 15, 11, 20], fill=P["sk2"])               # oreilles
    d.rectangle([28, 15, 30, 20], fill=P["sk2"])

    # --- cheveux -----------------------------------------------------------
    d.pieslice([8, 3, 31, 24], 180, 360, fill=P["hair2"])
    d.pieslice([8, 3, 31, 22], 180, 360, fill=P["hair1"])
    d.rectangle([8, 12, 11, 21], fill=P["hair2"])
    d.rectangle([28, 12, 31, 21], fill=P["hair2"])
    d.rectangle([8, 18, 10, 22], fill=P["hair3"])
    d.rectangle([29, 18, 31, 22], fill=P["hair3"])
    d.line([(13, 6), (18, 4)], fill=P["hair1"])
    d.line([(22, 4), (27, 7)], fill=P["hair1"])

    # --- lunettes ----------------------------------------------------------
    d.rectangle([10, 15, 18, 21], fill=P["gl"])
    d.rectangle([21, 15, 29, 21], fill=P["gl"])
    d.rectangle([11, 16, 17, 20], fill=P["lens"])
    d.rectangle([22, 16, 28, 20], fill=P["lens"])
    d.rectangle([11, 19, 17, 20], fill=P["lens2"])
    d.rectangle([22, 19, 28, 20], fill=P["lens2"])
    d.line([(18, 17), (21, 17)], fill=P["gl"])
    d.line([(9, 16), (10, 17)], fill=P["gl"])
    d.line([(30, 16), (29, 17)], fill=P["gl"])

    # --- traits ------------------------------------------------------------
    d.line([(12, 13), (17, 12)], fill=P["brow"])
    d.line([(22, 12), (27, 13)], fill=P["brow"])
    d.rectangle([19, 22, 20, 23], fill=P["sk3"])              # nez
    d.line([(16, 25), (23, 25)], fill=P["brow"])              # bouche
    d.point((16, 24), fill=P["brow"]); d.point((23, 24), fill=P["brow"])

    # --- il commence deja a se desagreger ----------------------------------
    for (x, y, w, h, c) in [(2, 11, 4, 2, P["mag"]), (34, 19, 4, 2, P["vio"]),
                            (3, 24, 3, 2, P["mag"]), (35, 9, 3, 2, P["cyan"]),
                            (30, 33, 4, 2, P["vio"]), (5, 34, 3, 2, P["cyan"])]:
        d.rectangle([x, y, x + w, y + h], fill=c)
    d.rectangle([24, 14, 27, 15], fill=P["mag"])              # une lentille decroche
    return im


def missingno():
    """Une fêlure verticale dans l'image : on ne voit que ses bords, cyan à gauche,
    magenta à droite. C'est l'image de secours : le jeu dessine la même au moment
    voulu, avec le nom du joueur à peine visible au fond, et la fait respirer
    (src/37-cine.js, mnCrackCanvas)."""
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    px = im.load()
    rnd = random.Random(387)
    W, O = 56, 4                                               # la fêlure tient dans 56 px, centrée
    mask = [[False] * W for _ in range(W)]
    knots = [(1, 31), (7, 27), (13, 33), (21, 24), (27, 31), (33, 26), (41, 33), (48, 26), (55, 29)]
    def cx_at(y):
        for (y0, x0), (y1, x1) in zip(knots, knots[1:]):
            if y0 <= y <= y1:
                return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
        return 28
    for y in range(1, 55):
        t = (y - 1) / 54.0
        w = 0.6 + 9.5 * (4 * t * (1 - t)) ** 1.1 + rnd.choice([-1, 0, 0, 1]) * 0.7
        c = cx_at(y)
        for x in range(int(round(c - w)), int(round(c + w)) + 1):
            if 0 <= x < W:
                mask[y][x] = True
    for (x, y, w, h) in [(13, 14, 2, 2), (41, 19, 3, 2), (14, 37, 2, 3), (40, 44, 2, 2)]:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                mask[yy][xx] = True
    on = lambda x, y: 0 <= x < W and 0 <= y < W and mask[y][x]
    for y in range(W):
        for x in range(W):
            if not on(x, y):
                continue
            if not on(x - 1, y):
                c = (53, 240, 214, 255)
            elif not on(x + 1, y):
                c = (255, 61, 127, 255)
            elif not on(x, y - 1) or not on(x, y + 1):
                c = (58, 48, 88, 255)
            else:
                c = (20, 13, 38, 255) if y % 3 else (29, 20, 53, 255)
            px[x + O, y + O] = c
    return im


def embed(img, ncol=64):
    q = img.quantize(colors=ncol, method=Image.FASTOCTREE, dither=Image.NONE)
    b = io.BytesIO(); q.save(b, "PNG", optimize=True)
    return base64.b64encode(b.getvalue()).decode(), len(b.getvalue())


import os

def load_or_draw(path, draw_fn, box, maxbox=128):
    """Un fichier depose dans assets/ prime toujours sur le dessin de secours.

    C'est le point d'entree prevu pour substituer un sprite officiel : deposer
    assets/prof.png ou assets/missingno.png, relancer ce script, et le jeu
    l'utilise sans aucune modification de code.
    """
    if os.path.exists(path):
        im = Image.open(path).convert("RGBA")
        bb = im.getbbox()                              # marges vides retirees
        if bb: im = im.crop(bb)
        # un fichier fourni garde sa finesse jusqu'a maxbox pixels : le reduire
        # a la taille du dessin de secours (40 px) detruirait son detail
        side = min(max(im.size), maxbox)
        if max(im.size) > maxbox:
            im.thumbnail((maxbox, maxbox), Image.NEAREST)
        c = Image.new("RGBA", (side, side), (0, 0, 0, 0))   # carre, sans deformation
        c.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
        im = c
        print("  %s : fichier fourni utilise (%dx%d)" % (path, im.width, im.height))
        return im, True
    return draw_fn(), False

prof_img,  prof_custom = load_or_draw("assets/prof.png", prof_portrait, 40)
miss_img,  miss_custom = load_or_draw("assets/missingno.png", missingno, 64)
prof, n1 = embed(prof_img, 64 if prof_custom else 48)
miss, n2 = embed(miss_img, 64 if miss_custom else 32)
# --- sprite du professeur EN PIED, facultatif ----------------------------
# Deposer assets/prof_full.png (fond transparent). Les proportions sont gardees :
# un sprite en pied est plus haut que large, on ne le force pas dans un carre.
prof_full = ""
if os.path.exists("assets/prof_full.png"):
    im = Image.open("assets/prof_full.png").convert("RGBA")
    bbox = im.getbbox()                      # on retire les marges vides
    if bbox: im = im.crop(bbox)
    if im.height > 160:                       # plafond raisonnable, sans lissage
        r = 160 / im.height
        im = im.resize((max(1, round(im.width * r)), 160), Image.NEAREST)
    import io
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    prof_full = base64.b64encode(buf.getvalue()).decode()
    print("  assets/prof_full.png : sprite en pied utilise (%dx%d)" % (im.width, im.height))

open("src/_chars.js", "w", encoding="utf-8").write(
    "/* Visuels non-Pokemon dessines pour le jeu (voir build_chars.py).\n"
    "   Prof. Racine est un personnage original ; MissingNo est une citation\n"
    "   de la silhouette affichee par le jeu d'origine sur une definition vide. */\n"
    f'const PROF_PORTRAIT = "data:image/png;base64,{prof}";\n'
    f'const MISSING_SPRITE = "data:image/png;base64,{miss}";\n'
    + (f'const PROF_FULL = "data:image/png;base64,{prof_full}";\n' if prof_full
       else 'const PROF_FULL = "";   /* deposer assets/prof_full.png pour un professeur en pied */\n'))
print("prof %d o%s | missingno %d o%s | total base64 %.1f Ko"
      % (n1, " (fourni)" if prof_custom else " (dessine)",
         n2, " (fourni)" if miss_custom else " (dessine)",
         (len(prof) + len(miss)) / 1024))
