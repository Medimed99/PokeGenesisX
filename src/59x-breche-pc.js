/* ============================================================
   59x — LA BRÈCHE · VERSION PC (3D)
   Sur ordinateur, la même partie se joue à la troisième personne,
   en 3D (pc/src/breche/). Ce fichier n'ajoute que ce que la version
   PC demande à la simulation ; sur téléphone, rien ne change :
     · R.pcMove  — le déplacement, déjà tourné selon la caméra ;
     · R.aim     — le point visé à la souris : l'équipe tire vers lui
                   (la cible la plus proche du réticule, sinon droit
                   devant) au lieu de viser l'ennemi le plus proche ;
     · brDodge   — l'esquive (Espace) : un bond court, invulnérable,
                   avec un temps de recharge ;
     · le rendu  — tant que la 3D dessine, la toile mobile ne dessine
                   plus : seules avancent les mises en scène qui
                   vivent au rendu (entrées de boss, chutes).
   ============================================================ */
const BR_DODGE = {dur:0.22, cd:1.4, inv:0.34};

/* l'esquive : vers où l'on se déplace, sinon vers la visée */
function brDodge(R){
  if(!R || R.over || R.paused || R.modal || (R.dodgeCd || 0) > 0 || (R.cine && R.cine.freeze)) return false;
  let dx = 0, dy = 0;
  if(R.pcMove && (R.pcMove[0] || R.pcMove[1])){ dx = R.pcMove[0]; dy = R.pcMove[1]; }
  else if(R.aim){ dx = R.aim.x - R.x; dy = R.aim.y - R.y; }
  else dx = R.face || 1;
  const d = Math.hypot(dx, dy) || 1;
  R.dodgeX = dx / d; R.dodgeY = dy / d;
  R.dodgeT = BR_DODGE.dur; R.dodgeCd = BR_DODGE.cd;
  R.inv = Math.max(R.inv, BR_DODGE.inv);
  R.dodges = (R.dodges || 0) + 1;
  try { Sfx.wobble && Sfx.wobble(); } catch(e){}
  return true;
}

/* viser à la souris : pendant un tir, « le plus proche » se cherche autour du réticule */
const BR_AIM_REACH = 540;
function brAimShift(R, pos){
  let ax = R.aim.x - pos.x, ay = R.aim.y - pos.y;
  const d = Math.hypot(ax, ay);
  if(d > BR_AIM_REACH){ ax *= BR_AIM_REACH / d; ay *= BR_AIM_REACH / d; }
  return [ax, ay];
}
if(typeof brFire === "function"){
  const _brFirePC = brFire;
  brFire = function(R, w, st, pos){
    if(!R.aim || R._aimIn) return _brFirePC.apply(this, arguments);
    const near0 = brNearest, [ax, ay] = brAimShift(R, pos);
    R._aimIn = true;
    brNearest = function(R2, x, y, maxd){
      /* la même recherche, décalée jusqu'au réticule, dans un rayon serré autour de lui */
      return near0(R2, x + ax, y + ay, Math.max(150, Math.min(maxd, 240)));
    };
    try { return _brFirePC.apply(this, arguments); }
    finally { brNearest = near0; R._aimIn = false; }
  };
}

/* la 3D dessine : la toile mobile se tait, les mises en scène continuent d'avancer */
function brPc3D(){ return typeof window !== "undefined" && window.PCBR3D && window.PCBR3D.on; }
if(typeof brRender === "function"){
  const _brRenderPC = brRender;
  brRender = function(R, cv){
    if(!brPc3D()) return _brRenderPC.apply(this, arguments);
    const nowR = performance.now(), rdt = Math.min(0.05, (nowR - (R.rLast || nowR)) / 1000); R.rLast = nowR;
    if(!R.paused && typeof brMiniTick === "function"){ brMiniTick(R, rdt); brFinaleTick(R, rdt); }
    /* (ce que le dessin mobile faisait avancer au passage) */
    R.P.foes.each(f=>{ if(f.pose){ f.pose.t += rdt; if(f.pose.t >= 0.8) f.pose = null; } });
    if(R.boss) R.bossHpPct = Math.max(0, R.boss.hp / R.boss.max);
    R.movedOnce = true;
  };
}
