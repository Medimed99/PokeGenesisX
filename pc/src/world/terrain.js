/* Le sol : une grille (en carrés de 64 m, dessinés seulement quand on les voit), couleurs
   posées par sommet (herbe, terre du chemin, sable du lac, roche des pentes ; et chaque biome
   a la sienne : mousse de la Sylve, travertin des Nappes, roche violette des Cavités, dalles
   des Ruines, basalte et lave du Foyer), et un grain de détail calculé dans le shader. */
import * as THREE from "three";
import { GRID, W, D, HGT, DPATH, GRASS, LAKEM, WATER_Y, PATH_W, lakeShore, BIDX, BWT, TRAIL, LAVA, BIOMES, terrace } from "./layout.js";
import { noiseFn, smooth, clamp, lerp } from "../util.js";
import { CZ, ZONE_GLSL, ZONE_N, LAMP_GLSL } from "./corruption.js";
import { BL, BL_GLSL } from "./biomes/kit.js";
import { MK, MARKS_GLSL } from "./marks.js";

const nC = noiseFn(91), nD = noiseFn(103), nF = noiseFn(117);
const CH = 64;
const C = s => new THREE.Color(s);
/* le sol de chaque biome : [sol, sol 2, sentier, roche] */
const PAL = {
  foret: [C("#22361f"), C("#38502a"), C("#3a2e22"), C("#3c4436"), C("#4a3a22")],
  eaux:  [C("#a3aea6"), C("#c8cdc1"), C("#8a8d83"), C("#55615f"), C("#6f9a90")],
  grotte:[C("#3e3648"), C("#544a62"), C("#5e5468"), C("#342e3c"), C("#6a5888")],
  ruines:[C("#76703f"), C("#8e8350"), C("#8c8676"), C("#6e6a62"), C("#5d5a3a")],
  foyer: [C("#1a1819"), C("#363130"), C("#2a2523"), C("#141213"), C("#5a2c1c")]
};

/* la couleur d'un sommet : celle de la zone (ou des crêtes), puis celle de son biome par-dessus */
function vertexColor(x, z, k, h, slope, c){
  const cg1 = vertexColor.cg1, v = 0.5 + 0.5 * nC(x / 23, z / 23), v2 = 0.5 + 0.5 * nD(x / 7, z / 7);
  c.copy(cg1).lerp(vertexColor.cg2, v * 0.75).lerp(vertexColor.cg3, v2 * 0.35);
  c.lerp(vertexColor.cDry, smooth(0.62, 0.9, 0.5 + 0.5 * nC(x / 41 + 7, z / 41 - 3)) * 0.55);
  c.lerp(vertexColor.cTall, GRASS[k] * 0.85);
  const dp = DPATH[k] + 0.6 * nD(x / 3, z / 3);
  const pw = smooth(PATH_W + 0.9, PATH_W - 0.3, dp);
  c.lerp(vertexColor.cDirt2.clone().lerp(vertexColor.cDirt, v2), pw);
  c.lerp(vertexColor.cRock, smooth(0.55, 1.1, slope) * 0.85);
  const shore = LAKEM[k] > 0 || Math.abs(x) < 60 ? lakeShore(x, z) : 0;
  if(shore > 0){
    c.lerp(vertexColor.cSand, smooth(WATER_Y + 0.7, WATER_Y + 0.15, h) * smooth(0.0, 0.3, shore));
    c.lerp(vertexColor.cMud, smooth(WATER_Y - 0.1, WATER_Y - 1.0, h) * smooth(0.0, 0.3, shore));
  }
  /* les crêtes, loin de tout : la roche, et un peu de neige grise tout en haut */
  if(Math.abs(x) > 56 || z < -156 || z > 152) c.lerp(vertexColor.cRock2, smooth(16, 30, h) * 0.7).lerp(vertexColor.cSnow, smooth(34, 46, h) * 0.55);
  let tr = 0;
  const bi = BIDX[k], bw = BWT[k];
  if(bi){
    const B = BIOMES[bi - 1], P = PAL[B.k], q = vertexColor.q;
    q.copy(P[0]).lerp(P[1], v * 0.8);
    tr = smooth(0.4, -0.6, TRAIL[k] + 0.5 * nD(x / 2.5, z / 2.5));
    if(B.k === "foret"){ q.lerp(P[4], smooth(0.55, 0.9, 0.5 + 0.5 * nF(x / 9, z / 9)) * 0.6); q.lerp(C("#1a2c1c"), GRASS[k] * 0.7); }
    if(B.k === "eaux"){
      const T = terrace(x, z);
      q.lerp(P[4], smooth(0.75, 0.1, T.f) * 0.55);                 /* le fond des vasques, vert d'eau */
      q.lerp(C("#f1f0e6"), smooth(0.8, 0.9, T.f) * (1 - smooth(0.97, 1, T.f)));   /* les rebords, presque blancs */
    }
    if(B.k === "ruines") q.lerp(C("#4e5a36"), GRASS[k] * 0.6);
    if(B.k === "foyer"){ q.lerp(P[4], smooth(0.0, 0.6, LAVA[k] + smooth(4, 0, TRAIL[k] + 4) * 0) * 0.9); q.lerp(C("#2b2522"), smooth(0.4, 0.8, 0.5 + 0.5 * nF(x / 14, z / 14)) * 0.5); }
    q.lerp(P[2], tr);
    q.lerp(P[3], smooth(0.6, 1.2, slope) * (B.k === "eaux" ? 0.6 : 0.9));
    c.lerp(q, smooth(0.0, 0.55, bw));
  }
  return {pw:Math.max(pw, tr), tr};
}
Object.assign(vertexColor, {cg1:C("#58704a"), cg2:C("#7a8658"), cg3:C("#405842"), cTall:C("#30442c"), cDirt:C("#7e6c56"), cDirt2:C("#5e5244"),
  cSand:C("#a49e90"), cMud:C("#3a463c"), cRock:C("#76797a"), cDry:C("#8c845e"), cRock2:C("#5a5b5c"), cSnow:C("#a8adb2"), q:new THREE.Color()});

export function buildTerrain(){
  const group = new THREE.Group(); group.name = "terrain";
  const mat = terrainMaterial();
  const c = new THREE.Color();
  const H = (i, j) => HGT[clamp(j, 0, D - 1) * W + clamp(i, 0, W - 1)];
  for(let j0 = 0; j0 < D - 1; j0 += CH) for(let i0 = 0; i0 < W - 1; i0 += CH){
    const nx = Math.min(CH, W - 1 - i0) + 1, nz = Math.min(CH, D - 1 - j0) + 1, N = nx * nz;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), nor = new Float32Array(N * 3), am = new Float32Array(N * 2), ab = new Float32Array(N * 3);
    for(let b = 0; b < nz; b++) for(let a = 0; a < nx; a++){
      const i = i0 + a, j = j0 + b, k = j * W + i, v = b * nx + a;
      const x = GRID.x0 + i * GRID.step, z = GRID.z0 + j * GRID.step, h = HGT[k];
      pos[v * 3] = x; pos[v * 3 + 1] = h; pos[v * 3 + 2] = z;
      const hx = H(i + 1, j) - H(i - 1, j), hz = H(i, j + 1) - H(i, j - 1);
      const L = Math.hypot(hx, 2 * GRID.step, hz);
      nor[v * 3] = -hx / L; nor[v * 3 + 1] = 2 * GRID.step / L; nor[v * 3 + 2] = -hz / L;
      const r = vertexColor(x, z, k, h, clamp(Math.hypot(hx, hz) / 2, 0, 2), c);
      col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
      am[v * 2] = r.pw; am[v * 2 + 1] = GRASS[k];
      ab[v * 3] = BIDX[k]; ab[v * 3 + 1] = BWT[k]; ab[v * 3 + 2] = LAVA[k] + r.tr * 0;
    }
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
    let n = 0;
    for(let b = 0; b < nz - 1; b++) for(let a = 0; a < nx - 1; a++){
      const p = b * nx + a, q = p + 1, r2 = p + nx, s2 = r2 + 1;
      if(Math.abs(pos[p * 3 + 1] - pos[s2 * 3 + 1]) < Math.abs(pos[q * 3 + 1] - pos[r2 * 3 + 1])){ idx[n++] = p; idx[n++] = r2; idx[n++] = s2; idx[n++] = p; idx[n++] = s2; idx[n++] = q; }
      else { idx[n++] = p; idx[n++] = r2; idx[n++] = q; idx[n++] = q; idx[n++] = r2; idx[n++] = s2; }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aMat", new THREE.BufferAttribute(am, 2));
    geo.setAttribute("aBio", new THREE.BufferAttribute(ab, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
function terrainMaterial(){
  const m = new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.96, metalness:0});
  m.userData.time = CZ.uCTime;
  m.customProgramCacheKey = () => "terrain-cz";
  m.onBeforeCompile = sh => {
    sh.uniforms.uZones = CZ.uZones; sh.uniforms.uCTime = CZ.uCTime; sh.uniforms.uLamp = CZ.uLamp; sh.uniforms.uBL = BL.uBL; sh.uniforms.uBLC = BL.uBLC;
    sh.uniforms.uMk = MK.uMk; sh.uniforms.uMkT = MK.uMkT; sh.uniforms.uMkClock = MK.uMkClock;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aMat; attribute vec3 aBio; varying vec2 vMat; varying vec3 vWP; varying float vZone; varying vec3 vBio;\n" + ZONE_GLSL)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
  /* désindexé : le sol se pose en marches de 20 cm */
  vZone = zoneCore((modelMatrix * vec4(transformed, 1.0)).xz);
  transformed.y = mix(transformed.y, floor(transformed.y * 5.0) / 5.0, vZone);`)
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvMat = aMat; vBio = aBio; vWP = (modelMatrix * vec4(transformed,1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec2 vMat; varying vec3 vWP; varying float vZone; varying vec3 vBio;
uniform vec4 uZones[${ZONE_N}]; uniform float uCTime;
${LAMP_GLSL}
${BL_GLSL}
${MARKS_GLSL}
vec3 mkEmi; float mkWet;
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
  diffuseColor.rgb = mix(diffuseColor.rgb, tile, zc);
  /* les biomes : les dalles des Ruines, le grain du basalte, les fougères de la Sylve */
  float bk = vBio.y;
  float isR = (1.0 - step(0.5, abs(vBio.x - 4.0))) * bk, isF = (1.0 - step(0.5, abs(vBio.x - 5.0))) * bk;
  float isC = (1.0 - step(0.5, abs(vBio.x - 3.0))) * bk, isE = (1.0 - step(0.5, abs(vBio.x - 2.0))) * bk;
  vec2 tq = abs(fract(vWP.xz * vec2(0.5, 0.36) + vec2(step(0.5, fract(vWP.z * 0.18)) * 0.5, 0.0)) - 0.5);
  float joint = 1.0 - smoothstep(0.0, 0.035, min(tq.x, tq.y));
  diffuseColor.rgb *= 1.0 - joint * 0.45 * isR * vMat.x;
  diffuseColor.rgb *= mix(1.0, 0.82 + 0.3 * h21(floor(vWP.xz * 0.5)), isR * vMat.x);
  diffuseColor.rgb *= mix(1.0, 0.75 + 0.4 * vnoise(vWP.xz * 3.1), isF + isC);
  /* le travertin : de fines strates claires */
  diffuseColor.rgb *= mix(1.0, 0.92 + 0.12 * sin(vWP.y * 26.0 + vnoise(vWP.xz * 0.8) * 3.0), isE);
  /* les traces laissées par les capacités des sauvages (marks.js) */
  mkEmi = vec3(0.0); mkWet = 0.0;
  applyMarks(vWP, diffuseColor.rgb, mkEmi, mkWet);`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.14, mkWet);")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
  totalEmissiveRadiance += lampLight(vWP, diffuseColor.rgb) + bioLights(vWP, diffuseColor.rgb) + mkEmi;
  /* la lave du Foyer : une croûte noire fendue d'orange, qui coule */
  if(vBio.z > 0.01){
    vec2 fp = vWP.xz * 0.35 + vec2(uCTime * 0.06, uCTime * 0.04);
    float crust = vnoise(fp * 2.0) * 0.6 + vnoise(fp * 5.3 - uCTime * 0.05) * 0.4;
    float glow = smoothstep(0.62, 0.3, crust) * vBio.z;
    vec3 lava = mix(vec3(1.0, 0.18, 0.02), vec3(1.0, 0.72, 0.18), smoothstep(0.42, 0.2, crust));
    totalEmissiveRadiance += lava * glow * (2.6 + 0.6 * sin(uCTime * 1.7 + vWP.x * 0.3));
    totalEmissiveRadiance += vec3(0.9, 0.2, 0.03) * smoothstep(0.2, 0.0, vBio.z - 0.05) * 0.0;
  }
  {
    /* le Foyer : des braises dans le basalte, près de la lave */
    float isFo = (1.0 - step(0.5, abs(vBio.x - 5.0))) * vBio.y;
    vec2 ec = floor(vWP.xz * 2.0);
    float ember = step(0.982, h21(ec)) * smoothstep(0.2, 0.06, length(fract(vWP.xz * 2.0) - 0.5)) * (0.5 + 0.5 * sin(uCTime * 3.0 + h21(ec) * 30.0));
    totalEmissiveRadiance += vec3(1.0, 0.3, 0.05) * ember * isFo * 0.5;
    /* les Cavités : des éclats de cristal dans la roche */
    float isCv = (1.0 - step(0.5, abs(vBio.x - 3.0))) * vBio.y;
    vec2 cc = floor(vWP.xz * 3.0);
    float shard = step(0.985, h21(cc)) * smoothstep(0.22, 0.05, length(fract(vWP.xz * 3.0) - 0.5)) * (0.6 + 0.4 * sin(uCTime * 1.3 + h21(cc + 2.0) * 20.0));
    totalEmissiveRadiance += mix(vec3(0.55, 0.3, 1.0), vec3(0.2, 0.9, 1.0), h21(cc + 7.0)) * shard * isCv * 0.7;
  }
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
  return m;
}
