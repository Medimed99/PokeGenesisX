/* D'où viennent réellement les Fragments, et à quelle vitesse ? */
const noop=()=>{};
function El(id){return{id,style:{setProperty:noop,display:''},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
 appendChild:noop,remove:noop,removeChild:noop,querySelectorAll:()=>[],insertBefore:noop,
 set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||''},
 textContent:'',value:'',dataset:{},children:[],firstChild:null,firstElementChild:null,scrollTop:0,scrollHeight:0,
 select:noop,focus:noop,onclick:null,className:'',disabled:false,setAttribute:noop,getAttribute:()=>null,
 removeAttribute:noop,addEventListener:noop,offsetWidth:100,getBoundingClientRect:()=>({left:0,top:0,width:120,height:120})};}
global.document={addEventListener:noop,getElementById:id=>El(id),createElement:()=>El('x'),
 documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El('b'),readyState:'complete',
 querySelectorAll:()=>[],querySelector:()=>null,execCommand:noop,hidden:false};
global.window={addEventListener:noop};global.navigator={};global.Image=function(){};
global.requestAnimationFrame=f=>0;global.URL={createObjectURL:()=>''};global.Blob=function(){};
global.setTimeout=()=>0;global.setInterval=()=>0;global.clearInterval=noop;global.clearTimeout=noop;
const fs=require('fs');
const ORDER=fs.readFileSync('build.py','utf8').match(/ORDER = \[([\s\S]*?)\]/)[1]
  .split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
eval(ORDER.map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n') +
 ";global.G={newState:newState,setS:v=>S=v,getS:()=>S,dailyRollover:dailyRollover,openChest:openChest," +
 "CHESTS:CHESTS,BOOSTS:BOOSTS,newEncounter:newEncounter,catchChance:catchChance,onCatch:onCatch," +
 "onFail:onFail,getENC:()=>ENC,setENC:v=>ENC=v};");

function chestYield(key, n){
  let shards=0, coins=0;
  for(let i=0;i<n;i++){
    G.setS(G.newState()); const S=G.getS(); S.level=25; S.event=null;
    const before=S.shards;
    G.openChest(key, true);
    shards += S.shards-before;
  }
  return shards/n;
}
function captureYield(n){
  G.setS(G.newState()); G.dailyRollover();
  const S=G.getS(); S.level=25; S.event=null; S.balls.poke=1e9;
  let caught=0;
  for(let i=0;i<n;i++){
    G.newEncounter(); const e=G.getENC();
    if(!e||e.missing){ G.setENC(null); continue; }
    let g=0;
    while(G.getENC() && g++<10){
      S.coins-=18;
      if(Math.random()<G.catchChance("poke")){ G.onCatch("poke"); caught++; break; }
      G.onFail("poke");
    }
    S.level=25; S.event=null;
  }
  return {shards:S.shards/caught, coins:S.coins/caught, caught};
}

const cap = captureYield(4000);
console.log("PAR CAPTURE");
console.log(`  PokéCoins nets : ${cap.coins.toFixed(0)}`);
console.log(`  Fragments      : ${cap.shards.toFixed(2)}`);
console.log();
console.log("PAR ARCHIVE (moyenne sur 4000 ouvertures)");
for(const k of ["small","big","void","master"]){
  const c=G.CHESTS[k], y=chestYield(k, 2000);
  const cost = c.cur==="coins" ? c.price : c.price*0;
  const perCapture = cost ? (cost/cap.coins) : 0;
  console.log(`  ${c.name.padEnd(22)} ${String(c.price).padStart(6)} ${c.cur.padEnd(6)}`
    + ` | ${y.toFixed(1).padStart(6)} Fragments`
    + (cost ? ` | soit ${(y/perCapture).toFixed(2)} Fragments par capture équivalente` : ""));
}
console.log();
console.log("PRIX EN FRAGMENTS");
for(const [id,b] of Object.entries(G.BOOSTS)) if(b.cur==="shards")
  console.log(`  ${b.n.padEnd(22)} ${String(b.price).padStart(3)} Fragments`);
