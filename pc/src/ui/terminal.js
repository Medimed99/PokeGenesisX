/* ============================================================
   LE TERMINAL
   Tout le jeu mobile, au centre de l'écran, comme l'appareil de
   l'archiviste : Pokédex, équipe, sac, quêtes, Tour, Brèche,
   Expédition, Poké-Poker… Tab l'ouvre et le ferme. Une scène, une
   fiche ou une révélation qui s'ouvre pendant la promenade l'ouvre
   d'elle-même, et le referme quand c'est fini.
   ============================================================ */
const LAYERS = ["cine", "story", "sheet-root", "discover", "fragread", "tuto", "breche", "boot"];

export class Terminal {
  constructor(game){
    this.game = game; this.open = false; this.auto = false;
    this.el = document.getElementById("terminal");
    const watch = new MutationObserver(()=>this.check());
    for(const id of LAYERS){ const n = document.getElementById(id); if(n) watch.observe(n, {attributes:true, attributeFilter:["class", "style"]}); }
    /* les scènes de rival du mobile s'ajoutent au corps de la page */
    new MutationObserver(()=>this.check()).observe(document.body, {childList:true});
    this.el.addEventListener("mousedown", e=>{ if(e.target === this.el && !this.layerOn()) this.close(); });
  }
  layerOn(){
    for(const id of LAYERS){
      const n = document.getElementById(id);
      if(!n) continue;
      if(id === "boot"){ if(n.style.display === "flex") return id; continue; }
      if(/\bon\b/.test(n.className || "")) return id;
    }
    if(document.getElementById("rv")) return "rv";
    return null;
  }
  check(){
    const L = this.layerOn();
    /* pendant un dialogue ou un combat, la scène attend la fin (le jeu revérifie au retour sur la route) */
    if(L && !this.open && (this.game.mode === "dialog" || this.game.mode === "battle")) return;
    if(L && !this.open && this.game.mode !== "title") this.show(null, true);
    else if(!L && this.open && this.auto){ clearTimeout(this._t); this._t = setTimeout(()=>{ if(!this.layerOn() && this.auto) this.close(); }, 350); }
  }
  show(screen, auto){
    if(screen && window.go) window.go(screen);
    this.el.classList.add("on"); this.el.setAttribute("aria-hidden", "false");
    this.open = true; this.auto = !!auto;
    this.prevMode = this.game.mode === "terminal" ? this.prevMode : this.game.mode;
    this.game.setMode("terminal");
    this.game.input.unlock();
    try { window.renderTopbar && window.renderTopbar(); window.renderDock && window.renderDock(); } catch(e){}
    try { window.refresh && window.refresh(); } catch(e){}
  }
  close(){
    if(!this.open) return;
    if(this.layerOn()){ this.auto = true; return; }            /* une scène en cours : elle se finit d'abord */
    this.el.classList.remove("on"); this.el.setAttribute("aria-hidden", "true");
    this.open = false; this.auto = false;
    const back = ["title", "dialog", "battle"].includes(this.prevMode) ? this.prevMode : "play";
    this.game.setMode(back);
    const S = this.game.S;
    if(this.game.pendingIntro){
      this.game.pendingIntro = false;
      if(S && !S.story.includes("intro")){ this.game.enter(); return; }
    }
    if(back === "play") this.game.resume();
  }
  toggle(){ if(this.open) this.close(); else this.show(null, false); }
  /* Échap dans le terminal : d'abord la fiche ouverte, puis le terminal lui-même */
  escape(){
    const sheetRoot = document.getElementById("sheet-root");
    if(sheetRoot && /\bon\b/.test(sheetRoot.className) && window.closeSheet){ window.closeSheet(); return; }
    if(!this.layerOn()) this.close();
  }
}
