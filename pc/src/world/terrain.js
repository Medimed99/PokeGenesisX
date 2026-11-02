/* Le sol : une seule grille, couleurs posées par sommet (herbe, terre du chemin, sable du
   lac, roche des pentes), et un grain de détail calculé dans le shader. */
import * as THREE from "three";
import { GRID, W, D, HGT, DPATH, GRASS, LAKEM, WATER_Y, PATH_W, lakeShore } from "./layout.js";
import { noiseFn, smooth, clamp, lerp } from "../util.js";
import { CZ, ZONE_GLSL, ZONE_N } from "./corruption.js";

const nC = noiseFn(91), nD = noiseFn(103);

export function buildTerrain(){
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(W * D * 3), col = new Float32Array(W * D * 3), mat = new Float32Array(W * D * 2);
  /* une archive fatiguée : des verts éteints, une terre sombre et humide, un sable gris */
  const c = new THREE.Color(), cg1 = new THREE.Color("#58704a"), cg2 = new THREE.Color("#7a8658"), cg3 = new THREE.Color("#405842");
  const cTall = new THREE.Color("#30442c"), cDirt = new THREE.Color("#7e6c56"), cDirt2 = new THREE.Color("#5e5244");
  const cSand = new THREE.Color("#a49e90"), cMud = new THREE.Color("#3a463c"), cRock = new THREE.Color("#76797a");
  const cDry = new THREE.Color("#8c845e");
  for(let j = 0; j < D; j++){
    const z = GRID.z0 + j * GRID.step;
    for(let i = 0; i < W; i++){
      const x = GRID.x0 + i * GRID.step, k = j * W + i, h = HGT[k];
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      /* l'herbe : deux verts mêlés par un bruit large, plus sombre sous les hautes herbes */
      const v = 0.5 + 0.5 * nC(x / 23, z / 23), v2 = 0.5 + 0.5 * nD(x / 7, z / 7);
      c.copy(cg1).lerp(cg2, v * 0.75).lerp(cg3, v2 * 0.35);
      /* des plaques d'herbe sèche, couleur de paille grise */
      c.lerp(cDry, smooth(0.62, 0.9, 0.5 + 0.5 * nC(x / 41 + 7, z / 41 - 3)) * 0.55);
      c.lerp(cTall, GRASS[k] * 0.85);
      /* la terre du chemin, bord irrégulier */
      const dp = DPATH[k] + 0.6 * nD(x / 3, z / 3);
      const pw = smooth(PATH_W + 0.9, PATH_W - 0.3, dp);
      c.lerp(cDirt2.clone().lerp(cDirt, v2), pw);
      /* la pente : la roche affleure */
      const hx = (HGT[k + (i < W - 1 ? 1 : 0)] - HGT[k - (i > 0 ? 1 : 0)]), hz = (HGT[k + (j < D - 1 ? W : 0)] - HGT[k - (j > 0 ? W : 0)]);
      const slope = clamp(Math.hypot(hx, hz) / 2, 0, 2);
      c.lerp(cRock, smooth(0.55, 1.1, slope) * 0.85);
      /* le lac : sable sur la rive, vase au fond */
      const shore = lakeShore(x, z);
      if(shore > 0){
        const sand = smooth(WATER_Y + 0.7, WATER_Y + 0.15, h) * smooth(0.0, 0.3, shore);
        c.lerp(cSand, sand);
        c.lerp(cMud, smooth(WATER_Y - 0.1, WATER_Y - 1.0, h) * smooth(0.0, 0.3, shore));
      }
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
      mat[k * 2] = pw; mat[k * 2 + 1] = GRASS[k];
    }
  }
  const idx = new Uint32Array((W - 1) * (D - 1) * 6);
  let n = 0;
  for(let j = 0; j < D - 1; j++) for(let i = 0; i < W - 1; i++){
    const a = j * W + i, b = a + 1, c2 = a + W, d = c2 + 1;
    /* la diagonale suit la pente : moins d'arêtes en dents de scie */
    if(Math.abs(HGT[a] - HGT[d]) < Math.abs(HGT[b] - HGT[c2])){ idx[n++] = a; idx[n++] = c2; idx[n++] = d; idx[n++] = a; idx[n++] = d; idx[n++] = b; }
    else { idx[n++] = a; idx[n++] = c2; idx[n++] = b; idx[n++] = b; idx[n++] = c2; idx[n++] = d; }
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aMat", new THREE.BufferAttribute(mat, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const m = new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.96, metalness:0});
  m.customProgramCacheKey = () => "terrain-cz";
  m.onBeforeCompile = sh => {
    sh.uniforms.uZones = CZ.uZones; sh.uniforms.uCTime = CZ.uCTime;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aMat; varying vec2 vMat; varying vec3 vWP; varying float vZone;\n" + ZONE_GLSL)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
  /* désindexé : le sol se pose en marches de 20 cm */
  vZone = zoneCore((modelMatrix * vec4(transformed, 1.0)).xz);
  transformed.y = mix(transformed.y, floor(transformed.y * 5.0) / 5.0, vZone);`)
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvMat = aMat; vWP = (modelMatrix * vec4(transformed,1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec2 vMat; varying vec3 vWP; varying float vZone;
uniform vec4 uZones[${ZONE_N}]; uniform float uCTime;
float czH2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float zoneHaloF(vec2 p){
  float m = 0.0;
  for(int i = 0; i < ${ZONE_N}; i++){ vec4 z = uZones[i]; if(z.w <= 0.001) continue;
    float d = length(p - z.xy) / (z.z * z.w); m = max(m, 1.0 - smoothstep(0.8, 1.6, d)); }
  return m;
}
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
  /* le grain : touffes dans l'herbe, cailloux sur le chemin */
  float g1 = vnoise(vWP.xz * 1.7), g2 = vnoise(vWP.xz * 6.3), g3 = vnoise(vWP.xz * 0.35);
  float grassy = 1.0 - vMat.x;
  /* au loin, l'herbe se lit encore : des stries fines et des touffes plus sombres */
  float streak = vnoise(vec2(vWP.x * 14.0, vWP.z * 3.5)) * vnoise(vec2(vWP.x * 3.2, vWP.z * 15.0));
  diffuseColor.rgb *= mix(1.0, 0.8 + 0.24 * g1 + 0.1 * g2 - 0.16 * streak, grassy);
  diffuseColor.rgb *= mix(1.0, 0.93 + 0.12 * g3, grassy);
  float pebble = step(0.86, vnoise(vWP.xz * 9.0)) * vMat.x;
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.18, pebble);
  diffuseColor.rgb *= mix(1.0, 0.9 + 0.14 * g2, vMat.x);
  /* autour d'une zone, la terre brûlée ; au cœur, la grille de données */
  float halo = zoneHaloF(vWP.xz);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.42, 0.4, 0.44), halo * 0.8);
  vec2 cell = floor(vWP.xz * 2.0);
  float ch = czH2(cell);
  float zc = step(0.5, vZone);
  vec3 tile = mix(vec3(0.012, 0.013, 0.02), vec3(0.045, 0.012, 0.04), step(0.55, ch) * mod(cell.x + cell.y, 2.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, tile, zc);`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  if(vZone > 0.5){
    vec2 gq = abs(fract(vWP.xz * 0.5) - 0.5);
    float line = 1.0 - smoothstep(0.0, 0.025, min(gq.x, gq.y));
    float wave = 0.35 + 0.65 * smoothstep(0.6, 1.0, sin(length(vWP.xz) * 0.9 - uCTime * 2.2));
    vec3 cy = vec3(0.21, 0.94, 0.84), mg = vec3(1.0, 0.24, 0.5);
    totalEmissiveRadiance += mix(cy, mg, step(0.82, czH2(floor(vWP.xz * 0.5)))) * line * wave * 0.9;
    /* des cases qui s'allument, une fraction de seconde */
    vec2 cl = floor(vWP.xz * 2.0);
    totalEmissiveRadiance += mix(cy, mg, czH2(cl + 3.0)) * step(0.985, czH2(cl + floor(uCTime * 7.0))) * 0.8;
  }`);
  };
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  return mesh;
}
