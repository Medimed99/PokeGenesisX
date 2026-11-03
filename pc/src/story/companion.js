/* ============================================================
   PORYGON-Z, SUR LA ROUTE
   Le guide n'est plus seulement une voix dans le terminal : il flotte
   à côté de toi, au bord de ton champ de vision (un peu devant, à
   droite), te suit quand tu marches, se pousse quand tu vises.
   Quand il parle (ses remarques, ses demandes, ses répliques quand on
   le tapote), ses mots s'affichent dans une bulle à côté de lui, et il
   se tourne vers toi. Il a son humeur : inquiet quand l'archive est
   abîmée, sautillant quand elle guérit. MissingNo dans les parages :
   il se serre contre toi et tremble. Une capture : un petit bond.
   Dans le présent, c'est un programme qu'on projette (un hologramme) ;
   après ÉCRIRE, c'est un Pokémon, solide.
   E en le regardant : on le tapote (comme son portrait sur mobile).
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { heightAt } from "../world/layout.js";
import { EYE } from "../player.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const TAU = Math.PI * 2;
const V = new THREE.Vector3(), W = new THREE.Vector3();

export class Companion {
  constructor(game){
    this.game = game; this.m = null; this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.placed = false;
    this.say = null; this.hop = 0; this.hopV = 0; this.trem = 0; this.caught = -1; this.held = 0; this.lookAt = null; this.lookT = 0; this.shown = false;
    this.bubble = document.createElement("div"); this.bubble.id = "pc-pzsay";
    this.bubble.addEventListener("click", ()=>this.hush());
    document.body.appendChild(this.bubble);
    /* ses paroles : le bandeau du guide et ses petites bulles du jeu mobile passent par lui */
    const talk = document.getElementById("pztalk");
    /* (une seule fois par réplique : ajouter la classe pc-pzw relance l'observateur) */
    if(talk) new MutationObserver(()=>{ if(/\bon\b/.test(talk.className) && !talk.classList.contains("pc-pzw")){ const t = talk.querySelector(".pzt-t"); if(t && (!this.say || this.say.text !== t.textContent)) this.speak(t.textContent, 11, talk); } }).observe(talk, {attributes:true, attributeFilter:["class"]});
    const toasts = document.getElementById("toasts");
    if(toasts) new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes){ if(n.classList && n.classList.contains("pz")){ const s = n.querySelector("span:last-child"); if(s) this.speak(s.textContent, 0, n); } } }).observe(toasts, {childList:true});
  }
  /* il n'est là qu'une fois l'ouverture vue, sur la route */
  wanted(){
    const S = this.game.S, g = this.game;
    if(!S || !S.story || !S.story.includes("intro")) return false;
    if(g.mode === "title" || (g.story3d && g.story3d.on) || (g.breche3d && g.breche3d.on) || (g.tower3d && g.tower3d.on)) return false;
    return true;
  }
  real(){ try { const S = this.game.S; return !!(S && S.saga && S.saga.end === "write"); } catch(e){ return false; } }
  ensure(){
    if(this.m) return;
    this.m = makeMon(474, false, this.game.engine.scene, {height:0.88, occ:false, corrupt:false});
    const pad = this.pad = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.27, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.game.engine.scene.add(pad);
  }
  /* ---------- ses paroles ---------- */
  speak(text, secs, src){
    if(!text) return;
    if(!this.shown || !this.onScreen || this.game.mode !== "play") return;   /* hors de vue, ou le terminal ouvert : le bandeau du jeu mobile suffit */
    const dur = secs || Math.min(9, 2.4 + text.length * 0.045);
    this.say = {text, until:this.game.t + dur, src};
    this.bubble.innerHTML = `<small>PORYGON-Z</small><span>${esc(text)}</span>`;
    this.bubble.className = "on";
    if(src && src.classList && !src.classList.contains("pc-pzw")) src.classList.add("pc-pzw");     /* le bandeau s'efface : il parle ici */
    document.body.classList.add("pzw");
    this.hopNow(5);
  }
  hush(){
    if(!this.say) return;
    const src = this.say.src; this.say = null;
    this.bubble.className = ""; document.body.classList.remove("pzw");
    if(src && src.id === "pztalk"){ const A = G() && G().ACTIONS; if(A && A.pzclose) A.pzclose(); }
    else if(src && src.remove) src.remove();
  }
  hopNow(v){ if(this.hop <= 0.01) this.hopV = v || 4; }
  poke(){
    if(!this.shown || !this.aimed) return false;
    const A = G() && G().ACTIONS; if(A && A.pzpoke) A.pzpoke();
    this.hopNow(4.5); this.spin = 1;
    return true;
  }
  /* ---------- à chaque image ---------- */
  update(dt, t){
    const want = this.wanted();
    if(!want){ if(this.m) this.hide(); return; }
    this.ensure();
    const g = this.game, Pl = g.player, cam = g.engine.camera, M = this.m, U = M.uniforms;
    const calm = typeof window.calmFx === "function" && window.calmFx();
    const S = g.S, mood = (ref("pzMood") || (()=>"Normal"))();
    /* où il veut être : un peu devant, à droite ; plus en retrait quand on vise ; tout près quand MissingNo rôde */
    const fx = -Math.sin(Pl.yaw), fz = -Math.cos(Pl.yaw), rx = Math.cos(Pl.yaw), rz = -Math.sin(Pl.yaw);
    const aiming = g.capture && (g.capture.aiming || g.capture.target);
    const fear = Math.max(g.nearMissing || 0, (g.nearCorruption || 0) * 0.6);
    const fwd = aiming ? 0.8 : fear > 0.3 ? 1.1 : 2.6, side = aiming ? 2.3 : fear > 0.3 ? 1.0 : 1.75;
    let tx = Pl.pos.x + fx * fwd + rx * side, tz = Pl.pos.z + fz * fwd + rz * side;
    /* regardé, il reste où il est (on peut le tapoter) ; il ne lâche pas pour autant : trop loin, il revient */
    if(this.held > 0 && Math.hypot(this.pos.x - Pl.pos.x, this.pos.z - Pl.pos.z) < 5.5){ this.held -= dt; tx = this.pos.x; tz = this.pos.z; }
    const ground = heightAt(tx, tz), hover = 1.0 + (mood === "Worried" ? -0.12 : mood === "Joyous" || mood === "Happy" ? 0.08 : 0);
    const ty = Math.max(ground, Pl.pos.y - 0.4) + hover + (calm ? 0 : Math.sin(t * 1.7) * 0.06);
    if(!this.placed){ this.pos.set(tx, ty, tz); this.placed = true; this.yaw = Pl.yaw + Math.PI; }
    /* il suit avec un peu de retard : ça le rend vivant */
    const k = 1 - Math.exp(-dt * (aiming ? 5 : 2.6));
    this.pos.x += (tx - this.pos.x) * k; this.pos.z += (tz - this.pos.z) * k; this.pos.y += (ty - this.pos.y) * (1 - Math.exp(-dt * 3));
    /* un petit bond */
    if(this.hop > 0 || this.hopV){ this.hop += this.hopV * dt; this.hopV -= 16 * dt; if(this.hop <= 0){ this.hop = 0; this.hopV = 0; } }
    /* une capture : il est content */
    const caught = S && S.stats ? S.stats.catches || 0 : 0;
    if(this.caught >= 0 && caught > this.caught) this.hopNow(4.2);
    this.caught = caught;
    /* où il regarde : vers toi quand il parle ; vers un Pokémon proche de temps en temps ; sinon, comme toi */
    let lx = this.pos.x + fx, lz = this.pos.z + fz;
    if(this.say){ lx = Pl.pos.x; lz = Pl.pos.z; }
    else {
      if(t > this.lookT){ this.lookT = t + 4 + Math.random() * 5; const w = (g.wild && g.wild.list || []).filter(e=>e.pos && e.state !== "gone" && e.state !== "fled" && Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z) < 14); this.lookAt = w.length && Math.random() < 0.6 ? w[Math.floor(Math.random() * w.length)] : null; }
      if(this.lookAt && this.lookAt.pos){ lx = this.lookAt.pos.x; lz = this.lookAt.pos.z; }
    }
    let wantYaw = Math.atan2(lx - this.pos.x, lz - this.pos.z);
    if(this.spin > 0){ this.spin -= dt; wantYaw = this.yaw + dt * 12; }
    let d = ((wantYaw - this.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
    this.yaw += this.spin > 0 ? d : d * Math.min(1, dt * 5);
    /* il tremble quand la faille est là */
    const jit = fear > 0.4 && !calm ? (Math.sin(t * 60) > 0 ? 1 : -1) * 0.02 * fear : 0;
    const holo = !this.real();
    U.uTintC && U.uTintC.value.set(0.5, 1.0, 0.95, holo ? 0.16 + (calm ? 0 : Math.sin(t * 3) * 0.03) : 0);
    U.uAlpha.value = 1;
    U.uGlitch.value = holo && !calm && (Math.sin(t * 7.3) + Math.sin(t * 3.1)) > 1.88 ? 0.3 : fear > 0.5 && !calm && Math.random() < 0.05 ? 0.4 : 0;
    M.setAnim(this.say ? "idle" : Math.hypot(tx - this.pos.x, tz - this.pos.z) > 0.6 ? "walk" : "idle");
    if(M.group) M.group.visible = true;
    M.lift = 0; M.groundY = ground;
    V.set(this.pos.x + jit, this.pos.y + this.hop, this.pos.z);
    M.update(t, dt, V, this.yaw, cam, g.env);
    this.pad.visible = holo; this.pad.position.set(this.pos.x, ground + 0.03, this.pos.z);
    this.pad.material.opacity = 0.16 + (calm ? 0 : Math.sin(t * 3) * 0.06);
    this.shown = true;
    /* à l'écran ? (sa bulle en dépend) ; visé ? (on peut le tapoter) */
    W.set(this.pos.x, this.pos.y + this.hop + 0.75, this.pos.z).project(cam);
    this.onScreen = W.z < 1 && W.z > -1 && Math.abs(W.x) < 0.95 && Math.abs(W.y) < 0.95;
    const ex = this.pos.x - cam.position.x, ey = this.pos.y + 0.45 - cam.position.y, ez = this.pos.z - cam.position.z, dist = Math.hypot(ex, ey, ez);
    const cd = cam.getWorldDirection(V), dot = (ex * cd.x + ey * cd.y + ez * cd.z) / (dist || 1);
    this.aimed = dist < 6.5 && dot > Math.cos(0.2);
    if(this.aimed && !aiming) this.held = 1.5;
    /* la bulle suit sa tête */
    if(this.say){
      if(g.t > this.say.until || (this.say.src && this.say.src.id === "pztalk" && !/\bon\b/.test(this.say.src.className))) this.hush();
      else if(!this.onScreen){ this.bubble.className = "on off"; }
      else { this.bubble.className = "on";
        const x = (W.x * 0.5 + 0.5) * innerWidth, y = (-W.y * 0.5 + 0.5) * innerHeight;
        const bw = this.bubble.offsetWidth || 300, bh = this.bubble.offsetHeight || 60;
        this.bubble.style.left = Math.round(Math.max(12, Math.min(innerWidth - bw - 12, x - bw * 0.15))) + "px";
        this.bubble.style.top = Math.round(Math.max(12, Math.min(innerHeight - bh - 140, y - bh - 26))) + "px"; }
    }
  }
  hide(){
    if(this.m && this.m.group) this.m.group.visible = false;
    if(this.m && this.m.mesh) this.m.mesh.visible = false;
    if(this.pad) this.pad.visible = false;
    if(this.say) this.hush();
    this.shown = false; this.placed = false;
  }
}
