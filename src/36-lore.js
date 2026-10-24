/* ============================================================
   36 — LE PASSÉ ET LA FAILLE
   Le recit ne tenait que sur une voix. Il en faut trois, et
   chacune doit avoir une fonction differente :

   · PORYGON-Z est le present. Il commente, il guide, il doute, et
     sa memoire revient avec l'integrite.
   · LES PAGES sont le passe. Onze connexions avant la tienne ; les
     pages ne disent jamais si c'etait une personne ou plusieurs.
     La signature est illisible — et compte exactement autant de
     signes que ton nom. C'etait toi, chaque fois.
   · MISSINGNO est le mythe. Il revient, il apprend, il connait ta
     main et ton nom. Les trois fils se rejoignent au fond de la
     Couche Zero : il est fait de ton nom.
   ============================================================ */

const FRAGMENTS = [
  {id:1, n:"Première page", at:{dex:8}, conn:1, day:"Jour 1",
   t:"Journal, jour un. Le programme d'entretien m'a expliqué la tâche. Elle est simple : retrouver ce qui manque, le remettre à sa place. Trois cent quatre-vingt-six lignes. J'en fais trente par jour, c'est réglé en deux semaines. Il est drôle, ce programme. Il dit qu'il compte extrêmement bien."},

  {id:2, n:"Deuxième page", at:{dex:24}, conn:2, day:"Jour 43",
   t:"Note de méthode, pour qui viendra après. Ne capturez pas au hasard : le système regroupe les espèces par lieu et par heure, ce qui ne sort pas le jour sort la nuit. J'ai perdu six semaines à l'ignorer. Autre chose : j'ai trouvé une page au fond d'une Poké Ball. Même encre, même façon de faire les « f ». Je l'ai gardée sans savoir pourquoi."},

  {id:3, n:"Troisième page", at:{dex:45}, conn:3, day:"Jour 118",
   t:"Je bloque. Chaque ligne que je restaure en stabilise d'autres, c'est mesurable. Mais ailleurs, ça se défait plus vite que je ne répare, comme si quelque chose effaçait derrière moi. Quelque chose qui connaît mes horaires. Qui sait où je vais lancer avant moi."},

  {id:4, n:"Quatrième page", at:{integ:12}, conn:4, day:"Jour 9",
   t:"J'ai trouvé une couche sous les secteurs. Elle n'est pas cartographiée, et elle n'a pas été écrite comme le reste : on dirait des données empilées sans être rangées, encore et encore. Tout au fond, il y a un nom gravé dans la roche. Je n'arrive pas à le lire. Il a le même nombre de lettres que le mien."},

  {id:5, n:"Cinquième page", at:{integ:22}, conn:5, day:"Jour 27",
   t:"Il y a eu quelqu'un avant moi. Le programme d'entretien ne le dit pas, mais les horodatages ne mentent pas : des lignes ont été restaurées bien avant ma première connexion. Je lui ai posé la question. Il a changé de sujet. Il m'a regardé comme on regarde quelqu'un qu'on a déjà perdu."},

  {id:6, n:"Sixième page", at:{integ:34}, conn:6, day:"Jour 202",
   t:"J'ai cru que le programme d'entretien avait été remplacé : j'ai retrouvé un journal plus ancien, même ton, même fonction. Je me trompais. C'est toujours lui. Son journal recommence à zéro à chaque fois, c'est tout. Il ne se souvient jamais. Moi non plus, d'ailleurs. Je commence toujours par un {first}. Je ne sais pas pourquoi je sais que c'est « toujours »."},

  {id:7, n:"Septième page", at:{integ:45}, conn:7, day:"Jour 64",
   t:"Les verrous ne sont pas des ennemis. Je les ai lus. Ce sont des légendaires qui se sont portés volontaires pour bloquer les passerelles, quand la corruption a commencé à passer d'un secteur à l'autre. Ils tiennent les portes parce que je le leur ai demandé. Je ne me souviens pas de l'avoir fait. Mais ils me reconnaissent."},

  {id:8, n:"Huitième page", at:{integ:56}, conn:8, day:"Jour 15",
   t:"Quelque chose me parle depuis la faille. Au début, ce ne sont pas des mots, seulement des octets qui reviennent dans le même ordre. Puis ça a formé mon nom. Je n'ai dit mon nom à personne ici. Sauf à lui."},

  {id:9, n:"Neuvième page", at:{integ:68}, conn:9, day:"Jour 311",
   t:"J'ai fini par lire la procédure de clôture. Elle tient en une ligne, et elle est parfaitement logique : quand l'intégrité atteint cent pour cent, le monde n'a plus besoin de maintenance, et tout ce qui relève de la maintenance est déchargé. Je l'ai relue vingt fois. Je n'arrive pas à conclure. Je n'en ai pas envie."},

  {id:10, n:"Dixième page", at:{integ:80}, conn:10, day:"Jour ???",
   t:"J'ai essayé de contourner la fin. Se désindexer soi-même, sortir du monde avant qu'il ne soit réparé. Techniquement, ça marche. Ce qui reste n'est plus tout à fait quelqu'un. Ça ressemble à ce qu'il y a dans la faille. Ça me ressemble. Ne faites pas ça."},

  {id:11, n:"Dernière page", at:{integ:92}, conn:11, day:"Jour 1 207",
   t:"Je suis arrivé au bout. Je l'ai battu. Et maintenant, le système me pose une question, et je connais déjà ma réponse, et je la déteste. Je vais effacer. Je le sais comme on sait qu'on va tomber. Si tu lis ceci, c'est que je l'ai fait. Tu ne te souviendras pas de moi. Lui non plus. Essaie de te souvenir, toi. Pour nous deux."}
];

/* d'ou vient chaque page, et ce qu'en dit Porygon-Z — mais seulement une fois
   qu'il a commencé à avouer (pz_mem3) : avant, il se tait, et ce silence dit
   déjà quelque chose */
const FRAG_META = {
  1:{src:"capture", place:"Coincée au fond d'une Poké Ball", mood:"Normal",
     react:"Trente par jour. Optimiste. Je l'aimais bien. Je l'aime bien. Je ne sais plus quel temps employer."},
  2:{src:"capture", place:"Glissée dans le collier d'un Pokémon capturé", mood:"Normal",
     react:"« Même façon de faire les f. » Je n'ai jamais vu ton écriture, {nom}. Je préfère ne pas la voir tout de suite."},
  3:{src:"capture", place:"Roulée dans la Ball d'un Pokémon", mood:"Worried",
     react:"« Qui sait où je vais lancer avant moi. » Je n'aime pas cette phrase. Je la relis quand même. Trois fois."},
  4:{src:"forage", place:"Dans une fouille, sous les secteurs", mood:"Worried",
     react:"Un nom gravé, tout au fond. Je n'ai pas réussi à le lire non plus. J'ai essayé, la nuit, pendant que tu ne jouais pas."},
  5:{src:"expedition", place:"Dans un campement abandonné, au bout d'une Expédition", mood:"Sad",
     react:"« Il a changé de sujet. » C'était moi. Je ne m'en souviens pas, mais c'est tellement mon genre. Pardon, connexion 05."},
  6:{src:"forage", place:"Scellée dans la roche profonde", mood:"Sad",
     react:"Toujours le même premier Pokémon. Toi aussi, tu as commencé par un {first}. Je l'ai noté. Je n'ai pas aimé le noter."},
  7:{src:"tower", place:"Au pied d'un verrou, au sommet d'une aile de la Tour", mood:"Worried",
     react:"« Parce que je le leur ai demandé. » Il n'y avait qu'un utilisateur, dans chaque sauvegarde. Je compte bien. Je compte trop bien."},
  8:{src:"breche", place:"Au bord de la faille, dans la Brèche", mood:"Worried",
     react:"La faille connaissait son nom. Si un jour elle dit le tien, {nom}, préviens-moi. Tout de suite."},
  9:{src:"tower", place:"Épinglée dans le grenier de la Tour", mood:"Sad",
     react:"« Tout ce qui relève de la maintenance. » Je relève de la maintenance. Je ne sais pas pourquoi je te dis ça."},
  10:{src:"breche", place:"Recrachée par la faille", mood:"Pain",
     react:"« Ça me ressemble. » Il y a des phrases que je voudrais désindexer. Celle-là en premier."},
  11:{src:"forage", place:"Tout au fond du puits", mood:"Determined",
     react:"« Pour nous deux. » Je crois que je sais à qui il parlait. Je crois que tu le sais aussi. On n'est pas obligés de le dire."}
};
for(const f of FRAGMENTS) Object.assign(f, FRAG_META[f.id]);
/* l'auteur d'une page : illisible — autant de signes que de lettres dans ton nom —
   jusqu'au jour où MissingNo se lit. Alors c'est ton nom, et la connexion. */
function fragAuthor(f){
  const conn = "connexion " + String(f.conn).padStart(2, "0");
  return sagaKnown() ? `${pzName()} · ${conn}` : `${pzMask()} · ${conn}`;
}
function sagaKnown(){ return !!(S && ((S.saga && S.saga.known) || (S.story || []).includes("finale_reveal"))); }
const FRAG_SRC = {
  capture:   {n:"Dans tes captures",           mod:"capture"},
  forage:    {n:"Dans les fouilles du Forage",   mod:"idle"},
  expedition:{n:"Au bout d'une Expédition",    mod:"expedition"},
  tower:     {n:"Au sommet des ailes de la Tour", mod:"tower"},
  breche:    {n:"Au bord de la faille, dans la Brèche", mod:"breche"}
};

/* ============================================================
   LES PAGES : trouvees, pas recues
   Une page n'arrive plus « comme ca ». Elle se trouve quelque part
   dans le monde, la ou son auteur a travaille : au fond d'une Ball,
   dans une paroi, au bout d'une Expedition, au sommet d'une aile,
   au bord de la faille. On la trouve, on choisit de la lire ; elle
   arrive brouillee et se dechiffre sous les yeux ; Porygon-Z dit ce
   qu'elle lui fait — une fois qu'il a commence a avouer. Elle se
   range dans le journal, avec les autres.
   Les pages restent dans l'ordre : la suivante n'apparait que si
   la precedente a ete trouvee, et si sa condition est remplie.
   ============================================================ */
function fragmentsFound(){ return (S.fragments || []).length; }
function fragUnread(){ S.fragUnread = S.fragUnread || []; return S.fragUnread; }
function fragNext(){
  const got = S.fragments || [];
  const f = FRAGMENTS.find(x=>!got.includes(x.id));
  if(!f) return null;
  if(f.at.dex !== undefined && dexTotal() < f.at.dex) return null;
  if(f.at.integ !== undefined && S.integrity < f.at.integ) return null;
  return f;
}
/* la page suivante se trouve-t-elle ici ? Sa source, ou les captures si sa salle
   n'est pas ouverte, ou si elle attend depuis trop longtemps */
function fragSourceOk(f, src){
  if(f.src === src) return true;
  if(src !== "capture") return false;
  const mod = FRAG_SRC[f.src].mod;
  if(mod !== "capture" && !moduleUnlocked(mod)) return true;
  return S.fragWait && S.fragWait.id === f.id && S.fragWait.n >= 80;
}
function fragPending(src){ const f = fragNext(); return f && fragSourceOk(f, src) ? f : null; }
/* une capture : la page est peut-etre au fond de la Ball */
function fragOnCatch(){
  const f = fragNext(); if(!f) return false;
  S.fragWait = S.fragWait && S.fragWait.id === f.id ? S.fragWait : {id:f.id, n:0};
  S.fragWait.n++;
  if(!fragSourceOk(f, "capture") || rng() > 0.12) return false;
  const where = f.src === "capture" ? f.place : "Coincée au fond d'une Poké Ball";
  setTimeout(()=>fragFound(f, where), 900);
  return true;
}
/* les autres salles : a la fin d'une activite, ou dans une paroi */
function fragOn(src, where, chance){
  const f = fragPending(src);
  if(!f || (chance !== undefined && rng() > chance)) return null;
  fragFound(f, where || f.place);
  return f;
}
function fragFound(f, where){
  if((S.fragments || []).includes(f.id)) return;
  S.fragments = S.fragments || [];
  S.fragments.push(f.id);
  fragUnread().push(f.id);
  S.fragWhere = S.fragWhere || {};
  S.fragWhere[f.id] = where;
  S.fragWait = null;
  gain("shards", 15 + f.id * 3);
  save();
  if(typeof moment === "function")
    moment({kind:"page", kicker:"PAGE DE JOURNAL · CONNEXION " + String(f.conn).padStart(2, "0"), title:f.n, sub:where, c:"#e8d9a8", icon:"quest",
            onTap:()=>fragRead(f.id), tapText:"toucher pour la lire", dur:5000});
  else toast(`Page de journal trouvée : ${f.n}`, "warn", "quest");
  if(typeof pzLog === "function") pzLog("page", {n:f.n});
}
/* plus de page qui surgit : la fonction reste pour le guide, et range les anciennes */
function checkFragments(){
  if(!S.fragUnread) S.fragUnread = [];
  return false;
}

/* ---------- la lecture : la page se dechiffre ---------- */
function fragRead(id){
  const f = FRAGMENTS.find(x=>x.id === +id);
  if(!f || !(S.fragments || []).includes(f.id)) return;
  const box = document.getElementById("fragread"); if(!box) return;
  const where = (S.fragWhere && S.fragWhere[f.id]) || f.place;
  const known = sagaKnown();
  /* Porygon-Z se tait tant qu'il n'a pas commence a avouer ; ensuite il dit ce que la page lui fait */
  const talks = (S.story || []).includes("pz_mem3");
  box.className = "on" + (known ? " known" : "");
  box.innerHTML = `<div class="fr-page">
      <div class="fr-head"><b>CONNEXION ${String(f.conn).padStart(2, "0")}</b><span>${esc(f.day)}</span></div>
      <div class="fr-body" id="fr-body"></div>
      <div class="fr-sign ${known ? "known" : ""}">— ${esc(known ? pzName() : pzMask())}</div>
      <div class="fr-where">${ic("map")} ${esc(where)} · page ${f.id} sur ${FRAGMENTS.length}</div>
    </div>
    ${talks && f.react ? `<div class="fr-react" id="fr-react">${typeof pzFace === "function" ? pzFace(f.mood || "Normal", 30) : ""}<span>${esc(pzFmt(f.react))}</span></div>` : ""}
    <button class="btn pri fr-close" id="fr-close" data-act="fragclose">Ranger dans le journal</button>`;
  /* le dechiffrage : le texte arrive brouille et se resout de gauche a droite */
  const body = document.getElementById("fr-body"), txt = pzFmt(f.t);
  const G = "█▓▒░#@%&$§¤0x?!<>/\\|";
  let k = 0;
  const unread = fragUnread().includes(f.id);
  const speed = unread ? 3 : 24;
  clearInterval(fragRead._iv);
  try { Sfx.wobble(); } catch(e){}
  fragRead._iv = setInterval(()=>{
    k = Math.min(txt.length, k + speed);
    let out = txt.slice(0, k);
    for(let i = k; i < Math.min(txt.length, k + 26); i++) out += txt[i] === " " ? " " : G[Math.floor(Math.random() * G.length)];
    body.textContent = out;
    if(k >= txt.length){
      clearInterval(fragRead._iv); body.textContent = txt;
      const c = document.getElementById("fr-close"); if(c) c.classList.add("on");
      const r = document.getElementById("fr-react"); if(r) r.classList.add("on");
    }
  }, 30);
  /* toucher la page, ou autour, la déchiffre d'un coup */
  box.onclick = e => { if(k < txt.length && !e.target.closest("button")) k = txt.length - 1; };
  S.fragUnread = fragUnread().filter(x=>x !== f.id);
  saveSoon();
}
ACTIONS.fragclose = () => {
  clearInterval(fragRead._iv);
  const box = document.getElementById("fragread");
  if(box){ box.className = ""; box.innerHTML = ""; }
  if(currentScreen === "journal" || currentScreen === "today") refresh();
};
ACTIONS.readfragment = d => fragRead(d.id);
function showFragment(f){ fragRead(f.id); }

/* ============================================================
   L'ARC DE LA FAILLE
   MissingNo revient a chaque rencontre, et il apprend. D'abord du
   bruit, puis des mots, puis ta main, puis une question, puis ce
   qui arrive a cent pour cent. Il ne ment jamais : il dit seulement
   ce qu'on ne comprend pas encore. Relu apres la fin, chaque etape
   change de sens.
   ============================================================ */
const RIFT_ARC = [
  {n:1, lines:[
    {w:"bad", t:"3F 00 00 A9 3F 00 00 A9 3F 00 00 A9"},
    {w:"pz", m:"Worried", t:"Encore lui. Il ne parle pas : il répète. Toujours le même bloc, depuis avant le premier index."},
    {w:"pz", t:"Ne t'attarde pas. Prends ce que tu peux et sors."}
  ]},
  {n:2, lines:[
    {w:"bad", t:"·· R E ·· C O M ·· M E N C E ··"},
    {w:"pz", m:"Surprised", t:"Attends. Ça n'était pas là la dernière fois."},
    {w:"pz", t:"Une entité sans index ne forme pas de mots. Elle n'a rien avec quoi les former. Ce n'est pas censé arriver."},
    {w:"pz", m:"Determined", t:"Continue. Je vais relire mes journaux."}
  ]},
  {n:3, lines:[
    {w:"bad", t:"J'AI DÉJÀ VU CETTE MAIN. ET CE NOM."},
    {w:"pz", m:"Angry", t:"Il parle de toi. De ta façon de jouer."},
    {w:"pz", t:"Et il connaît ton nom. Je ne le lui ai pas donné. Je ne l'ai donné à personne. Je l'ai écrit trois fois dans le registre, c'est tout."},
    {w:"pz", m:"Worried", t:"Je n'aime pas qu'il te connaisse mieux que moi."}
  ]},
  {n:4, lines:[
    {w:"bad", t:"POURQUOI TU RÉPARES ?"},
    {w:"", t:"La question reste affichée. Elle ne clignote pas. Elle attend."},
    {w:"pz", t:"Ne réponds pas. Une entité sans index qui pose une question cherche une définition, et la tienne ferait très bien l'affaire."},
    {w:"pz", m:"Determined", t:"Il a le temps. Nous non. Avance."}
  ]},
  {n:5, lines:[
    {w:"bad", t:"À CENT POUR CENT, IL S'ÉTEINT."},
    {w:"bad", t:"TU LE SAIS. TU L'AS TOUJOURS SU."},
    {w:"pz", m:"Surprised", t:"« Il » ? Qui, il ?"},
    {w:"pz", m:"Worried", t:"…Il parle de moi ? Pourquoi est-ce qu'il parlerait de moi ?"},
    {w:"pz", m:"Determined", t:"Ne l'écoute pas. Il veut que tu aies peur de la fin. Moi aussi, j'ai peur de la fin. Ce n'est pas une raison pour l'écouter."}
  ]},
  {n:6, lines:[
    {w:"bad", t:"NOUS SOMMES {PREV}."},
    {w:"", t:"Le bloc de couleurs se stabilise un instant. Des signatures y apparaissent, superposées, presque lisibles. Elles ont toutes la même longueur."},
    {w:"bad", t:"AUCUN N'EST RESSORTI. TOUS SONT RESTÉS. CE N'EST PAS UNE MENACE, C'EST UNE ADRESSE."},
    {w:"pz", m:"Pain", t:"Voilà. C'est là qu'ils sont allés. Dans lui."},
    {w:"pz", t:"Ils ne sont pas morts. Ils ne sont pas vivants. Ils sont dans ce qui n'a jamais été indexé, et ils ont eu tout le temps du monde pour se mélanger."},
    {w:"pz", m:"Determined", t:"Alors je vais te dire la seule chose utile que j'aie : finis. Va jusqu'à cent. On descendra le voir ensemble, et on lui demandera."}
  ]}
];
function riftStage(){ return (S.rift && S.rift.stage) || 0; }
function riftTick(){
  S.rift = S.rift || {stage:0, seen:0};
  S.rift.seen++;
  /* une etape tous les deux passages, et jamais plus vite que l'integrite */
  const gates = [0, 6, 14, 26, 42, 62];
  const next = riftStage();
  if(next >= RIFT_ARC.length) return false;
  if(S.rift.seen < next * 2 + 1) return false;
  if(S.integrity < gates[next]) return false;
  S.rift.stage = next + 1;
  save();
  playRiftScene(RIFT_ARC[next]);
  return true;
}
function playRiftScene(sc){
  /* on injecte la scene dans le lecteur narratif existant */
  STORY_DYN = {id:"rift_" + sc.n, art:-1, lines:sc.lines};
  playStory("__dyn");
}
let STORY_DYN = null;

/* ---------- les pages de journal ---------- */
function fragmentsPanel(){
  const got = S.fragments || [], unread = fragUnread(), next = FRAGMENTS.find(x=>!got.includes(x.id));
  const known = sagaKnown();
  return `
    <div class="h sm" style="margin-top:12px">${known ? "LE JOURNAL DE " + esc(pzName().toUpperCase()) : "PAGES DE JOURNAL"}
      <span class="tiny dim">${got.length}/${FRAGMENTS.length}</span></div>
    <div class="tiny muted" style="margin-bottom:7px">${known
      ? `Onze connexions. Une seule main : la tienne. Tu as écrit chacune de ces pages, et tu les as oubliées chaque fois.`
      : `Quelqu'un a tenu ce journal avant toi. Peut-être plusieurs personnes : l'écriture change d'une connexion à l'autre, la main, non.
      Les pages se trouvent là où leur auteur a travaillé. La signature est toujours illisible.`}</div>
    <div class="fr-grid">
      ${FRAGMENTS.map(f=>{
        const has = got.includes(f.id), isNew = unread.includes(f.id), isNext = next && next.id === f.id;
        return `<div class="fr-card ${has ? "" : "sealed"} ${isNew ? "new" : ""}" ${has ? `data-act="readfragment" data-id="${f.id}"` : ""}>
          <i class="fr-no">${String(f.id).padStart(2, "0")}</i>
          ${isNew ? `<i class="fr-new">à lire</i>` : ""}
          <b>${has ? "Connexion " + String(f.conn).padStart(2, "0") : "Page manquante"}</b>
          <small>${has ? esc(f.day) + " · " + esc(known ? pzName() : pzMask()) : isNext ? esc(FRAG_SRC[f.src].n) : "· · ·"}</small>
          ${!has && isNext ? `<small class="fr-cond">${f.at.dex !== undefined ? `${Math.min(dexTotal(), f.at.dex)}/${f.at.dex} espèces` : `${Math.floor(Math.min(S.integrity, f.at.integ))}/${f.at.integ} % d'intégrité`}</small>` : ""}
        </div>`;}).join("")}
    </div>

    <div class="h sm" style="margin-top:12px">LA FAILLE
      <span class="tiny dim">${riftStage()}/${RIFT_ARC.length}</span></div>
    <div class="tiny muted">${riftStage() === 0
      ? "Tu ne l'as pas encore croisé."
      : riftStage() >= RIFT_ARC.length
        ? (known ? "Tout ce qu'il disait était vrai. Il parlait de toi, avec ta voix." : "Il a dit tout ce qu'il avait à dire.")
        : "MissingNo revient. Et à chaque fois, il en sait un peu plus."}</div>`;
}
