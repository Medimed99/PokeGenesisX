/* ============================================================
   L'EXPÉDITION EN 3D · LE COMBAT, LÀ OÙ L'ON EST
   Le moteur de combat (40) et sa mise en scène (l'arène, 41) restent
   ceux du jeu mobile : l'arène tourne, cachée, et garde l'horloge
   (qui entre, qui frappe, quand le coup porte, qui tombe). Ici, on
   lit son état à chaque image et on le joue en volume, au milieu du
   nœud où l'équipe s'est arrêtée — dans les hautes herbes, devant le
   dresseur, sur l'estrade du Champion :
     · les deux champions face à face, les réserves derrière eux ;
     · l'élan d'un coup au contact, le recul de celui qui le reçoit,
       l'esquive, le saut de la victoire, le K.O. qui se défait ;
     · chaque type frappe à sa manière : un rayon, un jet, un tir en
       cloche, une onde au sol, la foudre d'en haut, des anneaux
       psychiques, des feuilles, des éclats, des étoiles, des flammèches ;
     · les chiffres, les noms des capacités, la carte d'un gardien ;
     · le noyau de la couche (le dernier combat) : la couche s'assombrit,
       des éclats de cristal tournent autour de l'arène, un sceau magenta
       sous le gardien ; chaque signature liée entre par une colonne de
       lumière ; la caméra tourne autour de lui à son entrée ; vaincu,
       tout éclate en lumière.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { monH } from "./team.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();

export class XArena {
  constructor(scene, game){
    this.scene = scene; this.game = game; this.recs = new Map(); this.fx = []; this.popSeen = new WeakSet(); this.pops = [];
    /* la mise en place (le raid les change : un boss immense, plus loin) */
    this.o = {allyD:2.0, foeD:2.0, side:1.05, bossH:null};
    this.C = new THREE.Vector3(); this.F = new THREE.Vector3(0, 0, -1); this.R = new THREE.Vector3(1, 0, 0);
    /* les volumes des effets, prêts d'avance */
    this.beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).rotateX(Math.PI / 2);
    this.ballGeo = new THREE.IcosahedronGeometry(1, 1);
    this.ringGeo = new THREE.TorusGeometry(1, 0.06, 6, 40);
    this.flatRing = new THREE.RingGeometry(0.8, 1, 40).rotateX(-Math.PI / 2);
    this.coneGeo = new THREE.ConeGeometry(0.22, 1, 5).translate(0, 0.5, 0);
    this.shardGeo = new THREE.OctahedronGeometry(1, 0);
  }
  sparks(){ return this.game.capture && this.game.capture.sparks; }
  /* ---------- le noyau : éclats qui tournent, sceau, colonnes de lumière ---------- */
  coreBuild(){
    if(!this.coreG){
      const g = this.coreG = new THREE.Group(); this.scene.add(g);
      const N = 40;
      this.shardM = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.28, 0).scale(1, 1.7, 1), new THREE.MeshStandardMaterial({color:"#ff3d7f", emissive:"#ff3d7f", emissiveIntensity:0.9, flatShading:true, transparent:true, opacity:0.92}), N);
      this.shardM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.shardM.frustumCulled = false; g.add(this.shardM);
      this.shards = []; for(let i = 0; i < N; i++) this.shards.push({a:Math.random() * Math.PI * 2, r:4.6 + Math.random() * 3, y:0.6 + Math.random() * 3.4, s:0.5 + Math.random() * 1.1, sp:(Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.25), ph:Math.random() * 6, v:new THREE.Vector3(), p:new THREE.Vector3()});
      this.sigil = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 6, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, opacity:0.7, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
      const inner = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.78, 6, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 6), this.sigil.material); this.sigil.add(inner);
      g.add(this.sigil);
      this.coreLight = new THREE.PointLight("#ff3d7f", 6, 14, 1.4); g.add(this.coreLight);
      this.colGeo = new THREE.CylinderGeometry(0.55, 0.9, 9, 18, 1, true).translate(0, 4.5, 0);
      this.cM = new THREE.Matrix4(); this.cQ = new THREE.Quaternion(); this.cE = new THREE.Euler(); this.cS = new THREE.Vector3();
    }
    this.coreG.visible = true;
    for(const q of this.shards) q.fall = false;
  }
  coreUpdate(t, dt, T){
    const AR = this.AR, calm = calmFx(), s = this.sparks(), C = this.C;
    const ff = [...AR.act.values()].find(a=>a.side === "foe" && a.role === "front"), fr = ff && this.recs.get(ff.f);
    /* la victoire : tout éclate en lumière */
    if(AR.win && AR.win.v && !this.coreWin){
      this.coreWin = t;
      if(s) s.burst(fr ? this.chest(fr).clone() : C.clone().add(V1.set(0, 1.5, 0)), 80, ["#ffffff", "#ffe9a8", "#ff9ac0", "#35f0d6"], 6, 1.2, 0.8);
      for(const q of this.shards){ q.fall = true; q.v.set((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4); }
    }
    const M = this.cM, Q = this.cQ, E = this.cE, S1 = this.cS;
    const won = this.coreWin ? t - this.coreWin : 0;
    this.shards.forEach((q, i)=>{
      if(q.fall){ q.v.y -= 6 * dt; q.p.addScaledVector(q.v, dt); }
      else { q.a += q.sp * dt * (calm ? 0.4 : 1); q.p.set(C.x + Math.cos(q.a) * q.r, this.ground(C.x, C.z) + q.y + (calm ? 0 : Math.sin(t * 1.3 + q.ph) * 0.25), C.z + Math.sin(q.a) * q.r); }
      const sc = q.s * (q.fall ? Math.max(0, 1 - won / 1.6) : 1);
      M.compose(q.p, Q.setFromEuler(E.set(t * 0.7 + q.ph, t * 0.5 + i, 0)), S1.setScalar(Math.max(0.001, sc))); this.shardM.setMatrixAt(i, M);
    });
    this.shardM.instanceMatrix.needsUpdate = true;
    /* le sceau, sous le gardien en jeu */
    this.sigil.visible = !!fr && !this.coreWin;
    if(fr){ this.sigil.position.set(fr.pos.x, this.ground(fr.pos.x, fr.pos.z) + 0.05, fr.pos.z); this.sigil.rotation.y = t * 0.6; this.sigil.scale.setScalar(Math.max(1, fr.h * 0.8) * (calm ? 1 : 1 + 0.04 * Math.sin(t * 4))); }
    this.coreLight.position.copy(C).add(V1.set(0, 3, 0)); this.coreLight.intensity = this.coreWin ? Math.max(0, 14 * (1 - won / 1.2)) : 5 + (calm ? 0 : Math.sin(t * 3) * 1.5);
    this.coreLight.color.set(this.coreWin ? "#ffffff" : "#ff3d7f");
    /* chaque signature liée entre par une colonne de lumière ; elle sort en éclats */
    for(const a of AR.act.values()){
      if(a.side !== "foe") continue;
      if(a.enter && !this.coreSeen.has(a)){
        this.coreSeen.add(a); const at = this.home(a, new THREE.Vector3());
        const m = new THREE.Mesh(this.colGeo, new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
        m.position.set(at.x, this.ground(at.x, at.z), at.z); this.scene.add(m); this.cols.push({m, T0:a.enter.t0});
      }
      if(a.koT && !this.coreKo.has(a)){ this.coreKo.add(a); const r = this.recs.get(a.f); if(r && s) s.burst(this.chest(r).clone(), 50, ["#ff3d7f", "#ffffff", "#b48cff"], 4.5, 0.9, 0.6); }
    }
    for(let i = this.cols.length - 1; i >= 0; i--){
      const c = this.cols[i], k = (T - c.T0) / 1100;
      if(k > 1){ this.scene.remove(c.m); c.m.material.dispose(); this.cols.splice(i, 1); continue; }
      c.m.material.opacity = k < 0 ? 0 : Math.sin(Math.PI * k) * 0.55; c.m.scale.set(1 - k * 0.4, 1, 1 - k * 0.4);
    }
  }
  /* le cadre du combat : le centre du nœud, et vers où l'on regarde (le nord) */
  /* fwd : d'où vient l'équipe (le sentier) vers le nœud ; la caméra se place sur le sentier, là où rien ne pousse */
  begin(center, ground, fwd, core){
    this.C.copy(center); this.ground = ground; this.on = true; this.B = null; this.lastCur = null;
    this.core = !!core; this.coreWin = 0; this.coreSeen = new WeakSet(); this.coreKo = new WeakSet(); this.cols = [];
    if(this.core) this.coreBuild();
    if(fwd && fwd.lengthSq() > 0.01) this.F.copy(fwd).setY(0).normalize(); else this.F.set(0, 0, -1);
    this.R.set(-this.F.z, 0, this.F.x);
    this.camPos = null;
  }
  end(){
    this.on = false;
    if(this.coreG){ this.coreG.visible = false; for(const c of this.cols || []){ this.scene.remove(c.m); c.m.material.dispose(); } this.cols = []; }
    for(const r of this.recs.values()) r.m.dispose();
    this.recs.clear();
    for(const f of this.fx) this.killFx(f);
    this.fx = []; this.pops = [];
  }
  /* les places : champion au centre de son côté, réserves derrière */
  home(a, out){
    const AR = this.AR, side = a.side === "ally" ? -1 : 1;
    if(a.role === "front") return out.copy(this.C).addScaledVector(this.R, this.o.side * side).addScaledVector(this.F, (side > 0 ? this.o.foeD : this.o.allyD) * side);
    let k = 0; for(const o of AR.act.values()){ if(o === a) break; if(o.side === a.side && o.role === "bench") k++; }
    return out.copy(this.C).addScaledVector(this.R, (3.4 + k * 1.0) * side).addScaledVector(this.F, (1.4 + k * 0.5) * side);
  }
  chest(r){ return V3.copy(r.pos).add(V1.set(0, r.h * 0.55, 0)); }
  rec(a){
    let r = this.recs.get(a.f);
    if(r) return r;
    const B = this.B, boss = a.side === "foe" && B && B.stage === "boss";
    const h = boss && this.o.bossH ? this.o.bossH(a.f.id) : monH(a.f.id) * (boss ? 1.35 : 1);
    preloadMon(a.f.id, a.f.shiny);
    r = {a, m:makeMon(a.f.id, a.f.shiny, this.scene, {height:h, corrupt:false}), h, pos:new THREE.Vector3(), yaw:0, lastPose:-1, lastGlow:-1, mvRef:null, mvFrom:new THREE.Vector3(), placed:false};
    this.recs.set(a.f, r);
    return r;
  }
  /* ---------- à chaque image ---------- */
  update(t, dt, cam, env){
    const AR = ref("AR"), B = ref("BATTLE");
    if(!AR || !B || AR.b !== B) return false;
    if(this.B !== B){ for(const r of this.recs.values()) r.m.dispose(); this.recs.clear(); this.B = B; this.lastCur = null; this.pops = []; }
    this.AR = AR;
    const T = AR.t, live = new Set();
    const fa = [...AR.act.values()].find(a=>a.side === "ally" && a.role === "front"), ff = [...AR.act.values()].find(a=>a.side === "foe" && a.role === "front");
    for(const a of AR.act.values()){
      const r = this.rec(a), m = r.m, U = m.uniforms;
      live.add(a.f);
      if(a.role === "gone"){ m.group.visible = false; continue; }
      const side = a.side === "ally" ? -1 : 1;
      const home = this.home(a, V2.set(0, 0, 0)).clone();
      const pos = home.clone();
      let vis = true, glitch = 0;
      /* l'entrée : chacun arrive de son côté */
      if(a.enter){
        if(T < a.enter.t0) vis = false;
        const p = ease((T - a.enter.t0) / a.enter.dur);
        pos.addScaledVector(this.R, side * 3.2 * (1 - p)).addScaledVector(this.F, side * 2.4 * (1 - p));
        glitch = Math.max(glitch, (1 - p) * 0.8);
      }
      /* un changement de place (la relève, l'échange) */
      if(a.mv){
        if(r.mvRef !== a.mv){ r.mvRef = a.mv; r.mvFrom.copy(r.placed ? r.pos : home); }
        const p = ease((T - a.mv.t0) / a.mv.dur);
        pos.lerpVectors(r.mvFrom, home, p);
      }
      /* l'élan d'un coup au contact */
      const other = a.side === "ally" ? ff : fa, oR = other && this.recs.get(other.f);
      if(a.dash){
        const d = a.dash, tt = T - d.t0;
        let p = tt < d.imp ? Math.pow(Math.max(0, Math.min(1, tt / d.imp)), 2.2) : 1 - ease((tt - d.imp - (d.hs || 0)) / 260);
        if(tt > d.imp + (d.hs || 0) + 260) p = 0;
        if(oR){ const tgt = oR.pos.clone().sub(home); const L = tgt.length(); tgt.multiplyScalar(Math.max(0, L - 1.0 - (oR.h + r.h) * 0.18) / Math.max(0.001, L)); pos.addScaledVector(tgt, p); }
      }
      /* le recul d'un coup reçu, l'écart d'une esquive, le saut de la victoire */
      const kb = Math.exp(-(T - a.hurtT) / 95);
      if(kb > 0.02) pos.addScaledVector(this.F, side * kb * 0.45);
      const dg = T - a.dodgeT;
      if(dg >= 0 && dg < 320) pos.addScaledVector(this.R, side * Math.sin(dg / 320 * Math.PI) * 0.8);
      let lift = 0;
      const hp = T - a.hopT; if(hp >= 0 && hp < 380) lift = Math.sin(hp / 380 * Math.PI) * 0.55;
      /* K.O. : il se défait en pixels et s'enfonce */
      if(a.koT){ const k = Math.min(1, (T - a.koT) / 520); glitch = Math.max(glitch, k); pos.y -= k * 0.25; }
      pos.y = this.ground(pos.x, pos.z) + lift + (a.koT ? -Math.min(1, (T - a.koT) / 520) * 0.25 : 0);
      /* il regarde son adversaire */
      if(oR) r.yaw = Math.atan2(oR.pos.x - pos.x, oR.pos.z - pos.z);
      else r.yaw = side < 0 ? Math.PI : 0;
      /* les poses du jeu mobile : l'attaque, le tir, la douleur */
      if(a.pose && a.pose.t0 !== r.lastPose){
        r.lastPose = a.pose.t0;
        const clip = a.pose.anim === "shoot" ? (m.hasClip && m.hasClip("attack2") ? "attack2" : "attack") : a.pose.anim === "hurt" ? "hurt" : "attack";
        if(m.playOnce && (!m.hasClip || m.hasClip(clip) || clip === "attack")) m.playOnce(clip, clip === "hurt" ? 1.6 : 1.3);
      }
      if(!a.pose || T - a.pose.t0 > a.pose.len + 200) m.setAnim(AR.win && AR.win.v && a.side === "ally" ? "idle" : "idle");
      /* l'éclat d'un coup, la lueur d'un effet */
      U.uFlash.value = T - a.flashT < 110 ? 0.85 : 0;
      if(a.glow && a.glow.t !== r.lastGlow){ r.lastGlow = a.glow.t; const s = this.sparks(); if(s) s.burst(this.chest(r).clone(), 16, [a.glow.c, "#ffffff"], 1.6, 0.7, 1.4); }
      U.uGlitch.value = glitch;
      if(U.uAlpha) U.uAlpha.value = a.role === "bench" ? 0.92 : 1;
      m.group.visible = vis;
      m.groundY = this.ground(pos.x, pos.z);
      r.pos.copy(pos); r.placed = true; r.vis = vis;
      m.update(t, dt, pos, r.yaw, cam.position, env);
      r.head = (r.head || new THREE.Vector3()).set(pos.x, pos.y + r.h + 0.3, pos.z);
    }
    for(const [f, r] of this.recs) if(!live.has(f)){ r.m.dispose(); this.recs.delete(f); }
    this.attacks(T, dt);
    if(this.core && this.coreG) this.coreUpdate(t, dt, T);
    return true;
  }
  /* ---------- les coups : chaque type a sa manière ---------- */
  attacks(T, dt){
    const AR = this.AR, cur = AR.cur;
    if(cur && cur !== this.lastCur && T >= cur.T0){
      this.lastCur = cur;
      const A = this.recs.get(cur.att), D = this.recs.get(cur.def);
      if(A && D){
        const c = (ref("arCol") || (()=>"#ffffff"))(cur.mv.type);
        const f = {cur, kind:cur.mv.util ? "util" : cur.kind, c, A, D, objs:[], hitDone:false, T0:cur.T0, imp:cur.imp};
        this.spawn(f);
        this.fx.push(f);
      }
    }
    const s = this.sparks();
    for(let i = this.fx.length - 1; i >= 0; i--){
      const f = this.fx[i], k = (T - f.T0) / f.imp;
      const from = this.chest(f.A).clone(), to = this.chest(f.D).clone();
      this.step(f, k, from, to, T);
      if(k >= 1 && !f.hitDone){
        f.hitDone = true;
        if(!f.cur.miss && f.kind !== "util" && s){ s.burst(to, f.cur.crit ? 34 : 20, [f.c, "#ffffff"], f.cur.crit ? 4 : 2.8, 0.6, 0.7); }
      }
      if(k > 1.8){ this.killFx(f); this.fx.splice(i, 1); }
    }
  }
  mesh(geo, c, o = 0.9){ const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:o, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})); m.frustumCulled = false; this.scene.add(m); return m; }
  killFx(f){ for(const o of f.objs){ this.scene.remove(o); o.material.dispose(); } f.objs = []; }
  spawn(f){
    const k = f.kind, c = f.c;
    if(k === "beam"){ f.objs.push(this.mesh(this.beamGeo, c, 0.85), this.mesh(this.beamGeo, "#ffffff", 0.7)); }
    else if(k === "lob" || k === "wisp"){ const n = k === "wisp" ? 3 : 1; for(let i = 0; i < n; i++) f.objs.push(this.mesh(this.ballGeo, c, 0.9)); }
    else if(k === "ground"){ f.objs.push(this.mesh(this.flatRing, c, 0.9)); for(let i = 0; i < 4; i++) f.objs.push(this.mesh(this.coneGeo, c, 0.9)); }
    else if(k === "sky"){ f.objs.push(this.mesh(this.beamGeo, "#ffffff", 0.95), this.mesh(this.beamGeo, c, 0.7)); }
    else if(k === "mind"){ for(let i = 0; i < 3; i++) f.objs.push(this.mesh(this.ringGeo, c, 0.9)); }
    else if(k === "leaf" || k === "shard" || k === "star" || k === "blade"){ for(let i = 0; i < (k === "blade" ? 2 : 5); i++) f.objs.push(this.mesh(k === "blade" ? this.ringGeo : this.shardGeo, i % 2 && k !== "blade" ? "#ffffff" : c, 0.95)); }
    else if(k === "stream"){ f.streams = 0; }
    else if(k === "util"){ const s = this.sparks(); if(s) s.burst(this.chest(f.A).clone(), 18, [c, "#ffffff"], 1.4, 0.8, 1.6); f.objs.push(this.mesh(this.flatRing, c, 0.8)); }
    for(const o of f.objs) o.visible = false;
  }
  step(f, k, from, to, T){
    const calm = calmFx(), c = f.c, O = f.objs, s = this.sparks();
    const dir = V1.subVectors(to, from), L = dir.length();
    if(f.kind === "beam"){
      const on = k > 0.2 && k < 1.35, w = on ? (k < 1 ? 0.12 + k * 0.1 : 0.22 * (1 - (k - 1) / 0.35)) : 0;
      for(let j = 0; j < 2; j++){ const o = O[j]; o.visible = on; if(!on) continue;
        const reach = Math.min(1, (k - 0.2) / 0.35);
        o.position.copy(from).addScaledVector(dir, reach * 0.5); o.lookAt(V2.copy(from).add(dir));
        o.scale.set(w * (j ? 0.45 : 1), w * (j ? 0.45 : 1), L * reach); }
    } else if(f.kind === "lob" || f.kind === "wisp"){
      O.forEach((o, j)=>{ const kk = k - j * 0.12; o.visible = kk > 0.05 && kk < 1;
        if(!o.visible) return; const p = Math.max(0, Math.min(1, kk));
        o.position.copy(from).addScaledVector(dir, p); o.position.y += Math.sin(Math.PI * p) * (f.kind === "lob" ? 1.8 : 0.5) + (f.kind === "wisp" && !calm ? Math.sin(T / 60 + j) * 0.15 : 0);
        o.scale.setScalar(f.kind === "lob" ? 0.24 : 0.16); });
    } else if(f.kind === "ground"){
      const ring = O[0], g0 = V2.copy(from); g0.y = this.ground(from.x, from.z) + 0.05;
      ring.visible = k > 0 && k < 1.1; if(ring.visible){ ring.position.copy(g0).addScaledVector(V3.subVectors(to, from).setY(0), Math.min(1, k)); ring.position.y = this.ground(ring.position.x, ring.position.z) + 0.06; ring.scale.setScalar(0.6 + k * 0.8); ring.material.opacity = 0.9 * (1 - Math.max(0, k - 0.8) * 3); }
      for(let j = 1; j < O.length; j++){ const o = O[j], kk = (k - 0.9) / 0.5; o.visible = kk > 0 && kk < 1;
        if(!o.visible) continue; const a = j / 4 * Math.PI * 2; o.position.set(to.x + Math.cos(a) * 0.5, this.ground(to.x, to.z), to.z + Math.sin(a) * 0.5);
        o.scale.set(1, Math.sin(Math.PI * kk) * 1.3 + 0.01, 1); }
    } else if(f.kind === "sky"){
      const on = k > 0.65 && k < 1.25;
      for(let j = 0; j < 2; j++){ const o = O[j]; o.visible = on; if(!on) continue;
        const top = V2.copy(to).add(V3.set((Math.random() - 0.5) * (calm ? 0 : 0.4), 9, 0));
        o.position.lerpVectors(top, to, 0.5); o.lookAt(to); o.scale.set(j ? 0.18 : 0.07, j ? 0.18 : 0.07, top.distanceTo(to)); }
    } else if(f.kind === "mind"){
      O.forEach((o, j)=>{ const kk = (k - 0.25 - j * 0.12) / 0.8; o.visible = kk > 0 && kk < 1; if(!o.visible) return;
        o.position.copy(to); o.rotation.set(Math.PI / 2 + j * 0.5, T / 400 + j, 0); o.scale.setScalar(0.3 + kk * 1.4); o.material.opacity = 0.9 * (1 - kk); });
    } else if(f.kind === "leaf" || f.kind === "shard" || f.kind === "star"){
      O.forEach((o, j)=>{ const kk = (k - j * 0.08) / 0.9; o.visible = kk > 0 && kk < 1; if(!o.visible) return;
        const side = V3.set(-dir.z, 0, dir.x).normalize();
        o.position.copy(from).addScaledVector(dir, kk).addScaledVector(side, Math.sin(kk * Math.PI * 2 + j) * (f.kind === "leaf" ? 0.5 : 0.2)); o.position.y += Math.sin(kk * Math.PI) * 0.3;
        o.rotation.set(T / 90 + j, T / 70, 0); o.scale.setScalar(f.kind === "star" ? 0.11 : 0.09); });
    } else if(f.kind === "blade"){
      O.forEach((o, j)=>{ const kk = (k - 0.85 - j * 0.08) / 0.35; o.visible = kk > 0 && kk < 1; if(!o.visible) return;
        o.position.copy(to); o.lookAt(from); o.rotation.z += j * 1.2 + kk * 2; o.scale.set(0.9, 0.9 * (1 - kk * 0.5), 0.9); o.material.opacity = 0.95 * (1 - kk); });
    } else if(f.kind === "stream"){
      if(s){ while(f.streams < 3 && k > 0.12 + f.streams * 0.22){ s.stream(from.clone(), to.clone(), 26, c); f.streams++; } }
    } else if(f.kind === "util"){
      const o = O[0]; if(o){ const kk = k / 1.2; o.visible = kk > 0 && kk < 1; if(o.visible){ o.position.copy(f.A.pos); o.position.y += 0.05; o.scale.setScalar(0.5 + kk * 1.6); o.material.opacity = 0.8 * (1 - kk); } }
    }
  }
  /* ---------- la caméra du combat : derrière ton champion, un peu de côté ---------- */
  camera(cam, dt, t, camPos, camLook){
    const AR = this.AR, C = this.C;
    /* au plus près des deux champions : un Salamèche de niveau 5 se voit aussi bien qu'un Onix */
    let H = 0.8; for(const r of this.recs.values()) if(r.a.role === "front" && r.vis) H = Math.max(H, r.h);
    H = Math.min(3, H);
    const g0 = this.ground(C.x, C.z);
    const want = V1.copy(C).addScaledVector(this.R, -1.2 - H * 0.3).addScaledVector(this.F, -(3.6 + H * 1.9)); want.y = Math.max(this.ground(want.x, want.z) + 1.0, g0 + 1.5 + H * 0.95);
    const look = V2.copy(C).addScaledVector(this.R, 0.2).addScaledVector(this.F, 0.5); look.y = g0 + 0.35 + H * 0.45;
    /* le noyau : à son entrée, la caméra tourne lentement autour du gardien, depuis le bas */
    if(this.core && AR){
      const k = Math.max(0, Math.min(1, AR.t / 3200));
      if(k < 1){
        const ff = [...AR.act.values()].find(a=>a.side === "foe" && a.role === "front"), fr = ff && this.recs.get(ff.f);
        const fc = fr ? fr.pos.clone() : C.clone().addScaledVector(this.F, 2);
        const ang = (1 - ease(k)) * 1.4, d = 5.2 + H * 0.6;
        const dirx = -this.F.x * Math.cos(ang) + this.R.x * Math.sin(ang), dirz = -this.F.z * Math.cos(ang) + this.R.z * Math.sin(ang);
        const orb = new THREE.Vector3(fc.x + dirx * d, g0 + 0.9 + H * 0.4, fc.z + dirz * d);
        const w = 1 - ease(Math.max(0, (k - 0.6) / 0.4));
        want.lerp(orb, w); look.lerp(new THREE.Vector3(fc.x, g0 + H * 0.75 + 0.5, fc.z), w);
      }
    }
    /* un critique, un coup super efficace : on se resserre sur la cible */
    if(AR && AR.zoom > 0.05 && AR.cur){ const D = this.recs.get(AR.cur.def); if(D){ want.lerp(V3.copy(D.pos).add(new THREE.Vector3(-2.2, 1.6, 3.2)), Math.min(0.35, AR.zoom * 0.35)); } }
    const k = Math.min(1, dt * 2.6);
    camPos.lerp(want, k); camLook.lerp(look, k);
    cam.position.copy(camPos);
    const calm = calmFx(), sh = calm ? 0 : Math.min(0.25, (AR ? AR.shake : 0) * 0.012);
    if(sh > 0.002) cam.position.add(V3.set((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0));
    cam.lookAt(camLook);
  }
  /* ---------- par-dessus : les chiffres, les noms des coups, la carte du gardien ---------- */
  overlay(x, W, H, project){
    const AR = this.AR; if(!AR) return;
    const T = AR.t, arPos = ref("arPos");
    /* les chiffres : on retrouve à qui ils appartiennent (le plus proche, sur le dessin mobile) */
    for(const p of AR.pops || []){
      if(this.popSeen.has(p)) continue;
      this.popSeen.add(p);
      let best = null, bd = 1e9;
      if(arPos) for(const a of AR.act.values()){ if(a.role === "gone") continue; const q = arPos(a), d = Math.hypot(q.x - p.x, q.y - 20 - p.y); if(d < bd){ bd = d; best = a; } }
      const r = best && this.recs.get(best.f);
      if(r) this.pops.push({r, txt:p.txt, c:p.c, size:p.size, big:p.big, t0:p.t0, dx:(Math.random() - 0.5) * 16});
    }
    x.textAlign = "center"; x.textBaseline = "middle";
    for(let i = this.pops.length - 1; i >= 0; i--){
      const p = this.pops[i], k = (T - p.t0) / 1000;
      if(k >= 1){ this.pops.splice(i, 1); continue; }
      if(k < 0) continue;
      const q = project(p.r.head); if(!q) continue;
      const sc = k < 0.14 ? 0.6 + k / 0.14 * 0.75 : 1.35 - Math.min(1, (k - 0.14) / 0.2) * 0.35;
      const size = Math.round((p.size || 10) * 2.1 * sc);
      x.font = `${size}px "Press Start 2P", monospace`;
      x.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      const y = q.y - ease(k) * 46;
      x.lineWidth = 6; x.strokeStyle = "rgba(0,0,0,.85)"; x.strokeText(p.txt, q.x + p.dx, y);
      x.fillStyle = p.c || "#ffffff"; x.fillText(p.txt, q.x + p.dx, y); x.globalAlpha = 1;
    }
    /* le nom de la capacité, au-dessus de celui qui la lance */
    for(const cl of AR.calls || []){
      const k = (T - cl.t0) / 900; if(k < 0 || k >= 1) continue;
      const a = [...AR.act.values()].find(o=>o.side === cl.side && o.role === "front"), r = a && this.recs.get(a.f); if(!r) continue;
      const q = project(V1.copy(r.head).add(V2.set(0, 0.45, 0))); if(!q) continue;
      x.font = `13px "Press Start 2P", monospace`;
      const w = x.measureText(cl.txt).width + 22;
      x.globalAlpha = k < 0.1 ? k / 0.1 : k > 0.8 ? (1 - k) / 0.2 : 1;
      x.fillStyle = "rgba(5,9,18,.88)"; x.fillRect(q.x - w / 2, q.y - 15 - k * 10, w, 30);
      x.fillStyle = cl.c; x.fillRect(q.x - w / 2, q.y - 15 - k * 10, 4, 30);
      x.fillStyle = "#ffffff"; x.fillText(cl.txt, q.x + 2, q.y - k * 10 + 1); x.globalAlpha = 1;
    }
    /* la carte d'un gardien, d'un Champion, d'une phase */
    const c = AR.card;
    if(c && T >= c.t0 && T < c.t1){
      const k = (T - c.t0) / (c.t1 - c.t0), inn = ease(k * 5), out = k > 0.85 ? (1 - k) / 0.15 : 1, a = Math.min(inn, out);
      const bar = (c.small ? 0.05 : 0.09) * H * a;
      x.fillStyle = "#000"; x.fillRect(0, 0, W, bar); x.fillRect(0, H - bar, W, bar);
      const y = c.small ? H * 0.22 : H * 0.5, h = c.small ? 64 : 96;
      x.globalAlpha = a * 0.92;
      const g = x.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(3,6,12,0)"); g.addColorStop(0.18, "rgba(3,6,12,.95)"); g.addColorStop(0.82, "rgba(3,6,12,.95)"); g.addColorStop(1, "rgba(3,6,12,0)");
      x.fillStyle = g; x.fillRect(0, y - h / 2, W, h);
      x.fillStyle = c.c; x.fillRect(W * 0.5 - W * 0.36 * inn, y - h / 2, W * 0.72 * inn, 2); x.fillRect(W * 0.5 - W * 0.36 * inn, y + h / 2 - 2, W * 0.72 * inn, 2);
      x.globalAlpha = a;
      x.font = `13px "Press Start 2P", monospace`; x.fillStyle = c.c; x.fillText(c.top, W / 2, y - (c.small ? 13 : 22));
      x.font = `${c.small ? 20 : 30}px "Press Start 2P", monospace`;
      const j = k < 0.3 ? (1 - k / 0.3) * 8 : 0, ny = y + (c.small ? 12 : 16);
      if(j > 0.3){ x.fillStyle = "#ff3d7f"; x.fillText(c.name, W / 2 - j, ny); x.fillStyle = "#35f0d6"; x.fillText(c.name, W / 2 + j, ny); }
      x.fillStyle = "#ffffff"; x.fillText(c.name, W / 2, ny); x.globalAlpha = 1;
    }
  }
}
