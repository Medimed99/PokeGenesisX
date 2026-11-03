/* ============================================================
   LE RÉCIT EN 3D — LA VERSION PC
   Chaque scène du récit (le metteur en scène du jeu mobile, 37f) se
   joue en volume. Le plateau (37d) reste seul maître du temps : il
   fait entrer, marcher, sauter, parler ; il bouge la caméra, change
   la lumière, ouvre les fenêtres du système, défragmente la mémoire.
   Ici, on lit son état à chaque image et on le montre :
     · le lieu (sets.js) : le laboratoire, le terminal, la Route 1,
       le ciel de Hoenn, la faille, la Couche Zéro, la Tour, le noyau,
       les sauvegardes, Hoenn, la côte de 1996, la page, le forage,
       les strates ;
     · les acteurs (actors.js) : Porygon-Z et les Pokémon en vrais
       modèles ; l'archiviste, MissingNo, le Professeur en voxels ;
     · la caméra : le cadre du plateau devient un plan (on recule, on
       zoome, on monte le long d'un mur, d'une tour) ;
     · la lumière : jour, crépuscule, nuit, faille, chaleur… ;
     · le souvenir : sépia, grain, des blocs qui manquent ;
     · ce qui reste à plat : la boîte de dialogue, les cartons, les
       bandes, les fenêtres du système (placées sur la 3D), la
       défragmentation, les signes au-dessus des têtes.
   Espace, Entrée ou un clic font avancer ; « Passer » reste là.
   ============================================================ */
import * as THREE from "three";
import { SETS3D } from "./sets.js";
import { Cast } from "./actors.js";
import { preloadMon } from "../mon/model3d.js";
import { heightAt, PATH_PTS } from "../world/layout.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const UP = new THREE.Vector3(0, 1, 0);
const T1 = new THREE.Vector3(), T2 = new THREE.Vector3(), T3 = new THREE.Vector3(), T4 = new THREE.Vector3();
const C1 = new THREE.Color(), C2 = new THREE.Color(), C3 = new THREE.Color();

/* les lumières du plateau, en volume : une teinte, une intensité, un brouillard */
const GRADE = {
  none: {m:1, tint:"#ffffff", k:0, fog:1},
  day:  {m:1.05, tint:"#fff6e8", k:0.1, fog:1},
  dusk: {m:0.8, tint:"#ff9a5a", k:0.45, fog:1.15},
  night:{m:0.45, tint:"#56609a", k:0.6, fog:1.35},
  dark: {m:0.28, tint:"#45405c", k:0.6, fog:1.6},
  cold: {m:0.65, tint:"#7f93b6", k:0.5, fog:1.2},
  dim:  {m:0.55, tint:"#8a8aa0", k:0.4, fog:1.3},
  warm: {m:1.0, tint:"#ffb070", k:0.35, fog:1},
  heat: {m:1.0, tint:"#ff6a2a", k:0.45, fog:1.1, flick:1},
  clean:{m:1.3, tint:"#ffffff", k:0.25, fog:0.8},
  rift: {m:0.72, tint:"#ff3d7f", k:0.42, fog:1.25, pulse:1}
};
/* une scène est « mise en scène » si elle pose un décor : c'est le plateau qui la joue */
const DIRECTED = new WeakMap();
function directed(sc){
  if(!sc) return false;
  if(DIRECTED.has(sc)) return DIRECTED.get(sc);
  /* le générique aussi : sur PC, il défile au-dessus du monde réparé */
  const scan = list => (list || []).some(b=>b && (b.t === "set" || b.t === "credits" || (b.beats && scan(b.beats)) || (b.branches && Object.values(b.branches).some(scan))));
  const v = (sc.shots || []).some(sh=>scan(sh.beats));
  DIRECTED.set(sc, v); return v;
}
function sceneMons(sc){
  const ids = new Set([474]);
  const scan = list => (list || []).forEach(b=>{ if(!b) return; if(b.t === "put" && b.mon) ids.add(b.mon); if(b.beats) scan(b.beats); if(b.branches) for(const k in b.branches) scan(b.branches[k]); });
  (sc.shots || []).forEach(sh=>scan(sh.beats));
  return [...ids];
}
const SKY_VS = `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `varying vec3 vD; uniform vec3 uTop, uBot; void main(){ float y = vD.y; gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.08, 0.55, y)), 1.0); }`;

export class Story3D {
  constructor(game){
    this.game = game; this.on = false; this.built = false;
    /* le plateau du jeu mobile ne dessine plus à plat sur PC : c'est nous */
    window.PCST3D = {on:true};
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.camSnap = true;
    this.fade = 0; this.lastSetObj = null;
  }
  build(){
    this.built = true;
    const s = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 900);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false, vertexShader:SKY_VS, fragmentShader:SKY_FS,
      uniforms:{uTop:{value:new THREE.Color("#000")}, uBot:{value:new THREE.Color("#000")}}}));
    this.sky.frustumCulled = false; this.sky.renderOrder = -10; s.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#ffffff", "#222222", 1); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 1.5); this.sun.castShadow = true;
    const q = this.game.engine.q, ms = q && q.shadow ? Math.min(2048, q.shadow) : 1024;
    this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 90;
    s.add(this.sun, this.sun.target);
    s.fog = new THREE.FogExp2("#000000", 0.02);
    this.cast = new Cast(s);
    this.sets = new Map(); this.cur = null; this.curKey = "";
    this.env = {tint:new THREE.Color(1, 1, 1), fog:new THREE.Color(), fogDensity:0};
  }
  wanted(){ const g = G(); const c = g && g.CINE; return !!(c && !c.dead && directed(c.scene)); }
  enter(){
    if(!this.built) this.build();
    const c = G().CINE;
    this.on = true; this.c = c; this.camSnap = true; this.fade = 1;
    document.body.classList.add("story3d");
    this.game.engine.useScene(this.scene, this.camera);
    this.camera.fov = 46; this.camera.updateProjectionMatrix();
    if(this.game.input.locked) this.game.input.unlock();
    try { for(const id of sceneMons(c.scene)) preloadMon(id, false); } catch(e){}
  }
  exit(){
    if(this.flying) this.stopFly();
    this.on = false; this.c = null;
    document.body.classList.remove("story3d", "st-mem");
    this.game.canvas.style.filter = "";
    this.cast.dispose();
    if(this.cur){ this.cur.g.visible = false; this.cur = null; this.curKey = ""; }
    /* on ne garde que les derniers lieux : la mémoire de la carte graphique n'est pas infinie */
    while(this.sets.size > 2){ const [k, s] = this.sets.entries().next().value; this.dropSet(k, s); }
    const B = this.game.breche3d;
    if(B && B.on) this.game.engine.useScene(B.scene, B.camera);
    else this.game.engine.useScene(null);
  }
  dropSet(k, s){
    this.scene.remove(s.g);
    s.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); const M = o.material; if(M) (Array.isArray(M) ? M : [M]).forEach(m=>{ for(const key of ["map", "emissiveMap"]) if(m[key]) m[key].dispose(); m.dispose(); }); });
    this.sets.delete(k);
  }
  /* ---------- les touches : avancer ---------- */
  key(e){
    if(!this.on) return false;
    /* on écrit (son nom, une réponse) : les touches vont au champ, pas à la scène */
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return true;
    /* une petite question de Porygon-Z : 1, 2, 3 répondent (les grandes décisions se tiennent à la souris) */
    const c = this.c, d = /^(Digit|Numpad)([1-4])$/.exec(e.code);
    if(d && c && c.choosing){ const o = document.querySelectorAll("#cine .cn-choice.quick .cch-o")[+d[2] - 1]; if(o){ e.preventDefault(); o.click(); } return true; }
    if(e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter" || e.code === "KeyE"){
      e.preventDefault();
      const t = ref("cineTap"); if(t) t();
      return true;
    }
    if(e.code === "Tab"){ e.preventDefault(); return true; }
    return e.code === "Escape";
  }
  /* ---------- à chaque image ---------- */
  update(dt, t){
    const want = this.wanted();
    if(want && !this.on) this.enter();
    else if(!want && this.on) this.exit();
    else if(want && G().CINE !== this.c){ this.exit(); this.enter(); }
    if(!this.on) return;
    const c = this.c, P = c.pl;
    /* le générique : le monde réparé, vu d'en haut, au petit matin */
    const host = document.getElementById("cine"), cred = !!(host && host.classList.contains("credits"));
    if(cred && !this.flying) this.startFly(t);
    else if(!cred && this.flying) this.stopFly();
    if(this.flying){ this.fly(dt, t); if(P && P.cvO){ const o = P.xO || P.cvO.getContext("2d"); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, P.cvO.width, P.cvO.height); } return; }
    if(!P || !P.set){
      /* pas encore de décor (le carton du titre), ou le décor éteint : le noir */
      if(this.cur){ this.cur.g.visible = false; this.cur = null; this.curKey = ""; }
      this.cast.dispose();
      this.sky.material.uniforms.uTop.value.set("#000"); this.sky.material.uniforms.uBot.value.set("#000");
      this.scene.fog.color.set("#000"); this.hemi.intensity = 0; this.sun.intensity = 0;
      this.camera.position.set(0, 2, 8); this.camera.lookAt(0, 1, 0);
      if(P) this.overlay(c, P, null, t, dt);
      return;
    }
    const S0 = P.set, st = S0.st || {};
    const s = this.useSet(S0);
    if(S0 !== this.lastSetObj){
      /* un décor change : coupe nette, ou un passage au noir très bref */
      if(this.lastSetObj && P.prev) this.fade = 1;
      this.lastSetObj = S0; this.camSnap = true;
    }
    this.fade = Math.max(0, this.fade - dt * 3.2);
    this.applyLight(s, P, t);
    try { if(s.upd) s.upd(t, dt, st, P, c); } catch(e){ if(!this.warnedSet){ this.warnedSet = true; console.warn(e); } }
    this.placeCamera(P, s, dt, t);
    this.cast.sync(P, {stage:s.map, sw:S0.sw, sh:S0.sh, t, dt, cam:this.camera, env:this.env, c});
    this.effects(c, P, s, t, dt);
    this.overlay(c, P, s, t, dt);
    this.labels(c, P, s);
  }
  /* ---------- le générique, au-dessus de la Route 1 ---------- */
  startFly(t){
    this.flying = true; this.flyT0 = t;
    const g = this.game;
    if(this.cur){ this.cur.g.visible = false; this.cur = null; this.curKey = ""; }
    this.cast.dispose();
    g.canvas.style.filter = ""; document.body.classList.remove("st-mem"); document.body.classList.add("st-fly");
    try { const C = g.world.corruption; if(C) C.setIntegrity(g.S ? g.S.integrity || 0 : 0); } catch(e){}
    try { if(g.companion) g.companion.hide(); } catch(e){}
    if(g.capture && g.capture.hand){ this.handWas = g.capture.hand.visible; g.capture.hand.visible = false; }
    g.engine.useScene(null);
    this.flyPos = null;
  }
  stopFly(){
    this.flying = false;
    const g = this.game; if(g.capture && g.capture.hand) g.capture.hand.visible = this.handWas !== false;
    document.body.classList.remove("st-fly");
    if(this.on) this.game.engine.useScene(this.scene, this.camera);
  }
  /* le long du chemin, du sud au nord : à dix mètres du sol, un peu de côté, le regard devant */
  flyAt(s, out, side){
    const N = PATH_PTS.length - 1, f = clamp(s, 0, 1) * (N - 3) + 1.5, i = Math.floor(f), k = f - i;
    const a = PATH_PTS[i], b = PATH_PTS[Math.min(N, i + 1)];
    const x = a[0] + (b[0] - a[0]) * ease(k), z = a[1] + (b[1] - a[1]) * k;
    return out.set(x + side, 0, z);
  }
  fly(dt, t){
    const g = this.game, cam = g.engine.camera, e = t - this.flyT0;
    const s = e / 80, side = -7 * Math.sin(e * 0.06) - 3;
    this.flyAt(s, T1, side);
    T1.y = heightAt(T1.x, T1.z) + 9 + Math.sin(e * 0.21) * 1.2;
    this.flyAt(s + 0.06, T2, side * 0.3);
    T2.y = heightAt(T2.x, T2.z) + 1.5;
    if(!this.flyPos){ this.flyPos = T1.clone(); this.flyLook = T2.clone(); }
    const k = 1 - Math.exp(-dt * 1.5);
    this.flyPos.lerp(T1, k); this.flyLook.lerp(T2, k);
    cam.position.copy(this.flyPos); cam.lookAt(this.flyLook);
    cam.clearViewOffset && cam.clearViewOffset();
    /* un beau matin, qui avance pendant le générique */
    this.flyHour = 9.4 + Math.min(1, e / 90) * 2.6;
    this.flyFocus = (this.flyFocus || new THREE.Vector3()).set(this.flyPos.x, heightAt(this.flyPos.x, this.flyPos.z), this.flyPos.z);
  }
  useSet(S0){
    const v = S0.v || "", k = (SETS3D[S0.k] ? S0.k : "terminal") + "|" + v;
    if(this.curKey === k && this.cur) return this.cur;
    if(this.cur) this.cur.g.visible = false;
    let s = this.sets.get(k);
    if(!s){
      const def = SETS3D[S0.k] || SETS3D.terminal, g = new THREE.Group();
      let upd = null; try { upd = def.build(g, v); } catch(e){ console.warn(e); }
      s = {def, g, upd, env:def.env(v), map:def.map, k:S0.k};
      this.sets.set(k, s); this.scene.add(g);
      for(const [k2, s2] of this.sets) if(this.sets.size > 4 && s2 !== s){ this.dropSet(k2, s2); break; }
    }
    s.g.visible = true; this.cur = s; this.curKey = k; this.camSnap = true;
    return s;
  }
  /* ---------- la lumière du lieu, teintée par celle du plateau ---------- */
  applyLight(s, P, t){
    const E = s.env, L = P.light || {k:"none", from:"none", t0:0, ms:1};
    const k = ease(clamp((P.t - L.t0) / (L.ms || 0.01), 0, 1));
    const A = GRADE[L.from] || GRADE.none, B = GRADE[L.k] || GRADE.none;
    let m = A.m + (B.m - A.m) * k, tk = A.k * (1 - k) + B.k * k, fogM = A.fog + (B.fog - A.fog) * k;
    C3.set(A.tint).lerp(C2.set(B.tint), k);
    if(B.pulse) m *= 0.85 + 0.15 * Math.sin(t * 2.2);
    if(B.flick) m *= 0.95 + 0.05 * Math.sin(t * 9);
    const H = this.hemi, Su = this.sun;
    H.color.set(E.hemi[0]).lerp(C3, tk); H.groundColor.set(E.hemi[1]); H.intensity = E.hemi[2] * m;
    Su.color.set(E.sun[0]).lerp(C3, tk * 0.8); Su.intensity = E.sun[1] * m;
    const focus = this.camLook;
    Su.position.set(focus.x + E.sun[2][0], E.sun[2][1], focus.z + E.sun[2][2]); Su.target.position.set(focus.x, 0, focus.z);
    const F = this.scene.fog; F.color.set(E.fog[0]).lerp(C1.copy(C3).multiplyScalar(0.35), tk * 0.6); F.density = E.fog[1] * fogM;
    const U = this.sky.material.uniforms;
    U.uTop.value.set(E.sky[0]).lerp(C1.copy(C3).multiplyScalar(0.5), tk * 0.5).multiplyScalar(0.4 + 0.6 * Math.min(1, m));
    U.uBot.value.set(E.sky[1]).lerp(C1.copy(C3).multiplyScalar(0.7), tk * 0.5).multiplyScalar(0.4 + 0.6 * Math.min(1, m));
    this.game.engine.setExposure(E.exp || 1);
    this.env.tint.set(1, 1, 1); this.env.fog.copy(F.color); this.env.fogDensity = F.density;
  }
  /* ---------- le cadre du plateau devient un plan ---------- */
  placeCamera(P, s, dt, t){
    const S0 = P.set, M = s.map, z = P.cam.z || 1;
    const fx = P.cam.x / S0.sw, fy = P.cam.y / S0.sh;
    /* au sol : on cadre les acteurs, d'un peu au-dessus ; plus haut (un moniteur, un cristal, le sommet d'une tour) : on le regarde en face */
    const camFl = M.camFl !== undefined ? M.camFl : -1;
    const wk = camFl < 0 ? 0 : clamp((camFl - fy) / 0.08, 0, 1);
    const band = M.band !== undefined ? M.band : 0.64;
    M.floorAt(fx, Math.max(fy, band), T1); T1.y += M.lookY !== undefined ? M.lookY : 1;
    const up = M.up !== undefined ? M.up : 0.3, dist = (M.dist || 8.6) / z;
    T2.set(0, up, 1).normalize().multiplyScalar(dist).add(T1);
    if(wk > 0){
      M.feet(fx, fy, T3);
      T4.set(T3.x, T3.y + 0.4, T3.z + dist * 0.92);
      T1.lerp(T3, wk); T2.lerp(T4, wk);
    }
    const k = this.camSnap ? 1 : 1 - Math.exp(-dt * 7);
    this.camLook.lerp(T1, k); this.camPos.lerp(T2, k);
    if(this.camSnap){ this.camLook.copy(T1); this.camPos.copy(T2); this.camSnap = false; }
    const cam = this.camera;
    cam.position.copy(this.camPos);
    /* une respiration de caméra, à peine */
    const calm = typeof window.calmFx === "function" && window.calmFx();
    if(!calm){ cam.position.x += Math.sin(t * 0.31) * 0.05; cam.position.y += Math.sin(t * 0.23) * 0.03; }
    cam.lookAt(this.camLook);
    /* le point regardé un peu au-dessus du milieu : la boîte de dialogue occupe le bas de l'image */
    const W = innerWidth, H = innerHeight; cam.setViewOffset(W, H, 0, Math.round(H * 0.1), W, H);
    /* la secousse */
    const stg = document.getElementById("cn-stage"), cl = stg ? stg.classList : null;
    let sh = (P.shake || 0) * 0.02;
    if(cl){ if(cl.contains("sh1")) sh = Math.max(sh, 0.05); if(cl.contains("sh2")) sh = Math.max(sh, 0.11); if(cl.contains("sh3")) sh = Math.max(sh, 0.2); }
    if(sh > 0 && !calm){ cam.position.x += (Math.random() - 0.5) * sh; cam.position.y += (Math.random() - 0.5) * sh; }
  }
  /* ---------- l'image abîmée, le souvenir, la faille ---------- */
  effects(c, P, s, t, dt){
    const E = this.game.engine, calm = typeof window.calmFx === "function" && window.calmFx();
    const stg = document.getElementById("cn-stage"), cl = stg ? stg.classList : null;
    let amount = 0.12, tear = 0;
    if(s.k === "faille" || s.k === "zero") amount = 0.4;
    if(P.light && P.light.k === "rift") amount = Math.max(amount, 0.45);
    if(cl){
      if(cl.contains("rgb1")) tear = Math.max(tear, 0.3); if(cl.contains("rgb2")) tear = Math.max(tear, 0.55);
      if(cl.contains("gl")) tear = Math.max(tear, cl.contains("gl2") ? 1.1 : 0.7);
    }
    for(const a of P.act.values()) if(a.kind === "mn" && a.alpha > 0.1) amount = Math.max(amount, 0.55);
    if(E.corrupt) E.corrupt.set(amount, tear, t, calm);
    /* le souvenir : sépia, comme sur le téléphone (la valeur vient de la scène) */
    const mem = !!P.mem;
    document.body.classList.toggle("st-mem", mem);
    let filter = "";
    if(mem){ const sep = stg ? parseFloat(getComputedStyle(stg).getPropertyValue("--plsep")) : 0.84; filter = `sepia(${isFinite(sep) ? sep : 0.84}) saturate(.74) contrast(.96) brightness(1.04)`; }
    if(this.game.canvas.style.filter !== filter) this.game.canvas.style.filter = filter;
  }
  /* ---------- la toile du dessus : signes, lettres, souvenir, effacement, défragmentation ---------- */
  project(v){ T4.copy(v).project(this.camera); return {x:(T4.x * 0.5 + 0.5), y:(-T4.y * 0.5 + 0.5), ok:T4.z < 1 && T4.z > -1}; }
  overlay(c, P, s, t, dt){
    const cv = P.cvO; if(!cv) return;
    const o = P.xO || cv.getContext("2d"), W = cv.width, H = cv.height;
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.globalAlpha = 1; o.imageSmoothingEnabled = false;
    const k = Math.max(3, Math.round(H / 240));
    if(s){
      const sw = P.set.sw, sh = P.set.sh;
      /* les signes au-dessus des têtes (« ! », « … », une note, une larme) */
      const emo = ref("plDrawEmote"), head = ref("plHead");
      if(emo && head) for(const a of P.act.values()){
        if(!a.emote) continue;
        const r = this.cast.get(a); if(!r || !r.head) continue;
        T1.copy(r.head); T1.y += 0.18;
        const p = this.project(T1); if(!p.ok) continue;
        o.setTransform(k, 0, 0, k, p.x * W - a.x * k, p.y * H - head(a) * k);
        try { emo(o, c, a); } catch(e){}
      }
      /* les lettres qui se mélangent */
      if(P.letters){ const L = P.letters, f = ref("plDrawLetters");
        s.map.floorAt(L.x / sw, 0.64, T1); const ms = 1.75 / 36; T1.y += Math.max(0.6, (0.64 * sh - L.y) * ms);
        const p = this.project(T1);
        if(f && p.ok){ o.setTransform(k, 0, 0, k, p.x * W - L.x * k, p.y * H - L.y * k); try { f(c, o); } catch(e){} } }
      /* les éclats : un acteur arraché part en tranches */
      if(P.parts.length){ const ms = 1.75 / 36;
        for(const p of P.parts){ s.map.floorAt(p.x / sw, 0.66, T1); T1.y += Math.max(0, (0.66 * sh - p.y) * ms); const q = this.project(T1); if(!q.ok) continue;
          o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = clamp(p.life / p.max, 0, 1) * (p.a || 1); o.fillStyle = p.c; o.fillRect(Math.round(q.x * W), Math.round(q.y * H), (p.s || 1) * k, (p.s || 1) * k); }
        o.globalAlpha = 1; }
    }
    o.setTransform(1, 0, 0, 1, 0, 0);
    if(P.mem) this.memFx(o, W, H, P, t);
    if(P.erase) this.erase(c, o, W, H, P);
    if(P.defrag){ const f = ref("plDrawDefrag"), s0 = P.s; P.s = Math.max(3, Math.round(W / 210)); try { if(f) f(c, o, W, H); } catch(e){} finally { P.s = s0; } }
    /* le passage d'un lieu à l'autre */
    if(this.fade > 0){ o.globalAlpha = Math.min(1, this.fade * 1.4); o.fillStyle = "#000"; o.fillRect(0, 0, W, H); o.globalAlpha = 1; }
  }
  /* le souvenir tient mal : le bord brunit, des blocs ne se chargent pas, une bande saute, du grain */
  memFx(o, W, H, P, t){
    const calm = typeof window.calmFx === "function" && window.calmFx();
    const v = o.createRadialGradient(W / 2, H * 0.44, Math.min(W, H) * 0.3, W / 2, H * 0.46, Math.max(W, H) * 0.72);
    v.addColorStop(0, "rgba(40,22,6,0)"); v.addColorStop(1, "rgba(40,22,6,.6)");
    o.fillStyle = v; o.fillRect(0, 0, W, H);
    const s = Math.max(4, Math.round(W / 200));
    if(P.memHoles){
      o.fillStyle = "#1a120a";
      const step = calm ? 0 : Math.floor(P.t * 2.5), gw = Math.floor(W / s), gh = Math.floor(H / s);
      for(let i = 0; i < P.memHoles; i++){
        if((i + step) % 3 === 0) continue;
        const bs = (4 + ((i * 7) % 5)) * s, X = ((i * 53 + step * 17 * (i % 2)) % gw) * s, Y = ((i * 97 + step * 29 * (i % 3 ? 0 : 1)) % gh) * s;
        o.fillRect(X - X % bs, Y - Y % bs, bs, bs);
      }
    }
    if(!this.grain){ this.grain = [0, 1, 2].map(()=>{ const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; const x = cv.getContext("2d"), img = x.createImageData(256, 256), d = img.data;
      for(let i = 0; i < d.length; i += 4){ const g = Math.random() * 255 | 0; d[i] = g; d[i + 1] = g * 0.9 | 0; d[i + 2] = g * 0.75 | 0; d[i + 3] = Math.random() < 0.5 ? 34 : 0; } x.putImageData(img, 0, 0); return cv; }); }
    const gi = calm ? 0 : Math.floor(t * 12) % 3;
    o.globalAlpha = 0.55; o.fillStyle = o.createPattern(this.grain[gi], "repeat"); o.fillRect(0, 0, W, H); o.globalAlpha = 1;
    if(!calm){ if(t > (this.tearT || 0)){ this.tearT = t + 2.2 + Math.random() * 3.5; this.tearY = Math.random() * H; this.tearUntil = t + 0.09; }
      if(this.tearUntil > t){ o.fillStyle = "rgba(255,236,200,.08)"; o.fillRect(0, this.tearY, W, (2 + Math.random() * 4) * s); } }
  }
  /* le monde s'en va, ligne après ligne, d'en bas */
  erase(c, o, W, H, P){
    const E = P.erase, k = clamp((P.t - E.t0) / E.ms, 0, 1), yCut = H - ease(k) * H;
    o.fillStyle = "#000"; o.fillRect(0, yCut, W, H - yCut);
    if(k < 1){ o.fillStyle = "rgba(255,246,220,.85)"; o.fillRect(0, yCut - 3, W, 3); o.fillStyle = "rgba(255,246,220,.2)"; o.fillRect(0, yCut - 14, W, 11); }
    const v = Math.round(E.from + (E.to - E.from) * ease(k)), label = v + " %";
    if(E.lbl){ const f = ref("plLblText"); if(f) f(c, E.lbl, label); }
    else { o.font = `${Math.round(H / 26)}px 'Press Start 2P', monospace`; o.textAlign = "center"; o.fillStyle = "rgba(0,0,0,.6)"; o.fillRect(W / 2 - H / 8, H * 0.06, H / 4, H / 16);
      o.fillStyle = v > 0 ? "#f2deb0" : "#ff3d7f"; o.fillText(label, W / 2, H * 0.06 + H / 22); }
  }
  /* ---------- les fenêtres du système, posées sur la 3D ---------- */
  labels(c, P, s){
    if(!P.lbl || !P.lbl.size) return;
    const box = document.getElementById("cine"), bars = !!(box && box.classList.contains("bars"));
    const W = innerWidth, H = innerHeight, sw = P.set.sw, sh = P.set.sh, at = ref("plAt");
    for(const [id, L] of P.lbl){
      let p3 = null;
      if(L.follow){ const a = P.act.get(L.follow), r = a && this.cast.get(a); if(!r || !r.head) continue; p3 = T1.copy(r.head); p3.y += 0.25 - (L.dy || 0) * 0.04; }
      else if(at){ const p = at(c, L.at); s.map.feet(p.x / sw, p.y / sh, T1); if(p.y / sh >= (s.map.camFl !== undefined && s.map.camFl >= 0 ? s.map.camFl + 0.06 : 0.5)) T1.y += 1.3; p3 = T1; }
      if(!p3) continue;
      const q = this.project(p3);
      let px = q.x * W, py = q.y * H;
      if(!L.w2 || L.wT2 !== L.el.className){ L.w2 = L.el.offsetWidth * 1.3 || 0; L.h2 = L.el.offsetHeight * 1.3 || 0; L.wT2 = L.el.className; }
      if(L.w2){ px = clamp(px, L.w2 / 2 + 14, W - L.w2 / 2 - 14); }
      if(L.h2){ const top = (bars ? H * 0.08 : 0) + 16, bot = H * 0.7; py = clamp(py, L.h2 / 2 + top, bot - L.h2 / 2); }
      const key = Math.round(px) + "," + Math.round(py);
      if(L.pos3 !== key){ L.pos3 = key; L.pos = key; L.el.style.left = (px / W * 100).toFixed(2) + "%"; L.el.style.top = (py / H * 100).toFixed(2) + "%"; }
    }
  }
}
