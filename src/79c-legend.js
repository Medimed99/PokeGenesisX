/* ============================================================
   79c — LES PASSAGES LÉGENDAIRES
   Un rendez-vous. Toutes les trois heures, un légendaire traverse
   une région pendant 45 minutes. Le passage est le même pour tous
   les joueurs (il se calcule à partir de l'heure), il s'annonce à
   l'avance sur l'accueil, et quand il arrive, le jeu le dit.

   L'affronter avec son équipe rapporte, à la première victoire du
   passage, une carte de ce légendaire — donc son pouvoir — et des
   Bonbons d'équipe. On peut retenter tant que le passage dure.
   ============================================================ */

const LEG_BLOCK = 3 * 3600e3, LEG_DUR = 45 * 60e3;
const LEG_HOME = {144:"kanto", 145:"kanto", 146:"kanto", 150:"kanto", 151:"kanto",
  243:"johto", 244:"johto", 245:"johto", 249:"johto", 250:"johto", 251:"johto",
  377:"hoenn", 378:"hoenn", 379:"hoenn", 380:"hoenn", 381:"hoenn", 382:"hoenn", 383:"hoenn", 384:"hoenn", 385:"hoenn", 386:"hoenn"};
const LEG_IDS = Object.keys(LEG_HOME).map(Number);
function legHash(n){ let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return h >>> 0; }
/* le passage d'un bloc de trois heures : le même pour tout le monde */
function legendOfBlock(b){
  const start = b * LEG_BLOCK + (legHash(b) % 120) * 60e3;
  const pool = LEG_IDS.filter(id=>typeof regionUnlocked !== "function" || regionUnlocked(LEG_HOME[id]));
  const id = (pool.length ? pool : LEG_IDS)[legHash(b + 7919) % (pool.length || LEG_IDS.length)];
  return {b, id, region:LEG_HOME[id], start, end:start + LEG_DUR};
}
function legendNow(t){
  t = t || Date.now();
  const b = Math.floor(t / LEG_BLOCK), L = legendOfBlock(b);
  return t >= L.start && t < L.end ? L : null;
}
function legendNext(t){
  t = t || Date.now();
  let b = Math.floor(t / LEG_BLOCK);
  for(let k = 0; k < 3; k++){ const L = legendOfBlock(b + k); if(L.start > t) return L; }
  return legendOfBlock(b + 1);
}
function legState(){ S.legend = S.legend || {won:{}, seen:{}}; return S.legend; }
function legWon(L){ return !!(L && legState().won[L.b]); }
function legLevel(){
  const ids = typeof teamIds === "function" ? teamIds() : S.team;
  const avg = ids.length ? ids.reduce((a, id)=>a + ((S.dex[id] && S.dex[id].lvl) || 5), 0) / ids.length : 10;
  return clamp(Math.round(avg + 8), 15, 100);
}
function legHourTxt(t){ const d = new Date(t); return String(d.getHours()).padStart(2, "0") + " h " + String(d.getMinutes()).padStart(2, "0"); }

/* ---------- le combat ---------- */
ACTIONS.legfight = () => {
  const L = legendNow();
  if(!L){ toast("Le passage est terminé", "", "clock"); refresh(); return; }
  const ids = typeof teamIds === "function" ? teamIds() : S.team;
  if(!ids.length){ toast("Il faut une équipe", "bad", "cross"); return; }
  const allies = teamFighters(ids, typeof allyBoost === "function" ? allyBoost() : 1);
  const lv = legLevel();
  const foe = makeFighter(L.id, lv, {boost:1.45});
  foe.maxHp = Math.round(foe.maxHp * 2.6); foe.hp = foe.maxHp;
  createBattle(allies, [foe], {
    ai:true, title:"PASSAGE LÉGENDAIRE", stage:"boss",
    intro:`<span class="gold-t">${esc(POKE[L.id].name)}</span> traverse ${esc(regionDef(L.region).name)}. Il ne restera pas longtemps.`,
    onEnd: win => legEnd(L, win)
  });
  go("battle", {mode:"legend"});
};
function legEnd(L, win){
  const st = legState();
  if(win && !st.won[L.b]){
    st.won[L.b] = true;
    S.stats.legWins = (S.stats.legWins || 0) + 1;
    const s = typeof rollCardSeries === "function" ? rollCardSeries(L.id, 1.6) : "art";
    const fresh = typeof grantCardV === "function" ? grantCardV(s, L.id) : false;
    gain("shards", 25); gain("coins", 1500 + S.level * 80);
    if(typeof teamCandyGain === "function") teamCandyGain(5);
    addXp(600 + S.level * 20);
    save();
    setTimeout(()=>{
      if(typeof moment === "function") moment({kind:"release", c:"#ffd24a", spr:L.id, kicker:"PASSAGE LÉGENDAIRE",
        title:`${POKE[L.id].name} s'incline`, sub:`Une carte « ${typeof seriesName === "function" ? seriesName(s) : s} »${fresh ? " — nouvelle !" : " (en double)"} · +25 Fragments · +5 Bonbons d'équipe`,
        line:"Il te laisse une trace de lui. Je l'ai rangée dans ta collection, {nom}. Avec soin.", dur:5200});
    }, 900);
  } else if(!win){
    if(typeof teamCandyGain === "function") teamCandyGain(1);
    setTimeout(()=>toast(`${POKE[L.id].name} est trop fort pour l'instant. Tu peux retenter tant qu'il est là.`, "warn", "clock"), 600);
    save();
  }
}

/* ---------- l'annonce, à l'arrivée ---------- */
function legTick(){
  if(!S || !S.flags || !S.flags.intro) return;
  const L = legendNow(); if(!L) return;
  const st = legState();
  if(st.seen[L.b]) return;
  st.seen[L.b] = true;
  for(const k in st.seen) if(+k < L.b - 20) delete st.seen[k];
  for(const k in st.won) if(+k < L.b - 20) delete st.won[k];
  saveSoon();
  if(typeof banner === "function") banner({kicker:"SIGNATURE MAJEURE", title:`${POKE[L.id].name} traverse ${regionDef(L.region).name}`, sub:`Pendant 45 minutes, jusqu'à ${legHourTxt(L.end)}. Affronte-le depuis l'accueil.`, spr:L.id, c:"#ffd24a", dur:5200});
  try { if(currentScreen === "modules") refresh(); } catch(e){}
}
if(typeof setInterval === "function") setInterval(()=>{ try { legTick(); } catch(e){} }, 20000);

/* ---------- la carte de l'accueil ---------- */
function legendCardHtml(){
  const L = legendNow(), N = L ? null : legendNext();
  if(L){
    const won = legWon(L), left = L.end - Date.now();
    return `<div class="lg-card on ${won ? "won" : ""}">
      <span class="lg-spr">${sprite(L.id, false, "")}</span>
      <div class="grow"><small>PASSAGE LÉGENDAIRE · EN CE MOMENT</small>
        <b>${esc(POKE[L.id].name)} traverse ${esc(regionDef(L.region).name)}</b>
        <em>${won ? "Vaincu pour ce passage. Il reviendra." : `Encore ${fmtTime(left)} · N.${legLevel()} · une carte à la clé`}</em></div>
      ${won ? ic("check") : `<button class="btn sm gold" data-act="legfight">Affronter</button>`}
    </div>`;
  }
  const known = typeof monFound === "function" ? monFound(N.id) : !!S.dex[N.id];
  return `<div class="lg-card">
    <span class="lg-spr sil">${sprite(N.id, false, "")}</span>
    <div class="grow"><small>PROCHAIN PASSAGE LÉGENDAIRE</small>
      <b>${known ? esc(POKE[N.id].name) : "Une signature majeure"} · ${esc(regionDef(N.region).name)}</b>
      <em>À ${legHourTxt(N.start)}, dans ${fmtTime(N.start - Date.now())}, pendant 45 minutes</em></div>
  </div>`;
}
/* sur l'écran de capture de la région traversée, le passage se voit aussi */
if(SCREENS.capture){
  const _ch = SCREENS.capture.html;
  SCREENS.capture.html = function(){
    const h = _ch.apply(this, arguments);
    const L = legendNow();
    if(!L || legWon(L) || S.region !== L.region) return h;
    return `<button class="lg-strip" data-act="legfight"><span class="lg-spr">${sprite(L.id, false, "")}</span>
      <span class="grow"><small>SIGNATURE MAJEURE</small><b>${esc(POKE[L.id].name)} traverse ${esc(regionDef(L.region).name)}</b></span><span class="lg-go">Affronter</span></button>` + h;
  };
}
if(typeof NEXTSTEP_HOOKS !== "undefined") NEXTSTEP_HOOKS.push(()=>{
  const L = legendNow();
  if(L && !legWon(L)) return {p:88, t:`${POKE[L.id].name} traverse ${regionDef(L.region).name} : affronte-le`, go:"modules", i:"star"};
  return null;
});
