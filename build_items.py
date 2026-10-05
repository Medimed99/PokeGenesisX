"""Atlas des icones d'objets.

Sprites officiels : depot communautaire PokeAPI/sprites (sprites/items), les memes
sources que les sprites de Pokemon du jeu. Les objets propres a Code Genesis
(Data Ball, Archives, Cable Link, Boussole felee, Module d'attraction, Bouclier
Data) n'ont pas d'equivalent officiel : ils sont dessines ici, en pixel art
original, dans le meme style (contour sombre, trois tons).
Sortie : assets/items.png, src/_items.js (index + image embarquee).
"""
import os, io, base64, json, urllib.request
from PIL import Image, ImageDraw

BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/"
CACHE = "sprites/items"
os.makedirs(CACHE, exist_ok=True)

OFFICIAL = {
  # Balls
  "ball:poke":"poke-ball", "ball:super":"great-ball", "ball:hyper":"ultra-ball", "ball:master":"master-ball", "ball:safari":"safari-ball",
  # baies
  "berry:framby":"razz-berry", "berry:nanab":"nanab-berry", "berry:nigma":"enigma-berry", "berry:sitrus":"sitrus-berry", "berry:micle":"micle-berry",
  # pierres
  "stone:fire":"fire-stone", "stone:water":"water-stone", "stone:thunder":"thunder-stone", "stone:leaf":"leaf-stone", "stone:moon":"moon-stone", "stone:sun":"sun-stone",
  # objets tenus (capture)
  "held:h_coin":"coin-case", "held:h_xp":"exp-share", "held:h_berry":"lum-berry", "held:h_rest":"leftovers", "held:h_aff":"soothe-bell",
  "held:h_rune":"amulet-coin", "held:h_guard":"focus-band", "held:h_charm":"shiny-charm",
  # permanents
  "perm:charm":"shiny-charm", "perm:rune":"amulet-coin",
  # tresors
  "treasure:heart":"heart-scale", "treasure:pearl":"pearl", "treasure:stardust":"stardust", "treasure:bigpearl":"big-pearl",
  "treasure:starpiece":"star-piece", "treasure:statue":"relic-statue",
  # peche, repulsifs, soins
  "rod:old":"old-rod", "rod:super":"good-rod", "rod:mega":"super-rod",
  "repel:repel":"repel", "repel:srepel":"super-repel", "lure":"honey",
  "potion":"potion", "revive":"revive", "radar":"poke-radar",
  # Expedition
  "exp:i_orbe":"life-orb", "exp:i_queue":"lagging-tail", "exp:i_relief":"leftovers", "exp:i_bande":"choice-band", "exp:i_foulard":"choice-scarf",
  "exp:i_lentille":"zoom-lens", "exp:i_ceinture":"expert-belt", "exp:i_veste":"assault-vest", "exp:i_evolite":"eviolite", "exp:i_casque":"rocky-helmet",
  "exp:i_grelot":"shell-bell", "exp:i_ceinture_f":"focus-sash", "exp:i_griffe":"quick-claw", "exp:i_loupe":"scope-lens", "exp:i_roche":"iron-ball",
  "exp:i_ct":"tm-normal",
  # Breche : objets et catalyseurs
  "br:restes":"leftovers", "br:mouchoir":"choice-scarf", "br:lentille":"zoom-lens", "br:griffe":"quick-claw", "br:bandeau":"choice-band",
  "br:grelot":"shell-bell", "br:veste":"assault-vest", "br:orbe":"life-orb", "br:casque":"rocky-helmet", "br:sitrus":"sitrus-berry",
  "br:encens":"luck-incense", "br:piece":"amulet-coin", "br:cristal":"quick-powder",
  "br:cat1":"silk-scarf", "br:cat2":"black-belt", "br:cat3":"sharp-beak", "br:cat4":"poison-barb", "br:cat5":"soft-sand", "br:cat6":"hard-stone",
  "br:cat7":"silver-powder", "br:cat8":"spell-tag", "br:cat9":"metal-coat", "br:cat10":"charcoal", "br:cat11":"mystic-water", "br:cat12":"miracle-seed",
  "br:cat13":"magnet", "br:cat14":"twisted-spoon", "br:cat15":"never-melt-ice", "br:cat16":"dragon-fang", "br:cat17":"black-glasses", "br:cat18":"pixie-plate"
}

def fetch(slug):
    p = f"{CACHE}/{slug}.png"
    if not os.path.exists(p):
        with urllib.request.urlopen(BASE + slug + ".png", timeout=20) as r: open(p, "wb").write(r.read())
    return Image.open(p).convert("RGBA")

# ---------- icones originales (32 x 32, pixel art) ----------
OUT = (18, 12, 28, 255)
def outline(im):
    """contour sombre d'un pixel autour de la silhouette, comme les sprites officiels"""
    a = im.getchannel("A"); o = Image.new("RGBA", im.size, (0, 0, 0, 0)); px = o.load(); ap = a.load()
    for y in range(im.height):
        for x in range(im.width):
            if ap[x, y]: continue
            if any(0 <= x+dx < im.width and 0 <= y+dy < im.height and ap[x+dx, y+dy] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                px[x, y] = OUT
    o.alpha_composite(im); return o
def canvas(): im = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

def data_ball():
    im, d = canvas()
    d.ellipse((5, 5, 26, 26), fill=(230, 236, 244, 255))
    d.pieslice((5, 5, 26, 26), 180, 360, fill=(53, 240, 214, 255))
    d.pieslice((7, 7, 24, 24), 200, 250, fill=(160, 255, 240, 255))           # reflet
    for x, y in ((10, 11), (14, 9), (19, 10), (21, 13), (12, 13)): d.point((x, y), fill=(255, 61, 127, 255))
    d.rectangle((5, 15, 26, 16), fill=OUT)
    d.ellipse((12, 12, 19, 19), fill=OUT); d.ellipse((13, 13, 18, 18), fill=(245, 245, 250, 255)); d.ellipse((14, 14, 17, 17), fill=(53, 240, 214, 255))
    return outline(im)
def archive(body, dark, light, mark):
    im, d = canvas()
    d.rectangle((5, 12, 26, 26), fill=body); d.rectangle((5, 12, 26, 13), fill=light)
    d.rectangle((4, 8, 27, 12), fill=light); d.rectangle((4, 11, 27, 12), fill=dark)       # couvercle
    d.rectangle((5, 24, 26, 26), fill=dark)
    d.rectangle((14, 11, 17, 16), fill=(40, 30, 50, 255)); d.rectangle((15, 13, 16, 14), fill=mark)   # serrure
    for x in range(8, 25, 4): d.point((x, 19), fill=light); d.point((x + 1, 21), fill=dark)        # lignes de donnees
    return im, d
def arch_small():
    im, d = archive((168, 112, 64, 255), (110, 70, 36, 255), (212, 156, 96, 255), (53, 240, 214, 255))
    d.line((9, 14, 12, 18), fill=(70, 40, 20, 255)); d.line((12, 18, 10, 22), fill=(70, 40, 20, 255))   # felure
    return outline(im)
def arch_big():
    im, d = archive((126, 146, 176, 255), (78, 94, 122, 255), (176, 196, 222, 255), (255, 210, 74, 255))
    d.rectangle((4, 16, 27, 17), fill=(78, 94, 122, 255))                                          # sangle
    return outline(im)
def arch_void():
    im, d = archive((92, 48, 150, 255), (56, 24, 96, 255), (150, 100, 220, 255), (255, 61, 127, 255))
    for x, y in ((7, 15), (22, 18), (10, 22), (24, 23)): d.point((x, y), fill=(255, 61, 127, 255))
    return outline(im)
def arch_master():
    im, d = archive((224, 176, 64, 255), (160, 116, 30, 255), (255, 230, 150, 255), (255, 255, 255, 255))
    d.polygon([(16, 17), (17, 19), (19, 19), (17, 20), (18, 22), (16, 21), (14, 22), (15, 20), (13, 19), (15, 19)], fill=(255, 250, 220, 255))
    return outline(im)
def link_cable():
    im, d = canvas()
    d.rectangle((4, 6, 11, 13), fill=(120, 110, 150, 255)); d.rectangle((5, 7, 10, 8), fill=(170, 160, 200, 255))
    d.rectangle((21, 19, 28, 26), fill=(120, 110, 150, 255)); d.rectangle((22, 20, 27, 21), fill=(170, 160, 200, 255))
    d.rectangle((6, 4, 9, 6), fill=(200, 200, 210, 255)); d.rectangle((23, 26, 26, 28), fill=(200, 200, 210, 255))
    d.line([(8, 13), (8, 18), (14, 20), (18, 12), (24, 14), (24, 19)], fill=(90, 80, 120, 255), width=2)
    return outline(im)
def compass():
    im, d = canvas()
    d.ellipse((5, 5, 26, 26), fill=(200, 150, 60, 255)); d.ellipse((7, 7, 24, 24), fill=(244, 232, 200, 255))
    d.polygon([(16, 9), (18, 16), (16, 15), (14, 16)], fill=(220, 60, 60, 255)); d.polygon([(16, 22), (18, 16), (16, 17), (14, 16)], fill=(90, 100, 120, 255))
    d.line((10, 10, 13, 14), fill=(120, 90, 50, 255)); d.line((13, 14, 12, 19), fill=(120, 90, 50, 255))   # felure
    d.rectangle((14, 3, 17, 5), fill=(200, 150, 60, 255))
    return outline(im)
def attract():
    im, d = canvas()
    d.arc((6, 6, 25, 25), 180, 360, fill=(53, 240, 214, 255), width=5)
    d.rectangle((6, 15, 10, 24), fill=(53, 240, 214, 255)); d.rectangle((21, 15, 25, 24), fill=(53, 240, 214, 255))
    d.rectangle((6, 21, 10, 24), fill=(230, 236, 244, 255)); d.rectangle((21, 21, 25, 24), fill=(230, 236, 244, 255))
    for x, y in ((14, 18), (17, 21), (15, 24)): d.point((x, y), fill=(255, 61, 127, 255))
    return outline(im)
def shield():
    im, d = canvas()
    d.polygon([(16, 4), (27, 8), (26, 18), (16, 28), (6, 18), (5, 8)], fill=(40, 170, 160, 255))
    d.polygon([(16, 6), (25, 9), (24, 17), (16, 25)], fill=(90, 230, 210, 255))
    for (x, y) in ((11, 11), (16, 13), (21, 11), (13, 18), (19, 18)):
        d.polygon([(x, y - 2), (x + 2, y - 1), (x + 2, y + 1), (x, y + 2), (x - 2, y + 1), (x - 2, y - 1)], outline=(200, 255, 250, 255))
    return outline(im)
CUSTOM = {"ball:data":data_ball, "chest:small":arch_small, "chest:big":arch_big, "chest:void":arch_void, "chest:master":arch_master,
          "stone:link":link_cable, "held:h_relic":compass, "br:attract":attract, "br:bouclier":shield}

def cell(im):
    bb = im.getbbox()
    if bb: im = im.crop(bb)
    if max(im.size) > 32: im.thumbnail((32, 32), Image.NEAREST)
    c = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); c.alpha_composite(im, ((32 - im.width) // 2, (32 - im.height) // 2)); return c

keys = list(OFFICIAL) + list(CUSTOM)
COLS = 12; rows = (len(keys) + COLS - 1) // COLS
atlas = Image.new("RGBA", (COLS * 32, rows * 32), (0, 0, 0, 0))
idx = {}
for i, k in enumerate(keys):
    im = fetch(OFFICIAL[k]) if k in OFFICIAL else CUSTOM[k]()
    atlas.alpha_composite(cell(im), ((i % COLS) * 32, (i // COLS) * 32)); idx[k] = i
atlas.save("assets/items.png", optimize=True)
b64 = base64.b64encode(open("assets/items.png", "rb").read()).decode()
open("src/_items.js", "w", encoding="utf-8").write(
  "/* Icones d'objets : sprites officiels du depot PokeAPI/sprites (objets), et icones originales\n"
  "   pour les objets propres au jeu. Voir build_items.py. */\n"
  f"const ITEMS_COLS={COLS}, ITEMS_ROWS={rows};\nconst ITEM_IDX={json.dumps(idx, separators=(',', ':'))};\n"
  f"const ITEMS_URL=\"data:image/png;base64,{b64}\";\n")
print(f"{len(keys)} icônes ({len(OFFICIAL)} officielles, {len(CUSTOM)} originales) · atlas {atlas.size} · {os.path.getsize('assets/items.png') // 1024} Ko")
