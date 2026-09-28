/* ============================================================
   73 — CARTES DE COLLECTION
   Uniquement des légendaires des trois premières générations, plus
   une pièce secrète. Chacun existe en plusieurs illustrations, une
   par génération où il est apparu : plus l'illustration est ancienne,
   plus elle est rare. Quatre légendaires seulement ont une
   illustration Rouge/Bleu — ce sont les pièces de prestige du jeu.
   ============================================================ */

/* Chaque serie est une ecriture successive de la meme entite. Le systeme a
   redessine ses definitions a plusieurs reprises sans jamais effacer les
   precedentes : les plus anciennes ont simplement cesse d'etre distribuees. */
const CARD_SERIES_DEF = {
  art: {n:"Rendu courant",   w:100, c:"#9aa6b5",
        d:"L'entité telle que le système la dessine aujourd'hui. Nette, complète, et sans histoire."},
  g5:  {n:"Rendu antérieur", w:45,  c:"#4fb2ff",
        d:"Une définition plus ancienne, encore en mouvement. Remplacée, jamais effacée."},
  g3:  {n:"Rendu instable",  w:18,  c:"#ff3d7f",
        d:"Quatre réécritures plus tôt. Les teintes ont dérivé, le contour ne tient plus tout à fait."},
  g2:  {n:"Rendu fondateur", w:6,   c:"#c9a13c",
        d:"Une des premières écritures de cette entité. Neuf ont survécu à la réindexation. Pas une de plus."},
  g1:  {n:"Rendu primordial",w:1.5, c:"#e8e2cf",
        d:"Avant la couleur. Quatre entités seulement étaient déjà définies quand le monde n'en comptait que quatre."},
  mn:  {n:"Sans index",      w:0,   c:"#8b5cf6",
        d:"Aucune génération ne la revendique. Elle n'a pas été émise : elle s'est écrite toute seule."}
};
/* une serie n'est nommee qu'apres en avoir vu au moins un exemplaire */
function seriesFound(s){
  if(s === "mn") return !!(S.cards && S.cards["mn:0"]);
  return CARD_MONS.some(id=>cardHas(s, id));
}
function seriesName(s){ return seriesFound(s) ? CARD_SERIES_DEF[s].n : "Série non répertoriée"; }
function seriesDesc(s){
  return seriesFound(s) ? CARD_SERIES_DEF[s].d
    : "Vous n'avez encore vu aucune pièce de cette série. Le système ne dit pas ce qu'elle contient.";
}
/* une espece reste anonyme tant qu'aucune de ses illustrations n'est obtenue */
function monFound(id){ return cardVariants(id).some(s=>cardHas(s, id)); }
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

/* ============================================================
   RENDU D'UNE CARTE
   Une carte n'est pas du carton : c'est un enregistrement que le
   systeme a imprime. Elle emprunte la grammaire des cartes a
   collectionner — bandeau de nom, fenetre d'illustration, routines
   chiffrees, pied d'index — mais son materiau est la donnee :
   traits de circuit, empreinte de controle, lignes de balayage.
   Chaque serie est une generation d'ecriture differente, et son
   traitement visuel raconte cette anciennete.
   ============================================================ */

/* Environnement de la fenetre d'illustration, choisi par le type dominant.
   Les illustrations officielles sont detourees sur fond neutre : les poser
   dans une scene — lumiere volumetrique, atmosphere, horizon en silhouette —
   fait la difference entre une vignette et une image. */
/* indices de TYPE_NAMES : 1 Normal 2 Combat 3 Vol 4 Poison 5 Sol 6 Roche
   7 Insecte 8 Spectre 9 Acier 10 Feu 11 Eau 12 Plante 13 Electrik 14 Psy
   15 Glace 16 Dragon 17 Tenebres 18 Fee */
const CARD_ENV = {
  10:"braise",    5:"braise",                    /* Feu, Sol */
  11:"abysse",   15:"abysse",                    /* Eau, Glace */
  13:"orage",     3:"orage",                     /* Electrik, Vol */
  12:"spores",    7:"spores",   4:"spores",      /* Plante, Insecte, Poison */
  14:"vide",      8:"vide",    17:"vide",        /* Psy, Spectre, Tenebres */
  6:"monolithe",  9:"monolithe", 2:"monolithe",  /* Roche, Acier, Combat */
  16:"aurore",   18:"aurore",                    /* Dragon, Fee */
  1:"neutre"
};
function cardEnvOf(id, secret){
  if(secret) return "vide";
  const t = POKE[id] && POKE[id].types[0];
  return CARD_ENV[t] || "neutre";
}

const GEN_TAG = {art:"GEN·VI+", g5:"GEN·V", g3:"GEN·III", g2:"GEN·II", g1:"GEN·I", mn:"GEN·——"};

/* empreinte de controle : stable pour une carte donnee, illisible par nature */
function cardChecksum(series, id){
  let h = 0x811c9dc5;
  const src = series + ":" + id;
  for(let i = 0; i < src.length; i++){
    h ^= src.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  const hex = h.toString(16).toUpperCase().padStart(8, "0");
  return hex.slice(0,2) + "·" + hex.slice(2,4) + "·" + hex.slice(4,6) + "·" + hex.slice(6,8);
}
/* bande de donnees decorative, deterministe elle aussi */
function cardBytes(series, id, n){
  let h = 0x2545f491 ^ (id * 2654435761);
  for(let i = 0; i < series.length; i++) h = (h ^ series.charCodeAt(i)) * 16777619 >>> 0;
  const out = [];
  for(let i = 0; i < n; i++){
    h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0;
    out.push((h & 0xff).toString(16).toUpperCase().padStart(2, "0"));
  }
  return out.join(" ");
}
function moveDamage(p, m){ return Math.round(m.pw * Math.max(p.atk, p.spa) / 42 / 10) * 10; }

/* le dos de carte, utilise par le sachet et les listes fermees */
function cardBackHtml(cls){
  return `<div class="cardback ${cls||""}">
    <div class="cb-grid"></div>
    <div class="cb-ring"><i></i><i></i><i></i></div>
    <div class="cb-mark">◈</div>
    <div class="cb-word">CODE&nbsp;GENESIS</div>
    <div class="cb-foil"></div>
  </div>`;
}

function tcardHtml(series, id, opts){
  opts = opts || {};
  const secret = series === "mn";
  const def = CARD_SERIES_DEF[series];
  const owned = opts.owned !== undefined ? opts.owned
    : (secret ? !!(S.cards||{})["mn:0"] : cardHas(series, id));
  const p = secret ? null : POKE[id];
  const rank = CARD_ORDER.indexOf(series);
  const hero = opts.hero ? " hero-card" : "";

  if(!owned){
    return `<div class="tcard sealed${hero}" ${opts.attrs||""}>
      <div class="tc-in">
        <div class="tc-seal-grid"></div>
        <div class="tc-seal-mark">?</div>
        <div class="tc-seal-lbl">ENREGISTREMENT<br>NON ÉMIS</div>
        <div class="tc-seal-bytes">${cardBytes(series, id || 0, 6)}</div>
      </div></div>`;
  }

  const tint = secret ? "#8b5cf6" : TYPE_TINT[p.types[0]-1];
  const mv = secret ? [] : movesFor(p, 60).filter(m=>!m.util).slice(0, 2);
  const weak = secret ? 0 : weaknessOf(p);
  const e = secret ? (S.cards||{})["mn:0"] : cardEntry(series, id);
  const sName = seriesName(series);
  const name = secret ? "M̶I̶S̶S̶I̶N̶G̶N̶O̶" : p.name;

  return `<div class="tcard s-${series}${hero}" style="--tc:${tint};--rc:${def.c}" ${opts.attrs||""}>
    <div class="tc-edge"></div>
    <div class="tc-in">

      <div class="tc-bar">
        <span class="tc-gen">${GEN_TAG[series]}</span>
        <span class="tc-nm">${esc(name)}</span>
        ${secret ? `<span class="tc-hp">??<em>PV</em></span>`
                 : `<span class="tc-hp">${p.hp*2}<em>PV</em></span>
                    <span class="tt t${p.types[0]} tc-type">${TYPE_NAMES[p.types[0]].slice(0,3)}</span>`}
      </div>

      <div class="tc-window env-${cardEnvOf(id, secret)}">
        <div class="tc-sky"></div>
        <div class="tc-horizon"></div>
        <span class="tc-beam"></span>
        <div class="tc-atmos"></div>
        <span class="tc-scan"></span>
        ${cardArt(series, id)}
        <div class="tc-haze"></div>
        <div class="tc-vign"></div>
        <span class="tc-brackets"><i></i><i></i><i></i><i></i></span>
        <div class="tc-foil"></div>
        <div class="tc-glare"></div>
      </div>

      <div class="tc-class">
        <span class="tc-cls-n">${secret ? "Entité antérieure à l'index" : esc(cardTitleOf(id))}</span>
        <span class="tc-cls-s">${esc(sName)}</span>
      </div>

      <div class="tc-routines">
        ${secret
          ? `<div class="tc-mv"><span class="tc-mvn">└ aucune routine associée</span><b>——</b></div>`
          : mv.map(m=>`<div class="tc-mv">
              <span class="tt t${m.type}">${TYPE_NAMES[m.type].slice(0,3)}</span>
              <span class="tc-mvn">${esc(m.name)}</span>
              <b>${moveDamage(p, m)}</b>
            </div>`).join("")}
      </div>

      <div class="tc-bytes">${cardBytes(series, id || 0, hero ? 12 : 7)}</div>

      <div class="tc-foot">
        ${secret ? `<span class="tc-wr">FAIB <i class="tt t1">——</i></span>`
                 : `<span class="tc-wr">FAIB <i class="tt t${weak}">${TYPE_NAMES[weak].slice(0,3)}</i></span>`}
        <span class="grow"></span>
        <span class="tc-crc">${cardChecksum(series, id || 0)}</span>
        <span class="tc-idx">${secret ? "000" : String(id).padStart(3,"0")}<em>/386</em></span>
        <span class="tc-rar">${Array.from({length:rank+1},()=>"◈").join("")}</span>
      </div>

    </div>
    ${e && e.dup ? `<span class="tc-dup">×${e.dup+1}</span>` : ""}
  </div>`;
}

/* ---------- inclinaison au doigt sur la vue agrandie ---------- */
function installCardTilt(){
  const el = document.querySelector(".tcard.hero-card");
  if(!el || el.dataset.tilt) return;
  el.dataset.tilt = "1";
  const apply = (px, py) => {
    const r = el.getBoundingClientRect();
    const x = (px - r.left) / r.width - 0.5;
    const y = (py - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (-y * 16).toFixed(2) + "deg");
    el.style.setProperty("--ry", (x * 16).toFixed(2) + "deg");
    el.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%");
    el.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
  };
  const reset = () => {
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "50%");
  };
  el.addEventListener("pointermove", ev=>apply(ev.clientX, ev.clientY));
  el.addEventListener("pointerleave", reset);
  el.addEventListener("touchmove", ev=>{
    const t = ev.touches[0];
    if(t) apply(t.clientX, t.clientY);
  }, {passive:true});
  el.addEventListener("touchend", reset);
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
                const found = seriesFound(s);
                const n = Object.keys(CARD_INDEX).filter(k=>k.startsWith(s+":")).length;
                const got = CARD_MONS.filter(id=>cardHas(s,id)).length;
                return `<span class="sl ${found?"":"dim"}"
                  style="--rc:${found?CARD_SERIES_DEF[s].c:"var(--line2)"}">
                  ${found ? esc(CARD_SERIES_DEF[s].n) + ` <b>${got}/${n}</b>` : "·····"}</span>`;}).join("")}
              <span class="sl ${secret?"":"dim"}" style="--rc:${secret?"#8b5cf6":"var(--line2)"}">
                ${secret?"Sans index <b>1/1</b>":"·····"}</span>
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
            ${got.length
              ? `<span class="sprbox" style="width:44px;height:44px">${sprite(id, false, "")}</span>`
              : `<span class="monunknown">?</span>`}
            <div class="grow">
              <div class="row between">
                <span class="tiny">${got.length ? esc(POKE[id].name) : "?????"}</span>
                <span class="tiny ${got.length===v.length?"gold-t":"dim"} mono-num">${got.length}/${v.length}</span>
              </div>
              <div class="pipline">
                ${v.map(s=>`<span class="cpip ${cardHas(s,id)?"on":""}"
                  style="--rc:${seriesFound(s)?CARD_SERIES_DEF[s].c:"var(--line2)"}"
                  title="${esc(seriesName(s))}"></span>`).join("")}
              </div>
              <div class="tiny dim">${best ? "meilleure : " + esc(seriesName(best)) : "signature non répertoriée"}</div>
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
  const known = monFound(id);
  sheet(`${sheetHead(known ? POKE[id].name : "Signature non répertoriée")}
    <div class="tiny muted" style="margin-bottom:10px">${known ? esc(cardTitleOf(id)) + " — " : ""}
      ${v.filter(s=>cardHas(s,id)).length} illustration(s) sur ${v.length}.</div>
    <div class="cardgrid">
      ${v.map(s=>tcardHtml(s, id, {attrs:`data-act="cardzoom" data-s="${s}" data-id="${id}"`})).join("")}
    </div>
    <div class="panel tight" style="margin-top:11px">
      <div class="h sm">RARETÉ DES SÉRIES</div>
      ${v.map(s=>`<div style="padding:4px 0;border-top:1px dashed var(--line)">
        <div class="tiny" style="color:${seriesFound(s)?CARD_SERIES_DEF[s].c:"var(--ink3)"}">
          ${esc(seriesName(s))}</div>
        <div class="tiny dim">${esc(seriesDesc(s))}</div></div>`).join("")}
    </div>`);
};
ACTIONS.cardzoom = d => {
  const s = d.s, id = +d.id;
  const owned = s === "mn" ? !!(S.cards||{})["mn:0"] : cardHas(s, id);
  const e = s === "mn" ? (S.cards||{})["mn:0"] : cardEntry(s, id);
  const def = CARD_SERIES_DEF[s];
  sheet(`<div class="center">
    ${tcardHtml(s, id, {hero:true})}
    <div class="tiny" style="margin-top:12px;color:${seriesFound(s)?def.c:"var(--ink3)"}">${esc(seriesName(s))}</div>
    <div class="tiny muted" style="margin-top:4px">${esc(seriesDesc(s))}</div>
    ${owned
      ? (e && e.dup ? `<div class="tiny dim" style="margin-top:6px">${e.dup} exemplaire(s) en double —
          échangeables depuis l'espace en ligne.</div>` : "")
      : `<div class="tiny dim" style="margin-top:6px">Non émise.</div>`}
    <button class="btn wide" style="margin-top:12px" data-act="closesheet">Fermer</button>
  </div>`, true);
  installCardTilt();
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


/* ============================================================
   SACHET
   Le tirage est deja fait avant l'ouverture. L'animation ne
   revele rien qu'on ne sache : elle donne le temps du doute.
   Trois temps — le sachet scelle, la dechirure, le retournement.
   ============================================================ */
let BOOSTER = null;

function boosterTint(series){ return CARD_SERIES_DEF[series] ? CARD_SERIES_DEF[series].c : "#9db3cc"; }
/* la meilleure serie du sachet decide de son eclat */
function boosterRank(cards){
  return cards.reduce((a,c)=>Math.max(a, CARD_ORDER.indexOf(c.s)), 0);
}

function showBooster(cards, opts){
  opts = opts || {};
  const box = document.getElementById("discover");
  if(!box || !cards || !cards.length){ if(opts.onDone) opts.onDone(); return false; }

  BOOSTER = {cards, i:0, onDone:opts.onDone, torn:false};
  const rank = boosterRank(cards);
  box.className = "on boosterwin";
  box.style.setProperty("--ac", "var(--cyan)");
  box.innerHTML = `
    <div class="bo-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker done">${esc(opts.title || "SACHET SCELLÉ")}</div>

      <div class="bo-stage" id="bo-stage">
        <div class="bo-glow" id="bo-glow"></div>
        <div class="bo-fan" id="bo-fan">
          ${cards.slice(0,5).map((_,k)=>`<div class="bo-card" style="--k:${k};--n:${Math.min(5,cards.length)}">
            ${cardBackHtml()}</div>`).join("")}
        </div>
        <div class="bo-pack" id="bo-pack">
          <div class="bo-strip"><span></span><span></span><span></span></div>
          <div class="bo-face">
            <div class="bo-grid"></div>
            <div class="bo-mark">◈</div>
            <div class="bo-word">CODE<br>GENESIS</div>
            <div class="bo-sub">ARCHIVE SCELLÉE</div>
            <div class="bo-count">${cards.length} ENREGISTREMENT${cards.length>1?"S":""}</div>
            <div class="bo-bytes">${cardBytes("pack", cards[0].id, 8)}</div>
          </div>
          <div class="bo-foil"></div>
          <div class="bo-seal">SCELLÉ</div>
        </div>
      </div>

      <div class="tiny muted" id="bo-hint" style="margin-bottom:12px">
        ${esc(opts.sub || "Le contenu est déjà déterminé. Il ne reste qu'à l'ouvrir.")}</div>
      <button class="btn pri wide bo-btn" id="bo-open" data-act="boopen">Déchirer le sachet</button>
    </div>`;
  const pack = document.getElementById("bo-pack");
  if(pack && rank >= 3) pack.classList.add("rich");
  return true;
}

ACTIONS.boopen = () => {
  if(!BOOSTER || BOOSTER.torn) return;
  BOOSTER.torn = true;
  const pack = document.getElementById("bo-pack");
  const stage = document.getElementById("bo-stage");
  const glow = document.getElementById("bo-glow");
  const fan = document.getElementById("bo-fan");
  const btn = document.getElementById("bo-open");
  const hint = document.getElementById("bo-hint");
  const rank = boosterRank(BOOSTER.cards);

  if(btn) btn.style.display = "none";
  if(hint) hint.textContent = "";

  /* temps 1 : la bande se dechire */
  Sfx.glitch(); buzz([14, 26, 14]);
  if(pack) pack.classList.add("tearing");

  /* temps 2 : la lumiere sort, le sachet s'ecarte, les dos se deploient */
  setTimeout(()=>{
    if(glow) glow.classList.add("on");
    if(pack) pack.classList.add("torn");
    if(fan) fan.classList.add("out");
    if(stage) burstEl(stage, {n: 18 + rank*8, spread:150,
      colors:["#35f0d6", "#ffffff", rank >= 3 ? "#ffd24a" : "#4fb2ff"], dur:1000});
    rank >= 3 ? Sfx.win() : Sfx.shiny();
    buzz(rank >= 3 ? [22,40,70] : [18,30]);
  }, 420);

  /* temps 3 : premiere carte */
  setTimeout(boNext, 1250);
};

function boNext(){
  if(!BOOSTER) return;
  const c = BOOSTER.cards[BOOSTER.i];
  if(!c){
    const done = BOOSTER.onDone;
    BOOSTER = null;
    const box = document.getElementById("discover");
    if(box){ box.className = ""; box.innerHTML = ""; }
    if(done) done();
    return;
  }
  BOOSTER.i++;
  const rest = BOOSTER.cards.length - BOOSTER.i;
  const rank = CARD_ORDER.indexOf(c.s);
  const box = document.getElementById("discover");
  if(!box) return;
  box.className = "on cardwin rank" + rank;
  box.style.setProperty("--ac", boosterTint(c.s));
  box.innerHTML = `
    <div class="bo-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker done">${c.fresh ? "NOUVEL ENREGISTREMENT" : "EXEMPLAIRE SUPPLÉMENTAIRE"}</div>
      <div class="cardwin-stage flip" id="cw-stage">
        <div class="cw-halo"></div>
        ${tcardHtml(c.s, c.id, {hero:true, owned:true})}
      </div>
      <div class="cw-series in" style="color:${boosterTint(c.s)}">${esc(seriesName(c.s))}</div>
      <div class="dc-lore in">${esc(seriesDesc(c.s))}</div>
      <button class="btn pri wide dc-ok in" data-act="bonext">
        ${rest > 0 ? `Suivant (${rest} restant${rest>1?"s":""})` : "Ranger dans la collection"}</button>
    </div>`;
  installCardTilt();
  const st = document.getElementById("cw-stage");
  if(st) setTimeout(()=>burstEl(st, {n: 12 + rank*9, spread:140 + rank*20,
    colors:[boosterTint(c.s), "#ffffff", "#ffd24a"], dur:900 + rank*120}), 420);
  if(rank >= 3){ Sfx.win(); shakeApp(); buzz([25,45,80]); }
  else { Sfx.shiny(); buzz([18,34]); }
}
ACTIONS.bonext = () => boNext();
