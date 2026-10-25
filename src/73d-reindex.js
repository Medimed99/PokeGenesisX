/* ============================================================
   73d — LA RÉINDEXATION
   Avant la collection complète, presque toutes les cartes tirées
   sont des doublons (94 % sur une partie simulée) : une ligne
   « exemplaire supplémentaire », et rien d'autre.

   Désormais, chaque doublon d'un légendaire est comparé aux
   précédents. Au sixième, une illustration qui manquait réapparaît
   (la plus courante de celles qui manquent encore), révélée dans
   la même scène, juste après le doublon qui l'a fait revenir.

   Une ligne complète n'a plus rien à retrouver : chaque doublon
   s'y décompose en Fragments.

   Parties existantes : les doublons déjà reçus comptent, une fois,
   à la première ouverture ; ce qu'ils retrouvent est montré d'un
   bloc, avec une page d'explication.
   ============================================================ */
const REIDX_AT = 6;
const REIDX_FRAG = 15;
/* les écrans où une restauration en attente peut s'afficher d'elle-même */
const REIDX_QUIET = ["capture", "cards", "profile", "journal", "dex", "modules", "today", "team", "bag", "pokebox",
  "shop", "stats", "succes", "daily", "idle", "eggs", "hall", "atelier", "faction", "social", "online", "settings",
  "boss", "tower"];
/* ce que chaque doublon a produit, dans l'ordre : la révélation l'accroche au bon exemplaire */
let REIDX_TRACE = [];
let REIDX_IN = false;

function reidxPts(id){ return (S.reidx && S.reidx[id]) || 0; }
function reidxMissing(id){ return cardVariants(id).filter(s=>!cardHas(s, id)); }
/* la plus courante des illustrations manquantes : on remonte le temps une écriture à la fois */
function reidxNext(id){ const m = reidxMissing(id); return m.length ? m[0] : null; }
function reidxQueue(){ if(!Array.isArray(S.reidxQ)) S.reidxQ = []; return S.reidxQ; }

/* n doublons de plus pour ce légendaire. Renvoie ce qu'ils ont produit :
   {id, shown (la jauge au moment du doublon), pts (après), restored:[séries], frag} */
function reidxFeed(id, n){
  n = Math.max(1, n | 0);
  S.reidx = S.reidx || {};
  const out = {id, shown:0, pts:0, restored:[], frag:0, t:Date.now()};
  if(!reidxMissing(id).length){
    /* une ligne complète : le doublon n'a plus rien à retrouver, il se décompose */
    out.frag = REIDX_FRAG * n;
    gain("shards", out.frag);
    delete S.reidx[id];
    out.done = true;
    return out;
  }
  S.reidx[id] = (S.reidx[id] || 0) + n;
  out.shown = Math.min(REIDX_AT, S.reidx[id]);
  while(S.reidx[id] >= REIDX_AT){
    const s = reidxNext(id);
    if(!s) break;
    S.reidx[id] -= REIDX_AT;
    REIDX_IN = true;
    try {
      /* le pouvoir que la carte ouvre se montre dans sa scène, pas en bandeau */
      if(typeof cardRevealExpect === "function") cardRevealExpect();
      if(typeof cardHowSet === "function") cardHowSet("reidx", {n:REIDX_AT});
      if(grantCardV(s, id)){ out.restored.push(s); reidxQueue().push({s, id, t:Date.now()}); }
    } finally { REIDX_IN = false; }
  }
  /* la ligne vient d'être complétée : les points restants n'ont plus rien à chercher */
  if(!reidxMissing(id).length) delete S.reidx[id];
  out.pts = reidxPts(id);
  saveSoon();
  return out;
}

/* chaque doublon passe par la réindexation, d'où qu'il vienne */
if(typeof grantCardV === "function"){
  const _grantCardV3 = grantCardV;
  grantCardV = function(series, id){
    const r = _grantCardV3(series, id);
    if(!r && series !== "mn" && !REIDX_IN && CARD_INDEX[cardKey(series, id)]){
      try {
        const tr = reidxFeed(id, 1);
        /* le nombre d'exemplaires au moment de ce doublon, pour sa scène */
        try { tr.copies = (cardEntry(series, id).dup || 0) + 1; } catch(e){}
        /* l'exemplaire de quelqu'un d'avant, peut-être (73e) */
        if(typeof cardNoteRoll === "function"){ const n = cardNoteRoll(series, id); if(n) tr.note = n; }
        REIDX_TRACE.push(tr);
        if(REIDX_TRACE.length > 40) REIDX_TRACE.shift();
      } catch(e){}
    }
    return r;
  };
}

/* une obtention qui n'est pas un doublon comme les autres (un cadeau) : elle ne nourrit
   ni la réindexation, ni les annotations */
function reidxSkip(fn){
  const was = REIDX_IN;
  REIDX_IN = true;
  try { return fn(); } finally { REIDX_IN = was; }
}

/* une restoration en attente devient une carte de révélation */
function reidxCard(q){ return {s:q.s, id:q.id, fresh:true, reidx:true}; }

/* la révélation : chaque doublon reçoit sa jauge ; la carte qu'il a fait revenir
   le suit immédiatement ; les restaurations restées en attente passent à la fin */
function reidxWeave(cards){
  cards = (cards || []).filter(c=>c && c.s);
  const q = S && Array.isArray(S.reidxQ) ? S.reidxQ : [];
  const out = [], taken = [];
  /* les doublons de cette scène prennent les dernières traces de leur légendaire, dans
     l'ordre ; les plus anciennes appartiennent à des doublons qui n'ont jamais eu de scène */
  const dupOf = c => !c.fresh && c.s !== "mn" && !c.rx && !c.reidx;
  const mine = {};
  for(const id of new Set(cards.filter(dupOf).map(c=>c.id))){
    const k = cards.filter(c=>dupOf(c) && c.id === id).length;
    const all = REIDX_TRACE.filter(t=>t.id === id);
    mine[id] = all.slice(Math.max(0, all.length - k));
    REIDX_TRACE = REIDX_TRACE.filter(t=>t.id !== id);
  }
  for(const c of cards){
    out.push(c);
    if(!dupOf(c) || !mine[c.id] || !mine[c.id].length) continue;
    const tr = mine[c.id].shift();
    c.rx = tr;
    if(tr.note){
      const cc = String(tr.note).padStart(2, "0");
      c.tag = "EXEMPLAIRE ANNOTÉ · CONNEXION " + cc;
      c.lines = [`> signature détectée · N°${String(c.id).padStart(3, "0")}`, `> exemplaire déjà enregistré · connexion ${cc}`, "> quelque chose est écrit au dos…"];
    }
    for(const s of tr.restored){
      const j = q.findIndex(p=>p.id === c.id && p.s === s);
      if(j >= 0){ const p = q.splice(j, 1)[0]; taken.push(p); out.push(reidxCard(p)); }
    }
  }
  while(q.length){ const p = q.shift(); taken.push(p); out.push(reidxCard(p)); }
  return {out, taken};
}
if(typeof cardReveal === "function"){
  const _cardReveal = cardReveal;
  cardReveal = function(cards, opts){
    const {out, taken} = reidxWeave(cards);
    const ok = _cardReveal(out, opts);
    /* pas de scène possible : rien n'est perdu, la restauration attend la suivante */
    if(!ok && taken.length && S) reidxQueue().unshift(...taken);
    if(taken.length) saveSoon();
    return ok;
  };
}

/* ---------- les doublons d'avant ----------
   Une partie commencée avant la réindexation : chaque doublon déjà reçu compte, une fois. */
function reidxMigrate(){
  /* le repère est hors des drapeaux : il traverse les cycles, comme les cartes */
  if(S.reidxV) return 0;
  S.reidxV = 1;
  let found = 0;
  for(const id of CARD_MONS){
    if(!reidxMissing(id).length) continue;
    let n = 0;
    for(const s of cardVariants(id)){ const e = cardEntry(s, id); if(e) n += e.dup | 0; }
    if(!n) continue;
    const r = reidxFeed(id, n);
    found += r.restored.length;
  }
  if(found){
    S.reidxMig = 1;
    /* le doublon d'origine n'est pas montré : seule la carte retrouvée l'est */
    REIDX_TRACE = [];
  }
  saveSoon();
  return found;
}

/* ---------- ce qui n'a pas trouvé sa scène ----------
   Presque toujours, la restauration part avec la révélation de son doublon. Sinon
   (un parcours sans scène, une page rechargée), elle attend un moment calme. */
function reidxCalm(){
  if(typeof CRV !== "undefined" && CRV) return false;
  if(typeof stageHold === "function" && stageHold()) return false;
  if(typeof momentBusy === "function" && momentBusy()) return false;
  if(typeof MOMENT_ON !== "undefined" && MOMENT_ON) return false;
  if(typeof sheetOpen === "function" && sheetOpen()) return false;
  if(typeof currentScreen !== "undefined" && REIDX_QUIET.indexOf(currentScreen) < 0) return false;
  return true;
}
/* les révélations qui attendent un moment calme : une partie qui retrouve ses cartes
   transformées reçoit d'abord l'explication (73j) */
function reidxQuiet(){
  if(!reidxCalm()) return false;
  if(typeof cnewsPending === "function" && cnewsPending()) return false;
  return true;
}
function reidxTick(){
  if(!S || !S.flags || typeof introSeen !== "function" || !introSeen()) return;
  if(!S.reidxV) reidxMigrate();
  const q = Array.isArray(S.reidxQ) ? S.reidxQ : [];
  if(!q.length || !reidxQuiet()) return;
  /* une scène prévue la récupère d'elle-même : on lui laisse le temps d'arriver */
  if(!S.reidxMig && Date.now() - (q[0].t || 0) < 45000) return;
  const n = q.length, mig = !!S.reidxMig;
  const ids = [...new Set(q.map(p=>p.id))];
  const who = ids.length === 1 ? POKE[ids[0]].name : ids.length + " légendaires";
  const intro = mig
    ? {title:"L'archive a relu tes doublons",
       text:`Tes cartes en double ont été comparées entre elles. Là où elles ne concordaient pas, ${n > 1 ? "des illustrations qui te manquaient sont réapparues" : "une illustration qui te manquait est réapparue"}.`,
       rewards:`${n} illustration${n > 1 ? "s" : ""} retrouvée${n > 1 ? "s" : ""} · ${who}`}
    : {title:"Une illustration retrouvée",
       text:`Six doublons de ${who}, comparés entre eux. Là où ils ne concordaient pas, une illustration qui te manquait est réapparue.`,
       rewards:`${n} illustration${n > 1 ? "s" : ""} retrouvée${n > 1 ? "s" : ""}`};
  S.reidxMig = 0;
  cardReveal([], {kicker:"RÉINDEXATION", intro, onDone:()=>{ try { refresh(); } catch(e){} }});
}
if(typeof setInterval === "function") setInterval(()=>{ try { reidxTick(); } catch(e){} }, 2000);

/* ---------- la jauge ---------- */
function reidxBar(pts, cls){
  return `<span class="rx-bar ${cls || ""}" aria-hidden="true">${Array.from({length:REIDX_AT}, (_, i)=>`<i class="${i < pts ? "on" : ""}"></i>`).join("")}</span>`;
}
/* dans la fiche d'un légendaire */
function reidxPanel(id){
  if(!monFound(id)) return "";
  const next = reidxNext(id), pts = reidxPts(id), name = POKE[id].name;
  if(!next) return `<div class="panel tight rx-panel done">
      <div class="row between"><b class="tiny">RÉINDEXATION</b><span class="tiny gold-t">ligne complète</span></div>
      <div class="tiny dim">Tu as toutes les illustrations de ${esc(name)}. Chaque nouveau doublon te rapporte <b>${REIDX_FRAG} Fragments</b>.</div>
    </div>`;
  return `<div class="panel tight rx-panel">
      <div class="row between"><b class="tiny">RÉINDEXATION</b><span class="tiny mono-num">${pts} / ${REIDX_AT}</span></div>
      ${reidxBar(pts)}
      <div class="tiny dim">Au ${REIDX_AT === 6 ? "sixième" : REIDX_AT + "e"} doublon de ${esc(name)}, une illustration qui te manque réapparaît :
        <b style="color:${seriesFound(next) ? CARD_SERIES_DEF[next].c : "var(--ink2)"}">${esc(seriesName(next))}</b>.</div>
    </div>`;
}
/* sous un doublon, dans sa scène de révélation */
if(typeof CRV_EXTRA !== "undefined") CRV_EXTRA.push(c=>reidxRevealHtml(c));
function reidxRevealHtml(c){
  const r = c.rx; if(!r) return "";
  const name = POKE[c.id] ? POKE[c.id].name : "";
  if(r.done) return `<div class="crv-rx done"><small>RÉINDEXATION · LIGNE COMPLÈTE</small>
      <span>Tu as déjà toutes les illustrations de ${esc(name)} : ce doublon te rapporte <b>+${r.frag} Fragments</b>.</span></div>`;
  if(r.restored.length) return `<div class="crv-rx hit"><small>RÉINDEXATION · ${REIDX_AT} / ${REIDX_AT}</small>${reidxBar(REIDX_AT, "full")}
      <span>${REIDX_AT === 6 ? "Six" : REIDX_AT} doublons : une illustration qui te manquait réapparaît…</span></div>`;
  const left = REIDX_AT - r.shown;
  return `<div class="crv-rx"><small>RÉINDEXATION · ${r.shown} / ${REIDX_AT}</small>${reidxBar(r.shown)}
      <span>Encore ${left} doublon${left > 1 ? "s" : ""} de ${esc(name)}, et une illustration qui te manque réapparaîtra.</span></div>`;
}
