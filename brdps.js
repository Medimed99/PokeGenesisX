/* Puissance de chaque forme d'attaque, a conditions egales : horde et cible unique.
   Sert a equilibrer les 29 formes entre elles. */
require('./harness');
global.setTimeout = f => { try { f(); } catch(e){} return 0; };
for(let i = 1; i <= 151; i++) if(!isExclusive(i)) addToDex(i, 30, false);
function measure(k, crowd){
  const R = brNewRun({region:"kanto", hab:"route", starter:4, seed:7});
  R.W = 390; R.H = 700; R.dpr = 1; BR = R;
  const rng = brRng(99);
  /* conditions reelles : les ennemis avancent vers l'equipe ; l'Archiviste est invulnerable */
  const n = crowd ? 30 : 1;
  for(let j = 0; j < n; j++){
    const f = brSpawnFoe(R, 19, "n");
    const a = rng() * 6.28, d = 180 + rng() * 160;
    f.x = Math.cos(a) * d; f.y = Math.sin(a) * d; f.hp = f.max = 1e9;
  }
  const w = R.team[0];
  /* on force la forme etudiee sur l'arme du depart */
  const orig = brArchFor(4);
  BR_ARCH_CACHE[4] = Object.assign({}, orig, {k, p:{}, dmg:BR_KIND[k].dmg, cd:BR_KIND[k].cd});
  for(let s = 0; s < 20 * 30; s++){ R.joy = {dx:0, dy:0}; R.keys = {}; R.spawnAcc = -1e9; R.hp = R.maxHp; R.inv = 1; brUpdate(R, 1/30); R.modal = false; R.choices = null; R.pendingLevels = 0; R.chestsPending = 0; }
  BR_ARCH_CACHE[4] = orig;
  return (R.dmgBy[0] || 0) / 20;
}
const rows = [];
for(const k of Object.keys(BR_KIND)){ if(k === "metro") continue; rows.push([k, measure(k, true), measure(k, false)]); }
const med = a => { const s = a.slice().sort((x, y)=>x - y); return s[s.length >> 1]; };
const mc = med(rows.map(r=>r[1])), ms = med(rows.map(r=>r[2]));
for(const [k, c, s] of rows.sort((a, b)=>(b[1] / mc + b[2] / ms) - (a[1] / mc + a[2] / ms)))
  console.log(k.padEnd(9), "horde", String(Math.round(c)).padStart(6), (c / mc).toFixed(2).padStart(6), "· cible", String(Math.round(s)).padStart(5), (s / ms).toFixed(2).padStart(6),
    "· indice", ((c / mc) * 0.6 + (s / ms) * 0.4).toFixed(2));
