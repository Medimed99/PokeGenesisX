/* ============================================================
   59m — LA BRÈCHE · LES CARTES
   Retour de jeu : chaque carte etait un sol infini, sans relief,
   sans lieu ou aller. Le monde est desormais genere par morceaux
   de 480 px, a partir de la graine de la run : unique a chaque
   partie, identique pour tous dans la Breche du jour.

   Chaque morceau peut porter :
   · du RELIEF : des obstacles qui bloquent, et font des goulets ;
   · des TERRAINS : eau qui ralentit, lave qui brule, hautes herbes ;
   · des LIEUX : caches, autels, nids de corruption, Pokemon captifs ;
   · l'ELEMENT SIGNATURE de l'habitat, qui change la facon de jouer.
   ============================================================ */
const BR_CHUNK = 480;

const BR_TERRAIN = {
  route:  {tag:"Arbres à baies", obs:{n:[2,4], kinds:["tree","tree","rock"]},
           zone:{k:"grass", p:0.8, n:2, r:[50,90]}, mark:{k:"arbre", p:0.22, n:"Arbre à baies"}},
  foret:  {tag:"Sous-bois dense", obs:{n:[5,8], kinds:["tree","tree","tree","rock"]},
           zone:{k:"grass", p:0.9, n:3, r:[50,90]}, mark:{k:"souche", p:0.16, n:"Souche ancienne"}},
  eaux:   {tag:"Remous", obs:{n:[1,3], kinds:["rock"]},
           zone:{k:"water", p:0.75, n:2, r:[70,130]}, mark:{k:"remous", p:0.28, n:"Remous"}},
  grotte: {tag:"Obscurité", obs:{n:[4,7], kinds:["pillar","pillar","rock"]},
           zone:null, mark:{k:"cristal", p:0.22, n:"Cristal géant"}, dark:true},
  ruines: {tag:"Glyphes", obs:{n:[3,6], kinds:["column","column","rock"]},
           zone:{k:"grass", p:0.4, n:1, r:[40,70]}, mark:{k:"glyphe", p:0.3, n:"Dalle-glyphe"}},
  foyer:  {tag:"Geysers et lave", obs:{n:[2,4], kinds:["basalt","basalt"]},
           zone:{k:"lava", p:0.7, n:2, r:[55,105]}, mark:{k:"geyser", p:0.3, n:"Geyser"}}
};
const BR_POI = {
  cache:  {n:"Cache de données", c:"#35f0d6", g:"▣", hold:0.8},
  autel:  {n:"Autel",            c:"#ffd24a", g:"✧", hold:2.2},
  captif: {n:"Pokémon captif",   c:"#5ce07a", g:"◈", hold:2.6},
  arbre:  {n:"Arbre à baies",    c:"#ff6a5a", g:"●"},
  souche: {n:"Souche ancienne",  c:"#9fe07a", g:"❦", hold:2.4},
  remous: {n:"Remous",           c:"#4fb2ff", g:"◎"},
  cristal:{n:"Cristal géant",    c:"#aef4ff", g:"◆", hold:1.6},
  glyphe: {n:"Dalle-glyphe",     c:"#c9a6ff", g:"⌬"},
  geyser: {n:"Geyser",           c:"#ff8a3d", g:"▲"},
  nid:    {n:"Nid de corruption",c:"#ff3d7f", g:"✹"}
};
function brHash3(a, b, c){
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function brMapInit(R){
  R.map = {chunks:new Map(), near:{obs:[], zones:[], pois:[]}, nearT:0, far:[]};
  R.buff = null;
  const hc = [...R.hab].reduce((a, ch)=>a * 31 + ch.charCodeAt(0), 7);
  R.map.code = hc;
}
function brChunkAt(R, cx, cy){
  const key = cx + "," + cy;
  let ch = R.map.chunks.get(key);
  if(ch) return ch;
  const rng = brRng(brHash3(cx, cy, R.seed ^ R.map.code));
  const T = BR_TERRAIN[R.hab] || BR_TERRAIN.route;
  const ox = cx * BR_CHUNK, oy = cy * BR_CHUNK;
  ch = {obs:[], zones:[], pois:[]};
  /* l'origine reste degagee : on n'apparait pas contre un rocher */
  const free = (x, y, r) => Math.hypot(x, y) > 160 + r;
  const pos = m => [ox + m + rng() * (BR_CHUNK - 2 * m), oy + m + rng() * (BR_CHUNK - 2 * m)];
  if(T.zone) for(let i = 0; i < T.zone.n; i++){
    if(rng() > T.zone.p) continue;
    const r = T.zone.r[0] + rng() * (T.zone.r[1] - T.zone.r[0]);
    const [x, y] = pos(r * 0.6);
    if(free(x, y, r * (T.zone.k === "grass" ? 0 : 0.6))) ch.zones.push({k:T.zone.k, x, y, r, seed:rng()});
  }
  const n = T.obs.n[0] + Math.floor(rng() * (T.obs.n[1] - T.obs.n[0] + 1));
  for(let i = 0; i < n; i++){
    for(let tries = 0; tries < 4; tries++){
      const k = T.obs.kinds[Math.floor(rng() * T.obs.kinds.length)];
      const r = k === "tree" ? 20 + rng() * 10 : k === "column" ? 18 + rng() * 6 : k === "pillar" ? 18 + rng() * 14 : 14 + rng() * 14;
      const [x, y] = pos(40);
      if(!free(x, y, r)) continue;
      if(ch.obs.some(o=>Math.hypot(o.x - x, o.y - y) < o.r + r + 46)) continue;
      if(ch.zones.some(z=>z.k !== "grass" && Math.hypot(z.x - x, z.y - y) < z.r)) continue;
      ch.obs.push({k, x, y, r, seed:rng()});
      break;
    }
  }
  const addPoi = (k, extra) => {
    for(let tries = 0; tries < 5; tries++){
      const [x, y] = pos(60);
      if(!free(x, y, 40)) continue;
      if(ch.obs.some(o=>Math.hypot(o.x - x, o.y - y) < o.r + 50)) continue;
      if(ch.pois.some(p=>Math.hypot(p.x - x, p.y - y) < 120)) continue;
      ch.pois.push(Object.assign({k, x, y, t:0, prog:0, used:false, cd:0}, extra || {}));
      return;
    }
  };
  if(rng() < 0.55) addPoi("cache");
  if(rng() < 0.20) addPoi("autel");
  if(rng() < 0.15 && (cx || cy)) addPoi("nid");
  if(rng() < 0.09 && (cx || cy)) addPoi("captif");
  if(T.mark && rng() < T.mark.p) addPoi(T.mark.k);
  R.map.chunks.set(key, ch);
  return ch;
}
/* ce qui entoure l'Archiviste : relief, terrains et lieux proches, recalcules 4 fois par seconde */
function brMapNear(R){
  const N = R.map.near;
  N.obs.length = 0; N.zones.length = 0; N.pois.length = 0;
  const cx = Math.floor(R.x / BR_CHUNK), cy = Math.floor(R.y / BR_CHUNK);
  for(let dx = -2; dx <= 2; dx++) for(let dy = -2; dy <= 2; dy++){
    const ch = brChunkAt(R, cx + dx, cy + dy), close = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    if(close){ N.obs.push(...ch.obs); N.zones.push(...ch.zones); }
    for(const p of ch.pois) N.pois.push(p);
  }
}
function brPushOut(e, r, obs){
  for(const o of obs){
    const dx = e.x - o.x, dy = e.y - o.y, m = o.r + r;
    if(dx > m || dx < -m || dy > m || dy < -m) continue;
    const d = Math.hypot(dx, dy) || 0.01;
    if(d < m){ e.x = o.x + dx / d * m; e.y = o.y + dy / d * m; }
  }
}
function brZoneAt(R, x, y){
  for(const z of R.map.near.zones){ const dx = x - z.x, dy = y - z.y; if(dx * dx + dy * dy < z.r * z.r) return z; }
  return null;
}
/* l'eau ralentit, sauf si l'equipe compte un Pokemon Eau ou Vol */
function brCanSwim(R){ return R.team.some(w=>POKE[brShownId(w)].types.some(t=>t === 11 || t === 3)); }

/* ---------- le terrain, avant le deplacement de l'Archiviste ---------- */
function brMapPre(R, dt){
  R.map.nearT -= dt;
  if(R.map.nearT <= 0){ R.map.nearT = 0.25; brMapNear(R); }
  const z = brZoneAt(R, R.x, R.y);
  R.terrain = z ? z.k : null;
  R.terrainMul = z && z.k === "water" && !brCanSwim(R) ? 0.62 : 1;
  if(z && z.k === "lava" && R.turbo <= 0){
    R.lavaT = (R.lavaT || 0) + dt;
    if(R.lavaT > 0.5){ R.lavaT = 0; R.hp -= 5 * R.mods.armor; R.hurt = 0.2; brText(R, R.x, R.y - 28, "brûlure", "#ff8a3d", 10); }
  }
  if(R.buff){ R.buff.t -= dt; if(R.buff.t <= 0){ R.buff = null; brRecomputeMods(R); } }
}
/* ---------- apres le deplacement : collisions et terrains des ennemis ---------- */
function brMapPost(R, dt){
  const obs = R.map.near.obs;
  brPushOut(R, 12, obs);
  const lim = Math.max(R.W, R.H) * 0.75;
  R.P.foes.each(f=>{
    if(f.boss || f.reaper || f.kind === "nest") return;
    if(Math.abs(f.x - R.x) > lim || Math.abs(f.y - R.y) > lim) return;
    brPushOut(f, f.r * 0.8, obs);
    const z = brZoneAt(R, f.x, f.y);
    if(!z) return;
    /* l'eau freine un peu la horde ; les hautes herbes, elles, ne gênent personne */
    if(z.k === "water") f.wet = 0.2;
    if(z.k === "lava"){
      f.lavaT = (f.lavaT || 0) + dt;
      if(f.lavaT > 0.5){ f.lavaT = 0; R.curW = -1; R.killSrc = "feu"; brHit(R, f, 10 + R.t / 12, "#ff8a3d", 0, 0, 0); R.killSrc = null; }
    }
  });
  brPois(R, dt);
}

/* ============================================================
   LES LIEUX
   ============================================================ */
function brPoiHold(R, p, dt, rad){
  /* on active en restant a cote : aucun bouton, le pouce reste sur le deplacement */
  const d = Math.hypot(R.x - p.x, R.y - p.y);
  if(d < rad){ p.prog += dt; return true; }
  p.prog = Math.max(0, p.prog - dt * 2);
  return false;
}
function brMisTick(R, k, n){
  if(!R.missions) return;
  for(const m of R.missions){
    if(m.k !== k || m.done) continue;
    m.n = Math.min(m.goal, m.n + (n || 1));
    if(m.n >= m.goal){ m.done = true; brBanner(R, "MISSION ACCOMPLIE", "#5ce07a", m.txt); try { Sfx.win(); } catch(e){} }
  }
}
function brPois(R, dt){
  for(const p of R.map.near.pois){
    const P = BR_POI[p.k];
    const d = Math.hypot(R.x - p.x, R.y - p.y);
    p.t += dt;
    if(p.cd > 0) p.cd -= dt;
    if(p.used && p.k !== "arbre" && p.k !== "remous" && p.k !== "glyphe" && p.k !== "geyser") continue;
    switch(p.k){
      case "cache":
        if(brPoiHold(R, p, dt, 38) && p.prog >= P.hold){
          p.used = true; brMisTick(R, "cache");
          for(let k = 0; k < 4; k++){ const g = R.P.gems.get(); g.x = p.x + (R.rng() - .5) * 40; g.y = p.y + (R.rng() - .5) * 40; g.v = 4 + Math.floor(R.t / 60); g.pull = false; g.pv = 0; }
          if(R.rng() < 0.35){ const q = R.P.picks.get(); q.x = p.x; q.y = p.y + 20; q.k = R.rng() < 0.6 ? "turbo" : "berry"; q.t = 0; q.tree = false; }
          brBurst(R, p.x, p.y, P.c, 22, 180, 0.5); try { Sfx.coin(); } catch(e){}
        }
        break;
      case "autel":
        if(brPoiHold(R, p, dt, 56) && p.prog >= P.hold){
          p.used = true; brMisTick(R, "autel");
          const b = [{k:"force", n:"FORCE", d:"+40 % de dégâts"}, {k:"hate", n:"HÂTE", d:"attaques 30 % plus rapides"}, {k:"aimant", n:"ATTRACTION", d:"ramassage géant"}][Math.floor(R.rng() * 3)];
          R.buff = {k:b.k, n:b.n, t:30};
          brRecomputeMods(R);
          brBanner(R, "AUTEL · " + b.n, "#ffd24a", b.d + " pendant 30 s");
          brRing(R, p.x, p.y, 120, P.c, 0.6);
        }
        break;
      case "captif":
        if(brPoiHold(R, p, dt, 46) && p.prog >= P.hold){
          p.used = true; brMisTick(R, "captif");
          const id = p.id || brSpecies(R);
          R.freed = R.freed || []; R.freed.push(id);
          if(R.team.length < 6){ R.team.push({id, lv:2, stage:0, cd:0.2, orb:0}); brRecomputeMods(R); brHudTeam(R); }
          else R.pendingLevels++;
          brBanner(R, "CAPTIF LIBÉRÉ", "#5ce07a", POKE[id].name.toUpperCase() + (R.team.length <= 6 ? " REJOINT L'ÉQUIPE" : ""));
          brBurst(R, p.x, p.y, P.c, 30, 200, 0.6);
        }
        break;
      case "souche":
        if(brPoiHold(R, p, dt, 50) && p.prog >= P.hold){
          p.used = true; brMisTick(R, "souche");
          const up = R.team.filter(w=>w.lv < BR_MAXLV);
          const w = up.length ? up[Math.floor(R.rng() * up.length)] : null;
          if(w){ w.lv = Math.min(BR_MAXLV, w.lv + 2); brHudTeam(R); }
          R.hp = Math.min(R.maxHp, R.hp + R.maxHp * 0.3);
          brBanner(R, "LA SOUCHE S'ÉVEILLE", "#9fe07a", w ? POKE[brShownId(w)].name + " gagne deux niveaux" : "vos PV sont restaurés");
          brRing(R, p.x, p.y, 140, P.c, 0.6);
        }
        break;
      case "cristal":
        if(brPoiHold(R, p, dt, 50) && p.prog >= P.hold){
          p.used = true; brMisTick(R, "cristal");
          for(let k = 0; k < 6; k++){ const g = R.P.gems.get(); g.x = p.x + (R.rng() - .5) * 60; g.y = p.y + (R.rng() - .5) * 60; g.v = 18; g.pull = false; g.pv = 0; }
          const q = R.P.picks.get(); q.x = p.x; q.y = p.y + 24; q.k = "turbo"; q.t = 0; q.tree = false;
          brBurst(R, p.x, p.y, P.c, 40, 240, 0.7); brShake(R, 4);
          brBanner(R, "CRISTAL BRISÉ", P.c);
        }
        break;
      case "arbre":
        /* une baie tombe regulierement, tant qu'on est dans les parages */
        if(d < 600 && p.cd <= 0){
          p.cd = 40;
          const q = R.P.picks.get(); q.x = p.x + (R.rng() - .5) * 50; q.y = p.y + 34; q.k = "berry"; q.t = 0; q.tree = true;
        }
        break;
      case "remous":
        /* il aspire et noie : un piege ou attirer la horde */
        if(d < 700){
          p.tick = (p.tick || 0) + dt;
          const hit = p.tick > 0.5; if(hit) p.tick = 0;
          brNear(R, p.x, p.y, 110, f=>{
            if(f.boss || f.reaper || f.kind === "nest") return;
            const dx = p.x - f.x, dy = p.y - f.y, dd = Math.hypot(dx, dy) || 1;
            if(dd > 110) return;
            f.x += dx / dd * 70 * dt; f.y += dy / dd * 70 * dt;
            if(hit){ R.curW = -1; R.killSrc = "remous"; brHit(R, f, 9 + R.t / 14, "#4fb2ff", 0, 0, 0); R.killSrc = null; }
          });
        }
        break;
      case "glyphe":
        if(d < 28 && p.cd <= 0){
          p.cd = 7;
          const dmg = 70 + R.t / 2.5;
          brRing(R, p.x, p.y, 190, P.c, 0.45); brBurst(R, p.x, p.y, P.c, 36, 260, 0.5); brShake(R, 6);
          R.curW = -1; R.killSrc = "glyphe";
          brNear(R, p.x, p.y, 190, f=>{ if(Math.hypot(f.x - p.x, f.y - p.y) < 190 + f.r){ const dx = f.x - p.x, dy = f.y - p.y, dd = Math.hypot(dx, dy) || 1; brHit(R, f, dmg, P.c, dx / dd, dy / dd, 300); } });
          R.killSrc = null;
          try { Sfx.glitch(); buzz(20); } catch(e){}
        }
        break;
      case "geyser":
        /* il gronde (cercle d'alerte), puis entre en eruption : pour tout le monde */
        if(d < 700){
          p.phase = (p.phase || 0) + dt;
          if(p.phase > 6.2){
            p.phase = 0;
            brRing(R, p.x, p.y, 115, "#ff8a3d", 0.45); brBurst(R, p.x, p.y, "#ffb35c", 40, 280, 0.6); brShake(R, 4);
            R.curW = -1; R.killSrc = "feu";
            brNear(R, p.x, p.y, 115, f=>{ if(Math.hypot(f.x - p.x, f.y - p.y) < 115 + f.r) brHit(R, f, 80 + R.t / 3, "#ff8a3d", 0, -1, 200); });
            R.killSrc = null;
            if(d < 115 && R.inv <= 0 && brTakeHit(R, 16, null)){ R.inv = 0.5; R.hurt = 0.3; }
          }
        }
        break;
      case "nid":
        /* un nid prend corps quand on approche : il faut le detruire, sinon il deverse */
        if(!p.foe && d < 700){
          const f = brSpawnFoe(R, brSpecies(R), "nest");
          f.x = p.x; f.y = p.y; p.foe = f; f.poi = p;
        }
        break;
    }
  }
}
/* le nid : immobile, robuste, il fait naitre des ennemis tant qu'il tient */
function brNestAI(R, f, dt){
  f.shootT -= dt;
  if(f.shootT <= 0 && Math.hypot(R.x - f.x, R.y - f.y) < 560){
    f.shootT = 2.6;
    for(let k = 0; k < 2; k++){
      const c = brSpawnFoe(R, brSpecies(R), "n");
      c.minion = true;          /* un nid est une menace a detruire, pas une ferme a experience */
      const a = R.rng() * Math.PI * 2; c.x = f.x + Math.cos(a) * 50; c.y = f.y + Math.sin(a) * 50;
    }
    brRing(R, f.x, f.y, 50, "#ff3d7f", 0.3);
  }
  return true;
}

/* ============================================================
   MISSIONS — trois par run, liees au terrain
   ============================================================ */
const BR_MIS_GEN = [
  {k:"cache",  txt:"Ouvrir 4 caches de données", goal:4},
  {k:"nid",    txt:"Détruire 2 nids de corruption", goal:2},
  {k:"autel",  txt:"Activer 2 autels", goal:2},
  {k:"captif", txt:"Libérer un Pokémon captif", goal:1}
];
const BR_MIS_HAB = {
  route:  {k:"baie",    txt:"Cueillir 3 baies d'un arbre", goal:3},
  foret:  {k:"souche",  txt:"Éveiller une souche ancienne", goal:1},
  eaux:   {k:"remous",  txt:"Noyer 40 ennemis dans les remous", goal:40},
  grotte: {k:"cristal", txt:"Briser 2 cristaux géants", goal:2},
  ruines: {k:"glyphe",  txt:"Foudroyer 50 ennemis aux glyphes", goal:50},
  foyer:  {k:"feu",     txt:"Faire périr 60 ennemis par la lave ou les geysers", goal:60}
};
function brMissionsFor(R){
  const pool = BR_MIS_GEN.slice(), out = [];
  for(let k = 0; k < 2; k++) out.push(pool.splice(Math.floor(R.rng() * pool.length), 1)[0]);
  out.push(BR_MIS_HAB[R.hab] || BR_MIS_HAB.route);
  return out.map(m=>Object.assign({n:0, done:false}, m));
}

/* ============================================================
   RENDU DE LA CARTE
   ============================================================ */
function brDrawUnder(x, R, X, Y){
  const W = R.W, H = R.H, N = R.map.near;
  const vis = (o, m) => { const sx = X(o.x), sy = Y(o.y); return sx > -m && sy > -m && sx < W + m && sy < H + m; };
  /* terrains */
  for(const z of N.zones){
    if(!vis(z, z.r)) continue;
    const zx = X(z.x), zy = Y(z.y);
    if(z.k === "water"){
      const g = x.createRadialGradient(zx, zy, z.r * 0.2, zx, zy, z.r);
      g.addColorStop(0, "#0d4d78"); g.addColorStop(0.85, "#11628f"); g.addColorStop(1, "rgba(79,178,255,.0)");
      x.fillStyle = g; x.beginPath(); x.arc(zx, zy, z.r, 0, 7); x.fill();
      x.strokeStyle = "rgba(190,240,255,.25)"; x.lineWidth = 1;
      for(let k = 0; k < 3; k++){ const rr = z.r * (0.35 + ((R.t * 0.12 + k / 3 + z.seed) % 1) * 0.6); x.beginPath(); x.arc(zx, zy, rr, 0, 7); x.stroke(); }
    } else if(z.k === "lava"){
      const pul = 0.85 + Math.sin(R.t * 2 + z.seed * 9) * 0.15;
      const g = x.createRadialGradient(zx, zy, 0, zx, zy, z.r);
      g.addColorStop(0, `rgba(255,${150 + 40 * pul | 0},60,.95)`); g.addColorStop(0.6, "rgba(220,70,20,.9)"); g.addColorStop(1, "rgba(90,20,8,0)");
      x.fillStyle = g; x.beginPath(); x.arc(zx, zy, z.r, 0, 7); x.fill();
      x.fillStyle = "rgba(40,10,5,.55)";
      for(let k = 0; k < 5; k++){ const a = z.seed * 20 + k * 1.3; x.beginPath(); x.arc(zx + Math.cos(a) * z.r * 0.5, zy + Math.sin(a) * z.r * 0.45, z.r * 0.12, 0, 7); x.fill(); }
    } else {
      x.fillStyle = "rgba(60,120,50,.35)"; x.beginPath(); x.arc(zx, zy, z.r, 0, 7); x.fill();
      x.strokeStyle = "rgba(140,210,90,.5)"; x.lineWidth = 1.5;
      const r2 = brRng(z.seed * 1e6 | 0);
      for(let k = 0; k < 26; k++){
        const a = r2() * 6.28, rr = Math.sqrt(r2()) * z.r * 0.92, bx = zx + Math.cos(a) * rr, by = zy + Math.sin(a) * rr;
        const sway = Math.sin(R.t * 2 + k) * 2;
        x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + sway, by - 8); x.moveTo(bx + 3, by); x.lineTo(bx + 3 + sway, by - 6); x.stroke();
      }
    }
  }
  /* lieux au sol */
  for(const p of N.pois){
    if(!vis(p, 140)) continue;
    brDrawPoi(x, R, p, X(p.x), Y(p.y));
  }
  /* bases du relief (ombres, troncs, socles) */
  for(const o of N.obs){
    if(!vis(o, 80)) continue;
    const ox = X(o.x), oy = Y(o.y);
    x.fillStyle = "rgba(0,0,0,.38)"; x.beginPath(); x.ellipse(ox + 4, oy + o.r * 0.55, o.r * 1.05, o.r * 0.42, 0, 0, 7); x.fill();
    if(o.k === "tree"){ x.fillStyle = "#5a3a22"; x.fillRect(ox - o.r * 0.18, oy - o.r * 0.2, o.r * 0.36, o.r * 0.75); }
    else brDrawRock(x, o, ox, oy);
  }
}
function brDrawRock(x, o, ox, oy){
  const r = o.r, rng = brRng(o.seed * 1e6 | 0);
  if(o.k === "column"){
    x.fillStyle = "#4a3c6a"; x.fillRect(ox - r * 0.7, oy - r * 1.8, r * 1.4, r * 2.2);
    x.fillStyle = "#6a5a92"; x.fillRect(ox - r * 0.7, oy - r * 1.8, r * 0.35, r * 2.2);
    x.fillStyle = "#8a7ab8"; x.beginPath(); x.ellipse(ox, oy - r * 1.8, r * 0.7, r * 0.28, 0, 0, 7); x.fill();
    x.fillStyle = "rgba(201,166,255,.8)"; x.font = `${r * 0.7 | 0}px ui-monospace,monospace`; x.textAlign = "center";
    x.fillText("⌬", ox, oy - r * 0.6);
    return;
  }
  if(o.k === "pillar"){
    x.fillStyle = "#4a3a2c"; x.beginPath(); x.moveTo(ox - r, oy + r * 0.3); x.lineTo(ox - r * 0.25, oy - r * 2); x.lineTo(ox + r * 0.35, oy - r * 1.6); x.lineTo(ox + r, oy + r * 0.3); x.closePath(); x.fill();
    x.fillStyle = "#6a5440"; x.beginPath(); x.moveTo(ox - r * 0.25, oy - r * 2); x.lineTo(ox - r * 0.55, oy + r * 0.3); x.lineTo(ox - r, oy + r * 0.3); x.closePath(); x.fill();
    return;
  }
  /* rocher ou basalte : un polygone irregulier, eclaire par le haut */
  const pts = [];
  for(let k = 0; k < 7; k++){ const a = k / 7 * Math.PI * 2; const rr = r * (0.8 + rng() * 0.3); pts.push([ox + Math.cos(a) * rr, oy - r * 0.2 + Math.sin(a) * rr * 0.8]); }
  x.fillStyle = o.k === "basalt" ? "#2a1a18" : "#5a5248"; x.beginPath(); pts.forEach((p, i)=>i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
  x.fillStyle = o.k === "basalt" ? "#3d2622" : "#7a7266";
  x.beginPath(); x.ellipse(ox - r * 0.2, oy - r * 0.55, r * 0.55, r * 0.3, -0.3, 0, 7); x.fill();
  if(o.k === "basalt"){ x.strokeStyle = "rgba(255,120,40,.7)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ox - r * 0.5, oy - r * 0.1); x.lineTo(ox, oy - r * 0.35); x.lineTo(ox + r * 0.4, oy); x.stroke(); }
}
function brDrawPoi(x, R, p, px, py){
  const P = BR_POI[p.k], pul = 1 + Math.sin(R.t * 3 + p.x) * 0.08;
  if(p.k === "nid") return;                       /* dessine comme un ennemi */
  const spent = p.used && (p.k === "cache" || p.k === "autel" || p.k === "captif" || p.k === "souche" || p.k === "cristal");
  if(p.k === "remous"){
    x.save(); x.translate(px, py);
    for(let k = 0; k < 4; k++){ x.rotate(R.t * 1.5 + k); x.strokeStyle = `rgba(143,220,255,${0.5 - k * 0.1})`; x.lineWidth = 3;
      x.beginPath(); x.arc(0, 0, 30 + k * 22, 0, 4.2); x.stroke(); }
    x.restore();
    x.fillStyle = "rgba(8,40,70,.6)"; x.beginPath(); x.arc(px, py, 22, 0, 7); x.fill();
    return;
  }
  if(p.k === "geyser"){
    const ph = p.phase || 0, warn = ph > 5.2;
    x.fillStyle = "#3a1a10"; x.beginPath(); x.ellipse(px, py, 26, 12, 0, 0, 7); x.fill();
    x.fillStyle = warn ? "#ffb35c" : "#ff6a1a"; x.beginPath(); x.ellipse(px, py, 12, 6, 0, 0, 7); x.fill();
    if(warn){ x.strokeStyle = `rgba(255,138,61,${0.3 + (ph - 5.2)})`; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 115 * (ph - 5.2), 0, 7); x.stroke();
      x.fillStyle = "rgba(255,138,61,.12)"; x.beginPath(); x.arc(px, py, 115, 0, 7); x.fill(); }
    if(ph < 0.6){ x.fillStyle = `rgba(255,200,120,${0.8 - ph})`; x.fillRect(px - 8, py - 90 * (1 - ph), 16, 90 * (1 - ph)); }
    return;
  }
  if(p.k === "glyphe"){
    const ready = p.cd <= 0;
    x.fillStyle = ready ? "rgba(201,166,255,.25)" : "rgba(80,60,110,.3)"; x.fillRect(px - 26, py - 26, 52, 52);
    x.strokeStyle = ready ? "#c9a6ff" : "#5a4a7a"; x.lineWidth = 2; x.strokeRect(px - 26, py - 26, 52, 52);
    x.fillStyle = ready ? "#fff" : "#8a7ab8"; x.font = "bold 26px ui-monospace,monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText("⌬", px, py + 1); x.textBaseline = "alphabetic";
    if(ready){ x.globalAlpha = 0.4 + Math.sin(R.t * 5) * 0.2; x.strokeRect(px - 30, py - 30, 60, 60); x.globalAlpha = 1; }
    return;
  }
  if(p.k === "arbre"){
    x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(px + 4, py + 18, 36, 12, 0, 0, 7); x.fill();
    x.fillStyle = "#5a3a22"; x.fillRect(px - 6, py - 8, 12, 26);
    return;                                        /* la ramure est dessinee au-dessus des entites */
  }
  /* lieux a activer : un socle, une icone, et l'anneau de progression */
  x.globalAlpha = spent ? 0.35 : 1;
  if(p.k === "cristal"){
    x.fillStyle = "#1a4a5a"; x.beginPath(); x.moveTo(px, py - 46); x.lineTo(px + 20, py - 6); x.lineTo(px, py + 12); x.lineTo(px - 20, py - 6); x.closePath(); x.fill();
    x.fillStyle = "#aef4ff"; x.beginPath(); x.moveTo(px, py - 46); x.lineTo(px + 8, py - 10); x.lineTo(px, py + 4); x.lineTo(px - 6, py - 12); x.closePath(); x.fill();
  } else if(p.k === "souche"){
    x.fillStyle = "#4a3222"; x.beginPath(); x.ellipse(px, py, 30, 16, 0, 0, 7); x.fill();
    x.fillStyle = "#6a4a30"; x.beginPath(); x.ellipse(px, py - 6, 26, 12, 0, 0, 7); x.fill();
    x.strokeStyle = "#8a6a44"; x.lineWidth = 1.5; x.beginPath(); x.ellipse(px, py - 6, 16, 7, 0, 0, 7); x.stroke();
  } else if(p.k === "captif"){
    const spr = p.id ? brSprite(p.id, "n") : null;
    if(!p.id) p.id = brSpecies(R);
    if(spr && !spent) x.drawImage(spr, px - 24, py - 36, 48, 48);
    x.strokeStyle = spent ? "#555" : "#5ce07a"; x.lineWidth = 2;
    for(let k = -2; k <= 2; k++){ x.beginPath(); x.moveTo(px + k * 10, py - 42); x.lineTo(px + k * 10, py + 10); x.stroke(); }
    x.beginPath(); x.moveTo(px - 24, py - 42); x.lineTo(px + 24, py - 42); x.stroke();
  } else {
    x.fillStyle = "#0a0f18"; x.beginPath(); x.arc(px, py, 18 * pul, 0, 7); x.fill();
    x.strokeStyle = P.c; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 18 * pul, 0, 7); x.stroke();
    x.fillStyle = P.c; x.font = "bold 16px ui-monospace,monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(P.g, px, py + 1); x.textBaseline = "alphabetic";
    if(p.k === "autel" && !spent){ x.strokeStyle = "rgba(255,210,74,.35)"; x.setLineDash([4, 4]); x.beginPath(); x.arc(px, py, 56, 0, 7); x.stroke(); x.setLineDash([]); }
  }
  x.globalAlpha = 1;
  if(!spent && P.hold && p.prog > 0){
    x.strokeStyle = "#fff"; x.lineWidth = 4;
    x.beginPath(); x.arc(px, py - 14, 30, -Math.PI / 2, -Math.PI / 2 + Math.min(1, p.prog / P.hold) * Math.PI * 2); x.stroke();
  }
}
/* au-dessus des entites : ramures (translucides quand on passe dessous), obscurite, fleches */
function brDrawOver(x, R, X, Y){
  const W = R.W, H = R.H, N = R.map.near;
  for(const o of N.obs){
    if(o.k !== "tree") continue;
    const ox = X(o.x), oy = Y(o.y) - o.r * 1.1;
    if(ox < -80 || oy < -80 || ox > W + 80 || oy > H + 80) continue;
    const under = Math.hypot(R.x - o.x, R.y - (o.y - o.r)) < o.r * 1.6;
    x.globalAlpha = under ? 0.4 : 0.95;
    x.fillStyle = "#1d4a26"; x.beginPath(); x.arc(ox, oy, o.r * 1.25, 0, 7); x.fill();
    x.fillStyle = "#2d6a34"; x.beginPath(); x.arc(ox - o.r * 0.35, oy - o.r * 0.2, o.r * 0.85, 0, 7); x.fill();
    x.fillStyle = "#3f8a44"; x.beginPath(); x.arc(ox - o.r * 0.45, oy - o.r * 0.45, o.r * 0.42, 0, 7); x.fill();
    x.globalAlpha = 1;
  }
  for(const p of N.pois){
    if(p.k !== "arbre") continue;
    const px = X(p.x), py = Y(p.y) - 34;
    if(px < -90 || py < -90 || px > W + 90 || py > H + 90) continue;
    x.fillStyle = "#2a5a2a"; x.beginPath(); x.arc(px, py, 40, 0, 7); x.fill();
    x.fillStyle = "#3a7a36"; x.beginPath(); x.arc(px - 12, py - 8, 26, 0, 7); x.fill();
    x.fillStyle = "#ff5a4a"; for(let k = 0; k < 6; k++){ const a = k * 1.1; x.beginPath(); x.arc(px + Math.cos(a) * 26, py + Math.sin(a) * 20, 4, 0, 7); x.fill(); }
  }
  /* obscurite des cavites : on ne voit que ce que la lumiere de l'equipe eclaire */
  if((BR_TERRAIN[R.hab] || {}).dark){
    const lr = 190 * (R.buff && R.buff.k === "aimant" ? 1.3 : 1) * (R.turbo > 0 ? 1.25 : 1);
    const g = x.createRadialGradient(W / 2, H / 2, lr * 0.45, W / 2, H / 2, lr * 1.5);
    g.addColorStop(0, "rgba(2,1,6,0)"); g.addColorStop(1, "rgba(2,1,6,.9)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  /* fleches au bord de l'ecran : les quatre lieux utiles les plus proches, pas un de plus.
     Une fleche par cache rendait le bord illisible. */
  const arrows = [];
  for(const p of N.pois){
    if(p.used && (p.k === "cache" || p.k === "autel" || p.k === "captif" || p.k === "souche" || p.k === "cristal")) continue;
    if(p.k === "nid" && p.foe && !p.foe.on) continue;
    const dist = Math.hypot(p.x - R.x, p.y - R.y);
    if(dist > (p.k === "cache" ? 560 : 950)) continue;
    const px = X(p.x), py = Y(p.y);
    if(px > 20 && py > 190 && px < W - 20 && py < H - 20) continue;
    /* on privilegie ce qui compte : nids, captifs, autels, lieux signature, puis caches */
    arrows.push({p, px, py, score: dist * (p.k === "cache" ? 2 : 1)});
  }
  arrows.sort((a, b)=>a.score - b.score);
  for(const {p, px, py} of arrows.slice(0, 4)){
    const a = Math.atan2(py - H / 2, px - W / 2);
    const ex = Math.max(22, Math.min(W - 22, W / 2 + Math.cos(a) * W)), ey = Math.max(170, Math.min(H - 22, H / 2 + Math.sin(a) * H));
    const P = BR_POI[p.k];
    x.save(); x.translate(ex, ey);
    x.fillStyle = "rgba(4,8,16,.75)"; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.fill();
    x.strokeStyle = P.c; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.stroke();
    x.fillStyle = P.c; x.font = "bold 12px ui-monospace,monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(P.g, 0, 1);
    x.rotate(a); x.beginPath(); x.moveTo(17, 0); x.lineTo(11, -5); x.lineTo(11, 5); x.closePath(); x.fill();
    x.restore(); x.textBaseline = "alphabetic";
  }
}
function brDrawNest(x, R, f, fx, fy){
  const pul = 1 + Math.sin(R.t * 4) * 0.1, s = 34 * pul;
  const g = x.createRadialGradient(fx, fy, 0, fx, fy, s * 2);
  g.addColorStop(0, "rgba(255,61,127,.55)"); g.addColorStop(1, "rgba(255,61,127,0)");
  x.fillStyle = g; x.fillRect(fx - s * 2, fy - s * 2, s * 4, s * 4);
  x.fillStyle = "#2a0a24"; x.beginPath(); x.moveTo(fx, fy - s * 1.4); x.lineTo(fx + s, fy + s * 0.5); x.lineTo(fx - s, fy + s * 0.5); x.closePath(); x.fill();
  x.strokeStyle = "#ff3d7f"; x.lineWidth = 2; x.stroke();
  x.fillStyle = f.flash > 0 ? "#fff" : "#ff3d7f"; x.beginPath(); x.arc(fx, fy - s * 0.1, s * 0.3, 0, 7); x.fill();
  x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(fx - 26, fy + s * 0.75, 52, 5);
  x.fillStyle = "#ff3d7f"; x.fillRect(fx - 26, fy + s * 0.75, 52 * Math.max(0, f.hp) / f.max, 5);
}

/* ============================================================
   MAÎTRISE PAR ESPÈCE — enfin utile
   Plus on joue une espece dans la Breche, plus elle frappe fort.
   ============================================================ */
const BR_MASTERY = [1, 3, 6, 10, 15];
function brMastery(id){
  const n = (S.breche && S.breche.mastery && S.breche.mastery[id]) || 0;
  let r = 0; for(const t of BR_MASTERY) if(n >= t) r++;
  return r;
}
function brMasteryStars(id){ const r = brMastery(id); return r ? "★".repeat(r) : ""; }
