/* ============================================================
   59p — LA BRÈCHE · SPRITES DE MARCHE (Pokémon Donjon Mystère)
   Les sprites « dans le donjon », pas les portraits : 8 directions,
   plusieurs images de marche, le rythme propre a chaque espece.
   Source : PMDCollab / SpriteCollab (CC BY-NC 4.0, credits aux
   artistes). Rangees : bas, bas-droite, droite, haut-droite, haut,
   haut-gauche, gauche, bas-gauche.

   Chaque planche est declinee comme les sprites fixes : normale
   (l'equipe), corrompue (la horde), blanche (le flash d'un coup).
   Tant qu'une planche n'est pas chargee, on dessine le sprite fixe :
   rien n'attend jamais le reseau.
   ============================================================ */
const BR_PMD = {};
function brPmdEntry(id){
  if(typeof PMD_META === "undefined" || !PMD_META[id]) return null;
  let e = BR_PMD[id];
  if(!e){
    e = BR_PMD[id] = {img:new Image(), v:{}, bad:false};
    e.img.onerror = () => { e.bad = true; };
    e.img.src = (typeof PMD_IMG !== "undefined" && PMD_IMG[id])
      || ((typeof PMD_BASE !== "undefined" ? PMD_BASE : "assets/pmd/") + id + ".png");
  }
  if(e.bad || !e.img.complete || !e.img.naturalWidth) return null;
  return e;
}
/* ============================================================
   CHROMATIQUE — les planches PMD n'existent qu'en couleurs normales.
   On apprend la palette chromatique de l'espèce en comparant, pixel
   à pixel, son sprite normal et son sprite chromatique de l'atlas
   (même dessin, autres couleurs), puis on décale chaque pixel de la
   planche du même écart que la couleur la plus proche : les ombres
   et les reflets propres à la planche sont conservés.
   ============================================================ */
const BR_SHINY_MAP = {};
function brHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if(mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function brRgb(h, s, l){
  if(!s){ const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t % 1 + 1) % 1; return t < 1/6 ? p + (q - p) * 6 * t : t < 1/2 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p; };
  return [Math.round(f(h + 1/3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1/3) * 255)];
}
function brShinyMap(id){
  if(BR_SHINY_MAP[id] !== undefined) return BR_SHINY_MAP[id];
  if(typeof brAtlasReady !== "function" || !brAtlasReady() || !brShinyAtlasReady()) return null;   /* pas encore : on réessaiera */
  const A = brAtlas(), B = brShinyAtlas(), idx = atlasIndex(id, false);
  if(idx < 0 || A.src === B.src) return BR_SHINY_MAP[id] = false;
  const cell = Math.round(A.naturalWidth / ATLAS_COLS);
  const grab = img => { const c = document.createElement("canvas"); c.width = c.height = cell;
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
    x.drawImage(img, (idx % ATLAS_COLS) * cell, Math.floor(idx / ATLAS_COLS) * cell, cell, cell, 0, 0, cell, cell);
    return x.getImageData(0, 0, cell, cell).data; };
  let a, b;
  try { a = grab(A); b = grab(B); } catch(e){ return BR_SHINY_MAP[id] = false; }
  const tally = new Map();
  for(let i = 0; i < a.length; i += 4){
    if(a[i+3] < 60 || b[i+3] < 60) continue;
    const kn = (a[i] << 16) | (a[i+1] << 8) | a[i+2], ks = (b[i] << 16) | (b[i+1] << 8) | b[i+2];
    let t = tally.get(kn); if(!t){ t = new Map(); tally.set(kn, t); }
    t.set(ks, (t.get(ks) || 0) + 1);
  }
  let pairs = [], changed = 0;
  for(const [kn, t] of tally){
    let best = 0, bn = 0, tot = 0;
    for(const [ks, n] of t){ tot += n; if(n > bn){ bn = n; best = ks; } }
    const N = [kn >> 16, (kn >> 8) & 255, kn & 255], Sh = [best >> 16, (best >> 8) & 255, best & 255];
    if(Math.abs(N[0] - Sh[0]) + Math.abs(N[1] - Sh[1]) + Math.abs(N[2] - Sh[2]) > 24) changed += tot;
    pairs.push({n:brHsl(N[0], N[1], N[2]), s:brHsl(Sh[0], Sh[1], Sh[2]), w:tot});
  }
  /* les couleurs de bord (quelques pixels) brouillent la correspondance */
  const solid = pairs.filter(p=>p.w >= 3);
  if(solid.length >= 3) pairs = solid;
  return BR_SHINY_MAP[id] = changed > 0 && pairs.length ? pairs : false;
}
/* recolore des pixels RGBA en place ; faux si l'espèce n'a pas de palette chromatique connue.
   La correspondance se fait par teinte (les planches PMD n'ont pas la même palette que
   l'atlas), et la transformation est relative : décalage de teinte, rapport de saturation,
   lumière rapprochée du noir ou du blanc dans la même proportion. */
function brShinyRecolor(d, id){
  const P = brShinyMap(id); if(!P) return false;
  const memo = new Map();
  for(let i = 0; i < d.length; i += 4){
    if(d[i+3] < 20) continue;
    const k = (d[i] << 16) | (d[i+1] << 8) | d[i+2];
    let o = memo.get(k);
    if(o === undefined){
      const [h, sa, l] = brHsl(d[i], d[i+1], d[i+2]);
      let best = P[0], bd = 1e12;
      for(const p of P){
        let dh = Math.abs(h - p.n[0]); if(dh > 0.5) dh = 1 - dh;
        const dist = dh * dh * 16 * Math.min(sa, p.n[1]) + (sa - p.n[1]) * (sa - p.n[1]) + (l - p.n[2]) * (l - p.n[2]) * 2.2 - Math.log(1 + p.w) * 0.002;
        if(dist < bd){ bd = dist; best = p; }
      }
      const n = best.n, t = best.s;
      const grey = n[1] < 0.1;
      const h2 = grey ? t[0] : h + (t[0] - n[0]);
      const s2 = Math.max(0, Math.min(1, grey ? t[1] : sa * t[1] / n[1]));
      const l2 = Math.max(0, Math.min(1, t[2] <= n[2] ? (n[2] > 0.01 ? l * t[2] / n[2] : t[2])
                                                    : l + (t[2] - n[2]) * (1 - l) / Math.max(0.01, 1 - n[2])));
      const c = brRgb(h2, s2, l2);
      o = (c[0] << 16) | (c[1] << 8) | c[2];
      memo.set(k, o);
    }
    d[i] = o >> 16; d[i+1] = (o >> 8) & 255; d[i+2] = o & 255;
  }
  return true;
}
/* une planche entière en chromatique : null tant que la palette n'est pas prête (on dessine alors le sprite fixe) */
function brShinySheet(img, id, cache){
  if(cache.s) return cache.s === "none" ? null : cache.s;
  const P = brShinyMap(id);
  if(P === null) return null;
  if(P === false){ cache.s = "none"; return null; }
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0);
  try { const im = x.getImageData(0, 0, c.width, c.height); brShinyRecolor(im.data, id); x.putImageData(im, 0, 0); }
  catch(e){ cache.s = "none"; return null; }
  return cache.s = c;
}

/* meme traitement que les sprites fixes : palette de la faille et contour, ou silhouette blanche */
function brPmdVariant(id, variant){
  const e = brPmdEntry(id);
  if(!e) return null;
  if(variant === "s") return brShinySheet(e.img, id, e.v);
  if(e.v[variant]) return e.v[variant];
  const c = document.createElement("canvas");
  c.width = e.img.naturalWidth; c.height = e.img.naturalHeight;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  x.drawImage(e.img, 0, 0);
  if(variant !== "n"){
    try {
      const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
      for(let i = 0; i < d.length; i += 4){
        if(d[i+3] < 20) continue;
        if(variant === "w"){ d[i] = d[i+1] = d[i+2] = 255; continue; }
        const r = d[i], g = d[i+1], b = d[i+2];
        const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
        const p = BR_CORRUPT[Math.min(3, Math.floor(l * 4))];
        d[i] = Math.round(r * 0.35 + p[0] * 0.65); d[i+1] = Math.round(g * 0.35 + p[1] * 0.65); d[i+2] = Math.round(b * 0.35 + p[2] * 0.65);
      }
      x.putImageData(img, 0, 0);
    } catch(err){ e.bad = true; return null; }     /* image refusee par le navigateur : sprite fixe */
    if(variant === "c"){
      const o = document.createElement("canvas");
      o.width = c.width; o.height = c.height;
      const ox = o.getContext("2d");
      ox.imageSmoothingEnabled = false;
      for(const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) ox.drawImage(c, dx, dy);
      ox.globalCompositeOperation = "source-in"; ox.fillStyle = "#12041c"; ox.fillRect(0, 0, o.width, o.height);
      ox.globalCompositeOperation = "source-over"; ox.drawImage(c, 0, 0);
      e.v[variant] = o; return o;
    }
  }
  e.v[variant] = c;
  return c;
}
/* 8 directions : l'ordre des rangees PMD, depuis un vecteur de deplacement (y vers le bas) */
function brDir8(dx, dy, prev){
  if(!dx && !dy) return prev || 0;
  const a = Math.atan2(dy, dx) * 180 / Math.PI;
  return ((Math.round((90 - a) / 45) % 8) + 8) % 8;
}
/* l'image de marche au temps t (les durees PMD sont en images a 60 Hz) */
function brPmdFrame(id, t){
  const m = PMD_META[id], dur = m[3];
  let total = 0; for(const d of dur) total += d;
  let k = Math.floor(t * 60) % total;
  for(let i = 0; i < dur.length; i++){ if(k < dur[i]) return i; k -= dur[i]; }
  return 0;
}
/* dessine un Pokemon en marche ; renvoie faux si la planche n'est pas prete */
function brPmdDraw(x, id, variant, dir, t, cx, cy, size, alpha){
  const sheet = brPmdVariant(id, variant);
  if(!sheet) return false;
  const m = PMD_META[id], fw = m[0], fh = m[1];
  const f = t === null ? 0 : brPmdFrame(id, t);
  /* taille relative conservee (Rayquaza reste plus grand que Pikachu), mais plafonnee :
     un tres grand Pokemon ne doit jamais masquer l'action */
  const sc = Math.min(size / 34, size * 2.1 / fh);
  const w = fw * sc, h = fh * sc;
  if(alpha !== undefined) x.globalAlpha = alpha;
  x.drawImage(sheet, f * fw, dir * fh, fw, fh, cx - w / 2, cy - h * 0.62, w, h);
  if(alpha !== undefined) x.globalAlpha = 1;
  return true;
}
