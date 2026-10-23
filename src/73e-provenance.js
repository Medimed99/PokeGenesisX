/* ============================================================
   73e — D'OÙ VIENT UNE CARTE
   Une carte n'était qu'une image. Elle garde désormais son
   histoire : le jour où elle a été émise, la connexion, ce qui l'a
   fait émettre (un verrou levé, une Expédition, un passage
   légendaire…), et l'équipe qu'on avait ce jour-là. On la lit au
   dos de la carte agrandie : un toucher la retourne.

   LES EXEMPLAIRES ANNOTÉS. Les onze archivistes d'avant collec-
   tionnaient aussi. Une fois la page d'une connexion trouvée, un
   doublon du légendaire qu'elle préférait peut arriver annoté au
   dos, de la même main que les pages (deux chances sur cinq, et
   forcément au troisième). Onze annotations, une par connexion.
   Signées ▒▒▒▒ jusqu'à la révélation, puis du nom du joueur.

   LE CADEAU DE 1996. Juste après son premier aveu (« tu n'es pas
   le premier »), Porygon-Z rend une carte qu'il a gardée depuis la
   connexion 01 : le Rendu primordial de Mew.
   ============================================================ */

/* ---------- la provenance ---------- */
function cardRegionName(r){ try { const d = regionDef(r); return d ? d.name : ""; } catch(e){ return ""; } }
function cardMonName(id){ return id && POKE[id] ? POKE[id].name : ""; }
const CARD_HOW_TXT = {
  guardian: h => `Gagnée en levant le verrou de ${cardMonName(h.g)}${h.r ? ", à " + cardRegionName(h.r) : ""}.`,
  exp:      h => `Gagnée au bout d'une Expédition${h.c ? `, à corruption ${h.c}` : ""}.`,
  weekly:   h => `Récompense d'un objectif de la semaine${h.tier ? ` (palier ${h.tier})` : ""}.`,
  chest:    () => "Trouvée dans un coffre.",
  crate:    () => "Trouvée dans une caisse, au Forage.",
  legend:   h => `${cardMonName(h.g)} traversait ${cardRegionName(h.r) || "la région"}. Il l'a laissée en repartant.`,
  heart:    h => `Gagnée quand le cœur de ${cardRegionName(h.r) || "la région"} s'est remis à battre.`,
  raid:     h => `Gagnée pendant le raid${h.g ? " contre " + cardMonName(h.g) : ""}, avec les autres archivistes.`,
  trade:    () => "Reçue d'un autre archiviste.",
  reidx:    () => "Retrouvée grâce à six doublons (réindexation).",
  gift:     () => "Gardée par Porygon-Z depuis la connexion 01. Il te l'a rendue.",
  pz:       h => `Écrite par ${h.who || pzName()}, à l'entrée n° 387.`,
  secret:   () => "Elle n'a jamais été distribuée : elle est apparue toute seule, pendant une capture."
};
function cardDateTxt(t){
  try {
    const d = new Date(t);
    return d.toLocaleDateString("fr-FR", {day:"numeric", month:"long", year:"numeric"}) + " à "
      + String(d.getHours()).padStart(2, "0") + " h " + String(d.getMinutes()).padStart(2, "0");
  } catch(e){ return ""; }
}
function cardHowText(h){
  if(!h || !CARD_HOW_TXT[h.k]) return null;
  try { return CARD_HOW_TXT[h.k](h); } catch(e){ return null; }
}

/* ---------- les annotations des onze ---------- */
const CARD_NOTES = [
  {c:1,  id:146, t:"Ma première carte, et c'est Sulfura ! Je la garde pour la fin : Vitefait et moi, on l'encadrera quand on aura fini. Dans deux semaines.",
   pz:"Deux semaines. Il a mis bien plus longtemps. Il est allé au bout quand même. Ils y sont tous allés."},
  {c:2,  id:381, t:"Latios, trouvée à trois heures du matin, avec Minuit sur l'épaule. Un conseil pour qui viendra après : les meilleures cartes arrivent quand on devrait dormir.",
   pz:"Trois heures du matin. Je me souviens de l'heure. Pas du visage. C'est souvent comme ça."},
  {c:3,  id:251, t:"J'avais deux exemplaires de cette carte. Ce matin, il n'en reste qu'un, et je n'ai rien échangé. Quelque chose efface ce que je laisse derrière moi, même ici. Migraine se tient la tête. Moi aussi.",
   pz:"Ce n'était pas moi. Je vérifie chaque fois. Ce n'était pas moi."},
  {c:4,  id:377, t:"J'ai compté les points sur son visage : il y en a autant que de lettres dans mon nom. Pioche refuse de regarder la carte.",
   pz:"Je les ai comptés aussi, les points. Je n'ai pas aimé le résultat."},
  {c:5,  id:244, t:"Braise dort contre cette carte, comme contre le feu éteint du campement. J'ai demandé au programme à qui elle appartenait avant moi. Il a changé de sujet.",
   pz:"J'ai changé de sujet. Je change toujours de sujet. Pardon encore, connexion 05."},
  {c:6,  id:151, t:"Mew. J'ai l'impression de l'avoir déjà eue, alors que c'est la première fois. Je commence toujours par un {first}, et je finis toujours par elle. Je ne sais pas comment je le sais.",
   pz:"Moi aussi, j'ai l'impression de l'avoir déjà vue. Combien de fois ? Je n'arrive pas à compter. C'est bien la première fois."},
  {c:7,  id:145, t:"Je n'ai plus de papier, alors j'écris au dos de cette carte. C'est pour Électhor, qui garde sa porte depuis le début parce que je le lui ai demandé. Un seul mot : merci. Plume la lui portera.",
   pz:"Il a gardé la porte. Il l'a gardée onze fois. Il te reconnaîtra."},
  {c:8,  id:386, t:"On ne m'a pas donné cette carte : elle est sortie de la faille. J'ai décodé les octets écrits sur le bord. Ce sont les lettres de mon nom. Murmure les répète depuis une heure.",
   pz:"Ne décode pas les octets du bord. S'il te plaît. Pas tout de suite."},
  {c:9,  id:385, t:"Jirachi exauce un vœu tous les mille ans. Le mien : que le compteur n'arrive jamais à cent pour cent. Demain dort en travers du chemin. Ça m'arrange.",
   pz:"Le compteur, c'est moi qui le tiens. Je ne savais pas qu'on pouvait souhaiter qu'il s'arrête."},
  {c:10, id:150, t:"Mewtwo n'a pas demandé à exister. Moi non plus. J'ai essayé de m'effacer des fichiers. Depuis, Personne, mon Métamorph, n'arrive plus à prendre ma forme : il ne trouve plus rien à copier. Ne faites pas ça.",
   pz:"« Ne faites pas ça. » Il l'a écrit deux fois en tout : sur sa page, et ici. Je compte."},
  {c:11, id:384, t:"Je la laisse ici, pour le prochain. Pour toi. Regarde-la longtemps : c'est ce qu'on voyait au-dessus des nuages, la dernière fois. Souviens-toi. Pour nous deux.",
   pz:"Pour le prochain. Pour toi. Il savait que tu viendrais. Moi, je l'espérais."}
];
const NOTE_P = 0.4, NOTE_SURE = 3;
function cardNotes(){ if(!S.cardNotes || typeof S.cardNotes !== "object") S.cardNotes = {}; return S.cardNotes; }
function cardNoteDef(c){ return CARD_NOTES.find(n=>n.c === +c) || null; }
/* l'annotation d'une connexion peut-elle arriver ? sa page est trouvée, elle n'est pas encore là */
function cardNoteOpen(n){ return !!n && (S.fragments || []).includes(n.c) && !cardNotes()[n.c]; }
/* un doublon de ce légendaire : est-ce l'exemplaire de quelqu'un d'avant ? */
function cardNoteRoll(series, id){
  const n = CARD_NOTES.find(x=>x.id === +id);
  if(!cardNoteOpen(n)) return 0;
  S.cardNoteTry = S.cardNoteTry || {};
  const k = (S.cardNoteTry[n.c] || 0) + 1;
  S.cardNoteTry[n.c] = k;
  if(k < NOTE_SURE && rng() > NOTE_P) return 0;
  cardNotes()[n.c] = {s:series, id:n.id, t:Date.now()};
  delete S.cardNoteTry[n.c];
  saveSoon();
  return n.c;
}
/* l'annotation que porte cette illustration, s'il y en a une */
function cardNoteOf(series, id){
  const all = S && S.cardNotes ? S.cardNotes : {};
  for(const c in all) if(all[c] && all[c].s === series && +all[c].id === +id) return cardNoteDef(c);
  return null;
}
function cardNoteSign(n){ return `${typeof sagaKnown === "function" && sagaKnown() ? pzName() : pzMask()} · connexion ${String(n.c).padStart(2, "0")}`; }
function cardNoteSlip(n, cls){
  return `<div class="cn-slip ${cls || ""}"><p>${esc(pzFmt(n.t))}</p><span class="cn-sign">— ${esc(cardNoteSign(n))}</span></div>`;
}
/* Porygon-Z ne commente qu'une fois son premier aveu fait, comme pour les pages */
function cardNotePz(n){
  if(!n || !n.pz || !(S.story || []).includes("pz_mem3")) return "";
  return `<div class="mo-line cn-pz">${typeof pzFace === "function" ? pzFace("Sad", 26) : ""}<span>${esc(pzFmt(n.pz))}</span></div>`;
}

/* dans la scène : le doublon annoté le dit, puis montre ce qu'on a écrit au dos */
if(typeof CRV_EXTRA !== "undefined") CRV_EXTRA.push(c=>{
  const n = c.rx && c.rx.note ? cardNoteDef(c.rx.note) : null;
  if(!n) return "";
  return `<div class="crv-note"><small>ANNOTÉE AU DOS · CONNEXION ${String(n.c).padStart(2, "0")}</small>${cardNoteSlip(n)}${cardNotePz(n)}</div>`;
});

/* ---------- le dos de la carte agrandie ---------- */
function cardRecordHtml(series, id){
  const secret = series === "mn";
  const e = secret ? (S.cards || {})["mn:0"] : cardEntry(series, id);
  if(!e) return "";
  const h = e.h, def = CARD_SERIES_DEF[series] || CARD_SERIES_DEF.art;
  const how = cardHowText(h);
  const team = h && h.tm && h.tm.length ? h.tm.filter(t=>POKE[t]).map(t=>(typeof monNick === "function" && monNick(t)) || POKE[t].name) : null;
  const note = secret ? null : cardNoteOf(series, id);
  const yr = !secret && CARD_YEARS[series] ? " · " + CARD_YEARS[series] : "";
  return `<div class="tc-rec s-${series}" style="--rc:${def.c}">
    <i class="tc-rec-guil"></i>
    <div class="tc-rec-in">
      <div class="tc-rec-h"><b>ENREGISTREMENT</b><span>N° ${secret ? "000" : series === "pz" ? "387" : String(id).padStart(3, "0")}</span></div>
      <div class="tc-rec-s" style="color:${def.c}">${esc(secret ? "Sans index" : seriesName(series))}${yr}</div>
      <dl>
        <dt>Obtenue</dt><dd>le ${esc(cardDateTxt(e.t))}${h && h.cx ? `<br>connexion n° ${h.cx}` : ""}</dd>
        <dt>Provenance</dt><dd>${how ? esc(how) : "Obtenue avant que l'archive note la provenance des cartes : elle n'en connaît que la date."}</dd>
        ${team && team.length ? `<dt>Ton équipe ce jour-là</dt><dd>${team.map(esc).join(" · ")}</dd>` : ""}
        ${e.dup ? `<dt>Exemplaires</dt><dd>${e.dup + 1}</dd>` : ""}
      </dl>
      ${note ? cardNoteSlip(note, "back") : ""}
      <div class="tc-rec-f ${note ? "" : "push"}"><span>EMPREINTE</span><b>${esc(cardChecksum(series, id))}</b>
        <i>${esc(cardBytes(series, id, 16))}</i></div>
    </div>
  </div>`;
}
/* un glissé du doigt incline la carte ; seul un toucher sans glisser la retourne */
function installCardFlip(){
  const f = document.getElementById("tc-flip"); if(!f || f.dataset.fl) return;
  f.dataset.fl = "1";
  let x0 = 0, y0 = 0;
  f.addEventListener("pointerdown", ev=>{ x0 = ev.clientX; y0 = ev.clientY; f.dataset.moved = ""; });
  f.addEventListener("pointermove", ev=>{ if(ev.buttons && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) f.dataset.moved = "1"; });
  f.addEventListener("touchstart", ev=>{ const t = ev.touches[0]; if(t){ x0 = t.clientX; y0 = t.clientY; } f.dataset.moved = ""; }, {passive:true});
  f.addEventListener("touchmove", ev=>{ const t = ev.touches[0]; if(t && Math.hypot(t.clientX - x0, t.clientY - y0) > 10) f.dataset.moved = "1"; }, {passive:true});
}
/* la carte agrandie se retourne d'un toucher ; on peut toujours l'incliner du doigt */
ACTIONS.cardflip = (d, el, ev) => {
  const f = document.getElementById("tc-flip"); if(!f) return;
  if(el && el.id === "tc-flip" && f.dataset.moved === "1"){ f.dataset.moved = ""; return; }
  f.classList.toggle("on");
  const b = document.getElementById("tc-flipbtn");
  if(b) b.textContent = f.classList.contains("on") ? "Voir l'illustration" : "Retourner la carte";
  try { Sfx.wobble(); } catch(e){}
};

/* ---------- le Journal : les cartes annotées ---------- */
function cardNotesPanelHtml(){
  const got = S.cardNotes || {}, n = Object.keys(got).length;
  const pages = S.fragments || [];
  if(!n && !pages.length) return "";
  return `<div class="panel cn-panel">
    <div class="row between"><div class="h sm" style="margin:0">CARTES ANNOTÉES</div><b class="mono-num tiny">${n} / ${CARD_NOTES.length}</b></div>
    <div class="tiny dim" style="margin:4px 0 8px">Les onze archivistes d'avant collectionnaient aussi. Quand tu as trouvé la page
      d'une connexion, un doublon de sa carte préférée peut arriver avec un mot écrit au dos.</div>
    <div class="cn-grid">${CARD_NOTES.map(x=>{
      const g = got[x.c];
      if(g) return `<button class="cn-c on" data-act="cardnote" data-c="${x.c}">${cardArt(g.s, x.id, "cn-mini")}<b>${esc(POKE[x.id].name)}</b><small>C.${String(x.c).padStart(2, "0")}</small></button>`;
      /* la page est trouvée : on sait quel légendaire attendre, s'il est déjà connu */
      const wait = pages.includes(x.c);
      return `<div class="cn-c ${wait ? "wait" : ""}"><span class="cn-q">?</span><b>${wait ? (monFound(x.id) ? esc(POKE[x.id].name) : "?????") : "· · ·"}</b><small>C.${String(x.c).padStart(2, "0")}</small></div>`;
    }).join("")}</div>
  </div>`;
}
ACTIONS.cardnote = d => {
  const n = cardNoteDef(d.c), g = (S.cardNotes || {})[d.c];
  if(!n || !g) return;
  sheet(`${sheetHead("Au dos d'une carte")}
    <div class="row" style="gap:10px;align-items:flex-start">
      <div style="width:96px;flex:none">${tcardHtml(g.s, n.id, {attrs:`data-act="cardzoom" data-s="${g.s}" data-id="${n.id}"`})}</div>
      <div class="grow"><div class="tiny">${esc(POKE[n.id].name)} · ${esc(seriesName(g.s))}</div>
        <div class="tiny dim">Arrivée en double le ${esc(cardDateTxt(g.t))}. C'était l'exemplaire de la connexion ${String(n.c).padStart(2, "0")}.</div></div>
    </div>
    ${cardNoteSlip(n, "insheet")}
    ${cardNotePz(n)}`);
};

/* ---------- le cadeau de 1996 ----------
   Après son premier aveu, Porygon-Z rend la carte qu'il a gardée depuis la connexion 01. */
let PZ_GIFT_AT = 0;
function pzGiftPick(){
  if(!cardHas("g1", 151)) return {s:"g1", id:151};
  for(const id of CARD_MONS) if(CARD_INDEX["g1:" + id] && !cardHas("g1", id)) return {s:"g1", id};
  for(const id of CARD_MONS) if(CARD_INDEX["g2:" + id] && !cardHas("g2", id)) return {s:"g2", id};
  return {s:"g1", id:151};
}
function pzGiftDue(){
  if(!S || !S.story || !S.story.includes("pz_mem3")) return false;
  const sg = S.saga || (S.saga = {});
  return !sg.gift96;
}
function pzGiftGive(){
  const sg = S.saga || (S.saga = {});
  if(sg.gift96) return null;
  sg.gift96 = Date.now();
  const p = pzGiftPick();
  if(typeof cardRevealExpect === "function") cardRevealExpect();
  cardHowSet("gift", {});
  /* déjà possédée : c'est un cadeau, pas un doublon à relire ni l'exemplaire annoté d'un autre */
  const fresh = typeof reidxSkip === "function" ? reidxSkip(()=>grantCardV(p.s, p.id)) : grantCardV(p.s, p.id);
  save();
  const rank = CARD_ORDER.indexOf(p.s);
  return {s:p.s, id:p.id, fresh, tag:"GARDÉE DEPUIS LA CONNEXION 01",
    desc:"Elle appartenait à la première connexion. Porygon-Z l'a gardée pendant onze connexions.",
    lines:[`> carte conservée hors de l'archive · N°${String(p.id).padStart(3, "0")}`, "> propriétaire : connexion 01",
      `> série · ${"◈".repeat(rank + 1)} ${CARD_SERIES_DEF[p.s].n.toUpperCase()}`]};
}
function pzGiftTick(){
  if(!pzGiftDue()){ PZ_GIFT_AT = 0; return; }
  if(typeof reidxQuiet === "function" && !reidxQuiet()) return;
  /* pas juste derrière le souvenir : il lui faut un moment */
  if(!PZ_GIFT_AT){ PZ_GIFT_AT = Date.now(); return; }
  if(Date.now() - PZ_GIFT_AT < 9000) return;
  const c = pzGiftGive(); if(!c) return;
  const what = c.s === "g1" && c.id === 151 ? "Le Rendu primordial de Mew" : (seriesName(c.s) + " de " + POKE[c.id].name);
  cardReveal([c], {kicker:"GARDÉE DEPUIS LA CONNEXION 01",
    intro:{spr:474, title:"Porygon-Z a gardé quelque chose",
      text:pzFmt("Cette carte appartenait à la première connexion. Je l'ai gardée tout ce temps, je ne sais plus très bien pourquoi. Je crois qu'elle est à toi, {nom}."),
      rewards:what},
    onDone:()=>{ try { refresh(); } catch(e){} }});
}
if(typeof setInterval === "function") setInterval(()=>{ try { pzGiftTick(); } catch(e){} }, 2500);
