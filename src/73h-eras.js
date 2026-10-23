/* ============================================================
   73h — LES APPARENCES D'ÉPOQUE
   Posséder la carte d'un légendaire dans une écriture ancienne
   (1996, 1999, 2002) permet de la lui faire porter, partout où il
   est À SOI : l'équipe, le partenaire de l'accueil, le Pokédex,
   les combats, la Tour, la Brèche, l'Expédition. Les adversaires
   ne changent jamais.

   Deux cas, parce que le jeu dessine ses Pokémon de deux façons :
   · les sprites fixes (Pokédex, combat classique) prennent le vrai
     sprite de l'époque, face et dos — ceux du jeu d'origine ;
   · les sprites animés de Donjon Mystère (Brèche, Expédition, Tour,
     équipe) ne sont PAS redessinés : on garde leur animation et on
     les repeint avec la palette du sprite d'époque. Quatre teintes
     pour 1996 et 1999, réparties dans la même proportion que sur le
     sprite d'origine ; la couleur la plus proche pour 2002.
   ============================================================ */
const ERA_SKINS = ["g1", "g2", "g3"];
const ERA_SKIN_YEAR = {g1:1996, g2:1999, g3:2002};

function skinChoices(id){ return ERA_SKINS.filter(s=>CARD_INDEX[cardKey(s, id)] && cardHas(s, id)); }
/* l'apparence que porte ce légendaire, tant que la carte est là */
function skinOf(id){
  const s = S && S.skins && S.skins[id];
  return s && ERA_SKINS.includes(s) && CARD_INDEX[cardKey(s, id)] && cardHas(s, id) ? s : null;
}
function skinSet(id, s){
  if(!S.skins || typeof S.skins !== "object") S.skins = {};
  if(s && skinChoices(id).includes(s)) S.skins[id] = s; else delete S.skins[id];
  saveSoon();
}
/* la variante de dessin d'un Pokémon : l'apparence d'époque ne vaut que pour les siens,
   et ne recouvre ni le flash d'un coup (« w ») ni les couleurs de la faille (« c ») */
function eraVar(id, base, mine){
  if(!mine || (base !== "n" && base !== "s")) return base;
  const s = skinOf(id);
  return s ? "e" + s : base;
}

/* ---------- les sprites fixes : le vrai sprite de l'époque ----------
   L'élément représente le cadre d'origine du sprite (56 × 56 pour 1996, 32 × 32 pour
   un dos de 1996, 64 × 64 en 2002) ; le sujet détouré y reprend sa place exacte. */
function eraSpriteHtml(id, era, back, cls, attrs){
  const M = CARD_INDEX[cardKey(era, id)];
  const r = M && (back ? M.k : M.m), o = M && (back ? M.ko : M.o);
  if(!r || !o) return null;
  const pc = v => (v * 100).toFixed(3) + "%";
  return `<span class="spr era e-${era} ${cls || ""}" ${attrs || ""}><i style="left:${pc(o[0] / o[2])};top:${pc(o[1] / o[3])};width:${pc(r[3] / o[2])};height:${pc(r[4] / o[3])};${cardBg(r)}"></i></span>`;
}
if(typeof sprite === "function"){
  const _sprite = sprite;
  sprite = function(id, shiny, cls, opts){
    const o = typeof opts === "string" ? {attrs:opts} : (opts || {});
    if(o.skin){
      const era = o.skin === true ? skinOf(id) : o.skin;
      const h = era ? eraSpriteHtml(id, era, !!o.back, cls, o.attrs) : null;
      if(h) return h;
    }
    return _sprite(id, shiny, cls, opts);
  };
}

/* ---------- la palette d'une époque ---------- */
function eraRamp(id, era){
  const M = CARD_INDEX[cardKey(era, id)];
  if(!M || !M.q || !M.q.length) return null;
  return M.q.map(([h, f])=>({c:[parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], f}));
}
/* repeint des pixels RGBA en place */
function eraRecolor(d, id, era){
  const P = eraRamp(id, era); if(!P) return false;
  if(era === "g1" || era === "g2"){
    /* quatre teintes : le pixel prend la teinte qui occupe, sur le sprite d'origine, la même
       tranche de luminosité (le plus sombre devient le contour, le plus clair les reflets) */
    const L = [];
    for(let i = 0; i < d.length; i += 4) if(d[i+3] >= 20) L.push(d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114);
    if(!L.length) return true;
    const sorted = Float32Array.from(L).sort();
    const cut = [];
    let acc = 0;
    for(let k = 0; k < P.length - 1; k++){ acc += P[k].f; cut.push(sorted[Math.min(sorted.length - 1, Math.floor(acc * sorted.length))]); }
    for(let i = 0; i < d.length; i += 4){
      if(d[i+3] < 20) continue;
      const l = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
      let k = 0; while(k < cut.length && l > cut[k]) k++;
      const c = P[k].c; d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2];
      if(d[i+3] < 255) d[i+3] = d[i+3] < 128 ? 0 : 255;     /* pas de demi-teintes en 1996 */
    }
    return true;
  }
  /* 2002 : la couleur la plus proche de la palette du sprite, à l'œil (le vert compte double) */
  const memo = new Map();
  for(let i = 0; i < d.length; i += 4){
    if(d[i+3] < 20) continue;
    const key = (d[i] << 16) | (d[i+1] << 8) | d[i+2];
    let c = memo.get(key);
    if(!c){
      let bd = 1e12;
      for(const p of P){
        const dr = d[i] - p.c[0], dg = d[i+1] - p.c[1], db = d[i+2] - p.c[2];
        const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
        if(dist < bd){ bd = dist; c = p.c; }
      }
      memo.set(key, c);
    }
    d[i] = c[0]; d[i+1] = c[1]; d[i+2] = c[2];
  }
  return true;
}
/* une planche entière, repeinte une fois puis gardée */
function eraSheetOf(base, id, era){
  if(!base) return null;
  const c = document.createElement("canvas");
  c.width = base.naturalWidth || base.width; c.height = base.naturalHeight || base.height;
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(base, 0, 0);
  try { const im = x.getImageData(0, 0, c.width, c.height); if(!eraRecolor(im.data, id, era)) return null; x.putImageData(im, 0, 0); }
  catch(e){ return null; }
  return c;
}
const ERA_SHEETS = {};
if(typeof brPmdVariant === "function"){
  const _brPmdVariant = brPmdVariant;
  brPmdVariant = function(id, variant){
    if(typeof variant === "string" && variant.length === 3 && variant[0] === "e"){
      const era = variant.slice(1), key = id + ":walk:" + era;
      if(ERA_SHEETS[key] !== undefined) return ERA_SHEETS[key] || _brPmdVariant(id, "n");
      const e = brPmdEntry(id); if(!e) return null;
      ERA_SHEETS[key] = eraSheetOf(e.img, id, era);
      return ERA_SHEETS[key] || _brPmdVariant(id, "n");
    }
    return _brPmdVariant(id, variant);
  };
}
if(typeof brAnimSheet === "function"){
  const _brAnimSheet = brAnimSheet;
  brAnimSheet = function(id, anim, variant){
    if(typeof variant === "string" && variant.length === 3 && variant[0] === "e"){
      const era = variant.slice(1), key = id + ":" + anim + ":" + era;
      if(ERA_SHEETS[key]) return ERA_SHEETS[key];
      const base = _brAnimSheet(id, anim, "n"); if(!base) return null;
      const c = eraSheetOf(base, id, era);
      if(c) ERA_SHEETS[key] = c;
      return c || base;
    }
    return _brAnimSheet(id, anim, variant);
  };
}
/* le sprite fixe des canvas (Brèche, Forage) : le vrai sprite d'époque, dans une case de l'atlas */
let ERA_PX = null;
function eraPxAtlas(){
  if(!ERA_PX && typeof Image !== "undefined" && typeof CARD_ATLAS === "object"){ ERA_PX = new Image(); ERA_PX.src = CARD_ATLAS.px.u; }
  return ERA_PX && ERA_PX.complete && ERA_PX.naturalWidth ? ERA_PX : null;
}
if(typeof brSprite === "function"){
  const _brSprite = brSprite;
  brSprite = function(id, variant){
    if(typeof variant === "string" && variant.length === 3 && variant[0] === "e"){
      const era = variant.slice(1), key = id + ":fix:" + era;
      if(ERA_SHEETS[key]) return ERA_SHEETS[key];
      const A = eraPxAtlas(), M = CARD_INDEX[cardKey(era, id)];
      if(!A || !M || !M.o) return _brSprite(id, "n");
      const cell = 64, c = document.createElement("canvas");
      c.width = c.height = cell;
      const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
      const r = M.m, o = M.o, k = cell / Math.max(o[2], o[3]);
      x.drawImage(A, r[1], r[2], r[3], r[4], Math.round(o[0] * k), Math.round(o[1] * k), Math.round(r[3] * k), Math.round(r[4] * k));
      return ERA_SHEETS[key] = c;
    }
    return _brSprite(id, variant);
  };
}

/* ---------- les petits canvas animés (équipe, accueil, Expédition) ---------- */
if(typeof pmdCanvas === "function"){
  const _pmdCanvas = pmdCanvas;
  pmdCanvas = function(id, dir, size, opts){
    const h = _pmdCanvas(id, dir, size, opts);
    const era = opts && opts.mine ? skinOf(id) : null;
    return era ? h.replace("<canvas ", `<canvas data-era="${era}" `) : h;
  };
}
if(typeof pmdFitDraw === "function"){
  const _pmdFitDraw = pmdFitDraw;
  pmdFitDraw = function(x, id, dir, t, W, shiny, era){
    if(!era) return _pmdFitDraw(x, id, dir, t, W, shiny);
    const F = pmdFit(id); if(!F) return false;
    const sheet = brPmdVariant(id, "e" + era); if(!sheet) return false;
    const cw = F.box.x1 - F.box.x0, ch = F.box.y1 - F.box.y0;
    /* un peu plus petit qu'à l'ordinaire : l'aura doit tenir dans la case */
    let sc = Math.min(W * 0.74 / cw, W * 0.76 / ch);
    if(sc >= 2) sc = Math.floor(sc);
    const f = t === null ? 0 : brPmdFrame(id, t);
    const cx = (F.box.x0 + F.box.x1) / 2;
    const dx = Math.round(W / 2 - cx * sc), dy = Math.round(W * 0.93 - F.box.y1 * sc);
    const b = eraBody(id, dx, dy, sc), now = eraNow();
    const draw = () => x.drawImage(sheet, f * F.fw, dir * F.fh, F.fw, F.fh, dx, dy, F.fw * sc, F.fh * sc);
    eraAuraHalo(x, era, b, now);
    eraAuraGlow(x, era, b, now, draw);
    draw();
    eraAuraMotes(x, era, b, now, id);
    return true;
  };
}

/* ============================================================
   L'AURA DES APPARENCES D'ÉPOQUE
   Un Pokémon qui porte une autre époque n'est pas tout à fait
   d'ici : une lueur épouse sa silhouette, à la couleur de sa série
   (os, or, magenta), sur un halo cyan qui respire, et quelques
   fragments de données montent de lui, cyan et magenta.
   Seulement sur ses animations de Donjon Mystère, et seulement
   pour les siens. En effets réduits, la lueur reste, immobile.
   ============================================================ */
const ERA_AURA_C = {g1:"#e8e2cf", g2:"#e0b64a", g3:"#ff3d7f"};
function eraOfV(v){ return typeof v === "string" && v.length === 3 && v[0] === "e" ? v.slice(1) : null; }
function eraNow(){ return (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) / 1000; }
function eraRgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, a).toFixed(3)})`; }
function eraCalm(){ return typeof cardCalm === "function" && cardCalm(); }
/* le corps dans sa case de marche (coin haut-gauche, échelle) : son centre et un rayon */
function eraBody(id, left, top, sc){
  let F = null;
  try { F = typeof pmdFit === "function" ? pmdFit(id) : null; } catch(e){}
  const m = typeof PMD_META !== "undefined" && PMD_META[id] ? PMD_META[id] : [40, 40];
  if(!F) return {x:left + m[0] * sc / 2, y:top + m[1] * sc / 2, r:Math.max(m[0], m[1]) * sc * 0.4};
  return {x:left + (F.box.x0 + F.box.x1) / 2 * sc, y:top + (F.box.y0 + F.box.y1) / 2 * sc,
          r:Math.max(F.box.x1 - F.box.x0, F.box.y1 - F.box.y0) * sc * 0.6};
}
/* derrière : le halo qui respire */
function eraAuraHalo(x, era, b, now){
  const k = eraCalm() ? 1 : 0.8 + 0.2 * Math.sin(now * 1.9);
  const g = x.createRadialGradient(b.x, b.y, b.r * 0.15, b.x, b.y, b.r * 1.3);
  g.addColorStop(0, eraRgba(ERA_AURA_C[era] || "#35f0d6", 0.26 * k));
  g.addColorStop(0.55, eraRgba("#35f0d6", 0.09 * k));
  g.addColorStop(1, eraRgba("#35f0d6", 0));
  x.save();
  x.fillStyle = g;
  x.beginPath(); x.arc(b.x, b.y, b.r * 1.3, 0, Math.PI * 2); x.fill();
  x.restore();
}
/* autour : la lueur qui épouse la silhouette. La même image est dessinée loin hors du cadre ;
   seule son ombre, colorée et floue, retombe à sa place (ombre de canvas : pas de filtre,
   le même rendu sur tous les navigateurs). L'ombre ignore la transformation en cours :
   on lui donne le décalage et le flou en pixels du canvas. */
function eraAuraGlow(x, era, b, now, draw){
  if(!x || typeof x.save !== "function" || !("shadowBlur" in x)) return;
  const k = eraCalm() ? 1 : 0.72 + 0.28 * Math.sin(now * 2.1);
  let ta = 1, tb = 0;
  try { const T = x.getTransform ? x.getTransform() : null; if(T){ ta = T.a; tb = T.b; } } catch(e){}
  const sx = Math.hypot(ta, tb) || 1, OFF = 4096;
  x.save();
  x.translate(-OFF, 0);
  x.shadowOffsetX = OFF * ta;
  x.shadowOffsetY = OFF * tb;
  /* au large, le cyan de l'archive ; au bord du corps, la couleur de sa série */
  x.shadowColor = eraRgba("#35f0d6", 0.7 * k);
  x.shadowBlur = Math.max(4, b.r * 0.34) * sx;
  try { draw(); } catch(e){}
  x.shadowColor = eraRgba(ERA_AURA_C[era] || "#35f0d6", 0.95 * k);
  x.shadowBlur = Math.max(2, b.r * 0.12) * sx;
  try { draw(); } catch(e){}
  x.restore();
}
/* devant : les fragments de données qui montent */
function eraAuraMotes(x, era, b, now, seed){
  if(eraCalm()) return;
  x.save();
  const ga = x.globalAlpha, px = Math.max(2, Math.round(b.r / 11));
  for(let i = 0; i < 8; i++){
    const life = 2.4 + (i % 3) * 0.55, ph = ((now + i * 0.61 + seed * 0.13) % life) / life;
    const ang = i * 2.399 + seed;
    const mx = b.x + Math.cos(ang) * b.r * (0.55 + 0.25 * Math.sin(i * 1.7)) + Math.sin(now * 1.4 + i) * b.r * 0.08;
    const my = b.y + b.r * 0.55 - ph * b.r * 1.5;
    x.globalAlpha = ga * Math.sin(ph * Math.PI) * 0.95;
    x.fillStyle = i % 3 === 0 ? "#ff3d7f" : i % 3 === 1 ? "#35f0d6" : "#e8fffb";
    x.fillRect(Math.round(mx), Math.round(my), px, px);
  }
  x.restore();
}
/* les trois façons dont le jeu dessine un Pokémon animé : la marche, une pose, la Tour */
if(typeof brPmdDraw === "function"){
  const _brPmdDraw = brPmdDraw;
  brPmdDraw = function(x, id, variant, dir, t, cx, cy, size, alpha){
    const era = eraOfV(variant);
    /* les traînées et les fantômes (dessinés en transparence) n'ont pas d'aura */
    if(!era || (alpha !== undefined && alpha < 0.95) || typeof PMD_META === "undefined" || !PMD_META[id] || !brPmdVariant(id, variant))
      return _brPmdDraw.apply(this, arguments);
    const m = PMD_META[id], sc = Math.min(size / 34, size * 2.1 / m[1]);
    const b = eraBody(id, cx - m[0] * sc / 2, cy - m[1] * sc * 0.62, sc), now = eraNow();
    const args = arguments, self = this;
    eraAuraHalo(x, era, b, now);
    eraAuraGlow(x, era, b, now, ()=>_brPmdDraw.apply(self, args));
    const ok = _brPmdDraw.apply(this, arguments);
    eraAuraMotes(x, era, b, now, id);
    return ok;
  };
}
if(typeof brAnimDraw === "function"){
  const _brAnimDraw = brAnimDraw;
  brAnimDraw = function(x, id, anim, variant, dir, t, cx, cy, size, alpha){
    const era = eraOfV(variant);
    if(!era || (alpha !== undefined && alpha < 0.95) || typeof PMD_META === "undefined" || !PMD_META[id] || !brAnimSheet(id, anim, variant))
      return _brAnimDraw.apply(this, arguments);
    const m = PMD_META[id], sc = Math.min(size / 34, size * 2.1 / m[1]);
    const b = eraBody(id, cx - m[0] * sc / 2, cy - m[1] * sc * 0.62, sc), now = eraNow();
    const args = arguments, self = this;
    eraAuraHalo(x, era, b, now);
    eraAuraGlow(x, era, b, now, ()=>_brAnimDraw.apply(self, args));
    const ok = _brAnimDraw.apply(this, arguments);
    eraAuraMotes(x, era, b, now, id);
    return ok;
  };
}
if(typeof sqSprDraw === "function"){
  const _sqSprDraw = sqSprDraw;
  sqSprDraw = function(x, id, anim, V, dir, t, cx, cy, size, loop){
    const era = eraOfV(V);
    if(!era || typeof PMD_META === "undefined" || !PMD_META[id]) return _sqSprDraw.apply(this, arguments);
    const ready = anim === "walk" ? brPmdVariant(id, V) : (typeof sqHasAnim === "function" && sqHasAnim(id, anim) && brAnimSheet(id, anim, V));
    if(!ready) return _sqSprDraw.apply(this, arguments);
    const wm = PMD_META[id], sc = Math.min(size / 34, size * 2.1 / wm[1]);
    const ft = typeof sqFeet === "function" ? sqFeet(id) : null, feet = ft ? ft.feet : wm[1] * 0.3, ccy = cy - feet * sc;
    const b = eraBody(id, cx - wm[0] * sc / 2, ccy - wm[1] * sc / 2, sc), now = eraNow();
    const args = arguments, self = this;
    eraAuraHalo(x, era, b, now);
    eraAuraGlow(x, era, b, now, ()=>_sqSprDraw.apply(self, args));
    const ok = _sqSprDraw.apply(this, arguments);
    eraAuraMotes(x, era, b, now, id);
    return ok;
  };
}

/* ---------- le choix : au Pokédex, et sur la carte agrandie ---------- */
function skinRowHtml(id){
  const ch = skinChoices(id);
  if(!ch.length || !S.dex[id]) return "";
  const cur = skinOf(id);
  return `<div class="skin-row">
    <div class="row between"><b class="tiny">APPARENCE</b><span class="tiny dim">${cur ? "style " + ERA_SKIN_YEAR[cur] : "style d'aujourd'hui"}</span></div>
    <div class="skin-chips">
      <button class="chip ${cur ? "" : "on"}" data-act="skinset" data-id="${id}" data-s="">Aujourd'hui</button>
      ${ch.map(s=>`<button class="chip skin-${s} ${cur === s ? "on" : ""}" data-act="skinset" data-id="${id}" data-s="${s}">
        <span class="skin-ic">${eraSpriteHtml(id, s, false, "") || ""}</span>${ERA_SKIN_YEAR[s]}</button>`).join("")}
    </div>
    <div class="tiny dim">Tes cartes anciennes de ${esc(POKE[id].name)} lui donnent l'apparence de leur époque, dans ton équipe
      comme au Pokédex. Seul le tien change : les adversaires gardent leur apparence.</div>
  </div>`;
}
ACTIONS.skinset = d => {
  const id = +d.id;
  skinSet(id, d.s || null);
  try { Sfx.click(); } catch(e){}
  if(d.from === "zoom"){ ACTIONS.cardzoom({s:d.zs, id}); return; }
  ACTIONS.dexopen({id});
};
/* sur la carte agrandie d'une écriture ancienne : la porter, ou la retirer */
function skinZoomHtml(series, id){
  if(!ERA_SKINS.includes(series) || !cardHas(series, id) || !S.dex[id]) return "";
  const on = skinOf(id) === series;
  return `<button class="btn ${on ? "ghost" : ""} wide skin-zoom" data-act="skinset" data-from="zoom" data-zs="${series}" data-id="${id}" data-s="${on ? "" : series}">
    ${on ? `${esc(POKE[id].name)} a cette apparence · la retirer` : `Donner cette apparence à ${esc(POKE[id].name)}`}</button>`;
}
