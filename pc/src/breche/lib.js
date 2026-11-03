/* ============================================================
   LA BRÈCHE EN 3D · LES OUTILS DE DESSIN
   La simulation du jeu mobile compte en pixels sur un plan ; ici,
   1 pixel = 1/32 de mètre, le plan devient le sol (x → x, y → z).
   Trois primitives servent à presque tout dessiner, sans allouer
   d'objet par effet :
     · Glow    — des lueurs en billboard, instanciées (projectiles,
                 éclats, braises, poussières de données) ;
     · Ribbon  — des rubans face caméra (éclairs, traînées, liens) ;
     · Discs   — des disques au sol (zones, alertes, anneaux).
   ============================================================ */
import * as THREE from "three";

export const S = 1 / 32;
export const G = () => window.PCG;
export function ref(n){ try { return G().ref(n); } catch(e){ return undefined; } }

/* les couleurs du jeu mobile (« #ff3d7f », « hsl(…) », « rgba(…) ») en THREE.Color, mises en cache */
const CC = new Map();
export function col(c){
  if(c && c.isColor) return c;
  let v = CC.get(c);
  if(v) return v;
  if(CC.size > 600) CC.clear();
  v = new THREE.Color();
  try { if(typeof c === "string" && c) v.setStyle(c.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, "rgb($1,$2,$3)")); else v.set("#ffffff"); }
  catch(e){ v.set("#ffffff"); }
  CC.set(c, v);
  return v;
}
/* un petit aléa reproductible (pour sculpter le relief d'un morceau de carte) */
export function rng(seed){
  let a = (seed * 4294967296) >>> 0 || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- les lueurs ---------- */
const GLOW_VS = `
attribute vec4 iP; attribute vec4 iC;
varying vec2 vUv; varying vec4 vC; varying float vHard;
void main(){
  vUv = uv; vC = iC; vHard = iP.w < 0.0 ? 1.0 : 0.0;
  vec4 mv = modelViewMatrix * vec4(iP.xyz, 1.0);
  mv.xy += position.xy * abs(iP.w);
  gl_Position = projectionMatrix * mv;
}`;
const GLOW_FS = `
varying vec2 vUv; varying vec4 vC; varying float vHard;
uniform float uAdd;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  if(d > 1.0) discard;
  float a = vHard > 0.5 ? smoothstep(1.0, 0.55, d) : pow(1.0 - d, 2.2);
  if(uAdd > 0.5) gl_FragColor = vec4(vC.rgb * a * vC.a, 1.0);
  else gl_FragColor = vec4(vC.rgb, a * vC.a);
}`;
export class Glow {
  constructor(scene, cap = 4000, additive = true){
    this.cap = cap; this.n = 0;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.p = new Float32Array(cap * 4); this.c = new Float32Array(cap * 4);
    this.aP = new THREE.InstancedBufferAttribute(this.p, 4).setUsage(THREE.DynamicDrawUsage);
    this.aC = new THREE.InstancedBufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("iP", this.aP); g.setAttribute("iC", this.aC);
    g.instanceCount = 0;
    const m = new THREE.ShaderMaterial({vertexShader:GLOW_VS, fragmentShader:GLOW_FS, uniforms:{uAdd:{value:additive ? 1 : 0}},
      transparent:true, depthWrite:false, blending:additive ? THREE.AdditiveBlending : THREE.NormalBlending});
    if(additive){ m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor; }
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 20 : 15;
    this.geo = g;
    scene.add(this.mesh);
  }
  begin(){ this.n = 0; }
  /* taille en mètres ; une taille négative donne un point net (étincelle) plutôt qu'un halo */
  add(x, y, z, size, c, a = 1){
    if(this.n >= this.cap) return;
    const i = this.n++ * 4, C = col(c);
    this.p[i] = x; this.p[i + 1] = y; this.p[i + 2] = z; this.p[i + 3] = size;
    this.c[i] = C.r; this.c[i + 1] = C.g; this.c[i + 2] = C.b; this.c[i + 3] = a;
  }
  end(){
    this.geo.instanceCount = this.n;
    this.aP.needsUpdate = true; this.aC.needsUpdate = true;
    this.aP.clearUpdateRanges(); this.aP.addUpdateRange(0, this.n * 4);
    this.aC.clearUpdateRanges(); this.aC.addUpdateRange(0, this.n * 4);
  }
}

/* ---------- les rubans ---------- */
const RIB_VS = `attribute vec4 aC; varying vec4 vC; varying float vS; attribute float aS;
void main(){ vC = aC; vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RIB_FS = `varying vec4 vC; varying float vS;
void main(){ float e = 1.0 - abs(vS); float a = smoothstep(0.0, 0.6, e); gl_FragColor = vec4(vC.rgb * a * vC.a + vec3(1.0) * pow(e, 6.0) * vC.a * 0.6, 1.0); }`;
export class Ribbon {
  constructor(scene, cap = 5000){
    this.cap = cap; this.n = 0;
    this.pos = new Float32Array(cap * 4 * 3); this.c = new Float32Array(cap * 4 * 4); this.s = new Float32Array(cap * 4);
    const idx = new Uint32Array(cap * 6);
    for(let i = 0; i < cap; i++){ const v = i * 4, k = i * 6; idx[k] = v; idx[k + 1] = v + 1; idx[k + 2] = v + 2; idx[k + 3] = v + 2; idx[k + 4] = v + 1; idx[k + 5] = v + 3; }
    for(let i = 0; i < cap; i++){ this.s[i * 4] = -1; this.s[i * 4 + 1] = 1; this.s[i * 4 + 2] = -1; this.s[i * 4 + 3] = 1; }
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aC = new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", this.aPos); g.setAttribute("aC", this.aC); g.setAttribute("aS", new THREE.BufferAttribute(this.s, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setDrawRange(0, 0);
    const m = new THREE.ShaderMaterial({vertexShader:RIB_VS, fragmentShader:RIB_FS, transparent:true, depthWrite:false, side:THREE.DoubleSide,
      blending:THREE.CustomBlending, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor});
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = 21;
    this.geo = g; scene.add(this.mesh);
    this.eye = new THREE.Vector3(); this._d = new THREE.Vector3(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3();
  }
  begin(eye){ this.n = 0; this.eye.copy(eye); }
  seg(ax, ay, az, bx, by, bz, w, c, a = 1, wb){
    if(this.n >= this.cap) return;
    const d = this._d.set(bx - ax, by - ay, bz - az), v = this._v.set((ax + bx) / 2 - this.eye.x, (ay + by) / 2 - this.eye.y, (az + bz) / 2 - this.eye.z);
    const sd = this._s.crossVectors(d, v); const L = sd.length() || 1;
    const hx = sd.x / L / 2, hy = sd.y / L / 2, hz = sd.z / L / 2, w2 = wb === undefined ? w : wb;
    const i = this.n++, p = i * 12, C = col(c);
    this.pos[p] = ax - hx * w; this.pos[p + 1] = ay - hy * w; this.pos[p + 2] = az - hz * w;
    this.pos[p + 3] = ax + hx * w; this.pos[p + 4] = ay + hy * w; this.pos[p + 5] = az + hz * w;
    this.pos[p + 6] = bx - hx * w2; this.pos[p + 7] = by - hy * w2; this.pos[p + 8] = bz - hz * w2;
    this.pos[p + 9] = bx + hx * w2; this.pos[p + 10] = by + hy * w2; this.pos[p + 11] = bz + hz * w2;
    const q = i * 16;
    for(let k = 0; k < 4; k++){ this.c[q + k * 4] = C.r; this.c[q + k * 4 + 1] = C.g; this.c[q + k * 4 + 2] = C.b; this.c[q + k * 4 + 3] = a; }
  }
  /* une ligne brisée ; jitter : l'éclair tremble d'une image à l'autre */
  line(pts, w, c, a = 1, jitter = 0){
    for(let i = 1; i < pts.length; i++){
      const p0 = pts[i - 1], p1 = pts[i];
      const j0 = i > 1 ? jitter : 0, j1 = i < pts.length - 1 ? jitter : 0;
      this.seg(p0[0] + (Math.random() - .5) * j0, p0[1] + (Math.random() - .5) * j0, p0[2] + (Math.random() - .5) * j0,
               p1[0] + (Math.random() - .5) * j1, p1[1] + (Math.random() - .5) * j1, p1[2] + (Math.random() - .5) * j1, w, c, a);
    }
  }
  /* un éclair entre deux points : on le brise en zigzag */
  bolt(ax, ay, az, bx, by, bz, w, c, a = 1, n = 7, amp = 0.35){
    const pts = [[ax, ay, az]];
    for(let k = 1; k < n; k++){ const t = k / n; pts.push([ax + (bx - ax) * t + (Math.random() - .5) * amp, ay + (by - ay) * t + (Math.random() - .5) * amp, az + (bz - az) * t + (Math.random() - .5) * amp]); }
    pts.push([bx, by, bz]);
    this.line(pts, w, c, a);
    this.line(pts, w * 0.35, "#ffffff", a);
  }
  end(){
    this.geo.setDrawRange(0, this.n * 6);
    this.aPos.needsUpdate = true; this.aC.needsUpdate = true;
    this.aPos.clearUpdateRanges(); this.aPos.addUpdateRange(0, this.n * 12);
    this.aC.clearUpdateRanges(); this.aC.addUpdateRange(0, this.n * 16);
  }
}

/* ---------- les disques au sol : zones, alertes, anneaux, abris ---------- */
const DISC_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DISC_FS = `
varying vec2 vUv;
uniform vec3 uC; uniform float uA, uFill, uRim, uDash, uT, uProg, uInner, uPulse;
void main(){
  vec2 p = vUv - 0.5; float d = length(p) * 2.0;
  if(d > 1.0 || d < uInner) discard;
  float fill = uFill * (0.55 + 0.45 * d * d) * (1.0 + uPulse * sin(uT * 9.0) * 0.4);
  float rim = smoothstep(0.9, 0.97, d) * (1.0 - smoothstep(0.985, 1.0, d));
  if(uDash > 0.5){ float an = atan(p.y, p.x); rim *= step(0.0, sin(an * 24.0 - uT * 6.0)); }
  float pr = uProg > 0.0 ? smoothstep(0.035, 0.0, abs(d - uProg)) : 0.0;
  float inner = uInner > 0.0 ? smoothstep(uInner + 0.06, uInner, d) : 0.0;
  float a = (fill + rim * uRim + pr * 0.9 + inner * uRim) * uA;
  gl_FragColor = vec4(uC * a, 1.0);
}`;
const DISC_GEO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
export class Discs {
  constructor(scene){ this.scene = scene; this.list = []; this.n = 0; }
  begin(){ this.n = 0; }
  /* o : {fill, rim, dash, prog, inner, pulse, a} */
  add(x, z, r, c, o = {}, y = 0.04){
    let m = this.list[this.n];
    if(!m){
      const mat = new THREE.ShaderMaterial({vertexShader:DISC_VS, fragmentShader:DISC_FS, transparent:true, depthWrite:false,
        blending:THREE.CustomBlending, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor,
        uniforms:{uC:{value:new THREE.Color()}, uA:{value:1}, uFill:{value:0.2}, uRim:{value:1}, uDash:{value:0}, uT:{value:0}, uProg:{value:0}, uInner:{value:0}, uPulse:{value:0}},
        polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
      m = new THREE.Mesh(DISC_GEO, mat); m.renderOrder = 8; m.frustumCulled = false;
      this.scene.add(m); this.list.push(m);
    }
    this.n++;
    m.visible = true;
    m.position.set(x, y, z); m.scale.set(r * 2, 1, r * 2);
    const U = m.material.uniforms;
    U.uC.value.copy(col(c)); U.uA.value = o.a === undefined ? 1 : o.a;
    U.uFill.value = o.fill === undefined ? 0.18 : o.fill; U.uRim.value = o.rim === undefined ? 0.9 : o.rim;
    U.uDash.value = o.dash ? 1 : 0; U.uProg.value = o.prog || 0; U.uInner.value = o.inner || 0; U.uPulse.value = o.pulse || 0;
    U.uT.value = Discs.t;
    return m;
  }
  end(){ for(let i = this.n; i < this.list.length; i++) this.list[i].visible = false; }
}
Discs.t = 0;

/* ---------- un réservoir d'objets 3D faits sur mesure (rayons, murs, tornades…) ---------- */
export class Pool {
  constructor(scene, make){ this.scene = scene; this.make = make; this.list = []; this.n = 0; }
  begin(){ this.n = 0; }
  take(){
    let o = this.list[this.n];
    if(!o){ o = this.make(); this.scene.add(o); this.list.push(o); }
    this.n++; o.visible = true;
    return o;
  }
  end(){ for(let i = this.n; i < this.list.length; i++) this.list[i].visible = false; }
}

/* une texture de halo, pour les sprites */
let GLOWTEX = null;
export function glowTex(){
  if(GLOWTEX) return GLOWTEX;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  GLOWTEX = new THREE.CanvasTexture(c);
  return GLOWTEX;
}
/* le matériau additif des effets en volume : couleur × intensité, bords adoucis selon l'angle */
export function addMat(color, opacity = 1, opts = {}){
  return new THREE.MeshBasicMaterial(Object.assign({color:col(color).clone(), transparent:true, opacity, depthWrite:false,
    blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false}, opts));
}
