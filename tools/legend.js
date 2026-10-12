/* Signatures des legendaires : meme banc d'essai, parametres propres, cible 1,8 × une attaque ordinaire */
const fs = require("fs");
require('/home/claude/pcg/harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };
for(let i = 1; i <= 151; i++) if(!isExclusive(i)) addToDex(i, 30, false);
function measure(arch, crowd){
  const R = brNewRun({region:"kanto", hab:"route", starter:4, seed:7});
  R.W = 390; R.H = 700; R.dpr = 1; BR = R;
  const rng = brRng(99), n = crowd ? 30 : 1;
  for(let j = 0; j < n; j++){ const f = brSpawnFoe(R, 19, "n"); const a = rng() * 6.28, d = 180 + rng() * 160; f.x = Math.cos(a) * d; f.y = Math.sin(a) * d; f.hp = f.max = 1e9; }
  const orig = brArchFor(4); BR_ARCH_CACHE[4] = arch;
  for(let s = 0; s < 600; s++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.spawnAcc = -1e9; R.hp = R.maxHp; R.inv = 1; brUpdate(R, 1/30); R.modal = false; R.choices = null; R.pendingLevels = 0; R.chestsPending = 0; }
  BR_ARCH_CACHE[4] = orig;
  return (R.dmgBy[0] || 0) / 20;
}
/* reference : la mediane des formes ordinaires */
const reg = Object.keys(BR_KIND).filter(k=>!["metro","sing","storm","wall"].includes(k))
  .map(k=>{ const a = Object.assign({}, brArchFor(4), {k, p:{}, dmg:BR_KIND[k].dmg, cd:BR_KIND[k].cd}); return [measure(a, true), measure(a, false)]; });
const med = a => { const x = a.slice().sort((p, q)=>p - q); return x[x.length >> 1]; };
const mc = med(reg.map(r=>r[0])), ms = med(reg.map(r=>r[1]));
const p = "/home/claude/pcg/src/59a-breche-attacks.js";
let src = fs.readFileSync(p, "utf8");
const lines = [];
for(const id of Object.keys(BR_LEGEND).map(Number)){
  const L = BR_LEGEND[id], a = {k:L.k, n:L.n, n2:L.n2, c:L.c, dmg:L.dmg, cd:L.cd, p:L.p, sig:true};
  const ix = measure(a, true) / mc * 0.6 + measure(a, false) / ms * 0.4;
  const nd = Math.round(L.dmg * Math.max(0.2, Math.min(4, 1.8 / ix)) * 10) / 10;
  lines.push(`${POKE[id].name} ${ix.toFixed(2)} → ${L.dmg}→${nd}`);
  src = src.replace(new RegExp(`(\\n  ${id}: \\{[^\\n]*?dmg:)([\\d.]+)`), `$1${nd}`);
}
fs.writeFileSync(p, src);
console.log(lines.join("\n"));
