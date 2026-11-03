/* ============================================================
   LE RÉCIT EN 3D · LES LIEUX
   Les quatorze lieux peints du jeu mobile (37e), refaits en volume.
   Le plateau parle en fractions de son décor (x de 0 à 1 de gauche à
   droite, y de 0 à 1 de haut en bas) ; chaque lieu dit comment ces
   fractions deviennent un endroit :
     room   une pièce : sous la ligne du sol, on avance vers la caméra ;
            au-dessus, on monte le long du mur du fond (le moniteur,
            les fenêtres du système, le cristal du noyau) ;
     persp  un dehors : la ligne d'horizon du dessin, et la perspective
            (un point près de l'horizon est loin sur le chemin) ;
     flat   vu d'en haut (la côte de 1996, la page) ;
     tower  la Tour : on monte le long de la façade ;
     strata les strates : trois terrasses, Kanto, Johto, Hoenn.
   Ce qui change pendant la scène (la barre bloquée à 12 %, l'intégrité,
   les sauvegardes qui s'allument, le noyau libéré, la porte de la Tour)
   est lu dans l'état du décor (st) à chaque image.
   ============================================================ */
import * as THREE from "three";

const TAU = Math.PI * 2;
const V = () => new THREE.Vector3();
function rng(seed){ let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- la boîte à outils ---------- */
export function std(c, o = {}){ return new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:0.86, metalness:0, flatShading:true}, o)); }
export function unlit(c, o = {}){ return new THREE.MeshBasicMaterial(Object.assign({color:c}, o)); }
export function glowM(c, o = 0.6){ return new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:o, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}); }
export function ctex(w, h, draw){
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const x = cv.getContext("2d"); draw && draw(x, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData = {cv, x}; return t;
}
function mesh(g, geo, m, x = 0, y = 0, z = 0, o = {}){
  const me = new THREE.Mesh(geo, m); me.position.set(x, y, z);
  if(o.ry) me.rotation.y = o.ry; if(o.rx) me.rotation.x = o.rx; if(o.rz) me.rotation.z = o.rz;
  if(o.s) me.scale.setScalar(o.s);
  me.castShadow = o.cast !== false; me.receiveShadow = o.recv !== false;
  g.add(me); return me;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const PX = "'Press Start 2P', ui-monospace, monospace";
function txt(x, s, X, Y, col, size, align = "left", font = PX){ x.font = `${size}px ${font}`; x.textAlign = align; x.textBaseline = "middle"; x.fillStyle = col; x.fillText(s, X, Y); }
/* une fenêtre du système : un panneau qui flotte, translucide */
function panel(g, w, h, tex, x, y, z, o = 0.92){
  const m = new THREE.MeshBasicMaterial({map:tex, transparent:true, opacity:o, depthWrite:false, side:THREE.DoubleSide, toneMapped:false});
  const p = mesh(g, new THREE.PlaneGeometry(w, h), m, x, y, z, {cast:false, recv:false}); p.renderOrder = 5; return p;
}
/* le sol quadrillé du système */
function gridFloor(g, col, base, size = 90, cell = 1){
  const m = new THREE.ShaderMaterial({fog:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uC:{value:new THREE.Color(col)}, uB:{value:new THREE.Color(base)}, uT:{value:0}, uCell:{value:cell}}]),
    vertexShader:`varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fragmentShader:`varying vec3 vW; uniform vec3 uC, uB; uniform float uT, uCell;
#include <fog_pars_fragment>
void main(){
  vec2 p = vW.xz / uCell, f = abs(fract(p) - 0.5), w = fwidth(p);
  float l = max(1.0 - smoothstep(0.0, w.x * 1.6, 0.5 - f.x), 1.0 - smoothstep(0.0, w.y * 1.6, 0.5 - f.y));
  float d = length(vW.xz), fade = exp(-d * 0.045);
  float ring = smoothstep(0.6, 0.0, abs(fract(d * 0.06 - uT * 0.18) - 0.5) * 2.0 - 0.9) * 0.0;
  float scan = exp(-abs(vW.z + 20.0 - mod(uT * 6.0, 40.0)) * 1.2) * 0.6;
  vec3 c = uB + uC * l * (0.16 + 0.75 * fade + scan) + uC * 0.03 * fade;
  gl_FragColor = vec4(c, 1.0);
#include <fog_fragment>
}`});
  const p = mesh(g, new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), m, 0, 0, 0, {cast:false}); p.receiveShadow = false;
  return m;
}
/* des arbres bas, en grappes */
function trees(g, list, leafC, trunkC, o = {}){
  const n = list.length, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1, 6).translate(0, 0.5, 0), o.unlit ? unlit(trunkC) : std(trunkC), n);
  const leaf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), o.unlit ? unlit(leafC) : std(leafC), n * 2);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(), P = V(), C = new THREE.Color();
  list.forEach((t, i)=>{
    const h = t.h || 3;
    M.compose(P.set(t.x, 0, t.z), Q.identity(), S.set(t.s || 1, h * 0.55, t.s || 1)); trunk.setMatrixAt(i, M);
    M.compose(P.set(t.x, h * 0.62, t.z), Q.setFromEuler(new THREE.Euler(0, t.r || 0, 0)), S.set(h * 0.42, h * 0.38, h * 0.42)); leaf.setMatrixAt(i * 2, M);
    M.compose(P.set(t.x + 0.2, h * 0.9, t.z - 0.1), Q, S.set(h * 0.3, h * 0.28, h * 0.3)); leaf.setMatrixAt(i * 2 + 1, M);
    if(!o.unlit){ C.set(leafC).offsetHSL(0, 0, (t.l || 0)); leaf.setColorAt(i * 2, C); leaf.setColorAt(i * 2 + 1, C.offsetHSL(0, 0, 0.04)); }
  });
  trunk.castShadow = leaf.castShadow = !o.unlit; trunk.receiveShadow = leaf.receiveShadow = !o.unlit;
  g.add(trunk, leaf); return {trunk, leaf};
}
/* des touffes d'herbes hautes, qui ondulent */
function tufts(g, n, area, col, R, U){
  const parts = [];
  for(let k = 0; k < 4; k++){ const p = new THREE.PlaneGeometry(0.12, 0.9, 1, 3).translate(0, 0.45, 0); const a = p.attributes.position;
    for(let i = 0; i < a.count; i++){ const y = a.getY(i); a.setX(i, a.getX(i) * (1 - y)); a.setZ(i, y * y * 0.2); }
    p.rotateY(k / 4 * Math.PI + 0.2); parts.push(p.toNonIndexed()); }
  const tot = parts.reduce((s, p)=>s + p.attributes.position.count, 0), pos = new Float32Array(tot * 3); let o = 0;
  for(const p of parts){ pos.set(p.attributes.position.array, o); o += p.attributes.position.array.length; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.computeVertexNormals();
  const m = std(col, {side:THREE.DoubleSide, flatShading:false});
  m.onBeforeCompile = sh => { sh.uniforms.uT = U;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uT;").replace("#include <begin_vertex>",
      `#include <begin_vertex>
  { vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float k = transformed.y * transformed.y; transformed.x += sin(uT * 1.6 + ip.x * 0.7 + ip.z * 0.4) * 0.16 * k; transformed.z += cos(uT * 1.2 + ip.z * 0.6) * 0.1 * k; }`); };
  const im = new THREE.InstancedMesh(geo, m, n), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(), P = V();
  for(let i = 0; i < n; i++){ const s = 0.8 + R() * 0.7; M.compose(P.set(area.x0 + R() * (area.x1 - area.x0), 0, area.z0 + R() * (area.z1 - area.z0)), Q.setFromEuler(new THREE.Euler(0, R() * TAU, 0)), S.set(s, s * (0.8 + R() * 0.5), s)); im.setMatrixAt(i, M); }
  im.receiveShadow = true; g.add(im); return im;
}
function pokeBall(g, x, y, z, s = 0.13){
  const b = new THREE.Group(); b.position.set(x, y, z);
  const top = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8, 0, TAU, 0, Math.PI / 2), std("#d8283a", {flatShading:false, roughness:0.4}));
  const bot = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), std("#f2f0ea", {flatShading:false, roughness:0.4}));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.01, s * 1.01, s * 0.16, 16), std("#1a1a1a"));
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.3, s * 0.12, 12).rotateX(Math.PI / 2).translate(0, 0, s * 0.98), std("#f2f0ea"));
  for(const p of [top, bot, band, btn]){ p.castShadow = true; b.add(p); }
  g.add(b); return b;
}

/* ============================================================
   LES CORRESPONDANCES : une fraction du décor → un point du lieu
   ============================================================ */
function roomMap(o){
  const O = Object.assign({fl:0.5, W:12, D:7, wallZ:-5, wallH:12, gap:0.7, band:0.64, lookY:0.85, dist:5.9, up:0.24, camFl:null}, o);
  O.camFl = O.camFl === null ? O.fl - 0.1 : O.camFl;
  return Object.assign(O, {
    feet(fx, fy, out = V()){
      if(fy >= O.fl) return out.set((fx - 0.5) * O.W, 0, O.wallZ + O.gap + (fy - O.fl) / (1 - O.fl) * O.D);
      return out.set((fx - 0.5) * O.W, (O.fl - fy) * O.wallH, O.wallZ + O.gap * 0.4);
    },
    floorAt(fx, fy, out){ return O.feet(fx, Math.max(fy, O.fl + 0.001), out); }
  });
}
function perspMap(o){
  const O = Object.assign({hz:0.4, W:9, C:2, band:0.64, z0:0, lookY:0.85, dist:7.2, up:0.24, sky:70}, o);
  return Object.assign(O, {
    feet(fx, fy, out = V()){
      if(fy < O.hz + 0.012){ return out.set((fx - 0.5) * O.sky * 1.4, (O.hz - fy) * O.sky + 6, O.z0 - O.sky * 1.2); }
      const d = Math.max(0.012, fy - O.hz), s = (O.band - O.hz) / d;
      return out.set((fx - 0.5) * O.W * s, O.ground ? O.ground((fx - 0.5) * O.W * s, O.z0 + O.C / (O.band - O.hz) - O.C / d) : 0, O.z0 + O.C / (O.band - O.hz) - O.C / d);
    },
    floorAt(fx, fy, out){ return O.feet(fx, Math.max(fy, O.hz + 0.05), out); },
    camFl:o.camFl !== undefined ? o.camFl : (o.hz || 0.4) - 0.03
  });
}
function flatMap(o){
  const O = Object.assign({W:14, D:22, band:0.62, lookY:0.6, dist:11, up:0.9}, o);
  return Object.assign(O, {
    feet(fx, fy, out = V()){ return out.set((fx - 0.5) * O.W, O.y || 0, (fy - O.band) * O.D); },
    floorAt(fx, fy, out){ return O.feet(fx, fy, out); },
    camFl:-1
  });
}

/* ============================================================
   LES LIEUX
   env : le ciel (haut, bas), le brouillard, la lumière d'ambiance,
   le soleil ; build() bâtit le lieu et rend ce qui bouge.
   ============================================================ */
export const SETS3D = {};

/* ---------- le laboratoire du Prof. Racine ---------- */
SETS3D.labo = {
  map:roomMap({fl:0.47, W:12, D:7, wallZ:-4.5, wallH:13, gap:0.8}),
  env(v){
    if(v === "clean") return {sky:["#f4f6fa", "#e6eaf0"], fog:["#e9edf2", 0.012], hemi:["#ffffff", "#b8b4a8", 1.5], sun:["#ffffff", 2.2, [-6, 9, 6]], exp:1.05};
    if(v === "souvenir") return {sky:["#d8cdb4", "#c4b496"], fog:["#cfc2a2", 0.018], hemi:["#fff2d8", "#7a6650", 1.25], sun:["#ffe8c0", 1.8, [-6, 8, 6]], exp:1.0};
    return {sky:["#efe2c6", "#d8c5a0"], fog:["#e2d2b0", 0.014], hemi:["#fff1dc", "#8a7050", 1.2], sun:["#ffe2b0", 2.1, [-7, 8, 5]], exp:1.0};
  },
  build(g, v){
    const R = rng(7), W = -4.5;
    const floorT = ctex(256, 256, (x, w, h)=>{ for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++){ x.fillStyle = (i + j) % 2 ? "#ebe1cb" : "#d9ccb0"; x.fillRect(i * 32, j * 32, 32, 32); x.fillStyle = "rgba(120,96,64,.18)"; x.fillRect(i * 32, j * 32, 32, 1); x.fillRect(i * 32, j * 32, 1, 32); } });
    floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(4, 3);
    mesh(g, new THREE.PlaneGeometry(18, 13).rotateX(-Math.PI / 2), std("#ffffff", {map:floorT, flatShading:false, roughness:0.55}), 0, 0, 1.5, {cast:false});
    const wallM = std("#ece1c9", {flatShading:false});
    mesh(g, new THREE.PlaneGeometry(18, 7), wallM, 0, 3.5, W, {cast:false});
    mesh(g, new THREE.PlaneGeometry(13, 7), wallM, -8.2, 3.5, 1.4, {ry:Math.PI / 2 - 0.12, cast:false});
    mesh(g, new THREE.PlaneGeometry(13, 7), wallM, 8.2, 3.5, 1.4, {ry:-Math.PI / 2 + 0.12, cast:false});
    const wood = std("#7a4c2c");
    mesh(g, box(18, 1.0, 0.12), wood, 0, 0.5, W + 0.06);
    mesh(g, box(18, 0.08, 0.16), std("#5a3820"), 0, 1.02, W + 0.08);
    /* la fenêtre, et la lumière qui entre */
    mesh(g, box(1.9, 1.5, 0.12), std("#b9a987"), -5.2, 3.1, W + 0.07);
    const glass = mesh(g, new THREE.PlaneGeometry(1.7, 1.3), unlit(v === "souvenir" ? "#f2e6c8" : "#d6ecff"), -5.2, 3.1, W + 0.14, {cast:false});
    mesh(g, box(0.06, 1.3, 0.05), std("#b9a987"), -5.2, 3.1, W + 0.16); mesh(g, box(1.7, 0.06, 0.05), std("#b9a987"), -5.2, 3.1, W + 0.16);
    const shaft = mesh(g, new THREE.PlaneGeometry(1.8, 6.5), glowM("#fff4d6", 0.07), -4.2, 2.2, W + 2.6, {rx:-0.62, ry:0.25, cast:false});
    /* l'horloge */
    mesh(g, new THREE.CylinderGeometry(0.34, 0.34, 0.06, 20).rotateX(Math.PI / 2), std("#f6f0e2"), -3.2, 4.4, W + 0.05);
    const hand = mesh(g, box(0.03, 0.24, 0.02), std("#2a2620"), -3.2, 4.4, W + 0.1); hand.geometry.translate(0, 0.1, 0);
    /* le moniteur : le tableau vert où le monde s'initialise */
    mesh(g, box(3.4, 2.0, 0.16), std("#3a3a34"), 0, 1.82, W + 0.1);
    const scrT = ctex(512, 288);
    const scr = mesh(g, new THREE.PlaneGeometry(3.1, 1.74), new THREE.MeshBasicMaterial({map:scrT, toneMapped:false}), 0, 1.82, W + 0.19, {cast:false});
    const scrLight = new THREE.PointLight("#7af0b0", 3.5, 6, 1.6); scrLight.position.set(0, 1.8, W + 1.2); g.add(scrLight);
    /* la bibliothèque */
    mesh(g, box(2.4, 3.6, 0.6), std("#6b4428"), 4.6, 1.8, W + 0.3);
    for(let s = 0; s < 4; s++){ mesh(g, box(2.2, 0.06, 0.5), std("#4e301a"), 4.6, 0.45 + s * 0.85, W + 0.4);
      let bx = 3.6; while(bx < 5.5){ const bw = 0.08 + R() * 0.12, bh = 0.45 + R() * 0.3; mesh(g, box(bw, bh, 0.36), std(["#a33a2e", "#2e5aa3", "#3a8a4a", "#c9a03a", "#6a3a8a", "#d8cfbd"][Math.floor(R() * 6)]), bx + bw / 2, 0.48 + s * 0.85 + bh / 2, W + 0.45); bx += bw + 0.02; } }
    pokeBall(g, 4.0, 3.62 + 0.1, W + 0.45, 0.1); pokeBall(g, 4.4, 3.72, W + 0.45, 0.1);
    /* la table aux trois Poké Balls */
    const tb = std("#8a5a34");
    mesh(g, box(2.4, 0.1, 0.95), tb, -3.0, 0.82, -2.55);
    for(const [dx, dz] of [[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]]) mesh(g, box(0.08, 0.8, 0.08), tb, -3.0 + dx, 0.4, -2.55 + dz);
    for(let i = 0; i < 3; i++) pokeBall(g, -3.6 + i * 0.6, 1.0, -2.55);
    /* une plante, une chaise */
    mesh(g, new THREE.CylinderGeometry(0.22, 0.17, 0.4, 10), std("#b06a3a"), 6.6, 0.2, -3.6);
    for(let i = 0; i < 6; i++){ const a = i / 6 * TAU; mesh(g, new THREE.ConeGeometry(0.12, 0.8, 5), std("#4a8a3a"), 6.6 + Math.cos(a) * 0.12, 0.75, -3.6 + Math.sin(a) * 0.12, {rz:Math.cos(a) * 0.4, rx:Math.sin(a) * 0.4}); }
    /* deux lampes au plafond */
    for(const lx of [-3, 3]){ const l = new THREE.PointLight(v === "clean" ? "#ffffff" : "#ffdcae", 6, 12, 1.4); l.position.set(lx, 4.6, -1); g.add(l); }
    let last = null;
    return (t, dt, st, P) => {
      hand.rotation.z = -t * 0.05;
      shaft.material.opacity = 0.06 + Math.sin(t * 0.7) * 0.015;
      /* la barre : 12 % au premier jour ; « Bienvenue » dans les souvenirs chauds ; 100 % quand tout est propre */
      let val = st.bar !== undefined ? st.bar : v === "clean" ? 100 : (v === "warm" && !st.bar) ? -1 : 12;
      if(st.barTo !== undefined){ const k = Math.min(1, (P.t - st.t0) / ((st.barMs || 2600) / 1000)); val = Math.round(st.bar + (st.barTo - st.bar) * (k * k * (3 - 2 * k))); }
      const key = val + "|" + Math.floor(t * 2) % 2;
      if(key !== last){ last = key;
        const x = scrT.userData.x, w = 512, h = 288;
        x.fillStyle = "#0e3326"; x.fillRect(0, 0, w, h);
        x.fillStyle = "rgba(255,255,255,.04)"; for(let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1);
        if(val < 0){ txt(x, "BIENVENUE", 34, 70, "#dff7e6", 26); txt(x, "SAUVEGARDE", 34, 130, "#bfe8cc", 22); txt(x, "D'ORIGINE", 34, 170, "#bfe8cc", 22); if(Math.floor(t * 2) % 2) { x.fillStyle = "#dff7e6"; x.fillRect(34, 210, 18, 26); } }
        else { txt(x, "INITIALISATION", 34, 64, "#dff7e6", 22); txt(x, "DU MONDE.", 34, 104, "#dff7e6", 22);
          x.strokeStyle = "#bfe8cc"; x.lineWidth = 4; x.strokeRect(34, 150, 444, 42); x.fillStyle = val >= 100 ? "#7af0b0" : "#bfe8cc"; x.fillRect(42, 158, Math.max(0, Math.min(1, val / 100)) * 428, 26);
          txt(x, val + "%", w / 2, 236, "#dff7e6", 26, "center"); }
        scrT.needsUpdate = true; }
      scrLight.intensity = 3 + Math.sin(t * 3) * 0.3;
    };
  }
};

/* ---------- le terminal de Porygon-Z ---------- */
SETS3D.terminal = {
  map:roomMap({fl:0.5, W:12, D:8, wallZ:-6, wallH:14, gap:0.8}),
  env(){ return {sky:["#01040a", "#03101a"], fog:["#020a12", 0.035], hemi:["#4fd8d0", "#020408", 0.55], sun:["#8ff7ea", 0.6, [3, 9, 6]], exp:1.15}; },
  build(g){
    const gm = gridFloor(g, "#35f0d6", "#02060c", 120, 1);
    /* l'horizon du système : une lueur, et des colonnes de données au loin */
    mesh(g, new THREE.PlaneGeometry(160, 22), new THREE.MeshBasicMaterial({map:ctex(4, 128, (x, w, h)=>{ const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(53,240,214,0)"); gr.addColorStop(0.85, "rgba(53,240,214,.22)"); gr.addColorStop(1, "rgba(53,240,214,0)"); x.fillStyle = gr; x.fillRect(0, 0, w, h); }), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false}), 0, 10, -48, {cast:false});
    /* le grand compteur : l'intégrité du monde */
    const cT = ctex(640, 200), counter = panel(g, 5.2, 1.62, cT, 0, 3.7, -6.4);
    const fT = ctex(400, 260, (x, w, h)=>{ x.fillStyle = "rgba(3,14,22,.82)"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(53,240,214,.8)"; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4);
      x.fillStyle = "#0e3a48"; x.fillRect(4, 4, w - 8, 40); txt(x, "JOURNAL_LOG", 16, 25, "#8ff7ea", 16);
      for(let i = 0; i < 7; i++){ x.fillStyle = i % 3 ? "rgba(143,247,234,.55)" : "rgba(255,61,127,.6)"; x.fillRect(18, 64 + i * 26, 120 + (i * 53) % 220, 8); } });
    const log = panel(g, 2.6, 1.7, fT, -3.1, 2.4, -5.6);
    const iT = ctex(360, 300, (x, w, h)=>{ x.fillStyle = "rgba(3,14,22,.82)"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(53,240,214,.8)"; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4);
      txt(x, "INDEX", 16, 26, "#8ff7ea", 16); for(let i = 0; i < 9; i++){ x.fillStyle = "rgba(143,247,234,.4)"; x.fillRect(16, 56 + i * 26, 30, 10); x.fillRect(56, 56 + i * 26, 80 + (i * 71) % 180, 10); } });
    const idx = panel(g, 2.3, 1.9, iT, 3.3, 2.9, -5.8);
    const sT = ctex(256, 120, (x, w, h)=>{ x.fillStyle = "rgba(3,14,22,.8)"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(53,240,214,.6)"; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); for(let i = 0; i < 4; i++){ x.fillStyle = "rgba(143,247,234,.5)"; x.fillRect(12, 18 + i * 24, 60 + i * 40, 8); } });
    const small = panel(g, 1.4, 0.66, sT, 0.4, 1.9, -5.2);
    const glow = new THREE.PointLight("#35f0d6", 7, 14, 1.3); glow.position.set(0, 2.5, -2); g.add(glow);
    /* des données qui montent, ici et là */
    const motes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), unlit("#8ff7ea", {transparent:true, opacity:0.7}), 90), M = new THREE.Matrix4(), R = rng(3), mm = [];
    for(let i = 0; i < 90; i++) mm.push({x:(R() - 0.5) * 22, z:-8 + R() * 12, y:R() * 6, v:0.2 + R() * 0.5});
    g.add(motes);
    let last = "";
    return (t, dt, st, P) => {
      gm.uniforms.uT.value = t;
      for(const [p, k] of [[counter, 0], [log, 1], [idx, 2], [small, 3]]) p.position.y += Math.sin(t * 0.8 + k * 1.7) * 0.0016;
      mm.forEach((m, i)=>{ m.y += m.v * dt; if(m.y > 7) m.y = 0; M.makeTranslation(m.x, m.y, m.z); motes.setMatrixAt(i, M); }); motes.instanceMatrix.needsUpdate = true;
      /* l'intégrité : la vraie (celle de la partie), ou la suite que la scène fait défiler */
      let val = st.integ !== undefined ? st.integ : (window.PCG && window.PCG.S ? window.PCG.S.integrity || 0 : 0);
      if(st.integSeq){ const k = Math.min(st.integSeq.length - 1, Math.floor((P.t - st.t0) / (st.integStep || 0.4))); val = st.integSeq[Math.max(0, k)]; }
      const s = (Math.round(val * 10) / 10).toFixed(1).replace(".", ",") + " %";
      if(s !== last){ last = s; const x = cT.userData.x; x.clearRect(0, 0, 640, 200);
        x.fillStyle = "rgba(3,14,22,.55)"; x.fillRect(0, 0, 640, 200); x.strokeStyle = "rgba(53,240,214,.5)"; x.lineWidth = 2; x.strokeRect(1, 1, 638, 198);
        txt(x, "INTÉGRITÉ DU MONDE", 320, 46, "#8ff7ea", 20, "center"); x.shadowColor = "#35f0d6"; x.shadowBlur = 18; txt(x, s, 320, 128, "#ffffff", 52, "center"); x.shadowBlur = 0;
        cT.needsUpdate = true; }
      glow.intensity = 6 + Math.sin(t * 1.3) * 1.2;
    };
  }
};

/* ---------- la Route 1 ---------- */
SETS3D.route = {
  map:perspMap({hz:0.37, W:9, C:2.2, band:0.64}),
  env(v){
    if(v === "dusk") return {sky:["#3a2a5a", "#ff9a5a"], fog:["#a86a5a", 0.02], hemi:["#ffb48a", "#3a2a30", 0.95], sun:["#ff8a4a", 2.4, [-20, 6, -18]], exp:1.0};
    if(v === "night") return {sky:["#050818", "#1a2448"], fog:["#0e1430", 0.03], hemi:["#6a7ab8", "#06080e", 0.55], sun:["#9ab0ff", 0.9, [10, 18, -6]], exp:1.25};
    return {sky:["#5a8ad8", "#cfe2f2"], fog:["#b8cfe0", 0.012], hemi:["#e8f2ff", "#4a5a2a", 1.15], sun:["#fff2d0", 2.4, [-8, 14, 6]], exp:1.0};
  },
  build(g, v){
    const R = rng(11), U = {value:0};
    const night = v === "night", dusk = v === "dusk";
    const grassC = night ? "#24402a" : dusk ? "#5a6a30" : "#4f8a3a";
    mesh(g, new THREE.PlaneGeometry(260, 260, 40, 40).rotateX(-Math.PI / 2), std(grassC, {flatShading:false}), 0, 0, -60, {cast:false});
    /* le chemin de terre, qui part au loin en tournant un peu */
    const pts = []; for(let z = 14; z >= -110; z -= 2) pts.push([-0.2 - 0.085 * Math.min(0, z) + Math.sin(z * 0.05) * 0.3, z]);
    const pos = [], idx = [];
    pts.forEach(([x, z], i)=>{ const w = 1.15 + (z < -30 ? 0.3 : 0); pos.push(x - w, 0.02, z, x + w, 0.02, z); if(i){ const a = i * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); pg.setIndex(idx); pg.computeVertexNormals();
    mesh(g, pg, std(night ? "#5a5040" : dusk ? "#a07a50" : "#c4a674", {flatShading:false}), 0, 0, 0, {cast:false});
    /* les hautes herbes, à droite du chemin */
    tufts(g, 520, {x0:2.1, x1:9, z0:-7, z1:4}, night ? "#2a5030" : "#3d7a30", R, U);
    tufts(g, 160, {x0:-9, x1:-4, z0:-14, z1:-6}, night ? "#2a5030" : "#3d7a30", R, U);
    /* des arbres, de part et d'autre */
    const T = [];
    for(let i = 0; i < 70; i++){ const side = i % 2 ? 1 : -1, z = -6 - R() * 90, x = side * (6 + R() * 22) + (side > 0 ? -0.085 * z : 0); if(Math.abs(x - (-0.2 - 0.085 * z)) < 4) continue; T.push({x, z, h:3 + R() * 2.5, r:R() * 6, l:(R() - 0.5) * 0.06}); }
    trees(g, T, night ? "#1e3a24" : dusk ? "#3a5a2a" : "#2f6a32", "#4a3020");
    /* le panneau */
    mesh(g, box(0.12, 1.3, 0.12), std("#5a3a22"), -3.5, 0.65, -2.3);
    const sT = ctex(256, 96, (x, w, h)=>{ x.fillStyle = "#c79a5a"; x.fillRect(0, 0, w, h); x.strokeStyle = "#5a3a22"; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); txt(x, "ROUTE 1", w / 2, h / 2 + 2, "#3a2414", 26, "center"); });
    mesh(g, box(1.3, 0.5, 0.08), [std("#8a6038"), std("#8a6038"), std("#8a6038"), std("#8a6038"), std("#ffffff", {map:sT}), std("#8a6038")], -3.5, 1.35, -2.3, {ry:0.25});
    /* des collines, au loin */
    for(let i = 0; i < 9; i++) mesh(g, new THREE.SphereGeometry(1, 10, 6), std(night ? "#1a2a22" : dusk ? "#4a4a3a" : "#5a8a5a"), -90 + i * 24, -6, -150 - R() * 30, {cast:false}).scale.set(26 + R() * 18, 16 + R() * 10, 14);
    /* des nuages */
    const cl = unlit(night ? "#2a3048" : dusk ? "#ffc8a8" : "#ffffff", {fog:false});
    for(let i = 0; i < 7; i++){ const c = new THREE.Group(); c.position.set(-80 + R() * 160, 28 + R() * 14, -140 - R() * 40); for(let k = 0; k < 4; k++){ const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), cl); m.position.set(k * 4 - 6, Math.sin(k) * 1.2, 0); m.scale.set(4 + R() * 3, 2 + R() * 1.2, 3); c.add(m); } g.add(c); }
    if(night){ const moon = mesh(g, new THREE.SphereGeometry(5, 16, 10), unlit("#e8ecff", {fog:false}), 30, 60, -180, {cast:false}); moon.material.toneMapped = false; }
    return (t)=>{ U.value = t; };
  }
};

/* ---------- le ciel de Hoenn : une falaise au-dessus de la mer ---------- */
SETS3D.ciel = {
  map:perspMap({hz:0.47, W:9, C:1.6, band:0.66}),
  env(){ return {sky:["#9aa6b0", "#d8d6cc"], fog:["#c8c8c0", 0.016], hemi:["#f0f0ea", "#6a6a5a", 1.15], sun:["#fff6e0", 1.7, [-10, 14, 4]], exp:1.0}; },
  build(g){
    const R = rng(23);
    /* le plateau herbu, qui finit en falaise (le bord file vers la droite) */
    const edge = z => 1.4 + 0.42 * z;
    const shp = new THREE.Shape(); shp.moveTo(-60, 20); shp.lineTo(edge(20), 20);
    for(let z = 20; z >= -80; z -= 4) shp.lineTo(edge(z) + Math.sin(z * 0.7) * 0.4, z);
    shp.lineTo(-60, -80); shp.closePath();
    const top = new THREE.ExtrudeGeometry(shp, {depth:40, bevelEnabled:false}); top.rotateX(Math.PI / 2);
    mesh(g, top, [std("#7a8a5a"), std("#6a6458")], 0, 0, 0, {cast:false});
    tufts(g, 160, {x0:-9, x1:-1.5, z0:-6, z1:1.5}, "#8a9a62", R, {value:0});
    /* la mer, loin en bas, et ses reflets */
    const sea = mesh(g, new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), std("#6a7a86", {roughness:0.25, metalness:0.2, flatShading:false}), 0, -40, -100, {cast:false});
    /* des nuages bas, à hauteur de la falaise */
    const cl = std("#f2f0ea", {roughness:1});
    const clouds = [];
    for(let i = 0; i < 12; i++){ const c = new THREE.Group(); c.position.set(10 + R() * 120, -8 + R() * 18, -40 - R() * 140); for(let k = 0; k < 5; k++){ const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), cl); m.position.set(k * 3 - 6, Math.sin(k * 1.7) * 1.4, Math.cos(k) * 1.5); m.scale.set(4 + R() * 3, 2 + R() * 1.4, 3.5); c.add(m); } g.add(c); clouds.push(c); }
    /* un poteau seul, au bout du monde */
    mesh(g, new THREE.CylinderGeometry(0.08, 0.1, 4, 6), std("#3a3a3a"), 9, 2, -24);
    mesh(g, box(0.4, 0.3, 0.3), std("#2a2a2a", {emissive:"#fff2c8", emissiveIntensity:0.4}), 9, 4.1, -24);
    return (t, dt)=>{ clouds.forEach((c, i)=>{ c.position.x -= dt * (0.4 + i % 3 * 0.2); if(c.position.x < -40) c.position.x = 140; }); sea.material.color.setHSL(0.57, 0.12, 0.44 + Math.sin(t * 0.3) * 0.01); };
  }
};

/* ---------- la faille : une île qui flotte dans le vide, et la pluie magenta ---------- */
SETS3D.faille = {
  map:roomMap({fl:0.58, W:12, D:7, wallZ:-5, wallH:14, gap:0.6}),
  env(){ return {sky:["#05010a", "#1a0418"], fog:["#0a0410", 0.035], hemi:["#ff8ac8", "#05000a", 0.6], sun:["#ff9ad0", 0.9, [4, 10, 6]], exp:1.2}; },
  build(g){
    const R = rng(31);
    /* l'île : un dessus d'herbe, un dessous de terre et de racines */
    const isl = new THREE.Group(); isl.position.set(0, 0, -1.2); g.add(isl);
    mesh(isl, new THREE.CylinderGeometry(7.5, 7.2, 0.4, 16).translate(0, -0.2, 0), std("#3e6a34"), 0, 0, 0, {cast:false});
    mesh(isl, new THREE.ConeGeometry(7.2, 9, 14).rotateX(Math.PI).translate(0, -4.9, 0), std("#3a2618"), 0, 0, 0, {cast:false});
    for(let i = 0; i < 18; i++){ const a = R() * TAU, r = 2 + R() * 4; mesh(isl, new THREE.DodecahedronGeometry(0.4 + R() * 0.6, 0), std("#2a1a10"), Math.cos(a) * r, -1.5 - R() * 5, Math.sin(a) * r); }
    tufts(isl, 140, {x0:-6, x1:6, z0:-5, z1:4}, "#4a7a3a", R, {value:0});
    /* des dalles qui dérivent */
    const slabs = [];
    for(let i = 0; i < 9; i++){ const s = mesh(g, box(1.2 + R() * 2, 0.3, 1 + R()), std("#2a2030"), (R() - 0.5) * 40, -2 + R() * 14, -14 - R() * 20); slabs.push({m:s, y:s.position.y, p:R() * 6}); }
    /* la pluie de la faille : des traits qui tombent */
    const N = 160, rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 1, 0.03), new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, opacity:0.75, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}), N);
    const drops = []; for(let i = 0; i < N; i++) drops.push({x:(R() - 0.5) * 50, z:-30 + R() * 34, y:R() * 30, v:4 + R() * 6, l:1 + R() * 4});
    g.add(rain);
    const glow = new THREE.PointLight("#ff3d7f", 10, 16, 1.4); glow.position.set(-2.5, 3, -2); g.add(glow);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(), P = V();
    return (t, dt)=>{
      drops.forEach((d, i)=>{ d.y -= d.v * dt; if(d.y < -12) d.y = 26; M.compose(P.set(d.x, d.y, d.z), Q, S.set(1, d.l, 1)); rain.setMatrixAt(i, M); }); rain.instanceMatrix.needsUpdate = true;
      slabs.forEach(s=>{ s.m.position.y = s.y + Math.sin(t * 0.5 + s.p) * 0.4; s.m.rotation.y = t * 0.05 + s.p; });
      glow.intensity = 9 + Math.sin(t * 2.2) * 3;
    };
  }
};

/* ---------- la Couche Zéro ---------- */
SETS3D.zero = {
  map:roomMap({fl:0.55, W:12, D:8, wallZ:-7, wallH:14, gap:0.8}),
  env(){ return {sky:["#020108", "#0a0418"], fog:["#06030e", 0.03], hemi:["#9a7aff", "#020106", 0.5], sun:["#c8b0ff", 0.6, [3, 9, 6]], exp:1.2}; },
  build(g){
    const gm = gridFloor(g, "#7a4cff", "#03020a", 120, 1.2);
    const R = rng(77);
    /* les rangées de données, au fond, qui défilent */
    const dT = ctex(1024, 512); dT.wrapS = dT.wrapT = THREE.RepeatWrapping;
    { const x = dT.userData.x, R = rng(5); x.fillStyle = "#04020c"; x.fillRect(0, 0, 1024, 512);
      for(let row = 0; row < 24; row++){ const y = 10 + row * 21; for(let k = 0; k < 60; k++){ x.fillStyle = R() < 0.08 ? "rgba(255,61,127,.7)" : `rgba(${150 + R() * 60 | 0},${150 + R() * 60 | 0},${180 + R() * 60 | 0},${0.25 + R() * 0.4})`; x.fillRect(8 + k * 17, y, 4 + R() * 10, 6); } } }
    const wall = mesh(g, new THREE.PlaneGeometry(60, 26), new THREE.MeshBasicMaterial({map:dT, transparent:true, opacity:0.75, toneMapped:false, fog:false}), 0, 11, -24, {cast:false});
    dT.repeat.set(2, 1);
    /* là-haut, les trois couches du monde, empilées de travers et cassées : Kanto, Johto, Hoenn.
       Des blocs de leurs couleurs, avec des trous ; on voit leur dessous, qui ne tient à rien */
    const PAL = [["#9bbc0f", "#8bac0f", "#306230", "#0f380f"], ["#f8c8b0", "#d86848", "#983020", "#401008"], ["#d8f8ff", "#60c8f8", "#2080d0", "#0c3070"]];
    const strata = [];
    PAL.forEach((pal, li)=>{
      const n = 260, im = new THREE.InstancedMesh(box(1, 1, 1), new THREE.MeshBasicMaterial({fog:false, toneMapped:false}), n);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(), P = V(), C = new THREE.Color();
      const y0 = 7.6 + li * 3.6, tilt = [0.07, -0.09, 0.05][li], shift = [-3, 4, -1][li];
      let k = 0;
      for(let gx = 0; gx < 26 && k < n; gx++) for(let gz = 0; gz < 7 && k < n; gz++){
        if(R() < 0.18) continue;                                   /* un trou */
        const s = 2.4, x = -31 + gx * s + shift + (R() - 0.5) * 0.4, z = -16 - gz * s * 1.1;
        const y = y0 + (x * tilt) + (R() - 0.5) * 0.5 + (gz > 4 ? (R() - 0.5) * 1.6 : 0);
        M.compose(P.set(x, y, z), Q.setFromEuler(new THREE.Euler((R() - 0.5) * 0.12, 0, tilt + (R() - 0.5) * 0.1)), S.set(s * 0.97, 0.7 + R() * 0.9, s * 1.05));
        im.setMatrixAt(k, M);
        const top = pal[Math.floor(R() * 4)];
        im.setColorAt(k, C.set(R() < 0.22 ? ["#08070f", "#7e7a9a", "#b8346a", "#2a9a8c"][Math.floor(R() * 4)] : top).multiplyScalar(0.42 + R() * 0.25 - li * 0.04));
        k++;
      }
      im.count = k; g.add(im); strata.push(im);
      /* le bord de chaque couche : une ligne de lumière, magenta ou cyan */
      const edge = mesh(g, box(64, 0.05, 0.05), unlit(li % 2 ? "#35f0d6" : "#ff3d7f", {fog:false, toneMapped:false, transparent:true, opacity:0.55}), shift, y0 - 0.5 + shift * tilt, -15, {cast:false, rz:tilt});
      edge.renderOrder = 2;
    });
    /* des blocs de données qui flottent, là où personne ne se bat */
    const blocks = [], bm = new THREE.MeshStandardMaterial({roughness:0.5, emissive:"#ffffff", emissiveIntensity:0.55, flatShading:true});
    bm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor;"); };
    for(const [bx, by, bz, col] of [[-9, 2.4, -6, "#ff3d7f"], [-11.5, 4.2, -11, "#35f0d6"], [9.5, 3.1, -7, "#35f0d6"], [12, 1.6, -12, "#ff3d7f"], [-7.5, 5.6, -15, "#ff3d7f"], [7, 6.2, -16, "#35f0d6"]]){
      const cubes = new THREE.InstancedMesh(box(0.26, 0.26, 0.26), bm, 216), M = new THREE.Matrix4(), C = new THREE.Color(); let k = 0;
      for(let i = 0; i < 6; i++) for(let j = 0; j < 6; j++) for(let l = 0; l < 6; l++){
        if(R() > 0.42) continue;
        M.makeTranslation((i - 2.5) * 0.27, (j - 2.5) * 0.27, (l - 2.5) * 0.27); cubes.setMatrixAt(k, M);
        cubes.setColorAt(k, C.set(R() < 0.55 ? col : ["#1c1830", "#7e7a9a", "#b8346a", "#2a9a8c"][Math.floor(R() * 4)])); k++;
      }
      cubes.count = k; cubes.position.set(bx, by, bz); cubes.castShadow = true; g.add(cubes);
      blocks.push({m:cubes, y:by, p:R() * 6});
    }
    /* au sol, le cercle : celui que le jeu mobile trace sous le combat */
    const ring = new THREE.Group(); ring.position.set(0, 0.012, -2.4); g.add(ring);
    const r1 = new THREE.Mesh(new THREE.RingGeometry(4.55, 4.66, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, opacity:0.75, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    ring.add(r1);
    const dash = new THREE.InstancedMesh(box(0.42, 0.01, 0.06), new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}), 40);
    { const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(1, 1, 1), P = V();
      for(let i = 0; i < 40; i++){ const a = i / 40 * TAU; M.compose(P.set(Math.cos(a) * 3.95, 0, Math.sin(a) * 3.95), Q.setFromAxisAngle(V().set(0, 1, 0), -a + Math.PI / 2), S); dash.setMatrixAt(i, M); } }
    const spin = new THREE.Group(); spin.add(dash); ring.add(spin);
    const ticks = new THREE.InstancedMesh(box(0.06, 0.012, 0.22), new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}), 24);
    { const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(1, 1, 1), P = V();
      for(let i = 0; i < 24; i++){ const a = i / 24 * TAU; M.compose(P.set(Math.cos(a) * 4.3, 0, Math.sin(a) * 4.3), Q.setFromAxisAngle(V().set(0, 1, 0), -a), S); ticks.setMatrixAt(i, M); } }
    const spin2 = new THREE.Group(); spin2.add(ticks); ring.add(spin2);
    /* des tuiles qui tombent d'en haut, sans se presser, et s'éteignent au sol */
    const NT = 70, tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({side:THREE.DoubleSide, toneMapped:false, fog:false, transparent:true, opacity:0.85}), NT);
    const TL = [], TC = new THREE.Color();
    for(let i = 0; i < NT; i++){ const pal = PAL[i % 3]; TL.push({x:(R() - 0.5) * 26, z:-2 - R() * 20, y:R() * 14, v:0.35 + R() * 0.5, r:R() * 6, rs:(R() - 0.5) * 2});
      tiles.setColorAt(i, TC.set(pal[Math.floor(R() * 4)]).multiplyScalar(0.8)); }
    tiles.frustumCulled = false; g.add(tiles);
    const TM = new THREE.Matrix4(), TQ = new THREE.Quaternion(), TS = V(1, 1, 1), TP = V(), TE = new THREE.Euler();
    const glow = new THREE.PointLight("#9a6aff", 6, 16, 1.3); glow.position.set(0, 3, -1); g.add(glow);
    return (t, dt)=>{
      gm.uniforms.uT.value = t; dT.offset.y = (t * 0.02) % 1;
      const calm = typeof window.calmFx === "function" && window.calmFx();
      strata.forEach((im, i)=>{ im.position.y = Math.sin(t * 0.12 + i * 2) * 0.35; im.position.x = Math.sin(t * 0.05 + i) * 0.6; });
      for(const b of blocks){ b.m.position.y = b.y + Math.sin(t * 0.7 + b.p) * 0.3; b.m.rotation.y = t * 0.15 + b.p; b.m.rotation.x = Math.sin(t * 0.2 + b.p) * 0.2; }
      spin.rotation.y = t * 0.08; spin2.rotation.y = -t * 0.03;
      r1.material.opacity = 0.6 + Math.sin(t * 1.8) * 0.15;
      const d = Math.min(0.1, dt || 0.016);
      TL.forEach((p, i)=>{
        if(!calm){ p.y -= p.v * d; p.r += p.rs * d; }
        if(p.y < 0.05){ p.y = 12 + R() * 3; p.x = (R() - 0.5) * 26; p.z = -2 - R() * 20; }
        TM.compose(TP.set(p.x, p.y, p.z), TQ.setFromEuler(TE.set(p.r, p.r * 0.7, 0)), TS.setScalar(Math.min(1, p.y * 2)));
        tiles.setMatrixAt(i, TM);
      });
      tiles.instanceMatrix.needsUpdate = true;
    };
  }
};

/* ---------- la Tour : on monte le long de la façade ---------- */
const TOWER = {base:0.833, Hs:25, W:12, wallZ:-3, ledge:1.1, D:7};
SETS3D.tour = {
  map:Object.assign({lookY:1.1, dist:9.2, up:0.22, band:0.83, camFl:0.79}, {
    feet(fx, fy, out = V()){
      const T = TOWER;
      if(fy >= 0.79) return out.set((fx - 0.5) * T.W, 0, T.wallZ + 1.4 + (fy - 0.79) / 0.21 * T.D);
      return out.set((fx - 0.5) * T.W, (T.base - fy) * T.Hs, T.wallZ + T.ledge);
    },
    floorAt(fx, fy, out){ return this.feet(fx, fy, out); }
  }),
  env(){ return {sky:["#07040e", "#2a1830"], fog:["#140c1a", 0.016], hemi:["#c8b0e8", "#1a1020", 1.15], sun:["#ffd8b0", 1.8, [8, 30, 14]], exp:1.2}; },
  build(g){
    const R = rng(41), T = TOWER;
    const bT = ctex(256, 256, (x, w, h)=>{ x.fillStyle = "#2a1c30"; x.fillRect(0, 0, w, h);
      for(let r = 0; r < 16; r++) for(let c = 0; c < 8; c++){ const o = r % 2 ? 16 : 0; x.fillStyle = `hsl(${280 + R() * 25},${16 + R() * 12}%,${26 + R() * 12}%)`; x.fillRect(c * 32 + o + 1, r * 16 + 1, 30, 14); } });
    bT.wrapS = bT.wrapT = THREE.RepeatWrapping; bT.repeat.set(4, 7);
    mesh(g, box(16, 26, 3), std("#ffffff", {map:bT}), 0, 13, T.wallZ - 1.5);
    /* des caisses et des corniches, en zigzag jusqu'en haut */
    const wood = std("#7a5230"), dark = std("#4a3020");
    for(let i = 0; i < 16; i++){ const y = 1.5 + i * 0.9, x = Math.sin(i * 1.3) * 5.5; mesh(g, box(1 + R() * 0.8, 0.7, 0.9), i % 3 ? wood : dark, x, y, T.wallZ + 0.4); }
    for(let i = 0; i < 6; i++){ const y = 3 + i * 2.2; const w = mesh(g, box(0.16, 0.7, 0.06), unlit(i % 2 ? "#ff7ab0" : "#ffc878"), (i % 2 ? -1 : 1) * (2 + (i % 3)), y, T.wallZ + 0.02, {cast:false}); w.material.toneMapped = false; }
    /* le sommet : la plateforme du gardien, et sa porte */
    const topY = (T.base - 0.2) * T.Hs;
    mesh(g, box(7.5, 0.5, 3.2), std("#3a2a40"), 0, topY - 0.25, T.wallZ + 1.4);
    mesh(g, box(0.25, 0.7, 3.2), std("#3a2a40"), -3.7, topY + 0.1, T.wallZ + 1.4); mesh(g, box(0.25, 0.7, 3.2), std("#3a2a40"), 3.7, topY + 0.1, T.wallZ + 1.4);
    const gateY = (T.base - 0.16) * T.Hs;
    mesh(g, box(2.4, 2.8, 0.3), std("#1a1020"), 0, gateY + 0.2, T.wallZ - 0.05);
    const inside = mesh(g, new THREE.PlaneGeometry(1.8, 2.3), unlit("#ff3d7f"), 0, gateY + 0.1, T.wallZ + 0.11, {cast:false}); inside.material.toneMapped = false;
    const door = mesh(g, box(1.85, 2.35, 0.12), std("#120c18"), 0, gateY + 0.1, T.wallZ + 0.18);
    const gLight = new THREE.PointLight("#ff3d7f", 0, 10, 1.4); gLight.position.set(0, gateY, T.wallZ + 1.6); g.add(gLight);
    /* des torches le long de la façade : on voit la Tour monter */
    for(let i = 0; i < 6; i++){ const y = 1.6 + i * 3.1, x = (i % 2 ? -1 : 1) * 4.6;
      mesh(g, box(0.16, 0.5, 0.16), std("#3a2a20"), x, y, T.wallZ + 0.15);
      const f = mesh(g, new THREE.SphereGeometry(0.14, 8, 6), unlit("#ffb050"), x, y + 0.35, T.wallZ + 0.2, {cast:false}); f.material.toneMapped = false;
      if(i % 2 === 0){ const l = new THREE.PointLight("#ffa040", 14, 12, 1.3); l.position.set(0, y + 1.2, T.wallZ + 1.4); g.add(l); } }
    /* le sol, au pied */
    mesh(g, new THREE.PlaneGeometry(60, 40).rotateX(-Math.PI / 2), std("#2a2430"), 0, 0, 10, {cast:false});
    for(let i = 0; i < 40; i++) mesh(g, new THREE.DodecahedronGeometry(0.3 + R() * 0.5, 0), std("#2a2234"), (R() - 0.5) * 40, 0.1, -4 + R() * 24);
    /* des étoiles */
    const sg = new THREE.BufferGeometry(), sp = []; for(let i = 0; i < 500; i++){ const a = R() * TAU, h = R() * 0.9; sp.push(Math.cos(a) * 200, 20 + h * 180, Math.sin(a) * 200 - 60); }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); g.add(new THREE.Points(sg, new THREE.PointsMaterial({color:"#cfc0ff", size:0.8, fog:false})));
    return (t, dt, st, P)=>{
      const k = st.open ? Math.min(1, (P.t - st.t0) / 1.2) : 0;
      door.position.y = gateY + 0.1 + k * 2.4; door.scale.y = 1 - k * 0.9;
      gLight.intensity = k * 14;
    };
  }
};

/* ---------- le noyau d'une région : un cristal suspendu ---------- */
const CORE_C = {kanto:"#ff6a4a", johto:"#f0c060", hoenn:"#3ad0ff"};
SETS3D.noyau = {
  map:roomMap({fl:0.56, W:12, D:7, wallZ:-5, wallH:13, gap:0.8, lookY:1.35, dist:6.6, up:0.12}),
  env(v){ const c = CORE_C[v] || CORE_C.kanto; return {sky:["#020206", "#0a0812"], fog:["#05040a", 0.03], hemi:[c, "#020204", 0.45], sun:["#ffffff", 0.5, [4, 12, 6]], exp:1.15}; },
  build(g, v){
    const R = rng(53), C = CORE_C[v] || CORE_C.kanto;
    /* le disque où l'on se tient */
    mesh(g, new THREE.CylinderGeometry(7, 6.4, 0.6, 40).translate(0, -0.3, 0), std("#141420"), 0, 0, -1, {cast:false});
    const rim = mesh(g, new THREE.TorusGeometry(6.95, 0.05, 6, 80).rotateX(Math.PI / 2), unlit(C), 0, 0.02, -1, {cast:false}); rim.material.toneMapped = false;
    /* le cristal, son câble, ses rayons */
    const cry = new THREE.Group(); cry.position.set(0, 3.0, -4.4); g.add(cry);
    const cm = std(C, {emissive:C, emissiveIntensity:1.2, roughness:0.3, flatShading:true, transparent:true, opacity:0.95});
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0).scale(1, 1.6, 1), cm); cry.add(gem);
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0).scale(1, 1.6, 1), unlit("#ffffff")); cry.add(inner);
    mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 30, 5), std("#2a2a30"), 0, 3.0 + 15 + 1.6, -4.4, {cast:false});
    const rays = [];
    for(let i = 0; i < 18; i++){ const r = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 22).translate(0, 11, 0), glowM(C, 0.25)); r.rotation.z = i / 18 * TAU + R() * 0.1; r.rotation.y = R() * 0.6; cry.add(r); rays.push(r); }
    const light = new THREE.PointLight(C, 30, 22, 1.2); cry.add(light);
    /* des cages : le noyau est tenu tant qu'il n'est pas libéré */
    const cage = new THREE.Group(); cry.add(cage);
    for(let i = 0; i < 6; i++){ const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.6, 0.06), std("#3a3a44", {metalness:0.6, roughness:0.4})); const a = i / 6 * TAU; b.position.set(Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4); cage.add(b); }
    /* la fêlure, sous le disque */
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), glowM("#ff3d7f", 0)); crack.rotation.x = -Math.PI / 2; crack.position.set(0, 0.03, 0.4); g.add(crack);
    /* des poussières */
    const dust = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), unlit(C), 80), M = new THREE.Matrix4(), dd = [];
    for(let i = 0; i < 80; i++) dd.push({a:R() * TAU, r:1.5 + R() * 6, y:R() * 7, v:0.1 + R() * 0.3}); g.add(dust);
    return (t, dt, st, P)=>{
      const free = st.free !== undefined ? st.free : 1, fk = free ? Math.min(1, (P.t - (st.t0 || 0)) / 1.2) : 0;
      gem.rotation.y = t * 0.4; inner.rotation.y = -t * 0.9;
      cry.position.y = 3.0 + Math.sin(t * 0.8) * 0.12;
      cm.emissiveIntensity = 0.5 + fk * 1.4 + Math.sin(t * 3) * 0.15;
      light.intensity = 10 + fk * 30;
      rays.forEach((r, i)=>{ r.material.opacity = (0.06 + fk * 0.28) * (0.7 + 0.3 * Math.sin(t * 2 + i)); });
      cage.visible = fk < 1; cage.scale.setScalar(1 + fk * 2); cage.children.forEach(b=>{ b.material.opacity = 1 - fk; b.material.transparent = fk > 0; });
      const ck = st.crack ? Math.min(1, (P.t - st.t0) / 1.6) : 0; crack.material.opacity = ck * (0.6 + Math.sin(t * 9) * 0.2); crack.scale.x = 0.1 + ck;
      dd.forEach((d, i)=>{ d.y += d.v * dt; if(d.y > 8) d.y = 0; d.a += dt * 0.1; M.makeTranslation(Math.cos(d.a) * d.r, d.y, -4.4 + Math.sin(d.a) * d.r); dust.setMatrixAt(i, M); }); dust.instanceMatrix.needsUpdate = true;
    };
  }
};

/* ---------- les sauvegardes : onze emplacements, onze connexions ---------- */
SETS3D.sauvegardes = {
  map:roomMap({fl:0.55, W:12, D:7, wallZ:-4.5, wallH:9, gap:0.8, lookY:1.55, up:0.1, dist:6.4}),
  env(){ return {sky:["#1a1008", "#2a1a0c"], fog:["#1a1008", 0.03], hemi:["#ffd8a8", "#1a0e06", 0.8], sun:["#ffd8a0", 1.2, [-4, 9, 6]], exp:1.1}; },
  build(g){
    const R = rng(61), W = -4.5;
    const pT = ctex(256, 256, (x, w, h)=>{ for(let i = 0; i < 8; i++){ x.fillStyle = `hsl(24,${38 + R() * 10}%,${18 + R() * 6}%)`; x.fillRect(i * 32, 0, 31, h); x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(i * 32 + 31, 0, 1, h); } });
    pT.wrapS = pT.wrapT = THREE.RepeatWrapping; pT.repeat.set(5, 2);
    mesh(g, new THREE.PlaneGeometry(18, 8), std("#ffffff", {map:pT, flatShading:false}), 0, 4, W, {cast:false});
    const fT = ctex(256, 256, (x, w, h)=>{ for(let i = 0; i < 8; i++){ x.fillStyle = `hsl(26,${34 + R() * 8}%,${24 + R() * 6}%)`; x.fillRect(0, i * 32, w, 31); } });
    fT.wrapS = fT.wrapT = THREE.RepeatWrapping; fT.repeat.set(4, 3);
    mesh(g, new THREE.PlaneGeometry(18, 13).rotateX(-Math.PI / 2), std("#ffffff", {map:fT, flatShading:false}), 0, 0, 1.5, {cast:false});
    mesh(g, new THREE.PlaneGeometry(13, 8), std("#3a2414"), -8.4, 4, 1.4, {ry:Math.PI / 2 - 0.1, cast:false});
    mesh(g, new THREE.PlaneGeometry(13, 8), std("#3a2414"), 8.4, 4, 1.4, {ry:-Math.PI / 2 + 0.1, cast:false});
    /* les onze emplacements */
    const slots = [];
    for(let i = 0; i < 11; i++){
      const row = i < 6 ? 0 : 1, col = row ? i - 6 : i, n = row ? 5 : 6;
      const x = (col - (n - 1) / 2) * 1.55, y = row ? 2.35 : 3.55;
      mesh(g, box(1.3, 0.95, 0.14), std("#2a1c12"), x, y, W + 0.08);
      const t = ctex(160, 112), m = new THREE.MeshBasicMaterial({map:t, toneMapped:false});
      mesh(g, new THREE.PlaneGeometry(1.16, 0.8), m, x, y + 0.02, W + 0.16, {cast:false});
      const plate = ctex(128, 32, (x2, w, h)=>{ x2.fillStyle = "#c8a060"; x2.fillRect(0, 0, w, h); txt(x2, "▒▒▒▒▒", w / 2, h / 2 + 1, "#3a2414", 12, "center"); });
      mesh(g, new THREE.PlaneGeometry(0.9, 0.2), std("#ffffff", {map:plate}), x, y - 0.6, W + 0.12, {cast:false});
      slots.push({t, key:""});
    }
    const sign = ctex(512, 80, (x, w, h)=>{ x.fillStyle = "#c8a060"; x.fillRect(0, 0, w, h); x.strokeStyle = "#5a3a20"; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); txt(x, "ARCHIVES — JOHTO", w / 2, h / 2 + 2, "#3a2414", 22, "center"); });
    mesh(g, new THREE.PlaneGeometry(3.2, 0.5), std("#ffffff", {map:sign}), 0, 1.35, W + 0.1, {cast:false});
    /* l'échelle */
    for(const dx of [-0.3, 0.3]) mesh(g, box(0.08, 5, 0.08), std("#6a4428"), 5.9 + dx, 2.5, W + 0.4);
    for(let i = 0; i < 9; i++) mesh(g, box(0.6, 0.06, 0.06), std("#6a4428"), 5.9, 0.4 + i * 0.55, W + 0.4);
    for(const lx of [-4, 0, 4]){ mesh(g, new THREE.CylinderGeometry(0.01, 0.01, 2, 4), std("#222"), lx, 6.5, -1.5); const b = mesh(g, new THREE.SphereGeometry(0.14, 10, 8), unlit("#ffd28a"), lx, 5.5, -1.5, {cast:false}); b.material.toneMapped = false;
      const l = new THREE.PointLight("#ffc880", 5, 9, 1.5); l.position.set(lx, 5.3, -1.5); g.add(l); }
    /* le portrait de Porygon-Z, quand il est dans chacune */
    const pzImg = new Image(); let pzW = 40; try { const S = window.PCG.ref("PZ_STRIP"); pzW = window.PCG.ref("PZ_WIDTH") || window.PCG.ref("PZ_W") || 40; if(S) pzImg.src = S; } catch(e){}
    return (t, dt, st, P)=>{
      const lit = st.lit || 0;
      slots.forEach((s, i)=>{
        const on = i < Math.min(11, Math.floor(lit + (st.litStep ? (P.t - st.t0) / st.litStep : 0)));
        const zero = st.zero || (st.flipAt && P.t - st.t0 > st.flipAt + i * 0.07);
        const key = (on ? 1 : 0) + "|" + (zero ? 1 : 0) + "|" + (st.pz ? 1 : 0) + "|" + (pzImg.complete ? 1 : 0);
        if(key === s.key) return; s.key = key;
        const x = s.t.userData.x, w = 160, h = 112;
        x.fillStyle = on ? (zero ? "#1a0408" : "#06221c") : "#0a0806"; x.fillRect(0, 0, w, h);
        if(on){
          if(st.pz && pzImg.complete && pzImg.naturalWidth) x.drawImage(pzImg, 0, 0, pzW, pzW, w / 2 - 26, 8, 52, 52);
          else { x.fillStyle = zero ? "#ff3d7f" : "#7af0b0"; x.beginPath(); x.arc(w / 2, 34, 18, 0, TAU); x.fill(); x.fillStyle = "#06221c"; x.fillRect(w / 2 - 18, 32, 36, 4); }
          txt(x, zero ? "0%" : "100%", w / 2, 86, zero ? "#ff3d7f" : "#dff7e6", 20, "center");
        }
        s.t.needsUpdate = true;
      });
    };
  }
};

/* ---------- Hoenn : le sable, les palmiers, les montagnes ---------- */
SETS3D.hoenn = {
  map:perspMap({hz:0.46, W:9, C:1.6, band:0.65}),
  env(){ return {sky:["#3a8ad8", "#cfe8f6"], fog:["#e8dcc0", 0.01], hemi:["#fff6e0", "#a08a5a", 1.25], sun:["#fff0c8", 2.6, [-10, 16, 4]], exp:1.0}; },
  build(g){
    const R = rng(71);
    const sT = ctex(256, 256, (x, w, h)=>{ x.fillStyle = "#e6d29e"; x.fillRect(0, 0, w, h); for(let i = 0; i < 900; i++){ x.fillStyle = R() < 0.5 ? "rgba(180,150,90,.25)" : "rgba(255,245,210,.3)"; x.fillRect(R() * w, R() * h, 2, 2); } });
    sT.wrapS = sT.wrapT = THREE.RepeatWrapping; sT.repeat.set(30, 30);
    const sand = new THREE.PlaneGeometry(300, 300, 60, 60).rotateX(-Math.PI / 2), sp = sand.attributes.position;
    for(let i = 0; i < sp.count; i++){ const x = sp.getX(i), z = sp.getZ(i); if(z < -20) sp.setY(i, Math.sin(x * 0.06) * 1.5 + Math.cos(z * 0.05) * 1.2); }
    sand.computeVertexNormals();
    mesh(g, sand, std("#ffffff", {map:sT, flatShading:false}), 0, 0, -80, {cast:false});
    /* les montagnes brunes, coiffées de neige */
    for(let i = 0; i < 9; i++){ const x = -110 + i * 28 + R() * 10, h = 30 + R() * 30, z = -170 - R() * 30;
      mesh(g, new THREE.ConeGeometry(h * 0.7, h, 4), std("#8a5a3a"), x, h / 2 - 4, z, {ry:R(), cast:false});
      mesh(g, new THREE.ConeGeometry(h * 0.7 * 0.28, h * 0.28, 4), std("#f6f2ea"), x, h - 4 - h * 0.14 + 0.5, z, {ry:R(), cast:false}); }
    /* les palmiers */
    const palm = (x, z, h, lean) => {
      const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p);
      for(let i = 0; i < 8; i++){ const s = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, h / 8 + 0.05, 6), std("#8a6a40")); s.position.set(Math.sin(i / 8 * 1.2) * lean * h * 0.2 * (i / 8), (i + 0.5) * h / 8, 0); s.rotation.z = -lean * 0.15 * (i / 8); s.castShadow = true; p.add(s); }
      const top = V().set(Math.sin(1.2) * lean * h * 0.2, h, 0);
      for(let i = 0; i < 7; i++){ const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 4).translate(0, 1.3, 0), std("#3a8a3a")); f.position.copy(top); f.rotation.set(1.1 + R() * 0.3, i / 7 * TAU, 0, "YXZ"); f.castShadow = true; p.add(f); }
    };
    palm(-5.5, -3, 4.2, -1); palm(4.8, -8, 4.8, 1); palm(9, -18, 5, -0.6);
    /* la mer, à gauche */
    mesh(g, new THREE.PlaneGeometry(200, 120).rotateX(-Math.PI / 2), std("#3a9ad0", {roughness:0.2, flatShading:false}), -130, 0.1, -60, {cast:false});
    /* la trace : des pas dans le sable, et une lueur qui les suit */
    const trace = new THREE.InstancedMesh(new THREE.CircleGeometry(0.12, 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ff7ab0", transparent:true, opacity:0, toneMapped:false}), 24);
    const M = new THREE.Matrix4();
    for(let i = 0; i < 24; i++){ M.makeTranslation(2.2 + i * 0.32 + (i % 2) * 0.1, 0.03, 0.3 + Math.sin(i * 0.5) * 0.4 - i * 0.05); trace.setMatrixAt(i, M); }
    g.add(trace);
    return (t, dt, st, P)=>{ trace.material.opacity = st.trace === 0 ? 0 : st.trace ? Math.min(0.85, (P.t - st.t0) * 0.8) * (0.7 + 0.3 * Math.sin(t * 4)) : 0; };
  }
};

/* ---------- la côte de 1996 : quatre verts, vue d'en haut ---------- */
const GB = ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"];
SETS3D.cote = {
  map:flatMap({W:14, D:24, band:0.62, lookY:0.6, dist:12, up:1.05}),
  env(){ return {sky:[GB[3], GB[2]], fog:[GB[2], 0.012], hemi:["#ffffff", "#ffffff", 1], sun:["#ffffff", 0.0, [0, 10, 0]], exp:1.0, flat:true}; },
  build(g){
    const R = rng(81);
    const gT = ctex(64, 64, (x, w, h)=>{ x.fillStyle = GB[2]; x.fillRect(0, 0, w, h); x.fillStyle = GB[1]; for(let i = 0; i < 6; i++){ const X = (i * 23) % 56 + 4, Y = (i * 37) % 56 + 4; x.fillRect(X, Y, 2, 4); x.fillRect(X + 4, Y + 1, 2, 3); } });
    gT.magFilter = THREE.NearestFilter; gT.wrapS = gT.wrapT = THREE.RepeatWrapping; gT.repeat.set(40, 40);
    mesh(g, new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), unlit("#ffffff", {map:gT}), 0, 0, -6, {cast:false});
    /* l'eau, à droite : des vagues de 1996 qui glissent */
    const wT = ctex(32, 32, (x, w, h)=>{ x.fillStyle = GB[1]; x.fillRect(0, 0, w, h); x.fillStyle = GB[2]; x.fillRect(4, 6, 10, 2); x.fillRect(18, 20, 10, 2); x.fillStyle = GB[0]; x.fillRect(6, 8, 6, 1); x.fillRect(20, 22, 6, 1); });
    wT.magFilter = THREE.NearestFilter; wT.wrapS = wT.wrapT = THREE.RepeatWrapping; wT.repeat.set(16, 40);
    mesh(g, new THREE.PlaneGeometry(26, 80).rotateX(-Math.PI / 2), unlit("#ffffff", {map:wT}), 15.5, 0.02, -6, {cast:false});
    mesh(g, box(0.3, 0.3, 80), unlit(GB[0]), 2.6, 0.12, -6, {cast:false});
    /* les arbres ronds, en colonne, comme sur la cartouche */
    const T = []; for(let i = 0; i < 18; i++){ for(const cx of [-5.6, -4.2]) T.push({x:cx + (i % 2) * 0.3, z:-22 + i * 1.6, h:2}); }
    for(let i = 0; i < 26; i++) T.push({x:-12 + R() * 6, z:-26 + R() * 34, h:2});
    trees(g, T, GB[1], GB[0], {unlit:true});
    /* l'herbe haute en damier */
    const hg = new THREE.InstancedMesh(box(0.7, 0.35, 0.7), unlit(GB[1]), 120), M = new THREE.Matrix4();
    let n = 0; for(let i = 0; i < 12; i++) for(let j = 0; j < 10; j++) if((i + j) % 2 === 0 && n < 120){ M.makeTranslation(-1.6 + i * 0.75 - 4, 0.17, -12 + j * 0.75); hg.setMatrixAt(n++, M); }
    hg.count = n; g.add(hg);
    return (t)=>{ wT.offset.x = (Math.floor(t * 2) % 4) * 0.25 / 16; };
  }
};

/* ---------- la page : une feuille, sur un bureau, l'écriture qui vient ---------- */
SETS3D.page = {
  map:flatMap({W:6.6, D:14.3, band:0.55, lookY:0.0, dist:9.5, up:1.9}),
  env(){ return {sky:["#0a0806", "#1a120a"], fog:["#0a0806", 0.02], hemi:["#ffe8c8", "#1a120a", 0.7], sun:["#ffe0b0", 1.6, [-3, 8, 4]], exp:1.05}; },
  /* la feuille : c'est le dessin même du jeu mobile, posé à plat */
  build(g, v, ctx){
    mesh(g, new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), std("#3a2414", {flatShading:false}), 0, -0.02, 0, {cast:false});
    const tex = ctex(195, 422); tex.magFilter = THREE.NearestFilter;
    const sheet = mesh(g, new THREE.PlaneGeometry(6.6, 14.3).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({map:tex, roughness:0.9}), 0, 0.01, (0.5 - 0.55) * 14.3, {cast:false});
    const lamp = new THREE.PointLight("#ffd8a0", 12, 14, 1.4); lamp.position.set(-2.5, 4, -2); g.add(lamp);
    return (t, dt, st, P, c)=>{
      const S0 = P.set; if(!S0 || !S0.cv) return;
      const x = tex.userData.x;
      if(tex.userData.cv.width !== S0.sw || tex.userData.cv.height !== S0.sh){ tex.userData.cv.width = S0.sw; tex.userData.cv.height = S0.sh; }
      x.drawImage(S0.cv, 0, 0);
      try { if(S0.def && S0.def.anim) S0.def.anim(x, S0.sw, S0.sh, P.t, S0.v, P, c, S0.st || {}); } catch(e){}
      tex.needsUpdate = true;
    };
  }
};

/* ---------- le forage : une galerie de mine, une lampe ---------- */
SETS3D.forage = {
  map:roomMap({fl:0.6, W:10, D:6, wallZ:-4, wallH:10, gap:0.8}),
  env(){ return {sky:["#050302", "#0e0804"], fog:["#0a0604", 0.035], hemi:["#ffc890", "#1a0e06", 0.85], sun:["#ffc890", 0.7, [-3, 8, 4]], exp:1.3}; },
  build(g){
    const R = rng(91);
    mesh(g, new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), std("#3a2a1a"), 0, 0, 0, {cast:false});
    /* la roche, tout autour */
    const rock = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), std("#3a3028"), 140), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(), P = V(), C = new THREE.Color();
    for(let i = 0; i < 140; i++){
      const side = i % 3, s = 0.8 + R() * 1.6;
      const x = side === 0 ? -5.5 - R() * 2 : side === 1 ? 5.5 + R() * 2 : (R() - 0.5) * 12, z = side === 2 ? -4.6 - R() * 1.5 : -6 + R() * 10, y = R() * 6;
      M.compose(P.set(x, y, z), Q.setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3)), S.set(s, s * (0.7 + R() * 0.6), s)); rock.setMatrixAt(i, M); rock.setColorAt(i, C.set("#3a3028").offsetHSL(0, 0, (R() - 0.5) * 0.06));
    }
    rock.castShadow = rock.receiveShadow = true; g.add(rock);
    /* les étais, qui s'enfoncent */
    const wood = std("#6a4628");
    for(const z of [-3.6, -1.2, 1.4]){ mesh(g, box(0.3, 4, 0.3), wood, -3.6, 2, z); mesh(g, box(0.3, 4, 0.3), wood, 3.6, 2, z); mesh(g, box(7.6, 0.35, 0.4), wood, 0, 4.1, z); }
    for(const x of [-0.6, 0.6]) mesh(g, box(0.08, 0.06, 12), std("#5a5a60", {metalness:0.6, roughness:0.4}), x, 0.04, -1);
    for(let i = 0; i < 14; i++) mesh(g, box(1.6, 0.06, 0.18), std("#4a3020"), 0, 0.03, -6 + i * 0.85);
    /* la lampe pendue */
    const lampG = new THREE.Group(); lampG.position.set(-2, 3.0, -2.4); g.add(lampG);
    lampG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 4).translate(0, 0.55, 0), std("#222")));
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.26), unlit("#ffcf80")); bulb.material.toneMapped = false; lampG.add(bulb);
    const L = new THREE.PointLight("#ffb860", 34, 14, 1.3); L.castShadow = true; lampG.add(L);
    /* des éclats de minerai */
    for(let i = 0; i < 16; i++) mesh(g, new THREE.OctahedronGeometry(0.08, 0), unlit(["#7ae8ff", "#ffd24a", "#ff7ab0"][i % 3]), (R() < 0.5 ? -1 : 1) * (4.4 + R()), 0.5 + R() * 3, -5 + R() * 6, {cast:false});
    return (t)=>{ L.intensity = 32 + Math.sin(t * 13) * 2 + Math.sin(t * 5.1) * 2.5; lampG.rotation.z = Math.sin(t * 0.9) * 0.04; };
  }
};

/* ---------- les strates : Kanto, Johto, Hoenn, l'une sur l'autre ---------- */
const STRATA = [
  {k:"KANTO", top:0, z0:-1.2, z1:6, f0:0.55, f1:1, c:"#5ca04a", side:"#4a3a26"},
  {k:"JOHTO", top:2.6, z0:-6.2, z1:-1.2, f0:0.4, f1:0.55, c:"#c8a86a", side:"#5a4630"},
  {k:"HOENN", top:5.2, z0:-11.2, z1:-6.2, f0:0.22, f1:0.4, c:"#3aa8a0", side:"#2a4a4a"}
];
SETS3D.strates = {
  map:Object.assign({W:12, lookY:1.1, dist:10, up:0.42, band:0.66, camFl:-1}, {
    feet(fx, fy, out = V()){
      const L = STRATA.find(l=>fy >= l.f0) || STRATA[2];
      const k = Math.max(0, Math.min(1, (fy - L.f0) / (L.f1 - L.f0)));
      return out.set((fx - 0.5) * 12, L.top, L.z0 + 0.6 + k * (L.z1 - L.z0 - 0.8));
    },
    floorAt(fx, fy, out){ return this.feet(fx, fy, out); }
  }),
  env(){ return {sky:["#03050c", "#101a2a"], fog:["#060a14", 0.02], hemi:["#cfe0ff", "#0a0806", 0.95], sun:["#ffffff", 1.6, [-6, 14, 8]], exp:1.1}; },
  build(g){
    const R = rng(97), glows = [];
    STRATA.forEach((L, i)=>{
      const d = L.z1 - L.z0, h = L.top + 3;
      mesh(g, box(16, h, d), [std(L.side), std(L.side), std(L.c), std(L.side), std(L.side), std(L.side)], 0, L.top - h / 2, (L.z0 + L.z1) / 2);
      /* la fêlure qui traverse les couches */
      for(let k = 0; k < 4; k++) mesh(g, box(0.06, 1.4 + R(), 0.02), unlit("#ff3d7f"), -6 + k * 4 + R(), L.top - 1.2, L.z1 + 0.02, {rz:(R() - 0.5) * 0.6, cast:false});
      const lab = ctex(256, 48, (x, w, hh)=>{ txt(x, L.k, 8, hh / 2, "#ffffff", 22); });
      mesh(g, new THREE.PlaneGeometry(1.8, 0.34), new THREE.MeshBasicMaterial({map:lab, transparent:true, toneMapped:false}), -6.4, L.top - 0.5, L.z1 + 0.03, {cast:false});
      /* la porte de la couche du dessus, dans la marche */
      if(i < 2){ const dx = [-3.1, 1.0][i]; mesh(g, box(1.1, 1.6, 0.1), std("#05030a"), dx, STRATA[i + 1].top - 1.6 / 2 - 0.3 + (L.top - STRATA[i + 1].top + 2.0), STRATA[i + 1].z1 + 0.05); }
      const gl = mesh(g, new THREE.PlaneGeometry(16, d), glowM(L.c, 0), 0, L.top + 0.03, (L.z0 + L.z1) / 2, {rx:-Math.PI / 2, cast:false}); glows.push({m:gl, k:L.k});
    });
    /* chaque couche a son paysage : des arbres à Kanto, des colonnes à Johto, des palmiers à Hoenn */
    trees(g, [[-5.5, 1.5], [-4.2, 3.6], [4.6, 2.2], [5.8, 4.4], [-6.4, 4.8], [3.2, 4.9]].map(([x, z])=>({x, z, h:1.6 + R() * 0.8, r:R() * 6})), "#3a7a3a", "#4a3020");
    for(const x of [-5.2, -2.4, 3.6, 5.6]){ mesh(g, new THREE.CylinderGeometry(0.22, 0.26, 1.6, 8), std("#d8c8a0"), x, STRATA[1].top + 0.8, -4.6 + (x > 0 ? 0.6 : 0)); mesh(g, box(0.6, 0.14, 0.6), std("#c8b890"), x, STRATA[1].top + 1.66, -4.6 + (x > 0 ? 0.6 : 0)); }
    for(const x of [-4.6, 4.2, 5.8]){ const h = 1.8 + R() * 0.6; mesh(g, new THREE.CylinderGeometry(0.08, 0.12, h, 6), std("#8a6a40"), x, STRATA[2].top + h / 2, -9.4); for(let i = 0; i < 5; i++) mesh(g, new THREE.ConeGeometry(0.16, 1.1, 4).translate(0, 0.55, 0), std("#3a9a5a"), x, STRATA[2].top + h, -9.4, {rx:1.2, ry:i / 5 * TAU}); }
    const eyes = [];
    for(const [x, y, z] of [[-3.1, 1.4, -1.1], [1.0, 4.0, -6.1]]) for(const dx of [-0.12, 0.12]){ const e = mesh(g, new THREE.SphereGeometry(0.04, 6, 4), unlit("#ff3d7f"), x + dx, y, z, {cast:false}); e.visible = false; eyes.push(e); }
    const sg = new THREE.BufferGeometry(), sp = []; for(let i = 0; i < 400; i++){ sp.push((R() - 0.5) * 300, 10 + R() * 120, -60 - R() * 120); }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); g.add(new THREE.Points(sg, new THREE.PointsMaterial({color:"#cfe0ff", size:0.6, fog:false})));
    return (t, dt, st)=>{
      glows.forEach(G=>{ G.m.material.opacity = st.hi && st.hi.toUpperCase() === G.k ? 0.22 + Math.sin(t * 4) * 0.08 : 0; });
      eyes.forEach(e=>{ e.visible = !!st.eyes && Math.sin(t * 1.3) > -0.9; });
    };
  }
};
