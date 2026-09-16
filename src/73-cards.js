/* ============================================================
   73 — CARTES DE COLLECTION
   Uniquement des légendaires des trois premières générations, plus
   une pièce secrète. Chacun existe en plusieurs illustrations, une
   par génération où il est apparu : plus l'illustration est ancienne,
   plus elle est rare. Quatre légendaires seulement ont une
   illustration Rouge/Bleu — ce sont les pièces de prestige du jeu.
   ============================================================ */

const CARD_SERIES_DEF = {
  art: {n:"Standard",      w:100, c:"#9aa6b5", d:"Illustration contemporaine. La plus répandue."},
  g5:  {n:"Holographique", w:45,  c:"#4fb2ff", d:"Sprite Noir et Blanc. Tirage courant mais recherché."},
  g3:  {n:"Corrompue",     w:18,  c:"#ff3d7f", d:"Sprite Émeraude. L'image tremble par endroits."},
  g2:  {n:"Originelle",    w:6,   c:"#c9a13c", d:"Sprite Cristal. Neuf légendaires seulement l'ont."},
  g1:  {n:"Primordiale",   w:1.5, c:"#e8e2cf", d:"Sprite Rouge et Bleu. Quatre pièces existent."},
  mn:  {n:"Sans index",    w:0,   c:"#8b5cf6", d:"Aucune génération ne la revendique."}
};
const CARD_ORDER = ["art", "g5", "g3", "g2", "g1"];

/* especes concernees, deduites de l'atlas d'illustrations */
const CARD_MONS = (function(){
  const set = new Set();
  for(const k in CARD_INDEX) set.add(+k.split(":")[1]);
  return [...set].sort((a,b)=>a-b);
})();
function cardVariants(id){ return CARD_ORDER.filter(s=>CARD_INDEX[s + ":" + id] !== undefined); }
function cardKey(s, id){ return s + ":" + id; }
function cardHas(s, id){ return !!(S.cards && S.cards[cardKey(s, id)]); }
function cardEntry(s, id){ return S.cards && S.cards[cardKey(s, id)]; }
function cardTotal(){ return Object.keys(CARD_INDEX).length + 1; }   /* +1 : la piece secrete */
function cardOwnedCount(){ return Object.keys(S.cards || {}).length; }

/* ---------- obtention ---------- */
function grantCardV(series, id){
  S.cards = S.cards || {};
  const k = cardKey(series, id);
  if(S.cards[k]){ S.cards[k].dup = (S.cards[k].dup || 0) + 1; return false; }
  S.cards[k] = {t: Date.now(), dup: 0};
  saveSoon();
  return true;
}
/* tirage pondéré ; `bias` releve la chance des series anciennes */
function rollCardSeries(id, bias){
  const pool = [];
  for(const s of cardVariants(id)){
    let w = CARD_SERIES_DEF[s].w;
    if(bias) w *= Math.pow(bias, CARD_ORDER.indexOf(s));
    for(let i = 0; i < Math.max(1, Math.round(w)); i++) pool.push(s);
  }
  return pool.length ? pick(pool) : "art";
}
function randomCard(bias){
  const id = pick(CARD_MONS);
  return {id, s: rollCardSeries(id, bias)};
}
/* pièce secrète : elle ne se tire pas, elle se rencontre */
function grantSecretCard(){
  S.cards = S.cards || {};
  if(S.cards["mn:0"]){ S.cards["mn:0"].dup = (S.cards["mn:0"].dup||0)+1; return false; }
  S.cards["mn:0"] = {t: Date.now(), dup: 0};
  saveSoon();
  return true;
}

/* ---------- rendu ---------- */
function cardArt(series, id, cls){
  /* les variables de grille viennent de l'atlas genere, jamais codees en dur */
  if(series === "mn") return `<span class="cardart mn ${cls||""}"></span>`;
  const i = CARD_INDEX[cardKey(series, id)];
  if(i === undefined) return `<span class="cardart ${cls||""}"></span>`;
  const c = i % CARD_COLS, r = Math.floor(i / CARD_COLS);
  return `<span class="cardart ${cls||""}"
    style="--cc:${c};--cr:${r};--ccols:${CARD_COLS};--crows:${CARD_ROWS}"></span>`;
}
function cardTitleOf(id){
  const g = REGIONS.flatMap(x=>x.guardians).find(x=>x.id === id);
  if(g) return g.title;
  const p = POKE[id];
  return p.leg === 2 ? "Signature fabuleuse" : "Signature légendaire";
}

/* carte complète, grammaire des cartes à collectionner */
function tcardHtml(series, id, opts){
  opts = opts || {};
  const secret = series === "mn";
  const def = CARD_SERIES_DEF[series];
  const owned = opts.owned !== undefined ? opts.owned : (secret ? !!(S.cards||{})["mn:0"] : cardHas(series, id));
  const p = secret ? null : POKE[id];
  const name = secret ? "?????" : p.name;
  const rank = CARD_ORDER.indexOf(series);

  if(!owned){
    return `<div class="tcard sealed ${opts.hero?"hero-card":""}" ${opts.attrs||""}>
      <div class="tc-in">
        <div class="tc-head"><span class="tc-nm">${esc(name)}</span></div>
        <div class="tc-art">${cardArt(series, id, "ghost")}</div>
        <div class="tc-seal">${esc(def.n.toUpperCase())}</div>
      </div></div>`;
  }

  const tint = secret ? "#8b5cf6" : TYPE_TINT[p.types[0]-1];
  const mv = secret ? [] : movesFor(p, 60).filter(m=>!m.util).slice(0, 2);
  const weak = secret ? 0 : weaknessOf(p);
  const e = secret ? (S.cards||{})["mn:0"] : cardEntry(series, id);

  return `<div class="tcard s-${series} ${opts.hero?"hero-card":""}"
      style="--tc:${tint};--rc:${def.c}" ${opts.attrs||""}>
    <div class="tc-in">
      <div class="tc-head">
        <span class="tc-stage">${esc(def.n)}</span>
        <span class="tc-nm">${esc(name)}</span>
        ${secret ? `<span class="tc-hp">??<em>PV</em></span>`
                 : `<span class="tc-hp">${p.hp*2}<em>PV</em></span>
                    <span class="tt t${p.types[0]} tc-type">${TYPE_NAMES[p.types[0]].slice(0,3)}</span>`}
      </div>
      <div class="tc-window">
        <div class="tc-scene"></div>
        <span class="tc-beam"></span>
        ${cardArt(series, id)}
        <div class="tc-foil"></div>
      </div>
      <div class="tc-cat">${secret ? "Entité antérieure à l'index" : esc(cardTitleOf(id))}</div>
      <div class="tc-moves">
        ${secret
          ? `<div class="tc-mv"><span class="tc-mvn">Aucune ligne correspondante</span></div>`
          : mv.map(m=>`<div class="tc-mv">
              <span class="tt t${m.type}">${TYPE_NAMES[m.type].slice(0,3)}</span>
              <span class="tc-mvn">${esc(m.name)}</span>
              <b>${Math.round(m.pw * Math.max(p.atk,p.spa) / 42) * 10}</b>
            </div>`).join("")}
      </div>
      <div class="tc-foot">
        ${secret ? `<span class="tc-wr">faib. <i class="tt t1">—</i></span>`
                 : `<span class="tc-wr">faib. <i class="tt t${weak}">${TYPE_NAMES[weak].slice(0,3)}</i></span>`}
        <span class="grow"></span>
        <span class="tc-no">${secret ? "000" : String(id).padStart(3,"0")}</span>
        <span class="tc-rar">${"★".repeat(rank+1) || "✦"}</span>
      </div>
    </div>
    ${e && e.dup ? `<span class="tc-dup">×${e.dup+1}</span>` : ""}
  </div>`;
}

/* ---------- écran de collection ---------- */
let CARD_FILTER = "all";
SCREENS.cards = {
  html(){
    const owned = cardOwnedCount(), tot = cardTotal();
    const mons = CARD_MONS.filter(id=>{
      if(CARD_FILTER === "all") return true;
      const v = cardVariants(id);
      if(CARD_FILTER === "done")    return v.every(s=>cardHas(s, id));
      if(CARD_FILTER === "partial") return v.some(s=>cardHas(s, id)) && !v.every(s=>cardHas(s, id));
      return !v.some(s=>cardHas(s, id));
    });
    const secret = !!(S.cards||{})["mn:0"];
    return `
      <div class="h">${ic("cards")} COLLECTION ${infoBtn("cards")}</div>
      <div class="sub">Seuls les légendaires des trois premières générations sont émis.
        Chacun existe en plusieurs illustrations, d'autant plus rares qu'elles sont anciennes.</div>

      <div class="panel bracket">
        <div class="row">
          <div class="ring">
            <svg viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="23" fill="none" stroke="#1e2d49" stroke-width="5"/>
              <circle cx="27" cy="27" r="23" fill="none" stroke="var(--amber)" stroke-width="5"
                stroke-dasharray="${(owned/tot*144.5).toFixed(1)} 999" stroke-linecap="round"/>
            </svg><span class="val" style="color:var(--amber)">${Math.round(owned/tot*100)}%</span>
          </div>
          <div class="grow">
            <div class="tiny cy mono-num">${owned} / ${tot} illustrations</div>
            <div class="serieslegend">
              ${CARD_ORDER.map(s=>{
                const n = Object.keys(CARD_INDEX).filter(k=>k.startsWith(s+":")).length;
                const got = CARD_MONS.filter(id=>cardHas(s,id)).length;
                return `<span class="sl" style="--rc:${CARD_SERIES_DEF[s].c}">
                  ${esc(CARD_SERIES_DEF[s].n)} <b>${got}/${n}</b></span>`;}).join("")}
              <span class="sl ${secret?"":"dim"}" style="--rc:#8b5cf6">
                Sans index <b>${secret?1:0}/1</b></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chipbar">
        ${[["all","Tous"],["partial","Incomplets"],["done","Complets"],["none","Aucune"]]
          .map(([k,n])=>`<button class="chip ${CARD_FILTER===k?"on":""}"
            data-act="cardfilter" data-f="${k}">${n}</button>`).join("")}
      </div>

      ${mons.length ? `<div class="list">
        ${mons.map(id=>{
          const v = cardVariants(id);
          const got = v.filter(s=>cardHas(s, id));
          const best = got.length ? got[got.length-1] : null;
          return `<div class="monrow ${got.length===v.length?"full":""}" data-act="cardseries" data-id="${id}">
            <span class="sprbox" style="width:44px;height:44px">${sprite(id, false, got.length?"":"ghosted")}</span>
            <div class="grow">
              <div class="row between">
                <span class="tiny">${esc(POKE[id].name)}</span>
                <span class="tiny ${got.length===v.length?"gold-t":"dim"} mono-num">${got.length}/${v.length}</span>
              </div>
              <div class="pipline">
                ${v.map(s=>`<span class="cpip ${cardHas(s,id)?"on":""}"
                  style="--rc:${CARD_SERIES_DEF[s].c}" title="${esc(CARD_SERIES_DEF[s].n)}"></span>`).join("")}
              </div>
              <div class="tiny dim">${best ? "meilleure : " + CARD_SERIES_DEF[best].n : "aucune illustration"}</div>
            </div>
            ${ic("arrow")}
          </div>`;}).join("")}
      </div>` : `<div class="empty">Aucun légendaire ne correspond à ce filtre.</div>`}

      <div class="h sm" style="margin-top:12px">PIÈCE SECRÈTE</div>
      <div class="cardgrid" style="grid-template-columns:1fr 2fr;align-items:center">
        ${tcardHtml("mn", 0, {attrs:'data-act="cardzoom" data-s="mn" data-id="0"'})}
        <div class="tiny muted">${secret
          ? "Elle n'appartient à aucune série. Le système n'a jamais émis cette carte : elle s'est inscrite toute seule."
          : "Une carte existe qui n'appartient à aucune génération. On ne l'obtient pas en jouant : on la rencontre."}</div>
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="h sm">OÙ LES OBTENIR</div>
        <div class="tiny">· Première victoire sur un <b>Data Guardian</b> — carte de ce légendaire, série élevée garantie.</div>
        <div class="tiny">· <b>Noyau d'expédition</b> — une carte au hasard, d'autant meilleure que la corruption est haute.</div>
        <div class="tiny">· <b>Archives du Vide et Souveraines</b> — tirage libre.</div>
        <div class="tiny">· <b>Objectifs hebdomadaires</b> — une carte par palier atteint.</div>
      </div>
      <button class="btn ghost wide" style="margin-top:8px" data-act="goto" data-to="profile">Retour au profil</button>`;
  }
};
ACTIONS.cardfilter = d => { CARD_FILTER = d.f; refresh(); };

ACTIONS.cardseries = d => {
  const id = +d.id;
  const v = cardVariants(id);
  sheet(`${sheetHead(POKE[id].name)}
    <div class="tiny muted" style="margin-bottom:10px">${esc(cardTitleOf(id))} —
      ${v.filter(s=>cardHas(s,id)).length} illustration(s) sur ${v.length}.</div>
    <div class="cardgrid">
      ${v.map(s=>tcardHtml(s, id, {attrs:`data-act="cardzoom" data-s="${s}" data-id="${id}"`})).join("")}
    </div>
    <div class="panel tight" style="margin-top:11px">
      <div class="h sm">RARETÉ DES SÉRIES</div>
      ${v.map(s=>`<div class="row between tiny" style="padding:2px 0">
        <span style="color:${CARD_SERIES_DEF[s].c}">${esc(CARD_SERIES_DEF[s].n)}</span>
        <span class="dim">${esc(CARD_SERIES_DEF[s].d)}</span></div>`).join("")}
    </div>`);
};
ACTIONS.cardzoom = d => {
  const s = d.s, id = +d.id;
  const owned = s === "mn" ? !!(S.cards||{})["mn:0"] : cardHas(s, id);
  const e = s === "mn" ? (S.cards||{})["mn:0"] : cardEntry(s, id);
  const def = CARD_SERIES_DEF[s];
  sheet(`<div class="center">
    ${tcardHtml(s, id, {hero:true})}
    <div class="tiny" style="margin-top:12px;color:${def.c}">${esc(def.n)}</div>
    <div class="tiny muted" style="margin-top:4px">${esc(def.d)}</div>
    ${owned
      ? (e && e.dup ? `<div class="tiny dim" style="margin-top:6px">${e.dup} exemplaire(s) en double —
          échangeables depuis l'espace en ligne.</div>` : "")
      : `<div class="tiny dim" style="margin-top:6px">Non émise.</div>`}
    <button class="btn wide" style="margin-top:12px" data-act="closesheet">Fermer</button>
  </div>`, true);
};

/* ---------- révélation d'une carte ---------- */
function showCardWin(series, id, isNew){
  const def = CARD_SERIES_DEF[series];
  const box = document.getElementById("discover");
  if(!box){ toast("Carte : " + (series==="mn"?"Sans index":POKE[id].name), "warn", "cards"); return; }
  box.className = "on cardwin";
  box.style.setProperty("--ac", def.c);
  box.innerHTML = `
    <div class="dc-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker done">${isNew ? "NOUVELLE CARTE" : "EXEMPLAIRE SUPPLÉMENTAIRE"}</div>
      <div class="cardwin-stage" id="cw-stage">
        ${tcardHtml(series, id, {hero:true, owned:true})}
      </div>
      <div class="dc-name in" style="font-size:11px;margin-top:10px">${esc(def.n)}</div>
      <div class="dc-lore in">${esc(def.d)}</div>
      <button class="btn pri wide dc-ok in" data-act="dcdone">Ranger dans la collection</button>
    </div>`;
  const st = document.getElementById("cw-stage");
  if(st){
    st.classList.add("flip");
    setTimeout(()=>burstEl(st, {n: 26, spread:140,
      colors:[def.c, "#ffffff", "#ffc857"], dur:950}), 420);
  }
  Sfx.shiny(); buzz([20,40,70]);
}
