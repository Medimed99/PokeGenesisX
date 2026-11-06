/* Les arbres et les buissons : des feuillus ronds comme dans les jeux d'origine, des sapins sur
   les collines, des buissons le long du chemin. Géométrie générée, instanciée par variante :
   quelques appels de dessin pour un millier d'arbres. Le feuillage ondule au vent. */
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { heightAt, pathDist, tallGrassAt, lakeAt, normalAt, BOUNDS, PATH_W, LEDGES, pathX, onBeach, BIOMES, passMask, biomeMask, siteClear } from "./layout.js";
/* les cols vers les biomes restent dégagés (et rien ne pousse dans un biome : il a sa propre végétation) */
const clearOf = (x, z) => !siteClear(x, z, 5) && !BIOMES.some(b=>passMask(b, x, z).m > 0.02 || biomeMask(b, x, z) > 0.02);
import { mulberry32, noiseFn } from "../util.js";
import { CZ, ZONES, corruptStandard } from "./corruption.js";

const nT = noiseFn(211);

function colorize(geo, fn){
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for(let i = 0; i < p.count; i++){ fn(p.getX(i), p.getY(i), p.getZ(i), c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}
function blob(r, x, y, z, seed, det = 3){
  let g = new THREE.IcosahedronGeometry(r, det);
  g.deleteAttribute("normal"); g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position, rnd = mulberry32(seed);
  const o = rnd() * 100;
  for(let i = 0; i < p.count; i++){
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    const k = 1 + 0.16 * nT(vx * 0.9 + o, vz * 0.9 + vy * 0.7) + 0.06 * nT(vx * 3 + o, vy * 3 - vz);
    p.setXYZ(i, vx * k + x, vy * k * 0.86 + y, vz * k + z);
  }
  g.computeVertexNormals();
  return g;
}
/* une couronne lisse : on soude les boules, et on garde des normales « gonflées »
   (tournées vers l'extérieur de la couronne) : la lumière l'enveloppe comme un nuage de feuilles */
function crownFrom(parts, cy){
  const g = mergeGeometries(parts);
  const p = g.attributes.position, n = g.attributes.normal;
  for(let i = 0; i < p.count; i++){
    const ox = p.getX(i), oy = p.getY(i) - cy, oz = p.getZ(i), L = Math.hypot(ox, oy, oz) || 1;
    const nx = n.getX(i) * 0.45 + ox / L * 0.55, ny = n.getY(i) * 0.45 + oy / L * 0.55, nz = n.getZ(i) * 0.45 + oz / L * 0.55, M = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(i, nx / M, ny / M, nz / M);
  }
  return g;
}
/* un feuillu : tronc légèrement penché, couronne de boules */
function broadleaf(seed){
  const rnd = mulberry32(seed);
  const H = 2.1 + rnd() * 1.0;
  const trunk = new THREE.CylinderGeometry(0.2, 0.34, H + 0.6, 8, 3);
  trunk.translate(0, H / 2, 0);
  const tp = trunk.attributes.position;
  for(let i = 0; i < tp.count; i++){ const y = tp.getY(i); tp.setX(i, tp.getX(i) + Math.sin(y * 0.6 + seed) * 0.12 * y / H); }
  trunk.computeVertexNormals();
  colorize(trunk, (x, y, z, c)=>c.set("#45392f").lerp(new THREE.Color("#62554a"), 0.5 + 0.5 * Math.sin(y * 7 + x * 20)));
  const parts = [], R = 2.1 + rnd() * 0.7;
  parts.push(blob(R, 0, H + R * 0.55, 0, seed * 7 + 1));
  const n = 4 + Math.floor(rnd() * 3);
  for(let i = 0; i < n; i++){
    const a = i / n * Math.PI * 2 + rnd(), d = R * (0.55 + rnd() * 0.3);
    parts.push(blob(R * (0.55 + rnd() * 0.3), Math.cos(a) * d, H + R * (0.1 + rnd() * 0.7), Math.sin(a) * d, seed * 7 + 2 + i));
  }
  parts.push(blob(R * 0.7, 0, H + R * 1.25, 0, seed * 7 + 31));
  const crown = crownFrom(parts, H + R);
  const top = H + R * 2;
  const leaf = new THREE.Color(["#43603f", "#4b6440", "#3e5c46"][seed % 3]), dark = new THREE.Color("#18271c"), light = new THREE.Color("#86965e");
  colorize(crown, (x, y, z, c)=>{
    const k = (y - H) / (top - H);
    c.copy(dark).lerp(leaf, Math.min(1, k * 1.6)).lerp(light, Math.max(0, k - 0.62) * 1.1);
    c.multiplyScalar(0.92 + 0.16 * nT(x * 1.3, z * 1.3 + y));
  });
  return {trunk, crown, h:top, r:R * 1.4};
}
/* un sapin, pour les collines */
function conifer(seed){
  const rnd = mulberry32(seed);
  const H = 5 + rnd() * 3;
  const trunk = new THREE.CylinderGeometry(0.12, 0.26, H * 0.4, 6); trunk.translate(0, H * 0.2, 0);
  colorize(trunk, (x, y, z, c)=>c.set("#3e332b"));
  const parts = [];
  for(let i = 0; i < 4; i++){
    const r = (1.6 - i * 0.32) * (0.9 + rnd() * 0.2), h = H * 0.34;
    const cone = new THREE.ConeGeometry(r, h, 12, 3); cone.translate(0, H * 0.28 + i * H * 0.19 + h / 2, 0);
    const p = cone.attributes.position;
    for(let k = 0; k < p.count; k++){ const s = 1 + 0.08 * nT(p.getX(k) * 2 + i, p.getZ(k) * 2); p.setX(k, p.getX(k) * s); p.setZ(k, p.getZ(k) * s); }
    cone.computeVertexNormals();
    parts.push(cone.toNonIndexed());
  }
  const crown = mergeGeometries(parts);
  colorize(crown, (x, y, z, c)=>c.set("#18291f").lerp(new THREE.Color("#466552"), Math.min(1, y / H) * 0.9));
  return {trunk, crown, h:H, r:1.7};
}
/* un arbre mort : un tronc noir et des branches nues, pour les silhouettes dans la brume */
function deadTree(seed){
  const rnd = mulberry32(seed);
  const H = 4.2 + rnd() * 2.2, parts = [];
  const trunk = new THREE.CylinderGeometry(0.09, 0.3, H, 7, 6); trunk.translate(0, H / 2, 0);
  const tp = trunk.attributes.position;
  for(let i = 0; i < tp.count; i++){ const y = tp.getY(i); tp.setX(i, tp.getX(i) + Math.sin(y * 0.8 + seed) * 0.18 * y / H); }
  parts.push(trunk.toNonIndexed());
  const n = 5 + Math.floor(rnd() * 4);
  for(let i = 0; i < n; i++){
    const L = 0.9 + rnd() * 1.6, y = H * (0.42 + rnd() * 0.5), a = rnd() * Math.PI * 2, tilt = 0.5 + rnd() * 0.7;
    const b = new THREE.CylinderGeometry(0.015, 0.07, L, 5); b.translate(0, L / 2, 0);
    b.rotateZ(-tilt); b.rotateY(a); b.translate(Math.sin(y * 0.8 + seed) * 0.18 * y / H, y, 0);
    parts.push(b.toNonIndexed());
    /* une ramille au bout */
    const L2 = L * 0.45, b2 = new THREE.CylinderGeometry(0.008, 0.03, L2, 4); b2.translate(0, L2 / 2, 0);
    b2.rotateZ(-tilt + 0.7 * (rnd() - 0.5) - 0.4); b2.rotateY(a + (rnd() - 0.5));
    const tip = new THREE.Vector3(0, L * 0.7, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -tilt).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    b2.translate(tip.x, y + tip.y, tip.z);
    parts.push(b2.toNonIndexed());
  }
  const g = mergeGeometries(parts);
  colorize(g, (x, y, z, c)=>c.set("#2a2522").lerp(new THREE.Color("#4a433d"), Math.min(1, y / H)));
  g.computeVertexNormals();
  return g;
}
function bush(seed){
  const parts = [blob(0.8, 0, 0.45, 0, seed, 2), blob(0.6, 0.6, 0.35, 0.2, seed + 1, 2), blob(0.55, -0.5, 0.32, -0.25, seed + 2, 2)];
  const g = crownFrom(parts, 0.4);
  colorize(g, (x, y, z, c)=>c.set("#223322").lerp(new THREE.Color("#687a4e"), Math.min(1, y / 1.1)));
  return g;
}

function windMaterial(uniforms, sway){
  const m = new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.88, metalness:0});
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uWind = uniforms.uWind;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime, uWind;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  #else
  vec3 ip = vec3(0.0);
  #endif
  float sw = ${sway.toFixed(3)} * max(0.0, transformed.y - 1.5) * uWind;
  transformed.x += sin(uTime * 1.1 + ip.x * 0.3 + ip.z * 0.2) * sw * 0.06 + sin(uTime * 3.1 + transformed.y * 2.0 + ip.x) * sw * 0.015;
  transformed.z += cos(uTime * 0.9 + ip.z * 0.25) * sw * 0.045;`);
  };
  m.customProgramCacheKey = () => "wind" + sway;
  return m;
}

export class Trees {
  constructor(scene){
    this.scene = scene; this.colliders = []; this.meshes = [];
    this.uniforms = {uTime:{value:0}, uWind:{value:1}};
  }
  build(quality){
    const rnd = mulberry32(4242);
    const spots = {broad:[], conifer:[], bush:[], dead:[]};
    const freeOf = (x, z, r) => !this.colliders.some(c=>Math.hypot(c.x - x, c.z - z) < c.r + r);
    const addTree = (kind, x, z, s, collide) => {
      const y = heightAt(x, z);
      if(lakeAt(x, z) > 0.1 || onBeach(x, z) || !clearOf(x, z)) return;
      spots[kind].push({x, y, z, s, a:rnd() * Math.PI * 2});
      if(collide) this.colliders.push({x, z, r:kind === "bush" ? 0.75 * s : 0.42 * s});
    };
    /* les murs d'arbres qui ferment la route, en plusieurs rangs */
    for(let z = BOUNDS.z0 - 30; z <= BOUNDS.z1 + 30; z += 2.7){
      for(const side of [-1, 1]){
        for(let row = 0; row < 7; row++){
          const x = side * (44 + row * 3.6 + rnd() * 2.2), zz = z + (rnd() - 0.5) * 2.2 + row * 1.1;
          if(lakeAt(x, zz) > 0.2) continue;
          addTree(row > 3 || rnd() < 0.2 ? "conifer" : "broad", x, zz, 0.9 + rnd() * 0.45, Math.abs(x) < 52);
        }
        /* la lisière : des buissons qui cachent les troncs */
        if(rnd() < 0.8){ const x = side * (41.5 + rnd() * 1.5), zz = z + (rnd() - 0.5) * 2; if(lakeAt(x, zz) < 0.1 && tallGrassAt(x, zz) < 0.1) addTree("bush", x, zz, 0.9 + rnd() * 0.5, true); }
      }
    }
    /* au-delà des portes, au nord et au sud */
    for(let i = 0; i < 260; i++){
      const x = (rnd() - 0.5) * 180, z = (rnd() < 0.5 ? -1 : 1) * (158 + rnd() * 55);
      if(Math.abs(x - pathX(z)) < 7) continue;
      addTree(rnd() < 0.5 ? "conifer" : "broad", x, z, 0.8 + rnd() * 0.5, false);
    }
    /* sur la route : des bosquets, jamais sur le chemin, l'herbe haute ou le lac */
    for(let i = 0; i < 900 && spots.broad.length < 2000; i++){
      const x = BOUNDS.x0 + 4 + rnd() * (BOUNDS.x1 - BOUNDS.x0 - 8), z = BOUNDS.z0 + 6 + rnd() * (BOUNDS.z1 - BOUNDS.z0 - 12);
      const dp = pathDist(x, z);
      if(dp < PATH_W + 3.5 || tallGrassAt(x, z) > 0.05 || lakeAt(x, z) > 0.02) continue;
      if(LEDGES.some(L=>Math.abs(z - L.z) < 2.5)) continue;
      if(normalAt(x, z)[1] < 0.85) continue;
      const cluster = 0.5 + 0.5 * nT(x / 22, z / 22);
      if(rnd() > cluster * 0.55) continue;
      if(!freeOf(x, z, 2.4)) continue;
      addTree(rnd() < 0.14 ? "bush" : rnd() < 0.22 ? "dead" : "broad", x, z, 0.8 + rnd() * 0.4, true);
    }
    /* autour des zones désindexées, des arbres morts */
    for(const Z of ZONES){
      for(let i = 0; i < 3 + Math.round(Z.r / 3); i++){
        const a = rnd() * Math.PI * 2, r = Z.r * (1.05 + rnd() * 0.6), x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r;
        if(pathDist(x, z) < PATH_W + 1.5 || lakeAt(x, z) > 0.02 || !freeOf(x, z, 1.6) || Math.abs(x) > 44) continue;
        addTree("dead", x, z, 0.85 + rnd() * 0.4, true);
      }
    }
    /* des buissons le long du chemin et des corniches */
    for(let z = BOUNDS.z0 + 4; z < BOUNDS.z1 - 4; z += 2.6){
      if(rnd() < 0.55) continue;
      const px = pathX(z), side = rnd() < 0.5 ? -1 : 1, x = px + side * (PATH_W + 2.2 + rnd() * 2.5);
      if(tallGrassAt(x, z) > 0.05 || lakeAt(x, z) > 0.02 || !freeOf(x, z, 1.2)) continue;
      addTree("bush", x, z, 0.7 + rnd() * 0.5, true);
    }
    const variants = {broad:[0, 1, 2, 3].map(s=>broadleaf(17 + s * 13)), conifer:[0, 1].map(s=>conifer(91 + s * 7))};
    const bushG = [bush(5), bush(9)];
    const trunkMat = corruptStandard(new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.95}), CZ, "trunk");
    const leafMat = corruptStandard(windMaterial(this.uniforms, 1.0), CZ, "leaf"), bushMat = corruptStandard(windMaterial(this.uniforms, 0.0), CZ, "bush");
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), pos = new THREE.Vector3();
    const place = (list, geo, mat, shadow) => {
      if(!list.length) return;
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      const col = new THREE.Color();
      list.forEach((t, i)=>{ q.setFromAxisAngle(up, t.a); sc.setScalar(t.s); pos.set(t.x, t.y - 0.12, t.z); m4.compose(pos, q, sc); im.setMatrixAt(i, m4);
        col.setHSL(0, 0, 0.86 + ((t.x * 7.31 + t.z * 3.17) % 1 + 1) % 1 * 0.28); im.setColorAt(i, col); });
      im.castShadow = shadow; im.receiveShadow = true;
      im.computeBoundingSphere();
      this.scene.add(im); this.meshes.push(im);
    };
    for(const kind of ["broad", "conifer"]){
      const V = variants[kind];
      V.forEach((v, vi)=>{
        const list = spots[kind].filter((_, i)=>i % V.length === vi);
        place(list, v.trunk, trunkMat, true);
        place(list, v.crown, leafMat, true);
      });
    }
    bushG.forEach((g, vi)=>place(spots.bush.filter((_, i)=>i % 2 === vi), g, bushMat, true));
    const deadG = [deadTree(301), deadTree(317), deadTree(333)];
    deadG.forEach((g, vi)=>place(spots.dead.filter((_, i)=>i % 3 === vi), g, trunkMat, true));
    this.count = spots.broad.length + spots.conifer.length + spots.bush.length + spots.dead.length;
  }
  update(t, wind){ this.uniforms.uTime.value = t; this.uniforms.uWind.value = wind; }
}
