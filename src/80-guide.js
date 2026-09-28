/* ============================================================
   80 — GUIDAGE
   Trois couches complementaires :
   · les DIRECTIVES donnent toujours un objectif court au joueur
   · les TUTOS expliquent un module au moment ou il s'ouvre, en
     eclairant la secteur de l'ecran dont Porygon-Z parle
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
    <p>Chaque capture réussie allonge la chaîne ; un échec la remet à zéro, sauf si vous avez
    consommé une <b>Baie Nanab</b>.</p>
    <p>Une longue série augmente deux choses : les <b>PokéCoins</b> gagnés et la <b>chance de
    chromatique</b>. C'est le principal levier pour trouver des chromatiques.</p>
    <p>À partir de 10, chaque palier est marqué en doré.</p>`},

  balls:{n:"Les Balls", d:`
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

  idle:{n:"Le forage", d:`
    <p>Frappez la sphère pour extraire de l'Énergie. À la Couche molle, les sondes prennent le relais
    et le forage continue même hors ligne, jusqu'au plafond de votre réservoir.</p>
    <p>Chaque strate multiplie le rendement et ouvre une mécanique nouvelle. Le recalibrage rend des
    Échos permanents. Voir la fiche « Le forage » pour le détail.</p>`},

  fishing:{n:"La pêche", d:`
    <p>La pêche est un mode de l'écran de capture : on bascule d'un geste entre Capture et Pêche.
    Il faut d'abord trouver une Vieille Canne, qui reste parfois accrochée à un Pokémon capturé.</p>
    <p>Lancez la ligne, attendez que le bouchon plonge, puis <b>ferrez</b>. Trop tôt, la prise fuit.
    Trop tard, elle décroche. Si ça tient, la rencontre se déroule comme une capture normale.</p>
    <p>Au bout de la ligne : les Pokémon Eau, et des espèces qu'on ne trouve <b>que</b> là —
    Barpau, Rémoraid, Qwilfish, Relicanth, Loupio. Et une fois Hoenn ouvert, avec une canne
    suffisante, quelque chose de bien plus grand.</p>
    <p>La Super Canne et la Méga Canne s'achètent en Fragments : elles ferrent mieux, remontent
    plus de raretés et multiplient la chance de chromatique. La pluie fait mordre plus vite.</p>`},

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

  research:{n:"La recherche", d:`
    <p>Chaque espèce archivée porte quatre objectifs qui lui sont propres : en restaurer plusieurs,
    en vaincre au combat, la faire évoluer, en croiser une chromatique.</p>
    <p>Chaque tâche accomplie rapporte des Fragments et fait monter un compteur général qui débloque
    sept paliers — jusqu'à une Master Ball et des cosmétiques.</p>
    <p>C'est ce qui donne une valeur individuelle aux 386 espèces : sans elle, un Pokémon capturé ne
    sert plus jamais à rien.</p>`},

  monde:{n:"Habitats, heure et météo", d:`
    <p><b>Habitats</b> — chaque secteur se découpe en six lieux, qui s'ouvrent au fil de vos captures.
    Chacun a son vivier : les Nappes rendent surtout de l'Eau, les Cavités de la Roche et du Sol.
    Le nombre sur chaque onglet indique combien de Pokémon de ces types vous manquent encore.</p>
    <p><b>Heure</b> — entre 20 h et 6 h, Spectre, Ténèbres, Psy et Poison sortent bien davantage.
    Le jour favorise Plante, Normal, Vol, Insecte et Feu. C'est l'heure réelle de votre appareil.</p>
    <p><b>Météo</b> — elle tourne toutes les vingt minutes. Elle change les raretés, elle pèse de 20%
    sur les dégâts des types qu'elle porte, et la Purge augmente les gains de capture.</p>`},

  talents:{n:"Les talents", d:`
    <p>Chaque espèce possède un talent, tiré de son type dominant. Il agit en combat sans que vous
    ayez à l'activer.</p>
    <p>Brasier, Torrent, Engrais et Essaim donnent +35% de dégâts quand les PV tombent sous un tiers.
    Intimidation réduit l'Attaque adverse à l'entrée en jeu. Lévitation rend immunisé au type Sol.
    Statik et Point Poison altèrent l'assaillant. Robustesse fait survivre à un coup porté depuis
    des PV pleins.</p>
    <p>Le talent du Pokémon en jeu est affiché sur sa plaque de nom.</p>`},

  karpdeal:{n:"L'offre du jour", d:`
    <p>Un vendeur apparaît environ un jour sur huit et propose un Magicarpe pour
    cinq cents PokéCoins.</p>
    <p>C'est exactement ce qui est annoncé : un Magicarpe, au prix fort. Il n'y a pas de piège
    caché, pas de bonus dissimulé, et le Pokémon n'est ni rare ni particulier.</p>
    <p>Il entre quand même au Pokédex s'il vous manquait, et il finira par évoluer. Cela reste
    une mauvaise affaire, et Porygon-Z tient à ce que ce soit écrit noir sur blanc.</p>`},

  glossaire:{n:"Les mots du système", d:`
    <p>Le vocabulaire est fixe. Chaque mot ne recouvre qu'une seule chose.</p>
    <p><b>Entité</b> — un individu précis, celui que vous avez en face de vous.<br>
    <b>Espèce</b> — la définition dont cette entité est une occurrence.<br>
    <b>Signature</b> — la trace détectable d'une espèce, avant toute rencontre.</p>
    <p><b>Restaurer</b> — réussir la capture : reconstruire le lien qui manquait.<br>
    <b>Archiver</b> — l'effet de cette restauration sur le Pokédex, la première fois seulement.</p>
    <p><b>Secteur</b> — une région du monde. <b>Couche</b> — une couches plus profonde, non cartographiée.</p>
    <p><b>Verrou</b> — un Data Guardian. <b>Noyau</b> — le dernier verrou d'un secteur, celui qui
    en ferme la sortie.</p>
    <p><b>Chaîne</b> — vos restaurations consécutives sans fuite. Le mot <b>série</b> ne désigne
    jamais cela : il est réservé aux séries d'illustrations des cartes.</p>`},

  rarete:{n:"Rareté et chromatiques", d:`
    <p>Ce sont deux choses indépendantes, et il est facile de les confondre.</p>
    <p><b>La rareté</b> décrit la difficulté à restaurer une espèce : Commun, Peu commun, Rare,
    Très rare, <b>Altéré</b>, Légendaire. Elle est fixée par l'espèce, ne change jamais, et
    détermine le taux de capture, les gains et l'intégrité rendue.</p>
    <p><b>Altéré</b> est donc un palier de rareté, rien de plus : une espèce que le système
    a particulièrement mal indexée. Cela n'a aucun rapport avec l'apparence.</p>
    <p><b>Chromatique</b> décrit une entité dont les couleurs ne correspondent pas à sa définition.
    C'est un accident d'encodage, indépendant de la rareté : un Commun peut être chromatique,
    un Légendaire peut ne pas l'être.</p>
    <p>La chance de base est de 1 sur 1 000. Elle monte avec votre <b>chaîne</b> — jusqu'à
    1 sur 125 — et c'est de loin le levier le plus puissant du jeu.</p>`},

  bag:{n:"Le sac", d:`
    <p>Tout ce que vous possédez est ici, rangé par nature, avec son usage sur place.</p>
    <p><b>Balls</b> — s'équipent d'un geste, et l'équipement vaut aussi sur l'écran de capture.<br>
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
    minimale ou des espèces évoluées, dans un secteur donné. Changez de secteur avec le sélecteur en haut
    de l'écran de capture.</p>
    <p>La récompense est en Fragments et en PokéCoins, et monte avec votre niveau d'Archiviste.</p>`},

  regiontier:{n:"Les paliers de secteur", d:`
    <p>Chaque secteur récompense sa complétion à 25 %, 50 %, 75 % et 100 %.</p>
    <p>Les paliers donnent des PokéCoins, des Fragments, des Noyaux et des Balls, plus un
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
    {sel:".ballrow", t:"Une Ball le raccroche au Pokédex. Choisis-en une : le pourcentage affiché est ta vraie probabilité de réussite."},
    {sel:".throwbtn", t:"Puis lance. Si la Ball tient, le Pokémon reprend sa place au Pokédex et le monde redevient un peu plus solide."},
    {sel:".integrity", t:"Cette jauge est la seule chose qui compte. Elle mesure ce que tu as réparé."},
    {sel:"#dock", t:"Le reste s'ouvrira au fil de ta progression. Je te préviendrai à chaque fois."}
  ]},
  streak:{steps:[
    {sel:".streakbox", t:"Cinq restaurations d'affilée. Le système appelle ça une chaîne : tant que tu écris sans interruption, le tampon reste chaud."},
    {sel:".streakbox", t:"Un tampon chaud laisse passer des Pokémon chromatiques — ceux dont les couleurs ne correspondent pas à leur définition. C'est de loin le meilleur moyen d'en croiser."},
    {sel:".ballrow", t:"La chaîne ne se brise que si un Pokémon s'enfuit. Une Ball qui rate ne coûte que la Ball."}
  ]},
  pokebox:{steps:[
    {sel:"#screen", t:"Le système garde un tampon de rebut : des Pokémon qu'il a commencé à écrire sans jamais finir de les référencer."},
    {sel:"#screen", t:"Personne ne le surveille. J'y prélève un Pokémon par jour et je te le donne. Techniquement, c'est un vol."},
    {sel:"#screen", t:"Tant qu'il te manque un Pokémon, le tampon ne peut pas te rendre un doublon. Il ne peut donc jamais te bloquer."}
  ]},
  fishing:{steps:[
    {sel:"#screen", t:"Cette canne, quelqu'un s'en servait avant que les données se figent. Les nappes sous le secteur n'ont jamais été vidées."},
    {sel:"#screen", t:"Lance, attends que le bouchon plonge, puis ferre. Trop tôt ou trop tard, et ça repart."},
    {sel:"#screen", t:"Certains Pokémon ne remontent qu'au bout d'une ligne. Tu ne les croiseras nulle part ailleurs."}
  ]},
  idle:{steps:[
    {sel:"#screen", t:"Les Pokémon archivés continuent de rêver, même quand tu fermes le jeu. Ce bruit de fond s'extrait. Je l'appelle Énergie Onirique."},
    {sel:"#gball",  t:"Frappe la sphère. Au début, c'est la seule façon de forer — aucune sonde ne tient à la Surface."},
    {sel:"#screen", t:"Descends jusqu'à la Couche molle : les sondes s'y accrochent, et le forage tourne sans toi. Chaque strate plus bas ouvre quelque chose de nouveau."},
    {sel:"#screen", t:"Tout en bas, on peut recalibrer. On perd la profondeur, on garde les Échos. Et les Échos ne s'effacent jamais."}
  ]},
  eggs:{steps:[
    {sel:"#screen", t:"Ce ne sont pas tout à fait des Œufs. Ce sont des Pokémon que le système a commencé à écrire, puis abandonnés en cours de route."},
    {sel:"#screen", t:"Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle — d'où le décompte en captures, et non en minutes."},
    {sel:"#screen", t:"Plus l'ébauche est avancée, plus elle demande de captures, et plus ce qui en sort est rare."}
  ]},
  boss:{steps:[
    {sel:"#screen", t:"Certains Pokémon n'ont pas disparu de l'index. On leur a donné un rôle : bloquer l'accès aux secteurs voisins."},
    {sel:"#screen", t:"Je ne sais pas qui leur a demandé ça. Ce n'est ni toi ni moi, et il n'y a personne d'autre."},
    {sel:"#screen", t:"Tu ne peux pas les capturer. Il faut les faire céder au combat. Et le tableau des types pèse plus lourd que dix niveaux d'écart."}
  ]},
  expedition:{steps:[
    {sel:"#map-scroll", t:"Une couche non cartographiée : le système y a improvisé sa propre géographie quand il a manqué de place."},
    {sel:"#map-scroll", t:"Tu pars du haut et tu descends vers son noyau. Les nœuds éclairés sont les seuls accessibles, et le chemin ne se refait pas."},
    {sel:".team-strip", t:"Les points de vie ne se régénèrent pas entre les combats. La menace, ici, c'est l'usure."},
    {sel:"#screen", t:"Ce qui survit en revient renforcé de façon permanente. C'est la seule façon de préparer un verrou."}
  ]},
  poker:{steps:[
    {sel:"#screen", t:"Les données rares ne se rangent pas au hasard : elles se regroupent par motifs. Espèces identiques, familles, types."},
    {sel:"#hand", t:"Ce deck n'a ni couleur ni rang. Ce sont des Pokémon : espèces identiques, familles d'évolution, types, chromatiques."},
    {sel:"#pk-score-line", t:"Chaque motif reconnu stabilise une portion de couche. Jetons multipliés par Multiplicateur : les deux se travaillent séparément."},
    {sel:"#jokers", t:"Les programmes s'empilent ici, de gauche à droite. Ce sont eux qui font les grosses parties, pas les cartes."}
  ]},
  dex:{steps:[
    {sel:".ring", t:"L'archive, secteur par secteur. Chaque ligne restaurée rend les lignes voisines plus stables — je ne sais toujours pas modéliser pourquoi."},
    {sel:".dexgrid", t:"Une case sombre est un Pokémon que tu n'as jamais capturé. Sa notice reste illisible tant qu'il n'est pas revenu."},
    {sel:".dexgrid", t:"C'est aussi d'ici que tu fais évoluer un Pokémon, en dépensant des exemplaires en trop."}
  ]},
  buddy:{steps:[
    {sel:".buddy", t:"Un Pokémon capturé garde en mémoire qui l'a attrapé. C'est une ligne d'en-tête, ça ne veut rien dire."},
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
  {id:"d5",  n:"Atteindre une chaîne de 10",     chk:()=>S.stats.bestStreak>=10, goal:()=>[S.stats.bestStreak,10],
   rw:{coins:500, berries:{nanab:2}}, hint:"Enchaîne les captures sans échouer. Vise les espèces communes."},
  {id:"d6",  n:"Passer au niveau 3",            chk:()=>S.level>=3,          goal:()=>[S.level,3],
   rw:{balls:{super:8}}, hint:"La sonde des couches s'ouvre à ce niveau."},
  {id:"d7",  n:"Faire une prise à la sonde",    chk:()=>S.stats.fish>=1,     goal:()=>[S.stats.fish,1],
   rw:{shards:20}, hint:"Écran de capture, mode Pêche.", go:"capture"},
  {id:"d8",  n:"Archiver 20 espèces",           chk:()=>dexTotal()>=20,      goal:()=>[dexTotal(),20],
   rw:{coins:900, cores:1}, hint:"Change de secteur dans le Pokédex pour repérer ce qui te manque."},
  {id:"d9",  n:"Installer deux sondes de forage", chk:()=>drillCount()>=2,
   goal:()=>[drillCount(),2],
   rw:{coins:600}, hint:"Il produit pendant que tu ne joues pas.", go:"idle"},
  {id:"d10", n:"Archiver 25 espèces",           chk:()=>dexTotal()>=25,      goal:()=>[dexTotal(),25],
   rw:{shards:40}, hint:"Le premier verrou légendaire s'ouvre à 25 espèces de Kanto."},
  {id:"d11", n:"Faire évoluer un Pokémon",      chk:()=>S.stats.evolutions>=1, goal:()=>[S.stats.evolutions,1],
   rw:{coins:1200, stones:{fire:1}}, hint:"Pokédex, fiche d'une espèce que tu as en plusieurs exemplaires.", go:"dex"},
  {id:"d12", n:"Lever un premier verrou",       chk:()=>S.bosses.length>=1,  goal:()=>[S.bosses.length,1],
   rw:{cores:2}, hint:"Prépare une équipe qui a l'avantage de type.", go:"breche"},
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
   t:"Tu as trois exemplaires du même Pokémon. Ne les jette pas : c'est avec des doublons qu'on fait évoluer une espèce, depuis sa fiche au Pokédex."},
  {id:"e_coins", c:()=>S.coins>=2000,
   t:"Deux mille PokéCoins qui dorment. Va acheter des Balls : un stock vide, et tu regardes passer les Pokémon sans rien pouvoir faire."},
  {id:"e_type", c:()=>dexTotal()>=15,
   t:"J'ai classé ton Pokédex par types. Tu captures toujours dans le même secteur, et tu vois donc toujours les mêmes Pokémon. Change de secteur en haut de l'écran."},
  {id:"e_fail", c:()=>S.failStreak>=4,
   t:"Quatre Balls de suite qui n'ont pas tenu. Le calcul est bon, c'est juste la malchance. Une Baie Framby améliore nettement tes chances."},
  {id:"e_lowball", c:()=>((S.balls.poke||0)+(S.balls.super||0)+(S.balls.hyper||0))<=4,
   t:"Tu n'as presque plus de Balls. La boutique en vend, et l'Énergie Onirique se convertit en PokéCoins si tu es à court."},
  {id:"e_idle", c:()=>S.stats.energyTotal>=3000,
   t:"Tes générateurs tournent bien. Pense à convertir l'Énergie : elle ne sert à rien tant qu'elle s'entasse."},
  {id:"e_dex50", c:()=>dexTotal()>=50,
   t:"Cinquante Pokémon au Pokédex. Le secteur tient debout tout seul par endroits. Je ne pensais pas revoir ça."},
  {id:"e_evo", c:()=>S.stats.evolutions>=1,
   t:"L'évolution a fonctionné. C'est le même Pokémon, avec une nouvelle définition, et il a gardé tout son historique. C'est plus rare que ça n'en a l'air."},
  {id:"e_team", c:()=>S.team.length>=3 && S.level>=8,
   t:"Ton équipe est prête. Vérifie les types avant d'y aller : contre un verrou, l'avantage de type pèse plus lourd que dix niveaux d'écart."},
  {id:"e_expfail", c:()=>S.stats.expRuns>=2 && S.stats.expWins===0,
   t:"Deux expéditions perdues. Les PV ne remontent pas tout seuls entre les combats, et un Pokémon KO est perdu pour le reste du parcours. Passe par un Repos avant une Élite, pas après."},
  {id:"e_shinyhunt", c:()=>S.stats.bestStreak>=25 && S.stats.shinies===0,
   t:"Belle chaîne, mais toujours aucun Pokémon chromatique. C'est normal : plus la chaîne est longue, plus ils deviennent probables. Ne la casse pas."},
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
      <span data-act="pzpoke">${pzFace(pzMood(), 40)}</span>
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
  const milestone = milestoneTick() || checkResearchTiers() || checkFragments();
  checkDirectives();
  if(!milestone) checkPzEvents();
}
