/* ============================================================
   LA BRÈCHE EN 3D · CE QUI SE LIT À L'ÉCRAN
   L'interface du jeu mobile (vie, expérience, frise, équipe, objets,
   sous-titres, choix de niveau, coffres) reste la même, posée sur la
   scène et mise à l'échelle d'un écran d'ordinateur. Par-dessus, une
   toile dessine ce que la troisième personne demande :
     · le réticule (et la recharge de l'esquive autour) ;
     · des chevrons rouges au bord de l'écran pour ce qui arrive dans
       le dos — avec une vue de dos, la horde vient aussi de derrière ;
     · un radar (horde, élites, gardien, lieux, arène) ;
     · les chiffres de dégâts, les barres de vie des élites ;
     · les annonces, les bandes noires et la carte de nom des gardiens
       (dessinées par le jeu mobile), le compte à rebours de l'ultime.
   ============================================================ */
import * as THREE from "three";
import { S, ref, col } from "./lib.js";

const V = new THREE.Vector3();
const POI_USE = {cache:1, autel:1, captif:1, souche:1, cristal:1};

export class BrHud {
  constructor(){
    this.cv = document.createElement("canvas"); this.cv.id = "pc-br-ov";
    document.body.appendChild(this.cv);
    this.x = this.cv.getContext("2d");
    this.tip = 0;
  }
  show(on){ this.cv.classList.toggle("on", on); if(!on) this.x.clearRect(0, 0, this.cv.width, this.cv.height); }
  fit(){
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    if(this.cv.width !== Math.round(w * dpr) || this.cv.height !== Math.round(h * dpr)){ this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr); }
    this.dpr = dpr; this.W = w; this.H = h;
  }
  proj(cam, x, y, z){
    V.set(x, y, z).project(cam);
    return {x:(V.x * 0.5 + 0.5) * this.W, y:(-V.y * 0.5 + 0.5) * this.H, ok:V.z < 1 && V.z > -1};
  }
  draw(R, c){
    this.fit();
    const x = this.x, W = this.W, H = this.H, cam = c.cam, t = c.t;
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.clearRect(0, 0, W, H);
    /* touché : le rouge monte des bords ; peu de vie : il bat */
    const low = R.hp / R.maxHp < 0.3;
    if(R.hurt > 0 || low){
      const a = R.hurt > 0 ? Math.min(0.6, R.hurt * 2) : 0.18 + Math.sin(t * 5) * 0.08;
      const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
      g.addColorStop(0, "rgba(255,30,80,0)"); g.addColorStop(1, `rgba(255,30,80,${a})`);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    if(R.ult){ x.fillStyle = `rgba(255,30,70,${0.08 + (1 - R.ult.t / R.ult.max) * 0.18 + Math.sin(t * 18) * 0.04})`; x.fillRect(0, 0, W, H); }
    if(c.dp) this.depth(R, c, c.dp);
    this.numbers(R, c);
    this.bars(R, c);
    this.edges(R, c);
    this.radar(R, c);
    if(!c.cine) this.reticle(R, c);
    this.banner(R, c);
    this.cine(R, c);
    if(R.ult){
      x.save(); x.textAlign = "center"; x.font = "800 64px 'Pixelify Sans',ui-monospace,monospace"; x.fillStyle = "#fff"; x.shadowColor = "#ff3d7f"; x.shadowBlur = 24;
      x.fillText(Math.max(0, R.ult.t).toFixed(1), W / 2, H * 0.36); x.shadowBlur = 0;
      x.font = "600 18px 'Pixelify Sans',ui-monospace,monospace"; x.fillStyle = "#5ce07a"; x.fillText("Rejoins un cercle vert", W / 2, H * 0.36 + 34); x.restore();
    }
    /* la consigne des premières secondes */
    if(c.tipT > 0){
      const a = Math.min(1, c.tipT);
      x.save(); x.globalAlpha = a; x.textAlign = "center"; x.font = "600 17px 'Pixelify Sans',ui-monospace,monospace";
      const msg = "ZQSD bouger  ·  souris viser  ·  Espace esquiver  ·  Échap pause", w = x.measureText(msg).width + 36;
      x.fillStyle = "rgba(6,4,14,.72)"; x.fillRect(W / 2 - w / 2, H * 0.74 - 22, w, 36);
      x.fillStyle = "#e8f6ff"; x.fillText(msg, W / 2, H * 0.74 + 2); x.restore();
    }
  }
  /* ---------- le réticule et l'esquive ---------- */
  reticle(R, c){
    const x = this.x, cx = this.W / 2, cy = this.H / 2, on = c.aimFoe;
    x.save();
    x.strokeStyle = on ? "#ff5c8a" : "rgba(232,246,255,.85)"; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, on ? 9 : 11, 0, Math.PI * 2); x.stroke();
    x.fillStyle = x.strokeStyle; x.fillRect(cx - 1.5, cy - 1.5, 3, 3);
    if(on){ for(let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + Math.PI / 4; x.beginPath(); x.moveTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13); x.lineTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19); x.stroke(); } }
    /* l'esquive : l'anneau se remplit pendant la recharge */
    const cd = Math.max(0, R.dodgeCd || 0), max = 1.4;
    x.lineWidth = 3;
    if(cd > 0){ x.strokeStyle = "rgba(143,236,255,.35)"; x.beginPath(); x.arc(cx, cy, 24, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = "#8fecff"; x.beginPath(); x.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + (1 - cd / max) * Math.PI * 2); x.stroke(); }
    /* marqué par le chasseur : une mire rouge tourne autour du réticule */
    if(c.dp && c.dp.marked){
      x.strokeStyle = "rgba(255,61,79,.85)"; x.lineWidth = 2; x.setLineDash([6, 7]); x.lineDashOffset = -c.t * 30;
      x.beginPath(); x.arc(cx, cy, 33, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    }
    x.restore();
  }
  /* ---------- la faille profonde : le palier franchi, la frénésie, le chasseur ---------- */
  depth(R, c, dp){
    const x = this.x, W = this.W, H = this.H, t = c.t;
    /* un palier : l'image saute, en bandes cyan et magenta */
    if(dp.flash > 0){
      x.save(); x.globalCompositeOperation = "lighter";
      const n = 7 + Math.floor(dp.flash * 8);
      for(let i = 0; i < n; i++){
        const y = ((Math.sin(i * 91.7 + Math.floor(t * 24) * 13.1) * 0.5 + 0.5)) * H, h = 3 + ((i * 37) % 23) * dp.flash;
        x.fillStyle = i % 2 ? `rgba(53,240,214,${0.22 * dp.flash})` : `rgba(255,61,127,${0.22 * dp.flash})`;
        x.fillRect(0, y, W, h);
      }
      x.restore();
      x.fillStyle = `rgba(4,0,10,${Math.max(0, dp.flash - 0.6) * 1.2})`; x.fillRect(0, 0, W, H);
    }
    /* Frénésie : des traits de vitesse aux bords */
    if(dp.frenzy > 0.02){
      x.save(); x.strokeStyle = `rgba(255,228,94,${0.28 * dp.frenzy})`; x.lineWidth = 2;
      const cx = W / 2, cy = H / 2, R0 = Math.min(W, H) * 0.42, k = Math.floor(t * 30);
      for(let i = 0; i < 26; i++){
        const r = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453, u = r - Math.floor(r); if(u < 0.35) continue;
        const a = i / 26 * Math.PI * 2 + u * 0.2, r0 = R0 * (1.05 + u * 0.25), r1 = r0 + 40 + u * 90;
        x.beginPath(); x.moveTo(cx + Math.cos(a) * r0 * W / H * 0.75, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a) * r1 * W / H * 0.75, cy + Math.sin(a) * r1); x.stroke();
      }
      x.restore();
    }
    /* le chasseur : son nom au-dessus de lui */
    const f = dp.hunter;
    if(f && f.on && f.hp > 0){
      const p = this.proj(c.cam, f.x * S, c.heightOf(f) * 1.35 + 1.0, f.y * S);
      if(p.ok){ x.save(); x.textAlign = "center"; x.font = "700 14px 'Pixelify Sans',ui-monospace,monospace";
        x.fillStyle = "#000"; x.fillText("◎ CHASSEUR", p.x + 1, p.y + 1); x.fillStyle = "#ff3d4f"; x.fillText("◎ CHASSEUR", p.x, p.y); x.restore(); }
    }
  }
  /* ---------- les chiffres ---------- */
  numbers(R, c){
    const x = this.x;
    x.save(); x.textAlign = "center";
    R.P.texts.each(tx=>{
      const k = Math.max(0, tx.life) / (tx.max || 0.7), p = this.proj(c.cam, tx.x * S, 1.6 + (1 - k) * 0.8, tx.y * S);
      if(!p.ok || p.x < -50 || p.x > this.W + 50) return;
      const sz = Math.round((tx.size || 11) * 1.45);
      x.globalAlpha = Math.min(1, k * 2.2);
      x.font = `800 ${sz}px 'Pixelify Sans',ui-monospace,monospace`;
      x.fillStyle = "#000"; x.fillText(tx.txt, p.x + 1.5, p.y + 1.5);
      x.fillStyle = tx.color || "#fff"; x.fillText(tx.txt, p.x, p.y);
    });
    x.restore();
  }
  /* ---------- les barres de vie des élites et des gros ---------- */
  bars(R, c){
    const x = this.x;
    R.P.foes.each(f=>{
      if(!(f.elite || f.big || f.kind === "pylon" || f.kind === "nest") || f.boss || f.hp >= f.max || f.hp <= 0) return;
      const h = c.heightOf(f), p = this.proj(c.cam, f.x * S, h * 1.18 + 0.2, f.y * S);
      if(!p.ok) return;
      const w = 54;
      x.fillStyle = "rgba(0,0,0,.65)"; x.fillRect(p.x - w / 2 - 1, p.y - 1, w + 2, 6);
      x.fillStyle = "#ff3d7f"; x.fillRect(p.x - w / 2, p.y, w * Math.max(0, f.hp) / f.max, 4);
    });
  }
  /* ---------- ce qui arrive hors champ : chevrons au bord, flèches vers les lieux ---------- */
  edges(R, c){
    const x = this.x, W = this.W, H = this.H, cx = W / 2, cy = H / 2, yaw = c.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const near = [];
    R.P.foes.each(f=>{
      if(f.hp <= 0 || f.kind === "pylon") return;
      const dx = (f.x - R.x) * S, dz = (f.y - R.y) * S, d = Math.hypot(dx, dz);
      const big = f.elite || f.boss || f.reaper;
      if(d > (big ? 40 : 8)) return;
      const fwd = dx * fx + dz * fz, side = dx * rx + dz * rz;
      if(fwd > 2.5 && Math.abs(side) < fwd * 0.9 && !big) return;               /* devant, on le voit */
      near.push({a:Math.atan2(side, fwd), d, big, boss:f.boss});
    });
    near.sort((a, b)=>a.d - b.d);
    const rad = Math.min(W, H) * 0.42;
    for(const n of near.slice(0, 14)){
      const a = n.a, px = cx + Math.sin(a) * rad * 1.15, py = cy - Math.cos(a) * rad;
      const close = 1 - Math.min(1, n.d / (n.big ? 40 : 8));
      x.save(); x.translate(Math.max(28, Math.min(W - 28, px)), Math.max(28, Math.min(H - 28, py))); x.rotate(a);
      x.globalAlpha = 0.35 + close * 0.6; x.fillStyle = n.boss ? "#ff3d7f" : n.big ? "#ffb35c" : "#ff4a5a";
      const s = n.big ? 15 : 10 + close * 6;
      x.beginPath(); x.moveTo(0, -s); x.lineTo(s * 0.9, s * 0.4); x.lineTo(0, 0); x.lineTo(-s * 0.9, s * 0.4); x.closePath(); x.fill();
      x.restore();
    }
    /* les lieux utiles les plus proches */
    const pois = [];
    for(const p of R.map.near.pois){ if(!POI_USE[p.k] || p.used) continue; const dx = (p.x - R.x) * S, dz = (p.y - R.y) * S, d = Math.hypot(dx, dz); if(d < 4) continue; pois.push({p, dx, dz, d}); }
    pois.sort((a, b)=>a.d - b.d);
    const PO = ref("BR_POI") || {};
    for(const o of pois.slice(0, 4)){
      const P = PO[o.p.k] || {c:"#fff", g:"?"};
      const pr = this.proj(c.cam, o.p.x * S, 2.2, o.p.y * S);
      const on = pr.ok && pr.x > 40 && pr.x < W - 40 && pr.y > 60 && pr.y < H - 60;
      let px, py;
      if(on){ px = pr.x; py = pr.y; }
      else { const a = Math.atan2(o.dx * rx + o.dz * rz, o.dx * fx + o.dz * fz); px = Math.max(40, Math.min(W - 40, cx + Math.sin(a) * W * 0.45)); py = Math.max(70, Math.min(H - 90, cy - Math.cos(a) * H * 0.42)); }
      x.save(); x.globalAlpha = 0.9; x.textAlign = "center";
      x.fillStyle = "rgba(6,4,14,.7)"; x.beginPath(); x.arc(px, py, 15, 0, Math.PI * 2); x.fill();
      x.strokeStyle = P.c; x.lineWidth = 2; x.stroke();
      x.fillStyle = P.c; x.font = "700 15px ui-monospace,monospace"; x.textBaseline = "middle"; x.fillText(P.g, px, py + 1);
      x.font = "600 11px 'Pixelify Sans',ui-monospace,monospace"; x.fillStyle = "#e8f6ff"; x.fillText(Math.round(o.d) + " m", px, py + 26);
      x.restore();
    }
  }
  /* ---------- le radar : le monde autour, tourné comme la caméra ---------- */
  radar(R, c){
    const x = this.x, Rr = 78, cx = this.W - Rr - 22, cy = this.H - Rr - 22, scale = Rr / 34;
    const yaw = c.yaw, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (wx, wz) => { const dx = (wx - R.x) * S, dz = (wz - R.y) * S; const sx = dx * cs - dz * sn, sz = dx * sn + dz * cs; return [cx + sx * scale, cy + sz * scale]; };
    x.save();
    x.fillStyle = "rgba(6,4,14,.62)"; x.beginPath(); x.arc(cx, cy, Rr, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(53,240,214,.5)"; x.lineWidth = 1.5; x.stroke();
    x.beginPath(); x.arc(cx, cy, Rr, 0, Math.PI * 2); x.clip();
    x.strokeStyle = "rgba(53,240,214,.12)"; x.beginPath(); x.arc(cx, cy, Rr * 0.5, 0, Math.PI * 2); x.stroke();
    if(R.arena){ const [ax, ay] = P(R.arena.x, R.arena.y); x.strokeStyle = "#ff3d7f"; x.lineWidth = 2; x.beginPath(); x.arc(ax, ay, R.arena.r * S * scale, 0, Math.PI * 2); x.stroke(); }
    const PO = ref("BR_POI") || {};
    for(const p of R.map.near.pois){ if(p.used && p.k !== "arbre") continue; const [px, py] = P(p.x, p.y); x.fillStyle = (PO[p.k] || {}).c || "#fff"; x.fillRect(px - 3, py - 3, 6, 6); }
    if(R.mines){ x.fillStyle = "#ff3d7f"; for(const m of R.mines){ if(m.gone) continue; const [px, py] = P(m.x, m.y); x.fillRect(px - 1.5, py - 1.5, 3, 3); } }
    R.P.foes.each(f=>{
      if(f.hp <= 0) return; const [px, py] = P(f.x, f.y);
      if(f.gold){ x.fillStyle = "#ffd24a"; x.beginPath(); x.arc(px, py, 3.2, 0, Math.PI * 2); x.fill(); }
      else if(f.hunter){ x.fillStyle = "#ff3d4f"; x.beginPath(); x.arc(px, py, 4, 0, Math.PI * 2); x.fill(); }
      else if(f.boss){ x.fillStyle = "#ff3d7f"; x.beginPath(); x.arc(px, py, 5, 0, Math.PI * 2); x.fill(); }
      else if(f.elite || f.big){ x.fillStyle = "#ffb35c"; x.fillRect(px - 2.5, py - 2.5, 5, 5); }
      else { x.fillStyle = "rgba(255,90,140,.85)"; x.fillRect(px - 1, py - 1, 2.2, 2.2); }
    });
    x.restore();
    /* soi, et le champ de vision */
    x.save(); x.translate(cx, cy);
    x.fillStyle = "rgba(53,240,214,.14)"; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, Rr, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); x.closePath(); x.fill();
    x.fillStyle = "#35f0d6"; x.beginPath(); x.moveTo(0, -7); x.lineTo(5, 5); x.lineTo(0, 2); x.lineTo(-5, 5); x.closePath(); x.fill();
    x.restore();
  }
  /* ---------- l'annonce ---------- */
  banner(R, c){
    const b = R.banner; if(!b) return;
    const x = this.x, W = this.W, H = this.H, k = b.life / b.max, a = Math.min(1, k * 3, (1 - k) * 6);
    x.save(); x.globalAlpha = Math.max(0, a); x.textAlign = "center";
    const y = H * 0.26;
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(6,2,12,0)"); g.addColorStop(0.5, "rgba(6,2,12,.78)"); g.addColorStop(1, "rgba(6,2,12,0)");
    x.fillStyle = g; x.fillRect(0, y - 40, W, b.sub ? 84 : 64);
    x.font = "800 34px 'Pixelify Sans',ui-monospace,monospace";
    x.fillStyle = "rgba(255,61,127,.8)"; x.fillText(b.text, W / 2 - 2, y + 2); x.fillStyle = "rgba(53,240,214,.8)"; x.fillText(b.text, W / 2 + 2, y + 2);
    x.fillStyle = b.color || "#fff"; x.fillText(b.text, W / 2, y + 2);
    if(b.sub){ x.font = "600 16px 'Pixelify Sans',ui-monospace,monospace"; x.fillStyle = "#fff"; x.fillText(b.sub, W / 2, y + 30); }
    x.restore();
  }
  /* ---------- bandes noires, alerte, carte de nom : le dessin du jeu mobile, à la taille de l'écran ---------- */
  cine(R, c){
    const dc = ref("brDrawCine"); if(!dc) return;
    if(!R.cine && !(R.finaleT > 0) && !R.mini) return;
    const W0 = R.W, H0 = R.H; R.W = this.W; R.H = this.H;
    try { this.x.save(); dc(this.x, R); } catch(e){} finally { this.x.restore(); R.W = W0; R.H = H0; }
  }
}
