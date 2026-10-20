/* ============================================================
   59w — LA BRÈCHE · DES UNIVERS QUI EXISTENT
   Retour de jeu : « les univers ne sont pas suffisamment travaillés et
   pas très beaux », et « les éléments qu'on valide au sol (rond bleu,
   rond doré…) ne représentent rien d'autre que des ronds ».

   1. LE SOL — peint morceau par morceau (480 px), à partir de bruits
      calculés en coordonnées du monde : sans couture, sans motif qui
      se répète. Herbe et sentiers sur les Routes, mousse et feuilles
      mortes dans la Sylve, lagune et bancs de sable dans les Nappes,
      roche fissurée dans les Cavités, dallage envahi dans les Ruines,
      basalte veiné de lave au Foyer. Pixel par pixel, à l'échelle des
      sprites (un texel = deux pixels).
   2. LE RELIEF — arbres feuillus et conifères à plusieurs étages de
      feuillage, rochers ombrés et moussus, stalagmites, colonnes
      brisées gravées, orgues de basalte aux veines incandescentes.
   3. LES TERRAINS — eau avec rive, écume et reflets ; lave sous sa
      croûte, avec ses bulles ; de vraies touffes de hautes herbes.
   4. LES LIEUX — chaque lieu est un objet : une caisse de données à
      écran, un autel de pierre et ses obélisques, une cage de glitch et
      son prisonnier, une souche millénaire, un massif de cristaux, une
      dalle gravée, un évent volcanique, un tourbillon, un nid vivant.
   5. L'AMBIANCE — particules et lumière propres à chaque habitat :
      pollen, lucioles et rais de lumière, reflets, poussière, motes de
      glyphes, braises.
   ============================================================ */

/* ---------- les bruits, en coordonnées du monde ---------- */
function brH2(ix, iy, s){
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function brVN(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const a = brH2(ix, iy, s), b = brH2(ix + 1, iy, s), c = brH2(ix, iy + 1, s), d = brH2(ix + 1, iy + 1, s);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function brFbm(x, y, s){ return brVN(x, y, s) * 0.55 + brVN(x * 2.03, y * 2.03, s + 7) * 0.3 + brVN(x * 4.1, y * 4.1, s + 13) * 0.15; }
/* Voronoï : distance au germe le plus proche, au second, et l'identité de la cellule */
let BR_V1 = 0, BR_V2 = 0, BR_VID = 0;
function brVor(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y);
  let d1 = 9, d2 = 9, id = 0;
  for(let j = -1; j <= 1; j++) for(let i = -1; i <= 1; i++){
    const cx = ix + i, cy = iy + j, px = cx + brH2(cx, cy, s), py = cy + brH2(cx, cy, s + 1);
    const dx = px - x, dy = py - y, d = dx * dx + dy * dy;
    if(d < d1){ d2 = d1; d1 = d; id = brH2(cx, cy, s + 2); } else if(d < d2) d2 = d;
  }
  BR_V1 = Math.sqrt(d1); BR_V2 = Math.sqrt(d2); BR_VID = id;
}
const BR_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function brHex(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function brPal(list){ return list.map(brHex); }

/* ---------- 1. le sol ---------- */
const BR_GT = 240;                                   /* texels par morceau (480 px / 2) */
const BR_GPAL = {
  route:  {g:brPal(["#24432a","#2c5232","#36623a","#447442","#55864c"]), dirt:brPal(["#5a4630","#6b5434","#7d6440","#8f7650"]),
           fl:brPal(["#f4f0d8","#ffe45e","#ff9ad5","#9fd0ff"])},
  foret:  {g:brPal(["#112516","#16301b","#1c3c21","#244a28","#2f5a30"]), lit:brPal(["#3a2e18","#4a3a1e","#5e4422","#76542a"]),
           fl:brPal(["#ff5a4a","#f4f0d8","#c9a6ff"])},
  eaux:   {w:brPal(["#0a3350","#0d3d5c","#11496a","#155777","#1b6684"]), sand:brPal(["#8f7d55","#a8925f","#bba36c","#cdb67e"]),
           wet:brPal(["#3f6a6a","#4f7a72"]), cau:brPal(["#2a86a0","#3aa0b8"])},
  grotte: {s:brPal(["#2c221b","#352920","#3e3025","#48382b","#524032"]), crack:brPal(["#140e0a","#1c1510"]), min:brPal(["#7fe0ff","#ffc96a"])},
  ruines: {s:brPal(["#2c2644","#352e52","#3e365e","#48406b","#524a78"]), mortar:brPal(["#15112a","#1c1734"]), moss:brPal(["#2e4a34","#3a5c3c"]),
           rune:brPal(["#8a7ab8","#c9a6ff"])},
  foyer:  {s:brPal(["#1d1210","#251714","#2e1c18","#37221c","#402820"]), gap:brPal(["#0d0605","#140908"]), lava:brPal(["#7a1e08","#c4400e","#ff6a1a","#ffb35c"]),
           ash:brPal(["#4a4442","#5a5250"])}
};
function brGroundJob(hab, cx, cy, seed){
  const c = document.createElement("canvas");
  if(!c.getContext) return null;
  c.width = c.height = BR_GT;
  const x = c.getContext("2d");
  return {c, x, img:x.createImageData(BR_GT, BR_GT), j:0, hab, ox:cx * BR_GT, oy:cy * BR_GT, s:seed | 0, P:BR_GPAL[hab] || BR_GPAL.route};
}
/* une ligne de texels : le sol se peint par tranches, jamais d'un bloc pendant la partie */
function brGroundRow(J, j){
  const D = J.img.data, P = J.P, s = J.s, hab = J.hab, ox = J.ox, ty = J.oy + j;
  let o = j * BR_GT * 4;
  for(let i = 0; i < BR_GT; i++, o += 4){
    const tx = ox + i, bay = BR_BAYER[(j & 3) * 4 + (i & 3)] / 16 - 0.47;
    let col;
    const h = brH2(tx, ty, s + 99);
    if(hab === "route"){
      const n = brFbm(tx / 38, ty / 38, s) * 0.65 + brVN(tx / 7, ty / 7, s + 3) * 0.35;
      const pth = Math.abs(brFbm(tx / 150, ty / 150, s + 5) - 0.5);
      if(pth < 0.02){
        col = P.dirt[Math.max(0, Math.min(3, Math.floor((n + bay * 0.25) * 4.2) - (pth > 0.016 ? 1 : 0)))];
        if(h < 0.02) col = P.dirt[3];
      } else {
        col = P.g[Math.max(0, Math.min(4, Math.floor((n + bay * 0.22) * 5.4) - 0))];
        if(pth < 0.026) col = P.g[0];
        else if(h < 0.03 && brVN(tx / 22, ty / 22, s + 31) > 0.7) col = P.fl[Math.floor(brH2(tx, ty, s + 7) * 4)];
        else if(h < 0.0006) col = P.fl[0];
        else if(h < 0.05) col = P.g[Math.max(0, P.g.indexOf(col) - 1)];
        else if(h > 0.985) col = P.g[4];
      }
    } else if(hab === "foret"){
      const n = brFbm(tx / 30, ty / 30, s) * 0.6 + brVN(tx / 6, ty / 6, s + 3) * 0.4;
      const lit = brFbm(tx / 26, ty / 26, s + 11);
      const leaf = brVN(tx / 3, ty / 3, s + 21);
      col = P.g[Math.max(0, Math.min(4, Math.floor((n + bay * 0.2) * 5.2 - 0.6)))];
      if(leaf > 0.8 && brVN(tx / 20, ty / 20, s + 23) > 0.55) col = P.lit[Math.floor(brH2(tx >> 1, ty >> 1, s + 9) * 4)];
      if(lit > 0.66) col = P.g[Math.min(4, P.g.indexOf(col) + 2)] || col;
      if(h < 0.0025) col = P.fl[Math.floor(brH2(tx, ty, s + 7) * 3)];
    } else if(hab === "eaux"){
      const n = brFbm(tx / 52, ty / 52, s);
      if(n > 0.63){
        col = P.sand[Math.max(0, Math.min(3, Math.floor((brVN(tx / 5, ty / 5, s + 2) + bay * 0.3) * 4)))];
        if(h < 0.01) col = P.sand[0];
      } else if(n > 0.6){
        col = P.wet[(i + j) & 1];
      } else {
        const dep = brFbm(tx / 24, ty / 24, s + 4);
        col = P.w[Math.max(0, Math.min(4, Math.floor((n * 0.9 + dep * 0.5 + bay * 0.18) * 4.6 - 1.2)))];
        const w1 = brVN(tx / 18, ty / 18, s + 8) * 6, cau = Math.abs(Math.sin(tx * 0.21 + w1) * Math.sin(ty * 0.19 - w1 * 0.7));
        if(cau > 0.9) col = P.cau[cau > 0.96 ? 1 : 0];
      }
    } else if(hab === "grotte"){
      brVor(tx / 15, ty / 15, s);
      const e = BR_V2 - BR_V1;
      if(e < 0.07) col = P.crack[e < 0.035 ? 0 : 1];
      else {
        const n = brVN(tx / 4, ty / 4, s + 5);
        col = P.s[Math.max(0, Math.min(4, Math.floor((BR_VID * 0.6 + n * 0.4 + bay * 0.2) * 5)))];
        if(e < 0.12) col = P.s[Math.max(0, P.s.indexOf(col) - 1)];
        if(h < 0.0012) col = P.min[brH2(tx, ty, s + 3) < 0.6 ? 0 : 1];
        else if(h < 0.02) col = P.s[4];
      }
    } else if(hab === "ruines"){
      const row = Math.floor(ty / 16), sx = tx + (row & 1) * 8, colI = Math.floor(sx / 16), lx = ((sx % 16) + 16) % 16, ly = ((ty % 16) + 16) % 16;
      const tile = brH2(colI, row, s + 1);
      const moss = brFbm(tx / 34, ty / 34, s + 6);
      if(lx === 0 || ly === 0){ col = moss > 0.6 ? P.moss[(i + j) & 1] : P.mortar[(lx + ly) & 1]; }
      else {
        const n = brVN(tx / 5, ty / 5, s + 2);
        col = P.s[Math.max(0, Math.min(4, Math.floor((tile * 0.65 + n * 0.35 + bay * 0.18) * 5)))];
        if(lx === 1 || ly === 1) col = P.s[Math.min(4, P.s.indexOf(col) + 1)];
        if(lx === 15 || ly === 15) col = P.s[Math.max(0, P.s.indexOf(col) - 1)];
        if(tile > 0.9){ brVor(tx / 6, ty / 6, s + 4); if(BR_V2 - BR_V1 < 0.06) col = P.mortar[0]; }
        if(tile < 0.05 && ((lx - 8) * (lx - 8) + (ly - 8) * (ly - 8) === 16 || (lx === 8 && ly > 4 && ly < 12))) col = P.rune[0];
        if(moss > 0.68 && brH2(tx, ty, s + 5) < 0.4) col = P.moss[1];
      }
    } else {
      brVor(tx / 12, ty / 12, s);
      const e = BR_V2 - BR_V1;
      if(e < 0.09){
        const hot = brFbm(tx / 30, ty / 30, s + 3);
        col = hot > 0.6 ? P.lava[e < 0.04 ? (hot > 0.67 ? 3 : 2) : 1] : P.gap[e < 0.05 ? 0 : 1];
      } else {
        const n = brVN(tx / 4, ty / 4, s + 5);
        col = P.s[Math.max(0, Math.min(4, Math.floor((BR_VID * 0.55 + n * 0.45 + bay * 0.2) * 5)))];
        if(h < 0.015) col = P.ash[h < 0.007 ? 0 : 1];
      }
    }
    /* quelques pixels de corruption : le lieu est déjà atteint */
    if(h > 0.9998) col = h > 0.9999 ? [255, 61, 127] : [53, 240, 214];
    D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255;
  }
}
function brGroundRows(J, n){
  const end = Math.min(BR_GT, J.j + n);
  for(; J.j < end; J.j++) brGroundRow(J, J.j);
  if(J.j >= BR_GT){ J.x.putImageData(J.img, 0, 0); return true; }
  return false;
}
function brGroundPaint(hab, cx, cy, seed){
  const J = brGroundJob(hab, cx, cy, seed);
  if(!J) return null;
  brGroundRows(J, BR_GT);
  return J.c;
}
function brGroundSeed(R){ return (R.seed ^ (R.map ? R.map.code : 0)) | 0; }
function brGroundStore(R, key, c){
  R.gtex.set(key, c);
  if(R.gtex.size > 28){ const first = R.gtex.keys().next().value; R.gtex.delete(first); }
}
function brDrawGround(x, R, camX, camY, W, H){
  const C = BR_CHUNK, c0 = Math.floor(camX / C), c1 = Math.floor((camX + W) / C), r0 = Math.floor(camY / C), r1 = Math.floor((camY + H) / C);
  R.gtex = R.gtex || new Map();
  const first = !R.gtex.size, missing = [];
  for(let cy = r0; cy <= r1; cy++) for(let cx = c0; cx <= c1; cx++){
    const key = cx + "," + cy;
    let t = R.gtex.get(key);
    /* au lancement, on peint tout ce qui se voit ; ensuite, par tranches */
    if(t === undefined && first){ try { t = brGroundPaint(R.hab, cx, cy, brGroundSeed(R)); } catch(e){ t = null; } brGroundStore(R, key, t); }
    if(t){ x.drawImage(t, cx * C - camX, cy * C - camY, C, C); continue; }
    if(t === undefined) missing.push([cx, cy]);
    /* pas encore peint : l'ancien carrelage, le temps de quelques images */
    const fl = brFloor(R.hab), fs = fl.width, X0 = cx * C - camX, Y0 = cy * C - camY;
    x.save(); x.beginPath(); x.rect(X0, Y0, C, C); x.clip();
    const ox = -((camX % fs) + fs) % fs, oy = -((camY % fs) + fs) % fs;
    for(let tx = ox; tx < W; tx += fs) for(let ty = oy; ty < H; ty += fs) if(tx + fs > X0 && ty + fs > Y0 && tx < X0 + C && ty < Y0 + C) x.drawImage(fl, tx, ty);
    x.restore();
  }
  /* le chantier en cours : un morceau visible d'abord, sinon celui vers lequel on marche */
  if(!R.gjob){
    let want = missing[0];
    if(!want){
      const dx = Math.sign(R.vx || 0), dy = Math.sign(R.vy || 0);
      const nx = Math.floor((R.x + dx * C * 0.9) / C), ny = Math.floor((R.y + dy * C * 0.9) / C);
      if(R.gtex.get(nx + "," + ny) === undefined) want = [nx, ny];
    }
    if(want){
      let J = null; try { J = brGroundJob(R.hab, want[0], want[1], brGroundSeed(R)); } catch(e){}
      if(J) R.gjob = {key:want[0] + "," + want[1], J}; else brGroundStore(R, want[0] + "," + want[1], null);
    }
  }
  if(R.gjob){
    const t0 = performance.now();
    try {
      while(performance.now() - t0 < 3.5){ if(brGroundRows(R.gjob.J, 6)){ brGroundStore(R, R.gjob.key, R.gjob.J.c); R.gjob = null; break; } }
    } catch(e){ brGroundStore(R, R.gjob.key, null); R.gjob = null; }
  }
}

/* ---------- les sprites du relief : dessinés une fois, à mi-résolution ---------- */
const BR_SPRC = new Map();
function brSprMake(key, w, h, draw){
  let c = BR_SPRC.get(key);
  if(c !== undefined) return c;
  c = document.createElement("canvas");
  if(!c.getContext){ BR_SPRC.set(key, null); return null; }
  c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h));
  const x = c.getContext("2d");
  try { draw(x, c.width, c.height); } catch(e){}
  BR_SPRC.set(key, c);
  return c;
}
function brBlob(x, cx, cy, r){ x.beginPath(); x.arc(cx, cy, Math.max(0.5, r), 0, 7); x.fill(); }
/* feuillu : des grappes de feuillage, de l'ombre vers la lumière */
function brTreeCanopy(hab, r, v){
  const k = `tc|${hab}|${Math.round(r)}|${v}`;
  const R1 = r * 0.5 * 1.4, S2 = Math.ceil(R1 * 2.9);
  return brSprMake(k, S2, S2, (x, w, h)=>{
    const pal = hab === "foret" ? ["#0b1f10", "#123018", "#1a4222", "#24562c", "#357040"]
              : hab === "ruines" ? ["#14261c", "#1e3a28", "#2a4e34", "#386440", "#4e7e52"]
              : ["#13301a", "#1c4422", "#265a2c", "#357238", "#4f9248"];
    const rng = brRng(v * 7919 + Math.round(r) * 31 + hab.length);
    const cx = w / 2, cy = h / 2, bl = [];
    for(let i = 0; i < 10; i++){ const a = rng() * 6.28, d = Math.sqrt(rng()) * R1 * 0.55; bl.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, R1 * (0.38 + rng() * 0.2)]); }
    bl.sort((a, b)=>a[1] - b[1]);
    x.fillStyle = pal[0]; for(const [bx, by, br] of bl) brBlob(x, bx, by + 1, br + 1.5);
    x.fillStyle = pal[1]; for(const [bx, by, br] of bl) brBlob(x, bx, by, br);
    x.fillStyle = pal[2]; for(const [bx, by, br] of bl) brBlob(x, bx - br * 0.12, by - br * 0.16, br * 0.82);
    x.fillStyle = pal[3]; for(const [bx, by, br] of bl) if(by < cy + R1 * 0.2) brBlob(x, bx - br * 0.26, by - br * 0.3, br * 0.5);
    x.fillStyle = pal[4]; for(const [bx, by, br] of bl) if(by < cy) brBlob(x, bx - br * 0.36, by - br * 0.42, br * 0.22);
    /* le grain des feuilles */
    for(let i = 0; i < R1 * 9; i++){ const a = rng() * 6.28, d = Math.sqrt(rng()) * R1 * 0.95, px = Math.round(cx + Math.cos(a) * d), py = Math.round(cy + Math.sin(a) * d * 0.85);
      x.fillStyle = pal[rng() < 0.5 ? 0 : 3]; x.globalAlpha = 0.7; x.fillRect(px, py, 1, 1); }
    x.globalAlpha = 1;
  });
}
/* conifère : des étages de branches, du plus large au plus fin */
function brPineSpr(r, v){
  const k = `pn|${Math.round(r)}|${v}`;
  const wd = r * 0.95, ht = r * 1.95;
  return brSprMake(k, wd + 4, ht + 4, (x, w, h)=>{
    const pal = ["#0a1a10", "#0f2a18", "#163a20", "#20502a", "#2e6838"];
    const tiers = 4, cx = w / 2, rng = brRng(v * 131 + Math.round(r));
    for(let t = 0; t < tiers; t++){
      const k2 = t / tiers, top = h * (0.04 + k2 * 0.2), bot = h * (0.42 + k2 * 0.18), half = (w / 2 - 2) * (0.45 + k2 * 0.55);
      const tri = (dx, c)=>{ x.fillStyle = c; x.beginPath(); x.moveTo(cx + dx, top); x.lineTo(cx + half + dx, bot); x.quadraticCurveTo(cx + dx, bot + 3, cx - half + dx, bot); x.closePath(); x.fill(); };
      tri(0, pal[0]);
      x.save(); x.beginPath(); x.moveTo(cx, top + 1); x.lineTo(cx + half - 1, bot - 1); x.lineTo(cx - half + 1, bot - 1); x.closePath(); x.clip();
      x.fillStyle = pal[2]; x.fillRect(0, 0, w, h);
      x.fillStyle = pal[3]; x.beginPath(); x.moveTo(cx - 1, top); x.lineTo(cx - half, bot); x.lineTo(cx - half * 0.2, bot); x.closePath(); x.fill();
      x.fillStyle = pal[1]; x.beginPath(); x.moveTo(cx + 1, top); x.lineTo(cx + half, bot); x.lineTo(cx + half * 0.45, bot); x.closePath(); x.fill();
      x.fillStyle = pal[4]; for(let i = 0; i < 6; i++) x.fillRect(Math.round(cx - half * 0.6 + rng() * half * 0.5), Math.round(top + (bot - top) * (0.4 + rng() * 0.5)), 1, 1);
      x.restore();
    }
  });
}
/* rocher : un bloc ombré, fissuré, coiffé de mousse selon l'habitat */
function brRockSpr(hab, r, v, kind){
  const k = `rk|${hab}|${kind}|${Math.round(r)}|${v}`;
  const S2 = Math.ceil(r * 1.3) + 4;
  return brSprMake(k, S2, S2, (x, w, h)=>{
    const pal = kind === "basalt" ? ["#120a08", "#21140f", "#2e1c16", "#3d2620", "#52342a"]
              : hab === "grotte" ? ["#1e1610", "#33281e", "#4a3a2c", "#5e4a38", "#76604a"]
              : hab === "ruines" ? ["#1e1830", "#352d4c", "#4a4066", "#5e5480", "#776c9a"]
              : hab === "eaux" ? ["#1a2226", "#2e3a40", "#44525a", "#5a6a72", "#76888e"]
              : ["#24221e", "#3e3a34", "#56514a", "#6e685e", "#8c8576"];
    const rng = brRng(v * 977 + Math.round(r) * 13 + kind.length);
    const cx = w / 2, cy = h * 0.55, rr = r * 0.5, pts = [];
    const n = 8;
    for(let i = 0; i < n; i++){ const a = i / n * 6.28 + rng() * 0.3, d = rr * (0.78 + rng() * 0.3); pts.push([cx + Math.cos(a) * d * 1.08, cy + Math.sin(a) * d * (a > 3.14 ? 0.95 : 0.62)]); }
    const path = ()=>{ x.beginPath(); pts.forEach((p, i)=>i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
    x.fillStyle = pal[0]; x.save(); x.translate(0, 1); path(); x.fill(); x.restore();
    path(); x.fillStyle = pal[2]; x.fill();
    x.save(); path(); x.clip();
    x.fillStyle = pal[1]; x.beginPath(); x.ellipse(cx + rr * 0.45, cy + rr * 0.45, rr * 1.0, rr * 0.7, -0.4, 0, 7); x.fill();
    x.fillStyle = pal[3]; x.beginPath(); x.ellipse(cx - rr * 0.25, cy - rr * 0.5, rr * 0.7, rr * 0.42, -0.3, 0, 7); x.fill();
    x.fillStyle = pal[4]; x.beginPath(); x.ellipse(cx - rr * 0.38, cy - rr * 0.62, rr * 0.3, rr * 0.16, -0.3, 0, 7); x.fill();
    /* fissures */
    x.strokeStyle = pal[0]; x.lineWidth = 1;
    for(let i = 0; i < 2; i++){ let px = cx + (rng() - .5) * rr, py = cy - rr * 0.3 + rng() * rr * 0.4; x.beginPath(); x.moveTo(px, py);
      for(let j = 0; j < 3; j++){ px += (rng() - .3) * rr * 0.4; py += rng() * rr * 0.3; x.lineTo(px, py); } x.stroke(); }
    /* mousse, algues, cendre */
    const top = hab === "foret" || hab === "route" ? ["#2f6a30", "#4f9248"] : hab === "eaux" ? ["#2a6a64", "#3a8a7a"] : hab === "ruines" ? ["#2e4a34", "#3e6444"] : null;
    if(top && kind !== "basalt"){ for(let i = 0; i < rr * 5; i++){ const a = 3.4 + rng() * 2.6, d = rng() * rr * 0.75; x.fillStyle = top[rng() < 0.6 ? 0 : 1];
      x.fillRect(Math.round(cx + Math.cos(a) * d * 1.1), Math.round(cy - rr * 0.35 + Math.sin(a) * d * 0.5), 1 + (rng() < 0.3 ? 1 : 0), 1); } }
    x.restore();
  });
}
/* stalagmite : une aiguille de roche, des anneaux de calcaire */
function brPillarSpr(r, v){
  const k = `pl|${Math.round(r)}|${v}`;
  const wd = r * 1.2 + 4, ht = r * 2.6 + 4;
  return brSprMake(k, wd, ht, (x, w, h)=>{
    const rng = brRng(v * 313 + Math.round(r)), cx = w / 2, base = h - 3, tip = 2, half = w / 2 - 2;
    const lean = (rng() - .5) * half * 0.4;
    const path = ()=>{ x.beginPath(); x.moveTo(cx - half, base); x.quadraticCurveTo(cx - half * 0.5, base - (base - tip) * 0.5, cx + lean, tip); x.quadraticCurveTo(cx + half * 0.55, base - (base - tip) * 0.45, cx + half, base); x.quadraticCurveTo(cx, base + 3, cx - half, base); x.closePath(); };
    path(); x.fillStyle = "#1c140f"; x.fill();
    x.save(); path(); x.clip();
    const g = x.createLinearGradient(cx - half, 0, cx + half, 0); g.addColorStop(0, "#7a6450"); g.addColorStop(0.45, "#5a4838"); g.addColorStop(1, "#2a2018");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(20,14,10,.55)"; x.lineWidth = 1;
    for(let i = 1; i < 6; i++){ const y = tip + (base - tip) * (i / 6) + (rng() - .5) * 3; x.beginPath(); x.moveTo(cx - half, y); x.quadraticCurveTo(cx, y + 2, cx + half, y - 1); x.stroke(); }
    x.fillStyle = "rgba(255,240,210,.35)"; x.fillRect(Math.round(cx - half * 0.4), Math.round(tip + (base - tip) * 0.3), 1, Math.round((base - tip) * 0.5));
    x.restore();
    /* éboulis au pied */
    x.fillStyle = "#3e3025"; for(let i = 0; i < 4; i++) brBlob(x, cx + (rng() - .5) * w * 0.9, base - 1 + rng() * 2, 1.5 + rng() * 1.5);
  });
}
/* colonne brisée : socle, fût cannelé, cassure, un glyphe gravé */
function brColumnSpr(r, v){
  const k = `cl|${Math.round(r)}|${v}`;
  const wd = r * 1.3 + 6, ht = r * 2.5 + 6;
  return brSprMake(k, wd, ht, (x, w, h)=>{
    const rng = brRng(v * 557 + Math.round(r)), cx = w / 2, half = r * 0.42, base = h - 3, top = 4 + rng() * r * 0.45;
    /* socle */
    x.fillStyle = "#231c38"; x.fillRect(Math.round(cx - half - 3), base - 6, Math.round(half * 2 + 6), 6);
    x.fillStyle = "#5a4e80"; x.fillRect(Math.round(cx - half - 3), base - 6, Math.round(half * 2 + 6), 2);
    /* fût */
    x.fillStyle = "#3a3058"; x.fillRect(Math.round(cx - half), Math.round(top), Math.round(half * 2), Math.round(base - 6 - top));
    const fl = Math.max(3, Math.round(half / 1.6));
    for(let i = 0; i < fl; i++){ const fx = cx - half + (i + 0.5) * (half * 2 / fl); x.fillStyle = i < fl / 2 ? "#5e5288" : "#2c2446"; x.fillRect(Math.round(fx), Math.round(top + 2), 1, Math.round(base - 8 - top)); }
    x.fillStyle = "#6e62a0"; x.fillRect(Math.round(cx - half), Math.round(top), 2, Math.round(base - 6 - top));
    /* la cassure, en dents */
    x.fillStyle = "#7a6eb0"; x.beginPath(); x.moveTo(cx - half, top + 1);
    for(let i = 0; i <= 5; i++) x.lineTo(cx - half + i * half * 2 / 5, top + (i % 2 ? -2 - rng() * 3 : 1 + rng() * 2));
    x.lineTo(cx + half, top + 3); x.lineTo(cx - half, top + 3); x.closePath(); x.fill();
    /* fissure et mousse */
    x.strokeStyle = "#1a1430"; x.lineWidth = 1; x.beginPath(); let px = cx + (rng() - .5) * half, py = top + 4; x.moveTo(px, py);
    for(let j = 0; j < 4; j++){ px += (rng() - .5) * 3; py += 3 + rng() * 3; x.lineTo(px, py); } x.stroke();
    x.fillStyle = "#3e6444"; for(let i = 0; i < 8; i++) x.fillRect(Math.round(cx - half + rng() * half * 2), Math.round(base - 7 - rng() * 5), 1, 1);
  });
}
/* orgues de basalte : trois prismes hexagonaux */
function brBasaltSpr(r, v){
  const k = `bs|${Math.round(r)}|${v}`;
  const wd = r * 1.5 + 4, ht = r * 1.9 + 4;
  return brSprMake(k, wd, ht, (x, w, h)=>{
    const rng = brRng(v * 911 + Math.round(r)), base = h - 2;
    const cols = [[-0.3, 0.7 + rng() * 0.25], [0.28, 0.45 + rng() * 0.3], [0, 0.95]].sort((a, b)=>a[1] - b[1]);
    const cw = r * 0.34;
    for(const [ox, hk] of cols){
      const cx = w / 2 + ox * r, top = base - hk * r * 1.6;
      x.fillStyle = "#1a0f0c"; x.fillRect(Math.round(cx - cw), Math.round(top), Math.round(cw * 2), Math.round(base - top));
      x.fillStyle = "#2e1c16"; x.fillRect(Math.round(cx - cw + 1), Math.round(top + 2), Math.round(cw - 1), Math.round(base - top - 3));
      x.fillStyle = "#24160f"; x.fillRect(Math.round(cx), Math.round(top + 2), Math.round(cw - 1), Math.round(base - top - 3));
      x.fillStyle = "#4a2e24"; x.beginPath(); x.moveTo(cx - cw, top + 1); x.lineTo(cx - cw * 0.5, top - 2); x.lineTo(cx + cw * 0.5, top - 2); x.lineTo(cx + cw, top + 1); x.lineTo(cx + cw * 0.5, top + 3); x.lineTo(cx - cw * 0.5, top + 3); x.closePath(); x.fill();
    }
  });
}
/* hautes herbes : une touffe à la Pokémon, trois variantes */
function brTuftSpr(v, hab){
  return brSprMake(`tf|${hab}|${v}`, 14, 12, (x)=>{
    const pal = hab === "foret" ? ["#0c2412", "#1c4a24", "#2f6e34"] : hab === "ruines" ? ["#16281c", "#2a4a30", "#3e6a44"] : ["#123a18", "#2a6a2a", "#4f9a3c"];
    const rng = brRng(v * 71 + 5);
    for(let b = 0; b < 4; b++){
      const bx = 2 + b * 3 + Math.round(rng()), bh = 7 + Math.round(rng() * 4);
      x.fillStyle = pal[0]; x.fillRect(bx - 1, 12 - bh, 3, bh);
      x.fillStyle = pal[1]; x.fillRect(bx, 12 - bh + 1, 1, bh - 1);
      x.fillStyle = pal[2]; x.fillRect(bx, 12 - bh + 1, 1, 2);
    }
  });
}

/* ---------- 2–3. relief et terrains : sous les entités ---------- */
function brDrawUnder(x, R, X, Y){
  const W = R.W, H = R.H, N = R.map.near, hab = R.hab;
  const vis = (o, m) => { const sx = X(o.x), sy = Y(o.y); return sx > -m && sy > -m && sx < W + m && sy < H + m; };
  for(const z of N.zones){
    if(!vis(z, z.r + 20)) continue;
    const zx = X(z.x), zy = Y(z.y);
    if(z.k === "ice"){
      const k = Math.min(1, (z.life || 1) / 2);
      x.globalAlpha = 0.85 * k; x.fillStyle = "#cfefff"; x.beginPath(); x.arc(zx, zy, z.r, 0, 7); x.fill();
      x.strokeStyle = "#ffffff"; x.lineWidth = 2; x.stroke();
      x.strokeStyle = "rgba(120,180,220,.8)"; x.lineWidth = 1;
      for(let k2 = 0; k2 < 4; k2++){ const a = z.seed * 9 + k2 * 1.6; x.beginPath(); x.moveTo(zx, zy); x.lineTo(zx + Math.cos(a) * z.r * 0.8, zy + Math.sin(a) * z.r * 0.8); x.stroke(); }
      x.globalAlpha = 1;
      continue;
    }
    if(z.k === "ash"){ x.fillStyle = "rgba(40,36,34,.55)"; x.beginPath(); x.arc(zx, zy, z.r, 0, 7); x.fill(); continue; }
    if(z.k === "water") brDrawWater(x, R, z, zx, zy);
    else if(z.k === "lava") brDrawLava(x, R, z, zx, zy);
    else brDrawGrass(x, R, z, zx, zy, hab);
  }
  /* les lieux */
  for(const p of N.pois){ if(vis(p, 140)) brDrawPoi(x, R, p, X(p.x), Y(p.y)); }
  /* le relief : ombres, troncs, blocs */
  const obs = N.obs.filter(o=>vis(o, 90)).sort((a, b)=>a.y - b.y);
  for(const o of obs){
    const ox = X(o.x), oy = Y(o.y), v = Math.floor(o.seed * 6);
    x.fillStyle = "rgba(0,0,0,.34)"; x.beginPath(); x.ellipse(ox + 5, oy + o.r * 0.5, o.r * 1.15, o.r * 0.45, 0, 0, 7); x.fill();
    if(o.k === "tree"){
      const pine = hab === "foret" && o.seed > 0.45;
      if(pine){ x.fillStyle = "#3a2414"; x.fillRect(ox - o.r * 0.14, oy - o.r * 0.6, o.r * 0.28, o.r * 0.9); continue; }
      /* tronc, racines, écorce */
      x.fillStyle = "#3a2414"; x.beginPath(); x.moveTo(ox - o.r * 0.22, oy - o.r * 0.9); x.lineTo(ox - o.r * 0.26, oy + o.r * 0.25); x.lineTo(ox - o.r * 0.5, oy + o.r * 0.42);
      x.lineTo(ox + o.r * 0.5, oy + o.r * 0.42); x.lineTo(ox + o.r * 0.26, oy + o.r * 0.25); x.lineTo(ox + o.r * 0.22, oy - o.r * 0.9); x.closePath(); x.fill();
      x.fillStyle = "#5a3a22"; x.fillRect(ox - o.r * 0.2, oy - o.r * 0.9, o.r * 0.16, o.r * 1.15);
      x.fillStyle = "#24160c"; x.fillRect(ox + o.r * 0.04, oy - o.r * 0.7, 2, o.r * 0.8);
      continue;
    }
    const s = o.k === "pillar" ? brPillarSpr(o.r, v) : o.k === "column" ? brColumnSpr(o.r, v) : o.k === "basalt" ? brBasaltSpr(o.r, v) : brRockSpr(hab, o.r, v, o.k);
    if(!s){ brDrawRockOld(x, o, ox, oy); continue; }
    const sw = s.width * 2, sh = s.height * 2;
    if(o.k === "rock") x.drawImage(s, ox - sw / 2, oy - sh * 0.62, sw, sh);
    else x.drawImage(s, ox - sw / 2, oy + o.r * 0.45 - sh, sw, sh);
    /* ce qui vit sur le relief : veines de lave, glyphe qui luit, écume au pied */
    if(o.k === "basalt"){
      const pu = 0.45 + Math.sin(R.t * 2.2 + o.seed * 20) * 0.3;
      x.save(); x.globalCompositeOperation = "lighter"; x.strokeStyle = `rgba(255,110,30,${pu})`; x.lineWidth = 2;
      x.beginPath(); x.moveTo(ox - o.r * 0.42, oy + o.r * 0.4); x.lineTo(ox - o.r * 0.1, oy - o.r * 0.3); x.lineTo(ox + o.r * 0.12, oy + o.r * 0.1); x.lineTo(ox + o.r * 0.4, oy - o.r * 0.6); x.stroke();
      x.restore();
    } else if(o.k === "column"){
      const pu = 0.35 + Math.sin(R.t * 1.6 + o.seed * 30) * 0.25, gy = oy - o.r * 0.9;
      x.save(); x.globalCompositeOperation = "lighter"; x.globalAlpha = pu; x.strokeStyle = "#c9a6ff"; x.lineWidth = 1.5;
      x.beginPath(); x.arc(ox, gy, o.r * 0.22, 0, 7); x.moveTo(ox, gy - o.r * 0.32); x.lineTo(ox, gy + o.r * 0.32); x.stroke(); x.restore();
    } else if(hab === "eaux" && o.k === "rock"){
      x.strokeStyle = `rgba(220,250,255,${0.35 + Math.sin(R.t * 2 + o.seed * 9) * 0.15})`; x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(ox, oy + o.r * 0.32, o.r * (1.05 + Math.sin(R.t * 1.5 + o.seed) * 0.05), o.r * 0.38, 0, 0.1, 3.0); x.stroke();
    }
  }
}
/* l'ancien rendu, au cas où un canevas manquerait */
function brDrawRockOld(x, o, ox, oy){
  const r = o.r, rng = brRng(o.seed * 1e6 | 0), pts = [];
  for(let k = 0; k < 7; k++){ const a = k / 7 * Math.PI * 2; const rr = r * (0.8 + rng() * 0.3); pts.push([ox + Math.cos(a) * rr, oy - r * 0.2 + Math.sin(a) * rr * 0.8]); }
  x.fillStyle = o.k === "basalt" ? "#2a1a18" : "#5a5248"; x.beginPath(); pts.forEach((p, i)=>i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill();
}
/* une rive irrégulière : le cercle de jeu, habillé d'un contour vivant */
function brBlobPath(x, zx, zy, r, seed, wob, t){
  x.beginPath();
  for(let i = 0; i <= 28; i++){
    const a = i / 28 * Math.PI * 2, k = 1 + (brVN(Math.cos(a) * 1.6 + seed * 50, Math.sin(a) * 1.6, 3) - 0.5) * wob + (t ? Math.sin(a * 5 + t) * 0.012 : 0);
    const px = zx + Math.cos(a) * r * k, py = zy + Math.sin(a) * r * k;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
}
function brDrawWater(x, R, z, zx, zy){
  const r = z.r, s = z.seed || 0.5;
  /* la rive mouillée, puis l'eau, du clair au profond */
  x.fillStyle = "rgba(70,90,70,.55)"; brBlobPath(x, zx, zy, r * 1.08, s, 0.22, 0); x.fill();
  const g = x.createRadialGradient(zx - r * 0.2, zy - r * 0.2, r * 0.1, zx, zy, r);
  g.addColorStop(0, "#0a3a5e"); g.addColorStop(0.6, "#0f5480"); g.addColorStop(1, "#2a8aa8");
  x.fillStyle = g; brBlobPath(x, zx, zy, r, s, 0.22, 0); x.fill();
  x.save(); brBlobPath(x, zx, zy, r, s, 0.22, 0); x.clip();
  /* reflets mouvants (caustiques) */
  x.globalCompositeOperation = "lighter";
  for(let i = 0; i < 9; i++){
    const a = i * 2.4 + s * 10, px = zx + Math.cos(a + R.t * 0.18) * r * 0.55 * ((i % 3) / 3 + 0.3), py = zy + Math.sin(a * 1.3 + R.t * 0.22) * r * 0.5 * ((i % 4) / 4 + 0.25);
    x.strokeStyle = `rgba(150,230,255,${0.12 + Math.sin(R.t * 1.4 + i) * 0.06})`; x.lineWidth = 2;
    x.beginPath(); x.ellipse(px, py, 10 + (i % 3) * 5, 4 + (i % 2) * 2, a, 0, 4); x.stroke();
  }
  /* éclats de soleil */
  for(let i = 0; i < 6; i++){ const tw = Math.sin(R.t * 3 + i * 1.7 + s * 9); if(tw < 0.6) continue;
    const px = zx + Math.cos(i * 2.1 + s * 7) * r * 0.6, py = zy + Math.sin(i * 1.7 + s * 5) * r * 0.5;
    x.fillStyle = `rgba(255,255,255,${(tw - 0.6) * 2})`; x.fillRect(px - 2, py, 5, 1); x.fillRect(px, py - 2, 1, 5); }
  x.globalCompositeOperation = "source-over";
  x.restore();
  /* l'écume au bord */
  x.strokeStyle = "rgba(225,250,255,.55)"; x.lineWidth = 2; x.setLineDash([7, 5]); x.lineDashOffset = -R.t * 8;
  brBlobPath(x, zx, zy, r * 0.97, s, 0.22, R.t * 1.3); x.stroke(); x.setLineDash([]);
  /* l'eau électrisée crépite */
  if(z.shock > 0){ x.strokeStyle = "#ffe45e"; x.lineWidth = 2;
    for(let k = 0; k < 7; k++){ let px = zx + (R.rng() - .5) * r, py = zy + (R.rng() - .5) * r; x.beginPath(); x.moveTo(px, py);
      for(let j = 0; j < 3; j++){ px += (R.rng() - .5) * 26; py += (R.rng() - .5) * 26; x.lineTo(px, py); } x.stroke(); } }
}
/* la lave : une croûte en plaques, des fentes qui rougeoient, des bulles qui crèvent */
function brLavaCrust(r, seed){
  const v = Math.floor(seed * 8);
  return brSprMake(`lv|${Math.round(r)}|${v}`, r + 4, r + 4, (x, w, h)=>{
    const cx = w / 2, cy = h / 2, rr = r / 2, rng = brRng(v * 37 + Math.round(r));
    for(let i = 0; i < 9 + rr / 4; i++){
      const a = rng() * 6.28, d = Math.sqrt(rng()) * rr * 0.75, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d, pr = rr * (0.16 + rng() * 0.16);
      x.fillStyle = "#2a120a"; x.beginPath();
      for(let k = 0; k < 6; k++){ const b = k / 6 * 6.28 + rng() * 0.4, q = pr * (0.7 + rng() * 0.4); k ? x.lineTo(px + Math.cos(b) * q, py + Math.sin(b) * q * 0.8) : x.moveTo(px + Math.cos(b) * q, py + Math.sin(b) * q * 0.8); }
      x.closePath(); x.fill();
      x.fillStyle = "#4a2416"; x.fillRect(Math.round(px - pr * 0.4), Math.round(py - pr * 0.4), Math.max(1, Math.round(pr * 0.5)), 1);
    }
  });
}
function brDrawLava(x, R, z, zx, zy){
  const r = z.r, s = z.seed || 0.5, pul = 0.85 + Math.sin(R.t * 2 + s * 9) * 0.15;
  x.fillStyle = "rgba(30,10,6,.7)"; brBlobPath(x, zx, zy, r * 1.06, s, 0.25, 0); x.fill();
  const g = x.createRadialGradient(zx, zy, 0, zx, zy, r);
  g.addColorStop(0, `rgb(255,${180 + 40 * pul | 0},90)`); g.addColorStop(0.5, "#ff6a1a"); g.addColorStop(0.9, "#a8300c"); g.addColorStop(1, "#5a1608");
  x.fillStyle = g; brBlobPath(x, zx, zy, r, s, 0.25, 0); x.fill();
  const cr = brLavaCrust(r, s);
  if(cr){ x.save(); brBlobPath(x, zx, zy, r, s, 0.25, 0); x.clip(); x.globalAlpha = 0.92; x.drawImage(cr, zx - cr.width, zy - cr.height, cr.width * 2, cr.height * 2); x.restore(); x.globalAlpha = 1; }
  /* la lave figée : une croûte sombre, sans danger */
  if(z.cooled > 0){ x.fillStyle = `rgba(50,44,40,${Math.min(0.92, z.cooled / 2)})`; brBlobPath(x, zx, zy, r * 0.96, s, 0.25, 0); x.fill(); return; }
  /* des bulles qui gonflent et crèvent */
  for(let i = 0; i < 4; i++){
    const ph = (R.t * 0.7 + i * 0.27 + s * 3) % 1, a = s * 40 + i * 1.9 + Math.floor(R.t * 0.7 + i * 0.27) * 2.3, d = r * (0.2 + ((i * 0.37 + s) % 0.5));
    const bx = zx + Math.cos(a) * d, by = zy + Math.sin(a) * d * 0.8;
    if(ph < 0.8){ x.fillStyle = "#ffb35c"; x.beginPath(); x.arc(bx, by, 1 + ph * 5, 0, 7); x.fill(); x.fillStyle = "#fff3b0"; x.fillRect(bx - 1, by - 1 - ph * 2, 2, 1); }
    else { x.strokeStyle = `rgba(255,200,120,${(1 - ph) * 5})`; x.lineWidth = 1; x.beginPath(); x.arc(bx, by, 6 + (ph - 0.8) * 30, 0, 7); x.stroke(); }
  }
  x.save(); x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.18 * pul;
  const hg = x.createRadialGradient(zx, zy, r * 0.5, zx, zy, r * 1.5); hg.addColorStop(0, "#ff6a1a"); hg.addColorStop(1, "rgba(255,106,26,0)");
  x.fillStyle = hg; x.fillRect(zx - r * 1.5, zy - r * 1.5, r * 3, r * 3); x.restore();
}
function brDrawGrass(x, R, z, zx, zy, hab){
  const r = z.r, s = z.seed || 0.5;
  x.fillStyle = hab === "foret" ? "rgba(10,30,14,.45)" : "rgba(20,60,24,.42)"; brBlobPath(x, zx, zy, r, s, 0.3, 0); x.fill();
  /* les herbes en feu */
  if(z.burn > 0){ x.globalCompositeOperation = "lighter";
    for(let k = 0; k < 10; k++){ const a = R.rng() * 6.28, d = Math.sqrt(R.rng()) * r * 0.9;
      x.fillStyle = R.rng() < 0.5 ? "rgba(255,120,40,.6)" : "rgba(255,200,80,.5)";
      x.beginPath(); x.arc(zx + Math.cos(a) * d, zy + Math.sin(a) * d - R.rng() * 8, 4 + R.rng() * 6, 0, 7); x.fill(); }
    x.globalCompositeOperation = "source-over"; }
  /* les touffes, en quinconce, qui ondulent */
  const rng = brRng(s * 1e6 | 0), step = 18;
  const tufts = [brTuftSpr(0, hab), brTuftSpr(1, hab), brTuftSpr(2, hab)];
  if(!tufts[0]) return;
  for(let gy = -r; gy <= r; gy += step * 0.8){
    for(let gx = -r; gx <= r; gx += step){
      const jx = gx + ((Math.round(gy / step) & 1) ? step / 2 : 0) + (rng() - .5) * 6, jy = gy + (rng() - .5) * 5;
      const nr = brVN(Math.atan2(jy, jx) * 1.6 / Math.PI * 3 + s * 50, 0, 3);
      if(jx * jx + jy * jy > (r * (0.86 + (nr - 0.5) * 0.3)) ** 2) continue;
      const t = tufts[Math.floor(rng() * 3)], sway = Math.round(Math.sin(R.t * 2.2 + (zx + jx) * 0.05) * 1.2);
      x.drawImage(t, zx + jx - 14 + sway, zy + jy - 20, 28, 24);
    }
  }
}

/* ---------- 4. les lieux ---------- */
function brDrawPoi(x, R, p, px, py){
  const P = BR_POI[p.k];
  if(p.k === "nid") return;                       /* dessiné comme un ennemi */
  const spent = p.used && (p.k === "cache" || p.k === "autel" || p.k === "captif" || p.k === "souche" || p.k === "cristal");
  const t = R.t + (p.x % 7), prog = P.hold ? Math.min(1, p.prog / P.hold) : 0;
  x.save();
  switch(p.k){
    case "cache": brPoiCache(x, R, p, px, py, t, spent, prog); break;
    case "autel": brPoiAltar(x, R, p, px, py, t, spent, prog); break;
    case "captif": brPoiCage(x, R, p, px, py, t, spent, prog); break;
    case "souche": brPoiStump(x, R, p, px, py, t, spent, prog); break;
    case "cristal": brPoiCrystal(x, R, p, px, py, t, spent, prog); break;
    case "glyphe": brPoiGlyph(x, R, p, px, py, t); break;
    case "geyser": brPoiGeyser(x, R, p, px, py, t); break;
    case "remous": brPoiWhirl(x, R, p, px, py, t); break;
    case "arbre":
      x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(px + 5, py + 18, 38, 13, 0, 0, 7); x.fill();
      x.fillStyle = "#3a2414"; x.beginPath(); x.moveTo(px - 7, py - 12); x.lineTo(px - 9, py + 14); x.lineTo(px - 16, py + 20); x.lineTo(px + 16, py + 20); x.lineTo(px + 9, py + 14); x.lineTo(px + 7, py - 12); x.closePath(); x.fill();
      x.fillStyle = "#5a3a22"; x.fillRect(px - 6, py - 12, 5, 30);
      break;                                      /* la ramure est dessinée au-dessus des entités */
  }
  x.restore();
  /* la jauge d'activation : un arc lumineux, et l'objet réagit déjà */
  if(!spent && P.hold && p.prog > 0){
    x.strokeStyle = "rgba(0,0,0,.5)"; x.lineWidth = 6; x.beginPath(); x.arc(px, py - 14, 32, 0, 7); x.stroke();
    x.strokeStyle = P.c; x.lineWidth = 4; x.shadowColor = P.c; x.shadowBlur = 10;
    x.beginPath(); x.arc(px, py - 14, 32, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); x.stroke(); x.shadowBlur = 0;
  }
}
function brGlowAt(x, px, py, r, col, a){
  x.save(); x.globalCompositeOperation = "lighter"; x.globalAlpha = a;
  const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); x.restore();
}
/* la cache : une caisse de données, son écran qui défile, ses voyants */
function brPoiCache(x, R, p, px, py, t, spent, prog){
  x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(px + 3, py + 13, 26, 8, 0, 0, 7); x.fill();
  if(!spent) brGlowAt(x, px, py - 4, 46, "#35f0d6", 0.22 + Math.sin(t * 3) * 0.08 + prog * 0.3);
  const bw = 34, bh = 20, bx = px - bw / 2, by = py - bh + 10, lid = spent ? 1 : prog * 0.4;
  /* flanc, face, couvercle */
  x.fillStyle = "#121a24"; x.beginPath(); x.moveTo(bx + bw, by); x.lineTo(bx + bw + 7, by - 6); x.lineTo(bx + bw + 7, by + bh - 6); x.lineTo(bx + bw, by + bh); x.closePath(); x.fill();
  x.fillStyle = "#1c2836"; x.fillRect(bx, by, bw, bh);
  x.fillStyle = "#2c3c50"; x.fillRect(bx, by, bw, 2); x.fillRect(bx, by, 2, bh);
  x.fillStyle = "#ffd24a"; for(let i = 0; i < 4; i++) x.fillRect(bx + 3 + i * 8, by + bh - 4, 4, 2);
  x.save(); x.translate(bx, by - lid * 10); x.rotate(-lid * 0.35);
  x.fillStyle = "#33465c"; x.beginPath(); x.moveTo(0, 0); x.lineTo(7, -6); x.lineTo(bw + 7, -6); x.lineTo(bw, 0); x.closePath(); x.fill();
  x.fillStyle = "#4a6280"; x.fillRect(4, -4, bw - 4, 1);
  x.restore();
  /* l'écran */
  const sx = bx + 5, sy = by + 4, sw = bw - 10, sh = 9;
  x.fillStyle = spent ? "#0a0e12" : "#04161c"; x.fillRect(sx, sy, sw, sh);
  if(!spent){
    x.fillStyle = "#35f0d6";
    for(let l = 0; l < 3; l++){ const len = 4 + ((Math.floor(t * 6) + l * 3 + Math.floor(p.x)) * 7 % 15); x.globalAlpha = 0.85 - l * 0.2; x.fillRect(sx + 1, sy + 1 + l * 3, Math.min(sw - 2, len), 1); }
    x.globalAlpha = 1;
    /* voyants */
    x.fillStyle = Math.floor(t * 2) % 2 ? "#5ce07a" : "#1e4a2a"; x.fillRect(bx + bw - 4, by + 4, 2, 2);
    x.fillStyle = Math.floor(t * 3 + 1) % 3 ? "#35f0d6" : "#0e3a3a"; x.fillRect(bx + bw - 4, by + 8, 2, 2);
    /* l'hologramme au-dessus : on sait de loin ce que c'est */
    const hy = by - 16 + Math.sin(t * 2.4) * 2;
    x.globalAlpha = 0.25; x.fillStyle = "#35f0d6"; x.beginPath(); x.moveTo(px - 4, by - 4); x.lineTo(px - 10, hy); x.lineTo(px + 10, hy); x.lineTo(px + 4, by - 4); x.closePath(); x.fill();
    x.globalAlpha = 0.9; x.strokeStyle = "#8ff7e8"; x.lineWidth = 1.5; x.strokeRect(px - 6, hy - 10, 12, 10);
    x.fillStyle = "#8ff7e8"; x.fillRect(px - 3, hy - 7, 6, 4); x.globalAlpha = 1;
  } else {
    x.fillStyle = "rgba(53,240,214,.25)"; x.fillRect(px - 8, by - 2, 16, 2);
  }
}
/* l'autel : un dais de pierre, trois obélisques, un cristal d'or en suspension */
function brPoiAltar(x, R, p, px, py, t, spent, prog){
  x.fillStyle = "rgba(0,0,0,.35)"; x.beginPath(); x.ellipse(px + 3, py + 10, 46, 16, 0, 0, 7); x.fill();
  x.fillStyle = "#2e2820"; x.beginPath(); x.ellipse(px, py + 5, 44, 15, 0, 0, 7); x.fill();
  x.fillStyle = "#5a5040"; x.beginPath(); x.ellipse(px, py, 42, 14, 0, 0, 7); x.fill();
  x.fillStyle = "#6e6450"; x.beginPath(); x.ellipse(px, py - 1, 30, 9, 0, 0, 7); x.fill();
  /* le cercle de runes, qui s'allume avec la jauge */
  x.strokeStyle = spent ? "rgba(120,100,60,.5)" : `rgba(255,210,74,${0.45 + prog * 0.5})`; x.lineWidth = 1.5;
  x.setLineDash([3, 4]); x.lineDashOffset = -t * 6; x.beginPath(); x.ellipse(px, py - 1, 36, 11.5, 0, 0, 7); x.stroke(); x.setLineDash([]);
  if(!spent && prog > 0){ x.strokeStyle = "#ffe9a8"; x.lineWidth = 2.5; x.beginPath(); x.ellipse(px, py - 1, 36, 11.5, 0, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); x.stroke(); }
  /* les obélisques */
  for(let i = 0; i < 3; i++){
    const a = -Math.PI / 2 + i * Math.PI * 2 / 3 + 0.5, ox = px + Math.cos(a) * 38, oy = py + Math.sin(a) * 12;
    x.fillStyle = "#2a241c"; x.beginPath(); x.moveTo(ox - 5, oy + 3); x.lineTo(ox - 3, oy - 22); x.lineTo(ox, oy - 27); x.lineTo(ox + 3, oy - 22); x.lineTo(ox + 5, oy + 3); x.closePath(); x.fill();
    x.fillStyle = "#4a4032"; x.fillRect(ox - 3, oy - 21, 2, 22);
    x.fillStyle = spent ? "#4a3a1e" : "#ffd24a"; x.fillRect(ox - 1, oy - 25, 2, 3);
    if(!spent) brGlowAt(x, ox, oy - 24, 10, "#ffd24a", 0.5 + Math.sin(t * 4 + i) * 0.2);
  }
  if(spent){ x.strokeStyle = "#1e1a14"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px - 18, py - 3); x.lineTo(px - 4, py + 2); x.lineTo(px + 10, py - 4); x.stroke(); return; }
  /* la colonne de lumière, et le cristal */
  const by = py - 30 + Math.sin(t * 2) * 4;
  x.save(); x.globalCompositeOperation = "lighter";
  const lg = x.createLinearGradient(px, py, px, py - 120); lg.addColorStop(0, `rgba(255,210,74,${0.18 + prog * 0.4})`); lg.addColorStop(1, "rgba(255,210,74,0)");
  x.fillStyle = lg; x.fillRect(px - 14 - prog * 8, py - 120, 28 + prog * 16, 120);
  x.restore();
  brGlowAt(x, px, by, 26 + prog * 14, "#ffd24a", 0.55);
  x.save(); x.translate(px, by); x.rotate(Math.sin(t) * 0.15);
  x.fillStyle = "#c8901e"; x.beginPath(); x.moveTo(0, -11); x.lineTo(7, 0); x.lineTo(0, 12); x.lineTo(-7, 0); x.closePath(); x.fill();
  x.fillStyle = "#ffe9a8"; x.beginPath(); x.moveTo(0, -11); x.lineTo(3, 0); x.lineTo(0, 12); x.lineTo(-7, 0); x.closePath(); x.fill();
  x.fillStyle = "#ffffff"; x.fillRect(-2, -6, 2, 4);
  x.restore();
}
/* le captif : une cage de glitch, le Pokémon prisonnier qui s'agite */
function brPoiCage(x, R, p, px, py, t, spent, prog){
  if(!p.id) p.id = brSpecies(R);
  x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(px + 3, py + 10, 30, 10, 0, 0, 7); x.fill();
  x.fillStyle = spent ? "#1a1a22" : "#2a0a24"; x.beginPath(); x.ellipse(px, py + 6, 28, 9, 0, 0, 7); x.fill();
  if(spent){
    /* la cage brisée : barreaux tombés, plus personne */
    x.strokeStyle = "#4a4458"; x.lineWidth = 2;
    for(let i = 0; i < 5; i++){ const a = i * 1.3 + p.x; x.beginPath(); x.moveTo(px + Math.cos(a) * 12, py + 6 + Math.sin(a) * 4); x.lineTo(px + Math.cos(a) * 30, py + 8 + Math.sin(a) * 8); x.stroke(); }
    return;
  }
  brGlowAt(x, px, py - 16, 44, "#ff3d7f", 0.2 + Math.sin(t * 5) * 0.06);
  /* le prisonnier : il s'agite, il appelle */
  const shake = Math.sin(t * 18) * (Math.sin(t * 1.3) > 0.6 ? 2 : 0);
  const ok = typeof brPmdDraw === "function" && brPmdDraw(x, p.id, "n", 0, t * 0.6, px + shake, py - 8, 40);
  if(!ok){ const spr = brSprite(p.id, "n"); if(spr) x.drawImage(spr, px - 22 + shake, py - 34, 44, 44); }
  /* les barreaux : six, magenta et cyan, qui sautent */
  const top = py - 46, bot = py + 6;
  for(let i = 0; i < 7; i++){
    const a = Math.PI * (i / 6), bx = px - Math.cos(a) * 26, jit = Math.random() < 0.04 ? (Math.random() - .5) * 8 : 0;
    x.fillStyle = i % 2 ? "rgba(53,240,214,.85)" : "rgba(255,61,127,.9)";
    x.fillRect(bx - 1 + jit, top + Math.sin(a) * 6, 2, bot - top - Math.sin(a) * 2);
  }
  x.strokeStyle = "#ff3d7f"; x.lineWidth = 2;
  x.beginPath(); x.ellipse(px, top + 4, 26, 6, 0, Math.PI, 0); x.stroke();
  x.beginPath(); x.ellipse(px, bot, 26, 7, 0, 0, Math.PI); x.stroke();
  /* des blocs de glitch qui se décrochent */
  for(let i = 0; i < 3; i++){ const ph = (t * 0.8 + i * 0.33) % 1; x.globalAlpha = 1 - ph;
    x.fillStyle = i % 2 ? "#35f0d6" : "#ff3d7f"; x.fillRect(px + (i - 1) * 18 + Math.sin(i * 9) * 4, top - ph * 18, 4, 3); }
  x.globalAlpha = 1;
  /* l'appel à l'aide : la jauge l'apaise */
  if(prog < 0.05 && Math.sin(t * 2.5) > -0.2){
    const by = top - 14 + Math.sin(t * 4) * 2;
    x.fillStyle = "rgba(4,8,16,.85)"; x.fillRect(px - 9, by - 8, 18, 13); x.strokeStyle = "#5ce07a"; x.lineWidth = 1; x.strokeRect(px - 9, by - 8, 18, 13);
    x.fillStyle = "#5ce07a"; x.font = "bold 10px ui-monospace,monospace"; x.textAlign = "center"; x.fillText("!", px, by + 2);
  }
  if(prog > 0) brGlowAt(x, px, py - 16, 30 + prog * 30, "#5ce07a", prog * 0.5);
}
/* la souche : un tronc millénaire, ses cernes, ses pousses qui luisent */
function brPoiStump(x, R, p, px, py, t, spent, prog){
  x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(px + 4, py + 10, 40, 12, 0, 0, 7); x.fill();
  /* racines */
  x.fillStyle = "#3a2414";
  for(let i = 0; i < 5; i++){ const a = 0.3 + i * 0.65, ex = px + Math.cos(a) * 40, ey = py + 4 + Math.sin(a) * 9;
    x.beginPath(); x.moveTo(px + Math.cos(a) * 18 - 4, py + 2); x.quadraticCurveTo(px + Math.cos(a) * 30, py + 8, ex, ey); x.lineTo(px + Math.cos(a) * 18 + 4, py + 4); x.closePath(); x.fill(); }
  /* le fût */
  x.fillStyle = "#4a2e1a"; x.fillRect(px - 26, py - 14, 52, 18);
  x.fillStyle = "#5e3c22"; for(let i = 0; i < 7; i++) x.fillRect(px - 24 + i * 7, py - 12, 2, 15);
  x.fillStyle = "#3a2414"; x.beginPath(); x.ellipse(px, py + 4, 26, 7, 0, 0, Math.PI); x.fill();
  /* le dessus et ses cernes */
  x.fillStyle = "#8a6a44"; x.beginPath(); x.ellipse(px, py - 14, 26, 9, 0, 0, 7); x.fill();
  x.strokeStyle = "#6a4e30"; x.lineWidth = 1;
  for(let k = 1; k <= 4; k++){ x.beginPath(); x.ellipse(px + 1, py - 14, 26 * k / 5, 9 * k / 5, 0, 0, 7); x.stroke(); }
  /* mousse */
  x.fillStyle = "#3f7a34"; x.beginPath(); x.ellipse(px - 16, py - 12, 9, 4, -0.3, 0, 7); x.fill(); x.fillStyle = "#5c9a44"; x.fillRect(px - 20, py - 15, 5, 2);
  if(spent){
    /* elle a fleuri : une jeune pousse */
    x.fillStyle = "#3f7a34"; x.fillRect(px - 1, py - 32, 2, 18);
    x.fillStyle = "#6fc054"; x.beginPath(); x.ellipse(px - 6, py - 30, 6, 3, -0.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(px + 6, py - 26, 6, 3, 0.5, 0, 7); x.fill();
    x.fillStyle = "#ffb3dc"; brBlob(x, px, py - 34, 3);
    return;
  }
  /* pousses qui luisent, de plus en plus fort pendant l'éveil */
  for(let i = 0; i < 3; i++){
    const sx = px - 10 + i * 10, sh = 6 + i % 2 * 3 + prog * 6, sw = Math.sin(t * 2 + i) * 1.5;
    x.strokeStyle = "#5ce07a"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(sx, py - 15); x.lineTo(sx + sw, py - 15 - sh); x.stroke();
    x.fillStyle = "#9fe07a"; brBlob(x, sx + sw - 2, py - 15 - sh, 2); brBlob(x, sx + sw + 2, py - 13 - sh, 2);
  }
  brGlowAt(x, px, py - 18, 34 + prog * 26, "#9fe07a", 0.2 + Math.sin(t * 2.5) * 0.08 + prog * 0.4);
}
/* le cristal géant : un massif de prismes, une lueur intérieure */
function brPoiCrystal(x, R, p, px, py, t, spent, prog){
  x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(px + 3, py + 10, 30, 9, 0, 0, 7); x.fill();
  if(spent){
    x.fillStyle = "#3a6a7a";
    for(let i = 0; i < 7; i++){ const a = i * 0.9 + p.x, d = 8 + (i * 7) % 20, sx = px + Math.cos(a) * d, sy = py + 4 + Math.sin(a) * d * 0.35;
      x.beginPath(); x.moveTo(sx, sy - 6); x.lineTo(sx + 3, sy); x.lineTo(sx - 3, sy); x.closePath(); x.fill(); }
    return;
  }
  brGlowAt(x, px, py - 20, 56, "#aef4ff", 0.25 + Math.sin(t * 2) * 0.08 + prog * 0.35);
  const prisms = [[-14, 30, -0.35, 9], [12, 26, 0.3, 8], [0, 48, 0.02, 12], [-24, 16, -0.6, 6], [24, 14, 0.65, 6]];
  prisms.sort((a, b)=>a[1] - b[1]);
  for(const [dx, ht, lean, wd] of prisms){
    const bx = px + dx, by = py + 6, tx = bx + Math.sin(lean) * ht, ty = by - Math.cos(lean) * ht;
    x.fillStyle = "#1a4a5a"; x.beginPath(); x.moveTo(bx - wd / 2, by); x.lineTo(tx - wd / 2, ty + wd * 0.6); x.lineTo(tx, ty); x.lineTo(tx + wd / 2, ty + wd * 0.6); x.lineTo(bx + wd / 2, by); x.closePath(); x.fill();
    x.fillStyle = "#6fd0e8"; x.beginPath(); x.moveTo(bx - wd / 2, by); x.lineTo(tx - wd / 2, ty + wd * 0.6); x.lineTo(tx, ty); x.lineTo(bx, by + 1); x.closePath(); x.fill();
    x.fillStyle = "#d8faff"; x.beginPath(); x.moveTo(tx - wd / 2, ty + wd * 0.6); x.lineTo(tx, ty); x.lineTo(tx - wd * 0.15, ty + wd * 0.9); x.closePath(); x.fill();
  }
  /* éclats de lumière qui scintillent */
  x.save(); x.globalCompositeOperation = "lighter";
  for(let i = 0; i < 4; i++){ const tw = Math.sin(t * 3.4 + i * 1.6); if(tw < 0.5) continue;
    const sx = px + Math.cos(i * 2.3) * 14, sy = py - 14 - (i * 9) % 30; x.fillStyle = `rgba(255,255,255,${(tw - 0.5) * 2})`;
    x.fillRect(sx - 3, sy, 7, 1); x.fillRect(sx, sy - 3, 1, 7); }
  x.restore();
  if(prog > 0){ x.strokeStyle = `rgba(255,255,255,${prog})`; x.lineWidth = 1;
    for(let i = 0; i < 4; i++){ x.beginPath(); x.moveTo(px - 6 + i * 4, py - 30); x.lineTo(px - 10 + i * 6, py - 10 + (i % 2) * 6); x.stroke(); } }
}
/* la dalle-glyphe : une pierre gravée, ses runes chargées */
function brPoiGlyph(x, R, p, px, py, t){
  const ready = p.cd <= 0, ch = ready ? 1 : Math.max(0, 1 - p.cd / 7);
  x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(px - 26, py - 20, 56, 46);
  x.fillStyle = "#2a2440"; x.fillRect(px - 28, py - 24, 56, 50);
  x.fillStyle = "#463e66"; x.fillRect(px - 26, py - 26, 52, 46);
  x.fillStyle = "#5a5080"; x.fillRect(px - 26, py - 26, 52, 3); x.fillRect(px - 26, py - 26, 3, 46);
  x.fillStyle = "#2e2848"; x.fillRect(px + 23, py - 26, 3, 46); x.fillRect(px - 26, py + 17, 52, 3);
  /* la gravure */
  const col = ready ? "#e8d8ff" : `rgba(201,166,255,${0.25 + ch * 0.45})`;
  x.strokeStyle = col; x.lineWidth = 2; x.save();
  if(ready){ x.shadowColor = "#c9a6ff"; x.shadowBlur = 10 + Math.sin(t * 5) * 5; }
  x.beginPath(); x.arc(px, py - 4, 13, 0, 7); x.moveTo(px, py - 20); x.lineTo(px, py + 12);
  x.moveTo(px - 13, py - 4); x.lineTo(px - 6, py - 4); x.moveTo(px + 6, py - 4); x.lineTo(px + 13, py - 4);
  x.moveTo(px - 8, py - 13); x.lineTo(px - 4, py - 9); x.moveTo(px + 8, py + 5); x.lineTo(px + 4, py + 1); x.stroke();
  x.restore();
  /* la recharge se lit comme un sablier de lumière */
  if(!ready){ x.fillStyle = "rgba(201,166,255,.45)"; x.fillRect(px - 22, py + 14, 44 * ch, 2); }
  else brGlowAt(x, px, py - 4, 44, "#c9a6ff", 0.25 + Math.sin(t * 5) * 0.1);
}
/* le geyser : un évent de roche qui fume, qui gronde, qui crache */
function brPoiGeyser(x, R, p, px, py, t){
  const ph = p.phase || 0, warn = ph > 5.2;
  x.fillStyle = "rgba(0,0,0,.4)"; x.beginPath(); x.ellipse(px + 3, py + 8, 34, 11, 0, 0, 7); x.fill();
  x.fillStyle = "#2a1610"; x.beginPath(); x.moveTo(px - 32, py + 6); x.quadraticCurveTo(px - 18, py - 12, px - 10, py - 6); x.lineTo(px + 10, py - 6); x.quadraticCurveTo(px + 18, py - 12, px + 32, py + 6); x.closePath(); x.fill();
  x.fillStyle = "#4a2a1e"; x.beginPath(); x.moveTo(px - 30, py + 5); x.quadraticCurveTo(px - 18, py - 10, px - 10, py - 6); x.lineTo(px - 6, py - 4); x.lineTo(px - 22, py + 5); x.closePath(); x.fill();
  x.fillStyle = warn ? "#ffb35c" : "#c4400e"; x.beginPath(); x.ellipse(px, py - 6, 10, 4, 0, 0, 7); x.fill();
  x.fillStyle = "#1a0a06"; x.beginPath(); x.ellipse(px, py - 6, 6, 2.5, 0, 0, 7); x.fill();
  /* fumerolles */
  for(let i = 0; i < 4; i++){ const k = (t * 0.45 + i * 0.25) % 1; x.globalAlpha = (1 - k) * (warn ? 0.6 : 0.3);
    x.fillStyle = warn ? "#8a5a4a" : "#5a4a46"; brBlob(x, px + Math.sin(k * 6 + i) * 6, py - 10 - k * 46, 4 + k * 10); }
  x.globalAlpha = 1;
  if(warn){
    /* le sol se fissure en rougeoyant : il va cracher */
    const w = ph - 5.2;
    x.strokeStyle = `rgba(255,138,61,${0.3 + w})`; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 115 * w, 0, 7); x.stroke();
    x.fillStyle = "rgba(255,138,61,.12)"; x.beginPath(); x.arc(px, py, 115, 0, 7); x.fill();
    x.strokeStyle = `rgba(255,170,80,${0.4 + w * 0.5})`; x.lineWidth = 1.5;
    for(let i = 0; i < 6; i++){ const a = i * 1.05 + p.x; x.beginPath(); x.moveTo(px + Math.cos(a) * 12, py + Math.sin(a) * 5);
      x.lineTo(px + Math.cos(a + 0.2) * 40 * w, py + Math.sin(a + 0.2) * 16 * w); x.stroke(); }
  }
  if(ph < 0.7){
    /* l'éruption : une colonne de feu et de roche */
    const k = 1 - ph / 0.7, hgt = 150 * k;
    x.save(); x.globalCompositeOperation = "lighter";
    const g = x.createLinearGradient(px, py, px, py - hgt); g.addColorStop(0, "rgba(255,240,180,.95)"); g.addColorStop(0.4, "rgba(255,138,61,.8)"); g.addColorStop(1, "rgba(255,61,30,0)");
    x.fillStyle = g; x.beginPath(); x.moveTo(px - 10, py - 4); x.quadraticCurveTo(px - 22 * k, py - hgt * 0.6, px, py - hgt); x.quadraticCurveTo(px + 22 * k, py - hgt * 0.6, px + 10, py - 4); x.closePath(); x.fill();
    x.restore();
  }
}
/* le remous : un tourbillon, ses bras d'écume, son œil sombre */
function brPoiWhirl(x, R, p, px, py, t){
  const g = x.createRadialGradient(px, py, 4, px, py, 100);
  g.addColorStop(0, "rgba(2,12,24,.95)"); g.addColorStop(0.3, "rgba(8,40,70,.7)"); g.addColorStop(1, "rgba(20,90,130,0)");
  x.fillStyle = g; x.beginPath(); x.ellipse(px, py, 100, 80, 0, 0, 7); x.fill();
  for(let arm = 0; arm < 4; arm++){
    x.strokeStyle = `rgba(200,245,255,${0.55 - arm * 0.06})`; x.lineWidth = 2.5 - arm * 0.3; x.beginPath();
    for(let i = 0; i <= 26; i++){ const k = i / 26, a = -t * 2.4 + arm * Math.PI / 2 + k * 5.2, rr = 8 + k * 88;
      const qx = px + Math.cos(a) * rr, qy = py + Math.sin(a) * rr * 0.8; i ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }
    x.stroke();
  }
  /* l'écume aspirée */
  x.fillStyle = "rgba(240,252,255,.8)";
  for(let i = 0; i < 14; i++){ const k = ((t * 0.35 + i / 14) % 1), a = -t * 2.4 + i * 2.3 + (1 - k) * 4, rr = 10 + (1 - k) * 90;
    x.fillRect(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.8, 2, 2); }
}

/* ---------- au-dessus des entités : ramures, ambiance, obscurité, flèches ---------- */
function brDrawOver(x, R, X, Y){
  const W = R.W, H = R.H, N = R.map.near, hab = R.hab;
  const trees = N.obs.filter(o=>o.k === "tree").sort((a, b)=>a.y - b.y);
  for(const o of trees){
    const ox = X(o.x), oy = Y(o.y);
    if(ox < -100 || oy < -140 || ox > W + 100 || oy > H + 120) continue;
    const under = Math.hypot(R.x - o.x, R.y - (o.y - o.r)) < o.r * 1.7;
    x.globalAlpha = under ? 0.38 : 1;
    const v = Math.floor(o.seed * 6);
    const pine = hab === "foret" && o.seed > 0.45;
    const s = pine ? brPineSpr(o.r, v) : brTreeCanopy(hab, o.r, v);
    if(s){
      const sw = s.width * 2, sh = s.height * 2, sway = Math.sin(R.t * 0.9 + o.seed * 20) * 1.5;
      if(pine) x.drawImage(s, ox - sw / 2 + sway * 0.5, oy - o.r * 0.4 - sh, sw, sh);
      else x.drawImage(s, ox - sw / 2 + sway, oy - o.r * 1.15 - sh / 2, sw, sh);
    }
    x.globalAlpha = 1;
  }
  for(const p of N.pois){
    if(p.k !== "arbre") continue;
    const px = X(p.x), py = Y(p.y) - 34;
    if(px < -90 || py < -90 || px > W + 90 || py > H + 90) continue;
    const s = brTreeCanopy("route", 34, 2);
    const under = Math.hypot(R.x - p.x, R.y - (p.y - 30)) < 56;
    x.globalAlpha = under ? 0.45 : 1;
    if(s) x.drawImage(s, px - s.width, py - s.height, s.width * 2, s.height * 2);
    /* les baies : rondes, brillantes ; elles luisent quand l'une va tomber */
    const ripe = p.cd < 4;
    for(let k = 0; k < 7; k++){ const a = k * 0.95 + 0.4, bx = px + Math.cos(a) * 24, by = py + 4 + Math.sin(a) * 16;
      if(ripe) brGlowAt(x, bx, by, 9, "#ff6a5a", 0.4 + Math.sin(R.t * 6 + k) * 0.2);
      x.fillStyle = "#5a0a0a"; brBlob(x, bx, by + 1, 4.5); x.fillStyle = k % 3 ? "#e8443a" : "#4a7aff"; brBlob(x, bx, by, 4); x.fillStyle = "#ffffff"; x.fillRect(bx - 2, by - 2, 2, 2); }
    x.globalAlpha = 1;
  }
  brAmbient(x, R, X, Y);
  /* obscurité des cavités : on ne voit que ce que la lumière de l'équipe éclaire */
  if((BR_TERRAIN[hab] || {}).dark || R.darkAnom){
    const lr = 190 * (R.buff && R.buff.k === "aimant" ? 1.3 : 1) * (R.turbo > 0 ? 1.25 : 1);
    const fl = 1 + Math.sin(R.t * 7) * 0.012 + Math.sin(R.t * 13) * 0.008;
    const g = x.createRadialGradient(W / 2, H / 2, lr * 0.45 * fl, W / 2, H / 2, lr * 1.5 * fl);
    g.addColorStop(0, "rgba(2,1,6,0)"); g.addColorStop(0.6, "rgba(6,3,10,.6)"); g.addColorStop(1, "rgba(2,1,6,.92)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    /* la lueur chaude de la flamme de l'équipe */
    brGlowAt(x, W / 2, H / 2, lr * 0.8, "#ffb35c", 0.08);
    /* les cristaux brillent dans le noir */
    for(const p of N.pois) if(p.k === "cristal" && !p.used){ const qx = X(p.x), qy = Y(p.y); if(qx > -80 && qy > -80 && qx < W + 80 && qy < H + 80) brGlowAt(x, qx, qy - 20, 70, "#aef4ff", 0.35); }
  }
  /* flèches au bord de l'écran : les quatre lieux utiles les plus proches, pas un de plus */
  const arrows = [];
  for(const p of N.pois){
    if(p.used && (p.k === "cache" || p.k === "autel" || p.k === "captif" || p.k === "souche" || p.k === "cristal")) continue;
    if(p.k === "nid" && p.foe && !p.foe.on) continue;
    const dist = Math.hypot(p.x - R.x, p.y - R.y);
    if(dist > (p.k === "cache" ? 560 : 950)) continue;
    const px = X(p.x), py = Y(p.y);
    if(px > 20 && py > 190 && px < W - 20 && py < H - 20) continue;
    arrows.push({p, px, py, score: dist * (p.k === "cache" ? 2 : 1)});
  }
  arrows.sort((a, b)=>a.score - b.score);
  for(const {p, px, py} of arrows.slice(0, 4)){
    const a = Math.atan2(py - H / 2, px - W / 2);
    const ex = Math.max(22, Math.min(W - 22, W / 2 + Math.cos(a) * W)), ey = Math.max(170, Math.min(H - 22, H / 2 + Math.sin(a) * H));
    const P = BR_POI[p.k];
    x.save(); x.translate(ex, ey);
    x.fillStyle = "rgba(4,8,16,.75)"; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.fill();
    x.strokeStyle = P.c; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 13, 0, 7); x.stroke();
    x.fillStyle = P.c; x.font = "bold 12px ui-monospace,monospace"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(P.g, 0, 1);
    x.rotate(a); x.beginPath(); x.moveTo(17, 0); x.lineTo(11, -5); x.lineTo(11, 5); x.closePath(); x.fill();
    x.restore(); x.textBaseline = "alphabetic";
  }
}
/* le nid : un monticule vivant, son œil, ses vrilles, ses éclats de données */
function brDrawNest(x, R, f, fx, fy){
  const t = R.t + f.phase, pul = 1 + Math.sin(t * 4) * 0.08, s = 32;
  brGlowAt(x, fx, fy - 6, 70 * pul, "#ff3d7f", 0.3);
  x.fillStyle = "rgba(0,0,0,.45)"; x.beginPath(); x.ellipse(fx + 3, fy + 14, 40, 12, 0, 0, 7); x.fill();
  /* les vrilles */
  x.strokeStyle = "#5a0a3a"; x.lineWidth = 3;
  for(let i = 0; i < 6; i++){ const a = i / 6 * 6.28 + 0.3, sw = Math.sin(t * 2 + i) * 0.25;
    x.beginPath(); x.moveTo(fx + Math.cos(a) * 18, fy + 6 + Math.sin(a) * 6);
    x.quadraticCurveTo(fx + Math.cos(a + sw) * 34, fy + 6 + Math.sin(a + sw) * 12 - 8, fx + Math.cos(a + sw * 2) * 46, fy + 8 + Math.sin(a + sw * 2) * 15); x.stroke(); }
  /* le monticule */
  x.fillStyle = "#24081e"; x.beginPath(); x.moveTo(fx - s, fy + 10); x.quadraticCurveTo(fx - s * 0.8, fy - s * 1.1, fx, fy - s * 1.25 * pul); x.quadraticCurveTo(fx + s * 0.8, fy - s * 1.1, fx + s, fy + 10); x.closePath(); x.fill();
  x.fillStyle = "#3a0e30"; x.beginPath(); x.moveTo(fx - s * 0.8, fy + 8); x.quadraticCurveTo(fx - s * 0.6, fy - s * 0.9, fx - 4, fy - s * 1.15 * pul); x.lineTo(fx - 8, fy + 8); x.closePath(); x.fill();
  /* blocs de glitch incrustés */
  for(let i = 0; i < 6; i++){ const bx = fx - 20 + (i * 37) % 40, by = fy - 4 - (i * 23) % 26; x.fillStyle = i % 2 ? "#ff3d7f" : "#35f0d6"; x.globalAlpha = 0.6 + Math.sin(t * 6 + i) * 0.3; x.fillRect(bx, by, 4, 3); }
  x.globalAlpha = 1;
  /* l'œil */
  const ey = fy - s * 0.45;
  x.fillStyle = "#12020e"; x.beginPath(); x.ellipse(fx, ey, 11, 8 * pul, 0, 0, 7); x.fill();
  x.fillStyle = f.flash > 0 ? "#ffffff" : "#ff3d7f"; x.beginPath(); x.ellipse(fx + Math.sin(t) * 2, ey, 5, 6 * pul, 0, 0, 7); x.fill();
  x.fillStyle = "#ffffff"; x.fillRect(fx - 2 + Math.sin(t) * 2, ey - 3, 2, 2);
  /* les éclats qui tournent autour */
  for(let i = 0; i < 4; i++){ const a = t * 1.6 + i * 1.57, ox = fx + Math.cos(a) * 42, oy = fy - 14 + Math.sin(a) * 14;
    x.fillStyle = i % 2 ? "#ff3d7f" : "#b06bff"; x.save(); x.translate(ox, oy); x.rotate(a * 2); x.fillRect(-3, -3, 6, 6); x.restore(); }
  x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(fx - 26, fy + 24, 52, 5);
  x.fillStyle = "#ff3d7f"; x.fillRect(fx - 26, fy + 24, 52 * Math.max(0, f.hp) / f.max, 5);
}

/* ---------- 5. l'ambiance : particules et lumière de chaque habitat ---------- */
const BR_AMB = {
  route:  {n:26, make:(R, a)=>Object.assign(a, {k:R.rng() < 0.2 ? "petal" : "pollen", c:R.rng() < 0.5 ? "#fff6c8" : "#ffe45e", vx:12 + R.rng() * 16, vy:-4 + R.rng() * 8})},
  foret:  {n:30, make:(R, a)=>Object.assign(a, R.rng() < 0.6 ? {k:"fly", c:"#d8ff7a", vx:(R.rng() - .5) * 14, vy:(R.rng() - .5) * 14} : {k:"leaf", c:R.rng() < 0.5 ? "#8a5a26" : "#a8742e", vx:8 + R.rng() * 10, vy:14 + R.rng() * 10})},
  eaux:   {n:26, make:(R, a)=>Object.assign(a, {k:R.rng() < 0.5 ? "glint" : "foam", c:"#e8fbff", vx:6 + R.rng() * 8, vy:2 + R.rng() * 4})},
  grotte: {n:30, make:(R, a)=>Object.assign(a, {k:R.rng() < 0.12 ? "drip" : "dust", c:"#e8d8b8", vx:(R.rng() - .5) * 6, vy:-2 + R.rng() * 5})},
  ruines: {n:24, make:(R, a)=>Object.assign(a, {k:"mote", c:R.rng() < 0.7 ? "#c9a6ff" : "#35f0d6", vx:(R.rng() - .5) * 8, vy:-10 - R.rng() * 14})},
  foyer:  {n:34, make:(R, a)=>Object.assign(a, R.rng() < 0.7 ? {k:"ember", c:R.rng() < 0.5 ? "#ff8a3d" : "#ffd24a", vx:(R.rng() - .5) * 20, vy:-30 - R.rng() * 40} : {k:"ash", c:"#6a625e", vx:6 + R.rng() * 8, vy:12 + R.rng() * 10})}
};
function brAmbient(x, R, X, Y){
  const A = BR_AMB[R.hab] || BR_AMB.route, W = R.W, H = R.H;
  const now = performance.now(), dt = Math.min(0.05, (now - (R.ambLast || now)) / 1000); R.ambLast = now;
  R.amb = R.amb || [];
  const cx = (R.cam || R).x, cy = (R.cam || R).y;
  while(R.amb.length < A.n){ const a = A.make(R, {}); a.x = cx + (R.rng() - .5) * W * 1.2; a.y = cy + (R.rng() - .5) * H * 1.2; a.t = R.rng() * 10; a.life = 4 + R.rng() * 6; R.amb.push(a); }
  x.save();
  for(const a of R.amb){
    a.t += dt; a.life -= dt;
    if(a.k === "fly"){ a.vx += (R.rng() - .5) * 30 * dt; a.vy += (R.rng() - .5) * 30 * dt; a.vx *= 0.98; a.vy *= 0.98; }
    a.x += a.vx * dt; a.y += a.vy * dt;
    let sx = X(a.x), sy = Y(a.y);
    /* hors champ : on le replace de l'autre côté, il ne meurt pas */
    if(a.life <= 0 || sx < -40 || sy < -40 || sx > W + 40 || sy > H + 40){ A.make(R, a); a.x = cx + (R.rng() - .5) * W * 1.1; a.y = cy + (R.rng() - .5) * H * 1.1; a.t = 0; a.life = 4 + R.rng() * 6; continue; }
    const fade = Math.min(1, a.t * 1.5, a.life * 1.5);
    switch(a.k){
      case "pollen": x.globalAlpha = 0.55 * fade; x.fillStyle = a.c; x.fillRect(sx, sy + Math.sin(a.t * 2) * 3, 2, 2); break;
      case "petal": x.globalAlpha = 0.8 * fade; x.fillStyle = "#ffb3dc"; x.save(); x.translate(sx, sy + Math.sin(a.t * 1.5) * 6); x.rotate(a.t * 2); x.fillRect(-2, -1, 4, 2); x.restore(); break;
      case "fly": { const on = (Math.sin(a.t * 2.6 + a.x) + 1) / 2; x.globalAlpha = fade * on; brGlowAt(x, sx, sy, 9, a.c, 0.6 * on * fade); x.fillStyle = "#f4ffc8"; x.fillRect(sx - 1, sy - 1, 2, 2); break; }
      case "leaf": x.globalAlpha = 0.85 * fade; x.fillStyle = a.c; x.save(); x.translate(sx + Math.sin(a.t * 1.8) * 10, sy); x.rotate(Math.sin(a.t * 2.2) * 1.2); x.fillRect(-3, -1, 6, 3); x.restore(); break;
      case "glint": { const tw = Math.sin(a.t * 4 + a.x); if(tw > 0.4){ x.globalAlpha = (tw - 0.4) * 1.6 * fade; x.fillStyle = a.c; x.fillRect(sx - 3, sy, 7, 1); x.fillRect(sx, sy - 3, 1, 7); } break; }
      case "foam": x.globalAlpha = 0.35 * fade; x.fillStyle = a.c; x.fillRect(sx, sy, 3, 1); x.fillRect(sx + 4, sy + 1, 2, 1); break;
      case "dust": x.globalAlpha = 0.35 * fade; x.fillStyle = a.c; x.fillRect(sx, sy + Math.sin(a.t) * 2, 1, 1); break;
      case "drip": { const k = (a.t % 2.2) / 2.2; x.globalAlpha = fade * 0.7; x.fillStyle = "#9fd8ff";
        if(k < 0.7) x.fillRect(sx, sy - 40 + k * 57, 1, 3); else { x.strokeStyle = "#9fd8ff"; x.lineWidth = 1; x.beginPath(); x.ellipse(sx, sy, (k - 0.7) * 30, (k - 0.7) * 10, 0, 0, 7); x.stroke(); } break; }
      case "mote": x.globalAlpha = 0.6 * fade; x.fillStyle = a.c; x.fillRect(sx, sy, 2, 2); x.globalAlpha = 0.2 * fade; x.fillRect(sx - 1, sy + 3, 4, 1); break;
      case "ember": x.globalAlpha = fade * (0.6 + Math.sin(a.t * 9) * 0.3); x.fillStyle = a.c; x.fillRect(sx + Math.sin(a.t * 3) * 4, sy, 2, 2); break;
      case "ash": x.globalAlpha = 0.5 * fade; x.fillStyle = a.c; x.fillRect(sx + Math.sin(a.t * 2) * 5, sy, 2, 1); break;
    }
  }
  x.globalAlpha = 1;
  x.restore();
  brGrade(x, R, W, H);
}
/* la lumière de chaque lieu */
function brGrade(x, R, W, H){
  x.save();
  switch(R.hab){
    case "route": {
      const g = x.createRadialGradient(W * 0.15, H * 0.05, 0, W * 0.15, H * 0.05, Math.max(W, H) * 0.9);
      g.addColorStop(0, "rgba(255,236,170,.13)"); g.addColorStop(1, "rgba(255,236,170,0)");
      x.globalCompositeOperation = "lighter"; x.fillStyle = g; x.fillRect(0, 0, W, H); break; }
    case "foret": {
      /* les rais de lumière qui traversent la canopée */
      x.globalCompositeOperation = "lighter";
      for(let i = 0; i < 4; i++){
        const a = 0.08 + Math.sin(R.t * 0.4 + i * 1.7) * 0.04, x0 = W * (0.1 + i * 0.28) + Math.sin(R.t * 0.1 + i) * 20;
        x.globalAlpha = a; x.fillStyle = "#e8ffb0";
        x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + 40, 0); x.lineTo(x0 + 40 + H * 0.45, H); x.lineTo(x0 + H * 0.45 - 30, H); x.closePath(); x.fill();
      }
      x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.fillStyle = "rgba(10,40,20,.12)"; x.fillRect(0, 0, W, H); break; }
    case "eaux": {
      x.globalCompositeOperation = "lighter";
      for(let i = 0; i < 5; i++){ const px = W * ((i * 0.23 + R.t * 0.012) % 1), py = H * ((i * 0.37 + R.t * 0.008) % 1);
        brGlowAt(x, px, py, 120, "#4fd8ff", 0.06); }
      break; }
    case "ruines": x.fillStyle = "rgba(60,30,90,.12)"; x.fillRect(0, 0, W, H); break;
    case "foyer": {
      const g = x.createLinearGradient(0, H, 0, H * 0.4); g.addColorStop(0, "rgba(255,90,20,.18)"); g.addColorStop(1, "rgba(255,90,20,0)");
      x.globalCompositeOperation = "lighter"; x.fillStyle = g; x.fillRect(0, 0, W, H); break; }
  }
  x.restore();
}
