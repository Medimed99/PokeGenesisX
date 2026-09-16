/* ============================================================
   80 — GUIDAGE
   Trois couches complementaires :
   · les DIRECTIVES donnent toujours un objectif court au joueur
   · les TUTOS expliquent un module au moment ou il s'ouvre, en
     eclairant la zone de l'ecran dont Porygon-Z parle
   · les INFOS repondent a la demande, sans interrompre
   Rien ne devoile la suite du recit.
   ============================================================ */

/* ---------- fiches d'information ---------- */
const INFOS = {
  integrity:{n:"Intégrité du monde", d:`
    <p>La jauge en haut de l'écran mesure la part du monde redevenue lisible. Elle monte surtout
    quand vous archivez une <b>espèce inédite</b>, et un peu à chaque doublon.</p>
    <p>Plus elle est basse, plus l'affichage est parasité : les lignes de balayage, les franges de
    couleur et le bruit reculent à mesure que vous réparez.</p>
    <p>Les <b>Data Guardians</b> en rendent de gros blocs d'un coup. Les expéditions et le Poké-Poker
    en ajoutent un appoint.</p>`},

  currencies:{n:"Les quatre monnaies", d:`
    <p><b class="gold-t">PokéCoins</b> — monnaie courante. Balls, baies, objets, pierres, coffres.
    Ils viennent des captures et de la conversion d'Énergie.</p>
    <p><b class="cy">Fragments</b> — monnaie des modules. Ils achètent les Data Balls et les sondes
    profondes. Ils viennent des expéditions, du Poké-Poker, de la pêche et des captures rares.</p>
    <p><b class="vi">Noyaux</b> — monnaie rare. Master Balls, multiplicateur permanent, cosmétiques.
    Ils viennent des succès, des niveaux multiples de 5 et des verrous levés.</p>
    <p><b class="gold-t">Énergie Onirique</b> — production passive, même hors ligne. Se convertit
    en PokéCoins ou en Fragments.</p>`},

  streak:{n:"La série", d:`
    <p>Chaque capture réussie allonge la série ; un échec la remet à zéro, sauf si vous avez
    consommé une <b>Baie Nanab</b>.</p>
    <p>Une longue série augmente deux choses : les <b>PokéCoins</b> gagnés et la <b>chance de
    chromatique</b>. C'est le principal levier pour trouver des chromatiques.</p>
    <p>À partir de 10, chaque palier est marqué en doré.</p>`},

  balls:{n:"Les conteneurs", d:`
    <p><b>Poké Ball</b> — standard, bon marché.<br>
    <b>Super Ball</b> — meilleure prise sur les cibles instables.<br>
    <b>Hyper Ball</b> — pour les raretés élevées.<br>
    <b>Data Ball</b> — s'achète en Fragments et restaure <b>60% d'intégrité en plus</b>.<br>
    <b>Master Ball</b> — capture garantie, s'achète en Noyaux.</p>
    <p>Le pourcentage affiché sur la ball sélectionnée est la vraie probabilité, calculée sur
    l'espèce, son niveau, votre série et les baies actives.</p>`},

  shiny:{n:"Les chromatiques", d:`
    <p>Une entité chromatique est mal encodée : ses couleurs ne correspondent pas à sa définition.
    Environ une sur neuf cents.</p>
    <p>Trois leviers pour en croiser davantage : allonger la <b>série</b>, consommer une
    <b>Baie Micle</b> (×3 pendant 15 rencontres) et jouer pendant un événement d'instabilité
    chromatique.</p>
    <p>Elles sont un peu plus difficiles à capturer, rapportent le double d'intégrité et valent
    des Fragments.</p>`},

  evolution:{n:"Faire évoluer", d:`
    <p>Depuis le Pokédex, ouvrez la fiche d'une espèce que vous possédez. Une évolution demande
    trois choses :</p>
    <p>· un <b>niveau de combat</b> suffisant, qui monte en expédition ;<br>
    · plusieurs <b>exemplaires</b> de l'espèce, donc des doublons ;<br>
    · des PokéCoins, et parfois une <b>pierre</b> vendue en boutique.</p>
    <p>L'espèce évoluée entre au Pokédex comme une entrée à part entière : c'est un des moyens
    les plus rapides de compléter l'archive.</p>`},

  team:{n:"L'équipe", d:`
    <p>Votre archive sert d'équipe de combat. Chaque espèce possède un <b>niveau de combat</b>
    indépendant du nombre d'exemplaires.</p>
    <p>Ce niveau monte en <b>expédition</b> : les survivants d'un run gagnent des niveaux
    définitifs. C'est le lien principal entre l'expédition et les Data Guardians.</p>
    <p>En combat, le tableau des types décide de presque tout : un ×2 vaut mieux que dix niveaux.</p>`},

  expedition:{n:"L'expédition", d:`
    <p>Un parcours de douze étages. Vous partez du <b>haut</b> et descendez vers le
    <b>noyau</b>, en bas. À chaque étage, vous choisissez une route parmi celles reliées à votre
    position : le chemin ne se refait pas.</p>
    <p>Les points de vie <b>ne se régénèrent pas</b> entre les combats. Seuls les nœuds Repos,
    les restaurations et certaines reliques soignent.</p>
    <p>Les <b>reliques</b> modifient toute l'équipe pour le reste du run. Les <b>Bits</b> ne
    servent qu'à l'intérieur du parcours.</p>
    <p>La <b>corruption</b> monte quand vous prenez des risques : meilleur butin, ennemis plus forts.
    Elle ne redescend jamais.</p>`},

  poker:{n:"Le Poké-Poker", d:`
    <p>Un deck de 52 cartes, mais les cartes sont des <b>Pokémon</b>. Il n'y a ni couleur ni rang :
    les combinaisons se lisent autrement.</p>
    <p>· <b>Espèces identiques</b> — paire, brelan, carré.<br>
    · <b>Familles d'évolution</b> — duo, trio, lignée complète.<br>
    · <b>Types</b> — mono-type, duo-type, spectre complet.<br>
    · <b>Chromatiques</b> et <b>légendaires</b> — les combinaisons les plus riches.</p>
    <p>Le score est <b class="cy">Jetons</b> × <b class="bad">Multiplicateur</b>. Les
    <b>programmes</b> s'empilent et transforment complètement une partie. Les <b>boosters</b>
    ajoutent à votre deck des espèces tirées de votre propre archive.</p>`},

  idle:{n:"L'Énergie Onirique", d:`
    <p>Les entités archivées continuent de produire pendant que vous ne jouez pas. Achetez des
    générateurs avec des PokéCoins : leur production s'additionne, même hors ligne, jusqu'à
    douze heures.</p>
    <p>L'Énergie se convertit en PokéCoins ou en Fragments. Le multiplicateur permanent s'achète
    en Noyaux et ne se perd jamais.</p>`},

  fishing:{n:"La sonde", d:`
    <p>Trois profondeurs. Plus vous descendez, plus la prise est rare — et plus la sonde coûte
    des Fragments.</p>
    <p>Trois gestes : lancer, <b>ferrer</b> dès que ça mord, puis <b>stabiliser</b> le curseur
    dans la zone. La zone se réduit avec la profondeur.</p>
    <p>Une prise réussie vous renvoie vers une rencontre normale : il reste à la capturer.</p>`},

  boss:{n:"Les Data Guardians", d:`
    <p>Neuf légendaires transformés en pare-feu, trois par secteur. Ils ne se capturent pas :
    ils se relâchent.</p>
    <p>Chacun demande un nombre d'espèces archivées dans son secteur, et que le précédent soit
    tombé. À mi-vie, ils changent de configuration et frappent plus fort.</p>
    <p>Une première victoire ajoute l'espèce à votre archive, émet une <b>carte légendaire</b>
    et rend un gros bloc d'intégrité.</p>`},

  cards:{n:"Les cartes légendaires", d:`
    <p>Une carte est émise à la première victoire sur un verrou, ou tirée d'une Archive du Vide.</p>
    <p>Quatre qualités : Standard, Holographique, Corrompue, Originelle. Seule la meilleure
    obtenue est conservée ; les suivantes comptent comme exemplaires supplémentaires.</p>
    <p>L'échange entre joueurs demandera un serveur. En attendant, un code exportable est
    disponible depuis la collection.</p>`},

  combat:{n:"Le combat", d:`
    <p>Chaque tour, les deux camps agissent dans l'ordre de leur <b>Vitesse</b>. Le tableau des types
    décide de presque tout : le multiplicateur est affiché sur chaque bouton d'attaque.</p>
    <p>À partir du niveau 12, un Pokémon dispose d'une <b>manœuvre</b> en plus de ses attaques :
    elle renforce une statistique, soigne, ou inflige une altération.</p>
    <p><b>Altérations</b> — Brûlure : dégâts en fin de tour et Attaque divisée par deux.
    Paralysie : Vitesse réduite, une action sur quatre échoue. Poison : dégâts croissants à chaque tour.
    Sommeil : aucune action pendant un à trois tours.</p>
    <p><b>Changer d'équipier</b> consomme votre tour : l'adversaire frappera avant votre remplaçant.
    C'est le prix d'un bon appariement de types.</p>
    <p>Les Data Guardians se <b>reconfigurent</b> à mi-vie : leurs altérations sont purgées et leurs
    statistiques montent.</p>`},

  eggs:{n:"La couveuse", d:`
    <p>Un œuf n'éclôt pas avec le temps : il éclôt avec vos <b>captures</b>. Chaque restauration
    fait avancer d'un pas tous les œufs en incubation.</p>
    <p>Quatre paliers, du Commun à l'Originel. Plus l'œuf est haut, plus il demande de captures,
    plus son espèce est rare — et plus la chance de chromatique est forte. Un Œuf Originel peut
    contenir un légendaire.</p>
    <p>Deux incubateurs sont offerts, deux autres s'achètent en Noyaux. Retirer un œuf en cours
    fait perdre sa progression.</p>
    <p>On en trouve dans la PokéBox, les archives scellées, les trésors d'expédition, et en boutique.</p>`},

  bag:{n:"Le sac", d:`
    <p>Tout ce que vous possédez est ici, rangé par nature, avec son usage sur place.</p>
    <p><b>Conteneurs</b> — s'équipent d'un geste, l'équipement vaut aussi pour l'écran de capture.<br>
    <b>Baies</b> — se consomment avant un lancer, pour la rencontre en cours uniquement.<br>
    <b>Boosts</b> — achetés en boutique, ils restent en réserve jusqu'à ce que vous les activiez.<br>
    <b>Objets</b> — restaurations et réindexations s'utilisent en combat ; le radar force une
    rencontre légendaire.<br>
    <b>Pierres</b> — se dépensent depuis la fiche d'une espèce, dans le Pokédex.<br>
    <b>Tenus</b> — portés par le compagnon, sans effet s'il n'y en a pas.<br>
    <b>Trésors</b> — sans usage, uniquement à revendre.</p>`},

  cycle:{n:"Le Nouveau Cycle", d:`
    <p>Une fois l'épilogue atteint, vous pouvez boucler le cycle : le monde repart de zéro, et vous
    gagnez des <b>Noyaux Zéro</b>.</p>
    <p><b>Ce qui traverse</b> — cartes légendaires, cosmétiques, succès, journal des scènes, Noyaux Zéro
    et avantages permanents.</p>
    <p><b>Ce qui repart à zéro</b> — Pokédex, niveau, intégrité, monnaies, équipe, verrous, compagnon.</p>
    <p>Les <b>modificateurs</b> durcissent volontairement la partie et augmentent le gain final.
    Ils se cumulent : un cycle avec les cinq rapporte deux fois plus qu'un cycle sans.</p>`},

  contract:{n:"Les contrats de secteur", d:`
    <p>Un objectif court ancré sur une région, renouvelé toutes les six heures.</p>
    <p>Il existe pour casser la routine : il vous demande d'aller capturer un type précis, une rareté
    minimale ou des espèces évoluées, dans un secteur donné. Changez de zone avec le sélecteur en haut
    de l'écran de capture.</p>
    <p>La récompense est en Fragments et en PokéCoins, et monte avec votre niveau d'Archiviste.</p>`},

  regiontier:{n:"Les paliers de secteur", d:`
    <p>Chaque secteur récompense sa complétion à 25 %, 50 %, 75 % et 100 %.</p>
    <p>Les paliers donnent des PokéCoins, des Fragments, des Noyaux et des conteneurs, plus un
    cosmétique dédié aux deux extrémités. Le palier final rend deux points d'intégrité d'un coup.</p>
    <p>C'est l'objectif à moyen terme du jeu : entre une capture et la restauration complète du monde,
    c'est ce qui donne un horizon atteignable.</p>`},

  online:{n:"L'espace en ligne", d:`
    <p>Entièrement facultatif. Sans configuration, le jeu est strictement identique.</p>
    <p><b>Sauvegarde distante</b> — la partie est envoyée toutes les cinq minutes et à chaque fois que
    vous quittez l'application. Chaque envoi incrémente un numéro de révision : en cas de conflit entre
    deux appareils, c'est la révision qui tranche, jamais l'horloge.</p>
    <p><b>Classements</b> — seules quelques colonnes de vitrine sont publiques (nom, niveau, intégrité,
    Pokédex, séries). La sauvegarde elle-même n'est jamais lisible par les autres.</p>
    <p><b>Échanges</b> — un doublon de carte légendaire produit un code à usage unique. Le serveur vérifie
    que vous possédez réellement l'exemplaire et décrémente votre doublon au moment de l'émission.</p>
    <p>Le schéma de base de données à appliquer est fourni dans <b>sql/schema.sql</b>.</p>`},

  buddy:{n:"Le compagnon", d:`
    <p>Un Pokémon de votre archive vous accompagne. Il gagne de l'<b>affinité</b> à chaque capture,
    un peu plus si la prise est rare.</p>
    <p>Chaque palier d'affinité lui donne des <b>niveaux de combat définitifs</b> — exactement ceux
    qui servent contre les Data Guardians — et augmente vos gains de PokéCoins, d'expérience et
    votre taux de capture.</p>
    <p>Il ramasse aussi des objets en chemin : balls, baies, Fragments, parfois un Noyau.</p>
    <p>Vous pouvez en changer quand vous voulez, mais l'affinité repart de zéro.</p>`},

  weekly:{n:"Objectifs hebdomadaires", d:`
    <p>Trois objectifs longs, renouvelés chaque lundi. Ils demandent plusieurs sessions.</p>
    <p>Chacun rapporte des <b>Noyaux</b> et une <b>archive scellée</b> ouverte devant vous.
    C'est la source régulière de Noyaux la plus fiable du jeu.</p>
    <p>Leur difficulté suit votre niveau d'Archiviste.</p>`},

  pokebox:{n:"La PokéBox", d:`
    <p>Une fois par jour, Porygon-Z met de côté une espèce que vous ne possédez pas encore et
    vous la donne.</p>
    <p>Tant qu'il reste une espèce manquante dans vos secteurs ouverts, le tampon ne peut pas
    vous donner de doublon : il ne peut donc jamais vous bloquer.</p>`}
};

function infoBtn(key){
  return `<button class="ibtn" data-act="info" data-k="${key}" aria-label="Informations">i</button>`;
}
ACTIONS.info = d => {
  const f = INFOS[d.k];
  if(!f) return;
  sheet(`${sheetHead(f.n)}<div class="prose">${f.d}</div>
    <button class="btn wide" style="margin-top:11px" data-act="closesheet">Compris</button>`);
};

/* ============================================================
   TUTORIELS A PROJECTEUR
   ============================================================ */
/* Chaque tutoriel s'ouvre sur ce que le module EST dans la fiction, avant
   d'expliquer comment il se joue. Un joueur doit comprendre pourquoi cette
   salle existe dans un monde en train de se corrompre. */
const TUTOS = {
  intro:{steps:[
    {sel:"#enc-stage", t:"Voici une entité désindexée. Sa définition existe encore quelque part, mais plus rien ne pointe vers elle : le monde ne sait plus la lire."},
    {sel:".ballrow", t:"Un conteneur reconstruit ce pointeur. Choisis-en un : le pourcentage affiché est la vraie probabilité que l'écriture aboutisse."},
    {sel:".throwbtn", t:"Puis lance. Si ça tient, l'entité reprend sa place dans l'archive et le monde redevient un peu plus cohérent."},
    {sel:".integrity", t:"Cette jauge est la seule chose qui compte. Elle mesure ce que tu as réparé."},
    {sel:"#dock", t:"Le reste s'ouvrira au fil de ta progression. Je te préviendrai à chaque fois."}
  ]},
  streak:{steps:[
    {sel:".streakbox", t:"Cinq restaurations d'affilée. Le système appelle ça une chaîne : tant que tu écris sans interruption, le tampon reste chaud."},
    {sel:".streakbox", t:"Un tampon chaud laisse passer des entités mal encodées — celles dont les couleurs ne correspondent pas à leur définition. C'est le seul moyen d'en croiser souvent."},
    {sel:".ballrow", t:"La chaîne ne se brise que si une entité se désindexe à nouveau. Un lancer raté ne coûte que le conteneur."}
  ]},
  pokebox:{steps:[
    {sel:"#screen", t:"Le système garde un tampon de rebut : les entités qu'il a commencé à écrire sans jamais finir de référencer."},
    {sel:"#screen", t:"Personne ne le surveille. J'y prélève une entité par jour et je te la donne. Techniquement, c'est un vol."},
    {sel:"#screen", t:"Tant qu'il te manque une espèce, le tampon ne peut pas te donner un doublon. Il ne peut donc jamais te bloquer."}
  ]},
  fishing:{steps:[
    {sel:"#screen", t:"Sous les secteurs visibles, il y a des strates plus anciennes. Des versions du monde qu'on a recouvertes sans jamais les effacer."},
    {sel:"#fish-stage", t:"La sonde descend dedans. Trois gestes : lancer, ferrer dès que ça accroche, puis stabiliser le flux dans la zone."},
    {sel:"#screen", t:"Tu remonteras des entités, et parfois des objets qui n'ont rien à faire là. Ne me demande pas d'où ils viennent."}
  ]},
  idle:{steps:[
    {sel:"#screen", t:"Une entité archivée ne s'arrête pas quand tu fermes le jeu. Elle continue de tourner, en attente d'instructions."},
    {sel:"#screen", t:"Ce bruit de fond est exploitable. Les générateurs le collectent, même hors ligne, jusqu'à douze heures."},
    {sel:"#screen", t:"Je l'appelle Énergie Onirique. Retiens ce nom. Il servira plus tard, et pas pour acheter des conteneurs."}
  ]},
  eggs:{steps:[
    {sel:"#screen", t:"Ce ne sont pas des œufs. Ce sont des définitions incomplètes : des entités que le système a commencé à écrire puis abandonnées."},
    {sel:"#screen", t:"Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle — d'où le décompte en captures, et non en minutes."},
    {sel:"#screen", t:"Plus l'ébauche est avancée, plus elle demande de captures, et plus ce qui en sort est rare."}
  ]},
  boss:{steps:[
    {sel:"#screen", t:"Certaines entités n'ont pas été désindexées. On leur a donné un rôle : empêcher l'accès aux secteurs voisins."},
    {sel:"#screen", t:"Je ne sais pas qui leur a demandé ça. Ce n'est ni toi ni moi, et il n'y a personne d'autre."},
    {sel:"#screen", t:"Tu ne peux pas les restaurer. Il faut les faire céder. Et le tableau des types pèse plus lourd que dix niveaux d'écart."}
  ]},
  expedition:{steps:[
    {sel:"#map-scroll", t:"Une couche non cartographiée : le système y a improvisé sa propre géographie quand il a manqué de place."},
    {sel:"#map-scroll", t:"Tu pars du haut et tu descends vers son noyau. Les nœuds éclairés sont les seuls accessibles, et le chemin ne se refait pas."},
    {sel:".team-strip", t:"Les points de vie ne se régénèrent pas entre les combats. La menace, ici, c'est l'usure."},
    {sel:"#screen", t:"Ce qui survit en revient renforcé de façon permanente. C'est la seule façon de préparer un verrou."}
  ]},
  poker:{steps:[
    {sel:"#screen", t:"Les données rares ne se rangent pas au hasard : elles se regroupent par motifs. Espèces identiques, familles, types."},
    {sel:"#hand", t:"Ce deck n'a ni couleur ni rang. Ce sont des Pokémon, et ce sont leurs parentés qui font les combinaisons."},
    {sel:"#pk-score-line", t:"Chaque motif reconnu stabilise une portion de couche. Jetons multipliés par Multiplicateur : les deux se travaillent séparément."},
    {sel:"#jokers", t:"Les programmes s'empilent ici, de gauche à droite. Ce sont eux qui font les grosses parties, pas les cartes."}
  ]},
  dex:{steps:[
    {sel:".ring", t:"L'archive, secteur par secteur. Chaque ligne restaurée rend les lignes voisines plus stables — je ne sais toujours pas modéliser pourquoi."},
    {sel:".dexgrid", t:"Une case sombre est une espèce jamais restaurée. Sa notice est illisible tant qu'elle n'est pas revenue."},
    {sel:".dexgrid", t:"C'est aussi d'ici que tu réécris une entité en sa forme suivante, avec des exemplaires en trop."}
  ]},
  buddy:{steps:[
    {sel:".buddy", t:"Une entité restaurée garde la référence de qui l'a réécrite. C'est une ligne d'en-tête, ça ne veut rien dire."},
    {sel:".buddy", t:"Sauf que celle-ci te suit. À chaque palier d'affinité, elle gagne des niveaux définitifs."},
    {sel:".buddy", t:"Et elle ramasse des choses en chemin. Ce comportement n'est écrit nulle part. J'ai vérifié trois fois."}
  ]}
};

let TUTO = null;
function tutoSeen(k){ return (S.tutos||[]).includes(k); }
/* aucune autre couche ne doit etre ouverte : sinon le tutoriel se superpose */
function overlayBusy(){
  for(const id of ["story", "sheet-root", "discover", "levelup", "boot"]){
    const el = document.getElementById(id);
    if(el && el.className && el.className.indexOf("on") >= 0) return true;
    if(id === "boot" && el && el.style && el.style.display === "flex") return true;
  }
  return false;
}
function tutoMaybe(k){
  if(!TUTOS[k] || tutoSeen(k)) return false;
  if(overlayBusy()) return false;
  (S.tutos = S.tutos || []).push(k);
  saveSoon();
  setTimeout(()=>startTuto(k), 380);
  return true;
}
function startTuto(k, tries){
  /* si une couche s'est ouverte entre-temps, on attend qu'elle se referme */
  if(overlayBusy()){
    if((tries||0) > 40) return;
    setTimeout(()=>startTuto(k, (tries||0)+1), 500);
    return;
  }
  TUTO = {k, i:0};
  drawTuto();
}
function drawTuto(){
  const box = document.getElementById("tuto");
  if(!box || !TUTO){ return; }
  const def = TUTOS[TUTO.k];
  const step = def.steps[TUTO.i];
  if(!step){ endTuto(); return; }
  const app = document.getElementById("app").getBoundingClientRect();
  let hole = "";
  let bubbleTop = true;
  const el = step.sel ? document.querySelector(step.sel) : null;
  if(el){
    const r = el.getBoundingClientRect();
    const x = r.left - app.left - 6, y = r.top - app.top - 6;
    const w = r.width + 12, h = r.height + 12;
    bubbleTop = (y + h/2) > app.height/2;
    hole = `<div class="tuto-hole" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`;
  }
  box.className = "on";
  box.innerHTML = `
    ${hole || '<div class="tuto-dim"></div>'}
    <div class="tuto-box ${bubbleTop?"top":"bottom"}">
      <div class="tuto-who">
        ${pzFace(pzMood(), 34)}
        <span>PORYGON-Z</span>
        <span class="grow"></span>
        <span class="tiny dim">${TUTO.i+1}/${def.steps.length}</span>
      </div>
      <div class="tuto-t">${esc(step.t)}</div>
      <div class="row between" style="margin-top:9px">
        <button class="btn xs ghost" data-act="tutoskip">Passer</button>
        <button class="btn sm pri" data-act="tutonext">
          ${TUTO.i+1 >= def.steps.length ? "Compris" : "Suivant"}</button>
      </div>
    </div>`;
}
ACTIONS.tutonext = () => { if(!TUTO) return; TUTO.i++; drawTuto(); };
ACTIONS.tutoskip = () => endTuto();
function endTuto(){
  TUTO = null;
  const box = document.getElementById("tuto");
  if(box){ box.className = ""; box.innerHTML = ""; }
  save();
}
/* relancer un tutoriel depuis une fiche d'info */
ACTIONS.tutoreplay = d => { closeSheet(); setTimeout(()=>startTuto(d.k), 250); };

/* ============================================================
   DIRECTIVES — un objectif court, toujours visible
   ============================================================ */
const DIRECTIVES = [
  {id:"d1",  n:"Restaurer 3 entités",           chk:()=>S.stats.catches>=3,  goal:()=>[S.stats.catches,3],
   rw:{coins:200, balls:{poke:10}}, hint:"Choisis une ball et lance. Rien d'autre pour l'instant."},
  {id:"d2",  n:"Archiver 5 espèces distinctes", chk:()=>dexTotal()>=5,       goal:()=>[dexTotal(),5],
   rw:{coins:350, berries:{framby:2}}, hint:"Les espèces inédites rapportent bien plus d'intégrité que les doublons."},
  {id:"d2b", n:"Choisir un compagnon",           chk:()=>!!buddy(),           goal:()=>[buddy()?1:0,1],
   rw:{coins:300, balls:{super:3}}, hint:"Il gagne des niveaux permanents et ramasse des objets pour vous.",
   go:"capture"},
  {id:"d3",  n:"Atteindre le niveau 2",         chk:()=>S.level>=2,          goal:()=>[S.level,2],
   rw:{shards:10}, hint:"Chaque capture donne de l'expérience. Le niveau ouvre les modules."},
  {id:"d4",  n:"Ouvrir la PokéBox",             chk:()=>S.stats.boxOpens>=1, goal:()=>[S.stats.boxOpens,1],
   rw:{coins:400}, hint:"Onglet Modules. Elle donne toujours une espèce que tu n'as pas.", go:"pokebox"},
  {id:"d5",  n:"Atteindre une série de 10",     chk:()=>S.stats.bestStreak>=10, goal:()=>[S.stats.bestStreak,10],
   rw:{coins:500, berries:{nanab:2}}, hint:"Enchaîne les captures sans échouer. Vise les espèces communes."},
  {id:"d6",  n:"Passer au niveau 3",            chk:()=>S.level>=3,          goal:()=>[S.level,3],
   rw:{balls:{super:8}}, hint:"La sonde des couches s'ouvre à ce niveau."},
  {id:"d7",  n:"Faire une prise à la sonde",    chk:()=>S.stats.fish>=1,     goal:()=>[S.stats.fish,1],
   rw:{shards:20}, hint:"Onglet Modules, Sonde des couches.", go:"fishing"},
  {id:"d8",  n:"Archiver 20 espèces",           chk:()=>dexTotal()>=20,      goal:()=>[dexTotal(),20],
   rw:{coins:900, cores:1}, hint:"Change de zone dans le Pokédex pour repérer ce qui te manque."},
  {id:"d9",  n:"Acheter un générateur d'Énergie", chk:()=>Object.values(S.idle.gens).reduce((a,b)=>a+b,0)>1,
   goal:()=>[Object.values(S.idle.gens).reduce((a,b)=>a+b,0),2],
   rw:{coins:600}, hint:"Il produit pendant que tu ne joues pas.", go:"idle"},
  {id:"d10", n:"Archiver 25 espèces",           chk:()=>dexTotal()>=25,      goal:()=>[dexTotal(),25],
   rw:{shards:40}, hint:"Le premier verrou légendaire s'ouvre à 25 espèces de Kanto."},
  {id:"d11", n:"Faire évoluer un Pokémon",      chk:()=>S.stats.evolutions>=1, goal:()=>[S.stats.evolutions,1],
   rw:{coins:1200, stones:{fire:1}}, hint:"Pokédex, fiche d'une espèce que tu as en plusieurs exemplaires.", go:"dex"},
  {id:"d12", n:"Lever un premier verrou",       chk:()=>S.bosses.length>=1,  goal:()=>[S.bosses.length,1],
   rw:{cores:2}, hint:"Prépare une équipe qui a l'avantage de type.", go:"boss"},
  {id:"d13", n:"Terminer une expédition",       chk:()=>S.stats.expWins>=1,  goal:()=>[S.stats.expWins,1],
   rw:{shards:60}, hint:"Tes survivants gagneront des niveaux définitifs.", go:"expedition"},
  {id:"d14", n:"Franchir une ante au Poké-Poker", chk:()=>S.pokerMeta.bestAnte>=1, goal:()=>[S.pokerMeta.bestAnte,1],
   rw:{shards:80}, hint:"Cherche les familles d'évolution dans ta main.", go:"poker"},
  {id:"d15", n:"Compléter la moitié de Kanto",  chk:()=>dexCount("kanto")>=76, goal:()=>[dexCount("kanto"),76],
   rw:{cores:3, coins:3000}, hint:"Les Data Guardians de Kanto demandent une archive solide."}
];
function currentDirective(){
  for(const d of DIRECTIVES) if(!(S.dirDone||[]).includes(d.id)) return d;
  return null;
}
function checkDirectives(){
  const d = currentDirective();
  if(!d || !d.chk()) return false;
  (S.dirDone = S.dirDone || []).push(d.id);
  grantReward(d.rw);
  Sfx.win();
  toast("Directive accomplie : " + d.n, "warn", "check");
  const nx = currentDirective();
  if(nx) pzFlash("Nouvelle directive : " + nx.n);
  saveSoon();
  return true;
}
function directiveCard(){
  const d = currentDirective();
  if(!d) return `<div class="panel bracket"><div class="h sm">DIRECTIVES</div>
    <div class="tiny muted">Toutes les directives sont accomplies. La suite t'appartient.</div></div>`;
  const [cur, goal] = d.goal();
  const pct = Math.min(100, cur/goal*100);
  return `<div class="panel bracket directive">
    <div class="row between">
      <div class="h sm" style="margin:0">DIRECTIVE EN COURS</div>
      <span class="tiny dim">${(S.dirDone||[]).length}/${DIRECTIVES.length}</span>
    </div>
    <div class="row" style="gap:9px;margin-top:5px">
      ${pzFace(pzMood(), 34)}
      <div class="grow">
        <div style="font-size:12px">${esc(d.n)}</div>
        <div class="bar thin" style="margin:4px 0 3px"><i style="width:${pct}%"></i></div>
        <div class="tiny dim mono-num">${fmt(Math.min(cur,goal))} / ${fmt(goal)}</div>
      </div>
      ${d.go?`<button class="btn xs" data-act="goto" data-to="${d.go}">Y aller</button>`:""}
    </div>
    <div class="tiny muted" style="margin-top:6px">${esc(d.hint)}</div>
    <div class="tiny gold-t" style="margin-top:3px">Récompense : ${esc(rewardText(d.rw))}</div>
  </div>`;
}

/* ============================================================
   EVENEMENTS DE PORYGON-Z
   Remarques ponctuelles declenchees par la progression reelle.
   Aucune ne devoile la suite du recit.
   ============================================================ */
const PZ_EVENTS = [
  {id:"e_first_dup", c:()=>S.stats.catches>=6 && Object.values(S.dex).some(e=>e.c>=3),
   t:"Tu as déjà trois exemplaires de la même espèce. Ne les jette pas : les doublons servent à réécrire une entité en sa forme suivante."},
  {id:"e_coins", c:()=>S.coins>=2000,
   t:"Deux mille PokéCoins dorment dans ton compte. Ils ne rapportent rien tant qu'ils y restent. Achète des conteneurs."},
  {id:"e_type", c:()=>dexTotal()>=15,
   t:"J'ai classé ton archive par types. Tu captures presque toujours dans la même zone. Change de secteur de temps en temps, la distribution n'est pas la même."},
  {id:"e_fail", c:()=>S.failStreak>=4,
   t:"Quatre échecs d'affilée. Le calcul est correct, c'est la malchance. Une Baie Framby améliore franchement la prise."},
  {id:"e_lowball", c:()=>((S.balls.poke||0)+(S.balls.super||0)+(S.balls.hyper||0))<=4,
   t:"Ton stock de conteneurs est presque vide. La boutique en vend, et l'Énergie Onirique se convertit en PokéCoins."},
  {id:"e_idle", c:()=>S.stats.energyTotal>=3000,
   t:"Ta production passive tourne bien. Pense à la convertir : l'Énergie ne sert à rien tant qu'elle s'accumule."},
  {id:"e_dex50", c:()=>dexTotal()>=50,
   t:"Cinquante espèces. Le secteur commence à tenir debout tout seul par endroits. Je ne pensais pas revoir ça."},
  {id:"e_evo", c:()=>S.stats.evolutions>=1,
   t:"La réécriture a fonctionné. L'entité a changé de définition sans perdre son historique. C'est plus rare que ça n'en a l'air."},
  {id:"e_team", c:()=>S.team.length>=3 && S.level>=8,
   t:"Ton équipe de combat est prête. Vérifie les types avant d'entrer : contre un verrou, l'avantage de type pèse plus lourd que le niveau."},
  {id:"e_expfail", c:()=>S.stats.expRuns>=2 && S.stats.expWins===0,
   t:"Deux expéditions perdues. Les points de vie ne se régénèrent pas entre les combats : passe par les nœuds Repos avant les Élites, pas après."},
  {id:"e_shinyhunt", c:()=>S.stats.bestStreak>=25 && S.stats.shinies===0,
   t:"Ta série est bonne mais tu n'as encore rien trouvé de mal encodé. C'est normal, c'est rare. Continue, la série y travaille."},
  {id:"e_boss1", c:()=>S.bosses.length>=1,
   t:"Le verrou est tombé. J'ai relu sa signature : il n'a opposé aucune résistance réelle. Comme s'il attendait qu'on vienne."},
  {id:"e_cards", c:()=>Object.keys(S.cards||{}).length>=1,
   t:"Une carte a été émise à ton nom. Je ne sais pas quel système les produit, ni pourquoi il continue de le faire."},
  {id:"e_poker", c:()=>S.stats.pokerWins>=1,
   t:"Tu as stabilisé une couche entière en jouant avec des motifs. Je note que ça marche. Je ne comprends toujours pas pourquoi."},
  {id:"e_dex150", c:()=>dexTotal()>=150,
   t:"Cent cinquante entrées. À ce stade, les autres tentatives avaient déjà ralenti. Toi non. Je préfère ne pas expliquer pourquoi je surveille ça."},
  {id:"e_buddy", c:()=>buddyTier()>=3,
   t:"Ton compagnon a franchi trois paliers. Je remarque qu'il se place toujours entre toi et la rencontre. Ce n'est pas dans sa définition."},
  {id:"e_buddyfind", c:()=>(S.buddy&&S.buddy.finds>=5),
   t:"Cinq objets rapportés. Il ne les garde jamais pour lui. Je ne sais pas où il les trouve, et j'ai cherché."},
  {id:"e_weekly", c:()=>S.weekly && S.weekly.quests.some(q=>q.claimed),
   t:"Objectif long accompli. Les Noyaux sont la ressource la plus rare du système : garde-les pour le multiplicateur permanent ou les Master Balls."},
  {id:"e_night", c:()=>S.flags.night,
   t:"Il est très tard chez toi. Je n'ai pas d'horloge interne, mais j'ai la tienne. L'archive sera encore là demain."}
];
function checkPzEvents(){
  if(document.getElementById("story")?.className === "on") return false;
  S.pzSeen = S.pzSeen || [];
  for(const e of PZ_EVENTS){
    if(S.pzSeen.includes(e.id)) continue;
    let ok = false;
    try { ok = e.c(); } catch(x){ ok = false; }
    if(ok){
      S.pzSeen.push(e.id);
      saveSoon();
      pzTalk(e.t);
      return true;
    }
  }
  return false;
}
/* bandeau de dialogue court, non bloquant */
function pzTalk(text){
  const box = document.getElementById("pztalk");
  if(!box) return;
  box.innerHTML = `
    <div class="pzt-in">
      ${pzFace(pzMood(), 40)}
      <div class="grow"><div class="pzt-who">PORYGON-Z</div>
        <div class="pzt-t">${esc(text)}</div></div>
      <button class="x" data-act="pzclose">${ic("cross")}</button>
    </div>`;
  box.className = "on";
  clearTimeout(box._t);
  box._t = setTimeout(()=>{ box.className = ""; }, 11000);
}
ACTIONS.pzclose = () => { const b = document.getElementById("pztalk"); if(b){ b.className=""; b.innerHTML=""; } };

/* point d'entree unique appele apres chaque action significative */
function guideTick(){
  if(!S) return;
  /* un palier prend le pas sur le bavardage du guide, mais ne doit jamais
     empecher l'evaluation des directives : elles sont la colonne vertebrale
     de la progression. */
  const milestone = milestoneTick();
  checkDirectives();
  if(!milestone) checkPzEvents();
}
