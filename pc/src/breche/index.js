/* ============================================================
   LA BRÈCHE EN 3D — LA VERSION PC
   Le moteur de la Brèche (le jeu mobile) reste seul maître de la
   partie : vagues, attaques, dégâts, boss, récompenses. Sur PC, on
   le joue à la troisième personne, derrière le Pokémon de tête :
     · la souris oriente la caméra (et la visée) ;
     · ZQSD / WASD déplacent l'équipe, relativement à la caméra ;
     · l'équipe tire vers le réticule (la cible la plus proche du
       réticule, sinon droit devant) ;
     · Espace : l'esquive (un bond court, invulnérable, rechargé en
       1,4 s) ;
     · 1 à 4 : les choix de niveau, R : relancer, Entrée : continuer,
       Échap ou Tab : la pause.
   La scène est la nôtre (ciel, brouillard, lumière de l'habitat) ;
   la chaîne d'effets du moteur (halo, tonalité, image abîmée) reste
   la même que sur la route.
   ============================================================ */
import * as THREE from "three";
import { S, G, ref, Discs } from "./lib.js";
import { World } from "./world.js";
import { OCC } from "../mon/occ.js";
import { Horde } from "./horde.js";
import { Team, Specials, Props, teamHeight, PZ_H, pzLift } from "./units.js";
import { Fx } from "./fx.js";
import { Legends } from "./legends.js";
import { Depth } from "./depth.js";
import { BrHud } from "./hud.js";
import { Settings } from "../settings.js";
import { realHeight } from "../mon/sprites.js";

const SIM_VIEW = 860;                 /* la taille de « l'écran » pour la simulation : comme un téléphone */
const AIM_MAX = 17;                   /* portée de la visée, en mètres */

export class Breche3D {
  constructor(game){
    this.game = game; this.on = false; this.built = false;
    this.yaw = 0; this.pitch = 0.45; this.dist = 7; this.frame = 0;
    this.camPos = new THREE.Vector3(); this.focus = new THREE.Vector3(); this.aim = new THREE.Vector3();
    this.ray = new THREE.Raycaster(); this.tipT = 0; this.shakeV = new THREE.Vector3();
    window.PCBR3D = {on:false};
    /* les choix de niveau et les coffres : à la souris ou au clavier ; une fois choisi, on reprend la main */
    addEventListener("click", e=>{
      if(!this.on) return;
      const el = e.target.closest && e.target.closest("[data-act]");
      if(el && /^(brpick|brclose|brresume|brdeep)$/.test(el.dataset.act)) setTimeout(()=>this.relock(), 30);
    }, true);
  }
  /* une run de la Brèche est-elle en cours, dans le terminal ? */
  wanted(){
    const g = G(); if(!g || !this.game.terminal || !this.game.terminal.open) return false;
    const R = ref("BR"), box = document.getElementById("breche");
    return !!(R && box && box.classList.contains("on") && !R.over);
  }
  build(){
    this.built = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 600);
    this.camera.rotation.order = "YXZ";
    this.world = new World(this.scene);
    const q = this.game.engine.q; if(q && q.shadow) this.world.sun.shadow.mapSize.set(Math.min(2048, q.shadow), Math.min(2048, q.shadow));
    this.horde = new Horde(this.scene);
    this.team = new Team(this.scene);
    this.specials = new Specials(this.scene);
    this.props = new Props(this.scene);
    this.fx = new Fx(this.scene);
    this.fx.leg = new Legends(this.fx);
    this.fx.depth = new Depth(this.fx, this.world);
    this.hud = new BrHud();
    this.aimDiscs = new Discs(this.scene);
  }
  enter(){
    if(!this.built) this.build();
    const R = ref("BR");
    this.R = R; this.on = true; window.PCBR3D.on = true; this.hadLock = false;
    R.pc = true;
    R.W = R.H = SIM_VIEW;
    document.body.classList.add("breche3d");
    this.world.setHabitat(R.hab || "route");
    this.world.prime(R);
    this.game.engine.useScene(this.scene, this.camera);
    this.camera.fov = Settings.fov || 70; this.camera.updateProjectionMatrix();
    this.hud.show(true);
    this.tipT = R.firstRun || !(this.game.S && this.game.S.flags && this.game.S.flags.pcBreche) ? 9 : 4;
    try { this.game.S.flags.pcBreche = true; } catch(e){}
    this.pooled = false;
    this.yaw = 0; this.pitch = 0.45;
    this.relock();
  }
  exit(){
    this.on = false; window.PCBR3D.on = false;
    document.body.classList.remove("breche3d");
    this.game.engine.useScene(null);
    this.hud.show(false);
    this.team.dispose(); this.specials.dispose();
    this.horde.dispose(); this.horde = new Horde(this.scene);
    this.world.clear(); this.world.hab = null;
    const R = this.R; if(R){ R.pcMove = null; R.aim = null; R.pcFwd = null; }
    this.R = null;
  }
  relock(){
    const R = ref("BR");
    if(!this.on || !R || R.paused || R.modal || R.over) return;
    if(!this.game.input.locked) this.game.input.lock();
  }
  /* ---------- les touches propres à la Brèche ---------- */
  key(e){
    const R = ref("BR"); if(!this.on || !R) return false;
    const m = document.getElementById("br-modal");
    const open = m && /\bon\b/.test(m.className);
    if(e.code === "Tab"){ e.preventDefault(); if(!R.modal){ ref("brPause")(!R.paused); if(R.paused) this.game.input.unlock(); else this.relock(); } return true; }
    if(e.code === "Escape"){ if(R.paused) setTimeout(()=>this.relock(), 30); return true; }   /* le jeu mobile bascule la pause lui-même */
    if(open){
      const d = /^(Digit|Numpad)([1-4])$/.exec(e.code);
      if(d){ const el = m.querySelector(`[data-act="brpick"][data-i="${+d[2] - 1}"]`); if(el){ el.click(); e.preventDefault(); return true; } }
      if(e.code === "KeyR" || (e.key && e.key.toLowerCase() === "r")){ const el = m.querySelector('[data-act="brreroll"]'); if(el){ el.click(); return true; } }
      if(e.code === "Enter" || e.code === "Space" || e.code === "NumpadEnter"){
        const el = [...m.querySelectorAll(".btn.pri")].find(b=>getComputedStyle(b).visibility !== "hidden");
        if(el){ e.preventDefault(); el.click(); return true; }
      }
    }
    return false;
  }
  /* ---------- à chaque image ---------- */
  update(dt, t){
    const want = this.wanted();
    if(want && !this.on) this.enter();
    else if(!want && this.on) this.exit();
    else if(want && ref("BR") !== this.R){ this.exit(); this.enter(); }       /* une nouvelle run */
    if(!this.on) return;
    const R = this.R, I = this.game.input;
    this.frame++;
    R.W = R.H = SIM_VIEW;
    const active = !R.paused && !R.modal && !R.over;
    /* une fenêtre s'ouvre : on rend la souris */
    if(!active && I.locked) I.unlock();
    /* la caméra : la souris tourne et incline */
    const look = I.locked ? I.consumeLook() : (I.consumeLook(), {x:0, y:0});
    if(Settings.invertY) look.y = -look.y;
    const sens = 0.0021;
    this.yaw -= look.x * sens; this.pitch = Math.max(-0.12, Math.min(1.05, this.pitch + look.y * sens));
    const wh = I.consumeWheel(); if(wh) this.dist = Math.max(3.6, Math.min(11, this.dist + wh * 0.6));
    /* le déplacement, relatif à la caméra */
    let mx = 0, mz = 0;
    if(I.locked){
      if(I.down("KeyW") || I.down("ArrowUp")) mz -= 1;
      if(I.down("KeyS") || I.down("ArrowDown")) mz += 1;
      if(I.down("KeyA") || I.down("ArrowLeft")) mx -= 1;
      if(I.down("KeyD") || I.down("ArrowRight")) mx += 1;
    }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let wx = -mz * fx + mx * rx, wz = -mz * fz + mx * rz; const L = Math.hypot(wx, wz);
    if(L > 1){ wx /= L; wz /= L; }
    R.pcMove = L > 0 ? [wx, wz] : [0, 0];
    R.pcFwd = [fx, fz];
    if(I.locked && I.hit("Space")) ref("brDodge")(R);
    if(this.tipT > 0 && (L > 0 || this.tipT < 8)) this.tipT -= dt;
    /* la visée */
    this.updateAim(R);
    /* ce que l'on regarde : l'équipe, ou ce que la mise en scène montre (entrée d'un gardien) */
    const lead = this.team.lead(), lh = lead ? lead.h || 1.2 : 1.2;
    const fcx = (R.cam ? R.cam.x : R.x) * S, fcz = (R.cam ? R.cam.y : R.y) * S;
    this.focus.set(fcx, lh * 0.9 + 0.6, fcz);
    this.placeCamera(R, dt, t);
    /* le monde, l'équipe, la horde, les effets */
    OCC.uEye.value.copy(this.camera.position); OCC.uFocus.value.set(R.x * S, lh * 0.7, R.y * S);
    this.world.update(R, dt, t, new THREE.Vector3(R.x * S, 0, R.y * S));
    this.world.ambient(dt, t, this.camera.position);
    const env = this.game.env;
    this.team.update(R, dt, t, this.camera, {aimYaw:this.aimYaw, env});
    this.foes(R, dt, t, env);
    this.horde.pump(t);
    this.fx.render(R, {t, dt, eye:this.camera.position, frame:this.frame, team:this.team.recs});
    /* le point visé, au sol */
    this.aimDiscs.begin();
    if(I.locked && active) this.aimDiscs.add(this.aim.x, this.aim.z, this.aimFoe ? 0.7 : 0.45, this.aimFoe ? "#ff5c8a" : "#8fecff", {fill:0.05, rim:0.9, inner:0.8, a:0.8});
    this.aimDiscs.end();
    this.hud.draw(R, {cam:this.camera, t, yaw:this.yaw, aimFoe:!!this.aimFoe, cine:!!(R.cine || R.mini), tipT:this.tipT, heightOf:f=>this.heightOf(f), dp:this.fx.depth.hud});
    /* l'image abîmée : discrète, un peu plus quand on est touché ou face au gardien */
    const E = this.game.engine, calm = typeof window.calmFx === "function" && window.calmFx();
    const dp = this.fx.depth.hud;
    if(E.corrupt) E.corrupt.set(0.25 + (R.boss ? 0.25 : 0) + (R.hurt > 0 ? 0.5 : 0) + dp.flash * 0.9 + (R.boss && R.boss.pz ? 0.15 : 0), (R.hurt > 0 ? 0.25 : 0) + dp.flash * 0.5, t, calm);
    E.setExposure(this.world.H && this.world.H.dark ? 1.25 : 1.1);
  }
  heightOf(f){
    if(f.pz) return PZ_H;
    if(f.boss) return Math.max(2.4, Math.min(6, (f.size || 100) * S * 1.05));
    return Math.max(0.55, Math.min(4.5, (f.size || 40) * S * (f.elite || f.big ? 1.05 : 0.95)));
  }
  /* ---------- les ennemis : la horde instanciée, les autres un par un ---------- */
  foes(R, dt, t, env){
    const H = this.horde, SP = this.specials, PR = this.props, FX = this.fx;
    H.begin(); SP.begin(); PR.begin();
    const lx = R.x, ly = R.y;
    /* Miroir : la faille copie votre équipe — ses copies ont un éclat de verre violet */
    const mirror = R.anom && R.anom.k === "miroir" ? new Set(R.team.map(w=>ref("brShownId")(w))) : null;
    R.P.foes.each(f=>{
      if(f.hp <= 0 && !f.boss) return;
      const h = this.heightOf(f), yaw = Math.atan2(lx - f.x, ly - f.y);
      if(f.under > 0){ FX.burrow(f, t); return; }
      if(f.kind === "pylon"){ PR.pylon(f, t); return; }
      if(f.kind === "nest"){ PR.nest(f, t); return; }
      FX.foeMarks(f, R, t, h);
      const special = f.elite || f.boss || f.big || f.pz || f.reaper;
      if(special){ SP.show(f, R, dt, t, this.camera, env, f.reaper ? t : yaw, h); return; }
      H.want(f.id);
      /* sa propre image de marche : elle avance, sauf s'il est étourdi, gelé ou figé dans le temps */
      const still = f.stun > 0 || f.frz > 0 || f.tstop > 0;
      if(f._vt === undefined || f._vid !== f.id){ f._vt = Math.random() * 16; f._vid = f.id; }
      if(!still) f._vt += dt * 16 / 0.9 * (f.slow > 0 ? 0.55 : 1);
      const ok = H.add(f.id, {x:f.x * S, y:f.rise > 0 ? -f.rise * h * 0.9 : 0, z:f.y * S, yaw, h, frame:f._vt, flash:f.flash > 0 ? 0.85 : 0,
        frozen:f.frz > 0 ? 1 : 0, alpha:f.rise > 0 ? Math.max(0.1, 1 - f.rise) : 1, corrupt:f.shiny || f.gold ? 0 : mirror && mirror.has(f.id) ? 0.45 : 1, gold:f.gold ? 1 : f.shiny ? 0.9 : 0,
        tint:f.tstop > 0 ? [0.62, 0.88, 0.48] : f.psn > 0 ? [0.7, 0.4, 0.9] : f.burn > 0 ? [1, 0.5, 0.2] : f.gold ? [1, 0.74, 0.16] : mirror && mirror.has(f.id) ? [0.8, 0.62, 1] : null,
        tintA:f.tstop > 0 ? 0.35 : f.psn > 0 ? 0.2 : f.burn > 0 ? 0.25 : f.gold ? 0.6 : mirror && mirror.has(f.id) ? 0.3 : 0});
      /* pas encore prêt : une silhouette de lumière, le temps du chargement */
      if(!ok) FX.glow.add(f.x * S, h * 0.5, f.y * S, h * 1.4, f.shiny || f.gold ? "#ffe9a8" : "#ff3d7f", 0.55);
    });
    H.end(); SP.end(); PR.end();
  }
  /* ---------- la visée : le réticule, au centre de l'écran ---------- */
  updateAim(R){
    const cam = this.camera;
    this.ray.setFromCamera({x:0, y:0}, cam);
    const o = this.ray.ray.origin, d = this.ray.ray.direction;
    /* d'abord un ennemi sous le réticule (une sphère par ennemi), sinon le sol */
    let best = null, bt = 1e9;
    R.P.foes.each(f=>{
      if(f.hp <= 0 || f.under > 0) return;
      const h = this.heightOf(f), cx = f.x * S - o.x, cy = (f.pz ? pzLift(this.game.t || 0) : 0) + h * 0.55 - o.y, cz = f.y * S - o.z, rr = Math.max(0.6, h * 0.55);
      const tt = cx * d.x + cy * d.y + cz * d.z; if(tt < 0 || tt > 60) return;
      const px = cx - d.x * tt, py = cy - d.y * tt, pz = cz - d.z * tt;
      if(px * px + py * py + pz * pz < rr * rr && tt < bt){ bt = tt; best = f; }
    });
    let ax, az;
    if(best){ ax = best.x * S; az = best.y * S; }
    else {
      const tg = d.y < -0.01 ? -o.y / d.y : 1e9;
      const k = Math.min(tg, 80);
      ax = o.x + d.x * k; az = o.z + d.z * k;
    }
    /* au-delà de la portée : on vise dans la même direction, au bout de la portée */
    const dx = ax - R.x * S, dz = az - R.y * S, dd = Math.hypot(dx, dz);
    if(dd > AIM_MAX){ ax = R.x * S + dx / dd * AIM_MAX; az = R.y * S + dz / dd * AIM_MAX; }
    if(dd < 1.2){ ax = R.x * S - Math.sin(this.yaw) * 4; az = R.y * S - Math.cos(this.yaw) * 4; }
    this.aim.set(ax, 0, az);
    this.aimFoe = best;
    R.aim = {x:ax / S, y:az / S};
    /* le chef de file se tourne vers la visée */
    this.aimYaw = Math.atan2(ax - R.x * S, az - R.y * S);
  }
  /* ---------- la caméra : derrière et au-dessus de l'épaule ---------- */
  placeCamera(R, dt, t){
    const cam = this.camera, cineZ = R.camZ || 1;
    const dist = this.dist / cineZ, p = this.pitch;
    const back = Math.cos(p) * dist, up = Math.sin(p) * dist + 0.4;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const sh = 0.75;                                      /* au-dessus de l'épaule droite */
    const want = new THREE.Vector3(this.focus.x - fx * back + rx * sh, this.focus.y + up, this.focus.z - fz * back + rz * sh);
    if(want.y < 0.6) want.y = 0.6;
    const k = R.cam ? Math.min(1, dt * 3) : 1;
    this.camPos.lerp(want, this.camPos.lengthSq() ? k : 1);
    cam.position.copy(this.camPos);
    /* la secousse du jeu mobile, adoucie */
    const calm = typeof window.calmFx === "function" && window.calmFx();
    const shk = calm ? 0 : Math.min(0.35, (R.shake || 0) * 0.025);
    if(shk > 0) cam.position.add(this.shakeV.set((Math.random() - .5) * shk, (Math.random() - .5) * shk, (Math.random() - .5) * shk));
    cam.rotation.set(-p * 0.82 + 0.05, this.yaw, 0, "YXZ");
  }
}
