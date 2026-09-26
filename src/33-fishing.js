/* ============================================================
   33 — PÊCHE ET EXCLUSIVITÉS
   La sonde etait un module a part, avec son propre mini-jeu et
   ses couts en Fragments : personne n'y revenait. La peche devient
   un MODE de l'ecran de capture — on bascule d'un geste — et elle
   gagne ce qui manquait : des especes qu'on ne trouve nulle part
   ailleurs.

   Le principe est etendu a tout le jeu. Chaque activite a ses
   exclusivites, comme dans les vrais jeux : les bebes sortent des
   oeufs, les fossiles se deterrent, Barpau se peche.
   ============================================================ */

const EXCLUSIVES = {
  /* especes qu'on ne capture qu'a la canne */
  fish:   [349, 223, 211, 369, 170, 382],
  /* les bebes des generations II et III : uniquement a l'eclosion */
  egg:    [172, 173, 174, 175, 236, 238, 239, 240, 298, 360],
  /* les fossiles, et leurs evolutions, qui n'existent pas a l'etat sauvage */
  forage: [138, 139, 140, 141, 142, 345, 346, 347, 348]
};
const EXCL_SOURCE = {};
for(const k in EXCLUSIVES) for(const id of EXCLUSIVES[k]) EXCL_SOURCE[id] = k;
/* Milobellus n'existe qu'en faisant evoluer Barpau */
EXCL_SOURCE[350] = "fish";
function isExclusive(id){ return !!EXCL_SOURCE[id]; }
function exclusiveLabel(id){
  return {fish:"Pêche uniquement", egg:"Éclosion uniquement", forage:"Forage uniquement"}[EXCL_SOURCE[id]] || "";
}

/* ============================================================
   LES CANNES
   La premiere ne s'achete pas : elle se trouve, comme l'oeuf ouvre
   la couveuse. Les suivantes ameliorent a la fois la touche et la
   chance de chromatique.
   ============================================================ */
const RODS = [
  {k:"old",   n:"Vieille Canne", hook:0.55, window:1050, shiny:1.0, rare:0,   cost:0,
   d:"Retrouvée dans une capture. Elle tient, c'est tout ce qu'on lui demande."},
  {k:"super", n:"Super Canne",   hook:0.72, window:900,  shiny:1.6, rare:0.6, cost:140,
   d:"Plus sensible : elle ferre mieux et remonte davantage de raretés."},
  {k:"mega",  n:"Méga Canne",    hook:0.88, window:780,  shiny:2.5, rare:1.3, cost:480,
   d:"Elle atteint les nappes où dort ce qui ne remonte jamais à la surface."}
];
function rodLevel(){ return S.rod || 0; }        /* 0 = aucune canne */
function rodDef(){ return rodLevel() ? RODS[rodLevel() - 1] : null; }

/* la canne se trouve en capturant, avec un filet de securite */
function rodDiscoveryTick(){
  if(S.rod || S.level < 3) return;
  const pity = S.stats.catches >= 150;
  if(!pity && rng() > 1/90) return;
  S.rod = 1;
  S.flags.rodReveal = true;
  saveSoon();
}
function showRodDiscovery(){
  const box = document.getElementById("discover");
  if(!box){ toast("Vieille Canne trouvée — mode Pêche débloqué", "warn", "fish"); return false; }
  box.className = "on";
  box.style.setProperty("--ac", "#4fb2ff");
  box.innerHTML = `
    <div class="dc-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker done">OBJET TROUVÉ</div>
      <div class="rodfind">${ic("fish")}</div>
      <div class="dc-name in" style="font-size:12px">Vieille Canne</div>
      <div class="dc-lore in">Elle était restée accrochée au Pokémon que vous venez de capturer.
        Quelqu'un pêchait ici, avant que les données se figent.</div>
      <div class="panel tight" style="text-align:left;margin:0 0 10px">
        <div class="h sm">MODE PÊCHE DÉBLOQUÉ</div>
        <div class="tiny muted">En haut de l'écran de capture, basculez entre Capture et Pêche.
          Certains Pokémon ne se trouvent qu'au bout d'une ligne.</div>
      </div>
      <button class="btn pri wide dc-ok in" data-act="rodok">Essayer tout de suite</button>
    </div>`;
  Sfx.win(); buzz([20,40,70]);
  return true;
}
ACTIONS.rodok = () => {
  const box = document.getElementById("discover");
  if(box){ box.className = ""; box.innerHTML = ""; }
  S.capMode = "fish"; ENC = null; save(); go("capture");
};

/* ============================================================
   LE MODE PÊCHE
   Lancer, attendre la touche, ferrer a temps. Si ca tient, la
   rencontre se deroule ensuite exactement comme une capture.
   ============================================================ */
let FISHING = {state:"idle", timer:null, biteAt:0};

function setCapMode(m){
  if(m === "fish" && !rodLevel()) return;
  S.capMode = m;
  ENC = null;
  fishReset();
  saveSoon(); refresh();
  if(m === "fish") tutoMaybe("fishing");
}
ACTIONS.capmode = d => setCapMode(d.m);

function fishReset(){
  clearTimeout(FISHING.timer);
  FISHING = {state:"idle", timer:null, biteAt:0};
}
ACTIONS.fishcast = () => {
  if(FISHING.state !== "idle" || !rodLevel()) return;
  FISHING.state = "wait";
  Sfx.click();
  refresh();
  /* la meteo de pluie fait mordre plus vite */
  const w = weatherDef();
  const wait = (1200 + rng() * 2600) * (w.boost && w.boost.includes(11) ? 0.6 : 1);
  FISHING.timer = setTimeout(()=>{
    if(FISHING.state !== "wait") return;
    FISHING.state = "bite";
    FISHING.biteAt = Date.now();
    Sfx.wobble(); buzz([30, 20, 30]);
    refresh();
    FISHING.timer = setTimeout(()=>{
      if(FISHING.state !== "bite") return;
      FISHING.state = "lost";
      toast("Trop tard — ça a décroché", "bad", "fish");
      refresh();
      FISHING.timer = setTimeout(()=>{ fishReset(); refresh(); }, 900);
    }, rodDef().window);
  }, wait);
};
ACTIONS.fishhook = () => {
  if(FISHING.state === "wait"){
    /* ferrer trop tot fait fuir */
    fishReset();
    toast("Trop tôt — la ligne est vide", "bad", "fish");
    refresh();
    return;
  }
  if(FISHING.state !== "bite") return;
  clearTimeout(FISHING.timer);
  const rod = rodDef();
  if(rng() > rod.hook){
    FISHING.state = "lost";
    toast("Ferré, mais il s'est dégagé", "bad", "fish");
    refresh();
    FISHING.timer = setTimeout(()=>{ fishReset(); refresh(); }, 900);
    return;
  }
  S.stats.fish = (S.stats.fish || 0) + 1;
  S.daily.dayFish = (S.daily.dayFish || 0) + 1;
  questTick("dayFish", 1);
  /* parfois, ce n'est pas un Pokemon qui remonte */
  if(rng() < 0.07 && typeof rollTreasure === "function"){
    rollTreasure(rodLevel() - 1);
    fishReset();
    refresh();
    return;
  }
  fishReset();
  newFishEncounter();
  Sfx.hit(); buzz(18);
  refresh();
};

/* ---------- vivier de pêche ---------- */
function fishPool(rar){
  const out = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || p.rar !== rar || p.leg) continue;
      if(!p.types.includes(11) && EXCL_SOURCE[i] !== "fish") continue;
      if(EXCL_SOURCE[i] && EXCL_SOURCE[i] !== "fish") continue;
      if(i === 350) continue;                       /* Milobellus : par evolution */
      out.push(i);
    }
  return out;
}
function newFishEncounter(){
  const rod = rodDef();
  /* Kyogre : uniquement a la canne, une fois Hoenn ouvert, et jamais a la
     Vieille Canne — il faut aller le chercher assez profond */
  if(regionUnlocked("hoenn") && rodLevel() >= 2 && !S.dex[382]){
    const odds = rodLevel() >= 3 ? 0.012 : 0.004;
    if(rng() < odds){
      ENC = {id:382, level:70, shiny: rng() < shinyOdds() * rod.shiny, rar:5,
             attempts:0, featured:false, fleeing:false, fished:true};
      pzFlash("Attends. Ce n'est pas un poisson. C'est la moitié d'un océan qui vient de mordre.");
      return ENC;
    }
  }
  /* la canne pousse la rarete vers le haut */
  let rar = rollRarity();
  if(rar < 3 && rng() < rod.rare * 0.25) rar++;
  let pool = fishPool(rar);
  for(let r2 = rar; !pool.length && r2 >= 0; r2--) pool = fishPool(r2);
  /* les exclusivites de peche sont favorisees : c'est leur seul acces */
  const weighted = [];
  for(const id of pool){
    const w = EXCL_SOURCE[id] === "fish" ? 4 : 1;
    for(let k = 0; k < w; k++) weighted.push(id);
  }
  const id = weighted.length ? pick(weighted) : 129;   /* Magicarpe, toujours */
  ENC = {id, level: levelFor(POKE[id].rar), rar: POKE[id].rar,
         shiny: rng() < shinyOdds() * rod.shiny,
         attempts:0, featured:false, fleeing:false, fished:true};
  if(ENC.shiny) setTimeout(shinyEntrance, 110);
  saveSoon();
  return ENC;
}

/* ---------- interface ---------- */
function capModeBar(){
  if(!rodLevel()) return "";
  const m = S.capMode === "fish" ? "fish" : "classic";
  return `<div class="capmode">
    <button class="${m==="classic"?"on":""}" data-act="capmode" data-m="classic">${ic("capture")} Capture</button>
    <button class="${m==="fish"?"on":""}" data-act="capmode" data-m="fish">${ic("fish")} Pêche</button>
  </div>`;
}
function fishStage(){
  const rod = rodDef();
  const st = FISHING.state;
  const label = {idle:"Lancer la ligne", wait:"Ça tire ? Pas encore…",
                 bite:"FERRER !", lost:"Ça a décroché"}[st];
  const act = st === "idle" ? "fishcast" : "fishhook";
  const nextRod = RODS[rodLevel()];
  return `<div class="fishstage ${st}">
      <div class="fs-water"><i></i><i></i><i></i></div>
      <div class="fs-line"></div>
      <div class="fs-bob"></div>
      ${st === "bite" ? `<div class="fs-splash"></div>` : ""}
      <div class="fs-rod">${esc(rod.n)}</div>
    </div>
    <button class="throwbtn ${st==="bite"?"urgent":""}" data-act="${act}"
      ${st==="lost"?"disabled":""}>${label}</button>
    <div class="tiny muted" style="text-align:center;margin:7px 0 10px">
      ${st === "wait" ? "Ferrer trop tôt fait fuir la prise. Attendez que le bouchon plonge."
        : "Au bout de la ligne : les Pokémon Eau, et quelques espèces qu'on ne trouve que là."}</div>
    ${nextRod ? `<div class="panel tight">
      <div class="row between">
        <div><div class="tiny">${esc(nextRod.n)}</div>
          <div class="tiny muted">${esc(nextRod.d)}</div></div>
        <button class="btn xs ${S.shards>=nextRod.cost?"gold":""}" data-act="buyrod"
          ${S.shards>=nextRod.cost?"":"disabled"}>${ic("shard")} ${nextRod.cost}</button>
      </div></div>` : ""}`;
}
ACTIONS.buyrod = () => {
  const nx = RODS[rodLevel()];
  if(!nx) return;
  if(!pay("shards", nx.cost)){ toast("Fragments insuffisants", "bad", "cross"); return; }
  S.rod = rodLevel() + 1;
  Sfx.win();
  toast(nx.n + " équipée", "warn", "fish");
  save(); refresh();
};
