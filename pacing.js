const noop=()=>{};
function El(id){ return {id,style:{setProperty:noop,display:""},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,removeChild:noop,querySelectorAll:()=>[],insertBefore:noop,
  set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||""},
  textContent:"",value:"",dataset:{},children:[],firstChild:null,scrollTop:0,scrollHeight:0,
  select:noop,focus:noop,onclick:null,className:"",disabled:false,checked:false,
  setAttribute:noop,getAttribute:()=>null,removeAttribute:noop,addEventListener:noop,offsetWidth:100,
  getBoundingClientRect:()=>({left:0,top:0,width:120,height:120,right:120,bottom:120})}; }
global.document={addEventListener:noop,getElementById:id=>El(id),createElement:()=>El("x"),
  documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El("body"),
  readyState:"complete",querySelectorAll:()=>[],querySelector:()=>null,execCommand:noop,hidden:false};
global.window={addEventListener:noop}; global.navigator={}; global.requestAnimationFrame=f=>{f();return 0};
global.URL={createObjectURL:()=>""}; global.Blob=function(){}; global.Image=function(){};
global.setTimeout=()=>0; global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;
const fs=require("fs");
const ORDER=['_dexblob.js','_atlas.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js',
 '30-capture.js','35-modules.js','40-battle.js','50-expedition.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','78-milestones.js','80-guide.js','85-journal.js',
 '90-admin.js','95-online.js','99-boot.js'];
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n")+
 "\n;global.G={newState:newState,setS:v=>S=v,getS:()=>S,newEncounter:newEncounter,onCatch:onCatch,onFail:onFail,"+
 "getENC:()=>ENC,setENC:v=>ENC=v,dailyRollover:dailyRollover,guideTick:guideTick,moduleUnlocked:moduleUnlocked,"+
 "currentDirective:currentDirective,dexTotal:dexTotal,DIRECTIVES:DIRECTIVES,xpForLevel:xpForLevel};");

/* une capture = environ 6 secondes de jeu reel (choix + animation + resultat) */
const SEC = 6, RUNS = 25;
const agg = {};
for(let r=0; r<RUNS; r++){
  G.setS(G.newState()); G.dailyRollover();
  const S = G.getS();
  let lastLvl = 1;
  const open_ = {};
  for(let i=0;i<500;i++){
    G.newEncounter();
    const e = G.getENC();
    if(!e || e.missing){ G.setENC(null); continue; }
    if(Math.random() < 0.15) G.onFail("poke"); else G.onCatch("poke");
    G.guideTick();
    while(S.level > lastLvl){
      lastLvl++;
      (agg["niveau "+lastLvl] = agg["niveau "+lastLvl] || []).push(S.stats.catches);
    }
    for(const m of ["pokebox","fishing","idle","boss","expedition"]){
      if(!open_[m] && G.moduleUnlocked(m)){
        open_[m] = true;
        (agg["module "+m] = agg["module "+m] || []).push(S.stats.catches);
      }
    }
    if(lastLvl >= 12) break;
  }
}
const fmtT = c => { const m = Math.floor(c*SEC/60), s2 = Math.round(c*SEC%60);
  return `${String(m).padStart(2)}m${String(s2).padStart(2,"0")}`; };
const med = a => { const b = a.slice().sort((x,y)=>x-y); return b[Math.floor(b.length/2)]; };
console.log(`RYTHME DE DEBUT DE PARTIE — mediane sur ${RUNS} parties (1 capture ≈ ${SEC} s)\n`);
const order = Object.keys(agg).sort((a,b)=>med(agg[a])-med(agg[b]));
for(const k of order){
  const v = agg[k];
  if(v.length < RUNS*0.5) continue;
  console.log(`  ${fmtT(med(v))}  ${k.padEnd(16)} (${med(v)} captures, min ${Math.min(...v)}, max ${Math.max(...v)})`);
}
