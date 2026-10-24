"""Sources des cartes : sprites detoures, palettes, mise en page.

Partage entre build_cardart.py (production des atlas) et les apercus.
"""
import os, math, json
import numpy as np
from PIL import Image
from scipy import ndimage

SERIES = ["art", "g5", "g3", "g2", "g1"]
# grille de la scene de chaque epoque (format 5:7). Les sprites y sont poses a
# l'echelle 1 quand c'est possible : un pixel du sprite = un pixel du decor.
GRID = {"g1": (70, 98), "g2": (70, 98), "g3": (80, 112), "g5": (115, 161), "art": (300, 420)}
YEAR = {"g1": 1996, "g2": 1999, "g3": 2002, "g5": 2010, "art": 0}


def legendaries():
    if os.path.exists("/tmp/legs.json"):
        legs = json.load(open("/tmp/legs.json"))
        if legs:
            return legs
    blob = open("src/pokedex.blob", encoding="utf-8").read().strip().split("\n")
    return [int(l.split("|")[0]) for l in blob if l.split("|")[-1] != "0"]


def _valid(p):
    if not os.path.exists(p):
        return False
    try:
        with Image.open(p) as im:
            im.verify()
        return True
    except Exception:
        return False


def source(series, pid):
    """Une illustration deposee dans assets/cardart/ prime sur celle du depot.
    Le test est la lisibilite de l'image, pas sa taille : les sprites de Mew et
    Celebi pesent moins de 400 octets et sont parfaitement valides."""
    custom = f"assets/cardart/{series}_{pid}.png"
    if _valid(custom):
        return custom, True
    p = f"sprites/g3/{pid}.png" if series == "g3" else f"sprites/cards/{series}_{pid}.png"
    return (p, False) if _valid(p) else (None, False)


def scene_override(series, pid):
    p = f"assets/cardart/{series}_{pid}_scene.png"
    return p if _valid(p) else None


def detour(a):
    """Retire un fond uni : remplissage depuis les bords, en 4-connexite, de la
    couleur du bord. Les blancs du corps, entoures d'un contour, restent."""
    if a[..., 3].min() < 255:
        return a
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])[:, :3]
    vals, counts = np.unique(border, axis=0, return_counts=True)
    bg = vals[counts.argmax()]
    same = np.all(a[..., :3] == bg, -1)
    lab, n = ndimage.label(same, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = a.copy()
    for l in edge:
        out[lab == l, 3] = 0
    return out


def load_subject(series, pid):
    path, custom = source(series, pid)
    if not path:
        return None
    im = Image.open(path)
    rgba = np.array(im.convert("RGBA"))
    pal = None
    if series in ("g1", "g2") and not custom:
        cols = np.unique(rgba[..., :3].reshape(-1, 3), axis=0)
        pal = (cols / 255.0).astype(np.float32)
    rgba = detour(rgba)
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    if not len(xs):
        return None
    off = (int(xs.min()), int(ys.min()))
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    if series == "art" or custom:
        # l'illustration officielle est plafonnee : la carte agrandie n'en montre pas plus
        h, w = rgba.shape[:2]
        cap = 360
        if max(w, h) > cap:
            s = cap / max(w, h)
            rgba = np.array(Image.fromarray(rgba).resize((round(w * s), round(h * s)), Image.LANCZOS))
    n_cols = len(np.unique(rgba[rgba[..., 3] > 8][:, :3], axis=0))
    nat = Image.open(path).size
    return dict(rgba=rgba, pal=pal, custom=custom, path=path, colors=n_cols, native=nat, key=f"{series}:{pid}",
                off=off, ramp=ramp(rgba) if series in ("g1", "g2", "g3") and not custom else None)


def ramp(rgba):
    """Les couleurs d'un sprite d'epoque, de la plus sombre a la plus claire, avec la
    part de la silhouette que chacune occupe : de quoi repeindre un autre dessin
    du meme Pokemon dans la meme ecriture (apparences d'epoque, 73h)."""
    px = rgba[rgba[..., 3] > 100][:, :3]
    if not len(px):
        return []
    cols, counts = np.unique(px, axis=0, return_counts=True)
    lum = cols @ np.array([0.299, 0.587, 0.114])
    order = np.argsort(lum)
    tot = counts.sum()
    return [["#%02x%02x%02x" % tuple(int(v) for v in cols[i]), round(float(counts[i]) / tot, 4)] for i in order]


def back_source(series, pid):
    """Le dos du sprite d'epoque : Rouge/Bleu et Cristal (fetch_cardsprites.py), Emeraude (build_atlas.py)."""
    p = f"sprites/g3b/{pid}.png" if series == "g3" else f"sprites/cards/{series}b_{pid}.png"
    return p if _valid(p) else None


def load_back(series, pid):
    p = back_source(series, pid)
    if not p:
        return None
    a = detour(np.array(Image.open(p).convert("RGBA")))
    ys, xs = np.nonzero(a[..., 3] > 8)
    if not len(xs):
        return None
    nat = Image.open(p).size
    return dict(rgba=a[ys.min():ys.max() + 1, xs.min():xs.max() + 1], off=(int(xs.min()), int(ys.min())), native=nat)


# part d'un sujet qui peut sortir de la carte d'un cote : une queue, une aile.
# La carte se centre sur le corps, pas sur la boite qui englobe la queue.
CUT = 0.2

# retouches carte par carte, quand l'automatique ne suffit pas :
#   s : facteur d'echelle (illustration lisse) ou de resserrement de la grille (pixel art)
#   dx, dy : decalage en fraction de la carte
FRAME = {
    "art:146": {"s": 1.3, "dx": -0.12},   # Sulfura : des ailes immenses, un corps minuscule ; la tete a droite
}


def core(rgba):
    """Le corps du sujet, la ou il est epais : chaque pixel pese sa distance au bord,
    une queue fine ou une aile pesent peu. Renvoie le centre (cx, cy) et la boite
    qui contient l'essentiel de ce poids (quantiles 6 % a 94 %), en pixels du sujet."""
    a = rgba[..., 3] > 100
    d = ndimage.distance_transform_edt(np.pad(a, 1))[1:-1, 1:-1]
    w = d ** 1.5
    tot = w.sum()
    if tot <= 0:
        h, wd = a.shape
        return wd / 2, h / 2, (0, wd, 0, h)
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    cx, cy = (w * (xs + 0.5)).sum() / tot, (w * (ys + 0.5)).sum() / tot

    def q(axis_w, lo, hi):
        c = np.cumsum(axis_w) / axis_w.sum()
        return float(np.searchsorted(c, lo)), float(np.searchsorted(c, hi) + 1)
    x0, x1 = q(w.sum(0), 0.06, 0.94)
    y0, y1 = q(w.sum(1), 0.06, 0.94)
    return cx, cy, (x0, x1, y0, y1)


def layout(series, sub, fly):
    """Place le sujet sur la grille de la scene ; renvoie (x, y, w, h, k, W, H, cx, cy) :
    position et taille en pixels de la grille, echelle, taille de la grille, et le
    centre du corps en fractions de la carte.

    Le corps (pas la boite englobante) est centre ; une queue ou une aile peuvent
    sortir de la carte, d'au plus CUT de la largeur du sujet de chaque cote.
    L'illustration lisse est agrandie jusqu'a ce que le corps remplisse la carte.
    Les sprites restent a une echelle entiere ; un petit sprite (ou un corps petit
    dans une grande boite) resserre la grille plutot que d'etre grossi : il reste
    net, a la meme taille de pixel que son decor."""
    W, H = GRID[series]
    rgba = sub["rgba"]
    h0, w0 = rgba.shape[:2]
    adj = FRAME.get(sub.get("key", ""), {}) if not sub["custom"] else {}
    cx, cy, (qx0, qx1, qy0, qy1) = core(rgba)
    cw, ch = max(1.0, qx1 - qx0), max(1.0, qy1 - qy0)
    smooth = series == "art" or sub["custom"]

    def kcut(Wd):
        """plus grande echelle ou la queue ne depasse pas CUT de chaque cote"""
        lim = []
        for far in (w0 - cx, cx):               # distance du centre au bord du sujet
            room = far - CUT * w0
            if room > 0:
                lim.append(Wd / (2 * room))
        return min(lim) if lim else 99.0

    if smooth:
        k_full = min(0.86 * W / w0, 0.56 * H / h0)
        k_core = min(0.64 * W / cw, 0.44 * H / ch)
        # un sujet compact garde sa taille ; un sujet etire (queue, ailes) grandit un peu
        k = min(max(k_full, k_core), 1.22 * k_full, kcut(W), 0.62 * H / h0)
        k *= adj.get("s", 1.0)
    else:
        k = max(1, math.floor(min(0.88 * W / w0, 0.6 * H / h0)))
        # un corps qui ne remplit pas la carte resserre la grille, dans les limites
        # de la queue (CUT) et de la hauteur
        if cw * k / W < 0.46:
            need = max(56, round(cw * k / 0.56))
            floor_cut = 2 * k * max(w0 - cx - CUT * w0, cx - CUT * w0, 0)
            floor_h = h0 * k / 0.62 / 1.4
            Wn = int(max(need, math.ceil(floor_cut), math.ceil(floor_h)))
            if Wn < W:
                W, H = Wn, round(Wn * 1.4)
        if adj.get("s"):
            W = max(48, round(W / adj["s"]))
            H = round(W * 1.4)
    w, h = w0 * k, h0 * k
    cut = CUT * (adj.get("s", 1.0) ** 2 if adj.get("s", 1.0) > 1 else 1)
    x = W / 2 - cx * k
    x = min(max(x, -cut * w), W - w + cut * w) + adj.get("dx", 0) * W
    if fly:
        y = 0.4 * H - cy * k
        y = min(max(y, -0.06 * h), 0.8 * H - h)
    else:
        y = 0.69 * H - h
    y += adj.get("dy", 0) * H
    if not smooth:
        x, y = round(x), round(y)
    return x, y, w, h, k, W, H, (x + cx * k) / W, (y + cy * k) / H
