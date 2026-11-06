/* ============================================================
   LA SPLENDEUR D'UN CHROMATIQUE
   Un chromatique dans le monde ne se contente plus de scintiller :
     · son corps rayonne : un liseré d'or irisé sur sa silhouette, et
       un éclat qui le parcourt de bas en haut (model3d.js, uShine) ;
     · une aura l'enveloppe, qui respire ;
     · le sol s'illumine sous lui : un halo d'or, une étoile à huit
       branches qui tourne lentement, et une vraie lueur sur l'herbe
       et la terre alentour (les lueurs des biomes) ;
     · des étoiles à quatre branches tournent autour de lui et
       s'allument tour à tour ; des paillettes d'or montent ;
     · une colonne de lumière, haute et pâle, le signale de loin ;
     · quand on le découvre : l'éclat des jeux d'origine, une gerbe
       d'étoiles, une onde au sol, un éclair, le son du chromatique.
   Caché dans les hautes herbes, il ne laisse paraître que la colonne
   et des paillettes qui montent d'entre les tiges.
   ============================================================ */
import * as THREE from "three";
import { swarm } from "../world/biomes/kit.js";
import { normalAt } from "../world/layout.js";
const UPV = new THREE.Vector3(0, 1, 0), NV = new THREE.Vector3(), QA = new THREE.Quaternion(), QS = new THREE.Quaternion();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();
let TX = null;
function canvasTex(size, draw){ const c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function textures(){
  if(TX) return TX;
  /* une étoile à quatre branches, longues et fines, et quatre plus courtes en biais */
  const star = canvasTex(128, (x, S)=>{
    const c = S / 2;
    const g = x.createRadialGradient(c, c, 0, c, c, c * 0.42); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,240,200,.75)"); g.addColorStop(1, "rgba(255,210,120,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    const spike = (a, len, w) => { x.save(); x.translate(c, c); x.rotate(a);
      const gr = x.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,236,180,.6)"); gr.addColorStop(1, "rgba(255,210,120,0)");
      x.fillStyle = gr; x.beginPath(); x.moveTo(0, -w); x.lineTo(len, 0); x.lineTo(0, w); x.closePath(); x.fill(); x.restore(); };
    for(let i = 0; i < 4; i++) spike(i * Math.PI / 2, c * 0.98, 4.5);
    for(let i = 0; i < 4; i++) spike(Math.PI / 4 + i * Math.PI / 2, c * 0.45, 2.6);
  });
  /* une lueur douce */
  const glow = canvasTex(128, (x, S)=>{
    const c = S / 2, g = x.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, "rgba(255,248,220,1)"); g.addColorStop(0.22, "rgba(255,226,150,.55)"); g.addColorStop(0.55, "rgba(255,196,110,.16)"); g.addColorStop(1, "rgba(255,180,90,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  });
  /* le halo au sol : une lueur, un cercle fin, une étoile à huit branches, des points */
  const halo = canvasTex(256, (x, S)=>{
    const c = S / 2;
    let g = x.createRadialGradient(c, c, 0, c, c, c); g.addColorStop(0, "rgba(255,236,170,.75)"); g.addColorStop(0.35, "rgba(255,210,120,.28)"); g.addColorStop(0.8, "rgba(255,190,100,.06)"); g.addColorStop(1, "rgba(255,190,100,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.strokeStyle = "rgba(255,236,180,.9)"; x.lineWidth = 2.2; x.beginPath(); x.arc(c, c, c * 0.78, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 1.2; x.strokeStyle = "rgba(255,236,180,.55)"; x.beginPath(); x.arc(c, c, c * 0.7, 0, Math.PI * 2); x.stroke();
    x.save(); x.translate(c, c); x.fillStyle = "rgba(255,240,200,.55)";
    for(let i = 0; i < 8; i++){ x.rotate(Math.PI / 4); x.beginPath(); x.moveTo(0, -c * 0.66); x.lineTo(c * 0.05, -c * 0.12); x.lineTo(-c * 0.05, -c * 0.12); x.closePath(); x.fill(); }
    x.restore();
    x.fillStyle = "rgba(255,246,210,.95)";
    for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; x.beginPath(); x.arc(c + Math.cos(a) * c * 0.78, c + Math.sin(a) * c * 0.78, i % 2 ? 1.6 : 3, 0, Math.PI * 2); x.fill(); }
  });
  /* l'onde au sol de la découverte */
  const ring = canvasTex(256, (x, S)=>{
    const c = S / 2, g = x.createRadialGradient(c, c, c * 0.72, c, c, c * 0.98);
    g.addColorStop(0, "rgba(255,240,200,0)"); g.addColorStop(0.55, "rgba(255,244,214,.95)"); g.addColorStop(1, "rgba(255,210,120,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  });
  return (TX = {star, glow, halo, ring});
}
const addMat = (map, o = 1) => ({map, transparent:true, opacity:o, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, fog:false});

/* la colonne : pâle, haute, qui scintille ; plus franche de loin (on la voit de l'autre bout de la zone) */
const COL_VS = `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const COL_FS = `uniform float uT, uA; varying vec2 vUv; varying vec3 vWP;
void main(){
  float y = vUv.y;
  float fade = pow(1.0 - y, 1.6) * smoothstep(0.0, 0.05, y);
  float streak = 0.6 + 0.4 * sin(vUv.x * 37.7 + uT * 1.7) * sin(vUv.x * 12.6 - uT * 0.9 + y * 6.0);
  float run = smoothstep(0.86, 1.0, sin(y * 9.0 - uT * 3.2));
  float far = smoothstep(4.0, 22.0, distance(cameraPosition.xz, vWP.xz));
  float a = uA * fade * (streak * (0.06 + 0.94 * far) + run * 0.3 * (0.2 + 0.8 * far));
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.52) * a, 1.0);
}`;

export class ShinyAura {
  constructor(scene, lights){
    const T = textures();
    this.scene = scene; this.lights = lights;
    this.g = new THREE.Group(); this.g.renderOrder = 7; scene.add(this.g);
    this.k = 0; this.kh = 0; this.flareT = -1; this.H = 1; this.W = 1;
    /* l'aura qui l'enveloppe */
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial(addMat(T.glow, 0.5))); this.aura.renderOrder = 7; this.g.add(this.aura);
    /* le halo au sol, qui tourne lentement */
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(Object.assign(addMat(T.halo, 0.85), {polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2})));
    this.halo.renderOrder = 2; this.g.add(this.halo);
    /* la colonne de lumière */
    this.colU = {uT:{value:0}, uA:{value:0}};
    this.col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).translate(0, 0.5, 0),
      new THREE.ShaderMaterial({uniforms:this.colU, vertexShader:COL_VS, fragmentShader:COL_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false}));
    this.col.renderOrder = 6; this.col.frustumCulled = false; this.g.add(this.col);
    /* les étoiles qui tournent autour, et s'allument tour à tour */
    this.glints = Array.from({length:5}, (_, i)=>{ const s = new THREE.Sprite(new THREE.SpriteMaterial(addMat(T.star, 1))); s.renderOrder = 8; this.g.add(s);
      return {s, a:i / 5 * Math.PI * 2, y:0.25 + (i * 0.37) % 0.75, sp:0.5 + (i % 3) * 0.18, ph:i * 1.7, f:1.6 + (i % 2) * 0.7}; });
    /* des paillettes d'or qui montent (le mouvement est dans le shader) */
    this.motesU = swarm(this.g, Array.from({length:46}, (_, i)=>{ const a = i * 2.39996, r = 0.25 + (i % 7) / 7 * 0.85; return {x:Math.cos(a) * r, y:0, z:Math.sin(a) * r}; }),
      {kind:1, size:0.075, rise:2.6, c1:"#ffe7a3", c2:"#ffffff", fade:1e5, seed:31});
    /* la découverte : une gerbe d'étoiles, un éclair, une onde au sol */
    this.burst = Array.from({length:10}, (_, i)=>{ const s = new THREE.Sprite(new THREE.SpriteMaterial(addMat(T.star, 0))); s.renderOrder = 9; s.visible = false; this.g.add(s); return {s, a:i / 10 * Math.PI * 2 + (i % 2) * 0.2, up:0.2 + (i % 3) * 0.35}; });
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial(addMat(T.glow, 0))); this.flash.renderOrder = 9; this.flash.visible = false; this.g.add(this.flash);
    this.wave = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(Object.assign(addMat(T.ring, 0), {polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3})));
    this.wave.visible = false; this.wave.renderOrder = 3; this.g.add(this.wave);
    /* une vraie lueur au sol : l'herbe et la terre alentour la reçoivent */
    this.light = {p:new THREE.Vector3(0, -999, 0), r:6, c:new THREE.Color("#ffcf6a"), k:"shiny", base:0};
    if(lights) lights.push(this.light);
  }
  /* la découverte : l'éclat, le son */
  flare(t){
    this.flareT = t;
    try { window.Sfx && window.Sfx.shiny && window.Sfx.shiny(); } catch(e){}
  }
  /* mode : "full" (en vue), "hidden" (dans les hautes herbes), "off" (dans une Ball, capturé, parti) */
  update(t, dt, pos, H, W, mode, ground){
    const calm = calmFx(), T = textures();
    this.H = Math.max(0.4, H || 1); this.W = Math.max(0.35, W || this.H * 0.8);
    const want = mode === "full" ? 1 : 0, wantH = mode === "hidden" ? 1 : mode === "full" ? 1 : 0;
    this.k += (want - this.k) * Math.min(1, dt * (want ? 2.5 : 4));
    this.kh += (wantH - this.kh) * Math.min(1, dt * (wantH ? 2 : 4));
    const k = this.k, kh = this.kh, h = this.H, w = this.W;
    this.g.position.set(pos.x, ground !== undefined ? ground : pos.y, pos.z);
    this.g.visible = kh > 0.01;
    if(!this.g.visible){ this.light.base = 0; this.light.p.set(1e5, -999, 1e5); return; }
    const lift = pos.y - this.g.position.y;
    const breathe = calm ? 0.85 : 0.82 + 0.18 * Math.sin(t * 2.1);
    /* l'aura */
    this.aura.position.set(0, lift + h * 0.5, 0); this.aura.scale.setScalar(Math.max(h, w) * 2.4 * (0.94 + 0.06 * breathe));
    this.aura.material.opacity = 0.3 * k * breathe;
    /* le halo */
    this.halo.scale.setScalar(Math.max(1.4, w * 2.0) * (1 + 0.04 * Math.sin(t * 1.6)));
    /* (posé sur la pente : le halo suit le sol) */
    const n = normalAt(pos.x, pos.z); NV.set(n[0], n[1], n[2]).normalize(); QA.setFromUnitVectors(UPV, NV);
    this.halo.quaternion.copy(QA).multiply(QS.setFromAxisAngle(UPV, calm ? 0 : t * 0.35)); this.halo.position.y = 0.05;
    this.halo.material.opacity = 0.55 * k;
    /* la colonne : là même caché (on devine où il est) */
    this.col.scale.set(Math.max(0.3, w * 0.3), Math.max(7, h * 5), Math.max(0.3, w * 0.3));
    this.colU.uT.value = t; this.colU.uA.value = 0.45 * (0.4 * kh + 0.6 * k);
    /* les étoiles */
    for(const G of this.glints){
      const a = G.a + t * G.sp * (calm ? 0.3 : 1), r = w * 0.62 + h * 0.12;
      G.s.position.set(Math.cos(a) * r, lift + h * G.y, Math.sin(a) * r);
      const tw = calm ? 0.5 : Math.pow(Math.max(0, Math.sin(t * G.f + G.ph)), 6);
      G.s.scale.setScalar((0.2 + 0.55 * tw) * Math.max(0.6, h * 0.55) * k);
      G.s.material.rotation = t * 0.8 + G.ph; G.s.material.opacity = (0.35 + 0.65 * tw) * k;
    }
    /* les paillettes */
    this.motesU.uSize.value = 0.06 + 0.03 * Math.min(2, h); this.motesU.uRise.value = Math.max(1.6, h * 1.6);
    /* la lueur au sol */
    this.light.p.set(pos.x, this.g.position.y + Math.max(0.8, h * 0.5), pos.z); this.light.r = Math.max(3.5, w * 2.5 + 2);
    this.light.base = (0.15 * kh + 0.45 * k) * breathe;
    /* la découverte */
    const fk = this.flareT >= 0 ? (t - this.flareT) / 1.25 : 2;
    const on = fk >= 0 && fk < 1;
    this.flash.visible = this.wave.visible = on; for(const B of this.burst) B.s.visible = on;
    if(on){
      const e = 1 - Math.pow(1 - fk, 3);
      this.flash.position.set(0, lift + h * 0.55, 0); this.flash.scale.setScalar(Math.max(h, w) * (1.2 + 3 * e)); this.flash.material.opacity = (calm ? 0.35 : 1) * Math.pow(1 - fk, 2) * 0.7;
      this.wave.scale.setScalar(w * 1.5 + e * Math.max(6, h * 5)); this.wave.position.y = 0.06; this.wave.quaternion.copy(QA); this.wave.material.opacity = (1 - fk) * 0.9;
      for(const B of this.burst){
        const d = e * (w * 0.8 + h * 1.1);
        B.s.position.set(Math.cos(B.a) * d, lift + h * (0.5 + B.up * e), Math.sin(B.a) * d);
        const sc = Math.sin(Math.PI * Math.min(1, fk * 1.15)) * Math.max(0.7, h * 0.7);
        B.s.scale.setScalar(sc); B.s.material.opacity = 1 - fk * 0.8; B.s.material.rotation = fk * 3 + B.a;
      }
    }
  }
  dispose(){
    this.scene.remove(this.g);
    this.g.traverse(o=>{ if(o.material){ o.material.dispose(); } if(o.geometry && o.geometry !== undefined && !o.isSprite) o.geometry.dispose(); });
    if(this.lights){ const i = this.lights.indexOf(this.light); if(i >= 0) this.lights.splice(i, 1); }
  }
}
