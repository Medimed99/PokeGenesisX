/* ============================================================
   LES CINQ BIOMES AUTOUR DE LA ZONE DE CAPTURE
   Chacun a son monument, sa végétation, sa lumière et son air :
     · Sylve d'index : des arbres colossaux, et l'Arbre-Index, haut
       de soixante mètres, dont la sève de données monte dans l'écorce ;
       des puits de lumière à travers la canopée, des lucioles, des
       fougères et des champignons qui luisent ;
     · Nappes : des vasques en terrasses (le travertin blanc, l'eau
       turquoise qui déborde d'un cran à l'autre), une chaussée de
       pierre, des nénuphars, des stèles englouties, la brume ;
     · Cavités : une caverne sous un plafond de roche percé de puits de
       jour, des stalactites, des cristaux géants (les blocs mémoire
       jamais désalloués) qui éclairent tout ;
     · Ruines d'archive : des étagères-monolithes couvertes de lignes
       qui s'allument, des arches, et l'Anneau d'index qui tourne
       au-dessus de la place, dans un crépuscule violet ;
     · Foyer thermique : une caldeira, des rivières de lave, des orgues
       de basalte, des fumerolles, et le Dissipateur au centre.
   En entrant dans un biome, le ciel, le brouillard et la lumière
   prennent les siens (update) ; fermé, son col est barré d'un rideau
   de données qui dit ce qu'il demande.
   ============================================================ */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BIOMES, BIOME_BY, heightAt, trailDist, terrace, lavaAt, biomeWeight, LOCKS, tallGrassAt } from "../layout.js";
import { mulberry32, noiseFn, smooth, lerp, clamp } from "../../util.js";
import { BT, BL, BL_N, rockGeo, prismGeo, trunkGeo, crownGeo, rootGeo, fernGeo, glowMat, inst, swarm, shafts, labelSprite } from "./kit.js";

const C = s => new THREE.Color(s);
const nQ = noiseFn(701);
export const HAB_NAMES = {route:"Routes ouvertes", foret:"Sylve d'index", eaux:"Nappes", grotte:"Cavités", ruines:"Ruines d'archive", foyer:"Foyer thermique"};
/* la lumière de chaque biome (de jour ; la nuit l'assombrit) */
const ATM = {
  foret:  {fog:C("#30503a"), fogD:0.0125, hemi:C("#9cbc84"), gnd:C("#2c3c22"), hi:1.05, sun:C("#f2f8cc"), si:1.25, zen:C("#2c4c38"), hor:C("#86a874"), exp:1.28, lamp:0.15},
  eaux:   {fog:C("#6f97a3"), fogD:0.0062, hemi:C("#b8dbe6"), gnd:C("#4f7278"), hi:1.0, sun:C("#fff3dc"), si:1.35, zen:C("#356a88"), hor:C("#9cc0ca"), exp:1.0, lamp:0},
  grotte: {fog:C("#1d1830"), fogD:0.0135, hemi:C("#7c68c0"), gnd:C("#241a32"), hi:1.15, sun:C("#d8e0ff"), si:1.8, zen:C("#0b0812"), hor:C("#1d1830"), exp:1.6, lamp:1.4},
  ruines: {fog:C("#3c2e4b"), fogD:0.0098, hemi:C("#a184c8"), gnd:C("#3d2c1e"), hi:0.92, sun:C("#f4b46a"), si:1.35, zen:C("#271d44"), hor:C("#c07688"), exp:1.22, lamp:0},
  foyer:  {fog:C("#30150c"), fogD:0.012, hemi:C("#ffa266"), gnd:C("#ff5014"), hi:0.75, sun:C("#ff7d3c"), si:0.95, zen:C("#180705"), hor:C("#86280f"), exp:1.25, lamp:0}
};

export class Biomes {
  constructor(scene, colliders){
    this.scene = scene; this.colliders = colliders;
    this.G = {}; this.U = {}; this.anim = []; this.lights = [];
    this.where = {k:"route", w:0, b:null}; this.mix = {w:0, k:null};
    this.root = new THREE.Group(); this.root.name = "biomes"; scene.add(this.root);
    this.foret(); this.eaux(); this.grotte(); this.ruines(); this.foyer(); this.passes(); this.barriers();
  }
  group(b){
    const far = new THREE.Group(), near = new THREE.Group();
    this.root.add(far, near);
    return this.G[b.k] = {far, near, b};
  }
  /* des places au hasard dans un biome, avec des contraintes */
  scatter(b, n, seed, o = {}){
    const rnd = mulberry32(seed), out = [], e0 = o.e0 || 0, e1 = o.e1 || 0.9, sp = o.sp || 0, tries = n * (o.tries || 12);
    for(let k = 0; k < tries && out.length < n; k++){
      const a = rnd() * Math.PI * 2, e = Math.sqrt(e0 * e0 + rnd() * (e1 * e1 - e0 * e0));
      const x = b.c[0] + Math.cos(a) * b.r[0] * e, z = b.c[1] + Math.sin(a) * b.r[1] * e;
      if(o.trail !== undefined && trailDist(b.k, x, z) < o.trail) continue;
      if(o.avoid && o.avoid.some(p=>Math.hypot(p.x - x, p.z - z) < p.r)) continue;
      if(o.lava && lavaAt(x, z) > 0.05) continue;
      if(o.grass !== undefined && tallGrassAt(x, z) > o.grass) continue;
      if(o.test && !o.test(x, z, rnd)) continue;
      if(sp && out.some(p=>Math.hypot(p.x - x, p.z - z) < sp)) continue;
      out.push({x, z, y:heightAt(x, z), r:rnd(), r2:rnd(), r3:rnd()});
    }
    return out;
  }
  collide(x, z, r){ this.colliders.push({x, z, r}); }

  /* ================= SYLVE D'INDEX ================= */
  foret(){
    const b = BIOME_BY.foret, {far, near} = this.group(b);
    const bark = glowMat({key:"bark", color:"#4a3c30", rough:0.95,
      tint:`diffuseColor.rgb *= 0.62 + 0.55 * bn(vec2(vWP.y * 1.4, atan(vOP.z, vOP.x) * 4.0)) * (0.7 + 0.3 * bn(vWP.xz * 0.7));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.24, 0.1), smoothstep(2.6, 0.0, vOP.y) * 0.65);`});
    const leaf = glowMat({key:"canopy", color:"#36582c", rough:0.9,
      tint:`diffuseColor.rgb *= 0.55 + 0.7 * bn(vWP.xz * 0.21 + vWP.y * 0.13);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.5, 0.16), smoothstep(0.62, 0.95, bn(vWP.xz * 0.05)) * 0.35);`,
      glow:`/* les entrées de l'index : des points qui s'allument dans le feuillage */
        vec3 cl = floor(vWP * 1.1); float on = step(0.985, bh3(cl)) * smoothstep(0.22, 0.08, length(fract(vWP * 1.1) - 0.5));
        glow += vec3(0.3, 1.0, 0.78) * on * (0.4 + 0.6 * sin(uBT * 1.7 + bh3(cl + 3.0) * 50.0)) * 2.2;`});
    /* l'Arbre-Index */
    const T = {x:-193, z:101}, ty = heightAt(T.x, T.z) - 0.8;
    const indexBark = glowMat({key:"indexbark", color:"#4b3d31", rough:0.92,
      tint:`diffuseColor.rgb *= 0.6 + 0.55 * bn(vec2(vWP.y * 0.8, atan(vOP.z, vOP.x) * 6.0));`,
      glow:`/* la sève de données : des filets cyan qui montent dans les sillons de l'écorce */
        float a = atan(vOP.z, vOP.x) * 4.7746; float gr = abs(fract(a) - 0.5);
        float rib = smoothstep(0.06, 0.0, gr - 0.0);
        float flow = smoothstep(0.55, 1.0, sin(vWP.y * 0.55 - uBT * 1.6 + floor(a) * 2.1));
        glow += vec3(0.25, 1.0, 0.82) * rib * flow * 2.2 * smoothstep(1.0, 6.0, vOP.y);`});
    const trunk = new THREE.Mesh(trunkGeo(77, 7.2, 3.2, 66, 1.5), indexBark);
    trunk.position.set(T.x, ty, T.z); trunk.castShadow = true; trunk.receiveShadow = true; far.add(trunk);
    const roots = [];
    for(let i = 0; i < 8; i++) roots.push(rootGeo(i / 8 * Math.PI * 2 + 0.3, 7, 14 + (i % 3) * 5, 1.5 + (i % 2) * 0.8, 90 + i));
    const rm = new THREE.Mesh(mergeGeometries(roots), indexBark); rm.position.set(T.x, ty + 0.6, T.z); rm.castShadow = true; rm.receiveShadow = true; far.add(rm);
    const crown = new THREE.Mesh(crownGeo(78, 20, 11, 24, 60), leaf); crown.position.set(T.x, ty, T.z); crown.castShadow = true; far.add(crown);
    /* des branches qui portent la couronne */
    const br = [];
    for(let i = 0; i < 7; i++){
      const a = i / 7 * Math.PI * 2 + 0.5, h = 38 + (i % 3) * 6, L = 16 + (i % 2) * 6;
      const pts = [new THREE.Vector3(0, h, 0), new THREE.Vector3(Math.cos(a) * L * 0.5, h + 6, Math.sin(a) * L * 0.5), new THREE.Vector3(Math.cos(a) * L, h + 14, Math.sin(a) * L)];
      br.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 1.4 - (i % 2) * 0.3, 7, false));
    }
    const bm = new THREE.Mesh(mergeGeometries(br), indexBark); bm.position.set(T.x, ty, T.z); bm.castShadow = true; far.add(bm);
    this.collide(T.x, T.z, 10.5);
    /* les filaments : des fils de lumière qui pendent de la couronne et se balancent */
    {
      const rnd = mulberry32(17), parts = [];
      for(let i = 0; i < 170; i++){
        const a = rnd() * Math.PI * 2, r = 6 + rnd() * 24, L = 8 + rnd() * 22, top = 48 + rnd() * 10;
        const g = new THREE.PlaneGeometry(0.07, L, 1, 8); g.translate(0, -L / 2, 0); g.rotateY(rnd() * Math.PI);
        g.translate(Math.cos(a) * r, top, Math.sin(a) * r); parts.push(g);
      }
      const U = {uBT:BT.uTime};
      const m = new THREE.ShaderMaterial({uniforms:U, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false,
        vertexShader:`uniform float uBT; varying float vV; varying float vS;
          void main(){ vec3 p = position; float k = 1.0 - uv.y; vV = uv.y; vS = fract(sin(dot(floor(p.xz * 3.0), vec2(12.9, 78.2))) * 43758.5);
            p.x += sin(uBT * 0.7 + p.z * 0.3 + vS * 6.0) * k * k * 1.2; p.z += cos(uBT * 0.6 + p.x * 0.2) * k * k * 0.9;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
        fragmentShader:`uniform float uBT; varying float vV; varying float vS;
          void main(){ float pulse = 0.35 + 0.65 * smoothstep(0.7, 1.0, sin(vV * 12.0 + uBT * 2.2 + vS * 30.0));
            gl_FragColor = vec4(vec3(0.3, 1.0, 0.8) * smoothstep(0.0, 0.5, vV) * pulse * 0.8, 1.0); }`});
      const mesh = new THREE.Mesh(mergeGeometries(parts), m); mesh.position.set(T.x, ty, T.z); mesh.frustumCulled = false; mesh.renderOrder = 4; far.add(mesh);
    }
    /* les arbres colossaux */
    const V = [0, 1, 2].map(s=>({t:trunkGeo(301 + s, 1.7, 0.75, 30 + s * 4, 1.9), c:crownGeo(401 + s, 7.5, 6, 8, 29 + s * 4)}));
    const trees = this.scatter(b, 46, 991, {e1:0.88, sp:14, trail:6, avoid:[{x:T.x, z:T.z, r:30}]});
    V.forEach((v, vi)=>{
      const L = trees.filter((_, i)=>i % 3 === vi).map(t=>({x:t.x, y:t.y - 0.6, z:t.z, s:0.8 + t.r * 0.5, ry:t.r2 * 6}));
      inst(far, v.t, bark, L); inst(far, v.c, leaf, L);
      L.forEach(t=>this.collide(t.x, t.z, 2.4 * t.s));
    });
    /* le sous-bois : fougères, champignons qui luisent, rochers moussus, troncs couchés */
    const fernMat = glowMat({key:"fern", color:"#ffffff", rough:0.9, side:THREE.DoubleSide, tint:`diffuseColor.rgb *= vIC * (0.6 + 0.6 * smoothstep(0.0, 1.0, vOP.y));`});
    const ferns = this.scatter(b, 1700, 133, {e1:0.95, trail:1.2, avoid:[{x:T.x, z:T.z, r:11}], tries:3});
    const fg = [fernGeo(5), fernGeo(9)];
    fg.forEach((g, vi)=>inst(near, g, fernMat, ferns.filter((_, i)=>i % 2 === vi).map(f=>({x:f.x, y:f.y - 0.05, z:f.z, s:0.6 + f.r * 1.1, ry:f.r2 * 6,
      c:new THREE.Color().setHSL(0.26 + f.r3 * 0.07, 0.42, 0.18 + f.r * 0.1)})), false));
    const cap = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.45, 1); cap.translate(0, 1, 0);
    const stem = new THREE.CylinderGeometry(0.22, 0.3, 1, 6); stem.translate(0, 0.5, 0);
    const shroom = mergeGeometries([cap.toNonIndexed(), stem.toNonIndexed()]);
    const shroomMat = glowMat({key:"shroom", color:"#cfe8e0", rough:0.6,
      glow:`float capk = smoothstep(0.92, 1.05, vOP.y); glow += vIC * capk * (1.1 + 0.4 * sin(uBT * 1.3 + vWP.x * 0.7 + vWP.z));
        glow += vIC * smoothstep(1.0, 0.0, vOP.y) * 0.15;`});
    const sm = [];
    for(const t of trees.concat([{x:T.x, z:T.z, r:0.3}])) for(let k = 0; k < 7; k++){
      const a = (k / 7 + t.r) * Math.PI * 2, d = 3 + (k % 3) * 1.4 + t.r * 2, x = t.x + Math.cos(a) * d * (t === trees[0] ? 1 : 1), z = t.z + Math.sin(a) * d;
      sm.push({x, y:heightAt(x, z) - 0.05, z, s:0.18 + ((k * 37 + t.r * 100) % 10) / 10 * 0.35, ry:a, c:new THREE.Color(k % 3 ? "#38f0d0" : "#8f6bff").multiplyScalar(1)});
    }
    inst(near, shroom, shroomMat, sm, false);
    const mossMat = glowMat({key:"moss", color:"#ffffff", rough:0.95, tint:`diffuseColor.rgb *= vIC; vec3 wc = cross(dFdx(vWP), dFdy(vWP)); vec3 wn = wc / max(length(wc), 1e-6); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.24, 0.08), smoothstep(0.3, 0.8, abs(wn.y)) * 0.75);`});
    inst(near, rockGeo(51, 1), mossMat, this.scatter(b, 60, 61, {e1:0.92, trail:3}).map(r=>({x:r.x, y:r.y - 0.3, z:r.z, s:0.6 + r.r * 2, ry:r.r2 * 6, c:new THREE.Color("#5e6458")})));
    const log = new THREE.CylinderGeometry(0.9, 1.1, 14, 10); log.rotateZ(Math.PI / 2);
    const logs = this.scatter(b, 12, 71, {e1:0.8, trail:5, sp:20}).map(l=>({x:l.x, y:l.y + 0.4, z:l.z, s:0.8 + l.r * 0.5, ry:l.r2 * 6}));
    inst(near, log, bark, logs); logs.forEach(l=>this.collide(l.x, l.z, 1.6));
    /* les puits de lumière, à travers les trouées */
    const sh = this.scatter(b, 18, 81, {e1:0.75, sp:16}).map(p=>({x:p.x, y:p.y - 2, z:p.z, w:3 + p.r * 5, h:38, ry:p.r2 * 3, tilt:0.32, tiltX:-0.12}));
    sh.push({x:T.x + 18, y:ty, z:T.z - 6, w:9, h:58, tilt:0.3, tiltX:-0.1});
    this.U.foretShafts = shafts(near, sh, "#e6ffc2", 0.075);
    this.U.flies = swarm(near, this.scatter(b, 900, 91, {e1:0.95, tries:2}).map(p=>({x:p.x, y:p.y + 0.5 + p.r * 4.5, z:p.z})), {kind:0, size:0.16, c1:"#d6ff6a", c2:"#60ffcf", fade:80});
  }

  /* ================= NAPPES ================= */
  eaux(){
    const b = BIOME_BY.eaux, {far, near} = this.group(b);
    /* l'eau : une seule nappe, posée vasque par vasque à son niveau ; là où elle passe un rebord, elle déborde */
    const x0 = b.c[0] - b.r[0] * 1.05, x1 = b.c[0] + b.r[0] * 1.05, z0 = b.c[1] - b.r[1] * 1.05, z1 = b.c[1] + b.r[1] * 1.05, st = 1;
    const nx = Math.round((x1 - x0) / st) + 1, nz = Math.round((z1 - z0) / st) + 1;
    const pos = [], dep = [], ok = [];
    for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){
      const x = x0 + i * st, z = z0 + j * st, w = biomeWeight(b, x, z), T = terrace(x, z), g = heightAt(x, z);
      pos.push(x, T.level - 0.04, z); dep.push(T.level - g); ok.push(w > 0.55 && T.level - g > 0.02 ? 1 : 0);
    }
    const idx = [];
    for(let j = 0; j < nz - 1; j++) for(let i = 0; i < nx - 1; i++){
      const a = j * nx + i, c2 = a + nx;
      if(ok[a] + ok[a + 1] + ok[c2] + ok[c2 + 1] < 2) continue;
      idx.push(a, c2, a + 1, a + 1, c2, c2 + 1);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute("aDepth", new THREE.Float32BufferAttribute(dep, 1)); wg.setIndex(idx);
    const WU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uSky:{value:C("#cfe0e4")}, uSkyZ:{value:C("#5a8196")}, uSunDir:{value:new THREE.Vector3(0.3, 0.8, 0.5)}}]);
    WU.uBT = BT.uTime;
    const water = new THREE.Mesh(wg, new THREE.ShaderMaterial({uniforms:WU, transparent:true, fog:true, depthWrite:false,
      vertexShader:`attribute float aDepth; varying float vD; varying vec3 vWP;
        #include <fog_pars_vertex>
        void main(){ vD = aDepth; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`uniform float uBT; uniform vec3 uSky, uSkyZ, uSunDir; varying float vD; varying vec3 vWP;
        #include <fog_pars_fragment>
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec3 fc = cross(dFdx(vWP), dFdy(vWP)); vec3 fn = fc / max(length(fc), 1e-6); if(fn.y < 0.0) fn = -fn;
          float steep = 1.0 - smoothstep(0.55, 0.92, fn.y);
          vec2 p = vWP.xz; float t = uBT;
          float w1 = vn(p * 0.9 + vec2(t * 0.2, t * 0.13)), w2 = vn(p * 2.3 - vec2(t * 0.3, -t * 0.21));
          vec3 n = normalize(vec3((w1 - 0.5) * 0.25 + (w2 - 0.5) * 0.12, 1.0, (w2 - 0.5) * 0.25 - (w1 - 0.5) * 0.1));
          vec3 v = normalize(cameraPosition - vWP);
          float fres = 0.05 + 0.95 * pow(1.0 - max(dot(n, v), 0.0), 4.0);
          vec3 rd = reflect(-v, n); vec3 sky = mix(uSky, uSkyZ, pow(clamp(rd.y, 0.0, 1.0), 0.6));
          float d = clamp(vD, 0.0, 1.2);
          /* le turquoise des vasques sur le calcaire blanc */
          vec3 body = mix(vec3(0.3, 0.78, 0.78), vec3(0.03, 0.4, 0.52), smoothstep(0.05, 0.7, d));
          vec3 col = mix(body, sky, fres * 0.7);
          col += vec3(1.0) * pow(max(dot(rd, normalize(uSunDir)), 0.0), 120.0) * 1.5;
          /* le bord d'une vasque : un liseré d'écume */
          col = mix(col, vec3(0.92, 0.97, 0.96), smoothstep(0.12, 0.0, d) * 0.55);
          /* là où l'eau passe le rebord : elle coule en filets blancs */
          float fall = vn(vec2(p.x * 3.0 + p.y * 2.0, vWP.y * 5.0 + t * 3.5));
          col = mix(col, vec3(0.95, 0.99, 1.0), steep * (0.45 + 0.5 * smoothstep(0.35, 0.75, fall)));
          float a = mix(0.62, 0.9, smoothstep(0.0, 0.7, d)) * smoothstep(0.0, 0.03, d + steep) ;
          gl_FragColor = vec4(col, max(a, steep * 0.85));
          #include <fog_fragment>
        }`}));
    water.renderOrder = 2; water.receiveShadow = false; near.add(water);
    this.waterU = WU; this.waterMesh = water;
    /* les nénuphars et leurs fleurs, sur les vasques profondes */
    const pads = this.scatter(b, 300, 211, {e1:0.95, trail:2, tries:6, test:(x, z)=>{ const T = terrace(x, z); return T.level - heightAt(x, z) > 0.3 && T.f < 0.7; }});
    const pad = new THREE.CircleGeometry(1, 14, 0.25, Math.PI * 2 - 0.5); pad.rotateX(-Math.PI / 2);
    const padMat = glowMat({key:"pad", color:"#ffffff", rough:0.5, side:THREE.DoubleSide, tint:`diffuseColor.rgb *= vIC;`});
    inst(near, pad, padMat, pads.map(p=>({x:p.x, y:terrace(p.x, p.z).level - 0.01, z:p.z, s:0.35 + p.r * 0.55, ry:p.r2 * 6, c:new THREE.Color().setHSL(0.28 + p.r3 * 0.06, 0.45, 0.22 + p.r * 0.1)})), false);
    const bloom = new THREE.ConeGeometry(0.35, 0.3, 7, 1, true); bloom.rotateX(Math.PI); bloom.translate(0, 0.18, 0);
    const bloomMat = glowMat({key:"lotus", color:"#ffd6ea", rough:0.5, side:THREE.DoubleSide, glow:`glow += vec3(1.0, 0.55, 0.78) * 0.45;`});
    inst(near, bloom, bloomMat, pads.filter(p=>p.r3 > 0.72).map(p=>({x:p.x + 0.2, y:terrace(p.x, p.z).level, z:p.z, s:0.6 + p.r * 0.5, ry:p.r2 * 6})), false);
    /* des stèles englouties : la donnée qui stagne, encore lisible */
    const stele = glowMat({key:"stele", color:"#8c9a96", rough:0.8,
      glow:`float face = step(0.45, abs(vOP.z)); float row = step(0.55, fract(vWP.y * 3.2)) * step(0.4, bh(floor(vec2(vOP.x * 18.0, vWP.y * 3.2))));
        glow += vec3(0.3, 0.95, 1.0) * face * row * (0.5 + 0.5 * sin(uBT * 0.9 + vWP.y)) * 1.1;`});
    const sl = this.scatter(b, 11, 233, {e0:0.3, e1:0.85, sp:14, trail:4}).map(p=>({x:p.x, y:terrace(p.x, p.z).level - 1.5, z:p.z, sx:2.4, sy:5 + p.r * 5, sz:0.9, ry:p.r2 * 6, rz:(p.r3 - 0.5) * 0.5, rx:(p.r - 0.5) * 0.3}));
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    inst(far, box, stele, sl); sl.forEach(s=>this.collide(s.x, s.z, 1.4));
    /* la brume, au ras des vasques */
    const mistU = {uBT:BT.uTime};
    const mistMat = new THREE.ShaderMaterial({uniforms:mistU, transparent:true, depthWrite:false, fog:false,
      vertexShader:`varying vec3 vWP; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader:`uniform float uBT; varying vec3 vWP; varying vec2 vUv;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
        void main(){ vec2 p = vWP.xz * 0.045 + vec2(uBT * 0.012, uBT * 0.007);
          float n = vn(p) * 0.6 + vn(p * 2.7 - uBT * 0.01) * 0.4;
          float edge = smoothstep(0.5, 0.28, length(vUv - 0.5));
          float a = smoothstep(0.45, 0.85, n) * edge * 0.24 * smoothstep(3.0, 20.0, distance(cameraPosition, vWP));
          gl_FragColor = vec4(vec3(0.9, 0.95, 0.96), a); }`});
    for(let n = 0; n < 9; n++){
      const ang = n * 0.7, rr = 10 + n * 11, x = b.B[0] - 6 - Math.cos(ang * 0.4) * rr * 0.9, z = b.B[1] + Math.sin(ang) * 14 - n * 1.5;
      const T = terrace(x, z), m = new THREE.Mesh(new THREE.PlaneGeometry(70, 70).rotateX(-Math.PI / 2), mistMat);
      m.position.set(x, T.level + 0.7 + (n % 3) * 0.4, z); m.renderOrder = 7; near.add(m);
    }
    /* la source : des rochers ; des bulles de données qui montent des vasques */
    inst(near, rockGeo(81, 1, 0.7), glowMat({key:"wetrock", color:"#7d8a88", rough:0.55}), this.scatter(b, 40, 251, {e0:0.85, e1:1.0}).map(r=>({x:r.x, y:r.y - 0.4, z:r.z, s:1 + r.r * 3, ry:r.r2 * 6})));
    this.U.bubbles = swarm(near, pads.slice(0, 220).map(p=>({x:p.x + 0.8, y:terrace(p.x, p.z).level - 0.1, z:p.z})), {kind:1, size:0.09, rise:5, c1:"#bffcff", c2:"#5fe4ff", fade:70});
  }

  /* ================= CAVITÉS ================= */
  grotte(){
    const b = BIOME_BY.grotte, {far, near} = this.group(b), F = b.F;
    const ceilY = (x, z) => {
      const dx = (x - b.c[0]) / (b.r[0] * 1.06), dz = (z - b.c[1]) / (b.r[1] * 1.06), e = Math.sqrt(dx * dx + dz * dz);
      return F + 7 + 22 * Math.sqrt(Math.max(0, 1 - e * e)) + 3 * nQ(x / 22, z / 22) + 1.2 * nQ(x / 6, z / 6);
    };
    this.ceilY = ceilY;
    /* les trous du plafond : le jour tombe en colonnes */
    const holes = [{x:b.c[0] - 22, z:b.c[1] - 18, r:6.5}, {x:b.c[0] + 26, z:b.c[1] + 10, r:5}, {x:b.c[0] - 8, z:b.c[1] + 34, r:4.5}, {x:b.c[0] + 10, z:b.c[1] - 40, r:5.5}];
    const st = 2, x0 = b.c[0] - b.r[0] * 1.12, z0 = b.c[1] - b.r[1] * 1.12, nx = Math.round(b.r[0] * 2.24 / st) + 1, nz = Math.round(b.r[1] * 2.24 / st) + 1;
    const pos = [], idx = [];
    for(let j = 0; j < nz; j++) for(let i = 0; i < nx; i++){ const x = x0 + i * st, z = z0 + j * st; pos.push(x, ceilY(x, z), z); }
    for(let j = 0; j < nz - 1; j++) for(let i = 0; i < nx - 1; i++){
      const x = x0 + (i + 0.5) * st, z = z0 + (j + 0.5) * st;
      const dx = (x - b.c[0]) / (b.r[0] * 1.12), dz = (z - b.c[1]) / (b.r[1] * 1.12);
      if(dx * dx + dz * dz > 1) continue;
      if(holes.some(h=>Math.hypot(h.x - x, h.z - z) < h.r + 1.4 * nQ(x / 3, z / 3))) continue;
      const a = j * nx + i; idx.push(a, a + 1, a + nx, a + 1, a + nx + 1, a + nx);
    }
    const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); cg.setIndex(idx); cg.computeVertexNormals();
    const rockMat = glowMat({key:"caverock", color:"#2c2634", rough:0.95, side:THREE.DoubleSide,
      tint:`diffuseColor.rgb *= 0.6 + 0.6 * bn(vWP.xz * 0.3 + vWP.y * 0.2);`,
 });
    const ceil = new THREE.Mesh(cg, rockMat); ceil.castShadow = true; ceil.receiveShadow = true; far.add(ceil);
    /* stalactites et stalagmites */
    const cone = new THREE.ConeGeometry(1, 1, 7, 3); cone.translate(0, 0.5, 0);
    const tites = this.scatter(b, 300, 301, {e1:0.98, tries:4}).filter(p=>!holes.some(h=>Math.hypot(h.x - p.x, h.z - p.z) < h.r + 2)).map(p=>{
      const L = 2 + p.r * p.r * 9; return {x:p.x, y:ceilY(p.x, p.z) + 0.6, z:p.z, sx:0.35 + p.r * 0.9, sy:L, sz:0.35 + p.r * 0.9, rx:Math.PI}; });
    inst(near, cone, rockMat, tites, true);
    const mites = this.scatter(b, 170, 311, {e1:0.95, tries:5}).map(p=>{ const L = 1 + p.r * p.r * 6; return {x:p.x, y:p.y - 0.3, z:p.z, sx:0.4 + p.r * 0.9, sy:L, sz:0.4 + p.r * 0.9}; });
    inst(near, cone, rockMat, mites); mites.forEach(m=>{ if(m.sy > 2.5) this.collide(m.x, m.z, m.sx * 0.9); });
    /* les cristaux : des blocs mémoire jamais désalloués, qui éclairent la caverne */
    const crys = glowMat({key:"crystal", color:"#ffffff", rough:0.2, metal:0.1, flat:true,
      tint:`diffuseColor.rgb = mix(vec3(0.08), vIC * 0.5, 0.6);`,
      glow:`float band = 0.55 + 0.45 * sin(vOP.y * 5.0 - uBT * 1.4 + vWP.x * 0.3);
        float edge = smoothstep(0.75, 1.0, length(vOP.xz));
        glow += vIC * (0.9 * band + 0.8 * edge) * 1.25;`});
    const pr = prismGeo(6, 0.5), list = [];
    const clusters = this.scatter(b, 34, 321, {e1:0.86, sp:12});
    clusters.push({x:b.c[0] + 4, z:b.c[1] + 2, y:heightAt(b.c[0] + 4, b.c[1] + 2), r:1, r2:0.3, r3:0.5, giant:true});
    const tints = ["#9b5cff", "#47e9ff", "#ffb347", "#ff5ca8"];
    for(const c of clusters){
      const n = c.giant ? 11 : 4 + Math.floor(c.r * 6), big = c.giant ? 5 : 1, col = new THREE.Color(tints[Math.floor(c.r2 * (c.giant ? 2 : 4))]);
      for(let k = 0; k < n; k++){
        const a = k / n * Math.PI * 2 + c.r3 * 3, d = (k ? 0.6 + (k % 3) * 0.5 : 0) * big;
        const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d, h = (k ? 1.2 + ((k * 7) % 5) * 0.6 : 3.2) * big * (0.7 + c.r * 0.6);
        list.push({x, y:heightAt(x, z) - 0.4, z, sx:(0.25 + h * 0.08), sy:h, sz:(0.25 + h * 0.08), rx:Math.cos(a) * (k ? 0.45 : 0.05), rz:Math.sin(a) * (k ? 0.45 : 0.05), ry:a, c:col});
      }
      this.collide(c.x, c.z, c.giant ? 6 : 1.6);
      if(c.giant) this.giant = c;
    }
    inst(near, pr, crys, list.filter(l=>l.sy < 9), true);
    inst(far, pr, crys, list.filter(l=>l.sy >= 9), true);
    /* quelques lumières, près des plus grands cristaux */
    for(const c of [this.giant, clusters[3], clusters[11], clusters[20]].filter(Boolean)){
      this.lights.push({p:new THREE.Vector3(c.x, heightAt(c.x, c.z) + (c.giant ? 9 : 3), c.z), r:c.giant ? 42 : 22, c:new THREE.Color(c.giant ? "#a874ff" : "#5fe9ff"), k:"grotte", base:c.giant ? 2.2 : 1.4});
    }
    this.U.caveShafts = shafts(near, holes.map(h=>({x:h.x, y:heightAt(h.x, h.z) - 1, z:h.z, w:h.r * 1.7, h:ceilY(h.x, h.z) - heightAt(h.x, h.z) + 4, tilt:0.08})), "#dfe8ff", 0.2);
    this.U.dust = swarm(near, this.scatter(b, 240, 331, {e1:0.95, tries:2}).map(p=>({x:p.x, y:p.y + 1 + p.r * 9, z:p.z})), {kind:3, size:0.035, c1:"#8d7cd6", c2:"#b8d6e8", fade:50});
  }

  /* ================= RUINES D'ARCHIVE ================= */
  ruines(){
    const b = BIOME_BY.ruines, {far, near} = this.group(b), ctr = {x:b.c[0], z:b.c[1]};
    const stone = glowMat({key:"shelf", color:"#a49a8c", rough:0.9,
      tint:`diffuseColor.rgb *= 0.65 + 0.5 * bn(vWP.xz * 0.4 + vWP.y * 0.3); diffuseColor.rgb *= vIC.r > 0.99 && vIC.g > 0.99 ? 1.0 : 0.85;`,
      glow:`/* les lignes d'une étagère de l'archive : des entrées qui s'allument par vagues */
        float face = step(0.47, abs(vOP.z));
        float rowv = fract(vWP.y * 2.4); float row = step(0.5, rowv) * step(rowv, 0.72);
        float cell = bh(floor(vec2(vOP.x * 24.0 + vWP.x, vWP.y * 2.4)));
        float wave = smoothstep(0.55, 1.0, sin(vWP.y * 0.35 - uBT * 0.9 + vWP.x * 0.05 + vWP.z * 0.05));
        glow += mix(vec3(1.0, 0.68, 0.3), vec3(0.75, 0.5, 1.0), step(0.5, bh(floor(vWP.xz * 0.1)))) * face * row * step(0.35, cell) * (0.18 + 1.1 * wave);`});
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    /* l'avenue : deux rangées d'étagères-monolithes, de plus en plus hautes vers la place */
    const shelves = [], dir = new THREE.Vector2(ctr.x - b.B[0], ctr.z - b.B[1]).normalize(), side = new THREE.Vector2(-dir.y, dir.x);
    for(let k = 0; k < 6; k++) for(const sd of [-1, 1]){
      const d = 12 + k * 11, x = b.B[0] + dir.x * d + side.x * sd * 9, z = b.B[1] + dir.y * d + side.y * sd * 9;
      const broken = (k * 3 + (sd > 0 ? 1 : 0)) % 5 === 2, h = broken ? 5 + k : 11 + k * 2.4;
      shelves.push({x, y:heightAt(x, z) - 0.6, z, sx:6, sy:h, sz:1.8, ry:Math.atan2(dir.x, dir.y) + Math.PI / 2, rz:broken ? 0.18 * sd : 0});
    }
    /* et tout autour, des étagères éparses, debout, penchées, couchées */
    this.scatter(b, 34, 401, {e0:0.35, e1:0.9, sp:11, trail:5}).forEach(p=>{
      const fall = p.r3 > 0.82, h = fall ? 3 : 7 + p.r * 16;
      shelves.push({x:p.x, y:p.y - (fall ? 0.4 : 0.8), z:p.z, sx:4 + p.r2 * 3, sy:h, sz:1.6, ry:p.r2 * 6, rx:fall ? Math.PI / 2 - 0.1 : (p.r - 0.5) * 0.2, rz:(p.r3 - 0.5) * 0.25});
    });
    inst(far, box, stone, shelves); shelves.forEach(s=>this.collide(s.x, s.z, Math.min(3.6, s.sx * 0.55)));
    /* trois arches sur l'avenue */
    const arches = [];
    for(let k = 0; k < 3; k++){
      const d = 18 + k * 20, cx = b.B[0] + dir.x * d, cz = b.B[1] + dir.y * d, ry = Math.atan2(dir.x, dir.y) + Math.PI / 2, y = heightAt(cx, cz);
      for(const sd of [-1, 1]) arches.push({x:cx + side.x * sd * 5.2, y:y - 0.5, z:cz + side.y * sd * 5.2, sx:1.6, sy:12 + k * 2, sz:1.6, ry});
      arches.push({x:cx, y:y + 11.5 + k * 2, z:cz, sx:12.4, sy:1.8, sz:2, ry});
      for(const sd of [-1, 1]) this.collide(cx + side.x * sd * 5.2, cz + side.y * sd * 5.2, 1.3);
    }
    inst(far, box, stone, arches);
    /* la place : des colonnes brisées en cercle */
    const col = new THREE.CylinderGeometry(1, 1.1, 1, 12); col.translate(0, 0.5, 0);
    const cols = [];
    for(let k = 0; k < 14; k++){ const a = k / 14 * Math.PI * 2, x = ctr.x + Math.cos(a) * 21, z = ctr.z + Math.sin(a) * 21; cols.push({x, y:heightAt(x, z) - 0.3, z, sx:1.1, sy:k % 3 === 1 ? 3 : 9 + (k % 4) * 2.5, sz:1.1}); this.collide(x, z, 1.3); }
    inst(far, col, stone, cols);
    /* l'Anneau d'index : des blocs qui tournent au-dessus de la place, un rayon qui monte */
    const ringG = new THREE.Group(); ringG.position.set(ctr.x, heightAt(ctr.x, ctr.z) + 17, ctr.z); far.add(ringG);
    const glyph = glowMat({key:"glyph", color:"#1d1726", rough:0.4,
      glow:`float f = max(abs(vOP.x), max(abs(vOP.y), abs(vOP.z)));
        float rim = smoothstep(0.42, 0.5, f); glow += vIC * (0.35 + rim * 1.6) * (0.75 + 0.25 * sin(uBT * 2.0 + vWP.y * 3.0));`});
    const cube = new THREE.BoxGeometry(1, 1, 1), rc = [];
    for(let k = 0; k < 96; k++){ const a = k / 96 * Math.PI * 2; rc.push({x:Math.cos(a) * 14, y:Math.sin(k * 0.9) * 0.6, z:Math.sin(a) * 14, s:0.7 + (k % 4) * 0.25, ry:a, rx:k * 0.3, c:new THREE.Color(k % 5 ? "#f4b46a" : "#b98cff")}); }
    inst(ringG, cube, glyph, rc, false);
    const ring2 = new THREE.Group(); ringG.add(ring2);
    const rc2 = [];
    for(let k = 0; k < 40; k++){ const a = k / 40 * Math.PI * 2; rc2.push({x:Math.cos(a) * 8, y:0, z:Math.sin(a) * 8, s:0.5, rx:a, c:new THREE.Color("#b98cff")}); }
    inst(ring2, cube, glyph, rc2, false); ring2.rotation.x = 1.1;
    this.anim.push(dt=>{ ringG.rotation.y += dt * 0.12; ring2.rotation.z += dt * 0.3; ringG.position.y = heightAt(ctr.x, ctr.z) + 17 + Math.sin(BT.uTime.value * 0.4) * 0.6; });
    this.U.ruinBeam = shafts(far, [{x:ctr.x, y:heightAt(ctr.x, ctr.z), z:ctr.z, w:3.2, h:70}], "#c9a8ff", 0.32);
    /* des blocs épars, et d'autres qui flottent */
    const blocks = this.scatter(b, 260, 431, {e1:0.92, trail:2.5, tries:4}).map(p=>{ const fl = p.r3 > 0.8;
      return {x:p.x, y:p.y + (fl ? 2 + p.r * 6 : -0.2), z:p.z, s:0.4 + p.r * 1.3, ry:p.r2 * 6, rx:fl ? p.r * 3 : 0, rz:fl ? p.r2 * 2 : (p.r - 0.5) * 0.4, c:new THREE.Color(fl ? "#f4b46a" : "#ffffff")}; });
    inst(near, cube, stone, blocks);
    this.U.pages = swarm(near, this.scatter(b, 420, 441, {e1:0.95, tries:2}).map(p=>({x:p.x, y:p.y + 2 + p.r * 14, z:p.z})), {kind:2, size:0.13, c1:"#fff1d0", c2:"#cdb8ff", fade:90});
  }

  /* ================= FOYER THERMIQUE ================= */
  foyer(){
    const b = BIOME_BY.foyer, {far, near} = this.group(b), ctr = {x:b.c[0], z:b.c[1]};
    const basalt = glowMat({key:"basalt", color:"#26211f", rough:0.85, flat:true,
      tint:`diffuseColor.rgb *= 0.7 + 0.5 * bh(floor(vWP.xz * 1.3));`,
      glow:`float base = smoothstep(0.35, 0.0, vOP.y);
        float crack = smoothstep(0.04, 0.0, abs(bn(vWP.xz * 0.9 + vWP.y * 0.7) - 0.5)) * smoothstep(0.6, 0.0, vOP.y);
        glow += vec3(1.0, 0.32, 0.06) * (base * 0.9 + crack * 1.4) * (0.8 + 0.2 * sin(uBT * 1.4 + vWP.x));`});
    const hex = prismGeo(6, 0, true), cols = [];
    this.scatter(b, 64, 501, {e0:0.15, e1:0.88, sp:10, trail:3, lava:true}).forEach(c=>{
      const n = 6 + Math.floor(c.r * 10), top = 2 + c.r2 * 7;
      for(let k = 0; k < n; k++){
        const a = k * 2.39996, d = Math.sqrt(k) * 0.95, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        if(lavaAt(x, z) > 0.1) continue;
        cols.push({x, y:heightAt(x, z) - 0.5, z, sx:0.5, sy:top * (1 - d / 6) + ((k * 13) % 7) * 0.3 + 0.6, sz:0.5, ry:0.52});
      }
      this.collide(c.x, c.z, 2.2);
    });
    inst(near, hex, basalt, cols);
    /* le Dissipateur : une tour d'ailettes, au cœur de la caldeira, qui rougeoie */
    const spire = new THREE.Group(); spire.position.set(ctr.x, heightAt(ctr.x, ctr.z) - 1, ctr.z); far.add(spire);
    const core = glowMat({key:"core", color:"#1a1412", rough:0.6, metal:0.3,
      glow:`float a = atan(vOP.z, vOP.x); float seam = smoothstep(0.06, 0.0, abs(fract(a * 1.909) - 0.5) - 0.44);
        float up = fract(vWP.y * 0.06 - uBT * 0.35);
        glow += vec3(1.0, 0.42, 0.08) * seam * (0.6 + 2.4 * smoothstep(0.75, 1.0, up)) + vec3(1.0, 0.25, 0.04) * smoothstep(8.0, 0.0, vWP.y - ${"" }0.0) * 0.0;`});
    const coreM = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.6, 62, 16, 8), core); coreM.position.y = 31; coreM.castShadow = true; spire.add(coreM);
    const fin = new THREE.BoxGeometry(0.5, 1, 1);
    const fins = [];
    for(let tier = 0; tier < 4; tier++) for(let k = 0; k < 18; k++){
      const a = k / 18 * Math.PI * 2 + tier * 0.17, r = 6.5 - tier * 0.9, h = 11 - tier * 1.2;
      fins.push({x:Math.cos(a) * r, y:5 + tier * 13, z:Math.sin(a) * r, sx:0.5, sy:h, sz:5.2 - tier * 0.7, ry:-a});
    }
    const finMat = glowMat({key:"fin", color:"#2a2421", rough:0.55, metal:0.5,
      glow:`float edge = smoothstep(0.4, 0.5, abs(vOP.z)); glow += vec3(1.0, 0.35, 0.07) * edge * (0.5 + 0.5 * sin(uBT * 2.0 + vWP.y * 0.5)) * 1.2;`});
    inst(spire, fin, finMat, fins);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 6, 10), basalt); base.position.y = 2; spire.add(base);
    this.collide(ctr.x, ctr.z, 9);
    this.U.heat = shafts(far, [{x:ctr.x, y:heightAt(ctr.x, ctr.z) + 58, z:ctr.z, w:7, h:90}], "#ff8a3d", 0.3);
    this.lights.push({p:new THREE.Vector3(ctr.x, heightAt(ctr.x, ctr.z) + 6, ctr.z), r:48, c:new THREE.Color("#ff6a2a"), k:"foyer", base:2.4});
    /* des fumerolles : des cônes de roche, une fumée lente, des braises */
    const vents = this.scatter(b, 8, 521, {e0:0.3, e1:0.8, sp:24, trail:6, lava:true});
    inst(near, new THREE.ConeGeometry(2.4, 2.6, 9, 1, true).translate(0, 1.0, 0), basalt, vents.map(v=>({x:v.x, y:v.y - 0.4, z:v.z, s:1 + v.r * 0.6})));
    vents.forEach(v=>this.collide(v.x, v.z, 2.4));
    const smoke = [];
    vents.forEach(v=>{ for(let k = 0; k < 40; k++) smoke.push({x:v.x + (k % 5 - 2) * 0.3, y:v.y + 2, z:v.z + (k % 3 - 1) * 0.3}); });
    this.U.smoke = swarm(near, smoke, {kind:1, size:2.6, rise:26, c1:"#2a2220", c2:"#4a3a34", normal:true, fade:140});
    this.U.embers = swarm(near, this.scatter(b, 1100, 531, {e1:0.95, tries:2}).map(p=>({x:p.x, y:p.y, z:p.z})), {kind:1, size:0.08, rise:24, c1:"#ffb347", c2:"#ff4a12", fade:90});
    inst(near, rockGeo(91, 1), basalt, this.scatter(b, 90, 541, {e1:0.95, lava:true, trail:2}).map(r=>({x:r.x, y:r.y - 0.3, z:r.z, s:0.5 + r.r * 1.6, ry:r.r2 * 6})));
  }

  /* ================= LES COLS ================= */
  /* chaque col est balisé : des bornes de pierre, une lueur à la couleur du biome ; au bout, un portique */
  passes(){
    const post = new THREE.BoxGeometry(1, 1, 1); post.translate(0, 0.5, 0);
    const mat = glowMat({key:"post", color:"#5a5e66", rough:0.8,
      glow:`float top = smoothstep(0.9, 0.93, vOP.y) * (1.0 - smoothstep(0.97, 1.0, vOP.y) * 0.4);
        float edge = smoothstep(0.43, 0.49, abs(vOP.x)) * smoothstep(0.43, 0.49, abs(vOP.z)) * step(0.1, vOP.y);
        glow += vIC * (top * 2.0 + edge * 0.9 * (0.55 + 0.45 * sin(uBT * 2.0 - vWP.y * 1.5)));`});
    const list = [];
    for(const b of BIOMES){
      const dx = b.B[0] - b.A[0], dz = b.B[1] - b.A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, c = new THREE.Color(b.col);
      for(let d = 12; d < L + 4; d += 9) for(const sd of [-1, 1]){
        const x = b.A[0] + ux * d - uz * sd * (b.w + 0.8), z = b.A[1] + uz * d + ux * sd * (b.w + 0.8);
        list.push({x, y:heightAt(x, z) - 0.3, z, sx:0.45, sy:1.9, sz:0.45, ry:Math.atan2(ux, uz), c});
        this.lights.push({p:new THREE.Vector3(x, heightAt(x, z) + 1.6, z), r:6, c, k:b.k, base:0.9});
      }
      /* le portique, au bout du col : on entre dans le biome */
      const x = b.B[0], z = b.B[1], y = heightAt(x, z), ry = Math.atan2(ux, uz), half = b.w + 2;
      for(const sd of [-1, 1]){ const px = x - uz * sd * half, pz = z + ux * sd * half; list.push({x:px, y:heightAt(px, pz) - 0.4, z:pz, sx:1.3, sy:9.5, sz:1.3, ry, c}); this.collide(px, pz, 0.9); }
      list.push({x, y:y + 8.6, z, sx:half * 2 + 2.4, sy:1.1, sz:1.4, ry, c});
    }
    inst(this.root, post, mat, list);
  }

  /* ================= LES COLS FERMÉS ================= */
  barriers(){
    const U = this.barU = {uBT:BT.uTime, uP:{value:new THREE.Vector3()}};
    this.bars = {};
    for(const b of BIOMES){
      const dx = b.B[0] - b.A[0], dz = b.B[1] - b.A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      const x = b.A[0] + ux * 5, z = b.A[1] + uz * 5, y = heightAt(x, z), w = b.w * 2 + 6;
      const g = new THREE.PlaneGeometry(w, 11, 24, 1), p = g.attributes.position;
      for(let i = 0; i < p.count; i++){ const s = p.getX(i), X = x - uz * s, Z = z + ux * s; p.setXYZ(i, X, p.getY(i) + 5.5 + heightAt(X, Z) - 0.6, Z); }
      const mat = new THREE.ShaderMaterial({uniforms:{uBT:BT.uTime, uP:U.uP, uC:{value:new THREE.Color(b.col)}, uA:{value:1}}, transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, fog:false,
        vertexShader:`varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader:`uniform float uBT, uA; uniform vec3 uC, uP; varying vec2 vUv; varying vec3 vWP;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          void main(){ vec2 cell = floor(vec2(vUv.x * 110.0, vUv.y * 64.0)); float col = h21(vec2(cell.x, 3.0));
            float fall = fract(cell.y * 0.03 + uBT * (0.12 + col * 0.35) + col * 7.0);
            float on = step(0.8, h21(cell + floor(uBT * 5.0 * (0.3 + col))));
            float near = 1.0 - smoothstep(4.0, 30.0, distance(vWP.xz, uP.xz)), touch = 1.0 - smoothstep(0.5, 3.5, distance(vWP.xz, uP.xz));
            float a = (on * 0.5 + smoothstep(0.86, 1.0, fall) * 0.5) * (0.3 + 0.55 * near - 0.45 * touch) * smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y)) * smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
            gl_FragColor = vec4(mix(uC, vec3(1.0), 0.15) * a * 1.4 * uA, 1.0); }`});
      const curtain = new THREE.Mesh(g, mat); curtain.renderOrder = 7; curtain.frustumCulled = false; this.root.add(curtain);
      const lab = labelSprite(); lab.sp.position.set(x, y + 9.5, z); lab.sp.scale.set(12, 3, 1); this.root.add(lab.sp);
      this.bars[b.k] = {b, curtain, mat, lab, a:1, txt:"", open:false};
    }
  }
  /* le texte d'un col fermé : son nom, ce qu'il demande, où l'on en est */
  paintBar(B, have){
    const need = B.need || 0, txt = B.b.k + have + "/" + need;
    if(B.txt === txt) return; B.txt = txt;
    const g = B.lab.cv.getContext("2d"), W = B.lab.cv.width, H = B.lab.cv.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(4,6,12,0.72)"; g.beginPath(); g.roundRect(40, 18, W - 80, H - 36, 26); g.fill();
    g.strokeStyle = B.b.col; g.lineWidth = 4; g.stroke();
    g.textAlign = "center"; g.fillStyle = "#ffffff"; g.font = "800 64px Unbounded, sans-serif";
    g.fillText(HAB_NAMES[B.b.k], W / 2, 108);
    g.font = "40px 'Pixelify Sans', sans-serif"; g.fillStyle = B.b.col;
    g.fillText(`Fermé · ${need} espèces au Pokédex de Kanto · ${Math.min(have, need)} / ${need}`, W / 2, 176);
    B.lab.tex.needsUpdate = true;
  }
  /* ---------- à chaque image ---------- */
  update(dt, t, player, sky, night, info){
    BT.uTime.value = t;
    for(const f of this.anim) f(dt);
    /* où est le joueur, et quelle part de chaque biome l'entoure */
    let bestW = 0, best = null;
    for(const b of BIOMES){ const w = biomeWeight(b, player.x, player.z); b.wNow = w; if(w > bestW){ bestW = w; best = b; } }
    this.where = {k:best && bestW > 0.5 ? best.k : "route", w:bestW, b:best};
    /* les détails ne se dessinent que si l'on est assez près */
    for(const k in this.G){
      const G = this.G[k], b = G.b, d = Math.hypot(player.x - b.c[0], player.z - b.c[1]) - Math.max(b.r[0], b.r[1]);
      G.near.visible = d < 100; G.far.visible = d < 420;
    }
    for(const U of Object.values(this.U)) if(U && U.uFocus) U.uFocus.value.copy(player);
    /* les lueurs : les quatre plus proches du joueur */
    const ls = this.lights.map(l=>({l, d:Math.hypot(l.p.x - player.x, l.p.z - player.z)})).sort((a, b)=>a.d - b.d);
    for(let i = 0; i < BL_N; i++){
      const q = ls[i], V = BL.uBL.value[i], Cc = BL.uBLC.value[i];
      if(!q || q.d > q.l.r + 120){ V.set(0, -999, 0, 1); Cc.setRGB(0, 0, 0); continue; }
      V.set(q.l.p.x, q.l.p.y, q.l.p.z, q.l.r);
      Cc.copy(q.l.c).multiplyScalar(q.l.base * (q.l.k === "foyer" ? 0.85 + 0.15 * Math.sin(t * 2.3) : 0.9 + 0.1 * Math.sin(t * 1.1 + i)));
    }
    if(this.waterU && sky){ this.waterU.uSunDir.value.copy(sky.dir); this.waterU.uSky.value.copy(sky.uniforms.uHor.value); this.waterU.uSkyZ.value.copy(sky.uniforms.uZen.value); }
    /* les cols fermés */
    const have = info ? info.have : 0;
    for(const k in this.bars){
      const B = this.bars[k], open = !!LOCKS[k];
      B.need = info && info.need ? info.need[k] : B.need;
      if(!open) this.paintBar(B, have);
      B.a += ((open ? 0 : 1) - B.a) * Math.min(1, dt * 1.5);
      B.mat.uniforms.uA.value = B.a; B.curtain.visible = B.a > 0.01; B.lab.sp.visible = B.a > 0.5; B.lab.sp.material.opacity = smooth(0.5, 1, B.a);
    }
    this.barU.uP.value.copy(player);
    return this.atmosphere(best, bestW, sky, night);
  }
  /* le ciel, le brouillard et la lumière du biome où l'on est */
  atmosphere(b, w, sky, night){
    if(!sky) return null;
    const scene = this.scene, U = sky.uniforms;
    const k = b ? ATM[b.k] : null, wk = k ? smooth(0.05, 0.9, w) : 0;
    this.mix = {w:wk, k:b ? b.k : null};
    if(!k || wk <= 0.001){ U.uBioW.value = 0; return {exp:1, lamp:0}; }
    const dark = b.k === "grotte" ? 0 : night * 0.78, keep = 1 - dark;
    const T = this._t || (this._t = new THREE.Color());
    scene.fog.color.lerp(T.copy(k.fog).multiplyScalar(keep), wk);
    scene.fog.density = lerp(scene.fog.density, k.fogD * (1 + night * 0.2), wk);
    sky.hemi.color.lerp(T.copy(k.hemi).multiplyScalar(keep * 0.85 + 0.15), wk);
    sky.hemi.groundColor.lerp(T.copy(k.gnd).multiplyScalar(b.k === "foyer" ? 1 : keep), wk);
    sky.hemi.intensity = lerp(sky.hemi.intensity, k.hi * (0.55 + 0.45 * keep), wk);
    sky.sun.color.lerp(k.sun, wk * keep);
    sky.sun.intensity = lerp(sky.sun.intensity, k.si * (0.25 + 0.75 * keep), wk);
    U.uBioW.value = wk * 0.88; U.uBioZen.value.copy(k.zen).multiplyScalar(keep); U.uBioHor.value.copy(k.hor).multiplyScalar(keep * 0.9 + 0.1);
    return {exp:lerp(1, k.exp, wk), lamp:k.lamp * wk};
  }
}
