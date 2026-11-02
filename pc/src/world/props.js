/* Le décor : les pierres qui bordent les corniches, les clôtures près des villes, le panneau
   de la Route 1, des rochers, des fleurs, et la limite du monde restauré — un rideau de
   données là où l'archive n'a pas encore été réécrite. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { heightAt, pathDist, pathX, tallGrassAt, lakeAt, normalAt, LEDGES, BOUNDS, PATH_W, LAKE } from "./layout.js";
import { mulberry32, noiseFn } from "../util.js";
import { CZ, corruptStandard } from "./corruption.js";

const nP = noiseFn(331);

function rockGeo(seed, det = 1){
  const g = new THREE.IcosahedronGeometry(1, det), p = g.attributes.position, o = seed * 3.1;
  for(let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.22 * nP(x * 1.3 + o, z * 1.3 + y) + 0.08 * nP(x * 4 - o, y * 4);
    p.setXYZ(i, x * k, y * k * 0.62, z * k);
  }
  g.computeVertexNormals();
  return g;
}
function instanced(scene, geo, mat, list, shadow = true){
  if(!list.length) return null;
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach((t, i)=>{ e.set(t.rx || 0, t.ry || 0, t.rz || 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(t.x, t.y, t.z), q, new THREE.Vector3(t.sx || t.s || 1, t.sy || t.s || 1, t.sz || t.s || 1)); im.setMatrixAt(i, m4);
    if(t.c && im.instanceColor === null) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
    if(t.c) im.setColorAt(i, t.c); });
  im.castShadow = shadow; im.receiveShadow = true; im.computeBoundingSphere();
  scene.add(im);
  return im;
}

export function buildProps(scene, colliders){
  const rnd = mulberry32(777);
  const rockMat = corruptStandard(new THREE.MeshStandardMaterial({color:"#5b5d5c", roughness:0.92}), CZ, "rock");
  /* --- les corniches : un rebord de pierres et de terre, sauf dans la brèche du chemin --- */
  const lip = [];
  for(const L of LEDGES){
    const px = pathX(L.z);
    for(let x = BOUNDS.x0 - 4; x < BOUNDS.x1 + 4; x += 0.55){
      if(Math.abs(x - px) < 6.2) continue;
      const z = L.z - 0.05 + (rnd() - 0.5) * 0.12, y = heightAt(x, z + 0.25);
      lip.push({x, y:y - 0.18, z:z + 0.18, s:0.32 + rnd() * 0.16, ry:rnd() * 6, sx:0.42 + rnd() * 0.2, sy:0.3 + rnd() * 0.12, sz:0.32 + rnd() * 0.1,
        c:new THREE.Color().setHSL(0.08 + rnd() * 0.03, 0.08, 0.2 + rnd() * 0.07)});
    }
  }
  instanced(scene, rockGeo(1, 1), corruptStandard(new THREE.MeshStandardMaterial({roughness:0.95}), CZ, "lip"), lip, true);
  /* --- des rochers épars, et sur la rive du lac --- */
  const rocks = [];
  for(let i = 0; i < 140; i++){
    const nearLake = i < 40;
    const a = rnd() * Math.PI * 2;
    const x = nearLake ? LAKE.x + Math.cos(a) * LAKE.rx * (0.95 + rnd() * 0.25) : BOUNDS.x0 + rnd() * (BOUNDS.x1 - BOUNDS.x0);
    const z = nearLake ? LAKE.z + Math.sin(a) * LAKE.rz * (0.95 + rnd() * 0.25) : BOUNDS.z0 + rnd() * (BOUNDS.z1 - BOUNDS.z0);
    if(pathDist(x, z) < PATH_W + 1.5 || tallGrassAt(x, z) > 0.2) continue;
    if(!nearLake && rnd() < 0.5) continue;
    const s = nearLake ? 0.35 + rnd() * 0.6 : 0.3 + rnd() * 1.1;
    const y = heightAt(x, z);
    rocks.push({x, y:y - s * 0.15, z, s, ry:rnd() * 6, c:new THREE.Color().setHSL(0.1, 0.06 + rnd() * 0.05, 0.5 + rnd() * 0.15)});
    if(s > 0.7) colliders.push({x, z, r:s * 0.9});
  }
  instanced(scene, rockGeo(7, 2), rockMat, rocks, true);
  /* --- les fleurs : rares et pâles, des taches de cendre et de lilas dans la pelouse --- */
  const petal = new THREE.CircleGeometry(0.06, 5); petal.translate(0, 0, 0.002);
  const stem = new THREE.PlaneGeometry(0.012, 0.22); stem.translate(0, 0.11, 0);
  const head = mergeGeometries([petal.clone().rotateX(-Math.PI / 2).translate(0, 0.22, 0)]);
  const flowers = [], stems = [];
  const cols = ["#b9bfc4", "#9d93ab", "#c9c2a4", "#8a7f95"];
  for(let i = 0; i < 900; i++){
    const cx = BOUNDS.x0 + rnd() * (BOUNDS.x1 - BOUNDS.x0), cz = BOUNDS.z0 + rnd() * (BOUNDS.z1 - BOUNDS.z0);
    if(nP(cx / 14, cz / 14) < 0.35) continue;
    const c = new THREE.Color(cols[Math.floor(rnd() * cols.length)]);
    for(let k = 0; k < 7; k++){
      const x = cx + (rnd() - 0.5) * 2.2, z = cz + (rnd() - 0.5) * 2.2;
      const dp = pathDist(x, z);
      if(dp < PATH_W + 0.4 || tallGrassAt(x, z) > 0.3 || lakeAt(x, z) > 0.1 || normalAt(x, z)[1] < 0.85) continue;
      const y = heightAt(x, z), s = 0.8 + rnd() * 0.5;
      flowers.push({x, y, z, s, ry:rnd() * 6, c});
      stems.push({x, y, z, s, ry:rnd() * 6});
    }
  }
  instanced(scene, head, new THREE.MeshStandardMaterial({roughness:0.6, side:THREE.DoubleSide, emissive:"#000"}), flowers, false);
  instanced(scene, stem, new THREE.MeshStandardMaterial({color:"#34432c", side:THREE.DoubleSide}), stems, false);
  /* --- les clôtures, près des deux villes --- */
  const posts = [], rails = [];
  for(const [za, zb] of [[118, 146], [-146, -118]]){
    for(const side of [-1, 1]){
      let prev = null;
      for(let z = za; z <= zb; z += 2.2){
        const x = pathX(z) + side * (PATH_W + 1.1), y = heightAt(x, z);
        posts.push({x, y:y + 0.42, z, s:1});
        colliders.push({x, z, r:0.2});
        if(prev){
          const dx = x - prev.x, dz = z - prev.z, len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
          for(const h of [0.35, 0.68]) rails.push({x:(x + prev.x) / 2, y:(y + prev.y) / 2 + h, z:(z + prev.z) / 2, sx:1, sy:1, sz:len, ry});
          for(let t = 0.25; t < 1; t += 0.25) colliders.push({x:prev.x + dx * t, z:prev.z + dz * t, r:0.2});
        }
        prev = {x, y, z};
      }
    }
  }
  const wood = corruptStandard(new THREE.MeshStandardMaterial({color:"#4a3d30", roughness:0.9}), CZ, "wood");
  instanced(scene, new THREE.BoxGeometry(0.14, 0.95, 0.14), wood, posts, true);
  instanced(scene, new THREE.BoxGeometry(0.07, 0.09, 1), wood, rails, true);
  /* --- le panneau de la Route 1 --- */
  buildSign(scene, colliders, pathX(132) + PATH_W + 2.2, 132, ["ROUTE 1", "↑ Jadielle", "↓ Bourg Palette"]);
  buildSign(scene, colliders, pathX(-136) - PATH_W - 2.2, -136, ["ROUTE 1", "↑ Jadielle", "↓ Bourg Palette"]);
  /* --- la limite : le rideau des données non restaurées --- */
  return buildBoundary(scene);
}

function buildSign(scene, colliders, x, z, lines, rot = 0){
  const y = heightAt(x, z);
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128;
  const g = cv.getContext("2d");
  buildSignTexture(g, lines);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 0.08), [
    new THREE.MeshStandardMaterial({color:"#33291f"}), new THREE.MeshStandardMaterial({color:"#33291f"}),
    new THREE.MeshStandardMaterial({color:"#33291f"}), new THREE.MeshStandardMaterial({color:"#33291f"}),
    new THREE.MeshStandardMaterial({map:tex, roughness:0.8}), new THREE.MeshStandardMaterial({map:tex, roughness:0.8})]);
  board.position.set(x, y + 1.25, z); board.rotation.y = rot + Math.PI / 2 * Math.sign(x - pathX(z)) * -1;
  board.castShadow = true;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), new THREE.MeshStandardMaterial({color:"#33291f"}));
  post.position.set(x, y + 0.6, z); post.castShadow = true;
  scene.add(board, post);
  colliders.push({x, z, r:0.35});
  /* repris plus tard pour redessiner le texte une fois la police chargée */
  board.userData.redraw = () => { buildSignTexture(g, lines); tex.needsUpdate = true; };
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>board.userData.redraw());
}
function buildSignTexture(g, lines){
  /* un panneau délavé, et une lettre qui manque : l'archive les a mal recopiés */
  g.fillStyle = "#3d3127"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#4a3c2f"; for(let i = 0; i < 6; i++) g.fillRect(0, i * 22 + 4, 256, 3);
  g.strokeStyle = "#221a13"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 120);
  g.fillStyle = "#c9c2b2"; g.textAlign = "center";
  g.font = "bold 34px 'Pixelify Sans', sans-serif"; g.fillText(lines[0], 128, 46);
  g.font = "22px 'Pixelify Sans', sans-serif"; g.fillText(lines[1], 128, 80); g.fillText(lines[2], 128, 108);
  /* des bandes déchirées : des pixels décalés, une ligne de bruit */
  for(let k = 0; k < 3; k++){
    const y = 20 + Math.floor(Math.random() * 90), h = 2 + Math.floor(Math.random() * 4), dx = 6 + Math.floor(Math.random() * 18);
    const band = g.getImageData(0, y, 256, h); g.putImageData(band, dx, y);
  }
  g.fillStyle = "rgba(255,61,127,0.55)"; g.fillRect(150, 62, 60, 3);
  g.fillStyle = "rgba(53,240,214,0.5)"; g.fillRect(30, 96, 40, 2);
}

/* le rideau de données : des colonnes de pixels cyan et magenta qui défilent, plus nettes de près */
const curtainFrag = `
uniform float uTime; uniform vec3 uPlayer; varying vec2 vUv; varying vec3 vWP;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  vec2 cell = floor(vec2(vWP.x + vWP.z, vWP.y) * vec2(4.0, 6.0));
  float col = h21(vec2(cell.x, 0.0));
  float fall = fract(cell.y * 0.031 + uTime * (0.15 + col * 0.4) + col * 7.0);
  float on = step(0.82, h21(cell + floor(uTime * 6.0 * (0.3 + col))));
  vec3 c = mix(vec3(0.21, 0.94, 0.84), vec3(1.0, 0.24, 0.5), step(0.7, col));
  float d = distance(vWP.xz, uPlayer.xz);
  float near = 1.0 - smoothstep(6.0, 34.0, d);
  float a = (on * 0.55 + smoothstep(0.85, 1.0, fall) * 0.45) * (0.16 + 0.84 * near) * smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
  gl_FragColor = vec4(c * (1.2 + near), a);
}`;
const curtainVert = `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
function buildBoundary(scene){
  const uniforms = {uTime:{value:0}, uPlayer:{value:new THREE.Vector3()}};
  const mat = new THREE.ShaderMaterial({uniforms, vertexShader:curtainVert, fragmentShader:curtainFrag, transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, fog:false});
  const group = new THREE.Group();
  /* les deux portes, au nord et au sud, à travers le chemin */
  for(const z of [BOUNDS.z0 - 3, BOUNDS.z1 + 3]){
    const px = pathX(z), w = 26;
    const g = new THREE.PlaneGeometry(w, 9, 26, 1);
    const p = g.attributes.position;
    for(let i = 0; i < p.count; i++){ const x = p.getX(i) + px; p.setXYZ(i, x, p.getY(i) + 4.5 + heightAt(x, z) - 0.5, z); }
    group.add(new THREE.Mesh(g, mat));
  }
  scene.add(group);
  return {uniforms, group};
}
