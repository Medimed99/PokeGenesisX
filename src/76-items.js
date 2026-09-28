/* ============================================================
   76 — OBJETS ET VARIANCE
   Reprise structurée de la v1 : consommables temporisés, radar,
   trésors vendables. Plus un système de jours fastes, qui assume
   que certaines sessions soient exceptionnellement généreuses.
   ============================================================ */

/* ---------- consommables à durée ----------
   Puits à monnaie principal du milieu de partie : on paie maintenant
   pour une fenêtre de jeu plus rentable, ce qui donne du poids aux
   sessions courtes et une raison de dépenser ses réserves. */
const BOOSTS = {
  b_xp:    {n:"Amulette d'Expérience", min:15, price:1900,  cur:"coins",  k:"xp",    spr:113,
            d:"+40% d'expérience sur tout ce que vous faites."},
  b_coin:  {n:"Bourse Dorée",          min:20, price:3200,  cur:"coins",  k:"coin",  spr:52,
            d:"PokéCoins ×1.8 sur chaque capture."},
  b_lure:  {n:"Appât Marin",           min:15, price:2200,  cur:"coins",  k:"lure",  spr:129,
            d:"La sonde devient gratuite et remonte des prises plus rares."},
  b_rare:  {n:"Encens Mystique",       min:10, price:4800,  cur:"coins",  k:"rare",  spr:96,
            d:"Les raretés élevées deviennent beaucoup plus fréquentes."},
  b_new:   {n:"Charme de Collection",  min:20, price:9000,  cur:"coins",  k:"new",   spr:233,
            d:"Une rencontre sur cinq est forcée sur une espèce que vous n'avez pas."},
  b_shiny: {n:"Talisman Chanceux",     min:30, price:50,    cur:"shards", k:"shiny", spr:151,
            d:"Chance de chromatique doublée."}
};
function boostActive(k){
  return !!(S.boosts && S.boosts[k] && S.boosts[k] > Date.now());
}
function boostLeft(k){ return boostActive(k) ? S.boosts[k] - Date.now() : 0; }
function activeBoosts(){ return Object.keys(BOOSTS).filter(k=>boostActive(BOOSTS[k].k)); }
function startBoost(id){
  const b = BOOSTS[id];
  S.boosts = S.boosts || {};
  /* un achat pendant que l'effet court prolonge au lieu d'écraser */
  const from = boostActive(b.k) ? S.boosts[b.k] : Date.now();
  S.boosts[b.k] = from + b.min * 60000;
  toast(`${b.n} actif — ${b.min} min`, "warn", "bolt");
  Sfx.win();
  saveSoon();
}
/* un boost achete se range dans le sac : il s'active quand le joueur le decide */
ACTIONS.buyboost = d => {
  const b = BOOSTS[d.id];
  if(!pay(b.cur, b.price)){ toast(`${CUR_NAME[b.cur]} insuffisants`, "bad", "cross"); return; }
  S.bagBoosts = S.bagBoosts || {};
  S.bagBoosts[d.id] = (S.bagBoosts[d.id]||0) + 1;
  Sfx.coin();
  toast(`${b.n} rangé dans le sac`, "", "box");
  save(); refresh();
};
function boostStrip(){
  const on = activeBoosts();
  if(!on.length) return "";
  return `<div class="booststrip">
    ${on.map(id=>{ const b = BOOSTS[id];
      return `<span class="boostchip">${ic("bolt")} ${esc(b.n.split(" ")[0])}
        <b>${fmtTime(boostLeft(b.k))}</b></span>`; }).join("")}
  </div>`;
}

/* ---------- radar légendaire ---------- */
function radarCount(){ return (S.items && S.items.radar) || 0; }
ACTIONS.useradar = () => {
  if(radarCount() <= 0) return;
  const r = regionDef(S.region);
  const pool = [];
  for(let i=r.from;i<=r.to;i++)
    if(POKE[i] && POKE[i].rar === 5 && !isGuardianSpecies(i)) pool.push(i);
  if(!pool.length){
    toast("Aucune signature légendaire libre dans ce secteur", "bad", "cross");
    return;
  }
  S.items.radar--;
  const id = pick(pool);
  newEncounter({id, rar:5});
  Sfx.glitch(); buzz([30,40,60]);
  shakeApp();
  toast("Signature légendaire verrouillée", "warn", "boss");
  pzFlash("Le radar a accroché quelque chose d'énorme. Ne le rate pas.");
  save(); refresh();
};

/* ---------- trésors de sonde ----------
   Butin purement monétaire : la pêche gagne une identité économique
   et un moment de jackpot occasionnel. */
const TREASURES = {
  heart_scale: {n:"Écaille Cœur",    sell:600,   w:40, spr:349},
  pearl:       {n:"Perle",           sell:1400,  w:28, spr:90},
  stardust:    {n:"Poussière d'Étoile", sell:2600, w:16, spr:120},
  big_pearl:   {n:"Grande Perle",    sell:5200,  w:9,  spr:91},
  star_piece:  {n:"Morceau d'Étoile",sell:9000,  w:5,  spr:121},
  golden:      {n:"Statue Dorée",    sell:26000, w:1,  spr:129}
};
function rollTreasure(depth){
  /* la profondeur augmente la chance et la qualité */
  if(rng() > 0.16 + depth * 0.10) return null;
  const pool = [];
  for(const k in TREASURES){
    let w = TREASURES[k].w;
    if(depth >= 1 && TREASURES[k].sell >= 2000) w *= 2;
    if(depth >= 2 && TREASURES[k].sell >= 5000) w *= 3;
    for(let i=0;i<w;i++) pool.push(k);
  }
  const k = pick(pool);
  S.treasures = S.treasures || {};
  S.treasures[k] = (S.treasures[k]||0) + 1;
  S.stats.treasures = (S.stats.treasures||0) + 1;
  if(TREASURES[k].sell >= 9000){
    Sfx.shiny(); buzz([30,50,30,50,90]);
    pzFlash("Ça, ce n'est pas censé exister dans cette couche.");
  }
  saveSoon();
  return k;
}
function treasureValue(){
  let v = 0;
  for(const k in (S.treasures||{})) v += TREASURES[k].sell * S.treasures[k];
  return v;
}
ACTIONS.sellall = () => {
  const v = treasureValue();
  if(v <= 0) return;
  const items = [];
  for(const k in S.treasures){
    if(!S.treasures[k]) continue;
    items.push({id:TREASURES[k].spr, label:`${S.treasures[k]} × ${TREASURES[k].n}`,
                sub:fmt(TREASURES[k].sell * S.treasures[k]) + " c", color:"var(--amber)",
                big:TREASURES[k].sell >= 9000});
  }
  S.treasures = {};
  gain("coins", v);
  save();
  revealSheet("VENTE DE TRÉSORS", items, {icon:"coin", sub:fmt(v) + " PokéCoins encaissés"});
};
function treasurePanel(){
  const owned = Object.keys(S.treasures||{}).filter(k=>S.treasures[k] > 0);
  if(!owned.length) return "";
  return `<div class="panel">
    <div class="row between">
      <div class="h sm" style="margin:0">TRÉSORS REMONTÉS</div>
      <button class="btn xs gold" data-act="sellall">Tout vendre · ${fmt(treasureValue())}</button>
    </div>
    <div class="wrap" style="margin-top:6px">
      ${owned.map(k=>`<span class="chip">
        <span class="sprbox" style="width:20px;height:20px">${sprite(TREASURES[k].spr,false,"")}</span>
        ${esc(TREASURES[k].n)} <b>×${S.treasures[k]}</b></span>`).join("")}
    </div>
  </div>`;
}

/* ---------- jours fastes ----------
   La variance fait partie du plaisir : quelques sessions doivent être
   nettement plus généreuses que la moyenne. Le tirage est quotidien et
   annoncé, jamais caché. */
const LUCKY_DAYS = [
  {id:"d_none",   w:100, n:"",                      d:""},
  {id:"d_coin",   w:20,  n:"Surcharge économique",  d:"PokéCoins ×2 toute la journée.",       f:{coin:2}},
  {id:"d_xp",     w:18,  n:"Compilation rapide",    d:"Expérience ×2 toute la journée.",      f:{xp:2}},
  {id:"d_rare",   w:12,  n:"Fuite de données rares",d:"Raretés élevées bien plus fréquentes.",f:{rare:1}},
  {id:"d_shiny",  w:8,   n:"Instabilité chromatique",d:"Chance de chromatique ×3.",           f:{shiny:3}},
  {id:"d_shard",  w:8,   n:"Extraction massive",    d:"Chaque capture rapporte des Fragments.",f:{shard:1}},
  {id:"d_gold",   w:3,   n:"JOUR FASTE",            d:"PokéCoins ×3, expérience ×2, chromatiques ×2.",
   f:{coin:3, xp:2, shiny:2}, big:1},
  {id:"d_storm",  w:2,   n:"TEMPÊTE DE DONNÉES",    d:"Raretés élevées massives et Fragments doublés.",
   f:{rare:2, shardMul:2}, big:1}
];
function rollLuckyDay(){
  const tot = LUCKY_DAYS.reduce((a,b)=>a+b.w, 0);
  let x = rng()*tot;
  for(const d of LUCKY_DAYS){ x -= d.w; if(x <= 0) return d.id; }
  return "d_none";
}
function luckyDay(){
  const id = S.luckyDay || "d_none";
  return LUCKY_DAYS.find(d=>d.id === id) || LUCKY_DAYS[0];
}
function luckyF(k){ return (luckyDay().f || {})[k] || 0; }
function luckyRollover(){
  if(S.luckyDayOn !== today()){
    S.luckyDayOn = today();
    S.luckyDay = rollLuckyDay();
    S.luckySeen = false;
    saveSoon();
  }
}
function showLuckyDay(){
  const d = luckyDay();
  if(d.id === "d_none" || S.luckySeen) return false;
  S.luckySeen = true; save();
  if(d.big){ Sfx.win(); shakeApp(); }
  sheet(`<div class="center lucky ${d.big?"big":""}">
    <div class="h" style="justify-content:center;color:${d.big?"var(--amber)":"var(--cyan)"}">
      ${esc(d.n)}</div>
    <div class="lucky-mark">${ic(d.big?"star":"bolt")}</div>
    <div class="tiny" style="margin:10px 0 14px">${esc(d.d)}</div>
    <div class="tiny dim" style="margin-bottom:12px">Actif jusqu'à minuit.</div>
    <button class="btn pri wide" data-act="closeandrefresh">Commencer</button>
  </div>`, true);
  return true;
}
function luckyBanner(){
  const d = luckyDay();
  if(d.id === "d_none") return "";
  return `<div class="luckybanner ${d.big?"big":""}">
    ${ic(d.big?"star":"bolt")}<b>${esc(d.n)}</b><span>${esc(d.d)}</span></div>`;
}
