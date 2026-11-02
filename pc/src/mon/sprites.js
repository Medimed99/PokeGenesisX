/* ============================================================
   LES POKÉMON DANS LE MONDE
   Les planches de Pokémon Donjon Mystère (PMDCollab, CC BY-NC 4.0),
   déjà dans le jeu : 8 directions, la marche, l'attente, l'attaque,
   la douleur. Dans la 3D, chaque Pokémon est un panneau tourné vers
   la caméra qui choisit la rangée selon l'angle de vue : on le voit
   de face, de dos, de profil, comme un vrai objet. Sa taille est sa
   taille réelle (un Roucool tient dans la main, un Onix domine).
   Les planches viennent du jeu mobile (brPmdVariant, brAnimSheet) :
   mêmes fichiers, même recoloration des chromatiques.
   ============================================================ */
import * as THREE from "three";
import { HEIGHT } from "../data/sizes.js";

const TEX = new Map();          /* "id:anim:variant" → {tex, sheet, w, h, n, dur, rows, vis} */
const G = () => window.PCG;

function sheetCanvas(id, anim, variant){
  try {
    if(anim === "walk") return window.brPmdVariant ? window.brPmdVariant(id, variant) : null;
    return window.brAnimSheet ? window.brAnimSheet(id, anim, variant) : null;
  } catch(e){ return null; }
}
function meta(id, anim){
  const g = G(); if(!g) return null;
  if(anim === "walk"){ const m = g.PMD_META[id]; return m ? {w:m[0], h:m[1], n:m[2], dur:m[3]} : null; }
  const a = g.PMD_ANIM[id] && g.PMD_ANIM[id][anim]; return a ? {w:a[0], h:a[1], n:a[2], dur:a[3]} : null;
}
/* la hauteur visible d'un dessin (sans les marges transparentes de la case), mesurée une fois */
function measure(canvas, m){
  try {
    const x = canvas.getContext("2d", {willReadFrequently:true});
    const d = x.getImageData(0, 0, m.w, m.h).data;
    let top = m.h, bot = -1, left = m.w, right = -1;
    for(let y = 0; y < m.h; y++) for(let k = 0; k < m.w; k++) if(d[(y * m.w + k) * 4 + 3] > 40){ if(y < top) top = y; if(y > bot) bot = y; if(k < left) left = k; if(k > right) right = k; }
    if(bot < 0) return {top:0, bot:m.h - 1, h:m.h, cx:m.w / 2};
    return {top, bot, h:bot - top + 1, cx:(left + right + 1) / 2};
  } catch(e){ return {top:0, bot:m.h - 1, h:m.h, cx:m.w / 2}; }
}
export function getSheet(id, anim, variant){
  const key = id + ":" + anim + ":" + variant;
  let e = TEX.get(key);
  if(e) return e.ready ? e : null;
  const m = meta(id, anim);
  if(!m){ TEX.set(key, {ready:false, none:true}); return null; }
  const c = sheetCanvas(id, anim, variant);
  if(!c) return null;                                  /* pas encore chargée : on redemandera */
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  e = Object.assign({ready:true, tex, canvas:c, sw:c.width, sh:c.height, rows:Math.max(1, Math.round(c.height / m.h))}, m);
  e.vis = measure(c, m);
  TEX.set(key, e);
  return e;
}
export function frameAt(dur, t){
  let total = 0; for(const d of dur) total += d;
  let k = Math.floor(t * 60) % total;
  for(let i = 0; i < dur.length; i++){ if(k < dur[i]) return i; k -= dur[i]; }
  return 0;
}
/* la rangée PMD (bas, bas-droite, droite, haut-droite, haut, haut-gauche, gauche, bas-gauche)
   depuis la direction où il regarde, vue de la caméra */
export function dirRow(heading, mon, cam){
  const fx = mon.x - cam.x, fz = mon.z - cam.z, L = Math.hypot(fx, fz) || 1;
  const f = {x:fx / L, z:fz / L}, r = {x:-f.z, z:f.x};
  const hx = Math.sin(heading), hz = Math.cos(heading);
  const sx = hx * r.x + hz * r.z, sy = hx * f.x + hz * f.z;      /* à droite de l'écran, s'éloigne */
  const a = Math.atan2(-sy, sx) * 180 / Math.PI;
  return ((Math.round((90 - a) / 45) % 8) + 8) % 8;
}
export function realHeight(id){ const h = HEIGHT[id] || 0.8; return Math.max(0.32, Math.min(9, h)); }

const vert = `
uniform vec4 uRect; uniform vec2 uSize; uniform vec2 uOffset;
varying vec2 vUv; varying float vFogDepth;
void main(){
  vUv = uRect.xy + uv * uRect.zw;
  /* un panneau qui tourne autour de l'axe vertical, face à la caméra */
  vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 toCam = cameraPosition - center; toCam.y = 0.0; toCam = normalize(toCam + vec3(1e-5, 0.0, 0.0));
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
  vec3 p = center + right * ((position.x + uOffset.x) * uSize.x) + vec3(0.0, (position.y * uSize.y) + uOffset.y, 0.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  vFogDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const frag = `
uniform sampler2D uMap; uniform vec3 uTint; uniform float uFlash, uAlpha, uRed, uGlitch, uTime; uniform vec3 uFog; uniform float uFogDensity;
varying vec2 vUv; varying float vFogDepth;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  vec2 uv = vUv;
  /* désindexation : des bandes horizontales qui glissent */
  if(uGlitch > 0.0){ float band = floor(uv.y * 40.0); uv.x += (h21(vec2(band, floor(uTime * 20.0))) - 0.5) * 0.08 * uGlitch; }
  vec4 c = texture2D(uMap, uv);
  if(c.a < 0.5) discard;
  if(uGlitch > 0.0 && h21(floor(vUv * 64.0) + floor(uTime * 12.0)) < uGlitch * 0.8) discard;
  vec3 col = c.rgb * uTint;
  col = mix(col, vec3(1.0, 0.12, 0.2) * 1.6, uRed);
  col = mix(col, vec3(1.0), uFlash);
  float fogF = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  col = mix(col, uFog, fogF);
  gl_FragColor = vec4(col, uAlpha);
  #include <colorspace_fragment>
}`;

/* la silhouette à travers l'herbe : seulement là où quelque chose cache le Pokémon */
const fragXray = `
uniform sampler2D uMap; uniform float uAlpha, uXray;
varying vec2 vUv; varying float vFogDepth;
void main(){
  vec4 c = texture2D(uMap, vUv);
  if(c.a < 0.5) discard;
  /* une silhouette de données : cyan, en lignes de balayage */
  float rim = 0.55 + 0.45 * smoothstep(0.2, 0.9, length(c.rgb));
  float sl = 0.55 + 0.45 * step(0.5, fract(gl_FragCoord.y * 0.25));
  gl_FragColor = vec4(vec3(0.35, 1.0, 0.9) * rim * sl, 0.5 * uXray * uAlpha);
  #include <colorspace_fragment>
}`;

/* l'ombre au sol, une tache douce */
let SHADOW_TEX = null;
function shadowTex(){
  if(SHADOW_TEX) return SHADOW_TEX;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.6, "rgba(0,0,0,0.3)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  SHADOW_TEX = new THREE.CanvasTexture(c);
  return SHADOW_TEX;
}

export class MonSprite {
  constructor(id, shiny, scene, opts = {}){
    this.id = id; this.shiny = !!shiny; this.variant = this.shiny ? "s" : "n";
    this.H = opts.height || realHeight(id);
    this.uniforms = {uMap:{value:null}, uRect:{value:new THREE.Vector4(0, 0, 1, 1)}, uSize:{value:new THREE.Vector2(1, 1)}, uOffset:{value:new THREE.Vector2(-0.5, 0)},
      uTint:{value:new THREE.Color(1, 1, 1)}, uFlash:{value:0}, uAlpha:{value:1}, uRed:{value:0}, uGlitch:{value:0}, uTime:{value:0},
      uFog:{value:new THREE.Color()}, uFogDensity:{value:0}, uXray:{value:0}};
    this.mat = new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:vert, fragmentShader:frag, transparent:false, side:THREE.DoubleSide});
    const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0.5, 0.5, 0);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.visible = false;
    this.xrayMat = new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:vert, fragmentShader:fragXray, transparent:true, depthWrite:false,
      depthFunc:THREE.GreaterDepth, side:THREE.DoubleSide});
    this.xrayMesh = new THREE.Mesh(geo, this.xrayMat);
    this.xrayMesh.frustumCulled = false; this.xrayMesh.visible = false; this.xrayMesh.renderOrder = 6;
    this.xray = 0;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map:shadowTex(), transparent:true, depthWrite:false}));
    this.shadow.renderOrder = 1;
    this.group = new THREE.Group();
    this.group.add(this.mesh, this.xrayMesh, this.shadow);
    scene.add(this.group);
    this.anim = "idle"; this.animT = 0; this.scale = 1; this.lift = 0;
    this.width = this.H * 0.8;
  }
  /* le cadre du dessin courant, à la bonne taille */
  apply(e, frame, row){
    const U = this.uniforms;
    if(U.uMap.value !== e.tex) U.uMap.value = e.tex;
    const rr = Math.min(row, e.rows - 1);
    U.uRect.value.set(frame * e.w / e.sw, 1 - (rr + 1) * e.h / e.sh, e.w / e.sw, e.h / e.sh);
    /* la marche sert d'étalon : toutes les animations gardent la même échelle */
    const ref = getSheet(this.id, "walk", this.variant) || e;
    const mpp = this.H / Math.max(4, ref.vis.h) * this.scale;
    U.uSize.value.set(e.w * mpp, e.h * mpp);
    /* les pieds au sol : la ligne basse visible de la marche, au centre du cadre courant */
    const bottomPx = e === ref ? (e.h - 1 - e.vis.bot) : Math.max(0, (e.h - ref.h) / 2 + (ref.h - 1 - ref.vis.bot));
    U.uOffset.value.set(-0.5 - (e.vis.cx - e.w / 2) / e.w * 0, -bottomPx * mpp + this.lift);
    this.width = Math.max(0.3, ref.vis.h * mpp * 0.9);
    this.drawH = ref.vis.h * mpp;
    this.mesh.visible = true;
  }
  update(t, dt, pos, heading, cam, env){
    this.group.position.copy(pos);
    const U = this.uniforms;
    U.uTime.value = t;
    if(env){ U.uTint.value.copy(env.tint); U.uFog.value.copy(env.fog); U.uFogDensity.value = env.fogDensity; }
    this.animT += dt;
    let e = getSheet(this.id, this.anim, this.variant);
    if(!e && this.anim !== "walk") e = getSheet(this.id, "walk", this.variant);
    if(!e && this.variant === "s") e = getSheet(this.id, this.anim, "n") || getSheet(this.id, "walk", "n");
    if(!e){ this.mesh.visible = false; this.xrayMesh.visible = false; return; }
    /* débusqué, il reste lisible à travers les hautes herbes */
    U.uXray.value += ((this.xray || 0) - U.uXray.value) * Math.min(1, dt * 6);
    this.xrayMesh.visible = U.uXray.value > 0.02;
    const row = e.rows >= 8 ? dirRow(heading, pos, cam) : 0;
    const frame = this.frozen ? 0 : frameAt(e.dur, this.animT);
    this.apply(e, frame, row);
    const sw = this.width * 1.1;
    this.shadow.scale.set(sw, 1, sw * 0.7);
    this.shadow.position.set(0, (this.groundY !== undefined ? this.groundY - pos.y : 0) + 0.03, 0);
    this.shadow.material.opacity = Math.max(0, 1 - this.lift / 3) * U.uAlpha.value;
  }
  setAnim(a){ if(this.anim !== a){ this.anim = a; this.animT = 0; } }
  dispose(){
    this.group.parent && this.group.parent.remove(this.group);
    this.mat.dispose(); this.xrayMat.dispose(); this.mesh.geometry.dispose(); this.shadow.geometry.dispose(); this.shadow.material.dispose();
  }
}
/* préchargement : on demande les planches tôt, elles arrivent pendant qu'on marche */
export function preload(id, shiny){
  for(const a of ["walk", "idle"]){ getSheet(id, a, "n"); if(shiny) getSheet(id, a, "s"); }
}
