/* ============================================================
   96 — INSTALLER L'APPLICATION (PWA)
   Le jeu tourne mieux installe sur l'ecran d'accueil : plein ecran,
   lancement instantane, hors ligne. Mais le parcours doit etre juste :

   · sur iPhone, l'application installee a SON PROPRE stockage, separe
     de Safari : elle demarre une partie neuve. On le propose donc au
     tout debut, quand il n'y a rien a perdre ; plus tard, on passe
     d'abord par un compte (ou un export de la partie) ;
   · sur Android, l'application partage le stockage de Chrome : la
     progression suit, et un bouton ouvre l'installation native ;
   · dans un navigateur integre (Instagram, TikTok…), l'installation est
     impossible : on invite a ouvrir le lien dans Safari ou Chrome.

   Jamais plus de deux propositions spontanees ; ensuite, seulement
   depuis le profil. Jamais pendant une action.
   ============================================================ */
const PWA = {deferred: null, onClose: null, restoreMode: false};

function pwaStandalone(){
  try {
    return (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches))
      || navigator.standalone === true;
  } catch(e){ return false; }
}
function pwaEnv(){
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|musical_ly|Twitter|LinkedInApp/i.test(ua);
  return {ios, android, inApp, mobile: ios || android || /Mobi/i.test(ua)};
}
/* la version autonome (fichier ouvert localement) ne peut pas s'installer */
function pwaHosted(){ try { return /^https?:$/.test(location.protocol); } catch(e){ return false; } }
function pwaInstallable(){ return pwaHosted() && !pwaStandalone() && !(S && S.flags && S.flags.pwaInstalled); }
/* l'app installee repart-elle d'une partie neuve ? oui sur iPhone */
function pwaSeparate(){ return pwaEnv().ios; }

function pwaInit(){
  if(typeof window === "undefined" || !window.addEventListener) return;
  /* Chrome et Edge (Android, ordinateur) : on garde l'invitation native pour
     la declencher au bon moment, plutot que le bandeau automatique */
  window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); PWA.deferred = e; });
  window.addEventListener("appinstalled", ()=>{
    if(S){ S.flags.pwaInstalled = true; save(); }
    PWA.deferred = null;
    toast("Installé ! Ouvrez Code Genesis depuis l'écran d'accueil", "", "check");
  });
}

/* ---------- l'icône « partager » d'iOS, dessinée (générique) ---------- */
const PWA_SHARE = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="vertical-align:-3px">
  <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17.5 10H16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
function pwaSteps(){
  const E = pwaEnv();
  if(E.ios) return `<ol class="pwa-steps">
      <li>Touchez ${PWA_SHARE} <b>Partager</b> dans Safari <span class="dim">(ou ⋯ puis Partager)</span></li>
      <li>Choisissez <b>« Sur l'écran d'accueil »</b></li>
      <li>Touchez <b>Ajouter</b>, puis ouvrez Code Genesis depuis l'écran d'accueil</li></ol>`;
  if(E.android) return `<ol class="pwa-steps">
      <li>Ouvrez le menu <b>⋮</b> du navigateur</li>
      <li>Choisissez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b></li></ol>`;
  return `<ol class="pwa-steps"><li>Cliquez sur l'icône d'installation dans la barre d'adresse, ou dans le menu du navigateur</li></ol>`;
}

/* ---------- la carte d'installation ----------
   stage : "start" (tout debut), "later" (joueur qui a progresse),
           "ready" (compte cree, on peut installer), "manual" (depuis le profil) */
function pwaOffer(stage, after){
  if(!pwaInstallable()){ if(after) after(); return; }
  const E = pwaEnv(), sep = pwaSeparate();
  const progressed = S.level >= 3 || ((S.stats && S.stats.catches) || 0) >= 15;
  S.flags.pwaOffers = (S.flags.pwaOffers || 0) + (stage === "manual" ? 0 : 1);
  S.flags.pwaLastOffer = Date.now();
  saveSoon();
  PWA.onClose = after || null;

  let body, actions;
  const head = `<div class="pwa-head">${pzFace("Happy", 44)}
      <div><div class="pwa-kicker">CONSEIL DE MAINTENANCE</div>
        <div class="pwa-title">Installez l'archive sur votre écran d'accueil</div></div></div>
    <div class="pwa-perks"><span>Plein écran</span><span>Lancement instantané</span><span>Jouable hors ligne</span></div>`;

  if(E.inApp){
    body = `<div class="tiny muted">Ce navigateur intégré ne permet pas l'installation. Ouvrez le jeu dans
      ${E.ios ? "Safari" : "Chrome"} (menu ⋯ › « Ouvrir dans le navigateur »), puis installez-le.</div>`;
    actions = `<button class="btn pri" data-act="pwacopy">Copier le lien</button>`;
  } else if(sep && progressed && stage !== "ready"){
    /* iPhone, partie deja avancee : l'app installee repart de zero, on securise d'abord */
    if(typeof Net !== "undefined" && Net.configured() && !Net.signedIn()){
      body = `<div class="tiny muted">Sur iPhone, l'app installée démarre sa propre partie. Créez d'abord un
        compte (30 secondes) : il suffira de vous y connecter dans l'app pour tout retrouver.</div>`;
      actions = `<button class="btn pri" data-act="pwaaccount">Créer mon compte d'abord</button>`;
    } else if(typeof Net !== "undefined" && Net.configured() && Net.signedIn()){
      body = `<div class="tiny muted">Votre compte vous suivra : dans l'app installée, touchez
        « J'ai déjà une partie » puis connectez-vous.</div>${pwaSteps()}`;
      actions = "";
    } else {
      body = `<div class="tiny muted">Sur iPhone, l'app installée démarre sa propre partie. Exportez d'abord
        la vôtre : vous l'importerez dans l'app via « J'ai déjà une partie ».</div>${pwaSteps()}`;
      actions = `<button class="btn" data-act="exportsave">Exporter ma partie</button>`;
    }
  } else if(PWA.deferred){
    body = `<div class="tiny muted">${sep ? "" : "Votre progression vous suit dans l'app."} Un seul geste.</div>`;
    actions = `<button class="btn pri" data-act="pwainstall">Installer</button>`;
  } else {
    body = `<div class="tiny muted">${stage === "start" && sep
        ? "C'est le bon moment : l'app installée démarre sa propre partie, et vous n'avez encore rien à perdre."
        : sep ? "" : "Votre progression vous suit dans l'app."}</div>${pwaSteps()}`;
    actions = "";
  }
  sheet(`<div class="pwa-card">${head}${body}
    <div class="pwa-actions">${actions}<button class="btn ghost" data-act="pwalater">${stage === "manual" ? "Fermer" : "Plus tard"}</button></div></div>`);
}
/* appele par closeSheet : la suite du parcours reprend quand la carte se ferme */
function pwaSheetClosed(){
  if(!PWA.onClose) return;
  const f = PWA.onClose; PWA.onClose = null;
  setTimeout(f, 250);
}
ACTIONS.pwalater = () => { S.flags.pwaDeclined = (S.flags.pwaDeclined || 0) + 1; saveSoon(); closeSheet(); };
ACTIONS.pwainstall = async () => {
  if(!PWA.deferred){ pwaOffer("manual"); return; }
  const e = PWA.deferred; PWA.deferred = null;
  closeSheet();
  try {
    e.prompt();
    const r = await e.userChoice;
    if(r && r.outcome === "accepted"){ S.flags.pwaInstalled = true; save(); }
  } catch(err){}
};
ACTIONS.pwacopy = () => {
  const url = location.origin + location.pathname;
  try { navigator.clipboard.writeText(url).then(()=>toast("Lien copié", "", "check")); }
  catch(e){ toast(url, "", "check"); }
};
ACTIONS.pwaaccount = () => {
  S.flags.pwaAfterAccount = true; saveSoon();
  PWA.onClose = null; closeSheet();
  if(typeof NET_AUTH_MODE !== "undefined"){ NET_AUTH_MODE = "signup"; NET_TAB = "compte"; }
  go("online");
};
/* compte cree ou connecte apres la proposition : on reprend l'installation */
function pwaAfterAuth(){
  if(!S.flags.pwaAfterAccount || !pwaInstallable()) return;
  S.flags.pwaAfterAccount = false; saveSoon();
  setTimeout(()=>pwaOffer("ready"), 900);
}
ACTIONS.pwamanual = () => pwaOffer("manual");

/* ---------- quand proposer ---------- */
/* 1. juste apres la cinematique d'ouverture, une seule fois, sur mobile */
function pwaAfterIntro(next){
  if(!pwaInstallable() || !pwaEnv().mobile || S.flags.pwaOffers){ next(); return; }
  /* tout de suite : l'ecran de capture programme son tutoriel quelques
     centaines de millisecondes apres son affichage ; ouverte avant lui, la
     carte le fait patienter au lieu de se retrouver dessous */
  pwaOffer("start", next);
}
/* 2. au debut d'une session suivante, si la premiere a ete ecartee :
      une derniere fois, pas avant le lendemain */
function pwaSessionStart(){
  if(!pwaInstallable() || !pwaEnv().mobile) return;
  if((S.flags.pwaOffers || 0) >= 2) return;
  if(S.flags.pwaLastOffer && Date.now() - S.flags.pwaLastOffer < 20 * 3600 * 1000) return;
  if(S.level < 3) return;
  setTimeout(()=>{ if(!overlayBusy() && currentScreen === "capture") pwaOffer("later"); }, 2500);
}
