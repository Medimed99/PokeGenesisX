/* ============================================================
   58 — LA BRÈCHE · INTERFACE ET INTÉGRATION
   ============================================================ */

function brState(){
  S.breche = S.breche || {data:0, upg:{}, best:{}, runs:0, kills:0, clears:0, mastery:{}, evos:[],
                          starter:null, region:"kanto", hab:"route", daily:{day:"", best:0, plays:0}, dailyPlays:0, bestTime:0};
  return S.breche;
}

/* ---------- l'ATH ----------
   Tout en haut, jamais sous le pouce. Quatre lignes lisibles d'un regard :
   la vie, la progression de la partie, l'equipe, les objets et les boosts. */
function brShellHtml(){
  return `<canvas id="br-cv"></canvas>
    <div id="br-stick"><i></i></div>
    <div class="br-hud">
      <div class="br-row1">
        <span class="br-lv" id="br-lv">1</span>
        <div class="br-hpbox"><div class="br-hp"><i id="br-hpbar"></i></div><span class="br-hptxt" id="br-hptxt"></span></div>
        <span class="br-kills" id="br-kills">0</span>
        <button class="br-pause" data-act="brpause" aria-label="Pause">❚❚</button>
      </div>
      <div class="br-xp"><i id="br-xpbar"></i></div>
      <div class="br-phase" id="br-phase">
        <div class="br-track" id="br-track"></div>
        <div class="br-phtxt"><span class="br-time mono-num" id="br-time">00:00</span><span class="br-next" id="br-next"></span></div>
      </div>
      <div class="br-boss" id="br-boss"><span id="br-bossname"></span><i id="br-bossbar"></i></div>
      <div class="br-kit" data-act="brpause">
        <div class="br-team" id="br-team"></div>
        <div class="br-items" id="br-items"></div>
        <div class="br-syns" id="br-syns"></div>
        <div class="br-boosts" id="br-boosts"></div>
      </div>
      <div class="br-turbo" id="br-turbo"><i></i><span>TURBO</span></div>
      <div class="br-misintro" id="br-misintro"></div>
    </div>
    <div id="br-modal"></div>`;
}
function brHud(R){
  brHudTeam(R); brTrack(R); brHudTick(R);
  const mi = document.getElementById("br-misintro");
  if(mi && R.missions) mi.innerHTML = `<div class="br-mih">MISSIONS · ${esc(HABITATS[R.hab].n)}</div>` +
    R.missions.map(m=>`<div class="br-mil">◎ ${esc(m.txt)}</div>`).join("");
}
function brHudTeam(R){
  const $ = id => document.getElementById(id);
  const t = $("br-team"), it = $("br-items"), sy = $("br-syns");
  if(t){
    let h = "";
    for(let i = 0; i < 6; i++){
      const w = R.team[i];
      if(!w){ h += `<span class="br-slot vide">+</span>`; continue; }
      const A = brArch(brShownId(w));
      h += `<span class="br-slot ${w.stage >= 2 ? "evo" : ""}" style="--sc:${A.c}">
        <span class="sprbox" style="width:26px;height:26px">${sprite(brShownId(w), false, "")}</span>
        ${w.stage >= 2 ? `<b class="br-star">★</b>` : ""}
        <span class="br-mini">${Array.from({length:BR_MAXLV},(_,k)=>`<i class="${k < w.lv ? "on" : ""}"></i>`).join("")}</span></span>`;
    }
    t.innerHTML = h;
  }
  if(it){
    const keys = Object.keys(R.items);
    let h = "";
    for(let i = 0; i < 6; i++){
      const k = keys[i];
      if(!k){ h += `<span class="br-islot vide"></span>`; continue; }
      const d = brItemDef(k), l = R.items[k];
      h += d.cat
        ? `<span class="br-islot cat" title="${esc(d.n)}"><i class="tt t${d.cat}">${TYPE_NAMES[d.cat].slice(0,3)}</i><b>${l}</b></span>`
        : `<span class="br-islot" title="${esc(d.n)}" style="--ic:${d.c}"><i>${d.g}</i><b>${l}</b></span>`;
    }
    it.innerHTML = h;
  }
  if(sy) sy.innerHTML = brSynHtml(R, false);
}
/* la frise : ou en est-on, et qu'est-ce qui arrive */
function brTrack(R){
  const tr = document.getElementById("br-track");
  if(!tr) return;
  if(R.endless){
    tr.innerHTML = `<i class="br-fill deep" id="br-fill"></i>
      ${[3,6,9,12].map(d=>{ const k = Math.min(1, Math.max(0, (d - (R.depth || 1)) / 12));
        return ""; }).join("")}`;
    R.trackMode = "deep";
    return;
  }
  const mk = [];
  for(let s = 60; s < R.bossAt; s += 60) mk.push({t:s, c:"elite"});
  mk.push({t:240, c:"alpha"});
  tr.innerHTML = `<i class="br-fill" id="br-fill"></i>
    ${mk.map(m=>`<b class="br-mk ${m.c}" style="left:${(m.t / R.bossAt * 100).toFixed(1)}%"></b>`).join("")}
    <b class="br-mk boss" style="left:100%">♛</b>`;
  R.trackMode = "run";
}
function brNextEvent(R){
  if(R.endless){
    const next = R.bossAt + (R.depth || 1) * 60, left = Math.max(0, next - R.t);
    const d = (R.depth || 1) + 1;
    const what = d === 12 ? "MissingNo" : d % 3 === 0 ? "écho légendaire" : "palier " + d;
    return {txt:`${what} dans ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2,"0")}`, hot: left < 10 || d === 12};
  }
  if(R.bossOn) return {txt: R.boss ? "Gardien en vue" : "", hot:true};
  const ev = [];
  if(R.nextElite < R.bossAt) ev.push({t:R.nextElite, n:"Élite"});
  if(R.nextMini < R.bossAt) ev.push({t:R.nextMini, n:"Alpha"});
  ev.push({t:R.bossAt, n:"Gardien"});
  ev.sort((a, b)=>a.t - b.t);
  const e = ev[0], left = Math.max(0, e.t - R.t);
  return {txt:`${e.n} dans ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2,"0")}`, hot: left < 10};
}
function brHudTick(R){
  const $ = id => document.getElementById(id);
  const xb = $("br-xpbar"); if(xb) xb.style.width = (R.xp / R.need * 100).toFixed(1) + "%";
  const lv = $("br-lv"); if(lv) lv.textContent = R.lv;
  const hp = Math.max(0, R.hp), hb = $("br-hpbar"), ht = $("br-hptxt");
  if(hb){ hb.style.width = (hp / R.maxHp * 100).toFixed(1) + "%"; hb.className = hp / R.maxHp < 0.35 ? "low" : ""; }
  if(ht) ht.textContent = Math.ceil(hp) + " / " + Math.round(R.maxHp);
  if((R.endless ? "deep" : "run") !== R.trackMode) brTrack(R);
  const fill = $("br-fill");
  if(fill){
    const k = R.endless ? ((R.t - R.bossAt) % 60) / 60 : Math.min(1, R.t / R.bossAt);
    fill.style.width = (k * 100).toFixed(1) + "%";
  }
  const tm = $("br-time");
  if(tm){
    const shown = R.endless ? R.t : Math.min(R.t, R.bossAt);
    tm.textContent = (R.endless ? "PROF. " + (R.depth || 1) + " · " : "") + String(Math.floor(shown / 60)).padStart(2, "0") + ":" + String(Math.floor(shown % 60)).padStart(2, "0");
  }
  const nx = $("br-next");
  if(nx){ const e = brNextEvent(R); nx.textContent = e.txt; nx.className = "br-next" + (e.hot ? " hot" : ""); }
  const k = $("br-kills"); if(k) k.textContent = fmt(R.kills);
  const bb = $("br-boss");
  if(bb){
    bb.className = "br-boss" + (R.boss ? " on" : "");
    if(R.boss){ $("br-bossname").textContent = POKE[R.boss.id].name; $("br-bossbar").style.width = ((R.bossHpPct || 1) * 100) + "%"; }
  }
  const tb = $("br-turbo");
  if(tb){ tb.className = "br-turbo" + (R.turbo > 0 ? " on" : ""); const bar = tb.firstElementChild; if(R.turbo > 0 && bar && bar.style) bar.style.width = (R.turbo / (R.mods.turboDur || 5) * 100) + "%"; }
  /* boosts actifs : on ne reecrit que si quelque chose a change */
  const bo = $("br-boosts");
  if(bo){
    const b = [];
    if(R.bonusDmg) b.push(`<span class="br-boost gold">Résonance +${Math.round(R.bonusDmg * 100)} %</span>`);
    if(R.bonusCd && R.bonusCd < 1) b.push(`<span class="br-boost gold">Hypervitesse −${Math.round((1 - R.bonusCd) * 100)} %</span>`);
    if(R.shield) b.push(`<span class="br-boost">⬡ Bouclier prêt</span>`);
    if(R.sitrusT > 0) b.push(`<span class="br-boost dim">● Sitrus ${Math.ceil(R.sitrusT)} s</span>`);
    if(R.revive) b.push(`<span class="br-boost">↺ Réindexation</span>`);
    if(R.buff) b.push(`<span class="br-boost gold">✧ ${esc(R.buff.n)} ${Math.ceil(R.buff.t)} s</span>`);
    if(R.missions){ const dn = R.missions.filter(m=>m.done).length;
      b.push(`<span class="br-boost ${dn === R.missions.length ? "gold" : ""}">◎ Missions ${dn}/${R.missions.length}</span>`); }
    const h = b.join("");
    if(h !== R.boostHtml){ R.boostHtml = h; bo.innerHTML = h; }
  }
}

/* ---------- pause ---------- */
function brPause(on){
  const R = BR; if(!R || R.over) return;
  if(R.modal && on) return;
  R.paused = on;
  const m = document.getElementById("br-modal");
  if(!m) return;
  if(!on){ m.className = ""; m.innerHTML = ""; R.last = performance.now(); return; }
  m.className = "on";
  m.innerHTML = `<div class="br-card">
    <div class="br-h">PAUSE</div>
    <div class="br-stats">
      <div><span>Temps</span><b>${Math.floor(R.t / 60)}:${String(Math.floor(R.t % 60)).padStart(2,"0")}</b></div>
      <div><span>Niveau</span><b>${R.lv}</b></div>
      <div><span>K.O.</span><b>${fmt(R.kills)}</b></div>
    </div>
    ${brBuildHtml(R)}
    ${Object.keys(R.items).length ? `<div class="br-itemlist">${Object.entries(R.items).map(([k2, l])=>{ const d = brItemDef(k2);
      return `<div class="br-il"><span class="br-ilg" style="color:${d.cat ? "#ffd24a" : d.c}">${d.cat ? TYPE_NAMES[d.cat].slice(0,3) : d.g}</span>
        <div class="grow"><div class="tiny">${esc(d.n)} <span class="dim">niv. ${l}</span></div><div class="tiny muted">${esc(d.d(l))}</div></div></div>`; }).join("")}</div>` : ""}
    <div class="br-syns-full">${brSynHtml(R, true)}</div>
    ${R.missions ? `<div class="br-mislist">${R.missions.map(m=>`<div class="${m.done ? "ok" : ""}">
      <span>${m.done ? "✓" : "◎"} ${esc(m.txt)}</span><b>${m.n}/${m.goal}</b></div>`).join("")}</div>` : ""}
    <button class="btn pri wide" data-act="brresume">Reprendre</button>
    <button class="btn ghost wide" style="margin-top:7px" data-act="brquit">Abandonner la run</button>
  </div>`;
}
ACTIONS.brpause = () => brPause(true);
ACTIONS.brresume = () => brPause(false);
ACTIONS.brquit = () => { if(BR){ BR.paused = false; brFinish(BR, false, true); } };
function brBuildHtml(R){
  return `<div class="br-build">
    ${R.team.map(w=>{ const st = brWeaponStats(w, R), A = brArch(brShownId(w));
      return `<div class="br-bw"><span class="sprbox" style="width:34px;height:34px">${sprite(brShownId(w), false, "")}</span>
        <div class="grow"><div class="tiny">${esc(POKE[brShownId(w)].name)} <span class="dim">niv. ${w.lv}${w.stage >= 2 ? " · éveillé" : ""}</span></div>
          <div class="tiny" style="color:${A.c}">${esc(brAttackName(w))} · ${Math.round(st.dmg)} dégâts${brSecOf(w) ? ` · ${esc(BR_SEC[brSecOf(w)].n)}` : ""}</div></div></div>`; }).join("")}
  </div>`;
}

/* ============================================================
   MONTÉE DE NIVEAU — un choix parmi trois
   ============================================================ */
function brOwnedPool(R){
  const inTeam = new Set(R.team.map(w=>w.id));
  const own = Object.keys(S.dex).map(Number).filter(id=>POKE[id] && !inTeam.has(id) && !isExclusive(id));
  /* on offre surtout des formes de base : leurs evolutions viendront pendant la run */
  const base = own.filter(id=>stageOf(id) === 0);
  return base.length >= 6 ? base : own;
}
function brChoices(R){
  const U = brState().upg, n = 3 + (U.choice ? 1 : 0), rng = R.rng;
  const pool = [];
  if(R.team.length < 6){
    const own = brOwnedPool(R);
    for(let k = 0; k < 3 && own.length; k++){
      const id = own[Math.floor(rng() * own.length)];
      if(!pool.some(o=>o.k === "new" && o.id === id)) pool.push({k:"new", id, w: POKE[id].leg ? 1 : 4});
    }
  }
  R.team.forEach((w, i)=>{ if(w.lv < BR_MAXLV) pool.push({k:"up", i, w: 6 + (w.lv >= 4 ? 2 : 0)}); });
  const held = Object.keys(R.items);
  if(held.length < 6){
    for(const key of Object.keys(BR_ITEMS)) if(!R.items[key]) pool.push({k:"item", key, w:2});
    const types = new Set(R.team.map(w=>POKE[brShownId(w)].types[0]));
    /* le catalyseur d'un type deja dans l'equipe revient souvent : c'est lui qui mene a l'evolution */
    for(const t of types) if(!R.items["cat" + t]) pool.push({k:"item", key:"cat" + t, w:5});
  }
  for(const key of held){ const d = brItemDef(key); if(R.items[key] < d.max) pool.push({k:"item", key, w:3}); }
  /* la toute premiere montee offre toujours un compagnon : l'equipe grandit vite */
  const out = [];
  if(R.lv === 2 && R.team.length < 6){ const f = pool.find(o=>o.k === "new"); if(f) out.push(f); }
  if(R.lv >= 5 && rng() < 0.07) out.push({k:"gold", g: BR_GOLD[Math.floor(rng() * BR_GOLD.length)]});
  while(out.length < n && pool.length){
    const tot = pool.reduce((a, o)=>a + o.w, 0);
    let x = rng() * tot, pickI = 0;
    for(let i = 0; i < pool.length; i++){ x -= pool[i].w; if(x <= 0){ pickI = i; break; } }
    const o = pool.splice(pickI, 1)[0];
    if(!out.some(q=>q.k === o.k && q.id === o.id && q.i === o.i && q.key === o.key)) out.push(o);
  }
  if(!out.length) out.push({k:"heal"}, {k:"data"});
  return out;
}
function brChoiceHtml(R, o, idx){
  if(o.k === "new"){
    const A = brArch(o.id), p = POKE[o.id];
    const sec = p.types[1], syn = brSynPreview(R, o.id);
    return `<div class="br-opt new" data-act="brpick" data-i="${idx}" style="--oc:${A.c}">
      <span class="br-tag">NOUVEAU</span>
      <span class="sprbox" style="width:56px;height:56px">${sprite(o.id, false, "")}</span>
      <div class="grow"><div class="br-on">${esc(p.name)} ${brMastery(o.id) ? `<span class="br-mast">${brMasteryStars(o.id)}</span>` : ""}</div>
        <div class="br-od"><span class="tt t${p.types[0]}">${TYPE_NAMES[p.types[0]]}</span> ${esc(A.n)}</div>
        ${sec ? `<div class="br-od2"><span class="tt t${sec}">${TYPE_NAMES[sec]}</span> ${esc(BR_SEC[sec].n)} : ${esc(BR_SEC[sec].d)}</div>` : ""}
        ${syn.map(y=>`<div class="br-od2 syn">Synergie ${esc(TYPE_NAMES[y.t])} : ${esc(y.d)}</div>`).join("")}</div></div>`;
  }
  if(o.k === "up"){
    const w = R.team[o.i], A = brArch(brShownId(w)), An = brAttackName(w);
    const next = w.lv + 1;
    const note = next === 5 && w.stage === 0 && brNextEvo(brShownId(w)) ? "Il évoluera"
               : next === BR_MAXLV ? "Niveau maximal" : `Niveau ${w.lv} → ${next}`;
    return `<div class="br-opt" data-act="brpick" data-i="${idx}" style="--oc:${A.c}">
      <span class="sprbox" style="width:56px;height:56px">${sprite(brShownId(w), false, "")}</span>
      <div class="grow"><div class="br-on">${esc(POKE[brShownId(w)].name)}</div>
        <div class="br-od">${esc(An)} · <b>${note}</b></div>
        <div class="br-pips">${Array.from({length:BR_MAXLV},(_,k)=>`<i class="${k < w.lv ? "on" : k === w.lv ? "nx" : ""}"></i>`).join("")}</div></div></div>`;
  }
  if(o.k === "item"){
    const d = brItemDef(o.key), l = (R.items[o.key] || 0) + 1;
    return `<div class="br-opt item" data-act="brpick" data-i="${idx}" style="--oc:${d.cat ? "#ffd24a" : d.c}">
      ${R.items[o.key] ? "" : `<span class="br-tag">${d.cat ? "CATALYSEUR" : "OBJET"}</span>`}
      <div class="br-ic">${d.cat ? `<span class="tt t${d.cat}">${TYPE_NAMES[d.cat].slice(0,3)}</span>` : `<span class="br-glyph">${d.g}</span>`}</div>
      <div class="grow"><div class="br-on">${esc(d.n)} ${l > 1 ? `<span class="dim">niv. ${l}</span>` : ""}</div>
        <div class="br-od">${esc(d.d(l))}</div></div></div>`;
  }
  if(o.k === "gold") return `<div class="br-opt gold" data-act="brpick" data-i="${idx}" style="--oc:#ffd24a">
      <span class="br-tag">RARE</span><div class="br-ic"><span class="br-glyph">★</span></div>
      <div class="grow"><div class="br-on">${esc(o.g.n)}</div><div class="br-od">${esc(o.g.d)}</div></div></div>`;
  if(o.k === "heal") return `<div class="br-opt" data-act="brpick" data-i="${idx}"><div class="br-ic">${ic("heart")}</div>
    <div class="grow"><div class="br-on">Réparation</div><div class="br-od">Rend 40% des PV.</div></div></div>`;
  return `<div class="br-opt" data-act="brpick" data-i="${idx}"><div class="br-ic">${ic("bolt")}</div>
    <div class="grow"><div class="br-on">Données</div><div class="br-od">+25 Données pour l'Archive.</div></div></div>`;
}
function brLevelUp(R){
  R.modal = true;
  R.hp = Math.min(R.maxHp, R.hp + R.maxHp * 0.10);
  R.choices = brChoices(R);
  try { Sfx.win(); buzz([15, 25, 15]); } catch(e){}
  brBurst(R, R.x, R.y, "#35f0d6", 26, 220, 0.6);
  const m = document.getElementById("br-modal");
  if(!m) return;
  m.className = "on lvl";
  m.innerHTML = `<div class="br-lvup">
    <div class="br-lvt">NIVEAU ${R.lv}</div>
    <div class="br-opts">${R.choices.map((o, i)=>brChoiceHtml(R, o, i)).join("")}</div>
    ${R.rerolls > 0 ? `<button class="btn ghost wide" data-act="brreroll">Relancer (${R.rerolls})</button>` : ""}
  </div>`;
}
ACTIONS.brreroll = () => { const R = BR; if(!R || R.rerolls <= 0) return; R.rerolls--; R.lv; brLevelUp(R); };
ACTIONS.brpick = d => {
  const R = BR; if(!R || !R.choices) return;
  const o = R.choices[+d.i];
  R.choices = null;
  const m = document.getElementById("br-modal"); if(m){ m.className = ""; m.innerHTML = ""; }
  if(o.k === "new"){ R.team.push({id:o.id, lv:1, stage:0, cd:0.3, orb:0}); brRecomputeMods(R); }
  else if(o.k === "up"){
    const w = R.team[o.i]; w.lv++;
    if(w.lv === 5 && w.stage === 0){ const to = brNextEvo(brShownId(w)); if(to){ brEvolve(R, w, to, 1); return; } }
  }
  else if(o.k === "item"){ R.items[o.key] = (R.items[o.key] || 0) + 1; brRecomputeMods(R); }
  else if(o.k === "gold"){ brApplyGold(R, o.g.k); brBanner(R, o.g.n.toUpperCase(), "#ffd24a"); }
  else if(o.k === "heal") R.hp = Math.min(R.maxHp, R.hp + R.maxHp * 0.4);
  else R.bonusData = (R.bonusData || 0) + 25;
  brHudTeam(R);
  brResume(R);
};
/* a la reprise : un bref instant d'invulnerabilite, le temps de se reperer */
function brResume(R){ R.modal = false; R.last = performance.now(); R.inv = Math.max(R.inv, 0.8); }
function brNextEvo(id){
  const e = POKE[id] && POKE[id].evo;
  if(!e || !e.length) return null;
  /* Evoli : on choisit selon l'heure, comme ailleurs dans le jeu */
  if(id === 133) return isNight() ? 197 : 196;
  return e[0].to;
}

/* ============================================================
   COFFRES ET ÉVOLUTIONS
   Un Pokemon au niveau maximal, tenant le catalyseur de son type,
   evolue au coffre suivant. La condition se decouvre en jouant.
   ============================================================ */
function brChest(R){
  const ready = R.team.find(w=>w.lv >= BR_MAXLV && w.stage < 2 && R.items["cat" + POKE[brShownId(w)].types[0]]);
  if(ready){
    const to = brNextEvo(brShownId(ready));
    brEvolve(R, ready, to, 2);
    return;
  }
  /* sinon, deux ou trois ameliorations tirees d'un coup, avec la roulette */
  R.modal = true;
  const gifts = [], n = 2 + (R.rng() < 0.25 + 0.1 * (brState().upg.luck || 0) ? 1 : 0);
  for(let k = 0; k < n; k++){
    const up = R.team.filter(w=>w.lv < BR_MAXLV);
    if(up.length && R.rng() < 0.7){ const w = up[Math.floor(R.rng() * up.length)]; w.lv++; gifts.push({id:brShownId(w), t:POKE[brShownId(w)].name + " niv. " + w.lv}); }
    else { R.hp = Math.min(R.maxHp, R.hp + 25); gifts.push({t:"+25 PV"}); }
  }
  brHudTeam(R);
  try { Sfx.shiny(); buzz([20, 30, 20]); } catch(e){}
  const m = document.getElementById("br-modal");
  if(!m) return;
  m.className = "on";
  m.innerHTML = `<div class="br-card chest">
    <div class="br-h" style="color:#ffd24a">COFFRE DE DONNÉES</div>
    <div class="br-roll" id="br-roll">${sprite(R.team[0].id, false, "")}</div>
    <div class="br-gifts" id="br-gifts" style="opacity:0">${gifts.map(g=>`<div>${g.id ? `<span class="sprbox" style="width:26px;height:26px">${sprite(g.id,false,"")}</span>` : ic("heart")}
      <span>${esc(g.t)}</span></div>`).join("")}</div>
    <button class="btn pri wide" id="br-chestok" data-act="brclose" style="visibility:hidden">Continuer</button>
  </div>`;
  /* roulette : les sprites de l'equipe defilent, ralentissent, s'arretent */
  const roll = document.getElementById("br-roll");
  let k = 0, delay = 50;
  const spin = () => {
    if(!roll || BR !== R) return;
    roll.innerHTML = sprite(brShownId(R.team[k++ % R.team.length]), false, "");
    try { Sfx.click(); } catch(e){}
    delay *= 1.18;
    if(delay < 320) setTimeout(spin, delay);
    else { document.getElementById("br-gifts").style.opacity = 1; document.getElementById("br-chestok").style.visibility = "visible";
      roll.classList.add("done"); try { Sfx.win(); } catch(e){} }
  };
  spin();
}
function brEvolve(R, w, to, stage){
  R.modal = true;
  const from = brShownId(w);
  const awaken = !to || to === from;
  const key = from + ">" + (to || "awake");
  const st = brState();
  const fresh = !st.evos.includes(key);
  if(fresh) st.evos.push(key);
  if(stage >= 2) S.flags.brEvo = true;
  const m = document.getElementById("br-modal") || {classList:{add(){}}};
  m.className = "on evo";
  m.innerHTML = `<div class="br-evo">
    <div class="br-evt">${awaken ? "ÉVEIL" : "QUOI ?"}</div>
    <div class="br-evs">
      <span class="br-e a">${sprite(from, false, "")}</span>
      ${awaken ? "" : `<span class="br-e b">${sprite(to, false, "")}</span>`}
    </div>
    <div class="br-evn" id="br-evn">${esc(POKE[from].name)} ${awaken ? "s'éveille…" : "évolue…"}</div>
    <button class="btn pri wide" id="br-evok" data-act="brclose" style="visibility:hidden">Continuer</button>
  </div>`;
  try { Sfx.wobble(); } catch(e){}
  setTimeout(()=>{
    if(BR !== R) return;
    if(!awaken) w.show = to;
    w.stage = stage;
    brRecomputeMods(R);
    const n = document.getElementById("br-evn");
    if(n) n.innerHTML = awaken
      ? `<b>${esc(POKE[from].name)}</b> s'est éveillé !<div class="tiny cy">${esc(brArch(from).n)} prend toute sa puissance.</div>`
      : `<b>${esc(POKE[from].name)}</b> a évolué en <b>${esc(POKE[to].name)}</b> !${fresh && stage >= 2 ? `<div class="tiny" style="color:#ffd24a">Nouvelle évolution découverte</div>` : ""}`;
    m.classList.add("done");
    const ok = document.getElementById("br-evok"); if(ok) ok.style.visibility = "visible";
    try { Sfx.win(); buzz([30, 40, 80]); } catch(e){}
    brBurst(R, R.x, R.y, "#ffffff", 40, 260, 0.8);
    brHudTeam(R);
  }, 2600);
}
ACTIONS.brclose = () => {
  const R = BR; if(!R) return;
  const m = document.getElementById("br-modal"); if(m){ m.className = ""; m.innerHTML = ""; }
  brResume(R);
};

/* ============================================================
   FIN DE RUN
   ============================================================ */
function brDeath(R){
  if(R.revive > 0){
    R.revive--; R.hp = R.maxHp * 0.5; R.inv = 2;
    brBanner(R, "RÉINDEXATION", "#35f0d6", "l'Archive vous relance une fois");
    brRing(R, R.x, R.y, 260, "#35f0d6", 0.6);
    R.P.foes.each(f=>{ if(!f.boss && Math.hypot(f.x - R.x, f.y - R.y) < 260) brHit(R, f, 9999, "#35f0d6"); });
    return;
  }
  R.over = true;
  try { Sfx.lose ? Sfx.lose() : Sfx.glitch(); buzz([60, 40, 120]); } catch(e){}
  setTimeout(()=>{ if(BR === R) brFinish(R, false); }, 900);
}
function brVictory(R){
  R.over = true;
  const m = document.getElementById("br-modal");
  if(!m) return;
  m.className = "on";
  m.innerHTML = `<div class="br-card win">
    <div class="br-h" style="color:#35f0d6">SECTEUR STABILISÉ</div>
    <div class="tiny muted" style="margin:6px 0 12px">La Brèche est refermée. Mais la faille, dessous, continue de s'ouvrir.</div>
    <button class="btn pri wide" data-act="brend">Encaisser la victoire</button>
    <button class="btn wide" style="margin-top:7px" data-act="brdeep">Descendre dans la faille profonde</button>
    <div class="tiny dim" style="margin-top:6px">Mode infini : les récompenses s'additionnent tant que vous tenez.</div>
  </div>`;
}
ACTIONS.brend = () => { if(BR) brFinish(BR, true); };
ACTIONS.brdeep = () => {
  const R = BR; if(!R) return;
  R.won = true; R.endless = true; R.over = false;
  const m = document.getElementById("br-modal"); if(m){ m.className = ""; m.innerHTML = ""; }
  brBanner(R, "FAILLE PROFONDE", "#ff3d7f", "jusqu'où tiendrez-vous ?");
  R.last = performance.now();
};

function brGuardianWin(g){
  const r = regionDef(g.region), i = r.guardians.findIndex(x=>x.id === g.id);
  const first = !guardianBeaten(r.key, g.id);
  const out = {first, card:null};
  if(first){
    S.bosses.push(guardianKey(r.key, g.id)); factionPts(50);
    addToDex(g.id, guardianLevel(r, i), false);
    addIntegrity(g.core ? 5 : 2.5);
    const cs = rollCardSeries(g.id, g.core ? 3.2 : 1.8);
    grantCardV(cs, g.id); out.card = cs;
    gain("cores", g.core ? 4 : 2);
  }
  S.stats.bossWins = (S.stats.bossWins || 0) + 1;
  return out;
}
function brFinish(R, won, quit){
  const st = brState();
  const survived = R.t, deep = R.endless ? Math.max(0, R.t - R.bossAt) : 0;
  R.won = R.won || won;
  const fw = R.won ? consumeFirstWin("boss") : 1;
  const depth = R.depth || 0, loot = (R.mods && R.mods.loot) || 1;
  const data = Math.round((R.kills * 0.35 + survived / 5 + R.lv * 3 + (R.won ? 80 : 0) + depth * depth * 12 + (R.echoes || 0) * 60 + (R.bonusData || 0)) * fw * loot * (R.daily ? 1.5 : 1));
  const coins = Math.round((R.kills * 4 + (R.won ? 900 : 0) + depth * 600) * fw * loot);
  st.bestDepth = Math.max(st.bestDepth || 0, depth);
  /* missions : chacune paie, et les trois ensemble paient davantage */
  const mis = R.missions || [], misDone = mis.filter(m=>m.done).length;
  const misAll = mis.length && misDone === mis.length;
  const misData = misDone * 40 + (misAll ? 80 : 0), misCoins = misDone * 400 + (misAll ? 800 : 0);
  st.data += misData; gain("coins", misCoins);
  if(misAll) st.fullClears = (st.fullClears || 0) + 1;
  /* les captifs liberes rejoignent l'archive */
  for(const id of (R.freed || [])) addToDex(id, 15, false);
  if(R.reaperDown) S.flags.brReaper = true;
  st.data += data; st.runs++; st.kills += R.kills;
  st.bestTime = Math.max(st.bestTime || 0, survived);
  gain("coins", coins); addXp(Math.round(80 + R.kills * 0.6 + (R.won ? 400 : 0)));
  /* la Breche nourrit la recherche : chaque espece affrontee compte */
  Object.entries(R.killsBy).sort((a, b)=>b[1] - a[1]).slice(0, 8).forEach(([id])=>researchTick(+id, "battle", 1));
  /* quelques elites vaincus sont restaures au Pokedex */
  const restored = [];
  for(const e of R.elitesDown) if(R.rng() < 0.3 || e.shiny){ addToDex(e.id, 20, !!e.shiny); restored.push(e); }
  for(const w of R.team) st.mastery[w.id] = (st.mastery[w.id] || 0) + 1;
  const bk = R.region + ":" + R.hab;
  const prev = st.best[bk] || {time:0, clear:false};
  let firstClear = false, gw = null;
  if(R.won){
    st.clears++;
    if(!prev.clear){ firstClear = true; addIntegrity(1.5); }
    if(R.guardian) gw = brGuardianWin(R.guardian);
  }
  st.best[bk] = {time:Math.max(prev.time, survived), clear: prev.clear || R.won};
  let dailyBest = false;
  if(R.daily){
    const score = brScore(R);
    if(st.daily.day !== today()) st.daily = {day:today(), best:0, plays:0};
    st.daily.plays++; st.dailyPlays = (st.dailyPlays || 0) + 1;
    if(score > st.daily.best){ st.daily.best = score; dailyBest = true; }
  }
  save(); checkAchievements();
  brShowResults(R, {data: data + misData, coins: coins + misCoins, restored, firstClear, gw, dailyBest, quit, misAll});
}
function brScore(R){ return Math.round(R.kills + R.t * 2 + R.lv * 10 + (R.won ? 500 : 0) + (R.endless ? (R.t - R.bossAt) * 4 : 0)); }
function brShowResults(R, o){
  R.over = true;
  const m = document.getElementById("br-modal");
  if(!m) return;
  const tot = Object.values(R.dmgBy).reduce((a, b)=>a + b, 0) || 1;
  m.className = "on res";
  m.innerHTML = `<div class="br-card results">
    <div class="br-h" style="color:${R.won ? "#35f0d6" : "#ff3d7f"}">${R.won ? (R.endless ? "FAILLE PROFONDE" : "BRÈCHE REFERMÉE") : o.quit ? "RUN ABANDONNÉE" : "L'ÉQUIPE A CÉDÉ"}</div>
    <div class="br-stats">
      <div><span>Temps</span><b>${Math.floor(R.t / 60)}:${String(Math.floor(R.t % 60)).padStart(2,"0")}</b></div>
      <div><span>Niveau</span><b>${R.lv}</b></div>
      <div><span>K.O.</span><b>${fmt(R.kills)}</b></div>
      ${R.daily ? `<div><span>Score</span><b>${fmt(brScore(R))}</b></div>` : ""}
      ${R.depth ? `<div><span>Profondeur</span><b style="color:#b06bff">${R.depth}</b></div>` : ""}
    </div>
    ${!R.won && !o.quit && R.t < R.bossAt ? `<div class="tiny" style="color:#ffb35c;margin:4px 0 8px">Il manquait ${Math.ceil((R.bossAt - R.t) / 60)} min avant le gardien de la Brèche.</div>` : ""}
    <div class="br-dmg">${R.team.map((w, i)=>{ const d = R.dmgBy[i] || 0;
      return `<div class="br-dr"><span class="sprbox" style="width:26px;height:26px">${sprite(brShownId(w), false, "")}</span>
        <div class="grow"><div class="br-db"><i style="width:${(d / tot * 100).toFixed(0)}%;background:${brArch(brShownId(w)).c}"></i></div></div>
        <b class="mono-num">${fmt(d)}</b></div>`; }).join("")}</div>
    ${R.missions ? `<div class="br-mislist res">${R.missions.map(m=>`<div class="${m.done ? "ok" : ""}">
      <span>${m.done ? "✓" : "✗"} ${esc(m.txt)}</span><b>${m.n}/${m.goal}</b></div>`).join("")}
      ${o.misAll ? `<div class="ok" style="justify-content:center"><b>Secteur exploré : bonus complet</b></div>` : ""}</div>` : ""}
    ${(R.freed || []).length ? `<div class="tiny muted" style="margin:6px 0 4px">Captifs libérés, restaurés au Pokédex</div>
      <div class="wrap" style="justify-content:center">${R.freed.map(id=>`<span class="sprbox" style="width:34px;height:34px">${sprite(id, false, "")}</span>`).join("")}</div>` : ""}
    <div class="br-rw">
      <span>${ic("bolt")} +${fmt(o.data)} Données</span>
      <span>${ic("coin")} +${fmt(o.coins)}</span>
      ${o.firstClear ? `<span class="ok">Intégrité +1,5 %</span>` : ""}
      ${o.dailyBest ? `<span style="color:#ffd24a">Record du jour</span>` : ""}
    </div>
    ${o.gw && o.gw.first ? `<div class="br-gw">${sprite(R.guardian.id, false, "")}<div><b>VERROU LEVÉ</b>
      <div class="tiny">${esc(POKE[R.guardian.id].name)} rejoint l'archive. Carte émise.</div></div></div>` : ""}
    ${o.restored.length ? `<div class="tiny muted" style="margin:8px 0 4px">Élites restaurés au Pokédex</div>
      <div class="wrap" style="justify-content:center">${o.restored.map(e=>`<span class="sprbox" style="width:34px;height:34px">${sprite(e.id, !!e.shiny, "")}</span>`).join("")}</div>` : ""}
    <div class="btn-grid c2" style="margin-top:12px">
      <button class="btn ghost" data-act="brexit">Retour</button>
      <button class="btn pri" data-act="bragain">Rejouer</button>
    </div>
  </div>`;
}
ACTIONS.brexit = () => { brStop(); go("breche"); checkStoryTriggers(); };
ACTIONS.bragain = () => {
  const R = BR; const o = {region:R.region, hab:R.hab, starter:R.team[0].id, daily:R.daily, seed:R.daily ? R.seed : 0, mod:R.mod, guardian:brGuardianFor(R.region)};
  brStop(); brStart(brNewRun(o));
};

/* ============================================================
   LE HALL
   ============================================================ */
function brGuardianFor(region){
  const r = regionDef(region);
  for(let i = 0; i < r.guardians.length; i++){
    const g = r.guardians[i];
    if(!guardianBeaten(r.key, g.id) && guardianAvailable(r, g, i))
      return {id:g.id, region:r.key, core:g.core};
  }
  return null;
}
function brHabOpen(region, k){ return !HABITATS[k].need || dexCount(region) >= HABITATS[k].need; }
const BR_MODS = [
  {k:"horde", n:"Horde", d:"50 % d'ennemis en plus"},
  {k:"vif",   n:"Frénésie", d:"Les ennemis sont 20 % plus rapides"},
  {k:"fort",  n:"Corruption dense", d:"Les ennemis ont 25 % de PV en plus"}
];
function brDaily(){
  const d = today(); let h = 2166136261;
  for(const ch of d){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const r = brRng(h);
  const regs = ["kanto"], habs = HABITAT_IDS.slice(0, 4);
  const starters = [1, 4, 7, 25, 133, 152, 155, 158, 252, 255, 258, 147, 63, 92];
  return {seed:h, region:regs[0], hab:habs[Math.floor(r() * habs.length)],
          starter:starters[Math.floor(r() * starters.length)], mod:BR_MODS[Math.floor(r() * BR_MODS.length)]};
}
const BR_UPG = {
  hp:     {n:"Coque renforcée",  max:5, base:40,  d:l=>`PV max +${10*l} %`},
  might:  {n:"Surtension",       max:5, base:50,  d:l=>`Dégâts +${8*l} %`},
  speed:  {n:"Bus rapide",       max:5, base:40,  d:l=>`Vitesse +${5*l} %`},
  magnet: {n:"Aimantation",      max:5, base:30,  d:l=>`Ramassage +${20*l} %`},
  regen:  {n:"Autoréparation",   max:3, base:80,  d:l=>`${(0.2*l).toFixed(1)} PV / s`},
  luck:   {n:"Flair",            max:3, base:90,  d:l=>`Coffres plus généreux (${l}/3)`},
  reroll: {n:"Relance",          max:3, base:120, d:l=>`${l} relance(s) de choix par run`},
  choice: {n:"Quatrième voie",   max:1, base:420, d:()=>`Quatre choix à chaque niveau`},
  revive: {n:"Réindexation",     max:1, base:360, d:()=>`Une résurrection par run`}
};
function brUpgCost(k){ const u = BR_UPG[k], l = brState().upg[k] || 0; return Math.round(u.base * Math.pow(1.7, l)); }
ACTIONS.brupg = d => {
  const st = brState(), u = BR_UPG[d.k], l = st.upg[d.k] || 0;
  if(l >= u.max) return;
  const c = brUpgCost(d.k);
  if(st.data < c){ toast("Données insuffisantes", "bad", "cross"); return; }
  st.data -= c; st.upg[d.k] = l + 1;
  Sfx.win(); save(); refresh();
};

let BR_LOBBY_TAB = "run";
SCREENS.breche = {
  after(){
    const st = brState();
    if(!S.flags.brecheIntro){ S.flags.brecheIntro = true; save(); playCine(CINEMAS.breche_intro, ()=>refresh()); }
  },
  html(){
    const st = brState(), dl = brDaily();
    /* depart par defaut : le Pokemon le plus robuste de la collection */
    if(!st.starter || !POKE[st.starter]){
      const own = Object.keys(S.dex).map(Number).filter(id=>POKE[id] && !POKE[id].leg).sort((a,b)=>POKE[b].bst - POKE[a].bst);
      st.starter = own[0] || 25;
    }
    const regions = REGIONS.filter(r=>regionUnlocked(r.key));
    if(!regions.some(r=>r.key === st.region)) st.region = regions[0].key;
    const g = brGuardianFor(st.region);
    const dToday = st.daily.day === today() ? st.daily : {best:0, plays:0};
    return `
      <div class="br-lobbyhead">
        <div class="br-title">LA BRÈCHE</div>
        <div class="br-sub">La faille déborde dans les secteurs restaurés. Tenez, choisissez, évoluez.</div>
      </div>
      <div class="segbar">
        <button class="${BR_LOBBY_TAB==="run"?"on":""}" data-act="brtab" data-t="run">${ic("map")}<span>Brèches</span></button>
        <button class="${BR_LOBBY_TAB==="arch"?"on":""}" data-act="brtab" data-t="arch">${ic("grid")}<span>Archive</span>
          <span class="br-datapill">${fmt(st.data)}</span></button>
      </div>
      ${BR_LOBBY_TAB === "arch" ? this.arch(st) : `
      <div class="br-daily" data-act="brdaily">
        <div class="br-dhead"><span class="br-dtag">BRÈCHE DU JOUR</span><span class="tiny dim">même graine pour tous</span></div>
        <div class="row" style="gap:10px">
          <span class="sprbox" style="width:48px;height:48px">${sprite(dl.starter, false, "")}</span>
          <div class="grow">
            <div class="tiny">${esc(HABITATS[dl.hab].n)} · <b style="color:#ff3d7f">${esc(dl.mod.n)}</b></div>
            <div class="tiny muted">${esc(dl.mod.d)} · départ imposé : ${esc(POKE[dl.starter].name)}</div>
            <div class="tiny cy">${dToday.best ? `Record du jour : ${fmt(dToday.best)}` : "Pas encore tentée aujourd'hui"} · Données ×1,5</div>
          </div>
          ${ic("arrow")}
        </div>
      </div>

      <div class="h sm" style="margin-top:12px">CHOISIR UNE BRÈCHE</div>
      ${regions.length > 1 ? `<div class="chipbar">${regions.map(r=>`<button class="chip ${st.region===r.key?"on":""}" data-act="brreg" data-r="${r.key}">${esc(r.name)}</button>`).join("")}</div>` : ""}
      <div class="br-habs">
        ${HABITAT_IDS.map(k=>{
          const h = HABITATS[k], open = brHabOpen(st.region, k), b = st.best[st.region + ":" + k];
          return `<div class="br-hab ${st.hab===k?"on":""} ${open?"":"locked"}" style="--hc:${h.c}" ${open?`data-act="brhab" data-k="${k}"`:""}>
            <div class="br-hn">${open ? esc(h.n) : "Verrouillé"}</div>
            ${open ? `<div class="br-htag">${esc(BR_TERRAIN[k].tag)}</div>` : ""}
            <div class="br-hs">${open ? (b ? (b.clear ? "✓ refermée" : "record " + Math.floor(b.time/60) + ":" + String(Math.floor(b.time%60)).padStart(2,"0")) : "jamais tentée") : h.need + " espèces"}</div>
          </div>`;}).join("")}
      </div>
      <div class="br-guard">${g
        ? `<span class="guardsil">${sprite(g.id, false, "sm")}</span><div><div class="tiny">Gardien de la Brèche : <b>signature détectée</b></div>
           <div class="tiny muted">Tenez 8 minutes. Le vaincre lève un verrou de ${esc(regionDef(st.region).name)}.</div></div>`
        : `<div class="guardunknown">?</div><div><div class="tiny">Gardien : un alpha de l'habitat</div>
           <div class="tiny muted">Aucun verrou détectable ici pour l'instant. Restaurez davantage d'espèces.</div></div>`}</div>

      <div class="br-starter" data-act="brstarter">
        <span class="sprbox" style="width:52px;height:52px">${sprite(st.starter, S.dex[st.starter] && S.dex[st.starter].shiny, "")}</span>
        <div class="grow"><div class="tiny dim">Pokémon de départ</div>
          <div>${esc(POKE[st.starter].name)} <span class="tt t${POKE[st.starter].types[0]}">${TYPE_NAMES[POKE[st.starter].types[0]]}</span>
            ${brMastery(st.starter) ? `<span class="br-mast">${brMasteryStars(st.starter)}</span>` : ""}</div>
          <div class="tiny" style="color:${brArch(st.starter).c}">${esc(brArch(st.starter).n)}</div></div>
        <span class="tiny cy">Changer</span>
      </div>
      <button class="br-go" data-act="brgo">ENTRER DANS LA BRÈCHE</button>
      <div class="tiles c3" style="margin-top:10px">
        <div class="tile"><div class="k">Runs</div><div class="v">${st.runs}</div></div>
        <div class="tile accent"><div class="k">Refermées</div><div class="v">${st.clears}</div></div>
        <div class="tile gold"><div class="k">K.O.</div><div class="v">${fmt(st.kills)}</div></div>
      </div>`}`;
  },
  arch(st){
    return `<div class="tiny muted" style="margin-bottom:9px">Chaque run rapporte des Données, même perdue.
      L'Archive les convertit en renforts permanents.</div>
      <div class="list">${Object.entries(BR_UPG).map(([k,u])=>{
        const l = st.upg[k] || 0, maxed = l >= u.max, c = brUpgCost(k);
        return `<div class="item ${maxed?"on":""}">
          <div class="perk-lv">${l}/${u.max}</div>
          <div class="grow"><div class="t">${esc(u.n)}</div>
            <div class="d">${esc(maxed ? u.d(l) : u.d(l + 1))}</div></div>
          ${maxed ? `<span class="tiny cy">max</span>` : `<button class="btn sm ${st.data>=c?"gold":""}" data-act="brupg" data-k="${k}" ${st.data>=c?"":"disabled"}>${fmt(c)}</button>`}
        </div>`;}).join("")}</div>
      <div class="h sm" style="margin-top:12px">ÉVOLUTIONS DÉCOUVERTES <span class="tiny dim">${st.evos.length}</span></div>
      <div class="tiny muted">Un Pokémon au niveau maximal évolue au coffre suivant… à condition de tenir le bon objet.</div>`;
  }
};
ACTIONS.brtab = d => { BR_LOBBY_TAB = d.t; refresh(); };
ACTIONS.brreg = d => { const st = brState(); st.region = d.r; st.hab = "route"; saveSoon(); refresh(); };
ACTIONS.brhab = d => { brState().hab = d.k; saveSoon(); refresh(); };
ACTIONS.brstarter = () => teamPicker("Pokémon de départ", 1, ids=>{ if(ids.length){ brState().starter = ids[0]; save(); refresh(); } }, [brState().starter]);
ACTIONS.brgo = () => {
  const st = brState();
  brStart(brNewRun({region:st.region, hab:st.hab, starter:st.starter, guardian:brGuardianFor(st.region)}));
};
ACTIONS.brdaily = () => {
  const dl = brDaily();
  brStart(brNewRun({region:dl.region, hab:dl.hab, starter:dl.starter, seed:dl.seed, daily:true, mod:dl.mod.k, guardian:null}));
};

/* ---------- la scène d'accueil ---------- */
CINEMAS.breche_intro = {id:"breche_intro", title:"La Brèche", shots:[{bg:"faille", beats:[
  {t:"bars", on:true},
  {t:"par", beats:[{t:"fx", k:"glitch", lv:2, ms:700}, {t:"sfx", k:"glitch"}]},
  {t:"card", text:"LA BRÈCHE", sub:"signal instable", hold:1500, big:true},
  {t:"actor", id:"pz", kind:"pz", pos:"center", y:32, enter:"assemble", mood:"Worried"},
  {t:"say", who:"pz", text:"Une Brèche. La faille déborde dans un secteur qu'on avait pourtant restauré."},
  {t:"mood", id:"pz", mood:"Determined"},
  {t:"say", who:"pz", text:"Glisse ton pouce pour te déplacer. Tes Pokémon attaquent seuls, chacun à sa manière."},
  {t:"say", who:"pz", text:"À chaque niveau, tu choisis. Tiens huit minutes, et ce qui garde la Brèche finira par se montrer."},
  {t:"say", who:"pz", text:"Et si tu perds : tout ce que tu as récolté reste acquis. Recommence."},
  {t:"leave", id:"pz", how:"fade"}
]}]};

/* ---------- succès ---------- */
ACHIEVEMENTS.push(
  {id:"b_first",  n:"Brèche refermée",   d:"Tenir jusqu'au gardien d'une Brèche et le vaincre.",
   chk:s=>(s.breche && s.breche.clears || 0) >= 1, rw:{cores:3}},
  {id:"b_evo",    n:"Réveil",            d:"Provoquer une évolution finale dans la Brèche.",
   chk:s=>!!s.flags.brEvo, rw:{cores:2}},
  {id:"b_kills",  n:"Défragmenteur",     d:"Mettre K.O. 2 000 entités corrompues dans la Brèche.",
   chk:s=>(s.breche && s.breche.kills || 0) >= 2000, rw:{coins:5000}},
  {id:"b_deep",   n:"Faille profonde",   d:"Survivre 12 minutes dans une même Brèche.",
   chk:s=>(s.breche && s.breche.bestTime || 0) >= 720, rw:{cores:5}},
  {id:"b_depth6", n:"Sous la surface",   d:"Atteindre la profondeur 6 de la faille.",
   chk:s=>(s.breche && s.breche.bestDepth || 0) >= 6, rw:{cores:4}},
  {id:"b_reaper", n:"Ce qui n'aurait pas dû tomber", d:"Vaincre ce qui chasse au fond de la faille.", hid:1,
   chk:s=>!!s.flags.brReaper, rw:{cores:12}},
  {id:"b_explore", n:"Explorateur de la faille", d:"Accomplir les trois missions d'une même Brèche.",
   chk:s=>(s.breche && s.breche.fullClears || 0) >= 1, rw:{cores:3}},
  {id:"b_daily",  n:"Rituel",            d:"Jouer 7 Brèches du jour (pas forcément d'affilée).",
   chk:s=>(s.breche && s.breche.dailyPlays || 0) >= 7, rw:{cores:3}}
);
