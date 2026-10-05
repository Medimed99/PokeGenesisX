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
/* meme traitement que les sprites fixes : palette de la faille et contour, ou silhouette blanche */
function brPmdVariant(id, variant){
  const e = brPmdEntry(id);
  if(!e) return null;
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
