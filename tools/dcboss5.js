require('/home/claude/pcg/harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };
for(let i = 1; i <= 151; i++) if(!isExclusive(i)) addToDex(i, 30, false);
for(const seed of [22, 33, 44]){
  const D = dcNewRun({region:"kanto", hab:"route", team:[149,65,130], seed});
  for(const a of D.ents) if(a.side === "ally"){ a.lv = 15; a._f = null; dcFighter(a); a.hp = a.maxHp; }
  D.floor = DC_FLOORS - 1; dcDescend(D);
  const b = D.ents.find(e=>e.uid === D.boss);
  const marks = [];
  let lastPhase = 1;
  for(let n = 0; n < 300 && !D.over; n++){
    const a = dcAutoLeader(D), L = dcLeader(D);
    if(a.k === "attack" || a.k === "item"){ if(!dcTurn(D, a)) dcTurn(D, {k:"wait"}); }
    else if(a.k === "goto"){ const p = dcPath(D, L.x, L.y, a.x, a.y, L); if(p && p.length) dcTurn(D, {k:"move", dx:p[0][0]-L.x, dy:p[0][1]-L.y}); else dcTurn(D, {k:"wait"}); }
    else dcTurn(D, {k:"wait"});
    if(D.scen.phase !== lastPhase){ lastPhase = D.scen.phase; marks.push(`t${D.turn}: acte ${lastPhase} (équipe ${D.ents.filter(e=>e.side==="ally"&&e.hp>0).map(e=>Math.round(e.hp/e.maxHp*100)+"%").join(" ")})`); }
  }
  const pyl = D.ents.filter(e=>e.pylon && e.hp > 0).length;
  console.log(`${POKE[b.id].name} · ${D.over || "en cours"} en ${D.turn} tours · gardien ${Math.round(b.hp/b.maxHp*100)}% · pylônes debout ${pyl}`);
  console.log("   " + (marks.join(" · ") || "aucun changement d'acte"));
}
