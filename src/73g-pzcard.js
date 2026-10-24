/* ============================================================
   73g — LA CARTE DE PORYGON-Z
   Une carte que le système n'a jamais émise. À la fin ÉCRIRE,
   quand Porygon-Z devient l'entrée n° 387 du Pokédex, il a aussi
   sa carte : une seule écriture, le Rendu inédit, posée sur une page
   du journal, signée du nom du joueur. Elle ne compte dans le total
   de la collection que lorsqu'elle existe : personne ne l'attend.

   Une partie qui avait déjà écrit avant cette version la reçoit à
   l'ouverture suivante.
   ============================================================ */
const PZ_CARD = "pz:474";
function pzCardOwned(){ return !!(S && S.cards && S.cards[PZ_CARD]); }
function grantPzCard(){
  S.cards = S.cards || {};
  if(S.cards[PZ_CARD]) return false;
  S.cards[PZ_CARD] = {t:Date.now(), dup:0, h:cardHowStamp({k:"pz", who:pzName()})};
  saveSoon();
  return true;
}
/* écrite au moment même où l'on choisit d'écrire (87) */
if(typeof finaleAfterChoice === "function"){
  const _fac = finaleAfterChoice;
  finaleAfterChoice = function(k){
    const r = _fac.apply(this, arguments);
    if(k === "write") try { grantPzCard(); save(); } catch(e){}
    return r;
  };
}
function pzCardReveal(){
  const sg = S.saga || (S.saga = {});
  sg.pzCard = Date.now();
  saveSoon();
  return cardReveal([{s:"pz", id:474, fresh:true, tag:"ENTRÉE N° 387 · RENDU INÉDIT",
      lines:["> signature détectée · N°387", "> aucune version antérieure", "> écrite par : " + pzName().toUpperCase()]}],
    {kicker:"ENTRÉE N° 387",
     intro:{spr:474, title:"Une carte que personne n'a émise",
       text:"Porygon-Z n'est dans aucune série : aucune époque ne l'a jamais dessiné. Cette carte, c'est toi qui l'as écrite.",
       rewards:"Porygon-Z · Rendu inédit"},
     onDone:()=>{ try { refresh(); } catch(e){} }});
}
let PZ_CARD_AT = 0;
function pzCardTick(){
  if(!S || !S.flags || typeof introSeen !== "function" || !introSeen()) return;
  const sg = S.saga || {};
  if(sg.wrote && !pzCardOwned()) grantPzCard();
  if(!pzCardOwned() || sg.pzCard){ PZ_CARD_AT = 0; return; }
  if(typeof reidxQuiet === "function" && !reidxQuiet()){ PZ_CARD_AT = 0; return; }
  /* après l'épilogue : le temps de souffler */
  if(!PZ_CARD_AT){ PZ_CARD_AT = Date.now(); return; }
  if(Date.now() - PZ_CARD_AT < 5000) return;
  PZ_CARD_AT = 0;
  pzCardReveal();
}
if(typeof setInterval === "function") setInterval(()=>{ try { pzCardTick(); } catch(e){} }, 2500);

/* dans la collection, une fois qu'elle existe */
function pzCardPanelHtml(){
  if(!pzCardOwned()) return "";
  return `<div class="h sm" style="margin-top:12px">ENTRÉE N° 387</div>
    <div class="cardgrid" style="grid-template-columns:1fr 2fr;align-items:center">
      ${tcardHtml("pz", 474, {attrs:'data-act="cardzoom" data-s="pz" data-id="474"'})}
      <div class="tiny muted">Le système ne l'a jamais émise. Elle existe parce que tu as écrit Porygon-Z
        à l'entrée n° 387. Il n'y en aura pas d'autre.</div>
    </div>`;
}
