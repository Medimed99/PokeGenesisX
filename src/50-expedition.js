/* ============================================================
   50 — EXPEDITION (roguelike a embranchements)
   ============================================================ */

const EXP_ROWS = 12, EXP_COLS = 4;   /* EXP_ROWS : l'echelle de difficulte (12 paliers), pas la carte */
/* Une Expedition traverse plusieurs secteurs. Chaque secteur est une carte au
   meme dessin — un treillis de losanges, comme dans Pokelike — avec un Champion
   au bout. Le badge obtenu ouvre la carte suivante ; le dernier secteur se
   termine sur le Noyau. */
const EXP_MAPS = 3;
const MAP_SHAPE = [2, 3, 4, 3, 4, 3, 2, 1];
const MAP_ROWS = MAP_SHAPE.length;

const NODE_TYPES = {
  fight:   {n:"Sauvage",    i:"battle", c:"var(--ink)"},
  trainer: {n:"Dresseur",   i:"user",   c:"var(--cyan)"},
  elite:   {n:"Élite",      i:"boss",   c:"var(--magenta)"},
  draft:   {n:"Recrutement",i:"heart",  c:"var(--green)"},
  swap:    {n:"Échange",    i:"refresh",c:"var(--violet)"},
  event:   {n:"Événement",  i:"eye",    c:"var(--violet)"},
  shop:    {n:"Cache",      i:"shop",   c:"var(--amber)"},
  rest:    {n:"Repos",      i:"heart",  c:"var(--green)"},
  treasure:{n:"Trésor",     i:"chest",  c:"var(--amber)"},
  boss:    {n:"Noyau",      i:"boss",   c:"var(--magenta)"},
  champ:   {n:"Champion",   i:"boss",   c:"var(--amber)"},
  legend:  {n:"Sanctuaire", i:"star",   c:"var(--gold)"}
};

/* ============================================================
   BORNES DE PUISSANCE
   Le niveau seul ne suffit pas a contenir la difficulte : un
   Pokemon a 600 de total de statistiques ecrase un etage entier
   meme au meme niveau. Chaque etage tire donc dans une fourchette
   de total, ce qui rend la courbe de puissance lisible et empeche
   de trouver un monstre a l'etage deux.
   ============================================================ */
const BST_BANDS = [
  [200, 320], [230, 350], [270, 390], [300, 420],
  [330, 450], [360, 470], [390, 490], [410, 510],
  [430, 530], [450, 545], [470, 560], [500, 999]
];
function bstBand(floor){
  return BST_BANDS[clamp(floor, 0, BST_BANDS.length - 1)];
}
/* tirage d'une espece sauvage bornee par l'etage */
function wildIdFor(floor, opts){
  opts = opts || {};
  const [lo, hi] = bstBand(floor);
  const pool = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || p.leg || isExclusive(i)) continue;
      if(p.bst < lo || p.bst > hi) continue;
      if(opts.type && !p.types.includes(opts.type)) continue;
      pool.push(i);
    }
  if(pool.length) return pick(pool);
  /* fourchette vide (type rare a cet etage) : on relache la contrainte de type */
  return opts.type ? wildIdFor(floor) : randomWildId();
}

/* ============================================================
   DES POKÉMON À LEUR PLACE
   Dans un parcours a secteurs, un adversaire de niveau 10 est une
   forme de base, pas un Dracolosse : chaque espece a un niveau
   d'apparition (celui de son evolution, ou un palier selon sa
   puissance si elle n'evolue pas). C'est ce qui rend les
   evolutions de l'equipe decisives.
   ============================================================ */
const MIN_LV = {};
function minLevelOf(id){
  if(MIN_LV[id] !== undefined) return MIN_LV[id];
  let v = 1;
  const prev = POKE_IDS.find(i => POKE[i].evo && POKE[i].evo.some(e => e.to === id));
  if(prev){
    const e = POKE[prev].evo.find(e => e.to === id);
    v = Math.max(minLevelOf(prev) + 4, e.stone ? 24 : (e.lvl || 28));
  } else {
    const b = POKE[id].bst;
    v = b >= 520 ? 40 : b >= 470 ? 28 : b >= 420 ? 18 : b >= 380 ? 10 : 1;
  }
  return MIN_LV[id] = v;
}
/* une espece plausible a ce niveau : ni trop faible (on garde le haut du panier), ni hors d'atteinte */
function levelWildId(level, opts){
  opts = opts || {};
  const span = opts.top ? 10 : 22;
  const pool = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || p.leg || isExclusive(i)) continue;
      if(opts.type && !p.types.includes(opts.type)) continue;
      const m = minLevelOf(i);
      if(m <= level && m >= level - span) pool.push(i);
    }
  if(pool.length) return pick(pool);
  /* un type rare a ce niveau : on garde le type et on prend l'espece la plus proche, plutot que d'en changer */
  if(opts.type){
    let best = null, bd = 1e9;
    for(const r of unlockedRegions()) for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || p.leg || isExclusive(i) || !p.types.includes(opts.type)) continue;
      const d = Math.abs(minLevelOf(i) - level);
      if(d < bd){ bd = d; best = i; }
    }
    if(best) return best;
    return levelWildId(level, {top:opts.top});
  }
  return opts.top ? levelWildId(level) : randomWildId();
}

/* ============================================================
   POIDS DE NŒUDS PAR COUCHE
   Le debut de parcours doit servir a batir l'equipe, la fin a la
   mettre a l'epreuve. Des poids constants du premier au dernier
   etage donnent un parcours sans arc.
   ============================================================ */
const NODE_W = [
  /* étage 0 : on part toujours au contact */
  null,
  {fight:30, draft:34, event:10, shop:12, treasure:14},
  {fight:26, draft:26, trainer:16, event:12, shop:10, treasure:10},
  {fight:20, draft:18, trainer:22, elite:8,  event:14, rest:8,  shop:6,  swap:4},
  {fight:18, draft:14, trainer:24, elite:10, event:14, rest:8,  shop:6,  swap:6},
  {fight:16, draft:12, trainer:24, elite:12, event:15, rest:9,  shop:6,  swap:6},
  {fight:14, draft:10, trainer:24, elite:14, event:16, rest:10, shop:6,  swap:6},
  {fight:13, draft:8,  trainer:24, elite:16, event:16, rest:11, shop:6,  swap:6},
  {fight:12, draft:7,  trainer:23, elite:18, event:16, rest:12, shop:6,  swap:6},
  {fight:12, draft:6,  trainer:22, elite:20, event:16, rest:12, shop:6,  swap:6},
  {fight:12, draft:5,  trainer:20, elite:22, event:16, rest:13, shop:6,  swap:6}
];


const RELICS = [
  {id:"r_atk", n:"Registre offensif",  d:"+18% d'Attaque et d'Attaque Spéciale.",  f:t=>{t.atk*=1.18;t.spa*=1.18;}},
  {id:"r_def", n:"Tampon défensif",    d:"+22% de Défense et Défense Spéciale.",   f:t=>{t.def*=1.22;t.spd*=1.22;}},
  {id:"r_hp",  n:"Bloc de mémoire",    d:"+25% de PV max.",                        f:t=>{t.maxHp=Math.floor(t.maxHp*1.25);t.hp=t.maxHp;}},
  {id:"r_spe", n:"Horloge accélérée",  d:"+30% de Vitesse.",                       f:t=>{t.spe*=1.3;}},
  {id:"r_heal",n:"Auto-réparation",    d:"Soigne 18% des PV après chaque combat.", post:0.18},
  {id:"r_heal2",n:"Routine de soin",   d:"Soigne 32% des PV après chaque combat.", post:0.32},
  {id:"r_bits",n:"Collecteur",         d:"+60% de Bits gagnés.",                   bits:1.6},
  {id:"r_recr",n:"Protocole d'accueil",d:"Un choix de recrue supplémentaire.",     recruit:1},
  {id:"r_rest",n:"Veille prolongée",   d:"Les nœuds Repos soignent totalement.",   rest:1},
  {id:"r_elite",n:"Appât à verrous",   d:"Les Élites donnent le double de butin.", elite:2},
  {id:"r_fire",n:"Noyau thermique",    d:"+35% de dégâts des attaques Feu.",       dmgType:10},
  {id:"r_water",n:"Noyau hydrique",    d:"+35% de dégâts des attaques Eau.",       dmgType:11},
  {id:"r_elec",n:"Noyau électrique",   d:"+35% de dégâts des attaques Électrik.",  dmgType:13},
  {id:"r_psy", n:"Noyau psionique",    d:"+35% de dégâts des attaques Psy.",       dmgType:14},
  {id:"r_rev", n:"Réindexation auto",  d:"Une fois par parcours : après un combat perdu, un allié se relève à 40 % et le combat reprend.", revive:1},
  {id:"r_shard",n:"Extracteur",        d:"+8 Fragments par combat remporté.",      shard:8},
  {id:"r_xp",  n:"Compilateur",        d:"Niveau permanent supplémentaire à la fin du run.", xp:1},
  {id:"r_corr",n:"Affinité corrompue", d:"+8% de dégâts par palier de corruption du run.", corr:1}
];

const EXP_EVENTS = [
  {n:"Terminal abandonné", t:"Un terminal encore allumé affiche un formulaire vide. Le curseur clignote.",
   opts:[{t:"Écrire son nom", f:r=>{ r.bits += 40; return "Le terminal verse 40 Bits sans explication."; }},
         {t:"Effacer le champ", f:r=>{ healTeam(r, .25); return "Quelque chose se détend. L'équipe récupère 25% de ses PV."; }}]},
  {n:"Fragment instable", t:"Un éclat de code flotte en travers du couloir. Il vibre à une fréquence désagréable.",
   opts:[{t:"L'absorber", f:r=>{ const rel = grantRelic(r); return rel ? "Relique acquise : "+rel.n : "Rien à en tirer."; }},
         {t:"Le contourner", f:r=>{ r.bits += 25; return "Prudence récompensée : 25 Bits trouvés plus loin."; }}]},
  {n:"Cage de données", t:"Une entité est bloquée dans une boucle. Elle répète la même animation depuis longtemps.",
   opts:[{t:"La libérer", f:r=>{ const id = (r.pend && r.pend.cid) || randomWildId();
            if(r.team.length >= 6){ r.bits += 60; return POKE[id].name+" s'échappe : l'équipe est complète. Elle laisse 60 Bits derrière elle."; }
            r.team.push(newRunMon(r, id, r.maps ? teamAvgLevel(r) : undefined)); return POKE[id].name+" rejoint l'expédition."; }},
         {t:"La laisser", f:r=>{ r.bits += 60; return "Vous récupérez les Bits accumulés dans la boucle : +60."; }}]},
  {n:"Miroir de secteur", t:"Le couloir se dédouble. Une version de votre équipe avance en sens inverse.",
   opts:[{t:"Traverser", f:r=>{ r.corruption++; r.bits += 90; return "Corruption +1. Le butin s'améliore, les ennemis aussi."; }},
         {t:"Faire demi-tour", f:r=>{ healTeam(r,.15); return "L'équipe souffle un peu. +15% de PV."; }}]},
  {n:"Sauvegarde orpheline", t:"Un fichier de sauvegarde daté d'une connexion antérieure. Le nom de l'utilisateur est illisible ; il compte autant de signes que le vôtre.",
   opts:[{t:"Le lire", f:r=>{ r.bits += 70; r.corruption++; return "Vous apprenez quelque chose d'utile. Et d'inquiétant."; }},
         {t:"Le supprimer", f:r=>{ healTeam(r,.4); return "Le couloir s'allège. L'équipe récupère 40% de ses PV."; }}]},
  {n:"Distributeur défectueux", t:"Une machine propose trois boutons non étiquetés.",
   opts:[{t:"Appuyer", f:r=>{ if(rng()<.5){ r.bits += 120; return "+120 Bits."; } damageTeam(r,.2); return "Décharge. L'équipe perd 20% de ses PV."; }},
         {t:"S'abstenir", f:r=>"Vous passez votre chemin."}]},
  {n:"Colonne de bruit", t:"Une colonne de statique traverse le sol et le plafond. Elle chante presque.",
   opts:[{t:"Y plonger une main", f:r=>{ const rel = grantRelic(r); damageTeam(r,.15); return (rel?"Relique : "+rel.n:"Rien.")+" L'équipe est secouée."; }},
         {t:"L'écouter", f:r=>{ r.heals++; return "Vous repartez avec une trousse de restauration."; }}]},
  {n:"Ancien archiviste", t:"Une silhouette assise contre un mur. Elle n'a plus de texture, seulement un contour. Elle porte une casquette.",
   opts:[{t:"Lui parler", f:r=>{ healTeam(r,1); return "Elle ne répond pas, mais votre équipe est entièrement restaurée."; }},
         {t:"Prendre son sac", f:r=>{ r.bits += 100; r.heals += 2; r.corruption++; return "+100 Bits, 2 restaurations. Vous ne vous retournez pas."; }}]}
];

/* ---------- helpers de run ---------- */
function randomWildId(){
  const regs = unlockedRegions();
  const r = pick(regs);
  for(let k=0;k<40;k++){ const id = randInt(r.from, r.to); if(POKE[id] && !POKE[id].leg && !isExclusive(id)) return id; }
  return r.from;
}
function newRunMon(run, id, lvl){
  const level = lvl || run.level;
  const f = makeFighter(id, level, {shiny: S.dex[id]?.shiny});
  applyRelics(run, f);
  return {id, level, hp:f.maxHp, maxHp:f.maxHp, item:null};
}
function runFighter(run, m){
  const f = makeFighter(m.id, m.level, {shiny: runShiny(m), owned:true});
  applyRelics(run, f);
  applyExpItem(m, f);
  f.maxHp = m.maxHp || f.maxHp;
  f.hp = clamp(m.hp, 0, f.maxHp);
  f.ref = m;
  return f;
}
function applyRelics(run, f){
  for(const rid of run.relics){
    const r = RELICS.find(x=>x.id===rid);
    if(r && r.f) r.f(f);
  }
  f.atk=Math.floor(f.atk); f.spa=Math.floor(f.spa); f.def=Math.floor(f.def);
  f.spd=Math.floor(f.spd); f.spe=Math.floor(f.spe);
}
function relicVal(run, key){
  let v = 0;
  for(const rid of run.relics){ const r = RELICS.find(x=>x.id===rid); if(r && r[key]) v += r[key]; }
  return v;
}
function hasRelic(run, id){ return run.relics.includes(id); }
function grantRelic(run){
  const avail = RELICS.filter(r=>!run.relics.includes(r.id));
  if(!avail.length) return null;
  const r = pick(avail);
  run.relics.push(r.id);
  return r;
}
/* Un membre tombe ne revient pas. Aucun soin, aucun repos, aucune relique de
   confort ne le releve : seule la Reindexation automatique le peut, et elle est
   rare. C'est ce qui donne du poids a chaque choix de route. */
function healTeam(run, pct){
  for(const m of run.team){
    if(m.hp <= 0) continue;
    m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp*pct));
  }
}
function fallen(run){ return run.team.filter(m=>m.hp <= 0); }
function damageTeam(run, pct){
  for(const m of run.team){ m.hp = Math.max(1, m.hp - Math.floor(m.maxHp*pct)); }
}

/* ============================================================
   GÉNÉRATION DE CARTE — le treillis
   Toujours le meme dessin : 2, 3, 4, 3, 4, 3, 2 noeuds, puis le
   Champion. Chaque noeud mene aux deux noeuds en diagonale sous lui ;
   les liaisons forment des losanges et ne se croisent jamais. Le
   dessin ne change pas : ce sont les noeuds qui changent, et c'est
   en les lisant que l'on choisit sa route.
   ============================================================ */
function expFloorOf(mapIdx, y, maps){
  maps = maps || 1;
  const steps = maps * MAP_ROWS - 1;
  return Math.round((mapIdx * MAP_ROWS + y) * (EXP_ROWS - 1) / Math.max(1, steps));
}
function latticeCols(n){ return n === 4 ? [0, 1, 2, 3] : n === 3 ? [0.5, 1.5, 2.5] : n === 2 ? [1, 2] : [1.5]; }
function genMap(seed, opts){
  opts = opts || {};
  const r = mulberry32(seed);
  const mapIdx = opts.mapIdx || 0, maps = opts.maps || 1;
  const final = mapIdx >= maps - 1;
  const last = MAP_ROWS - 1;
  const rows = MAP_SHAPE.map((n, y) => latticeCols(n).map(c => {
    const fl = expFloorOf(mapIdx, y, maps);
    let t;
    if(y === last) t = final ? "boss" : "champ";
    else if(y === 0 && mapIdx === 0) t = "fight";          /* on part toujours au contact */
    else t = latticeType(fl, r);
    return {c, t, next: [], done: false};
  }));
  /* juste avant le Champion : un Centre Pokemon d'un cote, autre chose de l'autre.
     Se soigner, ou prendre un dernier avantage : c'est un choix, pas un acquis. */
  const pre = rows[last - 1], heal = Math.floor(r() * pre.length);
  pre.forEach((n, i) => { if(i === heal) n.t = "rest"; else if(n.t === "rest") n.t = latticeType(expFloorOf(mapIdx, last - 1, maps), r, "rest"); });
  /* de la variete : pas deux services identiques cote a cote ni a la suite */
  const RARE = new Set(["rest", "shop", "swap", "treasure", "draft", "event"]);
  for(let y = 1; y < last - 1; y++){
    rows[y].forEach((n, k) => {
      for(let tries = 0; tries < 4 && RARE.has(n.t); tries++){
        const sameRow = rows[y].some((o, j) => j !== k && o.t === n.t);
        const parent = rows[y - 1].some(o => Math.abs(o.c - n.c) === 0.5 && o.t === n.t);
        if(!sameRow && !parent) break;
        n.t = latticeType(expFloorOf(mapIdx, y, maps), r);
      }
    });
  }
  rows.forEach(row => row.forEach(n => {
    if(n.t === "trainer") n.tr = Math.floor(r() * TRAINERS.length);
    if(n.t === "elite") n.el = r() < 0.5 ? "cool_trainer_m" : "cool_trainer_f";
  }));
  for(let y = 0; y < last; y++){
    const nx = rows[y + 1];
    for(const n of rows[y])
      n.next = nx.map((m, j) => Math.abs(m.c - n.c) === 0.5 || nx.length === 1 ? j : -1).filter(j => j >= 0);
  }
  return rows;
}
/* le type d'un noeud, selon le palier de difficulte (et sans repos ni noyau ici) */
/* les poids du treillis : beaucoup de combats (c'est la que l'on gagne des niveaux),
   des services pour respirer ; les Elites arrivent avec la deuxieme carte */
const LATTICE_W = [
  {fight:32, trainer:22, draft:16, treasure:10, event:10, shop:6, swap:4},
  {fight:24, trainer:26, elite:8,  draft:12, treasure:10, event:10, shop:6, swap:4},
  {fight:20, trainer:26, elite:12, draft:8,  treasure:10, event:12, shop:6, swap:6}
];
function latticeType(floor, r, avoid){
  const w = LATTICE_W[floor < 4 ? 0 : floor < 8 ? 1 : 2];
  const mods = expMods();
  const ent = Object.entries(w).filter(([k]) => k !== avoid);
  const tot = ent.reduce((a2, [k, v]) => a2 + v * (mods[k] !== undefined ? mods[k] : 1), 0);
  let x = r() * tot;
  for(const [k, v] of ent){
    x -= v * (mods[k] !== undefined ? mods[k] : 1);
    if(x <= 0) return k;
  }
  return "fight";
}
/* le champion d'un secteur : tire a l'ouverture de la carte, revele a l'arrivee */
function pickLeader(run){
  const used = new Set((run.badges || []).map(b => b.k));
  const pool = LEADERS.filter(l => !used.has(l[0]));
  const L = pick(pool.length ? pool : LEADERS);
  return {k:L[0], pic:L[1], t:L[2], n:L[3]};
}
/* les decors : la nature d'abord, la faille au bout */
const EXP_BIOMES = ["prairie", "foret", "grotte", "plage", "neige", "volcan"];
function biomeFor(run, mapIdx){
  if(mapIdx >= (run.maps || 1) - 1 && run.maps > 1) return "faille";
  if(mapIdx === 0) return pick(["prairie", "foret"]);
  return pick(EXP_BIOMES.filter(b => b !== run.biome));
}
function openSector(run, mapIdx){
  run.mapIdx = mapIdx;
  run.map = genMap(run.seed + mapIdx * 7919, {mapIdx, maps:run.maps});
  run.biome = biomeFor(run, mapIdx);
  run.leader = mapIdx < run.maps - 1 ? pickLeader(run) : null;
  run.row = -1; run.col = -1;
  run.avail = run.map[0].map((_, i) => i);
  if(typeof sanctPlace === "function") sanctPlace(run, mapIdx);
}

function nodeTypeFor(y, r){
  if(y === EXP_ROWS - 1) return "boss";
  if(y === 0) return "fight";
  if(y === EXP_ROWS - 2) return "rest";      /* repos garanti avant le noyau */
  const w = NODE_W[Math.min(y, NODE_W.length - 1)] || NODE_W[NODE_W.length - 1];
  const mods = expMods();
  const tot = Object.entries(w).reduce((a2, [k, v]) => a2 + v * (mods[k] !== undefined ? mods[k] : 1), 0);
  let x = r() * tot;
  for(const [k, v] of Object.entries(w)){
    x -= v * (mods[k] !== undefined ? mods[k] : 1);
    if(x <= 0) return k;
  }
  return "fight";
}
/* le mode de parcours modifie les poids : en Nuzlocke, on ne recrute plus */
function expMods(){
  const m = (S.expedition && S.expedition.mode) || S.expMode || "classic";
  if(m === "nuzlocke") return {draft:0, swap:0, rest:0.6};
  return {};
}


/* ---------- lancement ---------- */
/* ============================================================
   LA PROGRESSION — à la manière de Pokélike
   On part bas, de la forme de base : le niveau se gagne en route.
   Hautes herbes +1, dresseur +2, élite +2, champion +3, tout le
   reste +0. Un échange rend un Pokémon quatre niveaux au-dessus.
   Choisir sa route, c'est donc choisir entre se renforcer (plus
   de combats, plus d'usure) et se préparer (soins, objets).
   ============================================================ */
const EXP_START_LV = 5;
const EXP_GAIN = {fight:1, trainer:2, elite:2, champ:3, boss:0, legend:2};
function expStartLevel(id){
  /* l'archive donne un leger elan, jamais une avance decisive */
  return EXP_START_LV + Math.min(3, Math.floor(((S.dex[id] && S.dex[id].lvl) || 0) / 15));
}
/* le niveau attendu de l'equipe a un pas donne du parcours : les adversaires s'y calent */
function expExpected(step){
  return EXP_START_LV + 0.8 * step + EXP_GAIN.champ * Math.floor(step / MAP_ROWS);
}
function runShiny(m){ const d = S.dex[m.base || m.id]; return !!(d && d.shiny); }
function teamAvgLevel(run){
  const live = run.team.filter(m=>m.hp > 0), L = live.length ? live : run.team;
  return Math.round(L.reduce((a, m)=>a + m.level, 0) / Math.max(1, L.length));
}
/* monter de niveau, et evoluer quand le niveau est atteint */
function expGainLevels(run, n){
  const ups = [], evos = [];
  if(!n) return {ups, evos};
  run.team.forEach((m, i)=>{
    if(m.hp <= 0) return;
    const from = m.level;
    m.level = Math.min(100, m.level + n);
    const ratio = m.maxHp ? m.hp / m.maxHp : 1;
    const e = (POKE[m.id].evo || []).find(e=>!e.stone && e.lvl && e.lvl <= m.level && POKE[e.to]);
    if(e){ evos.push({i, from:m.id, to:e.to}); m.id = e.to; }
    const f = makeFighter(m.id, m.level, {shiny: runShiny(m)});
    applyRelics(run, f);
    m.maxHp = f.maxHp;
    m.hp = Math.max(1, Math.round(m.maxHp * ratio));
    ups.push({i, from, to:m.level});
  });
  return {ups, evos};
}
function startExpedition(ids){
  const seed = Math.floor(rng()*1e9);
  const run = {
    seed, map: null, maps: EXP_MAPS, mapIdx: 0, badges: [], row: -1, col: -1, avail: null,
    level: EXP_START_LV, step: 0, relics: [], bits: 60, corruption: 0,
    heals: 1 + (heldActive("exp") ? 1 : 0), usedHeal: false,
    revives: 1,          /* une seule remise en ligne par parcours : un choix, pas un filet */
    mode: S.expMode || "classic", lost: 0, itemDraft: null, draft: null,
    team: [], floor: 0, log: [], ended:false
  };
  /* chacun repart de sa forme de base, et refera son evolution en chemin */
  run.team = ids.map(id=>{
    const m = newRunMon(run, lineRoot(id), expStartLevel(id));
    m.base = id;
    return m;
  });
  if(heldActive("relic")) grantRelic(run);
  openSector(run, 0);
  S.expedition = run;
  S.stats.expRuns++;
  save();
  go("expedition");
}
let pendingBooster = null;
let pendingEgg = null;
function endExpedition(win){
  const run = S.expedition;
  if(!run || run.ended) return;
  run.ended = true;

  /* niveaux permanents : on garde l'avant et l'apres pour pouvoir les montrer */
  const bonusLv = 1 + relicVal(run, "xp") + (win ? 1 : 0);
  const gains = [];
  for(const m of run.team){
    const aid = m.base || m.id;             /* l'espece de l'archive, meme si elle a evolue en route */
    if(!S.dex[aid]) continue;               /* une recrue sauvage n'entre pas a l'archive */
    const before = S.dex[aid].lvl;
    const add = m.hp > 0 ? bonusLv : 0;
    S.dex[aid].lvl = Math.min(100, before + add);
    gains.push({id:aid, before, after:S.dex[aid].lvl, alive:m.hp > 0});
  }

  const mult = (win ? 1 : 0.35) * (win ? consumeFirstWin("expedition") : 1);
  const shards = Math.round((60 + run.floor*12 + run.corruption*18) * mult);
  const coins  = Math.round((500 + run.floor*140) * mult);
  const xp     = Math.round((260 + run.floor*55) * mult);
  gain("shards", shards); gain("coins", coins); addXp(xp);

  /* butin exclusif : les oeufs ne s'obtiennent quasiment que par ici */
  const loot = [];
  if(win){
    S.stats.expWins++; S.daily.dayExp++; questTick("dayExp",1);
    if(typeof fragOn === "function") setTimeout(()=>fragOn("expedition", "Dans un campement abandonné, au bout de l'Expédition"), 1800);
    if(!run.usedHeal) S.flags.expNoHeal = true;
    addIntegrity(0.5);
    gain("cores", 1);
    const tier = run.corruption >= 4 ? "e_origin" : run.corruption >= 2 ? "e_epic"
               : run.floor >= 11 ? "e_rare" : "e_common";
    grantEgg(tier);
    pendingEgg = tier;
    /* le noyau emet une carte : la corruption prise en chemin ameliore la serie */
    const cw = randomCard(1 + run.corruption * 0.55);
    if(typeof cardRevealExpect === "function") cardRevealExpect();
    if(typeof cardHowSet === "function") cardHowSet("exp", {c:run.corruption || 0, f:run.floor || 0});
    const cwNew = grantCardV(cw.s, cw.id);
    pendingBooster = [{s:cw.s, id:cw.id, fresh:cwNew}];
    if(rng() < 0.5){
      const h = randomHeld();
      if(h && grantHeld(h))
        loot.push({icon:"star", label:HELD_ITEMS[h].n, sub:"objet tenu", color:"var(--violet)", big:true});
    }
  }
  hallRecord(run, win);
  if(win) factionPts(20);
  S.expedition = null;
  save();

  const relicList = run.relics.map(id=>RELICS.find(x=>x.id===id)).filter(Boolean);
  /* ce que le camp retiendra : affiché en tête de l'Expédition au retour */
  S.expLast = {win, t:Date.now(), sec:(run.mapIdx || 0) + 1, maps:run.maps || 3,
    gains:gains.map(g=>({id:g.id, add:g.after - g.before, alive:g.alive})), egg:win ? pendingEgg : null};
  save();
  EXP_END = {run, win, gains, shards, coins, xp, loot, relicList};
  /* parti en plein combat (menu du bas) : la fin attend qu'on revienne à l'Expédition.
     Les succès et les fenêtres du guide passent après le butin, pas par-dessus la fin. */
  const shown = expHere() && expEndScene(EXP_END);
  if(!shown){ checkAchievements(); guideTick(); }
}
/* la fin d'une expédition : une scène plein écran, comme le reste du parcours. Elle dit
   clairement que c'est fini, ce qui a été gagné, ce qui reste ; elle attend le joueur. */
let EXP_END = null;
function expHere(){ return typeof currentScreen === "undefined" || currentScreen === "expedition" || currentScreen === "battle"; }
function expEndScene(v){
  const run = v.run, win = v.win, c = win ? "#35f0d6" : "#ff3d7f";
  const ups = [];
  run.team.forEach((m, i)=>{ const g = v.gains.find(x=>x.id === (m.base || m.id)); if(g && g.after > g.before) ups.push({i, from:g.before, to:g.after}); });
  const fallenN = v.gains.filter(g=>!g.alive).map(g=>POKE[g.id].name);
  const add = ups.length ? ups[0].to - ups[0].from : 0;
  const lvTxt = ups.length ? `${ups.length} Pokémon gagne${ups.length > 1 ? "nt" : ""} ${add} niveau${add > 1 ? "x" : ""} pour de bon` : "Aucun niveau gagné cette fois";
  const loot = !!(pendingEgg || pendingBooster);
  const stage = `<div class="xs-sun"></div>
    <div class="xs-endhead" style="--xc:${c}"><small>${win ? "EXPÉDITION RÉUSSIE" : "EXPÉDITION TERMINÉE"}</small>
      <b>${win ? "Le noyau est atteint" : `Arrêtée au secteur ${(run.mapIdx || 0) + 1} sur ${run.maps || 3}`}</b></div>
    ${xsTeam(run, {walk:win, size:52, ups})}`;
  const panel = `<div class="xs-kicker" style="color:${c}">${win ? "FIN DU PARCOURS" : "RETOUR AU CAMP"}</div>
    <div class="xs-title">${win ? "Ton équipe rentre victorieuse" : "Ton équipe rentre plus tôt"}</div>
    <div class="xs-say">${esc(lvTxt)}.${win ? " Ces niveaux restent, inscrits dans ton archive." : " Les récompenses du parcours sont gardées, en plus petit."}${fallenN.length ? ` Désindexés en route, sans rien gagner : ${esc(fallenN.join(", "))}.` : ""}</div>
    <div class="xs-endtiles">
      <span><small>Fragments</small><b>+${v.shards}</b></span>
      <span><small>PokéCoins</small><b>+${fmt(v.coins)}</b></span>
      <span><small>Expérience</small><b>+${fmt(v.xp)}</b></span>
      <span><small>${win ? "Noyaux" : "Secteur"}</small><b>${win ? "+1" : `${(run.mapIdx || 0) + 1}/${run.maps || 3}`}</b></span>
    </div>
    ${v.loot.length ? `<div class="xs-say">Butin : ${v.loot.map(l=>esc(l.label) + (l.sub ? ` (${esc(l.sub)})` : "")).join(", ")}${v.relicList.length ? ` · ${v.relicList.length} relique${v.relicList.length > 1 ? "s" : ""} rendue${v.relicList.length > 1 ? "s" : ""} au système` : ""}.</div>` : ""}
    <button class="btn pri wide" data-act="expenddone">${loot ? "Ouvrir le butin" : "Retour au camp"}</button>`;
  if(typeof xsOpen === "function" && xsOpen("end", c, stage, panel)){
    try { (win ? Sfx.win : Sfx.lose)(); } catch(e){}
    return true;
  }
  return false;
}
ACTIONS.expenddone = () => { EXP_END = null; if(typeof xsClose === "function") xsClose(); expLootChain(); };
/* le butin se deroule un objet a la fois : oeuf, puis sachet, puis retour */
function expLootChain(){
  if(pendingEgg){
    const t = pendingEgg; pendingEgg = null;
    /* la toute première ébauche ouvre la Couveuse : on le dit ici, sans quitter l'Expédition */
    const first = !!(S.flags && S.flags.eggReveal);
    if(first){ S.flags.eggReveal = null; saveSoon(); }
    if(showEggFind(t, expLootChain, first)) return;
  }
  if(pendingBooster){
    const cards = pendingBooster; pendingBooster = null;
    if(typeof cardReveal === "function"){ if(cardReveal(cards, {kicker:"BUTIN DU NOYAU", onDone:expLootChain})) return; }
    else if(showBooster(cards, {title:"BUTIN DU NOYAU",
        sub:"Scellé au fond de la couche. Le système n'a jamais su ce qu'il contenait.",
        onDone:expLootChain})) return;
  }
  go("expedition");
  try { checkAchievements(); guideTick(); } catch(e){}
  checkStoryTriggers();
}
ACTIONS.expdone = () => { closeSheet(); expLootChain(); };

/* ---------- partir en pleine expédition ----------
   Le menu du bas reste accessible pendant le parcours : on demande d'abord, et on dit
   que rien n'est perdu. Un combat en cours se termine sans le joueur ; sa suite attend
   qu'il revienne. */
function expRunning(){ const r = typeof S !== "undefined" && S && S.expedition; return !!(r && !r.ended); }
function expFighting(){
  const r = S && S.expedition;
  return currentScreen === "battle" && !!(r && r.pend && r.pend.k === "enc") && typeof BATTLE !== "undefined" && !!BATTLE && !BATTLE.over;
}
function expLeaveNeedsAsk(to){
  return expRunning() && to && to !== "expedition" && (currentScreen === "expedition" || expFighting());
}
function expLeaveAsk(to){
  const fight = expFighting();
  sheet(`${sheetHead("Quitter l'Expédition ?")}
    <div class="tiny" style="line-height:1.65;margin-bottom:14px">${fight
      ? "Le combat se termine sans toi. Ton parcours t'attendra juste après, au même endroit."
      : "Ton parcours est mis en pause : rien n'est perdu."}
      Tu le reprendras depuis l'accueil, carte « L'Expédition ».${to === "bag" ? "<br><br>Les objets de l'Expédition sont dans son propre sac : bouton « Sac », sous la carte." : ""}</div>
    <div class="btn-grid c2">
      <button class="btn" data-act="expleave" data-to="${esc(to)}">Quitter pour l'instant</button>
      <button class="btn pri" data-act="closesheet">Continuer</button>
    </div>`, true);
}
const EXP_NAV = {nav:ACTIONS.nav, goto:ACTIONS.goto};
if(EXP_NAV.nav) ACTIONS.nav = (d, el, ev) => expLeaveNeedsAsk(d && d.to) ? expLeaveAsk(d.to) : EXP_NAV.nav(d, el, ev);
if(EXP_NAV.goto) ACTIONS.goto = (d, el, ev) => expLeaveNeedsAsk(d && d.to) ? expLeaveAsk(d.to) : EXP_NAV.goto(d, el, ev);
ACTIONS.expleave = d => {
  closeSheet();
  if(typeof toast === "function") toast("Expédition en pause : reprends-la depuis l'accueil", "", "map");
  (EXP_NAV.nav || EXP_NAV.goto)({to:d.to});
};

/* le retour au camp : ce que la dernière expédition a laissé (24 h) */
function expLastHtml(){
  const L = S.expLast;
  if(!L || Date.now() - L.t > 24 * 3600 * 1000) return "";
  const up = (L.gains || []).filter(g=>g.add > 0);
  const names = up.map(g=>POKE[g.id] ? POKE[g.id].name : "").filter(Boolean);
  const eggOk = L.egg && typeof moduleUnlocked === "function" && moduleUnlocked("eggs");
  return `<div class="panel xlast ${L.win ? "win" : "lose"}">
    <div class="row between"><b>${L.win ? "Dernière expédition : réussie" : "Dernière expédition : terminée plus tôt"}</b>
      <span class="tiny dim">il y a ${fmtTime(Date.now() - L.t)}</span></div>
    <div class="tiny muted" style="margin-top:4px">${L.win ? "Le noyau a été atteint." : `Arrêtée au secteur ${L.sec} sur ${L.maps}.`}
      ${names.length ? `${esc(names.join(", "))} : +${up[0].add} niveau${up[0].add > 1 ? "x" : ""} pour de bon.` : "Aucun niveau gagné."}</div>
    ${eggOk ? `<button class="btn sm" style="margin-top:8px" data-act="goto" data-to="eggs">${ic("box")} Voir l'œuf à la Couveuse</button>` : ""}
  </div>`;
}

/* ---------- ecran ---------- */
let EXP_PEEK = null;          /* le noeud que le joueur examine sur la carte */
SCREENS.expedition = {
  html(){
    const run = S.expedition;
    if(!run) return this.lobby();
    const floor = Math.max(0, run.row + 1);
    const down = fallen(run).length;
    const badges = (run.badges || []).map(b=>`<span class="xbadge" style="--bc:${arCol(b.t)}" title="${esc(b.n)}"></span>`).join("");
    const empty = run.maps ? Array(Math.max(0, run.maps - 1 - (run.badges || []).length)).fill('<span class="xbadge off"></span>').join("") : "";
    return `
      <div class="xhead">
        <div class="h" style="margin:0">${run.maps ? `SECTEUR ${(run.mapIdx || 0) + 1}/${run.maps}` : `ÉTAGE ${floor}/${EXP_ROWS}`} ${infoBtn("expedition")}
          ${run.maps ? `<span class="xbadges">${badges}${empty}</span>` : ""}</div>
        <div class="row" style="gap:5px">
          <span class="pill">${ic("coin")} ${run.bits}</span>
          <button class="pill" data-act="exprelics">${ic("shard2")} ${run.relics.length}</button>
          ${run.corruption ? `<span class="pill" style="border-color:var(--magenta);color:var(--magenta)">Corr. ${run.corruption}</span>` : ""}
        </div>
      </div>
      <div class="xmapwrap pkl">
        <div id="map-scroll"><div class="xmap" id="map-inner"><canvas class="xterr" id="xterr"></canvas><div id="xmapov">${this.mapHtml(run)}</div></div></div>
        <div class="xfade top"></div><div class="xfade bot"></div>
      </div>

      <div class="row between" style="margin:10px 0 4px">
        <div class="h sm" style="margin:0">ÉQUIPE</div>
        <span class="tiny ${down ? "bad" : "dim"}">${TEAM_SEL >= 0 ? "touchez un autre membre pour échanger" :
          `${run.team.length - down}/${run.team.length} en ligne${down ? ` · ${down} perdu(s)` : ""} · le 1er ouvre le combat`}</span>
      </div>
      <div class="team-strip">${run.team.map((m,i)=>{ const it = itemOf(m); return `
        <div class="tmem ${m.hp<=0?"ko":""} ${TEAM_SEL===i?"sel":""}" data-act="teamtap" data-i="${i}">
          <span class="tpos">${i+1}</span>
          <span class="lv">${m.level}</span>
          <span class="sprbox" style="width:40px;height:40px">${sprite(m.id, runShiny(m), "", {skin:true})}</span>
          <div class="nm">${esc(POKE[m.id].name)}</div>
          <div class="bar hp ${m.hp/m.maxHp>.5?"":m.hp/m.maxHp>.2?"mid":"low"}">
            <i style="width:${Math.max(0,m.hp/m.maxHp*100)}%"></i></div>
          ${it ? `<span class="titem">${itemIcon("exp:" + m.item, 14) || (it.card ? sprBox(it.spr, false, 14) : "")}</span>` : ""}
        </div>`; }).join("")}</div>

      <div class="btn-grid c4" style="margin-top:9px">
        <button class="btn sm" data-act="expheal" ${run.heals?"":"disabled"}>${ic("heart")} Soin ${run.heals}</button>
        <button class="btn sm ${(run.revives>0&&down)?"dan":""}" data-act="exprevive"
          ${(run.revives>0&&down)?"":"disabled"}>Réindexer ${run.revives||0}</button>
        <button class="btn sm" data-act="expgear">${ic("box")} Sac${typeof expBag === "function" && expBag(run).length ? ` · ${expBag(run).length}` : ""}</button>
        <button class="btn sm ghost" data-act="expabandon">Abandon</button>
      </div>`;
  },

  lobby(){
    const ok = moduleUnlocked("expedition");
    return `
      <div class="h">${ic("map")} EXPÉDITION ${infoBtn("expedition")}</div>
      <div class="sub">Une sonde profonde dans une couche non cartographiée.</div>
      ${expLastHtml()}
      ${moduleGoal("Trois cartes, trois Champions. Vos Pokémon repartent de leur <b>forme de base, au niveau 5</b>, et grandissent en route : ce sont vos choix de chemin qui font leur niveau.",
        "Des niveaux de combat permanents pour les survivants, des œufs, et des cartes de collection.")}

      <div class="h sm">COMMENT DESCENDRE</div>
      <div class="modegrid c3">
        ${Object.entries(EXP_MODES).map(([k,md])=>`
          <div class="modecard ${(!md.go && expMode()===k)?"on":""} ${md.go?"dest":""}"
            data-act="expsetmode" data-m="${k}" style="--mc:${md.c}">
            <div class="mc-n">${esc(md.n)}</div>
            <div class="mc-d">${esc(md.d)}</div>
            ${md.mult>1?`<div class="mc-x">récompenses ×${md.mult}</div>`:""}
            ${md.go?`<div class="mc-x" style="color:var(--violet)">record : étage ${(S.tower&&S.tower.best)||0}</div>`:""}
          </div>`).join("")}
      </div>

      <div class="panel bracket">
        <div class="map-flow"><span>DÉPART (haut)</span><i></i><span class="bad">CHAMPION (bas)</span></div>
        <div class="tiny">Chaque carte a le même dessin : sept rangées de nœuds puis un Champion, dont le
          type reste secret. Son badge ouvre la carte suivante ; au bout de la troisième attend le Noyau.
          Touchez un nœud lointain pour voir ce qu'il cache et la route qui y mène.</div>
      </div>

      <div class="panel">
        <div class="h sm">LA PROGRESSION</div>
        <div class="tiny">· <b>Hautes herbes : +1 niveau</b> à toute l'équipe. <b>Dresseur ou Élite : +2</b>.
          <b>Champion : +3</b>. Tout le reste (objets, recrues, événements, boutique) : +0.</div>
        <div class="tiny">· Vos Pokémon <b>évoluent en route</b>, au niveau de leur évolution.</div>
        <div class="tiny">· Un <b>échange</b> rend un Pokémon <b>quatre niveaux</b> au-dessus de celui que vous cédez.
          Une recrue arrive au niveau de l'équipe.</div>
        <div class="tiny">· Les adversaires montent avec la carte, pas avec vous : éviter les combats, c'est prendre du retard.</div>
      </div>

      <div class="panel">
        <div class="h sm">CE QU'IL FAUT SAVOIR</div>
        <div class="tiny">· Les <b>PV ne remontent qu'en partie</b> après un combat. Le Centre Pokémon, juste avant
          le Champion, remet tout à neuf — mais il coûte la case d'à côté.</div>
        <div class="tiny">· Les <b>Élites</b> garantissent une relique. Les reliques s'appliquent à
          toute l'équipe pour le reste du run.</div>
        <div class="tiny">· Les <b>Bits</b> ne servent qu'à l'intérieur du parcours et sont perdus à la fin.</div>
        <div class="tiny">· La <b>corruption</b> améliore le butin et renforce les ennemis. Elle ne redescend pas.</div>
        <div class="tiny">· Des entités sauvages peuvent rejoindre l'équipe en route (6 maximum).</div>
      </div>

      <div class="panel edge">
        <div class="h sm">POURQUOI Y ALLER</div>
        <div class="tiny">Les Pokémon qui <b>survivent</b> gagnent des <b class="cy">niveaux permanents</b>.
          L'archive retient l'espèce que vous avez choisie, même si elle a évolué en route.</div>
      </div>

      <div class="tiles" style="margin-bottom:10px">
        <div class="tile accent"><div class="k">Terminées</div><div class="v">${S.stats.expWins}</div></div>
        <div class="tile"><div class="k">Tentatives</div><div class="v">${S.stats.expRuns}</div></div>
      </div>

      <button class="btn pri wide" data-act="expstart" ${ok?"":"disabled"}>Composer l'équipe et partir</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  },

  /* ============================================================
     LA CARTE
     Chaque noeud est place a son couloir. Les routes encore
     possibles depuis la position actuelle sont eclairees, les
     autres s'estompent : on voit son trajet a l'avance. Toucher
     un noeud lointain l'examine et trace le chemin qui y mene.
     ============================================================ */
  mapHtml(run){
    const G = xmapGeom(run), X = G.X, Y = G.Y, H = G.H, last = run.map.length - 1;
    const K = (y, i) => y + ":" + i;
    /* ce qui reste atteignable */
    const startRow = run.row + 1;
    const reach = new Set();
    let front = (run.avail || []).map(i=>[startRow, i]);
    const availSet = new Set(front.map(([y, i])=>K(y, i)));
    while(front.length){
      const nx = [];
      for(const [y, i] of front){
        if(reach.has(K(y, i)) || !run.map[y] || !run.map[y][i]) continue;
        reach.add(K(y, i));
        if(y < last) for(const j of run.map[y][i].next) nx.push([y + 1, j]);
      }
      front = nx;
    }
    /* le chemin vers le noeud examine */
    let path = null;
    const pk = EXP_PEEK && run.map[EXP_PEEK.y] && run.map[EXP_PEEK.y][EXP_PEEK.i] ? EXP_PEEK : null;
    if(pk && reach.has(K(pk.y, pk.i))){
      path = new Set([K(pk.y, pk.i)]);
      for(let y = pk.y - 1; y >= startRow; y--)
        run.map[y].forEach((n, i)=>{ if(reach.has(K(y, i)) && n.next.some(j=>path.has(K(y + 1, j)))) path.add(K(y, i)); });
    }
    const cur = run.row >= 0 ? K(run.row, run.col) : null;
    const DOOR = XMAP.TOP - 58;

    let links = "";
    const seg = (x1, y1, x2, y2, cls) => { links += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="xl ${cls}"/>`; };
    for(let y = 0; y < last; y++){
      run.map[y].forEach((n, i)=>{
        for(const j of n.next){
          const a = K(y, i), b = K(y + 1, j), m = run.map[y + 1][j];
          let cls = "far";
          if(n.done && m.done) cls = "past";
          else if(a === cur && availSet.has(b)) cls = "live";
          else if(reach.has(a) && reach.has(b)) cls = "reach";
          if(path && (path.has(a) || a === cur) && path.has(b)) cls += " peek";
          seg(X(n.c), Y(y), X(m.c), Y(y + 1), cls);
        }
      });
    }
    /* depuis la porte : un sentier vers chaque premier noeud */
    for(const [i, n] of run.map[0].entries()){
      const b = K(0, i), cls = run.row < 0 ? ("live" + (path && path.has(b) ? " peek" : "")) : n.done ? "past" : "far";
      seg(50, DOOR, X(n.c), Y(0), cls);
    }

    let nodes = "";
    for(let y = 0; y <= last; y++){
      run.map[y].forEach((n, i)=>{
        const k = K(y, i), t = NODE_TYPES[n.t] || NODE_TYPES.fight;
        const isCur = k === cur, isAvail = availSet.has(k);
        const st = isCur ? "cur" : n.done ? "done" : isAvail ? "avail" : reach.has(k) ? "reach" : "far";
        const tt = n.t === "trainer" && n.tr !== undefined && TRAINERS[n.tr] ? TRAINERS[n.tr].t : null;
        nodes += `<div class="pn n-${n.t} ${st} ${pk && pk.y === y && pk.i === i ? "peeked" : ""} ${path && path.has(k) ? "onpath" : ""}"
          data-y="${y}" data-i="${i}" data-act="${isAvail ? "expnode" : "exppeek"}"
          style="left:${X(n.c)}%;top:${Y(y)}px;--nc:${tt ? arCol(tt) : t.c}">
          <span class="pn-sh"></span><span class="pn-art">${xnodeArt(run, n)}</span>
          ${tt ? `<span class="pn-tag">${TYPE_NAMES[tt]}</span>` : n.t === "elite" ? `<span class="pn-tag el">ÉLITE</span>` : ""}
          ${n.done && !isCur ? `<span class="xtick">${ic("check")}</span>` : ""}
        </div>`;
      });
    }
    /* le meneur de l'equipe, la ou elle se tient */
    const lead = run.team.find(m=>m.hp > 0) || run.team[0];
    const lx = cur ? X(run.map[run.row][run.col].c) : 50, ly = cur ? Y(run.row) - 30 : DOOR + 10;
    const leader = lead ? `<div class="xleader" id="xleader" style="left:${lx}%;top:${ly}px">${pmdCanvas(lead.id, 0, 46, {shiny:S.dex[lead.id] && S.dex[lead.id].shiny, mine:true})}</div>` : "";

    let peek = "";
    if(pk){
      const n = run.map[pk.y][pk.i], info = expNodeInfo(n, run), steps = pk.y - run.row;
      const ok = reach.has(K(pk.y, pk.i));
      peek = `<div class="xpeek ${X(n.c) > 60 ? "left" : X(n.c) < 40 ? "right" : ""} ${pk.y >= last - 1 ? "up" : ""}" style="left:${X(n.c)}%;top:${Y(pk.y) + (pk.y >= last - 1 ? -150 : 26)}px;--nc:${info.c}">
        <div class="xp-k">${info.k}</div><div class="xp-t">${info.t}</div><div class="xp-d">${info.d}</div>
        <div class="xp-s ${ok ? "" : "bad"}">${n.done ? "Déjà visité" : ok ? `À ${steps} pas · route tracée` : "Hors de votre route"}</div>
      </div>`;
    }
    return `<div class="xdoor" style="top:${DOOR - 13}px">${run.row < 0 ? "" : ic("check")}</div>
      <svg class="xlinks" viewBox="0 0 100 ${H}" preserveAspectRatio="none" style="height:${H}px">${links}</svg>
      ${nodes}${leader}${peek}<div style="height:${H}px"></div>`;
  },

  after(){
    const run = S.expedition;
    /* une fin d'expédition qui s'est jouée pendant qu'on était ailleurs */
    if(!run && EXP_END){ const v = EXP_END; setTimeout(()=>{ if(EXP_END === v && currentScreen === "expedition") expEndScene(v); }, 80); }
    const sc = document.getElementById("map-scroll");
    if(sc && run){
      xmapPaint(document.getElementById("xterr"), run);
      const y = run.row < 0 ? 0 : xmapGeom(run).Y(run.row);
      sc.scrollTop = Math.max(0, y - sc.clientHeight * 0.32);
    }
    pmdWake();
    if(run){
      expUnstick(run);
      /* une scene en attente (recrutement, coffre, combat...) reprend la ou elle etait */
      if(run.pend && !xsOpenNow()) setTimeout(()=>{ if(S.expedition === run && currentScreen === "expedition" && !xsOpenNow()) expResume(run); }, 60);
      else tutoMaybe("expedition");
    }
  }
};
/* Une partie restée sans issue (l'ancienne réindexation automatique comptait une défaite comme un
   passage : un champion perdu au bout du secteur laissait la carte sans nœud accessible). Le combat
   qui n'a pas été gagné se rejoue. */
function expUnstick(run){
  if(!run || run.pend || !run.map || run.row < 0 || run.row < run.map.length - 1) return false;
  if(run.avail && run.avail.length) return false;
  const n = run.map[run.row] && run.map[run.row][run.col];
  if(!n || n.t === "boss") return false;
  const kind = n.t === "champ" ? "champ" : "fight";
  run.pend = {k:"enc", kind, foes:enemySpecFor(run, kind)};
  save();
  return true;
}
/* ce qu'un noeud promet, dit simplement */
function expNodeInfo(n, run){
  const t = NODE_TYPES[n.t] || NODE_TYPES.fight;
  if(n.t === "champ") return {k:"CHAMPION", t:"Le Champion du secteur", d:"Son type reste secret jusqu'au combat. Trois Pokémon. Le vaincre donne un badge, trois niveaux à l'équipe et une relique à choisir.", c:"var(--amber)"};
  if(n.t === "trainer"){
    const tr = n.tr !== undefined && TRAINERS[n.tr] ? TRAINERS[n.tr] : null;
    if(tr) return {k:"DRESSEUR", t:`${esc(tr.n)} <span class="tt t${tr.t}">${TYPE_NAMES[tr.t]}</span>`,
                   d:`Deux Pokémon de type ${TYPE_NAMES[tr.t]}. Préparez ce qui leur résiste.`, c:arCol(tr.t)};
  }
  const D = {
    fight:["RENCONTRE", "Pokémon sauvages", "Un ou deux adversaires de l'étage. Bits et 25% de soin après la victoire."],
    trainer:["DRESSEUR", "Dresseur", "Deux Pokémon d'un même type."],
    elite:["ÉLITE", "Signature élite", "Deux adversaires solides. Une relique garantie, parfois un objet tenu."],
    draft:["RECRUTEMENT", "Trois Poké Balls", "Trois candidats, un seul rejoint l'équipe."],
    swap:["ÉCHANGE", "Terminal d'échange", "Céder un membre contre un Pokémon trois niveaux au-dessus."],
    event:["ÉVÉNEMENT", "Inconnu", "Porygon-Z raconte. Un choix, une conséquence."],
    shop:["BOUTIQUE", "Kecleon", "Soins, reliques et PV contre des Bits."],
    rest:["REPOS", "Feu de camp", "Se soigner, ou fouiller les cendres pour une relique."],
    treasure:["TRÉSOR", "Coffre scellé", "Trois objets tenus, un seul emporté."],
    boss:["NOYAU", "Gardien de la couche", "Le dernier combat. Plusieurs signatures liées."],
    fight:["HAUTES HERBES", "Pokémon sauvages", "Un ou deux adversaires de l'étage. Bits et 25% de soin après la victoire."],
    rest:["CENTRE POKÉMON", "Se soigner", "Se reposer, ou fouiller pour une relique."],
    shop:["BOUTIQUE", "Kecleon", "Soins, reliques et PV contre des Bits."],
    treasure:["SAC", "Objet tenu", "Trois objets, un seul emporté."]
  }[n.t] || [t.n.toUpperCase(), t.n, ""];
  return {k:D[0], t:D[1], d:D[2], c:t.c};
}
ACTIONS.exppeek = d => {
  const y = +d.y, i = +d.i;
  EXP_PEEK = EXP_PEEK && EXP_PEEK.y === y && EXP_PEEK.i === i ? null : {y, i};
  const run = S.expedition, inner = document.getElementById("xmapov"), sc = document.getElementById("map-scroll");
  if(!run || !inner){ refresh(); return; }
  const top = sc ? sc.scrollTop : 0;
  inner.innerHTML = SCREENS.expedition.mapHtml(run);
  if(sc) sc.scrollTop = top;
  pmdWake();
};
ACTIONS.expstart = () => {
  if(!moduleUnlocked("expedition")) return;
  teamPicker("Équipe de départ (3) — forme de base, niveau 5", 3, ids=>{
    ids = ids.filter(id=>!POKE[id].leg);
    if(!ids.length){ toast("Les légendaires ne partent pas en Expédition", "bad", "cross"); return; }
    startExpedition(ids);
  });
};
ACTIONS.expabandon = () => {
  sheet(`${sheetHead("Abandonner l'expédition ?")}
    <div class="tiny muted">Vous conservez une partie réduite des récompenses. La carte est perdue.</div>
    <div class="btn-grid c2" style="margin-top:9px">
      <button class="btn ghost" data-act="closesheet">Continuer</button>
      <button class="btn dan" data-act="expabandon2">Abandonner</button></div>`, true);
};
ACTIONS.expabandon2 = () => { closeSheet(); endExpedition(false); };
ACTIONS.expheal = () => {
  const run = S.expedition;
  if(!run || !run.heals) return;
  run.heals--; run.usedHeal = true; healTeam(run, .45);
  toast("Équipe restaurée de 45%", "", "heart"); save(); refresh();
};
/* l'ordre decide qui entre en jeu : il doit etre modifiable en cours de route */
/* le parcours en cours : l'Expedition, ou l'ascension de la Tour (elles partagent ces outils) */
function teamRun(){
  return S.expedition || null;
}
/* toucher deux membres de l'equipe les echange : le premier valide entre en jeu */
let TEAM_SEL = -1;
ACTIONS.teamtap = d => {
  const run = teamRun(), i = +d.i;
  if(!run || !run.team[i]) return;
  if(TEAM_SEL < 0 || TEAM_SEL >= run.team.length){ TEAM_SEL = i; refresh(); return; }
  if(TEAM_SEL !== i){
    [run.team[TEAM_SEL], run.team[i]] = [run.team[i], run.team[TEAM_SEL]];
    toast(`${POKE[run.team[0].id].name} ouvrira le prochain combat`, "", "refresh");
    saveSoon();
  }
  TEAM_SEL = -1; refresh();
};
function drawExpOrder(){
  const run = teamRun();
  if(!run){ closeSheet(); return; }
  sheet(`${sheetHead("Ordre de l'équipe")}
    <div class="tiny muted" style="margin-bottom:9px">Le premier valide entre en jeu ; les suivants
      prennent le relais quand il tombe. Glisse une ligne par sa poignée ⋮⋮ pour changer l'ordre.</div>
    <div class="tp-sel">
      ${run.team.map((m,i)=>{
        const ko = m.hp <= 0, pct = Math.max(0, m.hp/m.maxHp*100);
        return `<div class="tp-row ${ko?"ghost":""}" data-row="${i}">
          <span class="tp-grip" data-grip="1" aria-label="Déplacer">⋮⋮</span>
          <span class="tp-pos">${i+1}</span>
          <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, runShiny(m), "", {skin:true})}</span>
          <div class="grow">
            <div class="tiny">${esc(POKE[m.id].name)} <span class="dim">N.${m.level}</span></div>
            <div class="bar hp ${pct>50?"":pct>20?"mid":"low"}" style="margin-top:4px">
              <i style="width:${pct}%"></i></div>
            <div class="tiny dim mono-num">${ko?"hors ligne":`${m.hp} / ${m.maxHp}`}</div>
          </div>
        </div>`;}).join("")}
    </div>
    <button class="btn pri wide" style="margin-top:10px" data-act="closeandrefresh">Fermer</button>`);
  if(typeof sortableList === "function") sortableList(document.querySelector("#sheet-root .tp-sel"), (from, to)=>{
    const r = teamRun(); if(!r) return;
    const m = r.team.splice(from, 1)[0]; r.team.splice(to, 0, m);
    saveSoon(); drawExpOrder();
  });
}
/* la seule facon de relever un membre tombe : une fois, et il faut choisir qui */
ACTIONS.exprevive = () => {
  const run = S.expedition;
  const down = fallen(run);
  if(!run.revives || !down.length) return;
  sheet(`${sheetHead("Réindexer un membre")}
    <div class="tiny muted" style="margin-bottom:9px">Une seule réindexation par parcours.
      Le membre revient à la moitié de ses points de vie. Ce choix est définitif.</div>
    <div class="tp-sel">
      ${down.map(m=>{
        const i = run.team.indexOf(m);
        return `<div class="tp-row">
          <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, runShiny(m), "ghosted", {skin:true})}</span>
          <div class="grow"><div class="tiny">${esc(POKE[m.id].name)}
            <span class="dim">N.${m.level}</span></div>
            <div class="tiny bad">désindexé</div></div>
          <button class="btn xs pri" data-act="exprevivedo" data-i="${i}">Réindexer</button>
        </div>`;}).join("")}
    </div>
    <button class="btn ghost wide" style="margin-top:10px" data-act="closeandrefresh">Annuler</button>`);
};
ACTIONS.exprevivedo = d => {
  const run = S.expedition, m = run.team[+d.i];
  if(!m || m.hp > 0 || !run.revives) return;
  run.revives--;
  m.hp = Math.floor(m.maxHp * 0.5);
  Sfx.win(); buzz([20,40,60]);
  toast(POKE[m.id].name + " revient en ligne", "", "heart");
  save(); closeSheet(); go("expedition");
};
ACTIONS.exporder = () => drawExpOrder();
ACTIONS.expmove = d => {
  const run = teamRun(), i = +d.i, j = i + (+d.d);
  if(!run) return;
  if(j < 0 || j >= run.team.length) return;
  [run.team[i], run.team[j]] = [run.team[j], run.team[i]];
  saveSoon();
  drawExpOrder();
};
ACTIONS.exprelics = () => {
  const run = S.expedition;
  sheet(`${sheetHead("Reliques du run")}
    ${run.relics.length ? `<div class="list">${run.relics.map(id=>{
      const r = RELICS.find(x=>x.id===id);
      return `<div class="item"><div class="ic">${ic("shard2")}</div>
        <div class="grow"><div class="t">${esc(r.n)}</div><div class="d">${esc(r.d)}</div></div></div>`;
    }).join("")}</div>` : `<div class="tiny muted">Aucune relique pour l'instant.</div>`}`);
};

/* ---------- entree dans un noeud ---------- */
ACTIONS.expnode = d => {
  const run = S.expedition;
  if(!run || EXP_TRAVEL || run.pend) return;
  const y = +d.y, i = +d.i;
  if(!(run.row === y-1 || (run.row === -1 && y === 0))) return;
  if(!(run.avail||[]).includes(i)) return;
  EXP_PEEK = null;
  run.row = y; run.col = i; run.floor = run.maps ? expFloorOf(run.mapIdx, y, run.maps) : y;
  run.step = (run.mapIdx || 0) * MAP_ROWS + y;
  const node = run.map[y][i];
  node.done = true;
  run.avail = y < run.map.length - 1 ? node.next : [];
  save();
  /* l'equipe marche jusqu'au noeud, puis la scene s'ouvre */
  expTravel(y, i, ()=>{ if(S.expedition === run) enterNode(run, node); });
};

/* ============================================================
   RECRUTEMENT PAR TIRAGE
   Un seul candidat, c'est une recompense ; trois candidats, c'est
   une decision. Toute la tension du genre est la.
   ============================================================ */
function draftPool(run, n, lvBonus){
  const out = [], seen = new Set();
  let guard = 0;
  while(out.length < n && guard++ < 60){
    const id = run.maps ? levelWildId(teamAvgLevel(run) + (lvBonus || 0) + 2) : wildIdFor(run.floor);
    if(seen.has(id)) continue;
    seen.add(id);
    /* une recrue arrive au niveau de l'equipe : elle doit pouvoir servir tout de suite */
    out.push({id, lvl: run.maps ? clamp(teamAvgLevel(run) + (lvBonus || 0), 2, 100) : expEnemyLevel(run, (lvBonus||0) + 1)});
  }
  return out;
}
function draftCard(c, action, extra){
  const p = POKE[c.id];
  return `<div class="draftcard" data-act="${action}" data-id="${c.id}" data-lvl="${c.lvl}">
    <span class="sprbox" style="width:62px;height:62px">${sprite(c.id, false, "")}</span>
    <div class="dc-n">${esc(p.name)}</div>
    <div class="wrap" style="justify-content:center;gap:2px">${typeTags(p.types)}</div>
    <div class="dc-s"><b>N.${c.lvl}</b> · total ${p.bst}</div>
    ${extra || ""}
  </div>`;
}
/* Difficulte de l'expedition.
   Les points de vie ne se regenerent pas : la menace est l'usure, pas la
   puissance brute d'un combat isole. Les adversaires restent donc proches
   du niveau de l'equipe, et c'est leur accumulation qui fait le defi. */
/* Noms des dresseurs adverses : chacun est specialise dans un type,
   ce qui rend le noeud lisible avant d'y entrer — on sait contre quoi
   on va se battre, donc on peut s'y preparer. */
const TRAINERS = [
  {n:"Veilleur de strate",  t:7},  {n:"Sonde de surface",    t:11},
  {n:"Ferronnier",          t:9},  {n:"Compilateur",         t:13},
  {n:"Jardinier d'index",   t:12}, {n:"Fondeur",             t:10},
  {n:"Cartographe",         t:5},  {n:"Lecteur de mémoire",  t:14},
  {n:"Gardien de cache",    t:6},  {n:"Purgeur",             t:4},
  {n:"Analyste",            t:1},  {n:"Correcteur",          t:2},
  {n:"Veille de nuit",      t:17}, {n:"Trieur de flux",      t:3},
  {n:"Cryogéniste",         t:15}, {n:"Scribe spectral",     t:8},
  {n:"Copiste draconique",  t:16}, {n:"Relecteur",           t:18}
];
function trainerFor(run){
  if(!run.trainer){
    const n = run.map && run.map[run.row] && run.map[run.row][run.col];
    run.trainer = n && n.tr !== undefined && TRAINERS[n.tr] ? TRAINERS[n.tr] : pick(TRAINERS);
  }
  return run.trainer;
}
/* le visage d'un dresseur : une classe par type, comme dans les jeux */
function trainerClassOf(n){
  if(n.t === "elite") return n.el || "cool_trainer_m";
  const tr = n.tr !== undefined ? TRAINERS[n.tr] : null;
  return tr ? (TRAINER_TYPE_CLASS[tr.t] || "youngster") : "youngster";
}
function trainerArt(cls, size, extra){
  const i = Math.max(0, TRAINER_CLASSES.indexOf(cls));
  return `<span class="trn ${extra || ""}" style="width:${size}px;height:${size}px;background-position:${-i * size}px 0;background-size:${TRAINER_CLASSES.length * size}px ${size}px"></span>`;
}

/* Le niveau adverse suit l'ETAGE, pas l'equipe. Sinon monter ses Pokemon
   ne sert a rien : les ennemis montaient avec eux et le taux de reussite
   restait plat quel que soit l'investissement. */
function expEnemyLevel(run, lvBonus){
  /* parcours a secteurs : les adversaires suivent la progression attendue, pas l'equipe reelle */
  if(run.maps) return clamp(Math.round(expExpected(run.step || 0) - 1 + (lvBonus||0)), 2, 100);
  return clamp(10 + Math.round(run.floor * 4.1) + (lvBonus||0), 3, 100);
}
function enemySpecFor(run, kind){
  const n = kind === "champ" ? 3 : kind === "boss" ? 2 : (kind === "elite" || kind === "trainer") ? 2 : (run.floor > 8 ? 2 : 1);
  const lvBonus = run.maps ? ({fight:-2, trainer:-1, elite:1, champ:0, boss:1}[kind] || 0)
                : kind === "boss" || kind === "champ" ? 2 : kind === "elite" ? 2 : 0;
  const boost = (kind === "boss" ? 1.13 : kind === "champ" ? 1.0 : kind === "elite" ? (run.maps ? 1.0 : 1.10) : kind === "trainer" ? (run.maps ? 1 : 1.05) : 1)
              * (1 + run.corruption*0.06) * (cycleMod("m_tough") ? 1.3 : 1);
  const tr = kind === "trainer" ? trainerFor(run) : null;
  const out = [];
  for(let k=0;k<n;k++){
    let id;
    if(run.maps && kind !== "boss"){
      /* parcours a secteurs : l'espece suit le niveau du combat */
      const lv = expEnemyLevel(run, lvBonus);
      const type = kind === "trainer" ? tr.t : kind === "champ" ? (run.leader || {t:1}).t : null;
      let g = 0;
      do { id = levelWildId(lv, {type, top: kind === "elite" || kind === "champ"}); } while(out.some(o => o.id === id) && g++ < 8);
    } else if(kind === "boss"){
      /* le noyau tire dans le haut de la fourchette finale */
      const [lo, hi] = bstBand(EXP_ROWS - 1);
      const pool = [];
      for(const r of unlockedRegions())
        for(let j=r.from;j<=r.to;j++)
          if(POKE[j] && !POKE[j].leg && !isExclusive(j) && POKE[j].bst >= Math.max(lo, 460) && POKE[j].bst <= 560) pool.push(j);
      id = pool.length ? pick(pool) : wildIdFor(run.floor);
    } else if(kind === "trainer"){
      id = wildIdFor(run.floor, {type: tr.t});
    } else if(kind === "champ"){
      /* l'equipe d'un champion : son type, le haut de la fourchette, sans doublon */
      const L = run.leader || {t:1};
      let g = 0;
      do { id = wildIdFor(run.floor, {type: L.t}); } while(out.some(o => o.id === id) && g++ < 8);
    } else if(kind === "elite"){
      /* l'Elite tire dans le haut de sa fourchette, pas au-dela */
      const [lo, hi] = bstBand(run.floor);
      const mid = lo + (hi - lo) * 0.55;
      const pool = [];
      for(const r of unlockedRegions())
        for(let j=r.from;j<=r.to;j++)
          if(POKE[j] && !POKE[j].leg && !isExclusive(j) && POKE[j].bst >= mid && POKE[j].bst <= hi) pool.push(j);
      id = pool.length ? pick(pool) : wildIdFor(run.floor);
    } else {
      id = wildIdFor(run.floor);
    }
    out.push({id, lv:expEnemyLevel(run, lvBonus), boost});
  }
  return out;
}


/* les adversaires sont tires a l'entree du noeud et gardes : on les voit avant le combat,
   et fermer l'application ne les rejoue pas */
function enemyTeamFor(run, kind, spec){
  return (spec || enemySpecFor(run, kind)).map(f=>makeFighter(f.id, f.lv, {boost:f.boost}));
}

function expFight(run, kind, spec){
  const allies = run.team.filter(m=>m.hp>0).map(m=>runFighter(run, m));
  if(!allies.length){ endExpedition(false); return; }
  const foes = enemyTeamFor(run, kind, spec);
  const titles = {champ:"CHAMPION " + ((run.leader && run.leader.n) || "").toUpperCase(), fight:"RENCONTRE SAUVAGE", trainer:"DRESSEUR " + (TYPE_NAMES[trainerFor(run).t] || "").toUpperCase(),
                  elite:"SIGNATURE ÉLITE", boss:"NOYAU DE COUCHE", legend:"SANCTUAIRE LÉGENDAIRE"};
  createBattle(allies, foes, {
    ai: true, speed: S.settings.battleSpeed || 1,
    title: titles[kind], stage: kind === "boss" || kind === "champ" || kind === "legend" ? "boss" : kind === "elite" ? "elite" : null,
    intro: kind === "boss" ? `Le noyau de la couche se manifeste.`
                           : `Des entités hostiles bloquent le passage.`,
    onEnd: win => {
      run.pend = null;
      const before = run.team.filter(m=>m.hp > 0).length;
      for(const f of allies) if(f.ref){ f.ref.hp = Math.max(0, f.hp); }
      const lost = before - run.team.filter(m=>m.hp > 0).length;
      if(lost > 0){
        run.lost = (run.lost || 0) + lost;
        buzz([50,40,80]);
        toast(lost > 1 ? `${lost} membres désindexés — définitif` : "Un membre désindexé — définitif",
              "bad", "cross");
      }
      /* la relique de réindexation : une fois par parcours, un allié se relève et le combat reste à livrer.
         Avant, la défaite comptait comme un passage : le nœud était franchi sans victoire, et un champion
         perdu au bout d'un secteur laissait la carte sans aucune issue. */
      if(!win && relicVal(run,"revive") && !run.autoRev && run.team.some(m=>m.hp<=0)){
        const m = run.team.find(x=>x.hp<=0);
        m.hp = Math.floor(m.maxHp*0.4);
        run.autoRev = true;
        run.pend = {k:"enc", kind, foes:spec};
        toast(`Réindexation automatique : ${POKE[m.id] ? POKE[m.id].name : "un allié"} se relève. Le combat reste à livrer.`, "warn", "heart");
<<<<<<< HEAD
        save(); if(expHere()){ go("expedition"); expResume(run); } return;
=======
        save(); go("expedition"); expResume(run); return;
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
      }
      if(!win){ endExpedition(false); return; }
      /* l'entite vaincue est celle qu'on pourra recruter : c'est elle qu'on a affrontee */
      const beaten = foes.map(f=>f.id);
      afterFightRewards(run, kind, beaten);
    }
  });
  go("battle");
}

function afterFightRewards(run, kind, beaten){
  const heal = (run.maps ? 0.35 : 0.25) + relicVal(run, "post");
  const before = run.team.map(m=>m.hp);
  const back = classicRecover(run);
  healTeam(run, heal);
  const bitsMul = relicVal(run, "bits") || 1;
  const eliteMul = kind === "elite" ? (relicVal(run,"elite")||1) : 1;
  const bits = Math.round((28 + run.floor*7 + run.corruption*6) * bitsMul * eliteMul *
                          (kind==="elite"?1.7:1));
  run.bits += bits;
  const shardGain = relicVal(run, "shard");
  if(shardGain) gain("shards", shardGain);

  if(kind === "boss"){ save(); endExpedition(true); return; }
  const lv = run.maps ? expGainLevels(run, EXP_GAIN[kind] || 0) : {ups:[], evos:[]};
  /* le Sanctuaire : le légendaire vaincu rejoint l'équipe */
  if(kind === "legend" && beaten && beaten[0] && typeof sanctJoin === "function"){ sanctJoin(run, beaten[0]); return; }
  /* un champion tombe : badge, l'equipe grandit, une relique a choisir, puis le secteur suivant */
  if(kind === "champ"){
    const L = run.leader || {k:"?", t:1, n:"Champion"};
    run.badges.push({k:L.k, t:L.t, n:L.n});
    healTeam(run, 0.4);
    const avail = RELICS.filter(x => !run.relics.includes(x.id));
    const offer = shuffle(avail.slice()).slice(0, 3).map(x => x.id);
    run.pend = {k:"badge", leader:L, bits, ups:lv.ups, evos:lv.evos, relics:offer};
    save();
    if(expHere()){ if(typeof closeSheet === "function") closeSheet(); expResume(run); }
    return;
  }

  const relic = (kind === "elite") ? grantRelic(run) : (rng() < 0.22 ? grantRelic(run) : null);
  const held  = (kind === "elite" && rng() < 0.45) ? randomHeld() : null;
  if(held) grantHeld(held);
  /* la victoire se vit : l'equipe, les gains, la relique — dans une scene (51) */
  run.pend = {k:"loot", kind, bits, heal, back:back || 0, before, relic:relic ? relic.id : null, held:held || null, ups:lv.ups, evos:lv.evos};
  save();
  /* parti pendant le combat : la scène attend son retour (la carte la rouvre) */
  if(expHere()){ if(typeof closeSheet === "function") closeSheet(); expResume(run); }
}

ACTIONS.expcontinue = () => { closeSheet(); go("expedition"); };

