/* ============================================================
   LE FORAGE EN 3D · LA MINE
   Le camp, au fond du puits, là où l'équipe creuse :
     · la caverne : ses parois sont la couche où l'on est (ses trois
       tons, ses veines de minerai qui luisent) ; au-dessus, en bandes,
       les couches déjà traversées : la profondeur se lit sur la roche ;
     · le puits, au plafond : il remonte, bande après bande, jusqu'à
       un petit disque de jour, très haut ; la cage y monte le minerai ;
     · au centre, la foreuse : un derrick dans la matière de l'outil
       forgé (bois, cuivre… rêve), sa mèche qui tourne au rythme du
       forage, le trou qui rougeoie ;
     · autour : six fronts de taille (un par membre de l'équipe), la
       paroi de fouille au nord, la forge et son four, le tableau de
       l'équipe, la table des chantiers, le wagonnet et les tas de
       minerai (leur taille suit ce qu'on possède), le monte-charge ;
     · la lumière : la lampe frontale (la lueur de la route), quatre
       lueurs posées (le four, le trou, la paroi, la plus proche des
       lanternes), le jour qui tombe du puits.
   Un chantier (la Grotte Azurée, le Cratère Ardent…) teinte tout.
   ============================================================ */
import * as THREE from "three";
import { BT, BL, BL_N, rockGeo, prismGeo, glowMat, inst, swarm, shafts, labelSprite } from "../world/biomes/kit.js";
import { CZ } from "../world/corruption.js";
import { noiseFn } from "../util.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
export const RX = 16, RZ = 13, OPEN = 3.2, WALL_H = 7.2, TOP = 11.6, SHAFT_H = 70;
const C = c => new THREE.Color(c);
/* le bois et le métal du camp : ils prennent la lumière des lanternes et de la lampe (pas seulement celle du puits) */
const woodM = c => glowMat({key:"mwood", color:c, rough:0.85, tint:`diffuseColor.rgb *= 0.8 + 0.32 * bn(vec2(vWP.y * 5.0, (vWP.x + vWP.z) * 0.8));`});
const metalM = (c, m = 0.25) => glowMat({key:"mmetal", color:c, rough:0.45, metal:m});
/* les uniformes de la mine, partagés par ses matériaux */
export const MU = {
  uPal:{value:[C("#8a6a44"), C("#73573a"), C("#5c452e")]},
  uBand:{value:[C("#73573a"), C("#5c452e"), C("#3a2c20"), C("#241a12")]},
  uAll:{value:Array.from({length:10}, ()=>C("#5c452e"))}, uSi:{value:0},
  uTint:{value:new THREE.Vector4(0, 0, 0, 0)}, uOre:{value:C("#c8733a")}, uFlash:{value:0}, uWalls:{value:0}
};
const MU_GLSL = `uniform vec3 uPal[3]; uniform vec3 uBand[4]; uniform vec3 uAll[10]; uniform float uSi; uniform vec4 uTint; uniform vec3 uOre; uniform float uFlash; uniform float uWalls;`;
/* un matériau de la mine : celui des biomes (lueurs, lampe), plus les couleurs de la couche */
function mineMat(opts){
  const m = glowMat(opts), ob = m.onBeforeCompile;
  m.onBeforeCompile = sh => {
    ob(sh);
    for(const k in MU) sh.uniforms[k] = MU[k];
    sh.fragmentShader = MU_GLSL + "\n" + sh.fragmentShader;
  };
  m.customProgramCacheKey = () => "mine-" + opts.key;
  return m;
}
/* la roche de la couche : ses trois tons, des taches, un peu de la teinte du chantier */
const ROCK_TINT = `
  float rn = bn(vWP.xz * 0.42 + vWP.y * 0.55), rn2 = bn(vWP.xz * 1.9 + vWP.y * 2.3 + 7.0), rn3 = bn(vWP.xz * 6.3 - vWP.y * 5.1);
  vec3 rock = mix(uPal[0], uPal[1], smoothstep(0.3, 0.7, rn));
  rock = mix(rock, uPal[2], smoothstep(0.62, 0.9, rn2) * 0.8);
  rock *= (0.8 + 0.3 * rn2) * (0.88 + 0.22 * rn3);
  rock = mix(rock, rock * uTint.rgb * 1.6, uTint.a);`;

export class Mine {
  constructor(scene, quality){
    this.scene = scene; this.q = quality || {};
    this.root = new THREE.Group(); scene.add(this.root);
    this.lights = [];            /* les lueurs posées : {p, r, c, base} */
    this.anim = [];
    this.n = noiseFn(4021);
    this.build();
  }
  /* ---------- les postes et les fronts de taille ---------- */
  static faceAngles(){ return [-0.62, -2.52, -0.08, -3.06, 0.42, 2.72].map(a=>a); }
  facePoint(i, inset = 2.1){
    const a = Mine.faceAngles()[i % 6];
    const x = Math.cos(a) * (RX - inset), z = Math.sin(a) * (RZ - inset);
    return {x, z, a, wall:new THREE.Vector3(Math.cos(a) * (RX - 0.8), 0, Math.sin(a) * (RZ - 0.8))};
  }
  build(){
    const R = this.root;
    /* ---------- les parois ---------- */
    const wall = mineMat({key:"cave", color:"#ffffff", rough:0.95, flat:true, side:THREE.DoubleSide,
      tint:`${ROCK_TINT}
        /* au-dessus, les couches traversées : des bandes ondulées, de la même roche, de plus en plus sombres */
        float yb = vWP.y - 3.6 + (bn(vWP.xz * 0.22) - 0.5) * 1.2;
        if(yb > 0.0){
          int bi = int(min(3.0, floor(yb / 1.45)));
          vec3 bc = mix(uBand[bi], rock, 0.45) * (0.75 + 0.3 * rn2) * (0.9 + 0.2 * rn3) * (1.0 - float(bi) * 0.1);
          float seam = smoothstep(0.06, 0.0, abs(fract(yb / 1.45) - 0.03));
          rock = mix(bc, bc * 0.5, seam);
        }
        /* des veines de minerai : la couleur du minerai de la couche, en traînées brisées, en bas */
        float vn = bn(vWP.xz * 0.55 + vWP.y * 0.9), brk = bn(vWP.xz * 1.7 + vWP.y * 1.3 + 11.0);
        float vein = smoothstep(0.022, 0.0, abs(vn - 0.5)) * smoothstep(0.55, 0.68, brk) * smoothstep(4.6, 2.8, vWP.y);
        rock = mix(rock, uOre * (0.5 + 0.3 * rn3), vein * 0.75);
        diffuseColor.rgb = rock;`,
      glow:`/* dans les veines, des éclats qui scintillent */
        float vn2 = bn(vWP.xz * 0.55 + vWP.y * 0.9), brk2 = bn(vWP.xz * 1.7 + vWP.y * 1.3 + 11.0);
        float vein2 = smoothstep(0.03, 0.0, abs(vn2 - 0.5)) * smoothstep(0.55, 0.68, brk2) * smoothstep(4.6, 2.8, vWP.y);
        vec2 sc = floor(vec2(atan(vWP.z, vWP.x) * 90.0, vWP.y * 14.0));
        float sp = step(0.93, bh(sc)) * (0.5 + 0.5 * sin(uBT * (2.0 + 3.0 * bh(sc + 3.1)) + bh(sc) * 40.0));
        glow += uOre * vein2 * (0.04 + sp * 0.8);
        /* la lumière renvoyée par le sol éclairé : la voûte se devine */
        glow += diffuseColor.rgb * (0.08 + 0.16 * smoothstep(2.0, 10.0, vWP.y));
        glow += vec3(1.0, 0.85, 0.6) * uFlash * 0.25 * smoothstep(3.6, 0.0, vWP.y);`});
    this.cave = new THREE.Mesh(this.caveGeo(), wall); this.cave.receiveShadow = true; R.add(this.cave);
    /* ---------- le sol ---------- */
    const floor = mineMat({key:"floor", color:"#ffffff", rough:0.98,
      tint:`${ROCK_TINT}
        float r = length(vWP.xz / vec2(${RX.toFixed(1)}, ${RZ.toFixed(1)}));
        /* tassé au centre (les pas, les roues), plus de cailloux au bord */
        rock *= mix(0.62, 0.92, smoothstep(0.2, 0.95, r));
        float grit = smoothstep(0.72, 0.9, bn(vWP.xz * 9.0)) * 0.22, track = smoothstep(0.55, 0.75, bn(vWP.xz * 0.8 + 4.0)) * 0.12;
        diffuseColor.rgb = rock * (1.0 - grit - track);`});
    const fl = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), floor);
    fl.scale.set(RX + 2, 1, RZ + 2); fl.receiveShadow = true; R.add(fl);
    /* des cailloux au pied des parois */
    const rockM = mineMat({key:"rocks", color:"#ffffff", rough:0.95, flat:true, tint:`${ROCK_TINT}\n diffuseColor.rgb = rock * 0.9;`});
    const rl = [];
    for(let i = 0; i < 90; i++){
      const a = i / 90 * Math.PI * 2 + Math.sin(i * 7.3) * 0.04, k = 0.9 + (i % 5) * 0.02;
      if(Math.abs(a - Math.PI * 1.5) < 0.32 || Math.abs(a - Math.PI * 0.5) < 0.18) continue;   /* (la paroi de fouille, le monte-charge) */
      rl.push({x:Math.cos(a) * RX * k, y:0.1, z:Math.sin(a) * RZ * k, s:0.35 + ((i * 37) % 10) / 10 * 0.9, ry:i, rx:i * 0.3});
    }
    inst(R, rockGeo(77, 1, 0.7), rockM, rl, true, true);
    /* ---------- le puits, au-dessus ---------- */
    this.buildShaft();
    /* ---------- la foreuse ---------- */
    this.buildDrill();
    /* ---------- la paroi de fouille (son cadre ; la roche elle-même est dig.js) ---------- */
    this.buildDigFrame();
    /* ---------- les fronts de taille ---------- */
    this.buildFaces(rockM);
    /* ---------- la forge, le tableau, la table, le wagonnet, le monte-charge ---------- */
    this.buildForge(); this.buildBoard(); this.buildTable(); this.buildCart(); this.buildLift();
    /* ---------- des lanternes, de la poussière ---------- */
    this.buildLanterns();
    this.dust = swarm(R, Array.from({length:220}, (_, i)=>{ const a = i * 2.3999, r = Math.sqrt((i + 0.5) / 220); return {x:Math.cos(a) * r * RX * 0.9, y:0.3 + (i % 9) * 0.9, z:Math.sin(a) * r * RZ * 0.9}; }),
      {kind:0, size:0.05, c1:"#ffe2b0", c2:"#b8c8ff", fade:1e5, seed:12});
    /* l'éclairage des Pokémon (les modèles ne voient que les vraies lumières) */
    this.hemi = new THREE.HemisphereLight("#ffe6c8", "#8a6a4a", 2.1); R.add(this.hemi);
    this.sun = new THREE.DirectionalLight("#fff2dc", 1.25); this.sun.position.set(2, 40, 3); this.sun.target.position.set(0, 0, 0);
    this.sun.castShadow = !!(this.q && this.q.shadow);
    if(this.sun.castShadow){ const ms = Math.min(2048, this.q.shadow); this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.05;
      const sc = this.sun.shadow.camera; sc.left = -RX; sc.right = RX; sc.top = RZ; sc.bottom = -RZ; sc.near = 10; sc.far = 60; }
    R.add(this.sun, this.sun.target);
    this.fill = new THREE.PointLight("#ffb46a", 6, 18, 1.6); this.fill.position.set(0, 2.2, 0); R.add(this.fill);
    this.scene.fog = new THREE.FogExp2("#120c08", 0.018);
    this.scene.background = C("#07050a");
  }
  /* la caverne : une ellipse au sol, un dôme qui se resserre jusqu'au puits ; bosselée, sauf devant la paroi de fouille */
  caveGeo(){
    const U = 140, V = 34, pos = [], idx = [], n = this.n;
    for(let j = 0; j <= V; j++){
      const v = j / V;
      let y, kx, kz;
      if(v < 0.56){ const k = v / 0.56; y = k * WALL_H; kx = RX * (1 - 0.035 * k); kz = RZ * (1 - 0.035 * k); }
      else { const k = (v - 0.56) / 0.44, ph = k * Math.PI / 2; y = WALL_H + Math.sin(ph) * (TOP - WALL_H);
        const c = Math.cos(ph); kx = RX * 0.965 * c + OPEN * (1 - c); kz = RZ * 0.965 * c + OPEN * (1 - c); }
      for(let i = 0; i <= U; i++){
        const a = i / U * Math.PI * 2;
        let x = Math.cos(a) * kx, z = Math.sin(a) * kz;
        /* les bosses : fortes à mi-hauteur, nulles au raccord du puits */
        const dig = Math.max(0, 1 - Math.abs(Math.atan2(Math.sin(a - Math.PI * 1.5), Math.cos(a - Math.PI * 1.5))) / 0.34) * (y < 8 ? 1 : 0);
        const lift = Math.max(0, 1 - Math.abs(Math.atan2(Math.sin(a - Math.PI * 0.5), Math.cos(a - Math.PI * 0.5))) / 0.2) * (y < 6 ? 1 : 0);
        const amp = (1 - Math.pow(Math.max(0, (v - 0.85) / 0.15), 2)) * (1 - dig * 0.92) * (1 - lift * 0.8);
        const d = (n(a * 6.1, y * 0.32) * 1.1 + n(a * 19.0, y * 1.1) * 0.35) * amp;
        const L = Math.hypot(x, z) || 1;
        x += x / L * d; z += z / L * d;
        pos.push(x, y + (v > 0 && v < 1 ? n(a * 9, y * 0.5) * 0.25 * amp : 0), z);
      }
    }
    for(let j = 0; j < V; j++) for(let i = 0; i < U; i++){
      const a = j * (U + 1) + i, b = a + 1, c = a + U + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  buildShaft(){
    const R = this.root;
    const m = mineMat({key:"shaft", color:"#ffffff", rough:0.95, side:THREE.BackSide,
      tint:`/* en remontant : la couche où l'on est, puis les autres, jusqu'à la surface */
        float q = clamp((vWP.y - ${TOP.toFixed(1)}) / ${SHAFT_H.toFixed(1)}, 0.0, 1.0);
        float f = (1.0 - q) * (uSi + 1.0) + (bn(vec2(atan(vWP.z, vWP.x) * 3.0, vWP.y * 0.1)) - 0.5) * 0.25;
        int bi = int(clamp(floor(f), 0.0, 9.0));
        float rn = bn(vec2(atan(vWP.z, vWP.x) * 8.0, vWP.y * 0.7));
        vec3 c = uAll[bi] * (0.7 + 0.4 * rn);
        float seam = smoothstep(0.06, 0.0, abs(fract(f) - 0.03));
        diffuseColor.rgb = mix(c, c * 0.4, seam) * mix(0.55, 1.15, q);`,
      glow:`float q2 = clamp((vWP.y - ${TOP.toFixed(1)}) / ${SHAFT_H.toFixed(1)}, 0.0, 1.0);
        glow += vec3(0.9, 0.85, 0.7) * pow(q2, 5.0) * 0.6;`});
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(OPEN, OPEN, SHAFT_H, 40, 24, true).translate(0, TOP + SHAFT_H / 2, 0), m);
    R.add(sh);
    /* le jour, tout en haut */
    const sky = new THREE.Mesh(new THREE.CircleGeometry(OPEN, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({color:"#dfeeff", fog:false}));
    sky.position.y = TOP + SHAFT_H - 0.5; R.add(sky);
    /* le rai de lumière qui tombe du puits, et la poussière dedans */
    this.U = this.U || {};
    this.U.ray = shafts(R, [{x:0, y:0, z:0, w:OPEN * 1.7, h:TOP + 8}], "#ffeccc", 0.13);
    /* les câbles de la cage */
    const cab = metalM("#3a3a40");
    for(const sx of [-0.55, 0.55]){ const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, SHAFT_H + 4, 4), cab); c.position.set(OPEN - 1.1 + sx * 0.4, TOP + SHAFT_H / 2 - 2, 0.4); R.add(c); }
    /* la cage : elle monte le minerai, redescend vide */
    const cage = this.cage = new THREE.Group(); R.add(cage);
    const frame = metalM("#7b6a54");
    for(const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), frame); p.position.set(x, 0.8, z); cage.add(p); }
    for(const y of [0.02, 1.6]){ const p = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), frame); p.position.y = y; cage.add(p); }
    this.cageOre = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshStandardMaterial({color:"#c8733a", emissive:"#c8733a", emissiveIntensity:0.5}));
    this.cageOre.position.y = 0.4; cage.add(this.cageOre);
    cage.position.set(OPEN - 1.1, TOP + 2, 0.4);
  }
  buildDrill(){
    const R = this.root, g = this.drill = new THREE.Group(); R.add(g);
    /* le trou : sombre, qui rougeoie au fond ; son bord a la couleur de la couche */
    const hole = mineMat({key:"hole", color:"#050302", rough:1, glow:`float r = length(vOP.xz);
      glow += mix(uOre, vec3(1.0, 0.45, 0.15), 0.5) * smoothstep(1.0, 0.0, r) * (0.55 + 0.25 * sin(uBT * 2.3));`});
    const h = new THREE.Mesh(new THREE.CircleGeometry(1.75, 40).rotateX(-Math.PI / 2), hole); h.position.y = 0.02; g.add(h);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.35, 8, 40).rotateX(Math.PI / 2), mineMat({key:"rim", color:"#ffffff", rough:0.9, flat:true, tint:`${ROCK_TINT}\n diffuseColor.rgb = rock * 0.8;`}));
    rim.position.y = 0.1; g.add(rim);
    /* le derrick : quatre jambes dans la matière de la foreuse */
    this.metal = glowMat({key:"mdrill", color:"#a06b38", rough:0.5, metal:0.2});
    this.metalDark = glowMat({key:"mdrill", color:"#64401f", rough:0.55, metal:0.2});
    const H = 7.2;
    for(const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, H + 0.4, 0.22), this.metal);
      leg.position.set(a * 1.75, H / 2, b * 1.75); leg.rotation.set(-b * 0.22, 0, a * 0.22); leg.castShadow = true; g.add(leg);
    }
    for(let i = 1; i < 4; i++){ const w = 3.5 - i * 0.78, y = i * 1.8;
      for(const r of [0, Math.PI / 2]){ for(const sd of [-1, 1]){ const br = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.12), this.metalDark); br.position.set(r ? sd * w / 2 : 0, y, r ? 0 : sd * w / 2); br.rotation.y = r; g.add(br); } } }
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16), this.metal); crown.position.y = H + 0.1; g.add(crown);
    /* le moteur, ses voyants */
    const motor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), this.metalDark); motor.position.set(0, H - 0.8, 0); g.add(motor);
    this.leds = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 0.6), new THREE.MeshBasicMaterial({color:"#35f0d6"})); this.leds.position.set(0, H - 0.6, 0.18); g.add(this.leds);
    /* la tige, la mèche : elles tournent ; leur vitesse suit le forage */
    const spin = this.spin = new THREE.Group(); g.add(spin);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, H - 1.6, 10), this.metal); rod.position.y = (H - 1.6) / 2 - 0.2; spin.add(rod);
    const flute = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 18), this.metalDark);
    for(let i = 0; i < 6; i++){ const f2 = flute.clone(); f2.position.y = 0.4 + i * 0.75; f2.rotation.x = Math.PI / 2 + 0.25; spin.add(f2); }
    const bit = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 8).rotateX(Math.PI), this.metal); bit.position.y = -0.55; spin.add(bit);
    this.lights.push({p:new THREE.Vector3(0, 0.6, 0), r:9, c:C("#ff8a3d"), base:1.2, k:"hole"});
  }
  buildDigFrame(){
    const R = this.root, z = -RZ + 0.75, W = 12 * 0.7, H = 9 * 0.7, cy = 0.6 + H / 2;
    const wood = glowMat({key:"wood", color:"#6a4a30", rough:0.9, tint:`diffuseColor.rgb *= 0.75 + 0.4 * bn(vec2(vWP.y * 3.0, vWP.x * 0.6 + vWP.z * 0.6));`});
    const g = this.digFrame = new THREE.Group(); g.position.set(0, 0, z); R.add(g);
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, H + 1.6, 0.42), wood); p.position.set(sd * (W / 2 + 0.32), (H + 1.6) / 2, 0.15); p.castShadow = true; g.add(p); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, 0.45, 0.5), wood); top.position.set(0, H + 1.4, 0.15); g.add(top);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(W + 1.0, 0.3, 0.6), wood); sill.position.set(0, 0.42, 0.2); g.add(sill);
    /* la lueur des fouilles qui attendent : dorée, dans les joints du cadre */
    this.digGlow = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.4, H + 0.4), new THREE.MeshBasicMaterial({color:"#ffc857", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false}));
    this.digGlow.position.set(0, cy, 0.68); g.add(this.digGlow);
    this.digLabel = labelSprite(1024, 200); this.digLabel.sp.scale.set(6.4, 1.25, 1); this.digLabel.sp.position.set(0, H + 2.35, 0.4); g.add(this.digLabel.sp);
    this.lights.push({p:new THREE.Vector3(0, cy, z + 1.5), r:9, c:C("#ffc857"), base:0, k:"dig"});
    this.digCenter = new THREE.Vector3(0, cy, z);
  }
  buildFaces(rockM){
    const R = this.root;
    /* chaque front : un amas de roche contre la paroi, veiné de minerai, une lanterne sur un poteau */
    const vein = mineMat({key:"face", color:"#ffffff", rough:0.9, flat:true, tint:`${ROCK_TINT}
        /* le front : la roche entamée, plus claire, veinée du minerai de la couche */
        float v = smoothstep(0.04, 0.0, abs(bn(vWP.xz * 1.1 + vWP.y * 1.6) - 0.5)) * smoothstep(0.45, 0.6, bn(vWP.xz * 0.6 + vWP.y));
        diffuseColor.rgb = mix(rock * 1.08, uOre * (0.55 + 0.3 * rn3), v * 0.8);`,
      glow:`float v2 = smoothstep(0.05, 0.0, abs(bn(vWP.xz * 1.1 + vWP.y * 1.6) - 0.5)) * smoothstep(0.45, 0.6, bn(vWP.xz * 0.6 + vWP.y));
        vec2 sc = floor(vWP.xz * 11.0 + vWP.y * 7.0);
        float sp = step(0.9, bh(sc)) * (0.5 + 0.5 * sin(uBT * 3.0 + bh(sc) * 40.0));
        glow += uOre * v2 * (0.1 + sp * 0.8) + diffuseColor.rgb * 0.08;`});
    const list = [], posts = [];
    for(let i = 0; i < 6; i++){
      const F = this.facePoint(i, 0.2);
      const tx = -Math.sin(F.a), tz = Math.cos(F.a);
      for(let k = 0; k < 4; k++){ const o = (k - 1.5) * 0.9; list.push({x:F.x + tx * o, y:0.6 + (k % 2) * 0.9, z:F.z + tz * o, s:1.1 + (k % 3) * 0.35, ry:i + k, rx:k * 0.7}); }
      const P = this.facePoint(i, 3.4);
      posts.push({x:P.x + tx * 1.6, z:P.z + tz * 1.6});
    }
    inst(R, rockGeo(31, 1, 0.75), vein, list, true, true);
    this.facePosts = posts;
  }
  buildLanterns(){
    const R = this.root;
    const pole = woodM("#5a4430");
    const glass = new THREE.MeshBasicMaterial({color:"#ffa53a"}), cap = metalM("#3a2e22");
    const spots = this.facePosts.concat([{x:-3.2, z:9.6}, {x:3.2, z:9.6}, {x:-5.6, z:-10.0}, {x:5.6, z:-10.0}]);
    const P = [], L = [];
    for(const s of spots){ P.push({x:s.x, y:1.35, z:s.z, sx:0.12, sy:2.7, sz:0.12}); L.push({x:s.x, y:2.75, z:s.z, s:0.2}); this.lights.push({p:new THREE.Vector3(s.x, 2.6, s.z), r:6.5, c:C("#ffb45a"), base:0.9, k:"lan"}); }
    inst(R, new THREE.BoxGeometry(1, 1, 1), pole, P, true, false);
    inst(R, new THREE.CylinderGeometry(0.7, 0.85, 1.5, 8), glass, L, false, false);
    inst(R, new THREE.ConeGeometry(1, 0.6, 8), cap, L.map(l=>({x:l.x, y:l.y + 0.22, z:l.z, s:0.17})), false, false);
    this.halo = new THREE.SpriteMaterial({map:haloTex(), color:"#ffb347", transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false, fog:false});
    for(const s of L){ const h = new THREE.Sprite(this.halo); h.position.set(s.x, s.y, s.z); h.scale.setScalar(1.6); R.add(h); }
  }
  buildForge(){
    const R = this.root, x = -8.2, z = 3.4, a = Math.atan2(z, x);
    /* (son devant regarde le centre de la caverne) */
    const g = this.forge = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); R.add(g);
    this.forgePos = new THREE.Vector3(x, 0, z);
    const brick = glowMat({key:"brick", color:"#7a4a38", rough:0.9, tint:`vec2 b = vec2(vWP.x * 2.2 + floor(vWP.y * 4.0) * 0.5 + vWP.z * 2.2, vWP.y * 4.0); float m = step(0.92, fract(b.x)) + step(0.88, fract(b.y));
      diffuseColor.rgb *= mix(0.85 + 0.25 * bh(floor(b)), 0.45, min(1.0, m));`});
    /* le four : un dôme de briques, sa gueule qui flamboie, sa cheminée */
    const oven = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), brick); oven.scale.set(1, 1.2, 1); oven.position.set(0, 0, -0.6); oven.castShadow = true; g.add(oven);
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 5.5, 10), brick); chim.position.set(0.6, 4, -1.2); g.add(chim);
    this.mouth = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20, 0, Math.PI), new THREE.MeshBasicMaterial({color:"#5a1606"})); this.mouth.position.set(0, 0.12, 0.99); g.add(this.mouth);
    /* au fond de la gueule, les braises */
    this.coals = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16, 0, Math.PI), new THREE.MeshBasicMaterial({color:"#ff7a1a"})); this.coals.position.set(0, 0.12, 1.0); g.add(this.coals);
    this.flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 8, 1, true), new THREE.MeshBasicMaterial({color:"#ff9a3a", transparent:true, opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false}));
    this.flame.position.set(0, 0.5, 0.75); g.add(this.flame);
    /* l'enclume, le baquet, le râtelier des outils (dans leur matière) */
    const iron = metalM("#4a4e58", 0.35);
    const anvil = new THREE.Group(); anvil.position.set(-1.9, 0, 1.2); g.add(anvil);
    const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), iron); a1.position.y = 0.3; anvil.add(a1);
    const a2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.42), iron); a2.position.y = 0.74; anvil.add(a2);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 8).rotateZ(Math.PI / 2), iron); horn.position.set(0.78, 0.74, 0); anvil.add(horn);
    this.anvil = anvil;
    const rack = new THREE.Group(); rack.position.set(2.1, 0, 0.6); rack.rotation.y = -0.4; g.add(rack); this.rack = rack;
    const wood = woodM("#7a5432");
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 0.12), wood); p.position.set(sd * 1.1, 0.95, 0); rack.add(p); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.12), wood); bar.position.y = 1.75; rack.add(bar);
    this.toolMeshes = {};
    ["pick", "hammer", "drill", "prop"].forEach((k, i)=>{ const t = toolMesh(k); t.position.set(-0.8 + i * 0.55, 1.05, 0.12); rack.add(t); this.toolMeshes[k] = t; });
    this.lights.push({p:new THREE.Vector3(x, 1.2, z).add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(-1.2)), r:8, c:C("#ff7a2a"), base:1.6, k:"forge"});
    this.U.embers = swarm(R, Array.from({length:40}, ()=>({x:x - Math.cos(a) * 0.4, y:3.5, z:z - Math.sin(a) * 0.4})), {kind:1, size:0.07, rise:7, c1:"#ffb347", c2:"#ff5a1a", fade:1e5, seed:5});
  }
  buildBoard(){
    const R = this.root, x = -4.8, z = 8.2;
    const g = this.board = new THREE.Group(); g.position.set(x, 0, z); g.lookAt(0, 0, 0); R.add(g);
    this.boardPos = new THREE.Vector3(x, 0, z);
    const wood = woodM("#7a5432");
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 0.16), wood); p.position.set(sd * 1.6, 1.4, 0); g.add(p); }
    /* l'écran : l'équipe, ses six places (repeint quand elle change) */
    this.boardCv = document.createElement("canvas"); this.boardCv.width = 512; this.boardCv.height = 256;
    this.boardTex = new THREE.CanvasTexture(this.boardCv); this.boardTex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({map:this.boardTex, toneMapped:false}));
    scr.position.set(0, 1.9, 0.09); g.add(scr);
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 0.12), metalM("#2a2420", 0.1)); back.position.set(0, 1.9, 0); g.add(back);
    this.lights.push({p:new THREE.Vector3(x, 2, z).multiplyScalar(0.92), r:5, c:C("#35f0d6"), base:0.6, k:"board"});
  }
  buildTable(){
    const R = this.root, x = 6.4, z = -6.0;
    const g = this.table = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); R.add(g);
    this.tablePos = new THREE.Vector3(x, 0, z);
    const wood = woodM("#8a5e3a");
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.5), wood); top.position.y = 0.95; g.add(top);
    for(const [a2, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), wood); l.position.set(a2 * 1.05, 0.45, b * 0.6); g.add(l); }
    /* la carte des chantiers : cinq puits, celui où l'on est s'allume */
    this.mapCv = document.createElement("canvas"); this.mapCv.width = 512; this.mapCv.height = 320;
    this.mapTex = new THREE.CanvasTexture(this.mapCv); this.mapTex.colorSpace = THREE.SRGBColorSpace;
    const map = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.3), new THREE.MeshBasicMaterial({map:this.mapTex, color:"#d8ccb8"}));
    map.rotation.x = -Math.PI / 2; map.position.y = 1.02; g.add(map);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.22, 8), new THREE.MeshBasicMaterial({color:"#ffa53a"})); lamp.position.set(0.9, 1.3, -0.45); g.add(lamp);
  }
  buildCart(){
    const R = this.root, g = this.cart = new THREE.Group(); g.position.set(4.6, 0, 5.4); g.rotation.y = 0.45; R.add(g);
    this.cartPos = new THREE.Vector3(4.6, 0, 5.4);
    const steel = metalM("#5a606a");
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2), woodM("#7b5434")); body.position.y = 0.72; body.castShadow = true; g.add(body);
    for(const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){ const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12).rotateZ(Math.PI / 2), steel); w.position.set(a * 0.66, 0.24, b * 0.7); g.add(w); }
    /* les rails, du wagonnet au monte-charge */
    const rail = metalM("#7a7e86", 0.4), ties = woodM("#5a4430");
    const pts = [new THREE.Vector3(5.2, 0, 4.0), new THREE.Vector3(3.9, 0, 7.4), new THREE.Vector3(1.9, 0, 9.9)];
    const T = [];
    for(let i = 0; i < pts.length - 1; i++){
      const A = pts[i], B = pts[i + 1], L = A.distanceTo(B), ang = Math.atan2(B.x - A.x, B.z - A.z);
      for(const sd of [-0.45, 0.45]){ const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, L), rail); r.position.copy(A).lerp(B, 0.5); r.position.x += Math.cos(ang) * sd; r.position.z -= Math.sin(ang) * sd; r.position.y = 0.1; r.rotation.y = ang; R.add(r); }
      for(let k = 0; k < L / 0.8; k++){ const p = A.clone().lerp(B, k * 0.8 / L); T.push({x:p.x, y:0.04, z:p.z, sx:1.3, sy:0.07, sz:0.22, ry:ang}); }
    }
    inst(R, new THREE.BoxGeometry(1, 1, 1), ties, T, false, true);
    /* le minerai dans le wagon : autant de pépites qu'on en a (jusqu'à un plafond) */
    this.cartOre = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color:"#ffffff", roughness:0.35, metalness:0.3, emissive:"#ffffff", emissiveIntensity:0.08}), 60);
    this.cartOre.count = 0; this.cartOre.position.set(0, 0.95, 0); g.add(this.cartOre);
    /* les bacs de minerai, à côté : un par minerai, rempli selon ce qu'on possède */
    this.pileIm = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color:"#ffffff", roughness:0.3, metalness:0.35, emissive:"#ffffff", emissiveIntensity:0.12}), 240);
    this.pileIm.count = 0; this.pileIm.castShadow = true; R.add(this.pileIm);
    const plank = woodM("#7a5432"), B = [];
    for(let i = 0; i < 6; i++){
      const c = binPos(i);
      for(const [dx, dz, sx, sz] of [[0, -0.55, 1.2, 0.1], [0, 0.55, 1.2, 0.1], [-0.55, 0, 0.1, 1.2], [0.55, 0, 0.1, 1.2]]) B.push({x:c.x + dx, y:0.24, z:c.z + dz, sx, sy:0.48, sz});
    }
    inst(R, new THREE.BoxGeometry(1, 1, 1), plank, B, true, true);
  }
  buildLift(){
    const R = this.root, g = this.lift = new THREE.Group(); g.position.set(0, 0, RZ - 2.2); R.add(g);
    this.liftPos = new THREE.Vector3(0, 0, RZ - 2.6);
    const steel = metalM("#5a606a");
    const plat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.4), steel); plat.position.y = 0.1; g.add(plat);
    for(const sd of [-1, 1]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 7, 0.2), steel); p.position.set(sd * 1.6, 3.5, 1); g.add(p); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 0.25), steel); beam.position.set(0, 7, 1); g.add(beam);
    const lampG = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.2), new THREE.MeshBasicMaterial({color:"#35f0d6"})); lampG.position.set(0, 6.6, 0.85); g.add(lampG);
    this.liftLabel = labelSprite(1024, 200); this.liftLabel.sp.scale.set(5, 0.98, 1); this.liftLabel.sp.position.set(0, 7.9, 1); g.add(this.liftLabel.sp);
    paintLabel(this.liftLabel, "Remonter", "à la zone de capture", "#35f0d6");
  }
  /* ---------- l'état du jeu mobile, à l'écran ---------- */
  sync(f, si, t, dt){
    const ST = ref("STRATA"), S1 = ref("forSite") ? ref("forSite")() : null;
    if(!ST) return;
    const st = ST[si];
    /* les couleurs de la couche glissent vers la nouvelle (une couche atteinte se voit) */
    const k = Math.min(1, dt * 1.6);
    for(let i = 0; i < 3; i++) MU.uPal.value[i].lerp(TC.set(st.pal[i]), k);
    /* au-dessus de la Surface : la terre végétale, puis le noir */
    for(let i = 0; i < 4; i++){ const j = si - 1 - i; const c = j >= 0 ? ST[j].pal[1] : (j === -1 ? "#4a6a30" : "#2a2016"); MU.uBand.value[i].lerp(TC.set(c), k); }
    MU.uAll.value.forEach((c, i)=>{ const j = si - i; c.set(j >= 0 ? ST[j].pal[1] : "#4a6a30"); });
    MU.uSi.value = si;
    const tint = S1 && S1.tint; if(tint){ TC.set(tint); MU.uTint.value.set(TC.r, TC.g, TC.b, 0.32); } else MU.uTint.value.w = 0;
    const ore = ref("oreDef") && ref("oreDef")(ref("oreOf")(si)); if(ore) MU.uOre.value.lerp(TC.set(ore.pal[1]), k);
    this.cageOre.material.color.copy(MU.uOre.value); this.cageOre.material.emissive.copy(MU.uOre.value);
    /* le brouillard et la lumière prennent un peu de la couche (et du chantier) */
    this.scene.fog.color.set("#120c08").lerp(TC.set(st.pal[2]), 0.25); if(tint) this.scene.fog.color.lerp(TC.set(tint), 0.25);
    this.hemi.color.set("#ffe6c8").lerp(TC.set(st.pal[0]), 0.3); this.hemi.groundColor.set("#8a6a4a").lerp(TC.set(st.pal[1]), 0.35); if(tint) this.hemi.color.lerp(TC.set(tint), 0.3);
    /* la foreuse : sa matière, sa vitesse */
    const TT = ref("TOOL_TIERS"), dt0 = ref("toolTier") ? ref("toolTier")("drill") : 0;
    if(TT && this.drillTier !== dt0){ this.drillTier = dt0; const P = TT[dt0].pal; this.metal.color.set(P[1]); this.metalDark.color.set(P[2]); this.metal.metalness = dt0 >= 1 ? 0.35 : 0.1;
      if(dt0 === 5){ this.metal.emissive.set(P[1]); this.metal.emissiveIntensity = 0.35; } }
    /* les outils du râtelier, dans leur matière */
    if(TT) for(const k in this.toolMeshes){ const tt = ref("toolTier")(k); if(this.toolMeshes[k].userData.t !== tt){ this.toolMeshes[k].userData.t = tt; paintTool(this.toolMeshes[k], TT[tt]); } }
  }
  update(t, dt, cam, s){
    BT.uTime.value = t;
    /* la mèche tourne au rythme du forage ; le derrick vibre un peu */
    this.spin.rotation.y += dt * (s.rate > 0 ? 3 + Math.min(14, s.rate * 4) : 0.2);
    this.spin.position.y = Math.sin(t * 9) * 0.03;
    this.leds.material.color.set(s.rate > 0 ? (Math.sin(t * 4) > 0 ? "#35f0d6" : "#1a7a6c") : "#3a3a3a");
    /* la cage : elle monte, s'arrête là-haut, redescend */
    const cyc = (t % 16) / 16, h = cyc < 0.45 ? cyc / 0.45 : cyc < 0.55 ? 1 : 1 - (cyc - 0.55) / 0.45;
    this.cage.position.y = TOP - 1.7 + (h * h * (3 - 2 * h)) * (SHAFT_H - 3);
    this.cageOre.visible = cyc < 0.5;
    /* la forge : le feu danse */
    this.flame.scale.set(1 + Math.sin(t * 13) * 0.1, 0.85 + Math.sin(t * 17) * 0.2, 1);
    this.coals.material.color.setHSL(0.06 + Math.sin(t * 5) * 0.01, 1, 0.4 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23) * 0.02);
    /* la paroi de fouille : dorée tant qu'une fouille attend */
    const wr = s.walls > 0 ? 1 : 0;
    this.digGlowK = (this.digGlowK || 0) + (wr - (this.digGlowK || 0)) * Math.min(1, dt * 2);
    this.digGlow.material.opacity = this.digGlowK * (0.06 + 0.04 * Math.sin(t * 2.4));
    for(const L of this.lights) if(L.k === "dig") L.base = this.digGlowK * 1.3;
    MU.uWalls.value = this.digGlowK;
    MU.uFlash.value = Math.max(0, MU.uFlash.value - dt * 0.6);
    /* la lumière : la lampe frontale (la lueur de la route), les quatre lueurs les plus proches */
    CZ.uLamp.value.set(cam.position.x, cam.position.y + 0.2, cam.position.z, 0.55);
    const near = this.lights.map(l=>({l, d:Math.hypot(l.p.x - cam.position.x, l.p.z - cam.position.z) - (l.base > 0 ? l.r * 0.5 + l.base * 3 : -999)}))
      .filter(q=>q.l.base > 0.01).sort((a, b)=>a.d - b.d).slice(0, BL_N);
    for(let i = 0; i < BL_N; i++){
      const q = near[i], V = BL.uBL.value[i], Cc = BL.uBLC.value[i];
      if(!q){ V.set(0, -999, 0, 1); Cc.setRGB(0, 0, 0); continue; }
      V.set(q.l.p.x, q.l.p.y, q.l.p.z, q.l.r);
      const fl = q.l.k === "forge" || q.l.k === "lan" ? 0.88 + 0.12 * Math.sin(t * (q.l.k === "forge" ? 11 : 3) + i * 1.7) : 1;
      Cc.copy(q.l.c).multiplyScalar(q.l.base * fl);
    }
    this.fill.intensity = 5 + Math.sin(t * 2.3) * 0.6;
  }
  /* le wagonnet et les tas : on voit ce qu'on possède */
  piles(ores){
    const ORES = ref("ORES"); if(!ORES) return;
    const sig = ORES.map(o=>ores[o.id] || 0).join(",");
    if(sig === this.pileSig) return; this.pileSig = sig;
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), E = new THREE.Euler();
    let n = 0;
    ORES.forEach((o, i)=>{
      const have = ores[o.id] || 0; if(!have) return;
      const cnt = Math.min(40, Math.round(4 + Math.log2(1 + have) * 5));
      const c = binPos(i), cx = c.x, cz = c.z;
      for(let k = 0; k < cnt && n < 240; k++){
        const a = k * 2.399, r = Math.sqrt(k / cnt) * 0.42, y = 0.14 + (1 - r / 0.42) * 0.5 * Math.min(1, cnt / 20) + (k / cnt) * 0.12;
        P.set(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r); E.set(k, k * 0.7, 0); Q.setFromEuler(E); const s = 0.1 + ((k * 13) % 7) / 70; Sc.set(s, s * 1.2, s);
        M.compose(P, Q, Sc); this.pileIm.setMatrixAt(n, M); this.pileIm.setColorAt(n, TC.set(o.pal[(k % 3)])); n++;
      }
    });
    this.pileIm.count = n; this.pileIm.instanceMatrix.needsUpdate = true; if(this.pileIm.instanceColor) this.pileIm.instanceColor.needsUpdate = true;
    /* le wagon, plein de ce qu'on vient de remonter */
    const ore = ref("oreOf") && ref("oreDef")(ref("oreOf")(ref("forage")().depth));
    const m2 = Math.min(60, 8 + Math.round(Math.log2(1 + (ores[ore ? ore.id : "cu"] || 0)) * 6));
    for(let k = 0; k < m2; k++){
      P.set(((k * 37) % 10) / 10 * 1.1 - 0.55, 0.05 + ((k * 17) % 5) / 5 * 0.25, ((k * 53) % 14) / 14 * 1.7 - 0.85); E.set(k, k * 1.3, 0); Q.setFromEuler(E);
      const s = 0.12 + ((k * 7) % 5) / 50; Sc.set(s, s, s); M.compose(P, Q, Sc); this.cartOre.setMatrixAt(k, M); this.cartOre.setColorAt(k, TC.set(ore ? ore.pal[k % 3] : "#c8733a"));
    }
    this.cartOre.count = m2; this.cartOre.instanceMatrix.needsUpdate = true; if(this.cartOre.instanceColor) this.cartOre.instanceColor.needsUpdate = true;
  }
  /* l'écran du tableau : l'équipe ; la carte de la table : les chantiers */
  paintBoard(crew, slots, si){
    const x = this.boardCv.getContext("2d"), W = 512, H = 256;
    x.fillStyle = "#0a1418"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(53,240,214,.35)"; x.lineWidth = 2; x.strokeRect(6, 6, W - 12, H - 12);
    x.fillStyle = "#35f0d6"; x.font = "bold 22px 'Press Start 2P', monospace"; x.textAlign = "left"; x.fillText("L'ÉQUIPE", 22, 42);
    x.font = "16px 'Pixelify Sans', sans-serif"; x.fillStyle = "#8fb8c8"; x.fillText(`${crew.length} / ${slots} au travail · E pour changer`, 22, 70);
    const POKE = G().POKE, aff = ref("digAff");
    for(let i = 0; i < 6; i++){
      const cx = 22 + (i % 3) * 160, cy = 92 + Math.floor(i / 3) * 76;
      x.fillStyle = i < slots ? "rgba(53,240,214,.08)" : "rgba(255,255,255,.03)"; x.fillRect(cx, cy, 148, 64);
      const id = crew[i];
      if(id){
        const a = aff ? aff(id, si) : 1;
        x.fillStyle = "#e8f6ff"; x.font = "17px 'Pixelify Sans', sans-serif"; x.fillText(POKE[id] ? POKE[id].name : "?", cx + 10, cy + 26);
        x.fillStyle = a > 1 ? "#ffd166" : a < 1 ? "#ff8a8a" : "#8fb8c8"; x.font = "14px 'Pixelify Sans', sans-serif";
        x.fillText(a > 1 ? "⚡ rapide ici" : a < 1 ? "lent ici" : "creuse", cx + 10, cy + 50);
      } else { x.fillStyle = i < slots ? "#5a8a9a" : "#3a4a52"; x.font = "15px 'Pixelify Sans', sans-serif"; x.fillText(i < slots ? "+ place libre" : "🔒", cx + 10, cy + 38); }
    }
    this.boardTex.needsUpdate = true;
  }
  paintMap(){
    const SITES = ref("FOR_SITES"), f = ref("forage")(); if(!SITES) return;
    const x = this.mapCv.getContext("2d"), W = 512, H = 320;
    x.fillStyle = "#b89c6e"; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(90,60,30,.15)"; for(let i = 0; i < 60; i++) x.fillRect((i * 97) % W, (i * 53) % H, 30, 2);
    x.strokeStyle = "#7a5a3a"; x.lineWidth = 3; x.strokeRect(8, 8, W - 16, H - 16);
    const pos = [[256, 170], [110, 90], [400, 90], [120, 250], [400, 250]];
    x.strokeStyle = "rgba(90,60,30,.5)"; x.setLineDash([6, 6]); x.lineWidth = 2;
    for(let i = 1; i < 5; i++){ x.beginPath(); x.moveTo(pos[0][0], pos[0][1]); x.lineTo(pos[i][0], pos[i][1]); x.stroke(); }
    x.setLineDash([]);
    SITES.forEach((S1, i)=>{
      const [px, py] = pos[i], open = ref("siteOpen")(S1.id), here = (f.site || "main") === S1.id;
      x.fillStyle = S1.tint || "#a8865a"; x.globalAlpha = open ? 1 : 0.35;
      x.beginPath(); x.arc(px, py, here ? 26 : 20, 0, Math.PI * 2); x.fill();
      x.globalAlpha = 1; x.strokeStyle = here ? "#fff" : "#3a2a1a"; x.lineWidth = here ? 4 : 2; x.stroke();
      x.fillStyle = "#1e130a"; x.font = "bold 22px 'Pixelify Sans', sans-serif"; x.textAlign = "center";
      x.fillText(open || ref("siteReachable")(S1.id) ? S1.n : "???", px, py + (here ? 48 : 42));
    });
    this.mapTex.needsUpdate = true;
  }
  /* une couche atteinte : la roche tremble, la poussière tombe */
  quake(){ MU.uFlash.value = 1; }
}
const TC = new THREE.Color();
/* les six bacs : deux rangées, près du wagonnet */
function binPos(i){ return {x:6.9 + (i % 3) * 1.45, z:0.6 + Math.floor(i / 3) * 1.45}; }

/* ---------- les outils du râtelier : simples, dans leur matière ---------- */
function toolMesh(k){
  const g = new THREE.Group();
  const head = new THREE.MeshStandardMaterial({color:"#a06b38", metalness:0.5, roughness:0.4}), handle = new THREE.MeshStandardMaterial({color:"#64401f", roughness:0.8});
  g.userData.mats = {head, handle};
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), handle); h.position.y = -0.3; g.add(h);
  if(k === "pick"){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.08), head); p.position.y = 0.15; g.add(p); const t1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6).rotateZ(-Math.PI / 2), head); t1.position.set(0.38, 0.15, 0); g.add(t1); const t2 = t1.clone(); t2.rotation.z = Math.PI; t2.position.x = -0.38; g.add(t2); }
  else if(k === "hammer"){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.2), head); p.position.y = 0.15; g.add(p); }
  else if(k === "drill"){ const p = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8).rotateX(Math.PI), head); p.position.y = -0.85; g.add(p); const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), head); b.position.y = 0.2; g.add(b); }
  else { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.12), head); p.position.y = 0.15; g.add(p); }
  return g;
}
function paintTool(g, T){ const M = g.userData.mats; M.head.color.set(T.pal[1]); M.handle.color.set(T.handle ? T.handle[0] : T.pal[2]); M.head.metalness = T.n === "bois" ? 0.05 : 0.65; M.head.emissive.set(T.n === "rêve" || T.n === "onirique" ? T.pal[1] : "#000000"); M.head.emissiveIntensity = 0.4; }
let _halo = null;
function haloTex(){
  if(_halo) return _halo;
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d");
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_halo = new THREE.CanvasTexture(cv));
}
export function paintLabel(L, title, sub, col){
  const cv = L.cv, x = cv.getContext("2d"), W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H);
  x.fillStyle = "rgba(4,6,12,0.72)"; x.beginPath(); x.roundRect(60, 16, W - 120, H - 32, 24); x.fill();
  x.strokeStyle = col; x.lineWidth = 4; x.stroke();
  x.textAlign = "center"; x.fillStyle = "#ffffff"; x.font = "800 58px Unbounded, sans-serif"; x.fillText(title, W / 2, 90);
  x.font = "34px 'Pixelify Sans', sans-serif"; x.fillStyle = col; x.fillText(sub, W / 2, 146);
  L.tex.needsUpdate = true;
}
