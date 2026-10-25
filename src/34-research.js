/* ============================================================
   34 — RECHERCHE, INTÉGRITÉ, TALENTS

   · LA RECHERCHE donne à chaque Pokémon une fiche de quatre
     tâches. Elle vivait dans un onglet à part, et les joueurs ne
     comprenaient ni à quoi elle servait ni comment s'en servir :
     elle avançait sans qu'on le voie, son écran ne proposait rien
     à faire, et 87 % de ses tâches recomptaient les doublons, que
     les étoiles comptent déjà. Elle vit maintenant dans le
     Pokédex, sur la fiche de chaque Pokémon ; sa tâche de doublons,
     ce sont les étoiles (★★) ; et elle se montre au moment où elle
     avance (capture, combat, évolution).
   · les POKÉMON INTÈGRES sont un second axe de collection,
     indépendant du chromatique ;
   · les TALENTS donnent à chaque espèce un trait de combat tiré
     de son type dominant.
   ============================================================ */

/* ---------- les tâches ----------
   Les étoiles comptent les exemplaires obtenus (42) : ★★ à quatre.
   Un Altéré ou un Légendaire se croise trop rarement pour en
   demander quatre : la première étoile suffit. */
function resCatchStars(id){ return POKE[id] && POKE[id].rar >= 4 ? 1 : 2; }
function resStarAt(n){ return (typeof STAR_STEPS !== "undefined" ? STAR_STEPS : [1, 4, 10, 25, 60])[n - 1]; }
const RESEARCH_TASKS = [
  {k:"catch",  n:id=>"Atteindre " + "★".repeat(resCatchStars(id)), s:id=>"★".repeat(resCatchStars(id)),
   goal:id=>resStarAt(resCatchStars(id)), d:"Les étoiles comptent les exemplaires obtenus."},
  {k:"battle", n:id=>`En vaincre ${POKE[id].rar >= 4 ? 1 : 3} au combat`, s:()=>"vaincu au combat",
   goal:id=>POKE[id].rar >= 4 ? 1 : 3, d:"En Expédition, à la Tour ou dans la Brèche."},
  {k:"evolve", n:()=>"La faire évoluer", s:()=>"évolution",
   goal:id=>(POKE[id].evo && POKE[id].evo.length) ? 1 : 0, d:"Depuis sa fiche, rubrique Évolution."},
  {k:"shiny",  n:()=>"En obtenir une chromatique", s:()=>"chromatique",
   goal:()=>1, d:"Au hasard des rencontres ; la chaîne augmente la chance."}
];
function researchOf(id){
  S.research = S.research || {};
  S.research[id] = S.research[id] || {catch:0, battle:0, evolve:0, shiny:0, ok:{}};
  return S.research[id];
}
function taskGoal(t, id){ return typeof t.goal === "function" ? t.goal(id) : t.goal; }
function taskName(t, id){ return typeof t.n === "function" ? t.n(id) : t.n; }
/* où en est une tâche : les étoiles et la chromatique se lisent sur l'entrée du Pokédex. La tâche
   de doublons, ce sont exactement les étoiles : un seul compteur, celui que le joueur voit. */
function taskProg(t, id){
  const r = (S.research && S.research[id]) || {}, e = S.dex && S.dex[id];
  if(t.k === "catch") return e ? (typeof dexTotalCaught === "function" ? dexTotalCaught(id) : Math.max(e.tc || 0, e.c || 0)) : 0;
  if(t.k === "shiny") return Math.max(r.shiny || 0, e && e.shiny ? 1 : 0);
  return r[t.k] || 0;
}
function taskDone(t, id){
  const g = taskGoal(t, id);
  return g > 0 && taskProg(t, id) >= g;
}
/* niveau de recherche d'une espèce : le nombre de tâches remplies */
function researchLevel(id){ return RESEARCH_TASKS.filter(t=>taskDone(t, id)).length; }
function researchMax(id){ return RESEARCH_TASKS.filter(t=>taskGoal(t, id) > 0).length; }
/* les espèces qui ont une fiche : celles de l'archive, et celles qu'on a déjà affrontées */
function researchIds(){
  const ids = new Set();
  for(const k in (S.dex || {})) ids.add(+k);
  for(const k in (S.research || {})) ids.add(+k);
  return [...ids].filter(id=>POKE[id] && id >= 1 && id <= 386);
}
function researchTotal(){
  researchMigrate();
  let n = 0;
  for(const id of researchIds()) n += researchLevel(id);
  return n;
}

/* ---------- les parties d'avant ----------
   Les captures recomptées par la recherche rejoignent les étoiles, et ce qui était
   déjà rempli est noté sans être payé une seconde fois. Chaque porte d'entrée
   (capture, combat, Pokédex, guide) passe par ici avant de compter quoi que ce soit. */
function researchMigrate(){
  if(typeof S === "undefined" || !S || S.resV >= 2) return;
  S.resV = 2;
  S.research = S.research || {};
  for(const k in S.research){
    const r = S.research[k], e = S.dex && S.dex[k];
    if(e && r && r.catch > 0) e.tc = Math.max(e.tc || 0, e.c || 0, r.catch);
  }
  for(const id of researchIds()){
    const r = researchOf(id);
    r.ok = r.ok || {};
    for(const t of RESEARCH_TASKS) if(taskDone(t, id)) r.ok[t.k] = 1;
  }
  S.stats.research = Math.max(S.stats.research || 0, researchTotal());
}

/* ---------- quand une tâche se remplit ----------
   Une capture le dit sur son propre écran ; ailleurs (combat, évolution), un message. */
let RES_FRESH = [];      /* les tâches qui viennent d'être remplies */
let STAR_FRESH = null;   /* la dernière étoile gagnée (posée par 42) */
function researchSync(id){
  if(typeof S === "undefined" || !S || !id || !POKE[id] || id > 386) return 0;
  researchMigrate();
  const r = researchOf(id);
  r.ok = r.ok || {};
  const done = RESEARCH_TASKS.filter(t=>!r.ok[t.k] && taskDone(t, id));
  if(!done.length) return 0;
  for(const t of done) r.ok[t.k] = 1;
  const n = done.length, s0 = S.shards || 0;
  S.stats.research = (S.stats.research || 0) + n;
  if(typeof factionPts === "function") factionPts(5 * n);
  gain("shards", n * (2 + POKE[id].rar));
  const ev = {id, ks:done.map(t=>t.k), sh:(S.shards || 0) - s0, t:Date.now(), shown:false, st:S};
  RES_FRESH.push(ev);
  if(RES_FRESH.length > 8) RES_FRESH.shift();
  setTimeout(()=>{ if(!ev.shown){ ev.shown = true; toast(researchToastText(ev), "", "dex"); } }, 80);
  saveSoon();
  return n;
}
function researchToastText(ev){
  const labels = ev.ks.map(k=>{ const t = RESEARCH_TASKS.find(x=>x.k === k); return t ? t.s(ev.id) : k; });
  return `Recherche de ${POKE[ev.id].name} : ${labels.join(", ")} ✓ · +${ev.sh} Fragments`;
}
/* progression d'une tâche, appelée par le reste du jeu */
function researchTick(id, kind, n){
  if(typeof S === "undefined" || !S || !id || !POKE[id]) return;
  researchMigrate();
  const r = researchOf(id);
  r[kind] = (r[kind] || 0) + (n || 1);
  researchSync(id);
  saveSoon();
}

/* ---------- les paliers : ce que la recherche rapporte ---------- */
const RESEARCH_TIERS = [
  {n:25,   rw:{coins:3000, shards:30}},
  {n:60,   rw:{cores:2, balls:{hyper:10}}},
  {n:120,  rw:{cores:4, cos:"fx_stream"}},
  {n:220,  rw:{cores:7, balls:{master:1}}},
  {n:360,  rw:{cores:12, cos:"title_index"}},
  {n:550,  rw:{cores:20}},
  {n:800,  rw:{cores:30, cos:"fx_prism"}}
];
function researchNextTier(){ return RESEARCH_TIERS.find(t=>!(S.researchTiers || []).includes(t.n)) || null; }
function checkResearchTiers(){
  S.researchTiers = S.researchTiers || [];
  const tot = researchTotal();
  for(const t of RESEARCH_TIERS){
    if(tot < t.n || S.researchTiers.includes(t.n)) continue;
    S.researchTiers.push(t.n);
    grantReward(t.rw);
    addIntegrity(0.8);
    Sfx.win();
    save();
    const nx = researchNextTier();
    revealSheet(`RECHERCHE · ${t.n} TÂCHES`, rewardItems(t.rw),
      {icon:"dex", sub:`${t.n} tâches remplies dans le Pokédex.${nx ? ` Prochain palier : ${nx.n}.` : ""}`});
    return true;
  }
  return false;
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
   LA RECHERCHE DANS LE POKÉDEX
   ============================================================ */
/* où le trouver : l'habitat dont les types lui ressemblent le plus, et l'heure */
function resWhere(id){
  const p = POKE[id];
  if(!p) return "";
  if(typeof exclusiveLabel === "function" && exclusiveLabel(id)) return exclusiveLabel(id);
  if(typeof isGuardianSpecies === "function" && isGuardianSpecies(id) && !isReleasedGuardian(id))
    return "Il garde un verrou de la Tour : on le capture une fois le verrou levé.";
  const reg = REGIONS.find(r=>id >= r.from && id <= r.to);
  let best = null, bw = 0;
  if(typeof HABITATS !== "undefined") for(const k in HABITATS){
    const m = p.types.filter(t=>HABITATS[k].types.includes(t)).length;
    if(m > bw){ bw = m; best = HABITATS[k]; }
  }
  const night = typeof NIGHT_TYPES !== "undefined" && p.types.some(t=>NIGHT_TYPES.includes(t));
  const day = typeof DAY_TYPES !== "undefined" && p.types.some(t=>DAY_TYPES.includes(t));
  const when = night && !day ? ", surtout la nuit" : day && !night ? ", surtout le jour" : "";
  return (reg ? reg.name + " · " : "") + (best ? best.n : "un peu partout") + when;
}
/* une ligne sous chaque tâche qui reste : quoi faire, et où */
function researchHint(t, id){
  if(t.k === "catch") return esc(resWhere(id));
  if(t.k === "battle") return esc(t.d);
  if(t.k === "evolve"){
    if(!S.dex[id]) return esc(t.d);
    if(typeof evoReady === "function" && evoReady(id)) return `<b class="ok">Elle peut évoluer maintenant</b> : rubrique Évolution, juste en dessous.`;
    const ev = (POKE[id].evo || [])[0], chk = ev && typeof canEvolve === "function" ? canEvolve(id, ev) : null;
    return esc(chk && !chk.ok ? chk.why : t.d);
  }
  if(t.k === "shiny") return esc(`Au hasard des rencontres : en ce moment, ${typeof shinyOddsText === "function" ? shinyOddsText() : "1 sur 1 000"}. La chaîne augmente la chance.`);
  return "";
}
/* la fiche de recherche d'un Pokémon, dans sa fiche du Pokédex */
function researchFicheHtml(id){
  researchMigrate();
  const ts = RESEARCH_TASKS.filter(t=>taskGoal(t, id) > 0);
  if(!ts.length) return "";
  if(!S.dex[id] && !ts.some(t=>taskProg(t, id) > 0)) return "";
  const lv = researchLevel(id), mx = ts.length, full = lv >= mx;
  const nx = researchNextTier();
  return `<div class="resfiche ${full ? "full" : ""}">
    <div class="rf-h"><b>Recherche</b><span class="rf-c">${lv}/${mx}</span><span class="grow"></span>${infoBtn("research")}</div>
    ${ts.map(t=>{
      const g = taskGoal(t, id), cur = Math.min(g, taskProg(t, id)), ok = cur >= g;
      const hint = ok ? "" : researchHint(t, id);
      return `<div class="rf-t ${ok ? "ok" : ""}">
        <i class="rf-k">${ok ? "✓" : ""}</i>
        <div class="grow"><div class="rf-n">${esc(taskName(t, id))}</div>${hint ? `<div class="rf-d">${hint}</div>` : ""}</div>
        ${g > 1 && !ok ? `<span class="rf-p">${cur}/${g}</span>` : ""}
      </div>`;}).join("")}
    <div class="rf-f">${full ? "Fiche complète." : `Chaque tâche : <b>+${2 + POKE[id].rar} Fragments</b>${nx ? `, et un pas vers le palier ${nx.n} du Pokédex (${esc(rewardText(nx.rw))})` : ""}.`}</div>
  </div>`;
}
/* quatre traits sous chaque case du Pokédex */
function researchCellHtml(id){
  const ts = RESEARCH_TASKS.filter(t=>taskGoal(t, id) > 0);
  if(!ts.length) return "";
  const done = ts.map(t=>taskDone(t, id));
  return `<span class="dx-rs ${done.every(Boolean) ? "full" : ""}">${done.map(d=>`<i class="${d ? "on" : ""}"></i>`).join("")}</span>`;
}
/* l'en-tête du Pokédex : le compte, et ce que rapporte le prochain palier */
function researchPanelHtml(){
  const tot = researchTotal(), nx = researchNextTier();
  const done = (S.researchTiers || []).filter(n=>RESEARCH_TIERS.some(t=>t.n === n));
  const from = done.length ? Math.max(...done.filter(n=>!nx || n < nx.n), 0) : 0;
  const on = typeof DEX_FILTER !== "undefined" && DEX_FILTER.mode === "research";
  return `<div class="respanel ${on ? "on" : ""}">
    <button class="rp-main" data-act="dexmode" data-m="${on ? "all" : "research"}">
      <span class="rp-h"><b>Recherche</b><em class="mono-num">${tot} tâche${tot > 1 ? "s" : ""}</em></span>
      ${nx ? `<span class="bar thin"><i style="width:${Math.max(2, Math.min(100, (tot - from) / Math.max(1, nx.n - from) * 100)).toFixed(1)}%"></i></span>
        <span class="rp-n">Palier ${nx.n}${tot >= nx.n ? " atteint" : ""} : ${esc(rewardText(nx.rw))}</span>`
        : `<span class="rp-n">Tous les paliers sont atteints.</span>`}
    </button>${infoBtn("research")}
  </div>`;
}
/* avec le filtre Recherche : ce qui est à une capture, un combat ou une évolution d'être rempli */
function researchNear(region){
  const r = regionDef(region), out = [];
  if(!r) return out;
  for(let i = r.from; i <= r.to && out.length < 4; i++){
    if(!S.dex[i]) continue;
    for(const t of RESEARCH_TASKS){
      const g = taskGoal(t, i);
      if(g <= 0 || taskDone(t, i)) continue;
      const left = g - taskProg(t, i);
      if(t.k === "evolve" ? (typeof evoReady === "function" && evoReady(i)) : (t.k === "catch" || t.k === "battle") && left === 1){
        out.push({id:i, k:t.k, left}); break;
      }
    }
  }
  return out;
}
function researchNearHtml(region){
  const near = researchNear(region);
  const say = {catch:"plus qu'un exemplaire", battle:"plus qu'un combat", evolve:"peut évoluer"};
  return near.length ? `<div class="resnear"><div class="rn-h">Presque rempli</div><div class="rn-row">
    ${near.map(x=>`<button class="rn-c" data-act="dexopen" data-id="${x.id}">${sprite(x.id, S.dex[x.id].shiny, "")}
      <span><b>${esc(POKE[x.id].name)}</b><small>${say[x.k]}</small></span></button>`).join("")}</div></div>` : "";
}
/* sous une capture : les étoiles de l'espèce et sa fiche, et ce qui vient de se remplir */
function researchCatchHtml(id){
  if(!POKE[id] || !S.dex[id] || id > 386) return "";
  const fresh = RES_FRESH.filter(x=>x.id === id && x.st === S && !x.shown && Date.now() - x.t < 5000);
  for(const x of fresh) x.shown = true;
  const n = typeof dexTotalCaught === "function" ? dexTotalCaught(id) : S.dex[id].c;
  const s = typeof starsOf === "function" ? starsOf(id) : 0, nx = typeof nextStarAt === "function" ? nextStarAt(id) : null;
  const up = STAR_FRESH && STAR_FRESH.id === id && STAR_FRESH.st === S && Date.now() - STAR_FRESH.t < 5000;
  const lv = researchLevel(id), mx = researchMax(id);
  const ks = fresh.flatMap(x=>x.ks), sh = fresh.reduce((a, x)=>a + x.sh, 0);
  const labels = ks.map(k=>{ const t = RESEARCH_TASKS.find(x=>x.k === k); return t ? t.s(id) : k; });
  return `<div class="resline ${up ? "up" : ""}">
      <span class="rl-s">${typeof starsHtml === "function" ? starsHtml(id) : ""}</span>
      <span class="rl-n">${up ? `${"★".repeat(s)} atteint` : nx ? `${n}/${nx} vers ${"★".repeat(s + 1)}` : `${n} obtenus`}</span>
      <span class="rl-r">Recherche <b>${lv}/${mx}</b></span>
    </div>
    ${ks.length ? `<div class="resdone">✓ Tâche de recherche : ${esc(labels.join(", "))} · +${sh} Fragments</div>` : ""}`;
}
/* une capture le dit sur son propre écran : les messages en double sont retenus */
if(typeof showCatchResult === "function"){
  const _scr = showCatchResult;
  showCatchResult = function(c, rw){
    const r = _scr.apply(this, arguments);
    try {
      const host = document.querySelector("#sheet-root .sheet .tiles");
      const html = c && researchCatchHtml(c.id);
      if(host && html) host.insertAdjacentHTML("afterend", html);
    } catch(e){}
    return r;
  };
}
