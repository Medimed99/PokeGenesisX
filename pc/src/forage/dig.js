/* ============================================================
   LE FORAGE EN 3D · LA FOUILLE
   La fouille du jeu mobile (le Souterrain de Diamant et Perle : une
   paroi de 12 × 9, la pioche et le marteau, la solidité qui baisse)
   se joue ici sur la vraie paroi, au nord de la caverne :
     · chaque case est un bloc de roche, plus épais quand il reste
       des couches (les trois tons de la couche, plus sombres en
       profondeur) ; le métal gris ne casse jamais ;
     · derrière, la roche dégagée et ce qu'elle cache : objets,
       pierres, fossiles, pépites, parfois un Pokémon endormi ;
     · la souris vise : les cases que l'outil touchera s'allument ;
       un clic frappe (1 la pioche, 2 le marteau) ; l'outil, dans sa
       matière, s'abat ; les éclats volent ; la paroi se fissure à
       mesure que la solidité baisse ;
     · un objet dégagé s'illumine et sort de la roche vers soi ;
     · à zéro, tout s'effondre : la roche tombe du haut du cadre.
   Les règles, les tirages et le butin restent ceux du jeu mobile
   (digHit, digTap, digClaim) : on ne fait qu'y frapper.
   ============================================================ */
import * as THREE from "three";
import { glowMat, rockGeo } from "../world/biomes/kit.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
export const CELL = 0.7, GW = 12, GH = 9;
const V1 = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q0 = new THREE.Quaternion(), S3 = new THREE.Vector3(), TC = new THREE.Color();

export class DigWall {
  constructor(scene, center, chips){
    this.scene = scene; this.C = center.clone(); this.chips = chips;
    this.g = new THREE.Group(); this.g.position.copy(center); this.g.visible = false; scene.add(this.g);
    this.z0 = 0.05;
    /* derrière : la roche dégagée, et ce qu'elle cache (repeint à chaque fouille) */
    this.cv = document.createElement("canvas"); this.cv.width = GW * 64; this.cv.height = GH * 64;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.bg = new THREE.Mesh(new THREE.PlaneGeometry(GW * CELL, GH * CELL), new THREE.MeshStandardMaterial({map:this.tex, roughness:0.9, emissive:"#ffffff", emissiveMap:this.tex, emissiveIntensity:0.6}));
    this.bg.position.z = this.z0; this.g.add(this.bg);
    /* les blocs */
    const cellMat = glowMat({key:"digcell", color:"#ffffff", rough:0.92, flat:true,
      tint:`float e = max(abs(vOP.x), abs(vOP.y));
        diffuseColor.rgb *= (0.82 + 0.3 * bn(vWP.xy * 3.1 + vWP.z)) * mix(1.0, 0.62, smoothstep(0.38, 0.5, e));`});
    this.cells = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cellMat, GW * GH);
    this.cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.cells.castShadow = true; this.cells.receiveShadow = true;
    for(let i = 0; i < GW * GH; i++){ this.cells.setMatrixAt(i, M4.makeScale(0, 0, 0)); this.cells.setColorAt(i, TC.set("#ffffff")); }
    this.g.add(this.cells);
    this.Lc = new Array(GW * GH).fill(-1);
    /* la visée : les cases que l'outil touchera */
    this.aim = new THREE.InstancedMesh(new THREE.PlaneGeometry(CELL * 0.94, CELL * 0.94), new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, opacity:0.55, depthWrite:false, toneMapped:false}), 25);
    for(let i = 0; i < 25; i++) this.aim.setColorAt(i, TC.set("#ffffff"));
    this.aim.count = 0; this.aim.renderOrder = 6; this.g.add(this.aim);
    /* les fissures : elles gagnent la paroi à mesure que la solidité baisse */
    this.crackCv = document.createElement("canvas"); this.crackCv.width = 768; this.crackCv.height = 576; this.paintCracks();
    this.crackTex = new THREE.CanvasTexture(this.crackCv);
    this.crack = new THREE.Mesh(new THREE.PlaneGeometry(GW * CELL + 0.3, GH * CELL + 0.3), new THREE.MeshBasicMaterial({map:this.crackTex, transparent:true, opacity:0, depthWrite:false}));
    this.crack.position.z = 0.56; this.crack.renderOrder = 5; this.g.add(this.crack);
    /* l'outil qui s'abat */
    this.tool = new THREE.Group(); this.tool.visible = false; this.g.add(this.tool);
    this.toolMats = {head:new THREE.MeshStandardMaterial({color:"#a06b38", metalness:0.6, roughness:0.35}), handle:new THREE.MeshStandardMaterial({color:"#64401f", roughness:0.8})};
    /* ce qui sort de la roche */
    this.pops = [];
    /* l'effondrement */
    this.fall = null;
    this.fallIm = new THREE.InstancedMesh(rockGeo(55, 1, 0.8), new THREE.MeshStandardMaterial({color:"#ffffff", roughness:0.95, flatShading:true}), 48);
    this.fallIm.count = 0; this.fallIm.frustumCulled = false; this.g.add(this.fallIm);
    this.raycaster = new THREE.Raycaster(); this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(center.z + 0.5));
    this.hover = null; this.shake = 0;
  }
  cellPos(X, Y, out){ return out.set((X - (GW - 1) / 2) * CELL, ((GH - 1) / 2 - Y) * CELL, 0); }
  /* ---------- une nouvelle fouille : on repeint ce qui est caché ---------- */
  begin(D){
    this.D = D; this.g.visible = true; this.bg.visible = true; this.restKey = null; this.Lc.fill(-1); this.found = new Set(D.items.filter(it=>it.found).map(it=>it));
    this.paintBg(); this.paintT = performance.now(); this.fall = null; this.fallIm.count = 0; this.pops.length = 0;
    this.collapsedSeen = false;
  }
  end(){ this.D = null; this.g.visible = false; this.restKey = null; this.aim.count = 0; this.tool.visible = false; this.crack.material.opacity = 0; this.fallIm.count = 0; this.fall = null;
    for(const p of this.pops) this.g.remove(p.sp); this.pops.length = 0; }
  /* hors fouille : la paroi est entière, dans la roche de la couche ; elle attend la prochaine */
  rest(pal){
    const key = pal.join(","); if(this.restKey === key) return;
    this.restKey = key; this.D = null; this.g.visible = true; this.bg.visible = false; this.aim.count = 0; this.crack.material.opacity = 0; this.fallIm.count = 0;
    for(let i = 0; i < GW * GH; i++){
      const X = i % GW, Y = Math.floor(i / GW), h = ((i * 2654435761) >>> 0) % 997 / 997, l = 2 + Math.floor(h * 4), d = 0.1 + l * 0.065;
      this.cellPos(X, Y, V1); V1.z = this.z0 + d / 2;
      M4.compose(V1, Q0, S3.set(CELL * 0.985, CELL * 0.985, d)); this.cells.setMatrixAt(i, M4); this.cells.setColorAt(i, TC.set(pal[Math.min(2, Math.floor((l - 1) / 2))]));
    }
    this.Lc.fill(-1);
    this.cells.instanceMatrix.needsUpdate = true; if(this.cells.instanceColor) this.cells.instanceColor.needsUpdate = true;
  }
  paintBg(){
    const D = this.D, x = this.cv.getContext("2d"), c = 64, W = GW * c, H = GH * c;
    const ST = ref("STRATA"), st = ST[D.si];
    /* la roche nue, au fond : la couche, en plus sombre, grenue, avec ses joints */
    x.fillStyle = st.pal[2]; x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(20,12,6,.45)"; x.fillRect(0, 0, W, H);
    for(let i = 0; i < 1400; i++){ x.fillStyle = `rgba(${i % 3 ? "0,0,0" : "255,235,210"},${0.05 + (i % 5) * 0.02})`; x.fillRect((i * 97) % W, (i * 61) % H, 2 + i % 5, 2 + i % 3); }
    x.strokeStyle = "rgba(0,0,0,.28)"; x.lineWidth = 2;
    for(let i = 1; i < GW; i++){ x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, H); x.stroke(); }
    for(let i = 1; i < GH; i++){ x.beginPath(); x.moveTo(0, i * c); x.lineTo(W, i * c); x.stroke(); }
    let missing = false;
    for(const it of D.items) if(!this.drawItem(x, it, it.x * c, it.y * c, it.w * c, it.h * c)) missing = true;
    this.tex.needsUpdate = true;
    this.missing = missing;
  }
  /* un objet caché, dessiné à sa place (dans la roche) ou seul (quand il sort de la roche) ; faux s'il manque une image */
  drawItem(x, it, X, Y, w, h){
    const c = 64, D = this.D;
    const img = ref("digImg") ? ref("digImg")() : null, IDX = ref("ITEM_IDX"), COLS = ref("ITEMS_COLS"), LOOT = ref("DIG_LOOT");
    x.imageSmoothingEnabled = false;
    if(it.k === "ore"){
      const o = ref("oreDef")(it.ore);
      /* une pépite : une gemme à facettes */
      const cx = X + w / 2, cy = Y + h / 2, r = Math.min(w, h) * 0.3;
      x.fillStyle = o.pal[2]; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.fill();
      x.fillStyle = o.pal[1]; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.7, cy - r * 0.05); x.lineTo(cx, cy + r * 0.45); x.lineTo(cx - r * 0.7, cy - r * 0.05); x.fill();
      x.fillStyle = o.pal[0]; x.fillRect(cx - r * 0.3, cy - r * 0.55, r * 0.35, r * 0.25);
      return true;
    }
    if(it.k === "rod"){
      const cy = Math.round(Y + h * 0.5);
      x.fillStyle = "#4a2f18"; x.fillRect(X + 6, cy - 6, c * 1.3, 12); x.fillStyle = "#8a5a2e"; x.fillRect(X + 8, cy - 4, c * 1.3 - 4, 4);
      x.fillStyle = "#9aa6b8"; x.fillRect(X + c * 1.3, cy - 12, c * 0.6, c * 0.6); x.fillStyle = "#5d6878"; x.fillRect(X + c * 1.3 + 4, cy - 8, c * 0.6 - 8, c * 0.6 - 8);
      x.fillStyle = "#7a5230"; x.fillRect(X + c * 1.9, cy - 2, w - c * 1.9 - 8, 6); x.fillStyle = "#c9d4e2"; x.fillRect(X + w - 14, cy - 4, 6, 10);
      x.strokeStyle = "rgba(230,240,255,.8)"; x.lineWidth = 2; x.beginPath(); x.moveTo(X + w - 10, cy + 6); x.quadraticCurveTo(X + w - 28, Y + h - 4, X + c * 2.3, Y + h - 8); x.stroke();
      return true;
    }
    if(it.k === "page"){
      x.fillStyle = "#e8d9a8"; x.fillRect(X + 6, Y + 6, w - 12, h - 12); x.fillStyle = "#c9b27a"; x.fillRect(X + 6, Y + h - 14, w - 12, 8); x.fillStyle = "#7a6a48";
      for(let k = 0; k < 4; k++) x.fillRect(X + 16, Y + 16 + k * (h - 32) / 4, w - 32 - (k % 2) * 20, 4);
      return true;
    }
    if(it.k === "mon"){
      const sp = ref("brSprite") ? ref("brSprite")(it.mon, "n") : null;
      if(sp){ const sz = w * 1.05; x.drawImage(sp, X + w / 2 - sz / 2, Y + h / 2 - sz / 2, sz, sz); return true; }
      x.fillStyle = "#5c6a7e"; x.fillRect(X + 8, Y + 8, w - 16, h - 16); return false;
    }
    const def = LOOT && LOOT.find(l=>l.k === it.k);
    if(def && def.art && ref("digArtOf")){ ref("digArtDraw")(x, ref("digArtOf")(it.k, D ? D.si : 0), X + 4, Y + 4, w - 8, h - 8); return true; }
    const idx = IDX && def ? IDX[def.ic] : undefined;
    if(img && idx !== undefined){ const c0 = img.naturalWidth / COLS; x.drawImage(img, (idx % COLS) * c0, Math.floor(idx / COLS) * c0, c0, c0, X, Y, w, h); return true; }
    x.fillStyle = "#c9a86a"; x.fillRect(X + 6, Y + 6, w - 12, h - 12); return false;
  }
  paintCracks(){
    const x = this.crackCv.getContext("2d"), W = 768, H = 576;
    x.clearRect(0, 0, W, H); x.strokeStyle = "rgba(10,6,4,.9)"; x.lineCap = "round";
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for(let k = 0; k < 9; k++){
      let px = rnd() * W, py = k % 2 ? 0 : rnd() * H, a = rnd() * Math.PI * 2;
      x.lineWidth = 4 + rnd() * 3; x.beginPath(); x.moveTo(px, py);
      for(let s = 0; s < 14; s++){ a += (rnd() - 0.5) * 1.1; px += Math.cos(a) * 34; py += Math.sin(a) * 34; x.lineTo(px, py); x.lineWidth *= 0.92;
        if(rnd() < 0.25){ x.stroke(); x.beginPath(); x.moveTo(px, py); } }
      x.stroke();
    }
  }
  /* l'outil, dans sa matière (la pioche, le marteau) */
  buildTool(kind, tier){
    const key = kind + tier; if(this.toolKey === key) return; this.toolKey = key;
    while(this.tool.children.length) this.tool.remove(this.tool.children[0]);
    const TT = ref("TOOL_TIERS"), T = TT ? TT[tier] : null;
    if(T){ this.toolMats.head.color.set(T.pal[1]); this.toolMats.handle.color.set(T.handle ? T.handle[0] : T.pal[2]); this.toolMats.head.metalness = tier ? 0.7 : 0.05;
      this.toolMats.head.emissive.set(tier === 5 ? T.pal[1] : "#000000"); this.toolMats.head.emissiveIntensity = 0.5; }
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.3, 0.09), this.toolMats.handle); h.position.y = 0.55; this.tool.add(h);
    if(kind === "hammer"){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.32, 0.32), this.toolMats.head); p.position.y = 1.2; this.tool.add(p); }
    else { const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.11, 0.11), this.toolMats.head); p.position.y = 1.18; this.tool.add(p);
      for(const sd of [-1, 1]){ const t1 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 6).rotateZ(-sd * Math.PI / 2), this.toolMats.head); t1.position.set(sd * 0.55, 1.18, 0); this.tool.add(t1); } }
  }
  /* la case sous la souris */
  pick(ndcX, ndcY, cam){
    this.raycaster.setFromCamera({x:ndcX, y:ndcY}, cam);
    const hit = this.raycaster.ray.intersectPlane(this.plane, V1); if(!hit) return null;
    const lx = hit.x - this.C.x, ly = hit.y - this.C.y;
    const X = Math.floor(lx / CELL + GW / 2), Y = Math.floor(GH / 2 - ly / CELL);
    return X >= 0 && Y >= 0 && X < GW && Y < GH ? {X, Y} : null;
  }
  /* les cases que l'outil touchera, et combien de couches */
  pattern(tool){
    const t = ref("toolTier") ? ref("toolTier")(tool) : 0, out = [];
    const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    if(tool === "hammer"){ const T = ref("HAMMER_T")[t]; out.push([0, 0, T.c]); ORTH.forEach(([a, b])=>out.push([a, b, T.a])); DIAG.forEach(([a, b])=>out.push([a, b, T.d])); if(T.ring) [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([a, b])=>out.push([a, b, 1])); }
    else { const [c, a, d] = ref("PICK_T")[t]; out.push([0, 0, c]); ORTH.forEach(([p, q])=>out.push([p, q, a])); if(d) DIAG.forEach(([p, q])=>out.push([p, q, d])); }
    return out.filter(o=>o[2] > 0);
  }
  /* ---------- un coup ---------- */
  strike(X, Y, tool, t){
    const D = this.D; if(!D || D.over) return;
    const before = D.L.slice(), stab0 = D.stab;
    const digTap = ref("digTap"); if(!digTap) return;
    digTap(X, Y);
    const ST = ref("STRATA"), st = ST[D.si], iron = D.occ[Y * GW + X] === -2;
    /* les éclats : de chaque case entamée */
    for(let i = 0; i < D.L.length; i++) if(D.L[i] < before[i] && D.L[i] < 99){
      const cx = i % GW, cy = Math.floor(i / GW);
      this.cellPos(cx, cy, V1); V1.z = this.z0 + Math.max(0.1, before[i] * 0.075); V1.add(this.C);
      this.chips.burst(V1, 5 + (before[i] - D.L[i]) * 2, st.pal, 2.6, 0.08, 0.6, new THREE.Vector3(0, 0, 1));
    }
    if(iron){ this.cellPos(X, Y, V1); V1.z = this.z0 + 0.5; V1.add(this.C); this.chips.burst(V1, 10, ["#e8eef8", "#ffffff", "#9aa6b8"], 3.5, 0.04, 0.8, new THREE.Vector3(0, 0, 1)); }
    this.swing = {X, Y, t, tool};
    this.shake = Math.max(this.shake, tool === "hammer" ? 0.14 : 0.07) + (stab0 - D.stab) * 0.01;
  }
  /* ---------- à chaque image ---------- */
  update(t, dt, cam, mouse, tool, calm){
    const D = this.D; if(!D) return;
    /* les images (objets, Pokémon) arrivent parfois après : on repeint une fois chargées */
    if(this.missing && performance.now() - this.paintT > 600){ this.paintT = performance.now(); this.paintBg(); }
    const ST = ref("STRATA"), st = ST[D.si];
    /* les blocs */
    let dirty = false;
    for(let i = 0; i < GW * GH; i++){
      const l = D.L[i]; if(l === this.Lc[i]) continue;
      this.Lc[i] = l; dirty = true;
      const X = i % GW, Y = Math.floor(i / GW);
      if(l <= 0){ this.cells.setMatrixAt(i, M4.makeScale(0, 0, 0)); continue; }
      const iron = l >= 99, d = iron ? 0.5 : 0.1 + l * 0.065;
      this.cellPos(X, Y, V1); V1.z = this.z0 + d / 2;
      M4.compose(V1, Q0, S3.set(CELL * 0.985, CELL * 0.985, d)); this.cells.setMatrixAt(i, M4);
      this.cells.setColorAt(i, iron ? TC.set("#8c98a8") : TC.set(st.pal[Math.min(2, Math.floor((l - 1) / 2))]));
    }
    if(dirty){ this.cells.instanceMatrix.needsUpdate = true; if(this.cells.instanceColor) this.cells.instanceColor.needsUpdate = true; }
    /* la visée */
    this.hover = !D.over && mouse ? this.pick(mouse.x, mouse.y, cam) : null;
    if(this.hover){
      const pat = this.pattern(tool); let n = 0;
      const col = tool === "hammer" ? "#ffb347" : "#7af0ff";
      for(const [a, b, k] of pat){
        const X = this.hover.X + a, Y = this.hover.Y + b; if(X < 0 || Y < 0 || X >= GW || Y >= GH) continue;
        const l = D.L[Y * GW + X], d = l >= 99 ? 0.5 : l > 0 ? 0.1 + l * 0.065 : 0;
        this.cellPos(X, Y, V1); V1.z = this.z0 + d + 0.01;
        M4.compose(V1, Q0, S3.setScalar(a === 0 && b === 0 ? 1 : 0.86)); this.aim.setMatrixAt(n, M4);
        this.aim.setColorAt(n, TC.set(col).multiplyScalar(0.55 + 0.15 * k * (0.75 + 0.25 * Math.sin(t * 8))));
        n++;
      }
      this.aim.count = n; this.aim.instanceMatrix.needsUpdate = true; if(this.aim.instanceColor) this.aim.instanceColor.needsUpdate = true;
    } else this.aim.count = 0;
    /* l'outil qui s'abat */
    const tt = ref("toolTier") ? ref("toolTier")(tool) : 0; this.buildTool(this.swing ? this.swing.tool : tool, this.swing ? (ref("toolTier")(this.swing.tool)) : tt);
    if(this.swing){
      const k = (t - this.swing.t) / 0.24;
      if(k >= 1){ this.swing = null; this.tool.visible = false; }
      else {
        this.tool.visible = true; this.cellPos(this.swing.X, this.swing.Y, V1);
        this.tool.position.set(V1.x + 0.75, V1.y - 0.9, 0.9);
        const a = k < 0.45 ? -0.2 + (k / 0.45) * 1.25 : 1.05 - (k - 0.45) * 0.6;
        this.tool.rotation.set(0, 0, a);
      }
    }
    /* les fissures, la secousse */
    const s = D.stab / D.max;
    this.crack.material.opacity = Math.min(0.9, Math.max(0, (0.8 - s) / 0.8) * 1.1);
    this.shake = Math.max(0, this.shake - dt * 0.6);
    /* un objet dégagé : il s'illumine, sort de la roche vers soi */
    for(const it of D.items){
      if(!it.found || this.found.has(it)) continue;
      this.found.add(it);
      if(it.small){ this.cellPos(it.x, it.y, V1); V1.z = this.z0 + 0.2; V1.add(this.C); const o = ref("oreDef")(it.ore); this.chips.burst(V1, 12, o ? o.pal : ["#ffd166"], 2.2, 0.05, 1.2, new THREE.Vector3(0, 0, 1)); continue; }
      const icv = document.createElement("canvas"); icv.width = it.w * 64; icv.height = it.h * 64;
      this.drawItem(icv.getContext("2d"), it, 0, 0, icv.width, icv.height);
      const tex = new THREE.CanvasTexture(icv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
      const big = Math.max(it.w, it.h) * CELL, k0 = big > 2.2 ? 2.2 / big : 1;
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(it.w * CELL * k0, it.h * CELL * k0), new THREE.MeshBasicMaterial({map:tex, transparent:true, toneMapped:false, depthTest:false}));
      sp.renderOrder = 9;
      const cx = (it.x + it.w / 2 - GW / 2) * CELL, cy = (GH / 2 - it.y - it.h / 2) * CELL;
      sp.position.set(cx, cy, this.z0 + 0.02); this.g.add(sp);
      const hs = Math.max(it.w, it.h) * CELL * k0 * 1.6;
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(hs, hs), new THREE.MeshBasicMaterial({map:glowTex(), color:"#ffd166", transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false, toneMapped:false}));
      halo.renderOrder = 8; sp.add(halo); halo.position.z = -0.01;
      this.pops.push({sp, halo, t, x0:cx, y0:cy});
      V1.set(cx, cy, 0.4).add(this.C);
      if(!calm) this.chips.burst(V1, 28, ["#ffd84a", "#ffffff", "#fff2b0"], 3, 0.05, 1.2, new THREE.Vector3(0, 0, 1));
    }
    for(let i = this.pops.length - 1; i >= 0; i--){
      const p = this.pops[i], k = (t - p.t) / 2.2;
      if(k >= 1){ this.g.remove(p.sp); p.sp.material.map.dispose(); p.sp.material.dispose(); p.halo.material.dispose(); this.pops.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - Math.min(1, k * 1.8), 3);
      p.sp.position.set(p.x0 * (1 - e * 0.6), p.y0 * (1 - e * 0.5) + e * 0.6, this.z0 + 0.02 + e * 2.6);
      p.sp.scale.setScalar(1 + e * 0.5 + Math.sin(t * 6) * 0.03 * e);
      p.sp.rotation.y = Math.sin(t * 3 + i) * 0.15 * e;
      p.sp.material.opacity = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25; p.halo.material.opacity = (0.9 - k * 0.6) * p.sp.material.opacity;
    }
    /* l'effondrement : la roche tombe du haut du cadre, la poussière monte */
    if(D.collapsed && !this.collapsedSeen){
      this.collapsedSeen = true; this.fall = {t, rocks:Array.from({length:48}, (_, i)=>({x:(Math.random() - 0.5) * GW * CELL, y:GH * CELL * 0.5 + 0.5 + Math.random() * 3, z:0.4 + Math.random() * 0.8, v:0, r:Math.random() * 6, s:0.25 + Math.random() * 0.45, d:i * 0.012}))};
      this.shake = 0.45;
    }
    if(this.fall){
      const F = this.fall; let n = 0;
      for(const r of F.rocks){
        if(t - F.t < r.d) continue;
        r.v -= 12 * dt; r.y += r.v * dt; r.r += dt * 3;
        const floor = -GH * CELL * 0.5 + r.s * 0.4 + (n % 6) * 0.12;
        if(r.y < floor){ r.y = floor; if(r.v < -3 && !calm) this.chips.burst(V1.set(r.x, r.y, r.z).add(this.C), 3, st.pal, 1.5, 0.06, 0.8); r.v *= -0.2; }
        M4.compose(V1.set(r.x, r.y, r.z), Q0.setFromEuler(new THREE.Euler(r.r, r.r * 0.6, 0)), S3.setScalar(r.s)); this.fallIm.setMatrixAt(n, M4); this.fallIm.setColorAt(n, TC.set(st.pal[n % 3])); n++;
      }
      this.fallIm.count = n; this.fallIm.instanceMatrix.needsUpdate = true; if(this.fallIm.instanceColor) this.fallIm.instanceColor.needsUpdate = true;
    }
  }
}
let _glow = null;
function glowTex(){
  if(_glow) return _glow;
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d");
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return (_glow = new THREE.CanvasTexture(cv));
}
