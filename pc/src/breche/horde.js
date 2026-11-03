/* ============================================================
   LA BRÈCHE EN 3D · LA HORDE
   Jusqu'à 150 ennemis à l'écran : un squelette animé par ennemi
   coûterait trop cher. On précalcule donc, une fois par espèce, sa
   marche en 16 images (positions et normales de chaque sommet,
   rangées dans une texture), puis chaque espèce se dessine en UN
   appel, instanciée : chaque ennemi lit sa propre image de marche
   dans la texture (« vertex animation texture »).
   Les ennemis portent la palette de la faille (celle des sprites
   corrompus du jeu mobile) et un liseré magenta ; un chromatique
   garde ses couleurs, cerclé d'or. Éclair blanc quand il est
   touché, givre quand il est gelé, fondu en trame quand il sort
   de la faille.
   ============================================================ */
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { loadModelData, has3D, CORRUPT_GLSL } from "../mon/model3d.js";
import { OCC, OCC_GLSL } from "../mon/occ.js";

const FRAMES = 16, TEXW = 1024, CAP = 170;

function pickClip(clips, names){
  for(const n of names){ const c = clips.find(c=>c.name === n); if(c) return c; }
  return clips[0] || null;
}

/* ---------- le précalcul : la marche, image par image ---------- */
async function bake(id){
  const d = await loadModelData(id);
  const root = cloneSkinned(d.scene);
  root.updateMatrixWorld(true);
  const clip = pickClip(d.clips, ["walk", "run", "idle"]);
  const mixer = new THREE.AnimationMixer(root);
  if(clip) mixer.clipAction(clip).play();
  const N = clip ? FRAMES : 1, dur = clip ? clip.duration : 1;
  const meshes = []; root.traverse(o=>{ if(o.isMesh && o.geometry && o.geometry.attributes.position) meshes.push(o); });
  /* les attributs du fichier sont compressés (entiers normalisés) : on les relit en flottants */
  const flat = (a, n) => { if(!a) return null; const o = new Float32Array(a.count * n); for(let i = 0; i < a.count; i++){ o[i * n] = a.getX(i); if(n > 1) o[i * n + 1] = a.getY(i); if(n > 2) o[i * n + 2] = a.getZ(i); if(n > 3) o[i * n + 3] = a.getW(i); } return o; };
  const parts = meshes.map(m=>{
    const A = m.geometry.attributes, V = A.position.count, rows = Math.ceil(V / TEXW);
    return {m, V, rows, P:new Float32Array(TEXW * rows * N * 4), Nn:new Float32Array(TEXW * rows * N * 4),
      pos:flat(A.position, 3), nor:flat(A.normal, 3), si:flat(A.skinIndex, 4), sw:flat(A.skinWeight, 4)};
  });
  const h0 = d.h0, y0 = d.minY;
  const B = new THREE.Matrix4(), M3 = new THREE.Matrix3();
  for(let f = 0; f < N; f++){
    if(clip) mixer.setTime(f / N * dur);
    root.updateMatrixWorld(true);
    for(const p of parts){
      const m = p.m, g = m.geometry, pos = p.pos, nor = p.nor;
      const skinned = m.isSkinnedMesh && g.attributes.skinIndex;
      /* monde × liaison inverse : ce qui reste après le mélange des os */
      const W = B.copy(m.matrixWorld);
      if(skinned){ m.skeleton.update(); W.multiply(m.bindMatrixInverse); }
      const w = W.elements;
      M3.setFromMatrix4(W); const n3 = M3.elements;
      const bm = skinned ? m.skeleton.boneMatrices : null, bb = skinned ? m.bindMatrix.elements : null;
      const si = skinned ? p.si : null, sw = skinned ? p.sw : null;
      const base = f * p.rows * TEXW * 4;
      for(let v = 0; v < p.V; v++){
        let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
        let nx = nor ? nor[v * 3] : 0, ny = nor ? nor[v * 3 + 1] : 1, nz = nor ? nor[v * 3 + 2] : 0;
        if(skinned){
          /* liaison */
          const bx = bb[0] * x + bb[4] * y + bb[8] * z + bb[12], by = bb[1] * x + bb[5] * y + bb[9] * z + bb[13], bz = bb[2] * x + bb[6] * y + bb[10] * z + bb[14];
          const bnx = bb[0] * nx + bb[4] * ny + bb[8] * nz, bny = bb[1] * nx + bb[5] * ny + bb[9] * nz, bnz = bb[2] * nx + bb[6] * ny + bb[10] * nz;
          let sx = 0, sy = 0, sz = 0, snx = 0, sny = 0, snz = 0;
          for(let k = 0; k < 4; k++){
            const wt = sw[v * 4 + k]; if(wt <= 0) continue;
            const o = si[v * 4 + k] * 16;
            sx += wt * (bm[o] * bx + bm[o + 4] * by + bm[o + 8] * bz + bm[o + 12]);
            sy += wt * (bm[o + 1] * bx + bm[o + 5] * by + bm[o + 9] * bz + bm[o + 13]);
            sz += wt * (bm[o + 2] * bx + bm[o + 6] * by + bm[o + 10] * bz + bm[o + 14]);
            snx += wt * (bm[o] * bnx + bm[o + 4] * bny + bm[o + 8] * bnz);
            sny += wt * (bm[o + 1] * bnx + bm[o + 5] * bny + bm[o + 9] * bnz);
            snz += wt * (bm[o + 2] * bnx + bm[o + 6] * bny + bm[o + 10] * bnz);
          }
          x = sx; y = sy; z = sz; nx = snx; ny = sny; nz = snz;
        }
        const wx = w[0] * x + w[4] * y + w[8] * z + w[12], wy = w[1] * x + w[5] * y + w[9] * z + w[13], wz = w[2] * x + w[6] * y + w[10] * z + w[14];
        let mx = n3[0] * nx + n3[3] * ny + n3[6] * nz, my = n3[1] * nx + n3[4] * ny + n3[7] * nz, mz = n3[2] * nx + n3[5] * ny + n3[8] * nz;
        const L = Math.hypot(mx, my, mz) || 1; mx /= L; my /= L; mz /= L;
        const o = base + v * 4;
        p.P[o] = wx / h0; p.P[o + 1] = (wy - y0) / h0; p.P[o + 2] = wz / h0; p.P[o + 3] = 1;
        p.Nn[o] = mx; p.Nn[o + 1] = my; p.Nn[o + 2] = mz; p.Nn[o + 3] = 0;
      }
    }
  }
  mixer.stopAllAction();
  /* largeur relative (pour l'ombre) */
  return {parts, N, dur, w0:d.w0 / h0};
}

/* ---------- le matériau : la marche lue dans la texture, la palette de la faille ---------- */
function hordeMaterial(src, tex){
  const m = new THREE.MeshStandardMaterial({map:src.map || null, color:src.color ? src.color.clone() : new THREE.Color(1, 1, 1),
    roughness:0.75, metalness:0, transparent:false, alphaTest:src.alphaTest || (src.transparent ? 0.35 : 0), side:src.side});
  m.onBeforeCompile = sh => {
    sh.uniforms.uEye = OCC.uEye; sh.uniforms.uFocus = OCC.uFocus;
    sh.uniforms.uVP = {value:tex.P}; sh.uniforms.uVN = {value:tex.N}; sh.uniforms.uVRows = {value:tex.rows}; sh.uniforms.uVF = {value:tex.frames};
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
uniform highp sampler2D uVP; uniform highp sampler2D uVN; uniform int uVRows; uniform int uVF;
attribute vec4 iAnim; attribute vec4 iFx; attribute vec3 iTint;
varying vec4 vAnim; varying vec4 vFx; varying vec3 vTint; varying vec3 vHW;`)
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vHW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;")
      .replace("#include <beginnormal_vertex>", `
  int vid = gl_VertexID;
  float frm = mod(iAnim.x, float(uVF));
  int f0 = int(floor(frm)); int f1 = f0 + 1; if(f1 >= uVF) f1 = 0; float fk = frm - floor(frm);
  ivec2 c0 = ivec2(vid % ${TEXW}, f0 * uVRows + vid / ${TEXW});
  ivec2 c1 = ivec2(vid % ${TEXW}, f1 * uVRows + vid / ${TEXW});
  vec3 objectNormal = normalize(mix(texelFetch(uVN, c0, 0).xyz, texelFetch(uVN, c1, 0).xyz, fk));
  vAnim = iAnim; vFx = iFx; vTint = iTint;`)
      .replace("#include <begin_vertex>", `vec3 transformed = mix(texelFetch(uVP, c0, 0).xyz, texelFetch(uVP, c1, 0).xyz, fk);`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec4 vAnim; varying vec4 vFx; varying vec3 vTint; varying vec3 vHW;
${CORRUPT_GLSL}
${OCC_GLSL}
float hh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
  occTest(vHW, 1.0);
  if(vAnim.w < 0.999 && hh(floor(gl_FragCoord.xy)) > vAnim.w) discard;`)
      .replace("#include <map_fragment>", `#include <map_fragment>
  diffuseColor.rgb = mix(diffuseColor.rgb, corruptCol(diffuseColor.rgb), vFx.x);
  diffuseColor.rgb = mix(diffuseColor.rgb, vTint, vFx.y);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.75, 0.95, 1.1), vAnim.z * 0.7);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  float rimH = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.4);
  totalEmissiveRadiance += vec3(1.0, 0.16, 0.5) * rimH * 0.6 * vFx.x + vec3(1.0, 0.8, 0.3) * rimH * vFx.z + vec3(0.6, 0.9, 1.0) * rimH * vAnim.z;`)
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), vAnim.y);`);
  };
  m.customProgramCacheKey = () => "horde-vat|" + (src.transparent ? 1 : 0);
  return m;
}

/* demi-flottants : deux fois moins de mémoire, assez précis pour un Pokémon d'un mètre */
function half(a){ const o = new Uint16Array(a.length), h = THREE.DataUtils.toHalfFloat; for(let i = 0; i < a.length; i++) o[i] = h(a[i]); return o; }

/* ---------- une espèce : ses maillages instanciés ---------- */
class Species {
  constructor(scene, id, data, srcMeshes){
    this.id = id; this.data = data; this.n = 0; this.meshes = [];
    this.anim = new Float32Array(CAP * 4); this.fx = new Float32Array(CAP * 4); this.tint = new Float32Array(CAP * 3);
    this.aAnim = new THREE.InstancedBufferAttribute(this.anim, 4).setUsage(THREE.DynamicDrawUsage);
    this.aFx = new THREE.InstancedBufferAttribute(this.fx, 4).setUsage(THREE.DynamicDrawUsage);
    this.aTint = new THREE.InstancedBufferAttribute(this.tint, 3).setUsage(THREE.DynamicDrawUsage);
    data.parts.forEach((p, i)=>{
      const tP = new THREE.DataTexture(half(p.P), TEXW, p.rows * data.N, THREE.RGBAFormat, THREE.HalfFloatType); tP.needsUpdate = true;
      const tN = new THREE.DataTexture(half(p.Nn), TEXW, p.rows * data.N, THREE.RGBAFormat, THREE.HalfFloatType); tN.needsUpdate = true;
      const g = p.m.geometry.clone();
      for(const k of Object.keys(g.attributes)) if(!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      g.setAttribute("iAnim", this.aAnim); g.setAttribute("iFx", this.aFx); g.setAttribute("iTint", this.aTint);
      const mats = Array.isArray(p.m.material) ? p.m.material : [p.m.material];
      const mm = mats.map(s=>hordeMaterial(s, {P:tP, N:tN, rows:p.rows, frames:data.N}));
      const im = new THREE.InstancedMesh(g, mm.length > 1 ? mm : mm[0], CAP);
      im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(im); this.meshes.push(im);
    });
  }
  dispose(scene){ for(const m of this.meshes){ scene.remove(m); m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach(x=>x.dispose()); } }
}

/* ---------- les ombres de la horde : des taches au sol, instanciées ---------- */
class Blobs {
  constructor(scene, cap = 260){
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(0.6, "rgba(0,0,0,.28)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const m = new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1});
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), m, cap);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; this.cap = cap;
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3();
    scene.add(this.mesh);
  }
  begin(){ this.n = 0; }
  add(x, z, w, d){ if(this.n >= this.cap) return; this.m4.compose(this.v.set(x, 0.03, z), this.q, this.s.set(w, 1, d)); this.mesh.setMatrixAt(this.n++, this.m4); }
  end(){ this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true; }
}

export class Horde {
  static bake(id){ return bake(id); }
  constructor(scene){
    this.scene = scene; this.sp = new Map(); this.queue = []; this.busy = false;
    this.blobs = new Blobs(scene);
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0);
  }
  /* une espèce à préparer (dans l'ordre d'arrivée, une à la fois) */
  want(id){
    if(this.sp.has(id)) return;
    if(!has3D(id)){ this.sp.set(id, {state:"none"}); return; }
    this.sp.set(id, {state:"queued"}); this.queue.push(id);
  }
  pump(t){
    /* une espèce qu'on n'a plus vue depuis longtemps rend sa mémoire */
    if(t !== undefined) for(const [id, r] of this.sp) if(r.s && t - (r.seen || t) > 50){ r.s.dispose(this.scene); this.sp.delete(id); }
    this.now = t;
    if(this.busy || !this.queue.length) return;
    const id = this.queue.shift(), rec = this.sp.get(id);
    this.busy = true; rec.state = "loading";
    bake(id).then(data=>{
      if(this.disposed) return;
      const s = new Species(this.scene, id, data);
      this.sp.set(id, {state:"ready", s, seen:this.now});
    }).catch(err=>{ console.warn("horde : modèle indisponible", id, err); this.sp.set(id, {state:"none"}); })
      .finally(()=>{ this.busy = false; });
  }
  ready(id){ const r = this.sp.get(id); return r && r.state === "ready" ? r.s : null; }
  begin(){ for(const r of this.sp.values()) if(r.s) r.s.n = 0; this.blobs.begin(); }
  /* o : {x, z, yaw, h, frame, flash, frozen, alpha, corrupt, tint:[r,g,b], tintA, gold} */
  add(id, o){
    const s = this.ready(id);
    if(s){ const r = this.sp.get(id); r.seen = this.now; }
    this.blobs.add(o.x, o.z, o.h * 0.9 * (s ? Math.min(1.6, Math.max(0.6, s.data.w0)) : 1), o.h * 0.6);
    if(!s || s.n >= CAP) return false;
    const i = s.n++;
    this.q.setFromAxisAngle(this.up, o.yaw);
    this.m4.compose(this.v.set(o.x, o.y || 0, o.z), this.q, this.s.set(o.h, o.h, o.h));
    for(const m of s.meshes) m.setMatrixAt(i, this.m4);
    const a = s.anim, f = s.fx, t = s.tint;
    a[i * 4] = o.frame; a[i * 4 + 1] = o.flash || 0; a[i * 4 + 2] = o.frozen || 0; a[i * 4 + 3] = o.alpha === undefined ? 1 : o.alpha;
    f[i * 4] = o.corrupt === undefined ? 1 : o.corrupt; f[i * 4 + 1] = o.tintA || 0; f[i * 4 + 2] = o.gold || 0; f[i * 4 + 3] = 0;
    if(o.tint){ t[i * 3] = o.tint[0]; t[i * 3 + 1] = o.tint[1]; t[i * 3 + 2] = o.tint[2]; }
    return true;
  }
  end(){
    for(const r of this.sp.values()){
      const s = r.s; if(!s) continue;
      for(const m of s.meshes){ m.count = s.n; m.instanceMatrix.needsUpdate = true; }
      s.aAnim.needsUpdate = s.aFx.needsUpdate = s.aTint.needsUpdate = true;
    }
    this.blobs.end();
  }
  frames(id){ const s = this.ready(id); return s ? s.data.N : 16; }
  dispose(){
    this.disposed = true;
    for(const r of this.sp.values()) if(r.s) r.s.dispose(this.scene);
    this.sp.clear(); this.queue.length = 0;
  }
}
