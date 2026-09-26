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

## Standard des cinématiques

Le lecteur de dialogues sait afficher des répliques. Une scène importante demande un décor, des
acteurs, des effets et du rythme : c'est le rôle de `src/37-cine.js`. **Toute scène importante du jeu
s'écrit avec ce moteur**, et `test.js` vérifie chacune contre le standard.

**Une scène est une liste de plans ; un plan, une liste de temps.** Le vocabulaire est fermé :

| Temps | Rôle | Paramètres |
|---|---|---|
| `bars` | bandes de cinéma | `on` |
| `bg` | décor | `labo`, `void`, `terminal`, `faille` |
| `card` | carton de titre | `text`, `sub`, `hold` |
| `actor` / `leave` | entrée, sortie | `kind` prof·pz·mon, `enter` fade·pop·assemble, `how` fade·tear |
| `mood` | humeur de Porygon-Z | `mood` |
| `say` | réplique tapée | `who`, `text`, `corrupt` 0–1, `auto` |
| `fx` | effet | `shake`, `flash`, `glitch`, `rgb`, `noise`, `blackout` — `lv` 1 à 3 |
| `code` | lignes de terminal | préfixe `>` commande, `!` erreur, `✓` succès |
| `rain` | pluie de données | `on` |
| `par` | temps simultanés | `beats` |

**Règles.** Toute scène se passe et s'avance au doigt. Trois intensités d'effet, jamais plus. Trois
univers de couleur : le monde **d'avant** (chaud, pastel, boîte de texte classique), le **système**
(sombre, cyan), la **faille** (magenta). Les durées viennent de `CINE_T`, jamais d'un chiffre isolé.
Le professeur parle **depuis un moniteur** : c'est un message enregistré, et c'est lui qui se
corrompt. Porygon-Z est **projeté** dans un cadre holographique aux équerres du jeu.

**Vérifier une scène à l'œil** : `python3` + Playwright rejoue la scène dans Chromium au format
mobile et capture les moments clés ; c'est ainsi qu'ont été trouvés un bruit statique qui ne
s'arrêtait jamais (lancé deux fois, arrêté une) et une opacité posée en style direct qui l'emportait
sur la classe censée le cacher.

La première scène est l'ouverture, **« L'écriture interrompue »** : le monde d'avant, la panne,
le redémarrage, le réveil. Elle remplace l'ancienne scène d'ouverture et se revoit depuis le journal.

## La Brèche — le survivors-like

Le module d'action du jeu, qui **remplace les Data Guardians** : les verrous légendaires y sont les
gardiens, vaincus avec exactement les mêmes récompenses (`brGuardianWin`). Trois fichiers :
`56-breche.js` (moteur : sprites corrompus, sols, armes, pools), `57-breche-run.js` (la partie :
vagues, boss, rendu), `58-breche-ui.js` (interface, hall, Archive, intégration).

**La boucle.** Le pouce déplace l'Archiviste, l'équipe le suit en file. Chaque Pokémon attaque seul
avec **une attaque par type** — dix-sept archétypes lisibles au premier coup d'œil (cône de flammes,
vague, chaîne d'éclairs, orbites, rochers lancés, séisme…). À chaque niveau : **un choix parmi trois**
(nouveau Pokémon, amélioration, objet). Niveau 5 : le Pokémon évolue. Niveau 8, en tenant le
**catalyseur** de son type, il atteint son évolution finale au coffre suivant — la condition se
découvre en jouant. Élites toutes les 60 s (coffre), alpha à 4 min, encerclements toutes les 45 s,
**gardien à 8 min**, puis la **faille profonde** en mode infini.

**Autour.** Brèche du jour à graine partagée ; Archive à reconstruire avec les Données (gagnées même
en cas de défaite) ; la Brèche nourrit la recherche, restaure des élites au Pokédex et lève les verrous.
Aucune énergie, aucune limite de runs, aucune série qui se brise.

**Calibrage mesuré** (`node brsim.js 10` : runs complètes sans navigateur, deux profils) —
premier habitat de Kanto : gardien atteint et vaincu environ 6 fois sur 10, combat de boss de 25 à
30 s, évolution finale une run sur deux. Johto (×1,45) et Hoenn (×2) sont nettement plus durs.
Rendu vérifié dans Chromium : 60 images par seconde avec la horde.

### Les cartes (`59m-breche-map.js`)

Le monde est généré par morceaux de 480 px à partir de la graine de la run : **unique à chaque
partie, identique pour tous dans la Brèche du jour** (testé). Chaque morceau peut porter :

- du **relief** qui bloque le passage et crée des goulets : arbres (dont la ramure devient
  translucide quand on passe dessous), rochers, stalagmites, colonnes gravées, basalte fissuré ;
- des **terrains** : l'eau ralentit l'Archiviste (sauf avec un Pokémon Eau ou Vol) et un peu la
  horde ; la lave brûle tout le monde, et on peut y attirer les ennemis ;
- des **lieux** qu'on active en restant à côté (aucun bouton, le pouce reste sur le déplacement) :
  caches de données, autels (boost de 30 s), Pokémon captifs (ils rejoignent l'équipe, puis le
  Pokédex), et des **nids de corruption** qui déversent des ennemis tant qu'on ne les détruit pas.

| Habitat | Élément signature |
|---|---|
| Routes | arbres à baies : une baie de soin tombe régulièrement |
| Sylve | sous-bois dense, souche ancienne (+2 niveaux à un Pokémon) |
| Nappes | lacs et **remous** qui aspirent et noient la horde |
| Cavités | **obscurité** (on ne voit que ce que l'équipe éclaire), cristaux géants |
| Ruines | **dalles-glyphes** qui foudroient tout autour quand on marche dessus |
| Foyer | lave, et **geysers** qui entrent en éruption toutes les six secondes |

**Trois missions par run** (deux générales, une propre à l'habitat), payées en Données et en
PokéCoins, avec un bonus quand les trois sont faites. Des flèches au bord de l'écran indiquent
les quatre lieux utiles les plus proches. **Maîtrise par espèce** : chaque rang (1, 3, 6, 10, 15 runs)
ajoute 4 % de dégâts à l'espèce, affiché en étoiles.

### Confort de jeu

- **Pause automatique** : tant qu'un choix de niveau, un coffre ou une évolution est à l'écran, la
  partie est figée. À la reprise, 0,8 s d'invulnérabilité.
- **ATH mobile**, tout en haut : PV chiffrés, expérience, **frise de la partie** (élites, alpha,
  gardien, et le prochain événement annoncé ; en faille profonde, le palier suivant), l'équipe sur six
  emplacements avec jauge de niveau, les objets, les synergies et les boosts actifs. Toucher l'équipe
  ouvre la pause détaillée.

### Contenu étendu (`59-breche-plus.js`)

- **Le second type colore l'attaque** : brûlure, poison, gel, paralysie, repoussée, vol de vie,
  critiques, perce-armure… Des centaines de combinaisons sur 386 espèces.
- **Synergies de type** : un type présent sur 2 membres (palier 1) ou 4 (palier 2) donne un bonus.
- **L'évolution finale change la forme de l'attaque** et son nom (Flammèche → Déflagration, qui
  embrase le sol ; Éclair → Fatal-Foudre, chaîne bien plus longue ; trois rayons pour Draco-Météore…).
- **15 objets** (dont Orbe Vie, Casque Brut, Bouclier Data, Baie Sitrus) et des **cartes dorées** rares.
- **Ramassables** : l'**Octet Turbo** triple la vitesse et fait percuter la horde ; l'aimant aspire
  tous les octets ; la baie soigne.
- **Menaces** dès la run normale : tireurs, kamikazes, blindés, scindeurs.
- **Faille profonde** : un palier par minute (+30 % de PV ennemis chacun), un écho de légendaire
  tous les trois paliers, et au palier 12 **MissingNo**, qui accélère sans cesse. Mesuré avec
  l'Archive au maximum (`node brsim.js 6 deep`) : toutes les runs se terminent, profondeur médiane 12.

## Sprites chromatiques

Les chromatiques affichent les **vrais sprites chromatiques** (faces Émeraude, dos Rubis/Saphir,
Porygon-Z de Noir/Blanc), avec la lueur dorée par-dessus. Avant, deux règles CSS se marchaient
dessus : il ne restait que la lueur sur le sprite normal. `build_atlas_shiny.py` construit l'atlas
chromatique à partir de `sprites/g3s` et `sprites/g3bs`, **cellule pour cellule dans la même
disposition** que l'atlas normal : afficher un chromatique ne change que l'image de fond. En ligne,
il est chargé à part et seulement quand un chromatique apparaît.

## Cosmétiques — une signature chacun

Le « Cadre doré » et le « Cadre trésorier » étaient deux fois la même classe CSS. Règle désormais,
vérifiée par les tests : **aucun cadre ni aucun fond ne partage son rendu**, et chaque cosmétique a une
matière, une forme et un mouvement propres.

| Cadre | Signature | Obtenu par |
|---|---|---|
| Doré | or massif biseauté, reflet qui passe | — |
| Trésorier | tranche de pièce crénelée, sceau ¤ | 50 000 PokéCoins |
| Circuit | double trait, soudures aux angles | 100 espèces |
| Prismatique | anneau arc-en-ciel tournant | 25 chromatiques |
| Originel | rose de Mew et violet de Mewtwo en alternance | Mew et Mewtwo |
| Éléments | bleu, rouge, vert tournants | Kyogre, Groudon, Rayquaza |
| Trois ailes | glace, foudre, feu | le trio ailé |
| Champion | or et magenta, couronné | terminer une partie de Poké-Poker |

**Huit effets**, chacun une petite scène : Marée primordiale (Kyogre), Éruption (Groudon), Aurore
céleste (Rayquaza), Onde psychique (Mewtwo), Plumes sacrées (Ho-Oh), Pluie d'étoiles (5 chromatiques),
Couronne du Champion, Signal non indexé (l'arc de la faille). Sept fonds les accompagnent. Les succès
des légendaires restent cachés, comme leurs noms dans la collection.

Le profil est visible **en miniature dans l'en-tête de tous les écrans**, avec cadre, fond et effet.

## Poké-Poker — écran pour le pouce

Tout tenait dans le haut de l'écran et laissait le bas vide ; la main de huit cartes défilait de côté
et se coupait ; « Abandonner » voisinait avec « Jouer ». L'écran est désormais une colonne qui occupe
toute la hauteur : l'état de la manche en haut, **le tapis au centre** (le calcul jetons × multiplicateur
en grand, qui prend tout l'espace libre), la main en **deux rangées de quatre**, puis les actions sous le
pouce — « Jouer la main » plus large que « Défausser ». Combinaisons, Deck et Abandonner passent dans un
menu. Le choix du verrou suit la même grammaire.

Mesuré dans Chromium sur trois formats (`tools/measure.py`) : aucun chevauchement ; tout tient à l'écran
en 390 × 844 et 412 × 915 ; sur écran court, un léger défilement, rien de masqué.

**Deux scènes** au moteur de cinématiques : le **badge** (le joyau se reconstruit, l'annonce système,
Porygon-Z) et la **main secrète**, jouée une seule fois pour toute la sauvegarde (glitch, les Pokémon de
la main, le titre en grand). Le moteur gagne une **file d'attente** — une main secrète qui gagne la manche
enchaîne sur le badge au lieu de le couper — et un acteur **emblème**.

## Architecture de l'interface

Principe : **chaque chose est rangée là où on la cherche.**

| Onglet | Contenu |
|---|---|
| Capture | capture, pêche, habitats |
| Modules | *Aujourd'hui* (cadeau PokéBox, quêtes, contrats) + les **activités** : Forage, Expédition, Data Guardians, Poké-Poker — dans leur ordre de déblocage |
| Collection | Pokédex · Recherche · Cartes · Couveuse |
| Sac | Sac · Boutique |
| Profil | un bandeau qui ouvre l'**Atelier**, et un menu : cartes, succès, statistiques, journal, en ligne, réglages |

Le hub ne nomme ni ne décrit une salle verrouillée : il montre la **suivante** par sa seule condition
d'ouverture, et compte les autres. L'**Atelier** regroupe nom, avatar, titre, cadre, fond et effet
avec un aperçu en direct ; les pièces non obtenues sont comptées, pas nommées.

**Outils de test** : protégés par un mot de passe, demandé à l'activation et à la première ouverture
du panneau dans chaque session. Seule son empreinte figure dans le code. C'est une barrière contre
l'activation par mégarde, pas une sécurité : le code s'exécute chez le joueur.

## Le metteur en scène

Les 27 scènes du récit et les 6 étapes de la faille passent **toutes** par le moteur de cinématiques,
sans avoir été réécrites. `directStory()` les met en scène selon des règles fixes :

- **l'univers** découle des voix : la faille si elle parle, le laboratoire si le professeur parle, le
  système sinon ;
- **les acteurs** entrent à leur première réplique, à des places fixées d'avance (professeur et faille
  à gauche, Porygon-Z à droite quand ils partagent la scène) ;
- **la faille prend corps** — MissingNo apparaît — à sa première réplique ;
- **le système** parle en console neutre, et en rouge **seulement** pour une erreur ;
- **les scènes majeures** ont bandes et carton-titre, les mineures restent sobres.

Les scènes clés reçoivent une **piste de direction** (`DIRECTION`) : des temps insérés avant une
réplique donnée, ou en fin de scène. Le climax s'y termine dans le décor chaud du monde d'avant :
le monde réparé ressemble à l'ouverture, avant la panne.

Une scène écrite à la main (`CINEMAS`) prime toujours sur la mise en scène automatique.

**Professeur en pied** : déposer `assets/prof_full.png` (fond transparent). Sans ce fichier, il parle
depuis le moniteur du laboratoire.

## La pêche et les exclusivités

La pêche n'est plus un module : c'est un **mode de l'écran de capture**. La Vieille Canne se trouve
en capturant (1 chance sur 90 à partir du niveau 3, garantie à la 150e capture) ; la Super et la
Méga Canne s'achètent en Fragments. On lance, on attend que le bouchon plonge, on ferre.

Chaque activité a ses **exclusivités**, sur le modèle des vrais jeux :

| Source | Espèces |
|---|---|
| Pêche | Barpau, Rémoraid, Qwilfish, Relicanth, Loupio, **Kyogre** (Hoenn ouvert, Super Canne minimum) |
| Œufs | les dix bébés des générations II et III |
| Forage | les fossiles, reconstitués à la couveuse |
| Parc Safari (week-end) | Kangourex, Tauros |

`isExclusive()` les retire de **tous** les viviers sauvages — capture, habitats, PokéBox, expédition,
Tour, capture autonome. Le test le vérifie sur 340 espèces.

**Toute relance de rencontre passe par `nextEncounter()`**, qui respecte le mode. Quatre appels
différents relançaient une rencontre classique après une fuite en Pêche.

## Mesurer sans se tromper

Trois fois, une « régression » était en réalité un artefact de simulation : la météo, un événement
« raretés », puis le jour faste, tirés au hasard et restés actifs pendant toute la mesure. Règle :
**toute simulation fige `S.weather`, `S.event` et `S.luckyDay`**. Et un garde-fou ne s'appuie plus sur
un tirage : `test.js` calcule la médiane de chaîne **exactement** à partir des formules (24 à la
Poké Ball), ce qui ne peut pas varier d'une exécution à l'autre.

## Le forage — l'idle refondu

L'ancien module d'Énergie Onirique empilait quatre générateurs et un bouton de conversion : aucune
décision, aucune découverte. Les jeux idle qui retiennent convergent tous sur les mêmes règles —
une boucle simple qui se complexifie lentement, des paliers qui débloquent des **mécaniques** et
pas seulement des chiffres, une automatisation qui soulage, et un prestige qui compose sur
**plusieurs** axes plutôt qu'un multiplicateur unique.

On fore donc dans les rêves des Pokémon archivés. **Neuf strates**, chacune ouvrant une mécanique :
sondes automatiques, percussion, filons, réservoir profond, trouvailles, Échos, cadence, rendement
souverain. **Six axes de recalibrage** (rendement, frappe, réservoir, pénétration, flair, résonance) :
c'est le choix entre eux qui distingue deux joueurs.

La **sphère Genesis** est une vraie sphère CSS — une coque ombrée pour le volume et huit méridiens
en rotation 3D pour la profondeur. Sa vitesse suit la production, sa lueur l'Énergie, et elle
encaisse chaque frappe.

Rythme mesuré par `node forsim.js` (sessions de 8 min, 2 h d'absence entre chaque) :

| Strate | Atteinte après |
|---|---|
| Couche molle | 3 min — dans la première session |
| Sédiment → Nappe chaude | une strate par retour, environ toutes les 2 h |
| Faille mineure (Échos) | ~11 h |
| Substrat, Noyau onirique | après recalibrage |

`node forsim2.js` vérifie que le recalibrage accélère réellement : la seconde descente atteint la
Faille mineure en 6,4 h au lieu de 10,7 h (×1,67) et va une strate plus bas.

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

## La carte — liaisons monotones

La première version reliait chaque nœud au plus proche en colonne, ce qui produisait des chemins
entrecroisés : le joueur ne voyait plus où menait sa route. Sur 400 cartes, **1 317 croisements**.

Les liaisons sont maintenant **monotones**. Chaque nœud d'une rangée reçoit un bloc contigu de
cibles dans la rangée suivante, et les blocs se suivent de gauche à droite. Deux liaisons ne peuvent
donc jamais se croiser. L'embranchement ne déborde d'un cran que si le bloc suivant commence après
le nôtre — c'était précisément la faille de ma première tentative, qui laissait encore des
croisements quand deux nœuds partageaient une cible.

Mesuré sur 500 cartes : **0 croisement, 0 nœud inatteignable, 0 impasse, 31 % de liaisons offrant
un choix**.

## Tour de Données

Elle n'est **pas** un module à part : c'est la troisième voie du module Expédition, à côté de
Classique et Nuzlocke. Multiplier les modules perd le joueur — ce sont des variantes d'une même
chose, elles restent au même endroit.

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

## Contrat entre le jeu et la base

`nettest.js` compare chaque champ envoyé par le jeu aux colonnes déclarées dans `sql/schema.sql`,
et chaque colonne lue par le classement à celles exposées par la vue. Ce test est né d'un oubli réel :
la colonne `tower` a manqué au schéma pendant plusieurs versions, ce qui faisait échouer la
sauvegarde en ligne. Les colonnes ajoutées après coup le sont par `add column if not exists`, et
placées **en fin de vue** — PostgreSQL refuse d'insérer une colonne au milieu d'une vue existante.

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
