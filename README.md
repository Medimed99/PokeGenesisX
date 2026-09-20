# Pokémon Code Genesis — sources

Jeu web mobile fan-made, non officiel, sans but lucratif.
`dist/index.html` est le jeu complet en un seul fichier (aucune dépendance, aucun build requis pour jouer).

## Structure

Les sources sont modulaires et concaténées dans cet ordre par `build.py` :

| Fichier | Rôle |
|---|---|
| `src/_dexblob.js` | 386 espèces compilées depuis les CSV PokeAPI (nom FR, types, stats, taux de capture, évolutions) |
| `src/_lore.js` | 386 notices d'espèces, reprises de la v1 |
| `src/_pzportrait.js` | 10 portraits expressifs de Porygon-Z (PMDCollab, CC BY-NC 4.0) |
| `src/_cardart.js` | Atlas des illustrations de cartes (76 variantes de légendaires) |
| `src/_chars.js` | Portrait du Prof. Racine et silhouette de MissingNo, dessinés en pixel art |
| `src/_atlas.js` | Atlas PNG des 387 sprites, encodé en base64 et embarqué dans le fichier |
| `src/00-slugs.js` | Identifiants anglais des espèces (réservés à l'enrichissement animé) |
| `src/01-data.js` | Table des types, raretés, objets, attaques, succès, cosmétiques, quêtes, programmes (jokers), événements |
| `src/02-story.js` | 17 scènes narratives, arc de Porygon-Z, réactions contextuelles |
| `src/10-core.js` | État, sauvegarde résiliente, économie, niveaux, intégrité, quêtes, succès |
| `src/15-fx.js` | Particules, nombres flottants, montée de niveau, impulsions de la jauge |
| `src/20-ui.js` | Icônes SVG, routeur d'écrans, modales, toasts, lecteur narratif, déclencheurs de récit |
| `src/30-capture.js` | Rencontres, formule de capture, séries, chromatiques, vedette du jour |
| `src/35-modules.js` | Hub, PokéBox, Pêche, Énergie Onirique (idle), journal quotidien |
| `src/40-battle.js` | Moteur de combat partagé, sélecteur d'équipe, Data Guardians |
| `src/50-expedition.js` | Roguelike à embranchements, reliques, événements, boutique de run |
| `src/60-poker.js` | Deckbuilder : deck, évaluateur de mains, jokers, blinds, antes, boutique |
| `src/70-collection.js` | Pokédex et évolutions, boutique, profil, succès, cartes légendaires |
| `src/73-cards.js` | Cartes de collection : séries par génération, raretés, tirages |
| `src/72-bag.js` | Sac : inventaire unifié, usage des objets sur place |
| `src/74-eggs.js` | Œufs et incubation — éclosion par captures, pas par minuterie |
| `src/75-extras.js` | Compagnon, objectifs hebdomadaires, séquence de révélation animée |
| `src/76-items.js` | Consommables à durée, radar légendaire, trésors de sonde, jours fastes |
| `src/78-milestones.js` | Paliers de secteur, contrats, bonus de première victoire quotidienne |
| `src/80-guide.js` | Tutoriels à projecteur, fiches d'information, directives, événements de Porygon-Z |
| `src/95-online.js` | Client REST Supabase : authentification, sauvegarde distante, classements, échanges |
| `src/85-journal.js` | Journal des scènes, crédits, Nouveau Cycle et avantages permanents |
| `src/90-admin.js` | Panneau de test (monnaies, niveaux, Pokédex, verrous, scènes, simulation de jour) |
| `src/99-boot.js` | Écran de boot, boucles, cycle de vie, PWA, notifications |

## Construire

    python3 build.py          # -> dist/index.html

## Tester

    node test.js              # logique pure (évaluateur de mains, capture, carte, migration)
    node smoke.js             # rendu de tous les écrans + parties simulées
    node battletest.js        # 200+ combats menés à terme (blocages, erreurs)
    node admintest.js         # atlas + chaque action du panneau de test
    node pacing.js            # rythme des premières minutes, médiane sur 25 parties simulées
    node nettest.js           # couche en ligne, contre un serveur Supabase simulé
    node econ.js              # économie de capture, séries et taux par rareté
    node expsim.js            # difficulté de l'expédition, par type de nœud

## Mise en scène des illustrations

Les illustrations officielles sont détourées sur fond neutre. Les poser telles quelles donne une
vignette ; les poser dans une **scène** donne une image. La fenêtre de chaque carte empile donc
cinq couches — ciel, horizon en silhouette, atmosphère en mouvement, voile de brume devant le
sujet, vignettage — et le type dominant choisit l'environnement parmi sept :

| Environnement | Types | Traitement |
|---|---|---|
| Braise | Feu, Sol | horizon incandescent, escarbilles qui montent |
| Abysse | Eau, Glace | rais de lumière venus de la surface, fond sombre |
| Orage | Électrik, Vol | ciel bas, éclairs par intermittence |
| Spores | Plante, Insecte, Poison | particules en suspension, lumière verte |
| Vide | Psy, Spectre, Ténèbres | étoiles, pas d'horizon |
| Monolithe | Roche, Acier, Combat | poussière ocre, crête basse |
| Aurore | Dragon, Fée | voiles colorés en dérive |

## Substituer une illustration

`assets/cardart/<serie>_<numero>.png` remplace l'illustration du dépôt communautaire —
par exemple `g1_150.png` pour Mewtwo en Rendu primordial. Relancer `build_cardart.py` suffit.
Le script recadre, centre et lisse sans déformer.

Ce dossier existe pour vos propres visuels ou ceux que vous commandez. Les illustrations
d'artistes identifiés ne sont pas réutilisables sans leur accord.

## Langage visuel des cartes

Une carte n'est pas du carton : c'est un **enregistrement que le système a imprimé**. Elle emprunte
la grammaire des cartes à collectionner — bandeau de nom, fenêtre d'illustration, routines chiffrées,
pied d'index — mais son matériau est la donnée : trame de circuit, ligne de balayage qui descend,
empreinte de contrôle, bande d'octets. Deux détails sont déterministes et propres à chaque carte :
`cardChecksum()` et `cardBytes()`, dérivés de la série et du numéro.

Chaque série reçoit un traitement qui raconte son ancienneté :

| Série | Traitement |
|---|---|
| Rendu courant | net, sobre, foil lent — fraîchement compilé |
| Rendu antérieur | entrelacement de lignes, foil bleu rapide — l'enregistrement bouge encore |
| Rendu instable | aberration chromatique sur l'illustration, nom qui saute, octets qui clignotent |
| Rendu fondateur | fond chaud gravé, cadre épais, foil doré large |
| Rendu primordial | phosphore vert, lignes de balayage marquées, halo de tube cathodique |
| Sans index | le cadre lui-même est désaligné, bordure pointillée, foil magenta bref |

La vue agrandie s'incline au doigt (`installCardTilt`) avec un reflet qui suit le point de contact.

## Cartes de collection

Seuls les 21 légendaires et fabuleux des trois premières générations sont émis, chacun en
plusieurs illustrations — une par génération où il est apparu. Plus l'illustration est ancienne,
plus elle est rare :

| Série | Source | Nombre | Rareté relative |
|---|---|---|---|
| Standard | illustration officielle | 21 | 100 |
| Holographique | sprite Noir et Blanc | 21 | 45 |
| Corrompue | sprite Émeraude | 21 | 18 |
| Originelle | sprite Cristal | 9 | 6 |
| Primordiale | sprite Rouge et Bleu | 4 | 1,5 |

Soit 76 illustrations, plus une pièce secrète qui n'appartient à aucune série. Les quatre
Primordiales n'existent que parce que quatre légendaires seulement figuraient en Rouge/Bleu :
la rareté vient des données, pas d'un réglage arbitraire.

`python3 build_cardart.py` régénère l'atlas depuis `sprites/cards/`.
Les sauvegardes antérieures sont converties par `migrateCards()` : les quatre anciennes qualités
correspondent exactement aux quatre premières séries.

## Le monde — habitats, heure et météo

Un secteur était une liste plate de 151 espèces où l'on piochait. Trois couches lui donnent une
géographie et un temps, et **les viviers sont dérivés des types, jamais écrits à la main** :
386 listes manuelles auraient dérivé à la première correction.

| Habitat | Ouvre à | Types dominants |
|---|---|---|
| Routes ouvertes | 0 | Normal, Vol, Insecte, Plante |
| Sylve d'index | 12 | Plante, Insecte, Poison |
| Nappes | 24 | Eau, Glace |
| Cavités | 40 | Roche, Sol, Acier |
| Ruines d'archive | 62 | Spectre, Psy, Dragon, Ténèbres |
| Foyer thermique | 86 | Feu, Électrik, Combat |

Le recouvrement entre habitats est **voulu** : une Plante se croise sur la route et en sylve, avec
des poids différents. Le test vérifie qu'aucun type n'est orphelin, pas que les listes sont disjointes.

Entre 20 h et 6 h, Spectre, Ténèbres, Psy et Poison sortent bien davantage. La météo tourne toutes
les vingt minutes, change les raretés, et pèse 20% sur les dégâts des types qu'elle porte.

## Recherche, intègres, talents

**Recherche** — quatre tâches par espèce (en restaurer plusieurs, en vaincre au combat, la faire
évoluer, en croiser une chromatique), sept paliers globaux. C'est ce qui donne une valeur
individuelle aux 386 espèces sans ajouter le moindre système.

**Intègres** — un exemplaire sur cinquante, +8% sur toutes les statistiques. Axe de collection
indépendant du chromatique : un commun peut être intègre, un légendaire peut ne pas l'être.

**Talents** — un par espèce, tiré du type dominant, appliqué dès la construction du combattant
pour que tout ce qui lit un combattant en tienne compte sans y penser.

## Expédition — refonte d'après Pokélike

L'analyse du roguelike **pokelike.xyz** a révélé un défaut de conception : chez eux le jeu est dans
le *choix avant le combat*, chez nous il n'y avait presque rien à choisir. Cinq changements :

| | Avant | Après |
|---|---|---|
| Recrutement | le Pokémon vaincu, sans alternative | **tirage de trois** sur un nœud dédié |
| Poids des nœuds | constants | **par couche** : le début recrute, la fin met à l'épreuve |
| Puissance adverse | niveau seul | **fourchette de total de statistiques par étage** |
| Niveau adverse | calé sur l'équipe | **calé sur l'étage** — sans quoi monter ses Pokémon ne servait à rien |
| Objets | reliques d'équipe | **objets tenus par un Pokémon** : 15 objets, une décision à chaque fois |

Deux nœuds nouveaux : **Archiviste** (dresseur typé, annoncé avant l'entrée) et **Échange**
(céder un membre contre un tirage à trois niveaux au-dessus).

Le Nuzlocke devient un **mode** au lieu d'une règle imposée, et paie 1,8× davantage. Le **Hall des
Archivistes** garde les quarante derniers parcours.

## Tour de Données

L'expédition a un plafond : passé le niveau 50 d'équipe, elle se boucle à tous les coups
(`node expsim.js` le mesure). La Tour n'en a pas — c'est là que vit le défi de fin de partie.

**Traits de type** : deux Pokémon d'un même type dans l'équipe font monter le trait de ce type d'un
palier, jusqu'à trois. Une équipe cohérente vaut mieux qu'une équipe simplement forte.

**Renforts** : chaque étage franchi donne un point de statistique valant +4%, permanent, appliqué à
**toute la lignée d'évolution** — renforcer la forme de base renforce ses évolutions.

Le meilleur étage part au classement en ligne (colonne `tower`, ajoutée au schéma de façon
rejouable sur une base existante).

## Difficulté de l'expédition — ce qu'il ne faut pas casser

Les points de vie ne se régénèrent pas : la menace est l'**usure**, jamais la puissance d'un combat
isolé. Trois réglages l'avaient rendue injouable et ne doivent pas revenir :

1. L'Élite tirait le **meilleur total de statistiques parmi sept** candidats, ce qui alignait
   systématiquement des Pokémon à 600. Elle en tire deux.
2. Le noyau final opposait **trois** adversaires à +9 niveaux avec 1,35× de statistiques. Deux
   adversaires, +4 niveaux, 1,12×, dans une fourchette de total bornée à 460-560.
3. **Rien ne soignait** entre les combats hors relique. Une victoire rend maintenant 25% des PV.

Cibles mesurées par `node expsim.js` (équipe de quatre) : combat 98%, Élite 63 à 86%, noyau 9 à 62%,
runs terminés de 5% à niveau 25 jusqu'à 51% à niveau 70. La réussite doit suivre l'investissement
en niveaux, c'est le lien entre l'expédition et les Data Guardians.

## Sprites de combat

L'atlas contient 773 cellules : d'abord les 386 faces plus Porygon-Z, puis les 386 vues de dos.
`sprite(id, shiny, cls, {back:true})` adresse la seconde moitié. Le Pokémon du joueur est vu de dos
en combat, celui d'en face de face — sans quoi les deux se tournent le dos.

## Sprites

Les sprites sont **embarqués** dans le fichier sous forme d'atlas PNG (387 cellules de
64 px, sprites Emerald/GBA + Porygon-Z, ~354 Ko en base64). Aucune requête réseau n'est
nécessaire : le jeu s'affiche correctement même derrière une politique de sécurité qui
bloque toutes les images externes.

Rendu : `sprite(id, shiny, cls, opts)` produit un `<span class="spr">` positionné sur
l'atlas via deux variables CSS (`--sc`, `--sr`) et `background-position`.

Enrichissement facultatif : `probeAnimated()` teste une image externe au démarrage.
Si elle se charge, les grandes vues (rencontre, combat, scènes) superposent le GIF animé
Black/White par-dessus la cellule d'atlas. En cas d'échec, rien ne change.
Autrement dit, l'animation s'active toute seule dès que le jeu est hébergé ailleurs
que dans un cadre restreint.

Régénérer l'atlas :

    python3 build_atlas.py     # nécessite sprites/g3/*.png et sprites/bw/474.png

## Régénérer les données Pokémon

    python3 build_data.py     # relit data/*.csv (PokeAPI) -> src/pokedex.blob

## Le modèle narratif — trois voix, trois fonctions

Le récit ne tenait que sur une voix. Il en faut trois, et chacune doit avoir une fonction
différente, sinon elles se répètent :

| Voix | Fonction | Forme |
|---|---|---|
| **Porygon-Z** | le présent — il commente, guide, doute | dialogue direct, permanent |
| **Les onze archivistes** | le passé | **fragments trouvés**, jamais de dialogue vivant |
| **MissingNo** | l'antagoniste | arc en six étapes, revient et apprend |

Les **fragments** sont le levier le plus économique du récit : onze textes découverts à intervalles
donnent une enquête longue avec un paiement, sans aucune mécanique nouvelle. Ils racontent, dans
l'ordre : l'optimisme, la méthode, le premier doute, la découverte que le monde était déjà bâti sur
autre chose, que quelqu'un était là avant, que le guide n'a pas toujours été celui-ci, que les
verrous sont des volontaires, que la faille parle, la règle d'effacement, une tentative de la
contourner, et un abandon à 96 %.

**Les deux fils se rejoignent** : ce qui parle depuis la faille est ce qui reste des onze. Elle le
dit elle-même à la sixième étape.

## Combats automatiques — une seule attaque

Leçon tirée de Pokélike : un combat automatique qui enchaîne quatre attaques, des altérations,
des objets et des talents n'est pas suivable. En **automatique**, chaque Pokémon n'a donc qu'une
attaque, de son type dominant, améliorable en trois paliers par la Capsule Technique. Les quatre
capacités restent pour les **Data Guardians**, qu'on joue à la main.

## Secrets

`src/77-secrets.js` regroupe les clins d'œil. Chacun part d'une anomalie réelle des jeux
d'origine, que la fiction du fichier corrompu explique au lieu de la subir.

| Déclencheur | Effet |
|---|---|
| Rencontre avec la faille | le **sixième objet du sac** est multiplié — l'effet de bord historique de MissingNo |
| Nom de l'Archiviste | dix noms sont reconnus par le système, chacun avec sa réplique |
| Chaîne de 151, 251 ou 386 | Porygon-Z remarque la fin de génération |
| Minuit à 3 h | le système « se défragmente » ; il devient plus personnel |
| 27 février, 1er avril, 31 octobre | journées particulières greffées sur le tirage quotidien |
| Toucher Porygon-Z trente fois | il finit par céder |
| Cinq Magicarpe au Poké-Poker | combinaison *Banc de Magicarpe* : dérisoire en Jetons, énorme en Mult |

Dix succès cachés s'y raccrochent. La dette envers **Balatro** est reconnue dans les crédits, et
le programme *Le Jeu du Dessous* en est le clin d'œil assumé.

## Vocabulaire — vérifié par un test

`node lexicon.js` refuse la compilation si le vocabulaire dérive. Il est né d'un constat chiffré :
« Pokémon » n'apparaissait que **7 fois en 4 637 mots**, « dresseur » et « badge » jamais, et cinq
verbes se disputaient l'acte de capturer. Le texte était juste, mais il ne parlait plus du jeu
auquel il fait référence.

Le test impose deux choses. Des **mots proscrits** — « zone », « strate », « vivier », et surtout
« conteneur », qui servait d'écran au mot *Ball*. Et un **ancrage minimal** : au moins 20 « Pokémon »,
10 « Pokédex », 8 « Ball », 10 « chromatique », 12 « chaîne ». On est aujourd'hui à 29, 15, 14, 19, 19.

Règle d'écriture pour Porygon-Z : **il nomme d'abord ce qui vient de se passer en clair, puis ajoute
sa lecture système**. Jamais l'inverse — sans quoi le joueur reçoit « cohérence locale améliorée »
après avoir attrapé un Rattata.

## Vocabulaire — à ne pas mélanger

| Mot | Ce qu'il désigne, et rien d'autre |
|---|---|
| Entité | un individu précis, celui qu'on a en face de soi |
| Espèce | la définition dont cette entité est une occurrence |
| Signature | la trace détectable d'une espèce, avant toute rencontre |
| Restaurer | réussir la capture |
| Archiver | l'effet sur le Pokédex, la première fois seulement |
| Secteur | une région ; **Couche** : une strate profonde, non cartographiée |
| Verrou | un Data Guardian ; **Noyau** : le dernier d'un secteur |
| **Chaîne** | les restaurations consécutives sans fuite |
| **Série** | uniquement les séries d'illustrations des cartes — jamais la chaîne |
| **Altéré** | un palier de rareté (ex-« Corrompu », qui entrait en collision avec le thème) |
| **Chromatique** | une entité dont les couleurs ne correspondent pas à sa définition, indépendant de la rareté |

La fiche `glossaire` dans le jeu reprend ce tableau ; la fiche `rarete` explique la différence
entre rareté et chromatique, qui était la confusion la plus fréquente.

## Équilibrage — ce qu'il ne faut pas casser

Trois réglages se tiennent et ont été mesurés ensemble avec `node econ.js` :

1. **Le taux de capture des communs doit rester au-dessus de 90%.** En dessous, la chaîne se brise
   trop souvent, les paliers de série deviennent inatteignables et la chasse au chromatique s'éteint.
2. **La chaîne ne se brise que sur une fuite**, jamais sur un lancer raté. C'est ce qui rend les
   paliers 25/50/100 accessibles. Le modificateur de cycle « Chaîne fragile » rétablit volontairement
   l'ancienne règle, en échange de Noyaux Zéro supplémentaires.
3. **Les Fragments ne s'achètent pas.** Une Archive scellée convertissait les PokéCoins en
   Fragments douze fois plus vite que la capture : les archives servent à la variété, pas à
   fabriquer de la monnaie. `node shardsim.js` vérifie que le rendement d'une archive reste
   aligné sur celui d'une capture.
4. **La vedette du jour est pondérée par rareté.** Une vedette très rare apparaissant 8% du temps
   multipliait par deux les revenus de certaines journées.

Cibles actuelles : chaîne médiane 23 (Poké Ball) à 66 (Super Ball) ; environ +60 PokéCoins nets par
capture à niveau moyen, pour une ball à 18 ; chromatique de 1/1000 à chaîne nulle jusqu'à 1/125 à
chaîne 250.

## Boucles de rétention

| Boucle | Cadence | Où |
|---|---|---|
| Directives | continue, 16 paliers | carte sur Capture et Modules |
| Série de captures | 10/25/50/75/100/150/250 | écran Capture |
| Compagnon | affinité par capture, 12 paliers | Capture et Profil |
| Quêtes quotidiennes | 4 par jour | Journal quotidien |
| Série de connexion | cycle de 7 jours | Journal quotidien |
| Objectifs hebdomadaires | 3 par semaine ISO | Journal quotidien |
| Contrats de secteur | toutes les 6 h | carte Objectifs |
| Paliers de secteur | 25 / 50 / 75 / 100 % | Pokédex |
| Première victoire du jour | ×2 par module | hub Modules |
| Jours fastes | tirage quotidien, 3 % de jours exceptionnels | bandeau de capture |
| Événements limités | aléatoires, 30 à 60 min | barre supérieure |
| Nouveau Cycle | fin de partie | Profil |
| Production hors ligne | jusqu'à 12 h | rapport au retour |

`node pacing.js` mesure la courbe d'ouverture des modules ; médiane actuelle :
PokéBox 18 s, Sonde 36 s, Énergie 2 min, Data Guardians 7 min 30, Expédition 14 min 30.

## Mettre en ligne

Le guide pas à pas est dans **`DEPLOIEMENT.md`** : schéma Supabase, gabarit du
courriel de connexion, import Vercel, variables d'environnement, et la liste des
sept vérifications à faire une fois en ligne.

## Deux cibles de build

| Commande | Sortie | Usage |
|---|---|---|
| `python3 build.py` | `dist/index.html` | fichier unique, images en base64 — fonctionne partout, même sans réseau ni hébergement |
| `python3 build_web.py` | `web/` | version hébergée : images séparées et mises en cache, service worker, manifeste PWA, `vercel.json` |

Le guide de déploiement complet est dans `web/README.md`.

## Mise en ligne

Le jeu embarque un client REST Supabase (`src/95-online.js`) qui n'utilise aucun SDK externe :
tout passe par `fetch`, ce qui préserve le fichier unique.

### Mettre en service

1. Créer un projet sur supabase.com.
2. Exécuter `sql/schema.sql` dans l'éditeur SQL. Le script est idempotent.
3. Authentication > Email Templates > Magic Link : ajouter `{{ .Token }}` au gabarit.
   Sans cela Supabase n'envoie qu'un lien, et le code à six chiffres attendu par le jeu n'existe pas.
4. Settings > API : copier « Project URL » et la clé « anon public ».
5. Dans le jeu : Profil > En ligne > Compte, coller les deux valeurs.

### Ce que fait la couche

| Fonction | Détail |
|---|---|
| Connexion | code à six chiffres par courriel, aucun mot de passe stocké |
| Sauvegarde | envoi toutes les 5 min et à la fermeture ; runs en cours exclus |
| Conflits | tranchés par un numéro de révision monotone, jamais par l'horloge |
| Classements | vue publique limitée aux colonnes de vitrine ; `payload` jamais exposé |
| Échanges | code à usage unique ; le serveur vérifie la possession du doublon et le décrémente |

### Sécurité

La clé « anon » est publique par conception. L'isolation repose entièrement sur les politiques RLS
de `sql/schema.sql` : un joueur ne peut lire et écrire que sa propre ligne de `saves`. Le classement
passe par une vue qui n'expose que les colonnes de vitrine. Les deux fonctions d'échange sont en
`security definer` avec `search_path` figé, et vérifient `auth.uid()` avant toute écriture.
`node nettest.js` rejoue tous ces parcours contre un serveur simulé, y compris l'expiration de jeton,
le refus d'une révision inférieure et le double usage d'un code d'échange.

## Crédits et statut

Pokémon est une marque de Nintendo / Creatures Inc. / GAME FREAK inc.
Ce projet n'est ni affilié ni approuvé par ces sociétés.
Sprites chargés à l'exécution depuis les dépôts communautaires `PokeAPI/sprites`
et Pokémon Showdown (aucun asset n'est embarqué dans le fichier).
Données d'espèces issues du dépôt `PokeAPI/pokeapi` (CSV).
