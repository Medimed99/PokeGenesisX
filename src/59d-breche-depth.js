/* ============================================================
   59d — LA BRÈCHE · LES PROFONDEURS
   Retour de jeu : une fois le boss battu, la faille profonde
   tournait en boucle, sans surprise ; et une équipe qui soignait
   à chaque K.O. devenait intuable — la partie ne finissait plus.

   · LES SOINS passent tous par brHeal : ceux qui viennent des K.O.
     et des coups (Grelot Coque, Sangsue, Plante) puisent dans une
     réserve qui ne se remplit que de 2,5 % des PV par seconde ; et
     plus on descend, moins la faille laisse guérir.
   · LES PALIERS durent 55 s. Chacun tire une ANOMALIE au sort,
     sans répétition : la nuit, la pluie de données, le miroir, la
     horde dorée, les mines, les géants, le chasseur, le silence, la
     faille qui se referme, la frénésie. Un écho de légendaire monte
     aux paliers 3 et 6.
   · AU PALIER 9, PORYGON-Z DESCEND EN PERSONNE : « Ça fait trop
     longtemps que t'es là-dedans. On a encore du boulot dehors. »
     Le vaincre ou tomber devant lui : dans les deux cas, il te
     ramène. Les profondeurs ont désormais une fin.
   ============================================================ */

const BR_DEPTH_LEN = 55;            /* secondes par palier */
const BR_PZ_DEPTH = 9;              /* le palier où Porygon-Z vient vous chercher */
const BR_PZ_ID = 474;

/* ============================================================
   1. LES SOINS
   ============================================================ */
function brHealMul(R, src){
  let k = 1;
  if(R.endless) k *= Math.max(0.3, 1 - 0.07 * (R.depth || 0));
  if(R.anom && R.anom.k === "silence" && src !== "reward") k = 0;
  return k;
}
/* src : "leech" (K.O., coups), "regen", "reward" (niveaux, coffres), "item" (baies, objets) */
function brHeal(R, v, src){
  if(!(v > 0) || !(R.hp > 0)) return 0;
  v *= brHealMul(R, src);
  if(src === "leech"){
    R.leechB = R.leechB === undefined ? R.maxHp * 0.05 : R.leechB;
    v = Math.min(v, R.leechB);
    R.leechB -= v;
  }
  const before = R.hp;
  R.hp = Math.min(R.maxHp, R.hp + v);
  return R.hp - before;
}
/* la réserve des soins au K.O. se remplit lentement */
function brHealTick(R, dt){
  const cap = R.maxHp * 0.05;
  R.leechB = Math.min(cap, (R.leechB === undefined ? cap : R.leechB) + R.maxHp * 0.025 * dt);
}

/* ============================================================
   2. LES ANOMALIES — une par palier, tirée au sort
   ============================================================ */
const BR_ANOM = {
  nuit:     {n:"NUIT NOIRE",              d:"On ne voit plus que ce que l'équipe éclaire.", c:"#6a5aff"},
  meteores: {n:"PLUIE DE DONNÉES",        d:"Des blocs tombent du plafond de la faille. Regardez le sol.", c:"#35f0d6"},
  miroir:   {n:"MIROIR",                  d:"La faille copie votre équipe et la lance contre vous.", c:"#c878ff"},
  doree:    {n:"HORDE DORÉE",             d:"Des ennemis dorés fuient en emportant des octets. Rattrapez-les.", c:"#ffd24a"},
  mines:    {n:"CHAMP DE MINES",          d:"Des blocs instables jonchent le sol : ils explosent au contact.", c:"#ff3d7f"},
  geants:   {n:"GÉANTS",                  d:"Moins d'ennemis, mais trois fois plus solides.", c:"#ff8a3d"},
  chasseur: {n:"LE CHASSEUR",             d:"Un élite vous a marqué : vous subissez +35 % de dégâts tant qu'il vit.", c:"#ff3d4f"},
  silence:  {n:"SILENCE",                 d:"Plus aucun soin. Mais chaque octet compte double.", c:"#9fb0c8"},
  retrecit: {n:"LA FAILLE SE REFERME",    d:"Un cercle se resserre autour de vous. Hors du cercle, ça brûle.", c:"#ff5a7a"},
  frenesie: {n:"FRÉNÉSIE",                d:"Tout va plus vite : les ennemis, et vos attaques.", c:"#ffe45e"}
};
const BR_PZ_DEPTH_LINES = {
  1:"On descend ? D'accord. Je garde un œil sur toi.",
  3:"Un écho remonte. Il ne te lâchera pas.",
  4:"Tu commences à sentir le fond, non ?",
  6:"Encore un écho. La faille a de la mémoire.",
  7:"Hm. Ça fait longtemps. Vraiment longtemps.",
  8:"Encore un palier, et je viens te chercher. Je ne plaisante pas."
};
function brAnomStart(R, k){
  const A = BR_ANOM[k];
  R.anom = {k, t:0, n:A.n};
  if(k === "nuit") R.darkAnom = true;
  if(k === "geants") R.spawnMul = 0.45;
  if(k === "frenesie"){ R.P.foes.each(f=>{ if(!f.boss) f.spd *= 1.35; }); }
  if(k === "retrecit") R.arena = {x:R.x, y:R.y, r:Math.max(R.W, R.H) * 0.95, target:760, burnT:0, anom:true};
  if(k === "chasseur") brSpawnHunter(R);
  if(k === "mines") R.mineT = 0;
  if(k === "meteores") R.meteoT = 1.5;
  brRecomputeMods(R);
}
function brAnomEnd(R){
  const a = R.anom; if(!a) return;
  R.darkAnom = false; R.spawnMul = 1; R.mines = null; R.hunter = null;
  if(a.k === "retrecit" && R.arena && R.arena.anom) R.arena = null;
  R.anom = null;
  brRecomputeMods(R);
}
function brAnomTick(R, dt){
  const a = R.anom; if(!a) return;
  a.t += dt;
  if(a.k === "meteores"){
    R.meteoT -= dt;
    if(R.meteoT <= 0){
      R.meteoT = 0.75 - Math.min(0.35, (R.depth || 0) * 0.03);
      const x = R.x + (R.rng() - .5) * 440, y = R.y + (R.rng() - .5) * 440, dmg = 9 + (R.depth || 0) * 2.5;
      brWarn(R, x, y, 54, 1.25, dmg, "#35f0d6", ()=>{
        brDecal(R, "crater", x, y, 54, 8); brBurst(R, x, y, "#35f0d6", 16, 220, 0.5);
        R.curW = -1;
        brNear(R, x, y, 54, f=>{ if(!f.boss && Math.hypot(f.x - x, f.y - y) < 54 + f.r) brHit(R, f, 60 + R.t / 3, "#35f0d6", 0, 0, 0); });
      }).cube = true;
    }
  }
  if(a.k === "mines"){
    R.mineT -= dt;
    if(R.mineT <= 0){
      R.mineT = 13;
      R.mines = (R.mines || []).filter(m=>!m.gone).slice(-24);
      for(let k = 0; k < 10; k++){
        const ang = R.rng() * Math.PI * 2, d = 140 + R.rng() * 300;
        R.mines.push({x:R.x + Math.cos(ang) * d, y:R.y + Math.sin(ang) * d, arm:0.8, ph:R.rng() * 6});
      }
    }
    for(const m of R.mines || []){
      if(m.gone) continue;
      if(m.arm > 0){ m.arm -= dt; continue; }
      let boom = Math.hypot(R.x - m.x, R.y - m.y) < 24;
      if(!boom) brNear(R, m.x, m.y, 30, f=>{ if(!f.boss && !f.fixed && Math.hypot(f.x - m.x, f.y - m.y) < 18 + f.r) boom = true; });
      if(boom){
        m.gone = true;
        brRing(R, m.x, m.y, 90, "#ff3d7f", 0.35); brBurst(R, m.x, m.y, "#ff3d7f", 24, 240, 0.5); brShake(R, 5);
        brDecal(R, "crater", m.x, m.y, 44, 7);
        R.curW = -1;
        brNear(R, m.x, m.y, 90, f=>{ if(!f.boss && Math.hypot(f.x - m.x, f.y - m.y) < 90 + f.r) brHit(R, f, 120 + R.t / 2, "#ff3d7f", 0, 0, 0); });
        if(Math.hypot(R.x - m.x, R.y - m.y) < 90 && R.inv <= 0 && brTakeHit(R, 14 + (R.depth || 0) * 2.5, null)){ R.inv = 0.5; R.hurt = 0.3; }
      }
    }
  }
  if(a.k === "retrecit" && R.arena && R.arena.anom) R.arena.target = Math.max(230, 760 - a.t * 10);
  if(a.k === "chasseur" && R.hunter && (!R.hunter.on || R.hunter.hp <= 0)){
    R.hunter = null; R.chestsPending += 2;
    brBanner(R, "CHASSEUR ABATTU", "#ff3d4f", "deux coffres de données");
    brTicker(R, "LA MARQUE S'EFFACE", "#ff3d4f");
  }
}
/* le chasseur : un élite solide et rapide, qui vous marque */
function brSpawnHunter(R){
  const ids = [];
  for(const w of R.team) ids.push(brShownId(w));
  const id = R.rng() < 0.5 && ids.length ? ids[Math.floor(R.rng() * ids.length)] : brSpecies(R);
  const f = brSpawnFoe(R, id, "elite");
  f.max = f.hp = Math.round(f.hp * 3.2); f.spd *= 1.3; f.hunter = true;
  R.hunter = f;
  if(typeof brMiniIntro === "function") brMiniIntro(R, f, "LE CHASSEUR", POKE[id].name.toUpperCase() + " VOUS A MARQUÉ", "#ff3d4f");
}

/* ============================================================
   3. LE TEMPS DES PROFONDEURS
   ============================================================ */
function brDepthStart(R){
  R.endless = true; R.depth = 0; R.deepClock = BR_DEPTH_LEN - 4;
  const bag = Object.keys(BR_ANOM);
  for(let i = bag.length - 1; i > 0; i--){ const j = Math.floor(R.rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  R.anomBag = bag;
}
/* l'horloge ne tourne pas pendant un écho ou Porygon-Z : on ne cumule pas les menaces */
function brDepthTick(R){
  if(!R.endless || R.pzOn) return;
  const dt = R.deepPrevT === undefined ? 0 : Math.max(0, R.t - R.deepPrevT);
  R.deepPrevT = R.t;
  if(R.deepClock === undefined) brDepthStart(R);
  brAnomTick(R, dt);
  if(R.echoAt && R.t >= R.echoAt){ R.echoAt = 0; if(!(R.boss && R.boss.on)) brSummonEcho(R); }
  if(R.boss && R.boss.on) return;
  R.deepClock += dt;
  if(R.deepClock < BR_DEPTH_LEN) return;
  R.deepClock = 0;
  const d = (R.depth || 0) + 1;
  R.depth = d;
  brAnomEnd(R);
  if(d >= BR_PZ_DEPTH){ brSummonPorygon(R); return; }
  R.chestsPending++;                               /* chaque palier franchi paie */
  const k = (R.anomBag && R.anomBag.length ? R.anomBag.shift() : Object.keys(BR_ANOM)[Math.floor(R.rng() * 10)]);
  brAnomStart(R, k);
  const A = BR_ANOM[k];
  brBanner(R, "PROFONDEUR " + d, A.c, A.n + " — " + A.d);
  brTicker(R, "PROFONDEUR " + d + " — " + A.n, A.c);
  if(BR_PZ_DEPTH_LINES[d] && typeof brSay === "function") brSay(R, "pz", BR_PZ_DEPTH_LINES[d], 3.6);
  if(d === 3 || d === 6) R.echoAt = R.t + 4;
  try { Sfx.glitch(); buzz([20, 30, 20]); } catch(e){}
}
/* le palier en cours, pour l'interface */
function brDepthInfo(R){
  if(!R.endless) return null;
  const left = Math.max(0, BR_DEPTH_LEN - (R.deepClock || 0));
  const next = (R.depth || 0) + 1;
  return {left, next, anom:R.anom ? BR_ANOM[R.anom.k] : null, pz:next >= BR_PZ_DEPTH};
}

/* ============================================================
   4. PORYGON-Z
   Il descend se projeter dans la faille pour vous en sortir.
   Ses attaques sont les siennes : Triplattaque, Ultralaser,
   Conversion, la pluie de blocs, la téléportation, et Recyclage,
   qui recrache votre propre équipe en copies corrompues.
   ============================================================ */
/* ce que Porygon-Z sait de la fin : il l'a vécue dans cette connexion, ou il se souvient depuis qu'on a écrit */
function brPzKnows(){ try { return !!((S.flags && S.flags.mnBeaten) || (typeof sagaWrote === "function" && sagaWrote())); } catch(e){ return false; } }
function brSummonPorygon(R){
  if(R.pzOn) return;
  R.pzOn = true;
  /* la voie se dégage : il n'a besoin de personne */
  R.P.foes.each(o=>{ if(!o.boss) { brBurst(R, o.x, o.y, "#35f0d6", 4, 120, 0.3); o.on = false; } });
  const f = brSpawnFoe(R, 137, "boss");
  f.id = BR_PZ_ID; f.pz = true; f.nm = "Porygon-Z";
  f.size = 120; f.r = 36;
  const rm = BR_REGION_MULT[R.region] || 1;
  f.max = f.hp = Math.round(26000 * rm * (1 + R.lv / 18));
  f.spd = 64; f.dmg = 16 * Math.sqrt(rm);
  f.atk = 2.4; f.pattern = 0; f.recent = {};
  f.x = R.x + 40; f.y = R.y - 150;
  R.boss = f;
  brBanner(R, "PROFONDEUR " + BR_PZ_DEPTH, "#35f0d6", "SORTIE FORCÉE");
  brTicker(R, "PORYGON-Z ENTRE DANS LA FAILLE", "#35f0d6");
  if(typeof brCineStart === "function") brCineStart(R, f, {kicker:"PROFONDEUR " + BR_PZ_DEPTH + " · CONTRÔLE DE SORTIE", title:"PORYGON-Z", sub:"LE GUIDE NE VOUS LAISSE PAS ICI",
    color:"#35f0d6", dur:6.2, pz:true, lines: brPzKnows() ? [
      [0.3, "pz", "Bon."],
      [1.3, "pz", "Tu sais tout, maintenant. Ce n'est pas une raison pour rester là-dedans."],
      [3.0, "pz", "On remonte. Je te ramène — de force, s'il le faut. J'ai l'habitude."]
    ] : [
      [0.3, "pz", "Bon."],
      [1.3, "pz", "Ça fait trop longtemps que t'es là-dedans."],
      [3.0, "pz", "On a encore du boulot dehors. Je te ramène — de force, s'il le faut."]
    ]});
  else f.shield = false;
}
/* l'IA : un jeu d'attaques à lui, qui s'accélère quand il faiblit */
const BR_PZ_KIT = ["tri", "rain", "blink", "ultra", "conv", "tri", "rain", "blink"];
function brPzAI(R, b, dt){
  brBossQueue(R, b);
  if(b.flash > 0) b.flash -= dt;
  /* il flotte au-dessus de vous, toujours dans le cadre : on doit le voir */
  const dx = R.x - b.x, dy = R.y - b.y, d = Math.hypot(dx, dy) || 1;
  /* (le haut de l'écran est sous l'interface : il reste dans la moitié visible) */
  const tx = R.x + Math.sin(R.t * 0.55) * (R.W || 390) * 0.28, ty = R.y - 105 + Math.cos(R.t * 0.9) * 30;
  if(!b.lock){
    const ex = tx - b.x, ey = ty - b.y, e = Math.hypot(ex, ey) || 1, v = Math.min(e * 2.5, 260);
    b.x += ex / e * v * dt; b.y += ey / e * v * dt;
    b.dir = brDir8 ? brDir8(dx, dy, b.dir || 0) : b.dir;
  }
  if(b.conv && (b.convT -= dt) <= 0){ b.conv = 0; brTicker(R, "CONVERSION DISSIPÉE", "#35f0d6"); }
  if(d < b.r + 16 && R.inv <= 0 && brTakeHit(R, b.dmg, b)){ R.inv = 0.7; brShake(R, 6); R.hurt = 0.3; }
  /* les seuils */
  const pct = b.hp / b.max;
  if(!b.p55 && pct < 0.55){ b.p55 = true; brPzRecycle(R, b); }
  if(!b.p25 && pct < 0.25){ b.p25 = true; brBanner(R, "SURCHAUFFE", "#ff3d7f", "il accélère");
    brSay(R, "pz", "D'accord, d'accord ! Tu es solide. Mais je ne lâche pas.", 3); brShake(R, 8); }
  b.atk -= dt;
  if(b.atk > 0) return;
  b.atk = b.p25 ? 1.7 : 2.4;
  const k = BR_PZ_KIT[b.pattern++ % BR_PZ_KIT.length];
  BR_PZ_MOVES[k](R, b);
}
const BR_PZ_MOVES = {
  /* Triplattaque : trois rayons, feu, glace, foudre, qui balaient en éventail */
  tri(R, b){
    const a0 = Math.atan2(R.y - b.y, R.x - b.x);
    const cols = ["#ff8a3d", "#aef4ff", "#ffe45e"];
    cols.forEach((c, i)=>{
      const a = a0 - 0.9 + i * 0.9;
      Object.assign(brFxNew(R), {k:"warnline", x:b.x, y:b.y, a, len:460, w:12, life:0.8, max:0.8, color:c});
      brLater(b, R, 0.8, ()=>(R.hazards = R.hazards || []).push({k:"laser", a0:a, arc:b.p25 ? 1.1 : 0.7, life:1.0, max:1.0, len:480, dmg:b.dmg * 0.8, hit:false, boss:b, col:c}));
    });
    b.pose = {anim:"shoot", t:0};
    brText(R, b.x, b.y - b.r - 24, "TRIPLATTAQUE", "#ffffff", 13);
  },
  /* Ultralaser : il se fige, vise longuement, puis tout part d'un coup */
  ultra(R, b){
    const a = Math.atan2(R.y - b.y, R.x - b.x);
    b.lock = 1.6;
    Object.assign(brFxNew(R), {k:"warnline", x:b.x, y:b.y, a, len:640, w:46, life:1.4, max:1.4, color:"#ff3d7f"});
    brText(R, b.x, b.y - b.r - 24, "ULTRALASER", "#ff3d7f", 14);
    b.pose = {anim:"charge", t:0};
    brLater(b, R, 1.4, ()=>{
      (R.hazards = R.hazards || []).push({k:"bigbeam", x:b.x, y:b.y, a, len:640, w:46, life:0.55, max:0.55, dmg:b.dmg * 2.2, hit:false});
      brShake(R, 12); brHitstop(R, 50);
    });
    brLater(b, R, 1.9, ()=>{ b.lock = 0; });
  },
  /* Conversion : il prend le type qui l'a le plus frappé, et y résiste */
  conv(R, b){
    let best = 0, bv = 0;
    for(const t in b.recent){ if(b.recent[t] > bv){ bv = b.recent[t]; best = +t; } }
    b.recent = {};
    if(!best) return BR_PZ_MOVES.rain(R, b);
    b.conv = best; b.convT = 9;
    brBanner(R, "CONVERSION", "#35f0d6", "il résiste désormais au type " + TYPE_NAMES[best]);
    brTicker(R, "CONVERSION — RÉSISTE AU TYPE " + TYPE_NAMES[best].toUpperCase(), "#35f0d6");
    brSay(R, "pz", `Conversion. Ton ${TYPE_NAMES[best]} ne me fait plus grand-chose. Change de méthode !`, 3);
    brRing(R, b.x, b.y, 120, brTypeCol(best), 0.5);
  },
  /* la pluie de blocs : un quadrillage qui tombe autour de vous */
  rain(R, b){
    const n = b.p25 ? 9 : 7;
    for(let k = 0; k < n; k++){
      const x = R.x + (R.rng() - .5) * 300, y = R.y + (R.rng() - .5) * 300;
      brLater(b, R, k * 0.12, ()=>{ brWarn(R, x, y, 46, 1.0, b.dmg * 0.9, "#35f0d6", ()=>{ brDecal(R, "crater", x, y, 46, 6); brBurst(R, x, y, "#35f0d6", 12, 200, 0.4); }).cube = true; });
    }
    b.pose = {anim:"attack", t:0};
  },
  /* la téléportation : il se défait, réapparaît ailleurs, et arrose */
  blink(R, b){
    brBurst(R, b.x, b.y, "#35f0d6", 30, 220, 0.5);
    b.ghost = {x:b.x, y:b.y, t:0.5};
    /* il réapparaît sur un côté ou en dessous : jamais sous l'interface */
    const a = -0.35 + R.rng() * (Math.PI + 0.7);
    b.x = R.x + Math.cos(a) * 150 * (R.rng() < 0.5 ? 1 : -1); b.y = R.y + Math.sin(a) * 170;
    brBurst(R, b.x, b.y, "#ff3d7f", 30, 220, 0.5);
    brLater(b, R, 0.45, ()=>brSalvo(R, b, b.p25 ? 18 : 14, 165, "#ff3d7f", R.rng() * 6));
  }
};
/* Recyclage : votre propre équipe, recrachée en copies corrompues */
function brPzRecycle(R, b){
  brBanner(R, "RECYCLAGE", "#c878ff", "il recrache votre équipe");
  brSay(R, "pz", "Tu t'accroches, hein ? Moi aussi. Voilà ce que la faille a gardé de toi.", 3.2);
  const ids = R.team.map(w=>brShownId(w)).slice(0, 3);
  ids.forEach((id, i)=>{
    const f = brSpawnFoe(R, id, "elite");
    const a = i / ids.length * Math.PI * 2;
    f.x = b.x + Math.cos(a) * 80; f.y = b.y + Math.sin(a) * 80;
    f.max = f.hp = Math.round(f.hp * 1.6); f.copy = true;
    brBurst(R, f.x, f.y, "#c878ff", 18, 160, 0.4);
  });
  brShake(R, 8);
}
function brPzDown(R, f){
  R.boss = null; R.pzDown = true; R.pzOn = false;
  /* la faille se tait : plus personne n'en sort, vous êtes à l'abri */
  R.spawnMul = 0; R.inv = 99; R.hazards = [];
  R.P.foes.each(o=>{ if(o === f) return; brDefrag(R, o); o.on = false; });
  R.slowmo = 1.6; brShake(R, 14);
  if(typeof brFinaleStart === "function") brFinaleStart(R, f, "#35f0d6");
  brBanner(R, "PORYGON-Z S'INCLINE", "#35f0d6", "sortie forcée — avec les honneurs");
  brSay(R, "pz", brPzKnows() ? "…Bon. Tu m'as eu. On rentre quand même ? Plus bas, il n'y a plus rien à aller voir. On y est déjà allés, tous les deux."
    : "…Bon. Tu m'as eu. On rentre quand même, d'accord ? Il y a quelque chose, plus bas. Je ne veux pas que tu le voies. Pas encore.", 5.5);
  try { Sfx.win(); buzz([40, 50, 90]); } catch(e){}
  setTimeout(()=>{ if(BR === R) brFinish(R, true); }, 5200);
}
/* tomber devant lui n'est pas une défaite : il vous rapatrie */
function brPzRescue(R){
  R.over = true; R.pzRescued = true;
  brSay(R, "pz", "Allez, on rentre. Tu as fait du bon travail, là-dedans.", 3.4);
  brBanner(R, "RAPATRIEMENT", "#35f0d6", "Porygon-Z vous sort de la faille");
  try { Sfx.glitch(); } catch(e){}
  setTimeout(()=>{ if(BR === R) brFinish(R, true); }, 2600);
}
function brTypeCol(t){ return (BR_ARCH[t] && BR_ARCH[t].c) || "#35f0d6"; }

/* ============================================================
   5. LES RACCORDS — le moteur appelle ces points
   ============================================================ */
/* l'espèce qui apparaît : en Miroir, souvent la vôtre */
const _brSpecies0 = brSpecies;
brSpecies = function(R){
  if(R.anom && R.anom.k === "miroir" && R.team.length && R.rng() < 0.7) return brShownId(R.team[Math.floor(R.rng() * R.team.length)]);
  return _brSpecies0(R);
};
/* l'ennemi qui naît : doré, géant ou frénétique selon l'anomalie */
const _brSpawnFoe0 = brSpawnFoe;
brSpawnFoe = function(R, id, kind){
  const f = _brSpawnFoe0(R, id, kind);
  f.gold = false; f.hunter = false; f.copy = false; f.pz = false; f.nm = null; f.conv = 0; f.lock = 0; f.ghost = null;
  const A = R.anom && R.anom.k;
  if(!A || f.boss || f.fixed) return f;
  if(A === "geants" && f.kind === "n"){ f.size *= 1.6; f.r = f.size * 0.32; f.max = f.hp = Math.round(f.hp * 3.2); f.dmg *= 1.4; f.spd *= 0.85; }
  if(A === "frenesie") f.spd *= 1.35;
  if(A === "miroir") f.spd *= 1.12;
  if(A === "doree" && f.kind === "n" && R.rng() < 0.18){ f.gold = true; f.kind = "gold"; f.max = f.hp = Math.round(f.hp * 1.5); f.spd *= 1.1; }
  return f;
};
/* l'ennemi doré fuit */
const _brFoeAI0 = brFoeAI;
brFoeAI = function(R, f, dt){
  if(f.kind === "gold"){
    const dx = f.x - R.x, dy = f.y - R.y, d = Math.hypot(dx, dy) || 1;
    const sp = f.spd * (f.slow > 0 ? 0.5 : 1) * (d < 340 ? 1.1 : 0.4);
    f.x += (dx / d * sp + f.kx) * dt; f.y += (dy / d * sp + f.ky) * dt; f.kx *= 0.86; f.ky *= 0.86;
    return true;
  }
  return _brFoeAI0(R, f, dt);
};
/* un coup reçu : le chasseur vous rend plus fragile */
const _brTakeHit0 = brTakeHit;
brTakeHit = function(R, dmg, from){
  if(R.hunter && R.hunter.on && R.hunter.hp > 0) dmg *= 1.35;
  return _brTakeHit0(R, dmg, from);
};
/* la Conversion de Porygon-Z, et sa mémoire des types qui le frappent */
const _brHitRoll0 = brHitRoll;
brHitRoll = function(R, f, dmg){
  const r = _brHitRoll0(R, f, dmg);
  if(f.pz && R.curW >= 0 && R.team[R.curW]){
    const tp = POKE[brShownId(R.team[R.curW])].types[0];
    f.recent[tp] = (f.recent[tp] || 0) + r.d;
    if(f.conv === tp) r.d *= 0.25;
  }
  return r;
};

/* ============================================================
   6. LE DESSIN DES ANOMALIES
   ============================================================ */
function brDrawAnom(x, R, X, Y){
  /* les mines : des blocs instables qui clignotent */
  if(R.mines) for(const m of R.mines){
    if(m.gone) continue;
    const mx = X(m.x), my = Y(m.y);
    if(mx < -30 || my < -30 || mx > R.W + 30 || my > R.H + 30) continue;
    const blink = Math.floor((R.t + m.ph) * (m.arm > 0 ? 10 : 3)) % 2;
    x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(mx, my + 8, 11, 4, 0, 0, 7); x.fill();
    x.fillStyle = "#1a0614"; x.fillRect(mx - 9, my - 9, 18, 16);
    x.fillStyle = blink ? "#ff3d7f" : "#6a1a3a"; x.fillRect(mx - 7, my - 7, 14, 4);
    x.fillStyle = "#35f0d6"; x.fillRect(mx - 7 + ((R.t * 20 + m.ph * 9) % 12), my - 1, 2, 2);
    x.strokeStyle = blink ? "rgba(255,61,127,.55)" : "rgba(255,61,127,.15)"; x.lineWidth = 1; x.beginPath(); x.arc(mx, my, 24, 0, 7); x.stroke();
  }
  R.P.foes.each(f=>{
    const fx = X(f.x), fy = Y(f.y);
    if(fx < -80 || fy < -80 || fx > R.W + 80 || fy > R.H + 80) return;
    /* l'ennemi doré : un halo, des éclats */
    if(f.gold){ const g = x.createRadialGradient(fx, fy, 0, fx, fy, f.size * 0.7); g.addColorStop(0, "rgba(255,210,74,.55)"); g.addColorStop(1, "rgba(255,210,74,0)");
      x.fillStyle = g; x.fillRect(fx - f.size, fy - f.size, f.size * 2, f.size * 2);
      if(R.rng() < 0.2) brBurst(R, f.x + (R.rng() - .5) * 20, f.y - 10, "#ffe9a8", 1, 30, 0.4); }
    /* la copie de votre équipe : un contour violet */
    if(f.copy){ x.strokeStyle = "rgba(200,120,255,.7)"; x.lineWidth = 2; x.beginPath(); x.ellipse(fx, fy + f.size * 0.3, f.size * 0.38, f.size * 0.13, 0, 0, 7); x.stroke(); }
  });
  /* le chasseur : sa marque vous relie à lui */
  const h = R.hunter;
  if(h && h.on && h.hp > 0){
    const hx = X(h.x), hy = Y(h.y);
    x.strokeStyle = `rgba(255,61,79,${0.35 + Math.sin(R.t * 8) * 0.2})`; x.lineWidth = 2; x.setLineDash([8, 6]); x.lineDashOffset = -R.t * 60;
    x.beginPath(); x.moveTo(hx, hy); x.lineTo(R.W / 2, R.H / 2); x.stroke(); x.setLineDash([]);
    x.fillStyle = "#ff3d4f"; x.font = "bold 10px ui-monospace,monospace"; x.textAlign = "center"; x.fillText("◎ CHASSEUR", hx, hy - h.size * 0.62);
  }
  /* Porygon-Z : la trace de sa téléportation */
  const b = R.boss;
  if(b && b.pz && b.ghost){ b.ghost.t -= 1 / 60; if(b.ghost.t <= 0) b.ghost = null;
    else { x.globalAlpha = b.ghost.t; x.globalCompositeOperation = "lighter";
      brPmdDraw(x, BR_PZ_ID, "w", 0, null, X(b.ghost.x), Y(b.ghost.y), b.size * 0.95, b.ghost.t);
      x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; } }
}
