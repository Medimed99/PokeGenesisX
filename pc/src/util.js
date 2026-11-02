/* Petits outils partagés : hasard reproductible, bruit, interpolations. */
import { createNoise2D } from "simplex-noise";

export function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const rand = mulberry32(0x5eed1);
export function noiseFn(seed){ return createNoise2D(mulberry32(seed)); }
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export function fbm(n, x, z, oct = 4, lac = 2, gain = 0.5){
  let s = 0, a = 1, f = 1, norm = 0;
  for(let i = 0; i < oct; i++){ s += a * n(x * f, z * f); norm += a; a *= gain; f *= lac; }
  return s / norm;
}
/* temps du jeu (secondes) */
export const now = () => performance.now() / 1000;
