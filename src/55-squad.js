/* ============================================================
   55 — LA TOUR : combats d'équipe, à la manière de Summoners War
   Une équipe de quatre Pokémon de l'archive, à leur niveau
   d'archive. Le premier est le meneur : s'il a un passif de
   meneur, toute l'équipe en profite. Chaque Pokémon a trois
   compétences tirées de ses types : une attaque de base, une
   compétence à recharge, une ultime. Une jauge de tour se remplit
   selon la Vitesse : le plus rapide joue plus souvent.

   Six ailes, sept paliers chacune en trois difficultés, trois
   vagues par palier ; le septième porte le boss de l'aile, et
   les ailes 2, 4 et 6 sont couronnées d'un verrou légendaire. Les compétences montent avec des
   parchemins, que seule la Tour donne : c'est sa place dans la
   progression du jeu.

   Ce fichier est le moteur (pur, testable) ; l'écran est en 55b.
   ============================================================ */

const SQ_ZONES = [
  {k:"jade",     n:"Forêt de Jade",  types:[7, 12, 1],  boss:15,  c:"#5ce07a", biome:"foret",    x:18, y:78},
  {k:"selenite", n:"Mont Sélénite",  types:[6, 5, 4],   boss:95,  c:"#c9a86a", biome:"grotte",   x:52, y:66},
  {k:"centrale", n:"Centrale",       types:[13, 9, 1],  boss:101, c:"#ffe45e", biome:"centrale", x:82, y:52},
  {k:"tour",     n:"Tour Pokémon",   types:[8, 14, 4],  boss:94,  c:"#9b6bff", biome:"faille",   x:50, y:38},
  {k:"ecume",    n:"Îles Écume",     types:[11, 15],    boss:131, c:"#58a8e8", biome:"plage",    x:18, y:24},
  {k:"victoire", n:"Route Victoire", types:[16, 2, 6],  boss:149, c:"#ff7a3d", biome:"volcan",   x:62, y:12}
];
/* comme dans Summoners War : sept paliers par zone, le septieme est le boss ;
   trois difficultes, chacune ouverte par le boss de la precedente */
const SQ_STAGES = 7;
const SQ_TEAM = 4;
const SQ_DIFFS = [{n:"Normal", c:"#5ce07a", lv:0, k:1}, {n:"Difficile", c:"#ffc857", lv:16, k:1.12}, {n:"Enfer", c:"#ff3d7f", lv:32, k:1.25}];
function sqStageLevel(z, s, d){ return Math.round(6 + z * 10 + s * 1.5 + (SQ_DIFFS[d || 0] || SQ_DIFFS[0]).lv); }

/* ============================================================
   1. LES COMPÉTENCES — trois par espèce, tirées de ses types
   fx : brn, psn (dégâts par tour), stun (passe son tour), slow,
   defdn, atkdn (sur la cible) ; atkup, defup, spdup, shield,
   heal, cleanse (sur soi ou l'équipe) ; atb+ / atb- (jauge).
   ============================================================ */
const SQ_BASIC_FX = {
  4:[{k:"psn", p:0.25, t:2}], 10:[{k:"brn", p:0.15, t:2}], 13:[{k:"stun", p:0.1, t:1}],
  15:[{k:"slow", p:0.2, t:2}], 14:[{k:"atb-", p:0.2, v:15}], 7:[{k:"atkdn", p:0.15, t:2}],
  2:[{k:"defdn", p:0.15, t:2}], 8:[{k:"defdn", p:0.15, t:2}]
};
const SQ_S2 = {
  1: {n:"Frappe Atlas",   kind:"atk", mult:1.7, cd:3, fx:[{k:"stun", p:0.2, t:1}]},
  2: {n:"Close Combat",   kind:"atk", mult:2.0, cd:3, fx:[{k:"defdn", p:0.6, t:2}]},
  3: {n:"Aéropique",      kind:"atk", mult:1.5, cd:3, fx:[{k:"atb+", self:true, v:35}]},
  4: {n:"Bomb-Beurk",     kind:"atk", mult:1.3, cd:3, fx:[{k:"psn", p:0.75, t:3}]},
  5: {n:"Séisme",         kind:"aoe", mult:1.0, cd:4, fx:[]},
  6: {n:"Éboulement",     kind:"aoe", mult:0.9, cd:4, fx:[{k:"stun", p:0.15, t:1}]},
  7: {n:"Dard-Nuée",      kind:"atk", mult:1.8, hits:3, cd:3, fx:[{k:"atkdn", p:0.4, t:2}]},
  8: {n:"Ball'Ombre",     kind:"atk", mult:1.6, cd:3, fx:[{k:"pierce"}, {k:"defdn", p:0.3, t:2}]},
  9: {n:"Mur de Fer",     kind:"team", cd:4, fx:[{k:"defup", t:2}, {k:"shield", v:0.1, t:2}]},
  10:{n:"Lance-Flammes",  kind:"atk", mult:1.6, cd:3, fx:[{k:"brn", p:0.5, t:2}]},
  11:{n:"Surf",           kind:"aoe", mult:1.0, cd:4, fx:[{k:"slow", p:0.3, t:2}]},
  12:{n:"Synthèse",       kind:"team", cd:4, fx:[{k:"heal", v:0.22}]},
  13:{n:"Tonnerre",       kind:"atk", mult:1.6, cd:3, fx:[{k:"stun", p:0.3, t:1}]},
  14:{n:"Psyko",          kind:"atk", mult:1.6, cd:3, fx:[{k:"atb-", p:1, v:40}]},
  15:{n:"Laser Glace",    kind:"atk", mult:1.5, cd:3, fx:[{k:"stun", p:0.3, t:1}, {k:"slow", p:0.5, t:2}]},
  16:{n:"Danse Draco",    kind:"team", cd:4, fx:[{k:"atkup", t:2}, {k:"atb+", v:15}]},
  17:{n:"Machination",    kind:"atk", mult:1.8, cd:3, fx:[{k:"crit", v:0.35}]},
  18:{n:"Vœu Soin",       kind:"team", cd:4, fx:[{k:"heal", v:0.16}, {k:"cleanse"}]}
};
const SQ_S3 = {
  1: {n:"Ultralaser",       kind:"atk", mult:3.2, cd:5, fx:[]},
  2: {n:"Dynamo-Poing",     kind:"atk", mult:2.6, cd:5, fx:[{k:"stun", p:0.6, t:1}]},
  3: {n:"Rapace",           kind:"atk", mult:2.6, cd:5, fx:[{k:"spdup", team:true, t:2}]},
  4: {n:"Toxik",            kind:"aoe", mult:0.9, cd:5, fx:[{k:"psn", p:1, t:3}]},
  5: {n:"Tunnel",           kind:"atk", mult:2.5, cd:5, fx:[{k:"pierce"}, {k:"defdn", p:0.8, t:2}]},
  6: {n:"Abri Rocheux",     kind:"team", cd:5, fx:[{k:"shield", v:0.25, t:2}, {k:"defup", t:2}]},
  7: {n:"Mégacorne",        kind:"atk", mult:3.0, cd:5, fx:[]},
  8: {n:"Malédiction",      kind:"aoe", mult:0.8, cd:5, fx:[{k:"atb-", p:1, v:30}, {k:"defdn", p:0.5, t:2}]},
  9: {n:"Luminocanon",      kind:"aoe", mult:1.2, cd:5, fx:[{k:"defdn", p:0.4, t:2}]},
  10:{n:"Déflagration",     kind:"aoe", mult:1.3, cd:5, fx:[{k:"brn", p:0.5, t:2}]},
  11:{n:"Hydrocanon",       kind:"atk", mult:3.0, cd:5, fx:[]},
  12:{n:"Lance-Soleil",     kind:"aoe", mult:1.2, cd:5, fx:[{k:"heal", team:true, v:0.1}]},
  13:{n:"Fatal-Foudre",     kind:"aoe", mult:1.1, cd:5, fx:[{k:"stun", p:0.25, t:1}]},
  14:{n:"Rafale Psy",       kind:"aoe", mult:1.0, cd:5, fx:[{k:"atb-", p:1, v:40}]},
  15:{n:"Blizzard",         kind:"aoe", mult:1.1, cd:5, fx:[{k:"stun", p:0.25, t:1}]},
  16:{n:"Draco-Météore",    kind:"atk", mult:3.4, cd:5, fx:[]},
  17:{n:"Vibrobscur",       kind:"aoe", mult:1.1, cd:5, fx:[{k:"atkdn", p:0.5, t:2}]},
  18:{n:"Force Lunaire",    kind:"aoe", mult:1.0, cd:5, fx:[{k:"heal", team:true, v:0.2}]}
};
const SQ_SKILL_MAX = 5;
const SQ_SKILL_COST = [0, 3, 5, 8, 12];          /* parchemins pour passer au niveau suivant */

function sqSkillsOf(id){
  const p = POKE[id], t1 = p.types[0], t2 = p.types[1] || t1;
  const tier = p.bst >= 480 ? 2 : p.bst >= 380 ? 1 : 0;
  /* la competence a recharge suit le type principal, l'ultime le second (s'il existe) */
  const s2 = Object.assign({t:t1}, SQ_S2[t1]);
  const s3 = Object.assign({t:t2}, SQ_S3[t2]);
  /* l'attaque de base ne porte jamais le nom d'une autre competence du meme Pokemon */
  const pool = MOVE_POOL[t1];
  let b = pool[tier];
  for(let k = tier; k >= 0 && (b.name === s2.n || b.name === s3.n); k--) b = pool[k];
  if(b.name === s2.n || b.name === s3.n) b = pool.find(m=>m.name !== s2.n && m.name !== s3.n) || b;
  const basic = {n:b.name, t:t1, kind:"atk", mult:1.0, cd:0, fx:(SQ_BASIC_FX[t1] || []).slice()};
  return [basic, s2, s3];
}
/* un niveau de competence : +8% d'effet par niveau, recharge -1 au maximum */
function sqSkillLv(id){
  const st = sqState(), r = lineRoot(id);
  return (st.sk[r] || [1, 1, 1]).slice();
}
function sqApplyLv(sk, lv){
  const s = Object.assign({}, sk);
  if(s.mult) s.mult = +(s.mult * (1 + 0.08 * (lv - 1))).toFixed(3);
  if(s.cd && lv >= SQ_SKILL_MAX) s.cd = Math.max(2, s.cd - 1);
  s.lv = lv;
  return s;
}

/* ============================================================
   2. LE PASSIF DE MENEUR
   Les Pokémon puissants (formes finales, légendaires) en ont un,
   tiré de leur meilleure statistique.
   ============================================================ */
const SQ_LEAD_NAMES = {atk:"Attaque", def:"Défense", hp:"PV", spd:"Vitesse", crit:"Taux critique"};
function sqLeaderOf(id){
  const p = POKE[id];
  if(!p || (p.bst < 470 && !p.leg)) return null;
  const leg = p.leg ? 1 : 0;
  const st = [["atk", Math.max(p.atk, p.spa)], ["def", (p.def + p.spd) / 2 * 1.05], ["hp", p.hp * 1.1], ["spd", p.spe * 1.08]];
  st.sort((a, b) => b[1] - a[1]);
  let k = st[0][0];
  if((p.types.includes(17) || p.types.includes(16)) && k === "atk" && p.bst >= 500) k = "crit";
  const v = {atk:0.18, def:0.22, hp:0.2, spd:0.15, crit:0.12}[k] + (leg ? 0.06 : 0);
  return {k, v:+v.toFixed(2)};
}
function sqLeaderText(L){
  if(!L) return "Aucun passif de meneur.";
  return `${SQ_LEAD_NAMES[L.k]} de l'équipe +${Math.round(L.v * 100)}\u00a0%`;
}

/* ============================================================
   3. L'ÉTAT SAUVEGARDÉ
   ============================================================ */
function sqState(){
  S.squad = S.squad || {team:[], z:{}, scrolls:0, sk:{}, auto:false, speed:1, clears:0};
  const q = S.squad;
  q.z = q.z || {}; q.sk = q.sk || {}; q.team = q.team || [];
  q.st = q.st || {};
  /* premiere version (huit paliers, une difficulte) : les etoiles passent en Normal */
  if(!q.v2){ for(const z in q.z) for(const st in q.z[z]) if(+st < SQ_STAGES) q.st[`0:${z}:${st}`] = q.z[z][st]; q.v2 = true; }
  return q;
}
function sqStars(z, s, d){ return sqState().st[`${d || 0}:${z}:${s}`] || 0; }
function sqDiffOpen(z, d){ return !d || sqStars(z, SQ_STAGES - 1, d - 1) > 0; }
function sqZoneOpen(z, d){ return sqDiffOpen(z, d) && (z === 0 || sqStars(z - 1, SQ_STAGES - 1, d) > 0 || (d > 0 && sqStars(z, 0, d) > 0)); }
function sqStageOpen(z, s, d){ return sqZoneOpen(z, d) && (s === 0 || sqStars(z, s - 1, d) > 0); }
function sqZoneStars(z, d){ let n = 0; for(let s = 0; s < SQ_STAGES; s++) n += sqStars(z, s, d); return n; }
function sqBestStage(){
  let best = 0;
  for(let d = 0; d < SQ_DIFFS.length; d++) SQ_ZONES.forEach((_, z) => { for(let s = 0; s < SQ_STAGES; s++)
    if(sqStars(z, s, d)) best = Math.max(best, d * SQ_ZONES.length * SQ_STAGES + z * SQ_STAGES + s + 1); });
  return best;
}
/* l'experience de la Tour fait monter le niveau d'archive, comme dans Summoners War */
function sqXpNeed(lv){ return 30 + lv * 14; }
function sqGiveXp(id, xp){
  const d = S.dex[id]; if(!d) return null;
  const from = d.lvl;
  d.sxp = (d.sxp || 0) + xp;
  while(d.lvl < 100 && d.sxp >= sqXpNeed(d.lvl)){ d.sxp -= sqXpNeed(d.lvl); d.lvl++; }
  if(d.lvl >= 100) d.sxp = 0;
  return {id, from, to:d.lvl, xp, frac:d.lvl >= 100 ? 1 : d.sxp / sqXpNeed(d.lvl)};
}

/* ============================================================
   4. LES COMBATTANTS
   ============================================================ */
function sqUnit(id, level, side, opts){
  opts = opts || {};
  const f = makeFighter(id, level, {shiny:opts.shiny, owned:side === "ally"});
  if(side === "ally" && typeof applyTowerBuffs === "function") applyTowerBuffs(lineRoot(id), f);
  /* les monstres d'une carte sont moins solides qu'un Pokemon d'archive ; le boss compense */
  const foeK = side === "foe" ? (opts.boss ? 1 : 0.72) : 1;
  const hpMul = (opts.boss ? 2.5 : 1) * 3 * foeK * (opts.guardian ? 1.05 * Math.min(1, Math.sqrt(580 / POKE[id].bst)) : 1);
  const lv = side === "ally" ? sqSkillLv(id) : [1 + (opts.slv || 0), 1 + (opts.slv || 0), 1 + (opts.slv || 0)];
  const skills = sqSkillsOf(id).map((s, i) => sqApplyLv(s, Math.min(SQ_SKILL_MAX, lv[i])));
  const u = {
    id, side, name:POKE[id].name, types:POKE[id].types, level:f.level, shiny:!!opts.shiny, boss:!!opts.boss,
    maxHp:Math.round(f.maxHp * hpMul), atk:Math.max(f.atk, f.spa) * (opts.boss ? 1.05 : foeK),
    def:(f.def + f.spd) / 2 * (side === "foe" && !opts.boss ? 0.85 : 1), spd:f.spe, crit:0.15, critDmg:1.5,
    skills, cds:[0, 0, 0], fx:[], gauge:0, shield:0
  };
  /* un verrou legendaire : plus vif, plus dur, insensible a l'etourdissement et aux pertes de jauge */
  if(opts.guardian){ u.guardian = true; u.atk *= Math.min(1, Math.sqrt(560 / POKE[id].bst)); }
  u.hp = u.maxHp;
  return u;
}
function sqApplyLeader(team){
  const L = team[0] ? sqLeaderOf(team[0].id) : null;
  if(!L) return null;
  for(const u of team){
    if(L.k === "atk") u.atk *= 1 + L.v;
    if(L.k === "def") u.def *= 1 + L.v;
    if(L.k === "spd") u.spd *= 1 + L.v;
    if(L.k === "crit") u.crit += L.v;
    if(L.k === "hp"){ u.maxHp = Math.round(u.maxHp * (1 + L.v)); u.hp = u.maxHp; }
  }
  return L;
}

/* les vagues d'un palier : deux vagues de la carte, puis le boss et sa garde */
function sqWaves(z, s, rnd, d){
  rnd = rnd || rng;
  const Z = SQ_ZONES[z], lv = sqStageLevel(z, s, d);
  const pickT = () => Z.types[Math.floor(rnd() * Z.types.length)];
  const mon = (l, top) => {
    if(typeof levelWildId === "function") return levelWildId(l, {type:pickT(), top});
    return wildIdFor(Math.min(11, Math.floor(l / 7)), {type:pickT()});
  };
  /* trois vagues ; au septieme palier, la derniere porte le boss de la zone */
  const waves = [];
  for(let w = 0; w < 3; w++){
    const W = [];
    const n = w === 0 ? 3 : w === 1 ? (s < 2 ? 3 : 4) : 3;
    if(w === 2 && s === SQ_STAGES - 1){
      W.push({id:mon(lv), lv}, {id:Z.boss, lv:lv + 2, boss:true, slv:1 + (d || 0)}, {id:mon(lv), lv});
    } else for(let i = 0; i < n; i++) W.push({id:mon(lv - 1 + w, w === 2 && i === 1), lv:lv - 1 + w});
    waves.push(W);
  }
  return waves;
}

/* ============================================================
   5. LE COMBAT
   ============================================================ */
function sqNewBattle(ids, z, s, opts){
  opts = opts || {};
  const d = opts.d || 0;
  const team = ids.filter(id => POKE[id]).slice(0, SQ_TEAM).map(id => {
    const d = S.dex[id];
    return sqUnit(id, (d && d.lvl) || 5, "ally", {shiny:d && d.shiny});
  });
  const lead = sqApplyLeader(team);
  const B = {z, s, d, wave:0, waves:opts.waves || sqWaves(z, s, null, d), allies:team, foes:[], lead, turn:0, over:false, result:null, ko:0, rnd:opts.rnd || rng,
             lock:opts.lock || null, sync:0, grp:0, loot:{coins:0, scrolls:0, candy:0}};
  sqLoadWave(B, 0);
  return B;
}
function sqLoadWave(B, w){
  B.wave = w;
  const k = B.lock ? 1 : (SQ_DIFFS[B.d || 0] || SQ_DIFFS[0]).k;
  B.foes = B.waves[w].map(m => { const u = sqUnit(m.id, m.lv, "foe", {boss:m.boss, slv:m.slv, guardian:m.guardian});
    if(k !== 1){ u.maxHp = Math.round(u.maxHp * k); u.hp = u.maxHp; u.atk *= k; } u._v = {}; return u; });
  /* l'equipe garde ses PV et ses effets, souffle un peu, et repart d'une jauge partielle */
  for(const u of B.allies){ u.gauge = Math.min(u.gauge, 50); if(w > 0 && u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.12)); }
  for(const u of B.foes) u.gauge = B.rnd() * 30;
}
const sqAlive = list => list.filter(u => u.hp > 0);
function sqHas(u, k){ return u.fx.some(e => e.k === k); }
function sqSpd(u){ return u.spd * (sqHas(u, "spdup") ? 1.3 : 1) * (sqHas(u, "slow") ? 0.7 : 1); }

/* qui joue : la jauge se remplit selon la Vitesse, le premier a 100 agit */
function sqNext(B){
  if(B.over) return null;
  const all = [...sqAlive(B.allies), ...sqAlive(B.foes)];
  if(!all.length) return null;
  let guard = 0;
  while(guard++ < 5000){
    const ready = all.filter(u => u.gauge >= 100);
    if(ready.length){
      ready.sort((a, b) => b.gauge - a.gauge || sqSpd(b) - sqSpd(a));
      return ready[0];
    }
    const step = Math.min(...all.map(u => (100 - u.gauge) / (sqSpd(u) * 0.07)));
    for(const u of all) u.gauge += sqSpd(u) * 0.07 * Math.max(0.01, step);
  }
  return all[0];
}

/* debut de tour : recharges, degats continus, etourdissement */
function sqTurnStart(B, u){
  const ev = [];
  u.cds = u.cds.map(c => Math.max(0, c - 1));
  for(const e of u.fx.filter(e => e.k === "brn" || e.k === "psn")){
    const dmg = Math.max(1, Math.round(u.maxHp * (e.k === "brn" ? 0.05 : 0.06)));
    u.hp = Math.max(0, u.hp - dmg);
    ev.push({k:"dot", tgt:u, dmg, b:e.k, hp:u.hp});
    if(u.hp <= 0){ ev.push({k:"ko", tgt:u}); sqLoot(B, u, ev); break; }
  }
  if(u.hp > 0 && sqHas(u, "stun")){
    ev.push({k:"stun", tgt:u});
    u.stunned = true;
  } else u.stunned = false;
  return ev;
}
/* fin de tour : les effets s'usent */
function sqTurnEnd(B, u){
  u.gauge = 0;
  for(const e of u.fx) e.t--;
  u.fx = u.fx.filter(e => e.t > 0);
  if(u.shield && !sqHas(u, "shield")) u.shield = 0;
  B.turn++;
}

function sqTargets(B, u, sk, ti){
  const enemies = u.side === "ally" ? sqAlive(B.foes) : sqAlive(B.allies);
  const friends = u.side === "ally" ? sqAlive(B.allies) : sqAlive(B.foes);
  if(sk.kind === "team") return friends;
  if(sk.kind === "aoe") return enemies;
  const list = u.side === "ally" ? B.foes : B.allies;
  const t = list[ti];
  return [t && t.hp > 0 ? t : enemies[0]].filter(Boolean);
}
function sqAddFx(u, k, t, extra){
  const cur = u.fx.find(e => e.k === k);
  if(cur){ cur.t = Math.max(cur.t, t); return; }
  u.fx.push(Object.assign({k, t}, extra || {}));
}
const SQ_HARMFUL = new Set(["brn", "psn", "stun", "slow", "defdn", "atkdn"]);

/* un coup : le calcul des degats, partage par les competences et la Synchro */
function sqStrike(B, u, t, sk, mult){
  const critBonus = (sk.fx.find(f => f.k === "crit") || {}).v || 0;
  const pierce = sk.fx.some(f => f.k === "pierce");
  const hits = sk.hits || 1;
  let total = 0, crit = false, eff = 1;
  for(let h = 0; h < hits && t.hp > 0; h++){
    eff = typeMult(sk.t, t.types);
    if(eff === 0) eff = 0.25;
    eff = Math.min(2, eff);
    const stab = u.types.includes(sk.t) ? 1.15 : 1;
    let A = u.atk * (sqHas(u, "atkup") ? 1.5 : 1) * (sqHas(u, "atkdn") ? 0.6 : 1);
    let D = t.def * (sqHas(t, "defup") ? 1.7 : 1) * (sqHas(t, "defdn") ? 0.3 : 1) * (pierce ? 0.5 : 1);
    const c = B.rnd() < u.crit + critBonus;
    crit = crit || c;
    let dmg = A * ((mult || sk.mult) / hits) * (100 / (100 + D * 1.1)) * eff * stab * (0.92 + B.rnd() * 0.16) * (c ? u.critDmg : 1);
    dmg = Math.max(1, Math.round(dmg));
    if(t.shield > 0){ const a = Math.min(t.shield, dmg); t.shield -= a; dmg -= a; }
    t.hp = Math.max(0, t.hp - dmg);
    total += dmg;
  }
  return {total, crit, eff, hits};
}
/* la Synchro : la jauge commune de l'equipe, nourrie par l'action */
const SQ_SYNC_MAX = 100;
function sqSyncGain(B, v){ if(B.over) return; B.sync = Math.min(SQ_SYNC_MAX, (B.sync || 0) + v); }
/* le butin : ce que lache un adversaire qui tombe */
function sqLoot(B, t, ev, g){
  if(t.side !== "foe" || t._looted) return;
  t._looted = true;
  B.loot = B.loot || {coins:0, scrolls:0, candy:0};
  const coins = Math.round((4 + t.level * 1.2) * (t.boss ? 6 : 1));
  const scroll = t.guardian ? 0 : t.boss ? 1 : (B.rnd() < 0.035 ? 1 : 0);
  const candy = B.rnd() < (t.boss ? 0.6 : 0.1) ? 1 : 0;
  B.loot.coins += coins; B.loot.scrolls += scroll; B.loot.candy += candy;
  ev.push({k:"loot", tgt:t, coins, scroll, candy, g:g || 0});
}

/* une action : la competence si, sur la cible ti */
function sqAct(B, u, si, ti){
  const sk = u.skills[si] && u.cds[si] === 0 ? u.skills[si] : u.skills[0];
  si = u.skills.indexOf(sk);
  const ev = [{k:"skill", src:u, si, sk}];
  if(sk.cd) u.cds[si] = sk.cd + 1;          /* +1 : le debut du prochain tour la decompte */
  const tg = sqTargets(B, u, sk, ti);
  const friends = u.side === "ally" ? B.allies : B.foes;
  /* une competence de zone frappe tout le monde en meme temps : ses evenements forment un groupe */
  const g = sk.kind === "aoe" ? ++B.grp : 0;
  const sync0 = B.sync || 0;
  if(sk.kind === "atk" || sk.kind === "aoe"){
    for(const t of tg){
      const r = sqStrike(B, u, t, sk);
      ev.push({k:"hit", src:u, tgt:t, dmg:r.total, crit:r.crit, eff:r.eff, hits:r.hits, hp:t.hp, sh:t.shield, ty:sk.t, g});
      if(u.side === "foe") sqSyncGain(B, 3);
      if(t.hp <= 0){ ev.push({k:"ko", tgt:t, g}); if(u.side === "ally") sqSyncGain(B, 10); sqLoot(B, t, ev, g); continue; }
      for(const f of sk.fx){
        if(f.self || f.team || f.k === "crit" || f.k === "pierce" || f.k === "heal") continue;
        if(f.p !== undefined && B.rnd() >= f.p) continue;
        if(t.guardian && (f.k === "stun" || f.k === "atb-")){ ev.push({k:"fx", tgt:t, b:"immune", g}); continue; }
        if(f.k === "atb-"){ t.gauge = Math.max(0, t.gauge - f.v); ev.push({k:"atb", tgt:t, v:-f.v, g}); }
        else { sqAddFx(t, f.k, f.t || 1); ev.push({k:"fx", tgt:t, b:f.k, g}); }
      }
    }
  }
  /* effets sur soi ou sur l'equipe */
  for(const f of sk.fx){
    const toTeam = sk.kind === "team" || f.team;
    if(!(f.self || toTeam)) continue;
    const list = f.self ? [u] : sqAlive(friends);
    for(const a of list){
      if(f.k === "heal"){ const v = Math.round(a.maxHp * f.v); a.hp = Math.min(a.maxHp, a.hp + v); ev.push({k:"heal", tgt:a, v, hp:a.hp}); }
      else if(f.k === "cleanse"){ const n = a.fx.length; a.fx = a.fx.filter(e => !SQ_HARMFUL.has(e.k)); if(a.fx.length < n) ev.push({k:"fx", tgt:a, b:"cleanse"}); }
      else if(f.k === "shield"){ a.shield = Math.max(a.shield, Math.round(a.maxHp * f.v)); sqAddFx(a, "shield", f.t); ev.push({k:"fx", tgt:a, b:"shield", sh:a.shield}); }
      else if(f.k === "atb+"){ if(a !== u){ a.gauge = Math.min(100, a.gauge + f.v); ev.push({k:"atb", tgt:a, v:f.v}); } else u.bonusAtb = f.v; }
      else { sqAddFx(a, f.k, f.t || 1); ev.push({k:"fx", tgt:a, b:f.k}); }
    }
  }
  if(u.side === "ally") sqSyncGain(B, si === 2 ? 4 : 7);
  sqTurnEnd(B, u);
  if(u.bonusAtb){ u.gauge = u.bonusAtb; u.bonusAtb = 0; }
  if((B.sync || 0) !== sync0) ev.push({k:"sync", v:B.sync});
  sqCheck(B, ev);
  return ev;
}
/* la Synchro, lancee au debut d'un tour allie, ne le consomme pas :
   toute l'equipe frappe la cible a la suite, puis repart avec de l'elan */
function sqSyncReady(B){ return !B.over && (B.sync || 0) >= SQ_SYNC_MAX && sqAlive(B.allies).length > 0 && sqAlive(B.foes).length > 0; }
function sqSync(B, ti){
  if(!sqSyncReady(B)) return [];
  B.sync = 0;
  const ev = [{k:"syncstart", n:sqAlive(B.allies).length}, {k:"sync", v:0}];
  const list = B.foes;
  let t = list[ti] && list[ti].hp > 0 ? list[ti] : sqAlive(B.foes)[0];
  for(const a of sqAlive(B.allies)){
    if(!t || t.hp <= 0) t = sqAlive(B.foes)[0];
    if(!t) break;
    const sk = Object.assign({}, a.skills[0], {fx:[]});
    ev.push({k:"skill", src:a, si:0, sk, sync:true});
    const r = sqStrike(B, a, t, sk, 1.35);
    ev.push({k:"hit", src:a, tgt:t, dmg:r.total, crit:r.crit, eff:r.eff, hits:r.hits, hp:t.hp, sh:t.shield, ty:sk.t, g:0});
    if(t.hp <= 0){ ev.push({k:"ko", tgt:t}); sqLoot(B, t, ev); }
  }
  /* l'elan : toute l'equipe avance sa jauge */
  for(const a of sqAlive(B.allies)){ a.gauge = Math.min(99, a.gauge + 20); ev.push({k:"atb", tgt:a, v:20}); }
  sqCheck(B, ev);
  return ev;
}
/* l'ordre des prochains tours, sans rien changer au combat */
function sqPredict(B, n){
  const all = [...sqAlive(B.allies), ...sqAlive(B.foes)].map(u => ({u, g:u.gauge}));
  const out = [];
  if(!all.length) return out;
  let guard = 0;
  while(out.length < n && guard++ < 400){
    const ready = all.filter(o => o.g >= 100);
    if(ready.length){
      ready.sort((a, b) => b.g - a.g || sqSpd(b.u) - sqSpd(a.u));
      out.push(ready[0].u); ready[0].g = 0; continue;
    }
    const step = Math.min(...all.map(o => (100 - o.g) / (sqSpd(o.u) * 0.07)));
    for(const o of all) o.g += sqSpd(o.u) * 0.07 * Math.max(0.01, step);
  }
  return out;
}
/* fin de vague, fin de combat */
function sqCheck(B, ev){
  sqPhase(B, ev);
  if(!sqAlive(B.allies).length){ B.over = true; B.result = false; ev.push({k:"end", win:false}); return; }
  if(!sqAlive(B.foes).length){
    if(B.wave < B.waves.length - 1){ sqLoadWave(B, B.wave + 1); ev.push({k:"wave", n:B.wave, foes:B.foes.slice()}); }
    else { B.over = true; B.result = true; ev.push({k:"end", win:true}); }
  }
}
/* un tour passe sans agir (etourdi) */
function sqSkip(B, u){
  const ev = [];
  sqTurnEnd(B, u);
  sqCheck(B, ev);
  return ev;
}

/* ============================================================
   6. L'IA — pour les adversaires et le mode automatique
   ============================================================ */
function sqAI(B, u){
  const enemies = u.side === "ally" ? B.foes : B.allies;
  const friends = sqAlive(u.side === "ally" ? B.allies : B.foes);
  const live = enemies.map((e, i) => [e, i]).filter(([e]) => e.hp > 0);
  let best = 0, bestScore = -1;
  u.skills.forEach((sk, i) => {
    if(u.cds[i] > 0) return;
    let sc = 1;
    if(sk.kind === "team"){
      const hurt = friends.filter(a => a.hp / a.maxHp < 0.6).length;
      const heal = sk.fx.some(f => f.k === "heal");
      sc = heal ? (hurt ? 2 + hurt : 0.2) : (friends.some(a => !sqHas(a, sk.fx[0].k)) ? 2.2 : 0.3);
    } else if(sk.kind === "aoe") sc = (sk.mult || 1) * live.length * 0.9;
    else sc = (sk.mult || 1) * 1.1;
    if(sc > bestScore){ bestScore = sc; best = i; }
  });
  /* la cible : faible au type, puis la plus entamee */
  const sk = u.skills[best];
  let ti = live.length ? live[0][1] : 0, ts = -1;
  for(const [e, i] of live){
    const sc = Math.min(2, typeMult(sk.t || u.types[0], e.types) || 0.25) * 2 + (1 - e.hp / e.maxHp) + (e.boss ? -0.3 : 0);
    if(sc > ts){ ts = sc; ti = i; }
  }
  return {si:best, ti};
}

/* ============================================================
   7. L'ISSUE — étoiles et récompenses
   ============================================================ */
function sqStarsFor(B){ const ko = B.allies.filter(u=>u.hp <= 0).length; return !B.result ? 0 : ko === 0 ? 3 : ko === 1 ? 2 : 1; }
function sqRewards(z, s, first, d){
  d = d || 0;
  const k = (first ? 1 : 0.4) * (1 + d * 0.6);
  return {
    coins:Math.round((180 + z * 140 + s * 35) * k),
    shards:Math.round((8 + z * 5 + (s === SQ_STAGES - 1 ? 10 : 0)) * k),
    scrolls:first ? 2 + Math.floor(z / 2) + d + (s === SQ_STAGES - 1 ? 2 : 0) : (rng() < 0.5 ? 1 : 0),
    xp:Math.round((90 + z * 50 + s * 12) * k)
  };
}
let SQ_WING_PENDING = null;
function sqWingFlush(){ const w = SQ_WING_PENDING; SQ_WING_PENDING = null; if(w && typeof momentWing === "function") momentWing(w.z, w.d); }
function sqFinish(B){
  if(B.lock) return sqLockFinish(B);
  const q = sqState(), stars = sqStarsFor(B);
  const prev = sqStars(B.z, B.s, B.d);
  const first = B.result && !prev;
  const rw = B.result ? sqRewards(B.z, B.s, first, B.d) : null;
  /* la premiere victoire du jour double les PokeCoins et les Fragments, et donne un parchemin */
  const fw = B.result && typeof consumeFirstWin === "function" ? consumeFirstWin("tower") : 1;
  if(rw && fw > 1){ rw.coins *= fw; rw.shards *= fw; rw.scrolls += 1; rw.fw = fw; }
  /* l'experience : chaque Pokemon de l'equipe, meme tombe, en gagne (moins s'il est tombe) */
  const lv = sqStageLevel(B.z, B.s, B.d);
  const base = Math.round((18 + lv * 3.2) * (B.result ? 1 : 0.35));
  const xps = B.allies.map(u => sqGiveXp(u.id, Math.round(base * (u.hp > 0 ? 1 : 0.5)))).filter(Boolean);
  const loot = sqLootGrant(B);
  if(B.result){
    q.st[`${B.d || 0}:${B.z}:${B.s}`] = Math.max(prev, stars);
    /* une aile franchie pour la premiere fois : un moment, a la sortie des resultats */
    if(!prev && B.s === SQ_STAGES - 1) SQ_WING_PENDING = {z:B.z, d:B.d || 0};
    /* une page au sommet d'une aile, ou parfois oubliee sur un palier */
    if(typeof fragOn === "function") fragOn("tower", B.s === SQ_STAGES - 1 ? `Au sommet de l'aile ${SQ_ZONES[B.z].n}` : `Sur un palier de l'aile ${SQ_ZONES[B.z].n}`, B.s === SQ_STAGES - 1 ? 1 : 0.15);
    q.clears = (q.clears || 0) + 1;
    S.daily.dayTower = (S.daily.dayTower || 0) + 1;
    if(typeof questTick === "function") questTick("dayTower", 1);
    gain("coins", rw.coins); gain("shards", rw.shards); addXp(rw.xp);
    q.scrolls += rw.scrolls;
    const T = typeof towerState === "function" ? towerState() : null;
    if(T){ T.best = Math.max(T.best || 0, sqBestStage()); S.stats.towerBest = Math.max(S.stats.towerBest || 0, T.best); }
  }
  save();
  return {stars, prev, first, rw, xps, loot};
}
/* le butin ramasse pendant le combat : tout en cas de victoire, les PokeCoins seuls en cas de defaite */
function sqLootGrant(B){
  if(B._lootDone) return B._lootDone;
  const L = Object.assign({coins:0, scrolls:0, candy:0}, B.loot || {});
  if(!B.result){ L.scrolls = 0; L.candy = 0; }
  if(L.coins) gain("coins", L.coins);
  if(L.scrolls) sqState().scrolls += L.scrolls;
  if(L.candy && typeof teamCandyGain === "function") teamCandyGain(L.candy);
  return B._lootDone = L;
}
/* monter une competence */
function sqUpgrade(id, si){
  const q = sqState(), r = lineRoot(id);
  const lv = q.sk[r] || [1, 1, 1];
  if(lv[si] >= SQ_SKILL_MAX) return false;
  const cost = SQ_SKILL_COST[lv[si]];
  if(q.scrolls < cost) return false;
  q.scrolls -= cost;
  lv[si]++;
  q.sk[r] = lv;
  save();
  return true;
}

/* ============================================================
   8. LES VERROUS LÉGENDAIRES — les Data Guardians, dans la Tour
   Trois par secteur. Chacun se tient au sommet d'une aile de la
   Tour : il faut avoir battu le boss de cette aile, dans la
   difficulté du secteur (Kanto en Normal, Johto en Difficile,
   Hoenn en Enfer), et avoir archivé assez d'espèces du secteur
   pour capter sa signature. Une vague d'escorte, puis lui seul ;
   à mi-vie il se reconfigure : purge, Attaque +, deux renforts.
   ============================================================ */
const SQ_LOCK_ZONES = [1, 3, 5];
function sqLockGate(r, i){ return {z:SQ_LOCK_ZONES[i], d:Math.min(SQ_DIFFS.length - 1, r.act - 1)}; }
/* son niveau suit celui de l'aile qu'il couronne : un cran au-dessus de son boss */
function sqLockLevel(r, i){ const G = sqLockGate(r, i); return Math.min(100, sqStageLevel(G.z, SQ_STAGES - 1, G.d) + 4); }
function sqLockGateOk(r, i){ const G = sqLockGate(r, i); return sqStars(G.z, SQ_STAGES - 1, G.d) > 0; }
function sqLockOpen(r, i){
  const g = r.guardians[i];
  return regionUnlocked(r.key) && guardianAvailable(r, g, i) && sqLockGateOk(r, i);
}
/* le verrou qu'une aile garde, dans une difficulte donnee */
function sqLockAt(z, d){
  const i = SQ_LOCK_ZONES.indexOf(z), r = REGIONS[d];
  return i >= 0 && r ? {r, i, g:r.guardians[i]} : null;
}
function sqLockCount(){ return S.bosses.length; }
function sqLockWaves(r, i, rnd){
  rnd = rnd || rng;
  const g = r.guardians[i], lv = sqLockLevel(r, i), T = POKE[g.id].types;
  const mon = l => typeof levelWildId === "function" ? levelWildId(l, {type:T[Math.floor(rnd() * T.length)]})
                                                     : wildIdFor(Math.min(11, Math.floor(l / 7)), {type:T[0]});
  return [
    [0, 1, 2].map(() => ({id:mon(lv - 5), lv:lv - 5})),
    [{id:g.id, lv, boss:true, guardian:true, slv:1 + i + (r.act - 1)}]
  ];
}
function sqPhase(B, ev){
  for(const f of B.foes){
    if(!f.guardian || f.phased || f.hp <= 0 || f.hp > f.maxHp * 0.5) continue;
    f.phased = true;
    f.fx = f.fx.filter(e => !SQ_HARMFUL.has(e.k));
    sqAddFx(f, "atkup", 3);
    f.gauge = Math.max(f.gauge, 60);
    const adds = [];
    if(B.lock){
      const r = regionDef(B.lock.r), T = POKE[f.id].types;
      for(let k = 0; k < 2; k++){
        const id = typeof levelWildId === "function" ? levelWildId(f.level - 8, {type:T[k % T.length]}) : 25;
        const u = sqUnit(id, f.level - 8, "foe", {slv:r.act});
        u._v = {}; u.gauge = 30; B.foes.push(u); adds.push(u);
      }
    }
    ev.push({k:"phase", tgt:f, adds});
  }
}
function sqLockFinish(B){
  const q = sqState(), stars = sqStarsFor(B);
  const r = regionDef(B.lock.r), i = B.lock.i, g = r.guardians[i], lv = sqLockLevel(r, i);
  q.lk = q.lk || {};
  const key = guardianKey(r.key, g.id), prev = q.lk[key] || 0;
  const base = Math.round((18 + lv * 3.2) * (B.result ? 1.4 : 0.35));
  const xps = B.allies.map(u => sqGiveXp(u.id, Math.round(base * (u.hp > 0 ? 1 : 0.5)))).filter(Boolean);
  let rw = null, gw = null, first = false;
  const loot = sqLootGrant(B);
  S.daily.dayBoss = (S.daily.dayBoss || 0) + 1;
  if(typeof questTick === "function") questTick("dayBoss", 1);
  if(B.result){
    first = !guardianBeaten(r.key, g.id);
    gw = brGuardianWin({id:g.id, region:r.key, core:g.core});
    const fw = typeof consumeFirstWin === "function" ? consumeFirstWin("boss") : 1;
    const k = first ? 1 : 0.3;
    rw = {coins:Math.round((1500 + 900 * i) * r.act * k * fw), shards:Math.round((30 + 15 * i) * r.act * k),
          scrolls:first ? 4 + i * 2 + (r.act - 1) * 2 : 1, xp:Math.round((200 + 100 * i) * r.act * k)};
    gain("coins", rw.coins); gain("shards", rw.shards); addXp(rw.xp);
    q.scrolls += rw.scrolls;
    q.lk[key] = Math.max(prev, stars);
    if(typeof fragOn === "function") fragOn("tower", `Au pied du verrou de ${g.name}`);
  } else if(!(S.story || []).includes("pz_first_guardian_fail")) S.flags.guardFail = true;
  save();
  return {stars, prev, first, rw, xps, gw, loot, lock:{r, i, g}};
}
