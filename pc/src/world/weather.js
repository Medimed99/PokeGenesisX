/* La météo du jeu mobile (elle tourne toutes les vingt minutes, la même pour les deux
   versions) prend corps : la pluie tombe et ternit le ciel, la surchauffe fait trembler l'air
   d'une lumière chaude, le gel saupoudre de flocons, la saturation teinte le monde de violet,
   la purge fait passer des éclats magenta. */
import * as THREE from "three";
import { damp } from "../util.js";

const N = 5000;
const vert = `
uniform float uTime, uKind, uSize; uniform vec3 uCam; attribute vec3 aSeed; varying float vA;
void main(){
  float box = 36.0;
  vec3 p = aSeed * box;
  float fall = uKind < 1.5 ? 11.0 : 1.2;
  p.y = mod(p.y - uTime * fall * (0.8 + aSeed.x * 0.4), box);
  p.x += sin(uTime * 0.7 + aSeed.z * 30.0) * (uKind < 1.5 ? 0.2 : 1.4);
  vec3 w = vec3(mod(p.x - uCam.x + box * 0.5, box) + uCam.x - box * 0.5, p.y + uCam.y - box * 0.4, mod(p.z - uCam.z + box * 0.5, box) + uCam.z - box * 0.5);
  vec4 mv = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (uKind < 1.5 ? 1.0 : 1.8) / max(1.0, -mv.z) * 60.0;
  vA = smoothstep(32.0, 6.0, -mv.z);
}`;
const frag = `uniform float uKind; uniform vec3 uCol; varying float vA;
void main(){ vec2 c = gl_PointCoord - 0.5;
  float a = uKind < 1.5 ? (1.0 - smoothstep(0.02, 0.09, abs(c.x))) * (1.0 - smoothstep(0.3, 0.5, abs(c.y))) : 1.0 - smoothstep(0.25, 0.5, length(c));
  gl_FragColor = vec4(uCol, a * vA * 0.55); }`;

export const WEATHER_LOOK = {
  clair:      {overcast:0,    tint:0,    tintCol:"#ffffff", wind:1.0, kind:0},
  pluie:      {overcast:0.85, tint:0.08, tintCol:"#9fc7ff", wind:1.9, kind:1},
  surchauffe: {overcast:0.05, tint:0.22, tintCol:"#ffcf9a", wind:0.5, kind:0},
  gel:        {overcast:0.45, tint:0.2,  tintCol:"#cfefff", wind:1.2, kind:2},
  saturation: {overcast:0.2,  tint:0.26, tintCol:"#d9b8ff", wind:0.8, kind:3},
  purge:      {overcast:0.3,  tint:0.18, tintCol:"#ffb8d6", wind:1.4, kind:4}
};

export class Weather {
  constructor(scene){
    this.key = "clair"; this.overcast = 0; this.tint = 0; this.tintCol = new THREE.Color("#fff"); this.wind = 1;
    const g = new THREE.BufferGeometry(), seeds = new Float32Array(N * 3);
    for(let i = 0; i < N * 3; i++) seeds[i] = Math.random();
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.uniforms = {uTime:{value:0}, uKind:{value:1}, uSize:{value:1.4}, uCam:{value:new THREE.Vector3()}, uCol:{value:new THREE.Color("#cfe6ff")}};
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:vert, fragmentShader:frag, transparent:true, depthWrite:false}));
    this.points.frustumCulled = false; this.points.visible = false;
    scene.add(this.points);
  }
  set(key){ this.key = WEATHER_LOOK[key] ? key : "clair"; }
  update(dt, t, cam){
    const L = WEATHER_LOOK[this.key];
    this.overcast = damp(this.overcast, L.overcast, 0.6, dt);
    this.tint = damp(this.tint, L.tint, 0.6, dt);
    this.tintCol.lerp(new THREE.Color(L.tintCol), 1 - Math.exp(-0.6 * dt));
    this.wind = damp(this.wind, L.wind, 0.5, dt);
    const show = L.kind === 1 || L.kind === 2 || L.kind === 3 || L.kind === 4;
    this.points.visible = show;
    if(show){
      const U = this.uniforms;
      U.uTime.value = t; U.uCam.value.copy(cam.position);
      U.uKind.value = L.kind === 1 ? 1 : 2;
      U.uCol.value.set(L.kind === 1 ? "#cfe6ff" : L.kind === 2 ? "#ffffff" : L.kind === 3 ? "#d6b3ff" : "#ff7ab0");
      U.uSize.value = L.kind === 1 ? 1.6 : L.kind === 2 ? 1.1 : 0.7;
      this.points.geometry.setDrawRange(0, L.kind === 1 ? N : L.kind === 2 ? 2600 : 900);
    }
  }
}
