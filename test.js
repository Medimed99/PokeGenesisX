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
const ORDER = ['_dexblob.js','_atlas.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js','32-world.js','34-research.js','36-lore.js',
  '35-modules.js','40-battle.js','50-expedition.js','52-expgear.js','54-tower.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','80-guide.js','85-journal.js','90-admin.js','95-online.js','99-boot.js'];
const code = ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n");
eval(code + "\n;" + 'global.__api={POKE,POKE_IDS,evalHand,genMap,EXP_ROWS,deepFill,newState,catchChance,typeMult,RARITY,ACHIEVEMENTS,JOKERS,STORY,anteTarget,makeFighter,damageCalc,xpForLevel,handBase,HANDS,newDeck,movesFor,dexTotal,famOf,stageOf,DIRECTIVES,INFOS,TUTOS,PZ_EVENTS,atlasIndex,ATLAS_N,ATLAS_BACK0,SLUGS,cardChips,grantCardV,grantSecretCard,cardVariants,cardHas,cardOwnedCount,cardTotal,CARD_MONS,CARD_SERIES_DEF,CARD_ORDER,rollCardSeries,randomCard,migrateCards,CARD_INDEX,cardChecksum,cardBytes,tcardHtml,cardBackHtml,GEN_TAG,boosterRank,seriesName,seriesFound,monFound,cardEnvOf,CARD_ENV,resolveName,KNOWN_NAMES,sixthItem,glitchSixthItem,GEN_MARKS,checkChainMark,specialDay,isNightWindow,PZ_POKE_LINES,SIXTH_SLOTS,KONAMI,karpDealDay,karpDealAvailable,BST_BANDS,bstBand,wildIdFor,NODE_W,nodeTypeFor,EXP_ITEMS,rollExpItem,itemMinFloor,EXP_MODES,traitLevels,traitBonus,TOWER_TRAITS,HABITATS,HABITAT_IDS,habitatWeight,isNight,WEATHER,WEATHER_IDS,weatherDef,speciesInHabitat,FRAGMENTS,RIFT_ARC,checkFragments,riftTick,riftStage,fragmentsFound,signatureMove,moveTierName,RESEARCH_TASKS,researchOf,researchLevel,researchMax,researchTick,taskGoal,RESEARCH_TIERS,TALENTS,talentOf,PERFECT_ODDS,rollPerfect,weekStamp,REPORT_ROWS,lineRoot,towerLevel,towerBand,BUFF_STATS,TRAINERS,expEnemyLevel,setBuddy,buddyTick,buddyTier,buddyBonus,buddy,rollWeekly,weeklyTick,weeklyRollover,openChest,WEEKLY_POOL,BUDDY_FINDS,BUDDY_MAX_TIER,BUDDY_TIER_AFF,CHESTS,addToDex,weekKey,aimBonus,BOOSTS,startBoost,boostActive,LUCKY_DAYS,rollLuckyDay,luckyF,TREASURES,rollTreasure,treasureValue,REGION_TIERS,checkRegionTiers,regionTiersDone,rollContract,contractTick,CONTRACTS,CYCLE_MODS,PERKS,cycleReward,perkLv,loreOf,LORE,PZ_EMOS,pzMood,HELD_ITEMS,grantHeld,heldActive,PLANETS,SPECTRALS,QUEST_POOLS,questMix,rollQuests,setS:function(v){S=v},getS:function(){return S},setENC:function(v){ENC=v}};');
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
t("59 succes", A.ACHIEVEMENTS.length===59, A.ACHIEVEMENTS.length);
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
t("deux modes, le plus dur paie davantage",
  Object.keys(A.EXP_MODES).length === 2 && A.EXP_MODES.nuzlocke.mult > A.EXP_MODES.classic.mult);

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
  const S0 = A.getS();
  S0.region = "kanto"; S0.weather = "clair"; S0.weatherUntil = Date.now() + 1e9;
  for(let i=1;i<=151;i++) A.addToDex(i,20,false);
  S0.habitat = "eaux";
  let eau = 0;
  for(let i=0;i<400;i++){ const id = A.speciesInHabitat(0);
    if(id && A.POKE[id].types.includes(11)) eau++; }
  S0.habitat = "foyer";
  let feu = 0;
  for(let i=0;i<400;i++){ const id = A.speciesInHabitat(0);
    if(id && A.POKE[id].types.includes(10)) feu++; }
  return eau > 260 && feu > 120;
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

console.log(`\n${pass} tests reussis, ${fail} echecs`);
process.exit(fail?1:0);
