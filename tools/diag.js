/* d'ou viennent les degats qui tuent le debutant ? */
require('/home/claude/pcg/harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };
for(let i = 1; i <= 151; i++) if(!isExclusive(i)) addToDex(i, 30, false);
const orig = brTakeHit;
let SRC = {};
brTakeHit = function(R, dmg, from){
  const ok = orig(R, dmg, from);
  if(ok){ const k = from ? (from.boss ? "boss" : from.nestOf ? "rejeton" : from.kind || "n") : (R.__ctx || "zone/tir"); SRC[k] = (SRC[k] || 0) + dmg * R.mods.armor; }
  return ok;
};
const tot = {}; let deaths = [];
for(let k = 0; k < 10; k++){
  SRC = {};
  const R = brNewRun({region:"kanto", hab:"route", starter:4, seed:1000 + k * 7919}); R.W = 390; R.H = 700; R.dpr = 1; BR = R;
  let nests = 0;
  while(R.t < 500 && !R.over){
    const a = R.t * 0.9; R.joy = {dx:Math.cos(a), dy:Math.sin(a)}; R.keys = {};
    brUpdate(R, 1/30);
    if(R.choices){ const c = R.choices[0]; R.choices = null; R.modal = false; try { ACTIONS.brpick({i:0}); } catch(e){} }
    R.modal = false; R.pendingLevels = 0; R.chestsPending = 0;
    R.P.foes.each(f=>{ if(f.kind === "nest" && !f.__c){ f.__c = 1; nests++; } });
  }
  deaths.push(`${Math.floor(R.t/60)}:${String(Math.floor(R.t%60)).padStart(2,"0")} (nids ${nests})`);
  for(const [s, v] of Object.entries(SRC)) tot[s] = (tot[s] || 0) + v;
}
console.log("fin des runs :", deaths.join(" · "));
const all = Object.values(tot).reduce((a, b)=>a + b, 0);
console.log("dégâts reçus par source :", Object.entries(tot).sort((a, b)=>b[1] - a[1]).map(([s, v])=>`${s} ${Math.round(v / all * 100)} %`).join(" · "));
