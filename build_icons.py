"""Icones de l'application installee (PWA).

Chrome n'offre l'installation qu'avec de vraies icones carrees (192 et 512 px) ;
l'iPhone utilise l'apple-touch-icon (180 px) pour l'ecran d'accueil. Les fichiers
sont ecrits dans assets/icons et versionnes : la construction sur Vercel n'a
qu'a les copier, sans dependre de Pillow.
"""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT = "assets/icons"
os.makedirs(OUT, exist_ok=True)
pz = Image.open("sprites/bw/474.png").convert("RGBA")
bb = pz.getbbox()
if bb: pz = pz.crop(bb)

def icon(size, safe, ring=True):
    im = Image.new("RGBA", (size, size), (4, 6, 11, 255))
    # fond : halo cyan au centre, comme l'archive qui s'allume
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    r = int(size * 0.42)
    g.ellipse((size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r), fill=(20, 70, 90, 255))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.12))
    im.alpha_composite(glow)
    d = ImageDraw.Draw(im)
    if ring:
        rr = int(size * safe * 0.5)
        w = max(2, size // 64)
        d.ellipse((size // 2 - rr, size // 2 - rr, size // 2 + rr, size // 2 + rr), outline=(53, 240, 214, 255), width=w)
    # Porygon-Z, agrandi sans lissage : le pixel art doit rester net
    target = int(size * safe * 0.78)
    k = target / max(pz.size)
    sp = pz.resize((max(1, round(pz.width * k)), max(1, round(pz.height * k))), Image.NEAREST)
    im.alpha_composite(sp, ((size - sp.width) // 2, (size - sp.height) // 2))
    return im.convert("RGB")

icon(192, 0.86).save(f"{OUT}/icon-192.png", optimize=True)
icon(512, 0.86).save(f"{OUT}/icon-512.png", optimize=True)
# « maskable » : Android peut decouper l'icone en cercle ou en goutte ;
# le motif doit tenir dans la zone sure centrale (80 %)
icon(512, 0.66).save(f"{OUT}/icon-maskable-512.png", optimize=True)
icon(180, 0.86).save(f"{OUT}/apple-touch-icon.png", optimize=True)
for f in sorted(os.listdir(OUT)):
    print(f"  {f}  {os.path.getsize(os.path.join(OUT, f)) // 1024 or 1} Ko")
