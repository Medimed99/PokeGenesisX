/* ============================================================
   LE DRESSEUR RÉMANENT DE LA ROUTE 1
   Sur mobile, ils surgissent après une capture. Ici, l'un d'eux se
   tient au bord du chemin — un par jour, à tour de rôle. Il se
   souvient de toi (rencontres, victoires), te défie, et le combat se
   joue devant toi : ton Pokémon de dos, le sien de face, les coups,
   les dégâts, les K.O. Le moteur est celui du mobile (createBattle,
   combat automatique, rivalSetup / rivalEnd) : mêmes équipes, mêmes
   gains, même titre au bout. Une fois par jour, comme une rencontre.
   ============================================================ */
import * as THREE from "three";
import { MonSprite, realHeight } from "./mon/sprites.js";
import { makeMon, preloadMon } from "./mon/model3d.js";
import { heightAt, pathX } from "./world/layout.js";

const G = () => window.PCG;
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const strip = s => String(s).replace(/<[^>]+>/g, "");
const Z = 44;

export class Trainer {
  constructor(game){
    this.game = game; this.battling = false; this.dialog = null; this.pops = [];
    const x = pathX(Z) + 4.4;
    this.pos = new THREE.Vector3(x, heightAt(x, Z), Z);
    this.heading = -Math.PI / 2;
    game.world.colliders.push({x, z:Z, r:0.45});
    this.sprite = this.makeSprite();
    this.box = document.createElement("div"); this.box.id = "pc-dialog"; document.body.appendChild(this.box);
    this.bat = document.createElement("div"); this.bat.id = "pc-battle"; document.body.appendChild(this.bat);
    this.noticed = false; this.gone = 0;
  }
  rival(){
    const g = G(); if(!g) return null;
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    return g.RIVALS[day % g.RIVALS.length];
  }
  foughtToday(){ const S = G() && G().S; return S && S.flags && S.flags.pcRivalDay === window.today(); }
  /* le portrait de dresseur (Rouge Feu), en panneau tourné vers nous */
  makeSprite(){
    const s = new MonSprite(1, false, this.game.engine.scene, {height:1.72});
    const img = new Image(), g = G();
    img.src = g ? g.ref("TRAINER_ATLAS") || "" : "";
    const tex = new THREE.Texture(img); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
    img.onload = () => { tex.needsUpdate = true; };
    const self = this;
    s.update = function(t, dt, pos, heading, cam, env){
      this.group.position.copy(pos);
      const U = this.uniforms, rv = self.rival(), classes = g.ref("TRAINER_CLASSES") || [];
      U.uTime.value = t;
      if(env){ U.uTint.value.copy(env.tint); U.uFog.value.copy(env.fog); U.uFogDensity.value = env.fogDensity; }
      const i = Math.max(0, classes.indexOf(rv ? rv.cls : "youngster")), n = Math.max(1, classes.length);
      U.uMap.value = tex; U.uRect.value.set(i / n, 0, 1 / n, 1);
      U.uSize.value.set(1.9, 1.9); U.uOffset.value.set(-0.5, -0.08);
      this.mesh.visible = img.complete && img.naturalWidth > 0;
      this.width = 0.8; this.drawH = 1.72;
      this.shadow.scale.set(0.9, 1, 0.6); this.shadow.position.y = 0.03;
    };
    return s;
  }
  near(){ return this.game.player.pos.distanceTo(this.pos) < 3.6; }
  present(){ return !this.foughtToday() || this.battling || this.dialog || this.gone > 0; }
  prompt(){
    if(this.battling) return `<b>Maj</b> (maintenir) : accélérer le combat`;
    if(this.dialog) return "";
    const rv = this.rival();
    if(rv && this.present() && this.near()) return `<b>E</b> : parler à ${esc(rv.n)}`;
    return "";
  }
  /* les crochets : une capture faite dans la 3D ne fait pas surgir d'écran de rival */
  tick(){ return false; }
  interact(){
    if(this.battling || this.dialog || !this.near() || !this.present()) return false;
    const rv = this.rival(), S = G().S;
    if(!rv) return false;
    const rec = window.rivalRec(rv.k);
    if(S.level < 10 || S.team.length < 3){
      this.say(rv, `Tu n'as pas encore d'équipe à mon goût. Reviens avec trois Pokémon dans ton équipe, et au moins le niveau 10.`, null);
      return true;
    }
    rec.met++;
    const line = rv.intro[Math.min(rv.intro.length - 1, rec.met - 1)] || rv.intro[0];
    const R = window.rivalSetup(rv);
    this.setup = R;
    this.say(rv, line, R);
    this.game.wild.emote({pos:this.pos, sprite:{drawH:1.72}, H:1.72, state:"npc"}, "!");
    try { window.Sfx.glitch(); } catch(e){}
    return true;
  }
  say(rv, line, R){
    const g = G(), rec = window.rivalRec(rv.k);
    this.dialog = {rv, R};
    const prize = R && R.prize;
    this.box.innerHTML = `<div class="dl-in">
      <div class="dl-who"><b>${esc(rv.n)}</b><span>dresseur rémanent · ${esc(rv.role)}${rec.met > 1 ? ` · rencontre n° ${rec.met}` : ""}</span>
        <div class="dl-types">${rv.t.map(t=>`<span class="tt t${t}">${g.TYPE_NAMES[t]}</span>`).join("")}${R ? `<span class="tt">N.${R.lv}</span>` : ""}</div></div>
      <p class="dl-txt">« ${esc(line)} »</p>
      ${R ? `<div class="dl-prize">Prime : <b>${window.fmt(prize.coins)}</b> PokéCoins · <b>${prize.shards}</b> Fragments${prize.cores ? " · <b>1 Noyau</b>" : ""}${prize.first ? ` · le titre <b>« ${esc(rv.title)} »</b>` : ""}</div>
        <div class="dl-acts"><button data-d="go"><kbd>E</kbd> Relever le défi</button><button data-d="no"><kbd>R</kbd> Plus tard</button></div>`
        : `<div class="dl-acts"><button data-d="no"><kbd>E</kbd> D'accord</button></div>`}
    </div>`;
    this.box.className = "on";
    this.box.onclick = e => { const b = e.target.closest("[data-d]"); if(b) this.answer(b.dataset.d); };
    this.keyFn = e => { if(e.code === "KeyE" || e.code === "Enter"){ this.answer(R ? "go" : "no"); e.preventDefault(); } if(e.code === "KeyR" || e.code === "Backspace" || e.code === "Escape"){ this.answer("no"); } };
    setTimeout(()=>addEventListener("keydown", this.keyFn), 50);
    /* on parle : la souris revient (sans ouvrir la pause) */
    this.game.setMode("dialog");
    this.game.input.unlock();
  }
  closeDialog(){
    this.box.className = ""; this.dialog = null;
    removeEventListener("keydown", this.keyFn);
  }
  answer(a){
    const d = this.dialog; if(!d) return;
    this.closeDialog();
    if(a === "go" && d.R){ this.startBattle(d.rv, d.R); return; }
    this.game.setMode("play");
    this.game.resume();
  }
  /* ---------- le combat ---------- */
  startBattle(rv, R){
    const g = G();
    this.battling = true; this.rv = rv; this.R = R;
    this.game.setMode("battle");
    const P0 = this.game.player.pos, d = new THREE.Vector3(this.pos.x - P0.x, 0, this.pos.z - P0.z).normalize(), r = new THREE.Vector3(-d.z, 0, d.x);
    this.dir = d;
    /* on recule pour se faire face, à huit pas : la place des deux Pokémon */
    const back = this.pos.clone().addScaledVector(d, -8.2);
    this.game.player.pos.set(back.x, heightAt(back.x, back.z), back.z);
    const P = this.game.player.pos;
    this.allyAt = P.clone().addScaledVector(d, 2.3).addScaledVector(r, 0.55);
    this.foeAt = this.pos.clone().addScaledVector(d, -2.1).addScaledVector(r, -0.3);
    this.allyAt.y = heightAt(this.allyAt.x, this.allyAt.z); this.foeAt.y = heightAt(this.foeAt.x, this.foeAt.z);
    /* on regarde l'adversaire */
    this.game.player.yaw = Math.atan2(-d.x, -d.z); this.game.player.pitch = -0.14;
    for(const f of [...R.allies, ...R.foes]) preloadMon(f.id, f.shiny);
    this.side = {a:null, f:null};
    const self = this;
    this.origAr = window.arEvent;
    window.arEvent = function(kind){ if(self.battling) return self.event.apply(self, arguments); return self.origAr && self.origAr.apply(this, arguments); };
    window.createBattle(R.allies, R.foes, {ai:true, speed:g.S.settings.battleSpeed || 1, title:rv.n.toUpperCase(), stage:"elite",
      intro:`${rv.n} envoie ${R.foes[0].name} !`, onEnd:win => this.end(win)});
    this.enter("f", R.foes[0], 0.3);
    this.enter("a", R.allies[0], 0.9);
    this.renderBattle();
    setTimeout(()=>{ if(g.BATTLE && !g.BATTLE.over) window.doTurn(0); }, 2200);
  }
  enter(side, f, delay = 0){
    const old = this.side[side];
    if(old) old.sprite.dispose();
    const sp = makeMon(f.id, f.shiny, this.game.engine.scene, {height:Math.max(0.55, realHeight(f.id))});
    sp.uniforms.uGlitch.value = 1;
    this.side[side] = {f, sprite:sp, appear:-delay, lunge:0, hurt:0, ko:0};
    const from = side === "a" ? this.game.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)) : this.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
    const to = side === "a" ? this.allyAt : this.foeAt;
    setTimeout(()=>{ this.game.capture.sparks.stream(from, to.clone().add(new THREE.Vector3(0, 0.5, 0)), 24, side === "a" ? "#35f0d6" : "#ff3d7f"); }, delay * 1000);
  }
  /* ce que le moteur raconte : on le met en scène */
  event(kind, a, b, c, d, e){
    const g = G(), B = g.BATTLE;
    const sideOf = w => (w === "a" || w === "ally") ? "a" : "f";
    if(kind === "begin"){
      const s = this.side[sideOf(a)], o = this.side[sideOf(a) === "a" ? "f" : "a"];
      if(s){ s.lunge = 1; s.sprite.setAnim("attack"); setTimeout(()=>{ s.sprite.setAnim("idle"); }, 520); }
      const mv = d;
      if(s && o && mv && !mv.util){
        const col = typeof window.arCol === "function" ? window.arCol(mv.type) : "#ffffff";
        const from = (sideOf(a) === "a" ? this.allyAt : this.foeAt).clone().add(new THREE.Vector3(0, 0.6, 0));
        const to = (sideOf(a) === "a" ? this.foeAt : this.allyAt).clone().add(new THREE.Vector3(0, 0.6, 0));
        setTimeout(()=>this.game.capture.sparks.stream(from, to, 30, col), 160);
      }
      if(mv) this.say2(`${strip(s ? s.f.name : "")} utilise ${strip(mv.name)}`);
    } else if(kind === "pop"){
      const s = this.side[sideOf(a)];
      if(s){ s.hurt = 1; if(b > 0) s.sprite.setAnim("hurt"); setTimeout(()=>s.sprite.setAnim("idle"), 380); }
      const at = (sideOf(a) === "a" ? this.allyAt : this.foeAt).clone().add(new THREE.Vector3(0, (s && s.sprite.drawH || 1) + 0.2, 0));
      this.pops.push({at, txt:(b < 0 ? "+" : "-") + Math.abs(b), col:b < 0 ? "#5ce07a" : c >= 2 ? "#ffd24a" : c < 1 ? "#9fb4d0" : "#ff6b8a", big:c >= 2 || e, t:this.game.t});
      if(c >= 2) this.say2("C'est super efficace !"); else if(c > 0 && c < 1) this.say2("Ce n'est pas très efficace…");
      try { window.Sfx.hit(); } catch(err){}
    } else if(kind === "glow"){
      const s = this.side[sideOf(a)]; if(s) s.hurt = 0.6;
    } else if(kind === "miss"){
      const s = this.side[sideOf(a) === "a" ? "f" : "a"];
      this.pops.push({at:(sideOf(a) === "a" ? this.foeAt : this.allyAt).clone().add(new THREE.Vector3(0, 1.4, 0)), txt:a === "ÉCHEC" ? "Raté" : String(a || "Raté"), col:"#9fb4d0", t:this.game.t});
    } else if(kind === "ko"){
      const s = this.side[sideOf(a)]; if(s) s.ko = 0.001;
      this.say2(`${strip(b ? b.name : "")} est K.O. !`);
    } else if(kind === "enter" || kind === "swap"){
      const f = kind === "swap" ? c : b;
      setTimeout(()=>{ if(this.battling) this.enter(sideOf(a), f, 0); }, 700);
    } else if(kind === "finish"){
      this.banner = {win:a, t:this.game.t};
    }
    this.renderBattle();
  }
  say2(t){ this.line = t; this.lineT = this.game.t; this.renderBattle(); }
  renderBattle(){
    const g = G(), B = g && g.BATTLE;
    if(!this.battling || !B){ this.bat.className = ""; return; }
    const A = B.allies[B.a], F = B.foes[B.f];
    const plate = (f, list, idx, foe) => `<div class="bt-plate ${foe ? "foe" : "me"}">
      <div class="bt-nm"><b>${esc(f.name)}</b><span>N.${f.level}</span>${f.status && g.ref("STATUS") ? `<em>${esc(g.ref("STATUS")[f.status.k].ab)}</em>` : ""}</div>
      <div class="bt-hp"><i style="width:${Math.max(0, f.hp / f.maxHp * 100).toFixed(1)}%" class="${f.hp / f.maxHp > 0.5 ? "" : f.hp / f.maxHp > 0.2 ? "mid" : "low"}"></i></div>
      <div class="bt-row"><span>${Math.max(0, Math.ceil(f.hp))} / ${f.maxHp}</span><span class="bt-balls">${list.map((x, i)=>`<i class="${x.hp <= 0 ? "ko" : i === idx ? "on" : ""}"></i>`).join("")}</span></div></div>`;
    const last = strip(B.log[B.log.length - 1] || "");
    this.bat.innerHTML = `${plate(F, B.foes, B.f, true)}${plate(A, B.allies, B.a, false)}
      <div class="bt-log">${esc(this.line && this.game.t - this.lineT < 2.2 ? this.line : last)}</div>
      ${this.banner ? `<div class="bt-banner ${this.banner.win ? "win" : "lose"}">${this.banner.win ? "VICTOIRE" : "DÉFAITE"}</div>` : ""}`;
    this.bat.className = "on";
  }
  end(win){
    const g = G();
    window.rivalEnd(this.rv, win, this.R.prize);
    g.S.flags.pcRivalDay = window.today(); window.saveSoon();
    setTimeout(()=>this.verdict(win), 1100);
  }
  verdict(win){
    const rv = this.rv, P = this.R.prize;
    this.box.innerHTML = `<div class="dl-in verdict ${win ? "won" : "lost"}">
      <div class="dl-who"><b>${esc(rv.n)}</b><span>${win ? "défi remporté" : "défi perdu"}</span></div>
      <p class="dl-txt">« ${esc(win ? rv.win : rv.lose)} »</p>
      ${win ? `<div class="dl-gains"><span><b>+${window.fmt(P.coins)}</b> PokéCoins</span><span><b>+${P.shards}</b> Fragments</span>${P.cores ? `<span><b>+1</b> Noyau</span>` : ""}${P.first ? `<span class="t">Titre débloqué : <b>${esc(rv.title)}</b></span>` : ""}</div>`
        : `<div class="dl-prize">Rien n'est perdu. ${esc(rv.n)} reviendra demain, et ton équipe aussi.</div>`}
      <div class="dl-acts"><button data-d="ok"><kbd>E</kbd> Reprendre la route</button></div></div>`;
    this.box.className = "on";
    this.dialog = {rv, verdict:true};
    this.box.onclick = e => { if(e.target.closest("[data-d]")) this.closeVerdict(); };
    this.keyFn = e => { if(e.code === "KeyE" || e.code === "Enter" || e.code === "Space" || e.code === "Escape"){ this.closeVerdict(); e.preventDefault(); } };
    addEventListener("keydown", this.keyFn);
    try { window.Sfx[win ? "win" : "lose"](); } catch(e){}
  }
  closeVerdict(){
    this.closeDialog();
    this.battling = false; this.banner = null; this.line = "";
    for(const k of ["a", "f"]) if(this.side[k]){ this.side[k].sprite.dispose(); this.side[k] = null; }
    this.bat.className = "";
    window.arEvent = this.origAr;
    G().BATTLE = null;
    const M = G().ref("Music"); try { if(M){ M.ctxOverride = "capture_kanto"; M.sync(); } } catch(e){}
    this.gone = 0.001;                          /* il s'en va : il se défait en pixels */
    this.game.setMode("play");
    this.game.resume();
    window.checkAchievements && window.checkAchievements();
  }
  update(dt, t){
    const g = G(), cam = this.game.engine.camera, env = this.game.env;
    const show = this.present();
    this.sprite.group.visible = show;
    if(show){
      this.sprite.update(t, dt, this.pos, this.heading, cam.position, env);
      if(this.gone > 0){
        this.gone += dt; this.sprite.uniforms.uGlitch.value = Math.min(1, this.gone);
        if(this.gone > 1.1){ this.gone = 0; this.sprite.uniforms.uGlitch.value = 0; }
      }
      if(!this.noticed && this.game.mode === "play" && this.game.player.pos.distanceTo(this.pos) < 9){
        this.noticed = true;
        this.game.wild.emote({pos:this.pos, sprite:{drawH:1.72}, H:1.72, state:"npc"}, "!");
      }
    }
    if(!this.battling) return;
    const B = g.BATTLE;
    if(B) B.turbo = this.game.input.down("ShiftLeft") || this.game.input.down("ShiftRight");
    for(const k of ["a", "f"]){
      const s = this.side[k]; if(!s) continue;
      s.appear += dt;
      const base = k === "a" ? this.allyAt : this.foeAt;
      const toward = k === "a" ? this.dir : this.dir.clone().negate();
      const pos = base.clone().addScaledVector(toward, Math.sin(Math.min(1, 1 - s.lunge) * Math.PI) * 0.6 * (s.lunge > 0 ? 1 : 0));
      s.lunge = Math.max(0, s.lunge - dt * 2.4);
      if(s.hurt > 0){ pos.x += Math.sin(t * 60) * 0.06 * s.hurt; s.hurt = Math.max(0, s.hurt - dt * 2.5); }
      s.sprite.uniforms.uFlash.value = s.hurt * 0.7;
      s.sprite.uniforms.uGlitch.value = s.ko > 0 ? Math.min(1, s.ko) : Math.max(0, 1 - Math.max(0, s.appear) * 1.6);
      if(s.ko > 0){ s.ko += dt * 1.2; pos.y -= s.ko * 0.4; }
      if(s.appear < 0){ s.sprite.group.visible = false; continue; }
      s.sprite.group.visible = s.ko < 1;
      const heading = Math.atan2(toward.x, toward.z);
      s.sprite.update(t, dt, pos, heading, cam.position, env);
    }
    if(Math.floor(t * 4) !== Math.floor((t - dt) * 4)) this.renderBattle();
  }
  drawOverlay(c, t, hud){
    this.pops = this.pops.filter(p=>t - p.t < 1.1);
    for(const p of this.pops){
      const k = t - p.t, s = hud.project(p.at.clone().add(new THREE.Vector3(0, k * 0.6, 0)));
      if(s.behind) continue;
      c.globalAlpha = Math.min(1, (1.1 - k) * 3);
      c.font = `bold ${p.big ? 34 : 26}px 'Pixelify Sans', sans-serif`; c.textAlign = "center";
      c.lineWidth = 5; c.strokeStyle = "rgba(0,0,0,.75)"; c.strokeText(p.txt, s.x, s.y);
      c.fillStyle = p.col; c.fillText(p.txt, s.x, s.y);
      c.globalAlpha = 1;
    }
  }
}
