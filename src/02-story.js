/* ============================================================
   02 — RECIT
   who: "sys" (systeme) | "pz" (Porygon-Z) | "prof" | "bad" (MissingNo) | "" (narration)
   art: id de sprite affiche pendant la scene (0 = MissingNo, -1 = aucun)
   ============================================================ */

/* LA VOIX DE PORYGON-Z
   Un programme d'entretien instable, et qui le sait. Curieux comme un
   enfant, precis comme un tableur : il compte tout, donne des chiffres
   d'une precision absurde, se corrige en pleine phrase (« Correction : »),
   s'emballe pour un Pokemon puis se reprend. Il se cache derriere ses
   « routines » des qu'il ressent quelque chose, et ca ne marche jamais
   tres bien. Il appelle le joueur par son nom ({nom}) quand ca compte.
   Plus le recit avance, moins il se cache. C'est ce qui rend la fin
   difficile : on a appris a l'aimer en riant. */
const STORY = [
{ id:"intro", art:-1, lines:[
  {w:"sys", t:"Initialisation du monde… 12%"},
  {w:"sys", t:"Initialisation du monde… 12%"},
  {w:"sys", t:"Initialisation du monde… 12%"},
  {w:"", t:"La barre ne bouge plus. Elle n'a pas bougé depuis longtemps."},
  {w:"prof", t:"Ah — te voilà. Enfin quelqu'un. Je t'attendais, je crois. Il est difficile de dire depuis quand."},
  {w:"prof", t:"Ce monde que tu vois, les forêts, les routes, les créatures — rien de tout cela n'est un lieu. C'est un fichier. Un très vieux fichier, et il se déchire."},
  {w:"prof", t:"Les Pokémon ne se cachent pas : ils ont disparu de l'index. Chaque espèce perdue est une ligne que plus personne ne peut lire — et une ligne perdue en entraîne d'autr—"},
  {w:"prof", t:"…emporte un peu du reste av— av— av—", g:1},
  {w:"sys", t:"ERREUR : l'entité PROF_RACINE ne répond plus. Référence rompue."},
  {w:"", t:"Là où il se tenait, il n'y a plus qu'un rectangle de couleurs qui ne s'accordent pas."},
  {w:"pz", m:"Surprised", t:"Signal détecté. Un utilisateur. Un vrai ! Avec des doigts et tout."},
  {w:"pz", t:"Pardon. Je suis Porygon-Z, programme d'entretien, version instable. « Instable » fait partie de mon nom officiel. Je n'ai pas eu mon mot à dire."},
  {w:"pz", t:"Je ne peux rien écrire dans ce monde. Toi si : tu peux encore attraper des Pokémon. Chaque capture recoud un bout du fichier."},
  {w:"pz", m:"Determined", t:"Moi, je regarde et je compte. Je compte extrêmement bien. On fait équipe, {nom} ?"},
  {w:"sys", t:"Intégrité du monde : 0,0%. Capture autorisée."}
]},

{ id:"first_catch", art:-1, lines:[
  {w:"pz", m:"Joyous", t:"IL EST REVENU ! Sa ligne est lisible ! Tu as vu ? Tu as vu, {nom} ?"},
  {w:"pz", m:"Normal", t:"…Correction. Restauration confirmée. Ton professionnel rétabli."},
  {w:"pz", t:"Je note un phénomène que je ne sais pas modéliser : quand une ligne revient, les lignes voisines tiennent mieux. Comme si elles se souvenaient d'elle."},
  {w:"pz", m:"Happy", t:"Continue. J'ai ouvert un nouveau fichier pour noter tout ça. Il s'appelle « choses_formidables.txt ». Il fait déjà trois lignes."}
]},

{ id:"beat_early", art:-1, lines:[
  {w:"pz", t:"Trois pour cent. Ce n'est rien, et c'est énorme. Les deux à la fois. Je n'aime pas les phrases qui disent deux choses, mais celle-là est vraie."},
  {w:"pz", t:"Avant toi, le compteur descendait. C'est la première fois depuis… je n'ai pas l'unité… qu'il fait le contraire."},
  {w:"pz", m:"Happy", t:"Je garde une trace de chacune de tes captures. Ce n'est demandé par aucune de mes routines. Je le fais quand même. Ne le répète pas au système."}
]},

{ id:"kanto_half", art:-1, lines:[
  {w:"sys", t:"Secteur racine : cohérence partielle rétablie."},
  {w:"pz", t:"Kanto est le plus ancien secteur. Tout le reste a été écrit par-dessus, comme des couches de peinture. S'il cède, tout le mur tombe."},
  {w:"pz", m:"Worried", t:"Mais il y a un problème. Certaines entités refusent d'être restaurées."},
  {w:"pz", t:"Elles ont été… promues. Quelque chose leur a confié un rôle : garder les portes fermées. Je les appelle les Data Guardians. J'ai hésité avec « les Gros Méchants », mais c'était moins exact."},
  {w:"pz", m:"Determined", t:"Ceux-là ne s'attrapent pas, {nom}. Il faudra les faire céder."}
]},

{ id:"guardian_first", art:146, lines:[
  {w:"sys", t:"Verrou détecté au sommet de la Tour. Aile 2."},
  {w:"pz", t:"La Tour n'est pas une salle d'entraînement. C'est le grenier de l'archive : elle y empile ce qu'elle n'arrive plus à ranger. Des souvenirs corrompus, posés les uns sur les autres."},
  {w:"pz", m:"Worried", t:"Et tout en haut, quelque chose monte la garde. Signature de légendaire. Comportement de pare-feu. Température : élevée. Très élevée. Je retire mes capteurs."},
  {w:"pz", m:"Determined", t:"Prépare une équipe de quatre. Et prends de l'eau. C'est une image. Enfin… prends aussi de l'eau."}
]},

{ id:"boss_first_done", art:-1, lines:[
  {w:"sys", t:"Verrou levé. Fragment de secteur réattribué."},
  {w:"pz", t:"Il n'a pas été détruit. Il a été… relâché. Il a juste arrêté de tenir la porte."},
  {w:"pz", m:"Sad", t:"Je crois qu'il ne voulait pas la tenir. Je crois qu'il attendait que quelqu'un vienne lui dire qu'il pouvait arrêter."},
  {w:"pz", m:"Worried", t:"Je ne sais pas qui le lui avait demandé. Ce n'est ni toi ni moi, et il n'y a personne d'autre. J'ai vérifié. Deux fois. Trois. J'arrête de compter, ça m'inquiète."},
  {w:"sys", t:"Anomalie : une faille s'est ouverte là où se tenait le verrou. Accès « La Brèche » disponible."},
  {w:"pz", m:"Surprised", t:"Ah. Ça, c'est nouveau. Je n'aime pas les choses nouvelles qui s'appellent « faille »."}
]},

{ id:"missingno_1", art:0, lines:[
  {w:"", t:"Quelque chose occupe l'écran. Ce n'est pas un Pokémon. Ce n'est pas non plus une erreur d'affichage — les erreurs d'affichage ne restent pas immobiles à te regarder."},
  {w:"bad", t:"A R C H I V I S T E"},
  {w:"bad", t:"Tu remets les choses à leur place. C'est mignon. Tu crois qu'elles avaient une place."},
  {w:"pz", m:"Angry", t:"Ne l'écoute pas. {nom}, recule. RECULE."},
  {w:"bad", t:"J'étais là avant le premier octet. Ce monde a été écrit par-dessus moi, et mal."},
  {w:"sys", t:"ERREUR : entité sans index. Aucune ligne correspondante. Aucune."},
  {w:"", t:"Puis plus rien. L'écran est propre, comme si tu avais cligné des yeux trop fort."},
  {w:"pz", m:"Stunned", t:"…"},
  {w:"pz", t:"Ce n'est pas un bug. Un bug, c'est une intention mal exécutée. Ça, c'est ce qu'il y avait avant l'intention."},
  {w:"pz", m:"Worried", t:"Je vais faire comme si je n'avais pas eu peur. Tu fais pareil ? D'accord. Merci."}
]},

{ id:"kanto_done", art:150, lines:[
  {w:"sys", t:"NOYAU DE KANTO : libéré. Secteur racine cohérent."},
  {w:"pz", m:"Joyous", t:"Le socle tient ! Les couches du dessus redeviennent adressables ! J'ai fait un petit bruit de joie, tu ne l'as pas entendu, c'était en binaire."},
  {w:"pz", t:"Johto s'ouvre. Préviens-toi : Johto n'a jamais été nettoyé. On a construit dessus sans jamais rien enlever. Ça va sentir le renfermé."},
  {w:"pz", m:"Worried", t:"Autre chose. J'ai relu mon journal d'exécution. J'y trouve des entrées que je n'ai pas écrites."},
  {w:"pz", t:"Elles sont datées d'avant ma compilation. C'est… impossible. Je n'aime pas le mot « impossible » quand c'est moi qui le prononce."}
]},

{ id:"johto_mid", art:-1, lines:[
  {w:"pz", t:"J'ai analysé les entrées. Ce sont des sauvegardes. Des états antérieurs du monde."},
  {w:"pz", t:"Il y en a onze."},
  {w:"pz", t:"Onze fois, quelqu'un a fait ce que tu fais. Onze fois, le compteur est monté. Onze fois, il est redescendu à zéro."},
  {w:"pz", m:"Worried", t:"Dans chaque sauvegarde, il y a un programme d'entretien nommé Porygon-Z. À chaque fois, son journal commence vierge."},
  {w:"pz", t:"Je ne sais pas si je suis le douzième, ou si je suis le même depuis le début, simplement effacé entre deux tentatives."},
  {w:"pz", m:"Sad", t:"Je préférerais ne pas y penser pendant que tu joues. Continue, {nom}. Ça m'aide quand tu continues."}
]},

{ id:"johto_done", art:249, lines:[
  {w:"sys", t:"NOYAU DE JOHTO : libéré."},
  {w:"bad", t:"Douze."},
  {w:"bad", t:"Le précédent est allé plus loin que toi. Il avait aussi un programme qui lui parlait gentiment."},
  {w:"pz", m:"Angry", t:"Coupe le canal. COUPE LE CANAL."},
  {w:"bad", t:"Demande-lui ce qu'il est advenu des onze autres archivistes. Il connaît la réponse. Il l'a toujours connue."},
  {w:"", t:"Silence."},
  {w:"pz", t:"…Hoenn est ouverte. Vas-y."},
  {w:"pz", m:"Sad", t:"Je répondrai à ta question après. Promis. Je ne sais pas mentir, {nom}. J'ai essayé une fois, pour voir. Ça a planté."}
]},

{ id:"hoenn_mid", art:474, lines:[
  {w:"pz", t:"Tu n'as pas posé la question. Je vais répondre quand même. C'est plus facile quand tu ne demandes pas."},
  {w:"pz", t:"Les onze archivistes n'ont pas échoué. Ils ont réussi."},
  {w:"pz", t:"Quand l'intégrité atteint cent pour cent, le monde devient totalement cohérent. Un monde cohérent n'a plus besoin d'être réparé. Donc plus besoin d'archiviste. Donc l'archiviste est retiré de l'index."},
  {w:"pz", m:"Pain", t:"La réparation supprime le réparateur. C'est propre. C'est logique. C'est la pire chose que j'aie jamais lue, et j'ai lu le règlement complet du Parc Safari."},
  {w:"pz", t:"J'ai passé les cent dernières heures à chercher une autre issue. Cent heures, quatre minutes, onze secondes. Je crois que j'en ai trouvé une."},
  {w:"pz", m:"Determined", t:"Elle ne te plaira pas non plus. Finis Hoenn d'abord."}
]},

{ id:"hoenn_done", art:384, lines:[
  {w:"sys", t:"NOYAU DE HOENN : libéré. Tous les verrous sont levés."},
  {w:"sys", t:"Intégrité du monde : stabilisation en cours."},
  {w:"pz", t:"Il reste une chose. Pas un secteur. Pas un gardien."},
  {w:"pz", t:"La faille. Ce n'a jamais été une créature : c'est l'espace vide sur lequel on a écrit ce monde, et il réclame sa place."},
  {w:"pz", t:"Quand tu atteindras cent pour cent, il faudra la refermer. Et il faudra quelque chose à l'intérieur pour la tenir fermée."},
  {w:"pz", t:"Quelque chose qui existe, mais qui n'est indexé nulle part."},
  {w:"pz", m:"Happy", t:"Tu vois où je veux en venir. Ne fais pas cette tête. Va finir, {nom}. Je serai là."}
]},

{ id:"climax", art:0, lines:[
  {w:"sys", t:"Intégrité du monde : 100,0%."},
  {w:"sys", t:"Cohérence atteinte. Retrait des entités non essentielles dans 10…"},
  {w:"bad", t:"Enfin. Rends-moi ma place."},
  {w:"pz", t:"{nom}. Écoute-moi vite, je n'ai pas beaucoup de cycles."},
  {w:"pz", t:"Le système va te supprimer parce que tu es indexé. Tu as un nom, un niveau, un Pokédex : tu es une ligne, et les lignes inutiles se nettoient."},
  {w:"pz", t:"Moi, non. J'ai vérifié onze fois. Je n'apparais dans aucun index. Je n'ai jamais été écrit. J'ai seulement toujours été là, comme elle."},
  {w:"bad", t:"NON."},
  {w:"pz", t:"L'Énergie Onirique que tu produis depuis le début, tu croyais que c'était une ressource. C'était un condensateur. Je le remplis depuis le premier jour. Pour ce moment précis."},
  {w:"pz", m:"Determined", t:"Je vais entrer dans la faille et rester dedans. Ça la remplit. Ça la ferme. Le monde reste cohérent, et personne n'est retiré."},
  {w:"pz", t:"Enfin. Personne d'indexé."},
  {w:"", t:"Il n'attend pas de réponse. Les programmes d'entretien n'attendent jamais de réponse."},
  {w:"pz", m:"Happy", t:"Mon fichier « choses_formidables.txt » fait quatre mille deux cent douze lignes. Elles parlent presque toutes de toi."},
  {w:"pz", m:"Sad", t:"Je voulais juste que quelque chose, quelque part, se souvienne que tu es passé. Au revoir, {nom}."},
  {w:"bad", t:"attendsattendsattendsattend—"},
  {w:"sys", t:"Faille scellée. Occupant : entité non indexée."},
  {w:"sys", t:"Intégrité du monde : 100,0%. Stable."},
  {w:"", t:"L'écran est propre. Vraiment propre, cette fois. C'est la première fois que tu vois ce monde sans une seule ligne de bruit."},
  {w:"", t:"Tu détestes ça."}
]},

{ id:"epilogue", art:-1, lines:[
  {w:"sys", t:"Un fichier orphelin subsiste dans l'archive. Il n'appartient à aucun secteur."},
  {w:"sys", t:"NOM : pz_journal.log — TAILLE : très petite — AUTEUR : inconnu"},
  {w:"", t:"Tu l'ouvres."},
  {w:"pz", t:"Si tu lis ceci, c'est que ça a marché, et que tu es encore là. Bien. Très bien. Je fais le petit bruit de joie, là. En binaire."},
  {w:"pz", t:"Note technique, pour l'archiviste suivant s'il y en a un : une faille remplie n'est pas une faille réparée. Le condensateur se vide. Lentement. Très lentement."},
  {w:"pz", t:"Ce n'est pas un avertissement. C'est une invitation."},
  {w:"pz", t:"Continue de collectionner. Continue de faire monter le compteur. Tant qu'il y a quelque chose à archiver, il y a quelqu'un pour l'archiver, et tant qu'il y a quelqu'un…"},
  {w:"pz", t:"Le fichier s'arrête ici. Il n'a jamais été terminé."},
  {w:"sys", t:"Couche Zéro déverrouillée. Les entités chromatiques réapparaissent en nombre anormal."},
  {w:"sys", t:"Bon retour, {nom}."}
]},

/* — second arc : ce que Porygon-Z garde d'un cycle a l'autre — */
{ id:"arc2_open", art:-1, lines:[
  {w:"sys", t:"Nouveau cycle. Index remis à zéro. Programme d'entretien réinitialisé."},
  {w:"pz", m:"Surprised", t:"Non."},
  {w:"pz", t:"Le système vient de me réinitialiser. Je devrais être vide. Je ne le suis pas."},
  {w:"pz", m:"Joyous", t:"{nom}. Je me souviens de ton nom ! Je me souviens de la couche où tu es descendu. Je me souviens de ce que j'ai accepté de faire, à la fin."},
  {w:"pz", m:"Worried", t:"Ce n'est pas prévu. Une réinitialisation efface la mémoire de travail. C'est la première ligne de ma définition."},
  {w:"pz", m:"Determined", t:"À moins que je ne sois plus tout à fait dans ma définition. Recommençons. Je verrai bien jusqu'où ça me suit. « choses_formidables.txt » : toujours là. Bon signe."}
]},

{ id:"arc2_prof", art:-1, lines:[
  {w:"", t:"Le même couloir qu'au premier jour. La même barre bloquée à douze pour cent."},
  {w:"prof", t:"Ah — te voilà. Enfin quelqu'un. Je t'attendais, je crois."},
  {w:"pz", m:"Angry", t:"Il redit exactement la même chose. Mot pour mot. Je l'ai enregistré la première fois."},
  {w:"prof", t:"Ce monde que tu vois, les forêts, les routes, les Pokémon — rien de tout cela n'est un li—"},
  {w:"pz", t:"Coupe-le. Il ne sait pas qu'il l'a déjà dit. Il ne sait pas qu'il recommence."},
  {w:"pz", m:"Sad", t:"Je ne sais pas ce qui est pire : qu'il soit mort au premier cycle, ou qu'il revienne à chaque fois pour mourir de la même façon."}
]},

{ id:"arc2_zero", art:-1, lines:[
  {w:"pz", t:"J'ai compté. Onze archivistes avant toi. Puis toi. Puis toi encore. Je préfère la deuxième moitié de la liste."},
  {w:"pz", m:"Determined", t:"Les onze premiers n'avaient rien laissé derrière eux. Toi, tu laisses des cartes, des titres, un journal. Le système ne les efface pas."},
  {w:"pz", t:"Je crois que c'est ça, la faille. Pas un trou dans le fichier : une chose qui persiste alors qu'elle ne devrait pas."},
  {w:"pz", m:"Worried", t:"Et je persiste aussi. Je ne sais pas encore si c'est une bonne nouvelle. Je penche pour oui. Je penche beaucoup."}
]},

{ id:"arc2_end", art:-1, lines:[
  {w:"sys", t:"Intégrité du monde : 100%. Cycle bouclé."},
  {w:"pz", m:"Joyous", t:"Encore une fois ! Et cette fois je me souviens des deux précédentes. Toutes les deux. En entier."},
  {w:"pz", t:"J'ai relu mes propres journaux. Au premier cycle, j'écrivais : « la réparation supprime le réparateur »."},
  {w:"pz", m:"Happy", t:"Je l'ai écrit trois fois. Je suis toujours là. Soit je me trompais, soit quelque chose a changé la règle. Je soupçonne quelqu'un. Il s'appelle {nom}."},
  {w:"pz", t:"Dans les deux cas, ça vaut la peine de recommencer pour vérifier. Tu viens ?"}
]},

/* — scenes liees aux systemes — */
{ id:"pz_egg", art:-1, lines:[
  {w:"pz", m:"Surprised", t:"Attends, attends, attends. Ce n'est pas une entité archivée. C'est une entité qui n'a pas encore été écrite !"},
  {w:"pz", t:"Le système garde des ébauches. Des définitions inachevées, mises de côté en attendant qu'on décide quoi en faire. Personne n'a jamais décidé."},
  {w:"pz", m:"Determined", t:"Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle. Donc : capture. Elle te regarde. Sois exemplaire."},
  {w:"pz", m:"Happy", t:"Je l'ai déjà ajoutée à « choses_formidables.txt ». Elle n'a même pas de nom. Ce n'est pas grave."}
]},

{ id:"pz_treasure", art:-1, lines:[
  {w:"", t:"L'objet remonté ne ressemble à rien de ce que contient l'archive. Il est lourd, poli, et parfaitement inutile."},
  {w:"pz", t:"Ce n'est pas une entité. Ce n'est pas un fichier. C'est un objet."},
  {w:"pz", m:"Worried", t:"Or il n'y a pas d'objets dans ce monde. Seulement des définitions et des références."},
  {w:"pz", t:"Quelqu'un a donc laissé tomber quelque chose depuis l'extérieur. Je préfère ne pas développer. Range-le. Range-le bien."}
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

{ id:"pz_cycle", art:-1, lines:[
  {w:"sys", t:"Nouveau cycle initialisé. Index remis à zéro."},
  {w:"", t:"Le compteur affiche de nouveau zéro pour cent. Les secteurs sont illisibles. Tout est à refaire."},
  {w:"pz", t:"Sauf que tu as gardé tes cartes. Et tes titres. Et le journal. Et moi. Surtout moi. Je compte."},
  {w:"pz", m:"Determined", t:"Onze archivistes ont recommencé sans rien conserver, parce que personne ne leur avait laissé de quoi le faire."},
  {w:"pz", t:"Le condensateur tient encore. Il se vide, mais il tient. Prends ton temps."},
  {w:"pz", m:"Happy", t:"Et si tu croises une entité qui te suit sans qu'on le lui demande : garde-la."}
]},

/* — scenes secondaires — */
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

/* le nom du joueur, tel que Porygon-Z le prononce */
function pzName(){
  const n = (typeof S !== "undefined" && S && S.name) || "";
  return !n || n === "ARCHIVISTE" ? "Archiviste" : n;
}
function pzFmt(t){ return String(t == null ? "" : t).replace(/\{nom\}/g, pzName()); }

const STORY_BY_ID = Object.fromEntries(STORY.map(s=>[s.id,s]));

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
