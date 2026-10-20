/* ============================================================
   62 — POKÉ-POKER · LA TABLE
   La refonte graphique : une salle de jeux de la couche, néons et tapis.
     · l'ADVERSAIRE en haut, portrait et « PV » : l'objectif est la vie
       du dresseur, chaque main la fait fondre comme dans un combat ;
     · les PROGRAMMES en cartes, sur une étagère ; ils sursautent quand
       ils agissent, dorment sous Poudre Dodo, montrent leur évolution ;
     · les CARTES : de vraies cartes Pokémon, cadre aux couleurs du type,
       numéro du Pokédex, Jetons en médaillon, feuille holographique pour
       les chromatiques ; la main s'ouvre en éventail, se distribue ;
     · la RÉSOLUTION : les cartes jouées montent sur le tapis, chacune
       sursaute et lâche ses Jetons, les programmes s'allument, Jetons et
       Mult s'enflamment, puis le total frappe l'adversaire ;
     · la VICTOIRE : le dresseur est K.O., sa réplique, et les Octets
       qui tombent ligne par ligne ; la DÉFAITE a sa scène aussi ;
     · la CACHE : des boosters qu'on ouvre (le paquet se déchire, les
       cartes se retournent), des programmes en vitrine.
   ============================================================ */

/* ---------- les cartes ---------- */
/* les couleurs des types, celles des cartes à collectionner */
const PK_TCOL = {1:"#a8a77a", 2:"#c22e28", 3:"#a98ff3", 4:"#a33ea1", 5:"#e2bf65", 6:"#b6a136", 7:"#a6b91a", 8:"#735797", 9:"#b7b7ce",
  10:"#ee8130", 11:"#6390f0", 12:"#7ac74c", 13:"#f7d02c", 14:"#f95587", 15:"#96d9d6", 16:"#6f35fc", 17:"#705746", 18:"#d685ad"};
function pkTypeCol(t){ return PK_TCOL[t] || "#8ea3bd"; }
function pkCardHtml(c, selected, attrs, big, extraCls){
  const p = POKE[c.id], t = p.types[0], t2 = p.types[1];
  const ed = c.ed || c.e || "";
  const st = stageOf(c.id);
  if(c.fd) return `<div class="pkc fd ${big ? "big" : ""} ${extraCls || ""}" ${attrs || ""}><div class="pkc-back"><i></i></div></div>`;
  return `<div class="pkc ${selected ? "sel" : ""} ${ed} ${c.shiny ? "shy" : ""} ${c.rb ? "rb" : ""} ${c.par ? "par" : ""} ${big ? "big" : ""} ${extraCls || ""}"
      style="--tc:${pkTypeCol(t)};--tc2:${pkTypeCol(t2 || t)}" ${attrs || ""}>
    <div class="pkc-in">
      <div class="pkc-hd"><span class="pkc-nm">${esc(p.name)}</span></div>
      <div class="pkc-art"><span class="sprbox">${sprite(c.id, c.shiny, "")}</span></div>
      <div class="pkc-ft"><span class="pkc-no">#${String(c.id).padStart(3, "0")}</span>
        <span class="pkc-st">${st ? "●".repeat(st) : ""}</span><span class="pkc-ty">${TYPE_NAMES[t].slice(0, 3)}</span>${t2 ? `<span class="pkc-ty b">${TYPE_NAMES[t2].slice(0, 3)}</span>` : ""}</div>
      <span class="pkc-ch">${cardChips(c)}</span>
      ${c.shiny ? `<i class="pkc-holo"></i><i class="pkc-spark"></i>` : ""}
      ${ed === "gold" ? `<i class="pkc-gold"></i>` : ed === "glass" ? `<i class="pkc-glass"></i>` : ed === "corrupt" ? `<i class="pkc-corr"></i>` : ""}
      ${c.rb ? `<span class="pkc-rb" title="Arc-en-ciel : copie l'espèce qui complète la main">◇</span>` : ""}
    </div>
    ${c.par ? `<span class="pkc-para">⚡</span>` : ""}
  </div>`;
}
/* le dos des cartes : le deck, les boosters */
function pkBackHtml(cls){ return `<div class="pkc back ${cls || ""}"><div class="pkc-back"><i></i></div></div>`; }

/* ---------- les programmes ---------- */
function pkJokerHtml(j, i, opts){
  opts = opts || {};
  const def = jokerDef(j); if(!def) return "";
  const P = S.poker, f = P && P.boss ? P.boss.f : {};
  const asleep = opts.live && f.sleep && i === 0;
  const evo = def.evo ? Math.min(1, (j.xp || 0) / def.evo.need) : 0;
  return `<div class="pkj r${def.rar} ${asleep ? "zz" : ""} ${def.evo ? "evo" : ""}" data-i="${i}" ${opts.act === false ? "" : `data-act="${opts.act || "pkjinfo"}"`}>
    <span class="pkj-art"><span class="sprbox">${sprite(def.spr, false, "")}</span></span>
    <span class="pkj-nm">${esc(def.n.split(" · ")[0].replace(".exe", ""))}</span>
    ${def.evo ? `<span class="pkj-evo"><i style="width:${Math.round(evo * 100)}%"></i></span>` : ""}
    ${asleep ? `<span class="pkj-z">Zzz</span>` : ""}
    <span class="pkj-rar">${"◆".repeat(def.rar + 1)}</span>
  </div>`;
}
function pkShelfHtml(P, live){
  const slots = jokerSlots(), cells = [];
  for(let i = 0; i < slots; i++) cells.push(P.jokers[i] ? pkJokerHtml(P.jokers[i], i, {live}) : `<div class="pkj empty"><span>+</span></div>`);
  return `<div id="jokers" class="pk2-shelf">${cells.join("")}</div>`;
}

/* ---------- l'adversaire ---------- */
function pkOppHtml(P){
  const o = pkOpp(P), T = P.target || 1, left = Math.max(0, T - P.score), pct = left / T * 100;
  const col = pct > 50 ? "#5ce07a" : pct > 20 ? "#ffd24a" : "#ff5470";
  return `<div class="pk2-opp ${o.boss ? "boss" : ""} k-${o.kind}" style="--oc:${pkTypeCol(o.type)}">
    <div class="pk2-port" id="pk2-port">${trainerArt(o.cls, 60)}</div>
    <div class="pk2-oinfo">
      <div class="pk2-oname"><small>${esc(o.title)}</small><b>${esc(o.name)}</b></div>
      <div class="pk2-hp"><span class="pk2-hpk">PV</span><div class="pk2-hpbar"><i id="pk2-hpfill" style="width:${pct}%;background:${col}"></i></div></div>
      <div class="pk2-hpn" id="pk2-hpn">${fmt(left)} <span>/ ${fmt(T)}</span></div>
    </div>
    <div class="pk2-side">
      <span class="pk2-oct">${ic("coin")}<b>${P.octets}</b></span>
      <button class="pk2-menu" data-act="pkmenu" aria-label="Menu">${ic("grid")}</button>
    </div>
  </div>
  ${P.boss ? `<div class="pk2-rule" data-act="pkrule"><b>${esc(P.boss.n)}</b><span>${esc(P.boss.d)}</span></div>` : ""}`;
}

/* ---------- le tapis : nom de la main, Jetons × Mult ---------- */
function pkScoreLineHtml(res){
  if(!res) return `<div class="pk2-hint">${ic("cards")}<span>Touchez jusqu'à cinq cartes</span></div>
    <div class="pk2-calc"><span class="pk2-chips">0</span><span class="pk2-x">×</span><span class="pk2-mult">0</span></div>`;
  const lv = (S.poker.levels && S.poker.levels[res.handKey]) || 0;
  const hot = res.total >= (S.poker.target - S.poker.score);
  return `<div class="pk2-hn">${esc(res.handName)}${lv ? ` <span class="pk2-lv">niv. ${lv + 1}</span>` : ""}</div>
    <div class="pk2-calc ${hot ? "hot" : ""}"><span class="pk2-chips">${fmt(res.chips)}</span><span class="pk2-x">×</span>
      <span class="pk2-mult">${res.mult.toFixed(res.mult % 1 ? 2 : 0)}</span></div>
    <div class="pk2-eq">= <b>${fmt(res.total)}</b>${hot ? ` <em>K.O. !</em>` : ""}</div>`;
}
/* la main en éventail */
function pkFanHtml(P, resolving){
  const shown = resolving ? (P.resolvePlayed || []) : [];
  const cards = P.hand.filter(c=>!shown.includes(c.u));
  const n = cards.length, fresh = P.fresh || [];
  let k = 0;
  return `<div id="hand" class="pk2-fan ${resolving ? "resolving" : ""}" style="--n:${n}">${cards.map((c, i)=>{
    const t = n > 1 ? i / (n - 1) : 0.5, rot = (t - 0.5) * Math.min(16, 3 + n * 1.6), dy = Math.pow((t - 0.5) * 2, 2) * 9;
    const deal = fresh.includes(c.u) ? ` deal" style="--d:${(k++) * 70}ms;` : `" style="`;
    return `<div class="pk2-slot${deal}--t:${t};--r:${rot.toFixed(1)}deg;--dy:${dy.toFixed(1)}px;--z:${i}">${pkCardHtml(c, P.sel.includes(c.u), `data-u="${c.u}"${resolving ? "" : ' data-act="pkcard"'}`)}</div>`;
  }).join("")}</div>`;
}
function pkRenderLive(){
  const P = S.poker;
  const res = P.sel.length ? pkScore(true) : null;
  const line = document.getElementById("pk-score-line");
  if(line) line.innerHTML = pkScoreLineHtml(res);
  document.querySelectorAll("#hand .pkc").forEach(el=>{
    const u = +el.dataset.u, c = P.hand.find(x=>x.u === u);
    el.classList.toggle("sel", P.sel.includes(u));
    /* une carte découverte (Prémonition) se retourne sous le doigt */
    if(c && !c.fd && el.classList.contains("fd")){ el.outerHTML = pkCardHtml(c, P.sel.includes(u), `data-u="${u}" data-act="pkcard"`); }
  });
  const pb = document.getElementById("pk-play"), db = document.getElementById("pk-disc");
  if(pb) pb.disabled = !P.sel.length || P.handsLeft <= 0;
  if(db) db.disabled = !P.sel.length || P.discardsLeft <= 0;
}
/* une carte refuse : elle tremble */
function pkNope(u, msg){
  try { const el = document.querySelector(`#hand .pkc[data-u="${u}"]`);
    if(el){ el.classList.remove("nope"); void el.offsetWidth; el.classList.add("nope"); } } catch(e){}
  try { Sfx.glitch(); buzz(20); } catch(e){}
  if(msg) toast(msg, "bad", "bolt");
}
ACTIONS.pksort = () => {
  const P = S.poker; if(!P) return;
  const order = ["fam", "type", "chips", "dex"];
  P.sort = order[(order.indexOf(P.sort || "fam") + 1) % order.length];
  pkSortHand(P); save(); refresh();
};
const PK_SORT_LABEL = {fam:"Famille", type:"Type", chips:"Valeur", dex:"N°"};
/* la défausse : les cartes s'envolent, puis la main se reforme */
ACTIONS.pkdiscard = () => {
  const P = S.poker;
  if(!P || P.state !== "play" || !P.sel.length || P.discardsLeft <= 0) return;
  P.sel.forEach(u=>{ const el = document.querySelector(`#hand .pkc[data-u="${u}"]`); if(el) el.parentNode.classList.add("toss"); });
  setTimeout(()=>pkDiscard(), 230);
};

/* ============================================================
   LA RÉSOLUTION ANIMÉE
   ============================================================ */
function stepResolve(){
  if(!RESOLVE) return;
  const st = RESOLVE.res.steps[RESOLVE.i];
  if(!st){ endResolveSteps(); return; }
  RESOLVE.i++;
  RESOLVE.chips = st.chips;
  RESOLVE.mult = st.mult;
  paintResolve(st);
  RESOLVE.timer = setTimeout(stepResolve, st.kind === "base" ? 520 : st.kind === "joker" ? 380 : 300);
}
function paintResolve(st){
  const line = document.getElementById("pk-score-line");
  if(line){
    const hot = RESOLVE.chips * RESOLVE.mult >= (S.poker.target - S.poker.score);
    line.innerHTML = `<div class="pk2-hn">${esc(RESOLVE.res.handName)}</div>
      <div class="pk2-calc ${hot ? "hot" : ""}"><span class="pk2-chips" id="pk-chips">${fmt(RESOLVE.chips)}</span><span class="pk2-x">×</span>
      <span class="pk2-mult" id="pk-mult">${RESOLVE.mult.toFixed(RESOLVE.mult % 1 ? 2 : 0)}</span></div>`;
    if(st.dc) pkBump(document.getElementById("pk-chips"));
    if(Math.abs(st.dm) > 0.001) pkBump(document.getElementById("pk-mult"));
  }
  let target = null;
  if(st.kind === "card") target = document.querySelector(`#pk2-stage .pkc[data-u="${st.ref}"]`);
  if(st.kind === "joker") target = document.querySelector(`#jokers .pkj[data-i="${st.ref}"]`);
  if(st.kind === "boss") target = document.querySelector(".pk2-rule") || document.getElementById("pk2-port");
  if(st.kind === "base"){ const hn = document.querySelector("#pk-score-line .pk2-hn"); if(hn) hn.classList.add("pop"); }
  if(target){
    target.classList.remove("trigger"); void target.offsetWidth; target.classList.add("trigger");
    floatDelta(target, st);
  }
  if(st.kind === "joker"){ Sfx.wobble(); buzz(8); }
  else if(st.kind === "boss"){ Sfx.glitch(); }
  else Sfx.click();
}
function pkBump(el){ if(!el) return; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
function floatDelta(target, st){
  const host = document.getElementById("poker-felt");
  if(!host) return;
  const parts = [];
  if(st.dc) parts.push({t:(st.dc > 0 ? "+" : "") + fmt(st.dc), c:"chips"});
  if(Math.abs(st.dm) > 0.001)
    parts.push(st.mulMode ? {t:"×" + (st.mult / Math.max(0.01, st.mult - st.dm)).toFixed(2), c:"xmult"}
                          : {t:(st.dm > 0 ? "+" : "") + st.dm.toFixed(st.dm % 1 ? 1 : 0) + " Mult", c:"mult"});
  if(st.kind === "boss" && !parts.length) parts.push({t:st.label, c:"boss"});
  if(!parts.length) return;
  const r = target.getBoundingClientRect(), h = host.getBoundingClientRect();
  parts.forEach((p, k)=>{
    const d = document.createElement("div");
    d.className = "pk2-delta " + p.c;
    d.textContent = p.t;
    d.style.left = (r.left - h.left + r.width / 2) + "px";
    d.style.top = (r.top - h.top + (st.kind === "joker" ? r.height : -4) + k * 16) + "px";
    host.appendChild(d);
    setTimeout(()=>d.remove(), 950);
  });
}
function endResolveSteps(){
  if(!RESOLVE || RESOLVE.done) return;
  RESOLVE.done = true;
  const P = S.poker, total = RESOLVE.res.total;
  const line = document.getElementById("pk-score-line");
  if(line){
    line.innerHTML = `<div class="pk2-total">${fmt(total)}</div>`;
    const el = line.firstElementChild; if(el) el.classList.add("burst");
  }
  const felt = document.getElementById("poker-felt");
  if(felt && total > 0){
    Sfx.win();
    burstEl(felt, {n:total > P.target * 0.4 ? 30 : 14, spread:120, colors:["#35f0d6", "#ffc857", "#ff3d7f", "#ffffff"], dur:900});
  }
  /* le total frappe l'adversaire : sa jauge de PV fond */
  const T = P.target || 1, left0 = Math.max(0, T - P.score), left1 = Math.max(0, T - P.score - total);
  const fill = document.getElementById("pk2-hpfill"), num = document.getElementById("pk2-hpn"), port = document.getElementById("pk2-port");
  setTimeout(()=>{
    if(fill){ const pct = left1 / T * 100; fill.style.width = pct + "%"; fill.style.background = pct > 50 ? "#5ce07a" : pct > 20 ? "#ffd24a" : "#ff5470"; }
    if(port){ port.classList.remove("hit"); void port.offsetWidth; port.classList.add(left1 <= 0 ? "ko" : "hit"); }
    if(num){
      const t0 = performance.now(), dur = 520;
      const tick = now=>{ const k = Math.min(1, (now - t0) / dur), v = Math.round(left0 + (left1 - left0) * (1 - Math.pow(1 - k, 3)));
        num.innerHTML = `${fmt(v)} <span>/ ${fmt(T)}</span>`; if(k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    if(left1 <= 0){
      const o = document.querySelector(".pk2-opp");
      if(o){ const k2 = document.createElement("div"); k2.className = "pk2-ko"; k2.textContent = "K.O. !"; o.appendChild(k2); }
      try { Sfx.shiny(); buzz([30, 40, 80]); } catch(e){}
    }
  }, 380);
  RESOLVE.timer = setTimeout(commitResolve, left1 <= 0 ? 1500 : 1050);
}
/* un appui saute l'animation sans rien changer au résultat */
function skipResolve(){
  if(!RESOLVE || RESOLVE.done) return;
  clearTimeout(RESOLVE.timer);
  RESOLVE.i = RESOLVE.res.steps.length;
  const last = RESOLVE.res.steps[RESOLVE.res.steps.length - 1];
  if(last){ RESOLVE.chips = last.chips; RESOLVE.mult = last.mult; }
  endResolveSteps();
}
ACTIONS.pkskipres = () => skipResolve();

/* ---------- la victoire, la défaite : des scènes, plus des fenêtres ---------- */
function pkWinScreen(info){ if(S.poker) S.poker.winInfo = info; refresh(); }
function pkLoseScreen(info){ if(S.poker) S.poker.loseInfo = info; refresh(); }
function pkWinHtml(P){
  const w = P.winInfo; if(!w) return "";
  const o = w.opp;
  return `<div class="pk2-ov win">
    <div class="pk2-ovc">
      ${o ? `<div class="pk2-ovport beaten">${trainerArt(o.cls, 96)}</div>
        <div class="pk2-ovk">${esc(o.title)} · ${esc(o.name)}</div>
        <div class="pk2-say">« ${esc(o.lo || "Bien joué.")} »</div>` : ""}
      <div class="pk2-ovt">VERROU FRANCHI</div>
      <div class="pk2-ovs">${fmt(w.score)} <span>/ ${fmt(w.target)}</span></div>
      <div class="pk2-rows">${w.rows.map((r, i)=>`<div style="--d:${400 + i * 220}ms"><span>${esc(r[0])}</span><b>+${r[1]}</b></div>`).join("")}
        <div class="tot" style="--d:${400 + w.rows.length * 220}ms"><span>Octets</span><b>${ic("coin")} ${P.octets}</b></div></div>
      ${w.firstLeader ? `<div class="pk2-first" style="--d:${700 + w.rows.length * 220}ms"><small>PREMIÈRE VICTOIRE CONTRE ${esc(o.name.toUpperCase())}</small><b>+${fmt(w.bonus)} PokéCoins</b></div>` : ""}
      ${w.final ? `<div class="tiny cy center" style="margin:8px 0">Le Champion est tombé. La couche est stabilisée.</div>
        <button class="btn pri wide" data-act="pkfinish">Terminer la partie</button>
        <button class="btn wide" style="margin-top:7px" data-act="pkendless">Continuer en Couche Zéro</button>`
        : `<button class="btn pri wide pk2-go" data-act="pkshop">Encaisser · la cache ${ic("arrow")}</button>`}
    </div></div>`;
}
function pkLoseHtml(P){
  const L = P.loseInfo; if(!L) return "";
  const o = L.opp;
  return `<div class="pk2-ov lose">
    <div class="pk2-ovc">
      ${o ? `<div class="pk2-ovport gloat">${trainerArt(o.cls, 96)}</div><div class="pk2-ovk">${esc(o.title)} · ${esc(o.name)}</div>
        <div class="pk2-say">« Ta main était vide. La mienne, non. »</div>` : ""}
      <div class="pk2-ovt bad">MANCHE PERDUE</div>
      <div class="pk2-ovs">${fmt(L.score)} <span>/ ${fmt(L.target)} · Ante ${L.ante}</span></div>
      <div class="pk2-rows">
        <div style="--d:300ms"><span>Fragments</span><b class="cy">+${L.shards}</b></div>
        <div style="--d:500ms"><span>PokéCoins</span><b class="gold-t">+${fmt(L.coins)}</b></div></div>
      <button class="btn pri wide" data-act="pkquit">Quitter la table</button>
    </div></div>`;
}

/* ---------- l'évolution d'un programme ---------- */
function pkEvoShow(){
  const P = S.poker; if(!P || !P.evoQ || !P.evoQ.length || document.getElementById("pk2-evo")) return;
  const e = P.evoQ.shift(); save();
  const a = JOKERS.find(x=>x.id === e.from), b = JOKERS.find(x=>x.id === e.to);
  if(!a || !b) return;
  const el = document.createElement("div");
  el.id = "pk2-evo"; el.className = "pk2-evo";
  el.innerHTML = `<div class="pk2-evoc">
      <div class="pk2-evot">Quoi ? <b>${esc(a.n)}</b> évolue !</div>
      <div class="pk2-evos"><span class="a">${sprBox(a.spr, false, 96)}</span><span class="b">${sprBox(b.spr, false, 96)}</span></div>
      <div class="pk2-evon" id="pk2-evon">…</div>
      <button class="btn pri wide" data-act="pkevook" style="visibility:hidden" id="pk2-evok">Continuer</button></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("on"));
  try { Sfx.wobble(); Music.jingle && Music.jingle("j_evolution"); } catch(e2){}
  setTimeout(()=>{
    if(!el.isConnected) return;
    el.classList.add("done");
    const n = document.getElementById("pk2-evon"); if(n) n.innerHTML = `<b>${esc(a.n)}</b> est devenu <b class="gold-t">${esc(b.n)}</b> !<div class="tiny muted">${esc(b.d)}</div>`;
    const ok = document.getElementById("pk2-evok"); if(ok) ok.style.visibility = "visible";
    try { Sfx.win(); buzz([30, 40, 80]); } catch(e2){}
  }, 2400);
}
ACTIONS.pkevook = () => { const el = document.getElementById("pk2-evo"); if(el) el.remove(); refresh(); setTimeout(pkEvoShow, 200); };

/* ---------- les boosters : on ouvre vraiment le paquet ---------- */
function pkShowBooster(){
  const P = S.poker, B = P && P.pendingBooster;
  if(!B) return;
  const old = document.getElementById("pk2-pack"); if(old) old.remove();
  const art = B.picks[0] || 25;
  const el = document.createElement("div");
  el.id = "pk2-pack"; el.className = "pk2-pack";
  el.innerHTML = `<div class="pk2-packc">
      <div class="pk2-packt">${esc(B.n)}</div>
      <div class="pk2-wrap" id="pk2-wrap"><div class="pk2-foil">${sprBox(art, B.shiny, 92)}<b>POKÉ-POKER</b><small>${esc(B.n)}</small></div><i class="pk2-tear"></i></div>
      <div class="pk2-picks">${B.picks.map((id, i)=>`<div class="pk2-pick" style="--d:${i * 160}ms">
          <div class="pk2-flip">${pkBackHtml("big")}${pkCardHtml({u:-1, id, shiny:B.shiny, ed:""}, false, `data-act="pkpickb" data-id="${id}"`, true)}</div>
          <div class="pk2-pickn">${esc(POKE[id].name)}<small>${POKE[id].types.map(t=>TYPE_NAMES[t]).join(" · ")} · ${cardChips({id, shiny:B.shiny})} Jetons</small></div></div>`).join("")}</div>
      <div class="pk2-packh">Touchez une carte : elle rejoint votre deck pour la partie.</div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("on"));
  try { Sfx.wobble(); } catch(e){}
  setTimeout(()=>{ el.classList.add("open"); try { Sfx.coin(); } catch(e){} }, 900);
  setTimeout(()=>{ el.classList.add("show"); try { Sfx.shiny(); } catch(e){} }, 1350);
}
ACTIONS.pkpickb = d => {
  const P = S.poker, B = P && P.pendingBooster;
  const el = document.getElementById("pk2-pack"); if(el) el.remove();
  if(!B) return;
  const maxU = P.deck.reduce((a, c)=>Math.max(a, c.u), 0);
  P.deck.push({u:maxU + 1, id:+d.id, shiny:B.shiny, ed:""});
  toast(POKE[+d.id].name + " rejoint le deck", "", "check");
  delete P.pendingBooster;
  closeSheet(); save(); refresh();
};

/* ---------- la fiche d'un programme : son effet, son rang, son évolution ---------- */
ACTIONS.pkjinfo = d => {
  const P = S.poker, i = +d.i, j = P.jokers[i], def = jokerDef(j);
  if(!def) return;
  const f = P.boss ? P.boss.f : {};
  const evo = def.evo ? `<div class="pk2-evobox"><div class="tiny" style="color:#ffd24a;letter-spacing:1px">ÉVOLUTION</div>
      <div class="tiny">${esc(def.evo.what.charAt(0).toUpperCase() + def.evo.what.slice(1))} : <b>${j.xp || 0} / ${def.evo.need}</b></div>
      <div class="pk2-evobar"><i style="width:${Math.min(100, (j.xp || 0) / def.evo.need * 100)}%"></i></div></div>` : "";
  sheet(`${sheetHead(def.n)}
    <div class="row" style="gap:12px;align-items:flex-start">
      ${pkJokerHtml(j, i, {act:false})}
      <div class="grow">
        <span class="tt rar r${def.rar}" style="--rc:${RARITY[def.rar].c}">${"◆".repeat(def.rar + 1)} ${RAR_NAME[def.rar]}</span>
        <div class="tiny" style="margin-top:6px">${esc(def.d)}</div>
        ${def.fragile ? `<div class="tiny bad" style="margin-top:4px">Utilisations : ${(j.uses || 0)}/${def.fragile}</div>` : ""}
        ${f.sleep && i === 0 && P.state !== "shop" ? `<div class="tiny bad" style="margin-top:4px">Il dort pendant ce verrou (Poudre Dodo).</div>` : ""}
        ${evo}
      </div>
    </div>
    <div class="panel tight" style="margin-top:11px">
      <div class="h sm">ORDRE D'EXÉCUTION — position ${i + 1} sur ${P.jokers.length}</div>
      <div class="tiny muted">Les programmes s'appliquent de gauche à droite. Un multiplicateur
        placé en dernier agit sur tout ce qui précède : l'ordre change le score.</div>
      <div class="btn-grid c2" style="margin-top:8px">
        <button class="btn sm" data-act="pkjmove" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""}>◀ Vers la gauche</button>
        <button class="btn sm" data-act="pkjmove" data-i="${i}" data-d="1" ${i === P.jokers.length - 1 ? "disabled" : ""}>Vers la droite ▶</button>
      </div>
    </div>
    <button class="btn dan wide" style="margin-top:9px" data-act="pkjsell" data-i="${i}">Revendre (+${Math.max(1, Math.floor(def.cost / 2))} Octets)</button>`, true);
};
ACTIONS.pkrule = () => {
  const P = S.poker; if(!P || !P.boss) return;
  const o = pkOpp(P);
  sheet(`${sheetHead(P.boss.n)}<div class="row" style="gap:11px;align-items:center">${trainerArt(o.cls, 64)}
    <div class="grow"><div class="tiny muted">${esc(o.title)} · <b>${esc(o.name)}</b></div><div class="tiny" style="margin-top:5px">${esc(P.boss.d)}</div></div></div>`, true);
};

/* ============================================================
   LES ÉCRANS
   ============================================================ */
SCREENS.poker = {
  html(){
    const P = S.poker;
    if(!P) return this.lobby();
    if(P.state === "blind") return this.blindView(P);
    if(P.state === "shop") return this.shopView(P);
    if(P.state === "resolve") return this.playView(P, true);
    return this.playView(P);
  },
  /* ---------- la salle de jeux ---------- */
  lobby(){
    const ok = moduleUnlocked("poker");
    const M = S.pokerMeta || {}, beaten = M.leaders || [];
    const show = [150, 6, 25, 130, 151];
    return `<div class="pk2 lobby">
      <div class="pk2-neon"><span>POKÉ</span><span class="b">POKER</span><small>salle de jeux de la couche</small></div>
      <div class="pk2-show">${show.map((id, i)=>`<div class="pk2-sc" style="--i:${i}">${pkCardHtml({u:-1, id, shiny:i === 2, ed:i === 4 ? "gold" : ""}, false, "", true)}</div>`).join("")}</div>
      <div class="pk2-pitch">Des mains de <b>Pokémon</b> : espèces identiques, familles d'évolution, types, <b>suites du Pokédex</b>, chromatiques.
        Chaque verrou est tenu par un dresseur ; au bout de chaque ante, un <b>Champion d'arène</b> et sa règle.</div>
      <div class="pk2-stats">
        <div><b>${M.bestAnte || 0}</b><small>meilleure ante</small></div>
        <div><b>${S.stats.pokerWins || 0}</b><small>parties gagnées</small></div>
        <div><b>${fmt(S.stats.pokerBest || 0)}</b><small>meilleur score</small></div>
      </div>
      <div class="pk2-case">
        <div class="pk2-caseh">VITRINE DES CHAMPIONS <span>${beaten.length} / 13</span></div>
        <div class="pk2-casel">${PK_LEADER_ORDER.concat(PK_ELITE_ORDER).map(k=>{ const L = pkLeaderInfo(k), on = beaten.includes(k);
          return `<span class="pk2-ld ${on ? "on" : ""}" title="${esc(L.name)}">${trainerArt(L.cls, 40)}</span>`; }).join("")}
          <span class="pk2-ld champ ${beaten.includes("champion") ? "on" : ""}" title="Régis">${trainerArt("cool_trainer_m", 40)}</span></div>
      </div>
      ${ok ? pkDeckPicker() : ""}
      <button class="pk2-play" data-act="pkstart" ${ok ? "" : "disabled"}><span>${ic("cards")} S'asseoir à la table</span></button>
      <div class="btn-grid c2" style="margin-top:8px">
        <button class="btn ghost" data-act="pkinfo">Combinaisons</button>
        <button class="btn ghost" data-act="pkdex">Programmathèque</button>
      </div>
      <button class="btn ghost wide sm" style="margin-top:7px" data-act="goto" data-to="modules">Retour aux modules</button>
    </div>`;
  },
  /* ---------- le tableau des verrous ---------- */
  blindView(P){
    const st = pkStage();
    const blinds = st === "ante" ? [0, 1, 2] : [P.blind];
    return `<div class="pk2 blinds">
      <div class="pk2-bhead"><div><small>${esc(pkStageLabel())}</small><b>${st === "ante" ? "Le tableau des verrous" : esc(pkBlindLabel())}</b></div>
        <span class="pk2-oct">${ic("coin")}<b>${P.octets}</b></span><button class="pk2-menu" data-act="pkmenu">${ic("grid")}</button></div>
      ${this.badges(P)}
      ${pkShelfHtml(P)}
      <div class="pk2-bl n${blinds.length}">${blinds.map(b=>{
        const o = pkOpp(P, b), cur = b === P.blind, done = b < P.blind && st === "ante";
        const target = pkTargetPreview(P, b, o);
        return `<div class="pk2-bc ${cur ? "cur" : ""} ${done ? "done" : ""} ${o.boss ? "boss" : ""}" style="--oc:${pkTypeCol(o.type)}">
          <div class="pk2-bck">${b === 2 || st !== "ante" ? (o.kind === "leader" ? "CHAMPION D'ARÈNE" : esc(o.title.toUpperCase())) : BLIND_NAMES[b].toUpperCase()}</div>
          <div class="pk2-bcp">${trainerArt(o.cls, cur ? 88 : 64)}</div>
          <div class="pk2-bcn">${esc(o.name)}<small>${esc(o.title)}</small></div>
          <div class="pk2-bct"><small>Score requis</small><b>${fmt(target)}</b></div>
          <div class="pk2-bcr">${ic("coin")} ${3 + Math.min(2, b)}</div>
          ${o.rule ? `<div class="pk2-bcrule"><b>${esc(o.rule.r)}</b>${cur ? `<span>${esc(o.rule.d)}</span>` : ""}</div>` : ""}
          ${done ? `<div class="pk2-bcdone">FRANCHI</div>` : ""}
        </div>`; }).join("")}</div>
      ${(()=>{ const o = pkOpp(P); return `<div class="pk2-say big"><span class="pk2-who">${esc(o.name)}</span>« ${esc(o.hi)} »</div>`; })()}
      <div class="pk2-acts">
        ${P.blind === 2 || st !== "ante" ? "" : `<button class="pk2-btn ghost" data-act="pkskip">Contourner<small>+${3 + P.blind} Octets · niveau de main</small></button>`}
        <button class="pk2-btn blue" data-act="pkstartblind">Affronter ${esc(pkOpp(P).name)}</button>
      </div>
    </div>`;
  },
  badges(P){
    const got = P.badges || [], st = pkStage();
    return `<div class="pk2-badges">${BADGES.map((b, i)=>{ const L = pkLeaderInfo(PK_LEADER_ORDER[i]);
      return `<span class="pk2-bdg ${got.includes(i) ? "on" : ""}" style="--bc:${b.c}" title="Badge ${esc(b.n)} — ${esc(L.name)}">◆</span>`; }).join("")}
      <span class="pk2-bsep"></span>
      ${ELITE_NAMES.map((_, i)=>`<span class="pk2-bdg e4 ${st === "champion" || (st === "elite" && (P.eliteIdx || 0) > i) ? "on" : ""} ${st === "elite" && (P.eliteIdx || 0) === i ? "cur" : ""}">${i + 1}</span>`).join("")}
      <span class="pk2-bdg champ ${st === "champion" ? "cur" : ""}">★</span></div>`;
  },
  /* ---------- la table ---------- */
  playView(P, resolving){
    const shown = resolving ? (P.resolvePlayed || []) : [];
    const played = shown.map(u=>P.hand.find(c=>c.u === u)).filter(Boolean);
    const scoringU = resolving && RESOLVE ? RESOLVE.res.scored.map(c=>c.u) : [];
    return `<div class="pk2 play ${resolving ? "resolving" : ""}" ${resolving ? 'data-act="pkskipres"' : ""}>
      ${pkOppHtml(P)}
      ${pkShelfHtml(P, true)}
      <div class="pk2-felt" id="poker-felt">
        <div class="pk2-stage" id="pk2-stage">${played.map((c, i)=>`<div class="pk2-sslot" style="--d:${i * 70}ms">${pkCardHtml(c, false, `data-u="${c.u}"`, true, scoringU.includes(c.u) ? "scoring" : "idle")}</div>`).join("")}</div>
        <div class="pk2-line" id="pk-score-line">${pkScoreLineHtml(null)}</div>
      </div>
      <div class="pk2-meta">
        <span class="pk2-hands" title="Mains restantes">${Array.from({length:Math.max(P.hands + 1, P.handsLeft)}, (_, i)=>`<i class="${i < P.handsLeft ? "on" : ""}">${itemIcon("ball:poke", 16) || "●"}</i>`).join("")}</span>
        <span class="pk2-disc" title="Défausses restantes">${ic("refresh")}<b>${P.discardsLeft}</b></span>
        <button class="pk2-deck" data-act="pkdeck">${pkBackHtml("mini")}<b>${P.draw.length}</b></button>
      </div>
      ${pkFanHtml(P, resolving)}
      <div class="pk2-acts">
        ${resolving ? `<button class="pk2-btn ghost wide" data-act="pkskipres">Passer l'animation</button>`
          : `<button class="pk2-btn red" id="pk-disc" data-act="pkdiscard" ${P.sel.length && P.discardsLeft > 0 ? "" : "disabled"}>Défausser<small>${P.discardsLeft} restante${P.discardsLeft > 1 ? "s" : ""}</small></button>
             <button class="pk2-btn sort" data-act="pksort">${ic("refresh")}<small>${PK_SORT_LABEL[P.sort || "fam"]}</small></button>
             <button class="pk2-btn blue" id="pk-play" data-act="pkplay" ${P.sel.length && P.handsLeft > 0 ? "" : "disabled"}>Jouer<small>${P.handsLeft} main${P.handsLeft > 1 ? "s" : ""}</small></button>`}
      </div>
      ${P.state === "reward" ? pkWinHtml(P) : ""}
      ${P.state === "over" ? pkLoseHtml(P) : ""}
    </div>`;
  },
  /* ---------- la cache ---------- */
  shopView(P){
    const lic = P.shop.licence ? LICENCES.find(l=>l.id === P.shop.licence.id) : null;
    const buyBtn = (cost, act, i) => `<button class="pk2-price ${P.octets >= cost ? "" : "no"}" data-act="${act}" ${i !== undefined ? `data-i="${i}"` : ""} ${P.octets >= cost ? "" : "disabled"}>${ic("coin")}${cost}</button>`;
    return `<div class="pk2 shop">
      <div class="pk2-bhead"><div><small>${esc(pkStageLabel())}</small><b>La cache d'échange</b></div>
        <span class="pk2-oct">${ic("coin")}<b>${P.octets}</b></span><button class="pk2-menu" data-act="pkmenu">${ic("grid")}</button></div>
      <div class="pk2-keeper">${typeof pzFace === "function" ? pzFace("Happy", 44) : ""}<div class="pk2-say">« ${esc(["Tout est à vendre. Même ce qui ne devrait pas l'être.", "Des programmes tout frais, à peine décompilés.", "Ouvre un booster. On ne sait jamais ce qui dort dedans.", "Un conseil : l'ordre des programmes change tout."][(P.ante + P.blind) % 4])} »</div></div>
      ${pkShelfHtml(P)}
      <div class="tiny dim" style="margin:-2px 0 8px">${P.jokers.length}/${jokerSlots()} emplacements · touchez un programme pour le déplacer ou le revendre</div>
      <div class="pk2-sh">PROGRAMMES</div>
      <div class="pk2-row">${P.shop.jokers.length ? P.shop.jokers.map((o, i)=>{
        const j = JOKERS.find(x=>x.id === o.id);
        return `<div class="pk2-item">${pkJokerHtml({id:o.id}, i, {act:false})}
          <div class="pk2-itd"><b>${esc(j.n)}</b><span>${esc(j.d)}</span>${j.evo ? `<em>Évolue : ${esc(j.evo.need + " " + j.evo.what)}</em>` : ""}</div>${buyBtn(o.cost, "pkbuyj", i)}</div>`;
      }).join("") : `<div class="empty">Stock épuisé.</div>`}</div>
      <div class="pk2-sh">BOOSTERS</div>
      <div class="pk2-packs">${P.shop.boosters.length ? P.shop.boosters.map((o, i)=>{
        const b = BOOSTERS.find(x=>x.id === o.id), art = {b_index:25, b_evo:3, b_type:131, b_chroma:6, b_herit:150}[b.id] || 25;
        return `<div class="pk2-packi k-${b.id}"><div class="pk2-foil sm">${sprBox(art, b.id === "b_chroma", 54)}<b>${esc(b.n.replace("Booster ", ""))}</b></div>
          <div class="pk2-itd"><span>${esc(b.d)}</span></div>${buyBtn(o.cost, "pkbuyb", i)}</div>`;
      }).join("") : `<div class="empty">Stock épuisé.</div>`}</div>
      ${P.shop.consum ? (()=>{
        const o = P.shop.consum, def = o.kind === "planet" ? PLANETS.find(x=>x.id === o.id) : SPECTRALS.find(x=>x.id === o.id);
        const lv = o.kind === "planet" ? (P.levels[def.hand] || 0) : 0;
        const desc = o.kind === "planet" ? `${HANDS_BY_ID[def.hand].n} passe au niveau ${lv + 2}` : def.d;
        return `<div class="pk2-sh">${o.kind === "planet" ? "ORBE" : "SPECTRE"}</div>
          <div class="pk2-item ${o.kind}"><span class="pk2-orb ${o.kind}"><i></i></span><div class="pk2-itd"><b>${esc(def.n)}</b><span>${esc(desc)}</span></div>${buyBtn(o.cost, "pkbuycon")}</div>`;
      })() : ""}
      ${lic ? `<div class="pk2-sh">LICENCE</div>
        <div class="pk2-item lic"><span class="pk2-ticket">${ic("star")}</span><div class="pk2-itd"><b>${esc(lic.n)}</b><span>${esc(lic.d)} Pour toute la partie.</span></div>${buyBtn(lic.cost, "pkbuylic")}</div>` : ""}
      <div class="pk2-acts">
        <button class="pk2-btn ghost" data-act="pkreroll" ${P.octets >= P.shop.rerollCost ? "" : "disabled"}>Relancer<small>${ic("coin")} ${P.shop.rerollCost}</small></button>
        <button class="pk2-btn blue" data-act="pknext">Verrou suivant ${ic("arrow")}</button>
      </div>
      <button class="btn ghost wide sm" style="margin-top:8px" data-act="pkdeck">Consulter le deck (${P.deck.length})</button>
    </div>`;
  },
  after(){
    const P = S.poker;
    if(P && P.state === "play" && !RESOLVE) pkRenderLive();
    /* la distribution ne se joue qu'une fois */
    if(P && P.fresh && P.fresh.length) setTimeout(()=>{ if(S.poker) S.poker.fresh = []; }, 50);
    if(P && P.washed){ const w = P.washed; P.washed = null; toast("Torrent : " + w.map(id=>POKE[id].name).join(" et ") + " emportés", "bad", "bolt"); }
    /* une évolution attend que la victoire soit encaissée : elle se joue à la table ou à la cache */
    if(P && P.evoQ && P.evoQ.length && (P.state === "play" || P.state === "shop" || P.state === "blind")) setTimeout(pkEvoShow, 350);
  }
};

/* le score requis d'un verrou, avant d'y entrer (même calcul que pkStartRound) */
function pkTargetPreview(P, b, o){
  const st = pkStage(), f = (o && o.rule && o.rule.f) || {};
  let base;
  if(st === "elite") base = Math.round(anteTarget(9, 2) * (1 + (P.eliteIdx || 0) * 0.45) * (f.target || 1));
  else if(st === "champion") base = Math.round(anteTarget(9, 2) * 3.4 * (f.target || 1));
  else base = anteTarget(P.ante, b, b === 2 ? {f} : null);
  return Math.round(base * (b === P.blind ? (P.discount || 1) : 1) * (typeof pkDeckTargetMul === "function" ? pkDeckTargetMul(P) : 1));
}
/* le choix du deck, sous le bouton de lancement */
function pkDeckPicker(){
  if(typeof PK_DECKS === "undefined") return "";
  const cur = pkDeckOpen(S.pokerMeta.deck || "std") ? (S.pokerMeta.deck || "std") : "std";
  return `<div class="pk2-sh">DECK</div>
    <div class="pk-decks">${PK_DECKS.map(d=>{
      const open = pkDeckOpen(d.id), t = d.card ? cardTier(d.card) : 0;
      return `<button class="pk-deck ${cur === d.id ? "on" : ""} ${open ? "" : "locked"}" data-act="pkdecksel" data-id="${d.id}">
        <span class="pkd-art">${d.card ? (open ? sprite(d.card, false, "") : `<span class="monunknown">?</span>`) : ic("cards")}</span>
        <span class="grow"><b>${esc(d.n)}</b>${t ? ` <i class="cpw-t t${t}">${TIER_NAMES[t]}</i>` : ""}
          <small>${open ? esc(pkDeckDesc(d)) : "Fermé · s'ouvre avec une carte de " + esc(d.card && monFound(d.card) ? POKE[d.card].name : "légendaire") + "."}</small></span>
      </button>`;}).join("")}</div>`;
}
/* la Programmathèque : tous les programmes, ceux qu'on a vus, ceux qui restent à découvrir */
ACTIONS.pkdex = () => {
  if(S.poker) S.poker.jokers.forEach(j=>pkSeen(j.id));
  const seen = (S.pokerMeta && S.pokerMeta.seenJ) || [];
  const all = JOKERS.filter(j=>typeof jokerAvail !== "function" || jokerAvail(j) || seen.includes(j.id));
  sheet(`${sheetHead(`Programmathèque — ${all.filter(j=>seen.includes(j.id)).length} / ${all.length}`)}
    <div class="tiny muted" style="margin-bottom:9px">Chaque programme vu en cache s'inscrit ici. Les formes évoluées ne se trouvent qu'en faisant évoluer leur programme.</div>
    <div class="pk2-dex">${all.map(j=>{ const on = seen.includes(j.id);
      return `<div class="pk2-dexi ${on ? "" : "unk"}">${on ? pkJokerHtml({id:j.id}, 0, {act:false}) : `<div class="pkj r${j.rar}"><span class="pkj-art"><span class="monunknown">?</span></span><span class="pkj-nm">???</span></div>`}
        <div><b>${on ? esc(j.n) : j.evoOnly ? "Forme évoluée" : "Inconnu"}</b><span>${on ? esc(j.d) : RAR_NAME[j.rar]}</span></div></div>`; }).join("")}</div>`);
};
