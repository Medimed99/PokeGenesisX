/* ============================================================
   59f — LA BRÈCHE · LES SENSATIONS
   Repris de l'etude de Pokemon Arena (Big Kid Nation) : l'arene se
   souvient du combat, les Pokemon prennent la pose, le terrain
   reagit aux elements, les boss ont chacun leur maniere de se
   battre, chaque danger s'annonce, et le systeme commente.
   ============================================================ */

/* ============================================================
   1. LES POSES — attaque, tir, douleur (PMD)
   ============================================================ */
const BR_PMDX = {};
function brAnimSheet(id, anim, variant){
  if(typeof PMD_ANIM === "undefined" || !PMD_ANIM[id] || !PMD_ANIM[id][anim]) return null;
  const key = id + ":" + anim;
  let e = BR_PMDX[key];
  if(!e){
    e = BR_PMDX[key] = {img:new Image(), v:{}, bad:false};
    e.img.onerror = () => { e.bad = true; };
    e.img.src = (typeof PMD_BASE !== "undefined" ? PMD_BASE : "assets/pmd/") + id + "-" + anim + ".png";
  }
  if(e.bad || !e.img.complete || !e.img.naturalWidth) return null;
  if(variant === "s") return typeof brShinySheet === "function" ? brShinySheet(e.img, id, e.v) : null;
  if(e.v[variant]) return e.v[variant];
  const c = document.createElement("canvas");
  c.width = e.img.naturalWidth; c.height = e.img.naturalHeight;
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(e.img, 0, 0);
  if(variant !== "n"){
    try {
      const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
      for(let i = 0; i < d.length; i += 4){
        if(d[i+3] < 20) continue;
        if(variant === "w"){ d[i] = d[i+1] = d[i+2] = 255; continue; }
        const l = (d[i] * 0.3 + d[i+1] * 0.59 + d[i+2] * 0.11) / 255, p = BR_CORRUPT[Math.min(3, Math.floor(l * 4))];
        d[i] = Math.round(d[i] * 0.35 + p[0] * 0.65); d[i+1] = Math.round(d[i+1] * 0.35 + p[1] * 0.65); d[i+2] = Math.round(d[i+2] * 0.35 + p[2] * 0.65);
      }
      x.putImageData(img, 0, 0);
    } catch(err){ e.bad = true; return null; }
  }
  e.v[variant] = c;
  return c;
}
/* une pose jouee une fois : l'image depend du temps ecoule depuis son debut */
function brAnimDraw(x, id, anim, variant, dir, t, cx, cy, size, alpha){
  const sheet = brAnimSheet(id, anim, variant);
  if(!sheet) return false;
  const m = PMD_ANIM[id][anim], fw = m[0], fh = m[1], dur = m[3];
  let k = Math.floor(t * 60), f = dur.length - 1;
  for(let i = 0; i < dur.length; i++){ if(k < dur[i]){ f = i; break; } k -= dur[i]; }
  /* l'echelle suit celle de la marche, pour que la pose ne « saute » pas */
  const wm = PMD_META[id], sc = wm ? Math.min(size / 34, size * 2.1 / wm[1]) : size / 34;
  const w = fw * sc, h = fh * sc;
  if(alpha !== undefined) x.globalAlpha = alpha;
  x.drawImage(sheet, Math.min(f, m[2] - 1) * fw, dir * fh, fw, fh, cx - w / 2, cy - h * 0.6, w, h);
  if(alpha !== undefined) x.globalAlpha = 1;
  return true;
}
function brAnimLen(id, anim){
  const m = typeof PMD_ANIM !== "undefined" && PMD_ANIM[id] && PMD_ANIM[id][anim];
  return m ? m[3].reduce((a, b)=>a + b, 0) / 60 : 0;
}
const BR_MELEE = new Set(["punch","slash","ricochet","fissure","quake","pulse","aura"]);
/* le Pokemon se tourne vers sa cible et prend la pose d'attaque ou de tir */
function brPoseStart(R, w, kind){
  if(kind === "orbit" || kind === "aura") return;
  const id = brShownId(w);
  let anim = BR_MELEE.has(kind) ? "attack" : "shoot";
  if(!(PMD_ANIM[id] && PMD_ANIM[id][anim])) anim = "attack";
  const len = brAnimLen(id, anim);
  if(!len) return;
  const a = w.lastAng || 0;
  w.pose = {anim, t:0, len:Math.min(len, 0.7), dir:brDir8(Math.cos(a), Math.sin(a))};
}

/* ============================================================
   2. LES TRACES AU SOL — l'arène se souvient
   ============================================================ */
const BR_DECAL_TEX = {};
function brDecalTex(kind, v){
  const key = kind + v;
  if(BR_DECAL_TEX[key]) return BR_DECAL_TEX[key];
  const S2 = 96, c = document.createElement("canvas"); c.width = c.height = S2;
  const x = c.getContext("2d"), r = brRng(kind.length * 977 + v * 131 + 7), C = S2 / 2;
  const blob = (col, rad, n) => { for(let i = 0; i < n; i++){ const a = r() * 6.28, d = r() * rad * 0.55;
    x.fillStyle = col; x.beginPath(); x.arc(C + Math.cos(a) * d, C + Math.sin(a) * d, rad * (0.25 + r() * 0.35), 0, 7); x.fill(); } };
  if(kind === "scorch"){ blob("rgba(20,10,6,.55)", 40, 9); blob("rgba(60,20,8,.35)", 30, 6);
    x.fillStyle = "rgba(255,120,40,.5)"; for(let i = 0; i < 10; i++) x.fillRect(C + (r() - .5) * 60, C + (r() - .5) * 60, 2, 2); }
  else if(kind === "spark"){ blob("rgba(20,20,30,.5)", 34, 7);
    x.strokeStyle = "rgba(140,220,255,.7)"; x.lineWidth = 1.5;
    for(let i = 0; i < 6; i++){ x.beginPath(); let px = C, py = C; x.moveTo(px, py);
      for(let k = 0; k < 4; k++){ px += (r() - .5) * 24; py += (r() - .5) * 24; x.lineTo(px, py); } x.stroke(); } }
  else if(kind === "crater"){ blob("rgba(0,0,0,.4)", 38, 5);
    x.fillStyle = "rgba(10,8,6,.55)"; x.beginPath(); x.ellipse(C, C, 28, 22, 0, 0, 7); x.fill();
    x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = 3; x.beginPath(); x.ellipse(C, C - 2, 30, 23, 0, 3.6, 6.2); x.stroke();
    x.fillStyle = "rgba(90,80,70,.8)"; for(let i = 0; i < 12; i++){ const a = r() * 6.28, d = 30 + r() * 12; x.fillRect(C + Math.cos(a) * d, C + Math.sin(a) * d * 0.8, 3, 3); } }
  else if(kind === "crack"){ x.strokeStyle = "rgba(10,8,6,.75)"; x.lineWidth = 2;
    for(let i = 0; i < 5; i++){ x.beginPath(); let px = C, py = C, a = r() * 6.28; x.moveTo(px, py);
      for(let k = 0; k < 5; k++){ a += (r() - .5) * 1.1; px += Math.cos(a) * 9; py += Math.sin(a) * 9; x.lineTo(px, py); } x.stroke(); } }
  else if(kind === "frost"){ const g = x.createRadialGradient(C, C, 4, C, C, 42); g.addColorStop(0, "rgba(220,250,255,.6)"); g.addColorStop(1, "rgba(150,220,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, S2, S2); x.strokeStyle = "rgba(240,255,255,.75)"; x.lineWidth = 1.5;
    for(let i = 0; i < 6; i++){ const a = i / 6 * 6.28 + r() * 0.3; x.beginPath(); x.moveTo(C, C); x.lineTo(C + Math.cos(a) * 30, C + Math.sin(a) * 30);
      x.moveTo(C + Math.cos(a) * 18, C + Math.sin(a) * 18); x.lineTo(C + Math.cos(a + 0.5) * 24, C + Math.sin(a + 0.5) * 24); x.stroke(); } }
  else if(kind === "puddle" || kind === "toxic"){ const col = kind === "puddle" ? "rgba(70,150,230,.45)" : "rgba(150,70,200,.5)";
    blob(col, 36, 6); x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(C - 8, C - 8, 8, 3, -0.4, 0, 7); x.fill(); }
  else if(kind === "moss"){ blob("rgba(60,140,60,.45)", 34, 8);
    x.fillStyle = "rgba(140,220,90,.7)"; for(let i = 0; i < 14; i++) x.fillRect(C + (r() - .5) * 56, C + (r() - .5) * 56, 2, 3); }
  else { blob("rgba(40,10,60,.5)", 36, 8); }
  BR_DECAL_TEX[key] = c;
  return c;
}
function brDecal(R, kind, x, y, r, life){
  R.decals = R.decals || [];
  if(R.decals.length >= 150) R.decals.shift();
  R.decals.push({kind, x, y, r, life:life || 9, max:life || 9, rot:R.rng() * 6.28, v:Math.floor(R.rng() * 4)});
}
const BR_TYPE_DECAL = {10:"scorch", 13:"spark", 15:"frost", 11:"puddle", 4:"toxic", 5:"crack", 6:"crack", 2:"crack", 12:"moss", 8:"shadow", 17:"shadow"};
function brDecalOnKill(R, f){
  const t = f.lt;
  if(!t) return;
  const big = f.elite || f.big || f.boss;
  if(!big && R.rng() > 0.3) return;
  const kind = big && (t === 5 || t === 6 || t === 2) ? "crater" : (BR_TYPE_DECAL[t] || "crack");
  brDecal(R, kind, f.x, f.y, (big ? 1.5 : 0.8) * f.r + 14);
}
function brDecalsTick(R, dt){
  if(!R.decals) return;
  for(const d of R.decals) d.life -= dt;
  if(R.decals.length && R.decals[0].life <= 0) R.decals = R.decals.filter(d=>d.life > 0);
}
function brDrawDecals(x, R, X, Y){
  if(!R.decals) return;
  for(const d of R.decals){
    const dx = X(d.x), dy = Y(d.y);
    if(dx < -80 || dy < -80 || dx > R.W + 80 || dy > R.H + 80) continue;
    const a = Math.min(1, d.life / 2) * 0.9, s = d.r * 2;
    x.save(); x.globalAlpha = a; x.translate(dx, dy); x.rotate(d.rot);
    x.drawImage(brDecalTex(d.kind, d.v), -s / 2, -s / 2, s, s);
    x.restore();
  }
}

/* ============================================================
   3. LES RÉACTIONS ÉLÉMENTAIRES DU TERRAIN
   ============================================================ */
const BR_REACT_NEWS = {ice:"L'EAU GÈLE — UN PASSAGE S'OUVRE", burn:"LES HERBES S'EMBRASENT", shock:"L'EAU CONDUIT LA FOUDRE",
                       cool:"LA LAVE SE FIGE", melt:"LA GLACE FOND"};
function brReactNews(R, k){
  R.reactSeen = R.reactSeen || {};
  if(R.reactSeen[k]) return;
  R.reactSeen[k] = true; brTicker(R, BR_REACT_NEWS[k], "#8ff7e8");
}
function brAddZone(R, z){
  const ch = brChunkAt(R, Math.floor(z.x / BR_CHUNK), Math.floor(z.y / BR_CHUNK));
  ch.zones.push(z); R.map.near.zones.push(z);
}
function brTerrainReact(R, x, y, type, dmg){
  if(!R.map || (R.reactT && R.t - R.reactT < 0.06)) return;
  const z = brZoneAt(R, x, y);
  if(!z) return;
  /* un delai par reaction : la foudre frequente de Pikachu ne doit pas empecher la glace de prendre */
  z.cdk = z.cdk || {};
  const ready = k => !(z.cdk[k] > R.t);
  R.reactT = R.t;
  if(type === 15 && z.k === "water" && ready("ice")){         /* la glace gele l'eau : un pont */
    z.cdk.ice = R.t + 0.35;
    brAddZone(R, {k:"ice", x, y, r:44, seed:R.rng(), life:11, dyn:true});
    brReactNews(R, "ice");
  } else if(type === 10 && z.k === "grass" && !z.burn && ready("burn")){   /* le feu embrase les herbes */
    z.burn = 4; z.cdk.burn = R.t + 6; brReactNews(R, "burn");
  } else if(type === 10 && z.k === "ice"){                  /* le feu fait fondre la glace */
    z.life = Math.min(z.life || 0.1, 0.1); brReactNews(R, "melt");
  } else if(type === 13 && z.k === "water" && ready("shock")){   /* l'eau conduit la foudre */
    z.cdk.shock = R.t + 1.6; z.shock = 0.45;
    const zr = z.r;
    R.curW = -1;
    R.P.foes.each(f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < zr + f.r) brHit(R, f, (dmg || 10) * 0.9, "#ffe45e", 0, 0, 0); });
    brReactNews(R, "shock");
  } else if(type === 11 && z.k === "lava" && ready("cool")){   /* l'eau fige la lave */
    z.cdk.cool = R.t + 14; z.cooled = 12; brReactNews(R, "cool");
  }
}
/* evolution des terrains vivants : glace qui fond, herbes qui brulent, lave qui se reforme */
function brTerrainTick(R, dt){
  if(!R.map) return;
  for(const z of R.map.near.zones){
    if(z.dyn){ z.life -= dt; if(z.life <= 0) z.dead = true; }
    if(z.shock > 0) z.shock -= dt;
    if(z.cooled > 0){ z.cooled -= dt; }
    if(z.burn > 0){
      z.burn -= dt; z.burnTick = (z.burnTick || 0) - dt;
      if(z.burnTick <= 0){
        z.burnTick = 0.5; R.curW = -1; R.killSrc = "feu";
        R.P.foes.each(f=>{ if(Math.hypot(f.x - z.x, f.y - z.y) < z.r + f.r * 0.5) brHit(R, f, 8 + R.t / 15, "#ff8a3d", 0, 0, 0); });
        R.killSrc = null;
        if(R.rng() < 0.6) brDecal(R, "scorch", z.x + (R.rng() - .5) * z.r, z.y + (R.rng() - .5) * z.r, 18 + R.rng() * 14, 7);
      }
      if(z.burn <= 0){ z.k = "ash"; }
    }
  }
  /* les zones mortes sortent de leur morceau de carte */
  if(R.map.near.zones.some(z=>z.dead)){
    for(const ch of R.map.chunks.values()) if(ch.zones.some(z=>z.dead)) ch.zones = ch.zones.filter(z=>!z.dead);
    R.map.near.zones = R.map.near.zones.filter(z=>!z.dead);
  }
}
/* le terrain sous l'Archiviste : la glace porte, la lave figee ne brule plus */
function brTerrainUnder(R){
  let ice = false, cooled = false;
  for(const z of R.map.near.zones){
    const d = Math.hypot(R.x - z.x, R.y - z.y);
    if(d > z.r) continue;
    if(z.k === "ice") ice = true;
    if(z.k === "lava" && z.cooled > 0) cooled = true;
  }
  return {ice, cooled};
}

/* ============================================================
   4. LE BANDEAU DU SYSTÈME
   ============================================================ */
function brTicker(R, txt, color){
  R.tick = R.tick || [];
  if(R.tick.length > 4) R.tick.shift();
  R.tick.push({txt, color: color || "#35f0d6"});
}
function brTickerUpdate(R, dt){
  const el = document.getElementById("br-ticker");
  if(!el) return;
  R.tickT = (R.tickT || 0) - dt;
  if(R.tickT > 0 || !R.tick || !R.tick.length) return;
  const m = R.tick.shift();
  R.tickT = 3.2;
  el.innerHTML = `<span style="color:${m.color}">▸ ${esc(m.txt)}</span>`;
  el.className = "br-ticker on";
  const sp = el.firstElementChild;
  if(sp && sp.style){ void el.offsetWidth; sp.style.animation = "brTick 3.2s linear forwards"; }
}
function brKillMilestones(R){
  for(const n of [100, 250, 500, 1000, 2000, 4000])
    if(R.kills >= n && !(R.mile || {})[n]){ R.mile = R.mile || {}; R.mile[n] = true; brTicker(R, `${fmt(n)} K.O. — LA HORDE RECULE`, "#ffd24a"); }
  if(R.hp < R.maxHp * 0.25 && !R.lowWarn){ R.lowWarn = true; brTicker(R, "INTÉGRITÉ DE L'ARCHIVISTE CRITIQUE", "#ff3d7f"); }
  if(R.hp > R.maxHp * 0.6) R.lowWarn = false;
}

/* ============================================================
   5. LES DANGERS S'ANNONCENT — tireurs, élites, alpha
   ============================================================ */
function brEliteTick(R, f, dt){
  /* l'elite frappe le sol : un cercle s'allume, puis l'onde part */
  if(f.elite && !f.boss){
    f.slamT = (f.slamT === undefined ? 4 + R.rng() * 2 : f.slamT) - dt;
    if(f.slamT <= 0 && Math.hypot(R.x - f.x, R.y - f.y) < 260){
      f.slamT = 5 + R.rng() * 2;
      brZone(R, {k:"warn", x:f.x, y:f.y, r:76, life:0.9, max:0.9, delay:0, dmg:f.dmg * 1.4, color:"#ff3d7f", boss:true});
    }
  }
  /* l'alpha charge : une ligne s'allume, puis il fonce */
  if(f.big){
    if(f.dash){
      f.dash.t -= dt;
      if(f.dash.t <= 0){ f.x += f.dash.vx * dt; f.y += f.dash.vy * dt; f.dash.go -= dt;
        if(f.dash.go <= 0){ f.dash = null; brDecal(R, "crack", f.x, f.y, 34); } }
      return true;
    }
    f.chargeT = (f.chargeT === undefined ? 3.5 : f.chargeT) - dt;
    if(f.chargeT <= 0){
      f.chargeT = 4 + R.rng() * 2;
      const dx = R.x - f.x, dy = R.y - f.y, d = Math.hypot(dx, dy) || 1;
      f.dash = {t:0.7, go:0.5, vx:dx / d * 430, vy:dy / d * 430};
      Object.assign(brFxNew(R), {k:"warnline", x:f.x, y:f.y, a:Math.atan2(dy, dx), len:240, w:f.r, life:0.7, max:0.7, color:"#ff3d7f"});
      return true;
    }
  }
  return false;
}

/* ============================================================
   6. LES BOSS — chacun sa manière de se battre
   ============================================================ */
const BR_KIT_BY_TYPE = {
  15:["iceField","shardRing","charge"], 13:["thunderChase","salvo","charge"], 10:["fireWall","eruptions","charge"],
  11:["tide","salvo","circles"], 5:["burrow","eruptions","salvo"], 6:["burrow","eruptions","charge"],
  14:["grab","orbBarrage","circles"], 16:["diveCharges","meteor","salvo"], 3:["diveCharges","meteor","circles"],
  9:["laserSweep","shardRing","charge"], 12:["vines","salvo","circles"], 8:["orbBarrage","grab","circles"],
  17:["orbBarrage","thunderChase","charge"], 7:["salvo","vines","charge"]
};
function brBossKit(b){
  const t = POKE[b.id].types;
  return BR_KIT_BY_TYPE[t[0]] || BR_KIT_BY_TYPE[t[1]] || ["circles","charge","salvo"];
}
function brLater(b, R, delay, fn){ (b.q = b.q || []).push({at:R.t + delay, fn}); }
function brBossQueue(R, b){
  if(!b.q || !b.q.length) return;
  const now = R.t, keep = [];
  for(const it of b.q){ if(it.at <= now) it.fn(); else keep.push(it); }
  b.q = keep;
}
function brWarn(R, x, y, r, life, dmg, color, after){
  const z = brZone(R, {k:"warn", x, y, r, life, max:life, delay:0, dmg, color, boss:true});
  z.after = after || null;
  return z;
}
function brSalvo(R, b, n, speed, color, off){
  for(let k = 0; k < n; k++){
    const a = (off || 0) + k / n * Math.PI * 2;
    const s = brShot(R, b.x, b.y, Math.cos(a) * speed, Math.sin(a) * speed, {dmg:b.dmg * 0.55, r:9, color, life:3, kind:"enemy", pierce:1, w:-1});
    s.enemy = true;
  }
}
const BR_PATTERNS = {
  circles(R, b, enr, C){ for(let k = 0; k < (enr ? 5 : 3); k++) brWarn(R, R.x + (R.rng() - .5) * 180, R.y + (R.rng() - .5) * 180, 46, 1.1 + k * 0.15, b.dmg, C); },
  charge(R, b, enr){
    const dx = R.x - b.x, dy = R.y - b.y, d = Math.hypot(dx, dy) || 1;
    b.charge = {t:0.75, go:0.55, vx:dx / d * 520, vy:dy / d * 520};
    Object.assign(brFxNew(R), {k:"warnline", x:b.x, y:b.y, a:Math.atan2(dy, dx), len:420, w:b.r, life:0.75, max:0.75, color:"#ff3d7f"});
  },
  salvo(R, b, enr, C){ brSalvo(R, b, enr ? 18 : 12, 170, C, b.pattern * 0.3); },
  /* Glace : le sol gele et ralentit */
  iceField(R, b, enr){
    for(let k = 0; k < (enr ? 5 : 3); k++){
      const x = R.x + (R.rng() - .5) * 200, y = R.y + (R.rng() - .5) * 200;
      brWarn(R, x, y, 62, 1.0 + k * 0.12, b.dmg * 0.8, "#aef4ff", ()=>{
        brDecal(R, "frost", x, y, 62, 6);
        (R.hazards = R.hazards || []).push({k:"chill", x, y, r:62, life:4});
      });
    }
    brTicker(R, "LE SOL GÈLE", "#aef4ff");
  },
  shardRing(R, b, enr){ brSalvo(R, b, 16, 150, "#aef4ff", 0); brLater(b, R, 0.4, ()=>brSalvo(R, b, 16, 150, "#aef4ff", 0.2)); },
  /* Electrik : la foudre poursuit l'Archiviste */
  thunderChase(R, b, enr){
    for(let k = 0; k < (enr ? 7 : 5); k++) brLater(b, R, k * 0.32, ()=>{
      const x = R.x, y = R.y;
      brWarn(R, x, y, 40, 0.7, b.dmg * 0.8, "#ffe45e", ()=>{ brDecal(R, "spark", x, y, 34, 6);
        Object.assign(brFxNew(R), {k:"bolt", pts:[{x, y:y - 400}, {x, y}], life:0.2, max:0.2, color:"#ffe45e"}); });
    });
    brTicker(R, "LA FOUDRE VOUS TRAQUE", "#ffe45e");
  },
  /* Feu : un mur de flammes balaie la zone */
  fireWall(R, b, enr){
    const dx = R.x - b.x, dy = R.y - b.y, d = Math.hypot(dx, dy) || 1, px = -dy / d, py = dx / d;
    const n = enr ? 9 : 7;
    for(let k = 0; k < n; k++){
      const o = (k - (n - 1) / 2) * 44;
      brLater(b, R, k * 0.08, ()=>{ const x = R.x + px * o, y = R.y + py * o;
        brWarn(R, x, y, 34, 0.8, b.dmg * 0.7, "#ff8a3d", ()=>brDecal(R, "scorch", x, y, 36, 8)); });
    }
  },
  eruptions(R, b, enr){
    for(let k = 0; k < (enr ? 8 : 6); k++){
      const x = R.x + (R.rng() - .5) * 260, y = R.y + (R.rng() - .5) * 260;
      brWarn(R, x, y, 50, 0.9 + k * 0.1, b.dmg, "#ff6a1a", ()=>{ brDecal(R, "crater", x, y, 50); brBurst(R, x, y, "#ffb35c", 14, 200, 0.5); });
    }
  },
  /* Eau : une vague traverse l'arene */
  tide(R, b, enr){
    const a = Math.atan2(R.y - b.y, R.x - b.x);
    Object.assign(brFxNew(R), {k:"warnline", x:b.x, y:b.y, a, len:500, w:110, life:0.7, max:0.7, color:"#4fb2ff"});
    brLater(b, R, 0.7, ()=>(R.hazards = R.hazards || []).push({k:"wave", x:b.x, y:b.y, a, span:230, life:2.2, dmg:b.dmg, hit:false}));
    brTicker(R, "UNE VAGUE DÉFERLE", "#4fb2ff");
  },
  /* Sol, Roche : il s'enterre, vous suit sous terre, et jaillit */
  burrow(R, b, enr){
    b.under = 2.2 + (enr ? 0 : 0.4);
    brBurst(R, b.x, b.y, "#c9a86a", 22, 180, 0.5);
    brTicker(R, "IL S'ENFOUIT SOUS L'ARÈNE", "#e0b46a");
  },
  /* Psy : il vous attire, puis vous noie sous les orbes */
  grab(R, b, enr){
    Object.assign(brFxNew(R), {k:"tether", x:b.x, y:b.y, life:0.5, max:0.5, color:"#c878ff"});
    brLater(b, R, 0.5, ()=>{ b.pull = 1.1; });
    brLater(b, R, 1.7, ()=>BR_PATTERNS.orbBarrage(R, b, enr));
  },
  orbBarrage(R, b, enr){
    for(let k = 0; k < (enr ? 12 : 9); k++) brLater(b, R, k * 0.13, ()=>{
      for(let arm = 0; arm < 3; arm++){
        const a = k * 0.45 + arm * Math.PI * 2 / 3;
        const s = brShot(R, b.x, b.y, Math.cos(a) * 160, Math.sin(a) * 160, {dmg:b.dmg * 0.45, r:8, color:"#c878ff", life:3, kind:"enemy", pierce:1, w:-1});
        s.enemy = true;
      }
    });
  },
  /* Dragon, Vol : trois piques successifs */
  diveCharges(R, b, enr){ for(let k = 0; k < (enr ? 4 : 3); k++) brLater(b, R, k * 1.15, ()=>BR_PATTERNS.charge(R, b, enr)); },
  meteor(R, b, enr){
    for(let k = 0; k < (enr ? 9 : 6); k++) brLater(b, R, k * 0.18, ()=>{
      const x = R.x + (R.rng() - .5) * 220, y = R.y + (R.rng() - .5) * 220;
      brWarn(R, x, y, 54, 0.9, b.dmg, "#8a6bff", ()=>brDecal(R, "crater", x, y, 54));
    });
    brTicker(R, "LE CIEL S'EFFONDRE", "#8a6bff");
  },
  /* Acier : un laser tournant */
  laserSweep(R, b, enr){
    const a0 = Math.atan2(R.y - b.y, R.x - b.x) - 1.05;
    Object.assign(brFxNew(R), {k:"warnline", x:b.x, y:b.y, a:a0, len:460, w:14, life:0.7, max:0.7, color:"#c7d2e0"});
    brLater(b, R, 0.7, ()=>(R.hazards = R.hazards || []).push({k:"laser", a0, arc:enr ? 3.1 : 2.1, life:1.3, max:1.3, len:460, dmg:b.dmg, hit:false, boss:b}));
  },
  /* Plante : des ronces qui ralentissent */
  vines(R, b, enr){
    for(let k = 0; k < (enr ? 6 : 4); k++){
      const x = R.x + (R.rng() - .5) * 220, y = R.y + (R.rng() - .5) * 220;
      brWarn(R, x, y, 54, 1.0, b.dmg * 0.7, "#5ce07a", ()=>{ brDecal(R, "moss", x, y, 54, 6); (R.hazards = R.hazards || []).push({k:"chill", x, y, r:54, life:4, green:true}); });
    }
  }
};
/* l'IA du boss : son jeu d'attaques, ses phases, et l'etat enterre */
function brBossKitTick(R, b, dt){
  brBossQueue(R, b);
  if(b.pull > 0){
    b.pull -= dt;
    if(R.turbo <= 0){ const dx = b.x - R.x, dy = b.y - R.y, d = Math.hypot(dx, dy) || 1; if(d > 70){ R.x += dx / d * 150 * dt; R.y += dy / d * 150 * dt; } }
  }
  if(b.under > 0){
    b.under -= dt;
    const dx = R.x - b.x, dy = R.y - b.y, d = Math.hypot(dx, dy) || 1;
    b.x += dx / d * 170 * dt; b.y += dy / d * 170 * dt;
    b.crackT = (b.crackT || 0) - dt;
    if(b.crackT <= 0){ b.crackT = 0.12; brDecal(R, "crack", b.x, b.y, 26, 5); }
    if(b.under <= 0){
      const x = b.x, y = b.y;
      brWarn(R, x, y, 78, 0.75, b.dmg * 1.3, "#e0b46a", ()=>{ brDecal(R, "crater", x, y, 80); brBurst(R, x, y, "#c9a86a", 40, 260, 0.6); brShake(R, 9); b.surfacing = 0; });
      b.surfacing = 0.75;
    }
    return true;
  }
  if(b.surfacing > 0){ b.surfacing -= dt; return true; }
  const enr = b.hp < b.max * 0.4;
  if(enr && !b.enrNews){ b.enrNews = true; brTicker(R, "LE GARDIEN S'EMBALLE", "#ff3d7f"); }
  return false;
}
function brBossPattern(R, b, enr){
  const kit = brBossKit(b), C = BR_ARCH[POKE[b.id].types[0]].c;
  const k = kit[b.pattern++ % kit.length];
  (BR_PATTERNS[k] || BR_PATTERNS.circles)(R, b, enr, C);
  return k;
}
/* dangers persistants : sols geles, vagues, lasers */
function brHazardsTick(R, dt){
  if(!R.hazards || !R.hazards.length) return;
  for(const h of R.hazards){
    h.life -= dt;
    if(h.k === "chill"){ if(Math.hypot(R.x - h.x, R.y - h.y) < h.r) R.chilled = 0.1; }
    if(h.k === "wave"){
      const cx = Math.cos(h.a), cy = Math.sin(h.a);
      h.x += cx * 300 * dt; h.y += cy * 300 * dt;
      const rx = R.x - h.x, ry = R.y - h.y, along = rx * cx + ry * cy, side = -rx * cy + ry * cx;
      if(!h.hit && Math.abs(along) < 26 && Math.abs(side) < h.span / 2 && R.inv <= 0 && brTakeHit(R, h.dmg, null)){ h.hit = true; R.inv = 0.6; R.hurt = 0.3; R.x += cx * 60; R.y += cy * 60; }
      if(R.rng() < 0.5) brDecal(R, "puddle", h.x + (R.rng() - .5) * h.span * -cy, h.y + (R.rng() - .5) * h.span * cx, 22, 3);
    }
    /* l'Ultralaser de Porygon-Z : un seul coup, très large */
    if(h.k === "bigbeam"){
      const cx = Math.cos(h.a), cy = Math.sin(h.a), rx = R.x - h.x, ry = R.y - h.y, along = rx * cx + ry * cy;
      if(!h.hit && along > 0 && along < h.len && Math.abs(rx * cy - ry * cx) < h.w && R.inv <= 0 && brTakeHit(R, h.dmg, null)){ h.hit = true; R.inv = 0.7; R.hurt = 0.4; }
      R.curW = -1;
      if(!h.foesHit){ h.foesHit = true; R.P.foes.each(f=>{ if(f.boss) return; const fx = f.x - h.x, fy = f.y - h.y, al = fx * cx + fy * cy;
        if(al > 0 && al < h.len && Math.abs(fx * cy - fy * cx) < h.w + f.r) brHit(R, f, 9999, "#ff3d7f", cx, cy, 300); }); }
    }
    if(h.k === "laser" && h.boss && h.boss.on){
      const a = h.a0 + h.arc * (1 - Math.max(0, h.life) / h.max); h.cur = a; h.x = h.boss.x; h.y = h.boss.y;
      const cx = Math.cos(a), cy = Math.sin(a), rx = R.x - h.x, ry = R.y - h.y, along = rx * cx + ry * cy;
      if(!h.hit && along > 0 && along < h.len && Math.abs(rx * cy - ry * cx) < 18 && R.inv <= 0 && brTakeHit(R, h.dmg, null)){ h.hit = true; R.inv = 0.6; R.hurt = 0.3; }
    }
  }
  R.hazards = R.hazards.filter(h=>h.life > 0);
}
function brDrawHazards(x, R, X, Y){
  if(!R.hazards) return;
  for(const h of R.hazards){
    if(h.k === "chill"){ x.globalAlpha = Math.min(0.35, h.life * 0.2); x.fillStyle = h.green ? "#3a8a3a" : "#bff4ff";
      x.beginPath(); x.arc(X(h.x), Y(h.y), h.r, 0, 7); x.fill(); x.globalAlpha = 1; }
    if(h.k === "wave"){ x.save(); x.translate(X(h.x), Y(h.y)); x.rotate(h.a);
      x.globalAlpha = 0.6; x.fillStyle = "#3a8bff"; x.fillRect(-20, -h.span / 2, 40, h.span);
      x.globalAlpha = 0.95; x.fillStyle = "#e8fbff"; x.fillRect(12, -h.span / 2, 8, h.span); x.restore(); x.globalAlpha = 1; }
    if(h.k === "bigbeam"){ const k = Math.max(0, h.life) / h.max; x.save(); x.translate(X(h.x), Y(h.y)); x.rotate(h.a);
      x.globalCompositeOperation = "lighter"; x.globalAlpha = k; x.fillStyle = "#ff3d7f"; x.fillRect(0, -h.w * (0.6 + k * 0.4), h.len, h.w * 2 * (0.6 + k * 0.4));
      x.fillStyle = "#ffd0e0"; x.fillRect(0, -h.w * 0.45 * k, h.len, h.w * 0.9 * k); x.fillStyle = "#ffffff"; x.fillRect(0, -h.w * 0.15, h.len, h.w * 0.3);
      x.restore(); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
    if(h.k === "laser" && h.cur !== undefined){ x.save(); x.translate(X(h.x), Y(h.y)); x.rotate(h.cur);
      x.globalCompositeOperation = "lighter"; x.fillStyle = h.col || "#c7d2e0"; x.globalAlpha = 0.85; x.fillRect(0, -9, h.len, 18);
      x.fillStyle = "#ffffff"; x.fillRect(0, -3, h.len, 6); x.restore(); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
  }
}
/* le boss enterre : seule une butte de terre se deplace */
function brDrawBurrow(x, R, b, bx, by){
  x.fillStyle = "rgba(70,50,30,.85)"; x.beginPath(); x.ellipse(bx, by, 34, 16, 0, 0, 7); x.fill();
  x.fillStyle = "rgba(140,110,70,.9)"; x.beginPath(); x.ellipse(bx, by - 4, 24, 9, 0, 0, 7); x.fill();
  for(let i = 0; i < 4; i++){ x.fillStyle = "#8a7050"; x.fillRect(bx + (R.rng() - .5) * 50, by + (R.rng() - .5) * 20, 3, 3); }
}
