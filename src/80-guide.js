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
    <p>· un <b>niveau</b> suffisant (expérience, Tour, Bonbons d'équipe) ;<br>
    · plusieurs <b>exemplaires</b> de l'espèce, donc des doublons ;<br>
    · des PokéCoins, et parfois une <b>pierre</b> vendue en boutique.</p>
    <p>L'espèce évoluée entre au Pokédex comme une entrée à part entière, et l'évolution remplit
    une tâche de sa fiche de recherche.</p>`},

  team:{n:"L'équipe", d:`
    <p>Chaque Pokémon de votre archive a un <b>niveau</b>, le même dans tous les combats. Il monte
    de quatre façons :</p>
    <p>· <b>l'expérience</b> : chaque point que vous gagnez, partout, en donne 60 % à chacun des six
    de Mon équipe ;<br>
    · <b>la Tour</b> : ceux qui y combattent gagnent en plus leur propre expérience ;<br>
    · <b>les Bonbons d'équipe</b> : +1 niveau, à qui vous voulez, depuis Mon équipe. L'Expédition en
    rapporte, comme le Forage, la Tour, les coffres de session et les légendaires de passage ;<br>
    · <b>le compagnon</b> gagne des niveaux avec son affinité.</p>
    <p>Les <b>étoiles</b> viennent des exemplaires obtenus (4, 10, 25, 60) : +6 % de statistiques en
    combat par étoile.</p>
    <p>En combat, le tableau des types décide de presque tout : un ×2 vaut mieux que dix niveaux.</p>`},

  tower:{n:"La Tour", d:`
    <p>Des combats d'équipe à <b>quatre</b>, avec les Pokémon de votre archive à leur niveau. Le premier est le
    <b>meneur</b> : s'il a un passif, toute l'équipe en profite.</p>
    <p>Chaque Pokémon a <b>trois compétences</b> tirées de ses types : une attaque de base, une compétence à
    recharge, une ultime. La <b>Vitesse</b> remplit la jauge de tour : le plus rapide joue plus souvent.</p>
    <p>Six ailes de sept paliers, trois vagues par palier, un boss au septième, en trois difficultés.
    Les <b>parchemins</b>, que seule la Tour donne, font monter les compétences ; l'expérience y fait monter
    le niveau d'archive.</p>
    <p>La jauge de <b>Synchro</b> se remplit quand votre équipe agit et encaisse. Pleine, elle lance une
    frappe d'équipe : tous vos Pokémon attaquent la cible à la suite, puis repartent avec de l'élan. Elle ne
    coûte pas le tour en cours. En automatique, elle part dès qu'elle est prête.</p>
    <p>Les adversaires vaincus lâchent un <b>butin</b> : des PokéCoins, parfois un Bonbon d'équipe, et rarement
    un parchemin (les boss de vague en lâchent un à coup sûr). Une victoire garde tout ; une défaite ne garde
    que les PokéCoins. Un palier déjà franchi se rejoue en automatique, en boucle si vous le souhaitez.</p>
    <p>Étoiles : une pour la victoire, deux avec un K.O. au plus, trois sans aucun K.O.</p>
    <p>Au sommet des ailes 2, 4 et 6 se tiennent les <b>verrous légendaires</b> : ceux de Kanto en Normal,
    de Johto en Difficile, de Hoenn en Enfer.</p>`},
  expedition:{n:"L'expédition", d:`
    <p><b>Le parcours</b> — trois cartes au même dessin. Vous partez du <b>haut</b>. Les deux
    premières finissent sur un <b>Champion</b> dont le type reste secret ; son badge ouvre la carte
    suivante. Au bout de la troisième attend le <b>noyau</b>.</p>
    <p><b>Ce que vous rapportez</b> — si le noyau est atteint, chacun de vos Pokémon qui en revient
    rapporte 4 <b>Bonbons d'équipe</b> (les recrues sauvages ne comptent pas), en plus des 2 de chaque
    Champion et des 5 du noyau. Vous les donnez à qui vous voulez, dans Mon équipe. Une expédition
    réussie rapporte aussi un œuf, une carte de collection et 1 Noyau.</p>
    <p><b>Les niveaux du parcours</b> — on part de la <b>forme de base, au niveau 5</b>. Hautes herbes
    <b>+1</b>, dresseurs et élites <b>+2</b>, Champion <b>+3</b>, le reste <b>+0</b>. Les Pokémon
    évoluent en route ; un échange rend un Pokémon quatre niveaux au-dessus de celui que vous cédez.
    Ces niveaux ne valent que pour le parcours.</p>
    <p><b>K.O.</b> — en Classique, un Pokémon K.O. revient au combat suivant à 25 % de ses PV. En
    Nuzlocke, il ne revient plus de tout le parcours. Dans les deux cas, il reste dans votre archive :
    rien n'est jamais supprimé.</p>
    <p><b>Les soins</b> — les PV ne remontent qu'en partie après un combat. Le Centre Pokémon, avant le
    Champion, soigne tout.</p>
    <p><b>Reliques, Bits, objets</b> — les reliques valent pour toute l'équipe jusqu'à la fin du parcours.
    Les Bits ne servent qu'à l'intérieur. Les objets (coffres, boutique Kecleon) se portent, un par
    Pokémon ; le bouton <b>Sac</b> montre qui porte quoi.</p>
    <p><b>Pause</b> — le menu du bas met le parcours en pause : on le reprend depuis l'accueil.</p>
    <p><b>Corruption</b> — elle monte quand vous prenez des risques : meilleur butin, ennemis plus forts.
    Elle ne redescend jamais.</p>
    <p><b>Sanctuaire</b> — si vous possédez des cartes de légendaires, un Sanctuaire doré peut se cacher
    dans le deuxième secteur : un légendaire de votre collection vous y attend. Battu, il rejoint
    l'équipe. Certaines cartes font aussi vendre à Kecleon un objet unique.</p>`},

  poker:{n:"Le Poké-Poker", d:`
    <p>Un deck de 52 cartes, mais les cartes sont des <b>Pokémon</b>. Il n'y a ni couleur ni rang :
    les combinaisons se lisent autrement.</p>
    <p>· <b>Espèces identiques</b> — paire, brelan, carré.<br>
    · <b>Familles d'évolution</b> — duo, trio, lignée complète.<br>
    · <b>Types</b> — mono-type, duo-type, spectre complet.<br>
    · <b>Suite Pokédex</b> — cinq numéros qui se suivent (les lignées se suivent dans le Pokédex).<br>
    · <b>Chromatiques</b> et <b>légendaires</b> — les combinaisons les plus riches.</p>
    <p>Chaque verrou est tenu par un <b>dresseur</b> : l'objectif est sa jauge de PV, chaque main la fait fondre.
    Au bout de chaque ante, un <b>Champion d'arène</b> impose sa règle (Défense Roc de Pierre, Torrent d'Ondine,
    Paralysie de Major Bob…) et délivre son badge ; après les huit, le Conseil des Quatre puis le Champion.</p>
    <p>Certains <b>programmes évoluent</b> à force d'être utilisés : Salamèche.exe devient Reptincel.exe puis
    Dracaufeu.exe, Magicarpe.exe finit en Léviator.exe, Évoli.exe choisit sa forme selon votre jeu.</p>
    <p>Le score est <b class="cy">Jetons</b> × <b class="bad">Multiplicateur</b>. Les
    <b>programmes</b> s'empilent et transforment complètement une partie. Les <b>boosters</b>
    ajoutent à votre deck des espèces tirées de votre propre archive.</p>
    <p>Certaines <b>cartes de légendaires</b> ouvrent un <b>deck spécial</b> (à choisir avant la partie)
    ou un <b>programme</b> qui rejoint la boutique. Plus tu as d'illustrations du légendaire, plus l'effet est fort.</p>`},

  idle:{n:"Le Forage", d:`
    <p><b>Ton équipe creuse toute seule</b>, même quand le jeu est fermé (jusqu'à 8 h, plus avec les améliorations).
    Elle compte de 3 à 6 Pokémon de ton Pokédex. Plus leur niveau est haut, plus ils creusent vite.</p>
    <p>Chaque couche est faite d'une matière différente. Certains types y creusent <b>deux fois plus vite</b>
    (Sol et Roche dans la terre, Feu dans la glace, Eau dans le magma…), d'autres deux fois moins.
    Le bouton « Choisir les meilleurs » compose l'équipe pour toi.</p>
    <p>Toutes les 7 minutes, ton équipe trouve une <b>fouille</b>. Elles t'attendent (3 au début). Dans une fouille,
    tu casses la roche à la <b>pioche</b> (petite zone) ou au <b>marteau</b> (grande zone, mais abîme deux fois plus).
    Un objet est à toi quand il est entièrement dégagé. Si la solidité tombe à zéro, tout s'effondre : tu gardes
    ce qui était déjà sorti.</p>
    <p>En creusant, tu gagnes aussi de l'<b>Énergie</b>. Elle sert à améliorer le Forage, à lancer des captures
    automatiques, ou s'échange contre des PokéCoins.</p>
    <p>Ton équipe remonte aussi du <b>minerai</b> : cuivre, fer, argent, or, puis la rêvite tout au fond. Les fouilles
    en cachent en petites <b>pépites</b>. À <b>la Forge</b>, le minerai et l'Énergie donnent de meilleurs outils —
    pioche, marteau, foreuse, étais — du bois jusqu'à l'onirique. Chaque matière se voit à l'écran.</p>
    <p>Les fouilles cachent aussi des <b>filons</b> (beaucoup de minerai), des <b>géodes</b>, des Bonbons d'équipe,
    des Poké Balls, des baies, de vieilles cartouches — et, plus rarement, des <b>caisses</b> en bois, en fer, ou
    d'archiviste, qui s'ouvrent à la sortie.</p>
    <p>Quand le puits principal est assez profond, d'autres <b>chantiers</b> s'ouvrent : une grotte, un cratère,
    des ruines, un pic. Chacun repart de zéro, plus dur, avec ses propres trésors et son minerai favori.</p>`},

  fishing:{n:"La pêche", d:`
    <p>La pêche est un mode de l'écran de capture (onglet Pêche), et le lac de la carte y mène.
    La Vieille Canne se déterre au Forage, dans l'une des trois premières fouilles ; si la fouille
    s'effondre avant qu'elle soit dégagée, elle revient dans la suivante.</p>
    <p><b>Les ombres.</b> Des Pokémon nagent dans l'eau : plus l'ombre est grande, plus il est rare.
    Un reflet doré, c'est un chromatique. Une ombre immobile qui brille au fond, un trésor.</p>
    <p><b>Lancer.</b> Touchez l'eau là où vous voulez lancer, près d'une ombre. Le bouton lance vers
    la plus grande. Si rien ne vient, touchez ailleurs pour relancer.</p>
    <p><b>Ferrer.</b> L'ombre goûte le bouchon une ou deux fois : n'y touchez pas, elle filerait. Au
    « ! », touchez n'importe où. À temps, ça tient toujours ; très vite, c'est un <b>ferrage parfait</b> :
    la prise est sonnée, +20 % à la capture. Ensuite, la rencontre se déroule comme une capture.</p>
    <p>Au bout de la ligne : les Pokémon Eau, et des espèces qu'on ne trouve <b>que</b> là —
    Barpau, Rémoraid, Qwilfish, Relicanth, Loupio. Et une fois Hoenn ouvert, avec une canne
    suffisante, quelque chose de bien plus grand.</p>
    <p>La Super Canne et la Méga Canne s'achètent en Fragments : la touche dure plus longtemps,
    elles remontent plus de raretés et de chromatiques. La pluie fait mordre plus vite.</p>`},

  boss:{n:"Les Data Guardians", d:`
    <p>Neuf légendaires transformés en pare-feu, trois par secteur. Ils ne se capturent pas :
    ils se relâchent.</p>
    <p>Ils se tiennent au sommet des ailes 2, 4 et 6 de la <b>Tour</b> (Kanto en Normal, Johto en
    Difficile, Hoenn en Enfer). Pour capter la signature de l'un d'eux, il faut avoir battu le boss
    de son aile, archivé assez d'espèces de son secteur, et levé le verrou précédent.</p>
    <p>Deux vagues d'escorte, puis lui seul. Insensible à l'étourdissement et aux pertes de jauge,
    il se reconfigure à mi-vie : purge, Attaque +, deux renforts. Le dernier verrou d'un secteur
    ouvre le suivant ; le premier levé ouvre la Brèche.</p>
    <p>Une première victoire ajoute l'espèce à votre archive, émet une <b>carte légendaire</b>
    et rend un gros bloc d'intégrité.</p>`},

  cards:{n:"Les cartes légendaires", d:`
    <p>Une carte s'obtient en battant un Data Guardian pour la première fois, au bout d'une
    expédition réussie, dans les Archives du Vide ou avec les objectifs de la semaine.</p>
    <p>Chaque légendaire existe en plusieurs <b>illustrations</b>, d'autant plus rares qu'elles sont anciennes.
    Chacune est peinte dans l'écriture de son époque : les quatre teintes du sprite pour 1996, une image
    lisse pour aujourd'hui. Plus le rendu est ancien, plus le cadre est précieux : argent, chrome, or, laque noire.</p>
    <p>Touche une carte pour l'agrandir, puis fais-la pencher du doigt. Touche-la encore : elle se retourne.
    Au dos : le jour où tu l'as obtenue, d'où elle vient et l'équipe que tu avais ce jour-là.</p>
    <p><b>Les doublons ne sont jamais perdus.</b> Au sixième doublon d'un légendaire, une illustration qui te
    manque réapparaît (c'est la <b>réindexation</b>). Quand tu as toutes ses illustrations, chaque doublon
    rapporte 15 Fragments. Et plus l'intégrité du monde est haute, plus les illustrations anciennes sortent souvent.</p>
    <p>Quand un légendaire est complet, sa <b>chronologie</b> se joue : toutes ses illustrations, de la plus ancienne
    à celle d'aujourd'hui (à revoir depuis sa fiche). Une carte ancienne (1996, 1999 ou 2002) peut aussi lui
    donner l'<b>apparence</b> de son époque : choisis-la au Pokédex. Enfin, les 5 Rendus primordiaux débloquent
    le <b>mode d'affichage</b> 1996, et les 11 Rendus fondateurs le mode 1999 (Réglages).</p>
    <p><b>Chaque carte a un pouvoir.</b> Le légendaire peut t'attendre au <b>Sanctuaire</b> de
    l'Expédition, et il ouvre en plus un deck ou un programme au Poké-Poker, ou un objet chez Kecleon.
    1 illustration = <b>Éclat I</b>, 2 = <b>Éclat II</b>, 3 ou plus = <b>Éclat III</b>.</p>`},

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
    <p><b>Chaque Pokémon a sa fiche de recherche</b>, dans le Pokédex : touchez-le pour la voir.
    Elle compte jusqu'à quatre tâches :</p>
    <p>· <b>★★</b> : en avoir obtenu quatre exemplaires (une étoile suffit pour un Altéré ou un
    Légendaire) ;<br>
    · <b>en vaincre au combat</b>, en Expédition, à la Tour ou dans la Brèche ;<br>
    · <b>la faire évoluer</b>, si elle évolue ;<br>
    · <b>en obtenir une chromatique</b>.</p>
    <p><b>Ce que ça rapporte</b> — chaque tâche donne des Fragments, et les tâches de tout le
    Pokédex s'additionnent : à 25, 60, 120… elles débloquent un palier (PokéCoins, Noyaux, Hyper
    Balls, une Master Ball, des cosmétiques).</p>
    <p>Le filtre <b>Recherche</b> du Pokédex montre les fiches à compléter, et ce qui est presque
    rempli.</p>`},

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
    <p><b>Secteur</b> — une région du monde. <b>Couche</b> — une couche plus profonde, non cartographiée.
    <b>Couche Zéro</b> — celle qui est sous toutes les autres.</p>
    <p><b>Connexion</b> — une tentative de restaurer le monde, du premier jour à la question finale.
    La tienne porte un numéro ; les autres ont laissé des pages.</p>
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
    <p>Une fois MissingNo vaincu, au fond de la Couche Zéro, vous pouvez boucler le cycle : le monde repart
    de zéro, et vous gagnez des <b>Noyaux Zéro</b>. Ce que devient la connexion suivante dépend de votre
    réponse à la question finale.</p>
    <p><b>Ce qui traverse</b> — cartes légendaires, cosmétiques, succès, journal des scènes, pages de journal,
    le fichier de Porygon-Z, Noyaux Zéro et avantages permanents.</p>
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
    {sel:"#enc-stage", t:"Voici un Pokémon désindexé. Sa définition existe encore quelque part, mais plus rien ne pointe vers elle. Il a l'air perdu. Je connais ce sentiment, enfin, j'ai lu des choses dessus."},
    {sel:".ballrow", t:"Une Ball le raccroche au Pokédex. Choisis-en une : le pourcentage affiché est ta vraie probabilité de réussite."},
    {sel:".throwbtn", t:"Touche LANCER : un curseur part sur une barre. Touche encore pour l'arrêter : au centre jaune, +25 % de chances ; plus à côté, un peu moins. Plus le Pokémon est rare, plus le curseur file."},
    {sel:".integrity", t:"Cette jauge, c'est l'état du monde. Elle mesure ce que tu as réparé. Je la regarde à peu près quatre mille fois par seconde."},
    {sel:"#dock", t:"Le reste s'ouvrira au fil de ta progression. Je te préviendrai à chaque fois. Probablement avec trop d'enthousiasme. Allez, {nom} : lance !"}
  ]},
  streak:{steps:[
    {sel:".streakbox", t:"Cinq restaurations d'affilée. Le système appelle ça une chaîne : tant que tu écris sans interruption, le tampon reste chaud."},
    {sel:".streakbox", t:"Un tampon chaud laisse passer des Pokémon chromatiques — ceux dont les couleurs ne correspondent pas à leur définition. C'est de loin le meilleur moyen d'en croiser."},
    {sel:".ballrow", t:"La chaîne ne se brise que si un Pokémon s'enfuit. Une Ball qui rate ne coûte que la Ball."}
  ]},
  pokebox:{steps:[
    {sel:"#screen", t:"Le système garde un tampon de rebut : des Pokémon qu'il a commencé à écrire sans jamais finir de les référencer."},
    {sel:"#screen", t:"Personne ne le surveille. J'y prélève un Pokémon par jour et je te le donne. Techniquement, c'est un vol. Moralement, c'est un cadeau. Je choisis la morale."},
    {sel:"#screen", t:"Tant qu'il te manque un Pokémon, le tampon ne peut pas te rendre un doublon. Il ne peut donc jamais te bloquer."}
  ]},
  fishing:{steps:[
    {sel:"#fs-pond", t:"Cette canne, quelqu'un s'en servait avant que les données se figent. Les ombres dans l'eau, ce sont des Pokémon : plus l'ombre est grande, plus il est rare."},
    {sel:"#fs-pond", t:"Touche l'eau près d'une ombre pour lancer. Elle va goûter le bouchon : ne bouge pas. Au « ! », touche n'importe où. Vite, c'est un ferrage parfait."},
    {sel:"#screen", t:"Certains Pokémon ne remontent qu'au bout d'une ligne. Tu ne les croiseras nulle part ailleurs."}
  ]},
  idle:{steps:[
    {sel:"#fo-shaft", t:"Le Forage. Tes Pokémon creusent ici tout seuls, même quand tu fermes le jeu. Moi je compte les mètres. J'adore compter les mètres."},
    {sel:".fo-tip", t:"Chaque couche a sa matière. Les types écrits ici creusent deux fois plus vite. Quand tu descends, change ton équipe."},
    {sel:".fo-crew", t:"Ton équipe. Touche un Pokémon pour le remplacer, ou « Choisir les meilleurs » si tu me fais confiance."},
    {sel:".fo-wallbtn", t:"Toutes les 7 minutes, ils trouvent une fouille. Ouvre-la, casse la roche, et récupère ce qu'il y a dedans. Fossiles, pierres… et parfois quelqu'un qui dormait."}
  ]},
  eggs:{steps:[
    {sel:"#screen", t:"Ce ne sont pas tout à fait des Œufs. Ce sont des Pokémon que le système a commencé à écrire, puis abandonnés en cours de route."},
    {sel:"#screen", t:"Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle — d'où le décompte en captures, et non en minutes."},
    {sel:"#screen", t:"Plus l'ébauche est avancée, plus elle demande de captures, et plus ce qui en sort est rare."}
  ]},
  boss:{steps:[
    {sel:"#screen", t:"Certains Pokémon n'ont pas disparu de l'index. On leur a donné un rôle : bloquer l'accès aux secteurs voisins."},
    {sel:"#screen", t:"Je ne sais pas qui leur a demandé ça. Ce n'est ni toi ni moi, et il n'y a personne d'autre."},
    {sel:"#screen", t:"Tu ne peux pas les capturer. Il faut les faire céder. Et retiens ceci, je le répéterai jusqu'à ce que tu en aies marre : le tableau des types pèse plus lourd que dix niveaux d'écart."}
  ]},
  expedition:{steps:[
    {sel:"#map-scroll", t:"Une couche non cartographiée : le système y a improvisé sa propre géographie quand il a manqué de place."},
    {sel:"#map-scroll", t:"Tu pars de la porte, en haut, vers le Champion du secteur, en bas. Touche un nœud lointain : je te dis ce qu'il cache."},
    {sel:".team-strip", t:"Ton équipe repart au niveau 5. Hautes herbes +1, dresseurs +2, le reste rien. C'est ta route qui fait ta force."},
    {sel:'[data-act="expgear"]', t:"Les objets que tu trouves se portent : un par Pokémon. Le Sac montre qui porte quoi, et garde le reste pour plus tard."},
    {sel:"#screen", t:"Deux badges, puis le noyau. Chacun de tes Pokémon qui en revient rapporte des Bonbons d'équipe. Ramène-les-moi entiers, s'il te plaît. J'ai commencé à leur donner des surnoms."}
  ]},
  tower:{steps:[
    {sel:".sw-world", t:"La Tour. L'archive y empile ce qu'elle n'arrive plus à ranger : six ailes de souvenirs corrompus, posées les unes sur les autres."},
    {sel:".sw-world", t:"Chaque aile a sept paliers, et un boss au septième. Le battre ouvre l'aile suivante, puis les difficultés Difficile et Enfer."},
    {sel:".sw-teambar", t:"Ici, on ne repart pas de zéro : tes Pokémon combattent à leur niveau d'archive, à quatre. Le premier mène les autres."},
    {sel:".sw-lockbar", t:"Et tout en haut des ailes 2, 4 et 6, quelque chose monte la garde. Tu le sentiras quand tu en seras capable. Moi je le sens déjà. Je préférerais ne pas."}
  ]},
  towerprep:{steps:[
    {sel:".sw-waves", t:"Avant chaque palier, tu vois ce qui t'attend. Regarde les types : c'est eux qui décident, plus que les niveaux."},
    {sel:".sq-intel", t:"Ici, le niveau des vagues face au tien, et les types qui les font plier. Un Pokémon du bon type vaut dix niveaux."},
    {sel:"#pp-host", t:"Le premier emplacement porte la couronne. Les Pokémon puissants y donnent un passif à toute l'équipe."},
    {sel:".sw-go", t:"En combat, chaque Pokémon a trois compétences : une attaque, une à recharge, une ultime. Et quand la Synchro est pleine, toute l'équipe frappe ensemble. Les parchemins de la Tour font monter les compétences."}
  ]},
  poker:{steps:[
    {sel:"#screen", t:"Les données rares ne se rangent pas au hasard : elles se regroupent par motifs. Espèces identiques, familles, types."},
    {sel:"#hand", t:"Ce deck n'a ni couleur ni rang. Ce sont des Pokémon : espèces identiques, familles d'évolution, types, chromatiques."},
    {sel:"#pk-score-line", t:"Chaque motif reconnu stabilise une portion de couche. Jetons multipliés par Multiplicateur : les deux se travaillent séparément."},
    {sel:"#jokers", t:"Les programmes s'empilent ici, de gauche à droite. Ce sont eux qui font les grosses parties, pas les cartes."},
    {sel:".pk2-bl", t:"Chaque verrou est tenu par un dresseur : sa jauge de PV, c'est ton objectif. Au bout de l'ante, un Champion d'arène t'attend avec sa règle."}
  ]},
  dex:{steps:[
    {sel:".ring", t:"L'archive, secteur par secteur. Chaque ligne restaurée rend les lignes voisines plus stables — je ne sais toujours pas modéliser pourquoi."},
    {sel:".dexgrid", t:"Une case sombre est un Pokémon que tu n'as jamais capturé. Sa notice reste illisible tant qu'il n'est pas revenu."},
    {sel:".dexgrid", t:"C'est aussi d'ici que tu fais évoluer un Pokémon, en dépensant des exemplaires en trop."}
  ]},
  buddy:{steps:[
    {sel:".buddy", t:"Un Pokémon capturé garde en mémoire qui l'a attrapé. C'est une ligne d'en-tête, ça ne veut rien dire."},
    {sel:".buddy", t:"Sauf que celle-ci te suit. À chaque palier d'affinité, elle gagne des niveaux définitifs."},
    {sel:".buddy", t:"Et elle ramasse des choses en chemin. Ce comportement n'est écrit nulle part. J'ai vérifié trois fois. Je suis un peu jaloux. C'est noté."}
  ]}
};

let TUTO = null;
function tutoSeen(k){ return (S.tutos||[]).includes(k); }
/* aucune autre couche ne doit etre ouverte : sinon le tutoriel se superpose */
function overlayBusy(){
  /* une scene d'Expedition en cours : on ne l'interrompt pas */
  if(typeof xsOpenNow === "function" && xsOpenNow()) return true;
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
   rw:{balls:{super:8}}, hint:"Chaque niveau rapporte des PokéCoins, et certains ouvrent une salle."},
  {id:"d8",  n:"Archiver 20 espèces",           chk:()=>dexTotal()>=20,      goal:()=>[dexTotal(),20],
   rw:{coins:900, cores:1}, hint:"Change de secteur dans le Pokédex pour repérer ce qui te manque."},
  {id:"d9",  n:"Faire une fouille au Forage", chk:()=>(S.stats.walls || 0)>=1,
   goal:()=>[Math.min(1, S.stats.walls || 0),1],
   rw:{coins:600}, hint:"Ton équipe creuse même quand tu ne joues pas. Toutes les 7 minutes, elle trouve une fouille à faire.", go:"idle"},
  /* la pêche vient après la première fouille : la canne se déterre dans l'une des trois premières */
  {id:"d7",  n:"Pêcher un premier Pokémon",     chk:()=>(S.stats.fish || 0)>=1, goal:()=>[Math.min(1, S.stats.fish || 0),1],
   rw:{shards:20}, get hint(){ return rodLevel() ? "Capture, onglet Pêche : lance près d'une ombre, et ferre au « ! »."
     : "Une Vieille Canne est enfouie dans l'une de tes trois premières fouilles du Forage."; }, go:"@fish"},
  {id:"d10", n:"Archiver 25 espèces",           chk:()=>dexTotal()>=25,      goal:()=>[dexTotal(),25],
   rw:{shards:40}, hint:"Le premier verrou légendaire s'ouvre à 25 espèces de Kanto."},
  {id:"d11", n:"Faire évoluer un Pokémon",      chk:()=>S.stats.evolutions>=1, goal:()=>[S.stats.evolutions,1],
   rw:{coins:1200, stones:{fire:1}}, hint:"Pokédex, fiche d'une espèce que tu as en plusieurs exemplaires.", go:"dex"},
  {id:"d13", n:"Réussir une Expédition", chk:()=>S.stats.expWins>=1,  goal:()=>[S.stats.expWins,1],
   rw:{shards:60}, hint:"Chacun de tes Pokémon qui revient du noyau rapporte des Bonbons d'équipe.", go:"expedition"},
  {id:"d13b", n:"Battre le boss de la Forêt de Jade", chk:()=>typeof sqStars === "function" && sqStars(0, SQ_STAGES - 1, 0) > 0,
   goal:()=>[typeof sqStars === "function" && sqStars(0, SQ_STAGES - 1, 0) > 0 ? 1 : 0, 1],
   rw:{coins:1500}, hint:"La Tour : quatre Pokémon de ton archive, à leur niveau. Le septième palier porte le boss.", go:"tower"},
  {id:"d12", n:"Lever un premier verrou",       chk:()=>S.bosses.length>=1,  goal:()=>[S.bosses.length,1],
   rw:{cores:2}, hint:"Au sommet de la deuxième aile de la Tour. Prends une équipe qui a l'avantage de type.", go:"boss"},
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
   t:"Trois exemplaires du même Pokémon ! Ne les relâche pas : c'est avec les doublons qu'on fait évoluer une espèce, depuis sa fiche au Pokédex. Recyclage. J'adore le recyclage."},
  {id:"e_coins", c:()=>S.coins>=2000,
   t:"Deux mille PokéCoins qui dorment. Va acheter des Balls : un stock vide, et tu regardes passer les Pokémon en agitant les bras. J'ai déjà vu ça. C'était triste."},
  {id:"e_type", c:()=>dexTotal()>=15,
   t:"J'ai classé ton Pokédex par types, pour le plaisir. Verdict : tu tournes en rond dans le même secteur, donc tu vois toujours les mêmes têtes. Change de secteur, en haut de l'écran."},
  {id:"e_fail", c:()=>S.failStreak>=4,
   t:"Quatre Balls de suite qui n'ont pas tenu. Le calcul est juste, c'est la malchance. Une Baie Framby aide nettement. Moi aussi j'aide, mais moins nettement."},
  {id:"e_lowball", c:()=>((S.balls.poke||0)+(S.balls.super||0)+(S.balls.hyper||0))<=4,
   t:"Alerte : réserve de Balls presque vide. Je répète : presque vide. La boutique en vend, et l'Énergie Onirique se convertit en PokéCoins. Fin de l'alerte. Je me suis emballé."},
  {id:"e_idle", c:()=>S.stats.energyTotal>=3000,
   t:"Tes sondes tournent bien. Pense à convertir l'Énergie : entassée, elle ne sert à rien. Comme mes blagues, d'après le système."},
  {id:"e_dex50", c:()=>dexTotal()>=50,
   t:"Cinquante Pokémon au Pokédex. Par endroits, le secteur tient debout tout seul. Je ne pensais pas revoir ça. J'ai mis ma plus belle humeur."},
  {id:"e_evo", c:()=>S.stats.evolutions>=1,
   t:"Évolution réussie ! Même Pokémon, nouvelle définition, et il a gardé tout son historique. C'est plus rare que ça n'en a l'air. C'est même un peu émouvant. Un peu."},
  {id:"e_team", c:()=>S.team.length>=3 && S.level>=8,
   t:"Ton équipe est prête. Avant un verrou, regarde ses types : l'avantage de type pèse plus lourd que dix niveaux d'écart. Je le redirai. Je te préviens."},
  {id:"e_expfail", c:()=>S.stats.expRuns>=2 && S.stats.expWins===0,
   t:"Deux Expéditions perdues. Petit conseil de quelqu'un qui compte tout : les PV ne remontent presque pas entre deux combats. Passe par un Centre ou un repos avant une Élite, pas après."},
  {id:"e_shinyhunt", c:()=>S.stats.bestStreak>=25 && S.stats.shinies===0,
   t:"Belle chaîne, et toujours aucun chromatique. C'est normal : plus la chaîne est longue, plus ils deviennent probables. Ne la casse pas. Je croise mes… je n'ai rien à croiser."},
  {id:"e_boss1", c:()=>S.bosses.length>=1,
   t:"Le verrou est tombé. J'ai relu sa signature : il n'a opposé aucune vraie résistance. Comme s'il attendait qu'on vienne. Ça me fait quelque chose. Je ne sais pas quoi."},
  {id:"e_cards", c:()=>Object.keys(S.cards||{}).length>=1,
   t:"Une carte vient d'être émise à ton nom. Je ne sais pas quel système les fabrique, ni pourquoi il continue. Mais elle est belle, et c'est ton nom dessus, {nom}."},
  {id:"e_poker", c:()=>S.stats.pokerWins>=1,
   t:"Tu as stabilisé une couche entière en jouant aux cartes. Je note que ça marche. Je ne comprends pas pourquoi. Je note aussi que je ne comprends pas."},
  {id:"e_dex150", c:()=>dexTotal()>=150,
   t:"Cent cinquante entrées. Je ne sais pas pourquoi, j'ai l'impression que c'est ici que ça devient difficile. Une intuition. Je n'ai pas d'intuitions, normalement. Continue, c'est tout."},
  {id:"e_buddy", c:()=>buddyTier()>=3,
   t:"Ton compagnon a franchi trois paliers. Il se place toujours entre toi et la rencontre. Ce n'est pas dans sa définition. C'est dans autre chose."},
  {id:"e_buddyfind", c:()=>(S.buddy&&S.buddy.finds>=5),
   t:"Cinq objets rapportés, et il ne garde jamais rien pour lui. Je ne sais pas où il les trouve. J'ai cherché. Il cache bien son jeu, ce petit."},
  {id:"e_weekly", c:()=>S.weekly && S.weekly.quests.some(q=>q.claimed),
   t:"Objectif de la semaine accompli ! Les Noyaux sont la ressource la plus rare du système : garde-les pour les améliorations permanentes ou les Master Balls. Pas pour moi. Je ne mange pas."},
  {id:"e_night", c:()=>S.flags.night,
   t:"Il est très tard chez toi. Je n'ai pas d'horloge, mais j'ai la tienne. L'archive sera encore là demain, {nom}. Moi aussi, normalement."}
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
  /* jamais par-dessus une révélation ou un grand moment : il attend son tour */
  if(typeof stageHold === "function" && stageHold()){ stageDefer(()=>pzTalk(text)); return; }
  text = typeof pzFmt === "function" ? pzFmt(text) : text;
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

/* ---------- la veille ----------
   Une directive, un succès, une pastille du dock ne se vérifiaient qu'après
   certaines actions : souvent, l'annonce n'arrivait qu'au changement d'onglet.
   Toutes les secondes et demie, on regarde. Les annonces passent par la file
   habituelle (rien par-dessus une révélation, un combat ou une scène) ; les
   paliers qui ouvrent une fenêtre attendent un moment calme. */
let WATCH_SIG = "";
function watchQuiet(){
  if(typeof sheetOpen === "function" && sheetOpen()) return false;
  if(overlayBusy()) return false;
  if(typeof stageHold === "function" && stageHold()) return false;
  if(typeof screenLive === "function" && screenLive()) return false;
  return true;
}
function watchTick(){
  if(!S || !S.flags || typeof document === "undefined" || !document.getElementById || !document.getElementById("screen")) return false;
  if(typeof introSeen === "function" && !introSeen()) return false;
  const boot = document.getElementById("boot");
  if(boot && boot.style && boot.style.display === "flex") return false;
  if(typeof CINE !== "undefined" && CINE && !CINE.dead) return false;
  /* la Brèche recouvre tout, annonces comprises : elle fait ses comptes à la sortie */
  if(typeof BR !== "undefined" && BR) return false;
  if(watchQuiet()) guideTick();
  else checkDirectives();
  checkAchievements();
  const sig = typeof dockSig === "function" ? dockSig() : "";
  if(sig !== WATCH_SIG){ WATCH_SIG = sig; try { renderDock(); } catch(e){} }
  return true;
}
if(typeof setInterval === "function") setInterval(()=>{ try { watchTick(); } catch(e){} }, 1500);
