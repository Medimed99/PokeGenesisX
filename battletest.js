const noop=()=>{};
function El(id){ return {id,style:{setProperty:noop,display:""},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,querySelectorAll:()=>[],set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||""},
  textContent:"",value:"",dataset:{},children:[],firstChild:null,scrollTop:0,scrollHeight:0,select:noop,focus:noop,
  onclick:null,className:"",disabled:false,setAttribute:noop,getAttribute:()=>null,
  removeAttribute:noop,addEventListener:noop,offsetWidth:100,
  getBoundingClientRect:()=>({left:0,top:0,width:120,height:120,right:120,bottom:120})}; }
global.document={addEventListener:noop,getElementById:id=>El(id),createElement:()=>El("x"),
  documentElement:{style:{setProperty:noop}},head:{appendChild:noop},readyState:"complete",
  querySelectorAll:()=>[],querySelector:()=>null,execCommand:noop,hidden:false};
global.window={addEventListener:noop}; global.requestAnimationFrame=f=>{f();return 0}; global.navigator={};
global.URL={createObjectURL:()=>""}; global.Blob=function(){}; global.Image=function(){};
/* file d'attente : setTimeout devient deterministe et vidable */
const Q=[]; global.setTimeout=(fn)=>{ Q.push(fn); return Q.length; };
global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;
function drain(max){ let n=0; while(Q.length && n++<max){ (Q.shift())(); } return n; }

const fs=require("fs");
const ORDER=['_dexblob.js','_atlas.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js','30-capture.js',
 '35-modules.js','40-battle.js','50-expedition.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','78-milestones.js','80-guide.js','85-journal.js','90-admin.js','95-online.js','99-boot.js'];
eval(fs.readFileSync.length && ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n") +
 "\n;global.G={newState:newState,setS:v=>S=v,getS:()=>S,createBattle:createBattle,makeFighter:makeFighter," +
 "doTurn:doTurn,getB:()=>BATTLE,addToDex:addToDex,POKE:POKE,REGIONS:REGIONS,startExpedition:startExpedition," +
 "enterNode:enterNode,EXP_ROWS:EXP_ROWS,ownedSorted:ownedSorted,guardianLevel:guardianLevel," +
 "guardianBoost:guardianBoost,regionDef:regionDef,setStatus:setStatus,canAct:canAct,endOfTurnStatus:endOfTurnStatus,STATUS:STATUS,UTILITY_MOVES:UTILITY_MOVES,movesFor:movesFor,damageCalc:damageCalc,POKE:POKE,doSwitch:doSwitch,renderArena:renderArena,ACTIONS:ACTIONS};");

G.setS(G.newState());
const S=G.getS();
S.level=40; S.coins=1e6; S.shards=1e4; S.cores=99;
for(let i=1;i<=386;i++) if(G.POKE[i]) G.addToDex(i,45,false);
S.team=G.ownedSorted().slice(0,3);

let wins=0,losses=0,stuck=0,errors=[];
/* combats d'expedition (auto) */
for(let k=0;k<150;k++){
  try{
    const allies=S.team.map(id=>G.makeFighter(id,40+(k%25)));
    const foes=[G.makeFighter(1+Math.floor(Math.random()*386),38+(k%30)),
                G.makeFighter(1+Math.floor(Math.random()*386),38+(k%30))];
    let done=null;
    G.createBattle(allies,foes,{ai:true,speed:4,onEnd:w=>done=w});
    G.doTurn(0);
    let guard=0;
    while(done===null && guard++<8000){ if(!drain(200)) break; }
    if(done===null){ stuck++; }
    else done?wins++:losses++;
  }catch(e){ errors.push("auto#"+k+": "+e.message); }
}
/* combats de gardien (tactique, choix d'attaque) */
let bw=0,bl=0;
for(const r of G.REGIONS){
  for(let i=0;i<3;i++){
    for(let rep=0;rep<8;rep++){
      try{
        const allies=S.team.map(id=>G.makeFighter(id,60));
        const g=r.guardians[i];
        const foe=G.makeFighter(g.id,G.guardianLevel(r,i),{boost:G.guardianBoost(r,i)});
        let done=null;
        G.createBattle(allies,[foe],{boss:g,onEnd:w=>done=w});
        let guard=0;
        while(done===null && guard++<3000){
          const B=G.getB();
          if(!B.busy && !B.over) G.doTurn(Math.floor(Math.random()*B.allies[B.a].moves.length));
          if(!drain(200) && !G.getB().busy && G.getB().over) break;
        }
        if(done===null) stuck++; else done?bw++:bl++;
      }catch(e){ errors.push("boss "+r.key+i+": "+e.message); }
    }
  }
}
/* --------- mecaniques : alterations, manœuvres, changement --------- */
let mp=0, mf=0; const mt=(n,fn)=>{ try{ fn(); mp++; }catch(e){ mf++; errors.push("meca "+n+": "+e.message); } };
const must=(c,m)=>{ if(!c) throw new Error(m||"condition non remplie"); };

mt("les manœuvres apparaissent a partir du niveau 12", ()=>{
  must(!G.movesFor(G.POKE[6], 8).some(m=>m.util), "manœuvre trop tot");
  must(G.movesFor(G.POKE[6], 30).some(m=>m.util), "manœuvre absente au niveau 30");
  must(G.movesFor(G.POKE[6], 60).length<=4, "plus de quatre attaques");
});
mt("chaque type dispose d'une manœuvre valide", ()=>{
  for(let t=1;t<=18;t++){
    const u=G.UTILITY_MOVES[t];
    must(u, "type "+t+" sans manœuvre");
    must(u.st || u.buff || u.heal, "manœuvre sans effet : type "+t);
    if(u.st) must(G.STATUS[u.st], "alteration inconnue : "+u.st);
  }
});
mt("une alteration ne s'applique qu'une fois", ()=>{
  const f=G.makeFighter(25,50);
  must(G.setStatus(f,"brn")===true, "premiere application refusee");
  must(G.setStatus(f,"psn")===false, "double alteration acceptee");
  must(f.status.k==="brn");
});
mt("le sommeil finit toujours par se lever", ()=>{
  const f=G.makeFighter(25,50);
  G.setStatus(f,"slp");
  let woke=false;
  for(let i=0;i<12;i++){ const r=G.canAct(f); if(r.ok){ woke=true; break; } }
  must(woke, "sommeil sans reveil apres 12 tours");
  must(f.status===null, "alteration non purgee au reveil");
});
mt("la paralysie laisse agir la plupart du temps", ()=>{
  const f=G.makeFighter(25,50); G.setStatus(f,"par");
  let ok=0;
  for(let i=0;i<400;i++) if(G.canAct(f).ok) ok++;
  must(ok>250 && ok<400, "taux d'echec aberrant : "+ok+"/400");
  must(f.status && f.status.k==="par", "la paralysie ne doit pas se purger seule");
});
mt("brulure et poison infligent des degats sans tuer par surprise", ()=>{
  const f=G.makeFighter(9,60); G.setStatus(f,"brn");
  const hp0=f.hp;
  global.BATTLE_TEST=true;
  G.createBattle([f],[G.makeFighter(6,60)],{ai:true,onEnd:noop});
  G.endOfTurnStatus(f,"ally");
  must(f.hp<hp0, "la brulure n'inflige rien");
  must(f.hp>0, "un seul tour de brulure ne doit pas tuer");
  const g=G.makeFighter(9,60); G.setStatus(g,"psn");
  const a=g.hp; G.endOfTurnStatus(g,"ally"); const d1=a-g.hp;
  const b=g.hp; G.endOfTurnStatus(g,"ally"); const d2=b-g.hp;
  must(d2>d1, "le poison doit s'aggraver : "+d1+" puis "+d2);
});
mt("la brulure divise l'attaque physique", ()=>{
  const att=G.makeFighter(68,60), def=G.makeFighter(95,60);
  const mv={name:"test",type:2,pw:90,acc:1};
  let sain=0, brule=0;
  for(let i=0;i<300;i++) sain+=G.damageCalc(att,def,mv,false).dmg;
  G.setStatus(att,"brn");
  for(let i=0;i<300;i++) brule+=G.damageCalc(att,def,mv,false).dmg;
  must(brule < sain*0.65, "la brulure ne reduit pas assez : "+sain+" vs "+brule);
});
mt("changer d'equipier consomme le tour", ()=>{
  const a1=G.makeFighter(25,50), a2=G.makeFighter(6,50);
  let done=null;
  G.createBattle([a1,a2],[G.makeFighter(150,50)],{onEnd:w=>done=w});
  const B=G.getB();
  must(B.a===0, "mauvais actif au depart");
  G.doSwitch(1);
  drain(60);
  must(B.a===1, "changement non applique");
  must(B.turn>=1, "le tour n'a pas ete consomme");
});
mt("un equipier hors ligne ne peut pas entrer", ()=>{
  const a1=G.makeFighter(25,50), a2=G.makeFighter(6,50);
  a2.hp=0;
  G.createBattle([a1,a2],[G.makeFighter(150,50)],{onEnd:noop});
  G.doSwitch(1);
  must(G.getB().a===0, "un KO est entre en jeu");
});
mt("l'arene se rend dans tous les etats", ()=>{
  const f=G.makeFighter(25,50); G.setStatus(f,"par"); f.buff.atk=1.6;
  G.createBattle([f],[G.makeFighter(150,60)],{boss:{id:150},onEnd:noop});
  G.renderArena();
  G.getB().phase=2; G.renderArena();
  G.getB().over=true; G.renderArena();
});

console.log(`mecaniques   : ${mp} verifiees, ${mf} echecs`);
console.log(`auto-combats : ${wins} victoires / ${losses} defaites`);
console.log(`gardiens     : ${bw} victoires / ${bl} defaites (equipe niv.60)`);
console.log(`blocages     : ${stuck}`);
console.log(`erreurs      : ${errors.length}`);
errors.slice(0,5).forEach(e=>console.log("  "+e));
process.exit(errors.length||stuck?1:0);
