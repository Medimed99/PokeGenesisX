/* La partie PC : le moteur, le monde, le joueur, et le lien avec le jeu mobile. */
import * as THREE from "three";
import { Engine, QUALITY } from "./engine.js";
import { World } from "./world/world.js";
import { Player } from "./player.js";
import { Input } from "./input.js";
import { Settings, saveSettings, guessQuality } from "./settings.js";
import { heightAt, pathX, BOUNDS } from "./world/layout.js";
import { Hud } from "./hud.js";
import { Wild } from "./mon/wild.js";
import { Capture, BALL_ORDER } from "./capture.js";
import { Terminal } from "./ui/terminal.js";
import { Menus } from "./ui/menus.js";
import { Audio } from "./audio.js";
import { Fishing } from "./fishing.js";
import { Trainer } from "./trainer.js";
import { Sentinels } from "./sentinels.js";
import { RouteMap } from "./ui/map.js";
import { Tower3D } from "./tower3d.js";
import { Expe3D } from "./expe/index.js";
import { Breche3D } from "./breche/index.js";
import { Story3D } from "./story/index.js";
import { Companion } from "./story/companion.js";
import { CZ } from "./world/corruption.js";
import { Intro } from "./ui/intro.js";

const BERRY_KEYS = {Digit6:"framby", Digit7:"nanab", Digit8:"nigma", Digit9:"sitrus", Digit0:"micle"};
const POS_KEY = "pcg.pc.pos";

export class Game {
  constructor(canvas){
    this.canvas = canvas;
    this.engine = new Engine(canvas);
    this.input = new Input(canvas);
    this.t = 0; this.running = false; this.mode = "title"; this.started = false;
    this.hourOverride = null; this.env = {tint:new THREE.Color(1, 1, 1), fog:new THREE.Color(), fogDensity:0};
  }
  /* le jeu mobile a chargé la partie (même sauvegarde, même compte) */
  waitBoot(){
    return new Promise(res => {
      if(window.PCG_BOOT) return res(window.PCG_BOOT);
      addEventListener("pcg:booted", e => res(e.detail), {once:true});
      setTimeout(()=>res(window.PCG_BOOT || {fresh:true, standalone:true}), 8000);
    });
  }
  get G(){ return window.PCG || null; }
  get S(){ return this.G ? this.G.S : null; }
  progress(label, k){
    const el = document.getElementById("pc-load-step"), bar = document.getElementById("pc-load-bar");
    if(el) el.textContent = label;
    if(bar && k !== undefined) bar.style.width = Math.round(k * 100) + "%";
  }
  async start(){
    if(!Settings.qualityChosen){ Settings.quality = guessQuality(this.engine.renderer); Settings.qualityChosen = true; saveSettings(); }
    const q = this.engine.setQuality(Settings.quality);
    this.engine.camera.fov = Settings.fov;
    this.input.sens = Settings.sens;
    let n = 0; const steps = 9;
    this.world = new World(this.engine);
    await this.world.build(q, label => this.progress(label, ++n / steps));
    this.player = new Player(this.engine.camera, this.world.colliders);
    this.player.fov = Settings.fov;
    this.progress("La partie", 0.92);
    this.boot = await this.waitBoot();
    this.audio = new Audio(this); this.audio.vol = Settings.volume;
    this.hud = new Hud(this);
    this.wild = new Wild(this);
    this.capture = new Capture(this);
    this.fishing = new Fishing(this);
    this.trainer = new Trainer(this);
    this.sentinels = new Sentinels(this);
    this.map = new RouteMap(this);
    this.tower3d = new Tower3D(this);
    this.breche3d = new Breche3D(this);
    this.story3d = new Story3D(this);
    this.expe3d = new Expe3D(this);
    this.companion = new Companion(this);
    /* l'entrée dans chaque module : une cinématique, le but, le check des commandes */
    this.intro = new Intro(this);
    /* la nuit, une lueur froide autour de soi (la lampe du terminal) : on voit où l'on marche.
       Pas une lumière de plus dans toute la scène : le sol, l'herbe et les Pokémon 3D la calculent eux-mêmes. */
    this.lamp = CZ.uLamp.value;
    this.terminal = new Terminal(this);
    this.menus = new Menus(this);
    this.player.onStep = (surf, run) => this.audio.step(surf, run);
    this.player.onLand = v => this.audio.land(v);
    this.input.onLockChange = locked => this.onLock(locked);
    this.canvas.addEventListener("click", ()=>{
      if(this.intro.active){ this.intro.skip(); return; }
      if(this.story3d && this.story3d.on) return;
      if(this.breche3d.on){ this.breche3d.relock(); return; }
      if(this.expe3d && this.expe3d.on){ this.expe3d.relock(); return; }
      if(this.mode === "play" && !this.input.locked) this.input.lock();
    });
    this.restorePos();
    this.world.grass.prime(this.player.pos);
    this.progress("Prêt", 1);
    this.running = true;
    this.engine.clock.start();
    addEventListener("resize", ()=>this.engine.resize());
    addEventListener("keydown", e=>this.onKey(e));
    addEventListener("beforeunload", ()=>this.savePos());
    this.loop();
    document.body.classList.add("pc-ready");
    this.setMode("title");
    this.menus.showTitle();
    if(this.onReady) this.onReady();
  }
  /* ---------- les modes : titre, promenade, pause, terminal ---------- */
  setMode(m){
    const was = this.mode;
    this.mode = m;
    /* de retour sur la route : une scène restée en attente s'ouvre maintenant */
    if(m === "play" && (was === "dialog" || was === "battle") && this.terminal) setTimeout(()=>this.terminal.check(), 400);
    document.body.dataset.mode = m;
    this.hud && this.hud.show(m === "play");
    if(m === "battle" || m === "dialog") return;     /* la musique du combat reste celle du combat */
    const M = this.G && this.G.ref("Music");
    try { if(M){ M.ctxOverride = m === "terminal" ? null : (this.fishing && this.fishing.active ? "peche" : "capture_kanto"); M.sync(); } } catch(e){}
  }
  enter(){
    const begin = () => {
      this.started = true;
      this.setMode("play");
      this.input.lock();
      this.routeIntro();
      if(!this.intro.checking("route")) this.hud.hint(`<b>Tab</b> : le terminal et les nouvelles · <b>Échap</b> : la pause`, 6);
    };
    if(this.boot && this.boot.fresh && this.S && !this.S.story.includes("intro")){
      /* une partie neuve : l'ouverture, dans le terminal, puis la route */
      this.setMode("play");
      window.pcIntro(()=>{ begin(); this.terminal.close(); });
      return;
    }
    begin();
    /* rien ne s'ouvre à l'arrivée : les nouvelles attendent la première ouverture du terminal */
    try { window.pcWelcomeBack("quiet"); } catch(e){ console.warn(e); }
    this.pendingNews = true;
  }
  /* l'arrivée sur la route : la caméra descend du ciel jusqu'aux yeux du joueur */
  routeIntro(){
    const P = this.player.pos, yaw = this.player.yaw;
    const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const at = (back, up, side) => P.clone().addScaledVector(f, -back).addScaledVector(r, side).add(new THREE.Vector3(0, up, 0));
    const S = this.S, integ = S ? Math.floor(S.integrity || 0) : 0;
    this.intro.play({id:"route", camera:this.engine.camera, dur:4.6, color:"#5ce07a",
      kicker:`KANTO · INTÉGRITÉ ${integ} %`, title:"Route 1",
      goal:"Capture les Pokémon sauvages : chaque nouvelle entrée au Pokédex répare un peu le monde.",
      shots:[{p:at(34, 26, 14), l:at(-18, 0, -2)}, {p:at(17, 11, 6), l:at(-12, 0.6, 0)}, {p:at(5, 3.2, 1.2), l:at(-9, 1.3, 0)}],
      controls:[
        {k:["Z", "Q", "S", "D"], t:"marcher", on:{keys:["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]}},
        {k:["souris"], t:"regarder", on:{move:true}},
        {k:["clic droit"], t:"viser un Pokémon", on:{btn:2}},
        {k:["clic"], t:"lancer la Ball", on:{btn:0}},
        {k:["M"], t:"la carte", on:{chars:["m"]}},
        {k:["Tab"], t:"le terminal", on:{keys:["Tab"]}}],
      alive:()=>this.started && !this.story3d.on && !this.tower3d.on && !this.breche3d.on && !this.expe3d.on,
      visible:()=>this.mode === "play" && this.input.locked && !this.hud.newOpen});
  }
  restore(){
    this.started = true;
    this.pendingIntro = true;              /* refermé sans se connecter : l'ouverture d'une partie neuve */
    this.setMode("play");
    /* « J'ai déjà une partie » : la connexion au compte, dans le terminal (comme sur mobile) */
    try { this.G.ref('NET_AUTH_MODE = "signin"'); this.G.ref('NET_TAB = "compte"'); } catch(e){}
    this.terminal.show("online", false);
  }
  resume(){
    if(this.mode !== "play") return;
    this.input.lock();
    setTimeout(()=>{ if(this.mode === "play" && !this.input.locked) this.hud.prompt(`<b>Clic</b> pour reprendre`); }, 300);
  }
  onLock(locked){
    /* Échap pendant une cinématique d'entrée : on la passe */
    if(!locked && this.intro.active) this.intro.skip();
    /* une scène du récit rend la souris : ce n'est pas une pause */
    if(this.story3d && this.story3d.on) return;
    /* l'Expédition : rendre la souris, c'est seulement reprendre la main sur ses boutons */
    if(this.expe3d && this.expe3d.on) return;
    /* la Brèche : rendre la souris, c'est mettre en pause (sauf si une fenêtre l'a demandé) */
    if(this.breche3d && this.breche3d.on){
      const R = this.G && this.G.ref("BR");
      if(locked){ this.breche3d.hadLock = true; return; }
      /* (seulement une souris que la Brèche avait prise : pas l'écho de l'ouverture du terminal) */
      if(this.breche3d.hadLock && R && !R.paused && !R.modal && !R.over) this.G.ref("brPause")(true);
      return;
    }
    if(locked){ this.hud.prompt(""); return; }
    /* Échap pendant la promenade : la pause */
    if(this.mode === "play" && !this.terminal.open && !this.hud.newOpen) this.menus.openPause("main");
  }
  onKey(e){
    if(this.mode === "title"){
      /* Échap referme les réglages ouverts depuis l'écran titre */
      if(e.code === "Escape" && this.menus.pauseOpen) this.menus.closeFromTitle();
      return;
    }
    if(this.intro.active && this.intro.key(e)) return;
    if(e.code === "Tab" && (this.mode === "dialog" || this.mode === "battle")){ e.preventDefault(); return; }
    if(this.story3d && this.story3d.on){ this.story3d.key(e); return; }
    if(this.breche3d && this.breche3d.on){ this.breche3d.key(e); return; }
    if(this.expe3d && this.expe3d.on){ this.expe3d.key(e); return; }
    if(this.tower3d && this.tower3d.on && this.tower3d.key(e)) return;
    /* pendant un combat de la Tour : Tab ou Échap ouvrent sa pause (ou referment la fiche ouverte) */
    if(this.tower3d && this.tower3d.on && (e.code === "Tab" || e.code === "Escape")){
      e.preventDefault();
      const sr = document.getElementById("sheet-root");
      if(sr && /\bon\b/.test(sr.className) && window.closeSheet) window.closeSheet();
      else { const A = this.G && this.G.ACTIONS; if(A && A.sqquit) A.sqquit(); }
      return;
    }
    if(e.code === "Tab"){
      e.preventDefault();
      if(this.mode === "pause") this.menus.closePause();
      this.terminal.toggle();
      return;
    }
    if(e.code === "Escape" && this.mode === "terminal"){ this.terminal.escape(); return; }
    if(this.mode !== "play") return;
    if(this.hud.newOpen && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE")){ this.hud.closeNew(); e.preventDefault(); return; }
  }
  /* ---------- la boucle ---------- */
  hour(){
    if(this.hourOverride !== null) return this.hourOverride;
    if(Settings.time === "jour") return 14.5;
    if(Settings.time === "nuit") return 23.2;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }
  setQuality(key){
    Settings.quality = key; saveSettings();
    const q = this.engine.setQuality(key);
    this.world.setQuality(q);
    this.world.grass.prime(this.player.pos);
  }
  loop(){
    if(!this.running) return;
    requestAnimationFrame(()=>this.loop());
    const raw = this.engine.clock.getDelta(), dt = Math.min(0.05, raw);
    this.t += dt;
    this.update(dt);
    this.engine.render(dt);
    this.input.endFrame();
    this.watchFps(raw);
  }
  /* la fluidité d'abord : si la machine peine (moins de 28 images par seconde pendant
     plusieurs secondes de promenade), on descend d'un cran de qualité, une fois à la fois.
     Une qualité choisie à la main dans les options n'est plus jamais touchée. */
  watchFps(raw){
    if(this.mode !== "play" || document.hidden || Settings.qualityManual || raw > 0.5){ this.fpsAcc = 0; this.fpsN = 0; return; }
    this.fpsAcc = (this.fpsAcc || 0) + raw; this.fpsN = (this.fpsN || 0) + 1;
    if(this.fpsAcc < 6) return;
    const avg = this.fpsAcc / this.fpsN; this.fpsAcc = 0; this.fpsN = 0;
    if(avg < 1 / 28 && this.t - (this.lastDrop || -99) > 15){
      const order = ["ultra", "haute", "moyenne", "basse"], i = order.indexOf(Settings.quality);
      if(i < 0 || i >= order.length - 1) return;
      this.lastDrop = this.t;
      this.setQuality(order[i + 1]);
      this.hud.hint(`Qualité réglée sur <b>${QUALITY[order[i + 1]].label}</b> pour garder le jeu fluide · Échap, Options pour la changer`, 6);
    }
  }
  update(dt){
    /* une scène du récit : elle se joue en volume, dans son lieu ; le reste attend */
    this.story3d.update(dt, this.t);
    if(this.story3d.on){
      /* une scène commence pendant un combat de la Tour (la victoire finale ouvre la révélation) : l'arène s'efface */
      if(this.tower3d && this.tower3d.on) this.tower3d.exit();
      /* le générique : le monde réparé vit sous la caméra (le ciel, l'eau, l'herbe, les Pokémon) */
      if(this.story3d.flying){
        const F = this.story3d.flyFocus || this.player.pos;
        this.world.update(dt, this.t, this.story3d.flyHour || 8, F, this.engine.camera);
        const st = this.world.sky.state; this.engine.setExposure(st ? st.exp : 1);
        this.computeEnv();
        if(this.engine.corrupt) this.engine.corrupt.set(0, 0, this.t, true);
        try { this.wild.update(dt, this.t, F, this.engine.camera, this.env); } catch(e){}
        this.capture.sparks.update(dt);
      }
      this.hud.update(dt, this.t);
      this.audio.update(dt, this.t);
      this.intro.update(dt, this.t);
      return;
    }
    /* la Brèche en 3D : un autre monde, une autre caméra ; la route attend */
    this.breche3d.update(dt, this.t);
    if(this.breche3d.on){
      this.tower3d.update(dt, this.t);
      this.hud.update(dt, this.t);
      this.audio.update(dt, this.t);
      this.intro.update(dt, this.t);
      return;
    }
    /* l'Expédition en 3D : un secteur à elle, une caméra à elle ; la route attend */
    this.expe3d.update(dt, this.t);
    if(this.expe3d.on){
      this.hud.update(dt, this.t);
      this.audio.update(dt, this.t);
      this.intro.update(dt, this.t);
      return;
    }
    const playing = this.mode === "play";
    const look = this.input.locked && playing ? this.input.consumeLook() : (this.input.consumeLook(), {x:0, y:0});
    if(Settings.invertY) look.y = -look.y;
    this.player.frozen = !playing || this.hud.newOpen || (this.trainer && this.trainer.battling) || this.intro.active;
    if(this.mode === "title") this.titleCam(dt);
    else if(!(this.tower3d && this.tower3d.on)) this.player.update(dt, this.input, look);   /* pendant la Tour, la caméra est à elle */
    const S = this.S;
    if(S && this.world.weather.key !== S.weather) this.world.weather.set(S.weather);
    this.world.update(dt, this.t, this.hour(), this.player.pos, this.engine.camera);
    const st = this.world.sky.state;
    this.engine.setExposure(st ? st.exp : 1);
    this.computeEnv();
    this.glitchTick(dt);
    if(playing) this.handleInput(dt);
    this.wild.update(dt, this.t, this.player.pos, this.engine.camera, this.env);
    this.companion.update(dt, this.t);
    this.capture.update(dt, this.t, this.input);
    this.fishing.update(dt, this.t);
    this.trainer.update(dt, this.t);
    this.sentinels.update(dt, this.t);
    this.map.update(dt);
    this.tower3d.update(dt, this.t);
    const night = this.world.sky.state ? this.world.sky.state.night : 0;
    const cp = this.engine.camera.position;
    this.lamp.set(cp.x, cp.y + 0.4, cp.z, night * 1.15);
    this.hud.update(dt, this.t);
    this.audio.update(dt, this.t);
    /* (après tout le reste : la cinématique d'entrée reprend la caméra que le module vient de poser) */
    this.intro.update(dt, this.t);
    this.prompts();
    if(playing && Math.floor(this.t) % 10 === 0 && Math.floor(this.t - dt) % 10 !== 0) this.savePos();
  }
  /* la corruption : l'intégrité de l'archive guérit les zones ; la proximité d'une zone ou de
     MissingNo abîme l'image et déclenche des déchirures (atténuées si le joueur a choisi le calme) */
  glitchTick(dt){
    const S = this.S, C = this.world.corruption, E = this.engine;
    if(!C) return;
    if(S && (this._intT === undefined || this.t - this._intT > 2)){ this._intT = this.t; C.setIntegrity(S.integrity || 0); }
    const P = this.player.pos, near = C.near(P.x, P.z);
    let miss = 0;
    for(const e of this.wild.list){
      if(!e.spec || !e.spec.missing || e.state === "fled" || e.state === "gone") continue;
      miss = Math.max(miss, 1 - Math.hypot(e.pos.x - P.x, e.pos.z - P.z) / 28);
    }
    miss = Math.max(0, miss);
    this.nearCorruption = near; this.nearMissing = miss;
    const calm = typeof window.calmFx === "function" && window.calmFx();
    this.tear = Math.max(0, (this.tear || 0) - dt * 5);
    if(this.mode === "play" || this.mode === "title"){
      const rate = 0.012 + 0.03 * C.level + 0.32 * near + 1.4 * miss;
      if(Math.random() < rate * dt){
        const k = 0.3 + Math.random() * 0.45 + miss * 0.4;
        this.tear = Math.max(this.tear, k);
        if(this.mode === "play" && !calm && this.audio && (near > 0.3 || miss > 0)) this.audio.glitch(Math.min(1, k));
      }
    }
    if(this.noTear){ this.tear = 0; this.glitchKick = 0; }        /* pour les photos de contrôle */
    if(this.glitchKick){ this.tear = Math.max(this.tear, this.glitchKick); if(this.audio && !calm) this.audio.glitch(Math.min(1, this.glitchKick)); this.glitchKick = 0; }
    const amount = 0.18 + 0.3 * C.level + 0.5 * near + 0.8 * miss;
    if(E.corrupt) E.corrupt.set(Math.min(1.5, amount), Math.min(1.2, this.tear), this.t, calm);
  }
  /* la teinte des sprites : la lumière du moment (pas d'ombrage, c'est du pixel) */
  computeEnv(){
    const sky = this.world.sky, E = this.env;
    E.tint.copy(sky.sun.color).multiplyScalar(Math.min(1, sky.sun.intensity * 0.3)).add(sky.hemi.color.clone().multiplyScalar(sky.hemi.intensity * 0.55));
    /* le monde est éteint, pas les Pokémon : ils gardent assez de lumière pour se détacher */
    const m = Math.max(E.tint.r, E.tint.g, E.tint.b), night = sky.state ? sky.state.night : 0, floor = 0.86 - 0.22 * night;
    if(m < floor && m > 0) E.tint.multiplyScalar(floor / m);
    else if(m > 1.08) E.tint.multiplyScalar(1.08 / m);
    E.fog.copy(this.engine.scene.fog.color); E.fogDensity = this.engine.scene.fog.density;
  }
  handleInput(dt){
    const I = this.input, cap = this.capture;
    for(const c of I.consumeClicks()){
      if(c !== "left") continue;
      if(this.hud.newOpen){ this.hud.closeNew(); continue; }
      if(this.trainer.battling){ continue; }
      if(this.fishing.active){ this.fishing.click(); continue; }
      cap.throw();
    }
    const w = I.consumeWheel();
    if(w && !this.fishing.active) cap.cycle(w > 0 ? 1 : -1);
    BALL_ORDER.forEach((k, i)=>{ if(I.hit("Digit" + (i + 1)) || I.hit("Numpad" + (i + 1))) cap.setBall(k); });
    for(const code in BERRY_KEYS) if(I.hit(code)){
      const k = BERRY_KEYS[code], S = this.S;
      if((S.berries[k] || 0) <= 0) window.toast("Plus de " + this.G.BERRIES[k].name, "bad", "cross");
      else if(!window.useBerry(k)) window.toast(this.G.BERRIES[k].name + " déjà active", "", "seed");
    }
    if(I.hit("KeyF") || I.char("f")) this.fishing.toggle();
    if(I.hit("KeyM") || I.char("m")) this.map.toggle();
    /* H : l'heure — réelle, toujours le jour, toujours la nuit */
    if(I.hit("KeyH") || I.char("h")){
      const order = ["reel", "jour", "nuit"], i = order.indexOf(Settings.time);
      Settings.time = order[(i + 1) % 3]; saveSettings();
      this.hud.hint({reel:"Heure réelle : le ciel suit ton horloge", jour:"Toujours le jour", nuit:"Toujours la nuit"}[Settings.time] + " · <b>H</b> pour changer", 3);
    }
    if(I.hit("KeyE") || I.char("e")) this.trainer.interact() || this.fishing.interact() || this.companion.poke();
  }
  prompts(){
    if(this.mode !== "play"){ return; }
    let p = "";
    if(this.hud.newOpen) p = "";
    else if(this.trainer.prompt()) p = this.trainer.prompt();
    else if(this.fishing.prompt()) p = this.fishing.prompt();
    else if(this.capture.target && !this.capture.aiming) p = `<b>Clic droit</b> viser · <b>clic gauche</b> lancer`;
    if(this.input.locked || !p) this.hud.prompt(p);
  }
  /* la caméra de l'écran titre : elle flâne au-dessus de la route */
  titleCam(dt){
    const c = this.engine.camera, k = this.t * 0.035;
    const z = 95 - (k * 40) % 120, x = pathX(z) + Math.sin(k * 2) * 6;
    c.position.set(x - 6, heightAt(x, z) + 2.4, z + 4);
    c.rotation.set(-0.06, -0.55 + Math.sin(k) * 0.15, 0);
    this.player.pos.set(x, heightAt(x, z), z);
  }
  savePos(){ try { if(this.started) localStorage.setItem(POS_KEY, JSON.stringify({x:this.player.pos.x, z:this.player.pos.z, yaw:this.player.yaw})); } catch(e){} }
  restorePos(){
    let p = null;
    try { p = JSON.parse(localStorage.getItem(POS_KEY) || "null"); } catch(e){}
    if(p && p.x > BOUNDS.x0 && p.x < BOUNDS.x1 && p.z > BOUNDS.z0 && p.z < BOUNDS.z1){ this.player.pos.set(p.x, heightAt(p.x, p.z), p.z); this.player.yaw = p.yaw || 0; }
    else { const z = 140; this.player.pos.set(pathX(z), heightAt(pathX(z), z), z); this.player.yaw = 0; }
  }
  fatal(e){
    const el = document.getElementById("pc-load-step");
    if(el) el.textContent = "Impossible de démarrer la 3D : " + (e && e.message || e);
  }
  /* pour les tests (rendu logiciel, très lent) : arrêter la boucle, avancer d'un pas */
  freeze(){ this.running = false; }
  sim(dt = 1 / 30, n = 1){ for(let i = 0; i < n; i++){ this.t += dt; this.update(dt); this.input.endFrame(); } }
  step(dt = 1 / 30, n = 1){ for(let i = 0; i < n; i++){ this.t += dt; this.update(dt); } const t0 = performance.now(); this.engine.render(dt); return performance.now() - t0; }
  teleport(x, z, yaw = 0, pitch = 0){ this.player.pos.set(x, heightAt(x, z), z); this.player.yaw = yaw; this.player.pitch = pitch; this.player.vel.set(0, 0, 0); this.world.grass.prime(this.player.pos); }
}
export { QUALITY };
