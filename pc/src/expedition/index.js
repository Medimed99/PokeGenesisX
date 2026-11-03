/* ============================================================
   L'EXPÉDITION EN 3D — TROIS FAÇONS DE PARCOURIR UN SECTEUR
   Trois maquettes à comparer (une première version de chacune), qu'on
   choisit pendant l'expédition (V, ou les trois boutons en haut) :
     · Maquette : le secteur en volume vu de haut ; on clique un lieu
       (ou 1 à 4), l'équipe y marche, la scène s'ouvre ;
     · Marche : on dirige l'équipe dans le secteur (ZQSD ou WASD, la
       souris tournée en maintenant le clic) ; près d'un lieu ouvert,
       E ou Entrée y entre ;
     · À plat : la carte du jeu mobile, comme avant.
   Dans les trois, les règles sont celles du jeu mobile : on lit
   S.expedition et on passe par ses actions (expnode).
   Les scènes (recrutement, coffre, feu de camp…) et les combats
   restent pour l'instant ceux du terminal.
   ============================================================ */
import * as THREE from "three";
import { Sector, Party, BIOME3D } from "./sector.js";
import { Settings, saveSettings } from "../settings.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const VIEWS = [["maquette", "Maquette"], ["marche", "Marche"], ["plat", "À plat"]];
const SKY_VS = `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `varying vec3 vD; uniform vec3 uTop, uBot; void main(){ float y = vD.y; gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.08, 0.55, y)), 1.0); }`;
const T1 = new THREE.Vector3(), T2 = new THREE.Vector3(), T3 = new THREE.Vector3();

export class Expe3D {
  constructor(game){
    this.game = game; this.on = false; this.built = false; this.sector = null;
    this.view = ["maquette", "marche", "plat"].includes(Settings.xview) ? Settings.xview : "maquette";
    this.focus = new THREE.Vector3(); this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.snap = true;
    this.camYaw = 0; this.zoom = 1; this.scrollZ = 0; this.walk = null; this.hover = null; this.mouse = {x:0, y:0, in:false};
    /* le sélecteur de vue (visible sur la carte d'expédition, dans les trois vues) */
    const sw = this.sw = document.createElement("div"); sw.id = "pc-xview";
    sw.innerHTML = `<span>Vue</span>${VIEWS.map(([k, n])=>`<button data-v="${k}">${n}</button>`).join("")}<i>V</i>`;
    sw.addEventListener("click", e=>{ const b = e.target.closest("button"); if(b) this.setView(b.dataset.v); });
    document.body.appendChild(sw);
    this.tip = document.createElement("div"); this.tip.id = "pc-xtip"; document.body.appendChild(this.tip);
    this.labels = document.createElement("div"); this.labels.id = "pc-xlabels"; document.body.appendChild(this.labels);
    this.hint = document.createElement("div"); this.hint.id = "pc-xhint"; document.body.appendChild(this.hint);
    /* la souris : survoler un lieu l'examine, un clic y va ; maintenir le clic tourne la vue (Marche) */
    const ui = e => e.target && e.target.closest && e.target.closest("button, a, input, #screen .xhead, #screen .team-strip, #screen .btn-grid, #screen .row, #pc-xview, .xsc, #sheet-root.on, #toasts, #pc-xtip");
    addEventListener("pointermove", e=>{ this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.in = this.on && !ui(e);
      if(this.on && this.drag){ const dx = e.clientX - this.drag.x; this.drag.x = e.clientX; if(this.view === "marche") this.camYaw -= dx * 0.006; else this.scrollZ += (e.clientY - this.drag.y) * 0.04, this.drag.y = e.clientY; } });
    addEventListener("pointerdown", e=>{
      if(!this.on || ui(e)) return;
      if(e.button === 0 && this.view === "maquette" && this.hover){ this.choose(this.hover); return; }
      this.drag = {x:e.clientX, y:e.clientY};
    }, true);
    addEventListener("pointerup", ()=>{ this.drag = null; });
    addEventListener("wheel", e=>{ if(!this.on || ui(e)) return; if(this.view === "maquette") this.scrollZ += Math.sign(e.deltaY) * 2.2; else this.zoom = clamp(this.zoom + Math.sign(e.deltaY) * 0.1, 0.6, 1.6); }, {passive:true});
  }
  run(){ const S = G() && G().S; const r = S && S.expedition; return r && r.map && !r.ended ? r : null; }
  screen(){ const g = G(); return g ? g.currentScreen : null; }
  onMap(){ return !!(this.game.terminal.open && this.screen() === "expedition" && this.run()); }
  wanted(){ return this.view !== "plat" && this.onMap() && !(this.game.story3d && this.game.story3d.on); }
  setView(v){
    if(!VIEWS.some(([k])=>k === v)) return;
    this.view = v; Settings.xview = v; saveSettings();
    this.snap = true; this.walk = null;
    if(this.on && v === "marche"){ const r = this.run(); if(r && this.sector) this.party.place(this.sector.at(r.row, r.col, T1), Math.PI); this.camYaw = 0; }
    try { window.refresh && window.refresh(); } catch(e){}
  }
  key(e){
    if(!this.onMap()) return false;
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return false;
    if(e.code === "KeyV"){ const i = VIEWS.findIndex(([k])=>k === this.view); this.setView(VIEWS[(i + 1) % VIEWS.length][0]); return true; }
    if(!this.on || this.busy()) return false;
    if(this.view === "maquette"){
      const d = /^(Digit|Numpad)([1-4])$/.exec(e.code);
      if(d){ const r = this.availList()[+d[2] - 1]; if(r){ this.choose(r); return true; } }
    }
    if(this.view === "marche" && (e.code === "KeyE" || e.code === "Enter" || e.code === "Space")){
      if(this.near && this.near.state === "avail"){ e.preventDefault(); this.enter(this.near); return true; }
    }
    return false;
  }
  busy(){ const r = this.run(); return !r || !!r.pend || !!this.walk || !!ref("EXP_TRAVEL") || (ref("xsOpenNow") || (()=>false))(); }
  /* ---------- la scène ---------- */
  build(){
    this.built = true;
    const s = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 600);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false, vertexShader:SKY_VS, fragmentShader:SKY_FS,
      uniforms:{uTop:{value:new THREE.Color()}, uBot:{value:new THREE.Color()}}}));
    this.sky.frustumCulled = false; this.sky.renderOrder = -10; s.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#ffffff", "#444444", 1); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 2); this.sun.castShadow = true;
    const q = this.game.engine.q, ms = q && q.shadow ? Math.min(2048, q.shadow) : 1024;
    this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 90;
    s.add(this.sun, this.sun.target);
    s.fog = new THREE.FogExp2("#ffffff", 0.01);
    this.party = new Party(s);
  }
  enter(){
    if(!this.built) this.build();
    this.on = true; this.snap = true; this.walk = null;
    document.body.classList.add("exp3d");
    this.game.engine.useScene(this.scene, this.camera);
    if(this.game.input.locked) this.game.input.unlock();
  }
  exit(){
    this.on = false; this.walk = null; this.hover = null;
    document.body.classList.remove("exp3d", "exp-marche", "exp-maquette");
    this.tip.className = ""; this.labels.innerHTML = ""; this.hint.className = "";
    const g = this.game;
    if(g.story3d && g.story3d.on) return;
    if(g.breche3d && g.breche3d.on) g.engine.useScene(g.breche3d.scene, g.breche3d.camera);
    else g.engine.useScene(null);
  }
  update(dt, t){
    /* le sélecteur de vue suit la carte d'expédition, quelle que soit la vue */
    const map = this.onMap();
    this.sw.className = map ? "on" : "";
    if(map) this.sw.querySelectorAll("button").forEach(b=>b.classList.toggle("sel", b.dataset.v === this.view));
    const want = this.wanted();
    if(want && !this.on) this.enter(); else if(!want && this.on) this.exit();
    if(!this.on) return;
    const run = this.run();
    document.body.classList.toggle("exp-marche", this.view === "marche"); document.body.classList.toggle("exp-maquette", this.view === "maquette");
    /* un nouveau secteur (ou une nouvelle expédition) : une nouvelle maquette */
    if(!this.sector || this.sector.key !== Sector.keyOf(run) || this.sector.run !== run){
      if(this.sector) this.sector.dispose();
      this.sector = new Sector(this.scene, run); this.applyEnv(this.sector.biome);
      this.party.sync(run); this.party.place(this.sector.at(run.row, run.col, T1), Math.PI);
      this.snap = true; this.scrollZ = 0;
    }
    this.party.sync(run);
    const S0 = this.sector;
    if(this.view === "marche") this.marche(dt, t, run); else this.maquette(dt, t, run);
    S0.sync(run, t, this.hover);
    this.party.update(t, dt, this.camera);
    this.sun.position.set(this.camLook.x + 9, 22, this.camLook.z + 12); this.sun.target.position.copy(this.camLook);
    this.camera.updateMatrixWorld();
    this.overlay(run);
  }
  applyEnv(B){
    const U = this.sky.material.uniforms; U.uTop.value.set(B.sky[0]); U.uBot.value.set(B.sky[1]);
    this.scene.fog.color.set(B.fog[0]); this.scene.fog.density = B.fog[1];
    this.hemi.color.set(B.hemi[0]); this.hemi.groundColor.set(B.hemi[1]); this.hemi.intensity = B.hemi[2];
    this.sun.color.set(B.sun[0]); this.sun.intensity = B.sun[1];
    this.game.engine.setExposure(B.exp || 1);
    this.expo = B.exp || 1;
  }
  availList(){ return this.sector ? this.sector.nodes.filter(r=>r.state === "avail").sort((a, b)=>a.g.position.x - b.g.position.x) : []; }
  /* ---------- la Maquette : vue de haut, on clique ---------- */
  maquette(dt, t, run){
    const S0 = this.sector;
    /* l'équipe marche jusqu'au lieu choisi, puis la scène s'ouvre */
    if(this.walk){
      const w = this.walk, k = Math.min(1, (t - w.t0) / w.dur);
      this.party.pos.lerpVectors(w.from, w.to, k); this.party.moving = k < 1;
      this.party.yaw = Math.atan2(w.to.x - w.from.x, w.to.z - w.from.z);
      if(k >= 1){ this.walk = null; this.party.moving = false; this.enter(w.rec); }
    } else if(!run.pend){
      const at = S0.at(run.row, run.col, T1);
      if(this.party.pos.distanceTo(at) > 0.05){ this.party.pos.lerp(at, Math.min(1, dt * 4)); }
      this.party.moving = false;
    }
    /* la caméra : au-dessus, un peu en arrière, vers les prochains lieux ; la molette fait défiler la carte */
    const base = run.row < 0 ? S0.door.z - 4 : S0.Z(run.row) - 5.5;
    this.scrollZ = clamp(this.scrollZ, -(base + S0.H3 + 2), -base + 4);
    this.focus.set(0, 0, base - this.scrollZ * -1);
    this.focus.z = clamp(base + this.scrollZ * -1, -S0.H3 + 2, S0.door.z);
    T1.copy(this.focus); T2.copy(this.focus).add(T3.set(0, 15.5, 12.5));
    this.cam(dt, T2, T1);
    /* le survol : le lieu sous la souris */
    this.hover = this.mouse.in && !this.busy() ? this.pick() : null;
  }
  pick(){
    const rc = this.rc || (this.rc = new THREE.Raycaster()), nd = new THREE.Vector2((this.mouse.x / innerWidth) * 2 - 1, -(this.mouse.y / innerHeight) * 2 + 1);
    rc.setFromCamera(nd, this.camera);
    const objs = this.sector.nodes.map(r=>r.g);
    const hit = rc.intersectObjects(objs, true)[0];
    if(!hit) return null;
    return this.sector.nodes.find(r=>{ let o = hit.object; while(o){ if(o === r.g) return true; o = o.parent; } return false; }) || null;
  }
  choose(rec){
    if(this.busy()) return;
    if(rec.state !== "avail"){ this.pinned = rec; return; }
    const S0 = this.sector, to = new THREE.Vector3(S0.X(rec.n.c), 0, S0.Z(rec.y) + 1.6);
    this.walk = {rec, from:this.party.pos.clone(), to, t0:this.game.t, dur:Math.max(0.6, this.party.pos.distanceTo(to) / 6.5)};
    try { const a = this.game.audio; if(a && a.click) a.click(); } catch(e){}
  }
  enter(rec){
    const A = G().ACTIONS; if(!A || !A.expnode) return;
    this.hover = null; this.pinned = null;
    A.expnode({y:rec.y, i:rec.i});
  }
  /* ---------- la Marche : on dirige l'équipe ---------- */
  marche(dt, t, run){
    const I = this.game.input, S0 = this.sector, P = this.party;
    let fx = 0, fz = 0;
    if(!this.busy()){
      if(I.down("KeyW") || I.down("ArrowUp")) fz -= 1;
      if(I.down("KeyS") || I.down("ArrowDown")) fz += 1;
      if(I.down("KeyA") || I.down("ArrowLeft")) fx -= 1;
      if(I.down("KeyD") || I.down("ArrowRight")) fx += 1;
    }
    const len = Math.hypot(fx, fz);
    P.moving = len > 0;
    if(len){
      fx /= len; fz /= len;
      const c = Math.cos(this.camYaw), s = Math.sin(this.camYaw);
      const dx = fx * c + fz * s, dz = -fx * s + fz * c, sp = 5.2;
      P.pos.x = clamp(P.pos.x + dx * sp * dt, -S0.W3 / 2 - 6, S0.W3 / 2 + 6);
      P.pos.z = clamp(P.pos.z + dz * sp * dt, -S0.H3 - 2, S0.door.z + 3);
      const want = Math.atan2(dx, dz); let d = ((want - P.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; P.yaw += d * Math.min(1, dt * 10);
    }
    /* le lieu le plus proche : entrer, ou savoir pourquoi on ne peut pas */
    let near = null, nd = 2.4;
    for(const r of S0.nodes){ const d = Math.hypot(r.g.position.x - P.pos.x, r.g.position.z - P.pos.z); if(d < nd){ nd = d; near = r; } }
    this.near = near; this.hover = near;
    /* la caméra suit, derrière l'équipe ; maintenir le clic la fait tourner */
    const z = this.zoom, c = Math.cos(this.camYaw), s = Math.sin(this.camYaw);
    T2.set(P.pos.x + s * 6.6 * z, 4.4 * z, P.pos.z + c * 6.6 * z);
    T1.set(P.pos.x - s * 2.2, 1.0, P.pos.z - c * 2.2);
    this.cam(dt, T2, T1);
  }
  cam(dt, pos, look){
    const k = this.snap ? 1 : 1 - Math.exp(-dt * 6);
    this.camPos.lerp(pos, k); this.camLook.lerp(look, k);
    if(this.snap){ this.camPos.copy(pos); this.camLook.copy(look); this.snap = false; }
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
  }
  /* ---------- par-dessus : les numéros des lieux ouverts, la fiche du lieu survolé ---------- */
  project(v){ T3.copy(v).project(this.camera); return {x:(T3.x * 0.5 + 0.5) * innerWidth, y:(-T3.y * 0.5 + 0.5) * innerHeight, ok:T3.z < 1}; }
  overlay(run){
    const info = ref("expNodeInfo"), busy = this.busy();
    /* les lieux ouverts : un numéro et leur nom, au-dessus d'eux */
    let html = "";
    if(!busy){
      const list = this.availList();
      list.forEach((r, k)=>{
        const p = this.project(T1.copy(r.g.position).setY(r.big ? 3.6 : 2.5)); if(!p.ok) return;
        const I = info ? info(r.n, run) : {k:r.n.t};
        html += `<div class="xl" style="left:${Math.round(p.x)}px;top:${Math.round(p.y)}px">${this.view === "maquette" ? `<b>${k + 1}</b>` : ""}${I.k}</div>`;
      });
    }
    if(this.labels.innerHTML !== html) this.labels.innerHTML = html;
    /* la fiche du lieu survolé (ou du lieu le plus proche, en marche) */
    const r = !busy ? (this.hover || this.pinned) : null;
    if(r && info){
      const I = info(r.n, run), steps = r.y - run.row;
      const st = r.state === "avail" ? (this.view === "marche" ? "E : entrer" : "Clic : y aller") : r.n.done ? "Déjà visité" : r.state === "reach" ? `À ${steps} pas · route possible` : r.state === "cur" ? "Vous êtes ici" : "Hors de votre route";
      const key = r.y + ":" + r.i + ":" + r.state + ":" + this.view;
      if(this.tipKey !== key){ this.tipKey = key; this.tip.innerHTML = `<small>${I.k}</small><b>${I.t}</b><span>${I.d}</span><em class="${r.state === "avail" ? "go" : r.state === "far" ? "bad" : ""}">${st}</em>`; }
      const p = this.project(T1.copy(r.g.position).setY(r.big ? 3.6 : 2.5));
      this.tip.className = "on"; this.tip.style.left = Math.round(clamp(p.x + 24, 12, innerWidth - 300)) + "px"; this.tip.style.top = Math.round(clamp(p.y - 30, 70, innerHeight - 220)) + "px";
    } else { this.tip.className = ""; this.tipKey = ""; }
    /* la ligne d'aide */
    const h = busy ? "" : this.view === "marche" ? "ZQSD ou WASD : marcher · maintenir le clic : tourner la vue · E : entrer dans un lieu ouvert · V : changer de vue"
      : "Clic sur un lieu ouvert, ou 1 à 4 · molette : faire défiler la carte · V : changer de vue";
    if(this.hint.textContent !== h) this.hint.textContent = h;
    this.hint.className = h ? "on" : "";
  }
}
