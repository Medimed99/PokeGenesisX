/* ============================================================
   L'ÉCRAN TITRE ET LA PAUSE
   Le titre se pose sur la route qui vit derrière (la caméra flâne).
   La pause s'ouvre avec Échap : reprendre, le terminal, les options
   (qualité, champ de vision, sensibilité, heure), les commandes.
   ============================================================ */
import { Settings, saveSettings } from "../settings.js";
import { QUALITY } from "../engine.js";

const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const KEYS = [
  ["Z Q S D · W A S D", "se déplacer"], ["Maj", "courir"], ["Espace", "sauter (on descend une corniche, on ne la remonte pas)"],
  ["Souris", "regarder"], ["Clic droit (maintenir)", "viser : le cercle se resserre"], ["Clic gauche", "lancer la Ball"],
  ["1 à 5 · molette", "choisir la Ball"], ["6 à 0", "utiliser une baie"], ["E", "parler, interagir"],
  ["F", "sortir la canne (au bord du lac)"], ["Tab", "le terminal : Pokédex, équipe, sac, quêtes, modules"], ["Échap", "pause"]
];

export class Menus {
  constructor(game){
    this.game = game;
    this.title = document.createElement("div"); this.title.id = "pc-title"; this.title.className = "off";
    document.body.appendChild(this.title);
    this.pause = document.createElement("div"); this.pause.id = "pc-pause";
    document.body.appendChild(this.pause);
    this.tab = "main";
  }
  showTitle(){
    const g = window.PCG, S = g && g.S, fresh = !this.game.boot || this.game.boot.fresh;
    const dex = S ? Object.keys(S.dex).length : 0;
    const online = g && g.ref("Net");
    const canRestore = fresh && online && online.configured && online.configured();
    this.title.innerHTML = `
      <div class="pt-logo"><span class="pl-k">POKÉMON</span><b data-t="CODE GENESIS">CODE<br>GENESIS</b><em>La Route 1, telle que l'archive s'en souvient</em></div>
      <div class="pt-who">${fresh ? `<span>Une nouvelle partie. La même que sur téléphone, si tu en as une : connecte-toi depuis le terminal.</span>`
        : `<b>${esc(S.name || "ARCHIVISTE")}</b><span>niveau ${S.level} · ${dex} espèce${dex > 1 ? "s" : ""} · intégrité ${S.integrity.toFixed(1)} %</span>`}</div>
      <div class="pt-menu">
        <button class="pt-btn main" data-m="play">${fresh ? "Commencer" : "Entrer dans l'archive"}</button>
        ${canRestore ? `<button class="pt-btn" data-m="restore">J'ai déjà une partie</button>` : ""}
        <button class="pt-btn" data-m="options">Options</button>
        <button class="pt-btn" data-m="keys">Commandes</button>
        <a class="pt-btn" href="./" data-m="mobile">Version mobile</a>
      </div>
      <div class="pt-foot">Même partie que le jeu mobile : captures, Pokédex, quêtes et compte en ligne sont partagés.<br>Jeu de fan non officiel.</div>`;
    this.title.classList.remove("off");
    this.title.onclick = e => {
      const b = e.target.closest("[data-m]"); if(!b) return;
      const m = b.dataset.m;
      if(m === "play"){ this.title.classList.add("off"); this.game.enter(); }
      if(m === "restore"){ this.title.classList.add("off"); this.game.restore(); }
      if(m === "options" || m === "keys"){ this.openPause(m); }
    };
  }
  hideTitle(){ this.title.classList.add("off"); }
  openPause(tab){
    this.tab = tab || "main";
    this.renderPause();
    this.pause.classList.add("on");
    this.game.setMode(this.game.mode === "title" ? "title" : "pause");
  }
  closePause(){
    this.pause.classList.remove("on");
    if(this.game.mode === "pause"){ this.game.setMode("play"); this.game.resume(); }
  }
  renderPause(){
    const inGame = this.game.mode !== "title" && this.game.started;
    const tabs = [["main", inGame ? "Reprendre" : "Retour"], ["terminal", "Terminal"], ["options", "Options"], ["keys", "Commandes"]];
    const seg = (key, opts, cur) => `<div class="pp-seg">${opts.map(([v, l])=>`<button data-set="${key}" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
    let body = "";
    if(this.tab === "options"){
      body = `<h3>OPTIONS</h3>
        <div class="pp-row"><label>Qualité graphique<small>Herbe, ombres, occlusion ambiante, finesse</small></label>${seg("quality", Object.keys(QUALITY).map(k=>[k, QUALITY[k].label]), Settings.quality)}</div>
        <div class="pp-row"><label>Champ de vision<small>${Settings.fov}°</small></label><input type="range" min="60" max="100" step="1" value="${Settings.fov}" data-range="fov"></div>
        <div class="pp-row"><label>Sensibilité de la souris<small>×${Settings.sens.toFixed(2)}</small></label><input type="range" min="0.25" max="3" step="0.05" value="${Settings.sens}" data-range="sens"></div>
        <div class="pp-row"><label>Inverser l'axe vertical</label>${seg("invertY", [[false, "Non"], [true, "Oui"]], Settings.invertY)}</div>
        <div class="pp-row"><label>Heure du jour<small>Réelle : le ciel suit ton horloge (nuit, aube, soir)</small></label>${seg("time", [["reel", "Réelle"], ["jour", "Toujours le jour"]], Settings.time)}</div>
        <div class="pp-row"><label>Effets réduits<small>Moins de déchirures de l'image et de flashs (réglage partagé avec le jeu mobile)</small></label>${seg("calm", [[false, "Non"], [true, "Oui"]], typeof window.calmFx === "function" && window.calmFx())}</div>
        <div class="pp-row"><label>Volume des sons<small>${Math.round(Settings.volume * 100)} %</small></label><input type="range" min="0" max="1" step="0.05" value="${Settings.volume}" data-range="volume"></div>`;
    } else if(this.tab === "keys"){
      body = `<h3>COMMANDES</h3><div class="pp-keys">${KEYS.map(([k, d])=>`<kbd>${esc(k)}</kbd><span>${esc(d)}</span>`).join("")}</div>`;
    } else {
      body = `<h3>LA ROUTE 1</h3><p style="margin:0 0 10px;line-height:1.6">Les Pokémon se cachent dans les hautes herbes (elles frémissent) ou flânent sur la route.
        Approche, vise, lance. Au bord du lac, sors la canne. Un dresseur rémanent attend quelque part sur la route.</p>
        <p style="margin:0;color:#8ea4bf;line-height:1.6">Le reste du jeu — Pokédex, équipe, Tour, Brèche, Expédition, Poké-Poker — est dans le terminal (Tab).</p>`;
    }
    this.pause.innerHTML = `<div class="pp-card"><div class="pp-side"><h2>${inGame ? "Pause" : "Réglages"}</h2><p>Pokémon Code Genesis · PC</p>
      <div class="pp-nav">${tabs.map(([k, l])=>`<button data-tab="${k}" class="${this.tab === k ? "on" : ""} ${k === "main" ? "main" : ""}">${l}</button>`).join("")}</div></div>
      <div class="pp-body">${body}</div></div>`;
    this.pause.onclick = e => {
      const t = e.target.closest("[data-tab]");
      if(t){
        const k = t.dataset.tab;
        if(k === "main" && (this.tab === "main" || !inGame)){ if(inGame) this.closePause(); else { this.pause.classList.remove("on"); } return; }
        if(k === "main" && inGame){ this.closePause(); return; }
        if(k === "terminal"){ this.pause.classList.remove("on"); this.game.terminal.show(null, false); return; }
        this.tab = k; this.renderPause(); return;
      }
      const s = e.target.closest("[data-set]");
      if(s){
        let v = s.dataset.v; if(v === "true") v = true; else if(v === "false") v = false;
        if(s.dataset.set === "calm"){
          const S = window.PCG && window.PCG.S;
          if(S){ S.settings.calm = v; try { window.applyCalm(); window.saveSoon(); } catch(err){} }
          this.renderPause(); return;
        }
        Settings[s.dataset.set] = v; saveSettings();
        if(s.dataset.set === "quality"){ Settings.qualityManual = true; saveSettings(); this.game.setQuality(v); }
        this.renderPause();
      }
      if(e.target === this.pause && inGame) this.closePause();
    };
    this.pause.oninput = e => {
      const r = e.target.closest("[data-range]"); if(!r) return;
      const k = r.dataset.range; Settings[k] = parseFloat(r.value); saveSettings();
      if(k === "fov"){ this.game.player.fov = Settings.fov; }
      if(k === "sens") this.game.input.sens = Settings.sens;
      if(k === "volume" && this.game.audio) this.game.audio.setVolume(Settings.volume);
      const small = r.parentElement.querySelector("small");
      if(small) small.textContent = k === "fov" ? Settings.fov + "°" : k === "sens" ? "×" + Settings.sens.toFixed(2) : Math.round(Settings.volume * 100) + " %";
    };
  }
}
