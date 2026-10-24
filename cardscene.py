"""Scenes pleine carte des legendaires, une par generation d'ecriture.

Une carte montre un legendaire tel qu'une generation l'a dessine. La scene
autour de lui est peinte dans les contraintes de cette meme generation :

  g1  Rendu primordial  1996  les quatre teintes du sprite, tramees
  g2  Rendu fondateur   1999  huit couleurs tramees
  g3  Rendu instable    2002  vingt couleurs, des lignes qui ont glisse
  g5  Rendu anterieur   2010  quarante couleurs, a peine tramees
  art Rendu courant     auj.  une image lisse, profondeur de champ

Chaque theme est ecrit une seule fois en coordonnees normalisees : la meme
composition sort a toutes les resolutions, seule l'ecriture change.
Tout est deterministe : meme entree, meme image.
"""
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

BAYER4 = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + 0.5) / 16


def hexc(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def mix(a, b, t):
    t = np.asarray(t, np.float32)
    if t.ndim and t.shape[-1:] != (3,):
        t = t[..., None]
    return a * (1 - t) + b * t


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0 + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


class Ctx:
    """Toile d'une scene. X va de 0 a 1 sur la largeur ; V de 0 a 1 sur la
    hauteur ; Y suit V mais dans l'unite de X (cercles ronds)."""

    def __init__(self, W, H, era, seed, box, ss=1, core=None):
        self.W, self.H, self.era, self.ss = W * ss, H * ss, era, ss
        self.w0, self.h0 = W, H
        self.A = H / W
        yy, xx = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        self.X = (xx + 0.5) / self.W
        self.V = (yy + 0.5) / self.H
        self.Y = self.V * self.A
        self.hd = era == "art"
        self.seed = seed
        x0, y0, x1, y1 = box               # boite du sujet, en fractions de W et H
        self.box = box
        # la lumiere et l'ombre se placent sur le corps du sujet, pas sur sa boite
        self.cx, self.cy = core if core else ((x0 + x1) / 2, (y0 + y1) / 2)
        self.bw, self.bh = x1 - x0, y1 - y0
        self.px = 1 / self.W                # un pixel, en unites de X
        self.pv = 1 / self.H                # un pixel, en unites de V

    def rng(self, k):
        return np.random.default_rng((self.seed * 7919 + k) & 0xFFFFFFFF)

    def edge(self, sd_px):
        """Masque a partir d'une distance signee exprimee en pixels :
        net en pixel art, adouci d'un pixel en haute definition."""
        if self.hd:
            return np.clip(sd_px + 0.5, 0, 1).astype(np.float32)
        return (sd_px >= 0).astype(np.float32)


# ---------------------------------------------------------------- bruit
def noise(c, freq, seed, octaves=4, gain=0.5, sx=1.0, sy=1.0, warp=None):
    """Bruit de valeur lisse, continu en coordonnees normalisees."""
    rng = np.random.default_rng(seed)
    tot = np.zeros_like(c.X)
    amp, norm = 1.0, 0.0
    X, Y = c.X, c.Y
    if warp is not None:
        X, Y = X + warp[0], Y + warp[1]
    for o in range(octaves):
        f = freq * (2 ** o)
        gw = int(f * sx) + 6
        gh = int(f * sy * c.A) + 6
        g = rng.random((gh, gw)).astype(np.float32)
        tot += amp * ndimage.map_coordinates(g, [Y * f * sy + 2, X * f * sx + 2], order=3, mode="nearest")
        norm += amp
        amp *= gain
    return np.clip(tot / norm, 0, 1)


def noise1(x, freq, seed, octaves=4, gain=0.5):
    rng = np.random.default_rng(seed)
    tot = np.zeros_like(x)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        f = freq * (2 ** o)
        g = rng.random(int(f) + 6).astype(np.float32)
        tot += amp * ndimage.map_coordinates(g, [x * f + 2], order=3, mode="nearest")
        norm += amp
        amp *= gain
    return np.clip(tot / norm, 0, 1)


def blur(c, a, sigma):
    """sigma en unites de X ; rien en pixel art pour les petits rayons."""
    s = sigma * c.W
    if s < 0.35:
        return a
    if a.ndim == 3:
        return np.stack([ndimage.gaussian_filter(a[..., k], s) for k in range(a.shape[2])], -1)
    return ndimage.gaussian_filter(a, s)


# ---------------------------------------------------------------- formes
def vgrad(c, stops):
    ts = np.array([s[0] for s in stops], np.float32)
    cs = np.array([hexc(s[1]) for s in stops], np.float32)
    v = c.V[:, 0]
    col = np.stack([np.interp(v, ts, cs[:, k]) for k in range(3)], -1)
    return np.broadcast_to(col[:, None, :], (c.H, c.W, 3)).copy()


def over(img, col, a):
    a = np.clip(a, 0, 1)[..., None]
    img *= (1 - a)
    img += np.asarray(col, np.float32) * a


def add(img, col, a):
    img += np.asarray(col, np.float32) * np.asarray(a, np.float32)[..., None]


def screen(img, col, a):
    k = np.clip(np.asarray(col, np.float32) * np.asarray(a, np.float32)[..., None], 0, 1)
    img[:] = 1 - (1 - np.clip(img, 0, 1)) * (1 - k)


def disc(c, cx, cy, r, power=2.0):
    """cy en V ; r en unites de X."""
    d = np.sqrt((c.X - cx) ** 2 + (c.Y - cy * c.A) ** 2) / r
    return np.clip(1 - d, 0, 1) ** power


def gauss(c, cx, cy, r):
    d2 = ((c.X - cx) ** 2 + (c.Y - cy * c.A) ** 2) / (r * r)
    return np.exp(-d2)


def ellipse(c, cx, cy, rx, ry):
    """masque d'ellipse ; cy et ry en V."""
    d = np.sqrt(((c.X - cx) / rx) ** 2 + ((c.V - cy) / ry) ** 2)
    return c.edge((1 - d) * min(rx * c.W, ry * c.H))


def rays(c, cx, cy, n, seed, width=0.06, reach=1.3, power=1.2, spin=0.0):
    rng = np.random.default_rng(seed)
    ang = np.arctan2(c.Y - cy * c.A, c.X - cx)
    d = np.sqrt((c.X - cx) ** 2 + (c.Y - cy * c.A) ** 2)
    out = np.zeros_like(d)
    for i in range(n):
        a = spin + (i + rng.uniform(-0.35, 0.35)) * 2 * np.pi / n
        w = width * rng.uniform(0.45, 1.5)
        s = rng.uniform(0.35, 1.0)
        da = np.angle(np.exp(1j * (ang - a)))
        out += s * np.exp(-(da / w) ** 2)
    return np.clip(out, 0, 1.4) * np.clip(1 - d / reach, 0, 1) ** power


def ridge(c, base, amp, freq, seed, octaves=5, sharp=0.7):
    """Ligne de crete : renvoie hauteur par colonne (en V) et masque du relief."""
    x = c.X[0]
    n = noise1(x, freq, seed, octaves)
    r = 1 - np.abs(2 * n - 1)
    n = n * (1 - sharp) + r * sharp
    h = base - amp * n
    mask = c.edge((c.V - h[None, :]) * c.H)
    return h, mask


def poly(c, pts):
    """Polygone en coordonnees normalisees (x en X, y en V)."""
    ss = 1 if not c.hd else 3
    im = Image.new("L", (c.W * ss, c.H * ss), 0)
    ImageDraw.Draw(im).polygon([(x * c.W * ss, y * c.H * ss) for x, y in pts], fill=255)
    if ss > 1:
        im = im.resize((c.W, c.H), Image.BOX)
    return np.asarray(im, np.float32) / 255


def lines(c, segs, width_px=1.0):
    """Polylignes ; width_px en pixels de la toile."""
    ss = 1 if not c.hd else 3
    im = Image.new("L", (c.W * ss, c.H * ss), 0)
    d = ImageDraw.Draw(im)
    for seg in segs:
        d.line([(x * c.W * ss, y * c.H * ss) for x, y in seg], fill=255,
               width=max(1, int(round(width_px * ss))), joint="curve")
    if ss > 1:
        im = im.resize((c.W, c.H), Image.BOX)
    return np.asarray(im, np.float32) / 255


def bolt(c, x0, y0, x1, y1, seed, depth=6, jitter=0.18, branches=2):
    rng = np.random.default_rng(seed)

    def split(a, b, d, j):
        if d == 0:
            return [a, b]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        L = np.hypot(b[0] - a[0], (b[1] - a[1]) * c.A)
        mx += rng.normal(0, j * L)
        my += rng.normal(0, j * L * 0.25) / c.A
        return split(a, (mx, my), d - 1, j)[:-1] + split((mx, my), b, d - 1, j)
    main = split((x0, y0), (x1, y1), depth, jitter)
    segs = [main]
    for k in range(branches):
        i = rng.integers(len(main) // 4, max(len(main) // 4 + 1, 3 * len(main) // 4))
        a = main[i]
        b = (a[0] + rng.uniform(-0.25, 0.25), a[1] + rng.uniform(0.08, 0.2))
        segs.append(split(a, b, depth - 2, jitter))
    return segs


def stars(c, density, seed, ymax=1.0, big=0.05):
    """Carte d'intensite d'etoiles : pixels isoles en pixel art, points doux en HD."""
    rng = np.random.default_rng(seed)
    n = int(density * c.w0 * c.h0 * ymax / 100)
    xs = rng.random(n)
    ys = rng.random(n) * ymax
    br = rng.random(n) ** 2.2
    out = np.zeros((c.H, c.W), np.float32)
    ix = np.clip((xs * c.W).astype(int), 0, c.W - 1)
    iy = np.clip((ys * c.H).astype(int), 0, c.H - 1)
    if c.hd:
        np.maximum.at(out, (iy, ix), 0.35 + 0.65 * br)
        soft = ndimage.gaussian_filter(out, 0.7 * c.ss) * 4
        out = np.maximum(out * 0.8, soft)
        for k in np.nonzero(br > 1 - big)[0]:      # quelques etoiles en croix
            g = gauss(c, xs[k], ys[k], 0.012) * 0.6
            cr = (np.exp(-((c.X - xs[k]) / 0.0025) ** 2) * np.exp(-((c.V - ys[k]) / 0.03) ** 2)
                  + np.exp(-((c.V - ys[k]) / 0.0018) ** 2) * np.exp(-((c.X - xs[k]) / 0.04) ** 2))
            out = np.maximum(out, g + cr * 0.7)
    else:
        np.maximum.at(out, (iy, ix), 0.45 + 0.55 * br)
    return np.clip(out, 0, 1)


# ---------------------------------------------------------------- macros
def mountains(c, img, layers, seed, light=None, rim=None):
    """layers : [(base, amp, freq, couleur, brume)], du plus loin au plus proche."""
    for k, (base, amp, freq, col, fog) in enumerate(layers):
        h, m = ridge(c, base, amp, freq, seed + k * 13, sharp=0.75)
        col = hexc(col) if isinstance(col, str) else col
        depth = np.clip((c.V - h[None, :]) / 0.25, 0, 1)
        tone = mix(col * 1.12, col * 0.82, depth)
        sky = img.copy()
        tone = mix(tone, sky, fog * (1 - 0.6 * depth))
        if rim is not None and light is not None:
            band = c.edge((c.V - h[None, :]) * c.H) * c.edge((h[None, :] + (1.6 if c.hd else 1) * c.pv - c.V) * c.H)
            near = np.exp(-((c.X - light[0]) / 0.45) ** 2)
            tone = mix(tone, hexc(rim), band * near * (1 - fog) * 0.9)
        over(img, tone, m)
    return img


def cloudband(c, img, y0, y1, freq, cover, dark, lit, seed, light=None, soft=0.09, sx=0.55, sy=1.6, alpha=1.0):
    n = noise(c, freq, seed, 5, sx=sx, sy=sy)
    band = smooth(y0, y0 + 0.06, c.V) * (1 - smooth(y1 - 0.06, y1, c.V))
    a = smooth(cover - soft, cover + soft, n) * band * alpha
    shade = smooth(cover, cover + 0.35, n)                 # le coeur du nuage est plus sombre
    col = mix(hexc(lit), hexc(dark), shade)
    if light is not None:
        g = gauss(c, light[0], light[1], light[2])
        col = mix(col, hexc(lit), g * 0.8)
    over(img, col, a)
    return img


def halo(c, img, col, r=0.55, k=0.9, rays_n=0, rays_k=0.0, seed=0, dy=-0.04, width=0.06):
    cx, cy = c.cx, c.cy + dy
    k *= 0.72 * {"art": 1.0, "g5": 0.9, "g3": 0.85, "g2": 0.75, "g1": 0.55}.get(c.era, 1.0)
    r *= 0.86
    g = gauss(c, cx, cy, r) * k + disc(c, cx, cy, r * 0.42, 1.6) * k * 0.55
    screen(img, hexc(col), g)
    if rays_n:
        screen(img, hexc(col), rays(c, cx, cy, rays_n, seed, width=width) * rays_k)
    return img


def ground_shadow(c, img, k=0.55, w=0.8):
    x0, y0, x1, y1 = c.box
    cx = c.cx
    m = ellipse(c, cx, y1 - 0.004, min(x1 - x0, 1.0) * 0.5 * w, 0.028)
    m = blur(c, m, 0.01) if c.hd else m
    img *= (1 - m * k)[..., None]


def vignette(c, img, k=0.55, bottom=0.35):
    d = np.sqrt(((c.X - 0.5) / 0.75) ** 2 + ((c.V - 0.42) / 0.78) ** 2)
    v = smooth(0.55, 1.15, d) * k + smooth(0.62, 1.0, c.V) * bottom
    img *= (1 - np.clip(v, 0, 0.9))[..., None]


def sea(c, img, horizon, near, far, light_col, lx, seed, sparkle=0.65, streak=1.0):
    m = c.edge((c.V - horizon) * c.H)
    t = np.clip((c.V - horizon) / (1 - horizon), 0, 1)
    base = mix(hexc(far), hexc(near), t ** 0.7)
    n = noise(c, 5, seed, 4, sx=0.22, sy=3.2)
    wave = smooth(0.45, 0.75, n)
    base = mix(base, base * 1.35, wave * 0.5)
    colw = np.exp(-((c.X - lx) / (0.05 + 0.32 * t)) ** 2)
    spark = smooth(sparkle - 0.08 * colw, sparkle + 0.04, n) * (0.25 + colw) * streak
    base = mix(base, hexc(light_col), np.clip(spark, 0, 1) * 0.9)
    over(img, base, m)
    return img


def reflect(c, img, horizon, k=0.45, ripple=0.012):
    """reflet du ciel dans l'eau sous l'horizon."""
    H = c.H
    hy = int(horizon * H)
    for y in range(hy, H):
        src = 2 * hy - y
        if src < 0:
            break
        shift = int(np.sin(y * 1.7) * ripple * c.W)
        row = np.roll(img[src], shift, axis=0)
        img[y] = img[y] * (1 - k) + row * k
    return img


def aurora(c, img, y, amp, col1, col2, seed, k=0.8, width=0.07):
    x = c.X[0]
    yc = y + amp * (noise1(x, 2.2, seed, 3) - 0.5)
    fold = noise1(x, 14, seed + 1, 2)
    d = (c.V - yc[None, :])
    curtain = np.exp(-(np.maximum(d, 0) / (width * 2.6)) ** 2) * np.exp(-(np.minimum(d, 0) / (width * 0.6)) ** 2)
    curtain *= (0.45 + 0.55 * fold[None, :])
    tcol = mix(hexc(col1), hexc(col2), np.clip(-d / (width * 3) + 0.4, 0, 1))
    screen(img, tcol, curtain * k)
    return img


def rain(c, seed, density=0.9, angle=0.25, length=0.06):
    rng = np.random.default_rng(seed)
    n = int(density * c.w0 * c.h0 / 18)
    segs = []
    for _ in range(n):
        x, y = rng.random(), rng.random()
        L = length * rng.uniform(0.6, 1.3)
        segs.append([(x, y), (x - angle * L / c.A, y + L)])
    return lines(c, segs, 1.0 if not c.hd else 0.7)


# ---------------------------------------------------------------- ecriture par epoque
ERA = {
    "art": dict(colors=0,  spread=0.0),
    "g5":  dict(colors=40, spread=0.035),
    "g3":  dict(colors=20, spread=0.075),
    "g2":  dict(colors=8,  spread=0.16),
    "g1":  dict(colors=4,  spread=0.0),
}


def palette_of(img, n):
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    q = im.quantize(colors=n, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p = np.array(q.getpalette()[:n * 3], np.float32).reshape(-1, 3) / 255
    used = np.unique(np.asarray(q))
    return p[used]


def odither(img, pal, spread):
    H, W, _ = img.shape
    b = BAYER4[np.arange(H)[:, None] % 4, np.arange(W)[None, :] % 4] - 0.5
    t = img + b[..., None] * spread
    d = ((t[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(-1)
    return pal[d.argmin(-1)]


def lum(img):
    return img[..., 0] * 0.299 + img[..., 1] * 0.587 + img[..., 2] * 0.114


def write_era(img, era, sprite_pal=None, cap=0.62, gamma=1.15, rng=None):
    """Passe la scene lisse dans l'ecriture de son epoque."""
    img = np.clip(img, 0, 1)
    if era == "art":
        return img
    if era == "g1":
        # quatre teintes, celles du sprite : la scene est peinte avec sa palette.
        # La trame se fait entre les luminances reelles de ces quatre teintes :
        # un ciel sombre reste noir, meme si la teinte suivante est un jaune vif.
        # Le plafond reserve le blanc aux eclats, pour que les blancs du sprite
        # se detachent du decor.
        pal = np.array(sorted(sprite_pal, key=lambda p: lum(np.array(p)[None, None])[0, 0]), np.float32)
        pl = lum(pal[None])[0]
        L = lum(img)
        hi = np.percentile(L, 99.8)
        L = np.clip(L / max(hi, 1e-6), 0, 1) ** gamma * (pl[-2] + (pl[-1] - pl[-2]) * (cap - 0.5) * 2)
        L = np.maximum(L, pl[0])
        H, W = L.shape
        b = BAYER4[np.arange(H)[:, None] % 4, np.arange(W)[None, :] % 4]
        i = np.clip(np.searchsorted(pl, L, side="right") - 1, 0, len(pl) - 2)
        t = (L - pl[i]) / (pl[i + 1] - pl[i] + 1e-6)
        t = np.clip((t - 0.5) * 2.3 + 0.5, 0, 1)      # aplats francs, trame aux seules transitions
        lvl = i + (b < t)
        return pal[lvl]
    e = ERA[era]
    pal = palette_of(img, e["colors"])
    out = odither(img, pal, e["spread"])
    if era == "g3" and rng is not None:            # le rendu instable : quelques lignes ont glisse
        H = out.shape[0]
        for _ in range(3):
            y = rng.integers(int(H * 0.05), int(H * 0.7))
            h = int(rng.integers(1, 3))
            out[y:y + h] = np.roll(out[y:y + h], int(rng.choice([-2, -1, 1, 2])), axis=1)
    return out


def nearest(pal, col):
    pal = np.asarray(pal, np.float32)
    return pal[((pal - hexc(col)) ** 2).sum(-1).argmin()]


# ---------------------------------------------------------------- particules
def fx_tile(W, H, era, kind, colors, density, seed, pal=None):
    """Couche de particules, raccordable verticalement (elle defile en boucle).
    Pixels isoles pour les epoques anciennes, points doux en haute definition."""
    rng = np.random.default_rng(seed * 31 + 5)
    out = np.zeros((H, W, 4), np.float32)
    hd = era == "art"
    cols = [hexc(c) for c in colors]
    if pal is not None and not hd:
        cols = [pal[((pal - c) ** 2).sum(-1).argmin()] for c in cols]

    def put(x, y, col, a):
        for yy in (y - H, y, y + H):
            xi, yi = int(x) % W, int(yy)
            if 0 <= yi < H:
                out[yi, xi, :3] = col
                out[yi, xi, 3] = max(out[yi, xi, 3], a)

    if kind == "rain":
        n = int(density * W * H / (420 if hd else 260))
        ang = 0.22
        for _ in range(n):
            x, y = rng.random() * W, rng.random() * H
            L = rng.uniform(10, 22) if hd else rng.integers(3, 6)
            col = cols[int(rng.integers(len(cols)))]
            a = rng.uniform(0.35, 0.7) if hd else 1.0
            for t in range(int(L)):
                put(x - ang * t, y + t, col, a * (0.5 + 0.5 * t / L) if hd else a)
    elif hd:
        n = int(density * 95)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        acc = np.zeros((H, W), np.float32)
        rgb = np.zeros((H, W, 3), np.float32)
        for _ in range(n):
            x, y = rng.random() * W, rng.random() * H
            r = rng.uniform(0.7, 2.0) * (1.6 if rng.random() < 0.12 else 1)
            col = cols[int(rng.integers(len(cols)))]
            for oy in (-H, 0, H):
                g = np.exp(-(((xx - x) ** 2 + (yy - y - oy) ** 2) / (r * r)))
                g *= rng.uniform(0.55, 1.0)
                rgb += col * g[..., None]
                acc += g
        a = np.clip(acc, 0, 1)
        out[..., :3] = rgb / np.maximum(acc, 1e-6)[..., None]
        out[..., 3] = a
    else:
        n = int(density * W * H / 200)
        for _ in range(n):
            x, y = rng.random() * W, rng.random() * H
            col = cols[int(rng.integers(len(cols)))]
            put(x, y, col, 1.0)
            if kind == "twinkle" and rng.random() < 0.25:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    put(x + dx, y + dy, col, 1.0)
            elif era in ("g5", "g3") and rng.random() < 0.3:
                put(x + 1, y, col, 1.0)
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)
