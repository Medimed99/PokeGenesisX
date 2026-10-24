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
| `src/59l-breche-legends.js` | La Brèche : une attaque propre à chacun des 21 légendaires (mécanique, dessin en trois couches, équilibrage) |
| `src/_atlas.js` | Atlas PNG des 387 sprites, encodé en base64 et embarqué dans le fichier |
| `src/00-slugs.js` | Identifiants anglais des espèces (réservés à l'enrichissement animé) |
| `src/01-data.js` | Table des types, raretés, objets, attaques, succès, cosmétiques, quêtes, programmes (jokers), événements |
| `src/02-story.js` | 38 scènes en cinq actes, chaîne principale (`MAIN_ARC`), souvenirs de Porygon-Z, jetons du nom et des connexions (`pzFmt`), réactions contextuelles |
| `src/10-core.js` | État, sauvegarde résiliente, économie, niveaux, intégrité, quêtes, succès |
| `src/15-fx.js` | Particules, nombres flottants, montée de niveau, impulsions de la jauge |
| `src/20-ui.js` | Icônes SVG, routeur d'écrans, modales, toasts, lecteur narratif, déclencheurs de récit |
| `src/30-capture.js` | Rencontres, formule de capture, séries, chromatiques, vedette du jour |
| `src/30c-onze.js` | Les Pokémon des onze : onze Pokémon surnommés par les archivistes d'avant, qui reviennent dans les rencontres une fois leur page trouvée |
| `src/55h-histoire.js` | Ton équipe a une histoire : arrivée (quand, comment), combats, K.O., fins tenues presque à zéro, meilleur de l'équipe ; elle suit l'évolution ; Porygon-Z remarque les caps |
| `src/39p-demandes.js` | Porygon-Z te demande quelque chose : une des quêtes du jour devient sa demande, exaucée d'elle-même, rappelée le lendemain |
| `src/35-modules.js` | Hub, PokéBox, Pêche, Énergie Onirique (idle), journal quotidien |
| `src/40-battle.js` | Moteur de combat partagé, sélecteur d'équipe, Data Guardians |
| `src/50-expedition.js` | Roguelike à embranchements, reliques, événements, boutique de run |
| `src/60-poker.js` | Deckbuilder : deck, évaluateur de mains, jokers, blinds, antes, boutique |
| `src/70-collection.js` | Pokédex et évolutions, boutique, profil, succès, cartes légendaires |
| `src/73-cards.js` | Cartes de collection : séries par génération, raretés, tirages, rendu des cartes |
| `src/73d-reindex.js` | Réindexation : au sixième doublon d'un légendaire, l'illustration la plus courante qui manque réapparaît |
| `src/73e-provenance.js` | Dos des cartes (provenance, équipe du jour), exemplaires annotés par les onze, cadeau de 1996 |
| `src/73f-chrono.js` | Chronologie d'une ligne complète, de 1996 à aujourd'hui |
| `src/73g-pzcard.js` | La carte de Porygon-Z, écrite à la fin ÉCRIRE |
| `src/73h-eras.js` | Apparences d'époque : sprites d'origine, animations repeintes à la palette de l'époque, aura |
| `src/73i-displaymodes.js` | Modes d'affichage 1996 et 1999 |
| `src/73j-cardnews.js` | « Tes cartes ont changé » : la page montrée une fois à une partie qui avait déjà une collection |
| `src/72-bag.js` | Sac : inventaire unifié, usage des objets sur place |
| `src/74-eggs.js` | Œufs et incubation — éclosion par captures, pas par minuterie |
| `src/75-extras.js` | Compagnon, objectifs hebdomadaires, séquence de révélation animée |
| `src/76-items.js` | Consommables à durée, radar légendaire, trésors de sonde, jours fastes |
| `src/78-milestones.js` | Paliers de secteur, contrats, bonus de première victoire quotidienne |
| `src/80-guide.js` | Tutoriels à projecteur, fiches d'information, directives, événements de Porygon-Z |
| `src/95-online.js` | Client REST Supabase : authentification, sauvegarde distante, classements, échanges |
| `src/36-lore.js` | Les onze pages de journal (une par connexion passée) et l'arc de la faille |
<<<<<<< HEAD
| `src/37-cine.js` | Moteur de cinématiques, ouverture, souvenirs, nom en octets, MissingNo (la fêlure) |
| `src/37d-plateau.js` | Le plateau : le monde peint sous les cinématiques, acteurs, caméra, lumière, souvenir, l'archiviste en pixels, défragmentation, effacement, textes du monde, portrait de celui qui parle |
| `src/37e-decors.js` | Les quatorze lieux peints en pixel art (laboratoire, console, Route 1, ciel de Hoenn, faille, Couche Zéro…) et les accessoires (Poké Ball, professeur, œuf, trésor, fêlure) |
| `src/37f-mise-en-scene.js` | Le metteur en scène (`directStory`) et la table `STAGE` : ce qu'on voit, scène par scène |
| `build_pz.py` | Porygon-Z, acteur principal : dix-sept portraits et quinze poses (PMDCollab), embarqués (`_pzportrait.js`, `_pzanim.js`) |
=======
| `src/37-cine.js` | Moteur de cinématiques, ouverture, mise en scène automatique des scènes, souvenirs, silhouette, nom en octets |
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
| `src/85-journal.js` | Journal des scènes par actes, crédits, Nouveau Cycle et avantages permanents |
| `src/86-saga.js` | La saga : connexions, `choses_formidables.txt`, mémoire de Porygon-Z, Couche Zéro, entrée n° 387, générique |
| `src/87-finale.js` | La fin : combat contre MissingNo, révélation, question (effacer ou écrire), écho ; les échos de tes réponses |
| `src/88-share-mn.js` | La carte-image « entrée n° 000 » (1080 × 1350) : partage natif, enregistrement, Journal |
| `src/90-admin.js` | Panneau de test (monnaies, niveaux, Pokédex, verrous, scènes, simulation de jour) |
| `src/96-pwa.js` | Installation de l'application ; version du jeu, mise à jour disponible (`version.json`) |
| `src/99-boot.js` | Écran de boot, boucles, cycle de vie, PWA, notifications |

## Construire

    python3 build.py          # -> dist/index.html

## Tester

    node test.js              # logique pure (évaluateur de mains, capture, carte, migration)
    node smoke.js             # rendu de tous les écrans + parties simulées
    node battletest.js        # 200+ combats menés à terme (blocages, erreurs)
    node admintest.js         # atlas + chaque action du panneau de test
    node pacing.js            # rythme des premières heures et des premières étapes du récit, médiane sur 25 parties
    node nettest.js           # couche en ligne, contre un serveur Supabase simulé
    node econ.js              # économie de capture, séries et taux par rareté
    node expsim.js            # difficulté de l'expédition, par type de nœud
    node script.js            # exporte le texte intégral du récit vers SCRIPT.md

## Le récit

Un jeu Pokémon qui bugue, un programme d'entretien — Porygon-Z — qui devient le seul ami de l'Archiviste,
un mythe qui ronge le monde — MissingNo — et des pages de journal laissées par d'autres archivistes. Porygon-Z
retrouve la mémoire avec l'intégrité et avoue que les onze autres sont allés au bout, et ont **choisi** de tout
effacer. Au fond de la Couche Zéro, MissingNo vaincu se lit : c'est **le nom du joueur**. Les onze, c'était lui ;
il effaçait pour ne pas perdre Porygon-Z, que le système décharge à 100 %. Cette fois, il se souvient de tout,
et une autre ligne apparaît : **écrire** Porygon-Z dans le Pokédex, à l'entrée n° 387.

- **`RECIT.md`** — la bible : les retournements, les voix, la chaîne principale scène par scène, les pages,
  la faille, la Couche Zéro (conditions, combat, équilibrage), la révélation, les deux réponses, les cycles.
- **Les cinq questions** (`STORY_Q`, `02-story.js`) : au bout de cinq souvenirs, Porygon-Z pose une question,
  on répond d'un toucher. Aucune n'est pénalisée ; il s'en souvient à la révélation, à la question finale,
  dans l'épilogue et au générique (RECIT.md, 4.4). « Passer » file jusqu'à une question sans réponse.
  Une ligne de scène `{q:"mem1"}` pose la question ; `{when:"mem1:pret", …}` réserve une réplique à une réponse ;
  dans une cinématique écrite à la main, `fnEcho(q, {réponse: texte})` (87).
- **Les Pokémon des onze** (`30c-onze.js`, RECIT.md 5 bis) : un Pokémon surnommé par archiviste d'avant, qui revient
  dans une rencontre ordinaire une fois sa page trouvée ; surnom gardé au Pokédex et dans l'équipe ; nommés à la révélation.
- **Ton équipe a une histoire** (`55h-histoire.js`) : chaque Pokémon garde la sienne (`S.dex[id].h`), lisible au Pokédex
  (« Arrivé le 1er octobre : capturé dans les Routes ouvertes, à Kanto, en Salamèche. 10 combats · 9 victoires · 26 K.O. »).
  Les chemins d'arrivée autres que la capture posent `DEX_HOW` juste avant `addToDex` (œuf, PokéBox, Forage, verrou,
  Brèche, achat, évolution). Les combats s'inscrivent par deux crochets : `sqStrike`/`sqFinish` (Tour, verrous, fin)
  et `handleKO`/`finishBattle` (combats au tour par tour). Porygon-Z dit au plus un cap par combat (dixième, cinquantième,
  centième combat ; première fin tenue presque à zéro ; cent K.O.) ; le générique nomme « le plus fidèle ».
- **Porygon-Z te demande quelque chose** (`39p-demandes.js`) : chaque jour, une quête facile devient une demande dans sa
  voix (une espèce que tu connais déjà, trois Pokémon d'un type, d'un habitat ouvert, un lancer Excellent, une évolution…),
  toujours faisable avec ce qui est ouvert. Exaucée, elle se règle d'elle-même et il répond ; le lendemain, il y revient
  (« Le Psykokwak d'hier a toujours mal à la tête. J'ai vérifié ce matin. »). Il compte les oui (10, 30, 100) ; le générique
  et la fin d'EFFACER s'en souviennent. Visible sur l'accueil et en tête des quêtes du jour.
- **Ton entrée n° 000** (`88-share-mn.js`) : proposée une fois après la réponse finale, puis dans le Journal.
- **Effets réduits** (Réglages, et une ligne au premier écran) : plus de flash plein écran, de secousse, de
  clignotement rapide ni de bande inversée ; un fondu doux à la place. Actif d'office si le téléphone demande
  moins d'animations. `calmFx()` / `applyCalm()` (10-core), classe `body.calm`.
- **`SCRIPT.md`** — le texte intégral, généré depuis le code : `node script.js`.

## Cartes de collection

Seuls les 21 légendaires et fabuleux des trois premières générations sont émis, chacun en
plusieurs illustrations — une par génération qui l'a dessiné. Plus l'illustration est ancienne,
plus elle est rare, et plus la matière de son cadre est précieuse :

| Série | Sujet | Écriture de la scène | Cadre | Cartes | Rareté |
|---|---|---|---|---|---|
| Rendu courant | illustration officielle | image lisse, profondeur de champ | argent brossé | 21 | 100 |
| Rendu antérieur · 2010 | sprite Noir et Blanc | 40 couleurs, à peine tramées | chrome bleu, reflet holographique | 21 | 45 |
| Rendu instable · 2002 | sprite de 3ᵉ génération | 20 couleurs tramées, lignes qui ont glissé | graphite, dérive rouge et cyan | 21 | 18 |
| Rendu fondateur · 1999 | sprite Or/Argent | 8 couleurs tramées | or gravé | 11 | 6 |
| Rendu primordial · 1996 | sprite Rouge/Bleu | les quatre teintes du sprite lui-même | laque noire, or et os, paillettes | 5 | 1,5 |

Soit 79 illustrations, plus une pièce secrète, Sans index. Les cinq Primordiales sont les quatre
légendaires déclarés en Rouge/Bleu, et Mew, qui ne figurait nulle part. (Les sprites de Mew et de
Celebi, qui pèsent moins de 400 octets, étaient écartés par un test de taille : Mew primordial et
les deux Rendus fondateurs manquants sont revenus.)

### Une carte est une pleine illustration

Pas d'attaques, de PV ni de faiblesse : un nom, un sous-titre (le titre de gardien, sinon le nom
de la scène), la série et son année, et la rareté en cinq facettes. Sous la carte agrandie, un
cartel décrit l'image comme une œuvre, sans jargon technique : « La caverne d'origine » — Rendu
primordial, « Le sprite de 1996, en quatre teintes. » (`cardSpec`).

**Chaque époque peint son propre monde.** Le sujet est le sprite de la génération, détouré (le
fond blanc des sprites Rouge/Bleu et Or/Argent est retiré par remplissage depuis les bords ; les
blancs du corps, entourés d'un contour, restent). La scène autour de lui est régénérée dans les
contraintes de la même époque : les quatre teintes du sprite tramées comme sur Game Boy pour 1996,
huit couleurs pour 1999, et ainsi de suite jusqu'à l'image lisse d'aujourd'hui. Le sprite reste à
une échelle entière — un pixel du sprite vaut un pixel du décor ; un petit sprite (Mew, Celebi,
Jirachi) resserre la grille plutôt que d'être grossi.

Chaque légendaire a sa scène, écrite une seule fois en coordonnées normalisées dans
`cardthemes.py` (« Pics gelés à l'aube », « Cœur de l'orage », « La comète millénaire »…) et
rendue à toutes les résolutions par `cardscene.py` : même composition, seule l'écriture change.

**Le cadrage se fait sur le corps, pas sur la boîte.** Chaque pixel du sujet pèse sa distance au
bord : un corps épais pèse lourd, une queue ou une aile fines pèsent peu. La carte se centre sur ce
corps ; la queue de Rayquaza ou de Latias peut sortir de la carte (au plus 20 % du sujet de chaque
côté), et un sujet étiré grandit un peu pour que son corps remplisse la carte. Quand l'automatique
ne suffit pas, `FRAME` dans `cardsrc.py` retouche une carte à la main (échelle, décalage) — Sulfura,
dont la tête est au bout de l'aile, en est le premier exemple.

**La carte agrandie s'incline sous le doigt** (`installCardTilt`) : la scène recule, le sujet
avance, le reflet glisse sur la matière, le holographique ne s'allume qu'en Rendu antérieur, les
paillettes qu'en Rendu primordial. À l'ouverture, une seule lumière traverse la carte. Neige,
braises, pluie ou poussière s'animent — en pas de pixel pour les époques anciennes. En effets
réduits, rien ne bouge de lui-même.

Le dos de carte porte une rosace de gravure, comme un titre ou un billet : la carte a été émise.
Une carte non émise ne montre que la matière de sa série, et seulement si la série est connue.

### Atlas et construction

`python3 fetch_cardsprites.py` télécharge ce que le dépôt ne contient pas (le dossier `sprites/`
n'est pas versionné) : les dos Rouge/Bleu et Cristal et l'illustration de Porygon-Z.
`python3 build_cardart.py` produit deux atlas — `px` (pixel art, WebP sans perte) et `hd`
(illustrations lisses, WebP) — et `src/_cardart.js` (atlas embarqués, manifeste, titres des
scènes, années). `--apercu <dossier>` écrit en plus une image de chaque carte. `build_web.py` sort
les deux atlas en fichiers à empreinte pour la version hébergée.

### Substituer une illustration

Dans `assets/cardart/` (détails dans `LISEZMOI.txt`) :

- `<serie>_<numero>.png` remplace le **sujet** — par exemple `g1_150.png` pour Mewtwo en Rendu
  primordial ; il est recadré, centré et lissé sans déformation ;
- `<serie>_<numero>_scene.png` remplace la **scène** entière (format 5:7, 300 × 420 ou plus).

Relancer `build_cardart.py` suffit. Ce dossier existe pour vos propres visuels ou ceux que vous
commandez. Les illustrations d'artistes identifiés ne sont pas réutilisables sans leur accord.

Les sauvegardes antérieures sont converties par `migrateCards()` : les quatre anciennes qualités
correspondent exactement aux quatre premières séries.

### Ce que deviennent les cartes

Avant la collection complète, presque tout ce qu'on tire est un doublon (94 % sur une partie
simulée). Les cartes servaient surtout à leur pouvoir ; elles ont désormais leur propre vie.

- **Réindexation** (`73d-reindex.js`). Chaque doublon d'un légendaire est comparé aux autres
  (`S.reidx`) : au sixième, l'illustration la plus courante qui manque encore est restaurée, et
  révélée juste après le doublon qui l'a fait apparaître, avec sa jauge sous chaque doublon. Une
  ligne complète décompose chaque doublon en 15 Fragments. Les restaurations qui n'ont pas trouvé
  de scène attendent un moment calme (`S.reidxQ`). Simulation : la collection complète passe
  d'environ 1 360 cartes tirées à environ 380. Une partie existante compte ses doublons d'avant,
  une fois (`S.reidxV`), et voit d'un bloc ce qu'ils ont retrouvé.
- **L'intégrité fait remonter les écritures anciennes** : à 100 %, chaque série plus ancienne pèse
  1,3 fois plus au tirage (`cardIntegrityBias`).
- **Le dos des cartes** (`73e-provenance.js`). Chaque obtention dit d'où elle vient
  (`cardHowSet(kind, …)` juste avant `grantCardV`) : un verrou levé, une Expédition, un passage
  légendaire, un coffre… La première carte garde cette provenance, la connexion et l'équipe du
  moment (`S.cards[k].h`). La carte agrandie se retourne d'un toucher.
- **Les exemplaires annotés.** Une fois la page d'une connexion trouvée, un doublon de son
  légendaire peut arriver annoté au dos (deux chances sur cinq, forcément au troisième) : onze
  annotations, signées `▒▒▒▒ · connexion 0X` puis du nom du joueur après la révélation
  (`CARD_NOTES`, panneau du Journal). Le papier dépasse un peu derrière la carte.
- **Le cadeau de 1996.** Après son premier aveu (`pz_mem3`), Porygon-Z rend le Rendu primordial de
  Mew, gardé depuis la connexion 01 (sinon un autre primordial, sinon un fondateur).
- **La chronologie** (`73f-chrono.js`). Une ligne complète se rejoue une fois, de la plus ancienne
  écriture à celle d'aujourd'hui, chaque carte se posant sur la précédente ; une phrase par époque,
  tirée du vrai sprite (taille, couleurs), et une phrase pour chaque légendaire.
- **La carte de Porygon-Z** (`73g-pzcard.js`, `CARD_PZ`). À la fin ÉCRIRE : le Rendu inédit, sur
  une page du journal, « Écrit par ‹nom› », cadre de nacre au liseré cyan et magenta. Elle ne
  compte dans le total que quand elle existe.
- **Les apparences d'époque** (`73h-eras.js`). Une carte de 1996, 1999 ou 2002 prête son époque au
  légendaire, partout où il est au joueur (jamais aux adversaires) : le vrai sprite d'origine, face
  et dos, là où le jeu dessine des sprites fixes (Pokédex, combat classique, listes d'équipe) ; les
  sprites de Donjon Mystère (équipe, accueil, Tour, Brèche, Expédition, Forage) ne sont **pas**
  redessinés : leur animation est repeinte avec la palette du sprite d'époque — les quatre teintes
  de 1996 et 1999 dans les proportions du sprite d'origine, la couleur la plus proche pour 2002.
  Les dos Rouge/Bleu et Cristal viennent de `fetch_cardsprites.py` ; `build_cardart.py` range faces,
  dos, cadres d'origine (`o`, `ko`) et palettes (`q`) dans l'atlas et le manifeste.
  Sur ces animations, une **aura** distingue le légendaire qui porte une autre époque : une lueur
  qui épouse sa silhouette (cyan au large, couleur de la série au bord : os, or, magenta), un halo
  qui respire et quelques fragments de données qui montent. La lueur est l'ombre de canvas de la
  même image dessinée loin hors du cadre (`eraAuraGlow`) : pas de filtre, le même rendu partout,
  et seulement pour les siens. En effets réduits, la lueur reste, immobile, sans fragments.
- **Les modes d'affichage** (`73i-displaymodes.js`). Les cinq Rendus primordiaux ouvrent le mode
  1996 (quatre verts, police de pixels), les onze Rendus fondateurs le mode 1999 (peu de couleurs,
  saturées). Une seule passe de filtre CSS sur l'application, composée par le processeur graphique.
- **Ce qui a changé dans tes cartes** (`73j-cardnews.js`). Une partie qui avait déjà au moins six
  cartes avant cette version (`S.saga.cnews`, posé au premier passage) reçoit une fois, au premier
  calme, une page de Porygon-Z : le même légendaire à trois époques, puis une ligne par nouveauté
  (scènes, dos, doublons, chronologies avec un bouton, apparences, affichage d'époque s'il est
  ouvert). Tant qu'elle n'est pas montrée, les autres révélations attendent (`reidxQuiet` ;
  `reidxCalm` pour le seul calme) ; les modes d'affichage déjà ouverts y sont annoncés, sans
  moment en plus. Une partie neuve ne la voit jamais. Le cadeau de 1996 reçu en double
  (`reidxSkip`) n'est ni relu par la réindexation ni annoté par une autre connexion.

## Standard des cinématiques

Le lecteur de dialogues sait afficher des répliques. Une scène importante demande un décor, des
acteurs, des effets et du rythme : c'est le rôle de `src/37-cine.js`. **Toute scène importante du jeu
s'écrit avec ce moteur**, et `test.js` vérifie chacune contre le standard.

**Une scène est une liste de plans ; un plan, une liste de temps.** Le vocabulaire est fermé :

| Temps | Rôle | Paramètres |
|---|---|---|
| `bars` | bandes de cinéma | `on` |
| `bg` | fond d'ambiance (sans plateau) | `labo`, `void`, `terminal`, `faille`, `souvenir`, `zero` |
| `card` | carton de titre | `text`, `sub`, `hold` |
| `actor` / `leave` | élément d'interface (emblème, nom en octets…) | `kind` emblem·…, `how` fade·tear |
| `mood` | humeur de Porygon-Z : son portrait, et son corps sur le plateau | `mood` (17 humeurs) |
| `say` | réplique tapée | `who`, `text`, `corrupt` 0–1, `auto` |
| `fx` | effet | `shake`, `flash`, `glitch`, `rgb`, `noise`, `blackout` — `lv` 1 à 3 |
| `code` | lignes de terminal | préfixe `>` commande, `!` erreur, `✓` succès |
| `rain` | pluie de données | `on` |
| `par` / `seq` | temps simultanés / à la suite | `beats` |

**Le plateau** (`src/37d-plateau.js`) : sous la scène, un monde peint en pixel art, à l'échelle de
Donjon Mystère (un pixel du monde = deux pixels de l'écran). Ses temps :

| Temps | Rôle | Paramètres |
|---|---|---|
| `set` | un lieu peint | `k` (voir `37e`), `v` variante, `light`, `cam`, `mem` (sépia), `sep` (force du sépia), `keep` |
| `plat` | l'état du lieu | `st` (barre du moniteur, compteur, sauvegardes allumées…), `holes`, `on:false` |
| `put` / `gone` | un acteur entre, sort | `kind` pz·mon·swarm·mn·mnname·prop, `at` (ancre ou `[x, y]`), `to` (entrée en marchant), `enter` fade·assemble·form·cut, `how` fade·scatter·tear·cut |
| `move` / `face` / `anim` / `hop` / `emote` / `tremble` | il marche, se tourne, joue une pose PMD, saute, montre un signe, tremble ou clignote | `to`, `dir`, `a`, `e` |
| `cam` / `light` | la caméra (glisse, zoom 1 ou 1,5), la lumière | `to`, `z`, `ms` / `k` |
| `swarm` | l'archiviste d'avant | `do` speak·unstable·calm·form·collapse (il se tasse en L) |
| `ball` | une Poké Ball lancée | `from`, `to`, `catch`, `miss` |
| `wl` | un texte du monde (fenêtre, fichier, compteur, question du système) | `k` win·file·count·sysq·log·tag |
| `defrag` / `erase` / `letters` | la mémoire se range ; le monde s'efface ligne à ligne ; des lettres se mélangent | `n` ; `from`, `to` ; `text` |

**Règles.** Toute scène se passe et s'avance au doigt. Trois intensités d'effet, jamais plus. Les
durées viennent de `CINE_T`, jamais d'un chiffre isolé. **Chaque scène a un lieu** : la console
d'entretien (chez Porygon-Z), le laboratoire, la Route 1, le ciel de Hoenn, la faille, la Couche
Zéro… **Porygon-Z joue** : ses humeurs se voient avec le corps (un saut de joie, une douleur, un
temps d'arrêt), son portrait s'affiche au-dessus de la boîte, comme dans Donjon Mystère. Dans le
présent, il est **projeté** (une lueur cyan sous lui) — jusqu'à ce qu'il soit écrit dans le Pokédex.
La narration est un sous-titre, sans boîte. Les textes du monde (fichiers, compteurs, questions du
système) ne sortent jamais de l'image et ne passent jamais sous les bandes ni sur la boîte.

**Effets réduits** : ni bandes qui sautent, ni pixels qui tremblent, ni secousses ; l'archiviste perd
moitié moins de pixels ; le grain du souvenir ne bouge plus.

**Vérifier une scène à l'œil** : `python3` + Playwright rejoue la scène dans Chromium au format
mobile et capture les moments clés ; c'est ainsi qu'ont été trouvés un bruit statique qui ne
s'arrêtait jamais (lancé deux fois, arrêté une), une opacité posée en style direct qui l'emportait
sur la classe censée le cacher, et des Pokémon qui n'entraient jamais parce qu'une ancre portait le
nom d'un acteur (les ancres du lieu passent désormais avant les acteurs).

La première scène est l'ouverture, **« L'écriture interrompue »** : le monde d'avant, la panne,
le redémarrage, le réveil. Elle remplace l'ancienne scène d'ouverture et se revoit depuis le journal.

## L'Arène — les combats mis en scène (`41`)

Retour d'expérience : la Descente (donjon au tour par tour) était trop longue et peu addictive.
**L'Expédition et la Tour ont repris leur place dans le hub** ; la Descente n'est plus proposée
(son code reste dans le build, sans point d'entrée, et aucune sauvegarde n'est touchée).
La recette retenue est celle d'un Pokélike : carte à embranchements, combats automatiques,
recrues à choisir — en version immersive. Première pierre : l'arène.

- **Le moteur (`40`) reste seul juge.** L'arène n'invente aucun chiffre : elle écoute ce que le
  moteur annonce (`arHook` : une attaque part, un coup porte, un K.O., une relève) et le rejoue
  sur un canvas, dans l'ordre. Sans canvas (tests Node, vieux navigateur), `arOn()` renvoie faux
  et le combat se déroule comme avant.
- **Deux équipes face à face** : champions au centre, réserves en colonne sur leur bord, sprites
  de marche PMD avec poses d'attaque, de tir et de douleur (repli sur le sprite fixe tant que la
  planche n'est pas arrivée).
- **Une manière de frapper par type** (`AR_KIND`) : charge, lames, jet continu, rayon, foudre,
  éboulement, fissure, anneaux psychiques… Le nom de la capacité peut l'emporter sur le type
  (`arKindOf` : une « Griffe » charge, un « Rayon » tire).
- **Le poids des coups** : recul, flash blanc, tremblement proportionnel aux dégâts, arrêt sur
  image et resserrement de caméra sur un critique ou un coup super efficace, traces au sol,
  barre de vie à deux temps, K.O. en défragmentation, saut de joie à la victoire.
- **Un décor par type d'adversaire** (`AR_BIOME`), généré une fois par combat.
- **Les gardiens** (noyau d'Expédition, gardien d'étage de la Tour, verrous) ont leur carte de
  nom ; chaque membre de l'équipe d'un noyau est annoncé comme une phase.
- **Rythme** : ×1 / ×2 / ×4, maintenir le doigt sur l'arène triple la vitesse, un bouton passe
  le combat. `bStep()` remplace les délais fixes du moteur : il attend la fin de la mise en scène.
- Le journal écrit chaque ligne au moment où l'image la montre.

À suivre (deuxième livraison) : la carte-voyage, les recrues révélées comme des cartes, les
événements racontés par Porygon-Z.

## La Tour — combats d'équipe façon Summoners War (`55`, `55b`, `55c`)

- **Équipe de 4** Pokémon de l'archive, à leur niveau d'archive (les niveaux se gagnent en Expédition).
  Le premier est le **meneur** : les espèces puissantes (BST ≥ 470, légendaires) ont un passif tiré de
  leur meilleure statistique (`sqLeaderOf` : Attaque, Défense, PV, Vitesse, ou critique pour les
  Dragons et Ténèbres).
- **3 compétences** par espèce (`sqSkillsOf`) : attaque de base du type principal, compétence à
  recharge (`SQ_S2`, par type principal), ultime (`SQ_S3`, par second type). Effets : brûlure,
  poison, étourdissement, ralentissement, Défense/Attaque −, Attaque/Défense/Vitesse +, bouclier,
  soin, purge, jauge ±, perce-défense.
- **Jauge de tour** à la Vitesse (`sqNext`), recharges, effets qui s'usent en fin de tour.
- **Scénario** : six secteurs sur une carte du monde, **sept paliers** chacun (le septième est le boss
  du secteur), trois vagues par palier, trois difficultés **Normal / Difficile / Enfer** (+16 et +32
  niveaux, monstres plus solides), chacune ouverte par le boss de la précédente. Étoiles : 3 sans
  perte, 2 avec une perte, 1 sinon.
- **Préparation** (comme Summoners War) : les vagues à affronter, le niveau des vagues face à celui de
  l'équipe, les types qui les font plier (`sqPrepIntel`), quatre emplacements dont le meneur, la liste
  de ses Pokémon en grille, la règle des étoiles, le bouton COMBAT.
- **Combat en vue de trois quarts** (`55c`) : l'équipe en bas à gauche tournée vers le haut-droite, les
  monstres en haut à droite, profondeur. L'écran raconte les événements du moteur sans jamais lire
  l'état interne en avance : chaque coup porte les PV restants (`hp` dans l'événement), une vague
  arrive avec sa liste (`foes`), une attaque de zone forme un groupe (`g`) joué d'un seul coup.
  Plaques de vie sous les pieds, dessinées après tous les sprites, avec la traînée du coup ; sprites
  ancrés aux pieds (`sqSprDraw`), **au repos en pose Idle** (planches PMD `-idle`, `build_pmd_extra.py`)
  et en marche seulement pour entrer en scène ; pose **Charge** pour les ultimes.
- **Décors peints** par aile (`sqPaintScene` : forêt, grotte, centrale, tour hantée, plage, volcan,
  vide du verrou), l'aire de combat tramée en diagonale entre les deux camps, les accessoires dans les
  deux coins libres ; **ambiance animée** (`sqAmbient` : lucioles et feuilles, poussière, étincelles,
  feux follets, reflets, braises, bits) et lumières qui clignotent, vacillent ou palpitent.
- **Lisibilité** : ordre des prochains tours (`sqPredict`), barre du boss en tête, efficacité de la
  compétence choisie sur chaque adversaire (▲▲ / ▼), impacts à la forme de leur type (`SQ_IMPACT`),
  coupure d'ultime, entrée du boss, chiffres qui s'empilent.
- **Synchro** (`sqSync`) : jauge d'équipe nourrie par l'action (+7 par action, +10 par K.O., +3 par coup
  reçu) ; pleine, toute l'équipe frappe la cible à la suite (×1,35) puis gagne 20 % de jauge, sans
  consommer le tour. L'automatique la lance dès qu'elle est prête.
- **Butin** (`sqLoot`) : chaque adversaire vaincu lâche des PokéCoins, parfois un Bonbon d'équipe, 3,5 %
  de chances d'un parchemin (un à coup sûr pour un boss de vague) ; il vole jusqu'au compteur.
  Victoire : tout est gardé ; défaite : les PokéCoins seuls (`sqLootGrant`).
- **Répétition** : en automatique, un palier gagné peut se relancer en boucle (compte à rebours).
- **Page des compétences** (`sqSkillsHtml`) : un Pokémon à la fois, trois cartes avec l'effet actuel,
  le gain du niveau suivant (avant → après), le prix, l'animation de montée ; accessible depuis la
  carte, la préparation et les résultats. **Reprendre l'ascension** mène au prochain palier non franchi.
- **Expérience** : chaque combat en donne à l'équipe (`sqGiveXp`) et fait monter le niveau d'archive.
- **Parchemins** (récompense propre à la Tour) : monter une compétence (+8 % par niveau, recharge −1
  au niveau 5), pour toute la lignée. Les renforts de lignée de l'ancienne Tour restent appliqués.
- **Manuel** (compétence puis cible au toucher) ou **automatique** (`sqAI`), vitesses ×1/×2/×4.
- **Verrous légendaires** (les Data Guardians, `sqLockGate`, `sqLockWaves`, `sqPhase`, `sqLockFinish`) :
  au sommet des ailes 2, 4 et 6, un par difficulté — Kanto en Normal, Johto en Difficile, Hoenn en
  Enfer. Ouvert quand le boss de l'aile est battu dans cette difficulté, que l'archive compte assez
  d'espèces du secteur (`guardianAvailable`) et que le verrou précédent est levé. Une vague d'escorte
  à ses types, puis lui seul (niveau = boss de l'aile + 4, `sqLockLevel`), insensible à
  l'étourdissement et aux pertes de jauge ; à mi-vie il se reconfigure (purge, Attaque + 3 tours, deux
  renforts). La victoire passe par `brGuardianWin` (archive, carte légendaire, intégrité, noyaux) et
  donne des parchemins ; rejouable, récompenses réduites. L'ancien écran `boss` mène ici.
- **Déblocages** : Tour (niveau 10) → Data Guardians découverts au boss de la Forêt de Jade → le premier
  verrou levé ouvre la **Brèche** (niveau 12 ; les parties qui y avaient joué la gardent) → Poké-Poker.
  La Brèche se termine toujours sur son Alpha (`brGuardianFor` rend `null`).
- Simulation : `node squadsim.js <avance de niveau>` ; verrous : `node squadsim.js 0 locks <niv. de
  compétence> [smart]` (équipes au hasard : 5 à 50 % ; équipes choisies au type : 40 à 100 %).

## Les pages des onze (`36-lore.js`)

Une page par **connexion passée** (01 à 11), signée d'un nom illisible — autant de signes que le nom du joueur —
jusqu'à la révélation, où elles se signent de son nom. Porygon-Z se tait sur les pages tant qu'il n'a pas fait
son premier aveu (`pz_mem3`). Les pages de journal des archivistes précédents ne surgissent plus d'elles-mêmes : elles se **trouvent là où
leur auteur a travaillé** (`FRAG_META` : au fond d'une Ball à la capture, dans une paroi du Forage, au bout
d'une Expédition, au sommet d'une aile de la Tour, au bord de la faille dans la Brèche). Si la salle n'est pas
ouverte, ou après 80 captures d'attente, la page tombe dans les captures. Toujours dans l'ordre (`fragNext`).
On la trouve (un moment : la page tombe en tournoyant), **on choisit de la lire** en touchant ; elle arrive
brouillée et se déchiffre sous les yeux, puis Porygon-Z dit ce qu'elle lui fait. Le journal devient le
**dossier des onze** : onze feuillets épinglés, ceux à lire marqués, et pour la page suivante, l'endroit où
chercher et sa condition. *Aujourd'hui* signale les pages non lues.

## Les moments (`37b-moments.js`)

Deux à six secondes plein écran pour les caps du jeu, entre la cinématique et le toast, toujours passables
d'un toucher, mis en file s'ils tombent pendant une scène : **nouvelle salle** (battants qui s'ouvrent, avec un
mot de Porygon-Z — avant, un module s'ouvrait en silence), **nouvelle strate** du Forage (les couches défilent),
**aile de la Tour franchie** (étendard), **verrou levé** (la silhouette se colore et monte, avec l'adieu du
gardien), **Pokémon endormi** dans une paroi (il s'ébroue). Une ancienne partie ne rejoue pas les salles déjà
ouvertes (`S.flags.roomsSeen`).

## Le Forage refait (`38-forage.js`)

Inspiré de PokeClicker (tes Pokémon travaillent), du Souterrain de Diamant/Perle (la fouille de paroi) et de
Mr. Mine (la profondeur comme récit, des trouvailles qui t'attendent).
- **Équipe de forage** de 3 à 6 Pokémon de l'archive (`crewIds`, `digPower` = niveau × (0,6 + BST/700) × affinité).
  Neuf strates (`STRATA`) avec une matière, une dureté et des **bons types** (×2) ou mauvais (×½). Au-delà du
  Noyau, la dureté croît sans fin. Avance strate par strate, en direct comme hors ligne (`forageAdvance`).
- **Fouilles** (le mot vu par le joueur ; `wall` dans le code) : une toutes les 7 minutes de forage (`WALL_SECS`), réserve de 3 à 8. Fouille sur une grille 12×9
  (`genWall`, `digHit`) : pioche (précise, 1 de stabilité) ou marteau (large, 2), fer indestructible, effondrement.
  Butin (`DIG_LOOT`) : éclats → Fragments, trésors, pierres d'évolution (une strate favorise chacune), fossiles
  précis (`f_helix`, `f_dome`, `f_amber`, `f_root`, `f_claw` → couveuse), Pierre Ovale → ébauche, Pierre Dure
  et Os Rare → Noyaux, objets tenus, et des **Pokémon endormis** des types de la strate qui rejoignent le Pokédex.
- **Énergie Onirique** (par mètre, croissante avec la strate) : améliorations `FOR_UPS` (galeries, rails, étais,
  pioche, radar, réserve/hors ligne, lampe) et capture autonome, inchangée.
- Écran simplifié : trois étapes en tête tant qu'on n'a pas fait trois fouilles, « rapide / lent » au lieu de chiffres de puissance, une phrase claire sur les bons types, améliorations en « maintenant → ensuite », couches et captures automatiques repliées. Mots du joueur : couche, fouille, solidité, Énergie.
- Ancienne partie : la strate devient une profondeur en mètres, les Échos restent (+3 % de forage chacun).
- Rythme : `node forsim.js`.

### Trouvailles des fouilles (`38c-dig-plus.js`)
- Filon (5 à 9 minerais), géode, sachet de Bonbons, Poké Balls enfouies, baies fossilisées, cartouche fêlée (Intégrité), météorite (Rêvite), et trois caisses rares (bois, fer, archiviste) ouvertes en grand moment à la sortie. Dessins en pixels (`DIG_ART`). Pépites : 5 à 8 par fouille, 1 à 3 minerais chacune ; l'équipe remonte un minerai toutes les 90 s.

### Forge, minerais et chantiers (`38b-forge.js`)
- **Minerais** (`ORES`) : cuivre, fer, argent, or, rêvite — un par paire de couches (`ORE_BY_STRATUM`). L'équipe en
  remonte un toutes les 2 minutes de forage (`ORE_SECS`), et chaque fouille cache 3 à 5 **pépites** (une case,
  `small`) qui ne comptent pas pour « tout dégager ».
- **Forge** (`TOOLS`, `toolCost`) : pioche, marteau, foreuse, étais ; six matières, du bois à l'onirique. Une matière
  coûte son minerai, un peu du précédent et de l'Énergie. Les anciennes améliorations « pioche » et « étais » sont
  migrées vers les outils (`forage()`). Chaque matière a sa palette : boutons de fouille, outil qui frappe,
  pioches des Pokémon, étais et foreuse dans le puits. Lanternes, détecteur et wagonnets montrent aussi les
  améliorations.
- **Chantiers** (`FOR_SITES`) : Grotte Azurée, Cratère Ardent, Ruines Oubliées, Pic Météore. Repérés quand le
  puits principal atteint une profondeur, ouverts contre de l'Énergie. Chacun garde sa profondeur
  (`siteSwitch`), a une roche plus dure (`hard`, compensée en Énergie), des types favoris, un butin pondéré et un
  minerai favori (30 % du minerai remonté).

## Pouvoirs des cartes (`73b-cardpowers.js`)
- Toute carte de légendaire le fait apparaître au **Sanctuaire** de l'Expédition (nœud `legend`, deuxième
  secteur, chance 30 % + 4 % par espèce possédée, max 75 %). Vaincu, il rejoint l'équipe du parcours.
- Chaque légendaire a un pouvoir propre (`CARD_POWERS`) : 5 **decks** de Poké-Poker (Psychique, Arc-en-ciel,
  Équilibre, Céleste, Profondeurs), 6 **programmes** qui rejoignent la boutique, 10 **objets Kecleon** en Expédition.
- Force selon l'**Éclat** : 1, 2, 3 illustrations possédées (`cardTier`). Annonce par un moment à chaque palier.

## Grandeur et envie de revenir (octobre 2026)
Analyse complète dans le projet claude.ai (« Feuille de route — grandeur et envie de revenir »). Ce qui a été construit :
- **Moments en trois tailles** (`37c-stage.js`) : bandeau, bannière (`banner()`), plein écran (`moment()`). Pendant
  une révélation, les annonces attendent (`stageHold`, file `STAGE_Q`). Le niveau d'Archiviste est un grand moment.
- **Musique** (`96b-music.js`) : `MUSIC_TRACKS` (ambiances en boucle + jingles), fichiers `assets/music/<clé>.mp3`,
  liste dressée par `build_web.py` (`MUSIC_AVAILABLE`). Silencieux tant qu'un morceau manque ; liste dans
  `assets/music/LISEZMOI.txt`. Réglage Musique + volume dans Profil › Réglages.
- **Fil conducteur** (`39c-session.js`) : bandeau « Prochaine étape » (priorités + `NEXTSTEP_HOOKS`), coffres de
  session (3 objectifs, 5 coffres par jour, de bronze à onirique), `srcHint()` dit où trouver ce qui manque.
- **Sélecteur de Pokémon** (`40b-picker.js`) : emplacements collés en haut, glisser-déposer (box → emplacement, emplacement ↔ emplacement, emplacement → box), toucher pour ajouter/retirer/viser un emplacement, mises à jour sans redessiner ; appui long en tactile. `sortableList()` pour réordonner une liste à la poignée (ordre en Expédition).
- **Mon équipe** (`42-team.js`) : 6 Pokémon, 60 % de toute l'expérience gagnée, Bonbons d'équipe, étoiles par
  exemplaires (1/4/10/25/60, +6 % par étoile, `makeFighter(..., {owned:true})`), puissance d'équipe. Au dock.
- **Le Monde** (`79b-world.js`) : l'accueil est la carte de l'archive, tuile par tuile : zones réindexées dans le rendu de leur couche (Kanto 4 teintes, Johto couleur, Hoenn étendu), zones désindexées en données corrompues animées, une présence jamais nommée qui rôde ; 10 chantiers par région (Johto ×3,
  Hoenn ×9), dessin qui change, cœur restauré = carte du gardien ; chapitres (`CHAPTERS`).
- **Passages légendaires** (`79c-legend.js`) : toutes les 3 h, 45 min, calculés depuis l'heure (mêmes pour tous).
- **Capture avec enjeu** (`30b-stakes.js`) : cagnotte de chaîne (×1,5/×2/×3, perdue à la fuite), hordes,
  traque hebdomadaire d'un légendaire errant (jamais un gardien). Bonus lisibles (`30c-bonus.js`).
- **Raid et classements** (`95b-social.js`) : raid hebdomadaire (PV partagés, paliers par joueur × nombre de
  joueurs, 3 attaques par jour), classements Poker/Brèche/Tour, défis de Brèche par code (`PCG1-…`).
  SQL : sections 7 et 8 de `sql/schema.sql`. Sans compte, tout se joue seul.

## Porygon-Z et le nom du joueur

- **Le nom** : dans l'ouverture, Porygon-Z demande le nom dans sa bulle (temps `ask` des cinématiques,
  `cineAsk`). Ouverture passée, ou partie plus ancienne : il le demande une fois (`askNameSheet`).
  Les noms secrets (`checkNameSecret`) sont reconnus au passage.
- **`{nom}`** dans n'importe quelle réplique (récit, bandeaux, bulles, tutoriels) devient le nom du joueur
  (`pzFmt`, `pzName` ; « Archiviste » par défaut).
- **Sa voix** (en tête de `02-story.js`) : curieux, précis jusqu'à l'absurde, il se corrige en pleine
  phrase, s'emballe puis se reprend, se cache derrière ses « routines ». Il tient un fichier
  « choses_formidables.txt » qui revient jusqu'à la fin. Pensées occasionnelles après une capture
  (`PZ_MUSES`, une sur seize au plus toutes les deux minutes et demie).
- La Descente abandonnée est sortie du jeu (`attic/`) : elle redéfinissait l'action `dcdone` et bloquait
  le bouton « Archiver ». Un test interdit désormais toute action définie deux fois.

## Retours d'un joueur (24 octobre 2026)

Le jeu envoyé à un ami : ses notes brutes, et ce qu'elles ont changé.
- **« Capture à 98 % + lancer Excellent, et il est ressorti »** : le lancer réussi ajoute désormais sa
  chance à celle de la Ball (`throwChance`), plafonnée à 100 % ; le texte dit « Excellent — capture
  assurée » quand c'est le cas.
- **Trop de fenêtres au retour dans le Forage** : les nouvelles strates et les chantiers ouverts se
  regroupent en **un seul moment**, montré sur l'écran de fouille ; les succès arrivent en un bandeau.
- **Expédition** : la boutique montre l'équipe et l'objet que tient chacun ; le menu du bas demande
  « Quitter l'Expédition ? » au lieu de sortir sans prévenir ; la victoire a son **écran de fin**
  (butin, puis retour au camp) et le camp s'en souvient 24 h ; le **sac d'expédition** (huit places)
  a son bouton « Sac · N » sur la carte, et l'on équipe un objet depuis le sac.
- **MissingNo** a un nouveau sprite de base, **la faille** : une fêlure dans l'image, bords cyan et
  magenta, le nom du joueur à peine visible au fond, qui respire ; au « Regarde mon nom » de la Couche
  Zéro, elle s'ouvre et laisse place au sprite tiré du nom, puis au L.

## Audit de cohérence (octobre 2026)

- **Bonus de première victoire** séparés par mode (`FIRST_WIN` : Expédition, Tour, Brèche, verrous, Poker) ;
  la Tour double PokéCoins et Fragments et ajoute un parchemin. *Aujourd'hui* liste la Tour (et un verrou
  prêt) et la Brèche du jour.
- **Quêtes jamais impossibles** : quotidiennes et hebdomadaires filtrées par salle ouverte (`NEED`,
  `WEEKLY_NEEDS`) ; quêtes de Tour (`dayTower`, `wkTower`). Contrats : jamais un type absent du secteur,
  libellé lisible.
- **Salle suivante** : seules les conditions non remplies s'affichent (`moduleMissing`).
- **Tour** : tutoriels (`tower`, `towerprep`), équipe proposée d'office (`sqDefaultTeam`), succès (4), directive
  « Battre le boss de la Forêt de Jade », scènes et directives vérifiées après chaque combat ; l'équipe de la Tour
  n'écrase plus l'équipe de capture.
- **Verrous** : chaque gardien libéré laisse une dernière phrase (`bye`), gardée sur l'écran des verrous ; une
  défaite déclenche le conseil de Porygon-Z ; le légendaire rejoint l'archive à un niveau utilisable.
- Ancienne ascension de la Tour (`S.towerRun`) purgée au chargement ; textes sans accents corrigés (succès,
  secteurs, titres des gardiens).

## L'Expédition façon Pokélike — secteurs, treillis, progression (`50`, `51`, `51m`)

- **Trois cartes au même dessin** (`MAP_SHAPE` = 2, 3, 4, 3, 4, 3, 2 puis le Champion) : chaque nœud
  mène aux deux nœuds en diagonale sous lui ; les liaisons forment des losanges et ne se croisent
  jamais. Juste avant le Champion, un seul Centre Pokémon (soin complet) : le prendre coûte l'autre case.
- **Champions** (`LEADERS` : Pierre, Ondine, Major Bob, Erika, Koga, Morgane, Auguste, Giovanni, Peter,
  Agatha, Olga, Aldo) : silhouette et « ? » sur la carte, type révélé au combat, trois Pokémon de ce
  type. Le badge donne +3 niveaux, 40 % de soin et une relique à choisir parmi trois ; la carte
  suivante s'ouvre. La troisième carte se termine sur le Noyau.
- **Progression** (`EXP_GAIN`) : départ de la forme de base (`lineRoot`) au niveau 5 (jusqu'à +3
  selon l'archive) ; hautes herbes +1, dresseur et élite +2, champion +3, le reste +0 ; évolution
  au niveau d'évolution ; échange = +4 niveaux sur le Pokémon cédé ; recrue au niveau de l'équipe.
  Les adversaires suivent la progression attendue (`expExpected`), pas l'équipe réelle.
- **Espèces à leur place** (`minLevelOf`, `levelWildId`) : un adversaire de niveau 10 est une forme
  de base ; l'espèce suit le niveau du combat.
- **Équilibrage** (`node expsim.js`) : route offensive bien menée ~40 % de runs au bout, au hasard ~8 %,
  en évitant les combats ~2 % — la route est la décision principale.
- **Carte en pixel art** (`51m`) : terrain peint une fois par secteur (prairie, forêt, grotte, plage,
  glacier, volcan, puis la faille), bâtiment et porte de départ en haut, grille du Champion en bas,
  sentiers en pointillés, sprites de carte des dresseurs (un par type, Rouge Feu) et icônes des
  services (hautes herbes, Poké Ball, sac, Centre, Boutique, « ? »).
- L'archive reçoit les niveaux permanents sur l'espèce choisie au départ (`m.base`), même évoluée.

## L'Expédition vécue — scènes (`51`, `_trainers`)

- **Carte par couloirs** (`genMap`) : quatre couloirs, quatre marcheurs qui restent dans leur
  couloir ou glissent d'un cran ; un pas qui croiserait une liaison est refusé. Les nœuds sont
  placés à leur couloir : une route qui ne bouge pas descend tout droit. Trois départs.
- **Lisibilité** : les routes encore possibles sont éclairées, les autres s'estompent. Toucher un
  nœud lointain l'examine (type de dresseur, ce qu'il promet) et trace le chemin qui y mène.
- **Dresseurs** : chaque nœud Archiviste a son dresseur dès la génération (`n.tr`), et une classe
  par type (`TRAINER_TYPE_CLASS`) : un dresseur Feu a toujours le visage d'un Pyromane. Les Élites
  sont des Topdresseurs ; le Noyau ne dit rien. Portraits extraits par `build_trainers.py`
  depuis la décompilation pret/pokefirered (© Nintendo / Creatures / GAME FREAK).
- **Le voyage** : le meneur de l'équipe (sprite de marche PMD) marche jusqu'au nœud choisi.
- **Les scènes** (`51`) remplacent les feuilles : rencontre (rayures, dresseur, « VS », ou herbes
  qui frémissent et Pokémon qui surgit), noyau (silhouette), victoire (équipe, Bits qui défilent,
  soin visible, relique qui se retourne), trois Poké Balls de recrutement, coffre qui tremble puis
  s'ouvre, feu de camp, boutique de Kecleon, terminal d'échange de Porygon, événement raconté par
  Porygon-Z.
- **Rien ne se perd** : tout ce qu'une scène attend est dans `run.pend` (y compris les adversaires
  d'une rencontre, tirés à l'entrée du nœud). Fermer l'application en plein recrutement, coffre ou
  combat rouvre la même scène.
- **L'ordre de l'équipe** : toucher deux membres les échange (Expédition et Tour).
- **Tour** : le choix d'un objet ou d'un remplaçant reste à l'écran tant qu'il n'est pas fait
  (une feuille fermée bloquait l'ascension) ; le bouton Objets lit l'équipe de la Tour.

## La Descente — retirée du hub (`59d`, `59e`)

> Conservée pour mémoire. Les sections ci-dessous décrivent un mode qui n'est plus accessible.

### Livraison 1

L'Expédition refondue en **donjon mystère au tour par tour**, dans la Brèche (onglet « Descente »).
Manuel par défaut, **automatique** en option. **Sauvegardée à chaque pas** : on quitte, on reprend.

- **Étages générés** (salles, couloirs, escalier), aux couleurs de l'habitat ; brouillard, mini-carte.
- **Chaque pas est un tour** ; le meneur échange sa place avec un coéquipier, les partenaires suivent.
- **Quatre capacités par Pokémon, chacune avec une forme** sur la grille : contact, arc, tir en ligne,
  rebond, cône, autour de soi, explosion ciblée, rayon perçant, toute la salle. Une capacité
  ultime (ou la signature des légendaires) avec recharge. Doigt appuyé : les cases touchées
  s'allument ; on relâche pour lancer.
- **Recrutement** : un Pokémon vaincu peut demander à rejoindre l'équipe (quatre au plus) ;
  recrues et évolutions rejoignent le Pokédex en fin de run.
- **Expérience et évolutions** en pleine Descente ; régénération lente des PV à chaque pas.
- **Gardien au cinquième étage** : il se mesure à la force de l'équipe, reprend son souffle un tour
  sur trois, annonce ses déflagrations un tour à l'avance (cases rouges), appelle des sentinelles
  à 66 %, et à 33 % sa **défragmentation totale** ne laisse que des cases vertes, une à portée de
  chaque Pokémon.

Mesuré en mode automatique (`node dcsim.js 30`) : une équipe forte bat le gardien 14 fois sur 30,
des starters 7 fois sur 30 ; aucune Descente bloquée.

### Livraisons 2 et 3

- **Portes** à chaque escalier (deux ou trois) : riche, élite (objet tenu garanti), source (soigne toute
  l'équipe), échoppe Kecleon, piégée (butin doublé), ordinaire.
- **Sac de huit places** : baies, Potion, Rappel (relève automatiquement un Pokémon K.O.), Orbe
  Cartographe, Orbe Foudre, Capsule d'énergie ; **Pokédollars** à dépenser chez Kecleon (le reste est
  converti en PokéCoins) ; **les quinze objets tenus** de l'Expédition, transposés au tour par tour.
- **Un Pokémon K.O. est perdu pour la Descente**, sauf Rappel ; il rend son objet tenu au sac.
- **Terrains** selon l'habitat : eau (traversée par les seuls types Eau et Vol), hautes herbes, lave.
- **Réactions élémentaires** : la glace gèle l'eau (un passage), le feu embrase les herbes (l'incendie
  se propage), la foudre frappe tout un plan d'eau, l'eau fige la lave.
- **Gardien en actes** : déflagrations annoncées au motif de son type (rangées, croix, poursuite,
  éclats, nova, anneau) ; à 66 %, **trois pylônes** le rendent intouchable et la corruption ronge le
  bord de l'arène ; à 33 %, la corruption avance encore et la défragmentation totale se déclenche.

Mesuré en mode automatique (`node dcsim.js 30`) : des starters battent le gardien 12 fois sur 30, une
équipe forte 10 fois ; aucune Descente bloquée.

### Livraison 4 : la Descente remplace l'Expédition et la Tour

- **Son propre écran**, à la place de l'Expédition dans le hub (mêmes conditions d'ouverture) ;
  les anciens écrans de l'Expédition et de la Tour y mènent.
- **Descente sans fond** (ouverte après un premier gardien, ou si la Tour avait été gravie) : un
  gardien tous les cinq étages, un escalier là où il tombe, et l'on continue. Chaque gardien vaut
  deux **renforts** (+4 % par point, toute la lignée) ; renforts et record de la Tour sont repris, et
  les renforts jouent dans toutes les Descentes. Mesuré en automatique : étage médian 10, au mieux 16.
- **La Descente reprend tout ce que distribuait l'Expédition** : œuf (d'autant plus rare que les
  risques pris — portes d'élite, gardiens), carte, Noyau, +0,5 % d'intégrité, objet tenu une fois sur
  deux, 20 points de faction, quêtes et succès (le compteur `expWins` compte désormais les gardiens
  vaincus : déblocage de la Brèche, guide, jalons inchangés). Les survivants gagnent des **niveaux
  définitifs**. L'objet « Restes » ajoute une Potion au départ.
- **Une Expédition ou une ascension en cours** est close proprement, une seule fois ; ses survivants
  gardent un niveau.
- **Finitions** : conseils de premiers pas (une seule fois), sons et vibrations, textes du jeu
  harmonisés ; une Descente abandonnée sans rien accomplir ne rapporte rien (pas de niveaux gratuits).
  Parcours complet vérifié dans le navigateur : 30 écrans, une Descente, une Brèche, sans erreur.

## La Brèche — le survivors-like

Le module d'action du jeu. Il s'ouvre par la faille que laisse le premier verrou légendaire levé
dans la Tour ; les verrous eux-mêmes se combattent désormais dans la Tour, la Brèche se conclut sur
son Alpha. Trois fichiers :
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
en cas de défaite) ; la Brèche nourrit la recherche et restaure des élites au Pokédex.
Aucune énergie, aucune limite de runs, aucune série qui se brise.

**Calibrage mesuré** (`node brsim.js 10` : runs complètes sans navigateur, deux profils) —
premier habitat de Kanto : gardien atteint et vaincu environ 6 fois sur 10, combat de boss de 25 à
30 s, évolution finale une run sur deux. Johto (×1,45) et Hoenn (×2) sont nettement plus durs.
Rendu vérifié dans Chromium : 60 images par seconde avec la horde.

### Combats de boss scénarisés (`59g-breche-bossfight.js`)

Le combat se joue en actes, chacun obligeant à bouger autrement :
1. **Entrée en scène** : la horde se disperse, bandes noires, la caméra glisse vers le gardien, carte
   de nom (« ARTIKODIN — VERROU DU FROID »), sous-titres de Porygon-Z ; une **arène** de corruption se
   referme (en sortir brûle).
2. **100 → 66 %** : le jeu d'attaques du type du gardien.
3. **66 %** : il se retranche derrière **trois pylônes** (intouchable tant qu'ils tiennent) ; l'arène
   se resserre.
4. **33 %** : **attaque ultime**, tout l'écran rougeoie sauf deux ou trois **abris** à rejoindre en
   2,6 s (30 % des PV sinon, et la horde hors abri est balayée) ; puis il s'emballe.
5. **Finale** : ralenti, défragmentation en pixels, conclusion de Porygon-Z.

**Mises en scène** (refaites) : le jeu se fige sur une alerte rouge, la caméra glisse vers le boss
**et zoome** (×1,42), une faille s'ouvre sous ses pieds, il en sort en silhouette blanche puis prend
ses couleurs, **rugit** (onde de choc, cratère, la horde soufflée), puis sa **carte de nom** traverse
l'écran en biais — son sprite PMD en grand dans sa pose de concentration, nom en glitch, vie qui se
remplit. Les sous-titres descendent dans la bande noire. Les **petits boss** ont leur entrée courte
(ralenti, caméra qui se tourne, bandeau) : l'Alpha, le Chasseur des Profondeurs. Chaque **finale**
fait zoomer la caméra sur le vaincu : rayons de lumière, silhouette blanche qui tremble, puis il
éclate en **blocs de données** qui retombent avec la gravité.
L'entrée du gardien dure 5,6 s (la carte de nom reste lisible 3 s). Aucune récompense ne s'ouvre
pendant une entrée ou une chute de boss ; après le gardien, niveaux et coffres attendent qu'on
choisisse de **descendre dans la faille** (ils n'ont de sens qu'à ce moment-là).

Testé acte par acte dans `test.js`. Mesuré sur 30 runs : le débutant (qui ne cherche pas les abris)
bat le boss 16 fois ; le joueur qui esquive l'atteint 15 fois sur 20 et le bat 14 fois.

### Sensations (`59f-breche-feel.js`)

Repris de l'étude de *Pokémon Arena* (Big Kid Nation) :
- **Poses** : chaque Pokémon de l'équipe prend sa pose d'attaque (corps à corps) ou de tir (distance)
  tournée vers sa cible ; les ennemis touchés prennent leur pose de douleur. Planches PMD « Attack »,
  « Shoot », « Hurt » (1 110 planches, chargées à la demande en ligne).
- **Traces au sol** : brûlures, cratères, fissures, givre, flaques, poison, mousse, selon le type de
  l'attaque ; elles s'estompent en quelques secondes (150 au plus).
- **Réactions élémentaires** : la glace gèle l'eau (un pont praticable), le feu embrase les herbes
  (qui brûlent la horde puis deviennent cendres), la foudre se propage dans l'eau, l'eau fige la lave.
- **Un jeu d'attaques par boss, selon son type** : sol gelé, foudre qui poursuit, mur de flammes,
  vague, enfouissement (le boss suit l'Archiviste sous terre puis jaillit), attraction psychique et
  orbes, piqués successifs, pluie de météores, laser tournant, ronces. Tous annoncés.
- **Dangers annoncés** : ligne de visée rouge des tireurs, onde au sol des élites, charge de l'alpha.
- **Bandeau du système** : un flux de commentaires sous l'ATH (élites, alpha, gardien, évolutions,
  missions, paliers de K.O., réactions du terrain).

### Attaques et sprites de marche (`59a`, `59p`)

- **Trois attaques par type** (`BR_ATK`), choisies selon le profil de l'espèce : spécialiste (à
  distance), physique (ruée, bond, contact), équilibré (zone). **72 attaques distinctes** sur 386 espèces,
  31 formes, dont onze nouvelles : ricochet, nova, pluie, spirale, aura, tornade, balayage, faille, orage, ruée, bond.
- **Signatures des 21 légendaires** (`BR_LEGEND`) : chacun a désormais une attaque qui n'appartient
  qu'à lui — voir *Les légendaires ont chacun leur attaque* plus bas.
- **Équilibrage mesuré** : `node brdps.js` mesure chaque forme à conditions égales (horde et cible
  unique) ; `tools/tune.js` et `tools/legend.js` recalent les dégâts. Formes ordinaires entre 0,94 et
  1,05 fois la médiane ; les signatures se mesurent avec `node legdps.js`.
- **Sprites de marche de Pokémon Donjon Mystère** (sprites « de donjon », 8 directions) pour l'équipe
  et la horde, recolorés en corruption pour les ennemis. `build_pmd.py` optimise les planches de
  `sprites/pmd_raw` (386 espèces, 1,8 Mo) ; la version en ligne les charge à la demande, la version
  autonome les embarque. Source : PMDCollab/SpriteCollab, CC BY-NC 4.0, crédité dans le journal.

### Le corps attaque (`59k-breche-fx.js`)

« Un Ronflex qui tire des boules lumineuses, ça n'a aucun sens. » Désormais :
- **La ruée** (`dash`) : Vive-Attaque, Aqua-Jet, Étincelle, Aéropiqué, Direct Toxik, Câlinerie — le
  Pokémon fonce en ligne droite à travers la horde (images rémanentes, lignes de vitesse, traînée de
  son type) puis revient ; à l'évolution finale, l'aller et le retour frappent.
- **Le bond** (`slam`) : les **poids lourds** (physiques, lents, massifs : Ronflex, Grolem, Rhinoféros,
  Steelix, Ursaring, Donphan, Mackogneur, Galeking… 29 espèces) s'élèvent et **retombent de tout leur
  poids** sur la cible : ombre qui grossit, onde de choc, cratère, éboulis, ennemis étourdis.
  Ronflex fait **Plaquage** (évolué : Giga Impact), Steelix Tacle Lourd, Mackogneur Marto-Poing.
- **Poings et griffes** s'élancent au contact avant de frapper (le coup part à l'arrivée).
- **Un projectile par type** : étoile de Météores, sphère d'aura tourbillonnante, croissant de vent,
  boule de boue toxique, motte de terre, roc anguleux, aiguille, Ball'Ombre au cœur noir, éclat
  d'acier, boule de feu et sa traîne, goutte, feuille qui tournoie, étincelle qui crépite, anneaux
  psy, éclat de glace, flamme draconique, croissant des ténèbres, scintillement féerique. Les
  projectiles lobés ont leur ombre au sol.
- **Un impact par type** : braises qui montent, gouttes qui retombent, feuilles, étincelles, éclats,
  cailloux, bulles, fumée — particules à forme, rotation et gravité (budget de 90 par image).
- Équilibrage mesuré avec `node brdps.js` : ruée et bond à 0,98 de la médiane.

### Les légendaires ont chacun leur attaque (`59l-breche-legends.js`)

Retour de jeu : « Jirachi a les mêmes attaques qu'Électhor, qui a les mêmes que Rayquaza, avec
d'autres couleurs. » C'était vrai — trois pluies de frappes, trois fissures, deux murs, deux
balayages. Chaque légendaire a maintenant **sa** mécanique et **son** dessin :

| Légendaire | Attaque (éveillé) | Ce qu'elle fait |
|---|---|---|
| Artikodin | Blizzard (Ère Glaciaire) | des flocons tombent sur des cibles distinctes et les **gèlent** ; un ennemi déjà gelé **vole en éclats** (dégâts doublés, éclats de glace sur les voisins) |
| Électhor | Cage-Éclair (Ciel Foudroyé) | des plumes plantées autour de la horde ; la **cage de foudre se resserre**, frappe qui la traverse, et les plumes foudroient les prisonniers |
| Sulfura | Sillage Ardent (Phénix) | une **traînée de flammes** suit l'équipe ; tous les neuf tirs, un battement d'ailes embrase tout autour |
| Raikou | Tonnerre (Orage Perpétuel) | un **nuage d'orage** suit l'équipe et foudroie à la verticale, avec éclaboussure |
| Entei | Éruption (Magma Sacré) | des **bombes de lave** en cloche, puis des mares de magma |
| Suicune | Rideau d'Aurore (Aurore Boréale) | des **voiles d'aurore** balaient tout l'écran et ralentissent ; éveillés, ils soignent |
| Lugia | Aéroblast (Aéroblast Divin) | le vent se rassemble, puis un **rayon** fend le couloir le plus peuplé ; la horde s'écarte |
| Ho-Oh | Feu Sacré (Renaissance) | un arc-en-ciel de flammes ; un ennemi qui tombe en brûlant **transmet le feu sacré** et soigne |
| Celebi | Voile Temporel (Retour dans le Temps) | **le temps s'arrête** dans la bulle ; les coups s'accumulent et tombent tous à la fin |
| Regirock | Monolithes (Colosse de Pierre) | des **menhirs** jaillissent sous la horde, lui barrent la route (obstacles), puis éclatent |
| Regice | Prisme Glacé (Cristal Absolu) | un **prisme** aux rayons tournants qui ralentissent |
| Registeel | Verrouillage (Élecanon) | verrouille **l'ennemi le plus solide** (élites, boss), puis l'écrase : quatre fois les dégâts |
| Latias | Ball'Brume (Brume Éon) | des sphères qui éclatent en **brume** : la horde y encaisse plus, l'équipe y guérit |
| Latios | Lumi-Éclat (Rayon Éon) | un **piqué** d'un bord à l'autre de l'écran ; la trace explose derrière lui |
| Kyogre | Onde Originelle (Océan Primordial) | deux **vagues** (quatre éveillé) partent vers les bords et emportent la horde |
| Groudon | Lame Pangéenne (Continent Primordial) | des **anneaux de lames de roche** jaillissent en vagues autour de l'équipe |
| Rayquaza | Draco-Ascension (Colère du Ciel) | un **serpent céleste** ondule autour de l'équipe, plonge jusqu'à elle et ressort |
| Jirachi | Vœu Destructeur (Vœu Millénaire) | des **étoiles filantes** traversent l'écran ; tous les quatre tirs, un **vœu** soigne |
| Deoxys | Psycho Boost (Ω) | **trois formes** se relaient toutes les sept secondes : Attaque, Défense (barrière), Vitesse |
| Mewtwo, Mew | Singularité, Métronome | inchangés ; le Métronome peut désormais tirer l'attaque d'un autre légendaire |

- **Trois couches de dessin** : au sol (sous la horde), au-dessus de la horde, et dans le ciel
  (au-dessus de tout, arbres compris) ; un ennemi gelé porte son cristal, un ennemi figé par Celebi sa teinte.
- **La carte de choix**, le Pokémon de départ et l'écran de pause affichent ce que fait la signature.
- **Équilibrage** : `node legdps.js` mesure les 21 signatures contre la médiane des formes ordinaires,
  en quatre conditions (niveau 1, niveau 8, éveillé niveau 1, éveillé niveau 8). Cible : environ
  deux attaques ordinaires. Moyennes entre **1,76 et 2,05** ; aucune condition sous 1,4 ni au-dessus
  de 2,45. Chaque signature grandit avec le niveau (cibles, rayons, puissance), comme les autres.
- **Tests** : chaque signature s'exécute, frappe, se dessine sans erreur (contexte factice) et ne
  laisse aucune zone derrière elle, à l'état de base et éveillé ; gel puis éclats, feu sacré qui se
  transmet, temps arrêté puis relâché, menhir infranchissable, Métronome légendaire, serpent qui plonge.

### Des coffres de données qui valent la peine (`58-breche-ui.js`)

Retour de jeu : « +25 PV à chaque fois, inintéressant ». Une fois l'équipe au maximum, c'était le
seul lot. Le coffre lit désormais la partie et donne ce qui sert :
- **le catalyseur** d'un Pokémon au maximum qui l'attend (il évolue au coffre suivant), un niveau,
  un objet (jamais deux fois le même dans un coffre) ;
- quand tout est au maximum : des **fragments de code** qui renforcent l'équipe pour toute la run
  (+6 % de dégâts, attaques 5 % plus rapides, +8 % de zone, +15 PV max ; affichés « ◆ Code ×N »),
  une **surtension** de vingt secondes (Force, Hâte, Attraction), des Données pour l'Archive ;
- **une réparation seulement si la vie est sous la moitié**.
- **Trois tailles** : coffre (un trésor), **coffre rare** (trois, 22 %), **coffre légendaire**
  (cinq, 5 %, cadre arc-en-ciel) ; le Flair de l'Archive les rend plus fréquents. Une roulette
  fait défiler les trésors avant de s'arrêter.

### Des univers qui existent (`59w-breche-world.js`)

- **Le sol est peint morceau par morceau** (480 px, un texel = deux pixels, à l'échelle des sprites)
  à partir de bruits calculés **en coordonnées du monde** : aucune couture, aucun motif répété.
  Routes : herbe nuancée, sentiers de terre, massifs de fleurs. Sylve : mousse, feuilles mortes,
  taches de lumière. Nappes : lagune, bancs de sable, rive mouillée, caustiques. Cavités : roche
  fissurée en dalles naturelles, minéraux qui luisent. Ruines : dallage décalé, joints envahis de
  mousse, dalles gravées. Foyer : orgues de basalte et **fentes de lave incandescentes**.
  La peinture se fait par tranches de 3,5 ms par image (mesuré : aucune image au-delà de 26 ms en
  traversant la carte), le morceau suivant est préparé dans le sens de la marche.
- **Le relief** : feuillus à grappes de feuillage ombrées, conifères à étages (Sylve), rochers ombrés et
  moussus (algues dans les Nappes, écume au pied), stalagmites annelées, colonnes cannelées brisées
  au glyphe qui luit, orgues de basalte aux veines qui pulsent.
- **Les terrains** : l'eau a une rive irrégulière, de l'écume qui court, des reflets mouvants et des
  éclats de soleil ; la lave une croûte en plaques et des bulles qui crèvent ; les hautes herbes sont
  de vraies touffes qui ondulent.
- **Les lieux sont des objets**, plus des ronds : la **cache** est une caisse de données (écran qui
  défile, voyants, hologramme, couvercle qui se soulève pendant l'ouverture) ; l'**autel** un dais de
  pierre, trois obélisques et un cristal d'or sous une colonne de lumière, dont le cercle de runes se
  remplit ; le **captif** est enfermé dans une cage de glitch, il s'agite et appelle à l'aide ; la
  **souche** a ses cernes, ses racines et des pousses qui luisent (elle fleurit une fois éveillée) ;
  le **cristal** est un massif de prismes ; la **dalle-glyphe** une pierre gravée qui se recharge ;
  le **geyser** un évent qui fume, se fissure en rougeoyant puis crache une colonne de feu ; le
  **remous** un tourbillon à bras d'écume ; l'**arbre à baies** porte des baies qui luisent avant de
  tomber ; le **nid** est un monticule vivant, avec son œil, ses vrilles et ses éclats en orbite.
- **L'ambiance** : pollen et pétales, lucioles et feuilles qui tombent sous des rais de lumière,
  reflets et écume, poussière et gouttes, motes de glyphes, braises et cendres — et un étalonnage de
  lumière propre à chaque habitat.

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
- **Faille profonde** (`59d-breche-depth.js`, refaite) : **neuf paliers** de 55 s, et quelqu'un au fond.
  - **Plus de PV infinis** : tous les soins passent par `brHeal`. Le vol de vie (Grelot, synergie
    Plante, attaques qui soignent) remplit un réservoir plafonné à 5 % des PV, qui se recharge à
    2,5 % par seconde ; en profondeur, chaque palier réduit les soins de 7 % (30 % au minimum) ;
    l'Octet Turbo est plafonné et a un temps de recharge. Avant, une horde de 50 K.O. par seconde
    rendait des centaines de PV par seconde.
  - **Une anomalie par palier**, tirée sans remise parmi dix : Nuit noire, Pluie de blocs, Miroir
    (la horde prend les traits de votre équipe), Ruée dorée (des ennemis dorés qui fuient et paient),
    Champ de mines, Géants, **le Chasseur** (un ennemi vous marque : l'abattre paie deux coffres),
    Silence (plus aucun soin, octets doublés), l'arène qui rétrécit, Frénésie.
  - Un écho de légendaire aux paliers 3 et 6, un coffre à chaque palier franchi.
  - **La horde est plafonnée** (150 ennemis) et se **densifie** au-delà de 15 apparitions par seconde :
    moins d'ennemis, chacun plus solide (même total de PV, octets à proportion), jusqu'à ×4. Moins de
    chiffres de dégâts à l'écran, particules plafonnées (650), réserve d'objets à curseur tournant.
  - **Corrigé : une seconde de jeu en durait trois.** Chaque coup critique figeait l'image 25 ms ;
    en profondeur, les critiques s'enchaînaient et la partie restait presque toujours figée. Les petits
    arrêts sur image ont désormais un délai (mesuré : la partie tourne à 93 % du temps réel, contre 50 %).
  - **Corrigé : descendre dans la faille figeait le jeu** quand la fenêtre de victoire avait recouvert
    une récompense ; la descente repart d'un état propre.
  - **Palier 9 : Porygon-Z vient vous chercher.** « Ça fait trop longtemps que t'es là-dedans. On a
    encore du boulot dehors. Je te ramène — de force, s'il le faut. » Un vrai boss (sprites PMD de
    Porygon-Z) : Triplattaque (trois rayons feu/glace/foudre), Ultralaser, Conversion (il résiste au
    type qui le frappe le plus), pluie de blocs, téléportation et salves ; à 55 % il **recycle votre
    équipe** en copies corrompues, à 25 % il entre en surchauffe. Le battre : **SORTIE FORCÉE**
    (+400 Données, +6 000 PokéCoins, succès caché « Sortie forcée ») ; tomber devant lui n'est pas une
    défaite, il vous **rapatrie**. Et il laisse entendre qu'il y a quelque chose, plus bas…

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

## Poké-Poker — la salle de jeux (`60-poker.js`, `61-poker-content.js`, `62-poker-table.js`)

Refondu au retour « pas assez attrayant, même constat qu'avant la refonte de la Brèche ».

**La table** (`62`). En haut, l'**adversaire** : son portrait de dresseur, son nom, et une **jauge de PV**
qui est l'objectif de la manche — chaque main la fait fondre comme une attaque, le portrait sursaute,
le dresseur tombe K.O. Sous lui, la **règle** du Champion quand il y en a une. Les **programmes** sont des
cartes sur une étagère (bordure de rareté, sprite, barre d'évolution, « Zzz » sous Poudre Dodo). Le
**tapis** : un feutre vert, Jetons (bleu) × Mult (rouge) en grandes plaques qui s'embrasent quand la main
suffit à gagner. Les **cartes** sont de vraies cartes Pokémon : cadre aux couleurs du type, numéro du
Pokédex, Jetons en médaillon, feuille holographique pour les chromatiques, dorure, verre, corruption ; la
main s'ouvre **en éventail** et se **distribue** depuis le deck ; on la trie par famille, type, valeur ou
numéro. À la **résolution**, les cartes jouées montent sur le tapis, chacune sursaute et lâche ses Jetons,
les programmes s'allument un à un, puis le total **frappe l'adversaire**. **Victoire** : sa réplique de
défaite, et les Octets qui tombent ligne par ligne (verrou, mains restantes, programmes, intérêts).
**Défaite** : sa scène aussi. La **cache** : programmes en vitrine, **boosters qu'on ouvre** (le paquet
tremble, se déchire, les cartes se retournent), orbes, spectres, licences en tickets. La **salle** : enseigne
au néon, cartes en éventail, vitrine des Champions battus.

**Le contenu** (`61`).
- **Des adversaires** : 22 classes de dresseurs (Gamin, Jongleur, Cambrioleur, Médium, Topdresseuse…) avec
  leurs répliques, de plus en plus aguerris au fil des antes, tirés de façon stable dans une partie.
- **Un Champion d'arène de Kanto au bout de chaque ante**, avec une règle à son image : Pierre (*Défense
  Roc* : hors Roche et Sol, moitié des Jetons), Ondine (*Torrent* : deux cartes emportées après chaque main),
  Major Bob (*Paralysie* : une carte sur quatre injouable), Érika (*Poudre Dodo* : le premier programme dort),
  Koga (*Toxik* : −1 Mult de base à chaque main), Morgane (*Prémonition* : cartes face cachée), Auguste
  (*Fournaise* : pas de défausse, une main de plus), Giovanni (*La Maison gagne toujours* : +60 % à atteindre,
  un Octet par main). Puis le **Conseil des Quatre** — Olga (*Gel*), Aldo (*Force brute*), Agatha
  (*Malédiction*), Peter (*Colère* : chaque main doit battre la précédente) — et **Régis, Champion de la
  Couche**, qui cumule deux de leurs règles. Les règles se lisent avant d'entrer.
- **La Suite Pokédex** : cinq numéros consécutifs (les lignées se suivent dans le Pokédex), et son orbe.
- **34 programmes de plus** : treize aux couleurs de leur Pokémon (Ronflex · Repos, Métamorph · Morphing,
  Porygon · Raccourci qui forme Mono-Type et Suite à quatre cartes, Pikachu · Statik…) et **sept lignées
  qui évoluent** à force de servir : Salamèche.exe → Reptincel.exe → Dracaufeu.exe (cartes Feu marquées),
  Bulbizarre, Carapuce, Abra, Fantominus, **Magicarpe.exe** (inutile… jusqu'à Léviator.exe, ×3 Mult) et
  **Évoli.exe**, qui devient Pyroli, Aquali ou Voltali selon le type que vous jouez le plus. Les formes
  évoluées ne sont jamais en vente ; l'évolution a sa scène.
- **D'une partie à l'autre** : la **vitrine des Champions** (première victoire contre chacun : un bonus de
  PokéCoins) et la **Programmathèque** des programmes déjà croisés.

Testé : chaque ante tombe sur son Champion, la Suite se forme, un programme évolue (et n'est jamais en
vente sous sa forme évoluée), Paralysie, Torrent et Fournaise font ce qu'elles disent ; la partie simulée
de 40 manches et toutes les règles s'évaluent sans valeur invalide.

## Dresseurs rémanents (`39r-rival.js`)

Un dresseur rémanent — un dresseur du jeu d'origine resté coincé dans son secteur — surgit, rarement, après une
capture (ce ne sont plus des « archivistes » : dans le récit, tous les archivistes étaient le joueur). La rencontre se joue désormais comme dans les jeux
d'origine : un « ! », la **transition en bandes noires**, puis l'**écran VS** — le rival entre par la droite
en silhouette puis en couleurs, votre Pokémon de tête par la gauche, lignes de vitesse aux couleurs de ses
types, VS qui frappe, ses trois Poké Balls (l'as en Hyper Ball) — sa réplique lettre par lettre, puis le
choix, avec les gains annoncés. Relever le défi ferme l'écran en **iris de Poké Ball**. Au retour, le
**verdict** : le rival vaincu chancelle, les gains apparaissent, le titre se dévoile. Chaque rival a son
portrait, son **as** (Lokhlass, Florizarre, Magnéton, Arcanin, Ectoplasma, Dracolosse), trois répliques
d'entrée selon le nombre de rencontres, et **se souvient de vous** : chaque victoire le rend plus fort de
deux niveaux et paie davantage (un Noyau à la troisième). Une ambiance musicale dédiée, `rival`, est prévue.

## Icônes d'objets

`build_items.py` assemble `assets/items.png` (97 icônes, 32 Ko) : **88 sprites officiels** du dépôt
PokeAPI/sprites (Balls, baies, pierres, objets tenus, trésors, cannes, répulsifs, objets
d'Expédition et de la Brèche) et **9 icônes originales** en pixel art pour les objets propres au jeu
(Data Ball, quatre Archives, Câble Link, Boussole fêlée, Module d'attraction, Bouclier Data).
`itemIcon(clé)` les affiche partout ; un test vérifie qu'aucun objet d'aucun catalogue n'en est
privé. Les cosmétiques s'affichent par un aperçu d'eux-mêmes (`cosIcon`). Les boosts gardent leurs
sprites de Pokémon.

**Publication** : les règles de `.gitignore` sont ancrées à la racine. Une règle `pmd/` sans barre
initiale écartait `assets/pmd` et `web/assets/pmd` : les sprites de marche ne partaient jamais en
ligne. Un test l'interdit désormais. Le service worker ne met plus en cache que les réponses valides.

## Revenir, et partager

- **Capture façon Pokémon GO** : un cercle coloré rétrécit autour du Pokémon (vert → rouge selon la
  difficulté) ; un seul toucher lance la Ball. Bien ×1,08, Super ×1,2, **Excellent ×1,35** ; jamais
  de malus. Quêtes « lancers Excellent » ; les anciens succès de visée comptent les Excellent.
- **Saisons de la Brèche** (`39b-events.js`) : tous les quinze jours, six thèmes qui tournent (le
  type du thème frappe 25 % plus fort, son habitat rapporte des points doublés). **Parcours gratuit**
  de dix paliers ; le titre final se regagne à chaque retour du thème : rien n'est perdu pour de bon.
- **Légendaire de la semaine** : il surgit en écho vers la sixième minute de chaque Brèche.
- **Objectif collectif hebdomadaire** : les K.O. de tous les joueurs s'additionnent (Supabase, table
  `community`, ajouts plafonnés par la fonction `add_community`) ; trois paliers récompensés.
- **Partager sa run** : carte-image 1080 × 1350 (équipe en sprites de marche) et texte à la Wordle,
  via le partage natif du téléphone.

Tout est calculé à partir de la date : identique pour tous, sans serveur de jeu.

## Installer l'application (PWA)

Le parcours tient compte d'une différence décisive : **sur iPhone, l'app installée a son propre
stockage** (elle démarre une partie neuve), **sur Android elle partage celui de Chrome** (la
progression suit).

1. **Premier écran** : un lien discret « Installer sur l'écran d'accueil » sous le bouton principal.
2. **Juste après la cinématique d'ouverture**, une seule fois, un « conseil de maintenance » de
   Porygon-Z : bouton **Installer** natif sur Android ; trois étapes illustrées sur iPhone (« c'est
   le bon moment, vous n'avez encore rien à perdre ») ; invitation à ouvrir Safari ou Chrome depuis
   un navigateur intégré (Instagram, TikTok…). Le tutoriel attend que la carte soit fermée.
3. **Une seconde et dernière proposition**, au début d'une session suivante, au plus tôt le
   lendemain. Sur iPhone avec une partie avancée : créer d'abord un compte (la connexion dans l'app
   récupère tout), ou exporter la partie si le service en ligne n'est pas configuré.
4. **Premier lancement de l'app installée** : « J'ai déjà une partie » mène à la connexion, ou à
   l'import, sans rejouer l'introduction.
5. Ensuite, seulement depuis le profil (« Installer l'application »).

Icônes réelles (192, 512, maskable, apple-touch-icon) générées par `build_icons.py` et
versionnées dans `assets/icons` : Chrome n'offrait pas l'installation avec l'ancienne icône
(une bande de 400 × 40 px), et l'iPhone n'avait pas d'icône d'écran d'accueil.

## Comptes et sauvegarde cloud

Comptes Supabase par **pseudo, e-mail et mot de passe** (le code par e-mail reste en secours). Les
liens reçus par e-mail (confirmation, nouveau mot de passe) reviennent dans le jeu. Synchronisation
**intelligente**, au démarrage, toutes les 2 minutes si la partie a changé, en quittant l'application
et après chaque Brèche : un appareil neuf récupère le cloud sans question ; si deux appareils ont
progressé chacun de leur côté, le jeu demande lequel garder. L'état de synchronisation est rattaché
au compte : changer de compte sur un même appareil n'écrase jamais le cloud de l'autre. Clés
**publishable** (`sb_publishable_…`) et anciennes clés anon acceptées. Classement de la **Brèche du
jour** : seul le meilleur score de chacun est conservé, par une fonction serveur. Installation pas à
pas : `DEPLOIEMENT.md`. Treize scénarios de bout en bout dans `nettest.js`.

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

<<<<<<< HEAD
Les 38 scènes du récit et les 6 étapes de la faille passent **toutes** par le moteur de cinématiques
et se jouent **sur le plateau**. Celles qui n'ont pas de cinématique écrite à la main, `directStory()`
(`src/37f-mise-en-scene.js`) les met en scène :
=======
Les 38 scènes du récit et les 6 étapes de la faille passent **toutes** par le moteur de cinématiques.
Celles qui n'ont pas de cinématique écrite à la main, `directStory()` les met en scène selon des règles fixes :
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4

- **le lieu** vient de la table `STAGE` (une entrée par scène, vérifiée par `test.js`) ; à défaut, il
  découle des voix : la faille si elle parle, le laboratoire si le professeur parle, la console sinon ;
- **Porygon-Z** entre à sa première réplique, projeté dans le présent ; ses humeurs se jouent ;
- **la faille prend corps** — MissingNo, la fêlure, apparaît — à sa première réplique ;
- **le système** parle en console neutre, et en rouge **seulement** pour une erreur ;
- **les scènes majeures** ont bandes et carton-titre, les mineures restent sobres ;
<<<<<<< HEAD
- **les souvenirs** (répliques `mem`) : la mémoire se **défragmente** (l'écran se couvre de blocs qui
  se rangent, le nombre de blocs récupérés vient de la réplique du système), le lieu d'alors apparaît
  au sépia, avec du grain, une bande qui saute, des blocs qui ne se chargent pas — d'autant plus que
  le souvenir est lointain ; l'**archiviste d'alors** s'y tient. Au retour, le souvenir se déchire.

`STAGE[id]` ajoute ce que le metteur en scène ne devine pas : `set` (le lieu), `cast` (qui est là),
`pre` / `with` / `sync` (avant une réplique, juste avant qu'elle s'affiche, pendant qu'elle s'affiche),
`voice` (répliques dites hors champ, sur une illustration), `mem` (le souvenir : lieu, trous, acteurs),
`end`. Le texte ne change jamais : `test.js` vérifie que chaque scène garde toutes ses répliques, dans
l'ordre, et qu'aucun acteur ne reste en scène.
=======
- **les souvenirs** (répliques marquées `mem`) passent au sépia, avec la silhouette de l'archiviste d'avant
  et son nom masqué ; au retour, le présent reprend sa couleur.

Temps propres à la fin : `choice` (une ligne à maintenir, avec ses branches), `montage` (cartons de plus en
plus rapides), `name` (le nom du joueur en octets, relu comme l'espèce n° 000), `dex` (une entrée du Pokédex
qui s'écrit), `credits` (le générique), `music` (une ambiance imposée le temps d'une scène), `call`.

Les scènes clés reçoivent une **piste de direction** (`DIRECTION`) : des temps insérés avant une
réplique donnée, ou en fin de scène. Après avoir écrit, l'épilogue se joue dans le décor chaud du
monde d'avant : le monde réparé ressemble à l'ouverture, avant la panne.
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4

**L'archiviste d'avant** n'a plus de silhouette dessinée : c'est une **forme de pixels** debout,
sans visage, faite des octets du nom du joueur (la même texture que le L de MissingNo), bordée de
cyan à gauche et de magenta à droite, comme la fêlure. Elle perd des pixels qui s'envolent et
s'éteignent, puis reviennent ; quand elle parle, elle se défait davantage. Elle est dessinée sur la
toile qui n'appartient pas au souvenir : le sépia ne la touche pas. À la révélation, quand elle tape
« Effacer », **elle se tasse en L** : MissingNo, c'était elle.

Temps propres à la fin : `choice` (une ligne à maintenir, avec ses branches), `montage` (cartons de plus en
plus rapides), `name` (le nom du joueur en octets, relu comme l'espèce n° 000), `dex` (une entrée du Pokédex
qui s'écrit), `credits` (le générique), `music` (une ambiance imposée le temps d'une scène), `call`.

Une scène écrite à la main (`CINEMAS`) prime toujours sur la mise en scène automatique. Le
professeur est un personnage original en pixel art (`PL_PROPS.prof`), debout dans son laboratoire ;
c'est lui qui se corrompt quand le fichier cède.

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

### La version du jeu (`buildver.py`)

`build.py` date chaque build à l'heure de Paris dans `VERSION.txt` (versionné) ; les deux builds
calculent la même empreinte sur les sources et la date (`BUILD_V`, `BUILD_LABEL`). Quand Vercel
reconstruit `web/`, il relit `VERSION.txt` : la version en ligne porte la date de la livraison.

- **Réglages**, tout en bas : « Version du 23 octobre 2026, 19 h 05 · 1a2b3c4d », et un bouton
  **Vérifier** (version hébergée).
- `web/version.json` publie la même chose, sans cache (en-tête `no-store`, ignoré par le service
  worker). Le jeu le relit au lancement, au retour sur l'application et toutes les quinze minutes :
  si l'empreinte diffère, un bandeau sous la barre du haut propose **Mettre à jour** (la partie est
  enregistrée, puis la page rechargée). Jamais de rechargement forcé. À la première ouverture d'une
  nouvelle version, un message le confirme une fois.
- Après une mise en ligne, `https://<site>/version.json` dit en un coup d'œil ce qui est publié.

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
