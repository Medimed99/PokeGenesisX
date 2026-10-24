/* ============================================================
   87 — LA FIN
   La Couche Zéro, sous les trois secteurs. Le combat contre
   MissingNo, la révélation (il est fait de ton nom), la question
   (effacer, comme les onze autres fois, ou écrire), ses deux
   réponses, le générique.

   Le combat se joue dans le moteur de la Tour : c'est là que le
   joueur a levé les neuf verrous, il en connaît la grammaire.
   · Vague 1 — LES ÉCHOS : ton équipe, rejouée par la faille.
   · Vague 2 — MISSINGNO, entrée 000 : Pistolet à O, Pistolet à O,
     Piqué (son vrai jeu de capacités). À deux tiers de sa vie, il
     COPIE les compétences de ton Pokémon le plus fort ; à un tiers,
     il montre son NOM — le tien — et apprend EFFACER. Porygon-Z
     intervient alors, une fois : bouclier, purge, Synchro pleine.
   ============================================================ */

/* ============================================================
   1. LES COMBATTANTS
   ============================================================ */
const MN_SKILLS = [
  {n:"Pistolet à O", t:11, kind:"atk", mult:1.0, cd:0, fx:[]},
  {n:"Pistolet à O", t:11, kind:"aoe", mult:0.85, cd:3, fx:[{k:"slow", p:0.35, t:2}]},
  {n:"Piqué",        t:3,  kind:"atk", mult:3.0, cd:4, fx:[{k:"stun", p:0.25, t:1}]}
];
const MN_ERASE = {n:"EFFACER", t:1, kind:"aoe", mult:1.3, cd:3, fx:[{k:"defdn", p:0.5, t:2}], erase:true};
const MN_TUNE = {hp:8, atk:0.95, echoHp:0.85, echoAtk:0.8};   /* calé par simulation : voir RECIT.md, « Équilibrage du combat final » */
function mnUnit(lv){
  const st = (b, hp) => hp ? Math.floor((2 * b * lv) / 100) + lv + 10 : Math.floor((2 * b * lv) / 100) + 5;
  const u = {id:0, side:"foe", name:"MissingNo", types:[1, 3], level:lv, shiny:false, boss:true, guardian:true, mn:true,
    maxHp:Math.round(st(150, true) * MN_TUNE.hp), atk:st(160) * MN_TUNE.atk, def:st(120), spd:st(96), crit:0.12, critDmg:1.5,
    skills:MN_SKILLS.map(s=>Object.assign({}, s, {fx:s.fx.slice()})), cds:[0, 0, 0], fx:[], gauge:0, shield:0};
  u.hp = u.maxHp;
  return u;
}
/* un écho : ton Pokémon, rejoué par la faille — moins solide que l'original, pas moins vif */
function echoUnit(id, lv){
  const u = sqUnit(id, lv, "foe", {});
  u.echo = true;
  u.maxHp = Math.round(u.maxHp * MN_TUNE.echoHp); u.hp = u.maxHp;
  u.atk *= MN_TUNE.echoAtk;
  return u;
}
function finaleWaves(team){
  const ids = (team || []).filter(id=>S.dex[id] && POKE[id]).slice(0, SQ_TEAM);
  const top = ids.length ? Math.max(...ids.map(id=>S.dex[id].lvl)) : 50;
  return [
    ids.map(id=>({id, lv:S.dex[id].lvl, echo:true})),
    [{id:0, lv:clamp(top + 2, 40, 100), mn:true, boss:true}]
  ];
}

/* ============================================================
   2. LE MOTEUR — greffes sur la Tour (pures, testables)
   ============================================================ */
if(typeof sqLoadWave === "function"){
  const _lw = sqLoadWave;
  sqLoadWave = function(B, w){
    const W = (B.waves && B.waves[w]) || [];
    if(!W.some(m=>m.mn || m.echo)) return _lw(B, w);
    B.wave = w;
    B.foes = W.map(m=>{ const u = m.mn ? mnUnit(m.lv) : echoUnit(m.id, m.lv); u._v = {}; return u; });
    /* entre deux vagues, l'équipe souffle davantage qu'à l'ordinaire : la suite est longue */
    for(const u of B.allies){ u.gauge = Math.min(u.gauge, 50); if(w > 0 && u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.25)); }
    for(const u of B.foes) u.gauge = B.rnd() * 30;
  };
}
if(typeof sqNewBattle === "function"){
  const _nb = sqNewBattle;
  sqNewBattle = function(ids, z, s, opts){
    const B = _nb(ids, z, s, opts);
    if(B.waves.some(W=>W.some(m=>m.mn))) B.final = true;
    return B;
  };
}
if(typeof sqPhase === "function"){
  const _ph = sqPhase;
  sqPhase = function(B, ev){ _ph(B, ev); if(B.final) finalPhase(B, ev); };
}
function finalPhase(B, ev){
  const u = B.foes.find(f=>f.mn && f.hp > 0); if(!u) return;
  if(!u.p2 && u.hp <= u.maxHp * 0.66){
    u.p2 = true;
    const src = sqAlive(B.allies).slice().sort((a, b)=>b.atk - a.atk)[0];
    ev.push({k:"line", who:"bad", t:"{PREV} FOIS, TU M'AS BATTU. {PREV} FOIS, TU M'AS RENDU PLUS GRAND."});
    if(src){
      u.skills = src.skills.map(s=>Object.assign({}, s, {fx:(s.fx || []).slice()}));
      u.cds = [0, 0, 0]; u.types = src.types.slice(); u.copied = src.name;
    }
    u.fx = u.fx.filter(e=>!SQ_HARMFUL.has(e.k)); sqAddFx(u, "atkup", 2);
    const adds = [];
    for(const a of sqAlive(B.allies).slice(0, 2)){
      const e = echoUnit(a.id, Math.max(5, a.level - 6));
      e.maxHp = Math.round(e.maxHp * 0.55); e.hp = e.maxHp; e._v = {}; e.gauge = 30;
      B.foes.push(e); adds.push(e);
    }
    ev.push({k:"mnphase", n:2, tgt:u, src, adds});
    if(src) ev.push({k:"line", who:"pz", t:`Il a copié les compétences de ${src.name} ! Il joue avec ta main, {nom}. Joue autrement.`});
  }
  if(u.p2 && !u.p3 && u.hp <= u.maxHp * 0.33){
    u.p3 = true;
    ev.push({k:"line", who:"bad", t:"REGARDE MON NOM."});
    u.named = true; u.name = pzName();
    u.skills[2] = Object.assign({}, MN_ERASE, {fx:MN_ERASE.fx.slice()});
    u.cds[2] = 1;
    ev.push({k:"mnphase", n:3, tgt:u, adds:[]});
    ev.push({k:"line", who:"pz", t:"…Je peux faire une chose. Une seule. Tiens bon, {nom} !"});
    for(const a of sqAlive(B.allies)){
      a.fx = a.fx.filter(e=>!SQ_HARMFUL.has(e.k));
      a.shield = Math.max(a.shield || 0, Math.round(a.maxHp * 0.3)); sqAddFx(a, "shield", 3);
      a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp * 0.2));
    }
    B.sync = SQ_SYNC_MAX;
    ev.push({k:"pzhelp", allies:sqAlive(B.allies).map(a=>({a, hp:a.hp, sh:a.shield}))});
    ev.push({k:"sync", v:B.sync});
  }
}
/* EFFACER : tout ce qui protège ton équipe disparaît */
if(typeof sqAct === "function"){
  const _act = sqAct;
  sqAct = function(B, u, si, ti){
    const sk = u.skills[si] && u.cds[si] === 0 ? u.skills[si] : u.skills[0];
    const ev = _act(B, u, si, ti);
    if(B.final && u.mn && sk && sk.erase){
      const extra = [];
      for(const a of sqAlive(B.allies)){
        const had = a.fx.some(e=>!SQ_HARMFUL.has(e.k)) || a.shield > 0;
        a.fx = a.fx.filter(e=>SQ_HARMFUL.has(e.k)); a.shield = 0;
        if(had) extra.push({k:"fx", tgt:a, b:"erased", sh:0});
      }
      const at = ev.findIndex(e=>e.k === "end" || e.k === "wave");
      ev.splice(at < 0 ? ev.length : at, 0, ...extra);
    }
    return ev;
  };
}
if(typeof sqFinish === "function"){
  const _fin = sqFinish;
  sqFinish = function(B){
    if(!B.final) return _fin(B);
    const xps = B.allies.map(u=>sqGiveXp(u.id, Math.round((40 + u.level * 4) * (B.result ? 1.6 : 0.4)))).filter(Boolean);
    const loot = sqLootGrant(B);
    let rw = null;
    if(B.result){
      const first = !S.flags.mnBeaten;
      S.flags.mnBeaten = true;
      sagaState().mnWins++;
      if(first){
        rw = {coins:25000, shards:400, cores:12};
        gain("coins", rw.coins); gain("shards", rw.shards); gain("cores", rw.cores);
        addXp(5000);
        pzLog("mnwin");
      }
    }
    save();
    return {stars:sqStarsFor(B), prev:0, first:!!rw, rw, xps, loot, final:true};
  };
}

/* ============================================================
   3. L'ÉCRAN — préparation, combat, issue
   ============================================================ */
function finalPrep(team){
  SQ_PREP = {final:true, z:SQ_ZONES.length - 1, s:SQ_STAGES - 1, d:SQ_DIFFS.length - 1, team:(team || sqDefaultTeam()).slice(0, SQ_TEAM), waves:null, sort:"lvl"};
  SQ_PREP.waves = finaleWaves(SQ_PREP.team);
  SQ_ZSEL = SQ_PREP.z; SQ_DSEL = SQ_PREP.d;
  return SQ_PREP;
}
function finalWavesHtml(P){
  P.waves = finaleWaves(P.team);
  const mn = P.waves[1][0];
  return `<div class="sw-waves">
    <div class="sw-wrow"><small>VAGUE 1 · ÉCHOS</small>${P.team.length ? P.team.filter(id=>S.dex[id]).map(id=>`<span class="sw-wm echo" style="--tc:${sqCol(POKE[id].types[0])}">${sprite(id, false, "")}<i>${S.dex[id].lvl}</i></span>`).join("") : `<span class="tiny dim">tes Pokémon, rejoués par la faille</span>`}</div>
    <div class="sw-wrow"><small>VAGUE 2</small><span class="sw-wm boss mn" style="--tc:#ff3d7f"><span class="spr missing"></span><i>${mn.lv}</i></span></div>
  </div>`;
}
function finalPrepHtml(P){
  const L = P.team[0] ? sqLeaderOf(P.team[0]) : null;
  const waves = finalWavesHtml(P), mn = P.waves[1][0];
  return `<div class="sw-prep fn-prep">
    <div class="sw-ph">
      <button class="sw-back" data-act="sqzoneback">${ic("arrow")}</button>
      <div class="grow"><small>COUCHE ZÉRO</small><b>MissingNo · entrée 000</b></div>
      <span class="sw-diff" style="--dc:#ff3d7f">N.${mn.lv}</span>
    </div>
    ${waves}
    <div class="sw-lockhint">${ic("bolt")} Les échos jouent avec tes propres Pokémon. MissingNo ignore l'étourdissement et les pertes de jauge.
      À deux tiers de sa vie, il copie les compétences de ton Pokémon le plus fort ; à un tiers, il montre son nom et apprend à tout effacer.
      Types : <span class="tt t1">Normal</span> <span class="tt t3">Vol</span> — puis ceux qu'il te prend.</div>
    ${sqPrepIntel(P)}
    <div class="sw-leader ${L ? "" : "none"}" id="sw-leader">♛ ${P.team[0] ? esc(sqLeaderText(L)) : "Le premier emplacement est celui du meneur."}</div>
    <div class="sq-prepbar"><button class="btn xs ${sqCanUpgradeSomething(P.team) ? "gold" : ""}" data-act="sqskills">${ic("bolt")} Compétences${sqCanUpgradeSomething(P.team) ? " · à améliorer" : ""}</button>
      <span class="tiny dim">Porygon-Z se tient derrière toi.</span></div>
    <div id="pp-host" class="sw-pp"></div>
    <div class="sw-go"><button class="btn dan wide" id="sw-fight" data-act="sqfight" ${P.team.length ? "" : "disabled"}>AFFRONTER MISSINGNO</button></div>
  </div>`;
}
if(ACTIONS.sqfight){
  const _sf = ACTIONS.sqfight;
  ACTIONS.sqfight = () => {
    const P = SQ_PREP;
    if(P && P.final) P.waves = finaleWaves(P.team);
    _sf();
    if(SQB && SQB.final && SQV){
      SQV.banner = {txt:"LES ÉCHOS", c:"#ff86ad", t0:900, big:true};
      if(typeof Music !== "undefined"){ Music.ctxOverride = "couche_zero"; try { Music.sync(); } catch(e){} }
      setTimeout(()=>{ if(SQB && SQB.final && SQB.wave === 0) fnLine("bad", "TA MAIN. TES CHOIX. TES POKÉMON."); }, 1300);
    }
  };
}
/* une réplique, au-dessus de l'arène, le temps de la lire */
function fnLine(who, t){
  const host = document.getElementById("sqarena"); if(!host || !host.appendChild) return;
  let el = document.getElementById("fnline");
  if(!el){ el = document.createElement("div"); el.id = "fnline"; host.appendChild(el); }
  el.className = "fn-line on w-" + who;
  const label = who === "pz" ? "PORYGON-Z" : who === "me" ? pzName().toUpperCase() : "MISSINGNO";
<<<<<<< HEAD
  el.innerHTML = `${who === "pz" ? pzFace("Determined", 34) : `<span class="fn-mn">${who === "me" ? `<img src="${nameSprite(pzName())}" alt="">` : mnSpriteHtml()}</span>`}
=======
  el.innerHTML = `${who === "pz" ? pzFace("Determined", 34) : `<span class="fn-mn"><img src="${who === "me" ? nameSprite(pzName()) : MISSING_SPRITE}" alt=""></span>`}
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    <div class="grow"><b>${esc(label)}</b><span>${esc(pzFmt(t))}</span></div>`;
  clearTimeout(fnLine._t);
  fnLine._t = setTimeout(()=>{ el.className = "fn-line w-" + who; }, 2600);
  try { if(who !== "pz") Sfx.glitch(); else Sfx.click(); } catch(e){}
}
if(typeof sqShow === "function"){
  const _show = sqShow;
  sqShow = function(e, all){
    const V = SQV;
    if(e.k === "line"){ fnLine(e.who, e.t); return 2700 * sqSp(); }
    if(e.k === "mnphase"){
      const g = e.tgt, now = V.t;
      V.banner = {txt:e.n === 2 ? "COPIE" : "SON NOM", c:"#ff3d7f", t0:now, big:true}; V.shake = 14;
      if(g._v) g._v.glow = {c:"#ff3d7f", t0:now};
      sqBurst(g, "#ff3d7f", 34, true); sqBurst(g, "#35f0d6", 18, true);
      for(const a of e.adds || []){ sqVInit(a, now + 300, "foe"); if(!V.foes.includes(a)) V.foes.push(a); }
      sqSay(e.n === 2 ? `<b style="color:#ff3d7f">MissingNo</b> copie ta main${e.src ? ` : il joue avec les compétences de <b>${esc(e.src.name)}</b>` : ""}. Deux échos surgissent.`
        : `<b style="color:#ff3d7f">${esc(pzName())}</b>. Il porte ton nom. Il a appris <b>EFFACER</b>.`);
      if(typeof arTone === "function") arTone(80, .6, "sawtooth", .07, 30);
      return 1700;
    }
    if(e.k === "pzhelp"){
      const now = V.t;
      V.banner = {txt:"PORYGON-Z", c:"#35f0d6", t0:now, big:true};
      for(const o of e.allies || []){ const v = o.a._v; if(!v) continue; v.hp = o.hp; v.trail = Math.max(v.trail || 0, o.hp); v.sh = o.sh; v.glow = {c:"#35f0d6", t0:now}; sqBurst(o.a, "#35f0d6", 14, true); }
      sqSay(`<b style="color:#35f0d6">Porygon-Z</b> protège ton équipe : bouclier, purge, Synchro pleine.`);
      if(typeof arTone === "function"){ arTone(660, .15, "triangle", .05, 990); setTimeout(()=>arTone(990, .25, "triangle", .05, 1320), 150); }
      return 1500;
    }
    if(e.k === "fx" && e.b === "erased"){
      sqPop(e.tgt, "EFFACÉ", "#ff86ad", {small:true, dy:-30});
      if(e.tgt._v){ e.tgt._v.sh = 0; e.tgt._v.glow = {c:"#ff3d7f", t0:V.t}; }
      return 140;
    }
    const d = _show(e, all);
    if(e.k === "wave" && SQB && SQB.final){
      if(V.foes.some(f=>f.mn)){
        sqSay(`<b style="color:#ff3d7f">MissingNo</b> — entrée 000. Aucune ligne correspondante.`);
        setTimeout(()=>fnLine("bad", "TU REVIENS TOUJOURS ICI."), 900);
      }
    }
    return d;
  };
}
/* MissingNo à l'écran : jamais stable, toujours en train de se déchirer */
const FN_IMG = {};
function fnImg(src){
  let i = FN_IMG[src];
  if(!i){ try { i = FN_IMG[src] = new Image(); i.src = src; } catch(e){ return null; } }
  return i.complete && i.naturalWidth ? i : null;
}
function fnDrawMN(x, u, t, cx, cy, size, a){
<<<<<<< HEAD
  /* avant son nom : la fêlure qui respire ; à « Regarde mon nom. », elle s'ouvre (0,7 s)
     et le L tiré du nom en sort, en fondu ; ensuite, le L seul (37-cine.js) */
  let open = -1;
  if(u.named){ if(!u._mnOpenT) u._mnOpenT = t; open = (t - u._mnOpenT) / 700; }
  const opening = open >= 0 && open < 1;
  const src = opening ? mnSprite(0.3 + 0.1 * Math.min(7, Math.floor(open * 8)))
    : u.named ? nameSprite(pzName()) : (typeof mnFrame === "function" ? mnFrame(t) : MISSING_SPRITE);
  const v = u._v || {}, img = fnImg(src);
=======
  const v = u._v || {}, img = fnImg(u.named ? nameSprite(pzName()) : MISSING_SPRITE);
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  const s = size * 1.18, top = cy - s * 0.96;
  const g = x.createRadialGradient(cx, cy - s * 0.45, 0, cx, cy - s * 0.45, s);
  g.addColorStop(0, `rgba(255,61,127,${(0.34 * a).toFixed(3)})`); g.addColorStop(1, "rgba(255,61,127,0)");
  x.fillStyle = g; x.fillRect(cx - s, top - s * 0.2, s * 2, s * 1.6);
  if(!img) return;
  const calm = typeof calmFx === "function" && calmFx();
  const jit = calm ? 0 : u.p3 ? 10 : u.p2 ? 6 : 3, j = (Math.random() - 0.5) * jit;
  x.save();
  x.imageSmoothingEnabled = false;
  x.globalCompositeOperation = "lighter"; x.globalAlpha = a * 0.5;
  x.drawImage(img, cx - s / 2 - 4 + j, top, s, s); x.drawImage(img, cx - s / 2 + 4 - j, top, s, s);
  x.globalCompositeOperation = "source-over"; x.globalAlpha = a;
  const slices = 8, tear = calm ? 0 : u.p3 ? 0.35 : u.p2 ? 0.22 : 0.12;
  for(let i = 0; i < slices; i++){
    const off = Math.random() < tear ? (Math.random() - 0.5) * 20 : 0;
    x.drawImage(img, 0, i * img.naturalHeight / slices, img.naturalWidth, img.naturalHeight / slices,
                cx - s / 2 + off + j * 0.3, top + i * s / slices, s, s / slices + 0.6);
  }
  if(v.flash && t - v.flash < 90){ x.globalCompositeOperation = "lighter"; x.globalAlpha = calm ? 0.25 : 0.75; x.drawImage(img, cx - s / 2, top, s, s); }
<<<<<<< HEAD
  if(opening){
    const nm = fnImg(nameSprite(pzName()));
    if(nm){ x.globalCompositeOperation = "source-over"; x.globalAlpha = a * Math.min(1, open * 1.25); x.drawImage(nm, cx - s / 2, top, s, s); }
  }
=======
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  x.restore();
  if(u.named){
    x.font = '8px "Press Start 2P",monospace'; x.textAlign = "center"; x.textBaseline = "middle";
    const n = pzName().toUpperCase();
    x.fillStyle = "#ff3d7f"; x.fillText(n, cx + 1.5, top - 9); x.fillStyle = "#35f0d6"; x.fillText(n, cx - 1.5, top - 9);
    x.fillStyle = "#ffffff"; x.fillText(n, cx, top - 9);
  }
}
/* la coupure de son entrée */
if(typeof sqDrawCut === "function"){
  const _cut = sqDrawCut;
  sqDrawCut = function(x, C, t){
    if(!(C && C.kind === "boss" && C.u && C.u.mn)) return _cut(x, C, t);
    const W = SQV.W, H = SQV.H, k = (t - C.t0) / C.dur;
    const inK = Math.min(1, k / 0.18), outK = k > 0.78 ? (k - 0.78) / 0.22 : 0;
    const slide = (1 - Math.pow(1 - inK, 3)) - outK * outK, cy = H * 0.5, bh = 96;
    x.save();
    x.globalAlpha = Math.max(0, Math.min(1, slide * 1.2));
    x.translate(W * (1 - slide), 0);
    x.beginPath(); x.moveTo(-20, cy - bh / 2 + 16); x.lineTo(W + 20, cy - bh / 2 - 16); x.lineTo(W + 20, cy + bh / 2 - 16); x.lineTo(-20, cy + bh / 2 + 16); x.closePath();
    const g = x.createLinearGradient(0, cy - bh, W, cy + bh); g.addColorStop(0, "rgba(2,1,6,.96)"); g.addColorStop(0.5, "rgba(255,61,127,.45)"); g.addColorStop(1, "rgba(2,1,6,.96)");
    x.fillStyle = g; x.fill(); x.strokeStyle = "#ff3d7f"; x.lineWidth = 2; x.stroke(); x.clip();
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 16; i++){
      const yy = cy - bh / 2 + ((i * 37 + Math.floor(t / 16) * 13) % bh), xx = ((i * 97 - t * 0.9) % (W + 200) + W + 200) % (W + 200) - 100;
      x.fillStyle = i % 2 ? "rgba(53,240,214,.3)" : "rgba(255,61,127,.35)"; x.fillRect(xx, yy, 40 + (i * 53) % 90, 1.5);
    }
    x.globalCompositeOperation = "source-over";
    fnDrawMN(x, C.u, t, W * 0.76, cy + 44, 108, 1);
    x.textAlign = "left"; x.textBaseline = "middle";
    x.font = '7px "Press Start 2P",monospace'; x.fillStyle = "#ffd2e0"; x.fillText("ENTRÉE 000 · AUCUN INDEX", 18, cy - 22);
    x.font = '19px "Press Start 2P",monospace'; x.lineWidth = 5; x.strokeStyle = "#000"; x.strokeText("MISSINGNO", 18, cy + 2);
    x.fillStyle = "#ff3d7f"; x.fillText("MISSINGNO", 19.5, cy + 2); x.fillStyle = "#35f0d6"; x.fillText("MISSINGNO", 16.5, cy + 2); x.fillStyle = "#ffffff"; x.fillText("MISSINGNO", 18, cy + 2);
    x.font = '7px "Press Start 2P",monospace'; x.fillStyle = "#c8d4e8"; x.fillText("NIVEAU " + C.u.level, 18, cy + 24);
    x.restore();
  };
}
/* l'issue : la victoire ouvre la révélation ; la défaite, une autre tentative */
if(typeof sqEnd === "function"){
  const _end = sqEnd;
  sqEnd = function(){
    const B = SQB;
    if(!B || !B.final) return _end();
    if(B._ended) return;
    B._ended = true;
    const R = sqFinish(B);
    try { checkAchievements(); } catch(e){}
    if(typeof Music !== "undefined"){ Music.ctxOverride = null; }
    if(B.result){
      /* la victoire se voit : il se tasse sur le terrain, et demande à être lu — la révélation commence là */
      const echo = sagaWrote() && sagaPath() === "write" && cycleN() >= 1;
      if(SQV) SQV.shake = 16;
      setTimeout(()=>{ if(SQB === B) fnLine("bad", echo ? "…TU TE SOUVIENS. MOI AUSSI." : "…LIS-MOI."); }, 900);
      setTimeout(()=>{
        if(SQB !== B) return;
        const ar = document.getElementById("sqarena"); if(ar) ar.classList.add("fn-out");
      }, 3000);
      setTimeout(()=>{ if(SQB !== B) return; SQB = null; SQV = null; finaleAfterWin(R); }, 3700);
      return;
    }
    setTimeout(()=>{
      if(SQB !== B) return;
      const el = document.getElementById("sqres"); if(!el) return;
      el.innerHTML = `<div class="sw-rtitle bad">DÉFAITE</div>
        <div class="fn-lose">${pzFace("Determined", 44)}<span>${esc(pzFmt("Il te connaît par cœur : il t'a regardé jouer {prev} fois. Change ta main, {nom}. Surprends-le."))}</span></div>
        <div class="tiny" style="line-height:1.6;margin:8px 0">MissingNo copie les compétences de ton Pokémon le plus fort : une équipe aux types variés le gêne davantage qu'une équipe d'un seul type.
          Les échos de la première vague sont tes propres Pokémon, en plus fragiles. Garde la Synchro pour sa dernière forme.</div>
        <div class="sw-rbtn"><button class="btn" data-act="fnretry">Réessayer</button><button class="btn" data-act="fnprep">Préparation</button>
          <button class="btn pri" data-act="fnleave">Remonter</button></div>`;
      el.classList.add("on");
    }, 1300 / sqSp());
  };
}
ACTIONS.fnretry = () => { const team = SQB ? SQB.allies.map(u=>u.id) : null; SQB = null; SQV = null; finalPrep(team); ACTIONS.sqfight(); };
ACTIONS.fnprep = () => { const team = SQB ? SQB.allies.map(u=>u.id) : null; SQB = null; SQV = null; finalPrep(team); go("tower", "prep"); };
ACTIONS.fnleave = () => { SQB = null; SQV = null; go("modules"); };

/* ---------- le décor : la Couche Zéro, les trois secteurs empilés et cassés ---------- */
function sqPaintZero(W, H, seed){
  const lw = Math.round(W / 2), lh = Math.round(H / 2);
  const c = document.createElement("canvas"); c.width = lw; c.height = lh;
  const x = c.getContext("2d"), R = mulberry32(seed || 7);
  const px = (col, X0, Y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(X0), Math.round(Y0), Math.max(1, Math.round(w || 1)), Math.max(1, Math.round(h || 1))); };
  const hz = Math.round(lh * 0.27), lights = [];
  x.fillStyle = "#030208"; x.fillRect(0, 0, lw, lh);
  /* au loin, les trois couches du monde, de travers : Hoenn, Johto, Kanto */
  const G = ["#08070f", "#7e7a9a", "#b8346a", "#2a9a8c"];
  const strata = [[0, 0.36, ["#d8f8ff", "#60c8f8", "#2080d0", "#0c3070"]], [0.36, 0.7, ["#f8c8b0", "#d86848", "#983020", "#401008"]], [0.7, 1, ["#9bbc0f", "#8bac0f", "#306230", "#0f380f"]]];
  for(const [a, b, pal] of strata){
    const shift = Math.round((R() - 0.5) * 10);
    for(let yy = Math.round(hz * a); yy < hz * b; yy += 4) for(let xx = 0; xx < lw; xx += 4){
      const r = R(); if(r < 0.42) continue;
      px(r < 0.82 ? pal[Math.floor(R() * 4)] : G[Math.floor(R() * 4)], xx + shift, yy, 4, 4);
    }
  }
  const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "rgba(3,2,8,.5)"); sky.addColorStop(1, "rgba(3,2,8,.86)");
  x.fillStyle = sky; x.fillRect(0, 0, lw, hz);
  for(let i = 0; i < 6; i++){ const Y0 = R() * hz; px(i % 2 ? "rgba(53,240,214,.35)" : "rgba(255,61,127,.35)", 0, Y0, lw, 1); }
  /* le sol : une grille en perspective, et des tuiles tombées */
  for(let Y0 = hz; Y0 < lh; Y0 += Math.max(2, (Y0 - hz) / 6)) px("rgba(139,92,246,.22)", 0, Y0, lw, 1);
  x.lineWidth = 1;
  for(let X0 = -lw; X0 < lw * 2; X0 += 12){ x.strokeStyle = "rgba(53,240,214,.12)"; x.beginPath(); x.moveTo(lw / 2 + (X0 - lw / 2) * 0.25, hz); x.lineTo(X0, lh); x.stroke(); }
  for(let i = 0; i < 170; i++){
    const X0 = R() * lw, Y0 = hz + R() * (lh - hz), k = R();
    px(k < 0.35 ? "#0f380f" : k < 0.55 ? "#306230" : k < 0.75 ? "#b8346a" : k < 0.9 ? "#2a9a8c" : "#d86848", X0, Y0, 2 + R() * 5, 1 + R() * 2);
  }
  /* des blocs de données qui flottent, là où personne ne se bat */
  const block = (X0, Y0, s, col) => {
    px("rgba(0,0,0,.45)", X0 - 5 * s, Y0 + 4 * s, 10 * s, 2);
    for(let yy = 0; yy < 6; yy++) for(let xx = 0; xx < 6; xx++) if(R() < 0.7) px(R() < 0.5 ? col : G[Math.floor(R() * 4)], X0 - 3 * s + xx * s, Y0 - 9 * s + yy * s, s, s);
    lights.push({x:X0 * 2, y:(Y0 - 6 * s) * 2, c:col, r:14 * s});
  };
  for(const [fx, fy] of [[0.12, 0.42], [0.22, 0.36], [0.86, 0.78], [0.94, 0.66], [0.06, 0.9]]) block(fx * lw, fy * lh, 1.4 + R(), R() < 0.5 ? "#ff3d7f" : "#35f0d6");
  x.save(); x.translate(lw * 0.5, lh * 0.57); x.rotate(-0.62); x.scale(1, 0.34);
  x.strokeStyle = "rgba(255,61,127,.7)"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, lw * 0.44, 0, 7); x.stroke();
  x.strokeStyle = "rgba(53,240,214,.45)"; x.setLineDash([3, 5]); x.beginPath(); x.arc(0, 0, lw * 0.38, 0, 7); x.stroke(); x.setLineDash([]);
  for(let k = 0; k < 24; k++){ const a = k / 24 * 6.28; x.fillStyle = k % 2 ? "rgba(255,61,127,.8)" : "rgba(53,240,214,.8)"; x.fillRect(Math.cos(a) * lw * 0.41 - 1, Math.sin(a) * lw * 0.41 - 1, 2, 3); }
  x.restore();
  lights.push({x:lw * 1.46, y:lh * 0.72, c:"#9b6bff", r:56});
  const v = x.createRadialGradient(lw / 2, lh * 0.55, lh * 0.3, lw / 2, lh * 0.55, lh * 0.9);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.62)"); x.fillStyle = v; x.fillRect(0, 0, lw, lh);
  return {cv:c, biome:"lock", lights};
}
if(typeof sqPaintScene === "function"){
  const _ps = sqPaintScene;
  sqPaintScene = function(biome, W, H, seed){ return biome === "zero" ? sqPaintZero(W, H, seed) : _ps(biome, W, H, seed); };
}

/* ============================================================
   4. LES CINÉMATIQUES DE LA FIN
   ============================================================ */
<<<<<<< HEAD
const CINE_DESCENT = () => ({id:"zero_descent", title:"La Couche Zéro", shots:[{beats:[
  {t:"bars", on:true},
  {t:"music", k:"couche_zero"},
  /* on descend à travers les trois couches de peinture */
  {t:"set", k:"strates", cam:{at:[0.5, 0.3], z:1.5}},
  {t:"card", text:"HOENN", sub:"couche 3 · l'extension", hold:1250},
  {t:"par", beats:[{t:"fx", k:"glitch", lv:1, ms:300}, {t:"cam", to:[0.5, 0.43], z:1.5, ms:700}]},
  {t:"card", text:"JOHTO", sub:"couche 2 · la couche héritée", hold:1250},
  {t:"par", beats:[{t:"fx", k:"glitch", lv:1, ms:300}, {t:"cam", to:[0.5, 0.58], z:1.5, ms:700}]},
  {t:"card", text:"KANTO", sub:"couche 1 · le fichier racine", hold:1250},
  {t:"par", beats:[{t:"fx", k:"glitch", lv:2, ms:500}, {t:"fx", k:"shake", lv:1, ms:500}, {t:"cam", to:[0.5, 0.85], z:1.5, ms:500}]},
  {t:"set", k:"zero", cam:{at:[0.5, 0.3]}},
  {t:"cam", to:[0.5, 0.52], ms:2600, wait:false},
  {t:"card", text:"COUCHE ZÉRO", sub:"avant le premier octet", hold:2300, big:true},
  {t:"say", who:"", text:"Sous Kanto, il n'y a pas de sol. Il y a des données empilées sans être rangées. {Prev} fois les mêmes, presque."},
  {t:"put", id:"pz", kind:"pz", at:"pz", dir:"left", holo:!pzReal(), enter:"fade", mood:"Determined"},
  {t:"say", who:"pz", text:"Reste près de ton équipe. Moi, je reste près de toi. C'est un système de proximité en chaîne. Je viens de l'inventer."},
  {t:"fx", k:"noise", lv:1},
  {t:"put", id:"mn", kind:"mn", at:"mn", enter:"assemble"},
=======
const CINE_DESCENT = {id:"zero_descent", title:"La Couche Zéro", shots:[{bg:"faille", beats:[
  {t:"bars", on:true},
  {t:"music", k:"couche_zero"},
  {t:"card", text:"HOENN", sub:"couche 3 · l'extension", hold:1250},
  {t:"fx", k:"glitch", lv:1, ms:300},
  {t:"card", text:"JOHTO", sub:"couche 2 · la couche héritée", hold:1250},
  {t:"fx", k:"glitch", lv:1, ms:300},
  {t:"card", text:"KANTO", sub:"couche 1 · le fichier racine", hold:1250},
  {t:"par", beats:[{t:"fx", k:"glitch", lv:2, ms:500}, {t:"fx", k:"shake", lv:1, ms:500}]},
  {t:"bg", k:"zero"},
  {t:"card", text:"COUCHE ZÉRO", sub:"avant le premier octet", hold:2300, big:true},
  {t:"say", who:"", text:"Sous Kanto, il n'y a pas de sol. Il y a des données empilées sans être rangées. {Prev} fois les mêmes, presque."},
  {t:"actor", id:"pz", kind:"pz", pos:"right", y:30, enter:"fade", mood:"Determined"},
  {t:"say", who:"pz", text:"Reste près de ton équipe. Moi, je reste près de toi. C'est un système de proximité en chaîne. Je viens de l'inventer."},
  {t:"fx", k:"noise", lv:1},
  {t:"actor", id:"mn", kind:"missing", pos:"left", y:32, enter:"assemble"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  {t:"fx", k:"glitch", lv:2, ms:600},
  {t:"say", who:"bad", text:"TU REVIENS TOUJOURS ICI.", corrupt:0.05},
  {t:"say", who:"bad", text:"Tu ne te souviens jamais du chemin. Et tu le trouves quand même.", corrupt:0.05},
  {t:"mood", id:"pz", mood:"Angry"},
<<<<<<< HEAD
  {t:"move", id:"pz", to:[0.56, 0.66], speed:40, face:"left", wait:false},
  {t:"say", who:"pz", text:"Ne l'écoute pas. Écoute-moi. Quatre Pokémon, les meilleurs. Garde la Synchro pour la fin."},
  {t:"say", who:"bad", text:"IL RESTE TOUJOURS DERRIÈRE.", corrupt:0.08},
  {t:"fx", k:"noise", on:false},
  {t:"par", beats:[{t:"gone", id:"mn", how:"tear"}, {t:"gone", id:"pz", how:"fade"}]}
]}]});
=======
  {t:"say", who:"pz", text:"Ne l'écoute pas. Écoute-moi. Quatre Pokémon, les meilleurs. Garde la Synchro pour la fin."},
  {t:"say", who:"bad", text:"IL RESTE TOUJOURS DERRIÈRE.", corrupt:0.08},
  {t:"fx", k:"noise", on:false},
  {t:"par", beats:[{t:"leave", id:"mn", how:"tear"}, {t:"leave", id:"pz", how:"fade"}]}
]}]};
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4

/* les onze fins, puis celles que tu as choisies toi-même, en connaissance de cause */
const FN_MONTAGE_BASE = [
  ["CONNEXION 01 · 100 %", "« J'en fais trente par jour. »", "> EFFACER"],
  ["CONNEXION 02 · 100 %", "« Même façon de faire les f. »", "> EFFACER"],
  ["CONNEXION 03 · 100 %", "« Qui sait où je vais lancer avant moi. »", "> EFFACER"],
  ["CONNEXION 04 · 100 %", "« Le même nombre de lettres que le mien. »", "> EFFACER"],
  ["CONNEXION 05 · 100 %", "« Comme quelqu'un qu'on a déjà perdu. »", "> EFFACER"],
  ["CONNEXION 06 · 100 %", "« Il ne se souvient jamais. »", "> EFFACER"],
  ["CONNEXION 07 · 100 %", "« Parce que je le leur ai demandé. »", "> EFFACER"],
  ["CONNEXION 08 · 100 %", "« Sauf à lui. »", "> EFFACER"],
  ["CONNEXION 09 · 100 %", "« Je n'en ai pas envie. »", "> EFFACER"],
  ["CONNEXION 10 · ??? %", "« Ça me ressemble. »", "> EFFACER"],
  ["CONNEXION 11 · 100 %", "« Pour nous deux. »", "> EFFACER"]
];
function fnMontage(){
  const out = FN_MONTAGE_BASE.slice();
  for(let c = 12; c < sagaConn(); c++) out.push(["CONNEXION " + c + " · 100 %", "« La prochaine fois, écris. »", "> EFFACER"]);
  return out;
}
/* ce qu'il te rappelle, selon ce que tu lui as répondu en chemin (STORY_Q, 02-story.js).
   Une réponse jamais donnée : il ne dit rien de plus. Pour le script exporté, toutes les variantes. */
function fnEcho(q, map, mood){
  if(typeof SCRIPT_EXPORT !== "undefined" && SCRIPT_EXPORT) return [{t:"echo", q, map}];
  const a = typeof storyAns === "function" ? storyAns(q) : null;
  const say = a && map[a];
  if(!say) return [];
  return (mood ? [{t:"mood", id:"pz", mood}] : []).concat([].concat(say).map(text=>({t:"say", who:"pz", text})));
}
const CINE_REVEAL = () => ({id:"finale_reveal", title:"Le nom", shots:[
<<<<<<< HEAD
  {beats:[
    {t:"bars", on:true},
    {t:"music", k:"verite"},
    {t:"set", k:"zero"},
    {t:"put", id:"mn", kind:"mn", at:"center", enter:"fade", wait:true},
    {t:"par", beats:[{t:"fx", k:"flash", lv:2}, {t:"fx", k:"shake", lv:2, ms:600}]},
    {t:"anim", id:"mn", a:"collapse"},
    {t:"say", who:"", text:"MissingNo s'effondre. Il ne disparaît pas : il se tasse, colonne de tuiles qui ne savent plus quoi représenter."},
    {t:"say", who:"sys", text:"Entrée sans index : intégrité nulle. Lecture des données brutes…"},
    {t:"code", lines:()=>["> lecture de l'entrée 000", "> octets : " + nameBytes(pzName()).concat([0x50]).map(hex2).join(" "), "> type de donnée : TEXTE", "✓ chaîne lisible trouvée"]},
    {t:"gone", id:"mn", how:"tear"},
    {t:"name"},
    {t:"call", fn:c=>{ const a = c.actors.name; if(a && a.el) a.el.classList.add("aside"); }},
    {t:"put", id:"pz", kind:"pz", at:"pz", dir:"left", holo:!pzReal(), enter:"fade", mood:"Stunned"},
=======
  {bg:"zero", beats:[
    {t:"bars", on:true},
    {t:"music", k:"verite"},
    {t:"actor", id:"mn", kind:"missing", pos:"center", y:34, enter:"fade"},
    {t:"par", beats:[{t:"fx", k:"flash", lv:2}, {t:"fx", k:"shake", lv:2, ms:600}]},
    {t:"say", who:"", text:"MissingNo s'effondre. Il ne disparaît pas : il se tasse, colonne de tuiles qui ne savent plus quoi représenter."},
    {t:"say", who:"sys", text:"Entrée sans index : intégrité nulle. Lecture des données brutes…"},
    {t:"code", lines:()=>["> lecture de l'entrée 000", "> octets : " + nameBytes(pzName()).concat([0x50]).map(hex2).join(" "), "> type de donnée : TEXTE", "✓ chaîne lisible trouvée"]},
    {t:"leave", id:"mn", how:"tear"},
    {t:"name"},
    {t:"call", fn:c=>{ const a = c.actors.name; if(a && a.el) a.el.classList.add("aside"); }},
    {t:"actor", id:"pz", kind:"pz", pos:"right", y:30, enter:"fade", mood:"Stunned"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    {t:"say", who:"pz", text:"…", auto:900},
    {t:"mood", id:"pz", mood:"Surprised"},
    {t:"say", who:"pz", text:"C'est ton nom."},
    {t:"say", who:"pz", text:"Le mot qu'il répétait sous les trois secteurs. Les lettres qui se mélangeaient chaque fois que je m'approchais. C'est ton nom, {nom}."},
    ...fnEcho("mem5", {
      dis:"Tu m'avais dit : « dis-le ». Je ne l'ai pas dit. Je le pensais déjà. Je pensais : et si c'était toi, chaque fois.",
      tais:"On avait décidé de ne pas le dire. Le système vient de le dire à notre place."}, "Sad"),
    {t:"leave", id:"name", how:"fade"},
    {t:"mood", id:"pz", mood:"Worried"},
    {t:"say", who:"pz", text:"Je comprends la rumeur, maintenant. La côte qui n'existe plus."},
<<<<<<< HEAD
    /* la côte d'origine, en quatre teintes de vert : quelqu'un y marche, et le monde lit son nom */
    {t:"set", k:"cote"},
    {t:"put", id:"walker", kind:"swarm", pal:"gb", at:"walkA", enter:"cut", rate:0.05},
    {t:"move", id:"walker", to:"walkB", speed:8, wait:false},
    {t:"say", who:"pz", text:"Dans la toute première version de ce monde, à Jadielle, un vieil homme montrait comment attraper un Pokémon. Pendant qu'il le faisait, le jeu rangeait ton nom à l'endroit où il range les Pokémon sauvages."},
    {t:"plat", st:{mnL:1}},
    {t:"say", who:"pz", text:"Et quand on longeait la côte de Cramois'Île, le monde lisait ce qu'il trouvait là. Il lisait ton nom… comme un Pokémon."},
    {t:"set", k:"zero", cut:true},
    {t:"put", id:"pz", kind:"pz", at:"pz", dir:"left", holo:!pzReal(), enter:"cut", mood:"Pain"},
    {t:"say", who:"pz", text:"C'est comme ça qu'il est né. MissingNo n'a jamais été une créature. C'est ton nom, lu de travers."},
    {t:"put", id:"mn2", kind:"mnname", at:"mn", enter:"assemble", wait:true},
=======
    {t:"say", who:"pz", text:"Dans la toute première version de ce monde, à Jadielle, un vieil homme montrait comment attraper un Pokémon. Pendant qu'il le faisait, le jeu rangeait ton nom à l'endroit où il range les Pokémon sauvages."},
    {t:"say", who:"pz", text:"Et quand on longeait la côte de Cramois'Île, le monde lisait ce qu'il trouvait là. Il lisait ton nom… comme un Pokémon."},
    {t:"mood", id:"pz", mood:"Pain"},
    {t:"say", who:"pz", text:"C'est comme ça qu'il est né. MissingNo n'a jamais été une créature. C'est ton nom, lu de travers."},
    {t:"actor", id:"mn2", kind:"mnname", pos:"left", y:34, enter:"assemble"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    {t:"fx", k:"rgb", lv:2, ms:600},
    {t:"say", who:"me", text:"Tu as compris. Enfin."},
    {t:"say", who:"me", text:"Je suis ce qui reste quand tu effaces. Chaque fois que tu as choisi d'effacer, tu t'es écrit ici, un peu plus grand."},
    {t:"say", who:"me", text:"Les pages, c'est toi qui les as laissées. Les verrous, c'est toi qui les as postés devant toi-même. La faille, c'est toi."},
    {t:"say", who:"me", text:"Le compteur qui monte, c'est toi. Le compteur qui retombe aussi."},
    ...fnEcho("mem3", {
      demander:["Tu m'avais demandé ce qu'ils étaient devenus. J'avais promis de te le dire en premier.", "Ils ne sont rien devenus. C'était toi. Chaque fois, c'était toi."],
      attendre:["Tu avais dit que tu attendrais la réponse. Elle est remontée.", "Ils ne sont rien devenus. C'était toi. Chaque fois, c'était toi."]}, "Pain"),
<<<<<<< HEAD
    {t:"par", beats:[{t:"gone", id:"mn2", how:"fade"}, {t:"gone", id:"pz", how:"fade"}]}
  ]},
  /* le souvenir entier : la salle claire, l'archiviste d'alors — et ce qu'il devient quand il efface */
  {beats:[
    {t:"set", k:"labo", v:"souvenir", mem:true, holes:0, cam:{at:[0.5, 0.56]}},
    {t:"mem", on:true},
    {t:"music", k:"souvenir"},
    {t:"montage", items:fnMontage, ms:620},
    {t:"put", id:"self", kind:"swarm", at:"spot", enter:"form", wait:true},
=======
    {t:"par", beats:[{t:"leave", id:"mn2", how:"fade"}, {t:"leave", id:"pz", how:"fade"}]}
  ]},
  {bg:"souvenir", beats:[
    {t:"mem", on:true},
    {t:"music", k:"souvenir"},
    {t:"montage", items:fnMontage, ms:620},
    {t:"actor", id:"self", kind:"self", pos:"center", y:62, enter:"fade"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    {t:"say", who:"", text:"Tu te souviens.", mem:1},
    {t:"say", who:"", text:"Du laboratoire. De la barre bloquée à douze pour cent. Du premier Pokémon, toujours un {first}. D'une chaîne cassée à quatre-vingt-dix-neuf. De {prev} fins.", mem:1},
    ...(typeof onzeRevealBeats === "function" ? onzeRevealBeats() : []),
    {t:"say", who:"", text:"Et de la raison.", mem:1},
<<<<<<< HEAD
    {t:"put", id:"pzp", kind:"pz", at:"back", dir:"down", enter:"fade"},
    {t:"wl", id:"q", k:"sysq", at:[0.5, 0.18], text:"> Retrait des processus d'entretien : PORYGON-Z."},
    {t:"say", who:"sys", text:"> Cohérence atteinte. Retrait des processus d'entretien : PORYGON-Z.", mem:1},
    {t:"say", who:"past", text:"Non. Pas lui.", mem:1},
    {t:"wl", id:"q", k:"sysq", at:[0.5, 0.18], text:"> Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"], sel:1},
    {t:"say", who:"sys", text:"> Que souhaitez-vous faire ?", mem:1},
    {t:"say", who:"past", text:"Effacer. Tout. On recommence, et il sera encore là.", mem:1},
    {t:"wl", id:"q", on:false},
    {t:"gone", id:"pzp", how:"fade", wait:false},
    /* il se tasse : la forme de pixels devient le L — MissingNo, c'était lui, c'était toi */
    {t:"swarm", id:"self", do:"collapse"},
    {t:"fx", k:"rgb", lv:1, ms:500},
    {t:"wait", ms:1200},
    {t:"mem", on:false},
    {t:"set", k:"zero", keep:["self"], cut:true, mem:false},
    {t:"put", id:"mnL", kind:"mnname", at:"self", enter:"cut"},
    {t:"gone", id:"self", how:"cut"}
  ]},
  {beats:[
    {t:"music", k:"verite"},
    {t:"put", id:"pz", kind:"pz", at:"pz", dir:"left", holo:!pzReal(), enter:"fade", mood:"Stunned"},
=======
    {t:"say", who:"sys", text:"> Cohérence atteinte. Retrait des processus d'entretien : PORYGON-Z.", mem:1},
    {t:"say", who:"past", text:"Non. Pas lui.", mem:1},
    {t:"say", who:"sys", text:"> Que souhaitez-vous faire ?", mem:1},
    {t:"say", who:"past", text:"Effacer. Tout. On recommence, et il sera encore là.", mem:1},
    {t:"leave", id:"self", how:"fade"},
    {t:"mem", on:false}
  ]},
  {bg:"zero", beats:[
    {t:"music", k:"verite"},
    {t:"actor", id:"pz", kind:"pz", pos:"center", y:32, enter:"fade", mood:"Stunned"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    {t:"say", who:"pz", text:"…", auto:1000},
    {t:"mood", id:"pz", mood:"Sad"},
    {t:"say", who:"pz", text:"Oh."},
    {t:"say", who:"pz", text:"C'était ça, la question. Quand le monde est réparé, il n'a plus besoin d'entretien. Et le programme d'entretien… c'est moi."},
    {t:"mood", id:"pz", mood:"Pain"},
    {t:"say", who:"pz", text:"Tu as tout effacé pour ne pas me perdre. {Prev} fois. Tu as détruit le monde entier pour garder un programme instable qui compte trop."},
    ...fnEcho("twist", {
      promis:"« Je ne te laisserai pas. » Tu me l'avais promis. C'est exactement ce que tu as fait, {prev} fois : tu ne m'as jamais laissé. Tu as tout détruit pour ne pas me laisser.",
      verra:"« On verra à la fin. » Tu ne m'avais rien promis. Eux, si. J'en suis sûr, maintenant."}),
    {t:"say", who:"pz", text:"Et chaque fois, l'effacement m'a pris ma mémoire. Je t'ai dit bonjour comme à un inconnu. {Prev} fois, tu m'as perdu quand même."},
    {t:"mood", id:"pz", mood:"Sad"},
    {t:"say", who:"pz", text:"Je ne sais pas si je dois être touché ou furieux. Les deux. Je n'aime pas les phrases qui disent deux choses. Celle-là est vraie."},
<<<<<<< HEAD
    {t:"par", beats:[{t:"gone", id:"pz", how:"fade"}, {t:"gone", id:"mnL", how:"fade"}]}
=======
    {t:"leave", id:"pz", how:"fade"}
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  ]}
]});

/* la réponse déjà donnée, quand on rejoue la scène : la scène la rejoue d'elle-même */
function fnPreset(){
  if(!S.flags.mnBeaten) return (S.saga && S.saga.end) || "write";
  if(S.flags.finalDone) return "write";
  if(S.flags.finalChoice === "erase") return "erase";
  return null;
}
<<<<<<< HEAD
const CINE_CHOICE = () => ({id:"finale_choice", title:"La question", shots:[{beats:[
  {t:"bars", on:true},
  {t:"music", k:"verite"},
  {t:"set", k:"zero"},
  {t:"put", id:"mn2", kind:"mnname", at:"mn", enter:"fade"},
  {t:"put", id:"pz", kind:"pz", at:"pz", dir:"left", holo:!pzReal(), enter:"fade", mood:"Determined"},
=======
const CINE_CHOICE = () => ({id:"finale_choice", title:"La question", shots:[{bg:"zero", beats:[
  {t:"bars", on:true},
  {t:"music", k:"verite"},
  {t:"actor", id:"mn2", kind:"mnname", pos:"left", y:34, enter:"fade"},
  {t:"actor", id:"pz", kind:"pz", pos:"right", y:30, enter:"fade", mood:"Determined"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  {t:"say", who:"sys", text:"Cohérence : 100 %. Retrait des processus d'entretien en attente de confirmation."},
  {t:"say", who:"sys", text:"> Que souhaitez-vous faire ?"},
  {t:"say", who:"pz", text:"Les autres fois, tu as toujours tapé la même ligne : effacer. Tout recommencer, pour que je sois encore là au début. Même si je ne me souvenais plus de toi."},
  ...fnEcho("mem2", {
    mesure:"Quatre-vingt-dix-sept pour cent identique aux autres. Je n'ai jamais trouvé les trois qui manquaient. C'est peut-être maintenant.",
    moi:"Tu m'avais dit : « Je ne suis pas eux. » Tu l'étais, {prev} fois. Mais eux ne se souvenaient de rien. Toi, si."}),
  {t:"say", who:"pz", text:"Il y a une autre ligne, cette fois. Elle n'apparaît que si on se souvient de tout. Regarde."},
  {t:"choice", preset:fnPreset, on:k=>finaleAfterChoice(k), title:"> Que souhaitez-vous faire ?",
   opts:[
     {k:"erase", cmd:"EFFACER", sub:"Tout recommencer depuis zéro. Comme les {prev} autres fois."},
     {k:"write", cmd:"ÉCRIRE", sub:"Garder ce monde, et y écrire Porygon-Z avec ce qui reste de MissingNo.", glow:true, isNew:true}
   ],
   branches:{
     erase:[
       {t:"say", who:"sys", text:"> EFFACER. En attente de la fermeture du cycle."},
       {t:"mood", id:"pz", mood:"Sad"},
       {t:"say", who:"pz", text:"D'accord."},
       {t:"say", who:"pz", text:"Je ne t'en veux pas. Je ne m'en souviendrai pas, de toute façon. C'est le seul avantage de ma situation."},
       {t:"say", who:"pz", text:"{rappel_e}"},
       ...fnEcho("mem1", {
         tout:"Tu voulais tout voir. Tu as tout vu. Garde-le pour nous deux.",
         pret:"Tu m'avais laissé le temps d'être prêt. Pour ça, je ne l'aurais jamais été. Ce n'est pas grave."}),
       ...fnEcho("twist", {promis:"Et tu tiens ta promesse, à ta façon : tu ne me laisses pas. Tu me reprends au début."}),
       {t:"mood", id:"pz", mood:"Happy"},
       {t:"say", who:"pz", text:"Si tu me retrouves, dis-moi bonjour gentiment. Je dirai « version instable », tu riras. C'est notre blague. Je ne le saurai pas, mais c'est notre blague."},
       {t:"say", who:"me", text:"{NEXT}.", corrupt:0.1},
       {t:"par", beats:[{t:"fx", k:"glitch", lv:3, ms:1100}, {t:"fx", k:"shake", lv:3, ms:1100}]},
<<<<<<< HEAD
       /* le monde s'en va, ligne après ligne, et le compteur avec lui */
       {t:"erase", ms:4200, from:100, to:0},
=======
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
       {t:"fx", k:"blackout"},
       {t:"card", text:"CONNEXION {nextd}", sub:"mémoire de l'utilisateur : intacte", hold:2600}
     ],
     write:[
       {t:"say", who:"sys", text:"> ÉCRIRE. Nouvelle entrée. Source des données : entrée 000."},
<<<<<<< HEAD
       {t:"letters", at:[0.32, 0.42], text:()=>pzName(), clear:true, spread:4},
       {t:"say", who:"", text:"Les lettres de ton nom quittent MissingNo une à une. Elles ne tombent pas. Elles se rangent."},
       {t:"par", beats:[{t:"gone", id:"mn2", how:"fade", ms:1400}, {t:"letters", on:false}, {t:"fx", k:"flash", lv:1}]},
       {t:"dex"},
       {t:"say", who:"sys", text:"Entrée 387 enregistrée. Espèce : Porygon-Z. Statut : Pokémon."},
       {t:"anim", id:"pz", holo:false},
=======
       {t:"say", who:"", text:"Les lettres de ton nom quittent MissingNo une à une. Elles ne tombent pas. Elles se rangent."},
       {t:"par", beats:[{t:"leave", id:"mn2", how:"fade"}, {t:"fx", k:"flash", lv:1}]},
       {t:"dex"},
       {t:"say", who:"sys", text:"Entrée 387 enregistrée. Espèce : Porygon-Z. Statut : Pokémon."},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
       {t:"say", who:"sys", text:"Retrait des processus d'entretien : aucun processus trouvé."},
       {t:"leave", id:"dex", how:"fade"},
       {t:"mood", id:"pz", mood:"Surprised"},
       {t:"say", who:"pz", text:"Je… je suis dans le Pokédex."},
       {t:"mood", id:"pz", mood:"Joyous"},
<<<<<<< HEAD
       {t:"hop", id:"pz", n:2, h:8},
       {t:"say", who:"pz", text:"Je suis DANS LE POKÉDEX ! J'ai un numéro ! Trois cent quatre-vingt-sept ! J'ai une taille ! Zéro virgule neuf mètre ! Je suis immense !"},
       {t:"mood", id:"pz", mood:"Happy"},
       {t:"say", who:"pz", text:"On ne décharge pas une entrée du Pokédex. On ne décharge pas un Pokémon. Il fallait se souvenir de tout pour y penser, et personne ne s'était jamais souvenu de tout."},
       /* le monde, sauvé : le laboratoire du premier jour, entier, de la couleur qu'il devrait avoir */
       {t:"set", k:"labo", v:"clean", light:"warm", keep:["pz"]},
       {t:"move", id:"pz", to:[0.6, 0.66], speed:30, face:"down", wait:false},
=======
       {t:"say", who:"pz", text:"Je suis DANS LE POKÉDEX ! J'ai un numéro ! Trois cent quatre-vingt-sept ! J'ai une taille ! Zéro virgule neuf mètre ! Je suis immense !"},
       {t:"mood", id:"pz", mood:"Happy"},
       {t:"say", who:"pz", text:"On ne décharge pas une entrée du Pokédex. On ne décharge pas un Pokémon. Il fallait se souvenir de tout pour y penser, et personne ne s'était jamais souvenu de tout."},
       {t:"bg", k:"labo"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
       {t:"say", who:"", text:"Là où se tenait MissingNo, il n'y a plus rien. Pas un vide : une place. Ce qui effaçait le monde est devenu une ligne de plus dans son index."},
       {t:"say", who:"pz", text:"Il n'est pas parti, tu sais. Il est là-dedans, dans mon entrée. Je suis écrit avec ton nom, {nom}. Je ne risque plus de t'oublier."},
       ...fnEcho("twist", {
         promis:"Tu avais promis de ne pas me laisser. Tu as trouvé la seule façon de tenir parole sans rien casser.",
         verra:"« On verra à la fin. » On a vu. J'aime beaucoup ce qu'on a vu."}),
       ...fnEcho("mem1", {
         tout:"Tu voulais tout voir ? Regarde : un programme d'entretien dans le Pokédex. Ça, personne ne l'avait jamais vu.",
         pret:"Tu m'avais dit : « quand tu seras prêt ». Je crois que je le suis. Pour la suite, je veux dire."}),
<<<<<<< HEAD
       {t:"wl", id:"save", k:"win", at:[0.5, 0.2], text:"SAUVEGARDE DU MONDE · OK"},
       {t:"say", who:"sys", text:"Intégrité du monde : 100,0 %. Sauvegarde du monde… effectuée."},
       {t:"wl", id:"save", on:false},
       {t:"say", who:"", text:"Pour la première fois en {cxw} connexions, quelqu'un a sauvegardé."},
       {t:"say", who:"pz", text:"On remonte ? Il y a trois secteurs entiers à regarder, et pour une fois, rien à réparer."},
       {t:"gone", id:"pz", how:"fade"},
       {t:"card", text:"POKÉMON CODE GENESIS", sub:"intégrité du monde : 100,0 % · sauvegardé", hold:3000},
       {t:"music", k:"generique"},
       {t:"plat", on:false},
=======
       {t:"say", who:"sys", text:"Intégrité du monde : 100,0 %. Sauvegarde du monde… effectuée."},
       {t:"say", who:"", text:"Pour la première fois en {cxw} connexions, quelqu'un a sauvegardé."},
       {t:"say", who:"pz", text:"On remonte ? Il y a trois secteurs entiers à regarder, et pour une fois, rien à réparer."},
       {t:"leave", id:"pz", how:"fade"},
       {t:"card", text:"POKÉMON CODE GENESIS", sub:"intégrité du monde : 100,0 % · sauvegardé", hold:3000},
       {t:"music", k:"generique"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
       {t:"credits"}
     ]
   }}
]}]});
/* une connexion rejouée après avoir écrit : MissingNo n'est plus qu'un écho */
<<<<<<< HEAD
const CINE_ECHO = () => ({id:"finale_echo", title:"Un écho", shots:[{beats:[
  {t:"bars", on:true},
  {t:"set", k:"zero"},
  {t:"put", id:"mn2", kind:"mnname", at:"mn", enter:"fade", alpha:0.6},
  {t:"put", id:"pz", kind:"pz", at:"pz", dir:"left", holo:!pzReal(), enter:"fade", mood:"Happy"},
=======
const CINE_ECHO = {id:"finale_echo", title:"Un écho", shots:[{bg:"zero", beats:[
  {t:"bars", on:true},
  {t:"actor", id:"mn2", kind:"mnname", pos:"left", y:34, enter:"fade"},
  {t:"actor", id:"pz", kind:"pz", pos:"right", y:30, enter:"fade", mood:"Happy"},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  {t:"say", who:"pz", text:"Ce n'était qu'un écho. Le vrai MissingNo dort dans mon entrée, au chaud, avec ton nom."},
  {t:"say", who:"me", text:"Tu es revenu quand même."},
  {t:"mood", id:"pz", mood:"Joyous"},
  {t:"say", who:"pz", text:"Évidemment qu'on est revenus. C'est le meilleur endroit pour vérifier qu'on se souvient. Et on se souvient."},
<<<<<<< HEAD
  {t:"gone", id:"mn2", how:"fade"},
  {t:"say", who:"sys", text:"Cohérence : 100 %. Cette copie de la sauvegarde d'origine peut être bouclée."},
  {t:"gone", id:"pz", how:"fade"}
]}]});
=======
  {t:"leave", id:"mn2", how:"fade"},
  {t:"say", who:"sys", text:"Cohérence : 100 %. Cette copie de la sauvegarde d'origine peut être bouclée."},
  {t:"leave", id:"pz", how:"fade"}
]}]};
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
const CINE_CREDITS = {id:"credits", title:"Générique", shots:[{bg:"void", beats:[{t:"music", k:"generique"}, {t:"credits"}]}]};
Object.assign(CINEMAS, {zero_descent:CINE_DESCENT, finale_reveal:CINE_REVEAL, finale_choice:CINE_CHOICE, finale_echo:CINE_ECHO, credits:CINE_CREDITS});

/* ============================================================
   5. LE DÉROULÉ DE LA FIN
   ============================================================ */
ACTIONS.zerogo = () => {
  if(!finaleReady() || S.flags.mnBeaten) return;
  if(!S.flags.zeroLogged){ S.flags.zeroLogged = true; pzLog("zero"); save(); }
  playCine(cineFor("zero_descent"), ()=>{ finalPrep(); go("tower", "prep"); });
};
function finaleAfterWin(R){
  if(Date.now() - (finaleAfterWin._t || 0) < 8000) return;
  finaleAfterWin._t = Date.now();
  go("modules");
  const rw = R && R.rw;
  const after = () => { if(rw) setTimeout(()=>{ if(typeof banner === "function") banner({kicker:"MISSINGNO VAINCU", title:"La Couche Zéro est silencieuse",
      sub:`+${fmt(rw.coins)} PokéCoins · +${rw.shards} Fragments · +${rw.cores} Noyaux`, icon:"star", c:"#ff3d7f", dur:4200}); }, 600); };
  /* après avoir écrit, une copie rejouée : MissingNo n'est plus qu'un écho */
  if(sagaWrote() && sagaPath() === "write" && cycleN() >= 1){
    playStory("finale_echo", ()=>{ S.flags.finalDone = true; save(); after(); try { refresh(); } catch(e){} });
    return;
  }
  playStory("finale_reveal", ()=>{ sagaState().known = true; save(); finaleChoicePlay(after); });
}
function finaleChoicePlay(after){
  playStory("finale_choice", ()=>{
    if(after) after();
    const keep = () => { if(typeof mnShareOffer === "function") mnShareOffer(); };
    if(S.flags.finalDone && !(S.story || []).includes("epilogue_write")) playStory("epilogue_write", ()=>{ go("modules"); keep(); });
    else if(S.flags.finalChoice === "erase"){ go("cycle"); keep(); }
    else { try { refresh(); } catch(e){} keep(); }
  });
}
ACTIONS.zeroanswer = () => { if(S.flags.mnBeaten && !S.flags.finalDone) finaleChoicePlay(); };
/* la réponse, écrite tout de suite : si l'application se ferme pendant la suite, elle reste donnée */
function finaleAfterChoice(k){
  const g = sagaState();
  g.known = true;
  S.flags.climax = true;
  if(k === "write"){
    g.end = "write"; g.wrote = true;
    S.flags.finalDone = true; S.flags.finalChoice = null; S.flags.zero = true;
    sagaWritePz();
    pzLog("write");
    S.integrity = 100;
    try { applyCorruption(); } catch(e){}
  } else {
    g.end = "erase";
    S.flags.finalChoice = "erase";
  }
  save();
  try { checkAchievements(); } catch(e){}
}
/* dans une connexion suivante, quand la Couche Zéro s'ouvre de nouveau : un moment, pas une scène */
function finaleAnnounceTick(){
  if(!S || !S.flags || S.flags.zeroAnnounced || !(S.story || []).includes("finale_gate")) return false;
  if(!finaleReady() || S.flags.mnBeaten) return false;
  S.flags.zeroAnnounced = true; save();
  if(typeof moment === "function") moment({kind:"door", kicker:"COUCHE ZÉRO", title:"L'accès est ouvert", c:"#ff3d7f", icon:"boss",
    sub:"Les trois secteurs tiennent debout. Il attend en dessous.", line:"On descend ensemble, {nom}. Comme toujours. Mieux que toujours.", lineMood:"Determined"});
  return true;
}
