/* ============================================================
   UNE PÊCHE PAR BIOME, ET SON DRESSEUR
   Chaque biome a son eau, et ce qui y vit ne vit que là :
     · Sylve d'index : la source, au pied des arbres (des rochers
       moussus, des champignons qui luisent) ;
     · Nappes : la grande vasque, au bord de la chaussée ;
     · Cavités : le lac souterrain, cerclé de cristaux ;
     · Ruines d'archive : le bassin d'index, au milieu de la place,
       sous l'Anneau ;
     · Foyer thermique : la coulée — on pêche dans la lave.
   Les ombres, le bouchon, le « ! », le ferrage : la pêche du lac
   (fishing.js), avec le vivier de l'endroit. Tout près, le dresseur
   du biome attend (trainer.js).
   Les places se cherchent une fois, d'après le relief : loin des
   monuments, près du sentier, à plat ; les arbres, les rochers et
   l'herbe s'en écartent (biomes, grass).
   ============================================================ */
import * as THREE from "three";
import { BIOME_BY, heightAt, regionAt, trailDist, terrace, lavaAt, LAVA_POOL } from "./layout.js";
import { WATER_VERT, WATER_FRAG, FISH_MAX, RIPPLE_MAX } from "./water.js";
import { glowMat, rockGeo, prismGeo, inst, BT } from "./biomes/kit.js";

/* ce qu'on y pêche : du plus commun au plus rare (la rareté vient du jeu mobile) */
export const FISH = {
  foret:[60, 61, 54, 118, 119, 129, 186, 194, 195, 270, 271, 283, 284],
  eaux:[86, 90, 116, 117, 120, 72, 131, 147, 148, 222, 223, 224, 230, 211, 370, 320],
  grotte:[98, 99, 54, 55, 170, 171, 339, 340, 341, 342, 369],
  ruines:[120, 121, 54, 55, 147, 148, 73, 318, 319, 199, 222, 230, 369, 358],     /* (pas de Ramoloss ici : il ne vit qu'aux Nappes) */
  foyer:[218, 219, 126, 58, 37, 77, 78, 59, 322, 323, 324]
};
const INFO = {
  foret:{n:"La source de l'Arbre-Index", kind:"basin", look:"forest", r:4.6, pref:[-158, 113]},
  eaux:{n:"La grande vasque", kind:"overlay", look:"pool", r:5.5, pref:[-158, -44]},
  grotte:{n:"Le lac souterrain", kind:"basin", look:"cave", r:5.2, pref:[164, 76]},
  ruines:{n:"Le bassin d'index", kind:"basin", look:"ruins", r:5.2, pref:null},
  foyer:{n:"Le Chaudron", kind:"lava", look:"lava", r:3.4, pref:null}
};
/* les monuments qu'on ne recouvre pas */
const KEEP = [{x:-193, z:101, r:30}, {x:184, z:60, r:12}, {x:0, z:-304, r:20}];

export const PONDS = [];
export const POND_BY = {};
let done = false;
const flatEnough = (x, z, r, tol) => { const h0 = heightAt(x, z); for(let a = 0; a < 6.28; a += 0.8) if(Math.abs(heightAt(x + Math.cos(a) * r, z + Math.sin(a) * r) - h0) > tol) return false; return true; };
function spotFor(k){
  const I = INFO[k], b = BIOME_BY[k], r = I.r;
  if(k === "ruines") return {x:b.c[0], z:b.c[1]};
  const cands = [];
  for(let e = 0.12; e < 0.8; e += 0.035) for(let a = 0; a < 6.28; a += 0.13){
    const x = b.c[0] + Math.cos(a) * b.r[0] * e, z = b.c[1] + Math.sin(a) * b.r[1] * e;
    cands.push({x, z, d:I.pref ? Math.hypot(x - I.pref[0], z - I.pref[1]) : e});
  }
  cands.sort((p, q)=>p.d - q.d);
  if(I.kind === "lava") cands.unshift({x:LAVA_POOL.x, z:LAVA_POOL.z, d:-1});     /* (le Chaudron est creusé exprès) */
  for(const c of cands){
    const {x, z} = c;
    if(regionAt(x, z) !== k || KEEP.some(o=>Math.hypot(o.x - x, o.z - z) < o.r + r)) continue;
    if(I.kind === "basin"){
      const td = k === "grotte" ? 9 : trailDist(k, x, z);
      if(td < r + 2.5 || (k !== "grotte" && td > r + 9)) continue;
      if(!flatEnough(x, z, r + 0.5, 0.9)) continue;
      return {x, z};
    }
    if(I.kind === "overlay"){
      /* une vasque assez profonde partout, et le bord de la chaussée tout près */
      let ok = true;
      for(let a = 0; a < 6.28 && ok; a += 0.5) for(const rr of [0, r * 0.5, r]){ const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr, T = terrace(px, pz); if(T.level - heightAt(px, pz) < 0.28 || T.f > 0.78 || regionAt(px, pz) !== k) { ok = false; break; } }
      if(!ok) continue;
      const td = trailDist(k, x, z);
      if(td < r + 0.4 || td > r + 3.2) continue;
      const T0 = terrace(x, z).level; let same = true;
      for(let a = 0; a < 6.28; a += 0.5){ if(Math.abs(terrace(x + Math.cos(a) * r, z + Math.sin(a) * r).level - T0) > 0.01) same = false; }
      if(!same) continue;
      return {x, z};
    }
    if(I.kind === "lava"){
      let ok = Math.hypot(x - LAVA_POOL.x, z - LAVA_POOL.z) < 1.5 && lavaAt(x, z) > 0.9;
      for(let a = 0; a < 6.28 && ok; a += 0.6) if(lavaAt(x + Math.cos(a) * r * 0.8, z + Math.sin(a) * r * 0.8) < 0.85) ok = false;
      if(!ok) continue;
      /* une rive : un sol ferme, à quelques pas */
      let shore = null;
      for(let a = 0; a < 6.28 && !shore; a += 0.3) for(let rr = r + 0.8; rr < r + 4.5; rr += 0.5){ const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; if(lavaAt(px, pz) < 0.15 && regionAt(px, pz) === k && flatEnough(px, pz, 1.5, 0.8)){ shore = {x:px, z:pz}; break; } }
      if(!shore) continue;
      return {x, z, shore};
    }
  }
  return null;
}
/* le dresseur : sur la rive, à quelques pas de l'eau, côté sentier */
function trainerSpot(k, P){
  let best = null, bd = 1e9;
  for(let rr = P.r + 4.5; rr < P.r + 13; rr += 1.1) for(let a = 0; a < 6.28; a += 0.2){
    const x = P.x + Math.cos(a) * rr, z = P.z + Math.sin(a) * rr;
    if(regionAt(x, z) !== k || lavaAt(x, z) > 0.1 || !flatEnough(x, z, k === "eaux" ? 1.2 : 2.5, 0.7)) continue;
    if(KEEP.some(o=>Math.hypot(o.x - x, o.z - z) < o.r + 3)) continue;
    if(k === "eaux"){
      /* aux Nappes, tout est vasque sauf la chaussée : il se tient au bord de la chaussée, comme sur une route */
      const T = terrace(x, z); if(T.level - heightAt(x, z) > 0.05) continue;
      const tdw = trailDist(k, x, z); if(tdw > 0 || tdw < -1.6) continue;
      const score = Math.abs(tdw + 0.7) * 3 + Math.abs(rr - P.r - 6);
      if(score < bd){ bd = score; best = {x, z}; }
      continue;
    }
    const td = k === "grotte" ? 0 : Math.max(0, trailDist(k, x, z));
    const score = td * 2 + Math.abs(rr - P.r - 7);
    if(td < 1.2 && k !== "grotte") continue;
    if(score < bd){ bd = score; best = {x, z}; }
  }
  if(best) best.heading = Math.atan2(P.x - best.x, P.z - best.z);
  return best;
}
/* une fois le relief connu (après buildGrid) */
export function ensurePonds(){
  if(done) return PONDS; done = true;
  for(const k of Object.keys(INFO)){
    const s = spotFor(k); if(!s) { console.warn("pas de place pour la pêche", k); continue; }
    const I = INFO[k], P = {k, n:I.n, kind:I.kind, look:I.look, x:s.x, z:s.z, r:I.r, shore:s.shore || null, fish:FISH[k]};
    P.trainer = trainerSpot(k, P);
    PONDS.push(P); POND_BY[k] = P;
  }
  return PONDS;
}
/* l'herbe, les arbres, les rochers s'en écartent */
export function pondAt(x, z, m = 0){ for(const P of PONDS) if(P.kind === "basin" && Math.hypot(x - P.x, z - P.z) < P.r + 0.7 + m) return true; return false; }
export function pondAvoid(x, z, m = 0){
  for(const P of PONDS){
    if(P.kind !== "lava" && Math.hypot(x - P.x, z - P.z) < P.r + 2.5 + m) return true;
    if(P.trainer && Math.hypot(x - P.trainer.x, z - P.trainer.z) < 4 + m) return true;
  }
  return false;
}

/* ---------- l'eau de chaque endroit : la surface du lac, à sa couleur, avec ses ombres ---------- */
const LOOK = {
  forest:{sh:[0.05, 0.12, 0.07], dp:[0.006, 0.03, 0.018]},
  pool:{sh:[0.06, 0.1, 0.095], dp:[0.008, 0.022, 0.03], overlay:1, shadow:[0.0, 0.08, 0.1], rip:[0.85, 0.97, 1.0]},
  cave:{sh:[0.03, 0.16, 0.18], dp:[0.004, 0.035, 0.06]},
  ruins:{sh:[0.07, 0.07, 0.14], dp:[0.012, 0.01, 0.045]},
  lava:{sh:[0, 0, 0], dp:[0, 0, 0], overlay:1, shadow:[0.05, 0.012, 0.004], rip:[1.0, 0.5, 0.1]}
};
export class PondsView {
  constructor(scene, colliders, lights){
    this.scene = scene; this.list = [];
    for(const P of ensurePonds()){
      const L = LOOK[P.look], g = new THREE.Group(); scene.add(g);
      /* le niveau de l'eau */
      let y;
      if(P.kind === "overlay") y = terrace(P.x, P.z).level - 0.025;
      else if(P.kind === "lava") y = heightAt(P.x, P.z) + 0.05;
      else { let hi = -1e9; for(let a = 0; a < 6.28; a += 0.4) for(const rr of [0, P.r * 0.6, P.r + 0.6]) hi = Math.max(hi, heightAt(P.x + Math.cos(a) * rr, P.z + Math.sin(a) * rr)); y = hi + 0.3; }
      P.y = y;
      const geo = new THREE.CircleGeometry(P.r + (P.kind === "basin" ? 0.1 : 0), 48); geo.rotateX(-Math.PI / 2); geo.translate(P.x, y, P.z);
      const pos = geo.attributes.position, dep = new Float32Array(pos.count);
      for(let i = 0; i < pos.count; i++){ const d = Math.hypot(pos.getX(i) - P.x, pos.getZ(i) - P.z); dep[i] = P.kind === "basin" ? 0.25 + 1.8 * Math.min(1, (P.r - d) / (P.r * 0.4)) : 1.6 * Math.min(1, (P.r - d) / (P.r * 0.35)); }
      geo.setAttribute("aDepth", new THREE.BufferAttribute(dep, 1));
      const U = {uTime:{value:0}, uSunDir:{value:new THREE.Vector3(0, 1, 0)}, uSun:{value:new THREE.Color()}, uZen:{value:new THREE.Color()},
        uHor:{value:new THREE.Color()}, uFog:{value:new THREE.Color()}, uFogDensity:{value:0.006}, uNight:{value:0},
        uFish:{value:Array.from({length:FISH_MAX}, ()=>new THREE.Vector4())}, uFishK:{value:Array.from({length:FISH_MAX}, ()=>new THREE.Vector4())},
        uRip:{value:Array.from({length:RIPPLE_MAX}, ()=>new THREE.Vector4())},
        uShallow:{value:new THREE.Vector3(...L.sh)}, uDeep:{value:new THREE.Vector3(...L.dp)}, uOverlay:{value:L.overlay || 0},
        uShadowC:{value:new THREE.Vector3(...(L.shadow || [0, 0, 0]))}, uRipC:{value:new THREE.Vector3(...(L.rip || [0.5, 0.58, 0.62]))}};
      const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({uniforms:U, vertexShader:WATER_VERT, fragmentShader:WATER_FRAG, transparent:true, depthWrite:false}));
      mesh.renderOrder = 3; g.add(mesh);
      const surf = {y, U, ripN:0,
        ripple(x, z, t, f = 1){ U.uRip.value[this.ripN++ % RIPPLE_MAX].set(x, z, t, f); },
        setFish(i, x, z, ang, size, shiny, treasure, alpha){ const f = U.uFish.value[i], k = U.uFishK.value[i]; if(!f) return; f.set(x, z, ang, size); k.set(shiny ? 1 : 0, treasure ? 1 : 0, alpha, 0); },
        clearFish(){ for(const f of U.uFish.value) f.w = 0; },
        hit(ray){
          if(Math.abs(ray.direction.y) < 1e-4) return null;
          const t = (y - ray.origin.y) / ray.direction.y; if(t < 0 || t > 40) return null;
          const p = ray.origin.clone().addScaledVector(ray.direction, t);
          return Math.hypot(p.x - P.x, p.z - P.z) < P.r * 0.88 ? p : null;
        }};
      P.surf = surf;
      if(P.kind === "basin"){ this.rim(g, P, y); colliders.push({x:P.x, z:P.z, r:P.r + 0.45}); }
      if(P.look === "cave") lights.push({p:new THREE.Vector3(P.x, y + 1.5, P.z), r:14, c:new THREE.Color("#3fe0ff"), k:"grotte", base:1.3});
      if(P.look === "forest") lights.push({p:new THREE.Vector3(P.x, y + 1.2, P.z), r:9, c:new THREE.Color("#5cffc0"), k:"foret", base:0.7});
      this.list.push(P);
    }
  }
  /* le bord : rochers moussus, cristaux, ou un mur de pierre taillée */
  rim(g, P, y){
    let lo = 1e9; for(let a = 0; a < 6.28; a += 0.3) lo = Math.min(lo, heightAt(P.x + Math.cos(a) * (P.r + 0.4), P.z + Math.sin(a) * (P.r + 0.4)));
    const H = y + 0.22 - (lo - 0.4);
    if(P.look === "ruins"){
      const stone = glowMat({key:"basinstone", color:"#a49a8c", rough:0.85,
        tint:`diffuseColor.rgb *= 0.7 + 0.4 * bn(vWP.xz * 0.9 + vWP.y);`,
        glow:`float band = smoothstep(0.035, 0.0, abs(vWP.y - ${(y + 0.02).toFixed(3)} - 0.12)) * step(0.5, fract(atan(vWP.z - ${P.z.toFixed(2)}, vWP.x - ${P.x.toFixed(2)}) * 3.82));
          glow += vec3(0.75, 0.5, 1.0) * band * (0.6 + 0.4 * sin(uBT * 1.4 + vWP.x * 0.4)) * 1.6;`});
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(P.r + 0.55, P.r + 0.7, H, 48, 1, true), stone); wall.position.set(P.x, lo - 0.4 + H / 2, P.z); wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(P.r + 0.1, P.r + 0.1, H, 48, 1, true), stone); inner.material.side = THREE.DoubleSide; inner.position.copy(wall.position); g.add(inner);
      const top = new THREE.Mesh(new THREE.RingGeometry(P.r + 0.1, P.r + 0.55, 48).rotateX(-Math.PI / 2), stone); top.position.set(P.x, lo - 0.4 + H, P.z); g.add(top);
      /* quatre bornes aux points cardinaux, leur sommet allumé */
      const post = new THREE.BoxGeometry(0.6, 1.3, 0.6); post.translate(0, 0.65, 0);
      inst(g, post, stone, [0, 1, 2, 3].map(i=>{ const a = i * Math.PI / 2 + 0.4; return {x:P.x + Math.cos(a) * (P.r + 0.35), y:lo - 0.4 + H - 0.1, z:P.z + Math.sin(a) * (P.r + 0.35), ry:a}; }));
      return;
    }
    /* la berge : un talus de terre (mousse dans la Sylve, roche sombre dans les Cavités) */
    const bank = glowMat({key:"bank-" + P.look, color:P.look === "cave" ? "#2e2836" : "#3a3a26", rough:0.95,
      tint:P.look === "cave" ? `diffuseColor.rgb *= 0.6 + 0.6 * bn(vWP.xz * 0.6 + vWP.y);` : `diffuseColor.rgb *= 0.6 + 0.6 * bn(vWP.xz * 0.9); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12, 0.22, 0.07), smoothstep(0.2, 0.6, bn(vWP.xz * 0.35)) * 0.8);`});
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(P.r + 0.35, P.r + 1.3, H, 40, 1, true), bank); wall.position.set(P.x, lo - 0.4 + H / 2, P.z); wall.receiveShadow = true; g.add(wall);
    const top = new THREE.Mesh(new THREE.RingGeometry(P.r - 0.05, P.r + 0.38, 40).rotateX(-Math.PI / 2), bank); top.position.set(P.x, y + 0.12, P.z); g.add(top);
    const rocks = [], n = 16;
    for(let i = 0; i < n; i++){ const a = i / n * 6.28 + (i % 3) * 0.12, rr = P.r + 0.45 + (i % 2) * 0.35, x = P.x + Math.cos(a) * rr, z = P.z + Math.sin(a) * rr;
      rocks.push({x, y:Math.max(heightAt(x, z), y - 0.1) - 0.15, z, s:0.38 + ((i * 37) % 10) / 10 * 0.45, ry:a * 3, c:new THREE.Color(P.look === "cave" ? "#4a4252" : "#5e6458")}); }
    const rm = glowMat({key:"pondrock-" + P.look, color:"#ffffff", rough:0.9, tint:P.look === "cave" ? `diffuseColor.rgb *= vIC;` : `diffuseColor.rgb *= vIC; vec3 wc = cross(dFdx(vWP), dFdy(vWP)); vec3 wn = wc / max(length(wc), 1e-6); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.24, 0.08), smoothstep(0.3, 0.8, abs(wn.y)) * 0.75);`});
    inst(g, rockGeo(P.look === "cave" ? 171 : 161, 1), rm, rocks, true);
    if(P.look === "cave"){
      const crys = glowMat({key:"pondcrystal", color:"#ffffff", rough:0.2, metal:0.1, flat:true, tint:`diffuseColor.rgb = mix(vec3(0.08), vIC * 0.5, 0.6);`,
        glow:`float band = 0.55 + 0.45 * sin(vOP.y * 5.0 - uBT * 1.4 + vWP.x * 0.3); glow += vIC * band * 1.3;`});
      const L = [];
      for(let i = 0; i < 7; i++){ const a = i / 7 * 6.28 + 0.5, rr = P.r + 0.9 + (i % 2) * 0.6, x = P.x + Math.cos(a) * rr, z = P.z + Math.sin(a) * rr, h = 1 + (i * 13 % 7) * 0.35;
        L.push({x, y:heightAt(x, z) - 0.3, z, sx:0.25 + h * 0.08, sy:h, sz:0.25 + h * 0.08, rx:Math.cos(a) * 0.35, rz:Math.sin(a) * 0.35, c:new THREE.Color(i % 2 ? "#47e9ff" : "#9b5cff")}); }
      inst(g, prismGeo(6, 0.5), crys, L, true);
    } else {
      /* la Sylve : des champignons qui luisent sur la berge, des nénuphars */
      const cap = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.45, 1); cap.translate(0, 1, 0);
      const shroom = glowMat({key:"pondshroom", color:"#cfe8e0", rough:0.6, glow:`glow += vIC * smoothstep(0.92, 1.05, vOP.y) * (1.1 + 0.4 * sin(uBT * 1.3 + vWP.x));`});
      const sm = []; for(let i = 0; i < 9; i++){ const a = i * 0.7 + 0.3, rr = P.r + 1.2 + (i % 3) * 0.4, x = P.x + Math.cos(a) * rr, z = P.z + Math.sin(a) * rr; sm.push({x, y:heightAt(x, z) - 0.05, z, s:0.15 + (i % 4) * 0.07, c:new THREE.Color(i % 3 ? "#38f0d0" : "#8f6bff")}); }
      inst(g, cap, shroom, sm, false);
      const pad = new THREE.CircleGeometry(1, 14, 0.25, Math.PI * 2 - 0.5); pad.rotateX(-Math.PI / 2);
      const pm = glowMat({key:"pondpad", color:"#ffffff", rough:0.5, side:THREE.DoubleSide, tint:`diffuseColor.rgb *= vIC;`});
      inst(g, pad, pm, [0, 1, 2, 3, 4].map(i=>{ const a = i * 1.3 + 0.2, rr = P.r * (0.45 + (i % 3) * 0.15); return {x:P.x + Math.cos(a) * rr, y:y + 0.01, z:P.z + Math.sin(a) * rr, s:0.3 + (i % 2) * 0.15, ry:a, c:new THREE.Color().setHSL(0.29, 0.45, 0.22)}; }), false);
    }
  }
  update(t, sky, scene){
    const S = sky.uniforms;
    for(const P of this.list){
      const U = P.surf.U;
      U.uTime.value = t; U.uSunDir.value.copy(S.uSunDir.value); U.uSun.value.copy(S.uSun.value);
      U.uZen.value.copy(S.uZen.value); U.uHor.value.copy(S.uHor.value); U.uNight.value = S.uNight.value;
      U.uFog.value.copy(scene.fog.color); U.uFogDensity.value = scene.fog.density;
    }
  }
}
