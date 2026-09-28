"""Assemble les illustrations de cartes en un atlas unique.

Chaque legendaire des trois premieres generations existe en plusieurs
illustrations, une par generation ou il est apparu. Plus l'illustration est
ancienne, plus elle est rare : seuls quatre legendaires ont une illustration
Rouge/Bleu, ce qui en fait naturellement les pieces de prestige.
"""
from PIL import Image
import base64, io, json, os, math

CELL, COLS = 96, 9
legs = json.load(open("/tmp/legs.json")) if os.path.exists("/tmp/legs.json") else []
if not legs:                                   # repli : relit le blob du Pokedex
    blob = open("src/pokedex.blob", encoding="utf-8").read().strip().split("\n")
    legs = [int(l.split("|")[0]) for l in blob if l.split("|")[-1] != "0"]

# de la plus commune a la plus rare
SERIES = [
    ("art", "Standard",     "other/official-artwork"),
    ("g5",  "Holographique", "generation-v"),
    ("g3",  "Corrompue",     "generation-iii"),
    ("g2",  "Originelle",    "generation-ii"),
    ("g1",  "Primordiale",   "generation-i"),
]

def source(series, pid):
    """Une illustration deposee dans assets/cardart/ prime sur celle du depot.

    C'est le point d'entree prevu pour substituer une illustration commandee
    ou produite ailleurs : deposer assets/cardart/g3_150.png, relancer ce
    script, et la carte l'utilise sans aucune modification de code.
    """
    custom = f"assets/cardart/{series}_{pid}.png"
    if os.path.exists(custom) and os.path.getsize(custom) > 500:
        return custom
    if series == "g3":
        p = f"sprites/g3/{pid}.png"
    else:
        p = f"sprites/cards/{series}_{pid}.png"
    if not os.path.exists(p) or os.path.getsize(p) <= 500:
        return None
    return p

cells, manifest, custom_n = [], {}, 0
for series, _label, _src in SERIES:
    for pid in legs:
        p = source(series, pid)
        if not p:
            continue
        manifest[f"{series}:{pid}"] = len(cells)
        cells.append((p, series))
        if p.startswith("assets/"):
            custom_n += 1

ROWS = max(1, math.ceil(len(cells) / COLS))
atlas = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))

for n, (path, series) in enumerate(cells):
    im = Image.open(path).convert("RGBA")
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    # l'illustration officielle est lissee, les sprites restent nets
    custom = path.startswith("assets/")
    resample = Image.LANCZOS if (series == "art" or custom) else Image.NEAREST
    scale = min((CELL - 6) / im.width, (CELL - 6) / im.height)
    if series != "art" and not custom:
        scale = max(1, math.floor(scale))       # pas de demi-pixel sur un sprite
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), resample)
    if im.width > CELL or im.height > CELL:
        im.thumbnail((CELL, CELL), resample)
    atlas.paste(im, ((n % COLS) * CELL + (CELL - im.width) // 2,
                     (n // COLS) * CELL + (CELL - im.height) // 2), im)

q = atlas.quantize(colors=224, method=Image.FASTOCTREE, dither=Image.NONE)
buf = io.BytesIO(); q.save(buf, "PNG", optimize=True)
data = buf.getvalue()
os.makedirs("build", exist_ok=True)
open("build/cardart.png", "wb").write(data)

b64 = base64.b64encode(data).decode()
series_js = json.dumps([{"k": k, "n": n} for k, n, _ in SERIES], ensure_ascii=False)
open("src/_cardart.js", "w", encoding="utf-8").write(
    "/* Illustrations de cartes : une par generation d'apparition de chaque\n"
    "   legendaire. Plus l'illustration est ancienne, plus elle est rare. */\n"
    f"const CARD_COLS={COLS}, CARD_ROWS={ROWS}, CARD_CELL={CELL};\n"
    f"const CARD_SERIES={series_js};\n"
    f"const CARD_INDEX={json.dumps(manifest)};\n"
    f'const CARD_ATLAS="data:image/png;base64,{b64}";\n')

print(f"{len(cells)} illustrations, grille {COLS}x{ROWS}"
      + (f" — dont {custom_n} fournie(s) dans assets/cardart/" if custom_n else ""))
for k, n, _ in SERIES:
    c = sum(1 for key in manifest if key.startswith(k + ":"))
    print(f"  {n:<14} {c:>2} cartes")
print("atlas : %.0f Ko -> base64 %.0f Ko" % (len(data) / 1024, len(b64) / 1024))
