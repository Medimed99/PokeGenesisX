/* ============================================================
   57 — LA BRÈCHE · LA PARTIE
   ============================================================ */
const BR_RUN_SEC = 480;                 /* le boss se montre a 8 minutes */
const BR_REGION_MULT = {kanto:1, johto:1.45, hoenn:2.0};
let BR = null;                          /* la run en cours */

function brXpNeed(L){ return Math.round(4 + L * 5 + Math.pow(L, 1.45) * 1.4); }

function brNewRun(opts){
  const U = (S.breche && S.breche.upg) || {};
  const seed = opts.seed || ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  const R = {
    seed, rng: brRng(seed), daily: !!opts.daily, region: opts.region, hab: opts.hab,
    mod: opts.mod || null,
    P: brNewPools(), grid: new Map(),
    t: 0, spawnAcc: 0, nextElite: 60, nextMini: 240, bossAt: BR_RUN_SEC, bossOn: false, bossDown: false, endless: false,
    x: 0, y: 0, face: 1, trail: [], vx: 0, vy: 0,
    maxHp: 150 * (1 + 0.10 * (U.hp || 0)), hp: 0, inv: 0,
    lv: 1, xp: 0, need: brXpNeed(1),
    team: [{id: opts.starter, lv: 1, stage: 0, cd: 0.4, orb: 0}],
    items: {}, mods: null,
    kills: 0, killsBy: {}, dmgBy: {}, curW: 0, elitesDown: [],
    chestsPending: 0, pendingLevels: 0, rerolls: U.reroll || 0, revive: U.revive ? 1 : 0,
    shake: 0, hitstop: 0, slowmo: 0, banner: null, over: false, won: false,
    boss: null, guardian: opts.guardian || null, discovered: [],
    firstRun: !(S.breche && S.breche.runs)
  };
  R.hp = R.maxHp;
  brRecomputeMods(R);
  brMapInit(R);
  R.missions = brMissionsFor(R);
  return R;
}

/* ============================================================
   BOUCLE
   ============================================================ */
function brStart(R){
  BR = R;
  const box = document.getElementById("breche");
  if(!box) return;
  box.className = "on";
  box.innerHTML = brShellHtml();
  const cv = document.getElementById("br-cv");
  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    R.dpr = dpr; R.W = cv.clientWidth; R.H = cv.clientHeight;
  };
  fit();
  R.fit = fit;
  window.addEventListener("resize", fit);
  brInput(R, cv);
  brHud(R);
  R.last = performance.now();
  R.paused = false;
  const loop = now => {
    if(BR !== R) return;
    let dt = Math.min(0.05, (now - R.last) / 1000);
    R.last = now;
    /* pause automatique : tant qu'un choix, un coffre ou une evolution est a
       l'ecran, la partie est figee. On ne se fait plus frapper en choisissant. */
    if(R.modal) R.shake = 0;
    if(!R.paused && !R.over && !R.modal){
      if(R.hitstop > 0){ R.hitstop -= dt; dt = 0; }
      if(R.slowmo > 0){ R.slowmo -= dt; dt *= 0.25; }
      brUpdate(R, dt);
    }
    brRender(R, cv);
    R.raf = requestAnimationFrame(loop);
  };
  R.raf = requestAnimationFrame(loop);
  /* l'onglet cache met la partie en pause : rien ne se perd dans le metro */
  R.onVis = () => { if(document.hidden && !R.over) brPause(true); };
  document.addEventListener("visibilitychange", R.onVis);
}
function brStop(){
  if(!BR) return;
  cancelAnimationFrame(BR.raf);
  window.removeEventListener("resize", BR.fit);
  document.removeEventListener("visibilitychange", BR.onVis);
  const box = document.getElementById("breche");
  if(box){ box.className = ""; box.innerHTML = ""; }
  BR = null;
}

/* ============================================================
   COMMANDES — un pouce, n'importe ou dans la moitie basse
   ============================================================ */
function brInput(R, cv){
  R.joy = null; R.keys = {};
  const stick = document.getElementById("br-stick");
  const down = e => {
    if(R.paused || R.over) return;
    const rect = cv.getBoundingClientRect();
    R.joy = {ox: e.clientX - rect.left, oy: e.clientY - rect.top, dx: 0, dy: 0, id: e.pointerId};
    stick.style.left = R.joy.ox + "px"; stick.style.top = R.joy.oy + "px";
    stick.className = "on";
    try { cv.setPointerCapture(e.pointerId); } catch(err){}
    if(R.hint){ R.hint = 0; }
  };
  const move = e => {
    if(!R.joy || e.pointerId !== R.joy.id) return;
    const rect = cv.getBoundingClientRect();
    let dx = e.clientX - rect.left - R.joy.ox, dy = e.clientY - rect.top - R.joy.oy;
    const d = Math.hypot(dx, dy), m = 42;
    if(d > m){ dx = dx / d * m; dy = dy / d * m; }
    R.joy.dx = dx / m; R.joy.dy = dy / m;
    const k = stick.firstElementChild; if(k) k.style.transform = `translate(${dx}px,${dy}px)`;
  };
  const up = e => {
    if(!R.joy || e.pointerId !== R.joy.id) return;
    R.joy = null; stick.className = "";
    const k = stick.firstElementChild; if(k) k.style.transform = "";
  };
  cv.addEventListener("pointerdown", down);
  cv.addEventListener("pointermove", move);
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
  R.onKey = e => {
    const k = e.key.toLowerCase();
    R.keys[k] = e.type === "keydown";
    if(e.type === "keydown" && (k === "escape" || k === "p")) brPause(!R.paused);
  };
  window.addEventListener("keydown", R.onKey);
  window.addEventListener("keyup", R.onKey);
}
function brDir(R){
  let dx = 0, dy = 0;
  const K = R.keys;
  if(K.arrowleft || K.q || K.a) dx -= 1;
  if(K.arrowright || K.d) dx += 1;
  if(K.arrowup || K.z || K.w) dy -= 1;
  if(K.arrowdown || K.s) dy += 1;
  if(R.joy){ dx = R.joy.dx; dy = R.joy.dy; }
  const m = Math.hypot(dx, dy);
  if(m > 1){ dx /= m; dy /= m; }
  return [dx, dy];
}

/* ============================================================
   MISE À JOUR
   ============================================================ */
function brUpdate(R, dt){
  R.t += dt;
  /* --- l'Archiviste --- */
  brMapPre(R, dt);
  const [dx, dy] = brDir(R);
  const spd = 118 * R.mods.speed * (R.turbo > 0 ? 3 : 1) * (R.terrainMul || 1);
  R.vx = dx * spd; R.vy = dy * spd;
  R.x += R.vx * dt; R.y += R.vy * dt;
  if(dx) R.face = dx < 0 ? -1 : 1;
  /* la file de l'equipe suit le chemin exact du chef de file */
  const last = R.trail[0];
  if(!last || Math.hypot(last.x - R.x, last.y - R.y) > 3){ R.trail.unshift({x:R.x, y:R.y}); if(R.trail.length > 120) R.trail.pop(); }
  if(R.inv > 0) R.inv -= dt;
  if(R.mods.regen) R.hp = Math.min(R.maxHp, R.hp + R.mods.regen * dt);
  R.shake = Math.max(0, R.shake - dt * 30);

  brSpawn(R, dt);
  brGrid(R);
  brFoes(R, dt);
  brMapPost(R, dt);
  brWeapons(R, dt);
  brShots(R, dt);
  brZones(R, dt);
  brGems(R, dt);
  brParts(R, dt);
  if(R.boss) brBossAI(R, dt);
  if(R.reaper && R.reaper.on) brReaperAI(R, R.reaper, dt);
  brBossHazards(R, dt);
  brPicks(R, dt);
  brDepthTick(R);

  /* les recompenses attendent un moment calme : jamais pendant une frappe */
  if(R.pendingLevels > 0 && !R.modal){ R.pendingLevels--; brLevelUp(R); }
  else if(R.chestsPending > 0 && !R.modal){ R.chestsPending--; brChest(R); }

  if(!R.bossOn && !R.endless && R.t >= R.bossAt) brSummonBoss(R);
  if(R.hp <= 0 && !R.over) brDeath(R);
  if(R.hudT === undefined || (R.hudT -= dt) <= 0){ R.hudT = 0.1; brHudTick(R); }
}

/* ---------- apparition des ennemis ---------- */
function brSpecies(R){
  if(!R.pool){
    const r = regionDef(R.region), h = HABITATS[R.hab];
    const all = [], match = [];
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || p.leg || isExclusive(i)) continue;
      all.push(i);
      if(h && p.types.some(t=>h.types.includes(t))) match.push(i);
    }
    R.pool = {all, match: match.length > 8 ? match : all};
  }
  /* l'habitat donne le ton : deux ennemis sur trois viennent de ses types */
  const src = R.rng() < 0.68 ? R.pool.match : R.pool.all;
  /* au debut, des formes de base ; plus tard, des formes evoluees */
  for(let k = 0; k < 6; k++){
    const id = src[Math.floor(R.rng() * src.length)];
    const st = stageOf(id);
    if(R.t < 90 && st > 0) continue;
    if(R.t < 220 && st > 1) continue;
    return id;
  }
  return src[Math.floor(R.rng() * src.length)];
}
function brFoeHp(R, id, mult){
  const rm = BR_REGION_MULT[R.region] || 1;
  const grow = Math.pow(1 + R.t / 70, 1.3) * (R.endless ? Math.pow(1.3, R.depth || 0) : 1);
  return Math.round(7 * grow * rm * (0.6 + POKE[id].bst / 520) * (mult || 1) * (R.mod === "fort" ? 1.25 : 1));
}
function brSpawnFoe(R, id, kind){
  const f = R.P.foes.get();
  const a = R.rng() * Math.PI * 2, d = Math.max(R.W, R.H) * 0.62 + 40;
  f.x = R.x + Math.cos(a) * d; f.y = R.y + Math.sin(a) * d;
  f.id = id; f.elite = kind === "elite"; f.big = kind === "mini"; f.boss = kind === "boss";
  f.size = f.boss ? 128 : f.big ? 96 : f.elite ? 66 : 44;
  f.r = f.size * 0.32;
  const mult = f.boss ? 0 : f.big ? 45 : f.elite ? 14 : 1;
  f.max = f.hp = f.boss ? 0 : brFoeHp(R, id, mult);
  f.spd = (f.elite ? 40 : f.big ? 36 : 42 + R.rng() * 14) * (1 + Math.min(0.4, R.t / 900)) * (R.mod === "vif" ? 1.2 : 1);
  f.dmg = (R.endless ? Math.pow(1.12, R.depth || 0) : 1) * (4 + R.t / 80) * (f.elite ? 1.6 : f.big ? 2.2 : 1) * (BR_REGION_MULT[R.region] || 1) ** 0.5;
  f.flash = 0; f.kx = 0; f.ky = 0; f.slow = 0; f.dot = 0; f.dotAcc = 0; f.phase = R.rng() * 6;
  f.charge = null; f.atk = 0; f.pattern = 0;
  f.shiny = !f.boss && R.rng() < (f.elite ? 1/180 : 1/2500) * (typeof charmMul === "function" ? charmMul() : 1);
  f.echo = false; f.reaper = false; f.minion = false;
  brShapeFoe(R, f, ["shooter","rusher","armored","splitter","split"].includes(kind) ? kind : "n");
  return f;
}
function brSpawn(R, dt){
  if(R.bossOn && !R.endless) return brSpawnTrickle(R, dt);
  /* densite : monte tout le long, avec des vagues toutes les 60 s */
  /* la horde : quelques ennemis au debut, une maree a la fin */
  const wave = (R.t % 60) > 50 ? 1.8 : 1;
  const rate = (1.2 + R.t * 0.035 + (R.endless ? (R.depth || 0) * 1.4 : 0)) * wave * (R.mod === "horde" ? 1.5 : 1);
  R.spawnAcc += rate * dt;
  const cap = 230;
  /* encerclement : toutes les 45 s, un cercle complet se referme sur l'Archiviste */
  if(R.t >= (R.nextRing || 60)){
    R.nextRing = (R.nextRing || 60) + 45;
    const n = 18 + Math.min(30, Math.floor(R.t / 20)), id = brSpecies(R), rad = Math.max(R.W, R.H) * 0.48;
    for(let k = 0; k < n; k++){
      const f = brSpawnFoe(R, id, "n"), a = k / n * Math.PI * 2;
      f.x = R.x + Math.cos(a) * rad; f.y = R.y + Math.sin(a) * rad;
    }
    brBanner(R, "ENCERCLEMENT", "#b06bff");
  }
  let alive = 0; R.P.foes.each(()=>alive++);
  while(R.spawnAcc >= 1){
    R.spawnAcc -= 1;
    if(alive++ < cap) brSpawnFoe(R, brSpecies(R), brRollKind(R));
  }
  if(R.t >= R.nextElite){ R.nextElite += 60; brSpawnFoe(R, brSpecies(R), "elite"); brBanner(R, "ÉLITE CORROMPU", "#ff3d7f"); }
  if(R.t >= R.nextMini && R.nextMini < R.bossAt){ R.nextMini += 9999; brSpawnFoe(R, brSpecies(R), "mini"); brBanner(R, "UN ALPHA APPROCHE", "#ffb35c"); brShake(R, 6); }
}
function brSpawnTrickle(R, dt){
  R.spawnAcc += 0.8 * dt;
  while(R.spawnAcc >= 1){ R.spawnAcc -= 1; brSpawnFoe(R, brSpecies(R), "n"); }
}

/* ---------- ennemis ---------- */
function brFoes(R, dt){
  R.P.foes.each(f=>{
    if(f.hp <= 0){ f.on = false; return; }
    if(f.flash > 0) f.flash -= dt;
    if(f.vuln > 0) f.vuln -= dt;
    if(f.burn > 0) f.burn -= dt;
    if(f.psn > 0) f.psn -= dt;
    if(f.dot > 0){ f.dot -= dt; f.dotAcc = (f.dotAcc || 0) + dt; if(f.dotAcc > 0.5){ f.dotAcc = 0; R.curW = -1; brHit(R, f, f.dotDmg, f.burn > 0 ? "#ff8a3d" : "#b86bff"); if(!f.on) return; } }
    if(f.boss || f.reaper) return;          /* ils ont leur propre IA */
    const dx = R.x - f.x, dy = R.y - f.y, d = Math.hypot(dx, dy) || 1;
    if(f.stun > 0) f.stun -= dt;
    else if(!(f.kind !== "n" && brFoeAI(R, f, dt))){
      const sp = f.spd * (f.slow > 0 ? 0.5 : 1) * (f.wet > 0 ? 0.75 : 1);
      if(f.wet > 0) f.wet -= dt;
      f.x += (dx / d * sp + f.kx) * dt; f.y += (dy / d * sp + f.ky) * dt;
      f.kx *= 0.86; f.ky *= 0.86;
    }
    if(!f.on) return;
    if(f.slow > 0) f.slow -= dt;
    /* trop loin derriere : on le replace devant, plutot que de le laisser errer */
    if(d > Math.max(R.W, R.H) * 1.1 && f.kind !== "nest"){ const a = Math.atan2(R.vy || 1, R.vx || 0) + (R.rng() - .5); const r2 = Math.max(R.W, R.H) * 0.6; f.x = R.x + Math.cos(a) * r2; f.y = R.y + Math.sin(a) * r2; }
    /* contact : le bouclier, le turbo et le Casque Brut passent par brTakeHit */
    if(d < f.r + 14 && R.inv <= 0 && f.kind !== "rusher" && f.kind !== "nest" && brTakeHit(R, f.dmg, f)){
      R.inv = 0.7; brShake(R, 4);
      try { buzz(15); } catch(e){}
      R.hurt = 0.25;
    }
  });
  /* separation legere : les ennemis ne s'empilent pas en un seul point */
  R.P.foes.each(f=>{
    if(f.boss || f.kind === "nest") return;
    brNear(R, f.x, f.y, f.r * 2, o=>{
      if(o === f) return;
      const dx = f.x - o.x, dy = f.y - o.y, d = Math.hypot(dx, dy) || 1, min = f.r + o.r;
      if(d < min){ const push = (min - d) * 0.25; f.x += dx / d * push; f.y += dy / d * push; }
    });
  });
}

/* ---------- armes ---------- */
function brMemberPos(R, i){
  if(i === 0) return {x:R.x, y:R.y};
  const p = R.trail[Math.min(R.trail.length - 1, i * 7)];
  return p || {x:R.x, y:R.y};
}
function brWeapons(R, dt){
  R.team.forEach((w, i)=>{
    R.curW = i;
    const st = brWeaponStats(w, R), pos = brMemberPos(R, i);
    if(st.k === "orbit"){ brOrbit(R, w, st, dt); return; }
    w.cd -= dt;
    if(w.cd > 0) return;
    w.cd = st.cd;
    brFire(R, w, st, pos);
  });
}
function brShot(R, x, y, vx, vy, o){
  const s = R.P.shots.get();
  s.x = x; s.y = y; s.vx = vx; s.vy = vy; s.hits.length = 0;
  Object.assign(s, {life:1.2, r:6, pierce:1, kind:"bolt", home:0, back:0, t:0, slow:0, lobTo:null, ox:x, oy:y,
                    enemy:false, area:0, w:0, color:"#fff", dmg:0, boom:0, stun:0, quake:false}, o);
  if(s.kind !== "enemy" && s.w >= 0 && s.pierce < 50) s.pierce += (R.mods.pierce || 0);
  return s;
}
function brFire(R, w, st, pos){
  const tgt = brNearest(R, pos.x, pos.y, 380);
  const ang = tgt ? Math.atan2(tgt.y - pos.y, tgt.x - pos.x) : (R.face > 0 ? 0 : Math.PI);
  const W = R.curW, C = st.color;
  switch(st.k){
    case "bolt":
      for(let k = 0; k < st.count; k++){ const a = ang + (k - (st.count - 1) / 2) * 0.16;
        brShot(R, pos.x, pos.y, Math.cos(a) * 330, Math.sin(a) * 330, {dmg:st.dmg, r:6 * st.area, color:C, w:W, boom: w.stage >= 2 ? 44 * st.area : 0}); }
      break;
    case "swarm":
      for(let k = 0; k < 3 + st.count * 2; k++){ const a = ang + (R.rng() - .5) * 1.1;
        brShot(R, pos.x, pos.y, Math.cos(a) * 380, Math.sin(a) * 380, {dmg:st.dmg, r:4, color:C, life:0.7, w:W, pierce: w.stage >= 2 ? 3 : 1}); }
      break;
    case "cone":
      for(let k = 0; k < 6 + st.count * 2; k++){ const a = ang + (R.rng() - .5) * 0.7; const sp = 220 + R.rng() * 120;
        brShot(R, pos.x, pos.y, Math.cos(a) * sp, Math.sin(a) * sp, {dmg:st.dmg, r:9 * st.area, color:C, life:0.42, kind:"flame", pierce:3, w:W}); }
      /* forme evoluee : le sol brule la ou les flammes retombent */
      if(w.stage >= 2 && tgt) brZone(R, {k:"puddle", x:tgt.x, y:tgt.y, r:40 * st.area, life:1.8, max:1.8, delay:0, dmg:st.dmg * 0.7, color:C, tick:0, w:W});
      break;
    case "blade":
      for(let k = 0; k < st.count; k++){ const a = ang + k * (Math.PI * 2 / st.count);
        brShot(R, pos.x, pos.y, Math.cos(a) * 300, Math.sin(a) * 300, {dmg:st.dmg, r:11 * st.area, color:C, life:1.6, kind:"blade", back:1, pierce:99, w:W}); }
      break;
    case "wisp":
      for(let k = 0; k < st.count; k++){ const a = ang + (R.rng() - .5) * 1.4;
        brShot(R, pos.x, pos.y, Math.cos(a) * 150, Math.sin(a) * 150, {dmg:st.dmg, r:(w.stage >= 2 ? 13 : 9) * st.area, color:C, life:2.4, kind:"wisp", home:1, pierce: w.stage >= 2 ? 10 : 4, w:W}); }
      break;
    case "shard":
      for(let k = 0; k < 3 + st.count; k++){ const a = ang + (k - (2 + st.count) / 2) * 0.2;
        brShot(R, pos.x, pos.y, Math.cos(a) * 360, Math.sin(a) * 360, {dmg:st.dmg, r:6, color:C, life:0.9, kind:"shard", slow:1.2, stun: w.stage >= 2 ? 0.6 : 0, w:W}); }
      break;
    case "lob":
      for(let k = 0; k < st.count; k++){
        const t = brNearest(R, pos.x + (R.rng() - .5) * 200, pos.y + (R.rng() - .5) * 200, 420) || tgt;
        if(!t) break;
        const s = brShot(R, pos.x, pos.y, 0, 0, {dmg:st.dmg, r:0, color:C, life:0.6, kind:"lob", pierce:0, w:W});
        s.lobTo = {x:t.x, y:t.y}; s.area = 48 * st.area; s.quake = w.stage >= 2;
      }
      break;
    case "punch": {
      const rad = 70 * st.area;
      brRing(R, pos.x, pos.y, rad, C, 0.25);
      if(w.stage >= 2) brZone(R, {k:"ring", x:pos.x, y:pos.y, r:10, maxr:rad * 2.4, life:0.5, max:0.5, delay:0, dmg:st.dmg * 0.6, color:C, hit:new Set(), quake:true, w:W});
      brNear(R, pos.x, pos.y, rad, f=>{ const dx = f.x - pos.x, dy = f.y - pos.y, d = Math.hypot(dx, dy) || 1;
        if(d < rad + f.r) brHit(R, f, st.dmg, C, dx / d, dy / d, 380); });
      break; }
    case "slash": {
      const rad = 95 * st.area;
      Object.assign(brFxNew(R), {k:"arc", x:pos.x, y:pos.y, a:ang, r:rad, life:0.22, max:0.22, color:C});
      brNear(R, pos.x, pos.y, rad, f=>{ const dx = f.x - pos.x, dy = f.y - pos.y, d = Math.hypot(dx, dy) || 1;
        let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da));
        if(d < rad + f.r && Math.abs(da) < 1.1) brHit(R, f, st.dmg, C, dx / d, dy / d, 200); });
      /* forme evoluee : un second croissant, dans le dos */
      if(w.stage >= 2){ const b2 = ang + Math.PI;
        Object.assign(brFxNew(R), {k:"arc", x:pos.x, y:pos.y, a:b2, r:rad, life:0.22, max:0.22, color:C});
        brNear(R, pos.x, pos.y, rad, f=>{ const dx = f.x - pos.x, dy = f.y - pos.y, d = Math.hypot(dx, dy) || 1;
          let da = Math.atan2(dy, dx) - b2; da = Math.atan2(Math.sin(da), Math.cos(da));
          if(d < rad + f.r && Math.abs(da) < 1.1) brHit(R, f, st.dmg, C, dx / d, dy / d, 200); }); }
      break; }
    case "wave": {
      for(let k = 0; k < Math.min(3, st.count); k++){
        brZone(R, {k:"ring", x:pos.x, y:pos.y, r:10, maxr:150 * st.area, life:0.8 + k * 0.15, max:0.8 + k * 0.15, delay:k * 0.18, dmg:st.dmg, color:C, hit:new Set(), w:W});
      }
      break; }
    case "quake": {
      brShake(R, 5);
      brZone(R, {k:"ring", x:R.x, y:R.y, r:10, maxr:230 * st.area, life:0.9, max:0.9, delay:0, dmg:st.dmg, color:C, hit:new Set(), quake:true, w:W, stun: w.stage >= 2});
      break; }
    case "puddle": case "seed":
      for(let k = 0; k < st.count; k++){
        const t = brNearest(R, pos.x + (R.rng() - .5) * 160, pos.y + (R.rng() - .5) * 160, 300);
        const zx = t ? t.x : pos.x + (R.rng() - .5) * 120, zy = t ? t.y : pos.y + (R.rng() - .5) * 120;
        brZone(R, {k:st.k, x:zx, y:zy, r:(st.k === "seed" ? 44 : 38) * st.area, life:3.2, max:3.2, delay:0, dmg:st.dmg, color:C, tick:0, w:W});
      }
      break;
    case "chain": {
      let from = pos, hit = new Set(), jumps = 3 + st.count * 2 + (w.stage >= 2 ? 6 : 0);
      const pts = [{x:pos.x, y:pos.y}];
      for(let j = 0; j < jumps; j++){
        let best = null, bd = 190 * 190 * st.area * st.area;
        R.P.foes.each(f=>{ if(f.hp <= 0 || hit.has(f)) return; const d = (f.x - from.x) ** 2 + (f.y - from.y) ** 2; if(d < bd){ bd = d; best = f; } });
        if(!best) break;
        hit.add(best); pts.push({x:best.x, y:best.y});
        brHit(R, best, st.dmg, C, 0, 0, 0); from = best;
      }
      if(pts.length > 1) Object.assign(brFxNew(R), {k:"bolt", pts, life:0.18, max:0.18, color:C});
      break; }
    case "beam": {
      /* forme evoluee : trois rayons en eventail */
      const len = 420 * st.area, wdt = 16 * st.area;
      const angs = w.stage >= 2 ? [ang - 0.35, ang, ang + 0.35] : [ang];
      for(const a2 of angs){
        Object.assign(brFxNew(R), {k:"beam", x:pos.x, y:pos.y, a:a2, len, w:wdt, life:0.32, max:0.32, color:C});
        const cx = Math.cos(a2), cy = Math.sin(a2);
        R.P.foes.each(f=>{ if(f.hp <= 0) return; const rx = f.x - pos.x, ry = f.y - pos.y, along = rx * cx + ry * cy;
          if(along < 0 || along > len) return; const perp = Math.abs(rx * cy - ry * cx);
          if(perp < wdt + f.r) brHit(R, f, st.dmg, C, cx, cy, 120); });
      }
      brShake(R, 2);
      break; }
    case "pulse": {
      R.hp = Math.min(R.maxHp, R.hp + 2 + w.lv);
      brRing(R, pos.x, pos.y, 120 * st.area, C, 0.35);
      brNear(R, pos.x, pos.y, 120 * st.area, f=>{ brHit(R, f, st.dmg, C, 0, 0, 0); if(w.stage >= 2 && !f.boss) f.stun = 0.7; });
      break; }
  }
}
function brFxNew(R){ const f = R.P.fx.get(); f.pts = []; f.a = 0; f.r = 0; f.len = 0; f.w = 0; return f; }
/* une zone recyclee repart de zero : sinon elle garde les drapeaux de la precedente */
function brZone(R, o){
  const z = R.P.zones.get();
  for(const k of ["k","x","y","r","maxr","life","max","delay","dmg","color","tick","w"]) z[k] = 0;
  z.boss = false; z.fired = false; z.quake = false; z.hit = null; z.stun = false;
  return Object.assign(z, o);
}
function brRing(R, x, y, r, color, life){ Object.assign(brFxNew(R), {k:"ring", x, y, r, life, max:life, color}); }
function brOrbit(R, w, st, dt){
  w.orb = (w.orb || 0) + dt * 2.6;
  const n = 1 + st.count, rad = 62 * st.area;
  w.orbPts = w.orbPts || [];
  w.orbPts.length = 0;
  w.hitCd = w.hitCd || new Map();
  for(let k = 0; k < n; k++){
    const a = w.orb + k * Math.PI * 2 / n;
    const ox = R.x + Math.cos(a) * rad, oy = R.y + Math.sin(a) * rad;
    w.orbPts.push({x:ox, y:oy});
    brNear(R, ox, oy, 18 * st.area, f=>{
      const last = w.hitCd.get(f) || 0;
      if(R.t - last < 0.45) return;
      w.hitCd.set(f, R.t);
      const dx = f.x - R.x, dy = f.y - R.y, d = Math.hypot(dx, dy) || 1;
      brHit(R, f, st.dmg, st.color, dx / d, dy / d, 160);
    });
  }
  if(w.hitCd.size > 300) w.hitCd.clear();
}

/* ---------- projectiles ---------- */
function brShots(R, dt){
  R.P.shots.each(s=>{
    s.t += dt; s.life -= dt;
    if(s.life <= 0){
      if(s.kind === "lob") brLobLand(R, s);
      s.on = false; return;
    }
    if(s.kind === "lob"){
      const k = 1 - s.life / 0.6;
      s.x = s.ox + (s.lobTo.x - s.ox) * k; s.y = s.oy + (s.lobTo.y - s.oy) * k - Math.sin(k * Math.PI) * 70;
      return;
    }
    if(s.home){
      const t = brNearest(R, s.x, s.y, 260);
      if(t){ const a = Math.atan2(t.y - s.y, t.x - s.x), sp = Math.hypot(s.vx, s.vy) + 60 * dt;
        const ca = Math.atan2(s.vy, s.vx); let da = Math.atan2(Math.sin(a - ca), Math.cos(a - ca));
        const na = ca + Math.max(-4 * dt, Math.min(4 * dt, da)); s.vx = Math.cos(na) * Math.min(260, sp); s.vy = Math.sin(na) * Math.min(260, sp); }
    }
    if(s.back && s.t > 0.55){
      const dx = R.x - s.x, dy = R.y - s.y, d = Math.hypot(dx, dy) || 1;
      s.vx += dx / d * 900 * dt; s.vy += dy / d * 900 * dt;
      if(d < 18 && s.t > 0.8){ s.on = false; return; }
    }
    s.x += s.vx * dt; s.y += s.vy * dt;
    if(s.enemy) return;
    const W = s.w;
    brNear(R, s.x, s.y, s.r + 30, f=>{
      if(!s.on || s.pierce <= 0 || s.hits.includes(f)) return;
      if(Math.hypot(f.x - s.x, f.y - s.y) > f.r + s.r) return;
      s.hits.push(f); s.pierce--;
      R.curW = W;
      const d = Math.hypot(s.vx, s.vy) || 1;
      brHit(R, f, s.dmg, s.color, s.vx / d, s.vy / d, s.kind === "flame" ? 40 : 120);
      if(s.slow) f.slow = s.slow;
      if(s.stun && !f.boss) f.stun = s.stun;
      if(s.boom){ const bx = s.x, by = s.y, br = s.boom; brRing(R, bx, by, br, s.color, 0.25);
        brNear(R, bx, by, br, o=>{ if(o !== f && Math.hypot(o.x - bx, o.y - by) < br + o.r) brHit(R, o, s.dmg * 0.6, s.color, 0, 0, 0); }); }
      if(s.pierce <= 0 && !s.back) s.on = false;
    });
  });
}
function brLobLand(R, s){
  R.curW = s.w;
  brRing(R, s.lobTo.x, s.lobTo.y, s.area, s.color, 0.3);
  brBurst(R, s.lobTo.x, s.lobTo.y, s.color, 10, 150, 0.4);
  brNear(R, s.lobTo.x, s.lobTo.y, s.area, f=>{
    const dx = f.x - s.lobTo.x, dy = f.y - s.lobTo.y, d = Math.hypot(dx, dy) || 1;
    if(d < s.area + f.r) brHit(R, f, s.dmg, s.color, dx / d, dy / d, 260);
  });
  if(s.quake) brZone(R, {k:"ring", x:s.lobTo.x, y:s.lobTo.y, r:10, maxr:s.area * 2.2, life:0.6, max:0.6, delay:0, dmg:s.dmg * 0.5, color:s.color, hit:new Set(), quake:true, w:s.w});
  brShake(R, 1.5);
}

/* ---------- zones ---------- */
function brZones(R, dt){
  R.P.zones.each(z=>{
    if(z.delay > 0){ z.delay -= dt; return; }
    z.life -= dt;
    if(z.boss){
      if(!z.fired && z.life <= 0.08){
        z.fired = true;
        brRing(R, z.x, z.y, z.r, z.color, 0.3); brShake(R, 3);
        if(Math.hypot(R.x - z.x, R.y - z.y) < z.r + 10 && R.inv <= 0 && brTakeHit(R, z.dmg, null)){ R.inv = 0.5; R.hurt = 0.3; }
      }
      if(z.life <= 0) z.on = false;
      return;
    }
    if(z.life <= 0){ z.on = false; return; }
    R.curW = z.w;
    if(z.k === "ring"){
      const k = 1 - z.life / z.max;
      z.r = z.maxr * (0.15 + 0.85 * Math.sqrt(k));
      brNear(R, z.x, z.y, z.r + 20, f=>{
        if(z.hit.has(f)) return;
        const dx = f.x - z.x, dy = f.y - z.y, d = Math.hypot(dx, dy) || 1;
        if(Math.abs(d - z.r) < 18 + f.r){ z.hit.add(f); brHit(R, f, z.dmg, z.color, dx / d, dy / d, z.quake ? 320 : 220); if(z.stun && !f.boss) f.stun = 0.6; }
      });
      return;
    }
    z.tick -= dt;
    if(z.tick > 0) return;
    z.tick = 0.4;
    brNear(R, z.x, z.y, z.r, f=>{
      if(Math.hypot(f.x - z.x, f.y - z.y) > z.r + f.r * 0.5) return;
      brHit(R, f, z.dmg, z.color, 0, 0, 0);
      if(z.k === "puddle"){ f.dot = 2; f.dotDmg = z.dmg * 0.6; }
      if(z.k === "seed"){ f.slow = 0.5; R.hp = Math.min(R.maxHp, R.hp + 0.15); }
    });
  });
}

/* ---------- octets ---------- */
function brGems(R, dt){
  const mag = 92 * R.mods.magnet;
  let n = 0; R.P.gems.each(()=>n++);
  if(n > 260){
    let big = null;
    R.P.gems.each(g=>{ if(g.pull || Math.hypot(g.x - R.x, g.y - R.y) < 300) return;
      if(!big){ big = g; return; } big.v += g.v; g.on = false; });
  }
  R.P.gems.each(g=>{
    const dx = R.x - g.x, dy = R.y - g.y, d = Math.hypot(dx, dy) || 1;
    if(d < mag || g.pull){ g.pull = true; const sp = 480 + (g.pv = (g.pv || 0) + dt * 900); g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
    if(d < 16){
      g.on = false; g.pv = 0;
      R.xp += g.v * (R.mods.xp || 1);
      R.pickChain = (R.pickT > 0 ? (R.pickChain || 0) + 1 : 0); R.pickT = 0.35;
      if(R.sndT <= 0 || R.sndT === undefined){ try { Sfx.coin(); } catch(e){} R.sndT = 0.06; }
      while(R.xp >= R.need){ R.xp -= R.need; R.lv++; R.need = brXpNeed(R.lv); R.pendingLevels++; }
    }
  });
  if(R.pickT > 0) R.pickT -= dt;
  if(R.sndT > 0) R.sndT -= dt;
}
function brParts(R, dt){
  R.P.parts.each(p=>{ p.life -= dt; if(p.life <= 0){ p.on = false; return; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; });
  R.P.texts.each(t=>{ t.life -= dt; if(t.life <= 0){ t.on = false; return; } t.y -= 34 * dt; });
  R.P.fx.each(f=>{ f.life -= dt; if(f.life <= 0) f.on = false; });
  if(R.hurt > 0) R.hurt -= dt;
  if(R.banner){ R.banner.life -= dt; if(R.banner.life <= 0) R.banner = null; }
}
function brBanner(R, text, color, sub){ R.banner = {text, color, sub, life:2.2, max:2.2}; try { Sfx.glitch(); } catch(e){} }

/* ============================================================
   LE BOSS — un legendaire-verrou ou un alpha, attaques annoncees
   ============================================================ */
function brSummonBoss(R){
  R.bossOn = true;
  const id = R.guardian ? R.guardian.id : brSpecies(R);
  const f = brSpawnFoe(R, id, "boss");
  const rm = BR_REGION_MULT[R.region] || 1;
  /* un vrai combat : une trentaine de secondes, des attaques lisibles, pas de coup fatal */
  /* sa vie suit la puissance de l'equipe : le combat reste un combat, meme a haut niveau */
  f.max = f.hp = Math.round((R.guardian ? 11000 : 8000) * rm * (0.7 + POKE[id].bst / 900) * (1 + R.lv / 22));
  f.spd = 42; f.dmg = 13 * Math.sqrt(rm);
  f.x = R.x; f.y = R.y - Math.max(R.W, R.H) * 0.55;
  f.atk = 2.2; f.pattern = 0;
  R.boss = f;
  /* la voie se degage : les ennemis ordinaires reculent devant le boss */
  R.P.foes.each(o=>{ if(o !== f && !o.elite) o.hp = 0; });
  brBanner(R, R.guardian ? "LE VERROU SE MONTRE" : "L'ALPHA DE LA BRÈCHE", "#ff3d7f", POKE[id].name.toUpperCase());
  brShake(R, 10); try { buzz([30, 40, 60]); } catch(e){}
}
function brBossAI(R, dt){
  const b = R.boss;
  if(!b || !b.on) return;
  if(b.flash > 0) b.flash -= dt;
  const dx = R.x - b.x, dy = R.y - b.y, d = Math.hypot(dx, dy) || 1;
  if(!b.charge){ b.x += dx / d * b.spd * dt; b.y += dy / d * b.spd * dt; }
  else {
    b.charge.t -= dt;
    if(b.charge.t <= 0){ b.x += b.charge.vx * dt; b.y += b.charge.vy * dt; b.charge.go -= dt; if(b.charge.go <= 0) b.charge = null; }
  }
  if(d < b.r + 16 && R.inv <= 0 && brTakeHit(R, b.dmg, b)){ R.inv = 0.7; brShake(R, 7); R.hurt = 0.3; }
  b.atk -= dt;
  if(b.atk > 0) return;
  const enraged = b.hp < b.max * 0.4;
  b.atk = enraged ? 1.6 : 2.4;
  const pat = b.pattern++ % 3;
  const C = BR_ARCH[POKE[b.id].types[0]].c;
  if(pat === 0){
    /* trois cercles au sol : on voit, on esquive */
    for(let k = 0; k < (enraged ? 5 : 3); k++){
      brZone(R, {k:"warn", x:R.x + (R.rng() - .5) * 180, y:R.y + (R.rng() - .5) * 180, r:46, life:1.1, max:1.1, delay:k * 0.15, dmg:b.dmg, color:C, boss:true});
    }
  } else if(pat === 1){
    /* charge : une ligne s'allume, puis il fonce */
    b.charge = {t:0.75, go:0.55, vx:dx / d * 520, vy:dy / d * 520};
    Object.assign(brFxNew(R), {k:"warnline", x:b.x, y:b.y, a:Math.atan2(dy, dx), len:420, w:b.r, life:0.75, max:0.75, color:"#ff3d7f"});
  } else {
    /* salve en etoile */
    for(let k = 0; k < (enraged ? 18 : 12); k++){
      const a = k / (enraged ? 18 : 12) * Math.PI * 2 + b.pattern * 0.3;
      const s = brShot(R, b.x, b.y, Math.cos(a) * 170, Math.sin(a) * 170, {dmg:b.dmg * 0.6, r:9, color:C, life:3, kind:"enemy", pierce:1, w:-1});
      s.enemy = true;
    }
  }
}
/* attaques du boss : zones qui explosent, projectiles qui touchent le joueur */
function brBossHazards(R, dt){
  R.P.shots.each(s=>{
    if(!s.enemy) return;
    if(Math.hypot(R.x - s.x, R.y - s.y) < s.r + 12 && R.inv <= 0){ if(brTakeHit(R, s.dmg, null)){ R.inv = 0.5; R.hurt = 0.3; } s.on = false; }
  });
}
function brBossDown(R, f){
  R.bossDown = true; R.boss = null;
  R.slowmo = 1.4; brShake(R, 14);
  brBurst(R, f.x, f.y, "#ffffff", 80, 340, 0.9);
  brBanner(R, "SECTEUR STABILISÉ", "#35f0d6", R.guardian ? "VERROU LEVÉ" : "ALPHA VAINCU");
  try { Sfx.win(); buzz([40, 50, 90]); } catch(e){}
  setTimeout(()=>{ if(BR === R) brVictory(R); }, 2400);
}

/* ============================================================
   RENDU
   ============================================================ */
function brRender(R, cv){
  const x = cv.getContext("2d");
  const W = R.W, H = R.H;
  x.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
  x.imageSmoothingEnabled = false;
  const sx = (R.rng() - .5) * R.shake, sy = (R.rng() - .5) * R.shake;
  const camX = R.x - W / 2 + sx, camY = R.y - H / 2 + sy;
  /* sol carrele */
  const fl = brFloor(R.hab), fs = fl.width;
  const ox = -((camX % fs) + fs) % fs, oy = -((camY % fs) + fs) % fs;
  for(let tx = ox; tx < W; tx += fs) for(let ty = oy; ty < H; ty += fs) x.drawImage(fl, tx, ty);
  const X = v => v - camX, Y = v => v - camY;
  brDrawUnder(x, R, X, Y);

  /* zones au sol */
  R.P.zones.each(z=>{
    if(z.delay > 0 && !z.boss) return;
    const k = z.life / z.max;
    if(z.k === "warn"){
      if(z.delay > 0) return;
      x.fillStyle = "rgba(255,61,127," + (0.12 + (1 - k) * 0.25) + ")";
      x.beginPath(); x.arc(X(z.x), Y(z.y), z.r, 0, 7); x.fill();
      x.strokeStyle = "#ff3d7f"; x.lineWidth = 2; x.beginPath(); x.arc(X(z.x), Y(z.y), z.r * (1 - k), 0, 7); x.stroke();
      return;
    }
    if(z.k === "ring"){
      x.strokeStyle = z.color; x.globalAlpha = Math.min(1, k * 1.4); x.lineWidth = z.quake ? 6 : 4;
      x.beginPath(); x.arc(X(z.x), Y(z.y), z.r, 0, 7); x.stroke(); x.globalAlpha = 1; return;
    }
    /* zones au sol : translucides, pour ne jamais cacher un ennemi */
    const zr = z.r * (0.94 + Math.sin(R.t * 6 + z.x) * 0.06);
    x.globalAlpha = Math.min(0.22, k * 0.4); x.fillStyle = z.color;
    x.beginPath(); x.arc(X(z.x), Y(z.y), zr, 0, 7); x.fill();
    x.globalAlpha = Math.min(0.7, k); x.strokeStyle = z.color; x.lineWidth = 2;
    x.setLineDash([6, 5]); x.lineDashOffset = -R.t * 30;
    x.beginPath(); x.arc(X(z.x), Y(z.y), zr, 0, 7); x.stroke();
    x.setLineDash([]); x.globalAlpha = 1;
  });
  /* octets */
  R.P.gems.each(g=>{
    const c = g.v >= 60 ? "#ffd24a" : g.v >= 18 ? "#ff3d7f" : g.v >= 4 ? "#b06bff" : "#35f0d6";
    const s = g.v >= 18 ? 5 : g.v >= 4 ? 4 : 3;
    x.fillStyle = c; x.fillRect(X(g.x) - s / 2, Y(g.y) - s, s, s * 2);
    x.fillStyle = "#fff"; x.fillRect(X(g.x) - 1, Y(g.y) - s + 1, 1, 2);
  });
  /* ramassables : un joyau qui pulse, son glyphe, un anneau ; il clignote avant de disparaitre */
  R.P.picks.each(p=>{
    const P = BR_PICKS[p.k], px = X(p.x), py = Y(p.y) + Math.sin(p.t * 4) * 3;
    if(p.t > 20 && Math.floor(p.t * 8) % 2) return;
    const pul = 1 + Math.sin(p.t * 6) * 0.15;
    const gl = x.createRadialGradient(px, py, 0, px, py, 26 * pul);
    gl.addColorStop(0, P.c); gl.addColorStop(1, "rgba(0,0,0,0)");
    x.globalAlpha = 0.55; x.fillStyle = gl; x.fillRect(px - 30, py - 30, 60, 60); x.globalAlpha = 1;
    x.strokeStyle = P.c; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 11 * pul, 0, 7); x.stroke();
    x.fillStyle = "#0a0f18"; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill();
    x.fillStyle = P.c; x.font = "bold 13px ui-monospace,monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(P.g, px, py + 1); x.textBaseline = "alphabetic";
  });
  /* ennemis, tries par profondeur */
  const foes = [];
  R.P.foes.each(f=>foes.push(f));
  foes.sort((a, b)=>a.y - b.y);
  for(const f of foes){
    if(f.reaper){ brDrawReaper(x, R, f, X(f.x), Y(f.y)); continue; }
    if(f.kind === "nest"){ brDrawNest(x, R, f, X(f.x), Y(f.y)); continue; }
    const spr = brSprite(f.id, f.shiny ? "s" : "c");
    const s = f.size, fx = X(f.x), fy = Y(f.y);
    if(fx < -s || fy < -s || fx > W + s || fy > H + s) continue;
    x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(fx, fy + s * 0.32, s * 0.3, s * 0.1, 0, 0, 7); x.fill();
    if(f.elite || f.boss){
      const gl = x.createRadialGradient(fx, fy, 0, fx, fy, s * 0.7);
      gl.addColorStop(0, f.boss ? "rgba(255,61,127,.45)" : "rgba(255,61,127,.3)"); gl.addColorStop(1, "rgba(255,61,127,0)");
      x.fillStyle = gl; x.fillRect(fx - s, fy - s, s * 2, s * 2);
    }
    const bob = Math.sin(R.t * 8 + f.phase) * 1.5;
    const jit = (f.elite || f.boss) && R.rng() < 0.06 ? (R.rng() - .5) * 6 : 0;
    if(spr){
      x.save(); x.translate(fx + jit, fy + bob);
      if(f.x > R.x) x.scale(-1, 1);
      x.drawImage(spr, -s / 2, -s / 2, s, s);
      if(f.flash > 0){ const w = brSprite(f.id, "w"); if(w){ x.globalAlpha = 0.85; x.drawImage(w, -s / 2, -s / 2, s, s); x.globalAlpha = 1; } }
      x.restore();
    }
    if(f.shiny){ x.fillStyle = "#ffe9a8"; x.fillText("✦", fx + s * 0.3, fy - s * 0.3); }
    /* signes des menaces : on doit savoir d'un regard ce qui arrive */
    if(f.kind === "armored"){ x.strokeStyle = "rgba(143,247,232,.8)"; x.lineWidth = 2; x.beginPath();
      for(let k = 0; k <= 6; k++){ const a = k / 6 * Math.PI * 2 + R.t; const hx = fx + Math.cos(a) * s * 0.46, hy = fy + Math.sin(a) * s * 0.46; k ? x.lineTo(hx, hy) : x.moveTo(hx, hy); } x.stroke(); }
    if(f.kind === "shooter"){ x.strokeStyle = "#b06bff"; x.lineWidth = 1.5; const cy2 = fy - s * 0.55;
      x.beginPath(); x.arc(fx, cy2, 5, 0, 7); x.moveTo(fx - 8, cy2); x.lineTo(fx + 8, cy2); x.moveTo(fx, cy2 - 8); x.lineTo(fx, cy2 + 8); x.stroke(); }
    if(f.kind === "rusher"){ const on2 = f.fuse > 0 ? Math.floor(R.t * 20) % 2 : Math.floor(R.t * 4) % 2;
      if(on2){ x.globalAlpha = f.fuse > 0 ? 0.7 : 0.25; x.fillStyle = "#ff3d2a"; x.beginPath(); x.arc(fx, fy, s * 0.42, 0, 7); x.fill(); x.globalAlpha = 1; }
      if(f.fuse > 0){ x.strokeStyle = "#ff8a3d"; x.lineWidth = 2; x.beginPath(); x.arc(fx, fy, 62 * (1 - f.fuse / 0.6), 0, 7); x.stroke(); } }
    if(f.kind === "splitter"){ x.fillStyle = "#ffd24a"; x.font = "bold 10px ui-monospace,monospace"; x.fillText("⇆", fx, fy - s * 0.5); }
    if(f.burn > 0 && R.rng() < 0.3) brBurst(R, f.x, f.y - s * 0.2, "#ff8a3d", 1, 40, 0.3);
    if(f.psn > 0 && R.rng() < 0.2) brBurst(R, f.x, f.y - s * 0.2, "#b86bff", 1, 30, 0.35);
    if(f.stun > 0){ x.fillStyle = "#ffe45e"; x.font = "bold 11px ui-monospace,monospace"; x.fillText("✦✦", fx, fy - s * 0.5); }
    if((f.elite || f.big) && f.hp < f.max){
      x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(fx - s * 0.35, fy - s * 0.55, s * 0.7, 4);
      x.fillStyle = "#ff3d7f"; x.fillRect(fx - s * 0.35, fy - s * 0.55, s * 0.7 * f.hp / f.max, 4);
    }
  }
  /* turbo : trainee d'images fantomes */
  if(R.turbo > 0 && R.ghosts){
    const gs = brSprite(brShownId(R.team[0]), "w");
    R.ghosts.forEach((g, i)=>{ if(!gs || i % 2) return;
      x.save(); x.globalAlpha = 0.35 * (1 - i / R.ghosts.length); x.translate(X(g.x), Y(g.y)); if(g.face < 0) x.scale(-1, 1);
      x.drawImage(gs, -29, -29, 58, 58); x.restore(); });
    x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.5; x.fillStyle = "#4fdcff";
    x.beginPath(); x.arc(W / 2 + sx, H / 2 + sy, 34, 0, 7); x.fill(); x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  }
  /* equipe : la file suit le chef, chacun a sa place */
  for(let i = R.team.length - 1; i >= 0; i--){
    const w = R.team[i], p = brMemberPos(R, i), s = i === 0 ? 58 : 44;
    const spr = brSprite(brShownId(w), "n");
    x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(X(p.x), Y(p.y) + s * 0.34, s * 0.28, s * 0.09, 0, 0, 7); x.fill();
    if(w.stage >= 2){
      const gl = x.createRadialGradient(X(p.x), Y(p.y), 0, X(p.x), Y(p.y), s * 0.7);
      gl.addColorStop(0, "rgba(255,210,74,.35)"); gl.addColorStop(1, "rgba(255,210,74,0)");
      x.fillStyle = gl; x.fillRect(X(p.x) - s, Y(p.y) - s, s * 2, s * 2);
    }
    if(spr){
      x.save(); x.translate(X(p.x), Y(p.y) + Math.sin(R.t * 10 + i) * (R.vx || R.vy ? 2 : 0.6));
      if(R.face < 0) x.scale(-1, 1);
      if(i === 0 && R.inv > 0 && Math.floor(R.t * 20) % 2) x.globalAlpha = 0.45;
      x.drawImage(spr, -s / 2, -s / 2, s, s);
      if(R.evoFlash && R.evoFlash.w === w){ const wt = brSprite(brShownId(w), "w"); if(wt){ x.globalAlpha = R.evoFlash.a; x.drawImage(wt, -s / 2, -s / 2, s, s); } }
      x.restore();
    }
  }
  /* orbites */
  R.team.forEach(w=>{ if(!w.orbPts) return; const C = brArch(brShownId(w)).c;
    for(const o of w.orbPts){ x.fillStyle = C; x.shadowColor = C; x.shadowBlur = 12;
      x.beginPath(); x.arc(X(o.x), Y(o.y), 7 * brWeaponStats(w, R).area, 0, 7); x.fill(); x.shadowBlur = 0; } });
  /* projectiles et effets, en lumiere additive */
  x.globalCompositeOperation = "lighter";
  R.P.shots.each(s=>{
    const px = X(s.x), py = Y(s.y);
    if(s.kind === "lob"){ x.fillStyle = s.color; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); return; }
    if(s.kind === "flame"){ const k2 = s.life / 0.42;
      x.globalAlpha = Math.min(1, k2 * 1.6) * 0.55; x.fillStyle = s.color; x.beginPath(); x.arc(px, py, s.r * (2.2 - k2), 0, 7); x.fill();
      x.globalAlpha = Math.min(1, k2 * 1.8); x.fillStyle = "#fff3b0"; x.beginPath(); x.arc(px, py, s.r * 0.55 * k2, 0, 7); x.fill();
      x.globalAlpha = 1; return; }
    if(s.kind === "blade"){ x.save(); x.translate(px, py); x.rotate(s.t * 14); x.fillStyle = s.color; x.fillRect(-s.r, -2, s.r * 2, 4); x.fillRect(-2, -s.r, 4, s.r * 2); x.restore(); return; }
    if(s.enemy){ x.fillStyle = "#ff3d7f"; x.beginPath(); x.arc(px, py, s.r, 0, 7); x.fill(); x.fillStyle = s.color; x.beginPath(); x.arc(px, py, s.r * 0.5, 0, 7); x.fill(); return; }
    /* halo, trainee, coeur blanc : un projectile doit se lire dans la melee */
    x.globalAlpha = 0.25; x.fillStyle = s.color; x.beginPath(); x.arc(px, py, s.r * 2.2, 0, 7); x.fill();
    x.globalAlpha = 0.4; x.beginPath(); x.arc(px - s.vx * 0.035, py - s.vy * 0.035, s.r * 0.9, 0, 7); x.fill();
    x.globalAlpha = 1; x.beginPath(); x.arc(px, py, s.r, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.beginPath(); x.arc(px, py, s.r * 0.45, 0, 7); x.fill();
  });
  R.P.fx.each(f=>{
    const k = f.life / f.max; x.globalAlpha = k; x.strokeStyle = f.color; x.fillStyle = f.color;
    if(f.k === "ring"){ x.lineWidth = 3; x.beginPath(); x.arc(X(f.x), Y(f.y), f.r * (1.1 - k * 0.3), 0, 7); x.stroke(); }
    else if(f.k === "bolt"){ x.lineWidth = 3; x.beginPath(); f.pts.forEach((p, i)=>{ const jx = i ? (R.rng() - .5) * 10 : 0; i ? x.lineTo(X(p.x) + jx, Y(p.y) + jx) : x.moveTo(X(p.x), Y(p.y)); }); x.stroke(); }
    else if(f.k === "beam"){ x.save(); x.translate(X(f.x), Y(f.y)); x.rotate(f.a); x.fillRect(0, -f.w * k, f.len, f.w * 2 * k); x.restore(); }
    else if(f.k === "arc"){ x.lineWidth = 10 * k; x.beginPath(); x.arc(X(f.x), Y(f.y), f.r * 0.8, f.a - 1, f.a + 1); x.stroke(); }
    else if(f.k === "warnline"){ x.globalCompositeOperation = "source-over"; x.save(); x.translate(X(f.x), Y(f.y)); x.rotate(f.a);
      x.fillStyle = "rgba(255,61,127," + (0.15 + (1 - k) * 0.3) + ")"; x.fillRect(0, -f.w, f.len, f.w * 2); x.restore(); x.globalCompositeOperation = "lighter"; }
    x.globalAlpha = 1;
  });
  R.P.parts.each(p=>{ x.globalAlpha = p.life / p.max; x.fillStyle = p.color; x.fillRect(X(p.x), Y(p.y), p.size, p.size); });
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  /* halo d'attraction discret autour de l'Archiviste */
  x.strokeStyle = "rgba(53,240,214,.12)"; x.lineWidth = 1;
  x.beginPath(); x.arc(W / 2 + sx, H / 2 + sy, 92 * R.mods.magnet, 0, 7); x.stroke();
  /* vie de l'Archiviste, sous ses pieds */
  const hpw = 46, hx = W / 2 - hpw / 2 + sx, hy = H / 2 + 36 + sy;
  x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(hx - 1, hy - 1, hpw + 2, 6);
  x.fillStyle = R.hp / R.maxHp > 0.35 ? "#5ce07a" : "#ff3d7f"; x.fillRect(hx, hy, hpw * Math.max(0, R.hp) / R.maxHp, 4);
  /* chiffres */
  x.textAlign = "center"; x.font = "bold 11px ui-monospace,monospace";
  R.P.texts.each(t=>{ x.globalAlpha = Math.min(1, t.life / t.max * 2); x.font = "bold " + t.size + "px ui-monospace,monospace";
    x.fillStyle = "#000"; x.fillText(t.txt, X(t.x) + 1, Y(t.y) + 1); x.fillStyle = t.color; x.fillText(t.txt, X(t.x), Y(t.y)); });
  x.globalAlpha = 1;
  brDrawOver(x, R, X, Y);
  /* lignes de vitesse pendant le turbo */
  if(R.turbo > 0){
    x.strokeStyle = "rgba(143,236,255,.55)"; x.lineWidth = 2;
    for(let k = 0; k < 22; k++){
      const a = R.rng() * Math.PI * 2, r0 = Math.max(W, H) * (0.36 + R.rng() * 0.1), r1 = r0 + 40 + R.rng() * 70;
      x.beginPath(); x.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); x.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); x.stroke();
    }
  }
  if(R.shield){ x.strokeStyle = "rgba(143,247,232,.7)"; x.lineWidth = 2; x.beginPath(); x.arc(W / 2 + sx, H / 2 + sy, 30 + Math.sin(R.t * 5) * 2, 0, 7); x.stroke(); }
  /* vignette, et rouge quand on est touche */
  const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, R.hurt > 0 ? "rgba(255,30,80,.55)" : "rgba(4,0,12,.55)");
  x.fillStyle = vg; x.fillRect(0, 0, W, H);
  /* annonce */
  if(R.banner){
    const k = R.banner.life / R.banner.max, a = Math.min(1, k * 3, (1 - k) * 6);
    x.globalAlpha = a; x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(0, H * 0.3 - 30, W, R.banner.sub ? 70 : 52);
    x.fillStyle = R.banner.color; x.font = "bold 20px ui-monospace,monospace"; x.fillText(R.banner.text, W / 2, H * 0.3 + 2);
    if(R.banner.sub){ x.fillStyle = "#fff"; x.font = "12px ui-monospace,monospace"; x.fillText(R.banner.sub, W / 2, H * 0.3 + 24); }
    x.globalAlpha = 1;
  }
  if(R.boss){ R.bossHpPct = Math.max(0, R.boss.hp / R.boss.max); }
  /* premiere run : la seule consigne dont on a besoin */
  if(R.firstRun && R.t < 5 && !R.joy && !R.movedOnce){
    x.globalAlpha = 0.9; x.fillStyle = "#fff"; x.font = "bold 14px ui-monospace,monospace";
    x.fillText("Glisse ton pouce pour bouger", W / 2, H * 0.72); x.globalAlpha = 1;
  }
  if(R.joy) R.movedOnce = true;
}
/* le sprite affiche suit les evolutions de la run */
function brShownId(w){ return w.show || w.id; }

/* MissingNo : son propre sprite, jamais stable, un halo qui ronge l'ecran */
let BR_MISSING_IMG = null;
function brDrawReaper(x, R, f, fx, fy){
  if(!BR_MISSING_IMG){ BR_MISSING_IMG = new Image(); BR_MISSING_IMG.src = MISSING_SPRITE; }
  const s = f.size, j = (R.rng() - .5) * 8;
  const gl = x.createRadialGradient(fx, fy, 0, fx, fy, s * 1.3);
  gl.addColorStop(0, "rgba(255,61,127,.45)"); gl.addColorStop(1, "rgba(255,61,127,0)");
  x.fillStyle = gl; x.fillRect(fx - s * 1.4, fy - s * 1.4, s * 2.8, s * 2.8);
  if(BR_MISSING_IMG.complete && BR_MISSING_IMG.naturalWidth){
    x.globalAlpha = 0.6; x.globalCompositeOperation = "lighter";
    x.drawImage(BR_MISSING_IMG, fx - s / 2 - 4 + j, fy - s / 2, s, s);
    x.drawImage(BR_MISSING_IMG, fx - s / 2 + 4 - j, fy - s / 2, s, s);
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
    x.drawImage(BR_MISSING_IMG, fx - s / 2 + j * 0.3, fy - s / 2, s, s);
  }
  x.fillStyle = "#ff3d7f"; x.font = "bold 10px ui-monospace,monospace"; x.textAlign = "center";
  x.fillText("M̸I̸S̸S̸I̸N̸G̸N̸O̸", fx, fy - s * 0.62);
}
