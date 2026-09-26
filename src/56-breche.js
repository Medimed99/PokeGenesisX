/* ============================================================
   56 — LA BRÈCHE · MOTEUR
   Un survivors-like au pouce. Ce fichier ne contient que le
   moteur : rendu canvas, sprites, decors, armes, entites. La
   partie (vagues, choix, boss) est dans 57, l'interface dans 58.

   Principes de rendu :
   · tout est dessine dans un seul canvas, sans DOM par entite ;
   · les sprites sont decoupes UNE fois dans l'atlas du jeu, puis
     mis en cache sous trois formes : normale, corrompue, blanche ;
   · les objets sont recycles (pools) : rien n'est alloue a la volee
     pendant une run, sans quoi le ramasse-miettes fait saccader.
   ============================================================ */

/* ---------- aléatoire reproductible ----------
   Toute l'alea d'une run passe par ici : la Breche quotidienne doit
   etre identique pour tous les joueurs. */
function brRng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   SPRITES
   ============================================================ */
let BR_ATLAS = null;
const BR_SPR = {};          /* cache : "id:variante" -> canvas */
function brAtlas(){
  if(!BR_ATLAS){ BR_ATLAS = new Image(); BR_ATLAS.src = ATLAS_URL; }
  return BR_ATLAS;
}
function brAtlasReady(){ const a = brAtlas(); return a.complete && a.naturalWidth > 0; }
let BR_ATLAS_S = null;
function brShinyAtlas(){
  if(!BR_ATLAS_S){ BR_ATLAS_S = new Image(); BR_ATLAS_S.src = typeof ATLAS_SHINY_URL !== "undefined" ? ATLAS_SHINY_URL : ATLAS_URL; }
  return BR_ATLAS_S;
}
function brShinyAtlasReady(){ const a = brShinyAtlas(); return a.complete && a.naturalWidth > 0; }

/* palette de corruption : on ramene chaque pixel vers quatre tons de la faille */
const BR_CORRUPT = [[34,10,52],[110,34,130],[255,61,127],[255,214,236]];
function brSprite(id, variant){
  const key = id + ":" + variant;
  if(BR_SPR[key]) return BR_SPR[key];
  if(!brAtlasReady()) return null;
  const idx = atlasIndex(id, false);
  if(idx < 0) return null;
  const A = brAtlas();
  const cell = Math.round(A.naturalWidth / ATLAS_COLS);
  const c = document.createElement("canvas");
  c.width = c.height = cell;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  /* chromatique : on decoupe le vrai sprite dans l'atlas chromatique */
  const src = variant === "s" && brShinyAtlasReady() ? brShinyAtlas() : A;
  x.drawImage(src, (idx % ATLAS_COLS) * cell, Math.floor(idx / ATLAS_COLS) * cell, cell, cell, 0, 0, cell, cell);
  if(variant === "s"){ BR_SPR[key] = c; return c; }
  if(variant !== "n"){
    const img = x.getImageData(0, 0, cell, cell), d = img.data;
    for(let i = 0; i < d.length; i += 4){
      if(d[i+3] < 20) continue;
      const r = d[i], g = d[i+1], b = d[i+2];
      if(variant === "w"){ d[i] = d[i+1] = d[i+2] = 255; continue; }
      /* corrompu : on garde la silhouette, on remplace la palette */
      const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
      const p = BR_CORRUPT[Math.min(3, Math.floor(l * 4))];
      d[i]   = Math.round(r * 0.35 + p[0] * 0.65);
      d[i+1] = Math.round(g * 0.35 + p[1] * 0.65);
      d[i+2] = Math.round(b * 0.35 + p[2] * 0.65);
    }
    x.putImageData(img, 0, 0);
    if(variant === "c"){
      /* contour sombre : la silhouette se detache de n'importe quel sol */
      const o = document.createElement("canvas");
      o.width = o.height = cell;
      const ox = o.getContext("2d");
      ox.imageSmoothingEnabled = false;
      for(const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) ox.drawImage(c, dx, dy);
      ox.globalCompositeOperation = "source-in";
      ox.fillStyle = "#12041c"; ox.fillRect(0, 0, cell, cell);
      ox.globalCompositeOperation = "source-over";
      ox.drawImage(c, 0, 0);
      BR_SPR[key] = o;
      return o;
    }
  }
  BR_SPR[key] = c;
  return c;
}

/* ============================================================
   DÉCORS — un sol par habitat, genere une fois, puis carrele
   ============================================================ */
const BR_FLOORS = {
  route:  {base:"#1f3a24", a:"#2c5232", b:"#4f7a3a", dot:"#e8e27a", glitch:"#ff3d7f"},
  foret:  {base:"#132a1a", a:"#1c3a22", b:"#2f5a2c", dot:"#9fe07a", glitch:"#ff3d7f"},
  eaux:   {base:"#0b2a3f", a:"#11405c", b:"#1d6a8a", dot:"#bdf3ff", glitch:"#ff3d7f"},
  grotte: {base:"#241b16", a:"#33271f", b:"#4a3a2c", dot:"#c9a86a", glitch:"#ff3d7f"},
  ruines: {base:"#1c1530", a:"#2a2046", b:"#433466", dot:"#c9a6ff", glitch:"#35f0d6"},
  foyer:  {base:"#2a0e0a", a:"#3d1510", b:"#6a2412", dot:"#ffb35c", glitch:"#35f0d6"}
};
const BR_FLOOR_CACHE = {};
function brFloor(hab){
  if(BR_FLOOR_CACHE[hab]) return BR_FLOOR_CACHE[hab];
  const F = BR_FLOORS[hab] || BR_FLOORS.route;
  const S2 = 256, c = document.createElement("canvas");
  c.width = c.height = S2;
  const x = c.getContext("2d");
  const r = brRng(hab.length * 7919 + 17);
  x.fillStyle = F.base; x.fillRect(0, 0, S2, S2);
  /* grandes taches douces */
  for(let i = 0; i < 14; i++){
    const gx = r() * S2, gy = r() * S2, gr = 20 + r() * 40;
    const gr2 = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
    gr2.addColorStop(0, F.a); gr2.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr2; x.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
  }
  /* motif propre a l'habitat */
  x.fillStyle = F.b;
  for(let i = 0; i < 90; i++){
    const px = Math.floor(r() * S2), py = Math.floor(r() * S2);
    if(hab === "eaux"){ x.fillRect(px, py, 6 + r() * 10, 1); }
    else if(hab === "grotte" || hab === "ruines"){ x.fillRect(px, py, 2, 2); if(r() < .2) x.fillRect(px, py, 10, 1); }
    else if(hab === "foyer"){ x.fillRect(px, py, 3, 1); }
    else { x.fillRect(px, py, 1, 3); x.fillRect(px + 2, py + 1, 1, 2); }
  }
  if(hab === "ruines"){ x.strokeStyle = "rgba(201,166,255,.08)"; for(let g = 0; g <= S2; g += 32){ x.beginPath(); x.moveTo(g, 0); x.lineTo(g, S2); x.moveTo(0, g); x.lineTo(S2, g); x.stroke(); } }
  if(hab === "foyer"){ x.strokeStyle = "rgba(255,120,40,.35)"; x.lineWidth = 1.5;
    for(let i = 0; i < 6; i++){ x.beginPath(); let px = r() * S2, py = r() * S2; x.moveTo(px, py);
      for(let k = 0; k < 5; k++){ px += (r() - .5) * 40; py += (r() - .5) * 40; x.lineTo(px, py); } x.stroke(); } }
  /* petites taches claires : fleurs, galets, reflets */
  x.fillStyle = F.dot;
  for(let i = 0; i < 16; i++) x.fillRect(Math.floor(r() * S2), Math.floor(r() * S2), 2, 2);
  /* quelques pixels de corruption, discrets : le lieu est deja atteint */
  x.fillStyle = F.glitch; x.globalAlpha = .35;
  for(let i = 0; i < 5; i++) x.fillRect(Math.floor(r() * S2), Math.floor(r() * S2), 2 + Math.floor(r() * 6), 1);
  x.globalAlpha = 1;
  BR_FLOOR_CACHE[hab] = c;
  return c;
}

/* ============================================================
   ARMES — une attaque par type, lisible au premier coup d'oeil
   ============================================================ */
const BR_ARCH = {
  1:{k:"bolt",   n:"Météores",     dmg:9,  cd:0.9, c:"#e8e2cf"},
  2:{k:"punch",  n:"Poing Karaté",  dmg:16, cd:1.1, c:"#ff9a5a"},
  3:{k:"blade",  n:"Lame d'Air",    dmg:11, cd:1.4, c:"#bfe6ff"},
  4:{k:"puddle", n:"Toxik",         dmg:4,  cd:2.2, c:"#b86bff"},
  5:{k:"quake",  n:"Séisme",        dmg:12, cd:3.0, c:"#e0b46a"},
  6:{k:"lob",    n:"Éboulement",    dmg:22, cd:1.8, c:"#c9a86a"},
  7:{k:"swarm",  n:"Dard-Nuée",     dmg:4,  cd:0.7, c:"#b6e05a"},
  8:{k:"wisp",   n:"Ball'Ombre",    dmg:10, cd:1.3, c:"#9b6bff"},
  9:{k:"orbit",  n:"Tête de Fer",   dmg:9,  cd:0,   c:"#c7d2e0"},
  10:{k:"cone",  n:"Flammèche",     dmg:6,  cd:0.55,c:"#ff8a3d"},
  11:{k:"wave",  n:"Pistolet à O",  dmg:10, cd:1.6, c:"#4fb2ff"},
  12:{k:"seed",  n:"Vampigraine",   dmg:5,  cd:1.9, c:"#5ce07a"},
  13:{k:"chain", n:"Éclair",        dmg:11, cd:1.2, c:"#ffe45e"},
  14:{k:"orbit", n:"Choc Mental",   dmg:8,  cd:0,   c:"#ff7ad0"},
  15:{k:"shard", n:"Éclats Glace",  dmg:7,  cd:1.0, c:"#aef4ff"},
  16:{k:"beam",  n:"Draco-Souffle", dmg:20, cd:2.2, c:"#8a6bff"},
  17:{k:"slash", n:"Tranche-Nuit",  dmg:14, cd:1.2, c:"#6a5a8a"},
  18:{k:"pulse", n:"Charme",        dmg:7,  cd:2.0, c:"#ffb3dc"}
};
const BR_MAXLV = 8;
function brArch(id){ return BR_ARCH[POKE[id].types[0]] || BR_ARCH[1]; }
/* statistiques d'une arme : espece, niveau, evolution, objets, Archive */
function brWeaponStats(w, R){
  /* la forme evoluee compte : une evolution doit se sentir au combat */
  const sid = w.show || w.id, A = brArch(sid), p = POKE[sid];
  const species = 0.95 + Math.min(1.1, p.bst / 480);          /* un Pokemon puissant frappe plus fort */
  let dmg = A.dmg * species * (1 + 0.28 * (w.lv - 1));
  if(w.stage >= 1) dmg *= 1.25;
  if(w.stage >= 2) dmg *= 1.65;
  dmg *= R.mods.dmg * (1 + brCatalystLv(R, p.types[0]) * 0.15);
  /* maitrise : plus une espece a ete jouee, plus elle frappe fort */
  dmg *= 1 + 0.04 * (typeof brMastery === "function" ? brMastery(w.id) : 0);
  const cd = A.cd * Math.pow(0.95, w.lv - 1) * R.mods.cd * (w.stage >= 2 ? 0.8 : 1);
  const area = (1 + 0.08 * (w.lv - 1)) * R.mods.area * (w.stage >= 2 ? 1.35 : 1);
  const count = 1 + (w.lv >= 3 ? 1 : 0) + (w.lv >= 6 ? 1 : 0) + (w.stage >= 2 ? 2 : 0) + ((R.mods && R.mods.count) || 0);
  return {dmg, cd, area, count, color:A.c, k:A.k};
}

/* ============================================================
   OBJETS TENUS
   Huit objets generiques, et un catalyseur par type : c'est lui qui
   declenche l'evolution finale. Les conditions restent a decouvrir.
   ============================================================ */
const BR_ITEMS = {
  restes:   {n:"Restes",           spr:143, g:"✚", c:"#5ce07a", max:5, d:l=>`Régénère ${(0.4*l).toFixed(1)} PV par seconde.`},
  mouchoir: {n:"Mouchoir Choix",   spr:52,  g:"»", c:"#4fb2ff", max:5, d:l=>`+${8*l}% de vitesse de déplacement.`},
  lentille: {n:"Lentille Zoom",    spr:123, g:"◎", c:"#b06bff", max:5, d:l=>`+${10*l}% de zone d'effet.`},
  griffe:   {n:"Vive Griffe",      spr:104, g:"✦", c:"#ffe45e", max:5, d:l=>`Attaques ${6*l}% plus rapides.`},
  bandeau:  {n:"Bandeau Choix",    spr:68,  g:"▲", c:"#ff5c5c", max:5, d:l=>`+${10*l}% de dégâts.`},
  attract:  {n:"Module d'attraction", spr:137, g:"◉", c:"#35f0d6", max:5, d:l=>`Ramasse les octets ${30*l}% plus loin.`},
  grelot:   {n:"Grelot Coque",     spr:121, g:"♪", c:"#ffb3dc", max:3, d:l=>`Chaque K.O. rend ${l} PV.`},
  veste:    {n:"Veste de Combat",  spr:65,  g:"▣", c:"#c7d2e0", max:5, d:l=>`Dégâts subis réduits de ${7*l}%.`}
};
const BR_CATALYSTS = {
  1:"Mouchoir Soie", 2:"Ceinture Noire", 3:"Bec Pointu", 4:"Pic Venin", 5:"Sable Doux",
  6:"Pierre Dure", 7:"Poudre Argentée", 8:"Rune Sort", 9:"Peau Métal", 10:"Charbon",
  11:"Eau Mystique", 12:"Grain Miracle", 13:"Aimant", 14:"Cuiller Tordue", 15:"Glace Éternelle",
  16:"Croc Dragon", 17:"Lunettes Noires", 18:"Poudre Féerique"
};
function brCatalystLv(R, type){ return (R.items["cat" + type] || 0); }
function brItemDef(key){
  if(key.startsWith("cat")){
    const t = +key.slice(3);
    return {n:BR_CATALYSTS[t], cat:t, max:3, spr:null,
      d:l=>`Attaques de type ${TYPE_NAMES[t]} : +${15*l}%. Réveille aussi quelque chose…`};
  }
  return BR_ITEMS[key];
}
function brRecomputeMods(R){
  const I = R.items, U = (S.breche && S.breche.upg) || {};
  R.mods = {
    dmg:   (1 + 0.10 * (I.bandeau || 0)) * (1 + 0.08 * (U.might || 0)),
    cd:    Math.pow(0.94, I.griffe || 0),
    area:  (1 + 0.10 * (I.lentille || 0)),
    speed: (1 + 0.08 * (I.mouchoir || 0)) * (1 + 0.05 * (U.speed || 0)),
    magnet:(1 + 0.30 * (I.attract || 0)) * (1 + 0.20 * (U.magnet || 0)),
    regen: 0.4 * (I.restes || 0) + 0.2 * (U.regen || 0),
    armor: Math.pow(0.93, I.veste || 0),
    leech: I.grelot || 0
  };
  if(typeof brPlusMods === "function") brPlusMods(R);
}

/* ============================================================
   POOLS D'ENTITÉS
   ============================================================ */
function brPool(make){ const list = []; return {
  list,
  get(){ for(const o of list) if(!o.on){ o.on = true; return o; } const o = make(); o.on = true; list.push(o); return o; },
  each(fn){ for(const o of list) if(o.on) fn(o); },
  clear(){ for(const o of list) o.on = false; }
};}
function brNewPools(){
  return {
    foes:  brPool(()=>({})),
    shots: brPool(()=>({hits:[]})),
    zones: brPool(()=>({})),
    gems:  brPool(()=>({})),
    parts: brPool(()=>({})),
    texts: brPool(()=>({})),
    fx:    brPool(()=>({pts:[]})),
    picks: brPool(()=>({}))
  };
}
/* grille spatiale : les collisions ne testent que les voisins */
const BR_CELL = 64;
function brGrid(R){
  const g = R.grid; g.clear();
  R.P.foes.each(f=>{
    const k = ((f.x / BR_CELL) | 0) + "," + ((f.y / BR_CELL) | 0);
    let a = g.get(k); if(!a){ a = []; g.set(k, a); } a.push(f);
  });
}
function brNear(R, x, y, rad, fn){
  const x0 = Math.floor((x - rad) / BR_CELL), x1 = Math.floor((x + rad) / BR_CELL);
  const y0 = Math.floor((y - rad) / BR_CELL), y1 = Math.floor((y + rad) / BR_CELL);
  for(let gx = x0; gx <= x1; gx++) for(let gy = y0; gy <= y1; gy++){
    const a = R.grid.get(gx + "," + gy);
    if(a) for(const f of a) if(f.on && f.hp > 0) fn(f);
  }
}
function brNearest(R, x, y, maxd){
  let best = null, bd = maxd * maxd;
  R.P.foes.each(f=>{
    if(f.hp <= 0) return;
    const dx = f.x - x, dy = f.y - y, d = dx*dx + dy*dy;
    if(d < bd){ bd = d; best = f; }
  });
  return best;
}

/* ============================================================
   EFFETS VISUELS
   ============================================================ */
function brBurst(R, x, y, color, n, speed, life){
  for(let i = 0; i < n; i++){
    const p = R.P.parts.get(), a = R.rng() * Math.PI * 2, s = speed * (0.4 + R.rng() * 0.8);
    p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
    p.life = p.max = life * (0.6 + R.rng() * 0.6); p.color = color; p.size = 2 + (R.rng() * 3 | 0);
  }
}
/* « defragmentation » : l'ennemi vaincu se disloque en pixels de sa couleur */
function brDefrag(R, f){
  const n = f.boss ? 60 : f.elite ? 26 : 9;
  brBurst(R, f.x, f.y, f.elite || f.boss ? "#ff3d7f" : "#d9a3ff", n, f.boss ? 260 : 140, 0.55);
  if(f.elite || f.boss) brBurst(R, f.x, f.y, "#ffffff", n >> 1, 200, 0.4);
}
function brText(R, x, y, txt, color, size){
  if(R.P.texts.list.filter(t=>t.on).length > 60) return;     /* lisibilite avant tout */
  const t = R.P.texts.get();
  t.x = x + (R.rng() - .5) * 10; t.y = y; t.txt = txt; t.color = color; t.size = size || 11;
  t.life = t.max = 0.7;
}
function brShake(R, amt){ R.shake = Math.min(14, R.shake + amt); }
function brHitstop(R, ms){ R.hitstop = Math.max(R.hitstop, ms / 1000); }

/* ============================================================
   DÉGÂTS
   ============================================================ */
function brHit(R, f, dmg, color, kx, ky, kb){
  if(f.hp <= 0) return;
  const roll = brHitRoll(R, f, dmg), crit = roll.crit;
  const d = Math.round(roll.d * (0.9 + R.rng() * 0.2));
  f.hp -= d;
  f.flash = 0.09;
  brBurst(R, f.x, f.y - f.size * 0.2, color, crit ? 6 : 2, crit ? 220 : 140, 0.28);
  if(kb && !f.boss && !f.reaper){ const k = kb / (f.elite ? 3 : 1) / (f.armor ? 2 : 1); f.kx += kx * k; f.ky += ky * k; }
  brOnHit(R, f, roll.sec);
  if(roll.sec === 7 && !R.dbl && R.rng() < 0.15){ R.dbl = true; brHit(R, f, dmg, color, 0, 0, 0); R.dbl = false; }
  brText(R, f.x, f.y - f.size * 0.4, crit ? d + "!" : "" + d, crit ? "#ffe45e" : color, crit ? 15 : 11);
  if(crit) brHitstop(R, 25);
  if(R.curW >= 0) R.dmgBy[R.curW] = (R.dmgBy[R.curW] || 0) + d;
  if(f.hp <= 0) brKill(R, f);
}
function brKill(R, f){
  brDefrag(R, f);
  R.kills++;
  if(R.mods.leech) R.hp = Math.min(R.maxHp, R.hp + R.mods.leech);
  /* octets : leur couleur dit leur valeur */
  const v = f.boss ? 60 : f.elite ? 18 : f.big ? 4 : 1;
  const n = f.minion ? 0 : f.boss ? 12 : f.elite ? 5 : 1;
  for(let i = 0; i < n; i++){
    const g = R.P.gems.get();
    g.x = f.x + (R.rng() - .5) * (n > 1 ? 50 : 0); g.y = f.y + (R.rng() - .5) * (n > 1 ? 50 : 0);
    g.v = v; g.pull = false; g.pv = 0;
  }
  if((f.elite || f.big) && !f.boss){ brHitstop(R, 70); brShake(R, 5); try { buzz(20); } catch(e){} R.chestsPending++; }
  R.killsBy[f.id] = (R.killsBy[f.id] || 0) + 1;
  if(f.elite) R.elitesDown.push({id:f.id, shiny:f.shiny});
  brDrop(R, f);
  if(R.killSrc) brMisTick(R, R.killSrc);
  if(f.kind === "nest"){ R.chestsPending++; brMisTick(R, "nid"); if(f.poi) f.poi.used = true; brShake(R, 6);
    brBanner(R, "NID DÉTRUIT", "#ff3d7f"); }
  if(f.kind === "splitter"){
    for(let k = 0; k < 2; k++){ const c = brSpawnFoe(R, f.id, "split"); c.x = f.x + (k ? 14 : -14); c.y = f.y; }
  }
  if(f.reaper){ R.reaperDown = true; R.reaper = null; brBanner(R, "LA FAILLE A CÉDÉ", "#ffd24a", "impossible… et pourtant"); }
  else if(f.boss) (f.echo ? brEchoDown(R, f) : brBossDown(R, f));
  f.on = false;
}
