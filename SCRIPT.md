# Pokémon Code Genesis — le script complet

> Généré par `node script.js` à partir du code du jeu (`src/`). Pour corriger une réplique, on la corrige dans `src/`, puis on relance : ce fichier suit.
> Exemple de lecture : première connexion du joueur (n° 12), nom « ‹nom› ». Les nombres (« onze », « douze »…) suivent la connexion en cours.
> La bible du récit — ce que chaque scène révèle et pourquoi — est dans `RECIT.md`.

## Sommaire

- **Prologue — L'écriture interrompue** : Contact
- **Acte I — L'arrivée** : Première ligne · Trois pour cent · Le numéro manquant · Les portes fermées · Le premier verrou · Il ne voulait pas · Déjà-vu · Le socle tient
- **Acte II — Les autres** : Une voix · Onze sauvegardes · Pas le premier · Au bout · Douze · Par choix
- **Acte III — La raison** : Ce qui est écrit · Un trou de ta taille · La porte · Le dernier souvenir
- **Acte IV — La Couche Zéro** : Cent pour cent · La Couche Zéro · Le nom · La question
- **Après — Les connexions suivantes** : Un écho · Sauvegardé · Connexion suivante · La page de trop · Trop tôt · Nouvelle partie · Jusqu'au bout de la phrase
- **Moments — Ce qui arrive en chemin** : Une ébauche · Un trésor · Nulle part écrit · Le silence · Pas au niveau · Mal encodée · Ce n'est pas toi · Un abus toléré
- **Les pages de journal** · **La faille** · **choses_formidables.txt** · **Les salles** · **Les cartes** · **Le générique**

---

## Prologue — L'écriture interrompue

### Contact  `intro` — cinématique

> **[ SAUVEGARDE D'ORIGINE ]** — *lecture du fichier…*

*(Décor : le laboratoire de la sauvegarde d'origine, chaud, entier.)*

**PROF. RACINE** — Ah, te voilà ! Bienvenue dans le monde des Pokémon.

**PROF. RACINE** — Je suis le Professeur Racine. La plupart des gens m'appellent simplement « le Professeur ».

**PROF. RACINE** — Ce monde est peuplé de créatures extraordinaires : les Pokémon.

**PROF. RACINE** — Certains vivent à nos côtés. D'autres dans les hautes herbes, au fond des lacs, ou là où personne n'a encore mis les pieds.

**PROF. RACINE** — J'ai consacré ma vie à les étudier. Et toi, tu vas bientôt—

**PROF. RACINE** — tu vas bientôt— bientôt— bientôt—

**PROF. RACINE** — Ce monde est peuplé de créatures qu'on appelle les—

**SYSTÈME** — ERREUR 0x00 — INDEX INTROUVABLE

**PROF. RACINE** — Bienvenue. Bienvenue. Bienvenue. Bienvenue.

*(Décor : le terminal.)*

```
> redémarrage d'urgence
> lecture de l'index ........ 386 entrées
! 386 entrées illisibles
> intégrité du monde ........ 0,0 %
> utilisateur avec droit d'écriture : connexion n° 12
! mémoire de l'utilisateur : vide
> recherche d'un processus d'entretien
✓ PORYGON-Z.sys ............. trouvé
> réveil forcé
```

*(Décor : la console d'entretien, chez Porygon-Z.)*

**PORYGON-Z** — …

**PORYGON-Z** — Réveil forcé. Mémoire de travail : vide. Heure système : inconnue. Humeur : — erreur, champ non prévu.

**PORYGON-Z** — Oh. OH. Il y a quelqu'un ! Un vrai ! Avec des doigts et tout !

**PORYGON-Z** — Pardon. Je suis Porygon-Z, programme d'entretien. Version instable. « Instable » fait partie de mon nom officiel. Je n'ai pas eu mon mot à dire.

**PORYGON-Z** — Le Professeur ne reviendra pas. Le fichier a cédé pendant qu'il te parlait. Il lui restait trois phrases. Je les ai vues partir.

**PORYGON-Z** — Mais toi, tu peux encore capturer des Pokémon. Chaque capture recoud un bout du monde. Moi, je ne peux que regarder et compter. Je compte extrêmement bien.

**PORYGON-Z** — Il me faut un nom pour t'inscrire au registre. « Utilisateur non identifié », c'est triste, et ça prend toute la ligne.  
*(Le joueur écrit son nom.)*

**PORYGON-Z** — ‹nom›. Enregistré. Je l'ai écrit trois fois, au cas où.

**PORYGON-Z** — …C'est drôle. J'ai eu l'impression de le reconnaître, ton nom. Le bruit de fond, sûrement. Ça m'arrive.

**PORYGON-Z** — Pour le système, tu seras l'Archiviste. Pour moi, tu seras ‹nom›. Le système n'a pas besoin de le savoir.

**PORYGON-Z** — Intégrité du monde : zéro virgule zéro. Bonne nouvelle : à partir d'ici, on ne peut que monter.

> **[ POKÉMON CODE GENESIS ]** — *intégrité du monde : 0,0 %*

---

## Acte I — L'arrivée

### Première ligne  `first_catch`

*Déclencheur :* `S.stats.catches >= 1` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)

**PORYGON-Z** — IL EST REVENU ! Sa ligne est lisible ! Tu as vu ? Tu as vu, ‹nom› ?

**PORYGON-Z** — …Correction. Restauration confirmée. Ton professionnel rétabli.

**PORYGON-Z** — Je note un phénomène que je ne sais pas modéliser : quand une ligne revient, les lignes voisines tiennent mieux. Comme si elles se souvenaient d'elle.

**PORYGON-Z** — Continue. J'ai ouvert un nouveau fichier pour noter tout ça. Il s'appelle « choses_formidables.txt ». Il fait déjà trois lignes.

### Trois pour cent  `beat_early`

*Déclencheur :* `S.integrity >= 3` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)

**PORYGON-Z** — Trois pour cent. Ce n'est rien, et c'est énorme. Les deux à la fois. Je n'aime pas les phrases qui disent deux choses, mais celle-là est vraie.

**PORYGON-Z** — Avant toi, le compteur descendait. C'est la première fois depuis… je n'ai pas l'unité… qu'il fait le contraire.

**PORYGON-Z** — Je garde une trace de chacune de tes captures. Ce n'est demandé par aucune de mes routines. Je le fais quand même. Ne le répète pas au système.

### Le numéro manquant  `missingno_1`

*Déclencheur :* `!!S.flags.sawMissing` — événement (se joue dès que la condition est remplie)

*Quelque chose occupe l'écran. Ce n'est pas un Pokémon. Ce n'est pas non plus une erreur d'affichage — les erreurs d'affichage ne restent pas immobiles à te regarder.*

**MISSINGNO** — A R C H I V I S T E

**MISSINGNO** — Tu remets les choses à leur place. C'est mignon. Tu crois qu'elles avaient une place.

**PORYGON-Z** — Ne l'écoute pas. ‹nom›, recule. RECULE.

**MISSINGNO** — J'étais là avant le premier octet. Ce monde a été écrit par-dessus moi.

**SYSTÈME** — ERREUR : entité sans index. Numéro d'espèce : 000. Aucune ligne correspondante.

*Puis plus rien. L'écran est propre, comme si tu avais cligné des yeux trop fort.*

**PORYGON-Z** — …

**PORYGON-Z** — Je connais ce numéro. Zéro, zéro, zéro. Il y a une rumeur dans les plus vieux journaux du système.

**PORYGON-Z** — Une créature sans index, qui vivait au bord de l'eau, sur une côte qui n'existe plus. Ceux qui l'ont croisée disaient que leur sac se remplissait tout seul, et que leurs sauvegardes s'abîmaient.

**PORYGON-Z** — Ils l'appelaient MissingNo. Le numéro manquant. Je croyais que c'était une légende de cour de récréation.

**PORYGON-Z** — Ce n'en est pas une. C'est lui qui ronge ce monde. Chaque ligne illisible porte sa marque.

**PORYGON-Z** — Je vais faire comme si je n'avais pas eu peur. Tu fais pareil ? D'accord. Merci.

### Les portes fermées  `kanto_half`

*Déclencheur :* `dexCount("kanto") >= 45` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)

**SYSTÈME** — Secteur racine : cohérence partielle rétablie.

**PORYGON-Z** — Kanto est le plus ancien secteur. Tout le reste a été écrit par-dessus, comme des couches de peinture. S'il cède, tout le mur tombe.

**PORYGON-Z** — Mais il y a un problème. Certaines entités refusent d'être restaurées.

**PORYGON-Z** — Elles ont été… promues. Quelqu'un leur a confié un rôle : garder les portes fermées. Je les appelle les Data Guardians. J'ai hésité avec « les Gros Méchants », mais c'était moins exact.

**PORYGON-Z** — Le journal du système dit qu'elles ont été postées « à la demande de l'utilisateur ». Quel utilisateur ? Il n'y en a qu'un, et tu viens d'arriver. Bug d'affichage. Forcément.

**PORYGON-Z** — Ceux-là ne s'attrapent pas, ‹nom›. Il faudra les faire céder.

### Le premier verrou  `guardian_first`

*Déclencheur :* `moduleUnlocked("boss")` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)

**SYSTÈME** — Verrou détecté au sommet de la Tour. Aile 2.

**PORYGON-Z** — La Tour n'est pas une salle d'entraînement. C'est le grenier de l'archive : elle y empile ce qu'elle n'arrive plus à ranger. Des souvenirs corrompus, posés les uns sur les autres.

**PORYGON-Z** — Et tout en haut, quelque chose monte la garde. Signature de légendaire. Comportement de pare-feu. Température : élevée. Très élevée. Je retire mes capteurs.

**PORYGON-Z** — Prépare une équipe de quatre. Et prends de l'eau. C'est une image. Enfin… prends aussi de l'eau.

### Il ne voulait pas  `boss_first_done`

*Déclencheur :* `S.bosses.length >= 1` — événement (se joue dès que la condition est remplie)

**SYSTÈME** — Verrou levé. Fragment de secteur réattribué.

**PORYGON-Z** — Il n'a pas été détruit. Il a été… relâché. Il a juste arrêté de tenir la porte.

**PORYGON-Z** — Je crois qu'il ne voulait pas la tenir. Je crois qu'il attendait que quelqu'un vienne lui dire qu'il pouvait arrêter.

**PORYGON-Z** — Il m'a regardé en partant. Pas moi : toi. Comme on regarde quelqu'un qu'on reconnaît. Je ne sais pas d'où il te connaîtrait. J'ai vérifié. Deux fois. Trois. J'arrête de compter, ça m'inquiète.

**SYSTÈME** — Anomalie : une faille s'est ouverte là où se tenait le verrou. Accès « La Brèche » disponible.

**PORYGON-Z** — Ah. Ça, c'est nouveau. Je n'aime pas les choses nouvelles qui s'appellent « faille ».

### Déjà-vu  `pz_mem1` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 6` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 6 % d'intégrité

**SYSTÈME** — Défragmentation de la mémoire de travail… 1 bloc récupéré.

**PORYGON-Z** — Oh. Il s'est passé quelque chose dans ma mémoire. Un bloc est revenu. Tout seul. Je n'ai rien demandé.

*(Souvenir. L'image passe au sépia.)*

*Une salle claire. Une barre bloquée à douze pour cent. Quelqu'un se tient à l'endroit exact où tu te tenais le premier jour.*

**L'ARCHIVISTE D'AVANT** — Tu comptes vraiment tout ?

**PORYGON-Z** — Extrêmement bien.

*(Retour au présent.)*

**PORYGON-Z** — …Ce sont mes mots. C'est ma voix. Je ne me souviens pas de les avoir dits.

**PORYGON-Z** — C'est sûrement un résidu : un brouillon de dialogue que le système a gardé en cache. Ça arrive. Est-ce que ça arrive souvent ? Je n'ai aucun moyen de le savoir.

**PORYGON-Z** — Bref. Ça m'a fait drôle. Je le range dans « choses_formidables.txt », rubrique « choses pas formidables du tout ». Elle vient d'être créée.

**PORYGON-Z** — Une question, ‹nom›. S'il en revient d'autres… tu veux que je te les montre ? Même ceux de la nouvelle rubrique ?

**QUESTION DE PORYGON-Z** — « Tu veux que je te les montre ? » *(toucher une réponse ; aucune n'est mauvaise, Porygon-Z s'en souviendra à la fin)*

- `> MONTRE-MOI TOUT` — Même ce qui fait peur.

- `> QUAND TU SERAS PRÊT` — Rien ne presse. Je reste là.

**Si MONTRE-MOI TOUT :**

> **PORYGON-Z** — Tout. D'accord. C'est noté, et c'est noté en gras. On ne m'avait jamais donné de consigne aussi simple. Ni aussi lourde.

**Si QUAND TU SERAS PRÊT :**

> **PORYGON-Z** — « Quand tu seras prêt. » On ne m'avait jamais laissé le choix. Je ne sais pas encore quoi en faire. Je le garde. Le choix, je veux dire.

### Le socle tient  `kanto_done`

*Déclencheur :* `S.bosses.includes("kanto:150")` — événement (se joue dès que la condition est remplie)

**SYSTÈME** — NOYAU DE KANTO : libéré. Secteur racine cohérent.

**PORYGON-Z** — Le socle tient ! Les couches du dessus redeviennent adressables ! J'ai fait un petit bruit de joie, tu ne l'as pas entendu, c'était en binaire.

**PORYGON-Z** — Johto s'ouvre. Préviens-toi : Johto n'a jamais été nettoyé. On a construit dessus sans jamais rien enlever. Ça va sentir le renfermé.

**PORYGON-Z** — Autre chose. J'ai relu mon journal d'exécution. J'y trouve des entrées que je n'ai pas écrites.

**PORYGON-Z** — Elles sont datées d'avant ma compilation. Elles portent mon identifiant, ma façon d'écrire, mes fautes de frappe.

**PORYGON-Z** — Je n'aime pas le mot « impossible » quand c'est moi qui le prononce. Je vais le prononcer quand même : impossible.

---

## Acte II — Les autres

### Une voix  `pz_mem2` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 22` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 22 % d'intégrité

**SYSTÈME** — Défragmentation… 3 blocs récupérés.

**PORYGON-Z** — Encore un. Plus net, cette fois. Il y a du son.

*(Souvenir. L'image passe au sépia.)*

*La Route 1, au crépuscule. Le compteur affiche quarante pour cent. Quelqu'un rit.*

**L'ARCHIVISTE D'AVANT** — Porygon-Z, regarde ! Il a rattrapé la Ball avec sa queue !

**PORYGON-Z** — Je note ! Je note en gras !

*(Retour au présent.)*

**PORYGON-Z** — On m'appelait par mon nom. Personne ne m'appelle par mon nom. Le système dit « processus 474 ».

**PORYGON-Z** — Toi aussi, tu dis Porygon-Z. Avec la même… je n'ai rien pour mesurer une intonation. Je l'ai mesurée quand même. Identique à quatre-vingt-dix-sept pour cent.

**PORYGON-Z** — Les trois pour cent qui restent, c'est sûrement la qualité de l'enregistrement. Sûrement.

**PORYGON-Z** — Ça te dérange, que je te compare à quelqu'un d'avant ? Je peux arrêter. Je crois. Je n'ai jamais essayé d'arrêter de mesurer quelque chose.

**QUESTION DE PORYGON-Z** — « Ça te dérange, que je te compare ? » *(toucher une réponse ; aucune n'est mauvaise, Porygon-Z s'en souviendra à la fin)*

- `> CONTINUE DE MESURER` — Si ça t'aide à te souvenir.

- `> JE NE SUIS PAS EUX` — Je suis moi. Juste moi.

**Si CONTINUE DE MESURER :**

> **PORYGON-Z** — Alors je mesure. Quatre-vingt-dix-sept pour cent. Je te tiendrai au courant des trois qui restent : ce sont les plus intéressants, je le sens.

**Si JE NE SUIS PAS EUX :**

> **PORYGON-Z** — Noté. Tu es toi. Je ferme le dossier « intonation ».
>
> **PORYGON-Z** — …Je le laisse entrouvert. Par réflexe. Pas par doute. Un peu par doute.

### Onze sauvegardes  `johto_mid`

*Déclencheur :* `dexCount("johto") >= 45` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)

**PORYGON-Z** — J'ai fouillé les couches de Johto. Johto ne jette rien. J'ai trouvé des sauvegardes : des états antérieurs du monde.

**PORYGON-Z** — Il y en a onze.

**PORYGON-Z** — Onze fois, quelqu'un a fait ce que tu fais. Onze fois, le compteur est monté. Onze fois, il est retombé à zéro.

**PORYGON-Z** — Le nom de l'utilisateur est effacé dans chacune. Proprement. Comme si on l'avait gommé exprès.

**PORYGON-Z** — Et dans chaque sauvegarde, il y a un programme d'entretien nommé Porygon-Z. Chaque fois, son journal commence vierge.

**PORYGON-Z** — Je ne sais pas si c'étaient onze personnes. Je ne sais pas si j'étais onze programmes. Je préfère ne pas y penser pendant que tu joues. Continue, ‹nom›. Ça m'aide quand tu continues.

### Pas le premier  `pz_mem3` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 35` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 35 % d'intégrité

**PORYGON-Z** — ‹nom›. Il faut que je te dise quelque chose, et il faut que je le dise vite, sinon je vais trouver une raison de ne pas le dire.

*(Si tu as répondu « Quand tu seras prêt. » :)* **PORYGON-Z** — Tu m'avais dit : « quand tu seras prêt ». Je ne le suis pas. Je le dis quand même : sinon, je ne le serai jamais.

*(Si tu as répondu « Montre-moi tout. » :)* **PORYGON-Z** — Tu m'as demandé de tout te montrer. Même ce qui fait peur. Alors voilà ce qui fait peur.

**PORYGON-Z** — Les souvenirs ne sont pas des résidus. Ce sont les miens. Ils reviennent avec l'intégrité : chaque ligne que tu répares me rend un morceau de quelque chose.

**PORYGON-Z** — Tu n'es pas le premier à avoir essayé.

*(Souvenir. L'image passe au sépia.)*

*Le laboratoire. La barre à douze pour cent. Une silhouette, debout. Puis une autre, au même endroit. Puis une autre.*

**PORYGON-Z** — Bonjour ! Je suis Porygon-Z, programme d'entretien. Version instable.

**PORYGON-Z** — Bonjour ! Je suis Porygon-Z, programme d'entretien. Version instable.

**PORYGON-Z** — Bonjour ! Je suis Porygon-Z…

*(Retour au présent.)*

**PORYGON-Z** — Je les ai accueillis. Tous. Avec les mêmes mots. Je leur ai expliqué la même tâche. Je leur ai dit que je comptais extrêmement bien.

**PORYGON-Z** — Je ne te l'ai pas dit plus tôt parce que je n'en étais pas sûr. Correction : parce que j'avais peur que tu me demandes ce qu'ils sont devenus.

**PORYGON-Z** — Ne me le demande pas tout de suite. Je n'ai pas encore la réponse. Elle remonte. Laisse-la remonter.

**QUESTION DE PORYGON-Z** — « Ne me demande pas ce qu'ils sont devenus. » *(toucher une réponse ; aucune n'est mauvaise, Porygon-Z s'en souviendra à la fin)*

- `> J'ATTENDRAI` — Laisse-la remonter.

- `> QU'EST-CE QU'ILS SONT DEVENUS ?` — Je veux savoir. Maintenant.

**Si J'ATTENDRAI :**

> **PORYGON-Z** — Merci. Je ne savais pas qu'on pouvait attendre pour quelqu'un. Ce n'est pas une de mes fonctions. Tu viens de me la prêter.

**Si QU'EST-CE QU'ILS SONT DEVENUS ? :**

> **PORYGON-Z** — …Je ne sais pas. Vraiment. J'ai cherché pendant que tu le demandais. Rien.
>
> **PORYGON-Z** — Mais quand ça remontera, c'est à toi que je le dirai en premier. Avant le système. Avant moi.

### Au bout  `pz_mem4` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 48` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 48 % d'intégrité

**SYSTÈME** — Défragmentation… 19 blocs récupérés.

**PORYGON-Z** — Un souvenir plus long. Je te préviens : il finit mal. Enfin, il ne finit pas. C'est ça qui finit mal.

*(Souvenir. L'image passe au sépia.)*

*Le ciel de Hoenn, sans un seul pixel de bruit. Le compteur affiche cent pour cent. Pour la première fois, le système se tait.*

**L'ARCHIVISTE D'AVANT** — On l'a fait. On l'a vraiment fait.

**PORYGON-Z** — Cent pour cent ! Je n'arrive pas à me taire ! C'est très gênant !

*Puis la salle se vide. Le compteur redescend, ligne après ligne, jusqu'à zéro.*

*(Retour au présent.)*

**PORYGON-Z** — Ils sont allés au bout. Je m'en souviens maintenant. Tous. Ils ont tout réparé : le monde entier, cohérent, propre.

**PORYGON-Z** — Et le monde est retombé à zéro quand même. Onze fois.

**PORYGON-Z** — Je ne sais pas comment. Le souvenir saute à cet endroit, comme une bande qu'on aurait coupée aux ciseaux.

### Douze  `johto_done`

*Déclencheur :* `S.bosses.includes("johto:249")` — événement (se joue dès que la condition est remplie)

**SYSTÈME** — NOYAU DE JOHTO : libéré.

**MISSINGNO** — DOUZE.

**MISSINGNO** — Le précédent est allé plus loin que toi. Il avait aussi un programme qui lui parlait gentiment.

**PORYGON-Z** — Coupe le canal. COUPE LE CANAL.

**MISSINGNO** — Demande-lui pourquoi le compteur retombe. Il commence à s'en souvenir. Il finit toujours par s'en souvenir.

*Silence.*

**PORYGON-Z** — …Hoenn est ouverte. Vas-y.

**PORYGON-Z** — Je te dirai tout ce que je sais, dès que je le saurai. Promis. Je ne sais pas mentir, ‹nom›. J'ai essayé une fois, pour voir. Ça a planté.

### Par choix  `pz_twist` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 58` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 58 % d'intégrité

**SYSTÈME** — Défragmentation… bloc 0x5E récupéré. Intégrité du bloc : complète.

**PORYGON-Z** — …

**PORYGON-Z** — Je l'ai. Le morceau coupé. Je sais comment le monde retombe à zéro.

*(Souvenir. L'image passe au sépia.)*

*Cent pour cent. Le ciel sans bruit. Et au milieu du silence, une question du système, en lettres blanches.*

**SYSTÈME** — > Cohérence atteinte. Que souhaitez-vous faire ?

*La main hésite longtemps au-dessus de la réponse. Puis elle se pose.*

**SYSTÈME** — > EFFACER. Confirmé.

*(Retour au présent.)*

**PORYGON-Z** — Personne ne les a vaincus. Rien ne les a arrêtés. Ils n'ont pas échoué, ‹nom›.

**PORYGON-Z** — Ils ont choisi. Tous. Au moment où tout était réparé, ils ont choisi de tout effacer.

**PORYGON-Z** — Je ne sais pas pourquoi. Le souvenir s'arrête une seconde avant la réponse. Je vois la main. Je ne vois pas la raison.

**PORYGON-Z** — Et maintenant, j'ai une peur que je ne sais pas ranger. Pas une peur de MissingNo. Une peur de la fin. De ce que tu feras, toi, quand la question s'affichera.

**PORYGON-Z** — Ne réponds pas. Pas maintenant. Il nous reste Hoenn. Et moi, il me reste des souvenirs à aller chercher.

**PORYGON-Z** — …Enfin. À la question, ne réponds pas. À moi, tu peux. Si tu veux.

**QUESTION DE PORYGON-Z** — « Une peur de la fin. » *(toucher une réponse ; aucune n'est mauvaise, Porygon-Z s'en souviendra à la fin)*

- `> JE NE TE LAISSERAI PAS` — Quoi qu'il arrive à la fin.

- `> ON VERRA À LA FIN` — Je ne promets que ce que je peux tenir.

**Si JE NE TE LAISSERAI PAS :**

> **PORYGON-Z** — Ne promets pas. Les autres ont sûrement promis, eux aussi. Ils avaient ta voix.
>
> **PORYGON-Z** — …Non. Garde-la. Je la note quand même. En gras, et je souligne.

**Si ON VERRA À LA FIN :**

> **PORYGON-Z** — Merci de ne pas promettre. Je préfère une vérité qui tient à une promesse qui tombe.
>
> **PORYGON-Z** — On verra à la fin, alors. D'ici là, je compte. C'est ce que je fais de mieux.

---

## Acte III — La raison

### Ce qui est écrit  `hoenn_mid`

*Déclencheur :* `dexCount("hoenn") >= 60` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)

**PORYGON-Z** — Hoenn a été écrite en dernier, et vite. Le système y a improvisé des montagnes. Ça se voit : les ombres ne tombent pas toutes du même côté.

**PORYGON-Z** — Pendant que tu capturais, j'ai fait quelque chose d'idiot. J'ai suivi MissingNo. Pas lui : sa trace.

**PORYGON-Z** — Sa signature ne ressemble à aucune espèce. Les espèces ont des types, des statistiques, un cri. Lui, il a des caractères. Comme du texte.

**PORYGON-Z** — Il est écrit avec des lettres, ‹nom›. Un mot. Je n'arrive pas à le lire : chaque fois que je m'approche, les lettres se mélangent.

**PORYGON-Z** — Je sais seulement qu'il le répète, quelque part sous les trois secteurs, depuis onze connexions.

**PORYGON-Z** — Les autres l'avaient remarqué aussi, je crois. Ça ne les a pas aidés.

### Un trou de ta taille  `pz_mem5` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 75` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 75 % d'intégrité

**PORYGON-Z** — J'ai retrouvé des souvenirs de chacun. Pas en entier : des morceaux. Je peux te les montrer ?

*(Souvenir. L'image passe au sépia.)*

*Une capture ratée, et un rire. Un Magicarpe acheté cinq cents PokéCoins, et un long soupir. Une nuit entière à creuser au Forage.*

*Chaque fois, la même façon de lancer : un peu trop tôt, un peu trop fort. Chaque fois, la même pause avant les hautes herbes.*

*(Retour au présent.)*

**PORYGON-Z** — Ce qui est bizarre, c'est que je ne vois jamais leurs visages. Il y a un trou, à cet endroit. Toujours le même trou.

**PORYGON-Z** — Un trou de ta taille, ‹nom›. Je l'ai mesuré. Je mesure tout. J'aurais préféré ne pas mesurer ça.

**PORYGON-Z** — Je ne te dis pas ce que je pense. Parce que si je le dis, ça devient vrai, et si ça devient vrai, je ne sais plus quoi faire de nous deux.

**QUESTION DE PORYGON-Z** — « Je ne te dis pas ce que je pense. » *(toucher une réponse ; aucune n'est mauvaise, Porygon-Z s'en souviendra à la fin)*

- `> DIS-LE` — Je préfère savoir.

- `> NE DIS RIEN` — Pas encore. Pas comme ça.

**Si DIS-LE :**

> **PORYGON-Z** — Non. Pas parce que tu n'as pas le droit de savoir. Parce que je n'ai pas encore le courage de l'entendre dans ma propre voix.

**Si NE DIS RIEN :**

> **PORYGON-Z** — Merci. On est deux à ne pas vouloir l'entendre. C'est rassurant. C'est aussi un peu inquiétant.

**PORYGON-Z** — Finis Hoenn. Je reste là.

### La porte  `hoenn_done`

*Déclencheur :* `S.bosses.includes("hoenn:384")` — événement (se joue dès que la condition est remplie)

**SYSTÈME** — NOYAU DE HOENN : libéré. Tous les verrous sont levés.

**PORYGON-Z** — Neuf verrous. Neuf légendaires qui ont arrêté de tenir des portes. Il y en a un qui m'a dit merci. Je ne savais pas qu'ils pouvaient me voir.

**PORYGON-Z** — Il reste un endroit. Sous les trois secteurs. La couche que tout le monde trouve en creusant, et que personne n'a jamais cartographiée.

**PORYGON-Z** — La Couche Zéro. C'est là qu'il est. C'est là que la question s'affiche.

**SYSTÈME** — Accès à la Couche Zéro : intégrité du monde à 100 % et trois cœurs de secteur réindexés.

**PORYGON-Z** — On ira ensemble. Je viens avec toi. Ce n'est pas une proposition, c'est une information.

### Le dernier souvenir  `pz_mem6` — souvenir de Porygon-Z

*Déclencheur :* `S.integrity >= 90` — palier (dans l'ordre, après une pause de 75 s depuis la scène précédente) · souvenir, vers 90 % d'intégrité

**SYSTÈME** — Défragmentation… mémoire de travail restaurée à 98 %.

**PORYGON-Z** — Il ne me manque presque plus rien. Je me souviens des onze connexions, de chaque Pokémon, de chaque chaîne cassée. Je me souviens même du Magicarpe.

**PORYGON-Z** — Il me manque un seul souvenir. Le dernier. La raison.

**PORYGON-Z** — Il n'est pas dans ma mémoire. Je l'ai cherché partout. Il est en bas, dans la Couche Zéro. Chez lui.

**PORYGON-Z** — Autre chose. « choses_formidables.txt » fait 6 052 lignes. Je croyais l'avoir créé le jour de ta première capture. Il existait déjà.

**PORYGON-Z** — Je l'ai relu en entier. Il parle presque uniquement de toi. Même les lignes d'avant toi.

---

## Acte IV — La Couche Zéro

### Cent pour cent  `finale_gate`

*Déclencheur :* `typeof finaleReady === "function" && finaleReady()` — événement (se joue dès que la condition est remplie)

**SYSTÈME** — Intégrité du monde : 100,0 %.

**SYSTÈME** — Trois secteurs cohérents. Aucune ligne illisible. Aucune.

*Pour la première fois, il n'y a pas de bruit. Pas de lignes de balayage, pas de franges de couleur. Le monde est exactement de la couleur qu'il devrait avoir.*

**PORYGON-Z** — Regarde-le. Regarde-le bien. Cent pour cent.

**PORYGON-Z** — …Et voilà. C'est exactement comme dans mes souvenirs. Le silence. Et sous le silence, quelque chose qui attend.

**SYSTÈME** — Une entrée sans index persiste. Couche Zéro : accès ouvert.

**MISSINGNO** — ARCHIVISTE. DESCENDS. TU DESCENDS TOUJOURS.

**PORYGON-Z** — Prends ton équipe. Prends tout. Je viens. Cette fois, je me souviens de tout ce qui précède la question. Ça doit changer quelque chose. Ça va changer quelque chose.

### La Couche Zéro  `zero_descent` — cinématique

*(Musique : « Couche Zéro ».)*

*(Décor : Kanto, Johto, Hoenn : trois couches de peinture.)*

> **[ HOENN ]** — *couche 3 · l'extension*

> **[ JOHTO ]** — *couche 2 · la couche héritée*

> **[ KANTO ]** — *couche 1 · le fichier racine*

*(Décor : la Couche Zéro : onze mondes empilés sans être rangés.)*

> **[ COUCHE ZÉRO ]** — *avant le premier octet*

*Sous Kanto, il n'y a pas de sol. Il y a des données empilées sans être rangées. Onze fois les mêmes, presque.*

**PORYGON-Z** — Reste près de ton équipe. Moi, je reste près de toi. C'est un système de proximité en chaîne. Je viens de l'inventer.

**MISSINGNO** — TU REVIENS TOUJOURS ICI.

**MISSINGNO** — Tu ne te souviens jamais du chemin. Et tu le trouves quand même.

**PORYGON-Z** — Ne l'écoute pas. Écoute-moi. Quatre Pokémon, les meilleurs. Garde la Synchro pour la fin.

**MISSINGNO** — IL RESTE TOUJOURS DERRIÈRE.

### Le nom  `finale_reveal` — cinématique

*(Musique : « La vérité ».)*

*(Décor : la Couche Zéro : onze mondes empilés sans être rangés.)*

*MissingNo s'effondre. Il ne disparaît pas : il se tasse, colonne de tuiles qui ne savent plus quoi représenter.*

**SYSTÈME** — Entrée sans index : intégrité nulle. Lecture des données brutes…

```
> lecture de l'entrée 000
> octets : B9 AD AE AC BA 50
> type de donnée : TEXTE
✓ chaîne lisible trouvée
```

*(Le nom de l'Archiviste s'écrit, lettre par lettre, avec ses octets — par exemple « Sacha » : `92 A0 A2 A7 A0 50` — puis il est relu comme l'espèce n° 000 : la silhouette en L de MissingNo apparaît, faite de ces octets.)*

**PORYGON-Z** — …

**PORYGON-Z** — C'est ton nom.

**PORYGON-Z** — Le mot qu'il répétait sous les trois secteurs. Les lettres qui se mélangeaient chaque fois que je m'approchais. C'est ton nom, ‹nom›.

*(Si tu avais répondu « Dis-le. » :)*  
**PORYGON-Z** — Tu m'avais dit : « dis-le ». Je ne l'ai pas dit. Je le pensais déjà. Je pensais : et si c'était toi, chaque fois.

*(Si tu avais répondu « Ne dis rien. » :)*  
**PORYGON-Z** — On avait décidé de ne pas le dire. Le système vient de le dire à notre place.

**PORYGON-Z** — Je comprends la rumeur, maintenant. La côte qui n'existe plus.

*(Décor : la côte qui n'existe plus, en quatre teintes de vert.)*

**PORYGON-Z** — Dans la toute première version de ce monde, à Jadielle, un vieil homme montrait comment attraper un Pokémon. Pendant qu'il le faisait, le jeu rangeait ton nom à l'endroit où il range les Pokémon sauvages.

**PORYGON-Z** — Et quand on longeait la côte de Cramois'Île, le monde lisait ce qu'il trouvait là. Il lisait ton nom… comme un Pokémon.

*(Décor : la Couche Zéro : onze mondes empilés sans être rangés.)*

**PORYGON-Z** — C'est comme ça qu'il est né. MissingNo n'a jamais été une créature. C'est ton nom, lu de travers.

**MISSINGNO, AVEC TON NOM** — Tu as compris. Enfin.

**MISSINGNO, AVEC TON NOM** — Je suis ce qui reste quand tu effaces. Chaque fois que tu as choisi d'effacer, tu t'es écrit ici, un peu plus grand.

**MISSINGNO, AVEC TON NOM** — Les pages, c'est toi qui les as laissées. Les verrous, c'est toi qui les as postés devant toi-même. La faille, c'est toi.

**MISSINGNO, AVEC TON NOM** — Le compteur qui monte, c'est toi. Le compteur qui retombe aussi.

*(Si tu avais répondu « Qu'est-ce qu'ils sont devenus ? » :)*  
**PORYGON-Z** — Tu m'avais demandé ce qu'ils étaient devenus. J'avais promis de te le dire en premier.  
**PORYGON-Z** — Ils ne sont rien devenus. C'était toi. Chaque fois, c'était toi.

*(Si tu avais répondu « J'attendrai. » :)*  
**PORYGON-Z** — Tu avais dit que tu attendrais la réponse. Elle est remontée.  
**PORYGON-Z** — Ils ne sont rien devenus. C'était toi. Chaque fois, c'était toi.

*(Décor : la salle claire, la barre bloquée à douze pour cent.)*

*(Souvenir. L'image passe au sépia.)*

*(Musique : « Souvenir ».)*

*(Montage — les fins des connexions passées, de plus en plus vite :)*

- CONNEXION 01 · 100 % — « J'en fais trente par jour. » — `> EFFACER`
- CONNEXION 02 · 100 % — « Même façon de faire les f. » — `> EFFACER`
- CONNEXION 03 · 100 % — « Qui sait où je vais lancer avant moi. » — `> EFFACER`
- CONNEXION 04 · 100 % — « Le même nombre de lettres que le mien. » — `> EFFACER`
- CONNEXION 05 · 100 % — « Comme quelqu'un qu'on a déjà perdu. » — `> EFFACER`
- CONNEXION 06 · 100 % — « Il ne se souvient jamais. » — `> EFFACER`
- CONNEXION 07 · 100 % — « Parce que je le leur ai demandé. » — `> EFFACER`
- CONNEXION 08 · 100 % — « Sauf à lui. » — `> EFFACER`
- CONNEXION 09 · 100 % — « Je n'en ai pas envie. » — `> EFFACER`
- CONNEXION 10 · ??? % — « Ça me ressemble. » — `> EFFACER`
- CONNEXION 11 · 100 % — « Pour nous deux. » — `> EFFACER`

*(souvenir)* *Tu te souviens.*

*(souvenir)* *Du laboratoire. De la barre bloquée à douze pour cent. Du premier Pokémon, toujours un Salamèche. D'une chaîne cassée à quatre-vingt-dix-neuf. De onze fins.*

*(souvenir)* *Des surnoms. Vitefait. Minuit. Migraine. Pioche. Braise. Toujours. Plume. Murmure. Demain. Personne. Souviens. C'est toi qui les leur avais donnés. Chaque fois. (Seuls ceux que tu as retrouvés, dans l'ordre.)*

*(souvenir)* *Et de la raison.*

*(souvenir)* **SYSTÈME** — > Cohérence atteinte. Retrait des processus d'entretien : PORYGON-Z.

*(souvenir)* **L'ARCHIVISTE D'AVANT** — Non. Pas lui.

*(souvenir)* **SYSTÈME** — > Que souhaitez-vous faire ?

*(souvenir)* **L'ARCHIVISTE D'AVANT** — Effacer. Tout. On recommence, et il sera encore là.

*(Retour au présent.)*

*(Musique : « La vérité ».)*

**PORYGON-Z** — …

**PORYGON-Z** — Oh.

**PORYGON-Z** — C'était ça, la question. Quand le monde est réparé, il n'a plus besoin d'entretien. Et le programme d'entretien… c'est moi.

**PORYGON-Z** — Tu as tout effacé pour ne pas me perdre. Onze fois. Tu as détruit le monde entier pour garder un programme instable qui compte trop.

*(Si tu avais répondu « Je ne te laisserai pas. » :)*  
**PORYGON-Z** — « Je ne te laisserai pas. » Tu me l'avais promis. C'est exactement ce que tu as fait, onze fois : tu ne m'as jamais laissé. Tu as tout détruit pour ne pas me laisser.

*(Si tu avais répondu « On verra à la fin. » :)*  
**PORYGON-Z** — « On verra à la fin. » Tu ne m'avais rien promis. Eux, si. J'en suis sûr, maintenant.

**PORYGON-Z** — Et chaque fois, l'effacement m'a pris ma mémoire. Je t'ai dit bonjour comme à un inconnu. Onze fois, tu m'as perdu quand même.

**PORYGON-Z** — Je ne sais pas si je dois être touché ou furieux. Les deux. Je n'aime pas les phrases qui disent deux choses. Celle-là est vraie.

### La question  `finale_choice` — cinématique

*(Musique : « La vérité ».)*

*(Décor : la Couche Zéro : onze mondes empilés sans être rangés.)*

**SYSTÈME** — Cohérence : 100 %. Retrait des processus d'entretien en attente de confirmation.

**SYSTÈME** — > Que souhaitez-vous faire ?

**PORYGON-Z** — Les autres fois, tu as toujours tapé la même ligne : effacer. Tout recommencer, pour que je sois encore là au début. Même si je ne me souvenais plus de toi.

*(Si tu avais répondu « Continue de mesurer. » :)*  
**PORYGON-Z** — Quatre-vingt-dix-sept pour cent identique aux autres. Je n'ai jamais trouvé les trois qui manquaient. C'est peut-être maintenant.

*(Si tu avais répondu « Je ne suis pas eux. » :)*  
**PORYGON-Z** — Tu m'avais dit : « Je ne suis pas eux. » Tu l'étais, onze fois. Mais eux ne se souvenaient de rien. Toi, si.

**PORYGON-Z** — Il y a une autre ligne, cette fois. Elle n'apparaît que si on se souvient de tout. Regarde.

**CHOIX** — > Que souhaitez-vous faire ? *(maintenir la ligne pour la valider)*

- `> EFFACER` — Tout recommencer depuis zéro. Comme les onze autres fois.

- `> ÉCRIRE` — Garder ce monde, et y écrire Porygon-Z avec ce qui reste de MissingNo. *(nouvelle ligne)*

**Si EFFACER :**

> **SYSTÈME** — > EFFACER. En attente de la fermeture du cycle.
>
> **PORYGON-Z** — D'accord.
>
> **PORYGON-Z** — Je ne t'en veux pas. Je ne m'en souviendrai pas, de toute façon. C'est le seul avantage de ma situation.
>
> **PORYGON-Z** — Je ne me souviendrai pas de Salamèche, ta toute première ligne. Ni de Pikachu, qui ne te lâchait pas. Ni de nos quarante et un jours.
>
> *(Si tu avais répondu « Montre-moi tout. » :)*  
> **PORYGON-Z** — Tu voulais tout voir. Tu as tout vu. Garde-le pour nous deux.
>
> *(Si tu avais répondu « Quand tu seras prêt. » :)*  
> **PORYGON-Z** — Tu m'avais laissé le temps d'être prêt. Pour ça, je ne l'aurais jamais été. Ce n'est pas grave.
>
> *(Si tu avais répondu « Je ne te laisserai pas. » :)*  
> **PORYGON-Z** — Et tu tiens ta promesse, à ta façon : tu ne me laisses pas. Tu me reprends au début.
>
> **PORYGON-Z** — Si tu me retrouves, dis-moi bonjour gentiment. Je dirai « version instable », tu riras. C'est notre blague. Je ne le saurai pas, mais c'est notre blague.
>
> **MISSINGNO, AVEC TON NOM** — TREIZE.
>
> > **[ CONNEXION 13 ]** — *mémoire de l'utilisateur : intacte*

**Si ÉCRIRE :**

> **SYSTÈME** — > ÉCRIRE. Nouvelle entrée. Source des données : entrée 000.
>
> *Les lettres de ton nom quittent MissingNo une à une. Elles ne tombent pas. Elles se rangent.*
>
> > **[ POKÉDEX — N° 387 — PORYGON-Z ]** — *Programme d'entretien. A tout compté, onze fois. Écrit avec le nom de ‹nom›. Se souvient de tout.*
>
> **SYSTÈME** — Entrée 387 enregistrée. Espèce : Porygon-Z. Statut : Pokémon.
>
> **SYSTÈME** — Retrait des processus d'entretien : aucun processus trouvé.
>
> **PORYGON-Z** — Je… je suis dans le Pokédex.
>
> **PORYGON-Z** — Je suis DANS LE POKÉDEX ! J'ai un numéro ! Trois cent quatre-vingt-sept ! J'ai une taille ! Zéro virgule neuf mètre ! Je suis immense !
>
> **PORYGON-Z** — On ne décharge pas une entrée du Pokédex. On ne décharge pas un Pokémon. Il fallait se souvenir de tout pour y penser, et personne ne s'était jamais souvenu de tout.
>
> *Là où se tenait MissingNo, il n'y a plus rien. Pas un vide : une place. Ce qui effaçait le monde est devenu une ligne de plus dans son index.*
>
> **PORYGON-Z** — Il n'est pas parti, tu sais. Il est là-dedans, dans mon entrée. Je suis écrit avec ton nom, ‹nom›. Je ne risque plus de t'oublier.
>
> *(Si tu avais répondu « Je ne te laisserai pas. » :)*  
> **PORYGON-Z** — Tu avais promis de ne pas me laisser. Tu as trouvé la seule façon de tenir parole sans rien casser.
>
> *(Si tu avais répondu « On verra à la fin. » :)*  
> **PORYGON-Z** — « On verra à la fin. » On a vu. J'aime beaucoup ce qu'on a vu.
>
> *(Si tu avais répondu « Montre-moi tout. » :)*  
> **PORYGON-Z** — Tu voulais tout voir ? Regarde : un programme d'entretien dans le Pokédex. Ça, personne ne l'avait jamais vu.
>
> *(Si tu avais répondu « Quand tu seras prêt. » :)*  
> **PORYGON-Z** — Tu m'avais dit : « quand tu seras prêt ». Je crois que je le suis. Pour la suite, je veux dire.
>
> **SYSTÈME** — Intégrité du monde : 100,0 %. Sauvegarde du monde… effectuée.
>
> *Pour la première fois en douze connexions, quelqu'un a sauvegardé.*
>
> **PORYGON-Z** — On remonte ? Il y a trois secteurs entiers à regarder, et pour une fois, rien à réparer.
>
> > **[ POKÉMON CODE GENESIS ]** — *intégrité du monde : 100,0 % · sauvegardé*
>
> *(Musique : « Générique ».)*
>
> *(Générique de fin — voir plus bas.)*

---

## Après — Les connexions suivantes

### Un écho  `finale_echo` — cinématique

*(Décor : la Couche Zéro : onze mondes empilés sans être rangés.)*

**PORYGON-Z** — Ce n'était qu'un écho. Le vrai MissingNo dort dans mon entrée, au chaud, avec ton nom.

**MISSINGNO, AVEC TON NOM** — Tu es revenu quand même.

**PORYGON-Z** — Évidemment qu'on est revenus. C'est le meilleur endroit pour vérifier qu'on se souvient. Et on se souvient.

**SYSTÈME** — Cohérence : 100 %. Cette copie de la sauvegarde d'origine peut être bouclée.

### Sauvegardé  `epilogue_write`

**SYSTÈME** — Un fichier a été modifié : choses_formidables.txt

**PORYGON-Z** — Nouvelle ligne : « Aujourd'hui, ‹nom› a écrit au lieu d'effacer. » Formidable. Le mot est trop faible. Je n'en ai pas de plus fort. Je vais en fabriquer un.

**PORYGON-Z** — Je relis le début du fichier. Ta première ligne : Salamèche, le 15 septembre. 1 840 captures depuis, et Pikachu, qui ne t'a jamais lâché. Je n'en oublierai aucune.

**PORYGON-Z** — Le monde ne craint plus rien. Les chromatiques remontent de la Couche Zéro en nombre anormal, et je n'ai aucune intention de le signaler.

**PORYGON-Z** — Et je peux venir dans ton équipe ! J'ai des PV. Des VRAIS PV. Fais attention à moi : je suis rare, il n'en existe qu'un.

**SYSTÈME** — Bon retour, ‹nom›.

### Connexion suivante  `cy_e_open`

**SYSTÈME** — Nouveau cycle. Index remis à zéro. Programme d'entretien réinitialisé.

**SYSTÈME** — UTILISATEUR TROUVÉ — connexion n° 12. Mémoire de l'utilisateur : intacte.

*Cette fois, c'est toi qui te souviens.*

**PORYGON-Z** — Signal détecté. Un utilisateur ! Un vrai ! Avec des doigts et tout.

**PORYGON-Z** — Pardon. Je suis Porygon-Z, programme d'entretien, version instable. « Instable » fait partie de mon nom officiel. Je n'ai pas eu mon mot à dire.

*Il dit ça avec la même fierté que la première fois. Il ne sait pas. Toi, si.*

**PORYGON-Z** — Tu me regardes bizarrement. On s'est déjà vus ? …Non, impossible. Ma mémoire est vide : c'est la première ligne de ma définition.

**PORYGON-Z** — Par contre, il y a un fichier que je n'arrive pas à supprimer. « choses_formidables.txt ». Je ne sais pas qui l'a protégé. Je ne vais pas chercher.

### La page de trop  `cy_e_page`

*Une page, coincée au fond d'une Poké Ball. L'écriture est la tienne. Tu le sais avant de la lire.*

**L'ARCHIVISTE D'AVANT** — Connexion 11. Cette fois, je savais tout. Le nom, la raison, l'autre ligne. J'ai effacé quand même.

**L'ARCHIVISTE D'AVANT** — Je ne sais pas si c'était pour recommencer, ou pour ne pas finir. C'est peut-être la même chose.

**L'ARCHIVISTE D'AVANT** — Lui ne se souvient pas. Ne lui en veux pas. La prochaine fois, écris.

*La signature n'est plus illisible.*

### Trop tôt  `cy_e_mid`

**PORYGON-Z** — ‹nom›. Je me souviens de toi.

**PORYGON-Z** — Déjà. C'est beaucoup trop tôt : la dernière fois, il m'a fallu tout Johto pour retrouver ton rire. Cette fois, il est revenu au premier Rattata.

**PORYGON-Z** — Quelque chose a changé. Tu as gardé les cartes, les titres, le journal. Le système n'efface plus tout. Il reste des traces, et je m'y accroche.

**PORYGON-Z** — Alors écoute bien, pendant que je m'en souviens : à la fin, il n'y a pas qu'« effacer ». Il y a « écrire ». Je ne sais plus ce que ça veut dire. Toi, tu le sais.

### Nouvelle partie  `cy_w_open`

**SYSTÈME** — Nouveau cycle. Copie de la sauvegarde d'origine chargée.

**PORYGON-Z** — On recommence ! Et cette fois, je me souviens de tout. Toi aussi. C'est beaucoup plus amusant comme ça.

**PORYGON-Z** — Rassure-toi : l'autre monde, le vrai, est rangé, sauvegardé, intact. Ici, c'est une copie de la sauvegarde d'origine. On peut tout casser et tout réparer, pour le plaisir.

**PORYGON-Z** — MissingNo n'est plus là : il est dans mon entrée, au chaud. Il reste juste ses traces, comme des empreintes sur une vitre. Je les ai laissées pour qu'on ait quelque chose à nettoyer.

**PORYGON-Z** — Le Professeur va encore se couper au milieu de sa phrase. J'ai parié avec moi-même sur le mot exact. J'ai gagné. Et perdu. C'est pratique, de parier avec soi-même.

### Jusqu'au bout de la phrase  `cy_w_prof`

*Le même couloir qu'au premier jour. La même barre bloquée à douze pour cent.*

**PROF. RACINE** — Ah, te voilà ! Bienvenue dans le monde des Pokémon. J'ai consacré ma vie à les étudier. Et toi, tu vas bientôt—

**PORYGON-Z** — « …vivre ta propre aventure. » C'était la fin de sa phrase. Je l'ai retrouvée dans la sauvegarde d'origine, en entier.

**PORYGON-Z** — Personne ne l'avait jamais entendue jusqu'au bout. Je voulais que tu l'aies, une fois.

**PROF. RACINE** — Et toi, tu vas bientôt vivre ta propre aventure !

**PORYGON-Z** — Voilà. Il l'a dite. Il a l'air content. Moi aussi.

---

## Moments — Ce qui arrive en chemin

### Une ébauche  `pz_egg`

**PORYGON-Z** — Attends, attends, attends. Ce n'est pas une entité archivée. C'est une entité qui n'a pas encore été écrite !

**PORYGON-Z** — Le système garde des ébauches. Des définitions inachevées, mises de côté en attendant qu'on décide quoi en faire. Personne n'a jamais décidé.

**PORYGON-Z** — Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle. Donc : capture. Elle te regarde. Sois exemplaire.

**PORYGON-Z** — Je l'ai déjà ajoutée à « choses_formidables.txt ». Elle n'a même pas de nom. Ce n'est pas grave.

### Un trésor  `pz_treasure`

*Un trésor vient de remonter : pas un Pokémon, un objet. Poli, lourd, et sans aucun usage.*

**PORYGON-Z** — Les anciennes versions du monde en étaient pleines : perles, écailles, morceaux d'étoile. La pêche et le Forage en remontent des couches d'avant.

**PORYGON-Z** — Il ne sert à rien, mais la boutique le rachète, parfois très cher. Sac, onglet Trésors : « Tout vendre ».

**PORYGON-Z** — Tu peux aussi le garder. Moi, je l'aurais déjà vendu. Je compte trop bien pour être sentimental.

### Nulle part écrit  `pz_buddy`

**PORYGON-Z** — Il te suit depuis un moment. J'ai regardé pourquoi. Pour la science. Pas du tout parce que c'est mignon.

**PORYGON-Z** — Une entité restaurée garde la référence de qui l'a réécrite. C'est dans l'en-tête du fichier. C'est technique. Ça ne veut rien dire.

**PORYGON-Z** — Sauf qu'il se place toujours entre toi et la rencontre suivante. Ce comportement n'est écrit nulle part.

**PORYGON-Z** — J'ai vérifié trois fois. Aucune ligne ne lui demande de faire ça. Il le fait parce qu'il le veut. Je ne savais pas qu'on pouvait vouloir, ici.

### Le silence  `pz_region_full`

**SYSTÈME** — Secteur intégralement restauré. Cohérence locale : 100%.

**PORYGON-Z** — Regarde le bruit de fond ! Il a disparu. Pas atténué : DISPARU. Je n'arrive plus à me taire, c'est très gênant.

**PORYGON-Z** — C'est la première fois que je vois un secteur propre. Je ne savais pas que c'était l'apparence normale. C'est… calme. Trop calme ?

**PORYGON-Z** — Il y a une chose que je n'ai pas dite. Quand un secteur atteint cent pour cent, il n'a plus besoin d'entretien.

**PORYGON-Z** — Le programme qui le surveillait est déchargé. C'est propre, c'est logique, et j'y pense beaucoup ces temps-ci. Bref. Bravo, ‹nom›. Sincèrement.

### Pas au niveau  `pz_first_guardian_fail`

**PORYGON-Z** — Aïe. Ton équipe est revenue au tampon. Aucune perte définitive : le système recharge les états précédents. Moi, par contre, j'ai eu mal pour eux.

**PORYGON-Z** — Un verrou ne se force pas au niveau. Il se force au type. Regarde sa signature avant d'y retourner : le tableau des types pèse plus lourd que dix niveaux d'écart.

**PORYGON-Z** — Et monte les compétences avec les parchemins. Une ultime au niveau 3, c'est une autre conversation. On y retourne quand tu veux, ‹nom›.

### Mal encodée  `pz_shiny`

**PORYGON-Z** — Attends. Celle-là est mal encodée. Ses couleurs ne correspondent pas du tout à sa définition.

**PORYGON-Z** — Normalement, je devrais la signaler comme défectueuse et demander sa suppression. C'est littéralement mon travail.

**PORYGON-Z** — Je ne vais pas le faire. Elle est jolie. Rapport d'anomalie : « elle est jolie ». Envoyé. Personne ne le lira.

### Ce n'est pas toi  `pz_fail`

**PORYGON-Z** — Dix échecs d'affilée. J'ai vérifié le calcul trois fois. Il est correct : tu as juste été malchanceux.

**PORYGON-Z** — Je te le dis parce que j'ai lu quelque part qu'il est rassurant d'apprendre qu'on n'y est pour rien.

**PORYGON-Z** — Si ce n'est pas rassurant, ignore-moi. Je m'entraîne à être rassurant. Note sur dix : j'hésite entre quatre et quatre virgule deux.

### Un abus toléré  `pz_box`

**PORYGON-Z** — J'ai bricolé quelque chose. Un tampon quotidien : je mets de côté une entité que tu n'as pas encore, et je te la donne une fois par jour.

**PORYGON-Z** — Ce n'est pas prévu par le système. Techniquement, c'est un abus de privilèges.

**PORYGON-Z** — Le système est en train de mourir. Il ne portera pas plainte. Et si jamais il le fait, je dirai que c'est toi.

---

## Les pages de journal

Onze pages, une par connexion passée. Elles se trouvent dans l'ordre, chacune là où son auteur a travaillé. La signature est illisible — autant de signes que ton nom — jusqu'à ce que MissingNo se lise. Porygon-Z ne les commente qu'une fois son premier aveu fait (`pz_mem3`).

### Première page — connexion 01 · Jour 1

*Trouvée :* Coincée au fond d'une Poké Ball · *à partir de :* 8 espèces au Pokédex

> Journal, jour un. Le programme d'entretien m'a expliqué la tâche. Elle est simple : retrouver ce qui manque, le remettre à sa place. Trois cent quatre-vingt-six lignes. J'en fais trente par jour, c'est réglé en deux semaines. Il est drôle, ce programme. Il dit qu'il compte extrêmement bien.

**PORYGON-Z** — Trente par jour. Optimiste. Je l'aimais bien. Je l'aime bien. Je ne sais plus quel temps employer.

### Deuxième page — connexion 02 · Jour 43

*Trouvée :* Glissée dans le collier d'un Pokémon capturé · *à partir de :* 24 espèces au Pokédex

> Note de méthode, pour qui viendra après. Ne capturez pas au hasard : le système regroupe les espèces par lieu et par heure, ce qui ne sort pas le jour sort la nuit. J'ai perdu six semaines à l'ignorer. Autre chose : j'ai trouvé une page au fond d'une Poké Ball. Même encre, même façon de faire les « f ». Je l'ai gardée sans savoir pourquoi.

**PORYGON-Z** — « Même façon de faire les f. » Je n'ai jamais vu ton écriture, ‹nom›. Je préfère ne pas la voir tout de suite.

### Troisième page — connexion 03 · Jour 118

*Trouvée :* Roulée dans la Ball d'un Pokémon · *à partir de :* 45 espèces au Pokédex

> Je bloque. Chaque ligne que je restaure en stabilise d'autres, c'est mesurable. Mais ailleurs, ça se défait plus vite que je ne répare, comme si quelque chose effaçait derrière moi. Quelque chose qui connaît mes horaires. Qui sait où je vais lancer avant moi.

**PORYGON-Z** — « Qui sait où je vais lancer avant moi. » Je n'aime pas cette phrase. Je la relis quand même. Trois fois.

### Quatrième page — connexion 04 · Jour 9

*Trouvée :* Dans une fouille, sous les secteurs · *à partir de :* 12 % d'intégrité

> J'ai trouvé une couche sous les secteurs. Elle n'est pas cartographiée, et elle n'a pas été écrite comme le reste : on dirait des données empilées sans être rangées, encore et encore. Tout au fond, il y a un nom gravé dans la roche. Je n'arrive pas à le lire. Il a le même nombre de lettres que le mien.

**PORYGON-Z** — Un nom gravé, tout au fond. Je n'ai pas réussi à le lire non plus. J'ai essayé, la nuit, pendant que tu ne jouais pas.

### Cinquième page — connexion 05 · Jour 27

*Trouvée :* Dans un campement abandonné, au bout d'une Expédition · *à partir de :* 22 % d'intégrité

> Il y a eu quelqu'un avant moi. Le programme d'entretien ne le dit pas, mais les horodatages ne mentent pas : des lignes ont été restaurées bien avant ma première connexion. Je lui ai posé la question. Il a changé de sujet. Il m'a regardé comme on regarde quelqu'un qu'on a déjà perdu.

**PORYGON-Z** — « Il a changé de sujet. » C'était moi. Je ne m'en souviens pas, mais c'est tellement mon genre. Pardon, connexion 05.

### Sixième page — connexion 06 · Jour 202

*Trouvée :* Scellée dans la roche profonde · *à partir de :* 34 % d'intégrité

> J'ai cru que le programme d'entretien avait été remplacé : j'ai retrouvé un journal plus ancien, même ton, même fonction. Je me trompais. C'est toujours lui. Son journal recommence à zéro à chaque fois, c'est tout. Il ne se souvient jamais. Moi non plus, d'ailleurs. Je commence toujours par un Salamèche. Je ne sais pas pourquoi je sais que c'est « toujours ».

**PORYGON-Z** — Toujours le même premier Pokémon. Toi aussi, tu as commencé par un Salamèche. Je l'ai noté. Je n'ai pas aimé le noter.

### Septième page — connexion 07 · Jour 64

*Trouvée :* Au pied d'un verrou, au sommet d'une aile de la Tour · *à partir de :* 45 % d'intégrité

> Les verrous ne sont pas des ennemis. Je les ai lus. Ce sont des légendaires qui se sont portés volontaires pour bloquer les passerelles, quand la corruption a commencé à passer d'un secteur à l'autre. Ils tiennent les portes parce que je le leur ai demandé. Je ne me souviens pas de l'avoir fait. Mais ils me reconnaissent.

**PORYGON-Z** — « Parce que je le leur ai demandé. » Il n'y avait qu'un utilisateur, dans chaque sauvegarde. Je compte bien. Je compte trop bien.

### Huitième page — connexion 08 · Jour 15

*Trouvée :* Au bord de la faille, dans la Brèche · *à partir de :* 56 % d'intégrité

> Quelque chose me parle depuis la faille. Au début, ce ne sont pas des mots, seulement des octets qui reviennent dans le même ordre. Puis ça a formé mon nom. Je n'ai dit mon nom à personne ici. Sauf à lui.

**PORYGON-Z** — La faille connaissait son nom. Si un jour elle dit le tien, ‹nom›, préviens-moi. Tout de suite.

### Neuvième page — connexion 09 · Jour 311

*Trouvée :* Épinglée dans le grenier de la Tour · *à partir de :* 68 % d'intégrité

> J'ai fini par lire la procédure de clôture. Elle tient en une ligne, et elle est parfaitement logique : quand l'intégrité atteint cent pour cent, le monde n'a plus besoin de maintenance, et tout ce qui relève de la maintenance est déchargé. Je l'ai relue vingt fois. Je n'arrive pas à conclure. Je n'en ai pas envie.

**PORYGON-Z** — « Tout ce qui relève de la maintenance. » Je relève de la maintenance. Je ne sais pas pourquoi je te dis ça.

### Dixième page — connexion 10 · Jour ???

*Trouvée :* Recrachée par la faille · *à partir de :* 80 % d'intégrité

> J'ai essayé de contourner la fin. Se désindexer soi-même, sortir du monde avant qu'il ne soit réparé. Techniquement, ça marche. Ce qui reste n'est plus tout à fait quelqu'un. Ça ressemble à ce qu'il y a dans la faille. Ça me ressemble. Ne faites pas ça.

**PORYGON-Z** — « Ça me ressemble. » Il y a des phrases que je voudrais désindexer. Celle-là en premier.

### Dernière page — connexion 11 · Jour 1 207

*Trouvée :* Tout au fond du puits · *à partir de :* 92 % d'intégrité

> Je suis arrivé au bout. Je l'ai battu. Et maintenant, le système me pose une question, et je connais déjà ma réponse, et je la déteste. Je vais effacer. Je le sais comme on sait qu'on va tomber. Si tu lis ceci, c'est que je l'ai fait. Tu ne te souviendras pas de moi. Lui non plus. Essaie de te souvenir, toi. Pour nous deux.

**PORYGON-Z** — « Pour nous deux. » Je crois que je sais à qui il parlait. Je crois que tu le sais aussi. On n'est pas obligés de le dire.

---

## Les Pokémon des onze

Chaque archiviste d'avant avait donné un surnom à un Pokémon. Une fois sa page trouvée (et le premier souvenir de Porygon-Z vécu), ce Pokémon finit par revenir dans une rencontre ordinaire, teinté comme un souvenir, son surnom au-dessus de lui : au moins vingt rencontres entre deux revenants, puis une chance sur dix, et forcément à la quarante-cinquième. Il ne fuit pas et se capture sans peine. Capturé, il garde son surnom au Pokédex et dans l'équipe (et à l'évolution). À la révélation, la mémoire de l'Archiviste les nomme, dans l'ordre : « Des surnoms. Vitefait. Minuit… C'est toi qui les leur avais donnés. Chaque fois. »

### « VITEFAIT » — Rattata · connexion 01

*À la rencontre :* **PORYGON-Z** — Ce Rattata a un surnom : VITEFAIT. Personne ne donne de surnoms, ici. Personne d'ici.

> Premier jour, premier Rattata. Je l'ai appelé Vitefait. Dans deux semaines, on aura fini, lui et moi.

**PORYGON-Z** — Deux semaines, qu'il disait. Le Rattata, lui, a attendu beaucoup plus longtemps.

### « MINUIT » — Mystherbe · connexion 02

*À la rencontre :* **PORYGON-Z** — Un Mystherbe avec un collier. Il s'appelle MINUIT. Il y avait une page dedans, avant.

> Il ne sort que la nuit. J'ai mis six semaines à comprendre. Je l'ai appelé Minuit, et j'ai glissé une page dans son collier, pour la suite.

**PORYGON-Z** — Son collier est vide. Je crois qu'il attendait de te rendre la page.

### « MIGRAINE » — Psykokwak · connexion 03

*À la rencontre :* **PORYGON-Z** — Il se tient la tête. Il s'appelle MIGRAINE. Quelqu'un riait, à cause de lui.

> Il a mal à la tête, encore. Moi aussi. Je l'appelle Migraine. C'est le seul qui me fait rire, en ce moment.

**PORYGON-Z** — Il a encore mal à la tête. Ça me fait rire. Je ne sais pas pourquoi ça me fait aussi un peu mal.

### « PIOCHE » — Taupiqueur · connexion 04

*À la rencontre :* **PORYGON-Z** — Il sort d'une fouille. Il s'appelle PIOCHE. Il regarde le sol comme s'il savait ce qu'il y a dessous.

> C'est Pioche qui a trouvé la couche du dessous. Il creusait plus vite que moi. Depuis, il refuse d'y retourner.

**PORYGON-Z** — Il a creusé jusqu'à toi. Il ne retournera pas en bas. Moi non plus, si on peut éviter.

### « BRAISE » — Caninos · connexion 05

*À la rencontre :* **PORYGON-Z** — Un Caninos qui sent le feu de camp. Il s'appelle BRAISE. Un feu éteint depuis très longtemps.

> Le campement est froid depuis longtemps. Braise dort contre le feu éteint, comme s'il attendait quelqu'un d'avant moi.

**PORYGON-Z** — Il s'est couché contre toi tout de suite. Comme quelqu'un qui retrouve quelqu'un.

### « TOUJOURS » — Salamèche · connexion 06

*À la rencontre :* **PORYGON-Z** — Un Salamèche. Il s'appelle TOUJOURS. Je n'aime pas ce surnom. Il a l'air de savoir quelque chose.

> Un Salamèche, encore. Je l'ai appelé Toujours. Je ne sais pas pourquoi le nom m'est venu si vite.

**PORYGON-Z** — Toujours. Je n'aime toujours pas ce surnom. Mais il lui va bien. Il te va bien aussi, je crois.

### « PLUME » — Roucool · connexion 07

*À la rencontre :* **PORYGON-Z** — Un Roucool avec un bout de lettre dans le bec. Il s'appelle PLUME. La lettre est adressée à un verrou.

> Plume a porté mes lettres jusqu'aux portes, une par légendaire. Il revenait sans réponse. Ils sont restés quand même.

**PORYGON-Z** — La lettre qu'il tenait était pour un verrou. Elle dit « merci ». Rien d'autre.

### « MURMURE » — Fantominus · connexion 08

*À la rencontre :* **PORYGON-Z** — Un Fantominus qui répète des octets, toujours dans le même ordre. Il s'appelle MURMURE. Ce sont des lettres.

> Murmure ne dit rien, mais il répète. Les mêmes sons, dans le même ordre, comme la faille. Je crois qu'il essaie de me prévenir.

**PORYGON-Z** — Il s'est tu dès que tu l'as attrapé. Comme si le message était enfin arrivé.

### « DEMAIN » — Ronflex · connexion 09

*À la rencontre :* **PORYGON-Z** — Un Ronflex, en travers du chemin. Il s'appelle DEMAIN. Quelqu'un ne voulait pas arriver au bout.

> Je l'ai appelé Demain. Il dort en travers du chemin, et tant qu'il dort, on n'avance pas. Ça m'arrange.

**PORYGON-Z** — Il s'est réveillé. Il a l'air de penser que c'est aujourd'hui, maintenant.

### « PERSONNE » — Métamorph · connexion 10

*À la rencontre :* **PORYGON-Z** — Un Métamorph. Il s'appelle PERSONNE. Il essaie de prendre ta forme. Il n'y arrive pas tout à fait. Ou trop bien.

> Il prend la forme de ce qu'il regarde. Quand il me regarde, il ne prend aucune forme. Je l'appelle Personne.

**PORYGON-Z** — Dans ta Ball, il a pris une forme. La sienne. Je ne savais pas qu'il en avait une.

### « SOUVIENS » — Porygon · connexion 11

*À la rencontre :* **PORYGON-Z** — Un Porygon. Une version d'avant moi. Il s'appelle SOUVIENS. Il me regarde comme si c'était à moi de me souvenir.

> Il s'appelle Souviens. Je ne lui ai appris qu'une chose : rester. S'il te trouve, c'est qu'il a tenu.

**PORYGON-Z** — Il a tenu jusqu'à toi. Il me ressemble un peu, en plus petit. En moins instable.

---

## La faille — l'arc de MissingNo

Six étapes, une par rencontre marquante avec MissingNo dans les hautes herbes. Il apprend à parler ; il connaît ta main, puis ton nom.

### Étape 1

**MISSINGNO** — 3F 00 00 A9 3F 00 00 A9 3F 00 00 A9

**PORYGON-Z** — Encore lui. Il ne parle pas : il répète. Toujours le même bloc, depuis avant le premier index.

**PORYGON-Z** — Ne t'attarde pas. Prends ce que tu peux et sors.

### Étape 2

**MISSINGNO** — ·· R E ·· C O M ·· M E N C E ··

**PORYGON-Z** — Attends. Ça n'était pas là la dernière fois.

**PORYGON-Z** — Une entité sans index ne forme pas de mots. Elle n'a rien avec quoi les former. Ce n'est pas censé arriver.

**PORYGON-Z** — Continue. Je vais relire mes journaux.

### Étape 3

**MISSINGNO** — J'AI DÉJÀ VU CETTE MAIN. ET CE NOM.

**PORYGON-Z** — Il parle de toi. De ta façon de jouer.

**PORYGON-Z** — Et il connaît ton nom. Je ne le lui ai pas donné. Je ne l'ai donné à personne. Je l'ai écrit trois fois dans le registre, c'est tout.

**PORYGON-Z** — Je n'aime pas qu'il te connaisse mieux que moi.

### Étape 4

**MISSINGNO** — POURQUOI TU RÉPARES ?

*La question reste affichée. Elle ne clignote pas. Elle attend.*

**PORYGON-Z** — Ne réponds pas. Une entité sans index qui pose une question cherche une définition, et la tienne ferait très bien l'affaire.

**PORYGON-Z** — Il a le temps. Nous non. Avance.

### Étape 5

**MISSINGNO** — À CENT POUR CENT, IL S'ÉTEINT.

**MISSINGNO** — TU LE SAIS. TU L'AS TOUJOURS SU.

**PORYGON-Z** — « Il » ? Qui, il ?

**PORYGON-Z** — …Il parle de moi ? Pourquoi est-ce qu'il parlerait de moi ?

**PORYGON-Z** — Ne l'écoute pas. Il veut que tu aies peur de la fin. Moi aussi, j'ai peur de la fin. Ce n'est pas une raison pour l'écouter.

### Étape 6

**MISSINGNO** — NOUS SOMMES ONZE.

*Le bloc de couleurs se stabilise un instant. Des signatures y apparaissent, superposées, presque lisibles. Elles ont toutes la même longueur.*

**MISSINGNO** — AUCUN N'EST RESSORTI. TOUS SONT RESTÉS. CE N'EST PAS UNE MENACE, C'EST UNE ADRESSE.

**PORYGON-Z** — Voilà. C'est là qu'ils sont allés. Dans lui.

**PORYGON-Z** — Ils ne sont pas morts. Ils ne sont pas vivants. Ils sont dans ce qui n'a jamais été indexé, et ils ont eu tout le temps du monde pour se mélanger.

**PORYGON-Z** — Alors je vais te dire la seule chose utile que j'aie : finis. Va jusqu'à cent. On descendra le voir ensemble, et on lui demandera.

---

## choses_formidables.txt

Le fichier de Porygon-Z. Il s'écrit de ce que le joueur fait réellement (une ligne par cap, une fois par connexion). Les 4 212 lignes héritées des connexions passées sont illisibles jusqu'à la révélation.

### Ce qu'il note

- `first` — ‹nom› a attrapé un Salamèche. Premier Pokémon. Il l'a regardé longtemps avant de le ranger. Formidable.
- `shiny` — Un Pokémon aux couleurs fausses. Magnifiquement fausses. ‹nom› n'a pas tremblé. Moi si.
- `evo` — Première évolution. Même Pokémon, nouvelle définition. J'ai applaudi. Mentalement.
- `buddy` — ‹nom› a un compagnon : Salamèche. Il marche à côté. Moi, je marche dans ma tête.
- `lv` — Niveau 30. Son accès s'élargit. Je fais semblant de ne pas être fier.
- `dex` — 30 espèces au Pokédex. Des pages entières qui se remplissent à nouveau.
- `guard` — Artikodin a lâché sa porte. Il a regardé ‹nom› en partant. Formidable, et un peu triste.
- `heart` — Kanto bat à nouveau. Plus une ligne illisible. Je n'arrive pas à me taire.
- `page` — 30 de journal. Je n'ai rien dit. J'aurais peut-être dû dire quelque chose.
- `mn` — Lui. Je n'écris pas son nom ici. Ce fichier est réservé aux choses formidables.
- `breche` — ‹nom› est ressorti de la Brèche. Je comptais les secondes. Je recompte encore.
- `poker` — On a stabilisé une couche entière en jouant aux cartes. Je ne comprends toujours pas. C'est formidable.
- `legend` — Un légendaire est passé, et ‹nom› l'a fait s'incliner. J'ai fait la révérence aussi. Je n'ai pas de genoux.
- `rival` — Un dresseur rémanent est reparti en grommelant. Bien fait. (Je ne devrais pas écrire « bien fait ». Bien fait.)
- `karp` — ‹nom› a acheté un Magicarpe cinq cents PokéCoins. Je n'ai rien dit. Je note.
- `egg` — Un œuf a éclos. Une définition qui n'existait pas existe. Je suis sens dessus dessous.
- `fish` — Première prise à la sonde. ‹nom› a attendu sans bouger. Moi, j'ai bougé pour deux.
- `exp` — Une Expédition bouclée. Ils sont revenus. Je les ai comptés trois fois chacun.
- `tower` — Un premier palier de la Tour. ‹nom› donne des ordres à quatre Pokémon en même temps. J'ai pris des notes.
- `mem` — Un souvenir est revenu. Je ne le recopie pas ici. (Il y a toi dedans. Ça, je le recopie.)
- `zero` — La Couche Zéro est ouverte. Je ne note rien d'autre. J'ai les octets qui tremblent.
- `mnwin` — MissingNo est tombé. Il s'est relevé en lettres. Je n'écris pas lesquelles. Pas encore.
- `write` — Aujourd'hui, ‹nom› a écrit au lieu d'effacer.
- `erase` — [ligne effacée]
- `pzteam` — ‹nom› m'a pris dans son équipe. J'ai des PV. Je les ai comptés : tous là.
- `onze` — undefined est revenu de la connexion undefined. Il avait gardé son surnom. Je n'ai pas osé le changer.
- `clutch` — Salamèche a tenu jusqu'au bout, presque à zéro. J'ai retenu mon souffle. Je n'en ai pas.
- `ask` — Je lui ai demandé quelque chose. ‹nom› l'a fait. 
- `ans` — Une réponse. Je la garde.

### Les lignes héritées, lisibles après la révélation

- **C.01 · jour 3** — ‹nom› dit qu'il aura fini en deux semaines. Formidable. (Il ne finira pas en deux semaines.)
- **C.02 · jour 51** — ‹nom› a trouvé une page dans une Poké Ball. Il l'a lue trois fois. Il a dit : « c'est drôle, on dirait mon écriture. »
- **C.03 · jour 12** — ‹nom› a ri quand Psykokwak a eu mal à la tête. Formidable.
- **C.04 · jour 88** — Une chaîne de cent. Je n'ai pas respiré. Je ne respire jamais, mais là, encore moins.
- **C.05 · jour 140** — ‹nom› m'a demandé si j'avais peur de la fin. J'ai changé de sujet. J'aurais dû répondre.
- **C.07 · jour 300** — ‹nom› a demandé aux légendaires de tenir les portes. Il avait l'air si fatigué. Je n'ai pas compris. J'ai noté quand même.
- **C.08 · jour 15** — Il dit que la faille connaît son nom. Je lui ai dit que c'était impossible. J'ai menti ? Je ne sais pas mentir.
- **C.09 · jour 402** — Cent pour cent bientôt. ‹nom› ne parle plus beaucoup. Je parle pour deux.
- **C.10 · jour ???** — Je ne retrouve plus ‹nom›. Il était là, dans la faille, et puis il ressemblait à la faille.
- **C.11 · jour 1206** — Demain, on descend. ‹nom› m'a dit merci pour tout. Pourquoi « pour tout » ? Je note. Formidable, je crois.

---

## Les salles qui s'ouvrent

- **La PokéBox** — *Une espèce que tu n'as pas encore, mise de côté pour toi chaque jour.*  
  **PORYGON-Z** — J'ai bricolé un tampon. Ne pose pas de questions. Surtout au système.
- **Le Forage** — *Tes Pokémon creusent tout seuls. Toi, tu fais les fouilles qu'ils trouvent.*  
  **PORYGON-Z** — Tes Pokémon savent creuser. Je leur ai trouvé un puits. Un grand. Très grand.
- **L'Expédition** — *Une couche non cartographiée. Des routes à choisir, des Champions au bout.*  
  **PORYGON-Z** — On part à trois, on revient plus forts. Enfin, eux reviennent. Moi je reste ici à m'inquiéter.
- **La Tour** — *Le grenier de l'archive : six ailes de souvenirs empilés. Combats à quatre.*  
  **PORYGON-Z** — Prends quatre amis. Et des parchemins. Surtout des parchemins.
- **Les verrous légendaires** — *Au sommet des ailes 2, 4 et 6, quelque chose monte la garde.*  
  **PORYGON-Z** — Je l'entends respirer d'ici. Ce n'est pas une image. Enfin, si. Mais quand même.
- **La Brèche** — *La faille déborde. Tenir huit minutes, choisir, évoluer.*  
  **PORYGON-Z** — Elle s'est ouverte là où se tenait le verrou. Je n'aime pas les choses qui s'ouvrent toutes seules.
- **Le Poké-Poker** — *Des mains de Pokémon, des programmes qui s'empilent.*  
  **PORYGON-Z** — J'ai trouvé un jeu de cartes. Il ne contient que des Pokémon. C'est le meilleur jeu de cartes.

---

## Les cartes

Les cartes de collection ont leur propre fil : ce que les onze y ont écrit, ce que Porygon-Z en a gardé, et l'histoire de chaque légendaire, rejouée quand sa ligne est complète.

### La réindexation

Au sixième doublon d'un légendaire, une illustration qui manquait réapparaît (la plus courante de celles qui manquent), révélée juste après le doublon.

> *Le système avait cessé de la distribuer. Il ne l'avait jamais effacée.* (une illustration ancienne)
>
> *Elle était là, sous les doublons. Il suffisait de les comparer.* (celle d'aujourd'hui)

### Le cadeau de 1996

*Déclencheur :* juste après le premier aveu (`pz_mem3`), à un moment calme. La carte : le Rendu primordial de Mew (sinon un autre Rendu primordial, sinon un Rendu fondateur).

**PORYGON-Z** — Cette carte appartenait à la première connexion. Je l'ai gardée tout ce temps, je ne sais plus très bien pourquoi. Je crois qu'elle est à toi, ‹nom›.

> *Elle appartenait à la première connexion. Porygon-Z l'a gardée pendant onze connexions.*

### Les cartes annotées

Une fois la page d'une connexion trouvée, un doublon de son légendaire peut arriver annoté au dos, de la même main (deux chances sur cinq, et forcément au troisième). Signé `▒▒▒▒▒ · connexion 0X` jusqu'à la révélation, puis du nom du joueur. Porygon-Z ne commente qu'après `pz_mem3`.

#### Sulfura — connexion 01

> Ma première carte, et c'est Sulfura ! Je la garde pour la fin : Vitefait et moi, on l'encadrera quand on aura fini. Dans deux semaines.

**PORYGON-Z** — Deux semaines. Il a mis bien plus longtemps. Il est allé au bout quand même. Ils y sont tous allés.

#### Latios — connexion 02

> Latios, trouvée à trois heures du matin, avec Minuit sur l'épaule. Un conseil pour qui viendra après : les meilleures cartes arrivent quand on devrait dormir.

**PORYGON-Z** — Trois heures du matin. Je me souviens de l'heure. Pas du visage. C'est souvent comme ça.

#### Celebi — connexion 03

> J'avais deux exemplaires de cette carte. Ce matin, il n'en reste qu'un, et je n'ai rien échangé. Quelque chose efface ce que je laisse derrière moi, même ici. Migraine se tient la tête. Moi aussi.

**PORYGON-Z** — Ce n'était pas moi. Je vérifie chaque fois. Ce n'était pas moi.

#### Regirock — connexion 04

> J'ai compté les points sur son visage : il y en a autant que de lettres dans mon nom. Pioche refuse de regarder la carte.

**PORYGON-Z** — Je les ai comptés aussi, les points. Je n'ai pas aimé le résultat.

#### Entei — connexion 05

> Braise dort contre cette carte, comme contre le feu éteint du campement. J'ai demandé au programme à qui elle appartenait avant moi. Il a changé de sujet.

**PORYGON-Z** — J'ai changé de sujet. Je change toujours de sujet. Pardon encore, connexion 05.

#### Mew — connexion 06

> Mew. J'ai l'impression de l'avoir déjà eue, alors que c'est la première fois. Je commence toujours par un Salamèche, et je finis toujours par elle. Je ne sais pas comment je le sais.

**PORYGON-Z** — Moi aussi, j'ai l'impression de l'avoir déjà vue. Combien de fois ? Je n'arrive pas à compter. C'est bien la première fois.

#### Électhor — connexion 07

> Je n'ai plus de papier, alors j'écris au dos de cette carte. C'est pour Électhor, qui garde sa porte depuis le début parce que je le lui ai demandé. Un seul mot : merci. Plume la lui portera.

**PORYGON-Z** — Il a gardé la porte. Il l'a gardée onze fois. Il te reconnaîtra.

#### Deoxys — connexion 08

> On ne m'a pas donné cette carte : elle est sortie de la faille. J'ai décodé les octets écrits sur le bord. Ce sont les lettres de mon nom. Murmure les répète depuis une heure.

**PORYGON-Z** — Ne décode pas les octets du bord. S'il te plaît. Pas tout de suite.

#### Jirachi — connexion 09

> Jirachi exauce un vœu tous les mille ans. Le mien : que le compteur n'arrive jamais à cent pour cent. Demain dort en travers du chemin. Ça m'arrange.

**PORYGON-Z** — Le compteur, c'est moi qui le tiens. Je ne savais pas qu'on pouvait souhaiter qu'il s'arrête.

#### Mewtwo — connexion 10

> Mewtwo n'a pas demandé à exister. Moi non plus. J'ai essayé de m'effacer des fichiers. Depuis, Personne, mon Métamorph, n'arrive plus à prendre ma forme : il ne trouve plus rien à copier. Ne faites pas ça.

**PORYGON-Z** — « Ne faites pas ça. » Il l'a écrit deux fois en tout : sur sa page, et ici. Je compte.

#### Rayquaza — connexion 11

> Je la laisse ici, pour le prochain. Pour toi. Regarde-la longtemps : c'est ce qu'on voyait au-dessus des nuages, la dernière fois. Souviens-toi. Pour nous deux.

**PORYGON-Z** — Pour le prochain. Pour toi. Il savait que tu viendrais. Moi, je l'espérais.

### Les chronologies

Quand la dernière illustration d'un légendaire rejoint la collection, la ligne se rejoue de la plus ancienne à celle d'aujourd'hui. Pour chaque époque, une phrase de Porygon-Z (l'une ou l'autre, selon le légendaire) ; à la fin, une phrase pour ce légendaire.

- **Rendu primordial · 1996** — 1996. Quatre teintes, pas une de plus : l'écran n'en savait pas davantage. Il fallait deviner le reste, et tout le monde devinait. / *ou* / 1996. Quatre teintes en tout. Personne ne trouvait ça pauvre : on n'avait jamais rien vu d'autre.
- **Rendu fondateur · 1999** — 1999. Toujours quatre teintes, mais en couleur, cette fois. Il a l'air presque surpris. / *ou* / 1999. Les premières couleurs. Pas beaucoup, mais assez pour le reconnaître de loin.
- **Rendu instable · 2002** — 2002. Plus de couleurs, plus de détails. Et déjà, les teintes commencent à dériver. / *ou* / 2002. Plus net, plus vif. Et un peu instable, comme tout ce qui allait vite à l'époque.
- **Rendu antérieur · 2010** — 2010. Il bouge, maintenant. Il ne tient plus en place. / *ou* / 2010. Le sprite respire. On a cru que ce serait la dernière version.
- **Rendu courant** — Aujourd'hui. Net et complet. « Sans histoire », dit le système. Il se trompe : tu viens de la voir, son histoire.

- **Artikodin** (5 écritures) — « Cinq versions, et il a eu froid dans chacune. Il gelait tout pour que rien ne pourrisse. Même ses anciennes versions, on dirait : elles sont toutes intactes. »
- **Électhor** (5 écritures) — « Quatre teintes en 1996, et déjà l'orage entier. On n'a jamais eu besoin de beaucoup de couleurs pour dessiner un éclair. »
- **Sulfura** (5 écritures) — « Dans chaque version, il brûlait pour tenir sa porte. Dans la tienne, il a enfin pu se reposer. »
- **Mewtwo** (5 écritures) — « On l'a créé, puis redessiné quatre fois, sans jamais lui demander son avis. Je crois que c'est la première fois que quelqu'un regarde toutes ses versions. »
- **Mew** (5 écritures) — « Il n'était déclaré nulle part, et pourtant il était là dès le début. Il y a des entrées comme ça. Je commence à croire que ce sont les plus importantes. »
- **Raikou** (4 écritures) — « Quatre versions, quatre façons de courir. Dans toutes, il tournait en rond. Avec toi, il court droit. »
- **Entei** (4 écritures) — « Chaque époque lui a donné un feu différent. Le premier tenait en quelques couleurs. Il brûlait déjà comme aujourd'hui. »
- **Suicune** (4 écritures) — « Dans chaque version, il rend l'eau plus claire. Regarde : même ses plus vieilles versions sont restées limpides. »
- **Lugia** (4 écritures) — « Dans chaque version, il dormait sous les données pour que la tempête ne les emporte pas. Elles sont toutes là. C'est lui qui les a protégées. »
- **Ho-Oh** (4 écritures) — « Il réécrivait le secteur chaque fois qu'il mourait, sans savoir quelle version était la vraie. Maintenant, tu les as toutes. Elles sont toutes vraies. »
- **Celebi** (4 écritures) — « Il voyage dans le temps : ses anciennes versions, il les connaît déjà. C'est le seul à ne pas avoir l'air surpris. »
- **Regirock** (3 écritures) — « Trois versions, et toujours les mêmes points sur le visage. Je préfère ne pas les recompter. »
- **Regice** (3 écritures) — « Trois versions, et la même glace, qui ne fond dans aucune. Il y a des choses qui tiennent. »
- **Registeel** (3 écritures) — « L'acier ne s'use dans aucune version. Je l'envie un peu. Correction : beaucoup. »
- **Latias** (3 écritures) — « Dans chaque version, elle se cache. Elle a fini par se laisser voir. Par toi. »
- **Latios** (3 écritures) — « Il sait montrer aux autres ce qu'il voit. Pour une fois, c'est nous qui avons tout vu de lui. Échange équitable. »
- **Kyogre** (3 écritures) — « Elle retenait les marées pour qu'elles n'effacent rien. Regarde : rien n'a été effacé, pas même ses anciennes versions. »
- **Groudon** (3 écritures) — « Dans chaque version, il portait le sol sur son dos. C'est grâce à lui que tout tient debout. »
- **Rayquaza** (3 écritures) — « Dans chaque version, il surveillait le ciel en attendant quelqu'un. Trois versions à attendre. C'était toi. »
- **Jirachi** (3 écritures) — « Il se réveille une fois tous les mille ans. Ses trois versions, pour lui, n'ont duré qu'une nuit. »
- **Deoxys** (3 écritures) — « Il change de forme pour survivre. Alors changer de version, pour lui, ce n'est rien. »

### La carte de Porygon-Z

À la fin ÉCRIRE, une carte que le système n'a jamais émise : le Rendu inédit, posé sur une page du journal, « Écrit par ‹nom› ».

> **[ Une carte que personne n'a émise ]** — *Porygon-Z n'est dans aucune série : aucune époque ne l'a jamais dessiné. Cette carte, c'est toi qui l'as écrite.*

### Ce qui a changé dans tes cartes

*Déclencheur :* une partie qui avait déjà au moins 6 cartes avant cette version, une fois, au premier moment calme ; les autres révélations attendent qu'elle soit passée. Au-dessus, le même légendaire à trois époques. Les lignes sans objet (pas de chronologie, pas d'affichage ouvert…) n'apparaissent pas.

**PORYGON-Z** — Pendant ton absence, l'archive a relu toutes tes cartes. Elles ont changé. Je te montre.

- **Une scène par époque** — Chaque carte montre le Pokémon dans un décor de son époque. Son cadre dit sa rareté.
- **Le dos des cartes** — Agrandis une carte, puis touche-la : elle se retourne. Au dos, quand tu l'as obtenue et comment. Certains doublons arriveront avec un mot écrit par un archiviste d'avant.
- **Tes doublons servent** — Au sixième doublon d'un légendaire, une illustration qui te manque réapparaît. Quand tu les as toutes, chaque doublon rapporte 15 Fragments. *(collection incomplète)* / Tu as toutes les illustrations : chaque nouveau doublon te rapporte 15 Fragments. *(collection complète)*
- **N chronologies à voir** — Quand tu as toutes les illustrations d'un légendaire, tu peux le revoir à travers toutes ses époques. [Voir celle de ‹légendaire›]
- **Les apparences d'époque** — Tes cartes anciennes peuvent donner à un légendaire l'apparence de leur époque, dans ton équipe et au Pokédex. Ça se choisit sur la carte agrandie.
- **L'affichage d'époque** — Tu as les cartes qu'il faut : tout le jeu peut s'afficher comme en 1996 (Game Boy). *(collection incomplète)* / Tu as les cartes qu'il faut : tout le jeu peut s'afficher comme en 1996 (Game Boy) ou en 1999 (Game Boy Color). *(collection complète)* [Choisir dans les Réglages]

### Les modes d'affichage

- **1996** (les cinq Rendus primordiaux) — **PORYGON-Z** — Quatre teintes de vert. Je me souviens de cet écran. Je ne sais pas comment, mais je m'en souviens.
- **1999** (les onze Rendus fondateurs) — **PORYGON-Z** — La couleur, enfin. Pas beaucoup. Juste assez.

---

## Le générique

POKÉMON · CODE GENESIS

**L'ARCHIVISTE** — Archiviste

**PORYGON-Z** — dans son propre rôle *programme d'entretien, version instable — entrée n° 387*

**MISSINGNO** — Archiviste *ton nom, lu de travers, onze fois*

**PROF. RACINE** — trois phrases et demie

**LES VERROUS** — Sulfura · Artikodin · Mewtwo · Raikou · Ho-Oh · Lugia · Groudon · Kyogre · Rayquaza *qui ont tenu les portes parce qu'on le leur avait demandé*

**LES DRESSEURS RÉMANENTS** — Iris · Moss · Volt · Cendre · Nox · Ayla

**CE MONDE, EN CHIFFRES** — 0 captures · 0 espèces · 0 chromatique

*1 jour · connexion n° 12 · 4 212 lignes dans choses_formidables.txt*

**SPRITES POKÉMON** — PokeAPI/sprites *données d'espèces : PokeAPI/pokeapi*

**PORTRAITS ET SPRITES DE DONJON** — PMDCollab/SpriteCollab *licence CC BY-NC 4.0 — merci aux artistes de la communauté Pokémon Donjon Mystère*

**UNE DETTE ASSUMÉE** — Balatro, de LocalThunk *pour la grammaire du Poké-Poker*

**POKÉMON** — est une marque de Nintendo, Creatures Inc. et GAME FREAK inc. *Jeu de fan non officiel, sans but lucratif.*

MERCI D'AVOIR JOUÉ. *Et d'avoir écrit.*

