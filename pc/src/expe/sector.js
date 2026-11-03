/* ============================================================
   L'EXPÉDITION EN 3D · LE SECTEUR
   La carte du jeu mobile (un treillis de losanges, façon Pokélike,
   le Champion au bout) devient une vallée où l'on marche : chaque
   rangée de nœuds est un palier, à quinze mètres du précédent ; les
   sentiers du treillis sont des chemins de terre ; chaque nœud est
   un endroit qui dit ce qu'on y trouvera :
     · hautes herbes (Pokémon sauvages), un dresseur (son portrait,
       la couleur de son type), une Élite devant son obélisque ;
     · une Poké Ball sur un socle (recrutement), un terminal d'échange,
       un « ? » (événement), un étal (boutique), un Centre Pokémon,
       un sac (objet), un sanctuaire (et son légendaire endormi) ;
     · au bout, l'arène du Champion — une silhouette, son type reste
       secret — ou, dans la faille, le noyau.
   Le décor suit le secteur : prairie, forêt, grotte, plage, neige,
   volcan, faille. Les nœuds qu'on peut atteindre s'allument, avec le
   chemin qui y mène ; ceux qu'on a passés s'éteignent.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MonSprite } from "../mon/sprites.js";
import { makeMon, preloadMon } from "../mon/model3d.js";
import { realHeight } from "../mon/sprites.js";
import { OCC, OCC_GLSL } from "../mon/occ.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const TAU = Math.PI * 2;
export const ROW_D = 15, COL_W = 9, CHAMP_GAP = 9, START_Z = 15, HALF_W = 24;
function rng(seed){ let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/* ---------- les sept décors : la palette du jeu mobile (51m), la lumière, l'air ---------- */
export const XB3 = {
  prairie:{g:["#78c850","#70c048","#80cc58"], b:"#c8a868", e:"#5fae45", f:["#f8e060","#ffffff","#f08080"], wall:["#9a9a7a","#86866a","#6e6e56"], deco:"bush",
    sky:["#6fa8e8", "#d8ecf8"], fog:["#c8e0f0", 0.010], hemi:["#e8f4ff", "#5a6a3a", 1.25], sun:["#fff2d8", 2.3], exp:1.05, amb:"pollen"},
  foret:  {g:["#4f9a3c","#4a9238","#57a243"], b:"#9a7a4c", e:"#3b7f2e", f:["#f8e060","#c8f0a0"], wall:["#6a5a40","#58482e","#45351e"], deco:"tree",
    sky:["#3a6a5a", "#a8c8b0"], fog:["#7a9a80", 0.020], hemi:["#d8f0d8", "#2a3a1a", 1.1], sun:["#fff0c8", 1.8], exp:1.1, amb:"firefly"},
  grotte: {g:["#b08860","#a98158","#b78f67"], b:"#d8c0a0", e:"#94704c", f:["#d8c0a0"], wall:["#8a6a4a","#6e5236","#4a3622"], deco:"rock",
    sky:["#0a0806", "#3a2c20"], fog:["#2a2016", 0.026], hemi:["#f0d8b8", "#2a1a10", 1.15], sun:["#ffd8a0", 1.4], exp:1.3, amb:"dust", dark:true},
  plage:  {g:["#ecdca4","#e4d398","#f2e3b0"], b:"#c8b478", e:"#dccb8c", f:["#ffffff","#f0a0a0"], wall:["#f4f0e0","#d8d0b8","#a8a088"], deco:"palm", water:"#58a8e8",
    sky:["#58a8f0", "#e8f6ff"], fog:["#d8ecf8", 0.008], hemi:["#ffffff", "#c8b478", 1.3], sun:["#fff8e8", 2.5], exp:1.0, amb:"spray"},
  neige:  {g:["#eaf2fa","#e0eaf4","#f4f8fc"], b:"#a8c0d8", e:"#d2e0ee", f:["#ffffff","#b8d8f8"], wall:["#c8d8e8","#a8bccf","#7890a8"], deco:"pine",
    sky:["#8aa8c8", "#e8f0f8"], fog:["#dce8f4", 0.022], hemi:["#f0f6ff", "#8aa0b8", 1.15], sun:["#f8fbff", 1.7], exp:0.95, amb:"snow"},
  volcan: {g:["#8a6048","#7f5a44","#936650"], b:"#5a3e2e", e:"#6e4c3a", f:["#ff8a3d","#ffc857"], wall:["#5a3e30","#4a3226","#2e1e14"], deco:"lava",
    sky:["#3a140a", "#c8603a"], fog:["#7a3a24", 0.016], hemi:["#ffd8b8", "#4a1a0c", 1.5], sun:["#ffc080", 2.3], exp:1.25, amb:"ember"},
  centrale:{g:["#8a8f99","#838892","#91969f"], b:"#5c616b", e:"#6e737c", f:["#ffe45e","#58a8e8"], wall:["#5c616b","#474b54","#2e3138"], deco:"rock",
    sky:["#3a4250", "#a8b0c0"], fog:["#7a828e", 0.018], hemi:["#e8eef8", "#2a2e36", 1.1], sun:["#fffbe8", 1.7], exp:1.05, amb:"dust"},
  faille: {g:["#1d1432","#22173a","#191029"], b:"#4a2a7a", e:"#2a1a46", f:["#ff3d7f","#35f0d6"], wall:["#2a1a46","#1d1232","#0e0818"], deco:"glitch",
    sky:["#06030e", "#3a124a"], fog:["#1c0a2a", 0.022], hemi:["#d8c0ff", "#10081a", 1.2], sun:["#e8c8ff", 1.4], exp:1.25, amb:"glitch", dark:true}
};
/* la couleur d'un nœud (celle de la carte mobile) */
const NODE_C = {fight:"#9fe07a", trainer:"#35f0d6", elite:"#ff3d7f", draft:"#5ce07a", swap:"#b48cff", event:"#b48cff", shop:"#ffc857",
  rest:"#ff6a7a", treasure:"#ffc857", boss:"#ff3d7f", champ:"#ffc857", legend:"#ffe48a"};

/* ---------- où est chaque chose ---------- */
export function nodePos(run, y, i, out = new THREE.Vector3()){
  const n = run.map[y] && run.map[y][i]; if(!n) return out.set(0, 0, START_Z);
  const last = run.map.length - 1;
  return out.set((n.c - 1.5) * COL_W, 0, -y * ROW_D - (y === last ? CHAMP_GAP : 0));
}
export function sectorLen(run){ return (run.map.length - 1) * ROW_D + CHAMP_GAP; }
/* la vallée : plate au milieu, des pentes puis des falaises sur les bords */
export function groundH(x, z, L){
  const ax = Math.abs(x);
  let h = smooth(17, 25, ax) * 7.5 + smooth(24, 30, ax) * 6;
  h += smooth(START_Z + 6, START_Z + 13, z) * 9 + smooth(-L - 9, -L - 17, z) * 9;
  h += (Math.sin(x * 0.31 + z * 0.17) * 0.5 + Math.sin(z * 0.23 - x * 0.11) * 0.4) * smooth(12, 20, ax);
  return h;
}

/* ce qui se trouve entre la caméra et l'équipe s'efface en trame (comme dans la Brèche) */
function occlude(m){
  m.onBeforeCompile = sh => {
    sh.uniforms.uEye = OCC.uEye; sh.uniforms.uFocus = OCC.uFocus;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vOW;")
      .replace("#include <project_vertex>", `#include <project_vertex>
  #ifdef USE_INSTANCING
    vOW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
    vOW = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vOW;\n" + OCC_GLSL)
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n  occTest(vOW, 1.0);");
  };
  m.customProgramCacheKey = () => "xpocc" + (m.emissiveIntensity > 0.1 ? 1 : 0);
  return m;
}
/* ---------- petits volumes ---------- */
function tint(geo, c){
  const g = geo.index ? geo.toNonIndexed() : geo;
  const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for(let i = 0; i < n; i++){ a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  if(g.attributes.uv) g.deleteAttribute("uv");
  g.computeVertexNormals();
  return g;
}
function jitter(geo, R, amt){ const p = geo.attributes.position; for(let i = 0; i < p.count; i++){ p.setXYZ(i, p.getX(i) * (1 + (R() - 0.5) * amt), p.getY(i) * (1 + (R() - 0.5) * amt), p.getZ(i) * (1 + (R() - 0.5) * amt)); } return geo; }
function at(geo, x, y, z, ry = 0, s = 1, sy = s){ geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, sy, s))); return geo; }
const merge = list => mergeGeometries(list.map(g=>g.index ? g.toNonIndexed() : g));
/* un modèle par sorte de décor (taille 1), répété en instances */
function decoGeo(kind, B, R){
  if(kind === "tree") return merge([tint(at(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 6), 0, 0.8, 0), "#5a3e24"),
    tint(at(jitter(new THREE.IcosahedronGeometry(1.15, 0), R, 0.25), 0, 2.3, 0), B.e), tint(at(jitter(new THREE.IcosahedronGeometry(0.85, 0), R, 0.25), 0.35, 3.1, -0.15), B.g[2])]);
  if(kind === "bush") return merge([tint(at(jitter(new THREE.IcosahedronGeometry(0.6, 0), R, 0.3), 0, 0.42, 0), B.e), tint(at(jitter(new THREE.IcosahedronGeometry(0.42, 0), R, 0.3), 0.45, 0.32, 0.15), B.g[0]),
    tint(at(new THREE.SphereGeometry(0.07, 5, 4), 0.2, 0.86, 0.3), B.f[0])]);
  if(kind === "rock") return tint(at(jitter(new THREE.DodecahedronGeometry(0.8, 0), R, 0.35), 0, 0.45, 0, 0, 1, 0.75), B.wall[0]);
  if(kind === "pine") return merge([tint(at(new THREE.CylinderGeometry(0.14, 0.2, 1, 6), 0, 0.5, 0), "#5a4430"),
    tint(at(new THREE.ConeGeometry(1.1, 1.6, 7), 0, 1.5, 0), "#3e6a5a"), tint(at(new THREE.ConeGeometry(0.85, 1.4, 7), 0, 2.4, 0), "#4a7a68"), tint(at(new THREE.ConeGeometry(0.55, 1.1, 7), 0, 3.2, 0), "#f4f8fc")]);
  if(kind === "palm"){
    const parts = [];
    for(let i = 0; i < 6; i++){ const s = new THREE.CylinderGeometry(0.15 - i * 0.012, 0.17 - i * 0.012, 0.6, 6); parts.push(tint(at(s, i * i * 0.025, 0.3 + i * 0.55, 0), "#9a7a4a")); }
    for(let k = 0; k < 6; k++){ const l = new THREE.ConeGeometry(0.28, 2.0, 4); l.rotateZ(-Math.PI / 2 + 0.5); l.translate(1.0, 0, 0); l.rotateY(k / 6 * TAU); l.translate(0.9, 3.4, 0); parts.push(tint(l, k % 2 ? "#3a8a3a" : "#4a9a42")); }
    return merge(parts);
  }
  if(kind === "lava") return tint(at(jitter(new THREE.DodecahedronGeometry(0.7, 0), R, 0.4), 0, 0.35, 0, 0, 1, 0.6), "#3a2a24");
  if(kind === "glitch") return tint(new THREE.BoxGeometry(0.6, 0.6, 0.6).translate(0, 1.2, 0), "#ff3d7f");
  return tint(at(jitter(new THREE.DodecahedronGeometry(0.8, 0), R, 0.35), 0, 0.45, 0), B.wall[0]);
}

/* ---------- le portrait d'un dresseur, en panneau tourné vers nous (Rouge Feu) ---------- */
let ATLAS = null;
function atlasTex(){
  if(ATLAS) return ATLAS;
  const img = new Image(); img.src = ref("TRAINER_ATLAS") || "";
  const tex = new THREE.Texture(img); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
  img.onload = () => { tex.needsUpdate = true; };
  return ATLAS = {img, tex};
}
export function trainerSprite(scene, cls, h, opts = {}){
  const s = new MonSprite(1, false, scene, {height:h});
  const A = atlasTex(), classes = ref("TRAINER_CLASSES") || [];
  const i = Math.max(0, classes.indexOf(cls)), n = Math.max(1, classes.length);
  s.update = function(t, dt, pos, heading, cam, env){
    this.group.position.copy(pos);
    const U = this.uniforms; U.uTime.value = t;
    if(env){ U.uTint.value.copy(env.tint); U.uFog.value.copy(env.fog); U.uFogDensity.value = env.fogDensity; }
    if(opts.sil) U.uTint.value.setRGB(0.04, 0.03, 0.06);
    U.uMap.value = A.tex; U.uRect.value.set(i / n, 0, 1 / n, 1);
    U.uSize.value.set(h * 1.1, h * 1.1); U.uOffset.value.set(-0.5, -0.08);
    this.mesh.visible = A.img.complete && A.img.naturalWidth > 0;
    this.width = 0.8; this.drawH = h;
    this.shadow.scale.set(0.9, 1, 0.6); this.shadow.position.y = 0.03;
  };
  return s;
}

/* ============================================================
   LE SECTEUR
   ============================================================ */
export class Sector {
  constructor(scene){ this.scene = scene; this.g = null; this.key = ""; this.nodes = []; this.links = []; }
  dispose(){
    if(!this.g) return;
    for(const N of this.nodes){ if(N.spr) N.spr.dispose(); if(N.mon) N.mon.dispose(); }
    this.scene.remove(this.g);
    this.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); const M = o.material; if(M) (Array.isArray(M) ? M : [M]).forEach(m=>{ if(m.map && m.map !== (ATLAS && ATLAS.tex)) m.map.dispose(); m.dispose(); }); });
    this.g = null; this.nodes = []; this.links = [];
  }
  /* le sol, et ce qu'on y a posé et où l'on monte (l'estrade du Champion) */
  heightAt(x, z){
    let h = groundH(x, z, this.L || 100);
    for(const P of this.pads || []){ const d = Math.hypot(x - P.x, z - P.z); if(d < P.r + 0.25) h += P.h * Math.min(1, (P.r + 0.25 - d) / 0.25); }
    return h;
  }
  build(run){
    this.dispose();
    this.key = (run.seed || 0) + ":" + (run.mapIdx || 0) + ":" + run.biome;
    this.run = run;
    const B = this.B = XB3[run.biome] || XB3.prairie, R = rng((run.seed || 1) + (run.mapIdx || 0) * 977);
    const g = this.g = new THREE.Group(); this.scene.add(g);
    const L = this.L = sectorLen(run);
    this.pads = [];
    const z0 = START_Z + 20, z1 = -L - 22, X0 = -40, X1 = 40;
    this.bounds = {x0:-19, x1:19, z0:START_Z + 4, z1:-L - 6};
    /* ---------- le sol : la peinture du jeu mobile, en grands pixels ---------- */
    const PPM = 3, W = (X1 - X0) * PPM, H = (z0 - z1) * PPM;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const px = (c, a, b, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const toC = (wx, wz) => [(wx - X0) * PPM, (z0 - wz) * PPM];
    for(let yy = 0; yy < H; yy += 6) for(let xx = 0; xx < W; xx += 6) px(B.g[Math.floor(R() * B.g.length)], xx, yy, 6, 6);
    for(let i = 0; i < W * H / 40; i++){ const a = R() * W, b = R() * H;
      if(B.deco === "glitch"){ if(R() < 0.3) px(R() < 0.5 ? "#3a1f66" : "#2b1650", a, b, 2 + R() * 6, 1); continue; }
      px(B.e, a, b, 1, 2); }
    /* les falaises, peintes là où le sol monte */
    for(let yy = 0; yy < H; yy += 3) for(let xx = 0; xx < W; xx += 3){
      const wx = X0 + xx / PPM, wz = z0 - yy / PPM, h = groundH(wx, wz, L);
      if(h > 1.6) px(B.wall[Math.min(2, Math.floor(h / 4 + R() * 0.8))], xx, yy, 3, 3);
    }
    /* les sentiers : du départ vers la première rangée, puis le treillis */
    const pts = [];
    const P = (y, i) => { const v = nodePos(run, y, i); return [v.x, v.z]; };
    const seg = (a, b, k) => pts.push({a, b, k});
    run.map[0].forEach((n, i)=>seg([0, START_Z], P(0, i), "0:" + i));
    run.map.forEach((row, y)=>row.forEach((n, i)=>n.next.forEach(j=>seg(P(y, i), P(y + 1, j), y + ":" + i + ">" + (y + 1) + ":" + j))));
    this.segs = pts;
    const path = (a, b, w, c) => { const [ax, ay] = toC(a[0], a[1]), [bx, by] = toC(b[0], b[1]); x.strokeStyle = c; x.lineWidth = w * PPM; x.lineCap = "round"; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); };
    for(const s of pts) path(s.a, s.b, 3.0, B.e);
    for(const s of pts) path(s.a, s.b, 2.2, B.b);
    /* les clairières des nœuds, et la place de départ */
    const clear = (wx, wz, r, c) => { const [a, b] = toC(wx, wz); x.fillStyle = c; x.beginPath(); x.arc(a, b, r * PPM, 0, TAU); x.fill(); };
    clear(0, START_Z, 3.4, B.e); clear(0, START_Z, 2.8, B.b);
    run.map.forEach((row, y)=>row.forEach((n, i)=>{ const [a, b] = P(y, i); clear(a, b, 3.1, B.e); clear(a, b, 2.6, B.b); }));
    /* des fleurs, des cailloux */
    for(let i = 0; i < W * H / 700; i++){ const a = R() * W, b = R() * H; px(B.f[Math.floor(R() * B.f.length)], a, b, 2, 2); }
    /* les dessins de pixels des bords du sentier : un liseré clair */
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(X1 - X0, z0 - z1, 80, Math.round((z0 - z1) / 1.5)).rotateX(-Math.PI / 2).translate((X0 + X1) / 2, 0, (z0 + z1) / 2);
    const pa = geo.attributes.position;
    for(let i = 0; i < pa.count; i++) pa.setY(i, groundH(pa.getX(i), pa.getZ(i), L));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:tex, roughness:0.95, metalness:0}));
    ground.receiveShadow = true; g.add(ground);
    /* l'eau (la plage) : la mer, sur le bord est */
    if(B.water){
      const wm = new THREE.MeshStandardMaterial({color:B.water, roughness:0.25, metalness:0.1, transparent:true, opacity:0.88});
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(40, z0 - z1 + 40).rotateX(-Math.PI / 2), wm); sea.position.set(38, 1.2, (z0 + z1) / 2); g.add(sea); this.sea = sea;
    }
    /* ---------- le décor : à l'écart des sentiers et des nœuds ---------- */
    const nodesXZ = []; run.map.forEach((row, y)=>row.forEach((n, i)=>nodesXZ.push(P(y, i)))); nodesXZ.push([0, START_Z]);
    const segD = (px0, pz0, s) => { const ax = s.a[0], az = s.a[1], bx = s.b[0], bz = s.b[1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const k = Math.max(0, Math.min(1, ((px0 - ax) * dx + (pz0 - az) * dz) / l2)); return Math.hypot(px0 - ax - dx * k, pz0 - az - dz * k); };
    const free = (wx, wz, d) => nodesXZ.every(([a, b])=>Math.hypot(a - wx, b - wz) > d + 2.6) && pts.every(s=>segD(wx, wz, s) > d + 1.2);
    const kinds = B.deco === "lava" ? ["lava", "rock"] : B.deco === "glitch" ? ["glitch", "rock"] : B.deco === "tree" ? ["tree", "bush"] : B.deco === "palm" ? ["palm", "bush"] : B.deco === "pine" ? ["pine", "rock"] : B.deco === "rock" ? ["rock", "rock"] : ["bush", "tree"];
    const want = {}; kinds.forEach((k, j)=>want[k] = (want[k] || 0) + (j === 0 ? 70 : 40));
    for(const [k, n] of Object.entries(want)){
      const list = [];
      for(let tries = 0; tries < n * 6 && list.length < n; tries++){
        const wx = (R() - 0.5) * 44, wz = START_Z + 8 - R() * (L + 22);
        if(groundH(wx, wz, L) > 5) continue;
        if(!free(wx, wz, k === "tree" || k === "palm" || k === "pine" ? 1.6 : 0.8)) continue;
        list.push([wx, wz, 0.7 + R() * 0.7, R() * TAU]);
      }
      const geoK = decoGeo(k, B, R);
      const mat = occlude(k === "glitch" ? new THREE.MeshStandardMaterial({vertexColors:true, emissive:"#ff3d7f", emissiveIntensity:0.6, flatShading:true}) : new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.9, flatShading:true}));
      const im = new THREE.InstancedMesh(geoK, mat, Math.max(1, list.length)), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3(), C = new THREE.Color();
      list.forEach(([wx, wz, s, r], i)=>{
        M.compose(V.set(wx, groundH(wx, wz, L) - 0.05 + (k === "glitch" ? R() * 2 : 0), wz), Q.setFromEuler(new THREE.Euler(0, r, 0)), S.set(s, s, s)); im.setMatrixAt(i, M);
        if(k === "glitch") im.setColorAt(i, C.set(R() < 0.5 ? "#ff3d7f" : "#35f0d6"));
      });
      im.count = list.length; im.castShadow = true; im.receiveShadow = true; g.add(im);
      if(k === "glitch") this.glitch = {im, list};
    }
    /* la lave du volcan : des mares qui luisent */
    if(B.deco === "lava"){
      const lm = new THREE.MeshBasicMaterial({color:"#ff6a1a", toneMapped:false});
      for(let i = 0; i < 9; i++){ const wx = (R() < 0.5 ? -1 : 1) * (8 + R() * 9), wz = START_Z - R() * L; if(!free(wx, wz, 2)) continue;
        const pool = new THREE.Mesh(new THREE.CircleGeometry(1 + R() * 1.4, 10).rotateX(-Math.PI / 2), lm); pool.position.set(wx, groundH(wx, wz, L) + 0.04, wz); g.add(pool); }
      this.lavaMat = lm;
    }
    /* les falaises : des blocs, pour du relief au bord */
    { const rk = tint(jitter(new THREE.DodecahedronGeometry(1, 0), R, 0.4), B.wall[1]);
      const list = [];
      for(let z = START_Z + 18; z > -L - 20; z -= 3.2) for(const side of [-1, 1]){ if(B.water && side > 0) continue; list.push([side * (21 + R() * 5), z, 2 + R() * 3]); }
      const im = new THREE.InstancedMesh(rk, occlude(new THREE.MeshStandardMaterial({vertexColors:true, roughness:1, flatShading:true})), list.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3();
      list.forEach(([wx, wz, s], i)=>{ M.compose(V.set(wx, groundH(wx, wz, L) - s * 0.3, wz), Q.setFromEuler(new THREE.Euler(R(), R() * TAU, R())), S.set(s, s * (0.8 + R() * 0.8), s)); im.setMatrixAt(i, M); });
      im.castShadow = true; im.receiveShadow = true; g.add(im); }
    /* ---------- le départ : une porte ---------- */
    { const pm = occlude(new THREE.MeshStandardMaterial({color:B.wall[2], roughness:0.9, flatShading:true}));
      for(const sx of [-2.6, 2.6]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3, 0.6), pm); p.position.set(sx, 1.5, START_Z - 3.5); p.castShadow = true; g.add(p); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.5, 0.8), pm); top.position.set(0, 3.1, START_Z - 3.5); top.castShadow = true; g.add(top);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), new THREE.MeshBasicMaterial({color:"#35f0d6", toneMapped:false})); sign.position.set(0, 2.55, START_Z - 3.92); g.add(sign); }
    /* ---------- les chemins lumineux : ce qu'on peut atteindre d'ici ---------- */
    const dotGeo = new THREE.SphereGeometry(0.09, 6, 4), N = pts.reduce((s, p)=>s + Math.ceil(Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]) / 1.1), 0);
    this.dots = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, opacity:0.95, toneMapped:false}), N);
    this.dots.frustumCulled = false; this.dotList = [];
    { const M = new THREE.Matrix4(); let k = 0;
      for(const s of pts){ const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]), n = Math.ceil(len / 1.1);
        for(let q = 0; q < n; q++){ const f = (q + 0.5) / n, wx = s.a[0] + (s.b[0] - s.a[0]) * f, wz = s.a[1] + (s.b[1] - s.a[1]) * f;
          this.dotList.push({s, f, x:wx, z:wz, y:groundH(wx, wz, L) + 0.12}); M.makeTranslation(wx, -50, wz); this.dots.setMatrixAt(k, M); this.dots.setColorAt(k, new THREE.Color("#ffffff")); k++; } } }
    g.add(this.dots);
    /* ---------- les nœuds ---------- */
    run.map.forEach((row, y)=>row.forEach((n, i)=>this.nodes.push(this.makeNode(run, n, y, i, R))));
    /* ---------- l'air du secteur ---------- */
    const AN = 260, ap = new Float32Array(AN * 3);
    for(let i = 0; i < AN; i++){ ap[i * 3] = (R() - 0.5) * 40; ap[i * 3 + 1] = R() * 9; ap[i * 3 + 2] = (R() - 0.5) * 40; }
    const ag = new THREE.BufferGeometry(); ag.setAttribute("position", new THREE.BufferAttribute(ap, 3));
    const acol = {pollen:"#fff6c0", firefly:"#d8ff7a", dust:"#e8d0b0", spray:"#ffffff", snow:"#ffffff", ember:"#ff9a4a", glitch:"#ff3d7f"}[B.amb] || "#ffffff";
    this.air = new THREE.Points(ag, new THREE.PointsMaterial({color:acol, size:B.amb === "snow" ? 0.09 : 0.06, transparent:true, opacity:0.8, depthWrite:false, blending:B.amb === "snow" || B.amb === "dust" ? THREE.NormalBlending : THREE.AdditiveBlending}));
    this.air.frustumCulled = false; g.add(this.air);
    this.airP = ap;
  }
  /* ---------- un nœud : ce qu'on y trouvera ---------- */
  makeNode(run, n, y, i, R){
    const pos = nodePos(run, y, i); pos.y = this.heightAt(pos.x, pos.z);
    const ng = new THREE.Group(); ng.position.copy(pos); this.g.add(ng);
    const c = n.t === "trainer" && n.tr !== undefined ? this.trainerCol(n) : NODE_C[n.t] || "#ffffff";
    const N = {n, y, i, pos, g:ng, c, t:n.t, bob:null, spr:null, mon:null};
    const B = this.B;
    const std = (col, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color:col, roughness:0.75, flatShading:true}, o));
    const add = (geo, m, x = 0, yy = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, yy, z); me.castShadow = true; me.receiveShadow = true; ng.add(me); return me; };
    /* le disque de couleur, au sol */
    N.ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.25, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:0.55, depthWrite:false, toneMapped:false}));
    N.ring.position.y = 0.06; ng.add(N.ring);
    /* la colonne de lumière des nœuds atteignables */
    N.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 14, 18, 1, true).translate(0, 7, 0), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
    ng.add(N.beam);
    const T = n.t;
    if(T === "fight"){
      /* des hautes herbes, serrées */
      const tuft = new THREE.ConeGeometry(0.16, 1.0, 4).translate(0, 0.5, 0), gm = std(B.deco === "glitch" ? "#4a2a7a" : B.deco === "pine" ? "#7a9aa0" : "#3f8a2a");
      for(let k = 0; k < 34; k++){ const a = R() * TAU, r = Math.sqrt(R()) * 1.5; const t = add(tuft, gm, Math.cos(a) * r, 0, Math.sin(a) * r); t.scale.set(1, 0.7 + R() * 0.7, 1); t.rotation.set((R() - 0.5) * 0.3, R() * TAU, (R() - 0.5) * 0.3); }
      N.sway = ng.children.slice(-34);
    } else if(T === "trainer" || T === "elite"){
      const cls = (ref("trainerClassOf") || (()=>"youngster"))(n);
      N.spr = trainerSprite(this.scene, cls, 1.75);
      if(T === "elite"){ const ob = add(new THREE.CylinderGeometry(0.35, 0.55, 3.6, 5), std("#1a1020", {emissive:"#ff3d7f", emissiveIntensity:0.35}), 2.7, 1.8, -5.8); ob.rotation.y = 0.4; }
    } else if(T === "draft"){
      add(new THREE.CylinderGeometry(0.55, 0.7, 0.8, 8), std(B.wall[0]), 0, 0.4, 0);
      N.bob = new THREE.Group(); N.bob.position.y = 1.2; ng.add(N.bob);
      const s = 0.36;
      const top = new THREE.Mesh(new THREE.SphereGeometry(s, 18, 9, 0, TAU, 0, Math.PI / 2), std("#d8283a", {flatShading:false, roughness:0.35}));
      const bot = new THREE.Mesh(new THREE.SphereGeometry(s, 18, 9, 0, TAU, Math.PI / 2, Math.PI / 2), std("#f2f0ea", {flatShading:false, roughness:0.35}));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.01, s * 1.01, s * 0.16, 18), std("#1a1a1a"));
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.3, s * 0.12, 12).rotateX(Math.PI / 2).translate(0, 0, s * 0.98), std("#f2f0ea"));
      for(const p of [top, bot, band, btn]){ p.castShadow = true; N.bob.add(p); }
      for(const dx of [-0.95, 0.95]){ const b2 = N.bob.clone(); b2.scale.setScalar(0.6); b2.position.set(dx, 0.62, 0.3); ng.add(b2); }
    } else if(T === "swap"){
      add(new THREE.BoxGeometry(0.9, 1.5, 0.6), std("#3a3a4a"), 0, 0.75, -0.5);
      const scr = add(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshBasicMaterial({color:"#b48cff", toneMapped:false}), 0, 1.15, -0.19);
      N.bob = new THREE.Group(); N.bob.position.y = 1.4; ng.add(N.bob);
      const tor = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 40), new THREE.MeshBasicMaterial({color:"#b48cff", toneMapped:false})); N.bob.add(tor);
      const tor2 = tor.clone(); tor2.scale.setScalar(0.7); tor2.rotation.x = Math.PI / 2; N.bob.add(tor2);
    } else if(T === "event"){
      N.bob = new THREE.Group(); N.bob.position.y = 1.7; ng.add(N.bob);
      const vm = new THREE.MeshStandardMaterial({color:"#b48cff", emissive:"#b48cff", emissiveIntensity:0.8, flatShading:true});
      const Q = ["01110", "10001", "00010", "00100", "00100", "00000", "00100"];
      Q.forEach((row, yy)=>[...row].forEach((ch, xx)=>{ if(ch === "1"){ const v = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), vm); v.position.set((xx - 2) * 0.18, (3 - yy) * 0.18, 0); v.castShadow = true; N.bob.add(v); } }));
    } else if(T === "shop"){
      add(new THREE.BoxGeometry(2.2, 0.9, 0.9), std("#8a5a30"), 0, 0.45, -0.3);
      for(const sx of [-1, 1]) add(new THREE.BoxGeometry(0.12, 2.2, 0.12), std("#6a4224"), sx * 1.05, 1.1, -0.65);
      const aw = add(new THREE.BoxGeometry(2.6, 0.12, 1.3), std("#ffc857", {emissive:"#ffc857", emissiveIntensity:0.15}), 0, 2.25, -0.2); aw.rotation.x = 0.25;
      for(let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.3, 0.3, 0.3), std(["#5ce07a", "#58a8e8", "#ff6a7a", "#ffc857"][k]), -0.75 + k * 0.5, 1.05, -0.3);
    } else if(T === "rest"){
      /* un petit Centre Pokémon */
      add(new THREE.BoxGeometry(3.0, 1.9, 2.2), std("#f2ece0"), 0, 0.95, -0.8);
      const roof = add(new THREE.BoxGeometry(3.3, 0.5, 2.5), std("#e04a4a"), 0, 2.1, -0.8);
      add(new THREE.BoxGeometry(0.9, 1.2, 0.05), std("#3a6ad8", {emissive:"#3a6ad8", emissiveIntensity:0.2}), 0, 0.6, 0.31);
      const cross = add(new THREE.BoxGeometry(0.6, 0.18, 0.06), new THREE.MeshBasicMaterial({color:"#ffffff", toneMapped:false}), 0, 1.6, 0.32);
      add(new THREE.BoxGeometry(0.18, 0.6, 0.06), new THREE.MeshBasicMaterial({color:"#ffffff", toneMapped:false}), 0, 1.6, 0.33);
      N.lamp = new THREE.PointLight("#ffd8c8", 2.5, 7, 1.6); N.lamp.position.set(0, 1.6, 1.2); ng.add(N.lamp);
    } else if(T === "treasure"){
      /* un sac, posé */
      const bag = add(new THREE.SphereGeometry(0.5, 10, 8).scale(1, 0.85, 0.75), std("#d8a040"), 0, 0.42, 0);
      add(new THREE.TorusGeometry(0.22, 0.05, 6, 16).rotateX(Math.PI / 2), std("#7a5a24"), 0, 0.82, 0);
      add(new THREE.BoxGeometry(0.42, 0.08, 0.5), std("#a87830"), 0, 0.55, 0.32);
      N.sparkle = true;
    } else if(T === "legend"){
      const sm = std("#c8c0a8");
      for(const sx of [-1.6, 1.6]) add(new THREE.CylinderGeometry(0.28, 0.34, 3.6, 8), sm, sx, 1.8, -0.6);
      add(new THREE.BoxGeometry(4.4, 0.4, 0.7), sm, 0, 3.7, -0.6);
      add(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 16), std("#a8a090"), 0, 0.15, -0.6);
      if(n.leg){ preloadMon(n.leg, false); N.mon = makeMon(n.leg, false, this.scene, {height:Math.max(1.2, Math.min(3.2, realHeight(n.leg))), corrupt:false, occ:false}); N.monPos = new THREE.Vector3(pos.x, pos.y + 0.3, pos.z - 0.6); }
      N.lamp = new THREE.PointLight("#ffe48a", 4, 9, 1.5); N.lamp.position.set(0, 2.4, 0.6); ng.add(N.lamp);
    } else if(T === "champ"){
      /* l'arène du Champion : une estrade, quatre piliers, sa silhouette (son type reste secret) */
      add(new THREE.CylinderGeometry(5.2, 5.6, 0.4, 24), std(B.wall[2]), 0, 0.2, -1);
      /* on monte dessus : l'équipe et le combat s'y tiennent debout, pas à moitié dedans */
      this.pads.push({x:pos.x, z:pos.z - 1, r:5.2, h:0.4});
      const rim = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.09, 6, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ffc857", toneMapped:false})); rim.position.set(0, 0.42, -1); ng.add(rim);
      for(let k = 0; k < 4; k++){ const a = Math.PI * 0.2 + k / 3 * Math.PI * 0.6 + Math.PI; const p = add(new THREE.BoxGeometry(0.7, 5, 0.7), std(B.wall[1]), Math.cos(a) * 5.6, 2.5, -1 + Math.sin(a) * 5.6);
        add(new THREE.BoxGeometry(0.75, 0.25, 0.75), new THREE.MeshBasicMaterial({color:"#ffc857", toneMapped:false}), p.position.x, 4.6, p.position.z); }
      const L = run.leader;
      N.sprOpts = {sil:true};
      N.spr = trainerSprite(this.scene, L ? L.pic : "leader_brock", 2.2, N.sprOpts);
      N.sprAt = new THREE.Vector3(pos.x, pos.y + 0.4, pos.z - 5.4);
      N.lamp = new THREE.PointLight("#ffd890", 6, 14, 1.4); N.lamp.position.set(0, 4, 1); ng.add(N.lamp);
    } else if(T === "boss"){
      /* le noyau de la couche : un cristal qui flotte, des anneaux */
      N.bob = new THREE.Group(); N.bob.position.set(0, 2.6, -1.2); ng.add(N.bob);
      const cm = new THREE.MeshStandardMaterial({color:"#ff3d7f", emissive:"#ff3d7f", emissiveIntensity:0.9, flatShading:true, transparent:true, opacity:0.92});
      N.bob.add(new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0).scale(1, 1.6, 1), cm));
      for(let k = 0; k < 2; k++){ const r = new THREE.Mesh(new THREE.TorusGeometry(1.9 + k * 0.5, 0.05, 6, 48), new THREE.MeshBasicMaterial({color:k ? "#35f0d6" : "#ff3d7f", toneMapped:false})); r.rotation.x = Math.PI / 2 + k * 0.4; N.bob.add(r); }
      N.lamp = new THREE.PointLight("#ff3d7f", 8, 16, 1.4); N.lamp.position.set(0, 2.6, 0); ng.add(N.lamp);
    }
    if(N.spr && !N.sprAt) N.sprAt = new THREE.Vector3(pos.x + 1.6, pos.y, pos.z - 4.6);
    return N;
  }
  trainerCol(n){ const T = ref("TRAINERS"), tr = T && T[n.tr]; const f = ref("arCol"); return tr && f ? f(tr.t) : "#35f0d6"; }
  nodeOf(y, i){ return this.nodes.find(N=>N.y === y && N.i === i) || null; }
  /* ---------- à chaque image : l'état de chaque nœud, les chemins, l'air ---------- */
  update(t, dt, run, cam, env, focus){
    if(!this.g) return;
    const calm = typeof window.calmFx === "function" && window.calmFx();
    const avail = new Set((run.avail || []).map(i=>(run.row + 1) + ":" + i));
    const cur = run.row >= 0 ? run.row + ":" + run.col : null;
    for(const N of this.nodes){
      const k = N.y + ":" + N.i, on = avail.has(k), isCur = k === cur, done = N.n.done && !isCur;
      N.state = on ? "avail" : isCur ? "cur" : done ? "done" : "far";
      const pul = calm ? 0.8 : 0.75 + 0.25 * Math.sin(t * 2.6 + N.i);
      N.beam.material.opacity = on ? 0.16 * pul : 0;
      N.beam.visible = on;
      N.ring.material.opacity = on ? 0.85 * pul : done ? 0.18 : isCur ? 0.4 : 0.32;
      N.ring.scale.setScalar(on ? 1 + 0.04 * Math.sin(t * 3) : 1);
      if(N.bob){ N.bob.rotation.y += dt * (on ? 1.2 : 0.4); N.bob.position.y = (N.t === "boss" ? 2.6 : N.t === "event" ? 1.7 : N.t === "swap" ? 1.4 : 1.2) + (calm ? 0 : Math.sin(t * 1.8 + N.i) * 0.08); }
      if(N.sway && !calm) N.sway.forEach((s, j)=>{ s.rotation.z = Math.sin(t * 1.7 + j * 0.7 + N.i) * 0.12; });
      /* le Champion se révèle quand on monte sur son estrade */
      if(N.sprOpts) N.sprOpts.sil = !(isCur || N.n.done);
      if(N.spr){ N.spr.update(t, dt, N.sprAt, 0, cam, env); N.spr.uniforms.uAlpha && (N.spr.uniforms.uAlpha.value = done ? 0.35 : 1); }
      if(N.mon){ if(!N.awake){ N.mon.uniforms.uTintC && N.mon.uniforms.uTintC.value.set(1, 0.85, 0.4, 0.45); N.mon.frozen = true; } N.mon.update(t, dt, N.monPos, Math.PI * 0.9, cam.position, env); }
      if(N.lamp) N.lamp.intensity = (N.t === "rest" ? 2.5 : N.t === "legend" ? 4 : N.t === "boss" ? 8 : 6) * (done ? 0.3 : 1) * (calm ? 1 : 0.9 + 0.1 * Math.sin(t * 5 + N.i));
    }
    /* les chemins : ceux qui partent d'ici s'allument, ceux qu'on a pris restent dorés */
    const M = new THREE.Matrix4(), C = new THREE.Color();
    this.dotList.forEach((d, k)=>{
      const s = d.s, from = s.k.split(">")[0], to = s.k.includes(">") ? s.k.split(">")[1] : s.k;
      const fromCur = (s.k.includes(">") ? from === cur : run.row < 0), toAvail = avail.has(to);
      const [ty, ti] = to.split(":").map(Number), toN = run.map[ty] && run.map[ty][ti];
      const fromDone = s.k.includes(">") ? (()=>{ const [fy, fi] = from.split(":").map(Number); const fn = run.map[fy] && run.map[fy][fi]; return fn && fn.done; })() : true;
      const walked = fromDone && toN && toN.done;
      let show = 0, col = "#ffffff";
      if(fromCur && toAvail){ show = 1; col = "#ffffff"; }
      else if(walked){ show = 0.6; col = "#ffd890"; }
      const s2 = show ? (show === 1 ? 0.9 + 0.5 * Math.max(0, Math.sin((d.f * 8 - t * 2.2) * Math.PI)) : 0.8) : 0;
      M.makeScale(s2 || 0.0001, s2 || 0.0001, s2 || 0.0001).setPosition(d.x, show ? d.y : -50, d.z);
      this.dots.setMatrixAt(k, M); this.dots.setColorAt(k, C.set(col));
    });
    this.dots.instanceMatrix.needsUpdate = true; if(this.dots.instanceColor) this.dots.instanceColor.needsUpdate = true;
    /* l'air autour de soi */
    if(this.air && focus){
      const p = this.airP, amb = this.B.amb;
      for(let i = 0; i < p.length; i += 3){
        if(!calm){
          if(amb === "snow"){ p[i + 1] -= dt * 0.8; p[i] += Math.sin(t + i) * dt * 0.2; }
          else if(amb === "ember"){ p[i + 1] += dt * 0.7; }
          else if(amb === "glitch"){ if(Math.random() < 0.004) p[i + 1] = Math.random() * 9; }
          else { p[i] += Math.sin(t * 0.3 + i) * dt * 0.15; p[i + 1] += Math.sin(t * 0.5 + i * 0.3) * dt * 0.1; }
        }
        if(p[i + 1] < 0) p[i + 1] += 9; if(p[i + 1] > 9) p[i + 1] -= 9;
      }
      this.air.geometry.attributes.position.needsUpdate = true;
      this.air.position.set(focus.x, this.heightAt(focus.x, focus.z), focus.z);
    }
    if(this.glitch && !calm && Math.random() < 0.05){ const {im, list} = this.glitch, j = Math.floor(Math.random() * list.length), M2 = new THREE.Matrix4(); const [wx, wz, s] = list[j];
      M2.compose(new THREE.Vector3(wx + (Math.random() - 0.5), groundH(wx, wz, this.L) + Math.random() * 2.4, wz), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); im.setMatrixAt(j, M2); im.instanceMatrix.needsUpdate = true; }
    if(this.sea) this.sea.position.y = 1.2 + Math.sin(t * 0.8) * 0.06;
  }
}
