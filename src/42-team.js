/* ============================================================
   42 — MON ÉQUIPE
   On capturait des centaines de Pokémon, mais aucun n'était le
   sien : des lignes de Pokédex. L'équipe devient le cœur du jeu.

   · SIX POKÉMON, le premier est ton partenaire.
   · ILS GRANDISSENT AVEC TOI : chaque point d'expérience que tu
     gagnes, où que ce soit, leur en donne une part. Les Bonbons
     d'équipe (coffres, fouilles, victoires) les font monter d'un
     niveau à la demande.
   · LES ÉTOILES : chaque exemplaire capturé de l'espèce compte.
     1 à 5 étoiles, +6 % de statistiques par étoile, dans tous les
     combats où tes Pokémon se battent.
   · LA PUISSANCE D'ÉQUIPE : un seul nombre qui monte, et que les
     défis comparent au leur.
   ============================================================ */

const STAR_STEPS = [1, 4, 10, 25, 60];        /* exemplaires capturés pour chaque étoile */
const STAR_BONUS = 0.06;
function dexTotalCaught(id){ const e = S.dex[id]; return e ? Math.max(e.tc || 0, e.c || 0) : 0; }
function starsOf(id){ const n = dexTotalCaught(id); let s = 0; for(const k of STAR_STEPS) if(n >= k) s++; return s; }
function starMul(id){ return 1 + STAR_BONUS * Math.max(0, starsOf(id) - 1); }
function nextStarAt(id){ const n = dexTotalCaught(id); return STAR_STEPS.find(k=>k > n) || null; }
function starsHtml(id, cls){ const s = starsOf(id); return `<span class="stars ${cls || ""}">${"★".repeat(s)}<i>${"★".repeat(5 - s)}</i></span>`; }

/* les exemplaires capturés ne diminuent plus quand on fait évoluer : on garde le total */
if(typeof addToDex === "function"){
  const _ad = addToDex;
  addToDex = function(id, level, shiny){
    const before = S.dex[id] ? starsOf(id) : 0;
    const r = _ad.apply(this, arguments);
    const e = S.dex[id];
    if(e){ e.tc = Math.max(e.tc || 0, (e.c || 0) - 1) + 1; }
    const after = starsOf(id);
    if(after > before && before > 0 && S.team.includes(id) && typeof banner === "function")
      banner({kicker:"ÉTOILE", title:`${POKE[id].name} passe à ${after} ★`, sub:`+${Math.round(STAR_BONUS * 100)} % de statistiques dans tous les combats`, spr:id, c:"#ffd24a", dur:2600});
    return r;
  };
}

/* ---------- l'expérience d'équipe ---------- */
function teamXpNeed(lvl){ return Math.round(30 + 0.9 * lvl * lvl); }
const TEAM_XP_SHARE = 0.6;
let TEAM_UPS = {};          /* les montées de niveau récentes, annoncées ensemble */
function teamGiveXp(id, n){
  const e = S.dex[id]; if(!e || e.lvl >= 100 || n <= 0) return 0;
  e.txp = (e.txp || 0) + n;
  let up = 0;
  while(e.lvl < 100 && e.txp >= teamXpNeed(e.lvl)){ e.txp -= teamXpNeed(e.lvl); e.lvl++; up++; }
  if(e.lvl >= 100) e.txp = 0;
  if(up){ TEAM_UPS[id] = e.lvl; teamUpsSoon(); }
  return up;
}
/* En début de partie, l'équipe monte presque à chaque capture : un bandeau par capture
   recouvrait tout le reste. Les montées s'accumulent et s'annoncent ensemble, une fois par
   minute au plus — sauf quand l'une d'elles ouvre une évolution, qui s'annonce aussitôt. */
const TEAM_UPS_GAP = 60000;
let TEAM_UPS_T = 0;
function teamUpsSoon(){
  clearTimeout(teamUpsSoon._r);
  teamUpsSoon._r = setTimeout(()=>{
    if(typeof currentScreen !== "undefined" && currentScreen === "team" && !(typeof sheetOpen === "function" && sheetOpen())) try { refresh(); } catch(e){}
  }, 900);
  const evo = Object.keys(TEAM_UPS).map(Number).some(id=>typeof evoReady === "function" && evoReady(id));
  const wait = evo ? 900 : Math.max(900, TEAM_UPS_GAP - (Date.now() - TEAM_UPS_T));
  clearTimeout(teamUpsSoon._t);
  teamUpsSoon._t = setTimeout(teamUpsShow, wait);
}
function teamUpsShow(){
  const ids = Object.keys(TEAM_UPS).map(Number).filter(id=>POKE[id]);
  if(!ids.length) return;
  const txt = ids.slice(0, 3).map(id=>`${POKE[id].name} N.${TEAM_UPS[id]}`).join(" · ") + (ids.length > 3 ? ` et ${ids.length - 3} autre(s)` : "");
  const evo = ids.filter(id=>typeof evoReady === "function" && evoReady(id));
  TEAM_UPS = {}; TEAM_UPS_T = Date.now();
  if(typeof banner === "function") banner({kicker:"TON ÉQUIPE PROGRESSE", title:txt, sub:evo.length ? `${POKE[evo[0]].name} peut évoluer !` : "Puissance d'équipe : " + fmt(teamPower()), spr:ids[0], c:"#5ce07a", dur:2800});
}
/* toute expérience gagnée par l'Archiviste nourrit l'équipe */
if(typeof addXp === "function"){
  const _ax = addXp;
  addXp = function(n){
    const r = _ax.apply(this, arguments);
    if(n > 0 && S && S.team) for(const id of S.team.slice(0, 6)) teamGiveXp(id, Math.round(n * TEAM_XP_SHARE));
    return r;
  };
}

/* ---------- les Bonbons d'équipe ---------- */
function candyCost(lvl){ return 1 + Math.floor(lvl / 20); }
function teamCandyGain(n){ if(!(n > 0)) return; S.candy = (S.candy || 0) + n; saveSoon(); }
ACTIONS.teamfeed = d => {
  const id = +d.id, e = S.dex[id];
  if(!e || e.lvl >= 100) return;
  const c = candyCost(e.lvl);
  if((S.candy || 0) < c){ toast("Pas assez de Bonbons d'équipe", "bad", "cross"); return; }
  S.candy -= c;
  e.lvl++; e.txp = 0;
  try { Sfx.coin(); } catch(e2){}
  buzz(10);
  save();
  if(typeof evoReady === "function" && evoReady(id)) toast(`${POKE[id].name} peut évoluer !`, "warn", "star");
  refresh();
};

/* ---------- la puissance ---------- */
function monPower(id){
  const e = S.dex[id], p = POKE[id];
  if(!e || !p) return 0;
  return Math.round(p.bst * (1 + e.lvl / 25) * starMul(id) * (typeof perfectMul === "function" ? perfectMul(id) : 1) * (e.shiny ? 1.02 : 1));
}
function teamIds(){ return (S.team || []).filter(id=>S.dex[id]).slice(0, 6); }
function teamPower(){ return teamIds().reduce((a, id)=>a + monPower(id), 0); }
/* la trace de la puissance, jour après jour : on voit qu'elle monte */
function teamPowerTrack(){
  S.tpLog = S.tpLog || {};
  const d = today(), p = teamPower();
  if(!S.tpLog[d] || p > S.tpLog[d]) S.tpLog[d] = p;
  const keys = Object.keys(S.tpLog).sort();
  while(keys.length > 14){ delete S.tpLog[keys.shift()]; }
  return keys.length > 1 ? p - S.tpLog[keys[keys.length - 2]] : 0;
}

/* les étoiles comptent dans les combats où se battent TES Pokémon */
if(typeof makeFighter === "function"){
  const _mf = makeFighter;
  makeFighter = function(id, level, opts){
    const f = _mf.apply(this, arguments);
    if(opts && opts.owned && S.dex[id]){
      const m = starMul(id);
      if(m !== 1){ f.maxHp = Math.round(f.maxHp * m); f.hp = f.maxHp; for(const k of ["atk", "def", "spa", "spd", "spe"]) f[k] = Math.round(f[k] * m); }
    }
    return f;
  };
}
if(typeof teamFighters === "function"){
  teamFighters = function(ids, boost){
    return ids.filter(id=>S.dex[id]).map(id=>makeFighter(id, S.dex[id].lvl, {shiny:S.dex[id].shiny, boost:boost || 1, owned:true}));
  };
}

/* quand un membre de l'équipe évolue, c'est lui qui change : la nouvelle forme prend sa place */
function teamOnEvolve(id, to){
  if(typeof onzeOnEvolve === "function") onzeOnEvolve(id, to);
  if(typeof histOnEvolve === "function") histOnEvolve(id, to);
  const slot = (S.team || []).indexOf(id);
  if(slot >= 0 && !S.team.includes(to)) S.team[slot] = to;
}

/* ============================================================
   L'ÉCRAN
   ============================================================ */
SCREENS.team = {
  after(){ if(typeof pmdWake === "function") pmdWake(); },
  html(){
    const ids = teamIds(), pw = teamPower(), delta = teamPowerTrack();
    const lead = ids[0];
    return `
      <div class="tm-hero">
        <div class="tm-pw"><small>PUISSANCE D'ÉQUIPE</small><b>${fmt(pw)}</b>${delta > 0 ? `<em>+${fmt(delta)} depuis hier</em>` : ""}</div>
        <div class="tm-lead">${lead ? (typeof pmdCanvas === "function" ? pmdCanvas(lead, 0, 120, {walk:true, shiny:S.dex[lead].shiny, mine:true}) : sprite(lead, S.dex[lead].shiny, "")) : ""}</div>
        ${lead ? `<div class="tm-leadn">${esc(POKE[lead].name)} <span class="tiny dim">· ton partenaire</span></div>` : `<div class="tiny dim">Capture des Pokémon pour former ton équipe.</div>`}
        <div class="tm-candy">${ic("seed")} <b>${fmt(S.candy || 0)}</b> Bonbons d'équipe</div>
      </div>
      <div class="tm-grid">${Array.from({length:6}, (_, i)=>{
        const id = ids[i];
        if(!id) return `<button class="tm-card empty" data-act="teamedit">${"+"}<small>Ajouter</small></button>`;
        const e = S.dex[id], need = teamXpNeed(e.lvl), c = candyCost(e.lvl), evo = typeof evoReady === "function" && evoReady(id);
        return `<div class="tm-card ${i === 0 ? "lead" : ""} ${evo ? "evo" : ""}">
          <div class="tm-top">${starsHtml(id)}${i === 0 ? `<i class="tm-crown">♛</i>` : ""}</div>
          <div class="tm-spr" data-act="teamview" data-id="${id}">${typeof pmdCanvas === "function" ? pmdCanvas(id, 0, 64, {shiny:e.shiny, mine:true}) : sprite(id, e.shiny, "")}</div>
          <b class="tm-n">${esc(POKE[id].name)}</b>${typeof monNick === "function" && monNick(id) ? `<i class="tm-nick">« ${esc(monNick(id))} »</i>` : ""}
          <div class="tm-lv"><span>N.${e.lvl}</span><span class="tm-pp">${fmt(monPower(id))}</span></div>
          <div class="bar thin"><i style="width:${e.lvl >= 100 ? 100 : Math.min(100, (e.txp || 0) / need * 100).toFixed(0)}%"></i></div>
          ${evo ? `<button class="btn xs gold wide" data-act="teamview" data-id="${id}">Évoluer</button>`
                : `<button class="btn xs wide ${(S.candy || 0) >= c && e.lvl < 100 ? "pri" : ""}" data-act="teamfeed" data-id="${id}" ${(S.candy || 0) >= c && e.lvl < 100 ? "" : "disabled"}>+1 niv · ${c} ${ic("seed")}</button>`}
        </div>`; }).join("")}</div>
      <button class="btn wide" style="margin-top:10px" data-act="teamedit">${ic("refresh")} Changer l'équipe</button>
      <div class="panel" style="margin-top:12px">
        <div class="h sm">COMMENT ELLE GRANDIT</div>
        <div class="tiny">· Chaque point d'<b>expérience</b> que tu gagnes, où que ce soit, en donne ${Math.round(TEAM_XP_SHARE * 100)} % à chacun des six.</div>
        <div class="tiny">· Les <b>Bonbons d'équipe</b> (coffres de session, fouilles, victoires) font monter d'un niveau à la demande.</div>
        <div class="tiny">· Les <b>étoiles</b> viennent des exemplaires capturés : ${STAR_STEPS.join(", ")} exemplaires pour 1 à 5 ★. Chaque étoile après la première : +${Math.round(STAR_BONUS * 100)} % de statistiques en combat.</div>
        <div class="tiny">· Le premier de l'équipe est ton <b>partenaire</b> : il t'accompagne sur l'écran d'accueil.</div>
      </div>`;
  }
};
ACTIONS.teamedit = () => {
  if(typeof teamPicker !== "function") return;
  teamPicker("Mon équipe — 6 Pokémon, le premier est ton partenaire", 6, sel=>{ S.team = sel.slice(0, 6); save(); refresh(); }, S.team);
};
ACTIONS.teamview = d => {
  const id = +d.id, e = S.dex[id]; if(!e) return;
  const nx = nextStarAt(id);
  if(typeof ACTIONS.dexopen === "function"){ ACTIONS.dexopen({id:String(id)}); return; }
  sheet(`${sheetHead(POKE[id].name)}<div class="tiny">N.${e.lvl} · ${starsHtml(id)} · ${dexTotalCaught(id)} capturés${nx ? ` · prochaine étoile à ${nx}` : ""}</div>`);
};

/* ---------- les bonbons tombent un peu partout ---------- */
if(typeof digClaim === "function"){
  const _dc = digClaim;
  digClaim = function(wall){ const r = _dc.apply(this, arguments); teamCandyGain(1 + (wall && wall.si >= 4 ? 1 : 0)); return r; };
}
if(typeof afterFightRewards === "function"){
  const _af = afterFightRewards;
  afterFightRewards = function(run, kind){ if(kind === "champ" || kind === "boss" || kind === "legend") teamCandyGain(kind === "boss" ? 5 : 2); return _af.apply(this, arguments); };
}
if(typeof sqFinish === "function"){
  const _sf = sqFinish;
  sqFinish = function(B){ const r = _sf.apply(this, arguments); if(B && B.result) teamCandyGain(1); return r; };
}

/* ---------- prochaine étape : une évolution prête dans l'équipe ---------- */
if(typeof NEXTSTEP_HOOKS !== "undefined") NEXTSTEP_HOOKS.push(()=>{
  const evo = teamIds().find(id=>typeof evoReady === "function" && evoReady(id));
  if(evo) return {p:60, t:`${POKE[evo].name} peut évoluer`, go:"team", i:"star"};
  const feed = teamIds().find(id=>S.dex[id].lvl < 100 && (S.candy || 0) >= candyCost(S.dex[id].lvl) * 3);
  if(feed) return {p:35, t:`Bonbons d'équipe : fais grandir ${POKE[feed].name}`, go:"team", i:"seed"};
  return null;
});
