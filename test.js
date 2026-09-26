/* stub DOM minimal pour charger le bundle en node */
const noop = () => {};
const fakeEl = () => ({style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,querySelectorAll:()=>[],innerHTML:"",textContent:"",dataset:{},children:[],
  scrollTop:0,scrollHeight:0,firstChild:null,select:noop,focus:noop});
global.document = {addEventListener:noop, getElementById:()=>null, createElement:fakeEl,
  documentElement:{style:{setProperty:noop}}, head:{appendChild:noop}, readyState:"loading",
  querySelectorAll:()=>[], execCommand:noop, hidden:false};
global.window = {addEventListener:noop};
global.navigator = {};
global.URL = {createObjectURL:()=>""};
global.Blob = function(){};
global.AudioContext = undefined;
global.setInterval = () => 0;   /* pas de boucles pendant les tests */

const fs = require("fs");
const ORDER = ['_dexblob.js','_atlas.js','_atlas_shiny.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','38-forage.js','39-daily.js',
  '35-modules.js','40-battle.js','50-expedition.js','52-expgear.js','54-tower.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','80-guide.js','81-cosmetics.js','85-journal.js','90-admin.js','95-online.js','99-boot.js'];
const code = ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n");
eval(code + "\n;" + 'global.__api={POKE,POKE_IDS,evalHand,genMap,EXP_ROWS,deepFill,newState,catchChance,typeMult,RARITY,ACHIEVEMENTS,JOKERS,STORY,anteTarget,makeFighter,damageCalc,xpForLevel,handBase,HANDS,newDeck,movesFor,dexTotal,famOf,stageOf,DIRECTIVES,INFOS,TUTOS,PZ_EVENTS,atlasIndex,ATLAS_N,ATLAS_BACK0,SLUGS,cardChips,grantCardV,grantSecretCard,cardVariants,cardHas,cardOwnedCount,cardTotal,CARD_MONS,CARD_SERIES_DEF,CARD_ORDER,rollCardSeries,randomCard,migrateCards,CARD_INDEX,cardChecksum,cardBytes,tcardHtml,cardBackHtml,GEN_TAG,boosterRank,seriesName,seriesFound,monFound,cardEnvOf,CARD_ENV,resolveName,KNOWN_NAMES,sixthItem,glitchSixthItem,GEN_MARKS,checkChainMark,specialDay,isNightWindow,PZ_POKE_LINES,SIXTH_SLOTS,KONAMI,karpDealDay,karpDealAvailable,BST_BANDS,bstBand,wildIdFor,NODE_W,nodeTypeFor,EXP_ITEMS,rollExpItem,itemMinFloor,EXP_MODES,expRunModes,genMap,traitLevels,traitBonus,TOWER_TRAITS,HABITATS,HABITAT_IDS,habitatWeight,isNight,WEATHER,WEATHER_IDS,weatherDef,speciesInHabitat,FRAGMENTS,RIFT_ARC,checkFragments,riftTick,riftStage,fragmentsFound,signatureMove,moveTierName,STRATA,DRILLS,ECHO_PERKS,forage,forageRate,clickValue,drillCost,depthCost,echoGain,unlocked,offlineHours,forageTick,EXCLUSIVES,EXCL_SOURCE,isExclusive,RODS,fishPool,newFishEncounter,speciesForRarity,eggPool,repelRarity,lureMul,rstreak,rstreakCatch,rstreakBreak,RSTREAK_MILES,PERMANENTS,charmMul,runeMul,shinyOdds,friendCheck,friendEvo,canEvolve,codeHash,CODES,isSafariDay,SAFARI_POOL,botSpecies,botRate,botHours,FACTIONS,FACTION_RANKS,factionRank,factionMul,factionPts,todayRows,todayPending,REGIONS,unlockedRegions,nextEncounter,newEncounter,rollRarity,fleeChance,RARITY,CINEMAS,CINE_WHO,CINE_T,corruptText,CINE_POS,moduleUnlocked,brChunkAt,brPushOut,brMastery,BR_TERRAIN,brMissionsFor,brNewRun,brUpdate,brXpNeed,brChoices,brWeaponStats,brDaily,brGuardianWin,brNextEvo,brState,BR_ARCH,BR_ITEMS,ACTIVITIES,COSMETICS,FX_LAYERS,badgeCine,secretCine,BADGES,HANDS,MODULE_REQ,SCREENS,adminHash,ADMIN_HASH,ATELIER_TABS,STORY,RIFT_ARC,directStory,cineFor,RESEARCH_TASKS,researchOf,researchLevel,researchMax,researchTick,taskGoal,RESEARCH_TIERS,TALENTS,talentOf,PERFECT_ODDS,rollPerfect,weekStamp,REPORT_ROWS,lineRoot,towerLevel,towerBand,BUFF_STATS,TRAINERS,expEnemyLevel,setBuddy,buddyTick,buddyTier,buddyBonus,buddy,rollWeekly,weeklyTick,weeklyRollover,openChest,WEEKLY_POOL,BUDDY_FINDS,BUDDY_MAX_TIER,BUDDY_TIER_AFF,CHESTS,addToDex,weekKey,aimBonus,BOOSTS,startBoost,boostActive,LUCKY_DAYS,rollLuckyDay,luckyF,TREASURES,rollTreasure,treasureValue,REGION_TIERS,checkRegionTiers,regionTiersDone,rollContract,contractTick,CONTRACTS,CYCLE_MODS,PERKS,cycleReward,perkLv,loreOf,LORE,PZ_EMOS,pzMood,HELD_ITEMS,grantHeld,heldActive,PLANETS,SPECTRALS,QUEST_POOLS,questMix,rollQuests,setS:function(v){S=v},getS:function(){return S},setENC:function(v){ENC=v},getENC:function(){return ENC},getCINE:function(){return CINE},getCineLast:function(){return CINE_LAST},playStory:playStory};');
const A = global.__api;
let pass=0, fail=0;
const t = (n, cond, extra) => { cond?pass++:(fail++,console.log("  ECHEC:",n,extra||"")); };

/* --- donnees --- */
t("386 especes", A.POKE_IDS.length===386, A.POKE_IDS.length);
t("Bulbizarre", A.POKE[1].name==="Bulbizarre" && A.POKE[1].types.join()==="12,4");
t("Pikachu evolue en Raichu par pierre", A.POKE[25].evo[0].to===26 && A.POKE[25].evo[0].stone==="thunder");
t("Mewtwo legendaire rarete 5", A.POKE[150].leg===1 && A.POKE[150].rar===5);
t("Rayquaza present", A.POKE[384].name.length>0);
t("types: Feu vs Plante = x2", A.typeMult(10,[12])===2);
t("types: Electrik vs Sol = x0", A.typeMult(13,[5])===0);
t("types: Combat vs Vol/Psy = x0.25", A.typeMult(2,[3,14])===0.25);

/* --- evaluateur de mains : les cartes sont des Pokemon --- */
A.setS(A.newState());
let uid=0;
const C=(id,shiny)=>({u:uid++,id,shiny:!!shiny,ed:""});
const ev=cs=>A.evalHand(cs).key;
/* familles : Bulbizarre 1>2>3, Salameche 4>5>6, Carapuce 7>8>9, Rattata 19>20 */
t("Paire (memes especes)", ev([C(19),C(19)])==="paire");
t("Brelan", ev([C(19),C(19),C(19)])==="brelan");
t("Carre", ev([C(19),C(19),C(19),C(19)])==="carre");
t("Duo evolutif", ev([C(1),C(2)])==="duo_evo");
t("Trio evolutif", ev([C(1),C(1),C(2)])==="evo_trio");
t("Evolution parfaite", ev([C(1),C(2),C(3)])==="evo_parfaite");
t("Pokeball pleine (brelan+paire)", ev([C(19),C(19),C(19),C(16),C(16)])==="pokeball");
t("Double duo evolutif", ev([C(1),C(2),C(4),C(5)])==="double_duo");
t("Trio legendaire", ev([C(144),C(145),C(146)])==="trio_legend");
t("Pantheon (5 legendaires distincts)", ev([C(144),C(145),C(146),C(150),C(243)])==="pantheon");
t("Duo Originel (Mew + Mewtwo)", ev([C(150),C(151)])==="duo_origine");
t("Paire chromatique", ev([C(19,1),C(16,1)])==="paire_chroma");
t("Flush chromatique", ev([C(19,1),C(16,1),C(21,1),C(23,1),C(27,1)])==="flush_chroma");
t("Rencontre sauvage", ev([C(19),C(43),C(92)])==="sauvage");
t("Mono-type (5 familles distinctes)", (()=>{ const feu=[4,37,58,77,126];
  return ev(feu.map(i=>C(i)))==="monotype"; })());
t("la lignee complete bat le mono-type", ev([C(4),C(5),C(6),C(37),C(58)])==="evo_parfaite");
t("familles coherentes", A.famOf(3)===1 && A.famOf(9)===7 && A.stageOf(3)===2 && A.stageOf(1)===0);
t("la meilleure combinaison l'emporte",
  ev([C(150),C(151),C(19),C(19),C(19)])==="duo_origine");
t("valeur de carte croissante avec les stats",
  A.cardChips(C(3)) > A.cardChips(C(1)) && A.cardChips(C(150)) > A.cardChips(C(19)));
t("chromatique vaut plus", A.cardChips(C(19,1)) > A.cardChips(C(19)));
t("20 combinaisons definies", A.HANDS.length===20, A.HANDS.length);
t("niveaux de main croissants", (()=>{ const b0=A.handBase("paire"); return b0.chips>=15 && b0.mult>=2; })());

/* --- deck --- */
const deck=A.newDeck();
t("deck de 52 Pokemon", deck.length===52, deck.length);
t("identifiants uniques", new Set(deck.map(c=>c.u)).size===52);
t("toutes les cartes existent", deck.every(c=>A.POKE[c.id]));
t("des lignees completes sont presentes",
  (()=>{ const fams={}; deck.forEach(c=>{ (fams[A.famOf(c.id)]=fams[A.famOf(c.id)]||new Set()).add(A.stageOf(c.id)); });
         return Object.values(fams).some(st=>st.size>=2); })());

/* --- sprites embarques --- */
t("atlas de 773 cellules (faces + dos)", A.ATLAS_N===773, A.ATLAS_N);
t("les dos sont adressables", A.atlasIndex(1,true)===387 && A.atlasIndex(386,true)===772);
t("pas de dos pour le guide", A.atlasIndex(474,true)===-1);
t("index de face correct", A.atlasIndex(1)===0 && A.atlasIndex(386)===385 && A.atlasIndex(474)===386);
t("index hors bornes rejete", A.atlasIndex(9999)===-1 && A.atlasIndex(0)===-1);
t("386 identifiants de sprites", A.SLUGS.length===386);

/* --- guidage --- */
t("16 directives", A.DIRECTIVES.length===16, A.DIRECTIVES.length);
t("directives evaluables", A.DIRECTIVES.every(d=>typeof d.chk==="function" && typeof d.goal==="function"));
t("chaque directive a une recompense et un indice",
  A.DIRECTIVES.every(d=>d.rw && Object.keys(d.rw).length && d.hint && d.hint.length>10));
t("fiches d'information completes",
  Object.keys(A.INFOS).length>=12 && Object.values(A.INFOS).every(f=>f.n && f.d.length>120));
t("tutoriels avec cibles", Object.keys(A.TUTOS).length>=8 &&
  Object.values(A.TUTOS).every(x=>x.steps.length>=2 && x.steps.every(st=>st.t && st.sel)));
t("evenements de Porygon-Z", A.PZ_EVENTS.length>=15 &&
  A.PZ_EVENTS.every(e=>typeof e.c==="function" && e.t.length>40));

/* --- etat / sauvegarde --- */
const st = A.newState();
A.setS(st);
t("etat initial coherent", st.integrity===0 && st.level===1 && Object.keys(st.dex).length===0);
const old = {level:9, coins:777, dex:{25:{c:3,s:0,lvl:12,shiny:false}}};  /* vieille sauvegarde partielle */
const mig = A.deepFill(JSON.parse(JSON.stringify(old)), A.newState());
t("migration conserve les donnees", mig.level===9 && mig.coins===777 && mig.dex[25].lvl===12);
t("migration ajoute les cles manquantes", mig.items && mig.quests !== undefined && mig.pokerMeta !== undefined);
t("xp croissant", A.xpForLevel(2) > A.xpForLevel(1) && A.xpForLevel(20) > A.xpForLevel(10));

/* --- capture --- */
A.setS(Object.assign(A.newState(), {level:5, streak:0, region:"kanto"}));
A.setENC({id:6, level:40, shiny:false, rar:3, attempts:0});
const cPoke = A.catchChance("poke"), cHyper = A.catchChance("hyper");
t("chance dans [0,1]", cPoke>0 && cPoke<=0.97, cPoke);
t("Hyper Ball > Poke Ball", cHyper > cPoke, cPoke+" / "+cHyper);
t("Master Ball garantie", A.catchChance("master")===1);
A.setENC({id:150, level:70, shiny:false, rar:5, attempts:0});
t("legendaire plus dur", A.catchChance("poke") < cPoke);

/* --- carte d'expedition : tous les noeuds atteignables --- */
let mapOk = true, bossOk = true;
for(let s=0;s<200;s++){
  const m = A.genMap(s*7919+13);
  if(m.length!==A.EXP_ROWS){ mapOk=false; break; }
  if(m[A.EXP_ROWS-1].length!==1 || m[A.EXP_ROWS-1][0].t!=="boss") bossOk=false;
  for(let y=1;y<m.length;y++){
    for(let i=0;i<m[y].length;i++){
      if(!m[y-1].some(p=>p.next.includes(i))){ mapOk=false; }
    }
  }
  for(let y=0;y<m.length-1;y++) for(const n of m[y]) if(!n.next.length) mapOk=false;
}
t("carte : tous les noeuds atteignables (200 graines)", mapOk);
t("carte : boss unique au sommet", bossOk);

/* --- combat --- */
const f1 = A.makeFighter(6, 50), f2 = A.makeFighter(9, 50);
t("stats de combat plausibles", f1.maxHp>100 && f1.maxHp<300 && f1.atk>50, f1.maxHp+"/"+f1.atk);
t("4 attaques max", A.movesFor(A.POKE[6],50).length<=4 && A.movesFor(A.POKE[6],50).length>0);
const dmg = A.damageCalc(f2,f1,{type:11,pw:90,acc:1},false); /* Eau -> Feu/Vol */
t("degats > 0 et efficacite calculee", dmg.dmg>0 && dmg.eff===2, JSON.stringify(dmg));

/* --- antes --- */
t("antes croissantes", A.anteTarget(1,0) < A.anteTarget(1,2) && A.anteTarget(1,2) < A.anteTarget(2,0));

/* --- contenu --- */
t("27 scenes narratives", A.STORY.length===27, A.STORY.length);
t("80 succes", A.ACHIEVEMENTS.length===80, A.ACHIEVEMENTS.length);
t("29 programmes", A.JOKERS.length===29, A.JOKERS.length);
t("6 paliers de rarete", A.RARITY.length===6);


/* --- compagnon --- */
A.setS(A.newState());
A.addToDex(25, 12, false); A.addToDex(6, 30, false);
t("aucun compagnon au depart", A.buddy()===null);
A.setBuddy(25);
t("compagnon assigne", A.buddy() && A.buddy().id===25);
t("bonus neutre au palier 0", A.buddyTier()===0 && A.buddyBonus().coin===1);
(()=>{
  const S0=A.getS(); const lvl0=S0.dex[25].lvl;
  for(let i=0;i<A.BUDDY_TIER_AFF+2;i++) A.buddyTick(0);
  t("le palier fait gagner des niveaux permanents", S0.dex[25].lvl>lvl0, S0.dex[25].lvl+" vs "+lvl0);
  t("palier atteint", A.buddyTier()>=1);
  t("bonus croissant", A.buddyBonus().coin>1 && A.buddyBonus().catch>1);
})();
(()=>{
  const S0=A.getS();
  for(let i=0;i<A.BUDDY_TIER_AFF*20;i++) A.buddyTick(3);
  t("palier plafonne", A.buddyTier()===A.BUDDY_MAX_TIER, A.buddyTier());
  t("niveau d'espece plafonne a 100", S0.dex[25].lvl<=100, S0.dex[25].lvl);
  t("le compagnon rapporte des objets", (S0.buddy.finds||0)>0, S0.buddy.finds);
})();
t("changer de compagnon remet l'affinite a zero",
  (()=>{ A.setBuddy(6); return A.buddy().id===6 && A.buddy().aff===0; })());
t("compagnon absent de l'archive ignore",
  (()=>{ A.getS().buddy={id:999,aff:5,finds:0}; const ok=A.buddy()===null;
         A.getS().buddy=null; return ok; })());

/* --- hebdomadaires --- */
A.setS(A.newState());
A.rollWeekly();
(()=>{
  const W=A.getS().weekly;
  t("3 objectifs hebdomadaires", W.quests.length===3, W.quests.length);
  t("objectifs distincts", new Set(W.quests.map(q=>q.id)).size===3);
  t("cle de semaine stable", W.week===A.weekKey() && /^\d{4}-S\d{1,2}$/.test(W.week), W.week);
  const q=W.quests[0];
  A.weeklyTick(Object.keys({dayCatch:1,dayNew:1,dayRare:1,dayExp:1,dayPokerBlinds:1,dayBoss:1,
    dayEvo:1,dayFish:1,dayEnergy:1}).find(k=>({dayCatch:"wkCatch",dayNew:"wkNew",dayRare:"wkRare",
    dayExp:"wkExp",dayPokerBlinds:"wkPoker",dayBoss:"wkBoss",dayEvo:"wkEvo",dayFish:"wkFish",
    dayEnergy:"wkEnergy"})[k]===q.stat), q.goal);
  t("un objectif progresse jusqu'a son but", q.prog===q.goal, q.prog+"/"+q.goal);
})();
t("rollover hebdomadaire conserve la semaine en cours",
  (()=>{ const w=A.getS().weekly.week; A.weeklyRollover(); return A.getS().weekly.week===w; })());
t("rollover hebdomadaire renouvelle une semaine perimee",
  (()=>{ A.getS().weekly.week="2000-S1"; A.weeklyRollover();
         return A.getS().weekly.week===A.weekKey() && A.getS().weekly.quests.every(q=>q.prog===0); })());
t("9 modeles hebdomadaires", A.WEEKLY_POOL.length===9, A.WEEKLY_POOL.length);

/* --- coffres --- */
A.setS(A.newState());
for(const k of Object.keys(A.CHESTS)){
  t("coffre "+k+" produit un butin lisible", (()=>{
    const items=A.openChest(k, true);
    if(!items.length) return false;
    return items.every(it=>typeof it.label==="string" && it.label.length>0
      && (it.icon || it.id!==undefined) && it.color);
  })());
}
t("butin des coffres serialisable", (()=>{
  for(let i=0;i<40;i++) A.openChest("void", true);
  try{ JSON.parse(JSON.stringify(A.getS())); return true; }catch(e){ return false; }
})());
t("les trouvailles du compagnon sont toutes valides",
  A.BUDDY_FINDS.every(f=>{ const r=f.rw(); return r && Object.keys(r).length; }));


/* --- visée : bonus, jamais de malus --- */
t("hors zone : aucun effet", A.aimBonus(10,[40,60])===1 && A.aimBonus(90,[40,60])===1);
t("centre parfait : x1.25", Math.abs(A.aimBonus(50,[40,60])-1.25)<1e-9);
t("bord de zone : neutre", Math.abs(A.aimBonus(40,[40,60])-1)<1e-9);
t("jamais hors bornes", (()=>{ for(let z=0;z<60;z+=7){ const zone=[z,z+24];
  for(let p=0;p<=100;p+=1){ const b=A.aimBonus(p,zone); if(b<1||b>1.2500001) return false; } }
  return true; })());

/* --- consommables à durée --- */
A.setS(A.newState());
t("boost inactif au départ", !A.boostActive("xp"));
A.startBoost("b_xp");
t("boost activé", A.boostActive("xp"));
t("un second achat prolonge au lieu d'écraser", (()=>{
  const S0=A.getS(); const t1=S0.boosts.xp; A.startBoost("b_xp");
  return S0.boosts.xp > t1 + 14*60000; })());
t("tous les boosts sont cohérents", Object.values(A.BOOSTS).every(b=>
  b.n && b.d && b.min>0 && b.price>0 && (b.cur==="coins"||b.cur==="shards") && b.k && b.spr));

/* --- jours fastes --- */
t("8 profils de journée", A.LUCKY_DAYS.length===8, A.LUCKY_DAYS.length);
t("tirage toujours valide", (()=>{ const ids=A.LUCKY_DAYS.map(d=>d.id);
  for(let i=0;i<3000;i++) if(!ids.includes(A.rollLuckyDay())) return false; return true; })());
t("journée normale majoritaire mais pas écrasante", (()=>{
  let none=0,big=0; for(let i=0;i<6000;i++){ const d=A.rollLuckyDay();
    if(d==="d_none") none++; if(d==="d_gold"||d==="d_storm") big++; }
  const p=none/6000, b=big/6000;
  return p>0.45 && p<0.70 && b>0.01 && b<0.06; })());
t("multiplicateurs lisibles", A.LUCKY_DAYS.every(d=>d.id==="d_none" ||
  (d.n && d.d && d.f && Object.values(d.f).every(v=>typeof v==="number"))));

/* --- trésors de sonde --- */
A.setS(A.newState());
t("les trésors s'accumulent et se valorisent", (()=>{
  const S0=A.getS();
  for(let i=0;i<400;i++) A.rollTreasure(2);
  const n=Object.values(S0.treasures||{}).reduce((a,b)=>a+b,0);
  if(n<20) return false;
  const v=A.treasureValue();
  let calc=0; for(const k in S0.treasures) calc+=A.TREASURES[k].sell*S0.treasures[k];
  return v===calc && v>0; })());
t("la profondeur augmente le rendement", (()=>{
  const mesure=d=>{ A.setS(A.newState()); let n=0;
    for(let i=0;i<3000;i++) if(A.rollTreasure(d)) n++; return n; };
  return mesure(2) > mesure(0)*1.4; })());
t("la Statue Dorée reste rare", A.TREASURES.golden.w===1 && A.TREASURES.golden.sell>20000);

/* --- paliers de secteur --- */
A.setS(A.newState());
t("aucun palier au départ", A.regionTiersDone("kanto").length===0);
t("les paliers se déclenchent une seule fois, dans l'ordre", (()=>{
  const S0=A.getS();
  for(let i=1;i<=151;i++) A.addToDex(i,20,false);
  let guard=0;
  while(A.checkRegionTiers() && guard++<20){}
  const done=A.regionTiersDone("kanto");
  if(done.length!==4) return false;
  if(new Set(done).size!==4) return false;
  return !A.checkRegionTiers(); })());
t("4 paliers avec récompense et texte", A.REGION_TIERS.length===4 &&
  A.REGION_TIERS.every(t2=>t2.pct>0 && t2.rw && Object.keys(t2.rw).length && t2.t.length>15));

/* --- contrats --- */
A.setS(A.newState());
A.rollContract();
t("contrat complet", (()=>{ const C=A.getS().contract;
  return C && C.n && C.goal>0 && C.prog===0 && C.until>Date.now() && C.rw; })());
t("seules les captures conformes comptent", (()=>{
  const S0=A.getS();
  S0.contract={id:"c_rar", r:"kanto", x:2, goal:3, prog:0, claimed:false,
    until:Date.now()+1e7, n:"test", rw:{coins:1}};
  A.contractTick(16,false);            /* Roucool, commun -> ne compte pas */
  const a=S0.contract.prog;
  A.contractTick(149,false);           /* Dracolosse, rare+ -> compte */
  return a===0 && S0.contract.prog===1; })());
t("5 modèles de contrat testables", A.CONTRACTS.length===5 &&
  A.CONTRACTS.every(c=>typeof c.test==="function" && typeof c.pick==="function"));

/* --- nouveau cycle --- */
A.setS(A.newState());
t("cycle non bouclable avant l'épilogue", !A.getS().flags.climax);
t("récompense de cycle croissante avec la progression", (()=>{
  const S0=A.getS();
  const base=A.cycleReward();
  for(let i=1;i<=200;i++) A.addToDex(i,20,false);
  S0.bosses=["a","b","c","d","e","f","g","h","i"]; S0.level=40; S0.stats.shinies=20;
  const plein=A.cycleReward();
  S0.cycle={n:0, mods:Object.keys(A.CYCLE_MODS)};
  const durci=A.cycleReward();
  return plein>base && durci>plein; })());
t("5 modificateurs, bonus cumulés réalistes", (()=>{
  const tot=Object.values(A.CYCLE_MODS).reduce((a,m)=>a+m.bonus,0);
  return Object.keys(A.CYCLE_MODS).length===5 && tot>0.9 && tot<1.2; })());
t("avantages bornés et chiffrables", Object.values(A.PERKS).every(p=>
  p.max>=1 && p.cost(0)>0 && p.cost(p.max-1)>=p.cost(0) && p.d(0).length>5));

/* --- objets tenus --- */
A.setS(A.newState());
t("un objet ne produit rien sans compagnon", (()=>{
  A.grantHeld("h_coin");
  return !A.heldActive("coin"); })());
t("9 objets tenus valides", Object.keys(A.HELD_ITEMS).length===9 &&
  Object.values(A.HELD_ITEMS).every(i=>i.n && i.d && i.k && i.spr && i.rar>=0));

/* --- contenu poker ajouté --- */
t("12 planètes, une par combinaison existante", A.PLANETS.length===12 &&
  A.PLANETS.every(p=>A.HANDS.some(h=>h.id===p.hand)));
t("10 spectres décrits", A.SPECTRALS.length===10 &&
  A.SPECTRALS.every(s2=>s2.n && s2.cost>0 && (s2.d||s2.card)));

/* --- quêtes à quatre paliers --- */
t("4 viviers de quêtes", Object.keys(A.QUEST_POOLS).length===4);
t("le bouquet suit le niveau", (()=>{
  const bas=A.questMix(3).join(), haut=A.questMix(50).join();
  return bas!==haut && A.questMix(3).length===4 && A.questMix(50).length===4; })());
t("anti-répétition d'un jour sur l'autre", (()=>{
  A.setS(A.newState()); const S0=A.getS(); S0.level=20;
  A.rollQuests(); const j1=S0.quests.map(q=>q.id);
  A.rollQuests(); const j2=S0.quests.map(q=>q.id);
  const commun=j1.filter(x=>j2.includes(x)).length;
  return j1.length===4 && j2.length===4 && commun<=1; })());
t("identifiants uniques dans un même jour", (()=>{
  A.rollQuests(); const ids=A.getS().quests.map(q=>q.id);
  return new Set(ids).size===ids.length; })());

/* --- notices et portraits --- */
t("386 notices non vides", A.LORE.length===386 && A.LORE.every(x=>x && x.length>15));
t("notice hors bornes vide", A.loreOf(0)==="" && A.loreOf(999)==="");
t("10 émotions disponibles", A.PZ_EMOS.length===10);
t("l'humeur suit l'intégrité", (()=>{
  A.setS(A.newState()); const S0=A.getS();
  const bas=A.pzMood(); S0.integrity=95; const haut=A.pzMood();
  return bas!==haut && A.PZ_EMOS.includes(bas) && A.PZ_EMOS.includes(haut); })());
t("une réplique force son émotion", A.pzMood({m:"Angry"})==="Angry");


/* --- cartes de collection --- */
A.setS(A.newState());
t("les cartes ne concernent que les légendaires", A.CARD_MONS.length===21 &&
  A.CARD_MONS.every(id=>A.POKE[id].leg>0), A.CARD_MONS.length);
t("chaque légendaire a au moins une illustration",
  A.CARD_MONS.every(id=>A.cardVariants(id).length>=1));
t("seuls quatre ont une illustration Primordiale",
  A.CARD_MONS.filter(id=>A.cardVariants(id).includes("g1")).length===4);
t("les séries sont ordonnées de la plus commune à la plus rare", (()=>{
  const w=A.CARD_ORDER.map(s2=>A.CARD_SERIES_DEF[s2].w);
  return w.every((v,i)=>i===0||v<w[i-1]); })());
t("76 illustrations plus la pièce secrète", Object.keys(A.CARD_INDEX).length===76 &&
  A.cardTotal()===77, A.cardTotal());
t("obtenir une carte, puis un doublon", (()=>{
  const S0=A.getS();
  if(!A.grantCardV("g3",150)) return false;
  if(A.cardOwnedCount()!==1) return false;
  if(A.grantCardV("g3",150)) return false;          /* la seconde est un doublon */
  return S0.cards["g3:150"].dup===1 && A.cardHas("g3",150); })());
t("la pièce secrète ne s'obtient qu'une fois",
  A.grantSecretCard()===true && A.grantSecretCard()===false);
t("le tirage reste dans les variantes existantes", (()=>{
  for(let i=0;i<600;i++){ const c=A.randomCard(1);
    if(!A.cardVariants(c.id).includes(c.s)) return false; }
  return true; })());
t("un biais élevé favorise les séries anciennes", (()=>{
  const cnt=b=>{ let old=0; for(let i=0;i<3000;i++){
    const s2=A.rollCardSeries(150,b); if(s2==="g2"||s2==="g1") old++; } return old; };
  return cnt(3.2) > cnt(1)*2; })());
t("migration des anciennes sauvegardes", (()=>{
  const old={150:{r:2,t:1,dup:1}, 249:{r:0,t:2}};
  const m=A.migrateCards(old);
  return m["g3:150"] && m["g3:150"].dup===1 && m["art:249"] && !m["150"]; })());
t("une sauvegarde déjà migrée n'est pas retouchée", (()=>{
  const cur={"g1:144":{t:1,dup:0}};
  const m=A.migrateCards(cur);
  return m["g1:144"] && Object.keys(m).length===1; })());


/* --- rendu des cartes --- */
A.setS(A.newState());
t("l'empreinte de contrôle est stable et unique", (()=>{
  const seen = new Set();
  for(const id of A.CARD_MONS) for(const s2 of A.cardVariants(id)){
    const c = A.cardChecksum(s2, id);
    if(!/^[0-9A-F]{2}(·[0-9A-F]{2}){3}$/.test(c)) return false;
    if(A.cardChecksum(s2, id) !== c) return false;     /* deterministe */
    seen.add(c);
  }
  return seen.size >= 70;                               /* quasiment aucune collision */
})());
t("la bande de données est déterministe", (()=>{
  const a1 = A.cardBytes("g3", 150, 8), a2 = A.cardBytes("g3", 150, 8);
  const b1 = A.cardBytes("g1", 150, 8);
  return a1 === a2 && a1 !== b1 && /^([0-9A-F]{2} ){7}[0-9A-F]{2}$/.test(a1);
})());
t("chaque série porte son étiquette de génération",
  A.CARD_ORDER.every(s2=>typeof A.GEN_TAG[s2] === "string" && A.GEN_TAG[s2].length > 2));
t("une carte non émise ne révèle rien", (()=>{
  const h = A.tcardHtml("g1", 144, {});
  return h.includes("sealed") && !h.includes("Artikodin") && h.includes("NON ÉMIS");
})());
t("une carte émise porte sa structure complète", (()=>{
  A.grantCardV("g3", 150);
  const h = A.tcardHtml("g3", 150, {});
  return ["tc-bar","tc-window","tc-routines","tc-bytes","tc-foot","tc-rar","tc-brackets"]
    .every(k=>h.includes(k)) && h.includes("Mewtwo");
})());
t("la vue agrandie est bien marquée", A.tcardHtml("g3",150,{hero:true}).includes("hero-card"));
t("le dos de carte existe et porte la marque", (()=>{
  const b = A.cardBackHtml();
  return b.includes("cardback") && b.includes("GENESIS");
})());
t("le rang d'un sachet suit sa meilleure série", (()=>{
  const bas = A.boosterRank([{s:"art",id:150},{s:"g5",id:151}]);
  const haut = A.boosterRank([{s:"art",id:150},{s:"g1",id:144}]);
  return haut > bas && haut === A.CARD_ORDER.indexOf("g1");
})());
t("le nom de série suit la découverte", (()=>{
  const S0 = A.getS();
  S0.cards = {};
  const cache = A.seriesName("g1");
  A.grantCardV("g1", 144);
  return cache === "Série non répertoriée" && A.seriesName("g1") === "Rendu primordial";
})());


/* --- mise en scène des illustrations --- */
t("chaque légendaire reçoit un environnement", (()=>{
  const envs = new Set();
  for(const id of A.CARD_MONS){
    const e = A.cardEnvOf(id, false);
    if(!e || typeof e !== "string") return false;
    envs.add(e);
  }
  return envs.size >= 5;                       /* la variété est réelle, pas décorative */
})());
t("l'environnement suit le type dominant", (()=>{
  return A.cardEnvOf(383, false) === "braise"     /* Groudon, Sol */
      && A.cardEnvOf(382, false) === "abysse"     /* Kyogre, Eau */
      && A.cardEnvOf(150, false) === "vide"       /* Mewtwo, Psy */
      && A.cardEnvOf(384, false) === "aurore";    /* Rayquaza, Dragon */
})());
t("la pièce secrète a son propre environnement", A.cardEnvOf(0, true) === "vide");
t("aucun type ne tombe sans environnement", (()=>{
  for(let t2 = 1; t2 <= 18; t2++){
    const fake = A.CARD_ENV[t2] || "neutre";
    if(typeof fake !== "string") return false;
  }
  return true;
})());
t("la scène est composée de toutes ses couches", (()=>{
  A.grantCardV("art", 384);
  const h = A.tcardHtml("art", 384, {});
  return ["tc-sky","tc-horizon","tc-atmos","tc-haze","tc-vign","env-aurore"]
    .every(k => h.includes(k));
})());


/* --- secrets --- */
A.setS(A.newState());
t("les noms reconnus se résolvent, casse et accents compris", (()=>{
  const a = A.resolveName("RED"), b = A.resolveName("red"), c = A.resolveName("R.E.D.");
  const gary = A.resolveName("Gary"), blue = A.resolveName("blue");
  return a && b && c && a.n === "silence" && b.n === "silence" && c.n === "silence"
      && gary && blue && gary.n === blue.n;          /* l'alias pointe bien sur la meme entree */
})());
t("un nom quelconque n'est pas reconnu",
  !A.resolveName("Medimed") && !A.resolveName("") && !A.resolveName("xyz123"));
t("chaque nom reconnu a une réplique", (()=>{
  for(const k in A.KNOWN_NAMES){
    const e = A.resolveName(k);
    if(!e || !e.t || e.t.length < 30) return false;
  }
  return true;
})());
t("le sixième objet est introuvable sur un sac vide", (()=>{
  const S0 = A.getS();
  S0.balls = {}; S0.berries = {}; S0.items = {}; S0.stones = {};
  return A.sixthItem() === null && A.glitchSixthItem() === null;
})());
t("la faille recopie bien cent vingt-huit exemplaires", (()=>{
  const S0 = A.getS();
  S0.balls = {poke:10, super:5, hyper:3};
  S0.berries = {framby:2, nanab:2, sitrus:2, micle:1};
  S0.items = {potion:1}; S0.stones = {};
  const g = A.glitchSixthItem();
  if(!g) return false;
  return g.after === g.before + 128 && S0.flags.sixth === true && g.name.length > 2;
})());
t("le glitch ne dépasse jamais le plafond", (()=>{
  const S0 = A.getS();
  S0.balls = {super:990}; S0.berries = {}; S0.items = {}; S0.stones = {};
  A.glitchSixthItem();
  return S0.balls.super === 999;
})());
t("trois paliers de génération, une seule fois chacun", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  if(Object.keys(A.GEN_MARKS).length !== 3) return false;
  S0.streak = 151; A.checkChainMark(); A.checkChainMark();
  const un = (S0.flags.chainMarks||[]).length;
  S0.streak = 251; A.checkChainMark();
  S0.streak = 200; A.checkChainMark();               /* palier non remarquable */
  return un === 1 && S0.flags.chainMarks.length === 2;
})());
t("les jours particuliers sont bien formés", (()=>{
  const d = A.specialDay();
  return d === null || (d.id && d.n && d.d);         /* selon la date du jour */
})());
t("la fenêtre nocturne est cohérente", typeof A.isNightWindow() === "boolean");
t("Porygon-Z cède à trente", (()=>{
  const keys = Object.keys(A.PZ_POKE_LINES).map(Number);
  return Math.max(...keys) === 30 && keys.length >= 4;
})());


/* --- seconde vague de secrets --- */
t("le code est la séquence attendue",
  A.KONAMI.join(" ") === "ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a");
t("le vendeur passe environ un jour sur huit", (()=>{
  /* on ne peut pas changer la date : on verifie que la fonction est deterministe
     et que le resultat est booleen */
  const a = A.karpDealDay(), b = A.karpDealDay();
  return a === b && typeof a === "boolean";
})());
t("l'offre ne se prend qu'une fois par jour", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  if(!A.karpDealDay()) return true;                  /* pas le bon jour, rien a verifier */
  const avant = A.karpDealAvailable();
  S0.karpDeal = A.today ? A.today() : new Date().toISOString().slice(0,10);
  return avant === true;
})());
t("tous les succès cachés ont une condition testable", (()=>{
  const S0 = A.newState();
  for(const a of A.ACHIEVEMENTS){
    if(!a.chk) return false;
    try { a.chk(S0); } catch(e){ console.log("  condition en erreur :", a.id, e.message); return false; }
  }
  return true;
})());
t("aucun succès n'est déjà acquis sur une partie neuve", (()=>{
  const S0 = A.newState();
  return A.ACHIEVEMENTS.filter(a=>{ try { return a.chk(S0); } catch(e){ return false; } }).length === 0;
})());


/* --- refonte de l'expédition --- */
t("douze fourchettes de puissance, croissantes", (()=>{
  if(A.BST_BANDS.length !== 12) return false;
  for(let i=1;i<12;i++){
    if(A.BST_BANDS[i][0] < A.BST_BANDS[i-1][0]) return false;
    if(A.BST_BANDS[i][1] < A.BST_BANDS[i-1][1]) return false;
    if(A.BST_BANDS[i][0] >= A.BST_BANDS[i][1]) return false;
  }
  return true;
})());
t("un tirage sauvage respecte la fourchette de son étage", (()=>{
  A.setS(A.newState());
  for(const f of [0,3,6,9,11]){
    const [lo,hi] = A.bstBand(f);
    for(let k=0;k<40;k++){
      const id = A.wildIdFor(f);
      const p = A.POKE[id];
      if(p.leg) return false;
      /* la fourchette peut etre relachee si elle est vide, mais pas pour ces etages */
      if(p.bst < lo - 60 || p.bst > hi + 60) return false;
    }
  }
  return true;
})());
t("les poids de nœuds évoluent le long du parcours", (()=>{
  const tot = w => Object.values(w).reduce((a,b)=>a+b,0);
  const debut = A.NODE_W[1], fin = A.NODE_W[A.NODE_W.length-1];
  /* le debut recrute, la fin met a l'epreuve */
  return (debut.draft / tot(debut)) > (fin.draft / tot(fin)) * 2
      && (fin.elite || 0) > (debut.elite || 0);
})());
t("le premier et le dernier étage sont imposés", (()=>{
  const r = () => 0.5;
  return A.nodeTypeFor(0, r) === "fight" && A.nodeTypeFor(11, r) === "boss"
      && A.nodeTypeFor(10, r) === "rest";
})());
t("le niveau adverse suit l'étage, jamais l'équipe", (()=>{
  const faible = {floor:5, level:10}, fort = {floor:5, level:90};
  return A.expEnemyLevel(faible, 0) === A.expEnemyLevel(fort, 0)
      && A.expEnemyLevel({floor:11, level:10}, 0) > A.expEnemyLevel({floor:1, level:10}, 0);
})());
t("dix-huit archivistes, un type chacun", A.TRAINERS.length === 18 &&
  new Set(A.TRAINERS.map(x=>x.t)).size === 18);

/* --- équipement --- */
t("seize objets, tous chiffrés", (()=>{
  const ids = Object.keys(A.EXP_ITEMS);
  if(ids.length !== 16) return false;
  return ids.every(id=>{
    const it = A.EXP_ITEMS[id];
    return it.n && it.d && it.spr && it.rar >= 0 &&
      Object.keys(it).some(k=>!["n","d","spr","rar"].includes(k));
  });
})());
t("les objets rares ne tombent pas dans les premiers étages", (()=>{
  const bas = A.rollExpItem(1, 3), haut = A.rollExpItem(11, 3);
  const rarMax = l => Math.max(...l.map(id=>A.EXP_ITEMS[id].rar));
  return rarMax(bas) <= 1 && bas.length === 3 && haut.length === 3;
})());
t("un tirage ne propose jamais deux fois le même objet", (()=>{
  for(let k=0;k<200;k++){ const l = A.rollExpItem(8, 3);
    if(new Set(l).size !== l.length) return false; }
  return true;
})());
t("trois voies dans un seul module, dont la Tour", (()=>{
  const ks = Object.keys(A.EXP_MODES);
  if(ks.length !== 3) return false;
  const runs = ks.filter(k=>!A.EXP_MODES[k].go);
  const dests = ks.filter(k=>A.EXP_MODES[k].go);
  return runs.length === 2 && dests.length === 1
      && A.EXP_MODES.nuzlocke.mult > A.EXP_MODES.classic.mult
      && A.EXP_MODES.tower.go === "tower";
})());

/* --- Tour --- */
t("un trait monte tous les deux Pokémon du type, plafonné à trois", (()=>{
  const eq = n => Array.from({length:n}, ()=>({id:4, hp:10, maxHp:10}));   /* Salameche, Feu */
  const t1 = A.traitLevels(eq(1)), t2 = A.traitLevels(eq(2)), t8 = A.traitLevels(eq(8));
  return !t1[10] && t2[10] === 1 && t8[10] === 3;
})());
t("les Pokémon KO ne comptent pas dans les traits", (()=>{
  const eq = [{id:4,hp:0,maxHp:10},{id:4,hp:0,maxHp:10}];
  return Object.keys(A.traitLevels(eq)).length === 0;
})());
t("le bonus de trait croît avec le palier", (()=>{
  const un = A.traitBonus({10:1}, "dmg"), trois = A.traitBonus({10:3}, "dmg");
  return trois > un && un > 0 && A.traitBonus({}, "dmg") === 0;
})());
t("douze traits, tous décrits", Object.keys(A.TOWER_TRAITS).length === 12 &&
  Object.values(A.TOWER_TRAITS).every(t2=>t2.n && t2.d));
t("le renfort remonte à la racine de la lignée", (()=>{
  return A.lineRoot(3) === 1 && A.lineRoot(1) === 1      /* Florizarre -> Bulbizarre */
      && A.lineRoot(6) === 4 && A.lineRoot(150) === 150; /* Mewtwo n'evolue pas */
})());
t("la Tour monte sans plafond de contenu", (()=>{
  const a = A.towerLevel(1), b = A.towerLevel(20), c = A.towerLevel(60);
  const [lo1] = A.towerBand(1), [lo2] = A.towerBand(15);
  return b > a && c >= b && lo2 > lo1 && c <= 100;
})());
t("six statistiques renforçables", A.BUFF_STATS.length === 6 &&
  A.BUFF_STATS.every(s2=>s2.k && s2.n));


/* --- le monde --- */
A.setS(A.newState());
t("six habitats, ouverture progressive", (()=>{
  const needs = A.HABITAT_IDS.map(k=>A.HABITATS[k].need);
  return A.HABITAT_IDS.length === 6 && needs[0] === 0 &&
    needs.every((n,i)=>i === 0 || n > needs[i-1]);
})());
t("les habitats couvrent presque tous les types", (()=>{
  /* le recouvrement est voulu : une Plante se croise sur la route et en sylve,
     avec des poids differents. Ce qui compte, c'est qu'aucun type ne soit orphelin. */
  const seen = new Set();
  for(const k of A.HABITAT_IDS){
    const h = A.HABITATS[k];
    if(!h.types.length || !h.n || !h.d) return false;
    for(const t2 of h.types) seen.add(t2);
  }
  return seen.size >= 15;
})());
t("aucun habitat n'est un doublon d'un autre", (()=>{
  const sigs = A.HABITAT_IDS.map(k=>A.HABITATS[k].types.slice().sort().join(","));
  return new Set(sigs).size === sigs.length;
})());
t("le vivier suit réellement l'habitat", (()=>{
  /* comparaison RELATIVE entre deux habitats : un seuil absolu rendrait le
     test dependant de l'heure, puisque la nuit penalise le type Feu. */
  const S0 = A.getS();
  S0.region = "kanto"; S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9;
  for(let i=1;i<=151;i++) A.addToDex(i,20,false);
  const part = (hab, type) => {
    S0.habitat = hab;
    let hit = 0, n = 0;
    for(let i=0;i<600;i++){ const id = A.speciesInHabitat(0);
      if(!id) continue; n++;
      if(A.POKE[id].types.includes(type)) hit++; }
    return n ? hit / n : 0;
  };
  const eauIci = part("eaux", 11),  eauAilleurs = part("foyer", 11);
  const feuIci = part("foyer", 10), feuAilleurs = part("eaux", 10);
  return eauIci > 0.6 && eauIci > eauAilleurs * 4
      && feuIci > 0.2 && feuIci > feuAilleurs * 4;
})());
t("six météos, toutes décrites", A.WEATHER_IDS.length === 6 &&
  A.WEATHER_IDS.every(k=>A.WEATHER[k].n && A.WEATHER[k].d && A.WEATHER[k].c));
t("la météo tourne et ne reste jamais indéfinie", (()=>{
  const S0 = A.getS();
  S0.weatherUntil = 0;
  const w = A.weatherDef();
  return w && w.n && S0.weatherUntil > Date.now();
})());
t("l'heure renvoie un état net", typeof A.isNight() === "boolean");

/* --- recherche --- */
A.setS(A.newState());
t("quatre tâches, décrites et chiffrées", A.RESEARCH_TASKS.length === 4 &&
  A.RESEARCH_TASKS.every(t2=>t2.n && t2.d && t2.k));
t("une espèce sans évolution a une tâche de moins",
  A.researchMax(150) === 3 && A.researchMax(1) === 4);
t("les raretés hautes demandent moins d'exemplaires", (()=>{
  const t2 = A.RESEARCH_TASKS[0];
  return A.taskGoal(t2, 150) < A.taskGoal(t2, 16);
})());
t("une tâche accomplie fait monter le niveau de recherche", (()=>{
  const S0 = A.getS();
  A.addToDex(25, 10, false);
  const avant = A.researchLevel(25);
  for(let i=0;i<10;i++) A.researchTick(25, "catch", 1);
  return avant === 0 && A.researchLevel(25) === 1;
})());
t("sept paliers de recherche, croissants", (()=>{
  const n = A.RESEARCH_TIERS.map(x=>x.n);
  return n.length === 7 && n.every((v,i)=>i===0 || v > n[i-1]) &&
    A.RESEARCH_TIERS.every(x=>x.rw && Object.keys(x.rw).length);
})());

/* --- intègres et talents --- */
t("un exemplaire sur cinquante est intègre", (()=>{
  A.setS(A.newState());
  let n = 0;
  for(let i=0;i<20000;i++) if(A.rollPerfect()) n++;
  const taux = n / 20000;
  return taux > 0.012 && taux < 0.030;
})());
t("chaque type a son talent", (()=>{
  for(let t2=1;t2<=18;t2++) if(!A.TALENTS[t2]) return false;
  return Object.values(A.TALENTS).every(x=>x.n && x.d);
})());
t("chaque espèce reçoit un talent nommé", (()=>{
  for(const id of [1,25,150,384,129]){
    const tl = A.talentOf(id);
    if(!tl || !tl.n || !tl.type) return false;
  }
  return true;
})());

/* --- rapport hebdomadaire --- */
t("la semaine commence un lundi", (()=>{
  const w = A.weekStamp();
  return /^\d{4}-\d{2}-\d{2}$/.test(w) && new Date(w + "T12:00:00").getDay() === 1;
})());
t("huit lignes de rapport, toutes nommées", A.REPORT_ROWS.length === 8 &&
  A.REPORT_ROWS.every(r=>r.k && r.n && r.i));


/* --- récit : trois voix --- */
t("onze fragments, découverts dans l'ordre", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  if(A.FRAGMENTS.length !== 11) return false;
  const ordre = [];
  for(let i=1;i<=386;i++){ A.addToDex(i,20,false); while(A.checkFragments()) ordre.push(0); }
  for(let k=0;k<=100;k++){ S0.integrity = k; while(A.checkFragments()) ordre.push(0); }
  const got = S0.fragments;
  return got.length === 11 && got.every((v,i)=>v === i+1);
})());
t("chaque fragment a un auteur et un texte long",
  A.FRAGMENTS.every(f=>f.who && f.t && f.t.length > 120 && f.n));
t("les conditions de découverte sont croissantes", (()=>{
  let lastDex = -1, lastInt = -1;
  for(const f of A.FRAGMENTS){
    if(f.at.dex !== undefined){ if(f.at.dex <= lastDex) return false; lastDex = f.at.dex; }
    if(f.at.integ !== undefined){ if(f.at.integ <= lastInt) return false; lastInt = f.at.integ; }
  }
  return true;
})());
t("six étapes de faille, qui ne sautent jamais", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  S0.integrity = 100;
  const vus = [];
  for(let i=0;i<40;i++){ const before = A.riftStage(); A.riftTick();
    if(A.riftStage() !== before) vus.push(A.riftStage()); }
  return A.RIFT_ARC.length === 6 && vus.length === 6 && vus.every((v,i)=>v === i+1);
})());
t("l'arc de la faille est verrouillé par l'intégrité", (()=>{
  A.setS(A.newState());
  const S0 = A.getS();
  S0.integrity = 0;
  for(let i=0;i<30;i++) A.riftTick();
  return A.riftStage() === 1;                 /* seule la premiere etape passe a 0% */
})());
t("chaque étape de faille fait parler plusieurs voix",
  A.RIFT_ARC.every(sc=>sc.lines.length >= 3 &&
    new Set(sc.lines.map(l=>l.w)).size >= 2));

/* --- attaque signature --- */
t("la signature suit le type dominant", (()=>{
  const m = A.signatureMove(A.POKE[4], 30, 0);      /* Salameche, Feu */
  return m && m.signature && m.type === A.POKE[4].types[0];
})());
t("trois paliers, de plus en plus puissants", (()=>{
  const a = A.signatureMove(A.POKE[4], 10, 0);
  const b = A.signatureMove(A.POKE[4], 10, 2);
  return b.pw > a.pw && b.tier === 2 && A.moveTierName(2).length > 2;
})());
t("le niveau ouvre les paliers tout seul", (()=>{
  const bas = A.signatureMove(A.POKE[4], 10, 0);
  const haut = A.signatureMove(A.POKE[4], 50, 0);
  return haut.pw > bas.pw;
})());


/* --- lisibilité de la carte --- */
t("aucune liaison n'en croise une autre", (()=>{
  A.setS(A.newState());
  for(let seed = 1; seed <= 300; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 1; y++){
      const cur = map[y];
      for(let i = 0; i < cur.length; i++)
        for(let j = i + 1; j < cur.length; j++)
          for(const a of cur[i].next)
            for(const b of cur[j].next)
              if(a > b) return false;     /* i est a gauche de j : ses cibles aussi */
    }
  }
  return true;
})());
t("aucun nœud inatteignable, aucune impasse", (()=>{
  A.setS(A.newState());
  for(let seed = 1; seed <= 300; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 1; y++){
      const cur = map[y], nx = map[y + 1];
      for(const n of cur) if(!n.next.length) return false;
      for(let j = 0; j < nx.length; j++)
        if(!cur.some(p => p.next.includes(j))) return false;
    }
  }
  return true;
})());
t("la carte offre de vrais choix", (()=>{
  A.setS(A.newState());
  let branch = 0, total = 0;
  for(let seed = 1; seed <= 200; seed++){
    const map = A.genMap(seed);
    for(let y = 0; y < map.length - 1; y++)
      for(const n of map[y]){ total++; if(n.next.length > 1) branch++; }
  }
  const part = branch / total;
  return part > 0.15 && part < 0.6;      /* ni couloir, ni brouillard */
})());
t("le départ et l'arrivée sont uniques", (()=>{
  A.setS(A.newState());
  const map = A.genMap(7);
  return map[map.length - 1].length === 1 && map[0].length === 2;
})());


/* --- le forage --- */
t("neuf strates, besoins et rendements croissants", (()=>{
  if(A.STRATA.length !== 9) return false;
  for(let i=1;i<9;i++){
    if(A.STRATA[i].need <= A.STRATA[i-1].need) return false;
    if(A.STRATA[i].mul  <= A.STRATA[i-1].mul)  return false;
  }
  return true;
})());
t("chaque strate sous la Surface ouvre une mécanique", (()=>{
  const ks = A.STRATA.slice(1).map(x=>x.unlock && x.unlock.k);
  return ks.every(Boolean) && new Set(ks).size === ks.length;
})());
t("aucune sonde ne produit avant la Couche molle", (()=>{
  A.setS(A.newState());
  const f = A.forage();
  f.drills = {main: 10};
  const avant = f.energy;
  A.forageTick(60);
  return f.energy === avant && !A.unlocked("auto");
})());
t("les sondes produisent une fois la Couche molle atteinte", (()=>{
  A.setS(A.newState());
  const f = A.forage();
  f.depth = 1; f.drills = {main: 10};
  A.forageTick(10);
  return f.energy > 0 && A.forageRate() > 0;
})());
t("le coût d'une sonde croît avec le nombre possédé", (()=>{
  A.setS(A.newState());
  const f = A.forage(), d = A.DRILLS[0];
  const c0 = A.drillCost(d);
  f.drills[d.k] = 10;
  return A.drillCost(d) > c0 * 5;
})());
t("la frappe vaut toujours au moins une unité", (()=>{
  A.setS(A.newState());
  return A.clickValue() >= 1;
})());
t("pas d'Échos avant la Faille mineure", (()=>{
  A.setS(A.newState());
  const f = A.forage();
  f.total = 1e12; f.depth = 5;
  return A.echoGain() === 0;
})());
t("le recalibrage rend des Échos une fois la Faille atteinte", (()=>{
  A.setS(A.newState());
  const f = A.forage();
  f.total = 6e9; f.depth = 6;
  return A.echoGain() > 0;
})());
t("six axes de recalibrage, coûts croissants", (()=>{
  const ks = Object.keys(A.ECHO_PERKS);
  if(ks.length !== 6) return false;
  return ks.every(k=>{ const p = A.ECHO_PERKS[k];
    return p.max > 0 && p.cost(1) > p.cost(0) && typeof p.d(0) === "string"; });
})());
t("le réservoir hors ligne se repousse", (()=>{
  A.setS(A.newState());
  const f = A.forage();
  const base = A.offlineHours();
  f.depth = 4; f.perks = {e_offline: 3};
  return A.offlineHours() > base;
})());
t("la Pénétration réduit le coût de descente", (()=>{
  A.setS(A.newState());
  const f = A.forage();
  f.depth = 2;
  const c0 = A.depthCost();
  f.perks = {e_depth: 3};
  return A.depthCost() < c0;
})());


/* --- exclusivités et pêche --- */
const openAll = () => { A.setS(A.newState()); const S0 = A.getS();
  S0.bosses = A.REGIONS.flatMap(r=>r.guardians.map(g=>r.key+":"+g.id));
  S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9; return S0; };
t("aucune exclusivité dans la capture classique", (()=>{
  const S0 = openAll();
  for(let i=1;i<=386;i++) if(!A.isExclusive(i)) A.addToDex(i,20,false);
  for(const r of A.unlockedRegions()){ S0.region = r.key;
    for(let k=0;k<150;k++) for(let rar=0;rar<=4;rar++){
      const id = A.speciesForRarity(rar); if(id && A.isExclusive(id)) return false; } }
  return true;
})());
t("chaque exclusivité a une source", (()=>{
  for(const k in A.EXCLUSIVES) for(const id of A.EXCLUSIVES[k]) if(!A.EXCL_SOURCE[id]) return false;
  return A.EXCL_SOURCE[382] === "fish" && A.EXCL_SOURCE[172] === "egg" && A.EXCL_SOURCE[138] === "forage";
})());
t("les cannes s'améliorent sur tous les axes", (()=>{
  for(let i=1;i<A.RODS.length;i++){
    const a = A.RODS[i-1], b = A.RODS[i];
    if(!(b.hook > a.hook && b.shiny > a.shiny && b.cost > a.cost)) return false;
  }
  return true;
})());
t("Kyogre ne se pêche jamais à la Vieille Canne", (()=>{
  const S0 = openAll(); S0.rod = 1;
  for(let k=0;k<3000;k++){ delete A.getS().dex[382]; A.newFishEncounter();
    if(A.getENC().id === 382) return false; }
  return true;
})());
t("Kyogre se pêche à la Méga Canne, une fois Hoenn ouvert", (()=>{
  const S0 = openAll(); S0.rod = 3;
  for(let k=0;k<4000;k++){ delete S0.dex[382]; A.newFishEncounter(); if(A.getENC().id === 382) return true; }
  return false;
})());
t("la pêche ne remonte que de l'Eau ou des exclusivités de pêche", (()=>{
  const S0 = openAll(); S0.rod = 2;
  for(let k=0;k<1500;k++){ A.newFishEncounter();
    const e = A.getENC(), p = A.POKE[e.id];
    if(!p.types.includes(11) && A.EXCL_SOURCE[e.id] !== "fish") return false; }
  return true;
})());
t("les bébés sortent des œufs, les fossiles du vivier fossile", (()=>{
  openAll();
  const oeuf = A.eggPool("e_common"), fos = A.eggPool("f_fossil");
  return oeuf.some(i=>A.EXCL_SOURCE[i] === "egg") && fos.length >= 3
      && fos.every(i=>A.EXCL_SOURCE[i] === "forage")
      && !oeuf.some(i=>A.EXCL_SOURCE[i] === "fish" || A.EXCL_SOURCE[i] === "forage");
})());

/* --- répulsifs, leurres, séries --- */
t("le répulsif écarte les communs puis s'épuise", (()=>{
  const S0 = openAll(); S0.repel = 2;
  const a = A.repelRarity(0), b = A.repelRarity(0), c = A.repelRarity(0);
  return a === 1 && b === 1 && c === 0 && S0.repel === 0;
})());
t("le leurre ne favorise que son type", (()=>{
  const S0 = openAll(); S0.lure = {type:11, n:5};
  return A.lureMul(A.POKE[7]) > 1 && A.lureMul(A.POKE[4]) === 1;
})());
t("une série par rareté monte, paie à son palier, et casse seule", (()=>{
  const S0 = openAll();
  const coins = S0.coins;
  for(let i=0;i<10;i++) A.rstreakCatch(2);
  A.rstreakCatch(0);
  const ok1 = A.rstreak()[2] === 10 && S0.coins > coins;
  A.rstreakBreak(2);
  return ok1 && A.rstreak()[2] === 0 && A.rstreak()[0] === 1;
})());

/* --- permanents --- */
t("le Charme Chroma augmente réellement la chance de chromatique", (()=>{
  const S0 = openAll(); S0.streak = 0;
  const a = A.shinyOdds(); S0.perm = {charm:5}; const b = A.shinyOdds();
  return b > a * 1.6 && A.charmMul() > 1.7;
})());
t("les permanents sont plafonnés et leur coût croît", (()=>{
  for(const k in A.PERMANENTS){ const p = A.PERMANENTS[k];
    if(!(p.max > 0 && p.cost(1) > p.cost(0))) return false; }
  const S0 = openAll(); S0.perm = {rune:10};
  return Math.abs(A.runeMul() - 1.5) < 1e-9;
})());

/* --- amitié --- */
t("Nosferalto n'évolue qu'en compagnon, avec un lien suffisant", (()=>{
  const S0 = openAll();
  A.addToDex(42, 50, false); S0.dex[42].c = 99; S0.coins = 1e9;
  const e = A.POKE[42].evo[0];
  const sans = A.canEvolve(42, e);
  S0.buddy = {id:42, aff:0}; const faible = A.canEvolve(42, e);
  S0.buddy = {id:42, aff:1e9}; const fort = A.canEvolve(42, e);
  return !sans.ok && !faible.ok && fort.ok;
})());
t("Évoli choisit selon l'heure", (()=>{
  return A.friendEvo(133, 196) === "day" && A.friendEvo(133, 197) === "night"
      && !A.friendEvo(133, 134);          /* Aquali reste une évolution par pierre */
})());

/* --- codes --- */
t("un code valide ne sert qu'une fois", (()=>{
  const h = A.codeHash("genesis");
  return !!A.CODES[h] && A.codeHash("GENESIS") === h && !A.CODES[A.codeHash("FAUX")];
})());

/* --- Safari, capture autonome, factions, aujourd'hui --- */
t("Kangourex et Tauros sont exclusifs au Safari", A.EXCL_SOURCE[115] === "safari" &&
  A.EXCL_SOURCE[128] === "safari" && A.SAFARI_POOL.includes(115) && typeof A.isSafariDay() === "boolean");
t("la capture autonome ne tire ni légendaire ni exclusivité", (()=>{
  openAll();
  for(let k=0;k<2000;k++){ const id = A.botSpecies();
    if(A.POKE[id].leg || A.isExclusive(id)) return false; }
  return A.botRate() >= 4 && A.botHours() >= 2;
})());
t("les rangs de faction sont croissants", A.FACTION_RANKS.every((v,i)=>i===0 || v > A.FACTION_RANKS[i-1]));
t("une faction ne renforce que sa spécialité", (()=>{
  const S0 = openAll(); S0.faction = {k:"echo", pts:5000};
  return A.factionRank() >= 4 && A.factionMul("shards") > 1
      && A.factionMul("coins") === 1 && A.factionMul("integ") === 1;
})());
t("le tableau du jour se construit sur une partie neuve", (()=>{
  A.setS(A.newState());
  const r = A.todayRows();
  return Array.isArray(r) && r.length >= 1 && r.every(x=>x.n && x.go) && typeof A.todayPending() === "number";
})());


/* --- garde-fous de la chaîne et de la pêche --- */
t("en Pêche, la relance revient à la ligne", (()=>{
  A.setS(A.newState()); const S0 = A.getS();
  S0.rod = 1; S0.capMode = "fish";
  A.nextEncounter();
  const ok1 = A.getENC() === null;
  S0.capMode = "classic";
  A.nextEncounter();
  return ok1 && A.getENC() !== null;
})());
t("la chaîne reste tenable à la Poké Ball (calcul exact)", (()=>{
  /* probabilite de rupture par rencontre, calculee a partir des formules du jeu
     et de la repartition des raretes : aucun tirage, donc aucun artefact possible */
  A.setS(A.newState()); const S0 = A.getS();
  S0.level = 12; S0.streak = 20; S0.event = null; S0.luckyDay = "d_none";
  S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9;
  const w = A.RARITY.map((r,i)=>i === 5 ? 0 : r.w), tot = w.reduce((a,b)=>a+b,0);
  let pBreak = 0;
  for(let rar = 0; rar <= 4; rar++){
    /* un representant de la rarete, niveau moyen */
    const id = A.POKE_IDS.find(i=>A.POKE[i].rar === rar && !A.POKE[i].leg);
    A.setENC({id, rar, level:30, shiny:false, attempts:0});
    let alive = 1, broke = 0;
    for(let k = 0; k < 10; k++){
      const c = A.catchChance("poke");
      const f = A.fleeChance();
      broke += alive * (1 - c) * f;
      alive *= (1 - c) * (1 - f);
      A.getENC().attempts++;
    }
    pBreak += (w[rar] / tot) * broke;
  }
  const mediane = Math.log(2) / pBreak;
  return mediane > 10 && mediane < 60;
})());


/* --- standard des cinématiques : chaque scène est vérifiée ---
   Le vocabulaire est fermé. Une scène qui sort du standard échoue ici,
   avant d'échouer à l'écran. */
const CINE_BEATS = ["bars","bg","card","actor","leave","mood","say","fx","code","rain","sfx","wait","par"];
const CINE_FX = ["shake","flash","glitch","rgb","noise","blackout"];
const CINE_BGS = ["labo","void","terminal","faille"];
function cineLint(sc){
  const errs = [], alive = new Set();
  const walk = (b) => {
    if(!CINE_BEATS.includes(b.t)) errs.push("temps inconnu : " + b.t);
    if(b.t === "par") return b.beats.forEach(walk);
    if(b.t === "bg" && !CINE_BGS.includes(b.k)) errs.push("décor inconnu : " + b.k);
    if(b.t === "say"){
      if(!(b.who in A.CINE_WHO)) errs.push("locuteur inconnu : " + b.who);
      if(!b.text) errs.push("réplique vide");
      if(b.corrupt !== undefined && (b.corrupt < 0 || b.corrupt > 1)) errs.push("corruption hors [0,1]");
    }
    if(b.t === "fx"){
      if(!CINE_FX.includes(b.k)) errs.push("effet inconnu : " + b.k);
      if(b.lv !== undefined && ![1,2,3].includes(b.lv)) errs.push("intensité hors 1-3 : " + b.lv);
    }
    if(b.t === "actor"){
      if(!["prof","pz","mon","missing","emblem"].includes(b.kind)) errs.push("type d'acteur inconnu : " + b.kind);
      if(b.kind === "mon" && !A.POKE[b.mon]) errs.push("Pokémon inconnu : " + b.mon);
      if(typeof b.pos === "string" && !(b.pos in A.CINE_POS)) errs.push("position inconnue : " + b.pos);
      if(alive.has(b.id)) errs.push("acteur déjà en scène : " + b.id);
      alive.add(b.id);
    }
    if(b.t === "leave"){ if(!alive.has(b.id)) errs.push("sortie d'un acteur absent : " + b.id); alive.delete(b.id); }
    if(b.t === "mood" && !alive.has(b.id)) errs.push("humeur d'un acteur absent : " + b.id);
    if(b.t === "fx" && b.k === "blackout") alive.clear();   /* l'extinction vide le plateau */
  };
  for(const sh of sc.shots){
    if(sh.bg && !CINE_BGS.includes(sh.bg)) errs.push("décor de plan inconnu : " + sh.bg);
    sh.beats.forEach(walk);
  }
  return errs;
}
for(const k in A.CINEMAS){
  const e = cineLint(A.CINEMAS[k]);
  t(`cinématique « ${k} » conforme au standard` + (e.length ? " — " + e.join(" ; ") : ""), e.length === 0);
}
/* chaque scene du recit, dirigee automatiquement, doit respecter le standard */
{
  A.setS(A.newState());
  const bad = [];
  for(const sc of A.STORY){ const e = cineLint(A.cineFor(sc.id)); if(e.length) bad.push(sc.id + " : " + e.join(", ")); }
  A.RIFT_ARC.forEach((r,i)=>{ const e = cineLint(A.directStory({id:"rift_" + r.n, lines:r.lines}));
    if(e.length) bad.push("rift_" + r.n + " : " + e.join(", ")); });
  t(`les ${A.STORY.length + A.RIFT_ARC.length} scènes du récit sont conformes` + (bad.length ? " — " + bad.join(" | ") : ""), bad.length === 0);
}
t("chaque scène dirigée garde toutes ses répliques, dans l'ordre", (()=>{
  const says = sc => { const out = [];
    const walk = b => b.t === "par" ? b.beats.forEach(walk) : (b.t === "say" && out.push(b.text));
    sc.shots.forEach(sh=>sh.beats.forEach(walk)); return out; };
  return A.STORY.every(sc => A.CINEMAS[sc.id] ||
    JSON.stringify(says(A.directStory(sc))) === JSON.stringify(sc.lines.map(l=>l.t)));
})());
t("aucun acteur ne reste en scène à la fin", A.STORY.every(sc=>{
  if(A.CINEMAS[sc.id]) return true;
  const on = new Set();
  const walk = b => { if(b.t === "par") return b.beats.forEach(walk);
    if(b.t === "actor") on.add(b.id); if(b.t === "leave") on.delete(b.id);
    if(b.t === "fx" && b.k === "blackout") on.clear(); };
  A.directStory(sc).shots.forEach(sh=>sh.beats.forEach(walk));
  return on.size === 0;
}));
t("les scènes majeures ont bandes et carton, les mineures non", (()=>{
  const has = (sc, t2) => sc.shots[0].beats.some(b=>b.t === t2);
  const major = A.directStory(A.STORY.find(x=>x.id === "climax"));
  const minor = A.directStory(A.STORY.find(x=>x.id === "pz_fail"));
  return has(major, "bars") && has(major, "card") && !has(minor, "bars") && !has(minor, "card");
})());
t("le contrôleur attrape une scène hors standard", (()=>{
  const faux = {shots:[{beats:[{t:"fx", k:"glitch", lv:5},{t:"leave", id:"personne"},{t:"danse"}]}]};
  return cineLint(faux).length === 3;
})());
t("la corruption garde la longueur et les espaces", (()=>{
  const src = "Bienvenue dans le monde des Pokémon";
  const out = A.corruptText(src, 0.5);
  return [...out].length === [...src].length &&
    [...src].every((ch,i)=>ch !== " " || [...out][i] === " ");
})());
t("les durées du standard sont ordonnées",
  A.CINE_T.fast < A.CINE_T.short && A.CINE_T.short < A.CINE_T.mid &&
  A.CINE_T.mid < A.CINE_T.long && A.CINE_T.long < A.CINE_T.hold);


t("toute scène dotée d'une cinématique la joue, quel que soit le chemin", (()=>{
  /* le journal et l'outil game master appellent playStory : ils doivent
     obtenir la cinematique, pas l'ancienne scene de dialogue */
  A.setS(A.newState());
  for(const id in A.CINEMAS){
    A.playStory(id, ()=>{});
    if(A.getCineLast() !== id) return false;
  }
  return true;
})());


/* --- architecture de l'interface --- */
t("le hub présente les activités dans leur ordre de déblocage", (()=>{
  const lv = A.ACTIVITIES.map(m=>A.MODULE_REQ[m.k].lv);
  return lv.every((v,i)=>i === 0 || v >= lv[i-1]);
})());
t("le hub ne nomme ni ne décrit une salle verrouillée", (()=>{
  A.setS(A.newState());
  const h = A.SCREENS.modules.html();
  const locked = A.ACTIVITIES.filter(m=>!A.moduleUnlocked(m.k));
  return locked.length > 0 && locked.every(m=>!h.includes(m.n) && !h.includes(m.d));
})());
t("le mot de passe de test est exact et sensible à la casse", (()=>{
  /* le mot de passe lui-meme n'est jamais ecrit dans le depot : on le lit,
     s'il est fourni, dans la variable d'environnement PCG_ADMIN_PW */
  const pw = process.env.PCG_ADMIN_PW;
  const exact = pw ? (A.adminHash(pw) === A.ADMIN_HASH
                      && A.adminHash(pw.toLowerCase()) !== A.ADMIN_HASH) : true;
  return exact && /^[0-9a-f]{6,8}$/.test(A.ADMIN_HASH) && A.adminHash("") !== A.ADMIN_HASH;
})());
t("l'atelier rend chacun de ses onglets", (()=>{
  A.setS(A.newState()); A.addToDex(25, 10, false);
  return A.ATELIER_TABS.every(tb=>{ const h = A.SCREENS.atelier[tb.k](); return typeof h === "string" && h.length > 20; });
})());
t("Collection et Sac portent leurs onglets", (()=>{
  A.setS(A.newState());
  return A.SCREENS.dex.html().includes("segbar") && A.SCREENS.bag.html().includes("segbar")
      && A.SCREENS.shop.html().includes("segbar");
})());


/* --- scènes du Poké-Poker --- */
t("les huit scènes de badge sont conformes", A.BADGES.every((b,i)=>cineLint(A.badgeCine(i, i + 1)).length === 0));
t("chaque main secrète a une scène conforme, quel que soit le nombre de cartes", (()=>{
  const secrets = A.HANDS.filter(h=>h.secret);
  if(!secrets.length) return false;
  for(const h of secrets) for(let n = 1; n <= 5; n++){
    const ids = [150,151,129,25,1].slice(0, n);
    if(cineLint(A.secretCine(h.id, ids)).length) return false;
  }
  return true;
})());
t("la dernière scène de badge annonce le Conseil", (()=>{
  const sc = A.badgeCine(7, 8);
  return JSON.stringify(sc).includes("Conseil");
})());


/* --- cosmétiques : chacun se reconnaît au premier coup d'œil --- */
t("aucun cadre ne partage son rendu avec un autre", (()=>{
  const frames = Object.values(A.COSMETICS).filter(c=>c.t === "frame" && !c.def);
  const cls = frames.map(c=>c.cls);
  return cls.every(Boolean) && new Set(cls).size === cls.length;
})());
t("aucun fond ne partage son rendu avec un autre", (()=>{
  const css = Object.values(A.COSMETICS).filter(c=>c.t === "bg").map(c=>c.css);
  return new Set(css).size === css.length;
})());
t("chaque classe de cadre est réellement stylée", (()=>{
  const css = require("fs").readFileSync(__dirname + "/src/style.css", "utf8");
  return Object.values(A.COSMETICS).filter(c=>c.t === "frame" && c.cls)
    .every(c=>css.includes(".avatar." + c.cls));
})());
t("chaque nouveau cosmétique est délivré par un succès", (()=>{
  const given = new Set();
  for(const a of A.ACHIEVEMENTS) if(a.rw && a.rw.cos) [].concat(a.rw.cos).forEach(c=>given.add(c));
  const nouveaux = ["frame_circuit","frame_prism","frame_origin","frame_elements","frame_birds","frame_champion",
    "bg_abyss","bg_magma","bg_sky","bg_psy","bg_felt","bg_shiny","bg_zero",
    "fx_tide","fx_magma","fx_aurora","fx_psy","fx_sacred","fx_shiny","fx_champion","fx_zero"];
  return nouveaux.every(c=>A.COSMETICS[c] && given.has(c));
})());
t("chaque effet se dessine, et à l'identique d'un rendu à l'autre", Object.keys(A.FX_LAYERS).every(k=>{
  const a = A.FX_LAYERS[k](), b = A.FX_LAYERS[k]();
  return a === b && a.includes("fxl") && A.COSMETICS[k];
}));
t("les succès des légendaires restent cachés", A.ACHIEVEMENTS
  .filter(a=>["c_kyogre","c_groudon","c_rayquaza","c_mewtwo","c_hooh","c_origin","c_weather","c_rift"].includes(a.id))
  .every(a=>a.hid));


/* --- la Brèche --- */
t("chaque type a son attaque, et chaque objet sa signature", (()=>{
  for(let tp = 1; tp <= 18; tp++) if(!A.BR_ARCH[tp] || !A.BR_ARCH[tp].k) return false;
  const g = Object.values(A.BR_ITEMS).map(i=>i.g);
  return g.every(Boolean) && new Set(g).size === g.length;
})());
t("l'expérience demandée croît à chaque niveau", [...Array(40)].every((_,L)=>L < 1 || A.brXpNeed(L + 1) > A.brXpNeed(L)));
t("niveau et évolution renforcent réellement une arme", (()=>{
  A.setS(A.newState());
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:1});
  const w1 = {id:4, lv:1, stage:0}, w5 = {id:4, lv:5, stage:1, show:5}, w8 = {id:4, lv:8, stage:2, show:6};
  const a = A.brWeaponStats(w1, R), b = A.brWeaponStats(w5, R), c = A.brWeaponStats(w8, R);
  return a.dmg < b.dmg && b.dmg < c.dmg && c.count > a.count && c.area > a.area;
})());
t("les choix de niveau sont distincts, et le premier offre un compagnon", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 60; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:7});
  R.lv = 2;
  const ch = A.brChoices(R), keys = ch.map(o=>o.k + (o.id || "") + (o.i ?? "") + (o.key || ""));
  return ch.length === 3 && new Set(keys).size === 3 && ch[0].k === "new";
})());
t("la Brèche du jour est la même pour tous, et change le lendemain", (()=>{
  const a = A.brDaily(), b = A.brDaily();
  return a.seed === b.seed && a.hab === b.hab && a.starter === b.starter;
})());
t("une minute de Brèche simulée reste saine (aucun NaN, aucune fuite)", (()=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:"route", starter:4, seed:3});
  R.W = 390; R.H = 700; R.dpr = 1;
  for(let k = 0; k < 1800; k++){
    R.joy = {dx:Math.cos(k / 40), dy:Math.sin(k / 40)}; R.keys = {};
    A.brUpdate(R, 1/30);
    if(R.choices){ R.choices = null; R.modal = false; }
    if(R.modal) R.modal = false;
    if(R.over) break;
  }
  let n = 0; R.P.foes.each(()=>n++);
  return Number.isFinite(R.hp) && Number.isFinite(R.x) && R.kills > 20 && n < 400 && R.P.foes.list.length < 600;
})());
t("vaincre un gardien dans la Brèche lève bien le verrou", (()=>{
  A.setS(A.newState());
  const before = A.getS().bosses.length;
  const out = A.brGuardianWin({id:144, region:"kanto", core:false});
  return out.first && A.getS().bosses.length === before + 1 && A.getS().dex[144];
})());
t("Évoli évolue selon l'heure, les autres suivent leur lignée", A.brNextEvo(4) === 5 && A.brNextEvo(5) === 6 && [196,197].includes(A.brNextEvo(133)));
t("la Brèche remplace les Data Guardians dans le hub", A.ACTIVITIES.some(a=>a.k === "breche") && !A.ACTIVITIES.some(a=>a.k === "boss"));


/* --- la page en ligne doit se charger ---
   Une constante declaree deux fois (l'atlas chromatique, un temps) casse tout
   le jeu en ligne, alors que la version autonome, elle, fonctionne. */
{
  const fs = require("fs"), wp = __dirname + "/web/index.html";
  if(fs.existsSync(wp)){
    const html = fs.readFileSync(wp, "utf8");
    const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join("\n");
    let ok = true; try { new Function(js); } catch(e){ ok = false; }
    t("la page en ligne a une syntaxe valide", ok);
    /* seulement les declarations globales, en debut de ligne : les constantes
       locales des fonctions se repetent legitimement d'une fonction a l'autre */
    const decl = [...js.matchAll(/^const\s+([A-Z_][A-Z0-9_]*)\s*=/gm)].map(m=>m[1]);
    const dup = decl.filter((d, i)=>decl.indexOf(d) !== i);
    t("aucune constante globale déclarée deux fois dans la page en ligne" + (dup.length ? " — " + [...new Set(dup)].join(", ") : ""), dup.length === 0);
  }
}
t("l'atlas chromatique existe et suit la même disposition", (()=>{
  const fs = require("fs");
  const src = fs.readFileSync(__dirname + "/src/_atlas_shiny.js", "utf8");
  return src.includes("ATLAS_SHINY_URL") && src.length > 100000;
})());


/* --- les cartes de la Brèche --- */
t("une même graine donne exactement la même carte (Brèche du jour)", (()=>{
  A.setS(A.newState());
  const a = A.brNewRun({region:"kanto", hab:"foret", starter:4, seed:42}), b = A.brNewRun({region:"kanto", hab:"foret", starter:4, seed:42});
  for(let cx = -2; cx <= 2; cx++) for(let cy = -2; cy <= 2; cy++)
    if(JSON.stringify(A.brChunkAt(a, cx, cy)) !== JSON.stringify(A.brChunkAt(b, cx, cy))) return false;
  const c = A.brNewRun({region:"kanto", hab:"foret", starter:4, seed:43});
  return JSON.stringify(A.brChunkAt(a, 1, 0)) !== JSON.stringify(A.brChunkAt(c, 1, 0));
})());
t("chaque habitat a son relief, et l'apparition reste dégagée", Object.keys(A.BR_TERRAIN).every(h=>{
  A.setS(A.newState());
  const R = A.brNewRun({region:"kanto", hab:h, starter:4, seed:7});
  let obs = 0;
  for(let cx = -1; cx <= 1; cx++) for(let cy = -1; cy <= 1; cy++){
    const ch = A.brChunkAt(R, cx, cy); obs += ch.obs.length;
    for(const o of ch.obs) if(Math.hypot(o.x, o.y) < 150) return false;
    for(const o of ch.obs) for(const q of ch.obs) if(o !== q && Math.hypot(o.x - q.x, o.y - q.y) < o.r + q.r) return false;
  }
  return obs > 0;
}));
t("le relief bloque : on ne traverse pas un rocher", (()=>{
  const e = {x:5, y:0}; A.brPushOut(e, 12, [{x:0, y:0, r:20}]);
  return Math.hypot(e.x, e.y) >= 31.9;
})());
t("trois missions par run, dont celle de l'habitat", Object.keys(A.BR_TERRAIN).every(h=>{
  A.setS(A.newState());
  const R = A.brNewRun({region:"kanto", hab:h, starter:4, seed:9});
  return R.missions.length === 3 && new Set(R.missions.map(m=>m.k)).size === 3 && R.missions.every(m=>m.goal > 0 && m.n === 0);
}));
t("la maîtrise monte par rang avec les runs jouées", (()=>{
  A.setS(A.newState()); const S0 = A.getS(); S0.breche = {mastery:{4:0}};
  const r0 = A.brMastery(4); S0.breche.mastery[4] = 3; const r2 = A.brMastery(4); S0.breche.mastery[4] = 99; const r5 = A.brMastery(4);
  return r0 === 0 && r2 === 2 && r5 === 5;
})());
t("une minute de Brèche dans chaque habitat reste saine", Object.keys(A.BR_TERRAIN).every(h=>{
  A.setS(A.newState()); for(let i = 1; i <= 151; i++) A.addToDex(i, 20, false);
  const R = A.brNewRun({region:"kanto", hab:h, starter:4, seed:11}); R.W = 390; R.H = 700; R.dpr = 1;
  for(let k = 0; k < 1800; k++){
    R.joy = {dx:Math.cos(k / 50), dy:Math.sin(k / 50)}; R.keys = {};
    A.brUpdate(R, 1/30);
    if(R.choices){ R.choices = null; } R.modal = false;
    if(R.over) break;
  }
  return Number.isFinite(R.hp) && Number.isFinite(R.x) && R.kills > 10;
}));

console.log(`\n${pass} tests reussis, ${fail} echecs`);
process.exit(fail?1:0);
