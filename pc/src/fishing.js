/* ============================================================
   LA PÊCHE AU LAC
   Les mêmes règles que l'étang du jeu mobile (33-fishing.js) : les
   ombres disent la taille de la prise, un reflet doré un chromatique,
   une ombre immobile au fond un trésor ; elles goûtent le bouchon,
   puis le « ! » ; à temps, ça tient toujours, très vite c'est un
   ferrage parfait (+20 % à la capture). Ce qui remonte est tiré par
   le jeu (rollFishSpec, fishLand : statistiques, quêtes, trésors),
   puis saute hors de l'eau et retombe sur la rive, devant toi :
   à toi de le capturer.
   Chaque biome a aussi son eau (ponds.js) : la source de la Sylve,
   la grande vasque des Nappes, le lac souterrain des Cavités, le
   bassin d'index des Ruines, la coulée du Foyer (on y pêche dans la
   lave). Même pêche, mais ce qui mord vient du vivier de l'endroit,
   et une partie ne vit que là.
   ============================================================ */
import * as THREE from "three";
import { LAKE, WATER_Y, heightAt, lakeAt, inWater, lakeShore, terrace, lavaAt } from "./world/layout.js";
import { PONDS } from "./world/ponds.js";
import { rollRegion, activeRegions, regionOf } from "./mon/region.js";
import { FISH_MAX } from "./world/water.js";
import { MonSprite, realHeight } from "./mon/sprites.js";
import { preloadMon } from "./mon/model3d.js";

const G = () => window.PCG;
const GRACE = 0.3;
const SIZE = [0.62, 0.74, 0.9, 1.1, 1.32, 1.7];

export class Fishing {
  constructor(game){
    this.game = game; this.active = false; this.st = "idle"; this.shadows = []; this.nextSpawn = 0;
    const cam = game.engine.camera;
    /* la canne, tenue en main */
    this.rod = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.014, 1.35, 8), new THREE.MeshStandardMaterial({color:"#7a5230", roughness:0.6}));
    shaft.position.y = 0.62; this.rod.add(shaft);
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), new THREE.MeshStandardMaterial({color:"#9aa6b8", metalness:0.6, roughness:0.35}));
    reel.rotation.z = Math.PI / 2; reel.position.set(0.03, 0.12, 0); this.rod.add(reel);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.22, 8), new THREE.MeshStandardMaterial({color:"#3a2a1a", roughness:0.9}));
    grip.position.y = 0.0; this.rod.add(grip);
    this.tipLocal = new THREE.Vector3(0, 1.29, 0);
    this.rod.position.set(0.26, -0.3, -0.42); this.rod.rotation.set(-0.95, 0.05, -0.12);
    this.rod.visible = false; cam.add(this.rod);
    /* le fil et le bouchon */
    this.lineGeo = new THREE.BufferGeometry(); this.linePts = new Float32Array(16 * 3);
    this.lineGeo.setAttribute("position", new THREE.BufferAttribute(this.linePts, 3));
    this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({color:"#e8f2ff", transparent:true, opacity:0.75}));
    this.line.frustumCulled = false; this.line.visible = false; game.engine.scene.add(this.line);
    this.bob = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color:"#ff3b3b", roughness:0.4}));
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({color:"#f4f4f4", roughness:0.4}));
    this.bob.add(top, bot); this.bob.visible = false; game.engine.scene.add(this.bob);
    this.tmp = new THREE.Vector3();
  }
  rodDef(){ const g = G(); return g && g.S.rod ? g.RODS[g.S.rod - 1] : null; }
  /* ---------- les eaux : le lac, et celle de chaque biome ---------- */
  waters(){
    if(this._w) return this._w;
    const self = this;
    const lake = {k:"lac", n:"Le lac", kind:"lake", x:LAKE.x, z:LAKE.z, get surf(){ return self.game.world.lake; },
      inside:(x, z)=>this.inLake(x, z), wet:(x, z)=>inWater(x, z), far:60,
      near:p=>{ for(let a = 0; a < 6.28; a += 0.5) for(const r of [1.5, 3, 4.5]) if(inWater(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r)) return true; return false; },
      spawn:()=>{ for(let k = 0; k < 30; k++){ const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.8, x = LAKE.x + Math.cos(a) * LAKE.rx * r, z = LAKE.z + Math.sin(a) * LAKE.rz * r; if(this.inLake(x, z)) return {x, z}; } return null; },
      roll:()=>{ const g = G(), S = g.S, keep = S.region; S.region = rollRegion(); try { return window.rollFishSpec(); } catch(e){ return null; } finally { S.region = keep; } }};
    this._w = [lake];
    for(const P of PONDS){
      if(!P.surf) continue;
      const lava = P.kind === "lava";
      this._w.push({k:P.k, n:P.n, kind:P.kind, lava, x:P.x, z:P.z, surf:P.surf, far:50, pond:P,
        inside:(x, z)=>Math.hypot(x - P.x, z - P.z) < P.r * 0.8,
        wet:(x, z)=>P.kind === "basin" ? Math.hypot(x - P.x, z - P.z) < P.r + 0.8 : lava ? lavaAt(x, z) > 0.15 : (Math.hypot(x - P.x, z - P.z) < P.r + 0.2 || terrace(x, z).level - heightAt(x, z) > 0.06),
        near:p=>Math.hypot(p.x - P.x, p.z - P.z) < P.r + (lava ? 5 : P.kind === "basin" ? 3.6 : 3.4),
        spawn:()=>{ const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * P.r * 0.7; return {x:P.x + Math.cos(a) * r, z:P.z + Math.sin(a) * r}; },
        roll:()=>this.rollPond(P)});
    }
    return this._w;
  }
  /* ce qui mord dans l'eau d'un biome : la rareté comme au lac (la canne la pousse), l'espèce dans le vivier de l'endroit */
  rollPond(P){
    const g = G(), r = n => g.ref(n);
    try {
      if(Math.random() < 0.07) return {kind:"treasure"};
      const rod = this.rodDef() || g.RODS[0];
      let rar = r("rollRarity")(); if(rar < 3 && Math.random() < rod.rare * 0.25) rar++;
      /* les poissons de la région choisie sur la carte (toutes celles ouvertes, en « Mix ») */
      const regs = activeRegions(), ok = id => g.POKE[id] && !g.POKE[id].leg && regs.includes(regionOf(id));
      const pool = P.fish.filter(ok); if(!pool.length) return null;
      let bd = 9; for(const id of pool) bd = Math.min(bd, Math.abs(g.POKE[id].rar - rar));
      const cand = pool.filter(id=>Math.abs(g.POKE[id].rar - rar) === bd), id = cand[Math.floor(Math.random() * cand.length)], rr = g.POKE[id].rar;
      return {kind:"mon", id, level:r("levelFor")(rr), rar:rr, shiny:Math.random() < r("shinyOdds")() * (rod.shiny || 1), pond:P.k};
    } catch(e){ console.warn("pêche", e); return null; }
  }
  nearWater(){ const p = this.game.player.pos; for(const w of this.waters()) if(w.near(p)) return w; return null; }
  nearLake(){ return !!this.nearWater(); }
  toggle(){
    if(this.active){ this.stop(); return; }
    const w = this.nearWater();
    if(!w){ if(lakeShore(this.game.player.pos.x, this.game.player.pos.z) > 0) this.game.hud.hint("Approche-toi encore de l'eau pour pêcher.", 3); return; }
    if(!this.rodDef()){ window.toast("Il te faut une canne. " + (typeof window.rodWhere === "function" ? window.rodWhere() : ""), "", "fish"); return; }
    this.w = w;
    this.active = true; this.st = "idle"; this.rod.visible = true;
    this.game.hud.hint(w.lava ? `<b>${w.n}</b> · ici, on pêche dans la lave : <b>clic</b> près d'une ombre, au « ! », <b>clic</b> pour ferrer`
      : `${w.k !== "lac" ? `<b>${w.n}</b> · ` : ""}<b>Clic</b> sur l'eau, près d'une ombre : lancer · au « ! », <b>clic</b> pour ferrer · <b>F</b> : ranger la canne`, 7);
    const M = G().ref("Music"); try { if(M){ M.ctxOverride = "peche"; M.sync(); } } catch(e){}
  }
  stop(){
    this.active = false; this.st = "idle"; this.rod.visible = false; this.line.visible = false; this.bob.visible = false;
    if(this.target && this.target.mode !== "gone") this.target.mode = this.target.kind === "treasure" ? "still" : "swim";
    this.target = null;
    const M = G().ref("Music"); try { if(M){ M.ctxOverride = "capture_kanto"; M.sync(); } } catch(e){}
  }
  interact(){ if(!this.active && this.nearLake()){ this.toggle(); return true; } return false; }
  prompt(){
    if(this.active){
      if(this.st === "idle") return `<b>Clic</b> sur l'eau : lancer · <b>F</b> : ranger la canne`;
      if(this.st === "bite") return `<b class="hot">CLIC : FERRER !</b>`;
      if(this.st === "come" || this.st === "near") return `Attends le « ! »…`;
      if(this.st === "wait") return `Rien ne mord encore · <b>clic</b> ailleurs : relancer`;
      return "";
    }
    const w = this.nearWater();
    if(w) return w.k === "lac" ? `<b>F</b> : sortir la canne` : `<b>F</b> : pêcher · ${w.n}${w.lava ? " (dans la lave)" : ""}`;
    return "";
  }
  /* ---------- les ombres du lac ---------- */
  inLake(x, z){ return lakeAt(x, z) > 0.75 && heightAt(x, z) < WATER_Y - 0.6; }
  spawnShadow(w){
    const g = G(); if(!g) return;
    let spec;
    if(w.k === "lac" && Math.random() < 0.07) spec = {kind:"treasure"};
    else spec = w.roll();
    if(!spec) return;
    for(let k = 0; k < 30; k++){
      const at = w.spawn(); if(!at) continue;
      const x = at.x, z = at.z;
      if(!w.inside(x, z)) continue;
      const s = {spec, w, kind:spec.kind, x, z, a:Math.random() * 6.28, mode:spec.kind === "treasure" ? "still" : "swim", born:this.game.t, alpha:0,
        size:(spec.kind === "treasure" ? 0.62 : spec.id === 382 ? 2.3 : SIZE[spec.rar] * (0.92 + Math.random() * 0.16)) * (w.k === "lac" ? 1 : 0.85),
        until:this.game.t + 35 + Math.random() * 25};
      s.sp = s.kind === "treasure" ? 0 : 0.45 / Math.sqrt(s.size);
      this.shadows.push(s);
      if(spec.kind !== "treasure") preloadMon(spec.id, spec.shiny);
      return;
    }
  }
  moveShadow(s, dt){
    const turnTo = (x, z, k) => { let d = Math.atan2(z - s.z, x - s.x) - s.a; while(d > Math.PI) d -= 6.283; while(d < -Math.PI) d += 6.283; s.a += d * Math.min(1, k * dt); };
    if(s.mode === "fade"){ s.alpha -= dt; if(s.alpha <= 0) s.mode = "gone"; return; }
    s.alpha = Math.min(1, s.alpha + dt * 0.8);
    if(s.kind === "treasure"){ if(this.game.t > s.until && this.target !== s) s.mode = "fade"; return; }
    if(s.mode === "swim"){
      s.a += Math.sin(this.game.t * 0.8 + s.born) * 0.6 * dt;
      const nx = s.x + Math.cos(s.a) * s.sp * dt, nz = s.z + Math.sin(s.a) * s.sp * dt;
      if(!s.w.inside(nx, nz)) turnTo(s.w.x, s.w.z, 3); else { s.x = nx; s.z = nz; }
      if(this.game.t > s.until && this.target !== s) s.mode = "fade";
    } else if(s.mode === "come"){
      turnTo(this.bobPos.x, this.bobPos.z, 6);
      s.x += Math.cos(s.a) * s.sp * 2.4 * dt; s.z += Math.sin(s.a) * s.sp * 2.4 * dt;
      if(Math.hypot(s.x - this.bobPos.x, s.z - this.bobPos.z) < 0.35 + s.size * 0.25){ s.mode = "nibble"; s.orb = Math.atan2(s.z - this.bobPos.z, s.x - this.bobPos.x); }
    } else if(s.mode === "nibble" || s.mode === "hooked"){
      s.orb += dt * (s.mode === "hooked" ? 9 : 1.4);
      const r = (0.4 + s.size * 0.2) * (s.mode === "hooked" ? 0.5 : 1);
      s.x = this.bobPos.x + Math.cos(s.orb) * r; s.z = this.bobPos.z + Math.sin(s.orb) * r;
      s.a = Math.atan2(this.bobPos.z - s.z, this.bobPos.x - s.x);
    } else if(s.mode === "flee"){
      s.x += Math.cos(s.a) * s.sp * 5 * dt; s.z += Math.sin(s.a) * s.sp * 5 * dt; s.alpha -= dt * 1.2;
      if(s.alpha <= 0 || !s.w.inside(s.x, s.z)) s.mode = "gone";
    }
  }
  /* ---------- la partie, réglée comme sur mobile ---------- */
  click(){
    const t = this.game.t, rod = this.rodDef(); if(!rod) return;
    if(this.st === "idle" || this.st === "wait"){
      if(this.st === "wait" && t - this.landT < GRACE) return;
      const ray = new THREE.Ray(this.game.engine.camera.position.clone(), this.game.engine.camera.getWorldDirection(new THREE.Vector3()));
      const hit = this.w.surf.hit(ray);
      if(!hit || hit.distanceTo(this.game.player.pos) < 2.5){ this.game.hud.hint("Vise l'eau : un peu plus loin, près d'une ombre.", 2.5); return; }
      this.cast(hit, t);
      return;
    }
    if(this.st === "come" || this.st === "near"){ if(t - this.landT < GRACE) return; this.miss("early", t); return; }
    if(this.st === "bite") this.hook(t);
  }
  cast(p, t){
    if(this.target && this.target.mode !== "gone") this.target.mode = this.target.kind === "treasure" ? "still" : "swim";
    this.target = null; this.nibs = 0; this.quality = null;
    this.bobPos = new THREE.Vector3(p.x, this.w.surf.y, p.z);
    this.castT = t; this.landT = t + 0.55; this.st = "cast";
    this.from = this.tipWorld();
    this.bob.visible = true; this.line.visible = true;
    if(this.game.audio) this.game.audio.whoosh();
  }
  landed(t){
    const L = this.w.surf;
    L.ripple(this.bobPos.x, this.bobPos.z, t, 1);
    if(this.game.audio) this.game.audio.plop(this.bobPos);
    let best = null, bd = 9;
    for(const s of this.shadows){
      if(s.w !== this.w || (s.mode !== "swim" && s.mode !== "still")) continue;
      const d = Math.hypot(s.x - this.bobPos.x, s.z - this.bobPos.z);
      const reach = s.kind === "treasure" ? 1.4 : 4 + s.size * 1.2;
      if(d < reach && d < bd){ bd = d; best = s; }
    }
    if(best){ this.engage(best, t); return; }
    this.attractAt = t + (1.1 + Math.random() * 1.1) * (this.rain() ? 0.65 : 1);
    this.st = "wait";
  }
  rain(){ const S = G().S; return S && S.weather === "pluie"; }
  engage(s, t){
    this.target = s;
    if(s.kind === "treasure"){ this.nibs = 0; this.nextNib = t + (0.9 + Math.random() * 0.7) * (this.rain() ? 0.7 : 1); this.st = "near"; return; }
    s.mode = "come"; this.nibs = Math.floor(Math.random() * 3) + (s.spec.rar >= 3 ? 1 : 0); this.st = "come";
  }
  hook(t){
    const rod = this.rodDef();
    this.quality = (t - this.biteAt) * 1000 <= rod.perfect ? "perfect" : "good";
    this.hookT = t; this.st = "hooked";
    if(this.target && this.target.kind !== "treasure") this.target.mode = "hooked";
    if(this.game.audio) this.game.audio.splash(this.bobPos, 1.2);
    try { window.Sfx.hit(); } catch(e){}
    this.game.capture.sparks.burst(this.bobPos.clone(), 18, ["#dff4ff", "#ffffff"], 2.5, 0.6);
    this.game.hud.grade(this.quality === "perfect" ? {n:"Ferrage parfait", mul:1.2, c:"#ffd24a"} : {n:"Ferré", mul:1, c:"#5ce07a"});
  }
  miss(kind, t){
    this.st = "miss"; this.until = t + 0.9;
    if(this.target){ if(this.target.kind === "treasure") this.target.mode = "still"; else { this.target.mode = "flee"; this.target.a = Math.atan2(this.target.z - this.bobPos.z, this.target.x - this.bobPos.x); } }
    this.target = null;
    this.game.hud.hint(kind === "early" ? "Trop tôt : elle a filé. Attends le « ! »." : "Trop tard : elle a décroché.", 2.5);
    try { (kind === "late" ? window.Sfx.fail : window.Sfx.wobble)(); } catch(e){}
  }
  /* ce qui remonte : le jeu mobile tranche (statistiques, quêtes, trésor ou Pokémon) */
  land(t){
    const g = G(), s = this.target;
    this.shadows = this.shadows.filter(x=>x !== s);
    g.FISHING = {st:"leap", target:s ? {spec:s.spec, kind:s.kind} : null, quality:this.quality, seen:performance.now()};
    let enc = null;
    const keepEnc = g.ENC;
    try { enc = window.fishLand(performance.now()); } catch(e){ console.error(e); }
    g.ENC = keepEnc;
    this.st = "idle"; this.target = null; this.bob.visible = false; this.line.visible = false;
    if(enc){
      /* il saute de l'eau et retombe sur la rive, devant toi */
      const P = this.game.player.pos, dir = new THREE.Vector3(P.x - this.bobPos.x, 0, P.z - this.bobPos.z).normalize();
      let x = this.bobPos.x, z = this.bobPos.z;
      for(let k = 0; k < 80 && this.w.wet(x, z); k++){ x += dir.x * 0.4; z += dir.z * 0.4; }
      x += dir.x * 0.8; z += dir.z * 0.8;
      /* jamais dans les bras : un grand Pokémon retombe plus loin (dans l'eau peu profonde s'il le faut) */
      const D = Math.max(3.2, 2.4 + realHeight(enc.id) * 1.3);
      if(Math.hypot(x - P.x, z - P.z) < D){ x = P.x - dir.x * D; z = P.z - dir.z * D; }
      const e = this.game.wild.add(Object.assign({}, enc), x, z, false);
      if(e){
        e.state = "alert"; e.timer = 6; e.noticed = true; e.hop = this.game.t; e.appear = 1; e.sprite.uniforms.uGlitch.value = 0;
        e.leap = {from:this.bobPos.clone(), t:this.game.t, emote:true};
      }
      if(this.game.audio) this.game.audio.splash(this.bobPos, 1.4);
      this.game.capture.sparks.burst(this.bobPos.clone().add(new THREE.Vector3(0, 0.2, 0)), 30, this.w.lava ? ["#ffb347", "#ff5a14", "#fff0a0"] : ["#dff4ff", "#9fd6ff", "#ffffff"], 3.5, 0.9);
      this.stop();
      this.game.hud.hint(enc.hook === "perfect" ? "Ferrage parfait : il est sonné, +20 % à la capture. Lance une Ball !" : "Il est sorti de l'eau : lance une Ball !", 4);
    }
  }
  tipWorld(){ return this.rod.localToWorld(this.tipLocal.clone()); }
  update(dt, t){
    /* les ombres vivent toujours dans chaque eau : on les voit de la rive */
    const P = this.game.player.pos;
    this.nextSpawn -= dt;
    for(const w of this.waters()){
      const near = Math.hypot(P.x - w.x, P.z - w.z) < w.far;
      if(near && G() && w.surf && this.nextSpawn <= 0 && this.shadows.filter(s=>s.w === w && s.mode !== "gone").length < (w.k === "lac" ? 4 : 3)){ this.spawnShadow(w); this.nextSpawn = 1.2; }
    }
    for(const s of this.shadows) this.moveShadow(s, dt);
    this.shadows = this.shadows.filter(s=>s.mode !== "gone" && (s === this.target || Math.hypot(P.x - s.w.x, P.z - s.w.z) < s.w.far + 20));
    for(const w of this.waters()){
      const L = w.surf; if(!L) continue;
      L.clearFish();
      this.shadows.filter(s=>s.w === w).slice(0, FISH_MAX).forEach((s, i)=>L.setFish(i, s.x, s.z, s.a, s.size * 1.6, s.spec && s.spec.shiny, s.kind === "treasure", Math.max(0, Math.min(1, s.alpha))));
    }
    const L = this.w ? this.w.surf : this.game.world.lake;
    if(!this.active) return;
    const rod = this.rodDef(); if(!rod){ this.stop(); return; }
    /* l'automate, réglé comme l'étang mobile */
    switch(this.st){
      case "cast": if(t >= this.landT) this.landed(t); break;
      case "wait":
        if(this.attractAt && t >= this.attractAt){
          let best = null, bd = 99;
          for(const s of this.shadows) if(s.mode === "swim"){ const d = Math.hypot(s.x - this.bobPos.x, s.z - this.bobPos.z); if(d < bd){ bd = d; best = s; } }
          if(best) this.engage(best, t); else this.attractAt = t + 0.9;
        }
        break;
      case "come":
        if(!this.target || this.target.mode === "gone"){ this.target = null; this.attractAt = t + 0.6; this.st = "wait"; break; }
        if(this.target.mode === "nibble"){ this.nextNib = t + (0.5 + Math.random() * 0.5) * (this.rain() ? 0.75 : 1); this.st = "near"; }
        break;
      case "near":
        if(t >= this.nextNib){
          if(this.nibs > 0){
            this.nibs--; this.dip = t; this.nextNib = t + (0.52 + Math.random() * 0.43) * (this.rain() ? 0.8 : 1);
            L.ripple(this.bobPos.x, this.bobPos.z, t, 0.5);
            if(this.game.audio) this.game.audio.plop(this.bobPos);
            if(this.nibs === 0) this.nextNib = t + (0.38 + Math.random() * 0.42) * (this.rain() ? 0.8 : 1);
          } else {
            this.biteAt = t; this.st = "bite";
            L.ripple(this.bobPos.x, this.bobPos.z, t, 1.4);
            if(this.game.audio) this.game.audio.splash(this.bobPos, 0.8);
            try { window.Sfx.wobble(); } catch(e){}
          }
        }
        break;
      case "bite": if((t - this.biteAt) * 1000 > rod.window) this.miss("late", t); break;
      case "hooked":
        if(t - this.hookT > 0.55) this.land(t);
        else if(Math.random() < dt * 14) L.ripple(this.bobPos.x + (Math.random() - 0.5), this.bobPos.z + (Math.random() - 0.5), t, 0.6);
        break;
      case "miss": if(t >= this.until){ this.st = "idle"; this.bob.visible = false; this.line.visible = false; } break;
    }
    /* la canne qui plie, le fil, le bouchon */
    const hooked = this.st === "hooked";
    this.rod.rotation.x = -0.95 + (hooked ? 0.25 + Math.sin(t * 40) * 0.03 : 0) + (this.st === "cast" ? Math.max(0, 0.5 - (t - this.castT) * 2) * -1 : 0);
    if(this.line.visible){
      const tip = this.tipWorld();
      let bp;
      if(this.st === "cast"){
        const k = Math.min(1, (t - this.castT) / 0.55);
        bp = this.from.clone().lerp(this.bobPos, k); bp.y += Math.sin(Math.PI * k) * 2.2;
      } else {
        bp = this.bobPos.clone();
        bp.y = (this.w ? this.w.surf.y : WATER_Y) + 0.03 + Math.sin(t * 2.6) * 0.008;
        if(this.dip && t - this.dip < 0.18) bp.y -= 0.035;
        if(this.st === "bite" || hooked) bp.y -= 0.07;
      }
      this.bob.position.copy(bp);
      const sag = hooked ? 0 : 0.35;
      for(let i = 0; i < 16; i++){
        const k = i / 15, p = tip.clone().lerp(bp, k);
        p.y -= Math.sin(Math.PI * k) * sag;
        this.linePts[i * 3] = p.x; this.linePts[i * 3 + 1] = p.y; this.linePts[i * 3 + 2] = p.z;
      }
      this.lineGeo.attributes.position.needsUpdate = true;
    }
  }
  /* le « ! » au-dessus du bouchon */
  drawOverlay(c, t, hud){
    if(!this.active || this.st !== "bite") return;
    const p = hud.project(this.bobPos.clone().add(new THREE.Vector3(0, 0.35, 0)));
    if(p.behind) return;
    const y = p.y - Math.abs(Math.sin(t * 14)) * 5;
    c.fillStyle = "#fff"; c.strokeStyle = "#111"; c.lineWidth = 3;
    c.beginPath(); c.roundRect ? c.roundRect(p.x - 15, y - 40, 30, 36, 6) : c.rect(p.x - 15, y - 40, 30, 36); c.fill(); c.stroke();
    c.fillStyle = "#e02828"; c.font = "bold 28px 'Pixelify Sans', sans-serif"; c.textAlign = "center"; c.fillText("!", p.x, y - 12);
  }
}
