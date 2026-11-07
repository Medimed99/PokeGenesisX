/* ============================================================
   LE FORAGE EN 3D — LA VERSION PC
   Le Forage reste celui du jeu mobile (38, 38b, 38c : l'équipe qui
   creuse même jeu fermé, les couches, l'Énergie, les fouilles, la
   forge, les chantiers, la sauvegarde). Sur PC, on y descend, comme
   dans la base d'un Palworld :
     · on marche dans la mine (ZQSD, la souris, Maj pour courir) ;
     · l'équipe travaille sous nos yeux (crew.js) : chacun à son front
       de taille, la roche qui vole, les pépites remontées au wagonnet,
       l'Énergie qui s'envole ;
     · les postes, E à portée : la paroi de fouille (la fouille se
       joue sur la vraie roche, dig.js), la forge, le tableau de
       l'équipe (qui creuse, les améliorations), la table des
       chantiers (les autres puits, les couches), le monte-charge
       (remonter) ;
     · en haut, la profondeur qui défile, la couche, la vitesse,
       l'Énergie et le minerai ; en bas, les fouilles qui attendent.
   On y entre par la galerie de la zone de capture (E), ou par le
   terminal ; Échap (souris rendue) remonte.
   ============================================================ */
import * as THREE from "three";
import { Mine, MU, RX, RZ, TOP, paintLabel } from "./mine.js";
import { Crew, Chips } from "./crew.js";
import { DigWall } from "./dig.js";
import { Settings } from "../settings.js";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const calmFx = () => typeof window.calmFx === "function" && window.calmFx();
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
const EYE = 1.62;
const fmtN = n => { const f = ref("fmt"); return f ? f(n) : String(Math.round(n)); };
const fmtE = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(".", ",") + " M" : n >= 1e4 ? Math.round(n / 1e3) + " k" : n >= 100 ? fmtN(Math.round(n)) : n.toFixed(n >= 10 ? 0 : 1).replace(".", ",");

export class Forage3D {
  constructor(game){
    this.game = game; this.on = false; this.built = false; this.mode = "walk";
    this.pos = new THREE.Vector3(0, 0, RZ - 5.2); this.yaw = 0; this.pitch = -0.08;
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.mouse = null;
    this.near = null; this.shake = 0;
    window.PCFO3D = {on:false};
    /* la souris dans une fouille : la case visée ; un clic frappe */
    addEventListener("pointermove", e=>{ if(!this.on) return; this.mouse = {x:e.clientX / innerWidth * 2 - 1, y:-(e.clientY / innerHeight) * 2 + 1}; }, true);
    /* une fenêtre du Forage (la forge, l'équipe, les chantiers) : après un clic, on la remet à jour */
    addEventListener("click", e=>{
      if(!this.on) return;
      const el = e.target.closest && e.target.closest("#sheet-root [data-act]");
      if(el){ const act = el.dataset.act; setTimeout(()=>this.afterAct(act), 90); }
      const t = e.target.closest && e.target.closest("#pc-fo-tools [data-t]");
      if(t){ e.preventDefault(); this.setTool(t.dataset.t); }
    }, true);
  }
  wanted(){
    const g = G(); if(!g || !this.game.terminal || !this.game.terminal.open) return false;
    if(ref("currentScreen") !== "idle") return false;
    try { if(ref("moduleUnlocked") && !ref("moduleUnlocked")("idle")) return false; } catch(e){}
    return true;
  }
  build(){
    this.built = true;
    const s = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.08, 400);
    this.mine = new Mine(s, this.game.engine.q);
    this.chips = new Chips(s);
    this.crew = new Crew(s, this.mine, this.chips);
    this.dig = new DigWall(s, this.mine.digCenter, this.chips);
    this.env = {tint:new THREE.Color(1, 0.94, 0.86), fog:s.fog.color, fogDensity:s.fog.density};
    /* les postes : là où l'on se tient pour s'en servir */
    const toward = (p, k) => new THREE.Vector3(p.x, 0, p.z).add(new THREE.Vector3(-p.x, 0, -p.z).normalize().multiplyScalar(k));
    const M = this.mine;
    this.stations = [
      {k:"wall", p:new THREE.Vector3(0, 0, M.digCenter.z + 3.4), r:3.4},
      {k:"forge", p:toward(M.forgePos, 2.6), r:2.8},
      {k:"board", p:toward(M.boardPos, 1.9), r:2.6},
      {k:"table", p:toward(M.tablePos, 1.9), r:2.6},
      {k:"lift", p:M.liftPos.clone(), r:1.8}
    ];
    this.cols = [{x:0, z:0, r:2.7}, {x:M.forgePos.x, z:M.forgePos.z, r:2.4}, {x:M.boardPos.x, z:M.boardPos.z, r:1.1}, {x:M.tablePos.x, z:M.tablePos.z, r:1.6},
      {x:M.cartPos.x, z:M.cartPos.z, r:1.4}, {x:8.35, z:1.3, r:2.0}];
    /* l'interface : la profondeur, les ressources, les fouilles, l'invite, les touches, la fouille */
    const div = (id, cls) => { const d = document.createElement("div"); d.id = id; if(cls) d.className = cls; document.body.appendChild(d); return d; };
    this.hud = div("pc-fo-hud");
    this.hud.innerHTML = `<div class="fo3-depth"><div class="fo3-k"></div><div class="fo3-m"><b>0</b><span>m</span></div><div class="fo3-st"><i></i><span></span></div><div class="fo3-bar"><i></i></div><div class="fo3-nx"></div></div>
      <div class="fo3-res"><div class="fo3-e"><span>⚡</span><b>0</b><small>Énergie</small></div><div class="fo3-ores"></div></div>`;
    this.wallsEl = div("pc-fo-walls");
    this.promptEl = div("pc-fo-prompt");
    this.keysEl = div("pc-fo-keys");
    this.toolsEl = div("pc-fo-tools");
    this.digHud = div("pc-fo-dig");
    this.hintEl = div("pc-fo-hint");
    this.fx = document.createElement("canvas"); this.fx.id = "pc-fo-fx"; document.body.appendChild(this.fx);
    /* la fouille : on frappe dès qu'on appuie (pas au relâché) */
    this.game.canvas.addEventListener("pointerdown", e=>{
      if(!this.on || this.mode !== "dig" || e.button !== 0) return;
      const D = ref("DIG"); if(!D || D.over) return;
      this.mouse = {x:e.clientX / innerWidth * 2 - 1, y:-(e.clientY / innerHeight) * 2 + 1};
      const h = this.dig.pick(this.mouse.x, this.mouse.y, this.camera); if(!h) return;
      this.dig.strike(h.X, h.Y, this.tool(), this.game.t); this.sfx("strike");
    });
  }
  enter(){
    if(!this.built) this.build();
    this.on = true; window.PCFO3D.on = true;
    document.body.classList.add("forage3d");
    this.game.engine.useScene(this.scene, this.camera);
    this.camera.fov = Settings.fov ? Math.min(80, Settings.fov) : 66; this.camera.updateProjectionMatrix();
    this.pos.set(2.2, 0, RZ - 5.4); this.yaw = 0.2; this.pitch = -0.06; this.mode = null; this.snap = true;
    for(const el of [this.hud, this.wallsEl, this.promptEl, this.keysEl, this.fx]) el.classList.add("on");
    const f = ref("forage")(); this.lastSi = f.depth; this.lastWalls = f.walls; this.crewSig = ""; this.siteSig = "";
    this.mine.sync(f, f.depth, this.game.t, 1);
    /* la première descente : la mine se montre, du haut du puits jusqu'à l'équipe */
    this.playIntro(f);
  }
  exit(){
    this.on = false; window.PCFO3D.on = false;
    document.body.classList.remove("forage3d", "fo-dig", "fo-open");
    for(const el of [this.hud, this.wallsEl, this.promptEl, this.keysEl, this.toolsEl, this.digHud, this.fx, this.hintEl]) el.classList.remove("on");
    this.crew.dispose(); this.dig.end();
    const g = this.game;
    if(!(g.story3d && g.story3d.on)) g.engine.useScene(null);
    if(g.input.locked) g.input.unlock();
  }
  playIntro(f){
    const I = this.game.intro; if(!I) return;
    const ST = ref("STRATA"), st = ST[f.depth], S1 = ref("forSite")();
    const V = (x, y, z) => new THREE.Vector3(x, y, z), P = V(this.pos.x, EYE, this.pos.z);
    let seen = false; try { seen = localStorage.getItem("pcg-fo3d") === "1"; localStorage.setItem("pcg-fo3d", "1"); } catch(e){}
    if(seen){
      /* les fois suivantes : la cage descend le puits, et on y est */
      I.play({id:"forage-down", camera:this.camera, dur:2.3, color:"#ffb347", blend:0.6, titleAt:0.35,
        kicker:`${(S1 && S1.id !== "main" ? S1.n + " · " : "")}${st.n.toUpperCase()} · ${fmtN(Math.floor(f.m))} M`, title:"Le Forage",
        shots:[{p:V(0.3, TOP + 22, 0.6), l:V(0, 0, 2)}, {p:V(0.4, TOP - 2.5, 1.5), l:V(0, 1, 8)}, {p:P.clone(), l:V(0, 1.4, -8)}],
        alive:()=>this.on});
      return;
    }
    I.play({id:"forage", camera:this.camera, dur:6.2, color:"#ffb347", ver:1, blend:0.7, titleAt:0.55,
      kicker:`${(S1 && S1.id !== "main" ? S1.n + " · " : "")}${st.n.toUpperCase()} · ${fmtN(Math.floor(f.m))} M`, title:"Le Forage",
      goal:"Ton équipe creuse, même jeu fermé. Toi, tu fouilles la paroi, tu forges tes outils, tu choisis qui descend.",
      shots:[{p:V(0.2, TOP + 40, 0.4), l:V(0, 0, 0)}, {p:V(0.5, TOP + 4, 0.8), l:V(0, 0, 0)}, {p:V(0.9, TOP - 3.2, 1.0), l:V(6, 1, -2)},
        {p:V(9.0, 3.4, -2.5), l:V(-3, 1, -8)}, {p:V(5.5, 2.8, 6.5), l:V(-6, 1.4, -3)}, {p:P.clone().add(V(0, 0.4, 1.2)), l:V(0, 1.8, -8)}],
      controls:[
        {k:["Z", "Q", "S", "D"], t:"marcher", on:{keys:["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]}},
        {k:["souris"], t:"regarder", on:{move:true}},
        {k:["E"], t:"les postes : la fouille, la forge, l'équipe, les chantiers", on:{chars:["e"]}},
        {k:["Tab"], t:"la souris", on:{keys:["Tab"]}},
        {k:["Échap"], t:"remonter (souris rendue)", on:{keys:["Escape"]}}],
      /* (la cinématique tient lieu du tutoriel du Forage : les annonces de la mine peuvent passer) */
      onEnd:()=>{ const S = G().S; if(S){ S.tutos = S.tutos || []; if(!S.tutos.includes("idle")) S.tutos.push("idle"); } },
      alive:()=>this.on, visible:()=>this.on && this.mode === "walk" && this.game.input.locked && !this.overlayOpen()});
  }
  overlayOpen(){ const sr = document.getElementById("sheet-root"); return !!(sr && /\bon\b/.test(sr.className)) || !!(this.game.popupNow); }
  relock(){ if(this.on && this.mode === "walk" && !this.overlayOpen() && !this.game.input.locked && !this.game.intro.active) this.game.input.lock(); }
  /* un clic dans la scène : reprendre la caméra (dans la fouille, c'est l'appui qui frappe) */
  click(){ if(this.mode !== "dig") this.relock(); }
  /* les bruits de la mine : les coups de l'équipe (d'où ils viennent), le wagonnet, la roche sous ses propres coups */
  sfx(kind, pos){
    const A = this.game.audio; if(!A || !A.ok || !this.on) return;
    let pan = 0, att = 1;
    if(pos){ const c = this.camera.position, dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz) || 1, yw = this.camYaw || 0;
      pan = (dx * Math.cos(yw) - dz * Math.sin(yw)) / d * 0.8; att = Math.max(0, 1 - d / 24); }
    if(att < 0.03) return;
    if(kind === "hit") A.burst({freq:420 + Math.random() * 260, q:0.9, dur:0.08, vol:0.09 * att, type:"lowpass", pan});
    else if(kind === "drop"){ A.tone({freq:620, to:280, dur:0.1, vol:0.06 * att, pan}); A.burst({freq:2400, q:2, dur:0.05, vol:0.04 * att, pan}); }
    else if(kind === "cheer"){ A.tone({freq:880, to:1320, dur:0.12, vol:0.07, type:"triangle"}); A.tone({freq:1175, to:1760, dur:0.14, vol:0.06, type:"triangle", delay:0.11}); }
    else if(kind === "strike"){ A.burst({freq:300, q:0.7, dur:0.16, vol:0.24, type:"lowpass"}); A.burst({freq:3000, q:3, dur:0.03, vol:0.05}); }
    else if(kind === "quake") A.burst({freq:80, q:0.5, dur:1.1, vol:0.32, type:"lowpass", attack:0.06});
  }
  /* une phrase, quelques secondes, sous la profondeur */
  hint(html, dur = 4){ const el = this.hintEl; if(!el) return; el.innerHTML = html; el.classList.add("on"); clearTimeout(this._ht); this._ht = setTimeout(()=>el.classList.remove("on"), dur * 1000); }
  tool(){ return ref("DIG_TOOL") || "pick"; }
  setTool(t){ const A = G().ACTIONS; if(A && A.fotool) A.fotool({t}); }
  /* ---------- les touches ---------- */
  key(e){
    if(!this.on) return false;
    const I = this.game.input, A = G().ACTIONS;
    if(this.mode === "dig"){
      if(e.code === "Digit1" || e.code === "Numpad1"){ this.setTool("pick"); return true; }
      if(e.code === "Digit2" || e.code === "Numpad2"){ this.setTool("hammer"); return true; }
      if(e.code === "Escape" || e.code === "Tab"){
        e.preventDefault();
        const res = document.querySelector("#dg-res.on");
        if(res){ const b = res.querySelector('[data-act="fowallback"]'); if(b) b.click(); }
        else if(A && A.fowallquit) A.fowallquit();
        return true;
      }
      if((e.code === "Enter" || e.code === "Space") && document.querySelector("#dg-res.on")){ e.preventDefault(); const b = document.querySelector('#dg-res.on [data-act="fowallnext"]') || document.querySelector('#dg-res.on [data-act="fowallback"]'); if(b) b.click(); return true; }
      return true;
    }
    if(e.code === "Tab"){ e.preventDefault(); if(I.locked) I.unlock(); else this.relock(); return true; }
    if(e.code === "Escape"){ if(!I.locked){ if(this.overlayOpen()){ const c = ref("closeSheet"); if(c) c(); } else this.game.terminal.escape(); } return true; }
    if((e.code === "KeyE" || e.code === "Enter") && !this.overlayOpen()){ e.preventDefault(); this.interact(); return true; }
    return false;
  }
  /* ---------- les postes ---------- */
  interact(){
    const N = this.near; if(!N) return;
    const A = G().ACTIONS, f = ref("forage")();
    if(N.k === "wall"){
      if(f.walls > 0 && A.fowall){ this.game.input.unlock(); A.fowall(); }
      else this.hint(ref("crewIds")().length ? `Aucune fouille pour l'instant : la prochaine dans ${Math.max(1, Math.ceil((ref("WALL_SECS") - f.wallAt) / 60))} min` : "Il faut au moins un Pokémon dans l'équipe", 4);
      return;
    }
    if(N.k === "lift"){ this.game.terminal.close(); return; }
    if(N.k === "mon"){ this.crew.cheer(N.r, this.game.t); this.sfx("cheer"); return; }
    this.panel(N.k === "forge" ? "forge" : N.k === "board" ? "crew" : "sites");
  }
  /* une fenêtre du jeu mobile, faite des morceaux de son écran du Forage */
  panel(kind){
    const r = n => ref(n), f = r("forage")(), head = r("sheetHead"), ic = r("ic");
    let html = "";
    if(kind === "forge") html = head("La forge") + `<div class="tiny muted" style="margin:-4px 0 8px">${ic("bolt")} <b>${fmtN(Math.floor(f.energy))}</b> Énergie</div>` + r("forForgeHtml")();
    else if(kind === "crew") html = head("L'équipe") + `<div class="row between" style="margin:0 0 6px"><span class="tiny dim">${r("crewIds")().length} / ${f.slots} au travail</span>
        <button class="btn xs" data-act="foauto">${ic("refresh")} Choisir les meilleurs</button></div>` + r("forCrewHtml")()
      + `<div class="row between" style="margin:16px 0 6px"><div class="h sm" style="margin:0">AMÉLIORER</div><span class="pill">${ic("bolt")} ${fmtN(Math.floor(f.energy))}</span></div>` + r("forUpsHtml")();
    else html = head("Les chantiers") + `<div class="tiny dim" style="margin:-2px 0 6px">D'autres puits, avec d'autres trésors. Ton équipe creuse dans un seul à la fois.</div>` + r("forSitesHtml")()
      + `<div class="h sm" style="margin:14px 0 6px">LES COUCHES</div>` + r("forStrataHtml")();
    r("sheet")(html);
    const sh = document.querySelector("#sheet-root .sheet"); if(sh){ sh.dataset.fo = kind; sh.classList.add("fo3-sheet"); }
    this.lastPanel = kind;
    if(this.game.input.locked) this.game.input.unlock();
  }
  afterAct(act){
    const sh = document.querySelector("#sheet-root.on .sheet[data-fo]");
    if(sh) this.panel(sh.dataset.fo);
    else if(["foset", "fositeopen"].includes(act) && !document.querySelector("#sheet-root.on")) this.panel(act === "foset" ? "crew" : "sites");
    /* une fenêtre refermée : on reprend la marche (le clic vaut geste) */
    if(!document.querySelector("#sheet-root.on") && ["closesheet", "fositego"].includes(act)) this.relock();
    /* un outil forgé : l'enclume étincelle */
    if(act === "foforge"){ const a = this.mine.anvil.getWorldPosition(new THREE.Vector3()); a.y += 0.9; this.chips.burst(a, 30, ["#ffd27a", "#ff8a2a", "#fff2c0"], 3.4, 0.04, 1.4); MU.uFlash.value = Math.max(MU.uFlash.value, 0.4); }
  }
  /* ---------- à chaque image ---------- */
  update(dt, t){
    const want = this.wanted();
    if(want && !this.on) this.enter();
    else if(!want && this.on) this.exit();
    if(!this.on) return;
    const A = this.game.engine.active; if(!A || A.scene !== this.scene) this.game.engine.useScene(this.scene, this.camera);
    const g = G(), S = g.S, f = ref("forage")(), si = f.depth, I = this.game.input;
    const crew = ref("crewIds")(), rate = ref("digRate")(), ST = ref("STRATA"), st = ST[si];
    /* ce qui a changé dans le jeu mobile */
    if(si !== this.lastSi){ if(si > this.lastSi){ this.mine.quake(); this.shake = 0.5; this.sfx("quake"); this.hint(`<b>${esc(st.n)}</b> : une nouvelle couche, ${esc(st.mat.toLowerCase())}`, 5); } this.lastSi = si; }
    if(f.walls > this.lastWalls){ this.shake = Math.max(this.shake, 0.25); this.hint(`⛏ Une fouille t'attend à la paroi`, 4); }
    this.lastWalls = f.walls;
    this.mine.sync(f, si, t, dt);
    this.mine.piles(f.ore || {});
    const sig = crew.join(",") + "|" + f.slots + "|" + si;
    if(sig !== this.crewSig){ this.crewSig = sig; this.mine.paintBoard(crew, f.slots, si); }
    const ssig = (f.site || "main") + "|" + JSON.stringify(f.sitesOpen || {});
    if(ssig !== this.siteSig){ this.siteSig = ssig; this.mine.paintMap(); }
    /* marcher, ou fouiller */
    const D = ref("DIG"), mode = D && ref("screenArg") === "wall" ? "dig" : "walk";
    if(mode !== this.mode){
      const was = this.mode; this.mode = mode;
      document.body.classList.toggle("fo-dig", mode === "dig");
      this.toolsEl.classList.toggle("on", mode === "dig"); this.digHud.classList.toggle("on", mode === "dig");
      this.wallsEl.classList.toggle("on", mode === "walk");
      if(mode === "dig"){ if(I.locked) I.unlock(); }
      else { this.dig.end(); if(was === "dig") this.snap = true; }
    }
    this.mine.digLabel.sp.visible = mode !== "dig"; this.mine.digGlow.visible = mode !== "dig";
    if(mode === "dig"){
      if(this.dig.D !== D) this.dig.begin(D);
      this.digCam(dt, t);
      this.dig.update(t, dt, this.camera, this.mouse, this.tool(), calmFx());
      this.digUi(D);
    } else { this.dig.rest(st.pal); this.walk(dt, t); }
    /* l'équipe, les éclats, la mine */
    const ore = ref("oreDef")(ref("oreOf")(si));
    /* ce que rapporte chacun : sa part de l'Énergie gagnée depuis son dernier voyage au wagonnet */
    const dp = ref("digPower"), tot = crew.reduce((a, id)=>a + dp(id, si), 0), eps = ref("forageRate")();
    this.crew.update(t, dt, this.camera, this.env, {crew, dex:S.dex, rate, pal:st.pal, ore, calm:calmFx(), aff:id=>ref("digAff")(id, si), fmtE, sfx:(k, p)=>this.sfx(k, p),
      ePerSec:id=>tot > 0 ? eps * dp(id, si) / tot : 0});
    this.chips.update(dt, 0);
    this.mine.update(t, dt, this.camera, {rate, walls:f.walls});
    this.hudUpdate(f, si, st, rate, dt);
    this.overlay(t);
  }
  walk(dt, t){
    const I = this.game.input, open = this.overlayOpen();
    if(open && I.locked) I.unlock();
    const look = I.locked ? I.consumeLook() : (I.consumeLook(), {x:0, y:0});
    if(Settings.invertY) look.y = -look.y;
    I.consumeWheel();
    const sens = 0.0021;
    this.yaw -= look.x * sens; this.pitch = Math.max(-1.25, Math.min(1.35, this.pitch - look.y * sens));
    let mx = 0, mz = 0;
    if(I.locked && !open && !this.game.intro.active){
      if(I.down("KeyW") || I.down("ArrowUp")) mz -= 1;
      if(I.down("KeyS") || I.down("ArrowDown")) mz += 1;
      if(I.down("KeyA") || I.down("ArrowLeft")) mx -= 1;
      if(I.down("KeyD") || I.down("ArrowRight")) mx += 1;
    }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let wx = -mz * fx + mx * rx, wz = -mz * fz + mx * rz; const L = Math.hypot(wx, wz);
    if(L > 1){ wx /= L; wz /= L; }
    const sp = L > 0 ? (I.down("ShiftLeft") || I.down("ShiftRight") ? 7 : 4.2) : 0;
    if(L > 0){
      let nx = this.pos.x + wx * sp * dt, nz = this.pos.z + wz * sp * dt;
      /* la paroi (une ellipse) et ce qui encombre (la foreuse, la forge…) */
      const ex = nx / (RX - 1.7), ez = nz / (RZ - 1.7), e = Math.hypot(ex, ez);
      if(e > 1){ nx /= e; nz /= e; }
      for(const c of this.cols){ const d = Math.hypot(nx - c.x, nz - c.z); if(d < c.r + 0.35){ const k = (c.r + 0.35) / (d || 1); nx = c.x + (nx - c.x) * k; nz = c.z + (nz - c.z) * k; } }
      this.pos.x = nx; this.pos.z = nz;
    }
    this.bob = (this.bob || 0) + sp * dt * 1.6;
    /* le poste à portée */
    let best = null, bd = 1e9;
    for(const S1 of this.stations){ const d = Math.hypot(S1.p.x - this.pos.x, S1.p.z - this.pos.z); if(d < S1.r && d < bd){ bd = d; best = S1; } }
    /* un mineur tout près, devant soi : on peut l'encourager */
    const fx0 = -Math.sin(this.yaw), fz0 = -Math.cos(this.yaw);
    for(const r of this.crew.recs.values()){
      const dx = r.pos.x - this.pos.x, dz = r.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if(d < 2.2 + r.h * 0.4 && d < bd + 0.6 && (dx * fx0 + dz * fz0) / (d || 1) > 0.5){ bd = d; best = {k:"mon", r}; }
    }
    this.near = best;
    /* la caméra : à hauteur d'yeux, le pas qui balance un peu */
    const cam = this.camera, k = this.snap ? 1 : Math.min(1, dt * 10);
    const want = V1.set(this.pos.x, EYE + (calmFx() ? 0 : Math.sin(this.bob) * 0.035 * Math.min(1, sp / 4)), this.pos.z);
    this.camPos.lerp(want, k);
    cam.position.copy(this.camPos);
    if(this.shake > 0.001 && !calmFx()){ cam.position.x += (Math.random() - 0.5) * this.shake * 0.3; cam.position.y += (Math.random() - 0.5) * this.shake * 0.3; }
    this.shake = Math.max(0, this.shake - dt * 0.7);
    const rot = this.snap ? 1 : Math.min(1, dt * 14);
    this.camYaw = this.snap ? this.yaw : this.camYaw + Math.atan2(Math.sin(this.yaw - this.camYaw), Math.cos(this.yaw - this.camYaw)) * rot;
    this.camPitch = this.snap ? this.pitch : this.camPitch + (this.pitch - this.camPitch) * rot;
    cam.rotation.set(this.camPitch, this.camYaw, 0, "YXZ");
    this.snap = false;
    this.walkUi(I, open);
  }
  /* la fouille : face à la paroi */
  digCam(dt, t){
    const C = this.mine.digCenter, cam = this.camera, k = Math.min(1, dt * 4);
    this.camPos.lerp(V1.set(C.x, C.y + 0.1, C.z + 7.0), k);
    cam.position.copy(this.camPos);
    const sh = calmFx() ? 0 : this.dig.shake;
    if(sh > 0.001) cam.position.add(V2.set((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0));
    this.camYaw += Math.atan2(Math.sin(0 - this.camYaw), Math.cos(0 - this.camYaw)) * k;
    this.camPitch += (-0.012 - this.camPitch) * k;
    cam.rotation.set(this.camPitch, this.camYaw, 0, "YXZ");
    this.yaw = 0; this.pitch = -0.06; this.pos.set(0, 0, C.z + 3.6);
  }
  /* ---------- l'interface ---------- */
  hudUpdate(f, si, st, rate, dt){
    const H = this.hud;
    /* la profondeur : elle défile pour de vrai */
    const m = f.m;
    H.querySelector(".fo3-m b").textContent = fmtN(Math.floor(m));
    const now = performance.now(); if(this.hudT && now - this.hudT < 250) return; this.hudT = now;
    const ST = ref("STRATA"), nx = ST[si + 1], S1 = ref("forSite")();
    H.style.setProperty("--sc", st.c);
    H.querySelector(".fo3-k").textContent = (S1 && S1.id !== "main" ? S1.n : "Puits principal") + ` · ${rate > 0 ? "+" + ref("forFmtRate")(rate) + " m/s" : "à l'arrêt"}`;
    H.querySelector(".fo3-st span").textContent = st.n;
    H.querySelector(".fo3-bar i").style.width = nx ? Math.min(100, (m - st.need) / (nx.need - st.need) * 100).toFixed(1) + "%" : "100%";
    H.querySelector(".fo3-nx").textContent = nx ? `${nx.n} à ${fmtN(nx.need)} m` : "Plus rien en dessous : la roche durcit sans fin";
    H.querySelector(".fo3-e b").textContent = fmtN(Math.floor(f.energy));
    const ORES = ref("ORES"), seen = f.oreSeen || {}, oreSvg = ref("oreSvg"), here = ref("oreOf")(si);
    const ores = ORES.map(o=>{ const n = (f.ore || {})[o.id] || 0, known = seen[o.id] || n > 0;
      return `<span class="${known ? "" : "unk"} ${o.id === here ? "here" : ""}" title="${esc(known ? o.n : "Minerai inconnu")}">${oreSvg(o.id, 18)}<b>${known ? fmtN(n) : "?"}</b></span>`; }).join("");
    if(ores !== this.oresHtml){ H.querySelector(".fo3-ores").innerHTML = ores; this.oresHtml = ores; }
    /* les fouilles qui attendent */
    const crew = ref("crewIds")(), cap = ref("wallCap")(), W = ref("WALL_SECS");
    const wh = !crew.length ? `<b>Personne ne creuse</b><small>Au tableau de l'équipe, choisis qui descend</small>`
      : f.walls ? `<b>⛏ ${f.walls} fouille${f.walls > 1 ? "s" : ""} à la paroi</b><small>${f.walls >= cap ? "C'est plein : fais-en une, sinon l'équipe n'en trouvera plus" : "La paroi au cadre de bois, au fond de la mine"}</small>`
      : `<b>Prochaine fouille dans ${Math.max(1, Math.ceil((W - f.wallAt) / 60))} min</b><small>L'équipe la trouvera en creusant</small>`;
    const wp = Math.min(100, f.wallAt / W * 100).toFixed(0);
    const html = wh + `<i style="width:${f.walls ? 100 : wp}%"></i>`;
    if(html !== this.wallsHtml){ this.wallsEl.innerHTML = html; this.wallsHtml = html; }
    this.wallsEl.classList.toggle("ready", f.walls > 0);
    /* le panneau au-dessus de la paroi */
    const lab = f.walls ? [`${f.walls} fouille${f.walls > 1 ? "s" : ""}`, "E pour fouiller la paroi", "#ffc857"]
      : [crew.length ? "La paroi de fouille" : "Personne ne creuse", crew.length ? `prochaine fouille dans ${Math.max(1, Math.ceil((W - f.wallAt) / 60))} min` : "choisis l'équipe au tableau", "#c9a86a"];
    const ls = lab.join("|");
    if(ls !== this.labSig){ this.labSig = ls; paintLabel(this.mine.digLabel, lab[0], lab[1], lab[2]); }
  }
  walkUi(I, open){
    const N = this.near, f = ref("forage")();
    let p = "";
    if(N && !open){
      if(N.k === "wall") p = f.walls ? `<b>E</b> · fouiller la paroi <span>(${f.walls} en attente)</span>` : `La paroi de fouille <span>· rien à fouiller pour l'instant</span>`;
      else if(N.k === "forge") p = `<b>E</b> · la forge <span>· forger pioche, marteau, foreuse, étais</span>`;
      else if(N.k === "board") p = `<b>E</b> · l'équipe <span>· qui creuse, les améliorations</span>`;
      else if(N.k === "table") p = `<b>E</b> · les chantiers <span>· les autres puits, les couches</span>`;
      else if(N.k === "lift") p = `<b>E</b> · remonter <span>· à la zone de capture</span>`;
      else if(N.k === "mon"){ const P = G().POKE[N.r.id]; p = `<b>E</b> · encourager ${esc(P ? P.name : "")}`; }
    }
    if(p !== this.promptHtml){ this.promptEl.innerHTML = p; this.promptHtml = p; }
    this.promptEl.classList.toggle("show", !!p);
    document.body.classList.toggle("fo-open", !!open);
    const k = open ? "" : !I.locked ? `<b>Clic</b> dans la mine pour reprendre · <b>Échap</b> remonter`
      : `<b>ZQSD</b> marcher · <b>Maj</b> courir · <b>E</b> les postes · <b>Tab</b> la souris`;
    if(k !== this.keysHtml){ this.keysEl.innerHTML = k; this.keysHtml = k; }
    this.keysEl.classList.toggle("on", !!k);
  }
  digUi(D){
    const t = this.tool(), TT = ref("TOOL_TIERS"), tn = ref("toolName"), tier = ref("toolTier"), svg = ref("toolSvg");
    const html = ["pick", "hammer"].map((k, i)=>`<button class="${t === k ? "on" : ""}" data-t="${k}"><kbd>${i + 1}</kbd>${svg(k, tier(k), 34)}<span><b>${esc(tn(k))}</b><small>${k === "pick" ? "petite zone · abîme peu" : "grande zone · abîme plus"}</small></span></button>`).join("");
    if(html !== this.toolsHtml){ this.toolsEl.innerHTML = html; this.toolsHtml = html; }
    const big = D.items.filter(i=>!i.small), got = big.filter(i=>i.found).length, s = D.stab / D.max, st = ref("STRATA")[D.si];
    const dh = `<div class="fd-k">FOUILLE · ${esc(st.n.toUpperCase())}</div><div class="fd-n"><b>${got}</b> / ${big.length} objets <small>+ des pépites</small></div>
      <div class="fd-stab ${s < 0.25 ? "low" : s < 0.5 ? "mid" : ""}"><i style="width:${(s * 100).toFixed(1)}%"></i><span>Solidité</span></div>
      <div class="fd-tip">${D.over ? "" : "Vise une case, clique pour frapper · <b>Échap</b> : remonter avec ce qui est dégagé"}</div>`;
    if(dh !== this.digHtml){ this.digHud.innerHTML = dh; this.digHtml = dh; }
  }
  /* par-dessus : le nom de chacun, ce qu'il rapporte */
  overlay(t){
    const cv = this.fx, d = Math.min(2, devicePixelRatio || 1);
    if(cv.width !== Math.round(innerWidth * d) || cv.height !== Math.round(innerHeight * d)){ cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
    const x = cv.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
    if(this.mode !== "walk") return;
    const cam = this.camera, POKE = G().POKE, S = G().S, si = ref("forage")().depth, aff = ref("digAff");
    cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    /* (seulement devant la caméra : un point derrière se projette aussi, à l'envers) */
    const proj = v => { if(V2.copy(v).applyMatrix4(cam.matrixWorldInverse).z > -0.3) return null; const p = V2.copy(v).project(cam); if(Math.abs(p.x) > 1.2 || Math.abs(p.y) > 1.2) return null; return {x:(p.x * 0.5 + 0.5) * innerWidth, y:(-p.y * 0.5 + 0.5) * innerHeight}; };
    x.textAlign = "center";
    for(const r of this.crew.recs.values()){
      if(!r.head) continue;
      const dist = cam.position.distanceTo(r.head); if(dist > 15) continue;
      const P = proj(r.head); if(!P) continue;
      const a = Math.max(0, Math.min(1, (15 - dist) / 4)), A = aff(r.id, si);
      x.globalAlpha = a;
      const name = POKE[r.id] ? POKE[r.id].name : "?", lv = S.dex[r.id] ? S.dex[r.id].lvl : 1;
      x.font = "600 13px 'Pixelify Sans', sans-serif"; const w = x.measureText(name + "  N." + lv).width + 18;
      x.fillStyle = "rgba(10,8,6,.62)"; x.beginPath(); x.roundRect(P.x - w / 2, P.y - 26, w, 20, 10); x.fill();
      x.fillStyle = "#f6ead8"; x.fillText(name, P.x - 14, P.y - 11); x.fillStyle = "#c9a86a"; x.font = "12px 'Pixelify Sans', sans-serif"; x.fillText("N." + lv, P.x + w / 2 - 22, P.y - 11);
      if(A !== 1){ x.font = "bold 11px 'Pixelify Sans', sans-serif"; x.fillStyle = A > 1 ? "#ffd166" : "#ff8a8a"; x.fillText(A > 1 ? "⚡ rapide ici" : "lent ici", P.x, P.y + 6); }
    }
    for(const p of this.crew.pops){
      const k = (t - p.t) / 1.6, P = proj(V1.set(p.x, p.y + k * 1.2, p.z)); if(!P) continue;
      x.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      x.font = "800 17px Unbounded, sans-serif"; x.lineWidth = 4; x.strokeStyle = "rgba(20,10,0,.7)"; x.strokeText(p.txt, P.x, P.y); x.fillStyle = p.c; x.fillText(p.txt, P.x, P.y);
    }
    x.globalAlpha = 1;
  }
}
