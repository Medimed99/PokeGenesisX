/* ============================================================
   32 — LE MONDE
   Un secteur etait une liste plate de 151 especes ou l'on piochait.
   Trois couches lui donnent une geographie et un temps :

   · les HABITATS decoupent le secteur en lieux, chacun avec son
     vivier — capturer devient choisir ou chercher ;
   · le CYCLE JOUR-NUIT change ce qui sort selon l'heure reelle ;
   · la METEO tourne d'elle-meme et modifie raretes et combats.

   Les viviers sont derives des types, jamais ecrits a la main :
   386 listes manuelles auraient derive a la premiere correction.
   ============================================================ */

const HABITATS = {
  route:   {n:"Routes ouvertes", i:"capture", c:"#8fbf6a", need:0,
            d:"Les voies encore praticables. Le trafic de données y est dense et banal.",
            types:[1, 3, 7, 12], bias:0},
  foret:   {n:"Sylve d'index",   i:"seed",    c:"#5ce07a", need:12,
            d:"Une arborescence qui a continué de croître sans personne pour l'élaguer.",
            types:[12, 7, 4], bias:1},
  eaux:    {n:"Nappes",          i:"fish",    c:"#4fb2ff", need:24,
            d:"Les couches basses, où les données s'accumulent et stagnent.",
            types:[11, 15], bias:1},
  grotte:  {n:"Cavités",         i:"stone",   c:"#c9a86a", need:40,
            d:"Des blocs mémoire jamais désalloués. On y perd le signal.",
            types:[6, 5, 9], bias:2},
  ruines:  {n:"Ruines d'archive",i:"boss",    c:"#b06bff", need:62,
            d:"Ce qui reste d'une bibliothèque. Les entrées y sont toujours actives.",
            types:[8, 14, 16, 17], bias:3},
  foyer:   {n:"Foyer thermique", i:"bolt",    c:"#ff8a3d", need:86,
            d:"Le cœur de calcul du secteur. Il n'a jamais refroidi.",
            types:[10, 13, 2], bias:3}
};
const HABITAT_IDS = Object.keys(HABITATS);

function habitatUnlocked(k){
  const h = HABITATS[k];
  if(!h) return false;
  return !h.need || dexCount(S.region) >= h.need;
}
function currentHabitat(){
  const k = S.habitat || "route";
  return habitatUnlocked(k) ? k : "route";
}
function habitatDef(){ return HABITATS[currentHabitat()]; }

/* ---------- cycle jour-nuit ----------
   Cale sur l'horloge reelle. Certaines especes ne sortent que la nuit :
   c'est iconique depuis Or et Argent, et ca donne une raison de revenir
   a une autre heure. */
const NIGHT_TYPES = [8, 17, 14, 4];        /* Spectre, Tenebres, Psy, Poison */
const DAY_TYPES   = [12, 1, 3, 7, 10];     /* Plante, Normal, Vol, Insecte, Feu */
function isNight(){
  const h = new Date().getHours();
  return h >= 20 || h < 6;
}
function daypartName(){ return isNight() ? "Nuit" : "Jour"; }

/* ---------- météo du système ----------
   Elle tourne toute seule toutes les vingt minutes. Elle se voit a
   l'ecran, elle change les raretes, et elle pese en combat. */
const WEATHER = {
  clair:   {n:"Flux clair",       c:"#8ea3bd", d:"Rien de particulier. Le système respire.",
            boost:[], mult:1},
  pluie:   {n:"Pluie de données",  c:"#4fb2ff", d:"Les types Eau et Électrik remontent. Le Feu s'étouffe.",
            boost:[11, 13], weak:[10], mult:1.35},
  surchauffe:{n:"Surchauffe",      c:"#ff8a3d", d:"Les types Feu et Roche affluent. L'Eau s'évapore.",
            boost:[10, 6], weak:[11], mult:1.35},
  gel:     {n:"Gel du tampon",     c:"#9fe7f0", d:"Glace et Acier partout. Tout ralentit.",
            boost:[15, 9], weak:[12], mult:1.35, slow:1},
  saturation:{n:"Saturation",      c:"#b06bff", d:"Psy et Spectre saturent le canal. Les raretés montent.",
            boost:[14, 8], weak:[], mult:1.5, rare:1},
  purge:   {n:"Purge",             c:"#ff3d7f", d:"Le système efface. Les captures rapportent davantage.",
            boost:[17, 16], weak:[], mult:1.2, gain:1.4}
};
const WEATHER_IDS = Object.keys(WEATHER);
const WEATHER_MS = 20 * 60 * 1000;

function weatherRollover(){
  const now = Date.now();
  if(!S.weather || !S.weatherUntil || S.weatherUntil <= now){
    /* le flux clair revient souvent : une meteo permanente cesse d'etre un evenement */
    const pool = ["clair", "clair", "clair", "pluie", "surchauffe", "gel", "saturation", "purge"];
    S.weather = pick(pool);
    S.weatherUntil = now + WEATHER_MS;
    saveSoon();
  }
}
function weatherDef(){ weatherRollover(); return WEATHER[S.weather] || WEATHER.clair; }
function weatherLeft(){ return Math.max(0, (S.weatherUntil || 0) - Date.now()); }

/* ============================================================
   VIVIER D'UN HABITAT
   Le poids d'une espece combine son habitat, l'heure et la meteo.
   ============================================================ */
function habitatWeight(id, hab, night, w){
  const p = POKE[id];
  if(!p) return 0;
  let weight = 1;
  /* affinite d'habitat : une espece du bon type y est bien plus frequente */
  const match = p.types.filter(t=>hab.types.includes(t)).length;
  if(match === 0) weight *= 0.12;
  else weight *= 1 + match * 2.2;
  /* heure */
  for(const t of p.types){
    if(night && NIGHT_TYPES.includes(t)) weight *= 2.0;
    if(!night && DAY_TYPES.includes(t))  weight *= 1.6;
    if(night && DAY_TYPES.includes(t))   weight *= 0.65;
    if(!night && NIGHT_TYPES.includes(t))weight *= 0.55;
  }
  weight *= lureMul(p);
  /* meteo */
  for(const t of p.types){
    if(w.boost && w.boost.includes(t)) weight *= w.mult;
    if(w.weak && w.weak.includes(t))   weight *= 0.45;
  }
  return weight;
}
/* choisit une espece dans l'habitat courant, pour une rarete donnee */
function speciesInHabitat(rar){
  const hab = habitatDef();
  const night = isNight();
  const w = weatherDef();
  const r = regionDef(S.region);
  const pool = [], weights = [];
  let total = 0;
  for(let i = r.from; i <= r.to; i++){
    const p = POKE[i];
    if(!p || p.rar !== rar) continue;
    if(isExclusive(i)) continue;                 /* peche, oeufs, forage */
    if(isGuardianSpecies(i) && !isReleasedGuardian(i)) continue;
    const wt = habitatWeight(i, hab, night, w);
    if(wt <= 0) continue;
    pool.push(i); weights.push(wt); total += wt;
  }
  if(!pool.length) return null;
  let x = rng() * total;
  for(let i = 0; i < pool.length; i++){
    x -= weights[i];
    if(x <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/* ---------- combien d'espèces reste-t-il ici ? ---------- */
function habitatMissing(k){
  const hab = HABITATS[k];
  const r = regionDef(S.region);
  let n = 0;
  for(let i = r.from; i <= r.to; i++){
    const p = POKE[i];
    if(!p || S.dex[i] || isExclusive(i)) continue;
    if(p.types.some(t=>hab.types.includes(t))) n++;
  }
  return n;
}

/* ============================================================
   INTERFACE
   ============================================================ */
function weatherBanner(){
  const w = weatherDef();
  const night = isNight();
  return `<div class="wxbar" style="--wc:${w.c}">
    <span class="wx-part">${ic(night ? "star" : "eye")} ${daypartName()}</span>
    <span class="wx-sep"></span>
    <span class="wx-n">${esc(w.n)}</span>
    <span class="grow wx-d">${esc(w.d)}</span>
    <span class="wx-t mono-num">${fmtTime(weatherLeft())}</span>
  </div>`;
}
function habitatBar(){
  const cur = currentHabitat();
  return `<div class="habbar">
    ${HABITAT_IDS.map(k=>{
      const h = HABITATS[k], open = habitatUnlocked(k);
      return `<button class="habchip ${cur===k?"on":""} ${open?"":"locked"}"
        style="--hc:${h.c}" data-act="${open?"sethab":"habinfo"}" data-k="${k}">
        ${ic(open ? h.i : "lock")}
        <span>${esc(h.n.split(" ")[0])}</span>
        ${open ? `<b>${habitatMissing(k)}</b>` : `<em>${h.need}</em>`}
      </button>`;}).join("")}
    ${isSafariDay() ? `<button class="habchip ${S.habitat==="safari"?"on":""}" style="--hc:#e0b64a"
        data-act="sethab" data-k="safari">${ic("seed")}<span>Safari</span><b>${S.balls.safari||0}</b></button>` : ""}
  </div>`;
}
ACTIONS.sethab = d => {
  S.habitat = d.k;
  ENC = null;
  Sfx.click();
  saveSoon(); refresh();
};
ACTIONS.habinfo = d => {
  const h = HABITATS[d.k];
  sheet(`${sheetHead(h.n)}
    <div class="tiny muted" style="margin-bottom:10px">${esc(h.d)}</div>
    <div class="panel tight">
      <div class="h sm">ACCÈS</div>
      <div class="tiny">Ce lieu s'ouvre à <b>${h.need} espèces</b> archivées dans le secteur
        ${esc(regionDef(S.region).name)}. Vous en avez <b class="cy">${dexCount(S.region)}</b>.</div>
      <div class="bar thin" style="margin-top:6px">
        <i style="width:${Math.min(100, dexCount(S.region)/h.need*100)}%"></i></div>
    </div>
    <div class="panel tight">
      <div class="h sm">CE QU'ON Y CROISE</div>
      <div class="wrap">${h.types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}</div>
    </div>`, true);
};
ACTIONS.habdetail = () => {
  const cur = currentHabitat(), h = HABITATS[cur];
  const w = weatherDef(), night = isNight();
  sheet(`${sheetHead(h.n)}
    <div class="tiny muted" style="margin-bottom:10px">${esc(h.d)}</div>
    <div class="panel tight">
      <div class="h sm">CONDITIONS ACTUELLES</div>
      <div class="row between tiny"><span class="muted">Moment</span>
        <b>${daypartName()}</b></div>
      <div class="row between tiny"><span class="muted">Météo</span>
        <b style="color:${w.c}">${esc(w.n)}</b></div>
      <div class="tiny muted" style="margin-top:5px">${esc(w.d)}</div>
      <div class="tiny dim" style="margin-top:5px">
        ${night ? "La nuit favorise Spectre, Ténèbres, Psy et Poison."
                : "Le jour favorise Plante, Normal, Vol, Insecte et Feu."}</div>
    </div>
    <div class="panel tight">
      <div class="h sm">TYPES DOMINANTS ICI</div>
      <div class="wrap">${h.types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}</div>
      <div class="tiny dim" style="margin-top:6px">${habitatMissing(cur)} espèce(s) de ces types
        vous manquent encore dans ce secteur.</div>
    </div>`, true);
};
