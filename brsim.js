/* Calibrage de la Breche : des runs completes, sans navigateur, avec deux profils.
   « debutant » tourne en rond ; « joueur » esquive le groupe le plus proche. */
require('./harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };   /* coffres et evolutions immediats */
global.performance = global.performance || {now:()=>Date.now()};
global.requestAnimationFrame = () => 0;
for(let i = 1; i <= 151; i++) if(!isExclusive(i)) addToDex(i, 30, false);
S.stats.expWins = 1;
function run(profile, seed, opts){
  opts = opts || {};
  const R = brNewRun({region:"kanto", hab:opts.hab || "route", starter:opts.starter || 4, seed,
                      guardian:{id:144, region:"kanto", core:false}});
  R.W = 390; R.H = 700; R.dpr = 1; BR = R;
  const dt = 1 / 30;
  const deep = !!opts.deep;
  while(R.t < (deep ? 4000 : 620)){
    /* apres la victoire : on descend dans la faille profonde, comme le bouton du jeu */
    if(R.over){ if(deep && R.bossDown && R.hp > 0 && !R.endless){ R.over = false; R.endless = true; R.won = true; } else break; }
    /* deplacement */
    if(profile === "debutant"){ const a = R.t * 0.9; R.joy = {dx:Math.cos(a), dy:Math.sin(a)}; }
    else {
      let cx = 0, cy = 0, n = 0;
      R.P.foes.each(f=>{ const d = Math.hypot(f.x - R.x, f.y - R.y); if(d < 170){ cx += f.x; cy += f.y; n++; } });
      if(n){ let dx = R.x - cx / n, dy = R.y - cy / n; const m = Math.hypot(dx, dy) || 1;
        const a = R.t * 0.5; R.joy = {dx: dx / m * 0.8 + Math.cos(a) * 0.3, dy: dy / m * 0.8 + Math.sin(a) * 0.3}; }
      else {
        let g = null, gd = 1e9;
        R.P.gems.each(o=>{ const d = Math.hypot(o.x - R.x, o.y - R.y); if(d < gd){ gd = d; g = o; } });
        if(g && gd < 400){ R.joy = {dx:(g.x - R.x) / gd, dy:(g.y - R.y) / gd}; }
        else { const a = R.t * 0.6; R.joy = {dx:Math.cos(a) * 0.5, dy:Math.sin(a) * 0.5}; }
      }
    }
    R.keys = {};
    brUpdate(R, dt);
    /* choix : le joueur privilegie ameliorations et catalyseurs de son type */
    if(R.choices){
      let i = 0;
      if(profile === "joueur"){
        const sc = o => o.k === "gold" ? 20 : o.k === "up" ? 5 + R.team[o.i].lv : o.k === "new" ? (R.team.length < 4 ? 9 : 3) : o.k === "item" ? (o.key.startsWith("cat") ? 8 : 4) : 1;
        let best = -1; R.choices.forEach((o, k)=>{ if(sc(o) > best){ best = sc(o); i = k; } });
      }
      ACTIONS.brpick({i});
    }
    if(R.modal && !R.choices) ACTIONS.brclose();
  }
  const bossLeft = R.boss ? R.boss.hp / R.boss.max : (R.bossDown ? 0 : 1);
  return {t:R.t, won:R.won || R.bossDown, lv:R.lv, kills:R.kills, team:R.team.length, evo:R.team.filter(w=>w.stage >= 2).length,
          bossLeft, reached: R.bossOn, bossSurv: R.bossOn ? R.t - R.bossAt : 0, depth: R.depth || 0};
}
const N = +(process.argv[2] || 12);
const HAB = process.env.HAB || "route";
for(const prof of ["debutant", "joueur"]){
  const res = [];
  for(let k = 0; k < N; k++) res.push(run(prof, 1000 + k * 7919, {hab:HAB}));
  const ts = res.map(r=>r.t).sort((a, b)=>a - b), med = ts[ts.length >> 1];
  const won = res.filter(r=>r.won).length;
  const m = x => (res.reduce((a, r)=>a + r[x], 0) / res.length).toFixed(1);
  console.log(`${prof.padEnd(9)} survie médiane ${Math.floor(med/60)}:${String(Math.floor(med%60)).padStart(2,"0")}` +
    ` · boss vaincu ${won}/${N} · niveau ${m("lv")} · K.O. ${m("kills")} · équipe ${m("team")} · évolutions finales ${m("evo")}`);
  const rb = res.filter(r=>r.reached);
  if(rb.length) console.log(`          boss atteint ${rb.length}/${N} · survie face au boss ${(rb.reduce((a,r)=>a+r.bossSurv,0)/rb.length).toFixed(0)} s · vie restante au boss ${(rb.reduce((a,r)=>a+r.bossLeft,0)/rb.length*100).toFixed(0)} %`);
}

/* faille profonde : un tres bon joueur, une Archive au maximum. Elle doit toujours finir par gagner. */
if(process.argv[3] === "deep"){
  S.breche = S.breche || {}; S.breche.upg = {hp:5, might:5, speed:5, magnet:5, regen:3, luck:3, reroll:3, choice:1, revive:1};
  const res = [];
  for(let k = 0; k < N; k++) res.push(run("joueur", 5000 + k * 104729, {deep:true}));
  const deepRuns = res.filter(r=>r.depth > 0);
  console.log(`faille profonde (Archive au maximum) : ${deepRuns.length}/${N} y descendent`);
  if(deepRuns.length){
    const ds = deepRuns.map(r=>r.depth).sort((a,b)=>a-b), ts = deepRuns.map(r=>r.t).sort((a,b)=>a-b);
    console.log(`          profondeur atteinte : min ${ds[0]} · médiane ${ds[ds.length>>1]} · max ${ds[ds.length-1]}`);
    console.log(`          durée totale : médiane ${Math.floor(ts[ts.length>>1]/60)} min · max ${Math.floor(ts[ts.length-1]/60)} min · toutes terminées : ${deepRuns.every(r=>r.t < 3990) ? "oui" : "NON"}`);
  }
}
