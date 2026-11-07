/* ============================================================
   DES PARTICULES POUR LES CAPACITÉS DES SAUVAGES
   Des points dessinés par shader, chacun avec sa forme : une lueur
   douce, une étincelle, une bouffée de fumée, une feuille, une goutte,
   une langue de flamme, un anneau, un cœur, un éclat. Deux familles :
   celles qui s'ajoutent à la lumière (feu, foudre, énergie) et celles
   qui la cachent (fumée, poussière, eau, feuilles).
   ============================================================ */
import * as THREE from "three";

export const PK = {glow:0, spark:1, smoke:2, leaf:3, drop:4, flame:5, ring:6, heart:7, shard:8, bubble:9};

const vert = `
attribute vec4 aCol; attribute vec3 aData;
uniform float uPx;
varying vec4 vCol; varying float vKind; varying float vRot; varying float vFog;
uniform float uFogD;
void main(){
  vCol = aCol; vKind = aData.y; vRot = aData.z;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = min(220.0, aData.x * uPx / max(0.15, -mv.z));
  gl_Position = projectionMatrix * mv;
  float fd = -mv.z * uFogD; vFog = 1.0 - exp(-fd * fd);
}`;
const frag = `
uniform vec3 uFogC; uniform float uAdd;
varying vec4 vCol; varying float vKind; varying float vRot; varying float vFog;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; q.y = -q.y;
  float c = cos(vRot), s = sin(vRot); q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  float r = length(q), a = 0.0; int k = int(vKind + 0.5);
  vec3 col = vCol.rgb;
  if(k == 0){ a = smoothstep(1.0, 0.0, r); a *= a; }
  else if(k == 1){
    float arm = max(smoothstep(0.2, 0.0, abs(q.x)) * smoothstep(1.0, 0.0, abs(q.y)), smoothstep(0.2, 0.0, abs(q.y)) * smoothstep(1.0, 0.0, abs(q.x)));
    a = max(arm, smoothstep(0.45, 0.0, r)); col = mix(col, vec3(1.0), smoothstep(0.3, 0.0, r) * 0.7);
  }
  else if(k == 2){
    float n = h21(floor(q * 3.0 + vRot * 7.0)) * 0.25;
    a = smoothstep(1.0, 0.25, r + n) * 0.85;
  }
  else if(k == 3){
    vec2 l = vec2(q.x * 2.3, q.y);
    a = smoothstep(1.0, 0.8, length(l));
    col *= 0.75 + 0.25 * smoothstep(0.05, 0.25, abs(q.x)) + 0.15 * q.y;
  }
  else if(k == 4){
    vec2 d = vec2(q.x * (1.35 + q.y * 0.45), q.y);
    a = smoothstep(1.0, 0.75, length(d));
    col = mix(col, vec3(1.0), smoothstep(0.35, 0.0, length(q - vec2(-0.25, 0.25))) * 0.8);
  }
  else if(k == 5){
    /* une langue de flamme : une larme pointée vers le haut, le cœur plus clair */
    float w = 0.62 * (1.0 - q.y) * 0.5 + 0.08;
    float body = smoothstep(w, w * 0.4, abs(q.x)) * smoothstep(1.0, 0.7, q.y) * smoothstep(-1.0, -0.6, q.y);
    a = body; col = mix(col, vec3(1.0, 0.95, 0.75), smoothstep(0.5, 0.0, length(q + vec2(0.0, 0.35))) * 0.8);
  }
  else if(k == 6){ a = smoothstep(0.14, 0.0, abs(r - 0.78)); }
  else if(k == 7){
    vec2 h = vec2(q.x, q.y - 0.15) * 1.25;
    float hh = pow(h.x * h.x + h.y * h.y - 0.35, 3.0) - h.x * h.x * h.y * h.y * h.y;
    a = smoothstep(0.02, -0.04, hh);
  }
  else if(k == 8){ a = smoothstep(1.0, 0.85, abs(q.x) * 1.8 + abs(q.y)); col *= 0.8 + 0.4 * step(0.0, q.x); }
  else if(k == 9){ a = smoothstep(0.16, 0.0, abs(r - 0.8)) + smoothstep(0.3, 0.0, length(q - vec2(-0.3, 0.35))) * 0.8; a *= step(r, 1.0); }
  a *= vCol.a;
  if(a < 0.01) discard;
  if(uAdd > 0.5) gl_FragColor = vec4(col * a * (1.0 - vFog), 1.0);
  else gl_FragColor = vec4(mix(col, uFogC, vFog), a);
}`;

const TC = new THREE.Color();
export class Particles {
  constructor(scene, {max = 1400, additive = true, order = 9} = {}){
    this.max = max; this.p = []; this.additive = additive;
    const g = new THREE.BufferGeometry();
    this.aPos = new Float32Array(max * 3); this.aCol = new Float32Array(max * 4); this.aData = new Float32Array(max * 3);
    g.setAttribute("position", new THREE.BufferAttribute(this.aPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aCol", new THREE.BufferAttribute(this.aCol, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aData", new THREE.BufferAttribute(this.aData, 3).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    this.uniforms = {uPx:{value:600}, uFogD:{value:0}, uFogC:{value:new THREE.Color()}, uAdd:{value:additive ? 1 : 0}};
    const m = new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:vert, fragmentShader:frag, transparent:true, depthWrite:false,
      blending:additive ? THREE.AdditiveBlending : THREE.NormalBlending});
    /* (en additif, on garde l'alpha à 1 : la couleur porte déjà l'intensité) */
    if(additive){ m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor; }
    this.points = new THREE.Points(g, m); this.points.frustumCulled = false; this.points.renderOrder = order;
    scene.add(this.points);
  }
  /* une particule : position, vitesse, durée, taille (début → fin), couleur (début → fin), alpha, forme */
  emit(o){
    if(this.p.length >= this.max) this.p.shift();
    const c0 = TC.set(o.c || "#ffffff"), q = {x:o.x, y:o.y, z:o.z, vx:o.vx || 0, vy:o.vy || 0, vz:o.vz || 0, t:-(o.delay || 0), life:o.life || 1,
      s0:o.s0 !== undefined ? o.s0 : (o.s || 0.2), s1:o.s1 !== undefined ? o.s1 : (o.s || 0.2), r0:c0.r, g0:c0.g, b0:c0.b, a:o.a !== undefined ? o.a : 1,
      kind:o.k || 0, rot:o.rot !== undefined ? o.rot : Math.random() * 6.28, spin:o.spin || 0, drag:o.drag || 0, grav:o.grav || 0, fin:o.fin !== undefined ? o.fin : 0.12,
      floor:o.floor, bounce:o.bounce || 0, pow:o.pow || 1};
    if(o.c1){ TC.set(o.c1); q.r1 = TC.r; q.g1 = TC.g; q.b1 = TC.b; } else { q.r1 = q.r0; q.g1 = q.g0; q.b1 = q.b0; }
    this.p.push(q);
    return q;
  }
  /* une gerbe autour d'un point */
  burst(at, n, o = {}){
    for(let i = 0; i < n; i++){
      const a = Math.random() * Math.PI * 2, el = (o.cone !== undefined ? o.cone : 1) * (Math.random() - 0.3) * Math.PI * 0.5, sp = (o.spd || 2) * (0.35 + Math.random() * 0.8);
      const dir = o.dir;
      let vx = Math.cos(a) * Math.cos(el) * sp, vy = Math.sin(el) * sp * (o.up !== undefined ? o.up : 1) + (o.lift || 0), vz = Math.sin(a) * Math.cos(el) * sp;
      if(dir){ vx = vx * (o.spread || 0.35) + dir.x * sp; vy = vy * (o.spread || 0.35) + dir.y * sp; vz = vz * (o.spread || 0.35) + dir.z * sp; }
      const cols = o.cols || [o.c || "#ffffff"];
      this.emit(Object.assign({}, o, {x:at.x + (Math.random() - 0.5) * (o.jit || 0), y:at.y + (Math.random() - 0.5) * (o.jit || 0) * 0.5, z:at.z + (Math.random() - 0.5) * (o.jit || 0),
        vx, vy, vz, c:cols[i % cols.length], life:(o.life || 0.8) * (0.6 + Math.random() * 0.7), delay:(o.delay || 0) + Math.random() * (o.stagger || 0),
        s0:(o.s0 !== undefined ? o.s0 : o.s || 0.2) * (0.7 + Math.random() * 0.6), s1:(o.s1 !== undefined ? o.s1 : o.s || 0.2) * (0.7 + Math.random() * 0.6)}));
    }
  }
  update(dt, cam, fog){
    if(cam){ this.uniforms.uPx.value = innerHeight * 0.5 * cam.projectionMatrix.elements[5] * Math.min(2, devicePixelRatio || 1); }
    if(fog){ this.uniforms.uFogD.value = fog.density || 0; this.uniforms.uFogC.value.copy(fog.color); }
    let n = 0; const P = this.aPos, C = this.aCol, D = this.aData;
    for(let i = this.p.length - 1; i >= 0; i--){
      const q = this.p[i]; q.t += dt;
      if(q.t >= q.life){ this.p.splice(i, 1); continue; }
    }
    for(const q of this.p){
      if(q.t < 0) continue;
      const dr = Math.max(0, 1 - q.drag * dt);
      q.vx *= dr; q.vy = q.vy * dr - q.grav * dt; q.vz *= dr;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rot += q.spin * dt;
      if(q.floor !== undefined && q.y < q.floor){ q.y = q.floor; q.vy = -q.vy * q.bounce; q.vx *= 0.6; q.vz *= 0.6; q.spin *= 0.5; }
      if(n >= this.max) continue;
      const k = q.t / q.life, fi = q.fin > 0 ? Math.min(1, k / q.fin) : 1, fo = Math.pow(1 - k, q.pow);
      P[n * 3] = q.x; P[n * 3 + 1] = q.y; P[n * 3 + 2] = q.z;
      C[n * 4] = q.r0 + (q.r1 - q.r0) * k; C[n * 4 + 1] = q.g0 + (q.g1 - q.g0) * k; C[n * 4 + 2] = q.b0 + (q.b1 - q.b0) * k; C[n * 4 + 3] = q.a * fi * fo;
      D[n * 3] = q.s0 + (q.s1 - q.s0) * k; D[n * 3 + 1] = q.kind; D[n * 3 + 2] = q.rot;
      n++;
    }
    const g = this.points.geometry;
    g.setDrawRange(0, n);
    if(n){ g.attributes.position.needsUpdate = true; g.attributes.aCol.needsUpdate = true; g.attributes.aData.needsUpdate = true; }
  }
  clear(){ this.p.length = 0; }
}
