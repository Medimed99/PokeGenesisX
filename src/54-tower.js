/* ============================================================
   54 — TOUR DE DONNÉES
   L'expédition a un plafond : au-delà d'un certain niveau d'équipe,
   elle se boucle à tous les coups. La Tour n'en a pas. Elle monte
   indéfiniment, et le seul score qui compte est l'étage atteint.

   Deux systèmes lui sont propres :
   · les TRAITS DE TYPE, qui récompensent une équipe cohérente
     plutôt qu'une équipe simplement forte ;
   · les RENFORTS, points de statistiques permanents attribués à une
     lignée d'évolution entière, qui traversent les parcours.
   ============================================================ */

const TOWER_TRAITS = {
  10:{n:"Combustion",  d:"+8% de dégâts par palier."},
  11:{n:"Ruissellement",d:"+7% de PV maximum par palier."},
  12:{n:"Photosynthèse",d:"Rend 4% des PV en fin de tour par palier."},
  13:{n:"Décharge",    d:"+9% de Vitesse par palier."},
  14:{n:"Résonance",   d:"+8% de dégâts spéciaux par palier."},
  15:{n:"Engelure",    d:"+6% de chances d'infliger une altération par palier."},
  16:{n:"Ascendance",  d:"+6% de dégâts et +4% de Défense par palier."},
  17:{n:"Angle mort",  d:"+5% de taux critique par palier."},
  9: {n:"Blindage",    d:"+10% de Défense par palier."},
  6: {n:"Assise",      d:"+9% de Défense Spéciale par palier."},
  2: {n:"Percussion",  d:"+10% de dégâts physiques par palier."},
  8: {n:"Estompe",     d:"+7% de chances d'esquiver par palier."}
};
/* un trait monte d'un palier tous les deux Pokemon du type dans l'equipe */
function traitLevels(team){
  const count = {};
  for(const m of team){
    if(!m || m.hp <= 0) continue;
    for(const t of POKE[m.id].types) count[t] = (count[t] || 0) + 1;
  }
  const out = {};
  for(const t in count){
    if(!TOWER_TRAITS[t]) continue;
    const lv = Math.floor(count[t] / 2);
    if(lv > 0) out[t] = Math.min(3, lv);
  }
  return out;
}
function traitBonus(traits, key){
  let v = 0;
  const map = {
    dmg:   [[10,.08],[16,.06],[2,.10]],
    hp:    [[11,.07]],
    regen: [[12,.04]],
    spe:   [[13,.09]],
    spa:   [[14,.08]],
    def:   [[9,.10],[16,.04]],
    spd:   [[6,.09]],
    crit:  [[17,.05]],
    dodge: [[8,.07]],
    status:[[15,.06]]
  };
  for(const [t, per] of (map[key] || []))
    if(traits[t]) v += per * traits[t];
  return v;
}

/* ---------- renforts permanents, par lignée d'évolution ---------- */
const BUFF_STATS = [
  {k:"hp",  n:"PV"},        {k:"atk", n:"Attaque"},
  {k:"def", n:"Défense"},   {k:"spa", n:"Att. Spé."},
  {k:"spd", n:"Déf. Spé."}, {k:"spe", n:"Vitesse"}
];
function lineRoot(id){
  /* remonte la chaine d'evolution : le renfort profite a toute la lignee */
  let cur = id, guard = 0;
  while(guard++ < 6){
    const prev = POKE_IDS.find(i=>POKE[i].evo && POKE[i].evo.some(e=>e.to === cur));
    if(!prev) break;
    cur = prev;
  }
  return cur;
}
function buffOf(id, stat){
  const b = S.tower && S.tower.buffs && S.tower.buffs[lineRoot(id)];
  return (b && b[stat]) || 0;
}
function applyTowerBuffs(id, f){
  for(const s of BUFF_STATS){
    const n = buffOf(id, s.k);
    if(!n) continue;
    const mul = 1 + n * 0.04;                 /* 4% par point, cumulatif */
    if(s.k === "hp"){ f.maxHp = Math.round(f.maxHp * mul); f.hp = f.maxHp; }
    else f[s.k] = Math.round(f[s.k] * mul);
  }
}

/* ============================================================
   PARCOURS
   ============================================================ */
function towerState(){
  S.tower = S.tower || {buffs:{}, best:0, runs:0, points:0};
  return S.tower;
}
function towerLevel(stage){ return clamp(8 + Math.round(stage * 3.4), 5, 100); }
function towerBand(stage){
  const lo = 200 + stage * 26, hi = 320 + stage * 30;
  return [Math.min(lo, 520), Math.min(hi, 999)];
}
function towerWildId(stage){
  const [lo, hi] = towerBand(stage);
  const pool = [];
  for(let i = 1; i <= 386; i++){
    const p = POKE[i];
    if(!p || p.leg || isExclusive(i)) continue;
    if(p.bst < lo || p.bst > hi) continue;
    pool.push(i);
  }
  return pool.length ? pick(pool) : randInt(1, 386);
}

function startTower(ids){
  const T = towerState();
  S.towerRun = {
    stage: 1, step: 0, ended: false,
    team: ids.map(id=>{
      const f = makeFighter(id, towerLevel(1), {shiny: S.dex[id]?.shiny});
      applyTowerBuffs(id, f);
      return {id, level: towerLevel(1), hp:f.maxHp, maxHp:f.maxHp, item:null};
    }),
    pick: null
  };
  T.runs++;
  save();
  go("tower");
}
function towerFighter(m){
  const f = makeFighter(m.id, m.level, {shiny: S.dex[m.id]?.shiny});
  applyTowerBuffs(m.id, f);
  applyExpItem(m, f);
  /* traits de type : calcules sur l'equipe vivante, appliques a chacun */
  const tr = traitLevels(S.towerRun.team);
  f.maxHp = Math.round(f.maxHp * (1 + traitBonus(tr, "hp")));
  f.atk   = Math.round(f.atk   * (1 + traitBonus(tr, "dmg")));
  f.spa   = Math.round(f.spa   * (1 + traitBonus(tr, "spa") + traitBonus(tr, "dmg")));
  f.def   = Math.round(f.def   * (1 + traitBonus(tr, "def")));
  f.spd   = Math.round(f.spd   * (1 + traitBonus(tr, "spd")));
  f.spe   = Math.round(f.spe   * (1 + traitBonus(tr, "spe")));
  f.maxHp = Math.max(1, f.maxHp);
  f.hp = clamp(m.hp, 0, f.maxHp);
  f.ref = m;
  return f;
}

const TOWER_STEPS = 4;          /* trois combats puis un gardien d'etage */
function towerFight(){
  const R = S.towerRun;
  const boss = R.step === TOWER_STEPS - 1;
  const allies = R.team.filter(m=>m.hp > 0).map(towerFighter);
  if(!allies.length){ endTower(); return; }
  const n = boss ? 2 : (R.stage > 4 ? 2 : 1);
  const foes = [];
  for(let i=0;i<n;i++)
    foes.push(makeFighter(towerWildId(R.stage + (boss ? 2 : 0)),
      towerLevel(R.stage) + (boss ? 2 : 0),
      {boost: boss ? 1.16 : 1.03}));
  createBattle(allies, foes, {
    ai: true, speed: S.settings.battleSpeed || 1,
    title: boss ? `ÉTAGE ${R.stage} — GARDIEN` : `ÉTAGE ${R.stage} — ${R.step + 1}/${TOWER_STEPS - 1}`,
    onEnd: win => {
      for(const f of allies) if(f.ref) f.ref.hp = Math.max(0, f.hp);
      if(!win){ endTower(); return; }
      /* recuperation legere entre deux combats d'etage */
      for(const m of R.team) if(m.hp > 0) m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp * 0.18));
      R.step++;
      if(R.step >= TOWER_STEPS){ towerStageCleared(); return; }
      save(); go("tower");
    }
  });
  go("battle");
}

function towerStageCleared(){
  const R = S.towerRun, T = towerState();
  R.step = 0;
  R.stage++;
  T.best = Math.max(T.best, R.stage - 1);
  T.points++;
  /* les survivants montent, et on propose un choix */
  for(const m of R.team){
    if(m.hp <= 0) continue;
    m.level = towerLevel(R.stage);
    const f = makeFighter(m.id, m.level, {shiny: S.dex[m.id]?.shiny});
    applyTowerBuffs(m.id, f);
    m.maxHp = f.maxHp;
    m.hp = Math.min(m.maxHp, Math.round(m.maxHp * 0.6));
  }
  R.pick = towerOffers(R);
  save();
  go("tower");
}
/* trois offres a chaque etage : renforcer, elargir, ou equiper */
function towerOffers(R){
  const offers = [];
  offers.push({k:"buff"});
  if(R.team.length < 6) offers.push({k:"recruit", id: towerWildId(R.stage)});
  else offers.push({k:"swap", id: towerWildId(R.stage + 1)});
  offers.push({k:"item", id: pick(rollExpItem(Math.min(11, R.stage), 1))});
  offers.push({k:"heal"});
  return shuffle(offers).slice(0, 3);
}

function endTower(){
  const R = S.towerRun, T = towerState();
  if(!R || R.ended) return;
  R.ended = true;
  const reached = R.stage - (R.step > 0 ? 0 : 1);
  const shards = 30 + reached * 14;
  const coins  = 400 + reached * 180;
  gain("shards", shards); gain("coins", coins);
  addXp(200 + reached * 60);
  if(reached >= 5) gain("cores", Math.floor(reached / 5));
  S.stats.towerBest = Math.max(S.stats.towerBest || 0, reached);
  S.towerRun = null;
  save(); checkAchievements();
  sheet(`<div class="center">
    <div class="h" style="justify-content:center;color:var(--violet)">TOUR — ÉTAGE ${reached}</div>
    <div class="tiny muted" style="margin:8px 0 11px">La Tour ne se termine pas. Elle se mesure.</div>
    <div class="tiles">
      <div class="tile accent"><div class="k">Étage atteint</div><div class="v">${reached}</div></div>
      <div class="tile gold"><div class="k">Record</div><div class="v">${T.best}</div></div>
      <div class="tile"><div class="k">Fragments</div><div class="v">+${shards}</div></div>
      <div class="tile"><div class="k">PokéCoins</div><div class="v">+${fmt(coins)}</div></div>
    </div>
    <div class="tiny cy" style="margin-top:10px">${T.points} renfort(s) à attribuer</div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandgo" data-to="tower">Retour à la Tour</button>
  </div>`);
}
ACTIONS.closeandgo = d => { closeSheet(); go(d.to); };

/* ============================================================
   ÉCRAN
   ============================================================ */
SCREENS.tower = {
  html(){
    const T = towerState();
    const R = S.towerRun;
    if(!R) return this.lobby(T);
    if(R.pick) return this.offers(R);
    return this.run(R, T);
  },

  lobby(T){
    const owned = ownedSorted();
    return `
      <div class="h">${ic("boss")} TOUR DE DONNÉES ${infoBtn("tower")}</div>
      <div class="sub">Des étages sans fin. Le seul score est celui qu'on atteint.</div>
      ${moduleGoal("Trois Pokémon au départ, quatre combats par étage, aucun plafond. Les types partagés dans l'équipe font monter des traits qui la renforcent.",
        "Des renforts permanents attribués à une lignée entière, et votre meilleur étage au classement.")}
      <div class="tiles">
        <div class="tile gold"><div class="k">Meilleur étage</div><div class="v">${T.best}</div></div>
        <div class="tile accent"><div class="k">Renforts</div><div class="v">${T.points}</div></div>
        <div class="tile"><div class="k">Ascensions</div><div class="v">${T.runs}</div></div>
      </div>
      ${T.points ? `<button class="btn wide" data-act="towerbuffs">
        ${ic("star")} Attribuer ${T.points} renfort(s)</button>` : ""}
      <button class="btn pri wide" style="margin-top:8px" data-act="towerpick"
        ${owned.length >= 3 ? "" : "disabled"}>
        ${owned.length >= 3 ? "Composer l'équipe et monter" : "Trois Pokémon archivés requis"}</button>

      <div class="h sm" style="margin-top:12px">TRAITS DE TYPE</div>
      <div class="tiny muted" style="margin-bottom:7px">Deux Pokémon d'un même type dans l'équipe
        font monter son trait d'un palier, jusqu'à trois.</div>
      <div class="list">
        ${Object.entries(TOWER_TRAITS).map(([t,tr])=>`
          <div class="traitrow">
            <span class="tt t${t}">${TYPE_NAMES[t]}</span>
            <div class="grow"><div class="tiny">${esc(tr.n)}</div>
              <div class="tiny muted">${esc(tr.d)}</div></div>
          </div>`).join("")}
      </div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="expedition">Retour à l'expédition</button>`;
  },

  run(R, T){
    const tr = traitLevels(R.team);
    return `
      <div class="row between">
        <div class="h" style="margin:0">ÉTAGE ${R.stage}</div>
        <span class="pill">${ic("boss")} ${R.step}/${TOWER_STEPS}</span>
      </div>
      <div class="bar" style="margin-bottom:10px"><i style="width:${R.step/TOWER_STEPS*100}%"></i></div>

      ${Object.keys(tr).length ? `<div class="panel tight">
        <div class="h sm">TRAITS ACTIFS</div>
        <div class="wrap">
          ${Object.entries(tr).map(([t,lv])=>`<span class="traitchip">
            <span class="tt t${t}">${TYPE_NAMES[t]}</span>
            ${esc(TOWER_TRAITS[t].n)} <b>${"◆".repeat(lv)}</b></span>`).join("")}
        </div>
      </div>` : `<div class="panel tight"><div class="tiny muted">Aucun trait actif :
        il faut deux Pokémon d'un même type dans l'équipe.</div></div>`}

      <div class="team-strip">${R.team.map(m=>{
        const pct = Math.max(0, m.hp/m.maxHp*100);
        const it = itemOf(m);
        return `<div class="tmem ${m.hp<=0?"ko":""}">
          <span class="lv">${m.level}</span>
          <span class="sprbox" style="width:40px;height:40px">${sprite(m.id, S.dex[m.id]?.shiny, "")}</span>
          <div class="nm">${esc(POKE[m.id].name)}</div>
          <div class="bar hp ${pct>50?"":pct>20?"mid":"low"}"><i style="width:${pct}%"></i></div>
          ${it?`<span class="tiny vi">${esc(it.n.split(" ")[0])}</span>`:""}
        </div>`;}).join("")}</div>

      <button class="throwbtn" style="margin-top:11px" data-act="towerfight">
        ${R.step === TOWER_STEPS-1 ? "AFFRONTER LE GARDIEN" : "COMBAT SUIVANT"}</button>
      <div class="btn-grid c2" style="margin-top:8px">
        <button class="btn sm" data-act="expgear">${ic("box")} Objets</button>
        <button class="btn sm dan" data-act="towerquit">Redescendre</button>
      </div>`;
  },

  offers(R){
    return `
      <div class="h">${ic("star")} ÉTAGE ${R.stage-1} FRANCHI</div>
      <div class="sub">Une seule de ces trois options. Les survivants sont montés au niveau ${towerLevel(R.stage)}.</div>
      <div class="draftrow">
        ${R.pick.map((o,i)=>{
          if(o.k === "buff") return `<div class="draftcard ir2" data-act="towertake" data-i="${i}">
            <div class="ic">${ic("star")}</div><div class="dc-n">Renfort</div>
            <div class="dc-s" style="white-space:normal">Un point de statistique permanent, pour toute une lignée.</div></div>`;
          if(o.k === "heal") return `<div class="draftcard ir1" data-act="towertake" data-i="${i}">
            <div class="ic">${ic("heart")}</div><div class="dc-n">Réparation</div>
            <div class="dc-s" style="white-space:normal">L'équipe entière revient à pleins PV. Les tombés reviennent à moitié.</div></div>`;
          if(o.k === "item"){ const it = EXP_ITEMS[o.id];
            return `<div class="draftcard ir${it.rar}" data-act="towertake" data-i="${i}">
              <span class="sprbox" style="width:48px;height:48px">${sprite(it.spr,false,"")}</span>
              <div class="dc-n">${esc(it.n)}</div>
              <div class="dc-s" style="white-space:normal;font-size:8.5px">${esc(it.d)}</div></div>`; }
          const p = POKE[o.id];
          return `<div class="draftcard" data-act="towertake" data-i="${i}">
            <span class="sprbox" style="width:52px;height:52px">${sprite(o.id,false,"")}</span>
            <div class="dc-n">${esc(p.name)}</div>
            <div class="wrap" style="justify-content:center;gap:2px">${typeTags(p.types)}</div>
            <div class="dc-s">${o.k === "swap" ? "remplace un membre" : "rejoint l'équipe"}</div></div>`;
        }).join("")}
      </div>`;
  }
};

ACTIONS.towerpick = () => {
  teamPicker("Équipe de la Tour (3)", 3, ids=>{ if(ids.length) startTower(ids); });
};
ACTIONS.towerfight = () => towerFight();
ACTIONS.towerquit = () => {
  sheet(`${sheetHead("Redescendre ?")}
    <div class="tiny muted">Vous conservez les récompenses de l'étage atteint. L'ascension s'arrête ici.</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn ghost" data-act="closesheet">Continuer</button>
      <button class="btn dan" data-act="towerquit2">Redescendre</button>
    </div>`, true);
};
ACTIONS.towerquit2 = () => { closeSheet(); endTower(); };

ACTIONS.towertake = d => {
  const R = S.towerRun, T = towerState();
  const o = R.pick[+d.i];
  R.pick = null;
  if(o.k === "buff"){ T.points++; toast("Renfort supplémentaire à attribuer", "warn", "star"); }
  else if(o.k === "heal"){
    for(const m of R.team) m.hp = m.hp > 0 ? m.maxHp : Math.floor(m.maxHp * 0.5);
    toast("Équipe réparée", "", "heart");
  }
  else if(o.k === "item"){
    save();
    ACTIONS.expitempickTower = null;
    towerGiveItem(o.id);
    return;
  }
  else if(o.k === "recruit"){
    const f = makeFighter(o.id, towerLevel(R.stage), {});
    applyTowerBuffs(o.id, f);
    R.team.push({id:o.id, level:towerLevel(R.stage), hp:f.maxHp, maxHp:f.maxHp, item:null});
    toast(POKE[o.id].name + " rejoint l'ascension", "", "check");
  }
  else if(o.k === "swap"){ towerSwap(o.id); return; }
  save(); go("tower");
};
function towerGiveItem(id){
  const R = S.towerRun, it = EXP_ITEMS[id];
  sheet(`${sheetHead("Qui porte " + it.n + " ?")}
    <div class="tiny muted" style="margin-bottom:9px">${esc(it.d)}</div>
    <div class="tp-sel">
      ${R.team.map((m,i)=>{
        const cur = itemOf(m);
        return `<div class="tp-row">
          <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, S.dex[m.id]?.shiny, "")}</span>
          <div class="grow"><div class="tiny">${esc(POKE[m.id].name)} <span class="dim">N.${m.level}</span></div>
            <div class="tiny ${cur?"vi":"dim"}">${cur?esc(cur.n):"aucun objet"}</div></div>
          <button class="btn xs pri" data-act="towergive" data-i="${i}" data-id="${id}">Donner</button>
        </div>`;}).join("")}
    </div>`);
}
ACTIONS.towergive = d => {
  const R = S.towerRun;
  R.team[+d.i].item = d.id;
  save(); closeSheet(); go("tower");
};
function towerSwap(id){
  const R = S.towerRun;
  sheet(`${sheetHead("Remplacer qui ?")}
    <div class="tiny muted" style="margin-bottom:9px">Par <b>${esc(POKE[id].name)}</b>,
      au niveau ${towerLevel(R.stage)}.</div>
    <div class="tp-sel">
      ${R.team.map((m,i)=>`<div class="tp-row">
        <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, S.dex[m.id]?.shiny, "")}</span>
        <div class="grow"><div class="tiny">${esc(POKE[m.id].name)} <span class="dim">N.${m.level}</span></div></div>
        <button class="btn xs" data-act="towerswapdo" data-i="${i}" data-id="${id}">Remplacer</button>
      </div>`).join("")}
      </div>
    <button class="btn ghost wide" style="margin-top:10px" data-act="towerskip">Ne rien changer</button>`);
}
ACTIONS.towerskip = () => { closeSheet(); save(); go("tower"); };
ACTIONS.towerswapdo = d => {
  const R = S.towerRun, id = +d.id;
  const f = makeFighter(id, towerLevel(R.stage), {});
  applyTowerBuffs(id, f);
  R.team[+d.i] = {id, level:towerLevel(R.stage), hp:f.maxHp, maxHp:f.maxHp, item:null};
  save(); closeSheet(); go("tower");
};

/* ---------- attribution des renforts ---------- */
ACTIONS.towerbuffs = () => {
  const T = towerState();
  const lines = [...new Set(ownedSorted().map(lineRoot))].slice(0, 40);
  sheet(`${sheetHead(`Renforts — ${T.points} disponible(s)`)}
    <div class="tiny muted" style="margin-bottom:9px">Un point donne +4% sur une statistique,
      et il profite à <b>toute la lignée d'évolution</b>. L'effet est permanent et traverse
      les ascensions.</div>
    ${T.points ? `<div class="list">
      ${lines.map(id=>{
        const b = (T.buffs[id] || {});
        const tot = Object.values(b).reduce((a,c)=>a+c, 0);
        return `<div class="item" data-act="towerbuffline" data-id="${id}">
          <span class="sprbox" style="width:36px;height:36px">${sprite(id,false,"")}</span>
          <div class="grow"><div class="t">${esc(POKE[id].name)}</div>
            <div class="d">${tot ? BUFF_STATS.filter(s=>b[s.k]).map(s=>`${s.n} +${b[s.k]*4}%`).join(" · ") : "aucun renfort"}</div></div>
          ${ic("arrow")}
        </div>`;}).join("")}
    </div>` : `<div class="empty">Aucun renfort disponible. Franchissez un étage pour en gagner.</div>`}`);
};
ACTIONS.towerbuffline = d => {
  const T = towerState(), id = +d.id;
  const b = T.buffs[id] || {};
  sheet(`${sheetHead(POKE[id].name)}
    <div class="tiny muted" style="margin-bottom:9px">Le renfort profitera aussi à ses évolutions.</div>
    <div class="list">
      ${BUFF_STATS.map(s=>`<div class="item" data-act="towerbuffdo" data-id="${id}" data-s="${s.k}">
        <div class="grow"><div class="t">${s.n}</div>
          <div class="d">${(b[s.k]||0) ? `actuellement +${(b[s.k])*4}%` : "aucun renfort"}</div></div>
        <span class="tiny cy">+4%</span>
      </div>`).join("")}
    </div>`);
};
ACTIONS.towerbuffdo = d => {
  const T = towerState();
  if(T.points <= 0){ toast("Aucun renfort disponible", "bad", "cross"); return; }
  T.points--;
  T.buffs[+d.id] = T.buffs[+d.id] || {};
  T.buffs[+d.id][d.s] = (T.buffs[+d.id][d.s] || 0) + 1;
  Sfx.win();
  toast(`${POKE[+d.id].name} : ${BUFF_STATS.find(s=>s.k===d.s).n} renforcée`, "warn", "star");
  save(); closeSheet(); refresh();
};
