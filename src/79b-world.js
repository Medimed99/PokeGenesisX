/* ============================================================
   43 — LE MONDE
   L'accueil était une liste de cartes. C'est maintenant un lieu :
   la région, vue d'en haut, en pixel art — le Centre Pokémon, les
   hautes herbes, la mine du Forage, la porte de l'Expédition, la
   Tour, la Salle de jeu, le lac, la faille de la Brèche — et ton
   partenaire qui s'y promène.

   Le monde est abîmé. Les CHANTIERS DE RESTAURATION le réparent,
   un lieu après l'autre ; ils se paient avec ce que rapportent
   TOUTES les activités (PokéCoins, Fragments, minerai du Forage,
   Noyaux) et demandent souvent d'avoir avancé ailleurs. Chaque
   chantier change le dessin. Le dernier restaure le cœur de la
   région : une statue de son légendaire, une grande scène, un
   chapitre qui se ferme.

   Les CHAPITRES racontent cette progression : un carton-titre
   à chaque étape, et l'en-tête de l'accueil dit où l'on en est.
   ============================================================ */

/* ---------- les lieux : position sur la carte (en %), activité ---------- */
const WORLD_SPOTS = {
  gate:  {x:16, y:17, n:"Porte de la route", s:"Route",   go:"expedition", mod:"expedition"},
  mine:  {x:80, y:15, n:"La mine", s:"Mine",             go:"idle",       mod:"idle"},
  rift:  {x:50, y:8,  n:"La faille", s:"Brèche",           go:"breche",     mod:"breche"},
  forest:{x:12, y:46, n:"La forêt", s:"Forêt",            go:"dex"},
  pc:    {x:38, y:40, n:"Centre Pokémon", s:"Centre",      go:"eggs",       mod:"eggs", alt:"pokebox"},
  heart: {x:58, y:50, n:"Le cœur", s:"Cœur",             go:"@heart"},
  tower: {x:85, y:44, n:"La Tour", s:"Tour",             go:"tower",      mod:"tower"},
  grass: {x:30, y:66, n:"Hautes herbes", s:"Herbes",       go:"capture"},
  lake:  {x:14, y:80, n:"Le lac", s:"Lac",              go:"@fish"},
  bridge:{x:54, y:72, n:"Le pont", s:"Pont"},
  hall:  {x:82, y:78, n:"Salle de jeu", s:"Jeu",        go:"poker",      mod:"poker"}
};
const WORLD_REGIONS = {
  kanto:{grass:["#78c850", "#70c048", "#80cc58"], dark:"#4f9a3c", tree:["#2f6a2a", "#3f8a36"], water:"#58a8e8", sand:"#e8d8a0", roof:"#e05048", sky:"#9fd8f8", mult:1,
    names:{pc:"Centre Pokémon de Jadielle", grass:"Route 1", mine:"Mont Sélénite", lake:"Lac d'Azuria", gate:"Porte de Bourg Palette", tower:"Tour Pokémon",
           forest:"Forêt de Jade", hall:"Salle de jeu de Céladopole", bridge:"Pont Pépite", heart:"Le cœur de Kanto"}},
  johto:{grass:["#8cc060", "#84b858", "#94c868"], dark:"#5e9a40", tree:["#a8502a", "#d87a34"], water:"#4f98d8", sand:"#e0c890", roof:"#b04ad0", sky:"#f8c890", mult:3,
    names:{pc:"Centre Pokémon d'Écorcia", grass:"Route 29", mine:"Caves Jumelles", lake:"Lac Colère", gate:"Porte de Bourg Geon", tower:"Tour Cendrée",
           forest:"Bois aux Chênes", hall:"Salle de jeu de Doublonville", bridge:"Pont d'Oliville", heart:"Le cœur de Johto"}},
  hoenn:{grass:["#68c890", "#60c088", "#70d098"], dark:"#3f9a68", tree:["#1f7a4a", "#2f9a5a"], water:"#38b8e8", sand:"#f4e4a8", roof:"#3a8ae0", sky:"#a8e8f8", mult:9,
    names:{pc:"Centre Pokémon de Clémenti-Ville", grass:"Route 101", mine:"Grotte Granite", lake:"Lac Rivegauche", gate:"Porte de Bourg-en-Vol", tower:"Pilier Céleste",
           forest:"Forêt de Mérouville", hall:"Salle de jeu de Lavandia", bridge:"Pont Cyclable", heart:"Le cœur de Hoenn"}}
};

/* ---------- les chantiers ----------
   spot : le lieu qu'il répare ; cost : base, multipliée par la région ;
   need : ce qu'il faut avoir fait ailleurs (texte + test). */
const WORLD_PROJECTS = [
  {spot:"pc",     v:"Réindexer",   cost:{coins:1500}, need:[]},
  {spot:"grass",  v:"Recompiler",    cost:{coins:3000, shards:15}, need:[["10 espèces de la région au Pokédex", r=>dexCount(r) >= 10]]},
  {spot:"mine",   v:"Réindexer",     cost:{coins:5000, ore:{cu:12}}, need:[["Le Forage ouvert", ()=>moduleUnlocked("idle")]]},
  {spot:"lake",   v:"Purger",   cost:{coins:7000, shards:35}, need:[["5 Pokémon pêchés", ()=>(S.stats.fish || 0) >= 5]]},
  {spot:"gate",   v:"Rétablir l'accès —",    cost:{coins:9000, shards:40}, need:[["Une Expédition réussie", ()=>(S.stats.expWins || 0) >= 1]]},
  {spot:"tower",  v:"Reconstruire",    cost:{coins:13000, shards:60}, need:[["5 victoires dans la Tour", ()=>((typeof sqState === "function" && sqState().clears) || 0) >= 5]]},
  {spot:"forest", v:"Retexturer",  cost:{coins:18000, ore:{fe:15}}, need:[["40 espèces de la région au Pokédex", r=>dexCount(r) >= 40]]},
  {spot:"hall",   v:"Relancer",    cost:{coins:24000, cores:2}, need:[["Le Poké-Poker ouvert", ()=>moduleUnlocked("poker")]]},
  {spot:"bridge", v:"Relier",    cost:{coins:32000, shards:100, ore:{ag:10}}, need:[["Niveau d'Archiviste 20", ()=>S.level >= 20]]},
  {spot:"heart",  v:"Réindexer",  cost:{coins:45000, cores:5}, need:[["Les neuf autres zones réindexées", (r, w)=>w.done.length >= 9], ["70 espèces de la région au Pokédex", r=>dexCount(r) >= 70]]}
];
function worldState(){
  S.world = S.world || {};
  const W = S.world;
  W.reg = W.reg || {};
  for(const r of REGIONS) W.reg[r.key] = W.reg[r.key] || {done:[]};
  W.view = W.view && W.reg[W.view] ? W.view : "kanto";
  return W;
}
function worldReg(key){ return worldState().reg[key]; }
function projOf(region, i){
  const P = WORLD_PROJECTS[i], R = WORLD_REGIONS[region], m = R.mult;
  const cost = {};
  for(const k in P.cost){
    if(k === "ore"){ cost.ore = {}; for(const o in P.cost.ore){ const idx = Math.min(4, ORE_IDS.indexOf(o) + (m >= 9 ? 2 : m >= 3 ? 1 : 0)); cost.ore[ORE_IDS[idx]] = Math.round(P.cost.ore[o] * (m >= 3 ? 1.5 : 1)); } }
    else cost[k] = Math.round(P.cost[k] * (k === "cores" ? Math.sqrt(m) : m));
  }
  return {i, spot:P.spot, n:P.v.endsWith("—") ? `${P.v} ${R.names[P.spot]}` : `${P.v} — ${R.names[P.spot]}`, cost, need:P.need, region};
}
function projDone(region, i){ return worldReg(region).done.includes(i); }
function projNeedOk(p){ const w = worldReg(p.region); return p.need.every(([, f])=>f(p.region, w)); }
function projMissing(p){ const w = worldReg(p.region); return p.need.filter(([, f])=>!f(p.region, w)).map(([t])=>t); }
function projCanPay(p){
  const c = p.cost;
  if(c.coins && S.coins < c.coins) return false;
  if(c.shards && S.shards < c.shards) return false;
  if(c.cores && S.cores < c.cores) return false;
  if(c.ore) for(const o in c.ore) if(typeof oreHave !== "function" || oreHave(o) < c.ore[o]) return false;
  return true;
}
/* ce qui manque pour payer, et où le trouver */
function projMissingSrc(p){
  const c = p.cost, out = [];
  if(c.coins && S.coins < c.coins) out.push("PokéCoins — " + srcHint("coins"));
  if(c.shards && S.shards < c.shards) out.push("Fragments — " + srcHint("shards"));
  if(c.cores && S.cores < c.cores) out.push("Noyaux — " + srcHint("cores"));
  if(c.ore) for(const o in c.ore) if(typeof oreHave !== "function" || oreHave(o) < c.ore[o]) out.push(oreDef(o).n + " — " + srcHint("ore", o));
  return out.join(" · ");
}
function projCostHtml(p){
  const c = p.cost, out = [];
  const chip = (ok, html) => `<span class="wp-c ${ok ? "" : "miss"}">${html}</span>`;
  if(c.coins) out.push(chip(S.coins >= c.coins, `${ic("coin")} ${fmt(c.coins)}`));
  if(c.shards) out.push(chip(S.shards >= c.shards, `${ic("shard")} ${fmt(c.shards)}`));
  if(c.cores) out.push(chip(S.cores >= c.cores, `${ic("core")} ${c.cores}`));
  if(c.ore) for(const o in c.ore) out.push(chip(typeof oreHave === "function" && oreHave(o) >= c.ore[o], `${typeof oreSvg === "function" ? oreSvg(o, 13) : ""} ${c.ore[o]} ${esc(oreDef(o).n.toLowerCase())}`));
  return out.join("");
}
function worldPct(region){ return worldReg(region).done.length / WORLD_PROJECTS.length; }
function worldTotalDone(){ return REGIONS.reduce((a, r)=>a + worldReg(r.key).done.length, 0); }
/* le prochain chantier, dans l'ordre : on les fait un par un, c'est plus lisible */
function worldNextProj(region){
  for(let i = 0; i < WORLD_PROJECTS.length; i++) if(!projDone(region, i)) return projOf(region, i);
  return null;
}
ACTIONS.worldbuild = d => {
  const region = d.r || worldState().view, i = +d.i, p = projOf(region, i);
  if(projDone(region, i)) return;
  if(!projNeedOk(p)){ toast("Il faut d'abord : " + projMissing(p).join(", "), "bad", "lock"); return; }
  if(!projCanPay(p)){ toast("Il manque des ressources", "bad", "cross"); return; }
  const c = p.cost;
  if(c.coins) pay("coins", c.coins);
  if(c.shards) S.shards -= c.shards;
  if(c.cores) S.cores -= c.cores;
  if(c.ore) for(const o in c.ore) forage().ore[o] -= c.ore[o];
  worldReg(region).done.push(i);
  const heart = p.spot === "heart";
  addIntegrity(heart ? 3 : 0.8);
  addXp(Math.round((heart ? 3000 : 400) * Math.sqrt(WORLD_REGIONS[region].mult)));
  if(typeof teamCandyGain === "function") teamCandyGain(heart ? 15 : 3);
  if(heart && typeof grantCardV === "function"){
    const core = (regionDef(region).guardians.find(g=>g.core) || {}).id;
    if(core){ const s = rollCardSeries(core, 3); grantCardV(s, core); }
    gain("cores", 3);
  }
  S.stats.restored = (S.stats.restored || 0) + 1;
  save();
  WORLD_ANIM = {spot:p.spot, t:Date.now(), region};
  try { if(typeof Music !== "undefined") Music.jingle("j_restauration"); } catch(e){}
  closeSheet && closeSheet();
  if(currentScreen !== "modules") go("modules"); else refresh();
  const R = WORLD_REGIONS[region];
  setTimeout(()=>{
    if(typeof moment === "function") moment(heart ? {kind:"release", c:"#ffd24a", spr:(regionDef(region).guardians.find(g=>g.core) || {}).id,
        kicker:"RÉGION RÉINDEXÉE", title:R.names.heart + " bat à nouveau", sub:`${regionDef(region).name} est entièrement réindexée. +3 Noyaux, une carte de son gardien, et 15 Bonbons d'équipe.`,
        line:"Plus une ligne illisible dans tout le secteur. Ce qui le rongeait a reculé, {nom}. Pas disparu. Reculé.", dur:7000}
      : {kind:"door", c:"#5ce07a", icon:"check", kicker:"SECTEUR RÉINDEXÉ · " + worldReg(region).done.length + " / " + WORLD_PROJECTS.length,
        title:R.names[p.spot], sub:WORLD_RESTORED_LINES[p.spot] || "La zone est réindexée.", dur:3600}, true);
    worldChapterCheck();
  }, 1300);
};
const WORLD_RESTORED_LINES = {
  pc:"Le Centre Pokémon répond de nouveau. Son index pointe enfin quelque part.",
  grass:"Les hautes herbes sont recompilées. Des signatures y bougent à nouveau.",
  mine:"L'entrée de la mine est réindexée. L'équipe de forage descendra sur des données saines.",
  lake:"Le lac est purgé. Plus une ligne illisible dans l'eau.",
  gate:"L'accès à la route est rétabli. Les expéditions partiront d'ici.",
  tower:"La Tour se recompose, étage par étage, adresse par adresse.",
  forest:"Les textures de la forêt sont revenues. Elle a ses couleurs d'origine.",
  hall:"La Salle de jeu est relancée. Les cartes sont rangées dans le bon ordre.",
  bridge:"Le pont relie les deux rives. Les deux moitiés du fichier se parlent."
};

/* ============================================================
   LES CHAPITRES
   ============================================================ */
const CHAPTERS = [
  {id:"c0", n:"Prologue — L'Archiviste", d:"Un système qui se réveille, une archive vide.", ok:()=>true},
  {id:"c1", n:"Chapitre 1 — Kanto en ruine", d:"Le premier secteur tient à peine. Il faut le reconstruire.", ok:()=>S.level >= 5},
  {id:"c2", n:"Chapitre 2 — Les gardiens de Kanto", d:"Kanto se relève. Ses gardiens attendent au sommet de la Tour.", ok:()=>worldReg("kanto").done.length >= 5},
  {id:"c3", n:"Chapitre 3 — Le cœur de Kanto", d:"Il ne manque plus que le cœur.", ok:()=>worldReg("kanto").done.length >= 9},
  {id:"c4", n:"Chapitre 4 — Johto, la couche héritée", d:"Écrite par-dessus Kanto, jamais nettoyée.", ok:()=>regionUnlocked("johto") && projDone("kanto", 9)},
  {id:"c5", n:"Chapitre 5 — Les cendres de Johto", d:"La moitié de Johto respire. L'autre attend.", ok:()=>worldReg("johto").done.length >= 5},
  {id:"c6", n:"Chapitre 6 — Hoenn, l'extension instable", d:"Le système y a improvisé sa propre géographie.", ok:()=>regionUnlocked("hoenn") && projDone("johto", 9)},
  {id:"c7", n:"Chapitre 7 — Le ciel de Hoenn", d:"Quelque chose veille, tout là-haut.", ok:()=>worldReg("hoenn").done.length >= 5},
  {id:"c8", n:"Épilogue — Le monde entier", d:"Trois secteurs debout. L'archive est pleine de vie.", ok:()=>projDone("hoenn", 9)}
];
function chapterIdx(){ let k = 0; CHAPTERS.forEach((c, i)=>{ try { if(c.ok()) k = i; } catch(e){} }); return k; }
function worldChapterCheck(){
  const W = worldState(), k = chapterIdx();
  if(W.chap === undefined){ W.chap = k; return; }   /* une partie existante : pas de carton rétroactif */
  if(k > W.chap){
    W.chap = k; save();
    const c = CHAPTERS[k];
    try { if(typeof Music !== "undefined") Music.jingle("j_chapitre"); } catch(e){}
    if(typeof moment === "function") moment({kind:"door", c:"#ffd24a", kicker:"NOUVEAU CHAPITRE", title:c.n, sub:c.d, dur:5200,
      quote:k === 8 ? "Je n'ai plus rien à réparer. Je crois que je vais juste regarder, un moment." : null});
  }
}

/* ============================================================
   LA CARTE DE L'ARCHIVE
   La région n'est pas un paysage : c'est un fichier. On la voit
   telle que l'archive la stocke, tuile par tuile.

   · Ce qui est RÉINDEXÉ s'affiche dans le rendu d'origine de sa
     couche : Kanto en quatre teintes vertes (le premier fichier
     écrit), Johto en couleurs limitées (la couche héritée), Hoenn
     en rendu étendu (l'extension).
   · Ce qui est DÉSINDEXÉ n'est plus que des données : blocs de
     bits, tuiles mal adressées, lignes déchirées, en noir, blanc,
     magenta et cyan — les couleurs de la faille.
   · Quelque chose rôde dans les zones les plus abîmées. On ne le
     nomme pas : l'archive elle-même ne sait plus ce que c'est.
   · Réindexer un lieu le redécode sous nos yeux, de proche en
     proche, à partir de son centre.
   ============================================================ */
let WORLD_ANIM = null;
const WORLD_H = 384;
const WT = 8;   /* une tuile : 8 x 8 pixels de l'archive, affichés en 16 x 16 */

/* les palettes de rendu, par couche et par matière (de la plus claire à la plus sombre) */
const DMG = ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"];
const WORLD_PAL = {
  kanto:{grass:DMG, path:DMG, water:DMG, tree:DMG, rock:DMG, roof:DMG, wall:DMG, wood:DMG, gold:DMG, label:"RENDU MONOCHROME · 4 TEINTES"},
  johto:{grass:["#e0f8c8", "#98d878", "#488848", "#183818"], path:["#f8f0c8", "#e0c890", "#a08050", "#402818"],
         water:["#c8e8f8", "#70b0e8", "#3060a8", "#102048"], tree:["#c8e890", "#e08838", "#a04820", "#381808"],
         rock:["#e8e0d0", "#b0a090", "#706050", "#302820"], roof:["#f8c8b0", "#d86848", "#983020", "#401008"],
         wall:["#f8f8f0", "#d0c8b8", "#888070", "#302820"], wood:["#f0d0a0", "#c08850", "#805030", "#382010"],
         gold:["#fff8c8", "#f8d048", "#b08818", "#403008"], label:"RENDU COULEUR · 56 TEINTES"},
  hoenn:{grass:["#d8fff0", "#78e0a8", "#30a070", "#0c4830"], path:["#fff8e0", "#f0dca0", "#c0a060", "#584020"],
         water:["#d8f8ff", "#60c8f8", "#2080d0", "#0c3070"], tree:["#b0f0a0", "#40b868", "#187840", "#063018"],
         rock:["#f0f0f8", "#b8c0d0", "#707890", "#282c40"], roof:["#d8e8ff", "#5890f0", "#2858b8", "#0c2050"],
         wall:["#ffffff", "#e0e8f0", "#98a8b8", "#303848"], wood:["#f8e0b8", "#d8a060", "#986030", "#402010"],
         gold:["#fffcd8", "#ffe060", "#d0a020", "#504010"], label:"RENDU ÉTENDU · 32 768 TEINTES"}
};
/* l'étendue (en tuiles) que chaque lieu « possède » : désindexée tant qu'il ne l'est pas */
const SPOT_RADIUS = {pc:3.2, grass:3.2, mine:3.6, lake:3.4, gate:2.8, tower:3, forest:3.6, hall:3, bridge:2.6, heart:2.6, rift:2.4};

/* ---------- le plan de la région : une grille de tuiles ---------- */
function worldGrid(cols, rows, region){
  const g = [], rnd = mulberry32(region.length * 977 + 11);
  for(let y = 0; y < rows; y++){ g.push([]); for(let x = 0; x < cols; x++) g[y].push({t:"grass", v:rnd()}); }
  const at = k => [Math.round(WORLD_SPOTS[k].x / 100 * cols), Math.round(WORLD_SPOTS[k].y / 100 * rows)];
  const set = (x, y, t, extra) => { if(y >= 0 && y < rows && x >= 0 && x < cols) Object.assign(g[y][x], {t}, extra || {}); };
  /* la bordure : des arbres, comme toutes les cartes de cette époque */
  for(let x = 0; x < cols; x++){ set(x, 0, "tree"); set(x, rows - 1, "tree"); }
  for(let y = 0; y < rows; y++){ set(0, y, "tree"); set(cols - 1, y, "tree"); }
  /* la rivière */
  const [bx, by] = at("bridge");
  for(let y = 0; y < rows; y++){ const cx = Math.round(bx + Math.sin(y / 3.2) * 1.2 + (y - by) * 0.12); set(cx, y, "water"); set(cx + 1, y, "water"); }
  /* le lac */
  const [lx, ly] = at("lake");
  for(let y = -2; y <= 2; y++) for(let x = -3; x <= 3; x++) if(x * x / 10 + y * y / 4.4 <= 1) set(lx + x, ly + y, "water");
  /* les chemins, du Centre vers chaque lieu (après l'eau : un chemin sur la rivière devient un pont) */
  const [px0, py0] = at("pc");
  for(const k of ["grass", "gate", "tower", "hall", "mine", "heart", "bridge", "forest"]){
    const [tx, ty] = at(k);
    let x = px0, y = py0 + 1;
    for(let s = 0; s < 80 && (x !== tx || y !== ty); s++){
      if(g[y] && g[y][x] && g[y][x].t === "water") set(x, y, "bridge", {spot:"bridge"}); else set(x, y, "path");
      if(Math.abs(tx - x) > Math.abs(ty - y)) x += Math.sign(tx - x); else y += Math.sign(ty - y);
    }
  }
  /* la forêt : des arbres serrés */
  const [fx, fy] = at("forest");
  for(let y = -3; y <= 3; y++) for(let x = -2; x <= 2; x++) if(rnd() < 0.85 && x * x + y * y * 0.6 <= 7) set(fx + x, fy + y, "tree");
  /* les hautes herbes */
  const [gx, gy] = at("grass");
  for(let y = -1; y <= 1; y++) for(let x = -2; x <= 2; x++) set(gx + x, gy + y, "tall");
  /* la montagne, et l'entrée de la mine */
  const [mx, my] = at("mine");
  for(let y = -2; y <= 1; y++) for(let x = -3 + Math.max(0, -y - 1); x <= 3 - Math.max(0, -y - 1); x++) set(mx + x, my + y, "rock");
  set(mx, my + 1, "cave");
  /* les bâtiments : chaque lieu a son empreinte */
  const block = (k, w, h, t) => { const [x0, y0] = at(k); for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) set(x0 - Math.floor(w / 2) + x, y0 - h + 1 + y, t, {bx:x, by:y, bw:w, bh:h}); };
  block("pc", 4, 3, "pc"); block("hall", 4, 3, "hall"); block("gate", 3, 2, "gate"); block("tower", 2, 4, "tower"); block("heart", 2, 2, "heart");
  return g;
}

/* ---------- dessiner une tuile ---------- */
function wTile(px, X, Y, c, pal, v, done){
  const P = pal, R = mulberry32(Math.floor(v * 1e6));
  const fill = (m, s) => px(P[m][s], X, Y, WT, WT);
  const dot = (m, s, x, y, w, h) => px(P[m][s], X + x, Y + y, w || 1, h || 1);
  switch(c.t){
    case "grass": fill("grass", 1); if(v < 0.5){ dot("grass", 2, 2, 3); dot("grass", 2, 5, 6); } if(v > 0.85){ dot("grass", 0, 3, 1, 2, 1); } break;
    case "path":  fill("path", 0); dot("path", 1, 1, 6); dot("path", 1, 6, 2); break;
    case "tall":  fill("grass", 1); for(const [a, b] of [[0, 1], [4, 1], [2, 5], [6, 5]]){ dot("grass", 3, a, b + 1, 1, 2); dot("grass", 3, a + 2, b + 1, 1, 2); dot("grass", 2, a + 1, b, 1, 3); } break;
    case "water": fill("water", 2); { const o = Math.floor(v * 4); dot("water", 1, o, 2, 3, 1); dot("water", 0, o + 1, 2); dot("water", 1, (o + 4) % 6, 6, 3, 1); } break;
    case "tree":  fill("grass", 1); dot("tree", 3, 1, 0, 6, 6); dot("tree", 2, 2, 1, 4, 4); dot("tree", 1, 3, 1, 2, 2); dot("wood", 3, 3, 6, 2, 2); break;
    case "rock":  fill("rock", 1); dot("rock", 2, 0, 7, 8, 1); dot("rock", 2, 2 + Math.floor(v * 3), 2, 1, 4); dot("rock", 0, 1, 1, 2, 1); break;
    case "cave":  fill("rock", 1); dot("rock", 3, 1, 1, 6, 7); if(done){ dot("wood", 2, 0, 0, 1, 8); dot("wood", 2, 7, 0, 1, 8); dot("wood", 1, 0, 0, 8, 1); dot("gold", 1, 3, 4, 2, 2); } break;
    case "bridge":fill("water", 2); if(done){ dot("wood", 1, 0, 1, 8, 6); for(let i = 0; i < 8; i += 2) dot("wood", 3, i, 1, 1, 6); dot("wood", 2, 0, 0, 8, 1); dot("wood", 2, 0, 7, 8, 1); } else { dot("wood", 2, 0, 3, 2, 2); dot("wood", 2, 6, 4, 2, 2); } break;
    default: {
      /* les bâtiments, en tuiles : toit, mur, porte selon la position dans l'empreinte */
      const top = c.by === 0, bottom = c.by === c.bh - 1, mid = c.bx === Math.floor(c.bw / 2) || (c.bw % 2 === 0 && c.bx === c.bw / 2 - 1);
      if(c.t === "tower"){
        fill("wall", 1); dot("wall", 0, 0, 0, 2, 8); dot("wall", 3, 7, 0, 1, 8);
        if(c.by % 2 === 0) dot(done ? "gold" : "wall", done ? 1 : 3, 3, 2, 2, 3);
        if(top){ dot("roof", 2, 0, 0, 8, 2); if(done && c.bx === 0) dot("gold", 1, 7, 0, 2, 2); }
        if(bottom && done) dot("wall", 3, 3, 4, 2, 4);
        break;
      }
      if(c.t === "heart"){
        fill("grass", 1);
        if(bottom){ dot("rock", 2, 0, 3, 8, 5); dot("rock", 0, 0, 3, 8, 1); }
        break;
      }
      const roof = c.t === "hall" ? "gold" : c.t === "gate" ? "wood" : "roof";
      if(top){ fill(roof, 2); dot(roof, 1, 0, 1, 8, 2); dot(roof, 3, 0, 7, 8, 1); }
      else { fill("wall", 0); dot("wall", 2, 0, 7, 8, 1); dot("wall", 1, 0, 0, 1, 8);
        if(bottom && mid) dot("wall", 3, 2, 2, 4, 6);
        else if(!bottom) dot("water", 1, 2, 2, 4, 3); }
      if(c.t === "pc" && top && mid) { dot("wall", 0, 2, 2, 4, 4); dot("roof", 3, 3, 3, 2, 2); }   /* l'enseigne */
      if(c.t === "hall" && !top && !bottom) for(let i = 0; i < 4; i++) dot(["roof", "gold", "water", "grass"][i], 1, 1 + i * 2 - 1 + 1, 5, 1, 2);
    }
  }
}
/* ---------- une tuile désindexée ---------- */
const GLITCH = ["#08070f", "#7e7a9a", "#b8346a", "#2a9a8c", "#4a3480", "#1c1830", "#2a2440"];
/* une zone désindexée garde sa forme, mais plus ses couleurs : les données sont là, illisibles */
const GHOST4 = ["#4a4560", "#38334c", "#26223a", "#171424"];
const GHOST_PAL = {grass:GHOST4, path:GHOST4, water:GHOST4, tree:GHOST4, rock:GHOST4, roof:GHOST4, wall:GHOST4, wood:GHOST4, gold:GHOST4};
function wGlitch(px, X, Y, v, t, pal){
  const R = mulberry32(Math.floor(v * 1e6) + t * 7919);
  const kind = Math.floor(R() * 5);
  if(kind === 0){
    /* des bits, ligne par ligne : la signature de la faille */
    const on = R() < 0.3 ? GLITCH[1] : GLITCH[6];
    for(let y = 0; y < WT; y++){ const row = Math.floor(R() * 256); for(let x = 0; x < WT; x++) px((row >> x) & 1 ? on : GLITCH[0], X + x, Y + y); }
  } else if(kind === 1){
    /* la moitié en L : une tuile coupée en deux */
    px(GLITCH[5], X, Y, WT, WT); px(GLITCH[R() < 0.5 ? 2 : 3], X, Y, WT, 4); px(GLITCH[R() < 0.5 ? 1 : 6], X, Y + 4, 4, 4);
  } else if(kind === 2){
    /* une tuile mal adressée, aux couleurs inversées */
    const P = pal.water || DMG;
    px(P[3], X, Y, WT, WT); px(P[0], X + 1, Y + Math.floor(R() * 6), 6, 1); px(P[1], X + Math.floor(R() * 5), Y + 2, 2, 4);
  } else if(kind === 3){
    /* des bandes : la mémoire relue de travers */
    for(let y = 0; y < WT; y += 2) px(GLITCH[R() < 0.35 ? 2 + Math.floor(R() * 2) : 4 + Math.floor(R() * 3)], X, Y + y, WT, 1), px(GLITCH[0], X, Y + y + 1, WT, 1);
  } else {
    px(GLITCH[0], X, Y, WT, WT);
    for(let i = 0; i < 6; i++) px(GLITCH[1 + Math.floor(R() * 4)], X + Math.floor(R() * 7), Y + Math.floor(R() * 7), 1 + Math.floor(R() * 3), 1);
  }
}

/* ---------- la carte ---------- */
function worldPaint(cv, region){
  if(!cv || typeof cv.getContext !== "function") return;
  const scr = typeof document !== "undefined" && document.getElementById ? document.getElementById("screen") : null;
  const cssW = Math.max(260, Math.min(560, Math.round(((scr && scr.clientWidth) || 384) - 26)));
  const cols = Math.max(16, Math.floor(cssW / 16)), rows = Math.floor(WORLD_H / 16);
  const W = cols * WT, H = rows * WT;
  cv.width = W; cv.height = H; cv.style.height = (rows * 16) + "px"; cv.style.width = (cols * 16) + "px";
  const pal = WORLD_PAL[region] || WORLD_PAL.kanto;
  const grid = worldGrid(cols, rows, region);
  const doneIdx = worldReg(region).done, doneSet = new Set(doneIdx.map(i=>WORLD_PROJECTS[i].spot));
  const pct = worldPct(region);
  /* à qui appartient chaque tuile : le lieu le plus proche, s'il est assez près */
  const spots = Object.keys(WORLD_SPOTS).filter(k=>k !== "rift" || moduleUnlocked("breche"));
  const owner = [];
  for(let y = 0; y < rows; y++){ owner.push([]); for(let x = 0; x < cols; x++){
    let best = null, bd = 1e9;
    for(const k of spots){ const s = WORLD_SPOTS[k], dx = x - s.x / 100 * cols, dy = y - s.y / 100 * rows, d = Math.hypot(dx, dy); if(d < (SPOT_RADIUS[k] || 3) && d < bd){ bd = d; best = k; } }
    owner[y].push({k:best, d:bd});
  } }
  cv._world = {region, cols, rows, grid, owner, doneSet, pct, pal, t:0};
  worldFrame(cv);
}
/* une image : les tuiles saines, puis par-dessus ce qui reste désindexé (et qui bouge) */
function worldFrame(cv){
  const M = cv._world; if(!M) return;
  const x = cv.getContext("2d"), px = (c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(X, Y, w || 1, h || 1); };
  const {cols, rows, grid, owner, doneSet, pct, pal} = M;
  M.t++;
  /* le redécodage d'un lieu tout juste réindexé : de proche en proche, depuis son centre */
  const anim = WORLD_ANIM && WORLD_ANIM.region === M.region ? WORLD_ANIM : null;
  const wave = anim ? (Date.now() - anim.t) / 1800 * 6 : 99;
  const rnd = mulberry32(M.t * 131 + 7);
  const noise = (1 - pct) * 0.05;
  for(let y = 0; y < rows; y++) for(let xx = 0; xx < cols; xx++){
    const c = grid[y][xx], o = owner[y][xx], X = xx * WT, Y = y * WT;
    const spot = c.spot || o.k;
    let bad = false;
    if(o.k === "rift") bad = c.v < 0.8;                                   /* la faille ne se répare pas */
    else if(spot && !doneSet.has(spot)) bad = c.v < 0.92;
    else if(spot && anim && anim.spot === spot && o.d > wave) bad = true;
    else if(c.v > 1 - noise) bad = true;                                  /* un peu de bruit partout, tant que la région n'est pas finie */
    if(bad){
      /* la plupart des tuiles sont seulement éteintes ; une sur quatre est franchement illisible,
         et seules quelques-unes changent d'une image à l'autre : ça respire, ça ne clignote pas */
      const loud = (c.v * 7.3) % 1 < 0.24 || o.k === "rift";
      if(loud){
        if(c._g === undefined || rnd() < 0.025) c._g = Math.floor(rnd() * 1e6);
        wGlitch(px, X, Y, c.v, c._g, pal);
      } else wTile(px, X, Y, c, GHOST_PAL, c.v, false);
    } else wTile(px, X, Y, c, pal, c.v, !spot || doneSet.has(spot));
  }
  /* des lignes déchirées dans les zones abîmées */
  const tears = rnd() < 0.35 ? Math.round((1 - pct) * 2) : 0;
  for(let i = 0; i < tears; i++){
    const y = Math.floor(rnd() * rows * WT), sh = rnd() < 0.5 ? -2 : 2;
    if(!sh) continue;
    try { const img = x.getImageData(0, y, cols * WT, 1); x.putImageData(img, sh, y); } catch(e){}
  }
}
let WORLD_FRAME_T = null;
function worldAnimStart(){
  clearInterval(WORLD_FRAME_T);
  WORLD_FRAME_T = setInterval(()=>{
    const cv = document.getElementById("wd-cv");
    if(!cv || !cv.isConnected){ clearInterval(WORLD_FRAME_T); return; }
    if(document.hidden) return;
    worldFrame(cv);
  }, 380);
}

/* ---------- ce qui rôde : jamais nommé, toujours dans une zone illisible ---------- */
let WORLD_LURK_T = null;
function worldLurk(){
  clearInterval(WORLD_LURK_T);
  const move = () => {
    const el = document.getElementById("wd-lurk");
    if(!el){ clearInterval(WORLD_LURK_T); return; }
    const region = worldState().view, done = new Set(worldReg(region).done.map(i=>WORLD_PROJECTS[i].spot));
    const bad = Object.keys(WORLD_SPOTS).filter(k=>k !== "rift" && WORLD_PROJECTS.some(p=>p.spot === k) && !done.has(k));
    if(!bad.length){ el.remove(); return; }
    const k = pick(bad), s = WORLD_SPOTS[k];
    el.classList.add("blink");
    setTimeout(()=>{ el.style.left = (s.x + (rng() - 0.5) * 8) + "%"; el.style.top = (s.y + (rng() - 0.5) * 6) + "%"; el.classList.remove("blink"); }, 260);
  };
  move();
  WORLD_LURK_T = setInterval(move, 7000);
}

/* ---------- le partenaire se promène ---------- */
let WORLD_WALK = null;
function worldWalkStart(){
  clearInterval(WORLD_WALK);
  const el = document.getElementById("wd-partner"); if(!el) return;
  const spots = Object.keys(WORLD_SPOTS).filter(k=>k !== "rift" && k !== "lake");
  let cur = "pc";
  const step = () => {
    const el2 = document.getElementById("wd-partner");
    if(!el2){ clearInterval(WORLD_WALK); return; }
    const nx = pick(spots.filter(k=>k !== cur));
    const a = WORLD_SPOTS[cur], b = WORLD_SPOTS[nx];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    /* huit directions : 0 bas, 2 droite, 4 haut, 6 gauche */
    const dir = (Math.round((Math.PI / 2 - ang) / (Math.PI / 4)) % 8 + 8) % 8;
    const cv = el2.querySelector("canvas");
    if(cv){ cv.dataset.walk = "1"; cv.dataset.dir = dir; }
    el2.style.left = (b.x + 4) + "%"; el2.style.top = (b.y + 6) + "%";
    cur = nx;
    setTimeout(()=>{ const c2 = el2.querySelector("canvas"); if(c2){ c2.dataset.walk = "0"; c2.dataset.dir = 0; } }, 3200);
  };
  setTimeout(step, 800);
  WORLD_WALK = setInterval(step, 6500);
}

/* ---------- les bulles : ce qui attend, sur chaque lieu ---------- */
function worldBadge(k){
  try {
    if(k === "mine" && moduleUnlocked("idle")){ const f = forage(); if(f.walls) return f.walls >= wallCap() ? "!" : String(f.walls); }
    if(k === "pc"){
      if(moduleUnlocked("eggs")){ const e = eggState(); const r = (e.inc || []).filter(x=>x && EGG_TIERS[x.tier] && (x.steps || 0) >= EGG_TIERS[x.tier].steps).length; if(r) return String(r); }
      if(moduleUnlocked("pokebox") && canOpenBox()) return "★";
    }
    if(k === "gate" && S.expedition) return "…";
    if(k === "tower" && typeof sqLockReady === "function" && sqLockReady()) return "!";
    if(k === "heart"){ const p = worldNextProj(worldState().view); if(p && projNeedOk(p) && projCanPay(p)) return "⚒"; }
  } catch(e){}
  return "";
}
function spotOpen(k){ const s = WORLD_SPOTS[k]; return !s.mod || moduleUnlocked(s.mod) || (s.alt && moduleUnlocked(s.alt)); }
ACTIONS.worldspot = d => {
  const k = d.k, s = WORLD_SPOTS[k], region = worldState().view, R = WORLD_REGIONS[region];
  if(!s) return;
  if(s.go === "@heart" || !s.go){ ACTIONS.worldprojects(); return; }
  if(s.go === "@fish"){ S.capMode = "fish"; go("capture"); return; }
  if(!spotOpen(k)){
    const m = typeof moduleMissing === "function" ? moduleMissing(s.mod) : [];
    toast(`${R.names[k] || s.n} : ${m.length ? "il reste " + m.join(" · ") : "pas encore ouvert"}`, "", "lock"); return;
  }
  if(k === "pc" && !moduleUnlocked("eggs")){ go("pokebox"); return; }
  if(k === "grass") S.capMode = "classic";
  go(s.go);
};
ACTIONS.worldview = d => { worldState().view = d.r; save(); refresh(); };
ACTIONS.worldprojects = () => {
  const region = worldState().view, R = WORLD_REGIONS[region];
  const rows = WORLD_PROJECTS.map((_, i)=>{
    const p = projOf(region, i), dn = projDone(region, i), nOk = projNeedOk(p), pay = projCanPay(p);
    const prevDone = i === 0 || projDone(region, i - 1);
    return `<div class="wp-row ${dn ? "done" : ""} ${!prevDone && !dn ? "later" : ""}">
      <span class="wp-ic">${dn ? ic("check") : (i + 1)}</span>
      <div class="grow"><b>${esc(p.n)}</b>
        ${dn ? `<div class="tiny ok">Réindexé</div>` : `<div class="wp-cost">${projCostHtml(p)}</div>
        ${nOk ? "" : `<div class="tiny bad">Il faut : ${esc(projMissing(p).join(" · "))}</div>`}
        ${nOk && !pay && prevDone ? `<div class="tiny dim">Où trouver : ${esc(projMissingSrc(p))}</div>` : ""}`}</div>
      ${dn || !prevDone ? "" : `<button class="btn sm ${nOk && pay ? "gold" : ""}" data-act="worldbuild" data-r="${region}" data-i="${i}" ${nOk && pay ? "" : "disabled"}>Réindexer</button>`}
    </div>`; }).join("");
  sheet(`${sheetHead("Réindexation — " + regionDef(region).name)}
    <div class="tiny muted" style="margin-bottom:8px">Chaque zone réindexée retrouve son rendu d'origine sur la carte. Elles se font dans l'ordre et se paient avec ce que rapportent toutes les activités.
      La dernière réindexe le cœur de la région : une carte de son gardien, 3 Noyaux et 15 Bonbons d'équipe.</div>
    ${rows}`);
};

/* ============================================================
   L'ACCUEIL
   ============================================================ */
const _OLD_MODULES = SCREENS.modules;
SCREENS.modules = {
  after(host){
    const cv = document.getElementById("wd-cv"), map = document.querySelector(".wd-map");
    if(cv){
      /* la carte prend la largeur exacte de ses tuiles : les lieux tombent juste */
      if(map) map.style.width = "";
      worldPaint(cv, worldState().view);
      if(map){ map.style.width = cv.style.width; }
      worldAnimStart();
      worldLurk();
    }
    worldWalkStart();
    if(typeof pmdWake === "function") pmdWake();
    worldChapterCheck();
    if(WORLD_ANIM && Date.now() - WORLD_ANIM.t < 4000){
      const sp = document.querySelector(`.wd-spot[data-k="${WORLD_ANIM.spot}"]`);
      if(sp){ sp.classList.add("just"); }
    }
  },
  html(){
    const W = worldState(), region = W.view, R = WORLD_REGIONS[region], reg = regionDef(region);
    const ch = CHAPTERS[chapterIdx()], dn = worldReg(region).done.length, next = worldNextProj(region);
    const lead = typeof teamIds === "function" ? teamIds()[0] : S.team[0];
    const core = (reg.guardians.find(g=>g.core) || {}).id;
    const open = REGIONS.filter(r=>regionUnlocked(r.key));
    return `
      <div class="wd-head">
        <div class="grow"><small>${esc(ch.n.split(" — ")[0].toUpperCase())}</small><b>${esc(ch.n.split(" — ")[1] || ch.n)}</b></div>
        ${open.length > 1 ? `<div class="wd-regs">${open.map(r=>`<button class="chip ${r.key === region ? "on" : ""}" data-act="worldview" data-r="${r.key}">${esc(r.name)}</button>`).join("")}</div>` : ""}
      </div>
      <div class="wd-frame">
        <div class="wd-hud top"><span>ARCHIVE › SECTEUR ${esc(reg.name.toUpperCase())}</span><span>${esc((WORLD_PAL[region] || WORLD_PAL.kanto).label)}</span></div>
        <div class="wd-map">
          <canvas id="wd-cv"></canvas>
          ${Object.entries(WORLD_SPOTS).map(([k, s])=>{
            if(k === "rift" && !moduleUnlocked("breche")) return "";
            const op = spotOpen(k), b = worldBadge(k), ok = k === "rift" ? false : !WORLD_PROJECTS.some((p, i)=>p.spot === k) || worldReg(region).done.some(i=>WORLD_PROJECTS[i].spot === k);
            const name = s.s || s.n;
            return `<button class="wd-spot ${op ? "" : "locked"} ${ok ? "ok" : "bad"} ${k}" data-act="worldspot" data-k="${k}" style="left:${s.x}%;top:${s.y}%">
              <span class="wd-lbl">${op ? "" : ic("lock")}${esc(ok || k === "rift" ? name : name.replace(/[a-zA-Zéèêàçôûîœ]/g, (m, i)=>((i + dn) % 3 ? m : "▒")))}</span>${b ? `<i class="wd-b">${esc(b)}</i>` : ""}</button>`; }).join("")}
          ${projDone(region, 9) && core ? `<span class="wd-statue" style="left:${WORLD_SPOTS.heart.x}%;top:${WORLD_SPOTS.heart.y}%">${sprite(core, false, "")}</span>` : ""}
          ${dn < WORLD_PROJECTS.length ? `<span class="wd-lurk" id="wd-lurk" style="opacity:${(0.25 + 0.55 * (1 - dn / WORLD_PROJECTS.length)).toFixed(2)}"><img src="${MISSING_SPRITE}" alt=""></span>` : ""}
          ${lead ? `<span class="wd-partner" id="wd-partner" style="left:${WORLD_SPOTS.pc.x + 4}%;top:${WORLD_SPOTS.pc.y + 6}%">${typeof pmdCanvas === "function" ? pmdCanvas(lead, 0, 40, {shiny:S.dex[lead] && S.dex[lead].shiny}) : sprite(lead, false, "")}</span>` : ""}
          <i class="wd-scan"></i>
        </div>
        <div class="wd-hud bot"><span>INDEX ${Math.round(dn / WORLD_PROJECTS.length * 100)} %</span><span>${WORLD_PROJECTS.length - dn ? `${WORLD_PROJECTS.length - dn} ZONE${WORLD_PROJECTS.length - dn > 1 ? "S" : ""} ILLISIBLE${WORLD_PROJECTS.length - dn > 1 ? "S" : ""}` : "SECTEUR SAIN"}</span></div>
      </div>
      <div class="wd-rest" data-act="worldprojects">
        <div class="row between"><b>Réindexation de ${esc(reg.name)}</b><span class="mono-num">${dn} / ${WORLD_PROJECTS.length}</span></div>
        <div class="bar"><i style="width:${(dn / WORLD_PROJECTS.length * 100).toFixed(0)}%"></i></div>
        ${next ? `<div class="wd-next"><span class="grow"><small>PROCHAINE ZONE À RÉINDEXER</small><b>${esc(next.n)}</b>
            <span class="wp-cost">${projCostHtml(next)}</span>
            ${projNeedOk(next) ? "" : `<em class="bad">Il faut : ${esc(projMissing(next).join(" · "))}</em>`}</span>
          ${projNeedOk(next) && projCanPay(next) ? `<button class="btn sm gold" data-act="worldbuild" data-r="${region}" data-i="${next.i}">Réindexer</button>` : ic("arrow")}</div>`
          : `<div class="tiny gold-t" style="margin-top:6px">${esc(reg.name)} est entièrement réindexée.</div>`}
      </div>
      ${typeof legendCardHtml === "function" ? legendCardHtml() : ""}
      ${typeof raidCardHtml === "function" ? raidCardHtml() : ""}
      ${_OLD_MODULES.html.call(this)}`;
  }
};

/* ---------- prochaine étape : un chantier payable ---------- */
if(typeof NEXTSTEP_HOOKS !== "undefined") NEXTSTEP_HOOKS.push(()=>{
  for(const r of REGIONS){
    if(!regionUnlocked(r.key)) continue;
    const p = worldNextProj(r.key);
    if(p && projNeedOk(p) && projCanPay(p)) return {p:68, t:`Réindexer : ${p.n.split(" — ")[1] || p.n}`, go:"modules", i:"check"};
  }
  return null;
});
