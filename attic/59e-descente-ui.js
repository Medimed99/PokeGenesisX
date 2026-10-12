/* ============================================================
   59e — LA DESCENTE · INTERFACE
   Toucher une case : on y va, pas a pas (chaque pas est un tour).
   Toucher un ennemi voisin : attaque de base. Quatre capacites sous
   le pouce : tant que le doigt reste appuye, les cases touchees
   s'allument ; on relache pour lancer, on glisse hors du bouton pour
   annuler. « Auto » : l'equipe joue seule ses tours.
   ============================================================ */
const DC_TS = 38;
let DC_VFX = [], DC_TILECACHE = null;
const DC_HAB_PAL = {
  route:  {floor:"#4f7a3e", floor2:"#5a8846", wall:"#2c4a24", top:"#7fae5c", dot:"#8fbf6a"},
  foret:  {floor:"#3d5e33", floor2:"#476b3b", wall:"#1c3018", top:"#5c8a4c", dot:"#7fb26a"},
  eaux:   {floor:"#3a5f7a", floor2:"#426a87", wall:"#1c3448", top:"#5e8fb3", dot:"#8fc4e8"},
  grotte: {floor:"#5a4a3c", floor2:"#645244", wall:"#2a2018", top:"#806a54", dot:"#a08a70"},
  ruines: {floor:"#4e4466", floor2:"#574c71", wall:"#241e33", top:"#7a6ea0", dot:"#c9a6ff"},
  foyer:  {floor:"#5e3a30", floor2:"#6a4236", wall:"#2a1410", top:"#8a4a36", dot:"#ff8a3d"}
};

/* ---------- lancement ---------- */
function dcStart(D){
  DC = D; BR = null;
  const box = document.getElementById("breche");
  if(!box) return;
  box.className = "on";
  box.innerHTML = `<canvas id="dc-cv"></canvas>
    <div class="dc-hud">
      <div class="dc-top"><span class="dc-floor" id="dc-floor"></span><span class="dc-auto" id="dc-autob">AUTO</span>
        <button class="dc-menu" data-act="dcmenu" aria-label="Menu">⋮</button></div>
      <div class="dc-team" id="dc-team"></div>
      <div class="dc-log" id="dc-log"></div>
    </div>
    <div class="dc-say" id="dc-say"></div>
    <div class="dc-ctrl" id="dc-ctrl"></div>
    <div id="dc-modal"></div>`;
  const cv = document.getElementById("dc-cv");
  const fit = () => { const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr); D.dpr = dpr; D.W = cv.clientWidth; D.H = cv.clientHeight; };
  fit(); window.addEventListener("resize", fit);
  DC_TILECACHE = null; DC_VFX = [];
  D.busyUntil = 0;
  cv.addEventListener("pointerdown", ev=>dcTap(D, cv, ev));
  dcCtrl(D); dcHud(D);
  setTimeout(()=>{ if(DC === D) dcTips(D); }, 600);
  let last = performance.now();
  const loop = now => {
    if(DC !== D) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    dcFrame(D, dt, now);
    dcRender(D, cv, now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function dcIdle(D){ return performance.now() >= (D.busyUntil || 0) && !D.modal && !D.over; }
/* apres chaque tour : les effets a jouer, la sauvegarde, l'ATH */
function dcAfterTurn(D){
  const now = performance.now();
  for(const f of D.fx) DC_VFX.push(Object.assign({}, f, {t0:now + f.at * 1000}));
  D.busyUntil = now + (D.animEnd || 0.15) * 1000;
  dcSave(D); dcHud(D); dcCtrl(D);
  dcFeedback(D);
  if(D.say){ dcSay(D.say.who, D.say.txt); D.say = null; }
  else dcTips(D);
  setTimeout(()=>dcCheckPrompts(D), Math.max(0, (D.animEnd || 0.15) * 1000 - 60));
}
function dcCheckPrompts(D){
  if(DC !== D) return;
  if(D.over){ dcFinish(D); return; }
  if(D.recruitAsk){ dcRecruitModal(D); return; }
  const L = dcLeader(D);
  if(D.shopOpen && !D.auto && !D.modal){ D.shopOpen = false; dcShopModal(D); return; }
  if(L && D.stairs && L.x === D.stairs.x && L.y === D.stairs.y && !D.auto && !D.modal) dcStairsModal(D);
  /* le gardien se reveille quand le meneur entre dans l'arene */
  if(D.scen && D.scen.intro && L && dcRoomAt(D, L.x, L.y) === D.rooms[1]){
    D.scen.intro = false;
    const b = D.ents.find(e=>e.uid === D.boss);
    if(b){ D.banner = {txt:POKE[b.id].name.toUpperCase(), sub:"GARDIEN DES PROFONDEURS", t:2.6}; dcSay("pz", `Le gardien de cette Descente : ${POKE[b.id].name}. Ses attaques s'annoncent un tour à l'avance : quittez les cases rouges.`); }
  }
}

/* ---------- une image : positions, pas automatiques, mode auto ---------- */
function dcFrame(D, dt, now){
  for(const e of D.ents){
    const k = Math.min(1, dt * 14);
    e.px += (e.x - e.px) * k; e.py += (e.y - e.py) * k;
    e.walking = Math.abs(e.x - e.px) + Math.abs(e.y - e.py) > 0.05;
  }
  if(D.banner){ D.banner.t -= dt; if(D.banner.t <= 0) D.banner = null; }
  if(!dcIdle(D)) return;
  /* le chemin trace par un toucher : un pas par tour, interrompu si un ennemi surgit */
  if(D.walk && D.walk.length){
    const L = dcLeader(D), seenFoes = D.ents.filter(o=>o.side === "foe" && o.hp > 0 && dcVisible(D, o.x, o.y)).length;
    const [nx, ny] = D.walk.shift();
    if(!dcTurn(D, {k:"move", dx:nx - L.x, dy:ny - L.y})){ D.walk = null; return; }
    dcAfterTurn(D);
    const now2 = D.ents.filter(o=>o.side === "foe" && o.hp > 0 && dcVisible(D, o.x, o.y)).length;
    const adj = D.ents.some(o=>o.side === "foe" && o.hp > 0 && Math.max(Math.abs(o.x - L.x), Math.abs(o.y - L.y)) <= 1);
    if(now2 > seenFoes || adj) D.walk = null;
    return;
  }
  /* le mode automatique : l'equipe joue seule */
  if(D.auto){
    if(D.shopOpen){ dcAutoShop(D); D.shopOpen = false; }
    const a = dcAutoLeader(D), L = dcLeader(D);
    if(a.k === "attack" || a.k === "item"){ if(dcTurn(D, a)){ dcAfterTurn(D); return; } }
    if(a.k === "goto"){
      if(L.x === a.x && L.y === a.y && a.descend){ dcDescend(D, dcAutoDoor(D)); DC_TILECACHE = null; DC_VFX = []; dcAfterTurn(D); return; }
      const p = dcPath(D, L.x, L.y, a.x, a.y, L);
      if(p && p.length && dcTurn(D, {k:"move", dx:p[0][0] - L.x, dy:p[0][1] - L.y})){ dcAfterTurn(D); return; }
    }
    dcTurn(D, {k:"wait"}); dcAfterTurn(D);
  }
}

/* ---------- toucher la grille ---------- */
function dcTap(D, cv, ev){
  if(!dcIdle(D)) return;
  const L = dcLeader(D); if(!L) return;
  const r = cv.getBoundingClientRect();
  const camX = L.px * DC_TS - D.W / 2 + DC_TS / 2, camY = L.py * DC_TS - D.H / 2 + DC_TS / 2;
  const tx = Math.floor((ev.clientX - r.left + camX) / DC_TS), ty = Math.floor((ev.clientY - r.top + camY) / DC_TS);
  const foe = D.ents.find(o=>o.side === "foe" && o.hp > 0 && o.x === tx && o.y === ty);
  if(foe && Math.max(Math.abs(foe.x - L.x), Math.abs(foe.y - L.y)) === 1){
    const dir = dcDirOf(foe.x - L.x, foe.y - L.y);
    const tiles = dcShapeTiles(D, L, dcMoves(L.id)[0], dir);
    if(dcTurn(D, {k:"attack", slot:0, aim:{dir, tiles, hits:[foe]}})) dcAfterTurn(D);
    return;
  }
  if(dcTile(D, tx, ty) === T_WALL || !D.seen[dcIdx(tx, ty)]) return;
  const p = dcPath(D, L.x, L.y, tx, ty, L);
  if(p && p.length){ D.walk = p; D.auto = false; }
}

/* ---------- les commandes : quatre capacites, attendre, auto ---------- */
function dcCtrl(D){
  const el = document.getElementById("dc-ctrl"), L = dcLeader(D);
  if(!el || !L) return;
  const mv = dcMoves(L.id);
  el.innerHTML = `<div class="dc-moves">${mv.map((m, i)=>{
      const cd = L.cds[i], C = BR_ARCH[m.type] ? BR_ARCH[m.type].c : "#fff";
      return `<button class="dc-mv ${cd ? "cd" : ""} ${m.sig ? "sig" : m.ult ? "ult" : ""}" data-slot="${i}" style="--mc:${C}">
        <b>${esc(m.n)}</b><span><i class="tt t${m.type}">${TYPE_NAMES[m.type].slice(0,3)}</i> ${esc(DC_SHAPE_TXT[m.shape])}</span>
        ${cd ? `<em>${cd}</em>` : ""}</button>`; }).join("")}</div>
    <div class="dc-side">
      <button class="dc-btn" data-act="dcbag">Sac <small>${D.bag.length}/${DC_BAG}</small></button>
      <button class="dc-btn" data-act="dcwait">Attendre</button>
      <button class="dc-btn ${D.auto ? "on" : ""}" data-act="dcauto">Auto</button>
    </div>`;
  el.querySelectorAll(".dc-mv").forEach(b=>{
    const slot = +b.dataset.slot;
    b.onpointerdown = ev => { ev.preventDefault(); if(!dcIdle(D)) return;
      const aim = dcAim(D, dcLeader(D), slot); D.preview = aim ? aim.tiles : []; D.previewSlot = slot; b.setPointerCapture(ev.pointerId); };
    b.onpointerup = ev => {
      const r = b.getBoundingClientRect(), inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      D.preview = null;
      if(!inside || !dcIdle(D)) return;
      const Ld = dcLeader(D);
      if(Ld.cds[slot] > 0){ toast(`Encore ${Ld.cds[slot]} tour(s) de recharge`, "bad", "cross"); return; }
      const aim = dcAim(D, Ld, slot);
      if(!aim){ toast("Aucune cible à portée", "bad", "cross"); return; }
      D.walk = null;
      if(dcTurn(D, {k:"attack", slot, aim})) dcAfterTurn(D);
    };
    b.onpointercancel = () => { D.preview = null; };
  });
}
ACTIONS.dcwait = () => { const D = DC; if(!D || !dcIdle(D)) return; D.walk = null; if(dcTurn(D, {k:"wait"})) dcAfterTurn(D); };
ACTIONS.dcauto = () => { const D = DC; if(!D) return; D.auto = !D.auto; D.walk = null; dcCtrl(D); dcHud(D); };

/* ---------- l'ATH : etage, equipe, journal ---------- */
function dcHud(D){
  const $ = id => document.getElementById(id);
  const fl = $("dc-floor"); if(fl) fl.textContent = `ÉTAGE ${D.floor}${D.endless ? " · SANS FOND" : "/" + DC_FLOORS} · ${D.mod && D.mod !== "normal" ? DC_DOORS[D.mod].n : HABITATS[D.hab].n} · ${fmt(D.money)} ₽`;
  const ab = $("dc-autob"); if(ab) ab.className = "dc-auto" + (D.auto ? " on" : "");
  const tm = $("dc-team");
  if(tm) tm.innerHTML = D.ents.filter(e=>e.side === "ally").map(e=>`
    <div class="dc-mem ${e.leader ? "lead" : ""} ${e.hp <= 0 ? "ko" : ""}">
      <span class="sprbox" style="width:26px;height:26px">${sprite(e.id, false, "")}</span>
      <div class="grow"><div class="dc-mn">${esc(POKE[e.id].name)} <span>N.${e.lv}</span>${e.held ? itemIcon("exp:" + e.held, 12) : ""}</div>
        <div class="dc-hp"><i style="width:${Math.max(0, e.hp / e.maxHp * 100)}%" class="${e.hp / e.maxHp < 0.3 ? "low" : ""}"></i></div>
        <div class="dc-xp"><i style="width:${Math.min(100, e.xp / dcXpNeed(e.lv) * 100)}%"></i></div></div>
    </div>`).join("");
  const lg = $("dc-log");
  if(lg) lg.innerHTML = D.log.slice(-3).map(l=>`<div style="color:${l.color}">${esc(l.txt)}</div>`).join("");
}
function dcSay(who, txt){
  const el = document.getElementById("dc-say");
  if(!el) return;
  el.innerHTML = `<div>${pzFace("Happy", 32)}</div><div class="dc-sayt">${esc(txt)}</div>`;
  el.className = "dc-say on";
  clearTimeout(dcSay.t); dcSay.t = setTimeout(()=>{ el.className = "dc-say"; }, 4200);
}

/* ---------- les fenêtres : recrutement, escalier, menu ---------- */
function dcModal(html){ const m = document.getElementById("dc-modal"); if(!m) return; m.className = "on"; m.innerHTML = `<div class="dc-card">${html}</div>`; if(DC) DC.modal = true; }
function dcCloseModal(){ const m = document.getElementById("dc-modal"); if(m){ m.className = ""; m.innerHTML = ""; } if(DC){ DC.modal = false; } }
function dcRecruitModal(D){
  const r = D.recruitAsk;
  dcModal(`<div class="dc-ch">RECRUTEMENT</div>
    <span class="sprbox" style="width:72px;height:72px">${sprite(r.id, false, "")}</span>
    <div class="dc-ct">${esc(POKE[r.id].name)} <span class="dim">niv. ${r.lv}</span> veut rejoindre l'équipe !</div>
    <div class="tiny muted">${POKE[r.id].types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join(" ")}
      ${dcMoves(r.id).slice(1).map(m=>esc(m.n)).join(" · ")}</div>
    <div class="btn-grid c2" style="margin-top:12px"><button class="btn" data-act="dcrecruit" data-ok="0">Refuser</button>
      <button class="btn pri" data-act="dcrecruit" data-ok="1">Accepter</button></div>`);
}
ACTIONS.dcrecruit = d => {
  const D = DC; if(!D || !D.recruitAsk) return;
  dcAcceptRecruit(D, !!+d.ok);
  dcCloseModal(); dcSave(D); dcHud(D);
};
/* l'escalier : choisir sa porte vers l'etage suivant */
function dcStairsModal(D){
  const doors = dcStairsDoors(D), last = dcIsBossFloor(D, D.floor + 1);
  dcModal(`<div class="dc-ch">${last ? "L'ANTRE DU GARDIEN" : "CHOISISSEZ UNE PORTE"}</div>
    <div class="tiny muted" style="margin-bottom:10px">Étage ${D.floor + 1}. L'équipe récupère 30 % de ses PV en descendant.</div>
    ${last ? `<button class="dc-door" data-act="dcstairs" data-go="normal" style="--dc:#ff3d7f"><b>Descendre</b><span>Le gardien vous attend.</span></button>`
      : doors.map(k=>{ const o = DC_DOORS[k]; return `<button class="dc-door" data-act="dcstairs" data-go="${k}" style="--dc:${o.c}"><b>${esc(o.n)}</b><span>${esc(o.d)}</span></button>`; }).join("")}
    <button class="btn ghost wide" style="margin-top:8px" data-act="dcstairs" data-go="">Rester sur cet étage</button>`);
}
ACTIONS.dcstairs = d => {
  const D = DC; if(!D) return;
  dcCloseModal();
  if(d.go){ dcDescend(D, d.go); DC_TILECACHE = null; DC_VFX = []; dcSave(D); dcHud(D); dcCtrl(D);
    if(dcIsBossFloor(D)) dcSay("pz", "L'antre du gardien. Préparez-vous avant d'entrer dans la grande salle.");
    else if(D.mod === "marchand") dcSay("pz", "Une échoppe Kecleon ! Marchez sur son étal pour acheter.");
    else if(D.mod === "source") dcSay("pz", "Une source : marchez dessus pour restaurer toute l'équipe.");
    else if(D.mod === "piege") dcSay("pz", "Des pièges partout… Le butin en vaut la peine."); }
};
/* l'echoppe Kecleon */
function dcShopModal(D){
  dcModal(`<div class="dc-ch">ÉCHOPPE KECLEON</div>
    <div class="tiny muted" style="margin-bottom:8px">Vous avez <b class="gold-t">${fmt(D.money)} ₽</b> · sac ${D.bag.length}/${DC_BAG}</div>
    <div class="dc-shop">${(D.shop || []).map((o, i)=>`<div class="dc-si ${o.sold ? "sold" : ""}">
      ${itemIcon(dcItemIcon(o.k), 30)}<div class="grow"><b>${esc(dcItemName(o.k))}</b>
        <div class="tiny muted">${esc(o.k.startsWith("h:") ? dcHeldDesc(o.k.slice(2)) : DC_ITEMS[o.k].d)}</div></div>
      ${o.sold ? `<em>vendu</em>` : `<button class="btn xs ${D.money >= o.price && D.bag.length < DC_BAG ? "pri" : ""}" data-act="dcbuy" data-i="${i}">${o.price} ₽</button>`}</div>`).join("")}</div>
    <button class="btn wide" style="margin-top:10px" data-act="dcresume">Fermer</button>`);
}
ACTIONS.dcbuy = d => { const D = DC; if(!D) return; if(!dcBuy(D, +d.i)) toast("Pas assez de Pokédollars, ou sac plein", "bad", "cross"); dcShopModal(D); dcHud(D); dcSave(D); };
function dcAutoShop(D){
  /* l'auto achete d'abord de quoi survivre */
  const order = ["revive","potion","sitrus","nigma"];
  for(const k of order){ const i = (D.shop || []).findIndex(o=>o.k === k && !o.sold); if(i >= 0) dcBuy(D, i); }
}
/* le sac : utiliser un objet (un tour) ou equiper un objet tenu */
ACTIONS.dcbag = () => {
  const D = DC; if(!D || !dcIdle(D)) return;
  dcModal(`<div class="dc-ch">SAC · ${D.bag.length}/${DC_BAG}</div>
    <div class="tiny muted" style="margin-bottom:8px">${fmt(D.money)} ₽ · utiliser un objet prend un tour</div>
    ${D.bag.length ? `<div class="dc-shop">${D.bag.map((it, i)=>`<div class="dc-si">
      ${itemIcon(dcItemIcon(it.k), 30)}<div class="grow"><b>${esc(dcItemName(it.k))}</b>
        <div class="tiny muted">${esc(it.k.startsWith("h:") ? dcHeldDesc(it.k.slice(2)) : DC_ITEMS[it.k].d)}</div></div>
      ${it.k === "revive" ? `<em>automatique</em>` : `<button class="btn xs pri" data-act="${it.k.startsWith("h:") ? "dcequip" : "dcuse"}" data-i="${i}">${it.k.startsWith("h:") ? "Équiper" : "Utiliser"}</button>`}
      </div>`).join("")}</div>` : `<div class="empty">Le sac est vide.</div>`}
    <button class="btn wide" style="margin-top:10px" data-act="dcresume">Fermer</button>`);
};
ACTIONS.dcuse = d => { const D = DC; if(!D) return; dcCloseModal(); if(dcTurn(D, {k:"item", idx:+d.i})) dcAfterTurn(D); else toast("Inutile pour l'instant", "bad", "cross"); };
ACTIONS.dcequip = d => {
  const D = DC; if(!D) return;
  const allies = D.ents.filter(a=>a.side === "ally" && a.hp > 0);
  dcModal(`<div class="dc-ch">ÉQUIPER</div><div class="tiny muted" style="margin-bottom:8px">${esc(dcItemName(D.bag[+d.i].k))} — à qui le confier ?</div>
    ${allies.map(a=>`<button class="dc-door" data-act="dcequipto" data-i="${d.i}" data-u="${a.uid}" style="--dc:#35f0d6">
      <b>${esc(POKE[a.id].name)}</b><span>${a.held ? "tient déjà " + esc(EXP_ITEMS[a.held].n) + " (retourne au sac)" : "ne tient rien"}</span></button>`).join("")}
    <button class="btn wide" style="margin-top:8px" data-act="dcbag">Retour</button>`);
};
ACTIONS.dcequipto = d => { const D = DC; if(!D) return; dcCloseModal(); if(dcTurn(D, {k:"item", idx:+d.i, target:+d.u})) dcAfterTurn(D); };
ACTIONS.dcmenu = () => {
  const D = DC; if(!D) return;
  dcModal(`<div class="dc-ch">PAUSE</div>
    <div class="tiny muted" style="margin-bottom:10px">La Descente est sauvegardée à chaque pas : vous pouvez quitter et reprendre plus tard.</div>
    <button class="btn pri wide" data-act="dcresume">Reprendre</button>
    <button class="btn wide" style="margin-top:7px" data-act="dcquit">Quitter (reprendre plus tard)</button>
    <button class="btn dan wide" style="margin-top:7px" data-act="dcabandon">Abandonner la Descente</button>`);
};
ACTIONS.dcresume = () => dcCloseModal();
ACTIONS.dcquit = () => { const D = DC; if(D) dcSave(D); dcExit(); };
ACTIONS.dcabandon = () => { const D = DC; if(!D) return; D.over = "lost"; D.quit = true; dcCloseModal(); dcFinish(D); };
function dcExit(){
  DC = null;
  const box = document.getElementById("breche"); if(box){ box.className = ""; box.innerHTML = ""; }
  go(moduleUnlocked("breche") ? "breche" : "descente");
}

/* ---------- la fin : récompenses, Pokédex, records ---------- */
function dcFinish(D){
  if(D.finished) return; D.finished = true;
  const st = dcState(), won = D.over === "won";
  st.runs++; st.kos += D.kos; st.recruits += D.recruits.length;
  if(!D.endless) st.bestFloor = Math.max(st.bestFloor, won ? DC_FLOORS + 1 : D.floor);
  if(won) st.wins++;
  st.saved = null;
  /* la Descente reprend les compteurs de l'Expedition : succes, deblocage de la Breche, quetes */
  S.stats.expRuns = (S.stats.expRuns || 0) + 1;
  if(won || (D.endless && D.bossesDown)) S.stats.expWins = (S.stats.expWins || 0) + 1;
  if(won && typeof questTick === "function") questTick("dayExp", 1);
  /* la Descente sans fond remplace la Tour : son record, et des renforts a chaque gardien */
  let renforts = 0;
  if(D.endless){
    st.endlessBest = Math.max(st.endlessBest || 0, D.floor);
    const T = towerState(); T.best = Math.max(T.best || 0, D.floor); T.runs = (T.runs || 0) + 1;
    renforts = D.bossesDown * 2 + Math.floor(D.floor / 3);
    T.points = (T.points || 0) + renforts;
  }
  /* une Descente abandonnee sans rien accomplir ne rapporte rien : sinon, lancer et abandonner
     en boucle ferait monter les Pokemon gratuitement */
  const nothing = !won && !D.bossesDown && D.floor === 1 && D.kos === 0;
  /* la premiere victoire du jour double les recompenses, comme pour l'Expedition */
  const mult = won && typeof consumeFirstWin === "function" ? consumeFirstWin("expedition") : 1;
  const data = nothing ? 0 : Math.round((D.floor * 14 + D.kos * 0.8 + (won ? 90 : 0) + D.bossesDown * 60) * mult);
  const coins = nothing ? 0 : Math.round((D.floor * 320 + D.kos * 25 + (won ? 1800 : 0) + D.bossesDown * 1200) * mult + (D.money || 0) * 5);
  brState().data += data; gain("coins", coins);
  /* la Descente reprend tout ce que distribuait l'Expedition : sans cela, oeufs, cartes et
     factions perdraient leur source. Une part, meme en cas d'echec ; le reste, a la victoire. */
  const part = nothing ? 0 : won || D.bossesDown ? 1 : 0.35;
  const shards = Math.round((50 + D.floor * 12) * part * mult), xp = Math.round((220 + D.floor * 50) * part * mult);
  gain("shards", shards); addXp(xp);
  const loot = [];
  const triumphs = won ? 1 : D.endless ? D.bossesDown : 0;
  if(triumphs){
    S.daily.dayExp = (S.daily.dayExp || 0) + 1;
    if(!D.healUsed) S.flags.expNoHeal = true;
    for(let k = 0; k < triumphs; k++){
      addIntegrity(0.5); gain("cores", 1); factionPts(20);
      /* l'oeuf est d'autant plus rare que l'on a pris de risques : portes d'elite, gardiens */
      const risk = (D.elites || 0) + (D.bossesDown || 0);
      const tier = risk >= 4 ? "e_origin" : risk >= 2 ? "e_epic" : (D.elites || D.bossesDown) ? "e_rare" : "e_common";
      grantEgg(tier); loot.push({k:"egg", tier});
      const cw = randomCard(1 + risk * 0.4), fresh = grantCardV(cw.s, cw.id); loot.push({k:"card", s:cw.s, id:cw.id, fresh});
      if(Math.random() < 0.5){ const h = randomHeld(); if(h && grantHeld(h)) loot.push({k:"held", h}); }
    }
  }
  /* les survivants gagnent des niveaux definitifs, comme dans l'ancienne Expedition */
  const gains = [];
  /* niveaux definitifs : il faut au moins avoir atteint le deuxieme etage */
  const plus = D.floor >= 2 || won ? 1 + (won ? 1 : 0) + (D.bossesDown || 0) : 0;
  for(const e of D.ents){
    if(!plus || e.side !== "ally" || e.hp <= 0 || !S.dex[e.id]) continue;
    const before = S.dex[e.id].lvl; S.dex[e.id].lvl = Math.min(100, before + plus);
    gains.push({id:e.id, before, after:S.dex[e.id].lvl});
  }
  /* les recrues et les evolutions rejoignent l'archive */
  const restored = [];
  for(const id of new Set([...D.recruits, ...D.evos])) if(!S.dex[id]){ addToDex(id, 15, false); restored.push(id); }
  save(); checkAchievements();
  dcModal(`<div class="dc-ch" style="color:${won ? "#35f0d6" : "#ff5c8a"}">${won ? "GARDIEN VAINCU" : D.quit ? "DESCENTE ABANDONNÉE" : D.endless ? "FIN DE LA DESCENTE SANS FOND" : "ÉQUIPE K.O."}</div>
    ${D.endless ? `<div class="tiny" style="color:#c9a6ff;margin-bottom:6px">Étage ${D.floor} atteint · ${D.bossesDown} gardien(s) vaincu(s)${D.floor >= (st.endlessBest || 0) ? " · record !" : ""}</div>` : ""}
    <div class="dc-stats"><div><span>Étage</span><b>${D.floor}/${DC_FLOORS}</b></div><div><span>K.O.</span><b>${D.kos}</b></div>
      <div><span>Recrues</span><b>${D.recruits.length}</b></div><div><span>Tours</span><b>${D.turn}</b></div></div>
    ${restored.length ? `<div class="tiny muted" style="margin:8px 0 4px">Restaurés au Pokédex</div>
      <div class="wrap" style="justify-content:center">${restored.map(id=>`<span class="sprbox" style="width:36px;height:36px">${sprite(id, false, "")}</span>`).join("")}</div>` : ""}
    ${gains.length ? `<div class="tiny muted" style="margin:8px 0 4px">Niveaux définitifs des survivants</div>
      <div class="dc-gains">${gains.map(g=>`<span><span class="sprbox" style="width:30px;height:30px">${sprite(g.id, false, "")}</span>N.${g.before} → <b>${g.after}</b></span>`).join("")}</div>` : ""}
    ${loot.length ? `<div class="dc-loot">${loot.map(l=>l.k === "egg" ? `<span>${esc((EGG_TIERS[l.tier] || {n:"Œuf"}).n)}</span>`
        : l.k === "card" ? `<span>Carte ${esc(String(l.s))}-${l.id}${l.fresh ? " · nouvelle !" : ""}</span>`
        : `<span>${itemIcon("held:" + l.h, 16)} ${esc(HELD_ITEMS[l.h].n)}</span>`).join("")}
      ${triumphs ? `<span>+${(0.5 * triumphs).toFixed(1).replace(".", ",")} % d'intégrité · +${triumphs} Noyau(x)</span>` : ""}</div>` : ""}
    <div class="dc-rw">+${fmt(data)} Données · +${fmt(coins)} PokéCoins · +${fmt(shards)} Fragments${mult > 1 ? " · première victoire du jour ×2" : ""}${renforts ? ` · +${renforts} renfort(s)` : ""}</div>
    <button class="btn pri wide" style="margin-top:12px" data-act="dcdone">Retour</button>`);
  try { (won ? Sfx.win : Sfx.glitch)(); } catch(e){}
}
ACTIONS.dcdone = () => { dcCloseModal(); dcExit(); };

/* ============================================================
   RENDU
   ============================================================ */
function dcTiles(D){
  if(DC_TILECACHE && DC_TILECACHE.floor === D.floor) return DC_TILECACHE.c;
  const P = DC_HAB_PAL[D.hab] || DC_HAB_PAL.route, c = document.createElement("canvas");
  c.width = DC_W * DC_TS; c.height = DC_H * DC_TS;
  const x = c.getContext("2d"), r = brRng(D.floor * 7919 + 13);
  for(let ty = 0; ty < DC_H; ty++) for(let tx = 0; tx < DC_W; tx++){
    const t = D.tiles[dcIdx(tx, ty)], X0 = tx * DC_TS, Y0 = ty * DC_TS;
    if(t === T_WALL){
      x.fillStyle = P.wall; x.fillRect(X0, Y0, DC_TS, DC_TS);
      /* le haut d'un mur qui borde le sol : une arete eclairee, pour le relief */
      if(dcTile(D, tx, ty + 1) !== T_WALL){ x.fillStyle = P.top; x.fillRect(X0, Y0 + DC_TS - 8, DC_TS, 8); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(X0, Y0 + DC_TS - 2, DC_TS, 2); }
      if(r() < 0.25){ x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(X0 + r() * 30, Y0 + r() * 20, 6, 4); }
    } else {
      x.fillStyle = (tx + ty) % 2 ? P.floor : P.floor2; x.fillRect(X0, Y0, DC_TS, DC_TS);
      x.fillStyle = "rgba(0,0,0,.12)"; x.fillRect(X0, Y0, DC_TS, 1); x.fillRect(X0, Y0, 1, DC_TS);
      if(r() < 0.3){ x.fillStyle = P.dot; x.globalAlpha = 0.35; x.fillRect(X0 + 4 + r() * 28, Y0 + 4 + r() * 28, 2, 2); x.globalAlpha = 1; }
      /* l'ombre portee d'un mur au-dessus */
      if(dcTile(D, tx, ty - 1) === T_WALL){ x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(X0, Y0, DC_TS, 7); }
      if(t === T_STAIRS){
        x.fillStyle = "#1a1424"; x.fillRect(X0 + 5, Y0 + 5, DC_TS - 10, DC_TS - 10);
        for(let k = 0; k < 4; k++){ x.fillStyle = `rgba(200,180,255,${0.25 + k * 0.15})`; x.fillRect(X0 + 7 + k * 3, Y0 + 9 + k * 6, DC_TS - 14 - k * 6, 3); }
      }
    }
  }
  DC_TILECACHE = {floor:D.floor, c};
  return c;
}
function dcRender(D, cv, now){
  const x = cv.getContext("2d"), W = D.W, H = D.H;
  x.setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
  x.imageSmoothingEnabled = false;
  x.fillStyle = "#05030a"; x.fillRect(0, 0, W, H);
  const L = dcLeader(D) || D.ents[0];
  if(!L) return;
  let shake = 0;
  for(const v of DC_VFX) if(v.k === "hit" && v.crit && now - v.t0 < 160 && now >= v.t0) shake = 4;
  const camX = L.px * DC_TS - W / 2 + DC_TS / 2 + (Math.random() - .5) * shake, camY = L.py * DC_TS - H / 2 + DC_TS / 2 + (Math.random() - .5) * shake;
  const X = tx => tx * DC_TS - camX, Y = ty => ty * DC_TS - camY;
  x.drawImage(dcTiles(D), -camX, -camY);
  dcDrawTerrain(D, x, X, Y, camX, camY, now);
  /* objets au sol */
  for(const it of D.items){ if(!D.seen[dcIdx(it.x, it.y)]) continue; dcDrawItem(x, X(it.x), Y(it.y), dcItemIcon(it.k)); }
  /* cases annoncees par le gardien, et cases sures */
  if(D.warn){
    const pulse = 0.25 + Math.sin(now / 120) * 0.12, safe = new Set((D.warn.safe || []).map(([a, b])=>a + "," + b));
    for(const [tx, ty] of D.warn.tiles){ if(safe.has(tx + "," + ty)) continue; x.fillStyle = `rgba(255,40,80,${pulse})`; x.fillRect(X(tx) + 1, Y(ty) + 1, DC_TS - 2, DC_TS - 2); }
    for(const [tx, ty] of D.warn.safe || []){ x.fillStyle = "rgba(92,224,122,.45)"; x.fillRect(X(tx) + 1, Y(ty) + 1, DC_TS - 2, DC_TS - 2);
      x.strokeStyle = "#5ce07a"; x.lineWidth = 2; x.strokeRect(X(tx) + 2, Y(ty) + 2, DC_TS - 4, DC_TS - 4); }
  }
  /* apercu de la capacite, doigt appuye */
  if(D.preview){ for(const [tx, ty] of D.preview){ x.fillStyle = "rgba(53,240,214,.28)"; x.fillRect(X(tx) + 2, Y(ty) + 2, DC_TS - 4, DC_TS - 4);
    x.strokeStyle = "rgba(53,240,214,.8)"; x.lineWidth = 1.5; x.strokeRect(X(tx) + 2, Y(ty) + 2, DC_TS - 4, DC_TS - 4); } }
  /* les Pokemon, tries par profondeur */
  const posing = {};
  for(const v of DC_VFX) if(v.k === "move" && now >= v.t0 && now - v.t0 < 450) posing[v.e.uid] = v;
  const hurting = {};
  for(const v of DC_VFX) if(v.k === "hit" && now >= v.t0 && now - v.t0 < 280) hurting[v.e.uid] = v;
  const list = D.ents.filter(e=>e.hp > 0 || (DC_VFX.some(v=>v.k === "ko" && v.e === e && now < v.t0 + 500)));
  for(const v of DC_VFX) if(v.k === "ko" && now < v.t0 + 500 && !list.includes(v.e)) list.push(v.e);
  list.sort((a, b)=>a.py - b.py);
  for(const e of list){
    if(e.side === "foe" && !dcVisible(D, e.x, e.y) && !e.boss) continue;
    const sx = X(e.px) + DC_TS / 2, sy = Y(e.py) + DC_TS * 0.72, size = e.boss ? DC_TS * 1.7 : DC_TS * 1.05;
    let alpha;
    const ko = DC_VFX.find(v=>v.k === "ko" && v.e === e && now >= v.t0);
    if(ko){ alpha = Math.max(0, 1 - (now - ko.t0) / 500); if(alpha <= 0) continue; }
    x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(sx, sy + 2, size * 0.32, size * 0.12, 0, 0, 7); x.fill();
    if(e.leader){ x.strokeStyle = "rgba(53,240,214,.8)"; x.lineWidth = 2; x.beginPath(); x.ellipse(sx, sy + 2, size * 0.38, size * 0.15, 0, 0, 7); x.stroke(); }
    if(e.pylon){ dcDrawPylon(x, D, e, sx, sy, now, X, Y); continue; }
    const variant = e.side === "foe" ? "c" : "n", ps = posing[e.uid], hu = hurting[e.uid];
    let drawn = false;
    if(ps){ const id = e.id, anim = BR_MELEE.has(ps.mv.kind) || ps.mv.shape === "melee" || ps.mv.shape === "arc" ? "attack" : "shoot";
      drawn = brAnimDraw(x, id, PMD_ANIM[id] && PMD_ANIM[id][anim] ? anim : "attack", variant, ps.dir, (now - ps.t0) / 1000, sx, sy, size, alpha); }
    else if(hu) drawn = brAnimDraw(x, e.id, "hurt", variant, e.dir, (now - hu.t0) / 1000, sx, sy, size, alpha);
    if(!drawn) drawn = brPmdDraw(x, e.id, variant, e.dir, e.walking ? now / 1000 : null, sx, sy, size, alpha);
    if(!drawn){ const sp = brSprite(e.id, variant); if(sp){ if(alpha !== undefined) x.globalAlpha = alpha; x.drawImage(sp, sx - size / 2, sy - size * 0.85, size, size); x.globalAlpha = 1; } }
    if(e.shield){ x.strokeStyle = "rgba(255,61,127,.7)"; x.lineWidth = 3; x.beginPath(); x.arc(sx, sy - size * 0.35, size * 0.6, 0, 7); x.stroke(); }
    /* barre de vie des ennemis blesses */
    if(e.side === "foe" && e.shownHp < e.maxHp && !ko){ const bw = e.boss ? 60 : 30;
      x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(sx - bw / 2, sy - size * 0.95, bw, 4);
      x.fillStyle = e.boss ? "#ff3d7f" : "#ff8a5c"; x.fillRect(sx - bw / 2, sy - size * 0.95, bw * Math.max(0, e.shownHp) / e.maxHp, 4); }
  }
  /* les effets */
  for(const v of DC_VFX) dcDrawVfx(x, D, v, now, X, Y);
  DC_VFX = DC_VFX.filter(v=>now < v.t0 + 900);
  /* le brouillard : l'inconnu est noir, le connu hors de vue est voile */
  const x0 = Math.max(0, Math.floor(camX / DC_TS)), y0 = Math.max(0, Math.floor(camY / DC_TS));
  for(let ty = y0; ty < Math.min(DC_H, y0 + Math.ceil(H / DC_TS) + 2); ty++)
    for(let tx = x0; tx < Math.min(DC_W, x0 + Math.ceil(W / DC_TS) + 2); tx++){
      const i = dcIdx(tx, ty);
      if(!D.seen[i]){ x.fillStyle = "#05030a"; x.fillRect(X(tx), Y(ty), DC_TS + 1, DC_TS + 1); }
      else if(!D.vis[i]){ x.fillStyle = "rgba(5,3,10,.5)"; x.fillRect(X(tx), Y(ty), DC_TS + 1, DC_TS + 1); }
    }
  dcDrawMinimap(x, D, W);
  if(D.banner){ const a = Math.min(1, D.banner.t);
    x.globalAlpha = a; x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(0, H * 0.36, W, 64);
    x.textAlign = "center"; x.font = "bold 26px ui-monospace,monospace"; x.fillStyle = "#ff3d7f"; x.fillText(D.banner.txt, W / 2, H * 0.36 + 32);
    x.font = "12px ui-monospace,monospace"; x.fillStyle = "#ffb3cc"; x.fillText(D.banner.sub, W / 2, H * 0.36 + 52); x.globalAlpha = 1; }
}
let DC_ITEM_IMG = null;
function dcDrawItem(x, sx, sy, key){
  if(!DC_ITEM_IMG){ DC_ITEM_IMG = new Image(); DC_ITEM_IMG.src = ITEMS_URL; }
  const i = ITEM_IDX[key || "berry:sitrus"];
  if(!DC_ITEM_IMG.complete || i === undefined) return;
  const bob = Math.sin(performance.now() / 300) * 2;
  x.drawImage(DC_ITEM_IMG, (i % ITEMS_COLS) * 32, Math.floor(i / ITEMS_COLS) * 32, 32, 32, sx + 3, sy + 3 + bob, DC_TS - 6, DC_TS - 6);
}
function dcDrawVfx(x, D, v, now, X, Y){
  const t = (now - v.t0) / 1000;
  if(t < 0) return;
  if(v.k === "move"){
    const C = BR_ARCH[v.mv.type] ? BR_ARCH[v.mv.type].c : "#fff", k = Math.min(1, t / 0.28), fade = Math.max(0, 1 - (t - 0.28) / 0.3);
    if(fade <= 0) return;
    const sx = X(v.e.x) + DC_TS / 2, sy = Y(v.e.y) + DC_TS / 2;
    x.save(); x.globalCompositeOperation = "lighter"; x.globalAlpha = fade;
    const sh = v.mv.shape;
    if(sh === "line" || sh === "chain"){
      /* un projectile qui file de case en case */
      const last = v.tiles[v.tiles.length - 1] || [v.e.x, v.e.y];
      const ex = X(last[0]) + DC_TS / 2, ey = Y(last[1]) + DC_TS / 2;
      const px = sx + (ex - sx) * k, py = sy + (ey - sy) * k;
      x.fillStyle = C; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fill();
      x.fillStyle = "#fff"; x.beginPath(); x.arc(px, py, 3, 0, 7); x.fill();
      if(sh === "chain" && k >= 1){ x.strokeStyle = C; x.lineWidth = 2; x.beginPath(); x.moveTo(sx, sy); for(const [a, b] of v.tiles) x.lineTo(X(a) + DC_TS / 2, Y(b) + DC_TS / 2); x.stroke(); }
    } else if(sh === "pierce"){
      const last = v.tiles[v.tiles.length - 1] || [v.e.x, v.e.y];
      x.strokeStyle = C; x.lineWidth = 12 * (1 - k * 0.5); x.beginPath(); x.moveTo(sx, sy); x.lineTo(X(last[0]) + DC_TS / 2, Y(last[1]) + DC_TS / 2); x.stroke();
      x.strokeStyle = "#fff"; x.lineWidth = 3; x.stroke();
    } else {
      /* les formes de zone : chaque case touchee s'embrase, en partant du lanceur */
      for(const [tx, ty] of v.tiles){
        const d = Math.hypot(tx - v.e.x, ty - v.e.y), local = Math.max(0, Math.min(1, k * 3 - d * 0.35));
        if(local <= 0) continue;
        x.fillStyle = C; x.globalAlpha = fade * local * 0.55;
        x.fillRect(X(tx) + 3, Y(ty) + 3, DC_TS - 6, DC_TS - 6);
        x.globalAlpha = fade * local;
        x.fillStyle = "#fff"; x.fillRect(X(tx) + DC_TS / 2 - 2, Y(ty) + DC_TS / 2 - 2, 4, 4);
      }
    }
    x.restore();
  } else if(v.k === "hit"){
    if(t < 0.02 && !v.applied){ v.applied = true; v.e.shownHp = v.hp; }
    if(!v.applied){ v.applied = true; v.e.shownHp = v.hp; }
    const sx = X(v.e.x) + DC_TS / 2, sy = Y(v.e.y) - t * 30;
    const a = Math.max(0, 1 - t / 0.85);
    x.globalAlpha = a; x.textAlign = "center";
    x.font = `bold ${v.crit || v.eff >= 2 ? 18 : 14}px ui-monospace,monospace`;
    x.fillStyle = "#000"; x.fillText(v.dmg ? String(v.dmg) : "0", sx + 1, sy + 1);
    x.fillStyle = v.e.side === "ally" ? "#ff5c8a" : v.eff >= 2 ? "#ffd24a" : v.eff < 1 ? "#9fb0c8" : "#ffffff";
    x.fillText(v.dmg ? String(v.dmg) : "0", sx, sy);
    if(t < 0.12){ x.globalAlpha = 0.6 * (1 - t / 0.12); x.fillStyle = "#fff"; x.fillRect(X(v.e.x) + 6, Y(v.e.y) + 2, DC_TS - 12, DC_TS - 4); }
    x.globalAlpha = 1;
  } else if(v.k === "ko"){
    const sx = X(v.e.x) + DC_TS / 2, sy = Y(v.e.y) + DC_TS / 2, a = Math.max(0, 1 - t / 0.7);
    x.fillStyle = v.e.side === "foe" ? "#ff3d7f" : "#ffffff"; x.globalAlpha = a;
    for(let k = 0; k < 10; k++){ const ang = k / 10 * 6.28, d = t * 70; x.fillRect(sx + Math.cos(ang) * d, sy + Math.sin(ang) * d, 3, 3); }
    x.globalAlpha = 1;
  } else if(v.k === "heal" || v.k === "evolve"){
    const sx = X(v.e.x) + DC_TS / 2, sy = Y(v.e.y) + DC_TS / 2, a = Math.max(0, 1 - t / 0.8);
    x.strokeStyle = v.k === "heal" ? "#5ce07a" : "#ffffff"; x.globalAlpha = a; x.lineWidth = 3;
    x.beginPath(); x.arc(sx, sy, 10 + t * 40, 0, 7); x.stroke(); x.globalAlpha = 1;
  } else if(v.k === "terrain"){
    const a = Math.max(0, 1 - t / 0.5);
    x.fillStyle = v.c; x.globalAlpha = a * 0.8; x.fillRect(X(v.x), Y(v.y), DC_TS, DC_TS); x.globalAlpha = 1;
  } else if(v.k === "shock"){
    if(t > 0.5) return;
    x.strokeStyle = "#ffe45e"; x.lineWidth = 2; x.globalAlpha = 1 - t / 0.5;
    for(const [tx, ty] of v.tiles){ if(Math.random() < 0.5) continue; let px = X(tx) + DC_TS / 2, py = Y(ty) + DC_TS / 2;
      x.beginPath(); x.moveTo(px, py); for(let j = 0; j < 3; j++){ px += (Math.random() - .5) * 22; py += (Math.random() - .5) * 22; x.lineTo(px, py); } x.stroke(); }
    x.globalAlpha = 1;
  } else if(v.k === "boom"){
    const a = Math.max(0, 1 - t / 0.6), safe = new Set((v.safe || []).map(([p, q])=>p + "," + q));
    x.fillStyle = "#ff3d7f"; x.globalAlpha = a * 0.7;
    for(const [tx, ty] of v.tiles) if(!safe.has(tx + "," + ty)) x.fillRect(X(tx), Y(ty), DC_TS, DC_TS);
    x.globalAlpha = 1;
  }
}
function dcDrawMinimap(x, D, W){
  const s = 3, mw = DC_W * s, mh = DC_H * s, ox = W - mw - 8, oy = 8;
  x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(ox - 3, oy - 3, mw + 6, mh + 6);
  for(let ty = 0; ty < DC_H; ty++) for(let tx = 0; tx < DC_W; tx++){
    const i = dcIdx(tx, ty); if(!D.seen[i] || D.tiles[i] === T_WALL) continue;
    x.fillStyle = D.tiles[i] === T_STAIRS ? "#c9a6ff" : "rgba(160,180,210,.45)"; x.fillRect(ox + tx * s, oy + ty * s, s, s);
  }
  for(const e of D.ents){ if(e.hp <= 0) continue; if(e.side === "foe" && !dcVisible(D, e.x, e.y)) continue;
    x.fillStyle = e.side === "ally" ? (e.leader ? "#35f0d6" : "#8ff7e8") : "#ff3d7f"; x.fillRect(ox + e.x * s - 1, oy + e.y * s - 1, s + 1, s + 1); }
}

/* ============================================================
   LE HALL : choisir son équipe, descendre ou reprendre
   ============================================================ */
let DC_MODE = "normal";
function dcEndlessOpen(){ const st = dcState(); return (st.wins || 0) >= 1 || ((S.tower && S.tower.best) || 0) > 0; }
function dcLobbyHtml(){
  const st = dcState(), bs = brState(), T = typeof towerState === "function" ? towerState() : {points:0};
  if(!dcEndlessOpen()) DC_MODE = "normal";
  const owned = Object.keys(S.dex).map(Number).filter(id=>POKE[id] && !isExclusive(id)).sort((a, b)=>POKE[b].bst - POKE[a].bst);
  st.team = (st.team || []).filter(id=>S.dex[id]).slice(0, 3);
  const team = st.team;
  return `<div class="segbar">
      <button class="${DC_MODE === "normal" ? "on" : ""}" data-act="dcmode" data-m="normal"><span>Descente</span></button>
      <button class="${DC_MODE === "endless" ? "on" : ""} ${dcEndlessOpen() ? "" : "locked"}" data-act="dcmode" data-m="endless">
        <span>${dcEndlessOpen() ? "" : "🔒 "}Sans fond</span></button>
    </div>
    ${DC_MODE === "endless" ? `<div class="panel bracket" style="border-color:rgba(176,107,255,.5)">
      <div class="h sm" style="color:#c9a6ff">LA DESCENTE SANS FOND</div>
      <div class="tiny muted">Aucun fond : un gardien tous les cinq étages, toujours plus fort. Chaque gardien vaincu rapporte
        deux renforts permanents (+4 % sur une statistique, pour toute une lignée). La Descente sans fond remplace la Tour :
        ses renforts et son record vous suivent.</div>
      <div class="row between tiny" style="margin-top:8px"><span class="muted">Record</span><b>${st.endlessBest ? "étage " + st.endlessBest : (S.tower && S.tower.best) ? "étage " + S.tower.best + " (Tour)" : "—"}</b></div>
      <button class="btn wide sm" style="margin-top:8px" data-act="towerbuffs">Renforts (${T.points || 0} disponible${(T.points || 0) > 1 ? "s" : ""})</button>
    </div>` : `<div class="panel bracket">
      <div class="h sm">LA DESCENTE</div>
      <div class="tiny muted">Un donjon au tour par tour : chaque pas est un tour. ${DC_FLOORS} étages, un gardien au fond.
        À chaque escalier, choisissez votre porte. Recrutez, équipez, faites évoluer votre équipe ; un Pokémon K.O. est
        perdu pour la Descente, sauf avec un Rappel. Sauvegardé à chaque pas.</div>
      <div class="row between tiny" style="margin-top:8px"><span class="muted">Habitat</span><b>${esc(HABITATS[bs.hab].n)}</b></div>
      <div class="row between tiny"><span class="muted">Record</span><b>${st.wins ? st.wins + " gardien(s) vaincu(s)" : st.bestFloor ? "étage " + st.bestFloor : "jamais tentée"}</b></div>
    </div>`}
    ${st.saved ? `<button class="btn pri wide" data-act="dcload">Reprendre la Descente en cours</button>` : ""}
    <div class="h sm" style="margin-top:12px">VOTRE ÉQUIPE (${team.length}/3) — LE PREMIER MÈNE</div>
    <div class="dc-pick-sel">${[0, 1, 2].map(i=>team[i] ? `<div class="dc-slot" data-act="dcpick" data-id="${team[i]}">
        <span class="sprbox" style="width:44px;height:44px">${sprite(team[i], false, "")}</span><span>${i ? "" : "★ "}${esc(POKE[team[i]].name)}</span></div>`
      : `<div class="dc-slot empty">—</div>`).join("")}</div>
    <div class="dc-pick">${owned.slice(0, 90).map(id=>`<span class="dc-pk ${team.includes(id) ? "on" : ""}" data-act="dcpick" data-id="${id}">
      <span class="sprbox" style="width:40px;height:40px">${sprite(id, false, "")}</span></span>`).join("")}</div>
    <button class="btn pri wide" style="margin-top:10px" data-act="dcgo" ${team.length ? "" : "disabled"}>${st.saved ? "Nouvelle Descente (remplace la sauvegarde)" : DC_MODE === "endless" ? "Plonger sans fond" : "Commencer la Descente"}</button>`;
}
ACTIONS.dcpick = d => {
  const st = dcState(), id = +d.id;
  st.team = st.team || [];
  if(st.team.includes(id)) st.team = st.team.filter(x=>x !== id);
  else if(st.team.length < 3) st.team.push(id);
  else toast("Trois Pokémon au plus au départ", "bad", "cross");
  saveSoon(); refresh();
};
ACTIONS.dcgo = () => {
  const st = dcState(), bs = brState();
  if(!st.team || !st.team.length) return;
  dcStart(dcNewRun({region:bs.region, hab:bs.hab, team:st.team, endless:DC_MODE === "endless"}));
};
ACTIONS.dcload = () => {
  const st = dcState();
  if(!st.saved) return;
  try { dcStart(dcRestore(st.saved)); } catch(e){ st.saved = null; save(); toast("Sauvegarde illisible", "bad", "cross"); refresh(); }
};

/* ---------- succès ---------- */
ACHIEVEMENTS.push(
  {id:"dc_first", n:"Premiers pas sous terre", d:"Atteindre le troisième étage de la Descente.",
   chk:s=>(s.descente && s.descente.bestFloor || 0) >= 3, rw:{cores:2}},
  {id:"dc_win",   n:"Gardien des profondeurs", d:"Vaincre le gardien au fond de la Descente.",
   chk:s=>(s.descente && s.descente.wins || 0) >= 1, rw:{cores:4}},
  {id:"dc_recruit", n:"Recruteur", d:"Recruter dix Pokémon dans la Descente.",
   chk:s=>(s.descente && s.descente.recruits || 0) >= 10, rw:{coins:4000}}
);

/* les terrains, dessines a chaque image : ils changent pendant la partie */
function dcDrawTerrain(D, x, X, Y, camX, camY, now){
  const x0 = Math.max(0, Math.floor(camX / DC_TS) - 1), y0 = Math.max(0, Math.floor(camY / DC_TS) - 1);
  const x1 = Math.min(DC_W, x0 + Math.ceil(D.W / DC_TS) + 3), y1 = Math.min(DC_H, y0 + Math.ceil(D.H / DC_TS) + 3);
  const T = D.terrainT || {};
  for(let ty = y0; ty < y1; ty++) for(let tx = x0; tx < x1; tx++){
    const i = dcIdx(tx, ty), t = D.tiles[i];
    if(t <= T_STAIRS || !D.seen[i]) continue;
    const px = X(tx), py = Y(ty), s = DC_TS;
    if(t === T_WATER){ x.fillStyle = "#1f5f8f"; x.fillRect(px, py, s, s);
      x.strokeStyle = "rgba(190,240,255,.35)"; x.lineWidth = 1.5; const w = Math.sin(now / 400 + tx + ty * 0.7) * 4;
      x.beginPath(); x.moveTo(px + 6, py + s / 2 + w); x.quadraticCurveTo(px + s / 2, py + s / 2 - 4 + w, px + s - 6, py + s / 2 + w); x.stroke(); }
    else if(t === T_GRASS){ x.fillStyle = "#3f7a34"; x.fillRect(px, py, s, s); x.strokeStyle = "#7fc25a"; x.lineWidth = 2;
      for(let k = 0; k < 4; k++){ const bx = px + 6 + k * 8, sw = Math.sin(now / 500 + k + tx) * 2; x.beginPath(); x.moveTo(bx, py + s - 6); x.lineTo(bx + sw, py + 12); x.stroke(); } }
    else if(t === T_LAVA){ const g = 0.75 + Math.sin(now / 300 + tx * 0.9 + ty) * 0.25;
      x.fillStyle = `rgb(${200 + 50 * g | 0},${80 + 60 * g | 0},30)`; x.fillRect(px, py, s, s);
      x.fillStyle = "rgba(60,15,5,.5)"; x.fillRect(px + 8, py + 10, 8, 6); x.fillRect(px + 22, py + 22, 7, 5); }
    else if(t === T_ICE){ x.fillStyle = "#cfefff"; x.fillRect(px, py, s, s); x.strokeStyle = "#ffffff"; x.lineWidth = 1;
      x.beginPath(); x.moveTo(px + 6, py + 8); x.lineTo(px + s - 8, py + s - 10); x.moveTo(px + s - 10, py + 6); x.lineTo(px + 12, py + s - 8); x.stroke(); }
    else if(t === T_ASH){ x.fillStyle = "#3a3634"; x.fillRect(px, py, s, s); x.fillStyle = "rgba(120,110,100,.5)"; x.fillRect(px + 10, py + 12, 4, 3); x.fillRect(px + 24, py + 20, 3, 3); }
    else if(t === T_ROCK){ x.fillStyle = "#4a403a"; x.fillRect(px, py, s, s); x.strokeStyle = "rgba(0,0,0,.4)"; x.strokeRect(px + 4, py + 4, s - 8, s - 8); }
    else if(t === T_CORR){ x.fillStyle = `rgba(160,20,80,${0.55 + Math.sin(now / 200 + tx) * 0.15})`; x.fillRect(px, py, s, s);
      x.fillStyle = "rgba(255,61,127,.6)"; if(((tx * 7 + ty * 3 + (now / 150 | 0)) % 5) === 0) x.fillRect(px + 8, py + 8, s - 16, 4); }
    else if(t === T_SPIKE){ x.fillStyle = "#6a5a6a"; for(let k = 0; k < 3; k++){ x.beginPath(); x.moveTo(px + 8 + k * 9, py + s - 10); x.lineTo(px + 12 + k * 9, py + 12); x.lineTo(px + 16 + k * 9, py + s - 10); x.fill(); } }
    else if(t === T_SPRING){ x.fillStyle = D.springUsed ? "#2a4a5a" : "#4fdcff"; x.beginPath(); x.ellipse(px + s / 2, py + s / 2, s * 0.42, s * 0.3, 0, 0, 7); x.fill();
      if(!D.springUsed){ x.fillStyle = "rgba(255,255,255,.8)"; x.fillRect(px + s / 2 - 2, py + s / 2 - 10 - Math.sin(now / 200) * 3, 4, 8); } }
    else if(t === T_SHOP){ x.fillStyle = "#2a8a5a"; x.fillRect(px + 3, py + 8, s - 6, s - 12); x.fillStyle = "#ffd24a"; x.fillRect(px + 3, py + 8, s - 6, 5);
      x.fillStyle = "#fff"; x.font = "bold 14px ui-monospace,monospace"; x.textAlign = "center"; x.fillText("₽", px + s / 2, py + s - 9); }
    /* les herbes en feu */
    if(T[i] < 0){ x.globalCompositeOperation = "lighter";
      for(let k = 0; k < 4; k++){ x.fillStyle = k % 2 ? "rgba(255,120,40,.7)" : "rgba(255,210,80,.6)";
        x.beginPath(); x.arc(px + 8 + Math.random() * (s - 16), py + s - 8 - Math.random() * 22, 4 + Math.random() * 5, 0, 7); x.fill(); }
      x.globalCompositeOperation = "source-over"; }
  }
}
function dcDrawPylon(x, D, e, sx, sy, now, X, Y){
  const b = D.ents.find(o=>o.uid === D.boss && o.hp > 0);
  if(b){ x.strokeStyle = `rgba(255,61,127,${0.5 + Math.sin(now / 90) * 0.25})`; x.lineWidth = 2; x.setLineDash([5, 5]);
    x.beginPath(); x.moveTo(sx, sy - 34); x.lineTo(X(b.px) + DC_TS / 2, Y(b.py) + DC_TS / 2); x.stroke(); x.setLineDash([]); }
  const p = 1 + Math.sin(now / 250 + sx) * 0.06;
  x.fillStyle = "#2a0a2e"; x.beginPath(); x.moveTo(sx, sy - 44 * p); x.lineTo(sx + 13, sy - 10); x.lineTo(sx, sy + 4); x.lineTo(sx - 13, sy - 10); x.closePath(); x.fill();
  x.strokeStyle = "#ff3d7f"; x.lineWidth = 2; x.stroke();
  x.fillStyle = "#35f0d6"; x.beginPath(); x.moveTo(sx, sy - 34 * p); x.lineTo(sx + 5, sy - 14); x.lineTo(sx, sy - 6); x.lineTo(sx - 5, sy - 14); x.closePath(); x.fill();
  x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(sx - 16, sy + 8, 32, 4);
  x.fillStyle = "#ff3d7f"; x.fillRect(sx - 16, sy + 8, 32 * Math.max(0, e.shownHp) / e.maxHp, 4);
}

ACTIONS.dcmode = d => {
  if(d.m === "endless" && !dcEndlessOpen()){ toast("Vainquez d'abord un gardien de la Descente", "bad", "lock"); return; }
  DC_MODE = d.m; refresh();
};

/* ============================================================
   LIVRAISON 4 — LA DESCENTE REMPLACE L'EXPÉDITION ET LA TOUR
   Son propre écran, à la place de l'Expédition dans le hub, avec
   les mêmes conditions d'ouverture. Les anciens écrans y mènent.
   ============================================================ */
SCREENS.descente = {
  html(){
    dcMigrateLegacy();
    return `<div class="br-hero" style="--hc:#c9a6ff">
        <div class="br-title" style="color:#c9a6ff">LA DESCENTE</div>
        <div class="br-sub">Un donjon au tour par tour. Choisissez vos portes, recrutez, équipez, et affrontez le gardien.</div>
      </div>
      ${dcLobbyHtml()}`;
  }
};
/* l'Expedition et la Tour ont repris leur place : la Descente n'est plus proposee. */
/* une Expedition ou une ascension de la Tour en cours : on la clot proprement, une seule fois.
   Les survivants gardent un niveau, et le joueur est prevenu. */
function dcMigrateLegacy(){
  return;                                     /* plus de migration : les anciens modes sont revenus */
  if(S.flags.dcMigrated) return;
  S.flags.dcMigrated = true;
  let msg = false;
  if(S.expedition && S.expedition.team){
    for(const m of S.expedition.team) if(m.hp > 0 && S.dex[m.id]) S.dex[m.id].lvl = Math.min(100, S.dex[m.id].lvl + 1);
    S.expedition = null; msg = true;
  }
  if(S.towerRun){ S.towerRun = null; msg = true; }
  save();
  if(msg) setTimeout(()=>toast("L'Expédition et la Tour ont laissé place à la Descente. Votre parcours en cours est clos ; ses survivants gardent un niveau.", "warn", "star"), 400);
}

/* ---------- premiers pas : quelques conseils, une seule fois ---------- */
function dcTip(D, k, txt){
  S.flags.dcTips = S.flags.dcTips || {};
  if(S.flags.dcTips[k]) return;
  S.flags.dcTips[k] = true; saveSoon();
  dcSay("pz", txt);
}
function dcTips(D){
  const L = dcLeader(D); if(!L) return;
  if(D.turn === 0) dcTip(D, "move", "Touchez une case pour y aller. Chaque pas est un tour : les ennemis bougent quand vous bougez.");
  else if(D.ents.some(o=>o.side === "foe" && o.hp > 0 && dcVisible(D, o.x, o.y))) dcTip(D, "moves", "Un ennemi ! Gardez le doigt sur une capacité pour voir les cases touchées, relâchez pour lancer.");
  else if(D.bag.length > 2) dcTip(D, "bag", "Le Sac contient vos objets : soignez, révélez l'étage, équipez un objet tenu.");
  if(D.tiles.some(t=>t === T_WATER || t === T_GRASS || t === T_LAVA) && D.turn > 8) dcTip(D, "terrain", "Le terrain réagit aux types : la glace gèle l'eau, le feu embrase les herbes, la foudre court dans l'eau.");
}

/* ---------- les sons et les vibrations de la Descente ---------- */
function dcFeedback(D){
  let crit = false, ko = false, allyHurt = false, lvl = false;
  for(const f of D.fx){
    if(f.k === "hit"){ if(f.crit || f.eff >= 2) crit = true; if(f.e.side === "ally" && f.dmg) allyHurt = true; }
    if(f.k === "ko") ko = true;
  }
  for(const l of D.log.slice(-6)) if(/monte au niveau|évolue/.test(l.txt)) lvl = true;
  try {
    if(lvl && D.turn !== D._lvlTurn){ D._lvlTurn = D.turn; Sfx.win(); }
    else if(ko) Sfx.caught ? Sfx.caught() : Sfx.coin();
    else if(crit) Sfx.hit ? Sfx.hit() : Sfx.click();
    else if(D.fx.some(f=>f.k === "move")) Sfx.click();
    if(allyHurt) buzz(12);
    if(crit) buzz([8, 20, 8]);
  } catch(e){}
}
