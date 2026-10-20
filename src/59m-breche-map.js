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
  if(rng() < 0.10 && (cx || cy)) addPoi("nid");
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
  const z = brZoneAt(R, R.x, R.y), tu = brTerrainUnder(R);
  R.terrain = z ? z.k : null;
  /* la glace porte : sur l'eau gelee, on ne nage plus ; la lave figee ne brule plus */
  R.terrainMul = z && z.k === "water" && !brCanSwim(R) && !tu.ice ? 0.62 : 1;
  if(z && z.k === "lava" && !(z.cooled > 0) && !tu.ice && R.turbo <= 0){
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
    if(f.boss || f.reaper || f.fixed) return;
    if(Math.abs(f.x - R.x) > lim || Math.abs(f.y - R.y) > lim) return;
    brPushOut(f, f.r * 0.8, obs);
    const z = brZoneAt(R, f.x, f.y);
    if(!z) return;
    /* l'eau freine un peu la horde ; les hautes herbes, elles, ne gênent personne */
    if(z.k === "water") f.wet = 0.2;
    if(z.k === "lava" && !(z.cooled > 0)){
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
    if(m.n >= m.goal){ m.done = true; brBanner(R, "MISSION ACCOMPLIE", "#5ce07a", m.txt); brTicker(R, "MISSION ACCOMPLIE — " + m.txt.toUpperCase(), "#5ce07a"); try { Sfx.win(); } catch(e){} }
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
          brHeal(R, R.maxHp * 0.3, "item");
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
            if(f.boss || f.reaper || f.fixed) return;
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
          brDecal(R, "crack", p.x, p.y, 120, 7);
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
            brDecal(R, "scorch", p.x, p.y, 90, 6);
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
  /* endormi pendant la premiere minute ; ensuite, au plus quatre rejetons vivants a la fois */
  if(f.shootT <= 0 && R.t >= 60 && Math.hypot(R.x - f.x, R.y - f.y) < 560){
    f.shootT = 3.4;
    let alive = 0; R.P.foes.each(o=>{ if(o.nestOf === f) alive++; });
    for(let k = 0; k < Math.min(2, 4 - alive); k++){
      const c = brSpawnFoe(R, brSpecies(R), "n");
      c.minion = true; c.nestOf = f;          /* un nid est une menace a detruire, pas une ferme a experience */
      c.max = c.hp = Math.max(1, Math.round(c.hp * 0.6)); c.dmg *= 0.7;   /* des rejetons, plus fragiles */
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

/* le rendu de la carte (sol, relief, terrains, lieux) : voir 59w-breche-world.js */

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
