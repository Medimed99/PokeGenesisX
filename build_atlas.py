"""Assemble les sprites en un atlas PNG unique, encode en base64 dans src/_atlas.js.

Pourquoi un atlas embarque : certains environnements (iframe avec politique de
securite stricte) bloquent toute requete d'image externe. Un fichier HTML unique
doit donc porter ses propres sprites. 387 cellules de 64 px quantifiees tiennent
en ~354 Ko une fois encodees, contre ~2,2 Mo en fichiers separes.

Prerequis : sprites/g3/{1..386}.png (Emerald, 64x64) et sprites/bw/474.png.
"""
from PIL import Image
import base64, io, os

CELL, COLS = 64, 28
FRONT = list(range(1, 387)) + [474]        # 386 especes + Porygon-Z (le guide)
BACK  = list(range(1, 387))                # vues de dos, pour le Pokemon du joueur en combat
TOTAL = len(FRONT) + len(BACK)
ROWS  = -(-TOTAL // COLS)

atlas = Image.new("RGBA", (COLS*CELL, ROWS*CELL), (0, 0, 0, 0))
n = 0
def place(im):
    global n
    atlas.paste(im, ((n % COLS)*CELL, (n // COLS)*CELL))
    n += 1
for i in FRONT:
    if i == 474:                            # absent de Emerald : on adapte le sprite BW
        im = Image.open("sprites/bw/474.png").convert("RGBA")
        bb = im.getbbox()
        if bb: im = im.crop(bb)
        w, h = im.size
        sc = min(60/w, 60/h)
        im = im.resize((max(1, int(w*sc)), max(1, int(h*sc))), Image.NEAREST)
        cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        cell.paste(im, ((CELL-im.width)//2, (CELL-im.height)//2))
        im = cell
    else:
        im = Image.open(f"sprites/g3/{i}.png").convert("RGBA")
    place(im)
for i in BACK:
    place(Image.open(f"sprites/g3b/{i}.png").convert("RGBA"))

q = atlas.quantize(colors=192, method=Image.FASTOCTREE, dither=Image.NONE)
buf = io.BytesIO(); q.save(buf, "PNG", optimize=True)
data = buf.getvalue()

os.makedirs("build", exist_ok=True)
open("build/atlas.png", "wb").write(data)
b64 = base64.b64encode(data).decode()
open("src/_atlas.js", "w", encoding="utf-8").write(
    f"/* Atlas de sprites embarque : {TOTAL} cellules de 64px, grille {COLS}x{ROWS}.\n"
    "   Faces puis dos. Sprites Pokemon Emerald (GBA) + Porygon-Z. Embarque pour\n"
    "   fonctionner meme quand le reseau externe est bloque. */\n"
    f"const ATLAS_COLS={COLS}, ATLAS_ROWS={ROWS}, ATLAS_N={TOTAL}, ATLAS_BACK0={len(FRONT)};\n"
    f'const ATLAS_URL="data:image/png;base64,{b64}";\n')
print(f"atlas : {len(data)/1024:.0f} Ko -> src/_atlas.js ({len(b64)/1024:.0f} Ko en base64)")
