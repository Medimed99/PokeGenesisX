/* ============================================================
   59l — LA BRÈCHE · LES ATTAQUES DES LÉGENDAIRES
   Retour de jeu : « Jirachi a les mêmes attaques qu'Électhor, qui a
   les mêmes que Rayquaza, avec d'autres couleurs. » C'était vrai :
   trois pluies de frappes, trois fissures, deux murs, deux balayages.

   Chaque légendaire a désormais une attaque qui n'appartient qu'à lui :
   une mécanique, un dessin, une façon de jouer.
     Artikodin   des flocons gèlent ; un ennemi gelé vole en éclats
     Électhor    des plumes chargées, reliées par la foudre : une cage
     Sulfura     une traînée de feu derrière l'équipe, des battements d'ailes
     Raikou      un nuage d'orage qui suit, et foudroie à la verticale
     Entei       des bombes de lave, et les mares de magma qu'elles laissent
     Suicune     des voiles d'aurore qui balaient l'écran et purifient
     Lugia       le vent se rassemble, puis un rayon fend la horde en deux
     Ho-Oh       un feu sacré qui passe d'un ennemi à l'autre, et soigne
     Celebi      le temps s'arrête ; les coups tombent tous quand il repart
     Regirock    des menhirs qui bloquent la horde, puis éclatent
     Regice      un prisme de glace aux rayons tournants
     Registeel   verrouillage de l'ennemi le plus solide, puis le tir
     Latias      des sphères de brume : la horde y encaisse plus, toi tu y guéris
     Latios      un piqué d'un bord à l'autre de l'écran, la trace explose
     Kyogre      deux vagues d'un bord à l'autre, qui emportent tout
     Groudon     des anneaux de lames de roche qui jaillissent du sol
     Rayquaza    un serpent céleste qui tourne autour de l'équipe
     Jirachi     des étoiles filantes, et parfois un vœu exaucé
     Deoxys      trois formes qui se relaient : Attaque, Défense, Vitesse
   Mewtwo (la singularité) et Mew (le Métronome) gardent les leurs, déjà
   uniques ; le Métronome peut désormais tirer l'attaque d'un autre
   légendaire.

   Les dessins se font en trois couches : au sol (sous la horde), au-
   dessus de la horde, et dans le ciel (au-dessus de tout, arbres compris).
   Puissance : chaque signature vaut environ deux attaques ordinaires,
   mesurée par legdps.js comme les autres formes par brdps.js.
   ============================================================ */
const LG_TAU = Math.PI * 2;
const BR_LEG_NEW = {
  144:{k:"lgGivre",    n:"Blizzard",          n2:"Ère Glaciaire",       c:"#bff4ff", dmg:10.6, cd:1.4,
       d:"Des flocons tombent et gèlent ce qu'ils touchent ; un ennemi déjà gelé vole en éclats."},
  145:{k:"lgCage",     n:"Cage-Éclair",       n2:"Ciel Foudroyé",       c:"#ffe45e", dmg:3.5,  cd:3.2,
       d:"Plante des plumes chargées autour de la horde ; la cage de foudre se resserre et frappe ce qu'elle enferme."},
  146:{k:"lgSillage",  n:"Sillage Ardent",    n2:"Phénix",              c:"#ff8a3d", dmg:5.6,  cd:0.22,
       d:"Une traînée de feu suit l'équipe ; de temps en temps, un battement d'ailes embrase tout autour."},
  243:{k:"lgNuage",    n:"Tonnerre",          n2:"Orage Perpétuel",     c:"#ffe45e", dmg:5.8,  cd:3.0,
       d:"Un nuage d'orage suit l'équipe et foudroie à la verticale ce qui passe dessous."},
  244:{k:"lgEruption", n:"Éruption",          n2:"Magma Sacré",         c:"#ff5a1a", dmg:13.6, cd:2.4,
       d:"Projette des bombes de lave qui retombent autour, et laissent des mares de magma."},
  245:{k:"lgAurore",   n:"Rideau d'Aurore",   n2:"Aurore Boréale",      c:"#6fe8ff", dmg:22,   cd:2.6,
       d:"Des voiles d'aurore balaient tout l'écran et ralentissent la horde ; éveillé, chaque ennemi touché te soigne."},
  249:{k:"lgAero",     n:"Aéroblast",         n2:"Aéroblast Divin",     c:"#e0ecff", dmg:34,   cd:2.4,
       d:"Le vent se rassemble, puis un rayon immense fend le plus gros de la horde, qui s'écarte."},
  250:{k:"lgSacre",    n:"Feu Sacré",         n2:"Renaissance",         c:"#ffb35c", dmg:17.5, cd:1.5,
       d:"Des flammes arc-en-ciel ; un ennemi qui brûle transmet le feu sacré en tombant, et l'équipe se soigne."},
  251:{k:"lgTemps",    n:"Voile Temporel",    n2:"Retour dans le Temps",c:"#9fe07a", dmg:5.3,  cd:3.6,
       d:"Arrête le temps autour de l'équipe ; les coups s'accumulent et tombent tous d'un coup quand il repart."},
  377:{k:"lgMenhir",   n:"Monolithes",        n2:"Colosse de Pierre",   c:"#d9a86a", dmg:7.4,  cd:3.4,
       d:"Des menhirs jaillissent sous la horde, lui barrent la route, puis éclatent."},
  378:{k:"lgPrisme",   n:"Prisme Glacé",      n2:"Cristal Absolu",      c:"#aef4ff", dmg:5.3,  cd:3.2,
       d:"Pose un prisme de glace dont les rayons tournent et ralentissent ce qu'ils traversent."},
  379:{k:"lgVerrou",   n:"Verrouillage",      n2:"Élecanon",            c:"#c7d2e0", dmg:16.5, cd:2.6,
       d:"Verrouille l'ennemi le plus solide, puis l'écrase d'un tir d'acier : taillé pour les élites et les boss."},
  380:{k:"lgBrume",    n:"Ball'Brume",        n2:"Brume Éon",           c:"#ff9ad5", dmg:7,    cd:2.0,
       d:"Des sphères de brume : dans le nuage, la horde encaisse plus, et toi, tu guéris."},
  381:{k:"lgPique",    n:"Lumi-Éclat",        n2:"Rayon Éon",           c:"#6fa8ff", dmg:17,   cd:2.2,
       d:"Latios traverse l'écran en piqué ; la trace qu'il laisse explose derrière lui."},
  382:{k:"lgTsunami",  n:"Onde Originelle",   n2:"Océan Primordial",    c:"#3a8bff", dmg:30,   cd:4.4,
       d:"Deux vagues partent de l'équipe vers les bords de l'écran et emportent toute la horde."},
  383:{k:"lgPangee",   n:"Lame Pangéenne",    n2:"Continent Primordial",c:"#ff6a1a", dmg:7.5,  cd:2.6,
       d:"Des anneaux de lames de roche jaillissent du sol, en vagues autour de l'équipe."},
  384:{k:"lgSerpent",  n:"Draco-Ascension",   n2:"Colère du Ciel",      c:"#5ce07a", dmg:12,   cd:0.05,
       d:"Un serpent céleste ondule autour de l'équipe, plonge jusqu'à elle et fend la horde qu'il traverse."},
  385:{k:"lgEtoiles",  n:"Vœu Destructeur",   n2:"Vœu Millénaire",      c:"#ffe9a8", dmg:15,   cd:1.6,
       d:"Des étoiles filantes traversent l'écran ; de temps en temps, un vœu exaucé te soigne."},
  386:{k:"lgFormes",   n:"Psycho Boost",      n2:"Psycho Boost Ω",      c:"#ff5c8a", dmg:12.5, cd:0.3,
       d:"Change de forme toutes les sept secondes : Attaque, Défense, Vitesse."}
};
const BR_LEG_DESC = {150:"Ouvre une singularité psychique qui aspire la horde, puis éclate.",
                     151:"Une attaque au hasard parmi toutes, parfois celle d'un autre légendaire."};
/* les formes qui n'appartiennent qu'aux légendaires */
const BR_LEG_KIND = {};
for(const id in BR_LEG_NEW){
  const N = BR_LEG_NEW[id];
  BR_LEGEND[id] = Object.assign({}, BR_LEGEND[id] || {}, N, {p:{}});
  BR_LEG_KIND[N.k] = true;
  delete BR_ARCH_CACHE[id];
}
/* l'attaque d'un légendaire porte sa description (cartes de choix, lobby) */
const _brArchForL = brArchFor;
brArchFor = function(id){
  if(BR_ARCH_CACHE[id]) return BR_ARCH_CACHE[id];
  const a = _brArchForL(id);
  if(BR_LEGEND[id]) a.d = BR_LEGEND[id].d || BR_LEG_DESC[id] || "";
  return a;
};

/* ---------- outils ---------- */
function lgView(R){ const c = R.cam || R; return {x0:c.x - R.W / 2, x1:c.x + R.W / 2, y0:c.y - R.H / 2, y1:c.y + R.H / 2, cx:c.x, cy:c.y}; }
function lgSegDist(px, py, ax, ay, bx, by){
  const vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy || 1;
  let t = ((px - ax) * vx + (py - ay) * vy) / L; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}
/* les ennemis touchés par un segment (court : par la grille ; long : un à un) */
function lgHitSeg(R, ax, ay, bx, by, wdt, fn){
  const half = Math.hypot(bx - ax, by - ay) / 2;
  const test = f => { if(f.hp > 0 && !(f.under > 0) && lgSegDist(f.x, f.y, ax, ay, bx, by) < wdt + f.r) fn(f); };
  if(half > 220) R.P.foes.each(f=>{ if(f.on) test(f); });
  else brNear(R, (ax + bx) / 2, (ay + by) / 2, half + wdt + 30, test);
}
function lgShards(R, x, y, dmg, wi, n, skip){
  for(let k = 0; k < n; k++){
    const a = k / n * LG_TAU + R.rng() * 0.4;
    const s = brShot(R, x, y, Math.cos(a) * 300, Math.sin(a) * 300, {dmg, r:5, color:"#dff9ff", life:0.4, kind:"shard", pierce:1, slow:1, w:wi});
    if(skip) s.hits.push(skip);
  }
}
function lgHit(R, f, dmg, color, x0, y0, kb){
  const dx = f.x - x0, dy = f.y - y0, d = Math.hypot(dx, dy) || 1;
  brHit(R, f, dmg, color, dx / d, dy / d, kb || 0);
}
function lgMember(R, i, z){ return R.team[i] ? brMemberPos(R, i) : z; }
const BR_LEG_FIRE = {}, BR_LEG_ZONE = {}, BR_LEG_DRAW = {};
/* les formes continues ne prennent pas de pose de tir ; celles qui frappent le sol prennent la pose du coup */
const BR_LEG_NOPOSE = new Set(["lgSillage", "lgSerpent", "lgFormes"]);
try { BR_MELEE.add("lgMenhir"); BR_MELEE.add("lgPangee"); } catch(e){}

/* ============================================================
   144 ARTIKODIN — Blizzard
   ============================================================ */
/* des cibles distinctes, au hasard dans le voisinage ; les ennemis déjà gelés d'abord, pour les briser */
function lgPickTargets(R, x, y, rad, n, first){
  const frz = [], rest = [];
  R.P.foes.each(f=>{
    if(f.hp <= 0 || f.under > 0 || (f.boss && f.shield)) return;
    if((f.x - x) ** 2 + (f.y - y) ** 2 > rad * rad) return;
    (first && first(f) ? frz : rest).push(f);
  });
  const out = [];
  for(const L of [frz, rest]) while(out.length < n && L.length) out.push(L.splice(Math.floor(R.rng() * L.length), 1)[0]);
  return out;
}
BR_LEG_FIRE.lgGivre = (R, w, st, pos) => {
  const n = 2 + st.count, evo = w.stage >= 2, T = lgPickTargets(R, pos.x, pos.y, 330, n, f=>f.frz > 0.2);
  for(let k = 0; k < n; k++){
    const t = T[k], a = R.rng() * LG_TAU, d = 60 + R.rng() * 150;
    const x = t ? t.x + (R.rng() - .5) * 12 : pos.x + Math.cos(a) * d;
    const y = t ? t.y + (R.rng() - .5) * 12 : pos.y + Math.sin(a) * d;
    const fall = 0.5 + k * 0.08;
    brZone(R, {k:"lgGivre", x, y, r:32 * Math.min(1.5, st.area) * (evo ? 1.15 : 1), life:fall, max:fall, delay:0, dmg:st.dmg * (evo ? 1.25 : 1), color:st.color,
      w:R.curW, spin:R.rng() * 6, evo});
  }
};
BR_LEG_ZONE.lgGivre = (R, z) => {
  if(z.life > 0) return;
  z.on = false; R.curW = z.w;
  let shat = 0;
  brNear(R, z.x, z.y, z.r + 20, f=>{
    if(f.under > 0 || Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r) return;   /* sous terre, hors d'atteinte */
    if(f.frz > 0 && R.t - (f.frzT || 0) > 0.3){
      /* déjà gelé (et pas par ce même blizzard) : il vole en éclats */
      f.frz = 0; f.stun = 0; shat++;
      brHit(R, f, z.dmg * 2, "#ffffff", 0, 0, 0);
      lgShards(R, f.x, f.y, z.dmg * 0.35, z.w, 5, f);
    } else {
      brHit(R, f, z.dmg, z.color, 0, 0, 0);
      if(f.hp > 0 && !f.boss && !f.reaper){ if(!(f.frz > 0)) f.frzT = R.t; f.frz = z.evo ? 2.6 : 2.0; f.stun = Math.max(f.stun || 0, f.frz); }
      else if(f.hp > 0) f.slow = Math.max(f.slow || 0, 1.5);
    }
  });
  brBurst(R, z.x, z.y, "#e8fbff", shat ? 12 : 6, shat ? 230 : 140, 0.4);
  if(shat) brShake(R, 1.5);
  if(R.rng() < 0.5) brDecal(R, "frost", z.x, z.y, z.r * 0.8, 6);
  if(z.evo) brZone(R, {k:"lgGel", x:z.x, y:z.y, r:z.r * 1.2, life:2.4, max:2.4, delay:0, dmg:0, color:z.color, w:z.w, tick:0});
};
BR_LEG_ZONE.lgGel = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.3;
  brNear(R, z.x, z.y, z.r, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r * 0.5) f.slow = Math.max(f.slow || 0, 0.8); });
};
function lgFlake(x, cx, cy, s, rot){
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.lineWidth = Math.max(1.5, s * 0.16); x.lineCap = "round";
  x.beginPath();
  for(let i = 0; i < 6; i++){
    const a = i / 6 * LG_TAU, c = Math.cos(a), si = Math.sin(a);
    x.moveTo(0, 0); x.lineTo(c * s, si * s);
    const bx = c * s * 0.55, by = si * s * 0.55, b1 = a + 0.6, b2 = a - 0.6;
    x.moveTo(bx, by); x.lineTo(bx + Math.cos(b1) * s * 0.3, by + Math.sin(b1) * s * 0.3);
    x.moveTo(bx, by); x.lineTo(bx + Math.cos(b2) * s * 0.3, by + Math.sin(b2) * s * 0.3);
  }
  x.stroke(); x.restore();
}
BR_LEG_DRAW.lgGivre = {
  ground(x, R, z, X, Y){
    const k = 1 - Math.max(0, z.life) / z.max;
    x.globalAlpha = 0.1 + 0.18 * k; x.fillStyle = "#bff4ff";
    x.beginPath(); x.ellipse(X(z.x), Y(z.y), z.r * (0.3 + 0.7 * k), z.r * (0.3 + 0.7 * k) * 0.55, 0, 0, LG_TAU); x.fill();
    x.globalAlpha = 1;
  },
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, h = 260 * k;
    const s = 9 + 6 * (z.evo ? 1 : 0);
    x.globalCompositeOperation = "lighter";
    x.globalAlpha = 0.2; x.fillStyle = "#bff4ff"; x.beginPath(); x.arc(X(z.x), Y(z.y) - h, s * 1.4, 0, LG_TAU); x.fill();
    x.globalAlpha = 1; x.strokeStyle = "#ffffff";
    lgFlake(x, X(z.x), Y(z.y) - h, s, z.spin + k * 7);
    x.globalCompositeOperation = "source-over";
  }
};
BR_LEG_DRAW.lgGel = {
  ground(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max;
    x.globalAlpha = 0.07 * Math.min(1, k * 3); x.fillStyle = "#dff9ff";
    x.beginPath(); x.arc(X(z.x), Y(z.y), z.r, 0, LG_TAU); x.fill();
    x.globalAlpha = 0.32 * Math.min(1, k * 3); x.strokeStyle = "#ffffff"; x.lineWidth = 1;
    x.setLineDash([3, 6]); x.beginPath(); x.arc(X(z.x), Y(z.y), z.r, 0, LG_TAU); x.stroke(); x.setLineDash([]);
    x.globalAlpha = 1;
  }
};

/* ============================================================
   145 ÉLECTHOR — Cage-Éclair
   ============================================================ */
BR_LEG_FIRE.lgCage = (R, w, st, pos, tgt) => {
  const n = Math.max(3, Math.min(6, 2 + st.count)), rad = 100 * Math.sqrt(st.area), a0 = R.rng() * LG_TAU, pts = [], dirs = [];
  /* autour de l'ennemi le plus proche, s'il y en a un à portée ; sinon autour de l'équipe */
  const c = tgt && Math.hypot(tgt.x - pos.x, tgt.y - pos.y) < 260 ? tgt : pos;
  for(let k = 0; k < n; k++){ const a = a0 + k / n * LG_TAU; dirs.push([Math.cos(a), Math.sin(a)]); pts.push({x:c.x + Math.cos(a) * rad, y:c.y + Math.sin(a) * rad}); }
  const evo = w.stage >= 2;
  brZone(R, {k:"lgCage", x:c.x, y:c.y, r:rad, r0:rad, life:4, max:4, delay:0, dmg:st.dmg * (1 + 0.12 * (st.count - 1)), color:st.color, w:R.curW, tick:0, tick2:0.2, pts, dirs, evo,
    zap:0.4 / (1 + 0.15 * (st.count - 1))});
};
function lgCageSegs(z){
  const P = z.pts, n = P.length, segs = [];
  for(let k = 0; k < n; k++) segs.push([P[k], P[(k + 1) % n]]);
  /* éveillé : la plume du centre relie toutes les autres, en étoile */
  if(z.evo) for(const p of P) segs.push([{x:z.x, y:z.y}, p]);
  return segs;
}
BR_LEG_ZONE.lgCage = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  R.curW = z.w;
  /* la cage se resserre : ses arcs balaient tout ce qu'elle enferme */
  z.r = z.r0 * (1 - 0.7 * (1 - Math.max(0, z.life) / z.max));
  z.pts.forEach((p, i)=>{ p.x = z.x + z.dirs[i][0] * z.r; p.y = z.y + z.dirs[i][1] * z.r; });
  /* dedans : une plume foudroie un prisonnier */
  z.tick2 -= dt;
  if(z.tick2 <= 0){
    z.tick2 = z.zap || 0.4;
    const ins = [];
    brNear(R, z.x, z.y, z.r, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r * 0.85) ins.push(f); });
    if(ins.length){
      const f = ins[Math.floor(R.rng() * ins.length)], p = z.pts[Math.floor(R.rng() * z.pts.length)];
      brHit(R, f, z.dmg * 1.5, z.color, 0, 0, 0);
      Object.assign(brFxNew(R), {k:"bolt", pts:[{x:p.x, y:p.y - 10}, {x:f.x, y:f.y}], life:0.14, max:0.14, color:"#fff6b0"});
    }
  }
  /* les arcs : qui les traverse est foudroyé */
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.35;
  const hit = new Set();
  for(const [a, b] of lgCageSegs(z)) lgHitSeg(R, a.x, a.y, b.x, b.y, 12, f=>{
    if(hit.has(f)) return; hit.add(f);
    brHit(R, f, z.dmg, z.color, 0, 0, 0);
    if(!f.boss && f.hp > 0 && R.rng() < 0.18) f.stun = Math.max(f.stun || 0, 0.5);
  });
};
function lgFeather(x, cx, cy, rot, s){
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.fillStyle = "#ffd24a"; x.beginPath(); x.ellipse(0, -s * 0.5, s * 0.32, s, 0, 0, LG_TAU); x.fill();
  x.strokeStyle = "#7a5a10"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, s * 0.5); x.lineTo(0, -s * 1.4); x.stroke();
  x.restore();
}
BR_LEG_DRAW.lgCage = {
  mid(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 5), calm = typeof calmFx === "function" && calmFx();
    x.globalCompositeOperation = "lighter";
    for(const [a, b] of lgCageSegs(z)){
      const ax = X(a.x), ay = Y(a.y), bx = X(b.x), by = Y(b.y), n = 7;
      for(const [col, lw, al] of [["#ffe45e", 5, 0.35], ["#fffbe0", 1.8, 0.95]]){
        x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = al * fade;
        x.beginPath(); x.moveTo(ax, ay);
        for(let i = 1; i < n; i++){
          const t = i / n, j = calm ? 0 : (R.rng() - .5) * 14;
          x.lineTo(ax + (bx - ax) * t + j * -(by - ay) / (Math.hypot(bx - ax, by - ay) || 1), ay + (by - ay) * t + j * (bx - ax) / (Math.hypot(bx - ax, by - ay) || 1));
        }
        x.lineTo(bx, by); x.stroke();
      }
    }
    x.globalAlpha = 0.4 * fade; x.fillStyle = "#ffe45e";
    for(const p of z.pts){ x.beginPath(); x.arc(X(p.x), Y(p.y), 13 + Math.sin(R.t * 9) * 2, 0, LG_TAU); x.fill(); }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = fade;
    z.pts.forEach((p, i)=>lgFeather(x, X(p.x), Y(p.y) - 6, -0.35 + i * 0.2, 8));
    if(z.evo) lgFeather(x, X(z.x), Y(z.y) - 6, 0, 9);
    x.globalAlpha = 1;
  }
};

/* ============================================================
   146 SULFURA — Sillage Ardent
   ============================================================ */
BR_LEG_FIRE.lgSillage = (R, w, st, pos) => {
  w.lgN = (w.lgN || 0) + 1;
  const evo = w.stage >= 2, r = 24 * st.area * (evo ? 1.35 : 1), life = evo ? 2.8 : 2.1;
  const last = w.lgLast;
  /* immobile : on ravive la même flamme plutôt que d'en empiler */
  if(last && last.on && last.k === "lgFlamme" && last.w === R.curW && Math.hypot(last.x - pos.x, last.y - pos.y) < r * 0.8) last.life = Math.max(last.life, life);
  else w.lgLast = brZone(R, {k:"lgFlamme", x:pos.x, y:pos.y, r, life, max:life, delay:0, dmg:st.dmg, color:st.color, w:R.curW, tick:0, seed:R.rng() * 10});
  w.lgHit = w.lgHit || new Map();
  if(w.lgHit.size > 400) w.lgHit.clear();
  w.lgHcd = 0.35 * Math.min(1, st.cd / 0.22);
  /* un battement d'ailes : tout autour s'embrase */
  if(w.lgN % (evo ? 5 : 9) === 0){
    const rad = 95 * st.area, wing = 2.4 * (1 + 0.3 * (st.count - 1)) * (evo ? 1.25 : 1);
    brNear(R, pos.x, pos.y, rad + 20, f=>{
      if(Math.hypot(f.x - pos.x, f.y - pos.y) > rad + f.r) return;
      lgHit(R, f, st.dmg * wing, st.color, pos.x, pos.y, 260);
      if(f.hp > 0){ f.dot = 2.5; f.dotDmg = Math.max(f.dotDmg || 0, st.dmg * 0.45); f.burn = 2.5; }
    });
    brZone(R, {k:"lgAiles", x:pos.x, y:pos.y, r:rad, life:0.45, max:0.45, delay:0, dmg:0, color:st.color, w:R.curW, follow:R.curW});
    brShake(R, 2);
  }
};
BR_LEG_ZONE.lgFlamme = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  if(R.rng() < dt * 6) brBurst(R, z.x + (R.rng() - .5) * z.r, z.y + (R.rng() - .5) * z.r * 0.6, R.rng() < 0.5 ? "#ffd24a" : "#ff8a3d", 1, 60, 0.5);
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.12; R.curW = z.w;
  const w = R.team[z.w], H = w && w.lgHit;
  brNear(R, z.x, z.y, z.r + 20, f=>{
    if(Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r * 0.6) return;
    /* une traînée de plusieurs flammes ne brûle pas plus vite qu'une seule */
    if(H){ const last = H.get(f) || -9; if(R.t - last < (w.lgHcd || 0.35)) return; H.set(f, R.t); }
    brHit(R, f, z.dmg, z.color, 0, 0, 0);
    if(f.hp > 0) f.burn = Math.max(f.burn || 0, 1.2);
  });
};
BR_LEG_ZONE.lgAiles = (R, z) => { const m = lgMember(R, z.follow, z); z.x = m.x; z.y = m.y; if(z.life <= 0) z.on = false; };
BR_LEG_DRAW.lgFlamme = {
  ground(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 3), cx = X(z.x), cy = Y(z.y);
    x.globalAlpha = 0.22 * fade; x.fillStyle = "#3a1206";
    x.beginPath(); x.ellipse(cx, cy, z.r, z.r * 0.55, 0, 0, LG_TAU); x.fill();
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 4; i++){
      const ox = (i - 1.5) * z.r * 0.45, ph = R.t * 11 + z.seed + i * 1.7, h = z.r * (0.9 + 0.35 * Math.sin(ph)) * (0.6 + 0.4 * fade);
      x.globalAlpha = 0.55 * fade; x.fillStyle = i % 2 ? "#ff8a3d" : "#ff5a1a";
      x.beginPath(); x.moveTo(cx + ox - z.r * 0.28, cy); x.quadraticCurveTo(cx + ox + Math.sin(ph) * 4, cy - h * 0.6, cx + ox + Math.sin(ph * 1.3) * 3, cy - h);
      x.quadraticCurveTo(cx + ox + 2, cy - h * 0.5, cx + ox + z.r * 0.28, cy); x.closePath(); x.fill();
      x.globalAlpha = 0.6 * fade; x.fillStyle = "#ffe9a8";
      x.beginPath(); x.moveTo(cx + ox - z.r * 0.1, cy); x.quadraticCurveTo(cx + ox, cy - h * 0.4, cx + ox + Math.sin(ph) * 2, cy - h * 0.55);
      x.quadraticCurveTo(cx + ox + 1, cy - h * 0.2, cx + ox + z.r * 0.1, cy); x.closePath(); x.fill();
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgAiles = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, s = 1 - k, cx = X(z.x), cy = Y(z.y) - 10;
    x.globalCompositeOperation = "lighter";
    for(const side of [-1, 1]){
      for(const [col, lw, al] of [["#ff5a1a", 16, 0.4], ["#ffd24a", 6, 0.8]]){
        x.strokeStyle = col; x.lineWidth = lw * (0.4 + 0.6 * k); x.globalAlpha = al * k;
        x.beginPath();
        x.ellipse(cx + side * z.r * 0.45 * (0.5 + s), cy - 6, z.r * (0.35 + 0.5 * s), z.r * (0.2 + 0.35 * s), side * 0.5, side > 0 ? -2.4 : -0.7, side > 0 ? 0.7 : 2.4, side < 0);
        x.stroke();
      }
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};

/* ============================================================
   243 RAIKOU — Tonnerre
   ============================================================ */
BR_LEG_FIRE.lgNuage = (R, w, st, pos) => {
  const n = w.stage >= 2 ? 2 : 1;
  for(let k = 0; k < n; k++)
    brZone(R, {k:"lgNuage", x:pos.x, y:pos.y - 20, r:210 * st.area, life:3.2, max:3.2, delay:0, dmg:st.dmg, color:st.color, w:R.curW,
      tick:0.15 + k * 0.17, follow:R.curW, off:n > 1 ? (k ? 1 : -1) : 0, cnt:(n > 1 ? 1 : 2) + Math.floor((st.count - 1) / 2), flash:0, every:n > 1 ? 0.4 : 0.32});
};
BR_LEG_ZONE.lgNuage = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  const m = lgMember(R, z.follow, z), k = Math.min(1, dt * 4);
  z.x += (m.x + z.off * 46 - z.x) * k; z.y += (m.y - 20 - z.y) * k;
  if(z.flash > 0) z.flash -= dt;
  z.tick -= dt; if(z.tick > 0) return; z.tick = z.every || 0.32; R.curW = z.w;
  const cands = [];
  brNear(R, z.x, z.y, z.r, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r) cands.push(f); });
  for(let i = 0; i < z.cnt && cands.length; i++){
    const t = cands.splice(Math.floor(R.rng() * cands.length), 1)[0], tx = t.x, ty = t.y;
    brHit(R, t, z.dmg, z.color, 0, 0, 0);
    if(!t.boss && t.hp > 0 && R.rng() < 0.25) t.stun = Math.max(t.stun || 0, 0.4);
    brNear(R, tx, ty, 50, o=>{ if(o !== t && Math.hypot(o.x - tx, o.y - ty) < 34 + o.r) brHit(R, o, z.dmg * 0.5, z.color, 0, 0, 0); });
    brZone(R, {k:"lgFoudre", x:tx, y:ty, fx:z.x, fy:z.y, r:0, life:0.2, max:0.2, delay:0, dmg:0, color:z.color, w:z.w});
    brBurst(R, tx, ty, "#fff6b0", 6, 160, 0.3);
    z.flash = 0.12;
  }
};
BR_LEG_ZONE.lgFoudre = (R, z) => { if(z.life <= 0) z.on = false; };
BR_LEG_DRAW.lgNuage = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 4, (1 - k) * 8), cx = X(z.x), cy = Y(z.y) - 92;
    x.globalAlpha = 0.9 * fade;
    const puffs = [[-26, 4, 16], [-8, -6, 20], [14, -2, 18], [30, 6, 13], [2, 8, 17]], lit = z.flash > 0;
    x.fillStyle = lit ? "#2e3550" : "#1c2033"; for(const [ox, oy, r] of puffs){ x.beginPath(); x.arc(cx + ox, cy + oy, r, 0, LG_TAU); x.fill(); }
    x.fillStyle = lit ? "#6f7aa8" : "#3a4262"; for(const [ox, oy, r] of puffs){ x.beginPath(); x.arc(cx + ox, cy + oy - r * 0.35, r * 0.6, 0, LG_TAU); x.fill(); }
    if(lit){
      /* l'éclair s'allume dans le nuage : une lueur sous les volutes, pas un disque posé dessus */
      x.globalCompositeOperation = "lighter";
      const g = x.createRadialGradient(cx, cy + 6, 0, cx, cy + 6, 30);
      g.addColorStop(0, "rgba(255,240,150,.55)"); g.addColorStop(1, "rgba(255,228,94,0)");
      x.globalAlpha = fade; x.fillStyle = g; x.beginPath(); x.arc(cx, cy + 6, 30, 0, LG_TAU); x.fill();
      x.globalCompositeOperation = "source-over";
    }
    /* la pluie, fine, sous le nuage */
    x.globalAlpha = 0.35 * fade; x.strokeStyle = "#9fc7ff"; x.lineWidth = 1;
    for(let i = 0; i < 8; i++){ const rx = cx - 30 + ((i * 17 + R.t * 40) % 60), ry = cy + 18 + ((R.t * 260 + i * 23) % 40);
      x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 2, ry + 7); x.stroke(); }
    x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgFoudre = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, ax = X(z.fx), ay = Y(z.fy) - 80, bx = X(z.x), by = Y(z.y), n = 6;
    x.globalCompositeOperation = "lighter";
    const pts = [[ax, ay]];
    for(let i = 1; i < n; i++) pts.push([ax + (bx - ax) * i / n + (R.rng() - .5) * 18, ay + (by - ay) * i / n]);
    pts.push([bx, by]);
    for(const [col, lw, al] of [["#ffe45e", 7, 0.35], ["#ffffff", 2.2, 1]]){
      x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = al * k;
      x.beginPath(); pts.forEach(([px, py], i)=>i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke();
    }
    x.globalAlpha = 0.5 * k; x.fillStyle = "#ffe45e"; x.beginPath(); x.arc(bx, by, 16, 0, LG_TAU); x.fill();
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};

/* ============================================================
   244 ENTEI — Éruption
   ============================================================ */
BR_LEG_FIRE.lgEruption = (R, w, st, pos) => {
  const n = 3 + Math.ceil(st.count / 2), big = w.stage >= 2 ? 1.15 : 1;
  for(let k = 0; k < n; k++){
    const t = brNearest(R, pos.x + (R.rng() - .5) * 380, pos.y + (R.rng() - .5) * 380, 360);
    const a = R.rng() * LG_TAU, d = 90 + R.rng() * 170;
    const use = t && R.rng() < 0.75;
    const fl = 0.75 + R.rng() * 0.3;
    brZone(R, {k:"lgBombe", x:use ? t.x : pos.x + Math.cos(a) * d, y:use ? t.y : pos.y + Math.sin(a) * d, ox:pos.x, oy:pos.y,
      r:40 * st.area * big, life:fl, max:fl, delay:k * 0.07, dmg:st.dmg, color:st.color, w:R.curW, big});
  }
  brShake(R, 1.5);
};
BR_LEG_ZONE.lgBombe = (R, z) => {
  if(z.life > 0) return;
  z.on = false; R.curW = z.w;
  brNear(R, z.x, z.y, z.r + 20, f=>{
    if(Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r) return;
    lgHit(R, f, z.dmg, z.color, z.x, z.y, 220);
    if(f.hp > 0){ f.burn = Math.max(f.burn || 0, 2); }
  });
  brRing(R, z.x, z.y, z.r, "#ff8a3d", 0.3);
  brBurst(R, z.x, z.y, "#ff8a3d", 12, 180, 0.45); brBurst(R, z.x, z.y, "#3a1206", 6, 120, 0.5);
  brDecal(R, "scorch", z.x, z.y, z.r * 0.9, 7);
  brShake(R, 1);
  brZone(R, {k:"lgMagma", x:z.x, y:z.y, r:Math.min(60, z.r * 0.8), life:2.6 * z.big, max:2.6 * z.big, delay:0, dmg:z.dmg * 0.3, color:"#ff5a1a", w:z.w, tick:0.25, seed:R.rng() * 9});
};
BR_LEG_ZONE.lgMagma = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.4; R.curW = z.w;
  brNear(R, z.x, z.y, z.r + 10, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r * 0.5){ brHit(R, f, z.dmg, z.color, 0, 0, 0); if(f.hp > 0) f.burn = Math.max(f.burn || 0, 1.2); } });
};
BR_LEG_DRAW.lgBombe = {
  ground(x, R, z, X, Y){
    const s = 1 - Math.max(0, z.life) / z.max;
    x.globalAlpha = 0.15 + 0.35 * s; x.fillStyle = "#000";
    x.beginPath(); x.ellipse(X(z.x), Y(z.y), z.r * 0.5 * s + 4, (z.r * 0.5 * s + 4) * 0.5, 0, 0, LG_TAU); x.fill();
    x.strokeStyle = "#ff5a1a"; x.globalAlpha = 0.5 * s; x.lineWidth = 1.5;
    x.beginPath(); x.arc(X(z.x), Y(z.y), z.r * (1.1 - 0.4 * s), 0, LG_TAU); x.stroke();
    x.globalAlpha = 1;
  },
  sky(x, R, z, X, Y){
    const s = 1 - Math.max(0, z.life) / z.max;
    const at = t => [X(z.ox + (z.x - z.ox) * t), Y(z.oy + (z.y - z.oy) * t) - Math.sin(t * Math.PI) * 260];
    x.globalCompositeOperation = "lighter";
    for(let i = 4; i >= 1; i--){
      const [tx, ty] = at(Math.max(0, s - i * 0.04));
      x.globalAlpha = 0.18 * (5 - i); x.fillStyle = "#ff8a3d"; x.beginPath(); x.arc(tx, ty, 5 + (5 - i), 0, LG_TAU); x.fill();
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
    const [bx, by] = at(s), r = 6 * z.big;
    x.fillStyle = "#2a0d06"; x.beginPath(); x.arc(bx, by, r, 0, LG_TAU); x.fill();
    x.fillStyle = "#ff8a3d"; x.beginPath(); x.arc(bx - r * 0.25, by - r * 0.25, r * 0.45, 0, LG_TAU); x.fill();
  }
};
BR_LEG_DRAW.lgMagma = {
  ground(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 3), cx = X(z.x), cy = Y(z.y);
    x.globalAlpha = 0.75 * fade; x.fillStyle = "#2a0d06";
    x.beginPath(); x.ellipse(cx, cy, z.r, z.r * 0.62, 0, 0, LG_TAU); x.fill();
    x.globalCompositeOperation = "lighter";
    x.globalAlpha = (0.45 + 0.15 * Math.sin(R.t * 5 + z.seed)) * fade; x.fillStyle = "#ff5a1a";
    x.beginPath(); x.ellipse(cx, cy, z.r * 0.72, z.r * 0.42, 0, 0, LG_TAU); x.fill();
    x.strokeStyle = "#ffd24a"; x.lineWidth = 1.5; x.globalAlpha = 0.7 * fade;
    for(let i = 0; i < 3; i++){ const a = z.seed + i * 2.1; x.beginPath(); x.moveTo(cx, cy);
      x.lineTo(cx + Math.cos(a) * z.r * 0.8, cy + Math.sin(a) * z.r * 0.5); x.stroke(); }
    const b = (R.t * 1.7 + z.seed) % 1;
    x.globalAlpha = (1 - b) * fade; x.fillStyle = "#ffe9a8";
    x.beginPath(); x.arc(cx + Math.cos(z.seed * 3) * z.r * 0.4, cy + Math.sin(z.seed * 3) * z.r * 0.2, 2 + b * 4, 0, LG_TAU); x.fill();
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};

/* ============================================================
   245 SUICUNE — Rideau d'Aurore
   ============================================================ */
BR_LEG_FIRE.lgAurore = (R, w, st, pos, tgt) => {
  const n = 1 + (w.stage >= 2 ? 1 : 0) + (st.count >= 6 ? 1 : 0), dmg = st.dmg * (1 + 0.15 * (st.count - 1));
  const side = tgt ? (tgt.x >= pos.x ? 1 : -1) : (R.face || 1);
  for(let k = 0; k < n; k++){
    const dir = side * (k % 2 ? -1 : 1);
    brZone(R, {k:"lgAurore", x:pos.x - dir * 30, y:pos.y, r:0, dir, sp:250, bw:30 * st.area, span:R.H + 140, life:2.3, max:2.3,
      delay:k * 0.35, dmg:dmg * (k ? 0.7 : 1), color:st.color, w:R.curW, hit:new Set(), ph:R.rng() * 6, evo:w.stage >= 2});
  }
};
BR_LEG_ZONE.lgAurore = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; z.hit.clear(); return; }
  z.x += z.dir * z.sp * dt;
  z.y = (R.cam || R).y;
  R.curW = z.w;
  R.P.foes.each(f=>{
    if(f.hp <= 0 || z.hit.has(f) || Math.abs(f.y - z.y) > z.span / 2) return;
    const wob = Math.sin((f.y - z.y) * 0.02 + R.t * 3 + z.ph) * 14;
    if(Math.abs(f.x - (z.x + wob)) > z.bw + f.r) return;
    z.hit.add(f);
    brHit(R, f, z.dmg, z.color, z.dir, 0, 90);
    if(f.hp > 0) f.slow = Math.max(f.slow || 0, 1.6);
    if(z.evo) brHeal(R, 0.6, "leech");
  });
};
BR_LEG_DRAW.lgAurore = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 4, (1 - k) * 6);
    const top = Y(z.y - z.span / 2), bot = Y(z.y + z.span / 2), cx = X(z.x);
    x.globalCompositeOperation = "lighter";
    const cols = ["#6fe8ff", "#8dffb0", "#c79bff"];
    cols.forEach((c, i)=>{
      const g = x.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.3, c); g.addColorStop(0.7, c); g.addColorStop(1, "rgba(0,0,0,0)");
      x.strokeStyle = g; x.globalAlpha = (0.32 - i * 0.06) * fade; x.lineWidth = z.bw * (1.1 - i * 0.25);
      x.beginPath();
      for(let y = top; y <= bot; y += 10){
        const wob = Math.sin((y - Y(z.y)) * 0.02 + R.t * 3 + z.ph + i * 0.8) * 14 + i * 7 * z.dir;
        y === top ? x.moveTo(cx + wob, y) : x.lineTo(cx + wob, y);
      }
      x.stroke();
    });
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};

/* ============================================================
   249 LUGIA — Aéroblast
   ============================================================ */
BR_LEG_FIRE.lgAero = (R, w, st, pos) => {
  /* le vent cherche les couloirs les plus peuplés : un rayon, deux, puis trois avec le niveau */
  const len = 600 * Math.min(1.3, st.area), bw = 26 * st.area, beams = 1 + (w.stage >= 2 ? 1 : 0) + (st.count >= 6 ? 1 : 0), score = [];
  const dmg = st.dmg * (1 + 0.15 * (st.count - 1));
  for(let i = 0; i < 16; i++){
    const a = i / 16 * LG_TAU, cx = Math.cos(a), cy = Math.sin(a); let n = 0;
    R.P.foes.each(f=>{ if(f.hp <= 0) return; const rx = f.x - pos.x, ry = f.y - pos.y, al = rx * cx + ry * cy;
      if(al > 0 && al < len && Math.abs(rx * cy - ry * cx) < bw + f.r) n++; });
    score.push({a, n:n + R.rng() * 0.1});
  }
  score.sort((p, q)=>q.n - p.n);
  const picked = [];
  for(const c of score){
    if(picked.length >= beams) break;
    if(picked.some(a=>Math.abs(Math.atan2(Math.sin(a - c.a), Math.cos(a - c.a))) < 0.7)) continue;
    picked.push(c.a);
  }
  if(!picked.length) picked.push(w.lastAng || 0);
  picked.forEach((a, k)=>brZone(R, {k:"lgAero", x:pos.x, y:pos.y, a, len, bw, life:1.05, max:1.05, delay:k * 0.12, dmg:dmg * (k ? 0.75 : 1), color:st.color, w:R.curW,
    hit:new Set(), follow:R.curW, fired:false, evo:w.stage >= 2}));
};
BR_LEG_ZONE.lgAero = (R, z, dt) => {
  if(z.life <= 0){
    z.on = false; z.hit.clear();
    /* éveillé : le couloir de vent reste ouvert un instant */
    if(z.evo) brZone(R, {k:"lgCouloir", x:z.x, y:z.y, a:z.a, len:z.len, bw:z.bw * 1.5, r:0, life:1.4, max:1.4, delay:0, dmg:z.dmg * 0.1, color:z.color, w:z.w, tick:0});
    return;
  }
  const m = lgMember(R, z.follow, z); z.x = m.x; z.y = m.y;
  if(z.life > 0.5) return;                                   /* le vent se rassemble */
  if(!z.fired){ z.fired = true; brShake(R, 5); brHitstop(R, 40); }
  const cx = Math.cos(z.a), cy = Math.sin(z.a); R.curW = z.w;
  R.P.foes.each(f=>{
    if(f.hp <= 0 || z.hit.has(f)) return;
    const rx = f.x - z.x, ry = f.y - z.y, al = rx * cx + ry * cy;
    if(al < 0 || al > z.len) return;
    const side = rx * -cy + ry * cx;
    if(Math.abs(side) > z.bw + f.r) return;
    z.hit.add(f);
    const s = side >= 0 ? 1 : -1;
    brHit(R, f, z.dmg, z.color, -cy * s, cx * s, 420);        /* la horde s'écarte du rayon */
  });
};
BR_LEG_ZONE.lgCouloir = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  /* le vent qui reste dans le sillage du rayon : il lacère ce qui s'y aventure */
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.3; R.curW = z.w;
  const cx = Math.cos(z.a), cy = Math.sin(z.a);
  R.P.foes.each(f=>{
    if(f.hp <= 0) return;
    const rx = f.x - z.x, ry = f.y - z.y, al = rx * cx + ry * cy;
    if(al < 0 || al > z.len || Math.abs(rx * -cy + ry * cx) > z.bw + f.r) return;
    brHit(R, f, z.dmg, z.color, 0, 0, 0);
    if(f.hp > 0) f.slow = Math.max(f.slow || 0, 0.5);
  });
};
BR_LEG_DRAW.lgAero = {
  sky(x, R, z, X, Y){
    const cx = X(z.x), cy = Y(z.y);
    x.save(); x.translate(cx, cy); x.rotate(z.a);
    x.globalCompositeOperation = "lighter";
    if(z.life > 0.5){
      /* la charge : une sphère de vent qui grossit, des anneaux qui tournent */
      const c = 1 - (z.life - 0.5) / 0.55;
      x.globalAlpha = 0.35 + 0.4 * c; x.fillStyle = "#e0ecff";
      x.beginPath(); x.arc(34, 0, 6 + 14 * c, 0, LG_TAU); x.fill();
      x.strokeStyle = "#9fc7ff"; x.lineWidth = 2;
      for(let i = 0; i < 3; i++){ x.globalAlpha = 0.6 * c; x.beginPath();
        x.arc(34, 0, 14 + i * 9 + (1 - c) * 20, R.t * 9 + i * 2, R.t * 9 + i * 2 + 3.6); x.stroke(); }
    } else {
      const k = Math.max(0, z.life) / 0.5, bw = z.bw * (0.5 + 0.5 * k);
      const g = x.createLinearGradient(0, -bw, 0, bw);
      g.addColorStop(0, "rgba(160,200,255,0)"); g.addColorStop(0.5, "rgba(200,225,255,.9)"); g.addColorStop(1, "rgba(160,200,255,0)");
      x.globalAlpha = 0.85 * Math.min(1, k * 2.5); x.fillStyle = g; x.fillRect(0, -bw, z.len, bw * 2);
      x.globalAlpha = Math.min(1, k * 2.5); x.fillStyle = "#ffffff"; x.fillRect(0, -bw * 0.22, z.len, bw * 0.44);
      /* le vent qui tourne le long du rayon */
      x.strokeStyle = "#ffffff"; x.lineWidth = 1.5; x.globalAlpha = 0.6 * k;
      for(let i = 0; i < 6; i++){ const px = ((R.t * 900 + i * z.len / 6) % z.len);
        x.beginPath(); x.ellipse(px, 0, 8, bw * 0.95, 0, 0, LG_TAU); x.stroke(); }
    }
    x.restore(); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgCouloir = {
  ground(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max;
    x.save(); x.translate(X(z.x), Y(z.y)); x.rotate(z.a);
    x.globalAlpha = 0.18 * k; x.fillStyle = "#e0ecff"; x.fillRect(0, -z.bw, z.len, z.bw * 2);
    x.strokeStyle = "#ffffff"; x.globalAlpha = 0.4 * k; x.lineWidth = 1;
    for(let i = 0; i < 5; i++){ const py = (i / 4 - 0.5) * z.bw * 1.6, off = (R.t * 400 + i * 70) % 120;
      for(let px = off; px < z.len; px += 120){ x.beginPath(); x.moveTo(px, py); x.lineTo(px + 34, py); x.stroke(); } }
    x.restore(); x.globalAlpha = 1;
  }
};

/* ============================================================
   250 HO-OH — Feu Sacré
   ============================================================ */
function lgSacreSet(R, f, wi, d, evo){
  if(f.boss && f.shield) return;
  f.sacre = 3.2; f.sacreW = wi; f.sacreD = Math.max(f.sacreD || 0, d); f.sacreEvo = !!evo; f.sacreAcc = f.sacreAcc || 0;
}
BR_LEG_FIRE.lgSacre = (R, w, st, pos, tgt, ang) => {
  const range = 165 * st.area, arc = 0.75 + 0.06 * st.count, hue0 = (R.t * 120) % 360, evo = w.stage >= 2;
  const dmg = st.dmg * (1 + 0.12 * (st.count - 1));
  for(const a0 of evo ? [ang, ang + Math.PI] : [ang]){
    brNear(R, pos.x, pos.y, range + 20, f=>{
      const dx = f.x - pos.x, dy = f.y - pos.y, d = Math.hypot(dx, dy) || 1;
      let da = Math.atan2(dy, dx) - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
      if(d > range + f.r || Math.abs(da) > arc) return;
      brHit(R, f, dmg, `hsl(${Math.round(hue0 + d) % 360},95%,62%)`, dx / d, dy / d, 120);
      if(f.hp > 0) lgSacreSet(R, f, R.curW, dmg * 0.25, evo);
    });
    brZone(R, {k:"lgArc", x:pos.x, y:pos.y, a:a0, arc, r:range, life:0.4, max:0.4, delay:0, dmg:0, color:st.color, w:R.curW, hue:hue0, follow:R.curW});
  }
  if(evo) brHeal(R, 1, "leech");
};
/* un ennemi qui tombe en brûlant passe le feu sacré à ses voisins */
function lgSacreSpread(R, f){
  const wi = f.sacreW, n = f.sacreEvo ? 3 : 2, out = [];
  R.P.foes.each(o=>{ if(o === f || o.hp <= 0 || !o.on || o.sacre > 1.5) return; const d = Math.hypot(o.x - f.x, o.y - f.y); if(d < 170) out.push({o, d}); });
  out.sort((a, b)=>a.d - b.d);
  for(const {o} of out.slice(0, n)){
    lgSacreSet(R, o, wi, f.sacreD, f.sacreEvo);
    brZone(R, {k:"lgPasse", x:o.x, y:o.y, fx:f.x, fy:f.y, r:0, life:0.3, max:0.3, delay:0, dmg:0, color:"#ffb35c", w:wi, hue:(R.t * 200) % 360});
  }
  if(out.length) brHeal(R, f.sacreEvo ? 0.8 : 0.4, "leech");
}
BR_LEG_ZONE.lgArc = (R, z) => { const m = lgMember(R, z.follow, z); z.x = m.x; z.y = m.y; if(z.life <= 0) z.on = false; };
BR_LEG_ZONE.lgPasse = (R, z) => { if(z.life <= 0) z.on = false; };
BR_LEG_DRAW.lgArc = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, s = 1 - k, cx = X(z.x), cy = Y(z.y);
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 6; i++){
      x.strokeStyle = `hsl(${Math.round(z.hue + i * 52) % 360},95%,62%)`; x.globalAlpha = 0.55 * k; x.lineWidth = 9 * k + 2;
      x.beginPath(); x.arc(cx, cy, z.r * (0.25 + 0.75 * s) - i * 7, z.a - z.arc, z.a + z.arc); x.stroke();
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgPasse = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, ax = X(z.fx), ay = Y(z.fy), bx = X(z.x), by = Y(z.y);
    x.globalCompositeOperation = "lighter"; x.lineWidth = 3; x.globalAlpha = k;
    x.strokeStyle = `hsl(${Math.round(z.hue)},95%,65%)`;
    x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 40, bx, by); x.stroke();
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};

/* ============================================================
   251 CELEBI — Voile Temporel
   ============================================================ */
BR_LEG_FIRE.lgTemps = (R, w, st, pos) => {
  const evo = w.stage >= 2, c = st.count - 1, life = Math.min(2.4, st.cd * 0.85);
  brZone(R, {k:"lgTemps", x:pos.x, y:pos.y, r:Math.min(230, 125 * st.area * (evo ? 1.25 : 1) * (1 + 0.1 * c)), life, max:life, delay:0,
    dmg:st.dmg * (1 + 0.2 * c) * (evo ? 1.5 : 1), color:st.color, w:R.curW, tick:0, acc:new Map(), evo});
};
BR_LEG_ZONE.lgTemps = (R, z, dt) => {
  if(z.life > 0){
    /* dedans, plus rien ne bouge (sauf les boss : ils encaissent, sans s'arrêter) */
    brNear(R, z.x, z.y, z.r + 20, f=>{
      if(Math.hypot(f.x - z.x, f.y - z.y) > z.r) return;
      if(f.boss || f.reaper || f.under > 0) return;
      f.tstop = 0.15; f.stun = Math.max(f.stun || 0, 0.15); f.kx = 0; f.ky = 0;
    });
    z.tick -= dt; if(z.tick > 0) return; z.tick = 0.3;
    brNear(R, z.x, z.y, z.r + 20, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r * 0.5) z.acc.set(f, (z.acc.get(f) || 0) + z.dmg); });
    return;
  }
  /* le temps repart : tout ce qui s'est accumulé tombe d'un coup */
  z.on = false; R.curW = z.w;
  for(const [f, d] of z.acc){ if(f.on && f.hp > 0) lgHit(R, f, d, z.color, z.x, z.y, z.evo ? 200 : 120); }
  z.acc.clear();
  brRing(R, z.x, z.y, z.r, z.color, 0.45);
  brBurst(R, z.x, z.y, "#e8ffd8", 26, 240, 0.5);
  brShake(R, 4);
  brHeal(R, 3, "leech");
};
BR_LEG_DRAW.lgTemps = {
  ground(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 6, (1 - k) * 8), cx = X(z.x), cy = Y(z.y);
    x.globalAlpha = 0.12 * fade; x.fillStyle = "#9fe07a"; x.beginPath(); x.arc(cx, cy, z.r, 0, LG_TAU); x.fill();
    x.globalAlpha = 0.65 * fade; x.strokeStyle = "#c9ffb0"; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, z.r, 0, LG_TAU); x.stroke();
    for(let i = 0; i < 12; i++){ const a = i / 12 * LG_TAU, r1 = z.r * (i % 3 ? 0.9 : 0.84);
      x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a) * z.r, cy + Math.sin(a) * z.r); x.stroke(); }
    /* les aiguilles reculent */
    const a1 = -R.t * 5, a2 = -R.t * 0.8;
    x.lineWidth = 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a1) * z.r * 0.75, cy + Math.sin(a1) * z.r * 0.75); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a2) * z.r * 0.5, cy + Math.sin(a2) * z.r * 0.5); x.stroke();
    x.globalAlpha = 1;
  }
};

/* ============================================================
   377 REGIROCK — Monolithes
   ============================================================ */
BR_LEG_FIRE.lgMenhir = (R, w, st, pos) => {
  /* les premiers jaillissent sous la horde, les autres ferment le cercle autour de l'équipe */
  const n = 3 + st.count, rad = 92 * st.area, a0 = R.rng() * LG_TAU, big = w.stage >= 2 ? 1.35 : 1;
  const T = lgPickTargets(R, pos.x, pos.y, 240, n);
  for(let k = 0; k < n; k++){
    const t = T[k], a = a0 + k / n * LG_TAU;
    brZone(R, {k:"lgMenhir", x:t ? t.x : pos.x + Math.cos(a) * rad, y:t ? t.y : pos.y + Math.sin(a) * rad, r:20 * big, life:4.2, max:4.2, delay:k * 0.05,
      dmg:st.dmg, color:st.color, w:R.curW, tick:0.5, fired:false, big, area:st.area, seed:R.rng() * 9});
  }
  brShake(R, 3);
};
BR_LEG_ZONE.lgMenhir = (R, z, dt) => {
  R.curW = z.w;
  if(!z.fired){
    z.fired = true;
    const rr = z.r + 24 * z.area;
    brNear(R, z.x, z.y, rr + 20, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < rr + f.r) lgHit(R, f, z.dmg * (z.big > 1 ? 2 : 1.5), z.color, z.x, z.y, 380); });
    brBurst(R, z.x, z.y, "#c9a86a", 10, 160, 0.4);
    brDecal(R, "crack", z.x, z.y, z.r * 1.5, 7);
  }
  if(z.life <= 0){
    /* il éclate */
    z.on = false;
    const rr = z.r + 50 * z.area;
    brNear(R, z.x, z.y, rr + 20, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < rr + f.r) lgHit(R, f, z.dmg * (z.big > 1 ? 3 : 2), z.color, z.x, z.y, 300); });
    brBurst(R, z.x, z.y, "#c9a86a", 20, 220, 0.5); brBurst(R, z.x, z.y, "#6b5030", 10, 160, 0.6);
    brRing(R, z.x, z.y, rr, "#d9a86a", 0.3); brShake(R, 1.5);
    return;
  }
  /* un obstacle : la horde le contourne, elle ne le traverse pas */
  brNear(R, z.x, z.y, z.r + 40, f=>{
    if(f.boss || f.reaper || f.fixed) return;
    const dx = f.x - z.x, dy = f.y - z.y, d = Math.hypot(dx, dy) || 1, min = z.r + f.r;
    if(d < min){ f.x = z.x + dx / d * min; f.y = z.y + dy / d * min; }
  });
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.5;
  brNear(R, z.x, z.y, z.r + 30, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r + 6) brHit(R, f, z.dmg * 0.5, z.color, 0, 0, 0); });
};
BR_LEG_DRAW.lgMenhir = {
  mid(x, R, z, X, Y){
    const el = z.max - Math.max(0, z.life), rise = Math.min(1, el / 0.18), end = z.life < 0.35 ? (R.rng() - .5) * 3 : 0;
    const cx = X(z.x) + end, base = Y(z.y), w = z.r * 1.7, h = z.r * 2.8 * rise;
    x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(cx, base + 2, w * 0.65, w * 0.22, 0, 0, LG_TAU); x.fill();
    const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, "#9a7a50"); g.addColorStop(0.6, "#7a5c38"); g.addColorStop(1, "#4e3a22");
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx - w / 2, base); x.lineTo(cx - w / 2 + 2, base - h + w * 0.3);
    x.quadraticCurveTo(cx, base - h - w * 0.15, cx + w / 2 - 2, base - h + w * 0.3); x.lineTo(cx + w / 2, base); x.closePath(); x.fill();
    x.strokeStyle = "#3a2a16"; x.lineWidth = 1.5; x.stroke();
    /* les points des Regis */
    if(rise >= 1){ x.fillStyle = "#ffd24a";
      for(const [ox, oy] of [[-0.2, 0.45], [0.2, 0.45], [0, 0.62], [-0.2, 0.79], [0.2, 0.79]]){ x.beginPath(); x.arc(cx + ox * w, base - h + oy * h * 0.8, 1.8, 0, LG_TAU); x.fill(); } }
  }
};

/* ============================================================
   378 REGICE — Prisme Glacé
   ============================================================ */
BR_LEG_FIRE.lgPrisme = (R, w, st, pos, tgt) => {
  const t = tgt || brNearest(R, pos.x, pos.y, 380);
  const x = t ? pos.x + (t.x - pos.x) * 0.55 : pos.x + (R.face || 1) * 80, y = t ? pos.y + (t.y - pos.y) * 0.55 : pos.y;
  brZone(R, {k:"lgPrisme", x, y, r:150 * st.area, life:3.2, max:3.2, delay:0, dmg:st.dmg, color:st.color, w:R.curW,
    rays:2 + st.count + (w.stage >= 2 ? 1 : 0), rot:R.rng() * 6, hcd:new Map(), evo:w.stage >= 2});
};
BR_LEG_ZONE.lgPrisme = (R, z, dt) => {
  if(z.life <= 0){
    z.on = false; z.hcd.clear();
    if(z.evo){ R.curW = z.w; lgShards(R, z.x, z.y, z.dmg * 1.2, z.w, 10); brBurst(R, z.x, z.y, "#ffffff", 20, 220, 0.4); }
    return;
  }
  z.rot += dt * (z.evo ? 2.5 : 1.7); R.curW = z.w;
  for(let i = 0; i < z.rays; i++){
    const a = z.rot + i / z.rays * LG_TAU;
    lgHitSeg(R, z.x, z.y, z.x + Math.cos(a) * z.r, z.y + Math.sin(a) * z.r, 8, f=>{
      const last = z.hcd.get(f) || -9;
      if(R.t - last < 0.35) return;
      z.hcd.set(f, R.t);
      brHit(R, f, z.dmg, z.color, 0, 0, 0);
      if(f.hp > 0) f.slow = Math.max(f.slow || 0, 1.0);
    });
  }
};
BR_LEG_DRAW.lgPrisme = {
  mid(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 6, (1 - k) * 10), cx = X(z.x), cy = Y(z.y);
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < z.rays; i++){
      const a = z.rot + i / z.rays * LG_TAU, ex = cx + Math.cos(a) * z.r, ey = cy + Math.sin(a) * z.r;
      const g = x.createLinearGradient(cx, cy, ex, ey);
      g.addColorStop(0, "rgba(200,248,255,.8)"); g.addColorStop(1, "rgba(120,220,255,0)");
      x.strokeStyle = g; x.globalAlpha = 0.6 * fade; x.lineWidth = 6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(ex, ey); x.stroke();
      x.globalAlpha = fade; x.lineWidth = 1.6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(ex, ey); x.stroke();
    }
    x.globalCompositeOperation = "source-over";
    /* le cristal : un prisme hexagonal, une face éclairée */
    const h = 22, wd = 11;
    x.globalAlpha = 0.85 * fade; x.fillStyle = "#aef4ff";
    x.beginPath(); x.moveTo(cx, cy - h); x.lineTo(cx + wd, cy - h * 0.45); x.lineTo(cx + wd, cy + h * 0.45); x.lineTo(cx, cy + h);
    x.lineTo(cx - wd, cy + h * 0.45); x.lineTo(cx - wd, cy - h * 0.45); x.closePath(); x.fill();
    x.fillStyle = "#ffffff"; x.globalAlpha = 0.7 * fade;
    x.beginPath(); x.moveTo(cx, cy - h); x.lineTo(cx + wd, cy - h * 0.45); x.lineTo(cx + wd * 0.2, cy); x.lineTo(cx, cy + h * 0.2); x.closePath(); x.fill();
    x.strokeStyle = "#e8fbff"; x.lineWidth = 1.2; x.globalAlpha = fade;
    x.beginPath(); x.moveTo(cx, cy - h); x.lineTo(cx + wd, cy - h * 0.45); x.lineTo(cx + wd, cy + h * 0.45); x.lineTo(cx, cy + h);
    x.lineTo(cx - wd, cy + h * 0.45); x.lineTo(cx - wd, cy - h * 0.45); x.closePath(); x.stroke();
    x.globalAlpha = 1;
  }
};

/* ============================================================
   379 REGISTEEL — Verrouillage
   ============================================================ */
BR_LEG_FIRE.lgVerrou = (R, w, st, pos) => {
  const n = 1 + (st.count >= 3 ? 1 : 0) + (st.count >= 5 ? 1 : 0), cands = [];
  R.P.foes.each(f=>{
    if(f.hp <= 0 || f.under > 0 || (f.boss && f.shield)) return;
    if(Math.hypot(f.x - pos.x, f.y - pos.y) > 440) return;
    cands.push({f, s:(f.boss ? 1e9 : 0) + (f.big ? 1e7 : 0) + (f.elite ? 1e6 : 0) + f.hp});
  });
  cands.sort((a, b)=>b.s - a.s);
  for(let k = 0; k < Math.min(n, cands.length); k++)
    brZone(R, {k:"lgVerrou", x:cands[k].f.x, y:cands[k].f.y, tgt:cands[k].f, r:60 * st.area, life:1.0, max:1.0, delay:k * 0.12,
      dmg:st.dmg, color:st.color, w:R.curW, evo:w.stage >= 2});
};
BR_LEG_ZONE.lgVerrou = (R, z) => {
  const t = z.tgt;
  if(t && t.on && t.hp > 0){ z.x = t.x; z.y = t.y; }
  if(z.life > 0) return;
  z.on = false; R.curW = z.w;
  if(t && t.on && t.hp > 0){ brHit(R, t, z.dmg * 4, "#ffffff", 0, 0, 0); if(t.hp > 0 && !t.boss) t.stun = Math.max(t.stun || 0, z.evo ? 1.4 : 0.8); }
  brNear(R, z.x, z.y, z.r + 20, f=>{ if(f !== t && Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r) lgHit(R, f, z.dmg, z.color, z.x, z.y, 160); });
  /* éveillé : l'Élecanon saute sur trois voisins */
  if(z.evo){
    const near = []; R.P.foes.each(f=>{ if(f !== t && f.hp > 0){ const d = Math.hypot(f.x - z.x, f.y - z.y); if(d < 220) near.push({f, d}); } });
    near.sort((a, b)=>a.d - b.d);
    const pts = [{x:z.x, y:z.y}];
    for(const {f} of near.slice(0, 3)){ brHit(R, f, z.dmg * 1.2, "#ffe45e", 0, 0, 0); if(!f.boss && f.hp > 0) f.stun = Math.max(f.stun || 0, 0.6); pts.push({x:f.x, y:f.y}); }
    if(pts.length > 1) Object.assign(brFxNew(R), {k:"bolt", pts, life:0.2, max:0.2, color:"#ffe45e"});
  }
  brZone(R, {k:"lgFrappe", x:z.x, y:z.y, r:z.r, life:0.35, max:0.35, delay:0, dmg:0, color:z.color, w:z.w});
  brShake(R, 4); brHitstop(R, 50);
  brBurst(R, z.x, z.y, "#e8f0ff", 20, 260, 0.4);
  brDecal(R, "crater", z.x, z.y, z.r * 0.8, 7);
};
BR_LEG_ZONE.lgFrappe = (R, z) => { if(z.life <= 0) z.on = false; };
BR_LEG_DRAW.lgVerrou = {
  mid(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, cx = X(z.x), cy = Y(z.y), r = 16 + 26 * k;
    x.save(); x.translate(cx, cy); x.rotate(R.t * 2 * (1 + (1 - k) * 2));
    x.strokeStyle = k < 0.3 && Math.floor(R.t * 16) % 2 ? "#ffffff" : "#ff3d4f"; x.lineWidth = 2.2; x.globalAlpha = 0.9;
    x.beginPath(); x.arc(0, 0, r, 0, LG_TAU); x.stroke();
    for(let i = 0; i < 4; i++){ x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(r - 7, 0); x.lineTo(r + 9, 0); x.stroke(); }
    x.restore();
    x.strokeStyle = "#c7d2e0"; x.lineWidth = 1; x.globalAlpha = 0.6;
    x.beginPath(); x.arc(cx, cy, r * 0.45, 0, LG_TAU); x.stroke(); x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgFrappe = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, cx = X(z.x), cy = Y(z.y), w = 18 * k + 2;
    x.globalCompositeOperation = "lighter";
    const g = x.createLinearGradient(0, cy - 500, 0, cy);
    g.addColorStop(0, "rgba(199,210,224,0)"); g.addColorStop(1, "rgba(232,240,255,.95)");
    x.globalAlpha = k; x.fillStyle = g; x.fillRect(cx - w, cy - 500, w * 2, 500);
    x.fillStyle = "#ffffff"; x.fillRect(cx - w * 0.3, cy - 500, w * 0.6, 500);
    const rr = Math.min(90, z.r * (1.1 - 0.4 * k)), rg = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
    rg.addColorStop(0, "rgba(232,240,255,.7)"); rg.addColorStop(1, "rgba(199,210,224,0)");
    x.globalAlpha = k; x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, rr, 0, LG_TAU); x.fill();
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};

/* ============================================================
   380 LATIAS — Ball'Brume
   ============================================================ */
BR_LEG_FIRE.lgBrume = (R, w, st, pos) => {
  const n = 1 + st.count;
  for(let k = 0; k < n; k++){
    const a = (w.lastAng || 0) + (R.rng() - .5) * 1.6;
    brZone(R, {k:"lgOrbe", x:pos.x, y:pos.y, vx:Math.cos(a) * 170, vy:Math.sin(a) * 170, r:9, life:2.6, max:2.6, delay:k * 0.1,
      dmg:st.dmg, color:st.color, w:R.curW, evo:w.stage >= 2, area:st.area, hcd:0.4 * Math.min(1, st.cd / 2.0), cm:1 + 0.15 * (st.count - 1)});
  }
};
BR_LEG_ZONE.lgOrbe = (R, z, dt) => {
  const t = brNearest(R, z.x, z.y, 300);
  if(t){
    const a = Math.atan2(t.y - z.y, t.x - z.x), ca = Math.atan2(z.vy, z.vx);
    const da = Math.atan2(Math.sin(a - ca), Math.cos(a - ca)), na = ca + Math.max(-3.5 * dt, Math.min(3.5 * dt, da));
    z.vx = Math.cos(na) * 190; z.vy = Math.sin(na) * 190;
  }
  z.x += z.vx * dt; z.y += z.vy * dt;
  let boom = z.life <= 0;
  if(!boom) brNear(R, z.x, z.y, 34, f=>{ if(!boom && Math.hypot(f.x - z.x, f.y - z.y) < f.r + z.r) boom = true; });
  if(!boom) return;
  z.on = false; R.curW = z.w;
  const rr = 62 * Math.min(1.4, z.area) * (z.evo ? 1.15 : 1);
  brNear(R, z.x, z.y, rr + 20, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < rr + f.r) lgHit(R, f, z.dmg, z.color, z.x, z.y, 80); });
  brBurst(R, z.x, z.y, "#ffd6ec", 12, 150, 0.5);
  brZone(R, {k:"lgBrume", x:z.x, y:z.y, r:rr, life:3.4, max:3.4, delay:0, dmg:z.dmg * 0.15 * (z.evo ? 1.6 : 1) * (z.cm || 1), color:z.color, w:z.w, tick:0, evo:z.evo, seed:R.rng() * 9, hcd:z.hcd});
};
BR_LEG_ZONE.lgBrume = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  if(Math.hypot(R.x - z.x, R.y - z.y) < z.r) brHeal(R, (z.evo ? 1.8 : 1.2) * dt, "regen");
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.2; R.curW = z.w;
  const w = R.team[z.w], H = w && (w.lgMist = w.lgMist || new Map());
  if(H && H.size > 400) H.clear();
  brNear(R, z.x, z.y, z.r + 10, f=>{
    if(Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r * 0.5) return;
    f.vuln = Math.max(f.vuln || 0, 0.6); f.slow = Math.max(f.slow || 0, 0.6);
    if(H){ const last = H.get(f) || -9; if(R.t - last < (z.hcd || 0.4)) return; H.set(f, R.t); }
    brHit(R, f, z.dmg, z.color, 0, 0, 0);
  });
};
BR_LEG_DRAW.lgOrbe = {
  sky(x, R, z, X, Y){
    const cx = X(z.x), cy = Y(z.y);
    x.globalCompositeOperation = "lighter";
    x.globalAlpha = 0.35; x.fillStyle = "#ff9ad5"; x.beginPath(); x.arc(cx, cy, 18, 0, LG_TAU); x.fill();
    x.globalAlpha = 0.25; x.beginPath(); x.arc(cx - z.vx * 0.05, cy - z.vy * 0.05, 12, 0, LG_TAU); x.fill();
    x.globalAlpha = 0.95; x.fillStyle = "#ffd6ec"; x.beginPath(); x.arc(cx, cy, 8, 0, LG_TAU); x.fill();
    x.fillStyle = "#ffffff"; x.beginPath(); x.arc(cx - 2, cy - 2, 3, 0, LG_TAU); x.fill();
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgBrume = {
  ground(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 3, (1 - k) * 6), cx = X(z.x), cy = Y(z.y);
    for(let i = 0; i < 5; i++){
      const a = z.seed + i * 1.26 + R.t * 0.4, ox = Math.cos(a) * z.r * 0.4, oy = Math.sin(a) * z.r * 0.25, rr = z.r * (0.5 + 0.12 * Math.sin(R.t * 2 + i));
      const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rr);
      g.addColorStop(0, "rgba(255,170,220,.3)"); g.addColorStop(1, "rgba(255,170,220,0)");
      x.globalAlpha = fade; x.fillStyle = g; x.beginPath(); x.arc(cx + ox, cy + oy, rr, 0, LG_TAU); x.fill();
    }
    x.globalAlpha = 0.5 * fade; x.fillStyle = "#ffffff";
    for(let i = 0; i < 4; i++){ const a = z.seed * 2 + i * 1.7 + R.t; x.fillRect(cx + Math.cos(a) * z.r * 0.6, cy + Math.sin(a * 1.3) * z.r * 0.35, 2, 2); }
    x.globalAlpha = 1;
  }
};

/* ============================================================
   381 LATIOS — Lumi-Éclat
   ============================================================ */
BR_LEG_FIRE.lgPique = (R, w, st, pos, tgt) => {
  const n = (w.stage >= 2 ? 2 : 1) + (st.count >= 6 ? 1 : 0), L = Math.hypot(R.W, R.H) * 0.6 + 60;
  for(let k = 0; k < n; k++){
    const t = k === 0 ? (tgt || brNearest(R, pos.x, pos.y, 420)) : brNearest(R, pos.x + (R.rng() - .5) * 300, pos.y + (R.rng() - .5) * 300, 420);
    const tx = t ? t.x : pos.x, ty = t ? t.y : pos.y, a = R.rng() * LG_TAU, cx = Math.cos(a), cy = Math.sin(a);
    brZone(R, {k:"lgPique", x:tx - cx * L, y:ty - cy * L, ax:tx - cx * L, ay:ty - cy * L, bx:tx + cx * L, by:ty + cy * L, a, bw:24 * Math.min(1.4, st.area),
      life:0.85, max:0.85, delay:k * 0.18, dmg:st.dmg * (k ? 0.6 : 1), color:st.color, w:R.curW, hit:new Set(), boom:false, evo:w.stage >= 2});
  }
};
BR_LEG_ZONE.lgPique = (R, z) => {
  const fly = 0.5, el = z.max - Math.max(0, z.life);
  if(el <= fly){
    const k = Math.min(1, el / fly), ox = z.x, oy = z.y;
    z.x = z.ax + (z.bx - z.ax) * k; z.y = z.ay + (z.by - z.ay) * k; R.curW = z.w;
    lgHitSeg(R, ox, oy, z.x, z.y, z.bw, f=>{
      if(z.hit.has(f)) return; z.hit.add(f);
      brHit(R, f, z.dmg, z.color, Math.cos(z.a), Math.sin(z.a), 200);
      if(z.evo && f.hp > 0) f.vuln = Math.max(f.vuln || 0, 2);
    });
    return;
  }
  /* la trace explose, d'un bout à l'autre */
  if(!z.boom && el > fly + 0.18){
    z.boom = true; R.curW = z.w;
    lgHitSeg(R, z.ax, z.ay, z.bx, z.by, z.bw * 1.3, f=>brHit(R, f, z.dmg * 0.6, "#ffffff", 0, 0, 0));
    brShake(R, 2);
  }
  if(z.life <= 0){ z.on = false; z.hit.clear(); }
};
BR_LEG_DRAW.lgPique = {
  sky(x, R, z, X, Y){
    const fly = 0.5, el = z.max - Math.max(0, z.life), k = Math.min(1, el / fly);
    const ax = X(z.ax), ay = Y(z.ay), hx = X(z.x), hy = Y(z.y);
    x.globalCompositeOperation = "lighter";
    /* la trace : elle brille, puis explose, puis s'éteint */
    const glow = z.boom ? Math.max(0, z.life) / (z.max - fly - 0.18) : 0.6;
    for(const [col, lw, al] of [["#6fa8ff", z.bw * 1.4, 0.3], ["#d8e8ff", z.bw * 0.35, 0.85]]){
      x.strokeStyle = col; x.lineWidth = lw * (z.boom ? 1 + glow : 1); x.globalAlpha = al * Math.min(1, glow + 0.2);
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(hx, hy); x.stroke();
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
    if(k < 1){
      /* le jet : un dard bleu et blanc, ailes repliées */
      x.save(); x.translate(hx, hy); x.rotate(z.a);
      x.fillStyle = "#6fa8ff"; x.beginPath(); x.moveTo(22, 0); x.lineTo(-14, -12); x.lineTo(-8, 0); x.lineTo(-14, 12); x.closePath(); x.fill();
      x.fillStyle = "#ffffff"; x.beginPath(); x.moveTo(20, 0); x.lineTo(-6, -4); x.lineTo(-6, 4); x.closePath(); x.fill();
      x.fillStyle = "#ff5c5c"; x.beginPath(); x.moveTo(6, 0); x.lineTo(0, -3); x.lineTo(0, 3); x.closePath(); x.fill();
      x.restore();
    }
  }
};

/* ============================================================
   382 KYOGRE — Onde Originelle
   ============================================================ */
BR_LEG_FIRE.lgTsunami = (R, w, st, pos) => {
  const dirs = w.stage >= 2 ? [0, Math.PI, Math.PI / 2, -Math.PI / 2] : [0, Math.PI], sets = 1 + (st.count >= 4 ? 1 : 0);
  const dmg = st.dmg * (1 + 0.12 * (st.count - 1));
  for(let k = 0; k < sets; k++) for(const a of dirs){
    const vert = Math.abs(Math.cos(a)) < 0.5, span = (vert ? R.W : R.H) + 160, life = ((vert ? R.H : R.W) / 2 + 90) / 300;
    brZone(R, {k:"lgVague", x:pos.x, y:pos.y, a, sp:300, span, bw:30 * Math.min(1.5, st.area), life, max:life, delay:k * 0.45, dmg, color:st.color, w:R.curW, hit:new Set()});
  }
  brShake(R, 3);
};
BR_LEG_ZONE.lgVague = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; z.hit.clear(); return; }
  const cx = Math.cos(z.a), cy = Math.sin(z.a);
  z.x += cx * z.sp * dt; z.y += cy * z.sp * dt; R.curW = z.w;
  R.P.foes.each(f=>{
    if(f.hp <= 0) return;
    const rx = f.x - z.x, ry = f.y - z.y, al = rx * cx + ry * cy, side = rx * -cy + ry * cx;
    if(Math.abs(al) > z.bw + f.r || Math.abs(side) > z.span / 2) return;
    if(!f.boss && !f.reaper && !f.fixed){ f.x += cx * z.sp * dt; f.y += cy * z.sp * dt; f.wet = 2.5; }
    if(!z.hit.has(f)){ z.hit.add(f); brHit(R, f, z.dmg, z.color, cx, cy, 200); }
  });
};
BR_LEG_DRAW.lgVague = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, fade = Math.min(1, k * 5, (1 - k) * 10);
    x.save(); x.translate(X(z.x), Y(z.y)); x.rotate(z.a);
    const h = z.span / 2, depth = z.bw * 2;
    const g = x.createLinearGradient(-depth, 0, z.bw, 0);
    g.addColorStop(0, "rgba(58,139,255,0)"); g.addColorStop(0.7, "rgba(58,139,255,.3)"); g.addColorStop(1, "rgba(150,210,255,.5)");
    x.globalAlpha = fade; x.fillStyle = g;
    x.beginPath(); x.moveTo(-depth, -h);
    for(let s = -h; s <= h; s += 16) x.lineTo(z.bw * 0.6 + Math.sin(s * 0.05 + R.t * 6) * 6, s);
    x.lineTo(-depth, h); x.closePath(); x.fill();
    /* l'écume de la crête */
    x.strokeStyle = "#ffffff"; x.lineWidth = 4; x.globalAlpha = 0.85 * fade;
    x.beginPath();
    for(let s = -h; s <= h; s += 8){ const px = z.bw * 0.6 + Math.sin(s * 0.05 + R.t * 6) * 6; s === -h ? x.moveTo(px, s) : x.lineTo(px, s); }
    x.stroke();
    x.fillStyle = "#e8f6ff"; x.globalAlpha = 0.7 * fade;
    for(let s = -h; s <= h; s += 22){ const px = z.bw * 0.8 + Math.sin(s * 0.11 + R.t * 9) * 8; x.beginPath(); x.arc(px, s, 2.5, 0, LG_TAU); x.fill(); }
    x.restore(); x.globalAlpha = 1;
  }
};

/* ============================================================
   383 GROUDON — Lame Pangéenne
   ============================================================ */
BR_LEG_FIRE.lgPangee = (R, w, st, pos) => {
  const rings = 2 + Math.min(3, Math.floor((st.count + 1) / 2)), evo = w.stage >= 2, dmg = st.dmg * (1 + 0.05 * (st.count - 1)) * (evo ? 1.5 : 1);
  for(let k = 0; k < rings; k++){
    const rad = 20 + k * 42, n = Math.max(6, Math.round(LG_TAU * rad / 38)), off = R.rng() * 0.5;
    for(let i = 0; i < n; i++){
      const a = off + i / n * LG_TAU;
      brZone(R, {k:"lgPic", x:pos.x + Math.cos(a) * rad, y:pos.y + Math.sin(a) * rad, a, r:18 * st.area, life:0.6, max:0.6, delay:k * 0.16,
        dmg, color:st.color, w:R.curW, fired:false, evo, h:0.8 + R.rng() * 0.5});
    }
  }
  brShake(R, 3);
};
BR_LEG_ZONE.lgPic = (R, z) => {
  if(!z.fired){
    z.fired = true; R.curW = z.w;
    brNear(R, z.x, z.y, z.r + 24, f=>{
      if(Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r) return;
      /* la lame soulève plus qu'elle ne repousse : l'ennemi reste dans les anneaux suivants */
      brHit(R, f, z.dmg, z.color, Math.cos(z.a), Math.sin(z.a), 60);
      if(!f.boss && f.hp > 0) f.stun = Math.max(f.stun || 0, 0.35);
      if(z.evo && f.hp > 0){ f.dot = 2; f.dotDmg = Math.max(f.dotDmg || 0, z.dmg * 0.4); f.burn = 2; }
    });
    if(R.rng() < 0.2) brDecal(R, "crack", z.x, z.y, z.r, 6);
  }
  if(z.life <= 0) z.on = false;
};
BR_LEG_DRAW.lgPic = {
  mid(x, R, z, X, Y){
    const el = z.max - Math.max(0, z.life), up = Math.min(1, el / 0.08), down = z.life < 0.2 ? Math.max(0, z.life) / 0.2 : 1;
    const s = up * down, cx = X(z.x), by = Y(z.y), H = 30 * z.h * s, W = 9;
    x.fillStyle = "#3a1206";
    x.beginPath(); x.moveTo(cx - W, by); x.lineTo(cx - W * 0.3, by - H); x.lineTo(cx + W * 0.2, by - H * 0.55); x.lineTo(cx + W * 0.5, by - H * 0.8); x.lineTo(cx + W, by); x.closePath(); x.fill();
    x.strokeStyle = z.evo ? "#ffd24a" : "#ff6a1a"; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(cx - W, by); x.lineTo(cx - W * 0.3, by - H); x.lineTo(cx + W * 0.2, by - H * 0.55); x.stroke();
  }
};

/* ============================================================
   384 RAYQUAZA — Draco-Ascension
   ============================================================ */
/* un anneau du serpent, à l'instant t : le dessin le recalcule à chaque image, il reste fluide */
function lgSerpAt(R, C, cx, cy, s, i, o){
  const tt = R.t * 2.2 - i * 0.11 + s * Math.PI, rad = C.rad0 * (0.58 + 0.42 * Math.sin(tt * 2.3 + s * 1.7));
  o.x = cx + Math.cos(tt) * rad; o.y = cy + Math.sin(tt) * rad * 0.8;
  return o;
}
const LG_SP = {x:0, y:0};
BR_LEG_FIRE.lgSerpent = (R, w, st, pos) => {
  const C = w.serpC = w.serpC || {};
  C.n = w.stage >= 2 ? 2 : 1; C.segs = 12 + st.count * 2; C.rad0 = 150 * Math.sqrt(st.area); C.r = 9 * Math.min(1.4, st.area);
  w.serpHit = w.serpHit || new Map();
  const hr = 20 * st.area, hcd = 0.4 * Math.min(1, st.cd / 0.05), dmg = st.dmg * (1 + 0.25 * (st.count - 1)) * (w.stage >= 2 ? 1.25 : 1);
  for(let s = 0; s < C.n; s++) for(let i = 0; i < C.segs; i += 2){
    const p = lgSerpAt(R, C, pos.x, pos.y, s, i, LG_SP), px = p.x, py = p.y;
    brNear(R, px, py, hr + 18, f=>{
      if(Math.hypot(f.x - px, f.y - py) > hr + f.r) return;
      const last = w.serpHit.get(f) || -9;
      if(R.t - last < hcd) return;
      w.serpHit.set(f, R.t);
      lgHit(R, f, dmg, st.color, pos.x, pos.y, 220);
    });
  }
  if(w.serpHit.size > 400) w.serpHit.clear();
};
const LG_SERP_BUF = [];
function lgDrawSerpent(x, R, w, idx, X, Y){
  const C = w.serpC;
  if(!C || !C.segs) return;
  const c = brMemberPos(R, idx), r0 = C.r || 9, n = C.segs;
  for(let s = 0; s < C.n; s++){
    for(let i = 0; i < n; i++){ const o = LG_SERP_BUF[i] = LG_SERP_BUF[i] || {x:0, y:0}; lgSerpAt(R, C, c.x, c.y, s, i, o); }
    for(let i = n - 1; i >= 0; i--){
      const p = LG_SERP_BUF[i], t = 1 - i / n, r = r0 * (0.45 + 0.55 * t) * (i === 0 ? 1.3 : 1);
      const px = X(p.x), py = Y(p.y) - 26;
      x.fillStyle = "rgba(0,0,0,.18)"; x.beginPath(); x.ellipse(px, Y(p.y) + 6, r, r * 0.35, 0, 0, LG_TAU); x.fill();
      x.fillStyle = i % 3 === 1 ? "#f2d24a" : "#2f9e5a";
      x.beginPath(); x.arc(px, py, r, 0, LG_TAU); x.fill();
      x.fillStyle = "#1d6e3c"; x.beginPath(); x.arc(px, py + r * 0.35, r * 0.6, 0, Math.PI); x.fill();
      if(i % 3 === 1){ x.fillStyle = "#ff5c5c"; x.fillRect(px - 1, py - r - 3, 2, 4); }
    }
    /* la tête : deux moustaches, des yeux jaunes */
    const h = LG_SERP_BUF[0], h1 = LG_SERP_BUF[1], a = Math.atan2(h.y - h1.y, h.x - h1.x), hx = X(h.x), hy = Y(h.y) - 26, r = r0 * 1.3;
    x.strokeStyle = "#f2d24a"; x.lineWidth = 2;
    for(const sd of [-1, 1]){ x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo(hx - Math.cos(a) * r * 1.6 + Math.cos(a + sd * 1.5) * r, hy - Math.sin(a) * r * 1.6 + Math.sin(a + sd * 1.5) * r, hx - Math.cos(a) * r * 3, hy - Math.sin(a) * r * 3 + sd * 4); x.stroke(); }
    x.fillStyle = "#ffe45e";
    for(const sd of [-1, 1]){ x.beginPath(); x.arc(hx + Math.cos(a + sd * 0.7) * r * 0.55, hy + Math.sin(a + sd * 0.7) * r * 0.55, 1.8, 0, LG_TAU); x.fill(); }
  }
}

/* ============================================================
   385 JIRACHI — Vœu Destructeur
   ============================================================ */
BR_LEG_FIRE.lgEtoiles = (R, w, st, pos) => {
  const n = 1 + Math.ceil(st.count * 0.6), V = lgView(R);
  w.lgN = (w.lgN || 0) + 1;
  for(let k = 0; k < n; k++){
    const t = brNearest(R, pos.x + (R.rng() - .5) * 400, pos.y + (R.rng() - .5) * 400, 420);
    const tx = t ? t.x : pos.x + (R.rng() - .5) * 300, ty = t ? t.y : pos.y + (R.rng() - .5) * 300;
    const a = Math.PI / 2 + (R.rng() < 0.5 ? -1 : 1) * (0.45 + R.rng() * 0.35), cx = Math.cos(a), cy = Math.sin(a);
    const back = Math.max(80, (ty - V.y0 + 40) / cy), L = back + 260;
    brZone(R, {k:"lgEtoile", x:tx - cx * back, y:ty - cy * back, ax:tx - cx * back, ay:ty - cy * back, a, len:L, sp:760, bw:20 * st.area,
      life:L / 760, max:L / 760, delay:k * 0.12, dmg:st.dmg, color:st.color, w:R.curW, hit:new Set(), evo:w.stage >= 2});
  }
  /* un vœu, tous les quatre tirs : exaucé deux secondes plus tard */
  if(w.lgN % 4 === 0) brZone(R, {k:"lgVoeu", x:pos.x, y:pos.y, r:0, life:2, max:2, delay:0, dmg:0, color:"#ffe9a8", w:R.curW, follow:R.curW,
    heal:w.stage >= 2 ? 0.07 : 0.05});
};
BR_LEG_ZONE.lgEtoile = (R, z, dt) => {
  const cx = Math.cos(z.a), cy = Math.sin(z.a), ox = z.x, oy = z.y;
  z.x += cx * z.sp * dt; z.y += cy * z.sp * dt; R.curW = z.w;
  lgHitSeg(R, ox, oy, z.x, z.y, z.bw, f=>{ if(z.hit.has(f)) return; z.hit.add(f); brHit(R, f, z.dmg, z.color, cx, cy, 160); });
  if(z.life > 0) return;
  z.on = false; z.hit.clear();
  /* éveillé : l'étoile éclate en fin de course */
  if(z.evo){
    brNear(R, z.x, z.y, 90, f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < 70 + f.r) lgHit(R, f, z.dmg * 1.2, "#ffe9a8", z.x, z.y, 200); });
    brRing(R, z.x, z.y, 70, "#ffe9a8", 0.35); brBurst(R, z.x, z.y, "#fff6c8", 20, 220, 0.5);
  }
};
BR_LEG_ZONE.lgVoeu = (R, z) => {
  const m = lgMember(R, z.follow, z); z.x = m.x; z.y = m.y;
  if(z.life > 0) return;
  z.on = false;
  if(brHeal(R, R.maxHp * z.heal, "item") > 0) brText(R, z.x, z.y - 46, "Vœu exaucé", "#ffe9a8", 12);
  brBurst(R, z.x, z.y - 30, "#ffe9a8", 16, 120, 0.6);
};
function lgStar(x, cx, cy, r, rot){
  x.beginPath();
  for(let i = 0; i < 10; i++){ const a = rot + i / 10 * LG_TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath(); x.fill();
}
BR_LEG_DRAW.lgEtoile = {
  sky(x, R, z, X, Y){
    const hx = X(z.x), hy = Y(z.y), cx = Math.cos(z.a), cy = Math.sin(z.a), tl = 110;
    x.globalCompositeOperation = "lighter";
    const g = x.createLinearGradient(hx, hy, hx - cx * tl, hy - cy * tl);
    g.addColorStop(0, "rgba(255,240,180,.9)"); g.addColorStop(1, "rgba(255,240,180,0)");
    x.strokeStyle = g; x.lineWidth = 6; x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx - cx * tl, hy - cy * tl); x.stroke();
    x.globalAlpha = 0.4; x.fillStyle = "#ffe9a8"; x.beginPath(); x.arc(hx, hy, 15, 0, LG_TAU); x.fill();
    x.globalAlpha = 1; x.fillStyle = "#fff6c8"; lgStar(x, hx, hy, 9, R.t * 6);
    x.globalCompositeOperation = "source-over";
  }
};
BR_LEG_DRAW.lgVoeu = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max, cx = X(z.x), cy = Y(z.y) - 50 - (1 - k) * 14;
    x.globalCompositeOperation = "lighter";
    x.globalAlpha = 0.3 + 0.3 * Math.sin(R.t * 10); x.fillStyle = "#ffe9a8"; x.beginPath(); x.arc(cx, cy, 12, 0, LG_TAU); x.fill();
    x.globalAlpha = 1; x.fillStyle = "#fff6c8"; lgStar(x, cx, cy, 6, R.t * 2);
    x.globalCompositeOperation = "source-over";
  }
};

/* ============================================================
   386 DEOXYS — Psycho Boost
   ============================================================ */
const LG_FORMS = [{n:"FORME ATTAQUE", c:"#ff5c5c"}, {n:"FORME DÉFENSE", c:"#35f0d6"}, {n:"FORME VITESSE", c:"#b06bff"}];
BR_LEG_FIRE.lgFormes = (R, w, st0, pos, tgt, ang) => {
  const fi = Math.floor(R.t / 7) % 3, F = LG_FORMS[fi], st = Object.assign({}, st0, {dmg:st0.dmg * (1 + 0.2 * (st0.count - 1)) * (w.stage >= 2 ? 1.25 : 1)});
  if(w.form !== fi){ w.form = fi; w.formN = 0; brText(R, pos.x, pos.y - 46, F.n, F.c, 12); brRing(R, pos.x, pos.y, 50, F.c, 0.4); }
  w.formN = (w.formN || 0) + 1;
  if(fi === 0){
    /* Attaque : un double brin psychique, lourd, toutes les 1,2 s */
    if(w.formN % 4 !== 1) return;
    const len = 380 * st.area, bw = 16 * st.area, cx = Math.cos(ang), cy = Math.sin(ang);
    R.P.foes.each(f=>{ if(f.hp <= 0) return; const rx = f.x - pos.x, ry = f.y - pos.y, al = rx * cx + ry * cy;
      if(al > 0 && al < len && Math.abs(rx * cy - ry * cx) < bw + f.r) brHit(R, f, st.dmg * 3.2, F.c, cx, cy, 160); });
    brZone(R, {k:"lgHelice", x:pos.x, y:pos.y, a:ang, len, bw, r:0, life:0.45, max:0.45, delay:0, dmg:0, color:F.c, w:R.curW});
    brShake(R, 2);
  } else if(fi === 1){
    /* Défense : une barrière qui repousse et brûle ce qui la touche */
    const left = 7 - (R.t % 7);
    if(!w.hex || !w.hex.on || w.hex.k !== "lgHex") w.hex = brZone(R, {k:"lgHex", x:pos.x, y:pos.y, r:72 * st.area, life:left, max:7, delay:0, dmg:st.dmg, color:F.c, w:R.curW, follow:R.curW, tick:0});
  } else {
    /* Vitesse : une rafale de petits tirs */
    for(let k = 0; k < 2; k++){
      const t = brNearest(R, pos.x + (R.rng() - .5) * 200, pos.y + (R.rng() - .5) * 200, 380) || tgt;
      const a = t ? Math.atan2(t.y - pos.y, t.x - pos.x) : ang + (R.rng() - .5);
      brShot(R, pos.x, pos.y, Math.cos(a) * 480, Math.sin(a) * 480, {dmg:st.dmg * 0.9, r:5, color:F.c, w:R.curW, life:0.9, pierce:2});
    }
  }
};
BR_LEG_ZONE.lgHelice = (R, z) => { if(z.life <= 0) z.on = false; };
BR_LEG_ZONE.lgHex = (R, z, dt) => {
  if(z.life <= 0){ z.on = false; return; }
  const m = lgMember(R, z.follow, z); z.x = m.x; z.y = m.y;
  brNear(R, z.x, z.y, z.r + 30, f=>{
    if(f.boss || f.reaper || f.fixed) return;
    const dx = f.x - z.x, dy = f.y - z.y, d = Math.hypot(dx, dy) || 1;
    if(d < z.r + f.r){ f.kx += dx / d * 60; f.ky += dy / d * 60; }
  });
  z.tick -= dt; if(z.tick > 0) return; z.tick = 0.3; R.curW = z.w;
  brNear(R, z.x, z.y, z.r + 30, f=>{ const d = Math.hypot(f.x - z.x, f.y - z.y); if(d < z.r + f.r && d > z.r - 26 - f.r) brHit(R, f, z.dmg, z.color, 0, 0, 0); });
};
BR_LEG_DRAW.lgHelice = {
  sky(x, R, z, X, Y){
    const k = Math.max(0, z.life) / z.max;
    x.save(); x.translate(X(z.x), Y(z.y)); x.rotate(z.a);
    x.globalCompositeOperation = "lighter";
    for(const [ph, col] of [[0, z.color], [Math.PI, "#ffffff"]]){
      x.strokeStyle = col; x.lineWidth = 3; x.globalAlpha = k; x.beginPath();
      for(let s = 0; s <= z.len; s += 6){ const y = Math.sin(s * 0.06 + R.t * 14 + ph) * z.bw * 0.8; s ? x.lineTo(s, y) : x.moveTo(s, y); }
      x.stroke();
    }
    x.strokeStyle = z.color; x.lineWidth = 1.2; x.globalAlpha = 0.6 * k;
    for(let s = 0; s <= z.len; s += 18){ const y = Math.sin(s * 0.06 + R.t * 14) * z.bw * 0.8; x.beginPath(); x.moveTo(s, y); x.lineTo(s, -y); x.stroke(); }
    x.restore(); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
  }
};
BR_LEG_DRAW.lgHex = {
  mid(x, R, z, X, Y){
    const k = Math.max(0, z.life), fade = Math.min(1, k * 3), cx = X(z.x), cy = Y(z.y);
    x.save(); x.translate(cx, cy); x.rotate(R.t * 0.8);
    x.globalAlpha = 0.1 * fade; x.fillStyle = z.color;
    x.beginPath(); for(let i = 0; i < 6; i++){ const a = i / 6 * LG_TAU; i ? x.lineTo(Math.cos(a) * z.r, Math.sin(a) * z.r) : x.moveTo(Math.cos(a) * z.r, Math.sin(a) * z.r); } x.closePath(); x.fill();
    x.globalAlpha = 0.85 * fade; x.strokeStyle = z.color; x.lineWidth = 2.5; x.stroke();
    x.restore(); x.globalAlpha = 1;
  }
};

/* ============================================================
   151 MEW — le Métronome peut tirer l'attaque d'un autre légendaire
   ============================================================ */
const LG_METRO = ["lgGivre", "lgCage", "lgNuage", "lgEruption", "lgAurore", "lgAero", "lgSacre", "lgTemps", "lgMenhir", "lgPrisme",
  "lgVerrou", "lgBrume", "lgPique", "lgTsunami", "lgPangee", "lgEtoiles"];
const LG_METRO_ID = {};
for(const id in BR_LEG_NEW) LG_METRO_ID[BR_LEG_NEW[id].k] = +id;

/* ============================================================
   LE BRANCHEMENT
   ============================================================ */
const _brFireExtraL = brFireExtra;
brFireExtra = function(R, w, st, pos, tgt, ang){
  const f = BR_LEG_FIRE[st.k];
  if(f) return f(R, w, st, pos, tgt, ang);
  if(st.k === "sing" && st.count > 1){
    /* Mewtwo : une singularité de plus tous les deux niveaux de puissance, sur d'autres cibles */
    const extra = Math.floor((st.count - 1) / 2), T = lgPickTargets(R, pos.x, pos.y, 380, extra + 1);
    for(const t of T.filter(t=>t !== tgt).slice(0, extra)) _brFireExtraL.call(this, R, w, Object.assign({}, st, {dmg:st.dmg * 0.8}), pos, t, ang);
  }
  if(st.k === "metro"){
    /* le Métronome grandit avec le niveau, comme les autres attaques */
    const st2 = Object.assign({}, st, {dmg:st.dmg * (1 + 0.15 * (st.count - 1))});
    if(R.rng() < Math.min(0.45, 0.12 + 0.06 * (st.count - 1) + (w.stage >= 2 ? 0.1 : 0))){
      const k = LG_METRO[Math.floor(R.rng() * LG_METRO.length)], L = BR_LEGEND[LG_METRO_ID[k]], M = BR_LEGEND[151];
      brText(R, pos.x, pos.y - 34, "Métronome ! " + L.n, "#ff9ad5", 11);
      /* l'attaque empruntée garde la puissance de Mew, à la cadence de Mew */
      const scale = (L.dmg / M.dmg) * (M.cd / L.cd);
      return BR_LEG_FIRE[k](R, w, Object.assign({}, st2, {k, color:L.c, dmg:st2.dmg * scale}), pos, tgt, ang);
    }
    return _brFireExtraL.call(this, R, w, st2, pos, tgt, ang);
  }
  return _brFireExtraL.apply(this, arguments);
};
const _brZoneExtraL = brZoneExtra;
brZoneExtra = function(R, z, dt){
  const f = BR_LEG_ZONE[z.k];
  if(f){ f(R, z, dt); return true; }
  return _brZoneExtraL(R, z, dt);
};
const _brDrawZoneExtraL = brDrawZoneExtra;
brDrawZoneExtra = function(x, R, z, X, Y){
  const D = BR_LEG_DRAW[z.k];
  if(D){ if(D.ground) try { D.ground(x, R, z, X, Y); } catch(e){} lgReset(x); return true; }
  if(BR_LEG_ZONE[z.k]) return true;
  return _brDrawZoneExtraL(x, R, z, X, Y);
};
if(typeof brPoseStart === "function"){
  const _brPoseStartL = brPoseStart;
  brPoseStart = function(R, w, kind){ if(BR_LEG_NOPOSE.has(kind)) return; return _brPoseStartL.apply(this, arguments); };
}
/* les états : gelé (Artikodin), feu sacré (Ho-Oh), temps arrêté (Celebi) */
function lgTick(R, dt){
  R.P.foes.each(f=>{
    if(!f.on || f.hp <= 0) return;
    if(f.reaper){ f.frz = 0; f.tstop = 0; f.sacre = 0; return; }
    if(f.frz > 0){ f.frz -= dt; if(f.frz > 0 && !f.boss) f.stun = Math.max(f.stun || 0, Math.min(0.1, f.frz)); }
    if(f.tstop > 0) f.tstop -= dt;
    if(f.sacre > 0){
      f.sacre -= dt;
      f.sacreAcc = (f.sacreAcc || 0) + dt;
      if(f.sacreAcc >= 0.5){
        f.sacreAcc = 0;
        if(R.team[f.sacreW]){ R.curW = f.sacreW; brHit(R, f, f.sacreD, `hsl(${Math.round(R.t * 160) % 360},95%,62%)`, 0, 0, 0); }
      }
      if(f.on && R.rng() < dt * 5) brBurst(R, f.x, f.y - f.size * 0.2, `hsl(${Math.round(R.rng() * 360)},95%,62%)`, 1, 50, 0.4);
    }
  });
}
const _brZonesL = brZones;
brZones = function(R, dt){ _brZonesL(R, dt); lgTick(R, dt); };
const _brKillL = brKill;
brKill = function(R, f){
  const spread = f.sacre > 0 && R.team && R.team[f.sacreW];
  const r = _brKillL.apply(this, arguments);
  f.frz = 0; f.tstop = 0;
  if(spread) lgSacreSpread(R, f);
  f.sacre = 0;
  return r;
};
/* un ennemi recyclé repart sans les états du précédent */
if(typeof brSpawnFoe === "function"){
  const _brSpawnFoeL = brSpawnFoe;
  brSpawnFoe = function(){
    const f = _brSpawnFoeL.apply(this, arguments);
    if(f){ f.frz = 0; f.frzT = 0; f.tstop = 0; f.sacre = 0; f.sacreAcc = 0; f.sacreD = 0; }
    return f;
  };
}

/* ---------- le dessin, au-dessus de la horde et dans le ciel ---------- */
function lgReset(x){
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  if(x.setLineDash) x.setLineDash([]);
}
function lgDrawLayer(x, R, X, Y, layer){
  R.P.zones.each(z=>{
    if(z.delay > 0) return;
    const D = BR_LEG_DRAW[z.k];
    if(D && D[layer]){ try { D[layer](x, R, z, X, Y); } catch(e){} lgReset(x); }
  });
}
function lgDrawStates(x, R, X, Y){
  R.P.foes.each(f=>{
    if(!f.on || f.hp <= 0) return;
    const fx = X(f.x), fy = Y(f.y), s = f.size;
    if(fx < -s || fy < -s || fx > R.W + s || fy > R.H + s) return;
    if(f.frz > 0){
      /* gelé : un cristal l'enveloppe */
      const a = Math.min(1, f.frz * 2);
      x.globalAlpha = 0.32 * a; x.fillStyle = "#bff4ff";
      x.beginPath(); for(let i = 0; i < 6; i++){ const an = i / 6 * LG_TAU + 0.5, r = s * 0.46; i ? x.lineTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r) : x.moveTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r); }
      x.closePath(); x.fill();
      x.globalAlpha = 0.8 * a; x.strokeStyle = "#ffffff"; x.lineWidth = 1.5; x.stroke();
    }
    if(f.tstop > 0){
      /* le temps arrêté : une teinte verte, figée */
      x.globalAlpha = 0.18; x.fillStyle = "#9fe07a";
      x.beginPath(); x.arc(fx, fy, s * 0.42, 0, LG_TAU); x.fill();
    }
  });
  lgReset(x);
}
if(typeof brDrawOver === "function"){
  const _brDrawOverL = brDrawOver;
  brDrawOver = function(x, R, X, Y){
    try { lgDrawStates(x, R, X, Y); lgDrawLayer(x, R, X, Y, "mid"); } catch(e){}
    const r = _brDrawOverL.apply(this, arguments);
    try {
      lgDrawLayer(x, R, X, Y, "sky");
      R.team.forEach((w, i)=>{ if(w.serpC && brArch(brShownId(w)).k === "lgSerpent") lgDrawSerpent(x, R, w, i, X, Y); });
      lgReset(x);
    } catch(e){}
    return r;
  };
}
