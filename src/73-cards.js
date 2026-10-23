/* ============================================================
   73 — CARTES DE COLLECTION
   Uniquement des légendaires des trois premières générations, plus
   une pièce secrète. Chacun existe en plusieurs illustrations, une
   par génération qui l'a dessiné : plus l'illustration est ancienne,
   plus elle est rare. Cinq légendaires seulement ont une illustration
   Rouge/Bleu : quatre déclarés, et Mew, qui ne figurait nulle part.

   Une carte est une pleine illustration : le sprite de l'époque, posé
   dans une scène peinte avec les contraintes de la même époque (les
   quatre teintes du sprite pour 1996, huit couleurs pour 1999…), sous
   un cadre dont la matière dit la rareté. Pas d'attaques : un nom,
   un titre, une série et son année, une rareté.
   ============================================================ */

/* Chaque serie est une ecriture successive de la meme entite. Le systeme a
   redessine ses definitions a plusieurs reprises sans jamais effacer les
   precedentes : les plus anciennes ont simplement cesse d'etre distribuees. */
const CARD_SERIES_DEF = {
  art: {n:"Rendu courant",   w:100, c:"#b9c4d2",
        d:"L'entité telle que le système la dessine aujourd'hui. Nette, complète, et sans histoire."},
  g5:  {n:"Rendu antérieur", w:45,  c:"#4fb2ff",
        d:"Une définition plus ancienne, encore en mouvement. Remplacée, jamais effacée."},
  g3:  {n:"Rendu instable",  w:18,  c:"#ff3d7f",
        d:"Une version plus ancienne. Les teintes ont dérivé, le contour ne tient plus tout à fait."},
  g2:  {n:"Rendu fondateur", w:6,   c:"#e0b64a",
        d:"Une des toutes premières versions de cette entité. Onze seulement ont survécu jusqu'ici."},
  g1:  {n:"Rendu primordial",w:1.5, c:"#e8e2cf",
        d:"Avant la couleur. Cinq entités étaient déjà écrites : quatre déclarées, et une qui ne figurait nulle part."},
  mn:  {n:"Sans index",      w:0,   c:"#8b5cf6",
        d:"Aucune génération ne la revendique. Elle n'a pas été émise : elle s'est écrite toute seule."},
  pz:  {n:"Rendu inédit",    w:0,   c:"#9ff8ec",
        d:"Aucune génération ne l'a dessiné. Avant que tu l'écrives, il n'existait dans aucune version."}
};
/* une serie n'est nommee qu'apres en avoir vu au moins un exemplaire */
function seriesFound(s){
  if(s === "mn") return !!(S.cards && S.cards["mn:0"]);
  if(s === "pz") return !!(S.cards && S.cards["pz:474"]);
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
/* +1 : la piece secrete. La carte de Porygon-Z ne compte que quand elle existe : personne ne l'attend */
function cardTotal(){ return Object.keys(CARD_INDEX).length + 1 + (S && S.cards && S.cards["pz:474"] ? 1 : 0); }
function cardOwnedCount(){ return Object.keys(S.cards || {}).length; }

/* ---------- obtention ---------- */
/* d'où vient la carte qu'on va obtenir : l'appelant le dit juste avant (cardHowSet),
   l'obtention le note sur le premier exemplaire, avec l'équipe du moment */
let CARD_HOW = null;
function cardHowSet(k, x){ CARD_HOW = Object.assign({k}, x || {}); }
function cardHowStamp(how){
  const h = Object.assign({}, how);
  try { h.tm = (typeof teamIds === "function" ? teamIds() : (S.team || [])).slice(0, 6); } catch(e){ h.tm = []; }
  try { h.cx = typeof sagaConn === "function" ? sagaConn() : 12; } catch(e){}
  return h;
}
function grantCardV(series, id){
  S.cards = S.cards || {};
  const k = cardKey(series, id);
  const how = CARD_HOW; CARD_HOW = null;
  if(S.cards[k]){ S.cards[k].dup = (S.cards[k].dup || 0) + 1; return false; }
  S.cards[k] = {t: Date.now(), dup: 0};
  if(how) S.cards[k].h = cardHowStamp(how);
  saveSoon();
  return true;
}
/* l'integrite remonte les ecritures anciennes : a 100 %, chaque serie plus ancienne
   pese 1,3 fois plus. Le monde repare laisse reapparaitre ce qu'il avait recouvert. */
function cardIntegrityBias(){
  const ig = typeof S !== "undefined" && S ? Math.max(0, Math.min(100, +S.integrity || 0)) : 0;
  return 1 + 0.3 * ig / 100;
}
/* tirage pondéré ; `bias` releve la chance des series anciennes */
function rollCardSeries(id, bias){
  const pool = [];
  const b = (bias || 1) * cardIntegrityBias();
  for(const s of cardVariants(id)){
    let w = CARD_SERIES_DEF[s].w;
    if(b !== 1) w *= Math.pow(b, CARD_ORDER.indexOf(s));
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
  S.cards["mn:0"] = {t: Date.now(), dup: 0, h: cardHowStamp({k:"secret"})};
  saveSoon();
  return true;
}

function cardTitleOf(id){
  const g = REGIONS.flatMap(x=>x.guardians).find(x=>x.id === id);
  if(g) return g.title;
  const p = POKE[id];
  return p.leg === 2 ? "Signature fabuleuse" : "Signature légendaire";
}
/* le sous-titre d'une carte : le titre de gardien, sinon le nom de sa scène */
function cardSubtitle(id){
  const g = REGIONS.flatMap(x=>x.guardians).find(x=>x.id === id);
  if(g) return g.title;
  return (typeof CARD_SCENES !== "undefined" && CARD_SCENES[id]) || cardTitleOf(id);
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

/* ============================================================
   RENDU
   Trois couches viennent des atlas : la scène, le sujet, les
   particules. Le cadre, les reflets et le cartel sont en CSS, et
   leur matière suit la série : argent brossé, chrome holographique,
   chrome dérivé, or gravé, laque noire et or.
   ============================================================ */
function cardEntryOf(series, id){
  if(series === "mn") return CARD_MN;
  if(series === "pz") return typeof CARD_PZ !== "undefined" ? CARD_PZ : null;
  return CARD_INDEX[cardKey(series, id)];
}

/* une case d'atlas, en arriere-plan d'un element de la taille voulue */
function cardBg(r){
  const A = CARD_ATLAS[r[0]], x = r[1], y = r[2], w = r[3], h = r[4];
  const px = A.w === w ? 0 : x / (A.w - w) * 100, py = A.h === h ? 0 : y / (A.h - h) * 100;
  return `background-image:var(--card-${r[0]});background-size:${(A.w / w * 100).toFixed(3)}% ${(A.h / h * 100).toFixed(3)}%;`
    + `background-position:${px.toFixed(4)}% ${py.toFixed(4)}%`;
}
function cardLayer(r, cls, style){
  return `<i class="${cls}${r[0] === "px" ? " px" : ""}" style="${cardBg(r)}${style ? ";" + style : ""}"></i>`;
}
function cardMonStyle(M){
  const b = M.b;
  return `left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%`;
}
/* la rarete, en cinq facettes */
function cardPips(rank){
  return `<span class="tc-pips" aria-label="rareté ${rank + 1} sur 5">${
    [0,1,2,3,4].map(i=>`<i class="${i <= rank ? "on" : ""}"></i>`).join("")}</span>`;
}
/* ce que dit le cartel sous la carte agrandie : l'époque de l'image, en quelques mots.
   Pas de taille en pixels ni de nombre de couleurs : ça casse le charme. */
const CARD_SPEC = {art:"Le dessin officiel d'aujourd'hui.", g5:"Le sprite animé de 2010.", g3:"Le sprite de 2002.",
  g2:"Le sprite de 1999, les premières couleurs.", g1:"Le sprite de 1996, en quatre teintes."};
function cardSpec(series, id){
  if(series === "mn") return "Aucune génération ne la revendique.";
  if(series === "pz") return "Aucune version avant celle-ci.";
  const M = cardEntryOf(series, id);
  if(M && !M.n && series !== "art") return "Une illustration ajoutée à la main.";
  return CARD_SPEC[series] || "";
}
function cardEra(series){
  if(series === "mn") return "Sans index";
  if(series === "pz") return "Rendu inédit";
  const y = CARD_YEARS[series];
  return CARD_SERIES_DEF[series].n + (y ? ` <b>${y}</b>` : "");
}

/* le dos de carte : une rosace de gravure, comme sur un titre ou un billet */
function cardBackHtml(cls){
  return `<div class="cardback ${cls||""}">
    <i class="cb-guil"></i><i class="cb-ring"></i>
    <b class="cb-mark">◈</b>
    <span class="cb-word">CODE&nbsp;GENESIS</span>
    <i class="cb-foil"></i>
  </div>`;
}

function tcardHtml(series, id, opts){
  opts = opts || {};
  const secret = series === "mn", pzc = series === "pz";
  const owned = opts.owned !== undefined ? opts.owned
    : (secret ? !!(S.cards||{})["mn:0"] : cardHas(series, id));
  const rank = secret || pzc ? 4 : Math.max(0, CARD_ORDER.indexOf(series));
  const hero = opts.hero ? " hero-card" : "";
  const M = cardEntryOf(series, id);

  if(!owned || !M){
    /* une carte non emise ne montre que sa matiere, et seulement si la serie est connue */
    const known = !secret && seriesFound(series);
    return `<div class="tcard sealed ${known ? "s-" + series : ""}${hero}" ${opts.attrs||""}>
      <div class="tc-body"><i class="tc-foil"></i>
        <div class="tc-art">
          <i class="tc-guil"></i>
          <b class="tc-q">?</b>
          <span class="tc-sl">Non émise</span>
          ${known ? cardPips(rank) : ""}
        </div>
      </div></div>`;
  }

  const p = secret ? null : POKE[id];
  const e = secret ? (S.cards||{})["mn:0"] : cardEntry(series, id);
  const name = secret ? "Sans index" : p.name;
  const who = pzc ? ((e && e.h && e.h.who) || pzName()) : "";
  const sub = secret ? "Entité antérieure à l'index" : pzc ? "Écrit par " + who : cardSubtitle(id);
  const steps = M.s[0] === "px" ? M.s[4] : 0;

  const noted = !secret && typeof cardNoteOf === "function" && cardNoteOf(series, id);
  return `<div class="tcard s-${series} r${rank}${hero}" style="--lc:${M.l}" ${opts.attrs||""}>
    ${noted ? `<i class="tc-slip" title="Quelque chose est écrit au dos"></i>` : ""}
    <div class="tc-body"><i class="tc-foil"></i>
      <div class="tc-art">
        ${cardLayer(M.s, "tc-scene")}
        <i class="tc-holo"></i>
        ${cardLayer(M.m, "tc-mon", cardMonStyle(M))}
        <i class="tc-fxw"><i class="tc-fx p-${M.p}${steps ? " st" : ""}"${steps ? ` style="--st:${steps}"` : ""}>${cardLayer(M.f, "")}${cardLayer(M.f, "")}</i></i>
        <i class="tc-sheen"></i>
        <div class="tc-plate">
          <div class="tc-name">${esc(name)}</div>
          <div class="tc-sub">${esc(sub)}</div>
          <div class="tc-foot"><span class="tc-era">${cardEra(series)}</span>${secret ? `<span class="tc-pips mn">∅</span>` : pzc ? `<span class="tc-pips pz">N° 387</span>` : cardPips(rank)}</div>
        </div>
        <span class="tc-no">${secret ? "000" : pzc ? "387" : String(id).padStart(3, "0")}</span>
        <i class="tc-glare"></i>
      </div>
    </div>
    ${e && e.dup ? `<span class="tc-dup">×${e.dup + 1}</span>` : ""}
  </div>`;
}

/* vignette : la scene et le sujet, sans cartel (listes, echanges) */
function cardArt(series, id, cls){
  const M = cardEntryOf(series, id);
  if(!M) return `<span class="tcmini ${cls||""}"></span>`;
  return `<span class="tcmini s-${series} ${cls||""}">${cardLayer(M.s, "tc-scene")}${cardLayer(M.m, "tc-mon", cardMonStyle(M))}</span>`;
}

/* ---------- inclinaison de la vue agrandie ----------
   La carte suit le doigt : la scene recule, le sujet avance, le reflet
   glisse sur la matiere. A l'ouverture, une seule lumiere la traverse. */
function cardCalm(){
  try { if(typeof calmFx === "function" && calmFx()) return true; } catch(e){}
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch(e){ return false; }
}
function installCardTilt(){
  const el = document.querySelector(".tcard.hero-card:not([data-tilt])");
  if(!el) return;
  el.dataset.tilt = "1";
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, user = false;
  const set = (x, y) => {
    const st = el.style;
    st.setProperty("--rx", (-y * 13).toFixed(2) + "deg");
    st.setProperty("--ry", (x * 15).toFixed(2) + "deg");
    st.setProperty("--mx", x.toFixed(3));
    st.setProperty("--my", y.toFixed(3));
    st.setProperty("--gx", ((x + 1) * 50).toFixed(1) + "%");
    st.setProperty("--gy", ((y + 1) * 50).toFixed(1) + "%");
    st.setProperty("--ga", Math.min(1, Math.hypot(x, y) * 1.1 + 0.3).toFixed(2));
  };
  const loop = () => {
    if(!el.isConnected){ raf = 0; return; }
    cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
    set(cx, cy);
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
  };
  const aim = (x, y) => { tx = x; ty = y; if(!raf) raf = requestAnimationFrame(loop); };
  const at = (px, py) => {
    user = true;
    const r = el.getBoundingClientRect();
    aim(Math.max(-1, Math.min(1, (px - r.left) / r.width * 2 - 1)),
        Math.max(-1, Math.min(1, (py - r.top) / r.height * 2 - 1)));
  };
  el.addEventListener("pointermove", ev=>at(ev.clientX, ev.clientY));
  el.addEventListener("pointerleave", ()=>aim(0, 0));
  el.addEventListener("touchmove", ev=>{ const t = ev.touches[0]; if(t) at(t.clientX, t.clientY); }, {passive:true});
  el.addEventListener("touchend", ()=>aim(0, 0));
  set(0, 0);
  if(cardCalm()) return;
  /* le seul mouvement que personne n'a demande : une lumiere qui passe */
  const t0 = performance.now();
  const sweep = now => {
    if(user || !el.isConnected) return;
    const k = Math.min(1, (now - t0) / 1300), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    tx = cx = -0.85 + 1.7 * e; ty = cy = -0.35 + 0.5 * e;
    set(cx, cy);
    if(k < 1) requestAnimationFrame(sweep); else aim(0, 0);
  };
  requestAnimationFrame(sweep);
}

/* gravures : une rosace pour le dos, une trame d'ondes pour les cadres precieux */
function cardGuilloche(){
  const fmt = v => v.toFixed(2);
  const curve = (R, r, d, turns, sc, rot) => {
    let s = "";
    const n = 900 * turns;
    for(let i = 0; i <= n; i++){
      const t = i / n * Math.PI * 2 * turns;
      const x = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
      const y = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
      const xr = x * Math.cos(rot) - y * Math.sin(rot), yr = x * Math.sin(rot) + y * Math.cos(rot);
      s += (i ? "L" : "M") + fmt(100 + xr * sc) + " " + fmt(100 + yr * sc);
    }
    return s;
  };
  const rose = (r0, a, k, ph) => {
    let s = "";
    for(let i = 0; i <= 720; i++){
      const t = i / 720 * Math.PI * 2, r = r0 + a * Math.cos(k * t + ph);
      s += (i ? "L" : "M") + fmt(100 + r * Math.cos(t)) + " " + fmt(100 + r * Math.sin(t));
    }
    return s;
  };
  const paths = [curve(1, 3/8, 0.36, 3, 78, 0), curve(1, 3/8, 0.36, 3, 78, Math.PI / 8),
    curve(1, 2/7, 0.22, 2, 56, 0), rose(92, 3.2, 36, 0), rose(92, 3.2, 36, Math.PI), rose(30, 4, 12, 0)];
  const svg = c => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="none" stroke="${c}" stroke-width=".45">${paths.map(p=>`<path d="${p}"/>`).join("")}</g></svg>`;
  const band = c => {
    let d = "";
    for(let k = 0; k < 4; k++){
      let s = "";
      for(let x = 0; x <= 32; x++) s += (x ? "L" : "M") + x + " " + fmt(6 + 3.6 * Math.sin((x / 32) * Math.PI * 2 + k * Math.PI / 2));
      d += `<path d="${s}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 12" width="32" height="12"><g fill="none" stroke="${c}" stroke-width=".5">${d}</g></svg>`;
  };
  /* paillettes : des points irreguliers, tires une fois pour toutes (meme graine, meme tapis) */
  const glitter = () => {
    let h = 0x9e3779b9, out = "";
    const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    for(let i = 0; i < 90; i++){
      const x = rnd() * 120, y = rnd() * 120, r = 0.35 + Math.pow(rnd(), 2.2) * 1.4, o = 0.35 + rnd() * 0.65;
      const c = rnd() < 0.7 ? "#ffffff" : rnd() < 0.5 ? "#ffe9a8" : "#fff2d0";
      for(const dx of [-120, 0, 120]) for(const dy of [-120, 0, 120]){
        const cx = x + dx, cy = y + dy;
        if(cx < -3 || cx > 123 || cy < -3 || cy > 123) continue;
        out += `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" fill="${c}" fill-opacity="${o.toFixed(2)}"/>`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${out}</svg>`;
  };
  const url = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  const r = document.documentElement.style;
  r.setProperty("--guil-rose", url(svg("#4fd8c4")));
  r.setProperty("--guil-gold", url(band("#f3d27a")));
  r.setProperty("--guil-dark", url(band("#5a3d0c")));
  r.setProperty("--guil-rose-gold", url(svg("#e9c46a")));
  r.setProperty("--glitter", url(glitter()));
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
              ${typeof pzCardOwned === "function" && pzCardOwned() ? `<span class="sl" style="--rc:#9ff8ec">Rendu inédit <b>1/1</b></span>` : ""}
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
            ${got.length ? cardArt(best, id, "rowmini") : `<span class="monunknown">?</span>`}
            <div class="grow">
              <div class="row between">
                <span class="tiny">${got.length ? esc(POKE[id].name) : "?????"}</span>
                <span class="tiny ${got.length===v.length?"gold-t":"dim"} mono-num">${got.length}/${v.length}</span>
              </div>
              <div class="pipline">
                ${v.map(s=>`<span class="cpip ${cardHas(s,id)?"on":""}"
                  style="--rc:${seriesFound(s)?CARD_SERIES_DEF[s].c:"var(--line2)"}"
                  title="${esc(seriesName(s))}"></span>`).join("")}
                ${typeof reidxPts === "function" && reidxPts(id) && reidxNext(id) ? `<span class="rx-mini" title="Réindexation : ${reidxPts(id)} doublon(s) sur ${REIDX_AT}">↻ ${reidxPts(id)}/${REIDX_AT}</span>` : ""}
              </div>
              <div class="tiny dim">${best ? "meilleure : " + esc(seriesName(best)) : "signature non répertoriée"}${typeof chronoUnseen === "function" && chronoUnseen(id) ? ` · <b class="cy">chronologie à voir</b>` : ""}</div>
              ${typeof CARD_POWERS !== "undefined" && CARD_POWERS[id] ? `<div class="tiny ${got.length ? "gold-t" : "dim"}">${ic("star")} ${esc(CARD_POWERS[id].n)}${got.length ? " · " + TIER_NAMES[Math.min(3, got.length)] : ""}</div>` : ""}
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

      ${typeof pzCardPanelHtml === "function" ? pzCardPanelHtml() : ""}
      ${typeof cardPowersPanel === "function" ? cardPowersPanel() : ""}

      <div class="panel" style="margin-top:12px">
        <div class="h sm">OÙ LES OBTENIR</div>
        <div class="tiny">· Première victoire sur un <b>Data Guardian</b> — carte de ce légendaire, série élevée garantie.</div>
        <div class="tiny">· <b>Expédition réussie</b> — une carte au hasard, d'autant meilleure que les risques pris en chemin.</div>
        <div class="tiny">· <b>Archives du Vide et Souveraines</b> — tirage libre.</div>
        <div class="tiny">· <b>Objectifs hebdomadaires</b> — une carte par palier atteint.</div>
        <div class="tiny">· <b>Intégrité</b> — plus le monde est réparé, plus les illustrations anciennes sortent souvent${Math.round((cardIntegrityBias() - 1) * 100) ? ` (en ce moment : +${Math.round((cardIntegrityBias() - 1) * 100)} %)` : ""}.</div>
        <div class="tiny">· <b>Doublons</b> — au sixième doublon d'un légendaire, une illustration qui te manque réapparaît.
          Quand tu les as toutes, chaque doublon rapporte ${typeof REIDX_FRAG !== "undefined" ? REIDX_FRAG : 15} Fragments.</div>
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
    ${typeof CARD_POWERS !== "undefined" && CARD_POWERS[id] ? `<div class="panel tight cpw-sheet" style="margin-bottom:10px">
      <div class="row between"><b class="tiny gold-t">${ic("star")} ${esc(CARD_POWERS[id].n)}</b>
        <span class="cpw-t t${cardTier(id)}">${cardTier(id) ? TIER_NAMES[cardTier(id)] : "verrouillé"}</span></div>
      <div class="tiny dim">${esc(cardPowerWhere(id))}</div>
      <div class="tiny">${esc(cardPowerDesc(id))}</div>
      <div class="tiny dim" style="margin-top:4px">${cardTier(id) >= 3 ? "Pouvoir au maximum." : "Prochaine illustration : " + TIER_NAMES[cardTier(id) + 1] + " — " + esc(cardPowerDesc(id, cardTier(id) + 1))}</div>
      <div class="tiny dim">Possédé en carte, ${known ? esc(POKE[id].name) : "ce légendaire"} peut aussi t'attendre au Sanctuaire de l'Expédition.</div>
    </div>` : ""}
    <div class="cardgrid">
      ${v.map(s=>tcardHtml(s, id, {attrs:`data-act="cardzoom" data-s="${s}" data-id="${id}"`})).join("")}
    </div>
    ${typeof reidxPanel === "function" ? reidxPanel(id) : ""}
    ${typeof chronoComplete === "function" && chronoComplete(id) ? `<button class="btn ${chronoUnseen(id) ? "pri" : "ghost"} wide chr-open" data-act="chrplay" data-id="${id}">
      ${ic("eye")} ${chronoUnseen(id) ? "Voir sa chronologie" : "Revoir sa chronologie"} · de ${CARD_YEARS[cardVariants(id).slice(-1)[0]] || "aujourd'hui"} à aujourd'hui</button>` : ""}
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
  /* le cartel : le titre de la scene, puis l'image en chiffres, comme sous une oeuvre */
  const scene = s === "mn" ? CARD_SCENES[0] : CARD_SCENES[id];
  /* le dos : d'où vient la carte, et ce qu'on a pu écrire dessus (73e) */
  const back = owned && typeof cardRecordHtml === "function" ? cardRecordHtml(s, id) : "";
  const note = owned && s !== "mn" && typeof cardNoteOf === "function" ? cardNoteOf(s, id) : null;
  sheet(`<div class="center">
    ${back ? `<div class="tc-flip" id="tc-flip" data-act="cardflip"><div class="tc-flip-in">
        <div class="tc-side front">${tcardHtml(s, id, {hero:true})}</div>
        <div class="tc-side back">${back}</div></div></div>` : tcardHtml(s, id, {hero:true})}
    ${owned && scene ? `<div class="tc-cartel"><div class="tc-ct">« ${esc(scene)} »</div>
      <div class="tc-cs"><b style="color:${def.c}">${esc(seriesName(s))}</b>. ${esc(cardSpec(s, id))}</div></div>`
      : `<div class="tiny" style="margin-top:12px;color:${seriesFound(s)?def.c:"var(--ink3)"}">${esc(seriesName(s))}</div>`}
    <div class="tiny muted" style="margin-top:6px">${esc(seriesDesc(s))}</div>
    ${owned
      ? (e && e.dup ? `<div class="tiny dim" style="margin-top:6px">${e.dup} exemplaire${e.dup > 1 ? "s" : ""} en double.</div>` : "")
      : `<div class="tiny dim" style="margin-top:6px">Non émise.</div>`}
    ${back ? `<button class="btn ghost wide tc-flipbtn" id="tc-flipbtn" style="margin-top:10px" data-act="cardflip">${note ? "Lire ce qui est écrit au dos" : "Retourner la carte"}</button>` : ""}
    ${owned && typeof skinZoomHtml === "function" ? skinZoomHtml(s, id) : ""}
    <button class="btn wide" style="margin-top:8px" data-act="closesheet">Fermer</button>
  </div>`, true);
  installCardTilt();
  if(typeof installCardFlip === "function") installCardFlip();
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
      ${CARD_SCENES[c.s === "mn" ? 0 : c.id] ? `<div class="cw-scene in">« ${esc(CARD_SCENES[c.s === "mn" ? 0 : c.id])} »</div>` : ""}
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
