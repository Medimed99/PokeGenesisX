/* ============================================================
   55b — LA TOUR : l'écran, à la manière de Summoners War
   Scénario (carte du monde) → zone (difficultés, sept paliers) →
   préparation (vagues à affronter, quatre emplacements dont le
   meneur, la liste de ses Pokémon) → combat en vue de trois
   quarts (équipe en bas à gauche, monstres en haut à droite,
   boutons ronds de compétences, flèche sur la cible) → résultats
   (étoiles, expérience, récompenses).
   ============================================================ */

let SQB = null;          /* le combat en cours */
let SQV = null;          /* ce que l'ecran en montre */
let SQ_ZSEL = 0;         /* la zone ouverte */
let SQ_DSEL = 0;         /* la difficulte choisie */
let SQ_PREP = null;      /* la preparation en cours */

const SQ_KIND_IC = {atk:"battle", aoe:"boss", team:"heart"};
const sqCol = t => (typeof arCol === "function" ? arCol(t) : "#35f0d6");
function sqTypeDot(t, size){ return `<span class="sw-tdot" style="--tc:${sqCol(t)};width:${size || 12}px;height:${size || 12}px" title="${TYPE_NAMES[t]}"></span>`; }

/* ============================================================
   1. LES ÉCRANS
   ============================================================ */
SCREENS.tower = {
  html(arg){
    if(arg === "fight" && SQB) return sqFightHtml();
    if(arg === "prep" && SQ_PREP) return sqPrepHtml();
    if(arg === "zone") return sqZoneHtml();
    return sqWorldHtml();
  },
  after(host, arg){
    pmdWake();
    if(arg === "fight" && SQB) sqFightAfter();
    else if(typeof tutoMaybe === "function") tutoMaybe(arg === "prep" ? "towerprep" : !arg ? "tower" : "");
  }
};

/* ---------- le scénario : la carte du monde ---------- */
function sqWorldHtml(){
  const q = sqState(), T = typeof towerState === "function" ? towerState() : {points:0};
  const team = sqDefaultTeam();
  const path = SQ_ZONES.map(Z=>`${Z.x},${Z.y}`).join(" ");
  return `
    <div class="xhead">
      <div class="h" style="margin:0">${ic("boss")} LA TOUR ${infoBtn("tower")}</div>
      <span class="pill">${itemIcon("exp:i_ct", 16) || ""} ${q.scrolls} parchemin${q.scrolls > 1 ? "s" : ""}</span>
    </div>
    <div class="sw-world">
      ${SQ_ZONES.map((Z, z)=>{ const B = (typeof XBIOME !== "undefined" && XBIOME[Z.biome]) || {g:["#5aa83c"], e:"#3b7f2e"};
        return `<span class="sw-isl" style="left:${Z.x}%;top:${Z.y}%;--ia:${B.g[0]};--ib:${B.e}"></span>`; }).join("")}
      <svg class="sw-path" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${path}"/></svg>
      ${SQ_ZONES.map((Z, z)=>{
        const open = sqZoneOpen(z, 0), st = [0, 1, 2].reduce((a, d)=>a + sqZoneStars(z, d), 0);
        return `<button class="sw-node ${open ? "" : "locked"}" style="left:${Z.x}%;top:${Z.y}%;--zc:${Z.c}" data-act="sqzone" data-z="${z}" ${open ? "" : "disabled"}>
          <span class="sw-med">${open ? pmdCanvas(Z.boss, 0, 54) : `<i>${ic("lock") || "?"}</i>`}</span>
          <b>${esc(Z.n)}</b><small>${open ? `★ ${st} / ${SQ_STAGES * 9}` : "verrouillée"}</small></button>`; }).join("")}
    </div>
    <div class="sw-teambar">
      <div class="sw-tb-mons">${[0, 1, 2, 3].map(i=>{ const id = team[i];
        return `<span class="sw-tb-m ${i === 0 ? "lead" : ""}">${id ? sprite(id, S.dex[id].shiny, "") : ""}${i === 0 ? `<i class="sw-crown">♛</i>` : ""}</span>`; }).join("")}</div>
      <div class="grow tiny">${team.length ? `<b>Meneur :</b> ${esc(sqLeaderText(sqLeaderOf(team[0])))}` : "Archivez des Pokémon pour composer une équipe."}</div>
      <button class="btn xs" data-act="sqskills" ${team.length ? "" : "disabled"}>${ic("bolt")} Compétences</button>
    </div>
    <button class="sw-lockbar" data-act="goto" data-to="boss">
      <span class="sw-lockic">${ic("lock")}</span>
      <span class="grow"><b>VERROUS LÉGENDAIRES</b><small>${sqLockCount()} / 9 levés · ailes 2, 4 et 6</small></span>
      ${sqLockReady() ? `<i class="badge"></i>` : ""}${ic("arrow")}</button>
    ${T.points ? `<button class="btn sm ghost wide" style="margin-top:8px" data-act="towerbuffs">${ic("star")} ${T.points} renfort(s) de lignée à attribuer</button>` : ""}
    <div class="tiny dim" style="margin-top:8px">Les ailes s'ouvrent l'une après l'autre en battant leur boss. Les difficultés Difficile et Enfer
      s'ouvrent aile par aile. Au sommet des ailes 2, 4 et 6 se tiennent les verrous : ceux de Kanto en Normal, de Johto en Difficile, de Hoenn en Enfer.</div>`;
}
ACTIONS.sqzone = d => { SQ_ZSEL = +d.z; SQ_DSEL = 0; go("tower", "zone"); };
ACTIONS.sqdiff = d => { if(!sqDiffOpen(SQ_ZSEL, +d.d)) return; SQ_DSEL = +d.d; refresh(); };

/* ---------- une zone : difficultés et sept paliers ---------- */
function sqZoneHtml(){
  const z = SQ_ZSEL, Z = SQ_ZONES[z], d = SQ_DSEL;
  return `
    <div class="sw-zban" style="--zc:${Z.c}">
      <button class="sw-back" data-act="sqworld">${ic("arrow")}</button>
      <div class="grow"><small>SCÉNARIO</small><b>${esc(Z.n)}</b>
        <span class="row" style="gap:4px;margin-top:4px">${Z.types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}</span></div>
      <span class="sw-zboss">${pmdCanvas(Z.boss, 0, 74)}</span>
    </div>
    <div class="sw-diffs">${SQ_DIFFS.map((D, i)=>{ const ok = sqDiffOpen(z, i);
      return `<button class="${i === d ? "on" : ""} ${ok ? "" : "locked"}" style="--dc:${D.c}" data-act="sqdiff" data-d="${i}" ${ok ? "" : "disabled"}>
        ${D.n}<small>${ok ? `★ ${sqZoneStars(z, i)}/${SQ_STAGES * 3}` : "boss précédent requis"}</small></button>`; }).join("")}</div>
    <div class="sw-stages">${Array.from({length:SQ_STAGES}, (_, s)=>{
      const ok = sqStageOpen(z, s, d), st = sqStars(z, s, d), boss = s === SQ_STAGES - 1, rw = sqRewards(z, s, true, d);
      return `<button class="sw-stage ${ok ? "" : "locked"} ${boss ? "boss" : ""} ${st ? "clear" : ""}" style="--zc:${Z.c}" data-act="sqprep" data-s="${s}" ${ok ? "" : "disabled"}>
        <span class="sw-sn">${boss ? pmdCanvas(Z.boss, 0, 40) : s + 1}</span>
        <span class="grow"><b>${boss ? "Boss · " + esc(POKE[Z.boss].name) : "Palier " + (s + 1)}</b>
          <small>3 vagues · niveau ${sqStageLevel(z, s, d)}</small>
          ${!st && ok ? `<small class="sw-first">1re victoire : ${fmt(rw.coins)} PokéCoins · ${rw.scrolls} parchemin${rw.scrolls > 1 ? "s" : ""}</small>` : ""}</span>
        <span class="sw-st">${[0, 1, 2].map(k=>`<i class="${k < st ? "on" : ""}">★</i>`).join("")}</span>
      </button>`; }).join("")}${sqZoneLockCard(z, d)}</div>`;
}
/* le verrou au sommet de l'aile, s'il y en a un dans cette difficulte */
function sqZoneLockCard(z, d){
  const L = sqLockAt(z, d); if(!L) return "";
  const beaten = guardianBeaten(L.r.key, L.g.id), open = sqLockOpen(L.r, L.i);
  const gateOk = sqLockGateOk(L.r, L.i);
  const why = !regionUnlocked(L.r.key) ? `Secteur ${esc(L.r.name)} encore fermé`
    : !gateOk ? "Battez le boss de cette aile"
    : dexCount(L.r.key) < L.g.need ? `${dexCount(L.r.key)} / ${L.g.need} espèces de ${esc(L.r.name)} archivées`
    : "Levez d'abord le verrou précédent";
  return `<button class="sw-stage lock ${open ? "" : "locked"} ${beaten ? "clear" : ""}" data-act="sqlockgo" data-r="${L.r.key}" data-i="${L.i}" ${open ? "" : "disabled"}>
    <span class="sw-sn">${beaten ? pmdCanvas(L.g.id, 0, 40) : `<span class="guardsil">${sprite(L.g.id, false, "")}</span>`}</span>
    <span class="grow"><b>Verrou · ${beaten ? esc(L.g.name) : "signature " + (open ? "détectée" : "inconnue")}</b>
      <small>${esc(L.r.name)} · niveau ${sqLockLevel(L.r, L.i)}</small>
      <small class="${open ? "sw-first" : ""}">${beaten ? "Levé — rejouable" : open ? "Prêt à être affronté" : why}</small></span>
    <span class="sw-lk">${ic(beaten ? "check" : "lock")}</span></button>`;
}
ACTIONS.sqworld = () => go("tower");

/* ---------- la préparation ---------- */
ACTIONS.sqprep = d => {
  const q = sqState(), s = +d.s;
  if(!sqStageOpen(SQ_ZSEL, s, SQ_DSEL)) return;
  SQ_PREP = {z:SQ_ZSEL, s, d:SQ_DSEL, team:sqDefaultTeam(),
             waves:sqWaves(SQ_ZSEL, s, null, SQ_DSEL), sort:"lvl"};
  go("tower", "prep");
};
/* la premiere fois, l'equipe se compose d'elle-meme : les quatre plus solides de l'archive,
   le meneur en tete s'il y en a un ; ensuite, c'est celle qu'on a laissee */
function sqDefaultTeam(){
  const q = sqState(), t = q.team.filter(id=>S.dex[id]).slice(0, SQ_TEAM);
  if(t.length) return t;
  const pw = id => S.dex[id].lvl * 4 + POKE[id].bst / 10;
  const ids = Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>pw(b) - pw(a)).slice(0, SQ_TEAM);
  const L = ids.findIndex(id=>sqLeaderOf(id));
  if(L > 0) ids.unshift(ids.splice(L, 1)[0]);
  return ids;
}
function sqPrepHtml(){
  const P = SQ_PREP, Z = SQ_ZONES[P.z], D = SQ_DIFFS[P.d];
  const L = P.team[0] ? sqLeaderOf(P.team[0]) : null;
  const ids = Object.keys(S.dex).map(Number).filter(id=>POKE[id]);
  ids.sort(P.sort === "lvl" ? (a, b)=>S.dex[b].lvl - S.dex[a].lvl || POKE[b].bst - POKE[a].bst : (a, b)=>POKE[b].bst - POKE[a].bst);
  return `
    <div class="sw-prep">
      <div class="sw-ph">
        <button class="sw-back" data-act="sqzoneback">${ic("arrow")}</button>
        <div class="grow"><small>PRÉPARATION</small><b>${P.lock ? "Verrou · " + esc(sqLockName(P.lock)) : esc(Z.n) + " · " + (P.s === SQ_STAGES - 1 ? "Boss" : "Palier " + (P.s + 1))}</b></div>
        <span class="sw-diff" style="--dc:${P.lock ? "#ff3d7f" : D.c}">${P.lock ? esc(regionDef(P.lock.r).name) : D.n}</span>
      </div>
      <div class="sw-waves">${P.waves.map((W, w)=>`<div class="sw-wrow"><small>VAGUE ${w + 1}</small>
        ${W.map(m=>`<span class="sw-wm ${m.boss ? "boss" : ""}" style="--tc:${sqCol(POKE[m.id].types[0])}">${m.guardian && !guardianBeaten(P.lock.r, m.id) ? `<span class="guardsil">${sprite(m.id, false, "")}</span>` : sprite(m.id, false, "")}<i>${m.lv}</i></span>`).join("")}</div>`).join("")}</div>
      ${P.lock ? `<div class="sw-lockhint">${ic("bolt")} Insensible à l'étourdissement et aux pertes de jauge. À mi-vie, il se reconfigure : purge, Attaque +, deux renforts.
        Types : ${POKE[P.lock.id].types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join(" ")}</div>` : ""}
      <div class="sw-slots">${[0, 1, 2, 3].map(i=>{ const id = P.team[i];
        return `<button class="sw-slot ${i === 0 ? "lead" : ""} ${id ? "" : "empty"}" data-act="sqslot" data-i="${i}">
          ${i === 0 ? `<span class="sw-crown2">♛ MENEUR</span>` : ""}
          ${id ? `${pmdCanvas(id, 0, 62, {shiny:S.dex[id].shiny})}<b>${esc(POKE[id].name)}</b><small>N.${S.dex[id].lvl} ${POKE[id].types.map(t=>sqTypeDot(t, 9)).join("")}</small>`
               : `<span class="sw-plus">+</span>`}</button>`; }).join("")}</div>
      <div class="sw-leader ${L ? "" : "none"}">♛ ${P.team[0] ? esc(sqLeaderText(L)) : "Le premier emplacement est celui du meneur."}</div>
      <div class="row between" style="margin:10px 0 6px"><div class="h sm" style="margin:0">VOS POKÉMON</div>
        <div class="segmini"><button class="${P.sort === "lvl" ? "on" : ""}" data-act="sqsort" data-k="lvl">Niveau</button><button class="${P.sort === "bst" ? "on" : ""}" data-act="sqsort" data-k="bst">Puissance</button></div></div>
      <div class="sw-grid">${ids.map(id=>{ const k = P.team.indexOf(id);
        return `<button class="sw-cell ${k >= 0 ? "picked" : ""}" data-act="sqpickmon" data-id="${id}">
          ${sprite(id, S.dex[id].shiny, "")}<i class="sw-lv">${S.dex[id].lvl}</i>${k >= 0 ? `<i class="sw-no">${k === 0 ? "♛" : k + 1}</i>` : ""}
          <span class="sw-cell-t">${POKE[id].types.map(t=>`<i style="background:${sqCol(t)}"></i>`).join("")}</span>${sqLeaderOf(id) ? `<i class="sw-hasl">♛</i>` : ""}</button>`; }).join("")}</div>
      <div class="sw-go"><button class="btn pri wide" data-act="sqfight" ${P.team.length ? "" : "disabled"}>COMBAT</button></div>
    </div>`;
}
ACTIONS.sqzoneback = () => { const lk = SQ_PREP && SQ_PREP.lock; SQ_PREP = null; lk ? go("boss") : go("tower", "zone"); };
ACTIONS.sqsort = d => { SQ_PREP.sort = d.k; refresh(); };
ACTIONS.sqslot = d => { const P = SQ_PREP; if(P.team[+d.i] !== undefined){ P.team.splice(+d.i, 1); sqPrepRefresh(); } };
ACTIONS.sqpickmon = d => {
  const P = SQ_PREP, id = +d.id, k = P.team.indexOf(id);
  if(k >= 0) P.team.splice(k, 1);
  else if(P.team.length < SQ_TEAM) P.team.push(id);
  else { toast("Équipe complète : touchez un emplacement pour le libérer", "bad", "cross"); return; }
  sqPrepRefresh();
};
/* on redessine sans perdre sa place dans la liste */
function sqPrepRefresh(){ const sc = document.getElementById("screen"), top = sc ? sc.scrollTop : 0; refresh(); if(sc) sc.scrollTop = top; }
ACTIONS.sqfight = () => {
  const P = SQ_PREP; if(!P || !P.team.length) return;
  const q = sqState(); q.team = P.team.slice(); if(S.team.length < 3) S.team = P.team.slice(0, 6); save();
  SQB = sqNewBattle(P.team, P.z, P.s, {d:P.d, waves:P.waves, lock:P.lock || null});
  SQV = {busy:false, wait:null, pick:0, target:null, pops:[], banner:null, t:0, last:0, raf:0, shake:0, parts:[], rings:[], orbs:[]};
  for(const u of [...SQB.allies, ...SQB.foes]) u._v = {enter:0};
  go("tower", "fight");
  SQV.banner = {txt:"VAGUE 1", c:"#ffffff", t0:0, big:true};
  setTimeout(sqLoop, 1100);
};

/* ---------- les compétences, et leur montée ---------- */
const SQ_FXN = {brn:"brûlure", psn:"poison", stun:"étourdit", slow:"ralentit", defdn:"Défense −", atkdn:"Attaque −", atkup:"Attaque +",
  defup:"Défense +", spdup:"Vitesse +", shield:"bouclier", heal:"soin", cleanse:"purge", "atb+":"jauge +", "atb-":"jauge −", crit:"critique +", pierce:"ignore la Défense"};
function sqDescribe(sk){
  const bits = [];
  const m = sk.mult ? (+sk.mult).toFixed(2).replace(/\.?0+$/, "") : "";
  if(sk.kind === "atk") bits.push(`Dégâts ×${m} sur une cible${sk.hits > 1 ? ` en ${sk.hits} coups` : ""}`);
  if(sk.kind === "aoe") bits.push(`Dégâts ×${m} sur tous les adversaires`);
  if(sk.kind === "team") bits.push("Sur toute l'équipe");
  for(const f of sk.fx){
    let t = SQ_FXN[f.k] || f.k;
    if(f.k === "heal") t = `soigne ${Math.round(f.v * 100)} %${f.team ? " à l'équipe" : ""}`;
    if(f.k === "shield") t = `bouclier de ${Math.round(f.v * 100)} % des PV`;
    if(f.k === "atb-" || f.k === "atb+") t = `${SQ_FXN[f.k]}${f.v} %${f.self ? " (soi)" : ""}`;
    if(f.k === "crit") t = `critique +${Math.round(f.v * 100)} %`;
    if(f.p !== undefined && f.p < 1) t = `${Math.round(f.p * 100)} % : ${t}`;
    if(f.t && !["heal", "cleanse"].includes(f.k)) t += ` (${f.t} t.)`;
    if(f.team && f.k !== "heal") t += " à l'équipe";
    bits.push(t);
  }
  if(sk.cd) bits.push(`recharge ${sk.cd} tours`);
  return bits.join(" · ");
}
ACTIONS.sqskills = () => {
  const q = sqState();
  const ids = (SQ_PREP ? SQ_PREP.team : q.team).filter(id=>S.dex[id]);
  sheet(`${sheetHead("Compétences")}
    <div class="tiny muted" style="margin-bottom:9px">${q.scrolls} parchemin(s). Chaque niveau : +8 % d'effet ;
      au niveau ${SQ_SKILL_MAX}, la recharge baisse d'un tour. La montée vaut pour toute la lignée.</div>
    ${ids.map(id=>{
      const lv = sqSkillLv(id), L = sqLeaderOf(id);
      return `<div class="sq-skrow">
        <div class="row" style="gap:8px">${pmdCanvas(id, 0, 44)}<div class="grow"><b>${esc(POKE[id].name)}</b>
          <div class="tiny ${L ? "gold-t" : "dim"}">${L ? "♛ Meneur : " + sqLeaderText(L) : "Pas de passif de meneur"}</div></div></div>
        ${sqSkillsOf(id).map((s0, i)=>{ const s = sqApplyLv(s0, lv[i]), max = lv[i] >= SQ_SKILL_MAX, cost = SQ_SKILL_COST[lv[i]];
          return `<div class="sq-sk">
            <span class="sw-skic sm" style="--sc:${sqCol(s.t)}">${ic(SQ_KIND_IC[s.kind])}</span>
            <div class="grow"><b>${esc(s.n)}</b> <span class="sq-lv">${"◆".repeat(lv[i])}${"◇".repeat(SQ_SKILL_MAX - lv[i])}</span>
              <div class="tiny muted">${esc(sqDescribe(s))}</div></div>
            ${max ? `<span class="tiny gold-t">max</span>` : `<button class="btn xs ${q.scrolls >= cost ? "pri" : ""}" data-act="squp" data-id="${id}" data-i="${i}" ${q.scrolls >= cost ? "" : "disabled"}>${cost} ${ic("arrow")}</button>`}
          </div>`; }).join("")}
      </div>`; }).join("") || `<div class="empty">Composez d'abord une équipe.</div>`}`);
  pmdWake();
};
ACTIONS.squp = d => {
  if(sqUpgrade(+d.id, +d.i)){ if(typeof Sfx !== "undefined") Sfx.win(); toast("Compétence renforcée", "warn", "bolt"); }
  ACTIONS.sqskills();
};

/* ============================================================
   2. LE COMBAT
   ============================================================ */
function sqFightHtml(){
  const B = SQB, Z = SQ_ZONES[B.z], q = sqState();
  return `<div class="sw-fight" style="--zc:${Z.c}">
    <div class="sw-arena" id="sqarena">
      <canvas id="sqcv"></canvas>
      <div class="sw-top"><span class="sw-tname">${B.lock ? `VERROU <i style="color:#ff3d7f">${esc(regionDef(B.lock.r).name)}</i>` : `${esc(Z.n)} · ${B.s === SQ_STAGES - 1 ? "BOSS" : B.s + 1} <i style="color:${SQ_DIFFS[B.d].c}">${SQ_DIFFS[B.d].n}</i>`}</span>
        <span class="sw-wdots" id="sqwave">${sqWaveDots()}</span>
        <button class="sw-pause" data-act="sqquit">❚❚</button></div>
      <div class="sw-bl">
        <button class="sw-auto ${q.auto ? "on" : ""}" data-act="sqauto">AUTO</button>
        <button class="sw-spd" data-act="sqspeed" id="sqspd">×${q.speed || 1}</button>
      </div>
      <div class="sw-br" id="sqskills"></div>
      <div class="sw-tip" id="sqtip"></div>
      <div class="sw-res" id="sqres"></div>
    </div>
    <div class="sw-say" id="sqsay">${B.lead ? `♛ ${esc(sqLeaderText(B.lead))}` : "Le combat commence."}</div>
  </div>`;
}
function sqWaveDots(){ return SQB.waves.map((_, i)=>`<i class="${i < SQB.wave ? "done" : i === SQB.wave ? "on" : ""}"></i>`).join(""); }
ACTIONS.sqauto = () => {
  const q = sqState(); q.auto = !q.auto; saveSoon();
  const b = document.querySelector(".sw-auto"); if(b) b.classList.toggle("on", q.auto);
  if(q.auto && SQV && SQV.wait){ const u = SQV.wait; SQV.wait = null; sqDrawSkills(); sqDoAct(u, sqAI(SQB, u)); }
  else sqDrawSkills();
};
ACTIONS.sqspeed = () => {
  const q = sqState(), o = [1, 2, 3];
  q.speed = o[(o.indexOf(q.speed || 1) + 1) % o.length] || 1; saveSoon();
  const b = document.getElementById("sqspd"); if(b) b.textContent = "×" + q.speed;
};
ACTIONS.sqquit = () => {
  sheet(`${sheetHead("Pause")}<div class="tiny muted">Quitter maintenant ne valide pas le palier.</div>
    <div class="btn-grid c2" style="margin-top:10px"><button class="btn pri" data-act="closesheet">Reprendre</button>
    <button class="btn dan" data-act="sqquit2">Abandonner</button></div>`, true);
};
ACTIONS.sqquit2 = () => { closeSheet(); const lk = SQB && SQB.lock; SQB = null; SQV = null; lk ? go("boss") : go("tower", "zone"); };

/* ---------- le déroulé : le moteur décide, l'écran raconte ---------- */
const sqSp = () => (sqState().speed || 1);
function sqLoop(){
  const B = SQB; if(!B || !SQV) return;
  if(B.over){ sqEnd(); return; }
  const u = sqNext(B);
  if(!u){ sqEnd(); return; }
  SQV.active = u;
  sqPlay(sqTurnStart(B, u), ()=>{
    if(SQB !== B) return;
    if(u.hp <= 0){ const ev = []; sqCheck(B, ev); sqPlay(ev, sqLoop); return; }
    if(u.stunned){ sqPlay(sqSkip(B, u), sqLoop); return; }
    if(u.side === "ally" && !sqState().auto){
      SQV.wait = u;
      const a = sqAI(B, u);
      SQV.pick = a.si; SQV.target = B.foes[a.ti] && B.foes[a.ti].hp > 0 ? B.foes[a.ti] : sqAlive(B.foes)[0];
      sqDrawSkills();
      sqSay(`<b>${esc(u.name)}</b> : touchez un adversaire pour attaquer.`);
      return;
    }
    const a = sqAI(B, u);
    setTimeout(()=>sqDoAct(u, a), 220 / sqSp());
  });
}
function sqDoAct(u, a){
  if(!SQB || !SQV) return;
  SQV.wait = null; SQV.target = null; sqDrawSkills();
  sqPlay(sqAct(SQB, u, a.si, a.ti), sqLoop);
}
function sqPlay(ev, done){
  let i = 0;
  const next = () => {
    if(!SQB || !SQV) return;
    if(i >= ev.length){ done && done(); return; }
    const d = sqShow(ev[i++], ev);
    setTimeout(next, d / sqSp());
  };
  next();
}
function sqSay(t){ const el = document.getElementById("sqsay"); if(el) el.innerHTML = t; }
/* chaque evenement du moteur devient une image ; la valeur rendue est sa duree */
function sqShow(e, all){
  const V = SQV, now = V.t;
  switch(e.k){
    case "skill": {
      const u = e.src, sk = e.sk, ult = e.si === 2;
      const tg = all.filter(x=>x.k === "hit").map(x=>x.tgt);
      u._v.pose = {anim:sk.kind === "atk" && [1, 2, 7, 9, 17, 16, 6].includes(sk.t) ? "attack" : "shoot", t0:now + (ult ? 520 : 0)};
      const melee = sk.kind === "atk" && u._v.pose.anim === "attack";
      if(melee && tg[0] && tg[0]._v.pos) u._v.lunge = {t0:now + (ult ? 520 : 0), to:tg[0]._v.pos};
      else if(sk.kind !== "team") for(const t of tg) V.orbs.push({from:u, to:t, c:sqCol(sk.t), t0:now + (ult ? 520 : 0) + 80, dur:240});
      if(ult){ V.ult = {u, t0:now, c:sqCol(sk.t), n:sk.n}; V.shake = 4; }
      V.banner = {txt:sk.n, c:sqCol(sk.t), t0:now, side:u.side, big:false};
      sqSay(`<b>${esc(u.name)}</b> utilise <b style="color:${sqCol(sk.t)}">${esc(sk.n)}</b>`);
      if(typeof arTone === "function") arTone(u.side === "ally" ? 440 : 300, .08, "triangle", .03, 660);
      return (ult ? 900 : 360) + (melee ? 60 : 0);
    }
    case "hit": {
      const t = e.tgt;
      t._v.hurt = now; t._v.flash = now;
      const c = e.crit ? "#ffd84a" : e.eff >= 2 ? "#ffc857" : e.eff < 1 ? "#9fb0c8" : "#ffffff";
      V.pops.push({u:t, txt:String(e.dmg), c, big:e.crit || e.eff >= 2, t0:now});
      if(e.crit) V.pops.push({u:t, txt:"CRITIQUE", c:"#ffd84a", t0:now, dy:-20, small:true});
      else if(e.eff >= 2) V.pops.push({u:t, txt:"SUPER EFFICACE", c:"#ffc857", t0:now, dy:-20, small:true});
      else if(e.eff < 1) V.pops.push({u:t, txt:"RÉSISTE", c:"#9fb0c8", t0:now, dy:-20, small:true});
      V.shake = Math.max(V.shake, e.crit ? 9 : 3 + Math.min(6, e.dmg / t.maxHp * 18));
      V.rings.push({u:t, c:V.ult ? V.ult.c : "#ffffff", t0:now});
      sqBurst(t, V.ult ? V.ult.c : "#ffffff", e.crit ? 20 : 11);
      if(typeof arTone === "function") arTone(e.crit ? 110 : 170, .12, "sawtooth", .05, 60);
      return 260;
    }
    case "heal": e.tgt._v.glow = {c:"#5ce07a", t0:now}; V.pops.push({u:e.tgt, txt:"+" + e.v, c:"#5ce07a", t0:now}); sqBurst(e.tgt, "#5ce07a", 8, true); return 140;
    case "fx": {
      const lab = {brn:"BRÛLURE", psn:"POISON", stun:"ÉTOURDI", slow:"RALENTI", defdn:"DÉF ↓", atkdn:"ATQ ↓", atkup:"ATQ ↑", defup:"DÉF ↑",
                   spdup:"VIT ↑", shield:"BOUCLIER", cleanse:"PURGÉ", immune:"IMMUNISÉ"}[e.b] || e.b;
      const good = ["atkup", "defup", "spdup", "shield", "cleanse", "immune"].includes(e.b);
      V.pops.push({u:e.tgt, txt:lab, c:good ? "#35f0d6" : "#ff86ad", t0:now, dy:-30, small:true});
      e.tgt._v.glow = {c:good ? "#35f0d6" : "#ff3d7f", t0:now};
      return 140;
    }
    case "phase": {
      const g = e.tgt;
      V.banner = {txt:"RECONFIGURATION", c:"#ff3d7f", t0:now, big:true}; V.shake = 12;
      g._v.glow = {c:"#ff3d7f", t0:now}; sqBurst(g, "#ff3d7f", 30, true);
      for(const a of e.adds) a._v = {enter:now + 300};
      sqSay(`<b>${esc(g.name)}</b> se reconfigure : sa signature change${e.adds.length ? ", deux renforts surgissent" : ""}.`);
      if(typeof arTone === "function") arTone(90, .5, "sawtooth", .06, 40);
      return 1500;
    }
    case "atb": V.pops.push({u:e.tgt, txt:(e.v > 0 ? "JAUGE +" : "JAUGE −") + Math.abs(e.v) + "%", c:"#9fd8f8", t0:now, dy:-30, small:true}); return 130;
    case "dot": e.tgt._v.flash = now; V.pops.push({u:e.tgt, txt:String(e.dmg), c:e.b === "brn" ? "#ff8a3d" : "#b86bff", t0:now}); return 300;
    case "stun": V.pops.push({u:e.tgt, txt:"ÉTOURDI", c:"#ffe45e", t0:now, dy:-30, small:true}); sqSay(`${esc(e.tgt.name)} est étourdi.`); return 450;
    case "ko": e.tgt._v.ko = now; sqBurst(e.tgt, e.tgt.side === "ally" ? "#35f0d6" : "#ff86ad", 18, true); if(typeof arTone === "function") arTone(300, .3, "square", .04, 60); return 420;
    case "wave": {
      for(const u of SQB.foes) u._v = {enter:now};
      const last = e.n === SQB.waves.length - 1, boss = SQB.foes.some(f=>f.boss), gd = SQB.foes.some(f=>f.guardian);
      V.banner = {txt:gd ? "VERROU" : boss ? "BOSS" : "VAGUE " + (e.n + 1), c:boss ? "#ff3d7f" : "#ffffff", t0:now, big:true};
      if(gd){ V.shake = 10; sqSay(`<b style="color:#ff3d7f">${esc(SQB.foes[0].name)}</b> maintient le verrou.`); }
      const w = document.getElementById("sqwave"); if(w) w.innerHTML = sqWaveDots();
      return last && boss ? 1400 : 1100;
    }
    case "end": V.banner = {txt:e.win ? "VICTOIRE" : "DÉFAITE", c:e.win ? "#ffd84a" : "#ff3d7f", t0:now, big:true};
      if(typeof Sfx !== "undefined") e.win ? Sfx.win() : Sfx.lose();
      return 1300;
  }
  return 100;
}
function sqBurst(u, c, n, up){
  const p = u._v && u._v.pos; if(!p) return;
  for(let i = 0; i < n; i++){
    const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.4 : Math.random() * 6.3, v = 0.05 + Math.random() * 0.12;
    SQV.parts.push({x:p.x, y:p.y - p.s * 0.35, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:0, max:300 + Math.random() * 300, c, s:2 + Math.random() * 3});
  }
}

/* ---------- les boutons ronds de compétence ---------- */
function sqDrawSkills(){
  const host = document.getElementById("sqskills"); if(!host || !SQB) return;
  const u = SQV && SQV.wait;
  if(!u){ host.innerHTML = ""; return; }
  host.innerHTML = u.skills.map((s, i)=>{
    const cd = u.cds[i];
    return `<button class="sw-skb ${SQV.pick === i ? "on" : ""} ${cd ? "cd" : ""}" data-i="${i}" style="--sc:${sqCol(s.t)}" ${cd ? "disabled" : ""}>
      <span class="sw-skic">${ic(SQ_KIND_IC[s.kind])}</span>${cd ? `<span class="sw-cd">${cd}</span>` : ""}
      <small>${esc(s.n)}</small></button>`;
  }).join("");
  /* toucher : choisir ; garder le doigt : lire la description */
  host.querySelectorAll(".sw-skb").forEach(b=>{
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
  /* une competence d'equipe ou de zone se lance au second toucher */
  if(SQV.pick === i && s.kind !== "atk"){ sqDoAct(u, {si:i, ti:0}); return; }
  SQV.pick = i; sqDrawSkills();
  sqSay(s.kind === "atk" ? `<b>${esc(s.n)}</b> : touchez la cible.` : `<b>${esc(s.n)}</b> : touchez à nouveau pour lancer.`);
}
function sqTap(x, y){
  if(!SQV || !SQV.wait || !SQB) return;
  const u = SQV.wait, sk = u.skills[SQV.pick];
  if(sk.kind !== "atk"){ sqDoAct(u, {si:SQV.pick, ti:0}); return; }
  let best = -1, bd = 70;
  SQB.foes.forEach((f, i)=>{ if(f.hp <= 0 || !f._v.pos) return; const p = f._v.pos, d = Math.hypot(p.x - x, p.y - p.s * 0.35 - y); if(d < bd){ bd = d; best = i; } });
  if(best >= 0) sqDoAct(u, {si:SQV.pick, ti:best});
}

/* ============================================================
   3. LE DESSIN — vue de trois quarts
   ============================================================ */
/* l'equipe en bas a gauche, tournee vers le haut-droite ; les monstres en haut a droite */
const SQ_POS_A = [[0.42, 0.62], [0.21, 0.58], [0.36, 0.82], [0.14, 0.79]];
const SQ_POS_F = [[0.60, 0.38], [0.82, 0.39], [0.66, 0.20], [0.87, 0.22]];
function sqFightAfter(){
  const cv = document.getElementById("sqcv"); if(!cv) return;
  const host = cv.parentElement, W = Math.max(300, host.clientWidth);
  const H = Math.round(Math.min(620, Math.max(420, window.innerHeight * 0.66)));
  const d = Math.min(3, window.devicePixelRatio || 1);
  cv.width = W * d; cv.height = H * d; cv.style.height = H + "px"; host.style.height = H + "px";
  SQV.cv = cv; SQV.W = W; SQV.H = H; SQV.d = d;
  SQV.bg = sqPaintArena(W, H, d);
  cv.addEventListener("pointerdown", e=>{ const r = cv.getBoundingClientRect(); sqTap(e.clientX - r.left, e.clientY - r.top); });
  sqDrawSkills();
  if(!SQV.raf) SQV.raf = requestAnimationFrame(sqFrame);
}
/* le terrain de la zone, peint une fois : sol en carreaux, bordures, une aire de combat usee */
function sqPaintArena(W, H, d){
  const Z = SQ_ZONES[SQB.z], B = (typeof XBIOME !== "undefined" && XBIOME[SQB.lock ? "faille" : Z.biome]) || {g:["#4f9a3c", "#4a9238", "#57a243"], b:"#2f6e24", e:"#3b7f2e", f:["#f8e060"], deco:"tree"};
  const lw = Math.round(W / 2), lh = Math.round(H / 2);
  const c = document.createElement("canvas"); c.width = lw; c.height = lh;
  const x = c.getContext("2d"), R = mulberry32(SQB.z * 131 + 7);
  const px = (col, X0, Y0, w, h) => { x.fillStyle = col; x.fillRect(X0, Y0, w || 1, h || 1); };
  for(let yy = 0; yy < lh; yy += 8) for(let xx = 0; xx < lw; xx += 8) px(B.g[Math.floor(R() * B.g.length)], xx, yy, 8, 8);
  for(let i = 0; i < lw * lh / 50; i++){ const X0 = Math.floor(R() * lw), Y0 = Math.floor(R() * lh); px(B.b, X0, Y0); px(B.b, X0 + 1, Y0 - 1); px(B.b, X0 + 2, Y0); }
  /* l'aire de combat : une diagonale usee entre les deux camps */
  x.save(); x.translate(lw * 0.5, lh * 0.5); x.rotate(-0.55);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, lw * 0.62);
  g.addColorStop(0, "rgba(255,240,200,.16)"); g.addColorStop(0.7, "rgba(255,240,200,.05)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.scale(1.5, 0.75); x.fillStyle = g; x.beginPath(); x.arc(0, 0, lw * 0.62, 0, 7); x.fill(); x.restore();
  /* le decor sur les bords : la ou personne ne se bat */
  const deco = (X0, Y0, big) => {
    const s = big ? 1.4 : 1;
    if(B.deco === "tree" || B.deco === "pine"){ px("#5a3a22", X0 - 1, Y0 + 4 * s, 3, 5); for(let k = 0; k < 7 * s; k++) px(k % 2 ? "#2f6a2a" : "#3f8a36", X0 - k, Y0 - 7 * s + k * 1.5, 2 * k + 1, 2); }
    else if(B.deco === "palm"){ px("#9a6a3a", X0, Y0 - 2, 2, 9); px("#3f9a4a", X0 - 5, Y0 - 5, 12, 2); px("#3f9a4a", X0 - 3, Y0 - 7, 8, 2); }
    else if(B.deco === "glitch"){ px(R() < 0.5 ? "#ff3d7f" : "#35f0d6", X0 - 4, Y0, 9, 1); px("#0a0614", X0 - 3, Y0 + 1, 7, 4); }
    else { px("#3e2e22", X0 - 5, Y0 - 3, 11, 6); px("#6b5038", X0 - 4, Y0 - 4, 8, 2); if(B.deco === "lava") px("#ff6a2a", X0 - 7, Y0 + 4, 5, 1); }
  };
  for(let i = 0; i < 26; i++){
    const corner = R(), X0 = corner < 0.5 ? (R() < 0.5 ? 6 + R() * lw * 0.22 : lw * 0.78 + R() * lw * 0.2) : R() * lw;
    const Y0 = corner < 0.5 ? R() * lh : (R() < 0.5 ? 6 + R() * lh * 0.1 : lh * 0.92 + R() * lh * 0.06);
    /* on laisse libres les deux camps */
    const ax = X0 / lw, ay = Y0 / lh;
    if(Math.hypot(ax - 0.28, ay - 0.7) < 0.28 || Math.hypot(ax - 0.74, ay - 0.3) < 0.28) continue;
    deco(X0, Y0, R() < 0.3);
  }
  const v = x.createRadialGradient(lw / 2, lh / 2, lh * 0.3, lw / 2, lh / 2, lh * 0.8);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.45)"); x.fillStyle = v; x.fillRect(0, 0, lw, lh);
  return c;
}
function sqUnitPos(u, i){
  const W = SQV.W, H = SQV.H;
  let p;
  if(u.side === "ally") p = SQ_POS_A[i] || SQ_POS_A[0];
  else if(u.boss) p = [0.73, 0.28];
  else if(SQB.foes.some(f=>f.boss)) p = i === 0 ? [0.52, 0.38] : i === 2 ? [0.91, 0.42] : [0.62, 0.15];
  else p = SQ_POS_F[i] || SQ_POS_F[0];
  /* la profondeur : ce qui est plus bas est plus proche, donc plus grand */
  const s = (u.guardian ? 132 : u.boss ? 110 : 70) * (0.74 + p[1] * 0.5);
  return {x:p[0] * W, y:p[1] * H, s};
}
function sqFrame(now){
  if(!SQV || !SQV.cv || !SQV.cv.isConnected){ if(SQV) SQV.raf = 0; return; }
  SQV.raf = requestAnimationFrame(sqFrame);
  const real = Math.min(100, now - (SQV.last || now)); SQV.last = now;
  const dt = real * sqSp(); SQV.t += dt;
  const x = SQV.cv.getContext("2d"), W = SQV.W, H = SQV.H, t = SQV.t;
  x.setTransform(SQV.d, 0, 0, SQV.d, 0, 0);
  x.imageSmoothingEnabled = false;
  SQV.shake *= Math.pow(0.86, real / 16);
  x.save(); x.translate((Math.random() - 0.5) * SQV.shake, (Math.random() - 0.5) * SQV.shake);
  x.drawImage(SQV.bg, -6, -6, W + 12, H + 12);
  const units = [...SQB.allies.map((u, i)=>[u, i]), ...SQB.foes.map((u, i)=>[u, i])];
  units.forEach(([u, i])=>{ u._v = u._v || {}; u._v.pos = sqUnitPos(u, i); });
  units.sort((a, b)=>a[0]._v.pos.y - b[0]._v.pos.y);
  /* l'ultime : l'arene s'assombrit, le lanceur reste dans la lumiere */
  const U = SQV.ult && t - SQV.ult.t0 < 900 ? SQV.ult : null;
  for(const [u] of units) if(!U || u !== U.u) sqDrawUnit(x, u, t);
  if(U){
    const k = (t - U.t0) / 900, a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
    x.fillStyle = `rgba(2,4,10,${0.62 * a})`; x.fillRect(-10, -10, W + 20, H + 20);
    const p = U.u._v.pos;
    const g = x.createRadialGradient(p.x, p.y - p.s * 0.4, 0, p.x, p.y - p.s * 0.4, p.s * 1.4);
    g.addColorStop(0, sqRgba(U.c, 0.55 * a)); g.addColorStop(1, sqRgba(U.c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y - p.s * 0.4, p.s * 1.4, 0, 7); x.fill();
    sqDrawUnit(x, U.u, t);
  }
  /* projectiles, ondes de choc, particules */
  x.globalCompositeOperation = "lighter";
  for(let i = SQV.orbs.length - 1; i >= 0; i--){
    const o = SQV.orbs[i], k = (t - o.t0) / o.dur;
    if(k < 0) continue; if(k >= 1){ SQV.orbs.splice(i, 1); continue; }
    const a = o.from._v.pos, b = o.to._v.pos; if(!a || !b) continue;
    const ox = a.x + (b.x - a.x) * k, oy = a.y - a.s * 0.4 + (b.y - b.s * 0.4 - (a.y - a.s * 0.4)) * k - Math.sin(k * Math.PI) * 26;
    const g = x.createRadialGradient(ox, oy, 0, ox, oy, 11); g.addColorStop(0, "#fff"); g.addColorStop(0.4, o.c); g.addColorStop(1, sqRgba(o.c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(ox, oy, 11, 0, 7); x.fill();
    SQV.parts.push({x:ox, y:oy, vx:0, vy:0, life:0, max:160, c:o.c, s:3});
  }
  for(let i = SQV.rings.length - 1; i >= 0; i--){
    const r = SQV.rings[i], k = (t - r.t0) / 320;
    if(k >= 1){ SQV.rings.splice(i, 1); continue; }
    const p = r.u._v.pos; if(!p) continue;
    x.globalAlpha = 1 - k; x.strokeStyle = r.c; x.lineWidth = 3 * (1 - k) + 1;
    x.beginPath(); x.ellipse(p.x, p.y - p.s * 0.35, p.s * 0.6 * k + 6, p.s * 0.6 * k + 6, 0, 0, 7); x.stroke();
  }
  x.globalAlpha = 1;
  for(let i = SQV.parts.length - 1; i >= 0; i--){
    const p = SQV.parts[i]; p.life += dt;
    if(p.life > p.max){ SQV.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.0002 * dt;
    x.globalAlpha = 1 - p.life / p.max; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.s, p.s);
  }
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  /* la fleche rouge sur la cible */
  const tg = SQV.wait && SQV.target && SQV.target.hp > 0 && SQV.wait.skills[SQV.pick].kind === "atk" ? SQV.target : null;
  if(tg && tg._v.pos){
    const p = tg._v.pos, yy = p.y - p.s * 1.08 - 16 + Math.sin(t / 140) * 4;
    x.fillStyle = "#ff3d4f"; x.strokeStyle = "#3a0008"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(p.x - 9, yy - 8); x.lineTo(p.x + 9, yy - 8); x.lineTo(p.x, yy + 4); x.closePath(); x.fill(); x.stroke();
  }
  x.restore();
  /* chiffres et etiquettes */
  x.textAlign = "center"; x.textBaseline = "middle";
  for(let i = SQV.pops.length - 1; i >= 0; i--){
    const p = SQV.pops[i], k = (t - p.t0) / 900;
    if(k >= 1 || !p.u._v.pos){ SQV.pops.splice(i, 1); continue; }
    const pos = p.u._v.pos, sc = k < 0.12 ? 0.6 + k / 0.12 * 0.6 : 1.2 - Math.min(0.2, (k - 0.12));
    x.font = `${Math.round((p.small ? 7 : p.big ? 17 : 12) * sc)}px "Press Start 2P",monospace`;
    x.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    const y = pos.y - pos.s * 0.95 + (p.dy || 0) - k * 26;
    x.lineWidth = 4; x.strokeStyle = "#000"; x.strokeText(p.txt, pos.x, y); x.fillStyle = p.c; x.fillText(p.txt, pos.x, y);
  }
  x.globalAlpha = 1;
  const Bn = SQV.banner;
  if(Bn){
    const k = (t - Bn.t0) / (Bn.big ? 1100 : 750);
    if(k >= 1) SQV.banner = null;
    else {
      x.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
      if(Bn.big){
        const gy = H * 0.46;
        const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.2, "rgba(0,0,0,.7)"); g.addColorStop(0.8, "rgba(0,0,0,.7)"); g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g; x.fillRect(0, gy - 30, W, 60);
        x.font = '22px "Press Start 2P",monospace'; x.lineWidth = 5; x.strokeStyle = "#000"; x.strokeText(Bn.txt, W / 2, gy + 1); x.fillStyle = Bn.c; x.fillText(Bn.txt, W / 2, gy + 1);
      } else {
        x.font = '9px "Press Start 2P",monospace';
        const w = x.measureText(Bn.txt).width + 22, cx = W / 2, cy = 50;
        x.fillStyle = "rgba(5,9,18,.88)"; x.fillRect(cx - w / 2, cy - 12, w, 24); x.strokeStyle = Bn.c; x.lineWidth = 1.5; x.strokeRect(cx - w / 2 + .5, cy - 11.5, w - 1, 23);
        x.fillStyle = "#fff"; x.fillText(Bn.txt, cx, cy + 1);
      }
      x.globalAlpha = 1;
    }
  }
}
function sqDrawUnit(x, u, t){
  const v = u._v, p = v.pos, size = p.s;
  let a = 1;
  if(v.ko){ a = Math.max(0, 1 - (t - v.ko) / 520); if(a <= 0) return; }
  if(v.enter !== undefined && t - v.enter < 450) a *= Math.max(0, (t - v.enter) / 450);
  const dir = u.side === "ally" ? 3 : 7;
  let cx = p.x, cy = p.y;
  if(v.lunge && t >= v.lunge.t0 && t - v.lunge.t0 < 380){
    const q = Math.sin((t - v.lunge.t0) / 380 * Math.PI) * 0.55;
    cx += (v.lunge.to.x - p.x) * q; cy += (v.lunge.to.y - p.y) * q;
  }
  if(v.hurt && t - v.hurt < 220){ const k = 1 - (t - v.hurt) / 220; cx += (u.side === "ally" ? -1 : 1) * 7 * k; cy += (u.side === "ally" ? 1 : -1) * 4 * k; }
  if(v.ko){ cy -= (t - v.ko) / 520 * 18; }
  /* l'ombre ; l'anneau du Pokemon qui joue */
  x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(cx, cy + 4, size * 0.34, size * 0.12, 0, 0, 7); x.fill();
  if(SQV.active === u && !SQB.over && u.hp > 0){
    x.strokeStyle = u.side === "ally" ? "#5cf0ff" : "#ff5c7a"; x.lineWidth = 2.5;
    x.beginPath(); x.ellipse(cx, cy + 4, size * 0.42 + Math.sin(t / 130) * 2, size * 0.15, 0, 0, 7); x.stroke();
  }
  if(v.glow && t - v.glow.t0 < 500){ const k = (t - v.glow.t0) / 500, gr = x.createRadialGradient(cx, cy - size * 0.35, 0, cx, cy - size * 0.35, size * 0.6);
    gr.addColorStop(0, sqRgba(v.glow.c, 0.5 * (1 - k))); gr.addColorStop(1, sqRgba(v.glow.c, 0)); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy - size * 0.35, size * 0.6, 0, 7); x.fill(); }
  const white = v.flash && t - v.flash < 90;
  x.globalAlpha = a;
  let ok = false;
  if(v.pose && t >= v.pose.t0 && t - v.pose.t0 < 460 && typeof brAnimDraw === "function") ok = brAnimDraw(x, u.id, v.pose.anim, white ? "w" : "n", dir, (t - v.pose.t0) / 1000, cx, cy, size);
  if(!ok && v.hurt && t - v.hurt < 260 && typeof brAnimDraw === "function") ok = brAnimDraw(x, u.id, "hurt", white ? "w" : "n", dir, (t - v.hurt) / 2000, cx, cy, size);
  if(!ok && typeof brPmdDraw === "function") ok = brPmdDraw(x, u.id, white ? "w" : "n", dir, (t / 1000) * 0.5, cx, cy, size);
  if(!ok && typeof brSprite === "function"){ const s = brSprite(u.id, "n"); if(s) x.drawImage(s, cx - size / 2, cy - size * 0.8, size, size); }
  x.globalAlpha = 1;
  if(u.hp <= 0) return;
  /* la fiche, a la Summoners War : type, PV, jauge, effets avec leur duree */
  const bw = u.boss ? 74 : 50, bx = cx - bw / 2 + 6, by = p.y - size * 0.98 - 6;
  x.fillStyle = sqCol(u.types[0]); x.beginPath(); x.arc(bx - 7, by + 3, 5, 0, 7); x.fill();
  x.strokeStyle = "#000"; x.lineWidth = 1.5; x.stroke();
  x.fillStyle = "rgba(0,0,0,.8)"; x.fillRect(bx - 1, by - 1, bw + 2, 9);
  const r = u.hp / u.maxHp;
  x.fillStyle = u.side === "ally" ? (r > 0.3 ? "#5ce07a" : "#ff3d7f") : (r > 0.3 ? "#ff6a5a" : "#ff3d7f");
  x.fillRect(bx, by, bw * r, 4);
  if(u.shield > 0){ x.fillStyle = "#e0e8ff"; x.fillRect(bx, by, Math.min(bw, bw * u.shield / u.maxHp), 1.5); }
  x.fillStyle = "#5cc8ff"; x.fillRect(bx, by + 5, bw * Math.min(1, u.gauge / 100), 2);
  if(u.boss){ x.font = '6px "Press Start 2P",monospace'; x.fillStyle = "#ff86ad"; x.textAlign = "center"; x.fillText(u.guardian ? (u.phased ? "VERROU · RECONFIGURÉ" : "VERROU") : "BOSS", cx, by - 14); }
  u.fx.slice(0, 5).forEach((e, k)=>{
    const ex = bx + k * 10, ey = by - 10;
    x.fillStyle = {brn:"#ff8a3d", psn:"#b86bff", stun:"#ffe45e", slow:"#9fd8f8", defdn:"#ff3d7f", atkdn:"#ff3d7f", atkup:"#35f0d6", defup:"#35f0d6", spdup:"#35f0d6", shield:"#c8d8ff"}[e.k] || "#fff";
    x.fillRect(ex, ey, 8, 8); x.strokeStyle = "#000"; x.lineWidth = 1; x.strokeRect(ex + .5, ey + .5, 7, 7);
    x.font = '5px "Press Start 2P",monospace'; x.fillStyle = "#000"; x.textAlign = "center"; x.fillText(String(e.t), ex + 4, ey + 4.5);
  });
  x.font = '6px "Press Start 2P",monospace'; x.textAlign = "left"; x.fillStyle = "#e8f0ff";
  x.fillText(String(u.level), bx + bw + 3, by + 3);
}
function sqRgb(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function sqRgba(h, a){ const c = sqRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

/* ============================================================
   4. LES RÉSULTATS — étoiles, expérience, récompenses
   ============================================================ */
function sqEnd(){
  const B = SQB; if(!B || B._ended) return;
  B._ended = true;
  const R = sqFinish(B), Z = SQ_ZONES[B.z];
  if(typeof checkAchievements === "function") checkAchievements();
  const last = B.s === SQ_STAGES - 1;
  const nextOk = B.result && !last && !B.lock;
  setTimeout(()=>{
    if(SQB !== B) return;
    const el = document.getElementById("sqres"); if(!el) return;
    el.innerHTML = `
      <div class="sw-rtitle ${B.result ? "" : "bad"}">${B.result ? "VICTOIRE" : "DÉFAITE"}</div>
      ${B.result ? `<div class="sq-stars">${[0, 1, 2].map(k=>`<i class="${k < R.stars ? "on" : ""}" style="--d:${250 + k * 220}ms">★</i>`).join("")}</div>` : ""}
      <div class="sw-xp">${R.xps.map((g, i)=>`<div class="sw-xpm" style="--d:${700 + i * 120}ms">
        ${sprite(g.id, S.dex[g.id] && S.dex[g.id].shiny, "")}
        ${g.to > g.from ? `<span class="sw-lvup">N.${g.to}</span>` : `<span class="sw-lvn">N.${g.to}</span>`}
        <div class="sw-xpbar"><i style="--w:${Math.round(g.frac * 100)}%"></i></div><small>+${g.xp} exp</small></div>`).join("")}</div>
      ${B.result ? `<div class="sw-rw">
          <span>${ic("coin")} +${fmt(R.rw.coins)}</span><span>${ic("shard")} +${R.rw.shards}</span>
          <span class="${R.rw.scrolls ? "vi" : "dim"}">${itemIcon("exp:i_ct", 18) || ""} +${R.rw.scrolls} parchemin${R.rw.scrolls > 1 ? "s" : ""}</span></div>
        ${R.lock && R.first ? `<div class="sw-gw">${pmdCanvas(R.lock.g.id, 0, 64)}<div><b>VERROU LEVÉ</b>
            <div class="tiny">${esc(R.lock.g.name)} — ${esc(R.lock.g.title)} — rejoint votre archive. Carte légendaire émise.</div></div></div>
          ${R.lock.g.bye ? `<div class="sw-bye">« ${esc(R.lock.g.bye)} »</div>` : ""}` : ""}
        ${R.rw.fw ? `<div class="tiny gold-t">Première victoire du jour : PokéCoins et Fragments ×${R.rw.fw}, un parchemin en plus.</div>` : ""}
        <div class="tiny ${R.first ? "cy" : "dim"}">${R.first ? "Première victoire : récompenses complètes." : R.lock ? "Verrou déjà levé : récompenses réduites." : "Palier déjà franchi : récompenses réduites."}</div>`
      : B.lock ? `<div class="tiny" style="line-height:1.6">Le verrou tient. Types : <b>${POKE[R.lock.g.id].types.map(t=>TYPE_NAMES[t]).join(", ")}</b>.
          Le tableau des types pèse plus lourd que dix niveaux : composez une équipe qui le prend à revers, et gardez un soin pour sa reconfiguration.</div>`
      : `<div class="tiny" style="line-height:1.6">Types du secteur : <b>${Z.types.map(t=>TYPE_NAMES[t]).join(", ")}</b>. Un meneur adapté, des compétences montées, ou quelques niveaux de plus font la différence.</div>`}
      <div class="sw-rbtn">
        <button class="btn" data-act="sqagain">${B.result ? "Rejouer" : "Réessayer"}</button>
        <button class="btn" data-act="sqprepagain">Préparation</button>
        ${nextOk ? `<button class="btn pri" data-act="sqnext">Suivant</button>` : `<button class="btn pri" data-act="sqzoneend">${B.lock ? "Verrous" : last && B.result ? "Aile" : "Retour"}</button>`}
      </div>`;
    el.classList.add("on");
    pmdWake();
  }, 1300 / sqSp());
}
function sqRestart(z, s, d){
  const q = sqState(), lk = SQB && SQB.lock;
  if(lk){ sqLockPrep(lk.r, lk.i); return; }
  SQ_ZSEL = z; SQ_DSEL = d;
  SQ_PREP = {z, s, d, team:sqDefaultTeam(), waves:sqWaves(z, s, null, d), sort:"lvl"};
}
ACTIONS.sqagain = () => { const B = SQB; if(!B) return; sqRestart(B.z, B.s, B.d); ACTIONS.sqfight(); };
ACTIONS.sqprepagain = () => { const B = SQB; if(!B) return; sqRestart(B.z, B.s, B.d); SQB = null; SQV = null; go("tower", "prep"); };
ACTIONS.sqnext = () => { const B = SQB; if(!B) return; sqRestart(B.z, B.s + 1, B.d); SQB = null; SQV = null; go("tower", "prep"); if(typeof checkStoryTriggers === "function") checkStoryTriggers(); };
ACTIONS.sqzoneend = () => {
  const lk = SQB && SQB.lock; SQB = null; SQV = null;
  if(lk) go("boss"); else go("tower", "zone");
  /* une scene peut attendre la fin du combat : le premier boss d'aile, le premier verrou */
  if(typeof checkStoryTriggers === "function") checkStoryTriggers();
  if(typeof guideTick === "function") guideTick();
};

/* ============================================================
   5. LES VERROUS LÉGENDAIRES — l'écran
   ============================================================ */
function sqLockName(L){ const r = regionDef(L.r), g = r.guardians[L.i]; return guardianBeaten(r.key, g.id) ? g.name : "Signature détectée"; }
function sqLockReady(){
  return REGIONS.some(r => r.guardians.some((g, i) => !guardianBeaten(r.key, g.id) && sqLockOpen(r, i)));
}
function sqLockPrep(rk, i){
  const r = regionDef(rk), G = sqLockGate(r, i), q = sqState();
  SQ_PREP = {z:G.z, s:SQ_STAGES - 1, d:G.d, lock:{r:rk, i, id:r.guardians[i].id},
             team:sqDefaultTeam(), waves:sqLockWaves(r, i), sort:"lvl"};
}
ACTIONS.sqlockgo = d => {
  const r = regionDef(d.r), i = +d.i;
  if(!r || !sqLockOpen(r, i)) return;
  sqLockPrep(d.r, i); SQ_ZSEL = SQ_PREP.z; SQ_DSEL = SQ_PREP.d;
  go("tower", "prep");
};
function sqLocksHtml(){
  return `
    <div class="sw-zban" style="--zc:#ff3d7f">
      <button class="sw-back" data-act="sqworld">${ic("arrow")}</button>
      <div class="grow"><small>LA TOUR · SOMMETS</small><b>Verrous légendaires</b>
        <span class="tiny muted" style="display:block;margin-top:3px">${sqLockCount()} / 9 levés ${infoBtn("boss")}</span></div>
      <span class="sw-zboss sw-lockbig">${ic("lock")}</span>
    </div>
    <div class="sub" style="margin:8px 0 10px">Des légendaires promus pare-feu. Chacun tient une passerelle et se dresse au sommet d'une aile de la Tour.
      Ils ne se capturent pas : vaincus, ils cèdent, et rejoignent l'archive.</div>
    ${REGIONS.map(r=>{
      const open = regionUnlocked(r.key), D = SQ_DIFFS[Math.min(SQ_DIFFS.length - 1, r.act - 1)];
      return `<div class="sw-lockreg ${open ? "" : "locked"}">
        <div class="row between"><b>${esc(r.name.toUpperCase())}</b>
          <span class="tiny" style="color:${D.c}">${D.n} · ${open ? dexCount(r.key) + " espèces" : "secteur fermé"}</span></div>
        ${r.guardians.map((g, i)=>{
          const beaten = guardianBeaten(r.key, g.id), av = sqLockOpen(r, i), G = sqLockGate(r, i);
          const conds = [
            [sqLockGateOk(r, i), `Boss de l'aile ${G.z + 1} (${esc(SQ_ZONES[G.z].n)}) en ${D.n}`],
            [dexCount(r.key) >= g.need, `${Math.min(dexCount(r.key), g.need)} / ${g.need} espèces de ${esc(r.name)}`],
          ];
          if(i > 0) conds.push([guardianBeaten(r.key, r.guardians[i - 1].id), "Verrou précédent levé"]);
          return `<div class="sw-lock ${beaten ? "done" : av ? "ready" : ""}">
            <span class="sw-lockmon">${!open ? `<span class="guardunknown">?</span>` : beaten ? pmdCanvas(g.id, 0, 56) : `<span class="guardsil">${sprite(g.id, false, "")}</span>`}</span>
            <div class="grow">
              <b>${beaten ? esc(g.name) : av ? "Signature détectée" : "Signature non détectée"}${g.core ? ` <i class="sw-core">NOYAU</i>` : ""}</b>
              <small>${beaten ? esc(g.title) : "Identité inconnue"} · niveau ${sqLockLevel(r, i)}</small>
              ${beaten && g.bye ? `<small class="sw-byesm">« ${esc(g.bye)} »</small>` : ""}
              ${beaten ? `<small class="ok">Verrou levé ${"★".repeat((sqState().lk || {})[guardianKey(r.key, g.id)] || 0)}</small>`
                : open ? conds.map(([ok, t])=>`<small class="${ok ? "ok" : "dim"}">${ok ? "✓" : "·"} ${t}</small>`).join("") : ""}
            </div>
            <button class="btn sm ${av && !beaten ? "dan" : ""}" data-act="sqlockgo" data-r="${r.key}" data-i="${i}" ${av ? "" : "disabled"}>${beaten ? "Rejouer" : "Affronter"}</button>
          </div>`; }).join("")}
      </div>`; }).join("")}`;
}
/* l'ancien ecran des Data Guardians mene ici : un seul endroit pour les verrous */
SCREENS.boss = {
  html(){ return sqLocksHtml(); },
  after(){ pmdWake(); if(typeof tutoMaybe === "function") tutoMaybe("boss"); }
};
