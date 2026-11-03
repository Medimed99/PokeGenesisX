/* ============================================================
   L'EXPÉDITION EN 3D · L'ÉQUIPE QUI MARCHE
   Le premier Pokémon en état de se battre ouvre la marche (c'est lui
   qui ouvre aussi le combat) ; les autres le suivent à la file, sur
   ses pas. Un Pokémon K.O. suit quand même, en gris, translucide :
   il reste de l'équipe jusqu'à la fin du parcours.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { realHeight } from "../mon/sprites.js";

const G = () => window.PCG;
export const monH = id => Math.max(0.55, Math.min(2.2, realHeight(id)));

export class XTeam {
  constructor(scene){ this.scene = scene; this.recs = new Map(); this.trail = []; this.visible = true; }
  /* l'ordre du parcours : le meneur d'abord */
  members(run){
    const up = run.team.filter(m=>m.hp > 0), down = run.team.filter(m=>m.hp <= 0);
    return up.concat(down);
  }
  /* à l'arrivée : l'équipe en file derrière le meneur (vers le sud, d'où l'on vient) */
  reset(pos){ this.trail = []; for(let k = 0; k < 60; k++) this.trail.push(pos.clone().add(new THREE.Vector3(0, 0, k * 0.3))); for(const r of this.recs.values()) r.placed = false; }
  dispose(){ for(const r of this.recs.values()) r.m.dispose(); this.recs.clear(); }
  show(on){ this.visible = on; for(const r of this.recs.values()) r.m.group.visible = on; }
  /* lead : la position du meneur (pilotée) ; heading : sa direction ; speed : sa vitesse */
  /* le modèle d'un membre ; s'il a évolué, on le refait (et ça se voit) */
  rec(run, m, k, at, t){
    const key = m;               /* le membre lui-même : il garde son modèle en évoluant */
    let r = this.recs.get(key);
    const G0 = G(), S = G0 && G0.S;
    const shiny = !!(S && S.dex && S.dex[m.base || m.id] && S.dex[m.base || m.id].shiny);
    if(!r || r.id !== m.id){
      const evo = !!r;
      const from = r ? r.pos.clone() : at.clone(), placed = r ? r.placed : false, yaw = r ? r.yaw : 0;
      if(r) r.m.dispose();
      preloadMon(m.id, shiny);
      r = {id:m.id, m:makeMon(m.id, shiny, this.scene, {height:monH(m.id), corrupt:false}), pos:from, yaw, placed, h:monH(m.id), evoT:evo ? t : -9};
      this.recs.set(key, r);
      if(evo && this.sparks) this.sparks.burst(from.clone().add(new THREE.Vector3(0, r.h * 0.6, 0)), 36, ["#ffffff", "#ffe9a8", "#35f0d6"], 2.6, 0.9, 1.2);
    }
    return {key, r};
  }
  /* pendant une scène : chacun à sa place (spot), tourné comme elle le dit ; la joie fait sauter */
  place(run, spot, t, dt, cam, env, ground){
    const list = this.members(run), seen = new Set(), n = list.length, tgt = new THREE.Vector3();
    list.forEach((m, k)=>{
      const {key, r} = this.rec(run, m, k, tgt, t); seen.add(key);
      const o = spot(k, n, tgt) || {};
      if(!r.placed){ r.pos.copy(tgt); r.placed = true; }
      const prev = r.pos.clone();
      r.pos.lerp(tgt, Math.min(1, dt * 3)); r.pos.y = ground(r.pos.x, r.pos.z);
      const mv = prev.distanceTo(r.pos) / Math.max(0.001, dt);
      const want = mv > 0.3 ? Math.atan2(r.pos.x - prev.x, r.pos.z - prev.z) : (o.yaw !== undefined ? o.yaw : r.yaw);
      let d = want - r.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); r.yaw += d * Math.min(1, dt * 6);
      const ko = m.hp <= 0, M = r.m, U = M.uniforms;
      const calm = typeof window.calmFx === "function" && window.calmFx();
      M.lift = o.cheer && !ko && !calm ? Math.max(0, Math.sin(t * 7 - k * 0.9)) * 0.28 : 0;
      M.setAnim(mv > 0.3 ? "walk" : "idle");
      if(U.uTintC) U.uTintC.value.set(0.55, 0.58, 0.66, ko ? 0.7 : 0);
      if(U.uAlpha) U.uAlpha.value = ko ? 0.55 : 1;
      U.uFlash.value = t - r.evoT < 0.7 ? 0.9 * (1 - (t - r.evoT) / 0.7) : 0;
      M.groundY = r.pos.y; M.group.visible = this.visible;
      M.update(t, dt, r.pos, r.yaw, cam.position, env);
      r.head = (r.head || new THREE.Vector3()).set(r.pos.x, r.pos.y + r.h + 0.25, r.pos.z);
    });
    for(const [k, r] of this.recs) if(!seen.has(k)){ r.m.dispose(); this.recs.delete(k); }
  }
  update(run, lead, heading, speed, t, dt, cam, env, ground){
    const list = this.members(run), seen = new Set();
    /* la trace du meneur : un point tous les 30 cm */
    const last = this.trail[0];
    if(!last || last.distanceTo(lead) > 0.3){ this.trail.unshift(lead.clone()); if(this.trail.length > 140) this.trail.pop(); }
    list.forEach((m, k)=>{
      const {key, r} = this.rec(run, m, k, lead, t);
      seen.add(key);
      /* sa place : sur la trace, à 1,6 m de celui qui le précède (plus pour les grands) */
      let want;
      if(k === 0) want = lead;
      else {
        const dist = k * 1.7;
        let acc = 0; want = this.trail[this.trail.length - 1];
        for(let j = 1; j < this.trail.length; j++){ acc += this.trail[j - 1].distanceTo(this.trail[j]); if(acc >= dist){ want = this.trail[j]; break; } }
      }
      if(!r.placed){ r.pos.copy(want); r.placed = true; }
      const prev = r.pos.clone();
      r.pos.lerp(want, k === 0 ? 1 : Math.min(1, dt * 6));
      r.pos.y = ground(r.pos.x, r.pos.z);
      const mv = prev.distanceTo(r.pos) / Math.max(0.001, dt);
      if(k === 0) r.yaw = heading;
      else if(mv > 0.2) r.yaw = Math.atan2(r.pos.x - prev.x, r.pos.z - prev.z);
      const ko = m.hp <= 0, M = r.m, U = M.uniforms;
      M.setAnim((k === 0 ? speed : mv) > 0.4 ? (speed > 6 ? "run" : "walk") : "idle");
      if(U.uTintC) U.uTintC.value.set(0.55, 0.58, 0.66, ko ? 0.7 : 0);
      if(U.uAlpha) U.uAlpha.value = ko ? 0.55 : 1;
      M.lift = 0;
      U.uFlash.value = t - r.evoT < 0.7 ? 0.9 * (1 - (t - r.evoT) / 0.7) : 0;
      M.groundY = r.pos.y;
      M.group.visible = this.visible;
      M.update(t, dt, r.pos, r.yaw, cam.position, env);
      r.head = (r.head || new THREE.Vector3()).set(r.pos.x, r.pos.y + r.h + 0.25, r.pos.z);
      r.m_ = m;
    });
    for(const [k, r] of this.recs) if(!seen.has(k)){ r.m.dispose(); this.recs.delete(k); }
  }
  leadRec(run){ const list = this.members(run); const m = list[0]; if(!m) return null; return this.recs.get(m) || null; }
}
