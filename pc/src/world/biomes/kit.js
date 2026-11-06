/* ============================================================
   LES BIOMES · LA BOÎTE À OUTILS
   Des formes générées (rochers, prismes, troncs, couronnes), des
   matériaux qui portent leur propre lueur (les lignes d'une stèle,
   les éclats d'un cristal, les braises du basalte), des nuées de
   particules animées par le shader (lucioles, braises, bulles, pages),
   des puits de lumière, et l'instanciation : quelques appels de dessin
   pour des milliers d'objets.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { noiseFn, mulberry32 } from "../../util.js";
import { CZ, LAMP_GLSL } from "../corruption.js";

const nK = noiseFn(911);
export const BT = {uTime:{value:0}};                 /* le temps des biomes (partagé par tous leurs matériaux) */
/* des lueurs posées à la main (un cristal géant, le pied du Dissipateur) : pas de vraies lumières,
   trop lourdes pour tout le décor ; le sol et les décors des biomes les calculent eux-mêmes */
export const BL_N = 4;
export const BL = {uBL:{value:Array.from({length:BL_N}, ()=>new THREE.Vector4(0, -999, 0, 1))}, uBLC:{value:Array.from({length:BL_N}, ()=>new THREE.Color(0, 0, 0))}};
export const BL_GLSL = `
uniform vec4 uBL[${BL_N}]; uniform vec3 uBLC[${BL_N}];
vec3 bioLights(vec3 wp, vec3 albedo){
  vec3 s = vec3(0.0);
  for(int i = 0; i < ${BL_N}; i++){ vec4 l = uBL[i]; float d = distance(wp, l.xyz); float k = pow(max(0.0, 1.0 - d / l.w), 2.0); s += uBLC[i] * k; }
  return albedo * s;
}`;

/* ---------- les formes ---------- */
export function rockGeo(seed, det = 1, flat = 0.62, rough = 0.22){
  let g = new THREE.IcosahedronGeometry(1, det); g.deleteAttribute("normal"); g.deleteAttribute("uv"); g = mergeVertices(g);
  const p = g.attributes.position, o = seed * 3.1;
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + rough * nK(x * 1.3 + o, z * 1.3 + y) + rough * 0.36 * nK(x * 4 - o, y * 4);
    p.setXYZ(i, x * k, y * k * flat, z * k);
  }
  g.computeVertexNormals();
  return g;
}
/* un prisme (cristal, orgue de basalte) : n faces, une pointe ou un sommet plat */
export function prismGeo(sides, tip = 0.35, flatTop = false){
  const body = new THREE.CylinderGeometry(1, 1, 1, sides, 1, !flatTop); body.translate(0, 0.5, 0);
  if(flatTop){ const g = body.toNonIndexed(); g.computeVertexNormals(); return g; }
  const cap = new THREE.ConeGeometry(1, tip, sides, 1, true); cap.translate(0, 1 + tip / 2, 0);
  const g = mergeGeometries([body.toNonIndexed(), cap.toNonIndexed()]); g.computeVertexNormals();
  return g;
}
/* un tronc qui s'évase au pied, légèrement tordu */
export function trunkGeo(seed, r0, r1, h, flare = 1.8){
  const g = new THREE.CylinderGeometry(r1, r0, h, 14, 12); g.translate(0, h / 2, 0);
  const p = g.attributes.position, rnd = mulberry32(seed), ph = rnd() * 9;
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = y / h;
    const fl = 1 + flare * Math.pow(Math.max(0, 1 - k * 5), 2.2);
    const a = Math.atan2(z, x), rib = 1 + 0.12 * Math.sin(a * 5 + ph) * (1 - k * 0.6);
    p.setXYZ(i, x * fl * rib + Math.sin(k * 3 + ph) * h * 0.02, y, z * fl * rib + Math.cos(k * 2.3 + ph) * h * 0.02);
  }
  g.computeVertexNormals();
  return g;
}
/* une couronne : des boules soudées, normales gonflées (la lumière l'enveloppe) */
export function crownGeo(seed, R, n, spread, cy){
  const rnd = mulberry32(seed), parts = [];
  for(let i = 0; i < n; i++){
    const a = rnd() * Math.PI * 2, d = i ? spread * (0.45 + rnd() * 0.55) : 0, r = R * (i ? 0.55 + rnd() * 0.4 : 1);
    const b = rockGeo(seed * 13 + i, 2, 0.72, 0.18); b.scale(r, r, r); b.translate(Math.cos(a) * d, cy + (rnd() - 0.3) * R * 0.7, Math.sin(a) * d);
    parts.push(b);
  }
  const g = mergeGeometries(parts), P = g.attributes.position, N = g.attributes.normal;
  for(let i = 0; i < P.count; i++){
    const ox = P.getX(i), oy = P.getY(i) - cy, oz = P.getZ(i), L = Math.hypot(ox, oy, oz) || 1;
    const nx = N.getX(i) * 0.45 + ox / L * 0.55, ny = N.getY(i) * 0.45 + oy / L * 0.55, nz = N.getZ(i) * 0.45 + oz / L * 0.55, M = Math.hypot(nx, ny, nz) || 1;
    N.setXYZ(i, nx / M, ny / M, nz / M);
  }
  return g;
}
/* une racine : un tube qui part du tronc et plonge dans le sol */
export function rootGeo(a, r0, len, rad, seed){
  const rnd = mulberry32(seed), c = Math.cos(a), s = Math.sin(a);
  const pts = [new THREE.Vector3(c * r0 * 0.6, len * 0.22, s * r0 * 0.6), new THREE.Vector3(c * (r0 + len * 0.3), len * 0.18 + rnd(), s * (r0 + len * 0.3)),
    new THREE.Vector3(c * (r0 + len * 0.7) + rnd() * 2 - 1, len * 0.06, s * (r0 + len * 0.7) + rnd() * 2 - 1), new THREE.Vector3(c * (r0 + len), -1.2, s * (r0 + len))];
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, rad, 8, false), p = g.attributes.position;
  /* la racine s'amincit vers le bout */
  for(let i = 0; i < p.count; i++){ const seg = Math.floor(i / 9) / 18, k = 1 - seg * 0.75, cx = p.getX(i), cy = p.getY(i), cz = p.getZ(i);
    const q = new THREE.CatmullRomCurve3(pts).getPoint(Math.min(1, seg)); p.setXYZ(i, q.x + (cx - q.x) * k, q.y + (cy - q.y) * k, q.z + (cz - q.z) * k); }
  g.computeVertexNormals();
  return g;
}
/* une fougère : des frondes arquées */
export function fernGeo(seed){
  const rnd = mulberry32(seed), parts = [];
  const n = 7;
  for(let i = 0; i < n; i++){
    const g = new THREE.PlaneGeometry(0.34, 1.3, 1, 6); g.translate(0, 0.65, 0);
    const p = g.attributes.position;
    for(let k = 0; k < p.count; k++){ const y = p.getY(k), t = y / 1.3; p.setXYZ(k, p.getX(k) * (1 - t * 0.8) * Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.12)), y * 0.75, t * t * 0.9); }
    g.rotateY(i / n * Math.PI * 2 + rnd() * 0.4);
    parts.push(g);
  }
  const g = mergeGeometries(parts); g.computeVertexNormals();
  return g;
}

/* ---------- les matériaux qui portent leur lueur ---------- */
/* glow : un bout de GLSL qui rend « vec3 glow » à partir de vWP (monde), vOP (objet), vIC (couleur d'instance) et uBT (temps) */
export function glowMat(opts){
  const m = new THREE.MeshStandardMaterial({color:opts.color || "#ffffff", roughness:opts.rough ?? 0.85, metalness:opts.metal ?? 0, flatShading:!!opts.flat,
    vertexColors:!!opts.vc, side:opts.side || THREE.FrontSide, transparent:!!opts.transparent, opacity:opts.opacity ?? 1});
  const key = opts.key;
  m.customProgramCacheKey = () => "bio-" + key;
  m.onBeforeCompile = sh => {
    sh.uniforms.uBT = BT.uTime; sh.uniforms.uLamp = CZ.uLamp; sh.uniforms.uBL = BL.uBL; sh.uniforms.uBLC = BL.uBLC;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vOP; varying vec3 vIC;" + (opts.vert ? "\nuniform float uBT;" : ""))
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n" + (opts.vert || ""))
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
  vOP = transformed;
  vec4 bwp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  bwp = instanceMatrix * bwp;
  #endif
  vWP = (modelMatrix * bwp).xyz;
  #ifdef USE_INSTANCING_COLOR
  vIC = instanceColor;
  #else
  vIC = vec3(1.0);
  #endif`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 vWP; varying vec3 vOP; varying vec3 vIC; uniform float uBT;
${LAMP_GLSL}
${BL_GLSL}
float bh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bh3(vec3 p){ return bh(p.xy + p.z * 17.13); }
float bn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(bh(i), bh(i+vec2(1,0)), f.x), mix(bh(i+vec2(0,1)), bh(i+vec2(1,1)), f.x), f.y); }`)
      .replace("#include <color_fragment>", "#include <color_fragment>\n" + (opts.tint || ""))
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  { vec3 glow = vec3(0.0);
    ${opts.glow || ""}
    totalEmissiveRadiance += glow; }
  totalEmissiveRadiance += lampLight(vWP, diffuseColor.rgb) + bioLights(vWP, diffuseColor.rgb);`);
  };
  return m;
}

/* ---------- l'instanciation ---------- */
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function inst(group, geo, mat, list, shadow = true, recv = true){
  if(!list.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  let colored = false;
  list.forEach((t, i)=>{
    _e.set(t.rx || 0, t.ry || 0, t.rz || 0); _q.setFromEuler(_e);
    _m.compose(_p.set(t.x, t.y, t.z), _q, _s.set(t.sx || t.s || 1, t.sy || t.s || 1, t.sz || t.s || 1)); im.setMatrixAt(i, _m);
    if(t.c){ if(!colored){ im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3).fill(1), 3); colored = true; } im.setColorAt(i, t.c); }
  });
  im.castShadow = shadow; im.receiveShadow = recv; im.computeBoundingSphere();
  group.add(im);
  return im;
}

/* ---------- les nuées (lucioles, braises, bulles, pages, poussière) ---------- */
/* chaque point a sa place de départ et sa graine ; le mouvement est écrit dans le shader (kind) */
const PT_VS = `
attribute vec4 aSeed; uniform float uBT, uSize, uKind, uRise, uFade; uniform vec3 uFocus;
varying float vA; varying float vS;
void main(){
  vec3 p = position; float s = aSeed.x, t = uBT * (0.6 + aSeed.y * 0.8) + s * 40.0;
  float a = 1.0;
  if(uKind < 0.5){                      /* lucioles : une petite boucle, elles s'allument et s'éteignent */
    p += vec3(sin(t * 0.7) * 1.4, sin(t * 1.1 + s) * 0.6, cos(t * 0.6) * 1.4);
    a = smoothstep(0.2, 1.0, sin(t * 1.9 + s * 13.0)) ;
  } else if(uKind < 1.5){               /* braises, bulles : elles montent, et recommencent */
    float h = mod(aSeed.z * uRise + uBT * (1.0 + aSeed.y * 1.6), uRise);
    p.y += h; p.x += sin(t * 1.3) * (0.3 + h * 0.05); p.z += cos(t * 1.1) * (0.3 + h * 0.05);
    a = smoothstep(0.0, 0.08, h / uRise) * (1.0 - smoothstep(0.55, 1.0, h / uRise));
  } else {                              /* pages, poussière : elles dérivent, tournent */
    p += vec3(sin(t * 0.21) * 4.0, sin(t * 0.33 + s * 5.0) * 1.2, cos(t * 0.17) * 4.0);
    a = 0.55 + 0.45 * sin(t * 0.8);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  a *= 1.0 - smoothstep(uFade * 0.6, uFade, distance(p.xz, uFocus.xz));
  vA = a; vS = aSeed.w;
  gl_PointSize = uSize * (0.6 + aSeed.w * 0.8) * 340.0 / max(d, 0.5);
  gl_Position = projectionMatrix * mv;
}`;
const PT_FS = `
uniform vec3 uC1, uC2; uniform float uKind; varying float vA; varying float vS;
void main(){
  vec2 q = gl_PointCoord - 0.5; float r = length(q);
  float core = smoothstep(0.5, 0.0, r);
  float a = uKind > 1.5 && uKind < 2.5 ? step(abs(q.x), 0.28) * step(abs(q.y), 0.36) * 0.85 : pow(core, 1.6);
  if(a * vA < 0.01) discard;
  gl_FragColor = vec4(mix(uC1, uC2, vS) * a * vA, 1.0);
}`;
export function swarm(group, pts, o){
  const n = pts.length, pos = new Float32Array(n * 3), seed = new Float32Array(n * 4), rnd = mulberry32(o.seed || 7);
  pts.forEach((p, i)=>{ pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; seed[i * 4] = rnd(); seed[i * 4 + 1] = rnd(); seed[i * 4 + 2] = rnd(); seed[i * 4 + 3] = rnd(); });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const U = {uBT:BT.uTime, uSize:{value:o.size || 0.25}, uKind:{value:o.kind || 0}, uRise:{value:o.rise || 20}, uFade:{value:o.fade || 90},
    uFocus:{value:new THREE.Vector3()}, uC1:{value:new THREE.Color(o.c1)}, uC2:{value:new THREE.Color(o.c2 || o.c1)}};
  const m = new THREE.ShaderMaterial({uniforms:U, vertexShader:PT_VS, fragmentShader:PT_FS, transparent:true, depthWrite:false, blending:o.normal ? THREE.NormalBlending : THREE.AdditiveBlending, fog:false});
  const P = new THREE.Points(g, m); P.frustumCulled = false; P.renderOrder = 5;
  group.add(P);
  return U;
}

/* ---------- les puits de lumière : deux plans croisés, un dégradé qui scintille ---------- */
const SH_VS = `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SH_FS = `
uniform vec3 uC; uniform float uBT, uA; varying vec2 vUv; varying vec3 vWP;
float hh(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  float edge = smoothstep(0.0, 0.32, vUv.x) * smoothstep(1.0, 0.68, vUv.x);
  float v = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
  float streak = 0.7 + 0.3 * sin(vUv.x * 21.0 + uBT * 0.4 + vWP.x) * sin(vUv.x * 7.0 - uBT * 0.23);
  float near = smoothstep(2.0, 9.0, distance(cameraPosition, vWP));
  float a = edge * v * streak * uA * near;
  gl_FragColor = vec4(uC * a, 1.0);
}`;
export function shafts(group, list, color, alpha = 0.18){
  const U = {uC:{value:new THREE.Color(color)}, uBT:BT.uTime, uA:{value:alpha}};
  const mat = new THREE.ShaderMaterial({uniforms:U, vertexShader:SH_VS, fragmentShader:SH_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false});
  const parts = [];
  for(const s of list){
    for(const a of [0, Math.PI / 2]){
      const g = new THREE.PlaneGeometry(s.w, s.h, 1, 1); g.translate(0, s.h / 2, 0);
      g.rotateY(a + (s.ry || 0)); g.rotateZ(s.tilt || 0); g.rotateX(s.tiltX || 0);
      g.translate(s.x, s.y, s.z); parts.push(g);
    }
  }
  if(!parts.length) return U;
  const m = new THREE.Mesh(mergeGeometries(parts), mat); m.renderOrder = 6; m.frustumCulled = false;
  group.add(m);
  return U;
}

/* ---------- une étiquette peinte (le nom d'un biome fermé, ce qu'il demande) ---------- */
export function labelSprite(w = 1024, h = 256){
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false, fog:false}));
  sp.renderOrder = 8;
  return {sp, cv, tex};
}
