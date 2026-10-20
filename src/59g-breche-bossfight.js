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
  el.className = "br-say on" + (R && R.cine ? " cine" : "");
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
  R.scen = {phase:1, guardian:g, name:POKE[b.id].name, card:g ? nm : nm,
            sub:g ? "VERROU " + (BR_EPITHET[POKE[b.id].types[0]] || "LÉGENDAIRE") : "ALPHA DE LA BRÈCHE"};
  /* l'arene : un cercle de corruption entre l'Archiviste et le gardien */
  const cx = R.x + (b.x - R.x) * 0.35, cy = R.y + (b.y - R.y) * 0.35;
  R.arena = {x:cx, y:cy, r:Math.max(R.W, R.H) * 1.1, target:460, burnT:0};
  brCineStart(R, b, {kicker:g ? "SIGNATURE LÉGENDAIRE" : "ANOMALIE MAJEURE", title:nm, sub:R.scen.sub,
    color:g ? "#ff3d7f" : "#ffb35c", lines:[
      [0.2, "pz", g ? `Signal légendaire : ${R.scen.name}. C'est lui qui verrouille ce secteur.` : `Une anomalie majeure se condense. Elle a pris la forme de ${R.scen.name}.`],
      [1.9, b.id, "▓ ACCÈS REFUSÉ ▓ ARCHIVE SCELLÉE ▓"]
    ]});
}
/* ============================================================
   LA MISE EN SCÈNE D'UN BOSS
   0,0 s  alerte : le jeu se fige, des bandes noires, le rouge
   0,45 s la caméra glisse vers lui et se rapproche
   0,9 s  la faille s'ouvre sous ses pieds
   1,35 s il en sort, silhouette blanche, puis ses couleurs
   1,85 s le rugissement : onde de choc, la horde balayée
   2,0 s  sa carte de nom traverse l'écran, sa vie se remplit
   fin    la caméra revient, le combat commence
   ============================================================ */
function brCineStart(R, b, o){
  o = o || {};
  R.cine = {k:"intro", t:0, dur:o.dur || 4, freeze:true, bx:b.x, by:b.y, b, o, said:{}, roared:false};
  R.mini = null;
  b.shield = true; b.rise = 1;
  R.camZ = 1;
  try { Sfx.glitch(); buzz([30, 40, 60]); } catch(e){}
}
function brCineTick(R, dt){
  const c = R.cine, D = c.dur, b = c.b;
  c.t += dt;
  brSayTick(R, dt);
  if(c.k === "intro"){
    for(const [at, who, txt] of (c.o.lines || [])) if(c.t >= at && !c.said[at]){ c.said[at] = true; brSay(R, who, txt, Math.min(3.4, D - at + 0.4)); }
    /* la caméra : elle part vers lui, s'y attarde, revient */
    const go = c.t < 0.45 ? 0 : c.t < 1.25 ? (c.t - 0.45) / 0.8 : c.t < D - 0.7 ? 1 : Math.max(0, 1 - (c.t - (D - 0.7)) / 0.7);
    const e = go * go * (3 - 2 * go);
    R.cam = {x:R.x + (c.bx - R.x) * e, y:R.y + (c.by - R.y) * e};
    R.camZ = 1 + 0.42 * e;
    /* il sort de la faille */
    if(b) b.rise = c.t < 1.35 ? 1 : Math.max(0, 1 - (c.t - 1.35) / 0.5);
    if(c.t >= 1.85 && !c.roared){
      c.roared = true; brShake(R, 13); brHitstop(R, 40);
      const C = c.o.color || "#ff3d7f";
      brRing(R, c.bx, c.by, 280, C, 0.6); brRing(R, c.bx, c.by, 160, "#ffffff", 0.35);
      brBurst(R, c.bx, c.by, C, 60, 320, 0.8); brBurst(R, c.bx, c.by, "#ffffff", 30, 260, 0.5);
      brDecal(R, "crater", c.bx, c.by + 10, 90, 14);
      /* la horde, soufflée */
      R.P.foes.each(o=>{ if(o.boss || o.fixed) return; const dx = o.x - c.bx, dy = o.y - c.by, d = Math.hypot(dx, dy) || 1;
        if(d < 320){ o.kx += dx / d * 600; o.ky += dy / d * 600; } });
      try { Sfx.boss ? Sfx.boss() : Sfx.glitch(); buzz([60, 40, 120]); } catch(e){}
    }
  }
  if(c.t >= D){
    R.cine = null; R.cam = null; R.camZ = 1;
    if(b){ b.shield = false; b.rise = 0; }
    brBanner(R, "COMBAT", c.o.color || "#ff3d7f", c.o.sub || "");
    R.last = performance.now();
  }
}
/* ---------- les entrées courtes : un alpha, un chasseur — la partie ralentit sans s'arrêter ---------- */
function brMiniIntro(R, f, title, sub, color){
  R.mini = {t:0, dur:1.9, f, title, sub, color:color || "#ffb35c"};
  R.slowmo = Math.max(R.slowmo || 0, 0.45);
  brRing(R, f.x, f.y, 140, color || "#ffb35c", 0.5);
  try { Sfx.glitch(); buzz([20, 30, 40]); } catch(e){}
}
function brMiniTick(R, dtReal){
  const m = R.mini; if(!m || R.cine) return;
  m.t += dtReal;
  const k = m.t / m.dur, e = k < 0.25 ? k / 0.25 : k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
  const ease = e * e * (3 - 2 * e);
  if(m.f && m.f.on){ R.cam = {x:R.x + (m.f.x - R.x) * 0.35 * ease, y:R.y + (m.f.y - R.y) * 0.35 * ease}; R.camZ = 1 + 0.14 * ease; }
  if(m.t >= m.dur){ R.mini = null; R.cam = null; R.camZ = 1; }
}
/* ---------- la finale : rayons, silhouette blanche, éclatement en blocs ---------- */
function brFinaleStart(R, f, color){
  R.fin = {t:0, dur:2.6, x:f.x, y:f.y, id:f.id, size:f.size, c:color || "#ff3d7f", shat:false, pz:!!f.pz};
}
function brFinaleTick(R, dtReal){
  const F = R.fin; if(!F) return;
  F.t += dtReal;
  const k = F.t < 0.3 ? F.t / 0.3 : F.t < 1.3 ? 1 : Math.max(0, 1 - (F.t - 1.3) / 1.0);
  const e = k * k * (3 - 2 * k);
  if(!R.cine && !R.mini){ R.cam = {x:R.x + (F.x - R.x) * 0.55 * e, y:R.y + (F.y - R.y) * 0.55 * e}; R.camZ = 1 + 0.3 * e; }
  if(F.t >= 1.1 && !F.shat){
    F.shat = true; F.flash = 0.35;
    brShake(R, 16);
    for(let i = 0; i < 70; i++){
      const p = R.P.parts.get(), a = R.rng() * Math.PI * 2, v = 120 + R.rng() * 360;
      p.x = F.x + (R.rng() - .5) * F.size * 0.5; p.y = F.y - F.size * 0.3 + (R.rng() - .5) * F.size * 0.5;
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 80; p.life = p.max = 0.9 + R.rng() * 0.8;
      p.color = i % 3 ? F.c : "#ffffff"; p.size = 3 + R.rng() * 6; p.sh = "cube"; p.g = 260;
    }
    brRing(R, F.x, F.y, 320, F.c, 0.7); brRing(R, F.x, F.y, 180, "#ffffff", 0.4);
    brDecal(R, "crater", F.x, F.y, 110, 14);
  }
  if(F.flash > 0) F.flash -= dtReal;
  if(F.t >= F.dur){ R.fin = null; if(!R.cine && !R.mini){ R.cam = null; R.camZ = 1; } }
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
  if(c) bars = Math.min(1, c.t / 0.35) * (c.t > c.dur - 0.4 ? Math.max(0, (c.dur - c.t) / 0.4) : 1);
  else if(R.finaleT > 0) bars = Math.min(1, R.finaleT / 0.5);
  /* l'alerte : le rouge qui bat */
  if(c && c.k === "intro" && c.t < 1.4){
    const a = (1 - c.t / 1.4) * (0.22 + Math.sin(c.t * 22) * 0.1);
    x.fillStyle = `rgba(${c.o.pz ? "53,240,214" : "255,40,80"},${Math.max(0, a)})`; x.fillRect(0, 0, W, H);
  }
  if(bars > 0){
    const bh = H * 0.1 * bars;
    x.fillStyle = "#000"; x.fillRect(0, 0, W, bh); x.fillRect(0, H - bh, W, bh);
    if(c && c.t < 1.6){ x.fillStyle = c.o.pz ? "#35f0d6" : "#ff3d7f"; x.font = "bold 10px ui-monospace,monospace"; x.textAlign = "left";
      x.fillText("⚠ " + (c.o.kicker || "SIGNATURE MAJEURE") + " ⚠", 12, bh - 8 > 10 ? bh - 8 : 12); }
  }
  /* la carte de nom : une bande en biais, le gardien en grand, son nom, sa vie */
  if(c && c.k === "intro" && c.t > 2.0 && c.b){
    const D = c.dur, k = (c.t - 2.0) / Math.max(0.5, D - 2.6);
    const inK = Math.min(1, (c.t - 2.0) / 0.3), outK = c.t > D - 0.55 ? Math.min(1, (c.t - (D - 0.55)) / 0.4) : 0;
    const slide = (1 - Math.pow(1 - inK, 3)) - outK * outK;
    const C = c.o.color || "#ff3d7f", cy = H * 0.66, bh = 104;
    x.save();
    x.globalAlpha = Math.max(0, Math.min(1, slide * 1.2));
    x.translate(W * (1 - slide), 0);
    x.beginPath(); x.moveTo(-20, cy - bh / 2 + 18); x.lineTo(W + 20, cy - bh / 2 - 18); x.lineTo(W + 20, cy + bh / 2 - 18); x.lineTo(-20, cy + bh / 2 + 18); x.closePath();
    const g = x.createLinearGradient(0, cy - bh, W, cy + bh); g.addColorStop(0, "rgba(6,2,12,.95)"); g.addColorStop(0.55, brRgbaCol(C, 0.45)); g.addColorStop(1, "rgba(6,2,12,.95)");
    x.fillStyle = g; x.fill(); x.strokeStyle = C; x.lineWidth = 2; x.stroke();
    x.clip();
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 14; i++){ const yy = cy - bh / 2 + ((i * 37 + Math.floor(c.t * 60) * 13) % bh), len = 40 + (i * 53) % 90, xx = ((i * 97 - c.t * 900) % (W + 200) + W + 200) % (W + 200) - 100;
      x.fillStyle = brRgbaCol(C, 0.3); x.fillRect(xx, yy, len, 1.5); }
    x.globalCompositeOperation = "source-over";
    /* le gardien, en grand, dans sa pose de concentration */
    const id = c.b.id, V = c.b.pz ? "n" : "c";
    const okC = typeof brAnimDraw === "function" && brAnimDraw(x, id, typeof PMD_ANIM !== "undefined" && PMD_ANIM[id] && PMD_ANIM[id].charge ? "charge" : "idle", V, 6, (c.t % 1.2), W * 0.74, cy + 54, 150);
    if(!okC) brPmdDraw(x, id, V, 6, c.t, W * 0.74, cy + 54, 150);
    x.textAlign = "left"; x.textBaseline = "middle";
    x.font = "bold 9px ui-monospace,monospace"; x.fillStyle = "#e8f0ff"; x.fillText(c.o.kicker || "SIGNATURE MAJEURE", 16, cy - 30);
    const n = c.o.title || "", fs = n.length > 12 ? 24 : 30;
    x.font = `bold ${fs}px ui-monospace,monospace`;
    x.fillStyle = "rgba(255,61,127,.85)"; x.fillText(n, 16 - 2, cy - 2); x.fillStyle = "rgba(53,240,214,.85)"; x.fillText(n, 16 + 2, cy - 2);
    x.fillStyle = "#ffffff"; x.fillText(n, 16, cy - 2);
    x.font = "bold 11px ui-monospace,monospace"; x.fillStyle = C; x.fillText(c.o.sub || "", 16, cy + 22);
    /* sa vie se remplit */
    const hpk = Math.min(1, Math.max(0, (c.t - 2.3) / 0.9));
    x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(16, cy + 36, W * 0.5, 6);
    x.fillStyle = C; x.fillRect(16, cy + 36, W * 0.5 * hpk, 6); x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(16, cy + 36, W * 0.5 * hpk, 1);
    x.restore(); x.textBaseline = "alphabetic";
  }
  /* l'entrée courte : une bande plus fine, en haut */
  const m = R.mini;
  if(m && !c){
    const k = m.t / m.dur, a = k < 0.15 ? k / 0.15 : k > 0.8 ? Math.max(0, (1 - k) / 0.2) : 1;
    const cy = H * 0.3;
    x.save(); x.globalAlpha = a;
    x.fillStyle = "rgba(6,2,12,.85)"; x.fillRect(0, cy - 26, W, 52);
    x.fillStyle = m.color; x.fillRect(0, cy - 26, W * Math.min(1, k * 3), 2); x.fillRect(W * (1 - Math.min(1, k * 3)), cy + 24, W, 2);
    x.textAlign = "center"; x.font = "bold 18px ui-monospace,monospace"; x.fillStyle = m.color; x.fillText(m.title, W / 2, cy + 2);
    if(m.sub){ x.font = "bold 10px ui-monospace,monospace"; x.fillStyle = "#e8f0ff"; x.fillText(m.sub, W / 2, cy + 18); }
    x.restore();
  }
  /* l'éclair de la finale */
  const F = R.fin;
  if(F && F.flash > 0){ x.fillStyle = `rgba(255,255,255,${Math.min(0.85, F.flash / 0.35 * 0.85)})`; x.fillRect(0, 0, W, H); }
}
function brRgbaCol(h, a){ if(!h || h[0] !== "#") return `rgba(255,61,127,${a})`; const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
/* sous les entités : la faille qui s'ouvre pendant l'entrée, les rayons de la finale */
function brDrawRift(x, R, X, Y){
  const c = R.cine;
  if(c && c.k === "intro" && c.t > 0.9 && c.b){
    const k = Math.min(1, (c.t - 0.9) / 0.6) * (c.t > c.dur - 0.5 ? Math.max(0, (c.dur - c.t) / 0.5) : 1);
    const rx = X(c.bx), ry = Y(c.by) + 10, C = c.o.color || "#ff3d7f";
    x.save();
    x.fillStyle = "rgba(8,0,14,.9)"; x.beginPath(); x.ellipse(rx, ry, 90 * k, 30 * k, 0, 0, 7); x.fill();
    x.strokeStyle = C; x.lineWidth = 3; x.beginPath(); x.ellipse(rx, ry, 90 * k, 30 * k, 0, 0, 7); x.stroke();
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 5; i++){ const a = R.t * 3 + i * 1.25; x.strokeStyle = brRgbaCol(C, 0.5); x.lineWidth = 2;
      x.beginPath(); x.ellipse(rx, ry, (40 + i * 12) * k, (13 + i * 4) * k, 0, a, a + 1.6); x.stroke(); }
    const g = x.createLinearGradient(rx, ry, rx, ry - 260 * k); g.addColorStop(0, brRgbaCol(C, 0.45 * k)); g.addColorStop(1, brRgbaCol(C, 0));
    x.fillStyle = g; x.fillRect(rx - 70 * k, ry - 260 * k, 140 * k, 260 * k);
    x.restore();
  }
  const F = R.fin;
  if(F && !F.shat){
    const fx = X(F.x), fy = Y(F.y) - F.size * 0.3, k = Math.min(1, F.t / 0.6);
    x.save(); x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 10; i++){
      const a = i / 10 * Math.PI * 2 + F.t * 1.6, len = (120 + (i % 3) * 60) * k;
      x.fillStyle = brRgbaCol(i % 2 ? F.c : "#ffffff", 0.35);
      x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a - 0.06) * len, fy + Math.sin(a - 0.06) * len); x.lineTo(fx + Math.cos(a + 0.06) * len, fy + Math.sin(a + 0.06) * len); x.closePath(); x.fill();
    }
    x.restore();
    /* la silhouette blanche qui tremble, avant l'éclatement */
    const j = (R.rng() - .5) * 6 * k;
    brPmdDraw(x, F.id, "w", 0, null, fx + j, Y(F.y), F.size * 0.95, 0.6 + Math.sin(F.t * 40) * 0.4);
  }
}
