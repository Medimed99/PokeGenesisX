/* ============================================================
   34 — RECHERCHE, INTÉGRITÉ, TALENTS
   Une fois capturee, une espece ne servait plus a rien. Trois
   couches lui rendent une valeur individuelle :

   · les TACHES DE RECHERCHE donnent a chacune des 386 especes
     quatre objectifs propres, sans ajouter le moindre systeme ;
   · les POKEMON INTEGRES sont un second axe de collection,
     independant du chromatique ;
   · les TALENTS donnent a chaque espece un trait de combat tire
     de son type dominant.
   ============================================================ */

/* ---------- tâches de recherche ---------- */
const RESEARCH_TASKS = [
  {k:"catch",  n:"En restaurer {n}",        goal:id=>POKE[id].rar >= 4 ? 2 : POKE[id].rar >= 2 ? 4 : 8,
   d:"Capturer plusieurs exemplaires de cette espèce."},
  {k:"battle", n:"En vaincre {n} au combat", goal:id=>POKE[id].rar >= 4 ? 1 : 3,
   d:"L'affronter en expédition, à la Tour ou contre un verrou."},
  {k:"evolve", n:"La faire évoluer",         goal:id=>(POKE[id].evo && POKE[id].evo.length) ? 1 : 0,
   d:"Réécrire cette espèce en sa forme suivante."},
  {k:"shiny",  n:"En croiser une chromatique", goal:()=>1,
   d:"Rencontrer un exemplaire dont les couleurs ne correspondent pas."}
];
function researchOf(id){
  S.research = S.research || {};
  S.research[id] = S.research[id] || {catch:0, battle:0, evolve:0, shiny:0};
  return S.research[id];
}
function taskGoal(t, id){ return typeof t.goal === "function" ? t.goal(id) : t.goal; }
function taskDone(t, id){
  const g = taskGoal(t, id);
  return g > 0 && researchOf(id)[t.k] >= g;
}
/* niveau de recherche d'une espece : le nombre de taches accomplies */
function researchLevel(id){
  return RESEARCH_TASKS.filter(t=>taskGoal(t, id) > 0 && taskDone(t, id)).length;
}
function researchMax(id){ return RESEARCH_TASKS.filter(t=>taskGoal(t, id) > 0).length; }
function researchTotal(){
  let n = 0;
  for(const id in (S.research || {})) n += researchLevel(+id);
  return n;
}
/* paliers globaux : ce que la recherche rapporte a l'Archiviste */
const RESEARCH_TIERS = [
  {n:25,   rw:{coins:3000, shards:30}},
  {n:60,   rw:{cores:2, balls:{hyper:10}}},
  {n:120,  rw:{cores:4, cos:"fx_stream"}},
  {n:220,  rw:{cores:7, balls:{master:1}}},
  {n:360,  rw:{cores:12, cos:"title_index"}},
  {n:550,  rw:{cores:20}},
  {n:800,  rw:{cores:30, cos:"fx_prism"}}
];
function checkResearchTiers(){
  S.researchTiers = S.researchTiers || [];
  const tot = researchTotal();
  for(let i = 0; i < RESEARCH_TIERS.length; i++){
    const t = RESEARCH_TIERS[i];
    if(tot < t.n || S.researchTiers.includes(t.n)) continue;
    S.researchTiers.push(t.n);
    grantReward(t.rw);
    addIntegrity(0.8);
    Sfx.win();
    save();
    revealSheet(`RECHERCHE — ${t.n} TÂCHES`, rewardItems(t.rw),
      {icon:"dex", sub:"Le Pokédex n'est plus un inventaire : c'est un travail."});
    return true;
  }
  return false;
}
/* progression d'une tache, appelee par le reste du jeu */
function researchTick(id, kind, n){
  if(!id || !POKE[id]) return;
  const r = researchOf(id);
  const before = researchLevel(id);
  r[kind] = (r[kind] || 0) + (n || 1);
  const after = researchLevel(id);
  if(after > before){
    S.stats.research = (S.stats.research || 0) + (after - before);
    factionPts(5 * (after - before));
    gain("shards", 2 + POKE[id].rar);
    toast(`Recherche : ${POKE[id].name} ${after}/${researchMax(id)}`, "", "dex");
  }
  saveSoon();
}

/* ---------- Pokémon intègres ----------
   Un exemplaire sur cinquante est ecrit sans erreur d'arrondi. Cet
   axe est independant du chromatique : un commun peut etre integre,
   un legendaire peut ne pas l'etre. */
const PERFECT_ODDS = 1 / 50;
function rollPerfect(){
  return rng() < PERFECT_ODDS * perkMul("p_catch", 0.04);
}
function isPerfect(id){ return !!(S.dex[id] && S.dex[id].perfect); }
function perfectCount(){ return Object.values(S.dex || {}).filter(e=>e.perfect).length; }
/* un exemplaire integre rend +8% sur toutes les statistiques */
function perfectMul(id){ return isPerfect(id) ? 1.08 : 1; }

/* ---------- talents ----------
   Un par espece, derive du type dominant. La couche qui manquait au
   moteur de combat pour qu'il ressemble vraiment a Pokemon. */
const TALENTS = {
  10:{n:"Brasier",     d:"+35% de dégâts quand les PV tombent sous un tiers."},
  11:{n:"Torrent",     d:"+35% de dégâts quand les PV tombent sous un tiers."},
  12:{n:"Engrais",     d:"+35% de dégâts quand les PV tombent sous un tiers."},
  7: {n:"Essaim",      d:"+35% de dégâts quand les PV tombent sous un tiers."},
  2: {n:"Intimidation",d:"Réduit de 15% l'Attaque adverse à l'entrée en jeu."},
  3: {n:"Lévitation",  d:"Immunisé contre les attaques de type Sol."},
  13:{n:"Statik",      d:"25% de chances de paralyser l'assaillant."},
  15:{n:"Corps Givré", d:"25% de chances de ralentir l'assaillant."},
  4: {n:"Point Poison",d:"25% de chances d'empoisonner l'assaillant."},
  8: {n:"Corps Maudit",d:"Renvoie 10% des dégâts subis."},
  14:{n:"Synchronise", d:"Transmet son altération à l'adversaire."},
  17:{n:"Ténacité",    d:"Ignore les altérations une fois par combat."},
  9: {n:"Armurouille", d:"Réduit de 20% les dégâts physiques subis."},
  6: {n:"Robustesse",  d:"Survit toujours à un coup porté depuis des PV pleins."},
  5: {n:"Sable Volant",d:"15% de chances d'esquiver une attaque."},
  16:{n:"Peau Dure",   d:"Réduit de 12% tous les dégâts subis."},
  18:{n:"Joli Sourire",d:"Réduit de 15% l'Attaque Spéciale adverse à l'entrée."},
  1: {n:"Adaptabilité",d:"Le bonus de type de l'espèce passe de 1,5× à 1,8×."}
};
function talentOf(id){
  const p = POKE[id];
  if(!p) return null;
  const t = TALENTS[p.types[0]] || TALENTS[1];
  return t ? Object.assign({type:p.types[0]}, t) : null;
}

/* ============================================================
   ÉCRAN DE RECHERCHE
   ============================================================ */
let RES_FILTER = "todo";
SCREENS.research = {
  html(){
    const tot = researchTotal();
    const next = RESEARCH_TIERS.find(t=>!(S.researchTiers||[]).includes(t.n));
    const r = regionDef(DEX_FILTER.region);
    const ids = [];
    for(let i = r.from; i <= r.to; i++){
      if(!S.dex[i]) continue;
      const lv = researchLevel(i), mx = researchMax(i);
      if(RES_FILTER === "todo" && lv >= mx) continue;
      if(RES_FILTER === "done" && lv < mx) continue;
      ids.push(i);
    }
    ids.sort((a,b)=>researchLevel(b) - researchLevel(a) || a - b);

    return `
      <div class="h">${ic("dex")} RECHERCHE ${infoBtn("research")}</div>
      <div class="sub">Chaque espèce archivée porte quatre objectifs qui lui sont propres.
        Les remplir fait avancer la recherche générale.</div>

      <div class="panel bracket">
        <div class="row between tiny"><span class="muted">Tâches accomplies</span>
          <b class="cy mono-num">${tot}</b></div>
        ${next ? `<div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, tot/next.n*100)}%"></i></div>
          <div class="tiny dim" style="margin-top:4px">Prochain palier à ${next.n} —
            ${esc(rewardText(next.rw))}</div>`
          : `<div class="tiny ok" style="margin-top:5px">Tous les paliers de recherche sont atteints.</div>`}
      </div>

      <div class="chipbar">
        ${REGIONS.filter(x=>regionUnlocked(x.key)).map(x=>`
          <button class="chip ${DEX_FILTER.region===x.key?"on":""}" data-act="dexregion" data-r="${x.key}">
            ${esc(x.name)}</button>`).join("")}
      </div>
      <div class="chipbar">
        ${[["todo","En cours"],["done","Terminées"],["all","Toutes"]].map(([k,n])=>`
          <button class="chip ${RES_FILTER===k?"on":""}" data-act="resfilter" data-f="${k}">${n}</button>`).join("")}
      </div>

      ${ids.length ? `<div class="list">
        ${ids.slice(0, 60).map(id=>{
          const lv = researchLevel(id), mx = researchMax(id);
          return `<div class="resrow2 ${lv>=mx?"full":""}" data-act="resdetail" data-id="${id}">
            <span class="sprbox" style="width:40px;height:40px">${sprite(id, S.dex[id].shiny, "")}</span>
            <div class="grow">
              <div class="row between"><span class="tiny">${esc(POKE[id].name)}
                ${isPerfect(id)?'<span class="perfmark">◈</span>':""}</span>
                <span class="tiny ${lv>=mx?"gold-t":"dim"}">${lv}/${mx}</span></div>
              <div class="pipline">
                ${RESEARCH_TASKS.filter(t=>taskGoal(t,id)>0).map(t=>`
                  <span class="cpip ${taskDone(t,id)?"on":""}" style="--rc:var(--cyan)"></span>`).join("")}
              </div>
            </div>
            ${ic("arrow")}
          </div>`;}).join("")}
      </div>` : `<div class="empty">Rien à afficher pour ce filtre.</div>`}
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="dex">Retour au Pokédex</button>`;
  }
};
ACTIONS.resfilter = d => { RES_FILTER = d.f; refresh(); };
ACTIONS.resdetail = d => {
  const id = +d.id, r = researchOf(id);
  const tal = talentOf(id);
  sheet(`${sheetHead(POKE[id].name)}
    <div class="row" style="gap:11px;margin-bottom:10px">
      <span class="sprbox" style="width:58px;height:58px">${sprite(id, S.dex[id].shiny, "", {anim:true})}</span>
      <div class="grow">
        <div class="wrap" style="gap:3px">${typeTags(POKE[id].types)}${rarTag(POKE[id].rar)}</div>
        ${isPerfect(id) ? `<div class="tiny" style="color:var(--cyan);margin-top:5px">
          ◈ Exemplaire intègre — +8% sur toutes les statistiques</div>` : ""}
      </div>
    </div>
    ${tal ? `<div class="panel tight">
      <div class="h sm">TALENT</div>
      <div class="tiny"><b class="cy">${esc(tal.n)}</b> — ${esc(tal.d)}</div>
    </div>` : ""}
    <div class="h sm">TÂCHES</div>
    <div class="list">
      ${RESEARCH_TASKS.filter(t=>taskGoal(t,id)>0).map(t=>{
        const g = taskGoal(t, id), cur = Math.min(g, r[t.k] || 0), ok = cur >= g;
        return `<div class="item ${ok?"on":""}">
          <div class="grow">
            <div class="t">${esc(t.n.replace("{n}", g))}</div>
            <div class="d">${esc(t.d)}</div>
            <div class="bar thin" style="margin-top:5px"><i style="width:${cur/g*100}%"></i></div>
          </div>
          <span class="tiny ${ok?"ok":"dim"} mono-num">${cur}/${g}</span>
        </div>`;}).join("")}
    </div>`);
};
