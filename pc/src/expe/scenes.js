/* ============================================================
   L'EXPÉDITION EN 3D · LES SCÈNES DES NŒUDS
   Chaque scène du jeu mobile (51) garde ses choix (le pupitre, à
   droite, et ses cartes) ; ce qu'elle montrait en image se joue ici,
   dans le nœud, devant l'équipe rassemblée :
     · une rencontre : le Pokémon sauvage bondit hors des herbes (« ! »),
       le dresseur pose ses Poké Balls à ses pieds, le Champion se
       révèle, le noyau se manifeste ;
     · le recrutement : trois Poké Balls s'ouvrent, un candidat sort de
       chacune ; l'échange : les offres en hologramme au-dessus du
       terminal, Porygon à côté ;
     · le feu de camp : on s'assoit autour, la nuit tombe, le soin se
       voit ; la boutique : Kecleon derrière son étal ; le coffre qui
       s'ouvre dans un rayon d'or ; Porygon-Z qui raconte (un
       événement) ; le légendaire du sanctuaire qui s'éveille ;
     · après la victoire, l'équipe saute de joie ; le badge tourne
       au-dessus d'elle ; un nouveau secteur se découvre de haut.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { MonActor } from "../story/actors.js";
import { monH } from "./team.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const TAU = Math.PI * 2;
const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();
const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:0.6, flatShading:true}, o));

/* une Poké Ball dont le haut s'ouvre */
function ballProp(s = 0.32){
  const g = new THREE.Group(), lid = new THREE.Group();
  const top = new THREE.Mesh(new THREE.SphereGeometry(s, 18, 9, 0, TAU, 0, Math.PI / 2), std("#d8283a", {flatShading:false, roughness:0.35}));
  const bot = new THREE.Mesh(new THREE.SphereGeometry(s, 18, 9, 0, TAU, Math.PI / 2, Math.PI / 2), std("#f2f0ea", {flatShading:false, roughness:0.35}));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.01, s * 1.01, s * 0.14, 18), std("#1a1a1a"));
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.3, s * 0.12, 12).rotateX(Math.PI / 2).translate(0, 0, s * 0.98), std("#f2f0ea"));
  /* le couvercle pivote sur l'arrière */
  top.position.z = s; lid.position.set(0, 0, -s); lid.add(top);
  for(const p of [top, bot, band, btn]) p.castShadow = true;
  g.add(lid, bot, band, btn); g.userData.lid = lid;
  return g;
}
function chestProp(){
  const g = new THREE.Group(), lid = new THREE.Group();
  const wood = std("#8a5a2a"), gold = std("#ffcf4a", {metalness:0.5, roughness:0.35, emissive:"#5a3a00", emissiveIntensity:0.3});
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.85), wood); base.position.y = 0.35; base.castShadow = true;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1.3, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), wood); top.position.set(0, 0, 0.43); top.castShadow = true;
  const band1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.74, 0.9), gold); band1.position.y = 0.36;
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.08), gold); lock.position.set(0, 0.62, 0.45);
  lid.position.set(0, 0.7, -0.43); lid.add(top);
  g.add(base, band1, lock, lid); g.userData.lid = lid;
  return g;
}
function fireProp(){
  const g = new THREE.Group();
  const logM = std("#5a3a20");
  for(let k = 0; k < 4; k++){ const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6).rotateZ(Math.PI / 2), logM); l.rotation.y = k / 4 * Math.PI; l.position.y = 0.08; l.castShadow = true; g.add(l); }
  const stones = std("#6a6a6a");
  for(let k = 0; k < 9; k++){ const a = k / 9 * TAU, st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), stones); st.position.set(Math.cos(a) * 0.55, 0.06, Math.sin(a) * 0.55); g.add(st); }
  const flameM = new THREE.MeshBasicMaterial({color:"#ffb040", transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
  const flames = [];
  for(let k = 0; k < 3; k++){ const f = new THREE.Mesh(new THREE.ConeGeometry(0.22 - k * 0.05, 0.7 - k * 0.12, 7).translate(0, 0.35, 0), flameM.clone()); f.position.y = 0.1; g.add(f); flames.push(f); }
  flames[1].material.color.set("#ff7a2e"); flames[2].material.color.set("#fff3c4");
  const light = new THREE.PointLight("#ff9a4a", 0, 9, 1.5); light.position.y = 0.8; g.add(light);
  g.userData = {flames, light};
  return g;
}
function badgeProp(c){
  const g = new THREE.Group();
  const m = std(c, {metalness:0.7, roughness:0.25, emissive:c, emissiveIntensity:0.35, flatShading:true});
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 8).rotateX(Math.PI / 2), m);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 8).rotateX(Math.PI / 2), std("#ffffff", {metalness:0.6, roughness:0.2, emissive:"#ffffff", emissiveIntensity:0.25}));
  g.add(disc, inner);
  const rays = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.6, 7, 16, 1, true).translate(0, -3.5, 0), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:0.18, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
  g.add(rays); g.userData = {rays};
  return g;
}

export class XScenes {
  constructor(scene, game){ this.scene = scene; this.game = game; this.kind = null; this.objs = []; this.mons = []; this.C = new THREE.Vector3(); this.F = new THREE.Vector3(0, 0, -1); this.R = new THREE.Vector3(1, 0, 0); }
  sparks(){ return this.game.capture && this.game.capture.sparks; }
  add(o){ this.scene.add(o); this.objs.push(o); return o; }
  mon(id, h, o = {}){ preloadMon(id, !!o.shiny); const m = makeMon(id, !!o.shiny, this.scene, {height:h || monH(id), corrupt:false}); const r = {id, m, h:h || monH(id), pos:new THREE.Vector3(), yaw:0, born:this.t || 0}; this.mons.push(r); return r; }
  end(){
    for(const o of this.objs){ this.scene.remove(o); o.traverse(q=>{ if(q.geometry) q.geometry.dispose(); const M = q.material; if(M) (Array.isArray(M) ? M : [M]).forEach(m=>m.dispose()); }); }
    for(const r of this.mons) r.m.dispose();
    if(this.pz){ this.pz.dispose(); this.pz = null; }
    this.objs = []; this.mons = []; this.kind = null; this.p = null; this.night = 0;
  }
  /* une scène s'ouvre : on pose ce qu'il faut, au milieu du nœud */
  begin(kind, run, p, C, F, node, ground){
    this.end();
    this.kind = kind; this.p = p; this.run = run; this.node = node; this.ground = ground; this.t0 = this.t || 0;
    this.C.copy(C); this.F.copy(F).setY(0).normalize(); if(this.F.lengthSq() < 0.01) this.F.set(0, 0, -1); this.R.set(-this.F.z, 0, this.F.x);
    const at = (f, r, y = 0) => V1.copy(C).addScaledVector(this.F, f).addScaledVector(this.R, r).setY(ground(C.x + this.F.x * f + this.R.x * r, C.z + this.F.z * f + this.R.z * r) + y).clone();
    const face = pos => Math.atan2(-this.F.x, -this.F.z);         /* tourné vers l'équipe */
    this.at = at;
    if(kind === "enc"){
      const foes = (p.foes || []);
      if(p.kind === "fight"){
        foes.forEach((f, i)=>{ const r = this.mon(f.id); r.pos.copy(at(2.3, (i - (foes.length - 1) / 2) * 1.8)); r.yaw = face(); r.leap = true; r.delay = 0.35 + i * 0.25; });
      } else if(p.kind === "boss"){
        const f = foes[0]; if(f){ const r = this.mon(f.id, Math.min(3.2, monH(f.id) * 1.4)); r.pos.copy(at(2.8, 0)); r.yaw = face(); r.glitchIn = true; }
      } else {
        /* le dresseur pose ses Poké Balls devant lui */
        this.balls = foes.map((f, i)=>{ const b = this.add(ballProp(0.16)); b.position.copy(at(2.6, (i - (foes.length - 1) / 2) * 0.5, 0.16)); b.rotation.y = face(); return b; });
      }
    } else if(kind === "draft"){
      this.balls = (p.list || []).map((c, i, L)=>{ const b = this.add(ballProp(0.3)); b.position.copy(at(2.0, (i - (L.length - 1) / 2) * 1.9, 0.3)); b.rotation.y = face(); return b; });
      this.cands = (p.list || []).map((c, i, L)=>{ const r = this.mon(c.id, Math.min(1.8, monH(c.id))); r.pos.copy(at(2.0, (i - (L.length - 1) / 2) * 1.9, 0)); r.yaw = face(); r.delay = 0.5 + i * 0.38; r.fromBall = true; return r; });
    } else if(kind === "swap"){
      this.cands = (p.list || []).map((c, i, L)=>{ const r = this.mon(c.id, Math.min(1.6, monH(c.id))); r.pos.copy(at(2.4, (i - (L.length - 1) / 2) * 1.7, 0.6)); r.yaw = face(); r.holo = true; r.delay = 0.4 + i * 0.26; return r; });
      const pg = this.mon(137, 0.9); pg.pos.copy(at(1.2, -2.4)); pg.yaw = face();
    } else if(kind === "rest"){
      /* le feu, devant le Centre Pokémon ; on s'assoit autour */
      this.fire = this.add(fireProp()); this.fire.position.copy(at(-0.5, 0));
    } else if(kind === "shop"){
      const k = this.mon(352, 1.1); k.pos.copy(V1.copy(C).add(V2.set(1.75, 0, -0.2))); k.pos.y = ground(k.pos.x, k.pos.z); k.yaw = face();
    } else if(kind === "items"){
      this.chest = this.add(chestProp()); this.chest.position.copy(at(1.6, 0)); this.chest.rotation.y = face();
      this.ray = this.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 9, 16, 1, true).translate(0, 4.5, 0), new THREE.MeshBasicMaterial({color:"#ffd84a", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false})));
      this.ray.position.copy(this.chest.position);
      this.chestLight = this.add(new THREE.PointLight("#ffd84a", 0, 7, 1.5)); this.chestLight.position.copy(this.chest.position).add(V2.set(0, 1, 0));
    } else if(kind === "event"){
      this.pzA = {kind:"pz", mon:474, dir:0, anim:"idle", a0:0, loop:true, alpha:1, holo:true, born:0.7, hop:0, sink:0, talk:true, trem:0, yaw:face()};
      this.pz = new MonActor(this.scene, this.pzA); this.pzPos = at(1.8, 1.2, 0.4);
    } else if(kind === "legend" || kind === "sanctdone"){
      this.wake = kind === "legend";
    } else if(kind === "badge"){
      const L = p.leader || {}, c = (ref("arCol") || (()=>"#ffd84a"))(L.t || 1);
      this.badge = this.add(badgeProp(c)); this.badge.position.copy(at(0.6, 0, 3.4));
    }
  }
  /* où se tient chacun de l'équipe, pendant la scène */
  teamSpot(k, n, out){
    const kind = this.kind, C = this.C, F = this.F, R = this.R;
    if(kind === "rest"){
      const a = Math.PI + (k - (n - 1) / 2) * 0.75, fc = V2.copy(C).addScaledVector(F, -0.5);
      out.copy(fc).addScaledVector(F, Math.cos(a) * 1.5).addScaledVector(R, Math.sin(a) * 1.5);
      return {yaw:Math.atan2(fc.x - out.x, fc.z - out.z)};
    }
    out.copy(C).addScaledVector(F, -0.7 - Math.abs(k - (n - 1) / 2) * 0.25).addScaledVector(R, (k - (n - 1) / 2) * 1.25);
    /* la victoire, le badge, une recrue : on se tourne vers la caméra pour fêter ça */
    const cheer = kind === "loot" || kind === "badge" || kind === "sanctdone" || kind === "sector";
    return {yaw:cheer ? Math.atan2(-F.x, -F.z) : Math.atan2(F.x, F.z), cheer};
  }
  /* ---------- à chaque image ---------- */
  update(t, dt, cam, env, sector){
    this.t = t;
    if(!this.kind) return;
    const e = t - this.t0, calm = calmFx(), s = this.sparks(), p = this.p, kind = this.kind;
    for(const r of this.mons){
      const U = r.m.uniforms, k = e - (r.delay || 0);
      let pos = V1.copy(r.pos), vis = true, glitch = 0;
      if(r.leap){ if(k < 0) vis = false; else { const q = Math.min(1, k / 0.45); pos = V1.copy(r.pos).addScaledVector(this.F, -0.9 * (1 - q)); pos.y += Math.sin(Math.PI * q) * 1.1; if(!r.landed && q >= 1){ r.landed = true; if(s) s.burst(r.pos.clone().add(V2.set(0, 0.2, 0)), 14, ["#9fe07a", "#ffffff"], 1.6, 0.5, 1); } } }
      if(r.fromBall){ if(k < 0) vis = false; else { const q = ease(k / 0.5); r.m.scale = Math.max(0.02, q); glitch = (1 - q) * 0.6; pos = V1.copy(r.pos); pos.y += 0.35 * (1 - q); if(!r.popped){ r.popped = true; if(s) s.burst(r.pos.clone().add(V2.set(0, 0.5, 0)), 24, ["#ffffff", "#ffe9a8", "#5ce07a"], 2.4, 0.6, 1.2); } } }
      if(r.holo){ if(k < 0) vis = false; if(U.uTintC) U.uTintC.value.set(0.55, 0.9, 1.0, 0.45); if(U.uAlpha) U.uAlpha.value = 0.85; glitch = Math.max(glitch, k < 0.5 ? 1 - k * 2 : (!calm && Math.sin(t * 7 + r.id) > 0.97 ? 0.3 : 0)); pos = V1.copy(r.pos); pos.y += Math.sin(t * 1.6 + r.id) * 0.06; }
      if(r.glitchIn){ glitch = Math.max(glitch, Math.max(0, 1 - e / 1.4)); if(U.uTintC) U.uTintC.value.set(1, 0.24, 0.5, 0.25); }
      U.uGlitch.value = glitch;
      r.m.group.visible = vis;
      r.m.groundY = sector.heightAt(pos.x, pos.z);
      r.m.setAnim("idle");
      r.m.update(t, dt, pos, r.yaw, cam.position, env);
      r.head = (r.head || new THREE.Vector3()).set(pos.x, pos.y + r.h + 0.25, pos.z);
    }
    /* les Poké Balls : elles tremblent, puis s'ouvrent */
    if(this.balls) this.balls.forEach((b, i)=>{
      const lid = b.userData.lid, open = kind === "draft" ? Math.max(0, Math.min(1, (e - 0.3 - i * 0.38) / 0.25)) : 0;
      lid.rotation.x = -open * 1.9;
      b.rotation.z = kind === "draft" && open === 0 && !calm ? Math.sin(t * 22 + i) * 0.12 * (e > 0.05 ? 1 : 0) : 0;
    });
    if(this.fire){
      const U = this.fire.userData; const fl = calm ? 1 : 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
      U.flames.forEach((f, i)=>{ f.scale.set(1, fl * (1 + i * 0.05) + (calm ? 0 : Math.sin(t * 17 + i) * 0.08), 1); f.rotation.y = t * (1 + i); });
      U.light.intensity = 9 * fl;
      this.night = Math.min(1, e / 1.2);
      if(s && !calm && Math.random() < dt * 14) s.burst(this.fire.position.clone().add(V2.set(0, 0.5, 0)), 1, ["#ffb040", "#ff7a2e"], 0.4, 1.0, 2.2);
      /* le soin se voit : des étincelles vertes sur chacun */
      if(p && p.done === "heal" && !this.healed){ this.healed = true; this.healT = t; }
    }
    if(this.chest){
      const open = Math.max(0, Math.min(1, (e - 0.7) / 0.5));
      this.chest.userData.lid.rotation.x = -open * 1.7;
      if(!calm && open === 0 && e > 0.1) this.chest.rotation.z = Math.sin(t * 30) * 0.03; else this.chest.rotation.z = 0;
      this.ray.material.opacity = 0.22 * open; this.chestLight.intensity = 7 * open;
      if(open >= 1 && !this.burst){ this.burst = true; if(s) s.burst(this.chest.position.clone().add(V2.set(0, 0.9, 0)), 36, ["#ffd84a", "#ffffff"], 3, 0.9, 1.6); }
    }
    if(this.pz){
      this.pzA.talk = e < 4 || !!(p && p.res && e - (this.resT || (this.resT = e)) < 3);
      try { this.pz.update(this.pzA, {t}, this.pzPos, 0.04, t, dt, cam, env); } catch(err){}
    }
    if(this.badge){
      const k = ease(e / 1.0);
      this.badge.rotation.y = t * 1.6; this.badge.position.y = this.at(0.6, 0, 0).y + 2.2 + 1.2 * k + (calm ? 0 : Math.sin(t * 2) * 0.08);
      this.badge.scale.setScalar(0.2 + 0.8 * k);
      if(!this.burst && e > 1.0){ this.burst = true; if(s) s.burst(this.badge.position.clone(), 40, ["#ffd84a", "#ffffff"], 3.2, 1.0, 0.8); }
    }
    /* ce que le choix rapporte : de l'or, des soins, une blessure */
    const fx = p && p.fx;
    if(fx && fx !== this.fxSeen){
      this.fxSeen = fx;
      const at = this.C.clone().add(V2.set(0, 1.4, 0));
      if(s){ if(fx.bits > 0) s.burst(at, 40, ["#ffd84a", "#fff3c4"], 3, 1.0, 1.4);
        if(fx.heal > 0) s.burst(at, 36, ["#5ce07a", "#ffffff"], 2.4, 1.0, 1.6);
        if(fx.dmg) s.burst(at, 30, ["#ff3d7f", "#ffffff"], 3.4, 0.6, 0.6);
        if(fx.relic) s.burst(at, 30, ["#ffd84a", "#b48cff"], 2.8, 1.0, 1.2); }
    }
  }
  /* le légendaire du sanctuaire s'éveille : la dorure s'en va, il se lève */
  legend(N, t){
    if(!N || !N.mon || !this.wake) return;
    const k = Math.min(1, (t - this.t0) / 1.6), U = N.mon.uniforms;
    N.mon.frozen = false; N.awake = true;
    if(U.uTintC) U.uTintC.value.set(1, 0.85, 0.4, 0.45 * (1 - k));
    if(!this.roared && k > 0.5){ this.roared = true; if(N.mon.playOnce) N.mon.playOnce(N.mon.hasClip && N.mon.hasClip("attack2") ? "attack2" : "attack", 1); const s = this.sparks(); if(s) s.burst(N.monPos.clone().add(V2.set(0, 1.5, 0)), 40, ["#ffe48a", "#ffffff"], 3, 1, 1); }
  }
  /* la caméra de la scène : sur le sentier, un peu de haut, cadrée sur ce qui se passe */
  camera(cam, dt, camPos, camLook, ground){
    const C = this.C, kind = this.kind;
    /* le pupitre occupe la droite : on cadre le sujet un peu à gauche, un peu haut (les cartes sont en bas) */
    const g0 = ground(C.x, C.z);
    let want, look;
    if(kind === "sector"){
      want = V1.copy(C).addScaledVector(this.F, -9).addScaledVector(this.R, -1.5); want.y = g0 + 9;
      look = V2.copy(C).addScaledVector(this.F, 16).addScaledVector(this.R, 3); look.y = g0;
    } else {
      const cheer = kind === "loot" || kind === "badge" || kind === "sanctdone";
      want = V1.copy(C).addScaledVector(this.R, -0.9).addScaledVector(this.F, cheer ? -4.6 : -4.4); want.y = Math.max(ground(want.x, want.z) + 1.2, g0 + (kind === "badge" ? 2.6 : 2.2));
      look = V2.copy(C).addScaledVector(this.R, 1.15).addScaledVector(this.F, cheer ? 0.2 : 1.3); look.y = g0 + (kind === "badge" ? 1.6 : 0.35);
    }
    const k = Math.min(1, dt * 2.4);
    camPos.lerp(want, k); camLook.lerp(look, k);
    cam.position.copy(camPos); cam.lookAt(camLook);
  }
  /* par-dessus : le « ! » d'une rencontre */
  overlay(x, project, t){
    if(this.kind !== "enc") return;
    const e = t - this.t0;
    for(const r of this.mons){
      if(!r.leap || !r.head) continue;
      const k = e - (r.delay || 0) - 0.2; if(k < 0 || k > 1.4) continue;
      const q = project(V1.copy(r.head).add(V2.set(0, 0.35, 0))); if(!q) continue;
      x.globalAlpha = k > 1.1 ? (1.4 - k) / 0.3 : 1;
      x.font = `${Math.round(30 + Math.max(0, 0.2 - k) * 60)}px "Press Start 2P", monospace`; x.textAlign = "center"; x.textBaseline = "middle";
      x.lineWidth = 7; x.strokeStyle = "#000"; x.strokeText("!", q.x, q.y); x.fillStyle = "#ff3d7f"; x.fillText("!", q.x, q.y);
      x.globalAlpha = 1;
    }
  }
}
