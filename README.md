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

## Équilibrage — ce qu'il ne faut pas casser

Trois réglages se tiennent et ont été mesurés ensemble avec `node econ.js` :

1. **Le taux de capture des communs doit rester au-dessus de 90%.** En dessous, la chaîne se brise
   trop souvent, les paliers de série deviennent inatteignables et la chasse au chromatique s'éteint.
2. **La chaîne ne se brise que sur une fuite**, jamais sur un lancer raté. C'est ce qui rend les
   paliers 25/50/100 accessibles. Le modificateur de cycle « Chaîne fragile » rétablit volontairement
   l'ancienne règle, en échange de Noyaux Zéro supplémentaires.
3. **La vedette du jour est pondérée par rareté.** Une vedette très rare apparaissant 8% du temps
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
