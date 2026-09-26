/* Le recalibrage accelere-t-il vraiment ? Deux descentes comparees. */
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
 ';global.G={newState:newState,setS:v=>S=v,forage:forage,forageRate:forageRate,clickValue:clickValue,'+
 'DRILLS:DRILLS,drillCost:drillCost,depthCost:depthCost,STRATA:STRATA,echoGain:echoGain,unlocked:unlocked,ECHO_PERKS:ECHO_PERKS};');
G.setS(G.newState());
const f=G.forage();
function descent(maxH){
  let t=0; const marks={};
  while(t<maxH*3600 && f.depth<G.STRATA.length-1){
    for(let s=0;s<480;s++){
      const v=G.clickValue()*3; f.energy+=v; f.total+=v;
      if(G.unlocked('auto')){ const g=G.forageRate(); f.energy+=g; f.total+=g; }
      for(let k=0;k<5 && G.unlocked('auto');k++){
        let best=null,br=0;
        for(const d of G.DRILLS){const c=G.drillCost(d); if(c<=f.energy && d.base/c>br){br=d.base/c;best=d;}}
        if(!best) break; f.energy-=G.drillCost(best); f.drills[best.k]=(f.drills[best.k]||0)+1;
      }
      const c=G.depthCost(); if(c!==null && f.energy>=c){f.energy-=c; f.depth++; marks[f.depth]=t;}
      t++;
    }
    const g=(G.unlocked('auto')?G.forageRate():0)*7200; f.energy+=g; f.total+=g; t+=7200;
  }
  return marks;
}
const h=s=>s<3600?Math.round(s/60)+' min':(s/3600).toFixed(1)+' h';
const m1=descent(11);
const eg=G.echoGain();
console.log('première descente : Faille mineure en', h(m1[6]), '→ recalibrage pour', eg, 'Échos');
/* recalibrage, puis les Echos vont au Rendement et a la Penetration */
f.echoes+=eg; f.energy=0;f.total=0;f.depth=0;f.drills={};
f.perks={};
let left=f.echoes;
for(const k of ['e_yield','e_depth','e_yield','e_click','e_yield','e_depth']){
  const lv=f.perks[k]||0, c=G.ECHO_PERKS[k].cost(lv);
  if(left>=c && lv<G.ECHO_PERKS[k].max){ left-=c; f.perks[k]=lv+1; }
}
console.log('Échos dépensés :', JSON.stringify(f.perks));
const m2=descent(30);
console.log('seconde descente  : Faille mineure en', m2[6]!==undefined?h(m2[6]):'non atteinte',
  '| strates atteintes :', f.depth+1, '/', G.STRATA.length);
console.log('\naccélération :', m2[6]!==undefined ? (m1[6]/m2[6]).toFixed(2)+'×' : '—');
