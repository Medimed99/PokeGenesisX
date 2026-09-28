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
 "NODE_TYPES:NODE_TYPES,genMap:genMap,makeFighter:makeFighter,POKE:POKE};");

/* un joueur type : 3 Pokémon solides au niveau indiqué */
function setup(lvl){
  G.setS(G.newState());
  const S=G.getS(); S.level=20;
  for(const id of [6,9,3,65,94,143,130,112]) G.addToDex(id, lvl, false);
  S.team=G.ownedSorted().slice(0,5);
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

function runOnce(lvl){
  const S=setup(lvl);
  G.startExpedition(S.team.slice(0,5));
  const run=S.expedition;
  const res={floors:0, win:false, byKind:{}};
  let y=0, col=(run.avail||[0])[0];
  while(y<G.EXP_ROWS){
    const node=run.map[y][col];
    run.row=y; run.col=col; run.floor=y; node.done=true;
    const k=node.t;
    if(k==="fight"||k==="elite"||k==="boss"||k==="trainer"){
      res.byKind[k]=res.byKind[k]||{w:0,l:0};
      /* un joueur soigne avant un morceau et recrute quand on le lui propose */
      const ratio=run.team.reduce((a,m)=>a+m.hp/m.maxHp,0)/run.team.length;
      if(run.heals>0 && (ratio<0.55 || (k!=="fight" && ratio<0.8))){ run.heals--; G.healTeam(run,.45); }
      /* un joueur garde sa reindexation pour un moment critique */
      const down=run.team.filter(m=>m.hp<=0);
      if(run.revives>0 && down.length && run.team.filter(m=>m.hp>0).length<=2){
        run.revives--; down[0].hp=Math.floor(down[0].maxHp*0.5); }
      const ok=fight(run,k,run.team);
      ok?res.byKind[k].w++:res.byKind[k].l++;
      if(!ok){ res.floors=y; return res; }

    } else if(k==="draft" || k==="swap"){
      /* un joueur prend le meilleur total de statistiques propose */
      const pool=G.draftPool(run, 3, k==="swap"?3:0);
      const best=pool.reduce((a,b)=>G.POKE[b.id].bst>G.POKE[a.id].bst?b:a);
      if(run.team.length<6) run.team.push(G.newRunMon(run,best.id,best.lvl));
      else {
        /* on remplace le plus faible si le candidat est meilleur */
        let w=0; for(let i=1;i<run.team.length;i++)
          if(G.POKE[run.team[i].id].bst<G.POKE[run.team[w].id].bst) w=i;
        if(G.POKE[best.id].bst>G.POKE[run.team[w].id].bst)
          run.team[w]=G.newRunMon(run,best.id,best.lvl);
      }
    } else if(k==="rest"){ G.healTeam(run, G.relicVal(run,"rest") ? 1 : .62); }
    else if(k==="treasure"){ G.grantRelic(run); run.heals++; }
    res.floors=y+1;
    if(y===G.EXP_ROWS-1){ res.win=true; break; }
    const nx=node.next; col=nx[Math.floor(Math.random()*nx.length)]; y++;
  }
  S.expedition=null;
  return res;
}

console.log("DIFFICULTÉ DE L'EXPÉDITION — 120 runs par niveau d'équipe\n");
for(const lvl of [25, 40, 55, 70]){
  const agg={fight:{w:0,l:0}, trainer:{w:0,l:0}, elite:{w:0,l:0}, boss:{w:0,l:0}};
  let floors=0, wins=0, n=120;
  for(let i=0;i<n;i++){
    const r=runOnce(lvl);
    floors+=r.floors; if(r.win) wins++;
    for(const k in r.byKind){ agg[k].w+=r.byKind[k].w; agg[k].l+=r.byKind[k].l; }
  }
  const pct=o=>o.w+o.l?Math.round(o.w/(o.w+o.l)*100)+"%":"  —";
  console.log(`équipe niv.${String(lvl).padStart(2)} | sauvage ${pct(agg.fight).padStart(4)}`
    +` | archiviste ${pct(agg.trainer).padStart(4)} | élite ${pct(agg.elite).padStart(4)}`
    +` | noyau ${pct(agg.boss).padStart(4)}`
    +` | étage moyen ${(floors/n).toFixed(1).padStart(4)}/12 | runs terminés ${Math.round(wins/n*100)}%`);
}
