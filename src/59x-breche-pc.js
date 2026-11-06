/* ============================================================
   59x — LA BRÈCHE · VERSION PC (3D)
   Sur ordinateur, la même partie se joue à la troisième personne,
   en 3D (pc/src/breche/). Ce fichier n'ajoute que ce que la version
   PC demande à la simulation ; sur téléphone, rien ne change :
     · R.pcMove  — le déplacement, déjà tourné selon la caméra ;
     · R.aim     — le point visé à la souris : l'équipe tire vers lui
                   (la cible la plus proche du réticule, sinon droit
                   devant) au lieu de viser l'ennemi le plus proche ;
     · brDodge   — le dash (Maj) : un bond court, invulnérable, avec un
                   temps de recharge ;
     · brJump    — le saut (Espace) : on passe par-dessus la horde (ni le
                   contact, ni le sol qui explose ne touchent ; les tirs,
                   si), et l'atterrissage repousse ce qui est autour ;
     · brCharge  — le tir chargé (clic gauche maintenu, puis relâché) :
                   un trait qui transperce, vers la cible verrouillée
                   (celle que vise l'équipe), avec un temps de recharge ;
     · R.pcFwd   — vers où regarde la caméra : Porygon-Z flotte devant
                   elle, à bonne distance (sur téléphone : au-dessus de
                   vous, dans le cadre) ;
     · le rendu  — tant que la 3D dessine, la toile mobile ne dessine
                   plus : seules avancent les mises en scène qui
                   vivent au rendu (entrées de boss, chutes, la trace
                   de la téléportation de Porygon-Z).
   ============================================================ */
const BR_DODGE = {dur:0.22, cd:1.4, inv:0.34};
const BR_JUMP = {dur:0.62, cd:1.05, ring:78, push:420};
const BR_CHARGE = {full:0.95, cd:5.5, min:0.18};

/* l'esquive : vers où l'on se déplace, sinon vers la visée */
function brDodge(R){
  if(!R || R.over || R.paused || R.modal || (R.dodgeCd || 0) > 0 || (R.cine && R.cine.freeze) || brHeld()) return false;
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

/* le saut : par-dessus la horde ; on garde l'élan, un peu plus vite qu'au pas */
function brJump(R){
  if(!R || R.over || R.paused || R.modal || (R.jumpCd || 0) > 0 || (R.jumpT || 0) > 0 || (R.cine && R.cine.freeze) || brHeld()) return false;
  R.jumpT = BR_JUMP.dur; R.jumpCd = BR_JUMP.cd;
  R.jumps = (R.jumps || 0) + 1;
  try { Sfx.jump ? Sfx.jump() : Sfx.wobble && Sfx.wobble(); } catch(e){}
  return true;
}
/* l'atterrissage : une onde repousse ce qui entoure l'équipe, et l'écorche un peu */
function brLand(R){
  const lead = R.team[0], st = lead ? brWeaponStats(lead, R) : null, dmg = Math.max(4, (st ? st.dmg : 8) * 0.9);
  brRing(R, R.x, R.y, BR_JUMP.ring, "#8fecff", 0.3); brShake(R, 3);
  R.curW = 0;
  brNear(R, R.x, R.y, BR_JUMP.ring, f=>{
    if(f.boss || f.fixed) return;
    const dx = f.x - R.x, dy = f.y - R.y, d = Math.hypot(dx, dy) || 1;
    if(d < BR_JUMP.ring + f.r) brHit(R, f, dmg, "#8fecff", dx / d, dy / d, BR_JUMP.push);
  });
}
/* la cible verrouillée : celle que l'équipe vise (la plus proche du réticule) */
function brLock(R){
  if(!R.aim) return null;
  const f = brNearest(R, R.aim.x, R.aim.y, 240);
  return f && f.hp > 0 ? f : null;
}
/* le tir chargé : on le charge en maintenant, il part au relâché (trop court : rien ne part) */
function brChargeStart(R){
  if(!R || R.over || R.paused || R.modal || (R.chargeCd || 0) > 0 || brHeld()) return false;
  R.charging = true; R.charge = 0; return true;
}
function brChargeRelease(R){
  if(!R || !R.charging) return false;
  R.charging = false;
  const k = Math.min(1, (R.charge || 0) / BR_CHARGE.full);
  R.charge = 0;
  if(k < BR_CHARGE.min || R.over || R.paused || R.modal) return false;
  const tgt = brLock(R);
  const tx = tgt ? tgt.x : R.aim ? R.aim.x : R.x + (R.face || 1), ty = tgt ? tgt.y : R.aim ? R.aim.y : R.y;
  const a = Math.atan2(ty - R.y, tx - R.x), lead = R.team[0], st = lead ? brWeaponStats(lead, R) : null;
  const tp = lead ? POKE[brShownId(lead)].types[0] : 0, base = st ? st.dmg : 10;
  const s = brShot(R, R.x, R.y, Math.cos(a) * 640, Math.sin(a) * 640, {dmg:base * (1.6 + 6.4 * k * k), r:10 + 12 * k, color:st ? st.color : "#8fecff",
    life:0.95, kind:"charged", pierce:2 + Math.round(8 * k), w:0, boom:k > 0.95 ? 70 : 0, stun:0.35 * k});
  s.ty = tp; s.full = k > 0.95; s.k = k;
  R.chargeCd = BR_CHARGE.cd * (0.45 + 0.55 * k);
  R.charged = (R.charged || 0) + 1;
  brShake(R, 2 + 4 * k);
  try { Sfx.shoot ? Sfx.shoot() : Sfx.wobble && Sfx.wobble(); } catch(e){}
  return true;
}
/* les minuteries du saut et du tir chargé (seulement là où la version PC les déclenche) */
function brPcTick(R, dt){
  if(R.jumpCd > 0) R.jumpCd -= dt;
  if(R.jumpT > 0){ R.jumpT -= dt; if(R.jumpT <= 0){ R.jumpT = 0; brLand(R); } }
  if(R.chargeCd > 0) R.chargeCd -= dt;
  if(R.charging) R.charge = Math.min(BR_CHARGE.full, (R.charge || 0) + dt);
}
/* en l'air, on va un peu plus vite ; en chargeant, un peu moins */
if(typeof brDir === "function"){
  const _brDirPC = brDir;
  brDir = function(R){
    const d = _brDirPC.apply(this, arguments);
    const k = (R.jumpT > 0 ? 1.3 : 1) * (R.charging ? 0.72 : 1);
    return k === 1 ? d : [d[0] * k, d[1] * k];
  };
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

/* Porygon-Z, sur PC : devant la caméra, à sept ou huit mètres, et il se balance de côté */
if(typeof brPzAnchor === "function"){
  const _brPzAnchorPC = brPzAnchor;
  brPzAnchor = function(R){
    const F = R.pcFwd;
    if(!R.pc || !F) return _brPzAnchorPC(R);
    const d = 245 + Math.cos(R.t * 0.9) * 30, sw = Math.sin(R.t * 0.55) * 190;
    return [R.x + F[0] * d - F[1] * sw, R.y + F[1] * d + F[0] * sw];
  };
}

/* la 3D dessine : la toile mobile se tait, les mises en scène continuent d'avancer */
function brPc3D(){ return typeof window !== "undefined" && window.PCBR3D && window.PCBR3D.on; }
/* l'entrée en 3D (la cinématique d'ouverture) : la partie attend qu'elle soit jouée */
function brHeld(){ return brPc3D() && !!window.PCHOLD; }
if(typeof brUpdate === "function"){
  const _brUpdatePC = brUpdate;
  brUpdate = function(R, dt){
    if(brHeld()) return;
    const r = _brUpdatePC.apply(this, arguments);
    if(!(R.cine && R.cine.freeze) && (R.jumpT > 0 || R.jumpCd > 0 || R.chargeCd > 0 || R.charging)) brPcTick(R, dt);
    return r;
  };
}
if(typeof brRender === "function"){
  const _brRenderPC = brRender;
  brRender = function(R, cv){
    if(!brPc3D()) return _brRenderPC.apply(this, arguments);
    const nowR = performance.now(), rdt = Math.min(0.05, (nowR - (R.rLast || nowR)) / 1000); R.rLast = nowR;
    if(!R.paused && typeof brMiniTick === "function"){ brMiniTick(R, rdt); brFinaleTick(R, rdt); }
    /* (ce que le dessin mobile faisait avancer au passage) */
    R.P.foes.each(f=>{ if(f.pose){ f.pose.t += rdt; if(f.pose.t >= 0.8) f.pose = null; } });
    const pz = R.boss; if(pz && pz.pz && pz.ghost && !R.paused){ pz.ghost.t -= rdt; if(pz.ghost.t <= 0) pz.ghost = null; }
    if(R.boss) R.bossHpPct = Math.max(0, R.boss.hp / R.boss.max);
    R.movedOnce = true;
  };
}
