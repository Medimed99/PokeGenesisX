/* ============================================================
   51m — LA CARTE D'EXPÉDITION, FAÇON POKÉLIKE
   Un terrain en pixel art peint une fois par secteur (prairie,
   forêt, grotte, plage, neige, volcan, puis la faille), des
   sentiers en pointillés, et sur chaque nœud ce qu'on y trouvera :
   un dresseur dont le visage dit le type, des hautes herbes, une
   Poké Ball, un sac, un Centre Pokémon, une Boutique, un « ? ».
   Au fond, derrière la grille, la silhouette du Champion.
   ============================================================ */

/* ---------- géométrie : la même pour le dessin et pour les nœuds ---------- */
const XMAP = {ROW_H: 92, TOP: 132, CHAMP_GAP: 118, BOT: 64};
function xmapGeom(run){
  const n = run.map.length, lattice = n - 1;
  const Y = y => y < lattice ? XMAP.TOP + y * XMAP.ROW_H : XMAP.TOP + (lattice - 1) * XMAP.ROW_H + XMAP.CHAMP_GAP;
  const H = Y(n - 1) + XMAP.BOT;
  const X = c => ((c + 0.5) / EXP_COLS) * 100;
  return {X, Y, H, n};
}

/* ---------- palettes des décors ---------- */
const XBIOME = {
  prairie:{g:["#78c850","#70c048","#80cc58"], b:"#5aa83c", e:"#5fae45", f:["#f8e060","#ffffff","#f08080"], wall:["#e8e0b8","#cfc497","#a39770"], deco:"bush"},
  foret:  {g:["#4f9a3c","#4a9238","#57a243"], b:"#2f6e24", e:"#3b7f2e", f:["#f8e060","#c8f0a0"], wall:["#7a5a3a","#64472c","#45301c"], deco:"tree"},
  grotte: {g:["#b08860","#a98158","#b78f67"], b:"#7d5c3e", e:"#94704c", f:["#d8c0a0"], wall:["#8a6a4a","#6e5236","#4a3622"], deco:"rock"},
  plage:  {g:["#ecdca4","#e4d398","#f2e3b0"], b:"#c8b478", e:"#dccb8c", f:["#ffffff","#f0a0a0"], wall:["#f4f0e0","#d8d0b8","#a8a088"], deco:"palm", water:"#58a8e8"},
  neige:  {g:["#eaf2fa","#e0eaf4","#f4f8fc"], b:"#a8c0d8", e:"#d2e0ee", f:["#ffffff","#b8d8f8"], wall:["#c8d8e8","#a8bccf","#7890a8"], deco:"pine"},
  volcan: {g:["#6a4a3a","#614435","#735141"], b:"#3e2a20", e:"#5a3e30", f:["#ff8a3d","#ffc857"], wall:["#4a3228","#3a261e","#26180f"], deco:"lava"},
  centrale:{g:["#8a8f99","#838892","#91969f"], b:"#5c616b", e:"#6e737c", f:["#ffe45e","#58a8e8"], wall:["#5c616b","#474b54","#2e3138"], deco:"rock"},
  faille: {g:["#1d1432","#22173a","#191029"], b:"#4a2a7a", e:"#2a1a46", f:["#ff3d7f","#35f0d6"], wall:["#2a1a46","#1d1232","#0e0818"], deco:"glitch"}
};

/* ---------- le terrain, peint une fois ---------- */
function xmapPaint(cv, run){
  if(!cv || typeof cv.getContext !== "function") return;
  const G = xmapGeom(run), cssW = Math.max(240, Math.round((cv.parentElement && cv.parentElement.clientWidth) || 360));
  const W = Math.round(cssW / 2), H = Math.round(G.H / 2);
  if(cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
  cv.style.height = G.H + "px";
  const x = cv.getContext("2d"), B = XBIOME[run.biome] || XBIOME.prairie;
  const R = mulberry32((run.seed || 1) + (run.mapIdx || 0) * 977);
  const px = (c, X0, Y0, w, h) => { x.fillStyle = c; x.fillRect(X0, Y0, w || 1, h || 1); };
  /* le sol : de grands carreaux a peine differents, comme une route de Kanto */
  for(let yy = 0; yy < H; yy += 8) for(let xx = 0; xx < W; xx += 8) px(B.g[Math.floor(R() * B.g.length)], xx, yy, 8, 8);
  /* la bordure plus sombre */
  px(B.e, 0, 0, 10, H); px(B.e, W - 4, 0, 4, H);
  /* les brins */
  for(let i = 0; i < W * H / 55; i++){
    const X0 = Math.floor(R() * W), Y0 = Math.floor(R() * H);
    if(B.deco === "glitch"){ if(R() < 0.25) px(R() < 0.5 ? "#3a1f66" : "#2b1650", X0, Y0, 2 + Math.floor(R() * 6), 1); continue; }
    if(B.deco === "rock" || B.deco === "lava"){ px(B.b, X0, Y0, 2, 1); continue; }
    if(B.deco === "palm"){ if(R() < 0.6) px(B.b, X0, Y0, 1, 1); continue; }
    px(B.b, X0, Y0); px(B.b, X0 + 1, Y0 - 1); px(B.b, X0 + 2, Y0);
  }
  /* ou il ne faut rien poser : les noeuds et leur voisinage */
  const nodes = [];
  run.map.forEach((row, y) => row.forEach(n => nodes.push([G.X(n.c) / 100 * W, G.Y(y) / 2])));
  const free = (X0, Y0, d) => nodes.every(([a, b]) => Math.hypot(a - X0, b - Y0) > d) && Y0 > XMAP.TOP / 2 - 10 && Y0 < H - 26;
  /* les fleurs */
  for(let i = 0; i < W * H / 900; i++){
    const X0 = 12 + Math.floor(R() * (W - 24)), Y0 = Math.floor(R() * H);
    if(!free(X0, Y0, 12)) continue;
    const c = B.f[Math.floor(R() * B.f.length)];
    px(B.b, X0, Y0 + 2, 1, 2);
    px(c, X0 - 1, Y0, 3, 1); px(c, X0, Y0 - 1, 1, 3); px("#fff8c0", X0, Y0);
  }
  /* le decor de chaque lieu, sur les bords */
  const deco = (X0, Y0, big) => {
    const s = big ? 1.4 : 1;
    if(B.deco === "tree" || B.deco === "pine"){
      const c1 = B.deco === "pine" ? "#2d5a46" : "#2f6a2a", c2 = B.deco === "pine" ? "#3f7a60" : "#3f8a36";
      px("#5a3a22", X0 - 1, Y0 + 4 * s, 3, 4);
      for(let k = 0; k < 6 * s; k++) px(k % 2 ? c1 : c2, X0 - k, Y0 - 6 * s + k * 1.5, 2 * k + 1, 2);
      if(B.deco === "pine") px("#ffffff", X0 - 1, Y0 - 6 * s, 3, 1);
    } else if(B.deco === "rock" || B.deco === "lava"){
      px(B.deco === "lava" ? "#2e1d16" : "#6b5038", X0 - 4, Y0 - 2, 9, 5); px(B.deco === "lava" ? "#4a3026" : "#8a6a4a", X0 - 3, Y0 - 3, 6, 2);
      if(B.deco === "lava"){ px("#ff6a2a", X0 - 6, Y0 + 4, 4, 1); px("#ffc857", X0 - 5, Y0 + 4, 1, 1); }
    } else if(B.deco === "palm"){
      px("#9a6a3a", X0, Y0 - 2, 2, 8); px("#3f9a4a", X0 - 4, Y0 - 4, 10, 2); px("#3f9a4a", X0 - 2, Y0 - 6, 6, 2);
    } else if(B.deco === "glitch"){
      px(R() < 0.5 ? "#ff3d7f" : "#35f0d6", X0 - 3, Y0, 7, 1); px("#0a0614", X0 - 2, Y0 + 1, 5, 3);
    } else {
      /* un gros buisson, comme dans les coins de Pokelike */
      const rx = big ? 7 : 5, ry = big ? 5 : 4;
      for(let dy = -ry; dy <= ry; dy++) for(let dx = -rx; dx <= rx; dx++){
        const q = dx * dx / (rx * rx) + dy * dy / (ry * ry);
        if(q <= 1) px(q > 0.7 ? "#24601f" : dy < -1 ? "#4fa040" : "#3a8a32", X0 + dx, Y0 + dy);
      }
      px("#6cc055", X0 - 2, Y0 - ry + 1, 2, 1); px("#6cc055", X0 + 2, Y0 - ry + 2, 1, 1);
    }
  };
  for(let i = 0; i < H / 22; i++){
    const left = R() < 0.5, X0 = left ? 6 + Math.floor(R() * 10) : W - 8 - Math.floor(R() * 10), Y0 = XMAP.TOP / 2 + Math.floor(R() * (H - XMAP.TOP / 2 - 40));
    if(free(X0, Y0, 16)) deco(X0, Y0, R() < 0.3);
  }
  /* la plage a sa mer, sur la droite */
  if(B.water){
    for(let yy = XMAP.TOP / 2; yy < H - 30; yy++){
      const edge = W - 10 + Math.round(Math.sin(yy / 6) * 2);
      px(B.water, edge, yy, W - edge, 1);
      if(yy % 9 === 0) px("#bfe6ff", edge + 2, yy, 3, 1);
    }
  }
  /* en haut : le batiment d'ou l'on part, et sa porte */
  const TH = XMAP.TOP / 2 - 26;
  px(B.wall[0], 0, 0, W, TH);
  for(let yy = 2; yy < TH - 2; yy += 6) for(let xx = (yy / 6) % 2 ? 0 : 6; xx < W; xx += 12) px(B.wall[1], xx, yy, 11, 5);
  px(B.wall[2], 0, TH - 2, W, 2);
  const dx = Math.round(W / 2);
  px("#3a2a2a", dx - 12, TH - 22, 24, 22); px("#e07a50", dx - 10, TH - 20, 9, 20); px("#e07a50", dx + 1, TH - 20, 9, 20);
  px("#f4f0e8", dx - 14, TH - 26, 28, 4); px("#c8c0b0", dx - 14, TH - 23, 28, 1);
  if(B.deco !== "glitch"){
    /* un tableau, une fenetre : la maison est habitee */
    px("#c84a3a", 18, TH - 20, 22, 13); px("#9fd8f8", 20, TH - 18, 18, 9); px("#6ac060", 20, TH - 13, 18, 4);
    px("#ffffff", W - 46, TH - 22, 30, 16); px("#58a8e8", W - 44, TH - 20, 26, 5); px("#58a8e8", W - 44, TH - 13, 26, 5);
  } else {
    for(let i = 0; i < 18; i++) px(R() < 0.5 ? "#ff3d7f" : "#35f0d6", Math.floor(R() * W), Math.floor(R() * TH), 3 + Math.floor(R() * 12), 1);
  }
  /* en bas : la grille du Champion, deux plantes en pot */
  const by = H - 18;
  px(B.wall[1], 0, by, dx - 22, 6); px(B.wall[1], dx + 22, by, W - dx - 22, 6);
  px(B.wall[2], 0, by + 6, dx - 22, 2); px(B.wall[2], dx + 22, by + 6, W - dx - 22, 2);
  for(const pxx of [dx - 40, dx + 34]){
    px("#a8a8a0", pxx, by - 14, 10, 12); px("#d8d8d0", pxx + 1, by - 13, 8, 3);
    px("#2f6a2a", pxx - 2, by - 28, 14, 14); px("#3f8a36", pxx, by - 30, 10, 6); px("#5a3a22", pxx + 4, by - 16, 2, 3);
  }
}

/* ---------- petites icônes en pixel art, dessinées une fois ---------- */
const XPX_ART = {
  grass:{p:{a:"#2f7a2a", b:"#4fae3c", c:"#7fd860", k:"#1a4a18"}, d:[
    "................",
    "...k......k.....",
    "..kck....kck..k.",
    "..kbk.k..kbk.kck",
    ".kbbkkck.kbbkkbk",
    ".kbbkkbk.kbbkkbk",
    "kbbabkbbkbbabkbb",
    "kbabbkbbkbabbkab",
    "kaabbkabkaabbkaa",
    "kaaabkaakaaabkaa",
    ".kaaakaak.kaaaak",
    "..kkkkkkk..kkkk."]},
  pc:{p:{r:"#e04848", R:"#a82828", w:"#f8f8f0", g:"#c8c8c0", b:"#58a8e8", d:"#3a2a2a", k:"#202020"}, d:[
    "....RRRRRRRR....",
    "..RRrrrrrrrrRR..",
    ".RrrrrrrrrrrrrR.",
    "RrrrrrrrrrrrrrrR",
    "kkkkkkkkkkkkkkkk",
    ".wwwwwwwwwwwwww.",
    ".wbbwwwrrwwwbbw.",
    ".wbbwwrwwrwwbbw.",
    ".wwwwwwrrwwwwww.",
    ".wgwwwwddwwwwgw.",
    ".wwwwwwddwwwwww.",
    ".kkkkkkkkkkkkkk."]},
  mart:{p:{r:"#4878e0", R:"#2848a8", w:"#f8f8f0", g:"#c8c8c0", b:"#58a8e8", d:"#3a2a2a", k:"#202020", y:"#f8d848"}, d:[
    "....RRRRRRRR....",
    "..RRrrrrrrrrRR..",
    ".RrrrrrrrrrrrrR.",
    "RrrrrrrrrrrrrrrR",
    "kkkkkkkkkkkkkkkk",
    ".wwwwwwwwwwwwww.",
    ".wbbwwyyyywwbbw.",
    ".wbbwwywwwwwbbw.",
    ".wwwwwyyyywwwww.",
    ".wgwwwwddwwwwgw.",
    ".wwwwwwddwwwwww.",
    ".kkkkkkkkkkkkkk."]},
  bag:{p:{a:"#a0602c", b:"#c8803c", c:"#e8a860", k:"#3a2010", y:"#f8d848"}, d:[
    ".....kkkk.....",
    "....k....k....",
    "...kkkkkkkk...",
    "..kccccccccck.",
    ".kcbbbbbbbbbck",
    ".kbbbbyybbbbbk",
    ".kbbbbyybbbbbk",
    ".kabbbbbbbbbak",
    ".kaabbbbbbbaak",
    ".kaaaaaaaaaaak",
    "..kkkkkkkkkkk."]},
  ask:{p:{w:"#ffffff", g:"#c8d0d8", k:"#2a3038"}, d:[
    "..kkkkkk..",
    ".kwwwwwwk.",
    "kwwkkkkwwk",
    "kwwk..kwwk",
    ".kk..kwwk.",
    "....kwwk..",
    "...kwwk...",
    "...kggk...",
    "....kk....",
    "...kwwk...",
    "...kggk...",
    "....kk...."]}
};
const XPX_CACHE = {};
function xpxIcon(name, scale){
  scale = scale || 2;
  const key = name + scale;
  if(XPX_CACHE[key]) return XPX_CACHE[key];
  const A = XPX_ART[name];
  if(!A || typeof document === "undefined") return "";
  try {
    const h = A.d.length, w = A.d[0].length;
    const c = document.createElement("canvas");
    if(typeof c.getContext !== "function") return "";
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    A.d.forEach((row, yy) => [...row].forEach((ch, xx) => { if(A.p[ch]){ x.fillStyle = A.p[ch]; x.fillRect(xx, yy, 1, 1); } }));
    return XPX_CACHE[key] = `<img class="xpx" src="${c.toDataURL()}" width="${w * scale}" height="${h * scale}" alt="">`;
  } catch(e){ return ""; }
}

/* ---------- un personnage de la carte (16x32, vu de dessus) ---------- */
function owArt(cls, scale, extra){
  scale = scale || 2;
  const i = Math.max(0, OW_CLASSES.indexOf(cls));
  return `<span class="ow ${extra || ""}" style="width:${16 * scale}px;height:${32 * scale}px;background-position:${-i * 16 * scale}px 0;background-size:${OW_CLASSES.length * 16 * scale}px ${32 * scale}px"></span>`;
}
function owClassOf(n){
  if(n.t === "elite") return n.el === "cool_trainer_f" ? "cooltrainer_f" : "cooltrainer_m";
  const tr = n.tr !== undefined ? TRAINERS[n.tr] : null;
  return tr ? (OW_TYPE_CLASS[tr.t] || "youngster") : "youngster";
}

/* ---------- ce qu'on voit sur un nœud ---------- */
function xnodeArt(run, n){
  switch(n.t){
    case "trainer": case "elite": return owArt(owClassOf(n), 2);
    case "champ": return `${owArt(run.leader ? run.leader.k : "brock", 2, "sil")}<span class="xask">${xpxIcon("ask", 2)}</span>`;
    case "boss": return `<span class="xcore">?</span>`;
    case "fight": return xpxIcon("grass", 2);
    case "draft": return itemIcon("ball:poke", 30) || xpxIcon("ask", 2);
    case "treasure": return xpxIcon("bag", 2);
    case "rest": return xpxIcon("pc", 2);
    case "shop": return xpxIcon("mart", 2);
    case "swap": return itemIcon("stone:link", 30) || xpxIcon("ask", 2);
    case "event": return xpxIcon("ask", 2);
  }
  return "";
}

try { if(typeof OW_ATLAS !== "undefined" && document.documentElement && document.documentElement.style)
  document.documentElement.style.setProperty("--ow-atlas", `url(${OW_ATLAS})`); } catch(e){}
