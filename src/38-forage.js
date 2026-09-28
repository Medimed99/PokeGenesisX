/* ============================================================
   38 — LE FORAGE
   L'ancien module empilait quatre generateurs et un bouton de
   conversion : aucune decision, aucune decouverte. Le genre a
   pourtant des regles connues, et elles convergent toutes :

   · une boucle simple qui se complexifie LENTEMENT ;
   · des paliers qui debloquent des MECANIQUES, pas des chiffres ;
   · une automatisation qui reduit le travail manuel ;
   · un prestige qui compose sur PLUSIEURS axes permanents ;
   · un plafond hors ligne que l'on repousse ;
   · de la decouverte, pas seulement de l'optimisation.

   D'ou : on fore dans les couches du reve. La profondeur est la
   progression, chaque strate ouvre quelque chose de nouveau, et
   le recalibrage convertit tout en Echos.
   ============================================================ */

/* ---------- strates ----------
   Chaque palier double environ le rendement, mais surtout : chacun
   ouvre une mecanique. C'est ce qui evite la courbe plate. */
const STRATA = [
  {n:"Surface",        need:0,        mul:1,    c:"#8ea3bd",
   d:"Le bruit de fond des entités archivées. À peine exploitable.",
   unlock:null},
  {n:"Couche molle",   need:800,      mul:1.8,  c:"#5ce07a",
   d:"Les rêves récents. Ils s'effritent vite mais ils sont nombreux.",
   unlock:{k:"auto", n:"Sondes automatiques", d:"Le forage continue sans vous."}},
  {n:"Sédiment",       need:25000,    mul:3.2,    c:"#4fb2ff",
   d:"Des couches tassées par des années d'inactivité.",
   unlock:{k:"crit", n:"Percussion", d:"Vos frappes peuvent doubler leur valeur."}},
  {n:"Veine froide",   need:400000,   mul:6,   c:"#9fe7f0",
   d:"Le premier filon véritable. Le système ne l'avait pas indexé.",
   unlock:{k:"vein", n:"Filons", d:"Des veines riches apparaissent par intermittence."}},
  {n:"Socle",          need:8e6,      mul:11,   c:"#c9a86a",
   d:"De la donnée compactée à un point qu'aucun outil récent ne lit.",
   unlock:{k:"offline", n:"Réservoir profond", d:"Le forage hors ligne tient bien plus longtemps."}},
  {n:"Nappe chaude",   need:2e8,      mul:20,  c:"#ff8a3d",
   d:"Ça résiste. Ça chauffe. Ça rapporte.",
   unlock:{k:"find", n:"Trouvailles", d:"Le forage remonte parfois autre chose que de l'Énergie."}},
  {n:"Faille mineure", need:6e9,      mul:38,  c:"#b06bff",
   d:"Une fracture ancienne. On entend quelque chose au fond.",
   unlock:{k:"echo", n:"Échos", d:"Le recalibrage devient possible."}},
  {n:"Substrat",       need:2.5e11,   mul:70, c:"#ff3d7f",
   d:"Sous les rêves, il y a ce qui rêvait avant.",
   unlock:{k:"combo", n:"Cadence", d:"Frapper sans relâche fait monter un multiplicateur."}},
  {n:"Noyau onirique", need:1.2e13,   mul:130, c:"#ffd24a",
   d:"La source. Personne n'a jamais expliqué pourquoi elle est là.",
   unlock:{k:"final", n:"Rendement souverain", d:"Chaque Écho vaut davantage."}}
];

function forage(){
  S.forage = S.forage || {
    energy:0, total:0, depth:0, drills:{}, echoes:0, perks:{},
    combo:0, comboAt:0, vein:0, best:0, resets:0, found:0
  };
  return S.forage;
}
function stratum(){ return STRATA[Math.min(forage().depth, STRATA.length - 1)]; }
function nextStratum(){ return STRATA[forage().depth + 1] || null; }
function unlocked(k){
  const d = forage().depth;
  for(let i = 0; i <= d; i++) if(STRATA[i].unlock && STRATA[i].unlock.k === k) return true;
  return false;
}

/* ---------- sondes ---------- */
const DRILLS = [
  {k:"main",   n:"Sonde manuelle",    base:0.5,   cost:60,     c:"#8ea3bd",
   d:"Une tête de forage rudimentaire. Elle tourne, c'est déjà ça."},
  {k:"double", n:"Sonde jumelée",     base:4,     cost:900,    c:"#5ce07a",
   d:"Deux têtes, une seule alimentation. Le rendement n'est pas doublé, il est meilleur."},
  {k:"reso",   n:"Foreuse à résonance",base:32,   cost:14000,  c:"#4fb2ff",
   d:"Elle fait vibrer la strate à sa fréquence propre. La donnée se détache seule."},
  {k:"thermo", n:"Colonne thermique", base:260,   cost:220000, c:"#ff8a3d",
   d:"Elle chauffe la couche jusqu'à ce qu'elle cède."},
  {k:"quantum",n:"Sonde indécise",    base:2100,  cost:3.4e6,  c:"#b06bff",
   d:"Elle fore à plusieurs profondeurs à la fois, tant que personne ne regarde."},
  {k:"origine",n:"Tête d'origine",    base:17000, cost:5.2e7,  c:"#ffd24a",
   d:"Retrouvée au fond. Elle n'a pas été fabriquée pour ce monde."}
];
function drillCost(d){
  const n = forage().drills[d.k] || 0;
  return Math.ceil(d.cost * Math.pow(1.20, n));
}
function drillCount(){ return DRILLS.reduce((a,d)=>a + (forage().drills[d.k]||0), 0); }

/* ---------- axes permanents du recalibrage ----------
   Plusieurs axes, pas un multiplicateur unique : c'est la difference
   entre un prestige plat et un prestige ou l'on choisit. */
const ECHO_PERKS = {
  e_yield:  {n:"Rendement",     max:10, cost:l=>2 + l*2,
             d:l=>`+${25*(l+1)}% d'Énergie produite.`},
  e_click:  {n:"Frappe",        max:10, cost:l=>2 + l*2,
             d:l=>`Frappe manuelle ×${(1 + (l+1)*0.6).toFixed(1)}.`},
  e_offline:{n:"Réservoir",     max:8,  cost:l=>3 + l*3,
             d:l=>`Forage hors ligne porté à ${12 + (l+1)*6} heures.`},
  e_depth:  {n:"Pénétration",   max:6,  cost:l=>4 + l*4,
             d:l=>`Descendre coûte ${Math.round(100 - (l+1)*8)}% de l'Énergie requise.`},
  e_luck:   {n:"Flair",         max:6,  cost:l=>3 + l*3,
             d:l=>`Filons et trouvailles ${(1 + (l+1)*0.35).toFixed(2)}× plus fréquents.`},
  e_echo:   {n:"Résonance",     max:5,  cost:l=>6 + l*5,
             d:l=>`+${20*(l+1)}% d'Échos au recalibrage.`}
};
function perkLvF(k){ return (forage().perks || {})[k] || 0; }
function echoMul(k, per){ return 1 + per * perkLvF(k); }

/* ---------- production ---------- */
function forageRate(){
  const f = forage();
  let r = 0;
  for(const d of DRILLS) r += (f.drills[d.k] || 0) * d.base;
  r *= stratum().mul;
  r *= echoMul("e_yield", 0.25);
  r *= 1 + f.echoes * 0.02;               /* les Echos detenus comptent aussi */
  if(f.vein > Date.now()) r *= 5;         /* filon actif */
  return r;
}
function clickValue(){
  const f = forage();
  let v = 1.5 + forageRate() * 0.06;
  v *= stratum().mul * 0.4 + 0.6;
  v *= echoMul("e_click", 0.6);
  if(unlocked("combo")) v *= 1 + Math.min(2, f.combo * 0.04);
  if(f.vein > Date.now()) v *= 5;
  return Math.max(1, v);
}
function offlineHours(){ return unlocked("offline") ? 12 + perkLvF("e_offline") * 6 : 8; }
function depthCost(){
  const nx = nextStratum();
  if(!nx) return null;
  return Math.ceil(nx.need * (1 - perkLvF("e_depth") * 0.08));
}
/* Echos rendus par un recalibrage : racine du total, pour que le premier
   recalibrage vienne vite et les suivants demandent un vrai palier */
function echoGain(){
  const f = forage();
  if(!unlocked("echo")) return 0;
  const base = Math.floor(Math.pow(f.total / 2e8, 0.42));
  return Math.max(0, Math.round(base * echoMul("e_echo", 0.20)));
}

/* l'Energie foree fait avancer les quetes « Forer n d'Energie » — sans ce
   branchement, elles etaient devenues impossibles depuis la refonte */
function forageQuest(n){
  if(!(n > 0)) return;
  S.daily.dayEnergy = (S.daily.dayEnergy || 0) + n;
  questTick("dayEnergy", n);
}
function forageTick(dt){
  const f = forage();
  if(!unlocked("auto")) return;             /* avant la Couche molle, on ne fait que frapper */
  const gain = forageRate() * dt;
  if(gain <= 0) return;
  f.energy += gain; f.total += gain;
  f.best = Math.max(f.best, f.energy);
  forageQuest(gain);
  /* filons : ils cassent la monotonie et recompensent la presence */
  if(unlocked("vein") && f.vein < Date.now() && rng() < 0.004 * dt * echoMul("e_luck", 0.35)){
    f.vein = Date.now() + 30000;
    toast("Filon ouvert — rendement ×5 pendant 30 s", "warn", "bolt");
    Sfx.win(); buzz([20,30,20]);
  }
  /* trouvailles : la part de decouverte, sans quoi on n'optimise que des chiffres */
  if(unlocked("find") && rng() < 0.0018 * dt * echoMul("e_luck", 0.35)) forageFind();
  saveSoon();
}
function forageFind(){
  const f = forage();
  f.found++;
  const roll = rng();
  /* un fossile d'abord : c'est la trouvaille qui ne s'obtient nulle part ailleurs */
  if(roll < 0.16){
    grantEgg("f_fossil");
    toast("Le forage remonte un Fossile — à reconstituer à la couveuse", "warn", "stone");
    Sfx.win();
    return;
  }
  if(roll < 0.42){ const n = 20 + f.depth * 15; gain("shards", n);
    toast(`Le forage remonte ${n} Fragments`, "", "shard"); }
  else if(roll < 0.72){ const n = 1 + Math.floor(f.depth / 3); gain("cores", n);
    toast(`Le forage remonte ${n} Noyau(x)`, "warn", "core"); }
  else if(roll < 0.88 && typeof randomHeld === "function"){
    const h = randomHeld();
    if(h && grantHeld(h)) toast(`Objet tenu remonté : ${HELD_ITEMS[h].n}`, "warn", "star");
    else gain("shards", 40);
  }
  else if(typeof grantEgg === "function"){
    const t = f.depth >= 6 ? "e_epic" : f.depth >= 3 ? "e_rare" : "e_common";
    grantEgg(t);
    toast(`Ébauche remontée du forage : ${EGG_TIERS[t].n}`, "warn", "box");
  }
  Sfx.coin();
}

/* ---------- actions ---------- */
ACTIONS.forhit = () => {
  const f = forage();
  const v = clickValue();
  f.energy += v; f.total += v;
  forageQuest(v);
  /* cadence : frapper sans relache fait monter un multiplicateur qui retombe */
  if(unlocked("combo")){
    const now = Date.now();
    f.combo = (now - f.comboAt < 1200) ? Math.min(50, f.combo + 1) : 1;
    f.comboAt = now;
  }
  let crit = false;
  if(unlocked("crit") && rng() < 0.12){ f.energy += v; f.total += v; crit = true; }
  Sfx.click(); buzz(crit ? 12 : 5);
  forHitFx(v * (crit ? 2 : 1), crit);
  saveSoon();
  forRenderLive();
};
ACTIONS.forbuy = d => {
  if(!unlocked("auto")) return;
  const dr = DRILLS.find(x=>x.k === d.k), f = forage();
  const c = drillCost(dr);
  if(f.energy < c){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= c;
  f.drills[dr.k] = (f.drills[dr.k] || 0) + 1;
  Sfx.coin();
  save(); refresh();
};
ACTIONS.fordeep = () => {
  const f = forage(), nx = nextStratum(), c = depthCost();
  if(!nx || f.energy < c) return;
  f.energy -= c;
  f.depth++;
  if(f.depth === 2 && !S.flags.firstFossil){
    S.flags.firstFossil = true;
    grantEgg("f_fossil");
    setTimeout(()=>toast("Quelque chose de très ancien affleure : un Fossile", "warn", "stone"), 700);
  }
  Sfx.win(); buzz([25,40,70]); shakeApp();
  save();
  const st = stratum();
  sheet(`<div class="center">
    <div class="h" style="justify-content:center;color:${st.c}">${esc(st.n.toUpperCase())}</div>
    <div class="tiny muted" style="margin:9px 0 12px">${esc(st.d)}</div>
    ${st.unlock ? `<div class="panel bracket" style="text-align:left">
      <div class="h sm">NOUVEAU — ${esc(st.unlock.n.toUpperCase())}</div>
      <div class="tiny">${esc(st.unlock.d)}</div>
    </div>` : ""}
    <div class="tiles" style="margin-top:10px">
      <div class="tile accent"><div class="k">Rendement</div><div class="v">×${st.mul}</div></div>
      <div class="tile"><div class="k">Profondeur</div><div class="v">${f.depth + 1}/${STRATA.length}</div></div>
    </div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Continuer</button>
  </div>`, true);
};
ACTIONS.forreset = () => {
  const g = echoGain();
  if(g <= 0){ toast("Pas encore assez foré pour un recalibrage", "bad", "cross"); return; }
  sheet(`${sheetHead("Recalibrer le forage ?")}
    <div class="tiny muted">L'Énergie, les sondes et la profondeur repartent de zéro.
      Les Échos, eux, ne s'effacent jamais — et chacun rend le forage suivant plus rapide.</div>
    <div class="tiles" style="margin:10px 0">
      <div class="tile gold"><div class="k">Échos gagnés</div><div class="v">+${g}</div></div>
      <div class="tile accent"><div class="k">Recalibrages</div><div class="v">${forage().resets + 1}</div></div>
    </div>
    <div class="btn-grid c2">
      <button class="btn ghost" data-act="closesheet">Annuler</button>
      <button class="btn dan" data-act="forresetdo">Recalibrer</button>
    </div>`, true);
};
ACTIONS.forresetdo = () => {
  const f = forage(), g = echoGain();
  f.echoes += g; f.resets++;
  f.energy = 0; f.total = 0; f.depth = 0; f.drills = {};   /* la capture autonome est conservee */
  f.combo = 0; f.vein = 0;
  Sfx.win(); shakeApp();
  save(); closeSheet(); refresh();
  toast(`+${g} Échos — le forage repart plus vite`, "warn", "star");
};
ACTIONS.forperk = d => {
  const f = forage(), p = ECHO_PERKS[d.k], lv = perkLvF(d.k);
  if(lv >= p.max) return;
  const c = p.cost(lv);
  if(f.echoes < c){ toast("Échos insuffisants", "bad", "cross"); return; }
  f.echoes -= c;
  f.perks = f.perks || {};
  f.perks[d.k] = lv + 1;
  Sfx.win();
  save(); refresh();
};
ACTIONS.forconv = d => {
  const f = forage();
  const packs = {
    coins:  {cost:300,   give:()=>gain("coins", Math.round(100 * (1 + f.depth * 0.6))), n:"PokéCoins"},
    shards: {cost:9000,  give:()=>gain("shards", 10 + f.depth * 4),                     n:"Fragments"},
    cores:  {cost:260000,give:()=>gain("cores", 1 + Math.floor(f.depth / 4)),           n:"Noyaux"}
  }[d.k];
  if(!packs || f.energy < packs.cost){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= packs.cost;
  packs.give();
  Sfx.coin();
  save(); refresh();
};

/* ---------- retours visuels ---------- */
function forHitFx(v, crit){
  const host = document.getElementById("for-stage");
  if(!host) return;
  const d = document.createElement("div");
  d.className = "forpop" + (crit ? " crit" : "");
  d.textContent = "+" + fmt(Math.round(v));
  d.style.left = (28 + rng() * 44) + "%";
  host.appendChild(d);
  setTimeout(()=>d.remove(), 900);
  const ball = document.getElementById("gball");
  if(ball){ ball.classList.remove("hit"); void ball.offsetWidth; ball.classList.add("hit"); }
}
function forRenderLive(){
  const f = forage();
  const e = document.getElementById("for-energy");
  if(e) e.textContent = fmt(Math.floor(f.energy));
  const c = document.getElementById("for-combo");
  if(c) c.textContent = f.combo > 1 ? `×${(1 + Math.min(2, f.combo * 0.04)).toFixed(2)}` : "";
}

/* ============================================================
   LA SPHÈRE
   Une vraie sphere CSS : une coque ombree pour le volume, et huit
   meridiens en rotation 3D pour la profondeur. Sa vitesse suit la
   production, sa lueur l'Energie stockee, et elle encaisse chaque
   frappe. C'est le seul element du jeu qui bouge en permanence :
   il fallait qu'il soit juste.
   ============================================================ */
function genesisBall(){
  const f = forage();
  const rate = forageRate();
  /* la rotation accelere avec la production, sans jamais devenir illisible */
  const spin = clamp(14 - Math.log10(Math.max(1, rate)) * 2.1, 2.2, 14);
  const heat = clamp(Math.log10(Math.max(1, rate)) / 5, 0, 1);
  const st = stratum();
  const vein = f.vein > Date.now();
  return `<div class="gball ${vein?"vein":""} ${heat>0.55?"hot":""}" id="gball"
      style="--spin:${spin.toFixed(2)}s;--heat:${heat.toFixed(2)};--sc:${st.c}"
      data-act="forhit">
    <div class="gb-halo"></div>
    <div class="gb-rings">
      ${Array.from({length:8},(_,i)=>`<i style="--a:${i*22.5}deg"></i>`).join("")}
    </div>
    <div class="gb-shell">
      <div class="gb-top"><span class="gb-trace"></span></div>
      <div class="gb-bot"></div>
      <div class="gb-band"></div>
      <div class="gb-btn"><i></i></div>
      <div class="gb-shade"></div>
      <div class="gb-spec"></div>
    </div>
    ${vein?'<div class="gb-veinmark">FILON</div>':""}
  </div>`;
}

SCREENS.idle = {
  after(){
    tutoMaybe("idle");
    clearInterval(SCREENS.idle._t);
    SCREENS.idle._t = setInterval(()=>{
      if(!document.getElementById("for-energy")){ clearInterval(SCREENS.idle._t); return; }
      forRenderLive();
    }, 200);
  },
  html(){
    const f = forage();
    const st = stratum(), nx = nextStratum();
    const rate = forageRate(), cost = depthCost();
    const eg = echoGain();
    return `
      <div class="h">${ic("bolt")} LE FORAGE ${infoBtn("forage")}</div>
      <div class="sub">Les Pokémon archivés continuent de rêver. Ce bruit-là s'extrait.</div>
      ${moduleGoal("Frappez la sphère, achetez des sondes, descendez de strate en strate. Chaque palier ouvre une mécanique nouvelle, pas seulement un meilleur rendement.",
        "De l'Énergie convertible, des trouvailles, et des Échos qui accélèrent définitivement les forages suivants.")}

      <div class="forhead" style="--sc:${st.c}">
        <div class="fh-strat">
          <span class="fh-n">${esc(st.n)}</span>
          <span class="fh-d">profondeur ${f.depth + 1} / ${STRATA.length} · rendement ×${st.mul}</span>
        </div>
        <div class="fh-rate">${fmt(Math.round(rate * 10) / 10)}<em>/s</em></div>
      </div>

      <div class="for-stage" id="for-stage">
        ${genesisBall()}
        <div class="for-energy"><b id="for-energy">${fmt(Math.floor(f.energy))}</b>
          <span>Énergie</span><em id="for-combo"></em></div>
      </div>

      ${nx ? `<div class="panel tight fordeep">
        <div class="row between">
          <div class="h sm" style="margin:0">DESCENDRE — ${esc(nx.n)}</div>
          <button class="btn xs ${f.energy>=cost?"gold":""}" data-act="fordeep"
            ${f.energy>=cost?"":"disabled"}>${fmt(cost)}</button>
        </div>
        <div class="bar thin" style="margin-top:6px">
          <i style="width:${Math.min(100, f.energy/cost*100)}%"></i></div>
        ${nx.unlock?`<div class="tiny cy" style="margin-top:5px">Ouvre : ${esc(nx.unlock.n)} —
          ${esc(nx.unlock.d)}</div>`:""}
      </div>` : `<div class="panel tight"><div class="tiny ok">Vous avez atteint le noyau onirique.
        Il n'y a rien en dessous — ou rien que le système accepte de décrire.</div></div>`}

      <div class="h sm">SONDES</div>
      ${!unlocked("auto") ? `<div class="empty">Aucune sonde ne tient à la Surface. Frappez la sphère
        jusqu'à la Couche molle : c'est là que le forage peut commencer à tourner sans vous.</div>` : ""}
      <div class="list" ${unlocked("auto")?"":'style="display:none"'}>
        ${DRILLS.map((d,i)=>{
          const n = f.drills[d.k] || 0;
          const c = drillCost(d);
          const locked = i > 0 && !(f.drills[DRILLS[i-1].k] >= 3 || n > 0);
          if(locked && n === 0 && i > 1 && !(f.drills[DRILLS[i-2].k] > 0)) return "";
          return `<div class="drillrow ${f.energy>=c?"can":""}" style="--dc:${d.c}">
            <div class="dr-ic">${ic("bolt")}</div>
            <div class="grow">
              <div class="row between"><span class="tiny">${esc(d.n)}</span>
                <span class="tiny dim mono-num">${n}</span></div>
              <div class="tiny muted">${esc(d.d)}</div>
              <div class="tiny cy">${fmt(d.base)} /s pièce · ${fmt(Math.round(n*d.base*st.mul))} /s au total</div>
            </div>
            <button class="btn xs ${f.energy>=c?"pri":""}" data-act="forbuy" data-k="${d.k}"
              ${f.energy>=c?"":"disabled"}>${fmt(c)}</button>
          </div>`;}).join("")}
      </div>

      <div class="h sm" style="margin-top:12px">CONVERTIR</div>
      <div class="btn-grid c3">
        <button class="btn sm" data-act="forconv" data-k="coins"
          ${f.energy>=300?"":"disabled"}>300 → ${fmt(Math.round(100*(1+f.depth*0.6)))} coins</button>
        <button class="btn sm" data-act="forconv" data-k="shards"
          ${f.energy>=9000?"":"disabled"}>9 k → ${10+f.depth*4} frag.</button>
        <button class="btn sm" data-act="forconv" data-k="cores"
          ${f.energy>=260000?"":"disabled"}>260 k → ${1+Math.floor(f.depth/4)} noyau</button>
      </div>

      ${botPanel()}

      ${unlocked("echo") ? `
        <div class="h sm" style="margin-top:12px">RECALIBRAGE</div>
        <div class="panel bracket">
          <div class="row between tiny"><span class="muted">Échos détenus</span>
            <b class="gold-t mono-num">${f.echoes}</b></div>
          <div class="row between tiny"><span class="muted">Gain au recalibrage</span>
            <b class="cy mono-num">+${eg}</b></div>
          <div class="tiny muted" style="margin:6px 0 8px">Tout repart de zéro, sauf les Échos.
            Chacun accélère définitivement les forages suivants — et il y a plusieurs façons de
            les dépenser.</div>
          <button class="btn dan wide sm" data-act="forreset" ${eg>0?"":"disabled"}>
            Recalibrer pour ${eg} Écho(s)</button>
        </div>
        <div class="list">
          ${Object.entries(ECHO_PERKS).map(([k,p])=>{
            const lv = perkLvF(k), maxed = lv >= p.max, c = p.cost(lv);
            return `<div class="item ${maxed?"on":""}">
              <div class="perk-lv">${lv}/${p.max}</div>
              <div class="grow"><div class="t">${esc(p.n)}</div>
                <div class="d">${esc(maxed ? p.d(lv-1) : p.d(lv))}</div></div>
              ${maxed?`<span class="tiny cy">max</span>`
                : `<button class="btn sm ${f.echoes>=c?"gold":""}" data-act="forperk" data-k="${k}"
                     ${f.echoes>=c?"":"disabled"}>${c}</button>`}
            </div>`;}).join("")}
        </div>` : ""}

      <div class="tiles" style="margin-top:11px">
        <div class="tile accent"><div class="k">Extrait au total</div><div class="v">${fmt(Math.floor(f.total))}</div></div>
        <div class="tile gold"><div class="k">Trouvailles</div><div class="v">${f.found}</div></div>
        <div class="tile"><div class="k">Hors ligne</div><div class="v">${offlineHours()} h</div></div>
        <div class="tile"><div class="k">Recalibrages</div><div class="v">${f.resets}</div></div>
      </div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};

/* ============================================================
   CAPTURE AUTONOME
   L'Energie ne servait qu'a se convertir. Elle lance maintenant des
   sessions de capture automatique, sur le modele du catchbot de
   PokeMeow : elles rapportent des Pokemon, et RIEN d'autre — ni
   PokeCoins, ni chaine, ni quetes. C'est un second idle, oriente
   collection plutot que chiffres.
   ============================================================ */
const BOT_AXES = {
  rate: {n:"Cadence",  max:10, d:l=>`${4 + 3*l} Pokémon par heure`},
  cost: {n:"Économie", max:10, d:l=>`coût horaire −${Math.round((1 - Math.pow(0.88, l))*100)}%`},
  dur:  {n:"Autonomie",max:10, d:l=>`sessions de ${2 + l} h`}
};
function bot(){
  const f = forage();
  f.bot = f.bot || {lv:{rate:0, cost:0, dur:0}, until:0, hours:0, rate:0, claimed:true};
  return f.bot;
}
/* une fois ouverte au Sediment, elle le reste : un recalibrage ne doit pas la cacher */
function botAvailable(){
  if(forage().depth >= 2) S.flags.botOpen = true;
  return !!S.flags.botOpen;
}
function botRate(){ return 4 + 3 * bot().lv.rate; }
function botHours(){ return 2 + bot().lv.dur; }
function botHourCost(){
  return Math.max(400, Math.round(forageRate() * 600 * Math.pow(0.88, bot().lv.cost)));
}
function botUpCost(axis){ return Math.round(6000 * Math.pow(2.6, bot().lv[axis])); }
function botRunning(){ const b = bot(); return b.until > Date.now(); }
function botReady(){ const b = bot(); return !b.claimed && b.until && b.until <= Date.now(); }

ACTIONS.botup = d => {
  const b = bot(), f = forage(), ax = BOT_AXES[d.k];
  if(b.lv[d.k] >= ax.max) return;
  const c = botUpCost(d.k);
  if(f.energy < c){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= c; b.lv[d.k]++;
  Sfx.win(); save(); refresh();
};
ACTIONS.botrun = () => {
  const b = bot(), f = forage();
  if(botRunning() || botReady()) return;
  const cost = botHourCost() * botHours();
  if(f.energy < cost){ toast("Énergie insuffisante", "bad", "cross"); return; }
  f.energy -= cost;
  b.hours = botHours(); b.rate = botRate();
  b.until = Date.now() + b.hours * 3600 * 1000;
  b.claimed = false;
  Sfx.coin(); toast(`Capture autonome lancée pour ${b.hours} h`, "", "capture");
  save(); refresh();
};
/* un Pokemon « sauvage » generique : aucun habitat, aucune exclusivite */
function botSpecies(){
  const rar = Math.min(3, rollRarity());
  const pool = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(p && p.rar === rar && !p.leg && !isExclusive(i)) pool.push(i);
    }
  return pool.length ? pick(pool) : 16;
}
ACTIONS.botclaim = () => {
  if(!botReady()) return;
  const b = bot();
  const n = Math.round(b.rate * b.hours);
  let fresh = 0, shinies = 0;
  const got = {};
  for(let i = 0; i < n; i++){
    const id = botSpecies();
    const sh = rng() < 1/1000;                 /* aucune aide de chaine : la session ne fait que capturer */
    const isNew = addToDex(id, levelFor(POKE[id].rar), sh);
    if(isNew) fresh++;
    if(sh) shinies++;
    got[id] = (got[id] || 0) + 1;
  }
  b.claimed = true;
  S.stats.botCaught = (S.stats.botCaught || 0) + n;
  save();
  const ids = Object.keys(got).map(Number).sort((a2,b2)=>got[b2]-got[a2]);
  sheet(`<div class="center">
    <div class="h" style="justify-content:center">CAPTURE AUTONOME</div>
    <div class="tiny muted" style="margin:6px 0 11px">${b.hours} h de session. Les Pokémon rejoignent
      le Pokédex ; ils ne rapportent ni PokéCoins, ni chaîne, ni quêtes.</div>
    <div class="tiles">
      <div class="tile accent"><div class="k">Capturés</div><div class="v">${n}</div></div>
      <div class="tile gold"><div class="k">Nouvelles espèces</div><div class="v">${fresh}</div></div>
      ${shinies ? `<div class="tile"><div class="k">Chromatiques</div><div class="v">${shinies}</div></div>` : ""}
    </div>
    <div class="wrap" style="justify-content:center;margin-top:10px;gap:3px">
      ${ids.slice(0, 24).map(id=>`<span class="sprbox" style="width:30px;height:30px"
        title="${esc(POKE[id].name)} ×${got[id]}">${sprite(id,false,"")}</span>`).join("")}
    </div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Ranger</button>
  </div>`);
  Sfx.win(); checkAchievements();
};
function botPanel(){
  if(!botAvailable()) return `<div class="h sm" style="margin-top:12px">CAPTURE AUTONOME</div>
    <div class="empty">S'ouvre au Sédiment. L'Énergie pourra alors lancer des sessions de capture
      qui remplissent le Pokédex pendant votre absence.</div>`;
  const b = bot(), f = forage();
  const cost = botHourCost() * botHours();
  let state;
  if(botReady()) state = `<button class="btn pri wide" data-act="botclaim">Récupérer ${Math.round(b.rate*b.hours)} Pokémon</button>`;
  else if(botRunning()) state = `<div class="tiny cy">Session en cours — encore ${fmtTime(b.until - Date.now())}</div>
      <div class="bar thin" style="margin-top:5px"><i style="width:${Math.min(100,
        (1 - (b.until - Date.now()) / (b.hours*3600*1000)) * 100)}%"></i></div>`;
  else state = `<button class="btn wide ${f.energy>=cost?"pri":""}" data-act="botrun" ${f.energy>=cost?"":"disabled"}>
      Lancer ${botHours()} h — ${botRate()*botHours()} Pokémon — ${fmt(cost)} Énergie</button>`;
  return `<div class="h sm" style="margin-top:12px">CAPTURE AUTONOME</div>
    <div class="panel bracket">
      <div class="tiny muted" style="margin-bottom:8px">Elle capture pendant votre absence et ne
        rapporte que des Pokémon. Le coût suit votre production, pour rester un vrai choix.</div>
      ${state}
    </div>
    <div class="list">${Object.entries(BOT_AXES).map(([k,ax])=>{
      const lv = b.lv[k], maxed = lv >= ax.max, c = botUpCost(k);
      return `<div class="item ${maxed?"on":""}">
        <div class="perk-lv">${lv}/${ax.max}</div>
        <div class="grow"><div class="t">${esc(ax.n)}</div>
          <div class="d">${esc(ax.d(lv))}${maxed?"":` → ${esc(ax.d(lv+1))}`}</div></div>
        ${maxed?`<span class="tiny cy">max</span>`:`<button class="btn sm ${f.energy>=c?"gold":""}"
          data-act="botup" data-k="${k}" ${f.energy>=c?"":"disabled"}>${fmt(c)}</button>`}
      </div>`;}).join("")}</div>`;
}
