/* ============================================================
   60 — POKE-POKER
   Les cartes ne sont pas des rangs et des couleurs : ce sont des
   Pokemon. Les combinaisons se lisent en especes identiques, en
   familles d'evolution, en types et en chromatiques.
   ============================================================ */

/* ---------- familles d'evolution ---------- */
const FAM_ROOT = {}, FAM_STAGE = {}, FAM_MEMBERS = {};
(function buildFamilies(){
  for(const id of POKE_IDS){
    let cur = id, depth = 0, guard = 0;
    while(POKE[cur].from && guard++ < 5){ cur = POKE[cur].from; depth++; }
    FAM_ROOT[id] = cur; FAM_STAGE[id] = depth;
    (FAM_MEMBERS[cur] = FAM_MEMBERS[cur] || []).push(id);
  }
})();
function famOf(id){ return FAM_ROOT[id]; }
function stageOf(id){ return FAM_STAGE[id]; }
function famSize(root){ return (FAM_MEMBERS[root]||[]).length; }
function isLegend(id){ return POKE[id].leg > 0; }

/* ---------- valeur d'une carte ---------- */
function cardChips(c){
  const p = POKE[c.id];
  let v = 8 + Math.floor(p.bst / 20);
  v += stageOf(c.id) * 6;
  if(c.shiny) v += 25;
  if(isLegend(c.id)) v += 40;
  if(c.ed === "corrupt") v += 45;
  return v;
}

/* ---------- types de mains ---------- */
/* chaque entree : detecte la combinaison et renvoie les cartes qui marquent */
const HANDS = [
  {id:"duo_origine", n:"Duo Originel", chips:600, mult:60, secret:1,
   d:"Mew et Mewtwo dans la même main.",
   f:cs=>{ const a=cs.find(c=>c.id===151), b=cs.find(c=>c.id===150);
           return (a&&b) ? [a,b] : null; }},

  {id:"pantheon", n:"Panthéon", chips:500, mult:50, secret:1,
   d:"Cinq légendaires d'espèces différentes.",
   f:cs=>{ const l=cs.filter(c=>isLegend(c.id));
           return new Set(l.map(c=>c.id)).size>=5 ? l : null; }},

  {id:"flush_chroma", n:"Flush Chromatique", chips:500, mult:50,
   d:"Cinq cartes chromatiques.",
   f:cs=>{ const s=cs.filter(c=>c.shiny); return s.length>=5 ? s : null; }},

  {id:"carre_chroma", n:"Carré Chromatique", chips:300, mult:30, secret:1,
   d:"Quatre cartes chromatiques.",
   f:cs=>{ const s=cs.filter(c=>c.shiny); return s.length>=4 ? s.slice(0,4) : null; }},

  {id:"rainbow", n:"Spectre Complet", chips:250, mult:25, secret:1,
   d:"Cinq types différents et au moins une chromatique.",
   f:cs=>{ if(cs.length<5 || !cs.some(c=>c.shiny)) return null;
           const seen=new Set();
           for(const c of cs){ const t=POKE[c.id].types.find(x=>!seen.has(x)); if(t===undefined) return null; seen.add(t); }
           return seen.size>=5 ? cs : null; }},

  {id:"brelan_chroma", n:"Brelan Chromatique", chips:200, mult:20, secret:1,
   d:"Trois cartes chromatiques.",
   f:cs=>{ const s=cs.filter(c=>c.shiny); return s.length>=3 ? s.slice(0,3) : null; }},

  {id:"trio_legend", n:"Trio Légendaire", chips:150, mult:15,
   d:"Trois Pokémon légendaires.",
   f:cs=>{ const l=cs.filter(c=>isLegend(c.id)); return l.length>=3 ? l.slice(0,3) : null; }},

  {id:"paire_chroma", n:"Paire Chromatique", chips:100, mult:10, secret:1,
   d:"Deux cartes chromatiques.",
   f:cs=>{ const s=cs.filter(c=>c.shiny); return s.length>=2 ? s.slice(0,2) : null; }},

  {id:"carre", n:"Carré", chips:90, mult:9,
   d:"Quatre fois la même espèce.",
   f:cs=>groupBy(cs,c=>c.id).find(g=>g.length>=4)?.slice(0,4) || null},

  {id:"evo_parfaite", n:"Évolution Parfaite", chips:80, mult:8,
   d:"Une lignée complète : base, stade 1 et stade 2.",
   f:cs=>{ for(const g of groupBy(cs,c=>famOf(c.id))){
             const st=new Set(g.map(c=>stageOf(c.id)));
             if(st.has(0)&&st.has(1)&&st.has(2)) return g; }
           return null; }},

  {id:"pokeball", n:"Pokéball Pleine", chips:70, mult:7,
   d:"Un brelan et une paire.",
   f:cs=>{ const g=groupBy(cs,c=>c.id).sort((a,b)=>b.length-a.length);
           return (g[0]?.length>=3 && g[1]?.length>=2) ? [...g[0].slice(0,3),...g[1].slice(0,2)] : null; }},

  {id:"monotype", n:"Mono-Type", chips:60, mult:6,
   d:"Cinq cartes partageant un même type.",
   f:cs=>{ if(cs.length<5) return null;
           for(let t=1;t<=18;t++){ const m=cs.filter(c=>POKE[c.id].types.includes(t));
             if(m.length>=5) return m.slice(0,5); }
           return null; }},

  {id:"double_duo", n:"Double Duo Évolutif", chips:50, mult:6,
   d:"Deux paires issues de familles différentes.",
   f:cs=>{ const g=groupBy(cs,c=>famOf(c.id)).filter(x=>x.length>=2);
           return g.length>=2 ? [...g[0].slice(0,2),...g[1].slice(0,2)] : null; }},

  {id:"brelan", n:"Brelan", chips:45, mult:4,
   d:"Trois fois la même espèce.",
   f:cs=>groupBy(cs,c=>c.id).find(g=>g.length>=3)?.slice(0,3) || null},

  {id:"evo_trio", n:"Trio Évolutif", chips:40, mult:4,
   d:"Trois cartes de la même famille.",
   f:cs=>groupBy(cs,c=>famOf(c.id)).find(g=>g.length>=3)?.slice(0,3) || null},

  {id:"duo_type", n:"Duo-Type", chips:30, mult:3,
   d:"Trois cartes d'un type et deux d'un autre.",
   f:cs=>{ if(cs.length<5) return null;
           for(let a=1;a<=18;a++){
             const A=cs.filter(c=>POKE[c.id].types.includes(a));
             if(A.length<3) continue;
             const rest=cs.filter(c=>!A.slice(0,3).includes(c));
             for(let b=1;b<=18;b++){ if(b===a) continue;
               const B=rest.filter(c=>POKE[c.id].types.includes(b));
               if(B.length>=2) return [...A.slice(0,3),...B.slice(0,2)]; } }
           return null; }},

  {id:"duo_evo", n:"Duo Évolutif", chips:25, mult:3,
   d:"Deux cartes de la même famille, espèces différentes.",
   f:cs=>{ for(const g of groupBy(cs,c=>famOf(c.id)))
             if(g.length>=2 && new Set(g.map(c=>c.id)).size>=2){
               const seen=new Set(), out=[];
               for(const c of g){ if(!seen.has(c.id)){ seen.add(c.id); out.push(c); } if(out.length===2) break; }
               return out; }
           return null; }},

  {id:"paire", n:"Paire", chips:15, mult:2,
   d:"Deux fois la même espèce.",
   f:cs=>groupBy(cs,c=>c.id).find(g=>g.length>=2)?.slice(0,2) || null},

  {id:"sauvage", n:"Rencontre Sauvage", chips:5, mult:1,
   d:"Aucune combinaison.",
   f:cs=>cs.length ? [cs.slice().sort((a,b)=>cardChips(b)-cardChips(a))[0]] : null}
];
const HANDS_BY_ID = Object.fromEntries(HANDS.map(h=>[h.id,h]));

function groupBy(arr, key){
  const m = new Map();
  for(const x of arr){ const k = key(x); (m.get(k) || m.set(k,[]).get(k)).push(x); }
  return [...m.values()].sort((a,b)=>b.length-a.length);
}

function handLevel(id){ return (S && S.poker && S.poker.levels && S.poker.levels[id]) || 0; }
function handBase(id){
  const h = HANDS_BY_ID[id], lv = handLevel(id);
  return {chips: h.chips + lv*Math.max(12, Math.round(h.chips*0.35)),
          mult:  h.mult  + lv*Math.max(1,  Math.round(h.mult *0.30))};
}
/* on evalue toutes les combinaisons possibles et on garde la plus rentable */
function evalHand(cards){
  let best = null, bestVal = -1;
  for(const h of HANDS){
    let cs = null;
    try { cs = h.f(cards); } catch(e){ cs = null; }
    if(!cs || !cs.length) continue;
    const b = handBase(h.id);
    const v = b.chips * b.mult;
    if(v > bestVal){ bestVal = v; best = {key:h.id, n:h.n, scoring:cs}; }
  }
  return best || {key:"sauvage", n:"Rencontre Sauvage", scoring:cards.slice(0,1)};
}

/* ---------- programmes ---------- */
const JOKERS = [
  {id:"j_flamme", n:"Charbon actif",  rar:0, cost:4, spr:4,   d:"+4 Mult par carte de type Feu.",
   onCard:(c,x)=>{ if(POKE[c.id].types.includes(10)) x.mult+=4; }},
  {id:"j_onde",   n:"Eau mystique",   rar:0, cost:4, spr:7,   d:"+22 Jetons par carte de type Eau.",
   onCard:(c,x)=>{ if(POKE[c.id].types.includes(11)) x.chips+=22; }},
  {id:"j_sève",   n:"Engrais",        rar:0, cost:4, spr:1,   d:"+4 Mult par carte de type Plante.",
   onCard:(c,x)=>{ if(POKE[c.id].types.includes(12)) x.mult+=4; }},
  {id:"j_aimant", n:"Aimant",         rar:0, cost:4, spr:25,  d:"+22 Jetons par carte de type Électrik.",
   onCard:(c,x)=>{ if(POKE[c.id].types.includes(13)) x.chips+=22; }},
  {id:"j_psy",    n:"Cuillère tordue",rar:1, cost:6, spr:63,  d:"×1.15 Mult par carte de type Psy.",
   onCard:(c,x)=>{ if(POKE[c.id].types.includes(14)) x.mult*=1.15; }},
  {id:"j_evo1",   n:"Multi Exp",      rar:0, cost:5, spr:113, d:"+20 Jetons par carte évoluée.",
   onCard:(c,x)=>{ if(stageOf(c.id)>0) x.chips+=20; }},
  {id:"j_evo2",   n:"Sceau final",    rar:1, cost:7, spr:3,   d:"+9 Mult par carte de stade 2.",
   onCard:(c,x)=>{ if(stageOf(c.id)>=2) x.mult+=9; }},
  {id:"j_base",   n:"Couveuse",       rar:0, cost:4, spr:172, d:"+16 Jetons par carte non évoluée.",
   onCard:(c,x)=>{ if(stageOf(c.id)===0) x.chips+=16; }},
  {id:"j_chroma", n:"Amulette Ovale", rar:2, cost:9, spr:133, d:"+16 Mult par carte chromatique.",
   onCard:(c,x)=>{ if(c.shiny) x.mult+=16; }},
  {id:"j_master", n:"Master Ball",    rar:2, cost:10,spr:150, d:"×2 Mult si la main contient un légendaire.",
   onHand:x=>{ if(x.played.some(c=>isLegend(c.id))) x.mult*=2; }},
  {id:"j_bst",    n:"Analyseur",      rar:1, cost:7, spr:81,  d:"+1 Mult par tranche de 60 points de statistiques jouées.",
   onHand:x=>{ x.mult += Math.floor(x.played.reduce((a,c)=>a+POKE[c.id].bst,0)/60); }},
  {id:"j_fam",    n:"Arbre généalogique", rar:1, cost:7, spr:35,
   d:"+30 Jetons par famille d'évolution distincte jouée.",
   onHand:x=>{ x.chips += 30*new Set(x.played.map(c=>famOf(c.id))).size; }},
  {id:"j_solo",   n:"Minimalisme",    rar:1, cost:6, spr:143, d:"+35 Mult si vous ne jouez qu'une carte.",
   onHand:x=>{ if(x.played.length===1) x.mult+=35; }},
  {id:"j_full",   n:"Saturation",     rar:1, cost:6, spr:131, d:"+70 Jetons et +6 Mult si vous jouez 5 cartes.",
   onHand:x=>{ if(x.played.length===5){ x.chips+=70; x.mult+=6; } }},
  {id:"j_types",  n:"Prisme",         rar:2, cost:9, spr:132, d:"+12 Mult si la main couvre 4 types ou plus.",
   onHand:x=>{ const t=new Set(); x.played.forEach(c=>POKE[c.id].types.forEach(v=>t.add(v)));
               if(t.size>=4) x.mult+=12; }},
  {id:"j_scale",  n:"Escalade",       rar:2, cost:9, spr:147, d:"+2 Mult cumulés à chaque main jouée.",
   onHand:(x,j)=>{ x.mult += (j.mem||0); }, onAfter:(x,j)=>{ j.mem=(j.mem||0)+2; }},
  {id:"j_disc",   n:"Nettoyeur",      rar:1, cost:6, spr:88,  d:"+1 défausse par manche.", passive:"discard"},
  {id:"j_hand",   n:"Allocation",     rar:2, cost:9, spr:113, d:"+1 main par manche.", passive:"hand"},
  {id:"j_slot",   n:"Extension RAM",  rar:2, cost:9, spr:137, d:"+1 emplacement de programme.", passive:"slot"},
  {id:"j_draw",   n:"Tampon élargi",  rar:1, cost:7, spr:80,  d:"+1 carte en main.", passive:"draw"},
  {id:"j_econ",   n:"Intérêts",       rar:1, cost:7, spr:52,  d:"+2 Octets par manche remportée.", passive:"econ"},
  {id:"j_corrupt",n:"Corruption",     rar:2, cost:10,spr:0,   d:"×0.3 Mult par carte défaussée cette manche (max ×3).",
   onHand:x=>{ x.mult *= Math.min(3, 1 + 0.3*(x.st.discardedThisRound||0)); }},
  {id:"j_mirror", n:"Miroir",         rar:2, cost:10,spr:150, d:"Copie l'effet du programme à sa gauche.", mirror:1},
  {id:"j_ghost",  n:"Spectre",        rar:2, cost:10,spr:94,  d:"+2 Mult par carte restée en main.",
   onHand:x=>{ x.mult += 2*x.inHandLeft; }},
  {id:"j_arch",   n:"Archiviste",     rar:3, cost:14,spr:233, d:"+0.6 Mult par espèce de votre Pokédex (max +45).",
   onHand:x=>{ x.mult += Math.min(45, dexTotal()*0.6); }},
  {id:"j_legend", n:"Relique",        rar:3, cost:14,spr:249, d:"×2.4 Mult. Se brise après 6 manches.",
   onHand:x=>{ x.mult*=2.4; }, fragile:6},
  {id:"j_glitch", n:"MissingNo",      rar:3, cost:15,spr:0,   d:"×1.6 Mult, mais 18% de chance d'annuler la main.",
   onHand:x=>{ if(rng()<0.18) x.cancel=true; else x.mult*=1.6; }},
  {id:"j_pz",     n:"Porygon-Z",      rar:3, cost:15,spr:474, d:"+0.025 Mult par Jeton au-delà de 250.",
   onHand:x=>{ x.mult += Math.max(0, x.chips-250)*0.025; }}
];
function jokerDef(j){ return JOKERS.find(x=>x.id===j.id); }

/* ---------- licences (ameliorations permanentes du run) ---------- */
const LICENCES = [
  {id:"l_slot",  n:"Certificat d'élite", cost:20, d:"+1 emplacement de programme.", f:P=>P.slots++},
  {id:"l_hand",  n:"Quota étendu",       cost:18, d:"+1 main par manche.",          f:P=>P.hands++},
  {id:"l_disc",  n:"Purge autorisée",    cost:14, d:"+1 défausse par manche.",      f:P=>P.discards++},
  {id:"l_draw",  n:"Tampon profond",     cost:14, d:"+1 carte en main.",            f:P=>P.handSize++},
  {id:"l_econ",  n:"Badge de champion",  cost:16, d:"+3 Octets à chaque manche remportée.", f:P=>P.econ+=3},
  {id:"l_shiny", n:"Amulette chroma",    cost:16, d:"Les boosters produisent des chromatiques 3× plus souvent.",
   f:P=>P.shinyBoost=(P.shinyBoost||1)*3},
  {id:"l_reroll",n:"Licence de relance", cost:12, d:"Les relances de cache coûtent 1 Octet de moins.", f:P=>P.rerollCut=1},
  {id:"l_rare",  n:"Méga Canne",         cost:16, d:"Les boosters proposent des espèces bien plus rares.",
   f:P=>P.rareBoost=true}
];

/* ---------- planètes ----------
   Chacune améliore définitivement une combinaison pour la partie en cours.
   C'est le levier de specialisation : on construit un deck autour d'une main. */
const PLANETS = [
  {id:"pl_paire",  n:"Orbe Mercure",  hand:"paire",        cost:5},
  {id:"pl_duoevo", n:"Orbe Vénus",    hand:"duo_evo",      cost:5},
  {id:"pl_duotype",n:"Orbe Terre",    hand:"duo_type",     cost:6},
  {id:"pl_evotrio",n:"Orbe Mars",     hand:"evo_trio",     cost:6},
  {id:"pl_brelan", n:"Orbe Jupiter",  hand:"brelan",       cost:6},
  {id:"pl_double", n:"Orbe Saturne",  hand:"double_duo",   cost:7},
  {id:"pl_mono",   n:"Orbe Uranus",   hand:"monotype",     cost:7},
  {id:"pl_ball",   n:"Orbe Neptune",  hand:"pokeball",     cost:8},
  {id:"pl_parfait",n:"Orbe Pluton",   hand:"evo_parfaite", cost:8},
  {id:"pl_carre",  n:"Orbe Cérès",    hand:"carre",        cost:9},
  {id:"pl_legend", n:"Orbe Éris",     hand:"trio_legend",  cost:10},
  {id:"pl_chroma", n:"Orbe Sedna",    hand:"flush_chroma", cost:11}
];
/* ---------- spectres ----------
   Rares, ils touchent directement au deck plutôt qu'au score. */
const SPECTRALS = [
  {id:"sp_hole",   n:"Trou Noir",     cost:14, d:"Toutes les combinaisons gagnent un niveau."},
  {id:"sp_forge",  n:"Forge d'âme",   cost:12, d:"Ajoute un programme légendaire au hasard."},
  {id:"sp_dup",    n:"Duplication",   cost:6,  d:"Copie une carte de votre deck.",           card:1},
  {id:"sp_del",    n:"Suppression",   cost:4,  d:"Retire définitivement une carte du deck.", card:1},
  {id:"sp_shiny",  n:"Chromatisation",cost:9,  d:"Rend une carte chromatique.",              card:1},
  {id:"sp_evo",    n:"Réécriture",    cost:8,  d:"Fait évoluer une carte du deck.",          card:1},
  {id:"sp_gold",   n:"Dorure",        cost:6,  d:"La carte rapporte 3 Octets quand elle marque.", card:1},
  {id:"sp_glass",  n:"Verre",         cost:6,  d:"×2 Mult, mais la carte se brise à l'usage.",card:1},
  {id:"sp_corrupt",n:"Corruption",    cost:7,  d:"+45 Jetons sur cette carte.",              card:1},
  {id:"sp_ante",   n:"Rétrogradation",cost:15, d:"Réduit d'un cran le score du prochain verrou."}
];

/* ---------- boosters ---------- */
const BOOSTERS = [
  {id:"b_index",  n:"Booster Index",     cost:4,  d:"Choisir 1 espèce parmi 3 de votre archive.", kind:"any"},
  {id:"b_evo",    n:"Booster Évolution", cost:6,  d:"Choisir 1 espèce évoluée parmi 3.",          kind:"evo"},
  {id:"b_type",   n:"Booster Type",      cost:6,  d:"Choisir 1 espèce parmi 3 d'un même type.",   kind:"type"},
  {id:"b_chroma", n:"Booster Chroma",    cost:9,  d:"La carte obtenue est chromatique.",          kind:"shiny"},
  {id:"b_herit",  n:"Booster Héritage",  cost:16, d:"Choisir 1 légendaire parmi 3.",              kind:"legend"}
];

/* ---------- verrous de secteur ---------- */
const BOSS_BLINDS = [
  {id:"b_fire",  n:"Pare-feu thermique", d:"Les cartes de type Feu ne marquent pas.",      f:{deadType:10}},
  {id:"b_water", n:"Cloison hydrique",   d:"Les cartes de type Eau ne marquent pas.",      f:{deadType:11}},
  {id:"b_grass", n:"Filtre organique",   d:"Les cartes de type Plante ne marquent pas.",   f:{deadType:12}},
  {id:"b_evo",   n:"Blocage d'évolution",d:"Les cartes évoluées ne marquent pas.",         f:{deadEvo:1}},
  {id:"b_chroma",n:"Correcteur de teinte",d:"Les cartes chromatiques ne marquent pas.",    f:{deadShiny:1}},
  {id:"b_legend",n:"Scellé légendaire",  d:"Les légendaires ne marquent pas.",             f:{deadLegend:1}},
  {id:"b_quota", n:"Quota d'écriture",   d:"Une main de moins pour cette manche.",         f:{lessHand:1}},
  {id:"b_purge", n:"Purge du tampon",    d:"Une défausse de moins.",                       f:{lessDiscard:1}},
  {id:"b_comp",  n:"Compression",        d:"Seules les 3 premières cartes jouées marquent.",f:{maxScore:3}},
  {id:"b_rw",    n:"Réécriture",         d:"La première main jouée marque zéro.",          f:{firstZero:1}},
  {id:"b_giov",  n:"Surcharge du secteur",d:"Le score à atteindre est augmenté de 50%.",   f:{target:1.5}},
  {id:"b_fiss",  n:"Fissure",            d:"Une seule main pour franchir le verrou.",      f:{oneHand:1}}
];

const ANTE_BASE = [0, 300, 800, 2000, 5000, 11000, 20000, 35000, 50000,
                   80000, 130000, 210000, 340000, 550000, 900000, 1500000];
function anteTarget(ante, blind, boss){
  const i = Math.min(ante, ANTE_BASE.length-1);
  const base = ANTE_BASE[i] || ANTE_BASE[ANTE_BASE.length-1] * Math.pow(1.6, ante-15);
  let t = base * [1, 1.5, 2][blind];
  if(boss && boss.f.target) t *= boss.f.target;
  return Math.round(t);
}
const BLIND_NAMES = ["Petit verrou", "Grand verrou", "Verrou du secteur"];
const RAR_NAME = ["Commun", "Peu commun", "Rare", "Légendaire"];

/* Progression d'une partie, reprise de la v1 : chaque ante se clot sur un
   verrou de secteur qui delivre un badge. Les huit badges ouvrent le Conseil
   des Quatre, puis le Champion de la Couche. */
const BADGES = [
  {n:"Amorce",      c:"#8ea3bd", d:"Premier secteur stabilisé."},
  {n:"Cascade",     c:"#4fb2ff", d:"Le flux de données ne déborde plus."},
  {n:"Foudre",      c:"#ffe45e", d:"Les décharges parasites sont canalisées."},
  {n:"Prisme",      c:"#5ce07a", d:"Les couleurs correspondent enfin à leur définition."},
  {n:"Ruche",       c:"#bcde58", d:"Les références circulaires sont coupées."},
  {n:"Marais",      c:"#b06bff", d:"La mémoire stagnante est purgée."},
  {n:"Volcan",      c:"#ff8a3d", d:"La surchauffe du secteur est contenue."},
  {n:"Fracture",    c:"#ff3d7f", d:"La dernière faille de la couche est scellée."}
];
const ELITE_NAMES = ["Premier Conseiller", "Deuxième Conseiller",
                     "Troisième Conseiller", "Quatrième Conseiller"];
const CHAMPION_NAME = "Champion de la Couche";

function pkStage(){ const P = S.poker; return P.stage || "ante"; }
function pkStageLabel(){
  const P = S.poker;
  if(pkStage() === "elite")    return ELITE_NAMES[P.eliteIdx || 0];
  if(pkStage() === "champion") return CHAMPION_NAME;
  return `ANTE ${P.ante}`;
}
function pkBlindLabel(){
  const P = S.poker;
  if(pkStage() === "elite")    return "Conseil des Quatre";
  if(pkStage() === "champion") return "Affrontement final";
  return BLIND_NAMES[P.blind];
}
/* barre de progression permanente : huit badges puis le conseil */
function badgeRow(){
  const P = S.poker;
  const got = P.badges || [];
  const st = pkStage();
  return `<div class="badgerow">
    ${BADGES.map((b,i)=>`<span class="bdg ${got.includes(i)?"on":""}" style="--bc:${b.c}"
      title="${esc(b.n)}">${got.includes(i)?"◆":"·"}</span>`).join("")}
    <span class="bdg-sep"></span>
    ${ELITE_NAMES.map((_,i)=>`<span class="bdg e4 ${st==="champion"||(st==="elite"&&(P.eliteIdx||0)>i)?"on":""}
      ${st==="elite"&&(P.eliteIdx||0)===i?"cur":""}">${i+1}</span>`).join("")}
    <span class="bdg champ ${st==="champion"?"cur":""}">★</span>
  </div>`;
}

/* ---------- construction du deck ---------- */
const BASE_FAMS = [1,4,7,10,13,16,19,21,23,25,27,29,32,41,43,46,50,54,58,60,63,66,69,74,92,129,133];
function newDeck(){
  const out = [];
  let u = 0;
  const push = (id, shiny) => out.push({u:u++, id, shiny:!!shiny, ed:""});
  /* chaque famille retenue apporte sa lignee complete : les combos evolutifs sont atteignables */
  const fams = shuffle(BASE_FAMS).slice(0, 14);
  for(const root of fams) for(const m of (FAM_MEMBERS[root]||[root])) push(m);
  /* on complete a 52 par des doublons, ce qui rend paires et brelans possibles */
  const pool = out.map(c=>c.id);
  while(out.length < 52) push(pick(pool));
  return out.slice(0, 52);
}

/* ---------- etat de partie ---------- */
function startPoker(){
  S.poker = {
    ante:1, blind:0, state:"blind",
    score:0, target:anteTarget(1,0),
    hands:4, discards:3, handsLeft:4, discardsLeft:3,
    handSize:8, slots:5, econ:0,
    deck:newDeck(), draw:[], hand:[], sel:[],
    jokers:[], licences:[], levels:{},
    boss:null, playedTypes:{}, discardedThisRound:0, roundHands:0, noDiscard:true,
    stage:"ante", eliteIdx:0, badges:[],
    octets:4, shop:null, endless:false, lastHand:null
  };
  S.pokerMeta.unlocked = true;
  tutoMaybe("poker");
  save(); go("poker");
}

function pkStartRound(){
  const P = S.poker;
  P.boss = P.blind === 2 ? pick(BOSS_BLINDS) : null;
  const f = P.boss ? P.boss.f : {};
  const st = pkStage();
  let base;
  if(st === "elite")         base = Math.round(anteTarget(9, 2) * (1 + (P.eliteIdx||0) * 0.45));
  else if(st === "champion") base = Math.round(anteTarget(9, 2) * 3.4);
  else                       base = anteTarget(P.ante, P.blind, P.boss);
  P.target = Math.round(base * (P.discount || 1));
  P.discount = 1;
  P.score = 0;
  P.handsLeft = f.oneHand ? 1 : P.hands - (f.lessHand||0);
  P.discardsLeft = Math.max(0, P.discards - (f.lessDiscard||0));
  P.draw = shuffle(P.deck.map(c=>Object.assign({}, c)));
  P.hand = []; P.sel = [];
  P.roundHands = 0; P.discardedThisRound = 0;
  P.state = "play";
  pkDraw();
  save();
}
function drawSize(){
  const P = S.poker;
  return P.handSize + P.jokers.filter(j=>jokerDef(j)?.passive==="draw").length;
}
function pkDraw(){
  const P = S.poker;
  while(P.hand.length < drawSize() && P.draw.length) P.hand.push(P.draw.pop());
  P.hand.sort((a,b)=> famOf(a.id)-famOf(b.id) || a.id-b.id);
}
function selCards(){
  const P = S.poker;
  return P.sel.map(u=>P.hand.find(c=>c.u===u)).filter(Boolean);
}
function pkToggle(u){
  const P = S.poker;
  const i = P.sel.indexOf(u);
  if(i >= 0) P.sel.splice(i,1);
  else { if(P.sel.length >= 5) return; P.sel.push(u); }
  pkRenderLive();
}

/* ---------- calcul du score ----------
   En plus du total, on enregistre la trace : quelle carte, quel programme,
   dans quel ordre, et ce que chacun a ajoute. C'est cette trace qui est
   rejouee a l'ecran pour que le joueur voie d'ou vient son score. */
function pkScore(preview){
  const P = S.poker;
  const played = selCards();
  if(!played.length) return null;
  const ev = evalHand(played);
  const f = P.boss ? P.boss.f : {};
  const base = handBase(ev.key);

  const x = {chips:base.chips, mult:base.mult, handKey:ev.key, handName:ev.n,
             played, inHandLeft:P.hand.length - played.length, st:P, cancel:false,
             scored:[], steps:[], base};

  /* chaque etape note l'etat AVANT, pour pouvoir afficher le delta a l'ecran */
  const step = (kind, label, ref) => {
    const c0 = x.chips, m0 = x.mult;
    return () => x.steps.push({kind, label, ref,
      dc: Math.round(x.chips - c0), dm: +(x.mult - m0).toFixed(2),
      chips: Math.round(x.chips), mult: +x.mult.toFixed(2),
      mulMode: Math.abs(x.mult - m0) > 0.001 && Math.abs((x.mult / (m0 || 1)) - 1) > 0.001 && m0 > 0
               && Math.abs(x.mult - m0 - Math.round(x.mult - m0)) > 0.001});
  };

  x.steps.push({kind:"base", label:ev.n, dc:base.chips, dm:base.mult,
                chips:base.chips, mult:base.mult});

  let scoring = ev.scoring.slice();
  if(f.maxScore) scoring = scoring.filter(c=>played.indexOf(c) < f.maxScore);

  for(const c of scoring){
    if(f.deadType && POKE[c.id].types.includes(f.deadType)) continue;
    if(f.deadEvo && stageOf(c.id) > 0) continue;
    if(f.deadShiny && c.shiny) continue;
    if(f.deadLegend && isLegend(c.id)) continue;
    const commit = step("card", POKE[c.id].name, c.u);
    x.chips += cardChips(c);
    if(c.ed === "glass") x.mult *= 2;
    if(c.ed === "gold" && !preview) P.octets += 3;
    x.scored.push(c);
    for(const j of P.jokers){
      const def = jokerDef(j);
      if(def && def.onCard) def.onCard(c, x, j);
    }
    commit();
  }
  for(let i=0;i<P.jokers.length;i++){
    let def = jokerDef(P.jokers[i]);
    if(def && def.mirror && i > 0) def = jokerDef(P.jokers[i-1]) || def;
    if(def && def.onHand){
      const commit = step("joker", def.n, i);
      def.onHand(x, P.jokers[i]);
      commit();
    }
  }
  if(f.firstZero && P.roundHands === 0){
    const commit = step("boss", P.boss.n);
    x.chips = 0; x.mult = 0; commit();
  }
  if(x.cancel){
    const commit = step("boss", "Main annulée");
    x.chips = 0; x.mult = 0; commit();
  }
  x.total = Math.round(x.chips * x.mult);
  /* on ne garde que les etapes qui ont reellement change quelque chose */
  x.steps = x.steps.filter((st,i)=> i === 0 || st.dc !== 0 || Math.abs(st.dm) > 0.001);
  return x;
}

/* ---------- résolution animée ----------
   Le score ne saute plus d'un coup : chaque carte puis chaque programme
   se declenche a l'ecran, avec son apport. C'est la seule facon de
   comprendre d'ou vient un gros score, et de vouloir le reproduire. */
let RESOLVE = null;

function pkPlay(){
  const P = S.poker;
  if(P.state !== "play" || !P.sel.length || P.handsLeft <= 0 || RESOLVE) return;
  const res = pkScore(false);
  if(!res) return;
  P.resolvePlayed = selCards().map(c=>c.u);
  P.state = "resolve";
  RESOLVE = {res, i:0, chips:0, mult:0, timer:null, done:false};
  refresh();
  RESOLVE.timer = setTimeout(stepResolve, 260);
}

function stepResolve(){
  if(!RESOLVE) return;
  const st = RESOLVE.res.steps[RESOLVE.i];
  if(!st){ endResolveSteps(); return; }
  RESOLVE.i++;
  RESOLVE.chips = st.chips;
  RESOLVE.mult  = st.mult;
  paintResolve(st);
  RESOLVE.timer = setTimeout(stepResolve, st.kind === "base" ? 430 : 330);
}

function paintResolve(st){
  const line = document.getElementById("pk-score-line");
  if(line){
    line.innerHTML = `<span class="pk-hn">${esc(RESOLVE.res.handName)}</span>
      <span class="chips" id="pk-chips">${fmt(RESOLVE.chips)}</span><span class="muted">×</span>
      <span class="mult" id="pk-mult">${RESOLVE.mult.toFixed(RESOLVE.mult % 1 ? 2 : 0)}</span>`;
    const cEl = document.getElementById("pk-chips"), mEl = document.getElementById("pk-mult");
    if(st.dc) bump(cEl);
    if(Math.abs(st.dm) > 0.001) bump(mEl);
  }
  /* cible du declenchement : carte jouee ou programme */
  let target = null;
  if(st.kind === "card") target = document.querySelector(`#hand .pcard[data-u="${st.ref}"]`);
  if(st.kind === "joker") target = document.querySelector(`#jokers .joker[data-i="${st.ref}"]`);
  if(st.kind === "boss")  target = document.querySelector(".blind-card");
  if(target){
    target.classList.remove("trigger"); void target.offsetWidth; target.classList.add("trigger");
    floatDelta(target, st);
  }
  if(st.kind === "joker"){ Sfx.wobble(); buzz(8); }
  else if(st.kind === "boss"){ Sfx.glitch(); }
  else Sfx.click();
}
function bump(el){
  if(!el) return;
  el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
}
function floatDelta(target, st){
  const host = document.getElementById("poker-felt");
  if(!host) return;
  const parts = [];
  if(st.dc) parts.push({t:"+" + fmt(st.dc), c:"var(--cyan)"});
  if(Math.abs(st.dm) > 0.001){
    parts.push(st.mulMode ? {t:"×" + (st.mult / Math.max(0.01, st.mult - st.dm)).toFixed(2), c:"var(--magenta)"}
                          : {t:"+" + st.dm.toFixed(st.dm % 1 ? 1 : 0) + " Mult", c:"var(--magenta)"});
  }
  if(!parts.length) return;
  const r = target.getBoundingClientRect(), h = host.getBoundingClientRect();
  parts.forEach((p, k)=>{
    const d = document.createElement("div");
    d.className = "pkdelta";
    d.textContent = p.t;
    d.style.color = p.c;
    d.style.left = (r.left - h.left + r.width/2 - 20) + "px";
    d.style.top  = (r.top  - h.top  - 6 + k*14) + "px";
    host.appendChild(d);
    setTimeout(()=>d.remove(), 900);
  });
}

function endResolveSteps(){
  if(!RESOLVE || RESOLVE.done) return;
  RESOLVE.done = true;
  const total = RESOLVE.res.total;
  const line = document.getElementById("pk-score-line");
  if(line){
    line.innerHTML = `<span class="pk-total">${fmt(total)}</span>`;
    const el = line.firstElementChild;
    if(el){ el.classList.add("burst"); }
  }
  const felt = document.getElementById("poker-felt");
  if(felt && total > 0){
    Sfx.win();
    burstEl(felt, {n: total > S.poker.target*0.4 ? 28 : 14, spread:110,
      colors:["#35f0d6","#ffc857","#ffffff"], dur:900});
  }
  RESOLVE.timer = setTimeout(commitResolve, 820);
}
/* un appui saute l'animation sans rien changer au resultat */
function skipResolve(){
  if(!RESOLVE || RESOLVE.done) return;
  clearTimeout(RESOLVE.timer);
  RESOLVE.i = RESOLVE.res.steps.length;
  const last = RESOLVE.res.steps[RESOLVE.res.steps.length-1];
  if(last){ RESOLVE.chips = last.chips; RESOLVE.mult = last.mult; }
  endResolveSteps();
}
ACTIONS.pkskipres = () => skipResolve();

function commitResolve(){
  const P = S.poker;
  if(!RESOLVE) return;
  const res = RESOLVE.res;
  clearTimeout(RESOLVE.timer);
  RESOLVE = null;
  const played = P.resolvePlayed || [];
  P.resolvePlayed = null;
  P.state = "play";

  P.playedTypes[res.handKey] = (P.playedTypes[res.handKey]||0) + 1;
  P.score += res.total;
  P.handsLeft--; P.roundHands++;
  P.lastHand = {key:res.handKey, n:res.handName, chips:Math.round(res.chips),
                mult:+res.mult.toFixed(2), total:res.total};

  for(const j of P.jokers){
    const def = jokerDef(j);
    if(def && def.onAfter) def.onAfter(res, j);
    if(def && def.fragile) j.uses = (j.uses||0)+1;
  }
  P.jokers = P.jokers.filter(j=>{
    const def = jokerDef(j);
    if(def && def.fragile && (j.uses||0) >= def.fragile){
      toast(def.n + " s'est brisé.", "bad", "cross"); return false;
    }
    return true;
  });
  for(const c of res.played) if(c.ed === "glass") P.deck = P.deck.filter(x=>x.u !== c.u);

  P.hand = P.hand.filter(c=>!played.includes(c.u));
  P.sel = [];
  pkDraw();
  buzz(14);

  if(P.score >= P.target){ pkWinBlind(); return; }
  if(P.handsLeft <= 0){ pkLose(); return; }
  save(); refresh();
}

function pkDiscard(){
  const P = S.poker;
  if(P.state !== "play" || !P.sel.length || P.discardsLeft <= 0) return;
  P.discardsLeft--;
  P.noDiscard = false;
  P.discardedThisRound += P.sel.length;
  P.hand = P.hand.filter(c=>!P.sel.includes(c.u));
  P.sel = [];
  pkDraw();
  Sfx.click(); save(); refresh();
}

function pkWinBlind(){
  const P = S.poker;
  let reward = 3 + P.blind + P.handsLeft + P.econ;
  for(const j of P.jokers) if(jokerDef(j)?.passive === "econ") reward += 2;
  const interest = Math.min(5, Math.floor(P.octets/5));
  reward += interest;
  P.octets += reward;
  S.daily.dayPokerBlinds++; questTick("dayPokerBlinds",1);
  if(P.score > (S.stats.pokerBest||0)) S.stats.pokerBest = P.score;
  Sfx.win();
  /* un verrou de secteur delivre un badge */
  let badge = null;
  if(pkStage() === "ante" && P.blind === 2 && !(P.badges||[]).includes(P.ante-1)){
    badge = P.ante - 1;
    (P.badges = P.badges || []).push(badge);
    Sfx.shiny();
  }
  const final = pkStage() === "champion" && !P.endless;
  P.state = "reward";
  save();
  sheet(`<div class="center">
    <div class="h" style="justify-content:center">${esc(BLIND_NAMES[P.blind])} FRANCHI</div>
    <div class="tiny muted">${fmt(P.score)} / ${fmt(P.target)}</div>
    <div class="tiles" style="margin:10px 0">
      <div class="tile gold"><div class="k">Manche</div><div class="v">+${3+P.blind}</div></div>
      <div class="tile gold"><div class="k">Mains restantes</div><div class="v">+${P.handsLeft}</div></div>
      <div class="tile gold"><div class="k">Intérêts</div><div class="v">+${interest}</div></div>
      <div class="tile accent"><div class="k">Octets</div><div class="v">${P.octets}</div></div>
    </div>
    ${badge !== null ? `<div class="badgewin">
      <span class="bdg big on" style="--bc:${BADGES[badge].c}">◆</span>
      <div><div class="tiny cy">BADGE ${esc(BADGES[badge].n.toUpperCase())}</div>
        <div class="tiny muted">${esc(BADGES[badge].d)}</div></div>
    </div>` : ""}
    ${final?`<div class="tiny cy" style="margin-bottom:8px">Le Champion est tombé. La couche est stabilisée.</div>`:""}
    <button class="btn pri wide" data-act="${final?"pkfinish":"pkshop"}">
      ${final?"Terminer la partie":"Accéder à la cache"}</button>
    ${final?`<button class="btn wide" style="margin-top:7px" data-act="pkendless">Continuer en Couche Zéro</button>`:""}
  </div>`, true);
}
function pkLose(){
  const P = S.poker;
  P.state = "over"; Sfx.lose();
  const fw = consumeFirstWin("poker");
  const shards = Math.round((18*P.ante + P.octets*2) * fw * (heldActive("poker") ? 2 : 1));
  const coins = Math.round(220*P.ante * fw);
  gain("shards", shards); gain("coins", coins); addXp(90*P.ante);
  save();
  sheet(`<div class="center">
    <div class="h" style="justify-content:center;color:var(--magenta)">MANCHE PERDUE</div>
    <div class="tiny muted">${fmt(P.score)} / ${fmt(P.target)} — Ante ${P.ante}</div>
    <div class="tiles" style="margin:10px 0">
      <div class="tile accent"><div class="k">Fragments</div><div class="v">+${shards}</div></div>
      <div class="tile gold"><div class="k">PokéCoins</div><div class="v">+${fmt(coins)}</div></div>
    </div>
    <button class="btn pri wide" data-act="pkquit">Quitter</button></div>`, true);
}
ACTIONS.pkquit = () => { closeSheet(); S.poker = null; save(); go("poker"); };
ACTIONS.pkfinish = () => {
  const P = S.poker;
  S.stats.pokerWins++;
  if(P.noDiscard) S.flags.pokerNoDiscard = true;
  if(P.ante > (S.pokerMeta.bestAnte||0)) S.pokerMeta.bestAnte = P.ante;
  const fw = consumeFirstWin("poker");
  const shards = Math.round((240 + P.octets*3) * fw * (heldActive("poker") ? 2 : 1));
  gain("shards", shards); gain("coins", 4000*fw); addXp(1400); gain("cores", 2);
  addIntegrity(0.6);
  closeSheet(); S.poker = null; save(); checkAchievements(); guideTick();
  sheet(`<div class="center"><div class="h" style="justify-content:center">COUCHE STABILISÉE</div>
    <div class="tiny muted" style="margin:6px 0">Huit antes franchies. Le motif tient.</div>
    <div class="tiles">
      <div class="tile accent"><div class="k">Fragments</div><div class="v">+${shards}</div></div>
      <div class="tile gold"><div class="k">PokéCoins</div><div class="v">+${fmt(4000*fw)}</div></div>
      <div class="tile"><div class="k">Noyaux</div><div class="v vi">+2</div></div>
      <div class="tile"><div class="k">Intégrité</div><div class="v ok">+0.60%</div></div>
    </div>
    <button class="btn pri wide" style="margin-top:10px" data-act="pkquit2">Retour</button></div>`, true);
};
ACTIONS.pkquit2 = () => { closeSheet(); go("poker"); checkStoryTriggers(); };
ACTIONS.pkendless = () => { S.poker.endless = true; S.stats.pokerWins++; ACTIONS.pkshop(); };

/* ---------- cache d'echange ---------- */
ACTIONS.pkshop = () => { closeSheet(); const P = S.poker; P.state = "shop"; pkRollShop(); save(); refresh(); };
function pkRollShop(){
  const P = S.poker;
  const owned = P.jokers.map(j=>j.id);
  const pool = JOKERS.filter(j=>!owned.includes(j.id));
  const weighted = [];
  for(const j of pool){ const w = [10,6,3,1][j.rar]; for(let i=0;i<w;i++) weighted.push(j); }
  const offer = [];
  for(let i=0;i<2 && weighted.length;i++){ const j = pick(weighted); if(!offer.includes(j)) offer.push(j); }
  const lic = LICENCES.filter(l=>!P.licences.includes(l.id));
  const prev = P.shop?.rerolls || 0;
  P.shop = {
    jokers: offer.map(j=>({id:j.id, cost:j.cost})),
    boosters: shuffle(BOOSTERS).slice(0,2).map(b=>({id:b.id, cost:b.cost})),
    licence: lic.length ? {id:pick(lic).id} : null,
    consum: (()=>{  /* une planète le plus souvent, un spectre de temps en temps */
      if(rng() < 0.72){ const p = pick(PLANETS); return {kind:"planet", id:p.id, cost:p.cost}; }
      const sp = pick(SPECTRALS); return {kind:"spectral", id:sp.id, cost:sp.cost};
    })(),
    rerolls: prev, rerollCost: Math.max(1, 2 + prev - (P.rerollCut||0))
  };
}
ACTIONS.pkreroll = () => {
  const P = S.poker;
  if(P.octets < P.shop.rerollCost) return;
  P.octets -= P.shop.rerollCost;
  const r = P.shop.rerolls + 1;
  pkRollShop(); P.shop.rerolls = r; P.shop.rerollCost = Math.max(1, 2 + r - (P.rerollCut||0));
  save(); refresh();
};
function jokerSlots(){
  const P = S.poker;
  return P.slots + P.jokers.filter(j=>jokerDef(j)?.passive==="slot").length;
}
ACTIONS.pkbuyj = d => {
  const P = S.poker, off = P.shop.jokers[+d.i];
  if(!off || P.octets < off.cost) return;
  if(P.jokers.length >= jokerSlots()){ toast("Aucun emplacement libre", "bad", "cross"); return; }
  const def = JOKERS.find(j=>j.id===off.id);
  P.octets -= off.cost;
  P.jokers.push({id:off.id, mem:0, uses:0});
  if(def.passive === "discard") P.discards++;
  if(def.passive === "hand") P.hands++;
  P.shop.jokers.splice(+d.i,1);
  Sfx.coin(); save(); refresh();
};
ACTIONS.pkbuylic = () => {
  const P = S.poker;
  const l = LICENCES.find(x=>x.id === P.shop.licence.id);
  if(!l || P.octets < l.cost) return;
  P.octets -= l.cost; P.licences.push(l.id); l.f(P);
  P.shop.licence = null;
  toast("Licence acquise : " + l.n, "warn", "star");
  Sfx.coin(); save(); refresh();
};
ACTIONS.pkjsell = d => {
  const P = S.poker, j = P.jokers[+d.i], def = jokerDef(j);
  if(def.passive === "discard") P.discards--;
  if(def.passive === "hand") P.hands--;
  P.octets += Math.max(1, Math.floor(def.cost/2));
  P.jokers.splice(+d.i,1);
  closeSheet(); save(); refresh();
};

/* ---------- boosters : ajouter des cartes au deck ---------- */
function boosterPool(kind){
  const P = S.poker;
  const arch = Object.keys(S.dex).map(Number);
  let pool = arch.length >= 12 ? arch : POKE_IDS.filter(i=>i<=151);
  if(kind === "evo")    pool = pool.filter(i=>stageOf(i) > 0);
  if(kind === "legend") pool = POKE_IDS.filter(i=>isLegend(i) && (S.dex[i] || i<=151));
  if(kind === "type"){
    const t = randInt(1,18);
    const f = pool.filter(i=>POKE[i].types.includes(t));
    if(f.length >= 3) pool = f;
  }
  if(P.rareBoost) pool = pool.slice().sort((a,b)=>POKE[b].bst-POKE[a].bst).slice(0, Math.max(8, Math.floor(pool.length/3)));
  if(!pool.length) pool = POKE_IDS.filter(i=>i<=151);
  return pool;
}
ACTIONS.pkbuyb = d => {
  const P = S.poker, off = P.shop.boosters[+d.i];
  if(!off || P.octets < off.cost) return;
  const b = BOOSTERS.find(x=>x.id===off.id);
  P.octets -= off.cost;
  P.shop.boosters.splice(+d.i,1);
  const pool = boosterPool(b.kind);
  const picks = [];
  for(let i=0;i<3 && pool.length;i++){ const id = pick(pool); if(!picks.includes(id)) picks.push(id); }
  const shiny = b.kind === "shiny" || rng() < 0.04*(P.shinyBoost||1);
  P.pendingBooster = {picks, shiny, n:b.n};
  save(); pkShowBooster();
};
function pkShowBooster(){
  const B = S.poker.pendingBooster;
  sheet(`${sheetHead(B.n)}
    <div class="tiny muted" style="margin-bottom:10px">Choisissez une carte : elle rejoint définitivement
      votre deck pour cette partie.</div>
    <div class="row" style="gap:7px;justify-content:center">
      ${B.picks.map(id=>pkCardHtml({u:-1,id,shiny:B.shiny,ed:""}, false,
         `data-act="pkpickb" data-id="${id}"`, true)).join("")}
    </div>`);
}
ACTIONS.pkpickb = d => {
  const P = S.poker, B = P.pendingBooster;
  const maxU = P.deck.reduce((a,c)=>Math.max(a,c.u), 0);
  P.deck.push({u:maxU+1, id:+d.id, shiny:B.shiny, ed:""});
  toast(POKE[+d.id].name + " rejoint le deck", "", "check");
  delete P.pendingBooster;
  closeSheet(); save(); refresh();
};

function applyPlanet(id){
  const P = S.poker;
  const pl = PLANETS.find(x=>x.id===id);
  P.levels[pl.hand] = (P.levels[pl.hand]||0) + 1;
  const b = handBase(pl.hand);
  toast(`${HANDS_BY_ID[pl.hand].n} niveau ${P.levels[pl.hand]+1} — ${b.chips} × ${b.mult}`, "warn", "bolt");
  Sfx.win();
}
function applySpectral(id){
  const P = S.poker;
  const sp = SPECTRALS.find(x=>x.id===id);
  if(sp.card){ pkPickCard(id); return; }
  if(id === "sp_hole"){
    for(const h of HANDS) P.levels[h.id] = (P.levels[h.id]||0) + 1;
    toast("Toutes les combinaisons gagnent un niveau", "warn", "star"); Sfx.win();
  }
  if(id === "sp_forge"){
    const owned = P.jokers.map(j=>j.id);
    const pool = JOKERS.filter(j=>j.rar === 3 && !owned.includes(j.id));
    if(!pool.length || P.jokers.length >= jokerSlots()){
      P.octets += 8; toast("Aucun emplacement libre — 8 Octets rendus", "bad", "coin"); return;
    }
    const j = pick(pool);
    P.jokers.push({id:j.id, mem:0, uses:0});
    toast("Programme légendaire : " + j.n, "warn", "star"); Sfx.win();
  }
  if(id === "sp_ante"){ P.discount = 0.75; toast("Prochain verrou abaissé de 25%", "warn", "bolt"); }
}
function pkPickCard(spectralId){
  const P = S.poker;
  const sp = SPECTRALS.find(x=>x.id===spectralId);
  const pool = shuffle(P.deck).slice(0, 12);
  sheet(`${sheetHead(sp.n)}
    <div class="tiny muted" style="margin-bottom:9px">${esc(sp.d)}</div>
    <div class="wrap" style="justify-content:center">
      ${pool.map(c=>pkCardHtml(c, false, `data-act="pkspcard" data-u="${c.u}" data-k="${spectralId}"`)).join("")}
    </div>`);
}
ACTIONS.pkspcard = d => {
  const P = S.poker;
  const c = P.deck.find(x=>x.u === +d.u);
  if(!c) return;
  const k = d.k;
  if(k === "sp_del"){ P.deck = P.deck.filter(x=>x.u !== c.u); toast("Carte retirée", "", "cross"); }
  else if(k === "sp_dup"){
    const maxU = P.deck.reduce((a,x)=>Math.max(a,x.u), 0);
    P.deck.push(Object.assign({}, c, {u:maxU+1}));
    toast("Carte dupliquée", "", "check");
  }
  else if(k === "sp_shiny"){ c.shiny = true; toast("Carte chromatique", "warn", "star"); }
  else if(k === "sp_evo"){
    const evo = POKE[c.id].evo;
    if(evo && evo.length){ c.id = evo[0].to; toast("Réécrite en " + POKE[c.id].name, "warn", "bolt"); }
    else toast("Cette espèce n'évolue pas", "bad", "cross");
  }
  else c.e = {sp_gold:"gold", sp_glass:"glass", sp_corrupt:"corrupt"}[k];
  closeSheet(); save(); refresh();
};
ACTIONS.pkbuycon = () => {
  const P = S.poker, off = P.shop.consum;
  if(!off || P.octets < off.cost) return;
  P.octets -= off.cost;
  P.shop.consum = null;
  if(off.kind === "planet") applyPlanet(off.id); else applySpectral(off.id);
  save(); refresh();
};

ACTIONS.pknext = () => {
  const P = S.poker;
  const st = pkStage();
  if(st === "elite"){
    P.eliteIdx = (P.eliteIdx || 0) + 1;
    if(P.eliteIdx >= ELITE_NAMES.length){ P.stage = "champion"; P.eliteIdx = 0; }
  } else if(st === "champion"){
    /* au-dela, la Couche Zero recommence le cycle des antes */
    P.stage = "ante"; P.ante++; P.blind = 0;
  } else {
    P.blind++;
    if(P.blind > 2){
      P.blind = 0; P.ante++;
      if(P.ante > 8 && (P.badges||[]).length >= 8){ P.stage = "elite"; P.eliteIdx = 0; }
    }
  }
  P.state = "blind"; save(); refresh();
};
ACTIONS.pkstartblind = () => { pkStartRound(); refresh(); };
ACTIONS.pkskip = () => {
  const P = S.poker;
  if(P.blind === 2) return;
  P.octets += 3 + P.blind;
  /* contourner un verrou ameliore une main : le risque paie autrement */
  const keys = Object.keys(P.playedTypes);
  const k = keys.length ? keys.sort((a,b)=>P.playedTypes[b]-P.playedTypes[a])[0] : "paire";
  P.levels[k] = (P.levels[k]||0)+1;
  toast(`Contourné : +${3+P.blind} Octets et ${HANDS_BY_ID[k].n} niveau ${P.levels[k]+1}`, "warn", "bolt");
  ACTIONS.pknext();
};
ACTIONS.pkplay = () => pkPlay();
ACTIONS.pkdiscard = () => pkDiscard();
ACTIONS.pkcard = d => pkToggle(+d.u);
ACTIONS.pkstart = () => startPoker();
ACTIONS.pkabandon = () => {
  sheet(`${sheetHead("Abandonner la partie ?")}<div class="tiny muted">La progression de la partie est perdue.</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn ghost" data-act="closesheet">Continuer</button>
      <button class="btn dan" data-act="pkquit">Abandonner</button></div>`, true);
};
ACTIONS.pkinfo = () => {
  const P = S.poker;
  sheet(`${sheetHead("Combinaisons")}
    <div class="tiny muted" style="margin-bottom:9px">Les cartes sont des Pokémon : les combinaisons se lisent
      en espèces identiques, en familles d'évolution, en types et en chromatiques.</div>
    <div class="list">${HANDS.map(h=>{
      const lv = handLevel(h.id), b = handBase(h.id), played = P?.playedTypes[h.id] || 0;
      const hide = h.secret && !played;
      return `<div class="item">
        <div class="grow"><div class="t">${hide?"Combinaison secrète":esc(h.n)}
          ${lv?`<span class="cy tiny">niv.${lv+1}</span>`:""}</div>
          <div class="d">${hide?"Elle se révélera quand vous la réussirez.":esc(h.d)}</div></div>
        <div class="center" style="min-width:74px">
          <div class="tiny"><b class="cy">${b.chips}</b> <span class="muted">×</span>
            <b class="bad">${b.mult}</b></div>
          <div class="tiny dim">joué ${played}×</div></div>
      </div>`;}).join("")}</div>`);
};
ACTIONS.pkjinfo = d => {
  const P = S.poker, i = +d.i, j = P.jokers[i], def = jokerDef(j);
  sheet(`${sheetHead(def.n)}
    <div class="row" style="gap:11px">
      <span class="sprbox jr${def.rar}" style="width:56px;height:56px;border-radius:4px">
        ${sprite(def.spr, false, "")}</span>
      <div class="grow">
        <span class="tt rar r${def.rar}" style="--rc:${RARITY[def.rar].c}">
          ${"◆".repeat(def.rar+1)} ${RAR_NAME[def.rar]}</span>
        <div class="tiny" style="margin-top:6px">${esc(def.d)}</div>
        ${def.fragile?`<div class="tiny bad" style="margin-top:4px">Utilisations : ${(j.uses||0)}/${def.fragile}</div>`:""}
      </div>
    </div>
    <div class="panel tight" style="margin-top:11px">
      <div class="h sm">ORDRE D'EXÉCUTION — position ${i+1} sur ${P.jokers.length}</div>
      <div class="tiny muted">Les programmes s'appliquent de gauche à droite. Un multiplicateur
        placé en dernier agit sur tout ce qui précède : l'ordre change le score.</div>
      <div class="btn-grid c2" style="margin-top:8px">
        <button class="btn sm" data-act="pkjmove" data-i="${i}" data-d="-1" ${i===0?"disabled":""}>
          ◀ Vers la gauche</button>
        <button class="btn sm" data-act="pkjmove" data-i="${i}" data-d="1"
          ${i===P.jokers.length-1?"disabled":""}>Vers la droite ▶</button>
      </div>
    </div>
    <button class="btn dan wide" style="margin-top:9px" data-act="pkjsell" data-i="${i}">
      Revendre (+${Math.max(1,Math.floor(def.cost/2))} Octets)</button>`, true);
};
ACTIONS.pkjmove = d => {
  const P = S.poker, i = +d.i, j = i + (+d.d);
  if(j < 0 || j >= P.jokers.length) return;
  [P.jokers[i], P.jokers[j]] = [P.jokers[j], P.jokers[i]];
  save();
  ACTIONS.pkjinfo({i:String(j)});
  refresh();
};
ACTIONS.pkdeck = () => {
  const P = S.poker;
  const byFam = {};
  for(const c of P.deck) (byFam[famOf(c.id)] = byFam[famOf(c.id)] || []).push(c);
  sheet(`${sheetHead(`Deck — ${P.deck.length} cartes`)}
    <div class="tiny muted" style="margin-bottom:9px">Regroupé par famille d'évolution.
      Les lignées complètes ouvrent les meilleures combinaisons.</div>
    ${Object.entries(byFam).sort((a,b)=>b[1].length-a[1].length).map(([root,cs])=>`
      <div class="panel tight">
        <div class="tiny cy" style="margin-bottom:5px">${esc(POKE[root].name)} — ${cs.length} carte(s)</div>
        <div class="wrap">${cs.map(c=>`<span class="chip">
          <span class="sprbox" style="width:22px;height:22px">${sprite(c.id,c.shiny,"")}</span>
          ${esc(POKE[c.id].name)}${c.shiny?' <span class="gold-t">◆</span>':""}</span>`).join("")}</div>
      </div>`).join("")}`);
};

/* ---------- rendu ---------- */
function pkCardHtml(c, selected, attrs, big, extraCls){
  const p = POKE[c.id];
  const t = p.types[0];
  const ed = c.ed || "";
  return `<div class="pcard ${selected?"sel":""} ${ed} ${c.shiny?"shy":""} ${big?"big":""} ${extraCls||""} t${t}bg" ${attrs||""}>
    <div class="pc-top">
      <span class="pc-nm">${esc(p.name)}</span>
      ${c.shiny?'<span class="pc-sh">◆</span>':""}
    </div>
    <span class="sprbox pc-art">${sprite(c.id, c.shiny, "")}</span>
    <div class="pc-bot">
      <span class="tt t${t}">${TYPE_NAMES[t]}</span>
      <span class="pc-ch">${cardChips(c)}</span>
    </div>
    ${stageOf(c.id)?`<span class="pc-st">${"·".repeat(stageOf(c.id))}</span>`:""}
  </div>`;
}
function pkRenderLive(){
  const P = S.poker;
  const res = P.sel.length ? pkScore(true) : null;
  const line = document.getElementById("pk-score-line");
  if(line){
    line.innerHTML = res
      ? `<span class="pk-hn">${esc(res.handName)}</span>
         <span class="chips">${fmt(res.chips)}</span><span class="muted">×</span>
         <span class="mult">${res.mult.toFixed(res.mult%1?2:0)}</span>
         <span class="muted">=</span><span class="gold-t">${fmt(res.total)}</span>`
      : `<span class="muted tiny">Sélectionnez jusqu'à 5 cartes</span>`;
  }
  document.querySelectorAll("#hand .pcard").forEach(el=>{
    el.classList.toggle("sel", P.sel.includes(+el.dataset.u));
  });
  const pb = document.getElementById("pk-play"), db = document.getElementById("pk-disc");
  if(pb) pb.disabled = !P.sel.length || P.handsLeft<=0;
  if(db) db.disabled = !P.sel.length || P.discardsLeft<=0;
}

SCREENS.poker = {
  html(){
    const P = S.poker;
    if(!P) return this.lobby();
    if(P.state === "blind")   return this.blindView(P);
    if(P.state === "shop")    return this.shopView(P);
    if(P.state === "resolve") return this.playView(P, true);
    return this.playView(P);
  },
  lobby(){
    const ok = moduleUnlocked("poker");
    return `
      <div class="h">${ic("cards")} POKÉ-POKER ${infoBtn("poker")}</div>
      <div class="sub">Les données rares se rangent par motifs.</div>
      ${moduleGoal("Composez des mains avec des Pokémon : espèces identiques, familles d'évolution, types, chromatiques. Les programmes achetés entre deux manches multiplient tout.",
        "Beaucoup de Fragments, des Noyaux, et de l'intégrité en cas de partie complète.")}
      <div class="panel bracket">
        <div class="tiny">Un deck de 52 <b class="cy">Pokémon</b>. Les combinaisons ne se lisent pas en
          couleurs et en rangs, mais en <b>espèces identiques</b>, <b>familles d'évolution</b>,
          <b>types</b> et <b>chromatiques</b>. Chaque main marque
          <b class="cy">Jetons</b> × <b class="bad">Multiplicateur</b>.</div>
        <hr class="sep">
        <div class="tiny">Trois verrous par ante, huit antes pour stabiliser la couche. Entre deux verrous,
          la cache vend des <b>programmes</b>, des <b>licences</b> et des <b>boosters</b> qui ajoutent
          des espèces de votre archive à votre deck.</div>
      </div>
      <div class="tiles" style="margin-bottom:10px">
        <div class="tile accent"><div class="k">Meilleure ante</div><div class="v">${S.pokerMeta.bestAnte||0}</div></div>
        <div class="tile gold"><div class="k">Parties gagnées</div><div class="v">${S.stats.pokerWins}</div></div>
        <div class="tile"><div class="k">Meilleur score</div><div class="v">${fmt(S.stats.pokerBest||0)}</div></div>
        <div class="tile"><div class="k">Archive</div><div class="v">${dexTotal()}</div></div>
      </div>
      <button class="btn pri wide" data-act="pkstart" ${ok?"":"disabled"}>Lancer une partie</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="pkinfo">Voir les combinaisons</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  },
  blindView(P){
    const boss = P.blind === 2 || pkStage() !== "ante";
    return `
      <div class="row between"><div class="h" style="margin:0">${esc(pkStageLabel())}</div>
        <span class="pill">${ic("coin")} ${P.octets}</span></div>
      ${badgeRow()}
      <div class="blind-card" style="${boss?"":"border-color:var(--line);background:linear-gradient(180deg,var(--s2),var(--s1))"}">
        <div class="h sm" style="color:${boss?"var(--magenta)":"var(--cyan)"}">${esc(pkBlindLabel())}</div>
        <div class="row between">
          <div><div class="tiny dim">Score requis</div>
            <div style="font-family:var(--font-px);font-size:14px">${fmt(P.target || anteTarget(P.ante,P.blind))}</div></div>
          <div class="center"><div class="tiny dim">Récompense</div>
            <div class="gold-t">${3+P.blind} Octets</div></div>
        </div>
        ${boss?`<hr class="sep"><div class="tiny bad">Un verrou de secteur impose une contrainte.
          Elle se révèle à l'entrée.</div>`:""}
      </div>
      <div class="btn-grid ${boss?"":"c2"}">
        <button class="btn pri" data-act="pkstartblind">Entrer</button>
        ${boss?"":`<button class="btn" data-act="pkskip">Contourner</button>`}
      </div>
      ${boss?"":`<div class="tiny dim center" style="margin-top:5px">Contourner rapporte des Octets et
        améliore votre combinaison favorite, mais ne fait pas progresser le score.</div>`}
      ${this.jokerRow(P)}
      <div class="btn-grid c3" style="margin-top:9px">
        <button class="btn sm ghost" data-act="pkinfo">Combinaisons</button>
        <button class="btn sm ghost" data-act="pkdeck">Deck (${P.deck.length})</button>
        <button class="btn sm dan" data-act="pkabandon">Abandonner</button>
      </div>`;
  },
  playView(P, resolving){
    const shown = resolving ? (P.resolvePlayed||[]) : null;
    return `
      <div class="row between" style="margin-bottom:4px">
        <div class="h" style="margin:0">${esc(pkStageLabel())} · ${esc(pkBlindLabel())}</div>
        <span class="pill">${ic("coin")} ${P.octets}</span>
      </div>
      ${badgeRow()}
      ${P.boss?`<div class="blind-card"><b class="bad">${esc(P.boss.n)}</b>
        <div class="tiny">${esc(P.boss.d)}</div></div>`:""}
      <div id="poker-felt">
        <div class="row between tiny">
          <span class="muted">Objectif</span>
          <b class="mono-num">${fmt(P.score)} / ${fmt(P.target)}</b>
        </div>
        <div class="bar thick" style="margin:5px 0 4px"><i style="width:${Math.min(100,P.score/P.target*100)}%"></i></div>
        <div class="score-line" id="pk-score-line"><span class="muted tiny">Sélectionnez jusqu'à 5 cartes</span></div>
        ${this.jokerRow(P)}
        <div id="hand" class="${resolving?"resolving":""}">
          ${P.hand.map(c=>{
            const inPlay = resolving && shown.includes(c.u);
            const dim = resolving && !inPlay;
            return pkCardHtml(c, inPlay, `data-u="${c.u}"${resolving?"":' data-act="pkcard"'}`,
              false, dim ? "dimmed" : "");
          }).join("")}
        </div>
        <div class="handinfo">
          <span>Mains <b class="cy">${P.handsLeft}</b></span>
          <span>Défausses <b class="gold-t">${P.discardsLeft}</b></span>
          <span>Pioche ${P.draw.length}</span>
        </div>
        ${resolving
          ? `<button class="btn wide ghost" data-act="pkskipres" style="margin-top:5px">Passer l'animation</button>`
          : `<div class="btn-grid c2" style="margin-top:5px">
          <button class="btn pri" id="pk-play" data-act="pkplay" ${P.sel.length&&P.handsLeft>0?"":"disabled"}>Jouer</button>
          <button class="btn" id="pk-disc" data-act="pkdiscard" ${P.sel.length&&P.discardsLeft>0?"":"disabled"}>Défausser</button>
        </div>`}
      </div>
      <div class="btn-grid c3" style="margin-top:9px">
        <button class="btn sm ghost" data-act="pkinfo">Combinaisons</button>
        <button class="btn sm ghost" data-act="pkdeck">Deck</button>
        <button class="btn sm dan" data-act="pkabandon">Abandonner</button>
      </div>`;
  },
  shopView(P){
    const lic = P.shop.licence ? LICENCES.find(l=>l.id===P.shop.licence.id) : null;
    return `
      <div class="row between"><div class="h" style="margin:0">CACHE D'ÉCHANGE</div>
        <span class="pill">${ic("coin")} ${P.octets} Octets</span></div>
      ${badgeRow()}
      ${this.jokerRow(P)}
      <div class="tiny dim" style="margin:5px 0 9px">${P.jokers.length}/${jokerSlots()} emplacements utilisés</div>

      <div class="h sm">PROGRAMMES</div>
      <div class="list">
        ${P.shop.jokers.length ? P.shop.jokers.map((o,i)=>{
          const j = JOKERS.find(x=>x.id===o.id);
          return `<div class="shopitem">
            <span class="sprbox" style="width:38px;height:38px">${sprite(j.spr,false,"")}</span>
            <div class="grow"><div>${esc(j.n)}
              <span class="tt rar r${j.rar}" style="--rc:${RARITY[j.rar].c}">
                ${"◆".repeat(j.rar+1)} ${RAR_NAME[j.rar]}</span></div>
              <div class="tiny muted">${esc(j.d)}</div></div>
            <button class="btn sm ${P.octets>=o.cost?"gold":""}" data-act="pkbuyj" data-i="${i}"
              ${P.octets>=o.cost?"":"disabled"}>${o.cost}</button></div>`;}).join("")
          : `<div class="empty">Stock épuisé.</div>`}
      </div>

      <div class="h sm" style="margin-top:11px">BOOSTERS</div>
      <div class="list">
        ${P.shop.boosters.length ? P.shop.boosters.map((o,i)=>{
          const b = BOOSTERS.find(x=>x.id===o.id);
          return `<div class="shopitem"><div class="ic">${ic("chest")}</div>
            <div class="grow"><div>${esc(b.n)}</div><div class="tiny muted">${esc(b.d)}</div></div>
            <button class="btn sm ${P.octets>=o.cost?"gold":""}" data-act="pkbuyb" data-i="${i}"
              ${P.octets>=o.cost?"":"disabled"}>${o.cost}</button></div>`;}).join("")
          : `<div class="empty">Stock épuisé.</div>`}
      </div>

      ${P.shop.consum ? (()=>{
        const o = P.shop.consum;
        const def = o.kind === "planet" ? PLANETS.find(x=>x.id===o.id) : SPECTRALS.find(x=>x.id===o.id);
        const lv = o.kind === "planet" ? (P.levels[def.hand]||0) : 0;
        const desc = o.kind === "planet"
          ? `${HANDS_BY_ID[def.hand].n} passe au niveau ${lv+2}`
          : def.d;
        return `<div class="h sm" style="margin-top:11px">${o.kind==="planet"?"PLANÈTE":"SPECTRE"}</div>
          <div class="shopitem ${o.kind==="spectral"?"spectral":"planet"}">
            <div class="ic">${ic(o.kind==="planet"?"core":"shard2")}</div>
            <div class="grow"><div>${esc(def.n)}</div><div class="tiny muted">${esc(desc)}</div></div>
            <button class="btn sm ${P.octets>=o.cost?"gold":""}" data-act="pkbuycon"
              ${P.octets>=o.cost?"":"disabled"}>${o.cost}</button></div>`;
      })() : ""}
      ${lic?`<div class="h sm" style="margin-top:11px">LICENCE</div>
        <div class="shopitem"><div class="ic">${ic("star")}</div>
          <div class="grow"><div>${esc(lic.n)}</div><div class="tiny muted">${esc(lic.d)}</div>
            <div class="tiny dim">Amélioration permanente pour toute la partie.</div></div>
          <button class="btn sm ${P.octets>=lic.cost?"gold":""}" data-act="pkbuylic"
            ${P.octets>=lic.cost?"":"disabled"}>${lic.cost}</button></div>`:""}

      <div class="btn-grid c2" style="margin-top:11px">
        <button class="btn" data-act="pkreroll" ${P.octets>=P.shop.rerollCost?"":"disabled"}>
          ${ic("refresh")} Relancer (${P.shop.rerollCost})</button>
        <button class="btn pri" data-act="pknext">Verrou suivant</button>
      </div>
      <button class="btn ghost wide sm" style="margin-top:7px" data-act="pkdeck">Consulter le deck (${P.deck.length})</button>`;
  },
  jokerRow(P){
    const slots = jokerSlots();
    const cells = [];
    for(let i=0;i<slots;i++){
      const j = P.jokers[i];
      if(j){
        const def = jokerDef(j);
        cells.push(`<div class="joker jr${def.rar}" data-i="${i}" data-act="pkjinfo">
          <span class="jrar">${"◆".repeat(def.rar+1)}</span>
          <span class="sprbox" style="width:28px;height:28px">${sprite(def.spr,false,"")}</span>
          <div class="jn">${esc(def.n)}</div></div>`);
      } else cells.push(`<div class="slot-empty">+</div>`);
    }
    return `<div id="jokers">${cells.join("")}</div>`;
  },
  after(){ if(S.poker && S.poker.state === "play" && !RESOLVE) pkRenderLive(); }
};
