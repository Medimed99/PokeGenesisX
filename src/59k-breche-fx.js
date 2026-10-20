/* ============================================================
   59k — LA BRÈCHE · DES ATTAQUES QUI RESSEMBLENT À LEUR POKÉMON
   Retour de jeu : « un Ronflex tire des boules lumineuses à distance,
   ça n'a aucun sens ». Trois changements :
     1. LE CORPS ATTAQUE. Les attaques physiques font bouger le Pokémon :
        · « dash »  — il fonce en ligne droite à travers la horde, puis
          revient (Vive-Attaque, Aqua-Jet, Étincelle, Aéropiqué…) ;
        · « slam »  — les poids lourds (lents, massifs) BONDISSENT et
          retombent de tout leur poids : onde de choc, cratère, débris
          (Plaquage pour Ronflex, Tacle Lourd, Marto-Poing…) ;
        · coups de poing et griffes : il s'élance au contact avant de frapper.
     2. CHAQUE TYPE A SON PROJECTILE. Une étoile pour Météores, une
        boule de feu, une goutte, une feuille qui tourne, un éclat de
        glace, un roc, une Ball'Ombre, une sphère d'aura…
     3. CHAQUE TYPE A SON IMPACT. Braises qui montent, gouttes qui
        retombent, feuilles, étincelles, éclats, cailloux, bulles…
   ============================================================ */

/* ---------- 1. les formes nouvelles ---------- */
BR_KIND.dash = {dmg:9.1, cd:1.25};
BR_KIND.slam = {dmg:16, cd:2.2};
/* les attaques au contact : le corps entier se jette en avant */
for(const t of [1, 3, 4, 11, 13, 18]) BR_ATK[t][1] = ["dash", BR_ATK[t][1][1], BR_ATK[t][1][2]];
/* les poids lourds : un nom par type, la vraie attaque du Pokémon */
const BR_SLAM = {
  1:["Plaquage","Giga Impact"], 2:["Marto-Poing","Dynamopoing"], 3:["Chute Libre","Piqué"], 4:["Détricanon","Bombe Beurk Lourde"],
  5:["Piétisol","Séisme Brutal"], 6:["Éclate-Roc","Fracass'Tête"], 7:["Mégacorne","Charge Insecte"], 8:["Hantise","Ombre Portée"],
  9:["Tacle Lourd","Poing Météore"], 10:["Nitrocharge","Boutefeu"], 11:["Cascade","Aquatacle"], 12:["Mégafouet","Martobois"],
  13:["Éclair Fou","Électacle"], 14:["Psykoud'Boul","Coupe Psycho"], 15:["Avalanche","Chute Glace"], 16:["Draco-Queue","Draco-Charge"],
  17:["Mâchouille","Représailles"], 18:["Câlinerie","Câlin Fatal"]
};
/* qui est un poids lourd : physique, lent, massif */
function brIsHeavy(p){ return p.atk >= p.spa * 1.12 && p.spe <= 60 && p.hp + p.def >= 150; }
const _brArchFor0 = brArchFor;
brArchFor = function(id){
  if(BR_ARCH_CACHE[id]) return BR_ARCH_CACHE[id];
  const a = _brArchFor0(id), p = POKE[id];
  if(!a.sig && a.prof === 1 && brIsHeavy(p)){
    const [n, n2] = BR_SLAM[p.types[0]] || BR_SLAM[1];
    Object.assign(a, {k:"slam", n, n2, dmg:BR_KIND.slam.dmg, cd:BR_KIND.slam.cd, heavy:true});
  }
  return a;
};
try { BR_MELEE.add("dash"); BR_MELEE.add("slam"); } catch(e){}

/* le type de l'attaquant, pour habiller ses projectiles */
function brTyOf(R, wi){ const w = wi >= 0 && R.team ? R.team[wi] : null; return w ? POKE[brShownId(w)].types[0] : 0; }

const _brFire0 = brFire;
brFire = function(R, w, st, pos){
  if(st.k === "dash") return brFireDash(R, w, st, pos);
  if(st.k === "slam") return brFireSlam(R, w, st, pos);
  /* poing, griffe : il s'élance d'abord, le coup part à l'arrivée */
  if((st.k === "punch" || st.k === "slash") && R.team && R.team[R.curW] === w && !st._now){
    const t = brNearest(R, pos.x, pos.y, 200);
    if(t){
      const dx = t.x - pos.x, dy = t.y - pos.y, d = Math.hypot(dx, dy) || 1, m = Math.max(0, Math.min(d - 22, 95));
      if(m > 10){
        w.lastAng = Math.atan2(dy, dx);
        w.dash = {t:0, dur:0.3, ax:dx / d * m, ay:dy / d * m, k:"lunge"};
        brZone(R, {k:"defer", x:pos.x, y:pos.y, life:0.12, max:0.12, delay:0, w:R.curW, mw:w, st:Object.assign({}, st, {_now:true}), offx:dx / d * m, offy:dy / d * m});
        return;
      }
    }
  }
  return _brFire0(R, w, st, pos);
};
/* la ruée : une ligne droite à travers la horde, et retour */
function brFireDash(R, w, st, pos){
  const t = brNearest(R, pos.x, pos.y, 360);
  const ang = t ? Math.atan2(t.y - pos.y, t.x - pos.x) : (R.face > 0 ? 0 : Math.PI);
  w.lastAng = ang;
  const L = (150 + 22 * Math.min(4, st.count)) * Math.min(1.5, st.area), dur = 0.36;
  const z = brZone(R, {k:"dash", x:pos.x, y:pos.y, a:ang, len:L, bw:22 * Math.min(1.6, st.area), life:dur, max:dur, delay:0,
    dmg:st.dmg, color:st.color, w:R.curW, hit:new Set(), back:false, two:w.stage >= 2, ty:brTyOf(R, R.curW)});
  w.dash = {t:0, dur, ax:Math.cos(ang) * L, ay:Math.sin(ang) * L, k:"dash", z};
  try { Sfx.wobble && R.curW === 0 && Sfx.wobble(); } catch(e){}
}
/* le bond : il s'élève, retombe sur la cible de tout son poids */
function brFireSlam(R, w, st, pos){
  const t = brNearest(R, pos.x, pos.y, 320);
  let ax = 0, ay = 0;
  if(t){ const dx = t.x - pos.x, dy = t.y - pos.y, d = Math.hypot(dx, dy) || 1, m = Math.min(d, 160); ax = dx / d * m; ay = dy / d * m; }
  w.lastAng = Math.atan2(ay || 0.01, ax || (R.face > 0 ? 1 : -1));
  const dur = 0.66, land = 0.42;
  const z = brZone(R, {k:"slam", x:pos.x + ax, y:pos.y + ay, r:86 * Math.min(1.7, st.area), life:dur, max:dur, delay:0,
    dmg:st.dmg, color:st.color, w:R.curW, fired:false, land, ax, ay, two:w.stage >= 2, ty:brTyOf(R, R.curW)});
  w.dash = {t:0, dur, ax, ay, k:"slam", land, h:78 + Math.min(40, (POKE[brShownId(w)].hp + POKE[brShownId(w)].def) * 0.08), z};
}
/* où se trouve le Pokémon pendant son geste : décalage au sol et hauteur */
function brMemberOff(w, p, tt){
  const d = w && w.dash;
  if(!d) return p;
  const k = Math.min(1, (tt === undefined ? d.t : tt) / d.dur);
  if(d.k === "dash"){
    const e = k < 0.52 ? 1 - Math.pow(1 - k / 0.52, 3) : 1 - (k - 0.52) / 0.48 * ((k - 0.52) / 0.48) * (3 - 2 * (k - 0.52) / 0.48);
    return {x:p.x + d.ax * e, y:p.y + d.ay * e, z:0};
  }
  if(d.k === "lunge"){ const e = Math.sin(Math.PI * Math.min(1, k * 1.15)); return {x:p.x + d.ax * Math.max(0, e), y:p.y + d.ay * Math.max(0, e), z:0}; }
  if(d.k === "slam"){
    const L = d.land / d.dur;
    if(k < L){ const q = k / L; return {x:p.x + d.ax * q, y:p.y + d.ay * q, z:Math.sin(Math.PI * q) * d.h * (q < 0.5 ? 1 : 1.0)}; }
    const q = (k - L) / (1 - L), e = q < 0.35 ? 0 : (q - 0.35) / 0.65;
    return {x:p.x + d.ax * (1 - e * e * (3 - 2 * e)), y:p.y + d.ay * (1 - e * e * (3 - 2 * e)), z:Math.sin(Math.PI * e) * 14, squash:q < 0.35 ? 1 - q / 0.35 : 0};
  }
  return p;
}
const _brWeapons0 = brWeapons;
brWeapons = function(R, dt){
  R.tyBudget = 90;
  for(const w of R.team) if(w.dash){ w.dash.t += dt; if(w.dash.t >= w.dash.dur) w.dash = null; }
  return _brWeapons0(R, dt);
};

/* ---------- les zones : la ruée, le bond, le coup différé ---------- */
const _brZoneExtra0 = brZoneExtra;
brZoneExtra = function(R, z, dt){
  switch(z.k){
    case "defer":
      if(z.life <= 0){
        z.on = false;
        if(R.team[z.w] === z.mw){ const b = brMemberPos(R, z.w); R.curW = z.w; _brFire0(R, z.mw, z.st, {x:b.x + z.offx, y:b.y + z.offy}); }
      }
      return true;
    case "dash": {
      const w = R.team[z.w];
      if(!w || !w.dash || w.dash.z !== z){ z.on = false; return true; }
      const p = brMemberOff(w, brMemberPos(R, z.w)), k = 1 - Math.max(0, z.life) / z.max;
      if(z.two && k > 0.52 && !z.back){ z.back = true; z.hit.clear(); }
      R.curW = z.w;
      const nx = -Math.sin(z.a), ny = Math.cos(z.a);
      brNear(R, p.x, p.y, z.bw + 36, f=>{
        if(z.hit.has(f) || f.hp <= 0) return;
        if(Math.hypot(f.x - p.x, f.y - p.y) > z.bw + f.r) return;
        z.hit.add(f);
        const side = (f.x - p.x) * nx + (f.y - p.y) * ny >= 0 ? 1 : -1;
        brHit(R, f, z.dmg, z.color, nx * side * 0.7 + Math.cos(z.a) * 0.5, ny * side * 0.7 + Math.sin(z.a) * 0.5, 300);
        brTyImpact(R, f.x, f.y, z.ty, Math.cos(z.a) * 200, Math.sin(z.a) * 200, 5);
      });
      if(k < 0.55) brTyTrail(R, p.x, p.y, z.ty, z.color);
      if(z.life <= 0) z.on = false;
      return true; }
    case "slam": {
      const w = R.team[z.w], el = z.max - Math.max(0, z.life);
      if(!z.fired && el >= z.land){
        z.fired = true;
        const b = w ? brMemberPos(R, z.w) : {x:z.x - z.ax, y:z.y - z.ay}, cx = b.x + z.ax, cy = b.y + z.ay;
        z.x = cx; z.y = cy;
        R.curW = z.w;
        brNear(R, cx, cy, z.r + 20, f=>{
          const dx = f.x - cx, dy = f.y - cy, d = Math.hypot(dx, dy) || 1;
          if(d > z.r + f.r) return;
          brHit(R, f, z.dmg * (1 - 0.35 * Math.min(1, d / z.r)), z.color, dx / d, dy / d, 460);
          if(!f.boss && f.on && f.hp > 0) f.stun = Math.max(f.stun || 0, 0.4);
        });
        brRing(R, cx, cy, z.r, z.color, 0.4); brRing(R, cx, cy, z.r * 0.55, "#ffffff", 0.22);
        brDecal(R, "crater", cx, cy + 4, z.r * 0.8, 12);
        if(BR_TYPE_DECAL[z.ty] && BR_TYPE_DECAL[z.ty] !== "crack") brDecal(R, BR_TYPE_DECAL[z.ty], cx, cy, z.r * 0.9, 8);
        brSlamDebris(R, cx, cy, z.r, z.ty, z.color);
        brShake(R, z.w === 0 ? 6 : 3.5); brHitstop(R, 35);
        if(z.two) brZone(R, {k:"ring", x:cx, y:cy, r:10, maxr:z.r * 2.3, life:0.55, max:0.55, delay:0, dmg:z.dmg * 0.45, color:z.color, hit:new Set(), quake:true, w:z.w});
        try { Sfx.hit && Sfx.hit(); buzz(z.w === 0 ? 30 : 12); } catch(e){}
      }
      if(z.life <= 0) z.on = false;
      return true; }
  }
  return _brZoneExtra0(R, z, dt);
};
const _brDrawZoneExtra0 = brDrawZoneExtra;
brDrawZoneExtra = function(x, R, z, X, Y){
  if(z.k === "defer" || z.k === "dash") return true;
  if(z.k === "slam"){
    if(z.fired) return true;
    /* la cible au sol : l'ombre de ce qui va tomber, qui grossit */
    const b = R.team[z.w] ? brMemberPos(R, z.w) : {x:z.x - z.ax, y:z.y - z.ay};
    const cx = X(b.x + z.ax), cy = Y(b.y + z.ay), el = z.max - Math.max(0, z.life), k = Math.min(1, el / z.land);
    x.save();
    x.globalAlpha = 0.18 + k * 0.3; x.fillStyle = "#000";
    x.beginPath(); x.ellipse(cx, cy + 6, z.r * (0.3 + 0.55 * k), z.r * (0.12 + 0.2 * k), 0, 0, 7); x.fill();
    x.globalAlpha = 0.55 * k; x.strokeStyle = z.color; x.lineWidth = 2; x.setLineDash([6, 5]); x.lineDashOffset = -R.t * 30;
    x.beginPath(); x.ellipse(cx, cy + 6, z.r, z.r * 0.38, 0, 0, 7); x.stroke(); x.setLineDash([]);
    x.restore();
    return true;
  }
  return _brDrawZoneExtra0(x, R, z, X, Y);
};

/* ---------- le rendu d'un membre pendant son geste ---------- */
/* les images rémanentes de la ruée, la poussière du bond */
function brDrawDashTrail(x, R, w, p0, X, Y, s, V){
  const d = w.dash;
  if(!d || d.k === "lunge") return;
  const id = brShownId(w);
  if(d.k === "dash"){
    for(let j = 3; j >= 1; j--){
      const q = brMemberOff(w, p0, Math.max(0, d.t - j * 0.035));
      brPmdDraw(x, id, "w", w.pose ? w.pose.dir : (w.dir || 0), null, X(q.x), Y(q.y), s, 0.14 * (4 - j));
    }
    /* les lignes de vitesse le long de la ruée */
    const q = brMemberOff(w, p0), a = Math.atan2(d.ay, d.ax);
    x.save(); x.globalCompositeOperation = "lighter"; x.strokeStyle = brRgbaCol((d.z && d.z.color) || "#ffffff", 0.5); x.lineWidth = 2;
    for(let i = -2; i <= 2; i++){
      const ox = -Math.sin(a) * i * 7, oy = Math.cos(a) * i * 7, len = 30 + (2 - Math.abs(i)) * 18;
      x.beginPath(); x.moveTo(X(q.x) + ox, Y(q.y) + oy - 8); x.lineTo(X(q.x) + ox - Math.cos(a) * len, Y(q.y) + oy - 8 - Math.sin(a) * len); x.stroke();
    }
    x.restore();
  }
}

/* ---------- 2. les projectiles habillés selon le type ---------- */
const _brShot0 = brShot;
brShot = function(R, x, y, vx, vy, o){
  const s = _brShot0(R, x, y, vx, vy, o);
  s.ty = s.kind === "enemy" || s.w < 0 ? 0 : brTyOf(R, s.w);
  s.seed = (R.rng() * 1000) | 0;
  return s;
};
function brStarPath(x, cx, cy, r1, r2, n, rot){
  x.beginPath();
  for(let i = 0; i < n * 2; i++){ const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n; i ? x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  x.closePath();
}
function brGlow(x, cx, cy, r, col, a){ x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.globalAlpha = 1; }
/* renvoie true si le projectile a été dessiné */
function brDrawShotTy(x, R, s, px, py){
  const ty = s.ty;
  if(!ty || s.enemy || s.kind === "flame") return false;
  const C = s.color, r = Math.max(3.5, s.r), t = s.t, a = Math.atan2(s.vy, s.vx), sp = Math.hypot(s.vx, s.vy);
  x.save();
  /* le lob : un vrai objet lancé, avec son ombre au sol */
  if(s.kind === "lob"){
    const k = Math.min(1, 1 - s.life / 0.6), gx = X0(s, k, "x"), gy = X0(s, k, "y");
    x.globalCompositeOperation = "source-over";
    x.globalAlpha = 0.35; x.fillStyle = "#000"; x.beginPath(); x.ellipse(px + (gx - s.x), py + (gy - s.y) + 6, 8 + k * 4, 3 + k * 1.5, 0, 0, 7); x.fill(); x.globalAlpha = 1;
    if(ty === 5){ x.fillStyle = "#6b4423"; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); x.fillStyle = "#3e2614"; x.beginPath(); x.arc(px - 3, py + 2, 3, 0, 7); x.arc(px + 3, py - 2, 2, 0, 7); x.fill();
      x.fillStyle = "rgba(255,230,200,.35)"; x.beginPath(); x.arc(px - 3, py - 3, 3, 0, 7); x.fill(); }
    else if(ty === 6 || ty === 9){ brRockPath(x, px, py, 10, t * 7, s.seed); x.fillStyle = ty === 9 ? "#9aa6b8" : "#8a7458"; x.fill(); x.strokeStyle = ty === 9 ? "#e8f0ff" : "#c9b48c"; x.lineWidth = 1.5; x.stroke(); }
    else { x.globalCompositeOperation = "lighter"; brGlow(x, px, py, 14, C, 0.3); brGlow(x, px, py, 9, C, 1); brGlow(x, px, py, 4, "#ffffff", 1); }
    x.restore(); return true;
  }
  switch(ty){
    case 1: case 18: {                 /* Météores : une étoile ; Fée : un scintillement à quatre branches */
      x.globalCompositeOperation = "lighter";
      brGlow(x, px, py, r * 2.4, C, 0.22);
      for(let j = 1; j <= 3; j++) brGlow(x, px - s.vx * 0.012 * j * 2, py - s.vy * 0.012 * j * 2, r * (0.7 - j * 0.15), C, 0.35 - j * 0.08);
      if(ty === 1){ brStarPath(x, px, py, r * 1.7, r * 0.75, 5, t * 9); x.fillStyle = "#fff6c8"; x.fill(); }
      else { brStarPath(x, px, py, r * 2, r * 0.45, 4, t * 4); x.fillStyle = "#ffe0f2"; x.fill(); brStarPath(x, px, py, r * 1.1, r * 0.3, 4, t * 4 + 0.78); x.fillStyle = C; x.fill(); }
      break; }
    case 2: {                          /* Aurasphère : une sphère d'aura qui tourbillonne */
      x.globalCompositeOperation = "lighter";
      brGlow(x, px, py, r * 2.3, "#4fb2ff", 0.22); brGlow(x, px, py, r * 1.3, "#7fd0ff", 0.9); brGlow(x, px, py, r * 0.6, "#ffffff", 1);
      x.strokeStyle = "rgba(160,220,255,.85)"; x.lineWidth = 1.6;
      for(let i = 0; i < 3; i++){ const b = t * 10 + i * 2.1; x.beginPath(); x.arc(px, py, r * (1.6 + i * 0.25), b, b + 1.3); x.stroke(); }
      break; }
    case 3: case 17: {                 /* Lame d'Air : un croissant de vent ; Ténèbres : un croissant noir */
      const rot = s.kind === "blade" ? t * 16 : a;
      x.translate(px, py); x.rotate(rot);
      if(ty === 17){ x.globalCompositeOperation = "source-over"; x.fillStyle = "rgba(20,6,30,.92)"; }
      else { x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(220,240,255,.85)"; }
      x.beginPath(); x.arc(0, 0, r * 1.9, -1.25, 1.25); x.arc(-r * 0.9, 0, r * 1.6, 1.0, -1.0, true); x.closePath(); x.fill();
      x.strokeStyle = ty === 17 ? "#ff3d7f" : C; x.lineWidth = 1.5; x.stroke();
      break; }
    case 4: {                          /* Toxik : une boule de boue violette qui goutte */
      x.globalCompositeOperation = "source-over";
      const wob = 1 + Math.sin(t * 18 + s.seed) * 0.12;
      x.fillStyle = "#6a2a8a"; x.beginPath(); x.ellipse(px, py, r * 1.25 * wob, r * 1.25 / wob, a, 0, 7); x.fill();
      x.fillStyle = "#b86bff"; x.beginPath(); x.ellipse(px - 1, py - 1, r * 0.85 * wob, r * 0.85 / wob, a, 0, 7); x.fill();
      x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.arc(px - r * 0.35, py - r * 0.4, r * 0.25, 0, 7); x.fill();
      x.fillStyle = "#8a3ab0"; x.beginPath(); x.arc(px - Math.cos(a) * r * 1.8, py - Math.sin(a) * r * 1.8, r * 0.4, 0, 7); x.fill();
      break; }
    case 5: case 6: {                  /* Boue / Roc : de la matière, pas de la lumière */
      x.globalCompositeOperation = "source-over";
      if(ty === 5){ x.fillStyle = "#5e3c1e"; x.beginPath(); x.arc(px, py, r * 1.2, 0, 7); x.fill(); x.fillStyle = "#8a5a2b"; x.beginPath(); x.arc(px - 1, py - 1, r * 0.9, 0, 7); x.fill(); }
      else { brRockPath(x, px, py, r * 1.35, t * 8, s.seed); x.fillStyle = "#7d6a52"; x.fill(); x.strokeStyle = "#cbb68e"; x.lineWidth = 1.4; x.stroke(); }
      x.fillStyle = "rgba(0,0,0,.25)"; x.beginPath(); x.arc(px - Math.cos(a) * r * 1.6, py - Math.sin(a) * r * 1.6, r * 0.45, 0, 7); x.fill();
      break; }
    case 7: {                          /* Dard-Nuée : une aiguille */
      x.globalCompositeOperation = "lighter";
      x.translate(px, py); x.rotate(a);
      x.fillStyle = "rgba(170,230,80,.35)"; x.fillRect(-r * 4, -1, r * 4, 2);
      x.fillStyle = "#d8ff7a"; x.beginPath(); x.moveTo(r * 1.8, 0); x.lineTo(-r * 1.2, -r * 0.45); x.lineTo(-r * 0.8, 0); x.lineTo(-r * 1.2, r * 0.45); x.closePath(); x.fill();
      break; }
    case 8: {                          /* Ball'Ombre : un cœur noir, des volutes violettes */
      x.globalCompositeOperation = "lighter";
      brGlow(x, px, py, r * 2.2, "#7a3ab8", 0.3);
      for(let i = 0; i < 4; i++){ const b = t * 7 + i * 1.57; brGlow(x, px + Math.cos(b) * r * 1.1, py + Math.sin(b) * r * 1.1, r * 0.55, "#b06bff", 0.5); }
      x.globalCompositeOperation = "source-over";
      x.fillStyle = "#1a0a2a"; x.beginPath(); x.arc(px, py, r * 1.05, 0, 7); x.fill();
      x.strokeStyle = "#c896ff"; x.lineWidth = 1.5; x.stroke();
      break; }
    case 9: {                          /* Acier : un éclat de métal, une croix de lumière */
      x.globalCompositeOperation = "lighter";
      x.translate(px, py); x.rotate(t * 6);
      x.fillStyle = "#c7d2e0"; x.beginPath(); x.moveTo(0, -r * 1.6); x.lineTo(r * 0.8, 0); x.lineTo(0, r * 1.6); x.lineTo(-r * 0.8, 0); x.closePath(); x.fill();
      x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(-r * 2.2, -0.75, r * 4.4, 1.5); x.fillRect(-0.75, -r * 2.2, 1.5, r * 4.4);
      break; }
    case 10: case 16: {                /* Feu / Dragon : une boule de flammes et sa traîne */
      x.globalCompositeOperation = "lighter";
      const c1 = ty === 10 ? "#ff5a1a" : "#7a5cff", c2 = ty === 10 ? "#ffb35c" : "#5ce0ff", c3 = ty === 10 ? "#fff3b0" : "#e8f6ff";
      x.translate(px, py); x.rotate(a);
      const fl = 1 + Math.sin(t * 30 + s.seed) * 0.15;
      x.fillStyle = c1; x.globalAlpha = 0.6; x.beginPath(); x.moveTo(r * 1.1, -r); x.quadraticCurveTo(-r * 4.5 * fl, 0, r * 1.1, r); x.closePath(); x.fill();
      x.globalAlpha = 1; brGlow(x, 0, 0, r * 1.3, c1, 0.9); brGlow(x, r * 0.15, 0, r * 0.9, c2, 1); brGlow(x, r * 0.3, 0, r * 0.45, c3, 1);
      break; }
    case 11: {                         /* Eau : une goutte, pointe en arrière */
      x.globalCompositeOperation = "lighter";
      x.translate(px, py); x.rotate(a);
      x.fillStyle = "rgba(79,178,255,.35)"; x.beginPath(); x.arc(0, 0, r * 2, 0, 7); x.fill();
      x.fillStyle = "#4fb2ff"; x.beginPath(); x.arc(0, 0, r * 1.1, -Math.PI / 2, Math.PI / 2); x.lineTo(-r * 2.6, 0); x.closePath(); x.fill();
      x.fillStyle = "rgba(255,255,255,.85)"; x.beginPath(); x.arc(r * 0.3, -r * 0.4, r * 0.35, 0, 7); x.fill();
      break; }
    case 12: {                         /* Feuille Magik : une feuille qui tournoie */
      x.globalCompositeOperation = "source-over";
      x.translate(px, py); x.rotate(t * 12 + s.seed);
      x.fillStyle = "#3fae4a"; x.beginPath(); x.moveTo(-r * 1.8, 0); x.quadraticCurveTo(0, -r * 1.3, r * 1.8, 0); x.quadraticCurveTo(0, r * 1.3, -r * 1.8, 0); x.fill();
      x.strokeStyle = "#b8f08a"; x.lineWidth = 1; x.beginPath(); x.moveTo(-r * 1.6, 0); x.lineTo(r * 1.6, 0); x.stroke();
      x.globalCompositeOperation = "lighter"; brGlow(x, 0, 0, r * 2, C, 0.15);
      break; }
    case 13: {                         /* Éclair : un cœur jaune et des arcs qui crépitent */
      x.globalCompositeOperation = "lighter";
      brGlow(x, px, py, r * 2.2, "#ffe45e", 0.25); brGlow(x, px, py, r, "#fff6a8", 1);
      x.strokeStyle = "#fffbe0"; x.lineWidth = 1.5;
      for(let i = 0; i < 3; i++){
        let b = R.rng() * 6.28, qx = px, qy = py; x.beginPath(); x.moveTo(qx, qy);
        for(let j = 0; j < 3; j++){ b += (R.rng() - .5) * 1.4; qx += Math.cos(b) * r * 0.9; qy += Math.sin(b) * r * 0.9; x.lineTo(qx, qy); }
        x.stroke();
      }
      break; }
    case 14: {                         /* Psy : des anneaux qui pulsent */
      x.globalCompositeOperation = "lighter";
      const pu = 1 + Math.sin(t * 16) * 0.2;
      x.strokeStyle = "#ff7ad9"; x.lineWidth = 2; x.beginPath(); x.arc(px, py, r * 1.4 * pu, 0, 7); x.stroke();
      x.strokeStyle = "rgba(200,120,255,.7)"; x.beginPath(); x.arc(px, py, r * 2.1 / pu, 0, 7); x.stroke();
      brGlow(x, px, py, r * 0.6, "#ffe0f6", 1);
      break; }
    case 15: {                         /* Glace : un éclat de cristal */
      x.globalCompositeOperation = "lighter";
      x.translate(px, py); x.rotate(a);
      brGlow(x, 0, 0, r * 2, "#aef4ff", 0.2);
      x.fillStyle = "#bff4ff"; x.beginPath(); x.moveTo(r * 2.2, 0); x.lineTo(r * 0.4, -r * 0.8); x.lineTo(-r * 1.8, -r * 0.4); x.lineTo(-r * 1.8, r * 0.4); x.lineTo(r * 0.4, r * 0.8); x.closePath(); x.fill();
      x.fillStyle = "#ffffff"; x.beginPath(); x.moveTo(r * 2.2, 0); x.lineTo(r * 0.4, -r * 0.3); x.lineTo(-r * 1.2, 0); x.closePath(); x.fill();
      break; }
    default: x.restore(); return false;
  }
  x.restore();
  return true;
}
/* la position au sol d'un lob (sans l'arc) */
function X0(s, k, ax){ return ax === "x" ? s.ox + (s.lobTo.x - s.ox) * k : s.oy + (s.lobTo.y - s.oy) * k; }
function brRockPath(x, cx, cy, r, rot, seed){
  x.beginPath();
  for(let i = 0; i < 7; i++){ const a = rot + i / 7 * Math.PI * 2, rr = r * (0.72 + ((seed * (i + 3) * 37) % 29) / 29 * 0.38);
    i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath();
}

/* ---------- 3. les impacts : chaque type laisse sa matière ---------- */
/* une particule de forme, avec gravité et rotation */
function brPart(R, x, y, vx, vy, life, color, size, sh, g){
  const p = R.P.parts.get();
  p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.color = color; p.size = size; p.sh = sh || null; p.g = g || 0;
  p.rot = R.rng() * 6.28; p.spin = (R.rng() - .5) * 14;
  return p;
}
/* par type : [forme, couleurs, gravité, vitesse] */
const BR_TY_FX = {
  1:["star", ["#fff6c8","#ffffff"], 0, 160],   2:["spark", ["#7fd0ff","#ffb35c"], 0, 260], 3:["leaf", ["#e8f4ff","#cfe3ff"], 40, 150],
  4:["bubble", ["#b86bff","#7a3ab0"], -50, 90], 5:["rock", ["#8a5a2b","#5e3c1e"], 520, 190], 6:["rock", ["#8a7458","#cbb68e"], 560, 200],
  7:["sq", ["#b8e05c","#e8ff9a"], 0, 150],     8:["smoke", ["#7a3ab8","#2a0a3e"], -30, 70], 9:["spark", ["#ffffff","#ffe45e"], 300, 280],
  10:["ember", ["#ff8a3d","#ffd24a"], -120, 140], 11:["drop", ["#4fb2ff","#bfe6ff"], 520, 210], 12:["leaf", ["#3fae4a","#9fe07a"], 60, 150],
  13:["spark", ["#fff6a8","#ffe45e"], 0, 300], 14:["star", ["#ff7ad9","#d9a3ff"], 0, 130], 15:["shard", ["#bff4ff","#ffffff"], 420, 220],
  16:["ember", ["#7a5cff","#5ce0ff"], -90, 140], 17:["smoke", ["#3a1a4a","#ff3d7f"], -20, 70], 18:["star", ["#ffb3dc","#ffffff"], 0, 130]
};
function brTyImpact(R, x, y, ty, vx, vy, n){
  const F = BR_TY_FX[ty];
  if(!F) return;
  R.tyBudget = R.tyBudget === undefined ? 90 : R.tyBudget;
  if(R.tyBudget <= 0) return;
  n = Math.min(n || 4, R.tyBudget); R.tyBudget -= n;
  const base = Math.atan2(vy || 0, vx || 1);
  for(let i = 0; i < n; i++){
    const a = (vx || vy) ? base + (R.rng() - .5) * 2.2 : R.rng() * 6.28, v = F[3] * (0.4 + R.rng() * 0.8);
    const up = F[2] > 200 ? -F[2] * 0.35 : 0;
    brPart(R, x, y, Math.cos(a) * v, Math.sin(a) * v + up, 0.35 + R.rng() * 0.35, F[1][i % 2], 2 + R.rng() * 3, F[0], F[2]);
  }
}
/* la traînée d'une ruée */
function brTyTrail(R, x, y, ty, C){
  if(R.rng() < 0.5) return;
  const F = BR_TY_FX[ty] || ["sq", [C, "#ffffff"], 0, 60];
  brPart(R, x + (R.rng() - .5) * 16, y + (R.rng() - .5) * 10, (R.rng() - .5) * 40, (R.rng() - .5) * 40 - 10, 0.35, F[1][0], 2 + R.rng() * 2.5, F[0] === "rock" ? "smoke" : F[0], F[2] > 0 ? 0 : F[2]);
}
/* l'atterrissage d'un poids lourd : cailloux, poussière, et la matière du type */
function brSlamDebris(R, x, y, r, ty, C){
  for(let i = 0; i < 14; i++){
    const a = R.rng() * 6.28, v = 120 + R.rng() * 220;
    brPart(R, x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.2, Math.cos(a) * v, Math.sin(a) * v * 0.5 - 220 - R.rng() * 160, 0.6 + R.rng() * 0.4, i % 3 ? "#7d6a52" : "#b8a27c", 3 + R.rng() * 4, "rock", 820);
  }
  for(let i = 0; i < 12; i++){
    const a = i / 12 * 6.28, v = 90 + R.rng() * 60;
    brPart(R, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.25, Math.cos(a) * v, Math.sin(a) * v * 0.45, 0.7 + R.rng() * 0.3, "rgba(210,190,160,.6)", 8 + R.rng() * 8, "smoke", -20);
  }
  brTyImpact(R, x, y, ty, 0, 0, 10);
}
/* le dessin d'une particule de forme (appelé par le rendu, en mode additif) */
function brDrawPart(x, R, p, px, py){
  const rot = p.rot + (p.max - p.life) * (p.spin || 0), s = p.size;
  switch(p.sh){
    case "cube": {
      const g = x.globalCompositeOperation; x.globalCompositeOperation = "source-over";
      x.save(); x.translate(px, py); x.rotate(rot);
      x.fillRect(-s / 2, -s / 2, s, s); x.fillStyle = "rgba(255,255,255,.45)"; x.fillRect(-s / 2, -s / 2, s, s * 0.3);
      x.restore(); x.globalCompositeOperation = g; return; }
    case "rock": {
      const g = x.globalCompositeOperation; x.globalCompositeOperation = "source-over";
      brRockPath(x, px, py, s * 0.7, rot, (p.size * 97) | 0); x.fill();
      x.globalCompositeOperation = g; return; }
    case "smoke": {
      const g = x.globalCompositeOperation; x.globalCompositeOperation = "source-over";
      const k = 1 - p.life / p.max; x.globalAlpha *= 0.55;
      x.beginPath(); x.arc(px, py, s * (0.6 + k * 0.9), 0, 7); x.fill();
      x.globalCompositeOperation = g; return; }
    case "drop": {
      const a = Math.atan2(p.vy, p.vx);
      x.save(); x.translate(px, py); x.rotate(a);
      x.beginPath(); x.arc(0, 0, s * 0.55, -Math.PI / 2, Math.PI / 2); x.lineTo(-s * 1.6, 0); x.closePath(); x.fill(); x.restore(); return; }
    case "leaf":
      x.save(); x.translate(px, py); x.rotate(rot);
      x.beginPath(); x.moveTo(-s, 0); x.quadraticCurveTo(0, -s * 0.7, s, 0); x.quadraticCurveTo(0, s * 0.7, -s, 0); x.fill(); x.restore(); return;
    case "spark": {
      const a = Math.atan2(p.vy, p.vx), l = s * 2.4;
      x.strokeStyle = p.color; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px - Math.cos(a) * l, py - Math.sin(a) * l); x.stroke(); return; }
    case "ember":
      x.beginPath(); x.arc(px, py, s * 0.5 * (p.life / p.max + 0.3), 0, 7); x.fill(); return;
    case "bubble":
      x.strokeStyle = p.color; x.lineWidth = 1.2; x.beginPath(); x.arc(px, py, s * 0.6, 0, 7); x.stroke(); return;
    case "star":
      brStarPath(x, px, py, s, s * 0.4, 4, rot); x.fill(); return;
    case "shard":
      x.save(); x.translate(px, py); x.rotate(rot);
      x.beginPath(); x.moveTo(s * 1.1, 0); x.lineTo(0, -s * 0.35); x.lineTo(-s * 1.1, 0); x.lineTo(0, s * 0.35); x.closePath(); x.fill(); x.restore(); return;
    default:
      x.fillRect(px, py, s, s);
  }
}
