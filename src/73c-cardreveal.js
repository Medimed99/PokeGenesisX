/* ============================================================
   73c — LA RÉVÉLATION D'UNE CARTE
   Une carte légendaire est la récompense la plus rare du jeu. Elle
   arrivait par une ligne de liste, ou pas du tout. Elle a désormais
   sa scène, dans le style de l'archive :

   1. LE CONTEXTE (facultatif) — d'où vient la carte : le légendaire
      vaincu, l'archive ouverte. Le joueur lit, puis touche
      « Révéler la carte » quand il est prêt.
   2. LE DÉCODAGE — un terminal lit la signature, la carte arrive
      de dos, brouillée ; un faisceau la balaie, des octets s'y
      rassemblent, puis elle se retourne dans un éclair à la
      couleur de sa série, avec rayons et reflet holographique.
   3. LA CARTE — nom, série, rareté, et le pouvoir qu'elle ouvre
      ou renforce. Un bouton pour la ranger (ou passer à la
      suivante).

   Tout est disposé en colonne : rien ne se superpose. Un toucher
   pendant le décodage le termine aussitôt.
   ============================================================ */

let CRV = null;
/* ce que d'autres modules ajoutent sous une carte révélée (la jauge de réindexation,
   une annotation) : des fonctions c -> html */
const CRV_EXTRA = [];
/* les pouvoirs annoncés pendant qu'une révélation est prévue sont montrés dans la scène, pas par-dessus */
let CARD_REVEAL_EXPECT = 0;
const CARD_POWER_PENDING = {};

/* cards : [{s, id, fresh}] ; opts : {kicker, intro:{spr, title, text, rewards}, onDone} */
function cardReveal(cards, opts){
  opts = opts || {};
  const box = document.getElementById("discover");
  cards = (cards || []).filter(c=>c && c.s);
  if(!box || !box.style || !cards.length){ cardPowersFlush(); if(opts.onDone) opts.onDone(); return false; }
  if(typeof closeSheet === "function" && sheetOpen && sheetOpen()) closeSheet();
  CRV = {cards, i:0, opts, timers:[]};
  /* bandeaux et bulles se taisent pendant la scène : rien ne passe par-dessus */
  try { document.body.classList.add("crv-on"); } catch(e){}
  if(opts.intro) crvIntro(); else crvPlay();
  return true;
}
function crvClear(){ if(CRV){ CRV.timers.forEach(t=>{ clearTimeout(t); clearInterval(t); }); CRV.timers = []; } }
function crvAt(ms, fn){ CRV.timers.push(setTimeout(()=>{ try { fn(); } catch(e){} }, ms)); }

/* ---------- 1. le contexte ---------- */
function crvIntro(){
  const box = document.getElementById("discover"), I = CRV.opts.intro;
  box.className = "on crv intro";
  box.style.setProperty("--ac", "#ffd24a");
  box.onclick = null;
  box.innerHTML = `<div class="crv-bg"></div>
    <div class="crv-col">
      <div class="crv-kick">${esc(CRV.opts.kicker || "SIGNATURE MAJEURE")}</div>
      <div class="crv-introart">${I.spr ? `<span class="sprbox" style="width:128px;height:128px">${sprite(I.spr, false, "", {anim:true, eager:true})}</span>` : ""}</div>
      <div class="crv-title">${esc(I.title || "")}</div>
      ${I.text ? `<div class="crv-text">${esc(I.text)}</div>` : ""}
      ${I.rewards ? `<div class="crv-rw">${esc(I.rewards)}</div>` : ""}
      <div class="crv-sealed">${cardBackHtml("crv-mini")}<span>${CRV.cards.length > 1 ? CRV.cards.length + " cartes scellées" : "Une carte scellée"} t'attend${CRV.cards.length > 1 ? "ent" : ""}</span></div>
      <button class="btn pri wide crv-btn" data-act="crvgo">Révéler la carte</button>
    </div>`;
}
ACTIONS.crvgo = () => { if(CRV) crvPlay(); };

/* ---------- 2. le décodage ---------- */
function crvPlay(){
  crvClear();
  const c = CRV.cards[CRV.i], def = CARD_SERIES_DEF[c.s] || CARD_SERIES_DEF.art;
  const rank = c.s === "pz" ? 4 : Math.max(0, CARD_ORDER.indexOf(c.s));
  const box = document.getElementById("discover");
  box.className = `on crv play r${rank} ${c.s === "mn" ? "mn" : ""} ${c.s === "pz" ? "pz" : ""}`;
  box.style.setProperty("--ac", def.c);
  box.innerHTML = `<div class="crv-bg"></div><div class="crv-rays"></div>
    <div class="crv-col">
      <div class="crv-term" id="crv-term"></div>
      <div class="crv-stage" id="crv-stage">
        <div class="crv-ring"></div>
        <div class="crv-card" id="crv-card">
          <div class="crv-face back">${cardBackHtml()}</div>
          <div class="crv-face front">${tcardHtml(c.s, c.id, {hero:true, owned:true})}</div>
        </div>
        <div class="crv-beam" id="crv-beam"></div>
        <div class="crv-bytes" id="crv-bytes"></div>
      </div>
      <div class="crv-info" id="crv-info"></div>
    </div>`;
  /* le terminal lit la signature, ligne par ligne */
  const term = document.getElementById("crv-term");
  const no = c.s === "mn" ? "000" : c.s === "pz" ? "387" : String(c.id).padStart(3, "0");
  const ser = `${"◈".repeat(rank + 1)} ${seriesFound(c.s) ? def.n.toUpperCase() : "·····"}`;
  const lines = c.reidx ? [
    `> réindexation · N°${no} · ${typeof REIDX_AT !== "undefined" ? REIDX_AT : 6} exemplaires comparés`,
    "> différence trouvée · illustration manquante",
    `> série · ${ser}`
  ] : c.lines || [
    `> signature détectée · N°${no}`,
    `> série · ${ser}`,
    "> décodage de l'illustration…"
  ];
  CRV.lines = lines;
  lines.forEach((l, k)=>crvAt(120 + k * 420, ()=>{ if(term){ const d = document.createElement("div"); d.textContent = l; term.appendChild(d); try { Sfx.click(); } catch(e){} } }));
  /* des octets montent vers la carte */
  crvAt(300, ()=>{
    const by = document.getElementById("crv-bytes"); if(!by) return;
    by.innerHTML = Array.from({length:22}, (_, k)=>`<i style="--x:${(Math.random() * 100).toFixed(0)}%;--d:${(Math.random() * 1.1).toFixed(2)}s">${Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")}</i>`).join("");
    try { Sfx.glitch(); } catch(e){}
  });
  crvAt(400, ()=>{ const b = document.getElementById("crv-beam"); if(b) b.classList.add("on"); });
  crvAt(1500, ()=>{ const st = document.getElementById("crv-stage"); if(st) st.classList.add("charge"); buzz && buzz([10, 30, 10]); });
  /* l'éclair, et la carte se retourne */
  crvAt(1950, ()=>crvFlip());
  crvAt(2800, ()=>crvInfo());
  box.onclick = e => { if(e.target.closest("button")) return; if(CRV && !CRV.done) crvSkip(); };
  try { if(typeof Music !== "undefined") Music.jingle(rank >= 2 || c.s === "mn" ? "j_rare" : "j_decouverte"); } catch(e){}
}
function crvFlip(){
  if(!CRV || CRV.flipped) return;
  CRV.flipped = true;
  const box = document.getElementById("discover"), card = document.getElementById("crv-card"), st = document.getElementById("crv-stage");
  const c = CRV.cards[CRV.i], def = CARD_SERIES_DEF[c.s] || CARD_SERIES_DEF.art;
  const b = document.getElementById("crv-beam"); if(b) b.classList.remove("on");
  if(st) st.classList.remove("charge");
  /* le retournement en deux temps : le dos pivote jusqu'à la tranche, la face en repart */
  if(card){ card.style.transition = "transform .2s ease-in"; card.style.transform = "rotateY(90deg) scale(1.04)"; }
  setTimeout(()=>{
    if(card){
      card.classList.add("flipped");
      card.style.transition = "none"; card.style.transform = "rotateY(-90deg) scale(1.04)";
      void card.offsetWidth;
      card.style.transition = "transform .75s cubic-bezier(.2,1.45,.35,1)"; card.style.transform = "none";
    }
    if(box) box.classList.add("flash");
    if(st){ st.classList.add("burst"); if(typeof burstEl === "function") burstEl(st, {n:34, spread:170, colors:[def.c, "#ffffff", "#35f0d6", "#ffd24a"], dur:1100}); }
    try { Sfx.shiny(); } catch(e){}
    if(typeof buzz === "function") buzz([20, 40, 80]);
  }, 200);
}
function crvSkip(){
  crvClear();
  const term = document.getElementById("crv-term");
  if(term && CRV.lines) term.innerHTML = CRV.lines.map(l=>`<div style="animation:none">${esc(l)}</div>`).join("");
  crvFlip(); crvInfo();
}

/* ---------- 3. la carte ---------- */
function crvInfo(){
  if(!CRV || CRV.done) return;
  CRV.done = true;
  const c = CRV.cards[CRV.i], def = CARD_SERIES_DEF[c.s] || CARD_SERIES_DEF.art;
  const el = document.getElementById("crv-info"); if(!el) return;
  /* un doublon ne change pas le pouvoir : seule une carte nouvelle le montre */
  const pw = c.s === "mn" || !c.fresh ? null : CARD_POWER_PENDING[c.id];
  if(pw) delete CARD_POWER_PENDING[c.id];
  const P = typeof CARD_POWERS !== "undefined" ? CARD_POWERS[c.id] : null;
  const last = CRV.i >= CRV.cards.length - 1;
  const e = typeof cardEntry === "function" ? cardEntry(c.s, c.id) : null;
  const copies = c.rx && c.rx.copies ? c.rx.copies : e && e.dup ? e.dup + 1 : 0;
  const tag = c.tag || (c.reidx ? "RÉINDEXATION · ILLUSTRATION RETROUVÉE" : c.fresh ? "NOUVELLE CARTE"
    : `EXEMPLAIRE SUPPLÉMENTAIRE${copies > 1 ? " · ×" + copies : ""}`);
  el.innerHTML = `
    <div class="crv-tag">${esc(tag)}</div>
    <div class="crv-name">${esc(c.s === "mn" ? "Sans index" : POKE[c.id].name)}</div>
    ${typeof CARD_SCENES !== "undefined" && CARD_SCENES[c.s === "mn" ? 0 : c.id] ? `<div class="crv-scene">« ${esc(CARD_SCENES[c.s === "mn" ? 0 : c.id])} »</div>` : ""}
    <div class="crv-series" style="color:${def.c}">${esc(seriesName(c.s))}${c.s !== "mn" && CARD_YEARS[c.s] ? " · " + CARD_YEARS[c.s] : ""}</div>
    ${c.reidx ? `<div class="crv-why">${c.s === "art" ? "Elle était là, sous les doublons. Il suffisait de les comparer."
      : "Le système avait cessé de la distribuer. Il ne l'avait jamais effacée."}</div>` : ""}
    <div class="crv-desc">${esc(c.desc || seriesDesc(c.s))}</div>
    ${CRV_EXTRA.map(f=>{ try { return f(c) || ""; } catch(err){ return ""; } }).join("")}
    ${P && pw ? `<div class="crv-power"><small>${pw.before ? "POUVOIR RENFORCÉ" : "POUVOIR DÉBLOQUÉ"} · ${esc(TIER_NAMES[pw.after])}</small><b>${esc(P.n)}</b><span>${esc(cardPowerDesc(c.id, pw.after))}</span>${typeof cardPowerWhere === "function" ? `<em>À utiliser : ${esc(cardPowerWhere(c.id))}</em>` : ""}</div>` : ""}
    <button class="btn pri wide crv-btn" data-act="crvnext">${last ? "Ranger dans la collection" : `Carte suivante (${CRV.i + 2}/${CRV.cards.length})`}</button>
    ${CRV.cards.length - CRV.i > 2 ? `<button class="btn ghost sm crv-all" data-act="crvall">Tout ranger sans les révéler</button>` : ""}`;
  el.classList.add("on");
  if(typeof installCardTilt === "function") setTimeout(installCardTilt, 50);
}
ACTIONS.crvall = () => { if(!CRV) return; CRV.i = CRV.cards.length - 1; ACTIONS.crvnext(true); };
ACTIONS.crvnext = (d, all) => {
  if(!CRV) return;
  if(d === true) all = true;
  if(!all && CRV.i < CRV.cards.length - 1){ CRV.i++; CRV.done = false; CRV.flipped = false; crvPlay(); return; }
  crvClear();
  const done = CRV.opts.onDone;
  CRV = null;
  const box = document.getElementById("discover");
  if(box){ box.className = ""; box.innerHTML = ""; box.onclick = null; }
  try { document.body.classList.remove("crv-on"); } catch(e){}
  /* un pouvoir resté en attente (carte obtenue sans scène) passe maintenant */
  cardPowersFlush();
  if(done) done(); else { try { refresh(); } catch(e){} }
};

/* le pouvoir d'une carte : montré dans sa scène quand elle en a une, sinon en moment.
   cardRevealExpect() vaut pour la prochaine obtention seulement. */
let CARD_EXPECT_NOW = 0;
function cardRevealExpect(){ CARD_REVEAL_EXPECT = 1; }
if(typeof grantCardV === "function"){
  const _grantCardV2 = grantCardV;
  grantCardV = function(series, id){
    CARD_EXPECT_NOW = CARD_REVEAL_EXPECT; CARD_REVEAL_EXPECT = 0;
    try { return _grantCardV2(series, id); } finally { CARD_EXPECT_NOW = 0; }
  };
}
const _cardPowerMoment = cardPowerMoment;
cardPowerMoment = function(id, before, after){
  if(CRV || CARD_EXPECT_NOW){
    const p = CARD_POWER_PENDING[id];
    CARD_POWER_PENDING[id] = {before: p ? p.before : before, after};
    return;
  }
  _cardPowerMoment(id, before, after);
};
/* ce qui n'a pas trouvé sa scène passe en moment */
function cardPowersFlush(){
  CARD_REVEAL_EXPECT = 0;
  for(const id in CARD_POWER_PENDING){ const p = CARD_POWER_PENDING[id]; delete CARD_POWER_PENDING[id]; _cardPowerMoment(+id, p.before, p.after); }
}

/* l'ancienne révélation passe par la nouvelle scène */
if(typeof showCardWin === "function"){
  showCardWin = function(series, id, isNew){ cardReveal([{s:series, id, fresh:isNew}], {}); };
}
