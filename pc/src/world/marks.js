/* ============================================================
   LES TRACES SUR LE TERRAIN
   Quand un Pokémon sauvage lance une capacité, le sol en garde la
   marque un moment, puis la nature reprend : la terre brûlée et ses
   braises (Feu), une étoile calcinée (Électrik), une flaque qui brille
   puis sèche (Eau), le givre (Glace), les fissures et le cratère (Sol,
   Combat, Roche), une mare violette qui bouillonne (Poison), une toile
   (Insecte), trois griffures (Ténèbres, Acier), des fleurs (Fée), des
   feuilles (Plante, Vol), une ombre qui tourne (Spectre), des ondes
   (Psy). L'herbe aussi : brûlée, couchée, givrée, salie.
   Dessiné dans le sol lui-même (terrain.js) et dans les brins
   (grass.js) : rien ne flotte, rien ne scintille de travers.
   ============================================================ */
import * as THREE from "three";

export const MK_N = 10;
export const MKK = {scorch:1, crack:2, wet:3, frost:4, poison:5, volt:6, web:7, claw:8, bloom:9, leaves:10, shadow:11, psy:12, drake:13, scuff:14};
/* combien de temps la nature met à reprendre (secondes), et combien de temps ça reste chaud */
const LIFE = {1:70, 2:90, 3:45, 4:40, 5:60, 6:55, 7:80, 8:70, 9:90, 10:50, 11:35, 12:18, 13:70, 14:40};
const HEAT = {1:9, 6:3, 13:9, 8:1.2, 12:6, 11:8, 5:30, 9:20};

export const MK = {
  uMk:{value:Array.from({length:MK_N}, ()=>new THREE.Vector4(0, 0, 0, 0))},      /* x, z, rayon, force */
  uMkT:{value:Array.from({length:MK_N}, ()=>new THREE.Vector4(0, 0, 0, 0))},     /* sorte, chaleur, graine, angle */
  uMkClock:{value:0}
};
const list = [];
export function addMark(kind, x, z, r, t, o = {}){
  /* une trace de même sorte, juste là : on la ravive et on l'élargit un peu */
  const same = list.find(m=>m && m.kind === kind && Math.hypot(m.x - x, m.z - z) < Math.max(m.r, r) * 0.6);
  if(same){ same.t0 = t - 0.2; same.r = Math.min(Math.max(same.r, r) * 1.12, r * 1.6); return same; }
  const m = {kind, x, z, r, t0:t, life:(o.life || LIFE[kind] || 50), heat:o.heat !== undefined ? o.heat : (HEAT[kind] || 0), seed:Math.random() * 100, ang:o.ang !== undefined ? o.ang : Math.random() * 6.28};
  let i = list.findIndex(x=>!x);
  if(i < 0 && list.length < MK_N) i = list.length;
  if(i < 0){ let o2 = 0; for(let j = 1; j < list.length; j++) if(list[j].t0 < list[o2].t0) o2 = j; i = o2; }
  list[i] = m;
  return m;
}
export function marksNear(x, z, r){ return list.filter(m=>m && Math.hypot(m.x - x, m.z - z) < m.r + r); }
export function updateMarks(t){
  MK.uMkClock.value = t;
  for(let i = 0; i < MK_N; i++){
    const m = list[i], A = MK.uMk.value[i], B = MK.uMkT.value[i];
    if(!m){ A.set(0, 0, 0, 0); B.set(0, 0, 0, 0); continue; }
    const age = t - m.t0;
    if(age > m.life){ list[i] = null; A.set(0, 0, 0, 0); continue; }
    const k = Math.min(1, age / 0.25) * Math.min(1, (m.life - age) / (m.life * 0.4));
    const heat = m.heat > 0 ? Math.exp(-age / m.heat) : 0;
    A.set(m.x, m.z, m.r, k); B.set(m.kind, heat, m.seed, m.ang);
  }
}

/* ---------- dans le sol ---------- */
export const MARKS_GLSL = `
uniform vec4 uMk[${MK_N}]; uniform vec4 uMkT[${MK_N}]; uniform float uMkClock;
float mkH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mkN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mkH(i), mkH(i+vec2(1,0)), f.x), mix(mkH(i+vec2(0,1)), mkH(i+vec2(1,1)), f.x), f.y); }
/* la couleur du sol sous les traces ; ce qui y luit ; ce qui y est mouillé */
void applyMarks(vec3 wp, inout vec3 col, inout vec3 emi, inout float wet){
  for(int i = 0; i < ${MK_N}; i++){
    vec4 m = uMk[i]; if(m.w <= 0.001) continue;
    vec2 d = (wp.xz - m.xy) / m.z; float rr = length(d); if(rr > 1.15) continue;
    vec4 T = uMkT[i]; int kind = int(T.x + 0.5); float k = m.w, heat = T.y, sd = T.z;
    float ang = atan(d.y, d.x), nz = mkN(wp.xz * 1.7 + sd), nz2 = mkN(wp.xz * 5.3 - sd);
    if(kind == 1 || kind == 13){
      /* la terre brûlée : noire au centre, la cendre autour, des braises qui couvent */
      float sh = smoothstep(1.0, 0.45, rr + (nz - 0.5) * 0.5);
      col = mix(col, vec3(0.022, 0.019, 0.017), sh * 0.9 * k);
      float ash = smoothstep(0.12, 0.0, abs(rr + (nz - 0.5) * 0.4 - 0.82)) * 0.6;
      col = mix(col, vec3(0.16, 0.15, 0.14), ash * k);
      vec2 ec = floor(wp.xz * 4.0); float em = step(0.86, mkH(ec + sd)) * smoothstep(0.3, 0.05, length(fract(wp.xz * 4.0) - 0.5));
      vec3 ecol = kind == 13 ? vec3(0.45, 0.35, 1.0) : vec3(1.0, 0.36, 0.06);
      emi += ecol * (em * (0.4 + 0.6 * sin(uMkClock * 4.0 + mkH(ec) * 30.0)) * 1.6 + smoothstep(0.7, 0.0, rr) * 0.9) * heat * sh * k;
      emi += ecol * em * sh * k * 0.12;
    } else if(kind == 2){
      /* les fissures qui rayonnent, un cratère tassé au centre, un bourrelet de terre autour */
      float seg = floor((ang + 3.1416) / 6.2832 * 9.0), len = 0.55 + 0.45 * mkH(vec2(seg, sd));
      float aw = fract((ang + 3.1416) / 6.2832 * 9.0 + (mkN(vec2(rr * 4.0, seg + sd)) - 0.5) * 0.5);
      float crack = smoothstep(0.06, 0.0, abs(aw - 0.5) * (0.6 + rr * 1.4)) * step(rr, len) * step(0.18, rr);
      float ringc = smoothstep(0.035, 0.0, abs(rr - 0.38 - (nz - 0.5) * 0.12));
      float crater = smoothstep(0.42, 0.0, rr);
      col = mix(col, col * 0.5, crater * 0.7 * k);
      col = mix(col, vec3(0.03, 0.025, 0.02), max(crack, ringc) * 0.9 * k);
      col = mix(col, col * 1.25 + 0.03, smoothstep(0.1, 0.0, abs(rr - 0.95 - (nz - 0.5) * 0.2)) * 0.6 * k);
    } else if(kind == 3){
      /* une flaque : elle sèche par les bords */
      float sh = smoothstep(k, k - 0.25, rr + (nz - 0.5) * 0.45);
      col = mix(col, col * vec3(0.4, 0.46, 0.52), sh * 0.85);
      wet = max(wet, sh);
      float rip = smoothstep(0.04, 0.0, abs(fract(rr * 3.0 - uMkClock * 0.6) - 0.5) - 0.44) * sh * 0.08;
      emi += vec3(0.6, 0.75, 0.85) * rip;
    } else if(kind == 4){
      /* le givre : des cristaux en étoile, des éclats qui scintillent */
      float sh = smoothstep(1.0, 0.55, rr + (nz - 0.5) * 0.5);
      float a6 = abs(fract((ang + sd) / 6.2832 * 6.0) - 0.5);
      float den = smoothstep(0.08, 0.0, a6 * rr * 2.0 - nz2 * 0.06) * step(0.1, rr);
      vec3 frost = mix(vec3(0.72, 0.84, 0.94), vec3(0.92, 0.97, 1.0), den);
      col = mix(col, frost, sh * (0.62 + 0.3 * den) * k);
      vec2 sc = floor(wp.xz * 9.0); float sp = step(0.95, mkH(sc + sd)) * (0.5 + 0.5 * sin(uMkClock * 5.0 + mkH(sc) * 40.0));
      emi += vec3(0.7, 0.9, 1.0) * sp * sh * k * 0.7;
      wet = max(wet, sh * 0.6 * k);
    } else if(kind == 5){
      /* une mare violette qui bouillonne */
      float sh = smoothstep(1.0, 0.7, rr + (nz - 0.5) * 0.5);
      col = mix(col, vec3(0.2, 0.04, 0.26), sh * 0.85 * k);
      vec2 bc = floor(wp.xz * 3.5); vec2 bf = fract(wp.xz * 3.5) - 0.5;
      float ph = fract(uMkClock * 0.5 + mkH(bc + sd));
      float bub = step(0.55, mkH(bc + sd * 2.0)) * smoothstep(0.06, 0.0, abs(length(bf) - ph * 0.4)) * (1.0 - ph);
      emi += vec3(0.75, 0.25, 1.0) * (bub * 1.2 + sh * 0.12) * k * (0.35 + heat * 0.65);
      wet = max(wet, sh * k);
    } else if(kind == 6){
      /* la foudre : une étoile calcinée aux branches fourchues, bleue tant que c'est chaud */
      float br = 0.0;
      for(int j = 0; j < 7; j++){
        float a0 = float(j) / 7.0 * 6.2832 + sd + (mkN(vec2(rr * 5.0, float(j) + sd)) - 0.5) * 0.9 * rr;
        float da = abs(atan(sin(ang - a0), cos(ang - a0)));
        br = max(br, smoothstep(0.09, 0.0, da * rr * 3.0) * step(rr, 0.55 + 0.45 * mkH(vec2(float(j), sd))));
      }
      float core = smoothstep(0.3, 0.0, rr);
      col = mix(col, vec3(0.03, 0.03, 0.035), max(br, core) * 0.9 * k);
      emi += mix(vec3(0.45, 0.8, 1.0), vec3(1.0, 0.95, 0.5), core) * (br + core) * heat * k * 2.2;
    } else if(kind == 7){
      /* une toile : des rayons et des fils en polygone */
      float spoke = smoothstep(0.03, 0.0, abs(fract((ang + sd) / 6.2832 * 8.0) - 0.5) * rr * 1.2);
      float poly = rr * cos(abs(fract((ang + sd) / 6.2832 * 8.0) - 0.5) * 0.78);
      float rings = smoothstep(0.025, 0.0, abs(fract(poly * 5.0) - 0.5) * 0.4) * step(poly, 0.95);
      col = mix(col, vec3(0.9, 0.92, 0.95), max(spoke * step(rr, 0.98), rings) * 0.75 * k);
    } else if(kind == 8){
      /* trois griffures dans la terre */
      float c = cos(T.w), s = sin(T.w); vec2 u = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
      float g = 0.0;
      for(int j = -1; j <= 1; j++) g = max(g, smoothstep(0.075, 0.0, abs(u.y - float(j) * 0.3 + u.x * u.x * 0.18)) * smoothstep(1.0, 0.55, abs(u.x)));
      col = mix(col, vec3(0.03, 0.025, 0.03), g * 0.92 * k);
      emi += vec3(0.85, 0.9, 1.0) * g * heat * k * 2.0;
    } else if(kind == 9){
      /* des fleurs qui ont poussé d'un coup */
      float sh = smoothstep(1.0, 0.7, rr + (nz - 0.5) * 0.4);
      col = mix(col, col * vec3(0.8, 1.15, 0.75), sh * 0.6 * k);
      vec2 fc = floor(wp.xz * 3.0); vec2 ff = fract(wp.xz * 3.0) - 0.5 + (vec2(mkH(fc + 1.0), mkH(fc + 2.0)) - 0.5) * 0.4;
      float on = step(0.55, mkH(fc + sd)) * sh;
      float fa = atan(ff.y, ff.x), fr = length(ff);
      float petal = smoothstep(0.02, 0.0, fr - (0.11 + 0.06 * cos(fa * 5.0)));
      float heart = smoothstep(0.045, 0.02, fr);
      vec3 pc = mkH(fc + 3.0) < 0.33 ? vec3(1.0, 0.55, 0.78) : mkH(fc + 3.0) < 0.66 ? vec3(0.98, 0.96, 0.98) : vec3(0.75, 0.6, 1.0);
      col = mix(col, pc, petal * on * k); col = mix(col, vec3(1.0, 0.85, 0.3), heart * on * k);
      emi += vec3(1.0, 0.6, 0.85) * petal * on * k * heat * 0.6;
    } else if(kind == 10){
      /* des feuilles tombées, vertes et jaunes */
      vec2 fc = floor(wp.xz * 4.0); vec2 ff = fract(wp.xz * 4.0) - 0.5;
      float a = mkH(fc + sd) * 6.28; vec2 lq = vec2(cos(a) * ff.x + sin(a) * ff.y, -sin(a) * ff.x + cos(a) * ff.y);
      float leaf = smoothstep(1.0, 0.85, length(vec2(lq.x * 2.4, lq.y) / 0.38)) * step(0.5, mkH(fc + sd + 4.0)) * smoothstep(1.0, 0.6, rr);
      vec3 lc = mix(vec3(0.2, 0.42, 0.08), vec3(0.62, 0.5, 0.12), mkH(fc + 5.0));
      col = mix(col, lc, leaf * k);
    } else if(kind == 11){
      /* une ombre qui tourne sur elle-même, et des feux follets */
      float sw = mkN(vec2(ang * 1.5 + uMkClock * 0.8 + rr * 3.0, rr * 4.0 + sd));
      float sh = smoothstep(1.0, 0.4, rr + (sw - 0.5) * 0.6);
      col = mix(col, col * vec3(0.3, 0.22, 0.4), sh * 0.85 * k);
      emi += vec3(0.6, 0.25, 1.0) * smoothstep(0.08, 0.0, abs(sw - 0.5)) * sh * k * (0.3 + heat);
    } else if(kind == 12){
      /* des ondes roses qui s'éloignent */
      float w = smoothstep(0.05, 0.0, abs(fract(rr * 2.5 - uMkClock * 0.8) - 0.5) - 0.42) * smoothstep(1.0, 0.3, rr);
      emi += vec3(1.0, 0.45, 0.85) * w * k * (0.25 + heat);
      col = mix(col, col * vec3(1.05, 0.9, 1.05), smoothstep(1.0, 0.2, rr) * 0.3 * k);
    } else if(kind == 14){
      /* la terre retournée : un rond de poussière claire, des stries */
      float sh = smoothstep(1.0, 0.5, rr + (nz - 0.5) * 0.5);
      float st = smoothstep(0.3, 0.0, abs(fract((ang + sd) / 6.2832 * 14.0 + nz2 * 0.4) - 0.5)) * step(0.3, rr);
      col = mix(col, vec3(0.42, 0.36, 0.26), sh * (0.4 + 0.25 * st) * k);
    }
  }
}`;

/* ---------- dans les brins d'herbe : brûlés, couchés, givrés, salis ---------- */
export const MARKS_GRASS_GLSL = `
uniform vec4 uMk[${MK_N}]; uniform vec4 uMkT[${MK_N}];
/* rend (cendre, givre, violet, fleurs) ; pousse les brins (couchés) ; raccourcit (brûlés) */
vec4 grassMarks(vec2 p, inout vec2 push, inout float shrink){
  vec4 o = vec4(0.0);
  for(int i = 0; i < ${MK_N}; i++){
    vec4 m = uMk[i]; if(m.w <= 0.001) continue;
    vec2 d = p - m.xy; float r = length(d); if(r > m.z) continue;
    float k = smoothstep(m.z, m.z * 0.55, r) * m.w; int kind = int(uMkT[i].x + 0.5);
    vec2 out2 = d / max(r, 0.001);
    if(kind == 1 || kind == 13 || kind == 6){ shrink = max(shrink, k * 0.88); o.x = max(o.x, k); }
    else if(kind == 2 || kind == 14 || kind == 12 || kind == 10){ push += out2 * k * 1.7; shrink = max(shrink, k * 0.35); }
    else if(kind == 3){ push += out2 * k * 0.6; o.y = max(o.y, k * 0.15); }
    else if(kind == 4){ o.y = max(o.y, k); }
    else if(kind == 5 || kind == 11){ o.z = max(o.z, k); shrink = max(shrink, k * 0.3); }
    else if(kind == 7){ o.y = max(o.y, k * 0.35); }
    else if(kind == 8){ push += out2 * k * 0.8; }
    else if(kind == 9){ o.w = max(o.w, k); }
  }
  return o;
}`;
