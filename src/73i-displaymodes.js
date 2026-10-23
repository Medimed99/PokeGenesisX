/* ============================================================
   73i — LES MODES D'AFFICHAGE 1996 ET 1999
   Réunir les cinq Rendus primordiaux ouvre le mode 1996 : le jeu
   entier sur l'écran d'une Game Boy, quatre verts, une police de
   pixels. Réunir les onze Rendus fondateurs ouvre le mode 1999 :
   la couleur arrive, peu de teintes, saturées, comme sur la Game Boy
   Color. Un réglage, dans les Réglages ; rien d'autre ne change.

   Coût : une seule passe de filtre, sur l'application entière, en
   fonctions CSS que le processeur graphique compose (pas de filtre
   SVG, pas de traitement par sprite) : les combats en temps réel
   restent fluides.
   ============================================================ */
const DISPLAY_MODES = {
  g1:{n:"1996", t:"Game Boy", need:"les 5 Rendus primordiaux", c:"#9bbc0f"},
  g2:{n:"1999", t:"Game Boy Color", need:"les 11 Rendus fondateurs", c:"#e0b64a"}
};
function displayModeOpen(m){
  if(!DISPLAY_MODES[m]) return false;
  const ids = CARD_MONS.filter(id=>CARD_INDEX[cardKey(m, id)]);
  return ids.length > 0 && ids.every(id=>cardHas(m, id));
}
function displayModeOf(){
  const m = S && S.settings && S.settings.era;
  return m && displayModeOpen(m) ? m : "";
}
function applyDisplayMode(){
  try {
    if(typeof document === "undefined" || !document.body || !document.body.classList) return;
    const m = displayModeOf();
    document.body.classList.toggle("era-g1", m === "g1");
    document.body.classList.toggle("era-g2", m === "g2");
  } catch(e){}
}
ACTIONS.dispmode = d => {
  const m = d.m || "";
  if(m && !displayModeOpen(m)){ toast(`Il faut ${DISPLAY_MODES[m].need}`, "bad", "lock"); return; }
  S.settings.era = m;
  applyDisplayMode(); save(); refresh();
  toast(m ? `Affichage ${DISPLAY_MODES[m].n}` : "Affichage d'aujourd'hui", "", "eye");
};
function displayModesHtml(){
  const cur = displayModeOf();
  const chip = (m, label, sub) => {
    const open = !m || displayModeOpen(m);
    return `<button class="chip dm-chip ${cur === m ? "on" : ""} ${open ? "" : "locked"}" data-act="dispmode" data-m="${m}" ${open ? "" : 'aria-disabled="true"'}>
      ${open ? "" : ic("lock")}${label}${sub ? `<small>${sub}</small>` : ""}</button>`;
  };
  return `<div class="dm-row">
    <div class="tiny">Affichage</div>
    <div class="tiny dim">Tout le jeu comme sur une console d'époque. Chaque mode se débloque avec les cartes de son époque.</div>
    <div class="dm-chips">
      ${chip("", "Aujourd'hui", "")}
      ${Object.keys(DISPLAY_MODES).map(m=>chip(m, DISPLAY_MODES[m].n, displayModeOpen(m) ? DISPLAY_MODES[m].t : "il faut " + DISPLAY_MODES[m].need)).join("")}
    </div>
  </div>`;
}
/* dans les Réglages, sous les effets réduits (l'écran des réglages reprend le panneau du profil) */
if(typeof SCREENS !== "undefined" && SCREENS.profile && typeof SCREENS.profile.set === "function"){
  const _set = SCREENS.profile.set;
  SCREENS.profile.set = function(){
    const h = _set.apply(this, arguments);
    const k = h.indexOf('data-act="togglecalm"');
    if(k < 0) return h;
    const end = h.indexOf("</div>", h.indexOf("</button>", k)) + 6;
    return h.slice(0, end) + displayModesHtml() + h.slice(end);
  };
}

/* le jour où la série est complète : on le dit, une fois */
function displayModeTick(){
  if(!S || !S.flags || typeof introSeen !== "function" || !introSeen()) return;
  if(!S.dmSeen || typeof S.dmSeen !== "object") S.dmSeen = {};
  for(const m in DISPLAY_MODES){
    if(S.dmSeen[m] || !displayModeOpen(m)) continue;
    if(typeof reidxQuiet === "function" && !reidxQuiet()) return;
    S.dmSeen[m] = Date.now();
    saveSoon();
    if(typeof moment === "function") moment({kind:"door", c:DISPLAY_MODES[m].c, icon:"eye", kicker:"AFFICHAGE " + DISPLAY_MODES[m].n,
      title:`Le jeu peut s'afficher comme en ${DISPLAY_MODES[m].n}`,
      sub:`Tu as réuni ${DISPLAY_MODES[m].need}. Réglages → Affichage.`,
      line:m === "g1" ? "Quatre teintes de vert. Je me souviens de cet écran. Je ne sais pas comment, mais je m'en souviens."
                      : "La couleur, enfin. Pas beaucoup. Juste assez.", dur:6000});
    return;
  }
}
if(typeof setInterval === "function") setInterval(()=>{ try { displayModeTick(); applyDisplayMode(); } catch(e){} }, 3000);
