/* ============================================================
   99 — AMORCAGE
   ============================================================ */

const BOOT_LINES = [
  {t:"POKEDEX OS v0.12 — chargement du noyau", c:""},
  {t:"montage du secteur KANTO ............ ok", c:""},
  {t:"montage du secteur JOHTO ............ ok", c:""},
  {t:"montage du secteur HOENN ............ ok", c:""},
  {t:"vérification de l'index des espèces .. 386 entrées", c:""},
  {t:"lignes illisibles détectées : 386", c:"err"},
  {t:"intégrité du monde ................... 0.0%", c:"err"},
  {t:"recherche d'un utilisateur avec droit d'écriture…", c:""},
  {t:"UTILISATEUR TROUVÉ", c:""}
];

function bootScreen(done){
  const el = document.getElementById("boot");
  el.style.display = "flex";
  el.innerHTML = `
    <div class="logo">POKÉMON<br><span>CODE</span> GENESIS</div>
    <span class="sprbox" style="width:96px;height:96px;opacity:.9">
      ${sprite(474, false, "", {anim:true, eager:true})}</span>
    <div class="term" id="boot-term"></div>
    <div class="tiny dim">jeu de fan non officiel</div>`;
  const term = document.getElementById("boot-term");
  let i = 0;
  const step = () => {
    if(i >= BOOT_LINES.length){
      const b = document.createElement("div");
      b.innerHTML = `<br>`;
      term.appendChild(b);
      const btn = document.createElement("button");
      btn.className = "btn pri wide";
      btn.textContent = "Entrer dans l'archive";
      btn.onclick = () => { el.style.display = "none"; el.innerHTML = ""; done(); };
      el.appendChild(btn);
      return;
    }
    const l = BOOT_LINES[i++];
    const d = document.createElement("div");
    d.className = l.c;
    d.innerHTML = `<b>&gt;</b> ${esc(l.t)}`;
    term.appendChild(d);
    if(term.children.length > 9) term.firstChild.remove();
    Sfx.click();
    setTimeout(step, 150 + rng()*130);
  };
  setTimeout(step, 220);
}

/* --- PWA : manifeste genere a la volee --- */
function installPwaBits(){
  try {
    /* la version hebergee declare deja un manifeste : on ne le double pas */
    if(document.querySelector('link[rel="manifest"]')) return;
    const icon = "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
        <rect width="192" height="192" fill="#05070c"/>
        <circle cx="96" cy="96" r="58" fill="none" stroke="#35f0d6" stroke-width="10"/>
        <path d="M38 96h116" stroke="#35f0d6" stroke-width="10"/>
        <circle cx="96" cy="96" r="20" fill="#ff3d7f"/></svg>`);
    const manifest = {
      name: "Pokémon Code Genesis", short_name: "Code Genesis",
      start_url: ".", display: "standalone", orientation: "portrait",
      background_color: "#05070c", theme_color: "#05070c",
      icons: [{src: icon, sizes: "192x192", type: "image/svg+xml", purpose: "any"}]
    };
    const blob = new Blob([JSON.stringify(manifest)], {type:"application/json"});
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  } catch(e){ /* sans consequence */ }
}

/* --- notification de disponibilite du tampon --- */
function maybeNotify(){
  try {
    if(!("Notification" in window) || Notification.permission !== "granted") return;
    if(!canOpenBox()) return;
    const key = "pcg.notif." + today();
    if(Store.get(key)) return;
    Store.set(key, "1");
    new Notification("Pokémon Code Genesis", {
      body: "Le tampon quotidien de Porygon-Z est de nouveau disponible."
    });
  } catch(e){}
}

/* --- boucle principale --- */
let mainTimer = null;
function startLoops(){
  clearInterval(mainTimer);
  mainTimer = setInterval(()=>{
    forageTick(1);
    renderTopbar();
    if(S.event && S.event.until <= Date.now()){ S.event = null; rollEvent(); }
    if(currentScreen === "idle"){ /* le compteur se met a jour dans son propre intervalle */ }
  }, 1000);
  setInterval(save, 20000);
}

/* --- heure de jeu : succes cache --- */
function checkNightFlag(){
  const h = new Date().getHours();
  if(h >= 3 && h < 5) S.flags.night = true;
}

function boot(){
  installSpriteVars();
  installKonami();
  netStart();
  probeAnimated();
  installPwaBits();
  const loaded = load();
  const fresh = !loaded;
  S = loaded || newState();

  applyCorruption();
  dailyRollover();
  checkNightFlag();

  const enter = () => {
    startLoops();
    if(fresh){
      /* rien du jeu ne doit apparaitre derriere la scene d'ouverture */
      /* la cinematique remplace la scene d'ouverture ; elle en reprend toutes les idees */
      playCine(CINE_INTRO, ()=>{
        if(!S.story.includes("intro")) S.story.push("intro");
        save(); go("capture"); tutoMaybe("intro");
      });
      checkAchievements();
      save();
      return;
    }
    go("capture");
    {
      if(!showOfflineReport()){ if(!showReport()){ if(!showLuckyDay()){
        if(!checkStoryTriggers()) refresh(); } } }
    }
    checkAchievements();
    guideTick();
    maybeNotify();
    save();
  };

  if(fresh) bootScreen(enter);
  else { document.getElementById("boot").style.display = "none"; enter(); }
}

/* --- cycle de vie --- */
document.addEventListener("visibilitychange", ()=>{
  if(document.hidden){ save(); netAutoSync(); }
  else {
    if(!S) return;
    const rep = offlineReport();
    dailyRollover();
    if(rep && rep.away > 300000) showOfflineReport();
    else refresh();
    maybeNotify();
  }
});
window.addEventListener("beforeunload", ()=>{ if(S){ save(); netAutoSync(); } });
window.addEventListener("error", e=>{ console.error(e.error||e.message); });

/* empeche le zoom par double-tap sans bloquer le defilement */
let lastTouch = 0;
document.addEventListener("touchend", e=>{
  const now = Date.now();
  if(now - lastTouch < 300) e.preventDefault();
  lastTouch = now;
}, {passive:false});

let booted = false;
function bootOnce(){ if(booted) return; booted = true; boot(); }
document.addEventListener("DOMContentLoaded", bootOnce);
if(document.readyState !== "loading") bootOnce();
