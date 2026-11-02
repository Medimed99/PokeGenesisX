/* ============================================================
   LES POKÉMON EN 3D ANIMÉE (essai : la Route 1, le lac, deux légendaires)
   Un modèle glTF par espèce (Pokémon X/Y, avec ses animations : attente,
   marche, course, attaque, joie, sommeil), chargé à la demande, à sa taille
   réelle, éclairé par la scène et portant son ombre.
   La classe parle la même langue que MonSprite (uniforms, setAnim, update,
   drawH, width, xray, group, mesh, dispose) : la capture, le combat, la
   pêche et la route n'ont pas à savoir lequel des deux ils manipulent.
   Si le fichier ne vient pas, on retombe sur le sprite.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { M3D } from "../data/models3d.js";
import { MonSprite, realHeight, preload as preloadSprite } from "./sprites.js";

export const has3D = (id, shiny) => !shiny && !!M3D[id];

let loader = null;
const cache = new Map();          /* id → promesse { scene, clips, h0, minY, w0 } */
function load(id){
  if(cache.has(id)) return cache.get(id);
  if(!loader){ loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); }
  const p = loader.loadAsync(M3D[id]).then(g=>{
    const scene = g.scene;
    scene.updateMatrixWorld(true);
    /* la taille de référence : la pose de repos (sans animation), en tenant compte du squelette */
    const box = new THREE.Box3();
    scene.traverse(o=>{ if(o.isMesh){ if(o.isSkinnedMesh) o.computeBoundingBox(); else if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const b = (o.isSkinnedMesh ? o.boundingBox : o.geometry.boundingBox).clone().applyMatrix4(o.matrixWorld); box.union(b); } });
    const size = box.getSize(new THREE.Vector3());
    return {scene, clips:g.animations, h0:Math.max(0.01, size.y), minY:box.min.y, w0:Math.max(size.x, size.z)};
  });
  cache.set(id, p);
  return p;
}
export function preload3D(id){ if(M3D[id]) load(id).catch(()=>{}); }

/* ce que le jeu demande, et ce que le modèle sait faire */
const CLIP = {idle:"idle", walk:"walk", run:"run", attack:"attack", happy:"happy", sleep:"sleep", hurt:null};

/* les effets du sprite, transposés : éclair blanc, rouge, fondu (en trame), désindexation (bandes) */
function patchMaterial(src, U){
  const m = src.clone();
  m.onBeforeCompile = sh => {
    sh.uniforms.uFlash = U.uFlash; sh.uniforms.uRed = U.uRed; sh.uniforms.uAlpha = U.uAlpha; sh.uniforms.uGlitch = U.uGlitch; sh.uniforms.uTime = U.uTime;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
uniform float uFlash, uRed, uAlpha, uGlitch, uTime;
float m3h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
  /* fondu en trame : pas de tri de transparence, et l'image reste nette */
  if(uAlpha < 0.999 && m3h(floor(gl_FragCoord.xy)) > uAlpha) discard;
  /* désindexé : des bandes horizontales qui manquent, de plus en plus */
  if(uGlitch > 0.001){
    float band = floor(gl_FragCoord.y / 5.0);
    if(m3h(vec2(band, floor(uTime * 20.0))) < uGlitch * 0.85) discard;
  }`)
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>
  if(uGlitch > 0.001){
    float side = step(0.5, m3h(vec2(floor(gl_FragCoord.y / 5.0), floor(uTime * 20.0) + 3.0)));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(vec3(0.21, 0.94, 0.84), vec3(1.0, 0.24, 0.5), side) * 1.4, uGlitch * 0.5);
  }
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.12, 0.2) * 1.6, uRed);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), uFlash);`);
  };
  m.customProgramCacheKey = () => "m3d|" + (src.customProgramCacheKey ? src.customProgramCacheKey() : "") + src.type;
  return m;
}

/* la silhouette à travers l'herbe : seulement là où quelque chose cache le Pokémon */
function xrayMaterial(U){
  const m = new THREE.MeshBasicMaterial({color:new THREE.Color(0.35, 1.0, 0.9), transparent:true, depthWrite:false, depthFunc:THREE.GreaterDepth});
  m.onBeforeCompile = sh => {
    sh.uniforms.uXray = U.uXray; sh.uniforms.uAlpha = U.uAlpha; sh.uniforms.uPull = U.uPull;
    /* chaque point est avancé vers l'œil (même place à l'écran, plus près) : une patte devant le
       ventre ne compte pas comme un obstacle, seule l'herbe (ou un arbre) plus en avant le cache */
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uPull;")
      .replace("#include <project_vertex>", `#include <project_vertex>
  vec4 mvPull = mvPosition; mvPull.xyz += normalize(-mvPosition.xyz) * uPull;
  gl_Position = projectionMatrix * mvPull;`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uXray, uAlpha;")
      .replace("#include <opaque_fragment>", `
  float sl = 0.55 + 0.45 * step(0.5, fract(gl_FragCoord.y * 0.25));
  gl_FragColor = vec4(diffuseColor.rgb * sl, 0.5 * uXray * uAlpha);`);
  };
  m.customProgramCacheKey = () => "m3d-xray";
  return m;
}

/* l'ombre au sol : une tache douce sous les pattes (l'ombre portée vient en plus) */
let BLOB = null;
function blobTex(){
  if(BLOB) return BLOB;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, "rgba(0,0,0,0.5)"); gr.addColorStop(0.6, "rgba(0,0,0,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  BLOB = new THREE.CanvasTexture(c);
  return BLOB;
}

export class MonModel {
  constructor(id, shiny, scene, opts = {}){
    this.id = id; this.shiny = !!shiny; this.scene = scene; this.opts = opts; this.is3D = true;
    this.H = opts.height || realHeight(id);
    this.uniforms = {uGlitch:{value:0}, uAlpha:{value:1}, uFlash:{value:0}, uRed:{value:0}, uTime:{value:0}, uXray:{value:0}, uPull:{value:0.3}};
    this.group = new THREE.Group();
    this.mesh = new THREE.Group(); this.mesh.visible = false;      /* le modèle lui-même (vide tant qu'il charge) */
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map:blobTex(), transparent:true, depthWrite:false}));
    this.shadow.renderOrder = 1;
    this.group.add(this.mesh, this.shadow);
    scene.add(this.group);
    this.anim = "idle"; this.scale = 1; this.lift = 0; this.frozen = false;
    this.drawH = this.H; this.width = Math.max(0.3, this.H * 0.8);
    this.xray = 0;
    this.ready = false; this.disposed = false;
    load(id).then(d=>this.build(d)).catch(err=>{ console.warn("modèle 3D indisponible, sprite à la place", id, err); this.fallback(); });
  }
  build(d){
    if(this.disposed) return;
    const root = cloneSkinned(d.scene);
    const k = this.H / d.h0;
    this.k = k;
    root.scale.setScalar(k);
    root.position.y = -d.minY * k;
    this.xrays = [];
    const xm = xrayMaterial(this.uniforms);
    const meshes = []; root.traverse(o=>{ if(o.isMesh) meshes.push(o); });
    meshes.forEach(o=>{
      o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
      o.material = Array.isArray(o.material) ? o.material.map(m=>patchMaterial(m, this.uniforms)) : patchMaterial(o.material, this.uniforms);
      /* le jumeau en silhouette : même géométrie, même squelette */
      const tw = o.clone(); tw.material = xm; tw.castShadow = false; tw.renderOrder = 6; tw.visible = false;
      if(o.isSkinnedMesh){ tw.bind(o.skeleton, o.bindMatrix); }
      o.parent.add(tw); this.xrays.push(tw);
    });
    this.mesh.add(root);
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.actions = {};
    for(const c of d.clips) this.actions[c.name] = this.mixer.clipAction(c);
    this.drawH = this.H;
    this.width = Math.max(0.3, d.w0 * k * 0.9);
    this.uniforms.uPull.value = Math.max(0.22, 0.55 * Math.max(this.H, this.width));
    this.ready = true;
    this.mesh.visible = true;
    this.play(this.anim, 0);
    /* une petite désynchronisation : deux Rattata ne respirent pas d'un même souffle */
    this.mixer.update(Math.random() * 2);
  }
  fallback(){
    if(this.disposed || this.fb) return;
    this.scene.remove(this.group);
    const fb = new MonSprite(this.id, this.shiny, this.scene, this.opts);
    fb.uniforms.uGlitch.value = this.uniforms.uGlitch.value;
    this.fb = fb; this.is3D = false;
    this.uniforms = fb.uniforms; this.group = fb.group; this.mesh = fb.mesh; this.shadow = fb.shadow;
    fb.setAnim(this.anim);
  }
  play(name, fade = 0.25){
    if(!this.ready) return;
    const want = CLIP[name] === undefined ? name : CLIP[name];
    if(want === null) return;                                  /* « touché » : l'éclair et la secousse suffisent */
    const a = this.actions[want] || this.actions.idle || Object.values(this.actions)[0];
    if(!a || a === this.cur) return;
    a.reset().setEffectiveWeight(1).play();
    if(want === "attack" || want === "happy"){ a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    if(this.cur && fade > 0) this.cur.crossFadeTo(a, fade, false);
    else if(this.cur) this.cur.stop();
    this.cur = a;
  }
  setAnim(a){
    if(this.fb){ this.fb.setAnim(a); return; }
    if(this.anim === a) return;
    this.anim = a;
    this.play(a);
  }
  update(t, dt, pos, heading, cam, env){
    if(this.fb){ this.fb.groundY = this.groundY; this.fb.scale = this.scale; this.fb.lift = this.lift; this.fb.frozen = this.frozen; this.fb.xray = this.xray;
      this.fb.update(t, dt, pos, heading, cam, env); this.drawH = this.fb.drawH; this.width = this.fb.width; return; }
    this.group.position.copy(pos);
    const U = this.uniforms;
    U.uTime.value = t;
    if(this.ready){
      if(!this.frozen) this.mixer.update(dt * (this.anim === "run" ? 1.25 : 1));
      if(heading !== undefined && heading !== null){
        /* il se tourne, sans à-coup */
        let dh = heading - this.mesh.rotation.y;
        dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        this.mesh.rotation.y += dh * Math.min(1, dt * 8);
      }
      this.mesh.scale.setScalar(Math.max(0.001, this.scale));
      this.mesh.position.y = this.lift;
      U.uXray.value += ((this.xray || 0) - U.uXray.value) * Math.min(1, dt * 6);
      const xv = U.uXray.value > 0.02;
      for(const x of this.xrays) x.visible = xv;
      this.drawH = this.H * this.scale;
    }
    const sw = this.width * 1.05 * Math.max(0.05, this.scale);
    this.shadow.scale.set(sw, 1, sw * 0.8);
    this.shadow.position.set(0, (this.groundY !== undefined ? this.groundY - pos.y : 0) + 0.03, 0);
    this.shadow.material.opacity = Math.max(0, 1 - this.lift / 3) * U.uAlpha.value * 0.8;
  }
  dispose(){
    this.disposed = true;
    if(this.fb){ this.fb.dispose(); return; }
    this.group.parent && this.group.parent.remove(this.group);
    if(this.mixer) this.mixer.stopAllAction();
    if(this.root) this.root.traverse(o=>{ if(o.isMesh){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m=>m.dispose()); } });
    this.shadow.geometry.dispose(); this.shadow.material.dispose();
  }
}

/* précharger : le modèle s'il existe, sinon les planches du sprite */
export function preloadMon(id, shiny){ if(has3D(id, shiny)) preload3D(id); else preloadSprite(id, shiny); }
/* l'un ou l'autre, selon ce qui existe pour cette espèce */
export function makeMon(id, shiny, scene, opts = {}){
  return has3D(id, shiny) ? new MonModel(id, shiny, scene, opts) : new MonSprite(id, shiny, scene, opts);
}
