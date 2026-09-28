/* ============================================================
   95 — COUCHE EN LIGNE
   Client REST direct vers Supabase : aucun SDK externe n'est
   charge, ce qui preserve le fichier unique et fonctionne meme
   quand les scripts tiers sont bloques.
   Tout est facultatif : sans configuration, le jeu est identique.
   ============================================================ */

/* Configuration. Renseignable dans le jeu (Profil > En ligne) ou ici.
   La cle « anon » est publique par nature : la securite repose sur les
   politiques RLS decrites dans sql/schema.sql, pas sur son secret. */
const ONLINE_DEFAULT = (typeof window !== "undefined" && window.PCG_CONFIG)
  ? {url: window.PCG_CONFIG.url || "", key: window.PCG_CONFIG.key || ""}
  : {url: "", key: ""};
const NET_CFG_KEY = "pcg.net.cfg";
const NET_SESSION_KEY = "pcg.net.session";

const Net = {
  cfg: null, session: null, profile: null, busy: false, lastError: null,

  /* ---------- configuration ---------- */
  load(){
    try {
      const raw = Store.get(NET_CFG_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      /* une configuration fournie par l'hebergement l'emporte sur une saisie ancienne */
      this.cfg = (ONLINE_DEFAULT.url && ONLINE_DEFAULT.key)
        ? Object.assign({}, ONLINE_DEFAULT)
        : (saved || Object.assign({}, ONLINE_DEFAULT));
    } catch(e){ this.cfg = Object.assign({}, ONLINE_DEFAULT); }
    try {
      const raw = Store.get(NET_SESSION_KEY);
      this.session = raw ? JSON.parse(raw) : null;
    } catch(e){ this.session = null; }
  },
  setCfg(url, key){
    this.cfg = {url: (url||"").trim().replace(/\/+$/,""), key: (key||"").trim()};
    Store.set(NET_CFG_KEY, JSON.stringify(this.cfg));
  },
  configured(){ return !!(this.cfg && this.cfg.url && this.cfg.key); },
  signedIn(){ return !!(this.session && this.session.access_token); },
  userId(){ return this.session && this.session.user && this.session.user.id; },
  saveSession(s){
    this.session = s;
    if(s) Store.set(NET_SESSION_KEY, JSON.stringify(s));
    else Store.del(NET_SESSION_KEY);
  },

  /* ---------- transport ---------- */
  async call(path, opts){
    opts = opts || {};
    if(!this.configured()) throw new Error("Service en ligne non configuré");
    const headers = Object.assign({
      "apikey": this.cfg.key,
      "Content-Type": "application/json"
    }, opts.headers || {});
    /* Deux familles de cles Supabase : l'ancienne cle « anon » est un JWT et peut
       servir de jeton ; la nouvelle cle « publishable » (sb_publishable_…) n'en
       est pas un et ne doit jamais partir dans Authorization. */
    if(opts.auth !== false && this.signedIn())
      headers["Authorization"] = "Bearer " + this.session.access_token;
    else if(opts.auth !== false && /^eyJ/.test(this.cfg.key))
      headers["Authorization"] = "Bearer " + this.cfg.key;

    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(()=>ctrl.abort(), opts.timeout || 15000) : null;
    let res;
    try {
      res = await fetch(this.cfg.url + path, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: ctrl ? ctrl.signal : undefined,
        keepalive: !!opts.keepalive
      });
    } catch(e){
      if(timer) clearTimeout(timer);
      throw new Error("Réseau indisponible");
    }
    if(timer) clearTimeout(timer);

    /* jeton expire : on rafraichit une fois puis on rejoue la requete */
    if(res.status === 401 && this.session && this.session.refresh_token && !opts._retried){
      const ok = await this.refresh();
      if(ok) return this.call(path, Object.assign({}, opts, {_retried:true}));
      this.saveSession(null);
      throw new Error("Session expirée, reconnectez-vous");
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch(e){ data = text; }
    if(!res.ok){
      const msg = (data && (data.msg || data.message || data.error_description || data.error)) || ("Erreur " + res.status);
      const code = (data && (data.error_code || data.code)) || "";
      throw new Error(netFriendly(msg, code, res.status));
    }
    return data;
  },

  /* ---------- authentification par code a usage unique ---------- */
  async requestCode(email){
    await this.call("/auth/v1/otp", {
      method:"POST", auth:false,
      body:{ email, create_user:true }
    });
    return true;
  },
  /* Selon que le compte existe deja ou non, GoTrue attend un type de
     verification different. On les essaie dans l'ordre plutot que de faire
     echouer une premiere connexion legitime. */
  async verifyCode(email, token){
    const t = String(token).trim();
    let last = null;
    for(const type of ["email", "signup", "magiclink"]){
      try {
        const s = await this.call("/auth/v1/verify", {
          method:"POST", auth:false, body:{ email, token:t, type }
        });
        if(s && s.access_token){ this.saveSession(s); return s; }
      } catch(e){ last = e; }
    }
    throw new Error((last && last.message) || "Code refusé");
  },
  /* ---------- comptes : e-mail et mot de passe ----------
     Le retour des liens recus par e-mail (confirmation, nouveau mot de passe)
     se fait sur la page du jeu elle-meme : voir netHandleAuthLink. */
  async signUp(email, password, pseudo){
    const r = await this.call("/auth/v1/signup?redirect_to=" + encodeURIComponent(netHome()), {
      method:"POST", auth:false, body:{ email, password, data:{ pseudo } }
    });
    /* confirmation d'e-mail desactivee : on est connecte tout de suite */
    if(r && r.access_token){ this.saveSession(r); return {session:true}; }
    return {session:false};
  },
  async signIn(email, password){
    const s = await this.call("/auth/v1/token?grant_type=password", {
      method:"POST", auth:false, body:{ email, password }
    });
    if(!s || !s.access_token) throw new Error("Connexion refusée");
    this.saveSession(s);
    return s;
  },
  async recover(email){
    await this.call("/auth/v1/recover?redirect_to=" + encodeURIComponent(netHome()), {
      method:"POST", auth:false, body:{ email }
    });
  },
  async setPassword(password){
    await this.call("/auth/v1/user", { method:"PUT", body:{ password } });
  },
  async fetchUser(token){
    return this.call("/auth/v1/user", { headers:{ "Authorization":"Bearer " + token }, auth:false });
  },
  async refresh(){
    try {
      const s = await this.call("/auth/v1/token?grant_type=refresh_token", {
        method:"POST", auth:false, _retried:true,
        body:{ refresh_token: this.session.refresh_token }
      });
      if(s && s.access_token){ this.saveSession(s); return true; }
    } catch(e){}
    return false;
  },
  signOut(){
    const s = this.session;
    if(s && s.access_token && this.configured())
      this.call("/auth/v1/logout", { method:"POST" }).catch(()=>{});
    this.saveSession(null); this.profile = null;
  },
  /* ---------- classement de la Breche du jour ---------- */
  async submitDaily(score, depth, team){
    await this.call("/rest/v1/rpc/submit_breche_daily", { method:"POST", body:{
      p_day: isoDay(), p_name: (S.name || "Archiviste").slice(0, 16),
      p_score: Math.round(score), p_depth: depth | 0, p_team: (team || []).slice(0, 6) } });
  },
  /* ---------- objectif collectif de la semaine ---------- */
  async communityAdd(week, kills){
    await this.call("/rest/v1/rpc/add_community", { method:"POST", body:{ p_week: week, p_kills: Math.round(kills) } });
  },
  async communityTotal(week){
    const r = await this.call(`/rest/v1/community_totals?week=eq.${encodeURIComponent(week)}&select=total,players`);
    return (r && r[0]) || {total:0, players:0};
  },
  async dailyBoard(){
    return this.call(`/rest/v1/breche_daily?day=eq.${isoDay()}&select=user_id,name,score,depth,team&order=score.desc&limit=30`);
  },

  /* ---------- sauvegarde distante ---------- */
  /* La revision est monotone : elle tranche les conflits sans dependre
     de l'horloge de l'appareil, qui n'est pas fiable. */
  async pull(){
    const rows = await this.call(
      `/rest/v1/saves?user_id=eq.${this.userId()}&select=rev,updated_at,payload`);
    return (rows && rows[0]) || null;
  },
  async push(force){
    const S2 = JSON.parse(JSON.stringify(S));
    delete S2.expedition; delete S2.poker;      /* les runs en cours ne se synchronisent pas */
    const rev = Math.max(S.netRev || 0, S.netBase || 0) + 1;
    const body = {
      user_id: this.userId(),
      rev,
      payload: S2,
      name: S.name,
      level: S.level,
      integrity: +S.integrity.toFixed(2),
      dex_count: dexTotal(),
      shinies: Object.values(S.dex).filter(e=>e.shiny).length,
      best_streak: S.stats.bestStreak,
      best_ante: S.pokerMeta.bestAnte || 0,
      cards: Object.keys(S.cards || {}).length,
      guardians: S.bosses.length,
      tower: (S.tower && S.tower.best) || 0,
      faction: (S.faction && S.faction.k) || null,
      breche_depth: (S.breche && S.breche.bestDepth) || 0,
      breche_clears: (S.breche && S.breche.clears) || 0,
      tested: !!S.flags.testUsed
    };
    await this.call("/rest/v1/saves?on_conflict=user_id", {
      method:"POST", keepalive: !!force && force === "leaving",
      headers:{ "Prefer": "resolution=merge-duplicates" },
      body:[body]
    });
    S.netRev = rev;
    netMarkSynced(rev);
    saveSoon();
    return rev;
  },

  /* ---------- classements ---------- */
  async leaderboard(metric, limit){
    const cols = "name,level,integrity,dex_count,shinies,best_streak,best_ante,guardians,cards,tower,faction,breche_depth,breche_clears,tested,user_id";
    const q = `/rest/v1/leaderboard?select=${cols}&order=${metric}.desc&limit=${limit||25}`;
    return await this.call(q);
  },

  /* ---------- echanges de cartes ---------- */
  /* la carte est identifiee par sa cle complete, « serie:espece » */
  async offerCard(cardKey){
    return await this.call("/rest/v1/rpc/offer_card", {
      method:"POST", body:{ p_key: cardKey }
    });                                           /* { code } */
  },
  async claimCard(code){
    return await this.call("/rest/v1/rpc/claim_card", {
      method:"POST",
      body:{ p_code: String(code).trim().toUpperCase() }
    });
  },
  async myOffers(){
    return await this.call(
      `/rest/v1/trades?from_user=eq.${this.userId()}&select=code,card_key,species,series,claimed_by,created_at&order=created_at.desc&limit=20`);
  }
};

/* ============================================================
   COMPTES ET SYNCHRONISATION
   ============================================================ */
/* date ISO pour le serveur ; today() du jeu n'a pas de zeros (2026-9-27) */
function isoDay(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function netHome(){ try { return location.origin + location.pathname; } catch(e){ return ""; } }
/* les messages de Supabase sont techniques et en anglais : on les traduit */
function netFriendly(msg, code, status){
  const m = String(msg || "").toLowerCase(), c = String(code || "").toLowerCase();
  if(c === "invalid_credentials" || m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if(c === "email_not_confirmed" || m.includes("email not confirmed")) return "Adresse pas encore confirmée : ouvrez le lien reçu par e-mail.";
  if(c === "user_already_exists" || m.includes("already registered")) return "Un compte existe déjà avec cette adresse : connectez-vous.";
  if(c === "weak_password" || m.includes("password should be")) return "Mot de passe trop faible : 8 caractères minimum.";
  if(c.includes("rate_limit") || m.includes("rate limit")) return "Trop de tentatives ou d'e-mails envoyés. Réessayez un peu plus tard.";
  if(c === "signup_disabled" || m.includes("signups not allowed")) return "Les inscriptions sont désactivées sur ce serveur.";
  if(c === "email_address_invalid" || m.includes("unable to validate email")) return "Adresse e-mail invalide.";
  if(m.includes("otp") && m.includes("expired")) return "Code expiré : demandez-en un nouveau.";
  if(status === 404 && m.includes("relation")) return "Base non initialisée : exécutez sql/schema.sql dans Supabase.";
  if(status === 401 || status === 403) return "Accès refusé par le serveur (clé ou politiques RLS).";
  return msg;
}
/* empreinte de progression : si elle change, la partie locale a avance */
function netFingerprint(){
  return [S.level, S.xp, (S.stats && S.stats.catches) || 0, dexTotal(), Math.round((S.integrity || 0) * 10),
          S.coins, (S.breche && S.breche.runs) || 0, (S.stats && S.stats.expWins) || 0].join("|");
}
/* une partie a peine commencee n'a rien a defendre face au cloud */
function netIsFresh(){ return (S.level || 1) <= 3 && ((S.stats && S.stats.catches) || 0) < 15; }
function netDirty(){ return netFingerprint() !== S.netSyncFp; }
function netMarkSynced(rev){ S.netBase = rev; S.netSyncFp = netFingerprint(); S.netSyncedAt = Date.now(); saveSoon(); }
function netSyncLabel(){
  if(!Net.configured()) return "Facultatif — sauvegarde, classements, échanges";
  if(!Net.signedIn()) return "Non connecté — créez un compte pour sauvegarder dans le cloud";
  if(!S.netSyncedAt) return "Connecté — première synchronisation en attente";
  const m = Math.round((Date.now() - S.netSyncedAt) / 60000);
  return "Connecté · synchronisé " + (m < 1 ? "à l'instant" : "il y a " + (m < 60 ? m + " min" : Math.round(m / 60) + " h"));
}
function netApplyRemote(remote){
  S = deepFill(remote.payload, newState());
  S.netRev = remote.rev;
  netMarkSynced(remote.rev);
  save(); applyCorruption();
}
/* La synchronisation intelligente, appelee au demarrage, a la connexion et
   regulierement :
   · rien dans le cloud                      -> on envoie ;
   · le cloud a avance, pas cet appareil     -> on recupere, sans rien demander ;
   · les deux ont avance de leur cote        -> on demande lequel garder ;
   · seul cet appareil a avance              -> on envoie. */
let NET_CONFLICT = false;
async function netSyncSmart(reason){
  if(!Net.configured() || !Net.signedIn() || Net.busy || NET_CONFLICT) return;
  /* l'etat de synchronisation appartient a un compte : se connecter a un autre
     compte sur le meme appareil repart de zero, sinon on ecraserait son cloud
     avec la partie de l'ancien compte */
  if(S.netUser !== Net.userId()){ S.netUser = Net.userId(); S.netBase = 0; S.netRev = 0; S.netSyncFp = null; }
  Net.busy = true;
  try {
    const remote = await Net.pull();
    if(!remote){ Net.busy = false; await Net.push(); return; }
    const base = S.netBase || 0, dirty = netDirty();
    if(remote.rev > base){
      if(!dirty || netIsFresh()){
        netApplyRemote(remote);
        toast("Progression récupérée depuis le cloud", "", "check");
        if(typeof go === "function") go(currentScreen || "capture");
      } else { NET_CONFLICT = true; netAskPull(remote); }
      return;
    }
    if(dirty){ Net.busy = false; await Net.push(reason === "leaving" ? "leaving" : false); }
  } catch(e){ Net.lastError = e.message || String(e); }
  finally { Net.busy = false; }
}
/* envoi groupe apres un evenement marquant (fin de Breche, verrou leve...) */
let NET_SOON = null;
function netSoon(){
  if(!Net.signedIn()) return;
  clearTimeout(NET_SOON);
  NET_SOON = setTimeout(()=>netSyncSmart("event"), 8000);
}
/* Retour d'un lien recu par e-mail : Supabase renvoie vers la page du jeu avec
   la session dans l'ancre (#access_token=…&type=signup|recovery). */
async function netHandleAuthLink(){
  if(typeof location === "undefined" || !location.hash || location.hash.length < 10) return;
  const h = new URLSearchParams(location.hash.slice(1));
  const err = h.get("error_description");
  const tok = h.get("access_token"), type = h.get("type");
  if(!tok && !err) return;
  try { history.replaceState(null, "", location.pathname + location.search); } catch(e){}
  if(err){ toast(err.replace(/\+/g, " "), "bad", "cross"); return; }
  try {
    const user = await Net.fetchUser(tok);
    Net.saveSession({access_token:tok, refresh_token:h.get("refresh_token"), token_type:"bearer",
      expires_in:+h.get("expires_in") || 3600, user});
    if(type === "recovery"){ netAskNewPassword(); return; }
    toast(type === "signup" ? "Adresse confirmée — vous êtes connecté" : "Connecté", "", "check");
    netSyncSmart("login");
  } catch(e){ toast("Lien expiré ou déjà utilisé : reconnectez-vous", "bad", "cross"); }
}
function netAskNewPassword(){
  sheet(`${sheetHead("Nouveau mot de passe")}
    <div class="tiny muted" style="margin-bottom:9px">Choisissez un nouveau mot de passe pour votre compte.</div>
    <input id="net-newpw" type="password" autocomplete="new-password" placeholder="8 caractères minimum">
    <button class="btn pri wide" style="margin-top:9px" data-act="netnewpw">Enregistrer</button>`, true);
}

/* ---------- resolution de conflit ---------- */
function netCompare(remote){
  const localRev = S.netRev || 0;
  if(!remote) return "push";
  if(remote.rev > localRev) return "pull";
  if(remote.rev < localRev) return "push";
  return "same";
}
function netSummary(payload){
  if(!payload) return "—";
  return `niv.${payload.level||"?"} · ${Object.keys(payload.dex||{}).length} espèces · `
       + `${(payload.integrity||0).toFixed(1)}% · ${(payload.stats&&payload.stats.catches)||0} captures`;
}

/* ============================================================
   ÉCRAN
   ============================================================ */
let NET_TAB = "compte";
let NET_AUTH_MODE = "signup";
let NET_BOARD = null, NET_BOARD_METRIC = "integrity";
/* repartition des factions parmi les archivistes affiches : la question de la
   faille recoit une reponse collective, visible de tous */
function netFactionTally(){
  if(!NET_BOARD || !NET_BOARD.length || typeof FACTIONS === "undefined") return "";
  const n = {}; let tot = 0;
  for(const r of NET_BOARD) if(r.faction && FACTIONS[r.faction]){ n[r.faction] = (n[r.faction]||0) + 1; tot++; }
  if(!tot) return "";
  return `<div class="panel tight" style="margin-top:9px">
    <div class="h sm">CE QUE RÉPONDENT LES ARCHIVISTES</div>
    ${Object.entries(FACTIONS).map(([k,f])=>`<div class="row between tiny" style="padding:2px 0">
      <span style="color:${f.c}">${esc(f.n)}</span>
      <b class="mono-num">${Math.round((n[k]||0)/tot*100)}%</b></div>
      <div class="bar thin"><i style="width:${(n[k]||0)/tot*100}%;background:${f.c}"></i></div>`).join("")}
  </div>`;
}
function netSetBoard(rows){ NET_BOARD = rows; }

function netStatusLine(){
  if(!Net.configured()) return `<span class="dim">non configuré</span>`;
  if(!Net.signedIn())   return `<span class="gold-t">configuré, non connecté</span>`;
  const e = Net.session.user && Net.session.user.email;
  return `<span class="ok">connecté</span> <span class="dim">${esc(e||"")}</span>`;
}

SCREENS.online = {
  html(){
    return `
      <div class="h">${ic("wave")} EN LIGNE ${infoBtn("online")}</div>
      <div class="sub">Sauvegarde distante, classements et échange de cartes. Entièrement facultatif :
        le jeu fonctionne à l'identique sans.</div>
      <div class="panel tight">
        <div class="row between tiny"><span class="muted">État</span><span>${netStatusLine()}</span></div>
        ${Net.lastError?`<div class="tiny bad" style="margin-top:4px">${esc(Net.lastError)}</div>`:""}
      </div>
      <div class="tabs">
        ${[["compte","Compte"],["sync","Sauvegarde"],["board","Classements"],["trade","Échanges"]]
          .map(([k,n])=>`<button class="${NET_TAB===k?"on":""}" data-act="nettab" data-t="${k}">${n}</button>`).join("")}
      </div>
      ${this[NET_TAB]()}`;
  },

  compte(){
    if(!Net.configured()) return `
      <div class="panel bracket">
        <div class="h sm">CONFIGURER LE SERVICE</div>
        <div class="tiny muted" style="margin-bottom:8px">Renseignez l'URL de votre projet Supabase et sa clé
          publique « anon ». Le schéma SQL à appliquer est fourni dans <b>sql/schema.sql</b> avec les sources.</div>
        <input id="net-url" type="text" placeholder="https://xxxx.supabase.co" value="${esc(Net.cfg.url||"")}">
        <input id="net-key" type="text" placeholder="clé publique (sb_publishable_… ou anon)" style="margin-top:7px" value="${esc(Net.cfg.key||"")}">
        <button class="btn pri wide" style="margin-top:9px" data-act="netsavecfg">Enregistrer</button>
        <div class="tiny dim" style="margin-top:7px">La clé anon est publique par conception : l'accès aux
          données est contrôlé par les politiques RLS, pas par le secret de la clé.</div>
      </div>`;

    if(!Net.signedIn()){
      const M = NET_AUTH_MODE;
      const tabs = [["signup","Créer un compte"],["signin","Se connecter"],["code","Code par e-mail"]];
      const mail = esc(S.netMail || "");
      let form;
      if(M === "signup") form = `
        <div class="tiny muted" style="margin-bottom:8px">Votre progression sera sauvegardée dans le cloud et
          récupérée automatiquement sur un autre appareil.</div>
        <input id="net-pseudo" type="text" maxlength="16" placeholder="Pseudo (affiché dans les classements)" value="${esc(S.name || "")}">
        <input id="net-mail" type="email" inputmode="email" autocomplete="email" placeholder="adresse@exemple.fr" value="${mail}" style="margin-top:7px">
        <input id="net-pw" type="password" autocomplete="new-password" placeholder="Mot de passe (8 caractères minimum)" style="margin-top:7px">
        <button class="btn pri wide" style="margin-top:9px" data-act="netsignup" ${Net.busy?"disabled":""}>${Net.busy?"Création…":"Créer mon compte"}</button>`;
      else if(M === "signin") form = `
        <input id="net-mail" type="email" inputmode="email" autocomplete="email" placeholder="adresse@exemple.fr" value="${mail}">
        <input id="net-pw" type="password" autocomplete="current-password" placeholder="Mot de passe" style="margin-top:7px">
        <button class="btn pri wide" style="margin-top:9px" data-act="netsignin" ${Net.busy?"disabled":""}>${Net.busy?"Connexion…":"Se connecter"}</button>
        <button class="btn ghost wide sm" style="margin-top:7px" data-act="netforgot">Mot de passe oublié</button>`;
      else form = `
        <div class="tiny muted" style="margin-bottom:8px">Sans mot de passe : un code à six chiffres vous est envoyé.</div>
        <input id="net-mail" type="email" inputmode="email" placeholder="adresse@exemple.fr" value="${mail}">
        <button class="btn wide" style="margin-top:8px" data-act="netcode" ${Net.busy?"disabled":""}>${Net.busy?"Envoi…":"Recevoir un code"}</button>
        <input id="net-otp" type="text" inputmode="numeric" placeholder="code à 6 chiffres" style="margin-top:9px">
        <button class="btn pri wide" style="margin-top:8px" data-act="netverify" ${Net.busy?"disabled":""}>Se connecter</button>`;
      return `
      <div class="segbar">${tabs.map(([k,n])=>`<button class="${M===k?"on":""}" data-act="netauthmode" data-m="${k}"><span>${n}</span></button>`).join("")}</div>
      <div class="panel bracket">${form}</div>
      <div class="panel">
        <div class="h sm">CHANGER DE SERVICE</div>
        <button class="btn ghost wide sm" data-act="netclearcfg">Modifier l'URL et la clé</button>
      </div>`;
    }

    const u = Net.session.user || {}, pseudo = (u.user_metadata && u.user_metadata.pseudo) || S.name;
    return `
      <div class="panel bracket">
        <div class="h sm">COMPTE</div>
        <div class="row between tiny"><span class="muted">Pseudo</span><b>${esc(pseudo || "—")}</b></div>
        <div class="row between tiny"><span class="muted">Adresse</span><b>${esc(u.email || "—")}</b></div>
        <div class="row between tiny"><span class="muted">Synchronisation</span><b>${esc(netSyncLabel().replace(/^Connecté · /, ""))}</b></div>
        <div class="row between tiny"><span class="muted">Révision</span><b class="mono-num">${S.netRev||0}</b></div>
      </div>
      <div class="btn-grid c2">
        <button class="btn pri" data-act="netsyncnow" ${Net.busy?"disabled":""}>Synchroniser</button>
        <button class="btn" data-act="netpwchange">Mot de passe</button>
      </div>
      <button class="btn dan wide" style="margin-top:8px" data-act="netsignout">Se déconnecter</button>
      <div class="tiny dim" style="margin-top:7px">La progression est envoyée toutes les 2 minutes quand elle change,
        quand vous quittez l'application et après chaque Brèche. La déconnexion ne supprime rien.</div>`;
  },

  sync(){
    if(!Net.signedIn()) return `<div class="empty">Connectez-vous pour synchroniser.</div>`;
    return `
      <div class="panel">
        <div class="h sm">SAUVEGARDE DISTANTE</div>
        <div class="tiny muted">La partie est envoyée automatiquement à intervalle régulier, et à chaque
          fois que vous quittez l'application. Les expéditions et parties de Poké-Poker en cours ne sont
          pas synchronisées : elles restent locales jusqu'à leur fin.</div>
        <div class="btn-grid c2" style="margin-top:9px">
          <button class="btn pri" data-act="netpush" ${Net.busy?"disabled":""}>Envoyer maintenant</button>
          <button class="btn" data-act="netpull" ${Net.busy?"disabled":""}>Récupérer</button>
        </div>
      </div>
      <div class="panel">
        <div class="h sm">RÉSOLUTION DE CONFLIT</div>
        <div class="tiny muted">Chaque envoi incrémente un numéro de révision. Si l'appareil distant a une
          révision supérieure, le jeu vous propose de récupérer plutôt que d'écraser. L'horloge des
          appareils n'entre pas en jeu.</div>
      </div>`;
  },

  board(){
    const metrics = [["integrity","Intégrité"],["dex_count","Pokédex"],["level","Niveau"],
                     ["shinies","Chromatiques"],["best_streak","Série"],["best_ante","Poké-Poker"],["tower","Tour"],
                     ["guardians","Verrous"],["breche_depth","Faille profonde"],["breche_clears","Brèches"]];
    return `
      <div class="chipbar">
        ${metrics.map(([k,n])=>`<button class="chip ${NET_BOARD_METRIC===k?"on":""}"
          data-act="netboard" data-m="${k}">${n}</button>`).join("")}
      </div>
      ${!Net.configured()
        ? `<div class="empty">Configurez le service pour consulter les classements.</div>`
        : NET_BOARD === null
          ? `<button class="btn wide" data-act="netboard" data-m="${NET_BOARD_METRIC}">Charger le classement</button>`
          : NET_BOARD.length === 0
            ? `<div class="empty">Aucune entrée pour l'instant. Envoyez votre sauvegarde pour y figurer.</div>`
            : `<div class="list">${NET_BOARD.map((r,i)=>{
                const me = r.user_id === Net.userId();
                const val = {integrity:r.integrity+"%", dex_count:r.dex_count+"/386", level:"niv."+r.level,
                  shinies:r.shinies, best_streak:r.best_streak, best_ante:"ante "+r.best_ante,
                  tower:"étage "+(r.tower||0), guardians:r.guardians+"/9"}[NET_BOARD_METRIC];
                return `<div class="item ${me?"on":""}">
                  <div class="lb-rank ${i<3?"top":""}">${i+1}</div>
                  <div class="grow"><div class="t">${esc(r.name||"Archiviste")}
                    ${me?'<span class="tiny cy">vous</span>':""}
                    ${r.tested?'<span class="tiny dim">test</span>':""}</div>
                    <div class="d">niv.${r.level} · ${r.dex_count} espèces · ${r.guardians}/9 verrous</div></div>
                  <b class="cy mono-num">${val}</b>
                </div>`;}).join("")}</div>${netFactionTally()}`}
      <div class="tiny dim" style="margin-top:8px">Les parties ayant utilisé le panneau de test sont
        signalées, pas exclues.</div>`;
  },

  trade(){
    if(!Net.signedIn()) return `<div class="empty">Connectez-vous pour échanger des cartes.</div>`;
    const owned = Object.keys(S.cards||{}).filter(k=>(S.cards[k].dup||0) > 0);
    return `
      <div class="panel">
        <div class="h sm">RECEVOIR UNE CARTE</div>
        <div class="tiny muted">Saisissez le code reçu d'un autre Archiviste.</div>
        <input id="net-claim" type="text" placeholder="CODE" style="margin-top:7px;text-transform:uppercase">
        <button class="btn pri wide" style="margin-top:8px" data-act="netclaim" ${Net.busy?"disabled":""}>
          Réclamer</button>
      </div>
      <div class="panel">
        <div class="h sm">PROPOSER UN DOUBLON</div>
        <div class="tiny muted" style="margin-bottom:8px">Seuls les exemplaires supplémentaires peuvent être
          proposés : votre meilleure carte de chaque espèce reste toujours dans votre collection.</div>
        ${owned.length
          ? `<div class="list">${owned.map(k=>{
              const e = S.cards[k];
              const sr = k.split(":")[0], sid = +k.split(":")[1];
              const nm = sr === "mn" ? "Sans index" : POKE[sid].name;
              return `<div class="shopitem">
                ${cardArt(sr, sid, "mini")}
                <div class="grow"><div>${esc(nm)}</div>
                  <div class="tiny" style="color:${CARD_SERIES_DEF[sr].c}">
                    ${esc(seriesName(sr))} · ${e.dup} en double</div></div>
                <button class="btn sm" data-act="netoffer" data-id="${esc(k)}" ${Net.busy?"disabled":""}>Proposer</button>
              </div>`;}).join("")}</div>`
          : `<div class="empty">Aucun doublon disponible.</div>`}
      </div>
      <button class="btn ghost wide sm" data-act="netoffers">Voir mes propositions en cours</button>`;
  }
};

/* ---------- actions ---------- */
ACTIONS.nettab = d => { NET_TAB = d.t; Net.lastError = null; refresh(); };
ACTIONS.netsavecfg = () => {
  const url = document.getElementById("net-url")?.value || "";
  const key = document.getElementById("net-key")?.value || "";
  if(!/^https?:\/\/.+/.test(url.trim())){ toast("URL invalide", "bad", "cross"); return; }
  if(key.trim().length < 20){ toast("Clé invalide", "bad", "cross"); return; }
  Net.setCfg(url, key);
  toast("Service configuré", "", "check");
  refresh();
};
ACTIONS.netclearcfg = () => { Net.setCfg("", ""); Net.signOut(); refresh(); };

async function netRun(fn, okMsg){
  Net.busy = true; Net.lastError = null; refresh();
  try {
    const r = await fn();
    if(okMsg) toast(okMsg, "", "check");
    return r;
  } catch(e){
    Net.lastError = e.message || String(e);
    toast(Net.lastError, "bad", "cross");
    return null;
  } finally {
    Net.busy = false; refresh();
  }
}
ACTIONS.netcode = () => {
  const mail = (document.getElementById("net-mail")?.value || "").trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)){ toast("Adresse invalide", "bad", "cross"); return; }
  S.netMail = mail; saveSoon();
  netRun(()=>Net.requestCode(mail), "Code envoyé — vérifiez vos courriels");
};
ACTIONS.netverify = () => {
  const mail = (document.getElementById("net-mail")?.value || S.netMail || "").trim();
  const otp  = (document.getElementById("net-otp")?.value || "").trim();
  if(!otp){ toast("Saisissez le code", "bad", "cross"); return; }
  netRun(async ()=>{
    await Net.verifyCode(mail, otp);
    await netSyncSmart("login");
  }, "Connecté");
};
ACTIONS.netsignout = () => { Net.signOut(); NET_CONFLICT = false; toast("Déconnecté", "", "check"); refresh(); };
ACTIONS.netauthmode = d => { NET_AUTH_MODE = d.m; refresh(); };
function netForm(){
  const v = id => (document.getElementById(id)?.value || "").trim();
  return {mail: v("net-mail"), pw: document.getElementById("net-pw")?.value || "", pseudo: v("net-pseudo")};
}
ACTIONS.netsignup = () => {
  const f = netForm();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.mail)){ toast("Adresse invalide", "bad", "cross"); return; }
  if(f.pw.length < 8){ toast("Mot de passe : 8 caractères minimum", "bad", "cross"); return; }
  if(f.pseudo){ S.name = f.pseudo.slice(0, 16); }
  S.netMail = f.mail; saveSoon();
  netRun(async ()=>{
    const r = await Net.signUp(f.mail, f.pw, S.name);
    if(r.session){ toast("Compte créé — vous êtes connecté", "", "check"); await netSyncSmart("login"); pwaAfterAuth(); }
    else {
      NET_AUTH_MODE = "signin";
      sheet(`${sheetHead("Confirmez votre adresse")}
        <div class="tiny muted">Un e-mail de confirmation vient d'être envoyé à <b>${esc(f.mail)}</b>.
          Ouvrez le lien qu'il contient : vous reviendrez dans le jeu, connecté.</div>
        <button class="btn pri wide" style="margin-top:10px" data-act="closesheet">Compris</button>`, true);
    }
  });
};
ACTIONS.netsignin = () => {
  const f = netForm();
  if(!f.mail || !f.pw){ toast("E-mail et mot de passe requis", "bad", "cross"); return; }
  S.netMail = f.mail; saveSoon();
  netRun(async ()=>{ await Net.signIn(f.mail, f.pw); await netSyncSmart("login"); pwaAfterAuth(); }, "Connecté");
};
ACTIONS.netforgot = () => {
  const f = netForm();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.mail)){ toast("Saisissez d'abord votre adresse", "bad", "cross"); return; }
  netRun(()=>Net.recover(f.mail), "E-mail envoyé — suivez le lien pour choisir un nouveau mot de passe");
};
ACTIONS.netpwchange = () => netAskNewPassword();
ACTIONS.netnewpw = () => {
  const pw = document.getElementById("net-newpw")?.value || "";
  if(pw.length < 8){ toast("8 caractères minimum", "bad", "cross"); return; }
  closeSheet();
  netRun(async ()=>{ await Net.setPassword(pw); await netSyncSmart("login"); }, "Mot de passe enregistré");
};
ACTIONS.netsyncnow = () => netRun(()=>netSyncSmart("manual"), "Synchronisé");
ACTIONS.netpush = () => netRun(async ()=>{
  const remote = await Net.pull();
  if(netCompare(remote) === "pull"){ netAskPull(remote); return; }
  await Net.push();
}, "Sauvegarde envoyée");
ACTIONS.netpull = () => netRun(async ()=>{
  const remote = await Net.pull();
  if(!remote){ toast("Aucune sauvegarde distante", "bad", "cross"); return; }
  netAskPull(remote, true);
});

function netAskPull(remote, manual){
  sheet(`${sheetHead("Sauvegarde distante plus récente")}
    <div class="tiny muted" style="margin-bottom:9px">
      ${manual ? "Vous avez demandé à récupérer la sauvegarde distante."
               : "Cet appareil et le cloud ont tous deux progressé depuis la dernière synchronisation."}
      Choisissez celle à conserver — l'autre sera écrasée.</div>
    <div class="panel tight">
      <div class="h sm">LOCALE — révision ${S.netRev||0}</div>
      <div class="tiny">${esc(netSummary(S))}</div>
    </div>
    <div class="panel tight">
      <div class="h sm">DISTANTE — révision ${remote.rev}</div>
      <div class="tiny">${esc(netSummary(remote.payload))}</div>
    </div>
    <div class="btn-grid c2" style="margin-top:9px">
      <button class="btn" data-act="netkeeplocal">Garder la locale</button>
      <button class="btn pri" data-act="netkeepremote">Prendre la distante</button>
    </div>`);
  Net._pending = remote;
}
ACTIONS.netkeeplocal = () => {
  closeSheet(); NET_CONFLICT = false;
  const r = Net._pending;
  S.netRev = (r ? r.rev : (S.netRev||0)) + 1;
  netRun(()=>Net.push(true), "Sauvegarde locale envoyée");
};
ACTIONS.netkeepremote = () => {
  closeSheet(); NET_CONFLICT = false;
  const r = Net._pending;
  if(!r || !r.payload) return;
  netApplyRemote(r);
  toast("Sauvegarde distante restaurée", "", "check");
  go("capture");
};
ACTIONS.netboard = d => {
  NET_BOARD_METRIC = d.m;
  netRun(async ()=>{ NET_BOARD = await Net.leaderboard(d.m, 25) || []; });
};
ACTIONS.netoffer = d => {
  const k = d.id, e = S.cards[k];
  if(!e || !(e.dup > 0)) return;
  netRun(async ()=>{
    const r = await Net.offerCard(k);
    const code = (Array.isArray(r) ? r[0] : r);
    const value = code && (code.code || code);
    e.dup--; save();
    sheet(`${sheetHead("Code d'échange")}
      <div class="tiny muted" style="margin-bottom:8px">Transmettez ce code. Il ne peut être réclamé
        qu'une seule fois.</div>
      <div class="tradecode">${esc(value)}</div>
      <button class="btn wide" style="margin-top:10px" data-act="closesheet">Fermer</button>`, true);
  });
};
ACTIONS.netclaim = () => {
  const code = (document.getElementById("net-claim")?.value || "").trim();
  if(!code){ toast("Saisissez un code", "bad", "cross"); return; }
  netRun(async ()=>{
    const r = await Net.claimCard(code);
    const row = Array.isArray(r) ? r[0] : r;
    if(!row || !row.series || !row.species){ throw new Error("Code inconnu ou déjà utilisé"); }
    const srz = row.series;
    const fresh = grantCardV(srz, row.species);
    save();
    closeSheet();
    showCardWin(srz, row.species, fresh);
  });
};
ACTIONS.netoffers = () => netRun(async ()=>{
  const rows = await Net.myOffers() || [];
  sheet(`${sheetHead("Mes propositions")}
    ${rows.length ? `<div class="list">${rows.map(r=>{
      const srz = r.series || "art";
      return `<div class="item">
        ${cardArt(srz, r.species, "mini")}
        <div class="grow"><div class="t">${esc(POKE[r.species] ? POKE[r.species].name : "—")}</div>
          <div class="d">${esc(CARD_SERIES_DEF[srz].n)} · ${r.claimed_by ? "réclamée" : "en attente"}</div></div>
        <span class="tradecode sm">${esc(r.code)}</span></div>`;}).join("")}</div>`
      : `<div class="empty">Aucune proposition.</div>`}`);
});

/* ---------- synchronisation automatique ---------- */
let netAutoTimer = null;
function netAutoSync(){
  if(!Net.signedIn() || Net.busy) return;
  netSyncSmart("auto");
}
function netStart(){
  Net.load();
  clearInterval(netAutoTimer);
  netAutoTimer = setInterval(netAutoSync, 2*60*1000);
  if(typeof document !== "undefined" && !netStart.bound){
    netStart.bound = true;
    /* en quittant l'application (onglet masque, telephone verrouille) : on envoie */
    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden && Net.signedIn() && netDirty() && !NET_CONFLICT) netSyncSmart("leaving");
    });
  }
  netHandleAuthLink();
  if(Net.signedIn()) setTimeout(()=>netSyncSmart("start"), 1500);
}
