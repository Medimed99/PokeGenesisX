/* ============================================================
   38 — LE FORAGE
   La premiere version faisait frapper une sphere abstraite : aucun
   Pokemon, aucune decouverte visible, presque aucun choix. Elle
   s'inspire maintenant de trois jeux qui ont fait leurs preuves :

   · PokeClicker : ce sont TES Pokemon qui travaillent. L'equipe de
     forage vient de l'archive, et chaque strate a sa matiere : les
     bons types y creusent deux fois plus vite. La collection sert.
   · Le Souterrain de Diamant et Perle : la fouille d'une paroi a la
     pioche et au marteau, avant l'effondrement. Fossiles, pierres,
     eclats, tresors — et parfois un Pokemon endormi dans la roche.
   · Mr. Mine : la profondeur raconte quelque chose, chaque couche
     change de couleur et de regles, et les parois s'accumulent en
     ton absence : il y a toujours une raison de revenir.

   L'Energie Onirique reste : c'est ce que libere le reve quand on
   le creuse (et, on l'apprendra, un condensateur). Elle paie les
   ameliorations et la capture autonome.
   ============================================================ */

/* ---------- les strates ----------
   need : profondeur (m) ou elle commence ; hard : durete (puissance
   necessaire pour un metre par seconde) ; good / bad : types qui y
   creusent deux fois plus vite, ou deux fois moins ; pal : les trois
   tons de sa matiere, du plus tendre au plus dur. */
const STRATA = [
  {n:"Surface",        need:0,     hard:200,  mat:"Terre meuble", good:[5, 6],         bad:[],        c:"#a8865a",
   pal:["#8a6a44", "#73573a", "#5c452e"], d:"De la terre meuble, facile à creuser.", mul:1},
  {n:"Couche molle",   need:40,    hard:260,  mat:"Argile",       good:[5, 11, 12],     bad:[10],      c:"#c98a5a",
   pal:["#b0764c", "#94603c", "#784c2f"], d:"De l'argile collante, pleine de choses oubliées.", mul:1.8},
  {n:"Sédiment",       need:150,   hard:340,  mat:"Roche",        good:[6, 2, 9],       bad:[3, 7],    c:"#9a9aa6",
   pal:["#8c8c98", "#72727e", "#5a5a66"], d:"De la roche tassée. Il faut des poings, ou du métal.", mul:3.2},
  {n:"Veine froide",   need:450,   hard:460,  mat:"Glace",        good:[10, 2, 9],      bad:[12, 3],   c:"#9fe7f0",
   pal:["#a6d8e6", "#7fb8cc", "#5c95ad"], d:"De la glace, gelée depuis la panne. Le feu la fait fondre.", mul:6},
  {n:"Socle",          need:1100,  hard:620,  mat:"Pierre dure",  good:[2, 9, 6, 5],    bad:[1, 18],   c:"#c9a86a",
   pal:["#a89270", "#8a7556", "#6c5a40"], d:"De la pierre très dure. Les combattants s'y sentent bien.", mul:11},
  {n:"Nappe chaude",   need:2500,  hard:830,  mat:"Magma",        good:[11, 6, 5],      bad:[12, 7, 15], c:"#ff8a3d",
   pal:["#b8502a", "#8f3a1e", "#682a16"], d:"Du magma. L'eau le refroidit juste assez pour passer.", mul:20},
  {n:"Faille mineure", need:5000,  hard:1100, mat:"Cristal",      good:[13, 14, 9],     bad:[17],      c:"#b06bff",
   pal:["#8e64c8", "#7048a8", "#523486"], d:"Des cristaux qui conduisent l'électricité, et les pensées.", mul:38},
  {n:"Substrat",       need:9000,  hard:1450, mat:"Ossuaire",     good:[8, 17, 2],      bad:[1, 14],   c:"#ff3d7f",
   pal:["#6a4a5a", "#523848", "#3c2836"], d:"De vieux os. Ici, seuls les spectres sont à l'aise.", mul:70},
  {n:"Noyau onirique", need:16000, hard:1900, mat:"Rêve pur",     good:[14, 16, 18, 8], bad:[],        c:"#ffd24a",
   pal:["#3a3470", "#2c2858", "#1e1c40"], d:"La source du rêve. Plus on descend, plus elle résiste.", mul:130}
];
const FOR_SLOTS_MAX = 6;
const FOR_START_SLOTS = 3;

function forage(){
  S.forage = S.forage || {};
  const f = S.forage;
  /* une partie d'avant la refonte : la strate atteinte devient une profondeur en metres,
     les sondes disparaissent, les Echos deviennent un bonus permanent */
  if(f.m === undefined){
    const old = Math.max(0, Math.min(STRATA.length - 1, f.depth || 0));
    f.m = STRATA[old].need;
    f.crew = []; f.slots = FOR_START_SLOTS; f.walls = old > 0 ? 2 : 1; f.wallAt = 0; f.up = {};
    f.wallsDone = 0; f.maxM = f.m;
    delete f.drills; delete f.perks; delete f.combo; delete f.comboAt; delete f.vein;
  }
  f.energy = f.energy || 0; f.total = f.total || 0; f.echoes = f.echoes || 0; f.found = f.found || 0;
  f.crew = f.crew || []; f.up = f.up || {}; f.slots = f.slots || FOR_START_SLOTS;
  f.walls = f.walls || 0; f.wallAt = f.wallAt || 0; f.wallsDone = f.wallsDone || 0;
  f.maxM = Math.max(f.maxM || 0, f.m);
  /* la forge : les anciennes ameliorations « pioche » et « etais » deviennent des outils forges */
  if(!f.tools){
    f.tools = {pick:Math.min(5, f.up.pick || 0), hammer:0, drill:0, prop:Math.min(5, f.up.prop || 0)};
    delete f.up.pick; delete f.up.prop;
  }
  f.ore = f.ore || {}; f.oreAt = f.oreAt || 0; f.site = f.site || "main";
  f.depth = stratumIdx(f.m);          /* compatibilite : l'indice de la strate */
  return f;
}
function stratumIdx(m){ let i = 0; for(let k = 0; k < STRATA.length; k++) if(m >= STRATA[k].need) i = k; return i; }
function stratum(){ return STRATA[stratumIdx(forage().m)]; }
function nextStratum(){ return STRATA[stratumIdx(forage().m) + 1] || null; }
/* au-dela du Noyau, la durete continue de croitre : la descente ne finit jamais */
function stratumHard(m){
  const i = stratumIdx(m), s = STRATA[i];
  const k = typeof siteHard === "function" ? siteHard() : 1;
  if(i < STRATA.length - 1) return s.hard * k;
  return s.hard * k * (1 + (m - s.need) / 8000);
}
/* compatibilite avec les anciens appels */
function unlocked(k){ return true; }

/* ---------- la puissance de forage d'un Pokemon ---------- */
function digAff(id, si){
  const p = POKE[id], s = STRATA[si];
  if(!p) return 1;
  const sg = typeof forSite === "function" ? forSite().good : [];
  if(p.types.some(t=>s.good.includes(t) || sg.includes(t))) return 2;
  if(p.types.some(t=>s.bad.includes(t))) return 0.5;
  return 1;
}
function digPower(id, si){
  const d = S.dex[id], p = POKE[id];
  if(!d || !p) return 0;
  if(si === undefined) si = forage().depth;
  return d.lvl * (0.6 + p.bst / 700) * digAff(id, si);
}
function crewIds(){ const f = forage(); return f.crew.filter(id=>S.dex[id] && POKE[id]).slice(0, f.slots); }
function crewPower(si){
  if(si === undefined) si = forage().depth;
  const f = forage();
  return crewIds().reduce((a, id)=>a + digPower(id, si), 0) * (1 + f.echoes * 0.03) * (1 + forUpLv("drill") * 0.15)
    * (typeof toolDrillMul === "function" ? toolDrillMul() : 1);
}
/* metres par seconde a la profondeur m */
function digRate(m){
  const f = forage();
  if(m === undefined) m = f.m;
  return crewPower(stratumIdx(m)) / stratumHard(m);
}
/* Energie par metre : chaque strate vaut davantage */
function energyPerM(si){ return 6 * Math.pow(1.9, si) * (typeof siteHard === "function" ? Math.pow(siteHard(), 0.85) : 1); }
function forageRate(){ const f = forage(); return digRate() * energyPerM(f.depth); }
/* une paroi toutes les sept minutes de forage : au metre, les strates profondes n'en
   donnaient presque plus ; au temps, il y a toujours une raison de revenir, et plus
   on creuse profond, plus ce qu'elles renferment vaut cher */
const WALL_SECS = 420;
function wallEvery(){ return WALL_SECS; }
function wallCap(){ return 3 + forUpLv("cart"); }
/* compatibilite : l'ancienne directive comptait les sondes */
function drillCount(){ return crewIds().length; }

/* ---------- les ameliorations, payees en Energie ---------- */
/* les ameliorations : un nom simple, un effet, ce qu'il vaut maintenant et ensuite */
const FOR_UPS = {
  slot:  {n:"Une place de plus dans l'équipe", max:FOR_SLOTS_MAX - FOR_START_SLOTS, cost:l=>[1500, 25000, 400000][l],
          d:l=>`${FOR_START_SLOTS + l} Pokémon`},
  drill: {n:"Creuser plus vite",       max:12, cost:l=>Math.round(800 * Math.pow(3.2, l)),
          d:l=>`+${15 * l} %`},
  cart:  {n:"Plus de fouilles en attente", max:5, cost:l=>Math.round(3000 * Math.pow(3.5, l)),
          d:l=>`${3 + l} fouilles, ${8 + 2 * l} h hors ligne`},
  radar: {n:"Détecteur d'objets",      max:3, cost:l=>Math.round(5000 * Math.pow(5, l)),
          d:l=>["aucun indice", "un point brille sur chaque objet", "on devine la forme des gros objets", "les objets rares scintillent"][l]},
  lamp:  {n:"Plus d'objets rares",     max:6, cost:l=>Math.round(9000 * Math.pow(4, l)),
          d:l=>`×${(1 + 0.3 * l).toFixed(1).replace(".", ",")}`}
};
function forUpLv(k){ return (forage().up || {})[k] || 0; }
function offlineHours(){ return 8 + 2 * forUpLv("cart"); }

/* ---------- l'avancee : en direct comme hors ligne ----------
   On avance strate par strate, pour que le passage d'une couche a
   l'autre change la vitesse au bon moment. */
function forageAdvance(sec){
  const f = forage();
  const out = {m:0, e:0, w:0, strata:[]};
  if(!crewIds().length || sec <= 0) return out;
  let left = sec, guard = 0;
  while(left > 0.001 && guard++ < 64){
    const si = stratumIdx(f.m), r = digRate(f.m);
    if(r <= 0) break;
    const nx = STRATA[si + 1];
    const room = nx ? nx.need - f.m : Infinity;
    /* au-dela du Noyau la durete croit : on avance par tranches de 200 m */
    const step = Math.min(room, nx ? Infinity : 200);
    const t = Math.min(left, step / r);
    const dm = r * t;
    f.m += dm; out.m += dm; left -= t;
    const e = dm * energyPerM(si);
    f.energy += e; f.total += e; out.e += e;
    /* les parois : on les trouve en creusant, jusqu'a la reserve */
    f.wallAt += t;
    const every = WALL_SECS;
    while(f.wallAt >= every){
      f.wallAt -= every;
      if(f.walls < wallCap()){ f.walls++; out.w++; }
    }
    /* le minerai : celui de la couche, parfois celui du chantier */
    if(typeof oreGain === "function"){
      f.oreAt += t;
      while(f.oreAt >= ORE_SECS){
        f.oreAt -= ORE_SECS;
        const so = forSite().ore;
        const o = so && rng() < 0.3 ? so : oreOf(si);
        oreGain(o, 1); out.ore = out.ore || {}; out.ore[o] = (out.ore[o] || 0) + 1;
      }
    }
    if(nx && f.m >= nx.need - 1e-6){ f.m = nx.need; out.strata.push(si + 1); }
  }
  f.maxM = Math.max(f.maxM, f.m);
  f.depth = stratumIdx(f.m);
  return out;
}
/* l'Energie foree fait avancer les quetes « Forer n d'Energie » */
function forageQuest(n){
  if(!(n > 0)) return;
  S.daily.dayEnergy = (S.daily.dayEnergy || 0) + n;
  questTick("dayEnergy", n);
}
let FOR_LAST_WALLS = 0;
function forageTick(dt){
  if(typeof moduleUnlocked === "function" && !moduleUnlocked("idle")) return;
  const r = forageAdvance(dt);
  if(!r.m) return;
  forageQuest(r.e);
  if(r.w) {
    const f = forage();
    if(currentScreen !== "idle" && f.walls >= wallCap() && FOR_LAST_WALLS < wallCap())
      toast("Forage : des fouilles t'attendent", "warn", "stone");
    FOR_LAST_WALLS = f.walls;
  }
  for(const si of r.strata) forStratumReached(si);
  saveSoon();
}
function forStratumReached(si){
  const s = STRATA[si];
  if(typeof forSitesCheck === "function") forSitesCheck();
  if(typeof momentStratum === "function") momentStratum(si);
  else toast(`Forage : ${s.n} atteinte — ${s.mat}`, "warn", "bolt");
  if(si === 2 && !S.flags.firstFossil){ S.flags.firstFossil = true; forage().walls = Math.min(wallCap(), forage().walls + 1); }
}

/* ============================================================
   LA PAROI — la fouille, a la maniere du Souterrain
   Une grille de 12 x 9. Chaque case a 1 a 6 couches. La pioche
   retire deux couches au centre et une autour ; le marteau deux
   partout et une en diagonale, mais ebranle deux fois plus la
   paroi. Un objet est a toi quand toutes ses cases sont degagees.
   ============================================================ */
const WALL_W = 12, WALL_H = 9;
/* ce que les parois renferment : icone, taille en cases, poids selon la strate, effet */
const DIG_LOOT = [
  {k:"red",    ic:"dig:red",    w:2, h:2, n:"Éclat Rouge",   wt:si=>10, give:si=>({shards:6 + si * 3})},
  {k:"blue",   ic:"dig:blue",   w:2, h:2, n:"Éclat Bleu",    wt:si=>10, give:si=>({shards:6 + si * 3})},
  {k:"yellow", ic:"dig:yellow", w:2, h:2, n:"Éclat Jaune",   wt:si=>8,  give:si=>({shards:8 + si * 4})},
  {k:"green",  ic:"dig:green",  w:2, h:2, n:"Éclat Vert",    wt:si=>6,  give:si=>({shards:10 + si * 5})},
  {k:"heart",  ic:"treasure:heart",    w:2, h:2, n:"Écaille Cœur",      wt:si=>7,  give:()=>({treasure:"heart_scale"})},
  {k:"pearl",  ic:"treasure:pearl",    w:2, h:2, n:"Perle",             wt:si=>6,  give:()=>({treasure:"pearl"})},
  {k:"dust",   ic:"treasure:stardust", w:2, h:2, n:"Poussière d'Étoile", wt:si=>3 + si, give:()=>({treasure:"stardust"})},
  {k:"bpearl", ic:"treasure:bigpearl", w:3, h:3, n:"Grande Perle",      wt:si=>1 + si * 0.6, rare:1, give:()=>({treasure:"big_pearl"})},
  {k:"star",   ic:"treasure:starpiece",w:3, h:3, n:"Morceau d'Étoile",  wt:si=>si * 0.5, rare:1, give:()=>({treasure:"star_piece"})},
  {k:"fire",   ic:"stone:fire",    w:3, h:3, n:"Pierre Feu",    wt:si=>si === 5 ? 6 : 2.5, give:()=>({stone:"fire"})},
  {k:"water",  ic:"stone:water",   w:3, h:3, n:"Pierre Eau",    wt:si=>si === 3 ? 6 : 2.5, give:()=>({stone:"water"})},
  {k:"thunder",ic:"stone:thunder", w:3, h:3, n:"Pierre Foudre", wt:si=>si === 6 ? 6 : 2.5, give:()=>({stone:"thunder"})},
  {k:"leaf",   ic:"stone:leaf",    w:3, h:3, n:"Pierre Plante", wt:si=>si === 1 ? 6 : 2.5, give:()=>({stone:"leaf"})},
  {k:"moon",   ic:"stone:moon",    w:3, h:3, n:"Pierre Lune",   wt:si=>si === 7 ? 6 : 2,   give:()=>({stone:"moon"})},
  {k:"sun",    ic:"stone:sun",     w:3, h:3, n:"Pierre Soleil", wt:si=>si === 8 ? 6 : 1.5, give:()=>({stone:"sun"})},
  {k:"helix",  ic:"dig:helix", w:4, h:4, n:"Fossile Nautile", wt:si=>si >= 1 ? 2.2 : 0, rare:1, give:()=>({egg:"f_helix"})},
  {k:"dome",   ic:"dig:dome",  w:4, h:4, n:"Fossile Dôme",    wt:si=>si >= 1 ? 2.2 : 0, rare:1, give:()=>({egg:"f_dome"})},
  {k:"amber",  ic:"dig:amber", w:4, h:4, n:"Vieil Ambre",     wt:si=>si >= 3 ? 1.4 : 0, rare:1, give:()=>({egg:"f_amber"})},
  {k:"root",   ic:"dig:root",  w:4, h:4, n:"Fossile Racine",  wt:si=>si >= 4 && forHoenn() ? 1.6 : 0, rare:1, give:()=>({egg:"f_root"})},
  {k:"claw",   ic:"dig:claw",  w:4, h:4, n:"Fossile Griffe",  wt:si=>si >= 4 && forHoenn() ? 1.6 : 0, rare:1, give:()=>({egg:"f_claw"})},
  {k:"oval",   ic:"dig:oval",  w:2, h:2, n:"Pierre Ovale",    wt:si=>2.5, give:si=>({egg:si >= 6 ? "e_epic" : si >= 3 ? "e_rare" : "e_common"})},
  {k:"hard",   ic:"dig:hard",  w:2, h:2, n:"Pierre Dure",     wt:si=>1.5 + si * 0.3, rare:1, give:si=>({cores:1})},
  {k:"bone",   ic:"dig:bone",  w:3, h:2, n:"Os Rare",         wt:si=>si >= 4 ? 1 + si * 0.2 : 0, rare:1, give:si=>({cores:2 + Math.floor(si / 4)})},
  {k:"ever",   ic:"dig:ever",  w:2, h:2, n:"Pierre Stase",    wt:si=>3, give:si=>({coins:900 + si * 500})},
  {k:"held",   ic:"held:h_relic", w:2, h:2, n:"Objet ancien", wt:si=>si >= 2 ? 0.8 : 0, rare:1, give:()=>({held:1})},
  {k:"mon",    ic:null,        w:3, h:3, n:"Pokémon endormi", wt:si=>3.5, rare:1, give:(si, it)=>({mon:it.mon})},
  /* jamais tiree au hasard : placee quand une page des onze attend dans le Forage */
  {k:"page",   ic:null,        w:3, h:2, n:"Page de journal", wt:si=>0, rare:1, give:(si, it)=>({page:it.page})}
];
function forHoenn(){ return typeof regionUnlocked === "function" && regionUnlocked("hoenn"); }
/* qui dort dans la roche : les types de la strate, des secteurs ouverts, jamais un legendaire */
const DIG_MON_TYPES = [[5, 6], [5, 11, 4], [6, 5, 2], [15, 11], [6, 9, 5], [10, 6, 5], [9, 14, 13], [8, 17, 4], [14, 16, 8]];
function digMonFor(si, rnd){
  const site = typeof forSite === "function" ? forSite() : {};
  /* aux Ruines, les Zarbi dorment dans les murs */
  if(site.zarbi && rnd() < 0.35 && unlockedRegions().some(r=>201 >= r.from && 201 <= r.to)) return 201;
  const T = site.mons || DIG_MON_TYPES[Math.min(si, DIG_MON_TYPES.length - 1)], pool = [];
  for(const r of unlockedRegions()) for(let i = r.from; i <= r.to; i++){
    const p = POKE[i];
    if(!p || p.leg || isExclusive(i) || p.bst > 300 + si * 40) continue;
    if(isGuardianSpecies(i) && !isReleasedGuardian(i)) continue;
    if(p.types.some(t=>T.includes(t))) pool.push(i);
  }
  return pool.length ? pool[Math.floor(rnd() * pool.length)] : 50;
}
/* un gros objet n'occupe pas ses coins : sa silhouette reste lisible */
function digMask(it){
  const m = [];
  for(let y = 0; y < it.h; y++) for(let x = 0; x < it.w; x++){
    const corner = (x === 0 || x === it.w - 1) && (y === 0 || y === it.h - 1);
    if(it.w >= 4 && it.h >= 4 && corner) continue;
    m.push([x, y]);
  }
  return m;
}
function genWall(si, rnd){
  rnd = rnd || rng;
  const W = WALL_W, H = WALL_H;
  /* les couches : un fond, et des amas plus durs */
  const L = new Array(W * H).fill(0).map(()=>2 + Math.floor(rnd() * 2));
  for(let b = 0; b < 7; b++){
    const cx = rnd() * W, cy = rnd() * H, r = 1.5 + rnd() * 2.5, add = 1 + Math.floor(rnd() * 3);
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++) if(Math.hypot(x - cx, y - cy) < r) L[y * W + x] = Math.min(6, L[y * W + x] + add);
  }
  const occ = new Array(W * H).fill(-1);
  const items = [];
  const lamp = 1 + 0.3 * forUpLv("lamp");
  const sl = typeof forSite === "function" ? forSite().loot : {};
  const table = DIG_LOOT.map(l=>[l, l.wt(si) * (l.rare ? lamp : 1) * (sl[l.k] || 1)]).filter(x=>x[1] > 0);
  const tot = table.reduce((a, x)=>a + x[1], 0);
  const n = 3 + Math.floor(rnd() * 2) + (si >= 4 && rnd() < 0.45 ? 1 : 0);
  let tries = 0;
  /* une page des onze attend dans le Forage : elle est dans cette paroi, une fois sur deux */
  const pg = typeof fragPending === "function" ? fragPending("forage") : null;
  if(pg && rnd() < 0.5) for(let t = 0; t < 60; t++){
    const x0 = Math.floor(rnd() * (W - 2)), y0 = Math.floor(rnd() * (H - 1));
    const it = {k:"page", x:x0, y:y0, w:3, h:2, found:false, page:pg.id};
    it.cells = digMask(it).map(([x, y])=>(y0 + y) * W + x0 + x);
    it.cells.forEach(c=>{ occ[c] = items.length; });
    items.push(it); break;
  }
  while(items.length < n && tries++ < 200){
    let r = rnd() * tot, def = table[0][0];
    for(const [l, w] of table){ r -= w; if(r <= 0){ def = l; break; } }
    const x0 = Math.floor(rnd() * (W - def.w + 1)), y0 = Math.floor(rnd() * (H - def.h + 1));
    const it = {k:def.k, x:x0, y:y0, w:def.w, h:def.h, found:false};
    const cells = digMask(it).map(([x, y])=>(y0 + y) * W + x0 + x);
    if(cells.some(c=>occ[c] >= 0)) continue;
    if(def.k === "mon") it.mon = digMonFor(si, rnd);
    it.cells = cells;
    cells.forEach(c=>{ occ[c] = items.length; });
    items.push(it);
  }
  /* le minerai : de petites pepites, une case chacune ; celles de la couche
     surtout, parfois une plus ancienne. Elles ne comptent pas pour « tout degager ». */
  if(typeof oreOf === "function"){
    const oi = ORE_IDS.indexOf(oreOf(si)), so = forSite().ore;
    const nOre = 5 + Math.floor(rnd() * 4);
    for(let k = 0, t = 0; k < nOre && t < 80; t++){
      const x0 = Math.floor(rnd() * W), y0 = Math.floor(rnd() * H), c = y0 * W + x0;
      if(occ[c] !== -1) continue;
      const r = rnd();
      const ore = so && r < 0.25 ? so : r < 0.75 ? ORE_IDS[oi] : ORE_IDS[Math.floor(rnd() * (oi + 1))];
      const it = {k:"ore", ore, x:x0, y:y0, w:1, h:1, found:false, small:true, n:(()=>{ const r = rnd(); return r < 0.1 ? 3 : r < 0.4 ? 2 : 1; })(), cells:[c]};
      occ[c] = items.length; items.push(it); k++;
    }
  }
  /* le fer : indestructible ; il protege ce qu'il couvre */
  const iron = [];
  const nIron = 1 + Math.floor(rnd() * 3);
  for(let k = 0, t = 0; k < nIron && t < 60; t++){
    const w = 1 + Math.floor(rnd() * 2), h = 1 + Math.floor(rnd() * 2);
    const x0 = Math.floor(rnd() * (W - w + 1)), y0 = Math.floor(rnd() * (H - h + 1));
    const cells = [];
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) cells.push((y0 + y) * W + x0 + x);
    if(cells.some(c=>occ[c] !== -1)) continue;
    cells.forEach(c=>{ occ[c] = -2; L[c] = 99; });
    iron.push(cells); k++;
  }
  const max = 40 + 8 * (typeof toolTier === "function" ? toolTier("prop") : 0);
  return {si, W, H, L, items, iron, occ, stab:max, max, hits:0, over:false, collapsed:false};
}
/* un coup : pioche ("pick") ou marteau ("hammer") en (x, y) */
function digHit(wall, tool, x, y){
  if(wall.over) return null;
  const W = wall.W, H = wall.H;
  const hits = [];
  const add = (dx, dy, n) => { const X = x + dx, Y = y + dy; if(n > 0 && X >= 0 && Y >= 0 && X < W && Y < H) hits.push([Y * W + X, n]); };
  const ORTH = [[1,0],[-1,0],[0,1],[0,-1]], DIAG = [[1,1],[1,-1],[-1,1],[-1,-1]];
  let cost = 1;
  if(tool === "hammer"){
    const T = HAMMER_T[toolTier("hammer")];
    add(0, 0, T.c); ORTH.forEach(([a, b])=>add(a, b, T.a)); DIAG.forEach(([a, b])=>add(a, b, T.d));
    if(T.ring) [[2,0],[-2,0],[0,2],[0,-2]].forEach(([a, b])=>add(a, b, 1));
    cost = T.cost;
  } else {
    const [c, a, d] = PICK_T[toolTier("pick")];
    add(0, 0, c); ORTH.forEach(([p, q])=>add(p, q, a)); DIAG.forEach(([p, q])=>add(p, q, d));
  }
  const ironHit = wall.occ[y * W + x] === -2;
  for(const [c, n] of hits) if(wall.L[c] < 99) wall.L[c] = Math.max(0, wall.L[c] - (ironHit ? 0 : n));
  wall.stab = Math.max(0, +(wall.stab - cost).toFixed(2));
  wall.hits++;
  const fresh = [];
  for(const it of wall.items) if(!it.found && it.cells.every(c=>wall.L[c] === 0)){ it.found = true; fresh.push(it); }
  const all = wall.items.every(it=>it.found || it.small);
  if(all || wall.stab <= 0){ wall.over = true; wall.collapsed = !all; }
  return {fresh, iron:ironHit, over:wall.over, collapsed:wall.collapsed};
}
/* ce que rapportent les objets degages */
function digClaim(wall){
  const out = [];
  for(const it of wall.items){
    if(!it.found) continue;
    if(it.k === "ore"){
      const o = oreDef(it.ore), fresh = oreGain(it.ore, it.n);
      const prev = out.find(r=>r.ore === it.ore);
      if(prev){ prev.g.ore += it.n; prev.label = `${o.n} ×${prev.g.ore}`; }
      else out.push({it, ore:it.ore, def:{ic:null}, g:{ore:it.n}, label:o.n + (it.n > 1 ? " ×" + it.n : ""), fresh});
      continue;
    }
    const def = DIG_LOOT.find(l=>l.k === it.k);
    const g = def.give(wall.si, it);
    const row = {it, def, g, label:def.n};
    if(g.shards) gain("shards", g.shards);
    if(g.cores) gain("cores", g.cores);
    if(g.coins) gain("coins", g.coins);
    if(g.stone) S.stones[g.stone] = (S.stones[g.stone] || 0) + 1;
    if(g.treasure){ S.treasures = S.treasures || {}; S.treasures[g.treasure] = (S.treasures[g.treasure] || 0) + 1; S.stats.treasures = (S.stats.treasures || 0) + 1; }
    if(g.egg && typeof grantEgg === "function") grantEgg(g.egg);
    if(g.held && typeof randomHeld === "function"){ const h = randomHeld(); if(h && grantHeld(h)) row.label = HELD_ITEMS[h].n; else gain("shards", 40); }
    if(g.page){
      const fr = FRAGMENTS.find(x=>x.id === g.page);
      if(fr && !(S.fragments || []).includes(fr.id)) fragFound(fr, `Dans une fouille, couche « ${STRATA[wall.si].n} », à ${fmt(Math.floor(forage().m))} m`);
      row.label = fr ? `Page de journal — ${fr.who}` : "Page de journal";
    }
    if(g.ores) for(const o in g.ores) oreGain(o, g.ores[o]);
    if(g.candy && typeof teamCandyGain === "function") teamCandyGain(g.candy);
    if(g.balls) for(const b in g.balls) if(g.balls[b]) S.balls[b] = (S.balls[b] || 0) + g.balls[b];
    if(g.berries) for(const b in g.berries) S.berries[b] = (S.berries[b] || 0) + g.berries[b];
    if(g.integ && typeof addIntegrity === "function") addIntegrity(g.integ);
    if(g.crate !== undefined && typeof crateRoll === "function"){ row.crate = crateRoll(g.crate, wall.si); row.crateTier = g.crate; }
    if(g.mon){
      const lv = Math.max(5, Math.round(10 + wall.si * 7 + rng() * 6));
      DEX_HOW = "roche";
      row.isNew = addToDex(g.mon, lv, rng() < 1 / 400);
      row.label = POKE[g.mon].name + (row.isNew ? " — nouvelle espèce !" : "");
    }
    out.push(row);
  }
  const f = forage();
  f.found += out.filter(r=>!r.ore).length; f.wallsDone++;
  S.stats.walls = (S.stats.walls || 0) + 1;
  saveSoon();
  return out;
}

/* ============================================================
   L'ECRAN — le puits, l'equipe, les parois
   ============================================================ */
let FOR_VIEW = null;   /* animation du puits */
let FOR_SHOWN_WALLS = -1;
let DIG = null;        /* la paroi en cours */
let DIG_TOOL = "pick";

SCREENS.idle = {
  after(host, arg){
    if(arg === "wall" && DIG){ digAfter(); return; }
    tutoMaybe("idle");
    forShaftStart();
    if(typeof pmdWake === "function") pmdWake();
  },
  html(arg){
    if(arg === "wall" && DIG) return digHtml();
    /* la premiere fois, l'equipe se compose d'elle-meme */
    if(!forage().crew.length && Object.keys(S.dex).length) forAutoCrew(true);
    const f = forage(), si = f.depth, st = STRATA[si], nx = STRATA[si + 1];
    const crew = crewIds(), rate = digRate();
    const cap = wallCap();
    FOR_SHOWN_WALLS = f.walls;
    const goodTxt = st.good.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join(" ");
    const showHow = (f.wallsDone || 0) < 3;
    return `
      <div class="h">${ic("bolt")} LE FORAGE ${infoBtn("idle")}</div>
      ${showHow ? `<div class="fo-how">
        <div><b>1</b><span>Ton équipe creuse toute seule, même jeu fermé.</span></div>
        <div><b>2</b><span>En creusant, elle trouve des <em>fouilles</em>.</span></div>
        <div><b>3</b><span>Tu les dégages pour gagner des objets.</span></div>
      </div>` : ""}

      <div class="fo-shaft" id="fo-shaft" style="--sc:${st.c};--st:${forSite().tint || "transparent"}">
        <canvas id="fo-cv"></canvas>
        <div class="fo-hud">
          <div><b>${esc(st.n)}</b><small>${(f.site || "main") !== "main" ? esc(forSite().n) + " · " : ""}${fmt(Math.floor(f.m))} m de profondeur</small></div>
          <div class="fo-rate"><b id="fo-rate">${forFmtRate(rate)}</b><small>m / s</small></div>
        </div>
        ${nx ? `<div class="fo-next"><i style="width:${Math.min(100, (f.m - st.need) / (nx.need - st.need) * 100).toFixed(1)}%"></i>
          <span>Prochaine couche : ${esc(nx.n)}, à ${fmt(nx.need)} m</span></div>` : `<div class="fo-next deep"><span>Plus rien en dessous : la roche durcit sans fin</span></div>`}
      </div>

      <button class="fo-wallbtn ${f.walls ? "ready" : ""}" data-act="fowall" ${f.walls ? "" : "disabled"}>
        <span class="fo-wallic">${itemIcon("dig:hard", 34) || ic("stone")}</span>
        <span class="grow"><b>${f.walls ? `${f.walls} fouille${f.walls > 1 ? "s" : ""} à faire` : "Aucune fouille pour l'instant"}</b>
          <small>${!crew.length ? "Il faut au moins un Pokémon dans l'équipe."
            : f.walls >= cap ? "C'est plein : fais-en une, sinon ton équipe n'en trouvera plus."
            : `La prochaine dans ${Math.max(1, Math.ceil((WALL_SECS - f.wallAt) / 60))} min · ${f.walls}/${cap} en attente`}</small>
          <span class="fo-wbar"><i id="fo-wbar" style="width:${Math.min(100, f.wallAt / WALL_SECS * 100).toFixed(0)}%"></i></span></span>
        ${f.walls ? `<span class="fo-go">FOUILLER</span>` : ""}
      </button>

      <div class="row between" style="margin:14px 0 4px"><div class="h sm" style="margin:0">TON ÉQUIPE</div>
        <button class="btn xs" data-act="foauto">${ic("refresh")} Choisir les meilleurs</button></div>
      <div class="fo-tip">Dans cette couche (${esc(st.mat.toLowerCase())}), ${goodTxt} creusent <b>deux fois plus vite</b>.</div>
      <div class="fo-crew">${Array.from({length:FOR_SLOTS_MAX}, (_, i)=>{
        const id = crew[i];
        if(i >= f.slots) return `<div class="fo-slot locked">${ic("lock")}</div>`;
        if(!id) return `<button class="fo-slot empty" data-act="fopick" data-i="${i}"><span>+</span></button>`;
        const a = digAff(id, si);
        return `<button class="fo-slot ${a > 1 ? "good" : a < 1 ? "bad" : ""}" data-act="fopick" data-i="${i}">
          ${sprite(id, S.dex[id].shiny, "")}
          <small>N.${S.dex[id].lvl}</small>
          ${a !== 1 ? `<i class="fo-aff ${a > 1 ? "up" : "dn"}">${a > 1 ? "rapide" : "lent"}</i>` : ""}</button>`; }).join("")}</div>
      <div class="tiny dim" style="margin-top:4px">Touche un Pokémon pour le remplacer. Plus son niveau est haut, plus il creuse vite.</div>

      <div class="row between" style="margin:16px 0 6px"><div class="h sm" style="margin:0">LA FORGE</div>
        <span class="pill">${ic("bolt")} ${fmt(Math.floor(f.energy))}</span></div>
      ${forForgeHtml()}

      <div class="row between" style="margin:16px 0 6px"><div class="h sm" style="margin:0">AMÉLIORER</div>
        <span class="pill">${ic("bolt")} <b id="fo-energy">${fmt(Math.floor(f.energy))}</b> Énergie</span></div>
      <div class="tiny dim" style="margin:-2px 0 6px">L'Énergie se gagne toute seule en creusant : plus c'est profond, plus elle monte vite.</div>
      <div class="list">${Object.entries(FOR_UPS).map(([k, u])=>{
        const lv = forUpLv(k), maxed = lv >= u.max, c = maxed ? 0 : u.cost(lv);
        return `<div class="item fo-up ${maxed ? "on" : ""}">
          <div class="grow"><div class="t">${esc(u.n)}</div>
            <div class="d">${maxed ? `${esc(u.d(lv))} · au maximum` : `${esc(u.d(lv))} <span class="fo-arr">→</span> <b>${esc(u.d(lv + 1))}</b>`}</div></div>
          ${maxed ? `<span class="tiny cy">max</span>` : `<button class="btn sm ${f.energy >= c ? "gold" : ""}" data-act="foup" data-k="${k}" ${f.energy >= c ? "" : "disabled"}>${ic("bolt")} ${fmt(c)}</button>`}
        </div>`; }).join("")}</div>

      <div class="row between" style="margin:16px 0 6px"><div class="h sm" style="margin:0">LES CHANTIERS</div>
        <span class="tiny dim">${FOR_SITES.filter(x=>siteOpen(x.id)).length} / ${FOR_SITES.length} ouverts</span></div>
      <div class="tiny dim" style="margin:-2px 0 6px">D'autres puits, avec d'autres trésors. Ton équipe creuse dans un seul à la fois.</div>
      ${forSitesHtml()}

      <details class="fo-more">
        <summary>Les couches · ${STRATA.filter(x=>f.maxM >= x.need).length} sur ${STRATA.length} découvertes</summary>
        <div class="fo-strata">${STRATA.map((x, i)=>{
          const here = i === si, done = f.maxM >= x.need;
          return `<div class="fo-st ${here ? "here" : ""} ${done ? "" : "unk"}" style="--sc:${x.c}">
            <i></i><div class="grow"><b>${done ? esc(x.n) : "Pas encore atteinte"}</b><small>${fmt(x.need)} m${done ? " · " + esc(x.mat) : ""}</small></div>
            ${done ? `<span class="fo-stt">${x.good.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}</span>` : ""}
          </div>`; }).join("")}</div>
      </details>

      <details class="fo-more">
        <summary>Dépenser l'Énergie autrement</summary>
        ${botPanel()}
        <div class="h sm" style="margin-top:12px">ÉCHANGER CONTRE…</div>
        <div class="btn-grid c3">
          <button class="btn sm" data-act="forconv" data-k="coins" ${f.energy >= 300 ? "" : "disabled"}>${fmt(Math.round(100 * (1 + si * 0.6)))} PokéCoins<br><small>300 Énergie</small></button>
          <button class="btn sm" data-act="forconv" data-k="shards" ${f.energy >= 9000 ? "" : "disabled"}>${10 + si * 4} Fragments<br><small>9 000 Énergie</small></button>
          <button class="btn sm" data-act="forconv" data-k="cores" ${f.energy >= 260000 ? "" : "disabled"}>${1 + Math.floor(si / 4)} Noyau<br><small>260 000 Énergie</small></button>
        </div>
      </details>

      <div class="tiles" style="margin-top:11px">
        <div class="tile accent"><div class="k">Plus profond</div><div class="v">${fmt(Math.floor(f.maxM))} m</div></div>
        <div class="tile gold"><div class="k">Fouilles faites</div><div class="v">${f.wallsDone}</div></div>
        <div class="tile"><div class="k">Objets trouvés</div><div class="v">${f.found}</div></div>
        <div class="tile"><div class="k">Creuse hors ligne</div><div class="v">${offlineHours()} h</div></div>
      </div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};
function forFmtRate(r){ return r >= 10 ? fmt(Math.round(r)) : r.toFixed(r >= 1 ? 1 : 2).replace(".", ","); }

/* ---------- l'equipe ---------- */
function forAutoCrew(quiet){
  const f = forage(), si = f.depth;
  const ids = Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>digPower(b, si) - digPower(a, si));
  f.crew = ids.slice(0, f.slots);
  save();
  if(!quiet) toast("Les plus rapides pour cette couche sont au travail", "", "check");
}
ACTIONS.foauto = () => { forAutoCrew(); refresh(); };
let FO_PICK = 0;
ACTIONS.fopick = d => {
  FO_PICK = +d.i;
  const f = forage(), si = f.depth, crew = crewIds();
  const ids = Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>digPower(b, si) - digPower(a, si)).slice(0, 60);
  sheet(`${sheetHead("Qui creuse ici ?")}
    <div class="tiny muted" style="margin-bottom:8px">Ici, ${STRATA[si].good.map(t=>TYPE_NAMES[t]).join(", ")} creusent deux fois plus vite.
      Les plus rapides sont en premier.</div>
    ${crew[FO_PICK] ? `<button class="btn ghost wide sm" style="margin-bottom:8px" data-act="foset" data-id="0">Retirer ce Pokémon de l'équipe</button>` : ""}
    <div class="fo-pickgrid">${ids.map(id=>{ const a = digAff(id, si), on = crew.includes(id);
      return `<button class="fo-pk ${on ? "on" : ""}" data-act="foset" data-id="${id}">
        ${sprite(id, S.dex[id].shiny, "")}<small>N.${S.dex[id].lvl}</small>
        ${a !== 1 ? `<i class="fo-aff ${a > 1 ? "up" : "dn"}">${a > 1 ? "rapide" : "lent"}</i>` : ""}</button>`; }).join("")}</div>`);
};
ACTIONS.foset = d => {
  const f = forage(), id = +d.id;
  const crew = crewIds();
  if(id){
    const k = crew.indexOf(id);
    if(k >= 0) crew.splice(k, 1);
    crew[Math.min(FO_PICK, crew.length)] = id;
  } else crew.splice(FO_PICK, 1);
  f.crew = crew.filter(Boolean).slice(0, f.slots);
  save(); closeSheet(); refresh();
};
ACTIONS.foup = d => {
  const f = forage(), u = FOR_UPS[d.k], lv = forUpLv(d.k);
  if(!u || lv >= u.max) return;
  const c = u.cost(lv);
  if(f.energy < c){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= c; f.up[d.k] = lv + 1;
  if(d.k === "slot"){ f.slots = FOR_START_SLOTS + f.up.slot; toast("Une place de plus : un Pokémon de plus peut creuser", "warn", "check"); }
  Sfx.win(); save(); refresh();
};
ACTIONS.forconv = d => {
  const f = forage(), si = f.depth;
  const packs = {
    coins:  {cost:300,    give:()=>gain("coins", Math.round(100 * (1 + si * 0.6)))},
    shards: {cost:9000,   give:()=>gain("shards", 10 + si * 4)},
    cores:  {cost:260000, give:()=>gain("cores", 1 + Math.floor(si / 4))}
  }[d.k];
  if(!packs || f.energy < packs.cost){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= packs.cost; packs.give();
  Sfx.coin(); save(); refresh();
};

/* ---------- le puits anime ----------
   Une coupe : les strates deja traversees au-dessus, la matiere
   courante en bas, et l'equipe qui creuse, chacun a sa galerie. */
function forShaftStart(){
  const cv = document.getElementById("fo-cv"); if(!cv) return;
  const host = cv.parentElement; if(!host) return;
  const W = Math.max(300, host.clientWidth), H = 230, d = Math.min(3, window.devicePixelRatio || 1);
  cv.width = W * d; cv.height = H * d; cv.style.height = H + "px";
  FOR_VIEW = {cv, W, H, d, t:0, last:0, parts:[], rocks:forRocks(W, H)};
  cancelAnimationFrame(forShaftStart._raf);
  const loop = now => {
    const V = FOR_VIEW;
    if(!V || !V.cv.isConnected){ FOR_VIEW = null; return; }
    forShaftStart._raf = requestAnimationFrame(loop);
    const dt = Math.min(80, now - (V.last || now)); V.last = now; V.t += dt;
    forShaftDraw(V, dt);
  };
  forShaftStart._raf = requestAnimationFrame(loop);
  clearInterval(forShaftStart._iv);
  forShaftStart._iv = setInterval(()=>{
    if(!document.getElementById("fo-cv")){ clearInterval(forShaftStart._iv); return; }
    const e = document.getElementById("fo-energy"); if(e) e.textContent = fmt(Math.floor(forage().energy));
    const r = document.getElementById("fo-rate"); if(r) r.textContent = forFmtRate(digRate());
    const f = forage(), b = document.getElementById("fo-wbar"); if(b) b.style.width = Math.min(100, f.wallAt / WALL_SECS * 100).toFixed(0) + "%";
    /* une paroi vient d'arriver : l'ecran se met a jour, sauf si une fenetre est ouverte */
    if(f.walls !== FOR_SHOWN_WALLS && !(typeof sheetOpen === "function" && sheetOpen())) refresh();
  }, 500);
}
function forRocks(W, H){ const R = mulberry32(forage().depth * 97 + 3), out = [];
  for(let i = 0; i < 70; i++) out.push([R() * W, R() * H, 1 + R() * 3, R()]); return out; }
function forShaftDraw(V, dt){
  const x = V.cv.getContext("2d"), W = V.W, H = V.H, f = forage(), si = f.depth, st = STRATA[si];
  x.setTransform(V.d, 0, 0, V.d, 0, 0); x.imageSmoothingEnabled = false;
  /* les bandes du dessus : les strates traversees, de plus en plus fines */
  const top = 56;
  let y = 0;
  for(let i = Math.max(0, si - 3); i < si; i++){ const h = 10 + (i - si + 4) * 4; x.fillStyle = STRATA[i].pal[1]; x.fillRect(0, y, W, h); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, y + h - 2, W, 2); y += h; }
  x.fillStyle = "#0b0f1a"; if(y < top){ x.fillRect(0, y, W, top - y); }
  /* la matiere courante, avec sa texture qui defile vers le haut */
  const scroll = (f.m * 18) % H;
  x.fillStyle = st.pal[0]; x.fillRect(0, top, W, H - top);
  const tint = typeof forSite === "function" && forSite().tint;
  if(tint){ x.globalAlpha = 0.18; x.fillStyle = tint; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
  for(const [rx, ry, r, k] of V.rocks){
    const yy = top + ((ry - scroll + H * 4) % (H - top));
    x.fillStyle = k < 0.5 ? st.pal[1] : st.pal[2]; x.fillRect(rx, yy, r * 2, r * 1.4);
  }
  /* les galeries : une par Pokemon, la ou il creuse */
  const crew = crewIds(), n = Math.max(1, crew.length);
  const t = V.t / 1000;
  crew.forEach((id, i)=>{
    const cx = W * (i + 0.5) / n, cy = H - 44;
    x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(cx - 22, top, 44, H - top);
    x.fillStyle = "rgba(0,0,0,.25)"; x.beginPath(); x.ellipse(cx, cy + 4, 20, 6, 0, 0, 7); x.fill();
    const size = Math.min(70, W / n * 0.75), ph = (t + i * 0.37) % 1.1;
    let ok = false;
    const FV = typeof eraVar === "function" ? eraVar(id, S.dex[id] && S.dex[id].shiny ? "s" : "n", true) : S.dex[id] && S.dex[id].shiny ? "s" : "n";
    if(typeof brAnimDraw === "function") ok = brAnimDraw(x, id, "attack", FV, 0, ph, cx, cy, size);
    if(!ok && typeof brPmdDraw === "function") ok = brPmdDraw(x, id, FV === "s" ? "n" : FV, 0, t * 0.6 + i, cx, cy, size);
    if(!ok && typeof brSprite === "function"){ const s = brSprite(id, FV === "s" ? "n" : FV); if(s) x.drawImage(s, cx - size / 2, cy - size * 0.8, size, size); }
    if(typeof forCrewTool === "function") forCrewTool(x, cx, cy, size, ph);
    /* des eclats de matiere, au rythme des coups */
    if(Math.random() < dt / 160) for(let k = 0; k < 3; k++) V.parts.push({x:cx + (Math.random() - 0.5) * 20, y:cy + 6, vx:(Math.random() - 0.5) * 0.12, vy:-0.08 - Math.random() * 0.12, life:0, max:500 + Math.random() * 400, c:st.pal[Math.floor(Math.random() * 3)]});
  });
  if(typeof forShaftDecor === "function") forShaftDecor(x, V, W, H, top);
  if(!crew.length){ x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(0, top, W, H - top); x.fillStyle = "#e8f0ff"; x.font = '9px "Press Start 2P",monospace'; x.textAlign = "center"; x.fillText("AJOUTE UN POKÉMON", W / 2, H / 2 + 20); }
  for(let i = V.parts.length - 1; i >= 0; i--){
    const p = V.parts[i]; p.life += dt; if(p.life > p.max){ V.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0004 * dt;
    x.globalAlpha = 1 - p.life / p.max; x.fillStyle = p.c; x.fillRect(p.x, p.y, 3, 3);
  }
  x.globalAlpha = 1;
}

/* ---------- la fouille ---------- */
ACTIONS.fowall = () => {
  const f = forage();
  if(f.walls <= 0) return;
  f.walls--; FOR_LAST_WALLS = f.walls;
  DIG = genWall(f.depth);
  DIG.fx = [];
  save();
  go("idle", "wall");
};
function digHtml(){
  const st = STRATA[DIG.si];
  return `<div class="dg" style="--sc:${st.c}">
    <div class="dg-head">
      <button class="sw-back" data-act="fowallquit">${ic("arrow")}</button>
      <div class="grow"><small>FOUILLE · ${esc(st.n.toUpperCase())}</small><b>${digBig().length} objets cachés <span class="dg-oreh">+ ${DIG.items.length - digBig().length} pépites</span></b></div>
      <span class="dg-found" id="dg-found">0 / ${digBig().length}</span>
    </div>
    <div class="dg-stab"><i id="dg-stab" style="width:100%"></i><span>Solidité</span></div>
    <div class="dg-wrap" id="dg-wrap"><canvas id="dg-cv"></canvas></div>
    <div class="dg-tools">
      <button class="dg-tool tt${toolTier("pick")} ${DIG_TOOL === "pick" ? "on" : ""}" data-act="fotool" data-t="pick">${toolSvg("pick", toolTier("pick"), 34)}<span>${esc(toolName("pick"))}</span><small>petite zone · abîme peu</small></button>
      <button class="dg-tool tt${toolTier("hammer")} ${DIG_TOOL === "hammer" ? "on" : ""}" data-act="fotool" data-t="hammer">${toolSvg("hammer", toolTier("hammer"), 34)}<span>${esc(toolName("hammer"))}</span><small>grande zone · abîme plus</small></button>
    </div>
    <div class="tiny dim" style="text-align:center;margin-top:6px;line-height:1.6">Touche la roche pour creuser. Dégage <b>entièrement</b> un objet pour le gagner.<br>
      Les <b>pépites</b> de minerai sont en bonus. À chaque coup, la solidité baisse : à zéro, tout s'effondre. Le métal gris ne casse jamais.</div>
    <div class="dg-res" id="dg-res"></div>
  </div>`;
}
ACTIONS.fotool = d => { DIG_TOOL = d.t; document.querySelectorAll(".dg-tool").forEach(b=>b.classList.toggle("on", b.dataset.t === d.t)); };
ACTIONS.fowallquit = () => {
  if(DIG && !DIG.over && DIG.items.some(it=>it.found)){
    /* partir garde ce qui est deja degage */
    DIG.over = true; digEnd(true); return;
  }
  if(DIG && !DIG.over && !DIG.hits){ forage().walls++; }
  DIG = null; go("idle");
};
let DIG_IMG = null;
function digImg(){
  if(!DIG_IMG && typeof ITEMS_URL !== "undefined"){ DIG_IMG = new Image(); DIG_IMG.src = ITEMS_URL; }
  return DIG_IMG && DIG_IMG.complete && DIG_IMG.naturalWidth ? DIG_IMG : null;
}
function digAfter(){
  const cv = document.getElementById("dg-cv"); if(!cv) return;
  const host = cv.parentElement; if(!host) return;
  const W = Math.min(520, Math.max(300, host.clientWidth));
  const cell = Math.floor(W / WALL_W), H = cell * WALL_H, d = Math.min(3, window.devicePixelRatio || 1);
  cv.width = cell * WALL_W * d; cv.height = H * d; cv.style.width = cell * WALL_W + "px"; cv.style.height = H + "px";
  DIG.view = {cv, cell, d, t:0, last:0, shake:0, sparks:[]};
  /* le radar : un indice par objet, des le depart */
  const rl = forUpLv("radar");
  DIG.hint = new Set();
  if(rl >= 1) for(const it of DIG.items) DIG.hint.add(it.cells[Math.floor(it.cells.length / 2)]);
  if(rl >= 2) for(const it of DIG.items) if(it.w >= 3) it.cells.filter((_, k)=>k % 3 === 0).forEach(c=>DIG.hint.add(c));
  DIG.rare = rl >= 3;
  cv.addEventListener("pointerdown", e=>{
    const r = cv.getBoundingClientRect();
    const X = Math.floor((e.clientX - r.left) / cell), Y = Math.floor((e.clientY - r.top) / cell);
    if(X < 0 || Y < 0 || X >= WALL_W || Y >= WALL_H) return;
    digTap(X, Y);
  });
  digImg();
  const loop = now => {
    if(!DIG || !DIG.view || !DIG.view.cv.isConnected) return;
    requestAnimationFrame(loop);
    const V = DIG.view, dt = Math.min(80, now - (V.last || now)); V.last = now; V.t += dt;
    digDraw(dt);
  };
  requestAnimationFrame(loop);
  digHud();
}
function digBig(){ return DIG ? DIG.items.filter(i=>!i.small) : []; }
function digTap(X, Y){
  if(!DIG || DIG.over) return;
  const r = digHit(DIG, DIG_TOOL, X, Y);
  if(!r) return;
  const V = DIG.view, cell = V.cell, st = STRATA[DIG.si];
  V.shake = DIG_TOOL === "hammer" ? 7 : 4;
  V.swing = {x:(X + 0.5) * cell, y:(Y + 0.5) * cell, t:V.t, tool:DIG_TOOL};
  for(let k = 0; k < (DIG_TOOL === "hammer" ? 14 : 8); k++)
    V.sparks.push({x:(X + 0.5) * cell, y:(Y + 0.5) * cell, vx:(Math.random() - 0.5) * 0.4, vy:-Math.random() * 0.35, life:0, max:420, c:r.iron ? "#e8eef8" : st.pal[Math.floor(Math.random() * 3)], s:2 + Math.random() * 3});
  if(r.iron){ if(typeof arTone === "function") arTone(1400, .08, "square", .03, 900); buzz(4); }
  else { try { Sfx.click(); } catch(e){} buzz(DIG_TOOL === "hammer" ? 14 : 7); }
  for(const it of r.fresh){
    it.at = V.t;
    const cx = (it.x + it.w / 2) * cell, cy = (it.y + it.h / 2) * cell;
    for(let k = 0; k < 26; k++) V.sparks.push({x:cx, y:cy, vx:(Math.random() - 0.5) * 0.5, vy:(Math.random() - 0.5) * 0.5, life:0, max:700, c:k % 2 ? "#ffd84a" : "#ffffff", s:2 + Math.random() * 2});
    try { Sfx.coin(); } catch(e){}
    if(it.k === "ore"){ const o = oreDef(it.ore); for(let k = 0; k < 10; k++) V.sparks.push({x:cx, y:cy, vx:(Math.random() - 0.5) * 0.35, vy:-Math.random() * 0.4, life:0, max:600, c:o.pal[k % 3], s:2 + Math.random() * 2}); continue; }
    const def = DIG_LOOT.find(l=>l.k === it.k);
    if(def.k !== "page") toast(def.k === "mon" ? `${POKE[it.mon].name} dormait dans la roche !` : `${def.n} !`, "warn", "star");
    /* une page des onze : on la trouve a l'instant ou elle est degagee */
    if(def.k === "page"){
      const fr = FRAGMENTS.find(x=>x.id === it.page);
      if(fr && !(S.fragments || []).includes(fr.id)) setTimeout(()=>fragFound(fr, `Dans une fouille, couche « ${STRATA[DIG.si].n} », à ${fmt(Math.floor(forage().m))} m`), 500);
    }
    if(def.k === "mon"){
      if(typeof momentAwake === "function") setTimeout(()=>momentAwake(it.mon), 350);
      setTimeout(()=>pzFlash(`${POKE[it.mon].name} dormait là depuis la panne. Il a l'air d'avoir bien dormi, lui.`), 3200);
    }
    else if(def.give(0, it).egg && String(def.give(0, it).egg).startsWith("f_")) setTimeout(()=>pzFlash("Un fossile ! Une définition d'avant l'index. Je tremble. Ce sont mes ventilateurs, mais quand même."), 700);
  }
  digHud();
  if(r.over) setTimeout(()=>digEnd(false), r.collapsed ? 700 : 500);
  if(r.collapsed){ V.shake = 16; V.collapse = V.t; buzz([40, 30, 80]); if(typeof arTone === "function") arTone(80, .6, "sawtooth", .07, 30); }
}
function digHud(){
  const s = document.getElementById("dg-stab");
  if(s){ const k = DIG.stab / DIG.max; s.style.width = (k * 100).toFixed(1) + "%"; s.className = k < 0.25 ? "low" : k < 0.5 ? "mid" : ""; }
  const fo = document.getElementById("dg-found"); if(fo) fo.textContent = `${digBig().filter(i=>i.found).length} / ${digBig().length}`;
}
function digDraw(dt){
  const V = DIG.view, cv = V.cv, x = cv.getContext("2d"), c = V.cell, st = STRATA[DIG.si];
  x.setTransform(V.d, 0, 0, V.d, 0, 0); x.imageSmoothingEnabled = false;
  V.shake *= Math.pow(0.82, dt / 16);
  x.save(); x.translate((Math.random() - 0.5) * V.shake, (Math.random() - 0.5) * V.shake);
  /* le fond degage, puis les objets, puis la roche par-dessus */
  x.fillStyle = "#1a120c"; x.fillRect(0, 0, WALL_W * c, WALL_H * c);
  const img = digImg();
  for(const it of DIG.items){
    const X = it.x * c, Y = it.y * c, w = it.w * c, h = it.h * c;
    const glow = it.found ? Math.max(0, 1 - (V.t - it.at) / 900) : 0;
    if(glow > 0){ x.fillStyle = `rgba(255,216,74,${0.35 * glow})`; x.fillRect(X - 3, Y - 3, w + 6, h + 6); }
    if(it.k === "ore"){
      const o = oreDef(it.ore);
      x.fillStyle = o.pal[2]; x.fillRect(X + c * 0.15, Y + c * 0.3, c * 0.7, c * 0.5);
      x.fillStyle = o.pal[1]; x.fillRect(X + c * 0.2, Y + c * 0.2, c * 0.55, c * 0.45);
      x.fillStyle = o.pal[0]; x.fillRect(X + c * 0.3, Y + c * 0.25, c * 0.18, c * 0.14);
      continue;
    }
    if(it.k === "page"){
      x.fillStyle = "#e8d9a8"; x.fillRect(X + 3, Y + 3, w - 6, h - 6);
      x.fillStyle = "#c9b27a"; x.fillRect(X + 3, Y + h - 7, w - 6, 4);
      x.fillStyle = "#7a6a48"; for(let k = 0; k < 4; k++) x.fillRect(X + 8, Y + 8 + k * (h - 16) / 4, w - 16 - (k % 2) * 10, 2);
    } else if(it.k === "mon"){
      let ok = false; const sz = w * 1.05;
      if(typeof brSprite === "function"){ const s = brSprite(it.mon, "n"); if(s){ x.drawImage(s, X + w / 2 - sz / 2, Y + h / 2 - sz / 2, sz, sz); ok = true; } }
      if(!ok){ x.fillStyle = "#5c6a7e"; x.fillRect(X + 4, Y + 4, w - 8, h - 8); }
    } else if(DIG_LOOT.find(l=>l.k === it.k).art && typeof digArtOf === "function"){
      digArtDraw(x, digArtOf(it.k, DIG.si), X + 2, Y + 2, w - 4, h - 4);
    } else {
      const def = DIG_LOOT.find(l=>l.k === it.k), idx = typeof ITEM_IDX !== "undefined" ? ITEM_IDX[def.ic] : undefined;
      if(img && idx !== undefined){
        const cell0 = img.naturalWidth / ITEMS_COLS;
        x.drawImage(img, (idx % ITEMS_COLS) * cell0, Math.floor(idx / ITEMS_COLS) * cell0, cell0, cell0, X, Y, w, h);
      } else { x.fillStyle = "#c9a86a"; x.fillRect(X + 3, Y + 3, w - 6, h - 6); }
    }
  }
  const R = mulberry32(DIG.si * 131 + DIG.items.length);
  for(let i = 0; i < WALL_W * WALL_H; i++){
    const X = (i % WALL_W) * c, Y = Math.floor(i / WALL_W) * c, l = DIG.L[i], n = R();
    if(l >= 99){
      x.fillStyle = "#7c8898"; x.fillRect(X, Y, c, c); x.fillStyle = "#a9b4c2"; x.fillRect(X + 2, Y + 2, c - 4, 3); x.fillStyle = "#5a6474"; x.fillRect(X + 2, Y + c - 4, c - 4, 2);
      continue;
    }
    if(l <= 0) continue;
    /* trois tons de matiere, plus sombres quand la couche est epaisse */
    x.fillStyle = st.pal[Math.min(2, Math.floor((l - 1) / 2))]; x.fillRect(X, Y, c, c);
    x.fillStyle = "rgba(255,255,255,.07)"; x.fillRect(X, Y, c, 2);
    x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(X, Y + c - 2, c, 2);
    if(n < 0.5){ x.fillStyle = "rgba(0,0,0,.16)"; x.fillRect(X + n * c * 0.8, Y + c * 0.4, 3, 2); }
    if(l >= 5){ x.fillStyle = "rgba(0,0,0,.2)"; x.fillRect(X + c * 0.3, Y + c * 0.3, c * 0.4, c * 0.12); }
    if(DIG.hint && DIG.hint.has(i) && Math.sin(V.t / 220 + i) > 0.3){ x.fillStyle = "#ffe9a8"; x.fillRect(X + c / 2 - 1, Y + c / 2 - 1, 3, 3); }
  }
  if(DIG.rare) for(const it of DIG.items){ const def = DIG_LOOT.find(l=>l.k === it.k); if(!it.found && def.rare && Math.sin(V.t / 160 + it.x) > 0.85){ const cc = it.cells[0]; x.fillStyle = "#ffffff"; x.fillRect((cc % WALL_W) * c + c / 2, Math.floor(cc / WALL_W) * c + 3, 2, 2); } }
  const tint = typeof forSite === "function" && forSite().tint;
  if(tint){ x.globalAlpha = 0.16; x.fillStyle = tint; x.fillRect(0, 0, WALL_W * c, WALL_H * c); x.globalAlpha = 1; }
  /* la grille, legere */
  x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 1;
  for(let i = 1; i < WALL_W; i++){ x.beginPath(); x.moveTo(i * c + .5, 0); x.lineTo(i * c + .5, WALL_H * c); x.stroke(); }
  for(let i = 1; i < WALL_H; i++){ x.beginPath(); x.moveTo(0, i * c + .5); x.lineTo(WALL_W * c, i * c + .5); x.stroke(); }
  for(let i = V.sparks.length - 1; i >= 0; i--){
    const p = V.sparks[i]; p.life += dt; if(p.life > p.max){ V.sparks.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0011 * dt;
    x.globalAlpha = 1 - p.life / p.max; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.s, p.s);
  }
  x.globalAlpha = 1;
  /* l'outil qui frappe : on voit sa matiere */
  if(V.swing && typeof toolCanvas === "function"){
    const k = (V.t - V.swing.t) / 200;
    if(k < 1){
      const tc = toolCanvas(V.swing.tool, toolTier(V.swing.tool));
      if(tc){ const sz = c * 2.2; x.save(); x.translate(V.swing.x + c * 0.4, V.swing.y - c * 0.2); x.rotate(-0.9 + k * 1.3); x.globalAlpha = 1 - Math.max(0, k - 0.6) * 2.5; x.drawImage(tc, -sz * 0.15, -sz * 0.85, sz, sz); x.restore(); x.globalAlpha = 1; }
    } else V.swing = null;
  }
  /* l'effondrement : la roche tombe sur tout */
  if(V.collapse){
    const k = Math.min(1, (V.t - V.collapse) / 650);
    x.fillStyle = `rgba(20,14,10,${0.85 * k})`; x.fillRect(0, 0, WALL_W * c, WALL_H * c * k);
  }
  x.restore();
}
function digEnd(left){
  if(!DIG || DIG.ended) return;
  DIG.ended = true;
  const rows = digClaim(DIG);
  const el = document.getElementById("dg-res"); if(!el) return;
  const title = left ? "TU REMONTES" : DIG.collapsed ? "ÇA S'EFFONDRE !" : "TOUT EST DÉGAGÉ !";
  const f = forage();
  el.innerHTML = `<div class="dg-rt ${DIG.collapsed ? "bad" : ""}">${title}</div>
    <div class="tiny muted" style="margin-bottom:8px">${rows.filter(r=>!r.ore).length ? `${rows.filter(r=>!r.ore).length} objet${rows.filter(r=>!r.ore).length > 1 ? "s" : ""} sur ${digBig().length}` : "Aucun objet dégagé à temps."}</div>
    <div class="dg-loot">${rows.map((r, i)=>`<div class="dg-li" style="--d:${i * 140}ms">
      ${r.ore ? oreSvg(r.ore, 30) : r.it.k === "mon" ? sprite(r.it.mon, false, "") : r.def.art && typeof digArtOf === "function" ? digArtSvg(digArtOf(r.it.k, DIG.si), 32) : itemIcon(r.def.ic, 34)}
      <div class="grow"><b>${esc(r.label)}</b><small>${esc(digGainText(r.g))}</small></div></div>`).join("")}</div>
    <div class="dg-rb">
      <button class="btn" data-act="fowallback">Retour au Forage</button>
      ${f.walls ? `<button class="btn pri" data-act="fowallnext">Fouille suivante (${f.walls})</button>` : ""}
    </div>`;
  el.classList.add("on");
  if(rows.length) try { Sfx.win(); } catch(e){}
  /* les caisses s'ouvrent après le bilan, une par une */
  for(const r of rows) if(r.crate && typeof crateShow === "function") crateShow(r.crateTier, r.crate);
  /* un minerai jamais vu : on dit a quoi il sert */
  for(const r of rows) if(r.ore && r.fresh && typeof moment === "function"){
    const o = oreDef(r.ore), i = ORE_IDS.indexOf(r.ore);
    moment({kind:"release", c:o.pal[1], html:oreSvg(r.ore, 64), kicker:"NOUVEAU MINERAI", title:o.n,
      sub:`Il sert à forger des outils ${TOOL_TIERS[i + 1].adj}. Va voir « La Forge », dans le Forage.`});
  }
  if(typeof checkAchievements === "function") checkAchievements();
}
function digGainText(g){
  if(g.ore) return "Minerai, pour la forge";
  if(g.crate !== undefined) return "Une caisse : elle s'ouvre à la sortie";
  if(g.ores){ const o = Object.keys(g.ores)[0]; return `+${g.ores[o]} ${oreDef(o).n.toLowerCase()}` + (g.shards ? ` · +${g.shards} Fragments` : ""); }
  if(g.candy) return `+${g.candy} Bonbons d'équipe`;
  if(g.balls) return Object.keys(g.balls).filter(b=>g.balls[b]).map(b=>`+${g.balls[b]} ${BALLS[b] ? BALLS[b].name : b}`).join(" · ");
  if(g.berries) return Object.keys(g.berries).map(b=>`Baie ${b.charAt(0).toUpperCase() + b.slice(1)}`).join(" · ");
  if(g.integ) return `+${String(g.integ).replace(".", ",")} % d'Intégrité · +${g.shards} Fragments`;
  if(g.shards) return `+${g.shards} Fragments`;
  if(g.cores) return `+${g.cores} Noyau${g.cores > 1 ? "x" : ""}`;
  if(g.coins) return `+${fmt(g.coins)} PokéCoins`;
  if(g.stone) return "Pierre d'évolution, dans ton sac";
  if(g.treasure) return `Trésor : se revend ${fmt(TREASURES[g.treasure].sell)} PokéCoins`;
  if(g.egg) return g.egg.startsWith("f_") ? "Un fossile : il éclora à la couveuse" : "Un œuf pour la couveuse";
  if(g.held) return "Objet tenu";
  if(g.mon) return "Il rejoint ton Pokédex";
  if(g.page) return "Rangée dans le journal, avec les autres pages";
  return "";
}
ACTIONS.fowallback = () => { DIG = null; go("idle"); if(typeof checkStoryTriggers === "function") checkStoryTriggers(); };
ACTIONS.fowallnext = () => { DIG = null; ACTIONS.fowall(); };

/* ---------- l'absence : ils ont creuse sans toi ---------- */
function forageOffline(sec){
  if(typeof moduleUnlocked === "function" && !moduleUnlocked("idle")) return {m:0, e:0, w:0, strata:[]};
  const r = forageAdvance(sec);
  forageQuest(r.e);
  return r;
}

/* ============================================================
   CAPTURE AUTONOME
   L'Energie ne servait qu'a se convertir. Elle lance maintenant des
   sessions de capture automatique, sur le modele du catchbot de
   PokeMeow : elles rapportent des Pokemon, et RIEN d'autre — ni
   PokeCoins, ni chaine, ni quetes. C'est un second idle, oriente
   collection plutot que chiffres.
   ============================================================ */
const BOT_AXES = {
  rate: {n:"Plus de Pokémon par heure", max:10, d:l=>`${4 + 3*l} par heure`},
  cost: {n:"Moins cher",                max:10, d:l=>`coût −${Math.round((1 - Math.pow(0.88, l))*100)} %`},
  dur:  {n:"Plus longtemps",            max:10, d:l=>`${2 + l} h`}
};
function bot(){
  const f = forage();
  f.bot = f.bot || {lv:{rate:0, cost:0, dur:0}, until:0, hours:0, rate:0, claimed:true};
  return f.bot;
}
/* une fois ouverte au Sediment, elle le reste : un recalibrage ne doit pas la cacher */
function botAvailable(){
  if(forage().depth >= 2) S.flags.botOpen = true;
  return !!S.flags.botOpen;
}
function botRate(){ return 4 + 3 * bot().lv.rate; }
function botHours(){ return 2 + bot().lv.dur; }
function botHourCost(){
  return Math.max(400, Math.round(forageRate() * 600 * Math.pow(0.88, bot().lv.cost)));
}
function botUpCost(axis){ return Math.round(6000 * Math.pow(2.6, bot().lv[axis])); }
function botRunning(){ const b = bot(); return b.until > Date.now(); }
function botReady(){ const b = bot(); return !b.claimed && b.until && b.until <= Date.now(); }

ACTIONS.botup = d => {
  const b = bot(), f = forage(), ax = BOT_AXES[d.k];
  if(b.lv[d.k] >= ax.max) return;
  const c = botUpCost(d.k);
  if(f.energy < c){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= c; b.lv[d.k]++;
  Sfx.win(); save(); refresh();
};
ACTIONS.botrun = () => {
  const b = bot(), f = forage();
  if(botRunning() || botReady()) return;
  const cost = botHourCost() * botHours();
  if(f.energy < cost){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= cost;
  b.hours = botHours(); b.rate = botRate();
  b.until = Date.now() + b.hours * 3600 * 1000;
  b.claimed = false;
  Sfx.coin(); toast(`Captures automatiques lancées pour ${b.hours} h`, "", "capture");
  save(); refresh();
};
/* un Pokemon « sauvage » generique : aucun habitat, aucune exclusivite */
function botSpecies(){
  const rar = Math.min(3, rollRarity());
  const pool = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(p && p.rar === rar && !p.leg && !isExclusive(i)) pool.push(i);
    }
  return pool.length ? pick(pool) : 16;
}
ACTIONS.botclaim = () => {
  if(!botReady()) return;
  const b = bot();
  const n = Math.round(b.rate * b.hours);
  let fresh = 0, shinies = 0;
  const got = {};
  for(let i = 0; i < n; i++){
    const id = botSpecies();
    const sh = rng() < 1/1000;                 /* aucune aide de chaine : la session ne fait que capturer */
    DEX_HOW = "absence";
    const isNew = addToDex(id, levelFor(POKE[id].rar), sh);
    if(isNew) fresh++;
    if(sh) shinies++;
    got[id] = (got[id] || 0) + 1;
  }
  b.claimed = true;
  S.stats.botCaught = (S.stats.botCaught || 0) + n;
  save();
  const ids = Object.keys(got).map(Number).sort((a2,b2)=>got[b2]-got[a2]);
  sheet(`<div class="center">
    <div class="h" style="justify-content:center">CAPTURES AUTOMATIQUES</div>
    <div class="tiny muted" style="margin:6px 0 11px">${b.hours} h de session. Les Pokémon rejoignent
      le Pokédex ; ils ne rapportent ni PokéCoins, ni chaîne, ni quêtes.</div>
    <div class="tiles">
      <div class="tile accent"><div class="k">Capturés</div><div class="v">${n}</div></div>
      <div class="tile gold"><div class="k">Nouvelles espèces</div><div class="v">${fresh}</div></div>
      ${shinies ? `<div class="tile"><div class="k">Chromatiques</div><div class="v">${shinies}</div></div>` : ""}
    </div>
    <div class="wrap" style="justify-content:center;margin-top:10px;gap:3px">
      ${ids.slice(0, 24).map(id=>`<span class="sprbox" style="width:30px;height:30px"
        title="${esc(POKE[id].name)} ×${got[id]}">${sprite(id,false,"")}</span>`).join("")}
    </div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Ranger</button>
  </div>`);
  Sfx.win(); checkAchievements();
};
function botPanel(){
  if(!botAvailable()) return `<div class="h sm" style="margin-top:12px">CAPTURES AUTOMATIQUES</div>
    <div class="empty">Se débloque en atteignant la couche « Sédiment » (150 m). Tu pourras alors dépenser
      de l'Énergie pour que des Pokémon soient capturés pendant ton absence.</div>`;
  const b = bot(), f = forage();
  const cost = botHourCost() * botHours();
  let state;
  if(botReady()) state = `<button class="btn pri wide" data-act="botclaim">Récupérer ${Math.round(b.rate*b.hours)} Pokémon</button>`;
  else if(botRunning()) state = `<div class="tiny cy">En cours — encore ${fmtTime(b.until - Date.now())}</div>
      <div class="bar thin" style="margin-top:5px"><i style="width:${Math.min(100,
        (1 - (b.until - Date.now()) / (b.hours*3600*1000)) * 100)}%"></i></div>`;
  else state = `<button class="btn wide ${f.energy>=cost?"pri":""}" data-act="botrun" ${f.energy>=cost?"":"disabled"}>
      Lancer : ${botRate()*botHours()} Pokémon en ${botHours()} h · ${fmt(cost)} Énergie</button>`;
  return `<div class="h sm" style="margin-top:12px">CAPTURES AUTOMATIQUES</div>
    <div class="panel bracket">
      <div class="tiny muted" style="margin-bottom:8px">Des Pokémon sont capturés pour toi pendant quelques heures.
        Ils vont dans ton Pokédex, mais ne rapportent ni PokéCoins ni chaîne.</div>
      ${state}
    </div>
    <div class="list">${Object.entries(BOT_AXES).map(([k,ax])=>{
      const lv = b.lv[k], maxed = lv >= ax.max, c = botUpCost(k);
      return `<div class="item ${maxed?"on":""}">
        <div class="grow"><div class="t">${esc(ax.n)}</div>
          <div class="d">${esc(ax.d(lv))}${maxed?"":` → ${esc(ax.d(lv+1))}`}</div></div>
        ${maxed?`<span class="tiny cy">max</span>`:`<button class="btn sm ${f.energy>=c?"gold":""}"
          data-act="botup" data-k="${k}" ${f.energy>=c?"":"disabled"}>${ic("bolt")} ${fmt(c)}</button>`}
      </div>`;}).join("")}</div>`;
}
