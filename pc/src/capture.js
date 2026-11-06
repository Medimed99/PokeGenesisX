/* ============================================================
   LANCER, CAPTURER
   La Ball est dans la main droite. On vise (clic droit : le cercle
   se resserre autour du Pokémon, sa couleur dit la chance) et on
   lance (clic gauche) : une vraie trajectoire, qui retombe. Touché,
   le Pokémon devient lumière rouge et entre dans la Ball, qui tombe
   et tremble — une, deux, trois fois — puis se ferme ou s'ouvre.
   Toute la règle est celle du jeu mobile : throwBall (chance, anneau
   Excellent / Super / Bien, baies, chaîne), onCatch (gains, Pokédex,
   recherche, quêtes), onFail (fuite). Seule l'image change.
   ============================================================ */
import * as THREE from "three";
import { heightAt } from "./world/layout.js";
import { clamp } from "./util.js";

export const BALL_ORDER = ["poke", "super", "hyper", "data", "master"];
const R = 0.075, SPEED = 19.5, GRAV = 13;
const G = () => window.PCG;

/* ---------- la Ball, peinte sur une sphère ---------- */
const BALL_LOOK = {
  poke:   {top:"#e8403c", deco:null},
  super:  {top:"#2f74d0", deco:"fins"},
  hyper:  {top:"#2a2a2e", deco:"hyper"},
  data:   {top:"#14a58f", deco:"grid"},
  master: {top:"#7a3fb6", deco:"master"},
  safari: {top:"#6f8f3a", deco:"camo"}
};
const TEXCACHE = {};
function ballTexture(kind){
  if(TEXCACHE[kind]) return TEXCACHE[kind];
  const L = BALL_LOOK[kind] || BALL_LOOK.poke;
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = L.top; g.fillRect(0, 0, 512, 128);
  /* un reflet en haut */
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(0.7, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#f4f4f2"; g.fillRect(0, 128, 512, 128);
  if(L.deco === "fins"){ g.fillStyle = "#e8403c"; for(const x of [150, 362]){ g.beginPath(); g.ellipse(x, 92, 34, 26, 0, 0, Math.PI * 2); g.fill(); } }
  if(L.deco === "hyper"){ g.fillStyle = "#ffd23a"; g.fillRect(150, 30, 28, 98); g.fillRect(334, 30, 28, 98); g.fillRect(150, 70, 212, 22); }
  if(L.deco === "grid"){ g.strokeStyle = "rgba(160,255,240,0.6)"; g.lineWidth = 3; for(let x = 0; x < 512; x += 32){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); } for(let y = 16; y < 128; y += 32){ g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); } }
  if(L.deco === "master"){ g.fillStyle = "#ff6fb0"; for(const x of [150, 362]){ g.beginPath(); g.arc(x, 88, 26, 0, Math.PI * 2); g.fill(); } g.fillStyle = "#fff"; g.font = "bold 64px sans-serif"; g.textAlign = "center"; g.fillText("M", 256, 100); }
  if(L.deco === "camo"){ g.fillStyle = "#4b6a26"; for(let i = 0; i < 18; i++){ g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 120, 30, 16, Math.random() * 3, 0, Math.PI * 2); g.fill(); } }
  /* la bande noire et le bouton (face +x : u = 0,5) */
  g.fillStyle = "#151515"; g.fillRect(0, 118, 512, 20);
  g.beginPath(); g.arc(256, 128, 40, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f4f4f2"; g.beginPath(); g.arc(256, 128, 27, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#c8c8c4"; g.lineWidth = 3; g.beginPath(); g.arc(256, 128, 17, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return TEXCACHE[kind] = t;
}
export function makeBall(kind){
  const m = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 18), new THREE.MeshStandardMaterial({map:ballTexture(kind), roughness:0.32, metalness:0.05, emissive:new THREE.Color(0), emissiveIntensity:1}));
  m.castShadow = true;
  m.userData.kind = kind;
  return m;
}

/* ---------- les petites étincelles ---------- */
class Sparks {
  constructor(scene){
    this.max = 600;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.max * 3); this.col = new Float32Array(this.max * 3);
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({size:0.09, vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending}));
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.p = [];
  }
  burst(at, n, colors, speed = 2.5, life = 0.8, up = 1){
    for(let i = 0; i < n && this.p.length < this.max; i++){
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, s = speed * (0.4 + Math.random() * 0.8);
      this.p.push({x:at.x, y:at.y, z:at.z, vx:Math.cos(a) * Math.cos(b) * s, vy:Math.abs(Math.sin(b)) * s * up + 0.4, vz:Math.sin(a) * Math.cos(b) * s,
        c:new THREE.Color(colors[i % colors.length]), t:0, life:life * (0.6 + Math.random() * 0.6)});
    }
  }
  stream(from, to, n, color){
    for(let i = 0; i < n && this.p.length < this.max; i++){
      const k = Math.random();
      this.p.push({x:from.x + (Math.random() - 0.5) * 0.4, y:from.y + (Math.random() - 0.5) * 0.4, z:from.z + (Math.random() - 0.5) * 0.4,
        vx:(to.x - from.x) * 2.6, vy:(to.y - from.y) * 2.6, vz:(to.z - from.z) * 2.6, c:new THREE.Color(color), t:-k * 0.2, life:0.38, g:0});
    }
  }
  update(dt){
    let n = 0;
    for(const p of this.p){
      p.t += dt;
      if(p.t < 0){ continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= (p.g === undefined ? 4 : p.g) * dt;
      const k = 1 - p.t / p.life;
      if(n < this.max){ this.pos[n * 3] = p.x; this.pos[n * 3 + 1] = p.y; this.pos[n * 3 + 2] = p.z; this.col[n * 3] = p.c.r * k; this.col[n * 3 + 1] = p.c.g * k; this.col[n * 3 + 2] = p.c.b * k; n++; }
    }
    this.p = this.p.filter(p=>p.t < p.life);
    this.points.geometry.setDrawRange(0, n);
    this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
  }
}

export class Capture {
  constructor(game){
    this.game = game;
    const scene = game.engine.scene, cam = game.engine.camera;
    scene.add(cam);
    this.sel = "poke"; this.target = null; this.ringT = 0; this.aiming = false; this.aimK = 0;
    this.flights = []; this.holding = null; this.seq = null; this.resolving = false; this.lastGrade = null;
    this.sparks = new Sparks(scene);
    /* la main : la Ball tenue en bas à droite de la vue */
    this.hand = new THREE.Group(); cam.add(this.hand);
    this.handBall = makeBall("poke"); this.hand.add(this.handBall);
    this.handBall.castShadow = false;
    this.hand.position.set(0.27, -0.22, -0.48);
    this.handT = 0; this.cool = 0;
    this.installHooks();
  }
  setBall(kind){
    if(!BALL_ORDER.includes(kind)) return;
    this.sel = kind;
    this.handBall.material.map = ballTexture(kind); this.handBall.material.needsUpdate = true;
  }
  count(kind){ const S = G() && G().S; return S ? (S.balls[kind] || 0) : 0; }
  cycle(dir){
    const avail = BALL_ORDER.filter(k=>this.count(k) > 0);
    if(!avail.length) return;
    let i = avail.indexOf(this.sel);
    i = ((i < 0 ? 0 : i + dir) % avail.length + avail.length) % avail.length;
    this.setBall(avail[i]);
  }
  /* le cercle : de 1 (large) à 0,18 (serré), au rythme de la rareté (celui de la visée mobile) */
  ring(){
    const e = this.target; if(!e) return 1;
    const sp = (70 + (e.spec.rar || 0) * 32) / 100;
    return 1 - (this.ringT * sp % 1) * 0.82;
  }
  gradeOf(ring){
    const g = G(); if(!g) return null;
    const d = (ring - 0.18) / 0.82;
    return d < 0.22 ? g.RING_GRADES[0] : d < 0.5 ? g.RING_GRADES[1] : d < 0.78 ? g.RING_GRADES[2] : null;
  }
  chance(e, kind){
    const g = G(); if(!g || !e || e.spec.missing) return 0;
    const keep = g.ENC;
    try { g.ENC = e.spec; return window.throwChance(kind || this.sel, 1); } finally { g.ENC = keep; }
  }
  /* ---------- le lancer ---------- */
  throw(){
    const g = G(); if(!g) return false;
    if(this.cool > 0 || this.seq || g.busy) return false;
    if(this.count(this.sel) <= 0){ window.toast("Plus de " + g.BALLS[this.sel].name + " — 1 à 5 ou la molette pour en changer", "bad", "cross"); return false; }
    const cam = this.game.engine.camera;
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const from = new THREE.Vector3(); this.handBall.getWorldPosition(from);
    const ball = makeBall(this.sel);
    ball.position.copy(from);
    this.game.engine.scene.add(ball);
    const v = dir.clone().multiplyScalar(SPEED); v.y += 1.6;
    const f = {ball, v, kind:this.sel, t:0, target:this.target, ring:this.ring(), landed:false, rest:0, spin:new THREE.Vector3(Math.random() * 8 - 4, 0, -14)};
    this.flights.push(f);
    this.cool = 0.45;
    this.handBall.visible = false;
    if(this.game.audio) this.game.audio.whoosh();
    try { window.Sfx.throwb(); } catch(e){}
    return true;
  }
  hitTest(f, prev){
    for(const e of this.game.wild.list){
      if(e.state === "fled" || e.state === "gone" || e.state === "held" || e.state === "caught") continue;
      const h = e.sprite.drawH || e.H;
      const c = new THREE.Vector3(e.pos.x, e.pos.y + h * 0.5, e.pos.z);
      const rad = Math.max(0.32, Math.min(2.2, Math.max(h * 0.48, (e.sprite.width || 0.5) * 0.5)));
      /* segment parcouru pendant l'image contre la sphère du Pokémon */
      const seg = f.ball.position.clone().sub(prev), L = seg.length();
      const t = L > 0 ? clamp(c.clone().sub(prev).dot(seg) / (L * L), 0, 1) : 0;
      const closest = prev.clone().addScaledVector(seg, t);
      if(closest.distanceTo(c) < rad + R) return e;
    }
    return null;
  }
  update(dt, t, input){
    const g = G();
    this.cool = Math.max(0, this.cool - dt);
    this.ringT += dt;
    /* la cible : ce qu'on regarde */
    if(!this.seq){
      const prev = this.target;
      this.target = this.game.mode === "play" ? this.game.wild.pick(this.game.engine.camera, this.aiming ? 40 : 30) : null;
      if(this.target !== prev) this.ringT = 0;
    }
    this.aiming = this.game.mode === "play" && input.mouse.right;
    this.aimK += ((this.aiming ? 1 : 0) - this.aimK) * Math.min(1, dt * 10);
    this.game.player.zoom = this.aimK * 0.5;
    /* la main : balancement du pas, et la Ball qui monte quand on vise */
    this.handT += dt;
    const p = this.game.player, bob = p.bobAmp;
    this.hand.position.set(0.27 - this.aimK * 0.1 + Math.cos(p.bob) * 0.012 * bob, -0.22 + this.aimK * 0.06 + Math.sin(p.bob * 2) * 0.01 * bob, -0.48);
    this.handBall.rotation.set(0.2 + Math.sin(this.handT * 1.3) * 0.05, -1.7 + this.aimK * 0.4, 0.15);
    if(!this.handBall.visible && this.cool <= 0 && !this.seq) this.handBall.visible = this.game.mode === "play" && this.count(this.sel) > 0 && !this.game.fishing.active;
    const m = this.game.mode;
    /* (pendant un combat de la Tour, la caméra est dans l'arène : pas de Ball tenue en bas de l'écran) */
    if(this.game.fishing.active || m === "dialog" || m === "battle" || m === "title" || (this.game.tower3d && this.game.tower3d.on) || (this.game.intro && this.game.intro.active)) this.handBall.visible = false;
    /* les Balls en vol */
    for(const f of this.flights.slice()) this.fly(f, dt, t);
    if(this.seq) this.runSeq(dt, t);
    this.sparks.update(dt);
  }
  fly(f, dt, t){
    const b = f.ball;
    if(f.done){ f.fade = (f.fade || 0) + dt; b.scale.setScalar(Math.max(0.01, 1 - f.fade * 2)); if(f.fade > 0.5){ b.parent && b.parent.remove(b); this.flights = this.flights.filter(x=>x !== f); } return; }
    f.t += dt;
    const prev = b.position.clone();
    /* un peu d'aimant vers la cible verrouillée : on vise juste, la Ball suit */
    if(!f.landed && !f.bounces && f.target && f.target.state !== "fled" && f.target.state !== "gone"){
      const e = f.target, c = new THREE.Vector3(e.pos.x, e.pos.y + (e.sprite.drawH || e.H) * 0.5, e.pos.z);
      const to = c.sub(b.position), dist = to.length();
      const lateral = to.clone().sub(f.v.clone().normalize().multiplyScalar(to.dot(f.v.clone().normalize()))).length();
      if(dist < 26 && lateral < Math.max(1.4, (e.sprite.drawH || 1) * 0.9) && to.dot(f.v) > 0){
        const want = to.normalize().multiplyScalar(f.v.length());
        f.v.lerp(want, Math.min(1, dt * 5));
      }
    }
    f.v.y -= GRAV * dt;
    b.position.addScaledVector(f.v, dt);
    b.rotation.x += f.spin.x * dt; b.rotation.z += f.spin.z * dt;
    if(!f.landed){
      const e = this.hitTest(f, prev);
      if(e){ this.onHit(f, e); return; }
    }
    const gy = heightAt(b.position.x, b.position.z) + R;
    if(b.position.y < gy){
      b.position.y = gy;
      /* un rebond peut encore toucher : la Ball n'est ratée qu'une fois retombée pour de bon */
      if(Math.abs(f.v.y) > 1.2 && (f.bounces || 0) < 3){ f.v.y = -f.v.y * 0.42; f.v.x *= 0.7; f.v.z *= 0.7; f.bounces = (f.bounces || 0) + 1; if(this.game.audio) this.game.audio.bounce(b.position); }
      else { f.v.set(0, 0, 0); if(!f.landed){ f.landed = true; this.missed(f); } }
    }
    if(!f.landed && f.bounces && f.v.lengthSq() < 0.5){ f.landed = true; this.missed(f); }
    if(f.landed && f.v.lengthSq() < 0.01){ f.rest += dt; if(f.rest > 1.4) f.done = true; }
    if(f.t > 6) f.done = true;
  }
  /* raté : la Ball est perdue, comme sur mobile (chaque lancer coûte sa Ball) */
  missed(f){
    if(f.counted) return;
    f.counted = true;
    const g = G(), S = g.S;
    S.balls[f.kind] = Math.max(0, (S.balls[f.kind] || 0) - 1);
    S.stats.throws++; S.daily.dayThrow++; window.questTick("dayThrow", 1);
    window.saveSoon();
  }
  onHit(f, e){
    f.counted = true;
    const g = G();
    const grade = (g.S.settings.skill !== false && f.kind !== "master") ? this.gradeOf(f.ring) : null;
    this.lastGrade = grade ? {g:grade, t:this.game.t} : null;
    /* la Ball rebondit, s'ouvre ; le Pokémon devient lumière et y entre */
    f.v.set(-f.v.x * 0.08, 3.2, -f.v.z * 0.08);
    f.landed = false; f.held = e;
    this.flights = this.flights.filter(x=>x !== f);
    e.state = "held"; this.holding = e;
    this.target = null;
    const center = new THREE.Vector3(e.pos.x, e.pos.y + (e.sprite.drawH || e.H) * 0.5, e.pos.z);
    this.seq = {f, e, ball:f.ball, kind:f.kind, skill:grade ? grade.mul : 1, phase:"absorb", t:0, center, from:f.ball.position.clone()};
    try { window.Sfx.hit(); } catch(err){}
    if(this.game.audio) this.game.audio.absorb();
    if(this.game.hud) this.game.hud.grade(grade);
  }
  runSeq(dt, t){
    const s = this.seq, b = s.ball, e = s.e, U = e.sprite.uniforms;
    s.t += dt;
    if(s.phase === "absorb"){
      /* le flash rouge, la silhouette qui fond vers la Ball, la Ball qui reste en l'air */
      b.position.y += Math.max(0, 1.2 - s.t * 3) * dt * 2.2;
      b.rotation.y += dt * 9;
      U.uRed.value = Math.min(1, s.t * 4);
      e.sprite.scale = Math.max(0.02, 1 - s.t * 2.6);
      if(Math.random() < 0.7) this.sparks.stream(s.center, b.position, 3, "#ff3048");
      b.material.emissive.setRGB(1, 0.15, 0.2).multiplyScalar(Math.max(0, 0.8 - s.t));
      if(s.t > 0.42){
        e.sprite.mesh.visible = false; e.state = "held"; e.sprite.group.visible = false;
        s.phase = "fall"; s.t = 0; s.v = new THREE.Vector3(0, 0.5, 0);
      }
    } else if(s.phase === "fall"){
      s.v.y -= GRAV * dt;
      b.position.addScaledVector(s.v, dt);
      const gy = heightAt(b.position.x, b.position.z) + R;
      if(b.position.y <= gy){
        b.position.y = gy;
        if(s.v.y < -1.5){ s.v.y *= -0.3; if(this.game.audio) this.game.audio.bounce(b.position); }
        else {
          /* posée, le bouton face au joueur : la règle du jeu prend la main */
          s.phase = "rule"; s.t = 0;
          const cam = this.game.engine.camera;
          b.rotation.set(0, Math.atan2(cam.position.x - b.position.x, cam.position.z - b.position.z) - Math.PI / 2, 0);
          this.resolve();
        }
      }
    } else if(s.phase === "wobble"){
      /* une secousse : la Ball penche d'un côté, de l'autre, puis se tait un instant */
      const k = s.t / 0.42;
      if(k <= 1){ b.rotation.z = Math.sin(k * Math.PI * 2) * 0.42 * (1 - k * 0.3); b.position.y = heightAt(b.position.x, b.position.z) + R + Math.abs(Math.sin(k * Math.PI)) * 0.02; }
      else b.rotation.z = 0;
      b.material.emissive.setRGB(1, 0.1, 0.1).multiplyScalar(k <= 1 ? 0.5 + 0.5 * Math.sin(k * Math.PI * 4) : 0);
      if(s.t > 0.55){
        s.left--; s.t = 0;
        if(s.left > 0){ try { window.Sfx.wobble(); } catch(err){} if(this.game.audio) this.game.audio.click(b.position); }
        else this.finishWobble();
      }
    } else if(s.phase === "caught"){
      b.material.emissive.setRGB(0.2, 0.9, 0.8).multiplyScalar(Math.max(0, 1 - s.t * 1.2));
      if(s.t > 1.6){ s.ball.parent && s.ball.parent.remove(s.ball); this.endSeq(); }
    } else if(s.phase === "broke"){
      const k = Math.min(1, s.t / 0.35);
      e.sprite.group.visible = true; e.sprite.mesh.visible = true;
      e.sprite.scale = Math.max(0.02, k);
      U.uRed.value = 1 - k; U.uFlash.value = (1 - k) * 0.6;
      b.scale.setScalar(Math.max(0.01, 1 - k));
      if(s.t > 0.45){ U.uRed.value = 0; U.uFlash.value = 0; e.sprite.scale = 1; s.ball.parent && s.ball.parent.remove(s.ball); this.endSeq(); }
    }
  }
  /* la règle du jeu mobile, telle quelle */
  resolve(){
    const s = this.seq, g = G();
    g.ENC = s.e.spec;
    this.resolving = true;
    s.phase = "rule";
    /* throwBall : retire la Ball, calcule la chance (baies, anneau, horde, traque), puis appelle
       animateThrow (remplacé ici par les secousses 3D), puis onCatch ou onFail */
    try { window.throwBall(s.kind, s.skill); }
    catch(err){ console.error(err); this.resolving = false; this.endSeq(); }
    if(s.e.spec.missing){ s.phase = "caught"; s.t = 0; s.e.state = "fled"; s.e.sprite.group.visible = true; s.e.sprite.mesh.visible = true; s.e.gone = 0; }
  }
  /* appelé par throwBall à la place de l'animation mobile */
  wobble(ballKey, wobbles, success, done){
    const s = this.seq;
    if(!s){ done(); return; }
    s.phase = "wobble"; s.t = 0; s.left = Math.max(1, wobbles); s.success = success; s.done = done;
    if(wobbles <= 0){ s.left = 1; s.instant = true; }
    try { window.Sfx.wobble(); } catch(err){}
    if(this.game.audio) this.game.audio.click(s.ball.position);
  }
  finishWobble(){
    const s = this.seq, g = G();
    const done = s.done;
    if(s.success){
      s.phase = "caught"; s.t = 0;
      this.sparks.burst(s.ball.position.clone().add(new THREE.Vector3(0, 0.12, 0)), 36, ["#ffe26a", "#ffffff", "#35f0d6"], 2.2, 0.9);
      try { window.Sfx.caught(); } catch(err){}
      if(this.game.audio) this.game.audio.caught();
      s.e.state = "caught";
      const e = s.e;
      done();                                  /* onCatch : gains, Pokédex, et la fiche (crochets ci-dessous) */
      this.game.wild.remove(e);
      this.holding = null;
    } else {
      s.phase = "broke"; s.t = 0;
      this.sparks.burst(s.ball.position.clone(), 24, ["#ffffff", "#ff8090"], 3, 0.5);
      try { window.Sfx.fail(); } catch(err){}
      done();                                  /* onFail : tentative, fuite peut-être */
      const fled = !g.ENC;
      s.e.state = fled ? "fled" : "alert";
      s.e.timer = 2.5; s.e.gone = 0; s.e.hidden = false;
      s.e.sprite.group.visible = true;
    }
    g.ENC = null;
    this.resolving = false;
  }
  endSeq(){ this.seq = null; this.holding = null; this.cool = 0.3; }

  /* ---------- les crochets dans le jeu mobile ---------- */
  installHooks(){
    const self = this;
    const orig = {animateThrow:window.animateThrow, showDiscovery:window.showDiscovery, showCatchResult:window.showCatchResult,
      nextEncounter:window.nextEncounter, rivalTick:window.rivalTick, resolveMissing:window.resolveMissing};
    this.orig = orig;
    window.animateThrow = function(ballKey, wobbles, success, done){
      if(self.resolving && self.seq) return self.wobble(ballKey, wobbles, success, done);
      return orig.animateThrow.apply(this, arguments);
    };
    /* la fiche d'une capture faite dans la 3D : le HUD ; ailleurs (le terminal), celle du mobile */
    window.showDiscovery = function(c, rw, opts){
      if(self.resolving && !(opts && opts.onDone) && self.game.hud) return self.game.hud.caught(c, rw, true);
      return orig.showDiscovery.apply(this, arguments);
    };
    window.showCatchResult = function(c, rw){
      if(self.resolving && self.game.hud) return self.game.hud.caught(c, rw, false);
      return orig.showCatchResult.apply(this, arguments);
    };
    /* après une fuite, le mobile tire la rencontre suivante : dans la 3D, la route s'en charge */
    window.nextEncounter = function(){
      if(self.game.mode === "play" && !self.game.terminal.open){ G().ENC = null; return null; }
      return orig.nextEncounter.apply(this, arguments);
    };
    /* les dresseurs rémanents ont leur place sur la route (pas d'écran surgissant) */
    window.rivalTick = function(){
      if(self.resolving) return self.game.trainer ? self.game.trainer.tick() : false;
      return orig.rivalTick.apply(this, arguments);
    };
  }
}
