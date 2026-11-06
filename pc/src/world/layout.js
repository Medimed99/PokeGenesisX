/* ============================================================
   LA ROUTE 1 — le plan
   De Bourg Palette (sud, z > 0) à Jadielle (nord, z < 0). Un chemin
   de terre qui serpente, des carrés de hautes herbes de part et
   d'autre, des corniches qu'on ne descend que dans un sens (comme
   dans les jeux d'origine), un lac à l'ouest pour pêcher, et des
   arbres qui ferment la route. Au-delà : les données ne sont pas
   encore restaurées.
   Unités : mètres. y vers le haut, le nord vers -z.
   ============================================================ */
import { noiseFn, fbm, smooth, clamp, lerp, mulberry32 } from "../util.js";

export const BOUNDS = {x0:-46, x1:46, z0:-150, z1:150};       /* la zone de capture (le cœur, l'ancienne Route 1) */
export const GRID = {x0:-292, x1:292, z0:-420, z1:236, step:1}; /* le terrain : la zone, les cinq biomes autour, l'horizon */

/* le chemin, du sud au nord */
export const PATH_PTS = [[3,200],[3,160],[7,128],[-3,98],[8,66],[15,36],[6,6],[-6,-26],[-2,-58],[11,-90],[7,-122],[4,-160],[4,-210]];
export const PATH_W = 2.4;                                     /* demi-largeur */

/* les carrés de hautes herbes (centre, rayon) : là où vivent les Pokémon */
export const GRASS_PATCHES = [
  {x:-17, z:116, r:10}, {x:24, z:92, r:9}, {x:-21, z:58, r:12}, {x:31, z:36, r:9},
  {x:24, z:-8, r:11},   {x:-24, z:-10, r:9}, {x:-18, z:-52, r:10}, {x:24, z:-64, r:11},
  {x:-12, z:-108, r:9}, {x:26, z:-118, r:8}
];
/* les corniches : on saute vers le sud, jamais vers le nord */
export const LEDGES = [{z:80, drop:1.15}, {z:16, drop:1.1}, {z:-78, drop:1.2}];
/* le lac, à l'ouest */
export const LAKE = {x:-30, z:-32, rx:14, rz:21};

const n1 = noiseFn(11), n2 = noiseFn(23), n3 = noiseFn(37), n4 = noiseFn(51), n5 = noiseFn(67);

/* ---------- le chemin : une courbe, échantillonnée ---------- */
function catmull(p0, p1, p2, p3, t){
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
export const PATH = [];
for(let i = 0; i < PATH_PTS.length - 1; i++){
  const p0 = PATH_PTS[Math.max(0, i - 1)], p1 = PATH_PTS[i], p2 = PATH_PTS[i + 1], p3 = PATH_PTS[Math.min(PATH_PTS.length - 1, i + 2)];
  for(let k = 0; k < 24; k++){
    const t = k / 24;
    PATH.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
  }
}
PATH.push(PATH_PTS[PATH_PTS.length - 1]);
export function pathX(z){
  for(let i = 0; i < PATH.length - 1; i++){
    const a = PATH[i], b = PATH[i + 1];
    if((a[1] - z) * (b[1] - z) <= 0){ const t = (z - a[1]) / ((b[1] - a[1]) || 1); return lerp(a[0], b[0], t); }
  }
  return 0;
}
function distPath(x, z){
  let best = 1e9;
  for(let i = 0; i < PATH.length - 1; i++){
    const a = PATH[i], b = PATH[i + 1];
    if(Math.abs(a[1] - z) > 14 && Math.abs(b[1] - z) > 14) continue;
    const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L, 0, 1);
    const ex = a[0] + dx * t - x, ez = a[1] + dz * t - z;
    const d = ex * ex + ez * ez;
    if(d < best) best = d;
  }
  return Math.sqrt(best);
}

/* ---------- les zones ---------- */
export function lakeMask(x, z){
  const dx = (x - LAKE.x) / LAKE.rx, dz = (z - LAKE.z) / LAKE.rz;
  const d = Math.sqrt(dx * dx + dz * dz) + 0.16 * n4(x / 9, z / 9);
  return smooth(1.0, 0.72, d);
}
export function lakeShore(x, z){
  const dx = (x - LAKE.x) / LAKE.rx, dz = (z - LAKE.z) / LAKE.rz;
  const d = Math.sqrt(dx * dx + dz * dz) + 0.16 * n4(x / 9, z / 9);
  return smooth(1.75, 0.95, d);
}
export function grassPatch(x, z){
  let m = 0;
  for(const p of GRASS_PATCHES){
    const d = Math.hypot(x - p.x, z - p.z) / p.r + 0.28 * n5(x / 6, z / 6);
    m = Math.max(m, smooth(1.0, 0.86, d));
  }
  return m;
}

/* ---------- la hauteur, d'une formule ; le terrain la met en grille ---------- */
function ledgeStep(x, z){
  let h = 0;
  for(const L of LEDGES){
    const px = pathX(L.z);
    /* une brèche dans la corniche, là où passe le chemin : on y monte en pente douce */
    const gap = smooth(4.5, 8.5, Math.abs(x - px));
    const k = smooth(L.z + 0.18, L.z - 0.18, z);           /* au nord de la ligne : plus haut */
    const ramp = smooth(L.z + 7, L.z - 7, z);               /* dans la brèche, une rampe */
    h += L.drop * lerp(ramp, k, gap);
  }
  return h;
}
function baseHeight(x, z, dp){
  const slope = -z * 0.012;
  const big = 1.1 * fbm(n1, x / 70, z / 70, 3);
  const small = 0.28 * fbm(n2, x / 16, z / 16, 3);
  let h = slope + big + small * (1 - smooth(PATH_W + 1.5, PATH_W, dp));
  h += ledgeStep(x, z);
  /* les bords : la route est encaissée entre des collines boisées */
  const ax = Math.abs(x), edge = smooth(40, 78, ax);
  h += edge * (7 + 6 * fbm(n3, x / 34, z / 34, 3)) + smooth(72, 110, ax) * 10;
  const ez = Math.max(0, Math.abs(z) - 150);
  h += smooth(0, 60, ez) * 6;
  return h;
}
/* le niveau de l'eau suit le pré autour du lac : une rive basse, pas une falaise */
const LAKE_BASE = (() => { let s = 0, n = 0; for(let a = 0; a < 6.28; a += 0.4){ s += baseHeight(LAKE.x + Math.cos(a) * LAKE.rx * 1.25, LAKE.z + Math.sin(a) * LAKE.rz * 1.25, 99); n++; } return s / n; })();
export const WATER_Y = LAKE_BASE - 0.45;
function rawHeight(x, z, dp){
  let h = baseHeight(x, z, dp);
  /* autour du lac : le pré descend en pente douce vers une plage, puis le fond s'enfonce */
  const shore = lakeShore(x, z);
  if(shore > 0) h = lerp(h, Math.min(h, WATER_Y + 0.28 + (1 - shore) * 0.6), smooth(0, 1, shore));
  const lm = lakeMask(x, z);
  if(lm > 0){
    const bottom = WATER_Y - 0.25 - 2.4 * smooth(0.05, 1.0, lm);
    h = lerp(h, bottom, smooth(0.0, 0.4, lm));
  }
  return h;
}

/* ============================================================
   LES BIOMES, AUTOUR DE LA ZONE DE CAPTURE
   Les habitats du jeu mobile (HABITATS, 32-world) deviennent des
   vallées : on y entre à pied par un col taillé dans les collines.
   Chacun a son sol, son relief, sa lumière (biomes.js) ; la zone
   elle-même, au centre, est « Routes ouvertes ».
     · Sylve d'index (ouest) : une forêt d'arbres colossaux ;
     · Nappes (ouest, plus bas) : des vasques en terrasses ;
     · Cavités (est) : une caverne sous un plafond de roche ;
     · Ruines d'archive (est, en hauteur) : une bibliothèque en ruine ;
     · Foyer thermique (nord, au-delà de Jadielle) : une caldeira.
   ============================================================ */
const nB = noiseFn(131), nR = noiseFn(149), nL = noiseFn(173), nW = noiseFn(197), nE = noiseFn(223);
export const BIOMES = [
  {k:"foret",  i:1, c:[-182, 98],  r:[86, 92], A:[-43, 100], B:[-110, 100], w:6,   dy:-0.6, col:"#5ce07a"},
  {k:"eaux",   i:2, c:[-180, -66], r:[82, 72], A:[-43, -45], B:[-112, -50], w:6,   dy:-0.2, col:"#4fb2ff"},
  {k:"grotte", i:3, c:[180, 58],   r:[78, 80], A:[43, 58],   B:[110, 58],   w:6.5, dy:1.4,  col:"#c9a86a"},
  {k:"ruines", i:4, c:[182, -104], r:[82, 72], A:[43, -100], B:[112, -100], w:6,   dy:3.6,  col:"#b06bff"},
  {k:"foyer",  i:5, c:[0, -304],   r:[100, 94], A:[5, -146], B:[0, -218],   w:7,   dy:0.9,  col:"#ff8a3d"}
];
export const BIOME_BY = Object.fromEntries(BIOMES.map(b=>[b.k, b]));
/* les lieux des modules (la Tour, la Brèche, le camp…) : le sol s'aplanit sous leur parvis, et rien n'y pousse */
export const SITES = [
  {k:"tower",  mod:"tower",      screen:"tower",      n:"La Tour",      x:34,  z:-36, r:7.5, pr:10.5, col:"#35f0d6", d:"Les combats d'équipe, aile après aile"},
  {k:"boss",   mod:"boss",       screen:"boss",       n:"Les verrous",  x:22,  z:-54, r:3.6, pr:5.6,  col:"#ff3d7f", d:"Les Data Guardians, au sommet des ailes"},
  {k:"breche", mod:"breche",     screen:"breche",     n:"La Brèche",    x:-31, z:26,  r:4.2, pr:6.5,  col:"#ff3d7f", d:"La horde, et le gardien qui sort de la faille"},
  {k:"expe",   mod:"expedition", screen:"expedition", n:"L'Expédition", x:-25, z:137, r:5.5, pr:7.5,  col:"#ffc857", d:"Un parcours à embranchements, jusqu'au noyau"},
  {k:"forage", mod:"idle",       screen:"idle",       n:"Le Forage",    x:36,  z:116, r:5,   pr:7.5,  col:"#e0a85a", d:"Creuser les strates de l'archive"},
  {k:"raid",   mod:null,         screen:"social",     n:"Le raid",      x:-30, z:-68, r:4.5, pr:6,    col:"#ff6a3d", d:"Le boss de la semaine, avec les autres archivistes"},
  {k:"poker",  mod:"poker",      screen:"poker",      n:"Poké-Poker",   x:34,  z:6,   r:3.6, pr:5.2,  col:"#b06bff", d:"Des mains de cartes, des programmes empilés"}
];
export const siteClear = (x, z, m = 4) => SITES.some(s=>Math.hypot(x - s.x, z - s.z) < s.pr + m);
/* les biomes encore fermés (le jeu mobile décide : tant d'espèces au Pokédex) */
export const LOCKS = {foret:false, eaux:false, grotte:false, ruines:false, foyer:false};
/* (une petite marge : un col ne s'ouvre pas par erreur sur un arrondi de flottant) */
function ell(b, x, z){
  const dx = (x - b.c[0]) / b.r[0], dz = (z - b.c[1]) / b.r[1];
  return Math.sqrt(dx * dx + dz * dz) + 0.1 * nE(x / 40, z / 40);
}
export const biomeMask = (b, x, z) => smooth(1.04, 0.8, ell(b, x, z));
function segT(b, x, z){
  const ax = b.A[0], az = b.A[1], dx = b.B[0] - ax, dz = b.B[1] - az, L = dx * dx + dz * dz;
  const t = clamp(((x - ax) * dx + (z - az) * dz) / L, 0, 1);
  return {t, d:Math.hypot(ax + dx * t - x, az + dz * t - z)};
}
export function passMask(b, x, z){
  const q = segT(b, x, z);
  return {m:smooth(b.w + 7, b.w, q.d + 0.9 * nR(x / 9, z / 9)), t:q.t};
}
/* le plancher de chaque biome, au bout de son col */
for(const b of BIOMES) b.F = null;
/* les sentiers des biomes (la Nappe a sa chaussée de pierre ; la Cavité n'en a pas) */
export const TRAILS = {
  foret:[[-110, 100], [-128, 108], [-146, 96], [-160, 84], [-176, 92], [-182, 98]],
  eaux:[[-112, -50], [-132, -56], [-152, -50], [-172, -62], [-196, -70], [-222, -60]],
  ruines:[[-0, 0]],
  foyer:[[0, -218], [7, -238], [-6, -258], [4, -278], [0, -296]]
};
TRAILS.ruines = [[112, -100], [182, -104]];
const TRAIL_W = {foret:1.8, eaux:2.3, ruines:3.4, foyer:2.2};
function polyDist(P, x, z){
  let best = 1e9;
  for(let i = 0; i < P.length - 1; i++){
    const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L, 0, 1), ex = a[0] + dx * t - x, ez = a[1] + dz * t - z, d = ex * ex + ez * ez;
    if(d < best) best = d;
  }
  return Math.sqrt(best);
}
export const trailDist = (k, x, z) => TRAILS[k] ? polyDist(TRAILS[k], x, z) - (TRAIL_W[k] || 2) : 99;
/* les Nappes : des vasques en terrasses qui descendent depuis le col, comme des couches */
export const TERR = 12;
export function terrace(x, z){
  const b = BIOME_BY.eaux, sx = b.B[0], sz = b.B[1];
  const r = Math.max(0, Math.hypot(x - sx, z - sz) - 4 + 3.8 * nW(x / 26, z / 26));
  const n = Math.min(9, Math.floor(r / TERR)), f = n >= 9 ? 0.5 : r / TERR - n;
  return {n, f, level:b.F - n * 1.05};
}
/* le Foyer : des rivières de lave, et sa caldeira */
export function lavaMask(x, z){
  const b = BIOME_BY.foyer, m = biomeMask(b, x, z); if(m <= 0.02) return 0;
  const v = Math.abs(nL(x / 46, z / 46) + 0.3 * nL(x / 15, z / 15)) + 0.05 * smooth(-0.2, 0.5, nE(x / 70, z / 70));
  const core = smooth(16, 11, Math.hypot(x - b.c[0], z - b.c[1]));          /* l'anneau de lave au pied du dissipateur */
  const ring = core * smooth(5.5, 8, Math.hypot(x - b.c[0], z - b.c[1]));
  let k = Math.max(smooth(0.05, 0.02, v), ring);
  k *= smooth(0.3, 0.75, m) * smooth(1.2, 3.6, trailDist("foyer", x, z));    /* le sentier passe sur un pont de basalte */
  k *= smooth(40, 52, Math.hypot(x - b.B[0], z - b.B[1]));                   /* rien à l'entrée */
  return k;
}
function biomeFloor(b, x, z){
  const F = b.F;
  if(b.k === "foret") return F + 2.6 * fbm(nB, x / 48, z / 48, 3) + 0.5 * fbm(nR, x / 11, z / 11, 2);
  if(b.k === "grotte") return F + 1.6 * fbm(nB, x / 30, z / 30, 3) + 0.45 * fbm(nR, x / 6, z / 6, 2);
  if(b.k === "ruines") return F + 1.1 * fbm(nB, x / 55, z / 55, 3) + 0.25 * fbm(nR, x / 9, z / 9, 2);
  if(b.k === "foyer"){
    const h = F + 1.8 * fbm(nB, x / 40, z / 40, 3) + 0.5 * Math.abs(fbm(nR, x / 8, z / 8, 2));
    return lerp(h, F - 1.1, lavaMask(x, z));
  }
  /* les Nappes : chaque vasque a son niveau ; un rebord la ferme, puis on descend d'un cran */
  const T = terrace(x, z), L = T.level;
  let h;
  if(T.f < 0.8) h = L - 0.42 + 0.08 * nR(x / 3, z / 3);
  else if(T.f < 0.97) h = lerp(L - 0.42, L + 0.14, smooth(0.8, 0.86, T.f));
  else h = lerp(L + 0.14, L - 1.47, smooth(0.97, 1.0, T.f));
  /* la chaussée : elle reste au-dessus de l'eau, et descend d'un cran à chaque rebord */
  const cw = trailDist("eaux", x, z);
  if(cw < 1.6){
    let c = L + 0.24;
    if(T.f > 0.84) c = lerp(L + 0.24, L - 1.05 + 0.24, smooth(0.84, 1.0, T.f));
    h = lerp(h, c, smooth(1.6, 0.2, cw));
  }
  return h;
}
/* les sommets entre les biomes : des crêtes, plus hautes en s'éloignant de la zone */
function ridges(x, z){
  const ax = Math.abs(x);
  const out = Math.max(smooth(58, 100, ax), smooth(158, 200, -z), smooth(152, 190, z));
  if(out <= 0) return 0;
  const r = 1 - Math.abs(nR(x / 70, z / 70)), r2 = 1 - Math.abs(nB(x / 26, z / 26));
  return out * (9 + 16 * r * r + 4 * r2);
}
/* la caldeira du Foyer : un rebord qui monte autour d'elle */
function rim(x, z){
  const e = ell(BIOME_BY.foyer, x, z);
  return 24 * smooth(0.82, 1.08, e) * smooth(1.75, 1.1, e);
}
function worldHeight(x, z, dp, cache){
  let h = rawHeight(x, z, dp) + ridges(x, z) + rim(x, z);
  let bi = 0, bw = 0;
  for(const b of BIOMES){
    const m = biomeMask(b, x, z);
    if(m > 0){ h = lerp(h, biomeFloor(b, x, z), m); if(m > bw){ bw = m; bi = b.i; } }
    const P = passMask(b, x, z);
    if(P.m > 0){
      const ph = lerp(b.hA, b.F, smooth(0, 1, P.t)) + 0.2 * nR(x / 5, z / 5) * P.t;
      h = lerp(h, ph, P.m * (1 - m));
      if(P.m * smooth(0.0, 0.15, P.t) > bw){ bw = P.m * smooth(0.0, 0.15, P.t); bi = b.i; }
    }
  }
  /* le parvis d'un lieu : à plat, au niveau de son centre */
  if(Math.abs(x) < 60 && Math.abs(z) < 215) for(const s of SITES){
    if(s.h0 === undefined) continue;
    const d = Math.hypot(x - s.x, z - s.z);
    if(d < s.pr + 5) h = lerp(h, s.h0, smooth(s.pr + 5, s.pr + 0.6, d));
  }
  if(cache){ cache.bi = bi; cache.bw = bw; }
  return h;
}
/* où l'on est : la zone de capture, un biome (ou son col), ou nulle part */
export function biomeAt(x, z){
  let best = null, bw = 0;
  for(const b of BIOMES){
    const m = Math.max(biomeMask(b, x, z), passMask(b, x, z).m);
    if(m > bw){ bw = m; best = b; }
  }
  return {b:best, w:bw};
}
/* la lumière d'un biome : pleine dans la vallée, qui monte le long du col */
export function biomeWeight(b, x, z){
  const P = passMask(b, x, z);
  return Math.max(biomeMask(b, x, z), P.m * smooth(0.25, 1.0, P.t));
}
export function regionAt(x, z){
  if(x >= BOUNDS.x0 && x <= BOUNDS.x1 && z >= BOUNDS.z0 && z <= BOUNDS.z1) return "route";
  const q = biomeAt(x, z);
  return q.b && q.w > 0.5 ? q.b.k : null;
}
export function walkable(x, z){
  const r = regionAt(x, z);
  if(r === "route") return true;
  if(!r) return false;
  if(!LOCKS[r]) return false;
  return lavaAt(x, z) < 0.45;
}

/* ---------- la grille ---------- */
export const W = Math.round((GRID.x1 - GRID.x0) / GRID.step) + 1;
export const D = Math.round((GRID.z1 - GRID.z0) / GRID.step) + 1;
export const HGT = new Float32Array(W * D);
export const DPATH = new Float32Array(W * D);
export const GRASS = new Float32Array(W * D);
export const LAKEM = new Float32Array(W * D);
export const BIDX = new Int8Array(W * D);          /* le biome (0 : la zone, ou les crêtes) */
export const BWT = new Float32Array(W * D);        /* sa part, au bord */
export const TRAIL = new Float32Array(W * D);      /* la distance au sentier du biome */
export const LAVA = new Float32Array(W * D);
/* les touffes des biomes (fougères, roseaux, herbes sèches) : là où se cachent les Pokémon */
export const BIOME_PATCHES = [];
function seedPatches(){
  const rnd = mulberry32(4242);
  const want = {foret:11, eaux:7, ruines:9};
  for(const b of BIOMES){
    let n = want[b.k] || 0, tries = 0;
    while(n > 0 && tries++ < 600){
      const a = rnd() * Math.PI * 2, e = 0.18 + rnd() * 0.6;
      const x = b.c[0] + Math.cos(a) * b.r[0] * e, z = b.c[1] + Math.sin(a) * b.r[1] * e;
      if(trailDist(b.k, x, z) < 4 || ell(b, x, z) > 0.78) continue;
      if(b.k === "eaux" && terrace(x, z).n < 1) continue;
      if(BIOME_PATCHES.some(p=>Math.hypot(p.x - x, p.z - z) < p.r + 9)) continue;
      BIOME_PATCHES.push({x, z, r:7 + rnd() * 5, k:b.k}); n--;
    }
  }
}
export function buildGrid(){
  /* le plancher de chaque biome se règle sur le pied de son col, dans la zone */
  for(const b of BIOMES){ b.hA = rawHeight(b.A[0], b.A[1], 99); b.F = b.hA + b.dy; }
  if(!BIOME_PATCHES.length) seedPatches();
  for(const s of SITES){ s.h0 = undefined; let a = 0; for(let i = 0; i < 8; i++){ const x = s.x + Math.cos(i * 0.785) * s.pr * 0.6, z = s.z + Math.sin(i * 0.785) * s.pr * 0.6; a += worldHeight(x, z, distPath(x, z)); } s.h0 = a / 8; }
  const cache = {bi:0, bw:0};
  for(let j = 0; j < D; j++){
    const z = GRID.z0 + j * GRID.step;
    for(let i = 0; i < W; i++){
      const x = GRID.x0 + i * GRID.step, k = j * W + i;
      const inside = Math.abs(x) < 60 && Math.abs(z) < 215;
      const dp = inside ? distPath(x, z) : 99;
      DPATH[k] = dp;
      LAKEM[k] = inside ? lakeMask(x, z) : 0;
      HGT[k] = worldHeight(x, z, dp, cache);
      BIDX[k] = cache.bi; BWT[k] = cache.bw;
      let g = inside && dp > PATH_W + 1.2 && LAKEM[k] < 0.05 && cache.bw < 0.2 ? grassPatch(x, z) : 0;
      let tr = 99;
      if(cache.bi){
        const bk = BIOMES[cache.bi - 1].k;
        tr = trailDist(bk, x, z);
        for(const p of BIOME_PATCHES){
          if(p.k !== bk) continue;
          const d = Math.hypot(x - p.x, z - p.z) / p.r + 0.3 * n5(x / 6, z / 6);
          g = Math.max(g, smooth(1.0, 0.84, d) * smooth(0.6, 0.9, cache.bw) * smooth(0.5, 2.5, tr));
        }
        if(bk === "foyer") LAVA[k] = lavaMask(x, z);
      }
      if(g > 0 && siteClear(x, z, 2)) g = 0;
      TRAIL[k] = tr; GRASS[k] = g;
    }
  }
}
function sample(arr, x, z){
  const fx = clamp((x - GRID.x0) / GRID.step, 0, W - 1.001), fz = clamp((z - GRID.z0) / GRID.step, 0, D - 1.001);
  const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, k = j * W + i;
  const a = arr[k], b = arr[k + 1], c = arr[k + W], d = arr[k + W + 1];
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
}
export const heightAt = (x, z) => sample(HGT, x, z);
/* le chemin de la zone, ou le sentier du biome */
export const pathDist = (x, z) => Math.min(sample(DPATH, x, z), sample(TRAIL, x, z));
export const lavaAt = (x, z) => sample(LAVA, x, z);
export const biomeIndexAt = (x, z) => { const fx = Math.round((x - GRID.x0) / GRID.step), fz = Math.round((z - GRID.z0) / GRID.step); return fx < 0 || fz < 0 || fx >= W || fz >= D ? 0 : BIDX[fz * W + fx]; };
export const tallGrassAt = (x, z) => sample(GRASS, x, z);
export const lakeAt = (x, z) => sample(LAKEM, x, z);
export function normalAt(x, z){
  const e = 0.5, hx = heightAt(x + e, z) - heightAt(x - e, z), hz = heightAt(x, z + e) - heightAt(x, z - e);
  const nx = -hx, ny = 2 * e, nz = -hz, L = Math.hypot(nx, ny, nz);
  return [nx / L, ny / L, nz / L];
}
/* dans l'eau ? (assez profond pour ne pas y marcher) */
/* l'eau et la rive n'existent qu'autour du lac : ailleurs, le terrain peut être plus bas que l'eau sans être noyé */
export const inWater = (x, z) => lakeAt(x, z) > 0.2 && heightAt(x, z) < WATER_Y - 0.25;
export const onBeach = (x, z) => lakeShore(x, z) > 0.2 && heightAt(x, z) < WATER_Y + 0.45;
