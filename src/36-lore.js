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

function fragmentsFound(){ return (S.fragments || []).length; }
function fragmentReady(f){
  if((S.fragments || []).includes(f.id)) return false;
  if(f.at.dex !== undefined && dexTotal() < f.at.dex) return false;
  if(f.at.integ !== undefined && S.integrity < f.at.integ) return false;
  return true;
}
function checkFragments(){
  for(const f of FRAGMENTS){
    if(!fragmentReady(f)) continue;
    S.fragments = S.fragments || [];
    S.fragments.push(f.id);
    gain("shards", 15 + f.id * 3);
    save();
    showFragment(f);
    return true;
  }
  return false;
}
function showFragment(f){
  sheet(`<div class="fragment">
    <div class="fg-head">
      <span class="fg-ic">${ic("quest")}</span>
      <div><div class="fg-n">${esc(f.n)}</div>
        <div class="fg-w">${esc(f.who)} · ${fragmentsFound()} / ${FRAGMENTS.length}</div></div>
    </div>
    <div class="fg-body">${esc(f.t)}</div>
    <div class="fg-foot">Conservé dans le journal.</div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Refermer</button>
  </div>`);
  Sfx.wobble(); buzz(14);
}
ACTIONS.readfragment = d => {
  const f = FRAGMENTS.find(x=>x.id === +d.id);
  if(f && (S.fragments||[]).includes(f.id)) showFragment(f);
};

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

/* ---------- le journal accueille les fragments ---------- */
function fragmentsPanel(){
  const got = S.fragments || [];
  return `
    <div class="h sm" style="margin-top:12px">FRAGMENTS D'ARCHIVISTES
      <span class="tiny dim">${got.length}/${FRAGMENTS.length}</span></div>
    <div class="tiny muted" style="margin-bottom:7px">Onze personnes ont occupé ce poste avant vous.
      Aucune n'est là pour en parler. Ce qu'elles ont laissé se trouve en travaillant.</div>
    <div class="list">
      ${FRAGMENTS.map(f=>{
        const has = got.includes(f.id);
        return `<div class="item ${has?"":"sealed"}" ${has?`data-act="readfragment" data-id="${f.id}"`:""}>
          <div class="jn-ic">${ic(has?"quest":"lock")}</div>
          <div class="grow">
            <div class="t">${has ? esc(f.n) : "Fragment scellé"}</div>
            <div class="d">${has ? esc(f.who)
              : f.at.dex !== undefined ? `${f.at.dex} espèces archivées`
              : `${f.at.integ}% d'intégrité`}</div>
          </div>
          ${has?ic("arrow"):""}
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
