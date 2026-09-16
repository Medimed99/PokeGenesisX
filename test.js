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
const ORDER = ['_dexblob.js','_atlas.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js',
  '35-modules.js','40-battle.js','50-expedition.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','78-milestones.js','80-guide.js','85-journal.js','90-admin.js','95-online.js','99-boot.js'];
const code = ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n");
eval(code + "\n;" + 'global.__api={POKE,POKE_IDS,evalHand,genMap,EXP_ROWS,deepFill,newState,catchChance,typeMult,RARITY,ACHIEVEMENTS,JOKERS,STORY,anteTarget,makeFighter,damageCalc,xpForLevel,handBase,HANDS,newDeck,movesFor,dexTotal,famOf,stageOf,DIRECTIVES,INFOS,TUTOS,PZ_EVENTS,atlasIndex,ATLAS_N,ATLAS_BACK0,SLUGS,cardChips,grantCardV,grantSecretCard,cardVariants,cardHas,cardOwnedCount,cardTotal,CARD_MONS,CARD_SERIES_DEF,CARD_ORDER,rollCardSeries,randomCard,migrateCards,CARD_INDEX,setBuddy,buddyTick,buddyTier,buddyBonus,buddy,rollWeekly,weeklyTick,weeklyRollover,openChest,WEEKLY_POOL,BUDDY_FINDS,BUDDY_MAX_TIER,BUDDY_TIER_AFF,CHESTS,addToDex,weekKey,aimBonus,BOOSTS,startBoost,boostActive,LUCKY_DAYS,rollLuckyDay,luckyF,TREASURES,rollTreasure,treasureValue,REGION_TIERS,checkRegionTiers,regionTiersDone,rollContract,contractTick,CONTRACTS,CYCLE_MODS,PERKS,cycleReward,perkLv,loreOf,LORE,PZ_EMOS,pzMood,HELD_ITEMS,grantHeld,heldActive,PLANETS,SPECTRALS,QUEST_POOLS,questMix,rollQuests,setS:function(v){S=v},getS:function(){return S},setENC:function(v){ENC=v}};');
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
t("19 combinaisons definies", A.HANDS.length===19, A.HANDS.length);
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
t("23 scenes narratives", A.STORY.length===23, A.STORY.length);
t("42 succes", A.ACHIEVEMENTS.length===42, A.ACHIEVEMENTS.length);
t("28 programmes", A.JOKERS.length===28, A.JOKERS.length);
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

console.log(`\n${pass} tests reussis, ${fail} echecs`);
process.exit(fail?1:0);
