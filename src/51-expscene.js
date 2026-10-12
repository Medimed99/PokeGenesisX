/* ============================================================
   51 — L'EXPÉDITION VÉCUE
   Chaque nœud se vit : l'équipe marche jusqu'à lui, puis une scène
   s'ouvre — un dresseur entre en piste, des Poké Balls s'ouvrent,
   un coffre se force, un feu de camp crépite, Porygon-Z raconte.

   Tout ce qu'une scène attend du joueur est écrit dans run.pend :
   fermer l'application au milieu d'un recrutement, d'un coffre ou
   d'un combat ne fait rien perdre. À la réouverture, la scène
   reprend où elle en était.
   ============================================================ */

/* ============================================================
   1. LES SPRITES DE MARCHE HORS DU COMBAT
   Un petit canvas par Pokémon, animé par une seule boucle.
   ============================================================ */
let XPMD_RAF = 0;
function pmdCanvas(id, dir, size, opts){
  opts = opts || {};
  const W = Math.round(size * 2);
  return `<canvas class="pmdc ${opts.cls || ""}" data-id="${id}" data-dir="${dir || 0}" data-walk="${opts.walk ? 1 : 0}"
    ${opts.shiny ? 'data-shiny="1"' : ""} width="${W}" height="${W}" style="width:${size}px;height:${size}px"></canvas>`;
}
function pmdWake(){ if(!XPMD_RAF && typeof requestAnimationFrame === "function") XPMD_RAF = requestAnimationFrame(pmdLoop); }
function pmdLoop(now){
  const els = document.querySelectorAll("canvas.pmdc");
  if(!els.length){ XPMD_RAF = 0; return; }
  for(const c of els){
    const x = c.getContext("2d"); if(!x) continue;
    const W = c.width, id = +c.dataset.id, dir = +c.dataset.dir || 0, walk = c.dataset.walk === "1";
    x.clearRect(0, 0, W, W);
    x.imageSmoothingEnabled = false;
    /* au repos, un Pokemon respire ; en route, il marche */
    const t = walk ? now / 1000 : null;
    const ok = pmdFitDraw(x, id, dir, t, W);
    if(!ok && typeof brSprite === "function"){
      const s = brSprite(id, c.dataset.shiny ? "s" : "n");
      if(s) x.drawImage(s, W * 0.1, W * 0.05, W * 0.8, W * 0.8);
    }
    if(c.dataset.shiny && Math.floor(now / 160) % 7 === 0){ x.fillStyle = "#ffe9a8"; x.fillRect(W * 0.72, W * 0.18, 3, 3); }
  }
  XPMD_RAF = requestAnimationFrame(pmdLoop);
}

/* l'echelle vise le Pokemon, pas son cadre : les planches PMD ont des marges tres
   variables (Leviator occupe un cadre de 88x128). On mesure une fois la silhouette
   de la premiere image, puis on l'ajuste au canvas, pieds en bas. */
const PMD_FIT = {};
function pmdFit(id){
  if(PMD_FIT[id]) return PMD_FIT[id];
  if(typeof brPmdVariant !== "function" || typeof PMD_META === "undefined" || !PMD_META[id]) return null;
  const sheet = brPmdVariant(id, "n"); if(!sheet) return null;
  const [fw, fh] = PMD_META[id];
  let box = {x0:0, y0:0, x1:fw, y1:fh};
  try {
    const d = sheet.getContext("2d").getImageData(0, 0, fw, fh).data;
    let x0 = fw, y0 = fh, x1 = 0, y1 = 0;
    for(let y = 0; y < fh; y++) for(let x = 0; x < fw; x++) if(d[(y * fw + x) * 4 + 3] > 20){
      if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
    if(x1 > x0) box = {x0, y0, x1:x1 + 1, y1:y1 + 1};
  } catch(e){}
  return PMD_FIT[id] = {sheet, fw, fh, box};
}
function pmdFitDraw(x, id, dir, t, W){
  const F = pmdFit(id); if(!F) return false;
  const cw = F.box.x1 - F.box.x0, ch = F.box.y1 - F.box.y0;
  /* entier quand c'est possible : le pixel art reste net */
  let sc = Math.min(W * 0.84 / cw, W * 0.86 / ch);
  if(sc >= 2) sc = Math.floor(sc);
  const f = t === null ? 0 : brPmdFrame(id, t);
  const cx = (F.box.x0 + F.box.x1) / 2;
  const dx = W / 2 - cx * sc, dy = W * 0.95 - F.box.y1 * sc;
  x.drawImage(F.sheet, f * F.fw, dir * F.fh, F.fw, F.fh, Math.round(dx), Math.round(dy), F.fw * sc, F.fh * sc);
  return true;
}

/* ============================================================
   2. LA SCÈNE
   Un plateau (ce qu'on voit) et un pupitre (ce qu'on choisit).
   ============================================================ */
function xsOpen(kind, color, stage, panel, keep){
  if(typeof document.createElement("div").querySelector !== "function") return null;   /* sans DOM (tests) */
  let el = document.getElementById("xscene");
  if(el && !(el.dataset && el.dataset.kind !== undefined)) el = null;
  const same = el && el.dataset.kind === kind && keep;
  if(!same){
    if(el) el.remove();
    el = document.createElement("div");
    el.id = "xscene";
    el.dataset.kind = kind;
    el.className = "xsc xk-" + kind;      /* pas « xs » : c'est deja la taille des petits boutons */
    el.innerHTML = `<div class="xs-stage" id="xs-stage"></div><div class="xs-panel" id="xs-panel"></div>`;
    document.body.appendChild(el);
    void el.offsetWidth;
    el.classList.add("in");
  }
  el.style.setProperty("--xc", color || "#35f0d6");
  if(stage !== null) el.querySelector(".xs-stage").innerHTML = stage;
  el.querySelector(".xs-panel").innerHTML = panel;
  pmdWake();
  return el;
}
function xsPanel(html){ const p = document.querySelector("#xscene .xs-panel"); if(p) p.innerHTML = html; pmdWake(); }
function xsClose(){
  const el = document.getElementById("xscene");
  if(!el) return;
  el.classList.add("out");
  /* la scene qui s'efface ne doit plus repondre aux recherches par identifiant */
  el.id = "";
  el.querySelectorAll("[id]").forEach(e=>e.removeAttribute("id"));
  setTimeout(()=>el.remove(), 260);
}
function xsOpenNow(){ const el = document.getElementById("xscene"); return !!(el && el.dataset && el.dataset.kind !== undefined); }
/* la sortie commune : la scene se referme, la carte reprend */
function xsDone(run){
  run.pend = null;
  save();
  xsClose();
  go("expedition");
}

/* l'équipe, en rang : on la voit vivre la scène avec soi */
function xsTeam(run, opts){
  opts = opts || {};
  return `<div class="xs-team ${opts.cls || ""}">${run.team.map((m, i)=>`
    <div class="xs-mon ${m.hp <= 0 ? "ko" : ""}" style="--d:${i * 70}ms">
      ${opts.ups && opts.ups.find(u=>u.i === i) ? `<span class="xs-up" style="--d:${500 + i * 90}ms">+${opts.ups.find(u=>u.i === i).to - opts.ups.find(u=>u.i === i).from}</span>` : ""}
      ${pmdCanvas(m.id, opts.dir === undefined ? 0 : opts.dir, opts.size || 40, {walk:opts.walk && m.hp > 0, shiny:runShiny(m)})}
      ${opts.bars ? `<div class="bar hp ${m.hp / m.maxHp > .5 ? "" : m.hp / m.maxHp > .2 ? "mid" : "low"}"><i data-to="${Math.max(0, m.hp / m.maxHp * 100)}"
        style="width:${Math.max(0, (opts.from && opts.from[i] !== undefined ? opts.from[i] : m.hp) / m.maxHp * 100)}%"></i></div>` : ""}
    </div>`).join("")}</div>`;
}
/* les barres montent après l'ouverture : on voit le soin se faire */
function xsBars(delay){
  setTimeout(()=>document.querySelectorAll("#xscene .xs-stage .bar i[data-to]").forEach(b=>{ b.style.width = b.dataset.to + "%"; }), delay || 500);
}
/* une relique se révèle : carte qui se retourne, halo, nom */
function xsRelic(r, delay, low){
  if(!r) return "";
  return `<div class="xs-relic ${low ? "low" : ""}" style="--d:${delay || 0}ms">
    <div class="xr-rays"></div>
    <div class="xr-card"><div class="xr-ic">${itemIcon("held:h_relic", 40) || ic("shard2")}</div>
      <div class="xr-tag">RELIQUE</div><div class="xr-n">${esc(r.n)}</div><div class="xr-d">${esc(r.d)}</div></div>
  </div>`;
}
function xsCount(el, to, ms){
  if(!el) return;
  const t0 = performance.now();
  const step = now => { const k = Math.min(1, (now - t0) / ms); el.textContent = "+" + Math.round(to * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ============================================================
   3. LE VOYAGE
   L'équipe marche jusqu'au nœud choisi, la carte la suit.
   ============================================================ */
let EXP_TRAVEL = false;
function expTravel(y, i, done){
  const lead = document.getElementById("xleader"), node = document.querySelector(`.xnode[data-y="${y}"][data-i="${i}"]`);
  if(!lead || !node){ done(); return; }
  EXP_TRAVEL = true;
  const x0 = parseFloat(lead.style.left), x1 = parseFloat(node.style.left);
  const cv = lead.querySelector("canvas");
  if(cv){ cv.dataset.walk = "1"; cv.dataset.dir = x1 > x0 + 1 ? 1 : x1 < x0 - 1 ? 7 : 0; }
  lead.classList.add("go");
  lead.style.left = node.style.left; lead.style.top = node.style.top;
  const sc = document.getElementById("map-scroll");
  if(sc) sc.scrollTo({top:Math.max(0, parseFloat(node.style.top) - sc.clientHeight * 0.42), behavior:"smooth"});
  arTone && arTone(330, .06, "triangle", .025, 420);
  setTimeout(()=>{
    node.classList.add("arrive");
    if(cv){ cv.dataset.walk = "0"; cv.dataset.dir = 0; }
    setTimeout(()=>{ EXP_TRAVEL = false; done(); }, 260);
  }, 640);
}

/* ============================================================
   4. ENTRER DANS UN NŒUD
   ============================================================ */
function enterNode(run, node){
  run.trainer = null;
  switch(node.t){
    case "fight": case "elite": case "boss": case "trainer": case "champ":
      run.pend = {k:"enc", kind:node.t, foes:enemySpecFor(run, node.t)};
      break;
    case "draft":    run.pend = {k:"draft", list:draftPool(run, 3 + relicVal(run, "recruit"), 0)}; break;
    case "swap":     run.pend = {k:"swap", list:draftPool(run, 3, 3)}; break;
    case "rest":     run.pend = {k:"rest"}; break;
    case "shop":     run.shopStock = null; run.pend = {k:"shop"}; break;
    case "treasure": run.pend = {k:"items", list:rollExpItem(run.floor, 3)}; break;
    case "event":    run.pend = {k:"event", e:Math.floor(rng() * EXP_EVENTS.length), cid:randomWildId()}; break;
    default: run.pend = null;
  }
  save();
  expResume(run);
}
/* rouvrir la scène en attente, quelle qu'elle soit */
function expResume(run){
  const p = run && run.pend;
  if(!p) return false;
  const f = XS_SCENES[p.k];
  if(!f){ run.pend = null; return false; }
  f(run, p);
  return true;
}
/* les noms historiques restent, pour les tests et les sauvegardes */
function expDraft(run){ run.pend = {k:"draft", list:draftPool(run, 3, 0)}; save(); expResume(run); }
function expSwapNode(run){ run.pend = {k:"swap", list:draftPool(run, 3, 3)}; save(); expResume(run); }
function expRest(run){ run.pend = {k:"rest"}; save(); expResume(run); }
function expShop(run){ run.pend = {k:"shop"}; save(); expResume(run); }
function expItemNode(run){ run.pend = {k:"items", list:rollExpItem(run.floor, 3)}; save(); expResume(run); }
function expTreasure(run){ expItemNode(run); }
function expEvent(run){ run.pend = {k:"event", e:Math.floor(rng() * EXP_EVENTS.length), cid:randomWildId()}; save(); expResume(run); }

/* ============================================================
   5. LES SCÈNES
   ============================================================ */
const XS_LINES = [
  "Voyons si ton équipe tient face au type {T}.",
  "Je garde ce passage. Mon équipe de type {T} ne recule pas.",
  "Tu tombes bien : mes Pokémon de type {T} s'ennuyaient.",
  "Encore un archiviste. Montre-moi ce que tu as indexé.",
  "Ce secteur est à moi. Ici, le type {T} fait la loi."
];
const XS_SCENES = {
  /* ---------- une rencontre : sauvage, dresseur, élite ou noyau ---------- */
  enc(run, p){
    const kind = p.kind, first = p.foes[0];
    const foeType = first ? POKE[first.id].types[0] : 1;
    let stage, panel, color;
    if(kind === "trainer" || kind === "elite"){
      const node = run.map[run.row][run.col];
      const tr = kind === "trainer" ? trainerFor(run) : {n:"Élite de la couche", t:foeType};
      color = kind === "elite" ? "#ff3d7f" : arCol(tr.t);
      const line = kind === "elite" ? "Peu arrivent jusqu'ici. Aucun ne repart sans y laisser quelque chose."
        : XS_LINES[(run.floor + (node.tr || 0)) % XS_LINES.length].replace("{T}", TYPE_NAMES[tr.t]);
      stage = `<div class="xs-stripes"></div>
        <div class="xs-trainer">${trainerArt(trainerClassOf(node), 160, "big")}</div>
        <div class="xs-balls">${p.foes.map((f, i)=>`<span style="--d:${600 + i * 120}ms">${itemIcon("ball:poke", 30)}</span>`).join("")}</div>
        <div class="xs-vs">VS</div>`;
      panel = `<div class="xs-kicker" style="color:${color}">${kind === "elite" ? "ÉLITE" : "ARCHIVISTE"} · <span class="tt t${tr.t}">${TYPE_NAMES[tr.t]}</span></div>
        <div class="xs-title">${esc(tr.n)}</div>
        <div class="xs-say">« ${esc(line)} »</div>
        <button class="btn pri wide xs-go" data-act="xsgo">Combattre</button>`;
    } else if(kind === "champ"){
      const L = run.leader || {pic:"leader_brock", t:6, n:"Champion"};
      color = arCol(L.t);
      stage = `<div class="xs-stripes"></div><div class="xs-gym"></div>
        <div class="xs-trainer champ">${trainerArt(L.pic, 176, "big")}</div>
        <div class="xs-balls">${p.foes.map((f, i)=>`<span style="--d:${700 + i * 120}ms">${itemIcon("ball:poke", 30)}</span>`).join("")}</div>
        <div class="xs-vs">VS</div>`;
      panel = `<div class="xs-kicker" style="color:${color}">CHAMPION DU SECTEUR · <span class="tt t${L.t}">${TYPE_NAMES[L.t]}</span></div>
        <div class="xs-title">${esc(L.n)}</div>
        <div class="xs-say">« Ce secteur m'appartient. Si tu veux mon badge, montre-moi ce que ton équipe a appris en chemin. »</div>
        <button class="btn pri wide xs-go" data-act="xsgo">Défier le Champion</button>`;
    } else if(kind === "boss"){
      color = "#ff3d7f";
      stage = `<div class="xs-glitch"></div>
        <div class="xs-boss">${sprBox(first.id, false, 150)}</div>
        <div class="xs-warn">SIGNATURE MAJEURE</div>`;
      panel = `<div class="xs-kicker" style="color:${color}">NOYAU DE COUCHE</div>
        <div class="xs-title">Le gardien de la couche se manifeste</div>
        <div class="xs-say">${p.foes.length} signatures liées. Ce combat clôt l'expédition.</div>
        <button class="btn pri wide xs-go" data-act="xsgo">Affronter le noyau</button>`;
    } else {
      color = arCol(foeType);
      stage = `<div class="xs-grass"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="xs-bang">!</div>
        <div class="xs-wild">${p.foes.map((f, i)=>`<div class="xs-wm" style="--d:${900 + i * 160}ms">${pmdCanvas(f.id, 0, p.foes.length > 1 ? 104 : 128)}</div>`).join("")}</div>
        <div class="xs-grass front"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
      panel = `<div class="xs-kicker" style="color:${color}">RENCONTRE SAUVAGE</div>
        <div class="xs-title">${p.foes.map(f=>esc(POKE[f.id].name)).join(" et ")}</div>
        <div class="xs-say">${p.foes.map(f=>`<span class="tt t${POKE[f.id].types[0]}">${TYPE_NAMES[POKE[f.id].types[0]]}</span> N.${f.lv}`).join(" · ")}</div>
        <button class="btn pri wide xs-go" data-act="xsgo">Combattre</button>`;
    }
    xsOpen("enc", color, stage, panel);
    arTone && arTone(kind === "boss" ? 90 : 520, .18, kind === "boss" ? "sawtooth" : "square", .04, kind === "boss" ? 50 : 780);
  },

  /* ---------- après la victoire ---------- */
  loot(run, p){
    const stage = `<div class="xs-sun"></div>
      ${xsTeam(run, {walk:true, bars:true, from:p.before, size:54, ups:p.ups})}
      ${xsEvos(p.evos)}
      ${p.relic ? xsRelic(RELICS.find(r=>r.id === p.relic), (p.evos && p.evos.length ? 2600 : 900), p.evos && p.evos.length) : ""}`;
    const held = p.held && HELD_ITEMS[p.held];
    const panel = `<div class="xs-kicker" style="color:#35f0d6">COUCHE DÉGAGÉE</div>
      <div class="xs-gains">
        <div><b class="gold-t" id="xs-bits">+0</b><small>Bits</small></div>
        <div><b class="cy">+${Math.round(p.heal * 100)}%</b><small>PV récupérés</small></div>
        ${p.back ? `<div><b class="ok">${p.back}</b><small>de retour</small></div>` : ""}
      </div>
      ${held ? `<div class="xs-held">${itemIcon("held:" + p.held, 28) || ic("star")} <span>Objet tenu : <b class="vi">${esc(held.n)}</b></span></div>` : ""}
      ${xsLvLine(p.ups)}
      <button class="btn pri wide" data-act="xsloot">Continuer</button>`;
    xsOpen("loot", "#35f0d6", stage, panel);
    xsCount(document.getElementById("xs-bits"), p.bits, 700);
    xsBars(450);
    if(typeof Sfx !== "undefined") setTimeout(()=>Sfx.coin(), 300);
  },

  /* ---------- le badge : l'équipe grandit, une relique à choisir ---------- */
  badge(run, p){
    const L = p.leader, c = arCol(L.t);
    const stage = `<div class="xs-sun"></div>
      <div class="xs-badge" style="--bc:${c}"><i></i></div>
      ${xsTeam(run, {walk:true, size:50, ups:p.ups})}
      ${xsEvos(p.evos, true)}`;
    const panel = `<div class="xs-kicker" style="color:${c}">BADGE OBTENU · ${esc(L.n.toUpperCase())}</div>
      <div class="xs-title">Le secteur ${(run.mapIdx || 0) + 1} est franchi</div>
      ${xsLvLine(p.ups)}
      <div class="xs-say">Choisissez une relique pour la suite :</div>
      <div class="xs-relics">${p.relics.map(id=>{ const r = RELICS.find(x=>x.id === id); return r ? `<button class="xs-rc" data-act="xsbadge" data-id="${id}">
        ${itemIcon("held:h_relic", 26) || ic("shard2")}<span><b>${esc(r.n)}</b><small>${esc(r.d)}</small></span></button>` : ""; }).join("")}</div>
      ${p.relics.length ? "" : `<button class="btn pri wide" data-act="xsbadge">Continuer</button>`}`;
    xsOpen("badge", c, stage, panel);
    if(typeof Sfx !== "undefined") Sfx.win();
  },

  /* ---------- un nouveau secteur s'ouvre ---------- */
  sector(run, p){
    const names = {prairie:"Prairie", foret:"Forêt", grotte:"Grotte", plage:"Plage", neige:"Glacier", volcan:"Volcan", faille:"La Faille"};
    const final = run.mapIdx >= run.maps - 1;
    const stage = `<div class="xs-sector b-${run.biome}"></div>
      <div class="xs-sectit"><small>SECTEUR ${run.mapIdx + 1} / ${run.maps}</small><b>${names[run.biome] || ""}</b></div>
      ${xsTeam(run, {walk:true, size:50, dir:0})}`;
    const panel = `<div class="xs-kicker" style="color:${final ? "#ff3d7f" : "#35f0d6"}">${final ? "DERNIER SECTEUR" : "NOUVELLE CARTE"}</div>
      <div class="xs-title">${final ? "Au bout de cette carte attend le Noyau" : "Un autre Champion garde la sortie"}</div>
      <div class="xs-say">Les adversaires montent avec la carte. Hautes herbes +1 niveau, dresseurs +2, le reste +0.</div>
      <button class="btn pri wide" data-act="xsok">En route</button>`;
    xsOpen("sector", final ? "#ff3d7f" : "#35f0d6", stage, panel);
  },

  /* ---------- trois Poké Balls, trois candidats ---------- */
  draft(run, p){
    if(p.step && !xsOpenNow()){ const st = p.step; p.step = null; p.seen = true; XS_SCENES.draft(run, p); p.step = st; }
    const full = run.team.length >= 6;
    if(p.step === "replace"){
      const c = p.list[p.pick];
      xsPanel(`<div class="xs-kicker" style="color:var(--amber)">ÉQUIPE COMPLÈTE</div>
        <div class="xs-title">Qui laisse sa place à ${esc(POKE[c.id].name)} ?</div>
        <div class="xs-say">Le membre remplacé quitte l'expédition, intact dans votre archive.</div>
        ${xsTeamPick(run, "xsdraftrep")}
        <button class="btn ghost wide" data-act="xsdraftback">Revenir aux candidats</button>`);
      return;
    }
    const stage = `<div class="xs-light"></div><div class="xs-cards">${p.list.map((c, i)=>xsMonCard(c, i, "xsdraft", p.seen ? 0 : 500 + i * 380)).join("")}</div>`;
    const panel = `<div class="xs-kicker" style="color:#5ce07a">RECRUTEMENT</div>
      <div class="xs-title">${p.list.length} signatures détectées</div>
      <div class="xs-say">${full ? "Votre équipe est complète : en prendre un, c'est en laisser partir un autre." : "Une seule rejoint l'expédition. Touchez une carte."}</div>
      <button class="btn ghost wide" data-act="xsdraftskip">Passer · +${80 + run.floor * 8} Bits</button>`;
    xsOpen("draft", "#5ce07a", stage, panel);
    if(!p.seen){ p.seen = true; saveSoon(); }
  },

  /* ---------- le terminal d'échange ---------- */
  swap(run, p){
    if(p.step && !xsOpenNow()){ const st = p.step; p.step = null; p.seen = true; XS_SCENES.swap(run, p); p.step = st; }
    if(p.step === "give"){
      const c = p.list[p.pick];
      xsPanel(`<div class="xs-kicker" style="color:var(--violet)">TERMINAL D'ÉCHANGE</div>
        <div class="xs-title">Céder qui contre ${esc(POKE[c.id].name)} N.${c.lvl} ?</div>
        ${xsTeamPick(run, "xsswapgive")}
        <button class="btn ghost wide" data-act="xsdraftback">Revenir aux offres</button>`);
      return;
    }
    const stage = `<div class="xs-term">${pmdCanvas(137, 0, 96)}<div class="xs-screen"><i></i><i></i><i></i></div></div>
      <div class="xs-cards">${p.list.map((c, i)=>xsMonCard(c, i, "xsswap", p.seen ? 0 : 600 + i * 260)).join("")}</div>`;
    const panel = `<div class="xs-kicker" style="color:#9b6bff">TERMINAL D'ÉCHANGE</div>
      <div class="xs-title">Un Pokémon contre un autre, trois niveaux au-dessus</div>
      <div class="xs-say">Choisissez ce que vous voulez recevoir, puis qui vous cédez.</div>
      <button class="btn ghost wide" data-act="xsdraftskip">Ne rien échanger · +${60 + run.floor * 6} Bits</button>`;
    xsOpen("swap", "#9b6bff", stage, panel);
    if(!p.seen){ p.seen = true; saveSoon(); }
  },

  /* ---------- le feu de camp ---------- */
  rest(run, p){
    const full = relicVal(run, "rest");
    const stage = `<div class="xs-night"></div><canvas class="xs-fire" width="120" height="120"></canvas>
      ${xsTeam(run, {bars:true, from:p.before, size:54, cls:"camp"})}
      ${p.relic ? xsRelic(RELICS.find(r=>r.id === p.relic), 300) : ""}`;
    let panel;
    if(!p.done){
      panel = `<div class="xs-kicker" style="color:#ffc857">FEU DE CAMP</div>
        <div class="xs-title">Le bruit de fond retombe</div>
        <div class="xs-say">Le dernier repos avant le noyau ne remet jamais tout à neuf.</div>
        <div class="btn-grid c2">
          <button class="btn pri" data-act="xsrest" data-k="heal">Se reposer · ${full ? 100 : 62}%</button>
          <button class="btn" data-act="xsrest" data-k="relic">Fouiller · 55%</button>
        </div>`;
    } else {
      panel = `<div class="xs-kicker" style="color:#ffc857">FEU DE CAMP</div>
        <div class="xs-title">${p.done === "heal" ? "L'équipe repart reposée" : p.relic ? "Une relique dans les cendres" : "Rien dans les cendres"}</div>
        <button class="btn pri wide" data-act="xsok">Reprendre la route</button>`;
    }
    xsOpen("rest", "#ffc857", stage, panel);
    xsFire();
    if(p.done === "heal") xsBars(350);
  },

  /* ---------- la boutique de Kecleon ---------- */
  shop(run, p){
    if(!run.shopStock) run.shopStock = [
      {k:"heal", n:"Restauration", d:"Soigne 45% de l'équipe.", p:45, ic:"potion"},
      {k:"relic", n:"Relique inconnue", d:"Une relique au hasard.", p:130, ic:"held:h_relic"},
      {k:"hp", n:"Bloc de PV", d:"+18% de PV max à toute l'équipe.", p:110, ic:"berry:sitrus"},
      {k:"full", n:"Purge complète", d:"Soigne entièrement l'équipe.", p:90, ic:"revive"}
    ];
    const stage = `<div class="xs-shopbg"></div>
      <div class="xs-keeper">${pmdCanvas(352, 0, 120)}</div>
      <div class="xs-counter"></div>
      ${p.relic ? xsRelic(RELICS.find(r=>r.id === p.relic), 0) : ""}`;
    const panel = `<div class="row between"><div class="xs-kicker" style="color:#ffc857">BOUTIQUE KECLEON</div>
        <span class="pill">${ic("coin")} <b id="xs-purse">${run.bits}</b></span></div>
      <div class="xs-shelf">${run.shopStock.map((it, i)=>`
        <button class="xs-ware ${run.bits >= it.p ? "" : "poor"}" data-act="xsbuy" data-i="${i}">
          ${itemIcon(it.ic, 30) || ic("star")}<span class="grow"><b>${esc(it.n)}</b><small>${esc(it.d)}</small></span>
          <span class="xs-price">${it.p}</span></button>`).join("") || `<div class="tiny muted">Étagères vides.</div>`}</div>
      <button class="btn pri wide" data-act="xsok">Repartir</button>`;
    xsOpen("shop", "#ffc857", p.keepStage && xsOpenNow() ? null : stage, panel, true);
    p.keepStage = false;
  },

  /* ---------- un coffre forcé ---------- */
  items(run, p){
    if(p.step && !xsOpenNow()){ const st = p.step; p.step = null; p.seen = true; XS_SCENES.items(run, p); p.step = st; }
    if(p.step === "give"){
      const it = EXP_ITEMS[p.pick];
      xsPanel(`<div class="xs-kicker" style="color:var(--amber)">${esc(it.n.toUpperCase())}</div>
        <div class="xs-title">Qui le porte ?</div>
        <div class="xs-say">${esc(it.d)}</div>
        ${xsTeamPick(run, "xsitemgive", true)}
        <button class="btn ghost wide" data-act="xsdraftback">Revenir au coffre</button>`);
      return;
    }
    const stage = `<div class="xs-rays"></div>
      <div class="xs-chest ${p.seen ? "open" : ""}">${itemIcon("chest:big", 96) || ic("chest")}</div>
      <div class="xs-cards items">${p.list.map((id, i)=>{ const it = EXP_ITEMS[id];
        return `<button class="xs-card ir${it.rar}" style="--d:${p.seen ? 0 : 1250 + i * 220}ms" data-act="xsitem" data-id="${id}">
          <span class="xc-back"></span>
          <span class="xc-face">${itemIcon("exp:" + id, 40) || sprBox(it.spr, false, 40)}
            <b>${esc(it.n)}</b><small>${esc(it.d)}</small></span></button>`; }).join("")}</div>`;
    const panel = `<div class="xs-kicker" style="color:#ffc857">COFFRE SCELLÉ</div>
      <div class="xs-title">Trois objets, un seul emporté</div>
      <div class="xs-say">Un Pokémon ne tient qu'un objet à la fois.</div>
      <button class="btn ghost wide" data-act="xsdraftskip">Ne rien prendre · +${70 + run.floor * 7} Bits</button>`;
    xsOpen("items", "#ffc857", stage, panel);
    if(!p.seen){ p.seen = true; saveSoon(); arTone && [0, 260, 520].forEach(d=>setTimeout(()=>arTone(140, .08, "square", .04, 90), d)); setTimeout(()=>arTone && arTone(520, .3, "triangle", .05, 1400), 900); }
  },

  /* ---------- Porygon-Z raconte ---------- */
  event(run, p){
    const ev = EXP_EVENTS[p.e] || EXP_EVENTS[0];
    const fx = p.fx || null;
    const mood = !fx ? "" : (fx.dmg || fx.corr) && !(fx.bits > 0 || fx.heal > 0 || fx.relic || fx.joined) ? "res-bad" : "res-good";
    const stage = `<div class="xe-scene ${mood} ${fx ? "done" : ""}">${xsEventArt(run, p, ev)}</div>
      ${fx ? xsOutcome(run, p, fx) : ""}`;
    const panel = p.res
      ? `<div class="xs-kicker" style="color:#9b6bff">${pzFace("Happy", 22)} ${esc(ev.n.toUpperCase())}</div>
         <div class="xs-say type" id="xs-type"></div>
         ${xsFxLine(fx)}
         <button class="btn pri wide" data-act="xsok">Continuer</button>`
      : `<div class="xs-kicker" style="color:#9b6bff">${pzFace("Normal", 22)} PORYGON-Z RACONTE</div>
         <div class="xs-title">${esc(ev.n)}</div>
         <div class="xs-say type" id="xs-type"></div>
         <div class="btn-grid">${ev.opts.map((o, i)=>`<button class="btn" data-act="xsev" data-i="${i}">${esc(o.t)}</button>`).join("")}</div>`;
    xsOpen("event", "#9b6bff", stage, panel);
    xsType(document.getElementById("xs-type"), p.res || ev.t);
    xsEventLive(run, p, ev);
    if(fx) xsOutcomeLive(fx);
  }
};

/* ============================================================
   LES ÉVÉNEMENTS EN IMAGES
   Chaque événement a son tableau animé ; le choix fait réagir
   le tableau (l'âme s'apaise et s'efface, la machine crache des
   étincelles…), puis ce que l'on gagne ou perd se voit.
   ============================================================ */
const XE_KIND = {"Terminal abandonné":"term", "Fragment instable":"shard", "Cage de données":"cage", "Miroir de secteur":"mirror",
  "Sauvegarde orpheline":"save", "Distributeur défectueux":"vend", "Colonne de bruit":"noise", "Ancien archiviste":"ghost"};
function xsEventArt(run, p, ev){
  const k = XE_KIND[ev.n] || "shard";
  const chosen = p.choice;
  switch(k){
    case "term": return `<div class="xe-term ${chosen === 1 ? "wiped" : ""}"><div class="xe-crt">
        <div class="xe-line">&gt; FORMULAIRE D'IDENTIFICATION</div><div class="xe-line">&gt; NOM : <span class="xe-name">${chosen === 0 ? esc((S.profile && S.profile.name) || "ARCHIVISTE") : ""}</span><i class="xe-cur"></i></div>
        <div class="xe-line dim">&gt; EN ATTENTE…</div></div><div class="xe-desk"></div></div>`;
    case "shard": return `<div class="xe-shardwrap ${chosen === 0 ? "absorbed" : chosen === 1 ? "left" : ""}"><span class="xe-ring"></span><span class="xe-ring r2"></span><div class="xe-shard"></div></div>
      ${xsTeam(run, {size:44, cls:"xe-low"})}`;
    case "cage": return `<div class="xe-cage ${chosen === 0 ? "open" : ""}"><div class="xe-bars"></div><div class="xe-loop">${pmdCanvas(p.cid || 25, 0, 96, {walk:true})}</div></div>`;
    case "mirror": return `<div class="xe-mirror ${chosen === 0 ? "cross" : ""}">${xsTeam(run, {walk:true, size:46, dir:2, cls:"xe-real"})}
        <div class="xe-glass"></div>${xsTeam(run, {walk:true, size:46, dir:6, cls:"xe-twin"})}</div>`;
    case "save": return `<div class="xe-save ${chosen === 1 ? "deleted" : chosen === 0 ? "read" : ""}"><div class="xe-file">
        <b>SAUVEGARDE · CYCLE 07</b><small>Archiviste : <span class="xe-glitch" data-t="R▓IKA">R▓IKA</span></small>
        <small>Intégrité : 64,8 %</small><small>Dernière position : ici.</small></div></div>`;
    case "vend": return `<div class="xe-vend ${chosen === 0 ? (p.fx && p.fx.dmg ? "zap" : "pay") : ""}"><div class="xe-vtop">DISTRIB'</div>
        <div class="xe-vglass"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="xe-vbtn"><span></span><span></span><span></span></div><div class="xe-vslot"></div></div>`;
    case "noise": return `<canvas class="xe-noise ${chosen === 0 ? "touched" : chosen === 1 ? "calm" : ""}" width="60" height="200"></canvas>
      ${xsTeam(run, {size:44, cls:"xe-low"})}`;
    case "ghost": return `<div class="xe-ghost ${chosen === 0 ? "rest" : chosen === 1 ? "robbed" : ""}">${trainerArt("scientist", 150)}<span class="xe-bag">${xpxIcon("bag", 3)}</span></div>
      <div class="xe-wisps"><i></i><i></i><i></i><i></i></div>`;
  }
  return "";
}
/* ce qui bouge en continu : le bruit de la colonne */
function xsEventLive(run, p, ev){
  const c = document.querySelector("#xscene canvas.xe-noise");
  if(!c) return;
  const x = c.getContext("2d");
  const loop = () => {
    if(!c.isConnected) return;
    const calm = c.classList.contains("calm");
    const img = x.createImageData(60, 200);
    for(let i = 0; i < img.data.length; i += 4){
      const col = (i / 4) % 60, edge = Math.abs(col - 30) / 30;
      const v = Math.random() * 255 * (1 - edge * edge) * (calm ? 0.35 : 1);
      img.data[i] = v * 0.7; img.data[i + 1] = v * 0.6; img.data[i + 2] = v; img.data[i + 3] = 255 * (1 - edge);
    }
    x.putImageData(img, 0, 0);
    requestAnimationFrame(loop);
  };
  loop();
}
/* ce que le choix a donné ou coûté, en images */
function xsOutcome(run, p, fx){
  let h = "";
  if(fx.bits > 0) h += `<div class="xo-coins">${Array.from({length:14}, (_, i)=>`<i style="--x:${(i * 37) % 100}%;--d:${i * 60}ms">${ic("coin")}</i>`).join("")}</div>
    <div class="xo-big gold" style="--d:300ms">+${fx.bits} Bits</div>`;
  if(fx.heal > 0) h += `${xsTeam(run, {bars:true, from:fx.before, size:46, walk:true, cls:"xo-team"})}<div class="xo-sparks">${Array.from({length:16}, (_, i)=>`<i style="--x:${8 + (i * 53) % 84}%;--y:${(i * 31) % 90}%;--d:${200 + (i * 97) % 700}ms"></i>`).join("")}</div>
    <div class="xo-big ok" style="--d:400ms">PV restaurés</div>`;
  if(fx.dmg) h += `${xsTeam(run, {bars:true, from:fx.before, size:46, cls:"xo-team hurt"})}<div class="xo-hit"></div>
    <div class="xo-big bad" style="--d:200ms">−${fx.dmg}% de PV</div>`;
  if(fx.heals > 0) h += `<div class="xo-item" style="--d:500ms">${itemIcon("potion", 40) || ic("heart")}<b>+${fx.heals} Restauration${fx.heals > 1 ? "s" : ""}</b></div>`;
  if(fx.corr) h += `<div class="xo-corr"></div><div class="xo-big bad" style="--d:600ms;top:20%">Corruption +${fx.corr}</div>`;
  if(fx.joined) h += `<div class="xs-wild" style="bottom:18%"><div class="xs-wm" style="--d:600ms">${pmdCanvas(fx.joined, 0, 110)}</div></div>
    <div class="xo-big ok" style="--d:1100ms;top:20%">${esc(POKE[fx.joined].name)} rejoint l'équipe</div>`;
  if(fx.relic) h += xsRelic(RELICS.find(r=>r.id === fx.relic), 700);
  return `<div class="xo">${h}</div>`;
}
function xsOutcomeLive(fx){
  if(fx.heal > 0 || fx.dmg) xsBars(600);
  if(fx.bits > 0 && typeof Sfx !== "undefined") setTimeout(()=>Sfx.coin(), 250);
  if(fx.dmg){ if(typeof shakeApp === "function") shakeApp(); arTone && arTone(120, .3, "sawtooth", .06, 60); }
  if(fx.relic && typeof Sfx !== "undefined") setTimeout(()=>Sfx.win(), 800);
}
function xsFxLine(fx){
  if(!fx) return "";
  const b = [];
  if(fx.bits > 0) b.push(`<span class="gold-t">+${fx.bits} Bits</span>`);
  if(fx.heal > 0) b.push(`<span class="ok">+${fx.heal}% de PV</span>`);
  if(fx.dmg) b.push(`<span class="bad">−${fx.dmg}% de PV</span>`);
  if(fx.heals > 0) b.push(`<span class="ok">+${fx.heals} restauration</span>`);
  if(fx.corr) b.push(`<span class="bad">corruption +${fx.corr}</span>`);
  if(fx.relic) b.push(`<span class="vi">relique</span>`);
  if(fx.joined) b.push(`<span class="cy">nouvelle recrue</span>`);
  return b.length ? `<div class="xs-fx">${b.join(" · ")}</div>` : "";
}

/* ============================================================
   UN GAIN SE VOIT
   Une recrue qui rejoint, un objet qu'on confie, un achat : une
   petite apparition au centre du plateau avant de repartir.
   ============================================================ */
function xsGain(art, title, sub, then){
  const st = document.querySelector("#xscene .xs-stage");
  if(!st){ if(then) then(); return; }
  const g = document.createElement("div");
  g.className = "xs-gain";
  g.innerHTML = `<div class="xg-rays"></div><div class="xg-art">${art}</div><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}`;
  st.appendChild(g);
  pmdWake();
  document.querySelectorAll("#xscene .xs-panel button").forEach(b=>{ b.disabled = true; });
  if(typeof Sfx !== "undefined") Sfx.coin();
  setTimeout(()=>{ if(then) then(); }, 1250);
}

/* les niveaux gagnés, en une ligne */
function xsLvLine(ups){
  if(!ups || !ups.length) return "";
  const n = ups[0].to - ups[0].from;
  return `<div class="xs-lv">${ic("star")} <b>+${n} niveau${n > 1 ? "x" : ""}</b> pour l'équipe · niveau moyen ${Math.round(ups.reduce((a, u)=>a + u.to, 0) / ups.length)}</div>`;
}
/* une évolution : la silhouette blanchit, clignote, et change */
function xsEvos(evos, low){
  if(!evos || !evos.length) return "";
  return `<div class="xs-evos ${low ? "low" : ""}">${evos.slice(0, 2).map((e, k)=>`
    <div class="xs-evo" style="--d:${600 + k * 1200}ms">
      <div class="xe-pair"><span class="xe-from">${pmdCanvas(e.from, 0, 84)}</span><span class="xe-to">${pmdCanvas(e.to, 0, 84)}</span></div>
      <div class="xe-txt">${esc(POKE[e.from].name)} évolue en <b>${esc(POKE[e.to].name)}</b> !</div>
    </div>`).join("")}</div>`;
}
/* une carte de Pokémon qui se retourne */
function xsMonCard(c, i, act, delay){
  const p = POKE[c.id];
  return `<button class="xs-card" style="--d:${delay}ms" data-act="${act}" data-i="${i}">
    <span class="xc-back">${itemIcon("ball:poke", 34)}</span>
    <span class="xc-face">${pmdCanvas(c.id, 0, 64)}
      <b>${esc(p.name)}</b>
      <span class="wrap" style="justify-content:center;gap:2px">${typeTags(p.types)}</span>
      <small>N.${c.lvl} · total ${p.bst}</small></span></button>`;
}
/* choisir un membre de l'équipe, dans la scène */
function xsTeamPick(run, act, showItem){
  return `<div class="xs-pick">${run.team.map((m, i)=>{
    const cur = showItem ? itemOf(m) : null;
    return `<button class="xs-pm ${m.hp <= 0 ? "ko" : ""}" data-act="${act}" data-i="${i}">
      ${pmdCanvas(m.id, 0, 40, {shiny:runShiny(m)})}
      <b>${esc(POKE[m.id].name)}</b><small>${showItem ? (cur ? esc(cur.n) : "aucun objet") : `N.${m.level} · ${m.hp > 0 ? m.hp + " PV" : "hors ligne"}`}</small></button>`;
  }).join("")}</div>`;
}
/* le texte s'écrit, comme dans les jeux ; un toucher l'achève */
function xsType(el, txt){
  if(!el) return;
  let i = 0;
  el.textContent = "";
  el.onclick = () => { i = txt.length; el.textContent = txt; };
  const step = () => { if(!el.isConnected || i >= txt.length){ el.textContent = txt; return; } i += 2; el.textContent = txt.slice(0, i); setTimeout(step, 22); };
  step();
}
/* un feu qui crépite, en quelques lignes */
function xsFire(){
  const c = document.querySelector("canvas.xs-fire"); if(!c) return;
  const x = c.getContext("2d"), parts = [];
  const loop = () => {
    if(!c.isConnected) return;
    x.clearRect(0, 0, 120, 120);
    for(let k = 0; k < 3; k++) parts.push({x:60 + (Math.random() - 0.5) * 26, y:96, vx:(Math.random() - 0.5) * 0.4, vy:-0.8 - Math.random() * 1.2, l:0, m:40 + Math.random() * 30, s:6 + Math.random() * 6});
    x.globalCompositeOperation = "lighter";
    for(let i = parts.length - 1; i >= 0; i--){
      const q = parts[i]; q.l++; q.x += q.vx; q.y += q.vy;
      if(q.l > q.m){ parts.splice(i, 1); continue; }
      const k = q.l / q.m;
      x.fillStyle = k < 0.25 ? "#fff3c4" : k < 0.55 ? "#ffc857" : k < 0.8 ? "#ff7a2e" : "#a3271c";
      x.globalAlpha = 1 - k; x.fillRect(Math.round(q.x - q.s * (1 - k) / 2), Math.round(q.y), Math.ceil(q.s * (1 - k)), Math.ceil(q.s * (1 - k)));
    }
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    x.fillStyle = "#4a2c1a"; x.fillRect(38, 100, 44, 6); x.fillStyle = "#2c1a10"; x.fillRect(44, 104, 32, 5);
    requestAnimationFrame(loop);
  };
  loop();
}

/* ============================================================
   6. LES CHOIX
   ============================================================ */
const xsRun = () => S.expedition;
ACTIONS.xsgo = () => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "enc") return;
  const p = run.pend;
  xsClose();
  expFight(run, p.kind, p.foes);
};
ACTIONS.xsloot = () => { const run = xsRun(); if(run) xsDone(run); else xsClose(); };
ACTIONS.xsok = () => { const run = xsRun(); if(run) xsDone(run); else xsClose(); };
ACTIONS.xsdraftback = () => { const run = xsRun(); if(!run || !run.pend) return; run.pend.step = null; run.pend.seen = true; expResume(run); };
ACTIONS.xsdraftskip = () => {
  const run = xsRun(); if(!run || !run.pend) return;
  const k = run.pend.k, b = k === "draft" ? 80 + run.floor * 8 : k === "swap" ? 60 + run.floor * 6 : 70 + run.floor * 7;
  run.bits += b;
  toast(`+${b} Bits`, "", "coin");
  xsDone(run);
};
ACTIONS.xsdraft = d => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "draft") return;
  const p = run.pend, c = p.list[+d.i]; if(!c) return;
  if(run.team.length < 6){
    run.team.push(newRunMon(run, c.id, c.lvl));
    save();
    xsGain(pmdCanvas(c.id, 0, 96, {walk:true}), POKE[c.id].name + " rejoint l'équipe", "niveau " + c.lvl, ()=>xsDone(run));
    return;
  }
  p.step = "replace"; p.pick = +d.i; save(); expResume(run);
};
ACTIONS.xsdraftrep = d => {
  const run = xsRun(); if(!run || !run.pend) return;
  const p = run.pend, c = p.list[p.pick], i = +d.i;
  if(!c || !run.team[i]) return;
  const out = run.team[i];
  run.team[i] = newRunMon(run, c.id, c.lvl);
  save();
  xsGain(pmdCanvas(c.id, 0, 96, {walk:true}), POKE[c.id].name + " rejoint l'équipe", POKE[out.id].name + " laisse sa place", ()=>xsDone(run));
};
ACTIONS.xsswap = d => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "swap") return;
  run.pend.step = "give"; run.pend.pick = +d.i; save(); expResume(run);
};
ACTIONS.xsswapgive = d => {
  const run = xsRun(); if(!run || !run.pend) return;
  const p = run.pend, c = p.list[p.pick], i = +d.i;
  if(!c || !run.team[i]) return;
  const out = run.team[i];
  /* l'echange rend un Pokemon quatre niveaux au-dessus de celui qu'on cede */
  run.team[i] = newRunMon(run, c.id, run.maps ? Math.min(100, out.level + 4) : c.lvl);
  save();
  xsGain(`<span class="xg-swap">${pmdCanvas(out.id, 0, 64)}<i>⇄</i>${pmdCanvas(c.id, 0, 64, {walk:true})}</span>`,
    POKE[c.id].name + " arrive au niveau " + run.team[i].level, POKE[out.id].name + " part par le terminal", ()=>xsDone(run));
};
ACTIONS.xsbadge = d => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "badge") return;
  const r = d.id && !run.relics.includes(d.id) && RELICS.find(x=>x.id === d.id);
  if(r) run.relics.push(d.id);
  /* la carte suivante : meme dessin, autres noeuds, autre decor */
  openSector(run, (run.mapIdx || 0) + 1);
  run.pend = {k:"sector"};
  save();
  if(r) xsGain(itemIcon("held:h_relic", 48) || ic("shard2"), "Relique : " + esc(r.n), esc(r.d), ()=>expResume(run));
  else expResume(run);
};
ACTIONS.xsrest = d => {
  const run = xsRun(); if(!run || !run.pend || run.pend.done) return;
  const p = run.pend;
  p.before = run.team.map(m=>m.hp);
  /* le Centre Pokemon d'un parcours a secteurs remet tout a neuf : c'est le prix du detour */
  if(d.k === "heal"){ healTeam(run, relicVal(run, "rest") || run.maps ? 1 : 0.62); p.done = "heal"; }
  else { p.done = "relic"; const r = rng() < 0.55 ? grantRelic(run) : null; p.relic = r ? r.id : null; }
  save(); expResume(run);
};
ACTIONS.xsbuy = d => {
  const run = xsRun(); if(!run || !run.shopStock) return;
  const it = run.shopStock[+d.i];
  if(!it) return;
  if(run.bits < it.p){ toast("Pas assez de Bits", "bad", "coin"); return; }
  run.bits -= it.p;
  if(it.k === "heal") healTeam(run, .45);
  if(it.k === "full") healTeam(run, 1);
  if(it.k === "relic"){ const r = grantRelic(run); run.pend.relic = r ? r.id : null; if(!r) toast("Plus rien à acheter", "warn", "shard2"); }
  if(it.k === "hp") for(const m of run.team){ m.maxHp = Math.floor(m.maxHp * 1.18); if(m.hp > 0) m.hp += Math.floor(m.maxHp * 0.18); }
  run.shopStock.splice(+d.i, 1);
  save();
  /* l'achat se voit : l'objet passe du comptoir a l'equipe */
  if(it.k !== "relic"){
    run.pend.keepStage = true;
    const st = document.querySelector("#xscene .xs-stage");
    if(st){ const g = document.createElement("div"); g.className = "xs-buy"; g.innerHTML = (itemIcon(it.ic, 44) || "") + `<b>${esc(it.n)}</b>`; st.appendChild(g); setTimeout(()=>g.remove(), 1300); }
    if(typeof Sfx !== "undefined") Sfx.coin();
  }
  /* la relique s'affiche sur le plateau : on le redessine */
  if(it.k === "relic"){ const el = document.getElementById("xscene"); if(el) el.dataset.kind = ""; }
  expResume(run);
};
ACTIONS.xsitem = d => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "items" || !EXP_ITEMS[d.id]) return;
  run.pend.step = "give"; run.pend.pick = d.id; save(); expResume(run);
};
ACTIONS.xsitemgive = d => {
  const run = xsRun(); if(!run || !run.pend) return;
  const id = run.pend.pick, m = run.team[+d.i];
  if(!m || !EXP_ITEMS[id]) return;
  const old = m.item;
  m.item = id;
  save();
  xsGain(`<span class="xg-give">${itemIcon("exp:" + id, 40) || ""}${pmdCanvas(m.id, 0, 80)}</span>`, POKE[m.id].name + " porte " + EXP_ITEMS[id].n,
    old && EXP_ITEMS[old] ? EXP_ITEMS[old].n + " est abandonné" : EXP_ITEMS[id].d, ()=>xsDone(run));
};
ACTIONS.xsev = d => {
  const run = xsRun(); if(!run || !run.pend || run.pend.k !== "event" || run.pend.res) return;
  const p = run.pend, ev = EXP_EVENTS[p.e], o = ev && ev.opts[+d.i];
  if(!o) return;
  const hpPct = () => run.team.reduce((a, m)=>a + Math.max(0, m.hp) / m.maxHp, 0) / Math.max(1, run.team.length);
  const b0 = run.bits, h0 = hpPct(), heals0 = run.heals, c0 = run.corruption, rel0 = run.relics.length, n0 = run.team.length;
  const before = run.team.map(m=>m.hp);
  p.choice = +d.i;
  p.res = o.f(run) || "…";
  const h1 = hpPct();
  p.fx = {bits:run.bits - b0, heal:h1 > h0 + 0.001 ? Math.round((h1 - h0) * 100) : 0, dmg:h1 < h0 - 0.001 ? Math.round((h0 - h1) * 100) : 0,
          heals:run.heals - heals0, corr:run.corruption - c0, before,
          relic:run.relics.length > rel0 ? run.relics[run.relics.length - 1] : null,
          joined:run.team.length > n0 ? run.team[run.team.length - 1].id : null};
  save(); expResume(run);
};

/* l'atlas des dresseurs n'est ecrit qu'une fois, en variable CSS */
try { if(typeof TRAINER_ATLAS !== "undefined" && document.documentElement && document.documentElement.style)
  document.documentElement.style.setProperty("--trainer-atlas", `url(${TRAINER_ATLAS})`); } catch(e){}
