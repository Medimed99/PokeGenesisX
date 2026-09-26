/* ============================================================
   79 — ARCHITECTURE DE L'INTERFACE
   Le hub des modules etait devenu un inventaire : onze entrees,
   dans un ordre qui n'etait pas celui du deblocage, et des
   descriptions qui devoilaient ce que le joueur n'avait pas encore
   trouve. Le profil, lui, cachait la personnalisation et la
   collection de cartes derriere des onglets qu'on ne voyait pas.

   Principe retenu : chaque chose est rangee la ou on la cherche.
   · le HUB ne garde que les activites, dans l'ordre ou elles s'ouvrent ;
   · la COLLECTION regroupe Pokedex, Recherche, Cartes, Couveuse ;
   · le SAC accueille la Boutique ;
   · AUJOURD'HUI absorbe le cadeau quotidien et les quetes ;
   · le PROFIL est un bandeau : on le touche, on le personnalise.
   ============================================================ */

/* ---------- le hub : les activités, dans l'ordre d'ouverture ---------- */
const ACTIVITIES = [
  {k:"idle", n:"Le Forage", i:"bolt", go:"idle",
   d:"Frapper la sphère, descendre de strate en strate, lancer la capture autonome.",
   st:()=>`${fmt(Math.round(forageRate()*10)/10)} Énergie / s · strate ${forage().depth + 1}`,
   alert:()=>forage().vein > Date.now() || (typeof botReady === "function" && botReady())},
  {k:"expedition", n:"Expédition", i:"map", go:"expedition",
   d:"Douze étages, une route qu'on ne refait pas — ou la Tour, sans fin.",
   st:()=>S.expedition ? "Parcours en cours" : `${S.stats.expWins} parcours bouclés`,
   alert:()=>!!S.expedition, fw:"expedition"},
  {k:"breche", n:"La Brèche", i:"boss", go:"breche",
   d:"Tenir huit minutes face à la faille. Vos Pokémon attaquent seuls, vous choisissez.",
   st:()=>{ const b = brState(); return b.runs ? `${b.clears} refermée(s) · ${S.bosses.length} / 9 verrous` : "Jamais ouverte"; },
   alert:()=>brState().daily.day !== today() && moduleUnlocked("breche"), fw:"boss"},
  {k:"poker", n:"Poké-Poker", i:"cards", go:"poker",
   d:"Composer des mains de Pokémon, empiler des programmes.",
   st:()=>S.poker ? `Ante ${S.poker.ante} en cours` : `Meilleure ante ${S.pokerMeta.bestAnte||0}`,
   alert:()=>!!S.poker, fw:"poker"}
];
SCREENS.modules = {
  html(){
    const open = ACTIVITIES.filter(m=>moduleUnlocked(m.k));
    const locked = ACTIVITIES.filter(m=>!moduleUnlocked(m.k));
    const next = locked[0];
    const pend = todayPending();
    return `
      <div class="todaycard" data-act="goto" data-to="today">
        <div class="td-ic">${ic("quest")}</div>
        <div class="grow"><div class="td-n">Aujourd'hui</div>
          <div class="td-d">${pend ? pend + " chose(s) vous attendent" : "Cadeau, quêtes, contrats : tout est à jour"}</div></div>
        ${pend ? `<span class="badge">${pend}</span>` : ""}${ic("arrow")}
      </div>
      ${directiveCard()}
      <div class="h">${ic("grid")} ACTIVITÉS</div>
      <div class="list">
        ${open.map(m=>{
          const al = typeof m.alert === "function" ? m.alert() : m.alert;
          return `<div class="modcard" data-act="goto" data-to="${m.go}">
            <div class="ic">${ic(m.i)}</div>
            <div class="grow"><div class="t">${esc(m.n)}</div>
              <div class="d">${esc(m.d)}</div>
              <div class="tiny cy">${esc(m.st())}${m.fw ? firstWinBadge(m.fw) : ""}</div></div>
            ${al ? '<i class="badge" style="position:static"></i>' : ic("arrow")}
          </div>`;}).join("")}
        ${next ? `<div class="modcard locked nextroom">
            <div class="ic">${ic("lock")}</div>
            <div class="grow"><div class="t">Salle suivante</div>
              <div class="lockmsg">S'ouvre à : ${esc(MODULE_REQ[next.k].d)}</div></div>
          </div>` : ""}
      </div>
      ${locked.length > 1 ? `<div class="tiny dim" style="text-align:center;margin-top:8px">
        + ${locked.length - 1} autre(s) salle(s) à découvrir</div>` : ""}`;
  }
};

/* ---------- barres d'onglets : Collection, Sac ---------- */
function segBar(items, active){
  return `<div class="segbar">${items.map(x=>`
    <button class="${x.k === active ? "on" : ""}" data-act="goto" data-to="${x.k}">
      ${ic(x.i)}<span>${esc(x.n)}</span>${x.alert ? '<i class="badge"></i>' : ""}</button>`).join("")}</div>`;
}
function collectionTabs(active){
  const items = [
    {k:"dex", n:"Pokédex", i:"dex"},
    {k:"research", n:"Recherche", i:"eye"},
    {k:"cards", n:"Cartes", i:"cards"}
  ];
  if(moduleUnlocked("eggs")) items.push({k:"eggs", n:"Couveuse", i:"box",
    alert: eggState().inc.some(x=>x.steps >= EGG_TIERS[x.tier].steps)});
  return segBar(items, active);
}
function bagTabs(active){
  return segBar([{k:"bag", n:"Sac", i:"box"}, {k:"shop", n:"Boutique", i:"shop"}], active);
}
/* on greffe les barres sans toucher aux ecrans eux-memes */
function withTabs(keys, bar){
  for(const k of keys){
    const sc = SCREENS[k];
    if(!sc || sc._tabbed) continue;
    const orig = sc.html;
    sc.html = function(){ return bar(k) + orig.apply(this, arguments); };
    sc._tabbed = true;
  }
}
withTabs(["dex", "research", "cards", "eggs"], collectionTabs);
withTabs(["bag", "shop"], bagTabs);

/* ---------- le bandeau de profil ---------- */
function heroFxCls(){
  const f = S.cos.fx;
  return (f && f !== "fx_none" && COSMETICS[f]) ? "has-" + f.replace("fx_", "fx") : "";
}
function heroFxLayer(fx){
  const f = fx || S.cos.fx;
  if(!f || f === "fx_none" || !COSMETICS[f]) return "";
  if(typeof FX_LAYERS !== "undefined" && FX_LAYERS[f]) return FX_LAYERS[f]();
  if(f === "fx_prism")  return `<span class="fxl fx-prism"></span>`;
  if(f === "fx_stream") return `<span class="fxl fx-stream">
    ${Array.from({length:14},(_,i)=>`<i style="--x:${(i*7.4+3).toFixed(1)}%;--d:${(i%5)*0.7}s;--s:${(2.4+(i%4)*0.6)}s"></i>`).join("")}</span>`;
  if(f === "fx_cards")  return `<span class="fxl fx-cards">
    ${Array.from({length:7},(_,i)=>`<i style="--x:${(i*14+6)}%;--d:${i*0.55}s;--r:${(i%2?1:-1)*18}deg"></i>`).join("")}</span>`;
  return "";
}
function heroHtml(clickable){
  const frame = COSMETICS[S.cos.frame] || {cls:""};
  const bg = COSMETICS[S.cos.bg] || {};
  const title = COSMETICS[S.cos.title] || {n:""};
  const need = xpForLevel(S.level), pct = S.xp / need;
  return `<div class="hero ${heroFxCls()} ${clickable ? "tappable" : ""}"
      style="background:${bg.css || "linear-gradient(180deg,var(--s2),var(--s1))"}"
      ${clickable ? 'data-act="goto" data-to="atelier"' : ""}>
    ${heroFxLayer()}
    <div class="row" style="gap:12px;position:relative;z-index:2">
      <div class="avatar ${frame.cls || ""}">${avatarHtml(60)}</div>
      <div class="grow">
        <div class="hero-name">${esc(S.name)}</div>
        <div class="tiny cy">${esc(title.n)}</div>
        <div class="row between tiny muted" style="margin-top:6px">
          <span>Niveau ${S.level}</span><span class="mono-num">${fmt(S.xp)} / ${fmt(need)}</span></div>
        <div class="bar xp" style="margin-top:3px"><i style="width:${(pct*100).toFixed(1)}%"></i></div>
      </div>
    </div>
    ${clickable ? `<span class="hero-edit ${S.flags.atelierSeen ? "" : "fresh"}">${ic("gear")} Personnaliser</span>` : ""}
  </div>`;
}

/* ---------- profil : un bandeau, un menu ---------- */
const OLD_PROFILE = SCREENS.profile;
SCREENS.profile = {
  html(){
    const achN = S.ach.length, achT = ACHIEVEMENTS.length;
    const row = (to, i, n, d, extra) => `<div class="modcard" data-act="goto" data-to="${to}">
        <div class="ic">${ic(i)}</div>
        <div class="grow"><div class="t">${esc(n)}</div><div class="d">${d}</div></div>
        ${extra || ic("arrow")}</div>`;
    return `
      ${heroHtml(true)}
      <div class="tiles c3" style="margin:10px 0">
        <div class="tile accent"><div class="k">Pokédex</div><div class="v">${dexTotal()}</div></div>
        <div class="tile gold"><div class="k">Chromatiques</div><div class="v">${Object.values(S.dex).filter(e=>e.shiny).length}</div></div>
        <div class="tile"><div class="k">Cartes</div><div class="v">${cardOwnedCount()}</div></div>
      </div>
      <div class="list">
        ${row("atelier", "star", "Personnaliser", "Nom, avatar, titre, cadre, fond et effet.")}
        ${row("cards", "cards", "Collection de cartes", `${cardOwnedCount()} illustration(s) sur ${cardTotal()}`)}
        ${row("succes", "trophy", "Succès", `${achN} / ${achT} obtenus`)}
        ${row("stats", "eye", "Statistiques", "Captures, chaînes, records.")}
        ${row("journal", "quest", "Journal", "Les scènes, les fragments, la faille.")}
        ${row("online", "wave", "Espace en ligne", Net.signedIn() ? "Connecté" : "Facultatif — sauvegarde, classements, échanges")}
        ${(cycleReady() || cycleN()) ? row("cycle", "star", "Nouveau Cycle", cycleN() ? `Cycle ${cycleN() + 1}` : "Disponible") : ""}
        ${row("settings", "gear", "Réglages", "Sons, vibrations, sauvegarde, outils de test.")}
      </div>
      ${S.flags.testUsed ? `<div class="tiny vi" style="margin-top:8px;text-align:center">
        Cette partie a utilisé les outils de test.</div>` : ""}`;
  }
};
/* les anciens contenus restent, chacun sur son propre ecran */
SCREENS.stats    = {html(){ return backBar("profile") + `<div class="h">${ic("eye")} STATISTIQUES</div>` + OLD_PROFILE.stats.call(OLD_PROFILE); }};
SCREENS.succes   = {html(){ return backBar("profile") + `<div class="h">${ic("trophy")} SUCCÈS</div>` + OLD_PROFILE.ach.call(OLD_PROFILE); }};
SCREENS.settings = {html(){ return backBar("profile") + `<div class="h">${ic("gear")} RÉGLAGES</div>` + OLD_PROFILE.set.call(OLD_PROFILE); }};
function backBar(to){
  return `<button class="backbar" data-act="goto" data-to="${to}">${ic("arrow")} Retour</button>`;
}

/* ---------- l'atelier ----------
   Tout ce qui se personnalise, au meme endroit, avec l'apercu en direct.
   Les pieces non obtenues ne sont pas nommees : on les compte seulement. */
let ATELIER_TAB = "avatar";
const ATELIER_TABS = [
  {k:"name", n:"Nom", i:"user"}, {k:"avatar", n:"Avatar", i:"star"},
  {k:"title", n:"Titre", i:"trophy"}, {k:"frame", n:"Cadre", i:"grid"},
  {k:"bg", n:"Fond", i:"eye"}, {k:"fx", n:"Effet", i:"bolt"}
];
SCREENS.atelier = {
  after(){ if(!S.flags.atelierSeen){ S.flags.atelierSeen = true; saveSoon(); } },
  html(){
    return `${backBar("profile")}
      <div class="h">${ic("star")} ATELIER</div>
      <div class="sub">L'aperçu change en direct. Rien n'est à valider.</div>
      <div class="atelier-preview">${heroHtml(false)}</div>
      <div class="atelier-tabs">${ATELIER_TABS.map(t=>`
        <button class="${ATELIER_TAB === t.k ? "on" : ""}" data-act="atab" data-t="${t.k}">
          ${ic(t.i)}<span>${t.n}</span></button>`).join("")}</div>
      ${this[ATELIER_TAB]()}`;
  },
  name(){
    return `<div class="panel">
      <div class="h sm">IDENTIFIANT D'ARCHIVISTE</div>
      <input id="nm-in" class="field" maxlength="16" value="${esc(S.name)}" autocomplete="off">
      <button class="btn pri wide" style="margin-top:9px" data-act="atname">Enregistrer</button>
      <div class="tiny dim" style="margin-top:7px">Seize caractères au plus. Certains noms, le système les
        connaît déjà.</div></div>`;
  },
  avatar(){
    const pool = avatarPool(), cur = avatarKey();
    if(!pool.length) return `<div class="empty">Archivez d'abord une espèce.</div>`;
    const groups = {};
    for(const a of pool) (groups[a.g] = groups[a.g] || []).push(a);
    return Object.entries(groups).map(([g, list])=>{
      const got = list.filter(x=>!x.locked), hidden = list.length - got.length;
      return `<div class="h sm" style="margin-top:9px">${esc(g.toUpperCase())}
          <span class="tiny dim">${got.length}/${list.length}</span></div>
        <div class="avgrid">${got.slice(0, 80).map(a=>`
          <div class="avcell ${cur === a.k ? "on" : ""}" data-act="setavatar" data-k="${a.k}" title="${esc(a.n)}">
            ${a.k === "pz" ? pzFace(pzMood(), 42)
              : a.k === "mn" ? `<span class="spr missing" style="width:42px;height:42px"></span>`
              : `<span class="sprbox" style="width:42px;height:42px">${sprite(a.id, !!a.shiny, "")}</span>`}
            <span class="avnm">${esc(a.n)}</span></div>`).join("")}
          ${hidden ? `<div class="avcell locked"><span class="avunknown">+${hidden}</span>
            <span class="avnm">à découvrir</span></div>` : ""}</div>`;
    }).join("");
  },
  cosGrid(t){
    const key = t;
    const list = Object.entries(COSMETICS).filter(([,c])=>c.t === t);
    const got = list.filter(([id])=>S.cos.owned.includes(id));
    const hidden = list.length - got.length;
    const tile = ([id, c]) => {
      const on = S.cos[key] === id;
      let vis;
      if(t === "title") vis = `<span class="ct-title">${esc(c.n)}</span>`;
      else if(t === "frame") vis = `<span class="avatar ${c.cls || ""}" style="width:46px;height:46px">${avatarHtml(34)}</span>`;
      else if(t === "bg") vis = `<span class="ct-swatch" style="background:${c.css || "linear-gradient(180deg,var(--s2),var(--s1))"}"></span>`;
      else vis = `<span class="ct-swatch fxdemo ${id === "fx_none" ? "" : "has-" + id.replace("fx_","fx")}">${heroFxLayer(id)}</span>`;
      return `<div class="cotile ${on ? "on" : ""} ${t === "title" ? "wide" : ""}" data-act="setcos" data-k="${key}" data-id="${id}">
        ${vis}${t === "title" ? "" : `<span class="ct-n">${esc(c.n)}</span>`}</div>`;
    };
    return `<div class="cogrid ${t === "title" ? "titles" : ""}">${got.map(tile).join("")}
      ${hidden ? `<div class="cotile locked ${t === "title" ? "wide" : ""}"><span class="avunknown">+${hidden}</span>
        <span class="ct-n">à débloquer</span></div>` : ""}</div>`;
  },
  title(){ return this.cosGrid("title"); },
  frame(){ return this.cosGrid("frame"); },
  bg(){ return this.cosGrid("bg"); },
  fx(){ return this.cosGrid("fx"); }
};
ACTIONS.atab = d => { ATELIER_TAB = d.t; refresh(); };
ACTIONS.atname = () => {
  const v = (document.getElementById("nm-in")?.value || "").trim();
  if(!v) return;
  S.name = v.slice(0, 16);
  checkNameSecret();
  save(); refresh();
  toast("Nom enregistré", "", "check");
};

/* ---------- l'outil de test demande un mot de passe ----------
   Seule son empreinte est stockee. C'est une barriere contre l'activation
   par megarde, pas une securite : le code du jeu s'execute chez le joueur,
   et un joueur determine peut toujours le modifier. */
/* empreinte FNV-1a du mot de passe, sensible a la casse */
let ADMIN_PENDING = false;
const ADMIN_HASH = "cf6f50b9";
function adminHash(v){
  let h = 0x811c9dc5;
  for(let i = 0; i < v.length; i++){ h ^= v.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}
ACTIONS.adminpass = () => {
  sheet(`${sheetHead("Outils de test")}
    <div class="tiny muted" style="margin-bottom:9px">Mot de passe requis.</div>
    <input id="adm-pw" class="field" type="password" autocomplete="off">
    <button class="btn pri wide" style="margin-top:9px" data-act="adminpassok">Déverrouiller</button>`, true);
  setTimeout(()=>document.getElementById("adm-pw")?.focus(), 80);
};
ACTIONS.adminpassok = () => {
  const v = document.getElementById("adm-pw")?.value || "";
  if(adminHash(v) !== ADMIN_HASH){
    toast("Mot de passe incorrect", "bad", "cross"); return;
  }
  S.settings.admin = true;
  ADMIN_OK = true;
  closeSheet(); save(); refresh();
  if(ADMIN_PENDING){ ADMIN_PENDING = false; ACTIONS.admopen(); return; }
  toast("Panneau de test activé", "warn", "gear");
};
