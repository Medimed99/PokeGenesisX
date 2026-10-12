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
   pal:["#8a6a44", "#73573a", "#5c452e"], d:"Le bruit de fond des Pokémon archivés. Une terre tendre, qui cède sous la patte.", mul:1},
  {n:"Couche molle",   need:40,    hard:260,  mat:"Argile",       good:[5, 11, 12],     bad:[10],      c:"#c98a5a",
   pal:["#b0764c", "#94603c", "#784c2f"], d:"Les rêves récents. Collants, lourds, pleins de choses oubliées.", mul:1.8},
  {n:"Sédiment",       need:150,   hard:340,  mat:"Roche",        good:[6, 2, 9],       bad:[3, 7],    c:"#9a9aa6",
   pal:["#8c8c98", "#72727e", "#5a5a66"], d:"Des couches tassées par des années d'inactivité. Il faut des poings, ou de l'acier.", mul:3.2},
  {n:"Veine froide",   need:450,   hard:460,  mat:"Glace",        good:[10, 2, 9],      bad:[12, 3],   c:"#9fe7f0",
   pal:["#a6d8e6", "#7fb8cc", "#5c95ad"], d:"Le premier filon véritable, gelé depuis la panne. Le feu y fait merveille.", mul:6},
  {n:"Socle",          need:1100,  hard:620,  mat:"Pierre dure",  good:[2, 9, 6, 5],    bad:[1, 18],   c:"#c9a86a",
   pal:["#a89270", "#8a7556", "#6c5a40"], d:"De la donnée compactée à un point qu'aucun outil récent ne lit.", mul:11},
  {n:"Nappe chaude",   need:2500,  hard:830,  mat:"Magma",        good:[11, 6, 5],      bad:[12, 7, 15], c:"#ff8a3d",
   pal:["#b8502a", "#8f3a1e", "#682a16"], d:"Ça résiste, ça chauffe, ça rapporte. L'eau refroidit la paroi juste assez.", mul:20},
  {n:"Faille mineure", need:5000,  hard:1100, mat:"Cristal",      good:[13, 14, 9],     bad:[17],      c:"#b06bff",
   pal:["#8e64c8", "#7048a8", "#523486"], d:"Une fracture ancienne, tapissée de cristaux. Ils conduisent l'électricité, et la pensée.", mul:38},
  {n:"Substrat",       need:9000,  hard:1450, mat:"Ossuaire",     good:[8, 17, 2],      bad:[1, 14],   c:"#ff3d7f",
   pal:["#6a4a5a", "#523848", "#3c2836"], d:"Sous les rêves, il y a ce qui rêvait avant. Ici, seuls les spectres sont à l'aise.", mul:70},
  {n:"Noyau onirique", need:16000, hard:1900, mat:"Rêve pur",     good:[14, 16, 18, 8], bad:[],        c:"#ffd24a",
   pal:["#3a3470", "#2c2858", "#1e1c40"], d:"La source. Elle ne finit pas : plus on descend, plus elle se défend.", mul:130}
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
  f.depth = stratumIdx(f.m);          /* compatibilite : l'indice de la strate */
  return f;
}
function stratumIdx(m){ let i = 0; for(let k = 0; k < STRATA.length; k++) if(m >= STRATA[k].need) i = k; return i; }
function stratum(){ return STRATA[stratumIdx(forage().m)]; }
function nextStratum(){ return STRATA[stratumIdx(forage().m) + 1] || null; }
/* au-dela du Noyau, la durete continue de croitre : la descente ne finit jamais */
function stratumHard(m){
  const i = stratumIdx(m), s = STRATA[i];
  if(i < STRATA.length - 1) return s.hard;
  return s.hard * (1 + (m - s.need) / 8000);
}
/* compatibilite avec les anciens appels */
function unlocked(k){ return true; }

/* ---------- la puissance de forage d'un Pokemon ---------- */
function digAff(id, si){
  const p = POKE[id], s = STRATA[si];
  if(!p) return 1;
  if(p.types.some(t=>s.good.includes(t))) return 2;
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
  return crewIds().reduce((a, id)=>a + digPower(id, si), 0) * (1 + f.echoes * 0.03) * (1 + forUpLv("drill") * 0.15);
}
/* metres par seconde a la profondeur m */
function digRate(m){
  const f = forage();
  if(m === undefined) m = f.m;
  return crewPower(stratumIdx(m)) / stratumHard(m);
}
/* Energie par metre : chaque strate vaut davantage */
function energyPerM(si){ return 6 * Math.pow(1.9, si); }
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
const FOR_UPS = {
  slot:  {n:"Galerie supplémentaire", max:FOR_SLOTS_MAX - FOR_START_SLOTS, cost:l=>[1500, 25000, 400000][l],
          d:l=>`${FOR_START_SLOTS + l} Pokémon dans l'équipe de forage`},
  drill: {n:"Rails de wagonnets",      max:8, cost:l=>Math.round(800 * Math.pow(3.2, l)),
          d:l=>`Forage +${15 * l} %`},
  prop:  {n:"Étais",                   max:5, cost:l=>Math.round(600 * Math.pow(3, l)),
          d:l=>`Une paroi tient ${40 + 8 * l} coups`},
  pick:  {n:"Pioche affûtée",          max:3, cost:l=>Math.round(2500 * Math.pow(6, l)),
          d:l=>l ? `la pioche frappe aussi ${["", "plus fort", "les diagonales", "comme un marteau léger"][l]}` : "pioche de base"},
  radar: {n:"Radar de fouille",        max:3, cost:l=>Math.round(5000 * Math.pow(5, l)),
          d:l=>["aucun indice", "un éclat signale chaque objet", "le contour des gros objets", "les objets rares scintillent"][l]},
  cart:  {n:"Réserve de parois",       max:5, cost:l=>Math.round(3000 * Math.pow(3.5, l)),
          d:l=>`${3 + l} parois en attente · hors ligne ${8 + 2 * l} h`},
  lamp:  {n:"Lampe frontale",          max:4, cost:l=>Math.round(9000 * Math.pow(4, l)),
          d:l=>`objets rares ×${(1 + 0.3 * l).toFixed(1)} dans les parois`}
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
      toast("Forage : la réserve de parois est pleine", "warn", "stone");
    FOR_LAST_WALLS = f.walls;
  }
  for(const si of r.strata) forStratumReached(si);
  saveSoon();
}
function forStratumReached(si){
  const s = STRATA[si];
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
  {k:"mon",    ic:null,        w:3, h:3, n:"Pokémon endormi", wt:si=>3.5, rare:1, give:(si, it)=>({mon:it.mon})}
];
function forHoenn(){ return typeof regionUnlocked === "function" && regionUnlocked("hoenn"); }
/* qui dort dans la roche : les types de la strate, des secteurs ouverts, jamais un legendaire */
const DIG_MON_TYPES = [[5, 6], [5, 11, 4], [6, 5, 2], [15, 11], [6, 9, 5], [10, 6, 5], [9, 14, 13], [8, 17, 4], [14, 16, 8]];
function digMonFor(si, rnd){
  const T = DIG_MON_TYPES[Math.min(si, DIG_MON_TYPES.length - 1)], pool = [];
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
  const table = DIG_LOOT.map(l=>[l, l.wt(si) * (l.rare ? lamp : 1)]).filter(x=>x[1] > 0);
  const tot = table.reduce((a, x)=>a + x[1], 0);
  const n = 2 + Math.floor(rnd() * 3) + (si >= 5 && rnd() < 0.4 ? 1 : 0);
  let tries = 0;
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
  const max = 40 + 8 * forUpLv("prop");
  return {si, W, H, L, items, iron, occ, stab:max, max, hits:0, over:false, collapsed:false};
}
/* un coup : pioche ("pick") ou marteau ("hammer") en (x, y) */
function digHit(wall, tool, x, y){
  if(wall.over) return null;
  const W = wall.W, H = wall.H, pl = forUpLv("pick");
  const hits = [];
  const add = (dx, dy, n) => { const X = x + dx, Y = y + dy; if(X >= 0 && Y >= 0 && X < W && Y < H) hits.push([Y * W + X, n]); };
  if(tool === "hammer"){
    add(0, 0, 2); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b])=>add(a, b, 2)); [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a, b])=>add(a, b, 1));
  } else {
    add(0, 0, pl >= 1 ? 3 : 2); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a, b])=>add(a, b, pl >= 3 ? 2 : 1));
    if(pl >= 2) [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a, b])=>add(a, b, 1));
  }
  const ironHit = wall.occ[y * W + x] === -2;
  for(const [c, n] of hits) if(wall.L[c] < 99) wall.L[c] = Math.max(0, wall.L[c] - (ironHit ? 0 : n));
  const cost = tool === "hammer" ? 2 : 1;
  wall.stab = Math.max(0, wall.stab - cost);
  wall.hits++;
  const fresh = [];
  for(const it of wall.items) if(!it.found && it.cells.every(c=>wall.L[c] === 0)){ it.found = true; fresh.push(it); }
  const all = wall.items.every(it=>it.found);
  if(all || wall.stab <= 0){ wall.over = true; wall.collapsed = !all; }
  return {fresh, iron:ironHit, over:wall.over, collapsed:wall.collapsed};
}
/* ce que rapportent les objets degages */
function digClaim(wall){
  const out = [];
  for(const it of wall.items){
    if(!it.found) continue;
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
    if(g.mon){
      const lv = Math.max(5, Math.round(10 + wall.si * 7 + rng() * 6));
      row.isNew = addToDex(g.mon, lv, rng() < 1 / 400);
      row.label = POKE[g.mon].name + (row.isNew ? " — nouvelle espèce !" : "");
    }
    out.push(row);
  }
  const f = forage();
  f.found += out.length; f.wallsDone++;
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
    const every = WALL_SECS, cap = wallCap();
    FOR_SHOWN_WALLS = f.walls;
    return `
      <div class="h">${ic("bolt")} LE FORAGE ${infoBtn("idle")}</div>
      <div class="sub">Tes Pokémon creusent dans les couches du rêve. Ce qu'ils remontent t'attend dans les parois.</div>
      <div class="fo-shaft" id="fo-shaft" style="--sc:${st.c}">
        <canvas id="fo-cv"></canvas>
        <div class="fo-hud">
          <div><b>${esc(st.n)}</b><small>${esc(st.mat)} · ${fmt(Math.floor(f.m))} m</small></div>
          <div class="fo-rate"><b id="fo-rate">${forFmtRate(rate)}</b><small>m / s</small></div>
        </div>
        <div class="fo-good">${st.good.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}
          ${st.bad.length ? `<span class="fo-bad">évitez : ${st.bad.map(t=>TYPE_NAMES[t]).join(", ")}</span>` : ""}</div>
        ${nx ? `<div class="fo-next"><i style="width:${Math.min(100, (f.m - st.need) / (nx.need - st.need) * 100).toFixed(1)}%"></i>
          <span>${esc(nx.n)} à ${fmt(nx.need)} m</span></div>` : `<div class="fo-next deep"><span>Au-delà du Noyau : la roche se durcit sans fin</span></div>`}
      </div>

      <button class="fo-wallbtn ${f.walls ? "ready" : ""}" data-act="fowall" ${f.walls ? "" : "disabled"}>
        <span class="fo-wallic">${itemIcon("dig:hard", 34) || ic("stone")}</span>
        <span class="grow"><b>${f.walls ? `${f.walls} paroi${f.walls > 1 ? "s" : ""} à fouiller` : "Aucune paroi pour l'instant"}</b>
          <small>${f.walls >= cap ? "Réserve pleine : fouille-les, sinon l'équipe passe à côté des suivantes."
            : crew.length ? `Prochaine dans ${Math.max(1, Math.ceil((every - f.wallAt) / 60))} min · réserve ${f.walls}/${cap}` : "Il faut une équipe pour tomber sur des parois."}</small>
          <span class="fo-wbar"><i id="fo-wbar" style="width:${Math.min(100, f.wallAt / every * 100).toFixed(0)}%"></i></span></span>
        ${f.walls ? `<span class="fo-go">FOUILLER</span>` : ""}
      </button>

      <div class="row between" style="margin:12px 0 6px"><div class="h sm" style="margin:0">ÉQUIPE DE FORAGE</div>
        <button class="btn xs" data-act="foauto">${ic("refresh")} Les meilleurs ici</button></div>
      <div class="fo-crew">${Array.from({length:FOR_SLOTS_MAX}, (_, i)=>{
        const id = crew[i];
        if(i >= f.slots) return `<div class="fo-slot locked">${ic("lock")}<small>galerie</small></div>`;
        if(!id) return `<button class="fo-slot empty" data-act="fopick" data-i="${i}"><span>+</span><small>libre</small></button>`;
        const a = digAff(id, si);
        return `<button class="fo-slot" data-act="fopick" data-i="${i}">
          ${sprite(id, S.dex[id].shiny, "")}
          ${a !== 1 ? `<i class="fo-aff ${a > 1 ? "up" : "dn"}">${a > 1 ? "×2" : "×½"}</i>` : ""}
          <small>N.${S.dex[id].lvl} · ${fmt(Math.round(digPower(id, si)))}</small></button>`; }).join("")}</div>
      <div class="tiny dim" style="margin-top:4px">Puissance ${fmt(Math.round(crewPower()))} · dureté ${fmt(Math.round(stratumHard(f.m)))} · les types en vert creusent deux fois plus vite ici.
        ${f.echoes ? ` Échos : +${f.echoes * 3} %.` : ""}</div>

      <div class="row between" style="margin:14px 0 6px"><div class="h sm" style="margin:0">AMÉLIORATIONS</div>
        <span class="pill">${ic("bolt")} <b id="fo-energy">${fmt(Math.floor(f.energy))}</b> Énergie</span></div>
      <div class="list">${Object.entries(FOR_UPS).map(([k, u])=>{
        const lv = forUpLv(k), maxed = lv >= u.max, c = maxed ? 0 : u.cost(lv);
        return `<div class="item ${maxed ? "on" : ""}">
          <div class="perk-lv">${lv}/${u.max}</div>
          <div class="grow"><div class="t">${esc(u.n)}</div>
            <div class="d">${esc(u.d(lv))}${maxed ? "" : ` → ${esc(u.d(lv + 1))}`}</div></div>
          ${maxed ? `<span class="tiny cy">max</span>` : `<button class="btn sm ${f.energy >= c ? "gold" : ""}" data-act="foup" data-k="${k}" ${f.energy >= c ? "" : "disabled"}>${fmt(c)}</button>`}
        </div>`; }).join("")}</div>

      <div class="h sm" style="margin-top:14px">LES STRATES</div>
      <div class="fo-strata">${STRATA.map((s, i)=>{
        const here = i === si, done = f.maxM >= s.need;
        return `<div class="fo-st ${here ? "here" : ""} ${done ? "" : "unk"}" style="--sc:${s.c}">
          <i></i><div class="grow"><b>${done ? esc(s.n) : "???"}</b><small>${fmt(s.need)} m${done ? " · " + esc(s.mat) : ""}</small></div>
          ${done ? `<span class="fo-stt">${s.good.map(t=>`<span class="tdot" style="background:${typeof arCol === "function" ? arCol(t) : "#888"}" title="${TYPE_NAMES[t]}"></span>`).join("")}</span>` : ""}
        </div>`; }).join("")}</div>

      ${botPanel()}

      <div class="h sm" style="margin-top:12px">CONVERTIR L'ÉNERGIE</div>
      <div class="btn-grid c3">
        <button class="btn sm" data-act="forconv" data-k="coins" ${f.energy >= 300 ? "" : "disabled"}>300 → ${fmt(Math.round(100 * (1 + si * 0.6)))} coins</button>
        <button class="btn sm" data-act="forconv" data-k="shards" ${f.energy >= 9000 ? "" : "disabled"}>9 k → ${10 + si * 4} frag.</button>
        <button class="btn sm" data-act="forconv" data-k="cores" ${f.energy >= 260000 ? "" : "disabled"}>260 k → ${1 + Math.floor(si / 4)} noyau</button>
      </div>

      <div class="tiles" style="margin-top:11px">
        <div class="tile accent"><div class="k">Record</div><div class="v">${fmt(Math.floor(f.maxM))} m</div></div>
        <div class="tile gold"><div class="k">Parois fouillées</div><div class="v">${f.wallsDone}</div></div>
        <div class="tile"><div class="k">Trouvailles</div><div class="v">${f.found}</div></div>
        <div class="tile"><div class="k">Hors ligne</div><div class="v">${offlineHours()} h</div></div>
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
  if(!quiet) toast("Équipe de forage composée pour " + STRATA[si].mat.toLowerCase(), "", "check");
}
ACTIONS.foauto = () => { forAutoCrew(); refresh(); };
let FO_PICK = 0;
ACTIONS.fopick = d => {
  FO_PICK = +d.i;
  const f = forage(), si = f.depth, crew = crewIds();
  const ids = Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>digPower(b, si) - digPower(a, si)).slice(0, 60);
  sheet(`${sheetHead("Qui creuse ici ?")}
    <div class="tiny muted" style="margin-bottom:8px">${esc(STRATA[si].mat)} : ${STRATA[si].good.map(t=>TYPE_NAMES[t]).join(", ")} y creusent deux fois plus vite.
      Les plus forts pour cette strate sont en haut.</div>
    ${crew[FO_PICK] ? `<button class="btn ghost wide sm" style="margin-bottom:8px" data-act="foset" data-id="0">Libérer cet emplacement</button>` : ""}
    <div class="fo-pickgrid">${ids.map(id=>{ const a = digAff(id, si), on = crew.includes(id);
      return `<button class="fo-pk ${on ? "on" : ""}" data-act="foset" data-id="${id}">
        ${sprite(id, S.dex[id].shiny, "")}<b>${fmt(Math.round(digPower(id, si)))}</b>
        ${a !== 1 ? `<i class="fo-aff ${a > 1 ? "up" : "dn"}">${a > 1 ? "×2" : "×½"}</i>` : ""}
        <small>N.${S.dex[id].lvl}</small></button>`; }).join("")}</div>`);
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
  if(d.k === "slot"){ f.slots = FOR_START_SLOTS + f.up.slot; toast("Nouvelle galerie : un Pokémon de plus peut creuser", "warn", "check"); }
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
    if(typeof brAnimDraw === "function") ok = brAnimDraw(x, id, "attack", S.dex[id] && S.dex[id].shiny ? "s" : "n", 0, ph, cx, cy, size);
    if(!ok && typeof brPmdDraw === "function") ok = brPmdDraw(x, id, "n", 0, t * 0.6 + i, cx, cy, size);
    if(!ok && typeof brSprite === "function"){ const s = brSprite(id, "n"); if(s) x.drawImage(s, cx - size / 2, cy - size * 0.8, size, size); }
    /* des eclats de matiere, au rythme des coups */
    if(Math.random() < dt / 160) for(let k = 0; k < 3; k++) V.parts.push({x:cx + (Math.random() - 0.5) * 20, y:cy + 6, vx:(Math.random() - 0.5) * 0.12, vy:-0.08 - Math.random() * 0.12, life:0, max:500 + Math.random() * 400, c:st.pal[Math.floor(Math.random() * 3)]});
  });
  if(!crew.length){ x.fillStyle = "rgba(0,0,0,.45)"; x.fillRect(0, top, W, H - top); x.fillStyle = "#e8f0ff"; x.font = '9px "Press Start 2P",monospace'; x.textAlign = "center"; x.fillText("PERSONNE NE CREUSE", W / 2, H / 2 + 20); }
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
      <div class="grow"><small>PAROI · ${esc(st.n.toUpperCase())}</small><b>${DIG.items.length} objets enfouis</b></div>
      <span class="dg-found" id="dg-found">0 / ${DIG.items.length}</span>
    </div>
    <div class="dg-stab"><i id="dg-stab" style="width:100%"></i><span>Stabilité</span></div>
    <div class="dg-wrap" id="dg-wrap"><canvas id="dg-cv"></canvas></div>
    <div class="dg-tools">
      <button class="dg-tool ${DIG_TOOL === "pick" ? "on" : ""}" data-act="fotool" data-t="pick"><b>⛏</b><span>Pioche</span><small>précise · 1</small></button>
      <button class="dg-tool ${DIG_TOOL === "hammer" ? "on" : ""}" data-act="fotool" data-t="hammer"><b>🔨</b><span>Marteau</span><small>large · 2</small></button>
    </div>
    <div class="tiny dim" style="text-align:center;margin-top:6px">Un objet est à toi quand il est entièrement dégagé. Le fer ne cède jamais.</div>
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
function digTap(X, Y){
  if(!DIG || DIG.over) return;
  const r = digHit(DIG, DIG_TOOL, X, Y);
  if(!r) return;
  const V = DIG.view, cell = V.cell, st = STRATA[DIG.si];
  V.shake = DIG_TOOL === "hammer" ? 7 : 4;
  for(let k = 0; k < (DIG_TOOL === "hammer" ? 14 : 8); k++)
    V.sparks.push({x:(X + 0.5) * cell, y:(Y + 0.5) * cell, vx:(Math.random() - 0.5) * 0.4, vy:-Math.random() * 0.35, life:0, max:420, c:r.iron ? "#e8eef8" : st.pal[Math.floor(Math.random() * 3)], s:2 + Math.random() * 3});
  if(r.iron){ if(typeof arTone === "function") arTone(1400, .08, "square", .03, 900); buzz(4); }
  else { try { Sfx.click(); } catch(e){} buzz(DIG_TOOL === "hammer" ? 14 : 7); }
  for(const it of r.fresh){
    it.at = V.t;
    const cx = (it.x + it.w / 2) * cell, cy = (it.y + it.h / 2) * cell;
    for(let k = 0; k < 26; k++) V.sparks.push({x:cx, y:cy, vx:(Math.random() - 0.5) * 0.5, vy:(Math.random() - 0.5) * 0.5, life:0, max:700, c:k % 2 ? "#ffd84a" : "#ffffff", s:2 + Math.random() * 2});
    try { Sfx.coin(); } catch(e){}
    const def = DIG_LOOT.find(l=>l.k === it.k);
    toast(def.k === "mon" ? `${POKE[it.mon].name} dormait dans la roche !` : `${def.n} !`, "warn", "star");
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
  const fo = document.getElementById("dg-found"); if(fo) fo.textContent = `${DIG.items.filter(i=>i.found).length} / ${DIG.items.length}`;
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
    if(it.k === "mon"){
      let ok = false; const sz = w * 1.05;
      if(typeof brSprite === "function"){ const s = brSprite(it.mon, "n"); if(s){ x.drawImage(s, X + w / 2 - sz / 2, Y + h / 2 - sz / 2, sz, sz); ok = true; } }
      if(!ok){ x.fillStyle = "#5c6a7e"; x.fillRect(X + 4, Y + 4, w - 8, h - 8); }
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
  const title = left ? "TU REMONTES" : DIG.collapsed ? "LA PAROI S'EFFONDRE" : "PAROI DÉGAGÉE";
  const f = forage();
  el.innerHTML = `<div class="dg-rt ${DIG.collapsed ? "bad" : ""}">${title}</div>
    <div class="tiny muted" style="margin-bottom:8px">${rows.length ? `${rows.length} objet${rows.length > 1 ? "s" : ""} sur ${DIG.items.length}` : "Rien de dégagé à temps."}</div>
    <div class="dg-loot">${rows.map((r, i)=>`<div class="dg-li" style="--d:${i * 140}ms">
      ${r.it.k === "mon" ? sprite(r.it.mon, false, "") : itemIcon(r.def.ic, 34)}
      <div class="grow"><b>${esc(r.label)}</b><small>${esc(digGainText(r.g))}</small></div></div>`).join("")}</div>
    <div class="dg-rb">
      <button class="btn" data-act="fowallback">Retour au puits</button>
      ${f.walls ? `<button class="btn pri" data-act="fowallnext">Paroi suivante (${f.walls})</button>` : ""}
    </div>`;
  el.classList.add("on");
  if(rows.length) try { Sfx.win(); } catch(e){}
  if(typeof checkAchievements === "function") checkAchievements();
}
function digGainText(g){
  if(g.shards) return `+${g.shards} Fragments`;
  if(g.cores) return `+${g.cores} Noyau${g.cores > 1 ? "x" : ""}`;
  if(g.coins) return `+${fmt(g.coins)} PokéCoins`;
  if(g.stone) return "Pierre d'évolution, rangée dans le sac";
  if(g.treasure) return `Trésor : ${fmt(TREASURES[g.treasure].sell)} PokéCoins à la revente`;
  if(g.egg) return g.egg.startsWith("f_") ? "À ranimer à la couveuse" : "Ébauche pour la couveuse";
  if(g.held) return "Objet tenu";
  if(g.mon) return "Il rejoint ton Pokédex";
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
  rate: {n:"Cadence",  max:10, d:l=>`${4 + 3*l} Pokémon par heure`},
  cost: {n:"Économie", max:10, d:l=>`coût horaire −${Math.round((1 - Math.pow(0.88, l))*100)}%`},
  dur:  {n:"Autonomie",max:10, d:l=>`sessions de ${2 + l} h`}
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
  Sfx.coin(); toast(`Capture autonome lancée pour ${b.hours} h`, "", "capture");
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
    <div class="h" style="justify-content:center">CAPTURE AUTONOME</div>
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
  if(!botAvailable()) return `<div class="h sm" style="margin-top:12px">CAPTURE AUTONOME</div>
    <div class="empty">S'ouvre au Sédiment. L'Énergie pourra alors lancer des sessions de capture
      qui remplissent le Pokédex pendant votre absence.</div>`;
  const b = bot(), f = forage();
  const cost = botHourCost() * botHours();
  let state;
  if(botReady()) state = `<button class="btn pri wide" data-act="botclaim">Récupérer ${Math.round(b.rate*b.hours)} Pokémon</button>`;
  else if(botRunning()) state = `<div class="tiny cy">Session en cours — encore ${fmtTime(b.until - Date.now())}</div>
      <div class="bar thin" style="margin-top:5px"><i style="width:${Math.min(100,
        (1 - (b.until - Date.now()) / (b.hours*3600*1000)) * 100)}%"></i></div>`;
  else state = `<button class="btn wide ${f.energy>=cost?"pri":""}" data-act="botrun" ${f.energy>=cost?"":"disabled"}>
      Lancer ${botHours()} h — ${botRate()*botHours()} Pokémon — ${fmt(cost)} Énergie</button>`;
  return `<div class="h sm" style="margin-top:12px">CAPTURE AUTONOME</div>
    <div class="panel bracket">
      <div class="tiny muted" style="margin-bottom:8px">Elle capture pendant votre absence et ne
        rapporte que des Pokémon. Le coût suit votre production, pour rester un vrai choix.</div>
      ${state}
    </div>
    <div class="list">${Object.entries(BOT_AXES).map(([k,ax])=>{
      const lv = b.lv[k], maxed = lv >= ax.max, c = botUpCost(k);
      return `<div class="item ${maxed?"on":""}">
        <div class="perk-lv">${lv}/${ax.max}</div>
        <div class="grow"><div class="t">${esc(ax.n)}</div>
          <div class="d">${esc(ax.d(lv))}${maxed?"":` → ${esc(ax.d(lv+1))}`}</div></div>
        ${maxed?`<span class="tiny cy">max</span>`:`<button class="btn sm ${f.energy>=c?"gold":""}"
          data-act="botup" data-k="${k}" ${f.energy>=c?"":"disabled"}>${fmt(c)}</button>`}
      </div>`;}).join("")}</div>`;
}
