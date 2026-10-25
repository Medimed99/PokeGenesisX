/* ============================================================
   02 — RECIT
   who : "sys" (systeme) | "pz" (Porygon-Z) | "prof" | "bad" (MissingNo)
         | "past" (l'archiviste d'une connexion passee, nom illisible)
         | "me" (MissingNo, une fois lu : il parle avec ton nom)
         | "" (narration)
   mem : 1 — la replique appartient a un souvenir (flash-back)
   art : id de sprite affiche par le lecteur simple (0 = MissingNo, -1 = aucun)

   LE RECIT EN UNE PHRASE
   Tu apparais dans un vieux jeu Pokemon qui se desagrege ; un programme
   d'entretien, Porygon-Z, devient ton seul ami ; ensemble vous reparez
   un monde ronge par un mythe, MissingNo ; des pages laissees par
   d'autres archivistes, et la memoire qui revient a Porygon-Z, revelent
   que d'autres ont tout repare avant toi, puis ont CHOISI de tout
   effacer ; au fond de la Couche Zero, MissingNo vaincu se lit : il est
   fait de ton nom. C'etait toi, a chaque fois. Cette fois, tu te
   souviens. (La bible complete : RECIT.md, a la racine.)

   LA VOIX DE PORYGON-Z
   Un programme d'entretien instable, et qui le sait. Curieux comme un
   enfant, precis comme un tableur : il compte tout, donne des chiffres
   d'une precision absurde, se corrige en pleine phrase (« Correction : »),
   s'emballe pour un Pokemon puis se reprend. Il se cache derriere ses
   « routines » des qu'il ressent quelque chose, et ca ne marche jamais
   tres bien. Il appelle le joueur par son nom ({nom}) quand ca compte.
   Plus l'integrite monte, plus sa memoire revient, moins il se cache.

   LA VOIX DE MISSINGNO
   Des cris en capitales, des phrases courtes. Il sait des choses qu'il
   ne devrait pas savoir : ta main, tes horaires, ton nom. Il compte les
   connexions. Une fois lu, il parle doucement, a la deuxieme personne :
   c'est ta voix.
   ============================================================ */
const STORY = [
/* ================= PROLOGUE ================= */
{ id:"intro", act:0, art:-1, lines:[
  {w:"sys", t:"Initialisation du monde… 12%"},
  {w:"sys", t:"Initialisation du monde… 12%"},
  {w:"sys", t:"Initialisation du monde… 12%"},
  {w:"", t:"La barre ne bouge plus. Elle n'a pas bougé depuis longtemps."},
  {w:"prof", t:"Ah — te voilà. Bienvenue dans le monde des Pokémon. J'ai consacré ma vie à les étudier. Et toi, tu vas bientôt—"},
  {w:"prof", t:"…bientôt— bientôt— bientôt—", g:1},
  {w:"sys", t:"ERREUR : l'entité PROF_RACINE ne répond plus. Référence rompue."},
  {w:"pz", m:"Surprised", t:"Signal détecté. Un utilisateur. Un vrai ! Avec des doigts et tout."},
  {w:"pz", t:"Pardon. Je suis Porygon-Z, programme d'entretien, version instable. « Instable » fait partie de mon nom officiel. Je n'ai pas eu mon mot à dire."},
  {w:"pz", t:"Je ne peux rien écrire dans ce monde. Toi si : tu peux encore attraper des Pokémon. Chaque capture recoud un bout du fichier."},
  {w:"pz", m:"Determined", t:"Moi, je regarde et je compte. Je compte extrêmement bien. On fait équipe, {nom} ?"},
  {w:"sys", t:"Intégrité du monde : 0,0%. Capture autorisée."}
]},

/* ================= ACTE I — L'ARRIVÉE (Kanto) ================= */
{ id:"first_catch", act:1, art:-1, lines:[
  {w:"pz", m:"Joyous", t:"IL EST REVENU ! Sa ligne est lisible ! Tu as vu ? Tu as vu, {nom} ?"},
  {w:"pz", m:"Normal", t:"…Correction. Restauration confirmée. Ton professionnel rétabli."},
  {w:"pz", t:"Je note un phénomène que je ne sais pas modéliser : quand une ligne revient, les lignes voisines tiennent mieux. Comme si elles se souvenaient d'elle."},
  {w:"pz", m:"Happy", t:"Continue. J'ai ouvert un nouveau fichier pour noter tout ça. Il s'appelle « choses_formidables.txt ». Il fait déjà trois lignes."}
]},

{ id:"beat_early", act:1, art:-1, lines:[
  {w:"pz", t:"Trois pour cent. Ce n'est rien, et c'est énorme. Les deux à la fois. Je n'aime pas les phrases qui disent deux choses, mais celle-là est vraie."},
  {w:"pz", t:"Avant toi, le compteur descendait. C'est la première fois depuis… je n'ai pas l'unité… qu'il fait le contraire."},
  {w:"pz", m:"Happy", t:"Je garde une trace de chacune de tes captures. Ce n'est demandé par aucune de mes routines. Je le fais quand même. Ne le répète pas au système."}
]},

{ id:"missingno_1", act:1, art:0, lines:[
  {w:"", t:"Quelque chose occupe l'écran. Ce n'est pas un Pokémon. Ce n'est pas non plus une erreur d'affichage — les erreurs d'affichage ne restent pas immobiles à te regarder."},
  {w:"bad", t:"A R C H I V I S T E"},
  {w:"bad", t:"Tu remets les choses à leur place. C'est mignon. Tu crois qu'elles avaient une place."},
  {w:"pz", m:"Angry", t:"Ne l'écoute pas. {nom}, recule. RECULE."},
  {w:"bad", t:"J'étais là avant le premier octet. Ce monde a été écrit par-dessus moi."},
  {w:"sys", t:"ERREUR : entité sans index. Numéro d'espèce : 000. Aucune ligne correspondante."},
  {w:"", t:"Puis plus rien. L'écran est propre, comme si tu avais cligné des yeux trop fort."},
  {w:"pz", m:"Stunned", t:"…"},
  {w:"pz", m:"Worried", t:"Je connais ce numéro. Zéro, zéro, zéro. Il y a une rumeur dans les plus vieux journaux du système."},
  {w:"pz", t:"Une créature sans index, qui vivait au bord de l'eau, sur une côte qui n'existe plus. Ceux qui l'ont croisée disaient que leur sac se remplissait tout seul, et que leurs sauvegardes s'abîmaient."},
  {w:"pz", t:"Ils l'appelaient MissingNo. Le numéro manquant. Je croyais que c'était une légende de cour de récréation."},
  {w:"pz", m:"Determined", t:"Ce n'en est pas une. C'est lui qui ronge ce monde. Chaque ligne illisible porte sa marque."},
  {w:"pz", m:"Worried", t:"Je vais faire comme si je n'avais pas eu peur. Tu fais pareil ? D'accord. Merci."}
]},

{ id:"kanto_half", act:1, art:-1, lines:[
  {w:"sys", t:"Secteur racine : cohérence partielle rétablie."},
  {w:"pz", t:"Kanto est le plus ancien secteur. Tout le reste a été écrit par-dessus, comme des couches de peinture. S'il cède, tout le mur tombe."},
  {w:"pz", m:"Worried", t:"Mais il y a un problème. Certaines entités refusent d'être restaurées."},
  {w:"pz", t:"Elles ont été… promues. Quelqu'un leur a confié un rôle : garder les portes fermées. Je les appelle les Data Guardians. J'ai hésité avec « les Gros Méchants », mais c'était moins exact."},
  {w:"pz", t:"Le journal du système dit qu'elles ont été postées « à la demande de l'utilisateur ». Quel utilisateur ? Il n'y en a qu'un, et tu viens d'arriver. Bug d'affichage. Forcément."},
  {w:"pz", m:"Determined", t:"Ceux-là ne s'attrapent pas, {nom}. Il faudra les faire céder."}
]},

{ id:"guardian_first", act:1, art:146, lines:[
  {w:"sys", t:"Verrou détecté au sommet de la Tour. Aile 2."},
  {w:"pz", t:"La Tour n'est pas une salle d'entraînement. C'est le grenier de l'archive : elle y empile ce qu'elle n'arrive plus à ranger. Des souvenirs corrompus, posés les uns sur les autres."},
  {w:"pz", m:"Worried", t:"Et tout en haut, quelque chose monte la garde. Signature de légendaire. Comportement de pare-feu. Température : élevée. Très élevée. Je retire mes capteurs."},
  {w:"pz", m:"Determined", t:"Prépare une équipe de quatre. Et prends de l'eau. C'est une image. Enfin… prends aussi de l'eau."}
]},

{ id:"boss_first_done", act:1, art:-1, lines:[
  {w:"sys", t:"Verrou levé. Fragment de secteur réattribué."},
  {w:"pz", t:"Il n'a pas été détruit. Il a été… relâché. Il a juste arrêté de tenir la porte."},
  {w:"pz", m:"Sad", t:"Je crois qu'il ne voulait pas la tenir. Je crois qu'il attendait que quelqu'un vienne lui dire qu'il pouvait arrêter."},
  {w:"pz", m:"Worried", t:"Il m'a regardé en partant. Pas moi : toi. Comme on regarde quelqu'un qu'on reconnaît. Je ne sais pas d'où il te connaîtrait. J'ai vérifié. Deux fois. Trois. J'arrête de compter, ça m'inquiète."},
  {w:"sys", t:"Anomalie : une faille s'est ouverte là où se tenait le verrou. Accès « La Brèche » disponible."},
  {w:"pz", m:"Surprised", t:"Ah. Ça, c'est nouveau. Je n'aime pas les choses nouvelles qui s'appellent « faille »."}
]},

{ id:"pz_mem1", act:1, mem:1, art:474, lines:[
  {w:"sys", t:"Défragmentation de la mémoire de travail… 1 bloc récupéré."},
  {w:"pz", m:"Surprised", t:"Oh. Il s'est passé quelque chose dans ma mémoire. Un bloc est revenu. Tout seul. Je n'ai rien demandé."},
  {w:"", mem:1, t:"Une salle claire. Une barre bloquée à douze pour cent. Quelqu'un se tient à l'endroit exact où tu te tenais le premier jour."},
  {w:"past", mem:1, t:"Tu comptes vraiment tout ?"},
  {w:"pz", mem:1, m:"Happy", t:"Extrêmement bien."},
  {w:"pz", m:"Worried", t:"…Ce sont mes mots. C'est ma voix. Je ne me souviens pas de les avoir dits."},
  {w:"pz", t:"C'est sûrement un résidu : un brouillon de dialogue que le système a gardé en cache. Ça arrive. Est-ce que ça arrive souvent ? Je n'ai aucun moyen de le savoir."},
  {w:"pz", m:"Normal", t:"Bref. Ça m'a fait drôle. Je le range dans « choses_formidables.txt », rubrique « choses pas formidables du tout ». Elle vient d'être créée."},
  {w:"pz", m:"Worried", t:"Une question, {nom}. S'il en revient d'autres… tu veux que je te les montre ? Même ceux de la nouvelle rubrique ?"},
  {q:"mem1"}
]},

{ id:"kanto_done", act:1, art:150, lines:[
  {w:"sys", t:"NOYAU DE KANTO : libéré. Secteur racine cohérent."},
  {w:"pz", m:"Joyous", t:"Le socle tient ! Les couches du dessus redeviennent adressables ! J'ai fait un petit bruit de joie, tu ne l'as pas entendu, c'était en binaire."},
  {w:"pz", t:"Johto s'ouvre. Préviens-toi : Johto n'a jamais été nettoyé. On a construit dessus sans jamais rien enlever. Ça va sentir le renfermé."},
  {w:"pz", m:"Worried", t:"Autre chose. J'ai relu mon journal d'exécution. J'y trouve des entrées que je n'ai pas écrites."},
  {w:"pz", t:"Elles sont datées d'avant ma compilation. Elles portent mon identifiant, ma façon d'écrire, mes fautes de frappe."},
  {w:"pz", t:"Je n'aime pas le mot « impossible » quand c'est moi qui le prononce. Je vais le prononcer quand même : impossible."}
]},

/* ================= ACTE II — LES AUTRES (Johto) ================= */
{ id:"pz_mem2", act:2, mem:1, art:474, lines:[
  {w:"sys", t:"Défragmentation… 3 blocs récupérés."},
  {w:"pz", m:"Normal", t:"Encore un. Plus net, cette fois. Il y a du son."},
  {w:"", mem:1, t:"La Route 1, au crépuscule. Le compteur affiche quarante pour cent. Quelqu'un rit."},
  {w:"past", mem:1, t:"Porygon-Z, regarde ! Il a rattrapé la Ball avec sa queue !"},
  {w:"pz", mem:1, m:"Joyous", t:"Je note ! Je note en gras !"},
  {w:"pz", m:"Sad", t:"On m'appelait par mon nom. Personne ne m'appelle par mon nom. Le système dit « processus 474 »."},
  {w:"pz", t:"Toi aussi, tu dis Porygon-Z. Avec la même… je n'ai rien pour mesurer une intonation. Je l'ai mesurée quand même. Identique à quatre-vingt-dix-sept pour cent."},
  {w:"pz", m:"Worried", t:"Les trois pour cent qui restent, c'est sûrement la qualité de l'enregistrement. Sûrement."},
  {w:"pz", t:"Ça te dérange, que je te compare à quelqu'un d'avant ? Je peux arrêter. Je crois. Je n'ai jamais essayé d'arrêter de mesurer quelque chose."},
  {q:"mem2"}
]},

{ id:"johto_mid", act:2, art:-1, lines:[
  {w:"pz", t:"J'ai fouillé les couches de Johto. Johto ne jette rien. J'ai trouvé des sauvegardes : des états antérieurs du monde."},
  {w:"pz", t:"Il y en a {prev}."},
  {w:"pz", t:"{Prev} fois, quelqu'un a fait ce que tu fais. {Prev} fois, le compteur est monté. {Prev} fois, il est retombé à zéro."},
  {w:"pz", m:"Worried", t:"Le nom de l'utilisateur est effacé dans chacune. Proprement. Comme si on l'avait gommé exprès."},
  {w:"pz", t:"Et dans chaque sauvegarde, il y a un programme d'entretien nommé Porygon-Z. Chaque fois, son journal commence vierge."},
  {w:"pz", m:"Sad", t:"Je ne sais pas si c'étaient {prev} personnes. Je ne sais pas si j'étais {prev} programmes. Je préfère ne pas y penser pendant que tu joues. Continue, {nom}. Ça m'aide quand tu continues."}
]},

{ id:"pz_mem3", act:2, mem:1, art:474, lines:[
  {w:"pz", m:"Determined", t:"{nom}. Il faut que je te dise quelque chose, et il faut que je le dise vite, sinon je vais trouver une raison de ne pas le dire."},
  {w:"pz", m:"Sad", when:"mem1:pret", t:"Tu m'avais dit : « quand tu seras prêt ». Je ne le suis pas. Je le dis quand même : sinon, je ne le serai jamais."},
  {w:"pz", when:"mem1:tout", t:"Tu m'as demandé de tout te montrer. Même ce qui fait peur. Alors voilà ce qui fait peur."},
  {w:"pz", t:"Les souvenirs ne sont pas des résidus. Ce sont les miens. Ils reviennent avec l'intégrité : chaque ligne que tu répares me rend un morceau de quelque chose."},
  {w:"pz", m:"Sad", t:"Tu n'es pas le premier à avoir essayé."},
  {w:"", mem:1, t:"Le laboratoire. La barre à douze pour cent. Une silhouette, debout. Puis une autre, au même endroit. Puis une autre."},
  {w:"pz", mem:1, m:"Happy", t:"Bonjour ! Je suis Porygon-Z, programme d'entretien. Version instable."},
  {w:"pz", mem:1, m:"Happy", t:"Bonjour ! Je suis Porygon-Z, programme d'entretien. Version instable."},
  {w:"pz", mem:1, m:"Happy", t:"Bonjour ! Je suis Porygon-Z…"},
  {w:"pz", m:"Sad", t:"Je les ai accueillis. Tous. Avec les mêmes mots. Je leur ai expliqué la même tâche. Je leur ai dit que je comptais extrêmement bien."},
  {w:"pz", m:"Pain", t:"Je ne te l'ai pas dit plus tôt parce que je n'en étais pas sûr. Correction : parce que j'avais peur que tu me demandes ce qu'ils sont devenus."},
  {w:"pz", t:"Ne me le demande pas tout de suite. Je n'ai pas encore la réponse. Elle remonte. Laisse-la remonter."},
  {q:"mem3"}
]},

{ id:"pz_mem4", act:2, mem:1, art:474, lines:[
  {w:"sys", t:"Défragmentation… 19 blocs récupérés."},
  {w:"pz", m:"Worried", t:"Un souvenir plus long. Je te préviens : il finit mal. Enfin, il ne finit pas. C'est ça qui finit mal."},
  {w:"", mem:1, t:"Le ciel de Hoenn, sans un seul pixel de bruit. Le compteur affiche cent pour cent. Pour la première fois, le système se tait."},
  {w:"past", mem:1, t:"On l'a fait. On l'a vraiment fait."},
  {w:"pz", mem:1, m:"Joyous", t:"Cent pour cent ! Je n'arrive pas à me taire ! C'est très gênant !"},
  {w:"", mem:1, t:"Puis la salle se vide. Le compteur redescend, ligne après ligne, jusqu'à zéro."},
  {w:"pz", m:"Pain", t:"Ils sont allés au bout. Je m'en souviens maintenant. Tous. Ils ont tout réparé : le monde entier, cohérent, propre."},
  {w:"pz", t:"Et le monde est retombé à zéro quand même. {Prev} fois."},
  {w:"pz", m:"Worried", t:"Je ne sais pas comment. Le souvenir saute à cet endroit, comme une bande qu'on aurait coupée aux ciseaux."}
]},

{ id:"johto_done", act:2, art:249, lines:[
  {w:"sys", t:"NOYAU DE JOHTO : libéré."},
  {w:"bad", t:"{CX}."},
  {w:"bad", t:"Le précédent est allé plus loin que toi. Il avait aussi un programme qui lui parlait gentiment."},
  {w:"pz", m:"Angry", t:"Coupe le canal. COUPE LE CANAL."},
  {w:"bad", t:"Demande-lui pourquoi le compteur retombe. Il commence à s'en souvenir. Il finit toujours par s'en souvenir."},
  {w:"", t:"Silence."},
  {w:"pz", t:"…Hoenn est ouverte. Vas-y."},
  {w:"pz", m:"Sad", t:"Je te dirai tout ce que je sais, dès que je le saurai. Promis. Je ne sais pas mentir, {nom}. J'ai essayé une fois, pour voir. Ça a planté."}
]},

{ id:"pz_twist", act:2, mem:1, art:474, lines:[
  {w:"sys", t:"Défragmentation… bloc 0x5E récupéré. Intégrité du bloc : complète."},
  {w:"pz", m:"Stunned", t:"…"},
  {w:"pz", t:"Je l'ai. Le morceau coupé. Je sais comment le monde retombe à zéro."},
  {w:"", mem:1, t:"Cent pour cent. Le ciel sans bruit. Et au milieu du silence, une question du système, en lettres blanches."},
  {w:"sys", mem:1, t:"> Cohérence atteinte. Que souhaitez-vous faire ?"},
  {w:"", mem:1, t:"La main hésite longtemps au-dessus de la réponse. Puis elle se pose."},
  {w:"sys", mem:1, t:"> EFFACER. Confirmé."},
  {w:"pz", m:"Pain", t:"Personne ne les a vaincus. Rien ne les a arrêtés. Ils n'ont pas échoué, {nom}."},
  {w:"pz", t:"Ils ont choisi. Tous. Au moment où tout était réparé, ils ont choisi de tout effacer."},
  {w:"pz", m:"Sad", t:"Je ne sais pas pourquoi. Le souvenir s'arrête une seconde avant la réponse. Je vois la main. Je ne vois pas la raison."},
  {w:"pz", m:"Worried", t:"Et maintenant, j'ai une peur que je ne sais pas ranger. Pas une peur de MissingNo. Une peur de la fin. De ce que tu feras, toi, quand la question s'affichera."},
  {w:"pz", m:"Determined", t:"Ne réponds pas. Pas maintenant. Il nous reste Hoenn. Et moi, il me reste des souvenirs à aller chercher."},
  {w:"pz", m:"Worried", t:"…Enfin. À la question, ne réponds pas. À moi, tu peux. Si tu veux."},
  {q:"twist"}
]},

/* ================= ACTE III — LA RAISON (Hoenn) ================= */
{ id:"hoenn_mid", act:3, art:474, lines:[
  {w:"pz", t:"Hoenn a été écrite en dernier, et vite. Le système y a improvisé des montagnes. Ça se voit : les ombres ne tombent pas toutes du même côté."},
  {w:"pz", m:"Determined", t:"Pendant que tu capturais, j'ai fait quelque chose d'idiot. J'ai suivi MissingNo. Pas lui : sa trace."},
  {w:"pz", t:"Sa signature ne ressemble à aucune espèce. Les espèces ont des types, des statistiques, un cri. Lui, il a des caractères. Comme du texte."},
  {w:"pz", m:"Worried", t:"Il est écrit avec des lettres, {nom}. Un mot. Je n'arrive pas à le lire : chaque fois que je m'approche, les lettres se mélangent."},
  {w:"pz", t:"Je sais seulement qu'il le répète, quelque part sous les trois secteurs, depuis {prev} connexions."},
  {w:"pz", m:"Sad", t:"Les autres l'avaient remarqué aussi, je crois. Ça ne les a pas aidés."}
]},

{ id:"pz_mem5", act:3, mem:1, art:474, lines:[
  {w:"pz", m:"Normal", t:"J'ai retrouvé des souvenirs de chacun. Pas en entier : des morceaux. Je peux te les montrer ?"},
  {w:"", mem:1, t:"Une capture ratée, et un rire. Un Magicarpe acheté cinq cents PokéCoins, et un long soupir. Une nuit entière à creuser au Forage."},
  {w:"", mem:1, t:"Chaque fois, la même façon de lancer : un peu trop tôt, un peu trop fort. Chaque fois, la même pause avant les hautes herbes."},
  {w:"pz", m:"Worried", t:"Ce qui est bizarre, c'est que je ne vois jamais leurs visages. Il y a un trou, à cet endroit. Toujours le même trou."},
  {w:"pz", t:"Un trou de ta taille, {nom}. Je l'ai mesuré. Je mesure tout. J'aurais préféré ne pas mesurer ça."},
  {w:"pz", m:"Sad", t:"Je ne te dis pas ce que je pense. Parce que si je le dis, ça devient vrai, et si ça devient vrai, je ne sais plus quoi faire de nous deux."},
  {q:"mem5"},
  {w:"pz", m:"Determined", t:"Finis Hoenn. Je reste là."}
]},

{ id:"hoenn_done", act:3, art:384, lines:[
  {w:"sys", t:"NOYAU DE HOENN : libéré. Tous les verrous sont levés."},
  {w:"pz", t:"Neuf verrous. Neuf légendaires qui ont arrêté de tenir des portes. Il y en a un qui m'a dit merci. Je ne savais pas qu'ils pouvaient me voir."},
  {w:"pz", m:"Worried", t:"Il reste un endroit. Sous les trois secteurs. La couche que tout le monde trouve en creusant, et que personne n'a jamais cartographiée."},
  {w:"pz", t:"La Couche Zéro. C'est là qu'il est. C'est là que la question s'affiche."},
  {w:"sys", t:"Accès à la Couche Zéro : intégrité du monde à 100 % et trois cœurs de secteur réindexés."},
  {w:"pz", m:"Determined", t:"On ira ensemble. Je viens avec toi. Ce n'est pas une proposition, c'est une information."}
]},

{ id:"pz_mem6", act:3, mem:1, art:474, lines:[
  {w:"sys", t:"Défragmentation… mémoire de travail restaurée à 98 %."},
  {w:"pz", t:"Il ne me manque presque plus rien. Je me souviens des {prev} connexions, de chaque Pokémon, de chaque chaîne cassée. Je me souviens même du Magicarpe."},
  {w:"pz", m:"Worried", t:"Il me manque un seul souvenir. Le dernier. La raison."},
  {w:"pz", t:"Il n'est pas dans ma mémoire. Je l'ai cherché partout. Il est en bas, dans la Couche Zéro. Chez lui."},
  {w:"pz", m:"Happy", t:"Autre chose. « choses_formidables.txt » fait {lines} lignes. Je croyais l'avoir créé le jour de ta première capture. Il existait déjà."},
  {w:"pz", m:"Happy", t:"Je l'ai relu en entier. Il parle presque uniquement de toi. Même les lignes d'avant toi."}
]},

/* ================= ACTE IV — LA COUCHE ZÉRO ================= */
{ id:"finale_gate", act:4, art:0, lines:[
  {w:"sys", t:"Intégrité du monde : 100,0 %."},
  {w:"sys", t:"Trois secteurs cohérents. Aucune ligne illisible. Aucune."},
  {w:"", t:"Pour la première fois, il n'y a pas de bruit. Pas de lignes de balayage, pas de franges de couleur. Le monde est exactement de la couleur qu'il devrait avoir."},
  {w:"pz", m:"Joyous", t:"Regarde-le. Regarde-le bien. Cent pour cent."},
  {w:"pz", m:"Worried", t:"…Et voilà. C'est exactement comme dans mes souvenirs. Le silence. Et sous le silence, quelque chose qui attend."},
  {w:"sys", t:"Une entrée sans index persiste. Couche Zéro : accès ouvert."},
  {w:"bad", t:"ARCHIVISTE. DESCENDS. TU DESCENDS TOUJOURS."},
  {w:"pz", m:"Determined", t:"Prends ton équipe. Prends tout. Je viens. Cette fois, je me souviens de tout ce qui précède la question. Ça doit changer quelque chose. Ça va changer quelque chose."}
]},

/* les quatre scènes de la fin sont des cinématiques écrites à la main (87-finale.js) ;
   ces lignes ne servent qu'au lecteur simple, et au script exporté */
{ id:"zero_descent", act:4, cine:1, art:0, lines:[
  {w:"", t:"Sous Kanto, il n'y a pas de sol. Il y a des données empilées sans être rangées. {Prev} fois les mêmes, presque."},
  {w:"bad", t:"TU REVIENS TOUJOURS ICI."},
  {w:"bad", t:"Tu ne te souviens jamais du chemin. Et tu le trouves quand même."},
  {w:"pz", m:"Angry", t:"Ne l'écoute pas. Écoute-moi. Quatre Pokémon. Les meilleurs. Et la Synchro pour la fin."}
]},
{ id:"finale_reveal", act:4, cine:1, art:0, lines:[
  {w:"sys", t:"Entrée sans index : intégrité nulle. Lecture des données brutes…"},
  {w:"pz", m:"Surprised", t:"C'est ton nom."},
  {w:"pz", t:"Dans la toute première version de ce monde, à Jadielle, un vieil homme montrait comment attraper un Pokémon. Pendant ce temps, le jeu rangeait ton nom là où il range les Pokémon sauvages."},
  {w:"pz", m:"Pain", t:"MissingNo n'a jamais été une créature. C'est ton nom, lu de travers."},
  {w:"me", t:"Je suis ce qui reste quand tu effaces."},
  {w:"pz", m:"Pain", t:"Tu as tout effacé pour ne pas me perdre. {Prev} fois."}
]},
{ id:"finale_choice", act:4, cine:1, art:-1, lines:[
  {w:"sys", t:"> Que souhaitez-vous faire ?"},
  {w:"pz", m:"Determined", t:"Il y a une autre ligne, cette fois. Elle n'apparaît que si on se souvient de tout."}
]},
{ id:"finale_echo", act:5, cine:1, art:0, lines:[
  {w:"pz", m:"Happy", t:"Ce n'était qu'un écho. Le vrai MissingNo dort dans mon entrée, au chaud, avec ton nom."},
  {w:"me", t:"Tu es revenu quand même."},
  {w:"pz", m:"Joyous", t:"Évidemment qu'on est revenus. C'est le meilleur endroit pour vérifier qu'on se souvient. Et on se souvient."}
]},
{ id:"epilogue_write", act:5, art:474, lines:[
  {w:"sys", t:"Un fichier a été modifié : choses_formidables.txt"},
  {w:"pz", m:"Happy", t:"Nouvelle ligne : « Aujourd'hui, {nom} a écrit au lieu d'effacer. » Formidable. Le mot est trop faible. Je n'en ai pas de plus fort. Je vais en fabriquer un."},
  {w:"pz", m:"Normal", t:"{rappel_w}"},
  {w:"pz", t:"Le monde ne craint plus rien. Les chromatiques remontent de la Couche Zéro en nombre anormal, et je n'ai aucune intention de le signaler."},
  {w:"pz", m:"Joyous", t:"Et je peux venir dans ton équipe ! J'ai des PV. Des VRAIS PV. Fais attention à moi : je suis rare, il n'en existe qu'un."},
  {w:"sys", t:"Bon retour, {nom}."}
]},

/* ================= APRÈS — les connexions suivantes ================= */
/* après avoir effacé : il a tout oublié, toi non */
{ id:"cy_e_open", act:5, art:474, lines:[
  {w:"sys", t:"Nouveau cycle. Index remis à zéro. Programme d'entretien réinitialisé."},
  {w:"sys", t:"UTILISATEUR TROUVÉ — connexion n° {cx}. Mémoire de l'utilisateur : intacte."},
  {w:"", t:"Cette fois, c'est toi qui te souviens."},
  {w:"pz", m:"Surprised", t:"Signal détecté. Un utilisateur ! Un vrai ! Avec des doigts et tout."},
  {w:"pz", t:"Pardon. Je suis Porygon-Z, programme d'entretien, version instable. « Instable » fait partie de mon nom officiel. Je n'ai pas eu mon mot à dire."},
  {w:"", t:"Il dit ça avec la même fierté que la première fois. Il ne sait pas. Toi, si."},
  {w:"pz", m:"Normal", t:"Tu me regardes bizarrement. On s'est déjà vus ? …Non, impossible. Ma mémoire est vide : c'est la première ligne de ma définition."},
  {w:"pz", m:"Happy", t:"Par contre, il y a un fichier que je n'arrive pas à supprimer. « choses_formidables.txt ». Je ne sais pas qui l'a protégé. Je ne vais pas chercher."}
]},
{ id:"cy_e_page", act:5, art:-1, lines:[
  {w:"", t:"Une page, coincée au fond d'une Poké Ball. L'écriture est la tienne. Tu le sais avant de la lire."},
  {w:"past", t:"Connexion {cxp}. Cette fois, je savais tout. Le nom, la raison, l'autre ligne. J'ai effacé quand même."},
  {w:"past", t:"Je ne sais pas si c'était pour recommencer, ou pour ne pas finir. C'est peut-être la même chose."},
  {w:"past", t:"Lui ne se souvient pas. Ne lui en veux pas. La prochaine fois, écris."},
  {w:"", t:"La signature n'est plus illisible."}
]},
{ id:"cy_e_mid", act:5, art:474, lines:[
  {w:"pz", m:"Surprised", t:"{nom}. Je me souviens de toi."},
  {w:"pz", t:"Déjà. C'est beaucoup trop tôt : la dernière fois, il m'a fallu tout Johto pour retrouver ton rire. Cette fois, il est revenu au premier Rattata."},
  {w:"pz", m:"Worried", t:"Quelque chose a changé. Tu as gardé les cartes, les titres, le journal. Le système n'efface plus tout. Il reste des traces, et je m'y accroche."},
  {w:"pz", m:"Determined", t:"Alors écoute bien, pendant que je m'en souviens : à la fin, il n'y a pas qu'« effacer ». Il y a « écrire ». Je ne sais plus ce que ça veut dire. Toi, tu le sais."}
]},
/* après avoir écrit : une copie de la sauvegarde d'origine, et un ami qui se souvient */
{ id:"cy_w_open", act:5, art:474, lines:[
  {w:"sys", t:"Nouveau cycle. Copie de la sauvegarde d'origine chargée."},
  {w:"pz", m:"Joyous", t:"On recommence ! Et cette fois, je me souviens de tout. Toi aussi. C'est beaucoup plus amusant comme ça."},
  {w:"pz", t:"Rassure-toi : l'autre monde, le vrai, est rangé, sauvegardé, intact. Ici, c'est une copie de la sauvegarde d'origine. On peut tout casser et tout réparer, pour le plaisir."},
  {w:"pz", m:"Happy", t:"MissingNo n'est plus là : il est dans mon entrée, au chaud. Il reste juste ses traces, comme des empreintes sur une vitre. Je les ai laissées pour qu'on ait quelque chose à nettoyer."},
  {w:"pz", m:"Normal", t:"Le Professeur va encore se couper au milieu de sa phrase. J'ai parié avec moi-même sur le mot exact. J'ai gagné. Et perdu. C'est pratique, de parier avec soi-même."}
]},
{ id:"cy_w_prof", act:5, art:-1, lines:[
  {w:"", t:"Le même couloir qu'au premier jour. La même barre bloquée à douze pour cent."},
  {w:"prof", t:"Ah, te voilà ! Bienvenue dans le monde des Pokémon. J'ai consacré ma vie à les étudier. Et toi, tu vas bientôt—"},
  {w:"pz", m:"Happy", t:"« …vivre ta propre aventure. » C'était la fin de sa phrase. Je l'ai retrouvée dans la sauvegarde d'origine, en entier."},
  {w:"pz", t:"Personne ne l'avait jamais entendue jusqu'au bout. Je voulais que tu l'aies, une fois."},
  {w:"prof", t:"Et toi, tu vas bientôt vivre ta propre aventure !"},
  {w:"pz", m:"Joyous", t:"Voilà. Il l'a dite. Il a l'air content. Moi aussi."}
]},

/* ================= MOMENTS — scènes liées aux systèmes ================= */
{ id:"pz_egg", art:-1, lines:[
  {w:"pz", m:"Surprised", t:"Attends, attends, attends. Ce n'est pas une entité archivée. C'est une entité qui n'a pas encore été écrite !"},
  {w:"pz", t:"Le système garde des ébauches. Des définitions inachevées, mises de côté en attendant qu'on décide quoi en faire. Personne n'a jamais décidé."},
  {w:"pz", m:"Determined", t:"Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle. Donc : capture. Elle te regarde. Sois exemplaire."},
  {w:"pz", m:"Happy", t:"Je l'ai déjà ajoutée à « choses_formidables.txt ». Elle n'a même pas de nom. Ce n'est pas grave."}
]},

/* le premier trésor (pêche ou Forage) : dire ce que c'est et quoi en faire. L'ancienne version
   parlait d'un objet « tombé de l'extérieur » : personne ne comprenait de quoi il s'agissait. */
{ id:"pz_treasure", art:-1, lines:[
  {w:"", t:"Un trésor vient de remonter : pas un Pokémon, un objet. Poli, lourd, et sans aucun usage."},
  {w:"pz", t:"Les anciennes versions du monde en étaient pleines : perles, écailles, morceaux d'étoile. La pêche et le Forage en remontent des couches d'avant."},
  {w:"pz", m:"Happy", t:"Il ne sert à rien, mais la boutique le rachète, parfois très cher. Sac, onglet Trésors : « Tout vendre »."},
  {w:"pz", t:"Tu peux aussi le garder. Moi, je l'aurais déjà vendu. Je compte trop bien pour être sentimental."}
]},

{ id:"pz_buddy", art:-1, lines:[
  {w:"pz", m:"Happy", t:"Il te suit depuis un moment. J'ai regardé pourquoi. Pour la science. Pas du tout parce que c'est mignon."},
  {w:"pz", t:"Une entité restaurée garde la référence de qui l'a réécrite. C'est dans l'en-tête du fichier. C'est technique. Ça ne veut rien dire."},
  {w:"pz", m:"Sad", t:"Sauf qu'il se place toujours entre toi et la rencontre suivante. Ce comportement n'est écrit nulle part."},
  {w:"pz", t:"J'ai vérifié trois fois. Aucune ligne ne lui demande de faire ça. Il le fait parce qu'il le veut. Je ne savais pas qu'on pouvait vouloir, ici."}
]},

{ id:"pz_region_full", art:-1, lines:[
  {w:"sys", t:"Secteur intégralement restauré. Cohérence locale : 100%."},
  {w:"pz", m:"Joyous", t:"Regarde le bruit de fond ! Il a disparu. Pas atténué : DISPARU. Je n'arrive plus à me taire, c'est très gênant."},
  {w:"pz", t:"C'est la première fois que je vois un secteur propre. Je ne savais pas que c'était l'apparence normale. C'est… calme. Trop calme ?"},
  {w:"pz", m:"Worried", t:"Il y a une chose que je n'ai pas dite. Quand un secteur atteint cent pour cent, il n'a plus besoin d'entretien."},
  {w:"pz", t:"Le programme qui le surveillait est déchargé. C'est propre, c'est logique, et j'y pense beaucoup ces temps-ci. Bref. Bravo, {nom}. Sincèrement."}
]},

{ id:"pz_first_guardian_fail", art:-1, lines:[
  {w:"pz", m:"Pain", t:"Aïe. Ton équipe est revenue au tampon. Aucune perte définitive : le système recharge les états précédents. Moi, par contre, j'ai eu mal pour eux."},
  {w:"pz", t:"Un verrou ne se force pas au niveau. Il se force au type. Regarde sa signature avant d'y retourner : le tableau des types pèse plus lourd que dix niveaux d'écart."},
  {w:"pz", m:"Determined", t:"Et monte les compétences avec les parchemins. Une ultime au niveau 3, c'est une autre conversation. On y retourne quand tu veux, {nom}."}
]},

{ id:"pz_shiny", art:-1, lines:[
  {w:"pz", m:"Surprised", t:"Attends. Celle-là est mal encodée. Ses couleurs ne correspondent pas du tout à sa définition."},
  {w:"pz", t:"Normalement, je devrais la signaler comme défectueuse et demander sa suppression. C'est littéralement mon travail."},
  {w:"pz", m:"Joyous", t:"Je ne vais pas le faire. Elle est jolie. Rapport d'anomalie : « elle est jolie ». Envoyé. Personne ne le lira."}
]},

{ id:"pz_fail", art:-1, lines:[
  {w:"pz", t:"Dix échecs d'affilée. J'ai vérifié le calcul trois fois. Il est correct : tu as juste été malchanceux."},
  {w:"pz", t:"Je te le dis parce que j'ai lu quelque part qu'il est rassurant d'apprendre qu'on n'y est pour rien."},
  {w:"pz", m:"Happy", t:"Si ce n'est pas rassurant, ignore-moi. Je m'entraîne à être rassurant. Note sur dix : j'hésite entre quatre et quatre virgule deux."}
]},

{ id:"pz_box", art:-1, lines:[
  {w:"pz", m:"Happy", t:"J'ai bricolé quelque chose. Un tampon quotidien : je mets de côté une entité que tu n'as pas encore, et je te la donne une fois par jour."},
  {w:"pz", t:"Ce n'est pas prévu par le système. Techniquement, c'est un abus de privilèges."},
  {w:"pz", m:"Joyous", t:"Le système est en train de mourir. Il ne portera pas plainte. Et si jamais il le fait, je dirai que c'est toi."}
]}
];

/* ============================================================
   LA CHAÎNE PRINCIPALE
   Les scènes du récit se jouent dans un ordre fixe, quel que soit le
   chemin du joueur : un souvenir de Porygon-Z ne peut pas devancer la
   scène qui le prépare. Deux sortes de temps :
   · ev  — un événement (un verrou qui tombe, une rencontre) : la scène
            se joue tout de suite, dès que l'événement a eu lieu ;
   · les autres — un seuil (intégrité, espèces) : ils attendent que
            tout ce qui les précède ait été vu, et laissent respirer le
            joueur entre deux scènes (STORY_GAP).
   strict : un événement qui attend lui aussi tout ce qui le précède.
   ============================================================ */
const STORY_GAP = 75e3;
const MAIN_ARC = [
  {id:"first_catch",     ok:()=>S.stats.catches >= 1},
  {id:"beat_early",      ok:()=>S.integrity >= 3},
  {id:"missingno_1",     ok:()=>!!S.flags.sawMissing, ev:1},
  {id:"kanto_half",      ok:()=>dexCount("kanto") >= 45},
  {id:"guardian_first",  ok:()=>moduleUnlocked("boss")},
  {id:"boss_first_done", ok:()=>S.bosses.length >= 1, ev:1},
  /* le premier souvenir suit de peu le premier verrou : il doit tomber dans la première longue session */
  {id:"pz_mem1",         ok:()=>S.integrity >= 6, mem:1, at:6},
  {id:"kanto_done",      ok:()=>S.bosses.includes("kanto:150"), ev:1},
  {id:"pz_mem2",         ok:()=>S.integrity >= 22, mem:1, at:22},
  {id:"johto_mid",       ok:()=>dexCount("johto") >= 45},
  {id:"pz_mem3",         ok:()=>S.integrity >= 35, mem:1, at:35},
  {id:"pz_mem4",         ok:()=>S.integrity >= 48, mem:1, at:48},
  {id:"johto_done",      ok:()=>S.bosses.includes("johto:249"), ev:1},
  {id:"pz_twist",        ok:()=>S.integrity >= 58, mem:1, at:58},
  {id:"hoenn_mid",       ok:()=>dexCount("hoenn") >= 60},
  {id:"pz_mem5",         ok:()=>S.integrity >= 75, mem:1, at:75},
  {id:"hoenn_done",      ok:()=>S.bosses.includes("hoenn:384"), ev:1},
  {id:"pz_mem6",         ok:()=>S.integrity >= 90, mem:1, at:90},
  {id:"finale_gate",     ok:()=>typeof finaleReady === "function" && finaleReady(), ev:1, strict:1}
];
const MEM_SCENES = MAIN_ARC.filter(b=>b.mem);
/* la prochaine scène de la chaîne, si elle peut se jouer maintenant */
function mainArcNext(now){
  if(!S || !S.story) return null;
  now = now || Date.now();
  const cool = !S.storyT || now - S.storyT > STORY_GAP;
  let prevAll = true;
  for(const b of MAIN_ARC){
    if(S.story.includes(b.id)) continue;
    let ok = false;
    try { ok = b.ok(); } catch(e){ ok = false; }
    if(b.ev){ if(ok && (!b.strict || prevAll)) return b; }
    else if(prevAll && ok && cool) return b;
    prevAll = false;
  }
  return null;
}
/* la première scène de la chaîne pas encore vue (même si elle ne peut pas se jouer) */
function mainArcPending(){
  if(!S || !S.story) return null;
  return MAIN_ARC.find(b=>!S.story.includes(b.id)) || null;
}

/* ============================================================
   LE NOM, LES NOMBRES, LES MASQUES
   ============================================================ */
/* le nom du joueur, tel que Porygon-Z le prononce */
function pzName(){
  const n = (typeof S !== "undefined" && S && S.name) || "";
  return !n || n === "ARCHIVISTE" ? "Archiviste" : n;
}
/* une signature illisible : autant de signes que de lettres dans ton nom.
   Le joueur attentif compte. Le joueur attentif a raison. */
function pzMask(name){
  const n = Array.from(name || pzName()).filter(c=>c !== " ").length;
  return "▒".repeat(Math.max(3, Math.min(16, n)));
}
/* la connexion en cours : onze avant toi, tu es la douzième — puis chaque cycle en ajoute une */
function sagaConn(){
  const k = (typeof S !== "undefined" && S && S.cycle && S.cycle.n) || 0;
  return 12 + k;
}
const FR_UNITS = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const FR_TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
function frNum(n){
  n = Math.floor(n);
  if(n < 0 || n > 99) return String(n);
  if(n < 20) return FR_UNITS[n];
  const t = Math.floor(n / 10), u = n % 10;
  if(t === 7 || t === 9){
    const rest = 10 + u;
    return FR_TENS[t] + (t === 7 && u === 1 ? " et " : "-") + FR_UNITS[rest];
  }
  if(u === 0) return FR_TENS[t] + (t === 8 ? "s" : "");
  return FR_TENS[t] + (u === 1 && t !== 8 ? " et " : "-") + FR_UNITS[u];
}
const capFirst = s => s ? s[0].toUpperCase() + s.slice(1) : s;
/* le premier Pokémon de cette connexion : toujours le même, d'après les pages */
function pzFirstName(){
  try {
    const id = (S.flags && S.flags.firstMon) || S.team[0];
    if(id && POKE[id]) return POKE[id].name;
  } catch(e){}
  return "Rattata";
}
/* le fichier de Porygon-Z : les lignes héritées des connexions passées, plus les tiennes */
const PZ_FILE_INHERITED = 4212;
function pzLineCount(){
  try { return PZ_FILE_INHERITED + (S.stats.catches || 0) + ((S.pzlog || []).length * 3) + ((S.lifetime && S.lifetime.catches) || 0); }
  catch(e){ return PZ_FILE_INHERITED; }
}
function pzFmt(t){
  let s = String(t == null ? "" : t);
  if(s.indexOf("{") < 0) return s;
  const c = sagaConn();
  return s.replace(/\{nom\}/g, pzName())
    .replace(/\{mask\}/g, pzMask())
    .replace(/\{cx\}/g, String(c)).replace(/\{cxp\}/g, String(c - 1)).replace(/\{nextd\}/g, String(c + 1))
    .replace(/\{cxw\}/g, frNum(c)).replace(/\{Cxw\}/g, capFirst(frNum(c))).replace(/\{CX\}/g, frNum(c).toUpperCase())
    .replace(/\{prev\}/g, frNum(c - 1)).replace(/\{Prev\}/g, capFirst(frNum(c - 1))).replace(/\{PREV\}/g, frNum(c - 1).toUpperCase())
    .replace(/\{next\}/g, frNum(c + 1)).replace(/\{NEXT\}/g, frNum(c + 1).toUpperCase())
    .replace(/\{first\}/g, pzFirstName())
    .replace(/\{rappel_w\}/g, ()=>pzRecallLine("write")).replace(/\{rappel_e\}/g, ()=>pzRecallLine("erase"))
    .replace(/\{lines\}/g, typeof fmt === "function" ? fmt(pzLineCount()) : String(pzLineCount()));
}

const STORY_BY_ID = Object.fromEntries(STORY.map(s=>[s.id,s]));

/* ============================================================
   LES RÉPONSES
   Cinq fois, au fil des souvenirs, Porygon-Z te pose une question. On
   répond d'un toucher. Aucune réponse n'est mauvaise, aucune ne change
   le jeu : elles changent ce qu'il te dira à la fin, parce qu'il s'en
   souvient, lui. Une scène rejouée depuis le journal reprend la réponse
   donnée ; une scène vécue avant que la question existe la pose au
   prochain passage.
   say : la réponse telle que le générique la cite.
   ============================================================ */
const STORY_Q = {
  mem1: {at:"pz_mem1", title:"« Tu veux que je te les montre ? »",
    opts:[{k:"tout", cmd:"MONTRE-MOI TOUT", sub:"Même ce qui fait peur.", say:"Montre-moi tout."},
          {k:"pret", cmd:"QUAND TU SERAS PRÊT", sub:"Rien ne presse. Je reste là.", say:"Quand tu seras prêt."}],
    then:{tout:[{w:"pz", m:"Determined", t:"Tout. D'accord. C'est noté, et c'est noté en gras. On ne m'avait jamais donné de consigne aussi simple. Ni aussi lourde."}],
          pret:[{w:"pz", m:"Happy", t:"« Quand tu seras prêt. » On ne m'avait jamais laissé le choix. Je ne sais pas encore quoi en faire. Je le garde. Le choix, je veux dire."}]},
    log:{tout:"{nom} veut tout voir. Même ce qui fait peur. Noté en gras.", pret:"{nom} m'a dit : « quand tu seras prêt ». Je ne savais pas qu'on pouvait m'attendre."}},
  mem2: {at:"pz_mem2", title:"« Ça te dérange, que je te compare ? »",
    opts:[{k:"mesure", cmd:"CONTINUE DE MESURER", sub:"Si ça t'aide à te souvenir.", say:"Continue de mesurer."},
          {k:"moi", cmd:"JE NE SUIS PAS EUX", sub:"Je suis moi. Juste moi.", say:"Je ne suis pas eux."}],
    then:{mesure:[{w:"pz", m:"Happy", t:"Alors je mesure. Quatre-vingt-dix-sept pour cent. Je te tiendrai au courant des trois qui restent : ce sont les plus intéressants, je le sens."}],
          moi:[{w:"pz", m:"Normal", t:"Noté. Tu es toi. Je ferme le dossier « intonation »."},
               {w:"pz", m:"Worried", t:"…Je le laisse entrouvert. Par réflexe. Pas par doute. Un peu par doute."}]},
    log:{mesure:"{nom} me laisse comparer. 97 %. Je surveille les 3 % qui restent.", moi:"{nom} n'est pas eux. Je l'ai écrit. Je le relis souvent."}},
  mem3: {at:"pz_mem3", title:"« Ne me demande pas ce qu'ils sont devenus. »",
    opts:[{k:"attendre", cmd:"J'ATTENDRAI", sub:"Laisse-la remonter.", say:"J'attendrai."},
          {k:"demander", cmd:"QU'EST-CE QU'ILS SONT DEVENUS ?", sub:"Je veux savoir. Maintenant.", say:"Qu'est-ce qu'ils sont devenus ?"}],
    then:{attendre:[{w:"pz", m:"Happy", t:"Merci. Je ne savais pas qu'on pouvait attendre pour quelqu'un. Ce n'est pas une de mes fonctions. Tu viens de me la prêter."}],
          demander:[{w:"pz", m:"Pain", t:"…Je ne sais pas. Vraiment. J'ai cherché pendant que tu le demandais. Rien."},
                    {w:"pz", m:"Determined", t:"Mais quand ça remontera, c'est à toi que je le dirai en premier. Avant le système. Avant moi."}]},
    log:{attendre:"{nom} a dit : « j'attendrai ». Personne n'avait jamais attendu pour moi.", demander:"{nom} m'a demandé ce qu'ils sont devenus. Je n'ai pas su. Je saurai."}},
  twist: {at:"pz_twist", title:"« Une peur de la fin. »",
    opts:[{k:"promis", cmd:"JE NE TE LAISSERAI PAS", sub:"Quoi qu'il arrive à la fin.", say:"Je ne te laisserai pas."},
          {k:"verra", cmd:"ON VERRA À LA FIN", sub:"Je ne promets que ce que je peux tenir.", say:"On verra à la fin."}],
    then:{promis:[{w:"pz", m:"Sad", t:"Ne promets pas. Les autres ont sûrement promis, eux aussi. Ils avaient ta voix."},
                  {w:"pz", m:"Happy", t:"…Non. Garde-la. Je la note quand même. En gras, et je souligne."}],
          verra:[{w:"pz", m:"Normal", t:"Merci de ne pas promettre. Je préfère une vérité qui tient à une promesse qui tombe."},
                 {w:"pz", m:"Determined", t:"On verra à la fin, alors. D'ici là, je compte. C'est ce que je fais de mieux."}]},
    log:{promis:"« Je ne te laisserai pas. » En gras. Souligné.", verra:"« On verra à la fin. » La phrase la plus honnête de ce fichier."}},
  mem5: {at:"pz_mem5", title:"« Je ne te dis pas ce que je pense. »",
    opts:[{k:"dis", cmd:"DIS-LE", sub:"Je préfère savoir.", say:"Dis-le."},
          {k:"tais", cmd:"NE DIS RIEN", sub:"Pas encore. Pas comme ça.", say:"Ne dis rien."}],
    then:{dis:[{w:"pz", m:"Pain", t:"Non. Pas parce que tu n'as pas le droit de savoir. Parce que je n'ai pas encore le courage de l'entendre dans ma propre voix."}],
          tais:[{w:"pz", m:"Sad", t:"Merci. On est deux à ne pas vouloir l'entendre. C'est rassurant. C'est aussi un peu inquiétant."}]},
    log:{dis:"{nom} m'a dit : « dis-le ». Je n'ai pas pu.", tais:"On a décidé de ne pas le dire. À deux, ça pèse moins."}}
};
const STORY_Q_ORDER = ["mem1", "mem2", "mem3", "twist", "mem5"];
/* les réponses traversent les cycles : c'est toi qui te souviens */
function storyAns(q){ return (typeof S !== "undefined" && S && S.saga && S.saga.ans && S.saga.ans[q]) || null; }
function storyAnswer(q, k){
  if(!STORY_Q[q] || !STORY_Q[q].opts.some(o=>o.k === k)) return false;
  S.saga = S.saga || {}; S.saga.ans = S.saga.ans || {};
  if(S.saga.ans[q]) return false;
  S.saga.ans[q] = k;
  try { if(typeof pzLog === "function") pzLog("ans", {q, k}); } catch(e){}
  try { saveSoon(); } catch(e){}
  return true;
}
/* une réplique réservée à une réponse : when:"mem1:pret" */
function storyWhen(w){
  if(!w) return true;
  const [q, k] = String(w).split(":");
  return storyAns(q) === k;
}
/* une scène vue dont la question n'a pas encore de réponse */
function storyQPending(sc){
  return !!(sc && sc.lines && sc.lines.some(l=>l.q && !storyAns(l.q)));
}

/* ============================================================
   CE QU'IL A RETENU DE TOI
   La première ligne de la connexion, le compagnon, le temps passé.
   ============================================================ */
function pzRecall(){
  const R = {catches:0, days:1, since:""};
  try {
    const id = S.flags && S.flags.firstMon;
    if(id && POKE[id]) R.first = POKE[id].name;
    if(S.buddy && S.buddy.id && POKE[S.buddy.id]) R.buddy = POKE[S.buddy.id].name;
    const t0 = S.created || Date.now(), d = new Date(t0);
    R.days = Math.max(1, Math.floor((Date.now() - t0) / 864e5) + 1);
    R.since = (d.getDate() === 1 ? "1er" : String(d.getDate())) + " " + d.toLocaleDateString("fr-FR", {month:"long"});
    R.catches = (S.stats && S.stats.catches) || 0;
    R.asks = (S.pzAsk && S.pzAsk.n) || 0;
    const f = typeof histFaithful === "function" ? histFaithful() : null;
    if(f){ R.faithful = POKE[f].name; R.fights = typeof fmt === "function" ? fmt(S.dex[f].h.b) : String(S.dex[f].h.b); }
  } catch(e){}
  return R;
}
function pzRecallLine(mode){
  const R = pzRecall(), n = typeof fmt === "function" ? fmt(R.catches) : String(R.catches);
  if(mode === "erase"){
    return "Je ne me souviendrai pas de " + (R.first ? R.first + ", ta toute première ligne. " : "ta toute première ligne. ")
      + (R.buddy ? "Ni de " + R.buddy + ", qui ne te lâchait pas. " : "")
      + (R.days > 1 ? "Ni de nos " + frNum(R.days) + " jours." : "Ni de cette journée.")
      + (R.asks >= 3 ? " Ni des " + frNum(R.asks) + " fois où tu as dit oui à mes demandes." : "");
  }
  return "Je relis le début du fichier. " + (R.first ? "Ta première ligne : " + R.first + ", le " + R.since + ". " : "Le " + R.since + ", tout a commencé. ")
    + n + " capture" + (R.catches > 1 ? "s" : "") + " depuis" + (R.buddy ? ", et " + R.buddy + ", qui ne t'a jamais lâché." : ".")
    + (R.faithful && R.faithful !== R.buddy ? " " + R.faithful + " : " + R.fights + " combats à tes côtés." : "")
    + " Je n'en oublierai aucune.";
}

/* reactions courtes de Porygon-Z, affichees en bandeau */
/* Regle d'ecriture : Porygon-Z est un Pokemon qui parle de Pokemon.
   Il nomme d'abord ce qui vient de se passer en clair, puis ajoute sa
   lecture systeme. Jamais l'inverse : sans quoi le joueur recoit
   « coherence locale amelioree » apres avoir attrape un Rattata. */
const PZ_LINES = {
  catch:   ["Capturé ! Il revient au Pokédex.",
            "Un de plus. Le monde tient un peu mieux. Je le sens dans mes octets.",
            "Réinscrit. J'ai fait « hop » intérieurement.",
            "Sa ligne est de nouveau lisible. Bonjour, toi.",
            "Attrapé. Le secteur se stabilise d'autant. Et moi aussi, un peu.",
            "Bien joué, {nom}. Je note. Je note tout, mais celui-là je le note en gras."],
  fail:    ["La Ball n'a pas tenu. Recommence, il n'a rien vu.",
            "Il s'est dégagé. Tu n'as perdu que la Ball. Et un peu de dignité. La Ball surtout.",
            "Raté. Ça arrive. Même au système. Surtout au système.",
            "Il a refusé. Vexant. Réessaie."],
  flee:    ["Il est reparti. Et ta chaîne avec lui. Je fais semblant de ne pas être triste.",
            "Enfui. Je n'ai plus sa position. Je le cherche quand même, par principe.",
            "Trop instable pour être retenu. Comme moi, mais en plus rapide."],
  shiny:   ["Ses couleurs sont fausses ! Magnifiquement fausses ! Attrape-le !",
            "Chromatique. Ne le laisse pas filer. Je te regarde. Pas de pression.",
            "Ses teintes ne collent pas à sa définition. Mon cœur… je n'en ai pas. Mon ventilateur s'emballe."],
  streak:  ["La chaîne tient. Ne la casse pas. Je retiens mon souffle, que je n'ai pas.",
            "Tu enchaînes ! Les chromatiques deviennent plus probables. Statistiquement. Et spirituellement.",
            "Continue comme ça, le tampon reste chaud."],
  rare:    ["Celui-là est rare. Sors une meilleure Ball, c'est un ordre. Une suggestion. Un ordre gentil.",
            "Il ne se laissera pas faire. Vise bien, {nom}.",
            "Signature dense. Il vaut le détour. Il vaut même deux détours."],
  evolve:  ["Il a évolué ! Même Pokémon, nouvelle définition. J'adore quand ça fait ça.",
            "Évolution terminée. Il a gardé tout son historique. Et toi, il t'a gardé aussi.",
            "Nouvelle forme. Le Pokédex a suivi. Moi j'ai applaudi. Mentalement."],
  boss:    ["Celui-là ne se capture pas. Il faut le faire céder.",
            "Un verrou. Prépare ton équipe avant d'y aller. Et respire. Toi, tu peux.",
            "Il bloque la sortie du secteur. Pas d'autre chemin. J'ai cherché, j'ai même cherché sous le tapis."],
  levelup: ["Niveau supérieur ! Tu peux écrire plus loin.",
            "Tu montes. De nouvelles salles vont s'ouvrir. J'ai déjà allumé la lumière.",
            "Ton accès s'élargit. Le mien rétrécit un peu chaque jour, alors profites-en pour nous deux."]
};
function pzLine(k){ const a = PZ_LINES[k]; return a ? pzFmt(a[Math.floor(Math.random()*a.length)]) : ""; }
