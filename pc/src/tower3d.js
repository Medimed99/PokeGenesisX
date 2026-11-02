/* ============================================================
   LA TOUR EN 3D
   Le moteur de la Tour (le jeu mobile) décide de tout et raconte le
   combat événement par événement ; l'écran mobile en tire une image
   (SQV : qui entre, qui frappe, qui est touché, les chiffres, la
   Synchro, l'ultime, le boss). Ici, on lit ce même récit et on le joue
   en 3D, sur une arène qui flotte au-dessus de l'archive : les vrais
   modèles animés, des traînées d'énergie, des chiffres qui sautent,
   une caméra qui suit l'ultime et l'entrée du boss.
   Les commandes (compétences, cible, Synchro, auto, vitesse, pause,
   bilan) restent celles du jeu mobile, posées par-dessus la scène :
   une seule règle, deux façons de la voir.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "./mon/model3d.js";
import { realHeight } from "./mon/sprites.js";
import { CZ } from "./world/corruption.js";

const G = () => window.PCG;
const ARENA = new THREE.Vector3(0, 230, 0);
/* les places, comme sur l'écran mobile : ton équipe à gauche devant, l'adversaire à droite au fond */
const SLOT_A = [[-2.1, 1.5], [-3.9, 0.3], [-2.7, 3.5], [-4.5, 2.3]];
const SLOT_F = [[2.3, -1.5], [4.1, -0.3], [2.9, -3.5], [4.7, -2.3]];
const SLOT_BOSS = [3.5, -2.1], SLOT_FB = [[1.7, -0.5], [5.0, 0.7], [2.0, -4.0]];
const hex = c => new THREE.Color(c && c[0] === "#" ? c : "#ffffff");

export class Tower3D {
  constructor(game){
    this.game = game; this.on = false; this.recs = new Map(); this.built = false;
    this.seen = new WeakSet(); this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3();
    this.fx = document.createElement("canvas"); this.fx.id = "pc-tower-fx";
    document.body.appendChild(this.fx);
    /* viser : un clic n'importe où sur la scène (pas sur une commande) ; écouté sur la fenêtre,
       pour ne dépendre d'aucun empilement de calques */
    addEventListener("pointerdown", e=>{
      if(!this.on || e.button !== 0) return;
      if(e.target.closest && e.target.closest("button, a, input, .sq2-dock, .sq2-top, .sq2-tip, .sq2-res.on, #sheet-root.on, #toasts")) return;
      this.pick(e.clientX, e.clientY);
    }, true);
  }
  /* un combat de la Tour est-il à l'écran (dans le terminal) ? */
  wanted(){
    const g = G(); if(!g) return false;
    const B = g.SQB, V = g.SQV, cv = document.getElementById("sqcv");
    return !!(B && V && cv && cv.isConnected && this.game.terminal.open);
  }
  /* ---------- l'arène : une plateforme de données qui flotte au-dessus de la route ---------- */
  build(){
    this.built = true;
    const scene = this.game.engine.scene;
    this.group = new THREE.Group(); this.group.position.copy(ARENA); scene.add(this.group);
    /* le dallage : des dalles sombres, des joints qui luisent */
    const cv = document.createElement("canvas"); cv.width = cv.height = 512;
    const g = cv.getContext("2d");
    g.fillStyle = "#151a24"; g.fillRect(0, 0, 512, 512);
    for(let y = 0; y < 8; y++) for(let x = 0; x < 8; x++){
      const v = 18 + Math.floor(Math.random() * 14);
      g.fillStyle = `rgb(${v},${v + 3},${v + 10})`; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58);
      if(Math.random() < 0.12){ g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2.4, 2.4);
    const ecv = document.createElement("canvas"); ecv.width = ecv.height = 512;
    const eg = ecv.getContext("2d"); eg.fillStyle = "#000"; eg.fillRect(0, 0, 512, 512);
    eg.strokeStyle = "#2a8a80"; eg.lineWidth = 2;
    for(let i = 0; i <= 8; i++){ eg.beginPath(); eg.moveTo(i * 64, 0); eg.lineTo(i * 64, 512); eg.stroke(); eg.beginPath(); eg.moveTo(0, i * 64); eg.lineTo(512, i * 64); eg.stroke(); }
    const etex = new THREE.CanvasTexture(ecv); etex.wrapS = etex.wrapT = THREE.RepeatWrapping; etex.repeat.set(2.4, 2.4);
    this.floorMat = new THREE.MeshStandardMaterial({map:tex, emissiveMap:etex, emissive:new THREE.Color("#35f0d6"), emissiveIntensity:0.55, roughness:0.85, metalness:0.1});
    const top = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 8.2, 0.7, 8, 1), [new THREE.MeshStandardMaterial({color:"#10141c", roughness:0.9}), this.floorMat, this.floorMat]);
    top.position.y = -0.35; top.receiveShadow = true; top.rotation.y = Math.PI / 8;
    /* la face du dessus porte le dallage : on recale ses coordonnées de texture */
    const cap = new THREE.Mesh(new THREE.CircleGeometry(8.55, 8), this.floorMat);
    cap.rotation.x = -Math.PI / 2; cap.rotation.z = Math.PI / 8; cap.position.y = 0.005; cap.receiveShadow = true;
    this.group.add(top, cap);
    /* le bord : un anneau à la couleur de l'aile */
    this.rimMat = new THREE.MeshBasicMaterial({color:"#35f0d6"});
    const rim = new THREE.Mesh(new THREE.TorusGeometry(8.45, 0.06, 6, 8), this.rimMat);
    rim.rotation.x = Math.PI / 2; rim.rotation.z = Math.PI / 8; rim.position.y = 0.03;
    this.group.add(rim);
    /* le rocher dessous, déchiqueté */
    const under = new THREE.ConeGeometry(8.1, 11, 8, 6, true);
    const up = under.attributes.position;
    for(let i = 0; i < up.count; i++){ const y = up.getY(i); if(y < 5.4){ up.setX(i, up.getX(i) * (0.85 + Math.random() * 0.3)); up.setZ(i, up.getZ(i) * (0.85 + Math.random() * 0.3)); up.setY(i, y + (Math.random() - 0.5) * 0.8); } }
    under.computeVertexNormals();
    const rock = new THREE.Mesh(under, new THREE.MeshStandardMaterial({color:"#1a1d24", roughness:1, flatShading:true}));
    rock.rotation.x = Math.PI; rock.position.y = -6.2; rock.rotation.y = Math.PI / 8;
    this.group.add(rock);
    /* des piliers brisés sur le pourtour */
    const pm = new THREE.MeshStandardMaterial({color:"#232835", roughness:0.9, emissive:"#000"});
    for(let i = 0; i < 8; i++){
      if(i === 3 || i === 7) continue;                      /* les deux brèches où l'on regarde */
      const a = i / 8 * Math.PI * 2, h = 1.4 + Math.random() * 3.2;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), pm);
      p.position.set(Math.cos(a) * 7.7, h / 2, Math.sin(a) * 7.7); p.rotation.y = -a; p.castShadow = true; p.receiveShadow = true;
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.62), this.rimMat);
      band.position.y = h * 0.62 - h / 2; p.add(band);
      this.group.add(p);
    }
    /* des débris qui flottent autour */
    const deb = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:"#1c2029", roughness:1, flatShading:true}), 26);
    this.debris = [];
    const m4 = new THREE.Matrix4();
    for(let i = 0; i < 26; i++){
      const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 9, s = 0.3 + Math.random() * 1.3;
      const d = {a, r, y:-3 + Math.random() * 7, s, sp:0.02 + Math.random() * 0.05, rot:Math.random() * 6};
      this.debris.push(d);
      m4.compose(new THREE.Vector3(Math.cos(a) * r, d.y, Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      deb.setMatrixAt(i, m4);
    }
    deb.castShadow = true;
    this.debMesh = deb; this.group.add(deb);
    /* l'anneau sous le Pokémon qui joue, et la flèche au-dessus de la cible */
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#5cf0ff", transparent:true, opacity:0.8, depthWrite:false}));
    this.ring.renderOrder = 3; this.group.add(this.ring);
  }
  setZone(B){
    const g = G(), Z = g.ref("SQ_ZONES"), z = Z && Z[B.z];
    const c = B.final ? "#ff3d7f" : B.lock ? "#ff3d7f" : (z && z.c) || "#35f0d6";
    this.rimMat.color.set(c);
    this.floorMat.emissive.set(c); this.floorMat.emissiveIntensity = 0.45;
  }
  /* ---------- entrer, sortir ---------- */
  enter(){
    if(!this.built) this.build();
    this.on = true; this.t0 = this.game.t;
    document.body.classList.add("tower3d");
    const B = G().SQB; this.B = B; this.setZone(B);
    this.group.visible = true;
    this.game.world.focus = ARENA;
    this.prevFov = this.game.engine.camera.fov;
    this.game.engine.camera.fov = 52; this.game.engine.camera.updateProjectionMatrix();
    this.camPos.copy(ARENA).add(new THREE.Vector3(-14, 7, 14)); this.camLook.copy(ARENA);
    for(const u of [...B.allies, ...(G().SQV.foes || [])]) preloadMon(u.id, u.shiny);
  }
  exit(){
    this.on = false;
    document.body.classList.remove("tower3d");
    for(const r of this.recs.values()) r.m.dispose();
    this.recs.clear();
    if(this.group) this.group.visible = false;
    this.game.world.focus = null;
    CZ.uLamp.value.w = 0;
    const c = this.game.engine.camera; c.fov = this.prevFov || 72; c.updateProjectionMatrix();
    const x = this.fx.getContext("2d"); x.clearRect(0, 0, this.fx.width, this.fx.height);
    this.fx.classList.remove("on");
  }
  update(dt, t){
    const want = this.wanted();
    if(want && !this.on) this.enter();
    else if(!want && this.on) this.exit();
    else if(want && G().SQB !== this.B){ this.exit(); this.enter(); }       /* un nouveau combat */
    if(!this.on) return;
    this.frame(dt, t);
  }
  /* ---------- la place de chacun ---------- */
  slots(){
    const g = G(), B = g.SQB, V = g.SQV, out = [];
    B.allies.forEach((u, i)=>out.push({u, x:(SLOT_A[i] || SLOT_A[0])[0], z:(SLOT_A[i] || SLOT_A[0])[1], side:"ally"}));
    const foes = V.foes || [], boss = foes.find(f=>f.boss);
    let j = 0;
    foes.forEach((u, i)=>{
      let s;
      if(boss){ s = u === boss ? SLOT_BOSS : (SLOT_FB[j++] || SLOT_FB[0]); }
      else s = SLOT_F[i] || SLOT_F[0];
      out.push({u, x:s[0], z:s[1], side:"foe"});
    });
    return out;
  }
  dispHeight(u){
    const h = Math.max(0.75, Math.min(2.3, u.mn ? 1.8 : realHeight(u.id)));
    return h * (u.mn ? 1.5 : u.guardian ? 1.6 : u.boss ? 1.45 : 1);
  }
  rec(u){
    let r = this.recs.get(u);
    if(r) return r;
    const scene = this.game.engine.scene, H = this.dispHeight(u);
    const m = u.mn ? this.game.wild.missingSprite(scene) : makeMon(u.id, u.shiny, scene, {height:H});
    r = {u, m, H, pos:new THREE.Vector3(), heading:0, lastHurt:0, lastGlow:0};
    this.recs.set(u, r);
    return r;
  }
  /* ---------- une image ---------- */
  frame(dt, t){
    const g = G(), B = g.SQB, V = g.SQV; if(!B || !V) return;
    const T = V.t || 0, cam = this.game.engine.camera, env = this.game.env;
    const list = this.slots(), live = new Set();
    const center = {ally:new THREE.Vector3(), foe:new THREE.Vector3()}, cnt = {ally:0, foe:0};
    for(const s of list){ center[s.side].add(new THREE.Vector3(s.x, 0, s.z)); cnt[s.side]++; }
    for(const k of ["ally", "foe"]) if(cnt[k]) center[k].divideScalar(cnt[k]);
    for(const s of list){
      const u = s.u, v = u._v || {}, r = this.rec(u), m = r.m;
      live.add(u);
      const base = new THREE.Vector3(ARENA.x + s.x, ARENA.y, ARENA.z + s.z);
      const pos = base.clone();
      const other = s.side === "ally" ? center.foe : center.ally;
      let heading = Math.atan2(other.x - s.x, other.z - s.z);
      let anim = "idle", glitch = 0, vis = true, flash = 0;
      /* l'entrée : il arrive du bord de l'arène, en se reconstituant */
      if(v.enter){
        const k = (T - v.enter.t0) / v.enter.dur;
        if(k < 0) vis = false;
        else if(k < 1){
          const e = 1 - Math.pow(1 - k, 2), from = s.side === "ally" ? new THREE.Vector3(-5, 0, 4) : new THREE.Vector3(5, 0, -4);
          pos.addScaledVector(from, 1 - e); anim = "walk"; glitch = 1 - k;
          heading = Math.atan2(-from.x, -from.z);
        }
      }
      /* l'élan vers la cible */
      if(v.lunge && T >= v.lunge.t0 && T - v.lunge.t0 < 380){
        /* la cible est donnée par sa place à l'écran mobile : on retrouve qui s'y tient */
        const to = v.lunge.to, tg = [...this.recs.values()].find(x=>x.u._v && x.u._v.pos && Math.abs(x.u._v.pos.x - to.x) < 2 && Math.abs(x.u._v.pos.y - to.y) < 2);
        if(tg){ const q = Math.sin((T - v.lunge.t0) / 380 * Math.PI) * 0.6; pos.lerp(tg.pos, q * 0.85); }
      }
      /* la pose : attaque, tir, charge */
      const pose = v.pose && T >= v.pose.t0 && T - v.pose.t0 < v.pose.len ? v.pose : v.pose2 && T >= v.pose2.t0 && T - v.pose2.t0 < v.pose2.len ? v.pose2 : null;
      if(pose) anim = "attack";
      /* touché : un recul, un éclair blanc, des éclats */
      if(v.hurt && T - v.hurt < 220){ const k = 1 - (T - v.hurt) / 220; pos.addScaledVector(new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading)), -0.35 * k); }
      if(v.flash && T - v.flash < 110) flash = 0.85;
      if(v.hurt && v.hurt !== r.lastHurt){ r.lastHurt = v.hurt; this.game.capture.sparks.burst(pos.clone().add(new THREE.Vector3(0, r.H * 0.55, 0)), 16, ["#ffffff", "#ffd84a", "#ff9a5c"], 3, 0.5); }
      if(v.glow && v.glow.t0 !== r.lastGlow && T - v.glow.t0 < 500){ r.lastGlow = v.glow.t0; this.game.capture.sparks.burst(pos.clone().add(new THREE.Vector3(0, r.H * 0.4, 0)), 14, [v.glow.c], 1.6, 0.7, 1.5); }
      if(v.glow && T - v.glow.t0 < 300) flash = Math.max(flash, 0.3 * (1 - (T - v.glow.t0) / 300));
      /* K.O. : il se défait en pixels et s'enfonce */
      if(v.ko){ const k = Math.min(1, (T - v.ko) / 620); glitch = Math.max(glitch, k); pos.y -= k * 0.3; if(k >= 1) vis = false; }
      m.setAnim(anim);
      m.uniforms.uGlitch.value = glitch;
      m.uniforms.uFlash.value = flash;
      m.group.visible = vis;
      m.groundY = ARENA.y;
      r.pos.copy(pos); r.heading = heading; r.vis = vis;
      m.update(t, dt, pos, heading, cam.position, env);
    }
    for(const [u, r] of this.recs) if(!live.has(u)){ r.m.dispose(); this.recs.delete(u); }
    /* les traînées : un tir part au bon moment, une vague frappe tout un camp */
    for(const o of V.orbs || []){
      if(this.seen.has(o) || T < o.t0) continue;
      this.seen.add(o);
      const a = this.recs.get(o.from), b = this.recs.get(o.to);
      if(a && b) this.game.capture.sparks.stream(a.pos.clone().add(new THREE.Vector3(0, a.H * 0.6, 0)), b.pos.clone().add(new THREE.Vector3(0, b.H * 0.5, 0)), 34, o.c);
    }
    for(const w of V.waves || []){
      if(this.seen.has(w) || T < w.t0) continue;
      this.seen.add(w);
      const hitSide = w.team ? w.side : (w.side === "ally" ? "foe" : "ally");
      for(const r of this.recs.values()) if(r.vis && r.u.side === hitSide) this.game.capture.sparks.burst(r.pos.clone().add(new THREE.Vector3(0, 0.2, 0)), 22, [w.c, "#ffffff"], 2.6, 0.7, 0.6);
    }
    /* l'anneau du Pokémon qui joue */
    const act = V.active && this.recs.get(V.active);
    this.ring.visible = !!(act && act.vis && !B.over);
    if(this.ring.visible){
      this.ring.position.set(act.pos.x - ARENA.x, 0.03, act.pos.z - ARENA.z);
      const s = Math.max(0.8, act.H * 0.55) * (1 + Math.sin(t * 6) * 0.05); this.ring.scale.setScalar(s);
      this.ring.material.color.set(act.u.side === "ally" ? "#5cf0ff" : "#ff5c7a");
    }
    /* les débris tournent lentement */
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    this.debris.forEach((d, i)=>{ d.a += d.sp * dt * 0.3; d.rot += dt * d.sp * 3;
      q.setFromEuler(new THREE.Euler(d.rot, d.rot * 0.7, 0));
      m4.compose(new THREE.Vector3(Math.cos(d.a) * d.r, d.y + Math.sin(t * 0.4 + i) * 0.3, Math.sin(d.a) * d.r), q, new THREE.Vector3(d.s, d.s, d.s)); this.debMesh.setMatrixAt(i, m4); });
    this.debMesh.instanceMatrix.needsUpdate = true;
    /* la nuit, l'arène a sa propre lueur */
    const night = this.game.world.sky.state ? this.game.world.sky.state.night : 0;
    CZ.uLamp.value.set(ARENA.x, ARENA.y + 3, ARENA.z, 0.35 + night * 0.9);
    this.camera(dt, t, T, V);
    this.overlay(T, V, B);
  }
  /* ---------- la caméra : derrière ton équipe ; elle suit l'ultime et l'entrée du boss ---------- */
  camera(dt, t, T, V){
    const cam = this.game.engine.camera;
    const wantPos = ARENA.clone().add(new THREE.Vector3(-8.6 + Math.sin(t * 0.13) * 0.5, 3.9 + Math.sin(t * 0.21) * 0.15, 8.9));
    const wantLook = ARENA.clone().add(new THREE.Vector3(1.1, 0.9, -1.0));
    const C = V.cut && T >= V.cut.t0 && T - V.cut.t0 < V.cut.dur ? V.cut : null;
    if(C && C.u && this.recs.get(C.u)){
      const r = this.recs.get(C.u), k = (T - C.t0) / C.dur, a = k < 0.2 ? k / 0.2 : k > 0.8 ? (1 - k) / 0.2 : 1;
      const front = new THREE.Vector3(Math.sin(r.heading), 0, Math.cos(r.heading));
      const side = new THREE.Vector3(front.z, 0, -front.x);
      const close = r.pos.clone().addScaledVector(front, 2.4 + r.H * 1.2).addScaledVector(side, 1.2).add(new THREE.Vector3(0, r.H * 0.7 + 0.4, 0));
      wantPos.lerp(close, a * 0.85);
      wantLook.lerp(r.pos.clone().add(new THREE.Vector3(0, r.H * 0.55, 0)), a);
    } else if(C && C.kind === "sync"){
      wantPos.add(new THREE.Vector3(1.5, 0.8, -1.2));
    }
    const k = Math.min(1, dt * (this.game.t - this.t0 < 1.2 ? 2.2 : 4));
    this.camPos.lerp(wantPos, k); this.camLook.lerp(wantLook, k);
    cam.position.copy(this.camPos);
    const calm = typeof window.calmFx === "function" && window.calmFx();
    const sh = calm ? 0 : Math.min(12, V.shake || 0) * 0.012;
    if(sh > 0.001) cam.position.add(new THREE.Vector3((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0));
    cam.lookAt(this.camLook);
  }
  /* ---------- par-dessus : les plaques de vie, les chiffres, la cible, les bannières ---------- */
  project(v){
    const p = v.clone().project(this.game.engine.camera);
    return {x:(p.x * 0.5 + 0.5) * innerWidth, y:(-p.y * 0.5 + 0.5) * innerHeight, behind:p.z > 1};
  }
  overlay(T, V, B){
    const cv = this.fx, d = Math.min(2, devicePixelRatio || 1);
    if(cv.width !== Math.round(innerWidth * d) || cv.height !== Math.round(innerHeight * d)){ cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
    cv.classList.add("on");
    const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
    /* les plaques */
    for(const r of this.recs.values()){
      const u = r.u, v = u._v; if(!v || !r.vis || v.ko || v.hp <= 0) continue;
      if(v.enter && T - v.enter.t0 < v.enter.dur * 0.8) continue;
      const p = this.project(r.pos.clone().add(new THREE.Vector3(0, r.H + 0.28, 0))); if(p.behind) continue;
      const w = u.boss || u.guardian ? 120 : 86, hp = Math.max(0, v.hp / u.maxHp), tr = Math.max(hp, Math.min(1, (v.trail || v.hp) / u.maxHp));
      const ally = u.side === "ally";
      x.fillStyle = "rgba(4,8,16,.82)"; x.fillRect(p.x - w / 2 - 2, p.y - 2, w + 4, 10);
      x.fillStyle = "#ff3d7f"; x.fillRect(p.x - w / 2, p.y, w * tr, 6);
      x.fillStyle = hp > 0.5 ? (ally ? "#5cf08a" : "#5cf08a") : hp > 0.2 ? "#ffc857" : "#ff5c5c"; x.fillRect(p.x - w / 2, p.y, w * hp, 6);
      if(v.sh > 0){ x.fillStyle = "rgba(220,235,255,.85)"; x.fillRect(p.x - w / 2, p.y + 6, w * Math.min(1, v.sh / u.maxHp), 2); }
      x.strokeStyle = ally ? "rgba(92,240,255,.7)" : "rgba(255,92,122,.7)"; x.lineWidth = 1; x.strokeRect(p.x - w / 2 - 2.5, p.y - 2.5, w + 5, 11);
      x.font = "12px 'Pixelify Sans', sans-serif"; x.textAlign = "center"; x.textBaseline = "alphabetic";
      x.lineWidth = 3; x.strokeStyle = "rgba(0,0,0,.8)";
      const label = `${u.name}  N.${u.level || ""}`;
      x.strokeText(label, p.x, p.y - 6); x.fillStyle = ally ? "#d8f6ff" : "#ffd6de"; x.fillText(label, p.x, p.y - 6);
      /* les effets en cours : une lettre colorée chacun */
      const F = window.SQ_FXCOL || G().ref("SQ_FXCOL"), L = G().ref("SQ_FXLET");
      if(u.fx && u.fx.length && F && L){
        let ox = p.x - w / 2;
        for(const e of u.fx.slice(0, 6)){ x.fillStyle = F[e.k] || "#fff"; x.fillRect(ox, p.y + 11, 12, 12); x.fillStyle = "#04070e"; x.font = "9px 'Press Start 2P', monospace"; x.textAlign = "center"; x.fillText(L[e.k] || "?", ox + 6, p.y + 21); ox += 14; }
      }
    }
    /* la cible choisie (au tour du joueur) */
    if(V.wait && V.target){
      const r = this.recs.get(V.target);
      if(r && r.vis){
        const p = this.project(r.pos.clone().add(new THREE.Vector3(0, r.H + 0.75, 0)));
        const bob = Math.sin(performance.now() / 160) * 4;
        x.fillStyle = "#ffd84a"; x.strokeStyle = "#1a1206"; x.lineWidth = 2;
        x.beginPath(); x.moveTo(p.x, p.y + 14 + bob); x.lineTo(p.x - 10, p.y + bob); x.lineTo(p.x + 10, p.y + bob); x.closePath(); x.fill(); x.stroke();
      }
    }
    /* les chiffres : ils sautent et montent */
    x.textAlign = "center"; x.textBaseline = "middle";
    for(const pp of V.pops || []){
      const k = (T - pp.t0) / 950; if(k < 0 || k >= 1) continue;
      const r = this.recs.get(pp.u); if(!r || !r.vis) continue;
      const p = this.project(r.pos.clone().add(new THREE.Vector3(0, r.H + 0.55, 0))); if(p.behind) continue;
      const sc = k < 0.12 ? 0.6 + k / 0.12 * 0.7 : 1.3 - Math.min(0.3, (k - 0.12) * 1.2);
      x.font = `${Math.round((pp.small ? 10 : pp.big ? 26 : 18) * sc)}px "Press Start 2P", monospace`;
      x.globalAlpha = k > 0.72 ? (1 - k) / 0.28 : 1;
      const y = p.y + (pp.dy || 0) * 1.3 - k * 36;
      x.lineWidth = 5; x.strokeStyle = "#000"; x.strokeText(pp.txt, p.x, y); x.fillStyle = pp.c; x.fillText(pp.txt, p.x, y);
    }
    x.globalAlpha = 1;
    /* la bannière : la vague, le nom de la compétence, la victoire */
    const Bn = V.banner;
    if(Bn){
      const k = (T - Bn.t0) / (Bn.big ? 1100 : 760);
      if(k >= 0 && k < 1){
        x.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
        const W = innerWidth, cy = Bn.big ? innerHeight * 0.42 : 150;
        if(Bn.big){
          const gr = x.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.25, "rgba(0,0,0,.7)"); gr.addColorStop(0.75, "rgba(0,0,0,.7)"); gr.addColorStop(1, "rgba(0,0,0,0)");
          x.fillStyle = gr; x.fillRect(0, cy - 42, W, 84);
          x.fillStyle = Bn.c; x.fillRect(W * 0.25, cy - 42, W * 0.5, 2); x.fillRect(W * 0.25, cy + 40, W * 0.5, 2);
          const sc = k < 0.15 ? 1.3 - k * 2 : 1;
          x.font = `${Math.round(34 * sc)}px "Press Start 2P", monospace`; x.lineWidth = 6; x.strokeStyle = "#000"; x.strokeText(Bn.txt, W / 2, cy + 2); x.fillStyle = Bn.c; x.fillText(Bn.txt, W / 2, cy + 2);
        } else {
          x.font = "15px 'Press Start 2P', monospace";
          const w = x.measureText(Bn.txt).width + 36;
          x.fillStyle = "rgba(5,9,18,.9)"; x.fillRect(W / 2 - w / 2, cy - 18, w, 36); x.strokeStyle = Bn.c; x.lineWidth = 2; x.strokeRect(W / 2 - w / 2, cy - 18, w, 36);
          x.fillStyle = Bn.c; x.fillRect(W / 2 - w / 2, cy - 18, 4, 36); x.fillStyle = "#fff"; x.fillText(Bn.txt, W / 2, cy + 1);
        }
        x.globalAlpha = 1;
      }
    }
    /* l'ultime, la Synchro, le boss : une coupure */
    const C = V.cut && T >= V.cut.t0 && T - V.cut.t0 < V.cut.dur ? V.cut : null;
    if(C){
      const k = (T - C.t0) / C.dur, a = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
      x.globalAlpha = a * 0.55; x.fillStyle = "#02040a"; x.fillRect(0, 0, innerWidth, 70); x.fillRect(0, innerHeight - 70, innerWidth, 70);
      x.globalAlpha = a;
      const txt = C.kind === "sync" ? "SYNCHRO" : C.kind === "boss" ? (C.n || "BOSS") : (C.n || "");
      if(txt){ x.font = `${C.kind === "boss" ? 30 : 26}px "Press Start 2P", monospace`; x.textAlign = "left"; x.lineWidth = 6; x.strokeStyle = "#000";
        x.strokeText(txt, 48, innerHeight - 110); x.fillStyle = C.c || "#fff"; x.fillText(txt, 48, innerHeight - 110); }
      x.globalAlpha = 1;
    }
  }
  /* ---------- viser : un clic sur un adversaire lance la compétence choisie ---------- */
  pick(cx, cy){
    if(!this.on) return;
    const g = G(), B = g.SQB, V = g.SQV; if(!B || !V || !V.wait) return;
    const u = V.wait, sk = u.skills[V.pick]; if(!sk) return;
    if(sk.kind !== "atk"){ window.sqDoAct(u, {si:V.pick, ti:0}); return; }
    let best = null, bd = 110;
    for(const r of this.recs.values()){
      if(r.u.side !== "foe" || r.u.hp <= 0 || !r.vis) continue;
      const p = this.project(r.pos.clone().add(new THREE.Vector3(0, r.H * 0.5, 0)));
      const dd = Math.hypot(p.x - cx, p.y - cy);
      if(dd < bd){ bd = dd; best = r.u; }
    }
    if(!best) return;
    const ti = B.foes.indexOf(best);
    if(ti >= 0) window.sqDoAct(u, {si:V.pick, ti});
  }
}
