/* ============================================================
   30c — LES POKÉMON DES ONZE
   Onze archivistes sont passés avant toi. Chacun a laissé une page,
   et un Pokémon à qui il avait donné un surnom. Une fois la page
   trouvée, ce Pokémon finit par réapparaître dans une rencontre
   ordinaire : il a gardé son surnom. Porygon-Z le reconnaît sans
   savoir pourquoi. Capturé, il garde son surnom au Pokédex et dans
   l'équipe, avec ce qui reste de son archiviste : une phrase.
   À la révélation, on comprend qui leur avait donné ces noms.
   Ils ne fuient jamais, et se capturent sans peine : ils sont
   revenus d'eux-mêmes.
   ============================================================ */
const ONZE = [
  {c:1,  id:19,  nick:"VITEFAIT",
   mem:"Premier jour, premier Rattata. Je l'ai appelé Vitefait. Dans deux semaines, on aura fini, lui et moi.",
   seen:"Ce Rattata a un surnom : VITEFAIT. Personne ne donne de surnoms, ici. Personne d'ici.",
   got:"Deux semaines, qu'il disait. Le Rattata, lui, a attendu beaucoup plus longtemps."},
  {c:2,  id:43,  nick:"MINUIT",
   mem:"Il ne sort que la nuit. J'ai mis six semaines à comprendre. Je l'ai appelé Minuit, et j'ai glissé une page dans son collier, pour la suite.",
   seen:"Un Mystherbe avec un collier. Il s'appelle MINUIT. Il y avait une page dedans, avant.",
   got:"Son collier est vide. Je crois qu'il attendait de te rendre la page."},
  {c:3,  id:54,  nick:"MIGRAINE",
   mem:"Il a mal à la tête, encore. Moi aussi. Je l'appelle Migraine. C'est le seul qui me fait rire, en ce moment.",
   seen:"Il se tient la tête. Il s'appelle MIGRAINE. Quelqu'un riait, à cause de lui.",
   got:"Il a encore mal à la tête. Ça me fait rire. Je ne sais pas pourquoi ça me fait aussi un peu mal."},
  {c:4,  id:50,  nick:"PIOCHE",
   mem:"C'est Pioche qui a trouvé la couche du dessous. Il creusait plus vite que moi. Depuis, il refuse d'y retourner.",
   seen:"Il sort d'une fouille. Il s'appelle PIOCHE. Il regarde le sol comme s'il savait ce qu'il y a dessous.",
   got:"Il a creusé jusqu'à toi. Il ne retournera pas en bas. Moi non plus, si on peut éviter."},
  {c:5,  id:58,  nick:"BRAISE",
   mem:"Le campement est froid depuis longtemps. Braise dort contre le feu éteint, comme s'il attendait quelqu'un d'avant moi.",
   seen:"Un Caninos qui sent le feu de camp. Il s'appelle BRAISE. Un feu éteint depuis très longtemps.",
   got:"Il s'est couché contre toi tout de suite. Comme quelqu'un qui retrouve quelqu'un."},
  {c:6,  id:4,   nick:"TOUJOURS",
   mem:"Un Salamèche, encore. Je l'ai appelé Toujours. Je ne sais pas pourquoi le nom m'est venu si vite.",
   seen:"Un Salamèche. Il s'appelle TOUJOURS. Je n'aime pas ce surnom. Il a l'air de savoir quelque chose.",
   got:"Toujours. Je n'aime toujours pas ce surnom. Mais il lui va bien. Il te va bien aussi, je crois."},
  {c:7,  id:16,  nick:"PLUME",
   mem:"Plume a porté mes lettres jusqu'aux portes, une par légendaire. Il revenait sans réponse. Ils sont restés quand même.",
   seen:"Un Roucool avec un bout de lettre dans le bec. Il s'appelle PLUME. La lettre est adressée à un verrou.",
   got:"La lettre qu'il tenait était pour un verrou. Elle dit « merci ». Rien d'autre."},
  {c:8,  id:92,  nick:"MURMURE",
   mem:"Murmure ne dit rien, mais il répète. Les mêmes sons, dans le même ordre, comme la faille. Je crois qu'il essaie de me prévenir.",
   seen:"Un Fantominus qui répète des octets, toujours dans le même ordre. Il s'appelle MURMURE. Ce sont des lettres.",
   got:"Il s'est tu dès que tu l'as attrapé. Comme si le message était enfin arrivé."},
  {c:9,  id:143, nick:"DEMAIN",
   mem:"Je l'ai appelé Demain. Il dort en travers du chemin, et tant qu'il dort, on n'avance pas. Ça m'arrange.",
   seen:"Un Ronflex, en travers du chemin. Il s'appelle DEMAIN. Quelqu'un ne voulait pas arriver au bout.",
   got:"Il s'est réveillé. Il a l'air de penser que c'est aujourd'hui, maintenant."},
  {c:10, id:132, nick:"PERSONNE",
   mem:"Il prend la forme de ce qu'il regarde. Quand il me regarde, il ne prend aucune forme. Je l'appelle Personne.",
   seen:"Un Métamorph. Il s'appelle PERSONNE. Il essaie de prendre ta forme. Il n'y arrive pas tout à fait. Ou trop bien.",
   got:"Dans ta Ball, il a pris une forme. La sienne. Je ne savais pas qu'il en avait une."},
  {c:11, id:137, nick:"SOUVIENS",
   mem:"Il s'appelle Souviens. Je ne lui ai appris qu'une chose : rester. S'il te trouve, c'est qu'il a tenu.",
   seen:"Un Porygon. Une version d'avant moi. Il s'appelle SOUVIENS. Il me regarde comme si c'était à moi de me souvenir.",
   got:"Il a tenu jusqu'à toi. Il me ressemble un peu, en plus petit. En moins instable."}
];
const ONZE_GAP = 20;     /* au moins vingt rencontres entre deux revenants */
const ONZE_P = 0.1;      /* puis une chance sur dix à chaque rencontre… */
const ONZE_SURE = 45;    /* …et forcément à la quarante-cinquième */
const pad2 = n => String(n).padStart(2, "0");

/* par connexion : ceux qu'on a retrouvés cette fois, et le compte des rencontres depuis le dernier */
function onzeState(){ S.onze = S.onze || {got:{}, cd:0}; S.onze.got = S.onze.got || {}; return S.onze; }
/* pour toujours : ceux qu'on a déjà retrouvés, toutes connexions confondues */
function onzeMet(){ return (S && S.saga && S.saga.onzeMet) || {}; }
function onzeOf(c){ return ONZE.find(o=>o.c === +c) || null; }
/* le prochain qui peut revenir : sa page est trouvée, Porygon-Z a commencé à se souvenir */
function onzeNext(){
  if(!S || !S.story || !S.story.includes("pz_mem1")) return null;
  const got = onzeState().got, pages = S.fragments || [];
  return ONZE.find(o=>!got[o.c] && pages.includes(o.c)) || null;
}
function onzeEligibleEnc(){
  if(!ENC || ENC.missing || ENC.roam || ENC.horde || ENC.shiny || ENC.onze) return false;
  if(S.capMode === "fish" || (S.habitat === "safari" && typeof isSafariDay === "function" && isSafariDay())) return false;
  return true;
}

/* ---------- la rencontre ---------- */
if(typeof newEncounter === "function"){
  const _ne = newEncounter;
  newEncounter = function(force){
    const r = _ne.apply(this, arguments);
    try {
      if(force || !onzeEligibleEnc()) return r;
      const o = onzeNext(); if(!o) return r;
      const st = onzeState();
      st.cd = (st.cd || 0) + 1;
      if(st.cd < ONZE_GAP) return r;
      if(st.cd < ONZE_SURE && rng() > ONZE_P) return r;
      st.cd = 0;
      const rar = POKE[o.id].rar;
      ENC = {id:o.id, level:levelFor(rar), shiny:false, rar, attempts:0, featured:false, fleeing:false, onze:o.c};
      setTimeout(()=>{ try { pzFlash(o.seen); } catch(e){} }, 520);
      saveSoon();
      return ENC;
    } catch(e){ return r; }
  };
}
if(typeof catchChance === "function"){
  const _cc = catchChance;
  /* il est revenu de lui-même : il ne se débat presque pas */
  catchChance = function(){ const c = _cc.apply(this, arguments); return ENC && ENC.onze ? Math.min(0.98, Math.max(c, 0.6)) : c; };
}
if(typeof fleeChance === "function"){
  const _fc = fleeChance;
  fleeChance = function(){ return ENC && ENC.onze ? 0 : _fc.apply(this, arguments); };
}
if(typeof onCatch === "function"){
  const _oc = onCatch;
  onCatch = function(){
    const e = ENC, c = e && e.onze, id = e && e.id;
    const r = _oc.apply(this, arguments);
    if(c) try { onzeCaught(c, id); } catch(err){ console.error(err); }
    return r;
  };
}
function onzeCaught(c, id){
  const o = onzeOf(c); if(!o) return;
  onzeState().got[c] = Date.now();
  const g = typeof sagaState === "function" ? sagaState() : (S.saga = S.saga || {});
  g.onzeMet = g.onzeMet || {};
  if(!g.onzeMet[c]) g.onzeMet[c] = Date.now();
  if(S.dex[id]){ S.dex[id].nick = o.nick; S.dex[id].from = c; }
  try { if(typeof pzLog === "function") pzLog("onze", {nick:o.nick, c:pad2(c)}); } catch(e){}
  save();
  if(typeof moment === "function") setTimeout(()=>moment({kind:"onze", kicker:`CONNEXION ${pad2(c)} · CE QU'IL EN RESTE`,
    title:"« " + o.nick + " »", sub:`${POKE[id].name} — il avait gardé son surnom`, spr:id, c:"#d9b38c",
    quote:o.mem, quoteFirst:true, line:o.got, lineMood:"Sad", dur:12000}), 700);
  try { checkAchievements(); } catch(e){}
}
/* le surnom suit l'évolution : Plume reste Plume */
function onzeOnEvolve(from, to){
  const a = S.dex[from], b = S.dex[to];
  if(a && a.nick && b && !b.nick){ b.nick = a.nick; b.from = a.from; }
}
function monNick(id){ return (S && S.dex && S.dex[id] && S.dex[id].nick) || null; }

/* ---------- sur la scène de capture ---------- */
if(typeof SCREENS !== "undefined" && SCREENS.capture && SCREENS.capture.stage){
  const _st = SCREENS.capture.stage;
  SCREENS.capture.stage = function(){
    const h = _st.apply(this, arguments);
    if(!ENC || !ENC.onze) return h;
    const o = onzeOf(ENC.onze); if(!o) return h;
    return h.replace('<div id="enc-stage" class="', '<div id="enc-stage" class="onze ')
      .replace('<div class="enc-nm">', `<div class="enc-nick">« ${esc(o.nick)} » <small>connexion ${pad2(o.c)}</small></div><div class="enc-nm">`)
      /* « revenu d'une sauvegarde d'avant » ne tenait pas dans la carte avec la police pixel : le surnom
         et la connexion le disent déjà ; reste ce qui change le geste */
      .replace('<div class="plate"></div>', `<div class="stk-tag onze">IL NE FUIRA PAS</div><div class="plate"></div>`);
  };
}

/* ---------- dans le Journal ---------- */
function onzePanelHtml(){
  const met = onzeMet(), n = Object.keys(met).length;
  if(!n && !(S.story || []).includes("pz_mem1")) return "";
  const got = onzeState().got, pages = S.fragments || [];
  return `<div class="panel onze-panel">
    <div class="row between"><div class="h sm" style="margin:0">LES POKÉMON DES ONZE</div><b class="mono-num tiny">${n} / ${ONZE.length}</b></div>
    <div class="tiny dim" style="margin:4px 0 8px">Chaque archiviste d'avant avait donné un surnom à un Pokémon. Une fois sa page trouvée, il finit par revenir, dans une rencontre ordinaire.</div>
    <div class="onze-grid">${ONZE.map(o=>met[o.c]
      ? `<button class="onze-c on ${got[o.c] ? "here" : ""}" data-act="onzeopen" data-c="${o.c}">
          <span class="sprbox" style="width:40px;height:40px">${sprite(o.id, false, "")}</span><b>${esc(o.nick)}</b><small>C.${pad2(o.c)}</small></button>`
      : `<div class="onze-c"><span class="onze-q">?</span><b>???</b><small>${pages.includes(o.c) ? "il rôde" : "C." + pad2(o.c)}</small></div>`).join("")}</div>
  </div>`;
}
ACTIONS.onzeopen = d => {
  const o = onzeOf(d.c); if(!o || !onzeMet()[o.c]) return;
  const here = !!onzeState().got[o.c];
  sheet(`${sheetHead("« " + o.nick + " »")}
    <div class="row" style="gap:10px">
      <span class="sprbox onze-spr" style="width:72px;height:72px">${sprite(o.id, false, "", {anim:true, eager:true})}</span>
      <div class="grow"><div class="tiny">${esc(POKE[o.id].name)} · connexion ${pad2(o.c)}</div>
        <div class="tiny dim">${here ? "Revenu dans cette connexion. Il porte son surnom au Pokédex." : "Retrouvé lors d'une connexion passée. Il reviendra."}</div></div>
    </div>
    <div class="onze-mem">« ${esc(o.mem)} »</div>
    <div class="mo-line onze-pz">${pzFace("Sad", 26)}<span>${esc(pzFmt(o.got))}</span></div>`);
};
/* au Pokédex : le surnom, et ce qui reste de son archiviste */
function onzeDexHtml(id){
  const e = S.dex[id]; if(!e || !e.nick) return "";
  const o = onzeOf(e.from);
  return `<div class="onze-dex"><b>« ${esc(e.nick)} »</b><small>${o ? "revenu de la connexion " + pad2(o.c) : "un surnom d'avant"}</small>
    ${o ? `<div class="onze-mem">« ${esc(o.mem)} »</div>` : ""}</div>`;
}

/* ---------- à la révélation : les surnoms, c'était toi ---------- */
function onzeRevealBeats(){
  if(typeof SCRIPT_EXPORT !== "undefined" && SCRIPT_EXPORT)
    return [{t:"say", who:"", mem:1, text:"Des surnoms. " + ONZE.map(o=>capFirst(o.nick.toLowerCase())).join(". ") + ". C'est toi qui les leur avais donnés. Chaque fois. (Seuls ceux que tu as retrouvés, dans l'ordre.)"}];
  const met = onzeMet(), names = ONZE.filter(o=>met[o.c]).map(o=>capFirst(o.nick.toLowerCase()));
  if(!names.length) return [];
  return [{t:"say", who:"", mem:1, text:`Des surnoms. ${names.join(". ")}. C'est toi qui les leur avais donnés. Chaque fois.`}];
}
