/* ============================================================
   30 — CAPTURE (module central)
   ============================================================ */

let ENC = null;          /* rencontre courante */
let busy = false;

/* condition d'ouverture, formulee pour le joueur */
function regionGate(key){
  const r = regionDef(key);
  if(r.act === 1) return null;
  const prev = REGIONS[r.act-2];
  const core = prev.guardians[2];
  return {prev, core, done: S.bosses.includes(prev.key + ":" + core.id),
          need: core.need, have: dexCount(prev.key)};
}
function regionUnlocked(key){
  const r = regionDef(key);
  if(r.act === 1) return true;
  const prev = REGIONS[r.act-2];
  return S.bosses.includes(prev.key + ":" + prev.guardians[2].id);
}
function unlockedRegions(){ return REGIONS.filter(r=>regionUnlocked(r.key)); }

/* Pokemon vedette du jour : deterministe a partir de la date.
   La rarete est ponderee : une vedette tres rare apparaissant 8% du temps
   deformerait completement l'economie du secteur. */
const FEATURED_TIER_W = [45, 30, 20, 5];       /* commun -> tres rare */
function featuredId(){
  const d = today();
  let h = 0;
  for(let i=0;i<d.length;i++) h = (h*31 + d.charCodeAt(i)) >>> 0;
  const pools = [[],[],[],[]];
  for(const r of unlockedRegions())
    for(let i=r.from;i<=r.to;i++){
      const p = POKE[i];
      if(p && p.leg === 0 && p.rar <= 3 && !isExclusive(i)) pools[p.rar].push(i);
    }
  const tot = FEATURED_TIER_W.reduce((a,b,i)=>a + (pools[i].length ? b : 0), 0);
  let x = h % Math.max(1, tot), tier = 0;
  for(let i=0;i<4;i++){
    if(!pools[i].length) continue;
    if(x < FEATURED_TIER_W[i]){ tier = i; break; }
    x -= FEATURED_TIER_W[i];
    tier = i;
  }
  const pool = pools[tier].length ? pools[tier] : pools.flat();
  return pool[(h >>> 5) % pool.length];
}

/* --- generation de rencontre --- */
function rollRarity(){
  const regionPct = dexRegionPct(S.region);
  const legAllowed = regionPct >= 60;
  const wx = weatherDef();
  const boostRare = eventActive("ev_rare") || boostActive("rare") || luckyF("rare") > 0 || !!wx.rare;
  const rareMul = 4.5 * (boostActive("rare") ? 1.6 : 1) * (1 + luckyF("rare")) * (wx.rare ? 1.3 : 1);
  let pool = RARITY.map((r,i)=>{
    let w = r.w;
    if(i === 5 && !legAllowed) w = 0;
    if(boostRare && i >= 2) w *= rareMul;
    /* l'integrite basse favorise les entites corrompues */
    if(i === 4) w *= (1 + (100-S.integrity)/140);
    if(cycleMod("m_rare") && i <= 1) w *= 0.45;
    return w;
  });
  const tot = pool.reduce((a,b)=>a+b,0);
  let x = rng()*tot;
  for(let i=0;i<pool.length;i++){ x -= pool[i]; if(x <= 0) return i; }
  return 0;
}
function speciesForRarity(rar){
  /* l'habitat, l'heure et la meteo priment : on ne pioche a plat qu'en dernier recours */
  const h = speciesInHabitat(rar);
  if(h) return h;
  const r = regionDef(S.region);
  const out = [];
  for(let i=r.from; i<=r.to; i++){
    const p = POKE[i]; if(!p) continue;
    if(p.rar !== rar || isExclusive(i)) continue;
    if(isGuardianSpecies(i) && !isReleasedGuardian(i)) continue;   /* verrou encore actif */
    if(p.leg === 1 && !isReleasedGuardian(i)) { if(rar === 5 && dexRegionPct(S.region) < 60) continue; }
    out.push(i);
  }
  if(!out.length){
    for(let i=r.from;i<=r.to;i++) if(POKE[i] && POKE[i].leg===0 && !isExclusive(i)) out.push(i);
  }
  return pick(out);
}
function isReleasedGuardian(id){ return S.bosses.some(b=>b.endsWith(":"+id)); }
const GUARDIAN_IDS = REGIONS.flatMap(r=>r.guardians.map(g=>g.id));
function isGuardianSpecies(id){ return GUARDIAN_IDS.includes(id); }

function shinyOdds(){
  let base = 1/1000;
  base *= 1 + Math.min(7, S.streak * 0.035);   /* levier principal : la chaine */
  if(S.shinyCharge > 0) base *= 3;
  if(eventActive("ev_shiny")) base *= 2.5;
  if(S.flags.zero) base *= 2.5;                /* Couche Zero */
  if(heldActive("shiny")) base *= 1.4;
  if(boostActive("shiny")) base *= 2;
  if(luckyF("shiny")) base *= luckyF("shiny");
  base *= perkMul("p_shiny", 0.20);
  base *= charmMul();
  return Math.min(base, 0.025);
}
function shinyOddsText(){ return "1 sur " + fmt(Math.round(1/shinyOdds())); }

function levelFor(rar){
  const base = 3 + S.level*1.35 + rar*5;
  return clamp(Math.round(base + randInt(-3, 4)), 2, 92);
}

/* Une entite chromatique ne se presente pas comme les autres : l'ecran
   blanchit, le temps se suspend, et la scene garde ensuite une poussiere
   doree qui ne retombe jamais tant qu'elle est la. */
function shinyEntrance(){
  const st = document.getElementById("enc-stage");
  if(!st) return;
  st.classList.remove("shiny-in"); void st.offsetWidth; st.classList.add("shiny-in");
  const flash = document.createElement("div");
  flash.className = "shiny-flash";
  st.appendChild(flash);
  setTimeout(()=>flash.remove(), 900);
  burstEl(st, {n:34, spread:170, colors:["#ffd24a","#ffffff","#fff3c4"], dur:1200});
  Sfx.shiny(); buzz([28, 40, 28, 40, 90]);
  shakeApp();
  pzFlash(pick([
    "Celle-là est mal encodée. Ses couleurs ne correspondent pas à sa définition.",
    "Anomalie de teinte. Le système ne l'a même pas remarquée.",
    "Ne la rate pas. Je ne sais pas quand la prochaine passera."
  ]));
}

/* Apres une capture ou une fuite : en Peche, on revient a la ligne au lieu
   de tirer une rencontre classique. Tout passe par ici, pour qu'aucun chemin
   n'oublie le mode — c'etait le cas de quatre appels differents. */
function nextEncounter(){
  if(S.capMode === "fish"){ ENC = null; return null; }
  return newEncounter();
}

function newEncounter(force){
  const featured = featuredId();
  let rar, id;
  if(!force && rng() < 0.08){ id = featured; rar = POKE[id].rar; }
  else if(S.habitat === "safari" && isSafariDay()){ id = safariSpecies(); rar = POKE[id].rar; }
  else { rar = force?.rar ?? repelRarity(rollRarity()); id = force?.id ?? speciesForRarity(rar); rar = POKE[id].rar; }
  lureTick();

  /* apparition rare de la faille */
  const missChance = S.stats.catches > 60 && !S.flags.sawMissing ? 0.018 : 0.0016;
  if(!force && S.stats.catches > 40 && rng() < missChance){
    ENC = {id:0, level:0, shiny:false, rar:5, missing:true, attempts:0};
    S.shinyCharge = Math.max(0, S.shinyCharge-1);
    return ENC;
  }

  /* charme de collection : une rencontre sur cinq vise une espece manquante */
  if(!force && boostActive("new") && rng() < 0.2){
    const miss = [];
    const rg = regionDef(S.region);
    for(let i=rg.from;i<=rg.to;i++) if(POKE[i] && !S.dex[i] && POKE[i].leg===0 && !isExclusive(i)) miss.push(i);
    if(miss.length){ id = pick(miss); rar = POKE[id].rar; }
  }
  const shiny = rng() < shinyOdds();
  ENC = {id, level: levelFor(rar), shiny, rar, attempts:0, featured: id===featured, fleeing:false};
  if(S.shinyCharge > 0) S.shinyCharge--;
  /* l'entree en scene est jouee apres le rendu, sinon la scene n'existe pas encore */
  if(shiny) setTimeout(shinyEntrance, 110);
  else if(rar >= 3){ pzFlash(pzLine("rare")); }
  saveSoon();
  return ENC;
}

/* --- formule de capture ---
   La courbe en puissance compresse le bas de l'echelle : un commun se capture
   presque toujours, et la difficulte se concentre sur les hautes raretes.
   C'est ce qui rend la serie tenable, donc la chasse au chromatique atteignable. */
function catchChance(ballKey){
  if(!ENC || ENC.missing) return 0;
  const ball = BALLS[ballKey];
  if(ball.mult >= 255) return 1;
  const p = POKE[ENC.id];
  let c = Math.pow(p.catch / 255, 0.55) * ball.mult;
  if(S.buffs.framby) c *= 1.5;
  c *= 1 + Math.min(0.35, S.streak * 0.002);          /* appoint de serie */
  c *= clamp(1.15 - ENC.level / 220, 0.62, 1.15);     /* niveau de la cible */
  c *= 1 + ENC.attempts * 0.12;                       /* chaque essai fatigue l'entite */
  c *= [1, .95, .88, .80, .70, .52][ENC.rar];
  if(ENC.shiny) c *= 0.88;
  c *= buddyBonus().catch;
  if(heldActive("catch")) c *= 1.12;
  c *= perkMul("p_catch", 0.04);
  return clamp(c, 0.03, 0.98);
}
/* probabilite que l'entite se desindexe apres un lancer rate */
function fleeChance(){
  return clamp(0.04 + ENC.attempts * 0.06 + ENC.rar * 0.028, 0, 0.60);
}

/* --- visée : mini-jeu d'adresse ---
   Principe repris de la v1 : uniquement du bonus, jamais de malus.
   Rater la secteur rend exactement la chance nominale, viser juste la majore
   jusqu'a x1.25. Le geste devient actif sans punir le joueur pressé. */
let AIM = null;
function skillEnabled(){ return S && S.settings && S.settings.skill !== false; }
function aimNeeded(){
  if(!skillEnabled() || !ENC || ENC.missing || busy) return false;
  if(selBall() === "master") return false;
  return catchChance(selBall()) < 0.95;      /* inutile quand la prise est acquise */
}
function startAim(){
  if(AIM) return;
  const w = 30 - Math.min(16, ENC.rar * 4);              /* secteur plus etroite si rare */
  const lo = 18 + rng() * (78 - w);
  AIM = {pos: 0, dir: 1, speed: 1.15 + ENC.rar * 0.32, zone: [lo, lo + w], timer: null, best: 1};
  refresh();
  AIM.timer = setInterval(()=>{
    if(!AIM) return;
    AIM.pos += AIM.dir * AIM.speed;
    if(AIM.pos >= 100){ AIM.pos = 100; AIM.dir = -1; }
    if(AIM.pos <= 0){ AIM.pos = 0; AIM.dir = 1; }
    const c = document.getElementById("aim-cursor");
    if(!c){ stopAim(); return; }
    c.style.left = AIM.pos + "%";
    const inZone = AIM.pos >= AIM.zone[0] && AIM.pos <= AIM.zone[1];
    c.classList.toggle("hot", inZone);
  }, 16);
}
function stopAim(){ if(AIM){ clearInterval(AIM.timer); AIM = null; } }
function aimBonus(pos, zone){
  if(pos < zone[0] || pos > zone[1]) return 1;
  const center = (zone[0] + zone[1]) / 2, half = (zone[1] - zone[0]) / 2;
  return 1 + (1 - Math.abs(pos - center) / half) * 0.25;
}
function lockAim(){
  if(!AIM) return;
  const bonus = aimBonus(AIM.pos, AIM.zone);
  const perfect = bonus >= 1.22;
  stopAim();
  if(bonus > 1){
    S.stats.skill = (S.stats.skill||0) + 1;
    if(perfect){
      S.stats.perfect = (S.stats.perfect||0) + 1;
      Sfx.shiny(); buzz([15,30,15]);
      toast("Verrouillage parfait — ×" + bonus.toFixed(2), "warn", "star");
    } else {
      Sfx.wobble(); buzz(12);
      toast("Verrouillage ×" + bonus.toFixed(2), "", "check");
    }
  }
  refresh();
  throwBall(selBall(), bonus);
}

/* --- lancer --- */
function throwBall(ballKey, skill){
  if(busy || !ENC) return;
  if((S.balls[ballKey]||0) <= 0){ toast("Plus de " + BALLS[ballKey].name, "bad", "cross"); return; }
  busy = true;
  S.balls[ballKey]--;
  S.stats.throws++; S.daily.dayThrow++; questTick("dayThrow",1);

  if(ENC.missing){ resolveMissing(ballKey); return; }

  const chance = Math.min(0.99, catchChance(ballKey) * (skill || 1));
  const success = rng() < chance;
  const wobbles = success ? 3 : (chance > 0.6 ? 3 : chance > 0.3 ? 2 : randInt(0,2));
  animateThrow(ballKey, wobbles, success, ()=>{
    if(success) onCatch(ballKey);
    else onFail(ballKey);
  });
  saveSoon();
}

function animateThrow(ballKey, wobbles, success, done){
  const stage = document.getElementById("enc-stage");
  if(!stage){ done(); return; }
  const sp = document.getElementById("enc-sprite");
  const b = document.createElement("div");
  b.className = "ball-fly";
  b.innerHTML = `<svg viewBox="0 0 24 24" style="width:100%;height:100%">${ICONS[BALLS[ballKey].icon]}</svg>`;
  b.style.animation = "throwarc .42s forwards cubic-bezier(.2,.6,.4,1)";
  stage.appendChild(b);
  Sfx.throwb(); buzz(10);

  setTimeout(()=>{
    if(sp){
      sp.style.transition = "opacity .18s, transform .18s";
      sp.style.opacity = 0;
      sp.style.transform = "scale(.3) translateY(-46px)";
    }
    const ring = document.createElement("div");
    ring.className = "catch-ring";
    stage.appendChild(ring);
    setTimeout(()=>ring.remove(), 620);

    b.style.animation = "none";
    b.style.transform = "translate(-50%,-160px)";
    let i = 0;
    const tick = () => {
      if(i >= wobbles){
        if(success){
          b.style.transition = "filter .2s, transform .2s";
          b.style.filter = "brightness(1.8) drop-shadow(0 0 14px var(--cyan))";
          Sfx.caught(); buzz([24,40,60]);
          burstEl(b, {n:22, spread:90, colors:["#35f0d6","#ffffff","#ffc857"], dur:800});
          setTimeout(()=>{ b.remove(); done(); }, 460);
        } else {
          if(sp){ sp.style.opacity = 1; sp.style.transform = "none"; }
          b.style.transition = "opacity .2s";
          b.style.opacity = 0;
          Sfx.fail(); buzz(30);
          burstEl(b, {n:8, spread:45, colors:["#ff3d7f","#5e7391"], dur:500});
          setTimeout(()=>{ b.remove(); done(); }, 280);
        }
        return;
      }
      b.style.animation = "wobble .42s";
      Sfx.wobble(); buzz(8);
      i++;
      setTimeout(()=>{ b.style.animation = "none"; b.style.transform = "translate(-50%,-160px)";
        setTimeout(tick, 110); }, 430);
    };
    setTimeout(tick, 270);
  }, 420);
}

function onCatch(ballKey){
  const caughtRar = ENC.rar;
  const p = POKE[ENC.id];
  const rarDef = RARITY[ENC.rar];
  if(ENC.id === 129){
    S.stats.karp = (S.stats.karp||0) + 1;
    if(ballKey === "master") S.flags.masterKarp = true;   /* employer la force */
  }
  /* un exemplaire sur cinquante est ecrit sans erreur d'arrondi */
  const wasPerfect = rollPerfect();
  const isNew = addToDex(ENC.id, ENC.level, ENC.shiny);
  if(wasPerfect && S.dex[ENC.id] && !S.dex[ENC.id].perfect){
    S.dex[ENC.id].perfect = true;
    S.stats.perfects = (S.stats.perfects || 0) + 1;
    setTimeout(()=>toast(`${POKE[ENC.id].name} est un exemplaire intègre ◈`, "warn", "star"), 500);
  }
  researchTick(ENC.id, "catch", 1);
  rodDiscoveryTick();
  rstreakCatch(ENC.rar);
  factionPts(1);
  rivalTick();
  if(ENC.shiny) researchTick(ENC.id, "shiny", 1);
  pikaLine(ENC.id);
  contractTick(ENC.id, isNew);

  /* recompenses */
  let coins = randInt(rarDef.coin[0], rarDef.coin[1]);
  coins = Math.round(coins * (1 + Math.min(0.6, S.streak*0.004))    /* appoint, pas jackpot */
                            * (1 + S.level*0.014) * buddyBonus().coin
                            * (heldActive("coin") ? 1.2 : 1)
                            * (boostActive("coin") ? 1.8 : 1) * (luckyF("coin") || 1)
                            * perkMul("p_coin", 0.15) * (cycleMod("m_econ") ? 0.5 : 1) * runeMul() * factionMul("coins")
                            * (weatherDef().gain || 1));
  if(S.buffs.sitrus) coins *= 2;
  if(eventActive("ev_coin")) coins *= 2;
  if(ENC.featured) coins = Math.round(coins*1.5);
  coins = Math.round(coins);

  let xp = rarDef.xp * (isNew?2.2:1);
  if(S.buffs.nigma) xp *= 2;
  xp = Math.round(xp * (1 + ENC.level*0.02) * buddyBonus().xp);

  let integ = rarDef.integ * (isNew ? 0.85 : 0.04);
  if(BALLS[ballKey].integBonus) integ *= BALLS[ballKey].integBonus;
  if(ENC.shiny) integ *= 2;

  gain("coins", coins);
  addXp(xp);
  addIntegrity(integ);
  if(eventActive("ev_shard") || luckyF("shard")) gain("shards", (luckyF("shardMul")||1));
  if(ENC.rar >= 4) gain("shards", randInt(2,5));
  if(ENC.shiny) gain("shards", 8);

  S.streak++;
  /* une capture sans le moindre lancer rate prolonge la serie propre */
  if(ENC.attempts === 0){ S.stats.cleanRun = (S.stats.cleanRun||0) + 1;
    S.stats.bestClean = Math.max(S.stats.bestClean||0, S.stats.cleanRun); }
  else S.stats.cleanRun = 0;
  S.failStreak = 0;
  if(S.streak > S.stats.bestStreak) S.stats.bestStreak = S.streak;
  S.stats.catches++;
  if(ENC.shiny) S.stats.shinies++;
  S.daily.dayCatch++; questTick("dayCatch",1);
  questSet("dayStreak", S.streak);
  if(ENC.rar >= 2){ S.daily.dayRare++; questTick("dayRare",1); }
  if(ballKey === "master" && ENC.rar <= 1) S.flags.masterWaste = true;
  /* exploits d'adresse et de chance */
  if(ENC.rar === 5 && ENC.attempts === 0 && ballKey !== "master") S.flags.legendFirst = true;
  if(ENC.shiny){ S.chainShiny = (S.chainShiny||0) + 1;
    if(S.chainShiny >= 3) S.flags.shiny3 = true; }

  clearBuffs();
  secretsTick();
  eggTick();
  buddyTick(caughtRar);
  streakMilestone();

  const st = document.getElementById("enc-stage");
  if(st) burstEl(st, {n: c_isBig(ENC) ? 30 : 16, spread: c_isBig(ENC) ? 130 : 80,
    colors: ENC.shiny ? ["#ffc857","#ffffff"] : [RARITY[ENC.rar].c, "#ffffff", "#35f0d6"], dur:900});
  const caught = Object.assign({}, ENC);
  ENC = null; busy = false;
  checkAchievements();
  guideTick();
  save();

  if(isNew) showDiscovery(caught, {coins, xp, integ, isNew});
  else showCatchResult(caught, {coins, xp, integ, isNew});
}

function onFail(ballKey){
  const safe = !!S.buffs.nanab;
  ENC.attempts++;
  S.failStreak++;
  S.stats.worstFail = Math.max(S.stats.worstFail||0, S.failStreak);
  S.stats.cleanRun = 0;
  if(S.failStreak >= 10 && !S.flags.fail10){ S.flags.fail10 = true; playStory("pz_fail"); }
  clearBuffs();
  pzFlash(pzLine("fail"));

  busy = false;
  if(cycleMod("m_chain") && !safe && S.streak > 0) breakStreak();
  /* un lancer rate ne coute que la ball : seule une fuite rompt la chaine */
  if(rng() < fleeChance()){
    const name = POKE[ENC.id].name;
    if(safe){
      toast("Baie Nanab : chaîne préservée", "warn", "check");
    } else if(S.streak > 0){
      breakStreak();
    }
    toast(`${name} s'est désindexé.`, "bad", "cross");
    pzFlash(pzLine("flee"));
    const sp = document.getElementById("enc-sprite");
    if(sp) sp.classList.add("flee");
    ENC = null;
    setTimeout(()=>{ nextEncounter(); refresh(); }, 420);
  } else refresh();
  checkAchievements();
  guideTick();
  saveSoon();
}

/* rupture de chaine : c'est le seul evenement punitif du module, il doit se voir */
function breakStreak(){
  const lost = S.streak;
  rstreakBreak(ENC.rar);
  S.streak = 0;
  S.chainShiny = 0;
  S.lastBreak = {n: lost, t: Date.now()};
  Sfx.lose(); buzz([60, 40, 90]);
  shakeApp();
  const box = document.querySelector(".streakbox");
  if(box){ box.classList.remove("broken"); void box.offsetWidth; box.classList.add("broken"); }
  toast(`Chaîne rompue à ${lost}`, "bad", "cross");
}

function resolveMissing(ballKey){
  const stage = document.getElementById("enc-stage");
  if(stage) stage.classList.add("shake");
  Sfx.glitch(); buzz([40,30,40,30,80]);
  S.flags.sawMissing = true;
  setTimeout(()=>{
    ENC = null; busy = false;
    gain("shards", 25); gain("cores", 1);
    toast("Fragments arrachés à la faille : +25", "warn", "shard");
    if(riftTick()){ save(); return; }
    /* effet de bord historique : la faille recopie une ligne du sac */
    const g6 = glitchSixthItem();
    if(g6){ save(); setTimeout(()=>showSixthGlitch(g6), 620); checkAchievements(); return; }
    /* la piece sans index ne se gagne pas : elle s'inscrit d'elle-meme */
    if(grantSecretCard()){
      save();
      setTimeout(()=>showCardWin("mn", 0, true), 700);
      return;
    }
    save();
    if(!checkStoryTriggers()){ nextEncounter(); refresh(); }
  }, 900);
}

function clearBuffs(){ S.buffs = {}; }

/* paliers de serie : le rythme de capture doit produire des pics reguliers */
const STREAK_TIERS = [
  {n:10,  rw:{coins:250},                 t:"Chaîne 10 — la chaîne tient."},
  {n:25,  rw:{shards:12},                 t:"Chaîne 25 — flux stable."},
  {n:50,  rw:{balls:{super:5}},           t:"Chaîne 50 — le secteur se lit tout seul."},
  {n:75,  rw:{berries:{micle:1}},         t:"Chaîne 75 — instabilité chromatique offerte."},
  {n:100, rw:{cores:1, balls:{hyper:5}},  t:"Chaîne 100 — flux ininterrompu."},
  {n:150, rw:{cores:2},                   t:"Chaîne 150 — je n'avais jamais vu ça."},
  {n:250, rw:{cores:3, shards:60},        t:"Chaîne 250 — tu forces le système à être cohérent."}
];
function streakMilestone(){
  const tier = STREAK_TIERS.find(x=>x.n === S.streak);
  if(tier){
    grantReward(tier.rw);
    Sfx.win();
    const st = document.getElementById("enc-stage");
    if(st) burstEl(st, {n:24, spread:120, colors:["#ffc857","#35f0d6","#ffffff"], dur:900});
    toast(tier.t + " · " + rewardText(tier.rw), "warn", "star");
    return;
  }
  if(S.streak % 10 === 0) pzFlash(pzLine("streak"));
}
function c_isBig(e){ return e.shiny || e.rar >= 4; }

/* --- révélation d'une espèce inédite ---
   Le cœur emotionnel d'un jeu de collection merite mieux qu'une notification. */
let DISCOVER = null;
function showDiscovery(c, rw){
  const box = document.getElementById("discover");
  if(!box){ showCatchResult(c, rw); return; }
  const p = POKE[c.id];
  const accent = c.shiny ? "var(--amber)" : RARITY[c.rar].c;
  box.className = "on";
  box.style.setProperty("--ac", accent);
  box.innerHTML = `
    <div class="dc-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker" id="dc-kicker">SIGNATURE NON RÉPERTORIÉE</div>
      <div class="dc-art" id="dc-art">
        <span class="sprbox" style="width:152px;height:152px">
          ${sprite(c.id, c.shiny, "ghosted", {anim:true, eager:true})}</span>
      </div>
      <div class="dc-num" id="dc-num"></div>
      <div class="dc-name" id="dc-name"></div>
      <div class="wrap dc-tags" id="dc-tags" style="justify-content:center"></div>
      <div class="dc-lore" id="dc-lore"></div>
      <div class="tiles dc-rw" id="dc-rw"></div>
      <button class="btn pri wide dc-ok" id="dc-ok" data-act="dcdone">Archiver</button>
    </div>`;
  box.onclick = e => { if(DISCOVER && DISCOVER.step < 4) dcJump(); };

  DISCOVER = {c, rw, step:0, timers:[]};
  const at = (ms, fn) => DISCOVER.timers.push(setTimeout(fn, ms));

  at(520, ()=>{
    DISCOVER.step = 1;
    const art = document.getElementById("dc-art");
    const spr = art && art.querySelector(".spr");
    if(spr) spr.classList.remove("ghosted");
    if(art){ art.classList.add("revealed"); burstEl(art, {n:30, spread:150,
      colors:[accent, "#ffffff", "#35f0d6"], dur:1000}); }
    box.classList.add("flash");
    setTimeout(()=>box.classList.remove("flash"), 260);
    Sfx.shiny(); buzz([25,40,70]);
    const k = document.getElementById("dc-kicker");
    if(k){ k.textContent = "NOUVELLE ENTRÉE D'ARCHIVE"; k.classList.add("done"); }
  });
  at(1000, ()=>{
    DISCOVER.step = 2;
    const el = document.getElementById("dc-num");
    if(!el) return;
    const full = "N°" + String(c.id).padStart(3, "0");
    let i = 0;
    const t = setInterval(()=>{
      i++;
      el.textContent = full.slice(0, i);
      Sfx.click();
      if(i >= full.length) clearInterval(t);
    }, 70);
    DISCOVER.timers.push(t);
  });
  at(1420, ()=>{
    DISCOVER.step = 3;
    const n = document.getElementById("dc-name");
    if(n){ n.textContent = p.name + (c.shiny ? " ◆" : ""); n.classList.add("in"); }
    const tg = document.getElementById("dc-tags");
    if(tg){ tg.innerHTML = typeTags(p.types) + rarTag(c.rar) +
      `<span class="tt t1">Niv.${c.level}</span>`; tg.classList.add("in"); }
  });
  at(1780, ()=>{ dcJump(); });
}
function dcJump(){
  if(!DISCOVER || DISCOVER.step >= 4) return;
  DISCOVER.timers.forEach(t=>{ clearTimeout(t); clearInterval(t); });
  DISCOVER.step = 4;
  const {c, rw} = DISCOVER;
  const p = POKE[c.id];
  const set = (id, html, cls) => { const el = document.getElementById(id);
    if(el){ el.innerHTML = html; if(cls) el.classList.add(cls); } };
  const art = document.getElementById("dc-art");
  const spr = art && art.querySelector(".spr");
  if(spr) spr.classList.remove("ghosted");
  if(art) art.classList.add("revealed");
  set("dc-kicker", "NOUVELLE ENTRÉE D'ARCHIVE", "done");
  set("dc-num", "N°" + String(c.id).padStart(3, "0"));
  set("dc-name", esc(p.name) + (c.shiny ? ' <span class="gold-t">◆</span>' : ""), "in");
  set("dc-tags", typeTags(p.types) + rarTag(c.rar) + `<span class="tt t1">Niv.${c.level}</span>`, "in");
  set("dc-lore", esc(loreOf(c.id)), "in");
  set("dc-rw", `
    <div class="tile gold"><div class="k">PokéCoins</div><div class="v">+${fmt(rw.coins)}</div></div>
    <div class="tile accent"><div class="k">Expérience</div><div class="v">+${fmt(rw.xp)}</div></div>
    <div class="tile"><div class="k">Intégrité</div><div class="v ok">+${rw.integ.toFixed(2)}%</div></div>
    <div class="tile"><div class="k">Chaîne</div><div class="v">${S.streak}</div></div>`, "in");
  const ok = document.getElementById("dc-ok");
  if(ok) ok.classList.add("in");
}
ACTIONS.dcdone = () => {
  const box = document.getElementById("discover");
  if(box){ box.className = ""; box.innerHTML = ""; box.onclick = null; }
  if(DISCOVER){ DISCOVER.timers.forEach(t=>{ clearTimeout(t); clearInterval(t); }); DISCOVER = null; }
  if(!checkStoryTriggers()){ nextEncounter(); refresh(); }
};

function showCatchResult(c, rw){
  const p = POKE[c.id];
  const accent = c.shiny ? "var(--amber)" : RARITY[c.rar].c;
  sheet(`
    <div class="center">
      <div class="h" style="justify-content:center;color:${accent}">ENTITÉ RESTAURÉE</div>
      <span class="sprbox" style="width:132px;height:132px;margin:2px auto 4px">
        ${sprite(c.id, c.shiny, "", {anim:true, eager:true})}
        <i class="sprshadow"></i>
      </span>
      <div style="font-family:var(--font-px);font-size:12px;line-height:1.7">
        ${esc(p.name)}${c.shiny?' <span class="gold-t">◆</span>':""}</div>
      <div class="wrap" style="justify-content:center;margin:7px 0 10px">
        ${typeTags(p.types)}${rarTag(c.rar)}<span class="tt t1">Niv.${c.level}</span>
      </div>
      <div class="tiles" style="margin-bottom:10px">
        <div class="tile gold"><div class="k">PokéCoins</div><div class="v">+${fmt(rw.coins)}</div></div>
        <div class="tile accent"><div class="k">Expérience</div><div class="v">+${fmt(rw.xp)}</div></div>
        <div class="tile"><div class="k">Intégrité</div><div class="v ok">+${rw.integ.toFixed(2)}%</div></div>
        <div class="tile"><div class="k">Chaîne</div><div class="v">${S.streak}</div></div>
      </div>
      <button class="btn pri wide" data-act="nextenc">Rencontre suivante</button>
    </div>`, true);
}
ACTIONS.nextenc = () => { closeSheet(); if(!checkStoryTriggers()){ nextEncounter(); refresh(); } };

/* --- ecran --- */

/* ambiance visuelle propre a chaque secteur */
/* paliers visuels de la chaine */
function comboTier(){
  const n = S.streak;
  return n >= 100 ? 4 : n >= 50 ? 3 : n >= 25 ? 2 : n >= 10 ? 1 : 0;
}
function comboLabel(){
  return ["chaîne","stable","dense","critique","saturée"][comboTier()];
}

const REGION_THEME = {
  kanto:{sky:"linear-gradient(180deg,#071a14,#04100c 55%,#060d14)", gl:"#1c4a38",
         hz:"rgba(92,224,122,.18)", dot:"#5ce07a"},
  johto:{sky:"linear-gradient(180deg,#1a1408,#0f0b05 55%,#0a0a10)", gl:"#4a3a18",
         hz:"rgba(255,200,87,.16)", dot:"#ffc857"},
  hoenn:{sky:"linear-gradient(180deg,#071624,#040d16 55%,#050a12)", gl:"#1c3a5a",
         hz:"rgba(79,178,255,.18)", dot:"#4fb2ff"}
};
function selBall(){
  /* au Parc Safari, seule la Safari Ball sert ; ailleurs, elle ne sert pas */
  if(S.habitat === "safari" && isSafariDay() && S.capMode !== "fish") return "safari";
  const k = S.selBall || "poke";
  return (BALLS[k] && k !== "safari") ? k : "poke";
}

SCREENS.capture = {
  html(){
    safariRollover();
    if(!ENC && !busy && S.capMode !== "fish") newEncounter();
    const regions = unlockedRegions();
    const locked = REGIONS.filter(r=>!regionUnlocked(r.key));
    const ev = currentEvent();
    const fid = featuredId();
    const sb = selBall();
    const chance = ENC && !ENC.missing ? catchChance(sb) : 0;
    const stock = S.balls[sb] || 0;

    return `
    <div class="chipbar">
      ${regions.map(r=>`<button class="chip ${S.region===r.key?"on":""}" data-act="setregion" data-r="${r.key}">
        ${esc(r.name)} <b class="mono-num">${dexCount(r.key)}/${r.to-r.from+1}</b></button>`).join("")}
      ${locked.map(r=>{
        const g = regionGate(r.key);
        /* on n'affiche jamais le nom du verrou : c'est toute la surprise */
        return `<button class="chip locked" data-act="regioninfo" data-r="${r.key}">
          ${ic("lock")} ${esc(r.name)}
          <em>${g.done ? "ouvert" : "verrouillé"}</em></button>`;}).join("")}
    </div>

    ${capModeBar()}
    ${S.capMode === "fish" ? "" : habitatBar()}
    ${weatherBanner()}
    ${S.capMode === "fish" ? "" : lureStrip()}
    ${luckyBanner()}
    ${boostStrip()}

    ${(S.capMode === "fish" && !ENC) ? fishStage() : this.stage()}

    <div class="streakbox" style="margin-bottom:9px">
      <span class="tiny dim">CHAÎNE</span>${infoBtn("streak")}${infoBtn("rarete")}
      <b class="v mono-num">${S.streak}</b>
      <span class="pips">${Array.from({length:10},(_,i)=>{
        const filled = i < (S.streak % 10 || (S.streak ? 10 : 0));
        const mile = filled && S.streak >= 10 && (i === 9);
        return `<i class="${filled?"on":""} ${mile?"milestone":""}"></i>`;
      }).join("")}</span>
      <span class="tiny dim center" style="line-height:1.3">chroma<br><b class="gold-t">${shinyOddsText()}</b></span>
    </div>
    ${S.capMode === "fish" ? "" : rstreakRow()}

    <div class="ballrow">
      ${Object.entries(BALLS).filter(([k])=>(k === "safari") === (selBall() === "safari")).map(([k,b])=>{
        const n = S.balls[k] || 0;
        const c = ENC && !ENC.missing ? Math.round(catchChance(k)*100) : 0;
        return `<button class="ballpick ${sb===k?"on":""}" data-act="pickball" data-b="${k}" ${n<=0?"disabled":""}>
          ${sb===k&&ENC&&!ENC.missing?`<span class="odds">${c}%</span>`:""}
          ${ic(b.icon)}<b>${esc(b.name.split(" ")[0])}</b><span class="ct">${n}</span>
        </button>`;}).join("")}
    </div>

    ${AIM ? `<div class="aimbar">
        <div class="aim-zone" style="left:${AIM.zone[0]}%;width:${AIM.zone[1]-AIM.zone[0]}%"></div>
        <div class="aim-cursor" id="aim-cursor" style="left:${AIM.pos}%"></div>
      </div>` : ""}

    <button class="throwbtn ${AIM?"locking":""}" data-act="throwsel"
      ${(!ENC||busy||stock<=0)?"disabled":""} style="margin-bottom:9px">
      ${AIM ? "VERROUILLER"
        : ENC ? (stock<=0 ? "STOCK ÉPUISÉ"
          : ENC.missing ? "ANALYSER LA FAILLE"
          : aimNeeded() ? `VISER — ${Math.round(chance*100)}%`
          : `LANCER — ${Math.round(chance*100)}%`) : "ANALYSE EN COURS"}
    </button>

    ${radarCount()>0?`<button class="btn dan wide sm" style="margin-bottom:9px" data-act="useradar">
      ${ic("boss")} Radar Légendaire (${radarCount()})</button>`:""}

    <div class="wrap" style="margin-bottom:11px">
      ${Object.entries(BERRIES).map(([k,b])=>{
        const on = S.buffs[k]||(k==="micle"&&S.shinyCharge>0);
        return `<span class="berrychip ${on?"on":""} ${(S.berries[k]||0)<=0?"off":""}">
          <button class="bc-use" data-act="berry" data-k="${k}" ${(S.berries[k]||0)<=0?"disabled":""}>
            ${ic("seed")}<span>${esc(b.name.replace("Baie ",""))}</span>
            <em>${esc(BERRY_TAG[k])}</em><b>${S.berries[k]||0}</b></button>
          <button class="bc-i" data-act="berryinfo" data-k="${k}" aria-label="Détail">i</button>
        </span>`;}).join("")}
      ${S.shinyCharge>0?`<span class="chip on">${ic("star")} ${S.shinyCharge} rencontres</span>`:""}
    </div>

    ${objectivesCard()}

    ${buddyStrip()}

    <div class="panel edge tight">
      <div class="row">
        <span class="sprbox" style="width:38px;height:38px">${sprite(fid,false,"")}</span>
        <div class="grow">
          <div class="tiny dim" style="letter-spacing:1px">VEDETTE DU JOUR</div>
          <div class="tiny">${esc(POKE[fid].name)} — apparition renforcée, gains ×1.5</div>
        </div>
      </div>
      ${ev?`<hr class="sep" style="margin:7px 0"><div class="row between">
        <div><b class="gold-t tiny">${esc(ev.n)}</b><div class="tiny muted">${esc(ev.d)}</div></div>
        <span class="chip">${fmtTime(ev.until-Date.now())}</span></div>`:""}
    </div>`;
  },

  stage(){
    const th = REGION_THEME[S.region] || REGION_THEME.kanto;
    const bg = `<div class="stage-bg" style="--gl:${th.gl};--hz:${th.hz}">
        <div class="sky" style="background:${th.sky}"></div>
        <div class="grid"></div>
        <div class="haze"></div>
        <div class="drift">${Array.from({length:9},(_,i)=>
          `<i style="left:${8+i*10.5}%;bottom:-6px;background:${th.dot};
            animation-duration:${6+i%4*2.5}s;animation-delay:${i*0.8}s"></i>`).join("")}</div>
      </div>`;

    if(!ENC) return `<div id="enc-stage">${bg}<div class="dim tiny">Analyse du secteur…</div></div>`;

    if(ENC.missing){
      return `<div id="enc-stage" class="shake">${bg}
        <div class="enc-hud">
          <div class="enc-nm"><span class="glitch bad" data-t="?????">?????</span></div>
          <span class="tt" style="color:var(--magenta);border-color:var(--magenta)">SANS INDEX</span>
        </div>
        <div id="enc-sprite">${sprite(0,false,"lg")}</div>
        <div class="enc-foot"><span class="tiny bad">aucune ligne correspondante</span>
          <span class="tiny bad">niv. —</span></div>
      </div>`;
    }

    const p = POKE[ENC.id];
    const isNew = !dexHas(ENC.id);
    return `<div id="enc-stage">${bg}
      ${S.streak>=3?`<div class="combo tier${comboTier()}"><b>×${S.streak}</b>
        <span>${comboLabel()}</span></div>`:""}
      ${ENC.shiny?`<div class="shiny-burst"></div>
        <div class="shiny-rings"><i></i><i></i><i></i></div>
        <div class="shiny-motes">${Array.from({length:14},(_,i)=>
          `<i style="--a:${(i*25.7).toFixed(0)}deg;--d:${(i%7)*0.42}s;--r:${38+(i%5)*13}px"></i>`).join("")}</div>
        <div class="shiny-banner">SIGNATURE MAL ENCODÉE</div>`:""}
      ${ENC.shiny?Array.from({length:5},(_,i)=>
        `<i class="spark" style="left:${18+i*16}%;top:${26+(i%3)*18}%;animation-delay:${i*0.3}s"></i>`).join(""):""}
      <div class="plate"></div>
      <div class="enc-hud">
        <div class="enc-nm">${esc(p.name)}</div>
        ${typeTags(p.types)}${rarTag(ENC.rar)}
        ${ENC.shiny?'<span class="tt" style="color:var(--amber);border-color:var(--amber)">CHROMATIQUE</span>':""}
        ${ENC.featured?'<span class="tt" style="color:var(--cyan);border-color:var(--cyan)">VEDETTE</span>':""}
        ${isNew?'<span class="tt" style="color:var(--green);border-color:var(--green)">INÉDIT</span>':""}
      </div>
      <div id="enc-sprite">${sprite(ENC.id, ENC.shiny, "", {anim:true, eager:true})}</div>
      <div class="enc-foot">
        <span class="tiny dim">${ENC.attempts?`essais ${ENC.attempts}`:"intacte"}</span>
        <span class="tiny"><b>Niv.${ENC.level}</b></span>
      </div>
    </div>`;
  },

  after(){
    tutoMaybe("intro");
    if(S.stats.catches >= 5) tutoMaybe("streak");
    /* les rencontres rares secouent l'appareil a l'apparition */
    if(ENC && !ENC._greeted){
      ENC._greeted = true;
      if(ENC.missing){ shakeApp(); }
      else if(ENC.shiny){
        const st = document.getElementById("enc-stage");
        burstEl(st, {n:20, spread:110, colors:["#ffc857","#ffffff"], dur:900});
      } else if(ENC.rar >= 4) shakeApp();
    }
  }
};
ACTIONS.pickball = d => { S.selBall = d.b; saveSoon(); refresh(); };
ACTIONS.throwsel = () => {
  if(AIM){ lockAim(); return; }
  if(aimNeeded()){ startAim(); return; }
  throwBall(selBall(), 1);
};
ACTIONS.aimlock = () => lockAim();
ACTIONS.regioninfo = d => {
  const r = regionDef(d.r);
  const g = regionGate(d.r);
  const prevPct = Math.min(100, g.have / g.need * 100);
  sheet(`${sheetHead("Secteur " + r.name + " — verrouillé")}
    <div class="tiny muted" style="margin-bottom:10px">${esc(r.desc)}</div>
    <div class="panel tight">
      <div class="h sm">CONDITION D'OUVERTURE</div>
      <div class="tiny">Quelque chose retient encore l'accès depuis le secteur
        <b>${esc(g.prev.name)}</b>. Tant que son dernier verrou tient, la passerelle
        reste fermée.</div>
      <div class="tiny dim" style="margin-top:5px">Porygon-Z refuse d'en dire plus tant que
        vous n'y êtes pas confronté.</div>
    </div>
    <div class="panel tight">
      <div class="h sm">CE QU'IL RESTE À FAIRE</div>
      ${g.prev.guardians.map((gd,i)=>{
        const beaten = guardianBeaten(g.prev.key, gd.id);
        const av = guardianAvailable(g.prev, gd, i);
        /* un verrou non affronte reste anonyme */
        const label = beaten ? gd.name : av ? "Signature détectée" : "Signature non détectée";
        return `<div class="row between tiny" style="padding:3px 0">
          <span class="${beaten?"ok":av?"":"dim"}">${beaten?"✓":"·"} ${esc(label)}</span>
          <span class="dim">${beaten ? "relâché"
            : dexCount(g.prev.key) < gd.need ? `${dexCount(g.prev.key)}/${gd.need} espèces`
            : av ? "disponible" : "verrou précédent d'abord"}</span>
        </div>`;}).join("")}
      <div class="bar thin" style="margin-top:6px"><i style="width:${prevPct}%"></i></div>
      <div class="tiny dim mono-num" style="margin-top:3px">
        ${g.have} / ${g.need} espèces de ${esc(g.prev.name)} pour le dernier verrou</div>
    </div>
    <button class="btn pri wide" data-act="goto" data-to="boss">Voir les Data Guardians</button>`, true);
};
ACTIONS.setregion = d => { S.region = d.r; ENC = null; saveSoon(); refresh(); };
ACTIONS.throw = d => throwBall(d.b);
function useBerry(k){
  if((S.berries[k]||0) <= 0) return false;
  if(S.buffs[k] || (k === "micle" && S.shinyCharge > 0)) return false;
  S.berries[k]--;
  if(k === "micle"){ S.shinyCharge = 15; toast("Instabilité chromatique pendant 15 rencontres", "warn", "star"); }
  else { S.buffs[k] = true; toast(BERRIES[k].name + " utilisée", "", "seed"); }
  Sfx.click();
  saveSoon();
  return true;
}
ACTIONS.berry = d => { useBerry(d.k); refresh(); };
/* appui long ou bouton dédié : la baie doit pouvoir s'expliquer sans quitter l'écran */
ACTIONS.berryinfo = d => {
  const b = BERRIES[d.k];
  sheet(`${sheetHead(b.n)}
    <div class="row" style="gap:11px">
      <div class="bag-ic">${ic("seed")}</div>
      <div class="grow"><div class="tiny">${esc(b.d)}</div>
        <div class="tiny dim" style="margin-top:5px">En réserve : ${S.berries[d.k]||0}</div></div>
    </div>
    <div class="tiny muted" style="margin-top:9px">Une baie se consomme avant le lancer et ne vaut
      que pour la rencontre en cours. Elle est perdue si l'entité se désindexe.</div>
    <button class="btn pri wide" style="margin-top:10px" data-act="berryuse" data-k="${d.k}"
      ${(S.berries[d.k]||0)>0?"":"disabled"}>Utiliser maintenant</button>`, true);
};
ACTIONS.berryuse = d => { useBerry(d.k); closeSheet(); refresh(); };
