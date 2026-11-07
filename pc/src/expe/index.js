/* ============================================================
   L'EXPÉDITION EN 3D — LA VERSION PC
   Le parcours reste celui du jeu mobile (les secteurs, le treillis,
   les nœuds, le combat, les récompenses, la sauvegarde) ; sur PC, on
   le marche :
     · le secteur est une vallée (sector.js) où chaque nœud de la carte
       est un endroit ; ceux qu'on peut atteindre s'allument, avec leur
       chemin ;
     · ZQSD / WASD déplacent l'équipe (le meneur devant, les autres à
       la file), la souris oriente la caméra, Maj fait courir ;
     · arrivé sur un nœud allumé, E y entre : la scène du jeu mobile
       s'ouvre (recrutement, coffre, repos…), ou le combat commence,
       là, au milieu du nœud (arena.js) — Maj (maintenu) l'accélère ;
     · Tab rend la souris (l'équipe, le sac, les soins restent à
       portée de clic), un clic dans la scène la reprend ; Échap,
       souris rendue, ressort du terminal (le parcours attend).
   ============================================================ */
import * as THREE from "three";
import { Sector, nodePos, START_Z } from "./sector.js";
import { XTeam } from "./team.js";
import { XArena } from "./arena.js";
import { XScenes } from "./scenes.js";
import { XStage } from "./stage.js";
import { XTrail, routeTo } from "./trail.js";
import { Settings } from "../settings.js";
import { OCC } from "../mon/occ.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const SKY_VS = `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `varying vec3 vD; uniform vec3 uTop, uBot; void main(){ float y = vD.y; gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.05, 0.5, y)), 1.0); }`;
const T1 = new THREE.Vector3(), T2 = new THREE.Vector3();
const NIGHT = [new THREE.Color("#0a0c1e"), new THREE.Color("#2a1a2e"), new THREE.Color("#141020")];
/* autour du noyau : le ciel de la faille */
const CORE = [new THREE.Color("#12041c"), new THREE.Color("#4a0c34"), new THREE.Color("#260a24"), new THREE.Color("#ff7ab0")];

export class Expe3D {
  constructor(game){
    this.game = game; this.on = false; this.built = false; this.mode = "walk";
    this.yaw = 0; this.pitch = 0.42; this.dist = 6.4; this.heading = Math.PI;
    this.pos = new THREE.Vector3(0, 0, START_Z); this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3();
    this.expBattle = null; this.near = null;
    window.PCXP3D = {on:false};
    /* un choix fait à la souris dans une scène : on reprend la marche */
    addEventListener("click", e=>{
      if(!this.on || this.mode !== "walk") return;
      const el = e.target.closest && e.target.closest("#xscene [data-act], #sheet-root [data-act]");
      if(el) setTimeout(()=>this.relock(), 60);
    }, true);
  }
  /* le parcours en cours ; à la fin (la scène de fin est ouverte), celui qui vient de s'achever */
  run(){
    const g = G(), r = g && g.S && g.S.expedition; if(r) return r;
    const E = ref("EXP_END"), xs = document.getElementById("xscene");
    return this.on && E && E.run && xs && xs.dataset && xs.dataset.kind === "end" ? E.run : null;
  }
  /* un parcours est-il ouvert dans le terminal (la carte, ou un de ses combats) ? */
  wanted(){
    const g = G(); if(!g || !this.game.terminal || !this.game.terminal.open) return false;
    const run = this.run(); if(!run || !run.map) return false;
    /* le parcours est fini : on reste le temps de la scène de fin (l'équipe, la couche réparée) */
    if(run.ended){ const xs = document.getElementById("xscene"); return !!(this.on && xs && xs.dataset && xs.dataset.kind === "end"); }
    const cs = ref("currentScreen");
    if(cs === "expedition") return true;
    if(cs === "battle"){
      const B = ref("BATTLE"); if(!B) return false;
      if(B === this.expBattle) return true;
      if(run.pend && run.pend.k === "enc"){ this.expBattle = B; return true; }
      /* le combat est fini, la récompense s'ouvre par-dessus (l'écran est encore celui du combat) */
      if(this.on && document.getElementById("xscene")) return true;
    }
    return false;
  }
  build(){
    this.built = true;
    const s = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 700);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false, vertexShader:SKY_VS, fragmentShader:SKY_FS,
      uniforms:{uTop:{value:new THREE.Color("#6fa8e8")}, uBot:{value:new THREE.Color("#d8ecf8")}}}));
    this.sky.frustumCulled = false; this.sky.renderOrder = -10; s.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#ffffff", "#444444", 1.2); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 2); this.sun.castShadow = true;
    const q = this.game.engine.q, ms = q && q.shadow ? Math.min(2048, q.shadow) : 1024;
    this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.04;
    const sc = this.sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120;
    s.add(this.sun, this.sun.target);
    s.fog = new THREE.FogExp2("#c8e0f0", 0.012);
    this.env = {tint:new THREE.Color(1, 1, 1), fog:new THREE.Color("#c8e0f0"), fogDensity:0.012};
    this.sector = new Sector(s);
    this.team = new XTeam(s);
    this.arena = new XArena(s, this.game);
    this.scenes = new XScenes(s, this.game);
    this.stage = new XStage();
    this.trail = new XTrail(s);
    /* la carte (M) : un clic sur un nœud trace la route (au lieu d'y aller tout de suite) */
    this.mapBar = document.createElement("div"); this.mapBar.id = "pc-xp-map";
    this.mapBar.innerHTML = `<b>LA CARTE DU SECTEUR</b><span>Clique un nœud : sa route se trace au sol · <kbd>M</kbd> ou <kbd>Échap</kbd> pour revenir</span><button data-x="1">Fermer</button>`;
    document.body.appendChild(this.mapBar);
    this.mapBar.querySelector("button").addEventListener("click", ()=>this.toggleMap(false));
    addEventListener("click", e=>{
      if(!this.on || !this.mapOpen) return;
      const n = e.target.closest && e.target.closest(".xmapwrap .pn[data-y]");
      if(!n) return;
      e.preventDefault(); e.stopPropagation();
      const A = G().ACTIONS; if(A && A.exppeek) A.exppeek({y:n.dataset.y, i:n.dataset.i});
    }, true);
    /* dans un choix, un clic sur un candidat (ou un objet) en 3D vaut un clic sur sa carte */
    addEventListener("pointermove", e=>{ if(this.on && this.mode === "scene") this.pick3 = this.slotUnder(e.clientX, e.clientY); }, true);
    addEventListener("click", e=>{
      if(!this.on || this.mode !== "scene" || (e.target.closest && e.target.closest("button, a, input, #pc-xs .pcx-card, #sheet-root"))) return;
      const i = this.slotUnder(e.clientX, e.clientY), c = i >= 0 && this.stage.anch[i];
      if(c && !c.disabled) c.click();
    }, true);
    this.team.sparks = this.game.capture && this.game.capture.sparks;
    /* par-dessus : les chiffres du combat, les noms des coups */
    this.fx = document.createElement("canvas"); this.fx.id = "pc-xp-fx"; document.body.appendChild(this.fx);
    /* la carte du nœud devant soi, et les touches */
    this.card = document.createElement("div"); this.card.id = "pc-xp-card"; document.body.appendChild(this.card);
    this.keys = document.createElement("div"); this.keys.id = "pc-xp-keys"; document.body.appendChild(this.keys);
  }
  enter(){
    if(!this.built) this.build();
    this.on = true; window.PCXP3D.on = true;
    document.body.classList.add("expe3d");
    this.game.engine.useScene(this.scene, this.camera);
    this.camera.fov = Settings.fov ? Math.min(75, Settings.fov) : 62; this.camera.updateProjectionMatrix();
    const sp = this.game.capture && this.game.capture.sparks; if(sp) this.scene.add(sp.points);
    this.mode = null; this.snap = true;
    this.fx.classList.add("on");
  }
  exit(){
    this.on = false; window.PCXP3D.on = false;
    document.body.classList.remove("expe3d", "xw", "xb", "xn", "xm"); this.mapOpen = false;
    if(this.trail) this.trail.clear();
    this.arena.end(); this.scenes.end(); if(this.stage) this.stage.hide();
    const sp = this.game.capture && this.game.capture.sparks; if(sp) this.game.engine.scene.add(sp.points);
    const g = this.game;
    if(!(g.story3d && g.story3d.on)){
      if(g.breche3d && g.breche3d.on) g.engine.useScene(g.breche3d.scene, g.breche3d.camera);
      else g.engine.useScene(null);
    }
    this.fx.classList.remove("on"); const x = this.fx.getContext("2d"); x.clearRect(0, 0, this.fx.width, this.fx.height);
    this.card.className = ""; this.keys.className = "";
    if(this.game.input.locked) this.game.input.unlock();
    /* le parcours est fini : on oublie le secteur */
    if(!this.run()){ this.sector.dispose(); this.team.dispose(); this.sector.key = ""; }
  }
  /* une fenêtre du jeu mobile est ouverte (une scène de nœud, une fiche) : la souris lui revient */
  overlayOpen(){
    const xs = document.getElementById("xscene"), sr = document.getElementById("sheet-root");
    return !!(this.mapOpen || (xs && xs.dataset && xs.dataset.kind !== undefined) || (sr && /\bon\b/.test(sr.className)) || ref("EXP_END"));
  }
  relock(){ if(this.on && this.mode === "walk" && !this.overlayOpen() && !this.game.input.locked && !this.game.intro.active) this.game.input.lock(); }
  /* ---------- les touches ---------- */
  key(e){
    if(!this.on) return false;
    const I = this.game.input;
    if(e.code === "Tab"){ e.preventDefault(); if(I.locked) I.unlock(); else this.relock(); return true; }
    if(e.code === "Escape"){ if(this.mapOpen){ this.toggleMap(false); return true; } if(!I.locked){ this.game.terminal.escape(); } return true; }
    /* M : la lettre imprimée (en AZERTY, la touche M n'a pas le code KeyM) */
    const typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || "");
    if(!typing && (e.code === "KeyM" || (e.key || "").toLowerCase() === "m") && this.mode === "walk"){ e.preventDefault(); this.toggleMap(); return true; }
    /* une scène : 1 à 6 choisissent (cartes, reliques, membres, articles, réponses), Entrée valide */
    if(this.mode === "scene"){
      const d = /^(Digit|Numpad)([1-6])$/.exec(e.code);
      if(d){
        const el = this.stage.choices()[+d[2] - 1]; if(el && !el.disabled){ e.preventDefault(); el.click(); }
        return true;
      }
      if(e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space" || e.code === "KeyE"){
        const el = this.stage.primary();
        if(el){ e.preventDefault(); el.click(); }
        return true;
      }
    }
    if(this.mode === "walk" && (e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && !this.overlayOpen()){
      e.preventDefault(); this.interact(); return true;
    }
    return false;
  }
  /* la carte complète du secteur, par-dessus la vallée */
  toggleMap(on){
    on = on === undefined ? !this.mapOpen : on;
    if(on === !!this.mapOpen) return;
    const sr = document.getElementById("sheet-root"), xs = document.getElementById("xscene");
    if(on && ((xs && xs.dataset && xs.dataset.kind !== undefined) || (sr && /\bon\b/.test(sr.className)))) return;
    this.mapOpen = on;
    document.body.classList.toggle("xm", on);
    const I = this.game.input;
    if(on){
      if(I.locked) I.unlock();
      /* le fond de la carte se peint à sa vraie taille, et on la fait défiler jusqu'à l'équipe */
      requestAnimationFrame(()=>{
        const run = this.run(); if(!run) return;
        try { ref("xmapPaint")(document.getElementById("xterr"), run); } catch(e){}
        const sc = document.getElementById("map-scroll"), geo = ref("xmapGeom");
        if(sc && geo){ const y = run.row < 0 ? 0 : geo(run).Y(run.row); sc.scrollTop = Math.max(0, y - sc.clientHeight * 0.3); }
        const pw = ref("pmdWake"); if(pw) pw();
      });
    } else this.relock();
  }
  interact(){
    const N = this.near, run = this.run(), A = G() && G().ACTIONS;
    if(!N || !run || N.state !== "avail" || !A || !A.expnode) return;
    this.game.input.unlock();
    A.expnode({y:String(N.y), i:String(N.i)});
  }
  /* ---------- l'ambiance du secteur ---------- */
  applyEnv(B){
    const U = this.sky.material.uniforms; U.uTop.value.set(B.sky[0]); U.uBot.value.set(B.sky[1]);
    this.scene.fog.color.set(B.fog[0]); this.scene.fog.density = B.fog[1];
    this.hemi.color.set(B.hemi[0]); this.hemi.groundColor.set(B.hemi[1]); this.hemi.intensity = B.hemi[2];
    this.sun.color.set(B.sun[0]); this.sun.intensity = B.sun[1];
    this.env.fog.copy(this.scene.fog.color); this.env.fogDensity = this.scene.fog.density;
    this.env.tint.set(1, 1, 1).lerp(new THREE.Color(B.hemi[0]), 0.25);
  }
  /* ---------- l'entrée : du Champion, au bout de la vallée, jusqu'à l'équipe à la porte ---------- */
  playIntro(run){
    const I = this.game.intro; if(!I) return;
    const last = run.map.length - 1, row = run.map[last] || [];
    const boss = nodePos(run, last, Math.floor(row.length / 2) || 0); boss.y = this.sector.heightAt(boss.x, boss.z);
    const P = this.pos.clone(), mid = (boss.z + P.z) / 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const names = {prairie:"Prairie", foret:"Forêt", grotte:"Grotte", plage:"Plage", neige:"Glacier", volcan:"Volcan", faille:"La Faille"};
    I.play({id:"expe", camera:this.camera, dur:5.6, color:"#ffc857", ver:1, blend:0.66, titleAt:0.6,
      kicker:`SECTEUR 1 / ${run.maps || 1} · ${(names[run.biome] || "").toUpperCase()}`, title:"Expédition",
      goal:`Va de nœud en nœud jusqu'au Champion du secteur. Au bout du dernier secteur, le noyau.`,
      shots:[{p:V(boss.x + 3.5, boss.y + 3.2, boss.z + 9), l:V(boss.x, boss.y + 2.2, boss.z)},
        {p:V(boss.x + 5, boss.y + 16, boss.z + 26), l:V(boss.x, boss.y, boss.z + 4)},
        {p:V(3, P.y + 22, mid + 18), l:V(0, P.y, mid - 6)},
        {p:V(P.x + 1.5, P.y + 8, P.z + 11), l:V(P.x, P.y + 1, P.z - 6)},
        {p:V(P.x + 0.6, P.y + 4.7, P.z + 5.8), l:V(P.x, P.y + 1.6, P.z - 4)}],
      controls:[
        {k:["Z", "Q", "S", "D"], t:"marcher", on:{keys:["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]}},
        {k:["souris"], t:"tourner la caméra", on:{move:true}},
        {k:["Maj"], t:"courir", on:{keys:["ShiftLeft", "ShiftRight"]}},
        {k:["E"], t:"entrer dans un nœud allumé", on:{chars:["e"]}},
        {k:["M"], t:"la carte : choisir sa route", on:{chars:["m"]}},
        {k:["Tab"], t:"la souris : équipe, sac, soins", on:{keys:["Tab"]}}],
      alive:()=>this.on && !!this.run() && this.run().seed === run.seed,
      visible:()=>this.on && this.mode === "walk" && !this.overlayOpen() && this.game.input.locked});
  }
  /* où se tient l'équipe : au nœud courant (un peu en retrait, pour ne pas y rentrer de nouveau), sinon à la porte */
  placeTeam(run){
    if(run.row >= 0){ nodePos(run, run.row, run.col, this.pos); this.pos.z += 3.2; }
    else this.pos.set(0, 0, START_Z);
    this.pos.y = this.sector.heightAt(this.pos.x, this.pos.z);
    this.yaw = 0; this.heading = Math.PI; this.snap = true;
    this.team.reset(this.pos);
  }
  /* ---------- à chaque image ---------- */
  update(dt, t){
    const want = this.wanted();
    if(want && !this.on) this.enter();
    else if(!want && this.on) this.exit();
    if(!this.on) return;
    /* (une scène du récit a pu prendre l'image entre-temps) */
    const A = this.game.engine.active; if(!A || A.scene !== this.scene) this.game.engine.useScene(this.scene, this.camera);
    const run = this.run(), I = this.game.input;
    /* un nouveau secteur (ou un nouveau parcours) : on le bâtit */
    const key = (run.seed || 0) + ":" + (run.mapIdx || 0) + ":" + run.biome;
    if(this.sector.key !== key){ this.sector.build(run); this.applyEnv(this.sector.B); this.placeTeam(run); }
    /* un parcours qui commence : la vallée se montre d'un bout à l'autre, puis la main revient à l'équipe */
    if(run.row < 0 && !(run.mapIdx || 0) && !run.ended && this.introSeed !== run.seed && !document.getElementById("xscene")){ this.introSeed = run.seed; this.playIntro(run); }
    /* trois façons d'être là : marcher, voir une scène de nœud (le jeu mobile l'a ouverte), combattre */
    const cs = ref("currentScreen"), xs = document.getElementById("xscene");
    const xk = xs && xs.dataset && xs.dataset.kind !== undefined ? xs.dataset.kind : null;
    const mode = xk !== null ? "scene" : cs === "battle" ? "battle" : "walk";
    /* d'où l'équipe arrive sur ce nœud (le sentier) : la scène et le combat se regardent depuis là */
    const nodeKey = run.mapIdx + ":" + run.row + ":" + run.col;
    if(nodeKey !== this.nodeKey){ this.nodeKey = nodeKey; const c = this.nodeC(run); this.nodeF = new THREE.Vector3(c.x - this.pos.x, 0, c.z - this.pos.z); if(this.nodeF.lengthSq() < 0.2) this.nodeF.set(0, 0, -1); }
    if(mode !== this.mode){
      const was = this.mode; this.mode = mode;
      document.body.classList.toggle("xw", mode === "walk"); document.body.classList.toggle("xb", mode === "battle"); document.body.classList.toggle("xn", mode === "scene");
      if(was === "battle") this.arena.end();
      if(mode !== "walk"){ this.trail.clear(); this.trailSig = ""; this.toggleMap(false); }
      if(mode === "walk") this.expBattle = null;
      if(was === "scene" && mode !== "scene"){ this.scenes.end(); this.stage.hide(); }
      if(mode === "battle"){
        const c = this.nodeC(run);
        const nd = run.row >= 0 && run.map[run.row] && run.map[run.row][run.col];
        this.arena.begin(c, (x, z)=>this.sector.heightAt(x, z), this.nodeF, !!(nd && nd.t === "boss"));
        this.team.show(false);
        if(I.locked) I.unlock();
        if(!was) this.snap = true;
      } else if(mode === "scene"){
        this.team.show(true);
        if(I.locked) I.unlock();
        if(!was) this.snap = true;
      } else {
        this.team.show(true);
        if(was === "battle" || was === "scene" || !was) this.placeTeam(run);
      }
    }
    if(mode === "scene"){
      /* une nouvelle scène (ou un nouveau moment de la même) : on pose ce qu'il faut */
      if(xk !== this.scenes.kind || run.pend !== this.scenes.p){
        const sector = xk === "sector";
        const c = sector ? new THREE.Vector3(0, 0, START_Z - 1) : this.nodeC(run);
        this.scenes.begin(xk, run, run.pend || {}, c, sector ? new THREE.Vector3(0, 0, -1) : this.nodeF, run.row >= 0 ? this.sector.nodeOf(run.row, run.col) : null, (x, z)=>this.sector.heightAt(x, z));
        if(sector) this.placeTeam(run);
      }
      this.scene3(run, dt, t);
    }
    else if(mode === "walk") this.walk(run, dt, t);
    else this.battle(run, dt, t);
    /* ce qui cache l'équipe (ou le combat) s'efface */
    OCC.uEye.value.copy(this.camera.position);
    if(mode !== "walk") OCC.uFocus.value.copy(mode === "battle" ? this.arena.C : this.scenes.C).add(T1.set(0, 1, 0)); else OCC.uFocus.value.set(this.pos.x, this.pos.y + 0.9, this.pos.z);
    this.sector.update(t, dt, run, this.camera, this.env, this.pos);
    /* le sanctuaire : le légendaire s'éveille (scène), ou il est entré dans l'arène (combat), ou dans l'équipe */
    const N = run.row >= 0 ? this.sector.nodeOf(run.row, run.col) : null;
    if(N && N.mon){
      if(mode === "battle" && N.t === "legend") N.joined = true;
      if(mode === "scene" && this.scenes.kind === "legend") this.scenes.legend(N, t);
      if(N.joined) N.mon.group.visible = false;
    }
    /* le feu de camp : la nuit tombe autour */
    const night = mode === "scene" ? (this.scenes.night || 0) : 0;
    this.nightK = (this.nightK || 0) + (night - (this.nightK || 0)) * Math.min(1, dt * 2);
    if(this.sector.B){ const B = this.sector.B, n = this.nightK, k = 1 - n * 0.62; this.hemi.intensity = B.hemi[2] * k; this.sun.intensity = B.sun[1] * (1 - n * 0.85);
      const U = this.sky.material.uniforms; U.uTop.value.set(B.sky[0]).lerp(NIGHT[0], n * 0.85); U.uBot.value.set(B.sky[1]).lerp(NIGHT[1], n * 0.8);
      this.scene.fog.color.set(B.fog[0]).lerp(NIGHT[2], n * 0.8); this.env.fog.copy(this.scene.fog.color); }
    /* le noyau : la couche s'assombrit autour de lui ; vaincu, elle se répare dans un éclat de lumière */
    const coreOn = (mode === "battle" && this.arena.core && !this.arena.coreWin) || (mode === "scene" && this.scenes.dark);
    if(mode === "battle" && this.arena.coreWin && !this.cleanT) this.cleanT = t;
    if(!(mode === "battle" && this.arena.core) && !(mode === "scene" && this.scenes.kind === "end")) this.cleanT = 0;
    this.darkK = (this.darkK || 0) + ((coreOn ? 1 : 0) - (this.darkK || 0)) * Math.min(1, dt * (coreOn ? 1.2 : 2.5));
    const clean = this.cleanT ? Math.max(0, 1 - (t - this.cleanT) / 2.2) : 0;
    if(this.sector.B && this.darkK > 0.001){
      const n = this.darkK, U = this.sky.material.uniforms;
      U.uTop.value.lerp(CORE[0], n * 0.85); U.uBot.value.lerp(CORE[1], n * 0.8);
      this.scene.fog.color.lerp(CORE[2], n * 0.8); this.env.fog.copy(this.scene.fog.color);
      this.hemi.color.set(this.sector.B.hemi[0]).lerp(CORE[3], n * 0.6); this.hemi.intensity *= 1 - n * 0.3; this.sun.intensity *= 1 - n * 0.55;
    } else if(this.sector.B) this.hemi.color.set(this.sector.B.hemi[0]);
    const sp = this.game.capture && this.game.capture.sparks; if(sp) sp.update(dt);
    /* l'image : propre en pleine nature, abîmée dans la faille, et autour du noyau */
    const E = this.game.engine, calm = typeof window.calmFx === "function" && window.calmFx();
    if(E.corrupt) E.corrupt.set((run.biome === "faille" ? 0.4 : 0.1) + this.darkK * 0.32, calm ? 0 : this.darkK * 0.08, t, calm);
    E.setExposure((this.sector.B ? this.sector.B.exp : 1) * (1 + (calm ? 0.25 : 0.7) * clean * clean));
    this.bagLayout();
    this.overlay(t);
  }
  /* le sac d'expédition, sur PC : l'équipe à gauche (qui tient quoi), le sac à droite, en tuiles */
  bagLayout(){
    const sh = document.querySelector("#sheet-root.on .sheet");
    if(!sh || sh.classList.contains("xbag")) return;
    const h = sh.querySelector(".sheet-h"); if(!h || !/Sac d'expédition/.test(h.textContent)) return;
    const hs = [...sh.querySelectorAll(":scope > .h.sm")]; if(hs.length < 2) return;
    sh.classList.add("xbag");
    const cols = document.createElement("div"); cols.className = "xbag-cols";
    hs.forEach((hh, k)=>{
      const col = document.createElement("div"); col.className = k ? "xbag-bag" : "xbag-team";
      const list = hh.nextElementSibling;
      col.appendChild(hh); if(list && !list.classList.contains("h")) col.appendChild(list);
      cols.appendChild(col);
    });
    const note = sh.querySelector(":scope > .tiny");
    if(note) note.after(cols); else h.after(cols);
  }
  nodeC(run){ const c = run.row >= 0 ? nodePos(run, run.row, run.col) : new THREE.Vector3(0, 0, START_Z - 6); c.y = this.sector.heightAt(c.x, c.z); return c; }
  /* ---------- une scène de nœud : l'équipe rassemblée, la caméra qui cadre ---------- */
  scene3(run, dt, t){
    const I = this.game.input, S0 = this.sector, sc = this.scenes;
    if(I.locked) I.unlock();
    I.consumeLook(); I.consumeWheel();
    const ground = (x, z)=>S0.heightAt(x, z);
    this.team.place(run, (k, n, out)=>sc.teamSpot(k, n, out), t, dt, this.camera, this.env, ground);
    sc.update(t, dt, this.camera, this.env, S0);
    if(this.snap){ this.camPos.copy(this.camera.position); this.camLook.copy(sc.C); this.snap = false; }
    sc.camera(this.camera, dt, this.camPos, this.camLook, ground);
    this.camera.updateMatrixWorld();
    this.stage.update(document.getElementById("xscene"), run, sc, this.camera);
    this.stage.el.classList.toggle("hold", (sc.holdUI || 0) > (this.game.t - sc.t0));
    if(this.pick3 !== undefined && this.stage.hover < 0 && this.pick3 >= 0) sc.hover = this.pick3;
    const C = sc.C; this.sun.position.set(C.x + 14, C.y + 30, C.z + 10); this.sun.target.position.copy(C);
    /* la marche reprendra d'ici */
    this.pos.copy(C).addScaledVector(sc.F, -2.6); this.pos.y = ground(this.pos.x, this.pos.z);
    this.card.className = "";
    const n = this.stage.choices().length, pri = this.stage.primary();
    const k = n ? `<b>Clic</b> ou <b>1</b>${n > 1 ? `…<b>${n}</b>` : ""} choisir${pri ? ` · <b>Entrée</b> ${esc(pri.textContent.trim().split(" ·")[0].toLowerCase())}` : ""}` : pri ? `<b>Entrée</b> ${esc(pri.textContent.trim().split(" ·")[0].toLowerCase())}` : "";
    if(this.keysHtml !== k){ this.keys.innerHTML = k; this.keysHtml = k; }
    this.keys.className = k ? "on" : "";
  }
  /* le socle (et ce qu'il porte) sous la souris, à l'écran */
  slotUnder(cx, cy){
    const sc = this.scenes; if(!sc || !sc.slots) return -1;
    let best = -1, bd = 95;
    sc.slots.forEach((ped, i)=>{
      const q = T1.copy(ped.position).add(T2.set(0, 1.25, 0)).project(this.camera); if(q.z > 1) return;
      const d = Math.hypot((q.x * 0.5 + 0.5) * innerWidth - cx, (-q.y * 0.5 + 0.5) * innerHeight - cy);
      if(d < bd){ bd = d; best = i; }
    });
    return best;
  }
  walk(run, dt, t){
    const I = this.game.input, S0 = this.sector;
    const open = this.overlayOpen();
    if(open && I.locked) I.unlock();
    const look = I.locked ? I.consumeLook() : (I.consumeLook(), {x:0, y:0});
    if(Settings.invertY) look.y = -look.y;
    const sens = 0.0021;
    this.yaw -= look.x * sens; this.pitch = Math.max(0.05, Math.min(1.1, this.pitch + look.y * sens));
    const wh = I.consumeWheel(); if(wh) this.dist = Math.max(3.8, Math.min(12, this.dist + wh * 0.6));
    let mx = 0, mz = 0;
    if(I.locked && !open && !this.game.intro.active){
      if(I.down("KeyW") || I.down("ArrowUp")) mz -= 1;
      if(I.down("KeyS") || I.down("ArrowDown")) mz += 1;
      if(I.down("KeyA") || I.down("ArrowLeft")) mx -= 1;
      if(I.down("KeyD") || I.down("ArrowRight")) mx += 1;
    }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let wx = -mz * fx + mx * rx, wz = -mz * fz + mx * rz; const L = Math.hypot(wx, wz);
    if(L > 1){ wx /= L; wz /= L; }
    const run2 = I.down("ShiftLeft") || I.down("ShiftRight");
    const sp = L > 0 ? (run2 ? 8.5 : 5.2) : 0;
    if(L > 0){
      const nx = this.pos.x + wx * sp * dt, nz = this.pos.z + wz * sp * dt, b = S0.bounds;
      const h0 = S0.heightAt(this.pos.x, this.pos.z), h1 = S0.heightAt(nx, nz);
      if(h1 - h0 < 0.6 * sp * dt + 0.02 || h1 < 1.2){ this.pos.x = Math.max(b.x0, Math.min(b.x1, nx)); this.pos.z = Math.min(b.z0, Math.max(b.z1, nz)); }
      const want = Math.atan2(wx, wz); let d = want - this.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); this.heading += d * Math.min(1, dt * 10);
    }
    this.pos.y = S0.heightAt(this.pos.x, this.pos.z);
    this.speed = sp;
    /* l'équipe */
    this.team.update(run, this.pos, this.heading, sp, t, dt, this.camera, this.env, (x, z)=>S0.heightAt(x, z));
    /* le nœud devant soi */
    let best = null, bd = 3.4;
    for(const N of S0.nodes){ const d = Math.hypot(N.pos.x - this.pos.x, N.pos.z - this.pos.z); if(d < bd){ bd = d; best = N; } }
    this.near = best;
    /* la caméra : derrière et au-dessus de l'épaule */
    const lead = this.team.leadRec(run), lh = lead ? lead.h : 1.2;
    const focus = T1.set(this.pos.x, this.pos.y + lh * 0.8 + 0.6, this.pos.z);
    const p = this.pitch, back = Math.cos(p) * this.dist, up = Math.sin(p) * this.dist + 0.3;
    const want = T2.set(focus.x - fx * back + rx * 0.6, focus.y + up, focus.z - fz * back + rz * 0.6);
    const gy = S0.heightAt(want.x, want.z) + 0.8; if(want.y < gy) want.y = gy;
    const k = this.snap ? 1 : Math.min(1, dt * 8);
    this.camPos.lerp(want, k); this.camLook.lerp(focus, k);
    if(this.snap){ this.camPos.copy(want); this.camLook.copy(focus); this.snap = false; }
    const cam = this.camera; cam.position.copy(this.camPos);
    cam.rotation.set(-p * 0.82 + 0.06, this.yaw, 0, "YXZ");
    /* le soleil suit l'équipe (ses ombres restent nettes) */
    this.sun.position.set(this.pos.x + 14, this.pos.y + 30, this.pos.z + 10); this.sun.target.position.copy(this.pos);
    this.updTrail(run, t, dt);
    this.walkHud(run, open);
  }
  /* le tracé : de l'équipe au nœud choisi sur la carte, par les nœuds du chemin */
  updTrail(run, t, dt){
    const pk = ref("EXP_PEEK"), calm = typeof window.calmFx === "function" && window.calmFx();
    const route = pk ? routeTo(run, pk) : null;
    if(!route){ if(this.trail.dots.length || this.trail.goal.visible) this.trail.clear(); this.trailSig = ""; return; }
    const sig = run.mapIdx + ":" + run.row + ":" + route.map(r=>r.y + "," + r.i).join(";");
    if(sig !== this.trailSig || this.pos.distanceTo(this.trailFrom || this.pos) > 0.6){
      this.trailSig = sig; this.trailFrom = this.pos.clone();
      const pts = [this.pos.clone()].concat(route.map(r=>nodePos(run, r.y, r.i)));
      this.trail.set(pts, (x, z)=>this.sector.heightAt(x, z));
    }
    this.trail.update(t, dt, calm);
  }
  battle(run, dt, t){
    const I = this.game.input, B = ref("BATTLE");
    /* chaque combat démarre à ×1 (Maj maintenu l'accélère, le temps qu'on le tient) */
    if(B && B !== this.spB){ this.spB = B; B.speed = 1; }
    if(B && B.ai) B.turbo = I.down("ShiftLeft") || I.down("ShiftRight");
    I.consumeLook(); I.consumeWheel();
    const ok = this.arena.update(t, dt, this.camera, this.env);
    if(ok){
      if(this.snap){ this.camPos.copy(this.camera.position); this.camLook.copy(this.arena.C); this.snap = false; }
      this.arena.camera(this.camera, dt, t, this.camPos, this.camLook);
    }
    const C = this.arena.C; this.sun.position.set(C.x + 14, C.y + 30, C.z + 10); this.sun.target.position.copy(C);
    this.card.className = "";
    this.keys.innerHTML = `<b>Maj</b> (maintenir) : accélérer le combat`; this.keys.className = "on";
  }
  /* ---------- la carte du nœud, les touches ---------- */
  walkHud(run, open){
    const N = this.near, I = this.game.input;
    if(N && !open && N.state !== "cur"){
      const info = (ref("expNodeInfo") || (()=>null))(N.n, run);
      const st = N.state;
      const foot = st === "avail" ? `<div class="xc-go"><kbd>E</kbd> y aller</div>` : st === "cur" ? `<div class="xc-s">Tu es ici</div>`
        : st === "done" ? `<div class="xc-s">Déjà visité</div>` : `<div class="xc-s bad">Hors de ta route : avance d'abord d'un palier</div>`;
      const html = info ? `<div class="xc-k" style="color:${esc(N.c)}">${info.k}</div><div class="xc-t">${info.t}</div><div class="xc-d">${info.d}</div>${foot}` : foot;
      if(this.cardHtml !== html){ this.card.innerHTML = html; this.cardHtml = html; }
      this.card.className = "on " + st;
      this.card.style.setProperty("--nc", N.c);
    } else this.card.className = "";
    const k = !I.locked ? (open ? "" : `<b>Clic</b> dans la scène pour marcher · <b>Échap</b> : quitter le terminal (le parcours attend)`)
      : `<b>ZQSD</b> marcher · <b>Maj</b> courir · <b>E</b> entrer · <b>M</b> la carte · <b>Tab</b> la souris (équipe, sac, soins)`;
    if(this.keysHtml !== k){ this.keys.innerHTML = k; this.keysHtml = k; }
    this.keys.className = k ? "on" : "";
  }
  overlay(t){
    const cv = this.fx, d = Math.min(2, devicePixelRatio || 1);
    if(cv.width !== Math.round(innerWidth * d) || cv.height !== Math.round(innerHeight * d)){ cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
    const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
    if(this.mode !== "battle" && this.mode !== "scene") return;
    const cam = this.camera;
    const project = v => { const p = v.clone().project(cam); if(p.z > 1) return null; return {x:(p.x * 0.5 + 0.5) * innerWidth, y:(-p.y * 0.5 + 0.5) * innerHeight}; };
    if(this.mode === "battle") this.arena.overlay(x, innerWidth, innerHeight, project);
    else this.scenes.overlay(x, project, t);
  }
}
