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
    if(arg === "skills" && SQ_SKV) return sqSkillsHtml();
    if(arg === "zone") return sqZoneHtml();
    return sqWorldHtml();
  },
  after(host, arg){
    pmdWake();
    if(arg === "fight" && SQB) sqFightAfter();
    else if(typeof tutoMaybe === "function") tutoMaybe(arg === "prep" ? "towerprep" : !arg ? "tower" : "");
    if(arg === "prep" && SQ_PREP && typeof ppMount === "function"){
      const P = SQ_PREP;
      ppMount(document.getElementById("pp-host"), {max:SQ_TEAM, sel:P.team, leader:true, keep:true,
        leadLabel:"le meneur donne son passif à toute l'équipe",
        onChange:sel=>{
          P.team = sel;
          const L = sel[0] ? sqLeaderOf(sel[0]) : null, el = document.getElementById("sw-leader");
          if(el){ el.className = "sw-leader " + (L ? "" : "none"); el.textContent = "♛ " + (sel[0] ? sqLeaderText(L) : "Le premier emplacement est celui du meneur."); }
          const f = document.getElementById("sw-fight"); if(f) f.disabled = !sel.length;
          const it = document.getElementById("sq-intel"); if(it) it.outerHTML = sqPrepIntel(P);
          /* la Couche Zéro : les échos de la première vague suivent l'équipe choisie */
          if(P.final && typeof finalWavesHtml === "function"){ const w = document.querySelector(".fn-prep .sw-waves"); if(w) w.outerHTML = finalWavesHtml(P); }
        }});
    }
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
    ${sqContinueCard()}
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
        return `<span class="sw-tb-m ${i === 0 ? "lead" : ""}">${id ? sprite(id, S.dex[id].shiny, "", {skin:true}) : ""}${i === 0 ? `<i class="sw-crown">♛</i>` : ""}</span>`; }).join("")}</div>
      <div class="grow tiny">${team.length ? `<b>Meneur :</b> ${esc(sqLeaderText(sqLeaderOf(team[0])))}` : "Archivez des Pokémon pour composer une équipe."}</div>
      <button class="btn xs ${sqCanUpgradeSomething(team) ? "gold" : ""}" data-act="sqskills" ${team.length ? "" : "disabled"}>${ic("bolt")} Compétences${sqCanUpgradeSomething(team) ? `<i class="badge"></i>` : ""}</button>
    </div>
    <button class="sw-lockbar" data-act="goto" data-to="boss">
      <span class="sw-lockic">${ic("lock")}</span>
      <span class="grow"><b>VERROUS LÉGENDAIRES</b><small>${sqLockCount()} / 9 levés · ailes 2, 4 et 6</small></span>
      ${sqLockReady() ? `<i class="badge"></i>` : ""}${ic("arrow")}</button>
    ${T.points ? `<button class="btn sm ghost wide" style="margin-top:8px" data-act="towerbuffs">${ic("star")} ${T.points} renfort(s) de lignée à attribuer</button>` : ""}
    <div class="tiny dim" style="margin-top:8px">Les ailes s'ouvrent l'une après l'autre en battant leur boss. Les difficultés Difficile et Enfer
      s'ouvrent aile par aile. Au sommet des ailes 2, 4 et 6 se tiennent les verrous : ceux de Kanto en Normal, de Johto en Difficile, de Hoenn en Enfer.</div>`;
}
/* la prochaine marche : le premier palier ouvert et jamais franchi */
function sqNextStage(){
  for(let d = 0; d < SQ_DIFFS.length; d++) for(let z = 0; z < SQ_ZONES.length; z++){
    if(!sqZoneOpen(z, d)) continue;
    for(let s = 0; s < SQ_STAGES; s++) if(sqStageOpen(z, s, d) && !sqStars(z, s, d)) return {z, s, d};
  }
  return null;
}
function sqContinueCard(){
  const N = sqNextStage(), tot = [0, 1, 2].reduce((a, d)=>a + SQ_ZONES.reduce((b, _, z)=>b + sqZoneStars(z, d), 0), 0), max = SQ_ZONES.length * SQ_STAGES * 3 * SQ_DIFFS.length;
  if(!N) return `<div class="sq-cont done"><div class="grow"><small>LA TOUR</small><b>Toutes les ailes sont franchies</b><span>★ ${tot} / ${max}</span></div></div>`;
  const Z = SQ_ZONES[N.z], D = SQ_DIFFS[N.d], boss = N.s === SQ_STAGES - 1;
  return `<button class="sq-cont" data-act="sqcontinue" style="--zc:${Z.c}">
    <span class="sq-cont-mon">${pmdCanvas(Z.boss, 0, 48)}</span>
    <div class="grow"><small>REPRENDRE L'ASCENSION · ★ ${tot} / ${max}</small>
      <b>${esc(Z.n)} · ${boss ? "Boss" : "Palier " + (N.s + 1)}</b>
      <span><i style="color:${D.c}">${D.n}</i> · niveau ${sqStageLevel(N.z, N.s, N.d)}</span></div>
    <span class="sq-cont-go">${ic("arrow")}</span></button>`;
}
ACTIONS.sqcontinue = () => {
  const N = sqNextStage(); if(!N) return;
  SQ_ZSEL = N.z; SQ_DSEL = N.d;
  ACTIONS.sqprep({s:String(N.s)});
};
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
  if(P.final && typeof finalPrepHtml === "function") return finalPrepHtml(P);
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
      ${sqPrepIntel(P)}
      <div class="sw-leader ${L ? "" : "none"}" id="sw-leader">♛ ${P.team[0] ? esc(sqLeaderText(L)) : "Le premier emplacement est celui du meneur."}</div>
      <div class="sq-prepbar"><button class="btn xs ${sqCanUpgradeSomething(P.team) ? "gold" : ""}" data-act="sqskills">${ic("bolt")} Compétences${sqCanUpgradeSomething(P.team) ? " · à améliorer" : ""}</button>
        <span class="tiny dim">★ victoire · ★★ un K.O. au plus · ★★★ aucun K.O.</span></div>
      <div id="pp-host" class="sw-pp"></div>
      <div class="sw-go"><button class="btn pri wide" id="sw-fight" data-act="sqfight" ${P.team.length ? "" : "disabled"}>COMBAT</button></div>
    </div>`;
}
/* ce qu'il faut savoir avant d'entrer : le niveau, et les types qui font mal à ces vagues */
function sqPrepIntel(P){
  const mons = P.waves.flat(), lvAvg = Math.round(mons.reduce((a, m)=>a + m.lv, 0) / Math.max(1, mons.length));
  const team = P.team.filter(id=>S.dex[id]), tAvg = team.length ? Math.round(team.reduce((a, id)=>a + S.dex[id].lvl, 0) / team.length) : 0;
  const score = {};
  for(let t = 1; t <= 18; t++){ let n = 0; for(const m of mons){ const e = typeMult(t, m.mn ? [1, 3] : POKE[m.id].types); if(e >= 2) n += m.boss ? 3 : 1; else if(e < 1) n -= m.boss ? 2 : 0.5; } if(n > 0) score[t] = n; }
  const best = Object.keys(score).sort((a, b)=>score[b] - score[a]).slice(0, 3).map(Number);
  const gap = tAvg - lvAvg, cls = gap >= 3 ? "ok" : gap >= -4 ? "warn" : "bad";
  return `<div class="sq-intel" id="sq-intel">
    <div><small>NIVEAU DES VAGUES</small><b>N.${lvAvg}</b></div>
    <div class="${cls}"><small>TON ÉQUIPE</small><b>N.${tAvg || "—"}</b></div>
    <div class="grow"><small>LES FAIRE PLIER</small><span>${best.length ? best.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join(" ") : "<i class=\"dim\">aucun type nettement fort</i>"}</span></div>
  </div>`;
}
ACTIONS.sqzoneback = () => { const lk = SQ_PREP && SQ_PREP.lock, fin = SQ_PREP && SQ_PREP.final; SQ_PREP = null; fin ? go("modules") : lk ? go("boss") : go("tower", "zone"); };
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
/* lancer le combat : 55c */

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
/* ---------- la page des compétences ----------
   Un Pokémon à la fois : ses trois compétences en cartes, ce qu'elles
   font maintenant, ce qu'elles feront au niveau suivant, et le prix en
   parchemins. On voit ce qu'on achète avant de l'acheter. */
let SQ_SKV = null;          /* {id, back, ids, flash} */
const SQ_KIND_N = {atk:"ATTAQUE", aoe:"ZONE", team:"SOUTIEN"};
function sqSkillCost(id, i){ const lv = sqSkillLv(id)[i]; return lv >= SQ_SKILL_MAX ? 0 : SQ_SKILL_COST[lv]; }
function sqCanUpgrade(id){ const q = sqState(); return [0, 1, 2].some(i=>{ const c = sqSkillCost(id, i); return c && q.scrolls >= c; }); }
function sqCanUpgradeSomething(ids){ return (ids || []).some(id=>S.dex[id] && sqCanUpgrade(id)); }
/* ce qui change d'un niveau au suivant, en clair */
function sqSkillDiff(s0, lv){
  if(lv >= SQ_SKILL_MAX) return "";
  const a = sqApplyLv(s0, lv), b = sqApplyLv(s0, lv + 1), out = [];
  if(a.mult && b.mult) out.push(`Puissance <s>×${(+a.mult).toFixed(2)}</s> → <b>×${(+b.mult).toFixed(2)}</b>`);
  else out.push(`Effet <b>+8 %</b>`);
  if(a.cd !== b.cd) out.push(`Recharge <s>${a.cd}</s> → <b>${b.cd} tours</b>`);
  return out.join(" · ");
}
ACTIONS.sqskills = d => {
  const q = sqState();
  const ids = (SQ_PREP ? SQ_PREP.team : q.team).filter(id=>S.dex[id]);
  const first = (d && d.id && S.dex[+d.id]) ? +d.id : ids.find(id=>sqCanUpgrade(id)) || ids[0];
  SQ_SKV = {id:first, back:SQ_PREP ? "prep" : "world", ids};
  go("tower", "skills");
};
ACTIONS.sqskpick = d => { if(!SQ_SKV) return; SQ_SKV.id = +d.id; SQ_SKV.flash = null; const sc = document.getElementById("screen"), top = sc ? sc.scrollTop : 0; refresh(); if(sc) sc.scrollTop = top; };
ACTIONS.sqskback = () => { const b = SQ_SKV && SQ_SKV.back; SQ_SKV = null; b === "prep" && SQ_PREP ? go("tower", "prep") : go("tower"); };
ACTIONS.sqskother = () => {
  const own = Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>S.dex[b].lvl - S.dex[a].lvl || POKE[b].bst - POKE[a].bst);
  sheet(`${sheetHead("Choisir un Pokémon")}<div class="sq-skall">${own.map(id=>`<button class="sq-skallm ${sqCanUpgrade(id) ? "up" : ""}" data-act="sqskotherpick" data-id="${id}">
    ${sprite(id, S.dex[id].shiny, "", {skin:true})}<small>${esc(POKE[id].name)}</small><i>N.${S.dex[id].lvl}</i></button>`).join("")}</div>`);
};
ACTIONS.sqskotherpick = d => { closeSheet(); if(!SQ_SKV) return; const id = +d.id; if(!SQ_SKV.ids.includes(id)) SQ_SKV.ids = SQ_SKV.ids.concat([id]); SQ_SKV.id = id; SQ_SKV.flash = null; refresh(); };
function sqSkillsHtml(){
  const q = sqState(), V = SQ_SKV;
  if(!V || !S.dex[V.id]) return `<div class="empty">Composez d'abord une équipe.</div>`;
  const id = V.id, lv = sqSkillLv(id), L = sqLeaderOf(id), e = S.dex[id];
  const line = typeof FAM_MEMBERS !== "undefined" && FAM_MEMBERS[lineRoot(id)] ? FAM_MEMBERS[lineRoot(id)] : [id];
  const tot = lv.reduce((a, b)=>a + b, 0);
  return `
    <div class="sqk">
      <div class="sqk-head">
        <button class="sw-back" data-act="sqskback">${ic("arrow")}</button>
        <div class="grow"><small>LA TOUR</small><b>Compétences</b></div>
        <span class="sqk-scrolls">${itemIcon("exp:i_ct", 20) || "▤"}<b>${q.scrolls}</b><small>parchemin${q.scrolls > 1 ? "s" : ""}</small></span>
      </div>
      <div class="sqk-strip">${V.ids.filter(i=>S.dex[i]).map(i=>{ const l2 = sqSkillLv(i);
        return `<button class="sqk-m ${i === id ? "on" : ""} ${sqCanUpgrade(i) ? "up" : ""}" data-act="sqskpick" data-id="${i}">
          ${sprite(i, S.dex[i].shiny, "", {skin:true})}<small>${esc(POKE[i].name)}</small><i>${l2.reduce((a, b)=>a + b, 0)}/${SQ_SKILL_MAX * 3}</i></button>`; }).join("")}
        <button class="sqk-m more" data-act="sqskother">${ic("plus") || "+"}<small>Autre</small></button></div>
      <div class="sqk-hero">
        <span class="sqk-art">${pmdCanvas(id, 0, 88, {walk:false, shiny:e.shiny, mine:true})}</span>
        <div class="grow">
          <b class="sqk-name">${esc(POKE[id].name)}</b>
          <div class="row" style="gap:4px;margin:4px 0">${POKE[id].types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}<span class="tiny dim">N.${e.lvl}</span></div>
          <div class="tiny ${L ? "gold-t" : "dim"}">${L ? "♛ Meneur : " + esc(sqLeaderText(L)) : "Pas de passif de meneur"}</div>
          <div class="sqk-tot"><i style="width:${Math.round(tot / (SQ_SKILL_MAX * 3) * 100)}%"></i></div>
          <div class="tiny dim">Maîtrise ${tot} / ${SQ_SKILL_MAX * 3} · vaut pour ${line.length > 1 ? "toute la lignée : " + line.map(i=>POKE[i] ? POKE[i].name : "").filter(Boolean).join(", ") : "cette espèce"}</div>
        </div>
      </div>
      <div class="sqk-cards">${sqSkillsOf(id).map((s0, i)=>{
        const s = sqApplyLv(s0, lv[i]), max = lv[i] >= SQ_SKILL_MAX, cost = SQ_SKILL_COST[lv[i]], ok = !max && q.scrolls >= cost;
        return `<div class="sqk-card k-${s.kind} ${V.flash === i ? "flash" : ""} ${max ? "max" : ""}" style="--sc:${sqCol(s.t)}">
          <div class="sqk-ctop">
            <span class="sqk-ic">${ic(SQ_KIND_IC[s.kind])}</span>
            <div class="grow"><small>${i === 2 ? "ULTIME · " : i === 1 ? "COMPÉTENCE · " : "ATTAQUE DE BASE · "}${SQ_KIND_N[s.kind]} · <span class="tt t${s.t}">${TYPE_NAMES[s.t]}</span></small>
              <b>${esc(s.n)}</b></div>
            <span class="sqk-lvn">N.${lv[i]}</span>
          </div>
          <div class="sqk-pips">${Array.from({length:SQ_SKILL_MAX}, (_, k)=>`<i class="${k < lv[i] ? "on" : ""} ${V.flash === i && k === lv[i] - 1 ? "new" : ""}"></i>`).join("")}</div>
          <div class="sqk-now">${esc(sqDescribe(s))}</div>
          ${max ? `<div class="sqk-max">★ NIVEAU MAXIMUM</div>`
            : `<div class="sqk-next"><small>NIVEAU ${lv[i] + 1}</small>${sqSkillDiff(s0, lv[i])}</div>
               <button class="btn ${ok ? "gold" : ""} wide sqk-up" data-act="squp" data-id="${id}" data-i="${i}" ${ok ? "" : "disabled"}>
                 ${ok ? `Améliorer · ${itemIcon("exp:i_ct", 14) || "▤"} ${cost}` : `Il faut ${cost} parchemins · il en manque ${cost - q.scrolls}`}</button>`}
        </div>`; }).join("")}</div>
      <div class="sqk-help">${ic("info") || "i"} <span>Les parchemins se gagnent dans la Tour : chaque première victoire de palier en donne, les boss de vague en lâchent un à coup sûr,
        et les autres adversaires parfois. Rejouer un palier en automatique permet d'en ramasser.</span></div>
    </div>`;
}
ACTIONS.squp = d => {
  const id = +d.id, i = +d.i;
  if(sqUpgrade(id, i)){
    if(typeof Sfx !== "undefined") Sfx.win();
    if(typeof buzz === "function") buzz([15, 30, 15]);
    if(SQ_SKV){ SQ_SKV.flash = i; SQ_SKV.id = id; }
    const sc = document.getElementById("screen"), top = sc ? sc.scrollTop : 0;
    refresh(); if(sc) sc.scrollTop = top;
    const card = document.querySelectorAll(".sqk-card")[i];
    if(card && typeof burstEl === "function") burstEl(card, {n:22, spread:110, colors:[sqCol(sqSkillsOf(id)[i].t), "#ffd24a", "#ffffff"], dur:800});
  }
};

/* le combat, son dessin et ses résultats : 55c */

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
