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
global.URL={createObjectURL:()=>""}; global.Blob=function(){};
global.setTimeout=()=>0; global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;

const fs=require("fs");
const ORDER=['_dexblob.js','_atlas.js','_atlas_shiny.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js',
 '30-capture.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','38-forage.js','39-daily.js','35-modules.js','40-battle.js','50-expedition.js','52-expgear.js','54-tower.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','80-guide.js','81-cosmetics.js','85-journal.js',
 '90-admin.js','95-online.js','99-boot.js'];
let saveFails=0; const _w=console.warn; console.warn=(...a)=>{ if(String(a[0]).includes("sauvegarde")) saveFails++; };
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n") +
 "\n;global.G={newState:newState,setS:v=>S=v,getS:()=>S,ACTIONS:ACTIONS,SCREENS:SCREENS,POKE:POKE," +
 "dexTotal:dexTotal,atlasIndex:atlasIndex,ATLAS_N:ATLAS_N,SLUGS:SLUGS,dailyRollover:dailyRollover," +
 "setScreen:n=>currentScreen=n,STORY:STORY,ACHIEVEMENTS:ACHIEVEMENTS,COSMETICS:COSMETICS,getENC:()=>ENC,moduleUnlocked:moduleUnlocked,MODULE_REQ:MODULE_REQ};");

let pass=0,fail=0,errs=[];
const t=(n,fn)=>{ try{ fn(); pass++; }catch(e){ fail++; errs.push(n+" -> "+e.message); } };

/* --- sprites embarques --- */
t("atlas complet et adressable", ()=>{
  if(G.ATLAS_N!==773) throw new Error("cellules: "+G.ATLAS_N);
  for(const id of [1,25,150,386,474]){
    const i=G.atlasIndex(id);
    if(i<0||i>=G.ATLAS_N) throw new Error("index invalide pour "+id);
  }
  if(G.atlasIndex(0)!==-1) throw new Error("id 0 doit etre rejete");
  if(G.SLUGS.length!==386) throw new Error("identifiants: "+G.SLUGS.length);
});

/* --- panneau de test : chaque action doit laisser un etat valide --- */
function assertSane(label){
  const S=G.getS();
  if(S.integrity<0||S.integrity>100) throw new Error(label+": integrite "+S.integrity);
  if(S.level<1||!isFinite(S.level)) throw new Error(label+": niveau "+S.level);
  for(const k of ["coins","shards","cores","energy"])
    if(!isFinite(S[k])||S[k]<0) throw new Error(label+": "+k+"="+S[k]);
  for(const id in S.dex){
    const e=S.dex[id];
    if(!G.POKE[id]) throw new Error(label+": espece inconnue "+id);
    if(e.lvl<1||e.lvl>100) throw new Error(label+": niveau d'espece "+e.lvl);
    if(e.c<0) throw new Error(label+": compte negatif");
  }
  if(S.bosses.length>9) throw new Error(label+": trop de gardiens");
  if(new Set(S.bosses).size!==S.bosses.length) throw new Error(label+": gardien en double");
  if(S.team.length>6) throw new Error(label+": equipe trop grande");
  try{ JSON.parse(JSON.stringify(S)); }catch(e){ throw new Error(label+": etat non serialisable"); }
}

G.setS(G.newState()); G.dailyRollover();
const admActions = Object.keys(G.ACTIONS).filter(k=>k.startsWith("adm"));
t("le panneau expose des actions", ()=>{ if(admActions.length<25) throw new Error(admActions.length); });

const args = {
  admcur:[{c:"coins",n:"10000"},{c:"shards",n:"500"},{c:"cores",n:"25"},{c:"energy",n:"100000"}],
  admlvl:[{n:"1"},{n:"5"},{n:"20"}], admxp:[{n:"0.5"}], admlvlset:[{n:"1"},{n:"30"}],
  admint:[{n:"5"},{n:"25"}], admintset:[{n:"0"},{n:"99.5"},{n:"100"}],
  admdex:[{n:"10"},{n:"60"}], admstory:G.STORY.map(s=>({id:s.id})),
  admspawnrand:[{s:"1"},{s:"0",r:"5"}],
  admchest:[{k:"small"},{k:"big"},{k:"void"}], admaff:[{n:"120"}]
};
for(const k of admActions){
  if(k==="admtoggle"||k==="admopen"||k==="admcorrupt") continue;
  const list = args[k] || [{}];
  for(const a of list) t("action "+k+" "+JSON.stringify(a), ()=>{ G.ACTIONS[k](a); assertSane(k); });
}

/* --- "tout debloquer" doit reellement ouvrir tous les modules --- */
G.setS(G.newState()); G.dailyRollover();
t("admunlock ouvre tous les modules", ()=>{
  G.ACTIONS.admunlock({});
  const S=G.getS();
  for(const m of ["pokebox","fishing","idle","boss","expedition","poker"]){
    if(!G.moduleUnlocked(m)) throw new Error(m+" : toujours verrouille ("+G.MODULE_REQ[m].d+")");
  }
  assertSane("admunlock");
});

/* --- compagnon et hebdomadaires apres passage du panneau --- */
t("compagnon coherent apres les outils", ()=>{
  const S=G.getS();
  if(S.buddy && !S.dex[S.buddy.id]) throw new Error("compagnon hors archive");
  assertSane("compagnon");
});
t("hebdomadaires coherents apres les outils", ()=>{
  const S=G.getS();
  if(S.weekly){
    if(S.weekly.quests.length!==3) throw new Error("nombre d'objectifs");
    for(const q of S.weekly.quests)
      if(q.prog<0 || q.prog>q.goal) throw new Error("progression hors bornes");
  }
  assertSane("hebdo");
});

/* --- etat de fin de jeu pilote par le panneau --- */
t("parcours complet via le panneau", ()=>{
  G.ACTIONS.admdexall({}); G.ACTIONS.admbossall({}); G.ACTIONS.admintset({n:"100"});
  const S=G.getS();
  if(G.dexTotal()<386) throw new Error("pokedex incomplet: "+G.dexTotal());
  if(S.bosses.length!==9) throw new Error("gardiens: "+S.bosses.length);
  if(S.integrity!==100) throw new Error("integrite: "+S.integrity);
  assertSane("fin de jeu");
});

/* --- tous les ecrans restent affichables apres usage du panneau --- */
for(const k of Object.keys(G.SCREENS).filter(x=>!x.startsWith("_")))
  t("ecran <"+k+"> apres panneau", ()=>{
    G.setScreen(k);
    const h=G.SCREENS[k].html(null);
    if(typeof h!=="string"||h.length<5) throw new Error("html vide");
    if(/undefined|\[object Object\]|NaN/.test(h))
      throw new Error("sortie suspecte: "+(h.match(/.{0,40}(undefined|\[object Object\]|NaN).{0,40}/)||[""])[0]);
  });

if(saveFails){ fail++; errs.push("echecs de sauvegarde: "+saveFails); } else pass++;
console.log(errs.map(e=>"  ECHEC: "+e).join("\n"));
console.log(`\n${pass} verifications reussies, ${fail} echecs`);
process.exit(fail?1:0);
