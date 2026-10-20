/* ============================================================
   61 — POKÉ-POKER · LE CONTENU
   Retour de jeu : « pas assez attrayant ». Côté contenu :
     · des ADVERSAIRES : chaque verrou est tenu par un dresseur, avec son
       portrait et ses répliques ; le verrou de secteur de chaque ante est
       un Champion d'arène de Kanto, avec une règle à son image (Pierre et
       sa Défense Roc, Ondine et son Torrent, Major Bob et sa Paralysie…),
       puis le Conseil des Quatre et Régis, Champion de la Couche ;
     · une combinaison nouvelle, la SUITE POKÉDEX (cinq numéros consécutifs :
       les lignées d'évolution se suivent dans le Pokédex) ;
     · des PROGRAMMES QUI ÉVOLUENT : Salamèche.exe devient Reptincel.exe
       puis Dracaufeu.exe à force de marquer des cartes Feu ; Magicarpe.exe
       ne sert à rien… jusqu'à devenir Léviator.exe ; Évoli.exe choisit son
       évolution selon votre jeu ;
     · une douzaine de programmes nouveaux, aux couleurs de leur Pokémon ;
     · une progression d'une partie à l'autre : la vitrine des badges des
       Champions battus, et la Programmathèque des programmes découverts.
   ============================================================ */

/* ---------- les dresseurs des petits et grands verrous ---------- */
const PK_FOLKS = [
  {cls:"youngster",      t:"Gamin",          hi:"Mes cartes sont les meilleures, j'te jure !",           lo:"C'est pas juste, j'avais presque une paire !"},
  {cls:"bug_catcher",    t:"Scout",          hi:"J'ai capturé toutes ces cartes moi-même.",              lo:"Mes Chenipan n'étaient pas prêts…"},
  {cls:"swimmer_m",      t:"Nageur",         hi:"On plonge ? Le premier qui coule a perdu.",              lo:"Glou… J'ai bu la tasse."},
  {cls:"juggler",        t:"Jongleur",       hi:"Je fais tourner les cartes plus vite que tes yeux.",    lo:"J'en ai fait tomber une. Ou cinq."},
  {cls:"burglar",        t:"Cambrioleur",    hi:"Je prendrai juste tes Octets. Et ta main, peut-être.",  lo:"Bon… je repasserai par la fenêtre."},
  {cls:"rocker",         t:"Rockeur",        hi:"Monte le son ! Les cartes, ça se joue fort.",           lo:"Rappel annulé."},
  {cls:"gentleman",      t:"Gentleman",      hi:"Une partie entre gens de bonne compagnie, voulez-vous ?", lo:"Touché. Avec élégance, je dois le dire."},
  {cls:"beauty",         t:"Canon",          hi:"Ne me regarde pas, regarde tes cartes.",                lo:"Tu as de beaux jeux, je l'admets."},
  {cls:"psychic_m",      t:"Médium",         hi:"Je connais déjà ta prochaine main.",                    lo:"Je ne l'avais pas vue venir, celle-là."},
  {cls:"scientist",      t:"Scientifique",   hi:"Probabilité de ta victoire : 12,4 %.",                  lo:"Je… je dois revoir mes calculs."},
  {cls:"engineer",       t:"Ingénieur",      hi:"Ce deck est calibré au micron.",                        lo:"Court-circuit. Je recâble tout."},
  {cls:"hiker",          t:"Montagnard",     hi:"Les cartes, c'est comme les montagnes : on grimpe.",    lo:"Éboulement ! J'ai tout perdu."},
  {cls:"black_belt",     t:"Karatéka",       hi:"Hiya ! Mes mains frappent fort.",                       lo:"Ma garde était trop basse."},
  {cls:"bird_keeper",    t:"Ornithologue",   hi:"Mes cartes volent au-dessus des tiennes.",              lo:"Plumé."},
  {cls:"channeler",      t:"Exorciste",      hi:"Les esprits m'ont soufflé ton jeu…",                    lo:"Les esprits m'ont menti."},
  {cls:"kindler",        t:"Allumeur",       hi:"Je vais mettre le feu à la table.",                     lo:"Éteint. Complètement éteint."},
  {cls:"ruin_maniac",    t:"Fana de ruines", hi:"Ces cartes sont plus vieilles que la couche elle-même.", lo:"Encore une relique de perdue."},
  {cls:"aroma_lady",     t:"Fleuriste",      hi:"Respire. Et joue ta main, tranquillement.",             lo:"Fanée… Mais ça repousse."},
  {cls:"cool_trainer_m", t:"Topdresseur",    hi:"Je ne perds pas. Jamais deux fois.",                    lo:"Une fois. Tu ne l'auras qu'une fois."},
  {cls:"cool_trainer_f", t:"Topdresseuse",   hi:"Tu es arrivé jusqu'ici ? Pas mal.",                     lo:"Bien joué. Vraiment."},
  {cls:"expert_f",       t:"Experte",        hi:"Montre-moi ce que vaut ta lecture du jeu.",             lo:"Ta lecture était juste. La mienne, non."},
  {cls:"dragon_tamer",   t:"Dompteur",       hi:"Mes cartes ont des crocs.",                             lo:"Les dragons sont rentrés dans leur antre."}
];
const PK_NAMES = ["Léo","Jules","Noé","Lina","Inès","Hugo","Zoé","Max","Théo","Luce","Arno","Mila","Sacha","Nina","Yanis","Elsa","Malo","Rose","Tom","Lou","Basile","Jade","Gaspard","Alba"];
/* les verrous de secteur : un Champion d'arène par ante, sa règle à son image */
const PK_LEADER_RULES = {
  brock:   {r:"Défense Roc",   d:"Les cartes qui ne sont ni Roche ni Sol ne marquent que la moitié de leurs Jetons.", f:{half:[6, 5]},
            hi:"Ma défense est solide comme le roc. Tes cartes vont s'y briser.", lo:"Je n'aurais pas cru… Ce badge est à toi."},
  misty:   {r:"Torrent",       d:"Après chaque main, deux cartes de votre main sont emportées par le courant.", f:{wash:2},
            hi:"Ma table est une piscine. Sais-tu seulement nager ?", lo:"Tu m'as noyée sous les combinaisons !"},
  lt_surge:{r:"Paralysie",     d:"Une carte sur quatre arrive paralysée : impossible de la jouer ou de la défausser.", f:{para:0.25},
            hi:"Tu tiens sur tes jambes ? Plus pour longtemps, soldat !", lo:"Wow ! Tu es électrisant, gamin."},
  erika:   {r:"Poudre Dodo",   d:"Votre programme le plus à gauche dort pendant tout le verrou.", f:{sleep:1},
            hi:"Oh… Bonjour. Je m'étais assoupie. Jouons doucement.", lo:"Vous jouez avec une grâce… florale."},
  koga:    {r:"Toxik",         d:"Chaque main jouée empoisonne la suivante : −1 Mult de base à chaque fois.", f:{toxic:1},
            hi:"Le poison agit lentement. Mais il agit toujours.", lo:"Fufufu… Tu as l'étoffe d'un ninja."},
  sabrina: {r:"Prémonition",   d:"Vos cartes arrivent face cachée : on ne les découvre qu'en les touchant.", f:{faceDown:1},
            hi:"J'ai vu ta défaite. Tu ne verras même pas tes cartes.", lo:"Je ne l'avais pas prévu… Je l'accepte."},
  blaine:  {r:"Fournaise",     d:"Aucune défausse : tout brûle. En échange, une main de plus.", f:{noDisc:1},
            hi:"Ouah ! Tu as osé entrer dans ma fournaise ? Brûlons ensemble !", lo:"J'ai fondu… Tu as gagné la partie !"},
  giovanni:{r:"La Maison gagne toujours", d:"Score requis +60 %. Mais chaque main jouée vous rapporte un Octet.", f:{target:1.6, handOctet:1},
            hi:"Cette salle de jeux m'appartient. Comme tout ce qui s'y gagne.", lo:"Hmph. Profite de ce badge. La maison se souviendra de toi."},
  lorelei: {r:"Gel",           d:"La première carte de chaque main est gelée : elle ne marque pas.", f:{firstDead:1},
            hi:"Personne ne joue au chaud contre moi.", lo:"Tu as fait fondre la glace."},
  bruno:   {r:"Force brute",   d:"Les mains de moins de quatre cartes ne marquent rien.", f:{minCards:4},
            hi:"Montre-moi des mains pleines ! Le reste, je l'écrase.", lo:"Ta force… Je la respecte."},
  agatha:  {r:"Malédiction",   d:"La carte la plus forte de chaque main est maudite : elle ne marque pas.", f:{cursed:1},
            hi:"Hé hé… Mes spectres adorent les belles cartes.", lo:"Tu as de la ressource, gamin. Ça me plaît."},
  lance:   {r:"Colère",        d:"Chaque main doit battre la précédente, sinon elle ne marque rien.", f:{beat:1},
            hi:"Les dragons ne reculent jamais. Chaque coup doit être plus fort.", lo:"Je me suis incliné. Le Champion t'attend."}
};
const PK_LEADER_ORDER = ["brock", "misty", "lt_surge", "erika", "koga", "sabrina", "blaine", "giovanni"];
const PK_ELITE_ORDER = ["lorelei", "bruno", "agatha", "lance"];
function pkLeaderInfo(key){
  const L = (typeof LEADERS !== "undefined" ? LEADERS : []).find(l=>l[0] === key);
  return L ? {key, cls:L[1], type:L[2], name:L[3]} : {key, cls:"cool_trainer_m", type:1, name:key};
}
/* un tirage stable : la même partie donne les mêmes adversaires */
function pkHash(a, b, c){ let h = (Math.imul(a | 0, 2654435761) ^ Math.imul(b | 0, 40503) ^ Math.imul(c | 0, 2246822519)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h ^ (h >>> 13)) >>> 0; }
/* l'adversaire d'un verrou */
function pkOpp(P, blind){
  P = P || S.poker;
  const st = P.stage || "ante", b = blind === undefined ? P.blind : blind;
  const key = st + ":" + (st === "elite" ? (P.eliteIdx || 0) : P.ante) + ":" + b;
  P.opps = P.opps || {};
  if(P.opps[key]) return P.opps[key];
  let o;
  const seed = P.seed || 7;
  if(st === "champion"){
    /* deux règles du Conseil, tirées au sort : il a tout appris de ses aînés */
    const i = pkHash(seed, P.ante, 3) % 4, k = (i + 1 + pkHash(seed, P.ante, 9) % 3) % 4;
    const a = PK_LEADER_RULES[PK_ELITE_ORDER[i]], c = PK_LEADER_RULES[PK_ELITE_ORDER[k]];
    o = {kind:"champion", cls:"cool_trainer_m", name:"Régis", title:"Champion de la Couche", type:16, boss:true,
      rule:{r:a.r + " + " + c.r, d:a.d + " Et : " + c.d.charAt(0).toLowerCase() + c.d.slice(1), f:Object.assign({}, a.f, c.f, {target:1.15})},
      hi:"Alors c'est toi. Tout le monde parle de toi, dans la couche. Voyons si c'est mérité.", lo:"…Je n'ai rien à redire. Tu es le meilleur joueur de cette couche."};
  } else if(st === "elite"){
    const k = PK_ELITE_ORDER[(P.eliteIdx || 0) % 4], L = pkLeaderInfo(k), R = PK_LEADER_RULES[k];
    o = {kind:"elite", cls:L.cls, name:L.name, title:"Conseil des Quatre", type:L.type, boss:true, rule:R, hi:R.hi, lo:R.lo, leader:k};
  } else if(b === 2 && P.ante <= 8){
    const k = PK_LEADER_ORDER[(P.ante - 1) % 8], L = pkLeaderInfo(k), R = PK_LEADER_RULES[k];
    o = {kind:"leader", cls:L.cls, name:L.name, title:"Champion d'arène", type:L.type, boss:true, rule:R, hi:R.hi, lo:R.lo, leader:k, badge:P.ante - 1};
  } else if(b === 2){
    /* la Couche Zéro : un verrou générique, ou la revanche d'un Champion */
    const h = pkHash(seed, P.ante, 77);
    if(h % 2){
      const k = PK_LEADER_ORDER[h % 8], L = pkLeaderInfo(k), R = PK_LEADER_RULES[k];
      o = {kind:"leader", cls:L.cls, name:L.name, title:"Revanche", type:L.type, boss:true, rule:R, hi:"La revanche. J'attendais ce moment.", lo:R.lo, leader:k};
    } else {
      const B = BOSS_BLINDS[h % BOSS_BLINDS.length], F = PK_FOLKS[(h >>> 3) % PK_FOLKS.length];
      o = {kind:"sector", cls:F.cls, name:PK_NAMES[(h >>> 5) % PK_NAMES.length], title:"Gardien du secteur", type:1, boss:true,
        rule:{r:B.n, d:B.d, f:B.f, id:B.id}, hi:"Ce secteur est verrouillé. Et j'ai la clé.", lo:"Le verrou cède. Pour cette fois."};
    }
  } else {
    /* les dresseurs ordinaires : des plus simples aux plus aguerris, au fil des antes */
    const h = pkHash(seed, P.ante * 3 + b, 11);
    const span = Math.min(PK_FOLKS.length, 6 + P.ante * 3), F = PK_FOLKS[h % span];
    o = {kind:"folk", cls:F.cls, name:PK_NAMES[(h >>> 4) % PK_NAMES.length], title:F.t, type:1, boss:false, rule:null, hi:F.hi, lo:F.lo};
  }
  P.opps[key] = o;
  return o;
}
/* le verrou de secteur, au format du moteur */
function pkBossFor(P){
  const o = pkOpp(P);
  if(!o.rule) return null;
  return {id:o.rule.id || ("L_" + (o.leader || o.kind)), n:o.rule.r, d:o.rule.d, f:o.rule.f, opp:true};
}

/* ---------- la suite Pokédex ---------- */
/* Porygon · Raccourci : quatre cartes suffisent pour le Mono-Type et la Suite */
function pkShortcut(){ try { return !!(S.poker && S.poker.jokers.some(j=>jokerDef(j) && jokerDef(j).passive === "shortcut")); } catch(e){ return false; } }
function pkSuite(cs){
  const need = pkShortcut() ? 4 : 5;
  const byId = new Map(); for(const c of cs) if(!byId.has(c.id)) byId.set(c.id, c);
  const ids = [...byId.keys()].sort((a, b)=>a - b);
  for(let i = 0; i + need - 1 < ids.length; i++){
    let ok = true;
    for(let k = 1; k < need; k++) if(ids[i + k] !== ids[i] + k){ ok = false; break; }
    if(ok){ const run = ids.slice(i, i + need); if(ids[i + need] === ids[i] + need) run.push(ids[i + need]); return run.slice(0, 5).map(id=>byId.get(id)); }
  }
  return null;
}
HANDS.splice(HANDS.findIndex(h=>h.id === "pokeball") + 1, 0,
  {id:"suite", n:"Suite Pokédex", chips:65, mult:6,
   d:"Cinq numéros du Pokédex qui se suivent (les lignées d'évolution se suivent dans le Pokédex).", f:pkSuite});
HANDS_BY_ID.suite = HANDS.find(h=>h.id === "suite");
PLANETS.push({id:"pl_suite", n:"Orbe Hauméa", hand:"suite", cost:7});
/* le Mono-Type, avec Raccourci, se contente de quatre cartes */
(function(){
  const mono = HANDS.find(h=>h.id === "monotype"), f0 = mono.f;
  mono.f = cs=>{
    if(!pkShortcut()) return f0(cs);
    if(cs.length < 4) return null;
    for(let t = 1; t <= 18; t++){ const m = cs.filter(c=>POKE[c.id].types.includes(t)); if(m.length >= 4) return m.slice(0, 5); }
    return null;
  };
})();

/* ---------- des programmes aux couleurs de leur Pokémon ---------- */
const PK_TY = (c, t)=>POKE[c.id].types.includes(t);
const PK_NEW_JOKERS = [
  {id:"j_ronflex",  n:"Ronflex · Repos",       rar:1, cost:7, spr:143, d:"×2 Mult tant qu'aucune défausse n'a été utilisée pendant la manche.",
   onHand:x=>{ if(!x.st.discardedThisRound) x.mult *= 2; }},
  {id:"j_metamorph",n:"Métamorph · Morphing",  rar:2, cost:9, spr:132, d:"La carte qui rapporte le plus de Jetons marque une seconde fois.",
   onHand:x=>{ const b = x.scored.reduce((m, c)=>!m || cardChips(c) > cardChips(m) ? c : m, null); if(b) x.chips += cardChips(b); }},
  {id:"j_leveinard",n:"Leveinard · Œuf Chance",rar:1, cost:6, spr:113, d:"+3 Octets à chaque verrou franchi.", passive:"econ3"},
  {id:"j_miaouss",  n:"Miaouss · Jackpot",     rar:0, cost:5, spr:52,  d:"+1 Octet chaque fois qu'une main contenant une paire est jouée.",
   onAfter:(res)=>{ try { const ids = res.played.map(c=>c.id); if(new Set(ids).size < ids.length) S.poker.octets++; } catch(e){} }},
  {id:"j_onix",     n:"Onix · Armure",         rar:0, cost:5, spr:95,  d:"+60 Jetons si la main contient un Pokémon Roche ou Sol.",
   onHand:x=>{ if(x.played.some(c=>PK_TY(c, 6) || PK_TY(c, 5))) x.chips += 60; }},
  {id:"j_mime",     n:"M. Mime · Mur Lumière", rar:1, cost:7, spr:122, d:"×2 Mult pour la dernière main de la manche.",
   onHand:x=>{ if(x.st.handsLeft === 1) x.mult *= 2; }},
  {id:"j_smogo",    n:"Smogo · Purée",         rar:0, cost:4, spr:109, d:"+4 Mult par carte de type Poison.", onCard:(c, x)=>{ if(PK_TY(c, 4)) x.mult += 4; }},
  {id:"j_insecateur",n:"Insécateur · Taillade",rar:0, cost:4, spr:123, d:"+4 Mult par carte de type Insecte.", onCard:(c, x)=>{ if(PK_TY(c, 7)) x.mult += 4; }},
  {id:"j_machoc",   n:"Machoc · Poing Karaté", rar:0, cost:4, spr:66,  d:"+22 Jetons par carte de type Combat.", onCard:(c, x)=>{ if(PK_TY(c, 2)) x.chips += 22; }},
  {id:"j_kangourex",n:"Kangourex · Portée",    rar:1, cost:6, spr:115, d:"Les cartes non évoluées rapportent deux fois leurs Jetons.",
   onCard:(c, x)=>{ if(stageOf(c.id) === 0) x.chips += cardChips(c); }},
  {id:"j_porygon",  n:"Porygon · Raccourci",   rar:2, cost:8, spr:137, d:"Le Mono-Type et la Suite Pokédex se forment avec quatre cartes.", passive:"shortcut"},
  {id:"j_pikachu",  n:"Pikachu · Statik",      rar:1, cost:7, spr:25,  d:"+1 Mult par carte Électrik de votre deck.",
   onHand:x=>{ x.mult += x.st.deck.filter(c=>PK_TY(c, 13)).length; }},
  {id:"j_lokhlass", n:"Lokhlass · Chant",      rar:1, cost:7, spr:131, d:"+30 Jetons par main qu'il vous reste après celle-ci.",
   onHand:x=>{ x.chips += 30 * Math.max(0, x.st.handsLeft - 1); }}
];
/* ---------- les programmes qui évoluent ----------
   evo.need : la condition ; evo.gain(res, j) : ce que rapporte une main jouée ;
   evo.round : ce que rapporte un verrou franchi. */
const PK_COUNT = (res, t)=>res.scored.filter(c=>PK_TY(c, t)).length;
const PK_EVO_JOKERS = [
  {id:"j_salameche", n:"Salamèche.exe", rar:1, cost:6, spr:4, d:"+3 Mult par carte Feu.", onCard:(c, x)=>{ if(PK_TY(c, 10)) x.mult += 3; },
   evo:{to:"j_reptincel", need:10, what:"cartes Feu marquées", gain:res=>PK_COUNT(res, 10)}},
  {id:"j_reptincel", n:"Reptincel.exe", rar:2, cost:9, spr:5, evoOnly:1, d:"+6 Mult par carte Feu.", onCard:(c, x)=>{ if(PK_TY(c, 10)) x.mult += 6; },
   evo:{to:"j_dracaufeu", need:18, what:"cartes Feu marquées", gain:res=>PK_COUNT(res, 10)}},
  {id:"j_dracaufeu", n:"Dracaufeu.exe", rar:3, cost:14, spr:6, evoOnly:1, d:"×1.3 Mult par carte Feu.", onCard:(c, x)=>{ if(PK_TY(c, 10)) x.mult *= 1.3; }},
  {id:"j_bulbizarre",n:"Bulbizarre.exe", rar:1, cost:6, spr:1, d:"+15 Jetons par carte Plante.", onCard:(c, x)=>{ if(PK_TY(c, 12)) x.chips += 15; },
   evo:{to:"j_herbizarre", need:10, what:"cartes Plante marquées", gain:res=>PK_COUNT(res, 12)}},
  {id:"j_herbizarre",n:"Herbizarre.exe", rar:2, cost:9, spr:2, evoOnly:1, d:"+30 Jetons par carte Plante.", onCard:(c, x)=>{ if(PK_TY(c, 12)) x.chips += 30; },
   evo:{to:"j_florizarre", need:18, what:"cartes Plante marquées", gain:res=>PK_COUNT(res, 12)}},
  {id:"j_florizarre",n:"Florizarre.exe", rar:3, cost:14, spr:3, evoOnly:1, d:"+45 Jetons et +3 Mult par carte Plante.", onCard:(c, x)=>{ if(PK_TY(c, 12)){ x.chips += 45; x.mult += 3; } }},
  {id:"j_carapuce",  n:"Carapuce.exe", rar:1, cost:6, spr:7, d:"+2 Mult par carte Eau.", onCard:(c, x)=>{ if(PK_TY(c, 11)) x.mult += 2; },
   evo:{to:"j_carabaffe", need:10, what:"cartes Eau marquées", gain:res=>PK_COUNT(res, 11)}},
  {id:"j_carabaffe", n:"Carabaffe.exe", rar:2, cost:9, spr:8, evoOnly:1, d:"+4 Mult par carte Eau.", onCard:(c, x)=>{ if(PK_TY(c, 11)) x.mult += 4; },
   evo:{to:"j_tortank", need:18, what:"cartes Eau marquées", gain:res=>PK_COUNT(res, 11)}},
  {id:"j_tortank",   n:"Tortank.exe", rar:3, cost:14, spr:9, evoOnly:1, d:"×1.25 Mult par carte Eau.", onCard:(c, x)=>{ if(PK_TY(c, 11)) x.mult *= 1.25; }},
  {id:"j_magicarpe", n:"Magicarpe.exe", rar:0, cost:3, spr:129, d:"Trempette. Il ne se passe rien… pour l'instant.",
   onHand:()=>{}, evo:{to:"j_leviator", need:5, what:"verrous franchis", round:1}},
  {id:"j_leviator",  n:"Léviator.exe", rar:3, cost:16, spr:130, evoOnly:1, d:"×3 Mult. Il a enfin compris.", onHand:x=>{ x.mult *= 3; }},
  {id:"j_abra",      n:"Abra.exe", rar:1, cost:6, spr:63, d:"+6 Mult si la main contient un Pokémon Psy.", onHand:x=>{ if(x.played.some(c=>PK_TY(c, 14))) x.mult += 6; },
   evo:{to:"j_kadabra", need:6, what:"mains jouées avec un Psy", gain:res=>res.played.some(c=>PK_TY(c, 14)) ? 1 : 0}},
  {id:"j_kadabra",   n:"Kadabra.exe", rar:2, cost:9, spr:64, evoOnly:1, d:"+12 Mult si la main contient un Pokémon Psy.", onHand:x=>{ if(x.played.some(c=>PK_TY(c, 14))) x.mult += 12; },
   evo:{to:"j_alakazam", need:10, what:"mains jouées avec un Psy", gain:res=>res.played.some(c=>PK_TY(c, 14)) ? 1 : 0}},
  {id:"j_alakazam",  n:"Alakazam.exe", rar:3, cost:14, spr:65, evoOnly:1, d:"×2 Mult si la main contient un Pokémon Psy.", onHand:x=>{ if(x.played.some(c=>PK_TY(c, 14))) x.mult *= 2; }},
  {id:"j_fantominus",n:"Fantominus.exe", rar:1, cost:6, spr:92, d:"+2 Mult par carte restée en main.", onHand:x=>{ x.mult += 2 * x.inHandLeft; },
   evo:{to:"j_spectrum", need:8, what:"mains jouées", gain:()=>1}},
  {id:"j_spectrum",  n:"Spectrum.exe", rar:2, cost:9, spr:93, evoOnly:1, d:"+3 Mult par carte restée en main.", onHand:x=>{ x.mult += 3 * x.inHandLeft; },
   evo:{to:"j_ectoplasma", need:12, what:"mains jouées", gain:()=>1}},
  {id:"j_ectoplasma",n:"Ectoplasma.exe", rar:3, cost:14, spr:94, evoOnly:1, d:"×(1 + 0,12 par carte restée en main) Mult.", onHand:x=>{ x.mult *= 1 + 0.12 * x.inHandLeft; }},
  {id:"j_evoli",     n:"Évoli.exe", rar:2, cost:8, spr:133, d:"+3 Mult par type différent dans la main. Il évoluera selon votre jeu.",
   onHand:x=>{ const t = new Set(); x.played.forEach(c=>POKE[c.id].types.forEach(v=>t.add(v))); x.mult += 3 * t.size; },
   evo:{to:j=>{ const c = j.tc || {}; const best = [[10, "j_pyroli"], [11, "j_aquali"], [13, "j_voltali"]].sort((a, b)=>(c[b[0]] || 0) - (c[a[0]] || 0))[0]; return best[1]; },
        need:6, what:"mains jouées avec trois types ou plus",
        gain:(res, j)=>{ j.tc = j.tc || {}; for(const t of [10, 11, 13]) j.tc[t] = (j.tc[t] || 0) + PK_COUNT(res, t);
          const s = new Set(); res.played.forEach(c=>POKE[c.id].types.forEach(v=>s.add(v))); return s.size >= 3 ? 1 : 0; }}},
  {id:"j_pyroli",    n:"Pyroli.exe", rar:3, cost:14, spr:136, evoOnly:1, d:"×1.5 Mult par carte Feu.", onCard:(c, x)=>{ if(PK_TY(c, 10)) x.mult *= 1.5; }},
  {id:"j_aquali",    n:"Aquali.exe", rar:3, cost:14, spr:134, evoOnly:1, d:"+60 Jetons par carte Eau.", onCard:(c, x)=>{ if(PK_TY(c, 11)) x.chips += 60; }},
  {id:"j_voltali",   n:"Voltali.exe", rar:3, cost:14, spr:135, evoOnly:1, d:"+8 Mult par carte Électrik.", onCard:(c, x)=>{ if(PK_TY(c, 13)) x.mult += 8; }}
];
for(const j of PK_NEW_JOKERS.concat(PK_EVO_JOKERS)) JOKERS.push(j);

/* une main jouée, un verrou franchi : les programmes avancent vers leur évolution */
function pkEvoTick(P, res, round){
  P.evoQ = P.evoQ || [];
  for(const j of P.jokers){
    const def = jokerDef(j);
    if(!def || !def.evo) continue;
    const g = round ? (def.evo.round || 0) : (def.evo.gain ? def.evo.gain(res, j) : 0);
    if(!g) continue;
    j.xp = (j.xp || 0) + g;
    if(j.xp >= def.evo.need){
      const to = typeof def.evo.to === "function" ? def.evo.to(j) : def.evo.to;
      if(!JOKERS.find(x=>x.id === to)) continue;
      P.evoQ.push({from:def.id, to});
      j.id = to; j.xp = 0;
      pkSeen(to);
    }
  }
}
/* la Programmathèque : ce qu'on a déjà vu passer */
function pkSeen(id){
  S.pokerMeta = S.pokerMeta || {};
  const L = S.pokerMeta.seenJ = S.pokerMeta.seenJ || [];
  if(!L.includes(id)) L.push(id);
}
/* la vitrine : les Champions battus, d'une partie à l'autre */
function pkLeaderBeaten(key){
  S.pokerMeta = S.pokerMeta || {};
  const L = S.pokerMeta.leaders = S.pokerMeta.leaders || [];
  if(L.includes(key)) return false;
  L.push(key);
  return true;
}
