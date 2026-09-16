/* ============================================================
   50 — EXPEDITION (roguelike a embranchements)
   ============================================================ */

const EXP_ROWS = 12, EXP_COLS = 4;

const NODE_TYPES = {
  fight:   {n:"Combat",     i:"battle", c:"var(--ink)"},
  elite:   {n:"Élite",      i:"boss",   c:"var(--magenta)"},
  event:   {n:"Événement",  i:"eye",    c:"var(--violet)"},
  shop:    {n:"Cache",      i:"shop",   c:"var(--amber)"},
  rest:    {n:"Repos",      i:"heart",  c:"var(--green)"},
  treasure:{n:"Trésor",     i:"chest",  c:"var(--amber)"},
  boss:    {n:"Noyau",      i:"boss",   c:"var(--magenta)"}
};

const RELICS = [
  {id:"r_atk", n:"Registre offensif",  d:"+18% d'Attaque et d'Attaque Spéciale.",  f:t=>{t.atk*=1.18;t.spa*=1.18;}},
  {id:"r_def", n:"Tampon défensif",    d:"+22% de Défense et Défense Spéciale.",   f:t=>{t.def*=1.22;t.spd*=1.22;}},
  {id:"r_hp",  n:"Bloc de mémoire",    d:"+25% de PV max.",                        f:t=>{t.maxHp=Math.floor(t.maxHp*1.25);t.hp=t.maxHp;}},
  {id:"r_spe", n:"Horloge accélérée",  d:"+30% de Vitesse.",                       f:t=>{t.spe*=1.3;}},
  {id:"r_heal",n:"Auto-réparation",    d:"Soigne 18% des PV après chaque combat.", post:0.18},
  {id:"r_heal2",n:"Routine de soin",   d:"Soigne 32% des PV après chaque combat.", post:0.32},
  {id:"r_bits",n:"Collecteur",         d:"+60% de Bits gagnés.",                   bits:1.6},
  {id:"r_recr",n:"Protocole d'accueil",d:"Un choix de recrue supplémentaire.",     recruit:1},
  {id:"r_rest",n:"Veille prolongée",   d:"Les nœuds Repos soignent totalement.",   rest:1},
  {id:"r_elite",n:"Appât à verrous",   d:"Les Élites donnent le double de butin.", elite:2},
  {id:"r_fire",n:"Noyau thermique",    d:"+35% de dégâts des attaques Feu.",       dmgType:10},
  {id:"r_water",n:"Noyau hydrique",    d:"+35% de dégâts des attaques Eau.",       dmgType:11},
  {id:"r_elec",n:"Noyau électrique",   d:"+35% de dégâts des attaques Électrik.",  dmgType:13},
  {id:"r_psy", n:"Noyau psionique",    d:"+35% de dégâts des attaques Psy.",       dmgType:14},
  {id:"r_rev", n:"Réindexation auto",  d:"Réanime un allié à 40% après un combat perdu par KO.", revive:1},
  {id:"r_shard",n:"Extracteur",        d:"+8 Fragments par combat remporté.",      shard:8},
  {id:"r_xp",  n:"Compilateur",        d:"Niveau permanent supplémentaire à la fin du run.", xp:1},
  {id:"r_corr",n:"Affinité corrompue", d:"+8% de dégâts par palier de corruption du run.", corr:1}
];

const EXP_EVENTS = [
  {n:"Terminal abandonné", t:"Un terminal encore allumé affiche un formulaire vide. Le curseur clignote.",
   opts:[{t:"Écrire son nom", f:r=>{ r.bits += 40; return "Le terminal verse 40 Bits sans explication."; }},
         {t:"Effacer le champ", f:r=>{ healTeam(r, .25); return "Quelque chose se détend. L'équipe récupère 25% de ses PV."; }}]},
  {n:"Fragment instable", t:"Un éclat de code flotte en travers du couloir. Il vibre à une fréquence désagréable.",
   opts:[{t:"L'absorber", f:r=>{ const rel = grantRelic(r); return rel ? "Relique acquise : "+rel.n : "Rien à en tirer."; }},
         {t:"Le contourner", f:r=>{ r.bits += 25; return "Prudence récompensée : 25 Bits trouvés plus loin."; }}]},
  {n:"Cage de données", t:"Une entité est bloquée dans une boucle. Elle répète la même animation depuis longtemps.",
   opts:[{t:"La libérer", f:r=>{ const id = randomWildId(); r.team.push(newRunMon(r, id)); return POKE[id].name+" rejoint l'expédition."; }},
         {t:"La laisser", f:r=>{ r.bits += 60; return "Vous récupérez les Bits accumulés dans la boucle : +60."; }}]},
  {n:"Miroir de secteur", t:"Le couloir se dédouble. Une version de votre équipe avance en sens inverse.",
   opts:[{t:"Traverser", f:r=>{ r.corruption++; r.bits += 90; return "Corruption +1. Le butin s'améliore, les ennemis aussi."; }},
         {t:"Faire demi-tour", f:r=>{ healTeam(r,.15); return "L'équipe souffle un peu. +15% de PV."; }}]},
  {n:"Sauvegarde orpheline", t:"Un fichier de sauvegarde daté d'une tentative antérieure. Il porte un autre nom que le vôtre.",
   opts:[{t:"Le lire", f:r=>{ r.bits += 70; r.corruption++; return "Vous apprenez quelque chose d'utile. Et d'inquiétant."; }},
         {t:"Le supprimer", f:r=>{ healTeam(r,.4); return "Le couloir s'allège. L'équipe récupère 40% de ses PV."; }}]},
  {n:"Distributeur défectueux", t:"Une machine propose trois boutons non étiquetés.",
   opts:[{t:"Appuyer", f:r=>{ if(rng()<.5){ r.bits += 120; return "+120 Bits."; } damageTeam(r,.2); return "Décharge. L'équipe perd 20% de ses PV."; }},
         {t:"S'abstenir", f:r=>"Vous passez votre chemin."}]},
  {n:"Colonne de bruit", t:"Une colonne de statique traverse le sol et le plafond. Elle chante presque.",
   opts:[{t:"Y plonger une main", f:r=>{ const rel = grantRelic(r); damageTeam(r,.15); return (rel?"Relique : "+rel.n:"Rien.")+" L'équipe est secouée."; }},
         {t:"L'écouter", f:r=>{ r.heals++; return "Vous repartez avec une trousse de restauration."; }}]},
  {n:"Ancien archiviste", t:"Une silhouette assise contre un mur. Elle n'a plus de texture, seulement un contour.",
   opts:[{t:"Lui parler", f:r=>{ healTeam(r,1); return "Elle ne répond pas, mais votre équipe est entièrement restaurée."; }},
         {t:"Prendre son sac", f:r=>{ r.bits += 100; r.heals += 2; r.corruption++; return "+100 Bits, 2 restaurations. Vous ne vous retournez pas."; }}]}
];

/* ---------- helpers de run ---------- */
function randomWildId(){
  const regs = unlockedRegions();
  const r = pick(regs);
  for(let k=0;k<40;k++){ const id = randInt(r.from, r.to); if(POKE[id] && !POKE[id].leg) return id; }
  return r.from;
}
function newRunMon(run, id, lvl){
  const level = lvl || run.level;
  const f = makeFighter(id, level, {shiny: S.dex[id]?.shiny});
  applyRelics(run, f);
  return {id, level, hp:f.maxHp, maxHp:f.maxHp};
}
function runFighter(run, m){
  const f = makeFighter(m.id, m.level, {shiny: S.dex[m.id]?.shiny});
  applyRelics(run, f);
  f.maxHp = m.maxHp || f.maxHp;
  f.hp = clamp(m.hp, 0, f.maxHp);
  f.ref = m;
  return f;
}
function applyRelics(run, f){
  for(const rid of run.relics){
    const r = RELICS.find(x=>x.id===rid);
    if(r && r.f) r.f(f);
  }
  f.atk=Math.floor(f.atk); f.spa=Math.floor(f.spa); f.def=Math.floor(f.def);
  f.spd=Math.floor(f.spd); f.spe=Math.floor(f.spe);
}
function relicVal(run, key){
  let v = 0;
  for(const rid of run.relics){ const r = RELICS.find(x=>x.id===rid); if(r && r[key]) v += r[key]; }
  return v;
}
function hasRelic(run, id){ return run.relics.includes(id); }
function grantRelic(run){
  const avail = RELICS.filter(r=>!run.relics.includes(r.id));
  if(!avail.length) return null;
  const r = pick(avail);
  run.relics.push(r.id);
  return r;
}
function healTeam(run, pct){
  for(const m of run.team){ m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp*pct)); }
}
function damageTeam(run, pct){
  for(const m of run.team){ m.hp = Math.max(1, m.hp - Math.floor(m.maxHp*pct)); }
}

/* ---------- generation de carte ---------- */
function genMap(seed){
  const r = mulberry32(seed);
  const rows = [];
  for(let y=0; y<EXP_ROWS; y++){
    let cols;
    if(y === 0) cols = shuffle([0,1,2,3], r).slice(0, 2 + Math.floor(r()*2)).sort();
    else if(y === EXP_ROWS-1) cols = [1];
    else cols = shuffle([0,1,2,3], r).slice(0, 2 + Math.floor(r()*3)).sort((a,b)=>a-b);
    rows.push(cols.map(c=>({c, t:nodeTypeFor(y, r), next:[], done:false})));
  }
  /* liens : chaque noeud vers 1-2 noeuds proches de la rangee suivante */
  for(let y=0; y<EXP_ROWS-1; y++){
    const nx = rows[y+1];
    for(const n of rows[y]){
      const sorted = nx.slice().sort((a,b)=>Math.abs(a.c-n.c)-Math.abs(b.c-n.c));
      const k = 1 + (r() < 0.45 && sorted.length > 1 ? 1 : 0);
      n.next = sorted.slice(0,k).map(x=>nx.indexOf(x));
    }
    /* garantir que chaque noeud de la rangee suivante est atteignable */
    nx.forEach((n,i)=>{
      if(!rows[y].some(p=>p.next.includes(i))){
        const closest = rows[y].reduce((a,b)=>Math.abs(b.c-n.c)<Math.abs(a.c-n.c)?b:a);
        closest.next.push(i);
      }
    });
  }
  return rows;
}
function nodeTypeFor(y, r){
  if(y === EXP_ROWS-1) return "boss";
  if(y === 0) return "fight";
  if(y === 1) return r() < 0.5 ? "fight" : "event";
  if(y === EXP_ROWS-2) return "rest";
  const x = r();
  if(x < 0.40) return "fight";
  if(x < 0.54) return "event";
  if(x < 0.65) return "elite";
  if(x < 0.76) return "rest";
  if(x < 0.88) return "shop";
  return "treasure";
}

/* ---------- lancement ---------- */
function startExpedition(ids){
  const seed = Math.floor(rng()*1e9);
  const avg = Math.round(ids.reduce((a,id)=>a+S.dex[id].lvl,0)/ids.length);
  const run = {
    seed, map: genMap(seed), row: -1, col: -1, avail: null,
    level: clamp(avg, 5, 95), relics: [], bits: 60, corruption: 0,
    heals: 1 + (heldActive("exp") ? 1 : 0), usedHeal: false,
    team: [], floor: 0, log: [], ended:false
  };
  run.team = ids.map(id=>newRunMon(run, id, S.dex[id].lvl));
  if(heldActive("relic")) grantRelic(run);
  run.avail = run.map[0].map((_,i)=>i);
  S.expedition = run;
  S.stats.expRuns++;
  save();
  go("expedition");
}
function endExpedition(win){
  const run = S.expedition;
  if(!run || run.ended) return;
  run.ended = true;

  /* niveaux permanents : on garde l'avant et l'apres pour pouvoir les montrer */
  const bonusLv = 1 + relicVal(run, "xp") + (win ? 1 : 0);
  const gains = [];
  for(const m of run.team){
    if(!S.dex[m.id]) continue;              /* une recrue sauvage n'entre pas a l'archive */
    const before = S.dex[m.id].lvl;
    const add = m.hp > 0 ? bonusLv : 0;
    S.dex[m.id].lvl = Math.min(100, before + add);
    gains.push({id:m.id, before, after:S.dex[m.id].lvl, alive:m.hp > 0});
  }

  const mult = (win ? 1 : 0.35) * (win ? consumeFirstWin("expedition") : 1);
  const shards = Math.round((60 + run.floor*12 + run.corruption*18) * mult);
  const coins  = Math.round((500 + run.floor*140) * mult);
  const xp     = Math.round((260 + run.floor*55) * mult);
  gain("shards", shards); gain("coins", coins); addXp(xp);

  /* butin exclusif : les oeufs ne s'obtiennent quasiment que par ici */
  const loot = [];
  if(win){
    S.stats.expWins++; S.daily.dayExp++; questTick("dayExp",1);
    if(!run.usedHeal) S.flags.expNoHeal = true;
    addIntegrity(0.5);
    gain("cores", 1);
    const tier = run.corruption >= 4 ? "e_origin" : run.corruption >= 2 ? "e_epic"
               : run.floor >= 11 ? "e_rare" : "e_common";
    grantEgg(tier);
    loot.push({icon:"box", label:EGG_TIERS[tier].n, sub:"éclôt avec vos captures",
               color:EGG_TIERS[tier].c, big:tier !== "e_common"});
    /* le noyau emet une carte : la corruption prise en chemin ameliore la serie */
    const cw = randomCard(1 + run.corruption * 0.55);
    const cwNew = grantCardV(cw.s, cw.id);
    run._card = cwNew ? cw : null;
    loot.push({icon:"cards", label:POKE[cw.id].name,
               sub:"carte " + CARD_SERIES_DEF[cw.s].n + (cwNew ? "" : " · doublon"),
               color:CARD_SERIES_DEF[cw.s].c, big:true});
    if(rng() < 0.5){
      const h = randomHeld();
      if(h && grantHeld(h))
        loot.push({icon:"star", label:HELD_ITEMS[h].n, sub:"objet tenu", color:"var(--violet)", big:true});
    }
  }
  S.expedition = null;
  save();

  const relicList = run.relics.map(id=>RELICS.find(x=>x.id===id)).filter(Boolean);
  sheet(`<div class="center exprecap">
    <div class="h" style="justify-content:center;color:${win?"var(--cyan)":"var(--magenta)"}">
      ${win?"NOYAU ATTEINT":"EXPÉDITION INTERROMPUE"}</div>
    <div class="tiny muted">Étage ${run.floor+1} sur ${EXP_ROWS}${run.corruption?` · corruption ${run.corruption}`:""}</div>

    <div class="tiles" style="margin:10px 0">
      <div class="tile accent"><div class="k">Fragments</div><div class="v">+${shards}</div></div>
      <div class="tile gold"><div class="k">PokéCoins</div><div class="v">+${fmt(coins)}</div></div>
      <div class="tile"><div class="k">Expérience</div><div class="v">+${fmt(xp)}</div></div>
      <div class="tile"><div class="k">${win?"Noyaux":"Intégrité"}</div>
        <div class="v ${win?"vi":"dim"}">${win?"+1":"—"}</div></div>
    </div>

    ${loot.length?`<div class="h sm">BUTIN EXCLUSIF</div>
      <div class="baglist" style="margin-bottom:11px">
        ${loot.map(it=>`<div class="bagrow">
          <div class="bag-ic" style="color:${it.color}">${ic(it.icon)}</div>
          <div class="grow" style="text-align:left">
            <div class="bag-n">${esc(it.label)}</div>
            <div class="bag-d">${esc(it.sub)}</div></div>
        </div>`).join("")}
      </div>`:""}

    <div class="h sm">NIVEAUX PERMANENTS</div>
    ${gains.length?`<div class="lvlist">
      ${gains.map(g=>`<div class="lvrow ${g.alive?"":"ko"}">
        <span class="sprbox" style="width:34px;height:34px">${sprite(g.id, S.dex[g.id].shiny, "")}</span>
        <span class="grow tiny" style="text-align:left">${esc(POKE[g.id].name)}</span>
        <span class="lv-before">N.${g.before}</span>
        ${g.after > g.before
          ? `<span class="lv-arrow">▸</span><span class="lv-after">N.${g.after}</span>
             <span class="lv-delta">+${g.after-g.before}</span>`
          : `<span class="tiny bad">hors ligne</span>`}
      </div>`).join("")}
    </div>`:`<div class="empty" style="padding:14px">Aucun membre de votre archive n'a survécu.</div>`}

    ${relicList.length?`<div class="h sm" style="margin-top:11px">RELIQUES DU PARCOURS</div>
      <div class="wrap" style="justify-content:center">
        ${relicList.map(r=>`<span class="chip">${ic("shard2")} ${esc(r.n)}</span>`).join("")}
      </div>`:""}

    <button class="btn pri wide" style="margin-top:12px" data-act="expdone">Retour</button>
  </div>`);
  checkAchievements();
  guideTick();
}
ACTIONS.expdone = () => { closeSheet(); go("expedition"); checkStoryTriggers(); };

/* ---------- ecran ---------- */
SCREENS.expedition = {
  html(){
    const run = S.expedition;
    if(!run) return this.lobby();
    const floor = Math.max(0, run.row + 1);
    return `
      <div class="row between" style="margin-bottom:6px">
        <div class="h" style="margin:0">ÉTAGE ${floor}/${EXP_ROWS} ${infoBtn("expedition")}</div>
        <div class="row" style="gap:5px">
          <span class="pill">${ic("coin")} ${run.bits}</span>
          <span class="pill" style="${run.corruption?"border-color:var(--magenta);color:var(--magenta)":""}">
            Corr. ${run.corruption}</span>
        </div>
      </div>

      <div class="map-flow"><span>DÉPART</span><i></i><span class="bad">NOYAU</span></div>
      <div id="map-scroll"><div class="map-inner" id="map-inner">${this.mapHtml(run)}</div></div>
      <div class="row between tiny dim" style="margin-top:5px">
        <span>Étage ${floor}/${EXP_ROWS}</span>
        <span>${run.team.filter(m=>m.hp>0).length}/${run.team.length} opérationnels</span>
        <span>${run.relics.length} relique(s)</span>
      </div>

      <div class="exp-legend">
        ${Object.entries(NODE_TYPES).map(([k,t])=>
          `<span style="color:${t.c}">${ic(t.i)} ${t.n}</span>`).join("")}
      </div>

      <div class="h sm">ÉQUIPE — les PV ne se régénèrent pas</div>
      <div class="team-strip">${run.team.map(m=>`
        <div class="tmem ${m.hp<=0?"ko":""}">
          <span class="lv">${m.level}</span>
          <span class="sprbox" style="width:40px;height:40px">${sprite(m.id, S.dex[m.id]?.shiny, "")}</span>
          <div class="nm">${esc(POKE[m.id].name)}</div>
          <div class="bar hp ${m.hp/m.maxHp>.5?"":m.hp/m.maxHp>.2?"mid":"low"}">
            <i style="width:${Math.max(0,m.hp/m.maxHp*100)}%"></i></div>
        </div>`).join("")}</div>

      <div class="btn-grid c2" style="margin-top:9px">
        <button class="btn sm" data-act="expheal" ${run.heals?"":"disabled"}>Soin (${run.heals})</button>
        <button class="btn sm" data-act="exporder">${ic("grid")} Ordre de l'équipe</button>
      </div>
      <div class="btn-grid c2" style="margin-top:7px">
        <button class="btn sm ghost" data-act="exprelics">Reliques ${run.relics.length}</button>
        <button class="btn sm dan" data-act="expabandon">Abandonner</button>
      </div>`;
  },

  lobby(){
    const ok = moduleUnlocked("expedition");
    return `
      <div class="h">${ic("map")} EXPÉDITION ${infoBtn("expedition")}</div>
      <div class="sub">Une sonde profonde dans une couche non cartographiée.</div>
      ${moduleGoal("Descendez douze étages en choisissant votre route. Les combats sont automatiques : tout se joue dans la composition d'équipe et la gestion des points de vie.",
        "Des niveaux de combat permanents pour vos Pokémon — la seule préparation possible aux Data Guardians.")}

      <div class="panel bracket">
        <div class="map-flow"><span>DÉPART (haut)</span><i></i><span class="bad">NOYAU (bas)</span></div>
        <div class="tiny">Douze étages. À chaque étage, vous choisissez l'une des routes reliées à votre
          position. Les nœuds éclairés en ambre sont les seuls accessibles.</div>
      </div>

      <div class="panel">
        <div class="h sm">CE QU'IL FAUT SAVOIR</div>
        <div class="tiny">· Les <b>PV ne se régénèrent pas</b> entre les combats. Passez par les Repos
          <b>avant</b> les Élites, pas après.</div>
        <div class="tiny">· Les <b>Élites</b> garantissent une relique. Les reliques s'appliquent à
          toute l'équipe pour le reste du run.</div>
        <div class="tiny">· Les <b>Bits</b> ne servent qu'à l'intérieur du parcours et sont perdus à la fin.</div>
        <div class="tiny">· La <b>corruption</b> améliore le butin et renforce les ennemis. Elle ne redescend pas.</div>
        <div class="tiny">· Des entités sauvages peuvent rejoindre l'équipe en route (6 maximum).</div>
      </div>

      <div class="panel edge">
        <div class="h sm">POURQUOI Y ALLER</div>
        <div class="tiny">Les Pokémon qui <b>survivent</b> gagnent des <b class="cy">niveaux permanents</b>.
          C'est la seule façon de préparer une équipe pour les Data Guardians.</div>
      </div>

      <div class="tiles" style="margin-bottom:10px">
        <div class="tile accent"><div class="k">Terminées</div><div class="v">${S.stats.expWins}</div></div>
        <div class="tile"><div class="k">Tentatives</div><div class="v">${S.stats.expRuns}</div></div>
      </div>

      <button class="btn pri wide" data-act="expstart" ${ok?"":"disabled"}>Composer l'équipe et partir</button>
      <button class="btn ghost wide" style="margin-top:7px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  },

  /* le parcours se lit de haut en bas : depart en premiere rangee, noyau en derniere.
     Les liaisons sont tracees en SVG derriere les noeuds : sans elles, le joueur
     ne voit pas quelles routes partent de sa position. */
  mapHtml(run){
    const ROW_H = 74, PAD = 18;
    const H = EXP_ROWS * ROW_H + PAD*2;
    const xOf = (row, i) => ((i + 0.5) / row.length) * 100;
    const yOf = y => PAD + y*ROW_H + ROW_H/2;

    let links = "";
    for(let y = 0; y < EXP_ROWS-1; y++){
      run.map[y].forEach((n, i) => {
        for(const j of n.next){
          const live = run.row === y && run.col === i;
          const past = n.done && run.row > y;
          links += `<line x1="${xOf(run.map[y], i)}%" y1="${yOf(y)}"
            x2="${xOf(run.map[y+1], j)}%" y2="${yOf(y+1)}"
            class="mlink ${live?"live":past?"past":""}"/>`;
        }
      });
    }

    let rows = "";
    for(let y = 0; y < EXP_ROWS; y++){
      const row = run.map[y];
      rows += `<div class="map-row" style="height:${ROW_H}px">` + row.map((n,i)=>{
        const isCur   = run.row === y && run.col === i;
        const isAvail = (run.row === y-1 || (run.row === -1 && y === 0)) && (run.avail||[]).includes(i);
        const t = NODE_TYPES[n.t];
        return `<div class="node ${n.t==="boss"?"boss":""} ${n.done?"done":""} ${isCur?"cur":""} ${isAvail?"avail":""}"
          ${isAvail?`data-act="expnode" data-y="${y}" data-i="${i}"`:""} style="color:${t.c}">
          ${i===0?`<span class="nb">${y+1}</span>`:""}
          ${ic(t.i)}<small>${t.n}</small>
          ${isCur?'<span class="here"></span>':""}
        </div>`;
      }).join("") + `</div>`;
    }
    return `<svg id="map-links" viewBox="0 0 100 ${H}" preserveAspectRatio="none"
      style="height:${H}px">${links}</svg>${rows}`;
  },

  after(){
    const sc = document.getElementById("map-scroll");
    const run = S.expedition;
    if(sc && run){
      /* garder la rangee jouable visible */
      const target = Math.max(0, (run.row + 1) * 74 - 130);
      sc.scrollTop = run.row < 0 ? 0 : target;
    }
    if(run) tutoMaybe("expedition");
  }
};
ACTIONS.expstart = () => {
  if(!moduleUnlocked("expedition")) return;
  teamPicker("Équipe de départ (4 max)", 4, ids=>{ if(ids.length) startExpedition(ids); });
};
ACTIONS.expabandon = () => {
  sheet(`${sheetHead("Abandonner l'expédition ?")}
    <div class="tiny muted">Vous conservez une partie réduite des récompenses. La carte est perdue.</div>
    <div class="btn-grid c2" style="margin-top:9px">
      <button class="btn ghost" data-act="closesheet">Continuer</button>
      <button class="btn dan" data-act="expabandon2">Abandonner</button></div>`, true);
};
ACTIONS.expabandon2 = () => { closeSheet(); endExpedition(false); };
ACTIONS.expheal = () => {
  const run = S.expedition;
  if(!run || !run.heals) return;
  run.heals--; run.usedHeal = true; healTeam(run, .45);
  toast("Équipe restaurée de 45%", "", "heart"); save(); refresh();
};
/* l'ordre decide qui entre en jeu : il doit etre modifiable en cours de route */
function drawExpOrder(){
  const run = S.expedition;
  sheet(`${sheetHead("Ordre de l'équipe")}
    <div class="tiny muted" style="margin-bottom:9px">Le premier valide entre en jeu ; les suivants
      prennent le relais quand il tombe. Modifiable à tout moment, sans coût.</div>
    <div class="tp-sel">
      ${run.team.map((m,i)=>{
        const ko = m.hp <= 0, pct = Math.max(0, m.hp/m.maxHp*100);
        return `<div class="tp-row ${ko?"ghost":""}">
          <span class="tp-pos">${i+1}</span>
          <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, S.dex[m.id]?.shiny, "")}</span>
          <div class="grow">
            <div class="tiny">${esc(POKE[m.id].name)} <span class="dim">N.${m.level}</span></div>
            <div class="bar hp ${pct>50?"":pct>20?"mid":"low"}" style="margin-top:4px">
              <i style="width:${pct}%"></i></div>
            <div class="tiny dim mono-num">${ko?"hors ligne":`${m.hp} / ${m.maxHp}`}</div>
          </div>
          <div class="tp-ord">
            <button class="tp-b" data-act="expmove" data-i="${i}" data-d="-1" ${i===0?"disabled":""}>▲</button>
            <button class="tp-b" data-act="expmove" data-i="${i}" data-d="1" ${i===run.team.length-1?"disabled":""}>▼</button>
          </div>
        </div>`;}).join("")}
    </div>
    <button class="btn pri wide" style="margin-top:10px" data-act="closeandrefresh">Fermer</button>`);
}
ACTIONS.exporder = () => drawExpOrder();
ACTIONS.expmove = d => {
  const run = S.expedition, i = +d.i, j = i + (+d.d);
  if(j < 0 || j >= run.team.length) return;
  [run.team[i], run.team[j]] = [run.team[j], run.team[i]];
  saveSoon();
  drawExpOrder();
};
ACTIONS.exprelics = () => {
  const run = S.expedition;
  sheet(`${sheetHead("Reliques du run")}
    ${run.relics.length ? `<div class="list">${run.relics.map(id=>{
      const r = RELICS.find(x=>x.id===id);
      return `<div class="item"><div class="ic">${ic("shard2")}</div>
        <div class="grow"><div class="t">${esc(r.n)}</div><div class="d">${esc(r.d)}</div></div></div>`;
    }).join("")}</div>` : `<div class="tiny muted">Aucune relique pour l'instant.</div>`}`);
};

/* ---------- entree dans un noeud ---------- */
ACTIONS.expnode = d => {
  const run = S.expedition;
  const y = +d.y, i = +d.i;
  if(!(run.row === y-1 || (run.row === -1 && y === 0))) return;
  if(!(run.avail||[]).includes(i)) return;
  run.row = y; run.col = i; run.floor = y;
  const node = run.map[y][i];
  node.done = true;
  run.avail = y < EXP_ROWS-1 ? node.next : [];
  save();
  enterNode(run, node);
};

function enterNode(run, node){
  switch(node.t){
    case "fight": case "elite": case "boss": return expFight(run, node.t);
    case "rest":     return expRest(run);
    case "shop":     return expShop(run);
    case "treasure": return expTreasure(run);
    case "event":    return expEvent(run);
  }
}

/* Difficulte de l'expedition.
   Les points de vie ne se regenerent pas : la menace est l'usure, pas la
   puissance brute d'un combat isole. Les adversaires restent donc proches
   du niveau de l'equipe, et c'est leur accumulation qui fait le defi. */
function enemyTeamFor(run, kind){
  const n = kind === "boss" ? 2 : kind === "elite" ? 2 : (run.floor > 9 ? 2 : 1);
  const lvBonus = kind === "boss" ? 4 : kind === "elite" ? 2 : 0;
  const boost = (kind === "boss" ? 1.12 : kind === "elite" ? 1.05 : 1)
              * (1 + run.corruption*0.06) * (cycleMod("m_tough") ? 1.3 : 1);
  const out = [];
  for(let k=0;k<n;k++){
    let id = randomWildId();
    if(kind === "boss"){
      const r = regionDef(S.region);
      const pool = [];
      /* fourchette bornee : un noyau reste un morceau, pas un mur */
      for(let j=r.from;j<=r.to;j++)
        if(POKE[j] && POKE[j].bst >= 460 && POKE[j].bst <= 560 && !POKE[j].leg) pool.push(j);
      if(pool.length) id = pick(pool);
    } else if(kind === "elite"){
      /* meilleur de deux, et non de sept : sinon l'Elite aligne des 600 de total */
      const alt = randomWildId();
      if(POKE[alt].bst > POKE[id].bst) id = alt;
    }
    const f = makeFighter(id, clamp(run.level + Math.floor(run.floor*0.7) + lvBonus, 3, 100), {boost});
    out.push(f);
  }
  return out;
}

function expFight(run, kind){
  const allies = run.team.filter(m=>m.hp>0).map(m=>runFighter(run, m));
  if(!allies.length){ endExpedition(false); return; }
  const foes = enemyTeamFor(run, kind);
  const titles = {fight:"CONTACT HOSTILE", elite:"SIGNATURE ÉLITE", boss:"NOYAU DE COUCHE"};
  createBattle(allies, foes, {
    ai: true, speed: S.settings.battleSpeed || 1,
    title: titles[kind],
    intro: kind === "boss" ? `Le noyau de la couche se manifeste.`
                           : `Des entités hostiles bloquent le passage.`,
    onEnd: win => {
      for(const f of allies) if(f.ref){ f.ref.hp = Math.max(0, f.hp); }
      if(!win && relicVal(run,"revive") && run.team.some(m=>m.hp<=0)){
        const m = run.team.find(x=>x.hp<=0);
        m.hp = Math.floor(m.maxHp*0.4);
        toast("Réindexation automatique déclenchée", "warn", "heart");
        go("expedition"); save(); return;
      }
      if(!win){ endExpedition(false); return; }
      /* l'entite vaincue est celle qu'on pourra recruter : c'est elle qu'on a affrontee */
      const beaten = foes.map(f=>f.id);
      afterFightRewards(run, kind, beaten);
    }
  });
  go("battle");
}

function afterFightRewards(run, kind, beaten){
  const heal = 0.25 + relicVal(run, "post");
  healTeam(run, heal);
  const bitsMul = relicVal(run, "bits") || 1;
  const eliteMul = kind === "elite" ? (relicVal(run,"elite")||1) : 1;
  const bits = Math.round((28 + run.floor*7 + run.corruption*6) * bitsMul * eliteMul *
                          (kind==="elite"?1.7:1));
  run.bits += bits;
  const shardGain = relicVal(run, "shard");
  if(shardGain) gain("shards", shardGain);

  if(kind === "boss"){ save(); endExpedition(true); return; }

  const relic = (kind === "elite") ? grantRelic(run) : (rng() < 0.22 ? grantRelic(run) : null);
  const held  = (kind === "elite" && rng() < 0.45) ? randomHeld() : null;
  if(held) grantHeld(held);

  /* un contact hostile propose l'entite qu'on vient de vaincre */
  const candidate = (kind === "fight" && beaten && beaten.length)
    ? beaten[randInt(0, beaten.length-1)] : null;
  run.pendingRecruit = candidate;
  save();

  sheet(`<div class="center">
    <div class="h" style="justify-content:center">COUCHE DÉGAGÉE</div>
    <div class="tiles" style="margin:8px 0">
      <div class="tile gold"><div class="k">Bits</div><div class="v">+${bits}</div></div>
      <div class="tile accent"><div class="k">Récupération</div><div class="v">+${Math.round(heal*100)}%</div></div>
    </div>
    ${relic?`<div class="panel tight" style="text-align:left">
      <div class="row"><div class="bag-ic">${ic("shard2")}</div>
        <div class="grow"><div class="tiny">Relique : <b class="vi">${esc(relic.n)}</b></div>
          <div class="tiny muted">${esc(relic.d)}</div></div></div></div>`:""}
    ${held?`<div class="panel tight" style="text-align:left">
      <div class="row"><span class="sprbox" style="width:34px;height:34px">${sprite(HELD_ITEMS[held].spr,false,"")}</span>
        <div class="grow"><div class="tiny">Objet tenu : <b class="vi">${esc(HELD_ITEMS[held].n)}</b></div>
          <div class="tiny muted">${esc(HELD_ITEMS[held].d)}</div></div></div></div>`:""}

    ${candidate ? recruitBlock(run, candidate) : `
      <button class="btn pri wide" data-act="expcontinue">Continuer</button>`}
  </div>`, true);
}

/* ---------- recrutement de l'entite vaincue ---------- */
function recruitCompensation(run, id){
  return Math.round(45 + POKE[id].bst / 6 + run.floor * 4);
}
function recruitBlock(run, id){
  const p = POKE[id];
  const full = run.team.length >= 6;
  const comp = recruitCompensation(run, id);
  return `
    <div class="panel bracket" style="text-align:left">
      <div class="h sm">ENTITÉ AFFAIBLIE</div>
      <div class="row" style="gap:10px">
        <span class="sprbox" style="width:52px;height:52px">${sprite(id, false, "")}</span>
        <div class="grow">
          <div style="font-size:12px">${esc(p.name)}</div>
          <div class="wrap" style="gap:3px;margin-top:3px">${typeTags(p.types)}${rarTag(p.rar)}
            <span class="tt t1">Total ${p.bst}</span></div>
        </div>
      </div>
      <div class="tiny muted" style="margin-top:7px">
        ${full ? "Votre équipe est complète. Vous pouvez l'échanger contre un membre actuel, ou passer votre chemin."
               : "Elle peut rejoindre l'expédition. Elle n'entrera pas dans votre Pokédex : ce recrutement ne vaut que pour ce parcours."}
      </div>
    </div>
    <div class="btn-grid c2">
      <button class="btn" data-act="exppass" data-id="${id}">Continuer · +${comp} Bits</button>
      ${full
        ? `<button class="btn pri" data-act="expswap" data-id="${id}">Échanger</button>`
        : `<button class="btn pri" data-act="exprecruit" data-id="${id}">Recruter</button>`}
    </div>`;
}
ACTIONS.exppass = d => {
  const run = S.expedition;
  const comp = recruitCompensation(run, +d.id);
  run.bits += comp;
  run.pendingRecruit = null;
  toast(`+${comp} Bits`, "", "coin");
  save(); closeSheet(); go("expedition");
};
ACTIONS.exprecruit = d => {
  const run = S.expedition;
  if(run.team.length >= 6){ toast("Équipe complète", "bad", "cross"); return; }
  const id = +d.id;
  run.team.push(newRunMon(run, id, run.level));
  run.pendingRecruit = null;
  toast(POKE[id].name + " rejoint l'expédition", "", "check");
  save(); closeSheet(); go("expedition");
};
ACTIONS.expswap = d => {
  const run = S.expedition, id = +d.id;
  sheet(`${sheetHead("Échanger contre qui ?")}
    <div class="tiny muted" style="margin-bottom:9px">Le membre remplacé quitte l'expédition.
      Il ne gagnera donc <b>aucun niveau permanent</b> à la fin du parcours — mais il reste
      intact dans votre archive.</div>
    <div class="tp-sel">
      ${run.team.map((m,i)=>{
        const leg = POKE[m.id].leg > 0;
        return `<div class="tp-row">
          <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, S.dex[m.id]?.shiny, "")}</span>
          <div class="grow">
            <div class="tiny">${esc(POKE[m.id].name)} <span class="dim">N.${m.level}</span>
              ${leg?'<span class="tt" style="color:var(--amber);border-color:var(--amber)">LÉGENDAIRE</span>':""}</div>
            <div class="tiny ${m.hp>0?"dim":"bad"}">${m.hp>0?`${m.hp} / ${m.maxHp} PV`:"hors ligne"}</div>
          </div>
          <button class="btn xs ${leg?"dan":""}" data-act="expswapdo" data-i="${i}" data-id="${id}">
            ${leg?"Remplacer quand même":"Remplacer"}</button>
        </div>`;}).join("")}
    </div>
    <button class="btn ghost wide" style="margin-top:10px" data-act="expswapcancel" data-id="${id}">
      Annuler</button>`);
};
ACTIONS.expswapcancel = d => {
  const run = S.expedition;
  sheet(`<div class="center">${recruitBlock(run, +d.id)}</div>`, true);
};
ACTIONS.expswapdo = d => {
  const run = S.expedition, i = +d.i, id = +d.id;
  const out = run.team[i];
  run.team[i] = newRunMon(run, id, run.level);
  run.pendingRecruit = null;
  toast(`${POKE[out.id].name} quitte l'expédition, ${POKE[id].name} le remplace`, "warn", "refresh");
  save(); closeSheet(); go("expedition");
};
ACTIONS.expcontinue = () => { closeSheet(); go("expedition"); };

function expRest(run){
  const full = relicVal(run, "rest");
  sheet(`<div class="center">
    <div class="h">${ic("heart")} POINT DE REPOS</div>
    <div class="tiny muted" style="margin:6px 0">Une zone où le bruit de fond retombe.
      Les entités s'y reconstituent.</div>
    <div class="btn-grid c2">
      <button class="btn pri" data-act="exprest" data-k="heal">Soigner ${full?100:55}%</button>
      <button class="btn" data-act="exprest" data-k="relic">Chercher une relique</button>
    </div>
    <div class="tiny muted" style="margin-top:6px">Chercher une relique consomme le repos : 55% de réussite.</div>
  </div>`, true);
}
ACTIONS.exprest = d => {
  const run = S.expedition;
  if(d.k === "heal"){
    healTeam(run, relicVal(run,"rest") ? 1 : 0.55);
    toast("Équipe reconstituée", "", "heart");
  } else {
    if(rng() < 0.55){ const r = grantRelic(run); toast(r?"Relique : "+r.n:"Rien trouvé", "warn", "shard2"); }
    else toast("Rien dans cette zone.", "bad", "cross");
  }
  save(); closeSheet(); go("expedition");
};

function expTreasure(run){
  const r = grantRelic(run);
  const h = rng() < 0.18 ? randomHeld() : null;
  if(h) grantHeld(h);
  const eg = rng() < 0.30 ? grantEgg(randomEggTier()) : null;
  const bits = 60 + run.floor*10;
  run.bits += bits;
  run.heals++;
  save();
  sheet(`<div class="center"><div class="h">${ic("chest")} CACHE SCELLÉE</div>
    <div class="panel" style="text-align:left">
      <div class="row between tiny"><span>Bits</span><b class="gold-t">+${bits}</b></div>
      <div class="row between tiny"><span>Restauration</span><b>+1</b></div>
      ${r?`<div class="row between tiny"><span>Relique</span><b class="vi">${esc(r.n)}</b></div>
        <div class="tiny muted">${esc(r.d)}</div>`:""}
      ${h?`<div class="row between tiny"><span>Objet tenu</span><b class="vi">${esc(HELD_ITEMS[h].n)}</b></div>`:""}
      ${eg?`<div class="row between tiny"><span>Œuf</span><b class="vi">${esc(EGG_TIERS[eg].n)}</b></div>`:""}
    </div>
    <button class="btn pri wide" data-act="expcontinue">Prendre</button></div>`, true);
}

function expShop(run){
  if(!run.shopStock){
    run.shopStock = [
      {k:"heal", n:"Restauration", d:"Soigne 45% de l'équipe.", p:45},
      {k:"relic", n:"Relique inconnue", d:"Une relique au hasard.", p:130},
      {k:"hp", n:"Bloc de PV", d:"+18% PV max à toute l'équipe.", p:110},
      {k:"full", n:"Purge complète", d:"Soigne l'équipe entièrement.", p:90}
    ];
  }
  const draw = () => sheet(`${sheetHead("Cache d'échange")}
    <div class="tiny muted" style="margin-bottom:7px">Bits disponibles : <b class="gold-t">${run.bits}</b></div>
    <div class="list">
      ${run.shopStock.map((it,i)=>`<div class="shopitem">
        <div class="ic">${ic(it.k==="relic"?"shard2":it.k==="hp"?"bolt":"heart")}</div>
        <div class="grow"><div>${esc(it.n)}</div><div class="tiny muted">${esc(it.d)}</div></div>
        <button class="btn sm ${run.bits>=it.p?"gold":""}" data-act="expbuy" data-i="${i}"
          ${run.bits>=it.p?"":"disabled"}>${it.p}</button></div>`).join("")}
    </div>
    <button class="btn pri wide" style="margin-top:9px" data-act="expcontinue">Repartir</button>`);
  SCREENS._expShopDraw = draw;
  draw();
}
ACTIONS.expbuy = d => {
  const run = S.expedition;
  const it = run.shopStock[+d.i];
  if(!it || run.bits < it.p) return;
  run.bits -= it.p;
  if(it.k === "heal") healTeam(run, .45);
  if(it.k === "full") healTeam(run, 1);
  if(it.k === "relic"){ const r = grantRelic(run); toast(r?"Relique : "+r.n:"Plus rien à acheter", "warn", "shard2"); }
  if(it.k === "hp") for(const m of run.team){ m.maxHp = Math.floor(m.maxHp*1.18); m.hp += Math.floor(m.maxHp*0.18); }
  run.shopStock.splice(+d.i, 1);
  Sfx.coin(); save();
  SCREENS._expShopDraw();
};

function expEvent(run){
  const ev = pick(EXP_EVENTS);
  run._ev = ev;
  sheet(`<div>
    <div class="h">${esc(ev.n)}</div>
    <div class="tiny" style="line-height:1.6;margin-bottom:10px">${esc(ev.t)}</div>
    <div class="btn-grid">
      ${ev.opts.map((o,i)=>`<button class="btn" data-act="expevopt" data-i="${i}">${esc(o.t)}</button>`).join("")}
    </div></div>`, true);
}
ACTIONS.expevopt = d => {
  const run = S.expedition;
  const res = run._ev.opts[+d.i].f(run);
  delete run._ev;
  save();
  sheet(`<div class="center"><div class="tiny" style="line-height:1.6;margin:10px 0">${esc(res)}</div>
    <button class="btn pri wide" data-act="expcontinue">Continuer</button></div>`, true);
};
