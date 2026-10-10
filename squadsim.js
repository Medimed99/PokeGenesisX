/* Simulation d'expéditions complètes : taux de réussite par type de nœud,
   étage atteint, et part des runs qui vont au bout. */
const noop=()=>{};
function El(id){ return {id,style:{setProperty:noop,display:""},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,removeChild:noop,querySelectorAll:()=>[],insertBefore:noop,
  set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||""},
  textContent:"",value:"",dataset:{},children:[],firstChild:null,firstElementChild:null,scrollTop:0,scrollHeight:0,
  select:noop,focus:noop,onclick:null,className:"",disabled:false,setAttribute:noop,getAttribute:()=>null,
  removeAttribute:noop,addEventListener:noop,offsetWidth:100,
  getBoundingClientRect:()=>({left:0,top:0,width:120,height:120})}; }
global.document={addEventListener:noop,getElementById:id=>El(id),createElement:()=>El("x"),
  documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El("body"),readyState:"complete",
  querySelectorAll:()=>[],querySelector:()=>null,execCommand:noop,hidden:false};
global.window={addEventListener:noop}; global.navigator={}; global.Image=function(){};
global.requestAnimationFrame=f=>0; global.URL={createObjectURL:()=>""}; global.Blob=function(){};
const Q=[]; global.setTimeout=f=>{Q.push(f);return Q.length;}; global.setInterval=()=>0;
global.clearInterval=noop; global.clearTimeout=noop;
function drain(max){ let n=0; while(Q.length && n++<max){ (Q.shift())(); } return n; }

const fs=require("fs");
const ORDER=fs.readFileSync('build.py','utf8').match(/ORDER = \[([\s\S]*?)\]/)[1]
  .split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n") +
 "\n;global.G={newState:newState,setS:v=>S=v,getS:()=>S,addToDex:addToDex,ownedSorted:ownedSorted," +
 "startExpedition:startExpedition,enemyTeamFor:enemyTeamFor,runFighter:runFighter,createBattle:createBattle," +
 "doTurn:doTurn,getB:()=>BATTLE,healTeam:healTeam,grantRelic:grantRelic,EXP_ROWS:EXP_ROWS," +
 "newRunMon:newRunMon,randomWildId:randomWildId,relicVal:relicVal,wildIdFor:wildIdFor," +
 "draftPool:draftPool,bstBand:bstBand,NODE_TYPES:NODE_TYPES," +
 "expEnemyLevel:expEnemyLevel,NODE_TYPES:NODE_TYPES,genMap:genMap,makeFighter:makeFighter,POKE:POKE,openSector:openSector,expGainLevels:expGainLevels,EXP_GAIN:EXP_GAIN,MAP_ROWS:MAP_ROWS,expFloorOf:expFloorOf,RELICS:RELICS};");

eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n") +
 "\n;global.G={newState:newState,setS:v=>S=v,getS:()=>S,addToDex:addToDex,POKE:POKE,POKE_IDS:POKE_IDS,sqNewBattle:sqNewBattle,sqNext:sqNext,sqTurnStart:sqTurnStart,sqAct:sqAct,sqSkip:sqSkip,sqAI:sqAI,sqStageLevel:sqStageLevel,SQ_ZONES:SQ_ZONES,SQ_STAGES:SQ_STAGES,sqStarsFor:sqStarsFor,minLevelOf:minLevelOf,REGIONS:REGIONS,sqLockWaves:sqLockWaves,guardianLevel:sqLockLevel,sqState:sqState,lineRoot:lineRoot,typeMult:typeMult};");
/* une equipe plausible pour un niveau : des especes qu'on peut avoir a ce niveau */
function teamFor(L){
  let pool=G.POKE_IDS.filter(i=>!G.POKE[i].leg && i<=251 && G.minLevelOf(i)<=L && G.minLevelOf(i)>=L-25);
  if(pool.length<8) pool=G.POKE_IDS.filter(i=>!G.POKE[i].leg && i<=251 && G.minLevelOf(i)<=L).sort((a,b)=>G.minLevelOf(b)-G.minLevelOf(a)).slice(0,40);
  const t=[]; while(t.length<4){ const id=pool[Math.floor(Math.random()*pool.length)]; if(!t.includes(id)) t.push(id); }
  return t;
}
function play(z,s,L,lock,slv){
  G.setS(G.newState());
  let ids=teamFor(L);
  if(lock && SMART){ const gt=G.POKE[lock.r.guardians[lock.i].id].types;
    let pool=G.POKE_IDS.filter(i=>!G.POKE[i].leg && i<=251 && G.minLevelOf(i)<=L && G.minLevelOf(i)>=L-30);
    const sc=i=>Math.max(...G.POKE[i].types.map(t=>G.typeMult(t,gt)))*2 + G.POKE[i].bst/300;
    if(pool.length<14) pool=G.POKE_IDS.filter(i=>!G.POKE[i].leg && i<=251 && G.minLevelOf(i)<=L);
    pool.sort((a,b)=>sc(b)-sc(a)); pool=pool.slice(0,14); ids=[];
    while(ids.length<4){ const id=pool[Math.floor(Math.random()*pool.length)]; if(!ids.includes(id)) ids.push(id); } }
  for(const id of ids) G.addToDex(id,L,false);
  if(slv) for(const id of ids) G.sqState().sk[G.lineRoot(id)]=[slv,slv,slv];
  const B=lock?G.sqNewBattle(ids,0,6,{waves:G.sqLockWaves(lock.r,lock.i),lock:{r:lock.r.key,i:lock.i}}):G.sqNewBattle(ids,z,s); let guard=0;
  while(!B.over && guard++<800){
    const u=G.sqNext(B); if(!u) break;
    G.sqTurnStart(B,u);
    if(u.hp<=0){ continue; }
    if(u.stunned){ G.sqSkip(B,u); continue; }
    const a=G.sqAI(B,u); G.sqAct(B,u,a.si,a.ti);
  }
  return {win:!!B.result, turns:B.turn, stars:G.sqStarsFor(B)};
}
const off=+(process.argv[2]||3);
const SMART=process.argv[5]==="smart";
if(process.argv[3]==="locks"){
  const slv=+(process.argv[4]||2);
  console.log("VERROUS — 60 combats auto, equipe au niveau du verrou +"+off+", competences niv."+slv+"\n");
  for(const r of G.REGIONS) r.guardians.forEach((g,i)=>{
    const L=G.guardianLevel(r,i)+off; let w=0,t=0,ph=0;
    for(let k=0;k<60;k++){ const x=play(0,0,L,{r,i},slv); if(x.win) w++; t+=x.turns; }
    console.log((r.name+" "+g.name).padEnd(20), "niv."+L, String(Math.round(w/60*100)).padStart(3)+"%", (t/60).toFixed(0)+" tours");
  });
  process.exit(0);
}
console.log("TOUR — 60 combats auto par palier, equipe au niveau du palier +"+off+"\n");
for(let z=0;z<6;z++){
  const row=[];
  for(const s of [0,3,6]){
    const L=G.sqStageLevel(z,s)+off; let w=0,t=0,st=0;
    for(let i=0;i<60;i++){ const r=play(z,s,L); if(r.win){w++; st+=r.stars;} t+=r.turns; }
    row.push(`p${s+1} ${String(Math.round(w/60*100)).padStart(3)}% ${(t/60).toFixed(0).padStart(3)} tours ${w?(st/w).toFixed(1):"-"}★`);
  }
  console.log(G.SQ_ZONES[z].n.padEnd(15), row.join(" | "));
}
