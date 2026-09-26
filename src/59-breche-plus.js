/* ============================================================
   59 — LA BRÈCHE · CONTENU ÉTENDU
   Retour de jeu : trop peu de diversite, et la faille profonde
   pouvait se jouer les mains libres pendant vingt minutes. Ce
   fichier ajoute de quoi construire, de quoi ramasser, de quoi
   craindre — et une faille qui finit toujours par gagner.
   ============================================================ */

/* ---------- le second type colore l'attaque ----------
   Un Pokemon double-type ajoute un effet a son attaque : 386 especes,
   des centaines de combinaisons, autant de facons de jouer. */
const BR_SEC = {
  1:  {n:"Robustesse",  d:"+10 % de dégâts"},
  2:  {n:"Précision",   d:"+10 % de coups critiques"},
  3:  {n:"Vent arrière",d:"+12 % de dégâts, projectiles plus rapides"},
  4:  {n:"Poison",      d:"empoisonne la cible"},
  5:  {n:"Ensablement", d:"ralentit la cible"},
  6:  {n:"Fracas",      d:"+25 % contre élites et boss"},
  7:  {n:"Essaim",      d:"15 % de chances de frapper deux fois"},
  8:  {n:"Hantise",     d:"ignore les armures, +10 % de dégâts"},
  9:  {n:"Perce-blindage", d:"ignore les armures"},
  10: {n:"Brûlure",     d:"enflamme la cible"},
  11: {n:"Ressac",      d:"repousse fortement"},
  12: {n:"Sangsue",     d:"chaque coup soigne un peu"},
  13: {n:"Paralysie",   d:"15 % de chances d'immobiliser"},
  14: {n:"Télékinésie", d:"repousse très fortement"},
  15: {n:"Gel",         d:"ralentit fortement"},
  16: {n:"Fureur",      d:"+30 % contre élites et boss"},
  17: {n:"Coup bas",    d:"critiques trois fois plus forts"},
  18: {n:"Charme",      d:"la cible subit +30 % de dégâts"}
};
function brSecOf(w){ const t = POKE[brShownId(w)].types; return t.length > 1 ? t[1] : 0; }

/* ---------- synergies de type : une equipe coherente se renforce ----------
   Chaque type present sur 2 membres (palier 1) ou 4 (palier 2) donne un bonus. */
const BR_SYN = {
  1:  {n:"Normal",   a:"+15 % d'expérience",        b:"+35 % d'expérience"},
  2:  {n:"Combat",   a:"+8 % de critiques",          b:"+18 % de critiques"},
  3:  {n:"Vol",      a:"+10 % de vitesse",           b:"+22 % de vitesse"},
  4:  {n:"Poison",   a:"20 % d'empoisonnement",      b:"40 % d'empoisonnement"},
  5:  {n:"Sol",      a:"-8 % de dégâts subis",       b:"-18 % de dégâts subis"},
  6:  {n:"Roche",    a:"+15 % de PV max",            b:"+35 % de PV max"},
  7:  {n:"Insecte",  a:"+1 projectile",              b:"+2 projectiles"},
  8:  {n:"Spectre",  a:"+1 perforation",             b:"+3 perforations"},
  9:  {n:"Acier",    a:"-8 % de dégâts subis",       b:"-18 % de dégâts subis"},
  10: {n:"Feu",      a:"20 % de brûlure",            b:"40 % de brûlure"},
  11: {n:"Eau",      a:"+0,6 PV/s",                  b:"+1,8 PV/s"},
  12: {n:"Plante",   a:"+1 PV par K.O.",             b:"+3 PV par K.O."},
  13: {n:"Électrik", a:"attaques 8 % plus rapides",  b:"attaques 18 % plus rapides"},
  14: {n:"Psy",      a:"+12 % de zone",              b:"+28 % de zone"},
  15: {n:"Glace",    a:"15 % de ralentissement",     b:"30 % de ralentissement"},
  16: {n:"Dragon",   a:"+10 % de dégâts",            b:"+25 % de dégâts"},
  17: {n:"Ténèbres", a:"critiques ×2,5",             b:"critiques ×3,2"},
  18: {n:"Fée",      a:"Octets Turbo plus fréquents",b:"Octets Turbo bien plus fréquents"}
};
function brSynCount(R){
  const c = {};
  for(const w of R.team) for(const t of POKE[brShownId(w)].types) c[t] = (c[t] || 0) + 1;
  return c;
}
function brSynTier(n){ return n >= 4 ? 2 : n >= 2 ? 1 : 0; }

/* ---------- sept objets de plus ---------- */
Object.assign(BR_ITEMS, {
  orbe:    {n:"Orbe Vie",      g:"◆", c:"#ff5c8a", max:5, d:l=>`+${12*l} % de dégâts, mais -${6*l} % de PV max.`},
  casque:  {n:"Casque Brut",   g:"⬢", c:"#e0b46a", max:5, d:l=>`Qui vous touche encaisse ${25*l} dégâts.`},
  bouclier:{n:"Bouclier Data", g:"⬡", c:"#8ff7e8", max:4, d:l=>`Absorbe un coup toutes les ${14 - 2*l} s.`},
  sitrus:  {n:"Baie Sitrus",   g:"●", c:"#ffd24a", max:3, d:l=>`Sous 35 % de PV, soigne 30 % (recharge ${40 - 8*l} s).`},
  encens:  {n:"Encens Chance", g:"✧", c:"#ffb3dc", max:5, d:l=>`+${4*l} % de coups critiques.`},
  piece:   {n:"Pièce Rune",    g:"¤", c:"#ffd24a", max:5, d:l=>`+${15*l} % de Données et de PokéCoins en fin de run.`},
  cristal: {n:"Cristal Turbo", g:"ϟ", c:"#4fdcff", max:3, d:l=>`Octets Turbo ${50*l} % plus fréquents, +${l} s de durée.`}
});

/* ---------- les modificateurs complets ---------- */
function brPlusMods(R){
  const I = R.items, syn = brSynCount(R), T = t => brSynTier(syn[t] || 0);
  R.syn = syn;
  const m = R.mods;
  m.dmg   *= (1 + 0.12 * (I.orbe || 0)) * [1, 1.10, 1.25][T(16)] * (1 + (R.bonusDmg || 0));
  m.cd    *= [1, 0.92, 0.82][T(13)] * (R.bonusCd || 1);
  m.area  *= [1, 1.12, 1.28][T(14)];
  m.speed *= [1, 1.10, 1.22][T(3)];
  m.regen += [0, 0.6, 1.8][T(11)];
  m.armor *= [1, 0.92, 0.82][T(5)] * [1, 0.92, 0.82][T(9)];
  m.leech += [0, 1, 3][T(12)];
  m.crit   = 0.08 + [0, 0.08, 0.18][T(2)] + 0.04 * (I.encens || 0);
  m.critMul= [2, 2.5, 3.2][T(17)];
  m.burn   = [0, 0.2, 0.4][T(10)];
  m.poison = [0, 0.2, 0.4][T(4)];
  m.chill  = [0, 0.15, 0.3][T(15)];
  m.count  = [0, 1, 2][T(7)];
  m.pierce = [0, 1, 3][T(8)];
  m.xp     = [1, 1.15, 1.35][T(1)];
  m.turbo  = (1 + 0.5 * (I.cristal || 0)) * [1, 1.6, 2.4][T(18)];
  m.turboDur = 5 + (I.cristal || 0);
  m.thorns = 25 * (I.casque || 0);
  m.shieldCd = I.bouclier ? 14 - 2 * I.bouclier : 0;
  m.sitrus = I.sitrus ? 40 - 8 * I.sitrus : 0;
  m.loot = 1 + 0.15 * (I.piece || 0);
  if(R.buff){ if(R.buff.k === "force") m.dmg *= 1.4; if(R.buff.k === "hate") m.cd *= 0.7; if(R.buff.k === "aimant") m.magnet *= 4; }
  /* PV max : Roche et Orbe Vie les modifient, on garde la proportion de vie */
  const U = (S.breche && S.breche.upg) || {};
  const base = 150 * (1 + 0.10 * (U.hp || 0));
  const newMax = base * [1, 1.15, 1.35][T(6)] * Math.max(0.5, 1 - 0.06 * (I.orbe || 0));
  if(R.maxHp && Math.abs(newMax - R.maxHp) > 0.5){ const k = R.hp / R.maxHp; R.maxHp = newMax; R.hp = newMax * k; }
}

/* ---------- les coups : critiques, effets du second type, synergies ---------- */
function brHitRoll(R, f, dmg){
  const w = R.curW >= 0 ? R.team[R.curW] : null;
  const sec = w ? brSecOf(w) : 0;
  let crit = R.rng() < (R.mods.crit || 0.08) + (sec === 2 ? 0.10 : 0);
  let mul = crit ? (sec === 17 ? 3 : R.mods.critMul || 2) : 1;
  if(sec === 1) mul *= 1.10;
  if(sec === 3) mul *= 1.12;
  if(sec === 8) mul *= 1.10;
  if((f.elite || f.boss || f.big) && (sec === 6 || sec === 16)) mul *= sec === 16 ? 1.30 : 1.25;
  if(f.vuln > 0) mul *= 1.3;
  /* armure : les types Acier et Spectre la traversent */
  if(f.armor && sec !== 9 && sec !== 8) mul *= 0.4;
  return {d: dmg * mul, crit, sec};
}
function brOnHit(R, f, sec){
  if(f.hp <= 0) return;
  const M = R.mods, r = R.rng();
  if(sec === 10 || r < (M.burn || 0)){ f.dot = 2.5; f.dotDmg = Math.max(f.dotDmg || 0, 3 + R.t / 40); f.burn = 2.5; }
  if(sec === 4 || R.rng() < (M.poison || 0)){ f.dot = 3; f.dotDmg = Math.max(f.dotDmg || 0, 2.5 + R.t / 45); f.psn = 3; }
  if(sec === 5) f.slow = Math.max(f.slow, 0.8);
  if(sec === 15 || R.rng() < (M.chill || 0)) f.slow = Math.max(f.slow, 1.4);
  if(sec === 13 && R.rng() < 0.15 && !f.boss) f.stun = 0.6;
  if(sec === 11){ f.kx *= 1.8; f.ky *= 1.8; }
  if(sec === 14){ f.kx *= 2.6; f.ky *= 2.6; }
  if(sec === 12) R.hp = Math.min(R.maxHp, R.hp + 0.3);
  if(sec === 18 && R.rng() < 0.2) f.vuln = 3;
}

/* ---------- cartes dorées : rares, et on les sent passer ---------- */
const BR_GOLD = [
  {k:"surcharge", n:"Surcharge",    d:"Toute l'équipe gagne un niveau."},
  {k:"resonance", n:"Résonance",    d:"+15 % de dégâts pour le reste de la run."},
  {k:"hyper",     n:"Hypervitesse", d:"Attaques 10 % plus rapides pour le reste de la run."},
  {k:"sursaut",   n:"Octet d'or",   d:"Deux montées de niveau immédiates."}
];
function brApplyGold(R, k){
  if(k === "surcharge") R.team.forEach(w=>{ if(w.lv < BR_MAXLV) w.lv++; });
  if(k === "resonance") R.bonusDmg = (R.bonusDmg || 0) + 0.15;
  if(k === "hyper") R.bonusCd = (R.bonusCd || 1) * 0.9;
  if(k === "sursaut") R.pendingLevels += 2;
  brRecomputeMods(R);
}

/* ============================================================
   RAMASSABLES — l'Octet Turbo, l'aimant, la baie
   ============================================================ */
const BR_PICKS = {
  turbo:  {g:"»", c:"#4fdcff", n:"TURBO"},
  magnet: {g:"◉", c:"#ff3d7f", n:"AIMANT"},
  berry:  {g:"●", c:"#ff6a5a", n:"BAIE"}
};
function brDrop(R, f){
  if(f.boss || f.reaper) return;
  const M = R.mods, r = R.rng();
  let k = null;
  if(r < (f.elite || f.big ? 0.35 : 1 / 70) * (M.turbo || 1)) k = "turbo";
  else if(R.rng() < (f.elite || f.big ? 0.25 : 1 / 320)) k = "magnet";
  else if(R.rng() < 1 / 180) k = "berry";
  if(!k) return;
  const p = R.P.picks.get();
  p.x = f.x; p.y = f.y; p.k = k; p.t = 0; p.tree = false;
}
function brPicks(R, dt){
  R.P.picks.each(p=>{
    p.t += dt;
    if(p.t > 25){ p.on = false; return; }
    const d = Math.hypot(R.x - p.x, R.y - p.y);
    if(d < 22){
      p.on = false;
      if(p.k === "turbo"){ R.turbo = R.mods.turboDur || 5; brBanner(R, "TURBO !", "#4fdcff"); try { Sfx.shiny(); buzz([10, 20, 10]); } catch(e){} }
      if(p.k === "magnet"){ R.P.gems.each(g=>g.pull = true); brRing(R, R.x, R.y, 300, "#ff3d7f", 0.5); try { Sfx.win(); } catch(e){} }
      if(p.k === "berry" && p.tree) brMisTick(R, "baie");
      if(p.k === "berry"){ R.hp = Math.min(R.maxHp, R.hp + R.maxHp * 0.25); brText(R, R.x, R.y - 30, "+PV", "#5ce07a", 14); try { Sfx.coin(); } catch(e){} }
      brBurst(R, p.x, p.y, BR_PICKS[p.k].c, 18, 180, 0.5);
    }
  });
  /* turbo : on fonce, et on percute ce qu'on traverse */
  if(R.turbo > 0){
    R.turbo -= dt;
    R.ghosts = R.ghosts || [];
    R.ghosts.unshift({x:R.x, y:R.y, face:R.face});
    if(R.ghosts.length > 8) R.ghosts.pop();
    brNear(R, R.x, R.y, 40, f=>{
      if(f.reaper || (f.hitT && R.t - f.hitT < 0.25)) return;
      f.hitT = R.t;
      const dx = f.x - R.x, dy = f.y - R.y, d = Math.hypot(dx, dy) || 1;
      R.curW = -1;
      brHit(R, f, 14 + R.lv * 2.2, "#4fdcff", dx / d, dy / d, 520);
    });
  } else if(R.ghosts) R.ghosts.length = 0;
  /* bouclier et baie Sitrus */
  if(R.mods.shieldCd){ R.shieldT = (R.shieldT || 0) + dt; if(R.shieldT >= R.mods.shieldCd) R.shield = true; }
  if(R.mods.sitrus && R.hp < R.maxHp * 0.35 && (R.sitrusT || 0) <= 0){
    R.hp = Math.min(R.maxHp, R.hp + R.maxHp * 0.3); R.sitrusT = R.mods.sitrus;
    brText(R, R.x, R.y - 30, "Sitrus !", "#ffd24a", 14);
  }
  if(R.sitrusT > 0) R.sitrusT -= dt;
}
/* un coup recu passe d'abord par le bouclier et le Casque Brut */
function brTakeHit(R, dmg, from){
  if(R.turbo > 0) return false;
  if(R.shield){ R.shield = false; R.shieldT = 0; brRing(R, R.x, R.y, 40, "#8ff7e8", 0.3); return false; }
  R.hp -= dmg * R.mods.armor;
  if(from && R.mods.thorns){ R.curW = -1; brHit(R, from, R.mods.thorns, "#e0b46a", 0, 0, 0); }
  return true;
}

/* ============================================================
   MENACES — des ennemis qui obligent a bouger
   ============================================================ */
function brRollKind(R){
  const t = R.t, deep = R.depth || 0, r = R.rng();
  const w = [
    ["shooter",  t > 150 ? 0.07 + deep * 0.012 : 0],
    ["rusher",   t > 270 ? 0.06 + deep * 0.012 : 0],
    ["armored",  t > 330 ? 0.06 + deep * 0.010 : 0],
    ["splitter", t > 400 ? 0.05 + deep * 0.010 : 0]
  ];
  let acc = 0;
  for(const [k, p] of w){ acc += p; if(r < acc){
    if(k === "shooter"){ let n = 0; R.P.foes.each(f=>{ if(f.kind === "shooter") n++; }); if(n >= 12) return "n"; }
    return k; } }
  return "n";
}
function brShapeFoe(R, f, kind){
  f.kind = kind; f.armor = kind === "armored"; f.fuse = 0; f.shootT = 1 + R.rng() * 2;
  f.stun = 0; f.vuln = 0; f.burn = 0; f.psn = 0; f.hitT = 0;
  if(kind === "shooter"){ f.spd *= 0.85; f.max = f.hp = Math.round(f.hp * 1.2); }
  if(kind === "rusher"){ f.spd *= 1.6; f.max = f.hp = Math.round(f.hp * 0.7); }
  if(kind === "armored"){ f.size = 54; f.r = f.size * 0.32; f.spd *= 0.75; f.max = f.hp = Math.round(f.hp * 2.2); }
  if(kind === "splitter"){ f.size = 56; f.r = f.size * 0.32; f.max = f.hp = Math.round(f.hp * 1.6); }
  if(kind === "nest"){ f.size = 70; f.r = 26; f.spd = 0; f.dmg = 0; f.max = f.hp = Math.round(f.hp * 30); }
  if(kind === "split"){ f.size = 30; f.r = 10; f.spd *= 1.35; f.max = f.hp = Math.max(1, Math.round(f.hp * 0.35)); }
}
/* renvoie vrai si l'ennemi a gere son deplacement lui-meme */
function brFoeAI(R, f, dt){
  if(f.kind === "nest") return brNestAI(R, f, dt);
  const dx = R.x - f.x, dy = R.y - f.y, d = Math.hypot(dx, dy) || 1;
  if(f.kind === "shooter"){
    /* garde ses distances et tire */
    const want = 230, dir = d > want + 30 ? 1 : d < want - 30 ? -1 : 0;
    const sp = f.spd * (f.slow > 0 ? 0.5 : 1);
    f.x += (dx / d * sp * dir + (-dy / d) * sp * 0.4 + f.kx) * dt;
    f.y += (dy / d * sp * dir + (dx / d) * sp * 0.4 + f.ky) * dt;
    f.kx *= 0.86; f.ky *= 0.86;
    f.shootT -= dt;
    if(f.shootT <= 0 && d < 420){
      f.shootT = 3.4;
      const s = brShot(R, f.x, f.y, dx / d * 135, dy / d * 135, {dmg:f.dmg * 0.55, r:7, color:"#b06bff", life:3.5, kind:"enemy", pierce:1, w:-1});
      s.enemy = true;
    }
    return true;
  }
  if(f.kind === "rusher"){
    /* fonce, s'allume, explose */
    if(f.fuse > 0){
      f.fuse -= dt;
      if(f.fuse <= 0){
        brRing(R, f.x, f.y, 62, "#ff5a1a", 0.35); brBurst(R, f.x, f.y, "#ff8a3d", 24, 220, 0.5); brShake(R, 5);
        if(Math.hypot(R.x - f.x, R.y - f.y) < 62 && R.inv <= 0 && brTakeHit(R, f.dmg * 1.4, null)){ R.inv = 0.6; R.hurt = 0.3; }
        f.hp = 0; R.curW = -1; f.on = false;
      }
      return true;
    }
    if(d < 46){ f.fuse = 0.6; return true; }   /* le temps de reagir */
    return false;
  }
  return false;
}

/* ============================================================
   LA FAILLE PROFONDE — elle finit toujours par gagner
   ============================================================ */
const BR_DEPTH_NEWS = {
  1: "Les tireurs se multiplient",
  2: "Des kamikazes surgissent",
  3: "Un écho de légendaire remonte",
  4: "Les blindés arrivent en nombre",
  5: "Les scindeurs se divisent",
  6: "Un écho de légendaire remonte",
  8: "La faille accélère",
  9: "Un écho de légendaire remonte",
  12: "LA FAILLE VOUS A REPÉRÉ"
};
function brDepthTick(R){
  if(!R.endless) return;
  const d = 1 + Math.floor((R.t - R.bossAt) / 60);
  if(d <= (R.depth || 0)) return;
  R.depth = d;
  R.chestsPending++;                               /* chaque palier franchi paie */
  brBanner(R, "PROFONDEUR " + d, d >= 12 ? "#ff3d7f" : "#b06bff", BR_DEPTH_NEWS[d] || "La corruption s'épaissit");
  if(d % 3 === 0 && d < 12) brSummonEcho(R);
  if(d === 12) brSummonReaper(R);
}
function brLegendsOf(region){
  const r = regionDef(region), out = [];
  for(let i = r.from; i <= r.to; i++) if(POKE[i] && POKE[i].leg) out.push(i);
  return out.length ? out : [144, 145, 146];
}
function brSummonEcho(R){
  if(R.boss && R.boss.on) return;
  const L = brLegendsOf(R.region), id = L[Math.floor(R.rng() * L.length)];
  const f = brSpawnFoe(R, id, "boss");
  f.echo = true;
  const rm = BR_REGION_MULT[R.region] || 1;
  f.max = f.hp = Math.round(9000 * rm * Math.pow(1.3, R.depth) * (1 + R.lv / 22));
  f.spd = 50; f.dmg = 15 * Math.sqrt(rm) * Math.pow(1.12, R.depth);
  f.atk = 2; f.pattern = 0;
  R.boss = f;
  brBanner(R, "ÉCHO DE LÉGENDAIRE", "#ffd24a", POKE[id].name.toUpperCase());
  brShake(R, 8);
}
function brSummonReaper(R){
  const f = R.P.foes.get();
  const a = R.rng() * Math.PI * 2, dd = Math.max(R.W, R.H) * 0.7;
  Object.assign(f, {x:R.x + Math.cos(a) * dd, y:R.y + Math.sin(a) * dd, id:0, reaper:true, boss:false, elite:false, big:false,
    size:112, r:34, max:5e7, hp:5e7, spd:62, dmg:9999, flash:0, kx:0, ky:0, slow:0, dot:0, dotAcc:0, phase:0,
    kind:"reaper", armor:false, stun:0, vuln:0, shiny:false, charge:null, burn:0, psn:0, hitT:0, since:R.t});
  R.reaper = f;
  brShake(R, 14); try { buzz([80, 60, 160]); } catch(e){}
}
function brReaperAI(R, f, dt){
  /* elle accelere sans cesse : on peut la fuir un temps, jamais toujours */
  const spd = f.spd * (1 + (R.t - f.since) / 50);
  const dx = R.x - f.x, dy = R.y - f.y, d = Math.hypot(dx, dy) || 1;
  f.x += dx / d * spd * dt; f.y += dy / d * spd * dt;
  if(d < 40 && R.turbo <= 0){ R.shield = false; R.hp = -1; }
}
/* un echo vaincu : trois coffres, une pluie d'octets, et on continue */
function brEchoDown(R, f){
  R.boss = null;
  R.chestsPending += 3;
  R.echoes = (R.echoes || 0) + 1;
  brBurst(R, f.x, f.y, "#ffd24a", 70, 320, 0.8);
  brBanner(R, "ÉCHO DISSIPÉ", "#ffd24a", "trois coffres de données");
  R.slowmo = 0.8; brShake(R, 10);
  try { Sfx.win(); } catch(e){}
}

/* ---------- l'attaque change de nom a l'evolution finale ---------- */
const BR_ARCH_N2 = {1:"Ultralaser", 2:"Close Combat", 3:"Aéroblast", 4:"Détricanon", 5:"Faille tellurique",
  6:"Lame de Roc", 7:"Mégacorne", 8:"Revenant", 9:"Luminocanon", 10:"Déflagration", 11:"Hydrocanon",
  12:"Tempête Florale", 13:"Fatal-Foudre", 14:"Psyko", 15:"Blizzard", 16:"Draco-Météore", 17:"Vibrobscur", 18:"Pouvoir Lunaire"};
function brAttackName(w){
  const t = POKE[brShownId(w)].types[0];
  return w.stage >= 2 ? BR_ARCH_N2[t] : BR_ARCH[t].n;
}
/* ce que change un Pokemon candidat pour les synergies de l'equipe */
function brSynPreview(R, id){
  const now = brSynCount(R), out = [];
  for(const t of POKE[id].types){
    const n = (now[t] || 0) + 1, before = brSynTier(now[t] || 0), after = brSynTier(n);
    if(after > before) out.push({t, tier:after, d: after === 2 ? BR_SYN[t].b : BR_SYN[t].a});
  }
  return out;
}
function brSynHtml(R, full){
  const c = R.syn || brSynCount(R);
  const act = Object.entries(c).map(([t, n])=>[+t, n, brSynTier(n)]).filter(x=>x[2] > 0);
  if(!act.length) return full ? `<div class="tiny dim">Aucune synergie : deux Pokémon d'un même type en activent une.</div>` : "";
  return act.map(([t, n, tier])=>full
    ? `<div class="br-syn"><span class="tt t${t}">${TYPE_NAMES[t]}</span><b>${n}</b><span class="tiny">${esc(tier === 2 ? BR_SYN[t].b : BR_SYN[t].a)}</span></div>`
    : `<span class="br-synchip t${t} tier${tier}">${TYPE_NAMES[t].slice(0,3)}<b>${n}</b></span>`).join("");
}
