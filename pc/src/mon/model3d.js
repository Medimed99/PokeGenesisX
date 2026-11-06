/* ============================================================
   LES POKÉMON EN 3D ANIMÉE (Kanto, Johto, Hoenn)
   Un modèle glTF par espèce — Kanto : Pokémon X/Y (attente, marche, course,
   attaque, joie, sommeil) ; Johto et Hoenn : Pokémon GO (attente, marche,
   course, attaques physique et spéciale, touché, K.O., joie) —, chargé à la demande, à sa taille
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
import { M3D, M3DS } from "../data/models3d.js";
import { CZ, LAMP_GLSL } from "../world/corruption.js";
import { OCC, OCC_GLSL } from "./occ.js";
import { MonSprite, realHeight, preload as preloadSprite } from "./sprites.js";

export const has3D = (id, shiny) => !!M3D[id];

/* ---------- les chromatiques ----------
   Les modèles de Pokémon GO (Johto, Hoenn) apportent leurs vraies textures chromatiques (M3DS : nom du
   matériau → image) ; pour les autres, on repeint. */
const GOSHINY = new Map();            /* id → promesse Map(nom du matériau → texture) */
function goShiny(id){
  if(GOSHINY.has(id)) return GOSHINY.get(id);
  const L = new THREE.TextureLoader(), out = new Map();
  const p = Promise.all(Object.entries(M3DS[id]).map(([name, url])=>L.loadAsync(url).then(t=>{
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; out.set(name, t);
  }))).then(()=>out);
  GOSHINY.set(id, p);
  return p;
}
/* ---------- les chromatiques repeints avec la palette chromatique ----------
   Le jeu mobile apprend, espèce par espèce, comment chaque couleur du sprite normal devient celle
   du sprite chromatique (brShinyMap), et sait repeindre n'importe quelle image avec (brShinyRecolor,
   en gardant les ombres). On l'applique aux textures du modèle 3D. */
const SHINY = new Map();              /* id → Map(uuid de la texture d'origine → texture chromatique) | false */
function shinyTextures(id, root){
  if(SHINY.has(id)) return SHINY.get(id);
  if(typeof window.brShinyMap !== "function" || typeof window.brShinyRecolor !== "function") { SHINY.set(id, false); return false; }
  const P = window.brShinyMap(id);
  if(P === null) return null;                       /* l'atlas n'est pas encore là : on réessaiera */
  if(!P){ SHINY.set(id, false); return false; }
  const out = new Map();
  root.traverse(o=>{
    if(!o.isMesh) return;
    for(const m of Array.isArray(o.material) ? o.material : [o.material]){
      const t = m && m.map; if(!t || out.has(t.uuid) || !t.image) continue;
      try {
        const img = t.image, c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const x = c.getContext("2d", {willReadFrequently:true}); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height);
        window.brShinyRecolor(d.data, id);
        x.putImageData(d, 0, 0);
        const nt = new THREE.Texture(); nt.copy(t); nt.source = new THREE.Source(c); nt.needsUpdate = true;
        out.set(t.uuid, nt);
      } catch(e){ /* texture illisible : elle garde ses couleurs */ }
    }
  });
  SHINY.set(id, out);
  return out;
}

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
/* le modèle tel qu'il est chargé (pour la horde de la Brèche, qui le précalcule) */
export function loadModelData(id){ return M3D[id] ? load(id) : Promise.reject(new Error("pas de modèle 3D")); }

/* ce que le jeu demande, et ce que le modèle sait faire */
const CLIP = {idle:"idle", walk:"walk", run:"run", attack:"attack", happy:"happy", sleep:"sleep", hurt:"hurt"};

/* la palette de la faille (celle des sprites corrompus du jeu mobile), en lumière linéaire */
export const CORRUPT_GLSL = `
vec3 corruptCol(vec3 c){
  float l = pow(clamp(dot(c, vec3(0.3, 0.59, 0.11)), 0.0, 1.0), 0.4545);
  vec3 p0 = vec3(0.0160, 0.0030, 0.0343), p1 = vec3(0.1559, 0.0160, 0.2232), p2 = vec3(1.0, 0.0467, 0.2122), p3 = vec3(1.0, 0.6724, 0.8308);
  vec3 p = l < 0.33 ? mix(p0, p1, l / 0.33) : l < 0.66 ? mix(p1, p2, (l - 0.33) / 0.33) : mix(p2, p3, (l - 0.66) / 0.34);
  return mix(c, p, 0.68);
}`;
/* les effets du sprite, transposés : éclair blanc, rouge, fondu (en trame), désindexation (bandes) */
function patchMaterial(src, U){
  const m = src.clone();
  /* une lueur de Pokémon GO (la queue de Muciole, le feu follet de Skelénox) : elle s'ajoute à la lumière */
  if(src.userData && src.userData.pcg === "add"){ m.blending = THREE.AdditiveBlending; m.transparent = true; m.depthWrite = false; }
  m.onBeforeCompile = sh => {
    sh.uniforms.uFlash = U.uFlash; sh.uniforms.uRed = U.uRed; sh.uniforms.uAlpha = U.uAlpha; sh.uniforms.uGlitch = U.uGlitch; sh.uniforms.uTime = U.uTime;
    sh.uniforms.uCorrupt = U.uCorrupt; sh.uniforms.uTintC = U.uTintC; sh.uniforms.uOcc = U.uOcc;
    sh.uniforms.uShine = U.uShine || {value:0}; sh.uniforms.uShineY = U.uShineY || {value:0}; sh.uniforms.uShineH = U.uShineH || {value:1};
    sh.uniforms.uEye = OCC.uEye; sh.uniforms.uFocus = OCC.uFocus;
    sh.uniforms.uLamp = CZ.uLamp;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vM3WP;")
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vM3WP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
uniform float uFlash, uRed, uAlpha, uGlitch, uTime, uCorrupt, uOcc, uShine, uShineY, uShineH;
${OCC_GLSL}
uniform vec4 uTintC;
varying vec3 vM3WP;
${LAMP_GLSL}
${CORRUPT_GLSL}
float m3h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
  occTest(vM3WP, uOcc);
  /* fondu en trame : pas de tri de transparence, et l'image reste nette */
  if(uAlpha < 0.999 && m3h(floor(gl_FragCoord.xy)) > uAlpha) discard;
  /* désindexé : des bandes horizontales qui manquent, de plus en plus */
  if(uGlitch > 0.001){
    float band = floor(gl_FragCoord.y / 5.0);
    if(m3h(vec2(band, floor(uTime * 20.0))) < uGlitch * 0.85) discard;
  }`)
      .replace("#include <map_fragment>", `#include <map_fragment>
  /* la horde corrompue de la Brèche : la palette de la faille, un liseré magenta */
  if(uCorrupt > 0.001) diffuseColor.rgb = mix(diffuseColor.rgb, corruptCol(diffuseColor.rgb), uCorrupt);
  diffuseColor.rgb = mix(diffuseColor.rgb, uTintC.rgb, uTintC.a);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  totalEmissiveRadiance += lampLight(vM3WP, diffuseColor.rgb);
  if(uCorrupt > 0.001){ float rimC = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.5); totalEmissiveRadiance += vec3(1.0, 0.16, 0.5) * rimC * 0.55 * uCorrupt; }
  if(uShine > 0.001){
    /* chromatique : un liseré d'or qui chatoie (irisé selon l'angle), et un éclat qui monte le long du corps */
    float fr = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);
    vec3 iri = 0.5 + 0.5 * cos(6.2831 * (fr * 0.9 + uTime * 0.12 + vec3(0.0, 0.33, 0.67)));
    vec3 rim = mix(vec3(1.0, 0.8, 0.38), iri, 0.35) * fr * (0.75 + 0.25 * sin(uTime * 2.6));
    float rel = (vM3WP.y - uShineY) / max(uShineH, 0.3);
    float cyc = mod(uTime, 3.4) / 1.25 - 0.25;
    float band = smoothstep(0.13, 0.0, abs(rel - cyc + (vM3WP.x + vM3WP.z) * 0.06)) * step(cyc, 1.25);
    totalEmissiveRadiance += uShine * (rim * 0.9 + vec3(1.0, 0.95, 0.8) * band * 0.85 + diffuseColor.rgb * 0.12);
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
    this.uniforms = {uGlitch:{value:0}, uAlpha:{value:1}, uFlash:{value:0}, uRed:{value:0}, uTime:{value:0}, uXray:{value:0}, uPull:{value:0.3},
      uCorrupt:{value:opts.corrupt ? 1 : 0}, uTintC:{value:new THREE.Vector4(0, 0, 0, 0)}, uOcc:{value:opts.occ ? 1 : 0},
      /* la splendeur d'un chromatique (shinyfx.js) : un liseré d'or irisé, un éclat qui le parcourt */
      uShine:{value:0}, uShineY:{value:0}, uShineH:{value:1}};
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
    if(this.shiny) this.applyShiny(root);
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
  applyShiny(root){
    if(M3DS[this.id]){
      goShiny(this.id).then(maps=>{
        if(this.disposed) return;
        root.traverse(o=>{ if(!o.isMesh) return; for(const m of Array.isArray(o.material) ? o.material : [o.material]){ const t = m && maps.get(m.name); if(t){ m.map = t; m.needsUpdate = true; } } });
      }).catch(()=>this.fallback());
      return;
    }
    const tryIt = () => {
      if(this.disposed) return;
      const maps = shinyTextures(this.id, root);
      if(maps === null){ setTimeout(tryIt, 700); return; }
      if(!maps){ this.fallback(); return; }          /* pas de palette chromatique connue : le sprite chromatique */
      root.traverse(o=>{ if(!o.isMesh) return; for(const m of Array.isArray(o.material) ? o.material : [o.material]){ if(m.map && maps.has(m.map.uuid)){ m.map = maps.get(m.map.uuid); m.needsUpdate = true; } } });
    };
    tryIt();
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
    if(want === "hurt" && !this.actions.hurt) return;           /* pas d'animation « touché » : l'éclair et la secousse suffisent */
    /* pas de sommeil (modèles de Pokémon GO) : l'attente, au ralenti */
    const slow = want === "sleep" && !this.actions.sleep;
    const a = this.actions[want] || this.actions.idle || Object.values(this.actions)[0];
    if(!a) return;
    if(a === this.cur){ a.timeScale = slow ? 0.35 : 1; return; }
    a.reset().setEffectiveWeight(1); a.timeScale = slow ? 0.35 : 1; a.play();
    if(want === "attack" || want === "happy" || want === "hurt"){ a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    else a.setLoop(THREE.LoopRepeat, Infinity);
    if(this.cur && fade > 0) this.cur.crossFadeTo(a, fade, false);
    else if(this.cur) this.cur.stop();
    this.cur = a;
  }
  hasClip(name){ return !!(this.ready && this.actions && this.actions[name]); }
  /* une animation jouée une fois en entier, éventuellement accélérée ; rend sa durée (secondes) */
  playOnce(name, timeScale = 1){
    if(this.fb){ this.fb.setAnim(name); return 0.5; }
    if(!this.ready) return 0.5;
    const a = this.actions[name]; if(!a) return 0.5;
    a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = timeScale; a.setEffectiveWeight(1); a.play();
    if(this.cur && this.cur !== a) this.cur.crossFadeTo(a, 0.1, false);
    this.cur = a; this.anim = name;
    return a.getClip().duration / timeScale;
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
