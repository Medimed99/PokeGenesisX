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
   ============================================================ */
import * as THREE from "three";
import { LAKE, WATER_Y, heightAt, lakeAt, inWater, lakeShore } from "./world/layout.js";
import { FISH_MAX } from "./world/water.js";
import { MonSprite, realHeight } from "./mon/sprites.js";
import { preloadMon } from "./mon/model3d.js";
import { routeSpecies } from "./mon/wild.js";
import { LAKE1 } from "./data/models3d.js";

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
  nearLake(){
    const p = this.game.player.pos;
    for(let a = 0; a < 6.28; a += 0.5) for(const r of [1.5, 3, 4.5]) if(inWater(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r)) return true;
    return false;
  }
  toggle(){
    if(this.active){ this.stop(); return; }
    if(!this.nearLake()){ if(lakeShore(this.game.player.pos.x, this.game.player.pos.z) > 0) this.game.hud.hint("Approche-toi encore de l'eau pour pêcher.", 3); return; }
    if(!this.rodDef()){ window.toast("Il te faut une canne. " + (typeof window.rodWhere === "function" ? window.rodWhere() : ""), "", "fish"); return; }
    this.active = true; this.st = "idle"; this.rod.visible = true;
    this.game.hud.hint(`<b>Clic</b> sur l'eau, près d'une ombre : lancer · au « ! », <b>clic</b> pour ferrer · <b>F</b> : ranger la canne`, 7);
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
    if(this.nearLake()) return `<b>F</b> : sortir la canne`;
    return "";
  }
  /* ---------- les ombres du lac ---------- */
  inLake(x, z){ return lakeAt(x, z) > 0.75 && heightAt(x, z) < WATER_Y - 0.6; }
  spawnShadow(){
    const g = G(); if(!g) return;
    let spec;
    if(Math.random() < 0.07) spec = {kind:"treasure"};
    else {
      const S = g.S, keep = S.region; S.region = "kanto";
      try { spec = window.rollFishSpec(); } catch(e){ spec = null; } finally { S.region = keep; }
      if(spec && spec.kind !== "treasure") spec = routeSpecies(spec, LAKE1);       /* le lac a ses habitants */
    }
    if(!spec) return;
    for(let k = 0; k < 30; k++){
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.8;
      const x = LAKE.x + Math.cos(a) * LAKE.rx * r, z = LAKE.z + Math.sin(a) * LAKE.rz * r;
      if(!this.inLake(x, z)) continue;
      const s = {spec, kind:spec.kind, x, z, a:Math.random() * 6.28, mode:spec.kind === "treasure" ? "still" : "swim", born:this.game.t, alpha:0,
        size:spec.kind === "treasure" ? 0.62 : spec.id === 382 ? 2.3 : SIZE[spec.rar] * (0.92 + Math.random() * 0.16),
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
      if(!this.inLake(nx, nz)) turnTo(LAKE.x, LAKE.z, 3); else { s.x = nx; s.z = nz; }
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
      if(s.alpha <= 0 || !this.inLake(s.x, s.z)) s.mode = "gone";
    }
  }
  /* ---------- la partie, réglée comme sur mobile ---------- */
  click(){
    const t = this.game.t, rod = this.rodDef(); if(!rod) return;
    if(this.st === "idle" || this.st === "wait"){
      if(this.st === "wait" && t - this.landT < GRACE) return;
      const ray = new THREE.Ray(this.game.engine.camera.position.clone(), this.game.engine.camera.getWorldDirection(new THREE.Vector3()));
      const hit = this.game.world.lake.hit(ray);
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
    this.bobPos = new THREE.Vector3(p.x, WATER_Y, p.z);
    this.castT = t; this.landT = t + 0.55; this.st = "cast";
    this.from = this.tipWorld();
    this.bob.visible = true; this.line.visible = true;
    if(this.game.audio) this.game.audio.whoosh();
  }
  landed(t){
    const L = this.game.world.lake;
    L.ripple(this.bobPos.x, this.bobPos.z, t, 1);
    if(this.game.audio) this.game.audio.plop(this.bobPos);
    let best = null, bd = 9;
    for(const s of this.shadows){
      if(s.mode !== "swim" && s.mode !== "still") continue;
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
      for(let k = 0; k < 80 && inWater(x, z); k++){ x += dir.x * 0.4; z += dir.z * 0.4; }
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
      this.game.capture.sparks.burst(this.bobPos.clone().add(new THREE.Vector3(0, 0.2, 0)), 30, ["#dff4ff", "#9fd6ff", "#ffffff"], 3.5, 0.9);
      this.stop();
      this.game.hud.hint(enc.hook === "perfect" ? "Ferrage parfait : il est sonné, +20 % à la capture. Lance une Ball !" : "Il est sorti de l'eau : lance une Ball !", 4);
    }
  }
  tipWorld(){ return this.rod.localToWorld(this.tipLocal.clone()); }
  update(dt, t){
    const L = this.game.world.lake;
    /* les ombres vivent toujours dans le lac : on les voit de la rive */
    const P = this.game.player.pos, nearLake = Math.hypot(P.x - LAKE.x, P.z - LAKE.z) < 60;
    if(nearLake && G()){
      this.nextSpawn -= dt;
      if(this.shadows.filter(s=>s.mode !== "gone").length < 4 && this.nextSpawn <= 0){ this.spawnShadow(); this.nextSpawn = 1.5; }
    }
    for(const s of this.shadows) this.moveShadow(s, dt);
    this.shadows = this.shadows.filter(s=>s.mode !== "gone");
    L.clearFish();
    this.shadows.slice(0, FISH_MAX).forEach((s, i)=>L.setFish(i, s.x, s.z, s.a, s.size * 1.6, s.spec && s.spec.shiny, s.kind === "treasure", Math.max(0, Math.min(1, s.alpha))));
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
        bp.y = WATER_Y + 0.03 + Math.sin(t * 2.6) * 0.008;
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
