/* ============================================================
   LES CAPACITÉS DES SAUVAGES
   Un Pokémon sauvage s'entraîne, s'impose, se dispute avec un autre :
   il lance une vraie capacité de son type, reconnaissable, sans effet
   sur la partie — mais le sol s'en souvient un moment (marks.js).
     Normal : Charge            · Combat : Casse-Brique
     Vol : Tornade              · Poison : Détritus
     Sol : Piétisol             · Roche : Jet-Pierres
     Insecte : Sécrétion        · Spectre : Ball'Ombre
     Acier : Griffe Acier       · Feu : Lance-Flammes
     Eau : Pistolet à O         · Plante : Tranch'Herbe
     Électrik : Éclair          · Psy : Choc Mental
     Glace : Laser Glace        · Dragon : Draco-Souffle
     Ténèbres : Tranche-Nuit    · Fée : Vent Féérique
   L'animation d'attaque du modèle donne le moment du coup ; la
   capacité part de sa gueule (ou de lui tout entier, au contact).
   ============================================================ */
import * as THREE from "three";
import { Particles, PK } from "../fx/particles.js";
import { addMark, MKK } from "../world/marks.js";
import { heightAt, inWater, regionAt, WATER_Y } from "../world/layout.js";

const calm = () => typeof window.calmFx === "function" && window.calmFx();
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

export const MOVES = {
  1:{n:"Charge", dash:true}, 2:{n:"Casse-Brique", dash:true}, 3:{n:"Tornade"}, 4:{n:"Détritus"}, 5:{n:"Piétisol", stomp:true},
  6:{n:"Jet-Pierres"}, 7:{n:"Sécrétion"}, 8:{n:"Ball'Ombre"}, 9:{n:"Griffe Acier", dash:true}, 10:{n:"Lance-Flammes"},
  11:{n:"Pistolet à O"}, 12:{n:"Tranch'Herbe"}, 13:{n:"Éclair"}, 14:{n:"Choc Mental"}, 15:{n:"Laser Glace"},
  16:{n:"Draco-Souffle"}, 17:{n:"Tranche-Nuit", dash:true}, 18:{n:"Vent Féérique"}
};
/* la couleur de la roche, selon l'endroit */
const ROCK = {route:"#7a6e62", foret:"#5e6458", eaux:"#c9c4b6", grotte:"#4a4252", ruines:"#a49a8c", foyer:"#2a2422"};

export class WildMoves {
  constructor(game){
    this.game = game; const scene = game.engine.scene; this.scene = scene;
    this.glow = new Particles(scene, {max:1800, additive:true, order:9});
    this.dust = new Particles(scene, {max:1400, additive:false, order:8});
    this.list = [];
    /* des anneaux au sol, des rayons, des éclairs */
    this.flatRing = new THREE.RingGeometry(0.82, 1, 48).rotateX(-Math.PI / 2);
    this.beamGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true).rotateX(Math.PI / 2);
    this.arcGeo = new THREE.TorusGeometry(1, 0.05, 6, 32, Math.PI * 0.75);
    this.ballGeo = new THREE.IcosahedronGeometry(1, 2);
    this.meshes = [];
    /* les pierres : celles qui volent, celles qui restent ; les cristaux de glace */
    const rockMat = new THREE.MeshStandardMaterial({color:"#ffffff", roughness:0.92, flatShading:true});
    this.rockIm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMat, 160);
    this.rockIm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.rockIm.count = 0; this.rockIm.castShadow = true; this.rockIm.frustumCulled = false;
    scene.add(this.rockIm); this.rocks = [];
    const iceMat = new THREE.MeshStandardMaterial({color:"#cfefff", roughness:0.15, metalness:0.05, emissive:"#5fb8e8", emissiveIntensity:0.35, transparent:true, opacity:0.88, flatShading:true});
    this.iceIm = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0).scale(0.35, 1.2, 0.35).translate(0, 0.8, 0), iceMat, 60);
    this.iceIm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.iceIm.count = 0; this.iceIm.castShadow = true; this.iceIm.frustumCulled = false;
    scene.add(this.iceIm); this.ice = [];
    this.lights = [];
    this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(); this.S = new THREE.Vector3(); this.C = new THREE.Color();
  }
  /* ---------- d'où part le coup ---------- */
  mouth(e, out = new THREE.Vector3()){
    const h = e.sprite.drawH || e.H, w = e.sprite.width || h * 0.8, f = e.sprite.is3D && e.sprite.mesh ? e.sprite.mesh.rotation.y : e.heading;
    return out.set(e.pos.x + Math.sin(f) * w * 0.42, e.pos.y + h * 0.62, e.pos.z + Math.cos(f) * w * 0.42);
  }
  chest(e, out = new THREE.Vector3()){ const h = e.sprite.drawH || e.H; return out.set(e.pos.x, e.pos.y + h * 0.5, e.pos.z); }
  ground(x, z){ return inWater(x, z) ? Math.max(heightAt(x, z), WATER_Y) : heightAt(x, z); }
  busy(e){ return this.list.some(m=>m.e === e); }
  /* ---------- lancer une capacité : vers un point du sol, ou vers un autre Pokémon ---------- */
  play(e, type, tgt, victim){
    const t = this.game.t, mv = MOVES[type] || MOVES[1];
    const S = e.sprite;
    let clip = "attack";
    if(!mv.dash && !mv.stomp && S.hasClip && S.hasClip("attack2")) clip = "attack2";
    const dur = S.playOnce ? S.playOnce(clip, 1) : 0.6;
    e.busyAnim = t + (dur || 0.6) * 0.95;
    const wind = type === 13 || type === 15 || type === 14 ? 0.55 : 0;           /* la charge d'un Éclair, d'un Laser Glace, d'un Choc Mental */
    const rel = t + wind + Math.max(0.22, Math.min(0.7, (dur || 0.6) * 0.42));
    const m = {type, mv, e, victim, t0:t, rel, tgt:new THREE.Vector3(tgt.x, this.ground(tgt.x, tgt.z), tgt.z), d:{}, hit:false, rock:ROCK[regionAt(e.pos.x, e.pos.z)] || ROCK.route};
    m.from = this.mouth(e);
    m.dist = m.from.distanceTo(m.tgt);
    if(mv.dash){ m.home = e.pos.clone(); }
    this.list.push(m);
    if(this.game.hud && this.game.hud.moveName) this.game.hud.moveName(e, mv.n, type);
    return m;
  }
  /* ---------- les morceaux ---------- */
  ring(at, color, r1, dur, o = {}){
    const m = new THREE.Mesh(this.flatRing, new THREE.MeshBasicMaterial({color, transparent:true, opacity:o.a || 0.9, blending:o.dark ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide}));
    m.position.copy(at); m.position.y += 0.06; m.frustumCulled = false; m.renderOrder = 7; this.scene.add(m);
    this.meshes.push({m, t0:this.game.t + (o.delay || 0), dur, kind:"ring", r0:o.r0 || 0.2, r1, a:o.a || 0.9});
    m.visible = false;
  }
  beam(a, b, color, w, dur, o = {}){
    const mk = (c, k) => { const m = new THREE.Mesh(this.beamGeo, new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})); m.frustumCulled = false; m.renderOrder = 8; this.scene.add(m);
      this.meshes.push({m, t0:this.game.t, dur, kind:"beam", a:a.clone(), b:b.clone(), w:w * k, grow:o.grow || 0.12}); };
    mk(color, 1); mk("#ffffff", 0.4);
  }
  /* un éclair : une ligne brisée, refaite à chaque instant, un cœur blanc dans une gaine colorée */
  bolt(a, b, color, dur, w = 0.09){
    const n = 14, mk = (c, ww, op) => {
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
      const idx = []; for(let i = 0; i < n - 1; i++){ const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide}));
      m.frustumCulled = false; m.renderOrder = 9; this.scene.add(m); return m; };
    this.meshes.push({kind:"bolt", t0:this.game.t, dur, a:a.clone(), b:b.clone(), n, w, ms:[mk(color, w, 0.75), mk("#ffffff", w * 0.35, 1)], next:0});
  }
  arc(at, color, size, dur, o = {}){
    const m = new THREE.Mesh(this.arcGeo, new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.95, blending:o.dark ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide}));
    m.position.copy(at); m.frustumCulled = false; m.renderOrder = 9; m.scale.setScalar(size); m.visible = false; this.scene.add(m);
    this.meshes.push({m, kind:"arc", t0:this.game.t + (o.delay || 0), dur, rx:o.rx || 0, ry:o.ry || 0, sweep:o.sweep || 4});
  }
  orb(color, size, dark){
    const m = new THREE.Mesh(this.ballGeo, new THREE.MeshBasicMaterial({color, transparent:true, opacity:dark ? 0.92 : 0.85, blending:dark ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    m.scale.setScalar(size); m.frustumCulled = false; m.renderOrder = 8; this.scene.add(m);
    return m;
  }
  drop(m){ if(!m) return; this.scene.remove(m); m.material.dispose(); }
  /* une lueur sur le sol et les décors alentour (les lueurs des biomes) */
  light(at, color, base, r, dur){
    const B = this.game.world.biomes; if(!B || calm()) return;
    const l = {p:at.clone().add(V1.set(0, 1.2, 0)), r, c:new THREE.Color(color), k:"fx", base, b0:base, t0:this.game.t, dur};
    B.lights.push(l); this.lights.push(l);
  }
  /* des pierres qui volent (et retombent), ou qui restent */
  rock(at, v, s, color, life, stay){
    if(this.rocks.length >= 160) this.rocks.shift();
    this.rocks.push({p:at.clone(), v:v.clone(), s, c:new THREE.Color(color).multiplyScalar(0.8 + Math.random() * 0.4), r:new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), w:new THREE.Vector3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6)), t:0, life, stay:!!stay, rest:false});
  }
  debris(at, n, color, spd = 4, s = 0.12){ if(calm()) n = Math.ceil(n / 3); for(let i = 0; i < n; i++){ const a = Math.random() * 6.28; this.rock(at, V1.set(Math.cos(a) * spd * rnd(0.3, 1), spd * rnd(0.7, 1.5), Math.sin(a) * spd * rnd(0.3, 1)), s * rnd(0.5, 1.3), color, rnd(1.6, 2.6), false); } }
  crystals(at, n, life){
    for(let i = 0; i < n; i++){
      if(this.ice.length >= 60) this.ice.shift();
      const a = i / n * 6.28 + Math.random(), d = i ? rnd(0.3, 1.1) : 0, x = at.x + Math.cos(a) * d, z = at.z + Math.sin(a) * d;
      this.ice.push({x, y:this.ground(x, z) - 0.05, z, s:(i ? rnd(0.35, 0.7) : 0.9) * rnd(0.85, 1.15), ry:Math.random() * 6, rx:Math.cos(a) * (i ? 0.45 : 0.05), rz:Math.sin(a) * (i ? 0.45 : 0.05), t0:this.game.t + i * 0.05, life});
    }
  }
  /* ---------- les bruits ---------- */
  sfx(kind, at){
    const A = this.game.audio; if(!A || !A.ok) return;
    const s = A.spatial(at); if(s.att <= 0.02) return;
    const v = s.att, p = s.pan;
    switch(kind){
      case "fire": A.burst({freq:500, q:0.5, dur:1.0, vol:0.22 * v, type:"lowpass", pan:p, attack:0.08, sweep:0.6}); A.burst({freq:2200, q:0.4, dur:0.8, vol:0.05 * v, pan:p, attack:0.1}); break;
      case "water": A.burst({freq:1600, q:0.6, dur:0.7, vol:0.14 * v, pan:p, attack:0.03, sweep:0.6}); break;
      case "splash": A.splash(at, 0.9 * v + 0.1); break;
      case "zap": for(let i = 0; i < 6; i++) A.burst({freq:5000 + Math.random() * 3000, q:2, dur:0.03, vol:0.08 * v, type:"highpass", pan:p, attack:0.001}); break;
      case "thunder": A.burst({freq:3800, q:0.5, dur:0.12, vol:0.25 * v, type:"highpass", pan:p, attack:0.001}); A.burst({freq:140, q:0.4, dur:1.4, vol:0.38 * v, type:"lowpass", pan:p, attack:0.02}); break;
      case "boom": A.burst({freq:110, q:0.5, dur:0.7, vol:0.4 * v, type:"lowpass", pan:p, attack:0.005}); A.burst({freq:900, q:0.6, dur:0.15, vol:0.1 * v, pan:p}); break;
      case "thud": A.burst({freq:240, q:0.6, dur:0.2, vol:0.25 * v, type:"lowpass", pan:p}); break;
      case "whoosh": A.burst({freq:700, q:1.1, dur:0.45, vol:0.16 * v, pan:p, attack:0.04, sweep:3}); break;
      case "wind": A.burst({freq:500, q:0.7, dur:1.8, vol:0.14 * v, pan:p, attack:0.4, sweep:1.8}); break;
      case "slash": A.burst({freq:2600, q:1.4, dur:0.16, vol:0.16 * v, pan:p, attack:0.01, sweep:-0.6}); break;
      case "clang": A.tone({freq:1900, to:1700, dur:0.35, vol:0.08 * v, type:"square", pan:p}); A.tone({freq:2850, to:2600, dur:0.25, vol:0.05 * v, type:"triangle", pan:p}); A.burst({freq:6000, q:2, dur:0.05, vol:0.08 * v, type:"highpass", pan:p}); break;
      case "ice": for(let i = 0; i < 4; i++) A.tone({freq:2000 + i * 420, to:2400 + i * 380, dur:0.18, vol:0.05 * v, type:"sine", pan:p, delay:i * 0.06}); break;
      case "psy": A.tone({freq:300, to:1200, dur:0.9, vol:0.07 * v, type:"sine", pan:p}); A.tone({freq:450, to:1800, dur:0.9, vol:0.04 * v, type:"sine", pan:p, delay:0.05}); break;
      case "ghost": A.tone({freq:180, to:110, dur:0.9, vol:0.1 * v, type:"triangle", pan:p}); A.tone({freq:240, to:150, dur:0.9, vol:0.05 * v, type:"sine", pan:p, delay:0.08}); break;
      case "goo": for(let i = 0; i < 3; i++) A.tone({freq:240 + Math.random() * 120, to:120, dur:0.12, vol:0.08 * v, type:"sine", pan:p, delay:i * 0.11}); break;
      case "chime": [1318, 1568, 2093, 2637].forEach((f, i)=>A.tone({freq:f, to:f, dur:0.25, vol:0.045 * v, type:"sine", pan:p, delay:i * 0.07})); break;
      case "leaves": A.burst({freq:3400, q:0.6, dur:0.5, vol:0.12 * v, pan:p, attack:0.05}); break;
      case "zip": A.tone({freq:1400, to:3200, dur:0.3, vol:0.05 * v, type:"triangle", pan:p}); break;
      case "charge": A.tone({freq:220, to:660, dur:0.5, vol:0.06 * v, type:"sawtooth", pan:p}); break;
    }
  }
  shake(at, k){ const P = this.game.player; if(!P) return; const d = P.pos.distanceTo(at); if(d < 16) P.shakeK = Math.max(P.shakeK || 0, k * (1 - d / 16)); }
  /* ---------- le coup porte ---------- */
  impact(m){
    m.hit = true;
    const V = m.victim, t = this.game.t;
    if(V && V.state !== "held" && V.state !== "caught" && V.state !== "gone"){
      V.flashT = t;
      if(V.sprite.hasClip && V.sprite.hasClip("hurt")){ const dd = V.sprite.playOnce("hurt", 1); V.busyAnim = t + dd * 0.9; }
      const dx = V.pos.x - m.e.pos.x, dz = V.pos.z - m.e.pos.z, L = Math.hypot(dx, dz) || 1;
      V.knock = {x:dx / L, z:dz / L, t};
    }
  }
  /* ---------- à chaque image ---------- */
  update(dt, t, cam){
    const fog = this.scene.fog;
    for(let i = this.list.length - 1; i >= 0; i--){
      const m = this.list[i];
      let done = false;
      try { done = this.step(m, t, dt); } catch(err){ console.warn("capacité", err); done = true; }
      if(done || t - m.t0 > 9){ this.list.splice(i, 1); if(m.d.orb) this.drop(m.d.orb); if(m.d.core) this.drop(m.d.core); }
    }
    this.meshesUpdate(t, cam);
    this.rocksUpdate(dt, t);
    this.iceUpdate(t);
    for(let i = this.lights.length - 1; i >= 0; i--){
      const l = this.lights[i], k = (t - l.t0) / l.dur;
      if(k >= 1){ const B = this.game.world.biomes; if(B) B.lights = B.lights.filter(x=>x !== l); this.lights.splice(i, 1); continue; }
      l.base = l.b0 * (k < 0.08 ? k / 0.08 : 1 - (k - 0.08) / 0.92);
    }
    this.glow.update(dt, cam, fog); this.dust.update(dt, cam, fog);
  }
  meshesUpdate(t, cam){
    for(let i = this.meshes.length - 1; i >= 0; i--){
      const o = this.meshes[i], k = (t - o.t0) / o.dur;
      if(k >= 1){ if(o.ms) o.ms.forEach(m=>{ this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); else this.drop(o.m); this.meshes.splice(i, 1); continue; }
      if(k < 0){ continue; }
      if(o.kind === "ring"){ o.m.visible = true; const r = o.r0 + (o.r1 - o.r0) * (1 - Math.pow(1 - k, 2.2)); o.m.scale.set(r, 1, r); o.m.material.opacity = o.a * (1 - k); }
      else if(o.kind === "beam"){
        const reach = Math.min(1, k / o.grow), w = o.w * (k < 0.8 ? 1 : (1 - k) / 0.2) * (0.85 + 0.15 * Math.sin(t * 60));
        const dir = V1.subVectors(o.b, o.a), L = dir.length();
        o.m.position.copy(o.a).addScaledVector(dir, reach * 0.5); o.m.lookAt(V2.copy(o.a).add(dir)); o.m.scale.set(w, w, Math.max(0.01, L * reach));
      } else if(o.kind === "bolt"){
        if(t >= o.next){
          o.next = t + 0.045;
          const side = V3.subVectors(cam.position, o.a).cross(V2.subVectors(o.b, o.a)).normalize();
          for(const [j, m] of o.ms.entries()){
            const P = m.geometry.attributes.position.array, ww = j ? o.w * 0.35 : o.w;
            for(let s = 0; s < o.n; s++){
              const f = s / (o.n - 1), j2 = s === 0 || s === o.n - 1 ? 0 : 1;
              const p = V1.lerpVectors(o.a, o.b, f);
              if(!j) o["j" + s] = [(Math.random() - 0.5) * 0.9 * j2, (Math.random() - 0.5) * 0.6 * j2, (Math.random() - 0.5) * 0.9 * j2];
              const J = o["j" + s] || [0, 0, 0]; p.x += J[0]; p.y += J[1]; p.z += J[2];
              P[s * 6] = p.x + side.x * ww; P[s * 6 + 1] = p.y + side.y * ww; P[s * 6 + 2] = p.z + side.z * ww;
              P[s * 6 + 3] = p.x - side.x * ww; P[s * 6 + 4] = p.y - side.y * ww; P[s * 6 + 5] = p.z - side.z * ww;
            }
            m.geometry.attributes.position.needsUpdate = true; m.material.opacity = (j ? 1 : 0.75) * (Math.random() < 0.15 ? 0.3 : 1) * (1 - k * 0.6);
          }
        }
      } else if(o.kind === "arc"){
        o.m.visible = true; o.m.rotation.set(o.rx, o.ry, -1.2 + k * o.sweep); o.m.material.opacity = 0.95 * (1 - k);
      }
    }
  }
  rocksUpdate(dt, t){
    let n = 0; const M = this.M;
    for(let i = this.rocks.length - 1; i >= 0; i--){ const r = this.rocks[i]; r.t += dt; if(r.t > r.life) this.rocks.splice(i, 1); }
    for(const r of this.rocks){
      if(!r.rest){
        r.v.y -= 14 * dt; r.p.addScaledVector(r.v, dt); r.r.x += r.w.x * dt; r.r.y += r.w.y * dt; r.r.z += r.w.z * dt;
        const g = this.ground(r.p.x, r.p.z) + r.s * 0.55;
        if(r.p.y < g){ r.p.y = g; if(Math.abs(r.v.y) < 2.2){ r.rest = true; } else { r.v.y *= -0.32; r.v.x *= 0.5; r.v.z *= 0.5; r.w.multiplyScalar(0.5); } }
        if(r.lev){ /* soulevée par un Choc Mental */ }
      }
      /* celles qui restent s'enfoncent à la fin */
      const sink = r.stay ? Math.max(0, (r.t - r.life + 4) / 4) : Math.max(0, (r.t - r.life + 0.4) / 0.4);
      this.Q.setFromEuler(r.r); this.S.setScalar(Math.max(0.001, r.s * (1 - sink)));
      M.compose(V1.set(r.p.x, r.p.y - (r.stay ? sink * r.s : 0), r.p.z), this.Q, this.S);
      this.rockIm.setMatrixAt(n, M); this.rockIm.setColorAt(n, r.c); n++;
    }
    this.rockIm.count = n; this.rockIm.instanceMatrix.needsUpdate = true; if(this.rockIm.instanceColor) this.rockIm.instanceColor.needsUpdate = true;
  }
  iceUpdate(t){
    let n = 0;
    this.ice = this.ice.filter(c=>t - c.t0 < c.life);
    for(const c of this.ice){
      const k = t - c.t0; if(k < 0) continue;
      const grow = Math.min(1, k / 0.25), melt = Math.max(0, (k - c.life * 0.6) / (c.life * 0.4));
      const s = c.s * grow * (1 - melt * 0.9);
      this.E.set(c.rx, c.ry, c.rz); this.Q.setFromEuler(this.E); this.S.set(s, s * (1 - melt * 0.4), s);
      this.M.compose(V1.set(c.x, c.y, c.z), this.Q, this.S); this.iceIm.setMatrixAt(n++, this.M);
    }
    this.iceIm.count = n; this.iceIm.instanceMatrix.needsUpdate = true;
  }
  /* ---------- chaque capacité, en temps : avant le coup (r < 0), le coup, ce qui reste ---------- */
  step(m, t, dt){
    const r = t - m.rel, e = m.e, d = m.d, G = this.glow, D = this.dust, lo = calm();
    const alive = e.state !== "held" && e.state !== "caught" && e.state !== "gone";
    if(alive) this.mouth(e, m.from);
    const from = m.from, to = m.tgt, dir = V2.subVectors(to, from), L = dir.length() || 1; dir.divideScalar(L);
    const hitPt = m.victim ? this.chest(m.victim, V3) : to;
    switch(m.type){
      /* ---------- FEU, DRAGON : un jet de flammes qui laisse la terre brûlée ---------- */
      case 10: case 16: {
        const drk = m.type === 16, c0 = drk ? "#9a6bff" : "#ffc45a", c1 = drk ? "#2a3cff" : "#e8360a", sp = 10;
        if(r < 0){ if(alive && Math.random() < 0.6) G.emit({x:from.x, y:from.y, z:from.z, s:0.35, life:0.18, c:drk ? "#9fb8ff" : "#ffb347", k:PK.glow}); return false; }
        if(!d.s){ d.s = 1; this.sfx("fire", from); this.light(to, drk ? "#7a5cff" : "#ff6a1a", 2.4, 9, 3.6); }
        if(r < 1.05 && alive){
          const n = lo ? 2 : 6;
          for(let i = 0; i < n; i++){
            const sp2 = sp * rnd(0.85, 1.1), jit = 0.9;
            G.emit({x:from.x, y:from.y, z:from.z, vx:dir.x * sp2 + rnd(-jit, jit), vy:dir.y * sp2 + rnd(-jit, jit) * 0.6 + 0.4, vz:dir.z * sp2 + rnd(-jit, jit),
              life:L / sp2 + rnd(0.05, 0.25), s0:0.22, s1:1.0 + L * 0.07, c:c0, c1, a:drk ? 0.34 : 0.42, k:PK.flame, rot:rnd(-0.4, 0.4), fin:0.05, pow:1.2});
          }
          if(Math.random() < 0.3) D.emit({x:from.x + dir.x * L * 0.6, y:from.y + 0.4, z:from.z + dir.z * L * 0.6, vy:1.2, life:1.4, s0:0.4, s1:1.6, c:"#3a3230", a:0.45, k:PK.smoke});
        }
        if(!m.hit && r > L / sp){ this.impact(m); addMark(drk ? MKK.drake : MKK.scorch, to.x, to.z, 1.4 + Math.min(1.2, (e.H || 1) * 0.35), t); }
        /* au sol, ça brûle encore un peu */
        if(m.hit && r < 3.4){
          const k = 1 - (r - L / sp) / 3.4;
          if(Math.random() < k * (lo ? 0.4 : 1)) for(let i = 0; i < 2; i++){ const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * 1.1;
            G.emit({x:to.x + Math.cos(a) * rr, y:to.y + 0.05, z:to.z + Math.sin(a) * rr, vy:rnd(1, 2.2), life:rnd(0.35, 0.7), s0:0.4, s1:0.12, c:c0, c1, a:0.5 * k, k:PK.flame, rot:rnd(-0.2, 0.2), fin:0.1}); }
          if(Math.random() < k * 0.35) D.emit({x:to.x + rnd(-0.6, 0.6), y:to.y + 0.6, z:to.z + rnd(-0.6, 0.6), vy:rnd(0.8, 1.4), vx:0.2, life:2.2, s0:0.5, s1:2.2, c:"#2a2422", a:0.4, k:PK.smoke, drag:0.3});
        }
        return r > 3.6;
      }
      /* ---------- EAU : un jet en cloche, une gerbe, une flaque qui brille ---------- */
      case 11: {
        const ft = 0.42 + L * 0.03, g = 9.8;
        if(r < 0) return false;
        if(!d.s){ d.s = 1; this.sfx("water", from); }
        if(r < 0.85 && alive){
          for(let i = 0; i < (lo ? 2 : 5); i++){
            const dx = to.x - from.x + rnd(-0.3, 0.3), dy = to.y - from.y, dz = to.z - from.z + rnd(-0.3, 0.3), f2 = ft * rnd(0.92, 1.08);
            D.emit({x:from.x, y:from.y, z:from.z, vx:dx / f2, vy:dy / f2 + 0.5 * g * f2, vz:dz / f2, grav:g, life:f2 + 0.02, s:rnd(0.1, 0.18), c:pick(["#bfe8ff", "#7fd0ff", "#e8f8ff"]), a:0.85, k:PK.drop, fin:0.02, rot:0});
            if(Math.random() < 0.4) G.emit({x:from.x, y:from.y, z:from.z, vx:dx / f2, vy:dy / f2 + 0.5 * g * f2, vz:dz / f2, grav:g, life:f2, s:0.25, c:"#3d8fd0", a:0.35, k:PK.glow});
          }
        }
        if(r > ft && r < ft + 0.85 && Math.random() < 0.8){
          D.burst(V1.set(to.x, to.y + 0.05, to.z), lo ? 1 : 3, {spd:3.2, up:1.6, grav:9.8, life:0.6, s:0.1, cols:["#cfefff", "#ffffff", "#8fd6ff"], k:PK.drop, a:0.85, cone:1.4, floor:to.y});
          if(!d.rp || t > d.rp){ d.rp = t + 0.22; this.ring(to, "#bfe8ff", 1.2, 0.6, {a:0.5}); }
        }
        if(!m.hit && r > ft){ this.impact(m); this.sfx("splash", to); addMark(MKK.wet, to.x, to.z, 1.6 + Math.min(1, (e.H || 1) * 0.3), t); }
        return r > ft + 1.2;
      }
      /* ---------- ÉLECTRIK : il crépite, puis la foudre tombe ---------- */
      case 13: {
        if(r < 0){
          if(alive){ const h = e.sprite.drawH || e.H; for(let i = 0; i < (lo ? 1 : 3); i++){ const a = Math.random() * 6.28, y = Math.random() * h;
            G.emit({x:e.pos.x + Math.cos(a) * h * 0.45, y:e.pos.y + y, z:e.pos.z + Math.sin(a) * h * 0.45, vx:rnd(-1, 1), vy:rnd(-1, 1), vz:rnd(-1, 1), life:0.12, s:rnd(0.15, 0.32), c:pick(["#fff27a", "#ffffff", "#7fe8ff"]), k:PK.spark}); }
            if(!d.c){ d.c = 1; this.sfx("charge", e.pos); }
            if(Math.random() < 0.12){ const a = Math.random() * 6.28; this.bolt(V1.set(e.pos.x + Math.cos(a) * h * 0.5, e.pos.y + h * rnd(0.2, 0.9), e.pos.z + Math.sin(a) * h * 0.5), V2.set(e.pos.x + Math.cos(a + 1) * h * 0.5, e.pos.y + h * rnd(0.2, 0.9), e.pos.z + Math.sin(a + 1) * h * 0.5), "#7fe8ff", 0.09, 0.03); }
          }
          return false;
        }
        if(!d.s){
          d.s = 1; const P = hitPt.clone();
          this.bolt(from, P, "#7fd8ff", 0.32, 0.1);
          this.bolt(V1.set(P.x + rnd(-1, 1), P.y + 14, P.z + rnd(-1, 1)), P, "#fff27a", 0.4, 0.16);
          this.light(to, "#bfe8ff", 4.5, 14, 0.7);
          this.sfx("zap", from); this.sfx("thunder", to);
          G.burst(V1.copy(P), lo ? 8 : 26, {spd:5, life:0.45, s:0.3, cols:["#fff27a", "#ffffff", "#7fe8ff"], k:PK.spark, grav:6});
          this.ring(to, "#bfe8ff", 2.6, 0.5);
          this.impact(m); addMark(MKK.volt, to.x, to.z, 1.5 + Math.min(1, (e.H || 1) * 0.3), t);
          this.shake(to, 0.7);
        }
        if(r < 0.8 && Math.random() < 0.5) G.emit({x:to.x + rnd(-0.8, 0.8), y:to.y + 0.1, z:to.z + rnd(-0.8, 0.8), vy:rnd(0.5, 2), life:0.2, s:0.2, c:"#9fe8ff", k:PK.spark});
        return r > 1.0;
      }
      /* ---------- GLACE : un rayon bleu pâle, des cristaux qui poussent et fondent, le givre ---------- */
      case 15: {
        if(r < 0){ if(alive && Math.random() < 0.7) D.emit({x:from.x + rnd(-0.2, 0.2), y:from.y, z:from.z + rnd(-0.2, 0.2), vy:0.3, life:0.6, s0:0.15, s1:0.5, c:"#e8f6ff", a:0.5, k:PK.smoke}); if(!d.c){ d.c = 1; this.sfx("ice", from); } return false; }
        if(!d.s){ d.s = 1; this.beam(from, hitPt, "#8fdcff", 0.16, 0.8); this.light(to, "#9fdcff", 2.2, 10, 1.4); }
        if(r < 0.7) for(let i = 0; i < (lo ? 1 : 3); i++){ const f = Math.random();
          G.emit({x:from.x + (hitPt.x - from.x) * f, y:from.y + (hitPt.y - from.y) * f, z:from.z + (hitPt.z - from.z) * f, vx:rnd(-0.4, 0.4), vy:rnd(-0.2, 0.4), vz:rnd(-0.4, 0.4), life:0.4, s:rnd(0.12, 0.24), c:pick(["#ffffff", "#bfeaff"]), k:PK.spark}); }
        if(!m.hit && r > 0.12){ this.impact(m); this.crystals(to, lo ? 4 : 7, 26); addMark(MKK.frost, to.x, to.z, 2.0, t); this.sfx("ice", to);
          G.burst(V1.set(to.x, to.y + 0.4, to.z), lo ? 6 : 18, {spd:3, life:0.7, s:0.18, cols:["#ffffff", "#bfeaff"], k:PK.shard, grav:5}); }
        return r > 1.1;
      }
      /* ---------- PLANTE : des feuilles tranchantes qui tourbillonnent ---------- */
      case 12: {
        if(r < 0) return false;
        if(!d.s){ d.s = 1; this.sfx("leaves", from); this.sfx("whoosh", from); }
        const sp = 9;
        if(r < 0.55 && alive && Math.random() < 0.9){
          const side = V1.set(-dir.z, 0, dir.x);
          for(let i = 0; i < (lo ? 1 : 2); i++){ const w = rnd(-1, 1);
            D.emit({x:from.x, y:from.y, z:from.z, vx:dir.x * sp + side.x * w * 2.2, vy:dir.y * sp + rnd(-0.5, 0.8), vz:dir.z * sp + side.z * w * 2.2, life:L / sp + 0.1, s:rnd(0.2, 0.3), c:pick(["#5fbf3a", "#8ade4a", "#3e9a2a"]), k:PK.leaf, spin:rnd(14, 22) * (Math.random() < 0.5 ? -1 : 1), fin:0.05}); }
        }
        if(!m.hit && r > L / sp){ this.impact(m); addMark(MKK.leaves, to.x, to.z, 1.6, t);
          D.burst(V1.set(to.x, to.y + 0.3, to.z), lo ? 5 : 16, {spd:3, up:1.4, grav:2.5, drag:1.2, life:1.6, s:0.22, cols:["#5fbf3a", "#9ad84a", "#c8b84a"], k:PK.leaf, spin:8, floor:to.y + 0.02}); this.sfx("leaves", to); }
        return r > L / sp + 1.6;
      }
      /* ---------- FÉE : un vent d'étincelles roses, et des fleurs poussent ---------- */
      case 18: {
        if(r < 0) return false;
        if(!d.s){ d.s = 1; this.sfx("chime", from); }
        const sp = 6;
        if(r < 0.9 && alive){
          const side = V1.set(-dir.z, 0, dir.x), ph = r * 14;
          G.emit({x:from.x + side.x * Math.sin(ph) * 0.4, y:from.y + Math.cos(ph) * 0.3, z:from.z + side.z * Math.sin(ph) * 0.4, vx:dir.x * sp, vy:dir.y * sp + 0.3, vz:dir.z * sp, life:L / sp + 0.2, s:rnd(0.18, 0.32), c:pick(["#ffb3e0", "#ffffff", "#ffd6f0", "#d8b0ff"]), k:Math.random() < 0.25 ? PK.heart : PK.spark, spin:rnd(-3, 3)});
        }
        if(!m.hit && r > L / sp){ this.impact(m); addMark(MKK.bloom, to.x, to.z, 1.9, t); this.light(to, "#ff9ad8", 1.6, 8, 2.4);
          G.burst(V1.set(to.x, to.y + 0.4, to.z), lo ? 6 : 20, {spd:2, up:1.5, grav:-0.5, drag:1, life:1.4, s:0.24, cols:["#ffb3e0", "#ffffff", "#d8b0ff"], k:PK.heart}); this.sfx("chime", to); }
        return r > L / sp + 1.5;
      }
      /* ---------- VOL : une tornade qui avance et soulève tout ---------- */
      case 3: {
        if(r < 0) return false;
        if(!d.s){ d.s = 1; this.sfx("wind", from); d.p = new THREE.Vector3(e.pos.x + dir.x * 1.2, 0, e.pos.z + dir.z * 1.2); }
        const T = 1.6, k = Math.min(1, r / T);
        const px = d.p.x + (to.x - d.p.x) * k, pz = d.p.z + (to.z - d.p.z) * k, gy = this.ground(px, pz);
        if(r < T + 0.6){
          const fade = r > T ? 1 - (r - T) / 0.6 : Math.min(1, r / 0.2);
          for(let i = 0; i < (lo ? 2 : 6); i++){
            const h = Math.random() * 3.4, a = t * 9 + Math.random() * 6.28, rad = 0.25 + h * 0.32;
            D.emit({x:px + Math.cos(a) * rad, y:gy + h, z:pz + Math.sin(a) * rad, vx:-Math.sin(a) * 6 * rad, vy:1.4, vz:Math.cos(a) * 6 * rad, drag:4, life:0.32, s0:0.35 + h * 0.18, s1:0.6 + h * 0.25, c:pick(["#cfc6b0", "#e0dbc8", "#b8ae98"]), a:0.32 * fade, k:PK.smoke});
          }
          if(Math.random() < 0.5 * fade) D.emit({x:px + rnd(-0.5, 0.5), y:gy + rnd(0.2, 2.5), z:pz + rnd(-0.5, 0.5), vx:rnd(-3, 3), vy:rnd(1, 3), vz:rnd(-3, 3), life:0.8, s:0.16, c:pick(["#6fae3a", "#a8c050", "#8a7a50"]), k:PK.leaf, spin:15});
          if(!d.mk || t > d.mk){ d.mk = t + 0.4; addMark(MKK.scuff, px, pz, 1.1, t, {life:30}); }
        }
        if(!m.hit && r > T * 0.9){ this.impact(m); }
        return r > T + 0.7;
      }
      /* ---------- POISON : une boule de boue violette en cloche, une mare qui bouillonne ---------- */
      case 4: {
        const ft = 0.6;
        if(r < 0) return false;
        if(!d.s){ d.s = 1; d.orb = this.orb("#8a2ad0", 0.24, true); d.core = this.orb("#d070ff", 0.16, false); this.sfx("goo", from); d.f0 = from.clone(); }
        if(r < ft){
          const k = r / ft, P = V1.lerpVectors(d.f0, hitPt, k); P.y += Math.sin(Math.PI * k) * (1.2 + L * 0.12);
          d.orb.position.copy(P); d.core.position.copy(P); d.orb.scale.setScalar(0.24 + Math.sin(t * 30) * 0.02);
          if(Math.random() < 0.7) D.emit({x:P.x, y:P.y, z:P.z, vy:-0.5, grav:6, life:0.4, s:0.1, c:"#7a1ab8", a:0.85, k:PK.drop});
        } else if(!m.hit){
          this.impact(m); this.drop(d.orb); this.drop(d.core); d.orb = d.core = null;
          D.burst(V1.set(to.x, to.y + 0.1, to.z), lo ? 6 : 22, {spd:3.4, up:1.2, grav:9, life:0.7, s:0.14, cols:["#7a1ab8", "#a040e0", "#5a0a90"], k:PK.drop, a:0.9, floor:to.y});
          addMark(MKK.poison, to.x, to.z, 1.6, t); this.sfx("goo", to); this.light(to, "#b04aff", 1.4, 7, 3);
        }
        if(m.hit && r < ft + 3 && Math.random() < 0.3) G.emit({x:to.x + rnd(-0.8, 0.8), y:to.y + 0.05, z:to.z + rnd(-0.8, 0.8), vy:rnd(0.3, 0.7), life:0.9, s:rnd(0.12, 0.25), c:"#c060ff", a:0.7, k:PK.bubble});
        return r > ft + 3;
      }
      /* ---------- SOL : il frappe du pied, la terre ondule, des pics jaillissent, ça se fend ---------- */
      case 5: {
        if(r < 0){ if(alive){ e.stompK = Math.max(0, Math.min(1, (r + 0.4) / 0.4)); } return false; }
        if(!d.s){ d.s = 1; e.stompK = 0; this.sfx("boom", e.pos); this.shake(e.pos, 0.5); this.ring(V1.set(e.pos.x, this.ground(e.pos.x, e.pos.z), e.pos.z), "#c9a86a", 2.2, 0.5, {a:0.6, dark:true});
          D.burst(V1.set(e.pos.x, this.ground(e.pos.x, e.pos.z) + 0.1, e.pos.z), lo ? 4 : 12, {spd:2.4, up:0.6, life:1.4, s0:0.4, s1:1.4, cols:["#a89070", "#8a7860"], a:0.5, k:PK.smoke, drag:1.5}); }
        const T = 0.7, k = Math.min(1, r / T);
        const steps = 6;
        for(let s = 1; s <= steps; s++){
          const f = s / steps, key = "p" + s;
          if(!d[key] && k >= f){
            d[key] = 1; const x = e.pos.x + (to.x - e.pos.x) * f, z = e.pos.z + (to.z - e.pos.z) * f, y = this.ground(x, z);
            this.rock(V1.set(x, y - 0.2, z), V2.set(rnd(-0.6, 0.6), rnd(4.5, 6.5), rnd(-0.6, 0.6)), rnd(0.18, 0.32) * (0.7 + f * 0.5), m.rock, 2, false);
            D.burst(V1.set(x, y + 0.1, z), lo ? 1 : 4, {spd:1.6, up:1.4, life:1.1, s0:0.3, s1:1.1, cols:["#a89070", "#8a7860"], a:0.45, k:PK.smoke, drag:1.8});
          }
        }
        if(!m.hit && k >= 1){ this.impact(m); addMark(MKK.crack, to.x, to.z, 2.3, t); this.sfx("boom", to); this.shake(to, 0.9);
          this.debris(to, 10, m.rock, 4.5, 0.16); D.burst(V1.set(to.x, to.y + 0.2, to.z), lo ? 5 : 16, {spd:3, up:0.9, life:1.8, s0:0.5, s1:1.8, cols:["#a89070", "#8a7860", "#6a5a48"], a:0.55, k:PK.smoke, drag:1.6}); }
        return r > 1.6;
      }
      /* ---------- ROCHE : trois pierres lancées en cloche, qui restent là ---------- */
      case 6: {
        if(r < 0) return false;
        if(!d.s){ d.s = 1; this.sfx("whoosh", from); d.st = [0, 1, 2].map(i=>({tx:to.x + rnd(-0.9, 0.9), tz:to.z + rnd(-0.9, 0.9), at:i * 0.16, done:false})); }
        for(const s of d.st){
          if(s.done || r < s.at) continue;
          if(!s.r){ const ft = 0.7, tx = s.tx, tz = s.tz, ty = this.ground(tx, tz), dx = tx - from.x, dz = tz - from.z, dy = ty - from.y - 0.3;
            this.rock(V1.set(from.x, from.y + 0.3, from.z), V2.set(dx / ft, dy / ft + 0.5 * 14 * ft, dz / ft), rnd(0.32, 0.5), m.rock, 45, true); s.r = this.rocks[this.rocks.length - 1]; }
          if(s.r && s.r.rest && !s.done){ s.done = true; this.sfx("thud", s.r.p); this.shake(s.r.p, 0.35); addMark(MKK.crack, s.r.p.x, s.r.p.z, 1.1, t, {life:45});
            D.burst(V1.copy(s.r.p), lo ? 3 : 9, {spd:2, up:0.8, life:1.3, s0:0.3, s1:1.2, cols:["#a89070", "#8a7860"], a:0.5, k:PK.smoke, drag:1.6}); this.debris(s.r.p, 4, m.rock, 3, 0.07); if(!m.hit) this.impact(m); }
        }
        return d.st.every(s=>s.done) || r > 3;
      }
      /* ---------- COMBAT, NORMAL, ACIER, TÉNÈBRES : il s'élance et frappe ---------- */
      case 1: case 2: case 9: case 17: {
        if(!m.home) m.home = e.pos.clone();
        const goT = 0.22, back = 0.55;
        const stop = V1.copy(m.victim ? m.victim.pos : to); const toS = V2.subVectors(stop, m.home); const Ls = toS.length() || 1;
        const reach = m.home.clone().addScaledVector(toS, Math.max(0, (Ls - (m.victim ? (m.victim.sprite.width || 1) * 0.5 + 0.4 : 0.6))) / Ls);
        if(r < 0){ if(m.type === 2 && alive && Math.random() < 0.5) G.emit({x:from.x, y:from.y, z:from.z, s:0.4, life:0.15, c:"#ffb070", k:PK.glow}); return false; }
        if(alive){
          if(r < goT){ e.pos.lerpVectors(m.home, reach, r / goT); if(Math.random() < 0.8) D.emit({x:e.pos.x, y:this.ground(e.pos.x, e.pos.z) + 0.1, z:e.pos.z, vy:0.5, life:0.8, s0:0.25, s1:0.9, c:"#b8a888", a:0.4, k:PK.smoke, drag:2}); }
          else if(r < goT + back){ const k = (r - goT) / back; e.pos.lerpVectors(reach, m.home, k * k * (3 - 2 * k)); if(!d.hb){ d.hb = 1; e.hop = t; } }
          else e.pos.copy(m.home);
          e.pos.y = this.ground(e.pos.x, e.pos.z);
        }
        if(!m.hit && r >= goT){
          this.impact(m);
          const at = m.victim ? this.chest(m.victim, V1).clone() : V1.set(reach.x + (to.x - reach.x) * 0.5, this.ground(to.x, to.z) + 0.5, reach.z + (to.z - reach.z) * 0.5).clone();
          const gx = at.x, gz = at.z;
          if(m.type === 1){ D.burst(V3.set(gx, this.ground(gx, gz) + 0.15, gz), lo ? 4 : 14, {spd:2.6, up:0.7, life:1.4, s0:0.4, s1:1.3, cols:["#c8b898", "#a89878"], a:0.5, k:PK.smoke, drag:1.8});
            G.burst(at, lo ? 4 : 10, {spd:3.5, life:0.3, s:0.25, cols:["#ffffff", "#fff2c0"], k:PK.spark}); addMark(MKK.scuff, gx, gz, 1.3, t); this.sfx("thud", at); this.shake(at, 0.35); }
          else if(m.type === 2){ this.ring(V3.set(gx, this.ground(gx, gz), gz), "#ffd2a0", 2.4, 0.45); G.burst(at, lo ? 6 : 18, {spd:5, life:0.35, s:0.35, cols:["#ffffff", "#ffb070"], k:PK.spark});
            addMark(MKK.crack, gx, gz, 1.6, t); this.debris(V3.set(gx, this.ground(gx, gz), gz), 8, m.rock, 4, 0.12); this.sfx("boom", at); this.shake(at, 0.6); }
          else if(m.type === 9){ const ry = Math.atan2(dir.x, dir.z);
            for(let i = 0; i < 3; i++) this.arc(V3.set(at.x, at.y + 0.1 - i * 0.15, at.z), "#e8f0ff", 0.8, 0.28, {ry, rx:0.3, delay:i * 0.04, sweep:5});
            G.burst(at, lo ? 6 : 20, {spd:5, life:0.4, s:0.2, cols:["#ffffff", "#ffe08a", "#c8d8ff"], k:PK.spark, grav:9});
            addMark(MKK.claw, gx, gz, 1.3, t, {ang:-ry + Math.PI / 2, heat:1.2}); this.sfx("clang", at); }
          else { const ry = Math.atan2(dir.x, dir.z);
            this.arc(V3.set(at.x, at.y + 0.1, at.z), "#2a0a3a", 1.0, 0.35, {ry, rx:0.2, sweep:5, dark:true}); this.arc(V3.set(at.x, at.y + 0.1, at.z), "#9a5aff", 1.08, 0.3, {ry, rx:0.2, sweep:5});
            D.burst(at, lo ? 4 : 14, {spd:2.4, life:0.8, s0:0.3, s1:0.8, cols:["#2a1a3a", "#3a2050"], a:0.6, k:PK.smoke, drag:2});
            addMark(MKK.claw, gx, gz, 1.4, t, {ang:-ry + Math.PI / 2, heat:0}); this.sfx("slash", at); }
        }
        return r > goT + back + 0.2;
      }
      /* ---------- INSECTE : des fils de soie qui filent, une toile au sol ---------- */
      case 7: {
        if(r < 0) return false;
        if(!d.s){ d.s = 1; this.sfx("zip", from); }
        const sp = 14;
        if(r < 0.5 && alive) for(let i = 0; i < (lo ? 3 : 8); i++){
          const f = Math.random() * 0.15;
          D.emit({x:from.x, y:from.y, z:from.z, vx:dir.x * sp + rnd(-0.5, 0.5), vy:dir.y * sp + rnd(-0.2, 0.4), vz:dir.z * sp + rnd(-0.5, 0.5), life:L / sp + f, s:0.07, c:"#f4f6f8", a:0.95, k:PK.glow, fin:0});
        }
        if(!m.hit && r > L / sp){ this.impact(m); addMark(MKK.web, to.x, to.z, 1.6, t); D.burst(V1.set(to.x, to.y + 0.1, to.z), lo ? 4 : 12, {spd:2, up:0.3, life:0.5, s:0.08, c:"#ffffff", k:PK.glow}); }
        return r > L / sp + 0.6;
      }
      /* ---------- SPECTRE : une boule d'ombre qui ondule, et l'ombre reste au sol ---------- */
      case 8: {
        const sp = 7;
        if(r < 0){ if(alive && Math.random() < 0.5) D.emit({x:from.x + rnd(-0.2, 0.2), y:from.y, z:from.z + rnd(-0.2, 0.2), vy:0.3, life:0.5, s0:0.2, s1:0.4, c:"#2a1040", a:0.6, k:PK.smoke}); return false; }
        if(!d.s){ d.s = 1; d.orb = this.orb("#1a0828", 0.32, true); d.core = this.orb("#a060ff", 0.4, false); this.sfx("ghost", from); d.f0 = from.clone(); }
        const T = Math.max(0.4, L / sp);
        if(r < T){
          const k = r / T, P = V1.lerpVectors(d.f0, hitPt, k); P.y += Math.sin(r * 18) * 0.12; P.x += Math.cos(r * 13) * 0.08;
          d.orb.position.copy(P); d.core.position.copy(P); d.core.scale.setScalar(0.38 + Math.sin(t * 20) * 0.05);
          D.emit({x:P.x, y:P.y, z:P.z, vx:rnd(-0.3, 0.3), vy:rnd(0, 0.6), vz:rnd(-0.3, 0.3), life:0.6, s0:0.3, s1:0.6, c:"#2a1040", a:0.5, k:PK.smoke});
          if(Math.random() < 0.5) G.emit({x:P.x, y:P.y, z:P.z, vy:0.6, life:0.5, s:0.18, c:"#b070ff", k:PK.glow});
        } else if(!m.hit){
          this.impact(m); this.drop(d.orb); this.drop(d.core); d.orb = d.core = null;
          D.burst(V1.copy(hitPt), lo ? 6 : 18, {spd:2.6, life:1.2, s0:0.4, s1:1.4, cols:["#1a0828", "#3a1a58"], a:0.6, k:PK.smoke, drag:2});
          G.burst(V1.copy(hitPt), lo ? 4 : 12, {spd:3, life:0.5, s:0.25, cols:["#b070ff", "#7040c0"], k:PK.glow});
          addMark(MKK.shadow, to.x, to.z, 1.8, t); this.sfx("ghost", to); this.light(to, "#8a40ff", 1.6, 8, 2.5);
        }
        return r > T + 1.2;
      }
      /* ---------- PSY : ses yeux brillent, des ondes roses, les cailloux se soulèvent ---------- */
      case 14: {
        if(r < 0){ if(alive){ e.psyK = 1; if(!d.c){ d.c = 1; this.sfx("psy", e.pos); } if(Math.random() < 0.4) G.emit({x:from.x, y:from.y, z:from.z, s:0.4, life:0.2, c:"#ff7ad8", k:PK.glow}); } return false; }
        if(!d.s){ d.s = 1; e.psyK = 0;
          for(let i = 0; i < 3; i++) this.ring(to, "#ff8ae0", 2.2 + i * 0.6, 0.9, {delay:i * 0.18, a:0.7});
          d.peb = []; for(let i = 0; i < (lo ? 3 : 7); i++){ const a = Math.random() * 6.28, rr = rnd(0.3, 1.6), x = to.x + Math.cos(a) * rr, z = to.z + Math.sin(a) * rr;
            this.rock(V1.set(x, this.ground(x, z) + 0.05, z), V2.set(0, 0, 0), rnd(0.08, 0.18), m.rock, 4, false); const R = this.rocks[this.rocks.length - 1]; R.rest = true; R.lev = true; d.peb.push({R, y0:R.p.y, h:rnd(0.8, 1.8)}); }
          this.light(to, "#ff6ad0", 1.8, 9, 2.4); this.impact(m); addMark(MKK.psy, to.x, to.z, 2.2, t);
        }
        if(d.peb){
          for(const p of d.peb){ const R = p.R;
            if(r < 1.6){ const k = Math.min(1, r / 0.6); R.p.y = p.y0 + p.h * k * k * (3 - 2 * k) + Math.sin(t * 3 + p.h * 5) * 0.06; R.r.y += 0.03; R.r.x += 0.02; if(Math.random() < 0.08) G.emit({x:R.p.x, y:R.p.y, z:R.p.z, life:0.3, s:0.2, c:"#ff9ae0", k:PK.glow}); }
            else if(R.rest){ R.rest = false; R.v.set(0, -1, 0); }
          }
        }
        return r > 2.4;
      }
    }
    return true;
  }
  clear(){
    for(const m of this.list){ if(m.d.orb) this.drop(m.d.orb); if(m.d.core) this.drop(m.d.core); }
    this.list.length = 0;
  }
}
