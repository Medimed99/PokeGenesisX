/* ============================================================
   LA CARTE DE LA ZONE DE CAPTURE
   Une mini-carte ronde en haut à gauche (le nord en haut, ta flèche au
   centre), et la grande carte sur M : le chemin, les hautes herbes, le lac,
   les corniches, les arbres, les zones désindexées encore actives (avec
   le seuil d'intégrité qui les guérit), les deux sentinelles, le dresseur
   du jour, et les Pokémon débusqués autour de toi.
   Le fond est peint une fois, à partir du relevé du terrain.
   ============================================================ */
import { BOUNDS, GRID, W, D, DPATH, GRASS, LAKEM, PATH_W, LEDGES, pathX, LAKE, HGT, BIDX, BWT, TRAIL, LAVA, BIOMES, LOCKS, terrace } from "../world/layout.js";
import { HAB_NAMES } from "../world/biomes/index.js";
import { SITES } from "../world/sites.js";
import { ZONES } from "../world/corruption.js";

const X0 = -276, X1 = 276, Z0 = -408, Z1 = 222, PPM = 2;     /* pixels par mètre du fond : la zone et ses cinq biomes */
const BIO_C = {foret:[[24, 46, 30], [58, 48, 34]], eaux:[[150, 160, 152], [78, 190, 186]], grotte:[[36, 30, 46], [110, 80, 150]], ruines:[[96, 88, 56], [138, 128, 112]], foyer:[[30, 26, 26], [240, 110, 30]]};
const MINI = 168, RANGE = 46;                                 /* diamètre de la mini-carte, mètres du centre au bord */
const C = {void:[6, 9, 15], lawn:[30, 44, 36], tall:[46, 74, 46], path:[96, 84, 66], sand:[88, 86, 78], water:[16, 54, 66], waterDeep:[9, 32, 44]};
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));

export class RouteMap {
  constructor(game){
    this.game = game; this.open = false;
    this.bg = this.paintBackground();
    /* la mini-carte */
    this.mini = document.createElement("canvas"); this.mini.id = "pc-minimap";
    this.mini.width = this.mini.height = MINI * 2;
    document.body.appendChild(this.mini);
    /* la grande carte */
    this.big = document.createElement("div"); this.big.id = "pc-map";
    this.big.innerHTML = `<div class="pm-in"><canvas></canvas><div class="pm-side">
      <h3>La zone de capture</h3><p>Routes ouvertes au centre, de Bourg Palette à Jadielle ; cinq biomes autour, chacun derrière son col.</p>
      <ul class="pm-legend">
        <li><i class="lg-lock"></i>Col fermé : il s'ouvre avec le Pokédex</li>
        <li><i class="lg-site"></i>Un module : la Tour, la Brèche, le camp… (E pour y entrer)</li>
        <li><i class="lg-tall"></i>Hautes herbes : les Pokémon s'y cachent</li>
        <li><i class="lg-water"></i>Le lac : la canne (F) sur la rive</li>
        <li><i class="lg-zone"></i>Zone désindexée : elle guérit quand l'intégrité monte</li>
        <li><i class="lg-ledge"></i>Corniche : on la saute vers le sud</li>
        <li><i class="lg-leg"></i>Sentinelle légendaire</li>
        <li><i class="lg-npc"></i>Le dresseur du jour</li>
        <li><i class="lg-mon"></i>Pokémon débusqué</li>
      </ul><div class="pm-zones"></div><p class="pm-key"><kbd>M</kbd> refermer la carte</p></div></div>`;
    document.body.appendChild(this.big);
    this.bigCv = this.big.querySelector("canvas");
    this.t = 0;
  }
  /* ---------- le fond : relevé du terrain, peint une fois ---------- */
  paintBackground(){
    const w = (X1 - X0) * PPM, h = (Z1 - Z0) * PPM;
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d"), img = g.createImageData(w, h), px = img.data;
    const at = (arr, x, z) => {
      const i = Math.max(0, Math.min(W - 1, Math.round((x - GRID.x0) / GRID.step))), j = Math.max(0, Math.min(D - 1, Math.round((z - GRID.z0) / GRID.step)));
      return arr[j * W + i];
    };
    const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    for(let py = 0; py < h; py++){
      const z = Z0 + (py + 0.5) / PPM;
      for(let qx = 0; qx < w; qx++){
        const x = X0 + (qx + 0.5) / PPM, o = (py * w + qx) * 4;
        let c;
        const out = x < BOUNDS.x0 - 4 || x > BOUNDS.x1 + 4 || z < BOUNDS.z0 - 4 || z > BOUNDS.z1 + 4;
        const bi = at(BIDX, x, z), bw = at(BWT, x, z);
        if(bi && bw > 0.45){
          /* un biome : sa couleur, son sentier, ses vasques, sa lave */
          const B = BIOMES[bi - 1], P = BIO_C[B.k];
          c = mix(C.void, P[0], Math.min(1, (bw - 0.45) * 3));
          if(at(TRAIL, x, z) < 0.6) c = mix(c, P[1], 0.6);
          if(B.k === "eaux"){ const T = terrace(x, z); if(T.level - at(HGT, x, z) > 0.05) c = mix(c, P[1], 0.85); }
          if(B.k === "foyer" && at(LAVA, x, z) > 0.3) c = P[1];
          if(B.k === "grotte" && ((qx * 7 + py * 13) % 97) === 0) c = P[1];
          if(B.k !== "eaux" && at(GRASS, x, z) > 0.4) c = mix(c, [60, 84, 50], 0.5);
        } else if(out){
          /* les crêtes : le vide, quadrillé, un peu de relief */
          const grid = (Math.abs(((x % 8) + 8) % 8) < 0.5 || Math.abs(((z % 8) + 8) % 8) < 0.5) ? 1 : 0;
          c = mix(C.void, [20, 60, 70], grid * 0.25);
          c = mix(c, [26, 30, 38], Math.min(1, Math.max(0, at(HGT, x, z) - 10) / 40));
        } else {
          const lm = at(LAKEM, x, z), dp = at(DPATH, x, z), gr = at(GRASS, x, z);
          c = C.lawn;
          if(gr > 0.25) c = mix(C.lawn, C.tall, Math.min(1, (gr - 0.25) * 2));
          if(dp < PATH_W + 0.6) c = mix(c, C.path, Math.min(1, (PATH_W + 0.6 - dp) / 1.2));
          if(lm > 0.2) c = mix(c, C.sand, Math.min(1, (lm - 0.2) * 3));
          if(lm > 0.55) c = mix(C.water, C.waterDeep, Math.min(1, (lm - 0.55) * 2.2));
          const edge = Math.min(x - BOUNDS.x0, BOUNDS.x1 - x, z - BOUNDS.z0, BOUNDS.z1 - z);
          if(edge < 4 && !(bi && bw > 0.2)) c = mix(c, C.void, (4 - edge) / 4 * 0.7);
        }
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    /* les arbres et buissons : des taches sombres */
    const T = this.game.world.trees ? this.game.world.trees.colliders : [];
    g.fillStyle = "rgba(8,16,12,0.85)";
    for(const t of T){ g.beginPath(); g.arc((t.x - X0) * PPM, (t.z - Z0) * PPM, Math.max(1.6, t.r * 2.2) * PPM * 0.6, 0, Math.PI * 2); g.fill(); }
    /* les corniches : un trait, et des dents vers le sud (le côté où l'on saute) */
    g.strokeStyle = "rgba(200,190,160,0.75)"; g.lineWidth = 2;
    for(const L of LEDGES){
      const y = (L.z - Z0) * PPM, px0 = pathX(L.z);
      for(const [a, b] of [[BOUNDS.x0, px0 - 6.2], [px0 + 6.2, BOUNDS.x1]]){
        g.beginPath(); g.moveTo((a - X0) * PPM, y); g.lineTo((b - X0) * PPM, y); g.stroke();
        for(let x = a; x < b; x += 3){ g.beginPath(); g.moveTo((x - X0) * PPM, y); g.lineTo((x + 0.8 - X0) * PPM, y + 4); g.stroke(); }
      }
    }
    return cv;
  }
  toggle(){
    this.open = !this.open;
    this.big.classList.toggle("on", this.open);
    if(this.open) this.drawBig();
  }
  /* ---------- ce qui bouge : zones, sentinelles, dresseur, Pokémon, toi ---------- */
  markers(){
    const g = this.game, out = [];
    const CZ = g.world.corruption;
    if(CZ) ZONES.forEach((z, i)=>{ const s = CZ.uniforms.uZones.value[i].w; if(s > 0.01) out.push({k:"zone", x:z.x, z:z.z, r:z.r * s, heal:z.heal}); });
    if(g.sentinels) for(const s of g.sentinels.list) if(s.state !== "gone") out.push({k:"leg", x:s.pos.x, z:s.pos.z, n:s.d.id === 150 ? "Mewtwo" : "Électhor"});
    if(g.trainer && g.trainer.present && g.trainer.present()) out.push({k:"npc", x:g.trainer.pos.x, z:g.trainer.pos.z, n:"Dresseur"});
    /* les lieux des modules (la Tour, la Brèche, le camp de l'Expédition…) */
    const W = g.world && g.world.sites;
    if(W) for(const s of SITES) out.push({k:"site", x:s.x, z:s.z, n:s.n, c:s.col, off:!!W.lock[s.k]});
    const P = g.player.pos;
    for(const e of g.wild.list){
      if(e.state === "hidden" || e.state === "gone" || e.state === "fled" || e.state === "caught" || e.state === "held") continue;
      if(Math.hypot(e.pos.x - P.x, e.pos.z - P.z) > 40) continue;
      out.push({k:"mon", x:e.pos.x, z:e.pos.z, missing:!!e.spec.missing});
    }
    return out;
  }
  drawMarkers(c, tx, ty, s, big){
    const t = this.t;
    for(const m of this.markers()){
      const x = tx(m.x), y = ty(m.z);
      if(m.k === "zone"){
        /* une tache de pixels magenta et cyan qui grésille */
        const R = Math.max(3, m.r * s), cell = Math.max(2, Math.round(R / 4));
        for(let yy = -R; yy <= R; yy += cell) for(let xx = -R; xx <= R; xx += cell){
          if(xx * xx + yy * yy > R * R) continue;
          const h = Math.sin((xx * 12.9 + yy * 78.2 + Math.floor(t * 6)) * 0.731) * 43758.5;
          const f = h - Math.floor(h);
          if(f < 0.45) continue;
          c.fillStyle = f > 0.85 ? "#35f0d6" : f > 0.7 ? "#ff3d7f" : "rgba(10,6,16,0.9)";
          c.fillRect(x + xx, y + yy, cell, cell);
        }
        if(big){ c.font = "12px 'Pixelify Sans', sans-serif"; c.fillStyle = "#ff7aa6"; c.textAlign = "left"; c.fillText(`guérit à ${m.heal} %`, x + R + 4, y + 4); }
      } else if(m.k === "leg"){
        c.fillStyle = "#ffd24a"; c.strokeStyle = "#1a1206"; c.lineWidth = 2;
        c.beginPath(); for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 3.5 : 8; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
        if(big){ c.font = "bold 13px 'Pixelify Sans', sans-serif"; c.fillStyle = "#ffd24a"; c.textAlign = "left"; c.fillText(m.n, x + 11, y + 4); }
      } else if(m.k === "npc"){
        c.fillStyle = "#ff8a3d"; c.strokeStyle = "#160a02"; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y, 5.5, 0, Math.PI * 2); c.fill(); c.stroke();
        if(big){ c.font = "13px 'Pixelify Sans', sans-serif"; c.fillStyle = "#ffb07a"; c.textAlign = "left"; c.fillText(m.n, x + 9, y + 4); }
      } else if(m.k === "site"){
        c.save(); c.translate(x, y); c.rotate(Math.PI / 4);
        c.fillStyle = m.off ? "#4a5262" : m.c; c.strokeStyle = "#04060c"; c.lineWidth = 2;
        c.fillRect(-5, -5, 10, 10); c.strokeRect(-5, -5, 10, 10); c.restore();
        if(big){ c.font = "bold 12px 'Pixelify Sans', sans-serif"; c.textAlign = "left"; c.lineJoin = "round"; c.strokeStyle = "rgba(4,6,12,.9)"; c.lineWidth = 4;
          c.strokeText(m.n, x + 10, y + 4); c.fillStyle = m.off ? "#9aa4b6" : m.c; c.fillText(m.n, x + 10, y + 4); }
      } else if(m.k === "mon"){
        c.fillStyle = m.missing ? "#ff3d7f" : "#e9f4ff";
        c.beginPath(); c.arc(x, y, big ? 3 : 3.5, 0, Math.PI * 2); c.fill();
      }
    }
    /* toi : une flèche dans la direction du regard */
    const P = this.game.player.pos, yaw = this.game.player.yaw;
    const x = tx(P.x), y = ty(P.z), a = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = "#35f0d6"; c.strokeStyle = "#02110f"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(11, 0); c.lineTo(-7, 7); c.lineTo(-3, 0); c.lineTo(-7, -7); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  drawMini(){
    const c = this.mini.getContext("2d"), S = MINI * 2, R = S / 2, s = R / RANGE;     /* pixels de la toile par mètre */
    const P = this.game.player.pos;
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath(); c.arc(R, R, R - 3, 0, Math.PI * 2); c.clip();
    c.fillStyle = "rgb(6,9,15)"; c.fillRect(0, 0, S, S);
    const sx = (P.x - RANGE - X0) * PPM, sy = (P.z - RANGE - Z0) * PPM, sw = RANGE * 2 * PPM;
    c.imageSmoothingEnabled = true;
    c.drawImage(this.bg, sx, sy, sw, sw, 0, 0, S, S);
    const tx = x => R + (x - P.x) * s, ty = z => R + (z - P.z) * s;
    this.drawMarkers(c, tx, ty, s, false);
    /* les lignes de balayage de l'écran du terminal */
    c.fillStyle = "rgba(0,0,0,0.12)"; for(let y = 0; y < S; y += 4) c.fillRect(0, y, S, 1);
    c.restore();
    c.strokeStyle = "rgba(53,240,214,0.55)"; c.lineWidth = 3; c.beginPath(); c.arc(R, R, R - 3, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#cfe0ef"; c.font = "bold 22px 'Pixelify Sans', sans-serif"; c.textAlign = "center"; c.fillText("N", R, 26);
  }
  drawBig(){
    const cv = this.bigCv, H = Math.min(innerHeight * 0.86, innerWidth * 0.62 * (Z1 - Z0) / (X1 - X0), 980), Wd = H * (X1 - X0) / (Z1 - Z0), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(Wd * dpr); cv.height = Math.round(H * dpr); cv.style.width = Wd + "px"; cv.style.height = H + "px";
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.imageSmoothingEnabled = true;
    c.drawImage(this.bg, 0, 0, Wd, H);
    const s = Wd / (X1 - X0), tx = x => (x - X0) * s, ty = z => (z - Z0) * s;
    /* les lieux */
    c.textAlign = "center"; c.font = "bold 10px 'Press Start 2P', monospace";
    c.fillStyle = "#cfe0ef"; c.fillText("JADIELLE", tx(pathX(BOUNDS.z0)), ty(BOUNDS.z0) - 6); c.fillText("BOURG PALETTE", tx(pathX(BOUNDS.z1)), ty(BOUNDS.z1) + 16);
    c.font = "12px 'Pixelify Sans', sans-serif"; c.fillStyle = "#7fd8e6"; c.fillText("Lac", tx(LAKE.x), ty(LAKE.z));
    c.font = "bold 12px 'Pixelify Sans', sans-serif"; c.fillStyle = "#e9f2ff"; c.fillText("ROUTES OUVERTES", tx(0), ty(30));
    /* les biomes : leur nom ; fermés, un cadenas et ce qu'ils demandent */
    const info = this.game.world.lockInfo || {have:0, need:{}};
    for(const b of BIOMES){
      const x = tx(b.c[0]), y = ty(b.c[1]), open = LOCKS[b.k];
      const label = (txt, yy) => { c.lineJoin = "round"; c.strokeStyle = "rgba(4,6,12,0.9)"; c.lineWidth = 5; c.strokeText(txt, x, yy); c.fillText(txt, x, yy); };
      c.font = "bold 15px Unbounded, sans-serif"; c.fillStyle = open ? b.col : "#a6b0c2"; label(HAB_NAMES[b.k], y + (b.k === "foyer" ? 34 : 0));
      c.font = "12px 'Pixelify Sans', sans-serif"; c.fillStyle = open ? "#e6eef8" : "#ffb0c6";
      label(open ? "ouvert" : `fermé · ${info.need[b.k] || "?"} espèces (${Math.min(info.have, info.need[b.k] || 0)})`, y + 17 + (b.k === "foyer" ? 34 : 0));
      if(!open){ const px = tx(b.A[0] + (b.B[0] - b.A[0]) * 0.14), py = ty(b.A[1] + (b.B[1] - b.A[1]) * 0.14); c.fillStyle = "#ff3d7f"; c.fillRect(px - 5, py - 3, 10, 8); c.strokeStyle = "#ff3d7f"; c.lineWidth = 2; c.beginPath(); c.arc(px, py - 3, 3.5, Math.PI, 0); c.stroke(); }
    }
    this.drawMarkers(c, tx, ty, s, true);
    c.fillStyle = "rgba(0,0,0,0.1)"; for(let y = 0; y < H; y += 3) c.fillRect(0, y, Wd, 1);
    /* les zones encore actives, avec ce qui les guérira */
    const S = this.game.S, z = this.markers().filter(m=>m.k === "zone");
    this.big.querySelector(".pm-zones").innerHTML = S ? `<p>Intégrité de l'archive : <b>${S.integrity.toFixed(1)} %</b> · ${z.length} zone${z.length > 1 ? "s" : ""} désindexée${z.length > 1 ? "s" : ""} sur ${ZONES.length}${z.length ? `. La prochaine guérit à <b>${Math.min(...z.map(m=>m.heal))} %</b>.` : ". La route est restaurée."}</p>` : "";
  }
  update(dt){
    this.t += dt;
    const play = this.game.mode === "play";
    this.mini.classList.toggle("on", play);
    if(this.open && !play){ this.open = false; this.big.classList.remove("on"); }
    if(!play) return;
    /* la mini-carte : dix fois par seconde suffit */
    this.acc = (this.acc || 0) + dt;
    if(this.acc > 0.1){ this.acc = 0; this.drawMini(); if(this.open) this.drawBig(); }
  }
}
