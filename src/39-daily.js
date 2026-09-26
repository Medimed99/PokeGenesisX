/* ============================================================
   39 — LA VIE QUOTIDIENNE DE L'ARCHIVISTE
   Ce qui rend un jeu de collection durable n'est pas un grand
   systeme, c'est une poignee de petites raisons de revenir, et un
   endroit unique qui les liste. Ce module regroupe les deux.
   ============================================================ */

/* ============================================================
   1. AUJOURD'HUI
   Onze modules, c'est beaucoup. Cet ecran repond a une seule
   question : qu'est-ce qui m'attend, maintenant ?
   ============================================================ */
function todayRows(){
  const rows = [];
  const add = (ok, i, n, d, go, hot) => rows.push({ok, i, n, d, go, hot});
  if(moduleUnlocked("pokebox"))
    add(!canOpenBox(), "box", "Cadeau PokéBox",
        canOpenBox() ? "Une entité vous attend dans le tampon." : "Ouvert aujourd'hui.", "pokebox", canOpenBox());
  if(S.quests && S.quests.length){
    const done = S.quests.filter(q=>q.prog >= q.goal).length;
    add(done === S.quests.length, "quest", "Quêtes du jour",
        `${done} / ${S.quests.length} accomplies`, "daily", done < S.quests.length);
  }
  const fid = featuredId();
  add(!!(S.dex[fid] && S.daily && S.daily.featuredCaught), "star", "Vedette du jour",
      `${POKE[fid].name} — bonus de capture aujourd'hui`, "capture", false);
  if(S.contract && !S.contract.claimed)
    add(S.contract.prog >= S.contract.goal, "flag", "Contrat de secteur",
        `${S.contract.n} — ${Math.min(S.contract.prog, S.contract.goal)} / ${S.contract.goal}`,
        "capture", S.contract.prog >= S.contract.goal);
  if(moduleUnlocked("eggs")){
    /* e.slots est un NOMBRE d'emplacements ; les oeufs en cours sont dans e.inc */
    const e = eggState();
    const inc = e.inc || [];
    const ready = inc.filter(x=>x && EGG_TIERS[x.tier] && (x.steps || 0) >= EGG_TIERS[x.tier].steps).length;
    const bag = eggOwned();
    const free = Math.max(0, eggSlots() - inc.length);
    if(ready) add(false, "box", "Couveuse", `${ready} éclosion(s) prête(s)`, "eggs", true);
    else if(bag && free) add(false, "box", "Couveuse", `${bag} en attente, ${free} incubateur(s) libre(s)`, "eggs", true);
  }
  if(moduleUnlocked("idle")){
    const f = forage();
    const vein = f.vein > Date.now();
    add(!vein, "bolt", "Forage", vein ? "Un filon est ouvert : frappez maintenant."
        : `${fmt(Math.floor(f.energy))} Énergie en réserve`, "idle", vein);
    if(typeof botReady === "function" && botReady())
      add(false, "capture", "Capture autonome", "Session terminée : des Pokémon attendent.", "idle", true);
  }
  if(moduleUnlocked("expedition"))
    add(!firstWinAvailable("expedition"), "boss", "Expédition",
        S.expedition ? "Un parcours est en cours." :
        firstWinAvailable("expedition") ? "Première victoire du jour : récompenses ×2." : "Bonus du jour utilisé.",
        "expedition", !!S.expedition || firstWinAvailable("expedition"));
  if(moduleUnlocked("poker"))
    add(!firstWinAvailable("poker"), "cards", "Poké-Poker",
        firstWinAvailable("poker") ? "Première victoire du jour : récompenses ×2." : "Bonus du jour utilisé.",
        "poker", firstWinAvailable("poker"));
  if(typeof karpDealDay === "function" && karpDealDay() && S.karpDeal !== today())
    add(false, "coin", "Le vendeur est là", "Un Magicarpe, à un prix discutable.", "shop", false);
  if(isSafariDay())
    add(false, "seed", "Parc Safari", `Ouvert ce week-end — ${S.balls.safari || 0} Safari Ball(s)`, "capture", true);
  return rows;
}
function todayPending(){ return todayRows().filter(r=>r.hot).length; }
SCREENS.today = {
  html(){
    const rows = todayRows();
    const hot = rows.filter(r=>r.hot), rest = rows.filter(r=>!r.hot);
    const line = r => `<div class="todayrow ${r.hot?"hot":""} ${r.ok?"ok":""}" data-act="goto" data-to="${r.go}">
        <div class="td-ic">${ic(r.ok ? "check" : r.i)}</div>
        <div class="grow"><div class="td-n">${esc(r.n)}</div><div class="td-d">${esc(r.d)}</div></div>
        ${ic("arrow")}
      </div>`;
    return `
      <div class="h">${ic("quest")} AUJOURD'HUI</div>
      <div class="sub">Tout ce qui vous attend, au même endroit.</div>
      ${hot.length ? `<div class="h sm">À FAIRE</div><div class="list">${hot.map(line).join("")}</div>`
                   : `<div class="empty">Rien d'urgent. Le monde tient, pour l'instant.</div>`}
      ${rest.length ? `<div class="h sm" style="margin-top:11px">ÉTAT</div>
        <div class="list">${rest.map(line).join("")}</div>` : ""}
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};

/* ============================================================
   2. RÉPULSIFS ET LEURRES
   Ils s'emboitent dans les habitats : on choisit ou chercher, puis
   ce qu'on veut y trouver.
   ============================================================ */
const REPELS = {
  repel:  {n:"Répulsif",       enc:20, price:350, d:"Les Pokémon communs s'écartent pendant 20 rencontres."},
  srepel: {n:"Super Répulsif", enc:50, price:800, d:"Les Pokémon communs s'écartent pendant 50 rencontres."}
};
const LURE = {n:"Leurre", enc:25, price:1200, d:"Un type au choix sort trois fois plus souvent pendant 25 rencontres."};
function repelRarity(rar){
  if(!(S.repel > 0) || S.capMode === "fish") return rar;
  S.repel--;
  return rar === 0 ? 1 : rar;
}
function lureMul(p){
  if(!S.lure || !(S.lure.n > 0)) return 1;
  return p.types.includes(S.lure.type) ? 3.2 : 1;
}
function lureTick(){
  if(S.lure && S.lure.n > 0 && S.capMode !== "fish"){ S.lure.n--; if(S.lure.n <= 0) S.lure = null; }
}
ACTIONS.buyrepel = d => {
  const r = REPELS[d.k];
  if(!pay("coins", r.price)){ toast("PokéCoins insuffisants", "bad", "cross"); return; }
  S.repel = (S.repel || 0) + r.enc;
  Sfx.coin(); toast(`${r.n} actif — ${S.repel} rencontres`, "", "check");
  save(); refresh();
};
ACTIONS.buylure = () => {
  sheet(`${sheetHead("Leurre — quel type ?")}
    <div class="tiny muted" style="margin-bottom:9px">${esc(LURE.d)} Il se combine avec l'habitat :
      un leurre Eau dans les Nappes est bien plus efficace qu'en plein Foyer thermique.</div>
    <div class="wrap">${Array.from({length:18},(_,i)=>i+1).map(t=>`
      <button class="tt t${t}" style="cursor:pointer;padding:5px 8px" data-act="buylure2" data-t="${t}">
        ${TYPE_NAMES[t]}</button>`).join("")}</div>`, true);
};
ACTIONS.buylure2 = d => {
  if(!pay("coins", LURE.price)){ toast("PokéCoins insuffisants", "bad", "cross"); return; }
  S.lure = {type:+d.t, n:LURE.enc};
  Sfx.coin(); toast(`Leurre ${TYPE_NAMES[+d.t]} actif — ${LURE.enc} rencontres`, "", "check");
  save(); closeSheet(); refresh();
};
function lureStrip(){
  const bits = [];
  if(S.repel > 0) bits.push(`<span class="lurechip">${ic("eye")} Répulsif <b>${S.repel}</b></span>`);
  if(S.lure && S.lure.n > 0) bits.push(`<span class="lurechip"><span class="tt t${S.lure.type}">${TYPE_NAMES[S.lure.type]}</span>
    Leurre <b>${S.lure.n}</b></span>`);
  return bits.length ? `<div class="wrap" style="margin-bottom:8px">${bits.join("")}</div>` : "";
}

/* ============================================================
   3. SÉRIES PAR RARETÉ
   La chaine globale recompense la regularite. Les series par rarete
   recompensent la specialisation : enchainer les Rares sans en
   laisser fuir un seul est un objectif en soi.
   ============================================================ */
const RSTREAK_MILES = [10, 25, 50, 100, 200];
function rstreak(){ S.rstreak = S.rstreak || [0,0,0,0,0,0]; return S.rstreak; }
function rstreakReward(rar, mile){
  const k = RSTREAK_MILES.indexOf(mile) + 1;
  if(rar <= 1) return {coins: 400 * k * (rar + 1), balls:{super: 3 * k}};
  if(rar === 2) return {coins: 1200 * k, shards: 8 * k};
  if(rar === 3) return {shards: 18 * k, balls:{hyper: 3 * k}};
  return {cores: k, shards: 30 * k};
}
function rstreakCatch(rar){
  const s = rstreak();
  s[rar] = (s[rar] || 0) + 1;
  S.rstreakBest = S.rstreakBest || [0,0,0,0,0,0];
  S.rstreakBest[rar] = Math.max(S.rstreakBest[rar], s[rar]);
  if(RSTREAK_MILES.includes(s[rar])){
    const rw = rstreakReward(rar, s[rar]);
    grantReward(rw);
    toast(`Série ${RARITY[rar].n} : ${s[rar]} — ${rewardText(rw)}`, "warn", "star");
    Sfx.win();
  }
}
function rstreakBreak(rar){ const s = rstreak(); if(s[rar] > 0) s[rar] = 0; }
function rstreakRow(){
  const s = rstreak();
  return `<div class="rstreak">
    ${[0,1,2,3,4].map(r=>{
      const next = RSTREAK_MILES.find(m=>m > (s[r]||0)) || RSTREAK_MILES[RSTREAK_MILES.length-1];
      return `<div class="rs" style="--rc:${RARITY[r].c}" title="Série ${RARITY[r].n} — prochain palier ${next}">
        <b class="mono-num">${s[r]||0}</b><span>${esc(RARITY[r].n.split(" ")[0])}</span>
        <i style="width:${Math.min(100, (s[r]||0)/next*100)}%"></i></div>`;}).join("")}
  </div>`;
}

/* ============================================================
   4. ACHATS PERMANENTS
   Le Talisman temporaire donnait un effet qui s'evaporait. Deux
   objets permanents, plafonnes, donnent des objectifs longs et
   lisibles : on sait ou l'on en est, et ou l'on va.
   ============================================================ */
const PERMANENTS = {
  charm: {n:"Charme Chroma", max:5, cur:"shards", cost:l=>[60,120,200,320,480][l],
          d:"Chaque charme multiplie par 1,12 la chance de chromatique. Définitif.", spr:151},
  rune:  {n:"Pièce Rune",    max:10, cur:"coins", cost:l=>2500 * Math.pow(1.6, l),
          d:"Chaque pièce ajoute 5% de PokéCoins à chaque capture. Définitif.", spr:52}
};
function permLv(k){ return (S.perm || {})[k] || 0; }
function charmMul(){ return Math.pow(1.12, permLv("charm")); }
function runeMul(){ return 1 + 0.05 * permLv("rune"); }
ACTIONS.buyperm = d => {
  const p = PERMANENTS[d.k], lv = permLv(d.k);
  if(lv >= p.max) return;
  const c = Math.round(p.cost(lv));
  if(!pay(p.cur, c)){ toast(`${CUR_NAME[p.cur]} insuffisants`, "bad", "cross"); return; }
  S.perm = S.perm || {};
  S.perm[d.k] = lv + 1;
  Sfx.win(); toast(`${p.n} ${lv+1}/${p.max}`, "warn", "star");
  save(); refresh(); checkAchievements();
};
function permanentsPanel(){
  return `<div class="h sm" style="margin-top:12px">PERMANENTS</div>
    <div class="tiny muted" style="margin-bottom:7px">Ils ne s'usent jamais et ne se perdent pas au
      Nouveau Cycle. Chacun est plafonné.</div>
    <div class="list">${Object.entries(PERMANENTS).map(([k,p])=>{
      const lv = permLv(k), maxed = lv >= p.max, c = maxed ? 0 : Math.round(p.cost(lv));
      return `<div class="shopitem ${maxed?"on":""}">
        <span class="sprbox" style="width:36px;height:36px">${sprite(p.spr,false,"")}</span>
        <div class="grow"><div>${esc(p.n)} <span class="tiny dim">${lv}/${p.max}</span></div>
          <div class="tiny muted">${esc(p.d)}</div></div>
        ${maxed ? `<span class="tiny cy">complet</span>`
          : `<button class="btn sm ${canPay(p.cur,c)?"gold":""}" data-act="buyperm" data-k="${k}">
              ${ic(p.cur==="shards"?"shard":"coin")} ${fmt(c)}</button>`}
      </div>`;}).join("")}</div>
    <div class="h sm" style="margin-top:12px">ACCESSOIRES DE CAPTURE</div>
    <div class="list">
      ${Object.entries(REPELS).map(([k,r])=>`<div class="shopitem">
        <div class="bag-ic">${ic("eye")}</div>
        <div class="grow"><div>${esc(r.n)}</div><div class="tiny muted">${esc(r.d)}</div></div>
        <button class="btn sm" data-act="buyrepel" data-k="${k}">${ic("coin")} ${fmt(r.price)}</button>
      </div>`).join("")}
      <div class="shopitem">
        <div class="bag-ic">${ic("seed")}</div>
        <div class="grow"><div>${esc(LURE.n)}</div><div class="tiny muted">${esc(LURE.d)}</div></div>
        <button class="btn sm" data-act="buylure">${ic("coin")} ${fmt(LURE.price)}</button>
      </div>
    </div>`;
}

/* ============================================================
   5. ÉVOLUTIONS PAR AMITIÉ
   Certaines especes n'evoluent pas au niveau mais au lien. Il faut
   qu'elles soient votre compagnon, et que ce lien ait tenu. Evoli
   choisit selon l'heure : Mentali le jour, Noctali la nuit.
   ============================================================ */
const FRIEND_EVO = {"42>169":1, "133>196":"day", "133>197":"night", "172>25":1, "113>242":1,
                    "175>176":1, "298>183":1, "173>35":1, "174>39":1, "349>350":1};
const FRIEND_TIER = 2;
function friendEvo(from, to){ return FRIEND_EVO[from + ">" + to]; }
function friendCheck(from, e){
  const f = friendEvo(from, e.to);
  if(!f) return null;
  if(!S.buddy || S.buddy.id !== from)
    return {ok:false, why:"Évolue par amitié : il doit être votre compagnon.", friend:1};
  if(buddyTier() < FRIEND_TIER)
    return {ok:false, why:`Évolue par amitié : lien de rang ${FRIEND_TIER} requis (actuel ${buddyTier()}).`, friend:1};
  if(f === "day" && isNight())  return {ok:false, why:"Cette évolution n'a lieu que le jour.", friend:1};
  if(f === "night" && !isNight()) return {ok:false, why:"Cette évolution n'a lieu que la nuit.", friend:1};
  return null;
}

/* ============================================================
   6. DÉFIS SURPRISES
   La boucle la plus repetee du jeu avait besoin d'imprevu. Un
   archiviste rival surgit parfois apres une capture.
   ============================================================ */
const RIVALS = [
  {k:"r_iris",  n:"Iris, archiviste des nappes",   t:[11,15], title:"Plongeur d'index"},
  {k:"r_moss",  n:"Moss, jardinier d'arborescence", t:[12,7],  title:"Élagueur"},
  {k:"r_volt",  n:"Volt, compilateur",             t:[13,9],  title:"Survolté"},
  {k:"r_cendre",n:"Cendre, fondeur",               t:[10,6],  title:"Porteur de braise"},
  {k:"r_nox",   n:"Nox, veilleur de nuit",         t:[17,8],  title:"Veilleur"},
  {k:"r_ayla",  n:"Ayla, copiste draconique",      t:[16,14], title:"Draconologue"}
];
for(const r of RIVALS) COSMETICS["title_" + r.k] = {t:"title", n:r.title};
let RIVAL = null;
function rivalTick(){
  if(S.capMode === "fish" || S.level < 10 || S.team.length < 3) return false;
  if(rng() > 0.012) return false;
  RIVAL = pick(RIVALS);
  setTimeout(()=>{
    /* jamais par-dessus une autre fenetre : le defi attendra une autre capture */
    const disc = document.getElementById("discover");
    if(sheetOpen() || (disc && /\bon\b/.test(disc.className || ""))){ RIVAL = null; return; }
    sheet(`<div class="center">
      <div class="h" style="justify-content:center;color:var(--magenta)">DÉFI</div>
      <div class="tiny" style="margin:8px 0 4px"><b>${esc(RIVAL.n)}</b></div>
      <div class="tiny muted" style="margin-bottom:10px">« Tu travailles sur mon secteur. Montre-moi ce que
        vaut ton équipe. »</div>
      <div class="wrap" style="justify-content:center;margin-bottom:10px">
        ${RIVAL.t.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}</div>
      <div class="tiny dim" style="margin-bottom:10px">Refuser ne coûte rien. Gagner rapporte un titre,
        la première fois.</div>
      <div class="btn-grid c2">
        <button class="btn ghost" data-act="rivalno">Refuser</button>
        <button class="btn pri" data-act="rivalgo">Accepter</button>
      </div>
    </div>`, true);
    Sfx.glitch(); buzz([20,30,20]);
  }, 700);
  return true;
}
ACTIONS.rivalno = () => { RIVAL = null; closeSheet(); };
ACTIONS.rivalgo = () => {
  const rv = RIVAL; if(!rv) return;
  closeSheet();
  const allies = teamFighters(S.team);
  const avg = Math.round(allies.reduce((a,f)=>a + f.level, 0) / Math.max(1, allies.length));
  const foes = [];
  for(let i = 0; i < 3; i++){
    const pool = [];
    for(const r of unlockedRegions()) for(let j = r.from; j <= r.to; j++){
      const p = POKE[j];
      if(p && !p.leg && !isExclusive(j) && p.types.some(t=>rv.t.includes(t)) && p.bst >= 300) pool.push(j);
    }
    foes.push(makeFighter(pool.length ? pick(pool) : randInt(1,151), clamp(avg + 2, 5, 100), {boost:1.05}));
  }
  createBattle(allies, foes, {
    ai: true, speed: S.settings.battleSpeed || 1, title: rv.n.split(",")[0].toUpperCase(),
    onEnd: win => {
      S.stats.rivals = (S.stats.rivals || 0) + (win ? 1 : 0);
      if(win){
        const first = !(S.cos.owned || []).includes("title_" + rv.k);
        gain("coins", 1500 + avg * 40); gain("shards", 20);
        if(first) unlockCosmetic("title_" + rv.k);
        sheet(`<div class="center"><div class="h" style="justify-content:center">DÉFI REMPORTÉ</div>
          <div class="tiny muted" style="margin:8px 0">« Pas mal. Je reviendrai. »</div>
          ${first?`<div class="tiny cy">Titre débloqué : ${esc(rv.title)}</div>`:""}
          <button class="btn pri wide" style="margin-top:11px" data-act="closeandgo" data-to="capture">Reprendre</button>
        </div>`, true);
      } else {
        sheet(`<div class="center"><div class="h" style="justify-content:center">DÉFI PERDU</div>
          <div class="tiny muted" style="margin:8px 0">Rien n'est perdu. Il repassera.</div>
          <button class="btn pri wide" style="margin-top:11px" data-act="closeandgo" data-to="capture">Reprendre</button>
        </div>`, true);
      }
      save(); checkAchievements();
    }
  });
  go("battle");
};

/* ============================================================
   7. CODES
   Pour animer une communaute : un code distribue sur Discord se
   saisit ici. Les codes sont stockes sous forme d'empreinte, pas
   en clair — on ne les lit pas en ouvrant la source.
   ============================================================ */
function codeHash(s){
  let h = 0x811c9dc5;
  const t = String(s).trim().toUpperCase();
  for(let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(16);
}
/* empreinte -> recompense. Pour en ajouter : node -e "console.log(codeHash('MONCODE'))" */
const CODES = {
  [codeHash("GENESIS")]:   {cores:5, balls:{super:20}},
  [codeHash("PORYGON")]:   {coins:3000},
  [codeHash("MISSINGNO")]: {shards:60},
  [codeHash("PALETTE")]:   {balls:{hyper:10}}
};
ACTIONS.codeopen = () => {
  sheet(`${sheetHead("Saisir un code")}
    <div class="tiny muted" style="margin-bottom:9px">Des codes sont distribués ponctuellement sur la
      communauté. Chacun ne s'utilise qu'une fois par partie.</div>
    <input id="code-in" class="field" maxlength="24" placeholder="CODE" autocomplete="off"
      style="text-transform:uppercase">
    <button class="btn pri wide" style="margin-top:9px" data-act="codeuse">Valider</button>`, true);
};
ACTIONS.codeuse = () => {
  const el = document.getElementById("code-in");
  const h = codeHash(el ? el.value : "");
  const rw = CODES[h];
  S.codes = S.codes || [];
  if(!rw){ toast("Code inconnu", "bad", "cross"); return; }
  if(S.codes.includes(h)){ toast("Code déjà utilisé", "bad", "cross"); return; }
  S.codes.push(h);
  grantReward(rw);
  Sfx.win(); save(); closeSheet();
  revealSheet("CODE ACCEPTÉ", rewardItems(rw), {icon:"star"});
};

/* ============================================================
   8. PARC SAFARI
   Le week-end seulement. Trente Safari Balls, un vivier restreint,
   et deux especes qu'on ne trouve que la : Kangourex et Tauros,
   exactement comme dans Rouge et Bleu.
   ============================================================ */
const SAFARI_POOL = [115, 128, 113, 123, 127, 147, 111, 102, 32, 29, 49, 46];
EXCLUSIVES.safari = [115, 128];
EXCL_SOURCE[115] = "safari"; EXCL_SOURCE[128] = "safari";
function isSafariDay(){ const d = new Date().getDay(); return d === 0 || d === 6; }
function safariWeek(){
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 1) % 7));   /* samedi de reference */
  return d.toISOString().slice(0, 10);
}
function safariRollover(){
  if(isSafariDay()){
    if(S.safariWeek !== safariWeek()){ S.safariWeek = safariWeek(); S.balls.safari = 30; saveSoon(); }
  } else if(S.balls.safari){ S.balls.safari = 0; if(S.habitat === "safari") S.habitat = "route"; }
}
function safariSpecies(){
  const out = [];
  for(const id of SAFARI_POOL){
    const w = EXCL_SOURCE[id] === "safari" ? 4 : 1;
    for(let k = 0; k < w; k++) out.push(id);
  }
  return pick(out);
}

/* ============================================================
   9. FACTIONS
   Trois reponses a la question que pose la faille : « pourquoi tu
   repares ? ». Choisir une faction, c'est choisir une reponse. Le
   choix debloque un rang et une specialite ; il ne ferme aucun
   contenu, il colore la facon de jouer.
   ============================================================ */
const FACTIONS = {
  restaurer: {n:"Les Restaurateurs", c:"#35f0d6", i:"check",
    motto:"Aller jusqu'à cent. Quoi qu'il en coûte.",
    d:"Ceux qui suivent Porygon-Z : le monde doit être réparé, entièrement.",
    perk:"Intégrité gagnée", per:0.05, key:"integ"},
  seuil:     {n:"Les Gardiens du Seuil", c:"#ffc857", i:"lock",
    motto:"Quatre-vingt-seize pour cent, et pas une ligne de plus.",
    d:"Ceux qui ont lu le onzième fragment et préfèrent un monde presque entier à un archiviste effacé.",
    perk:"PokéCoins gagnés", per:0.04, key:"coins"},
  echo:      {n:"Les Échos", c:"#b06bff", i:"eye",
    motto:"Ce qui n'est pas indexé ne peut pas être supprimé.",
    d:"Ceux qui écoutent la faille, et qui trouvent qu'elle n'a pas tort.",
    perk:"Fragments gagnés", per:0.06, key:"shards"}
};
const FACTION_RANKS = [0, 150, 600, 1800, 4500, 10000];
const FACTION_RANK_NAMES = ["Recrue", "Initié", "Agent", "Émissaire", "Porte-voix", "Figure"];
function factionOpen(){ return riftStage() >= 3 || S.level >= 25; }
function factionRank(){
  const p = (S.faction && S.faction.pts) || 0;
  let r = 0;
  for(let i = 0; i < FACTION_RANKS.length; i++) if(p >= FACTION_RANKS[i]) r = i;
  return r;
}
/* multiplicateur de la specialite de la faction, 1 pour tout le reste */
function factionMul(key){
  if(!S.faction || !S.faction.k) return 1;
  const f = FACTIONS[S.faction.k];
  return f.key === key ? 1 + f.per * factionRank() : 1;
}
function factionPts(n){
  if(!S.faction || !S.faction.k) return;
  const before = factionRank();
  S.faction.pts = (S.faction.pts || 0) + n;
  if(factionRank() > before){
    Sfx.win();
    toast(`${FACTIONS[S.faction.k].n} — rang ${FACTION_RANK_NAMES[factionRank()]}`, "warn", "star");
  }
  saveSoon();
}
SCREENS.faction = {
  html(){
    if(!factionOpen()) return `
      <div class="h">${ic("eye")} FACTIONS</div>
      <div class="empty">La faille n'a pas encore posé sa question. Revenez quand elle l'aura fait —
        ou au niveau 25.</div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="journal">Retour</button>`;
    const cur = S.faction && S.faction.k;
    const r = factionRank(), pts = (S.faction && S.faction.pts) || 0;
    const next = FACTION_RANKS[r + 1];
    return `
      <div class="h">${ic("eye")} FACTIONS</div>
      <div class="sub">« Pourquoi tu répares ? » Trois réponses. Une seule à la fois.</div>
      ${cur ? `<div class="panel bracket" style="border-left:2px solid ${FACTIONS[cur].c}">
        <div class="row between"><b style="color:${FACTIONS[cur].c}">${esc(FACTIONS[cur].n)}</b>
          <span class="tiny">${esc(FACTION_RANK_NAMES[r])}</span></div>
        <div class="tiny muted" style="margin-top:4px">${esc(FACTIONS[cur].perk)} +${Math.round(FACTIONS[cur].per*r*100)}%</div>
        ${next ? `<div class="bar thin" style="margin-top:6px"><i style="width:${Math.min(100,
          (pts - FACTION_RANKS[r]) / (next - FACTION_RANKS[r]) * 100)}%"></i></div>
          <div class="tiny dim" style="margin-top:3px">${fmt(pts)} / ${fmt(next)} points</div>`
          : `<div class="tiny ok" style="margin-top:5px">Rang maximal.</div>`}
        <div class="tiny dim" style="margin-top:6px">Points : 1 par capture, 5 par tâche de recherche,
          20 par expédition bouclée, 50 par verrou levé.</div>
      </div>` : ""}
      <div class="list">${Object.entries(FACTIONS).map(([k,f])=>`
        <div class="factioncard ${cur===k?"on":""}" style="--fc:${f.c}">
          <div class="row" style="gap:9px">
            <div class="td-ic" style="border-color:${f.c}">${ic(f.i)}</div>
            <div class="grow"><div class="fc-n">${esc(f.n)}</div>
              <div class="fc-m">« ${esc(f.motto)} »</div></div>
          </div>
          <div class="tiny muted" style="margin:7px 0">${esc(f.d)}</div>
          <div class="tiny">Spécialité : <b style="color:${f.c}">${esc(f.perk)}</b>, +${Math.round(f.per*100)}% par rang.</div>
          ${cur === k ? `<div class="tiny cy" style="margin-top:6px">Votre faction.</div>`
            : `<button class="btn sm wide" style="margin-top:7px" data-act="factionjoin" data-k="${k}">
                ${cur ? "Changer pour celle-ci" : "Rejoindre"}</button>`}
        </div>`).join("")}</div>
      <div class="tiny dim" style="margin-top:8px">Changer de faction remet vos points à zéro.</div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="journal">Retour</button>`;
  }
};
ACTIONS.factionjoin = d => {
  const had = S.faction && S.faction.k;
  const go2 = () => {
    S.faction = {k:d.k, pts:0, since:Date.now()};
    Sfx.win(); save(); closeSheet(); refresh();
    pzFlash({restaurer:"Merci. Je n'aurais pas su le faire seul.",
             seuil:"Je comprends. Je ne suis pas d'accord, mais je comprends.",
             echo:"Tu l'écoutes. Fais attention à ce qu'elle te répond."}[d.k]);
  };
  if(!had){ go2(); return; }
  sheet(`${sheetHead("Changer de faction ?")}
    <div class="tiny muted">Vos points et votre rang repartent de zéro.</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn ghost" data-act="closesheet">Annuler</button>
      <button class="btn dan" data-act="factionjoin2" data-k="${d.k}">Changer</button>
    </div>`, true);
  ACTIONS.factionjoin2 = () => go2();
};
