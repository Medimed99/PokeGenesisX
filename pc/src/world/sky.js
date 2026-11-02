/* Le ciel et la lumière, réglés sur l'heure réelle du joueur : l'aube, midi, l'heure dorée,
   la nuit étoilée. Un dôme peint par shader (dégradé, soleil, nuages qui dérivent, étoiles),
   un soleil qui porte les ombres, et un éclairage d'ambiance tiré du ciel lui-même. */
import * as THREE from "three";
import { clamp, lerp, smooth } from "../util.js";

/* l'heure → les couleurs ; on interpole entre ces repères */
/* une archive sous un ciel couvert : la lumière est froide, la journée grise et basse, le soir malade,
   la nuit presque noire ; au nord, la faille de MissingNo fend le ciel */
const KEYS = [
  {h:0,    zen:"#020308", hor:"#0a0f16", sun:"#93a3c2", si:0.62, hemi:"#2a3b58", gnd:"#0c0f14", hi:1.05, fog:"#0a0f16", cloud:"#10151d", exp:1.55},
  {h:5.2,  zen:"#04070f", hor:"#141822", sun:"#93a3c2", si:0.6,  hemi:"#2a3852", gnd:"#0c0f14", hi:1.0,  fog:"#0e131a", cloud:"#181e28", exp:1.5},
  {h:6.4,  zen:"#1a2130", hor:"#5a4448", sun:"#c98a6e", si:1.15, hemi:"#525a68", gnd:"#26231f", hi:0.7,  fog:"#3e3a40", cloud:"#504a4e", exp:1.18},
  {h:8.5,  zen:"#1e2631", hor:"#59636a", sun:"#c7ccc8", si:2.0,  hemi:"#6c7682", gnd:"#2c3028", hi:1.0,  fog:"#48525a", cloud:"#646c72", exp:1.2},
  {h:13,   zen:"#202833", hor:"#5f696f", sun:"#d2d4cc", si:2.2,  hemi:"#717c88", gnd:"#2e3229", hi:1.05, fog:"#4c565d", cloud:"#6a7277", exp:1.2},
  {h:17.6, zen:"#1e2430", hor:"#635b54", sun:"#d0a67c", si:1.85, hemi:"#686e78", gnd:"#2e2c25", hi:0.98, fog:"#4c4946", cloud:"#67605b", exp:1.2},
  {h:19.3, zen:"#161827", hor:"#5a2a3a", sun:"#d8604e", si:1.2,  hemi:"#4a4460", gnd:"#211b1b", hi:0.7,  fog:"#352530", cloud:"#432c36", exp:1.2},
  {h:20.6, zen:"#090a16", hor:"#2a1828", sun:"#9a4460", si:0.5,  hemi:"#2c2c48", gnd:"#100e13", hi:0.58, fog:"#16101c", cloud:"#1e1622", exp:1.22},
  {h:22,   zen:"#03040a", hor:"#0b1018", sun:"#93a3c2", si:0.62, hemi:"#2a3b58", gnd:"#0c0f14", hi:1.05, fog:"#0b1017", cloud:"#10151d", exp:1.55},
  {h:24,   zen:"#020308", hor:"#0a0f16", sun:"#93a3c2", si:0.62, hemi:"#2a3b58", gnd:"#0c0f14", hi:1.05, fog:"#0a0f16", cloud:"#10151d", exp:1.55}
];
const C = s => new THREE.Color(s);
function keyAt(h){
  let a = KEYS[0], b = KEYS[1];
  for(let i = 0; i < KEYS.length - 1; i++) if(h >= KEYS[i].h && h <= KEYS[i + 1].h){ a = KEYS[i]; b = KEYS[i + 1]; break; }
  const t = (h - a.h) / ((b.h - a.h) || 1), out = {};
  for(const k of ["zen", "hor", "sun", "hemi", "gnd", "fog", "cloud"]) out[k] = C(a[k]).lerp(C(b[k]), t);
  for(const k of ["si", "hi", "exp"]) out[k] = lerp(a[k], b[k], t);
  return out;
}
/* le soleil : se lève à l'est (+x) vers 6 h, passe au sud (+z), se couche à l'ouest vers 20 h 30 */
export function sunDirection(h, out){
  const t = (h - 6.2) / 14.3;
  const a = Math.PI * clamp(t, -0.15, 1.15);
  const el = Math.sin(a) * 0.92 + (t < 0 || t > 1 ? -0.25 : 0);
  out.set(Math.cos(a), el, 0.55 + 0.25 * Math.sin(a)).normalize();
  return out;
}

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`;
const skyFrag = `
uniform vec3 uZen, uHor, uSun, uSunDir, uCloud, uGnd; uniform float uTime, uNight, uOvercast, uTint, uRift, uNameOn; uniform vec3 uTintCol, uRiftDir;
uniform sampler2D uName;
varying vec3 vDir;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
void main(){
  vec3 d = normalize(vDir);
  float up = clamp(d.y, -1.0, 1.0);
  /* dégradé : l'horizon s'épaissit, le zénith s'approfondit */
  vec3 col = mix(uHor, uZen, pow(clamp(up, 0.0, 1.0), 0.48));
  col = mix(col, uGnd * 0.6 + uHor * 0.4, smoothstep(0.0, -0.25, up));
  /* le soleil : un disque, un halo, une lueur d'horizon de son côté */
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  float day = 1.0 - uNight;
  /* derrière le plafond, le soleil n'est qu'une tache pâle */
  col += uSun * (pow(sd, 900.0) * 18.0 * day * (1.0 - uOvercast * 0.9) + pow(sd, 10.0) * 0.22 * day + pow(sd, 4.0) * 0.12 * (1.0 - up));
  /* la lune, la nuit, à l'opposé */
  float md = max(dot(d, normalize(-uSunDir + vec3(0.0, 0.6, 0.0))), 0.0);
  col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.9992, 0.9996, md) * 1.6 + pow(md, 60.0) * 0.12) * uNight;
  /* les étoiles */
  if(uNight > 0.01 && up > 0.0){
    vec2 sp = d.xz / (d.y + 0.25) * 140.0;
    float st = step(0.996, h21(floor(sp))) * (0.6 + 0.4 * sin(uTime * 2.0 + h21(floor(sp) + 3.1) * 40.0));
    col += vec3(st) * uNight * smoothstep(0.0, 0.3, up) * (1.0 - uOvercast);
  }
  /* les nuages : une couche qui dérive, éclairée du côté du soleil */
  if(up > 0.0){
    vec2 cp = d.xz / (d.y + 0.08) * 1.6 + vec2(uTime * 0.012, uTime * 0.004);
    float n = fbm(cp * 1.1);
    float cov = mix(0.56, 0.32, uOvercast);
    float cl = smoothstep(cov, cov + 0.22, n) * smoothstep(0.0, 0.18, up);
    float lit = 0.75 + 0.35 * pow(sd, 3.0);
    vec3 cc = mix(uCloud * lit, uCloud * 0.62, smoothstep(cov + 0.1, cov + 0.4, n) * 0.6);
    col = mix(col, cc, cl * 0.92);
  }
  /* la faille de MissingNo : une fêlure dans l'image, au nord. Un vide noir qui grésille,
     bordé de cyan d'un côté et de magenta de l'autre ; elle respire. Elle se referme à mesure
     que l'archive est restaurée (uRift). */
  if(uRift > 0.0){
    vec3 rd = normalize(uRiftDir);
    float az = atan(d.x, d.z) - atan(rd.x, rd.z);
    az = mod(az + 3.14159265, 6.2831853) - 3.14159265;
    float jag = (vn(vec2(up * 9.0, 1.7)) - 0.5) * 0.05 + (vn(vec2(up * 46.0, floor(uTime * 8.0))) - 0.5) * 0.004;
    float side = az + jag * (0.4 + up * 1.2);
    float breathe = 0.86 + 0.14 * sin(uTime * 0.55) + 0.04 * sin(uTime * 2.3);
    float w = (0.005 + 0.06 * pow(1.0 - smoothstep(0.0, 0.6, up), 1.8)) * breathe * (0.35 + 0.65 * uRift);
    float vert = smoothstep(-0.04, 0.02, up) * (1.0 - smoothstep(0.3, 0.68, up));
    float inside = (1.0 - smoothstep(w * 0.7, w, abs(side))) * vert;
    /* le vide : presque noir, avec des blocs de bruit qui passent */
    vec2 bq = floor(vec2(side * 900.0, up * 220.0));
    float bn = h21(bq + floor(uTime * 10.0)) * step(0.82, h21(bq * 0.37 + floor(uTime * 3.0)));
    col = mix(col, vec3(0.006, 0.005, 0.012) + vec3(bn * 0.09), inside);
    /* tout au fond, à peine visible : les lettres d'un nom, dans le désordre (le tien) */
    if(uNameOn > 0.0){
      vec2 nuv = vec2(clamp(side / max(w * 0.7, 1e-4) * 0.5 + 0.5, 0.0, 1.0), clamp((up + 0.01) / 0.2, 0.0, 1.0));
      float nm = texture2D(uName, nuv).a * inside * step(up, 0.19);
      col += vec3(0.62, 0.64, 0.74) * nm * 0.2 * uNameOn * (0.7 + 0.3 * sin(uTime * 1.7));
    }
    vec3 mg = vec3(1.0, 0.24, 0.5), cy = vec3(0.21, 0.94, 0.84);
    float flick = 0.85 + 0.15 * sin(uTime * 11.0) * sin(uTime * 5.3) - 0.45 * step(0.975, h21(vec2(floor(uTime * 9.0), 3.0)));
    float rimL = exp(-abs(side + w) * 300.0), rimR = exp(-abs(side - w) * 300.0);
    col += (cy * rimL + mg * rimR) * 1.5 * vert * flick * uRift;
    /* une lueur froide autour, et une lueur malade le long de l'horizon, de son côté */
    col += mix(cy, mg, step(0.0, side)) * exp(-max(0.0, abs(side) - w) * 22.0) * 0.16 * vert * uRift;
    col += vec3(0.32, 0.07, 0.22) * exp(-abs(az) * 1.6) * (1.0 - smoothstep(0.0, 0.2, abs(up))) * 0.24 * uRift;
  }
  col = mix(col, col * uTintCol, uTint);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export class Sky {
  constructor(scene, renderer){
    this.scene = scene; this.renderer = renderer;
    this.uniforms = {uZen:{value:C("#2c82e6")}, uHor:{value:C("#cdeeff")}, uSun:{value:C("#fff")}, uSunDir:{value:new THREE.Vector3(0, 1, 0)},
      uCloud:{value:C("#fff")}, uGnd:{value:C("#5f6f3c")}, uTime:{value:0}, uNight:{value:0}, uOvercast:{value:0}, uTint:{value:0}, uTintCol:{value:C("#fff")},
      uRift:{value:1}, uRiftDir:{value:new THREE.Vector3(-0.22, 0, -1).normalize()}, uName:{value:null}, uNameOn:{value:0}};
    /* le nom du joueur, empilé lettre à lettre, pour le fond de la faille */
    this.nameCv = document.createElement("canvas"); this.nameCv.width = 32; this.nameCv.height = 320;
    this.nameTex = new THREE.CanvasTexture(this.nameCv); this.nameTex.magFilter = this.nameTex.minFilter = THREE.NearestFilter; this.nameTex.generateMipmaps = false;
    this.uniforms.uName.value = this.nameTex; this.nameT = -99;
    const mat = new THREE.ShaderMaterial({uniforms:this.uniforms, vertexShader:skyVert, fragmentShader:skyFrag, side:THREE.BackSide, depthWrite:false, fog:false});
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
    this.dome.scale.setScalar(900); this.dome.frustumCulled = false; this.dome.renderOrder = -10;
    scene.add(this.dome);

    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.05;
    this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 260;
    scene.add(this.sun); scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xb4dcff, 0x5f6f3c, 0.5);
    scene.add(this.hemi);
    scene.fog = new THREE.FogExp2(0xd6efff, 0.0065);
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envScene = new THREE.Scene();
    this.envDome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat.clone());
    this.envDome.material.uniforms = this.uniforms;
    this.envDome.scale.setScalar(50);
    this.envScene.add(this.envDome);
    this.lastEnvH = -99; this.hour = 12; this.dir = new THREE.Vector3();
    this.overcast = 0; this.tint = 0; this.tintCol = C("#ffffff");
    this.state = null;
  }
  setShadowSize(px, extent){
    this.sun.shadow.mapSize.set(px, px);
    const cam = this.sun.shadow.camera; cam.left = -extent; cam.right = extent; cam.top = extent; cam.bottom = -extent; cam.updateProjectionMatrix();
    if(this.sun.shadow.map){ this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
  }
  /* les lettres se mélangent ; de loin en loin, une seule passe à sa vraie place */
  drawName(name){
    const g = this.nameCv.getContext("2d"), L = [...String(name).toUpperCase()].slice(0, 10);
    g.clearRect(0, 0, 32, 320);
    if(!L.length){ this.nameTex.needsUpdate = true; return; }
    const order = L.map((c, i)=>i).sort(()=>Math.random() - 0.5), keep = Math.floor(Math.random() * L.length);
    const idx = order.indexOf(keep); [order[idx], order[keep]] = [order[keep], order[idx]];
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "24px 'Press Start 2P', monospace";
    const cell = 320 / Math.max(L.length, 6);
    /* de bas en haut : la première lettre tout au fond */
    order.forEach((src, i)=>g.fillText(L[src], 16, 320 - cell * (i + 0.5)));
    this.nameTex.needsUpdate = true;
  }
  update(hour, t, focus){
    this.hour = hour;
    const S = window.PCG && window.PCG.S;
    const named = !!(S && S.flags && S.flags.named && S.name && S.name !== "ARCHIVISTE");
    this.uniforms.uNameOn.value = named ? 1 : 0;
    if(named && t - this.nameT > 1.4){ this.nameT = t; this.drawName(S.name); }
    const k = keyAt(((hour % 24) + 24) % 24);
    sunDirection(hour, this.dir);
    const night = smooth(0.08, -0.12, this.dir.y);
    const U = this.uniforms;
    /* temps couvert (pluie) : le ciel se ternit */
    /* toujours couvert : la météo du jeu ne fait qu'épaissir le plafond */
    const oc = Math.max(this.overcast, 0.5 + this.overcast * 0.5);
    U.uRift.value = this.rift === undefined ? 1 : this.rift;
    const grey = C("#55606a");
    U.uZen.value.copy(k.zen).lerp(grey.clone().multiplyScalar(0.55 + 0.45 * (1 - night)), oc * 0.75);
    U.uHor.value.copy(k.hor).lerp(grey, oc * 0.7);
    U.uSun.value.copy(k.sun); U.uCloud.value.copy(k.cloud).lerp(C("#6c747c").multiplyScalar(1 - night * 0.7), oc * 0.8);
    U.uGnd.value.copy(k.gnd); U.uSunDir.value.copy(this.dir); U.uTime.value = t; U.uNight.value = night; U.uOvercast.value = oc;
    U.uTint.value = this.tint; U.uTintCol.value.copy(this.tintCol);
    /* la lumière directe : le soleil, ou la lune la nuit */
    const ld = night > 0.5 ? new THREE.Vector3(-this.dir.x, Math.max(0.35, -this.dir.y + 0.4), -this.dir.z).normalize() : this.dir.clone().setY(Math.max(0.06, this.dir.y)).normalize();
    this.sun.color.copy(k.sun);
    this.sun.intensity = k.si * 0.85 * (1 - oc * 0.42);
    this.sun.position.copy(focus).addScaledVector(ld, 120);
    this.sun.target.position.copy(focus);
    this.hemi.color.copy(k.hemi); this.hemi.groundColor.copy(k.gnd); this.hemi.intensity = k.hi * 0.8 * (1 + oc * 0.5);
    this.scene.environmentIntensity = 0.62 + night * 0.2 + oc * 0.12;
    this.scene.fog.color.copy(k.fog).lerp(C("#57616a").multiplyScalar(1 - night * 0.75), oc * 0.7);
    this.scene.fog.density = 0.0078 + oc * 0.0045;
    this.state = {night, exp:k.exp, fog:this.scene.fog.color};
    /* l'éclairage d'ambiance suit le ciel : on le recalcule quand l'heure a assez changé */
    if(Math.abs(hour - this.lastEnvH) > 0.2 || this._ocEnv !== Math.round(oc * 10)){
      this.lastEnvH = hour; this._ocEnv = Math.round(oc * 10);
      const old = this.env;
      this.dome.visible = false;
      this.env = this.pmrem.fromScene(this.envScene, 0.04).texture;
      this.dome.visible = true;
      this.scene.environment = this.env;
      if(old) old.dispose();
    }
  }
}
