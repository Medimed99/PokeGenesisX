/* ============================================================
   38b — LA FORGE ET LES CHANTIERS
   En deux jours, un joueur assidu avait tout amélioré. Il manquait
   trois choses au Forage :

   · Des MINERAIS. Cuivre, Fer, Argent, Or, puis la Rêvite du fond
     du rêve. Chaque couche a le sien ; l'équipe en remonte en
     creusant, et les fouilles en cachent dans la roche.
   · Une FORGE. Les outils ne s'achètent plus avec de l'Énergie
     seule : on les forge avec du minerai. Six matières, de la
     pioche en bois à la pioche onirique — et l'outil change de
     couleur à l'écran, dans la fouille comme dans le puits.
   · Des CHANTIERS. D'autres puits s'ouvrent quand le premier est
     assez profond. Chacun repart de zéro, plus dur, avec ses
     trésors : la grotte pour les perles, le cratère pour le feu,
     les ruines pour les fossiles, le pic pour les étoiles.
   ============================================================ */

/* ---------- les minerais ---------- */
const ORES = [
  {id:"cu", n:"Cuivre", pal:["#f6b884", "#c8733a", "#7f421c"], d:"Dans les deux premières couches."},
  {id:"fe", n:"Fer",    pal:["#e4e9ef", "#9aa3ad", "#59616b"], d:"Dans le Sédiment et la Veine froide."},
  {id:"ag", n:"Argent", pal:["#ffffff", "#d3dce7", "#8794a6"], d:"Dans le Socle et la Nappe chaude."},
  {id:"au", n:"Or",     pal:["#fff3b0", "#ffd24a", "#b07d0a"], d:"Dans la Faille mineure et le Substrat."},
  {id:"dr", n:"Rêvite", pal:["#f3d8ff", "#b06bff", "#5d2aa8"], d:"Au Noyau onirique. Ou tombée du ciel, au Pic Météore."}
];
const ORE_IDS = ORES.map(o=>o.id);
const ORE_BY_STRATUM = ["cu", "cu", "fe", "fe", "ag", "ag", "au", "au", "dr"];
const ORE_SECS = 90;           /* l'équipe remonte un minerai toutes les minutes et demie de forage */
function oreDef(id){ return ORES.find(o=>o.id === id); }
function oreOf(si){ return ORE_BY_STRATUM[Math.min(si, ORE_BY_STRATUM.length - 1)]; }
function oreHave(id){ return (forage().ore || {})[id] || 0; }
function oreGain(id, n){
  const f = forage();
  f.ore = f.ore || {};
  f.ore[id] = (f.ore[id] || 0) + n;
  f.oreSeen = f.oreSeen || {};
  if(!f.oreSeen[id]){ f.oreSeen[id] = true; return true; }
  return false;
}
/* une pépite, en pixels : trois tons */
function oreSvg(id, size){
  const o = oreDef(id); if(!o) return "";
  const [L, H, h] = o.pal;
  const g = ["..LLH...", ".LHHHh..", "LHHHHHh.", "HHHLHHhh", ".HHHHhh.", "..hhhh.."];
  return pixSvg(g, {L, H, h}, size || 18, 8, 6);
}

/* ---------- un petit moteur de pixels : une grille, une palette ---------- */
function pixSvg(rows, pal, size, w, h){
  w = w || rows[0].length; h = h || rows.length;
  let r = "";
  rows.forEach((row, y)=>{ for(let x = 0; x < row.length; x++){ const c = pal[row[x]]; if(c) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`; } });
  return `<svg class="pix" viewBox="0 0 ${w} ${h}" width="${size}" height="${Math.round(size * h / w)}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

/* ---------- les outils ---------- */
const TOOL_TIERS = [
  {n:"bois",     adj:"en bois",    pal:["#d8a46a", "#a06b38", "#64401f"], handle:["#a06b38", "#64401f"]},
  {n:"cuivre",   adj:"en cuivre",  pal:ORES[0].pal, handle:["#a06b38", "#64401f"]},
  {n:"fer",      adj:"en fer",     pal:ORES[1].pal, handle:["#8a5a30", "#55361a"]},
  {n:"argent",   adj:"en argent",  pal:ORES[2].pal, handle:["#3d4a66", "#26304a"]},
  {n:"or",       adj:"en or",      pal:ORES[3].pal, handle:["#7a2a2a", "#4a1818"]},
  {n:"onirique", adj:"onirique",   pal:ORES[4].pal, handle:["#2a1a4a", "#170d2c"]}
];
const TOOL_ART = {
  pick:[
    "................", "....hhHHHL......", "...hHHHHHHLL....", "..hHh....HHHL...",
    "..hh......WHHL..", ".h.......Ww.HHL.", "........Ww...HL.", ".......Ww....HH.",
    "......Ww......H.", ".....Ww.......h.", "....Ww..........", "...Ww...........",
    "..Ww............", ".Ww.............", ".w..............", "................"],
  hammer:[
    "................", ".......hL.......", "......hHHL......", ".....hHHHHL.....",
    "....hHHHHHHL....", ".....hHHHHHHL...", "......hHHHHHH...", ".....Ww.hHHHh...",
    "....Ww...hHh....", "...Ww.....h.....", "..Ww............", ".Ww.............",
    "Ww..............", "w...............", "................", "................"],
  drill:[
    "................", "....wwwwwwww....", "...wLHHHHHHhw...", "...wLHHHHHHhw...",
    "....wwwwwwww....", ".....LHHHHh.....", ".....LhHHHh.....", "......LHHh......",
    "......LhHh......", ".......LHh......", ".......Lh.......", ".......Lh.......",
    "........h.......", "................", "................", "................"],
  prop:[
    "................", "LLLLLLLLLLLLLLLL", "HHHHHHHHHHHHHHHH", "hhhhhhhhhhhhhhhh",
    "..LHh......LHh..", "..LHh......LHh..", "..LHh......LHh..", "..LHh......LHh..",
    "..LHh......LHh..", "..LHh......LHh..", "..LHh......LHh..", "..LHh......LHh..",
    "..LHh......LHh..", "..LHh......LHh..", ".hhhhh....hhhhh.", "................"]
};
function toolPal(t){
  const T = TOOL_TIERS[clamp(t || 0, 0, 5)];
  return {L:T.pal[0], H:T.pal[1], h:T.pal[2], W:T.handle[0], w:T.handle[1]};
}
function toolSvg(kind, t, size){
  return `<span class="tool-art tt${t || 0}">${pixSvg(TOOL_ART[kind], toolPal(t), size || 32)}</span>`;
}
/* pour le canvas : une image 16 x 16 par outil et par matière */
const TOOL_CV = {};
function toolCanvas(kind, t){
  const k = kind + t;
  if(TOOL_CV[k]) return TOOL_CV[k];
  if(typeof document === "undefined" || !document.createElement) return null;
  const cv = document.createElement("canvas");
  if(!cv.getContext) return null;
  cv.width = 16; cv.height = 16;
  const x = cv.getContext("2d"), pal = toolPal(t);
  TOOL_ART[kind].forEach((row, y)=>{ for(let i = 0; i < 16; i++){ const c = pal[row[i]]; if(c){ x.fillStyle = c; x.fillRect(i, y, 1, 1); } } });
  return (TOOL_CV[k] = cv);
}

/* ce que fait chaque outil, selon sa matière */
const PICK_T   = [[2, 1, 0], [3, 1, 0], [3, 1, 1], [3, 2, 1], [4, 2, 1], [4, 2, 2]];
const HAMMER_T = [
  {c:2, a:2, d:1, cost:2},   {c:3, a:2, d:1, cost:2},   {c:3, a:2, d:1, cost:1.6},
  {c:3, a:2, d:2, cost:1.6}, {c:4, a:3, d:2, cost:1.4}, {c:4, a:3, d:2, cost:1.2, ring:1}];
const DRILL_T  = [1, 1.3, 1.7, 2.2, 2.9, 3.8];
const TOOLS = {
  pick:  {n:"Pioche",  pl:false, d:t=>{ const [c, a, dg] = PICK_T[t]; return `creuse ${c} couches au centre, ${a} autour${dg ? `, ${dg} en diagonale` : ""}`; }},
  hammer:{n:"Marteau", pl:false, d:t=>{ const H = HAMMER_T[t]; return `frappe ${H.c} au centre, ${H.a} autour${H.ring ? ", et plus loin" : ""} · −${String(H.cost).replace(".", ",")} de solidité par coup`; }},
  drill: {n:"Foreuse", pl:false, d:t=>`ton équipe creuse ×${String(DRILL_T[t]).replace(".", ",")}`},
  prop:  {n:"Étais",   pl:true,  d:t=>`${40 + 8 * t} de solidité par fouille`}
};
const TOOL_IDS = Object.keys(TOOLS);
function toolTier(k){ const f = forage(); return (f.tools && f.tools[k]) || 0; }
function toolName(k, t){ if(t === undefined) t = toolTier(k); return TOOLS[k].n + " " + TOOL_TIERS[t].adj; }
function toolDrillMul(){ return DRILL_T[toolTier("drill")]; }
/* le prix d'une matière : le minerai de cette matière, un peu de la précédente, et de l'Énergie */
function toolCost(t){
  const ore = {};
  ore[ORE_IDS[t - 1]] = [0, 20, 40, 70, 110, 160][t];
  if(t >= 2) ore[ORE_IDS[t - 2]] = [0, 0, 15, 30, 50, 80][t];
  return {ore, energy:Math.round(2500 * Math.pow(6, t - 1))};
}
function toolCanForge(k){
  const t = toolTier(k); if(t >= 5) return false;
  const c = toolCost(t + 1), f = forage();
  if(f.energy < c.energy) return false;
  return Object.keys(c.ore).every(o=>oreHave(o) >= c.ore[o]);
}
ACTIONS.foforge = d => {
  const k = d.k, f = forage();
  if(!TOOLS[k]) return;
  const t = toolTier(k);
  if(t >= 5) return;
  if(!toolCanForge(k)){ toast("Il manque du minerai ou de l'Énergie", "bad", "cross"); return; }
  const c = toolCost(t + 1);
  f.energy -= c.energy;
  for(const o in c.ore) f.ore[o] -= c.ore[o];
  f.tools[k] = t + 1;
  if(k === "drill"){ const V = FOR_VIEW; if(V) V.rocks = forRocks(V.W, V.H); }
  S.stats.forged = (S.stats.forged || 0) + 1;
  save();
  try { Sfx.win(); } catch(e){}
  if(typeof moment === "function") moment({kind:"release", c:TOOL_TIERS[t + 1].pal[1],
    html:toolSvg(k, t + 1, 96),
    kicker:"LA FORGE", title:toolName(k, t + 1), sub:TOOLS[k].d(t + 1),
    line:t + 1 === 5 ? "Un outil fait de rêve. Je ne savais pas qu'on pouvait forger ça. Moi non plus, je ne sais pas comment je le sais." :
         ["", "Du cuivre. Ça brille un peu. C'est un début, {nom}.", "Du fer. Ça, ça ne plie plus.", "De l'argent. La roche recule avant même le coup.", "De l'or. Franchement, on frime un peu. Mais ça marche."][t + 1]}, true);
  refresh();
};

/* ---------- les chantiers ---------- */
const FOR_SITES = [
  {id:"main",   n:"Puits principal", tint:null,      hard:1,   need:0,    cost:0,
   d:"Le premier puits. Toutes les couches, sans préférence.", loot:{}, good:[], ore:null},
  {id:"azur",   n:"Grotte Azurée",   tint:"#4fb2ff", hard:1.6, need:450,  cost:40000,
   d:"Des galeries noyées. Beaucoup de perles, de Pierres Eau, et des Pokémon de l'eau et de la glace.",
   loot:{water:4, pearl:3, bpearl:3, heart:2, helix:2}, good:[11, 15], ore:"ag", mons:[11, 15], tag:"Perles · Pierre Eau · Argent"},
  {id:"ardent", n:"Cratère Ardent",  tint:"#ff6a3d", hard:2.4, need:1100, cost:250000,
   d:"Un volcan éteint, pas tout à fait. Pierres Feu, ambre, et beaucoup d'or dans la roche chaude.",
   loot:{fire:4, amber:3, claw:2, ever:2}, good:[10, 5], ore:"au", mons:[10, 5, 6], tag:"Pierre Feu · Ambre · Or"},
  {id:"ruines", n:"Ruines Oubliées", tint:"#c9a86a", hard:3.4, need:2500, cost:1500000,
   d:"Les restes d'une ville d'avant l'index. Fossiles en pagaille, objets anciens, et des signes sur les murs.",
   loot:{helix:3, dome:3, amber:2, root:3, claw:3, held:3, bone:2}, good:[14, 8], ore:"fe", mons:[14, 8, 6], zarbi:1, tag:"Fossiles · Objets anciens · Zarbi"},
  {id:"pic",    n:"Pic Météore",     tint:"#b06bff", hard:4.8, need:5000, cost:8000000,
   d:"Une montagne frappée par une étoile. Pierres Lune et Soleil, morceaux d'étoile, et de la Rêvite tombée du ciel.",
   loot:{moon:4, sun:3, star:4, dust:3}, good:[18, 14, 6], ore:"dr", mons:[18, 6, 14], tag:"Pierres Lune et Soleil · Étoiles · Rêvite"}
];
function siteDef(id){ return FOR_SITES.find(s=>s.id === id) || FOR_SITES[0]; }
function forSite(){ return siteDef(forage().site || "main"); }
function siteHard(){ return forSite().hard; }
/* la profondeur la plus grande atteinte au puits principal ouvre les chantiers */
function mainMaxM(){
  const f = forage();
  return (f.site || "main") === "main" ? f.maxM : ((f.sites && f.sites.main && f.sites.main.maxM) || 0);
}
function siteOpen(id){ const f = forage(); return id === "main" || !!(f.sitesOpen && f.sitesOpen[id]); }
function siteReachable(id){ return mainMaxM() >= siteDef(id).need; }
function siteDepth(id){
  const f = forage();
  if((f.site || "main") === id) return {m:f.m, maxM:f.maxM};
  const s = (f.sites || {})[id] || {};
  return {m:s.m || 0, maxM:s.maxM || 0};
}
/* changer de chantier : on range la profondeur du puits quitté, on reprend celle du nouveau */
function siteSwitch(id){
  const f = forage(), cur = f.site || "main";
  if(id === cur || !siteOpen(id)) return false;
  f.sites = f.sites || {};
  f.sites[cur] = {m:f.m, maxM:f.maxM};
  const nx = f.sites[id] || {m:0, maxM:0};
  f.site = id; f.m = nx.m || 0; f.maxM = nx.maxM || 0;
  f.depth = stratumIdx(f.m);
  return true;
}
ACTIONS.fosite = d => {
  const S1 = siteDef(d.id), f = forage(), dep = siteDepth(S1.id);
  const open = siteOpen(S1.id), reach = siteReachable(S1.id), here = (f.site || "main") === S1.id;
  const lootTxt = S1.tag ? `<div class="tiny"><b>On y trouve :</b> ${esc(S1.tag)}</div>` : "";
  const goodTxt = S1.good.length ? `<div class="tiny">Ici, ${S1.good.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join(" ")} creusent aussi deux fois plus vite.</div>` : "";
  sheet(`${sheetHead(S1.n)}
    <div class="fo-sitehero" style="--st:${S1.tint || STRATA[0].c}">${forSiteArt(S1, 1)}</div>
    <div class="tiny muted" style="margin:8px 0">${esc(S1.d)}</div>
    ${lootTxt}${goodTxt}
    ${S1.hard > 1 ? `<div class="tiny dim">La roche y est ${String(S1.hard).replace(".", ",")}× plus dure, mais chaque mètre rapporte plus d'Énergie.</div>` : ""}
    ${open ? `<div class="tiny cy" style="margin-top:6px">Profondeur : ${fmt(Math.floor(dep.m))} m · record ${fmt(Math.floor(dep.maxM))} m</div>` : ""}
    <div style="margin-top:12px">${here ? `<div class="tiny gold-t">Ton équipe creuse ici.</div>`
      : open ? `<button class="btn pri wide" data-act="fositego" data-id="${S1.id}">Envoyer l'équipe ici</button>
                <div class="tiny dim" style="margin-top:5px">Le puits quitté garde sa profondeur. Tu pourras y revenir quand tu veux.</div>`
      : reach ? `<button class="btn pri wide" data-act="fositeopen" data-id="${S1.id}" ${f.energy >= S1.cost ? "" : "disabled"}>Ouvrir ce chantier · ${ic("bolt")} ${fmt(S1.cost)}</button>`
      : `<div class="tiny dim">S'ouvre quand le puits principal atteint ${fmt(S1.need)} m (record actuel : ${fmt(Math.floor(mainMaxM()))} m).</div>`}</div>`);
};
ACTIONS.fositeopen = d => {
  const S1 = siteDef(d.id), f = forage();
  if(siteOpen(S1.id) || !siteReachable(S1.id)) return;
  if(f.energy < S1.cost){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= S1.cost;
  f.sitesOpen = f.sitesOpen || {}; f.sitesOpen[S1.id] = true;
  closeSheet();
  if(typeof moment === "function") moment({kind:"door", c:S1.tint || "#35f0d6", icon:"map",
    kicker:"NOUVEAU CHANTIER", title:S1.n, sub:S1.d,
    line:"Un autre puits. Tout recommence à zéro mètre, {nom} — mais la roche n'y cache pas les mêmes choses."}, true);
  save(); refresh();
};
ACTIONS.fositego = d => {
  if(!siteSwitch(d.id)) return;
  forAutoCrew(true);
  closeSheet();
  toast(`L'équipe part pour : ${siteDef(d.id).n}`, "warn", "map");
  save(); refresh();
};
/* une vignette : le chantier en coupe, à sa couleur */
function forSiteArt(S1, big){
  const c = S1.tint || "#a8865a";
  const icon = {main:"⛏", azur:"≈", ardent:"▲", ruines:"Π", pic:"✦"}[S1.id] || "⛏";
  return `<span class="fo-sart ${big ? "big" : ""}" style="--st:${c}"><i></i><i></i><i></i><b>${icon}</b></span>`;
}
function forSitesHtml(){
  const f = forage(), cur = f.site || "main";
  return `<div class="fo-sites">${FOR_SITES.map(S1=>{
    const open = siteOpen(S1.id), reach = siteReachable(S1.id), dep = siteDepth(S1.id);
    const cls = S1.id === cur ? "here" : open ? "open" : reach ? "reach" : "locked";
    return `<button class="fo-site ${cls}" data-act="fosite" data-id="${S1.id}" style="--st:${S1.tint || "#a8865a"}">
      ${forSiteArt(S1)}
      <b>${open || reach ? esc(S1.n) : "???"}</b>
      <small>${S1.id === cur ? "ici · " + fmt(Math.floor(dep.m)) + " m" : open ? fmt(Math.floor(dep.m)) + " m" : reach ? "à ouvrir" : "dès " + fmt(S1.need) + " m"}</small>
    </button>`; }).join("")}</div>`;
}
/* les chantiers qui deviennent accessibles (une seule fois) : renvoyés, l'annonce
   est faite avec la couche qui les a ouverts (38-forage.js, forAnnounceNew) */
function forSitesCheck(){
  const f = forage(), out = [];
  f.sitesSeen = f.sitesSeen || {};
  for(const S1 of FOR_SITES){
    if(S1.id === "main" || f.sitesSeen[S1.id] || !siteReachable(S1.id)) continue;
    f.sitesSeen[S1.id] = true;
    out.push(S1.id);
  }
  return out;
}

/* ---------- la forge, à l'écran ---------- */
function forOreRow(){
  const f = forage(), seen = f.oreSeen || {};
  return `<div class="fo-ores">${ORES.map(o=>{
    const n = oreHave(o.id), known = seen[o.id] || n > 0;
    return `<span class="fo-ore ${known ? "" : "unk"} ${o.id === oreOf(f.depth) ? "here" : ""}" title="${esc(known ? o.n + " — " + o.d : "Minerai inconnu")}">
      ${oreSvg(o.id, 18)}<b>${known ? fmt(n) : "?"}</b><small>${known ? esc(o.n) : "???"}</small></span>`; }).join("")}</div>`;
}
function forForgeHtml(){
  const f = forage();
  return `<div class="tiny dim" style="margin:-2px 0 6px">Ton équipe remonte du <b>${esc(oreDef(oreOf(f.depth)).n.toLowerCase())}</b> dans cette couche, et les fouilles en cachent.
      Le minerai sert à forger de meilleurs outils.</div>
    ${forOreRow()}
    <div class="fo-forge">${TOOL_IDS.map(k=>{
      const t = toolTier(k), max = t >= 5, c = max ? null : toolCost(t + 1), ok = !max && toolCanForge(k);
      return `<div class="fo-tool tt${t}">
        <div class="fo-tart">${toolSvg(k, t, 46)}</div>
        <div class="grow">
          <div class="t"><b>${esc(toolName(k, t))}</b></div>
          <div class="d">${esc(TOOLS[k].d(t))}</div>
          ${max ? `<div class="d gold-t">Matière la plus haute.</div>` : `<div class="d">Ensuite : <b>${esc(TOOL_TIERS[t + 1].n)}</b> — ${esc(TOOLS[k].d(t + 1))}</div>
          <div class="fo-cost">${Object.keys(c.ore).map(o=>`<span class="${oreHave(o) >= c.ore[o] ? "" : "miss"}">${oreSvg(o, 14)} ${fmt(oreHave(o))}/${fmt(c.ore[o])}</span>`).join("")}
            <span class="${f.energy >= c.energy ? "" : "miss"}">${ic("bolt")} ${fmt(c.energy)}</span></div>
          ${Object.keys(c.ore).filter(o=>oreHave(o) < c.ore[o]).slice(0, 1).map(o=>`<div class="d dim">${esc(oreDef(o).n)} : ${esc(typeof srcHint === "function" ? srcHint("ore", o) : "")}</div>`).join("")}`}
        </div>
        ${max ? "" : `<button class="fo-fbtn ${ok ? "ok" : ""}" data-act="foforge" data-k="${k}" ${ok ? "" : "disabled"}>
          <span class="fo-next">${toolSvg(k, t + 1, 26)}</span>Forger</button>`}
      </div>`; }).join("")}</div>`;
}

/* ---------- le décor du puits : ce qu'on a amélioré se voit ---------- */
function forShaftDecor(x, V, W, H, top){
  const f = forage(), t = V.t / 1000;
  /* les étais, des deux côtés, à la matière forgée */
  const pt = toolTier("prop"), pp = toolPal(pt);
  for(const sx of [6, W - 14]){
    x.fillStyle = pp.H; x.fillRect(sx, top, 8, H - top);
    x.fillStyle = pp.L; x.fillRect(sx, top, 2, H - top);
    x.fillStyle = pp.h; x.fillRect(sx + 6, top, 2, H - top);
    for(let yy = top + 30; yy < H; yy += 56){ x.fillStyle = pp.H; x.fillRect(sx < W / 2 ? sx : sx - 14, yy, 22, 5); x.fillStyle = pp.h; x.fillRect(sx < W / 2 ? sx : sx - 14, yy + 4, 22, 1); }
  }
  if(pt >= 5){ x.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3); x.fillStyle = pp.L; x.fillRect(4, top, 12, H - top); x.fillRect(W - 16, top, 12, H - top); x.globalAlpha = 1; }
  /* les lanternes : une par amélioration « Plus d'objets rares » */
  const lamps = forUpLv("lamp");
  for(let i = 0; i < lamps; i++){
    const lx = 26 + i * ((W - 52) / Math.max(1, lamps - 1 || 1)), ly = top + 8;
    const fl = 0.75 + 0.25 * Math.sin(t * 6 + i * 1.7);
    const g = x.createRadialGradient ? x.createRadialGradient(lx, ly + 4, 1, lx, ly + 4, 22) : null;
    if(g){ g.addColorStop(0, `rgba(255,214,120,${0.45 * fl})`); g.addColorStop(1, "rgba(255,214,120,0)"); x.fillStyle = g; x.fillRect(lx - 22, ly - 18, 44, 44); }
    x.fillStyle = "#3a2a1a"; x.fillRect(lx - 1, ly - 8, 2, 6);
    x.fillStyle = "#6a5030"; x.fillRect(lx - 4, ly - 2, 8, 2);
    x.fillStyle = `rgba(255,220,130,${fl})`; x.fillRect(lx - 3, ly, 6, 6);
    x.fillStyle = "#6a5030"; x.fillRect(lx - 4, ly + 6, 8, 2);
  }
  /* la foreuse, au sommet du puits */
  const dc = toolCanvas("drill", toolTier("drill"));
  if(dc){
    const dx = W / 2 - 16, dy = top - 30 + Math.sin(t * 18) * 1.2;
    x.drawImage(dc, dx, dy, 32, 32);
    if(toolTier("drill") >= 3 && Math.random() < 0.3){ x.fillStyle = toolPal(toolTier("drill")).L; x.fillRect(W / 2 + (Math.random() - 0.5) * 10, top + 2, 2, 2); }
  }
  /* le détecteur : une antenne qui clignote */
  const rl = forUpLv("radar");
  if(rl){
    const ax = W / 2 + 44, ay = top - 30;
    x.fillStyle = "#8a96a8"; x.fillRect(ax, ay + 6, 2, 16); x.fillRect(ax - 6, ay + 4, 14, 2);
    for(let i = 0; i < rl; i++){ const on = Math.sin(t * 4 - i) > 0; x.fillStyle = on ? "#5ce07a" : "#2a5a3a"; x.fillRect(ax - 8 + i * 6, ay, 4, 3); }
  }
  /* les wagonnets : un par fouille en réserve, pleins quand une fouille attend */
  const cap = wallCap();
  for(let i = 0; i < cap; i++){
    const cx = 22 + i * 22, cy = top - 13, full = i < f.walls;
    x.fillStyle = "#4a3a2a"; x.fillRect(cx, cy, 18, 9);
    x.fillStyle = "#6a5440"; x.fillRect(cx, cy, 18, 2);
    x.fillStyle = "#20160e"; x.fillRect(cx + 3, cy + 9, 4, 3); x.fillRect(cx + 11, cy + 9, 4, 3);
    if(full){ const o = oreDef(oreOf(f.depth)); x.fillStyle = o.pal[1]; x.fillRect(cx + 2, cy - 4, 14, 5); x.fillStyle = o.pal[0]; x.fillRect(cx + 4, cy - 5, 4, 2); }
  }
}
/* la pioche que chaque Pokémon tient, à côté de lui */
function forCrewTool(x, cx, cy, size, ph){
  const pc = toolCanvas("pick", toolTier("pick"));
  if(!pc) return;
  const a = -0.9 + Math.abs(Math.sin(ph * Math.PI)) * 1.3;
  x.save(); x.translate(cx + size * 0.32, cy - size * 0.1); x.rotate(a);
  x.drawImage(pc, -4, -16, 20, 20);
  x.restore();
}
