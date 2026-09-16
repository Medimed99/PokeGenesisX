/* ============================================================
   78 — JALONS
   Trois horizons complementaires :
   · les PALIERS DE REGION recompensent la completion, tous les 25%
   · les CONTRATS donnent un objectif court qui tourne toutes les 6h
   · le BONUS DE PREMIERE VICTOIRE cree une routine par module
   ============================================================ */

/* ---------- paliers de complétion par secteur ---------- */
const REGION_TIERS = [
  {pct:25,  rw:{coins:2500,  shards:25,  balls:{super:10}},  t:"Le secteur redevient lisible par endroits."},
  {pct:50,  rw:{coins:7000,  shards:60,  cores:2},           t:"La moitié du secteur tient debout toute seule."},
  {pct:75,  rw:{coins:18000, shards:120, cores:4, balls:{hyper:10}}, t:"Il ne reste que des trous isolés."},
  {pct:100, rw:{coins:45000, shards:250, cores:10},          t:"Secteur intégralement restauré."}
];
const REGION_TIER_COS = {
  kanto: ["bg_kanto", null, null, "title_titulaire"],
  johto: ["bg_johto", null, null, null],
  hoenn: ["bg_hoenn", null, null, "title_index"]
};
function regionTiersDone(key){ return (S.regionTiers && S.regionTiers[key]) || []; }
function checkRegionTiers(){
  S.regionTiers = S.regionTiers || {};
  for(const r of REGIONS){
    if(!regionUnlocked(r.key)) continue;
    const pct = dexRegionPct(r.key);
    const done = S.regionTiers[r.key] = S.regionTiers[r.key] || [];
    for(let i=0;i<REGION_TIERS.length;i++){
      const t = REGION_TIERS[i];
      if(pct + 0.001 < t.pct || done.includes(t.pct)) continue;
      done.push(t.pct);
      grantReward(t.rw);
      const cos = (REGION_TIER_COS[r.key]||[])[i];
      if(cos) unlockCosmetic(cos);
      addIntegrity(t.pct === 100 ? 2 : 0.6);
      Sfx.win();
      save();
      showRegionTier(r, t, cos);
      return true;                     /* un seul palier a la fois, pour qu'il se voie */
    }
  }
  return false;
}
function showRegionTier(r, t, cos){
  const items = [];
  for(const k in t.rw){
    if(k === "balls") for(const b in t.rw.balls)
      items.push({icon:BALLS[b].icon, label:`${t.rw.balls[b]} ${BALLS[b].name}`, color:"var(--cyan)"});
    else items.push({icon: k==="cores"?"core":k==="shards"?"shard":"coin",
      label:`${fmt(t.rw[k])} ${CUR_NAME[k]}`, color: k==="cores"?"var(--violet)":"var(--amber)",
      big: k==="cores"});
  }
  if(cos) items.push({icon:"star", label:"Cosmétique : " + COSMETICS[cos].n, color:"var(--amber)", big:true});
  revealSheet(`${r.name.toUpperCase()} — ${t.pct}%`, items, {icon:"dex", sub:esc(t.t)});
  pzFlash(t.t);
}

/* ---------- contrats de secteur ---------- */
/* objectif court, renouvele toutes les six heures, ancre sur une region */
const CONTRACT_MS = 6 * 3600 * 1000;
const CONTRACTS = [
  {id:"c_type", n:"Archiver {n} Pokémon de type {x} à {r}", goal:[4,7,11],
   pick:r=>randInt(1,18),
   test:(id,d)=>POKE[id].types.includes(d.x) && regionOf(id) === d.r,
   label:d=>TYPE_NAMES[d.x]},
  {id:"c_rar",  n:"Capturer {n} Pokémon rares ou plus à {r}", goal:[3,5,8],
   pick:()=>2, test:(id,d)=>POKE[id].rar >= 2 && regionOf(id) === d.r, label:()=>"rare+"},
  {id:"c_bst",  n:"Capturer {n} Pokémon d'au moins {x} en statistiques à {r}", goal:[4,6,9],
   pick:()=>pick([380,430,480]),
   test:(id,d)=>POKE[id].bst >= d.x && regionOf(id) === d.r, label:d=>d.x+" total"},
  {id:"c_evo",  n:"Archiver {n} espèces évoluées à {r}", goal:[5,8,12],
   pick:()=>0, test:(id,d)=>stageOf(id) > 0 && regionOf(id) === d.r, label:()=>"évoluées"},
  {id:"c_new",  n:"Archiver {n} espèces inédites à {r}", goal:[3,5,7],
   pick:()=>0, test:(id,d)=>d.newOnly && regionOf(id) === d.r, label:()=>"inédites", newOnly:true}
];
function rollContract(){
  const tier = clamp(Math.floor(S.level/13), 0, 2);
  const regs = unlockedRegions();
  const r = pick(regs);
  const c = pick(CONTRACTS);
  const x = c.pick(r.key);
  S.contract = {
    id:c.id, r:r.key, x, goal:c.goal[tier], prog:0, claimed:false,
    until: Date.now() + CONTRACT_MS,
    n: c.n.replace("{n}", c.goal[tier]).replace("{x}", String(c.label({x})))
          .replace("{r}", r.name),
    rw: {shards: 18 + tier*14, coins: 900 + tier*900}
  };
  saveSoon();
}
function contractRollover(){
  if(!S.contract || S.contract.until <= Date.now()) rollContract();
}
/* appele a chaque capture reussie */
function contractTick(id, isNew){
  const C = S.contract;
  if(!C || C.claimed || C.prog >= C.goal) return;
  const def = CONTRACTS.find(x=>x.id === C.id);
  if(!def) return;
  const d = {x:C.x, r:C.r, newOnly:isNew};
  let ok = false;
  try { ok = def.test(id, d); } catch(e){ ok = false; }
  if(!ok) return;
  C.prog++;
  if(C.prog >= C.goal){ S.stats.contracts = (S.stats.contracts||0) + 1;
    toast("Contrat rempli : " + C.n, "warn", "trophy"); }
  saveSoon();
}
ACTIONS.claimcontract = () => {
  const C = S.contract;
  if(!C || C.claimed || C.prog < C.goal) return;
  C.claimed = true;
  grantReward(C.rw);
  Sfx.coin();
  toast("Contrat encaissé : " + rewardText(C.rw), "", "check");
  save(); refresh();
};
function contractCard(){
  contractRollover();
  const C = S.contract;
  const left = Math.max(0, C.until - Date.now());
  const ready = C.prog >= C.goal;
  return `<div class="panel bracket contract">
    <div class="row between">
      <div class="h sm" style="margin:0">CONTRAT DE SECTEUR ${infoBtn("contract")}</div>
      <span class="tiny dim">${C.claimed ? "encaissé" : fmtTime(left)}</span>
    </div>
    <div class="tiny" style="margin:4px 0 6px">${esc(C.n)}</div>
    <div class="bar thin"><i style="width:${Math.min(100, C.prog/C.goal*100)}%"></i></div>
    <div class="row between" style="margin-top:6px">
      <span class="tiny dim mono-num">${C.prog} / ${C.goal} · ${esc(rewardText(C.rw))}</span>
      <button class="btn xs ${ready&&!C.claimed?"gold":""}" data-act="claimcontract"
        ${ready&&!C.claimed?"":"disabled"}>${C.claimed?"Pris":"Encaisser"}</button>
    </div>
  </div>`;
}

/* ---------- carte d'objectifs unifiée ----------
   Directive et contrat partageaient deux panneaux : ils disent la meme chose
   au joueur — « voici quoi faire maintenant ». Un seul bloc, deux lignes. */
function objectivesCard(){
  contractRollover();
  const d = currentDirective();
  const C = S.contract;
  const cReady = C.prog >= C.goal && !C.claimed;
  const row = (label, title, cur, goal, accent, extra) => `
    <div class="objrow">
      <div class="objlab ${accent}">${label}</div>
      <div class="grow">
        <div class="objtitle">${title}</div>
        <div class="bar thin" style="margin-top:4px"><i class="${accent}"
          style="width:${Math.min(100, cur/goal*100)}%"></i></div>
      </div>
      <div class="objside">${extra}</div>
    </div>`;

  const dPart = d
    ? row("DIRECTIVE", esc(d.n), d.goal()[0], d.goal()[1], "cy",
        d.go ? `<button class="btn xs" data-act="goto" data-to="${d.go}">Aller</button>`
             : `<span class="tiny dim mono-num">${fmt(Math.min(d.goal()[0], d.goal()[1]))}/${fmt(d.goal()[1])}</span>`)
    : `<div class="objrow"><div class="objlab cy">DIRECTIVE</div>
        <div class="grow objtitle muted">Toutes accomplies. La suite vous appartient.</div></div>`;

  const cPart = row("CONTRAT", esc(C.n), C.prog, C.goal, "vi",
      C.claimed ? `<span class="tiny dim">pris</span>`
      : cReady  ? `<button class="btn xs gold" data-act="claimcontract">Prendre</button>`
                : `<span class="tiny dim">${fmtTime(Math.max(0, C.until - Date.now()))}</span>`);

  return `<div class="panel bracket objectives">
    <div class="row between" style="margin-bottom:6px">
      <div class="h sm" style="margin:0">OBJECTIFS ${infoBtn("contract")}</div>
      <span class="tiny dim">${(S.dirDone||[]).length}/${DIRECTIVES.length} directives</span>
    </div>
    ${dPart}
    <hr class="sep" style="margin:7px 0">
    ${cPart}
    ${d && d.hint ? `<div class="tiny muted" style="margin-top:6px">${esc(d.hint)}</div>` : ""}
  </div>`;
}

/* ---------- bonus de première victoire quotidienne ---------- */
const FIRST_WIN = {
  expedition:{n:"Expédition", mult:2},
  poker:     {n:"Poké-Poker", mult:2},
  boss:      {n:"Data Guardian", mult:2},
  fishing:   {n:"Sonde", mult:2}
};
function firstWinAvailable(k){
  S.daily.firstWin = S.daily.firstWin || {};
  return !S.daily.firstWin[k];
}
/* renvoie le multiplicateur et consomme le bonus */
function consumeFirstWin(k){
  if(!firstWinAvailable(k)) return 1;
  S.daily.firstWin[k] = true;
  const m = FIRST_WIN[k].mult;
  toast(`Première ${FIRST_WIN[k].n} du jour — récompenses ×${m}`, "warn", "star");
  Sfx.win();
  saveSoon();
  return m;
}
function firstWinBadge(k){
  return firstWinAvailable(k) ? `<span class="fwbadge">×2 aujourd'hui</span>` : "";
}

/* point d'entree unique, appele depuis guideTick */
function milestoneTick(){
  contractRollover();
  return checkRegionTiers();
}
