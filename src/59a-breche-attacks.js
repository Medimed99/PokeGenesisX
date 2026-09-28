/* ============================================================
   59a — LA BRÈCHE · LES ATTAQUES
   Retour de jeu : trop peu de diversite. Chaque type a desormais
   TROIS attaques, et l'espece choisit selon son profil :
     · specialiste (Attaque Spe. nettement superieure) : a distance ;
     · physique (Attaque nettement superieure)         : au contact,
       ou en rebond ;
     · equilibre                                       : occupe le terrain.
   54 attaques, combinees a l'effet du second type. Les 21 legendaires
   ont chacun une attaque SIGNATURE, unique.
   ============================================================ */

/* puissance et cadence de base de chaque forme d'attaque */
const BR_KIND = {
  bolt:{dmg:21.1,cd:0.9}, ricochet:{dmg:19,cd:1.1}, nova:{dmg:4.5,cd:1.7}, wisp:{dmg:20,cd:1.3},
  punch:{dmg:9.4,cd:1.1}, fissure:{dmg:22,cd:1.9}, blade:{dmg:14.6,cd:1.4}, tornado:{dmg:3.5,cd:2.6},
  puddle:{dmg:3,cd:2.2}, lob:{dmg:15.5,cd:1.8}, quake:{dmg:19.1,cd:3.0}, rain:{dmg:7.8,cd:1.6},
  swarm:{dmg:9.8,cd:0.7}, slash:{dmg:13.3,cd:1.2}, spiral:{dmg:3.8,cd:0.26}, aura:{dmg:2.8,cd:0.5},
  sweep:{dmg:18.3,cd:2.6}, orbit:{dmg:3.8,cd:0}, cone:{dmg:2.4,cd:0.55}, beam:{dmg:23.9,cd:2.2},
  wave:{dmg:7.9,cd:1.6}, seed:{dmg:2.8,cd:1.9}, chain:{dmg:17.5,cd:1.2}, shard:{dmg:15.1,cd:1.0},
  pulse:{dmg:9.9,cd:2.0}, storm:{dmg:7.7,cd:1.4}, wall:{dmg:36,cd:3.2}, sing:{dmg:19,cd:4.2}, metro:{dmg:12,cd:1.5}
};
/* par type : [specialiste, physique, equilibre] — [forme, nom, nom evolue] */
const BR_ATK = {
  1:  [["bolt","Météores","Ultralaser"], ["ricochet","Vive-Attaque","Giga Impact"], ["nova","Hyper Voix","Écho Titanesque"]],
  2:  [["wisp","Aurasphère","Aurasphère Ultime"], ["punch","Poing Karaté","Close Combat"], ["fissure","Balayage","Onde de Choc"]],
  3:  [["blade","Lame d'Air","Aéroblast"], ["ricochet","Aéropiqué","Rapace"], ["tornado","Ouragan","Tempête Céleste"]],
  4:  [["puddle","Toxik","Détricanon"], ["ricochet","Direct Toxik","Crochet Venin"], ["nova","Bomb-Beurk","Déluge Toxique"]],
  5:  [["lob","Boue-Bombe","Telluriforce"], ["fissure","Piétisol","Faille tellurique"], ["quake","Séisme","Séisme Majeur"]],
  6:  [["lob","Pouvoir Antique","Roc Ancestral"], ["ricochet","Roc-Boulet","Fracass'Tête"], ["rain","Éboulement","Lame de Roc"]],
  7:  [["swarm","Dard-Nuée","Mégacorne"], ["slash","Plaie-Croix","Coupe Ultime"], ["spiral","Survinsecte","Essaim Infini"]],
  8:  [["wisp","Ball'Ombre","Revenant"], ["slash","Griffe Ombre","Hantise"], ["aura","Onde Folie","Cauchemar"]],
  9:  [["sweep","Luminocanon","Canon Stellaire"], ["orbit","Tête de Fer","Poing Météore"], ["spiral","Gyroballe","Rotor d'Acier"]],
  10: [["cone","Lance-Flammes","Déflagration"], ["punch","Poing Feu","Boutefeu"], ["tornado","Danse Flammes","Feu Tourbillon"]],
  11: [["beam","Hydrocanon","Hydroblast"], ["ricochet","Aqua-Jet","Cascade"], ["wave","Surf","Raz-de-Marée"]],
  12: [["spiral","Feuille Magik","Tempête Florale"], ["slash","Tranch'Herbe","Lame-Feuille"], ["seed","Vampigraine","Jungle Vorace"]],
  13: [["chain","Éclair","Fatal-Foudre"], ["ricochet","Étincelle","Électacle"], ["rain","Tonnerre","Foudre Céleste"]],
  14: [["sweep","Rafale Psy","Psyko"], ["orbit","Psykoud'Boul","Psychokinésie"], ["aura","Distorsion","Onde Psychique"]],
  15: [["shard","Éclats Glace","Blizzard"], ["punch","Poing Glace","Crocs Givre"], ["rain","Grêle","Tempête de Grêle"]],
  16: [["beam","Draco-Souffle","Draco-Météore"], ["slash","Draco-Griffe","Colère"], ["rain","Draco-Charge","Pluie de Dragons"]],
  17: [["nova","Vibrobscur","Nuit Noire"], ["slash","Tranche-Nuit","Coup Bas"], ["aura","Ténèbres","Ombre Absolue"]],
  18: [["wisp","Éclat Magique","Pouvoir Lunaire"], ["ricochet","Câlinerie","Câlin Fatal"], ["pulse","Vent Féérique","Charme Absolu"]]
};
/* les 21 signatures : des attaques qui n'appartiennent qu'a eux */
const BR_LEGEND = {
  144: {k:"spiral",  n:"Blizzard",           n2:"Blizzard Éternel",     c:"#bff4ff", dmg:8.3,  cd:0.2, p:{arms:4, freeze:0.7}},
  145: {k:"rain",    n:"Fatal-Foudre",       n2:"Tonnerre Céleste",     c:"#ffe45e", dmg:4.9, cd:1.4, p:{strikes:4, chain:true}},
  146: {k:"fissure", n:"Pique-Feu",          n2:"Étoile de Flammes",    c:"#ff8a3d", dmg:9.3, cd:2.0, p:{dirs:5, len:6}},
  150: {k:"sing",    n:"Frappe Psy",         n2:"Psyko-Singularité",    c:"#c878ff", dmg:28.4, cd:3.6, p:{}},
  151: {k:"metro",   n:"Métronome",          n2:"Métronome Originel",   c:"#ff9ad5", dmg:13.7, cd:1.1, p:{}},
  243: {k:"storm",   n:"Tonnerre",           n2:"Foudre Perpétuelle",   c:"#ffe45e", dmg:7.4, cd:0.9, p:{bolts:4}},
  244: {k:"fissure", n:"Éruption",           n2:"Magma Sacré",          c:"#ff5a1a", dmg:21.4, cd:2.2, p:{dirs:1, len:10, big:1.5}},
  245: {k:"wall",    n:"Déferlante",         n2:"Aurore Boréale",       c:"#6fe8ff", dmg:69.7, cd:2.8, p:{dirs:1}},
  249: {k:"sweep",   n:"Aéroblast",          n2:"Aéroblast Divin",      c:"#e0ecff", dmg:21.9, cd:2.2, p:{beams:1, arc:2.8, width:2.2}},
  250: {k:"nova",    n:"Feu Sacré",          n2:"Arc-en-Feu",           c:"#ffb35c", dmg:9.4, cd:1.6, p:{count:16, rainbow:true, heal:3}},
  251: {k:"aura",    n:"Voile Temporel",     n2:"Retour dans le Temps", c:"#9fe07a", dmg:5.8, cd:0.5, p:{r:1.6, slowAll:true, heal:0.6}},
  377: {k:"quake",   n:"Force Titanesque",   n2:"Colosse de Pierre",    c:"#d9a86a", dmg:13.1, cd:2.6, p:{rings:3}},
  378: {k:"shard",   n:"Prisme Glacé",       n2:"Cristal Absolu",       c:"#aef4ff", dmg:16.6, cd:1.2, p:{ring:true}},
  379: {k:"orbit",   n:"Muraille d'Acier",   n2:"Bastion d'Acier",      c:"#c7d2e0", dmg:6.5, cd:0,   p:{orbs:6, big:1.5}},
  380: {k:"wisp",    n:"Ball'Brume",         n2:"Rayon Éon",            c:"#ff9ad5", dmg:10.2, cd:1.1, p:{count:3, big:1.5}},
  381: {k:"beam",    n:"Lumi-Éclat",         n2:"Rayon Éon",            c:"#6fa8ff", dmg:18.2, cd:1.8, p:{beams:2}},
  382: {k:"wall",    n:"Onde Originelle",    n2:"Océan Primordial",     c:"#3a8bff", dmg:22, cd:3.0, p:{dirs:4}},
  383: {k:"fissure", n:"Lame Pangéenne",     n2:"Continent Primordial", c:"#ff6a1a", dmg:4.9, cd:2.4, p:{dirs:6, len:7, big:1.3}},
  384: {k:"rain",    n:"Draco-Ascension",    n2:"Colère du Ciel",       c:"#5ce07a", dmg:5.2, cd:1.5, p:{strikes:6, big:1.4}},
  385: {k:"rain",    n:"Vœu Destructeur",    n2:"Vœu Millénaire",       c:"#ffe9a8", dmg:9.1, cd:2.8, p:{strikes:3, delay:1.6, big:2.2}},
  386: {k:"sweep",   n:"Psycho Boost",       n2:"Psycho Boost Ω",       c:"#ff5c8a", dmg:7.9, cd:2.0, p:{beams:4, arc:1.8}}
};
const BR_ARCH_CACHE = {};
/* l'attaque d'une espece : signature, ou selon le type et le profil */
function brArchFor(id){
  if(BR_ARCH_CACHE[id]) return BR_ARCH_CACHE[id];
  const p = POKE[id], t = p.types[0], base = BR_ARCH[t] || BR_ARCH[1];
  let a;
  if(BR_LEGEND[id]){
    const L = BR_LEGEND[id];
    a = {k:L.k, n:L.n, n2:L.n2, c:L.c, dmg:L.dmg, cd:L.cd, p:L.p, sig:true};
  } else {
    const prof = p.spa >= p.atk * 1.12 ? 0 : p.atk >= p.spa * 1.12 ? 1 : 2;
    const [k, n, n2] = BR_ATK[t][prof];
    a = {k, n, n2, c:base.c, dmg:BR_KIND[k].dmg, cd:BR_KIND[k].cd, p:{}, prof};
  }
  BR_ARCH_CACHE[id] = a;
  return a;
}

/* ---------- les formes nouvelles ---------- */
const BR_METRO = ["bolt","ricochet","nova","wisp","punch","fissure","blade","tornado","lob","quake","rain","swarm","slash","spiral","sweep","cone","beam","wave","chain","shard","storm","wall"];
function brFireExtra(R, w, st, pos, tgt, ang){
  const P = st.p || {}, C = st.color, W = R.curW, A = st.area;
  switch(st.k){
    case "ricochet":
      for(let k = 0; k < Math.max(1, st.count - 1); k++){
        const a = ang + (k - (st.count - 2) / 2) * 0.25;
        brShot(R, pos.x, pos.y, Math.cos(a) * 360, Math.sin(a) * 360,
          {dmg:st.dmg, r:7 * A, color:C, w:W, life:1.6, kind:"ricochet", bounce: 2 + st.count + (w.stage >= 2 ? 3 : 0)});
      }
      return;
    case "nova": {
      const n = (P.count || 8) + st.count * 2, off = R.rng() * 6.28;
      for(let k = 0; k < n; k++){
        const a = off + k / n * Math.PI * 2;
        brShot(R, pos.x, pos.y, Math.cos(a) * 250, Math.sin(a) * 250,
          {dmg:st.dmg, r:6 * A, color: P.rainbow ? `hsl(${k / n * 360},95%,62%)` : C, w:W, life:0.9, pierce:2});
      }
      if(P.heal) R.hp = Math.min(R.maxHp, R.hp + P.heal);
      return; }
    case "rain": {
      const n = (P.strikes || 1) + st.count;
      for(let k = 0; k < n; k++){
        const t = brNearest(R, pos.x + (R.rng() - .5) * 320, pos.y + (R.rng() - .5) * 320, 420);
        const x = t ? t.x : pos.x + (R.rng() - .5) * 260, y = t ? t.y : pos.y + (R.rng() - .5) * 260;
        const life = (P.delay || 0.55) + k * 0.07;
        brZone(R, {k:"strike", x, y, r:44 * A * (P.big || 1), life, max:life, delay:0, dmg:st.dmg, color:C, w:W, chain:!!P.chain});
      }
      return; }
    case "spiral": {
      w.spin = (w.spin || 0) + 0.52;
      const arms = (P.arms || 2) + (w.stage >= 2 ? 1 : 0);
      for(let k = 0; k < arms; k++){
        const a = w.spin + k * Math.PI * 2 / arms;
        brShot(R, pos.x, pos.y, Math.cos(a) * 230, Math.sin(a) * 230,
          {dmg:st.dmg, r:5.5 * A, color:C, w:W, life:1.1, pierce:2, stun: P.freeze || 0});
      }
      return; }
    case "aura": {
      const rad = 72 * A * (P.r || 1);
      brNear(R, pos.x, pos.y, rad, f=>{ if(Math.hypot(f.x - pos.x, f.y - pos.y) < rad + f.r) brHit(R, f, st.dmg, C, 0, 0, 0); });
      if(P.slowAll) R.P.foes.each(f=>{ if(!f.boss && Math.hypot(f.x - R.x, f.y - R.y) < 320) f.slow = Math.max(f.slow, 0.6); });
      if(P.heal) R.hp = Math.min(R.maxHp, R.hp + P.heal);
      w.auraR = rad; w.auraT = 0.5;
      return; }
    case "tornado":
      brZone(R, {k:"tornado", x:pos.x, y:pos.y, r:36 * A, life:3 + (w.stage >= 2 ? 1 : 0), max:3, delay:0, dmg:st.dmg, color:C, w:W,
        vx:Math.cos(ang) * 110, vy:Math.sin(ang) * 110, tick:0});
      return;
    case "sweep": {
      const beams = (P.beams || 1) + (w.stage >= 2 && !P.beams ? 1 : 0), arc = P.arc || 1.4;
      for(let b = 0; b < beams; b++){
        const a0 = ang - arc / 2 + b * Math.PI * 2 / beams;
        brZone(R, {k:"sweep", x:pos.x, y:pos.y, a0, arc, len:360 * A, bw:13 * A * (P.width || 1), life:0.55, max:0.55, delay:0,
          dmg:st.dmg, color:C, w:W, hit:new Set(), follow:W});
      }
      return; }
    case "fissure": {
      const dirs = P.dirs || 1, len = (P.len || 6) + (w.stage >= 2 ? 3 : 0);
      for(let d = 0; d < dirs; d++){
        const a = dirs === 1 ? ang : d / dirs * Math.PI * 2 + R.rng() * 0.3;
        for(let k = 1; k <= len; k++){
          const life = 0.1 + k * 0.065;
          brZone(R, {k:"strike", x:pos.x + Math.cos(a) * k * 36, y:pos.y + Math.sin(a) * k * 36, r:30 * A * (P.big || 1),
            life, max:life, delay:0, dmg:st.dmg, color:C, w:W, quiet:true});
        }
      }
      brShake(R, 2);
      return; }
    case "sing":
      if(!tgt) return;
      brZone(R, {k:"sing", x:tgt.x, y:tgt.y, r:170 * A, life:1.3, max:1.3, delay:0, dmg:st.dmg, color:C, w:W});
      return;
    case "storm": {
      const n = (P.bolts || 3) + st.count;
      for(let k = 0; k < n; k++){
        const t = brNearest(R, pos.x + (R.rng() - .5) * 400, pos.y + (R.rng() - .5) * 400, 300);
        if(!t) continue;
        Object.assign(brFxNew(R), {k:"bolt", pts:[{x:pos.x, y:pos.y}, {x:t.x, y:t.y}], life:0.16, max:0.16, color:C});
        brHit(R, t, st.dmg, C, 0, 0, 0);
        if(R.rng() < 0.3 && t.on) t.stun = 0.4;
      }
      return; }
    case "wall": {
      const dirs = P.dirs || 1;
      for(let d = 0; d < dirs; d++){
        const a = dirs === 1 ? ang : d * Math.PI / 2;
        brZone(R, {k:"wall", x:pos.x, y:pos.y, a, span:200 * A, life:1.5, max:1.5, delay:0, dmg:st.dmg, color:C, w:W, hit:new Set()});
      }
      brShake(R, 3);
      return; }
    case "metro": {
      /* Metronome : une attaque au hasard, parmi toutes */
      const k = BR_METRO[Math.floor(R.rng() * BR_METRO.length)];
      const st2 = Object.assign({}, st, {k, p:{}, color:`hsl(${Math.floor(R.rng() * 360)},90%,65%)`});
      brText(R, pos.x, pos.y - 34, "Métronome !", "#ff9ad5", 11);
      brFire(R, w, st2, pos);
      return; }
  }
}

/* ---------- les zones nouvelles ---------- */
function brZoneExtra(R, z, dt){
  switch(z.k){
    case "strike":
      if(!z.fired && z.life <= 0){
        z.fired = true;
        R.curW = z.w;
        brNear(R, z.x, z.y, z.r, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r){ const dx = f.x - z.x, dy = f.y - z.y, d = Math.hypot(dx, dy) || 1; brHit(R, f, z.dmg, z.color, dx / d, dy / d, 160); } });
        brBurst(R, z.x, z.y, z.color, z.quiet ? 5 : 12, 170, 0.4);
        if(!z.quiet){ brRing(R, z.x, z.y, z.r, z.color, 0.25); brShake(R, 1.5); }
        if(z.chain){ const t = brNearest(R, z.x + 60, z.y, 200); if(t){ Object.assign(brFxNew(R), {k:"bolt", pts:[{x:z.x, y:z.y}, {x:t.x, y:t.y}], life:0.15, max:0.15, color:z.color}); brHit(R, t, z.dmg * 0.6, z.color, 0, 0, 0); } }
      }
      if(z.life <= 0) z.on = false;
      return true;
    case "tornado": {
      const t = brNearest(R, z.x, z.y, 260);
      if(t){ const dx = t.x - z.x, dy = t.y - z.y, d = Math.hypot(dx, dy) || 1; z.vx += dx / d * 220 * dt; z.vy += dy / d * 220 * dt; }
      const sp = Math.hypot(z.vx, z.vy) || 1; if(sp > 160){ z.vx *= 160 / sp; z.vy *= 160 / sp; }
      z.x += z.vx * dt; z.y += z.vy * dt;
      z.tick -= dt;
      if(z.tick <= 0){
        z.tick = 0.3; R.curW = z.w;
        brNear(R, z.x, z.y, z.r + 20, f=>{
          if(Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r) return;
          brHit(R, f, z.dmg, z.color, 0, 0, 0);
          if(!f.boss){ f.x += (z.x - f.x) * 0.25; f.y += (z.y - f.y) * 0.25; }
        });
      }
      if(z.life <= 0) z.on = false;
      return true; }
    case "sweep": {
      const src = z.follow >= 0 && R.team[z.follow] ? brMemberPos(R, z.follow) : z;
      z.x = src.x; z.y = src.y;
      const a = z.a0 + z.arc * (1 - Math.max(0, z.life) / z.max);
      z.cur = a;
      const cx = Math.cos(a), cy = Math.sin(a);
      R.curW = z.w;
      R.P.foes.each(f=>{
        if(f.hp <= 0 || z.hit.has(f)) return;
        const rx = f.x - z.x, ry = f.y - z.y, along = rx * cx + ry * cy;
        if(along < 0 || along > z.len) return;
        if(Math.abs(rx * cy - ry * cx) < z.bw + f.r){ z.hit.add(f); brHit(R, f, z.dmg, z.color, cx, cy, 140); }
      });
      if(z.life <= 0) z.on = false;
      return true; }
    case "wall": {
      const cx = Math.cos(z.a), cy = Math.sin(z.a);
      z.x += cx * 320 * dt; z.y += cy * 320 * dt;
      R.curW = z.w;
      brNear(R, z.x, z.y, z.span / 2 + 30, f=>{
        const rx = f.x - z.x, ry = f.y - z.y;
        const along = rx * cx + ry * cy, side = rx * -cy + ry * cx;
        if(Math.abs(along) > 26 + f.r || Math.abs(side) > z.span / 2) return;
        if(!f.boss){ f.x += cx * 320 * dt; f.y += cy * 320 * dt; }
        if(!z.hit.has(f)){ z.hit.add(f); brHit(R, f, z.dmg, z.color, cx, cy, 200); }
      });
      if(z.life <= 0) z.on = false;
      return true; }
    case "sing":
      /* elle aspire, puis elle cede */
      R.P.foes.each(f=>{
        if(f.boss || f.reaper || f.kind === "nest") return;
        const dx = z.x - f.x, dy = z.y - f.y, d = Math.hypot(dx, dy);
        if(d < z.r * 1.4 && d > 4){ const pull = Math.min(d, 260 * dt); f.x += dx / d * pull; f.y += dy / d * pull; }
      });
      if(z.life <= 0){
        z.on = false; R.curW = z.w;
        brNear(R, z.x, z.y, z.r, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r){ const dx = f.x - z.x, dy = f.y - z.y, d = Math.hypot(dx, dy) || 1; brHit(R, f, z.dmg, z.color, dx / d, dy / d, 420); } });
        brRing(R, z.x, z.y, z.r, z.color, 0.4); brBurst(R, z.x, z.y, "#ffffff", 40, 300, 0.6); brBurst(R, z.x, z.y, z.color, 40, 240, 0.7);
        brShake(R, 8); brHitstop(R, 60);
      }
      return true;
  }
  return false;
}
/* ricochet : le projectile repart vers l'ennemi le plus proche */
function brRicochet(R, s, from){
  let best = null, bd = 260 * 260;
  R.P.foes.each(f=>{
    if(f === from || f.hp <= 0 || s.hits.includes(f)) return;
    const d = (f.x - s.x) ** 2 + (f.y - s.y) ** 2;
    if(d < bd){ bd = d; best = f; }
  });
  if(!best) return;
  const sp = Math.hypot(s.vx, s.vy) || 360, a = Math.atan2(best.y - s.y, best.x - s.x);
  s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp;
  s.life = Math.max(s.life, 0.6);
  Object.assign(brFxNew(R), {k:"ring", x:s.x, y:s.y, r:10, life:0.15, max:0.15, color:s.color});
}

/* ---------- le rendu des zones nouvelles ---------- */
function brDrawZoneExtra(x, R, z, X, Y){
  const zx = X(z.x), zy = Y(z.y), k = Math.max(0, z.life) / z.max;
  switch(z.k){
    case "strike":
      if(z.quiet){ x.globalAlpha = 0.35 * (1 - k); x.fillStyle = z.color; x.beginPath(); x.arc(zx, zy, z.r * (1 - k * 0.6), 0, 7); x.fill(); x.globalAlpha = 1; return true; }
      /* le point d'impact s'annonce, puis la frappe tombe du ciel */
      x.strokeStyle = z.color; x.lineWidth = 2; x.globalAlpha = 0.8;
      x.beginPath(); x.arc(zx, zy, z.r * (0.25 + 0.75 * k), 0, 7); x.stroke();
      x.globalAlpha = 0.15; x.fillStyle = z.color; x.beginPath(); x.arc(zx, zy, z.r, 0, 7); x.fill();
      if(k < 0.35){ x.globalAlpha = 0.9; x.fillStyle = z.color; x.fillRect(zx - 3, zy - 400 * (k / 0.35), 6, 400 * (k / 0.35)); }
      x.globalAlpha = 1;
      return true;
    case "tornado":
      x.save(); x.translate(zx, zy);
      for(let i = 0; i < 4; i++){ x.rotate(R.t * 6 + i); x.strokeStyle = z.color; x.globalAlpha = 0.65 - i * 0.12; x.lineWidth = 3;
        x.beginPath(); x.arc(0, 0, z.r * (0.4 + i * 0.22), 0, 3.6); x.stroke(); }
      x.restore(); x.globalAlpha = 1;
      return true;
    case "sweep":
      if(z.cur === undefined) return true;
      x.save(); x.translate(zx, zy); x.rotate(z.cur);
      x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.8 * Math.min(1, k * 3);
      x.fillStyle = z.color; x.fillRect(0, -z.bw, z.len, z.bw * 2);
      x.fillStyle = "#ffffff"; x.fillRect(0, -z.bw * 0.35, z.len, z.bw * 0.7);
      x.restore(); x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      return true;
    case "wall": {
      const cx = Math.cos(z.a), cy = Math.sin(z.a);
      x.save(); x.translate(zx, zy); x.rotate(z.a);
      x.globalAlpha = 0.55 * Math.min(1, k * 2); x.fillStyle = z.color; x.fillRect(-18, -z.span / 2, 36, z.span);
      x.globalAlpha = 0.9 * Math.min(1, k * 2); x.fillStyle = "#e8fbff"; x.fillRect(10, -z.span / 2, 7, z.span);
      x.restore(); x.globalAlpha = 1;
      return true; }
    case "sing":
      x.save(); x.translate(zx, zy);
      x.globalAlpha = 0.5; x.fillStyle = "#12001e"; x.beginPath(); x.arc(0, 0, 16 + (1 - k) * 18, 0, 7); x.fill();
      for(let i = 0; i < 3; i++){ x.rotate(-R.t * 5); x.strokeStyle = z.color; x.globalAlpha = 0.7; x.lineWidth = 2;
        x.beginPath(); x.arc(0, 0, z.r * k * (0.5 + i * 0.25), 0, 4.5); x.stroke(); }
      x.restore(); x.globalAlpha = 1;
      return true;
  }
  return false;
}
