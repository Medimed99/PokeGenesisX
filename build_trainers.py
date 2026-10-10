#!/usr/bin/env python3
"""Sprites de dresseurs (portraits de face, 64x64) pour la carte d'Expédition.

Source : décompilations pret/pokefirered (graphics/trainers/front_pics), images
© Nintendo / Creatures / GAME FREAK — même statut que les autres sprites du jeu.

Usage : python3 build_trainers.py <dossier front_pics de pokefirered>
Écrit src/_trainers.js : un atlas PNG embarqué, l'index des classes, et la
correspondance type -> classe (un dresseur de type Feu a toujours le même visage).
"""
import sys, base64, io, os, json
from PIL import Image

FRLG = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/ext/frlg"
SRC = os.path.join(FRLG, "graphics/trainers/front_pics")

# une classe par type : on reconnaît le type au premier coup d'œil, comme dans les jeux
TYPE_CLASS = {
    1: "youngster", 2: "black_belt", 3: "bird_keeper", 4: "juggler", 5: "ruin_maniac",
    6: "hiker", 7: "bug_catcher", 8: "channeler", 9: "engineer", 10: "kindler",
    11: "swimmer_m", 12: "aroma_lady", 13: "rocker", 14: "psychic_m", 15: "expert_f",
    16: "dragon_tamer", 17: "burglar", 18: "beauty",
}
EXTRA = ["cool_trainer_m", "cool_trainer_f", "scientist", "gentleman"]

# les champions de secteur : portrait, sprite de carte, type, nom francais
LEADERS = [
    ("brock", "leader_brock", 6, "Pierre"), ("misty", "leader_misty", 11, "Ondine"),
    ("lt_surge", "leader_lt_surge", 13, "Major Bob"), ("erika", "leader_erika", 12, "Erika"),
    ("koga", "leader_koga", 4, "Koga"), ("sabrina", "leader_sabrina", 14, "Morgane"),
    ("blaine", "leader_blaine", 10, "Auguste"), ("giovanni", "leader_giovanni", 5, "Giovanni"),
    ("lance", "elite_four_lance", 16, "Peter"), ("agatha", "elite_four_agatha", 8, "Agatha"),
    ("lorelei", "elite_four_lorelei", 15, "Olga"), ("bruno", "elite_four_bruno", 2, "Aldo"),
]
EXTRA += [l[1] for l in LEADERS]

# sprites de carte (vue de dessus, 16x32) : une silhouette par type, comme dans les jeux
OW_TYPE = {
    1: "youngster", 2: "black_belt", 3: "boy", 4: "rocket_m", 5: "worker_m", 6: "hiker",
    7: "bug_catcher", 8: "channeler", 9: "scientist", 10: "camper", 11: "fisher", 12: "picnicker",
    13: "rocker", 14: "woman_2", 15: "lass", 16: "gentleman", 17: "rocket_f", 18: "beauty",
}
OW_EXTRA = ["cooltrainer_m", "cooltrainer_f"] + [l[0] for l in LEADERS]

classes = []
for k in list(TYPE_CLASS.values()) + EXTRA:
    if k not in classes:
        classes.append(k)

CELL = 64
atlas = Image.new("RGBA", (CELL * len(classes), CELL), (0, 0, 0, 0))
for i, k in enumerate(classes):
    im = Image.open(os.path.join(SRC, k + "_front_pic.png"))
    # l'index 0 de la palette est le fond
    if im.mode == "P":
        im = im.convert("RGBA") if "transparency" in im.info else im
        rgba = Image.open(os.path.join(SRC, k + "_front_pic.png"))
        px = rgba.load()
        out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
        pal = rgba.getpalette()
        op = out.load()
        for y in range(rgba.size[1]):
            for x in range(rgba.size[0]):
                v = px[x, y]
                if v != 0:
                    op[x, y] = (pal[v * 3], pal[v * 3 + 1], pal[v * 3 + 2], 255)
        im = out
    atlas.paste(im.crop((0, 0, CELL, CELL)), (i * CELL, 0))

# ---------- sprites de carte ----------
import re
info = open(os.path.join(FRLG, "src/data/object_events/object_event_graphics_info.h")).read()
pal_of = {}
for m in re.finditer(r'gObjectEventGraphicsInfo_(\w+) = \{(.*?)\};', info, re.S):
    snake = re.sub(r'(?<!^)(?=[A-Z])', '_', m.group(1)).lower()
    snake = re.sub(r'_(\d)', r'_\1', snake)
    pal_of[snake] = re.search(r'paletteTag = OBJ_EVENT_PAL_TAG_(\w+)', m.group(2)).group(1).lower()
def jasc(path):
    L = open(path).read().split()
    n = int(L[2]); return [tuple(int(v) for v in L[3 + i * 3:6 + i * 3]) for i in range(n)]
ow = []
for k in list(OW_TYPE.values()) + OW_EXTRA:
    if k not in ow: ow.append(k)
OWW, OWH = 16, 32
ow_atlas = Image.new("RGBA", (OWW * len(ow), OWH), (0, 0, 0, 0))
for i, k in enumerate(ow):
    im = Image.open(os.path.join(FRLG, "graphics/object_events/pics/people", k + ".png"))
    tag = pal_of.get(k) or pal_of.get(k.replace("_", "")) or "npc_white"
    pal = jasc(os.path.join(FRLG, "graphics/object_events/palettes", tag + ".pal"))
    px = im.load()
    for y in range(OWH):
        for x in range(OWW):
            v = px[x, y]
            if v: ow_atlas.putpixel((i * OWW + x, y), pal[v] + (255,))
ob = io.BytesIO(); ow_atlas.save(ob, "PNG", optimize=True)
ow_b64 = base64.b64encode(ob.getvalue()).decode()

buf = io.BytesIO()
atlas.save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()

js = f"""/* Portraits de dresseurs (pret/pokefirered, © Nintendo / Creatures / GAME FREAK).
   Généré par build_trainers.py — ne pas modifier à la main. */
const TRAINER_CELL = {CELL};
const TRAINER_CLASSES = {json.dumps(classes)};
const TRAINER_TYPE_CLASS = {json.dumps({str(k): v for k, v in TYPE_CLASS.items()})};
const TRAINER_ATLAS = "data:image/png;base64,{b64}";
const OW_CLASSES = {json.dumps(ow)};
const OW_TYPE_CLASS = {json.dumps({str(k): v for k, v in OW_TYPE.items()})};
const OW_ATLAS = "data:image/png;base64,{ow_b64}";
/* champions de secteur : [carte, portrait, type, nom] */
const LEADERS = {json.dumps([list(l) for l in LEADERS], ensure_ascii=False)};
"""
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "_trainers.js"), "w", encoding="utf8").write(js)
print(f"{len(ow)} sprites de carte, {len(classes)} classes, atlas {atlas.size}, {len(buf.getvalue())} octets")
