/* ============================================================
   40b — LE SÉLECTEUR DE POKÉMON
   Utilisé partout où l'on compose une équipe : Mon équipe, la Tour,
   l'Expédition, les Data Guardians, la Brèche.

   Ce qu'il faisait mal : des flèches pour l'ordre, aucun glisser-
   déposer, et chaque toucher redessinait toute la feuille — on
   perdait sa place dans la liste.

   Désormais :
   · les emplacements restent collés en haut, toujours visibles ;
   · GLISSER un Pokémon de la box sur un emplacement le place (celui
     qui l'occupait retourne dans la box) ; glisser un emplacement
     sur un autre les échange ; le glisser vers la box le retire ;
   · TOUCHER un Pokémon de la box l'ajoute (ou le retire s'il est
     déjà dans l'équipe) ; toucher un emplacement le « vise » : le
     prochain Pokémon touché prendra sa place ; la croix le retire ;
   · rien n'est redessiné en entier : seuls les emplacements et les
     marques de la box changent, la liste ne bouge pas.
   Sur écran tactile, on saisit un Pokémon de la box par un appui
   un peu long (le défilement reste libre) ; les emplacements se
   saisissent tout de suite.
   ============================================================ */

let PP = null;

function ppPower(id){ return typeof monPower === "function" ? monPower(id) : Math.round(POKE[id].bst * (1 + S.dex[id].lvl / 50)); }
const PP_SORTS = [["power", "Puissance"], ["level", "Niveau"], ["stars", "Étoiles"], ["num", "N°"], ["name", "Nom"]];
function ppPool(){
  const q = (PP.q || "").trim().toLowerCase();
  let ids = Object.keys(S.dex).map(Number).filter(id=>POKE[id] && (!PP.filter || PP.filter(id)));
  if(q) ids = ids.filter(id=>POKE[id].name.toLowerCase().includes(q) || String(id).padStart(3, "0").includes(q));
  if(PP.type) ids = ids.filter(id=>POKE[id].types.includes(PP.type));
  const st = id => typeof starsOf === "function" ? starsOf(id) : 0;
  const so = {
    power:(a, b)=>ppPower(b) - ppPower(a),
    level:(a, b)=>S.dex[b].lvl - S.dex[a].lvl || ppPower(b) - ppPower(a),
    stars:(a, b)=>st(b) - st(a) || ppPower(b) - ppPower(a),
    num:(a, b)=>a - b,
    name:(a, b)=>POKE[a].name.localeCompare(POKE[b].name)
  }[PP.sort] || ((a, b)=>ppPower(b) - ppPower(a));
  return ids.sort(so);
}

/* ---------- montage ---------- */
/* cfg : {max, sel, leader (le premier a un rôle), leadLabel, filter(id), onChange(sel), hint} */
function ppMount(host, cfg){
  if(!host) return;
  PP = Object.assign({q:"", sort:"power", type:0, armed:null, drag:null, show:120}, PP && PP.keep ? {q:PP.q, sort:PP.sort, type:PP.type} : {}, cfg);
  PP.sel = (cfg.sel || []).filter(id=>S.dex[id]).slice(0, cfg.max);
  PP.host = host;
  host.innerHTML = `<div class="pp">
    <div class="pp-top" id="pp-top">
      <div class="pp-slots c${PP.max}" id="pp-slots"></div>
      <div class="pp-hint" id="pp-hint"></div>
    </div>
    <div class="pp-tools">
      <input id="pp-q" type="text" placeholder="Rechercher…" value="${esc(PP.q)}" autocomplete="off">
      <div class="pp-sorts">${PP_SORTS.map(([k, n])=>`<button class="chip ${PP.sort === k ? "on" : ""}" data-ppsort="${k}">${n}</button>`).join("")}</div>
      <div class="pp-types">${Object.keys(TYPE_NAMES).map(t=>`<button class="pp-ty ${PP.type == t ? "on" : ""}" data-pptype="${t}" title="${esc(TYPE_NAMES[t])}"><i class="tt t${t}">${esc(TYPE_NAMES[t].slice(0, 3))}</i></button>`).join("")}</div>
    </div>
    <div class="pp-box" id="pp-box" data-ppbox="1"></div>
  </div>`;
  ppSlots(); ppBox();
  ppBind(host);
}
function ppEmit(){
  ppSlots(); ppMark();
  if(PP.onChange) try { PP.onChange(PP.sel.slice()); } catch(e){}
}
function ppSlots(){
  const el = document.getElementById("pp-slots"); if(!el || !PP) return;
  el.innerHTML = Array.from({length:PP.max}, (_, i)=>{
    const id = PP.sel[i], armed = PP.armed === i;
    if(!id) return `<div class="pp-slot empty ${armed ? "armed" : ""}" data-ppslot="${i}"><span class="pp-n">${PP.leader && i === 0 ? "♛" : i + 1}</span><span class="pp-plus">+</span></div>`;
    const e = S.dex[id];
    return `<div class="pp-slot ${PP.leader && i === 0 ? "lead" : ""} ${armed ? "armed" : ""}" data-ppslot="${i}">
      <span class="pp-n">${PP.leader && i === 0 ? "♛" : i + 1}</span>
      <i class="pp-x" data-ppx="${i}" aria-label="Retirer">×</i>
      <span class="pp-spr">${sprite(id, e.shiny, "")}</span>
      <b>${esc(POKE[id].name)}</b>
      <small>N.${e.lvl}${typeof starsOf === "function" ? ` · ${"★".repeat(starsOf(id))}` : ""}</small>
    </div>`;
  }).join("");
  const h = document.getElementById("pp-hint");
  if(h) h.innerHTML = PP.armed !== null
    ? `<b>Emplacement ${PP.armed + 1}</b> : touche le Pokémon qui prend cette place. <span class="pp-cancel" data-ppdisarm="1">Annuler</span>`
    : (PP.hint || `Glisse pour changer l'ordre ou remplacer · touche un Pokémon pour l'ajouter ou le retirer${PP.leader && PP.leadLabel ? ` · ♛ ${esc(PP.leadLabel)}` : ""}`);
}
function ppBox(){
  const el = document.getElementById("pp-box"); if(!el || !PP) return;
  const pool = ppPool();
  PP.poolLen = pool.length;
  el.innerHTML = pool.length ? pool.slice(0, PP.show).map(id=>{
    const e = S.dex[id];
    return `<div class="pp-cell r${POKE[id].rar}" data-ppid="${id}">
      <span class="pp-lv">${e.lvl}</span>
      <span class="pp-k"></span>
      <span class="pp-spr">${sprite(id, e.shiny, "")}</span>
      <span class="pp-nm">${esc(POKE[id].name)}</span>
      <span class="pp-td">${POKE[id].types.map(t=>`<i class="tt t${t}"></i>`).join("")}</span>
    </div>`; }).join("") + (pool.length > PP.show ? `<button class="btn ghost wide pp-more" data-ppmore="1">Voir ${Math.min(120, pool.length - PP.show)} de plus (${pool.length - PP.show} restants)</button>` : "")
    : `<div class="empty">Aucun Pokémon ne correspond.</div>`;
  ppMark();
}
/* seules les marques changent : la box ne bouge pas */
function ppMark(){
  const el = document.getElementById("pp-box"); if(!el || !PP) return;
  const full = PP.sel.length >= PP.max;
  el.querySelectorAll(".pp-cell").forEach(c=>{
    const id = +c.dataset.ppid, k = PP.sel.indexOf(id);
    c.classList.toggle("picked", k >= 0);
    c.classList.toggle("dim", k < 0 && full && PP.armed === null);
    const b = c.querySelector(".pp-k"); if(b) b.textContent = k < 0 ? "" : (PP.leader && k === 0 ? "♛" : String(k + 1));
  });
}

/* ---------- les opérations ---------- */
function ppPlace(id, slot){
  const sel = PP.sel.slice(), cur = sel.indexOf(id);
  if(slot === undefined || slot === null){ if(cur < 0 && sel.length < PP.max) sel.push(id); }
  else if(cur >= 0){
    /* déjà dans l'équipe : on échange les deux places */
    const j = Math.min(slot, sel.length - 1);
    [sel[cur], sel[j]] = [sel[j], sel[cur]];
  } else if(slot < sel.length) sel[slot] = id;
  else if(sel.length < PP.max) sel.push(id);
  PP.sel = sel; PP.armed = null;
  ppEmit(); ppPop(id);
}
function ppRemove(i){ if(PP.sel[i] === undefined) return; PP.sel.splice(i, 1); PP.armed = null; ppEmit(); }
function ppSwap(i, j){
  const sel = PP.sel; if(sel[i] === undefined) return;
  j = Math.min(j, sel.length - 1);
  if(i === j) return;
  [sel[i], sel[j]] = [sel[j], sel[i]];
  ppEmit(); ppPop(sel[j]);
}
function ppPop(id){
  const k = PP.sel.indexOf(id); if(k < 0) return;
  const s = document.querySelector(`#pp-slots [data-ppslot="${k}"]`);
  if(s){ s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); }
  if(typeof buzz === "function") buzz(8);
}
function ppFull(){
  const t = document.getElementById("pp-slots");
  if(t){ t.classList.remove("shake"); void t.offsetWidth; t.classList.add("shake"); }
  toast("Équipe complète : glisse-le sur un emplacement, ou touche d'abord l'emplacement à remplacer", "", "eye");
}
function ppTapCell(id){
  if(PP.armed !== null){ ppPlace(id, PP.armed); return; }
  const k = PP.sel.indexOf(id);
  if(k >= 0){ ppRemove(k); return; }
  if(PP.sel.length >= PP.max){ ppFull(); return; }
  ppPlace(id);
}
function ppTapSlot(i){
  PP.armed = PP.armed === i ? null : i;
  ppSlots(); ppMark();
}

/* ---------- le glisser-déposer (souris et tactile) ---------- */
function ppBind(host){
  host.addEventListener("pointerdown", ppDown);
  host.addEventListener("click", ppClick);
  const q = host.querySelector("#pp-q");
  if(q) q.addEventListener("input", ()=>{ PP.q = q.value; clearTimeout(PP._qt); PP._qt = setTimeout(()=>{ PP.show = 120; ppBox(); }, 160); });
}
/* les touches sans glisser : boutons de tri, types, croix, « voir plus » */
function ppClick(e){
  if(!PP) return;
  const t = e.target;
  const so = t.closest("[data-ppsort]"), ty = t.closest("[data-pptype]"), mo = t.closest("[data-ppmore]"), da = t.closest("[data-ppdisarm]");
  if(so){ PP.sort = so.dataset.ppsort; PP.host.querySelectorAll("[data-ppsort]").forEach(b=>b.classList.toggle("on", b === so)); ppBox(); return; }
  if(ty){ const v = +ty.dataset.pptype; PP.type = PP.type === v ? 0 : v; PP.host.querySelectorAll("[data-pptype]").forEach(b=>b.classList.toggle("on", +b.dataset.pptype === PP.type)); ppBox(); return; }
  if(mo){ PP.show += 120; ppBox(); return; }
  if(da){ PP.armed = null; ppSlots(); ppMark(); return; }
}
const PP_LONG = 230;
function ppDown(e){
  if(!PP || e.button > 0) return;
  const x = e.target.closest("[data-ppx]");
  if(x){ e.preventDefault(); ppRemove(+x.dataset.ppx); return; }
  const cell = e.target.closest("[data-ppid]"), slot = e.target.closest(".pp-slot[data-ppslot]");
  if(!cell && !slot) return;
  const src = slot ? {kind:"slot", i:+slot.dataset.ppslot, id:PP.sel[+slot.dataset.ppslot], el:slot} : {kind:"cell", id:+cell.dataset.ppid, el:cell};
  if(src.kind === "slot" && !src.id){ /* un emplacement vide : on le vise, c'est tout */
    const up = () => { document.removeEventListener("pointerup", up); ppTapSlot(src.i); };
    document.addEventListener("pointerup", up); return;
  }
  const touch = e.pointerType !== "mouse";
  const D = PP.drag = {src, x0:e.clientX, y0:e.clientY, x:e.clientX, y:e.clientY, on:false, dead:false, pid:e.pointerId};
  /* tactile, dans la box : il faut un appui un peu long, sinon c'est un défilement */
  if(touch && src.kind === "cell") D.timer = setTimeout(()=>{ if(PP && PP.drag === D && !D.dead) ppStartDrag(D); }, PP_LONG);
  if(touch && src.kind === "slot") D.timer = setTimeout(()=>{ if(PP && PP.drag === D && !D.dead) ppStartDrag(D); }, 120);
  document.addEventListener("pointermove", ppMove, {passive:false});
  document.addEventListener("pointerup", ppUp);
  document.addEventListener("pointercancel", ppCancel);
  document.addEventListener("touchmove", ppTouchBlock, {passive:false});
}
function ppTouchBlock(e){ if(PP && PP.drag && PP.drag.on) e.preventDefault(); }
function ppMove(e){
  const D = PP && PP.drag; if(!D || e.pointerId !== D.pid) return;
  D.x = e.clientX; D.y = e.clientY;
  const dist = Math.hypot(D.x - D.x0, D.y - D.y0);
  if(!D.on){
    if(e.pointerType === "mouse" && dist > 5) ppStartDrag(D);
    else if(e.pointerType !== "mouse" && dist > 9){
      /* le doigt a bougé avant l'appui long : c'est un défilement (sauf sur les emplacements) */
      if(D.src.kind === "slot") ppStartDrag(D); else { D.dead = true; clearTimeout(D.timer); }
    }
    if(!D.on) return;
  }
  e.preventDefault();
  ppGhostMove(D);
  ppHover(D);
  ppAutoScroll(D);
}
function ppStartDrag(D){
  /* l'appui long et le mouvement peuvent tous deux lancer la prise : une seule fois */
  if(D.on || D.dead) return;
  clearTimeout(D.timer);
  ppGhostsClear();
  D.on = true;
  const g = document.createElement("div");
  g.className = "pp-ghost";
  g.innerHTML = sprite(D.src.id, S.dex[D.src.id] && S.dex[D.src.id].shiny, "");
  document.body.appendChild(g);
  D.ghost = g;
  D.src.el.classList.add("lifted");
  PP.host.classList.add("dragging");
  if(typeof buzz === "function") buzz(12);
  ppGhostMove(D); ppHover(D);
}
function ppGhostMove(D){ if(D.ghost) D.ghost.style.transform = `translate(${D.x - 32}px, ${D.y - 40}px)`; }
function ppTargetAt(D){
  const el = document.elementFromPoint(D.x, D.y);
  if(!el) return null;
  const s = el.closest && el.closest("#pp-slots .pp-slot[data-ppslot]");
  if(s) return {kind:"slot", i:+s.dataset.ppslot, el:s};
  const b = el.closest && el.closest("[data-ppbox]");
  if(b) return {kind:"box", el:b};
  return null;
}
function ppHover(D){
  const t = ppTargetAt(D);
  PP.host.querySelectorAll(".pp-slot.over").forEach(s=>{ if(!t || s !== t.el) s.classList.remove("over"); });
  const box = document.getElementById("pp-box");
  if(box) box.classList.toggle("over", !!(t && t.kind === "box" && D.src.kind === "slot"));
  if(t && t.kind === "slot") t.el.classList.add("over");
}
/* près du bord de la zone qui défile, la liste suit le doigt */
function ppAutoScroll(D){
  const sc = PP.host.closest(".sheet") || document.getElementById("screen");
  if(!sc) return;
  const r = sc.getBoundingClientRect(), edge = 60;
  cancelAnimationFrame(D.raf);
  const v = D.y > r.bottom - edge ? (D.y - (r.bottom - edge)) / 4 : D.y < r.top + edge ? -((r.top + edge) - D.y) / 4 : 0;
  if(!v) return;
  const step = () => { if(!PP || PP.drag !== D || !D.on) return; sc.scrollTop += v; ppHover(D); D.raf = requestAnimationFrame(step); };
  D.raf = requestAnimationFrame(step);
}
function ppEnd(){
  const D = PP && PP.drag; if(!D) return null;
  clearTimeout(D.timer); cancelAnimationFrame(D.raf);
  if(D.ghost) D.ghost.remove();
  ppGhostsClear();
  D.src.el && D.src.el.classList.remove("lifted");
  if(PP.host){ PP.host.classList.remove("dragging"); PP.host.querySelectorAll(".pp-slot.over").forEach(s=>s.classList.remove("over")); }
  const box = document.getElementById("pp-box"); if(box) box.classList.remove("over");
  document.removeEventListener("pointermove", ppMove);
  document.removeEventListener("pointerup", ppUp);
  document.removeEventListener("pointercancel", ppCancel);
  document.removeEventListener("touchmove", ppTouchBlock);
  PP.drag = null;
  return D;
}
function ppCancel(){ ppEnd(); }
/* aucun fantôme ne doit survivre à la prise, ni à un changement d'écran */
function ppGhostsClear(){ try { document.querySelectorAll(".pp-ghost").forEach(g=>g.remove()); } catch(e){} }
function ppUp(e){
  const D = PP && PP.drag; if(!D || e.pointerId !== D.pid) return;
  D.x = e.clientX; D.y = e.clientY;
  const t = D.on ? ppTargetAt(D) : null;
  ppEnd();
  if(!D.on){
    if(D.dead) return;
    /* un simple toucher */
    if(D.src.kind === "cell") ppTapCell(D.src.id); else ppTapSlot(D.src.i);
    return;
  }
  if(D.src.kind === "cell"){
    if(t && t.kind === "slot") ppPlace(D.src.id, t.i);
  } else {
    if(t && t.kind === "slot") ppSwap(D.src.i, t.i);
    else if(t && t.kind === "box") ppRemove(D.src.i);
  }
}

/* ============================================================
   LA FEUILLE « COMPOSER UNE ÉQUIPE »
   Même appel qu'avant : teamPicker(titre, max, onConfirm, preset).
   ============================================================ */
let TP = null;
function teamPicker(title, max, onConfirm, preset, opts){
  opts = opts || {};
  TP = {max, title, onConfirm};
  sheet(`${sheetHead(title)}
    <div id="pp-host"></div>
    <div class="pp-ok"><button class="btn pri wide" id="pp-ok" data-act="tconfirm">Valider</button></div>`);
  const host = document.getElementById("pp-host");
  const sh = host && host.closest(".sheet"); if(sh) sh.classList.add("tall");
  ppMount(host, {max, sel:(preset || S.team.slice(0, max)), leader:max > 1, leadLabel:opts.leadLabel || "le premier entre en jeu, les autres prennent le relais",
    filter:opts.filter, keep:true, onChange:ppOkLabel});
  ppOkLabel();
}
function ppOkLabel(){
  const b = document.getElementById("pp-ok"); if(!b || !PP) return;
  b.textContent = `Valider (${PP.sel.length}/${PP.max})`;
  b.disabled = !PP.sel.length;
}
ACTIONS.tconfirm = () => {
  if(!TP || !PP) return;
  const sel = PP.sel.slice(), cb = TP.onConfirm;
  TP = null;
  closeSheet();
  /* une équipe de six reste l'équipe du joueur ; une sélection plus courte ne l'écrase pas */
  if(sel.length >= Math.min(6, (S.team || []).length) && PP.max >= 6) S.team = sel.slice();
  saveSoon();
  cb(sel);
};

/* ============================================================
   UNE LISTE QU'ON RÉORDONNE AU DOIGT
   Pour l'ordre de l'équipe en pleine Expédition : on saisit une
   ligne par sa poignée, on la lâche où l'on veut.
   ============================================================ */
function sortableList(listEl, onMove){
  if(!listEl) return;
  listEl.addEventListener("pointerdown", e=>{
    const h = e.target.closest("[data-grip]"); if(!h) return;
    const row = h.closest("[data-row]"); if(!row) return;
    e.preventDefault();
    const rows = () => [...listEl.querySelectorAll("[data-row]")];
    const from = rows().indexOf(row), y0 = e.clientY, H = row.getBoundingClientRect().height + 5;
    row.classList.add("lifted");
    let to = from;
    const block = ev => ev.preventDefault();
    document.addEventListener("touchmove", block, {passive:false});
    const mv = ev => {
      const dy = ev.clientY - y0;
      row.style.transform = `translateY(${dy}px)`;
      to = clamp(from + Math.round(dy / H), 0, rows().length - 1);
      rows().forEach((r, k)=>{ if(r === row) return; const shift = from < to ? (k > from && k <= to ? -H : 0) : (k < from && k >= to ? H : 0); r.style.transform = shift ? `translateY(${shift}px)` : ""; });
    };
    const up = () => {
      document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
      document.removeEventListener("touchmove", block);
      rows().forEach(r=>{ r.style.transform = ""; r.classList.remove("lifted"); });
      if(to !== from) onMove(from, to);
    };
    document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
    if(typeof buzz === "function") buzz(10);
  });
}
