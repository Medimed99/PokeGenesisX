/* ============================================================
   37x — LE PLATEAU · VERSION PC (3D)
   Sur ordinateur, les scènes du récit se jouent en volume
   (pc/src/story/) : le plateau (37d) reste le seul maître du temps —
   qui entre, qui bouge, la caméra, la lumière, les fenêtres du système,
   la défragmentation — et la 3D lit son état à chaque image.
   Ce fichier n'ajoute que ce que la version PC demande ; sur
   téléphone, rien ne change :
     · plFit   — le plateau garde les mesures d'un téléphone (390 × 844) :
                 les distances, les vitesses et les temps des scènes
                 restent ceux qui ont été réglés ; la toile du dessus
                 (cn-over) prend la taille de l'écran ;
     · plDraw  — plus de dessin à plat : la 3D peint le décor, les
                 acteurs et la lumière, et place les textes du monde.
   ============================================================ */
const PL_PC_VIEW = {w:390, h:844};
function plPc3D(){ return typeof window !== "undefined" && !!(window.PCST3D && window.PCST3D.on); }
if(typeof plFit === "function"){
  const _plFitPC = plFit;
  plFit = function(c){
    if(!plPc3D()) return _plFitPC.apply(this, arguments);
    const P = c.pl; if(!P || !P.cvW) return;
    const w = PL_PC_VIEW.w, h = PL_PC_VIEW.h, s = Math.max(2, Math.round(w / 210));
    const ow = Math.max(320, Math.round(window.innerWidth || 1280)), oh = Math.max(240, Math.round(window.innerHeight || 720));
    if(P.cw === w && P.ch === h && P.pcW === ow && P.pcH === oh) return;
    P.cw = w; P.ch = h; P.s = s; P.W = Math.ceil(w / s); P.H = Math.ceil(h / s);
    P.pcW = ow; P.pcH = oh;
    if(P.cvO){ P.cvO.width = ow; P.cvO.height = oh; }
    if(P.cvW){ P.cvW.width = 4; P.cvW.height = 4; }
    if(P.set) plPaint(c, P.set);
  };
}
if(typeof plDraw === "function"){
  const _plDrawPC = plDraw;
  plDraw = function(c){
    if(!plPc3D()) return _plDrawPC.apply(this, arguments);
    /* la 3D dessine à son rythme (pc/src/story) : ici, rien */
  };
}
