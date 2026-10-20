"""Poses de repos (Idle) et de concentration (Charge) des sprites PMD.

Source : PMDCollab / SpriteCollab (CC BY-NC 4.0), telechargees dans
sprites/pmd_extra/<id>-Idle.png, <id>-Charge.png et <id>.xml (AnimData).
Les planches sont optimisees comme les autres (palette, transparence nette),
ecrites dans assets/pmd/<id>-idle.png et <id>-charge.png, et leurs dimensions
ajoutees a PMD_ANIM dans src/_pmd.js. Quand le repos d'une espece est une
copie de sa marche (les Pokemon qui flottent), elle est listee dans
PMD_IDLE_WALK : la Tour la fait alors marcher sur place, comme dans le jeu.
"""
import os, re, json
from PIL import Image
SRC, OUT = "sprites/pmd_extra", "assets/pmd"

def anim_meta(xml, name):
    m = re.search(r"<Name>%s</Name>(.*?)</Anim>" % name, xml, re.S)
    if not m: return None
    body = m.group(1)
    if re.search(r"<CopyOf>(\w+)</CopyOf>", body): return "copy"
    fw = int(re.search(r"<FrameWidth>(\d+)", body).group(1)); fh = int(re.search(r"<FrameHeight>(\d+)", body).group(1))
    return fw, fh, [int(x) for x in re.findall(r"<Duration>(\d+)</Duration>", body)]

def optimize(src, dst):
    im = Image.open(src).convert("RGBA")
    a = im.getchannel("A").point(lambda v: 255 if v > 127 else 0); im.putalpha(a)
    p = im.quantize(colors=63, method=Image.FASTOCTREE)
    trans, px, ap = None, p.load(), a.load()
    for y in range(p.height):
        for x in range(p.width):
            if ap[x, y] == 0: trans = px[x, y]; break
        if trans is not None: break
    p.save(dst, optimize=True, transparency=trans if trans is not None else 0)
    return im.size

src_js = open("src/_pmd.js", encoding="utf-8").read()
m = re.search(r"const PMD_ANIM = (\{.*?\});\n", src_js, re.S)
anims = json.loads(m.group(1))
idle_walk, total = [], 0
for i in range(1, 387):
    xml = open(f"{SRC}/{i}.xml", encoding="utf-8").read()
    for name in ("Idle", "Charge"):
        mm = anim_meta(xml, name)
        if mm == "copy":
            if name == "Idle": idle_walk.append(i)
            continue
        src = f"{SRC}/{i}-{name}.png"
        if not mm or not os.path.exists(src): continue
        fw, fh, dur = mm
        dst = f"{OUT}/{i}-{name.lower()}.png"
        w, h = optimize(src, dst)
        if h // fh != 8 or w // fw < 1: os.remove(dst); continue
        total += os.path.getsize(dst)
        anims.setdefault(str(i), {})[name.lower()] = [fw, fh, w // fw, dur[:w // fw] or [8] * (w // fw)]
# Porygon-Z (474) : hors du Pokédex du jeu, mais il descend en personne dans la faille profonde
PZ = f"{SRC}/474"
if os.path.exists(f"{PZ}/AnimData.xml"):
    xml = open(f"{PZ}/AnimData.xml", encoding="utf-8").read()
    mm = anim_meta(xml, "Walk")
    if mm and mm != "copy":
        fw, fh, dur = mm
        w, h = optimize(f"{PZ}/Walk.png", f"{OUT}/474.png")
        mw = re.search(r"const PMD_META = (\{.*?\});\n", src_js, re.S)
        meta = json.loads(mw.group(1)); meta["474"] = [fw, fh, w // fw, dur[:w // fw]]
        src_js = src_js[:mw.start()] + "const PMD_META = " + json.dumps(meta, separators=(",", ":")) + ";\n" + src_js[mw.end():]
    for name in ("Idle", "Attack", "Hurt", "Charge", "Shoot"):
        mm = anim_meta(xml, name)
        if not mm or mm == "copy" or not os.path.exists(f"{PZ}/{name}.png"): continue
        fw, fh, dur = mm
        w, h = optimize(f"{PZ}/{name}.png", f"{OUT}/474-{name.lower()}.png")
        anims.setdefault("474", {})[name.lower()] = [fw, fh, w // fw, dur[:w // fw] or [8] * (w // fw)]
new = "const PMD_ANIM = " + json.dumps(anims, separators=(",", ":")) + ";\n"
m = re.search(r"const PMD_ANIM = (\{.*?\});\n", src_js, re.S)      # les positions ont pu bouger (PMD_META)
src_js = src_js[:m.start()] + new + src_js[m.end():]
src_js = re.sub(r"/\* especes dont le repos est la marche \(elles flottent\) \*/\n", "", src_js)
src_js = re.sub(r"const PMD_IDLE_WALK = .*?;\n", "", src_js)
src_js += "/* especes dont le repos est la marche (elles flottent) */\nconst PMD_IDLE_WALK = " + json.dumps(idle_walk) + ";\n"
open("src/_pmd.js", "w", encoding="utf-8").write(src_js)
n = sum(1 for v in anims.values() for k in v if k in ("idle", "charge"))
print(f"repos et concentration : {n} planches · {total // 1024} Ko · repos = marche pour {idle_walk}")
# la version autonome embarque aussi la marche de Porygon-Z (sinon il serait invisible hors ligne)
if os.path.exists(f"{OUT}/474.png"):
    import base64
    img_js = open("src/_pmdimg.js", encoding="utf-8").read()
    img_js = re.sub(r',474:"data:image/png;base64,[^"]*"', "", img_js)
    entry = ',474:"data:image/png;base64,' + base64.b64encode(open(f"{OUT}/474.png", "rb").read()).decode() + '"'
    img_js = img_js.rstrip()
    assert img_js.endswith("};")
    open("src/_pmdimg.js", "w", encoding="utf-8").write(img_js[:-2] + entry + "};\n")
    print("Porygon-Z embarqué dans la version autonome")
