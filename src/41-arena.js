/* ============================================================
   41 — L'ARÈNE
   La mise en scène des combats automatiques. Le moteur (40) reste
   seul juge : il calcule, l'arène raconte. Elle écoute ce qu'il
   annonce (une attaque part, un coup porte, un Pokémon tombe) et
   le rejoue dans l'ordre, avec les sprites de marche de Donjon
   Mystère, leurs poses d'attaque, de tir et de douleur.

   Deux équipes se font face : les champions au centre, les
   réserves alignées sur les bords. Chaque type a sa manière de
   frapper, chaque coup laisse une trace au sol, un critique
   suspend l'image, un K.O. défragmente le Pokémon.

   Rien n'attend le réseau : tant qu'une planche n'est pas arrivée,
   on dessine le sprite fixe. Sans canvas (tests), l'arène s'efface
   et le combat se déroule comme avant.
   ============================================================ */

let AR = null;
let AR_OK = null;
function arOn(){
  if(AR_OK === null){
    AR_OK = false;
    try {
      if(typeof window !== "undefined" && typeof requestAnimationFrame === "function"){
        const c = document.createElement("canvas");
        AR_OK = !!(c && typeof c.getContext === "function" && c.getContext("2d"));
      }
    } catch(e){ AR_OK = false; }
  }
  return AR_OK && !!BATTLE;
}

const AR_H = 300;
/* sur un grand ecran l'arene prend de la hauteur, et les Pokemon grandissent avec elle */
function arHeight(){
  const vh = typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 640;
  return Math.round(Math.max(AR_H, Math.min(420, vh * 0.46)));
}
/* le nom d'une capacite dit parfois mieux que son type comment elle frappe */
const AR_DASH_RX = /griffe|croc|poing|pied|tranch|coup|charge|queue|morsure|plaqu|bélier|écras|corne|tacle|pic\b|bec|mâchouille|damoclès|koud|balayage|close|force|étreinte|fouet|marto|casse|ruée|assaut|vive-attaque|météores/i;
const AR_BEAM_RX = /rayon|laser|canon|ultralaser|lumi|aéroblast|draco-souffle|onde/i;
function arKindOf(mv){
  if(mv.util) return "util";
  const k = AR_KIND[mv.type] || "dash";
  if(k !== "sky" && k !== "ground" && AR_DASH_RX.test(mv.name)) return "dash";
  if(k !== "dash" && AR_BEAM_RX.test(mv.name)) return "beam";
  return k;
}
const AR_FONT = '"Press Start 2P","Silkscreen",ui-monospace,monospace';
/* la manière de frapper de chaque type */
const AR_KIND = {1:"dash", 2:"dash", 3:"blade", 4:"lob", 5:"ground", 6:"sky", 7:"dash", 8:"wisp", 9:"dash",
                 10:"stream", 11:"stream", 12:"leaf", 13:"sky", 14:"mind", 15:"shard", 16:"beam", 17:"dash", 18:"star"};
/* le décor suit le type de l'adversaire */
const AR_BIOME = {1:"towers", 2:"mesa", 3:"clouds", 4:"canopy", 5:"mesa", 6:"mesa", 7:"canopy", 8:"towers", 9:"towers",
                  10:"volcano", 11:"waves", 12:"canopy", 13:"towers", 14:"towers", 15:"spikes", 16:"volcano", 17:"towers", 18:"canopy"};
function arCol(type){ return (typeof BR_ARCH !== "undefined" && BR_ARCH[type] && BR_ARCH[type].c) || "#35f0d6"; }
function arRgb(hex){ const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function arMix(a, b, k){ const A = arRgb(a), B = arRgb(b); return `rgb(${A.map((v, i)=>Math.round(v + (B[i] - v) * k)).join(",")})`; }
function arRgba(hex, al){ const c = arRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${al})`; }
/* un hasard reproductible pour le décor : le même adversaire, le même paysage */
function arSeed(s){ return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const arEase = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
const arClamp = p => Math.max(0, Math.min(1, p));

/* ============================================================
   1. MISE EN PLACE
   ============================================================ */
function arMake(){
  const B = BATTLE;
  AR = {b:B, t:0, last:0, ev:[], busy:0, fx:[], parts:[], pops:[], decals:[], calls:[],
        shake:0, zoom:0, zx:0, zy:0, freeze:0, flash:null, cur:null, act:new Map(),
        sa:activeAlly(), sf:activeFoe(), W:0, H:AR_H, k:1, dpr:1, logAt:0, bg:null, cv:null, x:null,
        intro:null, win:null, card:null, raf:0, type:activeFoe().types[0]};
  B.allies.forEach(f=>arActor(f, "ally"));
  B.foes.forEach(f=>arActor(f, "foe"));
  /* l'entrée en scène : chacun arrive de son bord ; un gardien a droit à sa carte */
  const len = B.stage === "boss" ? 1900 : B.stage === "elite" ? 1150 : 700;
  AR.intro = {len, stage:B.stage};
  AR.busy = len;
  for(const a of AR.act.values()) if(a.role !== "gone") a.enter = {t0:a.role === "front" ? (a.side === "foe" && B.stage ? len * 0.42 : 80) : 0,
                                                                  dur:a.role === "front" && a.side === "foe" && B.stage === "boss" ? 420 : 520};
  if(B.stage){
    const F = activeFoe();
    AR.card = {t0:len * 0.3, t1:len * 0.96, top:B.title, name:F.name.toUpperCase(), c:arCol(F.types[0])};
    arAt(len * 0.42 + 400, () => { arRing(arHome(arOf(F)), arCol(F.types[0]), 90, 420); AR.shake = 9; arTone(70, .32, "sawtooth", .07, 40); arBuzz(40); });
  }
}
function arActor(f, side){
  const front = (side === "ally" ? activeAlly() : activeFoe()) === f;
  const a = {f, side, shp:f.hp, role:f.hp <= 0 ? "gone" : front ? "front" : "bench",
             mv:null, pose:null, hurtT:-1e9, flashT:-1e9, koT:null, dash:null, glow:null, enter:null, dodgeT:-1e9, hopT:-1e9};
  AR.act.set(f, a);
  return a;
}
function arOf(f){ return AR.act.get(f) || arActor(f, BATTLE.allies.includes(f) ? "ally" : "foe"); }
function arBoss(a){ return a.side === "foe" && BATTLE.stage === "boss"; }
function arSize(a){
  const k = AR.k || 1;
  if(a.role !== "front") return Math.round(36 * k);
  return Math.round((a.side === "ally" ? 85 : arBoss(a) ? 92 : 68) * k);
}
/* la place de chacun : champions au centre, réserves en colonne sur leur bord */
function arHome(a){
  const W = AR.W, H = AR.H;
  if(a.role === "front") return a.side === "ally" ? {x:W * 0.30, y:H * 0.70} : {x:W * 0.68, y:H * 0.45};
  let k = 0;
  for(const o of AR.act.values()){ if(o === a) break; if(o.side === a.side && o.role === "bench") k++; }
  return a.side === "ally" ? {x:W * 0.075 + (k % 2) * 7, y:H * (0.44 + 0.112 * k)}
                           : {x:W * 0.925 - (k % 2) * 7, y:H * (0.30 + 0.125 * k)};
}
function arPos(a){
  const h = arHome(a);
  let x = h.x, y = h.y;
  if(a.enter){
    const p = arEase((AR.t - a.enter.t0) / a.enter.dur);
    const off = (a.side === "ally" ? -1 : 1) * (AR.W * 0.5) * (1 - p);
    x += off; y += (a.side === "ally" ? 1 : -1) * 26 * (1 - p);
  }
  if(a.mv){
    const p = arEase((AR.t - a.mv.t0) / a.mv.dur);
    x = a.mv.x + (h.x - a.mv.x) * p; y = a.mv.y + (h.y - a.mv.y) * p;
    if(p >= 1) a.mv = null;
  }
  if(a.dash){
    const d = a.dash, t = AR.t - d.t0;
    let p = t < d.imp ? Math.pow(arClamp(t / d.imp), 2.2) : 1 - arEase((t - d.imp - d.hs) / 260);
    if(t > d.imp + d.hs + 260){ a.dash = null; p = 0; }
    x += (d.x - x) * p; y += (d.y - y) * p;
  }
  /* le recul d'un coup reçu, l'écart d'une esquive, le saut de la victoire */
  const kb = Math.exp(-(AR.t - a.hurtT) / 95) * 11, s = a.side === "ally" ? -1 : 1;
  if(kb > 0.2){ x += s * kb; y -= s * kb * 0.5; }
  const dg = AR.t - a.dodgeT;
  if(dg >= 0 && dg < 320){ const q = Math.sin(dg / 320 * Math.PI); x += s * 20 * q; y -= 6 * q; }
  const hp = AR.t - a.hopT;
  if(hp >= 0 && hp < 380) y -= Math.sin(hp / 380 * Math.PI) * 18;
  return {x, y};
}
/* le point visé : le torse, pas les pieds */
function arChest(a){ const p = arPos(a); return {x:p.x, y:p.y - arSize(a) * 0.22}; }

/* ============================================================
   2. LE FIL DU TEMPS
   L'horloge de l'arène avance à la vitesse choisie. Le moteur
   demande combien de temps il reste (arNeed) avant de poursuivre.
   ============================================================ */
function arAt(t, fn, log){
  let i = AR.ev.length;
  while(i > 0 && AR.ev[i - 1].t > t) i--;
  AR.ev.splice(i, 0, {t, fn, log});
}
function arLive(){ return !!(AR && AR.b === BATTLE && AR.raf && AR.cv && AR.cv.isConnected); }
function arNeed(base){
  if(!arLive()) return base;
  return Math.max(base, AR.busy - AR.t);
}
/* le journal suit l'image : une ligne ne s'ecrit qu'au moment ou l'arene la montre */
function arLog(fn){
  if(!arLive() || BATTLE.skip){ fn(); return; }
  const c = AR.cur;
  arAt(Math.max(AR.logAt || 0, c ? c.T0 + c.imp : Math.max(AR.t, AR.busy)), fn, true);
}
function arIntroMs(){
  if(!AR || AR.b !== BATTLE) return 500;
  return Math.max(120, (AR.intro.len - AR.t) / bSpeed()) + 60;
}
function arTone(f, d, type, vol, slide){ if(typeof Sfx !== "undefined" && Sfx.tone) Sfx.tone(f, d, type, vol, slide); }
function arBuzz(ms){ if(typeof buzz === "function") buzz(ms); }

/* ce que le moteur annonce */
function arEvent(kind){
  if(!arOn() || !AR || AR.b !== BATTLE) return;
  const B = BATTLE, a = arguments;
  if(kind === "finish") AR.win = {v:a[1], t:AR.t};
  /* on passe le combat, ou l'ecran est ailleurs : on ne garde que l'etat */
  if(kind === "skip" || B.skip || !arLive()){ arSnap(); return; }
  const now = Math.max(AR.t, AR.busy);
  const cur = AR.cur;
  switch(kind){
    case "begin": AR.logAt = 0; arBegin(a[1], a[2], a[3], a[4], now); break;
    case "end": AR.cur = null; break;
    case "pop": {
      const f = a[1] === "foe" ? activeFoe() : activeAlly(), dmg = a[2], eff = a[3], color = a[4], crit = a[5], hp = f.hp;
      const main = !color && dmg > 0 && cur && f === cur.def;
      let t = now;
      if(cur){
        t = cur.T0 + cur.imp + (main ? 0 : 190);
        if(main){ cur.hit = true; cur.hs = crit ? 150 : eff >= 2 ? 95 : 0; cur.eff = eff; cur.crit = crit; }
        AR.busy = Math.max(AR.busy, cur.T0 + cur.imp + (cur.hs || 0) + 300);
      } else AR.busy = now + 430;
      arAt(t, () => arImpact(arOf(f), dmg, eff, color, crit, hp, main ? cur : null));
      break;
    }
    case "miss": {
      if(!cur) break;
      cur.miss = a[1];
      const who = cur.mv.util && a[1] === "DÉJÀ AFFECTÉ" ? cur.def : cur.def;
      arAt(cur.T0 + cur.imp, () => {
        const o = arOf(who), p = arChest(o);
        if(a[1] === "ESQUIVE" || a[1] === "ÉCHEC") o.dodgeT = AR.t;
        arPop(p.x, p.y - 26, a[1], "#8fa3c2", 8);
        arTone(520, .07, "triangle", .03, 300);
      });
      break;
    }
    case "glow": {
      const f = a[1] === "foe" ? activeFoe() : activeAlly(), c = arCss(a[2]);
      const t = cur ? cur.T0 + cur.imp : now;
      arAt(t, () => {
        const o = arOf(f), p = arChest(o);
        o.glow = {c, t:AR.t};
        arRing(p, c, 46, 380);
        arBurst(p.x, p.y, c, 14, 1.4, {up:true});
        arTone(660, .16, "sine", .04, 990);
        arSync();
      });
      break;
    }
    case "stun": {
      const f = a[1] === "a" ? activeAlly() : activeFoe();
      arAt(now, () => { const o = arOf(f), p = arChest(o); o.dodgeT = -1e9; o.stunT = AR.t;
        arPop(p.x, p.y - 28, f.status && f.status.k === "slp" ? "INACTIF" : "FIGÉ", "#ffe45e", 8); });
      AR.busy = now + 440;
      break;
    }
    case "ko": {
      const f = a[2], t = cur ? cur.T0 + cur.imp + (cur.hs || 0) + 170 : now + 120;
      arAt(t, () => arKo(arOf(f)));
      AR.busy = Math.max(AR.busy, t + 540); AR.logAt = t;
      break;
    }
    case "enter": {
      const f = a[2], side = a[1], t = AR.busy - 90;
      arAt(t, () => arEnter(side, f));
      AR.busy = t + 400; AR.logAt = t;
      break;
    }
    case "swap": {
      const o = arOf(a[2]), n = a[3];
      arAt(now, () => { const p = arPos(o); o.role = "bench"; o.mv = {x:p.x, y:p.y, t0:AR.t, dur:300}; arEnter("ally", n); });
      AR.busy = now + 420;
      break;
    }
    case "phase": {
      const f = a[1], t = AR.busy;
      arAt(t, () => { const o = arOf(f), p = arChest(o), c = "#ff3d7f";
        o.glow = {c, t:AR.t}; o.rage = true; AR.shake = 12; AR.flash = {c, t:AR.t, d:420};
        arRing(p, c, 120, 520); arRing(p, "#ffffff", 70, 360); arBurst(p.x, p.y, c, 36, 3.2);
        AR.card = {t0:AR.t, t1:AR.t + 1000, top:"RECONFIGURATION", name:f.name.toUpperCase(), c, small:true};
        o.shp = f.hp; arSync(); });
      AR.busy = t + 900;
      break;
    }
    case "revive": { const o = arOf(a[1]); o.role = "bench"; o.koT = null; o.shp = a[1].hp; arSync(); break; }
    case "sync": arSnap(true); break;
  }
}
function arCss(c){
  if(!c || c[0] === "#") return c || "#35f0d6";
  const m = /var\((--[\w-]+)\)/.exec(c);
  if(m){ const v = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim(); if(v[0] === "#" && v.length === 7) return v; }
  return "#35f0d6";
}
/* tout remettre d'aplomb d'un coup : on passe le combat, ou on soigne hors échange */
function arSnap(soft){
  if(!soft){ const pend = AR.ev.splice(0); for(const e of pend) if(e.log) try { e.fn(); } catch(err){}
    AR.ev.length = 0; AR.fx.length = 0; AR.cur = null; AR.busy = AR.t; AR.card = null; AR.freeze = 0; }
  AR.sa = activeAlly(); AR.sf = activeFoe();
  for(const a of AR.act.values()){
    a.shp = a.f.hp;
    if(soft) continue;
    a.enter = a.mv = a.dash = a.pose = null;
    a.role = a.f.hp <= 0 ? "gone" : (a.f === AR.sa || a.f === AR.sf) ? "front" : "bench";
    if(a.role !== "gone") a.koT = null;
  }
  arSync();
}

/* ---------- une attaque part ---------- */
function arBegin(side, att, def, mv, T0){
  const kind = arKindOf(mv);
  const dash = kind === "dash";
  const imp = mv.util ? 260 : dash ? 250 : kind === "beam" ? 380 : kind === "stream" ? 400 : 340;
  const cur = AR.cur = {side, att, def, mv, T0, imp, kind, dash, hs:0, hit:false, miss:null};
  AR.busy = T0 + imp + 300;
  arAt(T0, () => {
    const A = arOf(att), D = arOf(def), c = arCol(mv.type);
    const id = att.id;
    let anim = dash ? "attack" : "shoot";
    if(typeof PMD_ANIM !== "undefined" && !(PMD_ANIM[id] && PMD_ANIM[id][anim])) anim = "attack";
    A.pose = {anim, t0:AR.t, len:Math.min(0.62, (typeof brAnimLen === "function" && brAnimLen(id, anim)) || 0.4) * 1000};
    const pa = arChest(A);
    AR.calls.push({x:pa.x, y:pa.y - arSize(A) * 0.62, txt:mv.name, c, t0:AR.t, side:A.side});
    if(AR.calls.length > 3) AR.calls.shift();
    arTone(dash ? 240 : 380, .12, "triangle", .035, dash ? 520 : 760);
    if(mv.util){ arBurst(pa.x, pa.y, c, 8, 1, {up:true}); return; }
    if(dash){
      const pd = arPos(D), ph = arHome(A), dx = ph.x - pd.x, dy = ph.y - pd.y, L = Math.hypot(dx, dy) || 1;
      A.dash = {t0:AR.t, imp, hs:0, x:pd.x + dx / L * 44, y:pd.y + dy / L * 44};
      cur.dashRef = A.dash;
    } else arCast(cur, A, D, c);
  });
}

/* ---------- un coup porte (ou un soin, un contrecoup) ---------- */
function arImpact(a, dmg, eff, color, crit, hpAfter, cur){
  a.shp = hpAfter;
  const p = arChest(a);
  if(dmg < 0){
    arPop(p.x, p.y - 18, "+" + (-dmg), "#5ce07a", 10);
    arBurst(p.x, p.y, "#5ce07a", 12, 1.1, {up:true});
    arTone(700, .12, "sine", .035, 1040);
    arSync(); return;
  }
  const c = color ? arCss(color) : eff >= 2 ? "#ffc857" : eff < 1 ? "#8fa3c2" : "#ffffff";
  const ratio = arClamp(dmg / a.f.maxHp);
  arPop(p.x + (Math.random() - 0.5) * 16, p.y - 20, String(dmg), c, crit ? 17 : eff >= 2 ? 15 : color ? 9 : 10 + Math.round(ratio * 5), crit || eff >= 2);
  if(!cur){                                  /* brûlure, poison, épines : une morsure, pas un choc */
    a.flashT = AR.t; arBurst(p.x, p.y, c, 7, 1.1);
    arTone(200, .07, "square", .03, 140);
    arSync(); return;
  }
  const tc = arCol(cur.mv.type);
  a.hurtT = AR.t; a.flashT = AR.t;
  a.pose = {anim:"hurt", t0:AR.t, len:300 + cur.hs};
  AR.shake = Math.max(AR.shake, 3 + ratio * 11 + (crit ? 5 : 0));
  arStrike(cur, a, p, tc);
  arDecal(a, tc, 10 + ratio * 22);
  if(cur.hs){
    AR.freeze = AR.t + cur.hs;
    AR.zoom = crit ? 1 : 0.6; AR.zx = p.x; AR.zy = p.y;
    AR.flash = {c:crit ? "#ffffff" : "#ffc857", t:AR.t, d:crit ? 170 : 130};
    if(cur.dashRef) cur.dashRef.hs = cur.hs;
  }
  if(crit) arPop(p.x, p.y - 44, "CRITIQUE", "#ff3d7f", 9, true);
  else if(eff >= 2) arPop(p.x, p.y - 44, "SUPER EFFICACE", "#ffc857", 8, true);
  else if(eff > 0 && eff < 1) arPop(p.x, p.y - 40, "RÉSISTE", "#8fa3c2", 7);
  /* le son suit la force du coup */
  arTone(crit ? 110 : 170 - ratio * 60, .1 + ratio * .12, "sawtooth", .05 + ratio * .03, 60);
  if(crit || eff >= 2) arTone(880, .09, "square", .03, 440);
  if(a.side === "ally") arBuzz(crit ? [18, 30, 26] : 14);
  arSync();
}

/* ---------- un Pokémon tombe : il se défragmente ---------- */
function arKo(a){
  a.koT = AR.t; a.pose = null; a.dash = null;
  const p = arChest(a), c = a.side === "ally" ? "#35f0d6" : "#ff3d7f";
  for(let i = 0; i < 26; i++)
    AR.parts.push({x:p.x + (Math.random() - 0.5) * 34, y:p.y + (Math.random() - 0.5) * 40, vx:(Math.random() - 0.5) * 0.6,
                   vy:-0.4 - Math.random() * 1.4, g:-0.004, life:0, max:420 + Math.random() * 380, s:2 + Math.random() * 3, c:i % 3 ? c : "#ffffff"});
  arTone(300, .34, "square", .04, 60);
  AR.shake = Math.max(AR.shake, 5);
  arAt(AR.t + 520, () => { a.role = "gone"; });
  arSync();
}
/* ---------- la relève entre en lice ---------- */
function arEnter(side, f){
  const a = arOf(f), p = arPos(a);
  a.role = "front"; a.koT = null;
  a.mv = {x:p.x, y:p.y, t0:AR.t, dur:360};
  if(side === "ally") AR.sa = f; else AR.sf = f;
  const h = arHome(a);
  arAt(AR.t + 340, () => { arRing({x:h.x, y:h.y + 6}, side === "ally" ? "#35f0d6" : arCol(f.types[0]), 44, 300, true); arTone(side === "ally" ? 520 : 300, .1, "square", .035, side === "ally" ? 780 : 200); });
  if(side === "foe" && BATTLE.stage === "boss"){
    const k = BATTLE.foes.indexOf(f) + 1, c = arCol(f.types[0]);
    AR.card = {t0:AR.t, t1:AR.t + 900, top:"PHASE " + k + " / " + BATTLE.foes.length, name:f.name.toUpperCase(), c, small:true};
    AR.busy += 420;
  }
  arSync();
}

/* ============================================================
   3. LES EFFETS — une manière de frapper par type
   ============================================================ */
function arBurst(x, y, c, n, spd, o){
  o = o || {};
  for(let i = 0; i < n; i++){
    const an = o.up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * spd * 0.11;
    AR.parts.push({x:x + (Math.random() - 0.5) * (o.r || 8), y:y + (Math.random() - 0.5) * (o.r || 8), vx:Math.cos(an) * v, vy:Math.sin(an) * v,
                   g:o.g === undefined ? 0.0003 : o.g, life:0, max:(o.life || 320) * (0.6 + Math.random() * 0.7), s:o.s || (1.5 + Math.random() * 2.5),
                   c:o.white && i % 3 === 0 ? "#ffffff" : c, sh:o.sh || 0});
  }
  if(AR.parts.length > 420) AR.parts.splice(0, AR.parts.length - 420);
}
function arRing(p, c, r, dur, flat){
  AR.fx.push({t0:AR.t, t1:AR.t + dur, draw(x, k){
    x.globalAlpha = (1 - k) * 0.9; x.strokeStyle = c; x.lineWidth = 3 * (1 - k) + 1;
    x.beginPath(); x.ellipse(p.x, p.y, r * arEase(k), r * arEase(k) * (flat ? 0.34 : 1), 0, 0, 7); x.stroke(); x.globalAlpha = 1;
  }});
}
function arPop(x, y, txt, c, size, big){
  AR.pops.push({x:Math.max(30, Math.min(AR.W - 30, x)), y, txt, c, size, big:!!big, t0:AR.t});
  if(AR.pops.length > 14) AR.pops.shift();
}
function arDecal(a, c, r){
  const p = arPos(a);
  AR.decals.push({x:p.x + (Math.random() - 0.5) * 22, y:p.y + 8 + (Math.random() - 0.5) * 8, r, c, t0:AR.t});
  if(AR.decals.length > 9) AR.decals.shift();
}
/* les projectiles : de l'attaquant à la cible, arrivée pile à l'impact */
function arCast(cur, A, D, c){
  const T0 = AR.t, imp = cur.imp, k = cur.kind;
  const a = arChest(A), b0 = arChest(D);
  const hitOrMiss = () => cur.miss ? {x:b0.x + (A.side === "ally" ? 46 : -46), y:b0.y - 34} : b0;
  const fly = (n, lag, draw, amp, arc) => {
    for(let i = 0; i < n; i++){
      const t0 = T0 + 70 + i * lag, t1 = T0 + imp + i * lag * 0.35, s = (i % 2 ? 1 : -1) * (amp || 0) * (0.5 + i / n);
      AR.fx.push({t0, t1, draw(x, p){
        const b = hitOrMiss(), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, q = Math.sin(p * Math.PI);
        const px = a.x + dx * p - dy / L * s * q, py = a.y + dy * p + dx / L * s * q - (arc || 0) * q;
        draw(x, px, py, Math.atan2(dy, dx), p, i);
        if(Math.random() < 0.6) AR.parts.push({x:px, y:py, vx:(Math.random() - 0.5) * 0.03, vy:(Math.random() - 0.5) * 0.03, g:0, life:0, max:200, s:2, c});
      }});
    }
  };
  const glow = (x, px, py, r) => {
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, c); g.addColorStop(1, arRgba(c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  };
  if(k === "wisp") fly(3, 60, (x, px, py)=>glow(x, px, py, 9), 26);
  else if(k === "star") fly(3, 55, (x, px, py, an, p)=>{ x.save(); x.translate(px, py); x.rotate(p * 9); x.fillStyle = "#ffffff";
    x.beginPath(); for(let j = 0; j < 8; j++){ const r = j % 2 ? 3 : 8; x.lineTo(Math.cos(j * Math.PI / 4) * r, Math.sin(j * Math.PI / 4) * r); } x.fill();
    x.strokeStyle = c; x.lineWidth = 1.5; x.stroke(); x.restore(); }, 18);
  else if(k === "blade") fly(2, 80, (x, px, py, an)=>{ x.save(); x.translate(px, py); x.rotate(an); x.strokeStyle = "#ffffff"; x.lineWidth = 3;
    x.beginPath(); x.arc(-8, 0, 13, -1.1, 1.1); x.stroke(); x.strokeStyle = c; x.lineWidth = 1.5; x.beginPath(); x.arc(-11, 0, 13, -1.1, 1.1); x.stroke(); x.restore(); }, 10);
  else if(k === "shard") fly(4, 38, (x, px, py, an)=>{ x.save(); x.translate(px, py); x.rotate(an); x.fillStyle = "#ffffff";
    x.beginPath(); x.moveTo(9, 0); x.lineTo(0, 3.5); x.lineTo(-7, 0); x.lineTo(0, -3.5); x.fill(); x.strokeStyle = c; x.lineWidth = 1; x.stroke(); x.restore(); }, 14);
  else if(k === "leaf") fly(5, 34, (x, px, py, an, p, i)=>{ x.save(); x.translate(px, py); x.rotate(p * 14 + i); x.fillStyle = i % 2 ? c : "#c9f7a0";
    x.beginPath(); x.ellipse(0, 0, 6, 2.6, 0, 0, 7); x.fill(); x.restore(); }, 22);
  else if(k === "lob") fly(1, 0, (x, px, py, an, p)=>{ x.fillStyle = c; x.beginPath(); x.arc(px, py, 8 + Math.sin(p * 20) * 1.5, 0, 7); x.fill();
    x.fillStyle = "rgba(255,255,255,.7)"; x.beginPath(); x.arc(px - 2.5, py - 2.5, 2.5, 0, 7); x.fill(); }, 0, 64);
  else if(k === "stream"){
    /* un jet continu : flammes qui montent, eau qui retombe */
    const fire = cur.mv.type === 10;
    for(let t = 70; t < imp + 60; t += 22) arAt(T0 + t, () => {
      const b = hitOrMiss(), dx = b.x - a.x, dy = b.y - a.y, life = Math.max(120, imp - 60);
      for(let i = 0; i < 4; i++)
        AR.parts.push({x:a.x, y:a.y, vx:dx / life + (Math.random() - 0.5) * 0.07, vy:dy / life + (Math.random() - 0.5) * 0.07,
                       g:fire ? -0.0003 : 0.0003, life:0, max:life * (0.9 + Math.random() * 0.3), s:fire ? 4 + Math.random() * 4 : 3 + Math.random() * 3,
                       c:fire ? ["#ffffff", "#ffe45e", c, "#ff4d2e"][i] : ["#ffffff", c, c, "#bfe6ff"][i], sh:fire ? 2 : 0, shrink:fire});
    });
  }
  else if(k === "beam"){
    AR.fx.push({t0:T0 + 40, t1:T0 + imp + 170, draw(x, p){
      const b = hitOrMiss(), q = arClamp(p * 2.4), fade = p > 0.7 ? (1 - p) / 0.3 : 1, w = (9 + Math.sin(AR.t * 0.07) * 2) * fade;
      const ex = a.x + (b.x - a.x) * q, ey = a.y + (b.y - a.y) * q;
      x.lineCap = "round"; x.globalAlpha = 0.5 * fade; x.strokeStyle = c; x.lineWidth = w * 2.2;
      x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(ex, ey); x.stroke();
      x.globalAlpha = fade; x.lineWidth = w; x.stroke(); x.strokeStyle = "#ffffff"; x.lineWidth = w * 0.42; x.stroke(); x.globalAlpha = 1;
      glow(x, a.x, a.y, 12 * fade + 2);
    }});
  }
  else if(k === "mind"){
    for(let i = 0; i < 3; i++) AR.fx.push({t0:T0 + 60 + i * 70, t1:T0 + imp + i * 30, draw(x, p){
      const b = hitOrMiss(); x.globalAlpha = p; x.strokeStyle = i % 2 ? "#ffffff" : c; x.lineWidth = 2.5;
      x.beginPath(); x.arc(b.x, b.y, 54 * (1 - p) + 6, 0, 7); x.stroke(); x.globalAlpha = 1; }});
    AR.fx.push({t0:T0, t1:T0 + imp, draw(x, p){ glow(x, a.x, a.y - 4, 6 + p * 8); }});
  }
  else if(k === "sky"){
    if(cur.mv.type === 13){
      AR.fx.push({t0:T0 + imp - 70, t1:T0 + imp + 150, draw(x){
        const b = hitOrMiss(); let px = b.x + (Math.random() - 0.5) * 30, py = -6;
        x.beginPath(); x.moveTo(px, py);
        while(py < b.y - 12){ py += 14 + Math.random() * 16; px += (b.x - px) * 0.3 + (Math.random() - 0.5) * 26; x.lineTo(px, Math.min(py, b.y)); }
        x.lineTo(b.x, b.y);
        x.strokeStyle = arRgba(c, 0.55); x.lineWidth = 7; x.lineJoin = "round"; x.stroke(); x.strokeStyle = "#ffffff"; x.lineWidth = 2.2; x.stroke();
      }});
      arAt(T0 + imp - 60, () => { AR.flash = {c:"#fff7c2", t:AR.t, d:110}; });
    } else {
      for(let i = 0; i < 3; i++){
        const ox = (i - 1) * 20, sd = arSeed(i * 77 + 5), pts = []; for(let j = 0; j < 7; j++) pts.push(6 + sd() * 5);
        AR.fx.push({t0:T0 + 60 + i * 50, t1:T0 + imp + i * 36, draw(x, p){
          const b = hitOrMiss(), px = b.x + ox + (1 - p) * 22, py = -20 + (b.y + 10 - (i % 2) * 8 + 20) * p * p;
          x.save(); x.translate(px, py); x.rotate(p * 5 + i); x.fillStyle = c; x.strokeStyle = "#3a2c16"; x.lineWidth = 1.5;
          x.beginPath(); pts.forEach((r, j)=>x.lineTo(Math.cos(j * 0.9) * r, Math.sin(j * 0.9) * r)); x.closePath(); x.fill(); x.stroke(); x.restore();
        }});
      }
    }
  }
  else if(k === "ground"){
    const f0 = arPos(A), sd = arSeed(cur.T0 | 0), zig = []; for(let i = 0; i <= 9; i++) zig.push((sd() - 0.5) * 16);
    AR.fx.push({t0:T0 + 50, t1:T0 + imp + 260, draw(x, p){
      const f1 = arPos(D), q = arClamp(p * (imp + 210) / (imp - 50)), fade = p > 0.6 ? (1 - p) / 0.4 : 1, n = Math.floor(q * 9);
      x.globalAlpha = fade; x.lineJoin = "round";
      for(const [col, w] of [["#12080a", 6], [c, 2.5]]){
        x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(f0.x, f0.y + 8);
        for(let i = 1; i <= n; i++){ const u = i / 9; x.lineTo(f0.x + (f1.x - f0.x) * u + zig[i] * 0.6, f0.y + 8 + (f1.y - f0.y) * u + zig[i] * 0.5); }
        x.stroke();
      }
      x.globalAlpha = 1;
    }});
  }
}
/* le choc lui-même, là où le coup arrive */
function arStrike(cur, a, p, c){
  const t = cur.mv.type, k = cur.kind;
  const slash = (n, col, len) => {
    for(let i = 0; i < n; i++){
      const an = -0.9 + i * (n > 1 ? 0.55 : 0) + (a.side === "ally" ? Math.PI : 0), off = (i - (n - 1) / 2) * 11;
      AR.fx.push({t0:AR.t + i * 35, t1:AR.t + 200 + i * 35 + cur.hs, draw(x, q){
        const e = arEase(q * 1.6), cx = p.x + off, cy = p.y;
        x.lineCap = "round"; x.globalAlpha = 1 - q * q;
        for(const [cc, w] of [[col, 7], ["#ffffff", 2.6]]){
          x.strokeStyle = cc; x.lineWidth = w * (1 - q * 0.6); x.beginPath();
          x.moveTo(cx - Math.cos(an) * len, cy - Math.sin(an) * len);
          x.lineTo(cx - Math.cos(an) * len + Math.cos(an) * 2 * len * e, cy - Math.sin(an) * len + Math.sin(an) * 2 * len * e); x.stroke();
        }
        x.globalAlpha = 1;
      }});
    }
  };
  if(k === "dash"){
    if(t === 17) slash(3, "#7a3dff", 26);
    else if(t === 7) slash(2, c, 22);
    else if(t === 9){ slash(1, "#c7d2e0", 28); arBurst(p.x, p.y, "#ffffff", 16, 3.4, {sh:1, life:260, g:0.0012}); }
    else if(t === 2){ arRing(p, "#ffffff", 34, 200); arRing(p, c, 56, 320); arBurst(p.x, p.y, c, 18, 2.8, {white:true}); }
    else { arRing(p, "#ffffff", 30, 220); arBurst(p.x, p.y, "#ffffff", 14, 2.4, {sh:1}); }
  }
  else if(k === "sky" && t === 6){ arBurst(p.x, p.y + 10, c, 20, 2.6, {g:0.0016, s:4, life:420}); arRing({x:p.x, y:p.y + 22}, c, 48, 320, true); }
  else if(k === "ground"){ arBurst(p.x, p.y + 20, c, 26, 3, {up:true, g:0.002, s:4, life:460}); arRing({x:p.x, y:p.y + 22}, c, 58, 380, true); }
  else if(k === "stream" && t === 10) arBurst(p.x, p.y, "#ff8a3d", 22, 2.2, {up:true, g:-0.0006, s:5, sh:2, white:true, life:420});
  else if(k === "stream"){ arBurst(p.x, p.y, c, 26, 2.8, {g:0.0018, white:true}); arRing({x:p.x, y:p.y + 22}, c, 50, 340, true); }
  else if(k === "shard"){ arBurst(p.x, p.y, "#ffffff", 18, 2.8, {sh:1}); arBurst(p.x, p.y, c, 10, 1.6, {sh:3, s:5, life:480, g:0.0004}); }
  else if(k === "lob"){ arBurst(p.x, p.y, c, 22, 2, {g:0.0014, s:4, sh:2}); arRing({x:p.x, y:p.y + 22}, c, 44, 420, true); }
  else if(k === "beam"){ arRing(p, c, 62, 300); arRing(p, "#ffffff", 36, 220); arBurst(p.x, p.y, c, 26, 3.4, {white:true}); }
  else if(k === "mind"){ arRing(p, c, 44, 260); arRing(p, "#ffffff", 22, 200); arBurst(p.x, p.y, c, 14, 1.6, {sh:2}); }
  else { arRing(p, c, 40, 260); arBurst(p.x, p.y, c, 20, 2.4, {white:true}); }
  if(cur.crit) arBurst(p.x, p.y, "#ff3d7f", 18, 4, {sh:1, life:300});
  if(cur.eff >= 2) arRing(p, "#ffc857", 78, 420);
}

/* ============================================================
   4. LE DÉCOR — un paysage par type d'adversaire
   ============================================================ */
function arBackdrop(){
  const W = AR.W, H = AR.H, d = AR.dpr, c = arCol(AR.type), biome = AR_BIOME[AR.type] || "towers";
  const cv = document.createElement("canvas"); cv.width = W * d; cv.height = H * d;
  const x = cv.getContext("2d"); x.scale(d, d);
  const hy = H * 0.2, R = arSeed(AR.type * 9973 + 17);
  let g = x.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, "#04070f"); g.addColorStop(1, arMix("#0a1324", c, 0.3));
  x.fillStyle = g; x.fillRect(0, 0, W, hy);
  g = x.createRadialGradient(W * 0.6, hy, 0, W * 0.6, hy, W * 0.6);
  g.addColorStop(0, arRgba(c, 0.32)); g.addColorStop(1, arRgba(c, 0));
  x.fillStyle = g; x.fillRect(0, 0, W, hy);
  for(let i = 0; i < 34; i++){ x.fillStyle = arRgba(i % 5 ? "#9fb7d9" : c, 0.15 + R() * 0.5); x.fillRect(R() * W, R() * hy * 0.8, 1 + (R() > 0.8), 1); }
  /* deux plans de silhouettes */
  for(let L = 0; L < 2; L++){
    x.fillStyle = arMix("#050912", c, L ? 0.10 : 0.24);
    x.beginPath(); x.moveTo(0, hy + 1);
    let px = -10;
    while(px < W + 20){
      const w = 12 + R() * 34, top = hy - (L ? 6 + R() * 22 : 12 + R() * 34) * (biome === "waves" ? 0.35 : 1);
      if(biome === "towers"){ x.lineTo(px, top); x.lineTo(px + w * 0.7, top); x.lineTo(px + w * 0.7, hy - 3 - R() * 6); }
      else if(biome === "mesa"){ x.lineTo(px + w * 0.15, top + 4); x.lineTo(px + w * 0.8, top); x.lineTo(px + w, hy - 2); }
      else if(biome === "volcano" || biome === "spikes"){ x.lineTo(px + w * 0.5, top - (biome === "spikes" ? 8 : 0)); x.lineTo(px + w, hy - 2); }
      else if(biome === "canopy"){ x.quadraticCurveTo(px + w * 0.25, top - 6, px + w * 0.5, top); x.quadraticCurveTo(px + w * 0.8, top - 5, px + w, hy - 3); }
      else { x.quadraticCurveTo(px + w * 0.5, top - 4, px + w, hy - 1 - R() * 4); }
      px += w;
    }
    x.lineTo(W + 20, hy + 1); x.closePath(); x.fill();
  }
  /* le sol : une dalle en perspective, quadrillée, teintée par le type */
  g = x.createLinearGradient(0, hy, 0, H);
  g.addColorStop(0, arMix("#0c1830", c, 0.22)); g.addColorStop(0.5, arMix("#081020", c, 0.08)); g.addColorStop(1, "#04070e");
  x.fillStyle = g; x.fillRect(0, hy, W, H - hy);
  x.strokeStyle = arRgba(c, 0.16); x.lineWidth = 1;
  for(let i = -14; i <= 14; i++){ x.beginPath(); x.moveTo(W / 2 + i * 6, hy); x.lineTo(W / 2 + i * 62, H); x.stroke(); }
  for(let i = 1; i <= 11; i++){ const y = hy + (H - hy) * Math.pow(i / 11, 1.9); x.globalAlpha = 0.4 + i / 18; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  x.globalAlpha = 1;
  /* un sol qui a vécu : éclats, touffes ou flaques selon le lieu */
  for(let i = 0; i < 46; i++){
    const u = R(), y = hy + 8 + (H - hy - 10) * u * u * 0.9 + R() * 20, px = R() * W, s = 1 + u * 3;
    x.fillStyle = arRgba(i % 4 ? "#0a1222" : c, i % 4 ? 0.55 : 0.2);
    if(biome === "canopy") x.fillRect(px, y, 1, -2 - s * 1.5), x.fillRect(px + 2, y, 1, -1 - s);
    else if(biome === "waves") { x.beginPath(); x.ellipse(px, y, 6 + s * 3, 1.5 + s * 0.4, 0, 0, 7); x.fill(); }
    else x.fillRect(px, y, 2 + s * 2, 1 + s * 0.6);
  }
  /* les deux plateformes */
  const pads = [[W * 0.30, H * 0.70 + 8 * AR.k, 62 * AR.k, "#35f0d6"], [W * 0.68, H * 0.45 + 7 * AR.k, (BATTLE.stage === "boss" ? 62 : 50) * AR.k, c]];
  for(const [px, py, r, col] of pads){
    g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, arRgba(col, 0.22)); g.addColorStop(1, arRgba(col, 0));
    x.save(); x.translate(px, py); x.scale(1, 0.34); x.translate(-px, -py);
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    x.strokeStyle = arRgba(col, 0.5); x.lineWidth = 2; x.beginPath(); x.arc(px, py, r * 0.86, 0, 7); x.stroke();
    x.strokeStyle = arRgba(col, 0.2); x.setLineDash([4, 6]); x.beginPath(); x.arc(px, py, r * 0.64, 0, 7); x.stroke(); x.setLineDash([]);
    x.restore();
  }
  g = x.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.95);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.6)");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return cv;
}

/* ============================================================
   5. LE DESSIN
   ============================================================ */
function arDrawActor(x, a){
  if(a.role === "gone") return;
  const f = a.f, id = f.id, p = arPos(a), size = arSize(a), t = AR.t;
  const dir = a.side === "ally" ? 3 : 7;
  const front = a.role === "front";
  let al = front ? 1 : 0.62;
  /* l'ombre */
  x.fillStyle = "rgba(0,0,0,.42)";
  x.beginPath(); x.ellipse(p.x, p.y + size * 0.12, size * 0.3, size * 0.09, 0, 0, 7); x.fill();
  if(front && (arBoss(a) || a.rage)){
    const c = a.rage ? "#ff3d7f" : arCol(f.types[0]), r = size * (0.62 + Math.sin(t / 260) * 0.05);
    const g = x.createRadialGradient(p.x, p.y - size * 0.2, 0, p.x, p.y - size * 0.2, r);
    g.addColorStop(0, arRgba(c, 0.34)); g.addColorStop(1, arRgba(c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y - size * 0.2, r, 0, 7); x.fill();
  }
  if(a.glow){
    const k = (t - a.glow.t) / 520;
    if(k >= 1) a.glow = null;
    else { const g = x.createRadialGradient(p.x, p.y - size * 0.2, 0, p.x, p.y - size * 0.2, size * 0.6);
      g.addColorStop(0, arRgba(a.glow.c, 0.55 * (1 - k))); g.addColorStop(1, arRgba(a.glow.c, 0));
      x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y - size * 0.2, size * 0.6, 0, 7); x.fill(); }
  }
  const white = t - a.flashT < 75;
  const variant = white ? "w" : "n";
  const moving = a.mv || a.dash || (a.enter && t < a.enter.t0 + a.enter.dur);
  const draw = (cx, cy, alpha) => {
    if(a.pose){
      const pt = t < AR.freeze && a.pose.anim === "hurt" ? Math.min(t - a.pose.t0, 60) : t - a.pose.t0;
      if(pt > a.pose.len) a.pose = null;
      else if(typeof brAnimDraw === "function" && brAnimDraw(x, id, a.pose.anim, variant, dir, pt / 1000 * (a.pose.anim === "hurt" ? 0.5 : 1), cx, cy, size, alpha)) return;
    }
    if(typeof brPmdDraw === "function" && brPmdDraw(x, id, variant, dir, moving ? t / 1000 : null, cx, cy, size, alpha)) return;
    const spr = typeof brSprite === "function" ? brSprite(id, white ? "w" : f.shiny ? "s" : "n") : null;
    if(spr){ x.globalAlpha = alpha; x.drawImage(spr, cx - size * 0.5, cy - size * 0.8, size, size); x.globalAlpha = 1; }
  };
  if(a.koT !== null){
    /* défragmentation : le sprite se découpe en bandes qui dérivent et s'effacent */
    const k = arClamp((t - a.koT) / 520), n = 9, top = p.y - size * 1.3, hh = size * 1.7 / n;
    for(let i = 0; i < n; i++){
      x.save(); x.beginPath(); x.rect(0, top + i * hh, AR.W, hh + 0.5); x.clip();
      draw(p.x + Math.sin(i * 12.9898 + 4) * 46 * k * k, p.y - k * 10, al * (1 - k) * (i % 2 && k > 0.5 ? 0.4 : 1));
      x.restore();
    }
    return;
  }
  /* la respiration : un léger écrasement, ancré aux pieds */
  const br = moving || a.pose ? 0 : Math.sin(t / 420 + (a.side === "ally" ? 0 : 1.7) + f.id) * 0.022;
  const st = a.stunT && t - a.stunT < 360 ? Math.sin((t - a.stunT) / 28) * 2.5 : 0;
  if(br){ x.save(); x.translate(p.x, p.y + size * 0.1); x.scale(1 - br * 0.6, 1 + br); x.translate(-p.x, -(p.y + size * 0.1)); draw(p.x + st, p.y, al); x.restore(); }
  else draw(p.x + st, p.y, al);
  if(!front) return;
  /* l'état se voit sur le Pokémon, pas seulement sur sa fiche */
  const stt = f.status && f.status.k, cy = p.y - size * 0.25;
  if(stt && Math.random() < 0.16){
    if(stt === "brn") AR.parts.push({x:p.x + (Math.random() - 0.5) * size * 0.5, y:cy + 6, vx:0, vy:-0.05, g:-0.0002, life:0, max:520, s:4, c:Math.random() < 0.5 ? "#ff8a3d" : "#ffe45e", sh:2, shrink:true});
    else if(stt === "psn") AR.parts.push({x:p.x + (Math.random() - 0.5) * size * 0.5, y:cy, vx:0, vy:-0.03, g:0, life:0, max:600, s:3, c:"#b86bff", sh:2});
    else if(stt === "par") AR.parts.push({x:p.x + (Math.random() - 0.5) * size * 0.6, y:cy + (Math.random() - 0.5) * size * 0.5, vx:(Math.random() - 0.5) * 0.2, vy:(Math.random() - 0.5) * 0.2, g:0, life:0, max:110, s:6, c:"#ffe45e", sh:1});
    else if(stt === "slp" && Math.random() < 0.2) arPop(p.x + 14, cy - 22, "z", "#9fb7d9", 8);
  }
  if(f.shiny && Math.random() < 0.07) AR.parts.push({x:p.x + (Math.random() - 0.5) * size * 0.7, y:cy + (Math.random() - 0.5) * size * 0.6, vx:0, vy:-0.02, g:0, life:0, max:520, s:5, c:"#ffe9a8", sh:3});
}

function arFrame(now){
  if(!AR || AR.b !== BATTLE || !AR.cv || !AR.cv.isConnected){ if(AR) AR.raf = 0; return; }
  AR.raf = requestAnimationFrame(arFrame);
  const real = Math.min(250, now - (AR.last || now)); AR.last = now;
  const dt = real * bSpeed();
  AR.t += dt;
  while(AR.ev.length && AR.ev[0].t <= AR.t){ const e = AR.ev.shift(); try { e.fn(); } catch(err){ console.error(err); } }
  const frozen = AR.t < AR.freeze, pdt = frozen ? dt * 0.08 : Math.min(dt, 120);
  const x = AR.x, W = AR.W, H = AR.H, d = AR.dpr, t = AR.t;
  x.setTransform(d, 0, 0, d, 0, 0);
  x.imageSmoothingEnabled = false;
  /* la caméra : elle tremble sous les coups, elle se resserre sur un critique */
  AR.shake *= Math.pow(0.86, real / 16);
  if(!frozen) AR.zoom *= Math.pow(0.9, real / 16);
  const sx = (Math.random() - 0.5) * AR.shake, sy = (Math.random() - 0.5) * AR.shake, z = 1 + AR.zoom * 0.055;
  x.save();
  x.translate(AR.zx, AR.zy); x.scale(z, z); x.translate(-AR.zx + sx, -AR.zy + sy);
  x.drawImage(AR.bg, -8, -8, W + 16, H + 16);
  /* les traces au sol : l'arène se souvient */
  for(let i = AR.decals.length - 1; i >= 0; i--){
    const dc = AR.decals[i], k = (t - dc.t0) / 9000;
    if(k >= 1){ AR.decals.splice(i, 1); continue; }
    x.globalAlpha = (1 - k) * 0.5; x.fillStyle = "#03050a";
    x.beginPath(); x.ellipse(dc.x, dc.y, dc.r, dc.r * 0.36, 0, 0, 7); x.fill();
    x.globalAlpha = (1 - k) * 0.35 * Math.max(0, 1 - (t - dc.t0) / 1400); x.strokeStyle = dc.c; x.lineWidth = 2;
    x.beginPath(); x.ellipse(dc.x, dc.y, dc.r * 0.8, dc.r * 0.28, 0, 0, 7); x.stroke(); x.globalAlpha = 1;
  }
  /* la poussière du lieu */
  if(Math.random() < 0.12 * Math.min(2, dt / 16)) AR.parts.push({x:Math.random() * W, y:H * 0.3 + Math.random() * H * 0.7, vx:0.004, vy:-0.012 - Math.random() * 0.012, g:0, life:0, max:2600, s:1.5, c:arCol(AR.type), dust:true});
  const list = [...AR.act.values()].filter(a=>a.role !== "gone").map(a=>[arPos(a).y, a]).sort((p, q)=>p[0] - q[0]);
  for(const [, a] of list) arDrawActor(x, a);
  /* effets et particules, en lumière additive */
  x.globalCompositeOperation = "lighter";
  for(let i = AR.fx.length - 1; i >= 0; i--){
    const f = AR.fx[i];
    if(t < f.t0) continue;
    if(t >= f.t1){ AR.fx.splice(i, 1); continue; }
    f.draw(x, (t - f.t0) / (f.t1 - f.t0));
  }
  for(let i = AR.parts.length - 1; i >= 0; i--){
    const p = AR.parts[i];
    p.life += pdt;
    if(p.life >= p.max){ AR.parts.splice(i, 1); continue; }
    p.vy += p.g * pdt; p.x += p.vx * pdt; p.y += p.vy * pdt;
    const k = p.life / p.max, s = p.shrink ? p.s * (1 - k * 0.7) : p.s;
    x.globalAlpha = (p.dust ? Math.sin(k * Math.PI) * 0.35 : 1 - k * k); x.fillStyle = p.c;
    if(p.sh === 1){ x.strokeStyle = p.c; x.lineWidth = 1.5; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - p.vx * 46, p.y - p.vy * 46); x.stroke(); }
    else if(p.sh === 2){ x.beginPath(); x.arc(p.x, p.y, s * 0.6, 0, 7); x.fill(); }
    else if(p.sh === 3){ x.fillRect(p.x - s / 2, p.y - 0.5, s, 1); x.fillRect(p.x - 0.5, p.y - s / 2, 1, s); }
    else x.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  x.restore();
  if(AR.flash){
    const k = (t - AR.flash.t) / AR.flash.d;
    if(k >= 1) AR.flash = null; else { x.fillStyle = arRgba(AR.flash.c, 0.34 * (1 - k)); x.fillRect(0, 0, W, H); }
  }
  if(AR.win && AR.win.v === false){ x.fillStyle = `rgba(4,4,10,${0.5 * arClamp((t - AR.win.t) / 700)})`; x.fillRect(0, 0, W, H); }
  /* le nom de l'attaque, au-dessus de celui qui la lance */
  x.textAlign = "center"; x.textBaseline = "middle";
  for(let i = AR.calls.length - 1; i >= 0; i--){
    const c = AR.calls[i], k = (t - c.t0) / 780;
    if(k >= 1){ AR.calls.splice(i, 1); continue; }
    x.font = `7px ${AR_FONT}`;
    const w = x.measureText(c.txt).width + 12, cx = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, c.x)), cy = Math.max(12, c.y - arEase(k * 3) * 6);
    x.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
    x.fillStyle = "rgba(5,9,18,.9)"; x.fillRect(cx - w / 2, cy - 8, w, 16);
    x.strokeStyle = c.c; x.lineWidth = 1; x.strokeRect(cx - w / 2 + 0.5, cy - 7.5, w - 1, 15);
    x.fillStyle = "#ffffff"; x.fillText(c.txt, cx, cy + 1); x.globalAlpha = 1;
  }
  /* les chiffres : ils jaillissent, grossissent, s'élèvent */
  for(let i = AR.pops.length - 1; i >= 0; i--){
    const p = AR.pops[i], k = (t - p.t0) / (p.big ? 1000 : 820);
    if(k >= 1){ AR.pops.splice(i, 1); continue; }
    const sc = k < 0.14 ? 0.6 + k / 0.14 * 0.75 : 1.35 - arClamp((k - 0.14) / 0.2) * 0.35;
    x.font = `${Math.round(p.size * sc)}px ${AR_FONT}`;
    x.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    const y = p.y - arEase(k) * 30;
    x.fillStyle = "#000"; x.fillText(p.txt, p.x + 1, y + 2);
    x.lineWidth = 3; x.strokeStyle = "rgba(0,0,0,.85)"; x.strokeText(p.txt, p.x, y);
    x.fillStyle = p.c; x.fillText(p.txt, p.x, y); x.globalAlpha = 1;
  }
  arDrawCard(x);
  /* la victoire : l'équipe saute de joie */
  if(AR.win && AR.win.v){
    let i = 0;
    for(const a of AR.act.values()) if(a.side === "ally" && a.role !== "gone" && t - a.hopT > 620 + (i++) * 90) a.hopT = t;
  }
}
/* la carte de nom d'un gardien : deux bandes, un nom qui se fige */
function arDrawCard(x){
  const c = AR.card; if(!c) return;
  const t = AR.t, W = AR.W, H = AR.H;
  if(t < c.t0) return;
  if(t >= c.t1){ AR.card = null; return; }
  const k = (t - c.t0) / (c.t1 - c.t0), inn = arEase(k * 5), out = k > 0.85 ? (1 - k) / 0.15 : 1, a = Math.min(inn, out);
  const bar = (c.small ? 12 : 22) * a;
  x.fillStyle = "#000"; x.fillRect(0, 0, W, bar); x.fillRect(0, H - bar, W, bar);
  const y = c.small ? H * 0.2 : H * 0.6, h = c.small ? 30 : 46;
  x.globalAlpha = a * 0.92;
  const g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(3,6,12,0)"); g.addColorStop(0.18, "rgba(3,6,12,.95)"); g.addColorStop(0.82, "rgba(3,6,12,.95)"); g.addColorStop(1, "rgba(3,6,12,0)");
  x.fillStyle = g; x.fillRect(0, y - h / 2, W, h);
  x.fillStyle = c.c; x.fillRect(W * 0.5 - W * 0.36 * inn, y - h / 2, W * 0.72 * inn, 1.5); x.fillRect(W * 0.5 - W * 0.36 * inn, y + h / 2 - 1.5, W * 0.72 * inn, 1.5);
  x.globalAlpha = a; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = `7px ${AR_FONT}`; x.fillStyle = c.c; x.fillText(c.top, W / 2, y - (c.small ? 7 : 11));
  let size = c.small ? 10 : 14;
  x.font = `${size}px ${AR_FONT}`;
  while(size > 8 && x.measureText(c.name).width > W * 0.66){ size--; x.font = `${size}px ${AR_FONT}`; }
  /* le nom tremble avant de se fixer : la signature se résout */
  const j = k < 0.3 ? (1 - k / 0.3) * 5 : 0, ny = y + (c.small ? 6 : 8);
  if(j > 0.3){ x.fillStyle = "#ff3d7f"; x.fillText(c.name, W / 2 - j, ny); x.fillStyle = "#35f0d6"; x.fillText(c.name, W / 2 + j, ny + (Math.random() - 0.5) * j); }
  x.fillStyle = "#ffffff"; x.fillText(c.name, W / 2, ny);
  x.globalAlpha = 1;
}

/* ============================================================
   6. L'HABILLAGE — fiches de points de vie par-dessus le canvas
   ============================================================ */
function arRender(host){
  if(!AR || AR.b !== BATTLE) arMake();
  let cv = host.querySelector ? host.querySelector("canvas.arcv") : null;
  if(!cv){
    host.innerHTML = `<canvas class="arcv"></canvas>
      <div class="arplate foe" id="arpf"></div><div class="arplate ally" id="arpa"></div>
      <div class="turnflag" id="arflag"></div><div class="arhint" id="arhint"></div>`;
    cv = host.querySelector("canvas.arcv");
    const Hh = arHeight();
    host.style.height = Hh + "px";
    const W = Math.max(280, Math.round(host.clientWidth || 360)), d = Math.min(3, window.devicePixelRatio || 1);
    cv.width = W * d; cv.height = Hh * d;
    const resized = AR.W !== W || AR.H !== Hh;
    AR.W = W; AR.H = Hh; AR.k = Math.min(1.3, Hh / AR_H); AR.dpr = d; AR.cv = cv; AR.x = cv.getContext("2d");
    if(resized || !AR.bg) AR.bg = arBackdrop();
    /* maintenir le doigt : le combat file ; relâcher : il reprend son pas */
    const turbo = on => { if(BATTLE && BATTLE.ai) BATTLE.turbo = on; };
    cv.addEventListener("pointerdown", () => turbo(true));
    for(const ev of ["pointerup", "pointerleave", "pointercancel"]) cv.addEventListener(ev, () => turbo(false));
    /* les planches de l'équipe adverse arrivent pendant l'entrée en scène */
    if(typeof brPmdEntry === "function") for(const a of AR.act.values()){ brPmdEntry(a.f.id);
      if(typeof brAnimSheet === "function") for(const an of ["attack", "shoot", "hurt"]) brAnimSheet(a.f.id, an, "n"); }
  }
  if(!AR.raf){ AR.last = 0; AR.raf = requestAnimationFrame(arFrame); }
  arSync();
}
function arPlate(el, f, side){
  if(!el) return;
  const a = arOf(f), list = side === "foe" ? BATTLE.foes : BATTLE.allies;
  const key = side + list.indexOf(f);
  if(el.dataset.k !== key){
    el.dataset.k = key;
    el.innerHTML = `<div class="row between"><span class="arn">${esc(f.name)}</span><span class="dim arlv">N.${f.level}</span></div>
      <div class="arbar"><b></b><i></i></div>
      <div class="row between tiny mono-num"><span class="armk"></span><span class="arhp dim"></span></div>
      ${side === "foe" && list.length > 1 ? `<div class="arpips"></div>` : ""}`;
    el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
  }
  const r = Math.max(0, a.shp / f.maxHp) * 100;
  const bar = el.querySelector(".arbar");
  bar.className = "arbar " + (r > 50 ? "" : r > 20 ? "mid" : "low");
  bar.querySelector("i").style.width = r + "%";
  bar.querySelector("b").style.width = r + "%";
  el.querySelector(".arhp").textContent = Math.max(0, Math.round(a.shp)) + " / " + f.maxHp;
  el.querySelector(".armk").innerHTML = statusBadge(f) + buffMarks(f) + talentMark(f);
  const pips = el.querySelector(".arpips");
  if(pips) pips.innerHTML = list.map(o=>`<s class="${arOf(o).role === "gone" ? "ko" : o === f ? "on" : ""}"></s>`).join("");
}
function arSync(){
  if(!AR || !AR.cv || !AR.cv.isConnected) return;
  arPlate(document.getElementById("arpf"), AR.sf, "foe");
  arPlate(document.getElementById("arpa"), AR.sa, "ally");
  const fl = document.getElementById("arflag"), B = BATTLE;
  if(fl){
    fl.className = "turnflag" + (B.over ? " done" : B.busy && !B.ai ? " wait" : "");
    fl.textContent = B.over ? "COMBAT TERMINÉ" : B.ai ? "TOUR " + Math.max(1, B.turn) : B.busy ? "RÉSOLUTION" : "À VOUS";
  }
  const hint = document.getElementById("arhint");
  if(hint) hint.textContent = B.ai && !B.over && B.turn <= 2 ? "Maintenir pour accélérer" : "";
  /* la bande d'équipe suit les points de vie affichés, pas ceux déjà calculés */
  const team = document.getElementById("battle-team");
  if(team && team.children) [...team.children].forEach((el, i)=>{
    const f = B.allies[i]; if(!f) return;
    const a = arOf(f), bar = el.querySelector(".bar i");
    if(bar) bar.style.width = Math.max(0, a.shp / f.maxHp * 100) + "%";
    el.classList.toggle("ko", a.shp <= 0);
    el.classList.toggle("active", f === AR.sa);
  });
}
