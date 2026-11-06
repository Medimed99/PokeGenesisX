/* ============================================================
   LA BRÈCHE EN 3D · LES ATTAQUES DES LÉGENDAIRES
   Les 21 signatures du jeu mobile (59l), chacune avec sa mécanique
   et son dessin, refaites en volume. La simulation ne change pas :
   on lit ses zones (z.k = "lgGivre", "lgCage"…) et on les met en scène.
     Artikodin  Blizzard        un flocon tombe du ciel, le sol gèle
     Électhor   Cage-Éclair     des plumes plantées, une cage d'éclairs qui se resserre
     Sulfura    Sillage Ardent  une traînée de flammes ; un battement d'ailes de feu
     Raikou     Tonnerre        un nuage d'orage qui suit, la foudre à la verticale
     Entei      Éruption        des bombes de lave en cloche, des mares de magma
     Suicune    Rideau d'Aurore des voiles d'aurore, hauts comme le ciel
     Lugia      Aéroblast       le vent se rassemble, puis un rayon fend le couloir
     Ho-Oh      Feu Sacré       un arc-en-ciel de flammes, le feu qui se transmet
     Celebi     Voile Temporel  une bulle où le temps s'arrête, une horloge qui recule
     Regirock   Monolithes      des menhirs jaillissent, puis éclatent
     Regice     Prisme Glacé    un prisme qui tourne et lance ses rayons
     Registeel  Verrouillage    une mire sur le plus solide, puis le ciel s'abat
     Latias     Ball'Brume      des sphères qui éclatent en brume rose
     Latios     Lumi-Éclat      un piqué d'un bord à l'autre, la trace explose
     Kyogre     Onde Originelle des murs d'eau qui emportent la horde
     Groudon    Lame Pangéenne  des anneaux de lames de roche, vague après vague
     Rayquaza   Draco-Ascension un serpent céleste qui ondule autour de l'équipe
     Jirachi    Vœu Destructeur des étoiles filantes ; un vœu au-dessus de l'équipe
     Deoxys     Psycho Boost    trois formes : la double hélice, la barrière, la rafale
   (Mewtwo et Mew : la singularité et le Métronome, déjà en volume.)
   ============================================================ */
import * as THREE from "three";
import { S, ref, col, Pool } from "./lib.js";
import { Inst, bandMat, setBand, SHAPES } from "./fx.js";
import { makeMon } from "../mon/model3d.js";

export const LEG3D = new Set(["lgGivre", "lgGel", "lgCage", "lgFlamme", "lgAiles", "lgNuage", "lgFoudre", "lgBombe", "lgMagma", "lgAurore", "lgAero",
  "lgCouloir", "lgArc", "lgPasse", "lgTemps", "lgMenhir", "lgPrisme", "lgVerrou", "lgFrappe", "lgOrbe", "lgBrume", "lgPique", "lgVague", "lgPic",
  "lgEtoile", "lgVoeu", "lgHelice", "lgHex"]);
const TAU = Math.PI * 2;
const hsl = (h, s = 95, l = 62) => `hsl(${Math.round(((h % 360) + 360) % 360)},${s}%,${l}%)`;

export class Legends {
  constructor(fx){
    this.fx = fx; const scene = fx.scene;
    this.inst = {
      flake:new Inst(scene, "flake", 80, false), feather:new Inst(scene, "feather", 60, true), menhir:new Inst(scene, "menhir", 40, true),
      scale:new Inst(scene, "ball", 120, true), cloud:new Inst(scene, "ball", 60, true), crystal:new Inst(scene, "shard", 80, false)
    };
    this.inst.cloud.mesh.material = new THREE.MeshStandardMaterial({roughness:1, flatShading:true});
    this.inst.cloud.mesh.castShadow = false;
    this.inst.crystal.mesh.material = new THREE.MeshStandardMaterial({color:"#ffffff", emissive:"#6fdcff", emissiveIntensity:0.6, roughness:0.15, metalness:0.1, transparent:true, opacity:0.85});
    this.inst.menhir.mesh.material = new THREE.MeshStandardMaterial({roughness:0.9, flatShading:true});
    this.inst.scale.mesh.material = new THREE.MeshStandardMaterial({roughness:0.5, metalness:0.1, emissive:"#0a2a14", emissiveIntensity:1});
    this.hexes = new Pool(scene, () => { const m = new THREE.Mesh(SHAPES.hex(), bandMat()); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.domes = new Pool(scene, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({color:"#9fe07a", transparent:true, opacity:0.12,
      blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide})); m.renderOrder = 12; m.frustumCulled = false; return m; });
    this.rainbow = new Pool(scene, () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.955, 1, 40, 1, -1, 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true,
      opacity:0.6, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false})); m.renderOrder = 13; m.frustumCulled = false; return m; });
    this._v = {x:0, y:0};
  }
  begin(){ for(const k in this.inst) this.inst[k].begin(); this.hexes.begin(); this.domes.begin(); this.rainbow.begin(); this.frame = (this.frame || 0) + 1; }
  end(){
    for(const k in this.inst) this.inst[k].end(); this.hexes.end(); this.domes.end(); this.rainbow.end();
    /* les Rayquaza qui ne volent plus cette image disparaissent */
    if(this.serps) for(const [k, q] of this.serps){ if(q.seen !== this.frame){ q.m.group.visible = false; if(this.frame - q.seen > 600){ q.m.dispose(); this.serps.delete(k); } } }
  }

  /* une zone d'un légendaire : vrai si elle est dessinée en volume */
  zone(z, R, t){
    const F = this[z.k];
    if(!F) return false;
    const k = z.max ? Math.max(0, z.life) / z.max : 1;
    F.call(this, z, R, t, k, z.x * S, z.y * S, (z.r || 0) * S);
    return true;
  }

  /* ---------- Artikodin ---------- */
  lgGivre(z, R, t, k, x, y, r){
    const F = this.fx, h = 8.3 * k;
    F.discs.add(x, y, r * (0.3 + 0.7 * (1 - k)), "#bff4ff", {fill:0.1 + 0.25 * (1 - k), rim:0.7 * (1 - k), prog:k});
    this.inst.flake.add(x, h + 0.6, y, z.spin + (1 - k) * 7, 0.4, (1 - k) * 4, 0.55 + (z.evo ? 0.2 : 0), "#e8fbff");
    F.glow.add(x, h + 0.6, y, 1.6, "#bff4ff", 0.6);
    F.rib.seg(x, h + 0.6, y, x, h + 2.4, y, 0.12, "#bff4ff", 0.35, 0.02);
    if(Math.random() < 0.4) F.local.push({x:x + (Math.random() - .5) * 0.4, y:h + 0.6, z:y + (Math.random() - .5) * 0.4, vx:0, vy:0.4, vz:0, life:0.5, max:0.5, s:0.08, c:"#ffffff"});
  }
  lgGel(z, R, t, k, x, y, r){
    const F = this.fx, a = Math.min(1, k * 3);
    F.discs.add(x, y, r, "#dff9ff", {fill:0.14 * a, rim:0.6 * a, dash:true});
    for(let i = 0; i < 5; i++){ const an = i * 1.26 + z.x * 0.01, d = r * 0.55; this.inst.crystal.add(x + Math.cos(an) * d, 0.18 * a, y + Math.sin(an) * d, an, 0, 0.3, 0.38 * a, "#ffffff"); }
  }
  /* ---------- Électhor ---------- */
  lgCage(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 5), H = 1.1;
    const P = z.pts || [], seg = (a, b) => {
      F.rib.bolt(a.x * S, H, a.y * S, b.x * S, H, b.y * S, 0.12 * fade, "#ffe45e", 0.9 * fade, 7, 0.35);
      if(Math.random() < 0.5) F.rib.bolt(a.x * S, 0.3, a.y * S, b.x * S, 0.3, b.y * S, 0.06 * fade, "#fffbe0", 0.5 * fade, 6, 0.25);
    };
    for(let i = 0; i < P.length; i++) seg(P[i], P[(i + 1) % P.length]);
    if(z.evo) for(const p of P) seg({x:z.x, y:z.y}, p);
    P.forEach((p, i)=>{
      const px = p.x * S, py = p.y * S;
      this.inst.feather.add(px, 0, py, i * 0.7, -0.15, Math.sin(t * 3 + i) * 0.08, 1.35, "#ffd24a");
      F.glow.add(px, H, py, 1.3 + Math.sin(t * 9 + i) * 0.2, "#ffe45e", 0.55 * fade);
    });
    if(z.evo){ this.inst.feather.add(x, 0, y, t, 0, 0, 1.6, "#ffe45e"); F.glow.add(x, 1.2, y, 2, "#ffe45e", 0.5 * fade); }
    const b = F.bands.take(); b.position.set(x, 0, y); b.scale.set(r, 1.4, r); setBand(b, "#ffe45e", 0.22 * fade, t, 0);
  }
  /* ---------- Sulfura ---------- */
  lgFlamme(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 3);
    F.discs.add(x, y, r, "#3a1206", {fill:0, rim:0.2 * fade});
    F.puff.add(x, 0.06, y, r * 2.2, "#1a0602", 0.4 * fade);
    for(let i = 0; i < 3; i++){
      const ph = t * 11 + (z.seed || 0) + i * 1.7, ox = (i - 1) * r * 0.45, h = r * (1.6 + 0.5 * Math.sin(ph)) * (0.6 + 0.4 * fade);
      const f = F.funnels.take(); f.position.set(x + ox, 0, y + Math.sin(ph) * 0.05); f.scale.set(r * 0.32, h, r * 0.32); f.rotation.y = t * 5 + i; setBand(f, i % 2 ? "#ff8a3d" : "#ff5a1a", 0.9 * fade, t + i, 1);
      F.glow.add(x + ox, h * 0.45, y, r * 1.4, "#ff8a3d", 0.45 * fade);
      F.glow.add(x + ox, h * 0.25, y, r * 0.6, "#ffe9a8", 0.6 * fade);
    }
    if(Math.random() < 0.3 * fade) F.local.push({x:x + (Math.random() - .5) * r, y:0.3, z:y + (Math.random() - .5) * r, vx:0, vy:1.5 + Math.random(), vz:0, life:0.6, max:0.6, s:0.07, c:Math.random() < 0.5 ? "#ffd24a" : "#ff8a3d"});
  }
  lgAiles(z, R, t, k, x, y, r){
    const F = this.fx, s = 1 - k, b = F.bands.take();
    b.position.set(x, 0, y); b.scale.set(r * (0.3 + 0.8 * s), 1.6, r * (0.3 + 0.8 * s)); setBand(b, "#ff5a1a", 0.9 * k, t, 0);
    /* deux ailes de feu qui s'ouvrent */
    for(const side of [-1, 1]){
      const pts = [];
      for(let i = 0; i <= 10; i++){
        const u = i / 10, sp = r * (0.4 + 0.9 * s) * u;
        pts.push([x + Math.cos(t * 0.2) * side * sp, 1.2 + Math.sin(u * Math.PI) * 1.6 * (0.6 + 0.4 * s) + u * 0.6, y - Math.sin(t * 0.2) * side * sp - u * 0.2]);
      }
      F.rib.line(pts, 0.55 * k + 0.1, "#ff5a1a", 0.6 * k); F.rib.line(pts, 0.18 * k + 0.05, "#ffd24a", 0.9 * k);
    }
  }
  /* ---------- Raikou ---------- */
  lgNuage(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 4, (1 - k) * 8), lit = z.flash > 0, H = 4.6;
    const puffs = [[-0.8, 0.12, 0.5], [-0.25, -0.18, 0.62], [0.42, -0.06, 0.56], [0.95, 0.18, 0.42], [0.06, 0.25, 0.53], [-0.45, 0.3, 0.4]];
    for(const [ox, oz, rr] of puffs) this.inst.cloud.add(x + ox, H + oz * 0.6, y + oz, t * 0.1 + ox, 0, 0, rr * 2 * (0.4 + 0.6 * fade), lit ? "#6f7aa8" : "#2a3048");
    if(lit) F.glow.add(x, H - 0.2, y, 3.2, "#fff09a", 0.7);
    for(let i = 0; i < 10; i++){ const rx = x - 1 + ((i * 0.37 + t * 0.6) % 2), rz = y + ((i * 0.23) % 1 - 0.5), ry = H - 0.4 - ((t * 7 + i * 0.7) % 3);
      F.rib.seg(rx, ry, rz, rx - 0.05, ry - 0.35, rz, 0.02, "#9fc7ff", 0.35 * fade); }
    F.puff.add(x, 0.06, y, 2.4, "#000000", 0.2 * fade);
  }
  lgFoudre(z, R, t, k, x, y){
    const F = this.fx;
    F.rib.bolt(z.fx * S, 4.4, z.fy * S, x, 0.05, y, 0.22 * k + 0.05, "#ffe45e", k, 8, 0.6);
    F.glow.add(x, 0.3, y, 2.2, "#ffe45e", k);
    F.discs.add(x, y, 34 * S, "#ffe45e", {fill:0.25 * k, rim:k});
  }
  /* ---------- Entei ---------- */
  lgBombe(z, R, t, k, x, y, r){
    const F = this.fx, s = 1 - k, at = u => [(z.ox + (z.x - z.ox) * u) * S, 0.8 + Math.sin(u * Math.PI) * 8.1, (z.oy + (z.y - z.oy) * u) * S];
    F.discs.add(x, y, r * (1.1 - 0.4 * s), "#ff5a1a", {fill:0.06 + 0.12 * s, rim:0.6 * s, prog:k});
    F.shadow(x, y, 0.2 + 0.4 * s);
    const [bx, by, bz] = at(s);
    F.inst.rock.add(bx, by, bz, t * 5, t * 3, 0, 0.42 * (z.big || 1), "#2a0d06");
    F.glow.add(bx, by, bz, 1.4 * (z.big || 1), "#ff8a3d", 0.8);
    for(let i = 1; i <= 5; i++){ const [px, py, pz] = at(Math.max(0, s - i * 0.035)); F.glow.add(px, py, pz, 0.9 - i * 0.12, "#ff8a3d", 0.5 - i * 0.08); }
    if(Math.random() < 0.6) F.local.push({x:bx, y:by, z:bz, vx:(Math.random() - .5) * 0.6, vy:0.4, vz:(Math.random() - .5) * 0.6, g:3, life:0.5, max:0.5, s:0.1, c:"#ffb35c"});
  }
  lgMagma(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 3);
    F.puff.add(x, 0.05, y, r * 2.4, "#1a0602", 0.75 * fade);
    F.discs.add(x, y, r * 0.75, "#ff5a1a", {fill:(0.4 + 0.15 * Math.sin(t * 5 + (z.seed || 0))) * fade, rim:0.5 * fade});
    F.glow.add(x, 0.25, y, r * 2.2, "#ff5a1a", 0.35 * fade);
    const b = (t * 1.7 + (z.seed || 0)) % 1; F.glow.add(x + Math.cos((z.seed || 0) * 3) * r * 0.4, 0.1 + b * 0.3, y + Math.sin((z.seed || 0) * 3) * r * 0.3, 0.2 + b * 0.25, "#ffe9a8", (1 - b) * fade);
  }
  /* ---------- Suicune ---------- */
  lgAurore(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 4, (1 - k) * 6), span = (z.span || 900) * S;
    for(let i = 0; i < 3; i++){
      const w = F.walls.take(); w.position.set(x + i * 0.25 * (z.dir || 1), 0, y + Math.sin(t * 0.7 + i) * 0.4);
      w.rotation.set(0, Math.PI / 2 + Math.sin(t * 0.5 + (z.ph || 0) + i) * 0.06, 0); w.scale.set(span, 4.6 - i * 0.6, 1);
      setBand(w, "#6fe8ff", (0.34 - i * 0.08) * fade, t + i * 0.8 + (z.ph || 0), 5);
    }
    for(let i = 0; i < 4; i++){ const zz = y + ((t * 3 + i * 7) % span) - span / 2; F.glow.add(x, 1 + (i % 2) * 1.5, zz, 0.5, "#e8fff4", 0.5 * fade); }
  }
  /* ---------- Lugia ---------- */
  lgAero(z, R, t, k, x, y){
    const F = this.fx, ca = Math.cos(z.a), sa = Math.sin(z.a), H = 1.2;
    if(z.life > 0.5){
      const c = 1 - (z.life - 0.5) / 0.55, cx = x + ca * 1.1, cy = y + sa * 1.1;
      F.glow.add(cx, H, cy, 0.6 + 1.6 * c, "#e0ecff", 0.5 + 0.4 * c);
      F.inst.orb.add(cx, H, cy, 0, 0, 0, 0.25 + 0.5 * c, "#ffffff");
      for(let i = 0; i < 3; i++) F.inst.ring.add(cx, H, cy, -z.a + Math.PI / 2, Math.PI / 2, t * 9 + i * 2, (0.9 + i * 0.5 + (1 - c) * 1.2), "#9fc7ff");
      /* le vent se rassemble : des filets qui convergent */
      for(let i = 0; i < 4; i++){ const an = t * 4 + i * 1.57, d = 2.4 * (1 - ((t * 2 + i * 0.25) % 1)); F.rib.seg(cx + Math.cos(an) * d, H + Math.sin(an * 1.3) * d * 0.4, cy + Math.sin(an) * d, cx, H, cy, 0.03, "#e0ecff", 0.5 * c, 0.01); }
      return;
    }
    const kk = Math.max(0, z.life) / 0.5, bw = z.bw * S * (0.5 + 0.5 * kk), len = z.len * S;
    const bm = F.beams.take(); bm.position.set(x, H, y); bm.rotation.set(0, -z.a, 0); bm.scale.set(len, bw, bw); setBand(bm, "#c8e1ff", 1.4 * Math.min(1, kk * 2.5), t, 4);
    F.core(x, H, y, z.a, len, bw * 0.45, Math.min(1, kk * 2.5));
    for(let i = 0; i < 7; i++){ const d = ((t * 28 + i * len / 7) % len); F.inst.ring.add(x + ca * d, H, y + sa * d, -z.a + Math.PI / 2, Math.PI / 2, 0, bw * 2.1, "#ffffff"); }
    F.glow.add(x + ca * 0.8, H, y + sa * 0.8, bw * 6, "#e0ecff", 0.8 * kk);
  }
  lgCouloir(z, R, t, k, x, y){
    const F = this.fx, ca = Math.cos(z.a), sa = Math.sin(z.a), len = z.len * S, bw = z.bw * S;
    const q = F.quads.take(); q.position.set(x, 0.05, y); q.rotation.set(0, -z.a, 0); q.scale.set(len, 1, bw * 2); q.material.color.set("#9fc7ff"); q.material.opacity = 0.06 * k;
    for(let i = 0; i < 6; i++){ const d = ((t * 12 + i * len / 6) % len), side = ((i * 0.37) % 1 - 0.5) * bw * 1.6, px = x + ca * d - sa * side, py = y + sa * d + ca * side;
      F.rib.seg(px, 0.5 + (i % 3) * 0.4, py, px + ca * 1.1, 0.5 + (i % 3) * 0.4, py + sa * 1.1, 0.03, "#ffffff", 0.5 * k, 0.01); }
  }
  /* ---------- Ho-Oh ---------- */
  lgArc(z, R, t, k, x, y, r){
    const F = this.fx, s = 1 - k;
    /* six arcs fins, aux couleurs de l'arc-en-ciel, qui s'élargissent ensemble */
    for(let i = 0; i < 6; i++){
      const rr = r * (0.3 + 0.7 * s) + i * 0.32;
      const a = this.rainbow.take(); a.position.set(x, 0.5 + i * 0.16, y); a.rotation.set(0, -z.a, 0); a.scale.set(rr, 1, rr);
      a.material.color.copy(col(hsl((z.hue || 0) + i * 52))); a.material.opacity = 0.55 * k;
    }
    for(let i = 0; i < 5; i++){ const an = z.a + (i / 4 - 0.5) * 1.6, d = r * (0.3 + 0.7 * s) + 0.8; F.glow.add(x + Math.cos(an) * d, 0.9, y + Math.sin(an) * d, 0.7, hsl((z.hue || 0) + i * 70), 0.6 * k); }
  }
  lgPasse(z, R, t, k, x, y){
    const F = this.fx, ax = z.fx * S, ay = z.fy * S, pts = [];
    for(let i = 0; i <= 10; i++){ const u = i / 10; pts.push([ax + (x - ax) * u, 0.9 + Math.sin(u * Math.PI) * 1.4, ay + (y - ay) * u]); }
    F.rib.line(pts, 0.14, hsl(z.hue || 0, 95, 65), k);
    F.glow.add(x, 0.9, y, 0.9, hsl((z.hue || 0) + 40), k);
  }
  /* ---------- Celebi ---------- */
  lgTemps(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 6, (1 - k) * 8);
    const d = this.domes.take(); d.position.set(x, 0, y); d.scale.set(r, r * 0.6, r); d.material.opacity = 0.1 * fade;
    F.discs.add(x, y, r, "#9fe07a", {fill:0.12 * fade, rim:1.1 * fade});
    for(let i = 0; i < 12; i++){ const a = i / 12 * TAU, r1 = r * (i % 3 ? 0.9 : 0.82); F.rib.seg(x + Math.cos(a) * r1, 0.07, y + Math.sin(a) * r1, x + Math.cos(a) * r, 0.07, y + Math.sin(a) * r, 0.06, "#c9ffb0", 0.8 * fade); }
    /* les aiguilles reculent */
    const a1 = -t * 5, a2 = -t * 0.8;
    F.rib.seg(x, 0.08, y, x + Math.cos(a1) * r * 0.75, 0.08, y + Math.sin(a1) * r * 0.75, 0.09, "#c9ffb0", 0.9 * fade);
    F.rib.seg(x, 0.09, y, x + Math.cos(a2) * r * 0.5, 0.09, y + Math.sin(a2) * r * 0.5, 0.14, "#c9ffb0", 0.9 * fade);
    /* un anneau d'horloge qui flotte, et des grains de temps immobiles */
    F.inst.ring.add(x, r * 0.45, y, -t * 0.6, 0, 0, r * 0.6, "#9fe07a");
    for(let i = 0; i < 8; i++){ const a = i * 0.79 + (z.x % 5), dd = r * (0.3 + ((i * 0.37) % 0.6)); F.glow.add(x + Math.cos(a) * dd, 0.4 + (i % 4) * 0.35, y + Math.sin(a) * dd, -0.12, "#e8ffd8", 0.8 * fade); }
  }
  /* ---------- Regirock ---------- */
  lgMenhir(z, R, t, k, x, y, r){
    const F = this.fx, el = z.max - Math.max(0, z.life), rise = Math.min(1, el / 0.18), shake = z.life < 0.35 ? (Math.random() - .5) * 0.08 : 0;
    const w = r * 1.7, h = r * 2.8 * 1.6;
    this.inst.menhir.add(x + shake, (rise - 1) * h, y, (z.seed || 0), 0, 0, w, "#8a6a42", h);
    F.shadow(x, y, w * 0.7);
    /* les points des Regis, sur la face avant */
    if(rise >= 1){
      const a = z.seed || 0, nx = Math.sin(a), nz = Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a), d = w * 0.62 * 0.5 * 0.9 + 0.03;
      for(const [ox, oy] of [[-0.2, 0.42], [0.2, 0.42], [0, 0.6], [-0.2, 0.78], [0.2, 0.78]])
        F.glow.add(x + shake + nx * d + rx * ox * w, h * oy * 0.85, y + nz * d + rz * ox * w, -0.12, "#ffd24a", 1);
    }
    if(el < 0.25 && Math.random() < 0.7) F.local.push({x:x + (Math.random() - .5) * w, y:0.1, z:y + (Math.random() - .5) * w, vx:(Math.random() - .5), vy:2.5, vz:(Math.random() - .5), g:9, life:0.5, max:0.5, s:0.1, c:"#6b5030", dark:true});
  }
  /* ---------- Regice ---------- */
  lgPrisme(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 6, (1 - k) * 10), H = 1;
    for(let i = 0; i < (z.rays || 3); i++){
      const a = (z.rot || 0) + i / (z.rays || 3) * TAU, bm = F.beams.take();
      bm.position.set(x, H, y); bm.rotation.set(0, -a, 0); bm.scale.set(r, 0.09, 0.09); setBand(bm, "#aef4ff", 1.1 * fade, t, 4);
      F.core(x, H, y, a, r, 0.05, fade);
      F.glow.add(x + Math.cos(a) * r, H, y + Math.sin(a) * r, 0.5, "#aef4ff", 0.5 * fade);
    }
    this.inst.crystal.add(x, H + Math.sin(t * 2) * 0.1, y, (z.rot || 0), 0, 0, 0.9, "#ffffff", 1.6);
    F.glow.add(x, H, y, 2.2, "#aef4ff", 0.45 * fade);
    F.discs.add(x, y, r, "#aef4ff", {fill:0.04 * fade, rim:0.3 * fade, dash:true});
  }
  /* ---------- Registeel ---------- */
  lgVerrou(z, R, t, k, x, y, r){
    const F = this.fx, rr = (16 + 26 * k) * S * 1.6, c = k < 0.3 && Math.floor(t * 16) % 2 ? "#ffffff" : "#ff3d4f";
    F.inst.ring.add(x, 0.12, y, t * 2 * (1 + (1 - k) * 2), 0, 0, rr * 2, c);
    F.inst.ring.add(x, 1.2, y, -t * 3, 0, 0, rr * 1.2, c);
    for(let i = 0; i < 4; i++){ const a = t * 2 * (1 + (1 - k) * 2) + i * Math.PI / 2; F.rib.seg(x + Math.cos(a) * rr * 0.75, 0.13, y + Math.sin(a) * rr * 0.75, x + Math.cos(a) * rr * 1.3, 0.13, y + Math.sin(a) * rr * 1.3, 0.06, c, 0.9); }
    /* la mire, depuis le ciel */
    F.rib.seg(x, 14, y, x, 0.1, y, 0.03 + (1 - k) * 0.05, "#ff3d4f", 0.6);
  }
  lgFrappe(z, R, t, k, x, y, r){
    const F = this.fx, w = (18 * k + 2) * S * 2;
    F.rib.seg(x, 16, y, x, 0, y, w * 2, "#c7d2e0", k, w * 2); F.rib.seg(x, 16, y, x, 0, y, w * 0.6, "#ffffff", k, w * 0.6);
    F.glow.add(x, 0.4, y, Math.min(90, z.r * (1.1 - 0.4 * k)) * S * 2.4, "#e8f0ff", k);
    F.discs.add(x, y, r * (1.1 - 0.4 * k), "#e8f0ff", {fill:0.3 * k, rim:k});
  }
  /* ---------- Latias ---------- */
  lgOrbe(z, R, t, k, x, y){
    const F = this.fx, H = 1.1;
    F.inst.orb.add(x, H, y, 0, 0, 0, 0.36, "#ffd6ec");
    F.glow.add(x, H, y, 1.3, "#ff9ad5", 0.6);
    F.glow.add(x - z.vx * S * 0.05, H, y - z.vy * S * 0.05, 0.8, "#ff9ad5", 0.35);
    F.rib.seg(x - z.vx * S * 0.12, H, y - z.vy * S * 0.12, x, H, y, 0.02, "#ff9ad5", 0.5, 0.25);
  }
  lgBrume(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, k * 3, (1 - k) * 6);
    for(let i = 0; i < 6; i++){
      const a = (z.seed || 0) + i * 1.05 + t * 0.4, ox = Math.cos(a) * r * 0.45, oz = Math.sin(a) * r * 0.45, rr = r * (0.9 + 0.2 * Math.sin(t * 2 + i));
      F.glow.add(x + ox, 0.45 + (i % 3) * 0.3, y + oz, rr * 1.6, "#ff9ad5", 0.12 * fade);
    }
    F.discs.add(x, y, r, "#ff9ad5", {fill:0.14 * fade, rim:0.35 * fade});
    for(let i = 0; i < 4; i++){ const a = (z.seed || 0) * 2 + i * 1.7 + t; F.glow.add(x + Math.cos(a) * r * 0.6, 0.5 + Math.sin(t * 2 + i) * 0.3, y + Math.sin(a * 1.3) * r * 0.5, -0.08, "#ffffff", 0.8 * fade); }
  }
  /* ---------- Latios ---------- */
  lgPique(z, R, t, k, x, y){
    const F = this.fx, fly = 0.5, el = z.max - Math.max(0, z.life), kk = Math.min(1, el / fly), H = 1.3, ax = z.ax * S, ay = z.ay * S;
    const glow = z.boom ? Math.max(0, z.life) / (z.max - fly - 0.18) : 0.6, bw = z.bw * S;
    F.rib.seg(ax, H, ay, x, H, y, bw * 2.4 * (z.boom ? 1 + glow : 1), "#6fa8ff", 0.35 * Math.min(1, glow + 0.2));
    F.rib.seg(ax, H, ay, x, H, y, bw * 0.6 * (z.boom ? 1 + glow : 1), "#d8e8ff", 0.85 * Math.min(1, glow + 0.2));
    if(z.boom && glow > 0.5) for(let i = 0; i < 3; i++){ const u = Math.random(); F.glow.add(ax + (x - ax) * u, H, ay + (y - ay) * u, 1.4, "#6fa8ff", glow * 0.8); }
    if(kk < 1){
      const yaw = Math.atan2(Math.cos(z.a), Math.sin(z.a));
      F.inst.needle.add(x, H, y, yaw, 0, 0, 2.2, "#6fa8ff");
      F.inst.shard.add(x, H, y, yaw, 0, Math.PI / 2, 0.9, "#ffffff");
      F.glow.add(x, H, y, 1.6, "#9fc7ff", 0.8);
    }
  }
  /* ---------- Kyogre ---------- */
  lgVague(z, R, t, k, x, y){
    const F = this.fx, fade = Math.min(1, k * 5, (1 - k) * 10), span = (z.span || 900) * S, ca = Math.cos(z.a), sa = Math.sin(z.a);
    const w = F.walls.take(); w.position.set(x, 0, y); w.rotation.set(0, -z.a + Math.PI / 2, 0); w.scale.set(span, 2.8, 1); setBand(w, "#3a8bff", 0.95 * fade, t, 2);
    const w2 = F.walls.take(); w2.position.set(x - ca * 0.6, 0, y - sa * 0.6); w2.rotation.set(0, -z.a + Math.PI / 2, 0); w2.scale.set(span, 1.8, 1); setBand(w2, "#96d2ff", 0.5 * fade, t + 1, 2);
    for(let i = 0; i < 3; i++){ const sd = (Math.random() - .5) * span; F.local.push({x:x - sa * sd, y:2.6, z:y + ca * sd, vx:ca * 3, vy:1.5, vz:sa * 3, g:7, life:0.5, max:0.5, s:0.14, c:"#e8f6ff"}); }
  }
  /* ---------- Groudon ---------- */
  lgPic(z, R, t, k, x, y, r){
    const F = this.fx, el = z.max - Math.max(0, z.life), up = Math.min(1, el / 0.08), down = z.life < 0.2 ? Math.max(0, z.life) / 0.2 : 1, s = up * down;
    const h = 1.7 * (z.h || 1) * s, c = z.evo ? "#ffd24a" : "#ff6a1a";
    /* une lame de roche, penchée vers l'extérieur, au tranchant incandescent */
    if(h > 0.02){
      const ca = Math.cos(z.a || 0), sa = Math.sin(z.a || 0);
      F.inst.spike.add(x, 0, y, z.a || 0, 0.3 * sa, -0.3 * ca, r * 1.6, "#4a1a08", h);
      F.rib.seg(x, 0.05, y, x + ca * h * 0.3, h * 0.95, y + sa * h * 0.3, 0.05, c, 0.8 * s, 0.02);
    }
    F.glow.add(x, 0.2, y, r * 3, c, 0.55 * s);
  }
  /* ---------- Jirachi ---------- */
  lgEtoile(z, R, t, k, x, y){
    const F = this.fx, prog = 1 - k, H = 0.9 + 7 * k * k, ca = Math.cos(z.a), sa = Math.sin(z.a);
    F.inst.star.add(x, H, y, t * 6, 0, t * 6, 0.6, "#fff6c8");
    F.glow.add(x, H, y, 1.8, "#ffe9a8", 0.75);
    const tl = 3.4, hb = 0.9 + 7 * Math.min(1, k + 0.15) ** 2;
    F.rib.seg(x - ca * tl, hb, y - sa * tl, x, H, y, 0.05, "#ffe9a8", 0.85, 0.3);
    if(Math.random() < 0.5) F.local.push({x, y:H, z:y, vx:(Math.random() - .5) * 0.5, vy:-0.5, vz:(Math.random() - .5) * 0.5, life:0.5, max:0.5, s:0.06, c:"#fff6c8"});
  }
  lgVoeu(z, R, t, k, x, y){
    const F = this.fx, h = 2.6 + (1 - k) * 0.8;
    F.inst.star.add(x, h, y, t * 2, 0, 0, 0.42, "#fff6c8");
    F.glow.add(x, h, y, 1.4, "#ffe9a8", 0.3 + 0.3 * Math.sin(t * 10));
  }
  /* ---------- Deoxys ---------- */
  lgHelice(z, R, t, k, x, y){
    const F = this.fx, ca = Math.cos(z.a), sa = Math.sin(z.a), len = z.len * S, bw = z.bw * S * 0.9, H = 1.1;
    for(const [ph, c] of [[0, z.color], [Math.PI, "#ffffff"]]){
      const pts = [];
      for(let d = 0; d <= len; d += 0.35){ const a = d * 1.9 + t * 14 + ph, side = Math.cos(a) * bw, up = Math.sin(a) * bw; pts.push([x + ca * d - sa * side, H + up, y + sa * d + ca * side]); }
      F.rib.line(pts, 0.1, c, k);
    }
    for(let d = 0; d <= len; d += 0.9){ const a = d * 1.9 + t * 14, side = Math.cos(a) * bw, up = Math.sin(a) * bw;
      F.rib.seg(x + ca * d - sa * side, H + up, y + sa * d + ca * side, x + ca * d + sa * side, H - up, y + sa * d - ca * side, 0.03, z.color, 0.6 * k); }
  }
  lgHex(z, R, t, k, x, y, r){
    const F = this.fx, fade = Math.min(1, Math.max(0, z.life) * 3), h = this.hexes.take();
    h.position.set(x, 0, y); h.rotation.y = t * 0.8; h.scale.set(r, 2, r); setBand(h, z.color || "#35f0d6", 0.7 * fade, t, 6);
    F.discs.add(x, y, r, z.color || "#35f0d6", {fill:0.06 * fade, rim:0.8 * fade});
  }

  /* ---------- Rayquaza : le serpent céleste (lié au Pokémon, pas à une zone) ----------
     Rayquaza lui-même (son vrai modèle, en grand) vole sur le tracé du serpent ; derrière lui,
     le sillage d'énergie draconique suit les anneaux que le jeu mobile calcule (ce sont eux qui
     touchent la horde). (Avant : une chaîne de boules vertes et jaunes, qui ne lui ressemblait pas.) */
  serpent(R, w, idx, t){
    const C = w.serpC; if(!C || !C.segs) return;
    const at = ref("lgSerpAt"), mp = ref("brMemberPos"), F = this.fx;
    const c = mp(R, idx), n = C.segs, r0 = (C.r || 9) * S * 1.75, o = this._v;
    const dt = Math.min(0.1, Math.max(0, t - (this._serpT ?? t))); this._serpT = t;
    this.serps = this.serps || new Map();
    for(let s = 0; s < C.n; s++){
      const pts = [];
      for(let i = 0; i < n; i++){
        at(R, C, c.x, c.y, s, i, o);
        const px = o.x * S, pz = o.y * S, py = 2.2 + Math.sin(R.t * 3 - i * 0.45 + s * 2) * 0.9;
        pts.push([px, py, pz]);
        if(i % 2 === 0) F.shadow(px, pz, r0 * 0.9 * (1 - i / n * 0.5));
      }
      const [hx, hy, hz] = pts[0], [nx, , nz] = pts[1] || pts[0];
      /* le sillage : un ruban vert, liseré d'or, qui s'amincit vers la queue */
      F.rib.line(pts.slice(1), r0 * 0.7, "#2fd06a", 0.55);
      F.rib.line(pts.slice(1, Math.ceil(n * 0.7)), r0 * 0.25, "#f2d24a", 0.75);
      for(let i = 2; i < n; i += 3) F.glow.add(pts[i][0], pts[i][1], pts[i][2], 0.8 * (1 - i / n), "#5ce07a", 0.35);
      /* Rayquaza */
      const key = idx + ":" + s;
      let q = this.serps.get(key);
      if(!q){ q = {m:makeMon(384, !!w.shiny, F.scene, {height:3.6})}; q.m.setAnim("run"); this.serps.set(key, q); }
      q.seen = this.frame; q.m.group.visible = true;
      q.m.lift = hy - 1.2; q.m.groundY = 0;
      q.m.update(t, dt, this._p || (this._p = new THREE.Vector3()).set(hx, 0, hz), Math.atan2(hx - nx, hz - nz));
      F.glow.add(hx, hy, hz, 1.6, "#5ce07a", 0.3);
    }
  }
}
