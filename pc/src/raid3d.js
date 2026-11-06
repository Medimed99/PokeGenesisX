/* ============================================================
   LE RAID EN 3D · AU PIED DU PHARE
   Le raid de la semaine reste celui du jeu mobile (95b) : un
   légendaire aux deux millions de points de vie, trente tours pour
   frapper, trois attaques par jour, des dégâts qui s'ajoutent à ceux
   de tous les archivistes, des paliers communs. Sur PC, on va le
   chercher à pied :
     · au phare du raid (ouest, avant Jadielle), le boss de la semaine
       se tient au sommet, en petit ; E lance l'attaque ;
     · une cinématique : la caméra monte vers lui, il s'éveille,
       grandit, et descend dans l'arène cerclée de pierres levées ;
     · le combat se joue là, dans le monde : ton équipe à l'est, le
       boss immense à l'ouest, devant son phare. Le moteur de combat du
       jeu mobile tourne, caché ; arena.js (celui de l'Expédition) le
       met en volume : les coups, les chiffres, les K.O. ;
     · en haut, le compteur : les dégâts de l'attaque, qui montent à
       chaque coup, et les tours qui restent ; Maj (maintenu) accélère ;
     · la fin : le boss se retire, le bilan du jeu mobile s'ouvre, puis
       l'écran du raid (classement, paliers à réclamer).
   Plus d'attaque aujourd'hui : E ouvre l'écran du raid.
   ============================================================ */
import * as THREE from "three";
import { XArena } from "./expe/arena.js";
import { SITES, heightAt } from "./world/layout.js";
import { RAID_OX } from "./world/sites.js";
import { realHeight } from "./mon/sprites.js";
import { preloadMon } from "./mon/model3d.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const fmt = n => Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();
const SITE = () => SITES.find(s=>s.k === "raid");
const UP = new THREE.Vector3(0, 1, 0), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3();
/* l'équipe arrive de l'est (du chemin) et fait face au phare, à l'ouest */
const FWD = new THREE.Vector3(-1, 0, 0), RIGHT = new THREE.Vector3(0, 0, -1);
const FOE_D = 3.4;                        /* le boss, à cette distance du centre (vers le phare) */

export class Raid3D {
  constructor(game){
    this.game = game; this.on = false; this.pending = false; this.arena = null;
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3();
    this.fx = document.createElement("canvas"); this.fx.id = "pc-raid-fx"; document.body.appendChild(this.fx);
    this.ban = document.createElement("div"); this.ban.id = "pc-raid-ban"; document.body.appendChild(this.ban);
    this.ban.innerHTML = `<div class="rb-k"></div><div class="rb-n"><b>0</b><span>dégâts</span></div><div class="rb-t"><i></i></div><div class="rb-s"></div>`;
    this.shown = 0; this.bump = 0;
  }
  /* le centre de l'arène : le parvis, un peu à l'est du phare */
  center(out = new THREE.Vector3()){ const s = SITE(); return out.set(s.x + 1.5, heightAt(s.x + 1.5, s.z), s.z); }
  bossH(id){ return clamp(realHeight(id) * 2.4, 4.8, 7.5); }
  /* le premier plan du combat (la cinématique s'y pose) */
  restPose(H, pos, look){
    const C = this.center(V3);
    pos.copy(C).addScaledVector(FWD, -(8.6 + H * 0.5)).addScaledVector(RIGHT, -3.0); pos.y = C.y + 2.6 + H * 0.42;
    look.copy(C).addScaledVector(FWD, 2.0); look.y = C.y + H * 0.5 + 0.3;
  }
  /* un combat de raid est-il à l'écran (dans le terminal) ? */
  wanted(){
    const B = ref("BATTLE");
    return !!(this.game.terminal && this.game.terminal.open && ref("currentScreen") === "battle" && B && B.foes && B.foes[0] && B.foes[0].raid);
  }
  /* ce que dit l'invite, au pied du phare */
  promptText(){
    const g = G(); if(!g) return "";
    try {
      const left = ref("RAID_TRIES") - ref("raidState")().tries, id = ref("raidBoss")(), n = g.POKE[id] ? g.POKE[id].name : "le boss";
      return left > 0 ? `<b>E</b> · attaquer ${esc(n)} <span style="opacity:.75">(${left} attaque${left > 1 ? "s" : ""} aujourd'hui)</span>`
        : `<b>E</b> · le raid : classement et paliers <span style="opacity:.75">(plus d'attaque aujourd'hui)</span>`;
    } catch(e){ return `<b>E</b> · le raid de la semaine`; }
  }
  /* ---------- E au pied du phare ---------- */
  start(){
    const g = G(), game = this.game; if(!g || this.pending || this.on) return;
    let left = 0, team = [];
    try { left = ref("RAID_TRIES") - ref("raidState")().tries; team = (ref("teamIds") || (()=>g.S.team))(); } catch(e){}
    if(left <= 0 || !team.length){
      game.terminal.show("social");
      if(!team.length) game.hud.hint("Il faut une équipe pour attaquer le boss", 4);
      return;
    }
    const id = ref("raidBoss")(), name = g.POKE[id] ? g.POKE[id].name : "Le boss", H = this.bossH(id);
    preloadMon(id, false); for(const t of team) preloadMon(t, false);
    this.pending = true; this.pendH = H;
    const s = SITE(), top = new THREE.Vector3(s.x + RAID_OX, heightAt(s.x + RAID_OX, s.z) + 9.2, s.z);
    const C = this.center(new THREE.Vector3()), P = new THREE.Vector3(), L = new THREE.Vector3();
    this.restPose(H, P, L);
    const at = (x, y, z) => new THREE.Vector3(x, y, z);
    const sites = game.world.sites;
    /* sa place dans l'arène (celle qu'arena.js lui donnera), vue du phare */
    const spot = C.clone().addScaledVector(FWD, FOE_D), wake = {k:0, H, lx:spot.x - (s.x + RAID_OX), lz:spot.z - s.z};
    const mid = top.clone().lerp(spot, 0.5);
    game.intro.play({id:"raid", camera:game.engine.camera, dur:5.2, color:"#ff6a3d", ver:1,
      kicker:"RAID DE LA SEMAINE", title:name,
      goal:"Trente tours pour frapper le plus fort possible. Tes dégâts s'ajoutent à ceux de tous les archivistes.",
      shots:[{p:at(C.x + 26, C.y + 15, C.z + 18), l:top.clone()}, {p:at(top.x + 8, top.y + 1.2, top.z + 6.5), l:top.clone().add(UP.clone().multiplyScalar(1.2))},
        {p:at(mid.x + 11, mid.y + 2.5, mid.z + 7), l:mid.clone()}, {p:P.clone(), l:L.clone()}],
      titleAt:0.5, blend:0.72,
      controls:[{k:["Maj"], t:"accélérer le combat (maintenir)", on:{keys:["ShiftLeft", "ShiftRight"]}}],
      alive:()=>this.pending || this.on, visible:()=>this.on,
      /* le boss s'éveille sur son phare, grandit, puis descend dans l'arène */
      beat:(k)=>{ wake.k = k; if(sites) sites.raidWake = wake; },
      onEnd:()=>this.launch()});
  }
  launch(){
    const A = G() && G().ACTIONS, game = this.game;
    try { game.terminal.show("social", false); if(A && A.raidfight) A.raidfight(); } catch(e){ console.warn(e); }
    this.pending = false;
    if(game.world.sites){ game.world.sites.raidWake = null; game.world.sites.raidHold = this.wanted(); }
  }
  /* ---------- entrer, sortir ---------- */
  enter(){
    this.on = true; this.pending = false;
    const game = this.game, B = ref("BATTLE"), id = B.foes[0].id;
    if(!this.arena) this.arena = new XArena(game.engine.scene, game);
    this.arena.o = {allyD:2.4, foeD:FOE_D, side:1.25, bossH:i=>this.bossH(i)};
    const C = this.center(new THREE.Vector3());
    this.arena.begin(C, (x, z)=>heightAt(x, z), FWD, false);
    this.B = B; this.H = this.bossH(id); this.shown = 0; this.last = 0; this.bump = 0; this.colT = -1;
    try { this.wk0 = ref("raidTotal")(); } catch(e){ this.wk0 = 0; }
    document.body.classList.add("raid3d"); this.fx.classList.add("on"); this.ban.classList.add("on");
    game.world.focus = C;
    const cam = game.engine.camera; this.prevFov = cam.fov; cam.fov = 56; cam.updateProjectionMatrix();
    this.restPose(this.H, this.camPos, this.camLook);
    if(!game.intro.active){ cam.position.copy(this.camPos); cam.lookAt(this.camLook); }
    /* les Pokémon sauvages s'écartent de l'arène ; le boss quitte son phare */
    for(const e of game.wild.list.slice()) if(Math.hypot(e.pos.x - C.x, e.pos.z - C.z) < 40) game.wild.remove(e);
    if(game.world.sites) game.world.sites.raidHold = true;
    const n = ref("raidBoss") ? G().POKE[id].name : "";
    this.ban.querySelector(".rb-k").textContent = "RAID · " + n.toUpperCase();
  }
  exit(){
    this.on = false;
    const game = this.game;
    document.body.classList.remove("raid3d"); this.fx.classList.remove("on"); this.ban.classList.remove("on");
    if(this.arena) this.arena.end();
    if(this.col){ game.engine.scene.remove(this.col); this.col.material.dispose(); this.col = null; }
    const x = this.fx.getContext("2d"); x.clearRect(0, 0, this.fx.width, this.fx.height);
    game.world.focus = null;
    const cam = game.engine.camera; cam.fov = this.prevFov || cam.fov; cam.updateProjectionMatrix();
    if(game.world.sites) game.world.sites.raidHold = false;
  }
  /* ---------- à chaque image ---------- */
  update(dt, t){
    const want = this.wanted();
    if(want && !this.on) this.enter();
    else if(!want && this.on) this.exit();
    else if(want && ref("BATTLE") !== this.B){ this.exit(); this.enter(); }
    const cam = this.game.engine.camera;
    /* la cinématique d'avant le combat se pose sur le premier plan de l'arène */
    if(this.pending && !this.on){ this.restPose(this.pendH, V1, V2); cam.position.copy(V1); cam.lookAt(V2); cam.updateMatrixWorld(); return; }
    if(!this.on) return;
    const B = ref("BATTLE"), I = this.game.input;
    if(B && B !== this.spB){ this.spB = B; B.speed = 1; }
    if(B && B.ai) B.turbo = I.down("ShiftLeft") || I.down("ShiftRight");
    I.consumeLook(); I.consumeWheel && I.consumeWheel();
    const ok = this.arena.update(t, dt, cam, this.game.env);
    if(ok) this.camera(cam, dt, t);
    this.entrance(t);
    this.overlay();
    this.banner(B, dt);
  }
  /* le boss arrive par une colonne de lumière, là où il se tient */
  entrance(t){
    const A = this.arena, AR = A.AR; if(!AR) return;
    const ff = [...AR.act.values()].find(a=>a.side === "foe" && a.role === "front"), r = ff && A.recs.get(ff.f);
    if(!r) return;
    if(this.colT < 0){
      this.colT = t;
      if(!this.colGeo) this.colGeo = new THREE.CylinderGeometry(1, 1, 30, 24, 1, true).translate(0, 15, 0);
      this.col = new THREE.Mesh(this.colGeo, new THREE.MeshBasicMaterial({color:"#ff8a5c", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
      this.col.frustumCulled = false; this.game.engine.scene.add(this.col);
      const s = A.sparks(); if(s && !calmFx()) s.burst(V1.copy(r.pos).add(V2.set(0, this.H * 0.5, 0)), 60, ["#ff6a3d", "#ffd166", "#ffffff"], 5, 1.2, 0.9);
    }
    if(!this.col) return;
    const k = (t - this.colT) / 1.8;
    if(k >= 1){ this.game.engine.scene.remove(this.col); this.col.material.dispose(); this.col = null; return; }
    this.col.position.set(r.pos.x, r.pos.y - 0.2, r.pos.z);
    this.col.scale.set(this.H * 0.45 * (1 - k * 0.5), 1, this.H * 0.45 * (1 - k * 0.5));
    this.col.material.opacity = Math.sin(Math.PI * k) * 0.5;
  }
  /* ---------- la caméra : large, derrière l'équipe ; elle se resserre sur un coup qui compte ---------- */
  camera(cam, dt, t){
    const A = this.arena, AR = A.AR, H = this.H || 4;
    const want = V1, look = V2;
    this.restPose(H, want, look);
    if(!calmFx()){ want.addScaledVector(RIGHT, Math.sin(t * 0.13) * 1.1); want.y += Math.sin(t * 0.21) * 0.25; }
    /* un critique, un coup super efficace : on avance vers la cible */
    if(AR && AR.zoom > 0.05 && AR.cur){
      const D = A.recs.get(AR.cur.def);
      if(D){ const w = Math.min(0.32, AR.zoom * 0.32); want.lerp(V3.copy(D.pos).addScaledVector(FWD, -(4 + D.h * 0.6)).add(V2.clone().set(0, 1.2 + D.h * 0.3, 0)), w); }
    }
    const k = Math.min(1, dt * 2.2);
    this.camPos.lerp(want, k); this.camLook.lerp(look, k);
    cam.position.copy(this.camPos);
    const sh = calmFx() ? 0 : Math.min(0.3, (AR ? AR.shake : 0) * 0.014);
    if(sh > 0.002) cam.position.add(V3.set((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0));
    cam.lookAt(this.camLook);
    cam.updateMatrixWorld();
  }
  /* ---------- par-dessus : les chiffres, les noms des coups (arena.js) ---------- */
  overlay(){
    const cv = this.fx, d = Math.min(2, devicePixelRatio || 1);
    if(cv.width !== Math.round(innerWidth * d) || cv.height !== Math.round(innerHeight * d)){ cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
    const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
    const cam = this.game.engine.camera;
    const project = v => { const p = v.clone().project(cam); if(p.z > 1) return null; return {x:(p.x * 0.5 + 0.5) * innerWidth, y:(-p.y * 0.5 + 0.5) * innerHeight}; };
    this.arena.overlay(x, innerWidth, innerHeight, project);
  }
  /* ---------- le compteur : les dégâts de l'attaque, les tours qui restent ---------- */
  banner(B, dt){
    if(!B || !B.foes || !B.foes[0]) return;
    const boss = B.foes[0], dmg = Math.max(0, Math.round(boss.maxHp - Math.max(0, boss.hp)));
    if(dmg > this.last){ this.bump = 1; this.last = dmg; }
    this.shown += (dmg - this.shown) * Math.min(1, dt * 6); if(Math.abs(dmg - this.shown) < 1) this.shown = dmg;
    this.bump = Math.max(0, this.bump - dt * 3);
    const n = this.ban.querySelector(".rb-n b"); n.textContent = fmt(this.shown);
    n.style.transform = `scale(${1 + ease(this.bump) * 0.16})`;
    const T = B.maxTurns || 30, turn = Math.min(T, B.turn || 0);
    this.ban.querySelector(".rb-t i").style.width = (turn / T * 100).toFixed(1) + "%";
    let s = `Tour ${turn} / ${T}`;
    s += ` · semaine : ${fmt((this.wk0 || 0) + dmg)}`;
    if(B.over) s = "Le boss se retire · " + s;
    const el = this.ban.querySelector(".rb-s"); if(el.textContent !== s) el.textContent = s;
  }
  /* Tab, Échap : rien ne s'interrompt (une fiche ouverte se referme) */
  key(e){
    if(e.code !== "Tab" && e.code !== "Escape") return false;
    e.preventDefault();
    const sr = document.getElementById("sheet-root");
    if(sr && /\bon\b/.test(sr.className) && window.closeSheet) window.closeSheet();
    return true;
  }
}
