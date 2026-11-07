/* ============================================================
   LES MODULES DANS LE MONDE
   Chaque module a son lieu dans la zone de capture, et on y entre à
   pied (E) au lieu de passer par le terminal :
     · la Tour de l'archive (nord-est) : sept étages de pierre noire, des
       meurtrières qui s'allument, un rayon qui monte jusqu'à l'arène ;
       à son pied, la porte des verrous (les Data Guardians) ;
     · la Brèche (ouest) : une déchirure debout dans l'air, de la terre
       arrachée qui tourne autour ; fermée, ce n'est qu'une cicatrice ;
     · l'Expédition (sud, près de Bourg Palette) : un camp, ses tentes,
       son feu, ses guirlandes, un portique aux fanions dorés ;
     · le Forage (sud-est) : une galerie dans un tertre, son chevalement
       et sa roue, ses rails, son wagonnet de minerai ;
     · le raid (ouest, avant Jadielle) : un phare où se tient le boss
       de la semaine, au bord d'une arène cerclée de pierres levées ;
       E y lance l'attaque, et le combat se joue là (raid3d.js) ;
     · le Poké-Poker (est) : un pavillon, une table, des cartes qui
       flottent.
   Chaque lieu a son parvis pavé et son cercle de lumière, qui s'éveille
   quand on est à portée ; sa lueur colore le sol autour (la nuit
   surtout). Un module fermé reste visible, éteint, et dit ce qu'il
   demande (le jeu mobile décide : MODULE_REQ). E ouvre le terminal sur
   son écran.
   ============================================================ */
import * as THREE from "three";
import { heightAt, SITES } from "./layout.js";
import { BT, rockGeo, glowMat, inst, swarm, shafts, labelSprite, prismGeo } from "./biomes/kit.js";
import { makeMon } from "../mon/model3d.js";
export { SITES };

const G = () => window.PCG;
const S = k => SITES.find(s=>s.k === k);
/* le phare du raid, à l'ouest de son parvis (le reste est l'arène) */
export const RAID_OX = -7;
const C = c => new THREE.Color(c);
const GREY = new THREE.Color("#7a8296");
/* le halo d'une lanterne : un dégradé rond, dessiné une fois */
let _halo = null;
function haloTex(){
  if(_halo) return _halo;
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d");
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_halo = new THREE.CanvasTexture(cv));
}
/* l'accord : la Tour fermée, les verrous fermés, le Forage fermé */
const shut = s => s.k === "boss" ? "fermés" : ["tower", "breche", "expe"].includes(s.k) ? "fermée" : "fermé";

/* le cercle du parvis : un trait, des tirets qui tournent, un losange au centre, une onde quand on est à portée */
const SIG_VS = `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SIG_FS = `uniform vec3 uC; uniform float uA, uN, uBT, uW; varying vec2 vP;
void main(){
  float r = length(vP), a = atan(vP.y, vP.x);
  float w = uW;
  float line = smoothstep(w, 0.0, abs(r - 0.955));
  float dash = smoothstep(w, 0.0, abs(r - 0.865)) * step(0.45, fract(a * 1.9099 + uBT * 0.12));
  float tick = step(0.9, r) * step(r, 0.935) * smoothstep(0.04, 0.0, abs(fract(a * 3.8197) - 0.5) - 0.44);
  float dia = abs(vP.x) + abs(vP.y);
  float med = smoothstep(w, 0.0, abs(dia - 0.15)) + smoothstep(w, 0.0, abs(dia - 0.1)) * 0.5;
  float wave = smoothstep(0.05, 0.0, abs(r - fract(uBT * 0.45) * 0.95)) * uN * (1.0 - r);
  float k = (line + dash * 0.6 + tick * 0.5 + med * 0.8) * (0.55 + 0.45 * uN) + wave * 0.9;
  k *= uA;
  if(k < 0.004) discard;
  gl_FragColor = vec4(uC * k, 1.0);
}`;

export class Sites {
  constructor(scene, colliders, lights){
    this.scene = scene; this.colliders = colliders; this.lights = lights || [];
    this.root = new THREE.Group(); this.root.name = "sites"; scene.add(this.root);
    this.anim = []; this.labels = {}; this.near = null; this.lock = {}; this.U = {}; this.open = {};
    this.siteList = SITES;
    for(const s of SITES){ s.y = heightAt(s.x, s.z); s.ix = undefined; s.iz = undefined; }
    this.shared();
    for(const s of SITES) this.plaza(s);
    this.tower(); this.verrous(); this.breche(); this.expe(); this.forage(); this.raid(); this.poker();
    for(const s of SITES){
      const L = labelSprite(1024, 200); L.sp.scale.set(8.5, 1.66, 1); L.sp.position.set(s.x + (s.lx || 0), s.y + (s.labelY || 5.2), s.z); this.root.add(L.sp);
      this.labels[s.k] = {L, txt:""};
    }
  }
  col(x, z, r){ this.colliders.push({x, z, r}); }
  /* une lueur posée au sol (pas une vraie lumière : le sol et les décors la calculent eux-mêmes) */
  glow(s, x, y, z, r, c, base){ const l = {p:new THREE.Vector3(x, y, z), r, c:C(c), k:"site", base, b0:base, site:s.k}; this.lights.push(l); return l; }
  /* une poutre, un câble : un cylindre d'un point à un autre */
  beam(a, b, r, mat){
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 5), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return m;
  }
  /* le monde local d'un lieu : son centre, tourné (rot : son devant regarde +z local) */
  grp(s, rot = 0, dy = 0){ const g = new THREE.Group(); g.position.set(s.x, s.y + dy, s.z); g.rotation.y = rot; this.root.add(g); return g; }
  at(s, rot, lx, lz){ const c = Math.cos(rot), n = Math.sin(rot); return [s.x + lx * c + lz * n, s.z - lx * n + lz * c]; }

  shared(){
    this.M = {
      pave:glowMat({key:"sitepave", color:"#8d8a86", rough:0.92, tint:`
        float r = length(vOP.xz), a = atan(vOP.z, vOP.x);
        float band = floor(r * 6.0), rr = fract(r * 6.0);
        float sa = a / 6.28318 * (6.0 + band * 7.0) + band * 0.37, ss = fract(sa);
        float grout = max(smoothstep(0.9, 0.97, rr), smoothstep(0.9, 0.98, abs(ss - 0.5) * 2.0)) * step(0.17, r);
        float st = 0.8 + 0.32 * bh(vec2(band, floor(sa))) + 0.12 * bn(vWP.xz * 1.6);
        diffuseColor.rgb *= mix(st, 0.4, grout) * mix(0.82, 1.0, smoothstep(0.17, 0.2, r));`}),
      curb:glowMat({key:"sitecurb", color:"#5d5a58", rough:0.9, flat:true}),
      wood:glowMat({key:"wood", color:"#6a4a30", rough:0.9, tint:`diffuseColor.rgb *= 0.75 + 0.4 * bn(vec2(vWP.y * 3.0, vWP.x * 0.6 + vWP.z * 0.6));`}),
      warm:new THREE.MeshBasicMaterial({color:"#ffcf7a"}),
      halo:new THREE.SpriteMaterial({map:haloTex(), color:"#ffb347", transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false, fog:false})
    };
    this.discGeo = new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2);
    const band = new THREE.CylinderGeometry(1.0, 1.02, 0.2, 72, 1, true); band.translate(0, 0.02, 0);
    this.curbGeo = band;
  }
  /* ---------- le parvis : des pavés en couronnes, un rebord, le cercle de lumière ---------- */
  plaza(s){
    const R = s.pr, g = this.grp(s, 0, 0.05);
    const d = new THREE.Mesh(this.discGeo, this.M.pave); d.scale.set(R, 1, R); d.receiveShadow = true; g.add(d);
    const c = new THREE.Mesh(this.curbGeo, this.M.curb); c.scale.set(R, 1, R); c.receiveShadow = true; g.add(c);
    const U = {uC:{value:C(s.col)}, uA:{value:0.8}, uN:{value:0}, uBT:BT.uTime, uW:{value:Math.min(0.03, 0.14 / R)}};
    const m = new THREE.Mesh(this.discGeo, new THREE.ShaderMaterial({uniforms:U, vertexShader:SIG_VS, fragmentShader:SIG_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false,
      polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2}));
    m.scale.set(R, 1, R); m.position.y = 0.02; m.renderOrder = 3; g.add(m);
    s.sig = U; s.col0 = C(s.col);
    s.light = this.glow(s, s.x, s.y + 2.2, s.z, R + 7, s.col, 0.9);
  }

  /* ---------- la Tour de l'archive ---------- */
  tower(){
    const s = S("tower"), g = this.grp(s, 0, 0.05);
    const stone = glowMat({key:"towerst", color:"#3a414e", rough:0.78, flat:true,
      tint:`diffuseColor.rgb *= 0.78 + 0.36 * bn(vWP.xz * 0.6 + vWP.y * 0.45);`,
      glow:`/* des meurtrières : trois par face, une rangée par étage ; une onde monte d'étage en étage */
        float th = atan(vOP.x, vOP.z) / 1.0472, u = fract(th), fu = fract(u * 3.0);
        float slit = smoothstep(0.16, 0.1, abs(fu - 0.5)) * step(-1.9, vOP.y) * step(vOP.y, 1.5);
        float lvl = floor((vWP.y - ${s.y.toFixed(2)}) / 5.5);
        float on = step(0.42, bh(vec2(floor(th) * 3.0 + floor(u * 3.0), lvl)));
        float wave = smoothstep(0.75, 1.0, sin(lvl * 0.8 - uBT * 1.1));
        glow += vec3(0.12, 0.85, 0.74) * slit * (0.06 + on * 0.5 + wave * 0.75);`});
    const lip = glowMat({key:"towerlip", color:"#262b34", rough:0.6, metal:0.3, flat:true,
      glow:`glow += vec3(0.16, 0.9, 0.78) * step(abs(vOP.y), 0.12) * (0.55 + 0.25 * sin(uBT * 1.4 + vWP.y * 0.25));`});
    /* le socle */
    const base = new THREE.Mesh(new THREE.CylinderGeometry(7.1, 7.4, 0.5, 6), lip); base.position.y = 0.25; base.receiveShadow = true; g.add(base);
    let y = 0.5;
    for(let i = 0; i < 7; i++){
      const r = 6.2 - i * 0.62, h = 5.5 - i * 0.18;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, h, 6), stone); m.position.y = y + h / 2; m.rotation.y = i * 0.18; m.castShadow = m.receiveShadow = true; g.add(m);
      const L = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92 + 0.4, r * 0.92 + 0.4, 0.5, 6), lip); L.position.y = y + h; L.rotation.y = i * 0.18; L.castShadow = true; g.add(L);
      y += h;
    }
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.5, 9, 6), glowMat({key:"spire", color:"#1e252e", rough:0.4, metal:0.5,
      glow:`glow += vec3(0.25, 1.0, 0.88) * smoothstep(0.43, 0.5, abs(fract(atan(vOP.z, vOP.x) * 0.9549) - 0.5)) * 1.2;`}));
    spire.position.y = y + 4.5; g.add(spire);
    /* la couronne : six éclats qui tournent autour de la flèche */
    const crown = new THREE.Group(); crown.position.y = y + 3.5; g.add(crown);
    inst(crown, prismGeo(4, 0.7), glowMat({key:"shard", color:"#0d1a1e", rough:0.3, metal:0.4, glow:`glow += vec3(0.2, 1.0, 0.86) * (0.25 + 0.9 * smoothstep(0.55, 1.2, vOP.y));`}),
      Array.from({length:6}, (_, i)=>{ const a = i / 6 * Math.PI * 2; return {x:Math.cos(a) * 3.4, y:Math.sin(i * 2.4) * 0.6, z:Math.sin(a) * 3.4, sx:0.32, sy:1.5, sz:0.32, rz:0.25}; }), false);
    this.anim.push((t, dt)=>{ crown.rotation.y += dt * 0.35; crown.position.y = y + 3.5 + Math.sin(t * 0.9) * 0.25; });
    this.U.beam = shafts(this.root, [{x:s.x, y:s.y + y + 7, z:s.z, w:2.2, h:190}], "#6ff6e2", 0.2);
    /* la porte, face au chemin (à l'ouest) : un cadre, un voile de lumière qui monte */
    const ax = -5.42;
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.6, 0.55), lip); p.position.set(ax - 0.1, 2.8, sd * 1.75); g.add(p); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 4.2), lip); top.position.set(ax - 0.12, 5.2, 0); g.add(top);
    const UD = {uBT:BT.uTime, uC:{value:C("#5ff2dc")}};
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 4.3), new THREE.ShaderMaterial({uniforms:UD, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false,
      vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader:`uniform float uBT; uniform vec3 uC; varying vec2 vUv;
        void main(){
          float e = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(1.0, 0.85, vUv.y);
          float flow = smoothstep(0.55, 1.0, fract(vUv.y * 2.5 - uBT * 0.7 + 0.2 * sin(vUv.x * 9.0)));
          float lines = 0.55 + 0.45 * sin(vUv.x * 48.0);
          float k = (0.22 + 0.55 * flow * lines) * e + smoothstep(0.08, 0.0, vUv.y) * 0.5;
          gl_FragColor = vec4(uC * k, 1.0);
        }`}));
    door.position.set(ax - 0.06, 2.65, 0); door.rotation.y = -Math.PI / 2; g.add(door);
    this.glow(s, s.x + ax - 1.5, s.y + 1.5, s.z, 7, "#5ff2dc", 1.1);
    s.ix = s.x + ax - 1.2; s.iz = s.z; s.labelY = y + 15;
    this.col(s.x, s.z, 6.9);
  }
  /* ---------- la porte des verrous ---------- */
  verrous(){
    const s = S("boss"), rot = -Math.PI / 2 + 0.35, g = this.grp(s, rot, 0.05);
    const obs = glowMat({key:"lockst", color:"#2d2a36", rough:0.5, metal:0.2, flat:true,
      glow:`/* des runes : de petits traits gravés, rares, qui battent lentement */
        vec2 q = vec2(atan(vOP.z, vOP.x) * 4.0, vWP.y * 3.2); vec2 f = fract(q);
        float rune = step(0.86, bh(floor(q))) * step(0.35, f.x) * step(f.x, 0.65) * step(0.2, f.y) * step(f.y, 0.8);
        glow += vec3(1.0, 0.2, 0.48) * rune * (0.3 + 0.3 * sin(uBT * 1.7 + vWP.y * 0.7));`});
    for(const sd of [-1, 1]){
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 7.4, 8), obs); p.position.set(sd * 2.7, 3.7, 0); p.castShadow = true; g.add(p);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.1, 8), obs); cap.position.set(sd * 2.7, 8.4, 0); g.add(cap);
      const [cx, cz] = this.at(s, rot, sd * 2.7, 0); this.col(cx, cz, 0.75);
    }
    const lint = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.8, 1.1), obs); lint.position.y = 7.55; lint.castShadow = true; g.add(lint);
    const lint2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.4, 0.8), obs); lint2.position.y = 6.95; g.add(lint2);
    /* le voile entre les piliers : des alvéoles roses, serrées ; ouvert, il devient un passage doré */
    const UV = {uBT:BT.uTime, uOpen:{value:0}};
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 6.75), new THREE.ShaderMaterial({uniforms:UV, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false,
      vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader:`uniform float uBT, uOpen; varying vec2 vUv;
        vec2 hx(vec2 p){ vec2 r = vec2(1.0, 1.732), h = r * 0.5; vec2 a = mod(p, r) - h, b = mod(p - h, r) - h; return dot(a, a) < dot(b, b) ? a : b; }
        void main(){
          vec2 p = vUv * vec2(4.8, 6.75) * 1.6;
          vec2 c = hx(p); float e = smoothstep(0.42, 0.5, length(c) * 1.15);
          float sh = 0.5 + 0.5 * sin(p.y * 0.9 - uBT * 2.2 + p.x * 0.4);
          float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(1.0, 0.94, vUv.y);
          vec3 shut = vec3(1.0, 0.2, 0.5) * (e * (0.35 + 0.5 * sh) + 0.08);
          float flow = smoothstep(0.6, 1.0, fract(vUv.y * 2.0 - uBT * 0.6));
          vec3 open = vec3(1.0, 0.78, 0.35) * (0.12 + 0.45 * flow * (0.5 + 0.5 * sin(vUv.x * 30.0)));
          gl_FragColor = vec4(mix(shut, open, uOpen) * edge * (0.85 + 0.15 * sin(uBT * 3.0)), 1.0);
        }`}));
    veil.position.y = 3.4; veil.renderOrder = 5; g.add(veil); this.veilU = UV;
    /* le cadenas de lumière, qui respire ; ouvert, son anse se lève */
    const lockMat = new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false});
    const lk = new THREE.Group(); lk.position.set(0, 3.5, 0.55); g.add(lk);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 0.32), lockMat); lk.add(body);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshBasicMaterial({color:"#1a0610"})); hole.position.set(0, 0.05, 0.17); lk.add(hole);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.15, 8, 20, Math.PI), lockMat); shackle.position.y = 0.75; lk.add(shackle);
    /* neuf losanges sur le linteau : les verrous levés s'allument */
    const dots = [];
    for(let i = 0; i < 9; i++){ const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({color:"#3a2a40"})); d.position.set(-2.6 + i * 0.65, 7.55, 0.6); g.add(d); dots.push(d); }
    this.anim.push(t=>{
      const k = 0.75 + 0.25 * Math.sin(t * 2.2), o = this.open.boss ? 1 : 0;
      UV.uOpen.value += (o - UV.uOpen.value) * 0.05;
      lockMat.color.set(o ? "#ffd166" : "#ff3d7f"); lockMat.opacity = (0.55 + 0.35 * k) * (1 - UV.uOpen.value * 0.6);
      body.scale.setScalar(0.96 + 0.04 * k); shackle.position.y = 0.75 + UV.uOpen.value * 0.45; shackle.rotation.y = UV.uOpen.value * 0.9;
      lk.position.y = 3.5 + Math.sin(t * 1.3) * 0.12;
      const n = this.bosses || 0; dots.forEach((d, i)=>{ d.material.color.set(i < n ? "#ffd166" : "#3a2a40"); d.rotation.y = t * (i < n ? 1.2 : 0.2); });
    });
    s.labelY = 10.4;
    const [ix, iz] = this.at(s, rot, 0, 2.2); s.ix = ix; s.iz = iz;
  }
  /* ---------- la Brèche : une déchirure debout ---------- */
  breche(){
    const s = S("breche"), g = this.grp(s, Math.PI / 2 - 0.3, 0);
    const U = {uBT:BT.uTime, uOpen:{value:1}};
    const tear = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 9.6, 1, 1), new THREE.ShaderMaterial({uniforms:U, transparent:true, depthWrite:false, side:THREE.DoubleSide, fog:false,
      vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader:`uniform float uBT, uOpen; varying vec2 vUv;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        void main(){
          vec2 p = vUv - 0.5; float y = p.y * 2.0, yy = max(1.0 - y * y, 0.0);
          /* la fente : large au milieu, pointue aux bouts, bord qui tremble ; fermée, une cicatrice */
          float w = (0.44 * yy + 0.03 * sin(vUv.y * 40.0 + uBT * 7.0) * yy) * mix(0.05, 1.0, uOpen);
          float d = abs(p.x + 0.04 * sin(vUv.y * 9.0 + uBT * 1.3)) - w * 0.5;
          if(d > 0.07) discard;
          vec2 cell = floor(vec2(vUv.x * 26.0, vUv.y * 46.0 + uBT * 4.0));
          float glyph = step(0.72, h21(cell + floor(uBT * 6.0)));
          vec3 col = vec3(0.02, 0.0, 0.05) + vec3(0.6, 0.1, 0.5) * glyph * 0.35;
          float edge = smoothstep(0.07, 0.0, abs(d));
          col += mix(vec3(0.2, 1.0, 0.95), vec3(1.0, 0.25, 0.5), step(0.0, p.x)) * edge * mix(0.7, 2.2, uOpen);
          gl_FragColor = vec4(col, d < 0.0 ? 0.96 : edge * mix(0.6, 1.0, uOpen));
        }`}));
    tear.position.y = 5.6; tear.renderOrder = 6; g.add(tear);
    /* de la terre arrachée, et des blocs de données, qui tournent autour */
    const orbit = new THREE.Group(); orbit.position.y = 4.6; g.add(orbit);
    inst(orbit, rockGeo(21, 1, 0.8), glowMat({key:"tornrock", color:"#4a3f44", rough:0.95, flat:true,
      glow:`glow += vec3(1.0, 0.24, 0.5) * smoothstep(-0.2, -0.75, vOP.y) * 0.8;`}),
      Array.from({length:9}, (_, i)=>{ const a = i / 9 * Math.PI * 2 + 0.3; const r = 3.6 + (i % 3) * 0.9; return {x:Math.cos(a) * r, y:Math.sin(i * 2.3) * 3, z:Math.sin(a) * r, s:0.45 + (i % 4) * 0.18, rx:i, ry:i * 1.3}; }));
    const cm = glowMat({key:"rcube", color:"#14101c", rough:0.4, glow:`float f = max(abs(vOP.x), max(abs(vOP.y), abs(vOP.z))); glow += vIC * smoothstep(0.42, 0.5, f) * 1.8;`});
    inst(orbit, new THREE.BoxGeometry(1, 1, 1), cm, Array.from({length:16}, (_, i)=>{ const a = i / 16 * Math.PI * 2; const r = 2.8 + (i % 3) * 0.7; return {x:Math.cos(a) * r, y:Math.sin(i * 1.7) * 3.2, z:Math.sin(a) * r, s:0.22 + (i % 4) * 0.11, rx:i, ry:i * 0.7, c:C(i % 2 ? "#35f0d6" : "#ff3d7f")}; }), false);
    this.anim.push((t, dt)=>{ const o = U.uOpen.value; orbit.rotation.y += dt * (0.12 + 0.5 * o); orbit.position.y = 4.6 + Math.sin(t * 0.8) * 0.3 * o - (1 - o) * 1.2; });
    /* le sol fendu, qui luit */
    const crack = new THREE.Mesh(new THREE.RingGeometry(0.4, 5.6, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({uniforms:U, transparent:true, depthWrite:false, fog:false, blending:THREE.AdditiveBlending,
      polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3,
      vertexShader:`varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader:`uniform float uBT, uOpen; varying vec2 vP; void main(){ float r = length(vP), a = atan(vP.y, vP.x);
        float k = smoothstep(0.08, 0.0, abs(fract(a * 1.1 + r * 0.25 + 0.15 * sin(r * 2.0)) - 0.5) - 0.44) * smoothstep(5.6, 0.8, r);
        k *= (0.5 + 0.5 * sin(uBT * 3.0 - r * 2.0)) * mix(0.25, 1.0, uOpen);
        if(k < 0.004) discard;
        gl_FragColor = vec4(vec3(1.0, 0.25, 0.55) * k, 1.0); }`}));
    crack.position.y = 0.09; crack.renderOrder = 4; g.add(crack);
    this.U.tearSwarm = swarm(this.root, Array.from({length:60}, ()=>({x:s.x + (Math.random() - .5) * 3, y:s.y + Math.random() * 1, z:s.z + (Math.random() - .5) * 3})), {kind:1, size:0.12, rise:11, c1:"#ff3d7f", c2:"#35f0d6", fade:60});
    this.tearU = U;
    this.glow(s, s.x, s.y + 4, s.z, 16, "#ff3d7f", 1.3);
    s.labelY = 12.2; this.col(s.x, s.z, 1.6);
  }
  /* ---------- l'Expédition : le camp ---------- */
  expe(){
    const s = S("expe"), g = this.grp(s, 0, 0.05), W = this.M.wood;
    const cloth = glowMat({key:"cloth", color:"#c9a466", rough:0.95, side:THREE.DoubleSide, tint:`diffuseColor.rgb *= 0.85 + 0.2 * step(0.5, fract(vOP.y * 2.2));`});
    /* le portique, face au chemin (à l'est), ses fanions */
    const gx = 6.4;
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 6.4, 8), W); p.position.set(gx, 3.2, sd * 2.7); p.castShadow = true; g.add(p); this.col(s.x + gx, s.z + sd * 2.7, 0.45); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 7.2), W); bar.position.set(gx, 6.1, 0); g.add(bar);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 6), W); bar2.position.set(gx, 5.2, 0); g.add(bar2);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 2.6), glowMat({key:"expsign", color:"#2c241c", rough:0.8,
      glow:`glow += vec3(1.0, 0.75, 0.3) * step(abs(vOP.y), 0.18) * step(abs(vOP.z), 1.05) * step(0.35, fract(vOP.z * 3.0)) * 0.9;`}));
    sign.position.set(gx + 0.2, 5.65, 0); g.add(sign);
    const flags = [];
    for(let i = 0; i < 7; i++){ const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1), new THREE.MeshStandardMaterial({color:i % 2 ? "#ffc857" : "#35f0d6", side:THREE.DoubleSide, roughness:0.8}));
      f.geometry.translate(0, -0.5, 0); f.position.set(gx, 5.95, -2.6 + i * 0.87); f.rotation.y = Math.PI / 2; g.add(f); flags.push(f); }
    this.anim.push(t=>flags.forEach((f, i)=>{ f.rotation.x = Math.sin(t * 2.6 + i) * 0.22; }));
    /* deux tentes */
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.9, 3.8, 4, 1, true), cloth); tent.position.set(-2.4, 1.9, -2); tent.rotation.y = Math.PI / 4; tent.castShadow = true; g.add(tent); this.col(s.x - 2.4, s.z - 2, 2.3);
    const tent2 = new THREE.Mesh(new THREE.ConeGeometry(2, 2.7, 4, 1, true), cloth); tent2.position.set(-3, 1.35, 3); tent2.rotation.y = 0.5; tent2.castShadow = true; g.add(tent2); this.col(s.x - 3, s.z + 3, 1.5);
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), new THREE.MeshBasicMaterial({color:"#2a1c10"})); flap.position.set(-0.45, 0.85, -2); flap.rotation.y = Math.PI / 2; g.add(flap);
    /* le feu */
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 7, 1, true), new THREE.MeshBasicMaterial({color:"#ffb347", transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false}));
    fire.position.set(1.4, 0.65, 0.8); g.add(fire);
    const fire2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 6, 1, true), new THREE.MeshBasicMaterial({color:"#fff0b0", transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false}));
    fire2.position.set(1.4, 0.5, 0.8); g.add(fire2);
    inst(g, rockGeo(7, 0), glowMat({key:"firestone", color:"#5a5a5a"}), Array.from({length:8}, (_, i)=>({x:1.4 + Math.cos(i / 8 * 6.28) * 0.8, y:0.12, z:0.8 + Math.sin(i / 8 * 6.28) * 0.8, s:0.24})), false);
    const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 8), W); logs.rotation.z = Math.PI / 2; logs.position.set(1.4, 0.4, 2.6); g.add(logs);
    this.anim.push(t=>{ fire.scale.set(1 + Math.sin(t * 13) * 0.08, 0.9 + Math.sin(t * 17) * 0.15, 1 + Math.cos(t * 11) * 0.08); fire2.scale.y = 0.9 + Math.sin(t * 21) * 0.2; });
    this.U.campEmbers = swarm(this.root, Array.from({length:40}, ()=>({x:s.x + 1.4, y:s.y + 0.6, z:s.z + 0.8})), {kind:1, size:0.08, rise:6, c1:"#ffb347", c2:"#ff6a2a", fade:50});
    this.fireL = this.glow(s, s.x + 1.4, s.y + 1.4, s.z + 0.8, 11, "#ff9a3d", 1.6);
    /* la table et sa carte, des caisses */
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.2), W); table.position.set(2.6, 0.95, -2.3); g.add(table);
    for(const [a, b] of [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), W); l.position.set(2.6 + a, 0.45, -2.3 + b); g.add(l); }
    const map = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), glowMat({key:"expmap", color:"#e6d4a6", rough:1, glow:`vec2 q = vOP.xy * vec2(6.0, 9.0); float n = step(0.88, bh(floor(q))); float l = smoothstep(0.05, 0.0, abs(fract(q.x + q.y * 0.3) - 0.5) - 0.45);
      glow += vec3(1.0, 0.75, 0.3) * (n * 0.6 + l * 0.2);`}));
    map.rotation.x = -Math.PI / 2; map.position.set(2.6, 1.02, -2.3); g.add(map);
    this.col(s.x + 2.6, s.z - 2.3, 1);
    inst(g, new THREE.BoxGeometry(1, 1, 1), W, [{x:-0.2, y:0.4, z:-4.6, s:0.8, ry:0.3}, {x:0.8, y:0.35, z:-4.9, s:0.7, ry:-0.2}, {x:0.2, y:1.15, z:-4.7, s:0.65, ry:0.8}]);
    this.col(s.x + 0.3, s.z - 4.7, 1.1);
    /* des guirlandes, du portique aux tentes */
    const bulbs = [];
    const chain = (a, b, n, sag) => { for(let i = 1; i < n; i++){ const k = i / n; bulbs.push({x:a[0] + (b[0] - a[0]) * k, y:a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * sag, z:a[2] + (b[2] - a[2]) * k, s:0.085}); } };
    chain([gx, 5.6, -2.7], [-2.4, 3.7, -2], 13, 0.9); chain([gx, 5.6, 2.7], [-3, 2.7, 3], 13, 0.8);
    inst(g, new THREE.SphereGeometry(1, 8, 6), this.M.warm, bulbs, false, false);
    s.ix = s.x + gx - 1.5; s.iz = s.z; s.labelY = 8.4;
  }
  /* ---------- le Forage : une galerie dans un tertre ---------- */
  forage(){
    const s = S("forage"), rot = -Math.PI / 2, g = this.grp(s, rot, 0.05), W = this.M.wood;
    const rock = glowMat({key:"minerock", color:"#5e5850", rough:0.95, flat:true, tint:`diffuseColor.rgb *= 0.72 + 0.32 * bn(vWP.xz * 0.5 + vWP.y * 0.8);`,
      glow:`/* des veines de minerai, par endroits, dans la roche */
        float v = smoothstep(0.022, 0.0, abs(bn(vWP.xz * 0.8 + vWP.y * vec2(1.1, -0.6)) - 0.5)) * step(0.58, bn(vWP.xz * 0.33 + vWP.y * 0.2 + 7.0));
        glow += mix(vec3(1.0, 0.72, 0.3), vec3(0.3, 0.9, 1.0), step(0.5, bh(floor(vWP.xz * 0.3)))) * v * 0.45;`});
    /* le tertre, derrière l'entrée */
    inst(g, rockGeo(11, 1, 0.75), rock, [{x:-4.2, y:1.4, z:-2.8, s:2.6}, {x:4.2, y:1.3, z:-2.7, s:2.5}, {x:0, y:2.4, z:-6, s:4.2}, {x:-5.4, y:0.7, z:-0.2, s:1.4}, {x:5.2, y:0.6, z:-0.3, s:1.2},
      {x:-2.1, y:4.6, z:-3.4, s:2.1}, {x:2.3, y:4.4, z:-3.6, s:2}, {x:0, y:5.8, z:-5.6, s:2.6}]);
    for(const [lx, lz, r] of [[0, -5.6, 4.4], [-4.2, -2.8, 2.3], [4.2, -2.7, 2.2]]){ const [x, z] = this.at(s, rot, lx, lz); this.col(x, z, r); }
    /* l'entrée : un cadre de bois, le noir de la galerie */
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4, 0.42), W); p.position.set(sd * 1.7, 2, -0.6); g.add(p); }
    const lin = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.5, 0.55), W); lin.position.set(0, 4, -0.6); g.add(lin);
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.8), new THREE.MeshBasicMaterial({color:"#050405"})); dark.position.set(0, 1.9, -0.9); g.add(dark);
    /* le chevalement : quatre jambes, une roue qui tourne */
    const hx = -3.6, hz = 1.4, H = 9.5;
    for(const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, H + 0.2, 0.28), W);
      leg.position.set(hx + a * 0.75, H / 2, hz + b * 0.75); leg.rotation.set(-b * 0.08, 0, a * 0.08); g.add(leg);
    }
    for(let i = 1; i < 4; i++){ const r = new THREE.Mesh(new THREE.BoxGeometry(1.9 - i * 0.22, 0.16, 0.16), W); r.position.set(hx, i * 2.3, hz + 0.75 - i * 0.18); g.add(r);
      const r2 = r.clone(); r2.position.z = hz - 0.75 + i * 0.18; g.add(r2); }
    const wheel = new THREE.Group(); wheel.position.set(hx, H + 0.4, hz); g.add(wheel);
    const steel = glowMat({key:"steel", color:"#4a4f58", metal:0.6, rough:0.45});
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 6, 28), steel));
    for(let i = 0; i < 6; i++){ const sp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), steel); sp.rotation.z = i * Math.PI / 6; wheel.add(sp); }
    /* les câbles : l'un descend dans le puits, l'autre file vers le tertre */
    g.add(this.beam([hx + 1.25, H + 0.4, hz], [hx + 1.25, 0.2, hz], 0.035, steel), this.beam([hx, H + 1.65, hz], [0.4, 5.4, -2.6], 0.035, steel));
    { const [x, z] = this.at(s, rot, hx, hz); this.col(x, z, 1.2); }
    this.anim.push((t, dt)=>{ wheel.rotation.z -= dt * (this.open.forage ? 1.2 : 0); });
    /* les rails qui sortent, un wagonnet de minerai, deux lanternes */
    for(const sd of [-1, 1]){ const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 7.4), steel); r.position.set(sd * 0.55, 0.12, 2.9); g.add(r); }
    for(let i = 0; i < 9; i++){ const sl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.22), W); sl.position.set(0, 0.06, -0.4 + i * 0.85); g.add(sl); }
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.6), glowMat({key:"cart", color:"#5a4a3a", metal:0.4, rough:0.6})); cart.position.set(0, 0.62, 4.2); g.add(cart);
    inst(g, prismGeo(6, 0.4), glowMat({key:"ore", color:"#ffffff", rough:0.2, glow:`glow += vIC * 1.3;`}), [{x:-0.3, y:1, z:4, s:0.25, c:C("#ffd166")}, {x:0.3, y:1, z:4.5, s:0.2, c:C("#47e9ff")}, {x:0, y:1.05, z:3.8, s:0.18, c:C("#ff5ca8")},
      {x:2.6, y:0.1, z:2.6, sx:0.3, sy:0.6, sz:0.3, rz:0.3, c:C("#47e9ff")}, {x:2.9, y:0.1, z:2.3, sx:0.22, sy:0.45, sz:0.22, rz:-0.4, c:C("#ffd166")}, {x:-2.5, y:0.1, z:3.2, sx:0.25, sy:0.5, sz:0.25, rx:0.3, c:C("#ffd166")}], false);
    const [cx, cz] = this.at(s, rot, 0, 4.2); this.col(cx, cz, 1);
    for(const sd of [-1, 1]){
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), this.M.warm); lamp.position.set(sd * 1.7, 3.25, 0.05); g.add(lamp);
      const halo = new THREE.Sprite(this.M.halo); halo.scale.setScalar(2.2); halo.position.copy(lamp.position); g.add(halo);
    }
    const [lx, lz] = this.at(s, rot, 0, 1); this.glow(s, lx, s.y + 2.6, lz, 10, "#ffb347", 1.4);
    s.labelY = 12;
    const [ix, iz] = this.at(s, rot, 0, 2.6); s.ix = ix; s.iz = iz;
  }
  /* ---------- le raid : un phare, et le boss de la semaine dessus ---------- */
  raid(){
    /* le phare se tient à l'ouest du parvis ; le reste du parvis est l'arène du raid (raid3d.js), cerclée de pierres levées */
    const s = S("raid"), OX = RAID_OX, g = this.grp(s, 0, 0.05); g.position.x += OX;
    const stone = glowMat({key:"raidst", color:"#3a3036", rough:0.7, flat:true,
      glow:`/* des runes : de petits traits gravés, qui battent */
        vec2 q = vec2(atan(vOP.z, vOP.x) * 3.2, vWP.y * 3.0); vec2 f = fract(q);
        float rune = step(0.84, bh(floor(q))) * step(0.38, f.x) * step(f.x, 0.62) * step(0.15, f.y) * step(f.y, 0.85);
        glow += vec3(1.0, 0.42, 0.22) * rune * (0.45 + 0.45 * sin(uBT * 2.0 + vWP.y)) * 0.9;`});
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.2, 8), stone); base.position.y = 0.6; base.castShadow = true; g.add(base);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 6, 8), stone); col.position.y = 4.2; col.castShadow = true; g.add(col);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.2, 0.5, 16), stone); plate.position.y = 7.4; g.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.08, 6, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ff6a3d", transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false}));
    ring.position.y = 7.7; g.add(ring);
    /* quatre pierres levées autour de l'arène (ni devant le phare, ni du côté d'où l'on arrive) */
    const st = this.grp(s, 0, 0.05), A = [60, 120, 240, 300].map(d=>d * Math.PI / 180);
    inst(st, prismGeo(5, 0.5), stone, A.map((a, i)=>({x:Math.cos(a) * 8.6, y:0, z:Math.sin(a) * 8.6, sx:0.5, sy:2.6 + (i % 2) * 0.7, sz:0.5, rz:0.06 * (i % 2 ? 1 : -1)})));
    for(const a of A) this.col(s.x + Math.cos(a) * 8.6, s.z + Math.sin(a) * 8.6, 0.6);
    this.raidG = g; this.U.raidBeam = shafts(this.root, [{x:s.x + OX, y:s.y + 7.6, z:s.z, w:4, h:12}], "#ff8a5c", 0.22);
    this.raidRing = ring;
    this.anim.push((t, dt)=>{ ring.rotation.y += dt; ring.scale.setScalar(1 + Math.sin(t * 2) * 0.04); if(this.raidMon && !this.raidHold && !(this.raidWake && this.raidWake.k > 0)){ this.raidMon.group.rotation.y += dt * 0.35; } });
    this.glow(s, s.x + OX, s.y + 7.5, s.z, 12, "#ff6a3d", 1.2);
    this.col(s.x + OX, s.z, 3.1);
    s.labelY = 14; s.lx = OX; s.ix = s.x + 6.5; s.iz = s.z;
  }
  /* le boss du raid : son modèle, posé sur le phare (dès que le jeu mobile sait qui c'est) */
  raidHolo(t, dt){
    if(this.raidMon !== undefined && this.raidId === this._wantRaid()){
      const m = this.raidMon; if(!m) return;
      m.update(t, dt, this._rp || (this._rp = new THREE.Vector3(0, 7.65, 0)), null);
      /* E au pied du phare (raid3d.js) : il s'éveille, se tourne vers l'arène et grandit ; puis il descend
         du phare jusqu'à sa place dans l'arène, à sa taille de combat */
      const W = this.raidWake, G0 = m.group;
      if(W && W.k > 0){
        const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
        const a = sm(W.k / 0.42), d = sm((W.k - 0.45) / 0.4), H = W.H / 3.6;
        G0.rotation.y += ((Math.PI / 2) - G0.rotation.y) * Math.min(1, dt * 3);
        G0.scale.setScalar((1 + a * 0.35) * (1 - d) + H * d);
        G0.position.set(W.lx * d, 7.65 * (1 - d) + Math.sin(Math.PI * d) * 1.6 + a * 0.6 * (1 - d), W.lz * d);
        if(m.uniforms && m.uniforms.uFlash) m.uniforms.uFlash.value = W.k < 0.1 ? (0.1 - W.k) * 7 : 0;
      } else if(G0.scale.x !== 1) G0.scale.setScalar(1);
      G0.visible = !this.raidHold;
      return;
    }
    const id = this._wantRaid(); if(!id) return;
    if(this.raidMon) this.raidMon.dispose();
    this.raidId = id;
    try { this.raidMon = makeMon(id, false, this.raidG, {height:3.6}); this.raidMon.setAnim("idle"); } catch(e){ this.raidMon = null; }
  }
  _wantRaid(){ try { return G() && G().ref("raidBoss")(); } catch(e){ return 0; } }
  /* ---------- le Poké-Poker : un pavillon, une table, des cartes qui flottent ---------- */
  poker(){
    const s = S("poker"), g = this.grp(s, 0.2, 0.05), W = this.M.wood;
    const felt = glowMat({key:"felt", color:"#1d4a3a", rough:0.9, glow:`glow += vec3(0.69, 0.42, 1.0) * smoothstep(0.02, 0.0, abs(length(vOP.xz) - 1.25)) * 0.6;`});
    const silk = glowMat({key:"silk", color:"#4b2a6e", rough:0.7, side:THREE.DoubleSide, tint:`diffuseColor.rgb *= 0.8 + 0.3 * step(0.5, fract(atan(vOP.z, vOP.x) * 1.273));`,
      glow:`glow += vec3(0.69, 0.42, 1.0) * smoothstep(0.1, 0.0, vOP.y + 0.8) * 0.5;`});
    /* le pavillon */
    for(const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.4, 8), W); p.position.set(a * 2.5, 1.7, b * 2.5); p.castShadow = true; g.add(p);
      const c = Math.cos(0.2), n = Math.sin(0.2); this.col(s.x + a * 2.5 * c + b * 2.5 * n, s.z - a * 2.5 * n + b * 2.5 * c, 0.25);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 1.8, 4, 1, true), silk); roof.position.y = 4.25; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    const fin = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({color:"#d6b0ff"})); fin.position.y = 5.4; g.add(fin);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), this.M.warm); lamp.position.y = 3.3; g.add(lamp);
    const halo = new THREE.Sprite(this.M.halo); halo.scale.setScalar(2.4); halo.position.y = 3.3; g.add(halo);
    /* la table, les jetons, les tabourets */
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.14, 28), felt); top.position.y = 1; g.add(top);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.1, 6, 32).rotateX(Math.PI / 2), W); rim.position.y = 1.05; g.add(rim);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 1, 10), W); leg.position.y = 0.5; g.add(leg);
    const chips = [];
    [["#ff5ca8", -0.7, 0.3], ["#35f0d6", 0.6, -0.5], ["#ffd166", 0.2, 0.8]].forEach(([c, x, z])=>{ for(let i = 0; i < 4; i++) chips.push({x, y:1.1 + i * 0.07, z, sx:0.16, sy:0.06, sz:0.16, c:C(c)}); });
    inst(g, new THREE.CylinderGeometry(1, 1, 1, 14), glowMat({key:"chip", color:"#ffffff", rough:0.5, glow:`glow += vIC * 0.25;`}), chips, false);
    for(let i = 0; i < 4; i++){ const st = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.7, 10), W); st.position.set(Math.cos(i * Math.PI / 2 + 0.4) * 2.2, 0.35, Math.sin(i * Math.PI / 2 + 0.4) * 2.2); g.add(st); }
    const cards = new THREE.Group(); cards.position.y = 2.2; g.add(cards);
    const cm = glowMat({key:"card", color:"#f4f0e8", rough:0.5, side:THREE.DoubleSide, glow:`float b = smoothstep(0.4, 0.46, max(abs(vOP.x) / 0.32, abs(vOP.y) / 0.45) * 0.5); glow += vIC * (0.2 + b * 1.2);`});
    inst(cards, new THREE.PlaneGeometry(1, 1), cm, Array.from({length:5}, (_, i)=>{ const a = i / 5 * Math.PI * 2; return {x:Math.cos(a) * 1.2, y:Math.sin(i * 2.1) * 0.15, z:Math.sin(a) * 1.2, sx:0.72, sy:1, sz:1, ry:-a + Math.PI / 2, c:C(["#b06bff", "#35f0d6", "#ffd166", "#ff5ca8", "#5ce07a"][i])}; }), false);
    this.anim.push((t, dt)=>{ const o = this.open.poker ? 1 : 0.15; cards.rotation.y += dt * 0.5 * o; cards.position.y = 2.2 + Math.sin(t * 1.4) * 0.12 * o - (1 - o) * 0.95; });
    this.glow(s, s.x, s.y + 3, s.z, 10, "#b06bff", 1.2);
    this.col(s.x, s.z, 1.8);
    s.labelY = 7.4;
  }

  /* ---------- à chaque image ---------- */
  update(t, dt, player, night = 0){
    for(const f of this.anim) f(t, dt);
    for(const U of Object.values(this.U)) if(U && U.uFocus) U.uFocus.value.copy(player);
    const g = G();
    if(g && g.S) this.bosses = (g.S.bosses || []).length;
    if(g && g.S && (!this._chk || t - this._chk > 1 || t < this._chk)){
      this._chk = t;
      for(const s of SITES){ this.lock[s.k] = this.locked(s); this.open[s.k] = !this.lock[s.k]; }
      /* au premier regard, tout est déjà dans son état (pas de faille qui se referme sous les yeux) */
      if(!this._seen){ this._seen = true; if(this.tearU) this.tearU.uOpen.value = this.open.breche ? 1 : 0; if(this.veilU) this.veilU.uOpen.value = this.open.boss ? 1 : 0; }
    }
    if(this.tearU) this.tearU.uOpen.value += ((this.open.breche ? 1 : 0) - this.tearU.uOpen.value) * Math.min(1, dt * 1.5);
    if(Math.hypot(player.x - S("raid").x, player.z - S("raid").z) < 120) this.raidHolo(t, dt);
    /* le lieu le plus proche, à portée */
    let best = null, bd = 1e9;
    for(const s of SITES){
      const d = Math.hypot(player.x - (s.ix ?? s.x), player.z - (s.iz ?? s.z));
      if(d < s.r + 2.5 && d < bd){ bd = d; best = s; }
    }
    this.near = best;
    for(const s of SITES){
      /* le cercle : éteint si fermé, il s'éveille quand on est à portée */
      const lk = !!this.lock[s.k], U = s.sig;
      U.uN.value += ((s === best ? 1 : 0) - U.uN.value) * Math.min(1, dt * 4);
      U.uA.value += ((lk ? 0.3 : 0.85) - U.uA.value) * Math.min(1, dt * 2);
      U.uC.value.copy(s.col0); if(lk) U.uC.value.lerp(GREY, 0.55);
      /* les lueurs : plus franches la nuit, sourdes si le lieu est fermé */
      for(const l of this.lights) if(l.site === s.k) l.base = l.b0 * (0.4 + 0.75 * night) * (lk ? 0.3 : 1) * (1 + 0.35 * U.uN.value);
      /* l'étiquette : son nom, et s'il est fermé, ce qu'il demande */
      const lab = this.labels[s.k], far = Math.hypot(player.x - s.x, player.z - s.z);
      lab.L.sp.visible = far < 80; lab.L.sp.material.opacity = Math.min(1, (80 - far) / 20);
      this.paint(s, lab);
    }
  }
  locked(s){
    const g = G(); if(!s.mod || !g) return null;
    try {
      if(g.ref("moduleUnlocked")(s.mod)) return null;
      const r = g.ref("MODULE_REQ")[s.mod]; return r ? r.d : "Fermé";
    } catch(e){ return null; }
  }
  paint(s, lab){
    const lk = this.lock[s.k], txt = s.n + "|" + (lk || "");
    if(lab.txt === txt) return; lab.txt = txt;
    const cv = lab.L.cv, x = cv.getContext("2d"), W = cv.width, H = cv.height;
    x.clearRect(0, 0, W, H);
    x.fillStyle = "rgba(4,6,12,0.7)"; x.beginPath(); x.roundRect(60, 16, W - 120, H - 32, 24); x.fill();
    x.strokeStyle = lk ? "#5a6478" : s.col; x.lineWidth = 4; x.stroke();
    x.textAlign = "center"; x.fillStyle = lk ? "#aab4c6" : "#ffffff"; x.font = "800 60px Unbounded, sans-serif"; x.fillText(s.n, W / 2, 92);
    x.font = "34px 'Pixelify Sans', sans-serif"; x.fillStyle = lk ? "#ff9ab4" : s.col;
    x.fillText(lk ? shut(s)[0].toUpperCase() + shut(s).slice(1) + " · " + lk : s.d, W / 2, 148);
    lab.L.tex.needsUpdate = true;
  }
  /* ce que dit l'écran en bas, à portée d'un lieu */
  prompt(game){
    const s = this.near; if(!s) return "";
    this.game = game || this.game;
    const lk = this.lock[s.k];
    if(s.k === "raid" && !lk && game && game.raid3d) return game.raid3d.promptText();
    return lk ? `<b>${s.n}</b> · ${shut(s)} : ${lk}` : `<b>E</b> · ${s.n === "Les verrous" ? "les verrous légendaires" : s.n === "Le raid" ? "le raid de la semaine" : s.n === "Poké-Poker" ? "une partie de Poké-Poker" : s.n === "Le Forage" ? "descendre au Forage" : s.n === "L'Expédition" ? "partir en Expédition" : s.n === "La Brèche" ? "entrer dans la Brèche" : "monter dans la Tour"}`;
  }
  /* E : le terminal s'ouvre sur l'écran du module */
  interact(game){
    const s = this.near; if(!s) return false;
    if(this.lock[s.k]){ game.hud.hint(`<b>${s.n}</b> ${s.k === "boss" ? "restent" : "reste"} ${shut(s)} : ${this.lock[s.k]}`, 4); return true; }
    /* le raid : on attaque ici, au pied du phare */
    if(s.k === "raid" && game.raid3d){ game.raid3d.start(); return true; }
    game.terminal.show(s.screen);
    return true;
  }
}
