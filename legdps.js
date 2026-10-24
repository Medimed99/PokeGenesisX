/* Puissance des 21 attaques signatures des légendaires, dans les conditions de brdps.js
   (horde de 30, puis cible unique, 20 s, l'Archiviste invulnérable et immobile).
   L'indice compare chaque signature à la médiane des formes ordinaires mesurées dans les
   mêmes conditions : 1,00 = une attaque commune ; la cible visée est autour de 2.
   Quatre conditions, parce qu'une signature doit rester juste toute la run :
     niveau 1, niveau 8 (portée, cadence, projectiles en plus), puis éveillée (catalyseur).
   Usage : node legdps.js            les quatre conditions
           LV=8 STAGE=2 node legdps.js   une seule condition */
require('./harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };
for(let i = 1; i <= 151; i++) if(!isExclusive(i)) addToDex(i, 30, false);
function measure(arch, crowd, lv, stage){
  const R = brNewRun({region:"kanto", hab:"route", starter:4, seed:7});
  R.W = 390; R.H = 700; R.dpr = 1; BR = R;
  const rng = brRng(99);
  const n = crowd ? 30 : 1;
  for(let j = 0; j < n; j++){
    const f = brSpawnFoe(R, 19, "n");
    const a = rng() * 6.28, d = 180 + rng() * 160;
    f.x = Math.cos(a) * d; f.y = Math.sin(a) * d; f.hp = f.max = 1e9;
  }
  R.team[0].lv = lv; R.team[0].stage = stage;
  const orig = brArchFor(4);
  BR_ARCH_CACHE[4] = arch;
  for(let s = 0; s < 20 * 30; s++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.spawnAcc = -1e9; R.hp = R.maxHp; R.inv = 1; brUpdate(R, 1/30); R.modal = false; R.choices = null; R.pendingLevels = 0; R.chestsPending = 0; }
  BR_ARCH_CACHE[4] = orig;
  return (R.dmgBy[0] || 0) / 20;
}
const plain = k => ({k, p:{}, dmg:BR_KIND[k].dmg, cd:BR_KIND[k].cd});
const base = Object.keys(BR_KIND).filter(k=>k !== "metro" && !(typeof BR_LEG_KIND !== "undefined" && BR_LEG_KIND[k]));
const med = a => { const s = a.slice().sort((x, y)=>x - y); return s[s.length >> 1]; };
const CONDS = process.env.LV || process.env.STAGE ? [[+process.env.LV || 1, +process.env.STAGE || 0]] : [[1, 0], [8, 0], [1, 2], [8, 2]];
const ids = Object.keys(BR_LEGEND).map(Number), table = {};
for(const [lv, stage] of CONDS){
  const mc = med(base.map(k=>measure(plain(k), true, lv, stage))), ms = med(base.map(k=>measure(plain(k), false, lv, stage)));
  console.log(`niveau ${lv}${stage ? ", éveillé" : ""} — médiane des formes ordinaires : horde ${Math.round(mc)} · cible ${Math.round(ms)}`);
  for(const id of ids){
    delete BR_ARCH_CACHE[id];
    const A = Object.assign({}, brArchFor(id));
    const c = measure(A, true, lv, stage) / mc, s = measure(A, false, lv, stage) / ms;
    (table[id] = table[id] || []).push([c, s, c * 0.6 + s * 0.4]);
  }
}
const head = CONDS.map(([lv, st])=>(`niv. ${lv}${st ? " év." : ""}`).padStart(18)).join("");
console.log("\n" + "".padEnd(26) + head + "   moyenne");
const rows = ids.map(id=>[id, table[id].reduce((a, r)=>a + r[2], 0) / table[id].length]).sort((a, b)=>b[1] - a[1]);
for(const [id, mean] of rows)
  console.log(String(id).padStart(3), POKE[id].name.padEnd(10), brArchFor(id).k.padEnd(11),
    table[id].map(([c, s, i])=>`${c.toFixed(2)}/${s.toFixed(2)}=${i.toFixed(2)}`.padStart(18)).join(""), mean.toFixed(2).padStart(9));
console.log("\nhorde/cible=indice (indice = 0,6 × horde + 0,4 × cible)");
