/* Notices du Pokedex : une ligne par espece, reprises de la v1 du projet. */
const LORE_BLOB=`
Il porte une plante sur le dos. En cas de famine, ce sera le premier à y passer.
La plante sur son dos grandit et lui pompe toute son énergie. Une belle métaphore de la vie adulte.
Sa fleur sent bon pour attirer les proies. Si tu t'approches trop, tu finis en compost.
Si sa flamme s'éteint, il meurt. Évitez de l'emmener à la piscine ou sous la pluie.
Un ado colérique avec une queue en feu. Il brûle tout ce qu'il touche, y compris vos relations sociales.
Il se prend pour un dragon mais n'en a pas le type. Crise d'identité majeure.
Il cache sa tête dans sa carapace pour fuir ses responsabilités. On le comprend.
Il a des oreilles ailées mais ne vole pas. La nature est parfois cruelle.
Il a des canons dans le dos pour compenser quelque chose. Probablement sa lenteur.
Une chenille qui rêve de grandeur. Pour l'instant, elle sert surtout de casse-croûte aux oiseaux.
Il ne bouge pas d'un pouce. Idéal comme cale-porte, inutile en combat.
Il sème une poudre toxique en volant. Une arme biologique avec des ailes mignonnes.
Il a un dard sur la tête et un autre au derrière. Il n'aime personne et ça se voit.
Il attend d'évoluer en fixant le vide. Passionnant.
Un frelon sous stéroïdes avec des foreuses à la place des mains. Cauchemar pur.
Le rat volant des villes. Il vous chie dessus pour porter bonheur.
Il a l'air méchant, mais c'est juste un gros pigeon avec une crête.
Il vole à Mach 2. Dommage qu'il ne l'utilise que pour fuir les combats difficiles.
Il ronge tout, même vos murs. Le colocataire que personne ne veut.
Ses dents poussent en permanence. S'il ne ronge pas, elles lui transpercent le cerveau. Sympa.
Il crie fort pour compenser sa petite taille. Le complexe de Napoléon en version plume.
Il peut voler toute la journée. Il vous suivra jusqu'à ce que vous mouriez d'épuisement.
Il s'enroule autour de sa proie et serre jusqu'à entendre un 'crac'. Câlin mortel.
Il a un visage sur le ventre pour effrayer les lâches. Si ça marche, c'est que vous êtes lâche.
La mascotte surcotée. Il refuse de rentrer dans sa Ball par pur narcissisme.
La version adulte de Pikachu que tout le monde oublie. Il vit dans l'ombre de son petit frère.
Il se roule en boule pour éviter les problèmes. Une stratégie de vie validée.
Ses griffes peuvent trancher l'acier, mais il préfère creuser des trous pour se cacher.
Petite et toxique. Ne la caressez pas à rebrousse-poil si vous tenez à votre main.
Elle mâche sa nourriture pour ses petits. Dégoutant mais maternel.
Une mère poule blindée. Si vous touchez à ses petits, elle vous brise les os.
Il écoute tout avec ses grandes oreilles. Le roi des commères.
Sa corne est plus dure que le diamant. Il s'en sert pour tout casser, juste pour le fun.
Il brise la colonne vertébrale de ses proies avant de les manger. Bon appétit.
Ils viennent de la lune. Probablement pour nous envahir avec leur mignonnerie.
Il entend une aiguille tomber à 1km. Impossible de lui faire une fête surprise.
Il est mignon tant qu'il est jeune. Après, il devient un esprit vengeur millénaire.
Il peut vivre 1000 ans. Il vous regardera vieillir et mourir sans prendre une ride.
Il chante pour vous endormir et vous dessine sur le visage. Le troll ultime.
Son corps est élastique. On peut jouer au ballon avec, il aime ça (peut-être).
Il n'a pas d'yeux, mais il vous trouvera pour boire votre sang. Dormez bien.
Il peut boire 300ml de sang en une fois. Pratique pour les dons du sang, mortel pour vous.
Une mauvaise herbe qui marche. Arrachez-la avant qu'elle ne se multiplie.
Il bave un nectar qui sent la vieille chaussette. Personne ne veut être son ami.
La plus grande fleur du monde, et aussi celle qui pue le plus. L'odeur de la mort.
Les champignons sur son dos le contrôlent. Ce n'est pas un Pokémon, c'est un zombie.
Le champignon a totalement pris le contrôle. L'insecte est mort à l'intérieur. Glauque.
Ses yeux sont des radars. Il vous regarde dormir.
Il disperse des écailles toxiques. Si vous éternuez, vous êtes déjà empoisonné.
Personne ne sait à quoi ressemble le bas de son corps. C'est peut-être mieux ainsi.
Trois têtes qui pensent la même chose : 'Creuser'. Une vie intellectuelle limitée.
Il aime l'argent plus que son dresseur. Il vous vendrait pour une pièce brillante.
Hautain et capricieux. Il vous tolère juste parce que vous le nourrissez.
Il a une migraine constante. Ses pouvoirs psy se déclenchent quand il souffre. Sadique.
Il nage vite et utilise la télépathie. Le maître nageur qui triche.
Il s'énerve pour rien. Si vous le regardez, il frappe. Si vous l'ignorez, il frappe.
Il est tellement en colère qu'il peut mourir de rage. La gestion de la colère, il connait pas.
Le chien policier parfait. Il mord les criminels et bave sur les preuves.
Un chien légendaire qui court comme le vent. Il est majestueux et il le sait.
Son ventre est transparent. On voit ses organes. C'est dérangeant.
Il peut marcher sur terre mais préfère l'eau pour ne pas sécher sa peau gluante.
Un têtard sous stéroïdes. Il a des muscles sur les muscles.
Il dort 18h par jour et se téléporte au moindre danger. Lache et paresseux.
Il a une cuillère pour amplifier ses pouvoirs. Ou pour manger sa soupe, on sait pas.
Un QI de 5000. Il sait que vous allez perdre avant même de commencer.
Il s'entraîne tout le temps. Il a plus de muscles dans un doigt que vous dans tout le corps.
Il porte une ceinture pour contenir sa puissance. Sans elle, il explose ?
Quatre bras pour faire la vaisselle plus vite. Ou pour vous casser en quatre.
Une plante qui mange des insectes. Si vous êtes petit, courez.
Il vous avale tout rond s'il a faim. L'acide fait le reste.
Il attire ses proies avec une odeur sucrée. Le piège classique du prédateur.
99% d'eau, 1% de méchanceté pure. Ne marchez pas dessus.
Il a 80 tentacules. C'est beaucoup trop de tentacules.
Un caillou avec des bras. Il s'énerve si on marche dessus. Désolé, tu ressembles à un caillou.
Il dévale les montagnes en écrasant tout. Les randonneurs l'adorent.
Il explose parfois sans raison. Une mine antipersonnel vivante.
Il saute par-dessus la Tour Eiffel (soi-disant). Il a aussi des sabots en diamant.
Il court à 240 km/h. Si vous tombez, vous êtes râpé comme du fromage.
Il est lent. Si on lui coupe la queue, il ne s'en rend compte que le lendemain.
Il est devenu intelligent parce qu'un coquillage lui mord les fesses. La douleur éveille.
Il flotte et brouille les ondes radio. Les techniciens télécoms le détestent.
Trois Magnéti collés ensemble. L'évolution la plus paresseuse de l'histoire.
Il se bat avec un poireau. C'est ridicule, mais ça fait mal.
Deux têtes qui se disputent tout le temps. La schizophrénie aviaire.
Trois têtes : Joie, Tristesse et Colère. Un film Pixar sur pattes.
Il aime le froid. Si vous avez froid, il est content. Égoïste.
Il stocke la chaleur dans son corps. Une bouillotte vivante qui nage.
Un tas de boue vivante. Il pue, il pollue, et il aime ça.
Il est encore plus toxique. Sa trace tue les plantes. L'ennemi de l'écologie.
Il tire la langue aux gens. Impertinent et blindé.
Sa coquille est plus dure que le diamant. Il sourit, mais c'est un psychopathe.
Une boule de gaz. Si vous respirez à côté de lui, vous vous évanouissez.
Il vous lèche pour voler votre vie. Ne sortez pas la nuit.
Il se cache dans votre ombre et attend que vous soyez seul. Rassurant.
Un ver de terre géant fait de pierres. Il creuse des tunnels et effondre les maisons.
Il mange vos rêves. Si vous faites des cauchemars, c'est qu'il n'a pas faim.
Il kidnappe les enfants qui lui ressemblent. La police le recherche activement.
Un crabe. Juste un crabe. Avec un regard vide.
Sa pince est énorme mais trop lourde. Il a du mal à garder l'équilibre. Ridicule.
Il ressemble à une Pokéball. Si vous le ramassez, il explose. Piège classique.
Il aime l'électricité. Il provoque des pannes de courant pour se nourrir.
Des œufs qui communiquent par télépathie. S'ils cassent, ils reviennent ?
Un arbre à trois têtes qui rigolent tout le temps. C'est flippant.
Il porte le crâne de sa mère morte. Thérapie nécessaire, urgemment.
Il a surmonté son deuil en devenant violent. Il frappe avec un os.
Ses jambes s'allongent pour frapper. Il peut vous botter les fesses à 5 mètres.
Il frappe plus vite que son ombre. Ne l'énervez pas.
Sa langue fait deux fois sa taille. Il lèche tout pour mémoriser les textures. Berk.
Une mine flottante remplie de gaz. Ne fumez pas à côté.
Deux mines flottantes. Double dose de pollution.
Son cerveau est minuscule. Il court tout droit et défonce tout. Un bélier idiot.
Il peut survivre dans la lave. Pratique pour le tourisme volcanique.
Il donne ses œufs aux blessés. C'est gentil, mais d'où sortent les œufs ?
Un tas de lianes avec des chaussures. Personne ne sait ce qu'il y a dessous.
La mère protectrice ultime. Le bébé dans la poche sort-il un jour ?
Il crache de l'encre pour fuir. Un lâche aquatique.
Il nage à reculons. Il ne sait pas où il va, mais il y va vite.
Un poisson avec une corne. La reine des rivières, selon elle.
Il fait des nids en automne. Ne mettez pas les pieds dans l'eau.
Si on lui coupe un bras, il repousse. Invincible et géométrique.
Il envoie des signaux radio dans l'espace. Les aliens l'écoutent peut-être.
Il fait des murs invisibles. Les mimes sont déjà agaçants, lui est magique.
Un ninja insecte avec des faux. Il coupe les arbres et les imprudents.
Elle parle une langue inconnue et danse bizarrement. Personne ne la comprend.
Il se nourrit des centrales électriques. Cause #1 des pannes d'électricité.
Son corps est en feu. Il naît dans un volcan. Il a chaud.
Il serre ses proies avec ses pinces jusqu'à ce qu'elles craquent. Brutal.
Il charge tout ce qui est rouge. Et tout ce qui bouge. Il est juste énervé.
Le roi de la nullité. Il ne sert à rien, à part éclabousser.
La vengeance du poisson nul. Il détruit des villes entières quand il est fâché.
Le taxi des mers. Il adore transporter des gens. Un peu trop serviable.
Il peut devenir n'importe qui. Votre meilleur ami est peut-être un Métamorph.
L'ADN instable. Il ne sait pas ce qu'il veut faire de sa vie.
Il fond dans l'eau. Pratique pour disparaitre, moins pour être vu.
Un chien électrique nerveux. Si vous le caressez, vous prenez 10 000 volts.
Il stocke la chaleur. C'est une bouillotte sur pattes.
Un programme informatique vivant. Il coûte cher en antivirus.
Ressuscité d'un fossile. Il se demande ce qu'il fait là.
Il a des dents pointues et des tentacules. Cthulhu miniature.
Un fossile vivant qui se cache au fond de l'eau. Timide ou stratège ?
Il a des lames à la place des mains. Comment fait-il pour manger ?
Un dinosaure volant qui crie très fort. La préhistoire est de retour.
Il mange, il dort. C'est tout. La vie de rêve.
L'oiseau de glace. Il gèle l'air. Il a froid, vous aussi.
L'oiseau de foudre. Il crée des orages. Bruyant et dangereux.
L'oiseau de feu. Il annonce le printemps, ou un incendie de forêt.
Un ver aquatique mignon. Il deviendra un dragon, mais pour l'instant, c'est un ver.
Il grandit et devient mystique. Il contrôle la météo.
Un dragon orange gentil. Il sauve les naufragés. Le Saint-Bernard des mers.
Créé par l'homme pour combattre. Il déteste l'humanité. On ne peut pas lui en vouloir.
L'ancêtre de tous. Il contient l'ADN de tous les Pokémon. Le disque dur original.
Une salade sur pattes qui pense pouvoir survivre dans la nature. Mignon jusqu'à ce qu'il finisse dans un bol.
Il a une feuille de rasoir autour du cou. Idéal pour se trancher la carotide par accident.
Son haleine ravive les plantes mortes. Dommage qu'elle ne puisse pas raviver votre vie amoureuse.
Il s'allume quand il a peur. Pratique pour les barbecues, moins pour la discrétion.
Il a arrêté de fumer, mais son dos continue de s'enflammer. Attention aux nappes.
Il frotte sa fourrure pour provoquer des explosions. Un danger public ambulant.
Il mord tout ce qui bouge par affection. Adieu, doigts et orteils.
Il ne lâche jamais prise une fois qu'il a mordu. Comme votre ex, mais avec plus de dents.
Un alligator bipède qui court plus vite que vous. Inutile de fuir, acceptez votre sort.
Une écharpe vivante qui sert aussi de paillasson. Ne marche pas très vite.
Il est long, il est mou, et il s'infiltre partout. Non, ce n'est pas ce que vous croyez.
Il a une horloge interne parfaite, ce qui le rend insupportable pour ceux qui aiment dormir le matin.
Il réfléchit tellement que sa tête enfle. L'intellectuel prétentieux de la forêt.
Une coccinelle qui fait de la boxe. La nature a vraiment des idées stupides.
Quatre bras pour mieux vous gifler. Il frappe à la vitesse de la lumière, vous ne verrez rien venir.
Il tisse des toiles avec son visage. Une façon dégoûtante d'être créatif.
Il piège ses proies et les sirote lentement. Ne vous endormez pas près de lui.
Quatre ailes pour voler silencieusement. Il vous vide de votre sang sans même vous réveiller. Sympa.
Il vit au fond de l'eau et électrocute tout. Un grille-pain dans une baignoire, version poisson.
Sa lumière attire les proies. 'Oh, c'est joli !' fut leur dernière pensée.
Il ne sait pas gérer son électricité et s'électrocute lui-même. La sélection naturelle a échoué ici.
On dit que sa forme d'étoile porte chance. Surtout si vous ne marchez pas dessus.
Un ballon rose avec des yeux rouges. Il ressemble à un cauchemar sous hélium.
Une omelette qui pleure. Ne le secouez pas trop fort, il est fragile.
Il apporte le bonheur, mais s'enfuit dès que vous êtes triste. Un ami toxique.
Il sautille parce que ses ailes ne sont pas finies. L'évolution a bâclé le travail.
Il voit le futur et reste immobile, paralysé par l'horreur de votre avenir.
Sa laine génère de l'électricité statique. Touchez-le et perdez vos sourcils.
Il a perdu sa laine et ressemble maintenant à un coton-tige rose géant.
Il brille tellement fort qu'on le voit de l'espace. Aucune intimité possible.
Une fleur qui danse. Si elle danse mal, il pleut. C'est de sa faute si vos vacances sont gâchées.
Une souris d'eau qui flotte comme une bouée. Utile en cas de naufrage, inutile sinon.
Un lapin aquatique qui peut faire des bulles. C'est tout. Il fait des bulles.
Il fait semblant d'être un arbre. Les chiens lui pissent dessus. Triste vie.
Une grenouille avec une coupe afro. Le roi du disco des marais.
Il est si léger que le vent l'emporte. On en perd des centaines chaque année.
Il flotte sur la tête des gens pour absorber leurs nutriments. Un chapeau parasite.
Il disperse ses graines partout. La cause principale de vos allergies.
Il a une main au bout de la queue. Pratique pour se gratter le dos ou voler votre portefeuille.
La graine la plus faible du monde. Il tombe du ciel et attend de mourir.
Il ne bouge que s'il y a du soleil. La nuit, c'est juste un légume.
Il vole sur place et scanne les environs. Le drone biologique original.
Il n'a pas de bras, un visage vide et vit dans la boue. L'image de la dépression.
Il se cogne la tête contre les bateaux. Il a l'air stupide et il l'est probablement.
Il lit dans vos pensées et vous juge en silence. Il sait ce que vous avez fait.
Il transpire du poison quand il est énervé. Ne le calinez pas.
Il porte malheur à ceux qui le voient. Si vous lisez ceci, c'est trop tard.
Il est devenu intelligent parce qu'un coquillage lui mord la tête. La douleur rend génie.
Il tire sur vos cheveux et crie la nuit. Le colocataire de l'enfer.
Une soupe à l'alphabet vivante. Ils écrivent des messages, souvent des insultes.
Le sac de frappe ultime. Il encaisse tout et ne dit rien. Le masochisme incarné.
Sa queue a un cerveau et mord tout ce qui passe. Il ne peut jamais s'asseoir tranquille.
Une pomme de pin explosive. Si vous marchez dessus, vous perdez une jambe.
Une tourelle vivante qui tire des pics. Ne jouez pas à cache-cache avec lui.
Il creuse avec sa queue pour fuir la réalité. On te comprend, Insolourdo.
Il plane sans bruit et vous tombe dessus le visage. Comme un masque de la mort.
Un serpent de métal géant. Il mâche la roche et vos voitures.
Il ressemble à un bouledogue en robe rose. Laideur et mignonnerie confusent.
Il est timide mais peut broyer des os. Un introverti dangereux.
Un poisson-globe toxique qui explose. La roulette russe de la pêche.
Il a des pinces en acier qui écrasent le béton. Ne lui serrez pas la main.
Il fait du jus de baie dans sa coquille. Les autres Pokémon le boivent. C'est... spécial.
Il aime le miel et la bagarre. Un ours alcoolique version insecte.
Il vole les œufs des autres pour les manger. Un criminel né.
Il a l'air mignon pour vous attirer, puis vous vole votre nourriture. Une petite crapule.
Il peut casser un arbre en deux. Imaginez ce qu'il fait à votre colonne vertébrale.
De la lave vivante. Il ne peut jamais dormir dans un lit sans mettre le feu.
Un escargot de magma. Sa coquille est fragile, son corps est mortel.
Il renifle le sol pour trouver des champignons. Un cochon truffier glorifié.
Ses poils cachent ses yeux. Il fonce dans les murs. Heureusement qu'il est solide.
Du corail vivant. Les gens en font des bijoux. Une vie de peur constante.
Un poisson pistolet. Il s'accroche aux autres pour survivre. Un parasite armé.
Une pieuvre tank. Il tire de l'encre et des rayons lasers. La guerre sous-marine.
Le Père Noël est une ordure. Ses cadeaux explosent littéralement.
Une raie manta qui sert de piste d'atterrissage pour poissons. L'aéroport des mers.
Un oiseau en armure. Il vole lourdement et coupe l'air comme une guillotine.
Un chien des enfers miniature. Il mord et ça brûle pour toujours.
Le chien de garde de Satan. Son hurlement fait fuir même les fantômes.
Un dragon des mers qui crée des tourbillons en bâillant. Ne le réveillez pas.
Un éléphanteau qui joue avec sa trompe. Il peut quand même vous écraser par accident.
Il se roule en boule et dévaste tout. Un pneu de tracteur vivant et en colère.
Une mise à jour logicielle qui a mal tourné. Plus lisse, mais toujours bizarre.
Un cerf qui hypnotise avec ses bois. Ne le regardez pas dans les yeux.
Il peint avec sa queue. C'est de l'art abstrait, ou juste des gribouillis.
Il a plus d'esprit combatif que de muscles. Il perd souvent, mais avec panache.
Il tourne sur la tête comme une toupie. Idéal pour nettoyer le sol.
Il embrasse tout le monde. Personne ne veut de ses bisous.
Il tourne ses bras pour charger de l'électricité. Une dynamo vivante.
Il crache des flammèches quand il éternue. Attention aux tapis.
Une vache qui boit son propre lait. C'est... conceptuel.
L'œuf dans sa poche vaut une fortune. Il est la cible de tous les voleurs.
Le tigre de la foudre. Il court avec l'orage. Ne sortez pas par temps de pluie.
Il aboie et un volcan entre en éruption. Le pire voisin possible.
Il purifie l'eau sale. Les stations d'épuration le détestent.
Il mange de la terre pour grandir. Un régime peu ragoûtant mais économique.
Il est dans sa cocon de pierre. Il attend de devenir un monstre. Patience.
Godzilla avec un problème de gestion de la colère. Il rase des montagnes pour le fun.
Le gardien des mers. Il dort au fond de l'eau pour éviter de gérer vos problèmes.
Un poulet rôti éternel qui laisse des arcs-en-ciel derrière lui.
Il voyage dans le temps pour éviter de vous rencontrer. On le comprend.
Il se prend pour un dur avec sa brindille. C'est juste un gecko avec un problème d'attitude.
Il a des feuilles sur les bras qui coupent comme des rasoirs. Attention aux câlins.
Il a un sapin de Noël sur la queue. Il est festif mais mortel.
Un poussin qui brûle de l'intérieur. Si vous le serrez trop fort, vous cuisez.
Il donne 10 coups de pied par seconde. Il a trop regardé de films de kung-fu.
Un coq de combat qui saute par-dessus les immeubles. Il a sauté le jour des jambes à la salle.
Il vit dans la boue et mange n'importe quoi. L'incarnation de la vie étudiante.
Il vit sur terre et dans l'eau, mais il est maladroit partout. Triste.
Il est tellement costaud qu'il peut nager contre les tsunamis. Il frime.
Il mord tout ce qui bouge. Si ça ne bouge pas, il mord quand même.
Il hurle sans arrêt. Si vous aimez le silence, fuyez.
Il court en ligne droite et fonce dans les murs. L'intelligence n'est pas son fort.
Il est encore plus rapide et fonce encore plus fort. Les murs tremblent.
Une chenille rouge qui se cache. Elle rêve de devenir un beau papillon, ou pas.
Une carapace de pics. Ne l'utilisez pas comme ballon de foot.
Un papillon magnifique qui utilise ses ailes pour créer des ouragans. Beau mais psychopathe.
Il se protège avec de la soie. Il est timide et collant.
Un papillon de nuit toxique. Il est attiré par la lumière, comme un idiot.
Il flotte sur l'eau comme une feuille. Ne le confondez pas avec du thé.
Il a une feuille sur la tête pour se cacher. Le maître du déguisement (non).
Il danse quand il pleut. Il aime être mouillé, le bizarre.
Un gland qui marche. Oui, vous avez bien lu.
Il a un nez en forme de feuille. Il ment tout le temps ?
Il utilise ses feuilles comme des éventails pour créer des tornades. Climatiseur naturel.
Il est courageux malgré sa petite taille. Il se bat contre des ennemis 10 fois plus gros et perd.
Il vole courageusement. Il ne sert à rien d'autre qu'à faire joli.
Il vole vite et a une bonne vue. Le facteur des mers.
Il flotte sur l'eau et mange de la mousse. Une vie passionnante.
Il ressent les émotions des autres avec ses cornes. Si vous êtes triste, il le sait et ça le déprime.
Une ballerine qui utilise ses émotions pour se battre. Drama queen.
Elle peut créer des trous noirs pour protéger son dresseur. Dévouée, mais dangereuse.
Il glisse sur l'eau comme un insecte. Il est rapide mais fragile.
Il vole avec des ailes bizarres. On dirait un masque effrayant.
Un champignon qui donne des coups de tête. Il a un tempérament de cochon.
Il a des bras élastiques. Il boxe les gens à distance. Lâche.
Le paresseux ultime. Il bouge une fois par jour. Mon animal totem.
Il ne peut pas s'arrêter de bouger. L'opposé de son enfant. Hyperactif sous caféine.
Le roi des paresseux. Il est fort, mais il s'en fiche. Il préfère dormir.
Il creuse vite. Très vite. Il est déjà parti.
Il est tellement rapide qu'il est invisible. On ne sait même pas s'il est là.
Une coquille vide habitée par un insecte fantôme. Il vole votre âme si vous regardez dans le trou.
Il crie fort. Très fort. Vos tympans vont exploser.
Il utilise ses oreilles comme des hauts-parleurs. Le DJ de la forêt.
Il explose encore plus fort. Une enceinte vivante qui marche.
Il s'entraîne tout le temps. Il veut devenir un sumo, mais il est trop maigre.
Il a de grosses mains pour gifler ses ennemis. Le roi de la baffe.
Une petite boule bleue qui rebondit sur sa queue. Mignon et triste.
Il a un nez aimanté. Il se dirige toujours vers le nord, même s'il ne veut pas.
Un chat mignon qui charme ses ennemis. Ne lui faites pas confiance.
Il est obsédé par la propreté. Si vous êtes sale, il vous attaque.
Il mange des pierres précieuses et a des yeux en diamant. Un régime coûteux.
Il a une mâchoire d'acier dans le dos. On ne sait pas laquelle est la vraie tête.
Il mange du métal pour renforcer son armure. Il va manger votre vélo.
Il utilise son armure pour charger. Un tank sur pattes.
Il mange tellement de fer qu'il est devenu un monstre d'acier. Lourd.
Il médite tout le temps. Il a atteint l'illumination, ou il dort les yeux ouverts.
Il a des pouvoirs psy puissants grâce au yoga. Il peut plier une cuillère et votre esprit.
Un chien électrique statique. Il court vite pour générer du courant.
Il peut faire tomber la foudre. Un orage sur quatre pattes.
Deux souris qui s'entraident. L'une encourage l'autre. C'est mignon, ça donne envie de vomir.
La même chose, mais en rouge. Toujours aussi insupportablement positifs.
Une luciole qui clignote. Elle communique avec la lumière. Romantique.
Elle utilise son parfum pour attirer les Volbeat. Femme fatale version insecte.
Il a des roses à la place des mains. Beau mais épineux.
Un estomac liquide qui dissout tout. Ne le prenez pas dans vos bras.
Il avale tout ce qui bouge. Un trou noir avec des moustaches.
Un piranha féroce. Il mord tout. Ne mettez pas les doigts dans l'eau.
Un requin torpille. Il fonce sur ses proies et les déchire. La terreur des mers.
Une baleine ronde qui rebondit. Elle est heureuse et ça se voit.
La plus grosse baleine. Elle plonge dans les abysses. Personne ne sait ce qu'elle y fait.
Un chameau un peu lent. Il a du magma dans sa bosse. Chaud.
Deux volcans sur le dos. S'il s'énerve, c'est Pompéi.
Une tortue de charbon. Elle fume comme une locomotive. Mauvais pour les poumons.
Un cochon sur ressort. Il rebondit tout le temps. Il a l'air stressé.
Il utilise sa queue pour manipuler les gens. Un cochon hypnotiseur.
Un panda avec des taches. Il est confus en permanence. On dirait moi le lundi matin.
Une fourmi géante avec des mâchoires d'acier. Elle peut soulever 100 fois son poids.
Un dragon libellule. Il vole vite et fait du bruit. Comme un hélicoptère bio.
Une libellule encore plus grosse. Elle crée des tempêtes de sable.
Un cactus qui marche la nuit pour suivre les voyageurs. Flippant.
Un épouvantail maudit qui vous suit. Ne regardez pas derrière vous.
Un oiseau nuage. Il se cache dans le ciel. Il est doux comme du coton.
Il chante magnifiquement mais ses ailes sont en coton. Un dragon fragile.
Une mangouste en colère. Elle déteste les serpents. Rivalité ancestrale.
Un serpent venimeux. Il déteste les mangoustes. Rivalité ancestrale, le retour.
Une lune en pierre qui flotte. Elle tire des rayons cosmiques.
Un soleil en pierre qui flotte. Il brûle tout ce qui s'approche.
Un poisson vaseux. Il est glissant et ne sert à rien.
Un poisson chat qui provoque des séismes. Il ne le fait pas exprès, il est juste maladroit.
Une écrevisse agressive. Elle attaque tout ce qui entre dans son territoire.
Un homard géant. Il est fort et il le sait. Il claque ses pinces.
Une poupée d'argile qui tourne. Elle a été créée par une civilisation ancienne.
Une statue d'argile qui tire des rayons laser. La technologie antique était bizarre.
Un fossile de plante marine. Il a des tentacules bizarres.
Il vit au fond de l'océan et attrape ses proies avec ses ventouses. Le kraken préhistorique.
Un fossile d'insecte avec des griffes. Il est rapide et mortel.
Un guerrier en armure d'insecte. Il est honoré et dangereux.
Un poisson moche mais résistant. Il survit à tout, même à la pollution.
Le plus beau des Pokémon (selon lui). Il vit pour être admiré.
Il change de forme selon la météo. Un baromètre vivant.
Un caméléon qui se camoufle. Vous ne le verrez jamais venir.
Une poupée maudite qui cherche son propriétaire. Histoire d'horreur classique.
Une marionnette fantôme. Elle sourit, mais elle veut votre âme.
Un fantôme cyclope. Il voit tout, surtout vos péchés.
Une momie cyclope. Il piège les gens dans son corps vide. Très accueillant.
Un dinosaure volant avec des bananes au menton. Design audacieux.
Une cloche qui tinte dans le vent. Elle apaise les esprits.
Un désastre sur pattes. Il apparaît quand une catastrophe arrive. Porte-poisse.
Il est toujours heureux. Pourquoi ? Personne ne sait. Suspect.
Il grelotte tout le temps. Mettez-lui un pull.
Une tête de glace géante. Il gèle tout sur son passage.
Une boule de graisse qui nage et applaudit. Le public idéal.
Un morse avec une moustache magnifique. Il brise la glace avec ses dents.
Une perle qui nage. Elle est précieuse, ne la perdez pas.
Une anguille des abysses. Elle chasse en utilisant sa lumière. Terrifiant.
Un serpent des mers magnifique mais dangereux. Il vit dans les profondeurs.
Un poisson qui ne sait pas nager. Sérieusement ? L'évolution a merdé.
Un poisson ancien et puissant. Sa tête est dure comme la pierre.
Un cœur qui nage. Il cherche l'amour dans l'océan. Romantique.
Un dragon qui veut voler. Il saute des falaises pour apprendre. Courageux ou suicidaire.
Il a une coquille dure pour se protéger en attendant de voler.
Enfin, il vole ! Il est furieux d'avoir attendu si longtemps. Il brûle tout.
Un robot cyclope en métal. Il calcule tout. Il n'a pas d'âme.
Deux robots cyclopes fusionnés. Deux fois plus de calculs, zéro âme.
Un superordinateur de combat à quatre pattes. Il gagne aux échecs et à la guerre.
Un golem de roche. Si vous le cassez, il se répare. Pratique.
Un golem de glace. Il fond si on lui fait un câlin. Triste.
Un golem d'acier. Il ne fond pas, ne casse pas. L'ennui total.
Un dragon femelle qui vole à la vitesse du son. Elle est invisible quand elle va vite.
Un dragon mâle qui vole encore plus vite. Il protège sa sœur.
Le maître des océans. Il veut noyer le monde. Un peu extrême comme ambition.
Le maître de la terre. Il veut assécher les océans. Il déteste se mouiller.
Le maître du ciel. Il descend pour calmer les deux autres abrutis. La nounou cosmique.
Il exauce les vœux. Attention à ce que vous demandez, il a un sens de l'humour tordu.
Un alien virus. Il change de forme pour mieux vous détruire. Bienvenue sur Terre.
`;
const LORE = LORE_BLOB.trim().split(String.fromCharCode(10));
function loreOf(id){ return (id>=1 && id<=386 && LORE[id-1]) ? LORE[id-1] : ""; }
