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
    """Colonne de tuiles non resolues. Motif deterministe, pas du bruit."""
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rnd = random.Random(4741)
    cols = [(255, 61, 127, 255), (139, 92, 246, 255), (53, 240, 214, 255), (26, 15, 46, 255)]

    d.rectangle([0, 0, 63, 63], fill=(10, 7, 19, 255))
    for y in range(2, 63, 3):                                  # lignes de balayage
        d.line([(0, y), (63, y)], fill=(42, 27, 70, 255))

    # corps : barres horizontales decalees, largeur decroissante par blocs
    bars = [(12, 8, 40, 5), (6, 14, 50, 4), (16, 19, 34, 6), (4, 26, 54, 5),
            (14, 32, 38, 4), (8, 37, 46, 6), (18, 44, 30, 4), (10, 49, 42, 5),
            (20, 55, 24, 4)]
    for i, (x, y, w, h) in enumerate(bars):
        d.rectangle([x, y, x + w, y + h], fill=cols[i % 3])
        # decalage caracteristique : un morceau glisse d'un cran
        d.rectangle([x + 4, y + h, x + 4 + w // 3, y + h + 1], fill=cols[(i + 1) % 3])

    # fragments detaches : ce qui deborde de la definition
    for _ in range(16):
        x, y = rnd.randrange(0, 60), rnd.randrange(0, 60)
        d.rectangle([x, y, x + 3, y + 2], fill=cols[rnd.randrange(0, 3)])

    # noyau instable
    d.rectangle([25, 28, 38, 37], fill=(255, 255, 255, 245))
    d.rectangle([28, 31, 35, 34], fill=cols[0])
    d.rectangle([25, 28, 38, 29], fill=cols[2])
    return im


def embed(img, ncol=64):
    q = img.quantize(colors=ncol, method=Image.FASTOCTREE, dither=Image.NONE)
    b = io.BytesIO(); q.save(b, "PNG", optimize=True)
    return base64.b64encode(b.getvalue()).decode(), len(b.getvalue())


import os

def load_or_draw(path, draw_fn, box):
    """Un fichier depose dans assets/ prime toujours sur le dessin de secours.

    C'est le point d'entree prevu pour substituer un sprite officiel : deposer
    assets/prof.png ou assets/missingno.png, relancer ce script, et le jeu
    l'utilise sans aucune modification de code.
    """
    if os.path.exists(path):
        im = Image.open(path).convert("RGBA")
        if im.size != (box, box):                      # recadrage sans deformation
            im.thumbnail((box, box), Image.NEAREST)
            c = Image.new("RGBA", (box, box), (0, 0, 0, 0))
            c.paste(im, ((box - im.width) // 2, (box - im.height) // 2))
            im = c
        print("  %s : fichier fourni utilise (%dx%d)" % (path, im.width, im.height))
        return im, True
    return draw_fn(), False

prof_img,  prof_custom = load_or_draw("assets/prof.png", prof_portrait, 40)
miss_img,  miss_custom = load_or_draw("assets/missingno.png", missingno, 64)
prof, n1 = embed(prof_img, 64 if prof_custom else 48)
miss, n2 = embed(miss_img, 64 if miss_custom else 32)
open("src/_chars.js", "w", encoding="utf-8").write(
    "/* Visuels non-Pokemon dessines pour le jeu (voir build_chars.py).\n"
    "   Prof. Racine est un personnage original ; MissingNo est une citation\n"
    "   de la silhouette affichee par le jeu d'origine sur une definition vide. */\n"
    f'const PROF_PORTRAIT = "data:image/png;base64,{prof}";\n'
    f'const MISSING_SPRITE = "data:image/png;base64,{miss}";\n')
print("prof %d o%s | missingno %d o%s | total base64 %.1f Ko"
      % (n1, " (fourni)" if prof_custom else " (dessine)",
         n2, " (fourni)" if miss_custom else " (dessine)",
         (len(prof) + len(miss)) / 1024))
