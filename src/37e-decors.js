/* ============================================================
   37e — LES DÉCORS ET LES ACCESSOIRES
   Chaque lieu du récit est peint une fois, en pixel art, à la taille
   du monde (environ 200 pixels de large), puis gardé en mémoire. Ce qui
   bouge (la barre du moniteur, l'herbe, la mer, les poussières) est
   redessiné à chaque image par-dessus.

   Les lieux :
     labo        le laboratoire — warm (la sauvegarde d'origine), souvenir
                 (la salle claire, la barre à douze), now (le présent qui
                 s'abîme), clean (cent pour cent, exactement)
     terminal    la console d'entretien : la maison de Porygon-Z
     route       la Route 1 — day, dusk, night
     ciel        le ciel de Hoenn, une falaise, la mer
     faille      des morceaux de monde arrachés, au-dessus du vide
     zero        la Couche Zéro : onze mondes empilés sans être rangés
     tour        la Tour, le grenier de l'archive (haute : la caméra monte)
     noyau       le cœur d'un secteur — kanto, johto, hoenn
     sauvegardes onze sauvegardes, rangées par Johto qui ne jette rien
     hoenn       des montagnes dont les ombres ne tombent pas du même côté
     cote        la côte qui n'existe plus, en quatre teintes de vert
     page        une page du journal
     forage      sous la surface, une lanterne
     strates     Kanto, Johto, Hoenn : trois couches de peinture
   ============================================================ */

/* ---------- la boîte à outils du peintre ---------- */
const PL_HEX = {};
function plRgb(h){
  let v = PL_HEX[h];
  if(!v){ v = PL_HEX[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  return v;
}
function plMix(a, b, k){
  const A = plRgb(a), B = plRgb(b), f = v => Math.round(v).toString(16).padStart(2, "0");
  return "#" + f(A[0] + (B[0] - A[0]) * k) + f(A[1] + (B[1] - A[1]) * k) + f(A[2] + (B[2] - A[2]) * k);
}
const PL_B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const plBay = (X, Y) => (PL_B4[((Y & 3) << 2) + (X & 3)] + 0.5) / 16;
function plKit(x, R, W, H){
  const K = {x, R, W, H};
  K.rect = (X, Y, w, h, c) => { if(w <= 0 || h <= 0) return; x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
  K.px = (X, Y, c) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), 1, 1); };
  /* un champ de pixels : fn(i, j, X, Y) rend une couleur, ou rien */
  K.field = (X0, Y0, w, h, fn) => {
    X0 = Math.round(X0); Y0 = Math.round(Y0); w = Math.round(w); h = Math.round(h);
    if(w <= 0 || h <= 0) return;
    const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h;
    const t = tmp.getContext("2d"), img = t.createImageData(w, h), d = img.data;
    for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){
      const c = fn(i, j, X0 + i, Y0 + j); if(!c) continue;
      const v = plRgb(c), k = (j * w + i) * 4; d[k] = v[0]; d[k + 1] = v[1]; d[k + 2] = v[2]; d[k + 3] = 255;
    }
    t.putImageData(img, 0, 0); x.drawImage(tmp, X0, Y0);
  };
  /* une rampe de couleurs, tramée : f entre 0 et 1 */
  K.ramp = (cols, f, X, Y) => {
    const p = Math.max(0, Math.min(0.9999, f)) * (cols.length - 1), i = Math.floor(p), t = p - i;
    return t > plBay(X, Y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i];
  };
  K.vgrad = (X0, Y0, w, h, cols) => K.field(X0, Y0, w, h, (i, j, X, Y) => K.ramp(cols, j / Math.max(1, h - 1), X, Y));
  K.dith = (X0, Y0, w, h, c, a) => K.field(X0, Y0, w, h, (i, j, X, Y) => plBay(X, Y) < a ? c : null);
  K.line = (x0, y0, x1, y1, c) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy; x.fillStyle = c;
    for(let n = 0; n < 2000; n++){ x.fillRect(x0, y0, 1, 1); if(x0 === x1 && y0 === y1) break; const e2 = 2 * e; if(e2 >= dy){ e += dy; x0 += sx; } if(e2 <= dx){ e += dx; y0 += sy; } }
  };
  K.disc = (cx, cy, r, c) => { x.fillStyle = c; for(let j = -r; j <= r; j++){ const h = Math.floor(Math.sqrt(r * r - j * j + r * 0.6)); x.fillRect(Math.round(cx - h), Math.round(cy + j), h * 2 + 1, 1); } };
  K.oval = (cx, cy, rx, ry, c) => { x.fillStyle = c; for(let j = -ry; j <= ry; j++){ const h = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.01)))); x.fillRect(Math.round(cx - h), Math.round(cy + j), h * 2 + 1, 1); } };
  K.text = (X, Y, t, c, s) => plText(x, t, X, Y, c, s);
  K.ball = (X, Y, open) => plDrawBall(x, X, Y, 0, open);
  return K;
}
/* une Poké Ball de 7 pixels */
function plDrawBall(x, X, Y, f, dim){
  X = Math.round(X); Y = Math.round(Y);
  const P = dim ? ["#3a2a2a", "#a03a3a", "#c8c0b8", "#1a1414"] : ["#1a1414", "#e8384a", "#f4f0ec", "#1a1414"];
  const rows = f ? ["..###..", ".#WWW#.", "#WWWWW#", "##B#B##", "#RRRRR#", ".#RRR#.", "..###.."]
                 : ["..###..", ".#RRR#.", "#RRRRR#", "##B#B##", "#WWWWW#", ".#WWW#.", "..###.."];
  rows.forEach((r, j)=>{ for(let i = 0; i < 7; i++){ const ch = r[i]; if(ch === ".") continue;
    x.fillStyle = ch === "#" ? P[0] : ch === "R" ? P[1] : ch === "W" ? P[2] : "#f4f0ec"; x.fillRect(X + i, Y + j, 1, 1); } });
  x.fillStyle = "#ffffff"; if(!f) x.fillRect(X + 2, Y + 1, 1, 1);
}
/* un nuage en pixels, sur sa propre toile */
function plCloud(w, h, R, cols){
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d"), blobs = [];
  for(let i = 0; i < 5 + (R() * 3 | 0); i++) blobs.push([w * (0.15 + R() * 0.7), h * (0.4 + R() * 0.3), h * (0.25 + R() * 0.3)]);
  for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){
    let best = 0, top = 0;
    for(const [bx, by, br] of blobs){ const d = Math.hypot((i - bx) * 0.8, j - by) / br; if(1 - d > best){ best = 1 - d; top = (j - (by - br)) / (2 * br); } }
    if(best <= 0 || j > h * 0.82) continue;
    const shade = top > 0.62 ? 2 : top > 0.4 ? 1 : 0;
    x.fillStyle = (shade === 1 && plBay(i, j) < 0.5) ? cols[0] : cols[shade];
    x.fillRect(i, j, 1, 1);
  }
  return cv;
}

/* ============================================================
   LE LABORATOIRE
   ============================================================ */
const PL_LABO_PAL = {
  warm:     {wall:["#f4e8d0", "#eadbbd", "#dccaa6"], wallTop:"#bfa682", wain:"#9a6a44", wainHi:"#b8845a", wainLo:"#5a3a22",
             tA:"#e6dece", tB:"#d2c8b2", grout:"#b4aa94", fog:"#d8ccb0", wood:"#7a4e30", woodLo:"#4e2e1a", woodHi:"#9a6a44",
             bezel:"#dcd8d0", bezelLo:"#8e8a84", screen:"#173326", scr2:"#1f4432", txt:"#9ff0b4",
             books:["#c8483a", "#3a6ec8", "#4aa058", "#d8a038", "#8a4ab0", "#e8e4d6", "#3a3a4a", "#d86a3a"],
             leaf:["#2f7a34", "#4aa048", "#7ac85a"], pot:"#b05a3a", potLo:"#7a3a24", sky:["#9fd4f2", "#cfeefa"], frame:"#f6efe2"},
  now:      {wall:["#3a4256", "#333a4d", "#2b3142"], wallTop:"#20242f", wain:"#262b38", wainHi:"#323848", wainLo:"#181b24",
             tA:"#3a4252", tB:"#323848", grout:"#262c38", fog:"#2b3142", wood:"#2e2a30", woodLo:"#1a1820", woodHi:"#3c3640",
             bezel:"#5a5e68", bezelLo:"#34363e", screen:"#04101a", scr2:"#071a26", txt:"#35f0d6",
             books:["#5a3a3e", "#3a4a66", "#3e5a48", "#6a5a3a", "#4a3a5a", "#6a6a66", "#26262e", "#5a4038"],
             leaf:["#4a3e30", "#5e4e3a", "#6e5a44"], pot:"#4a3430", potLo:"#2e201c", sky:["#1a2236", "#26304a"], frame:"#4a4e5a"}
};
PL_LABO_PAL.souvenir = PL_LABO_PAL.warm;
PL_LABO_PAL.clean = Object.assign({}, PL_LABO_PAL.warm, {wall:["#f8eedb", "#f0e3c8", "#e6d4b2"], tA:"#efe8da", tB:"#ddd4c0"});
PL_SETS.labo = {
  light:"none", scan:0.04,
  anchors:{spot:[0.5, 0.7], pz:[0.72, 0.62], prof:[0.5, 0.585], left:[0.26, 0.64], right:[0.74, 0.64], table:[0.25, 0.555],
    monitor:[0.5, 0.33], door:[0.94, 0.6], center:[0.5, 0.62], back:[0.5, 0.52], m1:[0.14, 0.66], m2:[0.33, 0.69], m3:[0.67, 0.69], m4:[0.86, 0.66],
    file:[0.3, 0.3], mn:[0.32, 0.62], offL:[-0.12, 0.66], offR:[1.12, 0.66]},
  paint(x, W, H, R, v, K){
    const P = PL_LABO_PAL[v] || PL_LABO_PAL.warm, now = v === "now";
    const gy = Math.round(H * 0.47);
    /* le mur : un dégradé tramé, plus sombre sous le plafond */
    K.field(0, 0, W, gy, (i, j, X, Y) => j < gy * 0.14 ? K.ramp([P.wallTop, P.wall[0]], j / (gy * 0.14), X, Y) : K.ramp(P.wall, (j - gy * 0.14) / (gy * 0.86), X, Y));
    /* des lattes verticales, à peine */
    for(let X = 9; X < W; X += 18) K.dith(X, Math.round(gy * 0.14), 1, gy - Math.round(gy * 0.14) - 14, P.wallTop, 0.22);
    /* la fenêtre, à gauche : le ciel, et la lumière qui entre */
    const wx = 10, wy = Math.round(gy * 0.3), ww = 30, wh = 34;
    K.rect(wx - 2, wy - 2, ww + 4, wh + 4, P.frame); K.rect(wx - 2, wy + wh + 2, ww + 4, 2, P.woodLo);
    K.vgrad(wx, wy, ww, wh, P.sky);
    if(!now){ for(let i = 0; i < 3; i++){ const cx = wx + 6 + R() * 18, cy = wy + 6 + R() * 12; K.rect(cx, cy, 6, 2, "#ffffff"); K.rect(cx + 2, cy - 1, 3, 1, "#ffffff"); } }
    else { for(let i = 0; i < 4; i++) K.rect(wx + R() * ww, wy + R() * wh, 2, 2, R() < 0.5 ? "#ff3d7f" : "#000000"); }
    K.rect(wx + ww / 2 - 1, wy, 2, wh, P.frame); K.rect(wx, wy + wh / 2 - 1, ww, 2, P.frame);
    /* le moniteur : le grand écran du laboratoire */
    const mx = Math.round(W / 2 - 33), my = Math.round(gy * 0.32), mw = 66, mh = 46;
    K.rect(mx - 4, my - 4, mw + 8, mh + 8, P.bezelLo); K.rect(mx - 3, my - 3, mw + 6, mh + 6, P.bezel);
    K.rect(mx - 3, my + mh + 2, mw + 6, 1, P.bezelLo);
    K.vgrad(mx, my, mw, mh, [P.scr2, P.screen]);
    K.rect(mx + mw - 6, my + mh + 4, 3, 1, now ? "#ff3d7f" : "#5ae07a");
    K.rect(mx + 8, my - 7, 3, 3, P.bezelLo); K.rect(mx + mw - 11, my - 7, 3, 3, P.bezelLo);
    /* l'horloge, entre la fenêtre et l'écran */
    const ckx = Math.round((wx + ww + mx) / 2), cky = Math.round(wy + 2);
    K.disc(ckx, cky, 6, P.bezelLo); K.disc(ckx, cky, 5, now ? "#2a2e38" : "#fbf6ea");
    for(let k = 0; k < 12; k += 3){ const a = k / 12 * Math.PI * 2; K.px(ckx + Math.sin(a) * 4, cky - Math.cos(a) * 4, P.bezelLo); }
    /* le comptoir sous le moniteur */
    K.rect(0, gy - 16, W, 3, P.woodHi); K.rect(0, gy - 13, W, 13, P.wain);
    for(let X = 4; X < W; X += 22){ K.rect(X, gy - 11, 18, 9, P.wainHi); K.rect(X + 1, gy - 10, 16, 7, P.wain); }
    K.rect(0, gy - 1, W, 1, P.wainLo);
    /* l'étagère, à droite : des livres, des Poké Balls */
    const sx = W - 46, sy = Math.round(gy * 0.2), swd = 40, sht = gy - 16 - sy;
    K.rect(sx - 2, sy - 2, swd + 4, sht + 2, P.woodLo); K.rect(sx, sy, swd, sht, P.wood);
    const shelves = 4, sh = Math.floor(sht / shelves);
    for(let s = 0; s < shelves; s++){
      const by = sy + s * sh, base = by + sh - 2;
      K.rect(sx, base, swd, 2, P.woodHi); K.rect(sx, base + 2, swd, 1, P.woodLo);
      let bx = sx + 2;
      while(bx < sx + swd - 4){
        const bw = 2 + (R() * 3 | 0), bh = Math.max(4, sh - 4 - (R() * 5 | 0));
        if(now && R() < 0.3){ bx += bw + 1; continue; }
        if(R() < 0.1 && bx < sx + swd - 9){ plDrawBall(x, bx, base - 7, 0, now); bx += 8; continue; }
        const col = P.books[R() * P.books.length | 0];
        K.rect(bx, base - bh, bw, bh, col); K.rect(bx, base - bh, bw, 1, plMix(col, "#ffffff", 0.25)); K.rect(bx + bw - 1, base - bh + 1, 1, bh - 1, plMix(col, "#000000", 0.3));
        if(now && R() < 0.15) K.rect(bx, base - bh + (R() * bh | 0), bw, 1, R() < 0.5 ? "#35f0d6" : "#ff3d7f");
        bx += bw + (R() < 0.2 ? 1 : 0);
      }
    }
    /* le sol, en perspective : un damier qui s'éloigne */
    const vx = W / 2, D0 = 16, Kp = 10.5, Kv = 3600;
    K.field(0, gy, W, H - gy, (i, j, X, Y) => {
      const d = j + D0, u = (X - vx) * Kp / d, w2 = Kv / d;
      const tu = u - Math.floor(u), tv = w2 / 3 - Math.floor(w2 / 3);
      const grout = tu < 0.05 || tv < 0.04;
      const chk = (Math.floor(u) + Math.floor(w2 / 3)) & 1;
      let c = grout ? P.grout : chk ? P.tA : P.tB;
      const fog = 1 - j / ((H - gy) * 0.22);
      if(fog > 0 && plBay(X, Y) < fog) c = P.fog;
      return c;
    });
    /* la lumière de la fenêtre, posée sur le sol */
    if(!now) K.field(0, gy, W, H - gy, (i, j, X, Y) => {
      const t = (X - 8) - (j * 0.55), inside = t > 0 && t < 34 + j * 0.5 && j < (H - gy) * 0.8;
      return inside && plBay(X, Y) < 0.28 * (1 - j / ((H - gy) * 0.8)) ? "#fff8e6" : null;
    });
    /* la table des trois Poké Balls */
    const tx = Math.round(W * 0.25), ty = Math.round(gy + (H - gy) * 0.17);
    K.rect(tx - 22, ty + 4, 2, 14, P.woodLo); K.rect(tx + 20, ty + 4, 2, 14, P.woodLo);
    K.rect(tx - 24, ty - 2, 48, 7, P.woodHi); K.rect(tx - 24, ty + 5, 48, 2, P.woodLo); K.rect(tx - 24, ty - 2, 48, 1, plMix(P.woodHi, "#ffffff", 0.3));
    if(v !== "now"){ for(let i = 0; i < 3; i++) plDrawBall(x, tx - 15 + i * 11, ty - 9, 0, false); }
    else { plDrawBall(x, tx + 7, ty - 9, 0, true); K.dith(tx - 16, ty - 8, 7, 6, "#35f0d6", 0.2); }
    /* une plante dans un coin */
    const px = W - 18, py = Math.round(gy + 6);
    K.rect(px - 6, py, 12, 10, P.pot); K.rect(px - 6, py + 8, 12, 2, P.potLo); K.rect(px - 7, py - 1, 14, 2, plMix(P.pot, "#ffffff", 0.15));
    for(let i = 0; i < 9; i++){ const a = -Math.PI / 2 + (i - 4) * 0.34, L = 10 + R() * 9;
      for(let k = 0; k < L; k++){ const X = px + Math.cos(a) * k * (0.6 + k / L * 0.5), Y = py - 1 + Math.sin(a) * k + (k * k) / (L * 2.6); K.px(X, Y, P.leaf[k > L * 0.66 ? 2 : k > L * 0.3 ? 1 : 0]); } }
    /* l'endroit exact : un sol un peu plus usé, là où l'on se tient le premier jour */
    const spy = Math.round(H * 0.7);
    K.field(Math.round(W / 2 - 14), spy - 3, 28, 7, (i, j, X, Y) => { const d = Math.hypot((i - 14) / 14, (j - 3) / 3.4); return d < 1 && plBay(X, Y) < 0.32 * (1 - d) ? (now ? "#4a5468" : "#f8f2e4") : null; });
    /* le présent : des pixels manquants, des fêlures */
    if(now){
      for(let i = 0; i < 26; i++){ const X = R() * W, Y = R() * H, s = 1 + (R() * 3 | 0); K.rect(X, Y, s, s, R() < 0.7 ? "#05070c" : R() < 0.5 ? "#35f0d6" : "#ff3d7f"); }
      for(let i = 0; i < 3; i++){ let X = R() * W, Y = gy + R() * (H - gy); for(let k = 0; k < 18; k++){ K.px(X, Y, "#141822"); X += R() < 0.5 ? 1 : -1; Y += 1; } }
    }
    return {gy, mon:{x:mx, y:my, w:mw, h:mh}, win:{x:wx, y:wy, w:ww, h:wh}, clock:[ckx, cky]};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, M = I.mon; if(!M) return;
    const calm = plCalm(), now = v === "now";
    /* les aiguilles : dans le présent, elles ne savent plus l'heure */
    if(I.clock){
      const [cx, cy] = I.clock, hand = (a, L, col) => { for(let k = 1; k <= L; k++){ x.fillStyle = col; x.fillRect(Math.round(cx + Math.sin(a) * k), Math.round(cy - Math.cos(a) * k), 1, 1); } };
      const tt = now ? (calm ? 2 : Math.floor(t * 3) % 2 ? 2.1 : 5.3) : t * 0.02;
      hand(tt / 12, 2, now ? "#35f0d6" : "#3a2a1e"); hand(tt, 4, now ? "#ff3d7f" : "#5a4a3a");
    }
    /* le moniteur : la barre d'initialisation (bloquée à douze, sauf quand le monde est entier) */
    let val = st.bar !== undefined ? st.bar : v === "clean" ? 100 : (v === "warm" && !st.bar) ? -1 : 12;
    if(st.barTo !== undefined){ const k = Math.min(1, (t - st.t0) / ((st.barMs || 2600) / 1000)); val = Math.round(st.bar + (st.barTo - st.bar) * plEase(k)); }
    const txt = now ? "#35f0d6" : "#9ff0b4";
    if(val < 0){
      /* la sauvegarde d'origine : l'écran d'accueil, un curseur qui clignote */
      plText(x, "BIENVENUE", M.x + 6, M.y + 8, txt);
      plText(x, "SAUVEGARDE", M.x + 6, M.y + 16, plMix(txt, "#173326", 0.4));
      plText(x, "D'ORIGINE", M.x + 6, M.y + 22, plMix(txt, "#173326", 0.4));
      if(calm || Math.floor(t * 2) % 2) x.fillStyle = txt, x.fillRect(M.x + 6, M.y + 32, 3, 5);
    } else {
      const dots = calm ? "..." : ".".repeat(1 + Math.floor(t * 1.5) % 3);
      plText(x, "INITIALISATION", M.x + 6, M.y + 7, txt);
      plText(x, "DU MONDE" + dots, M.x + 6, M.y + 14, txt);
      const bx = M.x + 6, by = M.y + 25, bw = M.w - 12;
      x.fillStyle = txt; x.fillRect(bx, by, bw, 1); x.fillRect(bx, by + 6, bw, 1); x.fillRect(bx, by, 1, 7); x.fillRect(bx + bw - 1, by, 1, 7);
      const fill = Math.round((bw - 4) * val / 100);
      x.fillStyle = val >= 100 ? "#ffffff" : txt; x.fillRect(bx + 2, by + 2, fill, 3);
      if(val < 100 && !calm && Math.floor(t * 3) % 2) { x.fillStyle = txt; x.globalAlpha = 0.4; x.fillRect(bx + 2 + fill, by + 2, 1, 3); x.globalAlpha = 1; }
      plText(x, val + "%", M.x + M.w / 2 - plTextW(val + "%") / 2, M.y + 35, val >= 100 ? "#ffffff" : txt);
    }
    /* le balayage de l'écran */
    x.globalAlpha = 0.12; x.fillStyle = "#ffffff"; x.fillRect(M.x, M.y + ((t * 14) % M.h), M.w, 1); x.globalAlpha = 1;
    if(now && !calm){
      /* le présent clignote : des pixels qui hésitent */
      const R = plRng(Math.floor(t * 6));
      for(let i = 0; i < 5; i++){ x.fillStyle = R() < 0.5 ? "#35f0d6" : "#ff3d7f"; x.globalAlpha = 0.6; x.fillRect(R() * W | 0, R() * H | 0, 1, 1); }
      x.globalAlpha = 1;
    }
    if(!now && v !== "clean" && !calm){
      /* des poussières dans la lumière de la fenêtre */
      for(let i = 0; i < 9; i++){
        const ph = i * 1.9, X = 14 + ((i * 23 + t * (2 + i % 3)) % 70), Y = I.gy + 10 + ((i * 37 + Math.sin(t * 0.7 + ph) * 8) % 90);
        x.globalAlpha = 0.35 + 0.25 * Math.sin(t * 1.3 + ph); x.fillStyle = "#fffaf0"; x.fillRect(X | 0, Y | 0, 1, 1);
      }
      x.globalAlpha = 1;
    }
  }
};

/* ============================================================
   LA CONSOLE D'ENTRETIEN — la maison de Porygon-Z
   ============================================================ */
PL_SETS.terminal = {
  light:"none", scan:0.1,
  anchors:{pz:[0.62, 0.63], left:[0.3, 0.64], right:[0.78, 0.64], center:[0.5, 0.64], mon:[0.3, 0.64], counter:[0.5, 0.15],
    file:[0.27, 0.34], log:[0.74, 0.3], spot:[0.5, 0.72], egg:[0.34, 0.64]},
  paint(x, W, H, R, v, K){
    const gy = Math.round(H * 0.5);
    K.vgrad(0, 0, W, gy, ["#02050b", "#03070f", "#051020", "#08182c"]);
    /* le mur : une grille, de loin */
    for(let X = 6; X < W; X += 14) K.dith(X, 0, 1, gy, "#0d2a3a", 0.5);
    for(let Y = 8; Y < gy; Y += 14) K.dith(0, Y, W, 1, "#0d2a3a", 0.5);
    /* des fenêtres qui flottent, avec leurs lignes */
    const wins = [[8, Math.round(gy * 0.38), 54, 40, "journal.log"], [W - 66, Math.round(gy * 0.3), 58, 46, "index"], [Math.round(W / 2 - 30), Math.round(gy * 0.62), 40, 26, ""]];
    for(const [wx, wy, ww, wh, tt] of wins){
      K.rect(wx, wy, ww, wh, "#06121e"); K.rect(wx, wy, ww, 6, "#0e3a48");
      K.rect(wx, wy, ww, 1, "#35f0d6"); K.rect(wx, wy + wh - 1, ww, 1, "#155a66"); K.rect(wx, wy, 1, wh, "#155a66"); K.rect(wx + ww - 1, wy, 1, wh, "#155a66");
      if(tt) K.text(wx + 3, wy + 1, tt, "#8ff7ea");
      for(let Y = wy + 9; Y < wy + wh - 3; Y += 4){ const L = 4 + R() * (ww - 12); K.rect(wx + 3, Y, L, 1, R() < 0.12 ? "#ff3d7f" : "#1f6e78"); if(R() < 0.3) K.rect(wx + 5 + L, Y, 3 + R() * 6, 1, "#2a8a94"); }
    }
    /* le sol : une grille en perspective, qui se perd dans le noir */
    K.field(0, gy, W, H - gy, (i, j, X, Y) => {
      const d = j + 10, u = (X - W / 2) * 7 / d, w2 = 1900 / d;
      const tu = u - Math.floor(u), tv = w2 / 2 - Math.floor(w2 / 2);
      const far = Math.min(1, j / ((H - gy) * 0.5));
      if((tu < 0.06 || tv < 0.05) && plBay(X, Y) < 0.25 + 0.6 * far) return far > 0.6 ? "#1a6a78" : "#0f3e4c";
      return K.ramp(["#08182c", "#050d18", "#03070e"], j / (H - gy), X, Y);
    });
    /* le socle du projecteur, sous Porygon-Z */
    const px = Math.round(W * 0.62), py = Math.round(H * 0.63);
    K.oval(px, py + 1, 15, 4, "#0a2a36"); K.oval(px, py, 13, 3, "#103e4c"); K.oval(px, py, 10, 2, "#1a6a78");
    K.oval(px, py, 6, 1, "#35f0d6");
    /* une console, à gauche : un clavier lumineux */
    const kx = Math.round(W * 0.14), ky = Math.round(H * 0.58);
    K.rect(kx - 12, ky, 26, 9, "#0b1e2c"); K.rect(kx - 12, ky, 26, 1, "#2a8a94");
    for(let r = 0; r < 2; r++) for(let k = 0; k < 6; k++) K.rect(kx - 10 + k * 4, ky + 2 + r * 3, 3, 2, R() < 0.2 ? "#35f0d6" : "#16404e");
    K.rect(kx - 10, ky + 9, 2, 12, "#0b1e2c"); K.rect(kx + 10, ky + 9, 2, 12, "#0b1e2c");
    return {gy, wins};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm();
    /* le compteur d'intégrité, en haut : la vraie valeur */
    let val = st.integ !== undefined ? st.integ : (typeof S !== "undefined" && S ? S.integrity || 0 : 0);
    /* l'histoire du compteur, rejouée : il descendait, puis il remonte */
    if(st.integSeq){ const k = Math.min(st.integSeq.length - 1, Math.floor((t - st.t0) / (st.integStep || 0.4))); val = st.integSeq[Math.max(0, k)]; }
    const s = (Math.round(val * 10) / 10).toFixed(1).replace(".", ",") + "%";
    const yy = Math.round(H * 0.12);
    plText(x, "INTEGRITE DU MONDE", W / 2 - plTextW("INTEGRITE DU MONDE") / 2, yy - 8, "#3aa9b4");
    plText(x, s, W / 2 - plTextW(s, 2) / 2, yy, val >= 100 ? "#ffffff" : "#35f0d6", 2);
    /* des colonnes de données qui tombent, très loin */
    if(!calm){
      for(let i = 0; i < 7; i++){
        const X = 10 + i * (W - 20) / 6, sp = 9 + (i * 7) % 6, Y = ((t * sp + i * 41) % (I.gy + 20)) - 10;
        x.globalAlpha = 0.28; plText(x, "0123456789ABCDEF"[(Math.floor(t * 4) + i * 3) % 16], X, Y, "#1f8a94"); x.globalAlpha = 1;
      }
    }
    /* le socle respire */
    const px = Math.round(W * 0.62), py = Math.round(H * 0.63);
    x.globalAlpha = calm ? 0.3 : 0.25 + 0.2 * Math.sin(t * 2.4); x.fillStyle = "#35f0d6";
    x.fillRect(px - 10, py, 21, 1); x.globalAlpha = 1;
  }
};

/* ============================================================
   LA ROUTE 1
   ============================================================ */
const PL_ROUTE_PAL = {
  day:  {sky:["#4f9de6", "#73b6ee", "#9ccdf2", "#c8e6f6"], hill1:"#86b4a4", hill2:"#5e9a74", grass:["#5fb64c", "#4ea343", "#3f9139"],
         path:["#dcc48c", "#c8ae76", "#b09060"], tree:["#256f36", "#378f44", "#5ab456"], trunk:"#6a4a2a", tg:["#21612a", "#2f8436", "#78c65a"],
         fence:"#a8805a", fenceLo:"#6e5038", sign:"#b8885a"},
  dusk: {sky:["#2a1f4e", "#4f2b66", "#94415f", "#d9683f", "#f6a85a"], hill1:"#7a3f60", hill2:"#4f2c4c", grass:["#6a6e3e", "#57593a", "#454430"],
         path:["#b88a6a", "#9a725a", "#7a5a48"], tree:["#2a1c2e", "#3a2638", "#4e3446"], trunk:"#2a1a22", tg:["#2c3a26", "#3c4a2c", "#8a8a4a"],
         fence:"#7a5446", fenceLo:"#4a3030", sign:"#8a5a44"},
  night:{sky:["#04071a", "#0a1230", "#141f46", "#24305a"], hill1:"#1c2444", hill2:"#141a34", grass:["#1f3c3c", "#19322f", "#132825"],
         path:["#3c4450", "#323a44", "#283038"], tree:["#0d1a20", "#13252a", "#1c3236"], trunk:"#141418", tg:["#10282a", "#163434", "#3a6a5a"],
         fence:"#3a3a44", fenceLo:"#22222a", sign:"#3e3a40"}
};
PL_SETS.route = {
  light:"none", scan:0.03,
  anchors:{left:[0.28, 0.64], right:[0.72, 0.64], center:[0.48, 0.65], grass:[0.76, 0.66], pz:[0.66, 0.6], spot:[0.42, 0.7],
    sign:[0.2, 0.58], far:[0.56, 0.42], mon:[0.6, 0.67], throw:[0.36, 0.66], catch:[0.62, 0.64]},
  paint(x, W, H, R, v, K){
    const P = PL_ROUTE_PAL[v] || PL_ROUTE_PAL.day, hz = Math.round(H * 0.38);
    K.vgrad(0, 0, W, hz, P.sky);
    if(v === "night"){ for(let i = 0; i < 70; i++){ const X = R() * W, Y = R() * hz * 0.9; K.px(X, Y, R() < 0.2 ? "#ffffff" : "#8a9ac8"); }
      K.disc(W * 0.78, hz * 0.26, 6, "#e8ecf4"); K.disc(W * 0.78 + 2, hz * 0.26 - 1, 5, P.sky[1]); }
    if(v === "dusk"){
      /* le soleil, bas, à moitié derrière les collines */
      const sx = W * 0.62, sy = hz - 6;
      K.field(sx - 40, sy - 40, 80, 46, (i, j, X, Y) => { const d = Math.hypot(i - 40, j - 40); return d < 40 && plBay(X, Y) < (1 - d / 40) * 0.5 ? "#ffd38a" : null; });
      K.disc(sx, sy, 13, "#ffd890"); K.disc(sx, sy, 11, "#ffe8b0");
      for(let i = 0; i < 4; i++) K.rect(sx - 30 + i * 6, sy - 18 + i * 5, 26 - i * 4, 1, "#f6b070");
    }
    /* deux rangées de collines */
    const hill = (base, amp, col, ph) => K.field(0, base - amp - 4, W, amp + 6, (i, j, X, Y) => {
      const top = amp * (0.5 + 0.3 * Math.sin(X * 0.035 + ph) + 0.2 * Math.sin(X * 0.11 + ph * 2));
      return j > amp + 4 - top ? col : null; });
    hill(hz, 26, P.hill1, 1.3); hill(hz + 4, 16, P.hill2, 4.1);
    /* l'herbe */
    K.field(0, hz, W, H - hz, (i, j, X, Y) => {
      const n = Math.sin(X * 0.9 + Y * 0.3) * 0.5 + Math.sin(X * 0.23 - Y * 1.7) * 0.5;
      return K.ramp(P.grass, Math.min(1, j / (H - hz) * 1.3 + n * 0.12), X, Y); });
    for(let i = 0; i < 160; i++){ const X = R() * W, Y = hz + 6 + R() * (H - hz); K.px(X, Y, P.grass[0]); K.px(X, Y - 1, plMix(P.grass[0], "#ffffff", 0.2)); }
    /* le chemin, qui monte en serpentant */
    K.field(0, hz, W, H - hz, (i, j, X, Y) => {
      const k = j / (H - hz), cx = W * (0.56 - 0.16 * k + 0.05 * Math.sin(k * 5)), hw = 4 + k * 26;
      const d = Math.abs(X - cx);
      if(d > hw) return null;
      return K.ramp(P.path, d / hw * 0.9 + (plBay(X, Y) < 0.1 ? 0.2 : 0), X, Y); });
    /* des arbres, de chaque côté */
    const tree = (tx, ty, r) => {
      K.rect(tx - 2, ty - 2, 4, r + 2, P.trunk);
      K.field(tx - r - 2, ty - r * 2 - 2, r * 2 + 4, r * 2 + 4, (i, j, X, Y) => {
        const dx = (i - r - 2) / r, dy = (j - r - 2) / r, d = Math.hypot(dx, dy * 1.05);
        if(d > 1 + (plBay(X, Y) < 0.25 ? 0.08 : 0)) return null;
        const l = (-dx * 0.6 - dy * 0.8) * 0.5 + 0.5;
        return K.ramp([P.tree[0], P.tree[1], P.tree[2]], l * 0.9 + (d > 0.85 ? -0.3 : 0), X, Y); });
    };
    for(let i = 0; i < 4; i++) tree(8 + i * 13 + R() * 4, hz + 10 + (i % 2) * 6, 9 + R() * 3);
    for(let i = 0; i < 3; i++) tree(W - 10 - i * 14 - R() * 4, hz + 8 + (i % 2) * 7, 10 + R() * 3);
    /* la clôture, le long du chemin */
    const fy = Math.round(H * 0.5);
    for(let k = 0; k < 6; k++){ const X = Math.round(W * 0.06 + k * 11), Y = fy + k * 3; K.rect(X, Y - 9, 2, 10, P.fence); K.rect(X, Y + 1, 2, 1, P.fenceLo); }
    for(let k = 0; k < 5; k++){ const X = Math.round(W * 0.06 + k * 11), Y = fy + k * 3; K.line(X, Y - 7, X + 11, Y - 4, P.fence); K.line(X, Y - 3, X + 11, Y, P.fence); }
    /* le panneau */
    const sx = Math.round(W * 0.2), sy = Math.round(H * 0.56);
    K.rect(sx - 1, sy - 10, 2, 12, P.fenceLo); K.rect(sx - 17, sy - 20, 34, 11, P.fenceLo); K.rect(sx - 16, sy - 19, 32, 9, P.sign);
    K.text(sx - 13, sy - 17, "ROUTE 1", v === "night" ? "#8a8a96" : "#3a2414");
    /* les hautes herbes : le carré des rencontres */
    const gx0 = Math.round(W * 0.6), gx1 = W + 2, gy0 = Math.round(H * 0.6), gy1 = Math.round(H * 0.76);
    for(let Y = gy0; Y < gy1; Y += 6) for(let X = gx0 + (((Y - gy0) / 6) % 2) * 4; X < gx1; X += 8) plTuft(x, X, Y, P.tg, 0);
    return {hz, tall:[gx0, gy0, gx1, gy1]};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm(), PP = PL_ROUTE_PAL[v] || PL_ROUTE_PAL.day;
    if(!I.tall) return;
    /* le vent dans les hautes herbes : les pointes bougent, rangée par rangée */
    if(!calm){
      const [gx0, gy0, gx1, gy1] = I.tall;
      for(let Y = gy0; Y < gy1; Y += 6){
        if(Math.sin(t * 2.2 - Y * 0.15) < 0.55) continue;
        for(let X = gx0 + (((Y - gy0) / 6) % 2) * 4; X < gx1; X += 8){ x.fillStyle = PP.tg[2]; x.fillRect(X + 1, Y - 6, 1, 1); x.fillRect(X + 5, Y - 5, 1, 1); }
      }
    }
    if(v === "dusk" && !calm){
      /* des oiseaux qui rentrent */
      for(let i = 0; i < 3; i++){ const X = ((t * (6 + i) + i * 60) % (W + 40)) - 20, Y = I.hz * (0.3 + i * 0.12) + Math.sin(t + i) * 3, f = Math.floor(t * 4 + i) % 2;
        x.fillStyle = "#2a1630"; x.fillRect(X | 0, Y | 0, 1, 1); x.fillRect((X - 1) | 0, (Y - f) | 0, 1, 1); x.fillRect((X + 1) | 0, (Y - f) | 0, 1, 1); }
    }
    if(v === "night" && !calm){
      for(let i = 0; i < 8; i++){ const X = (W * 0.2 + i * 23 + Math.sin(t * 0.7 + i) * 9) % W, Y = H * 0.55 + Math.sin(t * 0.9 + i * 2) * 14 + i * 5;
        x.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); x.fillStyle = "#e8f8a0"; x.fillRect(X | 0, Y | 0, 1, 1); }
      x.globalAlpha = 1;
    }
    if(v === "day" && !calm){
      if(!I.clouds){ const R = plRng(9); I.clouds = [0, 1].map(i=>plCloud(34 + i * 10, 14, R, ["#ffffff", "#e6f2fa", "#c4dcee"])); }
      I.clouds.forEach((cv, i)=>{ const X = ((t * (1.5 + i) + i * 110) % (W + 60)) - 50; x.drawImage(cv, Math.round(X), Math.round(I.hz * (0.18 + i * 0.22))); });
    }
  }
};
/* une touffe de hautes herbes, à la manière des jeux d'origine */
function plTuft(x, X, Y, P, sway){
  const rows = ["..1...1.", ".121.121", "12221222", "12222222", "02222220", "00222200"];
  rows.forEach((r, j)=>{ for(let i = 0; i < 8; i++){ const ch = r[i]; if(ch === ".") continue; x.fillStyle = ch === "1" ? P[2] : ch === "2" ? P[1] : P[0]; x.fillRect(X + i + (j < 2 ? sway : 0), Y - 6 + j, 1, 1); } });
}

/* ============================================================
   LE CIEL DE HOENN
   ============================================================ */
PL_SETS.ciel = {
  light:"none", scan:0.02, sep:0.5,
  anchors:{edge:[0.5, 0.655], left:[0.3, 0.665], right:[0.56, 0.655], pz:[0.58, 0.645], center:[0.42, 0.665], sky:[0.5, 0.22], q:[0.5, 0.2], spot:[0.36, 0.69]},
  paint(x, W, H, R, v, K){
    const hz = Math.round(H * 0.47);
    K.vgrad(0, 0, W, hz, ["#16367a", "#2152a2", "#3a7ccc", "#68aae2", "#a6d4f2", "#d8eef8"]);
    /* la mer, très loin dessous, jusqu'au bas de l'image */
    K.field(0, hz, W, H - hz, (i, j, X, Y) => {
      const k = j / (H - hz);
      if((Math.sin(X * 0.5 + j * 3.1) + Math.sin(X * 0.13 - j)) > 1.7 - k * 0.5 && plBay(X, Y) < 0.5) return "#9cd0f0";
      return K.ramp(["#6aa6dc", "#4a88c4", "#3570aa", "#285a92", "#1f4a80"], Math.min(1, k * 1.4), X, Y); });
    K.rect(0, hz, W, 1, "#e8f6fc");
    /* le pilier, à l'horizon */
    const tx = Math.round(W * 0.86);
    K.rect(tx, hz - 28, 4, 28, "#4a6a92"); K.rect(tx, hz - 28, 1, 28, "#7a9ac0"); K.rect(tx - 1, hz - 30, 6, 3, "#4a6a92"); K.rect(tx + 1, hz - 33, 2, 3, "#5a7aa2");
    /* la falaise : de l'herbe, et la roche qui plonge vers la mer, à droite */
    const edgeX = W * 0.68;
    const top = X => Math.round(H * 0.645 + Math.sin(X * 0.09) * 2 + Math.sin(X * 0.31) * 1);
    const face = Y => edgeX + (Y - H * 0.645) * 0.55 + Math.sin(Y * 0.3) * 2;
    K.field(0, Math.round(H * 0.6), W, H - Math.round(H * 0.6), (i, j, X, Y) => {
      const ty = top(X); if(Y < ty) return null;
      const fx = face(Y); if(X > fx) return null;
      const dg = Y - ty;
      if(X > fx - 7 - dg * 0.08){ return K.ramp(["#a8957e", "#8a7864", "#6a5a4a", "#4a3e34"], Math.min(1, (X - (fx - 7)) / 7 * 0.5 + dg / 120), X, Y); }
      if(dg < 3) return dg === 0 ? "#9ed468" : "#7cc052";
      return K.ramp(["#5aa646", "#4a9440", "#3c7e38", "#2e6a30"], Math.min(1, dg / (H * 0.36)), X, Y); });
    for(let i = 0; i < 90; i++){ const X = R() * edgeX * 0.95, Y = top(X) + 2 + R() * (H * 0.34); if(X < face(Y) - 9){ K.px(X, Y, "#8ad060"); K.px(X, Y - 1, "#b4e488"); } }
    for(let i = 0; i < 12; i++){ const X = R() * edgeX * 0.85, Y = top(X) + 6 + R() * 50; K.px(X, Y, "#ffffff"); K.px(X + 1, Y, "#f6e6a0"); }
    /* l'écume, au pied de la falaise */
    for(let Y = Math.round(H * 0.7); Y < H; Y += 3){ const fx = face(Y); K.dith(fx, Y, 4 + R() * 6, 1, "#e8f6fc", 0.6); }
    const clouds = [0, 1, 2].map(i=>plCloud(46 + i * 12, 18 + i * 3, R, ["#ffffff", "#e4f0fa", "#c2d8ee"]));
    return {hz, clouds, edgeX};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm();
    /* les nuages passent, lentement */
    (I.clouds || []).forEach((cv, i)=>{ const X = ((t * (0.8 + i * 0.35) * (calm ? 0 : 1) + i * 90) % (W + 90)) - 70; x.drawImage(cv, Math.round(X), Math.round(H * (0.07 + i * 0.1))); });
    /* la mer scintille */
    if(!calm){ const Rr = plRng(Math.floor(t * 3)); for(let i = 0; i < 9; i++){ x.fillStyle = "#ffffff"; x.globalAlpha = 0.7; x.fillRect(I.edgeX * 0.9 + Rr() * (W - I.edgeX * 0.9) | 0, I.hz + 2 + (Rr() * (H - I.hz) | 0), 1 + (Rr() * 2 | 0), 1); } x.globalAlpha = 1; }
  }
};

/* ============================================================
   LA FAILLE
   ============================================================ */
PL_SETS.faille = {
  light:"rift", scan:0.12,
  anchors:{center:[0.5, 0.63], left:[0.3, 0.63], right:[0.7, 0.62], pz:[0.72, 0.62], mn:[0.36, 0.6], spot:[0.5, 0.68], up:[0.5, 0.3]},
  paint(x, W, H, R, v, K){
    K.field(0, 0, W, H, (i, j, X, Y) => {
      const d = Math.hypot((X - W / 2) / W, (Y - H * 0.4) / H * 1.4);
      return K.ramp(["#3a0a32", "#22061e", "#120414", "#08020c", "#030106"], Math.min(1, d * 1.6), X, Y); });
    /* des fêlures au fond, magenta */
    for(let k = 0; k < 5; k++){
      let X = R() * W, Y = 0; const col = k % 2 ? "#5a1440" : "#7a1a52";
      while(Y < H * 0.55){ K.px(X, Y, col); if(R() < 0.3) K.px(X + 1, Y, "#ff3d7f"); X += (R() - 0.5) * 3; Y += 1; if(R() < 0.04){ let bx = X, by = Y; for(let n = 0; n < 12; n++){ K.px(bx, by, col); bx += R() < 0.5 ? 1 : -1; by += 1; } } }
    }
    /* la plateforme : un morceau de route arraché */
    const py = Math.round(H * 0.6), x0 = Math.round(W * 0.08), x1 = Math.round(W * 0.92);
    K.field(x0, py - 2, x1 - x0, Math.round(H * 0.2), (i, j, X, Y) => {
      const edge = 4 + Math.sin(X * 0.4) * 2 + Math.sin(X * 1.7) * 2 + (H * 0.14) * (1 - Math.pow(Math.abs(i - (x1 - x0) / 2) / ((x1 - x0) / 2), 2));
      if(j > edge) return null;
      if(j < 2) return "#7cb85a";
      if(j < 5) return "#5a9a46";
      return K.ramp(["#6a4a36", "#523828", "#3a281e", "#24180f"], j / edge, X, Y); });
    for(let i = 0; i < 40; i++){ const X = x0 + R() * (x1 - x0), Y = py + 2 + R() * 3; K.px(X, Y - 3, "#9ad070"); }
    /* les bords se défont : des pixels qui manquent */
    for(let i = 0; i < 30; i++){ const X = x0 + R() * (x1 - x0), Y = py + 6 + R() * H * 0.1; K.rect(X, Y, 2, 2, "#030106"); }
    /* des morceaux de monde, au loin, qui flottent */
    const slabs = [];
    for(let i = 0; i < 7; i++){
      const w = 10 + (R() * 14 | 0), h = 6 + (R() * 5 | 0), cv = document.createElement("canvas"); cv.width = w; cv.height = h + 2;
      const sx = cv.getContext("2d"), grass = R() < 0.6;
      for(let X2 = 0; X2 < w; X2++){ const d = h - Math.abs(X2 - w / 2) / (w / 2) * (h - 2) - (R() * 2 | 0);
        for(let Y2 = 0; Y2 < d; Y2++){ sx.fillStyle = Y2 < 1 ? (grass ? "#7cb85a" : "#8a8a9a") : Y2 < 2 ? (grass ? "#5a9a46" : "#6a6a7a") : Y2 < 4 ? "#523828" : "#2e1e16"; sx.fillRect(X2, Y2, 1, 1); } }
      slabs.push({cv, x:R() * (W - w), y:H * (0.08 + R() * 0.4), ph:R() * 6, sp:0.6 + R()});
    }
    return {py, slabs};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm();
    for(const s of I.slabs || []){ x.globalAlpha = 0.85; x.drawImage(s.cv, Math.round(s.x + (calm ? 0 : Math.sin(t * 0.3 + s.ph) * 3)), Math.round(s.y + (calm ? 0 : Math.sin(t * s.sp + s.ph) * 2))); }
    x.globalAlpha = 1;
    if(!calm){
      /* des blocs qui clignotent, et des pixels qui tombent sous la plateforme */
      const Rr = plRng(Math.floor(t * 5));
      for(let i = 0; i < 4; i++){ x.globalAlpha = 0.55; x.fillStyle = Rr() < 0.5 ? "#ff3d7f" : "#35f0d6"; x.fillRect(Rr() * W | 0, Rr() * H * 0.55 | 0, 2 + (Rr() * 8 | 0), 1 + (Rr() * 3 | 0)); }
      for(let i = 0; i < 10; i++){ const X = W * 0.12 + ((i * 37) % (W * 0.76)), Y = I.py + 10 + ((t * (14 + i % 5) + i * 13) % (H * 0.3)); x.globalAlpha = 0.6 * (1 - (Y - I.py) / (H * 0.32)); x.fillStyle = i % 3 ? "#523828" : "#7cb85a"; x.fillRect(X | 0, Y | 0, 1, 1); }
      x.globalAlpha = 1;
    }
  }
};

/* ============================================================
   LA COUCHE ZÉRO
   ============================================================ */
PL_SETS.zero = {
  light:"none", scan:0.1,
  anchors:{center:[0.5, 0.64], left:[0.3, 0.63], right:[0.72, 0.63], pz:[0.72, 0.63], mn:[0.32, 0.62], spot:[0.5, 0.7], back:[0.5, 0.55]},
  paint(x, W, H, R, v, K){
    const gy = Math.round(H * 0.5);
    K.field(0, 0, W, H, (i, j, X, Y) => { const d = Math.hypot((X - W / 2) / W, (Y - H * 0.42) / H * 1.5);
      return K.ramp(["#1e0f36", "#120a24", "#0a0616", "#040209", "#020106"], Math.min(1, d * 1.7), X, Y); });
    /* onze mondes empilés, presque les mêmes, jamais alignés : chacun une ligne d'horizon,
       ses arbres, ses maisons, dans les couleurs de son époque — de plus en plus effacés vers le haut */
    const PALS = [["#0f380f", "#306230", "#8bac0f"], ["#3a5a8a", "#6a9a5a", "#c8b070"], ["#4a8a4a", "#8ac85a", "#e8d098"],
      ["#5a4a3a", "#8a6a4a", "#c8a070"], ["#2a6a8a", "#4aa0b8", "#e8e0a0"]];
    const n = 11, top = Math.round(H * 0.11), gap = Math.max(5, Math.floor((gy - top - 14) / n));
    for(let k = 0; k < n; k++){
      const Y = top + k * gap, pal = PALS[k % PALS.length], off = (R() * 16 | 0) - 8, fade = 0.16 + 0.42 * (k / (n - 1));
      const dim = c => plMix(c, "#05030c", 0.35);
      /* le sol de ce monde-là : une bande, un peu de travers */
      K.dith(0, Y, W, 2, dim(pal[1]), fade);
      K.dith(0, Y + 2, W, 1, dim(pal[0]), fade * 0.8);
      /* sa ligne d'horizon : les mêmes arbres, les mêmes maisons, décalés */
      const RR = plRng(91);   /* le même tirage pour chaque monde : « presque les mêmes » */
      for(let X = -12; X < W + 12; X += 3){
        const r = RR(), x0 = X + off;
        if(r < 0.12){ K.dith(x0 - 1, Y - 3, 3, 3, dim(pal[1]), fade); K.dith(x0, Y - 4, 1, 1, dim(pal[2]), fade); }
        else if(r < 0.18){ K.dith(x0 - 2, Y - 3, 4, 3, dim(pal[0]), fade); K.dith(x0 - 2, Y - 4, 4, 1, dim(pal[2]), fade); }
      }
      /* et, de place en place, une déchirure */
      if(R() < 0.6){ const tx = R() * W; K.rect(tx, Y - 4, 2 + R() * 6, 7, "#020106"); }
    }
    /* des colonnes de stockage, très loin */
    for(let X = 7; X < W; X += 23) K.dith(X, top - 6, 1, gy - top, "#1a1430", 0.35);
    /* le sol de la couche : une grille violette */
    K.field(0, gy, W, H - gy, (i, j, X, Y) => {
      const d = j + 8, u = (X - W / 2) * 6 / d, w2 = 1500 / d, tu = u - Math.floor(u), tv = w2 / 2 - Math.floor(w2 / 2);
      const far = Math.min(1, j / ((H - gy) * 0.55));
      if((tu < 0.06 || tv < 0.05) && plBay(X, Y) < 0.2 + 0.5 * far) return far > 0.5 ? (tu < 0.06 ? "#4a2a8a" : "#1a5a6a") : "#24164a";
      return K.ramp(["#0a0618", "#060410", "#030208"], j / (H - gy), X, Y); });
    return {gy};
  },
  anim(x, W, H, t, v, P, c, st){
    if(plCalm()) return;
    /* des octets qui remontent, lentement */
    const B = ["3F", "00", "A9", "50", "7F", "E3"];
    for(let i = 0; i < 6; i++){
      const X = 12 + ((i * 47) % (W - 24)), Y = H * 0.62 - ((t * (5 + i % 3) + i * 37) % (H * 0.6));
      x.globalAlpha = 0.18 + 0.12 * Math.sin(t + i); plText(x, B[i], X, Y, i % 2 ? "#8b5cf6" : "#35f0d6"); }
    x.globalAlpha = 1;
  }
};

/* ============================================================
   LA TOUR — le grenier de l'archive
   ============================================================ */
PL_SETS.tour = {
  sh:2.4, light:"none", scan:0.05, cam:[0.5, 0.76],
  /* les ancres du bas dépendent de la hauteur de l'écran : le peintre les recalcule (info.anchors) */
  anchors:{top:[0.5, 0.2], gate:[0.5, 0.16], mid:[0.5, 0.5], viewTop:[0.5, 0.2], base:[0.5, 0.83], baseL:[0.34, 0.83], baseR:[0.66, 0.83], pz:[0.64, 0.83], view:[0.5, 0.76]},
  paint(x, W, H, R, v, K){
    const vH = H / 2.4, fy = Math.round(H - vH * 0.4), ly = Math.round(H * 0.2);
    /* les murs : de la pierre froide ; seule la chaleur du gardien, en haut, les réchauffe */
    K.field(0, 0, W, H, (i, j, X, Y) => {
      const heat = Math.max(0, 1 - Math.hypot((X - W / 2) / (W * 0.9), (j - ly) / (vH * 0.8)));
      return K.ramp(["#120e1a", "#18121f", "#1f1828", "#2a1c26", "#5a2a1e", "#9a4a24"], Math.min(1, 0.15 + (1 - j / H) * 0.25 + heat * 0.75), X, Y); });
    for(let Y = 6; Y < fy; Y += 9){ for(let X = ((Y / 9) % 2) * 7; X < W; X += 14) K.dith(X, Y, 1, 8, "#0c0812", 0.7); K.dith(0, Y, W, 1, "#0c0812", 0.7); }
    /* des souvenirs empilés : des cadres, des caisses, posés les uns sur les autres */
    const pile = (x0, x1) => {
      let Y = fy;
      while(Y > ly + 30){
        const w = 14 + (R() * 18 | 0), h = 10 + (R() * 12 | 0), X = x0 + R() * Math.max(1, (x1 - x0) - w);
        const glitch = R() < 0.18, crate = R() < 0.3, warm = Y < ly + vH * 0.6;
        const wood = warm ? ["#8a5a3a", "#5a3a26", "#a8744a"] : ["#5a4636", "#3a2c22", "#6e5844"];
        if(crate){ K.rect(X, Y - h, w, h, wood[0]); K.rect(X, Y - h, w, 1, wood[2]); K.line(X, Y - h, X + w - 1, Y - 1, wood[1]); K.line(X + w - 1, Y - h, X, Y - 1, wood[1]); }
        else {
          K.rect(X, Y - h, w, h, wood[0]); K.rect(X + 1, Y - h + 1, w - 2, h - 2, wood[1]);
          /* dans le cadre, une image sépia : un horizon, un soleil, un arbre */
          K.vgrad(X + 2, Y - h + 2, w - 4, h - 4, ["#cdb894", "#a88e68", "#7a6244"]);
          K.rect(X + 2, Y - h + 2 + Math.round((h - 4) * 0.6), w - 4, 1, "#5e4a32");
          if(R() < 0.5) K.disc(X + 4 + R() * (w - 8), Y - h + 4 + R() * 3, 1, "#ecdcbc");
          if(R() < 0.5){ const tx = X + 3 + R() * (w - 6); K.rect(tx, Y - h + 2 + (h - 4) * 0.35, 1, (h - 4) * 0.3, "#4e3c2a"); K.rect(tx - 1, Y - h + 2 + (h - 4) * 0.3, 3, 2, "#5e4a32"); }
          if(glitch){ for(let k = 0; k < 3; k++) K.rect(X + 2, Y - h + 2 + R() * (h - 4), w - 4, 1, R() < 0.5 ? "#ff3d7f" : "#35f0d6"); }
        }
        Y -= h - (R() * 3 | 0);
      }
    };
    pile(2, W * 0.34); pile(W * 0.66, W - 2);
    /* le haut : une corniche, et une porte faite de lumière */
    K.rect(W * 0.18, ly, W * 0.64, 4, "#4a3a3a"); K.rect(W * 0.18, ly, W * 0.64, 1, "#8a6a4a"); K.rect(W * 0.18, ly + 4, W * 0.64, 2, "#1a1218");
    const gx = Math.round(W / 2 - 18), gyy = ly - 34;
    K.rect(gx - 3, gyy - 3, 42, 37, "#2a2030"); K.rect(gx - 2, gyy - 2, 40, 35, "#120c18");
    for(let k = 0; k < 6; k++) K.rect(gx + 3 + k * 6, gyy, 2, 32, "#35f0d6");
    K.rect(gx, gyy + 10, 36, 1, "#1f8a94"); K.rect(gx, gyy + 22, 36, 1, "#1f8a94");
    /* le sol, en bas, et les fondations dessous */
    K.vgrad(0, fy - 3, W, 8, ["#4a3a44", "#2e2432"]); K.rect(0, fy - 3, W, 1, "#6a5662");
    K.vgrad(0, fy + 5, W, H - fy - 5, ["#1a1220", "#0e0a12", "#060408"]);
    return {ly, gate:[gx, gyy], fy, anchors:{base:[0.5, fy / H], baseL:[0.34, fy / H], baseR:[0.66, fy / H], pz:[0.64, fy / H],
      view:[0.5, (fy - vH * 0.16) / H], viewTop:[0.5, (ly - vH * 0.05) / H], top:[0.5, ly / H]}};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm();
    if(!I.gate) return;
    /* la porte de lumière respire */
    const [gx, gyy] = I.gate;
    x.globalAlpha = calm ? 0.4 : 0.3 + 0.25 * Math.sin(t * 2.6);
    x.fillStyle = "#9ff7ea"; for(let k = 0; k < 6; k++) x.fillRect(gx + 3 + k * 6, gyy, 1, 32);
    x.globalAlpha = 1;
    if(st.open){ const k = Math.min(1, (t - st.t0) / 1.2); x.fillStyle = "#120c18"; x.fillRect(gx, gyy, 36, Math.round(32 * k)); }
    if(!calm){
      /* des poussières qui montent dans la chaleur */
      for(let i = 0; i < 14; i++){ const X = W * 0.3 + ((i * 29) % (W * 0.4)) + Math.sin(t * 0.8 + i) * 4, Y = I.fy - ((t * (6 + i % 4) * 3 + i * 97) % I.fy);
        x.globalAlpha = 0.25 + 0.2 * Math.sin(t * 2 + i); x.fillStyle = Y < I.ly + 60 ? "#ffb070" : "#a898b8"; x.fillRect(X | 0, Y | 0, 1, 1); }
      x.globalAlpha = 1;
    }
  }
};

/* ============================================================
   LE NOYAU D'UN SECTEUR
   ============================================================ */
const PL_CORE = {kanto:["#ff6a4a", "#ffb08a", "#a8301e"], johto:["#e8c050", "#fff0a8", "#9a7420"], hoenn:["#3ac8f0", "#b4f0ff", "#1a6a9a"], "":["#35f0d6", "#c8fff6", "#1a7a78"]};
PL_SETS.noyau = {
  light:"none", scan:0.06,
  anchors:{core:[0.5, 0.33], center:[0.5, 0.64], left:[0.28, 0.65], right:[0.72, 0.64], pz:[0.7, 0.64], guard:[0.38, 0.6], exit:[1.1, 0.6], spot:[0.5, 0.7], below:[0.5, 0.78]},
  paint(x, W, H, R, v, K){
    const C = PL_CORE[v] || PL_CORE[""];
    K.field(0, 0, W, H, (i, j, X, Y) => { const d = Math.hypot((X - W / 2) / W, (Y - H * 0.34) / H * 1.3);
      return K.ramp(["#0e1830", "#0a1224", "#070c18", "#04070e", "#020407"], Math.min(1, d * 1.5), X, Y); });
    /* des circuits qui rayonnent depuis le cœur */
    for(let k = 0; k < 16; k++){
      const a = k / 16 * Math.PI * 2 + R() * 0.2; let X = W / 2 + Math.cos(a) * 30, Y = H * 0.34 + Math.sin(a) * 30;
      for(let n = 0; n < 90; n++){ K.px(X, Y, plMix(C[2], "#000000", 0.45)); if(n % 9 === 0 && R() < 0.4){ X += Math.sign(Math.cos(a)) ; } X += Math.cos(a) * 1.4; Y += Math.sin(a) * 1.4; if(X < 0 || X > W || Y < 0 || Y > H) break; }
    }
    /* l'estrade */
    const dy = Math.round(H * 0.64);
    K.oval(W / 2, dy + 6, 70, 14, "#0c1626"); K.oval(W / 2, dy + 4, 66, 12, "#142238"); K.oval(W / 2, dy + 3, 62, 10, "#1a2c46");
    for(let k = 0; k < 24; k++){ const a = k / 24 * Math.PI * 2; K.px(W / 2 + Math.cos(a) * 58, dy + 3 + Math.sin(a) * 9, plMix(C[0], "#000000", 0.4)); }
    /* le cœur : un cristal à facettes */
    const cx = W / 2, cy = Math.round(H * 0.33), hw = 20, hh = 30;
    K.field(cx - hw, cy - hh, hw * 2, hh * 2, (i, j, X, Y) => {
      const dx = i - hw, dyy = j - hh, inside = Math.abs(dx) / hw + Math.abs(dyy) / hh <= 1;
      if(!inside) return null;
      const left = dx < 0, up = dyy < 0;
      const l = (left ? 0.75 : 0.35) + (up ? 0.2 : -0.1) + (Math.abs(dx) < 1 ? 0.2 : 0);
      return K.ramp([C[2], C[0], C[1]], Math.min(1, l), X, Y); });
    K.line(cx, cy - hh, cx, cy + hh, C[1]); K.line(cx - hw, cy, cx + hw, cy, plMix(C[1], C[0], 0.5));
    return {core:[cx, cy, hw, hh], dy};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, C = PL_CORE[v] || PL_CORE[""], calm = plCalm(); if(!I.core) return;
    const [cx, cy, hw, hh] = I.core, free = st.free !== undefined ? st.free : 1;
    /* la lueur */
    const g = x.createRadialGradient(cx, cy, 4, cx, cy, 70);
    const a = free ? (calm ? 0.35 : 0.3 + 0.12 * Math.sin(t * 2)) : 0.12;
    g.addColorStop(0, plMix(C[1], "#ffffff", 0.2) + Math.round(a * 255).toString(16).padStart(2, "0")); g.addColorStop(1, C[0] + "00");
    x.fillStyle = g; x.fillRect(cx - 70, cy - 70, 140, 140);
    if(!free){ x.fillStyle = "rgba(0,0,0,.45)"; x.beginPath(); x.moveTo(cx, cy - hh); x.lineTo(cx + hw, cy); x.lineTo(cx, cy + hh); x.lineTo(cx - hw, cy); x.fill();
      x.fillStyle = "#ff3d4f"; for(let k = 0; k < 10; k++) x.fillRect(cx - 6 + k, cy - 8 + ((k * 7) % 16), 1, 1); }
    /* un anneau de points qui tourne autour */
    const n = 22, sp = calm ? 0 : (free ? 0.9 : 0.2);
    for(let k = 0; k < n; k++){
      const ang = k / n * Math.PI * 2 + t * sp, X = cx + Math.cos(ang) * (hw + 14), Y = cy + Math.sin(ang) * 7;
      x.globalAlpha = Math.sin(ang) > 0 ? 0.9 : 0.35; x.fillStyle = k % 4 ? C[0] : C[1]; x.fillRect(Math.round(X), Math.round(Y), 1, 1);
    }
    x.globalAlpha = 1;
    if(free){
      /* un trait de lumière vers le haut */
      x.globalAlpha = calm ? 0.25 : 0.18 + 0.1 * Math.sin(t * 3); x.fillStyle = C[1]; x.fillRect(cx - 1, 0, 2, cy - hh); x.globalAlpha = 1;
    }
    if(st.crack){
      /* au pied de l'estrade, la Couche Zéro affleure */
      const k = Math.min(1, (t - st.t0) / 1.6), Y = I.dy + 12;
      x.fillStyle = "#020106"; x.fillRect(Math.round(cx - 30 * k), Y, Math.round(60 * k), 3);
      x.fillStyle = "#ff3d7f"; x.fillRect(Math.round(cx - 30 * k), Y, Math.round(60 * k), 1);
      x.fillStyle = "#8b5cf6"; x.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4); x.fillRect(Math.round(cx - 26 * k), Y + 3, Math.round(52 * k), 1); x.globalAlpha = 1;
    }
  }
};

/* ============================================================
   LES SAUVEGARDES — Johto ne jette rien
   ============================================================ */
PL_SETS.sauvegardes = {
  light:"none", scan:0.04,
  anchors:{left:[0.14, 0.66], right:[0.86, 0.66], center:[0.5, 0.66], pz:[0.5, 0.66], spot:[0.5, 0.7]},
  paint(x, W, H, R, v, K){
    const gy = Math.round(H * 0.56);
    K.vgrad(0, 0, W, gy, ["#1a100a", "#2a1a12", "#3a2418", "#4a2e1e"]);
    for(let X = 0; X < W; X += 12){ K.rect(X, 0, 1, gy, "#1e120c"); K.dith(X + 1, 0, 2, gy, "#5a3a26", 0.2); }
    /* onze cadres sur deux étagères : six, puis cinq */
    const slots = [], fw = Math.min(28, Math.floor((W - 14) / 6) - 5), fh = Math.round(fw * 0.78);
    const row = (n, Y) => { const tot = n * fw + (n - 1) * 5, x0 = Math.round((W - tot) / 2);
      for(let i = 0; i < n; i++){ const X = x0 + i * (fw + 5); slots.push([X, Y, fw, fh]);
        K.rect(X - 2, Y - 2, fw + 4, fh + 4, "#6a4428"); K.rect(X - 1, Y - 1, fw + 2, fh + 2, "#2a1a10"); K.rect(X, Y, fw, fh, "#0c0a08");
        K.rect(X + 2, Y + fh + 4, fw - 4, 5, "#8a6a44"); K.rect(X + 3, Y + fh + 5, fw - 6, 3, "#b8946a"); }
      K.rect(0, Y + fh + 11, W, 3, "#7a5034"); K.rect(0, Y + fh + 14, W, 1, "#2a1a10"); };
    const y1 = Math.round(H * 0.17), y2 = y1 + fh + 24;
    row(6, y1); row(5, y2);
    /* une plaque, au milieu du mur ; une échelle contre les étagères ; des toiles dans les coins */
    const py0 = y2 + fh + 30;
    if(py0 + 12 < gy){ K.rect(W / 2 - 34, py0, 68, 11, "#2a1a10"); K.rect(W / 2 - 33, py0 + 1, 66, 9, "#9a7a4a"); K.text(W / 2 - plTextW("ARCHIVES · JOHTO") / 2, py0 + 3, "ARCHIVES - JOHTO", "#2a1a10"); }
    const lx = Math.round(W * 0.88);
    for(const dx of [0, 7]) K.rect(lx + dx, y1 - 6, 1, gy - y1 + 4, "#6a4a30");
    for(let Y = y1; Y < gy; Y += 7) K.rect(lx, Y, 8, 1, "#8a6a44");
    for(const [cx, sx] of [[0, 1], [W - 1, -1]]) for(let k = 0; k < 9; k++){ K.px(cx + sx * k, k * 0.6, "#5a4a3a"); K.px(cx + sx * k * 0.5, k, "#5a4a3a"); if(k % 3 === 2) K.line(cx + sx * k * 0.5, k, cx + sx * k, k * 0.6, "#4a3a2e"); }
    /* le plancher, vieux et sombre */
    K.field(0, gy, W, H - gy, (i, j, X, Y) => {
      const plank = Math.floor((j + 2) / 7), off = (plank * 37) % 23;
      if((j + 2) % 7 === 0) return "#1a100a";
      if((X + off) % 23 === 0) return "#24160e";
      return K.ramp(["#5a3a26", "#4a2e1e", "#3a2418", "#2a1a12"], j / (H - gy), X, Y); });
    return {slots, gy, fh};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm(), lit = st.lit || 0, name = typeof pzMask === "function" ? pzMask() : "▒▒▒▒";
    I.slots.forEach(([X, Y, fw, fh], i)=>{
      const on = i < Math.min(11, Math.floor(lit + (st.litStep ? (t - st.t0) / st.litStep : 0)));
      if(on){
        const g = x.createLinearGradient(0, Y, 0, Y + fh); g.addColorStop(0, "#3a5a6a"); g.addColorStop(1, "#1a2a34");
        x.fillStyle = g; x.fillRect(X, Y, fw, fh);
        const zero = st.zero || (st.flipAt && t - st.t0 > st.flipAt + i * 0.07);
        const val = zero ? "0%" : "100%";
        plText(x, val, X + fw / 2 - plTextW(val) / 2, Y + 2, zero ? "#ff6a7a" : "#c8f6ee");
        if(st.pz){ /* le même programme, dans chacune */
          x.fillStyle = "#e86a8a"; x.fillRect(X + fw / 2 - 2, Y + fh - 9, 4, 3); x.fillStyle = "#4ab8e8"; x.fillRect(X + fw / 2 - 3, Y + fh - 6, 6, 3); x.fillStyle = "#ffffff"; x.fillRect(X + fw / 2, Y + fh - 8, 1, 1); }
        if(!calm && Math.sin(t * 7 + i * 1.7) > 0.96){ x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(X, Y + ((t * 30 + i * 5) % fh), fw, 1); }
      }
      /* le nom, effacé : autant de signes que de lettres */
      const lab = name.slice(0, Math.max(3, Math.min(6, name.length)));
      plText(x, lab, X + fw / 2 - plTextW(lab) / 2, Y + fh + 5, "#3a2414");
    });
    if(!calm){ for(let i = 0; i < 10; i++){ const X = (i * 41 + t * (3 + i % 3)) % W, Y = (i * 67 + Math.sin(t * 0.6 + i) * 10 + t * 2) % (H * 0.8);
      x.globalAlpha = 0.3; x.fillStyle = "#f0d8b0"; x.fillRect(X | 0, Y | 0, 1, 1); } x.globalAlpha = 1; }
  }
};

/* ============================================================
   HOENN — écrite en dernier, et vite
   ============================================================ */
PL_SETS.hoenn = {
  light:"none", scan:0.03,
  anchors:{left:[0.28, 0.66], right:[0.74, 0.65], center:[0.5, 0.66], pz:[0.62, 0.64], trace:[0.84, 0.66], letters:[0.66, 0.5], spot:[0.46, 0.7]},
  paint(x, W, H, R, v, K){
    const hz = Math.round(H * 0.46);
    K.vgrad(0, 0, W, hz, ["#3c84d0", "#68a6de", "#a4cce8", "#e4dcc4", "#f4d8a8"]);
    /* des montagnes improvisées : chacune éclairée d'un côté différent */
    const peaks = [[W * 0.12, 70, 34, 1], [W * 0.36, 92, 44, -1], [W * 0.62, 78, 38, 1], [W * 0.86, 100, 46, -1]];
    for(const [px, ph, pw, side] of peaks){
      K.field(px - pw, hz - ph, pw * 2, ph, (i, j, X, Y) => {
        const dx = i - pw, edge = (j / ph) * pw + Math.sin(j * 0.7 + px) * 1.5;
        if(Math.abs(dx) > edge) return null;
        const lit = side > 0 ? dx < 0 : dx > 0;
        if(j < ph * 0.18) return lit ? "#f4f0e8" : "#b8c0d0";
        return lit ? K.ramp(["#c8906a", "#b07a58"], j / ph, X, Y) : K.ramp(["#7a5240", "#5e3e30"], j / ph, X, Y); });
    }
    /* le volcan, au milieu, avec son cratère */
    const vx = W * 0.5, vh = 64, vw = 40;
    K.field(vx - vw, hz - vh, vw * 2, vh, (i, j, X, Y) => {
      const dx = i - vw, edge = 6 + (j / vh) * (vw - 6);
      if(Math.abs(dx) > edge) return null;
      return dx < 0 ? K.ramp(["#8a5a48", "#6a4436"], j / vh, X, Y) : K.ramp(["#5a3a30", "#46302a"], j / vh, X, Y); });
    K.rect(vx - 6, hz - vh, 12, 2, "#2a1a16"); K.rect(vx - 4, hz - vh, 8, 1, "#ff7a3a");
    /* le sol : du sable et de l'herbe rase */
    K.field(0, hz, W, H - hz, (i, j, X, Y) => {
      const k = j / (H - hz), n = Math.sin(X * 0.21 + j * 0.13) * 0.5;
      return K.ramp(["#9ab868", "#c8c488", "#e4d4a0", "#d8c08a", "#c4a878"], Math.min(1, k * 1.1 + n * 0.08), X, Y); });
    /* deux palmiers, et leurs ombres — qui ne tombent pas du même côté */
    const palm = (tx, ty, sh) => {
      K.field(tx + (sh > 0 ? 2 : -26), ty - 2, 24, 5, (i, j, X, Y) => plBay(X, Y) < 0.55 ? "#a89060" : null);
      for(let k = 0; k < 30; k++) K.rect(tx + Math.sin(k * 0.08) * 3, ty - k, 3, 1, k % 4 ? "#8a6a44" : "#6a4e30");
      const top = [tx + Math.sin(30 * 0.08) * 3 + 1, ty - 30];
      for(let f = 0; f < 6; f++){ const a = -Math.PI / 2 + (f - 2.5) * 0.55; for(let k = 0; k < 14; k++) K.rect(top[0] + Math.cos(a) * k, top[1] + Math.sin(a) * k + k * k * 0.05, 2, 1, k > 8 ? "#5ab048" : "#3a8a3a"); }
    };
    palm(Math.round(W * 0.16), Math.round(H * 0.62), 1); palm(Math.round(W * 0.86), Math.round(H * 0.6), -1);
    return {hz, vol:[vx, hz - vh]};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm(); if(!I.vol) return;
    /* la fumée du volcan */
    for(let i = 0; i < 6; i++){ const k = ((t * 0.12 + i / 6) % 1), X = I.vol[0] + Math.sin(k * 6 + i) * 4 + k * 10, Y = I.vol[1] - k * 40;
      x.globalAlpha = (1 - k) * 0.5; x.fillStyle = "#d8d0c8"; const r = 2 + k * 5; x.fillRect(Math.round(X - r), Math.round(Y - r / 2), Math.round(r * 2), Math.round(r)); }
    x.globalAlpha = 1;
    /* la trace : des pixels qui ne sont d'aucune espèce, sur le sable */
    if(st.trace !== 0){
      const Rr = plRng(calm ? 3 : Math.floor(t * 4));
      for(let i = 0; i < 26; i++){ const k = i / 26, X = W * (0.98 - k * 0.42) + Rr() * 4, Y = H * (0.67 + Math.sin(k * 4) * 0.02) + Rr() * 3;
        x.fillStyle = Rr() < 0.5 ? "#ff3d7f" : Rr() < 0.5 ? "#35f0d6" : "#1c1830"; x.globalAlpha = 0.85 - k * 0.5; x.fillRect(X | 0, Y | 0, 1 + (Rr() < 0.3 ? 1 : 0), 1); }
      x.globalAlpha = 1;
    }
  }
};

/* ============================================================
   LA CÔTE QUI N'EXISTE PLUS — en quatre teintes de vert
   ============================================================ */
const GB4 = ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"];
PL_SETS.cote = {
  light:"none", scan:0.14,
  anchors:{shore:[0.4, 0.62], land:[0.2, 0.62], water:[0.62, 0.6], far:[0.86, 0.6], spot:[0.4, 0.68], center:[0.5, 0.62], pz:[0.24, 0.64], walkA:[0.4, 0.3], walkB:[0.4, 0.62]},
  paint(x, W, H, R, v, K){
    const T = 8, cols = Math.ceil(W / T), rows = Math.ceil(H / T);
    const shoreC = Math.round(cols * 0.38), endC = Math.round(cols * 0.8);
    K.rect(0, 0, W, H, GB4[3]);
    const tile = (cx, cy, fn) => { for(let j = 0; j < T; j++) for(let i = 0; i < T; i++){ const c = fn(i, j); if(c !== null) K.px(cx * T + i, cy * T + j, GB4[c]); } };
    for(let cy = 0; cy < rows; cy++) for(let cx = 0; cx < cols; cx++){
      if(cx < shoreC - 2){
        /* l'herbe : de petites marques, régulières, comme dans les jeux d'origine */
        tile(cx, cy, (i, j) => (i === 1 && j === 2) || (i === 2 && j === 3) || (i === 5 && j === 6) || (i === 6 && j === 5) ? 2 : null);
      } else if(cx < shoreC){
        /* le sable du rivage, le long duquel on marche */
        tile(cx, cy, (i, j) => (i + j * 3) % 7 === 0 ? 2 : null);
      } else if(cx === shoreC){
        /* les rochers du bord */
        tile(cx, cy, (i, j) => { const a = Math.hypot(i - 3.5, j - 3.5); return a < 3.2 ? (a > 2.4 ? 0 : (i < 3 && j < 3 ? 3 : 1)) : (i === 7 ? 0 : 2); });
      } else tile(cx, cy, () => null);
    }
    /* une rangée d'arbres, sur la terre */
    for(let cy = 1; cy < rows; cy += 5) for(let cx = 0; cx < shoreC - 4; cx += 2){
      if(R() < 0.45) continue;
      const X = cx * T + 8, Y = cy * T + 6;
      K.disc(X, Y, 7, GB4[0]); K.disc(X, Y, 6, GB4[1]); K.rect(X - 3, Y - 4, 3, 2, GB4[2]); K.rect(X - 4, Y - 2, 2, 2, GB4[2]);
      K.rect(X - 1, Y + 6, 3, 4, GB4[0]);
    }
    /* au large, le monde s'arrête : des tuiles qui ne savent plus quoi être */
    for(let cy = 0; cy < rows; cy++) for(let cx = endC; cx < cols; cx++){
      const k = (cx - endC) / Math.max(1, cols - endC);
      if(R() < k * 0.85){ K.rect(cx * T, cy * T, T, T, R() < 0.5 ? GB4[0] : "#000000"); continue; }
      const pat = R() * 4 | 0;
      tile(cx, cy, (i, j) => [((i ^ j) & 1) * 3, (i * j + pat) % 4, (j & 2) ? 0 : 3, (i + pat) % 2 ? 1 : 2][pat]);
    }
    return {shoreX:(shoreC + 1) * T, endX:endC * T, T};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm(), T = I.T || 8, ph = calm ? 0 : Math.floor(t * 2) % 4;
    x.fillStyle = GB4[1];
    for(let Y = 0; Y < H; Y += T) for(let X = I.shoreX; X < I.endX; X += T){
      /* une vague : un petit arc qui avance, tuile après tuile */
      const o = (ph + (Y / T) % 2 * 2) % 4;
      x.fillRect(X + o, Y + 3, 3, 1); x.fillRect(X + o + 1, Y + 2, 1, 1);
      x.fillRect(X + ((o + 4) % 8), Y + 7, 2, 1);
    }
    if(!calm){ const Rr = plRng(Math.floor(t * 6)); for(let i = 0; i < 6; i++){ x.fillStyle = Rr() < 0.3 ? "#000000" : GB4[Rr() * 4 | 0]; x.fillRect(I.endX + (Rr() * (W - I.endX) | 0), Rr() * H | 0, T / 2, T / 2); } }
    if(st.mnL){
      /* dans l'eau, près du bord : un L de tuiles, à peine */
      const k = Math.min(1, (t - st.t0) / 1.5), X = I.shoreX + T * 2, Y = Math.round(H * 0.46);
      x.globalAlpha = k * (calm ? 1 : 0.75 + 0.25 * Math.sin(t * 9));
      for(let j = 0; j < 3; j++) for(let i = 0; i < (j === 2 ? 3 : 1); i++){
        const Rr = plRng(i * 7 + j * 3 + Math.floor(calm ? 0 : t * 3));
        for(let yy = 0; yy < T; yy++) for(let xx = 0; xx < T; xx++){ const v2 = Rr() * 4 | 0; if(v2){ x.fillStyle = GB4[v2 - 1]; x.fillRect(X + i * T + xx, Y + j * T + yy, 1, 1); } }
      }
      x.globalAlpha = 1;
    }
  }
};

/* ============================================================
   UNE PAGE DU JOURNAL
   ============================================================ */
PL_SETS.page = {
  light:"none", scan:0.02,
  anchors:{center:[0.5, 0.5], sig:[0.66, 0.58], ball:[0.2, 0.72]},
  paint(x, W, H, R, v, K){
    K.rect(0, 0, W, H, "#2a1e14");
    const px = Math.round(W * 0.08), py = Math.round(H * 0.08), pw = Math.round(W * 0.84), ph = Math.round(H * 0.56);
    K.field(px, py, pw, ph, (i, j, X, Y) => {
      const e = Math.min(i, j, pw - 1 - i, ph - 1 - j), stain = Math.sin(i * 0.07 + 1) * Math.sin(j * 0.05) > 0.62;
      if(e < 2) return "#c8b48a";
      return K.ramp(["#f4ead2", "#ecdfc0", "#dcc8a0"], (e < 9 ? (9 - e) / 9 * 0.6 : 0) + (stain ? 0.35 : 0) + (plBay(X, Y) < 0.06 ? 0.3 : 0), X, Y); });
    /* les lignes du cahier, la marge */
    for(let Y = py + 14; Y < py + ph - 6; Y += 9) K.dith(px + 4, Y, pw - 8, 1, "#a8bccc", 0.7);
    K.rect(px + 16, py + 3, 1, ph - 6, "#d89a9a");
    /* le pli : la page a été roulée dans une Poké Ball */
    K.dith(px, py + Math.round(ph * 0.46), pw, 1, "#c8b48a", 0.8); K.dith(px, py + Math.round(ph * 0.46) + 1, pw, 1, "#fff8e8", 0.6);
    /* des lignes d'écriture, une par réplique ; on les révèle une à une */
    const lines = [];
    for(let Y = py + 13, n = 0; Y < py + ph - 22 && n < 9; Y += 9, n++){
      const pts = [], L = pw - 30 - R() * 26;
      let X = px + 20;
      while(X < px + 20 + L){ const word = 3 + R() * 9;
        for(let k = 0; k < word; k++){ pts.push([X + k, Y - 1 - Math.round(Math.abs(Math.sin((X + k) * 1.3 + n)) * 2.2) + (R() < 0.15 ? -1 : 0)]); }
        X += word + 2 + (R() * 2 | 0); }
      lines.push(pts);
    }
    plDrawBall(x, Math.round(W * 0.16), Math.round(H * 0.72), 1, false);
    return {lines, page:[px, py, pw, ph]};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info; if(!I.lines) return;
    const n = Math.min(I.lines.length, st.lines || 0), calm = plCalm();
    x.fillStyle = "#2a2a4a";
    for(let k = 0; k < n; k++){
      const pts = I.lines[k], fresh = k === n - 1 && st.t0 !== undefined && !calm ? Math.min(1, (t - st.t0) / 1.4) : 1;
      const m = Math.floor(pts.length * fresh);
      for(let i = 0; i < m; i++) x.fillRect(pts[i][0], pts[i][1], 1, 1);
    }
    /* la signature : illisible, puis ton nom */
    const [px, py, pw, ph] = I.page, sx = px + pw - 70, sy = py + ph - 16;
    const name = typeof pzName === "function" ? pzName() : "?";
    if(st.sig){
      const k = calm ? 1 : Math.min(1, (t - st.t0) / 1.2), txt = name.toUpperCase().slice(0, 12);
      x.globalAlpha = k; plText(x, txt, sx, sy, "#2a2a4a"); x.fillRect(sx - 2, sy + 7, plTextW(txt) + 6, 1); x.globalAlpha = 1;
      if(k < 1){ x.globalAlpha = 1 - k; plText(x, (typeof pzMask === "function" ? pzMask() : "▒▒▒▒").slice(0, 12), sx, sy, "#6a5a5a"); x.globalAlpha = 1; }
    } else plText(x, (typeof pzMask === "function" ? pzMask() : "▒▒▒▒").slice(0, 12), sx, sy, "#6a5a5a");
  }
};

/* ============================================================
   LE FORAGE
   ============================================================ */
PL_SETS.forage = {
  light:"none", scan:0.04,
  anchors:{center:[0.5, 0.66], left:[0.32, 0.66], right:[0.7, 0.66], pz:[0.7, 0.65], obj:[0.46, 0.64], spot:[0.5, 0.7], lamp:[0.3, 0.3]},
  paint(x, W, H, R, v, K){
    /* des couches de roche, tramées */
    const bands = ["#4a3626", "#3e2e22", "#5a4230", "#3a3634", "#2e2a2a", "#4a3a2c", "#2a2420"];
    K.field(0, 0, W, H, (i, j, X, Y) => { const k = (j / H) * bands.length + Math.sin(X * 0.05 + j * 0.01) * 0.4;
      return K.ramp(bands, Math.max(0, Math.min(1, k / bands.length)), X, Y); });
    for(let i = 0; i < 180; i++){ const X = R() * W, Y = R() * H; K.px(X, Y, R() < 0.5 ? "#2a1e16" : "#6a5240"); }
    /* des gemmes et un fossile, pris dans la roche */
    for(let i = 0; i < 9; i++){ const X = R() * W, Y = R() * H * 0.55, col = ["#35f0d6", "#ff3d7f", "#ffd24a", "#8b5cf6"][i % 4];
      K.rect(X, Y, 2, 2, col); K.px(X, Y, "#ffffff"); }
    { const fx = W * 0.8, fy = H * 0.22; for(let k = 0; k < 40; k++){ const a = k * 0.4, r = k * 0.22; K.px(fx + Math.cos(a) * r, fy + Math.sin(a) * r, "#8a7a64"); } }
    /* le puits : creusé, étayé */
    const sx0 = Math.round(W * 0.18), sx1 = Math.round(W * 0.82), top = Math.round(H * 0.12), fy = Math.round(H * 0.66);
    K.field(sx0, top, sx1 - sx0, fy - top + 14, (i, j, X, Y) => {
      const w = (sx1 - sx0) / 2, d = Math.abs(i - w) / w + Math.max(0, (14 - j)) / 30;
      if(d > 1) return null;
      return K.ramp(["#2a2018", "#1e1610", "#140e0a"], 0.3 + d * 0.6 - j / (fy - top) * 0.3, X, Y); });
    for(const bx of [sx0 + 6, sx1 - 9]){ K.rect(bx, top + 6, 3, fy - top - 6, "#7a5a3a"); K.rect(bx, top + 6, 1, fy - top - 6, "#9a7a52"); }
    for(const Y of [top + 22, Math.round((top + fy) / 2) + 6]){ K.rect(sx0 + 6, Y, sx1 - sx0 - 12, 3, "#6a4a30"); K.rect(sx0 + 6, Y, sx1 - sx0 - 12, 1, "#8a6a44"); K.rect(sx0 + 6, Y + 3, sx1 - sx0 - 12, 1, "#2a1a10"); }
    /* des racines qui pendent, des cailloux dans les parois */
    for(let k = 0; k < 7; k++){ let X = sx0 + 12 + R() * (sx1 - sx0 - 24), Y = top + 2; const L = 6 + R() * 14; for(let n = 0; n < L; n++){ K.px(X, Y + n, "#5a4030"); if(R() < 0.3) X += R() < 0.5 ? 1 : -1; } }
    K.vgrad(sx0, fy, sx1 - sx0, 14, ["#3a2a1e", "#2a1e16"]);
    for(let i = 0; i < 26; i++) K.rect(sx0 + R() * (sx1 - sx0), fy + R() * 8, 2, 1, "#5a4232");
    /* la lanterne */
    const lx = Math.round(W * 0.3), ly = Math.round(H * 0.28);
    K.rect(lx, top + 6, 1, ly - top - 6, "#3a2a1e"); K.rect(lx - 3, ly, 7, 8, "#3a2a1e"); K.rect(lx - 2, ly + 1, 5, 6, "#ffd070"); K.rect(lx - 1, ly + 2, 3, 3, "#fff4c0");
    return {lamp:[lx, ly + 4], fy};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm(); if(!I.lamp) return;
    const [lx, ly] = I.lamp, f = calm ? 1 : 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 2.3);
    const g = x.createRadialGradient(lx, ly, 2, lx, ly, 90);
    g.addColorStop(0, `rgba(255,208,112,${0.32 * f})`); g.addColorStop(1, "rgba(255,208,112,0)");
    x.fillStyle = g; x.fillRect(lx - 90, ly - 90, 180, 180);
  }
};

/* ============================================================
   LES STRATES — trois couches de peinture
   ============================================================ */
PL_SETS.strates = {
  light:"none", scan:0.05,
  anchors:{pz:[0.76, 0.66], center:[0.5, 0.66], kanto:[0.3, 0.6], johto:[0.5, 0.45], hoenn:[0.7, 0.31], spot:[0.5, 0.72], doorK:[0.24, 0.62], doorJ:[0.58, 0.47], doorH:[0.36, 0.33]},
  paint(x, W, H, R, v, K){
    K.vgrad(0, 0, W, H, ["#0a0e1a", "#101828", "#141c2c"]);
    const L = [["HOENN", Math.round(H * 0.24), Math.round(H * 0.36), ["#2a8a9a", "#3aa8b0", "#5ac8c0", "#8ae0c8"], 3],
               ["JOHTO", Math.round(H * 0.36), Math.round(H * 0.5), ["#7a5a2a", "#9a7a3a", "#c0a050", "#e0c88a"], -2],
               ["KANTO", Math.round(H * 0.5), Math.round(H * 0.66), ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"], 1]];
    for(const [nm, y0, y1, pal, off] of L){
      K.field(0, y0, W, y1 - y0, (i, j, X, Y) => {
        const top = Math.sin(X * 0.08 + y0) * 1.5;
        if(j < top) return null;
        return K.ramp(pal, 0.15 + (j / (y1 - y0)) * 0.7 + (plBay(X + off, Y) < 0.1 ? 0.15 : 0), X, Y); });
      /* le dessus de chaque couche : un petit monde, en ombre */
      for(let X = 4; X < W - 6; X += 10 + (R() * 10 | 0)){
        const kind = R(); const c2 = plMix(pal[0], "#000000", 0.35);
        if(kind < 0.45){ K.rect(X, y0 - 5, 6, 5, c2); K.rect(X - 1, y0 - 7, 8, 2, c2); }
        else if(kind < 0.85){ K.disc(X + 3, y0 - 5, 3, c2); K.rect(X + 2, y0 - 2, 2, 2, c2); }
      }
      K.text(4, y0 + 3, nm, plMix(pal[3], "#ffffff", 0.2));
    }
    /* des fêlures qui traversent tout */
    for(let k = 0; k < 4; k++){ let X = W * (0.15 + k * 0.23), Y = H * 0.25; while(Y < H * 0.66){ K.px(X, Y, "#05070c"); if(R() < 0.25) K.px(X + 1, Y, "#ff3d7f"); X += (R() - 0.5) * 2.4; Y += 1; } }
    /* trois portes, une par couche : on y a posté des gardiens */
    for(const [fx, fy] of [[0.24, 0.62], [0.58, 0.47], [0.36, 0.33]]){
      const X = Math.round(W * fx), Y = Math.round(H * fy);
      K.rect(X - 6, Y - 12, 12, 12, "#05070c"); K.disc(X, Y - 12, 6, "#05070c"); K.rect(X - 6, Y - 1, 12, 1, "#35f0d6");
    }
    /* le sol, devant */
    K.vgrad(0, Math.round(H * 0.66), W, H - Math.round(H * 0.66), ["#141c2c", "#0c1220", "#060a12"]);
    return {layers:L.map(l=>[l[0], l[1], l[2]]), doors:[[0.24, 0.62], [0.58, 0.47], [0.36, 0.33]].map(([fx, fy])=>[Math.round(W * fx), Math.round(H * fy)])};
  },
  anim(x, W, H, t, v, P, c, st){
    const I = P.set.info, calm = plCalm(); if(!I.layers) return;
    if(st.hi){
      const L = I.layers.find(l=>l[0] === st.hi.toUpperCase());
      if(L){ x.globalAlpha = calm ? 0.18 : 0.12 + 0.1 * Math.sin(t * 3); x.fillStyle = "#ffffff"; x.fillRect(0, L[1], W, L[2] - L[1]); x.globalAlpha = 1; }
    }
    if(st.eyes){
      I.doors.forEach(([X, Y], i)=>{
        const blink = !calm && Math.sin(t * 0.9 + i * 2.1) > 0.94;
        x.fillStyle = "#05070c"; x.fillRect(X - 5, Y - 14, 10, 13);
        if(!blink){ x.fillStyle = "#ff3d4f"; x.fillRect(X - 3, Y - 9, 1, 1); x.fillRect(X + 2, Y - 9, 1, 1); }
        x.globalAlpha = calm ? 0.5 : 0.35 + 0.25 * Math.sin(t * 2 + i); x.fillStyle = "#ff3d4f"; x.fillRect(X - 6, Y - 1, 12, 1); x.globalAlpha = 1;
      });
    }
  }
};

/* ============================================================
   LES ACCESSOIRES
   ============================================================ */
/* une Poké Ball en l'air */
PL_PROPS.ball = {
  tick(a, c, dt){
    const d = a.data, P = c.pl; if(!d || d.t0 === undefined) return;
    if(d.held){ const h = P.act.get(d.held); if(h){ a.x = h.x + (h.dir === 6 || h.dir === 5 || h.dir === 7 ? 8 : -8); a.y = h.y - 2; a.zb = 1; } return; }
    const k = Math.min(1, (P.t - d.t0) / d.ms);
    if(d.bounce !== undefined){ const e = P.t - d.bounce; a.x = d.tx + e * 26; a.y = d.ty + 2; a.roll = e * 12; return; }
    a.x = d.fx + (d.tx - d.fx) * k; a.y = d.fy + (d.ty - d.fy) * k + 16 * k; a.lift = Math.sin(k * Math.PI) * d.arc; a.roll = k * 8;
  },
  draw(x, a, c){
    const f = Math.floor(a.roll || 0) % 2;
    if(!a.data || !a.data.held){ x.globalAlpha = 0.25 * a.alpha; x.fillStyle = "#000"; x.fillRect(Math.round(a.x - 3), Math.round(a.y + 1), 6, 1); }
    x.globalAlpha = a.alpha; plDrawBall(x, a.x - 3, a.y - 7 - (a.lift || 0), f, false); x.globalAlpha = 1;
  }
};
/* le Professeur Racine, en pied : un personnage original, dessiné pour ce jeu */
const PL_PROF = [
  "....hhhhhh....", "...hhhhhhhh...", "..hhhhhhhhhh..", "..hhssssssh h.", "..hsggsggssh..", "..hsGGsGGssh..",
  "...ssssssss...", "....ssmmss....", ".....ssss.....", "...cccTTccc...", "..ccccTTcccc..", ".cccccTTccccc.",
  ".cccc.TT.cccc.", ".ccc..ww..ccc.", ".ccc..ww..ccc.", ".ccc..ww..ccc.", ".ss.cccccc.ss.", "....cccccc....",
  "....cccccc....", "....pppppp....", "....pp..pp....", "....pp..pp....", "....pp..pp....", "....pp..pp....",
  "....pp..pp....", "...bbb..bbb..."];
const PL_PROF_C = {h:"#e8eaee", s:"#f0c8a0", g:"#7ad8e8", G:"#2a3a4a", m:"#b07a5a", c:"#f4f4f0", T:"#3a6a9a", w:"#8a6a4a", p:"#4a4a5a", b:"#3a2a20"};
PL_PROPS.prof = {
  make(a){ a.data = Object.assign({h:26}, a.data || {}); },
  draw(x, a, c){
    const P = c.pl, calm = plCalm(), g = a.data.glitch || 0, R = plRng(Math.floor(P.t * 20));
    const X0 = Math.round(a.x - 7), Y0 = Math.round(a.y - PL_PROF.length - (a.talk && !calm && Math.sin(P.t * 12) > 0.4 ? 1 : 0));
    x.globalAlpha = 0.3 * a.alpha; x.fillStyle = "#000"; x.beginPath(); x.ellipse(a.x, a.y, 7, 2, 0, 0, 7); x.fill();
    x.globalAlpha = a.alpha;
    PL_PROF.forEach((row, j)=>{
      const off = g && !calm && R() < g ? Math.round((R() - 0.5) * 8 * g) : 0;
      for(let i = 0; i < row.length; i++){
        const ch = row[i]; if(ch === "." || ch === " ") continue;
        let col = PL_PROF_C[ch] || "#ff00ff";
        if(ch === "c" && (i === 1 || i === 12 || j === 9)) col = "#c8ccd2";
        if(ch === "h" && j === 0) col = "#ffffff";
        if(g && !calm && R() < g * 0.25) col = R() < 0.5 ? "#ff3d7f" : "#35f0d6";
        x.fillStyle = col; x.fillRect(X0 + i + off, Y0 + j, 1, 1);
      }
    });
    /* le reflet des lunettes */
    if(!calm && Math.sin(P.t * 1.3) > 0.9){ x.fillStyle = "#ffffff"; x.fillRect(X0 + 4, Y0 + 4, 1, 1); x.fillRect(X0 + 7, Y0 + 4, 1, 1); }
    x.globalAlpha = 1;
  }
};
/* une entité qui n'a pas encore été écrite : un œuf en fil de fer */
PL_PROPS.egg = {
  make(a){ a.data = Object.assign({h:16}, a.data || {}); },
  draw(x, a, c){
    const P = c.pl, calm = plCalm(), cx = Math.round(a.x), cy = Math.round(a.y - 9 + (calm ? 0 : Math.sin(P.t * 2) * 1));
    x.globalAlpha = 0.3 * a.alpha; x.fillStyle = "#000"; x.fillRect(cx - 5, Math.round(a.y), 11, 1);
    x.globalAlpha = a.alpha;
    for(let j = -8; j <= 8; j++){ const w = Math.round(6 * Math.sqrt(Math.max(0, 1 - (j / 9) * (j / 9))) * (j < 0 ? 0.85 : 1));
      x.fillStyle = "#35f0d6"; x.fillRect(cx - w, cy + j, 1, 1); x.fillRect(cx + w, cy + j, 1, 1);
      if(j % 4 === 0){ x.globalAlpha = a.alpha * 0.5; x.fillRect(cx - w, cy + j, w * 2, 1); x.globalAlpha = a.alpha; } }
    const sy = calm ? cy : cy - 8 + ((P.t * 10) % 17);
    x.fillStyle = "#ffffff"; x.globalAlpha = a.alpha * 0.7; x.fillRect(cx - 6, Math.round(sy), 13, 1); x.globalAlpha = 1;
  }
};
/* l'objet remonté : lourd, poli, parfaitement inutile */
PL_PROPS.treasure = {
  make(a){ a.data = Object.assign({h:14}, a.data || {}); },
  draw(x, a, c){
    const P = c.pl, cx = Math.round(a.x), cy = Math.round(a.y - 7);
    x.globalAlpha = 0.35 * a.alpha; x.fillStyle = "#000"; x.fillRect(cx - 6, Math.round(a.y), 13, 1);
    x.globalAlpha = a.alpha;
    for(let j = -6; j <= 6; j++){ const w = Math.round(Math.sqrt(36 - j * j + 2));
      for(let i = -w; i <= w; i++){ const l = (-i * 0.5 - j * 0.7) / 6; x.fillStyle = l > 0.55 ? "#fff6d8" : l > 0.15 ? "#e8c860" : l > -0.35 ? "#b8902e" : "#6a4e18"; x.fillRect(cx + i, cy + j, 1, 1); } }
    if(Math.sin(P.t * 2.4) > 0.7){ x.fillStyle = "#ffffff"; x.fillRect(cx - 3, cy - 4, 1, 3); x.fillRect(cx - 4, cy - 3, 3, 1); }
    x.globalAlpha = 1;
  }
};
/* une caisse de données */
PL_PROPS.box = {
  make(a){ a.data = Object.assign({h:14}, a.data || {}); },
  draw(x, a, c){
    const cx = Math.round(a.x), by = Math.round(a.y);
    x.globalAlpha = a.alpha;
    x.fillStyle = "#0b2430"; x.fillRect(cx - 8, by - 12, 16, 12); x.fillStyle = "#123848"; x.fillRect(cx - 8, by - 15, 16, 3);
    x.fillStyle = "#35f0d6"; x.fillRect(cx - 8, by - 15, 16, 1); x.fillRect(cx - 8, by - 12, 16, 1); x.fillRect(cx - 8, by - 15, 1, 15); x.fillRect(cx + 7, by - 15, 1, 15);
    plText(x, "474", cx - 5, by - 9, "#8ff7ea");
    x.globalAlpha = 1;
  }
};
/* une fêlure qui s'ouvre, là où se tenait le verrou */
PL_PROPS.crack = {
  over:true,
  make(a){ a.data = Object.assign({h:40, len:44}, a.data || {}); },
  draw(o, a, c){
    const P = c.pl, k = Math.min(1, (P.t - a.born) / 1.4), calm = plCalm(), R = plRng(17);
    const L = Math.round(a.data.len * plEase(k));
    let X = a.x;
    for(let j = 0; j < L; j++){
      X += (R() - 0.5) * 2.2;
      const w = Math.max(1, Math.round((1 - Math.abs(j / L - 0.5) * 2) * 4 * k));
      const Y = Math.round(a.y - j);
      o.globalAlpha = a.alpha;
      o.fillStyle = "#05010a"; o.fillRect(Math.round(X - w), Y, w * 2, 1);
      o.fillStyle = "#35f0d6"; o.fillRect(Math.round(X - w - 1), Y, 1, 1);
      o.fillStyle = "#ff3d7f"; o.fillRect(Math.round(X + w), Y, 1, 1);
    }
    if(!calm){ o.globalAlpha = a.alpha * (0.4 + 0.3 * Math.sin(P.t * 5)); o.fillStyle = "#ff3d7f"; o.fillRect(Math.round(a.x - 1), Math.round(a.y - L / 2), 2, 2); }
    o.globalAlpha = 1;
  }
};
/* des traces de MissingNo, comme des empreintes sur une vitre */
PL_PROPS.smudge = {
  over:true,
  draw(o, a, c){
    const R = plRng(plHash(a.id));
    for(let k = 0; k < 5; k++){
      const X = a.x + (R() - 0.5) * 120, Y = a.y + (R() - 0.5) * 140;
      o.globalAlpha = a.alpha * 0.32;
      for(let j = 0; j < 8; j++) for(let i = 0; i < 6; i++) if(i < 3 || j > 5){ if(R() < 0.6){ o.fillStyle = R() < 0.5 ? "#ff3d7f" : "#35f0d6"; o.fillRect(Math.round(X + i), Math.round(Y + j), 1, 1); } }
    }
    o.globalAlpha = 1;
  }
};
