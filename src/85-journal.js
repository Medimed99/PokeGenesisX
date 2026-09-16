/* ============================================================
   85 — JOURNAL, CRÉDITS, NOUVEAU CYCLE
   ============================================================ */

/* ---------- journal des scènes ---------- */
const STORY_TITLES = {
  intro:"Contact", first_catch:"Première ligne", beat_early:"Trois pour cent",
  pz_box:"Un abus toléré", pz_shiny:"Mal encodée", pz_fail:"Ce n'est pas toi",
  kanto_half:"Les portes fermées", guardian_first:"Le premier verrou",
  boss_first_done:"Il ne voulait pas", missingno_1:"Avant le premier octet",
  kanto_done:"Le socle tient", johto_mid:"Onze sauvegardes",
  johto_done:"Douze", hoenn_mid:"Ce que ça coûte", hoenn_done:"La faille",
  climax:"Le condensateur", epilogue:"pz_journal.log",
  pz_egg:"Une ébauche", pz_treasure:"Un objet", pz_buddy:"Nulle part écrit",
  pz_region_full:"Le silence", pz_first_guardian_fail:"Pas au niveau", pz_cycle:"Recommencer"
};
SCREENS.journal = {
  html(){
    const seen = S.story.length, tot = STORY.length;
    return `
      <div class="h">${ic("quest")} JOURNAL</div>
      <div class="sub">Les scènes déjà vues restent consultables. Les autres attendent.</div>
      <div class="panel bracket">
        <div class="row between tiny"><span class="muted">Scènes découvertes</span>
          <b>${seen} / ${tot}</b></div>
        <div class="bar" style="margin-top:6px"><i style="width:${seen/tot*100}%"></i></div>
      </div>
      <div class="list">
        ${STORY.map(sc=>{
          const got = S.story.includes(sc.id);
          return `<div class="item journal-row ${got?"":"sealed"}"
              ${got?`data-act="jread" data-id="${sc.id}"`:""}>
            <div class="jn-ic">${got?pzFace(sc.id==="climax"?"Determined":"Normal",30):ic("lock")}</div>
            <div class="grow">
              <div class="t">${got?esc(STORY_TITLES[sc.id]||sc.id):"Scène scellée"}</div>
              <div class="d">${got?`${sc.lines.length} répliques`:"Non découverte"}</div>
            </div>
            ${got?ic("arrow"):""}
          </div>`;}).join("")}
      </div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="credits">Crédits</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="goto" data-to="profile">Retour au profil</button>`;
  }
};
ACTIONS.jread = d => {
  /* relire ne redéclenche aucune récompense : la scène est jouée telle quelle */
  playStory(d.id, ()=>go("journal"));
};

/* ---------- crédits ---------- */
SCREENS.credits = {
  html(){
    return `
      <div class="h">${ic("star")} CRÉDITS</div>
      <div class="sub">Jeu de fan non officiel, sans but lucratif.</div>

      <div class="panel bracket">
        <div class="h sm">MARQUES</div>
        <div class="tiny">Pokémon est une marque de <b>Nintendo</b>, <b>Creatures Inc.</b> et
          <b>GAME FREAK inc.</b> Ce projet n'est ni affilié, ni approuvé, ni soutenu par ces sociétés.
          Aucun revenu n'en est tiré.</div>
      </div>

      <div class="panel">
        <div class="h sm">SPRITES POKÉMON</div>
        <div class="tiny">Sprites issus du dépôt communautaire <b>PokeAPI/sprites</b>
          (sprites Emerald, Game Boy Advance), assemblés en atlas et embarqués dans le fichier.</div>
        <div class="tiny muted" style="margin-top:5px">Données d'espèces — noms français, types,
          statistiques, taux de capture, chaînes d'évolution — issues du dépôt <b>PokeAPI/pokeapi</b>.</div>
      </div>

      <div class="panel">
        <div class="h sm">PORTRAITS DE PORYGON-Z</div>
        <div class="row" style="gap:10px">
          ${pzFace("Happy", 46, "big")}
          <div class="grow tiny">Portraits expressifs du dépôt <b>PMDCollab/SpriteCollab</b>,
            réalisés par la communauté Pokémon Donjon Mystère.
            <div class="muted" style="margin-top:4px">Diffusés sous licence
              <b>CC BY-NC 4.0</b> : réutilisation autorisée avec attribution, à condition que
              l'usage reste non commercial — ce qui est le cas ici.</div></div>
        </div>
      </div>

      <div class="panel">
        <div class="h sm">ÉCRITURE</div>
        <div class="tiny">Récit, dialogues et notices du Pokédex écrits pour ce projet.
          Les 386 notices d'espèces proviennent de la première version du jeu.</div>
      </div>

      <div class="panel">
        <div class="h sm">TECHNIQUE</div>
        <div class="tiny">Fichier unique, sans dépendance ni moteur externe. Sons générés par synthèse.
          Sauvegarde locale avec repli mémoire, synchronisation distante facultative.</div>
      </div>

      <button class="btn ghost wide" data-act="goto" data-to="journal">Retour au journal</button>`;
  }
};

/* ============================================================
   NOUVEAU CYCLE
   Relance la partie en conservant ce qui relève de la collection
   et du prestige, et en remettant la progression à zéro. Les
   modificateurs choisis augmentent le gain de Noyaux Zéro.
   ============================================================ */
const CYCLE_MODS = {
  m_tough: {n:"Verrous renforcés",   d:"Data Guardians et expéditions +30% de statistiques.", bonus:.15},
  m_rare:  {n:"Index fragmenté",     d:"Les espèces communes se raréfient d'un cran.",        bonus:.20},
  m_chain: {n:"Chaîne fragile",      d:"La chaîne se brise aussi sur un lancer raté.",        bonus:.25},
  m_econ:  {n:"Économie stricte",    d:"PokéCoins et Fragments divisés par deux.",            bonus:.20},
  m_slow:  {n:"Réparation lente",    d:"Gains d'intégrité réduits de 40%.",                   bonus:.20}
};
function cycleMod(k){ return !!(S.cycle && S.cycle.mods && S.cycle.mods.includes(k)); }
function cycleN(){ return (S.cycle && S.cycle.n) || 0; }

const PERKS = {
  p_catch: {n:"Protocole affiné",   max:3, cost:l=>2+l*2, d:l=>`+${4*(l+1)}% de taux de capture.`},
  p_coin:  {n:"Trésorerie",         max:3, cost:l=>2+l*2, d:l=>`+${15*(l+1)}% de PokéCoins.`},
  p_shiny: {n:"Œil chromatique",    max:3, cost:l=>4+l*3, d:l=>`+${20*(l+1)}% de chance de chromatique.`},
  p_start: {n:"Départ anticipé",    max:3, cost:l=>3+l*2, d:l=>`Commencer au niveau ${1+4*(l+1)}.`},
  p_keep:  {n:"Mémoire persistante",max:1, cost:()=>6,    d:()=>"Conserver les objets tenus entre les cycles."},
  p_quest: {n:"Charge de travail",  max:1, cost:()=>5,    d:()=>"Une quête quotidienne supplémentaire."}
};
function perkLv(k){ return (S.perks && S.perks[k]) || 0; }
function perkMul(k, per){ return 1 + per * perkLv(k); }

/* Noyaux Zéro gagnés en bouclant un cycle */
function cycleReward(){
  const base = 8
    + Math.floor(dexTotal() / 40)
    + S.bosses.length
    + Math.floor((S.stats.shinies || 0) / 5)
    + Math.floor(S.level / 12);
  const mult = 1 + (S.cycle && S.cycle.mods ? S.cycle.mods.reduce((a,k)=>a + CYCLE_MODS[k].bonus, 0) : 0);
  return Math.max(1, Math.round(base * mult));
}
function cycleReady(){ return !!(S.flags && S.flags.climax); }

SCREENS.cycle = {
  html(){
    const ready = cycleReady();
    const gain = cycleReward();
    const sel = (S.nextMods || []);
    const selBonus = sel.reduce((a,k)=>a + CYCLE_MODS[k].bonus, 0);
    return `
      <div class="h">${ic("refresh")} NOUVEAU CYCLE ${infoBtn("cycle")}</div>
      <div class="sub">Le condensateur se vide lentement. Rien n'empêche de recommencer —
        et de recommencer mieux.</div>

      <div class="panel bracket">
        <div class="tiles">
          <div class="tile accent"><div class="k">Cycle actuel</div><div class="v">${cycleN() + 1}</div></div>
          <div class="tile gold"><div class="k">Noyaux Zéro</div><div class="v">${S.zero || 0}</div></div>
        </div>
        ${ready
          ? `<div class="tiny ok" style="margin-top:8px">Ce cycle peut être bouclé.
             Il rapportera <b>${gain} Noyaux Zéro</b>.</div>`
          : `<div class="tiny muted" style="margin-top:8px">Un cycle se boucle après l'épilogue :
             intégrité à 100% et les neuf verrous levés.</div>`}
      </div>

      <div class="h sm">CE QUI TRAVERSE LE CYCLE</div>
      <div class="panel tight">
        <div class="tiny ok">Conservé — cartes légendaires, cosmétiques, succès, journal des scènes,
          Noyaux Zéro, avantages permanents${perkLv("p_keep")?", objets tenus":""}.</div>
        <div class="tiny bad" style="margin-top:5px">Remis à zéro — Pokédex, niveau, intégrité, monnaies,
          équipe, verrous, compagnon, progression des modules.</div>
      </div>

      <div class="h sm">AVANTAGES PERMANENTS</div>
      <div class="list">
        ${Object.entries(PERKS).map(([k,p])=>{
          const lv = perkLv(k), maxed = lv >= p.max, cost = p.cost(lv);
          return `<div class="item ${maxed?"on":""}">
            <div class="perk-lv">${lv}/${p.max}</div>
            <div class="grow"><div class="t">${esc(p.n)}</div>
              <div class="d">${esc(maxed ? p.d(lv-1) : p.d(lv))}</div></div>
            ${maxed ? `<span class="tiny cy">max</span>`
              : `<button class="btn sm ${(S.zero||0)>=cost?"gold":""}" data-act="buyperk" data-k="${k}"
                   ${(S.zero||0)>=cost?"":"disabled"}>${cost}</button>`}
          </div>`;}).join("")}
      </div>

      <div class="h sm" style="margin-top:12px">MODIFICATEURS DU PROCHAIN CYCLE</div>
      <div class="tiny muted" style="margin-bottom:7px">Chacun durcit la partie et augmente le gain
        de Noyaux Zéro à la fin du cycle.</div>
      <div class="list">
        ${Object.entries(CYCLE_MODS).map(([k,m])=>`
          <div class="item ${sel.includes(k)?"on":""}" data-act="togglemod" data-k="${k}">
            <div class="grow"><div class="t">${esc(m.n)}</div><div class="d">${esc(m.d)}</div></div>
            <span class="tiny ${sel.includes(k)?"gold-t":"dim"}">+${Math.round(m.bonus*100)}%</span>
          </div>`).join("")}
      </div>
      <div class="tiny" style="margin:8px 0">Bonus sélectionné : <b class="gold-t">+${Math.round(selBonus*100)}%</b></div>

      <button class="btn dan wide" data-act="cycleask" ${ready?"":"disabled"}>
        Boucler le cycle et recommencer</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="goto" data-to="profile">Retour</button>`;
  }
};
ACTIONS.togglemod = d => {
  S.nextMods = S.nextMods || [];
  const i = S.nextMods.indexOf(d.k);
  if(i >= 0) S.nextMods.splice(i,1); else S.nextMods.push(d.k);
  saveSoon(); refresh();
};
ACTIONS.buyperk = d => {
  const p = PERKS[d.k], lv = perkLv(d.k);
  if(lv >= p.max) return;
  const cost = p.cost(lv);
  if((S.zero||0) < cost){ toast("Noyaux Zéro insuffisants", "bad", "cross"); return; }
  S.zero -= cost;
  S.perks = S.perks || {};
  S.perks[d.k] = lv + 1;
  Sfx.win();
  toast(p.n + " — niveau " + (lv+1), "warn", "star");
  save(); refresh();
};
ACTIONS.cycleask = () => {
  if(!cycleReady()) return;
  const g = cycleReward();
  sheet(`${sheetHead("Boucler le cycle ?")}
    <div class="tiny muted">Le monde est remis à zéro. Vous conservez vos cartes, vos cosmétiques,
      vos succès, le journal et vos avantages permanents.</div>
    <div class="tiles" style="margin:10px 0">
      <div class="tile gold"><div class="k">Noyaux Zéro gagnés</div><div class="v">+${g}</div></div>
      <div class="tile accent"><div class="k">Prochain cycle</div><div class="v">${cycleN()+2}</div></div>
    </div>
    <div class="tiny bad">Cette action est définitive.</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn ghost" data-act="closesheet">Annuler</button>
      <button class="btn dan" data-act="cycledo">Boucler</button>
    </div>`, true);
};
ACTIONS.cycledo = () => {
  const g = cycleReward();
  const keep = {
    cards: S.cards, cos: S.cos, ach: S.ach, story: S.story, tutos: S.tutos,
    zero: (S.zero||0) + g, perks: S.perks || {}, name: S.name,
    netRev: S.netRev, netMail: S.netMail, settings: S.settings,
    cycle: {n: cycleN() + 1, mods: (S.nextMods || []).slice()},
    held: perkLv("p_keep") ? S.held : {owned:[], eq:null},
    lifetime: {
      catches: ((S.lifetime && S.lifetime.catches)||0) + S.stats.catches,
      shinies: ((S.lifetime && S.lifetime.shinies)||0) + S.stats.shinies,
      cycles: cycleN() + 1
    }
  };
  const fresh = newState();
  Object.assign(fresh, keep);
  /* avantages de départ */
  const startLv = 1 + 4*perkLv("p_start");
  if(startLv > 1){ fresh.level = startLv; }
  fresh.nextMods = [];
  S = fresh;
  applyCorruption();
  save();
  closeSheet();
  Sfx.win();
  revealSheet(`CYCLE ${cycleN()+1}`, [
    {icon:"core", label:`${g} Noyaux Zéro`, color:"var(--violet)", big:true},
    ...((S.cycle.mods||[]).map(k=>({icon:"bolt", label:CYCLE_MODS[k].n, sub:"modificateur actif",
      color:"var(--magenta)"}))),
    {icon:"dex", label:"Archive remise à zéro", color:"var(--cyan)"}
  ], {icon:"refresh", sub:"Le condensateur est rempli. Le compteur repart."});
};
