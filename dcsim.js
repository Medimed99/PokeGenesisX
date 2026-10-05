/* Descentes completes en mode automatique : taux de reussite, etage atteint, duree, niveaux.
   node dcsim.js [nombre] */
require('./harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };
for(let i = 1; i <= 386; i++) if(!isExclusive(i)) addToDex(i, 30, false);
function runOne(team, seed, hab, endless){
  const D = dcNewRun({region:"kanto", hab:hab || "route", team, seed, endless:!!endless});
  let guard = 0; const ring = [];
  while(!D.over && guard++ < (endless ? 12000 : 4000)){
    { const L0 = dcLeader(D), a0 = dcAutoLeader(D); D.autoGoal = D.autoGoal; ring.push(`t${D.turn} é${D.floor} meneur ${L0.x},${L0.y} ${a0.k} ${a0.x ?? ""},${a0.y ?? ""}${a0.descend ? " esc" : ""}`); if(ring.length > 6) ring.shift(); }
    if(D.recruitAsk) dcAcceptRecruit(D, true);
    if(D.shopOpen){ for(const k of ["revive","potion","sitrus","nigma"]){ const i = (D.shop || []).findIndex(o=>o.k === k && !o.sold); if(i >= 0) dcBuy(D, i); } D.shopOpen = false; }
    const a = dcAutoLeader(D), L = dcLeader(D);
    if(a.k === "attack" || a.k === "item"){ if(dcTurn(D, a)) continue; }
    if(a.k === "goto"){
      if(L.x === a.x && L.y === a.y && a.descend){ dcDescend(D, dcAutoDoor(D));
        if(D.floor === DC_FLOORS){ D.t5 = D.turn; const al = D.ents.filter(e=>e.side === "ally" && e.hp > 0); D.arrive = {n:al.length, hp:Math.round(al.reduce((s2, e)=>s2 + e.hp / e.maxHp, 0) / Math.max(1, al.length) * 100), lv:Math.max(...al.map(e=>e.lv))}; }
        continue; }
      const p = dcPath(D, L.x, L.y, a.x, a.y, L);
      if(p && p.length && dcTurn(D, {k:"move", dx:p[0][0] - L.x, dy:p[0][1] - L.y})) continue;
    }
    dcTurn(D, {k:"wait"});
  }
  const allies = D.ents.filter(e=>e.side === "ally");
  global.__lastD = D; global.__ring = ring;
  const bb = D.ents.find(e=>e.uid === D.boss);
  const bossEnd = D.floor === DC_FLOORS ? {pct:bb ? Math.round(bb.hp / bb.maxHp * 100) : 0, phase:D.scen && D.scen.phase, pyl:D.ents.filter(e=>e.pylon && e.hp > 0).length, turns:D.turn - (D.t5 || 0), id:bb ? POKE[bb.id].name : "-"} : null;
  return {bossEnd, arrive:D.arrive, money:D.money, bag:D.bag.length, held:allies.filter(a=>a.held).length, won:D.over === "won", floor:D.floor, turns:D.turn, kos:D.kos, rec:D.recruits.length, lv:D.maxLv || 6, stuck:!D.over};
}
const N = +process.argv[2] || 20;
for(const [name, team] of [["starters", [4, 7, 1]], ["équipe forte", [149, 65, 130]]]){
  const res = []; for(let k = 0; k < N; k++) res.push(runOne(team, 4242 + k * 7919));
  const med = a => a.slice().sort((p, q)=>p - q)[a.length >> 1];
  console.log(`${name.padEnd(13)} gardien vaincu ${res.filter(r=>r.won).length}/${N} · étage médian ${med(res.map(r=>r.floor))} · tours ${med(res.map(r=>r.turns))}`
    + ` · K.O. ${med(res.map(r=>r.kos))} · recrues ${med(res.map(r=>r.rec))} · niveau max ${med(res.map(r=>r.lv))} · bloquées ${res.filter(r=>r.stuck).length}`);
}
if(process.argv[3] === "detail"){
  for(let k = 0; k < 10; k++){
    const r = runOne([149, 65, 130], 4242 + k * 7919);
    console.log(`  run ${k}: étage ${r.floor} · ${r.won ? "VICTOIRE" : r.stuck ? "BLOQUÉE" : "défaite"} · tours ${r.turns} · K.O. ${r.kos}`);
  }
}

if(process.argv[3] === "stuck"){
  for(let k = 0; k < 40; k++){ const r = runOne([149, 65, 130], 900 + k * 31);
    if(r.stuck){ const D = global.__lastD; console.log("BLOQUÉE :\n  " + global.__ring.join("\n  "));
      const L = dcLeader(D); console.log("  voisins :", DC_DIRS.map(([dx,dy])=>{ const x=L.x+dx,y=L.y+dy; const o=D.ents.find(e=>e.hp>0&&e.x===x&&e.y===y); return dcTile(D,x,y)===0?"#":o?(o.side==="ally"?"A":"E"):"."; }).join(""), "· autoGoal", JSON.stringify(D.autoGoal), "· escalier", JSON.stringify(D.stairs));
      break; } }
}

if(process.argv[3] === "arrive"){
  const res = []; for(let k = 0; k < 20; k++) res.push(runOne([149, 65, 130], 4242 + k * 7919));
  const a = res.filter(r=>r.arrive);
  console.log(`arrivées au gardien : ${a.length}/20 · Pokémon debout ${a.map(r=>r.arrive.n).join(",")} · PV moyens ${a.map(r=>r.arrive.hp + "%").join(",")} · niveau ${a.map(r=>r.arrive.lv).join(",")}`);
  console.log(`victoires parmi les arrivées : ${a.filter(r=>r.won).length}`);
  for(const r of a.slice(0, 8)) console.log(`   ${r.won ? "VICTOIRE" : "défaite"} · ${r.bossEnd.id} · acte ${r.bossEnd.phase} · gardien ${r.bossEnd.pct}% · pylônes ${r.bossEnd.pyl} · ${r.bossEnd.turns} tours`);
}

if(process.argv[3] === "endless"){
  const res = []; for(let k = 0; k < 12; k++) res.push(runOne([149, 65, 130], 5150 + k * 7919, "route", true));
  const fl = res.map(r=>r.floor).sort((a, b)=>a - b);
  console.log(`sans fond (équipe forte) : étage médian ${fl[fl.length >> 1]} · max ${fl[fl.length - 1]} · bloquées ${res.filter(r=>r.stuck).length}`);
}
