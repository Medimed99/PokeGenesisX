/* ============================================================
   37c — LA HIÉRARCHIE DES MOMENTS
   Tout était annoncé de la même façon : un bandeau. Un succès, un
   cosmétique, une montée de niveau, une remarque de Porygon-Z —
   et à la capture d'un Dracolosse inédit, quatre bandeaux venaient
   s'empiler par-dessus la révélation.

   Trois tailles, désormais :
   · PETIT  — le bandeau habituel (toast) : une information.
   · MOYEN  — une bannière qui descend, avec son icône et un son :
              un succès, un cosmétique, un palier.
   · GRAND  — plein écran (moment, 37b) : un niveau, une capture
              rare, un chapitre, une restauration.

   Et une règle : pendant un grand moment ou une révélation, rien
   ne s'affiche par-dessus. Les petites annonces attendent, puis
   passent une à une.
   ============================================================ */

function stageHold(){
  if(typeof MOMENT_ON !== "undefined" && MOMENT_ON) return true;
  if(typeof CINE !== "undefined" && CINE && !CINE.dead) return true;
  /* un tutoriel en cours : ses bulles ne doivent pas être recouvertes */
  if(typeof TUTO !== "undefined" && TUTO) return true;
  const on = id => { const e = typeof document !== "undefined" && document.getElementById ? document.getElementById(id) : null; return !!(e && /\bon\b/.test(e.className || "")); };
  /* une scène racontée, une page qu'on lit, un passage de niveau : les annonces attendent */
  if(on("story") || on("fragread") || on("levelup")) return true;
  /* le résultat d'une capture : on le lit d'abord */
  try { if(document.querySelector && document.querySelector("#sheet-root.on .sheet.catchres")) return true; } catch(e){}
  const d = typeof document !== "undefined" && document.getElementById ? document.getElementById("discover") : null;
  if(d && /\bon\b/.test(d.className || "")) return true;
  /* un combat de la Tour en cours : les annonces attendent les résultats */
  try { if(SQB && !SQB._ended && currentScreen === "tower") return true; } catch(e){}
  return false;
}
const STAGE_Q = [];
function stageDefer(fn){ STAGE_Q.push(fn); if(STAGE_Q.length > 12) STAGE_Q.shift(); }
function stageFlush(){
  if(!STAGE_Q.length || stageHold()) return;
  const fn = STAGE_Q.shift();
  try { fn(); } catch(e){}
  if(STAGE_Q.length) setTimeout(stageFlush, 900);
}
if(typeof setInterval === "function") setInterval(()=>{ try { stageFlush(); } catch(e){} }, 700);

/* ---------- petit : les bandeaux attendent leur tour ---------- */
if(typeof toast === "function"){
  const _toast = toast;
  toast = function(msg, kind, icon){
    if(stageHold()){ stageDefer(()=>_toast(msg, kind, icon)); return; }
    return _toast(msg, kind, icon);
  };
}
if(typeof pzFlash === "function"){
  const _pz = pzFlash;
  pzFlash = function(txt){
    if(stageHold()){ stageDefer(()=>_pz(txt)); return; }
    return _pz(txt);
  };
}

/* ---------- moyen : la bannière ---------- */
const BANNER_Q = [];
let BANNER_ON = false;
/* b : {kicker, title, sub, icon, spr, item, html, c, sfx} */
function banner(b){
  BANNER_Q.push(b);
  if(BANNER_Q.length > 6) BANNER_Q.shift();
  bannerNext();
}
function bannerNext(){
  if(BANNER_ON || !BANNER_Q.length) return;
  if(stageHold()){ setTimeout(bannerNext, 700); return; }
  const host = typeof document !== "undefined" && document.getElementById ? document.getElementById("toasts") : null;
  if(!host || !host.appendChild){ BANNER_Q.length = 0; return; }
  const b = BANNER_Q.shift();
  BANNER_ON = true;
  const d = document.createElement("div");
  d.className = "stbanner";
  d.style.setProperty("--bc", b.c || "#ffd24a");
  const art = b.html ? b.html : b.spr ? sprite(b.spr, !!b.shiny, "") : b.item ? (itemIcon(b.item, 40) || ic(b.icon || "star")) : ic(b.icon || "star");
  d.innerHTML = `<span class="sb-art">${art}</span>
    <span class="grow">${b.kicker ? `<small>${esc(b.kicker)}</small>` : ""}<b>${esc(b.title || "")}</b>${b.sub ? `<em>${esc(b.sub)}</em>` : ""}</span>
    <i class="sb-shine"></i>`;
  host.insertBefore(d, host.firstChild);
  try { (b.sfx === "coin" ? Sfx.coin : Sfx.win)(); } catch(e){}
  if(typeof buzz === "function") buzz([12, 30, 12]);
  const close = () => {
    if(d._gone) return; d._gone = true;
    d.classList.add("out");
    setTimeout(()=>{ d.remove(); BANNER_ON = false; setTimeout(bannerNext, 180); }, 380);
  };
  d.onclick = close;
  setTimeout(close, b.dur || 3400);
}

/* les succès deviennent des bannières (le cosmétique qu'ils donnent n'a pas son propre bandeau) */
let STAGE_MUTE_COS = false;
/* plusieurs succès d'un coup (un retour après une absence, une grosse fouille) : une seule
   bannière qui les nomme, au lieu d'une file de bannières qui défile pendant vingt secondes */
let ACH_BATCH = [];
function achFlush(){
  const L = ACH_BATCH; ACH_BATCH = [];
  if(L.length) banner(achBanner(L));
}
function achBanner(L){
  if(L.length === 1){
    const a = L[0];
    return {kicker:"SUCCÈS", title:a.n, sub:(a.d || "") + (a.rw && Object.keys(a.rw).length ? " · " + rewardText(a.rw) : ""), icon:"trophy", c:"#ffd24a"};
  }
  const names = L.map(a=>a.n);
  return {kicker:`${L.length} SUCCÈS`, title:names.slice(0, 2).join(", ") + (names.length > 2 ? ` et ${names.length - 2} autre${names.length > 3 ? "s" : ""}` : ""),
    sub:names.length > 2 ? names.slice(2, 6).join(" · ") + (names.length > 6 ? " · …" : "") : "Récompenses dans Profil › Succès",
    icon:"trophy", c:"#ffd24a", dur:4600};
}
if(typeof achToast === "function"){
  achToast = function(a){
    ACH_BATCH.push(a);
    if(ACH_BATCH.length === 1){ if(typeof setTimeout === "function") setTimeout(achFlush, 60); else achFlush(); }
  };
}
if(typeof checkAchievements === "function"){
  const _ca = checkAchievements;
  checkAchievements = function(){ STAGE_MUTE_COS = true; try { return _ca.apply(this, arguments); } finally { STAGE_MUTE_COS = false; } };
}
if(typeof unlockCosmetic === "function"){
  unlockCosmetic = function(id){
    if(!COSMETICS[id] || S.cos.owned.includes(id)) return false;
    S.cos.owned.push(id);
    if(!STAGE_MUTE_COS) banner({kicker:"APPARENCE", title:COSMETICS[id].n, sub:"Nouveau cosmétique, à choisir dans Profil › Personnaliser", icon:"star", c:"#9b6bff", dur:2800});
    return true;
  };
}

/* ---------- grand : le niveau d'Archiviste ---------- */
/* ce qui s'ouvre exactement à ce niveau */
function levelUnlocks(L){
  const out = [];
  if(typeof MODULE_REQ !== "undefined") for(const k in MODULE_REQ){
    const r = MODULE_REQ[k];
    if(r.lv === L && !r.hidden && moduleUnlocked(k)) out.push((typeof ROOM_MOMENTS !== "undefined" && ROOM_MOMENTS[k] && ROOM_MOMENTS[k].n) || k);
  }
  return out;
}
function stageLevelUp(L, up){
  const coins = 200 * L, cores = L % 5 === 0 ? 1 : 0;
  const opens = levelUnlocks(L);
  const next = (()=>{ if(typeof MODULE_REQ === "undefined") return null;
    let best = null; for(const k in MODULE_REQ){ const r = MODULE_REQ[k]; if(r.lv > L && !r.hidden && (!best || r.lv < best.lv)) best = {k, lv:r.lv}; } return best; })();
  try { if(typeof Music !== "undefined") Music.jingle("j_niveau"); } catch(e){}
  if(typeof moment !== "function"){ toast(`Niveau d'Archiviste ${L}`, "warn", "star"); return; }
  moment({kind:"levelup", c:"#35f0d6",
    html:`<span class="lv-big"><small>NIVEAU</small><b>${L}</b></span>`,
    kicker:"ARCHIVISTE", title:up > 1 ? `+${up} niveaux` : "Niveau supérieur",
    sub:`+${fmt(coins)} PokéCoins${cores ? " · +1 Noyau" : ""}${opens.length ? " · s'ouvre : " + opens.join(", ") : next ? ` · prochaine salle au niveau ${next.lv}` : ""}`,
    line:typeof pzLine === "function" ? pzLine("levelup") : null, dur:4200,
    then:()=>{ try { refresh(); } catch(e){} }});
}

/* ---------- grand : les captures qui comptent ---------- */
if(typeof showDiscovery === "function"){
  const _sd = showDiscovery;
  showDiscovery = function(c, rw){
    try { if(typeof Music !== "undefined") Music.jingle(c && (c.shiny || c.rar >= 4) ? "j_rare" : "j_decouverte"); } catch(e){}
    return _sd.apply(this, arguments);
  };
}
if(typeof showCatchResult === "function"){
  const _sr = showCatchResult;
  showCatchResult = function(c, rw){
    try { if(c && (c.shiny || c.rar >= 4) && typeof Music !== "undefined") Music.jingle("j_rare"); } catch(e){}
    return _sr.apply(this, arguments);
  };
}
if(typeof playEvolution === "function"){
  const _pe = playEvolution;
  playEvolution = function(){
    try { if(typeof Music !== "undefined") Music.jingle("j_evolution"); } catch(e){}
    return _pe.apply(this, arguments);
  };
}
