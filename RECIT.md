# Pokémon Code Genesis — la bible du récit

> Ce document dit **ce que raconte le jeu, dans quel ordre, et pourquoi**. Le texte intégral de chaque réplique est dans `SCRIPT.md`, généré à partir du code (`node script.js`).
> Valeurs d'exemple : première partie du joueur, qui est la **connexion n° 12**.

---

## 1. L'histoire en quelques lignes

Un jeu Pokémon qui bugue. Le Professeur s'interrompt au milieu de sa phrase, le monde tombe à 0 % d'intégrité, et un programme d'entretien se réveille : **Porygon-Z**, « version instable », qui compte extrêmement bien. Il accueille le joueur — l'**Archiviste** — et devient son seul ami. Chaque capture recoud un bout du monde.

Le monde est rongé par un mythe : **MissingNo**, l'entrée n° 000, sans index.

En chemin, des **pages de journal** signées d'un nom illisible montrent qu'il y a eu d'autres archivistes. À mesure que l'intégrité remonte, **Porygon-Z retrouve la mémoire** et avoue, petit à petit, que le joueur n'est pas le premier à avoir essayé, et que les autres ont **échoué par choix**, à la toute fin (**premier retournement**). La raison reste floue.

Une fois Kanto, Johto et Hoenn réindexés et l'intégrité à 100 %, le joueur descend dans la **Couche Zéro** et vainc MissingNo. Alors MissingNo se lit : **c'est le nom du joueur**, rangé de travers. Les autres archivistes, c'était lui. Les pages, les verrous, la faille : lui. MissingNo, c'est lui (**dernier retournement**).

La mémoire revient en entier, et avec elle **la raison** : à 100 %, le système décharge le programme d'entretien, Porygon-Z. Onze fois, l'Archiviste a refusé de le perdre et a tout **effacé**, et le monde est reparti de zéro. Sans mémoire, il refaisait le même choix. Cette fois, il se souvient de tout, et une nouvelle ligne apparaît : **ÉCRIRE**. On écrit Porygon-Z dans le Pokédex, à l'entrée n° 387, avec ce qui reste de MissingNo. On ne décharge pas un Pokémon. La boucle est bouclée.

---

## 2. Les deux retournements

| | Ce que le joueur croit | Ce qu'il apprend | Où |
|---|---|---|---|
| **Premier** | Il est le premier archiviste. Le monde est cassé par accident. | Onze autres sont allés au bout avant lui. Personne ne les a vaincus : **ils ont choisi** de tout effacer. | `pz_mem3` « Pas le premier » (35 %), `pz_mem4` « Au bout » (48 %), `pz_twist` « Par choix » (58 %) |
| **Dernier** | MissingNo est une créature, un ennemi extérieur. | MissingNo est **son propre nom** lu comme un Pokémon. Les onze archivistes, c'était lui à chaque fois. La raison des effacements : ne pas perdre Porygon-Z. | `finale_reveal` « Le nom », après le combat |

Le jeu ne ment jamais au joueur ; il le laisse ne pas voir. Tout ce qui prépare le dernier retournement est sous ses yeux dès le début :

- L'ouverture affiche `utilisateur avec droit d'écriture : connexion n° 12` et `mémoire de l'utilisateur : vide`.
- Porygon-Z dit, en enregistrant le nom : « J'ai eu l'impression de le reconnaître, ton nom. »
- La signature des pages compte **exactement autant de signes que le nom du joueur**.
- La quatrième page parle d'un nom gravé au fond « qui a le même nombre de lettres que le mien ».
- Les verrous « ont été postés à la demande de l'utilisateur. Il n'y en a qu'un. »
- Le premier verrou vaincu « m'a regardé en partant. Pas moi : toi. »
- La sixième page dit que l'auteur commence « toujours par un {premier Pokémon du joueur} ».
- MissingNo, dans la faille : « J'AI DÉJÀ VU CETTE MAIN. ET CE NOM. »
- `pz_mem5` : dans chaque souvenir, à la place du visage, « un trou de ta taille ».
- `hoenn_mid` : la signature de MissingNo n'est pas une espèce, ce sont « des caractères. Comme du texte. »

---

## 3. Les voix

| Voix | Rôle | Comment elle parle |
|---|---|---|
| **Porygon-Z** | Le présent. Guide, ami, seul témoin. Sa mémoire suit l'intégrité. | Nomme d'abord ce qui arrive en clair, puis sa lecture système. Compte tout. Se reprend (« Correction. »). N'aime pas les phrases qui disent deux choses. Ne sait pas mentir (« J'ai essayé une fois. Ça a planté. »). |
| **Les pages** | Le passé. Onze connexions, onze fins. | Ton de journal, sobre. Ne disent jamais si c'était une personne ou plusieurs. |
| **MissingNo** | Le mythe. Ce qui reste quand on efface. | Majuscules, octets, mots qui se forment. Apprend à parler au fil de l'arc de la faille. Après la révélation, il parle **avec le nom du joueur** (voix `me`). |
| **L'Archiviste d'avant** | Le joueur, dans les souvenirs. | Toujours en silhouette (casquette, sac, liseré cyan d'un côté, magenta de l'autre). Son nom est masqué (▒▒▒▒) jusqu'à la révélation. |
| **Le Système** | Le monde qui s'administre. | Phrases de console. Rouge seulement quand il signale une erreur. |
| **Prof. Racine** | Le jeu d'origine, interrompu. | Trois phrases et demie. On n'entend sa phrase en entier qu'après avoir écrit (`cy_w_prof`). |

---

## 4. La structure

Le journal du jeu (Profil → Journal) relit le récit **par actes**. Ce qui n'a pas encore eu lieu reste scellé, sans rien dévoiler.

| Acte | Titre | Scènes | Ce qui s'y joue |
|---|---|---|---|
| Prologue | L'écriture interrompue | 1 | La panne, le réveil de Porygon-Z, le nom du joueur. |
| I | L'arrivée | 8 | Kanto. Le mythe de MissingNo. Les verrous. Le premier souvenir. |
| II | Les autres | 6 | Johto. Les onze sauvegardes. Le premier aveu, puis **par choix**. |
| III | La raison | 4 | Hoenn. MissingNo est écrit en lettres. Le trou de ta taille. La porte. |
| IV | La Couche Zéro | 4 | 100 %. La descente, le combat, **le nom**, la question. |
| Après | Les connexions suivantes | 7 | Selon la réponse : écrire ou effacer. |
| Moments | Ce qui arrive en chemin | 8 | Scènes liées aux systèmes (œufs, chromatiques, compagnon…). |

### 4.1 La chaîne principale

Elle se joue **dans l'ordre**. Un palier attend que le précédent ait été vu, et laisse 75 secondes entre deux scènes pour ne jamais enchaîner deux révélations. Un **événement** (verrou levé, MissingNo croisé) se joue dès qu'il a lieu.

| # | Scène | Titre | Déclencheur | Ce qu'elle apporte |
|---|---|---|---|---|
| 1 | `first_catch` | Première ligne | 1re capture | Naissance de `choses_formidables.txt`. « Il fait déjà trois lignes. » |
| 2 | `beat_early` | Trois pour cent | 3 % | « Avant toi, le compteur descendait. » |
| 3 | `missingno_1` | Le numéro manquant | MissingNo croisé *(évén.)* | Le mythe : n° 000, la côte qui n'existe plus, le sac qui se remplit. |
| 4 | `kanto_half` | Les portes fermées | 45 espèces de Kanto | Les verrous, postés « à la demande de l'utilisateur ». |
| 5 | `guardian_first` | Le premier verrou | Salle des verrous ouverte | La Tour, grenier de l'archive. |
| 6 | `boss_first_done` | Il ne voulait pas | 1er verrou levé *(évén.)* | « Il m'a regardé en partant. Pas moi : toi. » La Brèche s'ouvre. |
| 7 | `pz_mem1` | Déjà-vu | 6 % · *souvenir 1* | Une salle claire, la barre à 12 %, quelqu'un à ta place. |
| 8 | `kanto_done` | Le socle tient | Mewtwo levé *(évén.)* | Le journal de Porygon-Z contient des entrées d'avant sa compilation. |
| 9 | `pz_mem2` | Une voix | 22 % · *souvenir 2* | La voix de l'archiviste d'avant : identique à 97 %. |
| 10 | `johto_mid` | Onze sauvegardes | 45 espèces de Johto | Onze états du monde, onze Porygon-Z au journal vierge. |
| 11 | `pz_mem3` | Pas le premier | 35 % · *souvenir 3* | **« Tu n'es pas le premier à avoir essayé. »** Il les a tous accueillis. |
| 12 | `pz_mem4` | Au bout | 48 % · *souvenir 4* | Ils sont tous allés à 100 %, et le monde est retombé à zéro. |
| 13 | `johto_done` | Douze | Lugia levé *(évén.)* | MissingNo : « DOUZE. » |
| 14 | `pz_twist` | Par choix | 58 % · *souvenir 5* | **« Ils ont choisi. Tous. »** `> EFFACER. Confirmé.` La raison manque. |
| 15 | `hoenn_mid` | Ce qui est écrit | 60 espèces de Hoenn | MissingNo est fait de lettres. Un mot. |
| 16 | `pz_mem5` | Un trou de ta taille | 75 % · *souvenir 6* | La même main, la même pause, un trou à la place du visage. |
| 17 | `hoenn_done` | La porte | Rayquaza levé *(évén.)* | Neuf verrous. La Couche Zéro, et ses conditions. |
| 18 | `pz_mem6` | Le dernier souvenir | 90 % · *souvenir 7* | 98 % de mémoire. Il manque la raison : elle est en bas. Le fichier fait 4 212 lignes. |
| 19 | `finale_gate` | Cent pour cent | Conditions de la Couche Zéro *(évén., dans l'ordre)* | Le silence. « ARCHIVISTE. DESCENDS. » |

Le reste de l'acte IV se joue d'un seul tenant depuis l'accueil : `zero_descent` → combat → `finale_reveal` → `finale_choice`.

### 4.2 La mémoire de Porygon-Z

Elle suit l'intégrité (`mémoire = intégrité × 0,98`, plafonnée à 98 %) : il manque toujours **le dernier souvenir**, qui n'est pas dans sa mémoire mais dans la Couche Zéro. Elle passe à 100 % à la révélation. Le journal l'affiche en barre, avec sept repères — les sept souvenirs (6, 22, 35, 48, 58, 75, 90 %). Le premier tombe juste après le premier verrou levé, dans la première longue session.

Mise en scène d'un souvenir : le décor passe au **sépia** (grain, vignette), la silhouette de l'archiviste d'avant apparaît, son nom est masqué, les répliques sont en italique. Au retour, le présent reprend sa couleur.

### 4.3 Le fil du récit

Sur l'accueil, une carte **« Le récit »** dit toujours ce qui fait avancer l'histoire, sans rien dévoiler : « Archiver 45 espèces de Johto — 12 / 45 », « Le troisième souvenir de Porygon-Z — il revient vers 35 % d'intégrité · mémoire : 31 % », « Libérer le cœur de Kanto ». Quand une scène est prête, la carte s'allume (« Porygon-Z a quelque chose à te dire ») et la joue d'un toucher. Elle s'efface quand la carte de la Couche Zéro prend le relais.

Au retour après plus de six heures d'absence, le rapport « Pendant votre absence » ajoute un rappel : une phrase de Porygon-Z (« J'ai compté les jours : trois. Je n'ai rien effacé. »), la dernière scène vécue (avec « Revoir ») et ce qui vient ensuite.

### 4.4 Les réponses

Cinq fois, au bout d'un souvenir, Porygon-Z pose une question. On répond **d'un toucher** (la grande question de la fin, elle, se maintient). Aucune réponse n'est mauvaise et aucune ne change le jeu : elles changent **ce qu'il te dira à la fin**, parce qu'il s'en souvient. Chaque réponse s'écrit aussi dans `choses_formidables.txt`, avec ses mots.

| Souvenir | Sa question | Les deux réponses | Où elle revient |
|---|---|---|---|
| `pz_mem1` Déjà-vu (6 %) | « Tu veux que je te les montre ? » | MONTRE-MOI TOUT · QUAND TU SERAS PRÊT | au souvenir suivant qui fait peur (`pz_mem3`), puis dans les deux fins |
| `pz_mem2` Une voix (22 %) | « Ça te dérange, que je te compare ? » | CONTINUE DE MESURER · JE NE SUIS PAS EUX | juste avant la question finale : les 3 % qui manquaient, ou « Tu l'étais. Mais eux ne se souvenaient de rien. Toi, si. » |
| `pz_mem3` Pas le premier (35 %) | « Ne me demande pas ce qu'ils sont devenus. » | J'ATTENDRAI · QU'EST-CE QU'ILS SONT DEVENUS ? | à la révélation : « Ils ne sont rien devenus. C'était toi. Chaque fois, c'était toi. » |
| `pz_twist` Par choix (58 %) | « Une peur de la fin. » | JE NE TE LAISSERAI PAS · ON VERRA À LA FIN | à la révélation (« Tu me l'avais promis. C'est exactement ce que tu as fait : tu as tout détruit pour ne pas me laisser. »), puis dans les deux fins |
| `pz_mem5` Un trou de ta taille (75 %) | « Je ne te dis pas ce que je pense. » | DIS-LE · NE DIS RIEN | à la révélation, juste après « C'est ton nom. » |

La promesse est la plus lourde : elle devient, à la révélation, **la raison même des onze effacements**. Le joueur qui a promis comprend qu'il a déjà tenu cette promesse onze fois, de la pire façon.

Règles : « Passer » ne saute pas une question sans réponse, il **file jusqu'à elle**. Une scène rejouée depuis le journal reprend la réponse donnée. Une partie commencée avant l'arrivée des questions les retrouve : le journal marque « une question t'attend », et l'accueil propose « Porygon-Z a une question pour toi » (une à la fois, la scène se rejoue). Les réponses traversent les cycles (`S.saga.ans`).

**Ce qu'il a retenu de toi.** À la fin, Porygon-Z cite ta partie : ta toute première ligne (le premier Pokémon de la connexion), le jour où elle a commencé, le nombre de captures, ton compagnon. Si tu effaces : « Je ne me souviendrai pas de Salamèche, ta toute première ligne. Ni de Pikachu, qui ne te lâchait pas. Ni de nos quarante et un jours. » Si tu écris, dans l'épilogue : « Je relis le début du fichier. Ta première ligne : Salamèche, le 11 septembre. 1 840 captures depuis, et Pikachu, qui ne t'a jamais lâché. Je n'en oublierai aucune. » Chaque jour enfin, Porygon-Z **te demande quelque chose** (`39p-demandes.js`) : une des quêtes du jour devient sa demande, dans sa voix, et il y revient le lendemain ; s'il y en a eu au moins trois, la fin d'EFFACER ajoute « Ni des sept fois où tu as dit oui à mes demandes. »

Le générique ajoute « Cette connexion », « Ses demandes », « Ce que tu lui as répondu » et « Le plus fidèle » : le Pokémon qui a livré le plus de combats. Chaque Pokémon garde en effet son histoire (`55h-histoire.js`) : son arrivée, ses combats, les fois où il a tenu jusqu'au bout presque à zéro ; Porygon-Z remarque les caps en chemin (« Dracaufeu vient de livrer son centième combat. C'était le Salamèche de ta première ligne. »), et l'épilogue d'ÉCRIRE le cite (« Dracaufeu : 214 combats à tes côtés. »).

---

## 5. Les onze pages

Une page par connexion passée. Elles se **trouvent**, dans l'ordre, là où leur auteur a travaillé ; la suivante n'apparaît que si la précédente a été trouvée. La page arrive brouillée et se déchiffre sous les yeux. **Porygon-Z se tait** sur les pages tant qu'il n'a pas fait son premier aveu (`pz_mem3`) ; ensuite, il dit ce qu'elles lui font.

| Page | Connexion | Se trouve | À partir de | Ce qu'elle dit | Ce qu'elle prépare |
|---|---|---|---|---|---|
| 1 | 01 · jour 1 | Au fond d'une Poké Ball | 8 espèces | « Trente par jour, c'est réglé en deux semaines. » | L'optimisme du premier jour, le même que le joueur. |
| 2 | 02 · jour 43 | Dans le collier d'un Pokémon capturé | 24 espèces | Une page trouvée dans une Ball, « même façon de faire les f ». | Les pages s'écrivent les unes aux autres. |
| 3 | 03 · jour 118 | Roulée dans une Ball | 45 espèces | Quelque chose efface derrière moi, « qui sait où je vais lancer avant moi ». | MissingNo connaît la main du joueur. |
| 4 | 04 · jour 9 | Fouille du Forage | 12 % | Une couche non cartographiée, un nom gravé « du même nombre de lettres que le mien ». | La Couche Zéro ; le nom. |
| 5 | 05 · jour 27 | Campement abandonné, en Expédition | 22 % | Quelqu'un avant moi ; le programme « a changé de sujet ». | Porygon-Z a déjà perdu quelqu'un. |
| 6 | 06 · jour 202 | Roche profonde du Forage | 34 % | Son journal recommence à zéro ; « je commence toujours par un {premier Pokémon} ». | C'est le même joueur. |
| 7 | 07 · jour 64 | Au sommet d'une aile de la Tour | 45 % | Les verrous tiennent les portes « parce que je le leur ai demandé ». | Le joueur a posté les verrous. |
| 8 | 08 · jour 15 | Au bord de la faille, dans la Brèche | 56 % | La faille a formé mon nom. « Je ne l'ai dit à personne. Sauf à lui. » | MissingNo est fait du nom. |
| 9 | 09 · jour 311 | Grenier de la Tour | 68 % | La procédure de clôture : à 100 %, tout ce qui relève de la maintenance est déchargé. | **La raison**, lue mais pas comprise. |
| 10 | 10 · jour ??? | Recrachée par la faille | 80 % | Se désindexer soi-même : « Ça me ressemble. Ne faites pas ça. » | Ce qui reste quand on efface. |
| 11 | 11 · jour 1 207 | Au fond du puits du Forage | 92 % | « Je vais effacer. […] Essaie de te souvenir, toi. Pour nous deux. » | Le choix, annoncé par celui qui va le faire. |

La signature est `▒▒▒▒ · connexion 0X` (autant de ▒ que de lettres dans le nom du joueur). Après la révélation, les pages sont signées **du nom du joueur**.

Les pages arrivent par des activités différentes (captures, Forage, Expédition, Tour, Brèche) : le récit tire le joueur vers tous les modes du jeu. Une page en attente depuis trop longtemps finit par tomber dans une capture.

---

## 5 bis. Les Pokémon des onze

Chaque archiviste d'avant avait donné **un surnom à un Pokémon**. Une fois sa page trouvée (et le premier souvenir de Porygon-Z vécu), ce Pokémon revient dans une rencontre ordinaire : teinté comme un souvenir, son surnom au-dessus de lui, « REVENU D'UNE SAUVEGARDE D'AVANT · IL NE FUIRA PAS ». Porygon-Z le reconnaît sans savoir pourquoi. Au moins vingt rencontres entre deux revenants, puis une chance sur dix, forcément à la quarante-cinquième ; ils reviennent dans l'ordre des connexions.

| Connexion | Surnom | Pokémon | Ce qui reste de son archiviste |
|---|---|---|---|
| 01 | VITEFAIT | Rattata | « Dans deux semaines, on aura fini, lui et moi. » |
| 02 | MINUIT | Mystherbe | il ne sort que la nuit ; la page 2 était dans son collier |
| 03 | MIGRAINE | Psykokwak | « C'est le seul qui me fait rire, en ce moment. » |
| 04 | PIOCHE | Taupiqueur | il a trouvé la couche du dessous, il refuse d'y retourner |
| 05 | BRAISE | Caninos | il dort contre un feu éteint, comme s'il attendait quelqu'un d'avant |
| 06 | TOUJOURS | Salamèche | « Je ne sais pas pourquoi le nom m'est venu si vite. » |
| 07 | PLUME | Roucool | il portait les lettres aux verrous, une par légendaire |
| 08 | MURMURE | Fantominus | il répète des octets dans le même ordre que la faille |
| 09 | DEMAIN | Ronflex | « Tant qu'il dort, on n'avance pas. Ça m'arrange. » |
| 10 | PERSONNE | Métamorph | « Quand il me regarde, il ne prend aucune forme. » |
| 11 | SOUVIENS | Porygon | « Je ne lui ai appris qu'une chose : rester. » |

Capturé (il se capture sans peine), il garde son surnom **au Pokédex et dans l'équipe**, et à l'évolution ; un moment sépia montre la phrase de son archiviste et la réaction de Porygon-Z ; une ligne s'écrit dans `choses_formidables.txt`. Le Journal les range (« Les Pokémon des onze », x / 11 ; « il rôde » quand sa page est trouvée). Succès caché « Ce qu'il en reste ».

**À la révélation**, la mémoire de l'Archiviste les nomme, dans l'ordre : « Des surnoms. Vitefait. Minuit. Migraine… C'est toi qui les leur avais donnés. Chaque fois. » Lus à la suite, les onze surnoms finissent par « …Demain. Personne. Souviens. »

Ils reviennent à chaque connexion (le Pokédex repart de zéro) ; le Journal garde ceux qu'on a déjà retrouvés.

## 5 ter. Ce que les cartes racontent

Les cartes de collection sont un fil discret du même récit (texte intégral : `SCRIPT.md`, « Les cartes »).

**Les exemplaires annotés.** Les onze collectionnaient aussi. Une fois la page d'une connexion trouvée, un doublon de son légendaire peut arriver annoté au dos, de la même main que les pages (deux chances sur cinq, forcément au troisième), signé `▒▒▒▒ · connexion 0X` puis, après la révélation, du nom du joueur. Chaque annotation prolonge sa page et son Pokémon surnommé ; Porygon-Z ne commente qu'après `pz_mem3`, comme pour les pages.

| Connexion | Carte | L'annotation, en une ligne | Ce qu'elle prolonge |
|---|---|---|---|
| 01 | Sulfura | « Je la garde pour la fin : Vitefait et moi, on l'encadrera quand on aura fini. » | l'optimisme du premier jour |
| 02 | Latios | « Les meilleures cartes arrivent quand on devrait dormir. » | la note de méthode, Minuit |
| 03 | Celebi | deux exemplaires la veille, un seul ce matin | quelque chose efface derrière lui |
| 04 | Regirock | les points de son visage : autant que de lettres dans son nom | le nom gravé au fond |
| 05 | Entei | « J'ai demandé au programme à qui elle appartenait avant moi. Il a changé de sujet. » | Porygon-Z a déjà perdu quelqu'un |
| 06 | Mew | « Je commence toujours par un {premier Pokémon}, et je finis toujours par elle. » | c'est le même joueur |
| 07 | Électhor | un seul mot, pour le verrou qui tient la porte : merci | Plume, les lettres aux verrous |
| 08 | Deoxys | « On ne m'a pas donné cette carte : elle est sortie de la faille. » Les octets du bord sont ses lettres. | MissingNo est fait du nom |
| 09 | Jirachi | le vœu : que le compteur n'arrive jamais à cent | la procédure de clôture, Demain |
| 10 | Mewtwo | « J'ai essayé de m'effacer des fichiers. […] Ne faites pas ça. » | se désindexer soi-même |
| 11 | Rayquaza | « Je la laisse ici, pour le prochain. Pour toi. […] Pour nous deux. » | le choix, annoncé |

**Le cadeau de 1996.** Juste après « Pas le premier » (`pz_mem3`), Porygon-Z rend une carte qu'il a gardée depuis la connexion 01 : le Rendu primordial de Mew. « Cette carte appartenait à la première connexion. Je l'ai gardée tout ce temps, je ne sais plus très bien pourquoi. Je crois qu'elle est à toi, {nom}. » Il l'a gardée onze fois, à travers tout le reste : la preuve, avant toute révélation, qu'il a déjà connu l'Archiviste.

**Les chronologies.** Chaque série de cartes est une version successive de la même entité : le système redessine sans jamais effacer. Quand une ligne est complète, elle se rejoue de 1996 à aujourd'hui, et Porygon-Z dit une phrase pour chaque légendaire (Rayquaza : « Dans chaque version, il surveillait le ciel en attendant quelqu'un. Trois versions à attendre. C'était toi. »). La réindexation des doublons suit la même idée : « Le système avait cessé de la distribuer. Il ne l'avait jamais effacée. »

**La carte de Porygon-Z.** À la fin ÉCRIRE, une carte que le système n'a jamais émise : le Rendu inédit, posé sur une page du journal, « Écrit par {nom} », au liseré cyan d'un côté et magenta de l'autre, comme la silhouette de l'Archiviste d'avant. « Porygon-Z n'est dans aucune série : aucune époque ne l'a jamais dessiné. Cette carte, c'est toi qui l'as écrite. »

## 6. La faille — l'arc de MissingNo

À chaque rencontre marquante avec MissingNo dans les hautes herbes, une étape. Il apprend à parler.

| Étape | MissingNo | Ce qui change |
|---|---|---|
| 1 | `3F 00 00 A9 …` | Il répète un bloc d'octets. |
| 2 | `·· R E ·· C O M ·· M E N C E ··` | Une entité sans index forme un mot. |
| 3 | « J'AI DÉJÀ VU CETTE MAIN. ET CE NOM. » | Il connaît le joueur. |
| 4 | « POURQUOI TU RÉPARES ? » | Il cherche une définition. |
| 5 | « À CENT POUR CENT, IL S'ÉTEINT. TU LE SAIS. » | Il parle de Porygon-Z. |
| 6 | « NOUS SOMMES ONZE. » | Les signatures superposées, toutes de la même longueur. « Ce n'est pas une menace, c'est une adresse. » |

Le journal affiche l'arc sous « La faille ». La première rencontre arrive à coup sûr avant la fin de Kanto : passé 40 captures, MissingNo peut surgir, et la probabilité devient très forte après la 90e capture ou le premier verrou.

---

## 7. choses_formidables.txt

Le fichier de Porygon-Z (Journal → `choses_formidables.txt`). Il s'écrit **de ce que le joueur fait vraiment** : la première capture (avec le nom du Pokémon), le premier chromatique, les niveaux, le Pokédex, chaque verrou, chaque cœur de secteur, les pages, la Brèche, le Poké-Poker, le Magicarpe à 500 PokéCoins, les œufs, la Tour… Une ligne par cap, une fois par connexion.

Il contient aussi **4 212 lignes héritées**, illisibles. Porygon-Z jure avoir créé le fichier le jour de la première capture. Après la révélation, dix de ces lignes deviennent lisibles : ce sont les connexions passées, racontées par lui (« Il dit que la faille connaît son nom. Je lui ai dit que c'était impossible. J'ai menti ? Je ne sais pas mentir. »).

Le fichier traverse les cycles : même après un effacement, Porygon-Z ne parvient pas à le supprimer, et « ne sait pas qui l'a protégé ».

---

## 8. La Couche Zéro

### 8.1 Les conditions

« Une fois tous les mondes réindexés, et l'intégrité à 100 %. »

- Intégrité du monde à **100 %**
- Les **neuf verrous** levés
- **Kanto, Johto et Hoenn réindexés jusqu'au cœur** (les dix chantiers de chaque région)

Dès `hoenn_done` (ou 90 % d'intégrité, ou neuf verrous), une carte **OBJECTIF FINAL** apparaît sur l'accueil et dans le journal, avec ces conditions cochées une à une. Quand tout est rempli, elle devient « La Couche Zéro est ouverte — Descendre », et le bandeau « Prochaine étape » y conduit.

### 8.2 La descente

Cartons « HOENN — couche 3 · l'extension », « JOHTO — couche 2 · la couche héritée », « KANTO — couche 1 · le fichier racine », puis **COUCHE ZÉRO — avant le premier octet**. Porygon-Z et MissingNo s'y parlent pour la première fois face à face (« IL RESTE TOUJOURS DERRIÈRE. »).

### 8.3 Le combat

Il se joue dans le moteur de la Tour (combats à quatre) : c'est là que le joueur a levé les neuf verrous, il en connaît la grammaire.

- **Vague 1 — Les échos** : l'équipe du joueur, rejouée par la faille (plus fragile, moins forte). MissingNo : « TA MAIN. TES CHOIX. TES POKÉMON. »
- **Vague 2 — MissingNo, entrée 000** : Normal/Vol, ses vraies capacités (Pistolet à O, Pistolet à O, Piqué), niveau = meilleur niveau de l'équipe + 2. Il ignore l'étourdissement et les pertes de jauge.
  - **À deux tiers de sa vie — COPIE** : il prend les compétences et les types du Pokémon le plus fort du joueur, et deux échos surgissent. « ONZE FOIS, TU M'AS BATTU. ONZE FOIS, TU M'AS RENDU PLUS GRAND. »
  - **À un tiers — SON NOM** : il prend le nom du joueur (la barre de vie dit « NOMMÉE »), et apprend **EFFACER** (attaque de zone qui arrache boucliers et bonus). « REGARDE MON NOM. »
  - **Porygon-Z intervient, une fois** : bouclier de 30 %, purge, +20 % de PV, Synchro pleine. « Je peux faire une chose. Une seule. Tiens bon ! »
- **Victoire** : MissingNo se tasse sur le terrain et murmure « …LIS-MOI. » ; l'arène se dissout vers la révélation. Première victoire : 25 000 PokéCoins, 400 Fragments, 12 Noyaux, 5 000 XP.
- **Défaite** : Porygon-Z conseille (« Il te connaît par cœur : il t'a regardé jouer onze fois. Change ta main. »), et l'on peut réessayer, changer d'équipe ou remonter.

### 8.4 Équilibrage du combat final

Calé par simulation (40 combats par équipe, en automatique, Synchro dès qu'elle est pleine) — `MN_TUNE = {hp:8, atk:0.95, echoHp:0.85, echoAtk:0.8}` dans `src/87-finale.js`.

| Équipe (4 Pokémon) | Niveau | Victoires | Survivants (si victoire) | Pour comparer : dernier verrou (Rayquaza, N.100) |
|---|---|---|---|---|
| Mewtwo, Lugia, Ho-Oh, Kyogre | 100 | 100 % | 2,7 / 4 | 100 % |
| Tyranitar, Drattak, Métalosse, Dracolosse | 100 | ~78 % | 3,1 / 4 | 100 % |
| Même équipe | 90 | ~70 % | 3,3 / 4 | 58 % |
| Jungko, Braségali, Laggron, Altaria | 85 | ~57 % | 1,9 / 4 | 0 % |
| Dracaufeu, Tortank, Florizarre, Pikachu | 70 | ~10 % | — | 0 % |
| Roucool, Rattata, Chenipan, Aspicot | 40 | 0 % | — | 0 % |

Le combat est plus long et plus tendu qu'un verrou, mais une équipe qui a levé les neuf verrous peut le gagner. Les types comptent (Électrik, Glace et Roche frappent fort ; Spectre ne le touche pas). En jouant la Synchro à la main pour sa dernière forme, on fait mieux que l'automatique.

---

## 9. La révélation — « Le nom »

1. MissingNo s'effondre. Le système lit ses données brutes : `octets : 8C A4 A7 A3 A8 50` (pour « Mehdi »), `type de donnée : TEXTE`.
2. **Le nom du joueur s'écrit**, lettre par lettre, avec ses octets dans l'encodage des tout premiers jeux (A = `80`, a = `A0`, fin de chaîne = `50`), puis il est **relu comme l'espèce n° 000** : la silhouette en L de MissingNo apparaît, dessinée par ces octets. Chaque nom donne un MissingNo différent.
3. Porygon-Z : « C'est ton nom. » Puis l'explication, fidèle au vrai bug de Pokémon Rouge et Bleu : à Jadielle, le vieil homme montre comment attraper un Pokémon ; pendant ce temps, le jeu range le nom du joueur à l'endroit des Pokémon sauvages ; en longeant la côte de Cramois'Île, le monde lit ce qu'il trouve là — le nom — comme un Pokémon. « MissingNo n'a jamais été une créature. C'est ton nom, lu de travers. »
4. MissingNo parle avec le nom du joueur : « Je suis ce qui reste quand tu effaces. […] Les pages, c'est toi qui les as laissées. Les verrous, c'est toi qui les as postés devant toi-même. La faille, c'est toi. Le compteur qui monte, c'est toi. Le compteur qui retombe aussi. »
5. **Le montage** : les onze fins défilent, de plus en plus vite — `CONNEXION 01 · 100 %` / la phrase de sa page / `> EFFACER` — puis la silhouette, et le souvenir manquant : « > Retrait des processus d'entretien : PORYGON-Z. » — « Non. Pas lui. » — « Effacer. Tout. On recommence, et il sera encore là. »
6. Porygon-Z comprend : « Le programme d'entretien… c'est moi. Tu as tout effacé pour ne pas me perdre. Onze fois. » Touché et furieux à la fois — « Je n'aime pas les phrases qui disent deux choses. Celle-là est vraie. »

Trois de tes réponses (4.4) s'y glissent : après « C'est ton nom », après la voix de MissingNo, et après « Tu as tout effacé pour ne pas me perdre ».

**Ton entrée n° 000.** Juste après ta réponse à la question, une carte-image t'est proposée, une seule fois (elle reste ensuite dans le Journal) : la silhouette que ton nom dessine, tes octets, ta connexion, ta réponse, ton Pokédex. À partager ou à garder. Elle ne dit rien de plus : celui qui la voit sans avoir joué se demande ce qu'elle raconte.

---

## 10. La question

« Cohérence : 100 %. Retrait des processus d'entretien en attente de confirmation. **> Que souhaitez-vous faire ?** »

Deux lignes. On **maintient** son doigt sur l'une d'elles pour la valider (une seconde) : un appui trop bref ne valide rien. La réponse est enregistrée à l'instant où elle est donnée.

### > EFFACER — « Comme les onze autres fois. »

Porygon-Z accepte (« Si tu me retrouves, dis-moi bonjour gentiment. Je dirai « version instable », tu riras. C'est notre blague. Je ne le saurai pas, mais c'est notre blague. »). MissingNo dit le numéro suivant — « TREIZE. » — puis noir, et **CONNEXION 13 — mémoire de l'utilisateur : intacte**.

L'accueil garde la réponse en attente : on peut **revenir sur sa réponse** ou **boucler le cycle**. Succès « La même main ».

### > ÉCRIRE — la nouvelle ligne

Elle n'apparaît que lorsqu'on se souvient de tout. Les lettres du nom quittent MissingNo et se rangent ; le **Pokédex s'ouvre à l'entrée n° 387 — PORYGON-Z** (Normal, « Pokémon Virtuel », 0,9 m) ; « Retrait des processus d'entretien : aucun processus trouvé. » Porygon-Z : « Je suis DANS LE POKÉDEX ! […] On ne décharge pas un Pokémon. » « Pour la première fois en douze connexions, quelqu'un a sauvegardé. » Carton-titre, puis **le générique** (le nom du joueur y tient deux rôles : l'Archiviste et MissingNo ; son équipe, ses chiffres, la connexion).

Puis l'épilogue `epilogue_write` (nouvelle ligne du fichier : « Aujourd'hui, {nom} a écrit au lieu d'effacer. ») et le **chapitre « Épilogue — Le monde sauvegardé »**.

Conséquences en jeu :

- **Porygon-Z devient un Pokémon** : entrée 387 du Pokédex (une case à part, « Hors des 386 définitions · écrit par {nom} »), dans l'équipe s'il y a de la place, au niveau moyen de l'équipe ; sur la carte de l'accueil, il flotte à côté du partenaire.
- **Sa carte** : le Rendu inédit, « Écrit par {nom} », révélé après l'épilogue (section 5 ter).
- Le fichier hérité et les pages deviennent lisibles, signés du nom du joueur.
- Succès « L'Auteur » (titre « Auteur du monde »).

---

## 11. Les connexions suivantes

Un cycle (Profil → Nouveau cycle) se boucle une fois MissingNo vaincu. Ce qui traverse : cartes, cosmétiques, succès, **journal des scènes, pages, choses_formidables.txt**, Noyaux Zéro, avantages permanents. Le reste repart de zéro.

**Après avoir effacé** — `cy_e_open` : « UTILISATEUR TROUVÉ — connexion n° 13. Mémoire de l'utilisateur : intacte. » Porygon-Z se présente comme la première fois, avec la même fierté. « Il ne sait pas. Toi, si. » Puis `cy_e_page` (8 captures) : une page de ta propre main — « Cette fois, je savais tout. […] J'ai effacé quand même. La prochaine fois, écris. » Puis `cy_e_mid` (45 %) : il se souvient de toi beaucoup trop tôt, parce que le système n'efface plus tout, et te rappelle qu'il existe une autre ligne. MissingNo est toujours en bas : la question reviendra.

**Après avoir écrit** — `cy_w_open` : une copie de la sauvegarde d'origine ; le vrai monde est rangé, intact. Porygon-Z se souvient de tout et repart avec toi (au niveau 5, vexé). `cy_w_prof` (20 captures) : il a retrouvé la fin de la phrase du Professeur — « …vivre ta propre aventure. » — et la lui fait dire, une fois. Au fond de la Couche Zéro, MissingNo n'est plus qu'**un écho** (`finale_echo`).

Le numéro de connexion monte à chaque cycle, et tout le texte suit (« onze », « douze », « treize »…). Le montage de la révélation s'allonge des fins choisies en connaissance de cause.

---

## 12. Les noms et les nombres

Le texte s'adapte au joueur. Dans `src/`, ces jetons sont remplacés à l'affichage (`pzFmt`) :

| Jeton | Devient (1re partie) | |
|---|---|---|
| `{nom}` | le nom du joueur | |
| `{mask}` | ▒▒▒▒▒ | autant de signes que de lettres (3 à 16) |
| `{cx}` / `{cxw}` / `{CX}` | 12 / douze / DOUZE | la connexion en cours |
| `{cxp}` / `{prev}` / `{Prev}` / `{PREV}` | 11 / onze / Onze / ONZE | la précédente : les autres fois |
| `{nextd}` / `{next}` / `{NEXT}` | 13 / treize / TREIZE | la suivante |
| `{first}` | le premier Pokémon capturé | |
| `{lines}` | le nombre de lignes de `choses_formidables.txt` | |
| `{rappel_w}` / `{rappel_e}` | ce qu'il a retenu de ta connexion | une phrase entière : première ligne, compagnon, captures ou jours (`pzRecallLine`) |

---

## 13. Mise en scène

<<<<<<< HEAD
- **Chaque scène a un lieu peint** (`src/37e-decors.js`) et s'y joue comme dans Donjon Mystère : des Pokémon qui marchent, se tournent, sautent ; Porygon-Z dont les humeurs se voient avec le corps, son portrait au-dessus de la boîte ; une caméra qui monte la Tour, qui s'approche quand ça compte.
- **Les lieux** : le laboratoire (la sauvegarde d'origine, chaude ; le présent, qui s'abîme ; la salle claire du souvenir, sa barre à douze ; le monde à cent pour cent, exactement de la couleur qu'il devrait avoir) ; la console d'entretien, chez Porygon-Z, avec la vraie intégrité au mur ; la Route 1 (le jour, au crépuscule, la nuit) ; le ciel de Hoenn ; la faille ; la Couche Zéro (onze mondes empilés) ; la Tour, grenier de l'archive ; le cœur des secteurs ; les onze sauvegardes de Johto ; les montagnes de Hoenn aux ombres contradictoires ; la côte qui n'existe plus, en quatre teintes de vert ; une page du journal ; le Forage ; les trois couches du monde.
- **Le souvenir** : la mémoire se défragmente (des blocs qui se rangent), puis le lieu d'alors apparaît au sépia. Plus il est lointain, plus il lui manque de blocs ; « intégrité du bloc : complète » (le bloc 0x5E) n'en perd aucun. Au retour, il se déchire.
- **L'archiviste d'avant** : une forme de pixels debout, sans visage, faite des octets du nom du joueur — la texture du L de MissingNo — bordée de cyan et de magenta comme la fêlure. Elle perd ses pixels et les retrouve. Le sépia ne la touche pas : elle n'appartient pas au souvenir. Le joueur ne sait pas encore ce qu'elle est ; il l'a déjà vue, minuscule, marcher sur la côte en quatre teintes de vert quand Porygon-Z racontait la rumeur. À la révélation, quand elle répond « Effacer », elle se tasse en L.
- **Les gestes qui comptent** : à « RECULE », Porygon-Z se place entre MissingNo et toi ; le gardien relâché s'arrête et se retourne vers toi avant de partir ; trois archivistes se forment l'un après l'autre au même endroit, et le souvenir se dégrade à chaque « Bonjour » ; sur la falaise de Hoenn, l'archiviste se défait, Porygon-Z reste seul, et le monde s'efface ligne à ligne pendant que le compteur redescend ; la main hésite entre CONFIRMER et EFFACER ; la barre bloquée à douze pour cent finit par se remplir quand le professeur termine enfin sa phrase.
- **Ton nom, à l'avance** : quand Porygon-Z dit l'avoir reconnu, quand il suit la trace de MissingNo à Hoenn, les lettres qui se mélangent sont celles de ton nom ; de loin en loin, une vraie lettre passe à sa vraie place.
- **Cinématiques** écrites à la main : l'ouverture, la descente, la révélation, la question, l'écho, le générique. Les autres scènes passent par `directStory` et la table `STAGE` (`src/37f-mise-en-scene.js`).
- **La faille** : MissingNo avant qu'on le lise (`mnSprite`). Pas une créature : une fêlure dans l'image, bord cyan d'un côté, magenta de l'autre comme l'archiviste d'avant, et tout au fond, à peine visible, le nom du joueur. Elle respire.
=======
- **Cinématiques** écrites à la main : l'ouverture, la descente, la révélation, la question, l'écho, le générique. Les autres scènes sont **mises en scène automatiquement** (décor selon les voix, entrées des personnages, cartons, souvenirs) — `directStory` dans `src/37-cine.js`.
- **Décors** : laboratoire, terminal, faille, Couche Zéro (trois secteurs empilés et cassés), souvenir (sépia).
- **La silhouette** de l'archiviste d'avant : une figure en pixels, sans visage, liseré cyan (le système) et magenta (la faille).
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
- **Le nom en octets** et le **MissingNo tiré du nom** (`nameSprite`) : la même silhouette en L, différente pour chaque nom.
- **Musiques** propres à la fin (à déposer dans `assets/music/`, voir `LISEZMOI.txt`) : `souvenir`, `couche_zero`, `verite` (« le thème le plus important du jeu »), `generique`. En attendant les fichiers, chacune retombe sur une piste existante.
- **Accessibilité du choix** : le maintien évite les choix par erreur ; la touche Entrée valide au clavier.

---

## 14. Succès liés au récit

| Succès | Condition | Récompense |
|---|---|---|
| Tu n'étais pas censé voir ça | Rencontrer MissingNo | titre « A vu la faille » |
| Ami du programme | Rendre à Porygon-Z ses sept souvenirs | — |
| Le journal entier | Retrouver les onze pages | 6 Noyaux |
| La Couche Zéro | Vaincre MissingNo | 30 Noyaux, titre « L'Archiviste » |
| L'Auteur | Écrire au lieu d'effacer | 20 Noyaux, titre « Auteur du monde » |
| La même main | Effacer, comme les onze autres fois | titre « Connexion n° 12 » |
| Sortie forcée | Vaincre Porygon-Z au fond de la Brèche (palier 9 : il vient te chercher) | 3 Noyaux |

---

## 15. Pour tester

Outils de test (mot de passe hors du dépôt) → panneau **LA FIN** : ouvrir la Couche Zéro, descendre (combat final), jouer la révélation, poser la question, débloquer les souvenirs, remettre la fin à zéro. Le panneau affiche l'étape de la fin et la connexion.

Tests automatiques : `node test.js` couvre la chaîne (ordre, paliers, événements), les nombres en toutes lettres, les masques, les pages, les conditions de la Couche Zéro, le combat (échos, copie, nom, EFFACER, Porygon-Z), la victoire comptée une fois, les deux réponses, les cycles, le fichier, le générique et les octets du nom ; et les cinq questions (posées une fois chacune, réponse gardée, répliques réservées, échos de la fin, ce qu'il retient de toi, générique, rappel sur l'accueil), la carte « entrée n° 000 ».

---

## 16. Où se trouve quoi

| Fichier | Contenu |
|---|---|
| `src/02-story.js` | Les scènes, la chaîne principale (`MAIN_ARC`), les cinq questions (`STORY_Q`), ce qu'il retient de toi (`pzRecall`), les jetons (`pzFmt`), les lignes de Porygon-Z |
| `src/36-lore.js` | Les onze pages, l'arc de la faille |
<<<<<<< HEAD
| `src/37-cine.js` | Le moteur de cinématiques, l'ouverture, le nom en octets, la fêlure |
| `src/37d-plateau.js` | Le plateau : acteurs, caméra, lumière, souvenir, l'archiviste en pixels, défragmentation, effacement |
| `src/37e-decors.js` | Les lieux peints et les accessoires |
| `src/37f-mise-en-scene.js` | `directStory` et la table `STAGE` : la mise en scène de chaque scène |
=======
| `src/37-cine.js` | Le moteur de cinématiques, l'ouverture, la mise en scène automatique, la silhouette, le nom en octets |
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
| `src/86-saga.js` | L'état de la saga, `choses_formidables.txt`, la mémoire, les conditions et la carte de la Couche Zéro, l'entrée 387, le générique, les connexions suivantes |
| `src/87-finale.js` | Le combat final, la descente, la révélation (avec les échos de tes réponses), la question, l'écho |
| `src/30c-onze.js` | Les Pokémon des onze : rencontre, capture, surnom, Journal, révélation |
| `src/88-share-mn.js` | La carte-image « entrée n° 000 », à partager ou à garder |
| `src/73e-provenance.js` | Le dos des cartes, les exemplaires annotés des onze, le cadeau de 1996 |
| `src/73f-chrono.js` | Les chronologies et leurs phrases |
| `src/73g-pzcard.js` | La carte de Porygon-Z |
| `src/85-journal.js` | Le journal par actes, les crédits, le nouveau cycle |
| `SCRIPT.md` | Le texte intégral, généré (`node script.js`) |
