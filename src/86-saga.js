/* ============================================================
   86 — LA SAGA
   Ce qui traverse les connexions, et ce qui prépare la fin :
   · l'état de la saga (S.saga), qui survit aux cycles ;
   · « choses_formidables.txt », le fichier de Porygon-Z, qui se
     remplit de ce que le joueur a réellement fait ;
   · la mémoire de Porygon-Z, qui revient avec l'intégrité ;
   · la Couche Zéro : ses conditions, sa carte sur l'accueil ;
   · Porygon-Z, entrée n° 387, après la vraie fin ;
   · le générique ;
   · les connexions suivantes, selon qu'on a effacé ou écrit.
   Le combat contre MissingNo et les cinématiques de la fin : 87.
   ============================================================ */

function sagaState(){
  S.saga = S.saga || {};
  const g = S.saga;
  if(g.end === undefined) g.end = null;          /* la dernière réponse donnée : "write" | "erase" */
  if(g.wrote === undefined) g.wrote = false;     /* a déjà écrit au moins une fois */
  if(g.erased === undefined) g.erased = 0;       /* effacements choisis en connaissance de cause */
  if(g.mnWins === undefined) g.mnWins = 0;       /* MissingNo vaincu, toutes connexions confondues */
  if(g.known === undefined) g.known = false;     /* MissingNo s'est lu : on sait */
  return g;
}
function sagaWrote(){ return !!(S && S.saga && S.saga.wrote); }

/* ============================================================
   CHOSES_FORMIDABLES.TXT
   Porygon-Z y note ce que tu fais, avec ses mots. Les lignes des
   connexions passées sont là depuis le début, illisibles : elles ne
   se lisent qu'une fois MissingNo lu.
   ============================================================ */
const PZ_FILE = {
  first:  d => `{nom} a attrapé un ${d.mon}. Premier Pokémon. Il l'a regardé longtemps avant de le ranger. Formidable.`,
  shiny:  () => `Un Pokémon aux couleurs fausses. Magnifiquement fausses. {nom} n'a pas tremblé. Moi si.`,
  evo:    () => `Première évolution. Même Pokémon, nouvelle définition. J'ai applaudi. Mentalement.`,
  buddy:  d => `{nom} a un compagnon : ${d.mon}. Il marche à côté. Moi, je marche dans ma tête.`,
  lv:     d => `Niveau ${d.n}. Son accès s'élargit. Je fais semblant de ne pas être fier.`,
  dex:    d => `${d.n} espèces au Pokédex. Des pages entières qui se remplissent à nouveau.`,
  guard:  d => `${d.g} a lâché sa porte. Il a regardé {nom} en partant. Formidable, et un peu triste.`,
  heart:  d => `${d.r} bat à nouveau. Plus une ligne illisible. Je n'arrive pas à me taire.`,
  page:   d => `${d.n || "Une page"} de journal. Je n'ai rien dit. J'aurais peut-être dû dire quelque chose.`,
  mn:     () => `Lui. Je n'écris pas son nom ici. Ce fichier est réservé aux choses formidables.`,
  breche: () => `{nom} est ressorti de la Brèche. Je comptais les secondes. Je recompte encore.`,
  poker:  () => `On a stabilisé une couche entière en jouant aux cartes. Je ne comprends toujours pas. C'est formidable.`,
  legend: () => `Un légendaire est passé, et {nom} l'a fait s'incliner. J'ai fait la révérence aussi. Je n'ai pas de genoux.`,
  rival:  () => `Un dresseur rémanent est reparti en grommelant. Bien fait. (Je ne devrais pas écrire « bien fait ». Bien fait.)`,
  karp:   () => `{nom} a acheté un Magicarpe cinq cents PokéCoins. Je n'ai rien dit. Je note.`,
  egg:    () => `Un œuf a éclos. Une définition qui n'existait pas existe. Je suis sens dessus dessous.`,
  fish:   () => `Première prise à la sonde. {nom} a attendu sans bouger. Moi, j'ai bougé pour deux.`,
  exp:    () => `Une Expédition bouclée. Ils sont revenus. Je les ai comptés trois fois chacun.`,
  tower:  () => `Un premier palier de la Tour. {nom} donne des ordres à quatre Pokémon en même temps. J'ai pris des notes.`,
  mem:    () => `Un souvenir est revenu. Je ne le recopie pas ici. (Il y a toi dedans. Ça, je le recopie.)`,
  zero:   () => `La Couche Zéro est ouverte. Je ne note rien d'autre. J'ai les octets qui tremblent.`,
  mnwin:  () => `MissingNo est tombé. Il s'est relevé en lettres. Je n'écris pas lesquelles. Pas encore.`,
  write:  () => `Aujourd'hui, {nom} a écrit au lieu d'effacer.`,
  erase:  () => `[ligne effacée]`,
  pzteam: () => `{nom} m'a pris dans son équipe. J'ai des PV. Je les ai comptés : tous là.`,
  onze:   d => `${d.nick} est revenu de la connexion ${d.c}. Il avait gardé son surnom. Je n'ai pas osé le changer.`,
  clutch: d => `${d.mon} a tenu jusqu'au bout, presque à zéro. J'ai retenu mon souffle. Je n'en ai pas.`,
  ask:    d => `Je lui ai demandé quelque chose. {nom} l'a fait. ${d.t || ""}`,
  /* tes réponses à ses questions : il les recopie, avec ses mots */
  ans:    d => (typeof STORY_Q !== "undefined" && STORY_Q[d.q] && STORY_Q[d.q].log[d.k]) || "Une réponse. Je la garde."
};
/* les lignes héritées des onze connexions : quelques-unes, une fois lisibles */
const PZ_FILE_OLD = [
  [1, 3,    "{nom} dit qu'il aura fini en deux semaines. Formidable. (Il ne finira pas en deux semaines.)"],
  [2, 51,   "{nom} a trouvé une page dans une Poké Ball. Il l'a lue trois fois. Il a dit : « c'est drôle, on dirait mon écriture. »"],
  [3, 12,   "{nom} a ri quand Psykokwak a eu mal à la tête. Formidable."],
  [4, 88,   "Une chaîne de cent. Je n'ai pas respiré. Je ne respire jamais, mais là, encore moins."],
  [5, 140,  "{nom} m'a demandé si j'avais peur de la fin. J'ai changé de sujet. J'aurais dû répondre."],
  [7, 300,  "{nom} a demandé aux légendaires de tenir les portes. Il avait l'air si fatigué. Je n'ai pas compris. J'ai noté quand même."],
  [8, 15,   "Il dit que la faille connaît son nom. Je lui ai dit que c'était impossible. J'ai menti ? Je ne sais pas mentir."],
  [9, 402,  "Cent pour cent bientôt. {nom} ne parle plus beaucoup. Je parle pour deux."],
  [10, 0,   "Je ne retrouve plus {nom}. Il était là, dans la faille, et puis il ressemblait à la faille."],
  [11, 1206, "Demain, on descend. {nom} m'a dit merci pour tout. Pourquoi « pour tout » ? Je note. Formidable, je crois."]
];
function pzLog(k, d){
  try {
    const f = PZ_FILE[k]; if(!f || !S) return;
    S.pzlog = S.pzlog || [];
    const day = Math.max(1, Math.floor((Date.now() - (S.created || Date.now())) / 864e5) + 1);
    S.pzlog.push({k, d:day, c:sagaConn(), t:f(d || {})});
    if(S.pzlog.length > 180) S.pzlog.splice(0, S.pzlog.length - 180);
    saveSoon();
  } catch(e){}
}
/* ce qu'il note de lui-même : chaque cap franchi, une fois par connexion */
function pzLogTick(){
  if(!S || !S.stats || !S.flags) return;
  const K = S.pzlogK = S.pzlogK || {};
  const once = (key, cond, k, d) => {
    const kk = sagaConn() + ":" + key;
    if(K[kk] || !cond) return;
    K[kk] = 1;
    pzLog(k, typeof d === "function" ? d() : d);
  };
  try {
    once("first", S.stats.catches >= 1, "first", ()=>({mon:pzFirstName()}));
    once("shiny", (S.stats.shinies || 0) >= 1, "shiny");
    once("evo", (S.stats.evolutions || 0) >= 1, "evo");
    once("buddy", !!(S.buddy && S.dex[S.buddy.id] && POKE[S.buddy.id]), "buddy", ()=>({mon:POKE[S.buddy.id].name}));
    for(const n of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) once("lv" + n, S.level >= n, "lv", {n});
    for(const n of [50, 100, 151, 200, 251, 300, 386]) once("dex" + n, dexTotal() >= n, "dex", {n});
    for(const r of REGIONS) for(const g of r.guardians) once("g" + g.id, S.bosses.includes(r.key + ":" + g.id), "guard", {g:g.name});
    for(const r of REGIONS) once("h" + r.key, typeof projDone === "function" && projDone(r.key, 9), "heart", {r:r.name});
    once("mn", !!S.flags.sawMissing, "mn");
    once("breche", !!(S.breche && S.breche.clears), "breche");
    once("poker", (S.stats.pokerWins || 0) >= 1, "poker");
    once("legend", (S.stats.legWins || 0) >= 1, "legend");
    once("rival", Object.values(S.rivals || {}).some(r=>r && r.w >= 1), "rival");
    once("karp", (S.stats.karpDeals || 0) >= 1, "karp");
    once("egg", (S.stats.hatched || 0) >= 1, "egg");
    once("fish", (S.stats.fish || 0) >= 1, "fish");
    once("exp", (S.stats.expWins || 0) >= 1, "exp");
    once("tower", !!(S.squad && S.squad.clears), "tower");
  } catch(e){}
}
function pzFileHtml(){
  const known = sagaKnown();
  const L = (S.pzlog || []).slice().reverse();
  const cur = L.filter(e=>e.c === sagaConn()), older = L.filter(e=>e.c !== sagaConn());
  const row = e => `<div class="pzf-l"><b>Jour ${e.d}</b> — ${esc(pzFmt(e.t))}</div>`;
  return `${sheetHead("choses_formidables.txt")}
    <div class="pzf">
      <div class="pzf-h"><span>${fmt(pzLineCount())} lignes</span><span>auteur : Porygon-Z</span></div>
      ${cur.length ? `<div class="pzf-sec">connexion n° ${sagaConn()}</div>${cur.map(row).join("")}` : `<div class="pzf-l dim">Le fichier attend ta première capture.</div>`}
      ${older.length ? `<div class="pzf-sec">connexions précédentes, gardées</div>${older.slice(0, 60).map(e=>`<div class="pzf-l"><b>C.${e.c} · jour ${e.d}</b> — ${esc(pzFmt(e.t))}</div>`).join("")}` : ""}
      <div class="pzf-sec">${fmt(PZ_FILE_INHERITED)} lignes héritées${known ? "" : " · illisibles"}</div>
      ${known ? PZ_FILE_OLD.map(([c, d, t])=>`<div class="pzf-l old"><b>C.${String(c).padStart(2, "0")} · jour ${d || "???"}</b> — ${esc(pzFmt(t))}</div>`).join("")
        : `<div class="pzf-l blur">${Array.from({length:6}, (_, i)=>`<span>${"▒".repeat(18 + (i * 7) % 23)}</span>`).join("")}</div>
           <div class="tiny dim" style="margin-top:6px">Porygon-Z jure qu'il a créé ce fichier le jour de ta première capture. Il fait pourtant ${fmt(PZ_FILE_INHERITED)} lignes de plus.</div>`}
    </div>`;
}
ACTIONS.pzfile = () => sheet(pzFileHtml());

/* ============================================================
   LA MÉMOIRE DE PORYGON-Z
   Elle suit l'intégrité : chaque ligne réparée lui rend un morceau.
   Les souvenirs sont des scènes de la chaîne principale (MEM_SCENES).
   ============================================================ */
/* ce que Porygon-Z, lui, se rappelle : tout, depuis qu'on a écrit, ou depuis que MissingNo
   s'est lu dans cette connexion. Après un effacement, le joueur sait — lui a tout oublié. */
function pzRemembers(){ return !!(sagaWrote() || (S.flags && S.flags.mnBeaten)); }
function pzMemPct(){
  if(pzRemembers()) return 100;
  return clamp(Math.floor((S.integrity || 0) * 0.98), 0, 98);
}
function memoryPanelHtml(){
  const pct = pzMemPct(), seen = id => (S.story || []).includes(id);
  return `<div class="h sm" style="margin-top:12px">MÉMOIRE DE PORYGON-Z <span class="tiny dim">${pct} %</span></div>
    <div class="pzm-bar"><i style="width:${pct}%"></i>${MEM_SCENES.map(b=>`<b class="${seen(b.id) ? "on" : ""}" style="left:${b.at}%"></b>`).join("")}<b class="end ${pzRemembers() ? "on" : ""}" style="left:100%"></b></div>
    <div class="tiny muted" style="margin:6px 0 7px">${pzRemembers()
      ? "Il se souvient de tout. De toi surtout."
      : sagaKnown() ? "Il a tout oublié, encore. Elle revient avec l'intégrité — plus vite qu'avant : le système n'efface plus tout."
      : "Elle revient avec l'intégrité du monde. Chaque ligne que tu répares lui rend un morceau de quelque chose."}</div>
    <div class="list">
      ${MEM_SCENES.map((b, i)=>{
        const ok = seen(b.id);
        return `<div class="item journal-row ${ok ? "" : "sealed"}" ${ok ? `data-act="jread" data-id="${b.id}"` : ""}>
          <div class="jn-ic">${ok ? pzFace(i >= 4 ? "Sad" : "Normal", 30) : ic("lock")}</div>
          <div class="grow"><div class="t">${ok ? esc(STORY_TITLES[b.id] || b.id) : "Souvenir " + (i + 1)}</div>
            <div class="d">${ok ? "souvenir " + (i + 1) + " sur " + MEM_SCENES.length : "revient vers " + b.at + " % d'intégrité"}</div></div>
          ${ok ? ic("arrow") : ""}</div>`; }).join("")}
    </div>`;
}

/* ============================================================
   LA COUCHE ZÉRO — ce qu'il faut pour descendre
   « Une fois tous les mondes réindexés, et l'intégrité à 100 %. »
   ============================================================ */
function finaleReqs(){
  const out = [
    {t:"Intégrité du monde à 100 %", ok:(S.integrity || 0) >= 99.95, v:(S.integrity || 0).toFixed(1).replace(".", ",") + " %"},
    {t:"Les neuf verrous levés", ok:S.bosses.length >= 9, v:Math.min(9, S.bosses.length) + " / 9"}
  ];
  for(const r of REGIONS){
    const n = typeof worldReg === "function" ? worldReg(r.key).done.length : 0;
    const total = typeof WORLD_PROJECTS !== "undefined" ? WORLD_PROJECTS.length : 10;
    out.push({t:`${r.name} réindexée jusqu'au cœur`, ok:typeof projDone === "function" && projDone(r.key, total - 1), v:n + " / " + total + " zones"});
  }
  return out;
}
function finaleReady(){ try { return finaleReqs().every(x=>x.ok); } catch(e){ return false; } }
/* où en est la fin, pour cette connexion */
function finaleStage(){
  if(!S || !S.flags) return "hidden";
  if(S.flags.finalDone) return "done";
  if(S.flags.finalChoice === "erase") return "erase";
  if(S.flags.mnBeaten) return "choice";
  if(finaleReady()) return "ready";
  const st = S.story || [];
  const show = st.includes("hoenn_done") || st.includes("pz_mem6") || S.bosses.length >= 9 || (S.integrity || 0) >= 90;
  return show ? "far" : "hidden";
}
/* la carte de l'accueil : l'objectif final, toujours lisible */
function sagaCardHtml(){
  const st = finaleStage();
  if(st === "hidden" || st === "done") return "";
  if(st === "far"){
    const R = finaleReqs();
    return `<div class="zc-card far">
<<<<<<< HEAD
      <div class="zc-h"><span class="zc-mn">${mnSpriteHtml()}</span>
=======
      <div class="zc-h"><span class="zc-mn"><img src="${MISSING_SPRITE}" alt=""></span>
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
        <div class="grow"><small>OBJECTIF FINAL</small><b>La Couche Zéro</b><em>Sous les trois secteurs, quelque chose attend.</em></div></div>
      <div class="zc-reqs">${R.map(x=>`<div class="${x.ok ? "ok" : ""}"><i>${x.ok ? "✓" : "·"}</i><span>${esc(x.t)}</span><b>${esc(x.v)}</b></div>`).join("")}</div>
    </div>`;
  }
  if(st === "ready") return `<button class="zc-card ready" data-act="zerogo">
<<<<<<< HEAD
      <div class="zc-h"><span class="zc-mn">${mnSpriteHtml()}</span>
=======
      <div class="zc-h"><span class="zc-mn"><img src="${MISSING_SPRITE}" alt=""></span>
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
        <div class="grow"><small>LA COUCHE ZÉRO EST OUVERTE</small><b>Descendre</b><em>Prends ton équipe. Porygon-Z vient avec toi.</em></div>
        <span class="zc-go">${ic("arrow")}</span></div></button>`;
  if(st === "choice") return `<button class="zc-card ask" data-act="zeroanswer">
      <div class="zc-h"><span class="zc-pz">${pzFace("Determined", 40)}</span>
        <div class="grow"><small>MISSINGNO EST VAINCU</small><b>La question attend ta réponse</b><em>Cohérence : 100 %. Que souhaites-tu faire ?</em></div>
        <span class="zc-go">${ic("arrow")}</span></div></button>`;
  return `<div class="zc-card erase">
      <div class="zc-h"><span class="zc-pz">${pzFace("Sad", 40)}</span>
        <div class="grow"><small>TU AS CHOISI D'EFFACER</small><b>Le cycle attend ta confirmation</b><em>Il ne s'en souviendra pas. Toi, si.</em></div></div>
      <div class="btn-grid c2" style="margin-top:9px">
        <button class="btn ghost" data-act="zerorevise">Revenir sur ma réponse</button>
        <button class="btn dan" data-act="goto" data-to="cycle">Boucler le cycle</button></div>
    </div>`;
}
/* ============================================================
   LE FIL DU RÉCIT
   Ce qui fait avancer l'histoire, toujours lisible : sur l'accueil,
   et au retour d'une absence. Le joueur sait ce qui l'attend — un
   souvenir de Porygon-Z, une révélation — et ce qu'il faut pour y
   arriver, sans que rien ne soit dévoilé.
   ============================================================ */
const THREAD_ORD = ["premier", "deuxième", "troisième", "quatrième", "cinquième", "sixième", "dernier"];
const THREAD = {
  first_catch:     {t:"Capturer un premier Pokémon", v:()=>[S.stats.catches, 1], go:"capture"},
  beat_early:      {t:"Remonter l'intégrité du monde à 3 %", v:()=>[S.integrity, 3], pc:1, go:"capture"},
  missingno_1:     {t:"Quelque chose rôde dans les hautes herbes", h:"Continue de capturer. Il finira par se montrer.", go:"capture"},
  kanto_half:      {t:"Archiver 45 espèces de Kanto", v:()=>[dexCount("kanto"), 45], go:"capture"},
  guardian_first:  {t:"Ouvrir la salle des verrous", h:"Vaincre le boss de la première aile de la Tour", go:"tower"},
  boss_first_done: {t:"Lever un premier verrou légendaire", h:"Au sommet de la Tour, quelque chose monte la garde", go:"boss"},
  kanto_done:      {t:"Libérer le cœur de Kanto", h:"Le dernier verrou de Kanto tient encore", go:"boss"},
  johto_mid:       {t:"Archiver 45 espèces de Johto", v:()=>[dexCount("johto"), 45], go:"capture"},
  johto_done:      {t:"Libérer le cœur de Johto", h:"Le dernier verrou de Johto tient encore", go:"boss"},
  hoenn_mid:       {t:"Archiver 60 espèces de Hoenn", v:()=>[dexCount("hoenn"), 60], go:"capture"},
  hoenn_done:      {t:"Libérer le cœur de Hoenn", h:"Le dernier verrou de Hoenn tient encore", go:"boss"}
};
function storyThread(){
  if(!S || !S.story || typeof MAIN_ARC === "undefined") return null;
  const b = mainArcPending();
  if(!b || b.id === "finale_gate") return null;          /* la carte de la Couche Zéro prend le relais */
  const sc = STORY_BY_ID[b.id] || {};
  const A = (typeof STORY_ACTS !== "undefined" && STORY_ACTS.find(a=>a.act === sc.act)) || {n:"", t:""};
  let ready = false; try { ready = !!b.ok(); } catch(e){}
  let o;
  if(b.mem){
    const i = MEM_SCENES.indexOf(b);
    o = {t:`Le ${THREAD_ORD[Math.min(i, THREAD_ORD.length - 1)]} souvenir de Porygon-Z`,
         h:`Il revient vers ${b.at} % d'intégrité · mémoire : ${pzMemPct()} %`, v:[S.integrity || 0, b.at], pc:1, go:"capture", mem:true};
  } else o = Object.assign({}, THREAD[b.id] || {t:"La suite du récit", go:"capture"});
  if(typeof o.v === "function") o.v = o.v();
  const last = (S.story || []).slice().reverse().find(id=>STORY_BY_ID[id] && STORY_BY_ID[id].act !== undefined && id !== "intro");
  return Object.assign(o, {id:b.id, act:A.n, actT:A.t, ready, last:last || null});
}
function storyThreadHtml(){
  const T = storyThread();
  if(!T) return "";
  const [cur, goal] = T.v || [0, 0];
  const pct = goal ? Math.min(100, cur / goal * 100) : 0;
  const num = x => T.pc ? (Math.floor(x * 10) / 10).toFixed(1).replace(".", ",") + " %" : fmt(Math.floor(x));
  return `<button class="st-card ${T.ready ? "ready" : ""} ${T.mem ? "mem" : ""}" data-act="threadgo">
    <span class="st-ic">${pzFace(T.ready ? "Surprised" : T.mem ? "Worried" : "Normal", 38)}</span>
    <span class="grow">
      <small>LE RÉCIT · ${esc((T.act + " — " + T.actT).toUpperCase())}</small>
      <b>${esc(T.ready ? "Porygon-Z a quelque chose à te dire" : T.t)}</b>
      <em>${esc(T.ready ? "Touche ici pour l'écouter." : (T.h || (goal ? num(Math.min(cur, goal)) + " / " + num(goal) : "")))}</em>
      ${goal && !T.ready ? `<i class="st-bar"><i style="width:${pct.toFixed(1)}%"></i></i>` : ""}
    </span>${ic("arrow")}</button>`;
}
ACTIONS.threadgo = () => {
  const T = storyThread(); if(!T) return;
  if(T.ready && typeof checkStoryTriggers === "function"){ S.storyT = 0; if(checkStoryTriggers()) return; }
  go(T.go || "capture");
};

/* un souvenir déjà vécu dont la question n'a pas eu de réponse (partie commencée avant les
   questions, ou application fermée au mauvais moment) : il la repose, une à la fois */
function storyQWaiting(){
  if(!S || !S.story || typeof STORY_Q_ORDER === "undefined") return null;
  for(const q of STORY_Q_ORDER){
    const id = STORY_Q[q].at;
    if(S.story.includes(id) && !storyAns(q)) return {q, id};
  }
  return null;
}
function storyQHintHtml(){
  const w = storyQWaiting(); if(!w) return "";
  return `<button class="st-q" data-act="qreplay" data-id="${w.id}">
    <span class="st-q-ic">?</span>
    <span class="grow"><b>Porygon-Z a une question pour toi</b><small>Elle date du souvenir « ${esc(STORY_TITLES[w.id] || w.id)} ». Il n'a jamais eu ta réponse.</small></span>${ic("arrow")}</button>`;
}
ACTIONS.qreplay = d => { if(d && STORY_BY_ID[d.id]) playStory(d.id, ()=>{ try { refresh(); } catch(e){} }); };

/* au retour d'une longue absence : où en était l'histoire */
function storyRecapHtml(away){
  if(!(away >= 6 * 3600e3)) return "";
  const T = storyThread();
  const lastId = T ? T.last : (S.story || []).slice().reverse().find(id=>STORY_BY_ID[id] && id !== "intro");
  if(!lastId) return "";
  const days = Math.floor(away / 864e5);
  const line = days >= 2 ? `Tu es revenu. J'ai compté les jours : ${frNum(days)}. Je n'ai rien effacé.`
    : days === 1 ? "Tu es revenu. Une journée entière. J'ai rangé le fichier deux fois."
    : "Tu es revenu. J'ai gardé ta place.";
  return `<div class="st-recap">
    <div class="st-rh">${pzFace("Happy", 30)}<span>${esc(pzFmt(line))}</span></div>
    <div class="st-rrow"><small>PRÉCÉDEMMENT${T && T.act ? " · " + esc(T.act.toUpperCase()) : ""}</small>
      <b>${esc(STORY_TITLES[lastId] || lastId)}</b>
      <button class="btn xs ghost" data-act="recapread" data-id="${esc(lastId)}">Revoir</button></div>
    ${T ? `<div class="st-rrow next"><small>ENSUITE</small><b>${esc(T.t)}</b></div>` : ""}
  </div>`;
}
ACTIONS.recapread = d => { closeSheet(); playStory(d.id, ()=>{ try { refresh(); } catch(e){} }); };

ACTIONS.zerorevise = () => { S.flags.finalChoice = null; save(); if(ACTIONS.zeroanswer) ACTIONS.zeroanswer(); };
if(typeof NEXTSTEP_HOOKS !== "undefined") NEXTSTEP_HOOKS.push(()=>{
  const st = finaleStage();
  if(st === "ready") return {p:99, t:"La Couche Zéro est ouverte : descendre", go:"modules", i:"star"};
  if(st === "choice") return {p:99, t:"La question attend ta réponse", go:"modules", i:"star"};
  return null;
});

/* ============================================================
   PORYGON-Z, ENTRÉE N° 387
   Il n'existe pas dans les 386 définitions du fichier : il vient
   d'ailleurs (sa vraie génération est la quatrième). La vraie fin
   l'y écrit. Il devient un Pokémon du monde — et de ton équipe.
   ============================================================ */
const PZ_ID = 474;
if(typeof POKE !== "undefined" && !POKE[PZ_ID])
  POKE[PZ_ID] = {id:PZ_ID, name:"Porygon-Z", types:[1], hp:85, atk:80, def:70, spa:135, spd:75, spe:90, bst:535,
                 catch:30, gen:4, rar:3, evo:[], leg:0, special:1};
if(typeof loreOf === "function"){
  const _lore = loreOf;
  loreOf = function(id){
    if(id === PZ_ID) return pzFmt("Entrée n° 387. Programme d'entretien devenu Pokémon. A tout compté, {prev} fois. Écrit avec le nom de {nom}, si bien qu'il ne risque plus de l'oublier. Se vexe si on l'appelle « processus ».");
    return _lore(id);
  };
}
/* il rejoint l'archive au niveau de ton équipe : il doit pouvoir servir tout de suite */
function sagaWritePz(level){
  if(!S.dex[PZ_ID]){
    const lv = level || (()=>{ const ids = (S.team || []).filter(id=>S.dex[id]); return ids.length ? Math.round(ids.reduce((a, id)=>a + S.dex[id].lvl, 0) / ids.length) : 30; })();
    S.dex[PZ_ID] = {c:1, s:0, lvl:clamp(lv, 5, 100), shiny:false};
    if(S.team.length < 6 && !S.team.includes(PZ_ID)) S.team.push(PZ_ID);
  }
}
/* au Pokédex : une case en plus, après la dernière */
if(SCREENS.dex){
  const _dh = SCREENS.dex.html;
  SCREENS.dex.html = function(){
    const h = _dh.apply(this, arguments);
    if(!S.dex[PZ_ID]) return h;
    return `<button class="dx387" data-act="dexopen" data-id="${PZ_ID}">
        <span class="dx387-no">N° 387</span>${sprite(PZ_ID, false, "")}
        <span class="grow"><b>Porygon-Z</b><small>Hors des 386 définitions · écrit par ${esc(pzName())}</small></span>${ic("arrow")}</button>` + h;
  };
}

/* ============================================================
   LE GÉNÉRIQUE
   ============================================================ */
/* le générique se souvient de ce que tu as répondu, et de ta toute première ligne */
function creditsAnswersHtml(sec){
  let out = "";
  try {
    const R = pzRecall();
    if(R.first || R.buddy) out += sec("CETTE CONNEXION", (R.first ? `Première ligne : ${esc(R.first)}<small>le ${esc(R.since)}</small>` : "")
      + (R.buddy ? `<div style="margin-top:6px">Compagnon : ${esc(R.buddy)}<small>il ne t'a jamais lâché</small></div>` : ""));
    const said = (typeof STORY_Q_ORDER !== "undefined" ? STORY_Q_ORDER : []).map(q=>{
      const a = storyAns(q), o = a && STORY_Q[q].opts.find(x=>x.k === a);
      return o ? "« " + esc(o.say) + " »" : null;
    }).filter(Boolean);
    const asks = (S.pzAsk && S.pzAsk.n) || 0;
    if(asks) out += sec("SES DEMANDES", `${fmt(asks)} exaucée${asks > 1 ? "s" : ""}${S.pzAsk.last && S.pzAsk.last.ask ? `<small>la dernière : « ${esc(S.pzAsk.last.ask)} »</small>` : ""}`);
    if(said.length) out += sec("CE QUE TU LUI AS RÉPONDU", said.join("<br>") + "<small>Porygon-Z a tout noté. En gras.</small>");
  } catch(e){}
  return out;
}
function creditsRollHtml(){
  const sec = (k, v) => `<div class="ccr-sec"><div class="ccr-k">${k}</div><div class="ccr-v">${v}</div></div>`;
  const team = Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>S.dex[b].lvl - S.dex[a].lvl || POKE[b].bst - POKE[a].bst).slice(0, 6);
  const days = Math.max(1, Math.floor((Date.now() - (S.created || Date.now())) / 864e5) + 1);
  return `<div class="ccr-title">POKÉMON<br><span>CODE</span> GENESIS</div>
    ${sec("L'ARCHIVISTE", esc(pzName()))}
    ${sec("PORYGON-Z", "dans son propre rôle<small>programme d'entretien, version instable — entrée n° 387</small>")}
    ${sec("MISSINGNO", esc(pzName()) + `<small>${esc(pzFmt("ton nom, lu de travers, {prev} fois"))}</small>`)}
    ${sec("PROF. RACINE", "trois phrases et demie")}
    ${sec("LES VERROUS", REGIONS.map(r=>r.guardians.map(g=>esc(g.name)).join(" · ")).join("<br>") + "<small>qui ont tenu les portes parce qu'on le leur avait demandé</small>")}
    ${(()=>{ const f = typeof histFaithful === "function" ? histFaithful() : null; if(!f) return "";
      const h = S.dex[f].h || {}, o = h.orig || h;
      return sec("LE PLUS FIDÈLE", `<div class="ccr-team">${sprBox(f, !!S.dex[f].shiny, 52)}</div>${esc(histName(f))}<small>${fmt(h.b)} combats${o && o.t ? " · arrivé le " + esc(histDay(o.t)) : ""}</small>`); })()}
    ${team.length ? sec("TON ÉQUIPE", `<div class="ccr-team">${team.map(id=>sprBox(id, !!(S.dex[id] && S.dex[id].shiny), 52)).join("")}</div><small>${team.map(id=>esc(POKE[id].name)).join(" · ")}</small>`) : ""}
    ${typeof RIVALS !== "undefined" ? sec("LES DRESSEURS RÉMANENTS", RIVALS.map(r=>esc(r.n)).join(" · ")) : ""}
    ${creditsAnswersHtml(sec)}
    ${sec("CE MONDE, EN CHIFFRES", `${fmt(S.stats.catches)} captures · ${dexTotal()} espèces · ${S.stats.shinies || 0} chromatique${(S.stats.shinies || 0) > 1 ? "s" : ""}
      <small>${days} jour${days > 1 ? "s" : ""} · connexion n° ${sagaConn()} · ${fmt(pzLineCount())} lignes dans choses_formidables.txt</small>`)}
    ${sec("SPRITES POKÉMON", "PokeAPI/sprites<small>données d'espèces : PokeAPI/pokeapi</small>")}
    ${sec("PORTRAITS ET SPRITES DE DONJON", "PMDCollab/SpriteCollab<small>licence CC BY-NC 4.0 — merci aux artistes de la communauté Pokémon Donjon Mystère</small>")}
    ${sec("UNE DETTE ASSUMÉE", "Balatro, de LocalThunk<small>pour la grammaire du Poké-Poker</small>")}
    ${sec("POKÉMON", "est une marque de Nintendo, Creatures Inc. et GAME FREAK inc.<small>Jeu de fan non officiel, sans but lucratif.</small>")}
    <div class="ccr-end">MERCI D'AVOIR JOUÉ.<small>Et d'avoir écrit.</small></div>`;
}

/* ============================================================
   LES CONNEXIONS SUIVANTES
   Après avoir effacé, il a tout oublié, et toi non. Après avoir écrit,
   c'est une copie de la sauvegarde d'origine, et il se souvient.
   ============================================================ */
function sagaPath(){ return (S.cycle && S.cycle.end) || "erase"; }
function sagaCycleBeat(){
  if(typeof cycleN !== "function" || cycleN() < 1) return null;
  const seen = id => (S.story || []).includes(id);
  if(sagaPath() === "write"){
    if(!seen("cy_w_open")) return "cy_w_open";
    if(!seen("cy_w_prof") && S.stats.catches >= 20) return "cy_w_prof";
  } else {
    if(!seen("cy_e_open")) return "cy_e_open";
    if(!seen("cy_e_page") && S.stats.catches >= 8) return "cy_e_page";
    if(!seen("cy_e_mid") && (S.integrity || 0) >= 45) return "cy_e_mid";
  }
  return null;
}

/* ============================================================
   LE GUIDE : le fichier se remplit, la Couche Zéro s'annonce
   ============================================================ */
if(typeof guideTick === "function"){
  const _gt = guideTick;
  guideTick = function(){
    const r = _gt.apply(this, arguments);
    try { pzLogTick(); if(typeof finaleAnnounceTick === "function") finaleAnnounceTick(); } catch(e){}
    return r;
  };
}

/* ============================================================
   HUMEUR
   ============================================================ */
if(typeof pzMood === "function"){
  const _pm = pzMood;
  pzMood = function(line){
    if(line && line.m && PZ_EMOS.includes(line.m)) return line.m;
    if(S && S.flags && S.flags.finalDone) return "Happy";
    if(S && S.flags && (S.flags.mnBeaten || S.flags.finalChoice)) return "Determined";
    return _pm(line);
  };
}
