/* ============================================================
   LA CORRUPTION — la marque de MissingNo sur la Route 1
   Des zones désindexées : le sol devient une grille de données,
   l'herbe a disparu, les arbres et les rochers se figent en blocs,
   des cubes de données montent vers le ciel, et des blocs de bruit
   (la matière même de MissingNo) flottent au-dessus.
   Elles suivent l'intégrité de l'archive (le jeu mobile) : chaque
   zone se rétracte puis s'efface quand l'archive est restaurée.
   ============================================================ */
import * as THREE from "three";
import { heightAt } from "./layout.js";

export const ZONE_N = 8;
/* x, z, rayon, et l'intégrité (en %) à partir de laquelle la zone est guérie */
export const ZONES = [
  {x:13,  z:128,  r:5.5, heal:3},     /* la première, juste après Bourg Palette : on la voit tout de suite */
  {x:-31, z:86,   r:8,   heal:8},
  {x:35,  z:60,   r:7.5, heal:15},
  {x:-7,  z:30,   r:7,   heal:25},
  {x:7,   z:-40,  r:10,  heal:35},    /* elle mange le chemin */
  {x:-31, z:-98,  r:8,   heal:45},
  {x:31,  z:-98,  r:6.5, heal:55},
  {x:-1,  z:-140, r:10,  heal:70}     /* la porte de Jadielle se défait */
];

/* le masque, partagé par tous les matériaux du monde */
export const ZONE_GLSL = `
uniform vec4 uZones[${ZONE_N}];
uniform float uCTime;
float czH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
/* le cœur : franc, à bord en escalier (cellules de 50 cm) */
float zoneCore(vec2 p){
  vec2 q = floor(p * 2.0) * 0.5 + 0.25;
  float n = czH(q), m = 0.0;
  for(int i = 0; i < ${ZONE_N}; i++){
    vec4 z = uZones[i];
    if(z.w <= 0.001) continue;
    float d = length(q - z.xy) / (z.z * z.w);
    m = max(m, step(d + 0.32 * n, 0.92));
  }
  return m;
}
/* le halo : l'herbe meurt autour */
float zoneHalo(vec2 p){
  float m = 0.0;
  for(int i = 0; i < ${ZONE_N}; i++){
    vec4 z = uZones[i];
    if(z.w <= 0.001) continue;
    float d = length(p - z.xy) / (z.z * z.w);
    m = max(m, 1.0 - smoothstep(0.75, 1.55, d));
  }
  return m;
}`;

/* un matériau standard du décor : figé en blocs dans les zones (arbres, rochers, clôtures) */
export function corruptStandard(mat, uniforms, key){
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if(prev) prev(sh, r);
    sh.uniforms.uZones = uniforms.uZones; sh.uniforms.uCTime = uniforms.uCTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\n" + ZONE_GLSL + "\nvarying float vZone; varying vec3 vCWP;")
      .replace("#include <project_vertex>", `
  #ifdef USE_INSTANCING
  vec3 czIp = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  #else
  vec3 czIp = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif
  vZone = zoneCore(czIp.xz);
  if(vZone > 0.5){
    /* des voxels de 40 cm, et de temps en temps une tranche qui glisse */
    transformed = floor(transformed * 2.5 + 0.5) / 2.5;
    float slip = step(0.93, czH(vec2(floor(transformed.y * 2.5), floor(uCTime * 6.0) + czIp.x)));
    transformed.x += slip * 0.35 * (czH(czIp.xz + floor(uCTime * 6.0)) - 0.5);
  }
  #include <project_vertex>
  #ifdef USE_INSTANCING
  vCWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
  vCWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uCTime;\nvarying float vZone; varying vec3 vCWP;")
      .replace("#include <color_fragment>", `#include <color_fragment>
  if(vZone > 0.5){
    /* la matière de MissingNo : des voxels de bruit gris qui changent lentement */
    vec3 cz3 = floor(vCWP * 2.5);
    float czn = fract(sin(dot(cz3 + floor(uCTime * 2.0) * 0.17, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    diffuseColor.rgb = vec3(0.025 + czn * czn * 0.32) * vec3(0.95, 0.97, 1.05);
  }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  if(vZone > 0.5){
    /* des lignes de balayage qui montent dans la matière figée */
    float ln = 1.0 - smoothstep(0.03, 0.12, abs(fract(vCWP.y * 0.8 - uCTime * 0.3) - 0.5));
    totalEmissiveRadiance += mix(vec3(0.21, 0.94, 0.84), vec3(1.0, 0.24, 0.5), step(0.5, fract(vCWP.y * 0.21 + 0.13))) * ln * 1.4;
    /* quelques voxels allumés */
    vec3 cz4 = floor(vCWP * 2.5);
    float spk = step(0.97, fract(sin(dot(cz4 + floor(uCTime * 5.0), vec3(7.1, 11.3, 5.7))) * 43758.5453));
    totalEmissiveRadiance += mix(vec3(0.21, 0.94, 0.84), vec3(1.0, 0.24, 0.5), step(0.5, fract(cz4.x * 0.37 + cz4.z * 0.11))) * spk * 1.6;
  }`);
  };
  const k0 = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => "";
  mat.customProgramCacheKey = () => k0() + "|corrupt" + (key || "");
  return mat;
}

/* les cubes de données : montent, tournent, s'éteignent, recommencent */
function cubeMaterial(uniforms){
  const m = new THREE.MeshBasicMaterial({color:0xffffff});
  m.onBeforeCompile = sh => {
    sh.uniforms.uZones = uniforms.uZones; sh.uniforms.uCTime = uniforms.uCTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
uniform vec4 uZones[${ZONE_N}]; uniform float uCTime;
attribute vec4 aC; attribute vec2 aZ; attribute vec3 aCol; varying vec3 vCol;`)
      .replace("#include <begin_vertex>", `
  float s = uZones[int(aZ.x)].w;
  float per = 5.0 + aC.w * 7.0;
  float t = fract(uCTime / per + aC.w * 7.13);
  float size = (0.08 + fract(aC.w * 31.7) * 0.3) * s * smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.7, 1.0, t));
  float a = uCTime * (0.3 + aC.w) + aC.w * 10.0;
  vec3 transformed = position * size;
  transformed.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * transformed.xz;
  transformed.xy = mat2(cos(a * 0.7), -sin(a * 0.7), sin(a * 0.7), cos(a * 0.7)) * transformed.xy;
  /* une sur quatre saute d'une case à l'autre au lieu de glisser */
  float hop = step(0.75, fract(aC.w * 53.1));
  float rise = mix(t, floor(t * 9.0) / 9.0, hop) * (2.0 + fract(aC.w * 13.0) * 5.0);
  transformed += vec3(aC.x + sin(uCTime * 0.4 + aC.w * 40.0) * 0.25, aC.y + 0.1 + rise, aC.z + cos(uCTime * 0.33 + aC.w * 50.0) * 0.25);
  vCol = aCol * (0.7 + 0.6 * step(0.5, fract(uCTime * (1.0 + aC.w * 3.0) + aC.w)));`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCol;")
      .replace("#include <color_fragment>", "#include <color_fragment>\n  diffuseColor.rgb = vCol;");
  };
  m.customProgramCacheKey = () => "datacubes";
  return m;
}

/* les blocs de bruit : la matière de MissingNo, en suspension */
const blockVert = `
uniform float uCTime; uniform vec4 uZones[${ZONE_N}];
attribute vec4 aB; attribute vec4 aS;
varying vec3 vWP; varying vec3 vN; varying float vFogDepth; varying float vS;
float bh(float x){ return fract(sin(x * 91.7) * 43758.5); }
void main(){
  float s = uZones[int(aS.w)].w;
  vS = s;
  vec3 p = position * aS.xyz * s;
  /* il flotte, et de temps en temps il saute de quelques centimètres : l'image ne tient pas */
  float jt = step(0.92, bh(floor(uCTime * 7.0) + aB.w * 13.0));
  vec3 c = aB.xyz + vec3((bh(aB.w + floor(uCTime * 7.0)) - 0.5) * 0.4 * jt, sin(uCTime * 0.6 + aB.w * 6.0) * 0.18, 0.0);
  vec4 wp = vec4(p + c, 1.0);
  vWP = wp.xyz; vN = normal;
  vec4 mv = viewMatrix * wp;
  vFogDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const blockFrag = `
uniform float uCTime; uniform vec3 uFog; uniform float uFogDensity;
varying vec3 vWP; varying vec3 vN; varying float vFogDepth; varying float vS;
float h3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
void main(){
  if(vS < 0.01) discard;
  /* des pixels de 12 cm qui changent sans arrêt, en niveaux de gris, avec quelques éclats de couleur */
  vec3 cell = floor(vWP * 8.0);
  float f = floor(uCTime * 9.0);
  float n = h3(cell + f * 0.37);
  vec3 col = vec3(n * n * 0.55);
  float spark = step(0.965, h3(cell * 1.7 + f));
  col = mix(col, mix(vec3(0.21, 0.94, 0.84), vec3(1.0, 0.24, 0.5), step(0.5, h3(cell + 9.0))) * 2.2, spark);
  /* les arêtes brillent faiblement */
  vec3 a = abs(fract(vWP * 8.0) - 0.5);
  col *= 0.85 + 0.3 * step(0.42, max(a.x, max(a.y, a.z)));
  float fogF = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  col = mix(col, uFog, fogF);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

/* les poussières de données : des pixels carrés qui montent lentement autour du joueur,
   cyan, magenta ou blancs, et clignotent. Plus nombreux quand l'archive est abîmée. */
const MOTE_N = 520, MOTE_BOX = new THREE.Vector3(46, 14, 46);
const moteVert = `
uniform float uCTime, uDensity, uPx; uniform vec3 uCenter, uBox;
attribute vec4 aM; attribute vec3 aCol;
varying vec3 vCol; varying float vA;
void main(){
  /* chaque grain a sa place dans une boîte qui suit le joueur, et y tourne en boucle */
  vec3 base = aM.xyz * uBox;
  vec3 drift = vec3(sin(uCTime * 0.21 + aM.w * 31.0) * 1.2, uCTime * (0.18 + aM.w * 0.35), cos(uCTime * 0.17 + aM.w * 17.0) * 1.2);
  vec3 p = mod(base + drift - uCenter + uBox * 0.5, uBox) - uBox * 0.5 + uCenter;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float on = step(aM.w, uDensity);
  float blink = step(0.35, fract(uCTime * (0.4 + aM.w * 1.7) + aM.w * 9.0));
  /* ils s'effacent au bord de la boîte et tout près des yeux */
  vec3 rel = abs(p - uCenter) / (uBox * 0.5);
  float edge = 1.0 - smoothstep(0.7, 1.0, max(rel.x, max(rel.y, rel.z)));
  vA = on * edge * (0.35 + 0.65 * blink) * smoothstep(0.6, 2.0, -mv.z);
  vCol = aCol;
  gl_PointSize = uPx * (0.035 + fract(aM.w * 13.7) * 0.045) / max(0.5, -mv.z);
}`;
const moteFrag = `
varying vec3 vCol; varying float vA;
void main(){
  if(vA < 0.02) discard;
  gl_FragColor = vec4(vCol * vA, 1.0);
}`;

/* les uniformes communs : le sol, l'herbe, les arbres et le décor les lisent dès leur construction */
export const CZ = {uZones:{value:ZONES.map(z=>new THREE.Vector4(z.x, z.z, z.r, 1))}, uCTime:{value:0},
  uFog:{value:new THREE.Color()}, uFogDensity:{value:0}};

export class Corruption {
  constructor(scene){
    this.scene = scene;
    this.uniforms = CZ;
    this.level = 1;                                   /* 1 : archive en ruine · 0 : restaurée */
    this.strength = ZONES.map(()=>1);
    this.build();
  }
  build(){
    const PAL = ["#35f0d6", "#ff3d7f", "#9b6bff", "#e8f4ff"].map(c=>new THREE.Color(c));
    /* les cubes */
    const box = new THREE.BoxGeometry(1, 1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = box.index; g.setAttribute("position", box.getAttribute("position")); g.setAttribute("normal", box.getAttribute("normal")); g.setAttribute("uv", box.getAttribute("uv"));
    const C = [], Z = [], COL = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    ZONES.forEach((z, zi)=>{
      const n = Math.round(14 + z.r * 3.2);
      for(let i = 0; i < n; i++){
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * z.r * 0.85;
        const x = z.x + Math.cos(a) * r, zz = z.z + Math.sin(a) * r;
        C.push(x, heightAt(x, zz), zz, rnd());
        Z.push(zi, 0);
        const c = PAL[rnd() < 0.55 ? 0 : rnd() < 0.6 ? 1 : rnd() < 0.5 ? 2 : 3];
        COL.push(c.r * 2.4, c.g * 2.4, c.b * 2.4);
      }
    });
    g.setAttribute("aC", new THREE.InstancedBufferAttribute(new Float32Array(C), 4));
    g.setAttribute("aZ", new THREE.InstancedBufferAttribute(new Float32Array(Z), 2));
    g.setAttribute("aCol", new THREE.InstancedBufferAttribute(new Float32Array(COL), 3));
    g.instanceCount = C.length / 4;
    this.cubes = new THREE.Mesh(g, cubeMaterial(this.uniforms));
    this.cubes.frustumCulled = false;
    this.scene.add(this.cubes);
    /* les blocs de bruit : un L retourné, comme la silhouette de MissingNo, au cœur de chaque zone */
    const bg = new THREE.InstancedBufferGeometry();
    const bb = new THREE.BoxGeometry(1, 1, 1);
    bg.index = bb.index; bg.setAttribute("position", bb.getAttribute("position")); bg.setAttribute("normal", bb.getAttribute("normal"));
    const B = [], S = [];
    ZONES.forEach((z, zi)=>{
      const big = 0.7 + z.r / 10, a = rnd() * Math.PI * 2, ox = Math.cos(a) * z.r * 0.25, oz = Math.sin(a) * z.r * 0.25;
      const y0 = heightAt(z.x + ox, z.z + oz) + 0.6 + rnd() * 0.6;
      const w = 0.7 * big, h = 2.4 * big;
      B.push(z.x + ox, y0 + h / 2, z.z + oz, rnd() * 10); S.push(w, h, 0.5 * big, zi);                      /* la colonne */
      B.push(z.x + ox + w * 0.9, y0 + h * 0.86, z.z + oz, rnd() * 10); S.push(w * 0.9, h * 0.28, 0.5 * big, zi); /* le bras */
      if(z.r > 7){ B.push(z.x - ox * 2.2, y0 + 3.2 * big, z.z - oz * 2.2, rnd() * 10); S.push(0.45 * big, 0.45 * big, 0.45 * big, zi); }
    });
    bg.setAttribute("aB", new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
    bg.setAttribute("aS", new THREE.InstancedBufferAttribute(new Float32Array(S), 4));
    bg.instanceCount = B.length / 4;
    this.blocks = new THREE.Mesh(bg, new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:blockVert, fragmentShader:blockFrag}));
    this.blocks.frustumCulled = false;
    this.scene.add(this.blocks);
    this.blockList = B;
    /* les poussières */
    const mg = new THREE.BufferGeometry(), M = [], MC = [];
    for(let i = 0; i < MOTE_N; i++){
      M.push(rnd(), rnd(), rnd(), rnd());
      const c = PAL[rnd() < 0.5 ? 0 : rnd() < 0.55 ? 1 : 3];
      MC.push(c.r * 1.6, c.g * 1.6, c.b * 1.6);
    }
    mg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MOTE_N * 3), 3));
    mg.setAttribute("aM", new THREE.BufferAttribute(new Float32Array(M), 4));
    mg.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(MC), 3));
    this.moteU = {uCTime:this.uniforms.uCTime, uDensity:{value:0.5}, uPx:{value:800}, uCenter:{value:new THREE.Vector3()}, uBox:{value:MOTE_BOX}};
    this.motes = new THREE.Points(mg, new THREE.ShaderMaterial({uniforms:this.moteU, vertexShader:moteVert, fragmentShader:moteFrag,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending}));
    this.motes.frustumCulled = false; this.motes.renderOrder = 4;
    this.scene.add(this.motes);
  }
  /* l'intégrité de l'archive (0 à 100) : chaque zone guérit à son seuil, en se rétractant */
  setIntegrity(pct){
    this.level = Math.max(0, Math.min(1, 1 - pct / 100));
    ZONES.forEach((z, i)=>{
      const k = Math.max(0, Math.min(1, (z.heal - pct) / Math.max(1.5, z.heal * 0.35)));
      this.strength[i] = k > 0 ? 0.55 + 0.45 * k : 0;
    });
  }
  update(t, scene, player){
    const U = this.uniforms;
    U.uCTime.value = t;
    if(this.moteU && player){
      this.moteU.uCenter.value.set(player.x, player.y + 4, player.z);
      const near = this.near(player.x, player.z);
      this.moteU.uDensity.value = Math.min(1, 0.08 + 0.27 * this.level + 0.5 * near);
      this.moteU.uPx.value = (window.innerHeight || 720) * 1.1;
    }
    ZONES.forEach((z, i)=>{ const v = U.uZones.value[i]; v.w += (this.strength[i] - v.w) * 0.05; if(Math.abs(v.w - this.strength[i]) < 0.002) v.w = this.strength[i]; });
    U.uFog.value.copy(scene.fog.color); U.uFogDensity.value = scene.fog.density;
  }
  /* 1 au cœur d'une zone, et décroît sur une douzaine de mètres */
  near(x, z){
    let best = 0;
    ZONES.forEach((Z, i)=>{
      const s = this.uniforms.uZones.value[i].w; if(s <= 0.01) return;
      const d = Math.hypot(x - Z.x, z - Z.z) - Z.r * s;
      best = Math.max(best, Math.max(0, Math.min(1, 1 - d / 12)) * Math.min(1, s * 1.4));
    });
    return best;
  }
  /* le cœur d'une zone, côté JavaScript (pour ne rien y faire apparaître) */
  inCore(x, z){
    return ZONES.some((Z, i)=>{ const s = this.uniforms.uZones.value[i].w; return s > 0.01 && Math.hypot(x - Z.x, z - Z.z) < Z.r * s * 0.9; });
  }
}
