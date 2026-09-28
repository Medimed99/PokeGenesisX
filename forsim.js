/* Rythme du forage : un joueur actif quelques minutes, puis absent, et ainsi de suite.
   Il achete la sonde la plus rentable et descend des que possible. */
const noop=()=>{};
function El(){return{style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},appendChild:noop,remove:noop,
 set innerHTML(v){},get innerHTML(){return ''},querySelectorAll:()=>[],dataset:{},addEventListener:noop,
 getBoundingClientRect:()=>({left:0,top:0,width:10,height:10}),offsetWidth:1};}
global.document={addEventListener:noop,getElementById:()=>El(),createElement:()=>El(),
 documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El(),readyState:'complete',
 querySelectorAll:()=>[],querySelector:()=>null,hidden:false};
global.window={addEventListener:noop};global.navigator={};global.Image=function(){};
global.URL={createObjectURL:()=>''};global.Blob=function(){};global.requestAnimationFrame=f=>0;
global.setTimeout=()=>0;global.setInterval=()=>0;global.clearInterval=noop;global.clearTimeout=noop;
const fs=require('fs');
const ORDER=fs.readFileSync('build.py','utf8').match(/ORDER = \[([\s\S]*?)\]/)[1].split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
eval(ORDER.map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n')+
 ';global.G={newState:newState,setS:v=>S=v,getS:()=>S,forage:forage,forageRate:forageRate,clickValue:clickValue,'+
 'DRILLS:DRILLS,drillCost:drillCost,depthCost:depthCost,nextStratum:nextStratum,STRATA:STRATA,echoGain:echoGain,unlocked:unlocked};');
G.setS(G.newState());
const f=G.forage();
const fmtT=s=>s<3600?Math.round(s/60)+' min':(s/3600).toFixed(1)+' h';
let t=0; const marks=[]; let firstEcho=null;
const TAPS=3;          /* frappes par seconde en session active */
/* sessions : 8 min actives, puis 2 h d'absence (plafonnee au reservoir) */
while(t < 72*3600 && f.depth < G.STRATA.length-1){
  for(let s=0;s<480;s++){
    const v=G.clickValue()*TAPS; f.energy+=v; f.total+=v;
    const g=G.unlocked('auto')?G.forageRate():0; f.energy+=g; f.total+=g;
    /* achat : meilleur rendement par Energie */
    for(let k=0;k<5 && G.unlocked('auto');k++){
      let best=null, br=0;
      for(const d of G.DRILLS){ const c=G.drillCost(d); if(c<=f.energy && d.base/c>br){br=d.base/c;best=d;} }
      if(!best) break;
      f.energy-=G.drillCost(best); f.drills[best.k]=(f.drills[best.k]||0)+1;
    }
    const c=G.depthCost();
    if(c!==null && f.energy>=c){ f.energy-=c; f.depth++; marks.push([f.depth,t]); }
    if(firstEcho===null && G.echoGain()>0) firstEcho=t;
    t++;
  }
  const away=Math.min(7200, (G.unlocked('offline')?12:8)*3600);
  const g=(G.unlocked('auto')?G.forageRate():0)*away; f.energy+=g; f.total+=g; t+=away;
}
console.log('RYTHME DU FORAGE — sessions de 8 min actives, 2 h d\'absence entre chaque\n');
for(const [d,tt] of marks) console.log(`  ${G.STRATA[d].n.padEnd(16)} atteinte après ${fmtT(tt).padStart(8)}   débloque : ${G.STRATA[d].unlock?G.STRATA[d].unlock.n:'—'}`);
console.log(`\n  premier recalibrage possible : ${firstEcho===null?'jamais sur 72 h':fmtT(firstEcho)}`);
console.log(`  strates atteintes en 72 h    : ${f.depth+1} / ${G.STRATA.length}`);
