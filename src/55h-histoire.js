/* ============================================================
   55h — TON ÉQUIPE A UNE HISTOIRE
   Chaque Pokémon garde la sienne : le jour où il est arrivé et
   comment (capturé dans la Sylve, éclos d'un œuf, acheté cinq cents
   PokéCoins…), ses combats, ses K.O., les fois où il a tenu jusqu'au
   bout presque à zéro, celles où il a été le meilleur de l'équipe.
   L'histoire suit l'évolution : c'est le même Pokémon.
   Porygon-Z remarque les caps (« Dracaufeu vient de livrer son
   centième combat. C'était le Salamèche de ta première ligne. »),
   et le générique nomme le plus fidèle.
   Données : S.dex[id].h = {t, how, r, hab, orig, from, evoT, b, w, ko, cl, mvp}
   ============================================================ */
const HIST_HAB = {route:"dans les Routes ouvertes", foret:"dans la Sylve d'index", eaux:"dans les Nappes",
  grotte:"dans les Cavités", ruines:"dans les Ruines d'archive", foyer:"dans le Foyer thermique"};
const HIST_B = [[10, "dixième"], [50, "cinquantième"], [100, "centième"], [250, "deux cent cinquantième"], [500, "cinq centième"]];

function histDay(t){
  const d = new Date(t);
  return (d.getDate() === 1 ? "1er" : String(d.getDate())) + " " + d.toLocaleDateString("fr-FR", {month:"long"});
}
function histHow(o){
  const reg = o.r && typeof regionDef === "function" && regionDef(o.r) ? regionDef(o.r).name : "";
  switch(o.how){
    case "capture": return "capturé " + (HIST_HAB[o.hab] || "dans les hautes herbes") + (reg ? ", à " + reg : "");
    case "peche":   return "pêché à la sonde" + (reg ? ", à " + reg : "");
    case "safari":  return "attrapé au Parc Safari";
    case "oeuf":    return "éclos d'un œuf";
    case "box":     return "trouvé dans la PokéBox";
    case "roche":   return "réveillé dans la roche du Forage";
    case "absence": return "capturé pendant ton absence";
    case "verrou":  return "libéré d'un verrou légendaire";
    case "breche":  return "ramené de la Brèche";
    case "achat":   return "acheté cinq cents PokéCoins";
    case "evo":     return "né d'une évolution";
    default:        return "arrivé dans l'archive";
  }
}
function histName(id){ const n = typeof monNick === "function" && monNick(id); return n ? "« " + n + " »" : POKE[id].name; }
/* de la lignée de la toute première capture de la connexion */
function histFirst(id){
  const f = S.flags && S.flags.firstMon;
  return !!(f && POKE[f] && POKE[id] && lineRoot(id) === lineRoot(f));
}

/* ---------- un combat de plus ---------- */
function histFight(id, r){
  const e = S.dex[id]; if(!e) return null;
  const h = e.h = e.h || {};
  const before = {b:h.b || 0, ko:h.ko || 0, cl:h.cl || 0};
  h.b = before.b + 1;
  if(r.win) h.w = (h.w || 0) + 1;
  if(r.ko) h.ko = before.ko + r.ko;
  if(r.clutch) h.cl = before.cl + 1;
  if(r.mvp) h.mvp = (h.mvp || 0) + 1;
  return histMilestone(id, before, h, r);
}
function histMilestone(id, before, h, r){
  const nm = histName(id);
  if(r.clutch && !before.cl){
    try { if(typeof pzLog === "function") pzLog("clutch", {mon:nm}); } catch(e){}
    return `${nm} a tenu jusqu'au bout, presque à zéro. Je l'ai noté en gras. Puis en très gras.`;
  }
  const m = HIST_B.find(([n])=>before.b < n && h.b >= n);
  if(m){
    const f = S.flags && S.flags.firstMon;
    const tail = histFirst(id) ? (id === f ? " Ta toute première ligne. Toujours là." : ` C'était le ${POKE[f].name} de ta première ligne.`) : "";
    return `${nm} vient de livrer son ${m[1]} combat.${tail}`;
  }
  if(before.ko < 100 && (h.ko || 0) >= 100) return `${nm} a mis cent adversaires au tapis. Je compte. Je compte très bien.`;
  return null;
}
/* la fin d'un combat : chacun des tiens note le sien ; Porygon-Z dit au plus un cap */
function histAfterBattle(units, win){
  const own = (units || []).filter(u=>u && u.id && u.side !== "foe" && S.dex[u.id]);
  if(!own.length) return null;
  const score = u => (u._ko || 0) * 1e6 + (u._dmg || 0);
  const mvp = win && own.length > 1 ? own.slice().sort((a, b)=>score(b) - score(a))[0] : null;
  let said = null;
  for(const u of own){
    const clutch = !!(win && u.hp > 0 && u.maxHp && u.hp <= u.maxHp * 0.15);
    const line = histFight(u.id, {win, ko:u._ko || 0, clutch, mvp:u === mvp && score(u) > 0});
    if(line && !said) said = line;
  }
  try { saveSoon(); } catch(e){}
  if(said && typeof pzFlash === "function") setTimeout(()=>{ try { pzFlash(said); } catch(e){} }, 2200);
  return said;
}
/* l'histoire suit l'évolution : les combats passent à la nouvelle forme, l'arrivée reste celle d'origine */
function histOnEvolve(from, to){
  const a = S.dex[from], b = S.dex[to]; if(!a || !b) return;
  const ha = a.h || {}, hb = b.h = b.h || {};
  for(const k of ["b", "w", "ko", "cl", "mvp"]){ if(ha[k]){ hb[k] = (hb[k] || 0) + ha[k]; ha[k] = 0; } }
  if(!hb.orig && (hb.how === "evo" || !hb.t)) hb.orig = ha.orig || (ha.t ? {t:ha.t, how:ha.how, r:ha.r, hab:ha.hab, id:from} : null);
  hb.from = from; hb.evoT = Date.now();
}

/* ---------- les crochets dans les deux moteurs de combat ---------- */
if(typeof sqStrike === "function"){
  const _ss = sqStrike;
  sqStrike = function(B, u, t){
    const alive = !!(t && t.hp > 0);
    const r = _ss.apply(this, arguments);
    try { if(u && u.side === "ally"){ u._dmg = (u._dmg || 0) + ((r && r.total) || 0); if(alive && t.hp <= 0) u._ko = (u._ko || 0) + 1; } } catch(e){}
    return r;
  };
}
if(typeof sqFinish === "function"){
  const _sf = sqFinish;
  sqFinish = function(B){
    const r = _sf.apply(this, arguments);
    try { if(B && !B._hist){ B._hist = true; histAfterBattle(B.allies, !!B.result); } } catch(e){}
    return r;
  };
}
if(typeof handleKO === "function"){
  const _hk = handleKO;
  handleKO = function(who){
    try { if(who === "foe" && typeof BATTLE !== "undefined" && BATTLE){ const a = activeAlly(); if(a) a._ko = (a._ko || 0) + 1; } } catch(e){}
    return _hk.apply(this, arguments);
  };
}
if(typeof finishBattle === "function"){
  const _fb = finishBattle;
  finishBattle = function(win){
    const B = typeof BATTLE !== "undefined" ? BATTLE : null;
    const r = _fb.apply(this, arguments);
    try { if(B && !B._hist){ B._hist = true; histAfterBattle(B.allies.slice(0, (B.a || 0) + 1), !!win); } } catch(e){}
    return r;
  };
}

/* ---------- ce qu'on en lit ---------- */
function histRows(id){
  const e = S.dex[id]; if(!e) return [];
  const h = e.h || {}, rows = [];
  const o = h.orig || (h.how && h.how !== "evo" ? h : null);
  if(o && o.t) rows.push(`Arrivé le ${histDay(o.t)} : ${histHow(o)}${h.orig && POKE[h.orig.id] ? ", en " + POKE[h.orig.id].name : ""}.`);
  else rows.push("Arrivé avant que Porygon-Z tienne ce registre.");
  if(h.evoT && h.from && POKE[h.from]) rows.push(`Évolué depuis ${POKE[h.from].name}, le ${histDay(h.evoT)}.`);
  if(histFirst(id)) rows.push(id === S.flags.firstMon ? "Ta toute première ligne." : "De la lignée de ta toute première ligne.");
  if(h.b) rows.push(`${fmt(h.b)} combat${h.b > 1 ? "s" : ""} · ${fmt(h.w || 0)} victoire${(h.w || 0) > 1 ? "s" : ""} · ${fmt(h.ko || 0)} K.O.`);
  else rows.push("Pas encore de combat : son histoire continue quand tu l'emmènes.");
  if(h.cl) rows.push(h.cl === 1 ? "A tenu jusqu'au bout, presque à zéro, une fois." : `A tenu jusqu'au bout, presque à zéro, ${fmt(h.cl)} fois.`);
  if(h.mvp) rows.push(`Le meilleur de l'équipe dans ${fmt(h.mvp)} victoire${h.mvp > 1 ? "s" : ""}.`);
  return rows;
}
function histHtml(id){
  const rows = histRows(id); if(!rows.length) return "";
  return `<div class="hist"><div class="h sm" style="margin-bottom:5px">SON HISTOIRE</div>${rows.map(r=>`<div class="hist-r">${esc(r)}</div>`).join("")}</div>`;
}
/* le plus fidèle : celui qui a livré le plus de combats (cinq au moins) */
function histFaithful(){
  let best = null, n = 4;
  for(const k in S.dex){ const h = S.dex[k] && S.dex[k].h; if(h && (h.b || 0) > n && POKE[k]){ best = +k; n = h.b; } }
  return best;
}
