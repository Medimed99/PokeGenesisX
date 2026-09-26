const noop=()=>{};
function El(id){ return {id,style:{setProperty:noop,display:""},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,removeChild:noop,querySelectorAll:()=>[],insertBefore:noop,
  set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||""},textContent:"",value:"",dataset:{},
  children:[],firstChild:null,scrollTop:0,scrollHeight:0,select:noop,focus:noop,onclick:null,className:"",
  disabled:false,setAttribute:noop,getAttribute:()=>null,removeAttribute:noop,addEventListener:noop,offsetWidth:100,
  getBoundingClientRect:()=>({left:0,top:0,width:120,height:120})}; }
global.document={addEventListener:noop,getElementById:id=>El(id),createElement:()=>El("x"),
  documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El("body"),readyState:"complete",
  querySelectorAll:()=>[],querySelector:()=>null,execCommand:noop,hidden:false};
global.window={addEventListener:noop}; global.navigator={}; global.requestAnimationFrame=f=>{f();return 0};
global.URL={createObjectURL:()=>""}; global.Blob=function(){}; global.Image=function(){};
global.setTimeout=()=>0; global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;
const fs=require("fs");
const ORDER=['_dexblob.js','_atlas.js','_atlas_shiny.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js',
 '30-capture.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','38-forage.js','39-daily.js','35-modules.js','40-battle.js','50-expedition.js','52-expgear.js','54-tower.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','80-guide.js','81-cosmetics.js','85-journal.js',
,'90-admin.js','95-online.js','99-boot.js'];
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n")+
 "\n;global.G={newState:newState,setS:v=>S=v,getS:()=>S,newEncounter:newEncounter,onCatch:onCatch,onFail:onFail,"+
 "getENC:()=>ENC,setENC:v=>ENC=v,dailyRollover:dailyRollover,catchChance:catchChance,BALLS:BALLS,shinyOdds:shinyOdds,POKE:POKE,POKE_IDS:POKE_IDS,RARITY:RARITY};");

/* ---- taux de reussite par rarete et par conteneur ---- */
function rateTable(){
  G.setS(G.newState()); const S=G.getS(); S.level=12; S.streak=20;
  const balls=["poke","super","hyper","data"];
  console.log("TAUX DE CAPTURE AU PREMIER LANCER (niveau 12, série 20)\n");
  console.log("  rareté        " + balls.map(b=>G.BALLS[b].name.split(" ")[0].padStart(8)).join(""));
  for(let r=0;r<6;r++){
    const ids=G.POKE_IDS.filter(i=>G.POKE[i].rar===r);
    if(!ids.length) continue;
    const line=balls.map(b=>{
      let sum=0;
      for(const id of ids){ G.setENC({id, level:20+r*8, shiny:false, rar:r, attempts:0});
        sum+=G.catchChance(b); }
      return (sum/ids.length*100).toFixed(0).padStart(7)+"%";
    }).join("");
    console.log("  "+G.RARITY[r].n.padEnd(14)+line);
  }
}

/* ---- longueur de serie reellement atteinte ---- */
function streakSim(ballKey, n){
  G.setS(G.newState()); G.dailyRollover();
  const S=G.getS(); S.level=12; S.balls[ballKey]=1e9;
  S.weather='clair'; S.weatherUntil=Date.now()+1e9; S.event=null;
  S.luckyDay='d_none';   /* le jour faste est tire une fois par partie : il ne doit pas choisir le resultat */
  const LVL=12;
  const lens=[]; let cur=0;
  for(let i=0;i<n;i++){
    G.newEncounter(); const e=G.getENC();
    if(!e||e.missing){ G.setENC(null); continue; }
    let guard=0;
    while(G.getENC() && guard++<10){
      const before=S.streak;
      if(Math.random()<G.catchChance(ballKey)) G.onCatch(ballKey);
      else G.onFail(ballKey);
      S.level=LVL; S.weather='clair'; S.weatherUntil=Date.now()+1e9;
      S.event=null; S.luckyDay='d_none';   /* evenements et jour faste tires au hasard faussaient la mesure */
      if(S.streak===0 && before>0){ lens.push(before); }
    }
  }
  lens.push(S.streak);
  const moy=lens.reduce((a,b)=>a+b,0)/lens.length;
  return {moy, max:Math.max(...lens), med:lens.sort((a,b)=>a-b)[Math.floor(lens.length/2)]};
}

/* le joueur rachète une ball/* le joueur rachète une ball à chaque lancer : le solde doit-il monter ou descendre ? */
function run(label, ballKey, lvl){
  G.setS(G.newState()); G.dailyRollover();
  const S=G.getS(); S.level=lvl; S.coins=0; S.event=null;
  S.weather='clair'; S.weatherUntil=Date.now()+1e9;
  S.balls[ballKey]=1e9;
  const ball=G.BALLS[ballKey]; let throws=0, caught=0;
  for(let i=0;i<4000;i++){
    G.newEncounter(); const e=G.getENC();
    if(!e||e.missing){ G.setENC(null); continue; }
    let done=false, guard=0;
    while(!done && guard++<8){
      throws++;
      if(ball.cur==="coins") S.coins-=ball.price;
      const p=G.catchChance(ballKey);
      if(Math.random()<p){ G.onCatch(ballKey); caught++; done=true; }
      else { G.onFail(ballKey); if(!G.getENC()) done=true; }
      S.level=lvl; S.event=null;
      S.weather='clair'; S.weatherUntil=Date.now()+1e9;   /* niveau, événements et météo figés */
    }
  }
  const net=S.coins/throws, perCatch=S.coins/caught;
  console.log(`${label.padEnd(26)} ${(caught/throws*100).toFixed(0).padStart(3)}% | `
    +`${net>=0?"+":""}${net.toFixed(1)} c/lancer | ${perCatch>=0?"+":""}${perCatch.toFixed(0)} c/capture `
    +`| série moy ${(S.stats.bestStreak/3).toFixed(0)} max ${S.stats.bestStreak}`);
  return net;
}
rateTable();
console.log("\nLONGUEUR DE SÉRIE (12 000 rencontres)");
for(const b of ["poke","super"]){ const r=streakSim(b,12000);
  console.log(`  ${G.BALLS[b].name.padEnd(12)} moyenne ${r.moy.toFixed(1)} | médiane ${r.med} | record ${r.max}`); }
console.log("\nÉCONOMIE DE LA BOUCLE DE CAPTURE (achat de la ball inclus)\n");
run("Poké Ball, niveau 3","poke",3);
run("Poké Ball, niveau 10","poke",10);
run("Poké Ball, niveau 25","poke",25);
run("Super Ball, niveau 10","super",10);
run("Hyper Ball, niveau 25","hyper",25);
G.setS(G.newState());
console.log("\nCHANCE DE CHROMATIQUE");
const S=G.getS();
for(const st of [0,10,25,50,100,250]){ S.streak=st;
  console.log(`  série ${String(st).padStart(3)} : 1 sur ${Math.round(1/G.shinyOdds())}`); }

/* --- diagnostic : d'ou viennent les coins ? --- */
G.setS(G.newState()); G.dailyRollover();
(function(){
  const S=G.getS(); S.level=12; S.event=null; S.balls.poke=1e9;
  const byRar={}, cnt={};
  for(let i=0;i<6000;i++){
    G.newEncounter(); const e=G.getENC();
    if(!e||e.missing){ G.setENC(null); continue; }
    const r=e.rar, before=S.coins;
    let guard=0;
    while(G.getENC()&&guard++<10){
      if(Math.random()<G.catchChance("poke")){ G.onCatch("poke"); break; }
      G.onFail("poke");
    }
    S.level=12; S.event=null;
    byRar[r]=(byRar[r]||0)+(S.coins-before); cnt[r]=(cnt[r]||0)+1;
  }
  const tot=Object.values(cnt).reduce((a,b)=>a+b,0);
  console.log("\nRÉPARTITION DES RENCONTRES ET DES GAINS (série élevée, niveau 12)");
  let sum=0;
  for(const r of Object.keys(cnt).sort()){
    const part=cnt[r]/tot*100, moy=byRar[r]/cnt[r];
    sum+=byRar[r];
    console.log(`  ${G.RARITY[r].n.padEnd(12)} ${part.toFixed(1).padStart(5)}% des rencontres | ${moy.toFixed(0).padStart(5)} coins/rencontre`);
  }
  console.log(`  moyenne pondérée : ${(sum/tot).toFixed(0)} coins par rencontre (série finale ${S.streak})`);
})();
