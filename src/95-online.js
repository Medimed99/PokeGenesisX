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
    if(opts.auth !== false && this.signedIn())
      headers["Authorization"] = "Bearer " + this.session.access_token;
    else if(opts.auth !== false)
      headers["Authorization"] = "Bearer " + this.cfg.key;

    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(()=>ctrl.abort(), opts.timeout || 15000) : null;
    let res;
    try {
      res = await fetch(this.cfg.url + path, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: ctrl ? ctrl.signal : undefined
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
      throw new Error(msg);
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
  signOut(){ this.saveSession(null); this.profile = null; },

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
    const rev = (S.netRev || 0) + 1;
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
      tested: !!S.flags.testUsed
    };
    await this.call("/rest/v1/saves?on_conflict=user_id", {
      method:"POST",
      headers:{ "Prefer": force ? "resolution=merge-duplicates" : "resolution=merge-duplicates" },
      body:[body]
    });
    S.netRev = rev;
    saveSoon();
    return rev;
  },

  /* ---------- classements ---------- */
  async leaderboard(metric, limit){
    const cols = "name,level,integrity,dex_count,shinies,best_streak,best_ante,guardians,cards,tower,faction,tested,user_id";
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
        <input id="net-key" type="text" placeholder="clé anon" style="margin-top:7px" value="${esc(Net.cfg.key||"")}">
        <button class="btn pri wide" style="margin-top:9px" data-act="netsavecfg">Enregistrer</button>
        <div class="tiny dim" style="margin-top:7px">La clé anon est publique par conception : l'accès aux
          données est contrôlé par les politiques RLS, pas par le secret de la clé.</div>
      </div>`;

    if(!Net.signedIn()) return `
      <div class="panel bracket">
        <div class="h sm">CONNEXION</div>
        <div class="tiny muted" style="margin-bottom:8px">Un code à six chiffres vous est envoyé par courriel.
          Aucun mot de passe n'est stocké.</div>
        <input id="net-mail" type="text" inputmode="email" placeholder="adresse@exemple.fr"
          value="${esc(S.netMail||"")}">
        <button class="btn wide" style="margin-top:8px" data-act="netcode" ${Net.busy?"disabled":""}>
          ${Net.busy?"Envoi…":"Recevoir un code"}</button>
        <hr class="sep">
        <input id="net-otp" type="text" inputmode="numeric" placeholder="code à 6 chiffres">
        <button class="btn pri wide" style="margin-top:8px" data-act="netverify" ${Net.busy?"disabled":""}>
          Se connecter</button>
      </div>
      <div class="panel">
        <div class="h sm">CHANGER DE SERVICE</div>
        <button class="btn ghost wide sm" data-act="netclearcfg">Modifier l'URL et la clé</button>
      </div>`;

    return `
      <div class="panel bracket">
        <div class="h sm">COMPTE</div>
        <div class="row between tiny"><span class="muted">Adresse</span>
          <b>${esc((Net.session.user&&Net.session.user.email)||"—")}</b></div>
        <div class="row between tiny"><span class="muted">Révision locale</span>
          <b class="mono-num">${S.netRev||0}</b></div>
        <div class="row between tiny"><span class="muted">Identifiant public</span>
          <b class="tiny dim">${esc((Net.userId()||"").slice(0,8))}</b></div>
      </div>
      <button class="btn dan wide" data-act="netsignout">Se déconnecter</button>
      <div class="tiny dim" style="margin-top:7px">La déconnexion ne supprime rien : la partie locale
        et la sauvegarde distante restent intactes.</div>`;
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
                     ["guardians","Verrous"]];
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
    const remote = await Net.pull();
    const verdict = netCompare(remote);
    if(verdict === "pull" && remote) netAskPull(remote);
    else await Net.push();
  }, "Connecté");
};
ACTIONS.netsignout = () => { Net.signOut(); toast("Déconnecté", "", "check"); refresh(); };
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
               : "La sauvegarde distante porte une révision supérieure à la vôtre."}
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
  closeSheet();
  const r = Net._pending;
  S.netRev = (r ? r.rev : (S.netRev||0)) + 1;
  netRun(()=>Net.push(true), "Sauvegarde locale envoyée");
};
ACTIONS.netkeepremote = () => {
  closeSheet();
  const r = Net._pending;
  if(!r || !r.payload) return;
  S = deepFill(r.payload, newState());
  S.netRev = r.rev;
  save(); applyCorruption();
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
  Net.push().catch(()=>{});
}
function netStart(){
  Net.load();
  clearInterval(netAutoTimer);
  netAutoTimer = setInterval(netAutoSync, 5*60*1000);
}
