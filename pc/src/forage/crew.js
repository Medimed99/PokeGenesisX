/* ============================================================
   LE FORAGE EN 3D · L'ÉQUIPE AU TRAVAIL
   Chaque Pokémon de l'équipe a son front de taille. Il frappe la
   roche (son attaque, en boucle ; des éclats de la couche volent),
   et de temps en temps il remonte une pépite du minerai de la couche
   au wagonnet, la porte au-dessus de sa tête, l'y jette — un « +⚡ »
   s'envole — puis retourne à son front. Un bon type pour la couche
   frappe plus vite, un mauvais plus lentement : ça se voit.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { monH } from "../expe/team.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();

/* ---------- des éclats de roche : de petits cubes, avec gravité ---------- */
export class Chips {
  constructor(scene, n = 420){
    this.im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color:"#ffffff", roughness:0.9}), n);
    this.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.im.frustumCulled = false; this.im.count = 0;
    this.im.castShadow = false; scene.add(this.im);
    this.p = []; this.n = n; this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(); this.C = new THREE.Color();
  }
  burst(at, k, cols, spd = 2.5, size = 0.07, up = 1, dir = null){
    for(let i = 0; i < k; i++){
      if(this.p.length >= this.n) this.p.shift();
      const a = Math.random() * Math.PI * 2, s = spd * (0.4 + Math.random() * 0.8);
      const v = new THREE.Vector3(Math.cos(a) * s * 0.6, (0.5 + Math.random()) * s * 0.7 * up, Math.sin(a) * s * 0.6);
      if(dir) v.addScaledVector(dir, s * 0.8);
      this.p.push({x:at.x, y:at.y, z:at.z, v, r:Math.random() * 6, w:(Math.random() - 0.5) * 12, s:size * (0.6 + Math.random() * 0.9), life:0, max:0.9 + Math.random() * 0.8, c:cols[i % cols.length]});
    }
  }
  update(dt, ground = 0){
    let n = 0;
    for(let i = this.p.length - 1; i >= 0; i--){
      const q = this.p[i]; q.life += dt;
      if(q.life > q.max){ this.p.splice(i, 1); continue; }
      q.v.y -= 9.8 * dt; q.x += q.v.x * dt; q.y += q.v.y * dt; q.z += q.v.z * dt; q.r += q.w * dt;
      if(q.y < ground + q.s * 0.5){ q.y = ground + q.s * 0.5; q.v.y *= -0.3; q.v.x *= 0.6; q.v.z *= 0.6; q.w *= 0.5; }
    }
    for(const q of this.p){
      const k = 1 - Math.max(0, (q.life - q.max * 0.7) / (q.max * 0.3));
      this.E.set(q.r, q.r * 0.7, 0); this.Q.setFromEuler(this.E);
      this.M.compose(V1.set(q.x, q.y, q.z), this.Q, V2.setScalar(q.s * k));
      this.im.setMatrixAt(n, this.M); this.im.setColorAt(n, this.C.set(q.c)); n++;
    }
    this.im.count = n; this.im.instanceMatrix.needsUpdate = true; if(this.im.instanceColor) this.im.instanceColor.needsUpdate = true;
  }
}

export class Crew {
  constructor(scene, mine, chips){
    this.scene = scene; this.mine = mine; this.chips = chips;
    this.recs = new Map(); this.pops = [];
    this.nugGeo = new THREE.OctahedronGeometry(0.16);
  }
  /* E près d'un mineur : il se retourne, content (rien de plus : l'équipe creuse déjà de son mieux) */
  cheer(r, t){
    if(r.cheer !== undefined && t - r.cheer < 1.6) return;
    r.cheer = t; r.m.setAnim("happy");
    this.chips.burst(V1.set(r.pos.x, r.h + 0.3, r.pos.z), 14, ["#ff8ab4", "#ffd166", "#ffffff"], 1.6, 0.06, 1.6);
    this.pops.push({x:r.pos.x, y:r.h + 0.6, z:r.pos.z, t, txt:"♥", c:"#ff8ab4"});
  }
  dispose(){ for(const r of this.recs.values()) this.drop(r); this.recs.clear(); }
  drop(r){ r.m.dispose(); if(r.nug){ this.scene.remove(r.nug); r.nug.material.dispose(); } }
  /* un trajet autour du trou de la foreuse : un détour s'il le faut */
  path(from, to){
    const A = new THREE.Vector3(from.x, 0, from.z), B = new THREE.Vector3(to.x, 0, to.z), AB = B.clone().sub(A), L2 = AB.lengthSq() || 1;
    const t = Math.max(0, Math.min(1, -A.dot(AB) / L2)), P = A.clone().addScaledVector(AB, t);
    if(P.length() < 3.4 && t > 0.05 && t < 0.95){ const out = P.lengthSq() > 0.01 ? P.clone().normalize() : new THREE.Vector3(-AB.z, 0, AB.x).normalize(); return [out.multiplyScalar(4.4), B]; }
    return [B];
  }
  update(t, dt, cam, env, s){
    const ids = s.crew, seen = new Set(), ORE = s.ore;
    ids.forEach((id, i)=>{
      let r = this.recs.get(id);
      if(!r){
        /* (un peu plus grands que nature : on les voit travailler depuis le milieu de la mine) */
        const shiny = !!(s.dex[id] && s.dex[id].shiny), h = Math.max(0.9, Math.min(2.6, monH(id) * 1.3));
        preloadMon(id, shiny);
        const F = this.mine.facePoint(i, 2.2 + h * 0.35);
        r = {id, i, h, m:makeMon(id, shiny, this.scene, {height:h}), pos:new THREE.Vector3(F.x, 0, F.z), yaw:0, st:"dig", cyc:0, dur:0.8, hit:false, hits:0, need:4, way:[], born:t};
        r.m.uniforms.uGlitch.value = 1;
        this.recs.set(id, r);
      }
      seen.add(id);
      if(r.i !== i){ r.i = i; r.st = "back"; r.way = null; }
      const F = this.mine.facePoint(r.i, 2.2 + r.h * 0.35), M = r.m, U = M.uniforms;
      U.uGlitch.value = Math.max(0, U.uGlitch.value - dt * 1.5);
      const aff = s.aff(id), spd = aff > 1 ? 1.3 : aff < 1 ? 0.75 : 1;
      const wallP = F.wall;
      if(!s.rate) { r.st = r.st === "dig" ? "idle" : r.st; }
      else if(r.st === "idle") r.st = "dig";
      /* encouragé : il se tourne vers soi, content, puis reprend */
      const cheering = r.cheer !== undefined && t - r.cheer < 1.6;
      if(cheering){
        const want = Math.atan2(cam.position.x - r.pos.x, cam.position.z - r.pos.z); let dd = want - r.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); r.yaw += dd * Math.min(1, dt * 8);
        M.setAnim("happy");
      } else if(r.st === "dig" || r.st === "idle"){
        /* à son front, tourné vers la roche */
        r.pos.lerp(V1.set(F.x, 0, F.z), Math.min(1, dt * 3));
        r.yaw = Math.atan2(wallP.x - r.pos.x, wallP.z - r.pos.z);
        if(r.st === "idle"){ M.setAnim("idle"); }
        else {
          r.cyc += dt * spd;
          if(r.cyc >= r.dur + 0.35){
            r.cyc = 0; r.hit = false; r.dur = Math.max(0.45, Math.min(1.6, M.playOnce ? M.playOnce(Math.random() < 0.25 && M.hasClip && M.hasClip("attack2") ? "attack2" : "attack", 1) : 0.8));
          }
          if(!r.hit && r.cyc > r.dur * 0.45){
            r.hit = true; r.hits++;
            /* les éclats : la matière de la couche, et parfois une étincelle du minerai */
            const at = V1.copy(r.pos).lerp(wallP, 0.72); at.y = Math.min(2.2, r.h * 0.55 + 0.2);
            const dir = V2.set(r.pos.x - wallP.x, 0, r.pos.z - wallP.z).normalize();
            if(!s.calm) this.chips.burst(at, aff > 1 ? 9 : 6, s.pal, 2.4, 0.07, 0.8, dir);
            if(s.sfx) s.sfx("hit", at);
            if(Math.random() < 0.3 && ORE && !s.calm) this.chips.burst(at, 3, ORE.pal, 2, 0.05, 1, dir);
            if(r.hits >= r.need){ r.st = "go"; r.hits = 0; r.need = 3 + Math.floor(Math.random() * 4); r.way = null; }
          }
        }
      }
      if(!cheering && (r.st === "go" || r.st === "back")){
        const dest = r.st === "go" ? V2.copy(this.mine.cartPos).add(V1.set(Math.cos(r.i * 1.7) * 1.4, 0, Math.sin(r.i * 1.7) * 1.4)) : V2.set(F.x, 0, F.z);
        if(!r.way) r.way = this.path(r.pos, dest);
        const tgt = r.way[0];
        const d = Math.hypot(tgt.x - r.pos.x, tgt.z - r.pos.z), v = (1.9 + r.h * 0.5) * spd;
        if(d > 0.15){
          r.pos.x += (tgt.x - r.pos.x) / d * Math.min(d, v * dt); r.pos.z += (tgt.z - r.pos.z) / d * Math.min(d, v * dt);
          const want = Math.atan2(tgt.x - r.pos.x, tgt.z - r.pos.z); let dd = want - r.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); r.yaw += dd * Math.min(1, dt * 8);
          M.setAnim("walk");
        } else if(r.way.length > 1) r.way.shift();
        else if(r.st === "go"){
          /* au wagonnet : la pépite y tombe, l'Énergie s'envole */
          if(r.nug){ r.toss = {t, from:r.nug.position.clone()}; }
          if(s.sfx) setTimeout(()=>s.sfx("drop", this.mine.cartPos), 420);
          r.st = "back"; r.way = null;
          const el = Math.min(120, t - (r.lastDrop || r.born)); r.lastDrop = t;
          const e = s.ePerSec(id) * el; if(e > 0) this.pops.push({x:r.pos.x, y:r.h + 0.9, z:r.pos.z, t, txt:"+" + s.fmtE(e) + " ⚡", c:"#ffd166"});
          M.setAnim("happy");
        } else { r.st = "dig"; r.way = null; r.cyc = r.dur + 1; }
      }
      /* la pépite : au-dessus de sa tête pendant le trajet, puis lancée dans le wagonnet */
      const carry = r.st === "go";
      if((carry || r.toss) && !r.nug && ORE){ r.nug = new THREE.Mesh(this.nugGeo, new THREE.MeshStandardMaterial({color:ORE.pal[1], emissive:ORE.pal[1], emissiveIntensity:0.45, metalness:0.4, roughness:0.3})); this.scene.add(r.nug); }
      if(r.nug){
        if(r.toss){
          const k = (t - r.toss.t) / 0.45;
          if(k >= 1){ this.scene.remove(r.nug); r.nug.material.dispose(); r.nug = null; r.toss = null; if(!s.calm) this.chips.burst(V1.copy(this.mine.cartPos).setY(1.2), 6, ORE ? ORE.pal : ["#ffd166"], 1.2, 0.05, 1); }
          else { r.nug.position.lerpVectors(r.toss.from, V1.copy(this.mine.cartPos).setY(1.1), k); r.nug.position.y += Math.sin(Math.PI * k) * 1.2; }
        } else if(carry){ r.nug.position.set(r.pos.x, r.h + 0.35 + Math.sin(t * 6) * 0.05, r.pos.z); r.nug.rotation.y = t * 3; }
        else { this.scene.remove(r.nug); r.nug.material.dispose(); r.nug = null; }
      }
      M.groundY = 0; M.update(t, dt, r.pos, r.yaw, cam.position, env);
      r.head = (r.head || new THREE.Vector3()).set(r.pos.x, r.h + 0.35, r.pos.z);
    });
    for(const [k, r] of this.recs) if(!seen.has(k)){ this.drop(r); this.recs.delete(k); }
    this.pops = this.pops.filter(p=>t - p.t < 1.6);
  }
}
