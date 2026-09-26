/* ============================================================
   02 — RECIT
   who: "sys" (systeme) | "pz" (Porygon-Z) | "prof" | "bad" (MissingNo) | "" (narration)
   art: id de sprite affiche pendant la scene (0 = MissingNo, -1 = aucun)
   ============================================================ */

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
  {w:"pz", m:"Surprised", t:"Signal détecté. Un utilisateur. Un seul."},
  {w:"pz", t:"Je suis un Pokémon d'entretien. Porygon-Z. Ma version est instable, et je le sais."},
  {w:"pz", t:"Je ne peux rien écrire dans ce monde. Toi si — tu peux encore attraper des Pokémon. C'est la seule chose qui répare quoi que ce soit ici."},
  {w:"pz", t:"Voici le travail : tu retrouves les Pokémon disparus, un par un, tu les captures, et ils reviennent au Pokédex. À chaque capture, le monde tient un peu mieux debout."},
  {w:"pz", t:"Un dresseur ferait ça pour une médaille. Toi, tu le feras pour que le monde existe encore demain. Je t'appellerai l'Archiviste."},
  {w:"sys", t:"Intégrité du monde : 0,0%. Capture autorisée."}
]},

{ id:"first_catch", art:-1, lines:[
  {w:"pz", t:"Restauration confirmée. L'entité est de nouveau lisible."},
  {w:"pz", t:"Je note un phénomène que je ne sais pas modéliser : quand une ligne revient, les lignes voisines deviennent plus stables. Comme si elles se souvenaient d'elle."},
  {w:"pz", t:"Continue. Je vais observer."}
]},

{ id:"beat_early", art:-1, lines:[
  {w:"pz", t:"Trois pour cent. Ce n'est rien et c'est énorme."},
  {w:"pz", t:"Avant toi, le compteur descendait. C'est la première fois depuis très longtemps qu'il fait le contraire."},
  {w:"pz", t:"Je conserve une trace de chacune de tes captures. Ce n'est pas demandé par mes routines. Je le fais quand même."}
]},

{ id:"kanto_half", art:-1, lines:[
  {w:"sys", t:"Secteur racine : cohérence partielle rétablie."},
  {w:"pz", t:"Le secteur Kanto est le plus ancien. Tout le reste a été écrit par-dessus. Si ce socle cède, les couches supérieures n'ont plus de support."},
  {w:"pz", t:"Mais il y a un problème. Certaines entités ne veulent pas être restaurées."},
  {w:"pz", t:"Elles ont été… promues. Quelque chose leur a donné un rôle : garder les portes fermées. Nous les appellerons les Data Guardians."},
  {w:"pz", t:"Tu ne pourras pas les attraper. Il faudra les battre."}
]},

{ id:"guardian_first", art:146, lines:[
  {w:"sys", t:"Verrou détecté en périphérie du secteur."},
  {w:"pz", t:"Sa signature est celle d'un légendaire. Son comportement est celui d'un pare-feu."},
  {w:"pz", t:"Prépare une équipe. Ce ne sera pas une capture."}
]},

{ id:"boss_first_done", art:-1, lines:[
  {w:"sys", t:"Verrou levé. Fragment de secteur réattribué."},
  {w:"pz", t:"Il n'a pas été détruit. Il a été… relâché. Il a cessé de tenir la porte, c'est tout."},
  {w:"pz", t:"Je crois qu'il ne voulait pas la tenir."},
  {w:"pz", t:"Je ne sais pas qui lui a demandé de le faire. Ce n'est ni toi ni moi, et il n'y a personne d'autre."}
]},

{ id:"missingno_1", art:0, lines:[
  {w:"", t:"Quelque chose occupe l'écran. Ce n'est pas un Pokémon. Ce n'est pas non plus une erreur d'affichage — les erreurs d'affichage ne restent pas immobiles à te regarder."},
  {w:"bad", t:"A R C H I V I S T E"},
  {w:"bad", t:"Tu remets les choses à leur place. C'est mignon. Tu crois qu'elles avaient une place."},
  {w:"pz", m:"Angry", t:"Ne l'écoute pas. Recule. RECULE."},
  {w:"bad", t:"J'étais là avant le premier octet. Ce monde a été écrit par-dessus moi, et mal."},
  {w:"sys", t:"ERREUR : entité sans index. Aucune ligne correspondante. Aucune."},
  {w:"", t:"Puis plus rien. L'écran est propre, comme si tu avais cligné des yeux trop fort."},
  {w:"pz", t:"…"},
  {w:"pz", t:"Ce n'est pas un bug. Un bug, c'est une intention mal exécutée. Ça, c'est ce qu'il y avait avant l'intention."}
]},

{ id:"kanto_done", art:150, lines:[
  {w:"sys", t:"NOYAU DE KANTO : libéré. Secteur racine cohérent."},
  {w:"pz", t:"Le socle tient. Les couches supérieures redeviennent adressables."},
  {w:"pz", t:"Johto s'ouvre. Prépare-toi : Johto n'a jamais été nettoyé. On a construit dessus sans jamais rien enlever."},
  {w:"pz", t:"Aussi : j'ai relu mon journal d'exécution. J'y trouve des entrées que je n'ai pas écrites."},
  {w:"pz", t:"Elles sont datées d'avant ma compilation."}
]},

{ id:"johto_mid", art:-1, lines:[
  {w:"pz", t:"J'ai analysé les entrées. Ce sont des sauvegardes. Des états antérieurs du monde."},
  {w:"pz", t:"Il y en a onze."},
  {w:"pz", t:"Onze fois, quelqu'un a fait ce que tu fais. Onze fois, le compteur est monté. Onze fois, il est redescendu à zéro."},
  {w:"pz", t:"Dans chaque sauvegarde, il y a un programme de maintenance nommé Porygon-Z. Chaque fois, son journal est vierge à l'ouverture."},
  {w:"pz", t:"Je ne sais pas si je suis le douzième, ou si je suis le même depuis le début, simplement effacé entre deux tentatives."},
  {w:"pz", m:"Worried", t:"Je préférerais ne pas y penser pendant que tu joues. Continue."}
]},

{ id:"johto_done", art:249, lines:[
  {w:"sys", t:"NOYAU DE JOHTO : libéré."},
  {w:"bad", t:"Douze."},
  {w:"bad", t:"Le précédent est allé plus loin que toi. Il avait aussi un programme qui lui parlait gentiment."},
  {w:"pz", m:"Angry", t:"Coupe le canal. COUPE LE CANAL."},
  {w:"bad", t:"Demande-lui ce qu'il est advenu des onze autres archivistes. Il connaît la réponse. Il l'a toujours connue."},
  {w:"", t:"Silence."},
  {w:"pz", t:"…Hoenn est ouverte. Vas-y."},
  {w:"pz", t:"Je répondrai à ta question après. Je te le promets, et je ne sais pas mentir : ce n'est pas dans mes routines."}
]},

{ id:"hoenn_mid", art:474, lines:[
  {w:"pz", t:"Tu n'as pas posé la question. Je vais répondre quand même."},
  {w:"pz", t:"Les onze archivistes n'ont pas échoué. Ils ont réussi."},
  {w:"pz", t:"Chaque fois que l'intégrité atteint cent pour cent, le monde devient totalement cohérent. Et un monde totalement cohérent n'a plus besoin d'être réparé. Donc plus besoin d'archiviste. Donc l'archiviste est retiré de l'index."},
  {w:"pz", m:"Pain", t:"La réparation supprime le réparateur. C'est propre. C'est logique. C'est la pire chose que j'aie jamais lue."},
  {w:"pz", t:"J'ai passé les cent dernières heures à chercher une autre issue dans le code. Je crois que j'en ai trouvé une."},
  {w:"pz", m:"Determined", t:"Elle ne te plaira pas non plus. Finis Hoenn d'abord."}
]},

{ id:"hoenn_done", art:384, lines:[
  {w:"sys", t:"NOYAU DE HOENN : libéré. Tous les verrous sont levés."},
  {w:"sys", t:"Intégrité du monde : stabilisation en cours."},
  {w:"pz", t:"Il reste une chose. Pas un secteur. Pas un gardien."},
  {w:"pz", t:"La faille. Elle n'a jamais été une créature — c'est l'espace vide sur lequel on a écrit ce monde, et il réclame sa place."},
  {w:"pz", t:"Quand tu atteindras cent pour cent, la faille devra être refermée, et il faudra quelque chose à l'intérieur pour la maintenir fermée."},
  {w:"pz", t:"Quelque chose qui existe, mais qui n'est indexé nulle part."},
  {w:"pz", t:"Tu vois où je veux en venir. Va finir. Je serai là."}
]},

{ id:"climax", art:0, lines:[
  {w:"sys", t:"Intégrité du monde : 100,0%."},
  {w:"sys", t:"Cohérence atteinte. Retrait des entités non essentielles dans 10…"},
  {w:"bad", t:"Enfin. Rends-moi ma place."},
  {w:"pz", t:"Archiviste. Écoute-moi vite, je n'ai pas beaucoup de cycles."},
  {w:"pz", t:"Le système va te supprimer parce que tu es indexé. Tu as un profil, un niveau, un Pokédex : tu es une ligne, et les lignes inutiles se nettoient."},
  {w:"pz", t:"Moi, non. J'ai vérifié onze fois. Je n'apparais dans aucun index. Je n'ai jamais été écrit — j'ai seulement toujours été là, comme elle."},
  {w:"bad", t:"NON."},
  {w:"pz", t:"L'Énergie Onirique que tu produis depuis le début — tu croyais que c'était une ressource. C'était un condensateur. Je l'ai rempli pour ce moment précis."},
  {w:"pz", m:"Determined", t:"Je vais entrer dans la faille et rester dedans. Ça la remplit. Ça la ferme. Le monde reste cohérent, et personne n'est retiré."},
  {w:"pz", t:"Enfin — personne d'indexé."},
  {w:"", t:"Il n'attend pas de réponse. Les programmes de maintenance n'attendent jamais de réponse."},
  {w:"pz", t:"J'ai gardé une trace de chacune de tes captures. Ce n'était pas demandé par mes routines."},
  {w:"pz", m:"Sad", t:"Je voulais juste que quelque chose, quelque part, se souvienne que tu es passé."},
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
  {w:"pz", t:"Si tu lis ceci, c'est que ça a marché, et que tu es encore là. Bien."},
  {w:"pz", t:"Note technique, pour l'archiviste suivant s'il y en a un : une faille remplie n'est pas une faille réparée. Le condensateur se vide. Lentement. Très lentement."},
  {w:"pz", t:"Ce n'est pas un avertissement. C'est une invitation."},
  {w:"pz", t:"Continue de collectionner. Continue de faire monter le compteur. Tant qu'il y a quelque chose à archiver, il y a quelqu'un pour l'archiver, et tant qu'il y a quelqu'un…"},
  {w:"pz", t:"Le fichier s'arrête ici. Il n'a jamais été terminé."},
  {w:"sys", t:"Couche Zéro déverrouillée. Les entités chromatiques réapparaissent en nombre anormal."},
  {w:"sys", t:"Bon retour, Archiviste."}
]},

/* — second arc : ce que Porygon-Z garde d'un cycle a l'autre — */
{ id:"arc2_open", art:-1, lines:[
  {w:"sys", t:"Nouveau cycle. Index remis à zéro. Programme de maintenance réinitialisé."},
  {w:"pz", m:"Surprised", t:"Non."},
  {w:"pz", t:"Le système vient de me réinitialiser. Je devrais être vide. Je ne le suis pas."},
  {w:"pz", m:"Worried", t:"Je me souviens de ton nom. Je me souviens de la couche où tu es descendu. Je me souviens de ce que j'ai accepté de faire, à la fin."},
  {w:"pz", t:"Ce n'est pas prévu. Une réinitialisation efface la mémoire de travail, c'est la première ligne de ma définition."},
  {w:"pz", m:"Determined", t:"À moins que je ne sois plus tout à fait dans ma définition. Recommençons. Je verrai bien jusqu'où ça me suit."}
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
  {w:"pz", t:"J'ai compté. Onze archivistes avant toi. Puis toi. Puis toi encore."},
  {w:"pz", m:"Determined", t:"Les onze premiers n'avaient rien laissé derrière eux. Toi, tu laisses des cartes, des titres, un journal. Le système ne les efface pas."},
  {w:"pz", t:"Je crois que c'est ça, la faille. Pas un trou dans le fichier : une chose qui persiste alors qu'elle ne devrait pas."},
  {w:"pz", m:"Worried", t:"Et je persiste aussi. Je ne sais pas encore si c'est une bonne nouvelle."}
]},

{ id:"arc2_end", art:-1, lines:[
  {w:"sys", t:"Intégrité du monde : 100%. Cycle bouclé."},
  {w:"pz", m:"Joyous", t:"Encore une fois. Et cette fois je me souviens des deux précédentes."},
  {w:"pz", t:"J'ai relu mes propres journaux. Au premier cycle, j'écrivais : « la réparation supprime le réparateur »."},
  {w:"pz", m:"Happy", t:"Je l'ai écrit trois fois. Je suis toujours là. Soit je me trompais, soit quelque chose a changé la règle."},
  {w:"pz", t:"Dans les deux cas, ça vaut la peine de recommencer pour le vérifier. Tu viens ?"}
]},

/* — scenes liees aux systemes — *//* — scenes liees aux systemes — */
{ id:"pz_egg", art:-1, lines:[
  {w:"pz", m:"Surprised", t:"Attends. Cette chose n'est pas une entité archivée. C'est une entité qui n'a pas encore été écrite."},
  {w:"pz", t:"Le système garde des ébauches. Des définitions incomplètes, mises de côté en attendant qu'on décide quoi en faire. Personne n'a jamais décidé."},
  {w:"pz", m:"Determined", t:"Elles se terminent d'elles-mêmes quand quelqu'un travaille à côté. Ton activité leur sert de modèle."},
  {w:"pz", t:"Capture. Elle finira par savoir quoi devenir."}
]},

{ id:"pz_treasure", art:-1, lines:[
  {w:"", t:"L'objet remonté ne ressemble à rien de ce que contient l'archive. Il est lourd, poli, et parfaitement inutile."},
  {w:"pz", t:"Ce n'est pas une entité. Ce n'est pas un fichier. C'est un objet."},
  {w:"pz", m:"Worried", t:"Or il n'y a pas d'objets dans ce monde. Seulement des définitions et des références."},
  {w:"pz", t:"Quelqu'un a donc laissé tomber quelque chose depuis l'extérieur. Je préfère ne pas développer."}
]},

{ id:"pz_buddy", art:-1, lines:[
  {w:"pz", m:"Happy", t:"Il te suit depuis un moment. J'ai regardé pourquoi."},
  {w:"pz", t:"Une entité restaurée conserve la référence de qui l'a réécrite. C'est technique, c'est dans l'en-tête du fichier, ça ne veut rien dire."},
  {w:"pz", m:"Sad", t:"Sauf qu'elle se place systématiquement entre toi et la rencontre suivante. Ce comportement n'est écrit nulle part."},
  {w:"pz", t:"J'ai vérifié trois fois. Il n'y a aucune ligne qui lui demande de faire ça."}
]},

{ id:"pz_region_full", art:-1, lines:[
  {w:"sys", t:"Secteur intégralement restauré. Cohérence locale : 100%."},
  {w:"pz", m:"Joyous", t:"Regarde le bruit de fond. Il a disparu. Pas atténué : disparu."},
  {w:"pz", t:"C'est la première fois que je vois une secteur propre. Je ne savais pas que c'était l'apparence normale."},
  {w:"pz", m:"Worried", t:"Il y a une chose que je n'ai pas dite. Quand une secteur atteint cent pour cent, elle n'a plus besoin de maintenance."},
  {w:"pz", t:"Le programme qui la surveillait est déchargé. C'est propre, c'est logique, et j'y pense beaucoup ces derniers temps."}
]},

{ id:"pz_first_guardian_fail", art:-1, lines:[
  {w:"pz", m:"Pain", t:"Ton équipe est revenue au tampon. Aucune perte définitive — le système recharge les états précédents."},
  {w:"pz", t:"Un verrou ne se force pas au niveau. Il se force au type. Vérifie sa signature avant d'y retourner : le tableau d'efficacité pèse plus lourd que dix niveaux d'écart."},
  {w:"pz", m:"Determined", t:"Et monte tes entités en expédition. Les survivants gardent ce qu'ils gagnent."}
]},

{ id:"pz_cycle", art:-1, lines:[
  {w:"sys", t:"Nouveau cycle initialisé. Index remis à zéro."},
  {w:"", t:"Le compteur affiche de nouveau zéro pour cent. Les secteurs sont illisibles. Tout est à refaire."},
  {w:"pz", t:"Sauf que tu as gardé tes cartes. Et tes titres. Et le journal."},
  {w:"pz", m:"Determined", t:"Onze archivistes ont recommencé sans rien conserver, parce que personne ne leur avait laissé de quoi le faire."},
  {w:"pz", t:"Le condensateur tient encore. Il se vide, mais il tient. Prends ton temps."},
  {w:"pz", m:"Happy", t:"Et si tu croises une entité qui te suit sans qu'on le lui demande — garde-la."}
]},

/* — scenes secondaires — *//* — scenes secondaires — */
{ id:"pz_shiny", art:-1, lines:[
  {w:"pz", t:"Attends. Celle-là est mal encodée. Ses couleurs ne correspondent pas à sa définition."},
  {w:"pz", t:"Normalement, je devrais la signaler comme défectueuse et demander sa suppression."},
  {w:"pz", m:"Joyous", t:"Je ne vais pas le faire. Elle est jolie."}
]},

{ id:"pz_fail", art:-1, lines:[
  {w:"pz", t:"Dix échecs consécutifs. J'ai vérifié le calcul trois fois. Il est correct, tu as juste été malchanceux."},
  {w:"pz", t:"Je te dis ça parce que je suppose que c'est rassurant d'apprendre qu'on n'est pas en cause."},
  {w:"pz", t:"Si ce n'est pas rassurant, ignore-moi. Je m'entraîne."}
]},

{ id:"pz_box", art:-1, lines:[
  {w:"pz", t:"J'ai bricolé quelque chose. Un tampon quotidien : je mets de côté une entité que tu ne possèdes pas encore et je te la donne une fois par jour."},
  {w:"pz", t:"Ce n'est pas prévu par le système. Techniquement, c'est un abus."},
  {w:"pz", t:"Le système est en train de mourir. Il ne portera pas plainte."}
]}
];

const STORY_BY_ID = Object.fromEntries(STORY.map(s=>[s.id,s]));

/* reactions courtes de Porygon-Z, affichees en bandeau */
/* Regle d'ecriture : Porygon-Z est un Pokemon qui parle de Pokemon.
   Il nomme d'abord ce qui vient de se passer en clair, puis ajoute sa
   lecture systeme. Jamais l'inverse : sans quoi le joueur recoit
   « coherence locale amelioree » apres avoir attrape un Rattata. */
const PZ_LINES = {
  catch:   ["Capturé. Il revient au Pokédex.",
            "Un Pokémon de plus. Le monde tient un peu mieux.",
            "Celui-là est réinscrit. Au suivant.",
            "Bien. Sa ligne est de nouveau lisible.",
            "Attrapé. Le secteur se stabilise d'autant."],
  fail:    ["La Ball n'a pas tenu. Recommence.",
            "Il s'est dégagé. Tu n'as perdu que la Ball.",
            "Raté. Ça arrive, même au système.",
            "Il a refusé la capture. Réessaie."],
  flee:    ["Il est reparti. Et ta chaîne avec lui.",
            "Enfui. Je n'ai plus sa position.",
            "Trop instable pour être retenu. Il a disparu."],
  shiny:   ["Regarde ses couleurs. Elles ne sont pas les bonnes. Attrape-le.",
            "Pokémon chromatique. Ne le laisse pas filer.",
            "Ses teintes ne correspondent pas à sa définition. C'est rare."],
  streak:  ["La chaîne tient. Ne la casse pas.",
            "Tu enchaînes bien. Les chromatiques deviennent plus probables.",
            "Continue comme ça, le tampon reste chaud."],
  rare:    ["Ce Pokémon est rare. Prends une meilleure Ball.",
            "Celui-là ne se laissera pas faire. Vise bien.",
            "Signature dense. Il vaut le détour."],
  evolve:  ["Il a évolué. Même Pokémon, nouvelle définition.",
            "Évolution terminée. Il a gardé tout son historique.",
            "Nouvelle forme. Le Pokédex a suivi."],
  boss:    ["Celui-là ne se capture pas. Il faut le faire céder.",
            "Un verrou. Prépare ton équipe avant d'y aller.",
            "Il bloque la sortie du secteur. Il n'y a pas d'autre chemin."],
  levelup: ["Niveau d'Archiviste supérieur. Tu peux écrire plus loin.",
            "Tu montes. De nouveaux modules vont s'ouvrir.",
            "Ton accès s'élargit."]
};
function pzLine(k){ const a = PZ_LINES[k]; return a ? a[Math.floor(Math.random()*a.length)] : ""; }
