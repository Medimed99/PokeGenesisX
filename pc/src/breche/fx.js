/* ============================================================
   LA BRÈCHE EN 3D · LES ATTAQUES ET LES EFFETS
   Tout ce que la simulation fait naître (projectiles, zones, éclairs,
   rayons, croissants, ondes de choc, débris, octets, ramassables,
   dangers du gardien) est lu à chaque image et dessiné en volume :
     · un projectile a une forme par type (étoile, croissant, roc,
       aiguille, éclat, feuille, goutte, sphère d'aura, Ball'Ombre…),
       un halo et une traîne ;
     · une frappe tombe du ciel, une onde de choc monte du sol comme
       un mur de lumière, une tornade est un entonnoir qui tourne, un
       rayon est un faisceau, une vague un mur d'eau qui avance ;
     · ce qui est vraiment plat (traces au sol, brûlures, fissures,
       dessins des légendaires qui n'ont pas encore leur version 3D)
       est peint par le jeu mobile sur une toile posée au sol.
   ============================================================ */
import * as THREE from "three";
import { S, ref, col, Glow, Ribbon, Discs, Pool, addMat } from "./lib.js";

const SHOT_Y = 0.9;
const TY_SHAPE = {1:"star", 18:"star", 2:"orb", 3:"crescent", 17:"crescent", 4:"orb", 5:"rock", 6:"rock", 7:"needle", 8:"orb", 9:"shard", 10:"orb", 11:"drop", 12:"leaf", 13:"orb", 14:"orb", 15:"shard", 16:"orb"};
const DONE3D = new Set(["warn", "ring", "puddle", "seed", "strike", "tornado", "sweep", "wall", "sing", "dash", "slam", "defer"]);
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();

/* ---------- les formes instanciées ---------- */
function starGeo(){
  const sh = new THREE.Shape();
  for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.22 : 0.5; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(sh, {depth:0.12, bevelEnabled:false}); g.translate(0, 0, -0.06); return g;
}
function leafGeo(){ const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.quadraticCurveTo(0.32, 0, 0, 0.5); sh.quadraticCurveTo(-0.32, 0, 0, -0.5); return new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2); }
function bladeGeo(){ const a = new THREE.BoxGeometry(1, 0.04, 0.14), b = new THREE.BoxGeometry(0.14, 0.04, 1); return mergeTwo(a, b); }
function mergeTwo(a, b){
  const pa = a.toNonIndexed(), pb = b.toNonIndexed(), g = new THREE.BufferGeometry();
  const p = new Float32Array(pa.attributes.position.count * 3 + pb.attributes.position.count * 3); p.set(pa.attributes.position.array); p.set(pb.attributes.position.array, pa.attributes.position.array.length);
  g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
}
function flakeGeo(){
  const parts = [];
  for(let i = 0; i < 3; i++) parts.push(new THREE.BoxGeometry(1, 0.05, 0.07).rotateY(i * Math.PI / 3));
  for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; for(const sd of [-1, 1]){ const b = new THREE.BoxGeometry(0.26, 0.05, 0.05); b.rotateY(-(a + sd * 0.7)); b.translate(Math.cos(a) * 0.3 + Math.cos(a + sd * 0.7) * 0.11, 0, -(Math.sin(a) * 0.3 + Math.sin(a + sd * 0.7) * 0.11)); parts.push(b); } }
  const out = new THREE.BufferGeometry(), arrs = parts.map(p=>p.toNonIndexed().attributes.position.array), n = arrs.reduce((a, b)=>a + b.length, 0), P = new Float32Array(n);
  let o = 0; for(const a of arrs){ P.set(a, o); o += a.length; }
  out.setAttribute("position", new THREE.BufferAttribute(P, 3)); out.computeVertexNormals(); return out.rotateX(Math.PI / 2);
}
function menhirGeo(){
  const g = new THREE.BoxGeometry(1, 1, 0.62, 2, 4, 1); g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for(let i = 0; i < p.count; i++){ const y = p.getY(i), k = 1 - y * 0.18; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); if(y > 0.99) p.setY(i, 1 + (0.5 - Math.abs(p.getX(i))) * 0.35); }
  g.computeVertexNormals(); return g;
}
export const SHAPES = {
  flake:flakeGeo,
  feather:() => new THREE.SphereGeometry(0.5, 10, 8).scale(0.32, 1, 0.12).translate(0, 0.5, 0),
  menhir:menhirGeo,
  ball:() => new THREE.IcosahedronGeometry(0.5, 2),
  hex:() => new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0),
  orb:() => new THREE.IcosahedronGeometry(0.5, 2),
  star:starGeo,
  crescent:() => new THREE.TorusGeometry(0.42, 0.07, 5, 14, Math.PI * 1.1).rotateX(Math.PI / 2).rotateY(Math.PI * 0.45),
  rock:() => new THREE.DodecahedronGeometry(0.5, 0),
  needle:() => new THREE.ConeGeometry(0.09, 0.8, 6).rotateX(Math.PI / 2),
  shard:() => new THREE.OctahedronGeometry(0.5, 0).scale(0.35, 0.35, 1.2),
  leaf:leafGeo,
  drop:() => new THREE.SphereGeometry(0.5, 10, 8).scale(0.8, 0.8, 1.35),
  blade:bladeGeo,
  ring:() => new THREE.TorusGeometry(0.5, 0.05, 5, 24).rotateX(Math.PI / 2),
  gem:() => new THREE.OctahedronGeometry(0.5, 0).scale(0.6, 1, 0.6),
  cube:() => new THREE.BoxGeometry(1, 1, 1),
  spike:() => new THREE.ConeGeometry(0.5, 1, 5).translate(0, 0.5, 0)
};
export class Inst {
  constructor(scene, shape, cap, lit){
    const mat = lit ? new THREE.MeshStandardMaterial({roughness:0.8, flatShading:true}) : new THREE.MeshBasicMaterial({toneMapped:true});
    this.mesh = new THREE.InstancedMesh(SHAPES[shape](), mat, cap);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = !!lit;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color()); this.cap = cap; this.n = 0;
    scene.add(this.mesh);
  }
  begin(){ this.n = 0; }
  add(x, y, z, yaw, pitch, roll, s, c, sy){
    if(this.n >= this.cap) return;
    _q.setFromEuler(_e.set(pitch, yaw, roll, "YXZ"));
    _m.compose(_v.set(x, y, z), _q, _s.set(s, sy || s, s));
    this.mesh.setMatrixAt(this.n, _m); this.mesh.setColorAt(this.n, col(c)); this.n++;
  }
  end(){ this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true; if(this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}

/* ---------- les volumes faits sur mesure ---------- */
const BAND_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export function bandMat(){
  return new THREE.ShaderMaterial({vertexShader:BAND_VS, transparent:true, depthWrite:false, side:THREE.DoubleSide,
    blending:THREE.CustomBlending, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor,
    uniforms:{uC:{value:new THREE.Color()}, uA:{value:1}, uT:{value:0}, uMode:{value:0}},
    fragmentShader:`varying vec2 vUv; uniform vec3 uC; uniform float uA, uT, uMode;
      void main(){
        float y = vUv.y, a;
        if(uMode < 0.5) a = (1.0 - y) * (1.0 - y) * (0.7 + 0.3 * sin(vUv.x * 60.0 + uT * 8.0));                       /* onde de choc */
        else if(uMode < 1.5){ float s = sin(vUv.x * 18.0 - y * 9.0 + uT * 14.0) * 0.5 + 0.5; a = smoothstep(0.25, 0.9, s) * (1.0 - y * 0.6) * smoothstep(0.0, 0.12, y); } /* tornade */
        else if(uMode < 2.5){ a = smoothstep(0.0, 0.25, y) * (1.0 - smoothstep(0.75, 1.0, y)) + smoothstep(0.82, 0.96, y) * 1.4; a *= 0.75 + 0.25 * sin(vUv.x * 40.0 + uT * 10.0); } /* vague */
        else if(uMode < 3.5){ float b = step(0.5, fract(y * 10.0 - uT * 1.5 + sin(vUv.x * 31.0) * 0.3)); a = (1.0 - y) * (0.35 + 0.65 * b) * (0.6 + 0.4 * sin(vUv.x * 120.0 + uT * 20.0)); } /* arène */
        else if(uMode < 4.5){ a = smoothstep(0.0, 0.03, vUv.y) * (1.0 - smoothstep(0.96, 1.0, vUv.y)) * (0.7 + 0.3 * sin(vUv.y * 40.0 - uT * 30.0)) * 0.6; }   /* rayon */
        else if(uMode < 5.5){                                                                                                    /* aurore */
          float x = vUv.x, w = sin(x * 9.0 + uT * 1.7) * 0.5 + 0.5, r = sin(x * 37.0 - uT * 3.0) * 0.5 + 0.5;
          a = smoothstep(0.0, 0.35, y) * (1.0 - smoothstep(0.55, 1.0, y)) * (0.45 + 0.55 * r) * smoothstep(0.0, 0.08, x) * (1.0 - smoothstep(0.92, 1.0, x));
          vec3 au = mix(mix(vec3(0.02, 0.75, 1.0), vec3(0.1, 1.0, 0.35), w), vec3(0.55, 0.15, 1.0), smoothstep(0.5, 1.0, y));
          gl_FragColor = vec4(au * a * uA * 0.55, 1.0); return;
        }
        else { float c = pow(1.0 - abs(y - 0.5) * 2.0, 3.0); a = c * (0.6 + 0.4 * sin(vUv.x * 50.0 - uT * 16.0)); }                       /* barrière */
        gl_FragColor = vec4(uC * a * uA + vec3(1.0) * pow(max(0.0, a - 0.75), 2.0) * uA, 1.0);
      }`});
}
export function setBand(m, c, a, t, mode){ const U = m.material.uniforms; U.uC.value.copy(col(c)); U.uA.value = a; U.uT.value = t; U.uMode.value = mode; }
const CYL = new THREE.CylinderGeometry(1, 1, 1, 48, 1, true).translate(0, 0.5, 0);
const FUNNEL = (() => { const pts = []; for(let i = 0; i <= 12; i++){ const y = i / 12; pts.push(new THREE.Vector2(0.25 + Math.pow(y, 1.6) * 1.1, y)); } return new THREE.LatheGeometry(pts, 32); })();
const BEAM = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true).rotateZ(-Math.PI / 2).translate(0.5, 0, 0);
const WALL = new THREE.PlaneGeometry(1, 1, 24, 1).translate(0, 0.5, 0);
const ARC = new THREE.RingGeometry(0.72, 1, 28, 1, -1.05, 2.1).rotateX(-Math.PI / 2);
const QUAD = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0);

export class Fx {
  constructor(scene){
    this.scene = scene;
    this.glow = new Glow(scene, 5000, true);
    this.puff = new Glow(scene, 600, false);
    this.rib = new Ribbon(scene, 6000);
    this.discs = new Discs(scene);
    this.inst = {};
    for(const k of ["orb", "star", "crescent", "needle", "shard", "leaf", "drop", "blade", "ring", "gem"]) this.inst[k] = new Inst(scene, k, k === "gem" ? 700 : 400, false);
    this.inst.rock = new Inst(scene, "rock", 200, true);
    this.inst.cube = new Inst(scene, "cube", 60, true);
    this.inst.spike = new Inst(scene, "spike", 300, true);
    this.bands = new Pool(scene, () => { const m = new THREE.Mesh(CYL, bandMat()); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.funnels = new Pool(scene, () => { const m = new THREE.Mesh(FUNNEL, bandMat()); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.beams = new Pool(scene, () => { const m = new THREE.Mesh(BEAM, bandMat()); m.renderOrder = 13; m.frustumCulled = false; return m; });
    this.walls = new Pool(scene, () => { const m = new THREE.Mesh(WALL, bandMat()); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.arcs = new Pool(scene, () => { const m = new THREE.Mesh(ARC, addMat("#ffffff", 1)); m.renderOrder = 13; m.frustumCulled = false; return m; });
    this.quads = new Pool(scene, () => { const m = new THREE.Mesh(QUAD, addMat("#ff3d7f", 0.4)); m.renderOrder = 7; m.frustumCulled = false; return m; });
    this.holes = new Pool(scene, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({color:"#05000a"})); m.frustumCulled = false; return m; });
    /* l'arène : un mur de corruption, et l'ombre au-delà */
    this.arenaWall = new THREE.Mesh(CYL, bandMat()); this.arenaWall.visible = false; this.arenaWall.renderOrder = 11; scene.add(this.arenaWall);
    this.arenaOut = new THREE.Mesh(new THREE.RingGeometry(1, 6, 64, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#18001a", transparent:true, opacity:0.55, depthWrite:false}));
    this.arenaOut.visible = false; this.arenaOut.renderOrder = 6; scene.add(this.arenaOut);
    /* la toile posée au sol : traces, brûlures, dessins plats */
    this.gc = document.createElement("canvas"); this.gc.width = this.gc.height = 1024;
    this.gx = this.gc.getContext("2d");
    this.gtex = new THREE.CanvasTexture(this.gc); this.gtex.colorSpace = THREE.SRGBColorSpace;
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map:this.gtex, transparent:true, depthWrite:false,
      polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1}));
    this.ground.renderOrder = 3; this.ground.frustumCulled = false; scene.add(this.ground);
    this.local = [];                                          /* des éclats à nous (bulles, pousses, débris) */
  }
  /* ---------- la toile au sol (dessinée par le jeu mobile) ---------- */
  paintGround(R, frame){
    if(frame % 2) return;                                     /* trente fois par seconde suffit */
    const x = this.gx, SPAN = 2048, x0 = Math.round((R.x - SPAN / 2) / 16) * 16, y0 = Math.round((R.y - SPAN / 2) / 16) * 16;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1024, 1024);
    x.setTransform(0.5, 0, 0, 0.5, 0, 0);
    const X = v => v - x0, Y = v => v - y0;
    const W0 = R.W, H0 = R.H; R.W = R.H = SPAN;
    try {
      const dd = ref("brDrawDecals"); if(dd) dd(x, R, X, Y);
      const rift = ref("brDrawRift"); if(rift) rift(x, R, X, Y);
      /* les anomalies de la faille profonde (mines, horde dorée, marque du chasseur…) : en volume, depth.js */
      /* les zones qui n'ont pas encore leur version en volume */
      const ze = ref("brDrawZoneExtra");
      const LD = ref("BR_LEG_DRAW") || {};
      R.P.zones.each(z=>{
        if(z.delay > 0 || DONE3D.has(z.k) || (this.leg && this.leg[z.k])) return;
        try { ze && ze(x, R, z, X, Y); const D = LD[z.k]; if(D){ if(D.mid) D.mid(x, R, z, X, Y); if(D.sky) D.sky(x, R, z, X, Y); } } catch(e){}
        x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; if(x.setLineDash) x.setLineDash([]);
      });
      /* le geyser qui gronde */
      for(const p of R.map.near.pois) if(p.k === "geyser" && (p.phase || 0) > 4.6){ x.globalAlpha = 0.25 + ((p.phase - 4.6) / 1.6) * 0.4; x.strokeStyle = "#ff8a3d"; x.lineWidth = 6; x.setLineDash([16, 10]); x.beginPath(); x.arc(X(p.x), Y(p.y), 115, 0, 7); x.stroke(); x.setLineDash([]); x.globalAlpha = 1; }
    } catch(e){ /* un dessin qui échoue ne doit rien casser */ }
    R.W = W0; R.H = H0;
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    this.gtex.needsUpdate = true;
    this.ground.position.set((x0 + SPAN / 2) * S, 0.035, (y0 + SPAN / 2) * S);
  }
  /* ---------- à chaque image ---------- */
  render(R, c){
    const t = c.t, dt = c.dt, G = this.glow, P = this.puff, B = this.rib, D = this.discs;
    G.begin(); P.begin(); B.begin(c.eye); D.begin(); Discs.t = t;
    if(this.leg) this.leg.begin();
    if(this.depth) this.depth.begin();
    for(const k in this.inst) this.inst[k].begin();
    for(const p of [this.bands, this.funnels, this.beams, this.walls, this.arcs, this.quads, this.holes]) p.begin();
    this.paintGround(R, c.frame);
    this.shots(R, t);
    this.zones(R, t, c);
    this.fxs(R, t, c);
    this.parts(R, t);
    this.loot(R, t);
    this.team(R, t, c);
    this.boss(R, t, c);
    if(this.depth) this.depth.render(R, t, dt, c);
    this.locals(dt);
    if(this.extra) this.extra(R, t, dt, c);
    if(this.leg) this.leg.end();
    if(this.depth) this.depth.end();
    G.end(); P.end(); B.end(); D.end();
    for(const k in this.inst) this.inst[k].end();
    for(const p of [this.bands, this.funnels, this.beams, this.walls, this.arcs, this.quads, this.holes]) p.end();
  }
  /* ---------- les projectiles ---------- */
  shots(R, t){
    const G = this.glow, I = this.inst, B = this.rib;
    R.P.shots.each(s=>{
      let x = s.x * S, z = s.y * S, y = SHOT_Y;
      const C = s.color || "#ffffff", r = Math.max(3.5, s.r || 6) * S, yaw = Math.atan2(s.vx || 0.001, s.vy || 0.001), sp = Math.hypot(s.vx, s.vy);
      if(s.enemy){
        G.add(x, y, z, r * 7, "#ff3d7f", 0.9); G.add(x, y, z, r * 2.6, C, 1); I.orb.add(x, y, z, yaw, 0, 0, r * 1.8, "#ff3d7f");
        G.add(x - s.vx * S * 0.04, y, z - s.vy * S * 0.04, r * 3, "#ff3d7f", 0.4); return;
      }
      if(s.kind === "lob"){
        const k = Math.min(1, 1 - s.life / 0.6), gx = (s.ox + (s.lobTo.x - s.ox) * k) * S, gz = (s.oy + (s.lobTo.y - s.oy) * k) * S;
        x = gx; z = gz; y = 0.7 + Math.sin(k * Math.PI) * 3.0;
        const sh = TY_SHAPE[s.ty] === "rock" || s.ty === 9 ? "rock" : "orb";
        if(sh === "rock") I.rock.add(x, y, z, t * 7, t * 5, 0, 0.42, s.ty === 9 ? "#9aa6b8" : s.ty === 5 ? "#6b4423" : "#8a7458");
        else { I.orb.add(x, y, z, 0, 0, 0, 0.32, C); G.add(x, y, z, 1.2, C, 0.6); }
        G.add(x, y, z, 0.9, C, 0.25);
        this.shadow(gx, gz, 0.35 + k * 0.2);
        return;
      }
      if(s.kind === "flame"){
        const k2 = s.life / 0.42;
        G.add(x, y - 0.1, z, r * (2.2 - k2) * 2.6, C, Math.min(1, k2 * 1.6) * 0.6);
        G.add(x, y - 0.1, z, r * 1.1 * k2, "#fff3b0", Math.min(1, k2 * 1.8) * 0.8);
        return;
      }
      if(s.kind === "blade"){ I.blade.add(x, y, z, t * 14, 0, 0, r * 2.2, C); G.add(x, y, z, r * 5, C, 0.35); return; }
      if(s.kind === "shard"){ I.shard.add(x, y, z, yaw, 0, 0, 0.42, C); G.add(x, y, z, 0.7, C, 0.4); this.trail(s, x, y, z, C, 0.2); return; }
      if(s.kind === "wisp"){ I.orb.add(x, y + Math.sin(t * 8 + s.ox) * 0.1, z, 0, 0, 0, r * 2, C); G.add(x, y, z, r * 7, C, 0.5); this.trail(s, x, y, z, C, 0.35); return; }
      const sh = TY_SHAPE[s.ty] || "orb";
      switch(sh){
        case "star": I.star.add(x, y, z, t * 6, 0, t * 9, r * 2.6, s.ty === 18 ? "#ffe0f2" : "#fff6c8"); G.add(x, y, z, r * 6, C, 0.5); break;
        case "crescent": I.crescent.add(x, y, z, yaw, 0, 0, r * 3.4, s.ty === 17 ? "#2a1038" : C); G.add(x, y, z, r * 6, s.ty === 17 ? "#7a3aa8" : C, 0.45); break;
        case "rock": I.rock.add(x, y, z, t * 7, t * 4, 0, r * 2.4, s.ty === 5 ? "#6b4423" : "#8a7458"); break;
        case "needle": I.needle.add(x, y, z, yaw, 0, 0, r * 2.4, "#d9ffb0"); G.add(x, y, z, r * 3, C, 0.35); break;
        case "shard": I.shard.add(x, y, z, yaw, 0, t * 6, r * 2.4, s.ty === 9 ? "#e8f0ff" : "#dff8ff"); G.add(x, y, z, r * 4, C, 0.45); break;
        case "leaf": I.leaf.add(x, y, z, t * 9 + yaw, Math.sin(t * 6) * 0.6, 0, r * 2.6, "#7ee06a"); G.add(x, y, z, r * 3, C, 0.25); break;
        case "drop": I.drop.add(x, y, z, yaw, 0, 0, r * 2.2, "#7fd0ff"); G.add(x, y, z, r * 4, C, 0.4); break;
        default: {
          const core = s.ty === 8 ? "#14001e" : s.ty === 4 ? "#a04ad0" : "#ffffff";
          I.orb.add(x, y, z, 0, 0, 0, r * (s.ty === 8 ? 2.6 : 1.6), core);
          G.add(x, y, z, r * (s.ty === 2 || s.ty === 8 ? 8 : 6), C, s.ty === 8 ? 0.8 : 0.7);
          if(s.ty === 2 || s.ty === 14) for(let i = 0; i < 2; i++) I.ring.add(x, y, z, t * (6 + i * 3), 0.8 + i * 0.7, t * 4, r * (3.2 + i * 0.9), s.ty === 2 ? "#a0dcff" : "#ffb0f0");
          if(s.ty === 13 && Math.random() < 0.6) B.bolt(x, y, z, x + (Math.random() - .5) * 0.7, y + (Math.random() - .5) * 0.5, z + (Math.random() - .5) * 0.7, 0.05, "#ffe45e", 0.9, 3, 0.2);
          if(s.ty === 10 || s.ty === 16) this.ember(x, y, z, s.ty === 16 ? "#8a5aff" : "#ffb35c");
        }
      }
      if(sp > 40) this.trail(s, x, y, z, C, s.ty === 10 ? 0.55 : 0.3);
    });
  }
  trail(s, x, y, z, C, a){ const k = 0.045 * S * 32; this.rib.seg(x - s.vx * S * 0.09, y, z - s.vy * S * 0.09, x, y, z, 0.02, C, a, 0.22 * a + 0.05); this.glow.add(x - s.vx * k * 0.03, y, z - s.vy * k * 0.03, 0.35, C, a * 0.6); }
  core(x, y, z, a, len, w, k, p = 0){ const c = Math.cos(p); this.rib.seg(x, y, z, x + Math.cos(a) * len * c, y - Math.sin(p) * len, z + Math.sin(a) * len * c, Math.max(0.04, w), "#ffffff", 0.8 * k, Math.max(0.04, w * 0.6)); }
  /* d'où part un rayon du gardien : Porygon-Z flotte, ses rayons plongent vers l'équipe */
  beamFrom(R, hx, hy){
    const b = R.boss, o = this._bo || (this._bo = {y:1.2, p:0});
    if(b && b.pz && this.depth){ o.y = this.depth.pzY; const d = Math.max(2.5, Math.hypot(R.x - hx, R.y - hy) * S); o.p = Math.atan2(o.y - 0.95, d); }
    else { o.y = 1.2; o.p = 0; }
    return o;
  }
  ember(x, y, z, c){ if(Math.random() < 0.4) this.local.push({x:x + (Math.random() - .5) * 0.2, y, z:z + (Math.random() - .5) * 0.2, vy:0.8 + Math.random(), vx:(Math.random() - .5) * 0.4, vz:(Math.random() - .5) * 0.4, life:0.5, max:0.5, s:0.16, c}); }
  shadow(x, z, r){ this.puff.add(x, 0.05, z, r * 2, "#000000", 0.35); }
  /* ---------- les zones ---------- */
  zones(R, t, c){
    const G = this.glow, D = this.discs, B = this.rib, I = this.inst;
    R.P.zones.each(z=>{
      if(z.delay > 0 && !z.boss) return;
      const k = z.max ? Math.max(0, z.life) / z.max : 1, x = z.x * S, zz = z.y * S, r = (z.r || 0) * S, C = z.color || "#ff3d7f";
      switch(z.k){
        case "warn": {
          if(z.delay > 0) return;
          D.add(x, zz, r, "#ff3d7f", {fill:0.12 + (1 - k) * 0.3, rim:1, prog:Math.max(0.02, k), pulse:1});
          if(z.cube){
            if(this.depth) this.depth.fall(x, zz, k, r, z.color || "#35f0d6", t, z);
            else { const fall = 1 - k, y = (1 - fall) * 9; I.cube.add(x, y + 0.35, zz, t * 2, t, 0, 0.55 + fall * 0.25, "#0a2a30"); G.add(x, y + 0.35, zz, 1.2, z.color || "#35f0d6", 0.6); this.shadow(x, zz, 0.3 + fall * 0.4); }
          }
          return; }
        case "ring": {
          const a = Math.min(1, k * 1.4);
          D.add(x, zz, r, C, {fill:0, rim:1.4 * a, inner:Math.max(0, 1 - 0.12 / Math.max(0.2, r))});
          const b = this.bands.take(); b.position.set(x, 0, zz); b.scale.set(r, z.quake ? 0.7 : 1.1, r); setBand(b, C, a * (z.quake ? 0.9 : 0.6), t, 0);
          if(z.quake && Math.random() < 0.5){ const an = Math.random() * 6.28; this.local.push({x:x + Math.cos(an) * r, y:0.1, z:zz + Math.sin(an) * r, vy:2 + Math.random() * 2, vx:Math.cos(an) * 0.8, vz:Math.sin(an) * 0.8, g:9, life:0.6, max:0.6, s:0.12, c:"#8a7458", dark:true}); }
          return; }
        case "puddle": case "seed": {
          D.add(x, zz, r * (0.96 + Math.sin(t * 6 + z.x) * 0.04), C, {fill:Math.min(0.32, k * 0.5), rim:Math.min(0.9, k), dash:true});
          if(Math.random() < 0.25){ const an = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r; this.local.push({x:x + Math.cos(an) * d, y:0.05, z:zz + Math.sin(an) * d, vy:z.k === "seed" ? 0.9 : 0.5, vx:0, vz:0, life:0.7, max:0.7, s:z.k === "seed" ? 0.14 : 0.2, c:C}); }
          return; }
        case "strike": {
          if(z.quiet){
            D.add(x, zz, r * (1 - k * 0.6), C, {fill:0.35 * (1 - k), rim:0.6 * (1 - k)});
            if(k < 0.5){ const h = (0.5 - k) / 0.5; I.spike.add(x, 0, zz, z.x, 0.1, 0.15, r * 1.1, "#7a6a58", h * r * 2.4); }
            return;
          }
          D.add(x, zz, r, C, {fill:0.15, rim:0.8, prog:0.25 + 0.75 * k});
          if(k < 0.35){
            /* la frappe tombe du ciel : une colonne qui se résorbe dans le sol à l'impact */
            const q = k / 0.35, top = 0.2 + 16 * q;
            B.seg(x, top, zz, x, 0, zz, 0.42, C, 0.9, 0.42); B.seg(x, top, zz, x, 0, zz, 0.12, "#ffffff", 0.9, 0.12);
            G.add(x, 0.3, zz, 2.6 * (1 - q) + 0.6, C, 0.9);
          }
          return; }
        case "tornado": {
          const f = this.funnels.take(); f.position.set(x, 0, zz); f.scale.set(r * 1.3, 3.4, r * 1.3); f.rotation.y = t * 7; setBand(f, C, Math.min(1, k * 3) * 0.9, t, 1);
          for(let i = 0; i < 3; i++){ const an = t * 9 + i * 2.1, h = (t * 1.7 + i * 0.33) % 1 * 3; G.add(x + Math.cos(an) * (0.3 + h * 0.4) * r, h, zz + Math.sin(an) * (0.3 + h * 0.4) * r, 0.3, C, 0.6); }
          return; }
        case "sweep": {
          if(z.cur === undefined) return;
          const bm = this.beams.take(); bm.position.set(x, SHOT_Y, zz); bm.rotation.set(0, -z.cur, 0); bm.scale.set(z.len * S, z.bw * S, z.bw * S);
          setBand(bm, C, Math.min(1, k * 3) * 1.1, t, 4);
          this.core(x, SHOT_Y, zz, z.cur, z.len * S, z.bw * S * 0.7, Math.min(1, k * 3));
          G.add(x, SHOT_Y, zz, z.bw * S * 7, C, 0.7);
          return; }
        case "wall": {
          const w = this.walls.take(); w.position.set(x, 0, zz); w.rotation.set(0, -z.a + Math.PI / 2, 0); w.scale.set(z.span * S, 1.9, 1);
          setBand(w, C, Math.min(1, k * 2) * 0.85, t, 2);
          if(Math.random() < 0.6){ const sd = (Math.random() - .5) * z.span * S, cx = Math.cos(z.a), cy = Math.sin(z.a); this.local.push({x:x - cy * sd, y:1.6, z:zz + cx * sd, vy:1.5, vx:cx * 2, vz:cy * 2, g:6, life:0.5, max:0.5, s:0.14, c:"#e8fbff"}); }
          return; }
        case "sing": {
          const h = this.holes.take(), rr = (16 + (1 - k) * 18) * S; h.position.set(x, 1.4, zz); h.scale.setScalar(rr);
          G.add(x, 1.4, zz, rr * 6, C, 0.6);
          for(let i = 0; i < 3; i++) I.ring.add(x, 1.4, zz, -t * (5 + i), 1.2 + i * 0.4, t * 3, r * k * (0.5 + i * 0.25) * 2, C);
          D.add(x, zz, r * k, C, {fill:0.1, rim:0.8, dash:true});
          return; }
        case "dash": {
          const prog = 1 - k, L = z.len * S * Math.min(1, prog * 2), cx = Math.cos(z.a), cy = Math.sin(z.a);
          B.seg(x, SHOT_Y * 0.7, zz, x + cx * L, SHOT_Y * 0.7, zz + cy * L, (z.bw || 20) * S * 1.6, C, Math.min(1, k * 2) * 0.8, 0.05);
          return; }
        case "slam": {
          if(z.fired) return;
          const prog = 1 - k, L = z.land / z.max || 0.6;
          if(prog < L){ const q = prog / L; this.shadow(x, zz, r * (0.3 + q * 0.6)); D.add(x, zz, r, C, {fill:0.06 + q * 0.12, rim:0.4 + q * 0.6, prog:1 - q}); }
          return; }
        case "defer": return;
        default: {
          /* les signatures des légendaires : en volume (legends.js) */
          if(this.leg && this.leg.zone(z, R, t)) return;
          /* une zone de légendaire sans version en volume : la toile au sol la dessine.
             On ajoute une lueur, pour qu'elles comptent dans la scène. */
          if(z.k && z.k.startsWith("lg")){ if(r > 0) G.add(x, 0.5, zz, Math.min(6, r * 1.2), C, 0.18); return; }
          if(r > 0) D.add(x, zz, r, C, {fill:Math.min(0.22, k * 0.4), rim:Math.min(0.7, k), dash:true});
        }
      }
    });
  }
  /* ---------- éclairs, rayons, croissants, anneaux ---------- */
  fxs(R, t, c){
    const B = this.rib, D = this.discs, G = this.glow;
    R.P.fx.each(f=>{
      const k = f.max ? Math.max(0, f.life) / f.max : 1, C = f.color || "#ffffff";
      switch(f.k){
        case "ring": D.add(f.x * S, f.y * S, (f.r || 10) * S * (1.1 - k * 0.3), C, {fill:0.05 * k, rim:1.3 * k, inner:0.86}); break;
        case "bolt": {
          const pts = f.pts || []; if(pts.length < 2) break;
          for(let i = 1; i < pts.length; i++){ const a = pts[i - 1], b = pts[i]; B.bolt(a.x * S, SHOT_Y, a.y * S, b.x * S, SHOT_Y, b.y * S, 0.13, C, k, 6, 0.42); G.add(b.x * S, SHOT_Y, b.y * S, 1.1, C, k * 0.8); }
          break; }
        case "beam": {
          const bm = this.beams.take(); bm.position.set(f.x * S, SHOT_Y, f.y * S); bm.rotation.set(0, -f.a, 0); bm.scale.set(f.len * S, Math.max(0.05, f.w * S * k), Math.max(0.05, f.w * S * k));
          setBand(bm, C, 1.2 * k, t, 4); this.core(f.x * S, SHOT_Y, f.y * S, f.a, f.len * S, f.w * S * 0.7, k); G.add(f.x * S, SHOT_Y, f.y * S, f.w * S * 6, C, k * 0.8); break; }
        case "arc": {
          const a = this.arcs.take(); a.position.set(f.x * S, 0.75, f.y * S); a.rotation.set(0, -f.a, 0); a.scale.setScalar((f.r || 60) * S * 0.85);
          a.material.color.copy(col(C)); a.material.opacity = k; break; }
        case "tether": {
          const bx = R.boss ? R.boss.x : f.x, by = R.boss ? R.boss.y : f.y;
          B.seg(bx * S, 1.6, by * S, R.x * S, SHOT_Y, R.y * S, 0.07 + Math.sin(t * 30) * 0.03, C, 0.9); break; }
        case "warnline": {
          const q = this.quads.take(); q.position.set(f.x * S, 0.05, f.y * S); q.rotation.set(0, -f.a, 0); q.scale.set(f.len * S, 1, (f.w || 10) * S * 2);
          q.material.opacity = 0.15 + (1 - k) * 0.35; q.material.color.set(f.color || "#ff3d7f"); break; }
      }
    });
  }
  /* ---------- éclats : la simulation les fait voler à plat ; on leur donne une hauteur ---------- */
  parts(R, t){
    const G = this.glow; let i = 0;
    R.P.parts.each(p=>{
      i++;
      const k = Math.max(0, p.life) / (p.max || 1), h = 0.35 + ((i * 0.618) % 1) * 1.1 + (p.g ? -0.5 * (1 - k) : 0.4 * (1 - k));
      G.add(p.x * S, Math.max(0.05, h), p.y * S, Math.max(0.06, (p.size || 3) * S * 2.4), p.color || "#ffffff", Math.min(1, k * 1.4));
    });
  }
  /* ---------- octets et ramassables ---------- */
  loot(R, t){
    const G = this.glow, I = this.inst, D = this.discs;
    R.P.gems.each(g=>{
      const c = g.v >= 60 ? "#ffd24a" : g.v >= 18 ? "#ff3d7f" : g.v >= 4 ? "#b06bff" : "#35f0d6", s = g.v >= 18 ? 0.34 : g.v >= 4 ? 0.27 : 0.21;
      const y = 0.35 + Math.sin(t * 3 + g.x * 0.1) * 0.08;
      I.gem.add(g.x * S, y, g.y * S, t * 2 + g.x, 0, 0, s, c);
      G.add(g.x * S, y, g.y * S, s * 3.2, c, 0.55);
    });
    const PK = ref("BR_PICKS") || {};
    R.P.picks.each(p=>{
      const P = PK[p.k] || {c:"#ffffff"};
      if(p.t > 20 && Math.floor(p.t * 8) % 2) return;
      const y = 0.7 + Math.sin(p.t * 4) * 0.12, pul = 1 + Math.sin(p.t * 6) * 0.15;
      I.gem.add(p.x * S, y, p.y * S, p.t * 2.5, 0, 0, 0.5 * pul, P.c);
      G.add(p.x * S, y, p.y * S, 2.2 * pul, P.c, 0.6);
      D.add(p.x * S, p.y * S, 0.5 * pul, P.c, {fill:0.1, rim:1});
    });
  }
  /* ---------- l'équipe : orbites, auras, éveil, ruée, turbo, esquive ---------- */
  team(R, t, c){
    const G = this.glow, D = this.discs, I = this.inst, arch = ref("brArch"), shown = ref("brShownId"), memberPos = ref("brMemberPos"), stats = ref("brWeaponStats");
    R.team.forEach((w, i)=>{
      const rec = c.team[i];
      if(w.orbPts){ const C = arch(shown(w)).c, sz = 0.22 * (stats ? stats(w, R).area : 1);
        for(const o of w.orbPts){ I.orb.add(o.x * S, SHOT_Y, o.y * S, 0, 0, 0, sz, "#ffffff"); G.add(o.x * S, SHOT_Y, o.y * S, sz * 6, C, 0.8); } }
      if(w.auraT > 0 && w.auraR){ const p = memberPos(R, i), C = arch(shown(w)).c; D.add(p.x * S, p.y * S, w.auraR * S, C, {fill:0.12 * w.auraT * 2, rim:0.7, dash:true}); }
      if(rec && w.stage >= 2) D.add(rec.x, rec.z, 0.75, "#ffd24a", {fill:0.06, rim:0.7, inner:0.82, a:0.7 + Math.sin(t * 4 + i) * 0.3});
      /* Rayquaza : le serpent céleste */
      if(this.leg && w.serpC && arch(shown(w)).k === "lgSerpent") this.leg.serpent(R, w, i, t);
      if(rec && w.dash && w.dash.k === "slam" && rec.lift > 0.05) this.shadow(rec.x, rec.z, 0.5 + rec.lift * 0.08);
    });
    /* turbo et esquive : des images fantômes */
    const L = c.team[0];
    if(L && (R.turbo > 0 || R.dodgeT > 0)){
      const C = R.dodgeT > 0 ? "#bff4ff" : "#4fdcff";
      for(let k = 0; k < 4; k++) G.add(L.x - (R.vx || 0) * S * 0.03 * k, (L.h || 1) * 0.5, L.z - (R.vy || 0) * S * 0.03 * k, (L.h || 1) * (1.2 - k * 0.2), C, 0.35 - k * 0.07);
    }
    if(R.shield && L) D.add(L.x, L.z, 1.1 + Math.sin(t * 5) * 0.05, "#8ff7e8", {fill:0.05, rim:0.9, inner:0.9});
    /* le rayon d'attraction, très discret */
    if(L && R.mods) D.add(L.x, L.z, 92 * R.mods.magnet * S, "#35f0d6", {fill:0, rim:0.05, inner:0.985});
  }
  /* ---------- le gardien : arène, abris, pylônes, dangers ---------- */
  boss(R, t, c){
    const D = this.discs, G = this.glow, B = this.rib, A = R.arena;
    if(A){
      const x = A.x * S, z = A.y * S, r = A.r * S;
      /* la faille qui se referme (anomalie) : un mur plus rose, qui brûle */
      this.arenaWall.visible = true; this.arenaWall.position.set(x, 0, z); this.arenaWall.scale.set(r, A.anom ? 9 : 7, r); setBand(this.arenaWall, A.anom ? "#ff5a7a" : "#ff3d7f", A.anom ? 0.85 : 0.7, t, 3);
      this.arenaOut.visible = true; this.arenaOut.position.set(x, 0.06, z); this.arenaOut.scale.set(r, 1, r);
      D.add(x, z, r, "#ff3d7f", {fill:0, rim:1.2, inner:0.985, dash:true});
    } else { this.arenaWall.visible = false; this.arenaOut.visible = false; }
    if(R.ult){
      const k = 1 - R.ult.t / R.ult.max;
      for(const s of R.ult.safes){
        D.add(s.x * S, s.y * S, s.r * S, "#5ce07a", {fill:0.25, rim:1.4, pulse:1});
        const b = this.bands.take(); b.position.set(s.x * S, 0, s.y * S); b.scale.set(s.r * S, 9, s.r * S); setBand(b, "#5ce07a", 0.35 + k * 0.3, t, 0);
      }
    }
    /* les relais : un lien vers le gardien */
    if(R.boss && R.boss.on){ R.P.foes.each(f=>{ if(f.kind !== "pylon") return; B.seg(f.x * S, 2.4, f.y * S, R.boss.x * S, 1.6, R.boss.y * S, 0.06 + Math.sin(t * 12 + f.x) * 0.03, "#ff3d7f", 0.8); }); }
    /* les dangers du gardien */
    for(const h of (R.hazards || [])){
      if(h.k === "chill") D.add(h.x * S, h.y * S, h.r * S, h.green ? "#3a8a3a" : "#bff4ff", {fill:Math.min(0.3, h.life * 0.2), rim:0.5});
      else if(h.k === "wave"){ const w = this.walls.take(); w.position.set(h.x * S, 0, h.y * S); w.rotation.set(0, -h.a + Math.PI / 2, 0); w.scale.set(h.span * S, 2.2, 1); setBand(w, "#3a8bff", 0.9, t, 2); }
      else if(h.k === "bigbeam"){ const k = Math.max(0, h.life) / h.max, bm = this.beams.take(), o = this.beamFrom(R, h.x, h.y);
        bm.position.set(h.x * S, o.y, h.y * S); bm.rotation.set(0, -h.a, -o.p, "YZX"); bm.scale.set(h.len * S, h.w * S * (0.6 + k * 0.4), h.w * S * (0.6 + k * 0.4)); setBand(bm, "#ff3d7f", 1.4 * k, t, 4);
        this.core(h.x * S, o.y, h.y * S, h.a, h.len * S, h.w * S * 0.5, k, o.p);
        if(this.depth) this.depth.beamHit(h.x * S, o.y, h.y * S, h.a, o.p, h.len * S, "#ff3d7f", k * 1.6); }
      else if(h.k === "laser" && h.cur !== undefined){ const bm = this.beams.take(), o = this.beamFrom(R, h.x, h.y);
        bm.position.set(h.x * S, o.y, h.y * S); bm.rotation.set(0, -h.cur, -o.p, "YZX"); bm.scale.set(h.len * S, 0.28, 0.28); setBand(bm, h.col || "#c7d2e0", 1.2, t, 4);
        this.core(h.x * S, o.y, h.y * S, h.cur, h.len * S, 0.16, 1, o.p);
        if(this.depth) this.depth.beamHit(h.x * S, o.y, h.y * S, h.cur, o.p, h.len * S, h.col || "#c7d2e0", 0.8); }
    }
  }
  /* ---------- nos éclats à nous ---------- */
  locals(dt){
    const G = this.glow, P = this.puff, L = this.local;
    for(let i = L.length - 1; i >= 0; i--){
      const p = L[i]; p.life -= dt;
      if(p.life <= 0 || L.length > 500){ L.splice(i, 1); continue; }
      p.vy -= (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if(p.y < 0.03){ p.y = 0.03; p.vy = 0; }
      (p.dark ? P : G).add(p.x, p.y, p.z, p.s * 2, p.c, Math.min(1, p.life / p.max * 1.5));
    }
  }
  /* ---------- les signes des ennemis (lus dans la boucle de la horde) ---------- */
  foeMarks(f, R, t, h){
    const G = this.glow, D = this.discs, B = this.rib, x = f.x * S, z = f.y * S;
    if(f.kind === "shooter"){
      G.add(x, h * 1.15, z, 0.35, "#b06bff", 0.9);
      if(f.shootT < 0.5 && Math.hypot(R.x - f.x, R.y - f.y) < 420) B.seg(x, h * 0.6, z, R.x * S, 0.8, R.y * S, 0.035, "#ff283c", 0.4 + (0.5 - f.shootT));
    }
    if(f.kind === "rusher"){
      const on = f.fuse > 0 ? Math.floor(t * 20) % 2 : Math.floor(t * 4) % 2;
      if(on) G.add(x, h * 0.5, z, h * 1.6, "#ff3d2a", f.fuse > 0 ? 0.7 : 0.25);
      if(f.fuse > 0) D.add(x, z, 62 * (1 - f.fuse / 0.6) * S, "#ff8a3d", {fill:0.1, rim:1});
    }
    if(f.kind === "armored") D.add(x, z, (f.size || 40) * S * 0.55, "#8ff7e8", {fill:0, rim:0.9, inner:0.86, a:0.8});
    if(f.kind === "splitter") G.add(x, h * 1.15, z, 0.3, "#ffd24a", 0.9);
    if(f.stun > 0) for(let i = 0; i < 3; i++){ const a = t * 6 + i * 2.1; G.add(x + Math.cos(a) * 0.35, h * 1.08, z + Math.sin(a) * 0.35, -0.16, "#ffe45e", 1); }
    if(f.frz > 0){ const I = this.inst.shard; for(let i = 0; i < 4; i++){ const a = i * 1.57 + (f.x % 7); I.add(x + Math.cos(a) * h * 0.3, h * (0.3 + (i % 2) * 0.3), z + Math.sin(a) * h * 0.3, a, 0.4, 0, h * 0.5, "#dff8ff"); } }
    if(f.elite || f.boss) G.add(x, h * 0.5, z, h * 2.2, "#ff3d7f", f.boss ? 0.35 : 0.22);
    /* le feu sacré de Ho-Oh : des flammes arc-en-ciel sur l'ennemi */
    if(f.sacre > 0){ const hu = (t * 200 + f.x) % 360; G.add(x, h * 0.6, z, h * 1.5, `hsl(${Math.round(hu)},95%,62%)`, 0.45); if(Math.random() < 0.3) this.local.push({x:x + (Math.random() - .5) * h * 0.5, y:h * 0.4, z:z + (Math.random() - .5) * h * 0.5, vx:0, vy:1.4, vz:0, life:0.45, max:0.45, s:0.08, c:`hsl(${Math.round(hu + 60)},95%,62%)`}); }
    if(f.shiny) G.add(x, h * 1.2, z, -0.18, "#ffe9a8", 0.6 + Math.sin(t * 8 + f.x) * 0.4);
  }
  /* une butte de terre : le gardien enterré */
  burrow(f, t){ const x = f.x * S, z = f.y * S; this.puff.add(x, 0.25, z, 2.2, "#4a3420", 0.75); for(let i = 0; i < 3; i++) this.local.push({x:x + (Math.random() - .5) * 1.2, y:0.2, z:z + (Math.random() - .5) * 1.2, vy:1.5 + Math.random(), vx:0, vz:0, g:8, life:0.4, max:0.4, s:0.08, c:"#8a7050", dark:true}); }
  dispose(){ this.scene.remove(this.ground); this.gtex.dispose(); }
}
