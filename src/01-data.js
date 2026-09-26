/* ============================================================
   01 — DONNEES STATIQUES
   ============================================================ */

const TYPE_NAMES = {1:"Normal",2:"Combat",3:"Vol",4:"Poison",5:"Sol",6:"Roche",7:"Insecte",8:"Spectre",
  9:"Acier",10:"Feu",11:"Eau",12:"Plante",13:"Électrik",14:"Psy",15:"Glace",16:"Dragon",17:"Ténèbres",18:"Fée"};

/* table d'efficacite : attaquant -> { defenseur: multiplicateur } (1 par defaut) */
const TYPE_CHART = {
  1:{6:.5,8:0,9:.5},
  2:{1:2,15:2,6:2,17:2,9:2,4:.5,3:.5,14:.5,7:.5,18:.5,8:0},
  3:{2:2,7:2,12:2,6:.5,9:.5,13:.5},
  4:{12:2,18:2,4:.5,5:.5,6:.5,8:.5,9:0},
  5:{4:2,6:2,9:2,10:2,13:2,7:.5,12:.5,3:0},
  6:{3:2,7:2,10:2,15:2,2:.5,5:.5,9:.5},
  7:{12:2,14:2,17:2,2:.5,3:.5,4:.5,8:.5,9:.5,10:.5,18:.5},
  8:{8:2,14:2,17:.5,1:0},
  9:{6:2,15:2,18:2,9:.5,10:.5,11:.5,13:.5},
  10:{7:2,9:2,12:2,15:2,6:.5,10:.5,11:.5,16:.5},
  11:{5:2,6:2,10:2,11:.5,12:.5,16:.5},
  12:{5:2,6:2,11:2,3:.5,4:.5,7:.5,9:.5,10:.5,12:.5,16:.5},
  13:{3:2,11:2,12:.5,13:.5,16:.5,5:0},
  14:{2:2,4:2,9:.5,14:.5,17:0},
  15:{3:2,5:2,12:2,16:2,9:.5,10:.5,11:.5,15:.5},
  16:{16:2,9:.5,18:0},
  17:{8:2,14:2,2:.5,17:.5,18:.5},
  18:{2:2,16:2,17:2,4:.5,9:.5,10:.5}
};
function typeMult(atk, defTypes){
  let m = 1;
  const row = TYPE_CHART[atk] || {};
  for(const d of defTypes) m *= (row[d] !== undefined ? row[d] : 1);
  return m;
}

const RARITY = [
  {n:"Commun",     c:"#8ea3bd", w:1000, coin:[12,22],   xp:14,  integ:.035},
  {n:"Peu commun", c:"#5ce07a", w:430,  coin:[24,46],   xp:26,  integ:.06},
  {n:"Rare",       c:"#4fb2ff", w:160,  coin:[55,120],  xp:50,  integ:.10},
  {n:"Très rare",  c:"#b06bff", w:52,   coin:[140,280], xp:100, integ:.18},
  {n:"Altéré",     c:"#ff8a3d", w:14,   coin:[320,580], xp:200, integ:.32},
  {n:"Légendaire", c:"#ffd24a", w:2,    coin:[850,1500],xp:500, integ:.9}
];

/* ---------- Pokedex ---------- */
const POKE = {};        /* id -> fiche */
const POKE_IDS = [];
(function parseDex(){
  for(const line of DEX_BLOB.trim().split("\n")){
    const p = line.split("|");
    const id = +p[0];
    const evo = p[7] ? p[7].split(";").map(e=>{const q=e.split(":");return {to:+q[0],lvl:+q[1],stone:q[2]||""};}) : [];
    const st = p[3].split(",").map(Number);
    POKE[id] = {
      id, name:p[1], types:p[2].split(",").map(Number),
      hp:st[0], atk:st[1], def:st[2], spa:st[3], spd:st[4], spe:st[5], bst:st.reduce((a,b)=>a+b,0),
      catch:+p[4], gen:+p[5], rar:+p[6], evo, leg:+p[8]
    };
    POKE_IDS.push(id);
  }
  for(const id of POKE_IDS) for(const e of POKE[id].evo) if(POKE[e.to]) POKE[e.to].from = id;
})();

const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
function spriteUrl(id, shiny){
  if(id === 0) return MISSING_SPRITE;
  return SPRITE_BASE + (shiny ? "shiny/" : "") + id + ".png";
}
/* ---------- Regions ---------- */
const REGIONS = [
  {key:"kanto", name:"Kanto",  act:1, from:1,   to:151, need:0,
   desc:"Secteur racine. Le premier fragment du monde a avoir ete ecrit.",
   guardians:[
     {id:146, name:"Sulfura",   need:25, title:"Gardien de la Combustion"},
     {id:144, name:"Artikodin", need:60, title:"Gardien du Gel de Donnees"},
     {id:150, name:"Mewtwo",    need:95, title:"Noyau de Kanto", core:true}
   ]},
  {key:"johto", name:"Johto",  act:2, from:152, to:251, need:95,
   desc:"Couche heritee. Ecrite par-dessus Kanto, jamais nettoyee.",
   guardians:[
     {id:243, name:"Raikou", need:20, title:"Gardien de la Decharge"},
     {id:250, name:"Ho-Oh",  need:55, title:"Gardien de la Reecriture"},
     {id:249, name:"Lugia",  need:85, title:"Noyau de Johto", core:true}
   ]},
  {key:"hoenn", name:"Hoenn",  act:3, from:252, to:386, need:85,
   desc:"Extension instable. Le systeme y a improvise sa propre geographie.",
   guardians:[
     {id:383, name:"Groudon",  need:25, title:"Gardien du Socle"},
     {id:382, name:"Kyogre",   need:60, title:"Gardienne du Flux"},
     {id:384, name:"Rayquaza", need:100,title:"Noyau de Hoenn", core:true}
   ]}
];
function regionOf(id){ return id<=151?"kanto":id<=251?"johto":"hoenn"; }
function regionDef(key){ return REGIONS.find(r=>r.key===key); }

/* ---------- Objets ---------- */
const BALLS = {
  poke:  {name:"Poké Ball",  mult:1.0,  price:18,   cur:"coins", icon:"ball",
          d:"La Ball de base. Suffisante sur les Pokémon communs."},
  super: {name:"Super Ball", mult:1.55, price:42,   cur:"coins", icon:"ball2",
          d:"Prise plus sûre. Sécurise les raretés moyennes et protège la chaîne."},
  hyper: {name:"Hyper Ball", mult:2.20, price:95,   cur:"coins", icon:"ball3",
          d:"Prise agressive. À réserver aux Pokémon rares et altérés."},
  data:  {name:"Data Ball",  mult:1.90, price:9,    cur:"shards",icon:"ball4",
          d:"+60% d'intégrité rendue. Prise solide, payée en Fragments.",
          integBonus:1.6},
  master:{name:"Master Ball",mult:255,  price:14,   cur:"cores", icon:"ball5", d:"Capture garantie. Ecrit directement dans l'archive."},
  safari:{name:"Safari Ball", mult:1.7, price:0, cur:"coins", icon:"ball2", hidden:1,
          d:"Distribuée au Parc Safari, le week-end. Ne sert que là-bas."}
};
const BERRIES = {
  framby:{name:"Baie Framby", price:40,  cur:"coins", d:"+45% de taux de capture sur la prochaine tentative.", eff:"catch"},
  nanab: {name:"Baie Nanab",  price:35,  cur:"coins", d:"La chaîne survit même si l'entité se désindexe.",      eff:"safe"},
  nigma: {name:"Baie Nigma",  price:60,  cur:"coins", d:"Double l'experience de la prochaine capture.",          eff:"xp"},
  sitrus:{name:"Baie Sitrus", price:55,  cur:"coins", d:"Double les PokéCoins de la prochaine capture.",         eff:"coin"},
  micle: {name:"Baie Micle",  price:9,   cur:"shards",d:"Chance de chromatique x3 pendant 15 rencontres.",       eff:"shiny"}
};
/* etiquette courte affichee sous chaque baie : l'effet doit se lire sans ouvrir de fiche */
const BERRY_TAG = {framby:"+45% prise", nanab:"chaîne protégée", nigma:"XP ×2",
                   sitrus:"coins ×2", micle:"chroma ×3"};

const STONES = {
  fire:{name:"Pierre Feu",k:"fire"}, water:{name:"Pierre Eau",k:"water"}, thunder:{name:"Pierre Foudre",k:"thunder"},
  leaf:{name:"Pierre Plante",k:"leaf"}, moon:{name:"Pierre Lune",k:"moon"}, sun:{name:"Pierre Soleil",k:"sun"},
  link:{name:"Câble Link",k:"link"}
};
const STONE_PRICE = 900;

const CHESTS = {
  small:{name:"Archive fragmentée", price:450,  cur:"coins", d:"3 objets aleatoires, faible chance de Fragment rare.", tier:1},
  big:  {name:"Archive scellée",    price:1800, cur:"coins", d:"6 objets : Balls, baies, pierres, et une chance de Noyau.", tier:2},
  void: {name:"Archive du Vide",    price:6,    cur:"cores", d:"Butin de prestige garanti + carte légendaire possible.",tier:3},
  master:{name:"Archive Souveraine",price:22,   cur:"cores", d:"Le meilleur butin du jeu. Master Ball et objet tenu possibles.",tier:4}
};

/* ---------- Attaques generees par type ---------- */
const MOVE_POOL = {};
(function buildMoves(){
  const names = {
    1:["Charge","Vive-Attaque","Coup d'Boule","Frappe Atlas"],
    2:["Balayage","Poing Karaté","Close Combat","Dynamo-Poing"],
    3:["Tornade","Cru-Aile","Aéropique","Rapace"],
    4:["Détritus","Direct Toxik","Bomb-Beurk","Pic Venin"],
    5:["Jet de Sable","Tunnel","Séisme","Pouvoir Antique"],
    6:["Jet-Pierres","Éboulement","Tomberoche","Lame de Roc"],
    7:["Piqûre","Furie Insecte","Dard-Nuée","Mégacorne"],
    8:["Léchouille","Ball'Ombre","Griffe Ombre","Croc Ombre"],
    9:["Griffe Acier","Tête de Fer","Luminocanon","Étincelle Magnétique"],
    10:["Flammèche","Flamme","Lance-Flammes","Déflagration"],
    11:["Pistolet à O","Écume","Surf","Hydrocanon"],
    12:["Fouet Lianes","Tranch'Herbe","Lance-Soleil","Vampigraine"],
    13:["Éclair","Étincelle","Tonnerre","Fatal-Foudre"],
    14:["Choc Mental","Psyko","Rafale Psy","Amnésie Forcée"],
    15:["Éclats Glace","Vent Glace","Laser Glace","Blizzard"],
    16:["Draco-Rage","Draco-Griffe","Draco-Souffle","Colère"],
    17:["Mimi-Queue","Morsure","Vibrobscur","Machination"],
    18:["Charme","Éclat Magique","Force Lunaire","Câlinerie"]
  };
  const pw = [38, 58, 82, 110];
  const acc = [1, .96, .92, .84];
  for(const t in names){
    MOVE_POOL[t] = names[t].map((n,i)=>({name:n, type:+t, pw:pw[i], acc:acc[i], tier:i}));
  }
})();

/* ---------- altérations d'état ---------- */
const STATUS = {
  brn:{n:"Brûlure",   ab:"BRÛ", c:"#ff9d4d", d:"Dégâts en fin de tour, Attaque réduite de moitié."},
  par:{n:"Paralysie", ab:"PAR", c:"#ffe45e", d:"Vitesse réduite, une action sur quatre échoue."},
  psn:{n:"Poison",    ab:"PSN", c:"#d78cff", d:"Dégâts en fin de tour, croissants."},
  slp:{n:"Sommeil",   ab:"SOM", c:"#9fe7f0", d:"Aucune action pendant un à trois tours."}
};
/* chaque type dispose d'une manœuvre : soit une altération, soit une montée de statistique */
const UTILITY_MOVES = {
  1: {name:"Copie",          pw:0, acc:1,   buff:{spe:1.5}},
  2: {name:"Danse Lames",    pw:0, acc:1,   buff:{atk:1.6}},
  3: {name:"Agilité",        pw:0, acc:1,   buff:{spe:1.7}},
  4: {name:"Toxik",          pw:0, acc:.88, st:"psn"},
  5: {name:"Abri Rocheux",   pw:0, acc:1,   buff:{def:1.6}},
  6: {name:"Armure Minérale",pw:0, acc:1,   buff:{def:1.7}},
  7: {name:"Toile Gluante",  pw:0, acc:.92, st:"par"},
  8: {name:"Regard Noir",    pw:0, acc:.75, st:"slp"},
  9: {name:"Blindage",       pw:0, acc:1,   buff:{def:1.6}},
  10:{name:"Danse Flamme",   pw:0, acc:.88, st:"brn"},
  11:{name:"Brume Dense",    pw:0, acc:.9,  st:"slp"},
  12:{name:"Vampigraine",    pw:0, acc:.9,  st:"psn"},
  13:{name:"Cage Éclair",    pw:0, acc:.9,  st:"par"},
  14:{name:"Hypnose",        pw:0, acc:.72, st:"slp"},
  15:{name:"Onde Glacée",    pw:0, acc:.9,  st:"par"},
  16:{name:"Danse Draco",    pw:0, acc:1,   buff:{atk:1.5, spe:1.4}},
  17:{name:"Machination",    pw:0, acc:1,   buff:{atk:1.6}},
  18:{name:"Vœu Soin",       pw:0, acc:1,   heal:.3}
};

/* ============================================================
   ATTAQUE SIGNATURE
   Un combat automatique qui enchaine quatre attaques, des
   alterations, des objets et des talents n'est pas suivable. En
   automatique, chaque Pokemon n'a donc qu'UNE attaque, de son type
   dominant, ameliorable en trois paliers. Les quatre capacites
   restent pour les Data Guardians, que l'on joue a la main.
   ============================================================ */
function signatureMove(p, level, tier){
  const t = p.types[0];
  const pool = MOVE_POOL[t] || MOVE_POOL[1];
  /* le palier vient de l'objet CT s'il y en a un, sinon du niveau */
  const auto = level >= 45 ? 2 : level >= 22 ? 1 : 0;
  const i = clamp(Math.max(auto, (tier || 0)), 0, pool.length - 1);
  return Object.assign({}, pool[i], {tier:i, signature:1});
}
function moveTierName(i){ return ["Base", "Amélioré", "Maîtrisé", "Optimal"][i] || "Base"; }

/* jusqu'a 4 attaques, coherentes avec les types et le niveau */
function movesFor(p, level){
  const tier = level >= 45 ? 3 : level >= 30 ? 2 : level >= 15 ? 1 : 0;
  const out = [];
  for(const t of p.types){
    out.push(MOVE_POOL[t][Math.min(tier, 3)]);
    if(tier >= 2) out.push(MOVE_POOL[t][Math.max(0, tier-2)]);
  }
  out.push(MOVE_POOL[1][Math.min(tier,3)]);
  const seen = new Set(), res = [];
  for(const m of out){ if(!seen.has(m.name)){ seen.add(m.name); res.push(m); } }
  /* a partir du niveau 12, une manœuvre remplace la derniere attaque */
  if(level >= 12){
    const t = p.types[0];
    const u = UTILITY_MOVES[t];
    if(u && !seen.has(u.name)){
      const util = Object.assign({type:t, tier:0, util:true}, u);
      if(res.length >= 4) res[3] = util; else res.push(util);
    }
  }
  return res.slice(0, 4);
}

/* ---------- Succes ---------- */
const ACHIEVEMENTS = [
  {id:"first",   n:"Premier octet",          d:"Restaurer une premiere entite.",                 hid:0, chk:s=>s.stats.catches>=1,        rw:{coins:150}},
  {id:"c50",     n:"Archiviste stagiaire",   d:"50 captures.",                                   hid:0, chk:s=>s.stats.catches>=50,       rw:{coins:600}},
  {id:"c500",    n:"Archiviste titulaire",   d:"500 captures.",                                  hid:0, chk:s=>s.stats.catches>=500,      rw:{cores:2,cos:"title_titulaire"}},
  {id:"c2500",   n:"Conservateur du réel",   d:"2500 captures.",                                 hid:0, chk:s=>s.stats.catches>=2500,     rw:{cores:6,cos:"frame_gold"}},
  {id:"shiny1",  n:"Anomalie chromatique",   d:"Capturer un chromatique.",                       hid:0, chk:s=>s.stats.shinies>=1,        rw:{coins:900,cos:"title_chroma"}},
  {id:"shiny10", n:"Collectionneur d'erreurs",d:"10 chromatiques.",                              hid:0, chk:s=>s.stats.shinies>=10,       rw:{cores:4,cos:"fx_prism"}},
  {id:"streak25",n:"Chaîne stable",          d:"Atteindre une serie de 25.",                     hid:0, chk:s=>s.stats.bestStreak>=25,    rw:{coins:800}},
  {id:"streak100",n:"Flux ininterrompu",     d:"Atteindre une serie de 100.",                    hid:0, chk:s=>s.stats.bestStreak>=100,   rw:{cores:5,cos:"fx_stream"}},
  {id:"dexK",    n:"Kanto restauré",         d:"Completer le Pokédex de Kanto.",                 hid:0, chk:s=>dexCount("kanto")>=151,    rw:{cores:8,cos:"bg_kanto"}},
  {id:"dexJ",    n:"Johto restauré",         d:"Completer le Pokédex de Johto.",                 hid:0, chk:s=>dexCount("johto")>=100,    rw:{cores:8,cos:"bg_johto"}},
  {id:"dexH",    n:"Hoenn restauré",         d:"Completer le Pokédex de Hoenn.",                 hid:0, chk:s=>dexCount("hoenn")>=135,    rw:{cores:8,cos:"bg_hoenn"}},
  {id:"dex100",  n:"Cent entrées",           d:"100 especes distinctes archivees.",              hid:0, chk:s=>dexTotal()>=100,           rw:{coins:1500}},
  {id:"dex386",  n:"Index complet",          d:"Les 386 especes archivees.",                     hid:0, chk:s=>dexTotal()>=386,           rw:{cores:25,cos:"title_index"}},
  {id:"boss1",   n:"Premier verrou",         d:"Vaincre un Data Guardian.",                      hid:0, chk:s=>s.bosses.length>=1,        rw:{coins:1200}},
  {id:"bossAll", n:"Toutes les serrures",    d:"Vaincre les neuf Data Guardians.",               hid:0, chk:s=>s.bosses.length>=9,        rw:{cores:15,cos:"frame_void"}},
  {id:"exp1",    n:"Première sonde",         d:"Terminer une expedition.",                       hid:0, chk:s=>s.stats.expWins>=1,        rw:{shards:60}},
  {id:"exp10",   n:"Cartographe",            d:"Terminer 10 expeditions.",                       hid:0, chk:s=>s.stats.expWins>=10,       rw:{cores:4,cos:"title_sonde"}},
  {id:"pk1",     n:"Première main",          d:"Gagner une partie de Poké-Poker.",               hid:0, chk:s=>s.stats.pokerWins>=1,      rw:{shards:80}},
  {id:"pk8",     n:"Lecteur de motifs",      d:"Gagner 8 parties de Poké-Poker.",                hid:0, chk:s=>s.stats.pokerWins>=8,      rw:{cores:5,cos:"fx_cards"}},
  {id:"idle",    n:"Rêve persistant",        d:"Produire 50 000 d'Energie Onirique.",            hid:0, chk:s=>s.stats.energyTotal>=50000,rw:{cores:3}},
  {id:"rich",    n:"Trésorier",              d:"Detenir 50 000 PokéCoins.",                      hid:0, chk:s=>s.coins>=50000,            rw:{cos:"frame_coin"}},
  {id:"evo10",   n:"Chaîne d'évolution",     d:"Faire evoluer 10 Pokémon.",                      hid:0, chk:s=>s.stats.evolutions>=10,    rw:{coins:1200}},
  {id:"fish50",  n:"Sondeur profond",        d:"50 prises a la peche.",                          hid:0, chk:s=>s.stats.fish>=50,          rw:{shards:70}},
  {id:"login7",  n:"Habitude",               d:"7 jours de connexion d'affilee.",                hid:0, chk:s=>s.login.best>=7,           rw:{cores:2}},
  {id:"login30", n:"Rituel",                 d:"30 jours de connexion d'affilee.",               hid:0, chk:s=>s.login.best>=30,          rw:{cores:10,cos:"title_rituel"}},
  {id:"integ50", n:"Moitié réparée",         d:"Integrite du monde a 50%.",                      hid:0, chk:s=>s.integrity>=50,           rw:{coins:2500}},
  {id:"integ100",n:"Monde cohérent",         d:"Integrite du monde a 100%.",                     hid:0, chk:s=>s.integrity>=100,          rw:{cores:20,cos:"bg_pure"}},
  {id:"skill10",  n:"Main sûre",              d:"10 verrouillages parfaits.",   hid:0, chk:s=>(s.stats.perfect||0)>=10,  rw:{coins:900}},
  {id:"skill50",  n:"Maître du timing",       d:"50 verrouillages parfaits.",   hid:0, chk:s=>(s.stats.perfect||0)>=50,  rw:{cores:2, cos:"fx_prism"}},
  {id:"skill200", n:"Réflexe machine",        d:"200 verrouillages parfaits.",  hid:0, chk:s=>(s.stats.perfect||0)>=200, rw:{cores:6}},
  {id:"region25", n:"Premier quart",          d:"Atteindre 25% dans un secteur.",hid:0,
   chk:s=>REGIONS.some(r=>(s.regionTiers&&(s.regionTiers[r.key]||[]).includes(25))), rw:{coins:1200}},
  {id:"contract10",n:"Sous contrat",          d:"Remplir 10 contrats de secteur.",hid:0,
   chk:s=>(s.stats.contracts||0)>=10, rw:{shards:70}},
  /* caches */
  {id:"h_mn",    n:"Tu n'étais pas censé voir ça", d:"Rencontrer la faille.",                    hid:1, chk:s=>s.flags.sawMissing,        rw:{cos:"title_faille"}},
  {id:"h_fail",  n:"Persévérance",           d:"Echouer 10 captures d'affilee.",                 hid:1, chk:s=>s.flags.fail10,            rw:{coins:400}},
  {id:"h_master",n:"Abus de privilège",      d:"Utiliser une Master Ball sur un Pokémon commun.",hid:1, chk:s=>s.flags.masterWaste,       rw:{cos:"title_gaspilleur"}},
  {id:"h_night", n:"Insomnie",               d:"Jouer entre 3h et 5h du matin.",                 hid:1, chk:s=>s.flags.night,             rw:{cos:"bg_night"}},
  {id:"h_pz",    n:"Ami du programme",       d:"Voir toutes les scenes de Porygon-Z.",           hid:1, chk:s=>s.story.length>=14,        rw:{cos:"frame_pz"}},
  {id:"h_konami", n:"Séquence reconnue",      d:"Entrer un code qui ne vient pas de ce monde.", hid:1,
   chk:s=>s.flags.konami, rw:{cores:5}},
  {id:"h_starters",n:"Le choix initial",       d:"Archiver les neuf premiers partenaires des trois secteurs.", hid:1,
   chk:s=>[1,4,7,152,155,158,252,255,258].every(i=>s.dex[i]), rw:{cores:4, cos:"title_index"}},
  {id:"h_birds",  n:"Trio ailé",               d:"Archiver Artikodin, Électhor et Sulfura.", hid:1,
   chk:s=>[144,145,146].every(i=>s.dex[i]), rw:{cores:5}},
  {id:"h_lv100",  n:"Plafond atteint",         d:"Amener un Pokémon au niveau 100.", hid:1,
   chk:s=>Object.values(s.dex).some(e=>e.lvl >= 100), rw:{cores:6}},
  {id:"h_clean20",n:"Sans une faute",          d:"Vingt captures d'affilée, sans un seul lancer raté.", hid:1,
   chk:s=>(s.stats.bestClean||0) >= 20, rw:{balls:{master:1}}},
  {id:"h_login100",n:"Fidélité",               d:"Cent jours de connexion cumulés.", hid:1,
   chk:s=>(s.login && s.login.total >= 100), rw:{cores:8}},
  {id:"h_karpdeal",n:"Bonne affaire",          d:"Acheter trois Magicarpe au vendeur.", hid:1,
   chk:s=>s.flags.karpSucker, rw:{coins:1500}},
  {id:"h_pika",   n:"La mascotte",            d:"Prendre Pikachu pour compagnon.", hid:1,
   chk:s=>s.flags.pikaBuddy, rw:{coins:2500, cos:"title_titulaire"}},
  {id:"h_masterkarp",n:"Emploi de la force",   d:"Capturer un Magicarpe avec une Master Ball.", hid:1,
   chk:s=>s.flags.masterKarp, rw:{cores:3}},
  {id:"h_fail10", n:"Persévérance",            d:"Rater dix lancers d'affilée sans abandonner.", hid:1,
   chk:s=>(s.stats.worstFail||0) >= 10, rw:{balls:{hyper:10}}},
  {id:"h_karp100",n:"Investissement",          d:"Restaurer cent Magicarpe.", hid:1,
   chk:s=>(s.stats.karp||0) >= 100, rw:{coins:5000}},
  {id:"h_karphand",n:"Banc de sable",          d:"Jouer cinq Magicarpe dans une même main.", hid:1,
   chk:s=>s.flags.karpHand, rw:{cores:4}},
  {id:"h_sixth",  n:"Le sixième objet",        d:"Subir l'effet de bord de la faille.", hid:1,
   chk:s=>s.flags.sixth, rw:{shards:60}},
  {id:"h_name",   n:"Nom reconnu",             d:"Porter un nom que le système avait déjà en mémoire.", hid:1,
   chk:s=>(s.flags.names||[]).length >= 1, rw:{cores:2}},
  {id:"h_names3", n:"Identités multiples",     d:"Porter trois noms reconnus par le système.", hid:1,
   chk:s=>(s.flags.names||[]).length >= 3, rw:{cores:5, cos:"fx_stream"}},
  {id:"h_poke",   n:"Trente fois",             d:"Toucher Porygon-Z jusqu'à ce qu'il cède.", hid:1,
   chk:s=>s.flags.pzPoked, rw:{coins:3000}},
  {id:"h_genmark",n:"Fin de génération",       d:"Atteindre une chaîne de 151, 251 ou 386.", hid:1,
   chk:s=>(s.flags.chainMarks||[]).length >= 1, rw:{cores:3}},
  {id:"h_legend1",n:"Chance inouïe",          d:"Capturer un légendaire au premier lancer.", hid:1,
   chk:s=>s.flags.legendFirst, rw:{cores:3}},
  {id:"h_shiny3", n:"Chaîne dorée",           d:"Trois chromatiques dans une même chaîne.",  hid:1,
   chk:s=>s.flags.shiny3, rw:{cores:4, cos:"fx_prism"}},
  {id:"h_nodisc", n:"Perfectionniste",        d:"Terminer une partie de Poké-Poker sans défausser.", hid:1,
   chk:s=>s.flags.pokerNoDiscard, rw:{cores:4}},
  {id:"h_noheal", n:"Sans filet",             d:"Terminer une expédition sans utiliser de restauration.", hid:1,
   chk:s=>s.flags.expNoHeal, rw:{cores:3, shards:60}},
  {id:"h_sac",   n:"Ce qu'il en coûte",      d:"Atteindre le climax du recit.",                  hid:1, chk:s=>s.flags.climax,            rw:{cores:30,cos:"title_archiviste"}}
];

/* ---------- Cosmetiques ---------- */
const COSMETICS = {
  title_novice:    {t:"title", n:"Utilisateur non identifié", def:1},
  title_titulaire: {t:"title", n:"Archiviste titulaire"},
  title_chroma:    {t:"title", n:"Chasseur d'anomalies"},
  title_index:     {t:"title", n:"Index vivant"},
  title_sonde:     {t:"title", n:"Cartographe des couches"},
  title_rituel:    {t:"title", n:"Présence régulière"},
  title_faille:    {t:"title", n:"A vu la faille"},
  title_gaspilleur:{t:"title", n:"Gaspilleur de privilèges"},
  title_archiviste:{t:"title", n:"L'Archiviste"},
  frame_base:  {t:"frame", n:"Cadre standard", cls:"", def:1},
  frame_gold:  {t:"frame", n:"Cadre doré",     cls:"f-gold"},
  frame_void:  {t:"frame", n:"Cadre du Vide",  cls:"f-void"},
  frame_coin:  {t:"frame", n:"Cadre trésorier",cls:"f-coin"},
  frame_pz:    {t:"frame", n:"Cadre Porygon-Z",cls:"f-corrupt"},
  bg_base:  {t:"bg", n:"Terminal",   css:"linear-gradient(180deg,#0a1120,#070c16)", def:1},
  bg_kanto: {t:"bg", n:"Racine",     css:"linear-gradient(180deg,#12301f,#07160e)"},
  bg_johto: {t:"bg", n:"Héritage",   css:"linear-gradient(180deg,#2b2410,#140f05)"},
  bg_hoenn: {t:"bg", n:"Extension",  css:"linear-gradient(180deg,#0f2436,#06131d)"},
  bg_night: {t:"bg", n:"3h47",       css:"linear-gradient(180deg,#1a0f2b,#0a0614)"},
  bg_pure:  {t:"bg", n:"Cohérence",  css:"linear-gradient(180deg,#0d3a44,#062028)"},
  fx_none:  {t:"fx", n:"Aucun", def:1},
  fx_prism: {t:"fx", n:"Prisme"},
  fx_stream:{t:"fx", n:"Flux continu"},
  fx_cards: {t:"fx", n:"Battage"}
};

/* ---------- Quetes quotidiennes ----------
   Quatre paliers de difficulte. Le tirage compose toujours un bouquet
   equilibre et evite de reproposer les objectifs de la veille. */
const QUEST_POOLS = {
  easy: [
    {id:"q_catch_s",  n:"Restaurer {n} entités",            g:10,   stat:"dayCatch",  rw:{coins:260}},
    {id:"q_throw_s",  n:"Lancer {n} Balls",            g:16,   stat:"dayThrow",  rw:{coins:220}},
    {id:"q_new_s",    n:"Archiver {n} espèces inédites",    g:2,    stat:"dayNew",    rw:{shards:12}},
    {id:"q_streak_s", n:"Atteindre une chaîne de {n}",      g:12,   stat:"dayStreak", rw:{coins:300}},
    {id:"q_fish_s",   n:"Remonter {n} prises à la pêche",             g:4,    stat:"dayFish",   rw:{shards:10}},
    {id:"q_energy_s", n:"Forer {n} d'Énergie",          g:500,  stat:"dayEnergy", rw:{coins:240}}
  ],
  medium: [
    {id:"q_catch_m",  n:"Restaurer {n} entités",            g:28,   stat:"dayCatch",  rw:{coins:620}},
    {id:"q_rare_m",   n:"Capturer {n} Pokémon rares ou plus",g:5,   stat:"dayRare",   rw:{coins:700}},
    {id:"q_new_m",    n:"Archiver {n} espèces inédites",    g:5,    stat:"dayNew",    rw:{shards:26}},
    {id:"q_streak_m", n:"Atteindre une chaîne de {n}",      g:30,   stat:"dayStreak", rw:{coins:760, berries:{micle:1}}},
    {id:"q_spend_m",  n:"Dépenser {n} PokéCoins",           g:2500, stat:"daySpend",  rw:{coins:900}},
    {id:"q_poker_m",  n:"Encaisser {n} manches de Poké-Poker",g:5,  stat:"dayPokerBlinds", rw:{shards:28}},
    {id:"q_evo_m",    n:"Faire évoluer {n} Pokémon",        g:2,    stat:"dayEvo",    rw:{coins:800}},
    {id:"q_fish_m",   n:"Remonter {n} prises à la pêche",             g:10,   stat:"dayFish",   rw:{shards:22}}
  ],
  hard: [
    {id:"q_catch_h",  n:"Restaurer {n} entités",            g:55,   stat:"dayCatch",  rw:{coins:1400}},
    {id:"q_rare_h",   n:"Capturer {n} Pokémon rares ou plus",g:12,  stat:"dayRare",   rw:{coins:1600, shards:20}},
    {id:"q_streak_h", n:"Atteindre une chaîne de {n}",      g:60,   stat:"dayStreak", rw:{cores:1}},
    {id:"q_exp_h",    n:"Terminer {n} expédition(s)",       g:2,    stat:"dayExp",    rw:{shards:60}},
    {id:"q_poker_h",  n:"Encaisser {n} manches de Poké-Poker",g:12, stat:"dayPokerBlinds", rw:{shards:55}},
    {id:"q_new_h",    n:"Archiver {n} espèces inédites",    g:9,    stat:"dayNew",    rw:{shards:50}},
    {id:"q_energy_h", n:"Forer {n} d'Énergie",          g:9000, stat:"dayEnergy", rw:{coins:1500}}
  ],
  expert: [
    {id:"q_catch_x",  n:"Restaurer {n} entités",            g:100,  stat:"dayCatch",  rw:{coins:3000, cores:1}},
    {id:"q_streak_x", n:"Atteindre une chaîne de {n}",      g:120,  stat:"dayStreak", rw:{cores:2}},
    {id:"q_boss_x",   n:"Affronter {n} Data Guardian(s)",   g:2,    stat:"dayBoss",   rw:{cores:2}},
    {id:"q_exp_x",    n:"Terminer {n} expéditions",         g:3,    stat:"dayExp",    rw:{shards:120, cores:1}},
    {id:"q_rare_x",   n:"Capturer {n} Pokémon rares ou plus",g:25,  stat:"dayRare",   rw:{cores:1, shards:70}},
    {id:"q_evo_x",    n:"Faire évoluer {n} Pokémon",        g:5,    stat:"dayEvo",    rw:{shards:80}}
  ]
};
/* composition du bouquet selon le niveau d'Archiviste */
function questMix(level){
  if(level < 8)  return ["easy","easy","easy","medium"];
  if(level < 16) return ["easy","easy","medium","medium"];
  if(level < 26) return ["easy","medium","medium","hard"];
  if(level < 40) return ["medium","medium","hard","hard"];
  return ["medium","hard","hard","expert"];
}

/* ---------- Evenements a duree limitee ---------- */
const EVENT_TYPES = [
  {id:"ev_coin",  n:"Surcharge économique", d:"PokéCoins x2 sur chaque capture.",            dur:60},
  {id:"ev_shiny", n:"Instabilité chromatique", d:"Chance de chromatique x2.5.",              dur:45},
  {id:"ev_xp",    n:"Compilation rapide",   d:"Expérience x2.",                              dur:60},
  {id:"ev_rare",  n:"Fuite de données rares",d:"Rencontres rares beaucoup plus fréquentes.", dur:30},
  {id:"ev_shard", n:"Extraction de fragments",d:"Chaque capture donne 1 Fragment.",          dur:45}
];
