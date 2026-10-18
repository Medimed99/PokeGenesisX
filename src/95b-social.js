/* ============================================================
   95b — LES AUTRES JOUEURS
   · LE RAID DE LA SEMAINE : un légendaire, des points de vie
     partagés. Trois attaques par jour avec son équipe ; les
     dégâts de chacun s'additionnent. Des paliers communs donnent
     à tous ceux qui ont participé la même récompense.
     Sans compte en ligne, le raid se joue seul (mêmes paliers,
     ramenés à un joueur).
   · LES CLASSEMENTS DE LA SEMAINE : Poké-Poker, Brèche, Tour.
   · LES DÉFIS : un code porte une partie de Brèche (graine,
     départ, score). Un ami la rejoue exactement, et compare.

   Les tables et fonctions sont dans sql/schema.sql (sections 7 et 8).
   ============================================================ */

/* ---------- le raid ---------- */
const RAID_TRIES = 3;
/* paliers par joueur : avec N joueurs, il en faut N fois plus */
const RAID_TIERS = [
  {pp:1500,   n:"Palier 1", rw:{coins:3000, shards:20}},
  {pp:6000,   n:"Palier 2", rw:{shards:40, candy:6}},
  {pp:15000,  n:"Palier 3", rw:{coins:12000, cores:2}},
  {pp:30000,  n:"Palier 4", rw:{cores:3, card:1, candy:10}}
];
let RAID_NET = null;      /* {wk, total, players, top:[...], at} */
function raidWeek(){ return typeof evWeekKey === "function" ? evWeekKey() : "S0"; }
function raidBoss(){ return typeof evWeeklyLegend === "function" ? evWeeklyLegend() : 150; }
function raidState(){
  S.raid = S.raid || {};
  const R = S.raid, wk = raidWeek();
  if(R.wk !== wk) Object.assign(R, {wk, dmg:0, best:0, attacks:0, claimed:[], day:"", tries:0});
  if(R.day !== today()){ R.day = today(); R.tries = 0; }
  return R;
}
function raidOnline(){ return typeof Net !== "undefined" && Net.configured() && Net.signedIn() && RAID_NET && RAID_NET.wk === raidWeek(); }
function raidTotal(){ return raidOnline() ? Math.max(RAID_NET.total, raidState().dmg) : raidState().dmg; }
function raidPlayers(){ return raidOnline() ? Math.max(1, RAID_NET.players) : 1; }
function raidTierGoal(i){ return RAID_TIERS[i].pp * raidPlayers(); }
function raidTierReached(i){ return raidTotal() >= raidTierGoal(i); }
function raidLevel(){
  const ids = typeof teamIds === "function" ? teamIds() : S.team;
  const avg = ids.length ? ids.reduce((a, id)=>a + ((S.dex[id] && S.dex[id].lvl) || 5), 0) / ids.length : 10;
  return clamp(Math.round(avg), 10, 100);
}
async function raidRefresh(){
  if(typeof Net === "undefined" || !Net.configured()) return;
  const wk = raidWeek();
  try {
    const t = await Net.call(`/rest/v1/raid_totals?week=eq.${wk}&select=total,players`);
    const top = await Net.call(`/rest/v1/raid?week=eq.${wk}&select=user_id,name,dmg,attacks&order=dmg.desc&limit=20`);
    RAID_NET = {wk, total:(t && t[0] && +t[0].total) || 0, players:(t && t[0] && +t[0].players) || 0, top:top || [], at:Date.now()};
    if(currentScreen === "social") refresh();
  } catch(e){ RAID_NET = RAID_NET || null; }
}
ACTIONS.raidfight = () => {
  const R = raidState();
  if(R.tries >= RAID_TRIES){ toast("Plus d'attaque aujourd'hui : reviens demain", "", "clock"); return; }
  const ids = typeof teamIds === "function" ? teamIds() : S.team;
  if(!ids.length){ toast("Il faut une équipe", "bad", "cross"); return; }
  R.tries++; save();
  const id = raidBoss();
  const allies = teamFighters(ids, typeof allyBoost === "function" ? allyBoost() : 1);
  const boss = makeFighter(id, raidLevel(), {boost:1});
  /* il ne cherche pas à gagner : il encaisse. L'équipe doit tenir assez pour frapper longtemps */
  boss.atk = Math.round(boss.atk * 0.35); boss.spa = Math.round(boss.spa * 0.35);
  boss.maxHp = 2000000; boss.hp = boss.maxHp; boss.raid = true;
  createBattle(allies, [boss], {
    ai:true, title:"RAID DE LA SEMAINE", stage:"boss",
    intro:`<span class="gold-t">${esc(POKE[id].name)}</span> ne tombera pas aujourd'hui. Frappe aussi fort que tu peux.`,
    onEnd: () => raidEnd(boss)
  });
  go("battle", {mode:"raid"});
};
function raidEnd(boss){
  const R = raidState();
  const dmg = Math.max(0, Math.round(boss.maxHp - Math.max(0, boss.hp)));
  R.dmg += dmg; R.attacks++; R.best = Math.max(R.best || 0, dmg);
  S.stats.raidDmg = (S.stats.raidDmg || 0) + dmg;
  if(typeof teamCandyGain === "function") teamCandyGain(1);
  addXp(200 + Math.round(dmg / 5));
  save();
  if(typeof Net !== "undefined" && Net.signedIn())
    Net.call("/rest/v1/rpc/add_raid", {method:"POST", body:{p_week:raidWeek(), p_name:S.name || "Archiviste", p_dmg:Math.min(dmg, 400000)}}).then(()=>raidRefresh()).catch(()=>{});
  setTimeout(()=>{
    if(typeof moment === "function") moment({kind:"release", c:"#ff8a3d", spr:raidBoss(), kicker:"RAID DE LA SEMAINE",
      title:`${fmt(dmg)} dégâts`, sub:`Total ${raidPlayers() > 1 ? "de tous les joueurs" : "de la semaine"} : ${fmt(raidTotal())} · ${RAID_TRIES - R.tries} attaque(s) encore aujourd'hui`,
      then:()=>{ go("social"); }});
  }, 700);
}
ACTIONS.raidclaim = d => {
  const i = +d.i, R = raidState(), T = RAID_TIERS[i];
  if(!T || R.claimed.includes(i) || !raidTierReached(i) || !R.attacks) return;
  R.claimed.push(i);
  const rw = T.rw;
  if(rw.coins) gain("coins", rw.coins);
  if(rw.shards) gain("shards", rw.shards);
  if(rw.cores) gain("cores", rw.cores);
  if(rw.candy && typeof teamCandyGain === "function") teamCandyGain(rw.candy);
  let cardTxt = "", card = null;
  if(rw.card && typeof grantCardV === "function"){
    const s = rollCardSeries(raidBoss(), 2);
    if(typeof cardRevealExpect === "function") cardRevealExpect();
    card = {s, id:raidBoss(), fresh:grantCardV(s, raidBoss())};
    cardTxt = " · une carte de " + POKE[raidBoss()].name;
  }
  save();
  if(card && typeof cardReveal === "function" && cardReveal([card], {kicker:"RAID · " + T.n,
      intro:{spr:raidBoss(), title:"Récompense commune", text:"Tous les archivistes ont frappé ensemble. Le boss laisse une carte à chacun.", rewards:raidRwText(rw)}})) return;
  if(typeof banner === "function") banner({kicker:"RAID · " + T.n, title:"Récompense commune", sub:raidRwText(rw) + cardTxt, spr:raidBoss(), c:"#ff8a3d", sfx:"coin"});
  refresh();
};
function raidRwText(rw){
  return [rw.coins ? fmt(rw.coins) + " PokéCoins" : "", rw.shards ? rw.shards + " Fragments" : "", rw.cores ? rw.cores + " Noyaux" : "", rw.candy ? rw.candy + " Bonbons d'équipe" : "", rw.card ? "une carte du boss" : ""].filter(Boolean).join(" · ");
}

/* ---------- les classements de la semaine ---------- */
const WK_MODES = {poker:"Poké-Poker · meilleur verrou", breche:"Brèche · meilleur score", tower:"Tour · palier le plus haut"};
let WK_TAB = "raid", WK_NET = {};
function wkState(){
  S.wk = S.wk || {};
  if(S.wk.wk !== raidWeek()) S.wk = {wk:raidWeek(), poker:0, breche:0, tower:0};
  return S.wk;
}
function wkSubmit(mode, score){
  score = Math.round(score || 0);
  const W = wkState();
  if(!(score > (W[mode] || 0))) return false;
  W[mode] = score; saveSoon();
  if(typeof Net !== "undefined" && Net.signedIn())
    Net.call("/rest/v1/rpc/submit_weekly", {method:"POST", body:{p_week:raidWeek(), p_mode:mode, p_name:S.name || "Archiviste", p_score:score}}).catch(()=>{});
  return true;
}
async function wkLoad(mode){
  if(typeof Net === "undefined" || !Net.configured()) return;
  try {
    WK_NET[mode] = mode === "raid" ? (await raidRefresh(), RAID_NET && RAID_NET.top)
      : await Net.call(`/rest/v1/weekly_scores?week=eq.${raidWeek()}&mode=eq.${mode}&select=user_id,name,score&order=score.desc&limit=20`);
    if(currentScreen === "social") refresh();
  } catch(e){ WK_NET[mode] = {err:e.message}; if(currentScreen === "social") refresh(); }
}
ACTIONS.wktab = d => { WK_TAB = d.t; refresh(); wkLoad(d.t); };
/* les scores partent d'eux-mêmes */
if(typeof pkWinBlind === "function"){
  const _pw = pkWinBlind;
  pkWinBlind = function(){ const sc = S.poker ? S.poker.score : 0; const r = _pw.apply(this, arguments); wkSubmit("poker", sc); return r; };
}
if(typeof brShowResults === "function"){
  const _bs = brShowResults;
  brShowResults = function(R, o){
    try { wkSubmit("breche", brScore(R)); } catch(e){}
    try { chalOnEnd(R); } catch(e){}
    return _bs.apply(this, arguments);
  };
}
if(typeof sqFinish === "function"){
  const _sf2 = sqFinish;
  sqFinish = function(B){ const r = _sf2.apply(this, arguments); try { if(B && B.result && typeof sqBestStage === "function") wkSubmit("tower", sqBestStage()); } catch(e){} return r; };
}

/* ---------- les défis par code ---------- */
if(typeof brNewRun === "function"){
  const _bn = brNewRun;
  brNewRun = function(opts){ const R = _bn.apply(this, arguments); try { R.opts = {seed:R.seed, region:opts.region, hab:opts.hab, starter:opts.starter, mod:opts.mod || null}; R.challenge = opts.challenge || null; } catch(e){} return R; };
}
function chalEncode(o){ try { return "PCG1-" + btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, ""); } catch(e){ return ""; } }
function chalDecode(code){
  try {
    const raw = String(code || "").trim().replace(/^PCG1-/, "");
    const o = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if(!o || typeof o.seed !== "number" || !POKE[o.starter] || !regionDef(o.region)) return null;
    return o;
  } catch(e){ return null; }
}
function chalOnEnd(R){
  if(!R || !R.opts) return;
  const sc = brScore(R);
  S.chalLast = Object.assign({}, R.opts, {score:sc, name:S.name || "Archiviste"});
  if(R.challenge){
    const won = sc > R.challenge.score;
    S.stats.chalWins = (S.stats.chalWins || 0) + (won ? 1 : 0);
    setTimeout(()=>{ if(typeof banner === "function") banner({kicker:"DÉFI", title:won ? `Défi relevé : ${fmt(sc)} contre ${fmt(R.challenge.score)}` : `Raté de peu : ${fmt(sc)} contre ${fmt(R.challenge.score)}`, sub:`Le score de ${R.challenge.name}`, icon:won ? "trophy" : "cross", c:won ? "#5ce07a" : "#ff5470", dur:4200}); }, 1500);
  }
  saveSoon();
}
ACTIONS.chalcopy = () => {
  const c = S.chalLast; if(!c){ toast("Joue d'abord une partie de Brèche", "", "boss"); return; }
  const code = chalEncode(c);
  try { navigator.clipboard.writeText(code); toast("Code du défi copié", "warn", "check"); }
  catch(e){ sheet(`${sheetHead("Code du défi")}<textarea readonly style="width:100%;height:90px">${esc(code)}</textarea>`); }
};
ACTIONS.chalplay = () => {
  const el = document.getElementById("chal-code"), o = chalDecode(el && el.value);
  if(!o){ toast("Code de défi invalide", "bad", "cross"); return; }
  if(!S.dex[o.starter]){ toast(`Il faut avoir ${POKE[o.starter].name} au Pokédex pour ce défi`, "bad", "lock"); return; }
  if(typeof brStart !== "function"){ return; }
  go("breche");
  brStart(brNewRun({region:o.region, hab:o.hab, starter:o.starter, seed:o.seed, mod:o.mod, daily:false, guardian:null, challenge:{score:o.score, name:o.name}}));
};

/* ============================================================
   L'ÉCRAN
   ============================================================ */
SCREENS.social = {
  after(){ if(typeof Net !== "undefined" && Net.configured() && (!RAID_NET || Date.now() - RAID_NET.at > 60000)) raidRefresh(); wkLoad(WK_TAB); },
  html(){
    const R = raidState(), id = raidBoss(), on = typeof Net !== "undefined" && Net.configured() && Net.signedIn();
    const tot = raidTotal(), pl = raidPlayers();
    const last = RAID_TIERS[RAID_TIERS.length - 1], pctMax = raidTierGoal(RAID_TIERS.length - 1);
    const W = wkState();
    const board = (()=>{
      const rows = WK_NET[WK_TAB];
      const mine = WK_TAB === "raid" ? R.dmg : W[WK_TAB] || 0;
      const me = on ? Net.userId() : null;
      if(!on) return `<div class="empty">Ton meilleur score cette semaine : <b>${fmt(mine)}</b>.<br>Connecte-toi (Profil › En ligne) pour te mesurer aux autres.</div>`;
      if(!rows) return `<div class="empty">Chargement…</div>`;
      if(rows.err) return `<div class="empty">${esc(rows.err)}</div>`;
      if(!rows.length) return `<div class="empty">Personne encore cette semaine. À toi d'ouvrir le classement.</div>`;
      return rows.map((r, i)=>`<div class="wk-row ${r.user_id === me ? "me" : ""}"><span class="wk-rank">${i + 1}</span><b class="grow">${esc(r.name)}</b><span class="mono-num">${fmt(WK_TAB === "raid" ? r.dmg : r.score)}</span></div>`).join("");
    })();
    return `
      <div class="h">${ic("boss")} RAID ET CLASSEMENTS</div>
      <div class="rd-card">
        <div class="rd-top">
          <span class="rd-spr">${sprite(id, false, "")}</span>
          <div class="grow"><small>RAID DE LA SEMAINE</small><b>${esc(POKE[id].name)}</b>
            <em>${on ? `${pl} joueur${pl > 1 ? "s" : ""} · ${fmt(tot)} dégâts au total` : "Hors ligne : tu l'affrontes seul cette semaine"}</em></div>
        </div>
        <div class="rd-bar"><i style="width:${Math.min(100, tot / pctMax * 100).toFixed(1)}%"></i>
          ${RAID_TIERS.map((T, i)=>`<span class="rd-tick ${raidTierReached(i) ? "on" : ""}" style="left:${(raidTierGoal(i) / pctMax * 100).toFixed(1)}%"></span>`).join("")}</div>
        <div class="rd-tiers">${RAID_TIERS.map((T, i)=>{
          const ok = raidTierReached(i), got = R.claimed.includes(i);
          return `<div class="rd-tier ${ok ? "ok" : ""} ${got ? "got" : ""}">
            <b>${esc(T.n)}</b><small>${fmt(raidTierGoal(i))}</small><em>${esc(raidRwText(T.rw))}</em>
            ${ok && !got && R.attacks ? `<button class="btn xs gold" data-act="raidclaim" data-i="${i}">Prendre</button>` : got ? ic("check") : ""}</div>`; }).join("")}</div>
        <div class="row between" style="margin-top:9px">
          <span class="tiny">Tes dégâts : <b>${fmt(R.dmg)}</b> · meilleur coup ${fmt(R.best || 0)}</span>
          <button class="btn pri sm" data-act="raidfight" ${R.tries >= RAID_TRIES ? "disabled" : ""}>Attaquer · ${RAID_TRIES - R.tries}/${RAID_TRIES}</button>
        </div>
        <div class="tiny dim" style="margin-top:5px">Trois attaques par jour avec ton équipe. Les paliers se débloquent pour tous ceux qui ont attaqué au moins une fois.</div>
      </div>

      <div class="h sm" style="margin-top:14px">CLASSEMENTS DE LA SEMAINE</div>
      <div class="chipbar">${[["raid", "Raid"], ["poker", "Poker"], ["breche", "Brèche"], ["tower", "Tour"]].map(([k, n])=>`<button class="chip ${WK_TAB === k ? "on" : ""}" data-act="wktab" data-t="${k}">${n}</button>`).join("")}</div>
      <div class="tiny dim" style="margin:-2px 0 6px">${WK_TAB === "raid" ? "Dégâts cumulés cette semaine" : esc(WK_MODES[WK_TAB])}</div>
      <div class="wk-list">${board}</div>

      <div class="h sm" style="margin-top:14px">DÉFIER UN AMI</div>
      <div class="panel">
        <div class="tiny">Un code porte ta dernière partie de Brèche : même graine, même départ, ton score. Ton ami la rejoue exactement.</div>
        <button class="btn wide" style="margin-top:8px" data-act="chalcopy" ${S.chalLast ? "" : "disabled"}>${S.chalLast ? `Copier le code (score ${fmt(S.chalLast.score)})` : "Joue d'abord une partie de Brèche"}</button>
        <input id="chal-code" type="text" placeholder="Coller un code de défi (PCG1-…)" style="margin-top:9px">
        <button class="btn pri wide" style="margin-top:7px" data-act="chalplay">Relever le défi</button>
      </div>`;
  }
};
/* sur l'accueil : le raid de la semaine */
function raidCardHtml(){
  if(S.level < 10) return "";
  const R = raidState(), id = raidBoss();
  const claim = RAID_TIERS.some((T, i)=>raidTierReached(i) && !R.claimed.includes(i) && R.attacks);
  return `<div class="lg-card rd-home ${claim ? "on" : ""}" data-act="goto" data-to="social">
    <span class="lg-spr">${sprite(id, false, "")}</span>
    <div class="grow"><small>RAID DE LA SEMAINE</small><b>${esc(POKE[id].name)}</b>
      <em>${claim ? "Une récompense commune t'attend" : `${RAID_TRIES - R.tries} attaque(s) aujourd'hui · ${fmt(raidTotal())} dégâts au total`}</em></div>
    ${ic("arrow")}</div>`;
}
if(typeof NEXTSTEP_HOOKS !== "undefined") NEXTSTEP_HOOKS.push(()=>{
  if(S.level < 10) return null;
  const R = raidState();
  if(RAID_TIERS.some((T, i)=>raidTierReached(i) && !R.claimed.includes(i) && R.attacks)) return {p:72, t:"Raid : une récompense commune à prendre", go:"social", i:"boss"};
  if(R.tries < RAID_TRIES) return {p:25, t:`Raid de la semaine : ${RAID_TRIES - R.tries} attaque(s) aujourd'hui`, go:"social", i:"boss"};
  return null;
});
