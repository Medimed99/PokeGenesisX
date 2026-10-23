/* ============================================================
   85 — JOURNAL, CRÉDITS, NOUVEAU CYCLE
   ============================================================ */

/* ---------- journal des scènes ----------
   Le récit se relit par actes. Ce qui n'a pas encore eu lieu reste scellé,
   sans rien dévoiler : on voit seulement qu'il reste quelque chose. */
const STORY_TITLES = {
  intro:"Contact", first_catch:"Première ligne", beat_early:"Trois pour cent",
  missingno_1:"Le numéro manquant", kanto_half:"Les portes fermées", guardian_first:"Le premier verrou",
  boss_first_done:"Il ne voulait pas", pz_mem1:"Déjà-vu", kanto_done:"Le socle tient",
  pz_mem2:"Une voix", johto_mid:"Onze sauvegardes", pz_mem3:"Pas le premier", pz_mem4:"Au bout",
  johto_done:"Douze", pz_twist:"Par choix",
  hoenn_mid:"Ce qui est écrit", pz_mem5:"Un trou de ta taille", hoenn_done:"La porte", pz_mem6:"Le dernier souvenir",
  finale_gate:"Cent pour cent", zero_descent:"La Couche Zéro", finale_reveal:"Le nom", finale_choice:"La question",
  finale_echo:"Un écho", epilogue_write:"Sauvegardé",
  cy_e_open:"Connexion suivante", cy_e_page:"La page de trop", cy_e_mid:"Trop tôt",
  cy_w_open:"Nouvelle partie", cy_w_prof:"Jusqu'au bout de la phrase",
  pz_box:"Un abus toléré", pz_shiny:"Mal encodée", pz_fail:"Ce n'est pas toi",
  pz_egg:"Une ébauche", pz_treasure:"Un objet", pz_buddy:"Nulle part écrit",
  pz_region_full:"Le silence", pz_first_guardian_fail:"Pas au niveau"
};
const STORY_ACTS = [
  {act:0, n:"Prologue", t:"L'écriture interrompue"},
  {act:1, n:"Acte I", t:"L'arrivée"},
  {act:2, n:"Acte II", t:"Les autres"},
  {act:3, n:"Acte III", t:"La raison"},
  {act:4, n:"Acte IV", t:"La Couche Zéro"},
  {act:5, n:"Après", t:"Les connexions suivantes", hide:1},
  {act:null, n:"Moments", t:"Ce qui arrive en chemin"}
];
function journalRow(sc){
  const got = S.story.includes(sc.id);
  return `<div class="item journal-row ${got?"":"sealed"}" ${got?`data-act="jread" data-id="${sc.id}"`:""}>
    <div class="jn-ic">${got ? pzFace(sc.mem ? "Sad" : sc.id === "finale_choice" ? "Determined" : "Normal", 30) : ic("lock")}</div>
    <div class="grow">
      <div class="t">${got ? esc(STORY_TITLES[sc.id] || sc.id) : "Scène scellée"}</div>
      <div class="d">${got ? (sc.mem ? "souvenir de Porygon-Z" : sc.cine ? "cinématique" : sc.lines.length + " répliques") : "Pas encore vécue"}${got && typeof storyQPending === "function" && storyQPending(sc) ? `<span class="jn-q">une question t'attend</span>` : ""}</div>
    </div>
    ${got ? ic("arrow") : ""}
  </div>`;
}
SCREENS.journal = {
  html(){
    const seen = S.story.filter(id=>STORY_BY_ID[id]).length, tot = STORY.length;
    const acts = STORY_ACTS.map(A=>{
      const list = STORY.filter(sc=>A.act === null ? sc.act === undefined : sc.act === A.act);
      const got = list.filter(sc=>S.story.includes(sc.id));
      if(!list.length || (A.hide && !got.length)) return "";
      /* un acte pas encore commencé : une seule ligne, sans titres de scènes */
      if(!got.length) return `<div class="jn-act sealed"><div class="jn-ah"><small>${esc(A.n)}</small><b>${esc(A.t)}</b><span>0 / ${list.length}</span></div></div>`;
      return `<div class="jn-act"><div class="jn-ah"><small>${esc(A.n)}</small><b>${esc(A.t)}</b><span>${got.length} / ${list.length}</span></div>
        <div class="list">${list.map(journalRow).join("")}</div></div>`;
    }).join("");
    return `
      <div class="h">${ic("quest")} JOURNAL</div>
      <div class="sub">Le récit se relit ici, acte par acte. Ce qui n'a pas encore eu lieu attend.</div>
      <div class="panel bracket">
        <div class="row between tiny"><span class="muted">Scènes vécues</span><b>${seen} / ${tot}</b></div>
        <div class="bar" style="margin-top:6px"><i style="width:${seen/tot*100}%"></i></div>
        <div class="row between tiny" style="margin-top:8px"><span class="muted">Connexion</span><b>n° ${sagaConn()}</b></div>
      </div>
      ${typeof sagaCardHtml === "function" ? sagaCardHtml() : ""}
      ${typeof mnShareRowHtml === "function" ? mnShareRowHtml() : ""}
      ${acts}
      ${typeof memoryPanelHtml === "function" ? memoryPanelHtml() : ""}
      <button class="pzf-open" data-act="pzfile">
        <span class="pzf-ic">${pzFace(pzMood(), 34)}</span>
        <span class="grow"><b>choses_formidables.txt</b><small>${fmt(pzLineCount())} lignes · le fichier de Porygon-Z</small></span>${ic("arrow")}</button>
      ${fragmentsPanel()}
      ${typeof onzePanelHtml === "function" ? onzePanelHtml() : ""}
      <button class="btn wide" style="margin-top:10px" data-act="cineplay" data-k="intro">${ic("eye")} Revoir l'ouverture — L'écriture interrompue</button>
      ${S.saga && S.saga.wrote ? `<button class="btn wide" style="margin-top:7px" data-act="cineplay" data-k="credits">${ic("star")} Revoir le générique</button>` : ""}
      <div class="btn-grid c2" style="margin-top:10px">
        <button class="btn ghost" data-act="info" data-k="glossaire">Les mots du système</button>
        <button class="btn ghost" data-act="codeopen">Saisir un code</button>
      </div>
      ${factionOpen() ? `<button class="btn wide" style="margin-top:7px" data-act="goto" data-to="faction">
        ${ic("eye")} Factions${S.faction && S.faction.k ? " — " + esc(FACTIONS[S.faction.k].n) : " — à choisir"}</button>` : ""}

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
        <div class="h sm">ICÔNES D'OBJETS</div>
        <div class="tiny">Les Balls, baies, pierres, objets tenus, trésors et accessoires utilisent les sprites
          d'objets officiels du dépôt communautaire <b>PokeAPI/sprites</b> (images © Nintendo / Game Freak,
          utilisées ici dans un cadre de fan non commercial). Les objets propres à Code Genesis — Data Ball,
          Archives, Câble Link, Boussole fêlée, Module d'attraction, Bouclier Data — sont des icônes originales
          dessinées pour le jeu.</div>
      </div>
      <div class="panel">
        <div class="h sm">SPRITES DE MARCHE DE LA BRÈCHE</div>
        <div class="tiny">Les Pokémon de la Brèche marchent grâce aux sprites « de donjon » en huit directions
          du même dépôt <b>PMDCollab/SpriteCollab</b>, œuvre de nombreux artistes de la communauté Pokémon
          Donjon Mystère. <span class="muted">Licence <b>CC BY-NC 4.0</b> ; la liste des artistes de chaque
          sprite figure dans le dépôt (fichiers credits de chaque espèce).</span></div>
      </div>

      <div class="panel">
        <div class="h sm">ÉCRITURE</div>
        <div class="tiny">Récit, dialogues et notices du Pokédex écrits pour ce projet.
          Les 386 notices d'espèces proviennent de la première version du jeu.</div>
      </div>

      <div class="panel">
        <div class="h sm">DETTES ASSUMÉES</div>
        <div class="tiny">Le Poké-Poker doit sa structure — manches, programmes empilés, Jetons
          multipliés par un Multiplicateur — à <b>Balatro</b>, de LocalThunk. Le programme
          « Le Jeu du Dessous » est un clin d'œil, pas un hasard.</div>
        <div class="tiny muted" style="margin-top:5px">Aucun code n'en est repris : seule la
          grammaire de jeu a servi de modèle.</div>
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
/* un cycle se boucle une fois MissingNo vaincu, au fond de la Couche Zéro (ou, pour une
   partie d'avant le nouveau récit, une fois l'ancien épilogue atteint) */
function cycleReady(){ return !!(S.flags && (S.flags.mnBeaten || S.flags.climax)); }
function cycleCopy(){
  if(S.flags && S.flags.finalChoice === "erase") return {
    sub:"Tu as choisi d'effacer. Le monde repartira de zéro, et Porygon-Z avec lui : il ne se souviendra de rien. Toi, si.",
    ask:"Le monde est remis à zéro, et Porygon-Z oublie tout. Tu conserves tes cartes, tes cosmétiques, tes succès, le journal, ses pages, et tes avantages permanents.",
    go:"Effacer"};
  if(S.saga && S.saga.wrote) return {
    sub:"Le monde est sauvegardé. Un nouveau cycle rejoue une copie de la sauvegarde d'origine, en se souvenant de tout. Porygon-Z vient avec toi.",
    ask:"Une copie de la sauvegarde d'origine est chargée : tout est à refaire, mais rien n'est oublié. Porygon-Z garde sa mémoire et repart avec toi, au niveau 5.",
    go:"Recommencer"};
  return {
    sub:"Un cycle se boucle au fond de la Couche Zéro, une fois MissingNo vaincu. Rien n'empêche de recommencer — et de recommencer mieux.",
    ask:"Le monde est remis à zéro. Vous conservez vos cartes, vos cosmétiques, vos succès, le journal et vos avantages permanents.",
    go:"Boucler"};
}

SCREENS.cycle = {
  html(){
    const ready = cycleReady();
    const gain = cycleReward();
    const sel = (S.nextMods || []);
    const selBonus = sel.reduce((a,k)=>a + CYCLE_MODS[k].bonus, 0);
    return `
      <div class="h">${ic("refresh")} NOUVEAU CYCLE ${infoBtn("cycle")}</div>
      <div class="sub">${esc(cycleCopy().sub)}</div>

      <div class="panel bracket">
        <div class="tiles">
          <div class="tile accent"><div class="k">Cycle actuel</div><div class="v">${cycleN() + 1}</div></div>
          <div class="tile gold"><div class="k">Noyaux Zéro</div><div class="v">${S.zero || 0}</div></div>
        </div>
        ${ready
          ? `<div class="tiny ok" style="margin-top:8px">Ce cycle peut être bouclé.
             Il rapportera <b>${gain} Noyaux Zéro</b>.</div>`
          : `<div class="tiny muted" style="margin-top:8px">Un cycle se boucle une fois MissingNo vaincu, au fond de la
             Couche Zéro : intégrité à 100 %, les neuf verrous levés, les trois secteurs réindexés.</div>`}
      </div>

      <div class="h sm">CE QUI TRAVERSE LE CYCLE</div>
      <div class="panel tight">
        <div class="tiny ok">Conservé — cartes légendaires, cosmétiques, succès, journal des scènes, pages de journal,
          choses_formidables.txt, Noyaux Zéro, avantages permanents${perkLv("p_keep")?", objets tenus":""}.</div>
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
        ${esc(cycleCopy().go)} et recommencer</button>
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
  const cc = cycleCopy();
  sheet(`${sheetHead(cc.go + " ?")}
    <div class="tiny muted">${esc(cc.ask)}</div>
    <div class="tiles" style="margin:10px 0">
      <div class="tile gold"><div class="k">Noyaux Zéro gagnés</div><div class="v">+${g}</div></div>
      <div class="tile accent"><div class="k">Prochain cycle</div><div class="v">${cycleN()+2}</div></div>
    </div>
    <div class="tiny bad">Cette action est définitive.</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn ghost" data-act="closesheet">Annuler</button>
      <button class="btn dan" data-act="cycledo">${esc(cc.go)}</button>
    </div>`, true);
};
ACTIONS.cycledo = () => {
  const g = cycleReward();
  /* la réponse donnée au fond de la Couche Zéro décide de la connexion suivante */
  const saga = typeof sagaState === "function" ? sagaState() : (S.saga || {});
  const path = S.flags.finalChoice === "erase" ? "erase" : (S.flags.finalDone || saga.wrote) ? "write" : "erase";
  if(S.flags.finalChoice === "erase"){ saga.erased = (saga.erased || 0) + 1; saga.end = "erase"; }
  const keep = {
    cards: S.cards, cos: S.cos, ach: S.ach, story: S.story, tutos: S.tutos,
    zero: (S.zero||0) + g, perks: S.perks || {}, name: S.name,
    netRev: S.netRev, netMail: S.netMail, settings: S.settings,
    saga, pzlog: S.pzlog || [], pzlogK: S.pzlogK || {},
    fragments: S.fragments || [], fragWhere: S.fragWhere || {}, fragUnread: S.fragUnread || [], rift: S.rift || {stage:0, seen:0},
    cycle: {n: cycleN() + 1, mods: (S.nextMods || []).slice(), end: path},
    held: perkLv("p_keep") ? S.held : {owned:[], eq:null},
    lifetime: {
      catches: ((S.lifetime && S.lifetime.catches)||0) + S.stats.catches,
      shinies: ((S.lifetime && S.lifetime.shinies)||0) + S.stats.shinies,
      cycles: cycleN() + 1
    }
  };
  const fresh = newState();
  Object.assign(fresh, keep);
  /* le nom traverse le cycle : on ne le redemande pas */
  if(S.flags && S.flags.named) fresh.flags.named = true;
  /* avantages de départ */
  const startLv = 1 + 4*perkLv("p_start");
  if(startLv > 1){ fresh.level = startLv; }
  fresh.nextMods = [];
  S = fresh;
  /* après avoir écrit, il repart avec toi — au niveau 5, et vexé de l'être */
  if(path === "write" && typeof sagaWritePz === "function") sagaWritePz(5);
  applyCorruption();
  save();
  closeSheet();
  Sfx.win();
  revealSheet(`CYCLE ${cycleN()+1}`, [
    {icon:"core", label:`${g} Noyaux Zéro`, color:"var(--violet)", big:true},
    ...((S.cycle.mods||[]).map(k=>({icon:"bolt", label:CYCLE_MODS[k].n, sub:"modificateur actif",
      color:"var(--magenta)"}))),
    {icon:"dex", label:"Archive remise à zéro", color:"var(--cyan)"}
  ], {icon:"refresh", sub:path === "write" ? `Connexion n° ${sagaConn()}. Copie de la sauvegarde d'origine : tout est à refaire, rien n'est oublié.`
                                          : `Connexion n° ${sagaConn()}. Le compteur repart de zéro. Lui ne se souvient de rien. Toi, si.`});
  try { checkAchievements(); } catch(e){}
};
