/* ============================================================
   LA BRÈCHE EN 3D · LES UNIVERS
   Le monde de la run est celui du jeu mobile : mêmes morceaux de
   480 px tirés de la graine, mêmes obstacles, mêmes terrains, mêmes
   lieux. Ici, on les bâtit en volume :
     · le sol de chaque morceau garde la peinture du jeu mobile
       (herbe nuancée, mousse, dallage, basalte…), posée à plat ;
     · le relief se dresse : feuillus et conifères, rochers, stalagmites,
       colonnes gravées, orgues de basalte aux veines de lave ;
     · l'eau et la lave sont des nappes animées, les hautes herbes de
       vraies touffes qui ondulent ;
     · chaque lieu est un objet : caisse de données, autel, cage de
       glitch, souche, cristal, dalle-glyphe, geyser, remous, arbre à baies.
   Ce qui se trouve entre la caméra et l'équipe s'efface en trame :
   on ne perd jamais l'équipe derrière un arbre.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { S, ref, col, rng, Glow } from "./lib.js";
import { makeMon } from "../mon/model3d.js";
import { OCC, OCC_GLSL } from "../mon/occ.js";
export { OCC };

const CH = 480 * S;                         /* un morceau : 15 m */
export const HAB = {
  route:  {sky:["#1c2438", "#46566a"], fog:"#2c3648", fogD:0.020, hemi:["#c4d4ee", "#2c2a1e", 1.25], sun:["#ffe6c4", 2.0], amb:"pollen",
           leaf:["#3d5c2e", "#56763a", "#2f4a26"], bark:"#3a2616", rock:["#6a665c", "#57534a"], grass:"#4d6a32", ground:"#3d4a2c"},
  foret:  {sky:["#0c1812", "#28402e"], fog:"#16261c", fogD:0.028, hemi:["#b4dcbc", "#1a1a10", 1.1], sun:["#e6f0c0", 1.5], amb:"firefly",
           leaf:["#21402a", "#2d5434", "#1a3322"], bark:"#2e1e12", rock:["#4c5a48", "#3e4a3a"], grass:"#355a2c", ground:"#2a3a22"},
  eaux:   {sky:["#0c1a2a", "#2c4c68"], fog:"#1a3246", fogD:0.020, hemi:["#c0dcf2", "#10202a", 1.2], sun:["#e8f4ff", 1.8], amb:"spray",
           leaf:["#2c5040", "#3a6650", "#22403a"], bark:"#2e2418", rock:["#4c6066", "#3a4c52"], grass:"#3c6448", ground:"#2c4040"},
  grotte: {sky:["#030308", "#0a0a16"], fog:"#05050c", fogD:0.04, hemi:["#5a6a92", "#050508", 0.62], sun:["#8494c4", 0.45], amb:"dust", dark:true,
           leaf:["#2a2a3a", "#33334a", "#222230"], bark:"#1a1a22", rock:["#2c3040", "#232634"], grass:"#2a3040", ground:"#14161e"},
  ruines: {sky:["#1a1428", "#40344e"], fog:"#2a2238", fogD:0.022, hemi:["#d4c8ec", "#1e1a16", 1.15], sun:["#ffe0c0", 1.7], amb:"glyph",
           leaf:["#3a5030", "#4a6238", "#2c4026"], bark:"#30241a", rock:["#8a7a62", "#6e604c"], grass:"#4a5a30", ground:"#3a3428"},
  foyer:  {sky:["#160606", "#4a1a0c"], fog:"#2a0c06", fogD:0.024, hemi:["#ffb894", "#200800", 0.95], sun:["#ffa264", 1.6], amb:"ember",
           leaf:["#3a2a20", "#4a3626", "#2a1e16"], bark:"#1e1410", rock:["#2a2424", "#1e1a1a"], grass:"#4a3a26", ground:"#1e1414"}
};

/* ---------- ce qui se trouve entre la caméra et l'équipe s'efface en trame ---------- */
function occlude(m, sway){
  m.onBeforeCompile = sh => {
    sh.uniforms.uEye = OCC.uEye; sh.uniforms.uFocus = OCC.uFocus; sh.uniforms.uT = OCC.uT;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vOW;\nuniform float uT;")
      .replace("#include <begin_vertex>", sway ? `#include <begin_vertex>
  { vec4 wp0 = modelMatrix * vec4(transformed, 1.0); float k = max(0.0, transformed.y - 1.2) * 0.04; transformed.x += sin(uT * 1.1 + wp0.x * 0.3 + wp0.z * 0.2) * k; transformed.z += cos(uT * 0.9 + wp0.z * 0.3) * k * 0.6; }` : "#include <begin_vertex>")
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vOW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 vOW;
${OCC_GLSL}`)
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
  occTest(vOW, 1.0);`);
  };
  m.customProgramCacheKey = () => "brocc" + (sway ? 1 : 0);
  return m;
}

/* ---------- l'eau et la lave ---------- */
const POOL_VS = `varying vec2 vP; varying float vR; attribute float aR;
#include <fog_pars_vertex>
void main(){ vR = aR; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const WATER_FS = `varying vec2 vP; varying float vR; uniform float uT, uIce;
#include <fog_pars_fragment>
float n2(vec2 p){ return sin(p.x * 1.7 + uT * 0.8) * sin(p.y * 1.3 - uT * 0.6) + sin((p.x + p.y) * 2.3 + uT * 1.4) * 0.5; }
void main(){
  float c = n2(vP * 1.4) * 0.5 + 0.5, c2 = n2(vP * 3.1 + 7.0) * 0.5 + 0.5;
  vec3 deep = vec3(0.02, 0.07, 0.10), lite = vec3(0.10, 0.32, 0.38);
  vec3 col = mix(deep, lite, pow(c * c2, 1.6) * 0.9 + vR * 0.25);
  col += vec3(0.7, 0.95, 1.0) * smoothstep(0.86, 0.98, c2) * 0.25;
  float foam = smoothstep(0.78, 0.97, vR) * (0.6 + 0.4 * sin(uT * 3.0 + vP.x * 4.0 + vP.y * 3.0));
  col = mix(col, vec3(0.75, 0.9, 0.95), foam * 0.7);
  col = mix(col, vec3(0.78, 0.92, 1.0) * (0.85 + c * 0.2), uIce);
  gl_FragColor = vec4(col, 0.92);
  #include <fog_fragment>
}`;
const LAVA_FS = `varying vec2 vP; varying float vR; uniform float uT, uIce;
#include <fog_pars_fragment>
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float n = vn(vP * 2.2 + vec2(uT * 0.12, -uT * 0.08)) * 0.6 + vn(vP * 5.5 - uT * 0.25) * 0.4;
  /* une croûte sombre, des fissures qui rougeoient, des bulles plus vives */
  float crack = 1.0 - smoothstep(0.03, 0.11, abs(n - 0.5));
  float pool = smoothstep(0.66, 0.8, n);
  vec3 hot = mix(vec3(1.25, 0.22, 0.02), vec3(1.7, 0.7, 0.12), vn(vP * 9.0 + uT));
  vec3 col = vec3(0.07, 0.035, 0.03) + hot * max(crack, pool) * (0.8 + 0.25 * sin(uT * 2.0 + n * 9.0));
  col = mix(col, vec3(0.1, 0.09, 0.09) + hot * 0.04 * crack, uIce);
  col *= 1.0 - smoothstep(0.85, 1.0, vR) * 0.5;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
function poolGeo(r, seed, wob){
  const N = 40, R = rng(seed + 0.17), pos = [0, 0, 0], ar = [0], idx = [];
  for(let i = 0; i <= N; i++){
    const a = i / N * Math.PI * 2, k = 1 + (Math.sin(a * 3 + seed * 20) * 0.5 + Math.sin(a * 5 + seed * 9) * 0.3) * wob;
    pos.push(Math.cos(a) * r * k, 0, Math.sin(a) * r * k); ar.push(1);
    pos.push(Math.cos(a) * r * k * 0.7, 0, Math.sin(a) * r * k * 0.7); ar.push(0.7);
  }
  for(let i = 0; i < N; i++){ const a = 1 + i * 2, b = a + 2; idx.push(0, b + 1, a + 1, a + 1, b + 1, b, a + 1, b, a); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aR", new THREE.Float32BufferAttribute(ar, 1));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}

/* ---------- le ciel : un dôme dégradé, une lueur de faille à l'horizon ---------- */
function skyDome(){
  const m = new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{uTop:{value:new THREE.Color()}, uBot:{value:new THREE.Color()}, uT:{value:0}, uRift:{value:new THREE.Color("#ff3d7f")}},
    vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader:`varying vec3 vD; uniform vec3 uTop, uBot, uRift; uniform float uT;
      void main(){ float y = vD.y; vec3 c = mix(uBot, uTop, smoothstep(-0.05, 0.6, y));
        float band = exp(-abs(y - 0.04) * 22.0) * (0.25 + 0.1 * sin(atan(vD.z, vD.x) * 7.0 + uT * 0.4));
        c += uRift * band * 0.35;
        gl_FragColor = vec4(c, 1.0); }`});
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), m); s.frustumCulled = false; s.renderOrder = -10;
  return s;
}

/* ============================================================
   LES MORCEAUX DE CARTE
   ============================================================ */
function tint(geo, c){
  const C = col(c), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for(let i = 0; i < n; i++){ a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return geo;
}
function prep(geo, c){ let g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute("uv"); if(g.attributes.uv1) g.deleteAttribute("uv1"); g.computeVertexNormals(); return tint(g, c); }
function jitter(geo, R, amt){
  const p = geo.attributes.position, seen = new Map();
  for(let i = 0; i < p.count; i++){
    const k = Math.round(p.getX(i) * 100) + "," + Math.round(p.getY(i) * 100) + "," + Math.round(p.getZ(i) * 100);
    let d = seen.get(k); if(!d){ d = [(R() - .5) * amt, (R() - .5) * amt, (R() - .5) * amt]; seen.set(k, d); }
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  return geo;
}
function place(geo, x, y, z, ry, s){ const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)); return geo.applyMatrix4(m); }

/* chaque obstacle, sculpté depuis sa graine : [géométries opaques, lueurs, couronnes de feuilles] */
function obstacle(o, hab, H){
  const R = rng(o.seed), x = o.x * S, z = o.y * S, r = o.r * S, out = {solid:[], glow:[], leaves:[]};
  if(o.k === "tree"){
    const pine = hab === "foret" && o.seed > 0.45, th = 1.6 + R() * 1.6 + (pine ? 1.8 : 0);
    out.solid.push(place(prep(new THREE.CylinderGeometry(r * 0.32, r * 0.52, th, 7, 3), H.bark), x, th / 2, z, R() * 6, 1));
    if(pine){
      for(let k = 0; k < 4; k++){ const rr = r * (2.3 - k * 0.42), hh = 1.5 + R() * 0.3;
        out.leaves.push(place(jitter(prep(new THREE.ConeGeometry(rr, hh, 8, 1), H.leaf[k % 3]), R, 0.18), x, th * 0.45 + k * 0.95 + hh / 2, z, R() * 6, 1)); }
    } else {
      const n = 4 + Math.floor(R() * 3);
      for(let k = 0; k < n; k++){
        const a = k / n * Math.PI * 2 + R(), d = r * (0.9 + R() * 0.9), rr = r * (1.3 + R() * 0.9);
        out.leaves.push(place(jitter(prep(new THREE.IcosahedronGeometry(rr, 1), H.leaf[k % 3]), R, rr * 0.35), x + Math.cos(a) * d, th + 0.3 + R() * 1.2, z + Math.sin(a) * d, R() * 6, 1));
      }
      out.leaves.push(place(jitter(prep(new THREE.IcosahedronGeometry(r * 1.9, 1), H.leaf[1]), R, r * 0.5), x, th + 1.4 + R() * 0.6, z, 0, 1));
    }
    return out;
  }
  if(o.k === "rock"){
    const g = jitter(prep(new THREE.IcosahedronGeometry(r * 1.15, 1), H.rock[Math.floor(R() * 2)]), R, r * 0.55);
    g.scale(1 + R() * 0.3, 0.6 + R() * 0.35, 1 + R() * 0.3);
    out.solid.push(place(g, x, r * 0.25, z, R() * 6, 1));
    if(R() < 0.6){ const g2 = jitter(prep(new THREE.IcosahedronGeometry(r * 0.55, 0), H.rock[1]), R, r * 0.3); out.solid.push(place(g2, x + (R() - .5) * r * 2.4, r * 0.15, z + (R() - .5) * r * 2.4, R() * 6, 1)); }
    if(hab === "grotte" || hab === "ruines") if(R() < 0.5) out.glow.push(place(new THREE.OctahedronGeometry(0.12 + R() * 0.1, 0), x + (R() - .5) * r, r * 0.8, z + (R() - .5) * r, R() * 6, 1));
    return out;
  }
  if(o.k === "pillar"){
    const h = 3 + R() * 4;
    out.solid.push(place(jitter(prep(new THREE.ConeGeometry(r * 0.95, h, 9, 5), H.rock[0]), R, r * 0.18), x, h / 2, z, R() * 6, 1));
    out.solid.push(place(jitter(prep(new THREE.ConeGeometry(r * 0.5, h * 0.55, 7, 3), H.rock[1]), R, r * 0.12), x + r * 0.9, h * 0.27, z + (R() - .5) * r, R() * 6, 1));
    for(let k = 0; k < 3; k++) out.glow.push(place(new THREE.OctahedronGeometry(0.1 + R() * 0.12, 0).scale(1, 1.8, 1), x + (R() - .5) * r * 1.6, 0.3 + R() * h * 0.5, z + (R() - .5) * r * 1.6, R() * 6, 1));
    return out;
  }
  if(o.k === "column"){
    const h = 2 + R() * 2.6;
    out.solid.push(place(prep(new THREE.BoxGeometry(r * 2.3, 0.4, r * 2.3), H.rock[1]), x, 0.2, z, R() * 6, 1));
    const c = prep(new THREE.CylinderGeometry(r * 0.72, r * 0.8, h, 10, 1), H.rock[0]);
    const p = c.attributes.position; for(let i = 0; i < p.count; i++) if(p.getY(i) > h / 2 - 0.01) p.setY(i, h / 2 - (p.getX(i) > 0 ? 0.6 * R() : 0) - Math.abs(p.getZ(i)) * 0.4);
    c.computeVertexNormals();
    out.solid.push(place(c, x, 0.4 + h / 2, z, R() * 6, 1));
    out.glow.push(place(new THREE.TorusGeometry(r * 0.76, 0.03, 4, 18).rotateX(Math.PI / 2), x, 0.4 + h * 0.55, z, 0, 1));
    if(R() < 0.6) out.solid.push(place(prep(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 1.2, 10), H.rock[0]).rotateZ(Math.PI / 2), x + r * 2.2, r * 0.7, z + (R() - .5), R() * 6, 1));
    return out;
  }
  if(o.k === "basalt"){
    const n = 3 + Math.floor(R() * 4);
    for(let k = 0; k < n; k++){
      const a = R() * Math.PI * 2, d = R() * r * 1.1, h = 0.8 + R() * 2.6, rr = r * (0.38 + R() * 0.2);
      out.solid.push(place(prep(new THREE.CylinderGeometry(rr, rr * 1.05, h, 6), H.rock[k % 2]), x + Math.cos(a) * d, h / 2, z + Math.sin(a) * d, R(), 1));
      if(R() < 0.5) out.glow.push(place(new THREE.BoxGeometry(0.05, h * 0.8, 0.05), x + Math.cos(a) * d + rr * 0.9, h * 0.45, z + Math.sin(a) * d, R(), 1));
    }
    return out;
  }
  out.solid.push(place(jitter(prep(new THREE.IcosahedronGeometry(r, 1), H.rock[0]), R, r * 0.3), x, r * 0.4, z, 0, 1));
  return out;
}

/* les hautes herbes : des touffes de brins, qui ondulent */
let TUFT = null;
function tuftGeo(){
  if(TUFT) return TUFT;
  const parts = [];
  for(let k = 0; k < 5; k++){
    const g = new THREE.PlaneGeometry(0.09, 0.75, 1, 3); g.translate(0, 0.37, 0);
    const p = g.attributes.position; for(let i = 0; i < p.count; i++){ const y = p.getY(i); p.setX(i, p.getX(i) * (1 - y / 0.8)); p.setZ(i, y * y * 0.25); }
    g.rotateY(k / 5 * Math.PI * 2 + 0.3); g.translate(Math.cos(k * 1.3) * 0.08, 0, Math.sin(k * 1.3) * 0.08);
    parts.push(g);
  }
  TUFT = mergeGeometries(parts); TUFT.computeVertexNormals();
  return TUFT;
}

export class World {
  constructor(scene){
    this.scene = scene; this.chunks = new Map(); this.hab = null;
    this.sky = skyDome(); scene.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#ffffff", "#222222", 1); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 1.5); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
    scene.add(this.sun, this.sun.target);
    scene.fog = new THREE.FogExp2("#000000", 0.02);
    this.lamp = new THREE.PointLight("#9ad8ff", 0, 22, 1.2); scene.add(this.lamp);
    this.motes = new Glow(scene, 400, true); this.mote = [];
    this.U = {uT:{value:0}};
    this.waterMat = new THREE.ShaderMaterial({vertexShader:POOL_VS, fragmentShader:WATER_FS, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uT:{value:0}, uIce:{value:0}}]), fog:true, transparent:true, depthWrite:false, side:THREE.DoubleSide});
    this.lavaMat = new THREE.ShaderMaterial({vertexShader:POOL_VS, fragmentShader:LAVA_FS, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uT:{value:0}, uIce:{value:0}}]), fog:true, side:THREE.DoubleSide});
    this.pois = new Pois(scene);
  }
  setHabitat(hab){
    if(this.hab === hab) return;
    this.clear();
    this.hab = hab; const H = this.H = HAB[hab] || HAB.route;
    this.sky.material.uniforms.uTop.value.set(H.sky[0]); this.sky.material.uniforms.uBot.value.set(H.sky[1]);
    this.scene.fog.color.set(H.fog); this.scene.fog.density = H.fogD;
    this.scene.background = new THREE.Color(H.fog);
    this.hemi.color.set(H.hemi[0]); this.hemi.groundColor.set(H.hemi[1]); this.hemi.intensity = H.hemi[2];
    this.sun.color.set(H.sun[0]); this.sun.intensity = H.sun[1];
    this.lamp.intensity = H.dark ? 48 : 0;
    const vc = {vertexColors:true, flatShading:true, roughness:0.92, metalness:0};
    this.solidMat = occlude(new THREE.MeshStandardMaterial(vc), false);
    this.leafMat = occlude(new THREE.MeshStandardMaterial(Object.assign({}, vc, {roughness:0.85})), true);
    const gc = hab === "foyer" ? "#ff6a1a" : hab === "ruines" ? "#c9a6ff" : hab === "grotte" ? "#6fe8ff" : "#35f0d6";
    this.glowMat = occlude(new THREE.MeshStandardMaterial({color:"#111", emissive:gc, emissiveIntensity:2.4, roughness:0.5}), false);
    this.grassMat = new THREE.MeshStandardMaterial({color:H.grass, roughness:0.9, side:THREE.DoubleSide});
    this.grassMat.onBeforeCompile = sh => {
      sh.uniforms.uT = this.U.uT;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uT;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
  { vec4 ip = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float k = transformed.y * transformed.y;
    transformed.x += sin(uT * 1.8 + ip.x * 0.7 + ip.z * 0.5) * 0.16 * k; transformed.z += cos(uT * 1.4 + ip.z * 0.6) * 0.1 * k; }`);
    };
    this.groundMat0 = new THREE.MeshStandardMaterial({color:H.ground, roughness:1});
  }
  clear(){
    for(const c of this.chunks.values()) this.dropChunk(c);
    this.chunks.clear();
    this.pois.clear();
    this.job = null;
  }
  dropChunk(c){
    this.scene.remove(c.group);
    c.group.traverse(o=>{ if(o.geometry && o.geometry !== TUFT) o.geometry.dispose(); });
    if(c.tex) c.tex.dispose();
    if(c.mat) c.mat.dispose();
  }
  /* ---------- un morceau : sol, relief, terrains ---------- */
  buildChunk(R, cx, cy){
    const chunkAt = ref("brChunkAt"); const ch = chunkAt(R, cx, cy);
    const group = new THREE.Group(), c = {cx, cy, ch, group, painted:false};
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(CH, CH).rotateX(-Math.PI / 2), this.groundMat0);
    ground.position.set((cx + 0.5) * CH, 0, (cy + 0.5) * CH); ground.receiveShadow = true;
    group.add(ground); c.ground = ground;
    const solid = [], glow = [], leaves = [];
    for(const o of ch.obs){ const g = obstacle(o, this.hab, this.H); solid.push(...g.solid); glow.push(...g.glow); leaves.push(...g.leaves); }
    /* même jeu d'attributs pour tout le monde, sinon la fusion échoue */
    const norm = (g, color) => { let h = g.index ? g.toNonIndexed() : g; for(const k of Object.keys(h.attributes)) if(k !== "position" && k !== "normal" && !(color && k === "color")) h.deleteAttribute(k);
      if(color && !h.attributes.color) tint(h, "#888888"); if(!h.attributes.normal) h.computeVertexNormals(); return h; };
    const add = (list, mat, shadow, color) => { if(!list.length) return; const geo = mergeGeometries(list.map(g=>norm(g, color))); if(!geo) return;
      const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; group.add(m); list.forEach(g=>g.dispose()); };
    add(solid, this.solidMat, true, true); add(leaves, this.leafMat, true, true); add(glow, this.glowMat, false, false);
    /* les terrains */
    c.pools = [];
    for(const z of ch.zones){
      if(z.k === "water" || z.k === "lava"){
        const mesh = new THREE.Mesh(poolGeo(z.r * S, z.seed || 0.5, 0.12), z.k === "water" ? this.waterMat.clone() : this.lavaMat.clone());
        mesh.material.uniforms.uT = this.U.uT;
        mesh.position.set(z.x * S, 0.025, z.y * S); mesh.renderOrder = 1;
        group.add(mesh); c.pools.push({z, mesh});
      } else if(z.k === "grass"){
        const rr = z.r * S, n = Math.min(260, Math.floor(rr * rr * 5.5)), R = rng(z.seed || 0.3);
        const im = new THREE.InstancedMesh(tuftGeo(), this.grassMat, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
        for(let i = 0; i < n; i++){
          const a = R() * Math.PI * 2, d = Math.sqrt(R()) * rr, s = 0.8 + R() * 0.7;
          m4.compose(new THREE.Vector3(z.x * S + Math.cos(a) * d, 0, z.y * S + Math.sin(a) * d), q.setFromEuler(e.set(0, R() * 6, 0)), new THREE.Vector3(s, s * (0.8 + R() * 0.6), s));
          im.setMatrixAt(i, m4);
        }
        im.receiveShadow = true; group.add(im);
      }
    }
    for(const p of ch.pois) this.pois.add(p, this);
    this.scene.add(group);
    this.chunks.set(cx + "," + cy, c);
    return c;
  }
  /* la peinture du sol, reprise du jeu mobile, par tranches de quelques millisecondes */
  paint(R){
    const store = R.gtex = R.gtex || new Map();
    for(const c of this.chunks.values()){
      if(c.painted) continue;
      const key = c.cx + "," + c.cy, t = store.get(key);
      if(t){ this.applyPaint(c, t); continue; }
      if(t === null){ c.painted = true; continue; }
    }
    if(!this.job){
      /* le morceau sous l'équipe d'abord, puis les plus proches */
      let best = null, bd = 1e9;
      const px = R.x / 480, py = R.y / 480;
      for(const c of this.chunks.values()){ if(c.painted || store.has(c.cx + "," + c.cy)) continue; const d = Math.hypot(c.cx + 0.5 - px, c.cy + 0.5 - py); if(d < bd){ bd = d; best = c; } }
      if(best){ try { const J = ref("brGroundJob")(R.hab, best.cx, best.cy, ref("brGroundSeed")(R)); this.job = J ? {c:best, J} : null; if(!J) store.set(best.cx + "," + best.cy, null); } catch(e){ store.set(best.cx + "," + best.cy, null); } }
    }
    if(this.job){
      const t0 = performance.now(), rows = ref("brGroundRows");
      try {
        while(performance.now() - t0 < 3){ if(rows(this.job.J, 8)){ store.set(this.job.c.cx + "," + this.job.c.cy, this.job.J.c); this.applyPaint(this.job.c, this.job.J.c); this.job = null; break; } }
      } catch(e){ store.set(this.job.c.cx + "," + this.job.c.cy, null); this.job = null; }
    }
  }
  applyPaint(c, canvas){
    c.painted = true;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    c.tex = tex;
    c.mat = new THREE.MeshStandardMaterial({map:tex, roughness:1, metalness:0, color:this.H.dark ? "#9aa2b8" : "#c8c8c8"});
    c.ground.material = c.mat;
  }
  /* au lancement : tout ce qui se voit, d'un coup */
  prime(R){
    const cx = Math.floor(R.x / 480), cy = Math.floor(R.y / 480);
    for(let dx = -2; dx <= 2; dx++) for(let dy = -2; dy <= 2; dy++){ const k = (cx + dx) + "," + (cy + dy); if(!this.chunks.has(k)) this.buildChunk(R, cx + dx, cy + dy); }
  }
  /* ---------- à chaque image ---------- */
  update(R, dt, t, focus){
    this.U.uT.value = t; OCC.uT.value = t;
    this.waterMat.uniforms.uT.value = t;
    const cx = Math.floor(R.x / 480), cy = Math.floor(R.y / 480), RAD = 3;
    for(let dx = -RAD; dx <= RAD; dx++) for(let dy = -RAD; dy <= RAD; dy++){
      if(dx * dx + dy * dy > RAD * RAD + 2) continue;
      const k = (cx + dx) + "," + (cy + dy);
      if(!this.chunks.has(k)){ this.buildChunk(R, cx + dx, cy + dy); break; }       /* un morceau neuf par image, pas plus */
    }
    for(const [k, c] of this.chunks){ if(Math.abs(c.cx - cx) > RAD + 1 || Math.abs(c.cy - cy) > RAD + 1){ this.dropChunk(c); this.pois.dropChunk(c.ch); this.chunks.delete(k); } }
    this.paint(R);
    /* l'eau gelée, la lave figée */
    for(const c of this.chunks.values()) for(const p of c.pools){ const u = p.mesh.material.uniforms; const want = p.z.cooled > 0 || p.z.frozen > 0 || p.z.ice > 0 ? 1 : 0; u.uIce.value += (want - u.uIce.value) * Math.min(1, dt * 4); }
    /* le soleil (et ses ombres) suit l'équipe */
    this.sun.position.set(focus.x + 14, 26, focus.z + 9); this.sun.target.position.copy(focus);
    this.lamp.position.set(focus.x, 2.6, focus.z);
    this.sky.position.copy(focus);
    this.sky.material.uniforms.uT.value = t;
    this.pois.update(R, dt, t);
  }
  /* l'ambiance : pollen, lucioles, embruns, poussière, glyphes, braises */
  ambient(dt, t, eye){
    const H = this.H; if(!H) return;
    const M = this.mote, kind = H.amb;
    while(M.length < 140) M.push({x:eye.x + (Math.random() - .5) * 40, y:Math.random() * 6, z:eye.z + (Math.random() - .5) * 40, p:Math.random() * 6, s:0.04 + Math.random() * 0.08});
    this.motes.begin();
    const c = kind === "ember" ? "#ff7a2a" : kind === "firefly" ? "#c8ff6a" : kind === "spray" ? "#bfe8ff" : kind === "glyph" ? "#c9a6ff" : kind === "dust" ? "#6fe8ff" : "#ffe9a8";
    for(const m of M){
      if(kind === "ember"){ m.y += dt * (0.6 + m.s * 6); m.x += Math.sin(t + m.p) * dt * 0.3; }
      else if(kind === "spray"){ m.y -= dt * 0.15; m.x += dt * 0.4; }
      else { m.x += Math.sin(t * 0.5 + m.p) * dt * 0.25; m.z += Math.cos(t * 0.4 + m.p) * dt * 0.25; m.y += Math.sin(t * 0.9 + m.p) * dt * 0.1; }
      if(m.y > 7 || m.y < 0 || Math.abs(m.x - eye.x) > 22 || Math.abs(m.z - eye.z) > 22){ m.x = eye.x + (Math.random() - .5) * 40; m.z = eye.z + (Math.random() - .5) * 40; m.y = kind === "ember" ? 0 : Math.random() * 5; }
      const tw = kind === "firefly" ? Math.max(0, Math.sin(t * 2 + m.p * 5)) : 0.6 + 0.4 * Math.sin(t * 3 + m.p * 7);
      this.motes.add(m.x, m.y, m.z, m.s * (kind === "firefly" ? 3.2 : 2.2), c, tw * (kind === "dust" ? 0.5 : 0.8));
    }
    this.motes.end();
  }
  dispose(){ this.clear(); }
}

/* ============================================================
   LES LIEUX
   ============================================================ */
const PC = {cache:"#35f0d6", autel:"#ffd24a", captif:"#5ce07a", arbre:"#ff6a5a", souche:"#9fe07a", remous:"#4fb2ff", cristal:"#aef4ff", glyphe:"#c9a6ff", geyser:"#ff8a3d"};
class Pois {
  constructor(scene){
    this.scene = scene; this.map = new Map();
    this.metal = new THREE.MeshStandardMaterial({color:"#1a2230", roughness:0.4, metalness:0.6});
    this.stone = new THREE.MeshStandardMaterial({color:"#5a5866", roughness:0.85, flatShading:true});
    this.wood = new THREE.MeshStandardMaterial({color:"#4a3020", roughness:0.9, flatShading:true});
    this.leaf = new THREE.MeshStandardMaterial({color:"#3d6a32", roughness:0.85, flatShading:true});
    this.glowM = c => new THREE.MeshStandardMaterial({color:"#111", emissive:c, emissiveIntensity:2.2, roughness:0.4});
    this.addM = (c, o = 0.5) => new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:o, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide});
  }
  add(p, world){
    if(this.map.has(p) || p.k === "nid") return;
    const g = new THREE.Group(), c = PC[p.k] || "#ffffff", u = {};
    g.position.set(p.x * S, 0, p.y * S);
    switch(p.k){
      case "cache": {
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.8), this.metal); box.position.y = 0.35; box.castShadow = true;
        const lid = new THREE.Group(); lid.position.set(0, 0.7, -0.4);
        const lm = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.12, 0.84), this.metal); lm.position.set(0, 0.06, 0.42); lid.add(lm);
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.36), this.glowM(c)); scr.position.set(0, 0.38, 0.405);
        const holo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.4, 12, 1, true), this.addM(c, 0.18)); holo.position.y = 1.5;
        g.add(box, lid, scr, holo); Object.assign(u, {lid, holo, scr}); break; }
      case "autel": {
        const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.35, 8), this.stone); dais.position.y = 0.17; dais.receiveShadow = true; dais.castShadow = true;
        g.add(dais);
        for(let k = 0; k < 3; k++){ const a = k / 3 * Math.PI * 2; const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 2.2, 4), this.stone); ob.position.set(Math.cos(a) * 1.35, 1.3, Math.sin(a) * 1.35); ob.castShadow = true; g.add(ob); }
        const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0).scale(0.8, 1.4, 0.8), this.glowM(c)); cry.position.y = 1.6;
        const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 16, 1, true), this.addM(c, 0.12)); col2.position.y = 4.5;
        g.add(cry, col2); Object.assign(u, {cry, col:col2}); break; }
      case "captif": {
        const cage = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 1.5), this.addM(c, 0.16)); cage.position.y = 0.85;
        const bars = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.7, 1.5)), new THREE.LineBasicMaterial({color:c}));
        bars.position.y = 0.85;
        g.add(cage, bars); Object.assign(u, {cage, bars});
        try {
          const id = p.id || null;
          if(id){ const m = makeMon(id, false, g, {height:0.9}); u.mon = m; }
        } catch(e){}
        break; }
      case "arbre": {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 2, 7), this.wood); tr.position.y = 1; tr.castShadow = true;
        const cn = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), this.leaf); cn.position.y = 2.4; cn.castShadow = true;
        g.add(tr, cn);
        const berries = [];
        for(let k = 0; k < 7; k++){ const a = k * 0.95; const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), this.glowM(k % 3 ? "#e8443a" : "#4a7aff")); b.position.set(Math.cos(a) * 1.05, 2.0 + Math.sin(k * 2.1) * 0.35, Math.sin(a) * 1.05); g.add(b); berries.push(b); }
        u.berries = berries; break; }
      case "souche": {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.75, 12), this.wood); st.position.y = 0.37; st.castShadow = true;
        const top = new THREE.Mesh(new THREE.CircleGeometry(0.74, 24), new THREE.MeshStandardMaterial({color:"#8a6a42", roughness:0.9})); top.rotation.x = -Math.PI / 2; top.position.y = 0.751;
        g.add(st, top);
        const shoots = [];
        for(let k = 0; k < 4; k++){ const s = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 5), this.glowM(c)); s.position.set(Math.cos(k * 1.6) * 0.5, 0.95, Math.sin(k * 1.6) * 0.5); g.add(s); shoots.push(s); }
        u.shoots = shoots; break; }
      case "remous": {
        const w = new THREE.Mesh(new THREE.RingGeometry(0.3, 2.1, 40, 3), this.addM(c, 0.35)); w.rotation.x = -Math.PI / 2; w.position.y = 0.05;
        const w2 = new THREE.Mesh(new THREE.RingGeometry(0.2, 1.3, 30, 2), this.addM("#ffffff", 0.2)); w2.rotation.x = -Math.PI / 2; w2.position.y = 0.06;
        g.add(w, w2); Object.assign(u, {w, w2}); break; }
      case "cristal": {
        const cm = this.glowM(c); cm.emissiveIntensity = 1.4; cm.transparent = true; cm.opacity = 0.9;
        for(let k = 0; k < 6; k++){ const h = 1 + Math.random() * 2.2; const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0).scale(0.7, h * 1.4, 0.7), cm);
          s.position.set((Math.random() - .5) * 1.2, h * 0.45, (Math.random() - .5) * 1.2); s.rotation.set((Math.random() - .5) * 0.6, Math.random() * 3, (Math.random() - .5) * 0.6); s.castShadow = true; g.add(s); }
        u.cm = cm; break; }
      case "glyphe": {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 2.2), this.stone); slab.position.y = 0.08; slab.receiveShadow = true;
        const gl = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.85, 6), this.glowM(c)); gl.rotation.x = -Math.PI / 2; gl.position.y = 0.17;
        const gl2 = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.25, 3), this.glowM(c)); gl2.rotation.x = -Math.PI / 2; gl2.position.y = 0.17;
        g.add(slab, gl, gl2); Object.assign(u, {gl, gl2}); break; }
      case "geyser": {
        for(let k = 0; k < 7; k++){ const a = k / 7 * Math.PI * 2; const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + Math.random() * 0.15, 0), this.stone); r2.position.set(Math.cos(a) * 0.75, 0.15, Math.sin(a) * 0.75); r2.castShadow = true; g.add(r2); }
        const vent = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), this.glowM(c)); vent.rotation.x = -Math.PI / 2; vent.position.y = 0.04;
        const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 6, 14, 1, true), this.addM("#ff8a3d", 0.55)); jet.position.y = 3; jet.visible = false;
        g.add(vent, jet); Object.assign(u, {vent, jet}); break; }
      default: return;
    }
    this.scene.add(g);
    this.map.set(p, {g, u, p});
  }
  update(R, dt, t){
    const POI = ref("BR_POI") || {};
    for(const r of this.map.values()){
      const p = r.p, u = r.u, spent = !!p.used, hold = (POI[p.k] && POI[p.k].hold) || 0, prog = hold ? Math.min(1, (p.prog || 0) / hold) : 0;
      switch(p.k){
        case "cache": u.lid.rotation.x = -Math.min(1.9, (spent ? 1 : prog) * 1.9); u.holo.visible = !spent; u.holo.rotation.y = t; u.holo.material.opacity = 0.12 + prog * 0.3; break;
        case "autel": u.cry.rotation.y = t * 1.2; u.cry.position.y = 1.6 + Math.sin(t * 2) * 0.12; u.col.visible = !spent; u.col.material.opacity = 0.08 + prog * 0.3; u.cry.visible = !spent; break;
        case "captif": u.cage.visible = u.bars.visible = !spent; if(u.mon){ u.mon.update(t, dt, new THREE.Vector3(0, 0, 0), Math.sin(t) * 0.6, null, null); if(spent && !u.gone){ u.gone = true; u.mon.dispose(); } }
          u.bars.position.x = !spent && Math.random() < 0.05 ? (Math.random() - .5) * 0.1 : 0; break;
        case "arbre": { const ripe = (p.cd || 0) < 4; for(const b of u.berries){ b.material.emissiveIntensity = ripe ? 2.6 + Math.sin(t * 6) * 0.8 : 0.9; } break; }
        case "souche": for(const s of u.shoots){ s.scale.y = spent ? 2.4 : 1 + prog; } break;
        case "remous": u.w.rotation.z = t * 1.6; u.w2.rotation.z = -t * 2.6; break;
        case "cristal": u.cm.emissiveIntensity = spent ? 0.4 : 1.2 + prog * 2 + Math.sin(t * 3) * 0.2; break;
        case "glyphe": { const ready = !(p.cd > 0); u.gl.material.emissiveIntensity = ready ? 2.6 + Math.sin(t * 4) * 0.6 : 0.4; u.gl.rotation.z = t * 0.5; break; }
        case "geyser": { const ph = p.phase || 0, erupt = ph < 0.75 && p.t > 1; u.jet.visible = erupt; if(erupt){ u.jet.scale.set(1 + Math.random() * 0.15, (1 - ph / 0.75) * (0.8 + Math.random() * 0.4), 1 + Math.random() * 0.15); u.jet.position.y = 3 * u.jet.scale.y; }
          u.vent.material.emissiveIntensity = ph > 4.6 ? 3 + Math.sin(t * 24) * 1.5 : 1.2; break; }
      }
    }
  }
  dropChunk(ch){ for(const p of ch.pois){ const r = this.map.get(p); if(r){ this.scene.remove(r.g); if(r.u.mon) r.u.mon.dispose(); this.map.delete(p); } } }
  clear(){ for(const r of this.map.values()){ this.scene.remove(r.g); if(r.u.mon) r.u.mon.dispose(); } this.map.clear(); }
}
