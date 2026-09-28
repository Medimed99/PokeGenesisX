"""Atlas CHROMATIQUE. Assemble les sprites en un atlas PNG unique, encode en base64 dans src/_atlas_shiny.js.

Pourquoi un atlas embarque : certains environnements (iframe avec politique de
securite stricte) bloquent toute requete d'image externe. Un fichier HTML unique
doit donc porter ses propres sprites. 387 cellules de 64 px quantifiees tiennent
en ~354 Ko une fois encodees, contre ~2,2 Mo en fichiers separes.

Prerequis : sprites/g3/{1..386}.png (Emerald, 64x64) et sprites/g3s/474.png.
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
        im = Image.open("sprites/g3s/474.png").convert("RGBA")
        bb = im.getbbox()
        if bb: im = im.crop(bb)
        w, h = im.size
        sc = min(60/w, 60/h)
        im = im.resize((max(1, int(w*sc)), max(1, int(h*sc))), Image.NEAREST)
        cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        cell.paste(im, ((CELL-im.width)//2, (CELL-im.height)//2))
        im = cell
    else:
        im = Image.open(f"sprites/g3s/{i}.png").convert("RGBA")
    place(im)
for i in BACK:
    place(Image.open(f"sprites/g3bs/{i}.png").convert("RGBA"))

q = atlas.quantize(colors=192, method=Image.FASTOCTREE, dither=Image.NONE)
buf = io.BytesIO(); q.save(buf, "PNG", optimize=True)
data = buf.getvalue()

os.makedirs("build", exist_ok=True)
open("build/atlas_shiny.png", "wb").write(data)
b64 = base64.b64encode(data).decode()
open("src/_atlas_shiny.js", "w", encoding="utf-8").write(
    "/* Atlas CHROMATIQUE : meme disposition que l'atlas normal, cellule pour cellule.\n"
    "   Faces Emerald chromatiques, dos Rubis/Saphir chromatiques, Porygon-Z chromatique (BW).\n"
    "   Un sprite chromatique est donc le vrai sprite, pas un filtre pose sur le normal. */\n"
    f'const ATLAS_SHINY_URL="data:image/png;base64,{b64}";\n')
print(f"atlas chromatique : {len(data)/1024:.0f} Ko -> src/_atlas_shiny.js")
