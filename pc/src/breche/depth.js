/* ============================================================
   LA BRÈCHE EN 3D · LA FAILLE PROFONDE
   Passé le gardien, on descend : un palier toutes les 55 s, une
   anomalie par palier, deux échos de légendaires, et Porygon-Z au
   palier 9, qui vient vous chercher. La simulation (59d) ne change
   pas ; on lit son état et on le met en scène :
     · la descente : le brouillard vire au violet, des blocs de données
       montent du sol, des monolithes flottent au loin ; à chaque
       palier, l'image saute et une onde part sous l'équipe ;
     · Nuit noire : la lumière tombe, il ne reste que la lampe de
       l'équipe — et les yeux rouges de la horde, dans le noir ;
     · Pluie de données : des blocs tombent du ciel, leur ombre grandit ;
     · Champ de mines : des blocs instables qui clignotent, leur rayon
       d'explosion s'affiche quand on s'approche ;
     · Horde dorée : des fuyards d'or, une colonne de lumière au-dessus
       d'eux pour les retrouver ;
     · Le Chasseur : une mire au-dessus de lui, un fil rouge jusqu'à
       vous, et la marque sous vos pieds ;
     · Silence : la lumière se ternit ; Frénésie : des traits de vitesse
       (à l'écran) ; la faille qui se referme : le mur de l'arène ;
     · les échos : une colonne d'or, le légendaire qui se reconstitue ;
     · Porygon-Z : il se projette dans la faille par un rayon venu
       d'en haut, flotte, s'entoure de ses anneaux. Triplattaque (trois
       rayons qui plongent vers vous), Ultralaser (une charge qui
       grossit, puis tout part), Conversion (un bouclier de la couleur
       du type qu'il encaisse), la pluie de blocs, la téléportation
       (il se défait en blocs, se refait ailleurs), Recyclage (votre
       équipe en copies violettes), et la surchauffe.
   ============================================================ */
import * as THREE from "three";
import { S, ref, col, Pool } from "./lib.js";
import { Inst, bandMat, setBand, SHAPES } from "./fx.js";
import { PZ_H, pzLift } from "./units.js";
import { preloadMon } from "../mon/model3d.js";

const TAU = Math.PI * 2;
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
const C1 = new THREE.Color(), C2 = new THREE.Color(), C3 = new THREE.Color();
const BLACK = new THREE.Color("#010003"), DEEP = new THREE.Color("#1c0828"), PZFOG = new THREE.Color("#04161c"), GREY = new THREE.Color("#3a3e46");
const VIOLET = new THREE.Color("#b49cff"), WARM = new THREE.Color("#ffc27a"), COLD = new THREE.Color("#9ad8ff"), CYAN = new THREE.Color("#35f0d6");
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

/* ---------- les blocs de données : faces sombres, arêtes qui luisent ---------- */
const CUBE_VS = `
#include <common>
#include <fog_pars_vertex>
varying vec3 vL; varying vec3 vC;
void main(){
  vL = position;
#ifdef USE_INSTANCING_COLOR
  vC = instanceColor;
#else
  vC = vec3(1.0);
#endif
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const CUBE_FS = `
#include <common>
#include <fog_pars_fragment>
varying vec3 vL; varying vec3 vC; uniform float uT, uEdge, uGain;
void main(){
  vec3 a = abs(vL) * 2.0;
  float mx = max(a.x, max(a.y, a.z)), mn = min(a.x, min(a.y, a.z)), mid = a.x + a.y + a.z - mx - mn;
  float e = smoothstep(uEdge, uEdge + (1.0 - uEdge) * 0.8, mid);
  float scan = step(0.9, fract((vL.y + 0.5) * 5.0 - uT * 1.3)) * 0.4 + step(0.94, fract((vL.x + vL.z + 1.0) * 4.0)) * 0.12;
  vec3 c = vec3(0.025, 0.02, 0.05) + vC * (0.07 + e * 1.7 + scan * (1.0 - e)) * uGain;
  gl_FragColor = vec4(c, 1.0);
#include <fog_fragment>
}`;
class Cubes {
  constructor(scene, cap, edge = 0.8, gain = 1){
    const m = new THREE.ShaderMaterial({vertexShader:CUBE_VS, fragmentShader:CUBE_FS, fog:true,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {uT:{value:0}, uEdge:{value:edge}, uGain:{value:gain}}])});
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m, cap);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.castShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color()); this.cap = cap; this.n = 0;
    scene.add(this.mesh);
  }
  begin(t){ this.n = 0; this.mesh.material.uniforms.uT.value = t; }
  add(x, y, z, yaw, pitch, roll, s, c, sy){
    if(this.n >= this.cap) return;
    _q.setFromEuler(_e.set(pitch, yaw, roll, "YXZ"));
    _m.compose(_v.set(x, y, z), _q, _s.set(s, sy || s, s));
    this.mesh.setMatrixAt(this.n, _m); this.mesh.setColorAt(this.n, col(c)); this.n++;
  }
  end(){ this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true; if(this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}

const COLUMN = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true).translate(0, 0.5, 0);

export class Depth {
  constructor(fx, world){
    this.fx = fx; this.world = world; const scene = fx.scene;
    this.cubes = new Cubes(scene, 320);                    /* chutes, mines, débris, anneaux de Porygon-Z */
    this.far = new Cubes(scene, 40, 0.955, 0.5);           /* les monolithes, au loin : des arêtes fines, une lueur sourde */
    this.far.mesh.castShadow = false;
    /* des anneaux fins (ceux de Porygon-Z, la mire du chasseur, l'entrée) */
    this.rings = new Inst(scene, "ring", 60, false);
    this.rings.mesh.geometry.dispose(); this.rings.mesh.geometry = new THREE.TorusGeometry(0.5, 0.011, 4, 64).rotateX(Math.PI / 2);
    this.cols = new Pool(scene, () => { const m = new THREE.Mesh(COLUMN, bandMat()); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.hexes = new Pool(scene, () => { const m = new THREE.Mesh(SHAPES.hex(), bandMat()); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.bits = [];                                        /* des blocs qui volent (téléportation, impacts, palier) */
    this.motes = [];                                       /* des blocs qui montent du sol, de plus en plus bas */
    this.pulses = [];                                      /* l'onde d'un palier franchi */
    this.m = {dark:0, deep:0, sil:0, pz:0};
    this.hud = {flash:0, frenzy:0, marked:0, hunter:null, depth:0};
    this.pzY = 2.6;
    this.lastDepth = -1; this.pzF = null; this.echoF = null; this.lockOn = false; this.lockT0 = 0; this.ghostRef = null;
  }
  begin(){ this.cubes.begin(this.t || 0); this.far.begin(this.t || 0); this.rings.begin(); this.cols.begin(); this.hexes.begin(); }
  end(){ this.cubes.end(); this.far.end(); this.rings.end(); this.cols.end(); this.hexes.end(); }

  /* ---------- à chaque image ---------- */
  render(R, t, dt, c){
    this.t = t; this.dt = dt;
    /* une nouvelle run : on repart de la surface */
    if(R !== this.R){ this.R = R; for(const k in this.m) this.m[k] = 0; this.moodOn = true; this.lastDepth = -1; this.preDepth = -1; this.bits.length = 0; this.pulses.length = 0; this.hud.flash = 0; }
    const L = c.team[0];
    this.mood(R, dt);
    this.descent(R, t, dt, c, L);
    this.anomalies(R, t, dt, c, L);
    this.bosses(R, t, dt, c, L);
    this.flyBits(dt);
    this.hud.flash = Math.max(0, this.hud.flash - dt * 1.6);
  }

  /* ---------- la lumière : la descente, la nuit, le silence, Porygon-Z ---------- */
  mood(R, dt){
    const W = this.world, H = W.H; if(!H) return;
    const a = R.anom && R.anom.k, m = this.m, k = Math.min(1, dt * 1.6);
    m.dark += ((R.darkAnom ? 1 : 0) - m.dark) * k;
    m.deep += ((R.endless ? Math.min(1, (R.depth || 0) / 8) : 0) - m.deep) * k * 0.4;
    m.sil += ((a === "silence" ? 1 : 0) - m.sil) * k;
    m.pz += ((R.boss && R.boss.pz ? 1 : 0) - m.pz) * k * 0.6;
    const any = m.dark + m.deep + m.sil + m.pz > 0.003;
    if(!any && !this.moodOn) return;
    this.moodOn = any;
    const d = m.dark;
    C1.set(H.fog).lerp(DEEP, 0.55 * m.deep).lerp(PZFOG, 0.5 * m.pz).lerp(GREY, 0.45 * m.sil).lerp(BLACK, 0.92 * d);
    W.scene.fog.color.copy(C1); if(W.scene.background) W.scene.background.copy(C1);
    W.scene.fog.density = H.fogD * (1 + 0.45 * m.deep) + 0.075 * d;
    W.hemi.intensity = H.hemi[2] * (1 - 0.86 * d) * (1 - 0.15 * m.deep);
    W.hemi.color.set(H.hemi[0]).lerp(VIOLET, 0.3 * m.deep).lerp(GREY, 0.5 * m.sil);
    W.sun.intensity = H.sun[1] * (1 - 0.95 * d) * (1 - 0.22 * m.deep) * (1 - 0.3 * m.sil);
    const U = W.sky.material.uniforms;
    U.uTop.value.set(H.sky[0]).lerp(DEEP, 0.5 * m.deep).lerp(PZFOG, 0.4 * m.pz).lerp(BLACK, 0.95 * d);
    U.uBot.value.set(H.sky[1]).lerp(DEEP, 0.6 * m.deep).lerp(GREY, 0.4 * m.sil).lerp(BLACK, 0.92 * d);
    /* la faille, à l'horizon : plus vive à mesure qu'on descend, cyan quand Porygon-Z est là, presque éteinte dans la nuit */
    U.uRift.value.set("#ff3d7f").lerp(CYAN, 0.7 * m.pz).multiplyScalar((1 + 0.45 * m.deep) * (1 - 0.75 * d) * (1 - 0.5 * m.sil));
    /* la lampe de l'équipe : chaude dans la nuit noire (la flamme du jeu mobile) */
    W.lamp.intensity = Math.max(H.dark ? 48 : 0, 120 * d);
    W.lamp.distance = 22 - 4 * d;
    W.lamp.color.copy(COLD).lerp(WARM, d);
  }

  /* ---------- la descente : ambiance, et le passage d'un palier ---------- */
  descent(R, t, dt, c, L){
    if(!R.endless){ this.lastDepth = -1; return; }
    const F = this.fx, dep = R.depth || 0, deep = this.m.deep;
    /* ce qui va remonter : on charge les modèles avant (les échos aux paliers 3 et 6, Porygon-Z au 9) */
    if(dep !== this.preDepth){
      this.preDepth = dep;
      try {
        if(dep === 2 || dep === 5){ const L = ref("brLegendsOf"); if(L) for(const id of L(R.region)) preloadMon(id, false); }
        if(dep >= 7) preloadMon(474, false);
      } catch(e){}
    }
    if(this.lastDepth >= 0 && dep > this.lastDepth){
      /* un palier : l'image saute, une onde part sous l'équipe, des blocs jaillissent */
      this.hud.flash = 1; this.hud.depth = dep;
      if(L) this.pulses.push({x:L.x, z:L.z, t:0});
      if(L) for(let i = 0; i < 26; i++){ const a = Math.random() * TAU, sp = 3 + Math.random() * 5;
        this.bits.push({x:L.x + Math.cos(a) * 1.2, y:0.2, z:L.z + Math.sin(a) * 1.2, vx:Math.cos(a) * sp, vy:4 + Math.random() * 5, vz:Math.sin(a) * sp, g:9, life:1.2, max:1.2, s:0.12 + Math.random() * 0.14, c:i % 3 ? "#35f0d6" : "#ff3d7f", r:Math.random() * 6}); }
    }
    this.lastDepth = dep;
    for(let i = this.pulses.length - 1; i >= 0; i--){
      const p = this.pulses[i]; p.t += dt; if(p.t > 1.3){ this.pulses.splice(i, 1); continue; }
      const k = p.t / 1.3, r = 0.5 + k * 16;
      F.discs.add(p.x, p.z, r, "#35f0d6", {fill:0, rim:1.6 * (1 - k), inner:0.94});
      const b = F.bands.take(); b.position.set(p.x, 0, p.z); b.scale.set(r, 1.6 * (1 - k) + 0.2, r); setBand(b, "#35f0d6", 0.8 * (1 - k), t, 0);
    }
    if(!L) return;
    /* des blocs montent du sol, de plus en plus nombreux */
    const want = Math.round(8 + deep * 34);
    while(this.motes.length < want) this.motes.push({x:L.x + (Math.random() - .5) * 36, y:Math.random() * 5, z:L.z + (Math.random() - .5) * 36, s:0.06 + Math.random() * 0.12, v:0.25 + Math.random() * 0.5, r:Math.random() * 6, c:Math.random() < 0.3 ? "#ff3d7f" : "#35f0d6"});
    if(this.motes.length > want) this.motes.length = want;
    for(const m of this.motes){
      m.y += m.v * dt; m.r += dt;
      if(m.y > 7 || Math.abs(m.x - L.x) > 20 || Math.abs(m.z - L.z) > 20){ m.x = L.x + (Math.random() - .5) * 36; m.z = L.z + (Math.random() - .5) * 36; m.y = 0; }
      const fade = Math.min(1, m.y * 2) * Math.min(1, (7 - m.y) / 2);
      this.cubes.add(m.x, m.y, m.z, m.r, m.r * 0.7, 0, m.s * fade, m.c);
    }
    /* des monolithes flottent au loin, à partir du troisième palier */
    if(dep >= 3){
      const CELL = 34, cx = Math.floor(L.x / CELL), cz = Math.floor(L.z / CELL);
      for(let i = -2; i <= 2; i++) for(let j = -2; j <= 2; j++){
        const gx = cx + i, gz = cz + j, h = hash(gx, gz);
        if(h > 0.3 - Math.max(0, 6 - dep) * 0.04) continue;
        const x = (gx + 0.2 + hash(gz, gx) * 0.6) * CELL, z = (gz + 0.2 + hash(gx + 7, gz) * 0.6) * CELL;
        const d = Math.hypot(x - L.x, z - L.z); if(d < 30) continue;
        const s = 2 + h * 8, y = 13 + hash(gx * 3, gz) * 12 + Math.sin(t * 0.4 + h * 9) * 0.8;
        this.far.add(x, y, z, t * 0.06 + h * 9, 0.5 + h * 2, t * 0.04, s, h < 0.1 ? "#ff3d7f" : "#35f0d6", s * (1.2 + h * 3));
      }
    }
  }

  /* ---------- un bloc qui tombe (Pluie de données, pluie de Porygon-Z) ---------- */
  fall(x, z, k, r, C, t, zz){
    const F = this.fx, q = 1 - k, y = 14 * Math.pow(k, 1.35) + 0.6, s = Math.max(0.7, r * 0.62);
    this.cubes.add(x, y, z, t * 2.2 + zz.x, t * 1.3, 0.3, s, C);
    F.glow.add(x, y, z, s * 2.4, C, 0.35 + q * 0.3);
    F.rib.seg(x, y + s * 0.6, z, x, y + s * 0.6 + 2.5 + k * 3, z, s * 0.5, C, 0.4, 0.02);
    F.puff.add(x, 0.05, z, (0.5 + q * 1.4) * s * 1.6, "#000000", 0.25 + q * 0.4);
    if(k < 0.06) for(let i = 0; i < 2; i++){ const a = Math.random() * TAU, sp = 2 + Math.random() * 4;
      this.bits.push({x, y:0.3, z, vx:Math.cos(a) * sp, vy:3 + Math.random() * 4, vz:Math.sin(a) * sp, g:12, life:0.7, max:0.7, s:0.1 + Math.random() * 0.15, c:C, r:Math.random() * 6}); }
  }
  /* là où un rayon plongeant touche le sol : une gerbe */
  beamHit(x, y, z, a, p, len, C, k){
    if(p <= 0.01 || k <= 0) return;
    const d = Math.min(len, y / Math.tan(p)), hx = x + Math.cos(a) * d, hz = z + Math.sin(a) * d;
    this.fx.glow.add(hx, 0.2, hz, 2.2 * k, C, 0.7); this.fx.glow.add(hx, 0.1, hz, 0.9 * k, "#ffffff", 0.9);
    if(Math.random() < 0.5 * k) this.bits.push({x:hx, y:0.2, z:hz, vx:(Math.random() - .5) * 5, vy:2 + Math.random() * 4, vz:(Math.random() - .5) * 5, g:12, life:0.5, max:0.5, s:0.08 + Math.random() * 0.1, c:C, r:Math.random() * 6});
  }

  /* ---------- les anomalies ---------- */
  anomalies(R, t, dt, c, L){
    const F = this.fx, G = F.glow, D = F.discs, B = F.rib, a = R.anom && R.anom.k, dark = this.m.dark;
    this.hud.frenzy += ((a === "frenesie" ? 1 : 0) - this.hud.frenzy) * Math.min(1, dt * 3);
    /* les mines */
    if(R.mines) for(const m of R.mines){
      if(m.gone) continue;
      const x = m.x * S, z = m.y * S, dd = L ? Math.hypot(x - L.x, z - L.z) : 99, near = dd < 120 * S;
      const blink = Math.floor((R.t + m.ph) * (m.arm > 0 ? 10 : near ? 6 : 3)) % 2;
      this.cubes.add(x, 0.28, z, m.ph + Math.sin(t * 2 + m.ph) * 0.15, 0, 0, 0.58, blink ? "#ff3d7f" : "#5a1a3a", 0.46);
      if(blink) B.seg(x, 0.6, z, x, 1.9, z, 0.07, "#ff3d7f", m.arm > 0 ? 0.25 : 0.45, 0.01);
      G.add(x, 0.62, z, blink ? 1.1 : 0.5, "#ff3d7f", blink ? 0.75 : 0.3);
      G.add(x - 0.2 + ((t * 0.9 + m.ph) % 1) * 0.4, 0.49, z, -0.06, "#35f0d6", 1);
      D.add(x, z, 24 * S, "#ff3d7f", {fill:0.05, rim:blink ? 1 : 0.35, inner:0.84});
      if(near) D.add(x, z, 90 * S, "#ff3d7f", {fill:0.05 * (1 - dd / (120 * S)), rim:0.5, dash:true, a:(0.5 + Math.sin(t * 8) * 0.3) * Math.min(1, (120 * S - dd) / 1.5)});
    }
    /* les ennemis à part : dorés, copies, chasseur — et les yeux dans la nuit */
    this.hud.hunter = null;
    R.P.foes.each(f=>{
      if(f.hp <= 0 || f.under > 0) return;
      const x = f.x * S, z = f.y * S, h = Math.max(0.55, Math.min(4.5, (f.size || 40) * S * (f.elite || f.big ? 1.05 : 0.95)));
      if(f.gold){
        G.add(x, h * 0.5, z, h * 2.2, "#ffd24a", 0.32);
        B.seg(x, h, z, x, h + 7, z, 0.18, "#ffd24a", 0.35 + Math.sin(t * 5 + f.x) * 0.1, 0.02);
        D.add(x, z, h * 0.55, "#ffd24a", {fill:0.12, rim:0.8, inner:0.8});
        if(Math.random() < 0.35) F.local.push({x:x + (Math.random() - .5) * h * 0.6, y:h * (0.3 + Math.random() * 0.6), z:z + (Math.random() - .5) * h * 0.6, vx:0, vy:0.8, vz:0, life:0.5, max:0.5, s:0.07, c:"#ffe9a8"});
      }
      if(f.copy){
        D.add(x, z, h * 0.5, "#c878ff", {fill:0.08, rim:1, inner:0.82, a:0.7 + Math.sin(t * 6) * 0.3});
        G.add(x, h * 0.5, z, h * 1.9, "#c878ff", 0.25);
        if(Math.random() < 0.15) this.bits.push({x:x + (Math.random() - .5) * h * 0.5, y:h * Math.random(), z:z + (Math.random() - .5) * h * 0.5, vx:0, vy:0.9, vz:0, g:0, life:0.6, max:0.6, s:0.08, c:"#c878ff", r:Math.random() * 6});
      }
      if(f.hunter && f === R.hunter) this.hunter(R, f, x, z, h, t, L);
      /* Nuit noire : la horde n'est plus qu'une paire d'yeux rouges, au-delà de la lampe */
      if(dark > 0.25 && L && !f.boss && f.kind !== "pylon" && f.kind !== "nest"){
        const dd = Math.hypot(x - L.x, z - L.z);
        if(dd > 3.5 && dd < 32){
          const yaw = Math.atan2(R.x - f.x, R.y - f.y), rx = Math.cos(yaw), rz = -Math.sin(yaw), fx = Math.sin(yaw) * h * 0.18, fz = Math.cos(yaw) * h * 0.18;
          const e = h * 0.09 + 0.04, y = h * 0.78, aa = dark * Math.min(1, (dd - 3.5) / 3) * (Math.sin(t * 0.7 + f.x) > -0.92 ? 1 : 0);
          const es = -(0.09 + dd * 0.004);                /* plus loin, un peu plus gros : on les voit encore */
          G.add(x + fx + rx * e, y, z + fz + rz * e, es, f.elite ? "#ffb35c" : "#ff3d4f", aa);
          G.add(x + fx - rx * e, y, z + fz - rz * e, es, f.elite ? "#ffb35c" : "#ff3d4f", aa);
          G.add(x + fx, y, z + fz, 0.8 + dd * 0.02, "#ff1a3a", aa * 0.3);
        }
      }
    });
  }
  /* le chasseur : une mire au-dessus de lui, un fil rouge jusqu'à vous, la marque sous vos pieds */
  hunter(R, f, x, z, h, t, L){
    const F = this.fx, G = F.glow, D = F.discs, B = F.rib, C = "#ff3d4f";
    this.hud.hunter = f;
    G.add(x, h * 0.5, z, h * 2.5, C, 0.28);
    const y0 = h * 1.35 + 0.3;
    this.rings.add(x, y0, z, t * 2, 0, 0, 1.4, C); this.rings.add(x, y0, z, -t * 3, 0, 0, 0.9, "#ffb0b8");
    for(let i = 0; i < 4; i++){ const a = t * 2 + i * TAU / 4; B.seg(x + Math.cos(a) * 0.62, y0, z + Math.sin(a) * 0.62, x + Math.cos(a) * 0.9, y0, z + Math.sin(a) * 0.9, 0.05, C, 0.9); }
    D.add(x, z, h * 0.6, C, {fill:0.08, rim:1, inner:0.86});
    if(!L) return;
    /* le fil, en pointillés qui courent vers vous */
    const ax = x, ay = h * 0.75, az = z, bx = L.x, by = (L.h || 1) * 0.6, bz = L.z, N = 14;
    for(let i = 0; i < N; i++){
      const u0 = ((i + t * 1.6) % N) / N, u1 = Math.min(1, u0 + 0.45 / N);
      B.seg(ax + (bx - ax) * u0, ay + (by - ay) * u0, az + (bz - az) * u0, ax + (bx - ax) * u1, ay + (by - ay) * u1, az + (bz - az) * u1, 0.08, C, 0.7 + Math.sin(t * 8) * 0.2);
    }
    D.add(L.x, L.z, 1.05 + Math.sin(t * 4) * 0.06, C, {fill:0.06, rim:1, inner:0.88, dash:true});
    this.hud.marked = 1;
  }

  /* ---------- les échos, et Porygon-Z ---------- */
  bosses(R, t, dt, c, L){
    const F = this.fx, G = F.glow, D = F.discs, B = F.rib, b = R.boss;
    if(!R.hunter || !R.hunter.on || R.hunter.hp <= 0) this.hud.marked = 0;
    /* un écho de légendaire : une colonne d'or, un halo */
    if(b && b.echo && b.on){
      if(this.echoF !== b){ this.echoF = b; this.echoT0 = t; }
      const e = t - this.echoT0, x = b.x * S, z = b.y * S, h = Math.max(2.4, Math.min(6, (b.size || 100) * S * 1.05));
      if(e < 3){ const k = 1 - e / 3, col = this.cols.take(); col.position.set(x, 0, z); col.scale.set(0.6 + h * 0.4 * k, 40, 0.6 + h * 0.4 * k); setBand(col, "#ffd24a", 0.9 * k, t, 6);
        D.add(x, z, h * (1.4 - k * 0.6), "#ffd24a", {fill:0.15 * k, rim:1.5 * k, inner:0.9}); }
      G.add(x, h * 0.5, z, h * 2.6, "#ffd24a", 0.16);
      D.add(x, z, h * 0.62, "#ffd24a", {fill:0.05, rim:0.6, inner:0.9, dash:true});
      if(Math.random() < 0.4) F.local.push({x:x + (Math.random() - .5) * h, y:Math.random() * h * 0.4, z:z + (Math.random() - .5) * h, vx:0, vy:1 + Math.random(), vz:0, life:0.9, max:0.9, s:0.07, c:"#ffe9a8"});
    } else if(!b || !b.echo) this.echoF = null;
    if(!(b && b.pz)){ this.pzF = null; this.lockOn = false; this.ghostRef = null; return; }
    /* ---- Porygon-Z ---- */
    const x = b.x * S, z = b.y * S, lift = pzLift(t), cy = lift + PZ_H * 0.5;
    this.pzY = lift + PZ_H * 0.56;
    if(this.pzF !== b){ this.pzF = b; this.pzT0 = t; }
    const e = t - this.pzT0;
    /* l'entrée : il se projette par un rayon venu d'en haut */
    if(e < 3.2){
      const k = Math.max(0, 1 - e / 3.2), col = this.cols.take();
      col.position.set(x, 0, z); col.scale.set(0.4 + 1.6 * k, 50, 0.4 + 1.6 * k); setBand(col, "#35f0d6", 1.1 * k, t, 6);
      for(let i = 0; i < 3; i++){ const q = ((e * 0.9 + i / 3) % 1), y = 12 * (1 - q); D.add(x, z, 0.6 + 2.2 * (1 - q), "#35f0d6", {fill:0, rim:k * 1.4, inner:0.92}); this.rings.add(x, y, z, t, 0, 0, 1.4 + (1 - q) * 3, "#35f0d6"); }
      if(Math.random() < 0.8 * k) this.bits.push({x:x + (Math.random() - .5) * 2, y:6 + Math.random() * 6, z:z + (Math.random() - .5) * 2, vx:0, vy:-6, vz:0, g:0, life:0.9, max:0.9, s:0.1 + Math.random() * 0.12, c:Math.random() < 0.7 ? "#35f0d6" : "#ff3d7f", r:Math.random() * 6});
    }
    /* sa signature : trois anneaux qui tournent autour de lui, une projection au sol */
    const sp = b.p25 ? 2.2 : 1;
    for(let i = 0; i < 3; i++){
      const tilt = 0.5 + i * 0.55, rr = 1.45 + i * 0.22;
      this.rings.add(x, cy, z, t * (0.8 + i * 0.5) * sp, tilt, t * 0.6 * sp, rr * 2, i === 1 ? "#ff3d7f" : "#35f0d6");
      const a = t * (1.4 + i * 0.6) * sp + i * 2.1;
      this.cubes.add(x + Math.cos(a) * rr, cy + Math.sin(a * 0.7 + i) * 0.6, z + Math.sin(a) * rr, a, a * 0.5, 0, 0.16, i === 1 ? "#ff3d7f" : "#35f0d6");
    }
    D.add(x, z, 1.6, "#35f0d6", {fill:0.06, rim:0.6, inner:0.9, dash:true});
    G.add(x, cy, z, PZ_H * 1.6, b.p25 ? "#ff3d7f" : "#35f0d6", 0.14);
    /* la surchauffe : il fume, il crépite */
    if(b.p25){
      if(Math.random() < 0.7) F.local.push({x:x + (Math.random() - .5) * 1.4, y:cy + (Math.random() - .5) * 1.4, z:z + (Math.random() - .5) * 1.4, vx:(Math.random() - .5), vy:1.5 + Math.random() * 2, vz:(Math.random() - .5), life:0.45, max:0.45, s:0.07, c:Math.random() < 0.5 ? "#ff3d7f" : "#ffd0e0"});
      if(Math.random() < 0.25) B.bolt(x + (Math.random() - .5) * 1.6, cy + 0.8, z + (Math.random() - .5) * 1.6, x + (Math.random() - .5) * 1.6, cy - 0.6, z + (Math.random() - .5) * 1.6, 0.04, "#ff3d7f", 0.9, 4, 0.25);
    }
    /* Conversion : un bouclier de la couleur du type qu'il encaisse */
    if(b.conv){
      const C = (ref("brTypeCol") || (()=>"#35f0d6"))(b.conv), hx = this.hexes.take();
      hx.position.set(x, lift - 0.3, z); hx.scale.set(2.1, PZ_H * 1.25, 2.1); hx.rotation.y = t * 0.8; setBand(hx, C, 0.85, t, 6);
      for(let i = 0; i < 6; i++){ const a = -t * 1.6 + i * TAU / 6; this.cubes.add(x + Math.cos(a) * 2.5, cy + Math.sin(t * 2 + i) * 0.5, z + Math.sin(a) * 2.5, a, 0.6, 0, 0.26, C); }
      D.add(x, z, 2.2, C, {fill:0.06, rim:0.9, inner:0.9});
    }
    /* Ultralaser : il se fige, une charge grossit devant lui */
    if(b.lock && !this.lockOn){ this.lockOn = true; this.lockT0 = t; }
    if(!b.lock) this.lockOn = false;
    if(this.lockOn){
      const q = Math.min(1, (t - this.lockT0) / 1.4), fired = t - this.lockT0 > 1.4;
      const ax = R.x * S - x, az = R.y * S - z, al = Math.hypot(ax, az) || 1, ox = x + ax / al * 1.3, oz = z + az / al * 1.3, oy = this.pzY;
      if(!fired){
        G.add(ox, oy, oz, 0.5 + q * 3.2, "#ff3d7f", 0.85); G.add(ox, oy, oz, 0.2 + q * 1.1, "#ffffff", 1);
        this.rings.add(ox, oy, oz, t * 7, 1.2, t * 3, (2.4 - q * 1.6) * 1.2, "#ff3d7f"); this.rings.add(ox, oy, oz, -t * 9, 0.4, -t * 2, (1.8 - q * 1.2) * 1.2, "#ffd0e0");
        for(let i = 0; i < 3; i++){ const u = Math.random() * TAU, v = Math.random() * Math.PI, d = 2.6;
          const px = ox + Math.cos(u) * Math.sin(v) * d, py = oy + Math.cos(v) * d, pz = oz + Math.sin(u) * Math.sin(v) * d;
          F.local.push({x:px, y:py, z:pz, vx:(ox - px) / 0.32, vy:(oy - py) / 0.32, vz:(oz - pz) / 0.32, life:0.3, max:0.3, s:0.08, c:i ? "#ff3d7f" : "#ffffff"}); }
      } else G.add(ox, oy, oz, 4.5, "#ff3d7f", 0.9);
    }
    /* la téléportation : il se défait en blocs, se refait ailleurs */
    if(b.ghost && b.ghost.t > 0){
      if(this.ghostRef !== b.ghost){
        this.ghostRef = b.ghost;
        const gx = b.ghost.x * S, gz = b.ghost.y * S;
        for(let i = 0; i < 40; i++){ const a = Math.random() * TAU, v = Math.random() * 2 - 1, sp = 3 + Math.random() * 5, ch = Math.sqrt(1 - v * v);
          this.bits.push({x:gx, y:cy, z:gz, vx:Math.cos(a) * ch * sp, vy:v * sp, vz:Math.sin(a) * ch * sp, g:0, drag:2.2, life:0.8, max:0.8, s:0.12 + Math.random() * 0.2, c:i % 2 ? "#35f0d6" : "#88fff0", r:Math.random() * 6}); }
        for(let i = 0; i < 30; i++){ const a = Math.random() * TAU, v = Math.random() * 2 - 1, d = 3 + Math.random() * 2, ch = Math.sqrt(1 - v * v);
          const px = x + Math.cos(a) * ch * d, py = cy + v * d, pz = z + Math.sin(a) * ch * d;
          this.bits.push({x:px, y:py, z:pz, vx:(x - px) / 0.4, vy:(cy - py) / 0.4, vz:(z - pz) / 0.4, g:0, life:0.4, max:0.4, s:0.12 + Math.random() * 0.15, c:"#ff3d7f", r:Math.random() * 6}); }
      }
      const gx = b.ghost.x * S, gz = b.ghost.y * S, k = Math.min(1, b.ghost.t / 0.5);
      G.add(gx, cy, gz, PZ_H * 1.3 * k, "#35f0d6", 0.55 * k);
      this.rings.add(gx, cy, gz, t * 4, 0.6, 0, 3.2 * (1.4 - k), "#35f0d6");
    } else this.ghostRef = null;
  }

  /* ---------- les blocs qui volent ---------- */
  flyBits(dt){
    const L = this.bits;
    if(L.length > 400) L.splice(0, L.length - 400);
    for(let i = L.length - 1; i >= 0; i--){
      const p = L[i]; p.life -= dt;
      if(p.life <= 0){ L.splice(i, 1); continue; }
      if(p.drag){ const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
      p.vy -= (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.r += dt * 6;
      if(p.y < p.s * 0.5){ p.y = p.s * 0.5; p.vy = Math.abs(p.vy) * 0.3; p.vx *= 0.7; p.vz *= 0.7; }
      this.cubes.add(p.x, p.y, p.z, p.r, p.r * 0.6, 0, p.s * Math.min(1, p.life / p.max * 2), p.c);
    }
  }
}
