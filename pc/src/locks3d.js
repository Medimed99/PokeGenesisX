/* ============================================================
   LES VERROUS EN 3D · AU SOMMET D'UNE AILE
   Un verrou légendaire garde le moteur de la Tour (le jeu mobile décide
   de tout, Tower3D le montre) ; ici, ce qui le rend unique :
     · le lieu : la plateforme au sommet d'une aile, une passerelle, et
       au bout la porte du secteur, scellée par un cadenas de lumière
       fait de cubes et tenue par deux chaînes en croix. Le ciel, la
       brume, le fond et ce qui vole dans l'air sont ceux du gardien :
       les braises de Sulfura, la neige d'Artikodin, l'orage de Raikou,
       l'aube d'Ho-Oh, le magma de Groudon, le ciel de Rayquaza… ;
     · le gardien tient le verrou : un rayon va de lui au cadenas, et
       chaque coup qu'il prend arrache des cubes au cadenas ;
     · RECONFIGURATION : une onde magenta, le cadenas se reconstruit,
       teinté de la faille ;
     · la victoire : le cadenas éclate, les chaînes tombent, la porte
       s'ouvre sur une lumière. À la première victoire, le gardien cède
       sur place : il se dore, monte dans la lumière et dit ses derniers
       mots (le moment « VERROU LEVÉ » du jeu mobile, joué ici en 3D).
   ============================================================ */
import * as THREE from "three";

const G = () => window.PCG;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();
const UP = new THREE.Vector3(0, 1, 0);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
const MAG = new THREE.Color("#ff3d7f"), GOLD = new THREE.Color("#ffe9a8"), WHITE = new THREE.Color("#ffffff");

/* chaque gardien, son ciel */
export const LOCK_THEMES = {
  146: {top:"#1a0503", bot:"#f06a2c", fog:"#5a2210", fd:0.010, acc:"#ff8a3d", acc2:"#ffd84a", hemi:["#ffc49a", "#3a1206"], glow:"#ffb070", glowK:1.0, sea:"#ff5a1a", seaK:0.9, rock:"#2a1612", part:"ember"},
  144: {top:"#06163a", bot:"#4f86bd", fog:"#9cc2e2", fd:0.010, acc:"#8fe8ff", acc2:"#ffffff", hemi:["#cfe4ff", "#1c2a44"], glow:"#dff0ff", glowK:0.6, sea:"#eef8ff", seaK:0.3, rock:"#4a5a70", part:"snow"},
  150: {top:"#040110", bot:"#4a2070", fog:"#1e0c34", fd:0.012, acc:"#c07aff", acc2:"#ff8af0", hemi:["#dcc0ff", "#160822"], glow:"#c890ff", glowK:0.6, sea:"#3a1060", seaK:0.5, rock:"#1c1426", part:"mote"},
  243: {top:"#03040a", bot:"#262a44", fog:"#141628", fd:0.012, acc:"#ffe45e", acc2:"#a8d8ff", hemi:["#c0cce8", "#0a0c16"], glow:"#8090c0", glowK:0.3, sea:"#121628", seaK:0.1, rock:"#16181f", part:"rain", bolts:true},
  250: {top:"#2c1444", bot:"#ffb870", fog:"#c88a6a", fd:0.008, acc:"#ffc857", acc2:"#ff7a6a", hemi:["#ffe4c8", "#40203a"], glow:"#ffd890", glowK:1.0, sea:"#ffd0a0", seaK:0.35, rock:"#3a2a34", part:"feather", rainbow:true, clouds:true},
  249: {top:"#01040a", bot:"#16304a", fog:"#0a1a2c", fd:0.013, acc:"#9ab8ff", acc2:"#e8f0ff", hemi:["#b0c4e8", "#06101c"], glow:"#6080b0", glowK:0.35, sea:"#0a2440", seaK:0.15, rock:"#121822", part:"rain", bolts:true},
  383: {top:"#120302", bot:"#b8340e", fog:"#300c04", fd:0.011, acc:"#ff5a2a", acc2:"#ffb84a", hemi:["#ffb898", "#2a0602"], glow:"#ff8040", glowK:0.8, sea:"#ff3a0a", seaK:1.3, rock:"#1e0c08", part:"ember"},
  382: {top:"#021220", bot:"#1a6c98", fog:"#0c3450", fd:0.012, acc:"#4ab8ff", acc2:"#9ff0ff", hemi:["#b8e4ff", "#04182a"], glow:"#90d8ff", glowK:0.5, sea:"#0a4a70", seaK:0.3, rock:"#10222e", part:"bubble"},
  384: {top:"#0a3470", bot:"#86c0ea", fog:"#a8cce8", fd:0.007, acc:"#5cf08a", acc2:"#ffe45e", hemi:["#eef8ff", "#3a5a78"], glow:"#ffffff", glowK:0.9, sea:"#ffffff", seaK:0.25, rock:"#5a6878", part:"wind", clouds:true}
};
const THEME0 = {top:"#04020a", bot:"#2a0c24", fog:"#12060e", fd:0.012, acc:"#ff3d7f", acc2:"#35f0d6", hemi:["#e0c0e0", "#10060c"], glow:"#ff80b0", glowK:0.4, sea:"#2a0820", seaK:0.4, rock:"#1a1218", part:"mote"};

/* la porte est derrière le gardien, vue de la caméra du combat */
const GDIR = new THREE.Vector3(0.70, 0, -0.71).normalize();
const GATE_D = 17, PAD_Y = 3.3, VX = 0.3;
const SKY_VS = `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `varying vec3 vD; uniform vec3 uTop, uBot, uGlowC, uSunD; uniform float uGlowK, uFlash;
void main(){
  float y = vD.y; vec3 c = mix(uBot, uTop, smoothstep(-0.12, 0.6, y));
  float s = max(0.0, dot(normalize(vD), uSunD));
  c += uGlowC * uGlowK * (pow(s, 28.0) * 0.8 + pow(s, 5.0) * 0.22);
  c += vec3(0.55, 0.6, 0.85) * uFlash;
  gl_FragColor = vec4(c, 1.0);
}`;
/* le champ de la porte : une trame qui défile ; à la victoire, elle s'efface cellule par cellule depuis le centre */
const FIELD_VS = `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FIELD_FS = `varying vec2 vU; uniform vec3 uC; uniform float uT, uOpen, uMag;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 p = vU * vec2(10.6, 12.2) * 1.25;
  vec2 cell = floor(p), g = abs(fract(p) - 0.5);
  float line = smoothstep(0.43, 0.5, max(g.x, g.y));
  float n = h(cell);
  float lit = step(0.86, fract(n + uT * 0.12)) * 0.4;
  float scan = 0.5 + 0.5 * sin(vU.y * 70.0 - uT * 4.0);
  float d = length((vU - vec2(0.5, 0.42)) * vec2(1.0, 1.2));
  float gone = step(d + n * 0.22, uOpen * 0.95);
  vec3 col = mix(uC, vec3(1.0, 0.24, 0.5), uMag);
  /* une membrane sombre, quadrillée de lumière : le cadenas ressort devant */
  vec3 c = col * (0.07 + line * 0.95 + lit * 0.55 + scan * 0.04) + vec3(0.01, 0.012, 0.025);
  float a = (0.86 + line * 0.12) * (1.0 - gone);
  gl_FragColor = vec4(c, a);
}`;
/* l'arc-en-ciel d'Ho-Oh : une demi-couronne, la teinte suit le rayon */
const BOW_VS = `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BOW_FS = `varying vec2 vP; uniform float uR0, uR1, uA;
vec3 hue(float x){ return clamp(abs(mod(x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main(){ float k = (length(vP) - uR0) / (uR1 - uR0); float e = smoothstep(0.0, 0.15, k) * smoothstep(1.0, 0.85, k);
  gl_FragColor = vec4(hue(0.82 - k * 0.82), uA * e); }`;

function dotTex(){
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.65)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
function bandTex(){
  const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, 64, 256);
  for(let y = 6; y < 256; y += 18 + Math.floor(Math.random() * 30)){ g.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.65})`; g.fillRect(0, y, 64, 2); }
  for(let i = 0; i < 26; i++){ g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(4 + Math.floor(Math.random() * 14) * 4, Math.floor(Math.random() * 64) * 4, 2, 3); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/* une face de cube du cadenas : un bord vif, un cœur à demi transparent (on voit les couches derrière) */
function cubeTex(){
  const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d");
  g.fillStyle = "rgba(255,255,255,.42)"; g.fillRect(0, 0, 32, 32);
  g.strokeStyle = "rgba(255,255,255,1)"; g.lineWidth = 4; g.strokeRect(2, 2, 28, 28);
  g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(9, 9, 14, 14);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
}

export class LockVenue {
  constructor(game){
    this.game = game; this.built = false; this.on = false;
    this.root = new THREE.Vector3(0, 0, 0);
    /* la Tour PC prend la main sur le moment « verrou levé » du jeu mobile (37b-moments) */
    window.PCLOCK3D = this;
    /* où se tient le gardien : un peu plus loin que le boss d'une aile, devant sa porte */
    this.bossSlot = [4.4, -3.0];
    /* la caméra du combat : un peu plus basse, le regard un peu plus haut (la porte et le cadenas au-dessus du gardien) */
    this.camOff = [-9.0, 4.9, 9.4]; this.camLook = [2.4, 2.4, -2.4];
    /* ses renforts (à la reconfiguration) se posent à ses flancs, pas entre lui et l'équipe */
    this.addSlots = [[2.6, -4.9], [6.2, -1.1], [3.0, -0.4]];
  }
  /* ---------- le lieu ---------- */
  build(){
    this.built = true;
    const s = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 1200);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 12), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, vertexShader:SKY_VS, fragmentShader:SKY_FS,
      uniforms:{uTop:{value:new THREE.Color()}, uBot:{value:new THREE.Color()}, uGlowC:{value:new THREE.Color()}, uGlowK:{value:1}, uSunD:{value:new THREE.Vector3(0.62, 0.16, -0.77).normalize()}, uFlash:{value:0}}}));
    this.sky.frustumCulled = false; this.sky.renderOrder = -10; s.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#ffffff", "#202020", 1.05); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#ffffff", 1.55); this.sun.castShadow = true;
    const q = this.game.engine.q, ms = q && q.shadow ? Math.min(2048, q.shadow) : 1024;
    this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera; sc.left = -13; sc.right = 13; sc.top = 13; sc.bottom = -13; sc.near = 1; sc.far = 60;
    this.sun.position.set(-7, 13, 9); this.sun.target.position.set(1, 0, -1); s.add(this.sun, this.sun.target);
    s.fog = new THREE.FogExp2("#000000", 0.01);
    this.env = {tint:new THREE.Color(1, 1, 1), fog:new THREE.Color(), fogDensity:0.01};
    this.dot = dotTex();
    this.buildArena(s); this.buildWorld(s); this.buildGate(s); this.buildPad(); this.buildChains(); this.buildBeam(s); this.buildAir(s);
    /* l'onde de la reconfiguration, au sol */
    this.wave = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.wave.visible = false; s.add(this.wave);
  }
  buildArena(s){
    const g = new THREE.Group(); s.add(g);
    const cv = document.createElement("canvas"); cv.width = cv.height = 512;
    const x = cv.getContext("2d"); x.fillStyle = "#151a24"; x.fillRect(0, 0, 512, 512);
    for(let y = 0; y < 8; y++) for(let i = 0; i < 8; i++){
      const v = 20 + Math.floor(Math.random() * 14); x.fillStyle = `rgb(${v},${v + 2},${v + 8})`; x.fillRect(i * 64 + 3, y * 64 + 3, 58, 58);
      if(Math.random() < 0.12){ x.fillStyle = "rgba(255,255,255,0.05)"; x.fillRect(i * 64 + 3, y * 64 + 3, 58, 58); }
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2.4, 2.4);
    const ecv = document.createElement("canvas"); ecv.width = ecv.height = 512;
    const ex = ecv.getContext("2d"); ex.fillStyle = "#000"; ex.fillRect(0, 0, 512, 512); ex.strokeStyle = "#7a7a7a"; ex.lineWidth = 2;
    for(let i = 0; i <= 8; i++){ ex.beginPath(); ex.moveTo(i * 64, 0); ex.lineTo(i * 64, 512); ex.stroke(); ex.beginPath(); ex.moveTo(0, i * 64); ex.lineTo(512, i * 64); ex.stroke(); }
    const etex = new THREE.CanvasTexture(ecv); etex.wrapS = etex.wrapT = THREE.RepeatWrapping; etex.repeat.set(2.4, 2.4);
    this.floorMat = new THREE.MeshStandardMaterial({map:tex, emissiveMap:etex, emissive:new THREE.Color("#ff3d7f"), emissiveIntensity:0.55, roughness:0.85, metalness:0.1});
    this.rockMat = new THREE.MeshStandardMaterial({color:"#1a1d24", roughness:1, flatShading:true});
    const top = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 8.2, 0.7, 8, 1), [this.rockMat, this.floorMat, this.floorMat]);
    top.position.y = -0.35; top.receiveShadow = true; top.rotation.y = Math.PI / 8;
    const cap = new THREE.Mesh(new THREE.CircleGeometry(8.55, 8), this.floorMat);
    cap.rotation.x = -Math.PI / 2; cap.rotation.z = Math.PI / 8; cap.position.y = 0.005; cap.receiveShadow = true;
    g.add(top, cap);
    this.accMat = new THREE.MeshBasicMaterial({color:"#ff3d7f", toneMapped:false});
    const rim = new THREE.Mesh(new THREE.TorusGeometry(8.45, 0.06, 6, 8), this.accMat);
    rim.rotation.x = Math.PI / 2; rim.rotation.z = Math.PI / 8; rim.position.y = 0.03; g.add(rim);
    const under = new THREE.ConeGeometry(8.1, 13, 8, 6, true), up = under.attributes.position;
    for(let i = 0; i < up.count; i++){ const y = up.getY(i); if(y < 6.4){ up.setX(i, up.getX(i) * (0.85 + Math.random() * 0.3)); up.setZ(i, up.getZ(i) * (0.85 + Math.random() * 0.3)); up.setY(i, y + (Math.random() - 0.5) * 0.8); } }
    under.computeVertexNormals();
    const rock = new THREE.Mesh(under, this.rockMat); rock.rotation.x = Math.PI; rock.position.y = -7.2; rock.rotation.y = Math.PI / 8; g.add(rock);
    /* des piliers brisés sur le pourtour (pas devant la caméra, pas devant la porte) */
    const pm = new THREE.MeshStandardMaterial({color:"#232835", roughness:0.9});
    for(let i = 0; i < 8; i++){
      if(i === 3 || i === 7) continue;
      const a = i / 8 * Math.PI * 2, h = 1.4 + Math.random() * 3.2;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), pm);
      p.position.set(Math.cos(a) * 7.7, h / 2, Math.sin(a) * 7.7); p.rotation.y = -a; p.castShadow = true; p.receiveShadow = true;
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.62), this.accMat); band.position.y = h * 0.62 - h / 2; p.add(band);
      g.add(p);
    }
  }
  /* ---------- l'au-delà : les autres ailes de la Tour, le fond (magma, mer, nuages), des débris ---------- */
  buildWorld(s){
    const bt = bandTex();
    this.spireMat = new THREE.MeshStandardMaterial({color:"#1a1d27", roughness:0.9, emissive:new THREE.Color("#ff3d7f"), emissiveMap:bt, emissiveIntensity:0.7});
    const gA = Math.atan2(GDIR.z, GDIR.x);
    for(let i = 0; i < 16; i++){
      let a = gA + (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const off = Math.atan2(Math.sin(a - gA), Math.cos(a - gA));
      if(Math.abs(off) < 0.32) a += off < 0 ? -0.32 : 0.32;              /* la porte reste nette sur le ciel */
      /* (plus bas que nous : on est au sommet ; leurs toits flottent dans la brume) */
      const r = 80 + Math.random() * 90, w = 5 + Math.random() * 8, top = -24 + Math.random() * 26, h = top + 90;
      const geo = new THREE.BoxGeometry(w, h, w);
      const uv = geo.attributes.uv; for(let k = 0; k < uv.count; k++) uv.setY(k, uv.getY(k) * h / 24);
      const m = new THREE.Mesh(geo, this.spireMat); m.position.set(Math.cos(a) * r, top - h / 2, Math.sin(a) * r); m.rotation.y = Math.random() * 3;
      s.add(m);
      /* un toit : la plateforme d'une autre aile */
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.9, w * 0.7, 0.8, 8), this.rockMat); cap.position.set(m.position.x, top + 0.4, m.position.z); s.add(cap);
    }
    /* le fond : une étendue (lave, mer, nuages) loin dessous */
    const sc = document.createElement("canvas"); sc.width = sc.height = 256; const sg = sc.getContext("2d");
    sg.fillStyle = "#808080"; sg.fillRect(0, 0, 256, 256);
    for(let i = 0; i < 260; i++){ const v = 90 + Math.floor(Math.random() * 120); sg.fillStyle = `rgba(${v},${v},${v},.35)`; const r = 6 + Math.random() * 26; sg.beginPath(); sg.arc(Math.random() * 256, Math.random() * 256, r, 0, 7); sg.fill(); }
    const st = new THREE.CanvasTexture(sc); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(14, 14);
    this.seaMat = new THREE.MeshLambertMaterial({map:st, color:"#ffffff", emissive:new THREE.Color("#000"), emissiveMap:st});
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), this.seaMat); this.sea.position.y = -44; s.add(this.sea);
    /* des nuages sous la plateforme (l'aube, le ciel) */
    this.cloudMat = new THREE.MeshLambertMaterial({color:"#ffffff", emissive:new THREE.Color("#ffffff"), emissiveIntensity:0.25, transparent:true, opacity:0.92, flatShading:true});
    this.clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), this.cloudMat, 40);
    for(let i = 0; i < 40; i++){
      const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 70, sx = 6 + Math.random() * 10;
      _m.compose(V1.set(Math.cos(a) * r, -13 - Math.random() * 12, Math.sin(a) * r), _q.setFromEuler(_e.set(0, Math.random() * 3, 0)), _s.set(sx, sx * 0.32, sx * (0.6 + Math.random() * 0.4)));
      this.clouds.setMatrixAt(i, _m);
    }
    s.add(this.clouds);
    /* l'arc-en-ciel d'Ho-Oh, très loin derrière la porte */
    this.bow = new THREE.Mesh(new THREE.RingGeometry(150, 170, 96, 1, 0, Math.PI), new THREE.ShaderMaterial({vertexShader:BOW_VS, fragmentShader:BOW_FS, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{uR0:{value:150}, uR1:{value:170}, uA:{value:0.28}}}));
    this.bow.position.copy(GDIR).multiplyScalar(260); this.bow.position.y = -40; this.bow.lookAt(0, -40, 0); s.add(this.bow);
    /* des débris qui flottent autour */
    this.debMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.rockMat, 24); this.debris = [];
    /* (pas entre la caméra et l'arène : ils ne passent que sur les côtés et au loin) */
    for(let i = 0; i < 24; i++){ const a = -2.2 + Math.random() * 3.4, r = 13 + Math.random() * 14; this.debris.push({a, r, y:-8 + Math.random() * 8, s:0.25 + Math.random() * 0.8, sp:0.02 + Math.random() * 0.05, rot:Math.random() * 6}); }
    this.debMesh.castShadow = true; s.add(this.debMesh);
  }
  /* ---------- la porte du secteur, au bout de la passerelle ---------- */
  buildGate(s){
    const g = this.gate = new THREE.Group();
    g.position.copy(GDIR).multiplyScalar(GATE_D);
    g.rotation.y = Math.atan2(-GDIR.x, -GDIR.z);                        /* son +Z regarde l'arène */
    s.add(g);
    const stone = new THREE.MeshStandardMaterial({color:"#1c202a", roughness:0.85, metalness:0.15});
    /* le seuil, la passerelle et ses rambardes de lumière */
    const sill = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 7.5), stone); sill.position.set(0, -0.6, 0.6); sill.receiveShadow = true; g.add(sill);
    const L = GATE_D - 8.3 - 4.3, bz = 4.3 + L / 2;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, L + 0.6), stone); bridge.position.set(0, -0.3, bz); bridge.receiveShadow = true; g.add(bridge);
    for(const sx of [-1, 1]){
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, L + 0.6), this.accMat); rail.position.set(sx * 1.66, 0.55, bz); g.add(rail);
      for(let k = 0; k < 4; k++){ const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), stone); post.position.set(sx * 1.66, 0.25, bz - L / 2 + 0.3 + k * (L / 3)); g.add(post); }
    }
    const under = new THREE.Mesh(new THREE.ConeGeometry(7, 16, 7, 3, true), this.rockMat); under.rotation.x = Math.PI; under.position.set(0, -9, 0.6); g.add(under);
    /* les deux piliers, le linteau, des bandes à la couleur du gardien */
    for(const sx of [-1, 1]){
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 13, 1.4), stone); p.position.set(sx * 6.1, 6.5, 0); p.castShadow = true; g.add(p);
      for(const y of [1.2, 4.6, 8.2, 11.6]){ const b = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.1, 1.46), this.accMat); b.position.set(sx * 6.1, y, 0); g.add(b); }
    }
    const lin = new THREE.Mesh(new THREE.BoxGeometry(14.6, 1.2, 1.8), stone); lin.position.set(0, 13.4, 0); g.add(lin);
    const linB = new THREE.Mesh(new THREE.BoxGeometry(14.7, 0.1, 1.86), this.accMat); linB.position.set(0, 12.85, 0); g.add(linB);
    /* le champ qui ferme la porte */
    this.fieldU = {uC:{value:new THREE.Color()}, uT:{value:0}, uOpen:{value:0}, uMag:{value:0}};
    this.field = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 12.4), new THREE.ShaderMaterial({vertexShader:FIELD_VS, fragmentShader:FIELD_FS, uniforms:this.fieldU, transparent:true, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
    this.field.position.set(0, 6.2, 0); g.add(this.field);
    /* derrière : la lumière du secteur libéré */
    const lc = document.createElement("canvas"); lc.width = lc.height = 128; const lx = lc.getContext("2d");
    const lg = lx.createRadialGradient(64, 70, 4, 64, 70, 70); lg.addColorStop(0, "rgba(255,255,255,1)"); lg.addColorStop(0.4, "rgba(255,240,200,.8)"); lg.addColorStop(1, "rgba(255,220,160,0)");
    lx.fillStyle = lg; lx.fillRect(0, 0, 128, 128);
    this.glowMat = new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(lc), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
    this.glowP = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), this.glowMat); this.glowP.position.set(0, 6.4, -0.6); g.add(this.glowP);
    /* et la lumière qui coule de la porte ouverte vers l'arène */
    const rc = document.createElement("canvas"); rc.width = 8; rc.height = 128; const rx = rc.getContext("2d");
    const rg = rx.createLinearGradient(0, 0, 0, 128); rg.addColorStop(0, "rgba(255,240,210,0)"); rg.addColorStop(0.7, "rgba(255,240,210,.5)"); rg.addColorStop(1, "rgba(255,255,255,.9)");
    rx.fillStyle = rg; rx.fillRect(0, 0, 8, 128);
    this.rayMat = new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(rc), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false, fog:false});
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 10, 24, 24, 1, true), this.rayMat);
    ray.rotation.x = Math.PI / 2; ray.position.set(0, 6.0, 12); g.add(ray); this.ray = ray;
    this.gateLight = new THREE.PointLight("#fff0d0", 0, 46, 1.2); this.gateLight.position.set(0, 6.5, 2.5); g.add(this.gateLight);
  }
  /* ---------- le cadenas : des cubes de lumière ---------- */
  buildPad(){
    const P = this.pad = {cubes:[]};
    P.group = new THREE.Group(); P.group.position.set(0, PAD_Y, 1.0); this.gate.add(P.group);
    const add = (x, y, layers, core) => { for(const l of layers){
      const o = clamp(Math.hypot(x, (y - 7) * 1.1) / 11.5, 0, 1);
      P.cubes.push({gx:x, gy:y, h:new THREE.Vector3(x * VX, y * VX, l * VX), p:new THREE.Vector3(x * VX, y * VX, l * VX), v:new THREE.Vector3(), rot:new THREE.Vector3(), spin:new THREE.Vector3(),
        st:0, t0:0, th:0.62 * (1 - o) + 0.38 * Math.random(), sh:(y % 2 ? 1 : 0.84) * (0.9 + Math.random() * 0.2), life:1.3, from:new THREE.Vector3(), core});
    } };
    for(let y = 0; y < 12; y++) for(let x = -8; x <= 8; x++){
      const ax = Math.abs(x);
      if(((y === 0 || y === 11) && ax >= 7) || ((y === 1 || y === 10) && ax >= 8)) continue;       /* les coins arrondis */
      if(Math.hypot(x, y - 7) < 1.75 || (ax === 0 && y >= 3 && y <= 7)) continue;                    /* la serrure */
      add(x, y, [-1, 0, 1], Math.hypot(x, y - 7) < 3.2);
    }
    for(let y = 12; y < 20; y++) for(let x = -7; x <= 7; x++){ const d = Math.hypot(x, y - 12); if(d >= 4.3 && d <= 6.6) add(x, y, [-0.5, 0.5], false); }
    this.padMat = new THREE.MeshBasicMaterial({map:cubeTex(), transparent:true, depthWrite:false, toneMapped:false, side:THREE.DoubleSide});
    P.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.padMat, P.cubes.length);
    P.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); P.mesh.setColorAt(0, new THREE.Color()); P.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    P.mesh.frustumCulled = false; P.mesh.renderOrder = 4; P.group.add(P.mesh);
    /* le cœur de la serrure, et sa lumière */
    this.core = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.core.position.set(0, 7 * VX, -0.05); P.group.add(this.core);
    this.coreSlot = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 1.3), this.core.material); this.coreSlot.position.set(0, 5 * VX, -0.05); P.group.add(this.coreSlot);
    this.padLight = new THREE.PointLight("#ff3d7f", 6, 16, 1.4); this.padLight.position.set(0, 7 * VX, 1.6); P.group.add(this.padLight);
    this.keyW = new THREE.Vector3();
  }
  /* ---------- deux chaînes en croix derrière le cadenas ---------- */
  buildChains(){
    const links = this.links = [];
    const runs = [[-5.3, 11.6, 5.3, 0.9], [5.3, 11.6, -5.3, 0.9]];
    const cross = new THREE.Vector3(0, 6.25, 0.35);
    for(const [x0, y0, x1, y1] of runs){
      const A = new THREE.Vector3(x0, y0, 0.35), B = new THREE.Vector3(x1, y1, 0.35), len = A.distanceTo(B), n = Math.floor(len / 0.4);
      const dir = B.clone().sub(A).normalize(), nz = new THREE.Vector3(0, 0, 1);
      for(let k = 0; k <= n; k++){
        const f = k / n, p = A.clone().lerp(B, f); p.y -= Math.sin(f * Math.PI) * 0.35;
        const xA = dir.clone(), yA = new THREE.Vector3().crossVectors(nz, xA).normalize(), zA = new THREE.Vector3().crossVectors(xA, yA);
        const M = new THREE.Matrix4().makeBasis(xA, k % 2 ? zA : yA, k % 2 ? yA.clone().negate() : zA);
        const q = new THREE.Quaternion().setFromRotationMatrix(M);
        links.push({h:p.clone(), p:p.clone(), q, q0:q.clone(), v:new THREE.Vector3(), spin:new THREE.Vector3(), delay:p.distanceTo(cross) * 0.05, st:0});
      }
    }
    this.chainMat = new THREE.MeshStandardMaterial({color:"#2a2f3a", metalness:0.65, roughness:0.35, emissive:new THREE.Color("#ff3d7f"), emissiveIntensity:0.9});
    this.chain = new THREE.InstancedMesh(new THREE.TorusGeometry(0.2, 0.055, 6, 14), this.chainMat, links.length);
    this.chain.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.chain.castShadow = true; this.chain.frustumCulled = false;
    this.gate.add(this.chain);
    this.placeLinks(0, 0);
  }
  placeLinks(t, dt){
    const L = this.links;
    for(let i = 0; i < L.length; i++){
      const c = L[i];
      if(c.st === 1){
        const age = t - c.t0;
        if(age > 0){ c.v.y -= 9.8 * dt; c.p.addScaledVector(c.v, dt); _q.setFromEuler(_e.set(c.spin.x * age, c.spin.y * age, c.spin.z * age)); c.q.copy(c.q0).multiply(_q); }
        const sc = age > 1.8 ? Math.max(0, 1 - (age - 1.8) / 0.5) : 1;
        _m.compose(c.p, c.q, _s.set(1.5 * sc, sc, sc));
      } else _m.compose(c.p, c.q, _s.set(1.5, 1, 1));
      this.chain.setMatrixAt(i, _m);
    }
    this.chain.instanceMatrix.needsUpdate = true;
  }
  /* ---------- le rayon du gardien vers le cadenas ---------- */
  buildBeam(s){
    const geo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0);
    this.beamIn = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.beamOut = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:"#ff3d7f", transparent:true, opacity:0.25, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.beamIn.frustumCulled = this.beamOut.frustumCulled = false;
    s.add(this.beamIn, this.beamOut);
  }
  /* ---------- ce qui vole dans l'air ---------- */
  buildAir(s){
    const N = 700, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    this.air = {N, pos, col, vel:new Float32Array(N * 3), ph:new Float32Array(N)};
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.airPts = new THREE.Points(g, new THREE.PointsMaterial({size:0.16, map:this.dot, vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false}));
    this.airPts.frustumCulled = false; s.add(this.airPts);
    /* la pluie et le vent : des traits */
    const M = 520, lp = new Float32Array(M * 6);
    this.streak = {M, lp, vel:new Float32Array(M * 3)};
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(lp, 3).setUsage(THREE.DynamicDrawUsage));
    this.streaks = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color:"#c8d8ff", transparent:true, opacity:0.45, depthWrite:false}));
    this.streaks.frustumCulled = false; s.add(this.streaks);
    /* l'éclair, au loin */
    const bp = new Float32Array(14 * 3), bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
    this.bolt = new THREE.Line(bg, new THREE.LineBasicMaterial({color:"#ffffff", transparent:true, opacity:1, toneMapped:false, fog:false})); this.bolt.frustumCulled = false; this.bolt.visible = false; s.add(this.bolt);
  }
  /* un point de l'air : quelque part autour de l'arène et de la porte */
  spawn(i, any){
    const A = this.air, k = this.th.part, P = A.pos, Vv = A.vel, j = i * 3;
    const cx = GDIR.x * 7, cz = GDIR.z * 7;
    P[j] = cx + (Math.random() - 0.5) * 56; P[j + 2] = cz + (Math.random() - 0.5) * 56;
    const yLo = -8, yHi = 22;
    P[j + 1] = any ? yLo + Math.random() * (yHi - yLo) : (k === "snow" || k === "feather" ? yHi : yLo);
    A.ph[i] = Math.random() * 6.28;
    if(k === "ember"){ Vv[j] = (Math.random() - 0.5) * 0.6; Vv[j + 1] = 1.2 + Math.random() * 1.8; Vv[j + 2] = (Math.random() - 0.5) * 0.6; }
    else if(k === "snow"){ Vv[j] = 0.5 + Math.random() * 0.5; Vv[j + 1] = -(0.8 + Math.random() * 0.8); Vv[j + 2] = (Math.random() - 0.5) * 0.4; }
    else if(k === "feather"){ Vv[j] = (Math.random() - 0.5) * 0.4; Vv[j + 1] = -(0.35 + Math.random() * 0.4); Vv[j + 2] = (Math.random() - 0.5) * 0.4; }
    else if(k === "bubble"){ Vv[j] = 0; Vv[j + 1] = 0.6 + Math.random() * 1.1; Vv[j + 2] = 0; }
    else { Vv[j] = (Math.random() - 0.5) * 0.3; Vv[j + 1] = (Math.random() - 0.5) * 0.3; Vv[j + 2] = (Math.random() - 0.5) * 0.3; }
    const c = _c.set(k === "ember" ? (Math.random() < 0.5 ? this.th.acc : this.th.acc2) : k === "snow" ? "#ffffff" : k === "feather" ? (Math.random() < 0.6 ? "#ffd890" : "#ff8a6a")
      : k === "bubble" ? "#bff4ff" : (Math.random() < 0.5 ? this.th.acc : this.th.acc2));
    const b = k === "snow" ? 0.85 : k === "bubble" ? 0.55 : 1;
    A.col[j] = c.r * b; A.col[j + 1] = c.g * b; A.col[j + 2] = c.b * b;
  }
  spawnStreak(i, any){
    const S = this.streak, k = this.th.part, P = S.lp, Vv = S.vel, j = i * 6, w = i * 3;
    const cx = GDIR.x * 6 + (Math.random() - 0.5) * 60, cz = GDIR.z * 6 + (Math.random() - 0.5) * 60, y = any ? -10 + Math.random() * 36 : 26;
    if(k === "wind"){ const x = any ? cx : cx - 30; P[j] = x; P[j + 1] = -6 + Math.random() * 26; P[j + 2] = cz; Vv[w] = 22 + Math.random() * 14; Vv[w + 1] = 0; Vv[w + 2] = -4 - Math.random() * 3; }
    else { P[j] = cx; P[j + 1] = y; P[j + 2] = cz; Vv[w] = 1.5; Vv[w + 1] = -(20 + Math.random() * 8); Vv[w + 2] = 0.5; }
    P[j + 3] = P[j]; P[j + 4] = P[j + 1]; P[j + 5] = P[j + 2];
  }
  /* ---------- le gardien de ce combat, son thème ---------- */
  applyTheme(B){
    const id = B.lock && B.lock.id, th = this.th = LOCK_THEMES[id] || THEME0;
    const R = G().REGIONS || [], reg = R.find(r=>r.key === (B.lock && B.lock.r));
    this.reg = reg || null; this.gd = reg ? reg.guardians[B.lock.i] : null;
    const U = this.sky.material.uniforms;
    U.uTop.value.set(th.top); U.uBot.value.set(th.bot); U.uGlowC.value.set(th.glow); U.uGlowK.value = th.glowK;
    /* la brume a la couleur de l'horizon : les autres ailes, au loin, s'y fondent */
    const fog = new THREE.Color(th.bot).lerp(new THREE.Color(th.top), 0.22), fd = th.fd + 0.0025;
    this.scene.fog.color.copy(fog); this.scene.fog.density = fd; this.env.fog.copy(fog); this.env.fogDensity = fd;
    this.hemi.color.set(th.hemi[0]); this.hemi.groundColor.set(th.hemi[1]); this.hemiK = th.part === "rain" ? 0.95 : 1.1;
    this.sun.color.set(th.glow).lerp(WHITE, 0.55);
    this.acc = new THREE.Color(th.acc); this.acc2 = new THREE.Color(th.acc2);
    for(const m of [this.floorMat, this.spireMat, this.chainMat]) m.emissive.copy(this.acc);
    this.accMat.color.copy(this.acc);
    this.rockMat.color.set(th.rock);
    this.seaMat.color.set(th.sea); this.seaMat.emissive.set(th.sea).multiplyScalar(th.seaK);
    this.clouds.visible = !!th.clouds; this.cloudMat.color.set(th.part === "wind" ? "#ffffff" : "#ffe6cc"); this.cloudMat.emissive.set(th.part === "wind" ? "#cfe6ff" : "#ffb890");
    this.bow.visible = !!th.rainbow;
    this.fieldU.uC.value.copy(this.acc);
    this.beamOut.material.color.copy(this.acc); this.core.material.color.copy(this.acc2);
    this.padLight.color.copy(this.acc);
    const pk = th.part;
    this.airPts.visible = pk !== "rain" && pk !== "wind";
    this.airPts.material.size = pk === "bubble" ? 0.3 : pk === "feather" ? 0.26 : pk === "snow" ? 0.2 : pk === "mote" ? 0.22 : 0.15;
    this.streaks.visible = pk === "rain" || pk === "wind";
    this.streaks.material.color.set(pk === "wind" ? "#ffffff" : "#b8c8e8"); this.streaks.material.opacity = pk === "wind" ? 0.35 : 0.42;
    for(let i = 0; i < this.air.N; i++) this.spawn(i, true);
    this.airPts.geometry.attributes.color.needsUpdate = true;
    for(let i = 0; i < this.streak.M; i++) this.spawnStreak(i, true);
  }
  /* ---------- entrer, sortir ---------- */
  enter(B){
    if(!this.built) this.build();
    this.on = true; this.B = B;
    this.applyTheme(B);
    this.seenBanner = null; this.phase = null; this.shattered = 0; this.lost = 0; this.freed = false; this.rel = null;
    this.magK = 0; this.shake = 0; this.flash = 0; this.nextBolt = 2 + Math.random() * 3; this.padFlash = 0; this.lastHurt = 0; this.koSeen = 0;
    this.beamK = 0; this.gR = null; this.gVis = false; this.lowSince = 0;
    for(const c of this.pad.cubes){ c.st = 0; c.p.copy(c.h); }
    for(const c of this.links){ c.st = 0; c.p.copy(c.h); c.q.copy(c.q0); }
    this.placeLinks(0, 0);
    this.fieldU.uOpen.value = 0; this.fieldU.uMag.value = 0; this.glowMat.opacity = 0; this.rayMat.opacity = 0; this.gateLight.intensity = 0;
    this.core.visible = this.coreSlot.visible = true;
    this.gate.updateMatrixWorld(true);
    this.pad.group.localToWorld(this.keyW.set(0, 7 * VX, 0.2));
    this.game.engine.useScene(this.scene, this.camera);
    const sp = this.game.capture && this.game.capture.sparks;
    if(sp) this.scene.add(sp.points);
  }
  exit(){
    this.endRelease();
    this.on = false;
    document.body.classList.remove("lockrel");
    const sp = this.game.capture && this.game.capture.sparks;
    if(sp) this.game.engine.scene.add(sp.points);
    const g = this.game;
    if(g.story3d && g.story3d.on) return;
    if(g.breche3d && g.breche3d.on) g.engine.useScene(g.breche3d.scene, g.breche3d.camera);
    else g.engine.useScene(null);
  }
  /* ---------- Tower3D demande : la place du gardien, sa pose ---------- */
  /* (appelé pour chaque Pokémon avant qu'il soit dessiné) */
  pose(u, r, pos, o, T, t){
    if(!u.guardian) return;
    this.gR = r;
    const m = r.m, U = m.uniforms, v = u._v || {};
    /* promu pare-feu : la palette de la faille, un liseré magenta ; plus fort une fois reconfiguré ; il s'éteint quand il cède */
    let cor = this.phase ? 0.36 : 0.12;
    if(v.ko) cor *= 1 - clamp((T - v.ko) / 900, 0, 1);
    let gold = 0, lift = 0, alpha = 1;
    const R = this.rel;
    if(R){
      const k = t - R.t0;
      gold = sstep(0, 1.3, k) * 0.45; lift = sstep(0.9, 4.8, k) * 3.6; alpha = 1 - sstep(3.6, 5.0, k);
      if(!calmFx()) o.flash = Math.max(o.flash, 0.25 * sstep(0, 0.5, k) * (1 - sstep(0.5, 1.4, k)));
      o.anim = "idle";
    }
    if(U.uCorrupt) U.uCorrupt.value = cor;
    if(U.uTintC) U.uTintC.value.set(1.0, 0.86, 0.48, gold);
    if(U.uAlpha) U.uAlpha.value = alpha;
    pos.y += lift;
    if(this.freed || alpha < 0.02) o.vis = false;
    this.gVis = o.vis; this.gLift = lift;
  }
  /* ---------- à chaque image ---------- */
  update(t, dt, T, B, V, recs, tw){
    const calm = calmFx(), sp = this.game.capture && this.game.capture.sparks;
    const gR = this.gR, gu = gR && gR.u, gv = (gu && gu._v) || {};
    /* ce que la scène mobile annonce */
    const Bn = V.banner;
    if(Bn && Bn !== this.seenBanner && T >= Bn.t0){
      this.seenBanner = Bn;
      if(Bn.txt === "RECONFIGURATION") this.onPhase(t, gR, sp, calm);
      if(Bn.txt === "VICTOIRE") this.onShatter(t, gR, sp, calm);
      if(Bn.txt === "DÉFAITE") this.lost = t;
    }
    /* au cas où une bannière passerait à la trappe */
    const hp = gu ? clamp((gv.hp !== undefined ? gv.hp : gu.hp) / gu.maxHp, 0, 1) : 1;
    if(gu && gu.phased && !this.phase && hp < 0.5){ if(!this.lowSince) this.lowSince = t; else if(t - this.lowSince > 2) this.onPhase(t, gR, sp, calm); }
    if(gu && B.over && B.result && gv.ko && T - gv.ko > 2600 && !this.shattered) this.onShatter(t, gR, sp, calm);
    /* les dégâts du gardien arrachent des cubes au cadenas ; la reconfiguration les remet */
    let D = 0;
    if(gu) D = this.phase ? 0.9 * clamp((0.5 - hp) / 0.5, 0, 1) : 0.55 * clamp((1 - hp) / 0.5, 0, 1);
    if(gv.hurt && gv.hurt !== this.lastHurt){ this.lastHurt = gv.hurt; this.shake = 1; this.padFlash = Math.max(this.padFlash, 0.5); }
    if(gv.ko && gv.ko !== this.koSeen){
      this.koSeen = gv.ko;
      /* le rayon se rompt */
      if(sp && gR){ sp.burst(gR.pos.clone().add(V1.set(0, gR.H * 0.85, 0)), 30, ["#ffffff", this.th.acc, this.th.acc2], 3.2, 0.7, 0.8); sp.burst(this.keyW.clone(), 24, ["#ffffff", this.th.acc2], 3, 0.6, 0.6); }
    }
    this.shake = Math.max(0, this.shake - dt * 4.5);
    this.padFlash = Math.max(0, this.padFlash - dt * 2.4);
    this.magK += ((this.phase ? 0.5 : 0) - this.magK) * Math.min(1, dt * 2);
    this.updatePad(t, dt, D, calm);
    if(this.shattered) this.placeLinks(t, dt);
    this.updateBeam(t, dt, gR, gu, gv, T, sp, calm);
    this.updateGate(t, dt);
    this.updateAir(t, dt, calm);
    this.updateRelease(t, dt, gR, sp, calm);
    /* les débris tournent lentement */
    this.debris.forEach((d, i)=>{ d.rot += dt * d.sp * 3; const a = d.a + Math.sin(t * d.sp * 2 + i) * 0.15;
      _m.compose(V1.set(Math.cos(a) * d.r, d.y + Math.sin(t * 0.4 + i) * 0.3, Math.sin(a) * d.r), _q.setFromEuler(_e.set(d.rot, d.rot * 0.7, 0)), _s.set(d.s, d.s, d.s)); this.debMesh.setMatrixAt(i, _m); });
    this.debMesh.instanceMatrix.needsUpdate = true;
    /* l'onde de la reconfiguration */
    if(this.phase && this.phase.at){ const k = (t - this.phase.t0) / 1.1; this.wave.visible = k < 1;
      if(this.wave.visible){ this.wave.position.set(this.phase.at.x, 0.04, this.phase.at.z); this.wave.scale.setScalar(1 + k * 13); this.wave.material.opacity = 0.9 * (1 - k); } }
    else this.wave.visible = false;
    /* la lumière, l'image */
    const fl = this.flash; this.flash = Math.max(0, this.flash - dt * 5);
    this.hemi.intensity = this.hemiK + fl * 2.2;
    this.sky.material.uniforms.uFlash.value = fl * 0.6;
    this.game.engine.setExposure(1);
    this.tear = Math.max(0, (this.tear || 0) - dt * 2.4);
    const E = this.game.engine;
    if(E.corrupt) E.corrupt.set(this.shattered ? 0 : 0.06 + this.magK * 0.12, calm ? 0 : this.tear, t, calm);
    this.camera.updateMatrixWorld();
    this.gR = null;
  }
  onPhase(t, gR, sp, calm){
    if(this.phase || this.shattered) return;
    this.phase = {t0:t, at:gR ? gR.pos.clone() : null};
    this.tear = calm ? 0 : 0.7; this.padFlash = 1; this.shake = 1.2;
    this.chainMat.emissive.copy(MAG);
    if(this.th.bolts && !calm) this.strike();
    /* les cubes perdus reviennent, de loin */
    if(sp) sp.burst(this.keyW.clone(), 40, ["#ff3d7f", "#ffffff", this.th.acc], 4, 0.8, 1);
  }
  onShatter(t, gR, sp, calm){
    if(this.shattered) return;
    this.shattered = t; this.padFlash = 1.4; this.tear = calm ? 0 : 0.35;
    const K = V1.set(0, 7 * VX, 0);
    for(const c of this.pad.cubes){
      if(c.st === 2) continue;
      const d = V2.copy(c.p).sub(K); const L = d.length() || 1; d.divideScalar(L);
      c.st = 1; c.t0 = t + Math.random() * 0.12; c.life = 1.8 + Math.random() * 0.9;
      c.v.copy(d).multiplyScalar(3 + Math.random() * 6).add(V3.set((Math.random() - 0.5) * 2, 1.5 + Math.random() * 2.5, 2 + Math.random() * 3));
      c.spin.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
    }
    for(const c of this.links){ c.st = 1; c.t0 = t + c.delay; c.v.set((Math.random() - 0.5) * 2.4, 0.6 + Math.random() * 1.6, 0.8 + Math.random() * 1.6); c.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8); }
    this.chainMat.emissive.copy(GOLD);
    if(sp){ sp.burst(this.keyW.clone(), 70, ["#ffffff", "#ffe9a8", "#ffd84a", this.th.acc2], 6, 1.0, 1.2); }
  }
  /* un éclair, au loin (Raikou, Lugia) */
  strike(){
    this.flash = 1;
    const a = Math.atan2(GDIR.z, GDIR.x) + (Math.random() - 0.5) * 1.6, r = 70 + Math.random() * 60;
    let x = Math.cos(a) * r, z = Math.sin(a) * r, y = 70;
    const P = this.bolt.geometry.attributes.position;
    for(let i = 0; i < 14; i++){ P.setXYZ(i, x, y, z); x += (Math.random() - 0.5) * 9; z += (Math.random() - 0.5) * 9; y -= 7 + Math.random() * 3; }
    P.needsUpdate = true; this.bolt.visible = true; this.boltT = 0.18;
  }
  updatePad(t, dt, D, calm){
    const P = this.pad, cubes = P.cubes, mesh = P.mesh;
    const sh = calm ? 0 : this.shake, jx = sh ? (Math.random() - 0.5) * 0.14 * sh : 0, jy = sh ? (Math.random() - 0.5) * 0.08 * sh : 0;
    const base = _c.copy(this.acc).lerp(MAG, this.magK);
    const flash = this.padFlash, shat = this.shattered;
    const col = new THREE.Color();
    for(let i = 0; i < cubes.length; i++){
      const c = cubes[i];
      const want = !shat && c.th >= D;
      if(want && (c.st === 1 || c.st === 2)){
        c.from.copy(c.st === 2 ? V1.copy(c.h).add(V2.set((Math.random() - 0.5) * 9, (Math.random() - 0.3) * 6, 2 + Math.random() * 5)) : c.p);
        c.st = 3; c.t0 = t;
      } else if(!want && (c.st === 0 || c.st === 3) && !shat){
        const d = V1.copy(c.h).sub(V2.set(0, 7 * VX, 0)).normalize();
        c.st = 1; c.t0 = t; c.life = 1.3;
        c.v.copy(d).multiplyScalar(1.4 + Math.random() * 2.2).add(V2.set(0, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5));
        c.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      }
      let sc = VX, rx = 0, ry = 0, rz = 0;
      if(c.st === 0){
        c.p.copy(c.h); c.p.x += jx; c.p.y += jy;
        sc = VX * (1 + (calm ? 0 : 0.05 * Math.sin(t * 2.2 + c.gy * 0.7)));
        col.copy(base).multiplyScalar(c.sh).lerp(WHITE, 0.06 + flash * 0.5 * (c.core ? 1 : 0.6));
      } else if(c.st === 1){
        const age = t - c.t0;
        if(age < 0){ c.p.copy(c.h); col.copy(base).lerp(WHITE, 0.6); }
        else {
          c.v.y -= (shat ? 4.2 : 6.5) * dt; c.p.addScaledVector(c.v, dt);
          rx = c.spin.x * age; ry = c.spin.y * age; rz = c.spin.z * age;
          const k = age / c.life; sc = VX * Math.max(0, 1 - k * k);
          col.copy(shat ? GOLD : base).lerp(WHITE, Math.max(0, 1 - age * 3) * 0.8);
          if(age >= c.life){ c.st = 2; sc = 0; }
        }
      } else if(c.st === 2){ sc = 0; col.copy(base); }
      else if(c.st === 3){
        const k = clamp((t - c.t0) / 0.8, 0, 1), e = 1 - Math.pow(1 - k, 3);
        c.p.copy(c.from).lerp(c.h, e); sc = VX * (0.4 + 0.6 * e);
        col.copy(MAG).lerp(base, e).lerp(WHITE, (1 - e) * 0.4);
        if(k >= 1) c.st = 0;
      }
      _m.compose(c.p, _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sc, sc, sc));
      mesh.setMatrixAt(i, _m); mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    /* le cœur de la serrure : il bat ; il s'éteint quand le cadenas éclate */
    const beat = calm ? 0.85 : 0.75 + 0.25 * Math.sin(t * (this.phase ? 6 : 3.4));
    this.core.visible = this.coreSlot.visible = !shat || t - shat < 0.25;
    this.core.material.color.copy(this.acc2).lerp(MAG, this.magK).lerp(WHITE, flash * 0.5).multiplyScalar(beat + flash);
    this.core.scale.setScalar(1 + flash * 0.4);
    this.padLight.color.copy(this.acc).lerp(MAG, this.magK);
    this.padLight.intensity = shat ? Math.max(0, 30 * (1 - (t - shat) / 0.8)) : (5 + beat * 3 + flash * 14) * (this.lost ? 1.8 : 1);
    if(!this.shattered && this.chainMat.emissive.getHex() !== this.acc.getHex()) this.chainMat.emissive.lerp(this.acc, Math.min(1, dt * 1.5));
    this.chainMat.emissiveIntensity = 0.75 + flash * 1.4;
  }
  updateBeam(t, dt, gR, gu, gv, T, sp, calm){
    const on = gR && this.gVis && !this.shattered && !gv.ko;
    /* il se tend à l'entrée du gardien */
    let want = on ? 1 : 0;
    if(on && gv.enter){ const k = (T - gv.enter.t0) / gv.enter.dur; want = clamp((k - 0.4) / 0.6, 0, 1); }
    this.beamK = want > this.beamK ? Math.min(want, this.beamK + dt * 2.5) : want;
    const vis = this.beamK > 0.01;
    this.beamIn.visible = this.beamOut.visible = vis;
    if(!vis) return;
    const from = V1.copy(gR.pos).add(V2.set(0, gR.H * 0.82, 0)), to = this.keyW;
    const dir = V3.subVectors(to, from), len = dir.length() * this.beamK; dir.normalize();
    _q.setFromUnitVectors(UP, dir);
    const fl = calm ? 1 : (gv.hurt && T - gv.hurt < 260 ? (Math.random() < 0.5 ? 0.2 : 1) : 0.85 + 0.15 * Math.sin(t * 13));
    const w = this.lost ? 1.8 : 1;
    for(const [m, r] of [[this.beamIn, 0.05 * w], [this.beamOut, 0.2 * w]]){ m.position.copy(from); m.quaternion.copy(_q); m.scale.set(r, len, r); }
    this.beamIn.material.opacity = 0.85 * fl; this.beamOut.material.opacity = 0.28 * fl;
    this.beamOut.material.color.copy(this.acc).lerp(MAG, this.magK);
    /* l'énergie monte du gardien vers le cadenas */
    if(sp && !calm && this.beamK >= 1 && t - (this.lastStream || 0) > 0.8){ this.lastStream = t; sp.stream(from.clone(), to.clone(), 12, "#" + _c.copy(this.acc).lerp(MAG, this.magK).getHexString()); }
  }
  updateGate(t, dt){
    const U = this.fieldU, sh = this.shattered;
    U.uT.value = t; U.uMag.value = this.magK;
    const open = sh ? sstep(0.25, 1.9, t - sh) : 0;
    U.uOpen.value = open;
    this.field.visible = open < 0.999;
    this.glowMat.opacity = open;
    const rel = this.rel ? sstep(0, 1.5, t - this.rel.t0) : 0;
    this.rayMat.opacity = open * (0.1 + rel * 0.12);
    this.ray.visible = open > 0.01;
    this.gateLight.intensity = open * (22 + rel * 20);
  }
  updateAir(t, dt, calm){
    const k = this.th.part, A = this.air;
    if(this.airPts.visible){
      const P = A.pos, Vv = A.vel, sw = k === "feather" ? 1.2 : k === "snow" ? 0.5 : k === "bubble" ? 0.35 : k === "mote" ? 0.25 : 0.2;
      for(let i = 0; i < A.N; i++){
        const j = i * 3, ph = A.ph[i];
        P[j] += (Vv[j] + Math.sin(t * 1.3 + ph) * sw) * dt; P[j + 1] += Vv[j + 1] * dt; P[j + 2] += (Vv[j + 2] + Math.cos(t * 1.1 + ph) * sw) * dt;
        if(P[j + 1] > 24 || P[j + 1] < -10) this.spawn(i, false);
      }
      this.airPts.geometry.attributes.position.needsUpdate = true;
      this.airPts.geometry.attributes.color.needsUpdate = true;
    }
    if(this.streaks.visible){
      const S = this.streak, P = S.lp, Vv = S.vel, Lk = k === "wind" ? 0.09 : 0.03;
      for(let i = 0; i < S.M; i++){
        const j = i * 6, w = i * 3;
        P[j] += Vv[w] * dt; P[j + 1] += Vv[w + 1] * dt; P[j + 2] += Vv[w + 2] * dt;
        P[j + 3] = P[j] - Vv[w] * Lk; P[j + 4] = P[j + 1] - Vv[w + 1] * Lk; P[j + 5] = P[j + 2] - Vv[w + 2] * Lk;
        if(P[j + 1] < -12 || P[j] > GDIR.x * 6 + 40) this.spawnStreak(i, false);
      }
      this.streaks.geometry.attributes.position.needsUpdate = true;
    }
    if(this.th.bolts && !calm){
      this.nextBolt -= dt;
      if(this.nextBolt <= 0){ this.nextBolt = 3 + Math.random() * 5; this.strike(); }
    }
    if(this.bolt.visible){ this.boltT -= dt; this.bolt.material.opacity = Math.max(0, this.boltT / 0.18); if(this.boltT <= 0) this.bolt.visible = false; }
  }
  /* ---------- la première victoire : le gardien cède sur place ---------- */
  release(g, onDone){
    if(!this.on) return false;
    if(this.rel && !this.rel.quiet) return true;
    /* (si la bannière de victoire n'a pas encore été vue, le cadenas éclate maintenant) */
    if(!this.shattered) this.onShatter(this.game.t, null, this.game.capture && this.game.capture.sparks, calmFx());
    const q = "« " + (g.bye || "") + " »";
    this.rel = {g, q, t0:this.rel ? this.rel.t0 : this.game.t, done:onDone, quiet:false, full:false, ended:false,
      dur:Math.max(6.2, 1.4 + q.length / 34 + 2.8)};
    document.body.classList.add("lockrel");
    this.relKey = e => {
      if(!this.rel || this.rel.ended || this.rel.quiet) return;
      if(e.type === "keydown" && !(e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter")) return;
      if(e.type === "pointerdown" && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      if(this.game.t - this.rel.t0 < 0.8) return;
      if(!this.rel.full){ this.rel.full = true; this.rel.dur = Math.max(this.game.t - this.rel.t0 + 2.2, 5.2); }
      else this.endRelease();
    };
    addEventListener("keydown", this.relKey, true); addEventListener("pointerdown", this.relKey, true);
    return true;
  }
  endRelease(){
    const R = this.rel; if(!R || R.ended) return;
    R.ended = true; this.freed = true;
    document.body.classList.remove("lockrel");
    if(this.relKey){ removeEventListener("keydown", this.relKey, true); removeEventListener("pointerdown", this.relKey, true); this.relKey = null; }
    if(R.done) try { R.done(); } catch(e){}
  }
  updateRelease(t, dt, gR, sp, calm){
    /* déjà levé (on rejoue le verrou) : il cède aussi, sans un mot, derrière le bilan */
    if(this.shattered && !this.rel && t - this.shattered > 4.2 && gR) this.rel = {quiet:true, t0:t, dur:5.2, ended:false};
    const R = this.rel; if(!R || R.ended) return;
    const k = t - R.t0;
    if(gR && sp && !calm && k < 5 && t - (this.lastRise || 0) > 0.09){
      this.lastRise = t;
      const a = Math.random() * 6.28, rr = gR.H * 0.4;
      sp.burst(gR.pos.clone().add(V1.set(Math.cos(a) * rr, gR.H * (0.2 + Math.random() * 0.8), Math.sin(a) * rr)), 3, ["#ffe9a8", "#ffffff", "#ffd84a"], 0.8, 1.2, 3);
    }
    if(R.quiet ? k > R.dur : k > R.dur) { if(R.quiet){ R.ended = true; this.freed = true; } else this.endRelease(); }
  }
  /* ---------- la caméra : l'entrée du gardien, sa reconfiguration, la victoire ---------- */
  shot(T, V, tw){
    const gR = [...tw.recs.values()].find(r=>r.u.guardian);
    if(!gR) return null;
    /* (on vise sa place, pas lui : il y arrive en marchant, il en part pour frapper) */
    const at = new THREE.Vector3(tw.root.x + this.bossSlot[0], tw.root.y, tw.root.z + this.bossSlot[1]);
    const bump = q => q < 0 || q >= 1 ? 0 : q < 0.2 ? q / 0.2 : q > 0.8 ? (1 - q) / 0.2 : 1;
    let k = 0, kind = "in";
    const C = V.cut; if(C && C.kind === "boss" && C.u === gR.u) k = Math.max(k, bump((T - C.t0 + 300) / (C.dur + 800)));
    const Bn = V.banner; if(Bn && Bn.txt === "RECONFIGURATION"){ const q = bump((T - Bn.t0) / 1900); if(q > k){ k = q; kind = "phase"; } }
    const t = this.game.t;
    if(this.shattered){ const q = sstep(0, 0.9, t - this.shattered); if(q > k){ k = q; kind = "win"; } }
    if(k <= 0) return null;
    /* de face, depuis la caméra du combat ; plus bas, plus près ; la porte et le cadenas au-dessus de lui */
    const home = V1.copy(tw.root).add(V2.set(-8.8, 4.1, 9.1));
    const d = V2.subVectors(home, at); d.y = 0; d.normalize();
    const side = V3.set(d.z, 0, -d.x);
    const H = gR.H, lift = this.gLift || 0;
    let pos, look;
    if(kind === "win"){
      const rk = this.rel ? sstep(0, 4.5, t - this.rel.t0) : 0;
      pos = at.clone().addScaledVector(d, 7.4 - rk * 0.8).addScaledVector(side, -1.0).add(new THREE.Vector3(0, 2.0 + rk * 1.0, 0));
      look = at.clone().add(new THREE.Vector3(0, H * 0.6 + lift * 0.9, 0)).lerp(this.keyW, 0.28 + rk * 0.1);
    } else {
      pos = at.clone().addScaledVector(d, kind === "phase" ? 6.6 : 6.0).addScaledVector(side, -0.9).add(new THREE.Vector3(0, kind === "phase" ? 3.2 : 2.7, 0));
      look = at.clone().add(new THREE.Vector3(0, H * 0.62, 0)).lerp(this.keyW, 0.32);
    }
    k = k * k * (3 - 2 * k);
    return {pos, look, k, arc:2.4};
  }
  /* ---------- par-dessus : l'entrée du gardien, ses derniers mots ---------- */
  cut(x, C, T){
    const W = innerWidth, H = innerHeight, k = (T - C.t0) / C.dur;
    const inK = Math.min(1, k / 0.18), outK = k > 0.8 ? (k - 0.8) / 0.2 : 0;
    const slide = (1 - Math.pow(1 - inK, 3)) - outK * outK, cy = H * 0.66, bh = Math.max(104, H * 0.15);
    const th = this.th, gd = this.gd, reg = this.reg;
    x.save();
    x.globalAlpha = Math.max(0, Math.min(1, slide * 1.2));
    x.translate(W * (1 - slide) * 0.6, 0);
    x.beginPath(); x.moveTo(-40, cy - bh / 2 + 18); x.lineTo(W + 40, cy - bh / 2 - 18); x.lineTo(W + 40, cy + bh / 2 - 18); x.lineTo(-40, cy + bh / 2 + 18); x.closePath();
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(4,4,10,.92)"); g.addColorStop(0.6, "rgba(4,4,10,.78)"); g.addColorStop(1, "rgba(4,4,10,0)");
    x.fillStyle = g; x.fill(); x.strokeStyle = th.acc; x.lineWidth = 2; x.stroke(); x.clip();
    /* des cubes qui glissent dans la bande, comme ceux du cadenas */
    x.globalCompositeOperation = "lighter";
    for(let i = 0; i < 18; i++){
      const s = 6 + (i * 7) % 10, yy = cy - bh / 2 + ((i * 41) % bh), xx = ((i * 113 + T * 0.35) % (W + 200)) - 100;
      x.globalAlpha = 0.18 + (i % 3) * 0.08; x.strokeStyle = i % 4 ? th.acc : "#ff3d7f"; x.lineWidth = 1.5; x.strokeRect(xx, yy, s, s);
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = Math.max(0, Math.min(1, slide * 1.2));
    const L = Math.max(48, W * 0.08);
    x.textAlign = "left"; x.textBaseline = "middle";
    x.font = '11px "Press Start 2P",monospace'; x.fillStyle = th.acc;
    x.fillText(`VERROU · ${reg ? reg.name.toUpperCase() : "?"}${gd && gd.core ? " · NOYAU" : ""}`, L, cy - 30);
    const name = (gd ? gd.name : (C.n || "")).toUpperCase();
    x.font = '34px "Press Start 2P",monospace'; x.lineWidth = 7; x.strokeStyle = "#000"; x.strokeText(name, L, cy + 6);
    x.fillStyle = "#ffffff"; x.fillText(name, L, cy + 6);
    if(gd){ x.font = '15px "Pixelify Sans",sans-serif'; x.fillStyle = "#d8dce8"; x.fillText(gd.title + " · niveau " + (C.u.level || ""), L, cy + 40); }
    x.restore();
  }
  overlay(x, T, V, B){
    const R = this.rel; if(!R || R.quiet || R.ended) return;
    const W = innerWidth, H = innerHeight, k = this.game.t - R.t0, g = R.g;
    const out = 1 - sstep(R.dur - 0.5, R.dur, k);
    /* en haut : VERROU LEVÉ, son nom, son titre */
    x.save(); x.textAlign = "center"; x.textBaseline = "middle";
    x.globalAlpha = sstep(0.3, 1.0, k) * out;
    const y0 = Math.max(64, H * 0.11);
    x.font = '12px "Press Start 2P",monospace'; x.fillStyle = "#ffd84a"; x.fillText("VERROU LEVÉ", W / 2, y0);
    x.fillRect(W / 2 - 170, y0 + 15, 340, 1);
    x.font = '30px "Press Start 2P",monospace'; x.lineWidth = 7; x.strokeStyle = "rgba(0,0,0,.85)"; x.strokeText(g.name.toUpperCase(), W / 2, y0 + 46);
    x.fillStyle = "#fff4d6"; x.fillText(g.name.toUpperCase(), W / 2, y0 + 46);
    x.font = '17px "Pixelify Sans",sans-serif'; x.lineWidth = 4; x.strokeStyle = "rgba(0,0,0,.75)"; x.strokeText(g.title || "", W / 2, y0 + 82);
    x.fillStyle = "#ffe6b0"; x.fillText(g.title || "", W / 2, y0 + 82);
    /* en bas : ses derniers mots, qui s'écrivent */
    const q = R.q, n = R.full ? q.length : Math.floor(clamp((k - 1.4) * 34, 0, q.length));
    if(n > 0){
      x.font = '21px "Pixelify Sans",sans-serif';
      const maxW = Math.min(820, W * 0.8), words = q.split(" "), lines = [];
      let cur = "";
      for(const w of words){ const tst = cur ? cur + " " + w : w; if(x.measureText(tst).width > maxW && cur){ lines.push(cur); cur = w; } else cur = tst; }
      if(cur) lines.push(cur);
      const lh = 30, by = H - 70 - lines.length * lh;
      const gr = x.createLinearGradient(0, by - 40, 0, H); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.35, "rgba(2,3,8,.62)"); gr.addColorStop(1, "rgba(2,3,8,.8)");
      x.globalAlpha = out * sstep(1.2, 1.7, k); x.fillStyle = gr; x.fillRect(0, by - 40, W, H - by + 40);
      x.globalAlpha = out; x.textAlign = "left";
      let left = n;
      lines.forEach((ln, i)=>{
        if(left <= 0) return;
        const part = ln.slice(0, left); left -= ln.length + 1;
        const lw = x.measureText(ln).width, lx = W / 2 - lw / 2, ly = by + i * lh + lh / 2;
        x.lineWidth = 4; x.strokeStyle = "rgba(0,0,0,.7)"; x.strokeText(part, lx, ly); x.fillStyle = "#fff6e0"; x.fillText(part, lx, ly);
      });
      if(R.full || n >= q.length){
        x.textAlign = "right"; x.font = '14px "Pixelify Sans",sans-serif'; x.fillStyle = "rgba(255,246,224,.75)";
        x.globalAlpha = out * (0.55 + 0.45 * Math.sin(this.game.t * 3));
        x.fillText("clic ou Espace pour continuer", W - 28, H - 26);
      }
    }
    x.restore();
  }
}
