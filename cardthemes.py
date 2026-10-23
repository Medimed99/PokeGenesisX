"""Les scenes des legendaires, une par espece.

Chaque theme est une petite peinture procedurale en coordonnees normalisees.
Il recoit la toile (Ctx) ou la boite du sujet est deja placee, et renvoie
l'image lisse ; l'ecriture de l'epoque (teintes, trame) vient ensuite.

META donne pour chacun : le titre de la scene (affiche sur la carte), si le
legendaire flotte ou se tient au sol, la couleur de sa lumiere, et les
particules qui animent la carte agrandie.
"""
import numpy as np
from cardscene import (hexc, mix, smooth, vgrad, over, add, screen, disc, gauss, ellipse, rays,
                       ridge, poly, lines, bolt, stars, mountains, cloudband, halo, ground_shadow,
                       vignette, sea, reflect, aurora, noise, noise1, blur, rain)

# fx : (mouvement, [couleurs], densite)
#   fall : tombe   rise : monte   drift : derive en biais   rain : pluie   twinkle : scintille
META = {
    144: dict(t="Pics gelés à l'aube",          fly=True,  light="#dff4ff", fx=("fall",    ["#ffffff", "#cfe8ff"], 0.9)),
    145: dict(t="Cœur de l'orage",              fly=True,  light="#ffe873", fx=("rain",    ["#c9c4ff", "#ffffff"], 1.0), g1=2.1),
    146: dict(t="Ciel de cendres",              fly=True,  light="#ffc46b", fx=("rise",    ["#ffcf6b", "#ff7a2f"], 1.0), g1=1.6),
    150: dict(t="La caverne d'origine",         fly=False, light="#d98bff", fx=("rise",    ["#f0b8ff", "#9d7bff"], 0.6)),
    151: dict(t="La jungle d'avant les noms",   fly=True,  light="#ffd0ec", fx=("drift",   ["#fff3c4", "#ffd0ec"], 0.7)),
    243: dict(t="Plaine sous l'orage",          fly=False, light="#ffe25e", fx=("rain",    ["#b8c4ff", "#ffffff"], 1.0)),
    244: dict(t="Le volcan s'éveille",          fly=False, light="#ffb04a", fx=("rise",    ["#ffd27a", "#ff6a1f"], 1.0)),
    245: dict(t="Lac sous l'aurore",            fly=False, light="#8ff3ff", fx=("twinkle", ["#e8ffff", "#9ff7ff"], 0.8)),
    249: dict(t="Tempête sur les îles",         fly=True,  light="#e4f0ff", fx=("rain",    ["#c6d6ff", "#ffffff"], 1.0)),
    250: dict(t="Arc-en-ciel au couchant",      fly=True,  light="#ffd56b", fx=("fall",    ["#ffe9a0", "#ffb84a"], 0.7)),
    251: dict(t="La forêt hors du temps",       fly=True,  light="#d8ffc4", fx=("rise",    ["#efffc0", "#9cf08a"], 0.7)),
    377: dict(t="Les ruines du désert",         fly=False, light="#ffc070", fx=("drift",   ["#f6cf8f", "#e0a060"], 0.8)),
    378: dict(t="La caverne de glace",          fly=False, light="#bff4ff", fx=("fall",    ["#ffffff", "#bff4ff"], 0.6)),
    379: dict(t="La chambre d'acier",           fly=False, light="#dfe8ff", fx=("twinkle", ["#ffffff", "#ffd58a"], 0.7)),
    380: dict(t="Crépuscule sur la mer du Sud", fly=True,  light="#ffb3c6", fx=("drift",   ["#ffe0ea", "#ffc0d0"], 0.6)),
    381: dict(t="Nuit sur la mer du Sud",       fly=True,  light="#a8d4ff", fx=("twinkle", ["#ffffff", "#bfe0ff"], 0.8)),
    382: dict(t="Le grand déluge",              fly=True,  light="#7fe8ff", fx=("rain",    ["#9fdcff", "#ffffff"], 1.2)),
    383: dict(t="La terre de magma",            fly=False, light="#ffb35a", fx=("rise",    ["#ffcf6b", "#ff5a1f"], 1.0)),
    384: dict(t="Au-dessus des nuages",         fly=True,  light="#b8ffd8", fx=("twinkle", ["#ffffff", "#c8ffe0"], 0.8)),
    385: dict(t="La comète millénaire",         fly=True,  light="#fff0a0", fx=("twinkle", ["#ffffff", "#fff3b0"], 1.0)),
    386: dict(t="Fragment d'espace",            fly=True,  light="#ffb38a", fx=("drift",   ["#ffd0b0", "#9ff0ff"], 0.6)),
    0:   dict(t="Sans index",                   fly=True,  light="#b48cff", fx=("twinkle", ["#35f0d6", "#ff3d7f"], 0.9)),
    # la carte que personne n'a emise : Porygon-Z, ecrit a la main a l'entree 387 (fin ECRIRE)
    474: dict(t="L'entrée n° 387",              fly=True,  light="#9ff8ec", fx=("rise",    ["#9ff8ec", "#ff8fd0"], 0.55)),
}


# ------------------------------------------------------------------ briques
def _ground(c, img, top, col_top, col_bot, seed, rough=0.02, freq=7):
    h = top - rough * noise1(c.X[0], freq, seed, 3)
    m = c.edge((c.V - h[None, :]) * c.H)
    t = np.clip((c.V - top) / (1 - top + 1e-6), 0, 1)
    over(img, mix(hexc(col_top), hexc(col_bot), t ** 0.8), m)
    return h, m


def leaf(c, x, y, L, Wd, ang):
    """Feuille effilee : L sa longueur, Wd sa demi-largeur (unites de X), ang en radians."""
    ca, sa = np.cos(ang), np.sin(ang)
    dx, dy = c.X - x, (c.V - y) * c.A
    u = (dx * ca + dy * sa) / L
    v = (-dx * sa + dy * ca) / Wd
    w = np.sin(np.pi * np.clip(u, 0, 1)) ** 0.75
    return c.edge((w - np.abs(v)) * Wd * c.W) * (u > 0) * (u < 1)


def frond(c, img, x, y, L, ang, col, rim, k_leaves=9, seed=0):
    """Une palme : une tige et des folioles."""
    rng = np.random.default_rng(seed)
    ca, sa = np.cos(ang), np.sin(ang)
    for i in range(k_leaves):
        t = (i + 0.5) / k_leaves
        px, py = x + ca * L * t, y + sa * L * t / c.A
        for side in (-1, 1):
            a = ang + side * (0.9 - 0.4 * t) + rng.uniform(-0.1, 0.1)
            m = leaf(c, px, py, L * (0.42 - 0.22 * t), L * 0.055, a)
            over(img, mix(hexc(col), hexc(rim), 0.15 * rng.random()), m)
    stem = lines(c, [[(x, y), (x + ca * L, y + sa * L / c.A)]], 1.0 if not c.hd else 2.0)
    over(img, hexc(col), stem)


def cone(c, xc, top, slope, seed, crater=0.035):
    x = c.X[0]
    d = np.abs(x - xc)
    n = noise1(x, 11, seed, 3)
    h = top + slope * d ** 1.15 + 0.03 * (n - 0.5) * np.clip(d / 0.08, 0, 1)
    if crater > 0:
        h = np.where(d < crater, top + 0.012 - 0.008 * (1 - d / crater), h)
    return h, c.edge((c.V - h[None, :]) * c.H)


def island(c, x, w, hgt, hz, seed):
    """Ilot rocheux : un dome irregulier pose sur l'horizon."""
    xs = c.X[0]
    u = np.clip(1 - ((xs - x) / w) ** 2, 0, 1)
    n = noise1(xs, 18, seed, 3)
    top = hz - hgt * (u ** 0.35) * (0.75 + 0.35 * n) * (u > 0)
    return c.edge((c.V - top[None, :]) * c.H) * (c.V < hz + 0.004) * (u[None, :] > 0)


def mesa(c, base, amp, freq, seed):
    x = c.X[0]
    n = noise1(x, freq, seed, 3)
    n = np.clip((n - 0.42) * 3.2, 0, 1)
    h = base - amp * n
    return h, c.edge((c.V - h[None, :]) * c.H)


def moon(c, img, x, y, r, col, glow, k=1.0):
    d = np.sqrt((c.X - x) ** 2 + (c.Y - y * c.A) ** 2)
    m = c.edge((r - d) * c.W)
    cr = noise(c, 22, int(x * 1000) + 3, 3)
    face = mix(hexc(col), hexc(col) * 0.82, smooth(0.5, 0.75, cr))
    screen(img, hexc(glow), gauss(c, x, y, r * 4.5) * 0.55 * k)
    over(img, face, m * k)


def comet(c, img, x, y, ang, length, col, head=0.012):
    ca, sa = np.cos(ang), np.sin(ang)
    dx, dy = c.X - x, (c.V - y) * c.A
    u = -(dx * ca + dy * sa)                    # derriere la tete
    v = -dx * sa + dy * ca
    w = 0.004 + 0.05 * np.clip(u / length, 0, 1)
    tail = np.exp(-(v / w) ** 2) * np.clip(1 - u / length, 0, 1) ** 1.6 * (u > 0)
    screen(img, hexc(col), tail * 0.85)
    screen(img, hexc("#ffffff"), gauss(c, x, y, head) * 1.2)
    screen(img, hexc(col), gauss(c, x, y, head * 4) * 0.5)


def planet(c, img, cx, cy, r, col, dark, rim, lx, ly):
    d = np.sqrt((c.X - cx) ** 2 + (c.Y - cy * c.A) ** 2)
    m = c.edge((r - d) * c.W)
    nx, ny = (c.X - cx) / r, (c.Y - cy * c.A) / r
    lit = np.clip(nx * lx + ny * ly, 0, 1)
    face = mix(hexc(dark), hexc(col), lit ** 1.5)
    bands = noise(c, 3, 77, 3, sx=0.4, sy=6)
    face = mix(face, face * 1.25, smooth(0.5, 0.8, bands) * 0.5)
    over(img, face, m)
    edge = np.exp(-((d - r) / 0.012) ** 2) * np.clip(0.3 + lit * 1.4, 0, 1)
    screen(img, hexc(rim), edge)
    screen(img, hexc(rim), np.exp(-np.clip(d - r, 0, None) / 0.05) * (d > r) * 0.4)


def rainbow(c, img, cx, cy, r, w, k=0.55):
    d = np.sqrt((c.X - cx) ** 2 + (c.Y - cy * c.A) ** 2)
    t = (d - r) / w
    bands = ["#9b5cff", "#4d7bff", "#38d8ff", "#4dff8a", "#fff35c", "#ffa53a", "#ff4d4d"]
    cols = np.array([hexc(b) for b in bands])
    tt = np.clip((t + 1) / 2, 0, 1) * (len(bands) - 1)
    i0 = np.floor(tt).astype(int).clip(0, len(bands) - 2)
    f = tt - i0
    col = cols[i0] * (1 - f[..., None]) + cols[i0 + 1] * f[..., None]
    a = np.clip(1 - np.abs(t), 0, 1) ** 0.6 * (np.abs(t) < 1)
    screen(img, col, a * k)


def pagoda(c, x, base, s):
    """Tour a etages, en silhouette."""
    pts = []
    m = np.zeros_like(c.X)
    y = base
    for k in range(5):
        w = s * (0.11 - k * 0.016)
        hb = s * 0.05
        body = poly(c, [(x - w * 0.62, y), (x + w * 0.62, y), (x + w * 0.62, y - hb), (x - w * 0.62, y - hb)])
        roof = poly(c, [(x - w * 1.25, y - hb + s * 0.004), (x + w * 1.25, y - hb + s * 0.004),
                        (x + w * 0.7, y - hb - s * 0.022), (x - w * 0.7, y - hb - s * 0.022)])
        m = np.maximum(m, np.maximum(body, roof))
        y -= hb + s * 0.02
    spire = poly(c, [(x - s * 0.006, y), (x + s * 0.006, y), (x, y - s * 0.06)])
    return np.maximum(m, spire)


def stalactites(c, img, seed, n, col, rim, top=0.0, length=0.2, floor=False, base=1.0):
    rng = np.random.default_rng(seed)
    for k in range(n):
        x = rng.random()
        w = rng.uniform(0.012, 0.035)
        L = length * rng.uniform(0.4, 1.0) * (0.55 + 0.9 * abs(x - 0.5))
        if floor:
            pts = [(x - w, base), (x + w, base), (x + rng.uniform(-0.01, 0.01), base - L)]
        else:
            pts = [(x - w, top), (x + w, top), (x + rng.uniform(-0.01, 0.01), top + L)]
        m = poly(c, pts)
        over(img, hexc(col), m)
        if rim:
            half = poly(c, [(x - w * 0.15, pts[0][1]), (x + w, pts[1][1]), pts[2]])
            over(img, hexc(rim), half * 0.55)


def dots(c, x, y, nx, ny, step, r):
    m = np.zeros_like(c.X)
    for i in range(nx):
        for j in range(ny):
            m = np.maximum(m, ellipse(c, x + i * step, y + j * step / c.A, r, r / c.A))
    return m


def crest_waves(c, img, top, n, col_far, col_near, deep, foam, seed, light=None, amp_near=0.075):
    """Houle en perspective, du large vers le premier plan : petites vagues serrees au
    loin, grandes cretes pointues devant ; chaque crete porte une ecume brisee."""
    x = c.X[0]
    for k in range(n):
        t = k / max(1, n - 1)
        base = top + (1.02 - top) * (t ** 1.25)
        amp = 0.008 + amp_near * t ** 1.4
        freq = 10 - 7 * t
        nz = noise1(x, freq, seed + k * 7, 3)
        r = 1 - np.abs(2 * nz - 1)                      # cretes pointues
        h = base - amp * (0.35 + 0.65 * r ** 1.6)
        m = c.edge((c.V - h[None, :]) * c.H)
        d = np.clip((c.V - h[None, :]) / (0.03 + amp * 1.6), 0, 1)
        top_col = mix(hexc(col_far), hexc(col_near), t)
        body = mix(top_col, hexc(deep), d ** 0.7)
        if light is not None:
            colw = np.exp(-((c.X - light[0]) / (0.07 + 0.2 * t)) ** 2)
            body = mix(body, hexc(light[1]), colw * (1 - d) * 0.55)
        over(img, body, m)
        fz = noise(c, 14 - 8 * t, seed + 40 + k, 2, sx=0.6, sy=1.0)
        band = m * c.edge((h[None, :] + (1.0 + 2.5 * t if c.hd else 1.0) * c.pv - c.V) * c.H)
        over(img, hexc(foam), band * smooth(0.35, 0.6, fz) * (0.4 + 0.6 * t))


def trails(c, img, col, n, seed, k=0.6, side=-1):
    """Trainees de vitesse derriere le sujet."""
    rng = np.random.default_rng(seed)
    x0, y0, x1, y1 = c.box
    for i in range(n):
        y = y0 + (y1 - y0) * rng.uniform(0.15, 0.85)
        start = (x0 + (x1 - x0) * rng.uniform(0.1, 0.4)) if side < 0 else (x1 - (x1 - x0) * rng.uniform(0.1, 0.4))
        L = rng.uniform(0.25, 0.6)
        end = start - L if side < 0 else start + L
        w = (1.2 if not c.hd else 1.6) * c.pv * rng.uniform(0.8, 1.4)
        lo, hi = min(start, end), max(start, end)
        along = np.clip((c.X - end) / (start - end), 0, 1)
        m = c.edge((w - np.abs(c.V - y)) * c.H) * (c.X >= lo) * (c.X <= hi) * along ** 1.6
        screen(img, hexc(col), m * k)


def glint_field(c, img, col, density, seed, ymin, ymax, k=0.9):
    s = stars(c, density, seed)
    zone = smooth(ymin, ymin + 0.03, c.V) * (1 - smooth(ymax - 0.03, ymax, c.V))
    screen(img, hexc(col), s * zone * k)


# ------------------------------------------------------------------ Kanto
def th_144(c):
    """Artikodin : pics gelés, aurore pâle, neige."""
    s = c.seed
    img = vgrad(c, [(0, "#060f28"), (0.28, "#163a74"), (0.52, "#4f86c8"), (0.68, "#bcd9f6"), (1, "#e8f4ff")])
    screen(img, hexc("#ffffff"), stars(c, 1.0, s + 1, ymax=0.45) * smooth(0.5, 0.05, c.V))
    aurora(c, img, 0.16, 0.14, "#8af5d4", "#8a92ff", s + 2, k=0.6, width=0.06)
    halo(c, img, "#e9f7ff", r=0.62, k=0.62, rays_n=11, rays_k=0.18, seed=s + 3)
    L = (c.cx, c.cy)
    for k, (base, amp, freq, col, fog) in enumerate([(0.66, 0.3, 2.4, "#6d97cf", 0.45), (0.75, 0.22, 3.1, "#2e5294", 0.18)]):
        h, m = ridge(c, base, amp, freq, s + 4 + k * 13, sharp=0.8)
        depth = np.clip((c.V - h[None, :]) / 0.3, 0, 1)
        tone = mix(hexc(col) * 1.1, hexc(col) * 0.7, depth)
        snowline = 0.05 + 0.05 * noise(c, 14, s + 30 + k, 3)
        tone = mix(tone, hexc("#f2f8ff"), smooth(snowline + 0.02, snowline - 0.01, c.V - h[None, :]) * 0.95)
        tone = mix(tone, img, fog)
        over(img, tone, m)
    h, m = ridge(c, 0.86, 0.07, 1.6, s + 7, sharp=0.15)
    t = np.clip((c.V - h[None, :]) / 0.14, 0, 1)
    over(img, mix(hexc("#f6faff"), hexc("#7f9fd0"), t ** 0.9), m)
    drift = noise(c, 6, s + 8, 3, sx=0.3, sy=2.5)
    over(img, hexc("#a9c3ea"), m * smooth(0.55, 0.62, drift) * 0.5)
    glint_field(c, img, "#ffffff", 2.0, s + 9, 0.84, 1.0, 0.8)
    vignette(c, img, 0.42, 0.2)
    return img


def th_145(c):
    """Électhor : un orage vu de l'intérieur."""
    s = c.seed
    img = vgrad(c, [(0, "#06050e"), (0.35, "#17142e"), (0.65, "#2e2850"), (0.85, "#1a1630"), (1, "#0b0916")])
    L = (c.cx, c.cy - 0.04, 0.45)
    cloudband(c, img, 0.0, 0.62, 2.6, 0.46, "#0f0c1d", "#6c5fa0", s + 1, light=L, alpha=0.95)
    for k, (x0, x1) in enumerate([(0.12, 0.2), (0.86, 0.78)]):
        segs = bolt(c, x0, 0.02, x1, 0.6, s + 10 + k, depth=6, jitter=0.2, branches=2)
        m = lines(c, segs, 1.0 if not c.hd else 1.6)
        screen(img, hexc("#e9e4ff"), blur(c, m, 0.012) * 1.6)
        screen(img, hexc("#ffffff"), m)
    halo(c, img, "#ffe873", r=0.6, k=0.95, rays_n=8, rays_k=0.45, seed=s + 3, width=0.05)
    cloudband(c, img, 0.5, 0.8, 3.0, 0.52, "#0d0a19", "#5a4d8c", s + 2, light=L, alpha=0.9, sx=0.4)
    h, m = mesa(c, 0.86, 0.1, 2.0, s + 5)
    over(img, hexc("#0b0916"), m)
    rim = m * c.edge((h[None, :] + (1.5 if c.hd else 1) * c.pv - c.V) * c.H)
    over(img, hexc("#6c5fa0"), rim * 0.7)
    vignette(c, img, 0.5, 0.3)
    return img


def th_146(c):
    """Sulfura : un ciel de cendres au-dessus des volcans."""
    s = c.seed
    img = vgrad(c, [(0, "#14030b"), (0.3, "#4c0b14"), (0.55, "#a62a17"), (0.72, "#f07a32"), (0.8, "#ffb35c"), (1, "#3a0a06")])
    L = (c.cx, c.cy - 0.04, 0.5)
    cloudband(c, img, 0.0, 0.5, 2.4, 0.5, "#2a060b", "#c2481f", s + 1, light=L, alpha=0.85)
    halo(c, img, "#ffd27a", r=0.6, k=1.0, rays_n=9, rays_k=0.35, seed=s + 3)
    for k, (x, top, slope) in enumerate([(0.18, 0.6, 1.1), (0.86, 0.66, 1.3)]):
        h, m = cone(c, x, top, slope, s + 20 + k)
        t = np.clip((c.V - h[None, :]) / 0.25, 0, 1)
        over(img, mix(hexc("#4a1209"), hexc("#140405"), t), m)
        lip = gauss(c, x, top + 0.01, 0.05) * m
        screen(img, hexc("#ffb347"), lip * 1.3)
        screen(img, hexc("#ff9a3a"), gauss(c, x, top - 0.03, 0.09) * 0.5)
        flow = lines(c, [[(x, top + 0.012), (x + 0.025, top + 0.07), (x + 0.005, top + 0.14), (x + 0.04, 0.88)]],
                     1.2 if not c.hd else 2.2)
        screen(img, hexc("#ff8a2a"), flow * 0.95 + blur(c, flow, 0.01) * 0.6)
    _ground_lava(c, img, 0.85, s + 6)
    vignette(c, img, 0.5, 0.3)
    return img


def _ground_lava(c, img, top, seed, glow="#ff6a1f", base="#120404"):
    h, m = ridge(c, top, 0.04, 3.0, seed, sharp=0.3)
    over(img, hexc(base), m)
    n = noise(c, 9, seed + 1, 4, sx=0.8, sy=1.6)
    crack = 1 - np.abs(2 * n - 1)
    g = smooth(0.92, 0.985, crack) * m * (0.6 + 0.4 * smooth(top, 1.0, c.V))
    screen(img, hexc(glow), g * 1.2)
    screen(img, hexc(glow), blur(c, g, 0.012) * 0.5)
    return h


def th_150(c):
    """Mewtwo : une caverne d'avant l'histoire, des cristaux, l'anneau psychique."""
    s = c.seed
    img = vgrad(c, [(0, "#05030c"), (0.35, "#170a2e"), (0.62, "#3a1868"), (1, "#0a0516")])
    halo(c, img, "#d98bff", r=0.66, k=0.95, rays_n=7, rays_k=0.3, seed=s + 3)
    # voute et parois : la roche encadre la lumiere
    for side in (0, 1):
        x = c.X if side == 0 else 1 - c.X
        n = noise1(c.V[:, 0], 7.0, s + 20 + side, 4)
        edge = 0.06 + 0.12 * n[:, None] + 0.1 * smooth(0.55, 1.0, c.V)
        m = c.edge((edge - x) * c.W)
        over(img, hexc("#0a0616"), m)
        rim = m * c.edge((x - edge + (1.6 if c.hd else 1) * c.px) * c.W)
        screen(img, hexc("#9a62e6"), rim * 0.65)
    stalactites(c, img, s + 40, 13, "#0a0616", "#3d2370", top=0.0, length=0.22)
    # anneau psychique
    d = np.sqrt(((c.X - c.cx) / 0.47) ** 2 + ((c.V - (c.cy + 0.03)) / 0.11) ** 2)
    ring = np.exp(-((d - 1) / 0.055) ** 2)
    back = c.V < c.cy + 0.03
    screen(img, hexc("#ff9cf0"), ring * np.where(back, 0.5, 0.95))
    _ground(c, img, c.box[3] - 0.004, "#2a1450", "#07040f", s + 5, rough=0.015)
    rng = c.rng(30)
    for k in range(8):
        x = [0.07, 0.19, 0.3, 0.71, 0.82, 0.93, 0.42, 0.6][k] + rng.uniform(-0.02, 0.02)
        base = c.box[3] + rng.uniform(0.0, 0.07)
        hgt = rng.uniform(0.07, 0.17) * (0.55 if 0.35 < x < 0.65 else 1)
        w = rng.uniform(0.02, 0.04)
        lean = rng.uniform(-0.03, 0.03)
        pts = [(x - w, base), (x + lean - w * 0.2, base - hgt), (x + lean + w * 0.25, base - hgt * 1.08), (x + w, base)]
        m = poly(c, pts)
        lit = poly(c, [(x - w * 0.1, base), (x + lean, base - hgt), (x + lean + w * 0.25, base - hgt * 1.08), (x + w, base)])
        over(img, hexc("#5a2a9a"), m)
        over(img, hexc("#c49cff"), lit * 0.85)
        screen(img, hexc("#d98bff"), blur(c, m, 0.02) * 0.35)
    ground_shadow(c, img, 0.6)
    vignette(c, img, 0.5, 0.3)
    return img


def th_151(c):
    """Mew : la jungle d'avant les noms, un temple dans la brume."""
    s = c.seed
    img = vgrad(c, [(0, "#0c2b3d"), (0.32, "#2b6a78"), (0.55, "#8fc7bb"), (0.7, "#ffd9c7"), (1, "#2f5a44")])
    halo(c, img, "#fff0f6", r=0.55, k=0.6, rays_n=10, rays_k=0.22, seed=s + 3)
    base, x = 0.72, 0.5
    stone = mix(hexc("#5f8f8c"), hexc("#a9d2c4"), 0.45)
    for k in range(5):
        w = 0.25 - k * 0.043
        y1 = base - k * 0.036
        over(img, stone, poly(c, [(x - w, y1), (x + w, y1), (x + w * 0.96, y1 - 0.036), (x - w * 0.96, y1 - 0.036)]))
    over(img, stone, poly(c, [(x - 0.035, base - 0.18), (x + 0.035, base - 0.18), (x + 0.035, base - 0.22), (x - 0.035, base - 0.22)]))
    fog = smooth(0.52, 0.78, c.V) * (1 - smooth(0.8, 0.96, c.V))
    over(img, hexc("#d9efe2"), fog * 0.55)
    _ground(c, img, 0.87, "#1f4434", "#0a1a12", s + 5, rough=0.03)
    # palmes qui encadrent la scene
    rng = c.rng(40)
    for (x0, y0, ang, L) in [(-0.04, 0.12, 0.35, 0.42), (-0.05, 0.45, -0.1, 0.36), (-0.02, 0.86, -0.55, 0.4),
                             (1.04, 0.08, np.pi - 0.3, 0.44), (1.05, 0.5, np.pi + 0.12, 0.36), (1.02, 0.9, np.pi + 0.6, 0.38)]:
        frond(c, img, x0, y0, L, ang, "#0f3324", "#2f6f4c", 8, seed=int(rng.integers(1e6)))
    d = np.sqrt(((c.X - c.cx) / (c.bw * 0.7)) ** 2 + ((c.V - c.cy) / (c.bh * 0.64)) ** 2)
    shell = np.exp(-((d - 1) / 0.07) ** 2) * 0.5 + smooth(1.0, 0.0, d) * 0.1
    screen(img, hexc("#ffd6f0"), shell)
    vignette(c, img, 0.42, 0.22)
    return img


# ------------------------------------------------------------------ Johto
def th_243(c):
    """Raikou : la plaine sous l'orage, un éclair derrière lui."""
    s = c.seed
    img = vgrad(c, [(0, "#08071a"), (0.4, "#221c44"), (0.62, "#4a3f73"), (0.7, "#6d5f8f"), (1, "#0d0b1a")])
    L = (c.cx, c.cy - 0.05, 0.45)
    cloudband(c, img, 0.0, 0.58, 2.2, 0.47, "#100d22", "#6a5c9c", s + 1, light=L, alpha=0.95)
    segs = bolt(c, 0.3, 0.0, 0.42, 0.68, s + 11, depth=7, jitter=0.17, branches=3)
    m = lines(c, segs, 1.0 if not c.hd else 2.0)
    screen(img, hexc("#fff6b0"), blur(c, m, 0.016) * 1.5)
    screen(img, hexc("#ffffff"), m)
    halo(c, img, "#ffe25e", r=0.62, k=0.85, rays_n=9, rays_k=0.35, seed=s + 3)
    hz = c.box[3]
    h, m = ridge(c, hz - 0.02, 0.05, 2.5, s + 4, sharp=0.2)
    over(img, mix(hexc("#2a2347"), img, 0.35), m)
    _ground(c, img, hz, "#1d1833", "#07060e", s + 5, rough=0.005)
    # herbes hautes au premier plan
    rng = c.rng(50)
    segs = []
    for k in range(int(70 if c.hd else 30)):
        x = rng.random()
        y = rng.uniform(0.86, 1.0)
        hgt = rng.uniform(0.04, 0.1)
        segs.append([(x, y), (x + rng.uniform(-0.03, 0.03), y - hgt)])
    gr = lines(c, segs, 1.0 if not c.hd else 1.6)
    over(img, hexc("#05040b"), gr)
    ground_shadow(c, img, 0.5)
    vignette(c, img, 0.5, 0.3)
    return img


def th_244(c):
    """Entei : le volcan s'éveille."""
    s = c.seed
    img = vgrad(c, [(0, "#0f0204"), (0.35, "#3d0a07"), (0.6, "#8e2410"), (0.7, "#d9541c"), (1, "#1a0503")])
    L = (c.cx, c.cy - 0.06, 0.5)
    cloudband(c, img, 0.0, 0.45, 2.6, 0.48, "#1c0406", "#a3361a", s + 1, light=L, alpha=0.9)
    h, m = cone(c, 0.5, 0.42, 1.25, s + 20, crater=0.06)
    t = np.clip((c.V - h[None, :]) / 0.3, 0, 1)
    over(img, mix(hexc("#3b0d07"), hexc("#120304"), t), m)
    screen(img, hexc("#ffb347"), gauss(c, 0.5, 0.41, 0.06) * 1.2)
    rng = c.rng(60)
    for k in range(5):
        a = -np.pi / 2 + rng.uniform(-0.7, 0.7)
        L2 = rng.uniform(0.08, 0.18)
        seg = [(0.5, 0.42), (0.5 + np.cos(a) * L2 * 0.6, 0.42 + np.sin(a) * L2 * 0.8 / c.A), (0.5 + np.cos(a) * L2, 0.42 + np.sin(a) * L2 / c.A + 0.04)]
        f = lines(c, [seg], 1.0 if not c.hd else 1.8)
        screen(img, hexc("#ffc060"), f * 0.9 + blur(c, f, 0.01) * 0.5)
    for k in range(3):
        x0 = 0.5 + rng.uniform(-0.05, 0.05)
        flow = lines(c, [[(x0, 0.43), (x0 + rng.uniform(-0.12, 0.12), 0.55), (x0 + rng.uniform(-0.2, 0.2), 0.7)]], 1.0 if not c.hd else 2.0)
        screen(img, hexc("#ff7a2a"), flow * 0.9 + blur(c, flow, 0.008) * 0.5)
    halo(c, img, "#ffb04a", r=0.62, k=0.8, rays_n=0, seed=s + 3)
    _ground_lava(c, img, c.box[3] - 0.01, s + 6, glow="#ff7a2a", base="#1a0605")
    ground_shadow(c, img, 0.55)
    vignette(c, img, 0.5, 0.3)
    return img


def th_245(c):
    """Suicune : un lac sous l'aurore."""
    s = c.seed
    img = vgrad(c, [(0, "#030a1c"), (0.3, "#0c2650"), (0.55, "#1d4c82"), (0.66, "#5a8fbf"), (1, "#05101f")])
    screen(img, hexc("#ffffff"), stars(c, 1.2, s + 1, ymax=0.6) * smooth(0.62, 0.1, c.V))
    aurora(c, img, 0.2, 0.18, "#5ff7d0", "#a77bff", s + 2, k=0.85, width=0.08)
    aurora(c, img, 0.3, 0.12, "#7affe8", "#5f7bff", s + 9, k=0.45, width=0.05)
    moon(c, img, 0.8, 0.12, 0.035, "#f2f6ff", "#bfe0ff", 0.9)
    halo(c, img, "#8ff3ff", r=0.55, k=0.7, rays_n=0, seed=s + 3)
    hz = c.box[3] - 0.01
    mountains(c, img, [(hz, 0.16, 2.6, "#123056", 0.35), (hz, 0.09, 4.0, "#0a1d38", 0.1)], s + 4)
    img = reflect(c, img, hz, k=0.62, ripple=0.01)
    lake = c.edge((c.V - hz) * c.H)
    over(img, hexc("#071a33"), lake * smooth(hz, 1.0, c.V) * 0.55)
    rip = noise(c, 5, s + 7, 3, sx=0.15, sy=4)
    over(img, hexc("#9ff7ff"), lake * smooth(0.62, 0.7, rip) * 0.35 * np.exp(-((c.X - c.cx) / 0.3) ** 2))
    mist = np.exp(-((c.V - hz) / 0.035) ** 2) * (0.5 + 0.5 * noise(c, 4, s + 8, 3, sx=0.3, sy=2))
    screen(img, hexc("#bfe8ff"), mist * 0.45)
    vignette(c, img, 0.48, 0.25)
    return img


def th_249(c):
    """Lugia : la tempête sur les îles, la lune qui perce."""
    s = c.seed
    img = vgrad(c, [(0, "#030713"), (0.4, "#0e2244"), (0.66, "#2b4d7f"), (1, "#050b16")])
    halo(c, img, "#e4f0ff", r=0.7, k=0.85, rays_n=9, rays_k=0.3, seed=s + 3)
    L = (c.cx, c.cy - 0.05, 0.42)
    cloudband(c, img, 0.0, 0.66, 2.3, 0.5, "#0a1428", "#7f9ccf", s + 1, light=L, alpha=0.92)
    hz = 0.72
    for x, w, hgt in [(0.07, 0.13, 0.15), (0.24, 0.06, 0.06), (0.93, 0.12, 0.19), (0.76, 0.05, 0.05)]:
        over(img, hexc("#081224"), island(c, x, w, hgt, hz, s + int(x * 100)))
    sea(c, img, hz, "#040a14", "#1d3a63", "#cfe2ff", c.cx, s + 5, sparkle=0.6)
    crest_waves(c, img, 0.76, 6, "#1d3a63", "#26507f", "#040a14", "#c8dcff", s + 6, light=(c.cx, "#9fc2f0"))
    vignette(c, img, 0.5, 0.28)
    return img


def th_250(c):
    """Ho-Oh : l'arc-en-ciel au couchant, une tour sur la colline."""
    s = c.seed
    img = vgrad(c, [(0, "#24103b"), (0.25, "#6b2752"), (0.48, "#d65a3c"), (0.62, "#ffad55"), (0.74, "#ffe3a0"), (1, "#5a2a1c")])
    rainbow(c, img, 0.5, 0.86, 0.62, 0.045, k=0.55)
    L = (c.cx, c.cy - 0.04, 0.5)
    cloudband(c, img, 0.42, 0.74, 2.8, 0.5, "#a8452e", "#ffe1a0", s + 1, light=L, alpha=0.9, sx=0.45)
    halo(c, img, "#ffd56b", r=0.62, k=0.95, rays_n=12, rays_k=0.4, seed=s + 3)
    h, m = ridge(c, 0.82, 0.08, 1.4, s + 4, sharp=0.1)
    over(img, hexc("#2a120f"), m)
    tw = pagoda(c, 0.17, 0.79, 1.0)
    over(img, hexc("#2a120f"), tw)
    screen(img, hexc("#ffb050"), blur(c, tw, 0.01) * 0.25)
    glint_field(c, img, "#ffe9a0", 1.2, s + 9, 0.05, 0.6, 0.6)
    vignette(c, img, 0.45, 0.25)
    return img


def th_251(c):
    """Celebi : la forêt hors du temps, la lumière qui tombe des cimes."""
    s = c.seed
    img = vgrad(c, [(0, "#0f3a22"), (0.3, "#1f5a35"), (0.6, "#2d6e45"), (0.8, "#173a26"), (1, "#06140c")])
    shafts = rays(c, 0.5, -0.25, 9, s + 2, width=0.035, reach=1.6, power=0.6)
    screen(img, hexc("#e9ffc8"), shafts * 0.45)
    rng = c.rng(70)
    for depth in (0.7, 0.45, 0.2):
        for k in range(5):
            x = rng.random()
            w = rng.uniform(0.025, 0.06) * (1.4 - depth)
            if abs(x - 0.5) < 0.18 and depth < 0.5:
                continue
            m = poly(c, [(x - w, -0.05), (x + w, -0.05), (x + w * 1.2, 1.05), (x - w * 1.2, 1.05)])
            over(img, mix(hexc("#0a2416"), img, depth), m)
            moss = m * c.edge(((x - w * 0.4) - c.X) * c.W)
            over(img, hexc("#3f8a52"), moss * (1 - depth) * 0.35)
    halo(c, img, "#d8ffc4", r=0.55, k=0.75, rays_n=0, seed=s + 3)
    glint_field(c, img, "#efffc0", 1.4, s + 9, 0.1, 0.9, 0.55)
    _ground(c, img, 0.88, "#14331f", "#050f09", s + 5, rough=0.03)
    for (x0, y0, ang, L) in [(-0.04, 0.96, -0.6, 0.38), (1.04, 0.98, np.pi + 0.7, 0.4), (0.25, 1.03, -1.2, 0.25), (0.78, 1.04, -2.0, 0.25)]:
        frond(c, img, x0, y0, L, ang, "#071a0f", "#2f6f4c", 8, seed=int(rng.integers(1e6)))
    vignette(c, img, 0.48, 0.25)
    return img


# ------------------------------------------------------------------ Hoenn
def th_377(c):
    """Regirock : la porte des ruines, au couchant, dans le sable."""
    s = c.seed
    img = vgrad(c, [(0, "#1d1226"), (0.28, "#5a2c2a"), (0.5, "#b5603a"), (0.64, "#f0a65e"), (0.72, "#ffd590"), (1, "#3a2216")])
    screen(img, hexc("#fff0c8"), disc(c, 0.5, 0.66, 0.24, 0.9) * 0.95)
    halo(c, img, "#ffc070", r=0.6, k=0.55, rays_n=12, rays_k=0.22, seed=s + 3)
    for k, (base, amp, col) in enumerate([(0.7, 0.06, "#b0603c"), (0.77, 0.05, "#80422a")]):
        h, m = ridge(c, base, amp, 1.2 + k * 0.6, s + 4 + k, sharp=0.05)
        t = np.clip((c.V - h[None, :]) / 0.1, 0, 1)
        over(img, mix(hexc(col) * 1.25, hexc(col), t), m)
    # la porte : deux montants massifs et un linteau brise
    stone, lit = hexc("#3a1c13"), hexc("#a8603a")
    for x, top in [(0.14, 0.2), (0.86, 0.26)]:
        w = 0.07
        m = poly(c, [(x - w, 0.86), (x + w, 0.86), (x + w * 0.92, top), (x - w * 0.95, top + 0.015)])
        over(img, stone, m)
        face = m * c.edge(((x + (0.04 if x < 0.5 else -0.04)) - c.X) * c.W * (1 if x < 0.5 else -1))
        over(img, lit, face * 0.5)
        over(img, hexc("#f2b46a"), dots(c, x - 0.025, top + 0.07, 3, 6, 0.025, 0.0065) * m * 0.8)
    lint = poly(c, [(0.04, 0.2), (0.4, 0.2), (0.43, 0.165), (0.36, 0.15), (0.04, 0.15)])
    over(img, stone, lint)
    over(img, lit, lint * c.edge((0.165 - c.V) * c.H) * 0.45)
    for x, w, hgt in [(0.3, 0.06, 0.045), (0.7, 0.05, 0.035)]:
        over(img, stone, poly(c, [(x - w, 0.84), (x + w, 0.84), (x + w * 0.8, 0.84 - hgt), (x - w * 0.6, 0.84 - hgt * 1.1)]))
    _ground(c, img, 0.84, "#9a5634", "#2a160d", s + 5, rough=0.012)
    haze = smooth(0.6, 0.86, c.V) * (1 - smooth(0.86, 1.0, c.V))
    over(img, hexc("#f6c88a"), haze * 0.18)
    ground_shadow(c, img, 0.5)
    vignette(c, img, 0.48, 0.25)
    return img


def th_378(c):
    """Regice : la caverne de glace."""
    s = c.seed
    img = vgrad(c, [(0, "#030912"), (0.35, "#0b2742"), (0.62, "#1d5a86"), (1, "#04101c")])
    halo(c, img, "#bff4ff", r=0.62, k=0.85, rays_n=8, rays_k=0.25, seed=s + 3)
    stalactites(c, img, s + 40, 16, "#0c2a45", "#8fe6ff", top=0.0, length=0.3)
    _ground(c, img, c.box[3] - 0.004, "#2a6a96", "#061424", s + 5, rough=0.01)
    stalactites(c, img, s + 41, 9, "#123a5e", "#bff4ff", floor=True, base=1.02, length=0.24)
    glint_field(c, img, "#ffffff", 1.6, s + 9, 0.0, 1.0, 0.6)
    ground_shadow(c, img, 0.5)
    vignette(c, img, 0.5, 0.25)
    return img


def th_379(c):
    """Registeel : la chambre d'acier, une porte de coffre derriere lui."""
    s = c.seed
    img = vgrad(c, [(0, "#05070b"), (0.45, "#141a23"), (0.7, "#232b37"), (1, "#05070a")])
    # nervures verticales des parois : chaque cote est modele, clair au centre
    u = (c.X * 9) % 1
    rib = 0.55 + 0.45 * np.cos((u - 0.5) * np.pi) ** 2
    img *= (0.55 + 0.45 * rib)[..., None]
    # la porte : des anneaux concentriques, des rivets, une lumiere qui la traverse
    cx, cy = c.cx, c.cy - 0.02
    d = np.sqrt((c.X - cx) ** 2 + (c.Y - cy * c.A) ** 2)
    door = c.edge((0.42 - d) * c.W)
    over(img, hexc("#1c232e"), door)
    for r0, w in [(0.42, 0.012), (0.36, 0.008), (0.27, 0.01), (0.16, 0.008)]:
        ring = np.exp(-((d - r0) / w) ** 2)
        screen(img, hexc("#8fa6c4"), ring * 0.5)
    ang = np.arctan2(c.Y - cy * c.A, c.X - cx)
    riv = np.exp(-((d - 0.39) / 0.008) ** 2) * (np.cos(ang * 18) > 0.92)
    screen(img, hexc("#dfe8ff"), riv * 0.9)
    spokes = (np.abs(np.sin(ang * 3)) < 0.06) * (d < 0.36) * (d > 0.17)
    over(img, hexc("#2c3644"), spokes * 0.8)
    halo(c, img, "#dfe8ff", r=0.55, k=0.75, rays_n=0, seed=s + 3)
    # sol de metal poli : il renvoie la lumiere
    fy = c.box[3] - 0.004
    floor = c.edge((c.V - fy) * c.H)
    over(img, mix(hexc("#3a4656"), hexc("#06080b"), smooth(fy, 1.0, c.V)), floor)
    refl = np.exp(-((c.X - c.cx) / 0.18) ** 2) * smooth(fy + 0.25, fy, c.V) * floor
    screen(img, hexc("#bcd2ff"), refl * 0.35)
    seams = floor * (np.abs(((c.X - 0.5) / (c.V - fy + 0.25) * 0.18 * 6) % 1 - 0.5) > 0.47)
    img *= (1 - seams * 0.35)[..., None]
    ground_shadow(c, img, 0.6)
    vignette(c, img, 0.55, 0.25)
    return img


def _southsea(c, sky, sun, glow, seacols, sun_y, sun_r, moon_mode, streak_col):
    s = c.seed
    img = vgrad(c, sky)
    if moon_mode:
        screen(img, hexc("#ffffff"), stars(c, 1.2, s + 1, ymax=0.6) * smooth(0.62, 0.1, c.V))
        moon(c, img, 0.24, 0.16, 0.05, "#f4f7ff", "#a8d4ff", 1.0)
    else:
        screen(img, hexc(sun), disc(c, 0.5, sun_y, sun_r, 0.8))
        screen(img, hexc(sun), gauss(c, 0.5, sun_y, sun_r * 3) * 0.6)
    halo(c, img, glow, r=0.58, k=0.75, rays_n=0, seed=s + 3)
    trails(c, img, streak_col, 9, s + 11, k=0.55, side=-1)
    hz = 0.72
    for x, w, hgt in [(0.08, 0.1, 0.05), (0.88, 0.14, 0.07)]:
        h, m = ridge(c, hz, hgt, 6, s + int(x * 100), sharp=0.2)
        over(img, hexc(seacols[2]), m * smooth(x - w - 0.02, x - w, c.X) * smooth(x + w + 0.02, x + w, c.X) * (c.V < hz + 0.005))
    lx = 0.5 if not moon_mode else 0.24
    sea(c, img, hz, seacols[0], seacols[1], streak_col, lx, s + 5, sparkle=0.58)
    crest_waves(c, img, 0.8, 5, seacols[1], seacols[1], seacols[0], streak_col, s + 6, light=(lx, streak_col), amp_near=0.05)
    vignette(c, img, 0.45, 0.25)
    return img


def th_380(c):
    """Latias : crépuscule sur la mer du Sud."""
    return _southsea(c, [(0, "#1e0d33"), (0.3, "#6a2556"), (0.5, "#d65a74"), (0.64, "#ffa98a"), (0.72, "#ffe2bf"), (1, "#2a1028")],
                     "#fff1d6", "#ffb3c6", ("#1a0a20", "#a8506a", "#2a0f22"), 0.71, 0.09, False, "#ffd0dc")


def th_381(c):
    """Latios : nuit sur la mer du Sud."""
    return _southsea(c, [(0, "#030616"), (0.3, "#0c1f55"), (0.55, "#2552a0"), (0.7, "#6ea6e8"), (1, "#040a1c")],
                     "#ffffff", "#a8d4ff", ("#030817", "#1c3f7a", "#060f26"), 0.7, 0.0, True, "#cfe6ff")


def th_382(c):
    """Kyogre : le grand déluge."""
    s = c.seed
    img = vgrad(c, [(0, "#01040a"), (0.4, "#061a30"), (0.66, "#0f3b5e"), (1, "#020810")])
    L = (c.cx, c.cy - 0.05, 0.45)
    cloudband(c, img, 0.0, 0.5, 2.4, 0.48, "#030c18", "#3f7aa8", s + 1, light=L, alpha=0.95)
    segs = bolt(c, 0.82, 0.0, 0.7, 0.5, s + 11, depth=6, jitter=0.2, branches=2)
    m = lines(c, segs, 1.0 if not c.hd else 1.6)
    screen(img, hexc("#bfefff"), blur(c, m, 0.014) * 1.3)
    screen(img, hexc("#ffffff"), m)
    halo(c, img, "#7fe8ff", r=0.62, k=0.85, rays_n=8, rays_k=0.3, seed=s + 3)
    r = rain(c, s + 12, density=0.7, angle=0.2, length=0.07)
    screen(img, hexc("#8fb8d8"), r * 0.35)
    crest_waves(c, img, 0.64, 8, "#0f3b5e", "#1a6a9a", "#020c18", "#d6f6ff", s + 6, light=(c.cx, "#4fd0ff"), amp_near=0.11)
    vignette(c, img, 0.5, 0.25)
    return img


def th_383(c):
    """Groudon : la terre de magma sous un soleil de sécheresse."""
    s = c.seed
    img = vgrad(c, [(0, "#170603"), (0.3, "#56170a"), (0.52, "#c24a1a"), (0.66, "#ff9a4a"), (1, "#1a0603")])
    screen(img, hexc("#fff0c0"), disc(c, c.cx, c.cy - 0.06, 0.34, 0.7) * 0.9)
    halo(c, img, "#ffb35a", r=0.62, k=0.75, rays_n=14, rays_k=0.3, seed=s + 3)
    for x, top, sl in [(0.1, 0.5, 2.0), (0.9, 0.46, 2.2), (0.24, 0.6, 2.8)]:
        h, m = cone(c, x, top, sl, s + int(x * 100), crater=0.0)
        t = np.clip((c.V - h[None, :]) / 0.3, 0, 1)
        over(img, mix(hexc("#4a1a0c"), hexc("#160604"), t), m)
    _ground_lava(c, img, c.box[3] - 0.012, s + 6, glow="#ff5a1f", base="#1c0805")
    n = noise(c, 3.5, s + 13, 3)
    cr = smooth(0.94, 0.99, 1 - np.abs(2 * n - 1)) * c.edge((c.V - c.box[3]) * c.H)
    screen(img, hexc("#ffb040"), cr)
    ground_shadow(c, img, 0.55)
    vignette(c, img, 0.5, 0.28)
    return img


def th_384(c):
    """Rayquaza : au-dessus des nuages, là où le ciel devient noir."""
    s = c.seed
    img = vgrad(c, [(0, "#010208"), (0.25, "#06132e"), (0.48, "#16467a"), (0.62, "#4fa6d6"), (0.7, "#c6f0ff"), (1, "#e6f6ff")])
    screen(img, hexc("#ffffff"), stars(c, 1.4, s + 1, ymax=0.5) * smooth(0.5, 0.05, c.V))
    aurora(c, img, 0.42, 0.06, "#7dffb8", "#3fd0ff", s + 2, k=0.45, width=0.05)
    halo(c, img, "#b8ffd8", r=0.62, k=0.75, rays_n=10, rays_k=0.25, seed=s + 3)
    # courbure de la planete
    d = np.sqrt((c.X - 0.5) ** 2 + (c.Y - 2.6 * c.A) ** 2)
    R = 2.6 * c.A - 0.68 * c.A
    edge = np.exp(-((d - R) / 0.01) ** 2)
    screen(img, hexc("#e8fbff"), edge * 0.9)
    below = c.edge((R - d) * c.W)
    over(img, mix(hexc("#a8d8f5"), hexc("#3d7fbf"), smooth(0.7, 1.0, c.V)), below * 0.7)
    cloudband(c, img, 0.68, 1.02, 3.2, 0.42, "#6f9fcf", "#ffffff", s + 4, light=(c.cx, 0.7, 0.5), alpha=0.95, sx=0.5)
    cloudband(c, img, 0.82, 1.02, 4.0, 0.45, "#5a86b8", "#f2fbff", s + 5, alpha=0.9, sx=0.5)
    vignette(c, img, 0.42, 0.15)
    return img


def th_385(c):
    """Jirachi : la comète millénaire."""
    s = c.seed
    img = vgrad(c, [(0, "#030217"), (0.35, "#120d42"), (0.62, "#33266e"), (0.8, "#7a5aa8"), (1, "#0d0a24")])
    band = np.exp(-(((c.V - 0.1 - c.X * 0.55)) / 0.12) ** 2)
    neb = noise(c, 3, s + 2, 5)
    screen(img, hexc("#9f8cff"), band * (0.3 + 0.5 * neb) * 0.6)
    screen(img, hexc("#ffffff"), stars(c, 2.6, s + 1, ymax=0.85) * smooth(0.9, 0.3, c.V))
    comet(c, img, 0.78, 0.1, np.pi * 0.83, 0.75, "#bfe8ff")
    halo(c, img, "#fff0a0", r=0.55, k=0.85, rays_n=6, rays_k=0.4, seed=s + 3, width=0.04)
    h, m = ridge(c, 0.86, 0.06, 1.5, s + 4, sharp=0.1)
    over(img, hexc("#0a0820"), m)
    over(img, hexc("#6b56a8"), m * c.edge((h[None, :] + (1.5 if c.hd else 1) * c.pv - c.V) * c.H) * 0.6)
    vignette(c, img, 0.45, 0.25)
    return img


def th_386(c):
    """Deoxys : un fragment d'espace, une planète, un météore."""
    s = c.seed
    img = vgrad(c, [(0, "#020108"), (0.5, "#0a0620"), (1, "#020108")])
    n1 = noise(c, 2.2, s + 2, 5)
    n2 = noise(c, 3.0, s + 5, 5)
    screen(img, hexc("#c0346f"), smooth(0.45, 0.85, n1) * 0.55)
    screen(img, hexc("#1fa3a8"), smooth(0.5, 0.9, n2) * 0.45)
    screen(img, hexc("#ffffff"), stars(c, 2.2, s + 1))
    comet(c, img, 0.2, 0.18, np.pi * 0.2, 0.4, "#ffb38a", head=0.009)
    halo(c, img, "#ffb38a", r=0.6, k=0.8, rays_n=8, rays_k=0.3, seed=s + 3)
    planet(c, img, 0.62, 1.32, 0.62, "#3a2a5a", "#07040f", "#ff9a6a", -0.4, -0.9)
    vignette(c, img, 0.45, 0.2)
    return img


def th_0(c):
    """Sans index : une scène qui ne tient pas."""
    s = c.seed
    img = vgrad(c, [(0, "#07040f"), (0.5, "#160c2c"), (1, "#05030a")])
    rng = c.rng(90)
    for k in range(18):
        y0 = rng.random()
        hgt = rng.uniform(0.004, 0.035)
        col = ["#8b5cf6", "#ff3d7f", "#35f0d6", "#2a1b46"][int(rng.integers(4))]
        x0 = rng.uniform(-0.2, 0.6)
        m = poly(c, [(x0, y0), (x0 + rng.uniform(0.2, 0.8), y0), (x0 + rng.uniform(0.2, 0.8), y0 + hgt), (x0, y0 + hgt)])
        over(img, hexc(col), m * rng.uniform(0.25, 0.7))
    blk = noise(c, 9, s + 4, 1)
    q = np.floor(blk * 6) / 6
    over(img, hexc("#2a1b46"), (q > 0.7) * 0.5)
    halo(c, img, "#b48cff", r=0.6, k=0.8, rays_n=6, rays_k=0.3, seed=s + 3)
    vignette(c, img, 0.5, 0.25)
    return img


def _ink_text(c, txt, size, x, y, font_paths, angle=0.0):
    """Un texte a l'encre, en masque (0..1) : centre en (x, y), en fractions de la carte."""
    from PIL import Image, ImageDraw, ImageFont
    font = None
    for fp in font_paths:
        try:
            font = ImageFont.truetype(fp, max(8, int(size * c.W)))
            break
        except Exception:
            continue
    if font is None:
        return np.zeros((c.H, c.W), np.float32)
    im = Image.new("L", (c.W, c.H), 0)
    d = ImageDraw.Draw(im)
    l, t, r, b = d.textbbox((0, 0), txt, font=font)
    d.text((x * c.W - (l + r) / 2, y * c.H - (t + b) / 2), txt, fill=255, font=font)
    if angle:
        im = im.rotate(angle, resample=Image.BICUBIC, center=(x * c.W, y * c.H))
    return np.asarray(im, np.float32) / 255


def _cursive(c, y0, x0, x1, seed, k=1.0):
    """Une ligne d'ecriture illisible : des boucles inegales le long d'une reglure."""
    from PIL import Image, ImageDraw
    rng = c.rng(seed)
    im = Image.new("L", (c.W, c.H), 0)
    d = ImageDraw.Draw(im)
    x = x0
    while x < x1:
        wl = rng.uniform(0.05, 0.16)                       # un mot
        n = int(wl * 70) + 6
        t = np.linspace(0, 1, n * 6)
        loops = rng.uniform(2.5, 5.5)
        xs = x + wl * t - 0.011 * np.sin(t * loops * 2 * np.pi)
        ys = y0 - (0.008 + 0.006 * rng.random()) * np.abs(np.sin(t * loops * np.pi)) ** 0.8 \
            - 0.012 * (rng.random() < 0.3) * np.exp(-((t - rng.random()) / 0.05) ** 2)
        pts = [(float(a * c.W), float(b * c.H)) for a, b in zip(xs, ys)]
        d.line(pts, fill=int(255 * k), width=max(1, round(c.W / 260)), joint="curve")
        x += wl + rng.uniform(0.02, 0.035)
    return np.asarray(im, np.float32) / 255


def th_474(c):
    """Porygon-Z : une page du journal, et le numero qu'on vient d'y ecrire a la main."""
    s = c.seed
    img = vgrad(c, [(0, "#efe2bd"), (0.45, "#e6d4a4"), (1, "#c9b07a")])
    fib = noise(c, 40, s + 1, 2, sx=0.35, sy=3.0)
    over(img, hexc("#b39a66"), smooth(0.55, 0.95, fib) * 0.16)
    stain = noise(c, 2.4, s + 2, 4)
    over(img, hexc("#a8894e"), smooth(0.6, 0.95, stain) * 0.18)
    # la reglure et la marge
    for k in range(1, 15):
        y = 0.06 + k * 0.064
        over(img, hexc("#8a7650"), np.exp(-((c.V - y) * c.H / 0.7) ** 2) * 0.22)
    over(img, hexc("#c0503a"), np.exp(-((c.X - 0.135) * c.W / 0.8) ** 2) * 0.35)
    fonts = ["/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf",
             "/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyretermes-italic.otf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"]
    ink = hexc("#3a2a18")
    # l'entree, comme on l'ecrit en haut d'une page : le numero, l'encre a peine seche
    head = _ink_text(c, "N° 387", 0.15, 0.6, 0.105, fonts, angle=-3)
    over(img, ink, blur(c, head, 0.003) * 0.25)
    over(img, ink, head * 0.62)
    # et le meme numero, en grand, repasse au crayon derriere lui
    big = _ink_text(c, "387", 0.5, 0.52, 0.47, fonts, angle=4)
    over(img, hexc("#6b5534"), big * 0.1)
    # quelques lignes d'ecriture, sous lui
    for i, y in enumerate((0.702, 0.766, 0.83)):
        over(img, ink, _cursive(c, y, 0.17, 0.86 - 0.1 * i, s + 10 + i) * 0.4)
    # une tache, une eclaboussure
    rng = c.rng(7)
    for _ in range(9):
        bx, by = 0.86 + rng.normal(0, 0.03), 0.14 + rng.normal(0, 0.03)
        over(img, ink, disc(c, bx, by, rng.uniform(0.002, 0.012), 1.0) * 0.55)
    # il n'est pas fait d'encre : une lumiere d'ecran autour de lui, cyan d'un cote, magenta de l'autre
    glow = gauss(c, c.cx, c.cy - 0.02, 0.3)
    screen(img, hexc("#7fe9f5"), glow * smooth(0.62, 0.3, c.X) * 0.32)
    screen(img, hexc("#ff8fd0"), glow * smooth(0.38, 0.7, c.X) * 0.28)
    halo(c, img, "#e6fbff", r=0.4, k=0.45)
    vignette(c, img, 0.42, 0.22)
    return img


THEMES = {k: globals()["th_%d" % k] for k in META}
