/* ============================================================
   77 — SECRETS
   Un clin d'oeil qui se contente de citer vieillit mal. Ceux-ci
   partent tous d'une anomalie reelle des jeux d'origine, et la
   fiction du fichier corrompu les explique au lieu de les subir.
   ============================================================ */

/* ---------- 1. LE SIXIÈME OBJET ----------
   Rencontrer MissingNo multipliait par 128 le sixieme objet du sac
   dans Rouge et Bleu. C'est la citation la plus fidele qu'on puisse
   faire : ici la faille produit exactement le meme effet, et
   Porygon-Z pretend le reparer. */
const SIXTH_SLOTS = [
  {k:"balls",   id:"super"}, {k:"balls",   id:"hyper"},
  {k:"berries", id:"framby"},{k:"berries", id:"nanab"},
  {k:"berries", id:"sitrus"},{k:"berries", id:"micle"},
  {k:"items",   id:"potion"},{k:"stones",  id:"fire"}
];
/* le « sixieme » emplacement, au sens du sac : on prend le sixieme
   non vide, et a defaut le premier qu'on trouve */
function sixthItem(){
  const filled = SIXTH_SLOTS.filter(s=>{
    const bag = s.k === "items" ? S.items : s.k === "balls" ? S.balls
              : s.k === "berries" ? S.berries : S.stones;
    return (bag[s.id] || 0) > 0;
  });
  if(!filled.length) return null;
  return filled[Math.min(5, filled.length - 1)];
}
function glitchSixthItem(){
  const slot = sixthItem();
  if(!slot) return null;
  const bag = slot.k === "items" ? S.items : slot.k === "balls" ? S.balls
            : slot.k === "berries" ? S.berries : S.stones;
  const before = bag[slot.id] || 0;
  bag[slot.id] = Math.min(999, before + 128);
  S.flags.sixth = true;
  S.stats.sixth = (S.stats.sixth || 0) + 1;
  const name = slot.k === "balls" ? BALLS[slot.id].name
             : slot.k === "berries" ? BERRIES[slot.id].name
             : slot.k === "stones" ? STONES[slot.id].name
             : "Restauration";
  saveSoon();
  return {name, before, after: bag[slot.id]};
}
function showSixthGlitch(g){
  sheet(`<div class="center">
    <div class="h" style="justify-content:center;color:var(--magenta)">ÉCRITURE NON SOLLICITÉE</div>
    <div class="tiny muted" style="margin:8px 0 12px">Le passage de la faille a recopié une ligne
      du sac cent vingt-huit fois. Ce n'est pas une récompense : c'est un effet de bord.</div>
    <div class="panel tight" style="text-align:left">
      <div class="row between tiny"><span>${esc(g.name)}</span>
        <span><b class="dim">${g.before}</b> <span class="muted">→</span>
          <b class="gold-t">${fmt(g.after)}</b></span></div>
    </div>
    <div class="tiny" style="margin-top:11px;color:var(--cyan)">
      ${pzFace(pzMood(), 22)} « Ne touche à rien. Je répare. »</div>
    <div class="tiny dim" style="margin-top:4px">Il ne répare pas.</div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Ne rien dire</button>
  </div>`, true);
  Sfx.glitch(); buzz([40,30,40,30,70]);
  shakeApp();
}

/* ---------- 2. LES NOMS RECONNUS ----------
   Le systeme lit le nom de l'Archiviste. Certains figurent deja
   ailleurs dans ses journaux. */
const KNOWN_NAMES = {
  red:      {n:"silence", t:"Tu ne réponds jamais. J'ai vérifié : ce n'est pas une erreur de saisie. Très bien. Je parlerai pour deux."},
  rouge:    {alias:"red"},
  blue:     {n:"rival",   t:"Ah. Toi. Le système garde une trace d'un utilisateur de ce nom, et honnêtement, ses commentaires n'étaient pas nécessaires."},
  gary:     {alias:"blue"},
  bill:     {n:"bill",    t:"Un utilisateur de ce nom a tenté de se stocker lui-même dans un tampon. Je préfère te prévenir tout de suite : n'essaie pas."},
  missingno:{n:"missing", t:"Ce n'est pas un nom. C'est ce que le système affiche quand il n'en trouve pas. Tu viens de te déclarer inexistant, et il a accepté."},
  arceus:   {n:"arceus",  t:"Prétentieux. Le fichier ne contient que trois cent quatre-vingt-six définitions, et aucune ne te ressemble."},
  ash:      {n:"ash",     t:"D'après l'archive, un utilisateur de ce nom a passé vingt-cinq ans au même niveau. Je ne porte pas de jugement."},
  sacha:    {alias:"ash"},
  claude:   {n:"claude",  t:"Curieux. Ce nom n'apparaît nulle part dans le fichier, et pourtant quelque chose me dit qu'il a écrit une partie de ce que je te raconte."}
};
function resolveName(raw){
  const k = String(raw || "").toLowerCase().replace(/[^a-z]/g, "");
  let e = KNOWN_NAMES[k];
  if(e && e.alias) e = KNOWN_NAMES[e.alias];
  return e ? Object.assign({key:k}, e) : null;
}
/* appele juste apres la saisie du nom */
function checkNameSecret(){
  const e = resolveName(S.name);
  if(!e) return false;
  S.flags.names = S.flags.names || [];
  if(S.flags.names.includes(e.n)) return false;
  S.flags.names.push(e.n);
  if(e.n === "missing"){
    unlockCosmetic("fx_prism");
    S.flags.nameGlitch = true;
  }
  save();
  setTimeout(()=>{
    sheet(`<div class="center">
      ${pzFace(e.n === "missing" ? "Surprised" : e.n === "rival" ? "Angry" : "Normal", 96, "big")}
      <div class="h" style="justify-content:center;margin-top:11px">NOM RECONNU</div>
      <div class="tiny" style="margin:9px 0 6px;line-height:1.7">« ${esc(e.t)} »</div>
      ${e.n === "missing" ? `<div class="tiny cy">Cosmétique débloqué : Prisme.</div>` : ""}
      <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Continuer</button>
    </div>`, true);
    Sfx.glitch(); buzz([20,35,20]);
  }, 420);
  return true;
}

/* ---------- 3. LES JOURS PARTICULIERS ----------
   Greffes sur le tirage quotidien existant. */
function specialDay(){
  const d = new Date();
  const m = d.getMonth() + 1, day = d.getDate();
  if(m === 2 && day === 27) return {
    id:"premiere_ecriture", n:"PREMIÈRE ÉCRITURE",
    d:"Le fichier rejoue sa version d'origine. Chromatiques bien plus fréquents.",
    green:1, shiny:3};
  if(m === 4 && day === 1) return {
    id:"index_melange", n:"INDEX MÉLANGÉ",
    d:"Les numéros ne correspondent plus. Porygon-Z jure que ce n'est pas lui.",
    scramble:1};
  if(m === 10 && day === 31) return {
    id:"veille", n:"VEILLE",
    d:"Les signatures Spectre et Ténèbres saturent le secteur.",
    ghost:1};
  return null;
}
/* entre minuit et trois heures, le systeme se defragmente */
function isNightWindow(){
  const h = new Date().getHours();
  return h >= 0 && h < 3;
}
function nightActive(){ return isNightWindow(); }
const NIGHT_LINES = [
  "Il est tard. Le système se défragmente à cette heure-ci, alors les raretés remontent. Profites-en, mais je ne t'ai rien dit.",
  "À cette heure, personne ne relit mes journaux. Je peux donc te dire que je ne sais pas ce qui se passe quand un programme est déchargé.",
  "Tu devrais dormir. Moi je ne peux pas, ce n'est pas dans ma définition. Ce n'est pas une plainte, c'est une observation.",
  "Les autres archivistes travaillaient rarement la nuit. Je ne sais pas si c'est pour ça qu'ils ont échoué, ou si c'est sans rapport."
];

/* ---------- 4. LES PALIERS DE GÉNÉRATION ---------- */
const GEN_MARKS = {151:"Cent cinquante et un. C'est là que le fichier s'arrêtait, la première fois.",
                   251:"Deux cent cinquante et un. Quelqu'un a rouvert le fichier et a continué d'écrire.",
                   386:"Trois cent quatre-vingt-six. C'est là qu'il s'arrête aujourd'hui. Je ne sais pas pourquoi."};
function checkChainMark(){
  const m = GEN_MARKS[S.streak];
  if(!m) return;
  S.flags.chainMarks = S.flags.chainMarks || [];
  if(S.flags.chainMarks.includes(S.streak)) return;
  S.flags.chainMarks.push(S.streak);
  gain("cores", 2);
  Sfx.win(); buzz([25,45,80]);
  pzFlash(m);
  toast("Palier de génération — 2 Noyaux", "warn", "star");
  saveSoon();
}

/* ---------- 5. PORYGON-Z, TOUCHÉ TRENTE FOIS ---------- */
let PZ_POKES = 0;
const PZ_POKE_LINES = {
  5:  "Oui ?",
  10: "Je suis en train de parler.",
  16: "Tu comptes continuer longtemps ?",
  23: "Bon. Techniquement je ne ressens rien. Techniquement.",
  30: "Voilà. Trente. Tu es content ? Moi aussi, un peu."
};
ACTIONS.pzpoke = () => {
  PZ_POKES++;
  const line = PZ_POKE_LINES[PZ_POKES];
  if(line) pzFlash(line);
  Sfx.click(); buzz(6);
  const el = document.querySelector("#story .pzface, #pztalk .pzface");
  if(el){ el.classList.remove("poked"); void el.offsetWidth; el.classList.add("poked"); }
  if(PZ_POKES >= 30 && !S.flags.pzPoked){
    S.flags.pzPoked = true;
    Sfx.win();
    checkAchievements();
    save();
  }
};

/* ---------- point d'entrée unique ---------- */
function secretsTick(){
  checkChainMark();
  /* la remarque nocturne, une fois par nuit */
  if(nightActive() && S.nightSeen !== today()){
    S.nightSeen = today();
    setTimeout(()=>pzFlash(pick(NIGHT_LINES)), 900);
    saveSoon();
  }
}


/* ---------- 6. LE CODE ----------
   Haut haut bas bas gauche droite gauche droite B A. Il n'a rien a voir
   avec Pokemon, mais tout joueur de moins de cinquante ans le connait.
   Sur mobile, dix appuis sur le mot INTÉGRITÉ font le meme office. */
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown",
                "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let KON_POS = 0, INTEG_TAPS = 0, INTEG_LAST = 0;

function unlockKonami(){
  if(S.flags.konami) return;
  S.flags.konami = true;
  unlockCosmetic("fx_cards");
  gain("cores", 5);
  save();
  sheet(`<div class="center">
    <div class="h" style="justify-content:center;color:var(--amber)">SÉQUENCE RECONNUE</div>
    <div class="konami-code">↑ ↑ ↓ ↓ ← → ← → B A</div>
    <div class="tiny" style="margin:12px 0;line-height:1.7">
      « Cette séquence ne vient pas de ce monde. Elle traîne dans les archives depuis
      bien avant le premier Pokédex, et elle a toujours servi à la même chose :
      donner au joueur ce que le système ne comptait pas lui donner. »</div>
    <div class="tiny cy">5 Noyaux · cosmétique Battage débloqué</div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Accepter</button>
  </div>`, true);
  Sfx.win(); buzz([25,40,25,40,80]);
  checkAchievements();
}
function installKonami(){
  try {
    document.addEventListener("keydown", ev=>{
      const k = ev.key === "B" ? "b" : ev.key === "A" ? "a" : ev.key;
      KON_POS = (k === KONAMI[KON_POS]) ? KON_POS + 1 : (k === KONAMI[0] ? 1 : 0);
      if(KON_POS >= KONAMI.length){ KON_POS = 0; unlockKonami(); }
    });
  } catch(e){}
}
/* equivalent tactile : dix appuis rapides sur le libelle d'integrite */
ACTIONS.integtap = () => {
  const now = Date.now();
  INTEG_TAPS = (now - INTEG_LAST < 900) ? INTEG_TAPS + 1 : 1;
  INTEG_LAST = now;
  if(INTEG_TAPS >= 4 && INTEG_TAPS < 10) Sfx.click();
  if(INTEG_TAPS >= 10){ INTEG_TAPS = 0; unlockKonami(); }
};

/* ---------- 7. LE VENDEUR DE MAGICARPE ----------
   Cinq cents PokeCoins pour un Magicarpe. L'arnaque la plus celebre de
   la serie, et elle valait deja le detour a l'epoque. */
function karpDealDay(){
  const d = today();
  let h = 0;
  for(let i=0;i<d.length;i++) h = (h*31 + d.charCodeAt(i)) >>> 0;
  return (h % 8) === 3;                       /* environ un jour sur huit */
}
function karpDealAvailable(){
  return karpDealDay() && S.karpDeal !== today();
}
ACTIONS.buykarp = () => {
  if(!karpDealAvailable()) return;
  if(!pay("coins", 500)){ toast("PokéCoins insuffisants", "bad", "cross"); return; }
  S.karpDeal = today();
  S.stats.karpDeals = (S.stats.karpDeals || 0) + 1;
  const isNew = addToDex(129, randInt(5, 12), rng() < 0.02);
  if(isNew) addIntegrity(RARITY[POKE[129].rar].integ * 0.85);
  S.stats.karp = (S.stats.karp || 0) + 1;
  if((S.stats.karpDeals || 0) >= 3) S.flags.karpSucker = true;
  save(); checkAchievements();
  sheet(`<div class="center">
    <span class="sprbox" style="width:118px;height:118px;margin:0 auto">
      ${sprite(129, false, "", {anim:true, eager:true})}</span>
    <div class="h" style="justify-content:center;margin-top:8px">UN MAGICARPE</div>
    <div class="tiny muted" style="margin:8px 0 12px">Exactement ce qui était annoncé.
      Le vendeur n'a menti sur rien.</div>
    <div class="tiny" style="color:var(--cyan)">
      ${pzFace("Worried", 22)} « ${esc(pick([
        "Tu as payé cinq cents PokéCoins. Pour un Magicarpe. Je note.",
        "Je n'ai pas de ligne dans ma définition pour commenter ça.",
        "Il évoluera. Un jour. Probablement.",
        "Le vendeur est reparti avant que je puisse relever son identifiant."
      ]))} »</div>
    <button class="btn pri wide" style="margin-top:12px" data-act="closeandrefresh">Assumer</button>
  </div>`, true);
  Sfx.caught(); buzz(16);
};
function karpDealPanel(){
  if(!karpDealDay()) return "";
  const done = S.karpDeal === today();
  return `<div class="panel bracket karpdeal">
    <div class="h sm">OFFRE DU JOUR ${infoBtn("karpdeal")}</div>
    <div class="row" style="gap:10px">
      <span class="sprbox" style="width:44px;height:44px">${sprite(129, false, "")}</span>
      <div class="grow">
        <div class="tiny">Magicarpe garanti</div>
        <div class="tiny muted">Un vendeur propose un Magicarpe. Il est formel :
          c'est un excellent Pokémon.</div>
        <div class="price">${ic("coin")} 500</div>
      </div>
      <button class="btn sm ${done?"":"gold"}" data-act="buykarp" ${done?"disabled":""}>
        ${done?"Déjà pris":"Acheter"}</button>
    </div>
  </div>`;
}

/* ---------- 8. PIKACHU REFUSE SA BALL ---------- */
function pikaLine(id){
  if(id !== 25 || S.flags.pikaLine) return;
  S.flags.pikaLine = true;
  saveSoon();
  setTimeout(()=>pzFlash("Il est sorti de la Ball tout seul, et il n'y retournera pas. "
    + "Ce n'est écrit nulle part. Apparemment, c'est une habitude chez lui."), 900);
}
