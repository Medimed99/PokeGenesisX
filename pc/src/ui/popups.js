/* ============================================================
   LES FENÊTRES QUI DEMANDENT UN CLIC
   Une page de journal trouvée, une révélation de carte, une fiche,
   un bilan de victoire ou de défaite… : tout ce qui attend un clic.
   Sur PC, la souris est souvent « prise » par la caméra ; sans elle,
   on resterait coincé devant. Deux règles, partout :
     · dès qu'une de ces fenêtres s'ouvre, la souris est rendue ;
     · Tab rend toujours la souris quand une fenêtre l'attend.
   La fenêtre refermée, un clic dans la scène reprend la caméra.
   ============================================================ */
const SEL = [
  "#moment.tap",          /* une page de journal : clic pour la lire */
  "#discover.on",         /* une révélation (carte, découverte) */
  "#sheet-root.on",       /* une fiche, un bilan */
  "#fragread.on",         /* la lecture d'une page */
  "#story.on", "#tuto.on", "#rv",
  "#xscene", ".pk2-evo",
  "#br-modal.on",         /* la Brèche : un choix, le bilan */
  ".sq2-res.on",          /* la Tour : le bilan */
  "#pc-dialog.on"         /* le dresseur de la route : sa parole, son verdict */
];
function shown(el){
  if(!el || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  if(r.width < 4 || r.height < 4) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05;
}
/* la fenêtre ouverte qui attend un clic, s'il y en a une */
export function popupOpen(){
  for(const s of SEL){ for(const el of document.querySelectorAll(s)) if(shown(el)) return el; }
  return null;
}
