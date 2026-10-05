/* ============================================================
   59d — LA DESCENTE · MOTEUR (livraison 1 : le cœur)
   L'Expedition refondue en donjon mystere : une grille, un tour par
   pas, une equipe qui suit son meneur, des capacites qui ont une
   forme (contact, ligne, cone, explosion, salle entiere...).
   Manuel par defaut, automatique en option. Sauvegarde a chaque pas.
   ============================================================ */
const DC_W = 48, DC_H = 34, DC_FLOORS = 5, DC_TEAM_MAX = 4;
const T_WALL = 0, T_FLOOR = 1, T_STAIRS = 2;
/* terrains (livraison 3) : l'eau ne se traverse qu'en nageant ou en volant ; la lave brule ;
   les herbes s'embrasent ; la glace porte ; la corruption ronge l'arene du gardien */
const T_WATER = 3, T_GRASS = 4, T_LAVA = 5, T_ICE = 6, T_ASH = 7, T_ROCK = 8, T_CORR = 9, T_SPIKE = 10, T_SPRING = 11, T_SHOP = 12;
const dcSwims = e => POKE[e.id].types.some(t=>t === 11 || t === 3);
function dcPassable(D, e, x, y){
  const t = dcTile(D, x, y);
  if(t === T_WALL) return false;
  if(t === T_WATER) return !!e && (e.side === "ally" || e.side === "foe") && dcSwims(e);
  return true;
}
let DC = null;

/* ---------- hasard reproductible et sauvegardable ---------- */
function dcRand(D){
  let t = (D.rs = (D.rs + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const dcInt = (D, a, b) => a + Math.floor(dcRand(D) * (b - a + 1));
const dcIdx = (x, y) => y * DC_W + x;
function dcTile(D, x, y){ return x < 0 || y < 0 || x >= DC_W || y >= DC_H ? T_WALL : D.tiles[dcIdx(x, y)]; }
const DC_DIRS = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];   /* l'ordre des rangees PMD */
function dcDirOf(dx, dy){ for(let i = 0; i < 8; i++) if(DC_DIRS[i][0] === Math.sign(dx) && DC_DIRS[i][1] === Math.sign(dy)) return i; return 0; }

/* ============================================================
   LES CAPACITÉS : une forme sur la grille
   ============================================================ */
const DC_SHAPE_OF = {bolt:"line", ricochet:"chain", nova:"burst2", wisp:"line", punch:"melee", fissure:"pierce", blade:"pierce",
  tornado:"blast", puddle:"blast", lob:"blast", quake:"room", rain:"blast", swarm:"cone", slash:"arc", spiral:"burst", aura:"burst",
  sweep:"pierce", orbit:"burst", cone:"cone", beam:"pierce", wave:"cone", seed:"blast", chain:"chain", shard:"cone", pulse:"burst",
  storm:"room", wall:"pierce", sing:"blast2", metro:"blast"};
const DC_UPGRADE = {melee:"arc", arc:"burst", line:"pierce", chain:"chain", cone:"cone", burst:"burst2", burst2:"room",
  blast:"blast2", blast2:"room", pierce:"pierce", room:"room"};
const DC_PW = {melee:55, arc:46, line:50, chain:40, cone:38, burst:36, burst2:32, blast:42, blast2:36, pierce:42, room:30};
const DC_SHAPE_TXT = {melee:"contact", arc:"arc devant", line:"tir en ligne", chain:"rebondit", cone:"cône", burst:"autour de soi",
  burst2:"large autour", blast:"explosion ciblée", blast2:"grande explosion", pierce:"rayon perçant", room:"toute la salle"};
const DC_MOVES_CACHE = {};
function dcMoves(id){
  if(DC_MOVES_CACHE[id]) return DC_MOVES_CACHE[id];
  const p = POKE[id], t = p.types[0], t2 = p.types[1] || t;
  const prof = p.spa >= p.atk * 1.12 ? 0 : p.atk >= p.spa * 1.12 ? 1 : 2;
  const basicName = ((typeof movesFor === "function" ? movesFor(p, 5) : []).find(m=>m.type === 1) || {name:"Charge"}).name;
  const [k1, n1, n1b] = BR_ATK[t][prof];
  const v2 = t2 === t ? (prof + 1) % 3 : prof;
  const [k2, n2] = BR_ATK[t2][v2];
  const s1 = DC_SHAPE_OF[k1] || "line", s2 = DC_SHAPE_OF[k2] || "blast";
  const mv = [
    {n:basicName, type:1, pw:40, shape:"melee", cd:0},
    {n:n1, type:t, pw:DC_PW[s1], shape:s1, cd:1, kind:k1},
    {n:n2, type:t2, pw:DC_PW[s2], shape:s2, cd:2, kind:k2}
  ];
  if(BR_LEGEND[id]){
    const L = BR_LEGEND[id], s = DC_SHAPE_OF[L.k] || "blast2";
    mv.push({n:L.n, type:t, pw:Math.round(DC_PW[s] * 2.1), shape:s, cd:4, kind:L.k, sig:true});
  } else {
    const s4 = DC_UPGRADE[s1] || "burst2";
    mv.push({n:n1b, type:t, pw:Math.round(DC_PW[s4] * 1.9), shape:s4, cd:5, kind:k1, ult:true});
  }
  DC_MOVES_CACHE[id] = mv;
  return mv;
}
/* les cases touchees par une capacite, depuis (x, y), dans une direction ou vers une case cible */
function dcShapeTiles(D, e, mv, dir, tx, ty){
  const out = [], [dx, dy] = DC_DIRS[dir || 0];
  const add = (x, y) => { if(dcTile(D, x, y) !== T_WALL) out.push([x, y]); };
  const foeAt = (x, y) => D.ents.find(o=>o.hp > 0 && o.x === x && o.y === y && o.side !== e.side);
  switch(mv.shape){
    case "melee": add(e.x + dx, e.y + dy); break;
    case "arc": { add(e.x + dx, e.y + dy); const l = DC_DIRS[(dir + 1) % 8], r = DC_DIRS[(dir + 7) % 8]; add(e.x + l[0], e.y + l[1]); add(e.x + r[0], e.y + r[1]); break; }
    case "line": for(let k = 1; k <= 5; k++){ const x = e.x + dx * k, y = e.y + dy * k; if(dcTile(D, x, y) === T_WALL) break; out.push([x, y]); if(foeAt(x, y)) break; } break;
    case "pierce": for(let k = 1; k <= 6; k++){ const x = e.x + dx * k, y = e.y + dy * k; if(dcTile(D, x, y) === T_WALL) break; out.push([x, y]); } break;
    case "chain": {
      let x = e.x, y = e.y, hit = null;
      for(let k = 1; k <= 5; k++){ x += dx; y += dy; if(dcTile(D, x, y) === T_WALL) break; out.push([x, y]); hit = foeAt(x, y); if(hit) break; }
      if(hit){ let cur = hit; const seen = new Set([cur]);
        for(let j = 0; j < 2; j++){ const nx = D.ents.find(o=>o.hp > 0 && o.side !== e.side && !seen.has(o) && Math.max(Math.abs(o.x - cur.x), Math.abs(o.y - cur.y)) <= 2);
          if(!nx) break; seen.add(nx); out.push([nx.x, nx.y]); cur = nx; } }
      break; }
    case "cone":
      for(let ox = -3; ox <= 3; ox++) for(let oy = -3; oy <= 3; oy++){
        if(!ox && !oy) continue;
        const dist = Math.max(Math.abs(ox), Math.abs(oy)); if(dist > 3) continue;
        const ang = Math.atan2(oy, ox) - Math.atan2(dy, dx), a2 = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
        if(a2 <= 0.62) add(e.x + ox, e.y + oy);
      }
      break;
    case "burst": case "burst2": { const r = mv.shape === "burst" ? 1 : 2;
      for(let ox = -r; ox <= r; ox++) for(let oy = -r; oy <= r; oy++) if(ox || oy) add(e.x + ox, e.y + oy); break; }
    case "blast": case "blast2": { const r = mv.shape === "blast" ? 1 : 2;
      for(let ox = -r; ox <= r; ox++) for(let oy = -r; oy <= r; oy++) add(tx + ox, ty + oy); break; }
    case "room": {
      const rm = dcRoomAt(D, e.x, e.y);
      if(rm) for(let x = rm.x; x < rm.x + rm.w; x++) for(let y = rm.y; y < rm.y + rm.h; y++) add(x, y);
      else for(let ox = -3; ox <= 3; ox++) for(let oy = -3; oy <= 3; oy++) add(e.x + ox, e.y + oy);
      break; }
  }
  return out;
}
/* viser au mieux : la direction ou la case cible qui touche le plus d'ennemis */
function dcAim(D, e, slot){
  const mv = dcMoves(e.id)[slot];
  /* un gardien protege n'est pas une cible : on vise ses pylones */
  const foes = D.ents.filter(o=>o.hp > 0 && o.side !== e.side && !(o.boss && o.shield));
  const score = tiles => { const set = new Set(tiles.map(([x, y])=>x + "," + y)); return foes.filter(o=>set.has(o.x + "," + o.y)); };
  let best = null;
  if(mv.shape === "blast" || mv.shape === "blast2"){
    for(const f of foes){
      if(Math.max(Math.abs(f.x - e.x), Math.abs(f.y - e.y)) > 4) continue;
      const tiles = dcShapeTiles(D, e, mv, 0, f.x, f.y), hits = score(tiles);
      if(hits.length && (!best || hits.length > best.hits.length)) best = {dir:dcDirOf(f.x - e.x, f.y - e.y), tx:f.x, ty:f.y, tiles, hits};
    }
  } else if(mv.shape === "burst" || mv.shape === "burst2" || mv.shape === "room"){
    const tiles = dcShapeTiles(D, e, mv, e.dir), hits = score(tiles);
    if(hits.length){ const f = hits[0]; best = {dir:dcDirOf(f.x - e.x, f.y - e.y), tiles, hits}; }
  } else {
    for(let d = 0; d < 8; d++){
      const tiles = dcShapeTiles(D, e, mv, d), hits = score(tiles);
      if(hits.length && (!best || hits.length > best.hits.length)) best = {dir:d, tiles, hits};
    }
  }
  return best;
}

/* ============================================================
   LES COMBATTANTS
   ============================================================ */
let DC_UID = 1;
function dcFighter(e){
  if(!e._f || e._f.level !== e.lv || e._f.id !== e.id){
    const f = makeFighter(e.id, e.lv);
    if(e.boss){
      /* le gardien se mesure a l'equipe : face a des Pokemon modestes, il l'est un peu aussi */
      const r = e.scale || 1;
      f.maxHp = Math.round(f.maxHp * 2.3 * r);
      f.atk = Math.round(f.atk * 0.9 * r); f.spa = Math.round(f.spa * 0.9 * r);
    }
    /* l'equipe est plus robuste que la faune, comme dans Donjon Mystere */
    if(e.side === "ally"){
      /* les renforts gagnes dans la Tour, puis dans la Descente sans fond : +4 % par point, toute la lignee */
      if(typeof applyTowerBuffs === "function") applyTowerBuffs(e.id, f);
      f.maxHp = Math.round(f.maxHp * 1.6 * ((DC_HELD[e.held] || {}).hp || 1));
    }
    e._f = f; e.maxHp = f.maxHp;
  }
  return e._f;
}
function dcMakeEnt(D, side, id, lv, x, y, extra){
  const e = Object.assign({uid:DC_UID++, side, id, lv, xp:0, x, y, dir:0, cds:[0,0,0,0], hp:0}, extra || {});
  dcFighter(e); e.hp = e.maxHp; e.shownHp = e.hp; e.px = x; e.py = y;
  D.ents.push(e);
  return e;
}
const dcXpNeed = lv => Math.round(18 + lv * lv * 1.6);
function dcGainXp(D, e, amount){
  e.xp += amount;
  while(e.xp >= dcXpNeed(e.lv) && e.lv < 100){
    e.xp -= dcXpNeed(e.lv);
    const ratio = e.hp / e.maxHp;
    e.lv++; dcFighter(e); e.hp = Math.max(1, Math.round(e.maxHp * ratio) + 2);
    D.maxLv = Math.max(D.maxLv || 0, e.lv);
    dcLog(D, `${POKE[e.id].name} monte au niveau ${e.lv} !`, "#ffd24a");
    /* evolution en pleine Descente */
    const ev = (POKE[e.id].evo || []).find(v=>v.lvl && !v.stone && e.lv >= v.lvl && POKE[v.to]);
    if(ev){
      const from = POKE[e.id].name;
      e.id = ev.to; const r2 = e.hp / e.maxHp; e._f = null; dcFighter(e); e.hp = Math.round(e.maxHp * r2);
      dcLog(D, `${from} évolue en ${POKE[e.id].name} !`, "#ffd24a");
      dcFx(D, {k:"evolve", e, at:0});
      if(!D.evos.includes(e.id)) D.evos.push(e.id);
    }
  }
}

/* ============================================================
   LES ÉTAGES : salles, couloirs, escalier
   ============================================================ */
/* l'etage du gardien : le dernier d'une Descente, ou un sur cinq dans la Descente sans fond */
function dcIsBossFloor(D, n){ const f = n === undefined ? D.floor : n; return D.endless ? f % 5 === 0 : f === DC_FLOORS; }
function dcRoomAt(D, x, y){ return D.rooms.find(r=>x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h); }
function dcCarve(D, x, y){ if(x > 0 && y > 0 && x < DC_W - 1 && y < DC_H - 1 && D.tiles[dcIdx(x, y)] === T_WALL) D.tiles[dcIdx(x, y)] = T_FLOOR; }
function dcCorridor(D, a, b){
  let x = Math.floor(a.x + a.w / 2), y = Math.floor(a.y + a.h / 2);
  const x2 = Math.floor(b.x + b.w / 2), y2 = Math.floor(b.y + b.h / 2);
  const hFirst = dcRand(D) < 0.5;
  const stepX = () => { while(x !== x2){ x += Math.sign(x2 - x); dcCarve(D, x, y); } };
  const stepY = () => { while(y !== y2){ y += Math.sign(y2 - y); dcCarve(D, x, y); } };
  if(hFirst){ stepX(); stepY(); } else { stepY(); stepX(); }
}
function dcSpecies(D){
  const r = regionDef(D.region), h = HABITATS[D.hab] || HABITATS.route;
  const band = BST_BANDS[Math.min(BST_BANDS.length - 1, Math.max(0, D.floor - 2))];
  const all = [];
  for(let i = r.from; i <= r.to; i++){
    const p = POKE[i];
    if(!p || p.leg || isExclusive(i)) continue;
    if(p.bst < band[0] || p.bst > band[1]) continue;
    all.push(i);
  }
  const match = all.filter(i=>POKE[i].types.some(t=>h.types.includes(t)));
  const src = match.length >= 4 && dcRand(D) < 0.7 ? match : (all.length ? all : [19]);
  return src[Math.floor(dcRand(D) * src.length)];
}
function dcGenFloor(D){
  D.tiles = new Array(DC_W * DC_H).fill(T_WALL);
  D.seen = new Array(DC_W * DC_H).fill(0);
  D.rooms = []; D.items = []; D.warn = null;
  const allies = D.ents.filter(e=>e.side === "ally" && e.hp > 0);
  D.ents = allies;
  const boss = dcIsBossFloor(D);
  if(boss){
    /* l'etage du gardien : une antichambre, un couloir, une grande arene */
    D.rooms.push({x:4, y:13, w:6, h:6}, {x:22, y:6, w:18, h:20});
  } else {
    for(let tries = 0; tries < 260 && D.rooms.length < 8; tries++){
      const w = dcInt(D, 5, 10), h = dcInt(D, 4, 8), x = dcInt(D, 1, DC_W - w - 2), y = dcInt(D, 1, DC_H - h - 2);
      if(D.rooms.some(r=>x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      D.rooms.push({x, y, w, h});
    }
    D.rooms.sort((a, b)=>a.x - b.x);
  }
  for(const r of D.rooms) for(let x = r.x; x < r.x + r.w; x++) for(let y = r.y; y < r.y + r.h; y++) D.tiles[dcIdx(x, y)] = T_FLOOR;
  for(let i = 0; i < D.rooms.length - 1; i++) dcCorridor(D, D.rooms[i], D.rooms[i + 1]);
  if(!boss && D.rooms.length > 3) dcCorridor(D, D.rooms[0], D.rooms[dcInt(D, 2, D.rooms.length - 1)]);
  /* les terrains de l'habitat, toujours a l'interieur des salles et jamais en travers du passage */
  if(!boss) dcTerrainGen(D);
  /* un etage de repos : une source, et c'est tout */
  if(D.mod === "source"){ const r = D.rooms[0]; D.tiles[dcIdx(r.x + r.w - 2, r.y + 1)] = T_SPRING; }
  if(D.mod === "marchand"){ const r = D.rooms[0]; D.tiles[dcIdx(r.x + r.w - 2, r.y + r.h - 2)] = T_SHOP; D.shop = dcShopStock(D); }
  /* l'equipe entre par la premiere salle */
  D.stairs = null;
  const start = D.rooms[0];
  allies.forEach((e, i)=>{ e.x = start.x + 1 + (i % 3); e.y = start.y + 1 + Math.floor(i / 3); e.px = e.x; e.py = e.y; e.cds = [0,0,0,0]; });
  const free = r => { for(let k = 0; k < 40; k++){ const x = dcInt(D, r.x, r.x + r.w - 1), y = dcInt(D, r.y, r.y + r.h - 1);
    if(D.tiles[dcIdx(x, y)] === T_FLOOR && !D.ents.some(o=>o.x === x && o.y === y) && !D.items.some(o=>o.x === x && o.y === y)) return [x, y]; } return null; };
  if(boss){
    const ar = D.rooms[1], id = dcGuardian(D);
    const team = allies.filter(a=>a.hp > 0), avg = team.reduce((s2, a)=>s2 + POKE[a.id].bst, 0) / Math.max(1, team.length);
    const scale = Math.max(0.55, Math.min(1.1, avg / 520));
    const b = dcMakeEnt(D, "foe", id, 4 + D.floor * 2, ar.x + Math.floor(ar.w / 2), ar.y + Math.floor(ar.h / 2), {boss:true, awake:true, scale});
    D.boss = b.uid; D.scen = {phase:1, intro:true};
  } else {
    /* l'escalier : dans la salle la plus eloignee de l'entree */
    const far = D.rooms.reduce((m, r)=>Math.hypot(r.x - start.x, r.y - start.y) > Math.hypot(m.x - start.x, m.y - start.y) ? r : m, D.rooms[1] || start);
    const s = free(far) || [far.x + 1, far.y + 1];
    D.tiles[dcIdx(s[0], s[1])] = T_STAIRS; D.stairs = {x:s[0], y:s[1]};
    const elite = D.mod === "elite";
    const n = D.mod === "source" ? 0 : 3 + D.floor + dcInt(D, 0, 1) + (elite ? 1 : 0);
    for(let k = 0; k < n; k++){
      const r = D.rooms[1 + Math.floor(dcRand(D) * (D.rooms.length - 1))], p = r && free(r);
      if(!p) continue;
      dcMakeEnt(D, "foe", dcSpecies(D), 1 + D.floor * 2 + dcInt(D, 0, 1) + (elite ? 2 : 0), p[0], p[1], elite && k === 0 ? {eliteDrop:true} : null);
    }
    dcPlaceLoot(D, free);
  }
  dcVision(D);
}
/* a l'escalier : les portes vers l'etage suivant (l'antre du gardien n'en a qu'une) */
function dcStairsDoors(D){
  if(dcIsBossFloor(D, D.floor + 1)) return ["normal"];
  if(!D.doors) D.doors = dcRollDoors(D);
  return D.doors;
}
/* le mode automatique choisit sa porte : la source si l'equipe souffre, sinon le butin */
function dcAutoDoor(D){
  const ds = dcStairsDoors(D), allies = D.ents.filter(a=>a.side === "ally" && a.hp > 0);
  const hp = allies.reduce((s2, a)=>s2 + a.hp / a.maxHp, 0) / Math.max(1, allies.length);
  const pref = hp < 0.55 ? ["source","marchand","riche","normal","piege","elite"] : ["riche","elite","marchand","normal","source","piege"];
  return pref.find(k=>ds.includes(k)) || ds[0];
}
/* l'auto se sert du sac : soigner un membre en danger, acheter a l'echoppe */
function dcAutoItems(D){
  const allies = D.ents.filter(a=>a.side === "ally" && a.hp > 0);
  const low = allies.find(a=>a.hp / a.maxHp < 0.3);
  if(low){ const i = D.bag.findIndex(it=>it.k === "potion" || it.k === "sitrus" || it.k === "nigma"); if(i >= 0) return {k:"item", idx:i}; }
  const h = D.bag.findIndex(it=>it.k.startsWith("h:"));
  if(h >= 0){ const bare = allies.find(a=>!a.held); if(bare) return {k:"item", idx:h, target:bare.uid}; }
  return null;
}
function dcGuardian(D){
  const L = typeof brLegendsOf === "function" ? brLegendsOf(D.region) : [144, 145, 146];
  return L[Math.floor(dcRand(D) * L.length)];
}

/* ---------- vision : la salle du meneur, et un peu autour de chacun ---------- */
function dcVision(D){
  D.vis = new Array(DC_W * DC_H).fill(0);
  for(const a of D.ents){
    if(a.side !== "ally" || a.hp <= 0) continue;
    const rm = dcRoomAt(D, a.x, a.y);
    if(rm) for(let x = rm.x - 1; x <= rm.x + rm.w; x++) for(let y = rm.y - 1; y <= rm.y + rm.h; y++) if(x >= 0 && y >= 0 && x < DC_W && y < DC_H) D.vis[dcIdx(x, y)] = 1;
    for(let ox = -2; ox <= 2; ox++) for(let oy = -2; oy <= 2; oy++){ const x = a.x + ox, y = a.y + oy; if(x >= 0 && y >= 0 && x < DC_W && y < DC_H) D.vis[dcIdx(x, y)] = 1; }
  }
  for(let i = 0; i < D.vis.length; i++) if(D.vis[i]) D.seen[i] = 1;
}
const dcVisible = (D, x, y) => !!D.vis[dcIdx(x, y)];

/* ---------- chemins : un parcours en largeur, en 8 directions, sans couper les angles ---------- */
function dcPath(D, sx, sy, tx, ty, who, avoidAllies){
  if(sx === tx && sy === ty) return [];
  const prev = new Int32Array(DC_W * DC_H).fill(-1), q = [dcIdx(sx, sy)];
  prev[q[0]] = q[0];
  /* on traverse son propre camp (on echange de place) ; seul l'adversaire bloque, et seulement
     s'il est en vue : un ennemi invisible ne doit pas guider l'itineraire */
  const blocked = (x, y) => !(x === tx && y === ty) && D.ents.some(o=>o.hp > 0 && o !== who && o.x === x && o.y === y
    && who && ((o.side !== who.side && (who.side === "foe" || dcVisible(D, x, y))) || (avoidAllies && o.side === who.side)));
  for(let h = 0; h < q.length; h++){
    const c = q[h], cx = c % DC_W, cy = Math.floor(c / DC_W);
    if(cx === tx && cy === ty) break;
    for(const [dx, dy] of DC_DIRS){
      const nx = cx + dx, ny = cy + dy, ni = dcIdx(nx, ny);
      if(prev[ni] !== -1 || (who ? !dcPassable(D, who, nx, ny) : dcTile(D, nx, ny) === T_WALL)) continue;
      if(dx && dy && (dcTile(D, cx + dx, cy) === T_WALL || dcTile(D, cx, cy + dy) === T_WALL)) continue;
      if(blocked(nx, ny)) continue;
      prev[ni] = c; q.push(ni);
    }
  }
  const ti = dcIdx(tx, ty);
  if(prev[ti] === -1) return null;
  const path = [];
  for(let c = ti; c !== dcIdx(sx, sy); c = prev[c]) path.push([c % DC_W, Math.floor(c / DC_W)]);
  return path.reverse();
}

/* ============================================================
   LE TOUR
   ============================================================ */
function dcLog(D, txt, color){ D.log.push({txt, color:color || "#cbd6e6"}); if(D.log.length > 30) D.log.shift(); }
function dcFx(D, f){ D.fx.push(f); }
function dcLeader(D){ return D.ents.find(e=>e.side === "ally" && e.hp > 0 && e.leader) || null; }
function dcCanStep(D, e, dx, dy){
  const x = e.x + dx, y = e.y + dy;
  if(!dcPassable(D, e, x, y)) return false;
  if(dx && dy && (dcTile(D, e.x + dx, e.y) === T_WALL || dcTile(D, e.x, e.y + dy) === T_WALL)) return false;
  return !D.ents.some(o=>o.hp > 0 && o !== e && o.x === x && o.y === y);
}
function dcStep(D, e, dx, dy){
  e.dir = dcDirOf(dx, dy);
  if(!dcCanStep(D, e, dx, dy)){
    /* le meneur echange de place avec un coequipier, comme dans Donjon Mystere ;
       les partenaires, eux, contournent (sinon deux partenaires s'echangent en boucle) */
    const o = D.ents.find(a=>a.hp > 0 && a.side === e.side && a.x === e.x + dx && a.y === e.y + dy);
    if(o && e.leader && dcPassable(D, e, e.x + dx, e.y + dy) && dcPassable(D, o, e.x, e.y)){ o.x = e.x; o.y = e.y; e.x += dx; e.y += dy; return true; }
    return false;
  }
  e.x += dx; e.y += dy;
  return true;
}
/* une capacite : les degats, l'efficacite, les K.O. */
function dcUse(D, e, slot, aim, delay){
  const mv = dcMoves(e.id)[slot];
  e.dir = aim.dir; e.cds[slot] = mv.cd + (e.boss ? 1 : 0);   /* le gardien recharge plus lentement */
  const att = dcFighter(e);
  dcLog(D, `${POKE[e.id].name} utilise ${mv.n} !`, e.side === "ally" ? "#8ff7e8" : "#ffb3cc");
  dcFx(D, {k:"move", e, mv, tiles:aim.tiles, tx:aim.tx, ty:aim.ty, dir:aim.dir, at:delay});
  for(const t of aim.hits){
    if(t.hp <= 0) continue;
    const def = dcFighter(t), H = DC_HELD[e.held] || {}, HT = DC_HELD[t.held] || {};
    if(HT.dodge && dcRand(D) < HT.dodge){ dcLog(D, `${POKE[t.id].name} esquive !`, "#9fb0c8"); continue; }
    const crit = dcRand(D) < (H.crit || 1 / 16);
    const r = damageCalc(att, def, {type:mv.type, pw:Math.round(mv.pw * (H.pw || 1))}, crit);
    let dmg = r.dmg * (H.atk || 1) * (r.eff >= 2 ? (H.superx || 1) : 1) * (HT.taken || 1) * (D.buffT > 0 && e.side === "ally" ? 1.3 : 1);
    const special = ![1,2,3,5,6,7,8,9,16,17].includes(mv.type);
    if(special && HT.spd) dmg /= HT.spd;
    if(HT.nfe && (POKE[t.id].evo || []).length) dmg /= HT.nfe;
    /* terrain : l'eau conduit la foudre, et etouffe le feu */
    const tt = dcTile(D, t.x, t.y);
    if(tt === T_WATER && mv.type === 13) dmg *= 1.5;
    if(tt === T_WATER && mv.type === 10) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg));
    if(t.boss && t.shield) dmg = 0;
    /* Ceinture Force : survivre a un coup fatal, une fois par etage */
    if(HT.sash && !t.sashUsed && dmg >= t.hp && t.hp > 1){ dmg = t.hp - 1; t.sashUsed = true; dcLog(D, `${POKE[t.id].name} tient bon grâce à la Ceinture Force !`, "#ffd24a"); }
    t.hp = Math.max(0, t.hp - dmg);
    if(H.drain) e.hp = Math.min(e.maxHp, e.hp + Math.round(dmg * H.drain));
    if(HT.thorns && dmg) e.hp = Math.max(1, e.hp - Math.round(e.maxHp * HT.thorns));
    dcFx(D, {k:"hit", e:t, dmg, eff:r.eff, crit, at:delay + 0.22, hp:t.hp, color:BR_ARCH[mv.type] ? BR_ARCH[mv.type].c : "#fff"});
    if(r.eff >= 2) dcLog(D, "C'est super efficace !", "#ffd24a");
    else if(r.eff === 0) dcLog(D, `Ça n'affecte pas ${POKE[t.id].name}…`, "#9fb0c8");
    if(t.hp <= 0) dcKo(D, t, e, delay + 0.3);
  }
  /* l'Orbe Vie coute des PV a chaque attaque */
  const H2 = DC_HELD[e.held] || {};
  if(H2.recoil && aim.hits.length) e.hp = Math.max(1, e.hp - Math.round(e.maxHp * H2.recoil));
  dcReact(D, mv.type, aim.tiles, delay);
}
function dcKo(D, t, by, delay){
  dcLog(D, `${POKE[t.id].name} est K.O. !`, t.side === "ally" ? "#ff5c8a" : "#cbd6e6");
  dcFx(D, {k:"ko", e:t, at:delay});
  if(t.side === "foe"){
    D.kos++;
    const gain = Math.round(t.lv * POKE[t.id].bst / 32);
    for(const a of D.ents) if(a.side === "ally" && a.hp > 0) dcGainXp(D, a, gain);
    /* le recrutement : un Pokemon vaincu peut demander a rejoindre l'equipe */
    const team = D.ents.filter(a=>a.side === "ally" && a.hp > 0).length;
    if(!t.boss && team < DC_TEAM_MAX && !D.recruitAsk && dcRand(D) < 0.22)
      D.recruitAsk = {id:t.id, lv:t.lv};
    if(t.boss){
      if(D.endless){
        D.bossesDown = (D.bossesDown || 0) + 1; D.boss = null; D.scen = null; D.warn = null;
        D.tiles[dcIdx(t.x, t.y)] = T_STAIRS; D.stairs = {x:t.x, y:t.y};
        for(const p of D.ents) if(p.pylon) p.hp = 0;
        dcLog(D, `${POKE[t.id].name} tombe ! Un escalier s'ouvre vers les profondeurs.`, "#35f0d6");
        D.say = {who:"pz", txt:"Gardien vaincu. La Descente continue : un renfort de plus vous attend à la surface."};
      } else D.won = true;
    }
    if(t.pylon) dcPylonDown(D, t);
    /* un ennemi d'elite laisse parfois un objet tenu */
    if(t.eliteDrop || (D.mod === "elite" && dcRand(D) < 0.12)) D.items.push({x:t.x, y:t.y, k:"h:" + dcRandHeld(D)});
  } else {
    /* le Rappel releve automatiquement le premier Pokemon K.O. */
    const rv = D.bag.findIndex(i=>i.k === "revive");
    if(rv >= 0){
      D.bag.splice(rv, 1); t.hp = Math.round(t.maxHp * 0.5); D.healUsed = true;
      dcLog(D, `Rappel ! ${POKE[t.id].name} se relève.`, "#5ce07a");
      dcFx(D, {k:"heal", e:t, at:delay + 0.2});
      return;
    }
    if(t.held){ D.bag.length < DC_BAG ? D.bag.push({k:"h:" + t.held}) : null; t.held = null; }
    if(t.leader){
      t.leader = false;
      const next = D.ents.find(a=>a.side === "ally" && a.hp > 0);
      if(next){ next.leader = true; dcLog(D, `${POKE[next.id].name} prend la tête de l'équipe.`, "#ffd24a"); }
    }
    D.lost.push(t.id);
  }
}
/* l'IA d'un combattant : la meilleure capacite a portee, sinon s'approcher */
function dcBestAttack(D, e){
  const mvs = dcMoves(e.id);
  let best = null;
  for(let s = mvs.length - 1; s >= 0; s--){
    if(e.cds[s] > 0) continue;
    const aim = dcAim(D, e, s);
    if(!aim) continue;
    const val = aim.hits.length * mvs[s].pw * (mvs[s].type && dcFighter(e).types.includes(mvs[s].type) ? 1.5 : 1)
      * aim.hits.reduce((m, h)=>Math.max(m, typeMult(mvs[s].type, POKE[h.id].types)), 0.5);
    if(!best || val > best.val) best = {slot:s, aim, val};
  }
  return best;
}
function dcApproach(D, e, tgt){
  /* un partenaire contourne ses coequipiers ; s'il n'y a pas d'autre passage, il attend son tour */
  const p = (!e.leader && e.side === "ally" && dcPath(D, e.x, e.y, tgt.x, tgt.y, e, true)) || dcPath(D, e.x, e.y, tgt.x, tgt.y, e);
  if(p && p.length) return dcStep(D, e, p[0][0] - e.x, p[0][1] - e.y);
  const dx = Math.sign(tgt.x - e.x), dy = Math.sign(tgt.y - e.y);
  return dcStep(D, e, dx, dy) || dcStep(D, e, dx, 0) || dcStep(D, e, 0, dy);
}
function dcNearest(D, e, side, maxd){
  let best = null, bd = maxd + 1;
  for(const o of D.ents){ if(o.hp <= 0 || o.side !== side || (o.boss && o.shield)) continue;
    const d = Math.max(Math.abs(o.x - e.x), Math.abs(o.y - e.y)); if(d < bd){ bd = d; best = o; } }
  return best;
}
function dcAI(D, e, delay){
  if(e.side === "foe"){
    /* un ennemi se reveille de pres, et lache prise quand l'equipe s'eloigne */
    const near = dcNearest(D, e, "ally", e.awake ? 9 : 4);
    if(!near){ if(!e.boss) e.awake = false;
      if(dcRand(D) < 0.3){ const d = DC_DIRS[dcInt(D, 0, 7)]; dcStep(D, e, d[0], d[1]); } return; }
    e.awake = true;
  }
  if(e.pylon) return false;
  const foeSide = e.side === "ally" ? "foe" : "ally";
  /* le gardien a un rythme : un tour sur trois, il reprend son souffle — une fenetre a saisir */
  if(e.boss){
    /* il reprend son souffle un tour sur trois ; un tour sur deux quand il puise dans ses relais */
    e.beat = ((e.beat || 0) + 1) % (e.shield && D.scen && D.scen.phase === 2 ? 2 : 3);
    if(e.beat === 0){ if(!e.breathSaid){ e.breathSaid = true; dcLog(D, `${POKE[e.id].name} reprend son souffle…`, "#9fb0c8"); } return false; }
  }
  if(e.side === "ally" && dcThreat(D, e.x, e.y, e)){
    const s2 = dcSafeTile(D, e);
    if(s2){ const p = dcPath(D, e.x, e.y, s2[0], s2[1], e); if(p && p.length){ dcStep(D, e, p[0][0] - e.x, p[0][1] - e.y); return false; } }
  }
  const atk = dcBestAttack(D, e);
  if(atk){ dcUse(D, e, atk.slot, atk.aim, delay); return true; }
  const tgt = dcNearest(D, e, foeSide, e.side === "ally" ? 5 : 8);
  if(tgt && (e.side === "foe" || dcVisible(D, tgt.x, tgt.y))){ dcApproach(D, e, tgt); return false; }
  /* un partenaire suit son meneur */
  if(e.side === "ally" && !e.leader){
    const L = dcLeader(D);
    if(L && Math.max(Math.abs(L.x - e.x), Math.abs(L.y - e.y)) > 1) dcApproach(D, e, L);
  }
  return false;
}
/* une case est-elle menacee par la deflagration annoncee ? */
function dcThreat(D, x, y, e){
  /* les cases qui blessent d'elles-memes : corruption, piege, incendie, lave (sauf pour un type Feu) */
  const t = dcTile(D, x, y);
  if(t === T_CORR || t === T_SPIKE || (D.terrainT && D.terrainT[dcIdx(x, y)] < 0)) return true;
  if(t === T_LAVA && !(e && POKE[e.id].types.includes(10))) return true;
  if(!D.warn) return false;
  if((D.warn.safe || []).some(([a, b])=>a === x && b === y)) return false;
  return D.warn.tiles.some(([a, b])=>a === x && b === y);
}
/* la case libre et sure la plus proche : la ou se mettre a l'abri */
function dcSafeTile(D, e){
  let best = null, bd = 1e9;
  for(let oy = -6; oy <= 6; oy++) for(let ox = -6; ox <= 6; ox++){
    const x = e.x + ox, y = e.y + oy;
    if(!dcPassable(D, e, x, y) || dcThreat(D, x, y, e)) continue;
    if(D.ents.some(o=>o.hp > 0 && o !== e && o.x === x && o.y === y)) continue;
    const d = Math.max(Math.abs(ox), Math.abs(oy));
    if(d < bd){ bd = d; best = [x, y]; }
  }
  return best;
}
/* le meneur en mode automatique : s'abriter, combattre, ramasser, explorer, descendre */
function dcAutoLeader(D){
  const L = dcLeader(D);
  const useIt = dcAutoItems(D);
  if(useIt) return useIt;
  if(dcThreat(D, L.x, L.y, L)){ const s2 = dcSafeTile(D, L); if(s2) return {k:"goto", x:s2[0], y:s2[1]}; }
  const atk = dcBestAttack(D, L);
  if(atk) return {k:"attack", slot:atk.slot, aim:atk.aim};
  const foe = D.ents.find(o=>o.side === "foe" && o.hp > 0 && dcVisible(D, o.x, o.y));
  if(foe) return {k:"goto", x:foe.x, y:foe.y};
  /* une baie apercue reste connue : sinon, vue d'une case et pas de la voisine, elle fait osciller le meneur */
  /* sac plein : on ne vise plus que les Pokedollars (sinon l'objet reste aux pieds du meneur, qui l'attend indefiniment) */
  const it = D.items.filter(i=>D.seen[dcIdx(i.x, i.y)] && !(i.x === L.x && i.y === L.y) && (i.k.startsWith("$") || D.bag.length < DC_BAG)).sort((p, q)=>Math.max(Math.abs(p.x - L.x), Math.abs(p.y - L.y)) - Math.max(Math.abs(q.x - L.x), Math.abs(q.y - L.y)))[0];
  if(it && dcPath(D, L.x, L.y, it.x, it.y, L)) return {k:"goto", x:it.x, y:it.y};
  /* la case a explorer : la plus proche EN MARCHANT (parcours en largeur sur les cases praticables
     par le meneur). Une fois choisie, on s'y tient, sinon le meneur oscille entre deux buts. */
  const isFrontier = (x, y) => D.seen[dcIdx(x, y)] && dcPassable(D, L, x, y)
    && DC_DIRS.some(([dx, dy])=>!D.seen[dcIdx(x + dx, y + dy)] && dcTile(D, x + dx, y + dy) !== T_WALL);
  if(D.autoGoal && isFrontier(D.autoGoal[0], D.autoGoal[1]) && !(L.x === D.autoGoal[0] && L.y === D.autoGoal[1]))
    return {k:"goto", x:D.autoGoal[0], y:D.autoGoal[1]};
  D.autoGoal = null;
  let best = null;
  {
    const seenB = new Uint8Array(DC_W * DC_H), q = [dcIdx(L.x, L.y)];
    seenB[q[0]] = 1;
    for(let h = 0; h < q.length && !best; h++){
      const c = q[h], cx = c % DC_W, cy = Math.floor(c / DC_W);
      if((cx !== L.x || cy !== L.y) && isFrontier(cx, cy)){ best = [cx, cy]; break; }
      for(const [dx, dy] of DC_DIRS){
        const nx = cx + dx, ny = cy + dy, ni = dcIdx(nx, ny);
        if(seenB[ni] || !D.seen[ni] || !dcPassable(D, L, nx, ny)) continue;
        if(dx && dy && (dcTile(D, cx + dx, cy) === T_WALL || dcTile(D, cx, cy + dy) === T_WALL)) continue;
        seenB[ni] = 1; q.push(ni);
      }
    }
  }
  if(best){ D.autoGoal = best; return {k:"goto", x:best[0], y:best[1]}; }
  if(D.stairs && D.seen[dcIdx(D.stairs.x, D.stairs.y)]) return {k:"goto", x:D.stairs.x, y:D.stairs.y, descend:true};
  /* l'etage du gardien n'a pas d'escalier : on va le chercher */
  const b = D.boss && D.ents.find(e=>e.uid === D.boss && e.hp > 0);
  if(b) return {k:"goto", x:b.x, y:b.y};
  return {k:"wait"};
}
/* un tour complet : le meneur, puis les partenaires, puis les ennemis */
function dcTurn(D, act){
  const L = dcLeader(D);
  if(!L || D.over) return false;
  D.fx = []; let delay = 0;
  const cdStep = a => a.cds.map(c=>Math.max(0, c - 1 - ((DC_HELD[a.held] || {}).cdx || 0)));
  L.cds = cdStep(L);
  if(act.k === "move"){
    if(!dcStep(D, L, act.dx, act.dy)) return false;
  } else if(act.k === "attack"){
    if(L.cds[act.slot] > 0 && act.cdChecked !== false){ return false; }
    dcUse(D, L, act.slot, act.aim, delay); delay += 0.34;
  } else if(act.k === "item"){
    if(!dcUseItem(D, act.idx, act.target)) return false;
    delay += 0.2;
  }
  /* ramasser ce qui est au sol */
  dcPickup(D, L);
  /* les cases speciales sous le meneur : source, echoppe */
  const lt = dcTile(D, L.x, L.y);
  if(lt === T_SPRING && !D.springUsed){ D.springUsed = true;
    for(const a of D.ents) if(a.side === "ally" && a.hp > 0){ a.hp = a.maxHp; a.cds = [0,0,0,0]; dcFx(D, {k:"heal", e:a, at:0.1}); }
    dcLog(D, "La source restaure toute l'équipe.", "#5ce07a"); }
  if(lt === T_SHOP) D.shopOpen = true;
  for(const a of D.ents) if(a.side === "ally" && a.hp > 0 && a !== L){ a.cds = cdStep(a); if(dcAI(D, a, delay)) delay += 0.34; }
  dcVision(D);
  dcBossTurn(D, delay);
  for(const f of D.ents) if(f.side === "foe" && f.hp > 0){ f.cds = f.cds.map(c=>Math.max(0, c - 1)); if(dcAI(D, f, delay)) delay += 0.34; }
  dcTerrainTurn(D, delay);
  if(D.buffT > 0) D.buffT--;
  D.ents = D.ents.filter(e=>e.hp > 0 || e._dyingAt);
  D.turn++;
  /* regeneration naturelle, comme dans Donjon Mystere : un peu de PV a chaque pas */
  for(const a of D.ents) if(a.side === "ally" && a.hp > 0 && a.hp < a.maxHp){ a.regen = (a.regen || 0) + a.maxHp * (1 / 70 + ((DC_HELD[a.held] || {}).regen || 0));
    if(a.regen >= 1){ const g = Math.floor(a.regen); a.hp = Math.min(a.maxHp, a.hp + g); a.regen -= g; } }
  dcVision(D);
  D.animEnd = delay + 0.25;
  if(!D.ents.some(a=>a.side === "ally" && a.hp > 0)) D.over = "lost";
  if(D.won) D.over = "won";
  return true;
}

/* le recrutement accepte : le Pokemon rejoint l'equipe, a cote du meneur */
function dcAcceptRecruit(D, ok){
  const r = D.recruitAsk; D.recruitAsk = null;
  if(!r || !ok) return false;
  const L = dcLeader(D);
  const spot = DC_DIRS.map(([dx, dy])=>[L.x + dx, L.y + dy]).find(([x, y])=>dcTile(D, x, y) !== T_WALL && !D.ents.some(o=>o.hp > 0 && o.x === x && o.y === y));
  if(!spot) return false;
  dcMakeEnt(D, "ally", r.id, r.lv, spot[0], spot[1]); D.recruits.push(r.id);
  dcLog(D, `${POKE[r.id].name} rejoint l'équipe !`, "#5ce07a");
  return true;
}

/* ============================================================
   LE GARDIEN DU CINQUIÈME ÉTAGE
   ============================================================ */
function dcBossTurn(D, delay){
  const b = D.ents.find(e=>e.uid === D.boss && e.hp > 0);
  if(!b || !D.scen) return;
  /* la deflagration annoncee au tour precedent tombe maintenant */
  if(D.warn){
    const safe = new Set((D.warn.safe || []).map(([x, y])=>x + "," + y));
    const hitSet = new Set(D.warn.tiles.map(([x, y])=>x + "," + y));
    for(const a of D.ents){
      if(a.side !== "ally" || a.hp <= 0) continue;
      const key = a.x + "," + a.y;
      if(hitSet.has(key) && !safe.has(key)){
        const dmg = Math.round(a.maxHp * (D.warn.ult ? 0.4 : 0.18));
        a.hp = Math.max(0, a.hp - dmg);
        dcFx(D, {k:"hit", e:a, dmg, eff:1, at:delay + 0.1, hp:a.hp, color:"#ff3d7f"});
        if(a.hp <= 0) dcKo(D, a, b, delay + 0.2);
      }
    }
    dcFx(D, {k:"boom", tiles:D.warn.tiles, safe:D.warn.safe, at:delay});
    D.warn = null;
    if(b.shield && D.scen.phase === 3) b.shield = false;
    return;
  }
  const S2 = D.scen, rm = D.rooms[1];
  /* acte III : il se retranche derriere trois pylones ; la corruption ronge le bord de l'arene */
  if(S2.phase === 1 && b.hp < b.maxHp * 0.66){
    S2.phase = 2;
    /* la corruption avance d'abord, les pylones se dressent ensuite, hors de sa portee :
       un pylone sur une case corrompue serait inaccessible sans se blesser */
    dcCorrode(D, 1);
    dcPylons(D, b);
    dcLog(D, `${POKE[b.id].name} se retranche derrière trois pylônes !`, "#ff3d7f");
    D.say = {who:"pz", txt:"Il se retranche derrière trois relais ! Brisez les pylônes. Et attention : le bord de l'arène est corrompu."};
    return;
  }
  /* acte IV : l'attaque ultime ; la corruption avance encore */
  if(S2.phase === 2 && !b.shield && b.hp < b.maxHp * 0.33){
    S2.phase = 3; b.shield = true;
    dcCorrode(D, 2);
    /* l'attaque ultime : toute l'arene, sauf quelques cases sures */
    const tiles = [], safe = [];
    for(let x = rm.x; x < rm.x + rm.w; x++) for(let y = rm.y; y < rm.y + rm.h; y++) tiles.push([x, y]);
    /* une case sure a portee de chaque membre de l'equipe (2 a 3 pas), et quelques autres :
       l'ultime se lit et se dejoue, il ne se subit pas au hasard */
    for(const a of D.ents.filter(e=>e.side === "ally" && e.hp > 0)){
      for(let tries = 0; tries < 30; tries++){
        const x = a.x + dcInt(D, -3, 3), y = a.y + dcInt(D, -3, 3), d = Math.max(Math.abs(x - a.x), Math.abs(y - a.y));
        if(d < 2 || dcTile(D, x, y) === T_WALL || !dcRoomAt(D, x, y) || safe.some(([p, q])=>p === x && q === y)) continue;
        safe.push([x, y]); break;
      }
    }
    for(let k = 0; k < 3; k++) safe.push([dcInt(D, rm.x + 1, rm.x + rm.w - 2), dcInt(D, rm.y + 1, rm.y + rm.h - 2)]);
    D.warn = {tiles, safe, ult:true};
    dcLog(D, "DÉFRAGMENTATION TOTALE — rejoignez une case verte !", "#ff3d7f");
    D.say = {who:"pz", txt:"Il va tout effacer au prochain tour… Placez vos Pokémon sur les cases vertes !"};
    return;
  }
  /* tous les quatre tours : une deflagration annoncee autour de lui */
  S2.cd = (S2.cd || 3) - 1;
  if(S2.cd <= 0 && b.awake){
    S2.cd = 5;
    /* une deflagration annoncee, au motif de son type : rangees, croix, poursuite, eclats... */
    const tiles = dcBossPattern(D, b);
    D.warn = {tiles, safe:[]};
    dcLog(D, `${POKE[b.id].name} concentre son énergie…`, "#ff3d7f");
  }
}

/* ============================================================
   RUN : départ, étages, fin, sauvegarde
   ============================================================ */
function dcState(){ S.descente = S.descente || {runs:0, wins:0, bestFloor:0, kos:0, recruits:0, team:[]}; return S.descente; }
function dcNewRun(opts){
  const D = {v:2, endless:!!opts.endless, bossesDown:0, rs:(opts.seed || (Date.now() & 0xfffffff)) >>> 0, region:opts.region, hab:opts.hab, floor:1, turn:0,
             ents:[], items:[], log:[], fx:[], kos:0, lost:[], recruits:[], evos:[], auto:false, over:null,
             bag:[{k:"sitrus"}, {k:"revive"}], money:0, mod:"normal", doors:null, elites:0, healUsed:false};
  if(typeof heldActive === "function" && heldActive("exp")) D.bag.push({k:"potion"});
  opts.team.forEach((id, i)=>{ const e = dcMakeEnt(D, "ally", id, 6, 0, 0); if(i === 0) e.leader = true; });
  dcGenFloor(D);
  dcLog(D, `Étage 1 — ${HABITATS[D.hab].n}`, "#ffd24a");
  return D;
}
function dcDescend(D, door){
  D.floor++; D.autoGoal = null; D.mod = door || "normal";
  if(D.mod === "elite") D.elites = (D.elites || 0) + 1; D.doors = null; D.springUsed = false; D.shopOpen = false;
  for(const a of D.ents) a.sashUsed = false;
  dcGenFloor(D);
  dcLog(D, dcIsBossFloor(D) ? `Étage ${D.floor} — l'antre du gardien` : `Étage ${D.floor} — ${HABITATS[D.hab].n}`, "#ffd24a");
  for(const a of D.ents) if(a.side === "ally") a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp * 0.3));
}
/* sauvegarde : l'etat logique seul, sans les objets d'affichage */
function dcSerialize(D){
  return JSON.stringify(D, (k, v)=>k === "_f" || k === "fx" || k === "vis" || k === "px" || k === "py" || k === "shownHp" || k === "_dyingAt" ? undefined : v);
}
function dcRestore(json){
  const D = JSON.parse(json);
  D.fx = [];
  /* une sauvegarde de la livraison 1 n'avait ni sac ni Pokedollars */
  D.bag = D.bag || []; D.money = D.money || 0; D.mod = D.mod || "normal"; D.terrainT = D.terrainT || {};
  for(const e of D.ents){ e._f = null; dcFighter(e); e.px = e.x; e.py = e.y; e.shownHp = e.hp; DC_UID = Math.max(DC_UID, e.uid + 1); }
  dcVision(D);
  return D;
}
function dcSave(D){
  const st = dcState();
  st.saved = D.over ? null : dcSerialize(D);
  saveSoon();
}


/* ============================================================
   LIVRAISON 2 — LE SAC, LES OBJETS, LES PORTES
   ============================================================ */
const DC_BAG = 8;
/* objets a usage unique ; « auto » : pas de cible a choisir */
const DC_ITEMS = {
  sitrus: {n:"Baie Sitrus",       icon:"berry:sitrus", d:"Rend 40 % des PV au Pokémon le plus blessé.", price:60},
  nigma:  {n:"Baie Enigma",       icon:"berry:nigma",  d:"Rend 25 % des PV à toute l'équipe.", price:110},
  micle:  {n:"Baie Micle",        icon:"berry:micle",  d:"+30 % de dégâts pour toute l'équipe pendant 6 tours.", price:90},
  potion: {n:"Potion",            icon:"potion",       d:"Rend 60 % des PV au Pokémon le plus blessé.", price:90},
  revive: {n:"Rappel",            icon:"revive",       d:"Relève automatiquement le premier Pokémon mis K.O., avec la moitié de ses PV.", price:220},
  radar:  {n:"Orbe Cartographe",  icon:"radar",        d:"Révèle tout l'étage, escalier compris.", price:80},
  foudre: {n:"Orbe Foudre",       icon:"stone:thunder",d:"Frappe tous les ennemis en vue : 40 % de leurs PV.", price:140},
  ether:  {n:"Capsule d'énergie", icon:"exp:i_ct",     d:"Recharge toutes les capacités de l'équipe.", price:100}
};
/* les objets tenus de l'Expedition, transposes au tour par tour */
const DC_HELD = {
  i_orbe:{atk:1.3, recoil:0.06}, i_queue:{atk:1.6, taken:1.15}, i_relief:{regen:0.03}, i_bande:{atk:1.35, taken:1.2},
  i_foulard:{cdx:1}, i_lentille:{crit:0.2}, i_ceinture:{superx:1.5}, i_veste:{spd:1.45}, i_evolite:{nfe:1.5},
  i_casque:{thorns:0.08}, i_grelot:{drain:0.14}, i_ceinture_f:{sash:1}, i_griffe:{dodge:0.15}, i_loupe:{atk:1.18},
  i_roche:{hp:1.25}, i_ct:{pw:1.25}
};
const DC_HELD_TXT = {i_queue:"+60 % de dégâts, mais encaisse 15 % de plus.", i_relief:"Régénère 3 % des PV à chaque tour.",
  i_foulard:"Les capacités se rechargent deux fois plus vite.", i_bande:"+35 % de dégâts, mais encaisse 20 % de plus.",
  i_orbe:"+30 % de dégâts ; perd 6 % de ses PV à chaque attaque.", i_griffe:"15 % de chances d'esquiver une attaque.",
  i_ct:"+25 % de puissance sur toutes les capacités.", i_ceinture_f:"Survit à un coup fatal avec 1 PV, une fois par étage."};
function dcHeldDesc(k){ return DC_HELD_TXT[k] || (EXP_ITEMS[k] ? EXP_ITEMS[k].d : ""); }
function dcRandHeld(D){ const ks = Object.keys(DC_HELD); return ks[Math.floor(dcRand(D) * ks.length)]; }
function dcItemName(k){ if(k.startsWith("h:")) return EXP_ITEMS[k.slice(2)].n; if(k.startsWith("$")) return k.slice(1) + " ₽"; return DC_ITEMS[k].n; }
function dcItemIcon(k){ if(k.startsWith("h:")) return "exp:" + k.slice(2); if(k.startsWith("$")) return "treasure:stardust"; return DC_ITEMS[k].icon; }
/* le butin d'un etage : baies, Pokedollars, et selon la porte choisie */
function dcPlaceLoot(D, free){
  const rich = D.mod === "riche" || D.mod === "piege";
  const nItems = 2 + dcInt(D, 0, 1) + (rich ? 3 : 0), nMoney = 2 + dcInt(D, 0, 2);
  const pool = ["sitrus","sitrus","sitrus","potion","nigma","micle","radar","foudre","ether","revive"];
  const place = k => { const r = D.rooms[Math.floor(dcRand(D) * D.rooms.length)], p = free(r); if(p) D.items.push({x:p[0], y:p[1], k}); };
  for(let k = 0; k < nItems; k++) place(pool[Math.floor(dcRand(D) * pool.length)]);
  for(let k = 0; k < nMoney; k++) place("$" + Math.round((15 + dcInt(D, 0, 30)) * D.floor * (rich ? 2 : 1)));
  if(dcRand(D) < (D.mod === "elite" ? 1 : 0.35)) place("h:" + dcRandHeld(D));
  /* l'etage piege : des pieges visibles, qui blessent celui qui marche dessus */
  if(D.mod === "piege") for(let k = 0; k < 10; k++){
    const r = D.rooms[1 + Math.floor(dcRand(D) * (D.rooms.length - 1))], p = r && free(r);
    if(p && D.tiles[dcIdx(p[0], p[1])] === T_FLOOR) D.tiles[dcIdx(p[0], p[1])] = T_SPIKE;
  }
}
function dcPickup(D, L){
  const it = D.items.find(i=>i.x === L.x && i.y === L.y);
  if(!it) return;
  if(it.k.startsWith("$")){ const n = +it.k.slice(1); D.money += n; D.items = D.items.filter(i=>i !== it); dcLog(D, `+${n} Pokédollars.`, "#ffd24a"); return; }
  if(D.bag.length >= DC_BAG){ if(!it.warned){ it.warned = true; dcLog(D, "Le sac est plein.", "#ff8a5c"); } return; }
  D.items = D.items.filter(i=>i !== it);
  D.bag.push({k:it.k});
  dcLog(D, `${dcItemName(it.k)} ramassé${it.k.startsWith("h:") ? " (objet à équiper)" : ""}.`, "#8ff7e8");
}
/* utiliser un objet du sac : un tour, comme dans Donjon Mystere */
function dcUseItem(D, idx, targetUid){
  const it = D.bag[idx];
  if(!it) return false;
  const allies = D.ents.filter(a=>a.side === "ally" && a.hp > 0);
  const weakest = allies.slice().sort((a, b)=>a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if(it.k.startsWith("h:")){
    /* equiper un objet tenu : l'ancien retourne au sac */
    const tgt = allies.find(a=>a.uid === targetUid) || dcLeader(D);
    const k = it.k.slice(2);
    D.bag.splice(idx, 1);
    if(tgt.held) D.bag.push({k:"h:" + tgt.held});
    tgt.held = k; const r = tgt.hp / tgt.maxHp; tgt._f = null; dcFighter(tgt); tgt.hp = Math.max(1, Math.round(tgt.maxHp * r));
    dcLog(D, `${POKE[tgt.id].name} tient ${EXP_ITEMS[k].n}.`, "#8ff7e8");
    return true;
  }
  if(["sitrus","potion","nigma"].includes(it.k)) D.healUsed = true;
  const heal = (e, f) => { const g = Math.round(e.maxHp * f); e.hp = Math.min(e.maxHp, e.hp + g); dcFx(D, {k:"heal", e, at:0.05}); return g; };
  switch(it.k){
    case "sitrus": dcLog(D, `${POKE[weakest.id].name} récupère ${heal(weakest, 0.4)} PV.`, "#5ce07a"); break;
    case "potion": dcLog(D, `${POKE[weakest.id].name} récupère ${heal(weakest, 0.6)} PV.`, "#5ce07a"); break;
    case "nigma": for(const a of allies) heal(a, 0.25); dcLog(D, "Toute l'équipe récupère des PV.", "#5ce07a"); break;
    case "micle": D.buffT = 6; dcLog(D, "L'équipe est galvanisée : +30 % de dégâts.", "#ffd24a"); break;
    case "ether": for(const a of allies) a.cds = [0,0,0,0]; dcLog(D, "Toutes les capacités sont rechargées.", "#4fdcff"); break;
    case "radar": for(let i = 0; i < D.seen.length; i++) if(D.tiles[i] !== T_WALL) D.seen[i] = 1; dcLog(D, "L'étage entier se révèle.", "#c9a6ff"); break;
    case "foudre": {
      let n = 0;
      for(const f of D.ents) if(f.side === "foe" && f.hp > 0 && dcVisible(D, f.x, f.y)){
        const dmg = Math.max(1, Math.round(f.maxHp * 0.4)); f.hp = Math.max(0, f.hp - dmg); n++;
        dcFx(D, {k:"hit", e:f, dmg, eff:1, at:0.1, hp:f.hp, color:"#ffe45e"});
        if(f.hp <= 0) dcKo(D, f, dcLeader(D), 0.2);
      }
      dcLog(D, n ? `La foudre frappe ${n} ennemi(s) !` : "La foudre ne trouve aucune cible.", "#ffe45e");
      break; }
    case "revive": return false;                 /* passif : il agit tout seul */
    default: return false;
  }
  D.bag.splice(idx, 1);
  return true;
}
/* les portes : deux ou trois etages possibles, chacun avec son caractere */
const DC_DOORS = {
  normal:   {n:"Couloirs ordinaires", c:"#9fb0c8", d:"Un étage sans surprise."},
  riche:    {n:"Étage riche",         c:"#ffd24a", d:"Trois objets de plus, Pokédollars doublés."},
  elite:    {n:"Étage d'élite",       c:"#ff3d7f", d:"Ennemis plus forts et plus nombreux ; un objet tenu garanti."},
  source:   {n:"Source",              c:"#5ce07a", d:"Un étage paisible : une source restaure toute l'équipe."},
  marchand: {n:"Échoppe Kecleon",     c:"#4fdcff", d:"Un marchand attend, Pokédollars contre objets."},
  piege:    {n:"Étage piégé",         c:"#ff8a3d", d:"Des pièges partout, mais un butin doublé."}
};
function dcRollDoors(D){
  const keys = ["riche","elite","source","marchand","piege","normal"], out = [];
  while(out.length < (dcRand(D) < 0.5 ? 2 : 3)){ const k = keys[Math.floor(dcRand(D) * keys.length)]; if(!out.includes(k)) out.push(k); }
  return out;
}
/* l'echoppe : quatre objets, payes en Pokedollars */
function dcShopStock(D){
  const pool = Object.keys(DC_ITEMS), out = [];
  while(out.length < 4){ const k = pool[Math.floor(dcRand(D) * pool.length)]; if(!out.some(o=>o.k === k)) out.push({k, price:Math.round(DC_ITEMS[k].price * (0.8 + D.floor * 0.15))}); }
  if(dcRand(D) < 0.6){ const h = dcRandHeld(D); out.push({k:"h:" + h, price:Math.round(260 + 60 * D.floor)}); }
  return out;
}
function dcBuy(D, i){
  const o = D.shop && D.shop[i];
  if(!o || o.sold || D.money < o.price || D.bag.length >= DC_BAG) return false;
  D.money -= o.price; o.sold = true; D.bag.push({k:o.k});
  dcLog(D, `${dcItemName(o.k)} acheté.`, "#4fdcff");
  return true;
}

/* ============================================================
   LIVRAISON 3 — LE TERRAIN RÉAGIT
   ============================================================ */
function dcTerrainGen(D){
  const H = {route:T_GRASS, foret:T_GRASS, eaux:T_WATER, grotte:T_WATER, ruines:T_GRASS, foyer:T_LAVA}[D.hab] || T_GRASS;
  const dense = {foret:3, eaux:3, foyer:2, route:2}[D.hab] || 1;
  for(const r of D.rooms.slice(1)){
    if(r.w < 7 || r.h < 6) continue;
    for(let k = 0; k < dense; k++){
      if(dcRand(D) < 0.35) continue;
      /* une flaque a l'interieur, avec toujours un anneau de sol autour : le passage reste ouvert */
      const cx = dcInt(D, r.x + 2, r.x + r.w - 3), cy = dcInt(D, r.y + 2, r.y + r.h - 3), rad = dcInt(D, 1, 2);
      for(let x = cx - rad; x <= cx + rad; x++) for(let y = cy - rad; y <= cy + rad; y++){
        if(x <= r.x || y <= r.y || x >= r.x + r.w - 1 || y >= r.y + r.h - 1) continue;
        if(Math.hypot(x - cx, y - cy) > rad + 0.5 || D.tiles[dcIdx(x, y)] !== T_FLOOR) continue;
        D.tiles[dcIdx(x, y)] = H;
      }
    }
  }
  D.terrainT = {};
}
const DC_REACT_TXT = {ice:"L'eau gèle : un passage s'ouvre !", burn:"Les herbes s'embrasent !", shock:"L'eau conduit la foudre !",
                      cool:"La lave se fige en roche.", melt:"La glace fond."};
function dcReactLog(D, k){ D.reacted = D.reacted || {}; if(D.reacted[k] === undefined || D.turn - D.reacted[k] > 6){ D.reacted[k] = D.turn; dcLog(D, DC_REACT_TXT[k], "#8ff7e8"); } }
/* une capacite touche des cases : le terrain reagit a son type */
function dcReact(D, type, tiles, delay){
  D.terrainT = D.terrainT || {};
  let shocked = false;
  for(const [x, y] of tiles){
    const i = dcIdx(x, y), t = D.tiles[i];
    if(type === 15 && t === T_WATER){ D.tiles[i] = T_ICE; D.terrainT[i] = 14; dcReactLog(D, "ice"); dcFx(D, {k:"terrain", x, y, c:"#cfefff", at:delay + 0.2}); }
    else if(type === 10 && t === T_GRASS){ D.tiles[i] = T_ASH; D.terrainT[i] = -3; dcReactLog(D, "burn"); }
    else if(type === 10 && t === T_ICE){ D.tiles[i] = T_WATER; delete D.terrainT[i]; dcReactLog(D, "melt"); }
    else if(type === 11 && t === T_LAVA){ D.tiles[i] = T_ROCK; dcReactLog(D, "cool"); dcFx(D, {k:"terrain", x, y, c:"#6a5a50", at:delay + 0.2}); }
    else if(type === 13 && t === T_WATER && !shocked){
      /* la foudre parcourt tout le plan d'eau touche */
      shocked = true;
      const seen = new Set([i]), q = [i];
      for(let h = 0; h < q.length; h++){ const c = q[h], cx = c % DC_W, cy = Math.floor(c / DC_W);
        for(const [dx, dy] of DC_DIRS){ const n = dcIdx(cx + dx, cy + dy); if(!seen.has(n) && D.tiles[n] === T_WATER){ seen.add(n); q.push(n); } } }
      for(const f of D.ents){ if(f.side !== "foe" || f.hp <= 0 || !seen.has(dcIdx(f.x, f.y))) continue;
        const dmg = Math.max(1, Math.round(f.maxHp * 0.25)); f.hp = Math.max(0, f.hp - dmg);
        dcFx(D, {k:"hit", e:f, dmg, eff:1, at:delay + 0.3, hp:f.hp, color:"#ffe45e"});
        if(f.hp <= 0) dcKo(D, f, null, delay + 0.4); }
      dcReactLog(D, "shock");
      dcFx(D, {k:"shock", tiles:[...seen].map(c=>[c % DC_W, Math.floor(c / DC_W)]), at:delay + 0.25});
    }
  }
}
/* chaque tour : l'incendie se propage, la glace fond, la lave et les pieges blessent */
function dcTerrainTurn(D, delay){
  D.terrainT = D.terrainT || {};
  const fire = Object.keys(D.terrainT).filter(i=>D.terrainT[i] < 0).map(Number);
  for(const i of fire){
    D.terrainT[i]++;
    const x = i % DC_W, y = Math.floor(i / DC_W);
    /* le feu gagne les herbes voisines */
    for(const [dx, dy] of DC_DIRS){ const n = dcIdx(x + dx, y + dy);
      if(D.tiles[n] === T_GRASS && dcRand(D) < 0.45){ D.tiles[n] = T_ASH; D.terrainT[n] = -3; } }
    if(D.terrainT[i] >= 0) delete D.terrainT[i];
  }
  for(const i of Object.keys(D.terrainT).map(Number)){
    if(D.terrainT[i] > 0){ D.terrainT[i]--; if(D.terrainT[i] === 0){ delete D.terrainT[i]; if(D.tiles[i] === T_ICE) D.tiles[i] = T_WATER; } }
  }
  for(const e of D.ents){
    if(e.hp <= 0) continue;
    const i = dcIdx(e.x, e.y), t = D.tiles[i];
    let frac = 0, why = "";
    if(t === T_LAVA && !POKE[e.id].types.includes(10)){ frac = 0.1; why = "brûle dans la lave"; }
    if(D.terrainT[i] < 0 && !POKE[e.id].types.includes(10)){ frac = 0.12; why = "est pris dans l'incendie"; }
    if(t === T_CORR && e.side === "ally"){ frac = 0.12; why = "est rongé par la corruption"; }
    if(t === T_SPIKE && e.side === "ally"){ frac = 0.1; why = "marche sur un piège"; D.tiles[i] = T_FLOOR; }
    if(!frac) continue;
    const dmg = Math.max(1, Math.round(e.maxHp * frac));
    e.hp = Math.max(0, e.hp - dmg);
    dcFx(D, {k:"hit", e, dmg, eff:1, at:delay + 0.1, hp:e.hp, color:"#ff8a3d"});
    if(e.side === "ally") dcLog(D, `${POKE[e.id].name} ${why} (-${dmg}).`, "#ff8a5c");
    if(e.hp <= 0) dcKo(D, e, null, delay + 0.2);
  }
}

/* ============================================================
   LIVRAISON 3 — LES GARDIENS EN ACTES
   ============================================================ */
/* les motifs annonces, selon le type du gardien */
const DC_BOSS_PATTERNS = {
  10:["lines","ring"], 15:["scatter","ring"], 13:["chase","nova"], 11:["lines","chase"], 5:["cross","ring"], 6:["cross","scatter"],
  14:["chase","nova"], 16:["scatter","cross"], 3:["scatter","lines"], 9:["cross","lines"], 12:["scatter","nova"],
  8:["chase","scatter"], 17:["chase","cross"]
};
function dcBossPattern(D, b){
  const rm = D.rooms[1], kit = DC_BOSS_PATTERNS[POKE[b.id].types[0]] || DC_BOSS_PATTERNS[POKE[b.id].types[1]] || ["ring","scatter"];
  const k = kit[(D.scen.pat = (D.scen.pat || 0) + 1) % kit.length];
  const tiles = [], add = (x, y) => { if(x >= rm.x && y >= rm.y && x < rm.x + rm.w && y < rm.y + rm.h && dcTile(D, x, y) !== T_WALL) tiles.push([x, y]); };
  const allies = D.ents.filter(e=>e.side === "ally" && e.hp > 0);
  switch(k){
    case "ring": for(let ox = -3; ox <= 3; ox++) for(let oy = -3; oy <= 3; oy++) if(Math.max(Math.abs(ox), Math.abs(oy)) >= 2) add(b.x + ox, b.y + oy); break;
    case "nova": for(let ox = -4; ox <= 4; ox++) for(let oy = -4; oy <= 4; oy++){ const d = Math.abs(ox) + Math.abs(oy); if(d >= 2 && d <= 4) add(b.x + ox, b.y + oy); } break;
    case "cross": for(let k2 = -12; k2 <= 12; k2++){ add(b.x + k2, b.y); add(b.x, b.y + k2); add(b.x + k2, b.y + 1); add(b.x + 1, b.y + k2); } break;
    case "lines": { const off = D.turn % 2; for(let y = rm.y; y < rm.y + rm.h; y++) if((y + off) % 3 === 0) for(let x = rm.x; x < rm.x + rm.w; x++) add(x, y); break; }
    case "chase": for(const a of allies) for(let ox = -1; ox <= 1; ox++) for(let oy = -1; oy <= 1; oy++) add(a.x + ox, a.y + oy); break;
    case "scatter": for(let n = 0; n < 26; n++) add(dcInt(D, rm.x, rm.x + rm.w - 1), dcInt(D, rm.y, rm.y + rm.h - 1)); break;
  }
  return tiles;
}
/* la corruption ronge l'arene de l'exterieur, d'un anneau a chaque acte */
function dcCorrode(D, depth){
  const rm = D.rooms[1];
  for(let x = rm.x; x < rm.x + rm.w; x++) for(let y = rm.y; y < rm.y + rm.h; y++){
    const d = Math.min(x - rm.x, y - rm.y, rm.x + rm.w - 1 - x, rm.y + rm.h - 1 - y);
    if(d < depth && D.tiles[dcIdx(x, y)] !== T_WALL) D.tiles[dcIdx(x, y)] = T_CORR;
  }
}
/* les pylones : tant qu'ils tiennent, le gardien est intouchable */
function dcPylons(D, b){
  /* trois relais autour du gardien, a mi-chemin du centre : on doit bouger, sans traverser toute l'arene */
  const rm = D.rooms[1], cx = Math.floor(rm.x + rm.w / 2), cy = Math.floor(rm.y + rm.h / 2);
  const spots = [[cx - 5, cy - 3], [cx + 5, cy - 3], [cx, cy + 5]].map(([x, y])=>{
    for(let k = 0; k < 9; k++){ const px = x + (k % 3) - 1, py = y + Math.floor(k / 3) - 1;
      if(dcTile(D, px, py) !== T_WALL && dcTile(D, px, py) !== T_CORR && !D.ents.some(o=>o.hp > 0 && o.x === px && o.y === py)) return [px, py]; }
    return [x, y]; });
  for(const [x, y] of spots){
    const p = dcMakeEnt(D, "foe", b.id, b.lv - 3, x, y, {pylon:true, awake:true});
    p.maxHp = p.hp = p.shownHp = Math.round(b.maxHp * 0.06);
  }
  b.shield = true;
}
function dcPylonDown(D, p){
  dcLog(D, "Un pylône s'effondre !", "#35f0d6");
  const left = D.ents.filter(e=>e.pylon && e.hp > 0 && e !== p).length;
  if(!left){ const b = D.ents.find(e=>e.uid === D.boss); if(b && D.scen.phase === 2){ b.shield = false;
    dcLog(D, "Relais coupés : le gardien est à découvert !", "#35f0d6"); D.say = {who:"pz", txt:"Les relais sont tombés. Il est vulnérable : frappez !"}; } }
}
