/* ============================================================
   L'EXPÉDITION EN 3D · LE SECTEUR
   La carte d'un secteur, en volume : le même terrain en pixel art que
   sur mobile (51m, peint une fois) devient le sol d'une maquette ; le
   treillis de lieux s'y pose à sa place, chaque lieu sur son socle,
   avec ce qu'on y trouvera, en voxels tirés des dessins du jeu
   mobile (les hautes herbes, le Centre Pokémon, la Boutique, le sac,
   le « ? », les dresseurs de la carte) ; les sentiers sont des
   pointillés au sol, éclairés quand ils sont encore possibles.
   Autour, le décor du biome (arbres, sapins, rochers, palmiers, lave,
   blocs de la faille), et l'équipe en vrais modèles.
   Le jeu mobile reste seul juge : on lit S.expedition, on montre.
   ============================================================ */
import * as THREE from "three";
import { makeMon, preloadMon } from "../mon/model3d.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const TAU = Math.PI * 2;
export const XS = 0.055;                       /* mètres par pixel de la carte mobile */
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
function rng(seed){ let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:0.85, metalness:0, flatShading:true}, o));

/* la lumière et le temps de chaque biome */
export const BIOME3D = {
  prairie: {sky:["#6fb8ec", "#d8f0ff"], fog:["#d0e8f6", 0.011], hemi:["#ffffff", "#5a8a4a", 1.05], sun:["#fff2dc", 2.1], exp:1.05, deco:"tree", leaf:"#4f9a3c", trunk:"#6a4a2a", base:"#70c048"},
  foret:   {sky:["#4f98c4", "#c6e6d6"], fog:["#a8c8b0", 0.018], hemi:["#e8ffe8", "#2f5a24", 0.95], sun:["#fff0d0", 1.8], exp:1.05, deco:"tree", leaf:"#2f6e24", trunk:"#4a3020", base:"#4a9238"},
  grotte:  {sky:["#1c140e", "#3e2e20"], fog:["#2e2218", 0.03], hemi:["#e8d0b0", "#2a1c10", 0.95], sun:["#ffd8a0", 1.3], exp:1.15, deco:"rock", base:"#a98158"},
  plage:   {sky:["#4cb2ee", "#e8f8ff"], fog:["#d8f0ff", 0.009], hemi:["#ffffff", "#c8b478", 1.1], sun:["#fff8e8", 2.3], exp:1.0, deco:"palm", base:"#e4d398", water:"#58a8e8"},
  neige:   {sky:["#98bce0", "#f0f6ff"], fog:["#e8f0f8", 0.018], hemi:["#ffffff", "#a8c0d8", 1.05], sun:["#f8fbff", 1.8], exp:1.0, deco:"pine", base:"#e0eaf4"},
  volcan:  {sky:["#200a06", "#6a2410"], fog:["#4a1c12", 0.026], hemi:["#ffc8a0", "#2a1008", 0.85], sun:["#ffb070", 1.5], exp:1.15, deco:"lava", base:"#614435"},
  centrale:{sky:["#5a6270", "#b8c0cc"], fog:["#8a929c", 0.018], hemi:["#f0f4ff", "#3a3e46", 1.0], sun:["#ffffff", 1.7], exp:1.05, deco:"rock", base:"#838892"},
  faille:  {sky:["#08030f", "#2a1446"], fog:["#1a0c2e", 0.026], hemi:["#c8a8ff", "#120820", 0.95], sun:["#e8d0ff", 1.2], exp:1.15, deco:"glitch", base:"#22173a"}
};

/* ============================================================
   DES PIXELS EN CUBES
   ============================================================ */
/* une figurine : chaque pixel allumé devient un cube (une seule instance de dessin) */
function voxFigure(w, h, colorAt, px, depth, o = {}){
  const list = [];
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const c = colorAt(x, y); if(c) list.push([x, y, c]); }
  const mat = std("#ffffff", {roughness:0.7});
  if(o.glow){ mat.emissive = new THREE.Color("#ffffff"); mat.emissiveIntensity = o.glow;
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor;"); }; }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, Math.max(1, list.length));
  list.forEach(([x, y, c], i)=>{
    _m.compose(V1.set((x - w / 2 + 0.5) * px, (h - y - 0.5) * px, 0), _q.identity(), _s.set(px, px, px * depth));
    im.setMatrixAt(i, _m); im.setColorAt(i, _c.set(c));
  });
  im.count = list.length; im.castShadow = true; im.receiveShadow = true;
  return im;
}
/* une icône du jeu mobile (XPX_ART : grille de lettres et palette) */
function xpxFigure(name, px, depth, o){
  const A = (ref("XPX_ART") || {})[name]; if(!A) return null;
  const h = A.d.length, w = A.d[0].length;
  return voxFigure(w, h, (x, y)=>A.p[A.d[y][x]] || null, px, depth, o);
}
/* un personnage de la carte (planche OW_ATLAS : 16 × 32 par classe) */
let OW_IMG = null, OW_DATA = null;
function owReady(){
  if(OW_DATA) return true;
  if(!OW_IMG){ OW_IMG = new Image(); OW_IMG.src = ref("OW_ATLAS") || ""; }
  if(!OW_IMG.complete || !OW_IMG.naturalWidth) return false;
  const c = document.createElement("canvas"); c.width = OW_IMG.naturalWidth; c.height = OW_IMG.naturalHeight;
  const x = c.getContext("2d", {willReadFrequently:true}); x.drawImage(OW_IMG, 0, 0);
  OW_DATA = x.getImageData(0, 0, c.width, c.height); return true;
}
function owFigure(cls, px, depth, sil){
  if(!owReady()) return null;
  const C = ref("OW_CLASSES") || [], i = Math.max(0, C.indexOf(cls)), D = OW_DATA;
  return voxFigure(16, 32, (x, y)=>{
    const k = ((y * D.width) + i * 16 + x) * 4; if(D.data[k + 3] < 40) return null;
    return sil ? "#1a1424" : `rgb(${D.data[k]},${D.data[k + 1]},${D.data[k + 2]})`;
  }, px, depth);
}

/* ============================================================
   LE SECTEUR
   ============================================================ */
export class Sector {
  constructor(scene, run){
    this.scene = scene; this.run = run; this.key = Sector.keyOf(run);
    this.g = new THREE.Group(); scene.add(this.g);
    this.nodes = []; this.pending = []; this.anim = [];
    this.biome = BIOME3D[run.biome] || BIOME3D.prairie;
    this.build(run);
  }
  static keyOf(run){ return run ? (run.seed || 0) + ":" + (run.mapIdx || 0) + ":" + (run.biome || "") : ""; }
  /* la géométrie de la carte mobile (xmapGeom), en mètres : la porte près de nous, le Champion au fond */
  geom(run){
    const Gm = ref("xmapGeom")(run), W2 = 360;
    this.W3 = W2 * XS; this.H3 = Gm.H * XS;
    this.X = c => ((c + 0.5) / 4 * W2 - W2 / 2) * XS;
    this.Z = y => -Gm.Y(y) * XS;
    this.door = new THREE.Vector3(0, 0, -((ref("XMAP") || {TOP:132}).TOP - 58) * XS);
  }
  build(run){
    this.geom(run);
    const g = this.g, B = this.biome, R = rng((run.seed || 1) + (run.mapIdx || 0) * 977);
    /* le sol : le terrain peint par le jeu mobile, puis un grand sol autour */
    const cv = document.createElement("canvas");
    try { ref("xmapPaint")(cv, run); } catch(e){ cv.width = cv.height = 8; }
    const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(this.W3, this.H3).rotateX(-Math.PI / 2), std("#ffffff", {map:tex, flatShading:false, roughness:1}));
    ground.position.set(0, 0, -this.H3 / 2); ground.receiveShadow = true; g.add(ground);
    const base = new THREE.Mesh(new THREE.PlaneGeometry(260, 260).rotateX(-Math.PI / 2), std(B.base, {flatShading:false, roughness:1}));
    base.material.color.multiplyScalar(0.82); base.position.set(0, -0.02, -this.H3 / 2); base.receiveShadow = true; g.add(base);
    /* le bord de la maquette : une marche de terre */
    const rimM = std(B.deco === "glitch" ? "#2a1a46" : B.deco === "lava" ? "#3a261e" : B.deco === "pine" ? "#a8bccf" : "#7a5a3a");
    for(const s of [-1, 1]){ const r = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, this.H3), rimM); r.position.set(s * (this.W3 / 2 + 0.15), 0.06, -this.H3 / 2); r.receiveShadow = true; g.add(r); }
    if(B.water){ const w = new THREE.Mesh(new THREE.PlaneGeometry(60, this.H3 + 60).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({color:B.water, roughness:0.15, metalness:0.1, transparent:true, opacity:0.92}));
      w.position.set(this.W3 / 2 + 34, 0.03, -this.H3 / 2); g.add(w); }
    this.decor(g, B, R);
    this.gate(g, B);
    this.paths(run);
    run.map.forEach((row, y)=>row.forEach((n, i)=>this.node(run, n, y, i)));
    /* le Champion, au bout : sa silhouette attend derrière la dernière ligne */
  }
  /* ---------- le décor du biome, de part et d'autre de la carte ---------- */
  decor(g, B, R){
    const spots = [];
    for(let i = 0; i < 150; i++){
      const side = R() < 0.5 ? -1 : 1, x = side * (this.W3 / 2 + 1.2 + Math.pow(R(), 1.6) * 22), z = 8 - R() * (this.H3 + 26);
      spots.push([x, z, 0.7 + R() * 0.8, R() * TAU]);
    }
    for(let i = 0; i < 30; i++) spots.push([(R() - 0.5) * 50, -this.H3 - 4 - R() * 14, 0.8 + R() * 0.9, R() * TAU]);
    const n = spots.length, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
    const put = (geo, mat, f) => { const im = new THREE.InstancedMesh(geo, mat, n); spots.forEach((s, i)=>{ f(s, P, Q, S); M.compose(P, Q, S); im.setMatrixAt(i, M); }); im.castShadow = true; im.receiveShadow = true; g.add(im); return im; };
    if(B.deco === "tree"){
      put(new THREE.CylinderGeometry(0.18, 0.26, 1, 6).translate(0, 0.5, 0), std(B.trunk), ([x, z, s], P, Q, S)=>{ P.set(x, 0, z); Q.identity(); S.set(s, s * 1.6, s); });
      put(new THREE.IcosahedronGeometry(1, 0), std(B.leaf), ([x, z, s, r], P, Q, S)=>{ P.set(x, s * 2.3, z); Q.setFromEuler(new THREE.Euler(0, r, 0)); S.set(s * 1.25, s * 1.1, s * 1.25); });
    } else if(B.deco === "pine"){
      put(new THREE.CylinderGeometry(0.14, 0.2, 1, 6).translate(0, 0.5, 0), std("#5a3a22"), ([x, z, s], P, Q, S)=>{ P.set(x, 0, z); Q.identity(); S.set(s, s * 0.9, s); });
      put(new THREE.ConeGeometry(1, 2.4, 7).translate(0, 1.2, 0), std("#2d5a46"), ([x, z, s, r], P, Q, S)=>{ P.set(x, s * 0.7, z); Q.setFromEuler(new THREE.Euler(0, r, 0)); S.set(s, s * 1.2, s); });
      put(new THREE.ConeGeometry(0.6, 1, 7).translate(0, 0.5, 0), std("#f4f8fc"), ([x, z, s], P, Q, S)=>{ P.set(x, s * 3.0, z); Q.identity(); S.set(s, s * 0.8, s); });
    } else if(B.deco === "palm"){
      put(new THREE.CylinderGeometry(0.12, 0.18, 1, 6).translate(0, 0.5, 0), std("#9a6a3a"), ([x, z, s], P, Q, S)=>{ P.set(x, 0, z); Q.setFromEuler(new THREE.Euler(0.12, 0, 0.1)); S.set(s, s * 3, s); });
      put(new THREE.ConeGeometry(1.6, 0.5, 6), std("#3f9a4a"), ([x, z, s, r], P, Q, S)=>{ P.set(x + 0.3 * s, s * 3.05, z + 0.35 * s); Q.setFromEuler(new THREE.Euler(0, r, 0)); S.set(s, s, s); });
    } else if(B.deco === "rock" || B.deco === "lava"){
      put(new THREE.DodecahedronGeometry(1, 0), std(B.deco === "lava" ? "#3a261e" : "#8a6a4a"), ([x, z, s, r], P, Q, S)=>{ P.set(x, s * 0.35, z); Q.setFromEuler(new THREE.Euler(r, r * 2, 0)); S.set(s * 1.3, s * 0.9, s * 1.1); });
      if(B.deco === "lava"){
        const lv = new THREE.MeshBasicMaterial({color:"#ff6a2a", toneMapped:false});
        for(let i = 0; i < 14; i++){ const p = new THREE.Mesh(new THREE.CircleGeometry(0.8 + R() * 1.6, 10).rotateX(-Math.PI / 2), lv); p.position.set((R() < 0.5 ? -1 : 1) * (this.W3 / 2 + 3 + R() * 12), 0.03, -R() * this.H3); g.add(p); }
        const L = new THREE.PointLight("#ff6a2a", 30, 26, 1.4); L.position.set(-this.W3 / 2 - 6, 2, -this.H3 * 0.4); g.add(L);
      }
    } else if(B.deco === "glitch"){
      const gm = new THREE.MeshStandardMaterial({roughness:0.5, emissive:"#ff3d7f", emissiveIntensity:0.5});
      put(new THREE.BoxGeometry(1, 1, 1), gm, ([x, z, s, r], P, Q, S)=>{ P.set(x, 0.5 + s * 1.6, z); Q.setFromEuler(new THREE.Euler(r, r, 0)); S.setScalar(s * 0.9); });
    }
  }
  /* ---------- la porte d'entrée du secteur ---------- */
  gate(g, B){
    const m = std(B.deco === "glitch" ? "#3a2a5a" : "#6a5a4a"), d = this.door;
    for(const s of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, 0.35), m); p.position.set(d.x + s * 1.6, 1.2, d.z + 0.6); p.castShadow = true; g.add(p); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 0.45), m); top.position.set(d.x, 2.5, d.z + 0.6); top.castShadow = true; g.add(top);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.08), std("#e8e0b8")); sign.position.set(d.x, 2.05, d.z + 0.86); g.add(sign);
  }
  /* ---------- les sentiers : des pointillés au sol ---------- */
  paths(run){
    const segs = [];
    const add = (a, b, key) => { segs.push({a, b, key}); };
    run.map.forEach((row, y)=>row.forEach((n, i)=>{ if(y < run.map.length - 1) for(const j of n.next) add(new THREE.Vector3(this.X(n.c), 0, this.Z(y)), new THREE.Vector3(this.X(run.map[y + 1][j].c), 0, this.Z(y + 1)), [y, i, y + 1, j]); }));
    run.map[0].forEach((n, i)=>add(this.door.clone(), new THREE.Vector3(this.X(n.c), 0, this.Z(0)), [-1, -1, 0, i]));
    let total = 0; const step = 0.42;
    for(const s of segs){ s.len = s.a.distanceTo(s.b); s.n = Math.max(1, Math.floor((s.len - 1.6) / step)); total += s.n; }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), new THREE.MeshBasicMaterial({toneMapped:false}), total);
    let k = 0;
    for(const s of segs){
      s.i0 = k;
      const dir = V1.subVectors(s.b, s.a).normalize(), ang = Math.atan2(dir.x, dir.z);
      for(let q = 0; q < s.n; q++){
        const d = 0.8 + (q + 0.5) * ((s.len - 1.6) / s.n);
        _m.compose(V2.copy(s.a).addScaledVector(dir, d).setY(0.03), _q.setFromAxisAngle(UPV, ang), _s.set(1, 1, 1.25));
        im.setMatrixAt(k, _m); im.setColorAt(k, _c.set("#ffffff")); k++;
      }
    }
    im.count = k; this.g.add(im);
    this.dash = im; this.segs = segs;
  }
  /* ---------- un lieu : son socle, ce qu'on y trouve ---------- */
  node(run, n, y, i){
    const x = this.X(n.c), z = this.Z(y), g = new THREE.Group(); g.position.set(x, 0, z); this.g.add(g);
    const big = n.t === "champ" || n.t === "boss";
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(big ? 1.9 : 1.0, big ? 2.1 : 1.12, 0.22, 24), std(big ? "#5a4a6a" : "#8a8070", {flatShading:false}));
    ped.position.y = 0.11; ped.receiveShadow = true; ped.castShadow = true; g.add(ped);
    const ringM = new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, opacity:0, toneMapped:false, depthWrite:false});
    const ring = new THREE.Mesh(new THREE.RingGeometry(big ? 2.15 : 1.18, big ? 2.4 : 1.36, 40).rotateX(-Math.PI / 2), ringM); ring.position.y = 0.24; g.add(ring);
    const rec = {n, y, i, g, ped, ring, fig:null, figY:0.22, mats:[], t:n.t, big, pick:ped};
    this.nodes.push(rec);
    this.figure(run, rec);
  }
  figure(run, rec){
    const n = rec.n, add = (o, y = 0.22) => { if(!o) return null; o.position.y = y; rec.g.add(o); rec.fig = rec.fig || o; o.traverse(c=>{ if(c.material) rec.mats.push(c.material); }); return o; };
    const TR = ref("TRAINERS") || [], col = ref("arCol") || (()=>"#35f0d6");
    switch(n.t){
      case "fight": {
        const a = xpxFigure("grass", 0.085, 3), b = xpxFigure("grass", 0.07, 3);
        if(a){ add(a); a.position.x = -0.25; }
        if(b){ add(b); b.position.set(0.45, 0.22, 0.35); b.rotation.y = 0.5; }
        break;
      }
      case "trainer": case "elite": case "champ": {
        /* les personnages viennent de la planche du jeu mobile : on attend qu'elle soit lue */
        const cls = n.t === "champ" ? (run.leader ? run.leader.k : "brock") : (ref("owClassOf") || (()=>"youngster"))(n);
        const sil = n.t === "champ", px = n.t === "champ" ? 0.085 : 0.062;
        const make = () => { const f = owFigure(cls, px, 3, sil); if(!f) return false; add(f); if(sil){ const q = xpxFigure("ask", 0.07, 2, {glow:0.6}); if(q){ add(q, 2.95); rec.spin = q; } } return true; };
        if(!make()) this.pending.push(make);
        const c = n.t === "trainer" && n.tr !== undefined && TR[n.tr] ? col(TR[n.tr].t) : n.t === "elite" ? "#ff3d7f" : "#ffc857";
        rec.tag = c;
        if(n.t === "champ"){
          /* l'arène du Champion : quatre colonnes autour du socle */
          const pm = std("#d8c8a0");
          for(let k = 0; k < 4; k++){ const a = k / 4 * TAU + Math.PI / 4, p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 2.2, 8), pm); p.position.set(Math.cos(a) * 1.75, 1.1, Math.sin(a) * 1.75); p.castShadow = true; rec.g.add(p); }
        }
        break;
      }
      case "boss": {
        const m = new THREE.MeshStandardMaterial({color:"#ff3d7f", emissive:"#ff3d7f", emissiveIntensity:0.8, roughness:0.2, metalness:0.3, flatShading:true});
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), m); c.scale.y = 1.6; add(c, 1.9); rec.spin = c;
        const L = new THREE.PointLight("#ff3d7f", 8, 9, 1.4); L.position.y = 2; rec.g.add(L);
        break;
      }
      case "draft": {
        const b = new THREE.Group(), s = 0.32;
        const top = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8, 0, TAU, 0, Math.PI / 2), std("#d8283a", {flatShading:false, roughness:0.35}));
        const bot = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), std("#f2f0ea", {flatShading:false, roughness:0.35}));
        const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.01, s * 1.01, s * 0.16, 16), std("#1a1a1a"));
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.3, s * 0.12, 12).rotateX(Math.PI / 2).translate(0, 0, s * 0.98), std("#f2f0ea"));
        for(const p of [top, bot, band, btn]){ p.castShadow = true; b.add(p); }
        for(let k = 0; k < 3; k++){ const c = b.clone(); c.position.set((k - 1) * 0.6, 0, k === 1 ? -0.25 : 0.1); add(c, 0.22 + s); if(k === 1) rec.bob = c; }
        break;
      }
      case "swap": {
        const m = std("#9b6bff", {emissive:"#6a3ad8", emissiveIntensity:0.4});
        const a = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 8, 20), m), b = a.clone(); b.rotation.y = Math.PI / 2; b.position.x = 0.35;
        const grp = new THREE.Group(); grp.add(a, b); add(grp, 1.0); rec.spin = grp;
        break;
      }
      case "event": { const q = xpxFigure("ask", 0.11, 3, {glow:0.35}); if(q){ add(q, 0.5); rec.spin = q; } break; }
      case "shop":  { const f = xpxFigure("mart", 0.11, 11); add(f); break; }
      case "rest":  { const f = xpxFigure("pc", 0.11, 11); add(f); break; }
      case "treasure": { const f = xpxFigure("bag", 0.09, 7); add(f); break; }
      case "legend": {
        const pm = std("#e8d8a8");
        for(const s of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.0, 0.22), pm); p.position.set(s * 0.95, 1.0, -0.3); p.castShadow = true; rec.g.add(p); }
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 0.3), std("#c84030")); top.position.set(0, 2.05, -0.3); rec.g.add(top);
        if(n.leg){ preloadMon(n.leg, false); const m = makeMon(n.leg, false, rec.g, {height:1.5}); rec.mon = m; }
        break;
      }
    }
  }
  /* ---------- l'état de la carte, lu à chaque image ---------- */
  sync(run, t, hoverRec){
    if(this.pending.length) this.pending = this.pending.filter(f=>!f());
    const K = (y, i) => y + ":" + i, last = run.map.length - 1;
    /* ce qui reste atteignable depuis la position actuelle (comme la carte mobile) */
    const startRow = run.row + 1, reach = new Set(), availSet = new Set((run.avail || []).map(i=>K(startRow, i)));
    let front = (run.avail || []).map(i=>[startRow, i]);
    while(front.length){ const nx = []; for(const [y, i] of front){ if(reach.has(K(y, i)) || !run.map[y] || !run.map[y][i]) continue; reach.add(K(y, i)); if(y < last) for(const j of run.map[y][i].next) nx.push([y + 1, j]); } front = nx; }
    this.reach = reach; this.availSet = availSet;
    const cur = run.row >= 0 ? K(run.row, run.col) : null;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    for(const r of this.nodes){
      const k = K(r.y, r.i), avail = availSet.has(k), done = r.n.done && k !== cur, isCur = k === cur, far = !reach.has(k) && !done && !isCur;
      r.state = isCur ? "cur" : avail ? "avail" : done ? "done" : reach.has(k) ? "reach" : "far";
      const dim = done ? 0.42 : far ? 0.62 : 1;
      for(const m of r.mats) if(m.color && m.userData.base === undefined){ m.userData.base = m.color.getHex(); }
      for(const m of r.mats) if(m.color && m.userData.base !== undefined) m.color.setHex(m.userData.base).multiplyScalar(dim);
      r.ped.material.color.set(avail ? "#b8b0a0" : done ? "#5a5650" : "#8a8070");
      const hov = hoverRec === r;
      r.ring.material.opacity = avail ? 0.55 + 0.4 * pulse : hov ? 0.6 : 0;
      r.ring.material.color.set(hov ? "#ffffff" : r.tag && avail ? r.tag : "#35f0d6");
      r.ring.scale.setScalar(hov ? 1.12 : 1);
      if(r.spin) r.spin.rotation.y = t * (r.n.t === "boss" ? 0.8 : 1.2);
      if(r.bob) r.bob.position.y = 0.54 + (avail ? Math.abs(Math.sin(t * 4)) * 0.12 : 0);
      if(r.mon){ r.mon.groundY = 0.22; r.mon.update(t, 1 / 60, V1.set(r.g.position.x, 0.22, r.g.position.z - 0.1), 0, null, null); }
    }
    /* les sentiers : éclairés s'ils restent possibles, usés s'ils ont été pris, éteints sinon */
    for(const s of this.segs){
      const [y0, i0, y1, i1] = s.key, a = y0 < 0 ? "door" : K(y0, i0), b = K(y1, i1);
      const na = y0 < 0 ? null : run.map[y0][i0], nb = run.map[y1][i1];
      let c = "#4a4a52", al = 0.35;
      const aDone = y0 < 0 ? run.row >= 0 : na.done, bDone = nb.done;
      if(aDone && bDone){ c = "#c8a878"; al = 0.8; }
      else if((a === cur || (y0 < 0 && run.row < 0)) && availSet.has(b)){ c = "#5cf0ff"; al = 0.6 + 0.4 * pulse; }
      else if((y0 < 0 ? run.row < 0 : reach.has(a)) && reach.has(b)){ c = "#ffffff"; al = 0.75; }
      _c.set(c).multiplyScalar(al);
      for(let q = 0; q < s.n; q++) this.dash.setColorAt(s.i0 + q, _c);
    }
    this.dash.instanceColor.needsUpdate = true;
  }
  /* la position d'un lieu, la place de l'équipe devant lui */
  at(y, i, out = new THREE.Vector3()){ if(y < 0) return out.copy(this.door).add(V1.set(0, 0, -1.2)); const n = this.run.map[y][i]; return out.set(this.X(n.c), 0, this.Z(y) + 1.6); }
  dispose(){
    this.scene.remove(this.g);
    this.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); const M = o.material; if(M) (Array.isArray(M) ? M : [M]).forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); }); });
    for(const r of this.nodes) if(r.mon) r.mon.dispose();
  }
}
const UPV = new THREE.Vector3(0, 1, 0);

/* ============================================================
   L'ÉQUIPE : le meneur, et les autres à la file derrière lui
   ============================================================ */
export class Party {
  constructor(scene){ this.scene = scene; this.mons = []; this.ids = ""; this.trail = []; this.pos = new THREE.Vector3(); this.yaw = Math.PI; this.moving = false; }
  sync(run){
    const team = run.team.filter(m=>m.hp > 0).slice(0, 4), key = team.map(m=>m.id).join(",");
    if(key === this.ids) return;
    this.ids = key;
    for(const m of this.mons) m.model.dispose();
    this.mons = team.map((m, i)=>{
      const shiny = !!(G().S.dex[m.base || m.id] && G().S.dex[m.base || m.id].shiny);
      preloadMon(m.id, shiny);
      return {id:m.id, model:makeMon(m.id, shiny, this.scene, {height:i === 0 ? 1.15 : 0.9}), p:new THREE.Vector3(), yaw:Math.PI};
    });
  }
  place(p, yaw){ this.pos.copy(p); if(yaw !== undefined) this.yaw = yaw; this.trail = []; for(const m of this.mons){ m.p.copy(p); m.yaw = this.yaw; } }
  update(t, dt, cam){
    /* une trace : chacun suit la trace du meneur, à sa distance */
    const lead = this.pos;
    if(!this.trail.length || this.trail[0].distanceTo(lead) > 0.15){ this.trail.unshift(lead.clone()); if(this.trail.length > 120) this.trail.length = 120; }
    this.mons.forEach((m, i)=>{
      let want = lead;
      if(i > 0){
        let d = 0, k = 0; const need = i * 1.15;
        for(k = 1; k < this.trail.length; k++){ d += this.trail[k].distanceTo(this.trail[k - 1]); if(d >= need) break; }
        want = this.trail[Math.min(k, this.trail.length - 1)] || lead;
        if(this.trail.length < 2) want = V1.copy(lead).add(V2.set(Math.sin(this.yaw + Math.PI) * need, 0, Math.cos(this.yaw + Math.PI) * need));
      }
      const before = m.p.clone();
      m.p.lerp(want, i === 0 ? 1 : Math.min(1, dt * 8));
      const mv = before.distanceTo(m.p);
      if(i === 0) m.yaw = this.yaw;
      else if(mv > 0.002) m.yaw = Math.atan2(m.p.x - before.x, m.p.z - before.z);
      m.model.setAnim((i === 0 ? this.moving : mv > dt * 0.6) ? "walk" : "idle");
      m.model.groundY = 0;
      m.model.update(t, dt, m.p, m.yaw, cam.position, null);
    });
  }
  dispose(){ for(const m of this.mons) m.model.dispose(); this.mons = []; this.ids = ""; }
}
