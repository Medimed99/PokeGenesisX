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
import { noiseFn, fbm, smooth, clamp, lerp } from "../util.js";

export const BOUNDS = {x0:-46, x1:46, z0:-150, z1:150};       /* où l'on peut marcher */
export const GRID = {x0:-110, x1:110, z0:-230, z1:230, step:1}; /* le terrain, horizon compris */

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

/* ---------- la grille ---------- */
export const W = Math.round((GRID.x1 - GRID.x0) / GRID.step) + 1;
export const D = Math.round((GRID.z1 - GRID.z0) / GRID.step) + 1;
export const HGT = new Float32Array(W * D);
export const DPATH = new Float32Array(W * D);
export const GRASS = new Float32Array(W * D);
export const LAKEM = new Float32Array(W * D);
export function buildGrid(){
  for(let j = 0; j < D; j++){
    const z = GRID.z0 + j * GRID.step;
    for(let i = 0; i < W; i++){
      const x = GRID.x0 + i * GRID.step, k = j * W + i;
      const inside = Math.abs(x) < 60 && Math.abs(z) < 215;
      const dp = inside ? distPath(x, z) : 99;
      DPATH[k] = dp;
      LAKEM[k] = lakeMask(x, z);
      GRASS[k] = inside && dp > PATH_W + 1.2 && LAKEM[k] < 0.05 ? grassPatch(x, z) : 0;
      HGT[k] = rawHeight(x, z, dp);
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
export const pathDist = (x, z) => sample(DPATH, x, z);
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
