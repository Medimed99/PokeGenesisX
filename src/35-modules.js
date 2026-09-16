/* ============================================================
   35 — HUB DES MODULES, PECHE, POKEBOX, IDLE, QUOTIDIEN
   ============================================================ */

SCREENS.modules = {
  html(){
    const mods = [
      {k:"pokebox", n:"PokéBox", i:"box", go:"pokebox",
       d:"Tampon quotidien : une espèce que vous n'avez pas encore.",
       st:()=>canOpenBox() ? "Disponible" : "Ouvert aujourd'hui", alert:canOpenBox()},
      {k:"pokebox", n:"Couveuse", i:"box", go:"eggs", always:1,
       d:"Incuber des œufs : ils éclosent avec vos captures, pas avec le temps.",
       st:()=>{ const e=eggState();
         return e.inc.length ? `${e.inc.length} en incubation` : `${eggOwned()} œuf(s) en réserve`; },
       alert:()=>eggState().inc.some(x=>x.steps>=EGG_TIERS[x.tier].steps)},
      {k:"fishing", n:"Sonde des couches", i:"fish", go:"fishing",
       d:"Pêcher dans les strates profondes du système.",
       st:()=>`${S.stats.fish} prises`, fw:"fishing"},
      {k:"expedition", n:"Expédition", i:"map", go:"expedition",
       d:"Parcours à embranchements, combats automatiques, reliques.",
       st:()=>S.expedition ? "Expédition en cours" : `${S.stats.expWins} terminées`,
       alert:!!S.expedition, fw:"expedition"},
      {k:"poker", n:"Poké-Poker", i:"cards", go:"poker",
       d:"Deckbuilder : composez des mains, empilez des programmes.",
       st:()=>S.poker ? `Ante ${S.poker.ante} en cours` : `Meilleure ante ${S.pokerMeta.bestAnte||0}`,
       alert:!!S.poker, fw:"poker"},
      {k:"boss", n:"Data Guardians", i:"boss", go:"boss",
       d:"Les verrous légendaires de chaque secteur.",
       st:()=>`${S.bosses.length} / 9 verrous levés`, fw:"boss"},
      {k:"idle", n:"Énergie Onirique", i:"idle", go:"idle",
       d:"Production passive, même hors ligne.",
       st:()=>`${energyRate().toFixed(2)} / s`}
    ];
    const open = mods.filter(m=>moduleUnlocked(m.k)).length;
    return `
      <div class="h">${ic("grid")} MODULES</div>
      <div class="sub">Chaque salle alimente les autres. Rien n'est isolé.</div>
      ${directiveCard()}

      <div class="tiles" style="margin-bottom:10px">
        <div class="tile accent"><div class="k">Modules ouverts</div><div class="v">${open} / ${mods.length}</div></div>
        <div class="tile gold"><div class="k">Niveau</div><div class="v">${S.level}</div></div>
      </div>

      <div class="list">
        <div class="modcard" data-act="goto" data-to="shop">
          <div class="ic">${ic("shop")}</div>
          <div class="grow"><div class="t">Boutique</div>
            <div class="d">Conteneurs, baies, boosts, pierres, archives et cosmétiques.</div></div>
          ${ic("arrow")}
        </div>
        <div class="modcard" data-act="goto" data-to="online">
          <div class="ic">${ic("wave")}</div>
          <div class="grow"><div class="t">Espace en ligne</div>
            <div class="d">Sauvegarde distante, classements, échange de cartes.</div>
            <div class="tiny ${Net.signedIn()?"cy":"dim"}">${Net.signedIn()?"connecté":"facultatif — non connecté"}</div>
          </div>
          ${ic("arrow")}
        </div>
        <div class="modcard" data-act="goto" data-to="daily">
          <div class="ic">${ic("quest")}</div>
          <div class="grow"><div class="t">Journal quotidien</div>
            <div class="d">Quêtes, série de connexion, rapport d'absence.</div>
            <div class="tiny cy">${(S.quests||[]).filter(q=>q.prog>=q.goal&&!q.claimed).length} récompense(s) à prendre</div>
          </div>
          ${questsReady()?'<i class="badge" style="position:static"></i>':ic("arrow")}
        </div>
        ${mods.map(m=>{
          const ok = moduleUnlocked(m.k);
          return `<div class="modcard ${ok?"":"locked"}" ${ok?`data-act="goto" data-to="${m.go}"`:""}>
            <div class="ic">${ok?ic(m.i):ic("lock")}</div>
            <div class="grow">
              <div class="t">${esc(m.n)}</div>
              <div class="d">${esc(m.d)}</div>
              ${ok?`<div class="tiny cy">${esc(m.st())}${m.fw?firstWinBadge(m.fw):""}</div>`
                  :`<div class="lockmsg">Verrouillé — ${esc(MODULE_REQ[m.k].d)}</div>`}
            </div>
            ${(typeof m.alert==="function"?m.alert():m.alert)&&ok?'<i class="badge" style="position:static"></i>':(ok?ic("arrow"):"")}
          </div>`;}).join("")}
      </div>`;
  }
};
ACTIONS.goto = d => go(d.to);

/* ============================================================
   POKEBOX — ouverture quotidienne
   ============================================================ */
function canOpenBox(){ return moduleUnlocked("pokebox") && S.pokebox.last !== today(); }
function missingSpecies(){
  const out = [];
  for(const r of unlockedRegions())
    for(let i=r.from;i<=r.to;i++)
      if(POKE[i] && !S.dex[i] && POKE[i].leg===0) out.push(i);
  return out;
}
SCREENS.pokebox = {
  after(){ tutoMaybe("pokebox"); },
  html(){
    const can = canOpenBox();
    const miss = missingSpecies().length;
    const pool = missingSpecies();
    /* trois aperçus du vivier : on montre ce qui peut sortir, pas ce qui va sortir */
    const teaser = shuffle(pool).slice(0, 3);
    return `
      <div class="h">${ic("box")} POKÉBOX ${infoBtn("pokebox")}</div>
      <div class="sub">Porygon-Z met une entité de côté chaque jour. Ce n'est pas prévu par le système.</div>
      ${moduleGoal("Une ouverture par jour, garantie sur une espèce que vous ne possédez pas.",
        "L'espèce manquante la plus fiable du jeu.")}

      <div class="machine ${can?"ready":"spent"}">
        <div class="mc-top">
          <span class="mc-led ${can?"on":""}"></span>
          <span class="mc-title">TAMPON DE REBUT</span>
          <span class="mc-led ${can?"on":""}"></span>
        </div>

        <div class="mc-window">
          <div class="mc-glass"></div>
          <div class="mc-reel" id="mc-reel">
            ${can
              ? `<span class="mc-q">?</span>`
              : `<span class="mc-done">${ic("check")}</span>`}
          </div>
          <div class="mc-rails"><i></i><i></i></div>
        </div>

        <div class="mc-pool">
          <span class="tiny dim">dans le vivier</span>
          ${teaser.map(id=>`<span class="sprbox mc-tz" style="width:26px;height:26px">
            ${sprite(id,false,"ghosted")}</span>`).join("")}
          <span class="tiny dim">et ${Math.max(0, miss-3)} autres</span>
        </div>

        <button class="mc-lever ${can?"":"off"}" data-act="openbox" ${can?"":"disabled"}>
          <span class="mc-knob"></span>
          <span class="mc-lbl">${can ? "TIRER" : "REVENIR DEMAIN"}</span>
        </button>
      </div>

      <div class="tiles" style="margin-top:11px">
        <div class="tile accent"><div class="k">Espèces au vivier</div><div class="v">${miss}</div></div>
        <div class="tile gold"><div class="k">Tirages</div><div class="v">${S.stats.boxOpens}</div></div>
      </div>
      <div class="panel">
        <div class="h sm">LE VIVIER NE PEUT PAS VOUS TROMPER</div>
        <div class="tiny">Tant qu'une espèce manque dans vos secteurs ouverts, le tirage ne peut pas
          rendre de doublon. Le hasard porte sur <b>laquelle</b>, jamais sur <b>si</b>.</div>
      </div>
      <button class="btn ghost wide" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};

/* ---------- tirage : le rouleau défile puis ralentit ---------- */
let BOXROLL = null;
ACTIONS.openbox = () => {
  if(!canOpenBox() || BOXROLL) return;
  const miss = missingSpecies();
  let id;
  if(miss.length) id = pick(miss);
  else { const r = regionDef(S.region); id = randInt(r.from, r.to); }

  S.pokebox.last = today();
  S.stats.boxOpens++;
  const shiny = rng() < shinyOdds()*3;
  const lvl = levelFor(POKE[id].rar);
  save();

  const reel = document.getElementById("mc-reel");
  const machine = document.querySelector(".machine");
  if(!reel){ finishBox(id, shiny, lvl); return; }
  if(machine) machine.classList.add("rolling");

  /* le rouleau pioche dans le vivier, puis decelere jusqu'au resultat */
  const strip = shuffle(miss.length ? miss : [id]).slice(0, 26);
  BOXROLL = {i:0, delay:45, id, shiny, lvl};
  const step = () => {
    if(!BOXROLL) return;
    const cur = strip[BOXROLL.i % strip.length];
    reel.innerHTML = `<span class="sprbox" style="width:96px;height:96px">${sprite(cur,false,"")}</span>`;
    reel.classList.remove("tick"); void reel.offsetWidth; reel.classList.add("tick");
    Sfx.click();
    BOXROLL.i++;
    BOXROLL.delay *= BOXROLL.i > 18 ? 1.26 : 1.04;      /* deceleration progressive */
    if(BOXROLL.delay > 320){
      reel.innerHTML = `<span class="sprbox" style="width:96px;height:96px">
        ${sprite(BOXROLL.id, BOXROLL.shiny, "", {anim:true, eager:true})}</span>`;
      reel.classList.add("landed");
      if(machine){ machine.classList.remove("rolling"); machine.classList.add("hit"); }
      burstEl(reel, {n:26, spread:130, colors:[shiny?"#ffc857":"#35f0d6","#ffffff"], dur:900});
      Sfx.caught(); buzz([20,40,70]);
      const {id:fid, shiny:fs, lvl:fl} = BOXROLL;
      BOXROLL = null;
      setTimeout(()=>finishBox(fid, fs, fl), 680);
      return;
    }
    BOXROLL.t = setTimeout(step, BOXROLL.delay);
  };
  step();
};
function finishBox(id, shiny, lvl){
  const isNew = addToDex(id, lvl, shiny);
  addIntegrity(RARITY[POKE[id].rar].integ * (isNew?0.85:0.04));
  gain("coins", 150 + S.level*25);
  addXp(40 + S.level*4);
  if(shiny) S.stats.shinies++;
  save(); checkAchievements(); guideTick();
  if(isNew) showDiscovery({id, shiny, rar:POKE[id].rar, level:lvl},
                          {coins:150 + S.level*25, xp:40 + S.level*4,
                           integ:RARITY[POKE[id].rar].integ*0.85, isNew:true});
  else showCatchResult({id, shiny, rar:POKE[id].rar, level:lvl},
                       {coins:150 + S.level*25, xp:40 + S.level*4, integ:0, isNew:false});
}

ACTIONS.closeandrefresh = () => { closeSheet(); if(!checkStoryTriggers()) refresh(); };

/* ============================================================
   PECHE — sonde des couches profondes
   ============================================================ */
let FISH = {state:"idle", t:0, pos:0, dir:1, timer:null, zone:[40,62], depth:1};

const FISH_DEPTHS = [
  {n:"Couche de surface", cost:0,  types:[11], rarBoost:0,  d:"Eau uniquement."},
  {n:"Couche intermédiaire", cost:6, types:[11,15,4], rarBoost:1, d:"Eau, Glace, Poison. Raretés plus hautes."},
  {n:"Couche profonde", cost:18, types:[11,15,16,8], rarBoost:2, d:"Eau, Glace, Dragon, Spectre. Fort taux de rare."}
];
function fishPool(depth){
  const d = FISH_DEPTHS[depth];
  const r = regionDef(S.region);
  const out = [];
  for(let i=r.from;i<=r.to;i++){
    const p = POKE[i]; if(!p || p.leg) continue;
    if(p.types.some(t=>d.types.includes(t))) out.push(i);
  }
  return out.length ? out : [POKE[r.from].id];
}

SCREENS.fishing = {
  html(){
    const d = FISH_DEPTHS[FISH.depth];
    return `
      <div class="h">${ic("fish")} SONDE DES COUCHES ${infoBtn("fishing")}</div>
      <div class="sub">On ne pêche pas des poissons. On sonde les strates où les données coulent.</div>
      ${moduleGoal("Ferrez au bon moment, puis stabilisez le curseur dans la zone. Une prise réussie vous renvoie vers une rencontre à capturer.",
        "Fragments, trésors revendables, et des espèces aquatiques difficiles à croiser autrement.")}
      <div class="wrap" style="margin-bottom:8px">
        ${FISH_DEPTHS.map((x,i)=>`<button class="chip ${FISH.depth===i?"on":""}" data-act="setdepth" data-i="${i}">
          ${esc(x.n)}${x.cost?` · ${x.cost}`:""}</button>`).join("")}
      </div>
      <div class="panel center" id="fish-panel">
        <div class="tiny muted">${esc(d.d)}${d.cost?` — coût : ${d.cost} Fragments`:""}</div>
        <div id="fish-stage" style="height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px">
          ${this.stage()}
        </div>
      </div>
      ${treasurePanel()}
      <div class="panel">
        <div class="row between tiny"><span class="muted">Prises totales</span><b>${S.stats.fish}</b></div>
        <div class="row between tiny"><span class="muted">Trésors remontés</span><b>${S.stats.treasures||0}</b></div>
      </div>
      <button class="btn ghost wide" data-act="fishleave">Retour aux modules</button>`;
  },
  stage(){
    if(FISH.state === "idle")
      return `<div class="muted tiny">Ligne enroulée.</div>
        <button class="btn pri" data-act="cast">Lancer la sonde</button>`;
    if(FISH.state === "wait")
      return `<div style="font-size:26px" class="cy">${ic("wave")}</div>
        <div class="muted tiny">La ligne descend…</div>`;
    if(FISH.state === "bite")
      return `<div class="h" style="font-size:14px;color:var(--magenta)">ÇA MORD</div>
        <button class="btn dan" data-act="hook">Ferrer</button>`;
    if(FISH.state === "reel")
      return `<div class="tiny muted">Stabilisez le flux dans la zone.</div>
        <div style="width:100%;max-width:260px;height:26px;border:1px solid var(--line);position:relative;background:#070d18">
          <div style="position:absolute;left:${FISH.zone[0]}%;width:${FISH.zone[1]-FISH.zone[0]}%;top:0;bottom:0;
            background:rgba(53,240,214,.22);border-left:1px solid var(--cyan);border-right:1px solid var(--cyan)"></div>
          <div id="fish-cursor" style="position:absolute;top:0;bottom:0;width:4px;background:var(--magenta);
            left:${FISH.pos}%;box-shadow:0 0 8px var(--magenta)"></div>
        </div>
        <button class="btn pri" data-act="reel">Stabiliser</button>`;
    return "";
  },
  after(){ tutoMaybe("fishing"); if(FISH.state === "reel") startReelLoop(); }
};
ACTIONS.setdepth = d => { if(FISH.state!=="idle") return; FISH.depth = +d.i; refresh(); };
ACTIONS.fishleave = () => { stopFish(); go("modules"); };

function stopFish(){ clearInterval(FISH.timer); clearTimeout(FISH.timer); FISH.timer=null; FISH.state="idle"; }

ACTIONS.cast = () => {
  const d = FISH_DEPTHS[FISH.depth];
  const free = boostActive("lure");
  if(d.cost && !free && !pay("shards", d.cost)){ toast("Fragments insuffisants", "bad", "cross"); return; }
  FISH.state = "wait"; refresh();
  const delay = 700 + rng()*2400;
  FISH.timer = setTimeout(()=>{
    FISH.state = "bite"; Sfx.wobble(); buzz(25); refresh();
    FISH.timer = setTimeout(()=>{
      if(FISH.state === "bite"){ FISH.state="idle"; toast("La prise s'est échappée.", "bad", "cross"); refresh(); }
    }, 1400);
  }, delay);
};
ACTIONS.hook = () => {
  clearTimeout(FISH.timer);
  const w = 26 - FISH.depth*6;
  const start = 12 + rng()*(72 - w);
  FISH.zone = [start, start+w];
  FISH.pos = 0; FISH.dir = 1;
  FISH.state = "reel"; refresh();
};
function startReelLoop(){
  clearInterval(FISH.timer);
  const speed = 1.5 + FISH.depth*0.8;
  FISH.timer = setInterval(()=>{
    FISH.pos += FISH.dir*speed;
    if(FISH.pos >= 99){ FISH.pos = 99; FISH.dir = -1; }
    if(FISH.pos <= 0){ FISH.pos = 0; FISH.dir = 1; }
    const c = document.getElementById("fish-cursor");
    if(!c){ clearInterval(FISH.timer); return; }
    c.style.left = FISH.pos + "%";
  }, 16);
}
ACTIONS.reel = () => {
  clearInterval(FISH.timer);
  const ok = FISH.pos >= FISH.zone[0] && FISH.pos <= FISH.zone[1];
  FISH.state = "idle";
  if(!ok){ Sfx.fail(); toast("Flux perdu. La prise se désindexe.", "bad", "cross"); refresh(); return; }
  Sfx.coin(); buzz(20);
  S.stats.fish++; S.daily.dayFish++; questTick("dayFish",1);
  gain("shards", Math.round((2 + FISH.depth*3) * consumeFirstWin("fishing")));
  const treasure = rollTreasure(FISH.depth);
  if(treasure) toast("Trésor remonté : " + TREASURES[treasure].n, "warn", "star");
  const pool = fishPool(FISH.depth);
  let id = pick(pool);
  /* la profondeur pousse vers des especes plus rares */
  const tries = FISH_DEPTHS[FISH.depth].rarBoost + (boostActive("lure") ? 2 : 0);
  for(let i=0;i<tries;i++){
    const alt = pick(pool);
    if(POKE[alt].rar > POKE[id].rar) id = alt;
  }
  save();
  toast("Prise stabilisée — capture disponible", "warn", "fish");
  newEncounter({id, rar: POKE[id].rar});
  go("capture");
};

/* ============================================================
   IDLE — Energie Onirique
   ============================================================ */
const GENS = [
  {k:"g1", n:"Boucle de veille",    base:0.35, cost:180,   grow:1.16, d:"Un thread qui rêve en arrière-plan."},
  {k:"g2", n:"Cache onirique",      base:2.2,  cost:2200,  grow:1.18, d:"Stocke les rêves non lus des entités archivées."},
  {k:"g3", n:"Condensateur profond",base:14,   cost:26000, grow:1.20, d:"Comprime l'inactivité en énergie exploitable."},
  {k:"g4", n:"Réacteur du Vide",    base:95,   cost:310000,grow:1.23, d:"Puise directement dans l'espace non alloué."}
];
function genCost(g){ const lv = S.idle.gens[g.k]||0; return Math.round(g.cost * Math.pow(g.grow, lv)); }
function energyRate(){ /* par seconde */
  let r = 0;
  for(const g of GENS) r += (S.idle.gens[g.k]||0) * g.base;
  r *= 1 + S.integrity/150;
  r *= S.idle.mult || 1;
  return r;
}
function idleTick(){
  const now = Date.now();
  const dt = Math.min(60, (now - S.idle.last)/1000);
  if(dt > 0.4){
    const g = energyRate()*dt;
    if(g > 0){ gain("energy", g); S.daily.dayEnergy += g; questTick("dayEnergy", g); }
    S.idle.last = now;
  }
}
function offlineReport(){
  const now = Date.now();
  const away = now - (S.lastSeen || now);
  if(away < 120000) return null;
  const capped = Math.min(away, 12*3600*1000);
  const e = energyRate() * capped/1000;
  const c = Math.round(Math.min(away,8*3600*1000)/1000 * (0.5 + S.level*0.12));
  return {away, energy:e, coins:c};
}

SCREENS.idle = {
  html(){
    const rate = energyRate();
    return `
      <div class="h">${ic("idle")} ÉNERGIE ONIRIQUE ${infoBtn("idle")}</div>
      <div class="sub">Les entités archivées continuent de rêver. Ce bruit-là est exploitable.</div>
      ${moduleGoal("Achetez des générateurs, ils produisent même hors ligne jusqu'à douze heures. Convertissez l'Énergie quand elle s'accumule.",
        "PokéCoins et Fragments sans jouer — la réserve qui finance vos achats.")}
      <div class="panel center edge">
        <div style="font-family:var(--font-px);font-size:17px;color:var(--amber)" id="en-val">${fmt(S.energy)}</div>
        <div class="tiny muted">${rate.toFixed(2)} / seconde · ${fmt(rate*3600)} / heure</div>
        <div class="btn-grid c2" style="margin-top:9px">
          <button class="btn" data-act="convert" data-t="coins">Convertir → PokéCoins</button>
          <button class="btn" data-act="convert" data-t="shards">Convertir → Fragments</button>
        </div>
        <div class="tiny muted" style="margin-top:5px">300 Énergie = 100 PokéCoins · 1200 Énergie = 10 Fragments</div>
      </div>
      <div class="h sm">GÉNÉRATEURS</div>
      <div class="list">
        ${GENS.map(g=>{
          const lv = S.idle.gens[g.k]||0, c = genCost(g);
          return `<div class="gen">
            <div class="lv">${lv}</div>
            <div class="grow"><div>${esc(g.n)}</div>
              <div class="tiny muted">${esc(g.d)}</div>
              <div class="tiny cy">+${(g.base).toFixed(2)}/s par niveau</div></div>
            <button class="btn sm ${S.coins>=c?"pri":""}" data-act="buygen" data-k="${g.k}" ${S.coins<c?"disabled":""}>
              ${ic("coin")} ${fmt(c)}</button>
          </div>`;}).join("")}
      </div>
      <div class="panel" style="margin-top:10px">
        <div class="h sm">MULTIPLICATEUR PERMANENT</div>
        <div class="row between">
          <div class="tiny">Actuel : <b class="cy">x${(S.idle.mult||1).toFixed(2)}</b></div>
          <button class="btn sm gold" data-act="buymult">${ic("core")} 3 Noyaux → +0.25</button>
        </div>
      </div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  },
  after(){
    tutoMaybe("idle");
    clearInterval(SCREENS.idle._t);
    SCREENS.idle._t = setInterval(()=>{
      const el = document.getElementById("en-val");
      if(!el){ clearInterval(SCREENS.idle._t); return; }
      el.textContent = fmt(S.energy);
    }, 500);
  }
};
ACTIONS.buygen = d => {
  const g = GENS.find(x=>x.k===d.k); const c = genCost(g);
  if(!pay("coins", c)) { toast("PokéCoins insuffisants", "bad", "cross"); return; }
  S.idle.gens[g.k] = (S.idle.gens[g.k]||0)+1;
  Sfx.coin(); save(); refresh();
};
ACTIONS.buymult = () => {
  if(!pay("cores", 3)){ toast("Noyaux insuffisants", "bad", "cross"); return; }
  S.idle.mult = (S.idle.mult||1) + 0.25;
  toast("Multiplicateur permanent amélioré", "warn", "bolt"); save(); refresh();
};
ACTIONS.convert = d => {
  if(d.t === "coins"){
    if(S.energy < 300){ toast("300 Énergie minimum", "bad", "cross"); return; }
    const n = Math.floor(S.energy/300);
    S.energy -= n*300; gain("coins", n*100);
    toast(`+${fmt(n*100)} PokéCoins`, "", "coin");
  } else {
    if(S.energy < 1200){ toast("1200 Énergie minimum", "bad", "cross"); return; }
    const n = Math.floor(S.energy/1200);
    S.energy -= n*1200; gain("shards", n*10);
    toast(`+${n*10} Fragments`, "", "shard");
  }
  Sfx.coin(); save(); refresh();
};

/* ============================================================
   QUOTIDIEN — quetes, connexion, rapport d'absence
   ============================================================ */
SCREENS.daily = {
  html(){
    const canLogin = S.login.claimed !== today();
    const rw = loginRewardFor(S.login.days);
    return `
      <div class="h">${ic("quest")} JOURNAL QUOTIDIEN</div>
      <div class="panel edge">
        <div class="row between">
          <div><div class="h sm" style="margin:0">SÉRIE DE CONNEXION</div>
            <div class="tiny muted">Jour ${S.login.days} · record ${S.login.best}</div></div>
          <button class="btn sm ${canLogin?"pri":""}" data-act="claimlogin" ${canLogin?"":"disabled"}>
            ${canLogin?"Encaisser":"Encaissé"}</button>
        </div>
        <hr class="sep">
        <div class="wrap">
          ${Array.from({length:7},(_,i)=>{
            const d = ((S.login.days-1)%7);
            return `<span class="chip ${i<=d&&!canLogin?"on":i<d?"on":""}">J${i+1}</span>`;}).join("")}
        </div>
        <div class="tiny" style="margin-top:5px">Aujourd'hui : <b class="gold-t">${esc(rewardText(rw))}</b></div>
      </div>

      <div class="h sm">QUÊTES DU JOUR</div>
      <div class="list">
        ${(S.quests||[]).map((q,i)=>`
          <div class="quest ${q.prog>=q.goal?"done":""}">
            <div class="grow">
              <div class="q-t">${esc(q.n)}</div>
              <div class="bar"><i style="width:${Math.min(100,q.prog/q.goal*100)}%"></i></div>
              <div class="tiny muted">${fmt(q.prog)} / ${fmt(q.goal)} — ${esc(rewardText(q.rw))}</div>
            </div>
            <button class="btn sm ${q.prog>=q.goal&&!q.claimed?"pri":""}" data-act="claimq" data-i="${i}"
              ${q.prog>=q.goal&&!q.claimed?"":"disabled"}>${q.claimed?"Pris":"Prendre"}</button>
          </div>`).join("")}
      </div>

      <div class="panel">
        ${weeklyPanel()}
      </div>

      <div class="panel" style="margin-top:10px">
        <div class="h sm">ÉVÉNEMENT EN COURS</div>
        ${currentEvent()
          ? `<div><b class="gold-t">${esc(S.event.n)}</b><div class="tiny">${esc(S.event.d)}</div>
             <div class="tiny muted">Se termine dans ${fmtTime(S.event.until-Date.now())}</div></div>`
          : `<div class="tiny muted">Aucune perturbation active. Le système est calme — c'est rarement bon signe.</div>`}
      </div>
      <button class="btn ghost wide" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};
ACTIONS.claimq = d => { claimQuest(+d.i); refresh(); };
ACTIONS.claimlogin = () => {
  const rw = claimLogin();
  if(!rw) return;
  Sfx.coin();
  toast("Récompense de connexion : " + rewardText(rw), "warn", "star");
  checkAchievements(); refresh();
};

function showOfflineReport(){
  const r = offlineReport();
  if(!r) return false;
  gain("energy", r.energy); gain("coins", r.coins);
  sheet(`<div class="center">
      <div class="h">PENDANT VOTRE ABSENCE</div>
      <div class="tiny muted" style="margin-bottom:8px">${fmtTime(r.away)} hors ligne</div>
      <div class="panel" style="text-align:left">
        <div class="row between tiny"><span>Énergie Onirique accumulée</span><b class="gold-t">+${fmt(r.energy)}</b></div>
        <div class="row between tiny"><span>PokéCoins des archives</span><b class="gold-t">+${fmt(r.coins)}</b></div>
      </div>
      <div class="tiny muted" style="margin:6px 0">Les entités restaurées continuent de produire sans vous.
        Porygon-Z, lui, ne dort pas.</div>
      <button class="btn pri wide" data-act="closeandrefresh">Récupérer</button>
    </div>`, true);
  return true;
}
