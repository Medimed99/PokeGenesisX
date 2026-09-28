/* ============================================================
   75 — COMPAGNON, HEBDOMADAIRES, RÉVÉLATIONS
   ============================================================ */

/* ============================================================
   COMPAGNON
   Un Pokemon vous suit. Il gagne de l'affinite a chaque capture,
   ce qui lui fait gagner des niveaux permanents (donc utiles en
   combat) et lui fait trouver des objets. Son palier donne un
   bonus passif modeste sur les gains et le taux de capture.
   ============================================================ */

const BUDDY_TIER_AFF = 60;          /* affinite par palier */
const BUDDY_MAX_TIER = 12;

function buddy(){ return S.buddy && S.dex[S.buddy.id] ? S.buddy : null; }
function buddyTier(){
  const b = buddy();
  if(!b) return 0;
  return clamp(Math.floor(b.aff / BUDDY_TIER_AFF), 0, BUDDY_MAX_TIER);
}
function buddyBonus(){
  const t = buddyTier();
  return {coin: 1 + t*0.025, catch: 1 + t*0.012, xp: 1 + t*0.02};
}
function buddyNextAff(){
  const b = buddy(); if(!b) return 0;
  const t = buddyTier();
  if(t >= BUDDY_MAX_TIER) return 0;
  return (t+1)*BUDDY_TIER_AFF - b.aff;
}
function setBuddy(id){
  if(id === 25) S.flags.pikaBuddy = true;
  if(!S.dex[id]) return;
  S.buddy = {id, aff:0, since:Date.now(), finds:0};
  toast(POKE[id].name + " vous accompagne", "", "heart");
  setTimeout(()=>tutoMaybe("buddy"), 600);
  pzFlash("Il te suivra. Je ne sais pas pourquoi ils font ça.");
  save();
}

/* objets que le compagnon rapporte en chemin */
const BUDDY_FINDS = [
  {w:30, rw:()=>({coins: randInt(60, 240)})},
  {w:22, rw:()=>({balls:{poke: randInt(2,5)}})},
  {w:14, rw:()=>({balls:{super: randInt(1,3)}})},
  {w:12, rw:()=>({berries:{framby: 1}})},
  {w:9,  rw:()=>({shards: randInt(2,6)})},
  {w:6,  rw:()=>({berries:{nanab: 1}})},
  {w:4,  rw:()=>({balls:{hyper: 1}})},
  {w:2,  rw:()=>({berries:{micle: 1}})},
  {w:1,  rw:()=>({cores: 1})}
];
/* valeur approximative d'une trouvaille, pour chiffrer l'apport du compagnon */
function findWorth(rw){
  let v = rw.coins || 0;
  v += (rw.shards || 0) * 120;
  v += (rw.cores  || 0) * 3000;
  for(const b in (rw.balls||{}))   v += BALLS[b].price * rw.balls[b] * (BALLS[b].cur === "coins" ? 1 : 120);
  for(const b in (rw.berries||{})) v += BERRIES[b].price * rw.berries[b] * (BERRIES[b].cur === "coins" ? 1 : 120);
  return Math.round(v);
}
function rollBuddyFind(){
  const tot = BUDDY_FINDS.reduce((a,b)=>a+b.w, 0);
  let x = rng()*tot;
  for(const f of BUDDY_FINDS){ x -= f.w; if(x <= 0) return f.rw(); }
  return {coins: 100};
}

/* appele apres chaque capture reussie */
function buddyTick(rar){
  const b = buddy();
  if(!b) return;
  const before = buddyTier();
  b.aff += (1 + Math.floor(rar/2)) * (heldActive("aff") ? 2 : 1);
  const after = buddyTier();

  if(after > before){
    const e = S.dex[b.id];
    const gained = Math.min(2, BUDDY_MAX_TIER - before);
    e.lvl = Math.min(100, e.lvl + gained);
    Sfx.win();
    toast(`${POKE[b.id].name} progresse — niveau ${e.lvl}`, "warn", "heart");
  }
  /* trouvailles : rares mais regulieres */
  if(rng() < 0.035 + buddyTier()*0.004){
    const rw = rollBuddyFind();
    grantReward(rw);
    b.finds = (b.finds||0) + 1;
    /* journal : sans trace, la valeur du compagnon reste invisible */
    b.log = b.log || [];
    b.log.unshift({t: rewardText(rw), at: Date.now()});
    if(b.log.length > 30) b.log.length = 30;
    b.worth = (b.worth||0) + findWorth(rw);
    Sfx.coin();
    toast(`${POKE[b.id].name} a trouvé ${rewardText(rw)}`, "", "seed");
  }
  saveSoon();
}

function buddyStrip(){
  const b = buddy();
  if(!b){
    return `<div class="panel tight buddy-empty" data-act="buddypick">
      <div class="row">
        <div class="buddy-slot">${ic("heart")}</div>
        <div class="grow"><div class="tiny">Aucun compagnon</div>
          <div class="tiny dim">Choisissez un Pokémon : il gagnera des niveaux et trouvera des objets.</div></div>
        ${ic("arrow")}
      </div></div>`;
  }
  const t = buddyTier(), nx = buddyNextAff();
  const pct = t >= BUDDY_MAX_TIER ? 100 : ((b.aff % BUDDY_TIER_AFF) / BUDDY_TIER_AFF * 100);
  const bo = buddyBonus();
  return `<div class="panel tight buddy" data-act="buddyinfo">
    <div class="row">
      <span class="sprbox buddy-av" style="width:46px;height:46px">
        ${sprite(b.id, S.dex[b.id].shiny, "alive", {anim:true})}</span>
      <div class="grow">
        <div class="row between">
          <span style="font-size:11.5px">${esc(POKE[b.id].name)}</span>
          <span class="tiny cy">Affinité ${t}/${BUDDY_MAX_TIER}</span>
        </div>
        <div class="bar thin" style="margin:4px 0 3px"><i style="width:${pct}%"></i></div>
        <div class="tiny dim">Niv.${S.dex[b.id].lvl} · +${Math.round((bo.coin-1)*100)}% PokéCoins
          · +${Math.round((bo.catch-1)*100)}% capture${nx?` · ${nx} avant le palier`:" · palier maximum"}</div>
      </div>
    </div>
    ${(()=>{ const e = heldEquipped();
      return `<div class="helditem" data-act="heldpick">
        ${e ? `<span class="sprbox" style="width:22px;height:22px">${sprite(HELD_ITEMS[e].spr,false,"")}</span>
               <span class="tiny">${esc(HELD_ITEMS[e].n)}</span>`
            : `<span class="tiny dim">Aucun objet tenu</span>`}
        <span class="grow"></span><span class="tiny dim">modifier</span>
      </div>`; })()}
  </div>`;
}

ACTIONS.buddypick = () => {
  const ids = ownedSorted();
  if(!ids.length){ toast("Archivez d'abord une espèce", "bad", "cross"); return; }
  sheet(`${sheetHead("Choisir un compagnon")}
    <div class="tiny muted" style="margin-bottom:9px">Il gagne de l'affinité à chaque capture.
      Chaque palier lui donne des <b>niveaux de combat permanents</b> et améliore vos gains.
      Vous pouvez en changer à tout moment, mais l'affinité repart de zéro.</div>
    <div class="dexgrid">
      ${ids.slice(0,100).map(id=>`
        <div class="dexcell owned r${POKE[id].rar}" data-act="buddyset" data-id="${id}">
          <span class="no">${S.dex[id].lvl}</span>
          ${sprite(id, S.dex[id].shiny, "")}
          <span class="nm">${esc(POKE[id].name)}</span>
        </div>`).join("")}
    </div>`);
};
ACTIONS.buddyset = d => { setBuddy(+d.id); closeSheet(); refresh(); };
ACTIONS.buddyinfo = () => {
  const b = buddy();
  if(!b) return ACTIONS.buddypick();
  const t = buddyTier(), bo = buddyBonus();
  sheet(`<div class="center">
    <span class="sprbox" style="width:120px;height:120px">
      ${sprite(b.id, S.dex[b.id].shiny, "alive", {anim:true, eager:true})}<i class="sprshadow"></i></span>
    <div style="font-family:var(--font-px);font-size:11px;line-height:1.7">${esc(POKE[b.id].name)}</div>
    <div class="wrap" style="justify-content:center;margin:7px 0 10px">
      ${typeTags(POKE[b.id].types)}<span class="tt t1">Niv.${S.dex[b.id].lvl}</span>
    </div>
    <div class="tiles">
      <div class="tile accent"><div class="k">Affinité</div><div class="v">${t} / ${BUDDY_MAX_TIER}</div></div>
      <div class="tile gold"><div class="k">Trouvailles</div><div class="v">${b.finds||0}</div></div>
      <div class="tile"><div class="k">Bonus PokéCoins</div><div class="v">+${Math.round((bo.coin-1)*100)}%</div></div>
      <div class="tile"><div class="k">Bonus capture</div><div class="v">+${Math.round((bo.catch-1)*100)}%</div></div>
    </div>
    <div class="tiny muted" style="margin:9px 0">Chaque palier d'affinité lui accorde des niveaux de
      combat définitifs. Il ramasse aussi des objets pendant que vous capturez.</div>
    ${(b.log && b.log.length) ? `
      <div class="panel tight" style="text-align:left">
        <div class="row between">
          <div class="h sm" style="margin:0">CE QU'IL A RAPPORTÉ</div>
          <span class="tiny gold-t">≈ ${fmt(b.worth||0)} en valeur</span>
        </div>
        <div class="findlog">
          ${b.log.slice(0,8).map(e=>`<div class="findrow">
            <span class="fd-ic">${ic("seed")}</span>
            <span class="grow tiny">${esc(e.t)}</span>
            <span class="tiny dim">${fmtTime(Date.now()-e.at)}</span>
          </div>`).join("")}
        </div>
        ${b.log.length>8?`<div class="tiny dim" style="margin-top:5px">
          et ${b.log.length-8} autres avant cela</div>`:""}
      </div>` : `<div class="tiny dim">Il n'a encore rien rapporté. Continuez à capturer.</div>`}
    <div class="btn-grid c2">
      <button class="btn ghost" data-act="closesheet">Fermer</button>
      <button class="btn" data-act="buddypick">Changer</button>
    </div></div>`, true);
};

/* ---------- objets tenus ----------
   Un seul objet a la fois, porte par le compagnon. Chacun renforce
   un module different : c'est le liant entre les salles du jeu. */
const HELD_ITEMS = {
  h_coin:  {n:"Bourse percée",     rar:0, k:"coin",  spr:52,  d:"+20% de PokéCoins sur chaque capture."},
  h_xp:    {n:"Amplificateur",     rar:1, k:"xp",    spr:113, d:"+25% d'expérience."},
  h_berry: {n:"Baie Miracle",      rar:1, k:"catch", spr:43,  d:"+12% de taux de capture."},
  h_rest:  {n:"Restes",            rar:1, k:"exp",   spr:143, d:"+1 restauration au départ de chaque expédition."},
  h_aff:   {n:"Collier de lien",   rar:2, k:"aff",   spr:133, d:"Double l'affinité gagnée par le compagnon."},
  h_rune:  {n:"Pièce Rune",        rar:2, k:"poker", spr:150, d:"Double les Fragments gagnés au Poké-Poker."},
  h_guard: {n:"Bandeau tactique",  rar:2, k:"boss",  spr:68,  d:"+12% de statistiques contre les Data Guardians."},
  h_relic: {n:"Boussole fêlée",    rar:3, k:"relic", spr:249, d:"Une relique de plus au départ d'expédition."},
  h_charm: {n:"Amulette Chroma",   rar:3, k:"shiny", spr:151, d:"+40% de chance de chromatique."}
};
function heldOwned(){ return (S.held && S.held.owned) || []; }
function heldEquipped(){
  const e = S.held && S.held.eq;
  return (e && HELD_ITEMS[e] && buddy()) ? e : null;
}
/* un objet ne produit son effet que s'il est porte par un compagnon actif */
function heldActive(k){
  const e = heldEquipped();
  return !!(e && HELD_ITEMS[e].k === k);
}
function grantHeld(id){
  S.held = S.held || {owned:[], eq:null};
  if(S.held.owned.includes(id)) return false;
  S.held.owned.push(id);
  if(!S.held.eq) S.held.eq = id;
  return true;
}
function randomHeld(){
  const missing = Object.keys(HELD_ITEMS).filter(k=>!heldOwned().includes(k));
  return missing.length ? pick(missing) : null;
}
ACTIONS.heldpick = () => {
  const owned = heldOwned();
  sheet(`${sheetHead("Objet tenu")}
    <div class="tiny muted" style="margin-bottom:9px">Votre compagnon peut porter un objet à la fois.
      L'effet ne s'applique que tant qu'un compagnon est actif.</div>
    ${owned.length ? `<div class="list">
      ${owned.map(id=>{ const it = HELD_ITEMS[id];
        return `<div class="item ${S.held.eq===id?"on":""}" data-act="heldset" data-id="${id}">
          <span class="sprbox" style="width:36px;height:36px">${sprite(it.spr,false,"")}</span>
          <div class="grow"><div class="t">${esc(it.n)}
            <span class="tt rar r${it.rar}" style="--rc:${RARITY[it.rar].c}">${RARITY[it.rar].n}</span></div>
            <div class="d">${esc(it.d)}</div></div>
          ${S.held.eq===id?'<span class="tiny cy">porté</span>':ic("arrow")}
        </div>`;}).join("")}
      </div>
      <button class="btn ghost wide sm" style="margin-top:9px" data-act="heldset" data-id="">Ne rien porter</button>`
      : `<div class="empty">Aucun objet tenu. On en trouve dans les archives scellées,
          les trésors d'expédition et certains succès.</div>`}`);
};
ACTIONS.heldset = d => {
  S.held = S.held || {owned:[], eq:null};
  S.held.eq = d.id || null;
  toast(d.id ? HELD_ITEMS[d.id].n + " équipé" : "Objet retiré", "", "check");
  closeSheet(); save(); refresh();
};

/* ============================================================
   QUÊTES HEBDOMADAIRES
   Objectifs longs, recompenses en Noyaux et en archives scellees.
   ============================================================ */
const WEEKLY_POOL = [
  {id:"w_catch", n:"Restaurer {n} entités",              goal:[220,340,520], stat:"wkCatch"},
  {id:"w_new",   n:"Archiver {n} espèces inédites",      goal:[14,22,30],    stat:"wkNew"},
  {id:"w_rare",  n:"Capturer {n} Pokémon rares ou plus", goal:[30,50,80],    stat:"wkRare"},
  {id:"w_exp",   n:"Terminer {n} expéditions",           goal:[3,5,8],       stat:"wkExp"},
  {id:"w_poker", n:"Encaisser {n} manches de Poké-Poker",goal:[20,32,48],    stat:"wkPoker"},
  {id:"w_boss",  n:"Affronter {n} Data Guardians",       goal:[2,3,5],       stat:"wkBoss"},
  {id:"w_evo",   n:"Faire évoluer {n} Pokémon",          goal:[5,8,12],      stat:"wkEvo"},
  {id:"w_fish",  n:"Remonter {n} prises à la pêche",               goal:[25,40,60],    stat:"wkFish"},
  {id:"w_energy",n:"Forer {n} d'Énergie",    goal:[25000,60000,120000], stat:"wkEnergy"}
];
const WEEKLY_REWARDS = [
  {cores:3, chest:"small"},
  {cores:5, chest:"big"},
  {cores:8, chest:"big"}
];
function weekKey(){
  const d = new Date();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() + 4 - (t.getDay() || 7));
  const y0 = new Date(t.getFullYear(), 0, 1);
  return t.getFullYear() + "-S" + Math.ceil(((t - y0) / 86400000 + 1) / 7);
}
const WEEKLY_NEEDS = {wkFish:()=>!!S.rod, wkEnergy:()=>moduleUnlocked("idle"),
  wkPoker:()=>moduleUnlocked("poker"), wkBoss:()=>moduleUnlocked("boss"), wkExp:()=>moduleUnlocked("expedition")};
function weeklyDoable(q){ const need = WEEKLY_NEEDS[q.stat]; return !need || need(); }
function rollWeekly(){
  const tier = clamp(Math.floor(S.level/14), 0, 2);
  S.weekly = {
    week: weekKey(),
    tier,
    /* seulement des objectifs faisables cette semaine : une salle pas encore
       ouverte ne peut pas fournir l'objectif de la semaine */
    quests: shuffle(WEEKLY_POOL.filter(weeklyDoable)).slice(0,3).map(q=>({
      id:q.id, n:q.n.replace("{n}", fmt(q.goal[tier])), goal:q.goal[tier],
      stat:q.stat, prog:0, claimed:false
    })),
    wk: {wkCatch:0, wkNew:0, wkRare:0, wkExp:0, wkPoker:0, wkBoss:0, wkEvo:0, wkFish:0, wkEnergy:0}
  };
}
function weeklyRollover(){
  if(!S.weekly || S.weekly.week !== weekKey()) rollWeekly();
}
/* les compteurs hebdomadaires suivent les memes evenements que les quotidiens */
const DAILY_TO_WEEKLY = {
  dayCatch:"wkCatch", dayNew:"wkNew", dayRare:"wkRare", dayExp:"wkExp",
  dayPokerBlinds:"wkPoker", dayBoss:"wkBoss", dayEvo:"wkEvo", dayFish:"wkFish", dayEnergy:"wkEnergy"
};
function weeklyTick(stat, n){
  if(!S.weekly) return;
  const k = DAILY_TO_WEEKLY[stat];
  if(!k) return;
  S.weekly.wk[k] = (S.weekly.wk[k]||0) + n;
  for(const q of S.weekly.quests){
    if(q.stat === k && q.prog < q.goal){
      q.prog = Math.min(q.goal, q.prog + n);
      if(q.prog >= q.goal) toast("Objectif hebdomadaire atteint : " + q.n, "warn", "trophy");
    }
  }
  saveSoon();
}
ACTIONS.claimwk = d => {
  const q = S.weekly.quests[+d.i];
  if(!q || q.claimed || q.prog < q.goal) return;
  q.claimed = true;
  const rw = WEEKLY_REWARDS[S.weekly.tier];
  gain("cores", rw.cores);
  const chest = CHESTS[rw.chest];
  const items = openChest(rw.chest, true);
  const wc = randomCard(1 + S.weekly.tier * 0.6);
  const wcNew = grantCardV(wc.s, wc.id);
  Sfx.win();
  save();
  revealSheet("OBJECTIF HEBDOMADAIRE", [
    {icon:"core", label:`${rw.cores} Noyaux`, color:"var(--violet)"},
    {icon:"cards", label:POKE[wc.id].name,
     sub:"carte " + seriesName(wc.s) + (wcNew ? "" : " · doublon"),
     color:CARD_SERIES_DEF[wc.s].c, big:true},
    ...items
  ], {sub:`${esc(q.n)} — ${esc(chest.name)} ouverte`});
};

function weeklyPanel(){
  weeklyRollover();
  const W = S.weekly;
  const rw = WEEKLY_REWARDS[W.tier];
  return `
    <div class="row between" style="margin:2px 0 7px">
      <div class="h sm" style="margin:0">OBJECTIFS DE LA SEMAINE</div>
      <span class="tiny dim">${esc(W.week)}</span>
    </div>
    <div class="list">
      ${W.quests.map((q,i)=>`
        <div class="quest ${q.prog>=q.goal?"done":""}">
          <div class="grow">
            <div class="q-t">${esc(q.n)}</div>
            <div class="bar" style="margin-top:5px"><i style="width:${Math.min(100,q.prog/q.goal*100)}%"></i></div>
            <div class="tiny muted mono-num">${fmt(q.prog)} / ${fmt(q.goal)}</div>
          </div>
          <button class="btn sm ${q.prog>=q.goal&&!q.claimed?"gold":""}" data-act="claimwk" data-i="${i}"
            ${q.prog>=q.goal&&!q.claimed?"":"disabled"}>${q.claimed?"Pris":"Prendre"}</button>
        </div>`).join("")}
    </div>
    <div class="tiny dim" style="margin-top:6px">Chaque objectif accompli rapporte
      ${rw.cores} Noyaux et une ${esc(CHESTS[rw.chest].name)}.</div>`;
}

/* ============================================================
   SÉQUENCE DE RÉVÉLATION
   Utilisee pour les coffres, les hebdomadaires et le tampon
   quotidien : les recompenses apparaissent une par une.
   ============================================================ */
/* si l'archive contenait une carte, elle sort d'un sachet a dechirer,
   pas d'une ligne de liste */
function revealDone(){
  closeSheet();
  if(chestBooster.length){
    const cards = chestBooster;
    chestBooster = [];
    if(showBooster(cards, {title:"SACHET TROUVÉ DANS L'ARCHIVE",
        sub:"Scellé avec le reste. Personne ne l'a jamais ouvert.",
        onDone:()=>refresh()})) return;
  }
  refresh();
}
ACTIONS.revealdone = () => revealDone();

/* transforme une recompense en lignes de revelation, sans dupliquer la mise en forme */
function rewardItems(rw){
  const out = [];
  for(const k in rw){
    if(k === "balls") for(const b in rw.balls)
      out.push({icon:BALLS[b].icon, label:`${rw.balls[b]} ${BALLS[b].name}`, color:"var(--cyan)"});
    else if(k === "berries") for(const b in rw.berries)
      out.push({icon:"seed", label:`${rw.berries[b]} ${BERRIES[b].name}`, color:"var(--green)"});
    else if(k === "cos") for(const c of [].concat(rw.cos)) if(COSMETICS[c])
      out.push({icon:"star", label:COSMETICS[c].n, sub:"cosmétique", color:"var(--amber)", big:true});
    else if(["coins","shards","cores"].includes(k))
      out.push({icon:k === "cores" ? "core" : k === "shards" ? "shard" : "coin",
                label:`${fmt(rw[k])} ${CUR_NAME[k]}`,
                color:k === "cores" ? "var(--violet)" : "var(--amber)", big:k === "cores"});
  }
  return out;
}

function revealSheet(title, items, opts){
  opts = opts || {};
  sheet(`<div class="center reveal">
    <div class="h" style="justify-content:center">${esc(title)}</div>
    ${opts.sub?`<div class="tiny muted" style="margin:-4px 0 8px">${opts.sub}</div>`:""}
    <div class="rv-stage" id="rv-stage">
      <div class="rv-chest" id="rv-chest">${ic(opts.icon || "chest")}</div>
      <div class="rv-glow" id="rv-glow"></div>
    </div>
    <div class="rv-list" id="rv-list"></div>
    <button class="btn pri wide" id="rv-ok" style="opacity:0;pointer-events:none"
      data-act="revealdone">Récupérer</button>
  </div>`, true);
  runReveal(items);
}
function runReveal(items){
  const chest = document.getElementById("rv-chest");
  const glow  = document.getElementById("rv-glow");
  const list  = document.getElementById("rv-list");
  const ok    = document.getElementById("rv-ok");
  if(!list){ return; }

  if(chest) chest.classList.add("shaking");
  Sfx.wobble();
  setTimeout(()=>{ Sfx.wobble(); buzz(14); }, 240);
  setTimeout(()=>{ Sfx.wobble(); buzz(14); }, 480);

  setTimeout(()=>{
    if(chest) { chest.classList.remove("shaking"); chest.classList.add("open"); }
    if(glow) glow.classList.add("on");
    Sfx.caught(); buzz([20,40,60]);
    const stage = document.getElementById("rv-stage");
    if(stage) burstEl(stage, {n:26, spread:120, colors:["#ffc857","#35f0d6","#ffffff"], dur:900});
  }, 760);

  items.forEach((it, i)=>{
    setTimeout(()=>{
      const el = document.createElement("div");
      el.className = "rv-item";
      el.style.setProperty("--ic", it.color || "var(--cyan)");
      el.innerHTML = `
        <span class="rv-ic">${it.id !== undefined
          ? `<span class="sprbox" style="width:34px;height:34px">${sprite(it.id, it.shiny, "")}</span>`
          : ic(it.icon || "star")}</span>
        <span class="rv-lb">${esc(it.label)}</span>
        ${it.sub?`<span class="rv-sb">${esc(it.sub)}</span>`:""}`;
      list.appendChild(el);
      requestAnimationFrame(()=>el.classList.add("in"));
      Sfx.coin();
      if(it.big) burstEl(el, {n:14, spread:70, colors:[it.color||"#ffc857","#ffffff"]});
    }, 900 + i*220);
  });

  setTimeout(()=>{
    if(ok){ ok.style.opacity = 1; ok.style.pointerEvents = "auto"; }
  }, 900 + items.length*220 + 200);
}

/* ---------- ouverture de coffre : logique separee du rendu ---------- */
let chestBooster = [];
function openChest(key, silent){
  const c = CHESTS[key];
  const n = c.tier === 1 ? 3 : c.tier === 2 ? 6 : c.tier === 3 ? 5 : 7;
  const out = [];
  chestBooster = [];
  for(let i=0;i<n;i++){
    const loot = Object.assign({}, pick(CHEST_LOOT[c.tier]));
    if(loot.stones === "random"){ const k = pick(Object.keys(STONES)); loot.stones = {[k]:1}; }
    if(loot.items === "radar"){
      S.items.radar = (S.items.radar||0) + 1;
      out.push({icon:"boss", label:"Radar Légendaire", color:"var(--magenta)", big:true});
      delete loot.items;
    } else if(loot.items){
      S.items[loot.items] = (S.items[loot.items]||0) + 2;
      out.push({icon:"heart", label:"2 Restaurations", color:"var(--green)"});
      delete loot.items;
    }
    if(loot.egg){
      grantEgg(loot.egg);
      out.push({icon:"box", label:EGG_TIERS[loot.egg].n, sub:"à incuber",
                color:EGG_TIERS[loot.egg].c, big:loot.egg !== "e_common"});
      delete loot.egg;
    }
    if(loot.boost){
      const bid = pick(Object.keys(BOOSTS));
      startBoost(bid);
      out.push({icon:"bolt", label:BOOSTS[bid].n, sub:BOOSTS[bid].min + " min",
                color:"var(--cyan)", big:true});
      delete loot.boost;
    }
    if(loot.held){
      const h = randomHeld();
      if(h && grantHeld(h)) out.push({icon:"star", label:HELD_ITEMS[h].n, sub:"Objet tenu",
        color:"var(--violet)", big:true});
      else out.push({icon:"shard", label:"40 Fragments", color:"var(--cyan)"}), gain("shards",40);
      delete loot.held;
    }
    if(loot.card){
      const c2 = randomCard(c.tier >= 4 ? 2.2 : 1.4);
      const fresh = grantCardV(c2.s, c2.id);
      chestBooster.push({s:c2.s, id:c2.id, fresh});
      delete loot.card;
    }
    if(Object.keys(loot).length){
      grantReward(loot);
      const big = !!(loot.cores || (loot.balls && loot.balls.master));
      out.push({icon: lootIcon(loot), label: rewardText(loot),
                color: big ? "var(--violet)" : "var(--amber)", big});
    }
  }
  if(!silent) checkAchievements();
  return out;
}
function lootIcon(loot){
  if(loot.cores) return "core";
  if(loot.shards) return "shard";
  if(loot.coins) return "coin";
  if(loot.balls) return BALLS[Object.keys(loot.balls)[0]].icon;
  if(loot.berries) return "seed";
  if(loot.stones) return "stone";
  return "star";
}
