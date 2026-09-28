"""Sprites de marche de Pokemon Donjon Mystere (PMDCollab / SpriteCollab).

Chaque planche : 8 rangees (les 8 directions), N colonnes (images d'animation).
Ordre des rangees PMD : bas, bas-droite, droite, haut-droite, haut, haut-gauche,
gauche, bas-gauche. Les planches sont optimisees (palette, transparence nette)
puis ecrites dans assets/pmd/<id>.png ; leurs dimensions et leur rythme dans
src/_pmd.js. La version en ligne les charge a la demande, espece par espece.
Licence des sprites : CC BY-NC 4.0, credits a leurs artistes (voir le README).
"""
import os, re, json
from PIL import Image
SRC, OUT = "sprites/pmd_raw", "assets/pmd"
os.makedirs(OUT, exist_ok=True)
meta, total = {}, 0
for i in range(1, 387):
    xml = open(f"{SRC}/{i}.xml", encoding="utf-8").read()
    m = re.search(r"<Name>Walk</Name>(.*?)</Anim>", xml, re.S)
    body = m.group(1)
    copy = re.search(r"<CopyOf>(\w+)</CopyOf>", body)
    if copy:
        m = re.search(r"<Name>%s</Name>(.*?)</Anim>" % copy.group(1), xml, re.S); body = m.group(1)
    fw = int(re.search(r"<FrameWidth>(\d+)", body).group(1))
    fh = int(re.search(r"<FrameHeight>(\d+)", body).group(1))
    dur = [int(x) for x in re.findall(r"<Duration>(\d+)</Duration>", body)]
    im = Image.open(f"{SRC}/{i}-walk.png").convert("RGBA")
    cols, rows = im.width // fw, im.height // fh
    if rows != 8:
        print("  espèce", i, ": planche inattendue", im.size, fw, fh); continue
    # transparence nette puis palette : le pixel art n'a pas de demi-teintes
    a = im.getchannel("A").point(lambda v: 255 if v > 127 else 0)
    im.putalpha(a)
    p = im.quantize(colors=63, method=Image.FASTOCTREE)
    # l'index transparent : celui des pixels dont l'alpha est nul
    trans = None
    px, ap = p.load(), a.load()
    for y in range(p.height):
        for x in range(p.width):
            if ap[x, y] == 0: trans = px[x, y]; break
        if trans is not None: break
    path = f"{OUT}/{i}.png"
    p.save(path, optimize=True, transparency=trans if trans is not None else 0)
    total += os.path.getsize(path)
    meta[i] = [fw, fh, cols, dur[:cols] or [8] * cols]
open("src/_pmd.js", "w", encoding="utf-8").write(
    "/* Sprites de marche PMD (PMDCollab/SpriteCollab, CC BY-NC 4.0) : largeur et hauteur\n"
    "   d'une image, nombre d'images, durees (en images a 60 Hz). Rangees : bas, bas-droite,\n"
    "   droite, haut-droite, haut, haut-gauche, gauche, bas-gauche. */\n"
    "const PMD_META = " + json.dumps(meta, separators=(",", ":")) + ";\n")
import base64
open("src/_pmdimg.js", "w", encoding="utf-8").write(
    "/* Planches PMD embarquees pour la version autonome (fichier ouvert localement : le navigateur\n"
    "   refuserait de recolorer une image locale). La version en ligne les charge a la demande. */\n"
    "const PMD_IMG = {" + ",".join(f'{i}:"data:image/png;base64,' + base64.b64encode(open(f"{OUT}/{i}.png","rb").read()).decode() + '"' for i in sorted(meta)) + "};\n")
print(f"{len(meta)} planches · {total // 1024} Ko au total · {total // 1024 // max(1, len(meta))} Ko en moyenne")
