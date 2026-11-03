/* ============================================================
   LE RÉCIT EN 3D · LES ACTEURS
   Porygon-Z et les Pokémon sont de vrais modèles animés : ils marchent,
   se tournent, sautent, ont mal, tremblent, comme sur le plateau du
   jeu mobile. Dans le présent, Porygon-Z est un programme qu'on
   projette : un hologramme cyan, posé sur un disque de lumière.
   Ce qui, sur mobile, est dessiné pixel par pixel — l'archiviste fait
   des octets de ton nom, MissingNo, le Professeur Racine, l'œuf en fil
   de fer, la caisse de données, la fêlure — devient des voxels : le jeu
   mobile dessine l'acteur dans une petite toile à chaque image (ses
   états restent les siens : il se forme, se défait, se tasse en L), et
   chaque pixel allumé devient un cube.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { realHeight } from "../mon/sprites.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const TAU = Math.PI * 2;
/* les huit directions du plateau : bas (vers nous), bas-droite, droite… */
const DIRV = [[0, 1], [0.707, 0.707], [1, 0], [0.707, -0.707], [0, -1], [-0.707, -0.707], [-1, 0], [-0.707, 0.707]];
export const yawOf = d => { const v = DIRV[((d % 8) + 8) % 8]; return Math.atan2(v[0], v[1]); };
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const COLC = new Map();
function colOf(r, g, b){ const k = (r << 16) | (g << 8) | b; let c = COLC.get(k); if(!c){ c = new THREE.Color(`rgb(${r},${g},${b})`); COLC.set(k, c); if(COLC.size > 6000) COLC.clear(); } return c; }

/* la taille d'un acteur : Porygon-Z un peu plus grand que nature, les autres à leur taille, sans démesure */
function monHeight(a){ if(a.kind === "pz") return 1.22; return Math.max(0.55, Math.min(3.4, realHeight(a.mon) * (a.mon >= 144 && a.mon !== 147 && a.mon !== 148 ? 1.05 : 1))); }
const CLIP = {walk:"walk", idle:"idle", hop:"happy", rearup:"happy", wake:"happy", attack:"attack", shoot:"attack2", charge:"attack2", hurt:"hurt", rotate:"idle", laying:"idle", sleep:"idle"};

/* ============================================================
   UN POKÉMON (ou Porygon-Z)
   ============================================================ */
export class MonActor {
  constructor(scene, a){
    this.scene = scene; this.key = a.kind + "|" + a.mon + "|" + (a.variant || "n");
    this.h = monHeight(a);
    this.m = makeMon(a.mon, a.variant === "s", scene, {height:this.h, occ:false, corrupt:false});
    this.yaw = a.yaw !== undefined ? a.yaw : yawOf(a.dir); this.a0 = -1; this.lastAnim = ""; this.busy = 0; this.lie = 0;
    /* le disque de projection : Porygon-Z est un programme qu'on affiche */
    this.pad = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, opacity:0.18, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 1.6, 24, 1, true).translate(0, 0.8, 0), new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, opacity:0.07, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
    ring.position.y = disc.position.y = 0.02; this.pad.add(ring, disc, beam); this.pad.visible = false; scene.add(this.pad);
    this.padParts = {ring, disc, beam};
    /* une silhouette n'a que deux yeux */
    const eyeM = new THREE.MeshBasicMaterial({color:"#ffb070", toneMapped:false});
    this.eyes = new THREE.Group(); for(const dx of [-0.1, 0.1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), eyeM); e.position.x = dx; this.eyes.add(e); }
    this.eyes.visible = false; scene.add(this.eyes);
    /* Porygon-Z garde toujours un peu de lumière sur lui : c'est lui qu'on regarde */
    if(a.kind === "pz"){ this.keyL = new THREE.PointLight("#e8fbff", 3.2, 4.5, 1.6); scene.add(this.keyL); }
  }
  update(a, P, foot, m, t, dt, cam, env){
    const M = this.m, U = M.uniforms, calm = typeof window.calmFx === "function" && window.calmFx();
    const pz = a.kind === "pz", holo = !!a.holo;
    /* la pose */
    let anim = CLIP[a.anim] || "idle";
    if(a.a0 !== this.a0){
      this.a0 = a.a0;
      if(!a.loop && a.anim !== "walk" && M.playOnce && (M.hasClip ? M.hasClip(anim) : true) && anim !== "idle"){ const len = M.playOnce(anim, 1); this.busy = t + Math.min(2, len || 0.8); }
    }
    if(t >= this.busy) M.setAnim(a.anim === "walk" ? "walk" : (a.still ? "idle" : "idle"));
    M.frozen = !!a.still;
    /* se tourner, en douceur ; « rotate » : il tourne sur lui-même */
    let want = a.yaw !== undefined ? a.yaw : yawOf(a.dir);
    if(a.anim === "rotate" && !calm) want = this.yaw + dt * 9;
    let d = ((want - this.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
    this.yaw += a.anim === "rotate" ? d : d * Math.min(1, dt * 9);
    /* couché, il se redresse au réveil */
    this.lie += ((a.anim === "laying" || a.anim === "sleep" ? 1 : 0) - this.lie) * Math.min(1, dt * 3);
    /* hauteur : les sauts, l'abattement, la lévitation de Porygon-Z, le petit balancement de celui qui parle */
    let lift = (a.hop || 0) * m * 0.75 - (a.sink || 0) * m * 0.5;
    if(pz) lift += 0.28 + (calm ? 0 : Math.sin(t * 1.7 + (a.born || 0)) * 0.05) - this.lie * 0.22;
    if(a.talk && !calm) lift += Math.max(0, Math.sin(t * 14)) * 0.025;
    const jx = a.trem > 0 && !calm ? (Math.sin(t * 70) > 0 ? 1 : -1) * 0.03 : 0;
    M.lift = lift; M.groundY = 0;
    if(M.group) M.group.rotation.z = this.lie * 1.25;
    /* l'apparition : ses lignes arrivent une à une (le glitch du modèle) */
    let gl = 0;
    if(a.asm !== undefined){ gl = Math.max(0, 1 - (P.t - a.asm) / 1.1); }
    if(holo && !calm && Math.sin(t * 9 + (a.born || 0) * 3) > 0.985) gl = Math.max(gl, 0.3);
    /* l'hologramme devient un Pokémon (« Entrée 387 enregistrée ») : une ligne de lumière le parcourt
       des pieds à la tête, la teinte cyan s'en va derrière elle, le disque s'éteint */
    if(this.holoPrev && !holo) this.mat = t;
    this.holoPrev = holo;
    const mk = this.mat !== undefined ? (t - this.mat) / 1.8 : 2;
    let flash = 0;
    if(mk < 1){ flash = Math.max(0, 0.75 * (1 - mk * 1.3)); if(!calm) gl = Math.max(gl, (1 - mk) * (Math.sin(t * 38) > 0 ? 0.35 : 0.1)); }
    U.uGlitch.value = gl;
    U.uAlpha.value = Math.max(0, Math.min(1, a.alpha * (holo ? 0.96 : 1)));
    U.uFlash.value = flash;
    if(U.uTintC){
      if(a.sil){ const c = _c.set(a.sil); U.uTintC.value.set(c.r, c.g, c.b, 0.96); }
      else if(holo) U.uTintC.value.set(0.55, 1.0, 0.95, 0.12 + (calm ? 0 : Math.sin(t * 3 + (a.born || 0)) * 0.03));
      else if(mk < 1) U.uTintC.value.set(0.55, 1.0, 0.95, 0.14 * (1 - mk));
      else U.uTintC.value.set(0, 0, 0, 0);
    }
    V1.copy(foot); V1.x += jx;
    M.update(t, dt, V1, this.yaw, cam, env);
    /* le disque (il s'éteint quand Porygon-Z devient réel) */
    const padA = holo ? 1 : mk < 1 ? 1 - mk : 0;
    this.pad.visible = padA > 0.01 && a.alpha > 0.05;
    if(this.pad.visible){ this.pad.position.copy(foot); const pul = (calm ? 0.8 : 0.7 + 0.3 * Math.sin(t * 3 + (a.born || 0))) * padA;
      this.padParts.ring.material.opacity = 0.75 * pul * a.alpha; this.padParts.disc.material.opacity = 0.16 * pul * a.alpha; this.padParts.beam.material.opacity = 0.07 * pul * a.alpha;
      this.padParts.beam.scale.y = 0.9 + lift * 0.6; }
    if(mk < 1){
      if(!this.scan){ this.scan = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.62, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#e8fffb", transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false})); this.scene.add(this.scan); }
      this.scan.visible = true; this.scan.position.set(foot.x, foot.y + lift + mk * (this.h + 0.3) - 0.1, foot.z);
      this.scan.material.opacity = 0.9 * Math.sin(Math.PI * Math.min(1, mk * 1.1)); this.scan.scale.setScalar(1 + Math.sin(mk * Math.PI) * 0.25);
    } else if(this.scan) this.scan.visible = false;
    /* les yeux de la silhouette */
    this.eyes.visible = !!(a.sil && a.eyes) && a.alpha > 0.1;
    if(this.eyes.visible){ this.eyes.children.forEach(e=>e.material.color.set(a.eyes)); this.eyes.position.set(foot.x + Math.sin(this.yaw) * this.h * 0.25, foot.y + lift + this.h * 0.72, foot.z + Math.cos(this.yaw) * this.h * 0.25); this.eyes.rotation.y = this.yaw; }
    this.head = (this.head || new THREE.Vector3()).set(foot.x, foot.y + lift + this.h * (pz ? 1.0 : 1.02), foot.z);
    if(this.keyL){ V2.subVectors(cam.position, foot).setY(0).normalize(); this.keyL.position.set(foot.x + V2.x * 1.2, foot.y + lift + this.h * 0.9, foot.z + V2.z * 1.2); this.keyL.intensity = 3.2 * a.alpha; }
  }
  dispose(){ this.m.dispose(); this.scene.remove(this.pad, this.eyes); if(this.keyL) this.scene.remove(this.keyL); if(this.scan){ this.scene.remove(this.scan); this.scan.geometry.dispose(); this.scan.material.dispose(); } }
}

/* ============================================================
   DES PIXELS QUI DEVIENNENT DES CUBES
   Le jeu mobile dessine l'acteur dans une petite toile, à la place
   exacte où il le dessinerait sur le plateau ; chaque pixel allumé
   devient un cube, là où il est, de sa couleur.
   ============================================================ */
const VOX_CAP = 5200;
export class VoxActor {
  constructor(scene, a, o){
    this.scene = scene; this.key = a.kind + "|" + (a.prop || "");
    this.cw = o.w; this.ch = o.h; this.foot = o.foot; this.px = o.px; this.draw = o.draw; this.depth = o.depth || 1.25;
    this.cv = document.createElement("canvas"); this.cv.width = this.cw; this.cv.height = this.ch;
    this.x = this.cv.getContext("2d", {willReadFrequently:true}); this.x.imageSmoothingEnabled = false;
    const mat = new THREE.MeshStandardMaterial({roughness:0.6, metalness:0, flatShading:true, emissive:"#ffffff", emissiveIntensity:o.glow || 0.28});
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor;"); };
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, VOX_CAP);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color()); this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.light = o.light ? new THREE.PointLight(o.light, 0, 6, 1.5) : null; if(this.light) scene.add(this.light);
    this.headY = 0;
  }
  update(a, P, foot, m, t, dt, cam, env, c){
    const x = this.x, W = this.cw, H = this.ch;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    /* l'acteur, dessiné par le jeu mobile, à sa place sur la toile (ses pieds au point d'ancrage) */
    x.setTransform(1, 0, 0, 1, Math.round(W / 2 - a.x), Math.round(H - this.foot - a.y));
    try { this.draw(x, c, a); } catch(e){}
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    const d = x.getImageData(0, 0, W, H).data;
    /* face à la caméra, de profil à rien : un bas-relief de cubes */
    V1.subVectors(cam.position, foot); V1.y = 0; V1.normalize();
    const rx = V1.z, rz = -V1.x, s = this.px, dep = s * this.depth;
    _q.setFromAxisAngle(UP, Math.atan2(V1.x, V1.z));
    let n = 0, top = H;
    for(let j = 0; j < H; j++) for(let i = 0; i < W; i++){
      const k = (j * W + i) * 4, al = d[k + 3];
      if(al < 30 || n >= VOX_CAP) continue;
      const u = (i - W / 2) * s, v = (H - this.foot - j) * s;
      const zj = ((i * 7 + j * 13) % 5 - 2) * s * 0.18;
      const sc = s * (al > 200 ? 1 : 0.35 + al / 255 * 0.65);
      _m.compose(V2.set(foot.x + rx * u + V1.x * zj, foot.y + v, foot.z + rz * u + V1.z * zj), _q, _s.set(sc, sc, dep * (al > 200 ? 1 : 0.6)));
      this.mesh.setMatrixAt(n, _m); this.mesh.setColorAt(n, colOf(d[k], d[k + 1], d[k + 2])); n++;
      if(j < top) top = j;
    }
    this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true;
    this.headY = (H - this.foot - top) * s;
    this.head = (this.head || new THREE.Vector3()).set(foot.x, foot.y + this.headY, foot.z);
    if(this.light){ this.light.position.set(foot.x, foot.y + this.headY * 0.6, foot.z + 0.6); this.light.intensity = (a.alpha || 0) * (6 + Math.sin(t * 7) * 1.5); }
  }
  dispose(){ this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); if(this.light) this.scene.remove(this.light); }
}

/* ============================================================
   LA POKÉ BALL LANCÉE
   ============================================================ */
class BallActor {
  constructor(scene){
    this.scene = scene; this.key = "ball";
    const g = this.g = new THREE.Group(), s = 0.11;
    const top = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color:"#d8283a", roughness:0.35}));
    const bot = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({color:"#f2f0ea", roughness:0.35}));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.02, s * 1.02, s * 0.18, 16), new THREE.MeshStandardMaterial({color:"#141414"}));
    for(const p of [top, bot, band]){ p.castShadow = true; g.add(p); }
    scene.add(g);
  }
  update(a, P, foot, m, t){
    this.g.position.set(foot.x, foot.y + ((a.lift || 0) + 7) * m * 0.8, foot.z);
    this.g.rotation.x = (a.roll || 0) * 0.8; this.g.visible = a.alpha > 0.02;
    this.g.scale.setScalar(Math.max(0.01, a.alpha));
    this.head = this.g.position;
  }
  dispose(){ this.scene.remove(this.g); }
}

/* ============================================================
   LA TROUPE : un rendu par acteur du plateau
   ============================================================ */
export class Cast {
  constructor(scene){ this.scene = scene; this.recs = new Map(); this.seen = new Set(); }
  make(a){
    if(a.kind === "pz" || a.kind === "mon") return new MonActor(this.scene, a);
    if(a.kind === "prop" && a.prop === "ball") return new BallActor(this.scene);
    const D = (name) => ref(name);
    if(a.kind === "swarm") return new VoxActor(this.scene, a, {w:150, h:150, foot:30, px:0.049, glow:0.5, draw:(x, c, aa)=>{ const f = D("swarmDraw"); if(f) f(x, c, aa); }});
    /* le L de ton nom tient dans le cadre : moins haut que MissingNo, aussi large */
    if(a.kind === "mn" || a.kind === "mnname") return new VoxActor(this.scene, a, {w:96, h:96, foot:12, px:a.kind === "mnname" ? 0.034 : 0.05, depth:a.kind === "mnname" ? 1.6 : 1.25, glow:0.6, light:"#ff3d7f", draw:(x, c, aa)=>{ const f = D("plDrawMn"); if(f) f(x, c, aa); }});
    if(a.kind === "prop"){
      const PR = D("PL_PROPS") || {}, def = PR[a.prop];
      const big = a.prop === "smudge";
      const px = a.prop === "prof" ? 0.068 : a.prop === "crack" ? 0.06 : 0.055;
      return new VoxActor(this.scene, a, {w:big ? 200 : 72, h:big ? 220 : 72, foot:big ? 110 : 8, px, glow:a.prop === "crack" || a.prop === "egg" ? 0.9 : 0.25, light:a.prop === "crack" ? "#ff3d7f" : null,
        draw:(x, c, aa)=>{ if(def && def.draw) def.draw(x, aa, c); }});
    }
    return null;
  }
  key(a){ return a.kind === "prop" ? "prop|" + a.prop : a.kind === "pz" || a.kind === "mon" ? a.kind + "|" + a.mon + "|" + (a.variant || "n") : a.kind + "|"; }
  /* ctx : {stage (la correspondance du lieu), sw, sh, t, dt, cam, env, c} */
  sync(P, ctx){
    this.seen.clear();
    for(const a of P.act.values()){
      let r = this.recs.get(a);
      const k = this.key(a);
      if(r && r.key !== k && !(r instanceof VoxActor && r.key.startsWith(a.kind))){ r.dispose(); r = null; }
      if(!r){ r = this.make(a); if(!r) continue; r.key = k; this.recs.set(a, r); if(a.mon) preloadMon(a.mon, a.variant === "s"); }
      this.seen.add(a);
      const fx = a.x / ctx.sw, fy = a.y / ctx.sh;
      const foot = ctx.stage.feet(fx, fy, r._foot || (r._foot = new THREE.Vector3()));
      /* combien de mètres vaut un pixel du plateau, à cet endroit du lieu */
      const f2 = ctx.stage.feet(fx + 6 / ctx.sw, fy, V2), m = Math.max(0.01, f2.distanceTo(foot) / 6);
      r.m_ = m;
      try { r.update(a, P, foot, m, ctx.t, ctx.dt, ctx.cam, ctx.env, ctx.c); } catch(e){ if(!this.warned){ this.warned = true; console.warn(e); } }
    }
    for(const [a, r] of this.recs) if(!this.seen.has(a)){ r.dispose(); this.recs.delete(a); }
  }
  get(a){ return this.recs.get(a) || null; }
  dispose(){ for(const r of this.recs.values()) r.dispose(); this.recs.clear(); }
}
