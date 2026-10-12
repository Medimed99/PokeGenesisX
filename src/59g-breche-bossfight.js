/* ============================================================
   59g — LA BRÈCHE · LES COMBATS DE BOSS SCÉNARISÉS
   Retour de jeu : la Breche restait lineaire, le boss n'etait qu'un
   ennemi plus robuste. Le combat se joue desormais en actes :
     I.   L'ENTREE EN SCENE — la horde se disperse, bandes noires, la camera
          se tourne vers le gardien, sa carte de nom ; une ARENE se referme.
     II.  100 → 66 % — le jeu d'attaques de son type.
     III. 66 % — il se retranche derriere TROIS PYLONES : les briser pour
          l'atteindre ; l'arene se resserre.
     IV.  33 % — l'ATTAQUE ULTIME : tout l'ecran sera frappe, sauf quelques
          abris a rejoindre ; puis il s'emballe.
     FINALE — ralenti, flash, il se defragmente, Porygon-Z conclut.
   Chaque acte oblige a bouger differemment.
   ============================================================ */
const BR_EPITHET = {1:"PRIMORDIAL", 2:"DU COMBAT", 3:"DES VENTS", 4:"DU VENIN", 5:"DES PROFONDEURS", 6:"DE PIERRE",
  7:"DE L'ESSAIM", 8:"DES OMBRES", 9:"D'ACIER", 10:"DES BRAISES", 11:"DES ABYSSES", 12:"DE LA SYLVE", 13:"DE LA FOUDRE",
  14:"DE L'ESPRIT", 15:"DU FROID", 16:"DU CIEL", 17:"DE LA NUIT", 18:"DES RÊVES"};

/* ---------- sous-titres : Porygon-Z, ou le gardien lui-même ---------- */
function brSay(R, who, text, dur){
  const el = document.getElementById("br-say");
  if(!el) return;
  const face = who === "pz" ? pzFace("Happy", 34) : `<span class="sprbox" style="width:34px;height:34px">${sprite(who, false, "")}</span>`;
  el.innerHTML = `<div class="br-sayf">${face}</div><div class="br-sayt ${who === "pz" ? "" : "glitch"}">${esc(text)}</div>`;
  el.className = "br-say on";
  R.sayT = dur || 3.2;
}
function brSayTick(R, dt){
  if(!(R.sayT > 0)) return;
  R.sayT -= dt;
  if(R.sayT <= 0){ const el = document.getElementById("br-say"); if(el) el.className = "br-say"; }
}

/* ---------- acte I : l'entrée en scène ---------- */
function brScenarioStart(R, b){
  const g = !!R.guardian, nm = POKE[b.id].name.toUpperCase();
  R.scen = {phase:1, guardian:g, name:POKE[b.id].name, card:g ? nm : "ANOMALIE — " + nm,
            sub:g ? "VERROU " + (BR_EPITHET[POKE[b.id].types[0]] || "LÉGENDAIRE") : "ALPHA DE LA BRÈCHE"};
  /* l'arene : un cercle de corruption entre l'Archiviste et le gardien */
  const cx = R.x + (b.x - R.x) * 0.35, cy = R.y + (b.y - R.y) * 0.35;
  R.arena = {x:cx, y:cy, r:Math.max(R.W, R.H) * 1.1, target:460, burnT:0};
  R.cine = {k:"intro", t:0, dur:3.4, freeze:true, bx:b.x, by:b.y};
  b.shield = true;                                        /* intouchable pendant l'entree en scene */
  brSay(R, "pz", g ? `Signal légendaire : ${R.scen.name}. C'est lui qui verrouille ce secteur.`
                   : `Une anomalie majeure se condense. Elle a pris la forme de ${R.scen.name}.`, 3.4);
  try { Sfx.glitch(); buzz([30, 40, 60]); } catch(e){}
}
function brCineTick(R, dt){
  const c = R.cine;
  c.t += dt;
  brSayTick(R, dt);
  if(c.k === "intro"){
    /* la camera glisse vers le gardien, s'y attarde, puis revient */
    const k = c.t < 1.1 ? c.t / 1.1 : c.t < 2.4 ? 1 : Math.max(0, 1 - (c.t - 2.4) / 0.9);
    const e = k * k * (3 - 2 * k);
    R.cam = {x:R.x + (c.bx - R.x) * e, y:R.y + (c.by - R.y) * e};
    if(c.t >= 1.3 && !c.roared){ c.roared = true; brShake(R, 12); brSay(R, R.boss ? R.boss.id : 1, "▓ ACCÈS REFUSÉ ▓ ARCHIVE SCELLÉE ▓", 2); try { Sfx.boss ? Sfx.boss() : Sfx.glitch(); } catch(e){} }
  }
  if(c.t >= c.dur){
    R.cine = null; R.cam = null;
    if(R.boss) R.boss.shield = false;
    brBanner(R, "COMBAT", "#ff3d7f", R.scen ? R.scen.sub : "");
    R.last = performance.now();
  }
}

/* ---------- l'arène : on n'en sort pas sans dommage ---------- */
function brArenaTick(R, dt){
  const A = R.arena;
  if(!A) return;
  A.r += (A.target - A.r) * Math.min(1, dt * 1.6);
  const dx = R.x - A.x, dy = R.y - A.y, d = Math.hypot(dx, dy) || 1, lim = A.r - 14;
  if(d > lim){
    R.x = A.x + dx / d * lim; R.y = A.y + dy / d * lim;
    A.burnT -= dt;
    if(A.burnT <= 0){
      A.burnT = 0.6;
      if(brTakeHit(R, R.maxHp * 0.04, null)){ R.hurt = 0.25; brText(R, R.x, R.y - 30, "corruption", "#ff3d7f", 10); }
      if(!A.warned){ A.warned = true; brTicker(R, "LA FAILLE BRÛLE HORS DE L'ARÈNE", "#ff3d7f"); }
    }
  }
  /* l'attaque ultime : rejoindre un abri avant l'impact */
  const U = R.ult;
  if(U){
    U.t -= dt;
    if(U.t <= 0){
      const safe = U.safes.some(s=>Math.hypot(R.x - s.x, R.y - s.y) < s.r);
      brShake(R, 16); brHitstop(R, 90);
      brBurst(R, R.x, R.y, safe ? "#5ce07a" : "#ff3d7f", 40, 320, 0.7);
      if(!safe && brTakeHit(R, R.maxHp * 0.3, null)){ R.hurt = 0.5; brText(R, R.x, R.y - 34, "-30 %", "#ff3d7f", 16); }
      /* la deflagration balaie aussi la horde hors des abris */
      R.curW = -1;
      R.P.foes.each(f=>{ if(!f.boss && !f.fixed && !U.safes.some(s=>Math.hypot(f.x - s.x, f.y - s.y) < s.r)) brHit(R, f, 9999, "#ff3d7f", 0, 0, 0); });
      for(let k = 0; k < 6; k++) brDecal(R, "crater", A.x + (R.rng() - .5) * A.r, A.y + (R.rng() - .5) * A.r, 40 + R.rng() * 30, 8);
      R.ult = null;
      if(R.boss){ R.boss.shield = false; R.boss.atk = 1.2; }
      brSay(R, "pz", safe ? "Vous avez tenu. Achevez-le !" : "Touché… mais il est à bout. Achevez-le !", 2.6);
    }
  }
  brSayTick(R, dt);
}

/* ---------- actes III et IV : les seuils ---------- */
function brScenarioPhase(R, b){
  const S2 = R.scen;
  if(!S2) return;
  if(S2.phase === 1 && b.hp < b.max * 0.66){
    S2.phase = 2;
    b.shield = true;
    R.arena.target = 370;
    const A = R.arena, pyl = [];
    for(let k = 0; k < 3; k++){
      const a = k / 3 * Math.PI * 2 + R.rng() * 0.6, rr = A.target * 0.62;
      const p = brSpawnFoe(R, b.id, "pylon");
      p.x = A.x + Math.cos(a) * rr; p.y = A.y + Math.sin(a) * rr;
      p.max = p.hp = Math.round(b.max * 0.045);
      p.boss = false; p.elite = false; p.pylon = true;
      pyl.push(p);
    }
    S2.pylons = pyl;
    brShake(R, 10); brRing(R, b.x, b.y, 160, "#ff3d7f", 0.5);
    brBanner(R, "IL SE RETRANCHE", "#ff3d7f", "brisez les trois pylônes");
    brSay(R, "pz", "Il se retranche derrière trois relais ! Brisez les pylônes, il redeviendra vulnérable.", 3.4);
    brTicker(R, "BOUCLIER ACTIF — TROIS RELAIS DÉTECTÉS", "#ff3d7f");
  }
  if(S2.phase === 2 && S2.pylons && S2.pylons.every(p=>!p.on || p.hp <= 0)){
    S2.phase = 2.5; S2.pylons = null;
    b.shield = false;
    brBanner(R, "RELAIS COUPÉS", "#35f0d6", "il est à découvert");
    brSay(R, "pz", "Relais coupés. Il est à découvert !", 2.4);
  }
  if(S2.phase === 2.5 && b.hp < b.max * 0.33){
    S2.phase = 3;
    b.shield = true;
    R.arena.target = 300;
    /* l'attaque ultime : deux ou trois abris, a rejoindre en un peu plus de deux secondes */
    const A = R.arena, safes = [];
    const n = 2 + (R.rng() < 0.5 ? 1 : 0);
    for(let k = 0; k < n; k++){
      const a = R.rng() * Math.PI * 2, d = 110 + R.rng() * 90;
      let sx = R.x + Math.cos(a) * d, sy = R.y + Math.sin(a) * d;
      const dd = Math.hypot(sx - A.x, sy - A.y), lim = A.target - 80;
      if(dd > lim){ sx = A.x + (sx - A.x) / dd * lim; sy = A.y + (sy - A.y) / dd * lim; }
      safes.push({x:sx, y:sy, r:68});
    }
    R.ult = {t:2.6, max:2.6, safes};
    brShake(R, 12);
    brBanner(R, "DÉFRAGMENTATION TOTALE", "#ff3d7f", "rejoignez un abri");
    brSay(R, "pz", "Il rassemble tout ce qui lui reste… Mettez-vous à l'abri dans un cercle vert !", 2.8);
    brTicker(R, "ATTAQUE ULTIME — ABRIS DÉTECTÉS", "#ff3d7f");
  }
}
/* la finale : pas de gel, un ralenti, un flash, la defragmentation */
function brScenarioFinale(R, f){
  if(!R.scen) return;
  R.arena = null; R.ult = null;
  /* il se defait en pixels, aux couleurs de son type */
  const C = BR_ARCH[POKE[f.id].types[0]].c;
  for(let k = 0; k < 4; k++) brBurst(R, f.x + (R.rng() - .5) * 40, f.y + (R.rng() - .5) * 40, k % 2 ? C : "#ffffff", 30, 260 + k * 40, 1.1);
  brDecal(R, "crater", f.x, f.y, 90, 12);
  R.finaleT = 2.6;
  brSay(R, "pz", R.scen.guardian ? `Verrou ${R.scen.name} levé. Le secteur respire de nouveau.` : "Anomalie dissoute. Le secteur se stabilise.", 3);
  brTicker(R, R.scen.guardian ? "VERROU LEVÉ — " + R.scen.name.toUpperCase() : "ANOMALIE DISSOUTE", "#35f0d6");
  R.scen = null;
}

/* ---------- rendu : arène, abris, pylônes, bandes noires, carte de nom ---------- */
function brDrawArena(x, R, X, Y){
  const A = R.arena;
  if(!A) return;
  const ax = X(A.x), ay = Y(A.y);
  /* au-dela du cercle, la faille : on assombrit, d'un voile pourpre */
  x.save();
  x.beginPath(); x.rect(0, 0, R.W, R.H); x.arc(ax, ay, A.r, 0, Math.PI * 2, true);
  x.fillStyle = "rgba(24,0,26,.55)"; x.fill("evenodd");
  x.strokeStyle = "#ff3d7f"; x.lineWidth = 3; x.setLineDash([14, 8]); x.lineDashOffset = -R.t * 40;
  x.beginPath(); x.arc(ax, ay, A.r, 0, 7); x.stroke(); x.setLineDash([]);
  x.globalAlpha = 0.35; x.lineWidth = 9; x.beginPath(); x.arc(ax, ay, A.r, 0, 7); x.stroke();
  x.restore();
  /* l'attaque ultime : tout rougeoie, sauf les abris */
  const U = R.ult;
  if(U){
    const k = 1 - U.t / U.max;
    x.save();
    x.beginPath(); x.rect(0, 0, R.W, R.H);
    for(const s of U.safes) x.arc(X(s.x), Y(s.y), s.r, 0, Math.PI * 2, true);
    x.fillStyle = `rgba(255,30,70,${0.12 + k * 0.38 + Math.sin(R.t * 18) * 0.05})`; x.fill("evenodd");
    for(const s of U.safes){
      x.strokeStyle = "#5ce07a"; x.lineWidth = 3; x.beginPath(); x.arc(X(s.x), Y(s.y), s.r, 0, 7); x.stroke();
      x.globalAlpha = 0.25; x.fillStyle = "#5ce07a"; x.beginPath(); x.arc(X(s.x), Y(s.y), s.r, 0, 7); x.fill(); x.globalAlpha = 1;
      x.strokeStyle = "rgba(92,224,122,.8)"; x.lineWidth = 2; x.beginPath(); x.arc(X(s.x), Y(s.y), s.r * (1 - k * 0.15) + Math.sin(R.t * 8) * 3, 0, 7); x.stroke();
    }
    /* le compte a rebours, sous l'annonce, au-dessus de l'Archiviste */
    x.fillStyle = "#ffffff"; x.font = "bold 34px ui-monospace,monospace"; x.textAlign = "center";
    x.shadowColor = "#ff3d7f"; x.shadowBlur = 14;
    x.fillText(Math.max(0, U.t).toFixed(1), R.W / 2, R.H * 0.44); x.shadowBlur = 0;
    x.restore();
  }
}
function brDrawPylon(x, R, f, fx, fy){
  /* un relais : un obelisque de donnees, relie au gardien */
  if(R.boss && R.boss.on){
    x.strokeStyle = `rgba(255,61,127,${0.45 + Math.sin(R.t * 12 + fx) * 0.25})`; x.lineWidth = 2;
    x.setLineDash([5, 5]); x.lineDashOffset = R.t * 30;
    x.beginPath(); x.moveTo(fx, fy - 30); x.lineTo(R.boss._sx ?? fx, R.boss._sy ?? fy); x.stroke(); x.setLineDash([]);
  }
  const p = 1 + Math.sin(R.t * 5 + fx) * 0.06;
  x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(fx, fy + 14, 20, 7, 0, 0, 7); x.fill();
  x.fillStyle = "#2a0a2e"; x.beginPath(); x.moveTo(fx, fy - 46 * p); x.lineTo(fx + 15, fy - 8); x.lineTo(fx, fy + 12); x.lineTo(fx - 15, fy - 8); x.closePath(); x.fill();
  x.strokeStyle = f.flash > 0 ? "#ffffff" : "#ff3d7f"; x.lineWidth = 2; x.stroke();
  x.fillStyle = f.flash > 0 ? "#ffffff" : "#35f0d6"; x.beginPath(); x.moveTo(fx, fy - 36 * p); x.lineTo(fx + 6, fy - 12); x.lineTo(fx, fy); x.lineTo(fx - 6, fy - 12); x.closePath(); x.fill();
  x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(fx - 20, fy + 20, 40, 4);
  x.fillStyle = "#ff3d7f"; x.fillRect(fx - 20, fy + 20, 40 * Math.max(0, f.hp) / f.max, 4);
}
function brDrawCine(x, R){
  const c = R.cine, W = R.W, H = R.H;
  let bars = 0;
  if(c) bars = Math.min(1, c.t / 0.4) * (c.t > c.dur - 0.4 ? Math.max(0, (c.dur - c.t) / 0.4) : 1);
  else if(R.finaleT > 0) bars = Math.min(1, R.finaleT / 0.5);
  if(bars <= 0) return;
  const bh = H * 0.11 * bars;
  x.fillStyle = "#000"; x.fillRect(0, 0, W, bh); x.fillRect(0, H - bh, W, bh);
  /* la carte de nom du gardien, glitchee */
  if(c && c.k === "intro" && R.scen && c.t > 1.1){
    const a = Math.min(1, (c.t - 1.1) / 0.3) * (c.t > c.dur - 0.5 ? Math.max(0, (c.dur - c.t) / 0.5) : 1);
    x.save(); x.globalAlpha = a; x.textAlign = "center";
    const y = H * 0.66;
    x.font = "bold 30px ui-monospace,monospace";
    x.fillStyle = "rgba(255,61,127,.85)"; x.fillText(R.scen.card, W / 2 - 3, y);
    x.fillStyle = "rgba(53,240,214,.85)"; x.fillText(R.scen.card, W / 2 + 3, y);
    x.fillStyle = "#ffffff"; x.fillText(R.scen.card, W / 2, y);
    x.fillStyle = "#ffb3cc"; x.font = "14px ui-monospace,monospace"; x.fillText(R.scen.sub, W / 2, y + 26);
    x.fillStyle = "#ff3d7f"; x.fillRect(W / 2 - 120 * a, y + 38, 240 * a, 2);
    x.restore();
  }
}
