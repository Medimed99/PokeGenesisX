/* ============================================================
   LA BRÈCHE EN 3D · L'ÉQUIPE, ET LES ENNEMIS À PART
   L'équipe : un vrai modèle animé par Pokémon, qui suit le chef de
   file sur son chemin exact (comme sur mobile), prend sa pose
   d'attaque quand il frappe, bondit et fonce quand son attaque est
   une ruée ou un bond. Éveillé, il passe en chromatique, cerclé d'or.
   Les élites, l'Alpha, les gardiens, Porygon-Z : de vrais modèles
   aussi (corrompus), animés un par un ; la horde ordinaire, elle,
   est instanciée (horde.js).
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { realHeight } from "../mon/sprites.js";
import { S, ref, col } from "./lib.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = new THREE.Vector3();

/* Porygon-Z flotte : sa taille et sa hauteur de vol (la visée et ses rayons en dépendent) */
export const PZ_H = 3.4;
export function pzLift(t){ return 1.05 + Math.sin(t * 1.7) * 0.2; }

export function teamHeight(id, lead){ return clamp(realHeight(id) * (lead ? 1.15 : 1), lead ? 0.95 : 0.7, lead ? 2.1 : 1.75); }

export class Team {
  constructor(scene){ this.scene = scene; this.recs = []; }
  rec(i, id, shiny){
    let r = this.recs[i];
    if(r && r.id === id && r.shiny === shiny) return r;
    if(r) r.m.dispose();
    const m = makeMon(id, shiny, this.scene, {height:teamHeight(id, i === 0)});
    m.uniforms.uPull && (m.uniforms.uPull.value = 0.4);
    r = this.recs[i] = {id, shiny, m, pose:null, busy:0, born:performance.now(), gold:null};
    /* éveillé : un anneau d'or au sol */
    return r;
  }
  /* pos : la place du Pokémon (mètres), heading : son orientation */
  update(R, dt, t, cam, ctx){
    const shown = ref("brShownId"), isShiny = ref("brIsShiny"), memberPos = ref("brMemberPos"), memberOff = ref("brMemberOff");
    const moving = !!(R.vx || R.vy);
    for(let i = 0; i < R.team.length; i++){
      const w = R.team[i], id = shown(w), r = this.rec(i, id, !!isShiny(w));
      const p0 = memberPos(R, i), p = memberOff ? memberOff(w, p0) : p0, lift = (p.z || 0) * S;
      let heading;
      /* le chef de file regarde où l'on vise ; les autres, devant eux, ou leur cible quand ils frappent */
      if(i === 0) heading = ctx.aimYaw !== undefined ? ctx.aimYaw : r.heading;
      else {
        const ahead = R.trail[Math.max(0, i * 11 - 5)];
        if(ahead && moving){ const dx = ahead.x - p0.x, dy = ahead.y - p0.y; if(dx * dx + dy * dy > 1) heading = Math.atan2(dx, dy); }
      }
      if(w.pose && w.pose.t < w.pose.len && w.lastAng !== undefined) heading = Math.atan2(Math.cos(w.lastAng), Math.sin(w.lastAng));
      if(w.dash && w.dash.ax !== undefined && (w.dash.ax || w.dash.ay)) heading = Math.atan2(w.dash.ax, w.dash.ay);
      if(heading === undefined) heading = r.heading === undefined ? 0 : r.heading;
      r.heading = heading;
      /* l'attaque : une nouvelle pose, l'animation d'attaque en entier */
      if(w.pose && w.pose !== r.pose){
        r.pose = w.pose;
        const ranged = w.pose.anim === "shoot";
        const clip = ranged && r.m.hasClip && r.m.hasClip("attack2") ? "attack2" : "attack";
        if(r.m.playOnce){ const len = r.m.playOnce(clip, 1.35); r.busy = t + Math.min(0.9, len); }
      }
      if(t >= r.busy){
        const fast = R.turbo > 0 || R.dodgeT > 0 || (w.dash && w.dash.k === "dash");
        r.m.setAnim(moving || (w.dash && w.dash.k !== "slam") ? (fast ? "run" : "walk") : "idle");
      }
      const U = r.m.uniforms;
      /* l'évolution : un éclair blanc ; touché : un voile rouge sur le chef de file ; invulnérable : il clignote */
      U.uFlash.value = R.evoFlash && R.evoFlash.w === w ? R.evoFlash.a : 0;
      U.uRed.value = i === 0 && R.hurt > 0 ? Math.min(0.55, R.hurt * 2) : 0;
      U.uAlpha.value = i === 0 && R.inv > 0 && !R.dodgeT && Math.floor(R.t * 20) % 2 ? 0.55 : 1;
      r.m.groundY = 0;
      r.m.update(t, dt, V.set(p.x * S, lift, p.y * S), heading, cam, ctx.env);
      r.lift = lift; r.x = p.x * S; r.z = p.y * S; r.h = r.m.drawH || teamHeight(id, i === 0);
      r.stage = w.stage;
    }
    while(this.recs.length > R.team.length){ const r = this.recs.pop(); r.m.dispose(); }
  }
  lead(){ return this.recs[0] || null; }
  dispose(){ for(const r of this.recs) r.m.dispose(); this.recs = []; }
}

/* ---------- élites, Alpha, gardiens, Porygon-Z ---------- */
export class Specials {
  constructor(scene){ this.scene = scene; this.recs = new Map(); this.seen = new Set(); }
  begin(){ this.seen.clear(); }
  /* f : l'ennemi du jeu mobile (un objet recyclé : on refait le modèle si l'espèce change) */
  show(f, R, dt, t, cam, env, yaw, h){
    let r = this.recs.get(f);
    const shiny = !!f.shiny, key = f.id + "|" + shiny + "|" + (f.pz ? 1 : 0) + (f.echo ? 1 : 0);
    if(r && r.key !== key){ r.m.dispose(); r = null; }
    if(!r){
      /* Porygon-Z et les échos des légendaires gardent leurs couleurs : ce ne sont pas des corrompus */
      const m = makeMon(f.id, shiny, this.scene, {height:h, corrupt:!f.pz && !f.echo && !shiny, occ:true});
      r = {key, m, pose:null, busy:0, t0:t};
      this.recs.set(f, r);
    }
    this.seen.add(f);
    const m = r.m, U = m.uniforms;
    if(f.pose && f.pose !== r.pose){ r.pose = f.pose; if(m.playOnce){ const len = m.playOnce(f.pose.anim === "shoot" && m.hasClip("attack2") ? "attack2" : "attack", 1.1); r.busy = t + Math.min(1.2, len); } }
    if(t >= r.busy) m.setAnim(f.stun > 0 || f.frz > 0 || f.tstop > 0 ? "idle" : f.pz ? "idle" : "walk");
    m.frozen = f.frz > 0 || f.tstop > 0;
    U.uFlash.value = f.flash > 0 ? 0.85 : 0;
    U.uAlpha.value = f.rise > 0 ? Math.max(0.08, 1 - f.rise) : 1;
    let gl = f.rise > 0 ? Math.min(1, f.rise * 1.4) : 0;
    /* l'apparition : Porygon-Z se projette dans la faille, l'écho se reconstitue */
    const age = t - r.t0;
    if((f.pz || f.echo) && age < 2.4) gl = Math.max(gl, 1 - age / 2.4);
    if(f.pz){
      if(f.ghost) gl = Math.max(gl, Math.min(0.8, f.ghost.t * 1.6));                  /* il vient de se téléporter */
      if(Math.sin(t * 3.1) + Math.sin(t * 5.3 + 1) > 1.82) gl = Math.max(gl, 0.35);  /* des sautes d'image, de temps en temps */
    }
    if(f.echo && Math.sin(t * 2.3 + f.x) + Math.sin(t * 3.7) > 1.9) gl = Math.max(gl, 0.25);
    if(f.copy && Math.sin(t * 4.1 + f.x * 0.1) > 0.94) gl = Math.max(gl, 0.4);
    U.uGlitch.value = gl;
    if(U.uTintC){
      const T = U.uTintC.value;
      if(f.frz > 0) T.set(0.7, 0.95, 1.1, 0.45);
      else if(f.tstop > 0) T.set(0.62, 0.88, 0.48, 0.3);
      else if(f.pz && f.p25) T.set(1.0, 0.22, 0.42, 0.22 + Math.sin(t * 9) * 0.08);   /* la surchauffe */
      else if(f.pz && f.conv){ const c = col(ref("brTypeCol") ? ref("brTypeCol")(f.conv) : "#35f0d6"); T.set(c.r, c.g, c.b, 0.22); }
      else if(f.copy) T.set(0.78, 0.47, 1.0, 0.38);                                    /* votre équipe, recrachée */
      else if(f.hunter) T.set(1.0, 0.18, 0.25, 0.18 + Math.max(0, Math.sin(t * 6)) * 0.22);
      else if(f.echo) T.set(1.0, 0.86, 0.45, 0.16);
      else T.set(0, 0, 0, 0);
    }
    m.groundY = 0;
    const sink = f.rise > 0 ? -f.rise * h * 0.9 : 0;
    m.lift = f.pz ? pzLift(t) : 0;
    m.update(t, dt, V.set(f.x * S, sink, f.y * S), yaw, cam, env);
    r.h = h;
    return r;
  }
  end(){
    for(const [f, r] of this.recs) if(!this.seen.has(f)){ r.m.dispose(); this.recs.delete(f); }
  }
  dispose(){ for(const r of this.recs.values()) r.m.dispose(); this.recs.clear(); }
}

/* ---------- les objets qui ne sont pas des Pokémon : pylônes, nids ---------- */
export class Props {
  constructor(scene){
    this.scene = scene; this.pylons = []; this.nests = []; this.np = 0; this.nn = 0;
    this.pylMat = new THREE.MeshStandardMaterial({color:"#2a0a2e", roughness:0.35, metalness:0.4, emissive:"#ff3d7f", emissiveIntensity:0.35, flatShading:true});
    this.coreMat = new THREE.MeshBasicMaterial({color:"#35f0d6"});
    this.nestMat = new THREE.MeshStandardMaterial({color:"#2a0b22", roughness:0.6, emissive:"#ff3d7f", emissiveIntensity:0.25, flatShading:true});
    this.eyeMat = new THREE.MeshBasicMaterial({color:"#ff3d7f"});
  }
  begin(){ this.np = 0; this.nn = 0; }
  pylon(f, t){
    let g = this.pylons[this.np];
    if(!g){
      g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0).scale(0.75, 2.2, 0.75), this.pylMat); body.position.y = 1.7; body.castShadow = true;
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0).scale(0.7, 2, 0.7), this.coreMat); core.position.y = 1.7;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.3, 6), this.pylMat); base.position.y = 0.15; base.castShadow = true;
      g.add(body, core, base); g.userData = {core, body};
      this.scene.add(g); this.pylons.push(g);
    }
    this.np++; g.visible = true;
    g.position.set(f.x * S, 0, f.y * S);
    g.userData.body.rotation.y = t * 0.8; g.userData.core.rotation.y = -t * 2.4;
    g.userData.core.material = f.flash > 0 ? this.eyeMat : this.coreMat;
    g.userData.body.position.y = 1.7 + Math.sin(t * 2.5 + f.x) * 0.12;
    return g;
  }
  nest(f, t){
    let g = this.nests[this.nn];
    if(!g){
      g = new THREE.Group();
      const geo = new THREE.IcosahedronGeometry(1.3, 2); const pa = geo.attributes.position;
      for(let i = 0; i < pa.count; i++){ const y = pa.getY(i); if(y < 0) pa.setY(i, y * 0.2); else { const k = 1 + Math.sin(pa.getX(i) * 5 + pa.getZ(i) * 3) * 0.12; pa.setX(i, pa.getX(i) * k); pa.setZ(i, pa.getZ(i) * k); } }
      geo.computeVertexNormals();
      const mound = new THREE.Mesh(geo, this.nestMat); mound.castShadow = true;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 10), this.eyeMat); eye.position.set(0, 0.95, 0.75);
      const shards = new THREE.Group();
      for(let k = 0; k < 5; k++){ const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), this.eyeMat); s.position.set(Math.cos(k * 1.26) * 1.7, 1.2 + (k % 2) * 0.4, Math.sin(k * 1.26) * 1.7); shards.add(s); }
      g.add(mound, eye, shards); g.userData = {mound, eye, shards};
      this.scene.add(g); this.nests.push(g);
    }
    this.nn++; g.visible = true;
    g.position.set(f.x * S, 0, f.y * S);
    const pul = 1 + Math.sin(t * 3 + f.x) * 0.06;
    g.userData.mound.scale.set(pul, 1 / pul, pul);
    g.userData.shards.rotation.y = t * 0.9;
    g.userData.eye.scale.setScalar(f.flash > 0 ? 1.4 : 1);
    return g;
  }
  end(){
    for(let i = this.np; i < this.pylons.length; i++) this.pylons[i].visible = false;
    for(let i = this.nn; i < this.nests.length; i++) this.nests[i].visible = false;
  }
}
export { preloadMon };
