/* ============================================================
   70 — POKEDEX, BOUTIQUE, PROFIL
   ============================================================ */

let DEX_FILTER = {region:"kanto", mode:"all", type:0};

function dupCost(id){ return 2 + POKE[id].rar; }
function evoCoinCost(id){ return 400 * (POKE[id].rar + 1); }
function canEvolve(id, e){
  const en = S.dex[id];
  if(!en) return {ok:false, why:"Espèce non archivée."};
  if(en.lvl < e.lvl) return {ok:false, why:`Niveau ${e.lvl} requis (actuel ${en.lvl}).`};
  if(en.c < dupCost(id)) return {ok:false, why:`${dupCost(id)} exemplaires requis (${en.c}).`};
  if(!canPay("coins", evoCoinCost(id))) return {ok:false, why:`${fmt(evoCoinCost(id))} PokéCoins requis.`};
  if(e.stone && (S.stones[e.stone]||0) <= 0)
    return {ok:false, why:`${STONES[e.stone]?.name||"Pierre"} requise.`};
  return {ok:true};
}

SCREENS.dex = {
  after(){ tutoMaybe("dex"); },
  html(){
    const r = regionDef(DEX_FILTER.region);
    const total = r.to - r.from + 1;
    const owned = dexCount(DEX_FILTER.region);
    const ids = [];
    for(let i=r.from;i<=r.to;i++){
      const e = S.dex[i];
      if(DEX_FILTER.mode === "owned" && !e) continue;
      if(DEX_FILTER.mode === "missing" && e) continue;
      if(DEX_FILTER.mode === "shiny" && !(e && e.shiny)) continue;
      if(DEX_FILTER.type && !POKE[i].types.includes(DEX_FILTER.type)) continue;
      ids.push(i);
    }
    return `
      <div class="tabs">
        ${REGIONS.map(x=>`<button class="${DEX_FILTER.region===x.key?"on":""}" data-act="dexreg" data-r="${x.key}">
          ${esc(x.name)}</button>`).join("")}
      </div>
      <div class="panel bracket">
        <div class="row">
          <div class="ring">
            <svg viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="23" fill="none" stroke="#1e2d49" stroke-width="5"/>
              <circle cx="27" cy="27" r="23" fill="none" stroke="var(--cyan)" stroke-width="5"
                stroke-dasharray="${(owned/total*144.5).toFixed(1)} 999" stroke-linecap="round"/>
            </svg>
            <span class="val">${Math.round(owned/total*100)}%</span>
          </div>
          <div class="grow">
            <div class="h sm" style="margin:0 0 3px">${esc(r.name.toUpperCase())} ${infoBtn("evolution")}</div>
            <div class="tiny muted">${esc(r.desc)}</div>
            <div class="tiny cy mono-num" style="margin-top:4px">${owned} / ${total} espèces archivées</div>
            <div class="wrap" style="margin-top:6px">
              ${REGION_TIERS.map(t=>{
                const got = regionTiersDone(r.key).includes(t.pct);
                return `<span class="tierpip ${got?"on":""}">${t.pct}%</span>`;}).join("")}
              ${infoBtn("regiontier")}
            </div>
          </div>
        </div>
      </div>
      <div class="chipbar">
        ${[["all","Tous"],["owned","Possédés"],["missing","Manquants"],["shiny","Chromatiques"]]
          .map(([k,n])=>`<button class="chip ${DEX_FILTER.mode===k?"on":""}" data-act="dexmode" data-m="${k}">${n}</button>`).join("")}
      </div>
      <div class="chipbar">
        <button class="chip ${!DEX_FILTER.type?"on":""}" data-act="dextype" data-t="0">Tous types</button>
        ${Object.keys(TYPE_NAMES).map(t=>`<button class="chip ${DEX_FILTER.type==+t?"on":""}"
          data-act="dextype" data-t="${t}"><span class="tt t${t}" style="border:0;padding:0">${TYPE_NAMES[t]}</span></button>`).join("")}
      </div>
      <div class="dexgrid">
        ${ids.map(i=>{
          const e = S.dex[i];
          return `<div class="dexcell ${e?"owned":""} r${POKE[i].rar}" data-act="dexopen" data-id="${i}">
            <span class="no">${i}</span>
            ${e?`<span class="cnt">${e.c}</span>`:""}
            ${sprite(i, e&&e.shiny, e?"":"ghosted")}
            ${e&&e.shiny?'<span class="shi">◆</span>':""}
            <span class="nm">${e?esc(POKE[i].name):"— — —"}</span>
          </div>`;}).join("")}
      </div>
      ${ids.length?"":`<div class="empty">${ic("eye")}<div style="margin-top:8px">
        Aucune entrée ne correspond à ce filtre.</div></div>`}`;
  }
};
ACTIONS.dexreg = d => { DEX_FILTER.region = d.r; refresh(); };
ACTIONS.dexmode = d => { DEX_FILTER.mode = d.m; refresh(); };
ACTIONS.dextype = d => { DEX_FILTER.type = +d.t; refresh(); };

ACTIONS.dexopen = d => {
  const id = +d.id, p = POKE[id], e = S.dex[id];
  const stats = [["PV",p.hp],["Attaque",p.atk],["Défense",p.def],["Atq. Spé.",p.spa],["Déf. Spé.",p.spd],["Vitesse",p.spe]];
  sheet(`${sheetHead("N°" + id + (e ? " — " + p.name : " — entrée absente"))}
    <div class="row top" style="gap:12px">
      <div class="center">
        <span class="sprbox" style="width:116px;height:116px">
          ${sprite(id, e&&e.shiny, e?"":"ghosted", {anim:!!e, eager:true})}<i class="sprshadow"></i></span>
        ${e&&e.shiny?'<div class="tiny gold-t">chromatique obtenu</div>':""}
      </div>
      <div class="grow">
        <div class="wrap" style="margin-bottom:6px">${typeTags(p.types)}${rarTag(p.rar)}</div>
        ${e?`<div class="tiny">Exemplaires : <b>${e.c}</b></div>
             <div class="tiny">Niveau de combat : <b class="cy">${e.lvl}</b></div>
             <div class="tiny muted">Taux de capture : ${p.catch}</div>`
           : `<div class="tiny muted">Cette entité n'a pas encore été restaurée.
              Sa ligne reste illisible.</div>`}
      </div>
    </div>
    ${loreOf(id) ? `<div class="lore ${e?"":"sealed"}">
      ${e ? esc(loreOf(id))
          : "Notice illisible. Restaurez cette entité pour récupérer son entrée d'archive."}</div>` : ""}
    <hr class="sep">
    <div class="h sm">STATISTIQUES DE BASE · total ${p.bst}</div>
    ${stats.map(([n,v])=>`<div class="row" style="gap:7px;margin-bottom:3px">
      <span class="tiny muted" style="width:62px">${n}</span>
      <span class="bar grow"><i style="width:${Math.min(100,v/200*100)}%"></i></span>
      <b class="tiny mono-num" style="width:26px;text-align:right">${v}</b></div>`).join("")}
    ${p.evo.length?`<hr class="sep"><div class="h sm">ÉVOLUTION</div>
      ${p.evo.map(ev=>{
        const chk = canEvolve(id, ev);
        return `<div class="item" style="margin-bottom:5px">
          ${sprite(ev.to,false,"sm")}
          <div class="grow"><div class="t">${esc(POKE[ev.to].name)}</div>
            <div class="d">Niv.${ev.lvl} · ${dupCost(id)} exemplaires · ${fmt(evoCoinCost(id))} PokéCoins
              ${ev.stone?` · ${esc(STONES[ev.stone]?.name||"Pierre")}`:""}</div>
            ${chk.ok?"":`<div class="tiny bad">${esc(chk.why)}</div>`}</div>
          <button class="btn sm ${chk.ok?"pri":""}" data-act="evolve" data-id="${id}" data-to="${ev.to}"
            ${chk.ok?"":"disabled"}>Faire évoluer</button></div>`;}).join("")}`:""}
    ${p.from?`<div class="tiny muted" style="margin-top:6px">Évolue depuis ${esc(POKE[p.from].name)}.</div>`:""}`);
};
ACTIONS.evolve = d => {
  const id = +d.id, to = +d.to;
  const ev = POKE[id].evo.find(x=>x.to === to);
  const chk = canEvolve(id, ev);
  if(!chk.ok) return;
  pay("coins", evoCoinCost(id));
  if(ev.stone) S.stones[ev.stone]--;
  const en = S.dex[id];
  en.c -= dupCost(id);
  const lvl = en.lvl;
  const isNew = addToDex(to, lvl, false);
  S.dex[to].lvl = Math.max(S.dex[to].lvl, lvl);
  S.stats.evolutions++; S.daily.dayEvo++; questTick("dayEvo",1);
  addIntegrity(RARITY[POKE[to].rar].integ * (isNew?0.85:0.05));
  addXp(80 + POKE[to].bst/4);
  pzFlash(pzLine("evolve"));
  save(); checkAchievements(); guideTick();
  closeSheet();
  playEvolution(id, to, isNew);
};

/* ---------- animation d'évolution ----------
   Reprise du rythme des jeux officiels : la silhouette blanchit, les deux
   formes alternent de plus en plus vite, puis la nouvelle s'impose. */
let EVO = null;
function playEvolution(from, to, isNew){
  const box = document.getElementById("discover");
  if(!box){ toast(POKE[to].name + " !", "warn", "star"); return; }
  box.className = "on evo";
  box.style.setProperty("--ac", TYPE_TINT[POKE[to].types[0]-1]);
  box.innerHTML = `
    <div class="evo-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker" id="ev-kick">RÉÉCRITURE EN COURS</div>
      <div class="evo-stage" id="ev-stage">
        <span class="evo-ring"></span><span class="evo-ring d2"></span><span class="evo-ring d3"></span>
        <span class="evo-spr" id="ev-spr">
          <span class="sprbox" style="width:150px;height:150px">${sprite(from, false, "")}</span>
        </span>
      </div>
      <div class="dc-name" id="ev-name"></div>
      <div class="wrap dc-tags" id="ev-tags" style="justify-content:center"></div>
      <div class="dc-lore" id="ev-lore"></div>
      <button class="btn pri wide dc-ok" id="ev-ok" data-act="dcdone">Continuer</button>
    </div>`;

  EVO = {timers:[], from, to};
  const at = (ms, fn) => EVO.timers.push(setTimeout(fn, ms));
  const holder = () => document.getElementById("ev-spr");
  const setForm = id => {
    const h = holder();
    if(h) h.innerHTML = `<span class="sprbox" style="width:150px;height:150px">${sprite(id, false, "")}</span>`;
  };

  /* la silhouette blanchit, puis les formes alternent de plus en plus vite */
  at(220, ()=>{ const h = holder(); if(h) h.classList.add("white"); Sfx.wobble(); });
  const rhythm = [700, 1120, 1500, 1840, 2140, 2400, 2620, 2800, 2950, 3070, 3170, 3255];
  rhythm.forEach((t, i)=>at(t, ()=>{
    setForm(i % 2 === 0 ? to : from);
    const h = holder(); if(h) h.classList.add("white");
    Sfx.click(); if(i % 3 === 0) buzz(8);
  }));

  at(3420, ()=>{
    setForm(to);
    const h = holder();
    if(h){ h.classList.remove("white"); h.classList.add("done"); }
    box.classList.add("flash");
    setTimeout(()=>box.classList.remove("flash"), 300);
    const st = document.getElementById("ev-stage");
    if(st) burstEl(st, {n:34, spread:170, colors:["#ffffff","#35f0d6","#ffc857"], dur:1000});
    Sfx.win(); buzz([25,45,80]);

    const k = document.getElementById("ev-kick");
    if(k){ k.textContent = isNew ? "NOUVELLE ENTRÉE D'ARCHIVE" : "RÉÉCRITURE TERMINÉE"; k.classList.add("done"); }
    const n = document.getElementById("ev-name");
    if(n){ n.innerHTML = `${esc(POKE[from].name)} <span class="evo-arrow">▸</span> ${esc(POKE[to].name)}`;
           n.classList.add("in"); }
    const tg = document.getElementById("ev-tags");
    if(tg){ tg.innerHTML = typeTags(POKE[to].types) + rarTag(POKE[to].rar) +
      `<span class="tt t1">Niv.${S.dex[to].lvl}</span>` +
      (isNew ? '<span class="tt" style="color:var(--green);border-color:var(--green)">INÉDIT</span>' : "");
      tg.classList.add("in"); }
    const lo = document.getElementById("ev-lore");
    if(lo){ lo.textContent = loreOf(to); lo.classList.add("in"); }
    const ok = document.getElementById("ev-ok");
    if(ok) ok.classList.add("in");
    EVO = null;
  });
}

/* ============================================================
   BOUTIQUE
   ============================================================ */
let SHOP_CAT = "balls";

function buyQty(cur, unit, qty, apply){
  const total = unit*qty;
  if(!canPay(cur, total)){ toast(`${CUR_NAME[cur]} insuffisants`, "bad", "cross"); return; }
  pay(cur, total); apply(qty);
  Sfx.coin(); save(); refresh();
}

SCREENS.shop = {
  html(){
    const cats = [["balls","Balls"],["berries","Baies"],["boosts","Boosts"],["items","Objets"],
                  ["stones","Pierres"],["chests","Archives"],["cos","Cosmétiques"]];
    return `
      <div class="h">${ic("shop")} BOUTIQUE ${infoBtn("currencies")}</div>
      <div class="sub">Tout ce qui s'achète ici se range dans le sac.</div>
      <div class="chipbar">
        ${cats.map(([k,n])=>`<button class="chip ${SHOP_CAT===k?"on":""}" data-act="shopcat" data-c="${k}">${n}</button>`).join("")}
      </div>
      ${this[SHOP_CAT]()}`;
  },
  balls(){
    return `<div class="list">${Object.entries(BALLS).map(([k,b])=>`
      <div class="shopitem">
        <div class="ic">${ic(b.icon)}</div>
        <div class="grow"><div>${esc(b.name)} <span class="tiny muted">×${S.balls[k]||0}</span></div>
          <div class="tiny muted">${esc(b.d)}</div>
          <div class="price">${ic(b.cur==="coins"?"coin":b.cur==="shards"?"shard":"core")} ${fmt(b.price)}</div></div>
        <div class="btn-grid" style="gap:4px">
          <button class="btn sm" data-act="buyball" data-k="${k}" data-q="1">×1</button>
          <button class="btn sm" data-act="buyball" data-k="${k}" data-q="10">×10</button>
        </div>
      </div>`).join("")}</div>`;
  },
  boosts(){
    return `
      <div class="tiny muted" style="margin-bottom:8px">Effets temporisés. Un nouvel achat prolonge
        la durée en cours au lieu de l'écraser.</div>
      ${boostStrip()}
      <div class="list">${Object.entries(BOOSTS).map(([id,b])=>`
        <div class="shopitem ${boostActive(b.k)?"on":""}">
          <span class="sprbox" style="width:36px;height:36px">${sprite(b.spr,false,"")}</span>
          <div class="grow"><div>${esc(b.n)}
            <span class="tiny dim">${b.min} min</span></div>
            <div class="tiny muted">${esc(b.d)}</div>
            ${boostActive(b.k)?`<div class="tiny cy">actif — ${fmtTime(boostLeft(b.k))}</div>`:""}
            <div class="price">${ic(b.cur==="coins"?"coin":"shard")} ${fmt(b.price)}</div></div>
          <button class="btn sm" data-act="buyboost" data-id="${id}">Activer</button>
        </div>`).join("")}
      </div>
      <div class="h sm" style="margin-top:12px">RADAR</div>
      <div class="shopitem">
        <div class="ic">${ic("boss")}</div>
        <div class="grow"><div>Radar Légendaire <span class="tiny dim">×${radarCount()}</span></div>
          <div class="tiny muted">Force une rencontre légendaire dans le secteur actif.</div>
          <div class="price">${ic("core")} 8</div></div>
        <button class="btn sm gold" data-act="buyradar">Acheter</button>
      </div>`;
  },
  berries(){
    return `<div class="list">${Object.entries(BERRIES).map(([k,b])=>`
      <div class="shopitem">
        <div class="ic">${ic("seed")}</div>
        <div class="grow"><div>${esc(b.name)} <span class="tiny muted">×${S.berries[k]||0}</span></div>
          <div class="tiny muted">${esc(b.d)}</div>
          <div class="price">${ic(b.cur==="coins"?"coin":"shard")} ${fmt(b.price)}</div></div>
        <div class="btn-grid" style="gap:4px">
          <button class="btn sm" data-act="buyberry" data-k="${k}" data-q="1">×1</button>
          <button class="btn sm" data-act="buyberry" data-k="${k}" data-q="5">×5</button>
        </div>
      </div>`).join("")}</div>`;
  },
  items(){
    const list = [
      {k:"potion", n:"Restauration", d:"Soigne 55% des PV d'un Pokémon en combat.", p:250, cur:"coins", i:"heart"},
      {k:"revive", n:"Réindexation", d:"Réanime un Pokémon désindexé à 50% de ses PV.", p:700, cur:"coins", i:"refresh"}
    ];
    return `<div class="list">${list.map(it=>`
      <div class="shopitem">
        <div class="ic">${ic(it.i)}</div>
        <div class="grow"><div>${esc(it.n)} <span class="tiny muted">×${S.items[it.k]||0}</span></div>
          <div class="tiny muted">${esc(it.d)}</div>
          <div class="price">${ic("coin")} ${fmt(it.p)}</div></div>
        <div class="btn-grid" style="gap:4px">
          <button class="btn sm" data-act="buyitem" data-k="${it.k}" data-q="1">×1</button>
          <button class="btn sm" data-act="buyitem" data-k="${it.k}" data-q="5">×5</button>
        </div>
      </div>`).join("")}</div>`;
  },
  stones(){
    return `<div class="list">${Object.entries(STONES).map(([k,s])=>`
      <div class="shopitem">
        <div class="ic">${ic("stone")}</div>
        <div class="grow"><div>${esc(s.name)} <span class="tiny muted">×${S.stones[k]||0}</span></div>
          <div class="tiny muted">Requise par certaines réécritures d'entité.</div>
          <div class="price">${ic("coin")} ${fmt(STONE_PRICE)}</div></div>
        <button class="btn sm" data-act="buystone" data-k="${k}">Acheter</button>
      </div>`).join("")}</div>`;
  },
  chests(){
    return `<div class="list">${Object.entries(CHESTS).map(([k,c])=>`
      <div class="shopitem">
        <div class="ic">${ic("chest")}</div>
        <div class="grow"><div>${esc(c.name)}</div>
          <div class="tiny muted">${esc(c.d)}</div>
          <div class="price">${ic(c.cur==="coins"?"coin":"core")} ${fmt(c.price)}</div></div>
        <button class="btn sm gold" data-act="buychest" data-k="${k}">Ouvrir</button>
      </div>`).join("")}</div>`;
  },
  cos(){
    const prices = {title:3, frame:5, bg:4, fx:6};
    const list = Object.entries(COSMETICS).filter(([id,c])=>!c.def && !S.cos.owned.includes(id));
    return `
      <div class="tiny muted" style="margin-bottom:7px">La plupart des cosmétiques s'obtiennent par les succès.
        Ceux qui restent peuvent être achetés en Noyaux.</div>
      <div class="list">${list.length ? list.map(([id,c])=>`
        <div class="shopitem">
          <div class="ic">${ic(c.t==="title"?"user":c.t==="frame"?"grid":c.t==="bg"?"map":"star")}</div>
          <div class="grow"><div>${esc(c.n)}</div>
            <div class="tiny muted">${({title:"Titre",frame:"Cadre",bg:"Fond",fx:"Effet"})[c.t]}</div>
            <div class="price">${ic("core")} ${prices[c.t]}</div></div>
          <button class="btn sm" data-act="buycos" data-id="${id}" data-p="${prices[c.t]}">Acheter</button>
        </div>`).join("") : `<div class="panel center tiny muted">Tout est déjà débloqué.</div>`}
      </div>`;
  }
};
ACTIONS.shopcat = d => { SHOP_CAT = d.c; refresh(); };
ACTIONS.buyball = d => { const b = BALLS[d.k];
  buyQty(b.cur, b.price, +d.q, q=>{ S.balls[d.k] = (S.balls[d.k]||0)+q; toast(`+${q} ${b.name}`, "", "check"); }); };
ACTIONS.buyberry = d => { const b = BERRIES[d.k];
  buyQty(b.cur, b.price, +d.q, q=>{ S.berries[d.k] = (S.berries[d.k]||0)+q; toast(`+${q} ${b.name}`, "", "check"); }); };
ACTIONS.buyitem = d => {
  const p = d.k === "potion" ? 250 : 700;
  buyQty("coins", p, +d.q, q=>{ S.items[d.k] = (S.items[d.k]||0)+q; toast("Objet acquis", "", "check"); });
};
ACTIONS.buyradar = () => {
  if(!pay("cores", 8)){ toast("Noyaux insuffisants", "bad", "cross"); return; }
  S.items.radar = (S.items.radar||0) + 1;
  toast("Radar Légendaire acquis", "warn", "boss");
  Sfx.coin(); save(); refresh();
};
ACTIONS.buystone = d => {
  buyQty("coins", STONE_PRICE, 1, ()=>{ S.stones[d.k] = (S.stones[d.k]||0)+1;
    toast(STONES[d.k].name + " acquise", "", "stone"); });
};

const CHEST_LOOT = {
  1:[{balls:{super:5}},{balls:{hyper:2}},{berries:{framby:4}},{coins:400},{shards:12},{berries:{nigma:2}}],
  2:[{balls:{hyper:6}},{balls:{data:4}},{shards:40},{coins:1600},{cores:1},{berries:{micle:2}},
     {items:"potion"}],
  3:[{cores:4},{shards:120},{balls:{master:1}},{coins:9000},{stones:"random"},{card:true},{held:true},
     {egg:"e_rare"}],
  4:[{cores:12},{shards:400},{balls:{master:2}},{coins:60000},{card:true},{held:true},
     {items:"radar"},{boost:true},{egg:"e_epic"},{egg:"e_origin"}]
};
ACTIONS.buychest = d => {
  const c = CHESTS[d.k];
  if(!pay(c.cur, c.price)){ toast(`${CUR_NAME[c.cur]} insuffisants`, "bad", "cross"); return; }
  const items = openChest(d.k);
  save(); guideTick();
  revealSheet(c.name.toUpperCase(), items, {sub:"Contenu extrait de l'archive"});
};
ACTIONS.buycos = d => {
  if(!pay("cores", +d.p)){ toast("Noyaux insuffisants", "bad", "cross"); return; }
  unlockCosmetic(d.id); Sfx.coin(); save(); refresh();
};

/* teintes de type, partagees avec les cartes de collection */
const TYPE_TINT = ["#66665a","#94503a","#546c9e","#7e4599","#8e7845","#7e704f","#6c852f","#5f4f9e",
  "#728292","#aa6025","#3471ad","#338f51","#ab9427","#a94173","#4f97a5","#5647ad","#70584c","#a86694"];
function weaknessOf(p){
  let best = 0, bestM = 1;
  for(let t = 1; t <= 18; t++){ const m = typeMult(t, p.types); if(m > bestM){ bestM = m; best = t; } }
  return best;
}

/* ============================================================
   PROFIL
   ============================================================ */
let PROF_TAB = "stats";

/* L'avatar n'est plus « le dernier Pokemon archivé » : c'est un choix, et
   certaines pieces se meritent. */
function avatarPool(){
  const out = [];
  const owned = ownedSorted();
  for(const id of owned) out.push({k:"mon:"+id, id, n:POKE[id].name, g:"Archive"});
  for(const id of owned) if(S.dex[id].shiny)
    out.push({k:"shiny:"+id, id, shiny:true, n:POKE[id].name + " chromatique", g:"Chromatiques"});
  for(const r of REGIONS) for(const g of r.guardians){
    const beaten = S.bosses.includes(r.key + ":" + g.id);
    out.push({k:"guard:"+g.id, id:g.id, n:g.name, g:"Verrous levés",
              locked:!beaten, why:"Relâcher " + g.name});
  }
  out.push({k:"pz", id:474, n:"Porygon-Z", g:"Prestige",
            locked:!S.flags.climax, why:"Atteindre l'épilogue"});
  out.push({k:"mn", id:0, n:"Sans index", g:"Prestige",
            locked:!(S.cards && S.cards["mn:0"]), why:"Obtenir la pièce secrète"});
  return out;
}
function avatarKey(){
  const k = S.cos.avatar;
  if(k && typeof k === "string") return k;
  if(typeof k === "number" && S.dex[k]) return "mon:" + k;     /* ancienne sauvegarde */
  const ids = ownedSorted();
  return ids.length ? "mon:" + ids[0] : "mon:25";
}
function avatarHtml(size){
  const k = avatarKey();
  const [kind, raw] = k.split(":");
  const id = +raw;
  if(kind === "mn") return `<span class="spr missing" style="width:${size}px;height:${size}px"></span>`;
  if(kind === "pz") return pzFace(pzMood(), size);
  return `<span class="sprbox" style="width:${size}px;height:${size}px">
    ${sprite(id || 25, kind === "shiny", "", {anim:true})}</span>`;
}

SCREENS.profile = {
  html(){
    const frame = COSMETICS[S.cos.frame] || {cls:""};
    const bg = COSMETICS[S.cos.bg] || {};
    const title = COSMETICS[S.cos.title] || {n:""};
    const need = xpForLevel(S.level);
    const pct = S.xp / need;
    return `
      <div class="hero" style="background:${bg.css||"linear-gradient(180deg,var(--s2),var(--s1))"}">
        <div class="row" style="gap:12px">
          <div class="avatar ${frame.cls||""}" data-act="pickavatar">
            ${avatarHtml(60)}
            <span class="av-edit">${ic("gear")}</span>
          </div>
          <div class="grow">
            <div class="row between" style="gap:6px">
              <div style="font-family:var(--font-px);font-size:10px;line-height:1.6;overflow:hidden;
                text-overflow:ellipsis;white-space:nowrap">${esc(S.name)}</div>
              <button class="btn xs ghost" data-act="rename">Modifier</button>
            </div>
            <div class="tiny cy">${esc(title.n)}</div>
            <div class="row between tiny muted" style="margin-top:6px">
              <span>Niveau ${S.level}</span><span class="mono-num">${fmt(S.xp)} / ${fmt(need)}</span>
            </div>
            <div class="bar xp" style="margin-top:3px"><i style="width:${(pct*100).toFixed(1)}%"></i></div>
          </div>
        </div>
        ${S.flags.testUsed?`<div class="tiny vi" style="margin-top:8px">
          Cette partie a utilisé les outils de test.</div>`:""}
      </div>
      <div class="tabs">
        ${[["stats","Résumé"],["ach","Succès"],["cards","Cartes"],["cos","Apparence"],["set","Réglages"]]
          .map(([k,n])=>`<button class="${PROF_TAB===k?"on":""}" data-act="proftab" data-t="${k}">${n}</button>`).join("")}
      </div>
      ${this[PROF_TAB]()}`;
  },
  stats(){
    const t = (k,v,cls)=>`<div class="tile ${cls||""}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    const rows = [
      ["Captures totales", fmt(S.stats.catches)],
      ["Meilleure série", S.stats.bestStreak],
      ["Évolutions", S.stats.evolutions],
      ["Prises à la sonde", S.stats.fish],
      ["Expéditions", `${S.stats.expWins}/${S.stats.expRuns}`],
      ["Poké-Poker", S.stats.pokerWins],
      ["Meilleure ante", S.pokerMeta.bestAnte||0],
      ["Énergie produite", fmt(S.stats.energyTotal)],
      ["Connexion", `${S.login.days}j (max ${S.login.best})`],
      ["Dépenses", fmt(S.stats.spend)]
    ];
    return `
      ${buddyStrip()}
      <div class="tiles" style="margin-bottom:10px">
        ${t("Intégrité", S.integrity.toFixed(1)+"%", "accent")}
        ${t("Pokédex", dexTotal()+"/386", "accent")}
        ${t("Chromatiques", S.stats.shinies, "gold")}
        ${t("Gardiens", S.bosses.length+"/9", "gold")}
        ${cycleN()?t("Cycle", cycleN()+1, "accent"):""}
        ${(S.zero||0)?t("Noyaux Zéro", S.zero, "gold"):""}
      </div>
      <div class="panel">
        ${rows.map(([k,v])=>`<div class="row between tiny" style="padding:3px 0">
          <span class="muted">${k}</span><b class="mono-num">${v}</b></div>`).join("")}
      </div>
      <div class="panel bracket">
        <div class="h sm">PROGRESSION DU RÉCIT</div>
        <div class="row between tiny"><span class="muted">Scènes vues</span>
          <b>${S.story.length} / ${STORY.length}</b></div>
        <div class="bar" style="margin-top:5px"><i style="width:${S.story.length/STORY.length*100}%"></i></div>
        ${S.flags.climax?`<div class="tiny cy" style="margin-top:7px">Couche Zéro active —
          les entités chromatiques réapparaissent en nombre anormal.</div>`:""}
      </div>
      <div class="panel">
        <div class="row between tiny"><span class="muted">Succès obtenus</span>
          <b>${S.ach.length} / ${ACHIEVEMENTS.length}</b></div>
        <div class="bar" style="margin-top:5px"><i style="width:${S.ach.length/ACHIEVEMENTS.length*100}%"></i></div>
      </div>`;
  },
  ach(){
    const got = ACHIEVEMENTS.filter(a=>S.ach.includes(a.id));
    const rest = ACHIEVEMENTS.filter(a=>!S.ach.includes(a.id));
    const card = a => {
      const has = S.ach.includes(a.id);
      const hide = a.hid && !has;
      return `<div class="ach ${has?"got":""} ${hide?"hidden-ach":""}">
        <div class="i">${ic(has?"trophy":"lock")}</div>
        <div class="grow"><div class="tiny"><b>${hide?"Succès caché":esc(a.n)}</b></div>
          <div class="tiny muted">${hide?"Conditions non révélées.":esc(a.d)}</div>
          ${has&&a.rw?`<div class="tiny ok">${esc(rewardText(a.rw))}</div>`:""}</div>
      </div>`;
    };
    return `<div class="tiny muted" style="margin-bottom:7px">${got.length} obtenus sur ${ACHIEVEMENTS.length}
      (dont ${ACHIEVEMENTS.filter(a=>a.hid).length} cachés)</div>
      <div class="list">${got.map(card).join("")}${rest.map(card).join("")}</div>`;
  },
  cards(){
    const owned = cardOwnedCount(), tot = cardTotal();
    const best = CARD_ORDER.slice().reverse().find(sr=>CARD_MONS.some(id=>cardHas(sr,id)));
    return `
      <div class="panel bracket">
        <div class="row">
          <div class="ring">
            <svg viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="23" fill="none" stroke="#1e2d49" stroke-width="5"/>
              <circle cx="27" cy="27" r="23" fill="none" stroke="var(--amber)" stroke-width="5"
                stroke-dasharray="${(owned/tot*144.5).toFixed(1)} 999" stroke-linecap="round"/>
            </svg><span class="val" style="color:var(--amber)">${owned}</span>
          </div>
          <div class="grow">
            <div class="h sm" style="margin:0">COLLECTION</div>
            <div class="tiny muted">${owned} illustrations sur ${tot}.</div>
            ${best?`<div class="tiny" style="color:${CARD_SERIES_DEF[best].c};margin-top:3px">
              Meilleure série obtenue : ${esc(CARD_SERIES_DEF[best].n)}</div>`:""}
          </div>
        </div>
      </div>
      <button class="btn pri wide" data-act="goto" data-to="cards">Ouvrir la collection</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="cardcode"
        ${owned?"":"disabled"}>Générer un code d'échange</button>`;
  },
  cos(){
    const group = t => Object.entries(COSMETICS).filter(([id,c])=>c.t===t);
    const sec = (t, label, key) => `
      <div class="h sm">${label}</div>
      <div class="wrap" style="margin-bottom:9px">
        ${group(t).map(([id,c])=>{
          const has = S.cos.owned.includes(id);
          return `<button class="chip ${S.cos[key]===id?"on":""}" data-act="setcos" data-k="${key}" data-id="${id}"
            ${has?"":"disabled style='opacity:.35'"}>${has?"":ic("lock")} ${esc(c.n)}</button>`;
        }).join("")}
      </div>`;
    return sec("title","TITRE","title") + sec("frame","CADRE","frame") + sec("bg","FOND","bg") + sec("fx","EFFET","fx") +
      `<div class="panel">
        <div class="h sm">AVATAR</div>
        <div class="row" style="gap:11px">
          <div class="avatar" style="width:60px;height:60px">${avatarHtml(46)}</div>
          <div class="grow">
            <div class="tiny">${esc((avatarPool().find(a=>a.k===avatarKey())||{n:"—"}).n)}</div>
            <div class="tiny muted">Choisissez l'image qui vous représente. Certaines pièces
              se débloquent en levant des verrous ou en terminant le récit.</div>
          </div>
        </div>
        <button class="btn pri wide sm" style="margin-top:9px" data-act="pickavatar">Changer d'avatar</button>
      </div>`;
  },
  set(){
    const sw = (k,label,desc)=>`
      <div class="row between" style="padding:7px 0">
        <div class="grow"><div class="tiny">${label}</div>
          <div class="tiny dim">${desc}</div></div>
        <button class="switch ${S.settings[k]?"on":""}" data-act="toggleset" data-k="${k}"
          aria-label="${label}"><i></i></button>
      </div>`;
    return `
      <div class="panel">
        <div class="h sm">PRÉFÉRENCES</div>
        ${sw("sfx","Effets sonores","Sons de capture, de combat et d'interface")}
        ${sw("haptics","Vibrations","Retour haptique sur les actions")}
        ${sw("skill","Visée manuelle","Mini-jeu d'adresse avant chaque lancer : bonus jusqu'à ×1.25, jamais de malus")}
      </div>

      <div class="panel" style="border-color:var(--violet)">
        <div class="h sm" style="color:var(--violet)">OUTILS DE TEST</div>
        <div class="tiny muted" style="margin-bottom:4px">Ajoute un bouton flottant donnant accès à des
          raccourcis de développement : monnaies, niveaux, Pokédex, verrous, scènes, simulation de jour.
          L'état reste cohérent et sauvegardable.</div>
        ${sw("admin","Activer le panneau de test","Bouton violet en bas à droite")}
      </div>

      <div class="panel">
        <div class="h sm">ARCHIVES ET PRESTIGE</div>
        <div class="btn-grid c2">
          <button class="btn sm" data-act="goto" data-to="journal">Journal des scènes</button>
          <button class="btn sm ${cycleReady()?"gold":""}" data-act="goto" data-to="cycle">
            Nouveau Cycle${cycleN()?` (${cycleN()})`:""}</button>
        </div>
      </div>

      <div class="panel">
        <div class="h sm">EN LIGNE</div>
        <div class="tiny muted">Sauvegarde distante, classements et échange de cartes entre Archivistes.</div>
        <div class="row between tiny" style="margin-top:5px"><span class="muted">État</span>
          <span>${netStatusLine()}</span></div>
        <button class="btn wide sm" style="margin-top:8px" data-act="goto" data-to="online">
          Ouvrir l'espace en ligne</button>
      </div>

      <div class="panel">
        <div class="h sm">SAUVEGARDE LOCALE</div>
        <div class="tiny muted">${Store.available
          ? "Stockage local actif : la partie est conservée sur cet appareil."
          : "Stockage local indisponible dans cet environnement : la partie ne survivra pas à la fermeture. Téléchargez le fichier ou hébergez-le pour une sauvegarde réelle."}</div>
        <div class="btn-grid c2" style="margin-top:9px">
          <button class="btn sm" data-act="exportsave">Exporter</button>
          <button class="btn sm" data-act="importsave">Importer</button>
        </div>
      </div>

      <div class="panel">
        <div class="h sm">NOTIFICATIONS</div>
        <div class="tiny muted">Rappel quotidien lorsque le tampon PokéBox est de nouveau disponible.</div>
        <button class="btn sm wide" style="margin-top:8px" data-act="asknotif">Autoriser les notifications</button>
      </div>

      <div class="panel danger">
        <div class="h sm" style="color:var(--magenta)">ZONE DANGEREUSE</div>
        <button class="btn dan wide" data-act="resetsave">Réinitialiser la partie</button>
      </div>

      <div class="panel">
        <div class="tiny dim">Jeu de fan non officiel, sans but lucratif. Pokémon est une marque de
          Nintendo / Creatures Inc. / GAME FREAK inc. Sprites animés fournis par les dépôts communautaires
          PokeAPI et Pokémon Showdown.</div>
      </div>`;
  }
};
ACTIONS.proftab = d => { PROF_TAB = d.t; refresh(); };
ACTIONS.setcos = d => {
  if(!S.cos.owned.includes(d.id)) return;
  S.cos[d.k] = d.id; save(); refresh();
};
ACTIONS.toggleset = d => {
  S.settings[d.k] = !S.settings[d.k];
  if(d.k === "admin")
    toast(S.settings.admin ? "Panneau de test activé" : "Panneau de test désactivé",
          S.settings.admin ? "warn" : "", "gear");
  save(); refresh();
};
ACTIONS.rename = () => {
  sheet(`${sheetHead("Identifiant d'archiviste")}
    <input id="nm-in" maxlength="16" value="${esc(S.name)}"
      style="width:100%;padding:9px;background:#0a1322;border:1px solid var(--line);color:var(--ink)">
    <button class="btn pri wide" style="margin-top:9px" data-act="renameok">Valider</button>`, true);
  setTimeout(()=>document.getElementById("nm-in")?.focus(), 80);
};
ACTIONS.renameok = () => {
  const v = (document.getElementById("nm-in")?.value || "").trim();
  if(v) S.name = v.slice(0,16);
  closeSheet(); save(); refresh();
};
ACTIONS.pickavatar = () => {
  const pool = avatarPool();
  if(!pool.length){ toast("Archivez d'abord une espèce", "bad", "cross"); return; }
  const groups = {};
  for(const a2 of pool) (groups[a2.g] = groups[a2.g] || []).push(a2);
  const cur = avatarKey();
  sheet(`${sheetHead("Choisir un avatar")}
    ${Object.entries(groups).map(([g, list])=>`
      <div class="h sm" style="margin-top:9px">${esc(g.toUpperCase())}
        <span class="tiny dim">${list.filter(x=>!x.locked).length}/${list.length}</span></div>
      <div class="avgrid">
        ${list.slice(0, 60).map(a2=>`
          <div class="avcell ${cur===a2.k?"on":""} ${a2.locked?"locked":""}"
            ${a2.locked?"":`data-act="setavatar" data-k="${a2.k}"`}
            title="${esc(a2.locked ? a2.why : a2.n)}">
            ${a2.locked
              ? `<span class="spr ghosted">${a2.k==="pz"||a2.k==="mn"?"":""}</span>${ic("lock")}`
              : (a2.k==="pz" ? pzFace(pzMood(), 42)
                 : a2.k==="mn" ? `<span class="spr missing" style="width:42px;height:42px"></span>`
                 : `<span class="sprbox" style="width:42px;height:42px">
                     ${sprite(a2.id, !!a2.shiny, "")}</span>`)}
            <span class="avnm">${esc(a2.n)}</span>
          </div>`).join("")}
      </div>`).join("")}`);
};
ACTIONS.setavatar = d => { S.cos.avatar = d.k; closeSheet(); save(); refresh(); toast("Avatar modifié", "", "check"); };

ACTIONS.cardcode = () => {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({n:S.name, c:S.cards}))));
  sheet(`${sheetHead("Code d'échange")}
    <div class="tiny muted" style="margin-bottom:6px">Copiez ce code. La version en ligne pourra l'importer
      pour vérifier votre collection.</div>
    <textarea readonly style="width:100%;height:110px;background:#0a1322;border:1px solid var(--line);
      color:var(--cyan);font-size:10px;padding:7px">${esc(payload)}</textarea>`);
};
ACTIONS.exportsave = () => {
  const payload = JSON.stringify(S);
  sheet(`${sheetHead("Exporter la sauvegarde")}
    <div class="tiny muted" style="margin-bottom:6px">Copiez l'intégralité du texte et conservez-le.</div>
    <textarea id="exp-t" readonly style="width:100%;height:150px;background:#0a1322;border:1px solid var(--line);
      color:var(--ink-dim);font-size:9px;padding:7px">${esc(payload)}</textarea>
    <button class="btn pri wide" style="margin-top:8px" data-act="copysave">Copier</button>`);
};
ACTIONS.copysave = () => {
  const t = document.getElementById("exp-t");
  t.select();
  try { document.execCommand("copy"); toast("Sauvegarde copiée", "", "check"); }
  catch(e){ toast("Copie impossible — sélectionnez manuellement", "bad", "cross"); }
};
ACTIONS.importsave = () => {
  sheet(`${sheetHead("Importer une sauvegarde")}
    <div class="tiny bad" style="margin-bottom:6px">La partie en cours sera remplacée.</div>
    <textarea id="imp-t" placeholder="Collez ici le texte exporté"
      style="width:100%;height:150px;background:#0a1322;border:1px solid var(--line);color:var(--ink);
      font-size:9px;padding:7px"></textarea>
    <button class="btn dan wide" style="margin-top:8px" data-act="importok">Remplacer la partie</button>`);
};
ACTIONS.importok = () => {
  const v = document.getElementById("imp-t")?.value || "";
  try {
    const d = JSON.parse(v);
    if(!d || typeof d !== "object" || !d.dex) throw new Error("format");
    S = deepFill(d, newState());
    save(); closeSheet(); applyCorruption(); go("capture");
    toast("Sauvegarde importée", "", "check");
  } catch(e){ toast("Texte illisible", "bad", "cross"); }
};
ACTIONS.asknotif = () => {
  if(!("Notification" in window)){ toast("Non pris en charge sur cet appareil", "bad", "cross"); return; }
  Notification.requestPermission().then(p=>{
    toast(p === "granted" ? "Notifications autorisées" : "Notifications refusées", p==="granted"?"":"bad",
      p==="granted"?"check":"cross");
  });
};
ACTIONS.resetsave = () => {
  sheet(`${sheetHead("Réinitialiser ?")}
    <div class="tiny bad">Toute la progression sera effacée : Pokédex, niveaux, cartes, récit.
      Cette action est définitive.</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn ghost" data-act="closesheet">Annuler</button>
      <button class="btn dan" data-act="resetok">Effacer</button></div>`, true);
};
ACTIONS.resetok = () => {
  Store.del(SAVE_KEY);
  S = newState();
  ENC = null;
  save(); closeSheet(); applyCorruption(); go("capture");
  playStory("intro");
};
