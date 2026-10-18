/* ============================================================
   73b — POUVOIRS DES CARTES
   Une carte de légendaire n'est plus seulement une image : elle
   ouvre quelque chose ailleurs dans le jeu.

   Deux règles, pas une de plus :
   1. Toute carte d'un légendaire le fait apparaître au SANCTUAIRE
      de l'Expédition. Vaincu, il rejoint l'équipe pour le parcours.
   2. Chaque légendaire a, en plus, UN pouvoir propre : un deck au
      Poké-Poker, un programme au Poké-Poker, ou un objet vendu par
      Kecleon en Expédition.

   La force du pouvoir suit le nombre d'illustrations possédées
   de ce légendaire : 1 = Éclat I, 2 = Éclat II, 3 ou plus = Éclat III.
   Collectionner les anciens rendus a donc un sens en jeu, pas
   seulement dans l'album.
   ============================================================ */

/* trois paliers, lus partout avec la même fonction */
function cardTier(id){
  if(typeof cardVariants !== "function") return 0;
  let n = 0;
  for(const s of cardVariants(id)) if(cardHas(s, id)) n++;
  return Math.min(3, n);
}
function tierVal(id, arr){ const t = cardTier(id); return arr[Math.max(0, t - 1)]; }
const TIER_NAMES = ["", "Éclat I", "Éclat II", "Éclat III"];

/* m : poker | exp ; k : deck | joker | item */
const CARD_POWERS = {
  150: {m:"poker", k:"deck", n:"Deck Psychique", ic:"cards",
        d:t=>`Un deck bâti sur les familles Psy. Chaque carte Psy marquée : ×${[1.1, 1.15, 1.2][t - 1]} Mult.`},
  250: {m:"poker", k:"deck", n:"Deck Arc-en-ciel", ic:"cards",
        d:t=>`À chaque manche, chaque carte a ${[8, 11, 15][t - 1]} % de chances d'être arc-en-ciel : elle copie l'espèce qui complète le mieux ta main.`},
  386: {m:"poker", k:"deck", n:"Deck Équilibre", ic:"cards",
        d:t=>`Avant chaque calcul, Jetons et Mult s'équilibrent (on prend leur moyenne). En échange, chaque verrou demande ×${[2, 1.8, 1.6][t - 1]} de score.`},
  384: {m:"poker", k:"deck", n:"Deck Céleste", ic:"cards",
        d:t=>`${[2, 3, 4][t - 1]} légendaires rejoignent le deck dès le départ.`},
  249: {m:"poker", k:"deck", n:"Deck des Profondeurs", ic:"cards",
        d:t=>`Un deck resserré à ${[44, 40, 36][t - 1]} cartes : moins de familles, plus de doublons, donc plus de paires et de brelans.`},

  144: {m:"poker", k:"joker", n:"Plume de Givre", ic:"cards",
        d:t=>`Programme : +${[4, 6, 8][t - 1]} Mult par carte Eau, Glace ou Vol marquée.`},
  145: {m:"poker", k:"joker", n:"Plume d'Orage", ic:"cards",
        d:t=>`Programme : +${[30, 45, 60][t - 1]} Jetons par carte Électrik ou Vol marquée.`},
  146: {m:"poker", k:"joker", n:"Plume Ardente", ic:"cards",
        d:t=>`Programme : ×${[1.1, 1.15, 1.2][t - 1]} Mult par carte Feu ou Vol marquée.`},
  151: {m:"poker", k:"joker", n:"Gène Ancestral", ic:"cards",
        d:t=>`Programme : après chaque main jouée, ${[25, 40, 60][t - 1]} % de chances que la combinaison gagne un niveau.`},
  251: {m:"poker", k:"joker", n:"Voyage Temporel", ic:"cards",
        d:t=>`Programme : la première main de chaque manche reçoit ×${[1.5, 1.75, 2][t - 1]} Mult.`},
  385: {m:"poker", k:"joker", n:"Vœu Exaucé", ic:"cards",
        d:t=>`Programme : +${[2, 3, 4][t - 1]} Octets par manche remportée.`},

  243: {m:"exp", k:"item", n:"Crinière d'Orage", ic:"map",
        d:()=>"+40% de Vitesse et 30% de chances d'agir en premier.", fx:{spe:1.40, quick:0.30}},
  244: {m:"exp", k:"item", n:"Flamme Sacrée", ic:"map",
        d:()=>"+25% de dégâts et +10% de PV maximum.", fx:{atk:1.25, hp:1.10}},
  245: {m:"exp", k:"item", n:"Onde Pure", ic:"map",
        d:()=>"Rend 12% des PV max du porteur à la fin de chaque tour.", fx:{regen:0.12}},
  377: {m:"exp", k:"item", n:"Noyau de Roche", ic:"map",
        d:()=>"+50% de Défense et +10% de PV maximum.", fx:{def:1.50, hp:1.10}},
  378: {m:"exp", k:"item", n:"Noyau de Glace", ic:"map",
        d:()=>"+50% de Défense Spéciale. L'assaillant perd 6% de ses PV à chaque coup.", fx:{spd:1.50, thorns:0.06}},
  379: {m:"exp", k:"item", n:"Noyau d'Acier", ic:"map",
        d:()=>"+25% dans les deux Défenses. Survit une fois à un coup fatal si ses PV étaient pleins.", fx:{def:1.25, spd:1.25, sash:1}},
  380: {m:"exp", k:"item", n:"Rosée d'Âme", ic:"map",
        d:()=>"Rend 22% des dégâts infligés, et 4% des PV max à chaque tour.", fx:{drain:0.22, regen:0.04}},
  381: {m:"exp", k:"item", n:"Prisme Éon", ic:"map",
        d:()=>"Coups critiques à 25% et +12% de dégâts.", fx:{crit:0.25, atk:1.12}},
  382: {m:"exp", k:"item", n:"Orbe Bleu", ic:"map",
        d:()=>"Dégâts ×2.3 sur une attaque super efficace, et +10% de PV maximum.", fx:{superx:2.30, hp:1.10}},
  383: {m:"exp", k:"item", n:"Orbe Rouge", ic:"map",
        d:()=>"+40% de dégâts. Le porteur perd 5% de ses PV max à chaque attaque.", fx:{atk:1.40, recoil:0.05}}
};
function cardPower(id){ return CARD_POWERS[id] || null; }
function cardPowerDesc(id, t){ const P = CARD_POWERS[id]; return P ? P.d(Math.max(1, t || cardTier(id) || 1)) : ""; }
function cardPowerWhere(id){
  const P = CARD_POWERS[id]; if(!P) return "";
  return P.k === "deck" ? "Poké-Poker · deck" : P.k === "joker" ? "Poké-Poker · programme" : "Expédition · boutique Kecleon";
}

/* ============================================================
   POKÉ-POKER : les programmes de cartes
   Ils rejoignent la réserve de la boutique quand la carte est
   possédée ; leur effet suit l'Éclat au moment où ils marquent.
   ============================================================ */
const CARD_JOKERS = [
  {id:"jc_144", card:144, n:"Plume de Givre", rar:2, cost:8, spr:144,
   onCard:(c, x)=>{ if(POKE[c.id].types.some(t=>t === 11 || t === 15 || t === 3)) x.mult += tierVal(144, [4, 6, 8]); }},
  {id:"jc_145", card:145, n:"Plume d'Orage", rar:2, cost:8, spr:145,
   onCard:(c, x)=>{ if(POKE[c.id].types.some(t=>t === 13 || t === 3)) x.chips += tierVal(145, [30, 45, 60]); }},
  {id:"jc_146", card:146, n:"Plume Ardente", rar:2, cost:9, spr:146,
   onCard:(c, x)=>{ if(POKE[c.id].types.some(t=>t === 10 || t === 3)) x.mult *= tierVal(146, [1.1, 1.15, 1.2]); }},
  {id:"jc_151", card:151, n:"Gène Ancestral", rar:2, cost:9, spr:151,
   onAfter:(x)=>{
     const P = S.poker; if(!P || !x || !x.handKey) return;
     if(rng() < tierVal(151, [0.25, 0.4, 0.6])){
       P.levels[x.handKey] = (P.levels[x.handKey] || 0) + 1;
       toast(`Gène Ancestral : ${HANDS_BY_ID[x.handKey].n} niveau ${P.levels[x.handKey] + 1}`, "warn", "bolt");
     }
   }},
  {id:"jc_251", card:251, n:"Voyage Temporel", rar:2, cost:9, spr:251,
   onHand:x=>{ if((x.st.roundHands || 0) === 0) x.mult *= tierVal(251, [1.5, 1.75, 2]); }},
  {id:"jc_385", card:385, n:"Vœu Exaucé", rar:1, cost:7, spr:385, passive:"wish"}
];
for(const j of CARD_JOKERS){
  Object.defineProperty(j, "d", {get(){ return cardPowerDesc(j.card).replace(/^Programme : /, "") + ` (${TIER_NAMES[Math.max(1, cardTier(j.card))]})`; }, enumerable:true});
  JOKERS.push(j);
}
/* un programme de carte n'existe que si la carte est possédée */
function jokerAvail(j){ return !j.card || cardTier(j.card) > 0; }
/* les Octets du Vœu : lus par la fin de manche */
function pkWishBonus(P){
  let b = 0;
  for(const j of (P.jokers || [])) if(jokerDef(j)?.passive === "wish") b += tierVal(385, [2, 3, 4]);
  return b;
}

/* ============================================================
   POKÉ-POKER : les decks
   ============================================================ */
const PK_DECKS = [
  {id:"std", n:"Deck Standard", card:0, d:"52 cartes, quatorze familles au hasard."},
  {id:"psy", n:"Deck Psychique", card:150},
  {id:"rainbow", n:"Deck Arc-en-ciel", card:250},
  {id:"balance", n:"Deck Équilibre", card:386},
  {id:"sky", n:"Deck Céleste", card:384},
  {id:"deep", n:"Deck des Profondeurs", card:249}
];
function pkDeckDef(id){ return PK_DECKS.find(d=>d.id === id) || PK_DECKS[0]; }
function pkDeckOpen(id){ const d = pkDeckDef(id); return !d.card || cardTier(d.card) > 0; }
function pkDeckDesc(d){ return d.card ? cardPowerDesc(d.card) : d.d; }
function pkDeckId(){ return (S.poker && S.poker.deckId) || "std"; }
function pkDeckTier(){ const d = pkDeckDef(pkDeckId()); return d.card ? Math.max(1, cardTier(d.card)) : 0; }

/* les familles qui contiennent au moins un Pokémon Psy */
function psyFamilies(){
  const out = [];
  for(const k in FAM_MEMBERS){
    const r = +k, mem = FAM_MEMBERS[k] || [];
    if(r > 386 || !POKE[r] || POKE[r].leg) continue;
    if(mem.some(id=>POKE[id] && POKE[id].types.includes(14))) out.push(r);
  }
  return out;
}
/* construit le deck de départ selon le deck choisi */
function pkBuildDeck(deckId){
  const d = pkDeckDef(deckId), t = d.card ? Math.max(1, cardTier(d.card)) : 0;
  if(d.id === "psy"){
    const psy = shuffle(psyFamilies()).slice(0, 7);
    const rest = shuffle(BASE_FAMS.filter(r=>!psy.includes(r))).slice(0, Math.max(0, 14 - psy.length));
    return newDeck({fams:psy.concat(rest)});
  }
  if(d.id === "deep") return newDeck({famCount:10, size:[44, 40, 36][t - 1]});
  const deck = newDeck();
  if(d.id === "sky"){
    const legs = shuffle(CARD_MONS.slice()).slice(0, [2, 3, 4][t - 1]);
    /* les légendaires remplacent les derniers doublons : le deck garde sa taille */
    legs.forEach((id, i)=>{ deck[deck.length - 1 - i] = {u:deck[deck.length - 1 - i].u, id, shiny:false, ed:""}; });
  }
  return deck;
}
/* à chaque manche : l'arc-en-ciel se redistribue */
function pkDeckOnRound(P){
  if(P.deckId !== "rainbow") return;
  const p = tierVal(250, [0.08, 0.11, 0.15]);
  for(const c of P.draw) c.rb = rng() < p;
}
function pkDeckTargetMul(P){ return P.deckId === "balance" ? tierVal(386, [2, 1.8, 1.6]) : 1; }

/* une carte arc-en-ciel copie l'espèce d'une autre carte jouée :
   on essaie chaque possibilité et on garde la meilleure combinaison */
function evalHandRainbow(cards, raw){
  const rbs = cards.filter(c=>c.rb);
  const opts = [...new Set(cards.filter(c=>!c.rb).map(c=>c.id))];
  if(!rbs.length || !opts.length) return raw(cards);
  let best = null, bv = -1;
  const sub = new Map();
  const rec = i => {
    if(i === rbs.length){
      const clone = cards.map(c=>sub.has(c.u) ? Object.assign({}, c, {id:sub.get(c.u)}) : c);
      const ev = raw(clone), b = handBase(ev.key), v = b.chips * b.mult;
      if(v > bv){ bv = v; best = {key:ev.key, n:ev.n, scoring:ev.scoring.map(sc=>cards.find(c=>c.u === sc.u) || sc)}; }
      return;
    }
    for(const id of opts.concat([rbs[i].id])){ sub.set(rbs[i].u, id); rec(i + 1); }
    sub.delete(rbs[i].u);
  };
  rec(0);
  return best || raw(cards);
}

/* ============================================================
   EXPÉDITION : les objets de Kecleon
   Ils ne tombent jamais des coffres : seule la boutique les vend,
   et seulement si la carte est possédée. Éclat III : moins cher,
   et toujours en rayon.
   ============================================================ */
const CARD_ITEM_IDS = [];
for(const k in CARD_POWERS){
  const P = CARD_POWERS[k];
  if(P.k !== "item") continue;
  const id = "c_" + k;
  EXP_ITEMS[id] = Object.assign({n:P.n, rar:3, spr:+k, card:+k, d:P.d(1)}, P.fx);
  CARD_ITEM_IDS.push(id);
}
function cardShopWares(){
  const own = CARD_ITEM_IDS.filter(id=>cardTier(EXP_ITEMS[id].card) > 0);
  if(!own.length) return [];
  const sure = own.filter(id=>cardTier(EXP_ITEMS[id].card) >= 3);
  const rest = shuffle(own.filter(id=>!sure.includes(id)));
  const pickN = sure.concat(rest).slice(0, Math.max(2, Math.min(3, sure.length)));
  return pickN.map(id=>{
    const it = EXP_ITEMS[id], t = cardTier(it.card);
    return {k:"citem", id, n:it.n, d:it.d, p:[150, 120, 90][t - 1], ic:"", spr:it.spr, card:it.card};
  });
}

/* ============================================================
   EXPÉDITION : le Sanctuaire
   Une fois par parcours au plus, dans le deuxième secteur. Plus
   la collection est large, plus il a de chances d'exister.
   ============================================================ */
function cardSpeciesOwned(){ return CARD_MONS.filter(id=>cardTier(id) > 0); }
function sanctChance(){
  const n = cardSpeciesOwned().length;
  return n ? Math.min(0.75, 0.30 + n * 0.04) : 0;
}
/* tirage pondéré par l'Éclat : les légendaires qu'on a le plus collectionnés viennent plus souvent */
function sanctPick(){
  const pool = [];
  for(const id of cardSpeciesOwned()) for(let i = 0; i < cardTier(id); i++) pool.push(id);
  return pool.length ? pick(pool) : 0;
}
/* appelé à l'ouverture de chaque secteur */
function sanctPlace(run, mapIdx){
  if(!run || !run.map) return;
  /* décidé une fois, à l'ouverture du premier secteur */
  if(run.sanctAt === undefined) run.sanctAt = rng() < sanctChance() ? Math.min(1, (run.maps || 1) - 1) : -1;
  if(run.sanctAt !== mapIdx) return;
  const id = sanctPick(); if(!id) return;
  const ys = [3, 4].filter(y=>run.map[y]);
  if(!ys.length) return;
  const row = run.map[pick(ys)];
  const n = row[Math.floor(rng() * row.length)];
  n.t = "legend"; n.leg = id;
}
function sanctLevel(run){ return clamp(expEnemyLevel(run, 3), 5, 100); }

/* les deux scènes du Sanctuaire */
const SANCT_LINES = {
  144:"Le froid se lève avant lui. Tout ce qui bouge ici ralentit.",
  145:"L'air crépite. Chaque plume est une décharge en attente.",
  146:"La salle brûle sans se consumer. Il t'attendait.",
  150:"Il n'a pas besoin de te regarder pour savoir ce que tu penses.",
  151:"Il rit, quelque part. Il veut jouer — à sa manière.",
  243:"Un éclair traverse la salle et s'arrête net devant toi.",
  244:"Le sol tremble sous ses pas. Un volcan qui marche.",
  245:"L'eau du sanctuaire est parfaitement claire. Lui aussi.",
  249:"Une pression immense, venue d'en dessous. Les profondeurs t'observent.",
  250:"Sept couleurs se posent sur les murs. Il juge ceux qui viennent.",
  251:"Le temps hésite. Tu as déjà vécu cet instant, ou tu vas le vivre.",
  377:"Des points s'allument sur une paroi de pierre. Elle respire.",
  378:"Une glace plus ancienne que la couche elle-même. Elle se lève.",
  379:"Du métal qui pense. Il ne recule pas, jamais.",
  380:"Elle apparaît, disparaît, réapparaît. Elle veut savoir si tu es gentil.",
  381:"Il te montre une image : ton équipe, perdue. Il veut voir si tu y crois.",
  382:"Une marée monte depuis les murs. La salle devient océan.",
  383:"La terre s'ouvre. La chaleur te repousse d'un pas.",
  384:"Il descend du plafond comme si le plafond n'existait pas.",
  385:"Il dort. Une étoile sur son front s'allume quand tu approches.",
  386:"Sa forme change à chaque battement. Il t'analyse."
};
if(typeof XS_SCENES !== "undefined"){
  XS_SCENES.legend = function(run, p){
    const nm = POKE[p.id].name, t = cardTier(p.id);
    const stage = `<div class="xs-rays sanct"></div><div class="xs-sanct"></div>
      <div class="xs-legend">${sprBox(p.id, false, 150)}</div>
      <div class="xs-warn gold">SANCTUAIRE</div>`;
    const panel = `<div class="xs-kicker" style="color:#ffd24a">SANCTUAIRE LÉGENDAIRE · ${TIER_NAMES[Math.max(1, t)]}</div>
      <div class="xs-title">${esc(nm)}</div>
      <div class="xs-say">${esc(SANCT_LINES[p.id] || "Il t'attendait.")}</div>
      <div class="tiny dim" style="margin:6px 0">N.${p.lv} · seul, mais redoutable. Vaincu, il rejoint ton équipe pour ce parcours${t >= 2 ? `, avec ${t === 3 ? 4 : 2} niveaux d'avance` : ""}. Perdre ici met fin à l'expédition.</div>
      <button class="btn pri wide xs-go" data-act="xslegendgo">Affronter ${esc(nm)}</button>
      <button class="btn ghost wide" data-act="xslegendskip">Passer son chemin · +${40 + run.floor * 5} Bits</button>`;
    xsOpen("legend", "#ffd24a", stage, panel);
    try { arTone && arTone(196, .5, "triangle", .05, 392); } catch(e){}
  };
  XS_SCENES.sanctdone = function(run, p){
    const nm = POKE[p.id].name;
    const stage = `<div class="xs-sun"></div>${xsTeam(run, {walk:true, size:54})}`;
    const panel = `<div class="xs-kicker" style="color:#ffd24a">SANCTUAIRE</div>
      <div class="xs-title">${esc(nm)} rejoint l'équipe</div>
      <div class="xs-say">Niveau ${p.lvl}. Pour ce parcours, il marche avec toi.</div>
      <button class="btn pri wide" data-act="xsok">Continuer</button>`;
    xsOpen("sanctdone", "#ffd24a", stage, panel);
    try { Sfx.shiny(); } catch(e){}
  };
}
ACTIONS.xslegendgo = () => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "legend") return;
  const p = run.pend;
  xsClose();
  expFight(run, "legend", [{id:p.id, lv:p.lv, boost:1.12}]);
};
ACTIONS.xslegendskip = () => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "legend") return;
  run.bits += 40 + run.floor * 5;
  toast(`+${40 + run.floor * 5} Bits`, "", "coin");
  xsDone(run);
};
/* après la victoire : il rejoint l'équipe (ou on choisit qui lui laisse sa place) */
function sanctJoin(run, id){
  const t = cardTier(id);
  const lvl = clamp(teamAvgLevel(run) + [0, 0, 2, 4][t], 2, 100);
  S.stats.sanctWins = (S.stats.sanctWins || 0) + 1;
  if(run.team.length < 6){
    run.team.push(newRunMon(run, id, lvl));
    run.pend = {k:"sanctdone", id, lvl};
  } else {
    run.pend = {k:"draft", list:[{id, lvl}], legend:1, seen:false};
  }
  save();
  if(typeof closeSheet === "function") closeSheet();
  expResume(run);
}

/* ============================================================
   LA RÉVÉLATION
   Quand une carte ouvre (ou renforce) un pouvoir, on le dit — et
   on dit où s'en servir. Sinon le pouvoir dort dans un menu.
   ============================================================ */
function cardPowerAnnounce(id, before, after){
  if(after <= before) return;
  S.cardPowerLog = S.cardPowerLog || [];
  S.cardPowerLog.push({id, t:after, at:Date.now()});
  if(S.cardPowerLog.length > 30) S.cardPowerLog.shift();
  cardPowerMoment(id, before, after);
}
/* l'annonce à l'écran, à part : la révélation d'une carte (73c) la montre dans sa propre scène */
function cardPowerMoment(id, before, after){
  const P = CARD_POWERS[id];
  const nm = POKE[id] ? POKE[id].name : "?";
  const sanct = before === 0 ? ` ${nm} peut désormais t'attendre au Sanctuaire de l'Expédition.` : "";
  if(typeof moment !== "function") return;
  moment({kind:"release", c:"#ffd24a", spr:id,
    kicker: before === 0 ? "POUVOIR DE CARTE" : "POUVOIR RENFORCÉ",
    title: (P ? P.n : nm) + " · " + TIER_NAMES[after],
    sub: (P ? cardPowerDesc(id, after) : "") + sanct,
    line: before === 0 ? "{nom}, cette carte n'est pas qu'une image. Elle ouvre quelque chose. Regarde dans " + (P ? cardPowerWhere(id) : "l'Expédition") + "."
                       : "Une illustration plus ancienne. Le pouvoir de " + nm + " grandit."});
}
/* on enveloppe l'obtention : avant/après, sans toucher aux appelants */
if(typeof grantCardV === "function"){
  const _grantCardV = grantCardV;
  grantCardV = function(series, id){
    const before = series === "mn" ? 0 : cardTier(id);
    const r = _grantCardV(series, id);
    if(r && series !== "mn") try { cardPowerAnnounce(id, before, cardTier(id)); } catch(e){}
    return r;
  };
}

/* ---------- le panneau des pouvoirs, dans la collection ---------- */
function cardPowersPanel(){
  const own = cardSpeciesOwned().length;
  const row = id=>{
    const P = CARD_POWERS[id], t = cardTier(id), known = t > 0 || monFound(id);
    return `<div class="cpw ${t ? "on" : ""}" data-act="cardseries" data-id="${id}">
      <span class="sprbox" style="width:34px;height:34px">${t ? sprite(id, false, "") : `<span class="monunknown">?</span>`}</span>
      <div class="grow">
        <div class="row between"><b class="tiny">${esc(P.n)}</b>
          <span class="cpw-t t${t}">${t ? TIER_NAMES[t] : "verrouillé"}</span></div>
        <div class="tiny dim">${esc(cardPowerWhere(id))}${known ? " · " + esc(POKE[id].name) : ""}</div>
        <div class="tiny ${t ? "" : "dim"}">${esc(cardPowerDesc(id, Math.max(1, t)))}</div>
      </div></div>`;
  };
  const group = (title, f) => `<div class="h sm" style="margin-top:8px">${title}</div>${CARD_MONS.filter(f).map(row).join("")}`;
  return `<div class="panel" style="margin-top:12px">
    <div class="h sm">POUVOIRS DES CARTES</div>
    <div class="tiny">Chaque légendaire possédé en carte <b>apparaît au Sanctuaire</b> de l'Expédition
      (${own ? `<b class="gold-t">${Math.round(sanctChance() * 100)} %</b> de chances par parcours` : "aucun pour l'instant"}) :
      bats-le, il rejoint ton équipe. Il ouvre aussi <b>un pouvoir propre</b>. Plus tu as d'illustrations
      de lui, plus le pouvoir est fort : 1 = Éclat I, 2 = Éclat II, 3 = Éclat III.</div>
    ${group("POKÉ-POKER · DECKS", id=>CARD_POWERS[id].k === "deck")}
    ${group("POKÉ-POKER · PROGRAMMES", id=>CARD_POWERS[id].k === "joker")}
    ${group("EXPÉDITION · BOUTIQUE KECLEON", id=>CARD_POWERS[id].k === "item")}
  </div>`;
}
