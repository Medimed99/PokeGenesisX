/* L'herbe : des centaines de milliers de brins, dessinés par paquets de 12 m autour du joueur.
   Le vent les couche en vagues, le joueur les écarte en marchant, les hautes herbes frémissent
   là où un Pokémon se cache. Au loin, les brins rapetissent jusqu'à se fondre dans le sol. */
import * as THREE from "three";
import { heightAt, pathDist, tallGrassAt, lakeAt, normalAt, PATH_W, BOUNDS, onBeach } from "./layout.js";
import { mulberry32 } from "../util.js";
import { CZ, ZONE_GLSL } from "./corruption.js";

const CHUNK = 12;
export const RUSTLE_N = 6;

function bladeGeometry(){
  /* une touffe : trois brins effilés (3 segments chacun), tournés et inclinés différemment */
  const g = new THREE.InstancedBufferGeometry();
  const ys = [0, 0.3, 0.62, 1], ws = [1, 0.82, 0.52, 0];
  const pos = [], uv = [], idx = [];
  const tufts = [[0, 0, 0, 1], [1.05, 0.09, 0.06, 0.82], [-1.2, -0.08, 0.05, 0.7]];
  for(const [rot, ox, oz, hs] of tufts){
    const base = pos.length / 3, c = Math.cos(rot), s = Math.sin(rot);
    for(let i = 0; i < 4; i++){
      const y = ys[i] * hs, lean = ys[i] * ys[i] * 0.18;
      const pts = i < 3 ? [-0.5 * ws[i], 0.5 * ws[i]] : [0];
      for(const px of pts){ pos.push(px * c + ox + lean * s, y, px * s + oz - lean * c); uv.push(px + 0.5, ys[i]); }
    }
    idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3, base + 2, base + 3, base + 4, base + 4, base + 3, base + 5, base + 4, base + 5, base + 6);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i)=>i % 3 === 1 ? 1 : 0), 3));
  g.setIndex(idx);
  return g;
}

export class Grass {
  constructor(scene, quality){
    this.scene = scene; this.chunks = new Map(); this.base = bladeGeometry();
    this.uniforms = {uTime:{value:0}, uPlayer:{value:new THREE.Vector3()}, uRustle:{value:Array.from({length:RUSTLE_N}, ()=>new THREE.Vector4(0, -999, 0, 0))},
      uWind:{value:1}};
    this.fadeLawn = {value:new THREE.Vector2(20, 30)}; this.fadeTall = {value:new THREE.Vector2(50, 64)};
    this.matLawn = this.makeMaterial(this.fadeLawn, "lawn");
    this.matTall = this.makeMaterial(this.fadeTall, "tall");
    this.setQuality(quality);
  }
  setQuality(q){
    this.q = q;
    this.density = q.grass;               /* brins par m² de pelouse, près du joueur */
    this.rLawn = q.grassRadius; this.rTall = q.tallRadius;
    this.radius = Math.max(this.rLawn, this.rTall);
    this.fadeLawn.value.set(this.rLawn * 0.62, this.rLawn);
    this.fadeTall.value.set(this.rTall - 16, this.rTall);
    for(const c of this.chunks.values()) for(const m of [c.lawn, c.tall]) if(m){ this.scene.remove(m); m.geometry.dispose(); }
    this.chunks.clear();
  }
  makeMaterial(fade, key){
    const m = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.uniforms.uZones = CZ.uZones; sh.uniforms.uCTime = CZ.uCTime;
      sh.uniforms.uFade = fade;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", `#include <common>
attribute vec4 iPos;      // x, y, z, angle
attribute vec4 iShape;    // hauteur, largeur, teinte, haute herbe
uniform float uTime, uWind; uniform vec3 uPlayer; uniform vec4 uRustle[${RUSTLE_N}]; uniform vec2 uFade;
varying float vY; varying float vTint; varying float vTall; varying float vAO; varying float vDead;
float h1(float n){ return fract(sin(n) * 43758.5453); }
${ZONE_GLSL}`)
      .replace("#include <beginnormal_vertex>", `
  vec3 objectNormal = vec3(0.0, 1.0, 0.0);
  #ifdef USE_TANGENT
  vec3 objectTangent = vec3(1.0, 0.0, 0.0);
  #endif`)
      .replace("#include <begin_vertex>", `
  float ang = iPos.w;
  float dist = distance(iPos.xz, cameraPosition.xz);
  /* au loin, le brin rapetisse jusqu'à disparaître dans le sol */
  float grow = 1.0 - smoothstep(uFade.x, uFade.y, dist);
  /* la corruption : rien ne pousse au cœur d'une zone, l'herbe meurt autour */
  float zc = zoneCore(iPos.xz), zh = zoneHalo(iPos.xz);
  vDead = max(zh, zc);
  grow *= (1.0 - zc) * (1.0 - zh * 0.45);
  float H = iShape.x * grow, Wd = iShape.y * (1.0 + smoothstep(10.0, uFade.y, dist) * 1.4);
  vec3 p = vec3(position.x * Wd, position.y * H, position.z * Wd);
  float c = cos(ang), s = sin(ang);
  p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  float t2 = uv.y * uv.y;
  /* le vent : de grandes vagues qui traversent le pré, et un frisson propre à chaque brin */
  float gust = sin(uTime * 1.3 - iPos.x * 0.11 - iPos.z * 0.07) * 0.5 + 0.5;
  gust = gust * gust;
  float wob = sin(uTime * (2.2 + h1(iPos.x * 13.1 + iPos.z) * 1.4) + iPos.x * 1.7 + iPos.z * 1.3);
  vec2 bend = vec2(0.55, 0.32) * (0.25 + gust * 0.9) * uWind + vec2(wob * 0.12, wob * 0.07);
  /* les pas du joueur : les brins s'écartent */
  vec2 dp = iPos.xz - uPlayer.xz;
  float pd = length(dp);
  bend += normalize(dp + 0.0001) * smoothstep(1.1, 0.0, pd) * 1.3 * step(abs(iPos.y - uPlayer.y), 2.5);
  /* là où un Pokémon se cache : l'herbe frémit */
  for(int i = 0; i < ${RUSTLE_N}; i++){
    vec4 r = uRustle[i];
    vec2 rd = iPos.xz - r.xz;
    float rk = smoothstep(r.w, 0.0, length(rd)) * step(0.001, r.w);
    bend += vec2(sin(uTime * 23.0 + iPos.x * 3.0), cos(uTime * 19.0 + iPos.z * 3.0)) * rk * 0.5;
  }
  p.xz += bend * t2 * H;
  p.y -= length(bend) * t2 * H * 0.28;
  vec3 transformed = p + iPos.xyz;
  vY = uv.y; vTint = iShape.z; vTall = iShape.w;
  vAO = mix(mix(0.72, 0.45, iShape.w), 1.0, smoothstep(0.0, 0.85, uv.y));`)
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying float vY; varying float vTint; varying float vTall; varying float vAO; varying float vDead;`)
      .replace("#include <normal_fragment_begin>", `float faceDirection = 1.0;
vec3 normal = normalize( vNormal );
vec3 nonPerturbedNormal = normal;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
  /* couleurs linéaires : la pelouse prolonge le sol, les hautes herbes sont plus sombres et plus franches */
  /* des verts éteints, tirés vers l'olive et le gris ; quelques pointes sèches */
  vec3 baseC = mix(vec3(0.05, 0.1, 0.045), vec3(0.022, 0.05, 0.028), vTall);
  vec3 tipC = mix(vec3(0.17, 0.26, 0.1), vec3(0.12, 0.22, 0.09), vTall);
  tipC = mix(tipC, vec3(0.3, 0.27, 0.14), smoothstep(0.72, 1.0, vTint) * (1.0 - vTall * 0.5));
  tipC *= 0.8 + 0.4 * vTint;
  /* près d'une zone : des brins morts, couleur de cendre */
  baseC = mix(baseC, vec3(0.02, 0.019, 0.018), vDead);
  tipC = mix(tipC, vec3(0.16, 0.15, 0.13), vDead);
  diffuseColor.rgb = mix(baseC, tipC, smoothstep(0.0, 1.0, vY)) * vAO;`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  /* la lumière qui traverse le brin, à contre-jour */
  totalEmissiveRadiance += diffuseColor.rgb * 0.08 * smoothstep(0.4, 1.0, vY);`);
    };
    m.customProgramCacheKey = () => "grass-" + key;
    return m;
  }
  makeMesh(list, mat, x0, z0){
    if(!list.length) return null;
    const count = list.length / 8;
    const g = this.base.clone();
    const a = new Float32Array(count * 4), b = new Float32Array(count * 4);
    for(let i = 0; i < count; i++){ for(let k = 0; k < 4; k++){ a[i * 4 + k] = list[i * 8 + k]; b[i * 4 + k] = list[i * 8 + 4 + k]; } }
    g.setAttribute("iPos", new THREE.InstancedBufferAttribute(a, 4));
    g.setAttribute("iShape", new THREE.InstancedBufferAttribute(b, 4));
    g.instanceCount = count;
    const cy = heightAt(x0 + CHUNK / 2, z0 + CHUNK / 2);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(x0 + CHUNK / 2, cy, z0 + CHUNK / 2), CHUNK * 0.9 + 2);
    const mesh = new THREE.Mesh(g, mat);
    mesh.receiveShadow = true; mesh.castShadow = false;
    return mesh;
  }
  buildChunk(cx, cz){
    const rnd = mulberry32((cx * 73856093) ^ (cz * 19349663));
    const x0 = cx * CHUNK, z0 = cz * CHUNK, lawn = [], tall = [];
    const area = CHUNK * CHUNK;
    const push = (out, x, z, h, w, t) => { out.push(x, heightAt(x, z) - 0.02, z, rnd() * Math.PI * 2, h, w, rnd(), t); };
    const ok = (x, z) => x > BOUNDS.x0 - 8 && x < BOUNDS.x1 + 8 && z > BOUNDS.z0 - 20 && z < BOUNDS.z1 + 20;
    const n = Math.round(area * this.density);
    for(let i = 0; i < n; i++){
      const x = x0 + rnd() * CHUNK, z = z0 + rnd() * CHUNK;
      if(!ok(x, z)) continue;
      const dp = pathDist(x, z);
      if(dp < PATH_W - 0.2) continue;
      if(dp < PATH_W + 0.8 && rnd() < 0.6) continue;           /* le bord du chemin, clairsemé */
      if(lakeAt(x, z) > 0.3 || onBeach(x, z)) continue;
      if(normalAt(x, z)[1] < 0.8) continue;                    /* la roche des pentes */
      if(tallGrassAt(x, z) > 0.5) continue;                     /* les hautes herbes ont leur propre semis */
      const v = rnd();
      push(lawn, x, z, 0.12 + v * v * 0.22, 0.05 + rnd() * 0.03, 0);
    }
    /* les hautes herbes : drues, hautes, en touffes */
    const nt = Math.round(area * Math.max(10, this.density * 0.5));
    for(let i = 0; i < nt; i++){
      const x = x0 + rnd() * CHUNK, z = z0 + rnd() * CHUNK;
      const tg = tallGrassAt(x, z);
      if(tg < 0.5 || !ok(x, z)) continue;
      push(tall, x, z, 0.6 + rnd() * 0.5 * tg, 0.09 + rnd() * 0.06, 1);
    }
    return {lawn:this.makeMesh(lawn, this.matLawn, x0, z0), tall:this.makeMesh(tall, this.matTall, x0, z0)};
  }
  update(t, player){
    this.uniforms.uTime.value = t;
    this.uniforms.uPlayer.value.copy(player);
    const pcx = Math.floor(player.x / CHUNK), pcz = Math.floor(player.z / CHUNK), rc = Math.ceil(this.radius / CHUNK) + 1;
    let built = 0;
    for(let dz = -rc; dz <= rc; dz++) for(let dx = -rc; dx <= rc; dx++){
      const cx = pcx + dx, cz = pcz + dz, key = cx + ":" + cz;
      const d = Math.hypot(cx * CHUNK + CHUNK / 2 - player.x, cz * CHUNK + CHUNK / 2 - player.z);
      let c = this.chunks.get(key);
      if(!c){
        if(d > this.radius + CHUNK || built >= 2) continue;     /* jamais plus de deux paquets par image */
        c = this.buildChunk(cx, cz); this.chunks.set(key, c); built++;
      }
      this.show(c.lawn, d < this.rLawn + CHUNK);
      this.show(c.tall, d < this.rTall + CHUNK);
    }
  }
  show(m, on){ if(!m) return; if(on && !m.parent) this.scene.add(m); else if(!on && m.parent) this.scene.remove(m); }
  /* tout autour du point de départ, d'un coup (au chargement) */
  prime(player){
    const rc = Math.ceil(this.radius / CHUNK) + 1, pcx = Math.floor(player.x / CHUNK), pcz = Math.floor(player.z / CHUNK);
    for(let dz = -rc; dz <= rc; dz++) for(let dx = -rc; dx <= rc; dx++){
      const cx = pcx + dx, cz = pcz + dz, key = cx + ":" + cz;
      const d = Math.hypot(cx * CHUNK + CHUNK / 2 - player.x, cz * CHUNK + CHUNK / 2 - player.z);
      if(d > this.radius + CHUNK) continue;
      let c = this.chunks.get(key);
      if(!c){ c = this.buildChunk(cx, cz); this.chunks.set(key, c); }
      this.show(c.lawn, d < this.rLawn + CHUNK);
      this.show(c.tall, d < this.rTall + CHUNK);
    }
  }
  setRustle(i, x, y, z, r){ const v = this.uniforms.uRustle.value[i]; if(v) v.set(x, y, z, r); }
  stats(){ let n = 0, m = 0; for(const c of this.chunks.values()) for(const x of [c.lawn, c.tall]) if(x && x.parent){ n += x.geometry.instanceCount; m++; } return {blades:n, meshes:m}; }
}
