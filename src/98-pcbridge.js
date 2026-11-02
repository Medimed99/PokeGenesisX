/* ============================================================
   98 — LE PONT AVEC LA VERSION PC
   La version PC (pc.html) charge ce même jeu — mêmes règles, même
   sauvegarde, même compte en ligne — et pose un monde en 3D par-dessus.
   Le client 3D (pc/src, bundle à part) ne voit pas les variables
   déclarées ici avec let/const : ce pont les lui prête, en lecture et
   en écriture. Sur mobile, il ne fait rien.
   ============================================================ */
const PC_MODE = typeof window !== "undefined" && !!window.PCG_PC;
if(typeof window !== "undefined") window.PCG = {
  pc: PC_MODE,
  get S(){ return S; },
  get ENC(){ return ENC; }, set ENC(v){ ENC = v; },
  get busy(){ return busy; }, set busy(v){ busy = v; },
  get FISHING(){ return FISHING; }, set FISHING(v){ FISHING = v; },
  get POND(){ return POND; }, set POND(v){ POND = v; },
  get BATTLE(){ return BATTLE; }, set BATTLE(v){ BATTLE = v; },
  get RIVAL(){ return RIVAL; }, set RIVAL(v){ RIVAL = v; },
  get CINE(){ return CINE; },
  get currentScreen(){ return currentScreen; },
  get DISCOVER(){ return DISCOVER; },
  /* les tables du jeu */
  POKE, BALLS, BERRIES, RARITY, TYPE_NAMES, RING_GRADES, RODS, HABITATS, WEATHER, REGIONS, RIVALS,
  PMD_META, PMD_ANIM, TREASURES, ACTIONS, SCREENS,
  /* n'importe quel nom du jeu, pour ce qui n'est pas listé ci-dessus */
  ref(name){ try { return eval(name); } catch(e){ return undefined; } }
};
