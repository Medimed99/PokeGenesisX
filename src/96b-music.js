/* ============================================================
   96b — LA MUSIQUE
   Le jeu n'a pas de musique propre : elle sera composée à part et
   déposée en fichiers mp3 dans assets/music/. Ce module sait déjà
   quoi jouer et quand ; il reste muet tant qu'un morceau manque.

   Deux sortes de pistes :
   · les AMBIANCES, en boucle, selon l'écran ou la situation ;
   · les JINGLES, joués une fois par-dessus (l'ambiance baisse le
     temps qu'ils passent, puis remonte).

   Pour ajouter un morceau : poser assets/music/<clé>.mp3 puis
   reconstruire (build_web.py dresse la liste des fichiers présents).
   ============================================================ */

const MUSIC_TRACKS = {
  /* ambiances (boucle) */
  accueil:        {loop:1, n:"Accueil", d:"L'écran d'accueil et les menus. Le thème principal du jeu."},
  capture_kanto:  {loop:1, n:"Capture — Kanto", d:"Les hautes herbes de Kanto.", fb:"capture"},
  capture_johto:  {loop:1, n:"Capture — Johto", d:"Johto.", fb:"capture"},
  capture_hoenn:  {loop:1, n:"Capture — Hoenn", d:"Hoenn.", fb:"capture"},
  capture:        {loop:1, n:"Capture", d:"Thème de capture par défaut (si une région n'a pas le sien)."},
  peche:          {loop:1, n:"Pêche", d:"Mode pêche.", fb:"capture"},
  collection:     {loop:1, n:"Collection", d:"Pokédex, cartes, couveuse, sac, profil.", fb:"accueil"},
  forage:         {loop:1, n:"Forage", d:"Le puits, la forge, les fouilles."},
  expedition:     {loop:1, n:"Expédition", d:"La carte d'expédition."},
  tour:           {loop:1, n:"Tour", d:"La Tour et ses ailes."},
  breche:         {loop:1, n:"Brèche", d:"La Brèche, pendant la partie."},
  poker:          {loop:1, n:"Poké-Poker", d:"La table de jeu."},
  combat:         {loop:1, n:"Combat", d:"Combat ordinaire (sauvage, dresseur)."},
  combat_boss:    {loop:1, n:"Combat de boss", d:"Champion, élite, noyau, gardiens.", fb:"combat"},
  legendaire:     {loop:1, n:"Légendaire", d:"Rencontre ou combat contre un légendaire, raid mondial.", fb:"combat_boss"},
  monde:          {loop:1, n:"Le Monde", d:"La carte du monde à restaurer.", fb:"accueil"},
  rival:          {loop:1, n:"Rival", d:"Un dresseur rémanent vous défie : l'écran de rencontre.", fb:"combat_boss"},
  souvenir:       {loop:1, n:"Souvenir", d:"Les souvenirs de Porygon-Z, et la mémoire qui revient. Lent, doux, un peu abîmé.", fb:"accueil"},
  couche_zero:    {loop:1, n:"Couche Zéro", d:"La descente sous les trois secteurs, et le combat contre MissingNo.", fb:"legendaire"},
  verite:         {loop:1, n:"Le nom", d:"La révélation, puis la question. Le thème le plus important du jeu.", fb:"souvenir"},
  generique:      {loop:1, n:"Générique", d:"Le générique de fin, après avoir écrit.", fb:"accueil"},
  /* jingles (une fois) */
  j_victoire:     {n:"Victoire", d:"Fin d'un combat gagné (3 à 6 s)."},
  j_defaite:      {n:"Défaite", d:"Combat perdu (2 à 4 s)."},
  j_niveau:       {n:"Niveau supérieur", d:"Montée de niveau d'Archiviste (3 à 5 s)."},
  j_decouverte:   {n:"Nouvelle espèce", d:"Première capture d'une espèce (2 à 3 s)."},
  j_rare:         {n:"Capture rare", d:"Capture très rare, chromatique ou légendaire (4 à 6 s)."},
  j_evolution:    {n:"Évolution", d:"Un Pokémon évolue (5 à 8 s)."},
  j_chapitre:     {n:"Nouveau chapitre", d:"Carton-titre d'un chapitre (4 à 6 s)."},
  j_restauration: {n:"Restauration", d:"Un chantier du monde est terminé (3 à 5 s)."}
};
/* la liste des fichiers présents est écrite par build_web.py ; sans elle, on tente quand même */
function musicHas(k){
  if(typeof MUSIC_AVAILABLE !== "undefined") return MUSIC_AVAILABLE.includes(k);
  return !Music.missing[k];
}
function musicResolve(k){
  let g = 0;
  while(k && g++ < 4){ if(musicHas(k)) return k; k = MUSIC_TRACKS[k] && MUSIC_TRACKS[k].fb; }
  return null;
}
const Music = {
  cur:null, el:null, missing:{}, duck:1, unlocked:false, ctxOverride:null,
  on(){ return !!(S && S.settings && S.settings.music !== false) && typeof Audio !== "undefined"; },
  vol(){ return ((S && S.settings && S.settings.musicVol) || 70) / 100 * 0.6; },
  url(k){ return "assets/music/" + k + ".mp3"; },
  /* joue une ambiance ; ne fait rien si c'est déjà elle */
  play(key){
    const k = musicResolve(key);
    if(!this.on() || !k){ this.stop(); return; }
    if(this.cur === k && this.el) return;
    const old = this.el;
    let a;
    try { a = new Audio(this.url(k)); } catch(e){ return; }
    a.loop = true; a.volume = 0; a.preload = "auto";
    a.onerror = () => { this.missing[k] = true; if(this.el === a){ this.el = null; this.cur = null; } };
    this.el = a; this.cur = k;
    const p = a.play(); if(p && p.catch) p.catch(()=>{});
    this.fade(a, this.vol() * this.duck, 700);
    if(old) this.fade(old, 0, 600, ()=>{ try { old.pause(); } catch(e){} });
  },
  stop(){
    const old = this.el; this.el = null; this.cur = null;
    if(old) this.fade(old, 0, 400, ()=>{ try { old.pause(); } catch(e){} });
  },
  /* un jingle : l'ambiance baisse, puis revient */
  jingle(key){
    if(!this.on() || !musicHas(key)) return;
    let a; try { a = new Audio(this.url(key)); } catch(e){ return; }
    a.volume = Math.min(1, this.vol() * 1.4);
    a.onerror = () => { this.missing[key] = true; this.unduck(); };
    a.onended = () => this.unduck();
    this.duck = 0.18; if(this.el) this.fade(this.el, this.vol() * this.duck, 250);
    const p = a.play(); if(p && p.catch) p.catch(()=>this.unduck());
    clearTimeout(this._dk); this._dk = setTimeout(()=>this.unduck(), 12000);
  },
  unduck(){ this.duck = 1; if(this.el) this.fade(this.el, this.vol(), 900); },
  fade(a, to, ms, done){
    const from = a.volume, t0 = Date.now();
    clearInterval(a._fd);
    a._fd = setInterval(()=>{
      const k = Math.min(1, (Date.now() - t0) / ms);
      try { a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch(e){}
      if(k >= 1){ clearInterval(a._fd); if(done) done(); }
    }, 40);
  },
  /* la piste qui convient à l'écran courant */
  pick(){
    if(this.ctxOverride) return this.ctxOverride;
    const s = typeof currentScreen !== "undefined" ? currentScreen : "";
    if(s === "capture") return (S && S.capMode === "fish") ? "peche" : "capture_" + ((S && S.region) || "kanto");
    if(s === "idle") return "forage";
    if(s === "expedition") return "expedition";
    if(s === "tower" || s === "squad") return "tour";
    if(s === "breche") return "breche";
    if(s === "poker") return "poker";
    if(s === "world") return "monde";
    if(s === "battle") return "combat";
    if(["dex", "cards", "eggs", "bag", "shop", "profile", "atelier", "team"].includes(s)) return "collection";
    return "accueil";
  },
  sync(){ if(this.unlocked) this.play(this.pick()); }
};
/* les navigateurs n'autorisent le son qu'après un premier geste */
if(typeof document !== "undefined" && document.addEventListener)
  document.addEventListener("pointerdown", ()=>{ if(!Music.unlocked){ Music.unlocked = true; Music.sync(); } }, {capture:true});

/* chaque changement d'écran choisit sa piste */
if(typeof go === "function"){
  const _go = go;
  go = function(name, arg){ const r = _go(name, arg); try { Music.sync(); } catch(e){} return r; };
}
/* les combats : boss et légendaires ont leur thème, la fin a son jingle */
if(typeof createBattle === "function"){
  const _cb = createBattle;
  createBattle = function(allies, foes, opts){
    opts = opts || {};
    const leg = (foes || []).some(f=>f && POKE[f.id] && POKE[f.id].leg);
    Music.ctxOverride = leg ? "legendaire" : (opts.stage === "boss" || opts.stage === "elite" || opts.boss) ? "combat_boss" : "combat";
    const end = opts.onEnd;
    opts.onEnd = function(win){
      Music.ctxOverride = null;
      Music.jingle(win ? "j_victoire" : "j_defaite");
      setTimeout(()=>{ try { Music.sync(); } catch(e){} }, 60);
      return end ? end.apply(this, arguments) : undefined;
    };
    const B = _cb(allies, foes, opts);
    try { Music.sync(); } catch(e){}
    return B;
  };
}
/* réglages : musique activée par défaut */
function musicDefaults(){ if(S && S.settings){ if(S.settings.music === undefined) S.settings.music = true; if(!S.settings.musicVol) S.settings.musicVol = 70; } }
ACTIONS.musicvol = d => { musicDefaults(); S.settings.musicVol = clamp(+d.v || 70, 0, 100); if(Music.el) Music.el.volume = Music.vol(); saveSoon(); refresh(); };

/* couper la musique depuis les réglages l'arrête tout de suite */
if(ACTIONS.toggleset){
  const _ts = ACTIONS.toggleset;
  ACTIONS.toggleset = d => {
    if(d.k === "music"){ musicDefaults(); S.settings.music = !S.settings.music; if(!S.settings.music) Music.stop(); else Music.sync(); save(); refresh(); return; }
    return _ts(d);
  };
}
function musicSettingsHtml(){
  musicDefaults();
  const have = Object.keys(MUSIC_TRACKS).filter(k=>musicHas(k) && typeof MUSIC_AVAILABLE !== "undefined").length;
  return `<div class="row between" style="padding:7px 0">
      <div class="grow"><div class="tiny">Musique</div>
        <div class="tiny dim">${have ? `${have} morceau${have > 1 ? "x" : ""} installé${have > 1 ? "s" : ""}` : "Aucun morceau installé pour l'instant"}</div></div>
      <button class="switch ${S.settings.music ? "on" : ""}" data-act="toggleset" data-k="music" aria-label="Musique"><i></i></button>
    </div>
    ${S.settings.music ? `<div class="row" style="gap:6px;padding:0 0 6px">${[30, 50, 70, 100].map(v=>`<button class="chip ${S.settings.musicVol === v ? "on" : ""}" data-act="musicvol" data-v="${v}">${v} %</button>`).join("")}</div>` : ""}`;
}
