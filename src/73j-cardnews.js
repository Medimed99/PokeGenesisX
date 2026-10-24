/* ============================================================
   73j — CE QUI A CHANGÉ DANS TES CARTES
   Une partie qui avait déjà une collection avant cette version la
   retrouve transformée d'un coup : une scène par époque, un dos qui
   raconte d'où vient la carte, des doublons qui servent, des
   chronologies, des apparences et des affichages d'époque. Sans un mot,
   presque rien de tout cela ne se voit : la collection a l'air d'être
   restée comme avant.

   Alors, une fois, au premier moment calme, Porygon-Z le montre : les
   cartes d'un même légendaire à plusieurs époques, puis quelques lignes,
   chacune menant à l'endroit où ça se passe. Les révélations qui
   attendent (doublons relus, carte gardée depuis la connexion 01, carte
   de Porygon-Z) passent ensuite, une à une, et les modes d'affichage
   déjà ouverts sont annoncés ici plutôt que par deux moments de plus.

   Une partie neuve ne voit jamais cette page : elle découvre tout en
   jouant.
   ============================================================ */
const CNEWS_MIN = 6;   /* en dessous, il n'y a pas de collection « d'avant » à redécouvrir */
const CNEWS_PZ = "Pendant ton absence, l'archive a relu toutes tes cartes. Elles ont changé. Je te montre.";

/* S.saga.cnews : 0 à montrer · -1 rien à montrer · une date : montrée */
function cnewsInit(){
  const sg = S.saga || (S.saga = {});
  if(sg.cnews !== undefined) return;
  sg.cnews = cardOwnedCount() >= CNEWS_MIN ? 0 : -1;
  saveSoon();
}
function cnewsPending(){
  if(!S || !S.flags || typeof introSeen !== "function" || !introSeen()) return false;
  if(!S.saga || S.saga.cnews === undefined) cnewsInit();
  return S.saga.cnews === 0;
}

/* les illustrations possédées d'un légendaire, de la plus récente à la plus ancienne */
function cnewsOwn(id){ return CARD_ORDER.filter(s=>CARD_INDEX[cardKey(s, id)] && cardHas(s, id)); }
/* le même légendaire à plusieurs époques : ce qui a changé se voit d'un coup d'œil */
function cnewsHeroPick(){
  const team = typeof teamIds === "function" ? teamIds() : [];
  let best = null;
  for(const id of CARD_MONS){
    const o = cnewsOwn(id); if(!o.length) continue;
    const sc = o.length * 10 + (team.includes(id) ? 5 : 0) + (id === 150 ? 2 : 0);
    if(!best || sc > best.sc) best = {id, o, sc};
  }
  if(!best) return [];
  if(best.o.length >= 2){
    const o = best.o.slice().reverse();                 /* de la plus ancienne à aujourd'hui */
    const ss = o.length <= 3 ? o : [o[0], o[Math.floor(o.length / 2)], o[o.length - 1]];
    return ss.map(s=>({s, id:best.id}));
  }
  return CARD_MONS.map(id=>({id, o:cnewsOwn(id)})).filter(x=>x.o.length).slice(0, 3).map(x=>({s:x.o[0], id:x.id}));
}
/* la chronologie à proposer : un légendaire de l'équipe, sinon Mewtwo, sinon le premier */
function cnewsChronoPick(){
  if(typeof chronoUnseen !== "function") return 0;
  const ids = CARD_MONS.filter(id=>chronoUnseen(id));
  if(!ids.length) return 0;
  const team = typeof teamIds === "function" ? teamIds() : [];
  return ids.find(id=>team.includes(id)) || (ids.includes(150) ? 150 : ids[0]);
}

function cnewsItems(){
  const L = [];
  L.push({i:"cards", t:"Une scène par époque",
    d:"Chaque carte montre le Pokémon dans un décor de son époque. Son cadre dit sa rareté."});
  const pages = (S.fragments || []).length;
  L.push({i:"eye", t:"Le dos des cartes",
    d:"Agrandis une carte, puis touche-la : elle se retourne. Au dos, quand tu l'as obtenue et comment."
      + (pages ? " Certains doublons arriveront avec un mot écrit par un archiviste d'avant." : "")});
  const lacking = CARD_MONS.filter(id=>reidxMissing(id).length).length;
  L.push({i:"refresh", t:"Tes doublons servent",
    d:lacking ? `Au sixième doublon d'un légendaire, une illustration qui te manque réapparaît. Quand tu les as toutes, chaque doublon rapporte ${REIDX_FRAG} Fragments.`
              : `Tu as toutes les illustrations : chaque nouveau doublon te rapporte ${REIDX_FRAG} Fragments.`});
  const unseen = typeof chronoUnseen === "function" ? CARD_MONS.filter(id=>chronoUnseen(id)).length : 0;
  const chr = cnewsChronoPick();
  if(unseen && chr) L.push({i:"star", t:unseen > 1 ? `${unseen} chronologies à voir` : "Une chronologie à voir",
    d:"Quand tu as toutes les illustrations d'un légendaire, tu peux le revoir à travers toutes ses époques.",
    b:{act:"cnewschrono", id:chr, label:`Voir celle de ${POKE[chr].name}`}});
  if(typeof skinChoices === "function" && CARD_MONS.some(id=>skinChoices(id).length))
    L.push({i:"user", t:"Les apparences d'époque",
      d:"Tes cartes anciennes peuvent donner à un légendaire l'apparence de leur époque, dans ton équipe et au Pokédex. Ça se choisit sur la carte agrandie."});
  const dm = typeof DISPLAY_MODES !== "undefined" ? Object.keys(DISPLAY_MODES).filter(m=>displayModeOpen(m)) : [];
  if(dm.length) L.push({i:"gear", t:"L'affichage d'époque",
    d:`Tu as les cartes qu'il faut : tout le jeu peut s'afficher comme en ${dm.map(m=>`${DISPLAY_MODES[m].n} (${DISPLAY_MODES[m].t})`).join(" ou en ")}.`,
    b:{act:"cnewsdisp", label:"Choisir dans les Réglages"}});
  return L;
}

function cnewsHtml(){
  const hero = cnewsHeroPick();
  return `${sheetHead("Tes cartes ont changé")}
    ${hero.length ? `<div class="cnews-hero n${hero.length}" aria-hidden="true">${hero.map(p=>tcardHtml(p.s, p.id)).join("")}</div>` : ""}
    <div class="mo-line cnews-pz">${typeof pzFace === "function" ? pzFace("Happy", 26) : ""}<span>${esc(pzFmt(CNEWS_PZ))}</span></div>
    <div class="cnews-list">${cnewsItems().map(x=>`<div class="cnews-it">${ic(x.i)}<div>
      <b>${esc(x.t)}</b><p>${esc(x.d)}</p>
      ${x.b ? `<button class="btn sm" data-act="${x.b.act}"${x.b.id ? ` data-id="${x.b.id}"` : ""}>${esc(x.b.label)}</button>` : ""}
    </div></div>`).join("")}</div>
    <div class="btn-grid c2">
      <button class="btn" data-act="closesheet">Fermer</button>
      <button class="btn pri" data-act="cnewscards">Voir mes cartes</button>
    </div>`;
}
function cnewsShow(){
  S.saga.cnews = Date.now();
  /* les modes d'affichage déjà ouverts sont dits ici : pas deux moments de plus */
  if(typeof DISPLAY_MODES !== "undefined"){
    if(!S.dmSeen || typeof S.dmSeen !== "object") S.dmSeen = {};
    for(const m in DISPLAY_MODES) if(!S.dmSeen[m] && displayModeOpen(m)) S.dmSeen[m] = Date.now();
  }
  save();
  sheet(cnewsHtml());
  try { if(typeof Sfx !== "undefined") Sfx.wobble(); } catch(e){}
  return true;
}
ACTIONS.cnewscards = () => { closeSheet(); go("cards"); };
ACTIONS.cnewschrono = d => chronoPlay(+d.id, ()=>{ try { go("cards"); } catch(e){} });
ACTIONS.cnewsdisp = () => { closeSheet(); go("settings"); };

/* au premier calme après l'ouverture : les rapports d'absence et les scènes passent avant */
let CNEWS_AT = 0;
function cnewsTick(){
  if(!cnewsPending()){ CNEWS_AT = 0; return; }
  if(typeof reidxCalm === "function" && !reidxCalm()){ CNEWS_AT = 0; return; }
  if(!CNEWS_AT){ CNEWS_AT = Date.now(); return; }
  if(Date.now() - CNEWS_AT < 2500) return;
  CNEWS_AT = 0;
  cnewsShow();
}
if(typeof setInterval === "function") setInterval(()=>{ try { cnewsTick(); } catch(e){} }, 1000);
