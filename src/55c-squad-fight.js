/* ============================================================
   55c — LA TOUR : le combat
   Le moteur (55) décide tout d'un coup ; cet écran le raconte,
   événement par événement. Ce qu'on voit suit ce qui est raconté,
   jamais l'état interne : une barre de vie ne baisse qu'au moment
   où le coup touche, une vague ne remplace la précédente qu'à son
   annonce, et une attaque de zone frappe tout le monde à la fois.

   · des décors peints pour chaque aile, et leur ambiance animée ;
   · des Pokémon au repos (pose Idle de PMD) qui ne marchent que
     lorsqu'ils se déplacent ;
   · des plaques de vie sous les pieds, avec la traînée du coup ;
   · l'ordre des prochains tours, la jauge de Synchro, le butin
     qui tombe des adversaires et rejoint le compteur ;
   · la coupure de l'ultime, l'entrée du boss.
   ============================================================ */

/* ============================================================
   1. L'ÉCRAN
   ============================================================ */
function sqFightHtml(){
  const B = SQB, Z = SQ_ZONES[B.z], q = sqState();
  const name = B.final ? `COUCHE ZÉRO <i style="color:#ff3d7f">ENTRÉE 000</i>`
    : B.lock ? `VERROU <i style="color:#ff3d7f">${esc(regionDef(B.lock.r).name)}</i>`
    : `${esc(Z.n)} · ${B.s === SQ_STAGES - 1 ? "BOSS" : "palier " + (B.s + 1)} <i style="color:${SQ_DIFFS[B.d].c}">${SQ_DIFFS[B.d].n}</i>`;
  return `<div class="sq2" style="--zc:${Z.c}">
    <div class="sq2-arena" id="sqarena">
      <canvas id="sqcv"></canvas>
      <div class="sq2-top">
        <div class="sq2-title" id="sqtitle"><span class="sq2-name">${name}</span></div>
        <span class="sq2-waves" id="sqwave">${sqWaveDots()}</span>
        <span class="sq2-loot" id="sqloot">${sqLootHtml()}</span>
        <button class="sq2-pause" data-act="sqquit" aria-label="Pause">❚❚</button>
      </div>
      <div class="sq2-order" id="sqorder"></div>
      <div class="sq2-tip" id="sqtip"></div>
    </div>
    <div class="sq2-say" id="sqsay">${B.lead ? `♛ ${esc(sqLeaderText(B.lead))}` : "Le combat commence."}</div>
    <div class="sq2-dock">
      <div class="sq2-ctl">
        <button class="sq2-auto ${q.auto ? "on" : ""}" data-act="sqauto">AUTO</button>
        <button class="sq2-spd" data-act="sqspeed" id="sqspd">×${q.speed || 1}</button>
      </div>
      <button class="sq2-sync" id="sqsync" data-act="sqsync" disabled style="--p:0">
        <span class="sq2-syncring"></span><b>SYNCHRO</b><small id="sqsyncv">0 %</small></button>
      <div class="sq2-skills" id="sqskills"></div>
    </div>
    <div class="sw-res sq2-res" id="sqres"></div>
  </div>`;
}
function sqWaveDots(){ return SQB.waves.map((_, i)=>`<i class="${i < SQB.wave ? "done" : i === SQB.wave ? "on" : ""}"></i>`).join(""); }
function sqLootHtml(){
  const L = (SQV && SQV.lootShown) || {coins:0, scrolls:0, candy:0};
  return `<span>${ic("coin")}<b>${fmt(L.coins)}</b></span><span class="${L.scrolls ? "vi" : "dim"}">${itemIcon("exp:i_ct", 14) || "▤"}<b>${L.scrolls}</b></span>`;
}
ACTIONS.sqauto = () => {
  const q = sqState(); q.auto = !q.auto; saveSoon();
  const b = document.querySelector(".sq2-auto"); if(b) b.classList.toggle("on", q.auto);
  if(q.auto && SQV && SQV.wait){ const u = SQV.wait; SQV.wait = null; sqDrawSkills(); sqAllyTurn(u); }
  else sqDrawSkills();
};
ACTIONS.sqspeed = () => {
  const q = sqState(), o = [1, 2, 3];
  q.speed = o[(o.indexOf(q.speed || 1) + 1) % o.length] || 1; saveSoon();
  const b = document.getElementById("sqspd"); if(b) b.textContent = "×" + q.speed;
};
ACTIONS.sqquit = () => {
  sheet(`${sheetHead("Pause")}<div class="tiny muted">Quitter maintenant ne valide pas le palier. Le butin ramassé est perdu.</div>
    <div class="btn-grid c2" style="margin-top:10px"><button class="btn pri" data-act="closesheet">Reprendre</button>
    <button class="btn dan" data-act="sqquit2">Abandonner</button></div>`, true);
};
ACTIONS.sqquit2 = () => { closeSheet(); const lk = SQB && SQB.lock, fin = SQB && SQB.final; SQB = null; SQV = null;
  if(fin && typeof Music !== "undefined") Music.ctxOverride = null;
  fin ? go("modules") : lk ? go("boss") : go("tower", "zone"); };

/* lancer un combat depuis la préparation */
ACTIONS.sqfight = () => {
  const P = SQ_PREP; if(!P || !P.team.length) return;
  const q = sqState(); q.team = P.team.slice(); if(S.team.length < 3) S.team = P.team.slice(0, 6); save();
  SQB = sqNewBattle(P.team, P.z, P.s, {d:P.d, waves:P.waves, lock:P.lock || null});
  SQV = {busy:false, wait:null, pick:0, target:null, pops:[], banner:null, t:0, last:0, raf:0, shake:0, parts:[], rings:[], orbs:[], waves:[],
         loots:[], lootShown:{coins:0, scrolls:0, candy:0}, sync:0, cut:null, amb:[], foes:SQB.foes.slice()};
  SQB.allies.forEach((u, i)=>sqVInit(u, 120 + i * 90, "ally"));
  SQV.foes.forEach((u, i)=>sqVInit(u, 520 + i * 90, "foe"));
  go("tower", "fight");
  SQV.banner = {txt:"VAGUE 1", c:"#ffffff", t0:900, big:true};
  setTimeout(sqLoop, 1500);
};
/* l'état affiché d'un Pokémon : ce que le joueur a vu, pas ce que le moteur sait */
function sqVInit(u, t0, side){
  u._v = {hp:u.hp, trail:u.hp, sh:u.shield || 0, enter:{t0, dur:720, side}};
}

/* ============================================================
   2. LE DÉROULÉ — le moteur décide, l'écran raconte
   ============================================================ */
const sqSp = () => (sqState().speed || 1);
function sqLoop(){
  const B = SQB; if(!B || !SQV) return;
  if(B.over){ sqEnd(); return; }
  const u = sqNext(B);
  if(!u){ sqEnd(); return; }
  SQV.active = u;
  sqOrder();
  sqPlay(sqTurnStart(B, u), ()=>{
    if(SQB !== B) return;
    if(u.hp <= 0){ const ev = []; sqCheck(B, ev); sqPlay(ev, sqLoop); return; }
    if(u.stunned){ sqPlay(sqSkip(B, u), sqLoop); return; }
    if(u.side === "ally") return sqAllyTurn(u);
    const a = sqAI(B, u);
    setTimeout(()=>sqDoAct(u, a), 260 / sqSp());
  });
}
/* le tour d'un allié : la main au joueur, ou à l'automatique (qui déclenche la Synchro dès qu'elle est pleine) */
function sqAllyTurn(u){
  const B = SQB; if(!B || !SQV) return;
  if(sqState().auto){
    if(sqSyncReady(B)){
      const a = sqAI(B, u);
      sqPlay(sqSync(B, a.ti), ()=>sqAfterSync(B, u));
      return;
    }
    const a = sqAI(B, u);
    setTimeout(()=>sqDoAct(u, a), 220 / sqSp());
    return;
  }
  SQV.wait = u;
  const a = sqAI(B, u);
  SQV.pick = a.si;
  SQV.target = B.foes[a.ti] && B.foes[a.ti].hp > 0 ? B.foes[a.ti] : sqAlive(B.foes)[0];
  sqDrawSkills();
  sqSayPick();
}
function sqAfterSync(B, u){
  if(SQB !== B || !SQV) return;
  if(B.over){ sqEnd(); return; }
  if(u.hp <= 0){ sqLoop(); return; }
  sqAllyTurn(u);
}
ACTIONS.sqsync = () => {
  const B = SQB; if(!B || !SQV || !SQV.wait || !sqSyncReady(B)) return;
  const u = SQV.wait; SQV.wait = null; sqDrawSkills();
  const ti = SQV.target ? B.foes.indexOf(SQV.target) : -1;
  sqPlay(sqSync(B, ti), ()=>sqAfterSync(B, u));
};
function sqDoAct(u, a){
  if(!SQB || !SQV) return;
  SQV.wait = null; SQV.target = null; sqDrawSkills();
  sqPlay(sqAct(SQB, u, a.si, a.ti), sqLoop);
}
/* une file d'événements ; ceux d'un même groupe (une attaque de zone) se jouent ensemble */
function sqPlay(ev, done){
  let i = 0;
  const next = () => {
    if(!SQB || !SQV) return;
    if(i >= ev.length){ done && done(); return; }
    const e = ev[i++];
    let d = sqShow(e, ev);
    if(e.g) while(i < ev.length && ev[i].g === e.g) d = Math.max(d, sqShow(ev[i++], ev));
    setTimeout(next, d / sqSp());
  };
  next();
}
function sqSay(t){ const el = document.getElementById("sqsay"); if(el) el.innerHTML = t; }
function sqSayPick(){
  const u = SQV && SQV.wait; if(!u) return;
  const s = u.skills[SQV.pick];
  sqSay(`<b>${esc(u.name)}</b> · <b style="color:${sqCol(s.t)}">${esc(s.n)}</b> — ${esc(sqDescribe(s))}<br><span class="dim">${s.kind === "atk" ? "Touchez la cible." : "Touchez à nouveau la compétence pour la lancer."}</span>`);
}

/* chaque événement du moteur devient une image ; la valeur rendue est sa durée */
function sqShow(e, all){
  const V = SQV, now = V.t;
  switch(e.k){
    case "skill": {
      const u = e.src, sk = e.sk, ult = e.si === 2 && !e.sync;
      const tg = all.filter(x=>x.k === "hit" && x.src === u).map(x=>x.tgt);
      const lead = ult ? 820 : e.sync ? 0 : 0;
      const melee = sk.kind === "atk" && [1, 2, 7, 9, 17, 16, 6, 5].includes(sk.t);
      u._v.pose = {anim:ult && sqHasAnim(u.id, "charge") ? "charge" : melee ? "attack" : "shoot", t0:now, len:ult ? 820 : 460};
      if(ult) u._v.pose2 = {anim:melee ? "attack" : "shoot", t0:now + lead, len:460};
      if(melee && tg[0] && tg[0]._v.pos) u._v.lunge = {t0:now + lead, to:tg[0]._v.pos};
      else if(sk.kind === "atk") for(const t of tg) V.orbs.push({from:u, to:t, c:sqCol(sk.t), t0:now + lead + 90, dur:e.sync ? 160 : 230});
      if(sk.kind === "aoe") V.waves.push({u, c:sqCol(sk.t), t0:now + lead + 60, dur:380, side:u.side});
      if(sk.kind === "team") V.waves.push({u, c:sqCol(sk.t), t0:now + lead, dur:420, side:u.side, team:true});
      if(ult){ V.cut = {kind:"ult", u, t0:now, dur:lead + 120, c:sqCol(sk.t), n:sk.n}; V.shake = 5; }
      if(!e.sync) V.banner = {txt:sk.n, c:sqCol(sk.t), t0:now + lead, big:false};
      if(!e.sync) sqSay(`<b>${esc(u.name)}</b> utilise <b style="color:${sqCol(sk.t)}">${esc(sk.n)}</b>`);
      if(typeof arTone === "function") arTone(u.side === "ally" ? 440 : 300, .08, "triangle", .03, 660);
      return e.sync ? 230 : lead + (sk.kind === "aoe" ? 440 : sk.kind === "team" ? 360 : 380) + (melee ? 40 : 0);
    }
    case "hit": {
      const t = e.tgt, v = t._v || (t._v = {hp:t.hp, trail:t.hp, sh:0});
      v.hurt = now; v.flash = now; v.hp = e.hp; v.sh = e.sh || 0; v.trailHold = now + 260;
      const c = e.crit ? "#ffd84a" : e.eff >= 2 ? "#ffc857" : e.eff < 1 ? "#9fb0c8" : "#ffffff";
      sqPop(t, String(e.dmg), c, {big:e.crit || e.eff >= 2});
      if(e.crit) sqPop(t, "CRITIQUE", "#ffd84a", {small:true, dy:-18});
      else if(e.eff >= 2) sqPop(t, "SUPER EFFICACE", "#ffc857", {small:true, dy:-18});
      else if(e.eff < 1) sqPop(t, "RÉSISTE", "#9fb0c8", {small:true, dy:-18});
      V.shake = Math.max(V.shake, e.crit ? 9 : 3 + Math.min(6, e.dmg / t.maxHp * 18));
      sqImpact(t, e.ty || 1, e.crit || e.eff >= 2);
      if(e.src && e.src.side === "ally") V.hitstop = now + (e.crit ? 70 : 35);
      if(typeof arTone === "function") arTone(e.crit ? 110 : 170, .12, "sawtooth", .05, 60);
      return 300;
    }
    case "heal": { const v = e.tgt._v; v.glow = {c:"#5ce07a", t0:now}; v.hp = e.hp; v.trail = Math.max(v.trail, e.hp); sqPop(e.tgt, "+" + e.v, "#5ce07a", {}); sqBurst(e.tgt, "#5ce07a", 8, true); return 160; }
    case "fx": {
      const lab = {brn:"BRÛLURE", psn:"POISON", stun:"ÉTOURDI", slow:"RALENTI", defdn:"DÉF ↓", atkdn:"ATQ ↓", atkup:"ATQ ↑", defup:"DÉF ↑",
                   spdup:"VIT ↑", shield:"BOUCLIER", cleanse:"PURGÉ", immune:"IMMUNISÉ"}[e.b] || e.b;
      const good = ["atkup", "defup", "spdup", "shield", "cleanse", "immune"].includes(e.b);
      if(e.sh !== undefined) e.tgt._v.sh = e.sh;
      sqPop(e.tgt, lab, good ? "#35f0d6" : "#ff86ad", {small:true, dy:-30});
      e.tgt._v.glow = {c:good ? "#35f0d6" : "#ff3d7f", t0:now};
      return 150;
    }
    case "phase": {
      const g = e.tgt;
      V.banner = {txt:"RECONFIGURATION", c:"#ff3d7f", t0:now, big:true}; V.shake = 12;
      g._v.glow = {c:"#ff3d7f", t0:now}; sqBurst(g, "#ff3d7f", 30, true);
      for(const a of e.adds){ sqVInit(a, now + 300, "foe"); if(!V.foes.includes(a)) V.foes.push(a); }
      sqSay(`<b>${esc(g.name)}</b> se reconfigure : sa signature change${e.adds.length ? ", deux renforts surgissent" : ""}.`);
      if(typeof arTone === "function") arTone(90, .5, "sawtooth", .06, 40);
      return 1500;
    }
    case "atb": sqPop(e.tgt, (e.v > 0 ? "JAUGE +" : "JAUGE −") + Math.abs(e.v) + "%", "#9fd8f8", {small:true, dy:-30}); return 120;
    case "dot": { const v = e.tgt._v; v.flash = now; v.hp = e.hp; v.trailHold = now + 200; sqPop(e.tgt, String(e.dmg), e.b === "brn" ? "#ff8a3d" : "#b86bff", {}); sqImpact(e.tgt, e.b === "brn" ? 10 : 4, false); return 320; }
    case "stun": sqPop(e.tgt, "ÉTOURDI", "#ffe45e", {small:true, dy:-30}); sqSay(`${esc(e.tgt.name)} est étourdi.`); return 450;
    case "ko": {
      const v = e.tgt._v; v.ko = now; v.hp = 0;
      sqBurst(e.tgt, e.tgt.side === "ally" ? "#35f0d6" : "#ff86ad", 22, true);
      if(typeof arTone === "function") arTone(300, .3, "square", .04, 60);
      return 420;
    }
    case "loot": sqLootDrop(e); return 80;
    case "sync": V.sync = e.v; sqSyncBtn(); return 0;
    case "syncstart": {
      V.cut = {kind:"sync", t0:now, dur:1050, c:"#35f0d6"}; V.shake = 6;
      sqSay(`<b style="color:#35f0d6">SYNCHRO</b> — toute l'équipe frappe ensemble.`);
      if(typeof arTone === "function"){ arTone(520, .12, "square", .04, 1040); setTimeout(()=>arTone(780, .2, "square", .04, 1560), 160); }
      return 1050;
    }
    case "wave": {
      V.foes = (e.foes || SQB.foes).slice();
      V.foes.forEach((u, i)=>sqVInit(u, now + 380 + i * 110, "foe"));
      const last = e.n === SQB.waves.length - 1, boss = V.foes.find(f=>f.boss), gd = V.foes.some(f=>f.guardian);
      if(boss){
        V.cut = {kind:"boss", u:boss, t0:now + 500, dur:1500, c:gd ? "#ff3d7f" : "#ff8a3d", n:boss.name};
        V.shake = 10;
        sqSay(gd ? `<b style="color:#ff3d7f">${esc(boss.name)}</b> maintient le verrou.` : `<b style="color:#ff8a3d">${esc(boss.name)}</b> garde le sommet de l'aile.`);
      } else V.banner = {txt:"VAGUE " + (e.n + 1), c:"#ffffff", t0:now, big:true};
      const w = document.getElementById("sqwave"); if(w) w.innerHTML = sqWaveDots();
      return last && boss ? 2100 : 1250;
    }
    case "end": V.banner = {txt:e.win ? "VICTOIRE" : "DÉFAITE", c:e.win ? "#ffd84a" : "#ff3d7f", t0:now, big:true};
      if(e.win) for(const u of SQB.allies) if(u._v && !u._v.ko) u._v.pose = {anim:sqHasAnim(u.id, "charge") ? "charge" : "attack", t0:now + 200, len:700};
      if(typeof Sfx !== "undefined") e.win ? Sfx.win() : Sfx.lose();
      return 1300;
  }
  return 100;
}
function sqPop(u, txt, c, o){
  /* les chiffres d'un même Pokémon s'empilent au lieu de se recouvrir */
  const same = SQV.pops.filter(p=>p.u === u && SQV.t - p.t0 < 260 && !p.small).length;
  SQV.pops.push({u, txt, c, t0:SQV.t, big:!!o.big, small:!!o.small, dy:(o.dy || 0) - (o.small ? 0 : same * 16)});
}

/* ---------- la Synchro : un bouton-jauge ---------- */
function sqSyncBtn(){
  const b = document.getElementById("sqsync"); if(!b || !SQV) return;
  const p = Math.round(SQV.sync || 0), ready = p >= SQ_SYNC_MAX && !!SQV.wait;
  b.style.setProperty("--p", p);
  b.classList.toggle("full", p >= SQ_SYNC_MAX);
  b.disabled = !ready;
  const v = document.getElementById("sqsyncv"); if(v) v.textContent = p >= SQ_SYNC_MAX ? "PRÊTE" : p + " %";
}

/* ---------- l'ordre des prochains tours ---------- */
function sqOrder(){
  const el = document.getElementById("sqorder"); if(!el || !SQB) return;
  const list = sqPredict(SQB, 8);
  el.innerHTML = list.map((u, i)=>`<span class="sq2-o ${u.side} ${i === 0 ? "now" : ""} ${u.boss ? "boss" : ""}">${sprite(u.id, u.shiny, "")}</span>`).join("");
}

/* ---------- les boutons de compétence ---------- */
function sqDrawSkills(){
  const host = document.getElementById("sqskills"); if(!host || !SQB) return;
  sqSyncBtn();
  const u = SQV && SQV.wait;
  if(!u){
    host.innerHTML = `<div class="sq2-wait">${sqState().auto ? "AUTO" : SQV && SQV.active && SQV.active.side === "foe" ? "Tour adverse…" : "…"}</div>`;
    return;
  }
  host.innerHTML = u.skills.map((s, i)=>{
    const cd = u.cds[i];
    return `<button class="sq2-skb ${SQV.pick === i ? "on" : ""} ${cd ? "cd" : ""} k-${s.kind}" data-i="${i}" style="--sc:${sqCol(s.t)}" ${cd ? "disabled" : ""}>
      <span class="sq2-skic">${ic(SQ_KIND_IC[s.kind])}${i === 2 ? `<i class="sq2-ult">ULT</i>` : ""}</span>${cd ? `<span class="sq2-cd">${cd}</span>` : ""}
      <small>${esc(s.n)}</small><em class="sq2-lv">${"◆".repeat(s.lv || 1)}</em></button>`;
  }).join("");
  /* toucher : choisir ; garder le doigt : lire la description */
  host.querySelectorAll(".sq2-skb").forEach(b=>{
    let timer = null;
    b.addEventListener("pointerdown", ()=>{ timer = setTimeout(()=>{ sqTip(+b.dataset.i); timer = "tip"; }, 380); });
    const up = () => { if(timer === "tip"){ sqTip(-1); timer = null; return; } clearTimeout(timer); timer = null; sqPickSkill(+b.dataset.i); };
    b.addEventListener("pointerup", up);
    b.addEventListener("pointerleave", ()=>{ if(timer && timer !== "tip") clearTimeout(timer); if(timer === "tip") sqTip(-1); timer = null; });
  });
}
function sqTip(i){
  const el = document.getElementById("sqtip"); if(!el) return;
  if(i < 0 || !SQV.wait){ el.classList.remove("on"); return; }
  const s = SQV.wait.skills[i];
  el.innerHTML = `<b style="color:${sqCol(s.t)}">${esc(s.n)}</b> <span class="tt t${s.t}">${TYPE_NAMES[s.t]}</span> <span class="sq-lv">${"◆".repeat(s.lv || 1)}</span><div>${esc(sqDescribe(s))}</div>`;
  el.classList.add("on");
}
function sqPickSkill(i){
  if(!SQV || !SQV.wait) return;
  const u = SQV.wait, s = u.skills[i];
  if(u.cds[i]) return;
  /* une compétence d'équipe ou de zone se lance au second toucher */
  if(SQV.pick === i && s.kind !== "atk"){ sqDoAct(u, {si:i, ti:0}); return; }
  SQV.pick = i; sqDrawSkills(); sqSayPick();
}
function sqTap(x, y){
  if(!SQV || !SQV.wait || !SQB) return;
  const u = SQV.wait, sk = u.skills[SQV.pick];
  if(sk.kind !== "atk"){ sqDoAct(u, {si:SQV.pick, ti:0}); return; }
  let best = null, bd = 76;
  for(const f of SQV.foes){ if(f.hp <= 0 || !f._v.pos) continue; const p = f._v.pos, d = Math.hypot(p.x - x, p.y - p.s * 0.35 - y); if(d < bd){ bd = d; best = f; } }
  if(!best) return;
  const ti = SQB.foes.indexOf(best);
  if(ti >= 0) sqDoAct(u, {si:SQV.pick, ti});
}

/* ============================================================
   3. LE DESSIN
   ============================================================ */
/* l'équipe en bas à gauche, tournée vers le haut-droite ; les adversaires en haut à droite */
const SQ_POS_A = [[0.41, 0.66], [0.19, 0.61], [0.35, 0.87], [0.13, 0.83]];
const SQ_POS_F = [[0.60, 0.45], [0.84, 0.47], [0.68, 0.27], [0.90, 0.29]];
function sqFightAfter(){
  const cv = document.getElementById("sqcv"); if(!cv) return;
  const host = cv.parentElement, W = Math.max(300, host.clientWidth);
  /* la scène prend la hauteur qui reste une fois le pupitre posé : tout tient sans défiler */
  const scr = document.getElementById("screen"), room = (scr && scr.clientHeight) || window.innerHeight * 0.8;
  const H = Math.round(Math.min(580, Math.max(300, room - 184)));
  const d = Math.min(3, window.devicePixelRatio || 1);
  cv.width = W * d; cv.height = H * d; cv.style.height = H + "px"; host.style.height = H + "px";
  SQV.cv = cv; SQV.W = W; SQV.H = H; SQV.d = d;
  const biome = SQB.final ? "zero" : SQB.lock ? "lock" : SQ_ZONES[SQB.z].biome;
  SQV.scene = sqPaintScene(biome, W, H, SQB.z * 131 + 7);
  cv.addEventListener("pointerdown", e=>{ const r = cv.getBoundingClientRect(); sqTap(e.clientX - r.left, e.clientY - r.top); });
  sqDrawSkills(); sqOrder();
  if(!SQV.raf) SQV.raf = requestAnimationFrame(sqFrame);
}
function sqUnitPos(u, i, list){
  const W = SQV.W, H = SQV.H;
  let p;
  if(u.side === "ally") p = SQ_POS_A[i] || SQ_POS_A[0];
  else if(u.boss) p = [0.73, 0.36];
  else if(list.some(f=>f.boss)) p = i === 0 ? [0.50, 0.46] : i === 2 ? [0.92, 0.50] : [0.60, 0.25];
  else p = SQ_POS_F[i] || SQ_POS_F[0];
  /* la profondeur : ce qui est plus bas est plus proche, donc plus grand */
  const s = (u.mn ? 146 : u.guardian ? 128 : u.boss ? 108 : 68) * (0.74 + p[1] * 0.5) * Math.max(0.74, Math.min(1.08, H / 500));
  return {x:p[0] * W, y:p[1] * H, s};
}

/* ---------- les sprites PMD, ancrés aux pieds ----------
   Toutes les poses d'une espèce partagent le même centre d'image : on
   les cale sur ce centre, et le centre sur les pieds mesurés de la
   marche. Le Pokémon ne saute plus d'une pose à l'autre. */
function sqHasAnim(id, a){ return typeof PMD_ANIM !== "undefined" && PMD_ANIM[id] && !!PMD_ANIM[id][a]; }
function sqFeet(id){
  const F = typeof pmdFit === "function" ? pmdFit(id) : null;
  if(!F) return null;
  return {feet:F.box.y1 - F.fh / 2, top:F.box.y0 - F.fh / 2};
}
function sqSprDraw(x, id, anim, V, dir, t, cx, cy, size, loop){
  if(typeof PMD_META === "undefined" || !PMD_META[id]) return false;
  let sheet, m;
  if(anim === "walk"){ sheet = brPmdVariant(id, V); m = PMD_META[id]; }
  else { if(!sqHasAnim(id, anim)) return false; sheet = brAnimSheet(id, anim, V); m = PMD_ANIM[id][anim]; }
  if(!sheet) return false;
  const fw = m[0], fh = m[1], dur = m[3], n = m[2];
  let total = 0; for(const d of dur) total += d;
  let k = t === null ? 0 : Math.floor(t * 60);
  if(loop) k = ((k % total) + total) % total;
  let f = dur.length - 1;
  for(let i = 0; i < dur.length; i++){ if(k < dur[i]){ f = i; break; } k -= dur[i]; }
  const wm = PMD_META[id], sc = Math.min(size / 34, size * 2.1 / wm[1]);
  const ft = sqFeet(id), feet = ft ? ft.feet : wm[1] * 0.3;
  const w = fw * sc, h = fh * sc, ccy = cy - feet * sc;
  x.drawImage(sheet, Math.min(f, n - 1) * fw, dir * fh, fw, fh, Math.round(cx - w / 2), Math.round(ccy - h / 2), Math.round(w), Math.round(h));
  return true;
}
/* le haut de la tête, pour la flèche de visée */
function sqHeadY(u){
  const p = u._v.pos, wm = typeof PMD_META !== "undefined" && PMD_META[u.id];
  const ft = wm && sqFeet(u.id);
  if(!ft) return p.y - p.s * 0.9;
  const sc = Math.min(p.s / 34, p.s * 2.1 / wm[1]);
  return p.y - (ft.feet - ft.top) * sc;
}

function sqFrame(now){
  if(!SQV || !SQV.cv || !SQV.cv.isConnected){ if(SQV) SQV.raf = 0; return; }
  SQV.raf = requestAnimationFrame(sqFrame);
  const real = Math.min(100, now - (SQV.last || now)); SQV.last = now;
  /* un coup qui porte fige l'image un instant */
  const frozen = SQV.hitstop && SQV.t < SQV.hitstop;
  const dt = real * sqSp() * (frozen ? 0.15 : 1); SQV.t += dt;
  const x = SQV.cv.getContext("2d"), W = SQV.W, H = SQV.H, t = SQV.t;
  x.setTransform(SQV.d, 0, 0, SQV.d, 0, 0);
  x.imageSmoothingEnabled = false;
  SQV.shake *= Math.pow(0.86, real / 16);
  if(typeof calmFx === "function" && calmFx()) SQV.shake = 0;
  x.save(); x.translate((Math.random() - 0.5) * SQV.shake, (Math.random() - 0.5) * SQV.shake);
  x.drawImage(SQV.scene.cv, -6, -6, W + 12, H + 12);
  sqAmbient(x, t, dt, false);
  const units = [...SQB.allies.map((u, i)=>[u, i, SQB.allies]), ...SQV.foes.map((u, i)=>[u, i, SQV.foes])];
  units.forEach(([u, i, l])=>{ u._v = u._v || {hp:u.hp, trail:u.hp, sh:0}; u._v.pos = sqUnitPos(u, i, l); });
  units.sort((a, b)=>a[0]._v.pos.y - b[0]._v.pos.y);
  /* l'ultime et l'entrée du boss : l'arène s'assombrit, le héros reste dans la lumière */
  const C = SQV.cut && t - SQV.cut.t0 < SQV.cut.dur && t >= SQV.cut.t0 ? SQV.cut : null;
  const hero = C && C.u && C.kind === "ult" ? C.u : null;
  for(const [u] of units) if(u !== hero) sqDrawUnit(x, u, t);
  if(hero){
    const k = (t - C.t0) / C.dur, a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    x.fillStyle = `rgba(2,4,10,${0.6 * a})`; x.fillRect(-10, -10, W + 20, H + 20);
    const p = hero._v.pos;
    const g = x.createRadialGradient(p.x, p.y - p.s * 0.4, 0, p.x, p.y - p.s * 0.4, p.s * 1.5);
    g.addColorStop(0, sqRgba(C.c, 0.6 * a)); g.addColorStop(1, sqRgba(C.c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y - p.s * 0.4, p.s * 1.5, 0, 7); x.fill();
    sqDrawUnit(x, hero, t);
  }
  sqDrawFx(x, t, dt);
  sqAmbient(x, t, dt, true);
  /* les plaques de vie, toujours au-dessus des sprites */
  for(const [u] of units) sqDrawPlate(x, u, t, dt);
  sqDrawAim(x, t);
  x.restore();
  sqDrawPops(x, t);
  sqDrawLoot(x, t, dt);
  sqDrawBanner(x, t);
  if(C) sqDrawCut(x, C, t);
  sqBossBar();
}

function sqDrawUnit(x, u, t){
  const v = u._v, p = v.pos, size = p.s;
  let a = 1;
  if(v.ko){ a = Math.max(0, 1 - (t - v.ko) / 620); if(a <= 0) return; }
  const dir = u.side === "ally" ? 3 : 7;
  let cx = p.x, cy = p.y, walking = false;
  /* l'entrée : il arrive en marchant depuis le bord de l'écran */
  if(v.enter){
    const k = (t - v.enter.t0) / v.enter.dur;
    if(k < 0) return;
    if(k < 1){
      const e = 1 - Math.pow(1 - k, 2), dx = v.enter.side === "ally" ? -SQV.W * 0.45 : SQV.W * 0.45, dy = v.enter.side === "ally" ? SQV.H * 0.22 : -SQV.H * 0.18;
      cx += dx * (1 - e); cy += dy * (1 - e); walking = true; a *= Math.min(1, k * 3);
    }
  }
  if(v.lunge && t >= v.lunge.t0 && t - v.lunge.t0 < 380){
    const q = Math.sin((t - v.lunge.t0) / 380 * Math.PI) * 0.55;
    cx += (v.lunge.to.x - p.x) * q; cy += (v.lunge.to.y - p.y) * q;
  }
  if(v.hurt && t - v.hurt < 220){ const k = 1 - (t - v.hurt) / 220; cx += (u.side === "ally" ? -1 : 1) * 7 * k; cy += (u.side === "ally" ? 1 : -1) * 4 * k; }
  if(v.ko) cy += (t - v.ko) / 620 * 10;
  v.draw = {x:cx, y:cy};
  /* l'ombre ; l'anneau du Pokémon qui joue */
  x.fillStyle = "rgba(0,0,0,.38)"; x.beginPath(); x.ellipse(cx, cy + 2, size * 0.32, size * 0.11, 0, 0, 7); x.fill();
  if(SQV.active === u && !SQB.over && v.hp > 0 && !walking){
    const c = u.side === "ally" ? "#5cf0ff" : "#ff5c7a";
    x.strokeStyle = c; x.lineWidth = 2.5; x.globalAlpha = 0.6 + Math.sin(t / 130) * 0.3;
    x.beginPath(); x.ellipse(cx, cy + 2, size * 0.42 + Math.sin(t / 130) * 2, size * 0.15, 0, 0, 7); x.stroke();
    x.globalAlpha = 1;
  }
  if(v.glow && t - v.glow.t0 < 500){ const k = (t - v.glow.t0) / 500, gr = x.createRadialGradient(cx, cy - size * 0.35, 0, cx, cy - size * 0.35, size * 0.6);
    gr.addColorStop(0, sqRgba(v.glow.c, 0.5 * (1 - k))); gr.addColorStop(1, sqRgba(v.glow.c, 0)); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy - size * 0.35, size * 0.6, 0, 7); x.fill(); }
  /* MissingNo n'a pas de planche : il se dessine lui-même, en se déchirant */
  if(u.mn && typeof fnDrawMN === "function"){ fnDrawMN(x, u, t, cx, cy, size, a); return; }
  const white = (v.flash && t - v.flash < 90) || (v.ko && t - v.ko < 120);
  /* un écho : ton Pokémon, aux couleurs de la faille */
  const V = white ? "w" : u.echo ? "c" : typeof eraVar === "function" ? eraVar(u.id, u.shiny ? "s" : "n", u.side === "ally") : u.shiny ? "s" : "n";
  x.globalAlpha = a;
  let ok = false;
  const pose = v.pose && t >= v.pose.t0 && t - v.pose.t0 < v.pose.len ? v.pose : v.pose2 && t >= v.pose2.t0 && t - v.pose2.t0 < v.pose2.len ? v.pose2 : null;
  if(pose) ok = sqSprDraw(x, u.id, pose.anim, V, dir, (t - pose.t0) / 1000, cx, cy, size, pose.anim === "charge");
  if(!ok && v.hurt && t - v.hurt < 300) ok = sqSprDraw(x, u.id, "hurt", V, dir, (t - v.hurt) / 1600, cx, cy, size, false);
  if(!ok && walking) ok = sqSprDraw(x, u.id, "walk", V, dir, t / 1000 * 1.6, cx, cy, size, true);
  /* au repos : la pose Idle ; les Pokémon qui flottent marchent sur place, comme dans Donjon Mystère */
  if(!ok){
    const tt = t / 1000 + (u.side === "ally" ? 0.37 : 0.81) * (SQB.allies.indexOf(u) + SQV.foes.indexOf(u) + 2);
    if(sqHasAnim(u.id, "idle")) ok = sqSprDraw(x, u.id, "idle", V, dir, tt, cx, cy, size, true);
    else if(typeof PMD_IDLE_WALK !== "undefined" && PMD_IDLE_WALK.includes(u.id)) ok = sqSprDraw(x, u.id, "walk", V, dir, tt * 0.7, cx, cy, size, true);
    else ok = sqSprDraw(x, u.id, "walk", V, dir, null, cx, cy + Math.sin(tt * 3) * 0.6, size, false);
  }
  if(!ok && typeof brSprite === "function"){ const s = brSprite(u.id, V[0] === "e" ? V : u.shiny ? "s" : "n"); if(s) x.drawImage(s, cx - size / 2, cy - size * 0.8, size, size); }
  x.globalAlpha = 1;
}

/* ---------- la plaque : sous les pieds, dessinée après tous les sprites ---------- */
const SQ_FXCOL = {brn:"#ff8a3d", psn:"#b86bff", stun:"#ffe45e", slow:"#9fd8f8", defdn:"#ff3d7f", atkdn:"#ff3d7f", atkup:"#35f0d6", defup:"#35f0d6", spdup:"#35f0d6", shield:"#c8d8ff"};
const SQ_FXLET = {brn:"B", psn:"P", stun:"É", slow:"R", defdn:"D", atkdn:"A", atkup:"A", defup:"D", spdup:"V", shield:"◈"};
function sqDrawPlate(x, u, t, dt){
  const v = u._v; if(!v || !v.draw) return;
  if(v.ko || v.hp <= 0) return;
  if(v.enter && t - v.enter.t0 < v.enter.dur * 0.8) return;
  /* la traînée rattrape la barre, après un court instant */
  if(v.trail > v.hp && (!v.trailHold || t > v.trailHold)) v.trail = Math.max(v.hp, v.trail - Math.max(u.maxHp * 0.0009 * dt, (v.trail - v.hp) * 0.006 * dt));
  if(v.trail < v.hp) v.trail = v.hp;
  const bw = u.boss ? 86 : 54, cx = v.draw.x, by = Math.round(v.draw.y + 9), bx = Math.round(cx - bw / 2);
  x.fillStyle = "rgba(4,7,14,.82)"; sqRound(x, bx - 3, by - 3, bw + 6, 12, 3); x.fill();
  /* le type, le niveau */
  x.fillStyle = sqCol(u.types[0]); x.beginPath(); x.arc(bx - 8, by + 3, 4.5, 0, 7); x.fill();
  x.strokeStyle = "#000"; x.lineWidth = 1.5; x.stroke();
  const r = Math.max(0, v.hp / u.maxHp), tr = Math.max(0, v.trail / u.maxHp);
  x.fillStyle = "rgba(255,255,255,.08)"; x.fillRect(bx, by, bw, 5);
  x.fillStyle = "#ffe9c8"; x.fillRect(bx, by, Math.round(bw * tr), 5);
  x.fillStyle = u.side === "ally" ? (r > 0.5 ? "#5ce07a" : r > 0.25 ? "#ffc857" : "#ff3d7f") : (r > 0.25 ? "#ff5a4a" : "#ff2d6a");
  x.fillRect(bx, by, Math.round(bw * r), 5);
  x.fillStyle = "rgba(255,255,255,.28)"; x.fillRect(bx, by, Math.round(bw * r), 1);
  const sh = Math.min(v.sh || 0, u.shield || 0);
  if(sh > 0){ x.fillStyle = "#e8f0ff"; x.fillRect(bx, by - 2, Math.min(bw, Math.round(bw * sh / u.maxHp)), 2); }
  /* la jauge de tour */
  x.fillStyle = "rgba(92,200,255,.18)"; x.fillRect(bx, by + 6, bw, 2);
  x.fillStyle = "#5cc8ff"; x.fillRect(bx, by + 6, Math.round(bw * Math.min(1, u.gauge / 100)), 2);
  x.font = '6px "Press Start 2P",monospace'; x.textAlign = "left"; x.textBaseline = "middle";
  x.fillStyle = "#e8f0ff"; x.fillText(String(u.level), bx + bw + 5, by + 3);
  /* les effets, avec leur durée */
  u.fx.slice(0, 6).forEach((e, k)=>{
    const ex = bx + k * 10, ey = by + 11;
    x.fillStyle = SQ_FXCOL[e.k] || "#fff"; x.fillRect(ex, ey, 9, 8);
    x.strokeStyle = "#000"; x.lineWidth = 1; x.strokeRect(ex + .5, ey + .5, 8, 7);
    x.font = '5px "Press Start 2P",monospace'; x.fillStyle = "#000"; x.textAlign = "center"; x.fillText(SQ_FXLET[e.k] || "?", ex + 4.5, ey + 4.5);
  });
}
function sqRgb(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function sqRgba(h, a){ if(!h || h[0] !== "#") return `rgba(255,255,255,${a})`; const c = sqRgb(h.length === 4 ? "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function sqRound(x, X, Y, w, h, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

/* ---------- la visée : la flèche, et l'efficacité de la compétence sur chacun ---------- */
function sqDrawAim(x, t){
  const u = SQV.wait; if(!u) return;
  const sk = u.skills[SQV.pick]; if(!sk || sk.kind === "team") return;
  for(const f of SQV.foes){
    if(f.hp <= 0 || !f._v.draw || f._v.ko) continue;
    const e = Math.min(2, typeMult(sk.t, f.types) || 0.25);
    const px = f._v.draw.x + (f.boss ? 50 : 36), py = f._v.draw.y + 12;
    if(e >= 2){ x.fillStyle = "#5ce07a"; x.font = '7px "Press Start 2P",monospace'; x.textAlign = "left"; x.lineWidth = 3; x.strokeStyle = "#000"; x.strokeText("▲▲", px, py); x.fillText("▲▲", px, py); }
    else if(e < 1){ x.fillStyle = "#9fb0c8"; x.font = '7px "Press Start 2P",monospace'; x.textAlign = "left"; x.lineWidth = 3; x.strokeStyle = "#000"; x.strokeText("▼", px, py); x.fillText("▼", px, py); }
  }
  const tg = sk.kind === "atk" && SQV.target && SQV.target.hp > 0 ? SQV.target : null;
  if(tg && tg._v.draw){
    const hx = tg._v.draw.x, yy = sqHeadY(tg) - 14 + Math.sin(t / 140) * 4;
    x.fillStyle = "#ff3d4f"; x.strokeStyle = "#3a0008"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(hx - 9, yy - 8); x.lineTo(hx + 9, yy - 8); x.lineTo(hx, yy + 4); x.closePath(); x.fill(); x.stroke();
  }
}

/* ---------- les effets : projectiles, ondes de zone, impacts, particules ---------- */
function sqDrawFx(x, t, dt){
  x.globalCompositeOperation = "lighter";
  for(let i = SQV.orbs.length - 1; i >= 0; i--){
    const o = SQV.orbs[i], k = (t - o.t0) / o.dur;
    if(k < 0) continue; if(k >= 1){ SQV.orbs.splice(i, 1); continue; }
    const a = o.from._v.pos, b = o.to._v.pos; if(!a || !b) continue;
    const ox = a.x + (b.x - a.x) * k, oy = a.y - a.s * 0.4 + (b.y - b.s * 0.4 - (a.y - a.s * 0.4)) * k - Math.sin(k * Math.PI) * 26;
    const g = x.createRadialGradient(ox, oy, 0, ox, oy, 12); g.addColorStop(0, "#fff"); g.addColorStop(0.4, o.c); g.addColorStop(1, sqRgba(o.c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(ox, oy, 12, 0, 7); x.fill();
    SQV.parts.push({x:ox, y:oy, vx:0, vy:0, life:0, max:180, c:o.c, s:3});
  }
  /* une onde de zone balaie tout le camp adverse d'un coup ; un soutien enveloppe le sien */
  for(let i = SQV.waves.length - 1; i >= 0; i--){
    const w = SQV.waves[i], k = (t - w.t0) / w.dur;
    if(k < 0) continue; if(k >= 1){ SQV.waves.splice(i, 1); continue; }
    const tgtSide = w.team ? w.side : w.side === "ally" ? "foe" : "ally";
    const cx = tgtSide === "foe" ? SQV.W * 0.74 : SQV.W * 0.27, cy = tgtSide === "foe" ? SQV.H * 0.38 : SQV.H * 0.74;
    const r = 20 + k * SQV.W * 0.42;
    x.globalAlpha = (1 - k) * 0.85; x.strokeStyle = w.c; x.lineWidth = 10 * (1 - k) + 2;
    x.beginPath(); x.ellipse(cx, cy, r, r * 0.42, 0, 0, 7); x.stroke();
    x.globalAlpha = (1 - k) * 0.25; x.fillStyle = w.c; x.beginPath(); x.ellipse(cx, cy, r, r * 0.42, 0, 0, 7); x.fill();
    if(w.team && Math.random() < 0.5) for(const a of (w.side === "ally" ? SQB.allies : SQV.foes)) if(a._v.draw && !a._v.ko && a.hp > 0) SQV.parts.push({x:a._v.draw.x + (Math.random() - 0.5) * 30, y:a._v.draw.y - Math.random() * 30, vx:0, vy:-0.05, life:0, max:500, c:w.c, s:2.5});
  }
  x.globalAlpha = 1;
  for(let i = SQV.rings.length - 1; i >= 0; i--){
    const r = SQV.rings[i], k = (t - r.t0) / 340;
    if(k >= 1){ SQV.rings.splice(i, 1); continue; }
    const p = r.u._v.draw || r.u._v.pos; if(!p) continue;
    x.globalAlpha = 1 - k; x.strokeStyle = r.c; x.lineWidth = 3 * (1 - k) + 1;
    x.beginPath(); x.ellipse(p.x, p.y - (r.u._v.pos.s) * 0.35, r.u._v.pos.s * 0.6 * k + 6, r.u._v.pos.s * 0.6 * k + 6, 0, 0, 7); x.stroke();
  }
  x.globalAlpha = 1;
  for(let i = SQV.parts.length - 1; i >= 0; i--){
    const p = SQV.parts[i]; p.life += dt;
    if(p.life > p.max){ SQV.parts.splice(i, 1); continue; }
    if(p.life < 0) continue;
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g === undefined ? 0.0002 : p.g) * dt;
    const k = p.life / p.max;
    x.globalAlpha = 1 - k; x.fillStyle = p.c;
    if(p.sh === "bolt"){
      x.strokeStyle = p.c; x.lineWidth = 2; x.beginPath(); x.moveTo(p.x, p.y);
      let bx = p.x, by = p.y; for(let s = 0; s < 4; s++){ bx += p.vx * 60 + (Math.random() - 0.5) * 10; by += p.vy * 60 + (Math.random() - 0.5) * 10; x.lineTo(bx, by); }
      x.stroke();
    } else if(p.sh === "ring"){
      x.strokeStyle = p.c; x.lineWidth = 2; x.beginPath(); x.arc(p.x, p.y, Math.max(0.5, 4 + k * 26), 0, 7); x.stroke();
    } else if(p.sh === "leaf"){
      x.save(); x.translate(p.x, p.y); x.rotate(p.life / 90); x.fillRect(-p.s, -p.s / 3, p.s * 2, p.s * 0.7); x.restore();
    } else if(p.sh === "soft"){
      const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 2); g.addColorStop(0, p.c); g.addColorStop(1, sqRgba(p.c.length === 7 ? p.c : "#ffffff", 0));
      x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.s * 2, 0, 7); x.fill();
    } else x.fillRect(p.x, p.y, p.s, p.s);
  }
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
}
function sqBurst(u, c, n, up){
  const p = u._v && (u._v.draw || u._v.pos); if(!p) return;
  const s = u._v.pos ? u._v.pos.s : 60;
  for(let i = 0; i < n; i++){
    const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.4 : Math.random() * 6.3, v = 0.05 + Math.random() * 0.12;
    SQV.parts.push({x:p.x, y:p.y - s * 0.35, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:0, max:300 + Math.random() * 300, c, s:2 + Math.random() * 3});
  }
}
/* l'impact a la couleur et la forme de son type */
const SQ_IMPACT = {
  10:{c:["#ff8a3d", "#ffd24a", "#ff3d2a"], m:"rise"}, 11:{c:["#58a8e8", "#9fd8f8", "#ffffff"], m:"splash"}, 13:{c:["#ffe45e", "#fff6b0"], m:"bolt"},
  12:{c:["#5ce07a", "#9dff6b"], m:"leaf"}, 7:{c:["#9dcc3a", "#d0ff6a"], m:"leaf"}, 15:{c:["#c8f0ff", "#ffffff", "#7fd0ff"], m:"shard"},
  5:{c:["#c8a26a", "#8a6a48"], m:"debris"}, 6:{c:["#a8865a", "#6a5038"], m:"debris"}, 14:{c:["#ff6ad5", "#ffb0ea"], m:"ring"},
  8:{c:["#9b6bff", "#c0a0ff"], m:"wisp"}, 17:{c:["#7a5a9a", "#c070ff"], m:"wisp"}, 4:{c:["#b86bff", "#e0a0ff"], m:"wisp"},
  2:{c:["#ffffff", "#ffc857"], m:"star"}, 1:{c:["#ffffff", "#e8e0d0"], m:"star"}, 16:{c:["#7a5cff", "#35f0d6"], m:"ring"},
  3:{c:["#e8f4ff", "#ffffff"], m:"star"}, 9:{c:["#c8d0d8", "#ffffff"], m:"shard"}, 18:{c:["#ff9ad8", "#ffffff"], m:"star"}
};
function sqImpact(u, type, big){
  const p = u._v && (u._v.draw || u._v.pos); if(!p) return;
  const st = SQ_IMPACT[type] || SQ_IMPACT[1], s = u._v.pos ? u._v.pos.s : 60;
  const cx = p.x, cy = p.y - s * 0.38, n = big ? 22 : 13;
  SQV.rings.push({u, c:st.c[0], t0:SQV.t});
  const pc = () => st.c[Math.floor(Math.random() * st.c.length)];
  for(let i = 0; i < n; i++){
    const a = Math.random() * 6.3, v = 0.05 + Math.random() * 0.13;
    const P = {x:cx + (Math.random() - 0.5) * 10, y:cy + (Math.random() - 0.5) * 10, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:0, max:280 + Math.random() * 320, c:pc(), s:2 + Math.random() * 3};
    if(st.m === "rise"){ P.vx *= 0.4; P.vy = -0.06 - Math.random() * 0.1; P.g = -0.00005; P.sh = "soft"; P.s = 2 + Math.random() * 2; }
    if(st.m === "splash"){ P.vy = -0.08 - Math.random() * 0.1; P.g = 0.0006; }
    if(st.m === "leaf"){ P.sh = "leaf"; P.g = 0.00008; }
    if(st.m === "debris"){ P.vy = -0.05 - Math.random() * 0.12; P.g = 0.0008; P.s = 2 + Math.random() * 4; }
    if(st.m === "wisp"){ P.sh = "soft"; P.vx *= 0.3; P.vy = -0.03 - Math.random() * 0.05; P.g = 0; }
    if(st.m === "shard"){ P.g = 0.0003; P.s = 1.5 + Math.random() * 2.5; }
    SQV.parts.push(P);
  }
  if(st.m === "bolt") for(let i = 0; i < (big ? 5 : 3); i++){ const a = Math.random() * 6.3; SQV.parts.push({x:cx, y:cy, vx:Math.cos(a) * 0.12, vy:Math.sin(a) * 0.12, life:0, max:150, c:pc(), s:2, sh:"bolt", g:0}); }
  if(st.m === "ring") for(let i = 0; i < 2; i++) SQV.parts.push({x:cx, y:cy, vx:0, vy:0, life:-i * 90, max:360, c:pc(), s:2, sh:"ring", g:0});
}

/* ---------- les chiffres ---------- */
function sqDrawPops(x, t){
  x.textAlign = "center"; x.textBaseline = "middle";
  for(let i = SQV.pops.length - 1; i >= 0; i--){
    const p = SQV.pops[i], k = (t - p.t0) / 950;
    const pos = p.u._v && (p.u._v.draw || p.u._v.pos);
    if(k >= 1 || !pos){ SQV.pops.splice(i, 1); continue; }
    const s = p.u._v.pos ? p.u._v.pos.s : 60;
    const sc = k < 0.12 ? 0.6 + k / 0.12 * 0.7 : 1.3 - Math.min(0.3, (k - 0.12) * 1.2);
    x.font = `${Math.round((p.small ? 7 : p.big ? 18 : 13) * sc)}px "Press Start 2P",monospace`;
    x.globalAlpha = k > 0.72 ? (1 - k) / 0.28 : 1;
    const y = pos.y - s * 0.95 + (p.dy || 0) - k * 28;
    x.lineWidth = 4; x.strokeStyle = "#000"; x.strokeText(p.txt, pos.x, y); x.fillStyle = p.c; x.fillText(p.txt, pos.x, y);
  }
  x.globalAlpha = 1;
}
function sqDrawBanner(x, t){
  const Bn = SQV.banner; if(!Bn) return;
  const W = SQV.W, H = SQV.H;
  const k = (t - Bn.t0) / (Bn.big ? 1100 : 760);
  if(k < 0) return;
  if(k >= 1){ SQV.banner = null; return; }
  x.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
  x.textAlign = "center"; x.textBaseline = "middle";
  if(Bn.big){
    const gy = H * 0.5;
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.2, "rgba(0,0,0,.72)"); g.addColorStop(0.8, "rgba(0,0,0,.72)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, gy - 30, W, 60);
    x.fillStyle = sqRgba(Bn.c, 0.9); x.fillRect(W * 0.2, gy - 30, W * 0.6, 1.5); x.fillRect(W * 0.2, gy + 28.5, W * 0.6, 1.5);
    const sc = k < 0.15 ? 1.3 - k * 2 : 1;
    x.font = `${Math.round(22 * sc)}px "Press Start 2P",monospace`; x.lineWidth = 5; x.strokeStyle = "#000"; x.strokeText(Bn.txt, W / 2, gy + 1); x.fillStyle = Bn.c; x.fillText(Bn.txt, W / 2, gy + 1);
  } else {
    x.font = '9px "Press Start 2P",monospace';
    const w = x.measureText(Bn.txt).width + 24, cx = W / 2, cy = 96;
    x.fillStyle = "rgba(5,9,18,.9)"; x.fillRect(cx - w / 2, cy - 12, w, 24); x.strokeStyle = Bn.c; x.lineWidth = 1.5; x.strokeRect(cx - w / 2 + .5, cy - 11.5, w - 1, 23);
    x.fillStyle = Bn.c; x.fillRect(cx - w / 2, cy - 12, 3, 24);
    x.fillStyle = "#fff"; x.fillText(Bn.txt, cx, cy + 1);
  }
  x.globalAlpha = 1;
}

/* ---------- la coupure : l'ultime, la Synchro, l'entrée du boss ---------- */
function sqDrawCut(x, C, t){
  const W = SQV.W, H = SQV.H, k = (t - C.t0) / C.dur;
  const inK = Math.min(1, k / 0.18), outK = k > 0.78 ? (k - 0.78) / 0.22 : 0;
  const right = C.kind === "boss" || (C.u && C.u.side === "foe");
  const slide = (1 - Math.pow(1 - inK, 3)) - outK * outK;
  const cy = C.kind === "boss" ? H * 0.5 : H * 0.42, bh = C.kind === "sync" ? 96 : 84;
  x.save();
  x.globalAlpha = Math.max(0, Math.min(1, slide * 1.2));
  x.translate(right ? W * (1 - slide) : -W * (1 - slide), 0);
  /* la bande en biais */
  x.beginPath(); x.moveTo(-20, cy - bh / 2 + 16); x.lineTo(W + 20, cy - bh / 2 - 16); x.lineTo(W + 20, cy + bh / 2 - 16); x.lineTo(-20, cy + bh / 2 + 16); x.closePath();
  const g = x.createLinearGradient(0, cy - bh, W, cy + bh); g.addColorStop(0, "rgba(4,6,14,.94)"); g.addColorStop(0.5, sqRgba(C.c, 0.55)); g.addColorStop(1, "rgba(4,6,14,.94)");
  x.fillStyle = g; x.fill();
  x.strokeStyle = C.c; x.lineWidth = 2; x.stroke();
  x.clip();
  /* des traits de vitesse */
  x.globalCompositeOperation = "lighter";
  for(let i = 0; i < 14; i++){
    const yy = cy - bh / 2 + ((i * 37 + Math.floor(t / 16) * 13) % bh), len = 40 + (i * 53) % 90, xx = ((i * 97 + t * 0.9 * (right ? -1 : 1)) % (W + 200) + W + 200) % (W + 200) - 100;
    x.fillStyle = sqRgba(C.c, 0.35); x.fillRect(xx, yy, len, 1.5);
  }
  x.globalCompositeOperation = "source-over";
  /* le portrait */
  const drawMon = (u, px, py, sz) => {
    if(!u) return;
    const UV = typeof eraVar === "function" && !u.echo ? eraVar(u.id, u.shiny ? "s" : "n", u.side === "ally") : u.shiny ? "s" : "n";
    const ok = sqSprDraw(x, u.id, sqHasAnim(u.id, "charge") ? "charge" : "idle", UV, u.side === "ally" ? 2 : 6, (t - C.t0) / 1000, px, py, sz, true);
    if(!ok && typeof brSprite === "function"){ const s = brSprite(u.id, UV); if(s) x.drawImage(s, px - sz / 2, py - sz * 0.9, sz, sz); }
  };
  x.textBaseline = "middle";
  if(C.kind === "sync"){
    const al = SQB.allies.filter(a=>a._v && !a._v.ko);
    al.forEach((a, i)=>drawMon(a, W * (0.18 + i * 0.16), cy + 30, 64));
    x.textAlign = "right"; x.font = '20px "Press Start 2P",monospace'; x.lineWidth = 5; x.strokeStyle = "#000";
    x.strokeText("SYNCHRO", W - 18, cy - 14); x.fillStyle = "#35f0d6"; x.fillText("SYNCHRO", W - 18, cy - 14);
    x.font = '7px "Press Start 2P",monospace'; x.fillStyle = "#e8f0ff"; x.fillText("FRAPPE D'ÉQUIPE", W - 18, cy + 10);
  } else {
    const u = C.u;
    drawMon(u, right ? W * 0.76 : W * 0.24, cy + 34, C.kind === "boss" ? 120 : 104);
    x.textAlign = right ? "left" : "right";
    const tx = right ? 18 : W - 18;
    x.font = '7px "Press Start 2P",monospace'; x.fillStyle = "#e8f0ff";
    x.fillText(C.kind === "boss" ? (u.guardian ? "VERROU LÉGENDAIRE" : "BOSS DE L'AILE") : u.name.toUpperCase() + " · ULTIME", tx, cy - 22);
    const n = C.kind === "boss" ? u.name.toUpperCase() : C.n.toUpperCase();
    const fs = n.length > 13 ? 13 : n.length > 10 ? 16 : 19;
    x.font = `${fs}px "Press Start 2P",monospace`; x.lineWidth = 5; x.strokeStyle = "#000"; x.strokeText(n, tx, cy + 2); x.fillStyle = C.c; x.fillText(n, tx, cy + 2);
    if(C.kind === "boss"){ x.font = '7px "Press Start 2P",monospace'; x.fillStyle = "#c8d4e8"; x.fillText("NIVEAU " + u.level, tx, cy + 24); }
  }
  x.restore();
}

/* ---------- la barre du boss, en tête d'écran ---------- */
function sqBossBar(){
  const el = document.getElementById("sqtitle"); if(!el || !SQV) return;
  const b = SQV.foes.find(f=>f.boss && f._v && !f._v.ko && f._v.hp > 0 && (!f._v.enter || SQV.t - f._v.enter.t0 > 300));
  const key = b ? b.id + ":" + Math.round(b._v.hp) + ":" + Math.round(b._v.trail) + ":" + (b.phased ? 1 : 0) + (b.p2 ? 2 : 0) + (b.p3 ? 3 : 0) + b.name : "";
  if(key === SQV.bossKey) return;
  SQV.bossKey = key;
  if(!b){ if(el.dataset.boss){ el.dataset.boss = ""; el.innerHTML = el.dataset.name || el.innerHTML; } return; }
  if(!el.dataset.boss){ el.dataset.name = el.innerHTML; el.dataset.boss = "1"; }
  el.innerHTML = `<div class="sq2-bossbar ${b.guardian ? "gd" : ""} ${b.mn ? "mn" : ""}"><span>${b.mn ? (b.p3 ? "ENTRÉE 000 · NOMMÉE" : b.p2 ? "ENTRÉE 000 · COPIE" : "ENTRÉE 000") : b.guardian ? (b.phased ? "VERROU · RECONFIGURÉ" : "VERROU") : "BOSS"} · <b>${esc(b.name)}</b> N.${b.level}</span>
    <i><u style="width:${(b._v.trail / b.maxHp * 100).toFixed(1)}%"></u><s style="width:${(b._v.hp / b.maxHp * 100).toFixed(1)}%"></s></i></div>`;
}

/* ---------- le butin : il tombe, rebondit, puis rejoint le compteur ---------- */
function sqLootDrop(e){
  const t = e.tgt, p = t._v && (t._v.draw || t._v.pos); if(!p) return;
  const list = [];
  const nC = Math.min(6, 2 + Math.round(e.coins / 30));
  for(let i = 0; i < nC; i++) list.push({k:"coins", v:i === nC - 1 ? e.coins - Math.floor(e.coins / nC) * (nC - 1) : Math.floor(e.coins / nC), c:"#ffd24a"});
  if(e.scroll) list.push({k:"scrolls", v:e.scroll, c:"#b06bff", big:true});
  if(e.candy) list.push({k:"candy", v:e.candy, c:"#ff86c8", big:true});
  list.forEach((o, i)=>{
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
    SQV.loots.push(Object.assign(o, {x:p.x, y:p.y - 20, vx:Math.cos(a) * 0.12, vy:Math.sin(a) * 0.2 - 0.05, t0:SQV.t + i * 40, life:0, home:false}));
  });
  if(e.scroll){ sqPop(t, "+1 PARCHEMIN", "#d0a0ff", {small:true, dy:-44}); if(typeof arTone === "function") arTone(880, .15, "triangle", .04, 1320); }
}
function sqDrawLoot(x, t, dt){
  if(!SQV.loots.length) return;
  const el = document.getElementById("sqloot"), cv = SQV.cv;
  let tx = SQV.W - 60, ty = 16;
  if(el && cv){ const a = el.getBoundingClientRect(), b = cv.getBoundingClientRect(); tx = a.left - b.left + 14; ty = a.top - b.top + a.height / 2; }
  for(let i = SQV.loots.length - 1; i >= 0; i--){
    const o = SQV.loots[i];
    if(t < o.t0) continue;
    o.life += dt;
    if(o.life < 520){ o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 0.0007 * dt; if(o.y > o.floor){ } }
    else {
      const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), sp = 0.25 + (o.life - 520) * 0.0016;
      if(d < 10){
        SQV.loots.splice(i, 1);
        SQV.lootShown[o.k] += o.v;
        if(el){ el.innerHTML = sqLootHtml(); el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }
        if(typeof arTone === "function" && o.k === "coins" && Math.random() < 0.5) arTone(1320, .03, "square", .015);
        continue;
      }
      o.x += dx / d * Math.min(d, sp * dt); o.y += dy / d * Math.min(d, sp * dt);
    }
    const r = o.big ? 5 : 3;
    const g = x.createRadialGradient(o.x, o.y, 0, o.x, o.y, r * 2.4); g.addColorStop(0, "#fff"); g.addColorStop(0.35, o.c); g.addColorStop(1, sqRgba(o.c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(o.x, o.y, r * 2.4, 0, 7); x.fill();
  }
}

/* ============================================================
   4. LES DÉCORS — une scène peinte par aile, puis son ambiance
   Pixel art à demi-résolution : le ciel ou le fond de salle en
   haut, le sol en perspective, l'aire de combat usée au centre,
   les accessoires sur les bords, là où personne ne se bat.
   ============================================================ */
function sqPaintScene(biome, W, H, seed){
  const lw = Math.round(W / 2), lh = Math.round(H / 2);
  const c = document.createElement("canvas"); c.width = lw; c.height = lh;
  const x = c.getContext("2d"), R = mulberry32(seed || 7);
  const px = (col, X0, Y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(X0), Math.round(Y0), Math.max(1, Math.round(w || 1)), Math.max(1, Math.round(h || 1))); };
  const blob = (col, X0, Y0, r) => { x.fillStyle = col; x.beginPath(); x.arc(Math.round(X0), Math.round(Y0), Math.max(0.5, r), 0, 7); x.fill(); };
  const ell = (col, X0, Y0, rx, ry) => { x.fillStyle = col; x.beginPath(); x.ellipse(X0, Y0, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 7); x.fill(); };
  const tri = (col, a, b, d) => { x.fillStyle = col; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(d[0], d[1]); x.closePath(); x.fill(); };
  const pick = a => a[Math.floor(R() * a.length)];
  const rr = (a, b) => a + R() * (b - a);
  const hz = Math.round(lh * 0.27);           /* l'horizon : le fond au-dessus, le sol en dessous */
  const lights = [];
  /* un bruit doux : de grandes plages de teinte plutôt qu'un damier */
  const NG = 20, gw = Math.ceil(lw / NG) + 2, gh = Math.ceil(lh / NG) + 2, grid = Array.from({length:gw * gh}, ()=>R());
  const noise = (X, Y) => { const gx = X / NG, gy = Y / NG, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const a = grid[j * gw + i], b = grid[j * gw + i + 1], c2 = grid[(j + 1) * gw + i], d = grid[(j + 1) * gw + i + 1];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return a + (b - a) * sx + (c2 - a) * sy + (a - b - c2 + d) * sx * sy; };
  /* le sol : une palette, du bruit, un grain */
  const ground = (pal, grain, tile) => {
    tile = tile || 2;
    for(let yy = hz; yy < lh; yy += tile) for(let xx = 0; xx < lw; xx += tile){
      const v = Math.max(0, Math.min(pal.length - 1, Math.floor(noise(xx, yy) * pal.length + (R() - 0.5) * 1.1)));
      px(pal[v], xx, yy, tile, tile);
    }
    if(grain) for(let i = 0; i < lw * lh / 22; i++){ const X0 = R() * lw, Y0 = hz + R() * (lh - hz); px(pick(grain), X0, Y0); }
    const g = x.createLinearGradient(0, hz, 0, lh * 0.6); g.addColorStop(0, "rgba(0,0,0,.4)"); g.addColorStop(0.35, "rgba(0,0,0,.1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, hz, lw, lh - hz);
  };
  /* l'aire de combat : la diagonale entre les deux camps, tramée sur le sol */
  const inArena = (X0, Y0) => { const dx = X0 / lw - 0.5, dy = Y0 / lh - 0.57, a = 0.62, u = dx * Math.cos(a) - dy * Math.sin(a), v = dx * Math.sin(a) + dy * Math.cos(a); return (u * u) / (0.5 * 0.5) + (v * v) / (0.17 * 0.17); };
  const arena = pal => {
    for(let yy = hz; yy < lh; yy += 2) for(let xx = 0; xx < lw; xx += 2){
      const d = inArena(xx, yy); if(d > 1.15) continue;
      if(d > 0.8 && R() > (1.15 - d) / 0.35) continue;
      px(pal[Math.max(0, Math.min(pal.length - 1, Math.floor(noise(xx + 77, yy + 31) * pal.length + (R() - 0.5))))], xx, yy, 2, 2);
    }
  };
  /* les deux coins libres : en haut à gauche, en bas à droite ; et les bords */
  const freeAt = (X0, Y0) => { const ax = X0 / lw, ay = Y0 / lh;
    if(inArena(X0, Y0) < 1.05) return false;
    if(ax > 0.04 && ax < 0.5 && ay > 0.5) return false;           /* l'équipe */
    if(ax > 0.47 && ay < 0.55 && ay > hz / lh - 0.02 && ax < 0.97) return false;   /* les adversaires */
    return true; };
  const spots = (n, zone, fn) => {
    for(let i = 0, k = 0; i < n * 12 && k < n; i++){
      let X0, Y0;
      if(zone === "tl"){ X0 = rr(0.01, 0.42) * lw; Y0 = rr(hz / lh + 0.04, 0.5) * lh; }
      else if(zone === "br"){ X0 = rr(0.55, 1.0) * lw; Y0 = rr(0.62, 1.02) * lh; }
      else if(zone === "back"){ X0 = rr(0, 1) * lw; Y0 = hz + rr(1, 9); }
      else { X0 = R() < 0.5 ? rr(-0.02, 0.06) * lw : rr(0.94, 1.02) * lw; Y0 = rr(hz / lh + 0.05, 1) * lh; }
      if(zone !== "back" && !freeAt(X0, Y0)) continue;
      fn(X0, Y0); k++;
    }
  };
  /* ---------- les accessoires ---------- */
  const rock = (X0, Y0, s, pal) => {
    x.fillStyle = pal[0]; x.beginPath(); x.moveTo(X0 - 6 * s, Y0); x.lineTo(X0 - 5 * s, Y0 - 4 * s); x.lineTo(X0 - 1 * s, Y0 - 7 * s); x.lineTo(X0 + 4 * s, Y0 - 6 * s); x.lineTo(X0 + 7 * s, Y0 - 2 * s); x.lineTo(X0 + 7 * s, Y0); x.closePath(); x.fill();
    x.fillStyle = pal[1]; x.beginPath(); x.moveTo(X0 - 5 * s, Y0 - 4 * s); x.lineTo(X0 - 1 * s, Y0 - 7 * s); x.lineTo(X0 + 4 * s, Y0 - 6 * s); x.lineTo(X0 + 1 * s, Y0 - 3 * s); x.closePath(); x.fill();
    if(pal[2]) px(pal[2], X0 - 1 * s, Y0 - 6.5 * s, 2 * s, 1);
    ell("rgba(0,0,0,.28)", X0, Y0 + 0.5, 7.5 * s, 1.6 * s);
  };
  const tree = (X0, Y0, s, pal) => {
    ell("rgba(0,0,0,.3)", X0 + 2 * s, Y0, 9 * s, 2.5 * s);
    px(pal[3], X0 - 2 * s, Y0 - 11 * s, 4 * s, 11 * s); px(pal[4], X0 + 1 * s, Y0 - 11 * s, 1 * s, 11 * s);
    px(pal[3], X0 - 4 * s, Y0 - 1 * s, 2 * s, 1 * s); px(pal[3], X0 + 2 * s, Y0 - 1 * s, 2 * s, 1 * s);
    for(let k = 0; k < 16; k++){ const a = R() * 6.28, d = R() * 8 * s; blob(pal[0], X0 + Math.cos(a) * d, Y0 - 18 * s + Math.sin(a) * d * 0.7, rr(3, 5) * s); }
    for(let k = 0; k < 11; k++){ const a = R() * 6.28, d = R() * 6 * s; blob(pal[1], X0 - 1.5 * s + Math.cos(a) * d, Y0 - 20 * s + Math.sin(a) * d * 0.6, rr(2.2, 4) * s); }
    for(let k = 0; k < 7; k++){ const a = R() * 6.28, d = R() * 4 * s; blob(pal[2], X0 - 3 * s + Math.cos(a) * d, Y0 - 22 * s + Math.sin(a) * d * 0.6, rr(1, 2.2) * s); }
  };
  const tallGrass = (X0, Y0, w, h, pal) => {
    for(let yy = 0; yy < h; yy += 3) for(let xx = 0; xx < w; xx += 3){
      const bx = X0 + xx + (yy % 6 ? 1.5 : 0), by = Y0 + yy;
      if(((xx - w / 2) ** 2) / ((w / 2) ** 2) + ((yy - h / 2) ** 2) / ((h / 2) ** 2) > 1) continue;
      px(pal[0], bx, by - 3, 1, 4); px(pal[0], bx + 2, by - 4, 1, 5); px(pal[1], bx + 1, by - 2, 1, 3); px(pal[2], bx + 2, by - 4, 1, 1);
    }
  };
  const flowers = (X0, Y0, n, cols) => { for(let k = 0; k < n; k++){ const fx = X0 + rr(-8, 8), fy = Y0 + rr(-4, 4), col = pick(cols); px(col, fx - 1, fy, 3, 1); px(col, fx, fy - 1, 1, 3); px("#fff8c0", fx, fy, 1, 1); px("#2f6e24", fx, fy + 2, 1, 2); } };
  const crystal = (X0, Y0, s, a, b, glow) => {
    ell("rgba(0,0,0,.3)", X0, Y0 + 1, 8 * s, 2 * s);
    for(const [dx, hh, w, tilt] of [[-5, 9, 3, -2], [-1, 15, 4.5, 0], [3, 11, 3.5, 1.5], [6, 6, 2.5, 2.5], [-7, 5, 2, -2.5]]){
      const bx = X0 + dx * s, tx = bx + tilt * s, ty = Y0 - hh * s;
      tri(a, [bx - w * s / 2, Y0], [tx, ty], [bx + w * s / 2, Y0]);
      tri(b, [bx, Y0], [tx, ty], [bx + w * s / 2, Y0]);
      px("#ffffff", tx - 0.5, ty + 1, 1, Math.max(1, hh * s * 0.3));
    }
    lights.push({x:X0 * 2, y:(Y0 - 8 * s) * 2, c:glow || b, r:18 * s});
  };
  const stump = (X0, Y0, s) => { ell("rgba(0,0,0,.3)", X0, Y0 + 1, 7 * s, 2 * s); px("#5a3a22", X0 - 5 * s, Y0 - 5 * s, 10 * s, 5 * s); px("#4a2e1a", X0 + 2 * s, Y0 - 5 * s, 3 * s, 5 * s); ell("#a8804a", X0, Y0 - 5 * s, 5 * s, 2 * s); ell("#8a6438", X0, Y0 - 5 * s, 3 * s, 1.2 * s); ell("#a8804a", X0, Y0 - 5 * s, 1.2 * s, 0.6 * s); };
  const bush = (X0, Y0, s, pal) => { ell("rgba(0,0,0,.28)", X0, Y0, 8 * s, 2 * s); for(let k = 0; k < 7; k++) blob(pal[0], X0 + rr(-6, 6) * s, Y0 - rr(2, 6) * s, rr(2.5, 4) * s); for(let k = 0; k < 5; k++) blob(pal[1], X0 + rr(-5, 4) * s, Y0 - rr(4, 8) * s, rr(1.5, 3) * s); if(pal[2]) for(let k = 0; k < 4; k++) px(pal[2], X0 + rr(-5, 5) * s, Y0 - rr(3, 7) * s, 1, 1); };
  const finish = () => {
    const v = x.createRadialGradient(lw / 2, lh * 0.55, lh * 0.3, lw / 2, lh * 0.55, lh * 0.88);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.5)"); x.fillStyle = v; x.fillRect(0, 0, lw, lh);
  };

  if(biome === "foret"){
    const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "#0a2214"); sky.addColorStop(1, "#173e22"); x.fillStyle = sky; x.fillRect(0, 0, lw, hz);
    [["#123220", 0.3], ["#1a4a28", 0.58], ["#246230", 0.86]].forEach(([col, k], r)=>{ for(let X0 = -6; X0 < lw + 8; X0 += 5 + R() * 6) blob(col, X0, hz * k - 3 + R() * 6, 6 + R() * 6 + r * 2); });
    for(let X0 = 3; X0 < lw; X0 += 9 + R() * 14){ px("#2a1e12", X0, hz - 12, 3, 13); px("#3e2c1a", X0, hz - 12, 1, 13); }
    ground(["#3f8a34", "#478f38", "#4f9a3c", "#57a243", "#5fab48"], ["#3a8030", "#68b84e", "#2f6e24"]);
    arena(["#8a9a50", "#9aa058", "#a8a466", "#b0aa6c"], null);
    for(let i = 0; i < 90; i++){ const X0 = R() * lw, Y0 = hz + R() * (lh - hz); px("#2f7a2a", X0, Y0, 1, 2); px("#68b84e", X0 + 1, Y0 - 1, 1, 2); }
    spots(3, "tl", (X0, Y0)=>tallGrass(X0 - 14, Y0 - 6, rr(26, 40), rr(10, 16), ["#2f7a2a", "#3f9a34", "#7ad05a"]));
    spots(3, "br", (X0, Y0)=>tallGrass(X0 - 14, Y0 - 6, rr(26, 44), rr(10, 18), ["#2f7a2a", "#3f9a34", "#7ad05a"]));
    spots(6, "tl", (X0, Y0)=>flowers(X0, Y0, 5, ["#ff6a6a", "#ffe45e", "#ffffff", "#ff9ad8"]));
    spots(6, "br", (X0, Y0)=>flowers(X0, Y0, 6, ["#ff6a6a", "#ffe45e", "#ffffff", "#9ad8ff"]));
    spots(2, "tl", (X0, Y0)=>R() < 0.5 ? stump(X0, Y0, 1.2) : rock(X0, Y0, 1.1, ["#6a6a5e", "#8a8a7a", "#b0b0a0"]));
    spots(2, "br", (X0, Y0)=>bush(X0, Y0, 1.5, ["#2f7a30", "#4a9a3a", "#ff4a6a"]));
    tree(rr(4, 16), hz + rr(30, 50), 1.7, ["#245a26", "#357a32", "#5aa844", "#4a3020", "#6a4a2c"]);
    tree(lw - rr(6, 16), hz + rr(22, 34), 1.5, ["#245a26", "#357a32", "#5aa844", "#4a3020", "#6a4a2c"]);
    tree(lw - rr(4, 14), lh - rr(4, 14), 2.0, ["#245a26", "#357a32", "#5aa844", "#4a3020", "#6a4a2c"]);
    spots(4, "side", (X0, Y0)=>bush(X0, Y0, 1.3, ["#2a6a2a", "#3f8a36"]));
    /* des taches de soleil, et des rais à travers le feuillage */
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 9; i++){ const X0 = R() * lw, Y0 = hz + 10 + R() * (lh - hz - 10); ell("rgba(255,240,170,.09)", X0, Y0, rr(6, 14), rr(2, 5)); }
    for(let i = 0; i < 4; i++){ const X0 = lw * (0.12 + i * 0.24 + R() * 0.08); const g = x.createLinearGradient(X0, 0, X0 + 30, lh); g.addColorStop(0, "rgba(255,240,160,.15)"); g.addColorStop(1, "rgba(255,240,160,0)");
      x.fillStyle = g; x.beginPath(); x.moveTo(X0, 0); x.lineTo(X0 + 10, 0); x.lineTo(X0 + 46, lh); x.lineTo(X0 + 22, lh); x.closePath(); x.fill(); }
    x.globalCompositeOperation = "source-over";
  } else if(biome === "grotte"){
    x.fillStyle = "#16131c"; x.fillRect(0, 0, lw, hz + 4);
    for(let yy = 0; yy < hz; yy += 2) for(let xx = 0; xx < lw; xx += 4){ const v = noise(xx, yy * 2); if(R() < 0.7) px(v > 0.6 ? "#2c2636" : v > 0.4 ? "#241f2c" : "#1c1824", xx, yy, 4, 2); }
    for(let i = 0; i < 6; i++){ const Y0 = rr(4, hz - 4); x.strokeStyle = "rgba(70,60,90,.6)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, Y0); for(let X0 = 0; X0 < lw; X0 += 10) x.lineTo(X0, Y0 + Math.sin(X0 / 13 + i) * 2); x.stroke(); }
    for(let X0 = 0; X0 < lw; X0 += 5 + R() * 9){ const h = 5 + R() * 18; tri("#2e2838", [X0 - 3, 0], [X0 + 3, 0], [X0, h]); px("#4a4258", X0, 0, 1, h * 0.6); }
    for(let i = 0; i < 4; i++){ const X0 = rr(10, lw - 10), Y0 = hz * rr(0.45, 0.85); crystal(X0, Y0, 0.6, "#5a7ab8", "#cfe8ff"); }
    ground(["#3e3840", "#46404a", "#4e4852", "#565058", "#5e5860"], ["#2e2830", "#6a6470"]);
    arena(["#5a5458", "#625c60", "#6a6468", "#726c70"], null);
    for(let i = 0; i < 70; i++){ const X0 = R() * lw, Y0 = hz + R() * (lh - hz); x.strokeStyle = "rgba(20,16,22,.55)"; x.lineWidth = 1; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X0 + (R() - 0.5) * 12, Y0 + (R() - 0.5) * 4); x.stroke(); }
    spots(3, "tl", (X0, Y0)=>crystal(X0, Y0, rr(1.1, 1.6), "#4a6aa8", "#d8f0ff", "#9ad0ff"));
    spots(3, "br", (X0, Y0)=>crystal(X0, Y0, rr(1.3, 2), pick(["#4a6aa8", "#6a4aa8"]), pick(["#d8f0ff", "#f0d8ff"]), "#c0d8ff"));
    spots(4, "tl", (X0, Y0)=>rock(X0, Y0, rr(0.9, 1.6), ["#36303a", "#544c5a", "#7a7286"]));
    spots(4, "br", (X0, Y0)=>rock(X0, Y0, rr(1, 2), ["#36303a", "#544c5a", "#7a7286"]));
    spots(2, "br", (X0, Y0)=>{ ell("#1e2a40", X0, Y0, 14, 4); ell("#2e4a70", X0, Y0 - 0.5, 12, 3); px("#9ad0ff", X0 - 6, Y0 - 1, 7, 1); lights.push({x:X0 * 2, y:Y0 * 2, c:"#9ad0ff", r:16}); });
    spots(4, "side", (X0, Y0)=>{ tri("#3a3444", [X0 - 4, Y0], [X0, Y0 - rr(12, 22)], [X0 + 4, Y0]); tri("#5a5266", [X0, Y0], [X0, Y0 - 16], [X0 + 4, Y0]); });
    x.globalCompositeOperation = "lighter";
    const g = x.createRadialGradient(lw * 0.55, lh * 0.52, 0, lw * 0.55, lh * 0.52, lw * 0.55); g.addColorStop(0, "rgba(170,200,255,.2)"); g.addColorStop(1, "rgba(170,200,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, lw, lh);
    const g2 = x.createLinearGradient(lw * 0.45, 0, lw * 0.6, lh * 0.6); g2.addColorStop(0, "rgba(200,220,255,.14)"); g2.addColorStop(1, "rgba(200,220,255,0)");
    x.fillStyle = g2; x.beginPath(); x.moveTo(lw * 0.42, 0); x.lineTo(lw * 0.56, 0); x.lineTo(lw * 0.7, lh * 0.65); x.lineTo(lw * 0.48, lh * 0.65); x.closePath(); x.fill();
    x.globalCompositeOperation = "source-over";
  } else if(biome === "centrale"){
    x.fillStyle = "#222c3a"; x.fillRect(0, 0, lw, hz);
    for(let X0 = 0; X0 < lw; X0 += 24){ px("#2e3a4c", X0 + 1, 3, 22, hz - 10); px("#3a4860", X0 + 1, 3, 22, 1); px("#1a2230", X0, 0, 1, hz); for(let Y0 = 7; Y0 < hz - 8; Y0 += 9){ px("#4a5a72", X0 + 3, Y0); px("#4a5a72", X0 + 20, Y0); } px("#1a2230", X0 + 6, hz * 0.45, 12, 6); px("#5cff7a", X0 + 8, hz * 0.45 + 2, 2, 2); lights.push({x:(X0 + 9) * 2, y:(hz * 0.45 + 3) * 2, c:pick(["#5cff7a", "#ff4a4a", "#5cc8ff"]), r:5, blink:R() * 6}); }
    for(let X0 = 10; X0 < lw; X0 += 28 + R() * 20){ px("#5a6a7e", X0, 0, 5, hz); px("#8a9ab0", X0 + 1, 0, 1, hz); px("#3a4658", X0 - 1, hz * 0.3, 7, 3); px("#3a4658", X0 - 1, hz * 0.7, 7, 3); }
    for(let X0 = 0; X0 < lw; X0 += 6){ px("#e8c020", X0, hz - 5, 3, 4); px("#1a1a1a", X0 + 3, hz - 5, 3, 4); }
    ground(["#3e4654", "#444c5a", "#4a5262", "#505868"], ["#363c48", "#5a6474"], 2);
    for(let Y0 = hz; Y0 < lh; Y0 += 14) px("#2c323e", 0, Y0, lw, 1);
    for(let X0 = 0; X0 < lw; X0 += 14) px("#2c323e", X0, hz, 1, lh - hz);
    for(let Y0 = hz + 2; Y0 < lh; Y0 += 14) for(let X0 = 2; X0 < lw; X0 += 14){ px("#6a7484", X0, Y0); px("#6a7484", X0 + 10, Y0 + 10); }
    /* l'aire : un plateau cerclé de bandes de danger */
    x.save(); x.translate(lw * 0.5, lh * 0.57); x.rotate(-0.62); x.scale(1, 0.34);
    x.lineWidth = 6; x.setLineDash([6, 6]); x.strokeStyle = "#e8c020"; x.beginPath(); x.arc(0, 0, lw * 0.44, 0, 7); x.stroke();
    x.lineDashOffset = 6; x.strokeStyle = "#1a1a1a"; x.stroke(); x.setLineDash([]);
    x.fillStyle = "rgba(255,228,94,.05)"; x.beginPath(); x.arc(0, 0, lw * 0.42, 0, 7); x.fill(); x.restore();
    x.strokeStyle = "#141820"; x.lineWidth = 2; for(let i = 0; i < 3; i++){ x.beginPath(); const y1 = hz + rr(20, 70); x.moveTo(0, y1); x.bezierCurveTo(lw * 0.3, y1 + rr(-20, 40), lw * 0.7, lh * 0.95, lw, hz + rr(30, 110)); x.stroke(); }
    const gen = (X0, Y0, s) => { ell("rgba(0,0,0,.35)", X0, Y0 + 1, 12 * s, 2.5 * s); px("#3a4658", X0 - 10 * s, Y0 - 14 * s, 20 * s, 14 * s); px("#5a6a7e", X0 - 10 * s, Y0 - 14 * s, 20 * s, 2 * s); px("#2a3444", X0 + 6 * s, Y0 - 14 * s, 4 * s, 14 * s);
      px("#141a22", X0 - 7 * s, Y0 - 10 * s, 9 * s, 6 * s); px("#ffe45e", X0 - 6 * s, Y0 - 9 * s, 7 * s, 4 * s); blob("#d0d8e0", X0 + 4 * s, Y0 - 8 * s, 1.6 * s); px("#ff4a4a", X0 + 4 * s, Y0 - 9 * s, 1, 1.5 * s);
      lights.push({x:(X0 - 2.5 * s) * 2, y:(Y0 - 7 * s) * 2, c:"#ffe45e", r:14 * s, blink:R() * 6}); };
    const coil = (X0, Y0, s) => { ell("rgba(0,0,0,.35)", X0, Y0 + 1, 6 * s, 2 * s); px("#3a4658", X0 - 4 * s, Y0 - 4 * s, 8 * s, 4 * s); px("#8a9ab0", X0 - 1 * s, Y0 - 20 * s, 2 * s, 16 * s);
      for(let k = 0; k < 5; k++) ell("#c8884a", X0, Y0 - 7 * s - k * 2.6 * s, 3.5 * s, 1 * s); blob("#d8e0ea", X0, Y0 - 22 * s, 3 * s); blob("#ffffff", X0 - 1 * s, Y0 - 23 * s, 1 * s);
      lights.push({x:X0 * 2, y:(Y0 - 22 * s) * 2, c:"#9ad8ff", r:20 * s, blink:R() * 6}); };
    const barrel = (X0, Y0, s) => { ell("rgba(0,0,0,.3)", X0, Y0 + 1, 5 * s, 1.5 * s); px("#7a2a1e", X0 - 4 * s, Y0 - 10 * s, 8 * s, 10 * s); px("#a8402a", X0 - 4 * s, Y0 - 10 * s, 3 * s, 10 * s); ell("#5a1e14", X0, Y0 - 10 * s, 4 * s, 1.2 * s); px("#e8c020", X0 - 4 * s, Y0 - 6 * s, 8 * s, 1.5 * s); };
    spots(1, "tl", (X0, Y0)=>gen(X0, Y0, 1.4)); spots(1, "br", (X0, Y0)=>gen(X0, Y0, 1.8));
    spots(1, "tl", (X0, Y0)=>coil(X0, Y0, 1.2)); spots(1, "br", (X0, Y0)=>coil(X0, Y0, 1.5));
    spots(3, "br", (X0, Y0)=>barrel(X0, Y0, rr(1.1, 1.5))); spots(2, "tl", (X0, Y0)=>barrel(X0, Y0, 1.1));
    spots(3, "side", (X0, Y0)=>{ px("#4a3a2a", X0 - 6, Y0 - 9, 12, 9); px("#6a5438", X0 - 6, Y0 - 9, 12, 2); px("#3a2a1a", X0 - 6, Y0 - 5, 12, 1); });
  } else if(biome === "faille"){
    const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "#08060f"); sky.addColorStop(1, "#1e1430"); x.fillStyle = sky; x.fillRect(0, 0, lw, hz);
    for(let X0 = 6; X0 < lw; X0 += 32){ px("#100a1a", X0 - 2, 3, 22, hz - 6); x.fillStyle = "#2e2050"; x.beginPath(); x.arc(X0 + 9, 14, 7, Math.PI, 0); x.fill(); px("#2e2050", X0 + 2, 14, 14, 11); px("#7a6ab8", X0 + 8, 8, 2, 17); px("#7a6ab8", X0 + 3, 16, 12, 1);
      lights.push({x:(X0 + 9) * 2, y:17 * 2, c:"#8a7ac8", r:20}); }
    for(let X0 = 1; X0 < lw; X0 += 7 + R() * 5){ const h = 6 + R() * 6, w = 5 + R() * 2; px("#3a3648", X0, hz - h, w, h); x.fillStyle = "#3a3648"; x.beginPath(); x.arc(X0 + w / 2, hz - h, w / 2, Math.PI, 0); x.fill(); px("#5a5670", X0, hz - h, 1, h); px("#24202e", X0 + w / 2 - 0.5, hz - h + 2, 1, 3); px("#24202e", X0 + w / 2 - 1.5, hz - h + 3, 3, 1); }
    ground(["#221c2e", "#282236", "#2e283c", "#342e44"], ["#1a1424", "#3e3650"], 2);
    for(let Y0 = hz; Y0 < lh; Y0 += 9) for(let X0 = (Y0 / 9 % 2) * 7; X0 < lw; X0 += 14){ px("#1a1424", X0, Y0, 13, 1); px("#1a1424", X0, Y0, 1, 9); }
    /* un cercle tracé au sol */
    x.save(); x.translate(lw * 0.5, lh * 0.57); x.rotate(-0.62); x.scale(1, 0.34);
    x.strokeStyle = "rgba(155,107,255,.55)"; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, lw * 0.44, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, lw * 0.38, 0, 7); x.stroke();
    for(let k = 0; k < 16; k++){ const a = k / 16 * 6.28; x.fillStyle = "rgba(200,170,255,.7)"; x.fillRect(Math.cos(a) * lw * 0.41 - 1, Math.sin(a) * lw * 0.41 - 1, 2, 3); }
    x.restore();
    lights.push({x:lw, y:lh * 1.14, c:"#9b6bff", r:60});
    const grave = (X0, Y0, s) => { ell("rgba(0,0,0,.35)", X0, Y0 + 1, 7 * s, 1.8 * s); px("#4a4658", X0 - 4 * s, Y0 - 10 * s, 8 * s, 10 * s); x.fillStyle = "#4a4658"; x.beginPath(); x.arc(X0, Y0 - 10 * s, 4 * s, Math.PI, 0); x.fill();
      px("#6a667e", X0 - 4 * s, Y0 - 10 * s, 1.5 * s, 10 * s); px("#2a2636", X0 - 0.5 * s, Y0 - 11 * s, 1 * s, 5 * s); px("#2a2636", X0 - 2 * s, Y0 - 9.5 * s, 4 * s, 1 * s); px("#3a5a3a", X0 - 5 * s, Y0 - 1 * s, 10 * s, 1 * s); };
    const candle = (X0, Y0) => { for(const [dx, h] of [[-3, 6], [0, 9], [3, 5]]){ px("#e8e0c8", X0 + dx, Y0 - h, 2, h); px("#c8c0a8", X0 + dx + 1, Y0 - h, 1, h); px("#ffd070", X0 + dx, Y0 - h - 2, 2, 2); lights.push({x:(X0 + dx + 1) * 2, y:(Y0 - h - 2) * 2, c:"#ffb060", r:12, flame:true}); } };
    spots(3, "tl", (X0, Y0)=>grave(X0, Y0, rr(1.1, 1.5))); spots(4, "br", (X0, Y0)=>grave(X0, Y0, rr(1.2, 1.8)));
    spots(2, "tl", candle); spots(2, "br", candle);
    spots(2, "side", (X0, Y0)=>{ x.strokeStyle = "#0e0a16"; x.lineWidth = 2; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X0 + 1, Y0 - 24); x.lineTo(X0 - 6, Y0 - 32); x.moveTo(X0 + 1, Y0 - 16); x.lineTo(X0 + 8, Y0 - 24); x.lineTo(X0 + 12, Y0 - 23); x.stroke(); });
    for(let i = 0; i < 7; i++){ const X0 = R() * lw, Y0 = hz + 10 + R() * (lh - hz - 10); const g = x.createRadialGradient(X0, Y0, 0, X0, Y0, 24); g.addColorStop(0, "rgba(120,90,180,.16)"); g.addColorStop(1, "rgba(120,90,180,0)"); x.fillStyle = g; x.fillRect(X0 - 24, Y0 - 24, 48, 48); }
  } else if(biome === "plage"){
    const sky = x.createLinearGradient(0, 0, 0, hz * 0.45); sky.addColorStop(0, "#6ab8e8"); sky.addColorStop(1, "#c8ecff"); x.fillStyle = sky; x.fillRect(0, 0, lw, hz * 0.45);
    for(let i = 0; i < 5; i++){ const X0 = R() * lw, Y0 = 4 + R() * hz * 0.22; blob("#ffffff", X0, Y0, 4); blob("#ffffff", X0 + 5, Y0 + 1, 3); blob("#ffffff", X0 - 5, Y0 + 1, 3); blob("#e8f4ff", X0, Y0 + 2, 3); }
    const sea = x.createLinearGradient(0, hz * 0.45, 0, hz + 6); sea.addColorStop(0, "#1e6aa8"); sea.addColorStop(1, "#3a9ad8"); x.fillStyle = sea; x.fillRect(0, hz * 0.45, lw, hz * 0.55 + 6);
    for(let i = 0; i < 46; i++){ const X0 = R() * lw, Y0 = hz * 0.5 + R() * hz * 0.5; px("#8ad0ff", X0, Y0, 3 + R() * 6, 1); }
    ground(["#e2c88a", "#e8d094", "#eed89e", "#f2dea8", "#f6e4b2"], ["#d4b878", "#fff0c8"]);
    for(let yy = hz + 2; yy < hz + 14; yy += 2) for(let xx = 0; xx < lw; xx += 2) if(R() < 0.8 - (yy - hz) / 16) px("#c8b07a", xx, yy, 2, 2);
    for(let X0 = 0; X0 < lw; X0 += 2) px("#ffffff", X0, hz + 4 + Math.sin(X0 / 6) * 1.5, 2, 1);
    for(let Y0 = hz + 16; Y0 < lh; Y0 += 7) for(let X0 = 0; X0 < lw; X0 += 3) if(R() < 0.35) px("#d6bc80", X0, Y0 + Math.sin(X0 / 5) * 1.2, 2, 1);
    arena(["#d8c084", "#dcc68c", "#e0ca92"], null);
    for(let i = 0; i < 12; i++){ const X0 = lw * (0.25 + i * 0.045), Y0 = lh * (0.78 - i * 0.03); px("#c8ae74", X0, Y0, 2, 1); px("#c8ae74", X0 + 3, Y0 - 2, 2, 1); }
    const palm = (X0, Y0, s) => { ell("rgba(0,0,0,.25)", X0 + 6 * s, Y0, 10 * s, 2.5 * s);
      for(let k = 0; k < 9; k++){ const yy = Y0 - k * 3 * s, xx = X0 + Math.sin(k / 3) * 3 * s; px(k % 2 ? "#9a6a3a" : "#b8844a", xx - 1.5 * s, yy - 3 * s, 3 * s, 3.2 * s); }
      const tx = X0 + Math.sin(3) * 3 * s, ty = Y0 - 27 * s;
      for(const [dx, dy] of [[-14, 4], [-10, 9], [12, 5], [9, 10], [0, -4], [-6, -2], [6, -2]]){
        x.strokeStyle = "#2f8a3a"; x.lineWidth = 2.5 * s; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + dx * 0.5 * s, ty - 5 * s, tx + dx * s, ty + dy * s); x.stroke();
        x.strokeStyle = "#5ac05a"; x.lineWidth = 1; x.beginPath(); x.moveTo(tx, ty - 1); x.quadraticCurveTo(tx + dx * 0.5 * s, ty - 6 * s, tx + dx * s, ty + dy * s - 1); x.stroke(); }
      blob("#6a4a2a", tx - 1.5 * s, ty + 1.5 * s, 1.6 * s); blob("#6a4a2a", tx + 1.5 * s, ty + 2 * s, 1.6 * s); };
    const star = (X0, Y0, col) => { for(let k = 0; k < 5; k++){ const a = k / 5 * 6.28 - 1.57; px(col, X0 + Math.cos(a) * 3, Y0 + Math.sin(a) * 2, 2, 2); } px(col, X0 - 1, Y0 - 1, 3, 3); };
    palm(rr(6, 20), hz + rr(38, 52), 1.5); palm(lw - rr(8, 18), lh - rr(8, 20), 1.9); palm(lw - rr(4, 10), hz + rr(18, 28), 1.1);
    spots(3, "br", (X0, Y0)=>{ rock(X0, Y0, rr(1.1, 1.6), ["#6a7078", "#8a929a", "#b0b8c0"]); ell("#3a8ac8", X0 + 8, Y0 + 1, 5, 1.6); px("#bfe8ff", X0 + 6, Y0, 3, 1); });
    spots(3, "tl", (X0, Y0)=>rock(X0, Y0, rr(0.9, 1.3), ["#6a7078", "#8a929a", "#b0b8c0"]));
    spots(5, "br", (X0, Y0)=>star(X0, Y0, pick(["#ff7a5a", "#ffb04a", "#ff9ad8"])));
    spots(5, "tl", (X0, Y0)=>{ px(pick(["#ffe0c0", "#ffc0d0", "#fff4e0"]), X0, Y0, 3, 2); px("#ffffff", X0 + 1, Y0, 1, 1); });
    spots(1, "br", (X0, Y0)=>{ px("#8a6a4a", X0 - 12, Y0 - 3, 24, 4); px("#a8845a", X0 - 12, Y0 - 3, 24, 1); px("#6a4e34", X0 + 4, Y0 - 3, 1, 4); });
  } else if(biome === "volcan"){
    const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "#160606"); sky.addColorStop(1, "#3a120c"); x.fillStyle = sky; x.fillRect(0, 0, lw, hz);
    for(let X0 = -4; X0 < lw; X0 += 9 + R() * 12){ const h = hz * (0.45 + R() * 0.55); tri(pick(["#2a1410", "#341a14", "#22100c"]), [X0 - 13, hz], [X0, hz - h], [X0 + 15, hz]); tri("rgba(255,90,30,.12)", [X0, hz - h], [X0 + 15, hz], [X0 + 4, hz]); }
    for(let i = 0; i < 3; i++){ const X0 = lw * (0.18 + i * 0.3 + R() * 0.1), y0 = rr(4, 14); px("#ff5a1a", X0 - 1, y0, 4, hz - y0); px("#ffc04a", X0, y0, 1.5, hz - y0); ell("#ff7a2a", X0 + 1, hz, 6, 2); lights.push({x:X0 * 2, y:hz * 1.6, c:"#ff6a2a", r:34, lava:true}); }
    ground(["#22161a", "#2a1c1c", "#32221e", "#3a2a24"], ["#160e0e", "#4a362e"]);
    arena(["#2e2424", "#342828", "#3a2e2a"], null);
    x.strokeStyle = "#ff5a1a"; x.lineWidth = 1;
    for(let i = 0; i < 22; i++){ let X0 = R() * lw, Y0 = hz + R() * (lh - hz); x.beginPath(); x.moveTo(X0, Y0); for(let s = 0; s < 5; s++){ X0 += (R() - 0.3) * 8; Y0 += (R() - 0.5) * 5; x.lineTo(X0, Y0); } x.stroke(); }
    const pool = (X0, Y0, s) => { ell("#1a0e0c", X0, Y0, 16 * s, 5 * s); ell("#ff4a12", X0, Y0, 14 * s, 4 * s); ell("#ff8a2a", X0 - 1 * s, Y0 - 0.5 * s, 10 * s, 2.8 * s); ell("#ffd04a", X0 - 2 * s, Y0 - 1 * s, 5 * s, 1.2 * s);
      for(let k = 0; k < 5; k++) ell("#2a1a16", X0 + rr(-10, 10) * s, Y0 + rr(-2, 2) * s, rr(1.5, 3) * s, rr(0.6, 1.2) * s); lights.push({x:X0 * 2, y:Y0 * 2, c:"#ff6a2a", r:34 * s, lava:true}); };
    const spike = (X0, Y0, s) => { ell("rgba(0,0,0,.35)", X0, Y0 + 1, 7 * s, 2 * s); for(const [dx, h] of [[-3, 14], [1, 20], [4, 11]]){ tri("#120a12", [X0 + dx * s - 3 * s, Y0], [X0 + dx * s, Y0 - h * s], [X0 + dx * s + 3 * s, Y0]); tri("#4a2a5a", [X0 + dx * s, Y0], [X0 + dx * s, Y0 - h * s], [X0 + dx * s + 3 * s, Y0]); } };
    spots(2, "br", (X0, Y0)=>pool(X0, Y0, rr(1.1, 1.6))); spots(1, "tl", (X0, Y0)=>pool(X0, Y0, 0.9));
    spots(3, "tl", (X0, Y0)=>spike(X0, Y0, rr(0.9, 1.3))); spots(2, "br", (X0, Y0)=>spike(X0, Y0, rr(1.2, 1.6)));
    spots(5, "side", (X0, Y0)=>rock(X0, Y0, rr(1, 1.7), ["#1a1214", "#3a2a2a", "#5a3a2a"]));
  } else {
    /* le verrou : le vide de l'archive, une grille, des blocs de données */
    x.fillStyle = "#06040e"; x.fillRect(0, 0, lw, lh);
    for(let Y0 = hz; Y0 < lh; Y0 += Math.max(2, (Y0 - hz) / 6)) px("rgba(255,61,127,.18)", 0, Y0, lw, 1);
    for(let X0 = -lw; X0 < lw * 2; X0 += 12){ x.strokeStyle = "rgba(53,240,214,.13)"; x.lineWidth = 1; x.beginPath(); x.moveTo(lw / 2 + (X0 - lw / 2) * 0.25, hz); x.lineTo(X0, lh); x.stroke(); }
    for(let i = 0; i < 34; i++){ const X0 = R() * lw, Y0 = R() * hz; px(pick(["#35f0d6", "#ff3d7f", "#9b6bff"]), X0, Y0, 2 + R() * 8, 1 + R() * 3); }
    const cube = (X0, Y0, s, col) => { x.strokeStyle = col; x.lineWidth = 1; x.beginPath(); x.moveTo(X0, Y0 - 8 * s); x.lineTo(X0 + 7 * s, Y0 - 4 * s); x.lineTo(X0 + 7 * s, Y0 + 4 * s); x.lineTo(X0, Y0 + 8 * s); x.lineTo(X0 - 7 * s, Y0 + 4 * s); x.lineTo(X0 - 7 * s, Y0 - 4 * s); x.closePath(); x.moveTo(X0 - 7 * s, Y0 - 4 * s); x.lineTo(X0, Y0); x.lineTo(X0 + 7 * s, Y0 - 4 * s); x.moveTo(X0, Y0); x.lineTo(X0, Y0 + 8 * s); x.stroke();
      x.fillStyle = sqRgba(col, 0.12); x.fill(); lights.push({x:X0 * 2, y:Y0 * 2, c:col, r:16 * s}); };
    spots(3, "tl", (X0, Y0)=>cube(X0, Y0 - 12, rr(0.8, 1.3), pick(["#35f0d6", "#ff3d7f"])));
    spots(3, "br", (X0, Y0)=>cube(X0, Y0 - 14, rr(1, 1.6), pick(["#35f0d6", "#ff3d7f", "#9b6bff"])));
    x.save(); x.translate(lw * 0.5, lh * 0.57); x.rotate(-0.62); x.scale(1, 0.34);
    x.strokeStyle = "rgba(255,61,127,.6)"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, lw * 0.44, 0, 7); x.stroke();
    x.strokeStyle = "rgba(53,240,214,.4)"; x.setLineDash([3, 5]); x.beginPath(); x.arc(0, 0, lw * 0.38, 0, 7); x.stroke(); x.setLineDash([]); x.restore();
  }
  finish();
  return {cv:c, biome, lights};
}
/* l'ambiance animée, devant (particules) ou derrière (lumières) les Pokémon */
function sqAmbient(x, t, dt, front){
  const sc = SQV.scene; if(!sc) return;
  const W = SQV.W, H = SQV.H, b = sc.biome, A = SQV.amb;
  if(!front){
    x.globalCompositeOperation = "lighter";
    for(const L of sc.lights){
      let a = 0.35;
      if(L.blink !== undefined) a = (Math.floor(t / 400 + L.blink) % 3 === 0) ? 0.7 : 0.12;
      else if(L.flame) a = 0.35 + Math.sin(t / 90 + L.x) * 0.12 + Math.random() * 0.08;
      else if(L.lava) a = 0.28 + Math.sin(t / 700 + L.x) * 0.1;
      else a = 0.25 + Math.sin(t / 900 + L.x * 0.1) * 0.12;
      const g = x.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 2); g.addColorStop(0, sqRgba(L.c, a)); g.addColorStop(1, sqRgba(L.c, 0));
      x.fillStyle = g; x.beginPath(); x.arc(L.x, L.y, L.r * 2, 0, 7); x.fill();
    }
    if(b === "plage"){ x.fillStyle = "rgba(255,255,255,.35)"; for(let i = 0; i < 18; i++){ const X0 = ((i * 53 + t * 0.012 * (i % 3 + 1)) % (W + 40)) - 20, Y0 = H * (0.16 + (i % 6) * 0.018); x.fillRect(X0, Y0, 8 + (i % 4) * 3, 1); } }
    x.globalCompositeOperation = "source-over";
    return;
  }
  /* les particules d'ambiance naissent et meurent au fil de l'eau */
  const want = {foret:26, grotte:20, centrale:10, faille:18, plage:10, volcan:30, lock:24}[b] || 12;
  if(A.length < want && Math.random() < 0.3){
    const P = {x:Math.random() * W, y:Math.random() * H, life:0, max:2500 + Math.random() * 3000, ph:Math.random() * 6};
    if(b === "foret"){ P.kind = Math.random() < 0.7 ? "fly" : "leaf"; if(P.kind === "leaf"){ P.y = -10; P.vx = 0.01 + Math.random() * 0.02; P.vy = 0.02 + Math.random() * 0.02; } }
    else if(b === "volcan"){ P.kind = "ember"; P.y = H + 5; P.vx = (Math.random() - 0.5) * 0.02; P.vy = -0.03 - Math.random() * 0.04; }
    else if(b === "centrale"){ P.kind = "spark"; P.y = H * 0.2 * Math.random(); P.vx = (Math.random() - 0.5) * 0.08; P.vy = 0.05; P.max = 600; }
    else if(b === "faille"){ P.kind = "wisp"; P.y = H * (0.4 + Math.random() * 0.6); P.vx = (Math.random() - 0.5) * 0.01; P.vy = -0.012; }
    else if(b === "plage"){ P.kind = "glint"; P.y = H * (0.12 + Math.random() * 0.15); P.max = 900; }
    else if(b === "lock"){ P.kind = "bit"; P.vy = 0.02 + Math.random() * 0.03; P.y = -4; }
    else { P.kind = "dust"; P.vx = (Math.random() - 0.5) * 0.006; P.vy = 0.004; }
    A.push(P);
  }
  for(let i = A.length - 1; i >= 0; i--){
    const P = A[i]; P.life += dt;
    if(P.life > P.max || P.y > H + 20 || P.y < -30){ A.splice(i, 1); continue; }
    const k = P.life / P.max, fade = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    if(P.kind === "fly"){ P.x += Math.sin(t / 900 + P.ph) * 0.02 * dt; P.y += Math.cos(t / 1100 + P.ph) * 0.012 * dt;
      x.globalCompositeOperation = "lighter"; const a = fade * (0.5 + Math.sin(t / 220 + P.ph) * 0.4);
      const g = x.createRadialGradient(P.x, P.y, 0, P.x, P.y, 6); g.addColorStop(0, `rgba(240,255,140,${a})`); g.addColorStop(1, "rgba(240,255,140,0)"); x.fillStyle = g; x.beginPath(); x.arc(P.x, P.y, 6, 0, 7); x.fill(); x.globalCompositeOperation = "source-over"; }
    else if(P.kind === "leaf"){ P.x += (P.vx + Math.sin(t / 500 + P.ph) * 0.02) * dt; P.y += P.vy * dt; x.globalAlpha = fade; x.fillStyle = "#6ac04a"; x.save(); x.translate(P.x, P.y); x.rotate(t / 400 + P.ph); x.fillRect(-3, -1, 6, 2.5); x.restore(); x.globalAlpha = 1; }
    else if(P.kind === "ember"){ P.x += P.vx * dt + Math.sin(t / 300 + P.ph) * 0.2; P.y += P.vy * dt; x.globalCompositeOperation = "lighter"; x.globalAlpha = fade; x.fillStyle = Math.random() < 0.5 ? "#ff8a3d" : "#ffc04a"; x.fillRect(P.x, P.y, 2, 2); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
    else if(P.kind === "spark"){ P.x += P.vx * dt; P.y += P.vy * dt; P.vy += 0.0004 * dt; x.globalCompositeOperation = "lighter"; x.globalAlpha = fade; x.fillStyle = "#fff6b0"; x.fillRect(P.x, P.y, 2, 2); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
    else if(P.kind === "wisp"){ P.x += (P.vx + Math.sin(t / 700 + P.ph) * 0.01) * dt; P.y += P.vy * dt; x.globalCompositeOperation = "lighter"; const g = x.createRadialGradient(P.x, P.y, 0, P.x, P.y, 9); g.addColorStop(0, `rgba(170,130,255,${0.35 * fade})`); g.addColorStop(1, "rgba(170,130,255,0)"); x.fillStyle = g; x.beginPath(); x.arc(P.x, P.y, 9, 0, 7); x.fill(); x.globalCompositeOperation = "source-over"; }
    else if(P.kind === "glint"){ x.globalAlpha = fade; x.fillStyle = "#ffffff"; x.fillRect(P.x - 2, P.y, 5, 1); x.fillRect(P.x, P.y - 2, 1, 5); x.globalAlpha = 1; }
    else if(P.kind === "bit"){ P.y += P.vy * dt; x.globalAlpha = fade * 0.7; x.fillStyle = Math.random() < 0.5 ? "#35f0d6" : "#ff3d7f"; x.fillRect(P.x, P.y, 2, 6); x.globalAlpha = 1; }
    else { P.x += P.vx * dt; P.y += P.vy * dt; x.globalAlpha = fade * 0.5; x.fillStyle = "#e8e0d8"; x.fillRect(P.x, P.y, 1.5, 1.5); x.globalAlpha = 1; }
  }
}

/* ============================================================
   5. LES RÉSULTATS — étoiles, expérience, butin, récompenses
   ============================================================ */
function sqEnd(){
  const B = SQB; if(!B || B._ended) return;
  B._ended = true;
  const R = sqFinish(B), Z = SQ_ZONES[B.z], q = sqState();
  if(typeof checkAchievements === "function") checkAchievements();
  /* le verrou cède : sa silhouette se colore et monte dans la lumière, avant les résultats */
  if(R.lock && R.first && typeof momentRelease === "function") setTimeout(()=>momentRelease(R.lock.g), 1200 / sqSp());
  const last = B.s === SQ_STAGES - 1;
  const nextOk = B.result && !last && !B.lock;
  /* la carte émise par le verrou se révèle quand le joueur a fini de lire */
  B.cardObj = R.gw && R.gw.cardObj && typeof cardReveal === "function" ? R.gw.cardObj : null;
  /* puis son entrée au Pokédex, comme une capture : on ne comprenait pas qu'on l'avait obtenu */
  B.entry = R.lock && R.first && S.dex[R.lock.g.id] ? R.lock.g : null;
  const canUp = sqCanUpgradeSomething(B.allies.map(u=>u.id));
  B.rbtn = ()=>B.cardObj ? `<button class="btn pri wide" data-act="sqcard">Révéler la carte</button>`
    : B.entry ? `<button class="btn pri wide" data-act="sqentry">Voir son entrée au Pokédex</button>` : `
        <button class="btn" data-act="sqagain">${B.result ? "Rejouer" : "Réessayer"}</button>
        <button class="btn" data-act="sqprepagain">Préparation</button>
        ${nextOk ? `<button class="btn pri" data-act="sqnext">Suivant</button>` : `<button class="btn pri" data-act="sqzoneend">${B.lock ? "Verrous" : last && B.result ? "Aile" : "Retour"}</button>`}
        ${canUp ? `<button class="btn gold sq2-upbtn" data-act="sqskillsfrom">${ic("bolt")} Améliorer les compétences</button>` : ""}`;
  const L = R.loot || {coins:0, scrolls:0, candy:0};
  setTimeout(()=>{
    if(SQB !== B) return;
    const el = document.getElementById("sqres"); if(!el) return;
    el.innerHTML = `
      <div class="sw-rtitle ${B.result ? "" : "bad"}">${B.result ? "VICTOIRE" : "DÉFAITE"}</div>
      ${B.result ? `<div class="sq-stars">${[0, 1, 2].map(k=>`<i class="${k < R.stars ? "on" : ""}" style="--d:${250 + k * 220}ms">★</i>`).join("")}</div>
        <div class="tiny dim" style="margin:-4px 0 6px">${R.stars >= 3 ? "Aucun K.O. : trois étoiles." : R.stars === 2 ? "Un K.O. : deux étoiles. Aucun K.O. pour la troisième." : "Plusieurs K.O. : une étoile. Aucun K.O. pour trois étoiles."}</div>` : ""}
      <div class="sw-xp">${R.xps.map((g, i)=>`<div class="sw-xpm" style="--d:${700 + i * 120}ms">
        ${sprite(g.id, S.dex[g.id] && S.dex[g.id].shiny, "")}
        ${g.to > g.from ? `<span class="sw-lvup">N.${g.to}</span>` : `<span class="sw-lvn">N.${g.to}</span>`}
        <div class="sw-xpbar"><i style="--w:${Math.round(g.frac * 100)}%"></i></div><small>+${g.xp} exp</small></div>`).join("")}</div>
      <div class="sq2-lootres"><small>BUTIN DU COMBAT</small>
        <span>${ic("coin")} +${fmt(L.coins)}</span>
        <span class="${L.scrolls ? "vi" : "dim"}">${itemIcon("exp:i_ct", 16) || ""} +${L.scrolls}</span>
        <span class="${L.candy ? "pk" : "dim"}">${ic("seed")} +${L.candy} bonbon${L.candy > 1 ? "s" : ""}</span>
        ${!B.result ? `<em>Défaite : seuls les PokéCoins sont gardés.</em>` : ""}</div>
      ${B.result ? `<div class="sw-rw">
          <span>${ic("coin")} +${fmt(R.rw.coins)}</span><span>${ic("shard")} +${R.rw.shards}</span>
          <span class="${R.rw.scrolls ? "vi" : "dim"}">${itemIcon("exp:i_ct", 18) || ""} +${R.rw.scrolls} parchemin${R.rw.scrolls > 1 ? "s" : ""}</span></div>
        ${R.lock && R.first ? `<div class="sw-gw">${pmdCanvas(R.lock.g.id, 0, 64)}<div><b>VERROU LEVÉ</b>
            <div class="tiny">${esc(R.lock.g.name)} — ${esc(R.lock.g.title)} — rejoint votre archive. Carte légendaire émise.</div></div></div>
          ${R.lock.g.bye ? `<div class="sw-bye">« ${esc(R.lock.g.bye)} »</div>` : ""}` : ""}
        ${R.rw.fw ? `<div class="tiny gold-t">Première victoire du jour : PokéCoins et Fragments ×${R.rw.fw}, un parchemin en plus.</div>` : ""}
        <div class="tiny ${R.first ? "cy" : "dim"}">${R.first ? "Première victoire : récompenses complètes." : R.lock ? "Verrou déjà levé : récompenses réduites." : "Palier déjà franchi : récompenses réduites — le butin, lui, reste entier."}</div>`
      : B.lock ? `<div class="tiny" style="line-height:1.6">Le verrou tient. Types : <b>${POKE[R.lock.g.id].types.map(t=>TYPE_NAMES[t]).join(", ")}</b>.
          Le tableau des types pèse plus lourd que dix niveaux : composez une équipe qui le prend à revers, et gardez la Synchro pour sa reconfiguration.</div>`
      : `<div class="tiny" style="line-height:1.6">Types du secteur : <b>${Z.types.map(t=>TYPE_NAMES[t]).join(", ")}</b>. Un meneur adapté, des compétences montées, ou quelques niveaux de plus font la différence.</div>`}
      ${B.result && !B.lock && q.auto ? `<label class="sq2-rep"><input type="checkbox" id="sqrep" ${q.repeat ? "checked" : ""} onchange="sqRepeatSet(this.checked)"> Rejouer automatiquement ce palier</label>
        <div class="sq2-repc" id="sqrepc"></div>` : ""}
      <div class="sw-rbtn" id="sw-rbtn">${B.rbtn()}</div>`;
    el.classList.add("on");
    pmdWake();
    if(B.result && !B.lock && q.auto && q.repeat && !B.cardObj) sqRepeatCountdown(B);
  }, 1300 / sqSp());
}
/* la répétition : pour cultiver un palier déjà franchi, en automatique */
function sqRepeatSet(on){ const q = sqState(); q.repeat = !!on; saveSoon(); if(on && SQB && SQB.result) sqRepeatCountdown(SQB); else sqRepeatStop(); }
let SQ_REP_T = null;
function sqRepeatStop(){ clearInterval(SQ_REP_T); SQ_REP_T = null; const c = document.getElementById("sqrepc"); if(c) c.textContent = ""; }
function sqRepeatCountdown(B){
  sqRepeatStop();
  let n = 4;
  const tick = () => {
    const c = document.getElementById("sqrepc");
    if(SQB !== B || !c || !sqState().repeat){ sqRepeatStop(); return; }
    n--;
    if(n <= 0){ sqRepeatStop(); ACTIONS.sqagain(); return; }
    c.textContent = `Nouveau combat dans ${n}…`;
  };
  tick(); SQ_REP_T = setInterval(tick, 1000);
}
function sqRestart(z, s, d){
  const lk = SQB && SQB.lock;
  if(lk){ sqLockPrep(lk.r, lk.i); return; }
  SQ_ZSEL = z; SQ_DSEL = d;
  SQ_PREP = {z, s, d, team:sqDefaultTeam(), waves:sqWaves(z, s, null, d), sort:"lvl"};
}
ACTIONS.sqcard = () => {
  const B = SQB; if(!B || !B.cardObj) return;
  const c = B.cardObj; B.cardObj = null;
  const done = ()=>{ if(B.entry) sqEntry(B); else sqButtons(B); };
  if(!cardReveal([c], {kicker:"VERROU LEVÉ", onDone:done})) done();
};
function sqButtons(B){ const el = document.getElementById("sw-rbtn"); if(el && SQB === B) el.innerHTML = B.rbtn(); }
function sqEntry(B){
  const g = B && B.entry; if(!g) return;
  B.entry = null;
  legendEntry(g, ()=>sqButtons(B));
}
/* le légendaire libéré entre au Pokédex : la même fiche qu'une capture, et ce qu'il fera dans la Brèche.
   Sert au verrou de la Tour comme à celui de la Brèche. */
function legendEntry(g, onDone){
  const id = g.id, e = S.dex[id], A = typeof brArch === "function" ? brArch(id) : null;
  const tiles = `
    <div class="tile gold"><div class="k">Niveau</div><div class="v">N.${e ? e.lvl : 1}</div></div>
    <div class="tile accent"><div class="k">Noyaux</div><div class="v">+${g.core ? 4 : 2}</div></div>
    <div class="tile"><div class="k">Intégrité</div><div class="v ok">+${g.core ? 5 : 2.5}%</div></div>
    <div class="tile"><div class="k">Carte</div><div class="v">+1</div></div>`;
  const note = A && A.n ? `<div class="dc-sig"><small>Attaque signature, dans la Brèche</small><b>${esc(A.n)}</b>
      ${A.d ? `<span>${esc(A.d)}</span>` : ""}<em>Choisis-le comme Pokémon de départ, ou recrute-le en route.</em></div>` : "";
  showDiscovery({id, shiny:false, rar:POKE[id].rar, level:e ? e.lvl : 1}, {coins:0, xp:0, integ:0},
    {tiles, note, onDone:onDone || (()=>{})});
}
ACTIONS.sqentry = () => sqEntry(SQB);
ACTIONS.sqagain = () => { const B = SQB; if(!B) return; sqRepeatStop(); sqWingFlush(); sqRestart(B.z, B.s, B.d); ACTIONS.sqfight(); };
ACTIONS.sqprepagain = () => { const B = SQB; if(!B) return; sqRepeatStop(); sqWingFlush(); sqRestart(B.z, B.s, B.d); SQB = null; SQV = null; go("tower", "prep"); };
ACTIONS.sqnext = () => { const B = SQB; if(!B) return; sqRepeatStop(); sqRestart(B.z, B.s + 1, B.d); SQB = null; SQV = null; go("tower", "prep"); if(typeof checkStoryTriggers === "function") checkStoryTriggers(); };
ACTIONS.sqzoneend = () => {
  sqRepeatStop();
  const lk = SQB && SQB.lock; SQB = null; SQV = null;
  if(lk) go("boss"); else go("tower", "zone");
  sqWingFlush();
  /* une scène peut attendre la fin du combat : le premier boss d'aile, le premier verrou */
  if(typeof checkStoryTriggers === "function") checkStoryTriggers();
  if(typeof guideTick === "function") guideTick();
};
/* depuis les résultats : la page des compétences, puis retour à la préparation du même palier */
ACTIONS.sqskillsfrom = () => {
  const B = SQB; if(!B) return;
  sqRepeatStop(); sqWingFlush();
  const ids = B.allies.map(u=>u.id);
  sqRestart(B.z, B.s, B.d); SQB = null; SQV = null;
  SQ_SKV = {id:ids[0], back:"prep", ids};
  go("tower", "skills");
};
