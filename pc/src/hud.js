/* ============================================================
   LE HUD
   Discret : un réticule ; ce qu'on vise (nom, niveau, types, la
   chance avec la Ball en main) ; la ceinture de Balls et de baies ;
   où l'on est, l'heure, la météo ; les ressources. Au-dessus des
   Pokémon, le cercle de capture qui se resserre et les « ! ».
   La fiche d'une capture glisse à droite ; une espèce inédite a
   droit au centre de l'écran.
   ============================================================ */
import * as THREE from "three";
import { BALL_ORDER } from "./capture.js";

const BERRY_ORDER = ["framby", "nanab", "nigma", "sitrus", "micle"];
const G = () => window.PCG;
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const fmt = n => (window.fmt ? window.fmt(n) : String(Math.floor(n)));

export class Hud {
  constructor(game){
    this.game = game;
    const root = document.getElementById("pchud");
    root.innerHTML = `
      <canvas id="h-over"></canvas>
      <div id="h-cross"><i></i></div>
      <div id="h-loc"><b id="h-place">Route 1</b><span id="h-sub"></span></div>
      <div id="h-res"></div>
      <div id="h-target"></div>
      <div id="h-grade"></div>
      <div id="h-prompt"></div>
      <div id="h-belt"><div id="h-balls"></div><div id="h-berries"></div></div>
      <div id="h-card"></div>
      <div id="h-new"></div>
      <div id="h-hint"></div>`;
    this.root = root;
    this.over = document.getElementById("h-over");
    this.ctx = this.over.getContext("2d");
    this.el = id => document.getElementById(id);
    this.lastBelt = ""; this.lastRes = ""; this.lastTarget = ""; this.cardT = 0;
    this.v = new THREE.Vector3();
    this.resize();
    addEventListener("resize", ()=>this.resize());
  }
  resize(){ const d = Math.min(2, devicePixelRatio || 1); this.over.width = innerWidth * d; this.over.height = innerHeight * d; this.dpr = d; }
  show(on){ this.root.classList.toggle("on", !!on); }
  project(p){
    const v = this.v.copy(p).project(this.game.engine.camera);
    return {x:(v.x * 0.5 + 0.5) * innerWidth, y:(-v.y * 0.5 + 0.5) * innerHeight, z:v.z, behind:v.z > 1};
  }
  update(dt, t){
    const g = G(); if(!g) return;
    const S = g.S, cap = this.game.capture;
    /* la ceinture (redessinée seulement quand elle change) */
    const belt = BALL_ORDER.map(k=>k + (S.balls[k] || 0)).join() + "|" + cap.sel + "|" + BERRY_ORDER.map(k=>(S.berries[k] || 0) + (S.buffs[k] ? "*" : "")).join() + (S.shinyCharge || 0);
    if(belt !== this.lastBelt){
      this.lastBelt = belt;
      this.el("h-balls").innerHTML = BALL_ORDER.map((k, i)=>`<div class="hb ${cap.sel === k ? "on" : ""} ${(S.balls[k] || 0) <= 0 ? "off" : ""}">
        <kbd>${i + 1}</kbd>${window.itemIcon("ball:" + k, 30) || ""}<b>${S.balls[k] || 0}</b><span>${esc(g.BALLS[k].name.replace(" Ball", ""))}</span></div>`).join("");
      this.el("h-berries").innerHTML = BERRY_ORDER.map((k, i)=>{ const on = S.buffs[k] || (k === "micle" && S.shinyCharge > 0);
        return `<div class="hy ${on ? "on" : ""} ${(S.berries[k] || 0) <= 0 ? "off" : ""}" title="${esc(g.BERRIES[k].name + " — " + g.BERRIES[k].d)}"><kbd>${(i + 6) % 10}</kbd>${window.itemIcon("berry:" + k, 20) || ""}<b>${S.berries[k] || 0}</b></div>`; }).join("");
    }
    /* les ressources */
    const res = Math.floor(S.coins) + "|" + S.shards + "|" + S.cores + "|" + S.integrity.toFixed(1) + "|" + S.level;
    if(res !== this.lastRes){
      this.lastRes = res;
      this.el("h-res").innerHTML = `<span>${window.ic ? window.ic("coin") : ""}<b>${fmt(S.coins)}</b></span><span>${window.ic ? window.ic("shard") : ""}<b>${fmt(S.shards)}</b></span><span>${window.ic ? window.ic("core") : ""}<b>${S.cores}</b></span>
        <div class="hr-int"><small>Intégrité de l'archive</small><i><em style="width:${S.integrity.toFixed(2)}%"></em></i><b>${S.integrity.toFixed(1)} %</b></div>
        <div class="hr-lv">${esc(S.name || "Archiviste")} · niv. ${S.level}</div>`;
    }
    /* le lieu, l'heure, la météo */
    const h = this.game.hour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    const w = g.WEATHER[S.weather] || g.WEATHER.clair;
    this.el("h-sub").textContent = `Kanto · ${String(hh).padStart(2, "0")} h ${String(mm).padStart(2, "0")} · ${w.n}`;
    /* dans une zone désindexée, le lieu lui-même se perd */
    const lost = (this.game.nearCorruption || 0) > 0.6 || (this.game.nearMissing || 0) > 0.3;
    if(lost !== this.lost){ this.lost = lost; this.el("h-place").innerHTML = lost ? `Route 1 <em>zone désindexée</em>` : "Route 1"; }
    /* la cible */
    const e = cap.target;
    let tk = "";
    if(e && this.game.mode === "play"){
      const ch = cap.chance(e);
      tk = e.id + "|" + Math.round(ch * 100) + "|" + cap.sel + "|" + (e.spec.attempts || 0);
      if(tk !== this.lastTarget){
        this.lastTarget = tk;
        if(e.spec.missing){
          this.el("h-target").innerHTML = `<b class="glitch">?????</b><div class="ht-tags"><span class="tt" style="color:#ff3d7f;border-color:#ff3d7f">SANS INDEX</span></div><div class="ht-ch">Analyser la faille</div>`;
        } else {
          const p = g.POKE[e.id], isNew = !S.dex[e.id];
          const tags = (e.spec.shiny ? `<span class="tt" style="color:#ffc857;border-color:#ffc857">CHROMATIQUE</span>` : "")
            + (isNew ? `<span class="tt" style="color:#5ce07a;border-color:#5ce07a">INÉDIT</span>` : "")
            + (e.spec.horde ? `<span class="tt" style="color:#5ce07a;border-color:#5ce07a">HORDE ${e.spec.horde.i}/${e.spec.horde.n}</span>` : "")
            + (e.spec.roam ? `<span class="tt" style="color:#ff8a3d;border-color:#ff8a3d">ERRANT · UNE SEULE BALLE</span>` : "")
            + (e.spec.featured ? `<span class="tt" style="color:#35f0d6;border-color:#35f0d6">VEDETTE</span>` : "");
          this.el("h-target").innerHTML = `<b>${esc(p.name)} <small>N.${e.spec.level}</small></b>
            <div class="ht-tags">${window.typeTags(p.types)}${window.rarTag(e.spec.rar)}${tags}</div>
            <div class="ht-ch"><span class="${ch >= 0.6 ? "ok" : ch >= 0.3 ? "mid" : "low"}">${Math.round(ch * 100)} %</span> avec la ${esc(g.BALLS[cap.sel].name)}${e.spec.attempts ? ` · ${e.spec.attempts} essai${e.spec.attempts > 1 ? "s" : ""}` : ""}</div>`;
        }
      }
    }
    this.el("h-target").classList.toggle("on", !!tk);
    if(!tk) this.lastTarget = "";
    this.el("h-cross").classList.toggle("lock", !!tk);
    this.el("h-cross").classList.toggle("aim", cap.aiming);
    this.drawOverlay(t);
    this.cardT -= dt;
    if(this.cardT <= 0) this.el("h-card").classList.remove("on");
  }
  /* le cercle de capture, les « ! » et « ? », dessinés sur une toile par-dessus la 3D */
  drawOverlay(t){
    const c = this.ctx, d = this.dpr;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.clearRect(0, 0, innerWidth, innerHeight);
    const cap = this.game.capture, e = cap.target;
    if(e && this.game.mode === "play" && !e.spec.missing){
      const h = e.sprite.drawH || e.H;
      const top = this.project(new THREE.Vector3(e.pos.x, e.pos.y + h, e.pos.z)), bot = this.project(new THREE.Vector3(e.pos.x, e.pos.y, e.pos.z));
      if(!top.behind && !bot.behind){
        const cx = (top.x + bot.x) / 2, cy = (top.y + bot.y) / 2, size = Math.max(26, Math.abs(bot.y - top.y) * 0.62);
        const ch = cap.chance(e), col = ch >= 0.6 ? "#5ce07a" : ch >= 0.3 ? "#ffd24a" : "#ff5a5a";
        const r = cap.ring();
        c.lineWidth = 2.5;
        c.strokeStyle = "rgba(255,255,255,0.85)";
        c.beginPath(); c.arc(cx, cy, size * 0.18 + 6, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = col; c.lineWidth = 3.2;
        c.globalAlpha = 0.55 + 0.45 * cap.aimK;
        c.beginPath(); c.arc(cx, cy, Math.max(size * 0.18 + 8, size * r), 0, Math.PI * 2); c.stroke();
        c.globalAlpha = 1;
      }
    }
    /* les émotions au-dessus des Pokémon */
    const W = this.game.wild;
    W.emotes = W.emotes.filter(m=>t - m.t < 1.6 && m.e.state !== "gone");
    for(const m of W.emotes){
      const h = m.e.sprite.drawH || m.e.H, p = this.project(new THREE.Vector3(m.e.pos.x, m.e.pos.y + h + 0.25, m.e.pos.z));
      if(p.behind) continue;
      const k = t - m.t, pop = Math.min(1, k * 6), y = p.y - pop * 8;
      c.globalAlpha = Math.min(1, (1.6 - k) * 3);
      c.fillStyle = "#fff"; c.strokeStyle = "#111"; c.lineWidth = 2.5;
      c.beginPath(); c.roundRect ? c.roundRect(p.x - 11, y - 30, 22, 26, 5) : c.rect(p.x - 11, y - 30, 22, 26); c.fill(); c.stroke();
      c.fillStyle = m.kind === "!" ? "#e02828" : "#2860e0"; c.font = "bold 20px 'Pixelify Sans', sans-serif"; c.textAlign = "center";
      c.fillText(m.kind, p.x, y - 10);
      c.globalAlpha = 1;
    }
    if(this.game.fishing && this.game.fishing.drawOverlay) this.game.fishing.drawOverlay(c, t, this);
    if(this.game.trainer && this.game.trainer.drawOverlay) this.game.trainer.drawOverlay(c, t, this);
  }
  prompt(html){ const el = this.el("h-prompt"); if(el.innerHTML !== html) el.innerHTML = html; el.classList.toggle("on", !!html); }
  hint(html, dur = 5){ const el = this.el("h-hint"); el.innerHTML = html; el.classList.add("on"); clearTimeout(this._ht); this._ht = setTimeout(()=>el.classList.remove("on"), dur * 1000); }
  grade(gr){
    const el = this.el("h-grade");
    if(!gr){ el.className = ""; return; }
    el.innerHTML = `<b style="color:${gr.c}">${esc(gr.n)} !</b><small>×${gr.mul.toFixed(2).replace(".", ",")}</small>`;
    el.className = ""; void el.offsetWidth; el.className = "on";
  }
  /* la fiche d'une capture : à droite, ou au centre pour une espèce inédite */
  caught(c, rw, isNew){
    const g = G(), p = g.POKE[c.id];
    const research = typeof window.researchCatchHtml === "function" ? window.researchCatchHtml(c.id) : "";
    const body = `<div class="hc-spr">${window.sprite(c.id, c.shiny, "", {anim:true, eager:true})}</div>
      <div class="hc-txt"><small>${isNew ? "NOUVELLE ENTRÉE" : "CAPTURÉ"}</small><b>${esc(p.name)}${c.shiny ? ' <i class="hc-sh">◆</i>' : ""}</b>
      <div class="hc-tags">${window.typeTags(p.types)}${window.rarTag(c.rar)}<span class="tt">N.${c.level}</span></div>
      <div class="hc-rw"><span>+${fmt(rw.coins)} PokéCoins</span><span>+${fmt(rw.xp)} exp</span><span>+${rw.integ.toFixed(2).replace(".", ",")} % intégrité</span></div>
      ${research ? `<div class="hc-res">${research}</div>` : ""}</div>`;
    if(isNew){
      const el = this.el("h-new");
      const lore = typeof window.loreOf === "function" ? window.loreOf(c.id) : "";
      el.innerHTML = `<div class="hn-in"><div class="hn-num">N° ${String(c.id).padStart(3, "0")}</div>${body}
        ${lore ? `<p class="hn-lore">${esc(lore)}</p>` : ""}<div class="hn-go">Clic ou Entrée pour continuer</div></div>`;
      el.className = "on";
      this.game.blockUntil = performance.now() + 900;
      this.newOpen = true;
      try { window.Music && window.Music.jingle && window.Music.jingle(c.shiny || c.rar >= 4 ? "j_rare" : "j_decouverte"); } catch(e){}
    } else {
      const el = this.el("h-card");
      el.innerHTML = body;
      el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
      this.cardT = 3.6;
      try { if((c.shiny || c.rar >= 4) && window.Music && window.Music.jingle) window.Music.jingle("j_rare"); } catch(e){}
      /* une scène peut suivre (le premier chromatique…) : elle s'ouvre dans le terminal */
      if(typeof window.checkStoryTriggers === "function") setTimeout(()=>{ if(!this.newOpen) window.checkStoryTriggers(); }, 1400);
    }
  }
  closeNew(){
    if(!this.newOpen || performance.now() < (this.game.blockUntil || 0)) return false;
    this.el("h-new").className = ""; this.newOpen = false;
    /* une scène peut attendre derrière (le premier chromatique…) */
    if(typeof window.checkStoryTriggers === "function") setTimeout(()=>window.checkStoryTriggers(), 250);
    return true;
  }
}
