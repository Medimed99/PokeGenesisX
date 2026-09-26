/* ============================================================
   35 — HUB DES MODULES, PECHE, POKEBOX, IDLE, QUOTIDIEN
   ============================================================ */

SCREENS.modules = {
  html(){
    const mods = [
      {k:"pokebox", n:"PokéBox", i:"box", go:"pokebox",
       d:"Tampon quotidien : une espèce que vous n'avez pas encore.",
       st:()=>canOpenBox() ? "Disponible" : "Ouvert aujourd'hui", alert:canOpenBox()},
      {k:"eggs", n:"Couveuse", i:"box", go:"eggs",
       d:"Incuber des œufs : ils éclosent avec vos captures, pas avec le temps.",
       st:()=>{ const e=eggState();
         return e.inc.length ? `${e.inc.length} en incubation` : `${eggOwned()} œuf(s) en réserve`; },
       alert:()=>eggState().inc.some(x=>x.steps>=EGG_TIERS[x.tier].steps)},
      {k:"expedition", n:"Expédition", i:"map", go:"expedition",
       d:"Parcours à embranchements, combats automatiques, reliques.",
       st:()=>S.expedition ? "Expédition en cours" : `${S.stats.expWins} terminées`,
       alert:!!S.expedition, fw:"expedition"},
      {k:"poker", n:"Poké-Poker", i:"cards", go:"poker",
       d:"Deckbuilder : composez des mains, empilez des programmes.",
       st:()=>S.poker ? `Ante ${S.poker.ante} en cours` : `Meilleure ante ${S.pokerMeta.bestAnte||0}`,
       alert:!!S.poker, fw:"poker"},
      {k:"boss", n:"Data Guardians", i:"boss", go:"breche",
       d:"Les verrous légendaires de chaque secteur.",
       st:()=>`${S.bosses.length} / 9 verrous levés`, fw:"boss"},
      {k:"idle", n:"Énergie Onirique", i:"idle", go:"idle",
       d:"Production passive, même hors ligne.",
       st:()=>`${forageRate().toFixed(2)} / s`}
    ];
    const open = mods.filter(m=>moduleUnlocked(m.k)).length;
    return `
      <div class="todaycard" data-act="goto" data-to="today">
        <div class="td-ic">${ic("quest")}</div>
        <div class="grow"><div class="td-n">Aujourd'hui</div>
          <div class="td-d">${todayPending() ? todayPending() + " chose(s) vous attendent" : "Rien d'urgent"}</div></div>
        ${todayPending() ? `<span class="badge">${todayPending()}</span>` : ""}${ic("arrow")}
      </div>
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
            <div class="d">Balls, baies, boosts, pierres, archives et cosmétiques.</div></div>
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
            <div class="d">Quêtes, assiduité, rapport d'absence.</div>
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
      if(POKE[i] && !S.dex[i] && POKE[i].leg===0 && !isExclusive(i)) out.push(i);
  return out;
}
SCREENS.pokebox = {
  after(){ tutoMaybe("pokebox"); },
  html(){
    const can = canOpenBox();
    const miss = missingSpecies().length;
    const pool = missingSpecies();
    /* trois aperçus du réserve : on montre ce qui peut sortir, pas ce qui va sortir */
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
          <span class="tiny dim">dans le réserve</span>
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
        <div class="tile accent"><div class="k">Espèces au réserve</div><div class="v">${miss}</div></div>
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

  /* le rouleau pioche dans le réserve, puis decelere jusqu'au resultat */
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

/* L'ancien module « Sonde des couches » a ete remplace par le mode Peche de
   l'ecran de capture : voir src/33-fishing.js. */

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

/* ---------- absence ----------
   Le forage continue sans le joueur, jusqu'au plafond que ses Echos
   ont repousse. C'est le seul endroit ou l'inactivite paie. */
function offlineReport(){
  const now = Date.now();
  const away = now - (S.lastSeen || now);
  if(away < 300000) return null;
  const cap = offlineHours() * 3600 * 1000;
  const t = Math.min(away, cap) / 1000;
  return {away, capped: away > cap,
          energy: Math.floor(forageRate() * t),
          coins:  Math.floor(dexTotal() * 0.9 * (t / 3600))};
}
function showOfflineReport(){
  const r = offlineReport();
  if(!r) return false;
  const f = forage();
  f.energy += r.energy; f.total += r.energy;
  gain("coins", r.coins);
  save();
  sheet(`<div class="center">
      <div class="h" style="justify-content:center">PENDANT VOTRE ABSENCE</div>
      <div class="tiny muted" style="margin-bottom:10px">${fmtTime(r.away)} hors ligne${
        r.capped ? ` — le réservoir a saturé après ${offlineHours()} h` : ""}</div>
      <div class="baglist" style="text-align:left">
        <div class="bagrow"><div class="bag-ic">${ic("bolt")}</div>
          <div class="grow"><div class="bag-n">Énergie forée</div>
            <div class="bag-d">les sondes ont continué sans vous</div></div>
          <b class="rp-d">+${fmt(r.energy)}</b></div>
        <div class="bagrow"><div class="bag-ic">${ic("coin")}</div>
          <div class="grow"><div class="bag-n">PokéCoins des archives</div>
            <div class="bag-d">${dexTotal()} espèces archivées rapportent en continu</div></div>
          <b class="rp-d">+${fmt(r.coins)}</b></div>
      </div>
      ${r.capped ? `<div class="tiny" style="margin-top:9px;color:var(--amber)">
        Le réservoir est plein. L'axe « Réservoir » des Échos le repousse.</div>` : ""}
      <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Récupérer</button>
    </div>`, true);
  return true;
}
