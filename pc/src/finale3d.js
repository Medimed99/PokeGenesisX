/* ============================================================
   LA FIN EN 3D · LE COMBAT DANS LA COUCHE ZÉRO
   Le combat final garde le moteur de la Tour (le jeu mobile décide de
   tout, Tower3D le montre) ; ici, ce qui le rend unique :
     · le lieu : la Couche Zéro, sous les trois secteurs — le sol
       quadrillé, le cercle, les trois couches du monde empilées de
       travers au-dessus, des tuiles qui tombent (le décor du récit) ;
     · MissingNo en voxels : la fêlure qui respire, qui se déchire de
       plus en plus à chaque phase, qui s'ouvre à « Regarde mon nom »
       et devient le L de ton nom ; vaincu, il se tasse sur place ;
     · les échos : tes Pokémon, rejoués par la faille (teinte magenta) ;
     · Porygon-Z, en hologramme derrière ton équipe : il parle, et à un
       tiers de la vie de MissingNo, il intervient une fois (bouclier,
       purge, Synchro pleine) — des rayons vers chacun, des bulles ;
     · EFFACER : une ligne magenta balaie l'arène, les bulles éclatent.
   ============================================================ */
import * as THREE from "three";
import { SETS3D } from "./story/sets.js";
import { MonActor } from "./story/actors.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const UP = new THREE.Vector3(0, 1, 0);
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();
const COLC = new Map();
function colOf(r, g, b){ const k = (r << 16) | (g << 8) | b; let c = COLC.get(k); if(!c){ c = new THREE.Color(`rgb(${r},${g},${b})`); COLC.set(k, c); if(COLC.size > 4000) COLC.clear(); } return c; }

const SKY_VS = `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `varying vec3 vD; uniform vec3 uTop, uBot; void main(){ float y = vD.y; gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.08, 0.55, y)), 1.0); }`;

/* ============================================================
   MISSINGNO, EN VOXELS
   La même image que sur mobile (37-cine : la fêlure qui respire, puis
   le L tiré de ton nom), redessinée à chaque image dans une petite
   toile, comme fnDrawMN la dessine dans l'arène : déchirée en tranches,
   doublée d'un écho lumineux ; chaque pixel allumé devient un cube.
   Le moteur de la Tour lui parle comme à un modèle : glitch, éclair,
   attaque ; vaincu, il se tasse (koK, de 0 à 1).
   ============================================================ */
const MN_CAP = 3600;
export class MnVox {
  constructor(scene, u, o = {}){
    this.scene = scene; this.u = u; this.H = o.height || 2.7;
    this.px = this.H / 56; this.W = 84; this.Hc = 72; this.foot = 6;
    this.cv = document.createElement("canvas"); this.cv.width = this.W; this.cv.height = this.Hc;
    this.x = this.cv.getContext("2d", {willReadFrequently:true}); this.x.imageSmoothingEnabled = false;
    this.mat = new THREE.MeshStandardMaterial({roughness:0.55, metalness:0, flatShading:true, emissive:"#ffffff", emissiveIntensity:0.55});
    this.mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance *= vColor;"); };
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.mat, MN_CAP);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color()); this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.group = new THREE.Group(); this.group.add(this.mesh); scene.add(this.group);
    /* une ombre trouble au sol : il n'a pas de pieds, mais il pèse */
    const sc = document.createElement("canvas"); sc.width = sc.height = 64; const sg = sc.getContext("2d"), gr = sg.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = gr; sg.fillRect(0, 0, 64, 64);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc), transparent:true, depthWrite:false}));
    this.shadow.renderOrder = 1; this.group.add(this.shadow);
    this.light = new THREE.PointLight("#ff3d7f", 7, 9, 1.4); this.light.position.set(0, this.H * 0.6, 0.8); this.group.add(this.light);
    this.uniforms = {uGlitch:{value:0}, uFlash:{value:0}, uAlpha:{value:1}, uTintC:{value:new THREE.Vector4()}};
    this.cache = new Map(); this.koK = 0; this.lunge = 0; this.drawH = this.H; this.width = 1.6;
  }
  hasClip(){ return false; }
  setAnim(){}
  playOnce(){ this.lunge = performance.now(); return 0.62; }
  /* les images du jeu mobile, en toiles (pas d'attente de chargement) */
  src(k, named){
    const name = (ref("pzName") || (()=>"?"))(), key = (named ? "n|" : "c|") + name + "|" + k;
    let c = this.cache.get(key);
    if(!c){
      try { c = named ? ref("nameSpriteCanvas")(name) : ref("mnCrackCanvas")(name, k); } catch(e){ c = null; }
      if(!c){ const im = new Image(); im.src = ref("MISSING_SPRITE") || ""; c = im; }
      this.cache.set(key, c);
      if(this.cache.size > 24) this.cache.delete(this.cache.keys().next().value);
    }
    return c && (c.width || c.naturalWidth) ? c : null;
  }
  update(t, dt, pos, heading, camPos){
    const u = this.u, x = this.x, W = this.W, H = this.Hc, calm = calmFx();
    const B = ref("MN_BREATH") || [0.3];
    /* avant son nom : la fêlure ; à « Regarde mon nom », elle s'ouvre (0,7 s) et le L en sort */
    let open = -1;
    if(u.named){ if(this.openT === undefined) this.openT = t; open = (t - this.openT) / 0.7; }
    const opening = open >= 0 && open < 1;
    const base = opening ? this.src(0.3 + 0.1 * Math.min(7, Math.floor(open * 8)), false) : u.named ? this.src(0, true) : this.src(B[Math.floor(t * 1000 / 420) % B.length], false);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    if(base){
      const s = 56, X0 = (W - s) / 2, Y0 = H - this.foot - s;
      const jit = calm ? 0 : u.p3 ? 7 : u.p2 ? 4 : 2, j = Math.round((Math.random() - 0.5) * jit);
      const k = this.koK;
      if(k > 0){
        /* il s'effondre : une colonne de tuiles qui ne savent plus quoi représenter */
        const n = 8, hN = (base.height || base.naturalHeight) / n, bw = base.width || base.naturalWidth;
        for(let i = 0; i < n; i++){ x.globalAlpha = 1 - k * 0.35; x.drawImage(base, 0, i * hN, bw, hN, X0 + (i % 2 ? 1 : -1) * k * 3, Y0 + i * s / n + k * k * (n - i) * 5, s, s / n); }
        x.globalAlpha = 1;
      } else {
        /* l'écho lumineux, de part et d'autre */
        x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.45;
        x.drawImage(base, X0 - 3 + j, Y0, s, s); x.drawImage(base, X0 + 3 - j, Y0, s, s);
        x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
        /* déchiré en tranches, de plus en plus à chaque phase */
        const slices = 8, tear = calm ? 0 : u.p3 ? 0.35 : u.p2 ? 0.22 : 0.12, bw = base.width || base.naturalWidth, bh = base.height || base.naturalHeight;
        for(let i = 0; i < slices; i++){
          const off = Math.random() < tear ? Math.round((Math.random() - 0.5) * 16) : 0;
          x.drawImage(base, 0, i * bh / slices, bw, bh / slices, X0 + off + Math.round(j * 0.3), Y0 + i * s / slices, s, s / slices + 0.6);
        }
        if(opening){ const nm = this.src(0, true); if(nm){ x.globalAlpha = Math.min(1, open * 1.25); x.drawImage(nm, X0, Y0, s, s); x.globalAlpha = 1; } }
      }
    }
    const d = x.getImageData(0, 0, W, H).data;
    /* face à la caméra : un bas-relief de cubes, épais */
    V1.subVectors(camPos, pos); V1.y = 0; V1.normalize();
    const yaw = Math.atan2(V1.x, V1.z);
    this.group.position.copy(pos); this.group.rotation.y = yaw;
    const px = this.px, dep = px * 1.6, gl = this.uniforms.uGlitch.value;
    const lunge = calm ? 0 : Math.max(0, 1 - (performance.now() - this.lunge) / 600);
    let n = 0;
    for(let jj = 0; jj < H; jj++) for(let i = 0; i < W; i++){
      const q = (jj * W + i) * 4, al = d[q + 3];
      if(al < 30 || n >= MN_CAP) continue;
      if(gl > 0 && Math.random() < gl * 0.7) continue;
      let ux = (i - W / 2) * px, vy = (H - this.foot - jj) * px, uz = ((i * 7 + jj * 13) % 5 - 2) * px * 0.2;
      if(gl > 0){ ux += (Math.random() - 0.5) * gl * 1.2; vy += (Math.random() - 0.3) * gl * 0.8; uz += (Math.random() - 0.5) * gl; }
      if(lunge > 0) uz += Math.sin(jj * 0.4 + i * 0.1) * lunge * 0.25;
      const sc = px * (al > 200 ? 1 : 0.4 + al / 255 * 0.6);
      _m.compose(V2.set(ux, vy, uz), _q.identity(), _s.set(sc, sc, dep));
      this.mesh.setMatrixAt(n, _m); this.mesh.setColorAt(n, colOf(d[q], d[q + 1], d[q + 2])); n++;
    }
    this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; this.mesh.instanceColor.needsUpdate = true;
    this.mat.emissiveIntensity = 0.55 + this.uniforms.uFlash.value * 2.2 + (u.p3 ? 0.25 : 0);
    this.light.intensity = (7 + Math.sin(t * 7) * 2) * (1 - this.koK * 0.7) + this.uniforms.uFlash.value * 10;
    this.light.color.set(u.p3 ? "#ffffff" : "#ff3d7f");
    this.shadow.position.y = (this.groundY !== undefined ? this.groundY - pos.y : 0) + 0.02;
  }
  dispose(){ this.scene.remove(this.group); this.mesh.geometry.dispose(); this.mat.dispose(); this.shadow.geometry.dispose(); this.shadow.material.dispose(); }
}

/* ============================================================
   LA COUCHE ZÉRO, LIEU DU COMBAT
   ============================================================ */
export class ZeroVenue {
  constructor(game){ this.game = game; this.built = false; this.on = false; this.bubbles = new Map(); this.seenBanner = null; }
  build(){
    this.built = true;
    const s = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 900);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false, vertexShader:SKY_VS, fragmentShader:SKY_FS,
      uniforms:{uTop:{value:new THREE.Color("#020108")}, uBot:{value:new THREE.Color("#0c0520")}}}));
    this.sky.frustumCulled = false; this.sky.renderOrder = -10; s.add(this.sky);
    /* assez de lumière pour lire le combat ; le magenta vient de MissingNo, le cyan de Porygon-Z */
    this.hemi = new THREE.HemisphereLight("#b8a8ff", "#120a20", 1.0); s.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#f0e8ff", 1.5); this.sun.castShadow = true;
    const q = this.game.engine.q, ms = q && q.shadow ? Math.min(2048, q.shadow) : 1024;
    this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    const sc = this.sun.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.near = 1; sc.far = 60;
    this.sun.position.set(-7, 12, 9); this.sun.target.position.set(0, 0, 0); s.add(this.sun, this.sun.target);
    s.fog = new THREE.FogExp2("#06030e", 0.02);
    /* le décor du récit, tourné pour que la caméra du combat regarde vers le fond */
    this.setG = new THREE.Group();
    try { this.setUpd = SETS3D.zero.build(this.setG, "fight"); } catch(e){ console.warn(e); this.setUpd = null; }
    const yaw = -0.78; this.setG.rotation.y = yaw;
    this.setG.position.copy(V1.set(0, 0, -2.4).applyAxisAngle(UP, yaw)).multiplyScalar(-1);
    s.add(this.setG);
    this.env = {tint:new THREE.Color(1, 1, 1), fog:new THREE.Color("#06030e"), fogDensity:0.02};
    /* Porygon-Z, derrière ton équipe : un hologramme sur son disque */
    this.pzA = {kind:"pz", mon:474, dir:0, anim:"idle", a0:0, loop:true, alpha:1, holo:true, born:1.3, hop:0, sink:0, talk:false, trem:0, yaw:0};
    this.pz = new MonActor(s, this.pzA);
    this.pzHome = new THREE.Vector3(-6.4, 0, 0.6); this.pzPos = this.pzHome.clone();
    this.pzFill = new THREE.PointLight("#35f0d6", 0, 7, 1.5); s.add(this.pzFill);
    /* EFFACER : un mur de lumière magenta qui balaie l'arène */
    const wc = document.createElement("canvas"); wc.width = 16; wc.height = 128; const wx = wc.getContext("2d");
    const wg = wx.createLinearGradient(0, 0, 0, 128); wg.addColorStop(0, "rgba(255,61,127,0)"); wg.addColorStop(0.55, "rgba(255,61,127,.55)"); wg.addColorStop(0.9, "rgba(255,200,220,.95)"); wg.addColorStop(1, "rgba(255,255,255,1)");
    wx.fillStyle = wg; wx.fillRect(0, 0, 16, 128);
    for(let y = 0; y < 128; y += 4){ wx.fillStyle = "rgba(0,0,0,.25)"; wx.fillRect(0, y, 16, 1); }
    this.sweep = new THREE.Mesh(new THREE.PlaneGeometry(18, 5.5).translate(0, 2.75, 0), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(wc), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
    this.sweep.visible = false; s.add(this.sweep);
    /* l'onde de Porygon-Z, au sol */
    this.wave = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.wave.visible = false; s.add(this.wave);
    this.bubbleGeo = new THREE.IcosahedronGeometry(1, 2);
  }
  enter(){
    if(!this.built) this.build();
    this.on = true; this.help = null; this.erase = null; this.seenBanner = null; this.tear = 0;
    this.pzPos.copy(this.pzHome); this.pzA.hop = 0; this.pzA.sink = 0;
    this.game.engine.useScene(this.scene, this.camera);
    /* les étincelles du combat vivent ici le temps du combat */
    const sp = this.game.capture && this.game.capture.sparks;
    if(sp) this.scene.add(sp.points);
  }
  exit(){
    this.on = false;
    const sp = this.game.capture && this.game.capture.sparks;
    if(sp) this.game.engine.scene.add(sp.points);
    for(const b of this.bubbles.values()) this.scene.remove(b.m);
    this.bubbles.clear();
    const g = this.game;
    if(g.story3d && g.story3d.on) return;                           /* le récit a déjà pris l'image */
    if(g.breche3d && g.breche3d.on) g.engine.useScene(g.breche3d.scene, g.breche3d.camera);
    else g.engine.useScene(null);
  }
  /* ---------- à chaque image ---------- */
  update(t, dt, T, B, V, recs, tw){
    const calm = calmFx(), sparks = this.game.capture && this.game.capture.sparks;
    try { if(this.setUpd) this.setUpd(t, dt); } catch(e){}
    const mn = B.foes.find(f=>f.mn) || (V.foes || []).find(f=>f.mn);
    const mnR = mn && recs.get(mn);
    /* ce que la scène mobile annonce : la bannière dit ce qui se passe */
    const Bn = V.banner;
    if(Bn && Bn !== this.seenBanner && T >= Bn.t0){
      this.seenBanner = Bn;
      if(Bn.txt === "EFFACER" && mnR){ this.erase = {t0:t, from:mnR.pos.clone()}; this.tear = Math.max(this.tear, 0.6); }
      if(Bn.txt === "PORYGON-Z") this.help = {t0:t, beams:0};
      if(Bn.txt === "COPIE" || Bn.txt === "SON NOM"){ this.tear = Math.max(this.tear, 0.75); this.pzA.trem = 1; this.tremUntil = t + 1.6; }
    }
    if(this.tremUntil && t > this.tremUntil){ this.pzA.trem = 0; this.tremUntil = 0; }
    /* Porygon-Z : il regarde MissingNo ; il parle quand c'est sa ligne ; il intervient une fois */
    const line = document.getElementById("fnline");
    this.pzA.talk = !!(line && line.classList.contains("on") && line.classList.contains("w-pz"));
    let want = this.pzHome, lift = 0;
    const allies = B.allies.filter(u=>u.hp > 0 && recs.get(u));
    if(this.help){
      const k = (t - this.help.t0) / 2.4;
      if(k >= 1) this.help = null;
      else {
        const c = V3.set(0, 0, 0); for(const u of allies) c.add(recs.get(u).pos); if(allies.length) c.divideScalar(allies.length);
        c.sub(tw.root); c.x -= 1.4; c.z += 1.2;
        const go = Math.sin(Math.PI * Math.min(1, k * 1.25));
        want = V2.copy(this.pzHome).lerp(c, go); lift = go * 0.9;
        /* des rayons cyan vers chacun, puis une onde au sol */
        if(k > 0.25 && k < 0.7 && sparks && t - (this.help.last || 0) > 0.12){
          this.help.last = t;
          const from = V1.copy(this.pzPos).add(tw.root); from.y += 1.5 + lift;
          for(const u of allies){ const r = recs.get(u); sparks.stream(from, r.pos.clone().add(new THREE.Vector3(0, r.H * 0.55, 0)), 18, "#35f0d6"); }
        }
        if(k > 0.3 && !this.help.waved){ this.help.waved = t; }
      }
    }
    if(B.over && B.result && !this.won){ this.won = t; }
    if(!B.over) this.won = 0;
    if(this.won){ const k = t - this.won; this.pzA.hop = k < 1.2 ? Math.max(0, Math.sin(k * Math.PI * 2.5)) * 14 : 0; }
    else if(B.over && !B.result) this.pzA.sink = Math.min(10, (this.pzA.sink || 0) + dt * 8);
    this.pzPos.lerp(want, Math.min(1, dt * 3.2));
    if(mnR){ this.pzA.yaw = Math.atan2(mnR.pos.x - tw.root.x - this.pzPos.x, mnR.pos.z - tw.root.z - this.pzPos.z); }
    const foot = V1.copy(this.pzPos).add(tw.root); foot.y += lift + 1.25 * (1 - (this.help ? Math.min(1, lift / 0.9) : 0));
    try { this.pz.update(this.pzA, {t}, foot, 0.04, t, dt, this.camera, this.env); } catch(e){}
    this.pzFill.position.set(foot.x + 0.6, foot.y + 1.4, foot.z + 0.6);
    this.pzFill.intensity = this.help ? 9 : 2.2;
    /* l'onde au sol */
    if(this.help && this.help.waved){ const k = (t - this.help.waved) / 0.9; this.wave.visible = k < 1;
      if(this.wave.visible){ this.wave.position.set(foot.x, tw.root.y + 0.03, foot.z); this.wave.scale.setScalar(1 + k * 7); this.wave.material.opacity = 0.8 * (1 - k); } }
    else this.wave.visible = false;
    /* les bulles : le bouclier de chacun (il éclate quand il tombe, ou quand EFFACER passe) */
    for(const u of B.allies){
      const r = recs.get(u), v = u._v || {}, sh = r && r.vis && !v.ko ? (v.sh || 0) : 0;
      let b = this.bubbles.get(u);
      if(sh > 0 && !b){
        const m = new THREE.Mesh(this.bubbleGeo, new THREE.MeshBasicMaterial({color:"#7af6ff", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, wireframe:true}));
        const fill = new THREE.Mesh(this.bubbleGeo, new THREE.MeshBasicMaterial({color:"#35f0d6", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.BackSide}));
        m.add(fill); this.scene.add(m);
        b = {m, fill, born:t, pop:0}; this.bubbles.set(u, b);
      }
      if(!b) continue;
      if(sh <= 0 && !b.pop){ b.pop = t; if(sparks && r) sparks.burst(b.m.position.clone(), 26, ["#7af6ff", "#ffffff", "#ff3d7f"], 3.2, 0.6, 0.8); }
      if(r){ const R = Math.max(0.62, r.H * 0.62); b.m.position.copy(r.pos); b.m.position.y += r.H * 0.5; b.R = R; }
      const grow = Math.min(1, (t - b.born) / 0.35);
      if(b.pop){
        const k = (t - b.pop) / 0.3;
        if(k >= 1){ this.scene.remove(b.m); b.m.material.dispose(); b.fill.material.dispose(); this.bubbles.delete(u); continue; }
        b.m.scale.setScalar((b.R || 0.8) * (1 + k * 0.6)); b.m.material.opacity = 0.5 * (1 - k); b.fill.material.opacity = 0.12 * (1 - k);
      } else {
        b.m.scale.setScalar((b.R || 0.8) * (0.6 + 0.4 * grow)); b.m.rotation.y = t * 0.4;
        b.m.material.opacity = (0.22 + (calm ? 0 : 0.06 * Math.sin(t * 4))) * grow; b.fill.material.opacity = 0.07 * grow;
      }
    }
    /* EFFACER : la ligne balaie, de MissingNo vers ton équipe et au-delà */
    if(this.erase){
      const k = (t - this.erase.t0) / 1.1;
      if(k >= 1){ this.erase = null; this.sweep.visible = false; }
      else {
        const c = V3.set(0, 0, 0); for(const u of allies) c.add(recs.get(u).pos); if(allies.length) c.divideScalar(allies.length); else c.copy(tw.root);
        const dir = V2.subVectors(c, this.erase.from); dir.y = 0; const len = dir.length() + 5; dir.normalize();
        this.sweep.visible = true;
        this.sweep.position.copy(this.erase.from).addScaledVector(dir, len * k); this.sweep.position.y = tw.root.y;
        this.sweep.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2;
        this.sweep.material.opacity = Math.sin(Math.PI * k) * 0.95;
      }
    }
    /* l'image : la faille abîme tout, de plus en plus à chaque phase */
    this.tear = Math.max(0, this.tear - dt * 2.2);
    const E = this.game.engine;
    const amount = 0.3 + (mn && mn.p2 ? 0.08 : 0) + (mn && mn.p3 ? 0.1 : 0) + (this.erase ? 0.25 : 0);
    if(E.corrupt) E.corrupt.set(amount, calm ? 0 : this.tear, t, calm);
    this.camera.updateMatrixWorld();
  }
  /* un écho : ton Pokémon, rejoué par la faille */
  static echoTint(m, t, u){
    const U = m.uniforms; if(!U) return;
    if(U.uTintC) U.uTintC.value.set(1.0, 0.24, 0.5, 0.42 + 0.06 * Math.sin(t * 5 + (u.id || 0)));
    if(!calmFx() && Math.sin(t * 7.3 + (u.id || 0) * 1.7) > 0.97) U.uGlitch.value = Math.max(U.uGlitch.value, 0.35);
  }
}
