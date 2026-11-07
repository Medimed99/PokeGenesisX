/* Le lac : une surface peinte par shader. La couleur suit la profondeur (vert d'eau sur la
   rive, bleu profond au milieu), le ciel s'y reflète, le soleil y scintille, l'écume borde la
   rive. Les ombres des Pokémon et les ronds dans l'eau sont dessinés dans l'eau elle-même. */
import * as THREE from "three";
import { LAKE, WATER_Y, heightAt, lakeAt } from "./layout.js";

export const FISH_MAX = 4, RIPPLE_MAX = 8;

const vert = `
attribute float aDepth;
varying float vDepth; varying vec3 vWP; varying float vFogDepth;
void main(){
  vDepth = aDepth;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vFogDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const frag = `
uniform float uTime; uniform vec3 uSunDir, uSun, uZen, uHor, uFog; uniform float uFogDensity, uNight;
uniform vec4 uFish[${FISH_MAX}];      // x, z, angle, taille (0 = aucune)
uniform vec4 uFishK[${FISH_MAX}];     // chromatique, trésor, alpha, -
uniform vec4 uRip[${RIPPLE_MAX}];     // x, z, t0, force
uniform vec3 uShallow, uDeep, uShadowC, uRipC; uniform float uOverlay;
varying float vDepth; varying vec3 vWP; varying float vFogDepth;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float waves(vec2 p){
  float t = uTime;
  float h = vn(p * 0.55 + vec2(t * 0.18, t * 0.11)) * 0.5 + vn(p * 1.3 - vec2(t * 0.25, -t * 0.2)) * 0.3 + vn(p * 3.1 + vec2(t * 0.4, t * 0.33)) * 0.12;
  for(int i = 0; i < ${RIPPLE_MAX}; i++){
    vec4 r = uRip[i];
    float age = t - r.z;
    if(r.w <= 0.0 || age < 0.0 || age > 3.0) continue;
    float d = distance(p, r.xy);
    float ring = abs(d - age * 1.6);
    h += sin(d * 9.0 - age * 14.0) * exp(-ring * 3.0) * exp(-age * 1.3) * r.w * 0.35;
  }
  return h;
}
vec3 skyCol(vec3 d){
  float up = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uHor, uZen, pow(up, 0.5));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  return c + uSun * (pow(sd, 600.0) * 6.0 * (1.0 - uNight) + pow(sd, 12.0) * 0.2);
}
void main(){
  vec2 p = vWP.xz;
  float e = 0.08;
  float h0 = waves(p), hx = waves(p + vec2(e, 0.0)), hz = waves(p + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h0) / e * 0.35, 1.0, -(hz - h0) / e * 0.35));
  vec3 v = normalize(cameraPosition - vWP);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 refl = skyCol(reflect(-v, n));
  float dep = clamp(vDepth, 0.0, 6.0);
  /* une eau sombre et lourde, presque noire au fond */
  vec3 shallow = uShallow, deep = uDeep;
  vec3 body = mix(shallow, deep, smoothstep(0.0, 2.4, dep));
  /* les ombres sous la surface : la taille dit la rareté */
  float sh = 0.0, glint = 0.0;
  for(int i = 0; i < ${FISH_MAX}; i++){
    vec4 f = uFish[i]; vec4 k = uFishK[i];
    if(f.w <= 0.0) continue;
    vec2 q = p - f.xy + (n.xz * 0.15);
    float c = cos(f.z), s = sin(f.z);
    q = vec2(q.x * c + q.y * s, -q.x * s + q.y * c);
    float L = 0.55 * f.w;
    float body2 = length(vec2(q.x / L, q.y / (L * 0.42)));
    float tail = length(vec2((q.x + L * 1.15) / (L * 0.45), q.y / (L * 0.5 * (0.4 + abs(sin(uTime * 6.0 + f.x)) * 0.6))));
    float m = (1.0 - smoothstep(0.75, 1.05, body2)) + (1.0 - smoothstep(0.7, 1.0, tail)) * (1.0 - k.y);
    if(k.y > 0.5){ m = 1.0 - smoothstep(0.6, 1.0, length(q / (0.32 * f.w))); }
    sh = max(sh, clamp(m, 0.0, 1.0) * k.z);
    if(k.x > 0.5 || k.y > 0.5){ float tw = step(0.6, fract(uTime * 0.7 + f.x * 0.13)); glint = max(glint, (1.0 - smoothstep(0.0, 0.25 * f.w, length(q - vec2(L * 0.2, 0.0)))) * tw * k.z); }
  }
  /* posé sur une autre surface (une vasque, la lave) : seulement les ombres, les ronds, les reflets */
  if(uOverlay > 0.5){
    float rk = 0.0;
    for(int i = 0; i < ${RIPPLE_MAX}; i++){
      vec4 r = uRip[i]; float age = uTime - r.z;
      if(r.w <= 0.0 || age < 0.0 || age > 2.2) continue;
      rk = max(rk, (1.0 - smoothstep(0.0, 0.08, abs(distance(p, r.xy) - age * 1.6))) * (1.0 - age / 2.2) * r.w);
    }
    float edge = smoothstep(0.25, 0.55, sh) - smoothstep(0.6, 0.95, sh);
    vec3 oc = mix(uShadowC, uRipC, max(rk, edge * uOverlay * 0.5 - 0.25));
    float oa = max(sh * 0.78, rk * 0.7);
    oc += vec3(1.0, 0.86, 0.35) * glint * 1.6; oa = max(oa, glint);
    float fogO = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
    gl_FragColor = vec4(mix(oc, uFog, fogO), clamp(oa * smoothstep(0.0, 0.3, dep), 0.0, 1.0));
    #include <colorspace_fragment>
    return;
  }
  body = mix(body, body * 0.28, sh * 0.85);
  vec3 col = mix(body, refl, fres * 0.85);
  /* le scintillement du soleil sur les vaguelettes */
  vec3 hlf = normalize(normalize(uSunDir) + v);
  col += uSun * pow(max(dot(n, hlf), 0.0), 220.0) * 0.9 * (1.0 - uNight);
  /* l'écume sur la rive */
  float foam = (1.0 - smoothstep(0.0, 0.28, dep)) * (0.55 + 0.45 * vn(p * 4.0 + uTime * 0.6));
  col = mix(col, vec3(0.42, 0.45, 0.47), foam * 0.5);
  col += vec3(1.0, 0.86, 0.35) * glint * 1.6;
  /* les ronds dans l'eau, plus clairs */
  for(int i = 0; i < ${RIPPLE_MAX}; i++){
    vec4 r = uRip[i]; float age = uTime - r.z;
    if(r.w <= 0.0 || age < 0.0 || age > 2.2) continue;
    float d = distance(p, r.xy);
    col += vec3(0.5, 0.58, 0.62) * (1.0 - smoothstep(0.0, 0.07, abs(d - age * 1.6))) * (1.0 - age / 2.2) * 0.5 * r.w;
  }
  float alpha = smoothstep(0.0, 0.22, dep) * 0.92 + fres * 0.08;
  float fogF = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
  col = mix(col, uFog, fogF);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  #include <colorspace_fragment>
}`;

export const WATER_VERT = vert, WATER_FRAG = frag;
export class Lake {
  constructor(scene){
    this.y = WATER_Y;
    const W = LAKE.rx * 2.6, D = LAKE.rz * 2.6, step = 0.5;
    const nx = Math.round(W / step), nz = Math.round(D / step);
    const geo = new THREE.PlaneGeometry(W, D, nx, nz);
    geo.rotateX(-Math.PI / 2);
    geo.translate(LAKE.x, WATER_Y, LAKE.z);
    const p = geo.attributes.position, dep = new Float32Array(p.count);
    for(let i = 0; i < p.count; i++) dep[i] = WATER_Y - heightAt(p.getX(i), p.getZ(i));
    geo.setAttribute("aDepth", new THREE.BufferAttribute(dep, 1));
    /* on ne garde que les triangles utiles (là où il y a de l'eau) */
    const idx = geo.index.array, keep = [];
    for(let i = 0; i < idx.length; i += 3){
      if(dep[idx[i]] > -0.15 || dep[idx[i + 1]] > -0.15 || dep[idx[i + 2]] > -0.15) keep.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    geo.setIndex(keep);
    this.uniforms = {uTime:{value:0}, uSunDir:{value:new THREE.Vector3(0, 1, 0)}, uSun:{value:new THREE.Color()}, uZen:{value:new THREE.Color()},
      uHor:{value:new THREE.Color()}, uFog:{value:new THREE.Color()}, uFogDensity:{value:0.006}, uNight:{value:0},
      uFish:{value:Array.from({length:FISH_MAX}, ()=>new THREE.Vector4())}, uFishK:{value:Array.from({length:FISH_MAX}, ()=>new THREE.Vector4())},
      uRip:{value:Array.from({length:RIPPLE_MAX}, ()=>new THREE.Vector4())},
      uShallow:{value:new THREE.Vector3(0.06, 0.1, 0.095)}, uDeep:{value:new THREE.Vector3(0.008, 0.022, 0.03)}, uOverlay:{value:0},
      uShadowC:{value:new THREE.Vector3(0, 0, 0)}, uRipC:{value:new THREE.Vector3(0.5, 0.58, 0.62)}};
    this.material = new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:vert, fragmentShader:frag, transparent:true, depthWrite:false});
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
    this.ripN = 0;
  }
  ripple(x, z, t, force = 1){
    const r = this.uniforms.uRip.value[this.ripN++ % RIPPLE_MAX];
    r.set(x, z, t, force);
  }
  setFish(i, x, z, ang, size, shiny, treasure, alpha){
    const f = this.uniforms.uFish.value[i], k = this.uniforms.uFishK.value[i];
    if(!f) return;
    f.set(x, z, ang, size); k.set(shiny ? 1 : 0, treasure ? 1 : 0, alpha, 0);
  }
  clearFish(){ for(const f of this.uniforms.uFish.value) f.w = 0; }
  update(t, sky, scene){
    const U = this.uniforms, S = sky.uniforms;
    U.uTime.value = t;
    U.uSunDir.value.copy(S.uSunDir.value); U.uSun.value.copy(S.uSun.value);
    U.uZen.value.copy(S.uZen.value); U.uHor.value.copy(S.uHor.value);
    U.uNight.value = S.uNight.value;
    U.uFog.value.copy(scene.fog.color); U.uFogDensity.value = scene.fog.density;
  }
  /* un point du lac sous ce rayon de regard ? (pour viser un lancer) */
  hit(ray){
    if(Math.abs(ray.direction.y) < 1e-4) return null;
    const t = (WATER_Y - ray.origin.y) / ray.direction.y;
    if(t < 0 || t > 40) return null;
    const p = ray.origin.clone().addScaledVector(ray.direction, t);
    return lakeAt(p.x, p.z) > 0.55 && heightAt(p.x, p.z) < WATER_Y - 0.3 ? p : null;
  }
}
