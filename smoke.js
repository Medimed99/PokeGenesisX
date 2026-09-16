/* --- DOM simule : suffisant pour executer tout le rendu --- */
const noop=()=>{};
function El(id){ return {id, style:{setProperty:noop,display:""}, classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop, remove:noop, removeChild:noop, querySelectorAll:()=>[], insertBefore:noop,
  set innerHTML(v){ this._h=String(v); }, get innerHTML(){ return this._h||""; },
  textContent:"", value:"", dataset:{}, children:[], firstChild:null, scrollTop:0, scrollHeight:0,
  select:noop, focus:noop, onclick:null, className:"", disabled:false, checked:false,
  setAttribute:noop, getAttribute:()=>null, removeAttribute:noop, addEventListener:noop, offsetWidth:100,
  getBoundingClientRect:()=>({left:0,top:0,width:120,height:120,right:120,bottom:120})}; }
global.document={addEventListener:noop, getElementById:id=>El(id), createElement:()=>El("x"),
  documentElement:{style:{setProperty:noop}}, head:{appendChild:noop}, body:El("body"),
  readyState:"complete", querySelectorAll:()=>[], querySelector:()=>null, execCommand:noop, hidden:false};
global.window={addEventListener:noop}; global.requestAnimationFrame=f=>{f();return 0};
global.navigator={};
global.URL={createObjectURL:()=>""}; global.Blob=function(){};
global.setTimeout=()=>0; global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;

const fs=require("fs");
const ORDER=['_dexblob.js','_atlas.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js',
 '35-modules.js','40-battle.js','50-expedition.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','78-milestones.js','80-guide.js','85-journal.js','90-admin.js','95-online.js','99-boot.js'];
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n") + "\n;global.G=" +
  JSON.stringify(null) + "||{};" +
  "G.api={newState:newState,setS:v=>S=v,getS:()=>S,SCREENS:SCREENS,ACTIONS:ACTIONS,newEncounter:newEncounter," +
  "onCatch:onCatch,onFail:onFail,getENC:()=>ENC,setENC:v=>ENC=v,dailyRollover:dailyRollover,POKE:POKE," +
  "addToDex:addToDex,startPoker:startPoker,pkStartRound:pkStartRound,pkPlay:pkPlay,pkToggle:pkToggle," +
  "pkScore:pkScore,pkRollShop:pkRollShop,JOKERS:JOKERS,BOOSTERS:BOOSTERS,LICENCES:LICENCES,HANDS:HANDS,pkRenderLive:pkRenderLive,skipResolve:skipResolve,commitResolve:commitResolve," +
  "startExpedition:startExpedition,expRest:expRest,expTreasure:expTreasure,expShop:expShop,expEvent:expEvent," +
  "genMap:genMap,createBattle:createBattle,makeFighter:makeFighter,renderArena:renderArena,teamPicker:teamPicker," +
  "checkAchievements:checkAchievements,rollQuests:rollQuests,claimQuest:claimQuest,claimLogin:claimLogin," +
  "grantCardV:grantCardV,grantSecretCard:grantSecretCard,cardVariants:cardVariants,cardHas:cardHas,cardOwnedCount:cardOwnedCount,cardTotal:cardTotal,CARD_MONS:CARD_MONS,CARD_SERIES_DEF:CARD_SERIES_DEF,CARD_ORDER:CARD_ORDER,rollCardSeries:rollCardSeries,randomCard:randomCard,migrateCards:migrateCards,CARD_INDEX:CARD_INDEX,dexTotal:dexTotal,REGIONS:REGIONS,ownedSorted:ownedSorted,canEvolve:canEvolve," +
  "setFilter:(r,m)=>{DEX_FILTER.region=r;DEX_FILTER.mode=m},setShopCat:c=>SHOP_CAT=c,setProfTab:t=>PROF_TAB=t," +
  "setScreen:n=>currentScreen=n,STORY:STORY,playStory:playStory,BOSS_BLINDS:BOSS_BLINDS,tutoMaybe:tutoMaybe,startTuto:startTuto,guideTick:guideTick,DIRECTIVES:DIRECTIVES,TUTOS:TUTOS,INFOS:INFOS,pzTalk:pzTalk,directiveCard:directiveCard,tcardHtml:tcardHtml,infoBtn:infoBtn,setBuddy:setBuddy,buddyStrip:buddyStrip,buddyTick:buddyTick,buddyTier:buddyTier,weeklyPanel:weeklyPanel,rollWeekly:rollWeekly,openChest:openChest,revealSheet:revealSheet,CHESTS:CHESTS,ownedSorted2:ownedSorted};");
const A=G.api;
let saveFails=0; const _warn=console.warn; console.warn=(...a)=>{ if(String(a[0]).includes("sauvegarde")) saveFails++; };
let pass=0,fail=0,errs=[];
const t=(n,fn)=>{ try{ fn(); pass++; }catch(e){ fail++; errs.push(n+" -> "+e.message); } };

/* 1. partie neuve */
A.setS(A.newState()); A.dailyRollover();
let S0=A.getS();

/* 2. boucle de capture : 600 rencontres */
t("600 rencontres + captures sans erreur", ()=>{
  for(let i=0;i<600;i++){
    A.newEncounter();
    const e=A.getENC();
    if(e.missing){ A.setENC(null); continue; }
    if(i%7===0){ A.onFail("poke"); }
    else { A.onCatch(i%23===0?"data":"poke"); }
    if(!A.getENC()) A.newEncounter();
  }
});
S0=A.getS();
if(S0.stats.catches<300) { fail++; errs.push("trop peu de captures: "+S0.stats.catches); } else pass++;
if(!(S0.integrity>0 && S0.integrity<=100)) { fail++; errs.push("integrite hors bornes: "+S0.integrity); } else pass++;
if(S0.level<2){ fail++; errs.push("pas de montee de niveau"); } else pass++;

/* 3. debloquer tout pour tester les ecrans avances */
S0.level=30; S0.coins=999999; S0.shards=9999; S0.cores=99;
for(let i=1;i<=386;i++) if(A.POKE[i] && !A.POKE[i].leg) A.addToDex(i, 40, i%50===0);
S0.bosses=["kanto:146","kanto:144","kanto:150","johto:243","johto:250","johto:249"];
S0.team=A.ownedSorted().slice(0,3);
A.grantCardV('g3',150); A.grantCardV('g2',249);
A.checkAchievements();

/* 4. rendu de tous les ecrans */
const screens=Object.keys(A.SCREENS).filter(k=>!k.startsWith("_"));
for(const k of screens){
  t("rendu <"+k+">", ()=>{
    A.setScreen(k);
    const h=A.SCREENS[k].html(null);
    if(typeof h!=="string"||h.length<5) throw new Error("html vide");
    if(/undefined|\[object Object\]|NaN/.test(h)) throw new Error("sortie suspecte: "+
      (h.match(/.{0,40}(undefined|\[object Object\]|NaN).{0,40}/)||[""])[0]);
    if(A.SCREENS[k].after) A.SCREENS[k].after(document.getElementById("screen"), null);
  });
}
/* variantes de filtres */
for(const r of ["kanto","johto","hoenn"]) for(const m of ["all","owned","missing","shiny"])
  t("dex "+r+"/"+m, ()=>{ A.setFilter(r,m); A.SCREENS.dex.html(); });
for(const c of ["balls","berries","items","stones","chests","cos"])
  t("boutique "+c, ()=>{ A.setShopCat(c); A.SCREENS.shop.html(); });
for(const tb of ["stats","ach","cards","cos","set"])
  t("profil "+tb, ()=>{ A.setProfTab(tb); A.SCREENS.profile.html(); });

/* 5. scenes narratives */
for(const sc of A.STORY) t("scene "+sc.id, ()=>{ A.playStory(sc.id); });

/* 6. Poke-Poker : une partie complete simulee */
t("poker : 40 manches simulees", ()=>{
  A.startPoker();
  const P=A.getS().poker;
  for(let round=0;round<40 && P.ante<=10;round++){
    A.pkStartRound();
    let guard=0;
    while(P.state==="play" && guard++<30){
      P.sel=[];
      const n=Math.min(5,P.hand.length);
      for(let i=0;i<n;i++) A.pkToggle(P.hand[i].u);
      const sc=A.pkScore(true);
      if(!sc || typeof sc.total!=="number" || isNaN(sc.total)) throw new Error("score invalide");
      if(!sc.handName) throw new Error("combinaison sans nom");
      if(!sc.steps || !sc.steps.length) throw new Error("trace de resolution vide");
      A.pkPlay();
      /* la resolution est animee : on la deroule immediatement dans les tests */
      if(P.state==="resolve"){ A.skipResolve(); A.commitResolve(); }
      if(P.state==="resolve") throw new Error("resolution bloquee");
    }
    if(P.state==="over") break;
    A.pkRollShop();
    if(!P.shop.jokers || !P.shop.boosters) throw new Error("cache incomplete");
    if(P.jokers.length<5){ const j=A.JOKERS[round%A.JOKERS.length]; P.jokers.push({id:j.id,mem:0,uses:0}); }
    P.blind++; if(P.blind>2){ P.blind=0; P.ante++; }
    P.state="blind";
    A.SCREENS.poker.html();
    P.state="shop"; A.SCREENS.poker.html(); P.state="blind";
  }
});
t("la resolution produit une trace ordonnee", ()=>{
  const P=A.getS().poker;
  P.state="play"; A.pkStartRound();
  P.sel=P.hand.slice(0,5).map(c=>c.u);
  const r=A.pkScore(true);
  if(r.steps[0].kind!=="base") throw new Error("la main de base doit ouvrir la trace");
  const last=r.steps[r.steps.length-1];
  if(Math.abs(last.chips-r.chips)>0.5) throw new Error("jetons finaux incoherents");
  if(Math.abs(last.mult-r.mult)>0.01) throw new Error("multiplicateur final incoherent");
  if(!r.steps.every(st=>["base","card","joker","boss"].includes(st.kind)))
    throw new Error("type d'etape inconnu");
});
t("passer l'animation ne change pas le score", ()=>{
  const P=A.getS().poker;
  P.state="play"; A.pkStartRound();
  P.sel=P.hand.slice(0,5).map(c=>c.u);
  const attendu=A.pkScore(true).total;
  const avant=P.score;
  A.pkPlay(); A.skipResolve(); A.commitResolve();
  if(P.score-avant!==attendu && P.state!=="reward" && P.state!=="over")
    throw new Error("score applique different : "+(P.score-avant)+" vs "+attendu);
});
t("poker : les 28 programmes s'evaluent ensemble", ()=>{
  const P=A.getS().poker;
  P.state="play"; P.jokers=A.JOKERS.map(j=>({id:j.id,mem:2,uses:0}));
  A.pkStartRound();
  P.sel=P.hand.slice(0,5).map(c=>c.u);
  const sc=A.pkScore(true);
  if(!sc||isNaN(sc.total)) throw new Error("score NaN avec tous les programmes");
});
t("poker : les 12 verrous de secteur", ()=>{
  const P=A.getS().poker;
  for(const b of A.BOSS_BLINDS){
    P.boss=b; P.blind=2; A.pkStartRound();
    P.sel=P.hand.slice(0,5).map(c=>c.u);
    const sc=A.pkScore(true);
    if(!sc||isNaN(sc.total)||sc.total<0) throw new Error("verrou "+b.id);
    A.SCREENS.poker.html();
  }
});
t("poker : toutes les licences s'appliquent", ()=>{
  const P=A.getS().poker;
  for(const l of A.LICENCES){ l.f(P); }
  if(!isFinite(P.slots)||!isFinite(P.hands)||!isFinite(P.discards)) throw new Error("licence invalide");
});
t("poker : chaque booster propose un choix", ()=>{
  const P=A.getS().poker;
  P.octets=999; P.state="shop"; A.pkRollShop();
  for(const b of A.BOOSTERS){
    P.shop.boosters=[{id:b.id,cost:b.cost}];
    A.ACTIONS.pkbuyb({i:"0"});
    if(!P.pendingBooster || !P.pendingBooster.picks.length) throw new Error("booster vide: "+b.id);
    A.ACTIONS.pkpickb({id:String(P.pendingBooster.picks[0])});
  }
  if(P.deck.length < 52+A.BOOSTERS.length) throw new Error("deck non agrandi");
});
A.getS().poker=null;

/* 7. Expedition : parcours complet hors combats */
t("expedition : parcours des 12 etages", ()=>{
  A.startExpedition(A.getS().team.slice(0,3));
  const run=A.getS().expedition;
  A.SCREENS.expedition.html();
  let y=0, col=run.avail[0];
  while(y<12){
    const node=run.map[y][col];
    run.row=y; run.col=col; run.floor=y; node.done=true;
    if(node.t==="rest") A.expRest(run);
    else if(node.t==="treasure") A.expTreasure(run);
    else if(node.t==="shop"){ A.expShop(run); run.shopStock=null; }
    else if(node.t==="event"){ A.expEvent(run); const o=run._ev.opts[0].f(run); if(typeof o!=="string") throw new Error("event"); delete run._ev; }
    A.SCREENS.expedition.html();
    if(y===11) break;
    run.avail=node.next; col=node.next[0]; y++;
  }
  if(run.relics.length===undefined) throw new Error("reliques cassees");
});
A.getS().expedition=null;

/* 8. Combat de boss : creation + rendu */
t("combat : creation et rendu d'arene", ()=>{
  const allies=A.getS().team.slice(0,3).map(id=>A.makeFighter(id,45));
  const foe=A.makeFighter(150,58,{boost:1.4});
  A.createBattle(allies,[foe],{boss:{id:150},title:"TEST",onEnd:noop});
  A.renderArena();
  A.setScreen("battle"); A.SCREENS.battle.html(); A.SCREENS.battle.after();
});

/* 9. Evolution */
t("evolution : conditions verifiees", ()=>{
  const S=A.getS();
  S.dex[1]={c:9,s:0,lvl:40,shiny:false};
  const chk=A.canEvolve(1,A.POKE[1].evo[0]);
  if(!chk.ok) throw new Error("evolution bloquee a tort: "+chk.why);
  S.dex[1]={c:1,s:0,lvl:2,shiny:false};
  if(A.canEvolve(1,A.POKE[1].evo[0]).ok) throw new Error("evolution autorisee a tort");
});

/* 9b. Guidage */
t("directives : progression sequentielle", ()=>{
  const S=A.getS(); S.dirDone=[];
  /* on laisse assez de tours pour absorber les paliers de secteur qui
     se declenchent aussi sur un etat avance */
  let stable=0;
  for(let i=0;i<80 && stable<5;i++){
    const before=(S.dirDone||[]).length;
    A.guideTick();
    stable = (S.dirDone||[]).length===before ? stable+1 : 0;
  }
  if((S.dirDone||[]).length===0) throw new Error("aucune directive validee sur un etat avance");
  if(new Set(S.dirDone).size!==S.dirDone.length) throw new Error("directive validee deux fois");
});
t("tutoriels : declenchement unique", ()=>{
  const S=A.getS(); S.tutos=[];
  for(const k of Object.keys(A.TUTOS)){
    if(!A.tutoMaybe(k)) throw new Error("premier declenchement rate: "+k);
    if(A.tutoMaybe(k)) throw new Error("declenche deux fois: "+k);
  }
});
t("tutoriels : rendu sans cible presente", ()=>{
  for(const k of Object.keys(A.TUTOS)) A.startTuto(k);
});
t("carte de directive et fiches d'info se rendent", ()=>{
  const h=A.directiveCard();
  if(typeof h!=="string"||h.length<40) throw new Error("carte vide");
  for(const k of Object.keys(A.INFOS)) A.ACTIONS.info({k});
  A.pzTalk("test");
});

/* 9c. Compagnon, hebdomadaires, revelations */
t("bandeau compagnon : sans et avec", ()=>{
  A.getS().buddy=null;
  let h=A.buddyStrip();
  if(!h.includes("buddy-empty")) throw new Error("etat vide non rendu");
  A.setBuddy(A.ownedSorted2()[0]);
  h=A.buddyStrip();
  if(!h.includes("Affinité")) throw new Error("etat actif non rendu");
  for(let i=0;i<200;i++) A.buddyTick(2);
  if(!A.buddyStrip().length) throw new Error("rendu casse a haut palier");
});
t("panneau hebdomadaire se rend et se reclame", ()=>{
  A.rollWeekly();
  const W=A.getS().weekly;
  if(!A.weeklyPanel().includes("OBJECTIFS")) throw new Error("panneau vide");
  W.quests[0].prog=W.quests[0].goal;
  A.ACTIONS.claimwk({i:"0"});
  if(!W.quests[0].claimed) throw new Error("non reclame");
});
t("revelation : tous les coffres", ()=>{
  for(const k of Object.keys(A.CHESTS)){
    const items=A.openChest(k, true);
    A.revealSheet("TEST", items, {sub:"test"});
  }
});
t("ecran de capture avec compagnon", ()=>{
  A.setScreen("capture");
  const h=A.SCREENS.capture.html();
  if(!h.includes("buddy")) throw new Error("compagnon absent de l'ecran de capture");
});

/* 10. Quetes et connexion */
t("quetes et connexion", ()=>{
  A.rollQuests(); const S=A.getS();
  if(S.quests.length!==4) throw new Error("4 quetes attendues");
  S.quests[0].prog=S.quests[0].goal; A.claimQuest(0);
  if(!S.quests[0].claimed) throw new Error("quete non encaissee");
  S.login.claimed=""; if(!A.claimLogin()) throw new Error("connexion non encaissee");
});

if(saveFails){ fail++; errs.push("echecs de sauvegarde: "+saveFails); } else pass++;
console.log(errs.map(e=>"  ECHEC: "+e).join("\n"));
console.log(`\n${pass} verifications reussies, ${fail} echecs`);
process.exit(fail?1:0);
