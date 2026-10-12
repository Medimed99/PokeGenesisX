/* Rythme du Forage : temps pour atteindre chaque strate, selon le niveau d'archive
   et le nombre d'emplacements. Equipe composee au mieux a chaque strate. */
const noop=()=>{};
const El=()=>({style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},appendChild:noop,remove:noop,querySelectorAll:()=>[],addEventListener:noop,getBoundingClientRect:()=>({}),dataset:{}});
global.document={addEventListener:noop,getElementById:()=>El(),createElement:El,documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El(),querySelectorAll:()=>[],querySelector:()=>null};
global.window={addEventListener:noop}; global.navigator={}; global.Image=function(){}; global.requestAnimationFrame=()=>0;
global.setTimeout=()=>0; global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;
const fs=require("fs");
const ORDER=fs.readFileSync('build.py','utf8').match(/ORDER = \[([\s\S]*?)\]/)[1].split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n")+";global.G={newState,setS:v=>S=v,getS:()=>S,addToDex,forage,forageAdvance,STRATA,POKE,minLevelOf,digPower,wallEvery};");
function run(lvl, slots, n){
  G.setS(G.newState()); const S0=G.getS(); S0.level=30;
  /* une archive plausible : n especes de Kanto au niveau donne */
  const ids=Object.keys(G.POKE).map(Number).filter(i=>i<=151&&!G.POKE[i].leg&&G.minLevelOf(i)<=lvl+5).slice(0,n);
  for(const id of ids) G.addToDex(id,lvl,false);
  const f=G.forage(); f.slots=slots;
  const out=[]; let t=0, si=0;
  while(si<8 && t<30*24*3600){
    const s=f.depth;
    f.crew=ids.slice().sort((a,b)=>G.digPower(b,s)-G.digPower(a,s)).slice(0,slots);
    G.forageAdvance(60); t+=60;
    if(f.depth>si){ si=f.depth; out.push((t/3600).toFixed(1)+"h"); }
  }
  return out.join(" ");
}
for(const [lv,sl,n] of [[12,3,30],[20,3,45],[30,4,70],[45,5,100],[60,6,140]])
  console.log(`niv.${lv} ${sl} places ${n} esp. :`, run(lv,sl,n));

