/* ============================================================
   10 — NOYAU : etat, sauvegarde, economie, progression
   ============================================================ */

const SAVE_KEY = "pcg.save.v3";
const SAVE_VER = 3;

/* --- stockage resilient : localStorage si dispo, memoire sinon --- */
const Store = (function(){
  let ok = true, mem = {};
  try { const k="__t"; localStorage.setItem(k,"1"); localStorage.removeItem(k); }
  catch(e){ ok = false; }
  return {
    available: ok,
    get(k){ try { return ok ? localStorage.getItem(k) : (mem[k] ?? null); } catch(e){ return mem[k] ?? null; } },
    set(k,v){ try { ok ? localStorage.setItem(k,v) : (mem[k]=v); } catch(e){ ok=false; mem[k]=v; } },
    del(k){ try { ok ? localStorage.removeItem(k) : delete mem[k]; } catch(e){ delete mem[k]; } }
  };
})();

/* --- aleatoire --- */
const rng = () => Math.random();
function mulberry32(a){ return function(){ a|=0;a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function pick(arr, r){ return arr[Math.floor((r||rng)()*arr.length)]; }
function randInt(a,b,r){ return a + Math.floor(((r||rng)())*(b-a+1)); }
function shuffle(arr, r){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor((r||rng)()*(i+1));
  [a[i],a[j]]=[a[j],a[i]]; } return a; }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }

/* --- bus d'evenements --- */
const Bus = { m:{}, on(k,f){ (this.m[k]=this.m[k]||[]).push(f); },
  emit(k,d){ (this.m[k]||[]).forEach(f=>{ try{ f(d); }catch(e){ console.error(k,e); } }); } };

/* --- etat --- */
let S = null;

function newState(){
  return {
    v: SAVE_VER,
    name: "ARCHIVISTE",
    created: Date.now(),
    level: 1, xp: 0,
    coins: 500, shards: 25, cores: 1, energy: 0,
    integrity: 0,
    dex: {},                       /* id -> {c, s, lvl, shiny} */
    team: [],                      /* ids d'espece pour les combats */
    balls: {poke:30, super:5, hyper:0, data:3, master:0},
    berries: {framby:2, nanab:1, nigma:0, sitrus:0, micle:0},
    stones: {},
    items: {potion:2, revive:0, radar:0},
    bosses: [],                    /* "kanto:150" */
    story: [],
    tutos: [],
    dirDone: [],
    pzSeen: [],
    flags: {},
    streak: 0,
    failStreak: 0,
    region: "kanto",
    selBall: "poke",
    buffs: {},                     /* framby/nanab/... actifs sur la prochaine capture */
    shinyCharge: 0,
    stats: {catches:0, shinies:0, bestStreak:0, expWins:0, expRuns:0, pokerWins:0, pokerBest:0,
            energyTotal:0, evolutions:0, fish:0, throws:0, spend:0, bossWins:0, boxOpens:0},
    daily: {day:"", firstWin:{}, dayCatch:0, dayNew:0, dayStreak:0, dayFish:0, daySpend:0, dayExp:0,
            dayPokerBlinds:0, dayRare:0, dayEvo:0, dayEnergy:0, dayThrow:0, dayBoss:0},
    quests: [], questDay: "", lastQuestIds: [],
    weekly: null,
    buddy: null,
    held: {owned:[], eq:null},
    boosts: {},
    bagBoosts: {},
    eggs: {slots:2, inc:[], bag:{}},
    treasures: {},
    luckyDay: "d_none", luckyDayOn: "", luckySeen: false,
    zero: 0, perks: {}, cycle: {n:0, mods:[]}, nextMods: [], lifetime: {catches:0, shinies:0, cycles:0},
    contract: null,
    regionTiers: {},
    login: {last:"", days:0, best:0, claimed:""},
    pokebox: {last:""},
    idle: {last: Date.now(), gens:{g1:1,g2:0,g3:0,g4:0}, mult:1},
    event: null,
    cos: {owned:["title_novice","frame_base","bg_base","fx_none"],
          title:"title_novice", frame:"frame_base", bg:"bg_base", fx:"fx_none"},
    ach: [],
    cards: {},                     /* id -> {r:rarete 0-3} cartes legendaires */
    offline: null,
    expedition: null,
    poker: null,
    pokerMeta: {unlocked:false, bestAnte:0},
    settings: {sfx:true, haptics:true, skill:true, admin:false, battleSpeed:1},
    lastSeen: Date.now()
  };
}

function save(){
  if(!S) return;
  S.lastSeen = Date.now();
  try { Store.set(SAVE_KEY, JSON.stringify(S)); } catch(e){ console.warn("sauvegarde impossible", e); }
}
let saveTimer = null;
function saveSoon(){ clearTimeout(saveTimer); saveTimer = setTimeout(save, 900); }

function load(){
  const raw = Store.get(SAVE_KEY);
  if(!raw) return null;
  try {
    const d = JSON.parse(raw);
    if(!d || typeof d !== "object") return null;
    const base = newState();
    /* fusion tolerante : les nouvelles cles apparaissent sans casser l'ancienne sauvegarde */
    const merged = deepFill(d, base);
    merged.v = SAVE_VER;
    merged.cards = migrateCards(merged.cards);
    return merged;
  } catch(e){ console.warn("sauvegarde illisible", e); return null; }
}
function deepFill(obj, def){
  if(obj === null || obj === undefined) return def;
  if(Array.isArray(def)) return Array.isArray(obj) ? obj : def;
  if(typeof def !== "object") return typeof obj === typeof def ? obj : def;
  const out = Array.isArray(obj) ? obj : {};
  for(const k in def) out[k] = deepFill(obj[k], def[k]);
  for(const k in obj) if(!(k in out)) out[k] = obj[k];
  return out;
}

/* --- dates --- */
function today(){ const d = new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function yesterdayStr(){ const d = new Date(Date.now()-864e5); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

/* --- monnaies --- */
const CUR_NAME = {coins:"PokéCoins", shards:"Fragments", cores:"Noyaux", energy:"Énergie"};
function gain(cur, n){
  if(n <= 0) return;
  S[cur] = (S[cur]||0) + n;
  if(cur === "energy") S.stats.energyTotal += n;
  Bus.emit("currency", {cur, n});
  saveSoon();
}
function canPay(cur, n){ return (S[cur]||0) >= n; }
function pay(cur, n){
  if(!canPay(cur,n)) return false;
  S[cur] -= n;
  if(cur === "coins"){ S.stats.spend += n; S.daily.daySpend += n; questTick("daySpend", n); }
  Bus.emit("currency", {cur, n:-n});
  saveSoon();
  return true;
}

/* --- niveau d'archiviste --- */
/* palier initial volontairement plat : les premiers niveaux doivent se meriter
   sans faire attendre, puis la courbe reprend une pente normale */
function xpForLevel(l){ return Math.floor(180 + 55 * Math.pow(l, 1.75)); }
function addXp(n){
  if(n<=0) return;
  const mult = (eventActive("ev_xp") ? 2 : 1) * (heldActive("xp") ? 1.25 : 1)
             * (boostActive("xp") ? 1.4 : 1) * (luckyF("xp") || 1);
  S.xp += Math.round(n*mult);
  let up = 0;
  while(S.xp >= xpForLevel(S.level)){ S.xp -= xpForLevel(S.level); S.level++; up++; }
  if(up){
    gain("coins", 200*S.level);
    if(S.level % 5 === 0) gain("cores", 1);
    Bus.emit("levelup", S.level);
    toast(`Niveau d'Archiviste ${S.level}`, "warn", "star");
    pzFlash(pzLine("levelup"));
  }
  saveSoon();
}

/* --- integrite du monde --- */
function addIntegrity(n){
  if(cycleMod("m_slow")) n *= 0.6;
  if(n<=0) return;
  const before = S.integrity;
  Bus.emit("integGain", n);
  S.integrity = clamp(S.integrity + n, 0, 100);
  if(Math.floor(S.integrity) !== Math.floor(before)) Bus.emit("integrity", S.integrity);
  applyCorruption();
  /* les scenes sont declenchees aux points surs (fermeture de feuille, nouvelle rencontre) */
  saveSoon();
}
function applyCorruption(){
  const c = clamp(1 - S.integrity/100, 0, 1);
  document.documentElement.style.setProperty("--corrupt", (c*0.9).toFixed(3));
}

/* --- pokedex --- */
function dexEntry(id){ return S.dex[id]; }
function dexHas(id){ return !!S.dex[id]; }
function dexCount(regionKey){
  const r = regionDef(regionKey); let n = 0;
  for(let i=r.from; i<=r.to; i++) if(S.dex[i]) n++;
  return n;
}
function dexTotal(){ return Object.keys(S.dex).length; }
function dexRegionPct(key){
  const r = regionDef(key);
  return dexCount(key) / (r.to - r.from + 1) * 100;
}

function addToDex(id, level, shiny){
  const isNew = !S.dex[id];
  if(isNew) S.dex[id] = {c:0, s:0, lvl:level||5, shiny:false};
  const e = S.dex[id];
  e.c++;
  if(shiny){ e.s++; e.shiny = true; }
  if((level||5) > e.lvl) e.lvl = level;
  if(isNew){
    S.daily.dayNew++; questTick("dayNew",1);
    if(S.team.length < 6) S.team.push(id);
  }
  return isNew;
}

/* --- evenements a duree limitee --- */
function eventActive(id){ return S.event && S.event.id === id && S.event.until > Date.now(); }
function currentEvent(){ return (S.event && S.event.until > Date.now()) ? S.event : null; }
function rollEvent(force){
  if(!force && currentEvent()) return;
  if(!force && rng() > 0.5) { S.event = null; return; }
  const e = pick(EVENT_TYPES);
  S.event = {id:e.id, n:e.n, d:e.d, until: Date.now() + e.dur*60000};
  saveSoon();
}

/* --- quetes quotidiennes --- */
function rollQuests(){
  const mix = questMix(S.level).slice();
  if(perkLv("p_quest")) mix.push("medium");
  const banned = new Set(S.lastQuestIds || []);
  const chosen = [], used = new Set();
  for(const tier of mix){
    const pool = QUEST_POOLS[tier].filter(q=>!used.has(q.id) && !banned.has(q.id));
    /* si l'anti-repetition vide le vivier, on relache la contrainte plutot que d'echouer */
    const src = pool.length ? pool : QUEST_POOLS[tier].filter(q=>!used.has(q.id));
    if(!src.length) continue;
    const q = pick(src);
    used.add(q.id);
    chosen.push({id:q.id, n:q.n.replace("{n}", fmt(q.g)), goal:q.g, stat:q.stat,
                 tier, prog:0, claimed:false, rw:Object.assign({}, q.rw)});
  }
  S.lastQuestIds = chosen.map(q=>q.id);
  S.quests = chosen;
  S.questDay = today();
}

function questTick(stat, n){
  weeklyTick(stat, n);
  if(!S.quests) return;
  let changed = false;
  for(const q of S.quests){
    if(q.stat === stat && q.prog < q.goal){
      q.prog = Math.min(q.goal, q.prog + n);
      if(q.prog >= q.goal){ changed = true; toast("Quête accomplie : " + q.n, "warn", "check"); }
    }
  }
  if(changed) Bus.emit("quest");
  saveSoon();
}
function questSet(stat, value){
  for(const q of S.quests||[]) if(q.stat === stat && value > q.prog){
    const was = q.prog >= q.goal;
    q.prog = Math.min(q.goal, value);
    if(!was && q.prog >= q.goal) toast("Quête accomplie : " + q.n, "warn", "check");
  }
}
function claimQuest(i){
  const q = S.quests[i];
  if(!q || q.claimed || q.prog < q.goal) return;
  q.claimed = true;
  for(const k in q.rw) gain(k, q.rw[k]);
  toast("Récompense encaissée", "", "coin");
  Bus.emit("quest"); saveSoon();
}

/* --- rollover quotidien --- */
function dailyRollover(){
  const t = today();
  if(S.daily.day !== t){
    S.daily = {day:t, dayCatch:0, dayNew:0, dayStreak:0, dayFish:0, daySpend:0, dayExp:0,
               dayPokerBlinds:0, dayRare:0, dayEvo:0, dayEnergy:0, dayThrow:0, dayBoss:0, firstWin:{}};
  }
  if(S.questDay !== t) rollQuests();
  /* serie de connexion */
  if(S.login.last !== t){
    if(S.login.last === yesterdayStr()) S.login.days++;
    else S.login.days = 1;
    S.login.last = t;
    if(S.login.days > S.login.best) S.login.best = S.login.days;
  }
  weeklyRollover();
  contractRollover();
  luckyRollover();
  rollEvent();
  saveSoon();
}
function loginRewardFor(day){
  const d = ((day-1) % 7) + 1;
  const cycle = Math.floor((day-1)/7);
  const b = 1 + cycle*0.35;
  const tbl = [
    {coins:Math.round(300*b)}, {balls:{super:Math.round(4*b)}}, {shards:Math.round(18*b)},
    {coins:Math.round(700*b)}, {berries:{framby:3}}, {shards:Math.round(35*b)},
    {cores:1+cycle, balls:{hyper:Math.round(3*b)}}
  ];
  return tbl[d-1];
}
function claimLogin(){
  const t = today();
  if(S.login.claimed === t) return false;
  S.login.claimed = t;
  const rw = loginRewardFor(S.login.days);
  grantReward(rw);
  saveSoon();
  return rw;
}

function grantReward(rw){
  for(const k in rw){
    if(k === "balls"){ for(const b in rw.balls) S.balls[b] = (S.balls[b]||0) + rw.balls[b]; }
    else if(k === "berries"){ for(const b in rw.berries) S.berries[b] = (S.berries[b]||0) + rw.berries[b]; }
    else if(k === "stones"){ for(const b in rw.stones) S.stones[b] = (S.stones[b]||0) + rw.stones[b]; }
    else if(k === "cos"){ unlockCosmetic(rw.cos); }
    else if(k === "dex"){ addToDex(rw.dex, 5, false); }
    else gain(k, rw[k]);
  }
}
function rewardText(rw){
  const out = [];
  for(const k in rw){
    if(k === "balls") for(const b in rw.balls) out.push(`${rw.balls[b]} ${BALLS[b].name}`);
    else if(k === "berries") for(const b in rw.berries) out.push(`${rw.berries[b]} ${BERRIES[b].name}`);
    else if(k === "stones") for(const b in rw.stones) out.push(`${rw.stones[b]} ${STONES[b].name}`);
    else if(k === "cos") out.push("Cosmétique : " + (COSMETICS[rw.cos]?.n||""));
    else if(k === "dex") out.push(POKE[rw.dex].name);
    else out.push(`${fmt(rw[k])} ${CUR_NAME[k]||k}`);
  }
  return out.join(" · ");
}

/* --- cosmetiques --- */
function unlockCosmetic(id){
  if(!COSMETICS[id] || S.cos.owned.includes(id)) return false;
  S.cos.owned.push(id);
  toast("Cosmétique débloqué : " + COSMETICS[id].n, "warn", "star");
  return true;
}

/* --- succes --- */
function checkAchievements(){
  let any = false;
  for(const a of ACHIEVEMENTS){
    if(S.ach.includes(a.id)) continue;
    let ok = false;
    try { ok = a.chk(S); } catch(e){ ok = false; }
    if(ok){
      S.ach.push(a.id);
      grantReward(a.rw||{});
      toast("Succès : " + a.n, "warn", "trophy");
      any = true;
    }
  }
  if(any){ Bus.emit("ach"); saveSoon(); }
}

/* --- cartes legendaires --- */
const CARD_RAR = ["Standard","Holographique","Corrompue","Originelle"];
/* Les cartes etaient indexees par espece avec un niveau de qualite ; elles le
   sont desormais par serie d'illustration. La conversion est directe : les
   quatre anciennes qualites correspondent exactement aux quatre premieres
   series, de la plus courante a la plus rare. */
const CARD_MIGRATE = ["art", "g5", "g3", "g2"];
function migrateCards(cards){
  if(!cards) return {};
  const out = {};
  for(const k in cards){
    const v = cards[k];
    if(k.indexOf(":") >= 0){ out[k] = v; continue; }     /* deja au nouveau format */
    const series = CARD_MIGRATE[Math.min(3, Math.max(0, v.r|0))];
    out[series + ":" + k] = {t: v.t || Date.now(), dup: v.dup || 0};
  }
  return out;
}

/* --- formatage --- */
function fmt(n){
  n = Math.floor(n);
  if(n >= 1e9) return (n/1e9).toFixed(2)+"Md";
  if(n >= 1e6) return (n/1e6).toFixed(2)+"M";
  if(n >= 1e4) return (n/1e3).toFixed(1)+"k";
  return n.toLocaleString("fr-FR");
}
function fmtTime(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(s/3600), m = Math.floor(s%3600/60), ss = s%60;
  if(h) return `${h}h${String(m).padStart(2,"0")}`;
  if(m) return `${m}m${String(ss).padStart(2,"0")}`;
  return `${ss}s`;
}

/* --- deverrouillage des modules --- */
const MODULE_REQ = {
  capture:   {lv:1,  d:""},
  pokebox:   {lv:2,  d:"Niveau d'Archiviste 2"},
  fishing:   {lv:3,  d:"Niveau d'Archiviste 3"},
  idle:      {lv:5,  d:"Niveau d'Archiviste 5"},
  boss:      {lv:8,  d:"Niveau 8 et 25 espèces archivées", extra:()=>dexTotal()>=25},
  expedition:{lv:10, d:"Niveau 10 et 3 Pokémon dans l'équipe", extra:()=>S.team.length>=3},
  poker:     {lv:14, d:"Niveau 14 et un Data Guardian vaincu", extra:()=>S.bosses.length>=1}
};
function moduleUnlocked(k){
  const r = MODULE_REQ[k]; if(!r) return true;
  if(S.level < r.lv) return false;
  if(r.extra && !r.extra()) return false;
  return true;
}

/* --- pokemon individuel pour le combat --- */
function statAt(base, level, isHp){
  if(isHp) return Math.floor((2*base*level)/100) + level + 10;
  return Math.floor((2*base*level)/100) + 5;
}
function makeFighter(id, level, opts){
  opts = opts || {};
  const p = POKE[id];
  const lv = clamp(level||5, 1, 100);
  const boost = opts.boost || 1;
  const f = {
    id, name: p.name, types: p.types, level: lv, shiny: !!opts.shiny,
    maxHp: Math.floor(statAt(p.hp, lv, true) * boost),
    atk: Math.floor(statAt(p.atk, lv) * boost), def: Math.floor(statAt(p.def, lv) * boost),
    spa: Math.floor(statAt(p.spa, lv) * boost), spd: Math.floor(statAt(p.spd, lv) * boost),
    spe: Math.floor(statAt(p.spe, lv) * boost),
    moves: movesFor(p, lv), buff: {atk:1, def:1, spe:1}, status:null
  };
  f.hp = f.maxHp;
  return f;
}
function damageCalc(att, def, move, crit){
  const phys = move.type === 1 || [2,3,5,6,7,8,9,16,17].includes(move.type);
  let A = phys ? att.atk*att.buff.atk : att.spa;
  if(att.status && att.status.k === "brn" && phys) A *= 0.5;   /* brûlure */
  const D = phys ? def.def*def.buff.def : def.spd;
  const stab = att.types.includes(move.type) ? 1.5 : 1;
  const eff = typeMult(move.type, def.types);
  const rand = 0.85 + rng()*0.15;
  const c = crit ? 1.8 : 1;
  const base = (((2*att.level/5 + 2) * move.pw * (A/Math.max(1,D))) / 50) + 2;
  return {dmg: Math.max(1, Math.floor(base * stab * eff * rand * c)), eff};
}
function effLabel(e){
  if(e === 0) return "Aucun effet.";
  if(e >= 2) return "C'est super efficace !";
  if(e > 1) return "C'est efficace.";
  if(e < 1 && e > 0) return "Ce n'est pas très efficace…";
  return "";
}
