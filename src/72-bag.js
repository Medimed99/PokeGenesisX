/* ============================================================
   72 — SAC
   Tout ce que le joueur possède, au même endroit, avec l'usage
   possible sur place. Rien ne s'achète plus « dans le vide » :
   un objet acheté se range ici et s'active quand on le décide.
   ============================================================ */

let BAG_TAB = "balls";

function bagCounts(){
  const nBalls   = Object.values(S.balls || {}).reduce((a,b)=>a+b, 0);
  const nBerries = Object.values(S.berries || {}).reduce((a,b)=>a+b, 0);
  const nBoosts  = Object.values(S.bagBoosts || {}).reduce((a,b)=>a+b, 0);
  const nItems   = (S.items.potion||0) + (S.items.revive||0) + (S.items.radar||0);
  const nStones  = Object.values(S.stones || {}).reduce((a,b)=>a+b, 0);
  const nTreas   = Object.values(S.treasures || {}).reduce((a,b)=>a+b, 0);
  const nHeld    = heldOwned().length;
  return {balls:nBalls, berries:nBerries, boosts:nBoosts, items:nItems,
          stones:nStones, treasures:nTreas, held:nHeld};
}

/* une ligne d'objet : visuel, nom, description, quantité, action éventuelle */
function bagRow(opts){
  return `<div class="bagrow">
    <div class="bag-ic">${opts.spr !== undefined
      ? `<span class="sprbox" style="width:34px;height:34px">${sprite(opts.spr,false,"")}</span>`
      : ic(opts.icon || "star")}</div>
    <div class="grow">
      <div class="row between" style="gap:6px">
        <span class="bag-n">${esc(opts.n)}</span>
        <span class="bag-q mono-num">×${fmt(opts.q)}</span>
      </div>
      <div class="bag-d">${opts.d}</div>
      ${opts.extra || ""}
    </div>
    ${opts.action || ""}
  </div>`;
}

SCREENS.bag = {
  html(){
    const c = bagCounts();
    /* le sac ne liste que ce sur quoi on agit ; le reste se consulte en un coup d'oeil */
    const tabs = [
      ["boosts","Boosts",c.boosts], ["items","Objets",c.items],
      ["held","Tenus",c.held], ["treasures","Trésors",c.treasures]
    ];
    return `
      <div class="h">${ic("box")} SAC ${infoBtn("bag")}</div>
      <div class="sub">Ce qui s'active se trouve ici. Les conteneurs, baies et pierres s'utilisent
        là où ils servent : l'écran de capture et le Pokédex.</div>
      ${this.reserves()}
      <div class="chipbar">
        ${tabs.map(([k,n,q])=>`<button class="chip ${BAG_TAB===k?"on":""}" data-act="bagtab" data-t="${k}">
          ${n}${q?` <b>${fmt(q)}</b>`:""}</button>`).join("")}
      </div>
      ${this[BAG_TAB]()}
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="shop">
        Aller à la boutique</button>`;
  },

  /* consommables rattaches a un ecran precis : on les montre, on n'y agit pas */
  reserves(){
    const line = (label, entries, where, to) => {
      const items = entries.filter(([,q])=>q > 0);
      if(!items.length) return "";
      return `<div class="resrow">
        <div class="res-l">${label}</div>
        <div class="grow wrap" style="gap:4px">
          ${items.map(([n,q,icon])=>`<span class="reschip">${ic(icon)} ${esc(n)} <b>${q}</b></span>`).join("")}
        </div>
        <button class="btn xs ghost" data-act="goto" data-to="${to}">${where}</button>
      </div>`;
    };
    const balls   = Object.entries(BALLS).map(([k,b])=>[b.name.split(" ")[0], S.balls[k]||0, b.icon]);
    const berries = Object.entries(BERRIES).map(([k,b])=>[b.name.replace("Baie ",""), S.berries[k]||0, "seed"]);
    const stones  = Object.entries(STONES).map(([k,st])=>[st.name.replace("Pierre ",""), S.stones[k]||0, "stone"]);
    const body = line("Conteneurs", balls, "Capture", "capture")
               + line("Baies", berries, "Capture", "capture")
               + line("Pierres", stones, "Pokédex", "dex");
    if(!body) return "";
    return `<div class="panel tight reserves">
      <div class="h sm">RÉSERVES</div>${body}</div>`;
  },

  balls(){
    const rows = Object.entries(BALLS).filter(([k])=>(S.balls[k]||0) > 0);
    if(!rows.length) return this.empty("Aucun conteneur. Sans ball, aucune capture n'est possible.");
    return `<div class="baglist">
      ${rows.map(([k,b])=>bagRow({icon:b.icon, n:b.name, q:S.balls[k], d:esc(b.d),
        extra:`<div class="tiny cy">Multiplicateur de prise ×${b.mult >= 255 ? "∞" : b.mult}</div>`,
        action:`<button class="btn xs ${selBall()===k?"pri":""}" data-act="bagselball" data-b="${k}">
          ${selBall()===k?"Équipé":"Équiper"}</button>`})).join("")}
    </div>`;
  },

  berries(){
    const rows = Object.entries(BERRIES).filter(([k])=>(S.berries[k]||0) > 0);
    if(!rows.length) return this.empty("Aucune baie. Elles se consomment avant un lancer et n'ont d'effet que sur la rencontre en cours.");
    return `<div class="baglist">
      ${rows.map(([k,b])=>{
        const on = S.buffs[k] || (k === "micle" && S.shinyCharge > 0);
        return bagRow({icon:"seed", n:b.name, q:S.berries[k], d:esc(b.d),
          extra: on ? `<div class="tiny ok">Active sur la prochaine rencontre</div>` : "",
          action:`<button class="btn xs ${on?"":"pri"}" data-act="bagberry" data-k="${k}"
            ${on?"disabled":""}>${on?"Active":"Utiliser"}</button>`});
      }).join("")}
    </div>`;
  },

  boosts(){
    const owned = Object.entries(S.bagBoosts || {}).filter(([,q])=>q > 0);
    const on = activeBoosts();
    return `
      ${on.length ? `<div class="panel tight">
        <div class="h sm">EN COURS</div>
        ${on.map(id=>{ const b = BOOSTS[id];
          return `<div class="row between tiny" style="padding:3px 0">
            <span>${esc(b.n)}</span><b class="cy mono-num">${fmtTime(boostLeft(b.k))}</b></div>`;}).join("")}
      </div>` : ""}
      ${owned.length ? `<div class="baglist">
        ${owned.map(([id,q])=>{ const b = BOOSTS[id];
          return bagRow({spr:b.spr, n:b.n, q, d:esc(b.d),
            extra:`<div class="tiny dim">Durée ${b.min} minutes</div>`,
            action:`<button class="btn xs pri" data-act="bagboost" data-id="${id}">Activer</button>`});
        }).join("")}
      </div>` : this.empty("Aucun boost en réserve. Ils s'achètent en boutique et s'activent quand vous voulez.")}`;
  },

  items(){
    const list = [];
    if(S.items.potion) list.push(bagRow({icon:"heart", n:"Restauration", q:S.items.potion,
      d:"Rend 55% des points de vie d'un Pokémon, pendant un combat.",
      extra:`<div class="tiny dim">S'utilise depuis l'écran de combat.</div>`}));
    if(S.items.revive) list.push(bagRow({icon:"refresh", n:"Réindexation", q:S.items.revive,
      d:"Remet en jeu un Pokémon désindexé, à la moitié de ses points de vie.",
      extra:`<div class="tiny dim">S'utilise depuis l'écran de combat.</div>`}));
    if(S.items.radar) list.push(bagRow({icon:"boss", n:"Radar Légendaire", q:S.items.radar,
      d:"Force une rencontre légendaire dans le secteur actif.",
      action:`<button class="btn xs dan" data-act="bagradar">Activer</button>`}));
    if(!list.length) return this.empty("Aucun objet. Les restaurations servent en combat, le radar force une rencontre légendaire.");
    return `<div class="baglist">${list.join("")}</div>`;
  },

  stones(){
    const rows = Object.entries(S.stones || {}).filter(([,q])=>q > 0);
    if(!rows.length) return this.empty("Aucune pierre. Certaines évolutions en exigent une, en plus des exemplaires et des PokéCoins.");
    return `<div class="baglist">
      ${rows.map(([k,q])=>bagRow({icon:"stone", n:STONES[k].name, q,
        d:"Requise par certaines réécritures d'espèce.",
        extra:`<div class="tiny dim">S'utilise depuis la fiche d'une espèce, dans le Pokédex.</div>`,
        action:`<button class="btn xs" data-act="goto" data-to="dex">Pokédex</button>`})).join("")}
    </div>`;
  },

  held(){
    const owned = heldOwned();
    if(!owned.length) return this.empty("Aucun objet tenu. On en trouve dans les archives scellées et les trésors d'expédition. Ils ne produisent leur effet que portés par un compagnon.");
    const eq = heldEquipped();
    return `<div class="baglist">
      ${owned.map(id=>{ const it = HELD_ITEMS[id];
        return bagRow({spr:it.spr, n:it.n, q:1, d:esc(it.d),
          extra:`<span class="tt rar r${it.rar}" style="--rc:${RARITY[it.rar].c}">${RARITY[it.rar].n}</span>`,
          action:`<button class="btn xs ${eq===id?"pri":""}" data-act="heldset" data-id="${eq===id?"":id}">
            ${eq===id?"Porté":"Porter"}</button>`});
      }).join("")}
      ${buddy() ? "" : `<div class="tiny bad" style="margin-top:8px">Aucun compagnon actif :
        les objets tenus ne produisent aucun effet.</div>`}
    </div>`;
  },

  treasures(){
    const rows = Object.entries(S.treasures || {}).filter(([,q])=>q > 0);
    if(!rows.length) return this.empty("Aucun trésor. La sonde en remonte, d'autant plus souvent qu'on descend profond.");
    return `
      <div class="panel tight">
        <div class="row between">
          <div class="tiny">Valeur totale</div>
          <button class="btn xs gold" data-act="sellall">Tout vendre · ${fmt(treasureValue())}</button>
        </div>
      </div>
      <div class="baglist">
        ${rows.map(([k,q])=>bagRow({spr:TREASURES[k].spr, n:TREASURES[k].n, q,
          d:"Sans usage. Se revend aux archives.",
          extra:`<div class="tiny gold-t">${fmt(TREASURES[k].sell)} PokéCoins pièce</div>`})).join("")}
      </div>`;
  },

  empty(msg){ return `<div class="empty">${esc(msg)}</div>`; }
};

ACTIONS.bagtab = d => { BAG_TAB = d.t; refresh(); };
ACTIONS.bagselball = d => { S.selBall = d.b; toast(BALLS[d.b].name + " équipée", "", "check"); save(); refresh(); };
ACTIONS.bagberry = d => { useBerry(d.k); refresh(); };
ACTIONS.bagboost = d => {
  const id = d.id;
  if(!(S.bagBoosts && S.bagBoosts[id] > 0)) return;
  S.bagBoosts[id]--;
  startBoost(id);
  save(); refresh();
};
ACTIONS.bagradar = () => { ACTIONS.useradar(); };
