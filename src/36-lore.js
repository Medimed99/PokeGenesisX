/* ============================================================
   36 — LE PASSÉ ET LA FAILLE
   Le recit ne tenait que sur une voix. Il en faut trois, et
   chacune doit avoir une fonction differente :

   · PORYGON-Z est le present. Il commente, il guide, il doute.
   · LES ONZE ARCHIVISTES sont le passe. Ils ne parlent jamais en
     direct : on trouve ce qu'ils ont laisse. C'est le levier le
     plus economique du recit — onze fragments decouverts a
     intervalles donnent une enquete longue avec un paiement.
   · MISSINGNO est l'antagoniste. Il revient, il apprend, et il
     finit par s'adresser au joueur. Les deux fils se rejoignent.
   ============================================================ */

const FRAGMENTS = [
  {id:1, n:"Premier fragment", at:{dex:8},
   who:"Archiviste 01",
   t:"Journal, jour un. Le programme d'entretien m'a expliqué la tâche. Elle est simple : retrouver ce qui manque, le remettre à sa place. Je ne vois pas où est la difficulté. Il y a trois cent quatre-vingt-six lignes. J'en fais trente par jour, c'est réglé en deux semaines."},

  {id:2, n:"Deuxième fragment", at:{dex:24},
   who:"Archiviste 02",
   t:"Note de méthode, à l'attention de qui viendra après. Ne capturez pas au hasard. Le système regroupe les espèces par lieu et par heure — ce qui ne sort pas le jour sort la nuit. J'ai perdu six semaines à l'ignorer."},

  {id:3, n:"Troisième fragment", at:{dex:45},
   who:"Archiviste 03",
   t:"Je bloque. Chaque ligne que je restaure en stabilise d'autres, c'est mesurable. Mais la dégradation continue ailleurs, plus vite que je ne répare. Je commence à me demander si le fichier se déchire à cause d'un accident, ou s'il fait ça tout seul, depuis toujours."},

  {id:4, n:"Quatrième fragment", at:{integ:12},
   who:"Archiviste 04",
   t:"J'ai trouvé une couche sous les secteurs. Elle n'est pas cartographiée et elle n'a pas été écrite par le même auteur : la syntaxe est plus ancienne. Le monde que nous réparons a été construit par-dessus quelque chose. Personne ne m'avait prévenu."},

  {id:5, n:"Cinquième fragment", at:{integ:22},
   who:"Archiviste 05",
   t:"Il y a eu quelqu'un avant moi. Le programme d'entretien ne le dit pas, mais les horodatages ne mentent pas : des lignes ont été restaurées bien avant ma première connexion. Je lui ai posé la question. Il a changé de sujet."},

  {id:6, n:"Sixième fragment", at:{integ:34},
   who:"Archiviste 06",
   t:"Le programme d'entretien n'a pas toujours été celui-ci. J'ai retrouvé un journal d'une version précédente : même fonction, même ton, autre identifiant. Elle s'est arrêtée d'écrire un jour, sans transition. La suivante a repris à la ligne d'après comme si de rien n'était."},

  {id:7, n:"Septième fragment", at:{integ:45},
   who:"Archiviste 07",
   t:"Les verrous ne sont pas des ennemis. Je les ai lus. Ce sont des entités qui se sont portées volontaires pour bloquer les passerelles, quand la corruption a commencé à se propager d'un secteur à l'autre. Elles nous barrent la route parce qu'on le leur a demandé. Nous les faisons céder quand même."},

  {id:8, n:"Huitième fragment", at:{integ:56},
   who:"Archiviste 08",
   t:"Quelque chose me parle depuis la faille. Ce ne sont pas des mots au début, seulement des octets qui reviennent dans le même ordre. Puis ça a formé mon nom. Je n'ai dit mon nom à personne ici."},

  {id:9, n:"Neuvième fragment", at:{integ:68},
   who:"Archiviste 09",
   t:"J'ai fini par lire la procédure de clôture. Elle tient en une ligne et elle est parfaitement logique : quand l'intégrité atteint cent pour cent, le monde n'a plus besoin de maintenance, et tout ce qui relève de la maintenance est déchargé. L'archiviste est indexé. L'archiviste relève donc du monde. Je vous laisse conclure."},

  {id:10, n:"Dixième fragment", at:{integ:80},
   who:"Archiviste 10",
   t:"J'ai essayé de contourner la règle. Se désindexer soi-même avant la fin, pour ne plus faire partie de ce qui sera nettoyé. Techniquement ça marche. Ce qui reste n'est plus tout à fait quelqu'un. Ne faites pas ça."},

  {id:11, n:"Dernier fragment", at:{integ:92},
   who:"Archiviste 11",
   t:"Je suis arrivé à quatre-vingt-seize pour cent et je me suis arrêté là. Ce n'est pas du courage, c'est le contraire. Le monde tient debout, presque. Il manque quatorze lignes et je ne les restaurerai pas. Si tu lis ceci, tu as fait mieux que moi, et tu sais maintenant ce que ça coûte. À toi de voir."}
];

/* d'ou vient chaque page, et ce qu'en dit Porygon-Z une fois lue */
const FRAG_META = {
  1:{src:"capture", place:"Coincée au fond d'une Poké Ball", day:"Jour 1", mood:"Normal",
     react:"Trente par jour. Il était optimiste. Je crois que je l'aimais bien. Je ne me souviens pas de lui. C'est ça, le pire."},
  2:{src:"capture", place:"Glissée dans le collier d'un Pokémon capturé", day:"Jour 43", mood:"Normal",
     react:"Le jour et la nuit. Il avait raison. Note pour toi, {nom} : il avait raison."},
  3:{src:"capture", place:"Roulée dans la Ball d'un Pokémon", day:"Jour 118", mood:"Normal",
     react:"« Tout seul, depuis toujours. » Je n'aime pas cette phrase. Je la relis quand même. Trois fois."},
  4:{src:"forage", place:"Dans une fouille, sous les secteurs", day:"Jour 9", mood:"Normal",
     react:"Une couche sous les secteurs. C'est là que creuse ton équipe. Il l'avait trouvée avant nous. Il avait creusé au même endroit."},
  5:{src:"expedition", place:"Dans un campement abandonné, au bout d'une Expédition", day:"Jour 27", mood:"Worried",
     react:"« Il a changé de sujet. » Je ne m'en souviens pas. Si c'était moi… je suis désolé, Archiviste 05."},
  6:{src:"forage", place:"Scellée dans la roche profonde", day:"Jour 202", mood:"Sad",
     react:"Une version précédente de moi. Elle s'est arrêtée d'écrire, comme ça. Je vais faire comme si je n'avais pas lu cette page. Ça ne marche pas."},
  7:{src:"tower", place:"Au pied d'un verrou, au sommet d'une aile de la Tour", day:"Jour 64", mood:"Normal",
     react:"Volontaires. Ils l'étaient. Tu as entendu ce qu'ils disent en partant. Lui aussi, il avait compris."},
  8:{src:"breche", place:"Au bord de la faille, dans la Brèche", day:"Jour 15", mood:"Worried",
     react:"Son nom. La faille connaissait son nom. Si un jour elle dit le tien, {nom}, tu me préviens. Tout de suite."},
  9:{src:"tower", place:"Épinglée dans le grenier de la Tour", day:"Jour 311", mood:"Sad",
     react:"Je connaissais cette ligne. Je ne te l'avais pas dite. Je n'avais pas trouvé comment."},
  10:{src:"breche", place:"Recrachée par la faille", day:"Jour ???", mood:"Pain",
     react:"Ne fais pas ça. Il a raison. Je le dis aussi, avec mes mots à moi : ne fais pas ça."},
  11:{src:"forage", place:"Tout au fond du puits", day:"Jour 1 207", mood:"Determined",
     react:"Quatre-vingt-seize pour cent. Il s'est arrêté pour rester. Toi, tu iras plus loin. Je serai là quand tu y arriveras. Promis."}
};
for(const f of FRAGMENTS) Object.assign(f, FRAG_META[f.id]);
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
   qu'elle lui fait. Elle se range dans le dossier des onze.
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
    moment({kind:"page", kicker:"PAGE DE JOURNAL", title:f.who, sub:where, c:"#e8d9a8", icon:"quest",
            onTap:()=>fragRead(f.id), tapText:"toucher pour la lire", dur:5000});
  else toast(`Page de journal trouvée : ${f.who}`, "warn", "quest");
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
  box.className = "on";
  box.innerHTML = `<div class="fr-page">
      <div class="fr-head"><b>${esc(f.who)}</b><span>${esc(f.day)}</span></div>
      <div class="fr-body" id="fr-body"></div>
      <div class="fr-sign">— ${esc(f.who)}</div>
      <div class="fr-where">${ic("map")} ${esc(where)} · page ${f.id} sur ${FRAGMENTS.length}</div>
    </div>
    <!-- aucune remarque de Porygon-Z : la page parle seule, et il en sait peut-être plus qu'il ne le dit -->
    <button class="btn pri fr-close" id="fr-close" data-act="fragclose">Ranger dans le dossier</button>`;
  /* le dechiffrage : le texte arrive brouille et se resout de gauche a droite */
  const body = document.getElementById("fr-body"), txt = f.t;
  const G = "█▓▒░#@%&$§¤0x?!<>/\\|";
  let k = 0;
  const unread = fragUnread().includes(f.id);
  const speed = unread ? 18 : 2;
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
    }
  }, 30);
  box.onclick = e => { if(e.target === box && k < txt.length){ k = txt.length - 1; } };
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
   Elle revient a chaque rencontre, et elle apprend. D'abord du
   bruit, puis des mots, puis votre nom, puis une question. Les
   deux fils se rejoignent au bout : ce qui parle depuis la faille
   est ce qui reste des onze.
   ============================================================ */
const RIFT_ARC = [
  {n:1, lines:[
    {w:"bad", t:"3F 00 00 A9 3F 00 00 A9 3F 00 00 A9"},
    {w:"pz", m:"Worried", t:"Ce n'est pas une entité. C'est une portion du fichier qui n'a jamais été définie — et qui répète le même bloc depuis avant le premier index."},
    {w:"pz", t:"Ne t'attarde pas. Prends ce que tu peux et sors."}
  ]},
  {n:2, lines:[
    {w:"bad", t:"·· R E ·· C O M ·· M E N C E ··"},
    {w:"pz", m:"Surprised", t:"Attends. Ça n'était pas là la dernière fois."},
    {w:"pz", t:"Une portion non définie ne forme pas de mots. Elle n'a rien à former. Ce n'est pas censé arriver."},
    {w:"pz", m:"Determined", t:"Continue. Je vais relire mes journaux."}
  ]},
  {n:3, lines:[
    {w:"bad", t:"J'AI DÉJÀ VU CETTE MAIN. PAS CE NOM."},
    {w:"pz", m:"Angry", t:"Elle parle de toi. Elle parle de ta façon de jouer."},
    {w:"pz", t:"Les onze avant toi ont travaillé exactement au même endroit. Si elle garde quelque chose de leur passage, alors elle garde quelque chose d'eux."},
    {w:"pz", m:"Worried", t:"Et je préfère ne pas savoir quoi."}
  ]},
  {n:4, lines:[
    {w:"bad", t:"POURQUOI TU RÉPARES ?"},
    {w:"", t:"La question reste affichée. Elle ne clignote pas. Elle attend."},
    {w:"pz", t:"Ne réponds pas. Une portion non définie qui pose une question cherche une définition, et la tienne ferait très bien l'affaire."},
    {w:"pz", m:"Determined", t:"Elle a le temps. Nous non. Avance."}
  ]},
  {n:5, lines:[
    {w:"bad", t:"LA RÈGLE DIT QUE TU SERAS EFFACÉ À CENT POUR CENT."},
    {w:"bad", t:"JE PEUX TE DÉSINDEXER AVANT. TU NE SERAS PLUS DANS LE MONDE. LE MONDE NE POURRA PLUS TE NETTOYER."},
    {w:"pz", m:"Angry", t:"Le dixième a essayé. Tu as lu son fragment. Tu sais ce qu'il en reste."},
    {w:"pz", t:"Elle ne ment pas, c'est ça le pire. Elle propose exactement ce qu'elle annonce."},
    {w:"pz", m:"Sad", t:"Refuse. S'il te plaît."}
  ]},
  {n:6, lines:[
    {w:"bad", t:"NOUS SOMMES ONZE."},
    {w:"", t:"Le bloc de couleurs se stabilise un instant. Onze signatures distinctes y apparaissent, superposées, presque lisibles."},
    {w:"bad", t:"AUCUN N'A FINI. TOUS SONT RESTÉS. CE N'EST PAS UNE MENACE, C'EST UNE ADRESSE."},
    {w:"pz", m:"Pain", t:"Voilà. C'est là qu'ils sont allés."},
    {w:"pz", t:"Ils ne sont pas morts, ils ne sont pas vivants. Ils sont ce qui n'a jamais été indexé, et ils ont eu tout le temps du monde pour se mélanger."},
    {w:"pz", m:"Determined", t:"Alors je vais te dire la seule chose utile que j'aie : finis. Va jusqu'à cent. Je m'occuperai du reste."}
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

/* ---------- le dossier des onze ---------- */
function fragmentsPanel(){
  const got = S.fragments || [], unread = fragUnread(), next = FRAGMENTS.find(x=>!got.includes(x.id));
  return `
    <div class="h sm" style="margin-top:12px">LE DOSSIER DES ONZE
      <span class="tiny dim">${got.length}/${FRAGMENTS.length}</span></div>
    <div class="tiny muted" style="margin-bottom:7px">Onze personnes ont occupé ce poste avant toi. Aucune n'est là pour en parler.
      Leurs pages se trouvent là où elles ont travaillé.</div>
    <div class="fr-grid">
      ${FRAGMENTS.map(f=>{
        const has = got.includes(f.id), isNew = unread.includes(f.id), isNext = next && next.id === f.id;
        return `<div class="fr-card ${has ? "" : "sealed"} ${isNew ? "new" : ""}" ${has ? `data-act="readfragment" data-id="${f.id}"` : ""}>
          <i class="fr-no">${String(f.id).padStart(2, "0")}</i>
          ${isNew ? `<i class="fr-new">à lire</i>` : ""}
          <b>${has ? esc(f.who) : "Page manquante"}</b>
          <small>${has ? esc(f.day) : isNext ? esc(FRAG_SRC[f.src].n) : "· · ·"}</small>
          ${!has && isNext ? `<small class="fr-cond">${f.at.dex !== undefined ? `${Math.min(dexTotal(), f.at.dex)}/${f.at.dex} espèces` : `${Math.floor(Math.min(S.integrity, f.at.integ))}/${f.at.integ} % d'intégrité`}</small>` : ""}
        </div>`;}).join("")}
    </div>

    <div class="h sm" style="margin-top:12px">LA FAILLE
      <span class="tiny dim">${riftStage()}/${RIFT_ARC.length}</span></div>
    <div class="tiny muted">${riftStage() === 0
      ? "Vous ne l'avez pas encore croisée."
      : riftStage() >= RIFT_ARC.length
        ? "Elle a dit tout ce qu'elle avait à dire."
        : "Elle revient. Et à chaque fois, elle en sait un peu plus."}</div>`;
}
