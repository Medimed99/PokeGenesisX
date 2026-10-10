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

/* un joueur type : 3 Pokémon solides au niveau indiqué */
function setup(lvl){
  G.setS(G.newState());
  const S=G.getS(); S.level=20;
  for(const id of [6,9,3,65,94,143,130,112]) G.addToDex(id, lvl, false);
  S.team=[[6,9,3],[65,94,112],[3,6,94]][Math.floor(Math.random()*3)];
  return S;
}
/* combat automatique jusqu'à son terme, renvoie true si gagné */
function fight(run, kind, team){
  const allies=team.filter(m=>m.hp>0).map(m=>G.runFighter(run,m));
  if(!allies.length) return false;
  const foes=G.enemyTeamFor(run, kind);
  let done=null;
  G.createBattle(allies, foes, {ai:true, speed:4, onEnd:w=>done=w});
  G.doTurn(0);
  let guard=0;
  while(done===null && guard++<6000){ if(!drain(300)) break; }
  for(const f of allies) if(f.ref) f.ref.hp=Math.max(0,f.hp);
  return done===true;
}

const COMBAT = new Set(["fight","trainer","elite","boss","champ"]);
/* trois manieres de choisir sa route : foncer (combats d'abord), prudente (services d'abord), au hasard */
function choose(run, opts, policy){
  if(policy==="hasard" || opts.length<2) return opts[Math.floor(Math.random()*opts.length)];
  const score = i => { const t = run.map[run.row+1][i].t;
    const hp = run.team.reduce((a,m)=>a+Math.max(0,m.hp)/m.maxHp,0)/run.team.length;
    if(policy==="fonce") return (t==="trainer"?3:t==="fight"?2:t==="elite"?(hp>0.6?2.5:0):t==="rest"?(hp<0.5?4:0):1) + Math.random()*0.5;
    return (t==="rest"?(hp<0.8?4:1):t==="draft"||t==="treasure"?2.5:t==="fight"?1.5:t==="trainer"?1:t==="elite"?0:1.5) + Math.random()*0.5; };
  return opts.reduce((a,b)=>score(b)>score(a)?b:a);
}
function runOnce(lvl, policy){
  const S=setup(lvl);
  G.startExpedition(S.team.slice(0,3));
  const run=S.expedition;
  const res={sector:0, win:false, byKind:{}, lv:0};
  for(;;){
    const col = choose(run, run.avail, policy);
    const y = run.row+1, node=run.map[y][col];
    run.row=y; run.col=col; run.floor=G.expFloorOf(run.mapIdx,y,run.maps); run.step=run.mapIdx*G.MAP_ROWS+y; node.done=true;
    run.avail = y<run.map.length-1 ? node.next : [];
    const k=node.t;
    if(COMBAT.has(k)){
      res.byKind[k]=res.byKind[k]||{w:0,l:0};
      const ratio=run.team.reduce((a,m)=>a+Math.max(0,m.hp)/m.maxHp,0)/run.team.length;
      if(run.heals>0 && (ratio<0.5 || ((k==="champ"||k==="boss"||k==="elite") && ratio<0.8))){ run.heals--; G.healTeam(run,.45); }
      const down=run.team.filter(m=>m.hp<=0);
      if(run.revives>0 && down.length && run.team.filter(m=>m.hp>0).length<=1){ run.revives--; down[0].hp=Math.floor(down[0].maxHp*0.5); }
      run.trainer=null;
      const ok=fight(run,k,run.team);
      ok?res.byKind[k].w++:res.byKind[k].l++;
      if(!ok){ res.sector=run.mapIdx; res.lost=k+run.mapIdx; res.gap=Math.round(run.team.reduce((a,m)=>a+m.level,0)/run.team.length - G.expEnemyLevel(run,0)); res.hp=Math.round(run.team.filter(m=>m.hp>0).length); return res; }
      G.healTeam(run, 0.35 + G.relicVal(run,"post"));
      if(k==="boss"){ res.win=true; res.sector=run.maps; break; }
      G.expGainLevels(run, G.EXP_GAIN[k]||0);
      if(k==="elite") G.grantRelic(run);
      if(k==="champ"){ G.healTeam(run,0.4); G.grantRelic(run); G.openSector(run, run.mapIdx+1); continue; }
    } else if(k==="draft" || k==="swap"){
      const pool=G.draftPool(run, 3, k==="swap"?3:0);
      const best=pool.reduce((a,b)=>G.POKE[b.id].bst>G.POKE[a.id].bst?b:a);
      if(k==="draft" && run.team.length<6) run.team.push(G.newRunMon(run,best.id,best.lvl));
      else {
        let w=0; for(let i=1;i<run.team.length;i++) if(G.POKE[run.team[i].id].bst<G.POKE[run.team[w].id].bst) w=i;
        if(G.POKE[best.id].bst>G.POKE[run.team[w].id].bst) run.team[w]=G.newRunMon(run,best.id,k==="swap"?run.team[w].level+4:best.lvl);
      }
    } else if(k==="rest"){ G.healTeam(run, 1); }
    else if(k==="treasure"){ run.heals++; }
    else if(k==="event"){ G.healTeam(run,.2); }
  }
  res.lv = Math.round(run.team.reduce((a,m)=>a+m.level,0)/run.team.length);
  S.expedition=null;
  return res;
}

console.log("DIFFICULTÉ DE L'EXPÉDITION (secteurs, progression Pokélike) — 150 runs par manière de jouer\n");
const lvl = +(process.argv[2]||40);
for(const policy of ["fonce","prudente","hasard"]){
  const agg={}; let sec=0, wins=0, n=150, lvs=[];
  for(let i=0;i<n;i++){
    const r=runOnce(lvl, policy);
    sec+=r.sector; if(r.win){ wins++; lvs.push(r.lv); } if(r.lost){ (globalThis.L=globalThis.L||{})[policy+':'+r.lost]=(L[policy+':'+r.lost]||0)+1; (globalThis.GAP=globalThis.GAP||[]).push(r.gap); }
    for(const k in r.byKind){ agg[k]=agg[k]||{w:0,l:0}; agg[k].w+=r.byKind[k].w; agg[k].l+=r.byKind[k].l; }
  }
  const pct=k=>agg[k]&&agg[k].w+agg[k].l?Math.round(agg[k].w/(agg[k].w+agg[k].l)*100)+"%":"  —";
  console.log(`${policy.padEnd(9)} | herbes ${pct("fight").padStart(4)} | dresseurs ${pct("trainer").padStart(4)} | élites ${pct("elite").padStart(4)}`
    +` | champions ${pct("champ").padStart(4)} | noyau ${pct("boss").padStart(4)} | secteurs ${(sec/n).toFixed(2)} | réussis ${Math.round(wins/n*100)}%`
    +` | niveau final ${lvs.length?Math.round(lvs.reduce((a,b)=>a+b,0)/lvs.length):"—"}`);
}

console.log(JSON.stringify(globalThis.L)); console.log('ecart moyen equipe-ennemi a la defaite', (GAP.reduce((a,b)=>a+b,0)/GAP.length).toFixed(1));
