/* ============================================================
   37d — LE PLATEAU
   Les cinématiques avaient un dégradé de fond et un portrait de
   Porygon-Z posé dessus, dans une case. Le plateau est un monde peint
   en pixel art, sous la scène : un décor qui montre ce que dit le texte
   (la salle claire et sa barre bloquée à douze pour cent, la Route 1 au
   crépuscule, le ciel de Hoenn…), des Pokémon qui marchent, se
   tournent, sautent, ont mal, comme dans Donjon Mystère ; une caméra,
   une lumière. Les souvenirs passent au sépia, avec du grain, et se
   dégradent. L'archiviste d'avant n'a plus de silhouette dessinée :
   c'est une forme de pixels qui se défait et se refait, faite des
   octets de ton nom — le joueur ne le sait pas encore.

   Trois toiles l'une sur l'autre, à la taille de l'écran ; le monde y
   est dessiné à l'échelle du pixel art (un pixel du monde = deux ou
   trois pixels de l'écran), ce qui laisse la caméra glisser en douceur :
     cn-world   le décor et les acteurs — le filtre du souvenir s'y pose
     cn-over    ce qui n'appartient pas au souvenir : l'archiviste,
                MissingNo, la défragmentation, les lettres
     cn-grain   le grain du souvenir
   et une couche de textes du monde (cn-wl) : fenêtres du système,
   fichiers, compteurs — toujours nets.

   Le vocabulaire du standard s'enrichit (fermé, vérifié par test.js) :
     set     un décor                 {k, v, light, cam, mem, keep, cut}
     plat    l'état du décor          {st, holes, on}
     put     un acteur entre          {id, kind: pz|mon|swarm|mn|mnname|prop, mon, prop, at, dir, anim, enter, holo, mood}
     move    il se déplace            {id, to, speed, face, wait}
     face    il se tourne             {id, dir | to}
     anim    il joue une pose         {id, a, loop, wait}
     emote   un signe au-dessus       {id, e}
     hop     il saute                 {id, n}
     tremble il tremble               {id, ms}
     gone    il sort                  {id, how: fade|scatter|tear|cut}
     cam     la caméra                {to, z, ms, wait}
     light   la lumière               {k, ms}
     swarm   l'archiviste agit        {id, do: speak|calm|unstable|collapse|form}
     ball    une Poké Ball lancée     {from, to, ms, catch, miss}
     wl      un texte du monde        {id, k, text, lines, at, on}
     defrag  la mémoire se recompose  {n, ms}
     erase   l'image s'efface ligne à ligne {ms, from, to}
     letters des lettres qui se mélangent {text, at, ms, on}
   ============================================================ */

const PL_SET_CACHE = {};
const PL_PROPS = {};        /* les accessoires (37e) */
const PL_SETS = {};         /* les décors (37e) */
const PL_EMOTES = ["!", "?", "…", "sweat", "note", "anger", "spark", "tear", "bin", "spiral", "glitch", "zz", "heart"];
const PL_LIGHTS = ["none", "day", "dusk", "night", "dim", "clean", "rift", "warm", "dark", "cold", "heat"];
const PL_KINDS = ["pz", "mon", "swarm", "mn", "mnname", "prop"];
const PL_BEATS = ["set", "plat", "put", "move", "face", "anim", "emote", "hop", "tremble", "gone", "cam", "light",
  "swarm", "ball", "wl", "defrag", "erase", "letters"];
const PL_WL = ["win", "file", "count", "sysq", "log", "tag"];
/* les anciens décors, devenus des lieux peints */
const PL_BG = {labo:["labo", "warm"], terminal:["terminal", ""], faille:["faille", ""], souvenir:["labo", "souvenir"], zero:["zero", ""]};

/* un hasard reproductible : un décor se peint toujours pareil */
function plRng(seed){
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function plHash(s){ let h = 2166136261; for(const ch of String(s)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const plEase = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
const plCalm = () => typeof calmFx === "function" && calmFx();

/* ---------- la petite police du monde (3 x 5) ----------
   Pour ce qui s'écrit DANS le décor : « 12% » sur un moniteur, un
   panneau, un compteur. Les textes longs passent par la couche cn-wl. */
const PL_FONT = {
  "A":"010101111101101","B":"110101110101110","C":"011100100100011","D":"110101101101110","E":"111100110100111",
  "F":"111100110100100","G":"011100101101011","H":"101101111101101","I":"111010010010111","J":"001001001101010",
  "K":"101101110101101","L":"100100100100111","M":"101111111101101","N":"110101101101101","O":"010101101101010",
  "P":"110101110100100","Q":"010101101111011","R":"110101110101101","S":"011100010001110","T":"111010010010010",
  "U":"101101101101111","V":"101101101101010","W":"101101111111101","X":"101101010101101","Y":"101101010010010",
  "Z":"111001010100111","0":"111101101101111","1":"010110010010111","2":"110001010100111","3":"110001010001110",
  "4":"101101111001001","5":"111100110001110","6":"011100111101111","7":"111001010010010","8":"111101111101111",
  "9":"111101111001110","%":"101001010100101",".":"000000000000010",",":"000000000010100",":":"000010000010000",
  ">":"100010001010100","<":"001010100010001","-":"000000111000000","!":"010010010000010","?":"110001010000010",
  "/":"001001010100100","'":"010010000000000","#":"101111101111101","_":"000000000000111","+":"000010111010000",
  "(":"010100100100010",")":"010001001001010","=":"000111000111000","█":"111111111111111","▒":"101010101010101",
  "…":"000000000000101"," ":"000000000000000"
};
function plTextW(t, s){ return (Array.from(String(t)).length * 4 - 1) * (s || 1); }
/* écrit en pixels ; s : la taille d'un pixel de la police */
function plText(x, t, X, Y, col, s){
  s = s || 1;
  const str = Array.from(String(t).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  x.fillStyle = col;
  let cx = Math.round(X);
  for(const ch of str){
    const g = PL_FONT[ch] || PL_FONT["?"];
    for(let i = 0; i < 15; i++) if(g[i] === "1") x.fillRect(cx + (i % 3) * s, Math.round(Y) + Math.floor(i / 3) * s, s, s);
    cx += 4 * s;
  }
}

/* ---------- les poses de Porygon-Z (embarquées) et celles des autres (planches PMD) ---------- */
const PZX_IMG = {};
function pzxImg(anim){
  if(typeof PZX === "undefined" || !PZX[anim]) return null;
  let im = PZX_IMG[anim];
  if(!im){ if(typeof Image === "undefined") return null; im = PZX_IMG[anim] = new Image(); im.src = PZX[anim].u; }
  return im.complete && im.naturalWidth ? im : null;
}
/* la planche d'une pose : {img, fw, fh, n, dur} ; à défaut, la marche, puis rien */
function plSheet(id, anim, variant){
  variant = variant || "n";
  if(id === 474 && typeof PZX !== "undefined"){
    const P = PZX[anim] ? anim : "idle", img = pzxImg(P);
    if(img) return {img, fw:PZX[P].fw, fh:PZX[P].fh, n:PZX[P].n, dur:PZX[P].dur};
  }
  try {
    if(anim !== "walk" && typeof PMD_ANIM !== "undefined" && PMD_ANIM[id] && PMD_ANIM[id][anim] && typeof brAnimSheet === "function"){
      const img = brAnimSheet(id, anim, variant), m = PMD_ANIM[id][anim];
      if(img) return {img, fw:m[0], fh:m[1], n:m[2], dur:m[3]};
    }
    if(typeof PMD_META !== "undefined" && PMD_META[id] && typeof brPmdVariant === "function"){
      const img = brPmdVariant(id, variant), m = PMD_META[id];
      if(img) return {img, fw:m[0], fh:m[1], n:m[2], dur:m[3], walk:true};
    }
  } catch(e){}
  return null;
}
function plFrameAt(sh, el, loop){
  let tot = 0; for(const d of sh.dur) tot += d;
  let k = Math.floor(Math.max(0, el) * 60);
  if(loop) k %= Math.max(1, tot); else if(k >= tot) return sh.n - 1;
  for(let i = 0; i < sh.dur.length; i++){ if(k < sh.dur[i]) return i; k -= sh.dur[i]; }
  return sh.n - 1;
}
function plAnimLen(sh){ let tot = 0; for(const d of sh.dur) tot += d; return tot / 60; }
/* Dans les planches PMD, toutes les poses d'une espèce partagent le même repère :
   le centre de l'image. On mesure une fois, sur la marche, où tombent les pieds ;
   ceux qui volent (pieds au-dessus du centre) flottent au-dessus de leur ombre. */
const PL_MEAS = {};
function plMeasure(id){
  if(PL_MEAS[id]) return PL_MEAS[id];
  if(id === 474) return PL_MEAS[id] = {foot:6, top:-27};
  const sh = plSheet(id, "walk");
  if(!sh || !sh.walk) return {foot:6, top:-24};
  let r = {foot:6, top:-24};
  try {
    const cv = document.createElement("canvas"); cv.width = sh.fw; cv.height = sh.fh;
    const x = cv.getContext("2d"); x.drawImage(sh.img, 0, 0, sh.fw, sh.fh, 0, 0, sh.fw, sh.fh);
    const d = x.getImageData(0, 0, sh.fw, sh.fh).data;
    let y0 = sh.fh, y1 = -1;
    for(let y = 0; y < sh.fh; y++) for(let X = 0; X < sh.fw; X++) if(d[(y * sh.fw + X) * 4 + 3] > 40){ if(y < y0) y0 = y; if(y > y1) y1 = y; }
    if(y1 >= 0){ const f = y1 - sh.fh / 2 + 1; r = {foot:f >= 3 ? Math.min(14, f) : 6, top:y0 - sh.fh / 2}; }
  } catch(e){}
  return PL_MEAS[id] = r;
}
/* les planches d'une scène se chargent avant qu'on en ait besoin */
function plPreload(ids){
  for(const id of ids){
    if(id === 474){ for(const k in (typeof PZX !== "undefined" ? PZX : {})) pzxImg(k); continue; }
    try { if(typeof brPmdEntry === "function") brPmdEntry(id);
      for(const a of ["idle", "hurt", "attack", "charge", "shoot"]) if(typeof brAnimSheet === "function") brAnimSheet(id, a, "n"); } catch(e){}
  }
}

/* ============================================================
   LE CYCLE DE VIE
   ============================================================ */
function plMake(c){
  if(c.pl) return c.pl;
  return c.pl = {on:false, set:null, prev:null, prevT:0, W:0, H:0, s:2, cw:0, ch:0, cam:{x:0, y:0, z:1}, camA:null,
    act:new Map(), parts:[], lbl:new Map(), light:{k:"none", from:"none", t0:0, ms:1}, mem:false, memHoles:0,
    t:0, last:0, raf:0, shake:0, erase:null, defrag:null, letters:null, grainT:0, tearT:0, follow:null};
}
function plStage(){ return document.getElementById("cn-stage"); }
function plEnsure(c){
  const P = plMake(c);
  if(P.on || P.dead) return P;
  P.cvW = document.getElementById("cn-world"); P.cvO = document.getElementById("cn-over"); P.cvG = document.getElementById("cn-grain");
  if(!P.cvW || !P.cvW.getContext || !P.cvO || !P.cvO.getContext){ P.dead = true; return P; }
  P.xW = P.cvW.getContext("2d"); P.xO = P.cvO.getContext("2d"); P.xG = P.cvG && P.cvG.getContext ? P.cvG.getContext("2d") : null;
  if(!P.xW || !P.xO){ P.dead = true; return P; }
  P.on = true; P.last = 0;
  const st = plStage(); if(st) st.classList.add("pl-on");
  plFit(c);
  const loop = () => { if(!cineAlive(c) || !P.on) return; try { plTick(c); } catch(e){ console.error(e); } P.raf = requestAnimationFrame(loop); };
  P.raf = requestAnimationFrame(loop);
  return P;
}
function plStop(c){
  const P = c && c.pl; if(!P) return;
  P.on = false; cancelAnimationFrame(P.raf);
  const st = plStage(); if(st) st.classList.remove("pl-on", "pl-mem");
  const wl = document.getElementById("cn-wl"); if(wl) wl.innerHTML = "";
  P.act.clear(); P.parts.length = 0; P.lbl.clear();
}
function plFit(c){
  const P = c.pl, st = plStage(); if(!st || !P.cvW) return;
  const r = st.getBoundingClientRect ? st.getBoundingClientRect() : {width:390, height:700};
  const w = Math.max(160, Math.round(r.width || 390)), h = Math.max(240, Math.round(r.height || 700));
  if(w === P.cw && h === P.ch) return;
  const s = Math.max(2, Math.round(w / 210));
  P.cw = w; P.ch = h; P.s = s; P.W = Math.ceil(w / s); P.H = Math.ceil(h / s);
  P.cvW.width = P.cvO.width = w; P.cvW.height = P.cvO.height = h;
  if(P.cvG){ P.cvG.width = Math.ceil(w / 2); P.cvG.height = Math.ceil(h / 2); }
  for(const x of [P.xW, P.xO]) x.imageSmoothingEnabled = false;
  if(P.set) plPaint(c, P.set);
}

/* ============================================================
   LES DÉCORS
   ============================================================ */
function plPaint(c, S0){
  const P = c.pl, def = PL_SETS[S0.k]; if(!def) return;
  const sw = Math.round(P.W * (def.sw || 1)), sh = Math.round(P.H * (def.sh || 1));
  const key = S0.k + "|" + (S0.v || "") + "|" + sw + "x" + sh;
  let C = PL_SET_CACHE[key];
  if(!C){
    const cv = document.createElement("canvas"); cv.width = sw; cv.height = sh;
    const x = cv.getContext("2d"); x.imageSmoothingEnabled = false;
    const R = plRng(plHash(key));
    let info = {};
    try { info = def.paint(x, sw, sh, R, S0.v || "", plKit(x, R, sw, sh)) || {}; } catch(e){ console.error(e); }
    C = PL_SET_CACHE[key] = {cv, sw, sh, info};
    /* un décor par variante et par taille : on garde les derniers seulement */
    const keys = Object.keys(PL_SET_CACHE); if(keys.length > 14) delete PL_SET_CACHE[keys[0]];
  }
  S0.cv = C.cv; S0.sw = C.sw; S0.sh = C.sh; S0.info = C.info; S0.def = def;
}
/* une ancre du décor (nom), un acteur (id), ou un point [fx, fy] en fractions du décor */
function plAt(c, at){
  const P = c.pl, S0 = P.set || {sw:P.W, sh:P.H, info:{}, def:{}};
  if(Array.isArray(at)) return {x:at[0] * S0.sw, y:at[1] * S0.sh};
  if(typeof at === "string"){
    /* une ancre du décor d'abord (un acteur peut porter le même nom qu'elle), puis un acteur */
    const an = (S0.info && S0.info.anchors && S0.info.anchors[at]) || (S0.def && S0.def.anchors && S0.def.anchors[at]);
    if(an) return {x:an[0] * S0.sw, y:an[1] * S0.sh};
    const a = P.act.get(at); if(a) return {x:a.x, y:a.y};
  }
  return {x:S0.sw / 2, y:S0.sh * 0.64};
}
async function plSetBeat(c, b){
  const P = plEnsure(c); if(P.dead) return;
  const S0 = {k:b.k, v:b.v || "", t0:P.t, st:Object.assign({t0:P.t}, b.st || {})};
  plPaint(c, S0);
  if(!S0.cv) return;
  if(P.set && !b.cut){ P.prev = P.set; P.prevT = P.t; } else P.prev = null;
  P.set = S0;
  /* un nouveau décor : les acteurs du précédent s'en vont, sauf ceux qu'on garde */
  const keep = b.keep === true ? null : (b.keep || []);
  if(keep){ for(const id of [...P.act.keys()]) if(!keep.includes(id)) P.act.delete(id); if(!b.keep) P.parts.length = 0; plLblClear(c); }
  const cam = b.cam || {};
  const p = plAt(c, cam.at || S0.def.cam || [0.5, 0.5]);
  P.cam = {x:p.x, y:p.y, z:cam.z || 1}; P.camA = null; P.follow = null;
  P.erase = null; P.letters = null;
  plLight(c, b.light || S0.def.light || "none", b.cut ? 0 : 600);
  if(b.mem !== undefined) plMem(c, !!b.mem);
  if(b.holes !== undefined) P.memHoles = b.holes;
  const st = plStage();
  if(st){ st.style.setProperty("--plscan", String(S0.def.scan !== undefined ? S0.def.scan : 0.05));
    st.style.setProperty("--plsep", String(b.sep !== undefined ? b.sep : S0.def.sep !== undefined ? S0.def.sep : 0.84)); }
  if(b.wait !== false) await cineSleep(c, b.cut ? 60 : 420);
}
function plMem(c, on){
  const P = plMake(c); P.mem = on;
  const st = plStage(); if(st) st.classList.toggle("pl-mem", on);
}

/* ============================================================
   LES ACTEURS
   ============================================================ */
function plActor(c, b){
  const P = plEnsure(c); if(P.dead) return null;
  const p = plAt(c, b.at);
  const a = {id:b.id, kind:b.kind, mon:b.kind === "pz" ? 474 : (b.mon || 0), prop:b.prop || null, x:p.x + (b.dx || 0), y:p.y + (b.dy || 0),
    dir:b.dir !== undefined ? plDir(b.dir) : 0, anim:b.anim || "idle", a0:P.t, loop:b.loop !== false, alpha:b.alpha !== undefined ? b.alpha : 1,
    hop:0, hopV:0, hops:0, trem:0, emote:null, path:null, fade:null, holo:!!b.holo, o:b, born:P.t,
    sink:0, still:false, variant:b.variant || "n", size:b.size || 56, zb:b.zb || 0, data:b.data || {}};
  if(b.sil) a.sil = b.sil;
  if(b.kind === "swarm") a.sw = swarmMake(a, b);
  else if(b.enter === "assemble") a.asm = P.t;
  else if(b.enter === "drop"){ a.hop = 70; a.hopV = 0; }
  else if(b.enter !== "cut"){ const to = a.alpha; a.alpha = 0; a.fade = {from:0, to, t0:P.t, ms:0.5}; }
  if(b.kind === "prop" && PL_PROPS[b.prop] && PL_PROPS[b.prop].make) try { PL_PROPS[b.prop].make(a, c); } catch(e){}
  P.act.set(b.id, a);
  if(a.mon) plPreload([a.mon]);
  /* il entre en marchant, depuis le bord */
  if(b.to){ const q = plAt(c, b.to); if(a.kind === "pz" || a.kind === "mon") plSetAnim(a, "walk", true, P.t); a.path = {x:q.x, y:q.y, speed:b.speed || 34, face:b.face !== undefined ? plDir(b.face) : undefined}; }
  return a;
}
const PL_DIRS = {down:0, "down-right":1, right:2, "up-right":3, up:4, "up-left":5, left:6, "down-left":7, cam:0};
function plDir(d){ return typeof d === "number" ? ((d % 8) + 8) % 8 : (PL_DIRS[d] !== undefined ? PL_DIRS[d] : 0); }
function plDirTo(a, bx, by){
  const dx = bx - a.x, dy = by - a.y;
  if(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return a.dir;
  return typeof brDir8 === "function" ? brDir8(dx, dy, a.dir) : 0;
}
function plSetAnim(a, anim, loop, t){ a.anim = anim; a.a0 = t; a.loop = loop !== false; }

/* l'humeur de Porygon-Z se voit dans son corps : chaque émotion a son geste */
const PL_MOOD = {
  Normal:    () => ({}),
  Happy:     () => ({bounce:1}),
  Joyous:    () => ({anim:"hop", emote:"note"}),
  Determined:() => ({anim:"charge"}),
  Worried:   () => ({emote:"sweat"}),
  Sad:       () => ({sink:3, slow:true}),
  Angry:     () => ({emote:"anger", trem:0.45}),
  Surprised: () => ({anim:"rearup", emote:"!"}),
  Stunned:   () => ({emote:"…", still:true}),
  Pain:      () => ({anim:"hurt", trem:0.5, hold:0.5}),
  Crying:    () => ({emote:"tear", sink:4, slow:true}),
  Shouting:  () => ({anim:"attack", emote:"!", trem:0.3}),
  Teary:     () => ({emote:"tear", sink:2}),
  Inspired:  () => ({anim:"charge", emote:"spark"}),
  Dizzy:     () => ({anim:"rotate", emote:"spiral"}),
  Sigh:      () => ({emote:"…", sink:2}),
  Lucid:     () => ({})
};
function plActMood(c, a, mood){
  if(!a || a.kind !== "pz") return;
  const P = c.pl, f = PL_MOOD[mood] || PL_MOOD.Normal, m = f();
  a.sink = m.sink || 0; a.slow = !!m.slow; a.still = !!m.still;
  if(a.path) { if(m.emote) plEmote(c, a, m.emote); return; }   /* il marche : il garde sa marche */
  if(m.anim){ plSetAnim(a, m.anim, false, P.t); a.then = "idle"; a.hold = m.hold || 0; }
  else if(a.anim !== "idle"){ plSetAnim(a, "idle", true, P.t); a.then = null; }
  if(m.bounce) plHop(a, 1, 5);
  if(m.trem) a.trem = Math.max(a.trem, m.trem);
  if(m.emote) plEmote(c, a, m.emote);
}
function plHop(a, n, h){ a.hops = (a.hops || 0) + (n || 1); a.hopH = h || 9; if(a.hop <= 0.01 && !a.hopV){ a.hopV = Math.sqrt(2 * 420 * a.hopH); a.hops--; } }
function plEmote(c, a, e){ if(!a) return; a.emote = {k:e, t0:c.pl.t}; try { if(e === "!") Sfx.click(); } catch(err){} }

/* ---------- l'archiviste : une forme de pixels ----------
   Pas de visage, pas de casquette. Quelqu'un debout, mince, les bras le
   long du corps, fait des octets du nom du joueur (le motif de MissingNo,
   relu autrement), bordé de cyan à gauche et de magenta à droite, comme
   la fêlure. Il perd des pixels qui s'envolent et s'éteignent, et ils
   reviennent, réécrits. Quand il parle, il se défait davantage. Il ne
   tient jamais tout à fait. */
const SW_MAP = [
  "......####......", ".....######.....", ".....######.....", ".....######.....", ".....######.....", "......####......",
  ".......##.......", "....########....", "...##########...", "...##########...", "..############..", "..############..",
  "..############..", "..############..", "..############..", "..############..", "..############..", "..############..",
  "..############..", "..############..", ".##############.", ".##############.", ".##############.", ".##############.",
  ".##############.", ".##############.", ".##############.", ".######..######.", "..#####..#####..", "...####..####...",
  "....###..###....", "....###..###....", "....###..###....", "....###..###....", "....###..###....", "...####..####..."];
const SW_W = 16, SW_H = SW_MAP.length;
const SW_PAL = {
  n:  {rimL:"#35f0d6", rimR:"#ff3d7f", top:"#3a3058", dark:"#140d26", hiL:"#9ff7ea", hiR:"#ffb3cc"},
  gb: {rimL:"#306230", rimR:"#306230", top:"#0f380f", dark:"#0f380f", hiL:"#8bac0f", hiR:"#8bac0f"}
};
const SW_COLC = {};
function swarmColors(name, pal){
  const key = (name || "?") + "|" + (pal || "");
  return SW_COLC[key] || (SW_COLC[key] = swarmColorsMake(name, pal));
}
function swarmColorsMake(name, pal){
  /* la texture vient du nom : les mêmes octets que le L de MissingNo */
  let src = null;
  try { const cv = typeof nameSpriteCanvas === "function" ? nameSpriteCanvas(name) : null;
    if(cv && cv.getContext) src = cv.getContext("2d").getImageData(0, 0, 56, 56).data; } catch(e){ src = null; }
  const GB = ["#0f380f", "#306230", "#8bac0f"];
  const bytes = typeof nameBytes === "function" ? nameBytes(name || "?").concat([0x50]) : [0x80, 0x50];
  const PAL = ["#7e7a9a", "#b8346a", "#1c1830", "#140d26"];
  return (X, Y) => {
    if(src){
      const sx = Math.min(23, Math.floor(X * 24 / SW_W)), sy = Math.min(55, Math.floor(Y * 56 / SW_H)), i = (sy * 56 + sx) * 4;
      if(src[i + 3] > 20){
        if(pal === "gb"){ const l = (src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255; return GB[l > 0.45 ? 1 : 0]; }
        return `rgb(${src[i]},${src[i + 1]},${src[i + 2]})`;
      }
      return pal === "gb" ? GB[0] : PAL[3];
    }
    const v = bytes[(X * 7 + Y * 3) % bytes.length] >> ((X + Y) % 4);
    return pal === "gb" ? GB[v % 3] : PAL[v & 3];
  };
}
function plShade(r, g, b, k){ const f = v => Math.round(v).toString(16).padStart(2, "0"); return "#" + f(r * (1 - k) + 0x14 * k) + f(g * (1 - k) + 0x0d * k) + f(b * (1 - k) + 0x26 * k); }
function swarmMake(a, b){
  const name = typeof pzName === "function" ? pzName() : "?";
  const R = plRng(plHash("swarm|" + name + "|" + (b.seed || a.id)));
  const pal = SW_PAL[b.pal] || SW_PAL.n, col = swarmColors(name, b.pal), pts = [];
  const on = (X, Y) => X >= 0 && Y >= 0 && X < SW_W && Y < SW_H && SW_MAP[Y][X] === "#";
  const form = b.enter === "form" || b.enter === undefined;
  for(let Y = 0; Y < SW_H; Y++) for(let X = 0; X < SW_W; X++){
    if(!on(X, Y)) continue;
    let c2 = col(X, Y), rim = 0;
    if(b.pal !== "gb" && c2[0] === "r"){ const m = c2.match(/\d+/g); c2 = plShade(+m[0], +m[1], +m[2], 0.55); }
    if(!on(X - 1, Y)){ c2 = pal.rimL; rim = 1; } else if(!on(X + 1, Y)){ c2 = pal.rimR; rim = 2; } else if(!on(X, Y - 1)) c2 = pal.top;
    const ang = R() * Math.PI * 2, dist = 16 + R() * 40;
    pts.push({hx:X - SW_W / 2, hy:Y - SW_H, c:c2, rim,
      st: form ? 4 : (R() < 0.06 ? 2 : 0), x:0, y:0, vx:0, vy:0, life:0, max:1, wait:R() * 0.8,
      fx:Math.cos(ang) * dist, fy:Math.sin(ang) * dist - 14, fd:R() * 0.7});
  }
  if(b.hollow) for(const p of pts) if(!p.rim && p.c !== pal.top) p.hollow = true;
  return {pts, R, pal, rate:b.rate !== undefined ? b.rate : 0.1, speak:0, dead:false, unstable:0};
}
function swarmTick(c, a, dt){
  const S0 = a.sw, R = S0.R, calm = plCalm();
  if(S0.speak > 0) S0.speak -= dt;
  if(S0.unstable > 0) S0.unstable -= dt;
  const rate = S0.dead ? 0 : (S0.speak > 0 ? 0.42 : S0.unstable > 0 ? 0.9 : S0.rate) * (calm ? 0.5 : 1);
  let alive = 0;
  for(const p of S0.pts){
    if(p.st === 0){
      alive++;
      if(R() < rate * dt){ p.st = 1; p.x = p.hx; p.y = p.hy; p.vx = (R() - 0.5) * 10; p.vy = -(5 + R() * 11); p.max = p.life = 0.6 + R() * 1.1; }
    } else if(p.st === 1){
      alive++;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx += (R() - 0.5) * 30 * dt; p.vy -= 3 * dt;
      p.life -= dt;
      if(p.life <= 0){ if(S0.dead){ p.st = 9; continue; } p.st = 2; p.wait = 0.25 + R() * 1.1; }
    } else if(p.st === 2){
      if(!S0.dead){ alive++; p.wait -= dt; if(p.wait <= 0){ p.st = 3; p.app = 0.16; } }
    } else if(p.st === 3){
      alive++;
      p.app -= dt; if(p.app <= 0) p.st = 0;
    } else if(p.st === 4){
      /* il se forme : chaque pixel arrive de loin, chacun à son heure */
      alive++;
      p.fd -= dt * 0.9;
      if(p.fd <= -1) p.st = 0;
    } else if(p.st === 5){
      /* il se tasse : chaque pixel glisse vers sa place dans le L */
      alive++;
      p.k = Math.min(1, (p.k || 0) + dt / (0.9 + p.fd));
      if(p.k >= 1) p.st = 6;
    } else if(p.st === 6) alive++;
  }
  if(S0.dead && !alive) c.pl.act.delete(a.id);
}
function swarmDraw(x, c, a){
  const S0 = a.sw, t = c.pl.t, calm = plCalm(), pal = S0.pal;
  const ox = a.x, oy = a.y - (a.hop || 0);
  const jitRow = !calm && Math.floor(t * 7) % 9 === 0 ? Math.floor((Math.sin(t * 91) + 1) * SW_H / 2) - SW_H : 999;
  const al = a.alpha * (calm ? 1 : 0.88 + 0.12 * Math.sin(t * 11 + a.born));
  /* une ombre, à peine : il est là, sans peser tout à fait */
  if(S0.pts.some(p=>p.st === 0)){ x.globalAlpha = 0.18 * a.alpha; x.fillStyle = "#000"; x.beginPath(); x.ellipse(ox, a.y, 7, 2, 0, 0, 7); x.fill(); }
  for(const p of S0.pts){
    let X, Y, A = al, col = p.c;
    if(p.hollow) continue;
    if(p.st === 0){
      X = p.hx; Y = p.hy;
      if(!calm && p.rim && S0.speak > 0 && Math.sin(t * 20 + p.hy) > 0.6) col = p.rim === 1 ? pal.hiL : pal.hiR;
      if(Y === jitRow || Y === jitRow + 1) X += (Math.sin(t * 50) > 0 ? 1 : -1);
    } else if(p.st === 1){ X = p.x; Y = p.y; A *= Math.max(0, p.life / p.max); }
    else if(p.st === 3){ X = p.hx; Y = p.hy; col = p.rim === 2 ? pal.hiR : pal.hiL; }
    else if(p.st === 4){
      const k = plEase(Math.max(0, Math.min(1, -p.fd)));
      X = p.hx + p.fx * (1 - k); Y = p.hy + p.fy * (1 - k); A *= 0.3 + 0.7 * k;
    } else if(p.st === 5 || p.st === 6){
      const k = plEase(p.st === 6 ? 1 : p.k);
      X = p.hx + (p.lx - p.hx) * k; Y = p.hy + (p.ly - p.hy) * k;
      x.globalAlpha = A; x.fillStyle = k > 0.6 ? p.lc : col;
      const s = k > 0.5 ? 2 : 1;
      x.fillRect(Math.round(ox + X), Math.round(oy + Y), s, s);
      continue;
    } else continue;
    x.globalAlpha = A; x.fillStyle = col;
    x.fillRect(Math.round(ox + X), Math.round(oy + Y), 1, 1);
  }
  x.globalAlpha = 1;
}
/* il se tasse en L : ses pixels gagnent les places du MissingNo tiré du nom, à sa taille de 56 */
function swarmCollapse(c, a){
  const S0 = a.sw, R = S0.R, L = [];
  try {
    const cv = typeof nameSpriteCanvas === "function" ? nameSpriteCanvas(pzName()) : null;
    if(cv && cv.getContext){
      const d = cv.getContext("2d").getImageData(0, 0, 56, 56).data;
      for(let y = 0; y < 56; y += 2) for(let X = 0; X < 56; X += 2){
        const i = (y * 56 + X) * 4;
        if(d[i + 3] > 20) L.push([X - 28, y - 56 - 4, `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`]);
      }
    }
  } catch(e){}
  if(!L.length) for(let y = 0; y < 56; y += 2) for(let X = 0; X < 56; X += 2) if(X < 24 || y >= 40) L.push([X - 28, y - 60, "#7e7a9a"]);
  const n = S0.pts.length, used = new Set();
  S0.pts.forEach((p, i)=>{ const j = Math.floor(i * L.length / n), q = L[j]; used.add(j);
    if(p.st === 1){ p.hx = p.x; p.hy = p.y; }
    p.lx = q[0]; p.ly = q[1]; p.lc = q[2]; p.st = 5; p.k = 0; p.fd = R() * 0.7; });
  /* il manque des pixels au L : ils viennent d'en haut, un peu plus tard */
  L.forEach((q, j)=>{ if(used.has(j)) return;
    S0.pts.push({hx:q[0] + (R() - 0.5) * 30, hy:q[1] - 30 - R() * 30, lx:q[0], ly:q[1], c:"#ffffff", lc:q[2], st:5, k:0, fd:0.5 + R() * 0.9, rim:0}); });
  S0.dead = false; S0.rate = 0;
}

/* ---------- le jeu des acteurs, image par image ---------- */
function plTickActor(c, a, dt){
  const P = c.pl;
  if(a.fade){
    const k = Math.min(1, (P.t - a.fade.t0) / a.fade.ms);
    a.alpha = a.fade.from + (a.fade.to - a.fade.from) * k;
    if(k >= 1){ const f = a.fade; a.fade = null; if(f.kill){ P.act.delete(a.id); return; } }
  }
  if(a.path){
    const p = a.path, dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy), step = p.speed * dt;
    if(d <= step || c.ff){
      a.x = p.x; a.y = p.y; a.path = null;
      if(a.kind === "pz" || a.kind === "mon") plSetAnim(a, "idle", true, P.t);
      if(p.face !== undefined) a.dir = p.face;
      if(p.done) p.done();
    }
    else { a.x += dx / d * step; a.y += dy / d * step; if(a.kind !== "swarm" && a.kind !== "prop") a.dir = plDirTo(a, p.x, p.y); }
  }
  /* les sauts : une petite parabole, autant de fois que demandé */
  if(a.hop > 0 || a.hopV){
    a.hop += a.hopV * dt; a.hopV -= 420 * dt;
    if(a.hop <= 0){ a.hop = 0; a.hopV = 0; if(a.hops > 0){ a.hops--; a.hopV = Math.sqrt(2 * 420 * (a.hopH || 9)); } }
  }
  if(a.trem > 0) a.trem -= dt;
  if(a.flick > 0){ a.flick -= dt; a.alpha = a.flick <= 0 ? (a.flickTo || 1) : (plCalm() ? 0.55 : (Math.random() < 0.5 ? 0.15 : 0.9)); }
  /* une pose jouée une fois rend la main à la pose de repos */
  if(a.then && !a.loop && (a.kind === "pz" || a.kind === "mon")){
    const sh = plSheet(a.mon, a.anim, a.variant);
    if(!sh || sh.walk || P.t - a.a0 >= plAnimLen(sh) + (a.hold || 0)){ plSetAnim(a, a.then, true, P.t); a.then = null; a.hold = 0; }
  }
  /* Porygon-Z ne reste pas figé pendant qu'on lit : de temps en temps, il jette un œil à côté */
  if(a.kind === "pz" && !a.path && !a.talk && a.anim === "idle" && !a.still && !plCalm()){
    if(!a.nextLook) a.nextLook = P.t + 5 + Math.random() * 4;
    if(a.look && P.t > a.look.until){ a.dir = a.look.prev; a.look = null; a.nextLook = P.t + 6 + Math.random() * 5; }
    else if(!a.look && P.t > a.nextLook){ a.look = {prev:a.dir, until:P.t + 1.1}; a.dir = (a.dir + (Math.random() < 0.5 ? 1 : 7)) % 8; }
  }
  if(a.kind === "swarm") swarmTick(c, a, dt);
  if(a.kind === "prop" && PL_PROPS[a.prop] && PL_PROPS[a.prop].tick) try { PL_PROPS[a.prop].tick(a, c, dt); } catch(e){}
}
function plDrawMon(x, c, a){
  const P = c.pl, sh = plSheet(a.mon, a.anim, a.variant), M = plMeasure(a.mon);
  const hop = a.hop || 0, calm = plCalm();
  const tx = a.trem > 0 && !calm ? (Math.sin(P.t * 70) > 0 ? 1 : -1) : 0;
  const bob = a.talk && !calm ? (Math.sin(P.t * 14) > 0.3 ? -1 : 0) : 0;
  /* l'ombre reste au sol, même quand il saute */
  x.globalAlpha = 0.3 * a.alpha * (1 - Math.min(0.6, hop / 40));
  x.fillStyle = "#000"; x.beginPath(); x.ellipse(a.x, a.y, a.mon === 474 ? 6 : Math.max(6, Math.min(16, (sh ? sh.fw : 32) * 0.22)), 2.2, 0, 0, 7); x.fill();
  /* la projection : Porygon-Z, dans le présent, est un programme qu'on affiche */
  if(a.holo && a.alpha > 0.05){
    const pul = calm ? 0.8 : 0.7 + 0.3 * Math.sin(P.t * 3 + a.born);
    x.globalAlpha = a.alpha * 0.55 * pul;
    x.fillStyle = "#35f0d6"; x.fillRect(Math.round(a.x - 9), Math.round(a.y), 18, 1);
    x.globalAlpha = a.alpha * 0.22 * pul; x.fillRect(Math.round(a.x - 12), Math.round(a.y) - 1, 24, 3);
    x.globalAlpha = a.alpha * 0.06 * pul;
    for(let i = 0; i < 6; i++) x.fillRect(Math.round(a.x - 9 + i * 3 + (calm ? 0 : P.t * 4 % 3)), Math.round(a.y - 30), 1, 30);
  }
  x.globalAlpha = a.alpha;
  if(sh){
    const el = (P.t - a.a0) * (a.slow ? 0.6 : 1);
    const f = a.still ? 0 : (sh.walk && a.anim !== "walk" ? Math.floor(P.t * 2 + a.born) % 2 * Math.min(1, sh.n - 1) : plFrameAt(sh, el, a.loop));
    const rows = Math.max(1, (sh.img.height / sh.fh) | 0), row = Math.min(a.dir, rows - 1);
    const dx = a.x - sh.fw / 2 + tx, dy = a.y - M.foot - hop + (a.sink || 0) + bob - sh.fh / 2;
    if(a.asm !== undefined && P.t - a.asm < 1.1 && !c.ff){
      /* il s'assemble : ses lignes arrivent de côté, une à une */
      const k = Math.max(0, (P.t - a.asm) / 1.1), R = plRng(plHash(a.id) + Math.floor(P.t * 30));
      for(let yy = 0; yy < sh.fh; yy++){
        const kk = plEase(Math.min(1, Math.max(0, k * 1.6 - (1 - yy / sh.fh) * 0.6)));
        if(kk <= 0) continue;
        x.globalAlpha = a.alpha * kk;
        const off = (1 - kk) * (R() < 0.5 ? -1 : 1) * (8 + R() * 18);
        x.drawImage(sh.img, f * sh.fw, row * sh.fh + yy, sh.fw, 1, dx + off, dy + yy, sh.fw, 1);
      }
      x.globalAlpha = 1;
      return;
    }
    if(a.asm !== undefined) a.asm = undefined;
    if(a.sil){
      const sc = plScratch(sh.fw, sh.fh), sx = sc.getContext("2d");
      sx.globalCompositeOperation = "source-over"; sx.clearRect(0, 0, sh.fw, sh.fh);
      sx.drawImage(sh.img, f * sh.fw, row * sh.fh, sh.fw, sh.fh, 0, 0, sh.fw, sh.fh);
      sx.globalCompositeOperation = "source-in"; sx.fillStyle = a.sil; sx.fillRect(0, 0, sh.fw, sh.fh);
      sx.globalCompositeOperation = "source-over";
      x.drawImage(sc, 0, 0, sh.fw, sh.fh, dx, dy, sh.fw, sh.fh);
      /* deux yeux, seulement */
      if(a.eyes){ x.fillStyle = a.eyes; const M2 = plMeasure(a.mon), ey = a.y - M2.foot + M2.top * 0.62 - hop; x.fillRect(Math.round(a.x - 3), Math.round(ey), 1, 1); x.fillRect(Math.round(a.x + 2), Math.round(ey), 1, 1); }
      x.globalAlpha = 1;
      return;
    }
    x.drawImage(sh.img, f * sh.fw, row * sh.fh, sh.fw, sh.fh, dx, dy, sh.fw, sh.fh);
    if(a.holo && !calm && Math.sin(P.t * 9 + a.born * 3) > 0.985){ x.globalAlpha = a.alpha * 0.35; x.drawImage(sh.img, f * sh.fw, row * sh.fh, sh.fw, sh.fh, dx + 2, dy, sh.fw, sh.fh); }
  } else if(typeof brSprite === "function"){
    const spr = brSprite(a.mon, a.variant === "c" ? "c" : "n");
    if(spr){ const s = 30; x.drawImage(spr, Math.round(a.x - s / 2 + tx), Math.round(a.y - hop - s + 4), s, s); }
  }
  x.globalAlpha = 1;
}
let PL_SCRATCH = null;
function plScratch(w, h){
  if(!PL_SCRATCH) PL_SCRATCH = document.createElement("canvas");
  if(PL_SCRATCH.width < w) PL_SCRATCH.width = w;
  if(PL_SCRATCH.height < h) PL_SCRATCH.height = h;
  return PL_SCRATCH;
}
function plHead(a){
  if(a.kind === "swarm") return a.y - SW_H - 7;
  if(a.kind === "mn" || a.kind === "mnname") return a.y - (a.size || 56) - 8;
  if(a.kind === "prop") return a.y - ((a.data && a.data.h) || 30) - 6;
  const M = plMeasure(a.mon);
  return a.y - M.foot + M.top - (a.hop || 0) + (a.sink || 0) - 5;
}
/* ---------- les signes : de petits pictogrammes, sans dessin animé ---------- */
const PL_EMO_ART = {
  "!":    ["11","11","11","11","00","11"],
  "?":    ["0110","1001","0001","0010","0000","0010"],
  "anger":["1001","0110","0110","1001"],
  "note": ["0011","0010","0010","1110","1110"],
  "spark":["00100","00100","11011","00100","00100"],
  "heart":["01010","11111","11111","01110","00100"],
  "spiral":["01110","10001","10101","10011","01110"],
  "glitch":["1101","0110","1011","0101"]
};
function plDrawEmote(x, c, a){
  const e = a.emote; if(!e) return;
  const P = c.pl, el = P.t - e.t0, dur = e.k === "…" ? 2.4 : e.k === "zz" ? 3.6 : e.k === "tear" ? 2.6 : 1.6;
  if(el > dur){ a.emote = null; return; }
  const hx = Math.round(a.x), hy = Math.round(plHead(a));
  const pop = el < 0.12 ? el / 0.12 : 1, fade = el > dur - 0.3 ? (dur - el) / 0.3 : 1;
  x.globalAlpha = Math.max(0, fade) * a.alpha;
  const art = (k, X, Y, col, s) => { const g = PL_EMO_ART[k]; if(!g) return;
    x.fillStyle = "#0a0612";
    g.forEach((r, j)=>{ for(let i = 0; i < r.length; i++) if(r[i] === "1") x.fillRect(X + i * s - 1, Y + j * s - 1, s + 2, s + 2); });
    x.fillStyle = col;
    g.forEach((r, j)=>{ for(let i = 0; i < r.length; i++) if(r[i] === "1") x.fillRect(X + i * s, Y + j * s, s, s); }); };
  if(e.k === "…"){
    const n = Math.min(3, Math.floor(el / 0.35) + 1);
    for(let i = 0; i < n; i++){ x.fillStyle = "#0a0612"; x.fillRect(hx - 6 + i * 4, hy - 1, 3, 3); x.fillStyle = "#e8eef5"; x.fillRect(hx - 5 + i * 4, hy, 1, 1); }
  } else if(e.k === "sweat"){
    const dy = Math.min(6, el * 10);
    x.fillStyle = "#0a0612"; x.fillRect(hx + 6, hy + 4 + dy, 3, 4);
    x.fillStyle = "#7fd0ff"; x.fillRect(hx + 7, hy + 4 + dy, 1, 2); x.fillRect(hx + 7, hy + 6 + dy, 1, 1);
  } else if(e.k === "tear"){
    for(let i = 0; i < 2; i++){ const k2 = ((el * 1.2 + i / 2) % 1); x.fillStyle = "#9fd8ff"; x.fillRect(hx - 3 + i * 6, hy + 12 + k2 * 9, 1, 2); }
  } else if(e.k === "bin"){
    for(let i = 0; i < 4; i++){ const k2 = ((el * 0.9 + i / 4) % 1); x.globalAlpha = fade * (1 - k2) * a.alpha; plText(x, i % 2 ? "1" : "0", hx - 7 + i * 4, hy - k2 * 12, "#35f0d6"); }
  } else if(e.k === "zz"){
    for(let i = 0; i < 3; i++){ const k2 = ((el * 0.5 + i / 3) % 1); x.globalAlpha = fade * (1 - k2) * a.alpha; plText(x, "Z", hx + 2 + k2 * 8, hy - k2 * 10, "#cfe9f2"); }
  } else if(e.k === "note"){
    art("note", hx + 2, hy - Math.round(pop * 3) - Math.round(el * 4), "#ffd24a", 1);
  } else if(e.k === "!"){
    art("!", hx - 2, hy - 3 - Math.round(pop * 2), "#ff5c5c", 2);
  } else art(e.k, hx - 3, hy - Math.round(pop * 2), e.k === "anger" ? "#ff3d4f" : e.k === "spark" ? "#fff6b0" : e.k === "spiral" ? "#cdb6ff" : e.k === "glitch" ? "#ff3d7f" : e.k === "heart" ? "#ff7aa8" : "#e8eef5", e.k === "?" ? 2 : 1);
  x.globalAlpha = 1;
}

/* ============================================================
   L'IMAGE
   ============================================================ */
function plTick(c){
  const P = c.pl;
  const now = performance.now(), dt = Math.min(0.05, P.last ? (now - P.last) / 1000 : 0.016); P.last = now;
  P.t += dt;
  plFit(c);
  /* la caméra glisse */
  if(P.camA){
    const A = P.camA, k = plEase(Math.min(1, (P.t - A.t0) / A.ms));
    P.cam.x = A.fx + (A.tx - A.fx) * k; P.cam.y = A.fy + (A.ty - A.fy) * k; P.cam.z = A.fz + (A.tz - A.fz) * k;
    if(k >= 1 || c.ff){ P.cam.x = A.tx; P.cam.y = A.ty; P.cam.z = A.tz; P.camA = null; }
  }
  if(P.follow){ const a = P.act.get(P.follow); if(a){ P.cam.x += (a.x - P.cam.x) * Math.min(1, dt * 2.5); P.cam.y += (a.y - 20 - P.cam.y) * Math.min(1, dt * 2.5); } }
  for(const a of [...P.act.values()]) plTickActor(c, a, dt);
  for(const p of P.parts){ p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; }
  if(P.parts.length) P.parts = P.parts.filter(p=>p.life > 0);
  if(P.shake > 0) P.shake = Math.max(0, P.shake - dt * 18);
  plDraw(c);
}
function plCamXf(c){
  const P = c.pl, S0 = P.set || {sw:P.W, sh:P.H}, z = P.cam.z || 1, k = P.s * z;
  /* la vue reste dans le décor */
  const hw = P.cw / 2 / k, hh = P.ch / 2 / k;
  const cx = S0.sw <= hw * 2 ? S0.sw / 2 : Math.max(hw, Math.min(S0.sw - hw, P.cam.x));
  const cy = S0.sh <= hh * 2 ? S0.sh / 2 : Math.max(hh, Math.min(S0.sh - hh, P.cam.y));
  const sh = P.shake > 0 && !plCalm() ? P.shake * P.s : 0;
  const ox = Math.round(P.cw / 2 - cx * k + (sh ? (Math.random() - 0.5) * sh : 0));
  const oy = Math.round(P.ch / 2 - cy * k + (sh ? (Math.random() - 0.5) * sh : 0));
  return {z, k, ox, oy};
}
function plDraw(c){
  const P = c.pl, x = P.xW, o = P.xO; if(!x) return;
  const cw = P.cw, ch = P.ch, T = plCamXf(c);
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, cw, ch);
  if(!P.set){ x.clearRect(0, 0, cw, ch); plDrawLabels(c, T); return; }
  x.fillStyle = "#000"; x.fillRect(0, 0, cw, ch);
  x.setTransform(T.k, 0, 0, T.k, T.ox, T.oy); o.setTransform(T.k, 0, 0, T.k, T.ox, T.oy);
  x.imageSmoothingEnabled = false; o.imageSmoothingEnabled = false;
  /* le décor, et le précédent qui s'efface */
  x.drawImage(P.set.cv, 0, 0);
  try { if(P.set.def.anim) P.set.def.anim(x, P.set.sw, P.set.sh, P.t, P.set.v, P, c, P.set.st || {}); } catch(e){}
  if(P.prev){
    const k = (P.t - P.prevT) / 0.45;
    if(k >= 1 || c.ff) P.prev = null;
    else { x.globalAlpha = 1 - k; x.drawImage(P.prev.cv, 0, 0); x.globalAlpha = 1; }
  }
  /* les acteurs, du plus loin au plus proche */
  const list = [...P.act.values()].sort((a, b)=>(a.y + a.zb) - (b.y + b.zb));
  for(const a of list){
    if(a.alpha <= 0.01) continue;
    if(a.kind === "pz" || a.kind === "mon") plDrawMon(x, c, a);
    else if(a.kind === "prop" && PL_PROPS[a.prop]) try { PL_PROPS[a.prop].draw(PL_PROPS[a.prop].over ? o : x, a, c); } catch(e){}
    else if(a.kind === "swarm") swarmDraw(o, c, a);
    else if(a.kind === "mn" || a.kind === "mnname") plDrawMn(o, c, a);
  }
  try { if(P.set.def.front) P.set.def.front(x, P.set.sw, P.set.sh, P.t, P.set.v, P, c, P.set.st || {}); } catch(e){}
  for(const p of P.parts){ const X = p.over ? o : x; X.globalAlpha = Math.max(0, Math.min(1, p.life / p.max)) * (p.a || 1); X.fillStyle = p.c; X.fillRect(Math.round(p.x), Math.round(p.y), p.s || 1, p.s || 1); }
  x.globalAlpha = o.globalAlpha = 1;
  for(const a of list) if(a.emote) plDrawEmote(a.kind === "swarm" || a.kind === "mn" || a.kind === "mnname" ? o : x, c, a);
  if(P.letters) plDrawLetters(c, o);
  /* la lumière, sur tout l'écran */
  x.setTransform(1, 0, 0, 1, 0, 0); o.setTransform(1, 0, 0, 1, 0, 0);
  plDrawLight(c, x, cw, ch);
  if(P.mem) plDrawMemFx(c, x, cw, ch);
  if(P.erase) plDrawErase(c, x, o, cw, ch);
  if(P.defrag) plDrawDefrag(c, o, cw, ch);
  plDrawLabels(c, T);
}
function plDrawMn(o, c, a){
  const P = c.pl;
  let src = null;
  if(a.kind === "mnname"){ if(!a.img && typeof Image !== "undefined" && typeof nameSprite === "function"){ a.img = new Image(); a.img.src = nameSprite(pzName()); } src = a.img; }
  else { const u = typeof mnFrame === "function" ? mnFrame(P.t * 1000) : null; if(u){ a.imgs = a.imgs || {}; if(!a.imgs[u]){ const im = new Image(); im.src = u; a.imgs[u] = im; } src = a.imgs[u]; } }
  if(!src || !src.complete || !src.naturalWidth) return;
  const s = a.size || 56, calm = plCalm(), jx = !calm && Math.sin(P.t * 23 + a.born) > 0.93 ? 2 : 0;
  const bob = calm ? 0 : Math.round(Math.sin(P.t * 1.6 + a.born) * 1.5);
  const X = a.x - s / 2, Y = a.y - s - 4 + bob - (a.hop || 0);
  /* une ombre trouble au sol : il n'a pas de pieds, mais il pèse */
  o.globalAlpha = 0.28 * a.alpha; o.fillStyle = "#000"; o.beginPath(); o.ellipse(a.x, a.y, s * 0.3, 2.5, 0, 0, 7); o.fill();
  o.globalAlpha = a.alpha;
  if(a.collapse !== undefined){
    /* il s'effondre : une colonne de tuiles qui ne savent plus quoi représenter */
    const k = Math.min(1, (P.t - a.collapse) / 1.6), n = 8, hN = src.naturalHeight / n;
    for(let i = 0; i < n; i++){
      const dy = Y + i * s / n + k * k * (n - i) * 5, dx = X + (i % 2 ? 1 : -1) * k * 3;
      o.globalAlpha = a.alpha * (1 - k * 0.6);
      o.drawImage(src, 0, i * hN, src.naturalWidth, hN, dx, dy, s, s / n);
    }
  } else {
    if(a.kind === "mn" && jx){ o.globalAlpha = a.alpha * 0.5; o.drawImage(src, X - 3, Y, s, s); o.globalAlpha = a.alpha; }
    if(a.kind === "mnname" && !calm){
      /* lu, il garde ses franges : la faille d'un côté, le système de l'autre */
      o.globalAlpha = a.alpha * 0.3; o.globalCompositeOperation = "lighter";
      o.drawImage(src, X - 1, Y, s, s); o.drawImage(src, X + 1, Y, s, s);
      o.globalCompositeOperation = "source-over"; o.globalAlpha = a.alpha;
    }
    if(a.talk && !calm && Math.sin(P.t * 30) > 0.5){ o.drawImage(src, 0, 0, src.naturalWidth, src.naturalHeight / 2, X + jx + 2, Y, s, s / 2); o.drawImage(src, 0, src.naturalHeight / 2, src.naturalWidth, src.naturalHeight / 2, X + jx, Y + s / 2, s, s / 2); }
    else o.drawImage(src, X + jx, Y, s, s);
  }
  o.globalAlpha = 1;
}
/* ---------- la lumière ---------- */
function plLight(c, k, ms){
  const P = plMake(c), L = P.light;
  L.from = L.k; L.k = PL_LIGHTS.includes(k) ? k : "none"; L.t0 = P.t; L.ms = Math.max(0.01, (ms === undefined ? 800 : ms) / 1000);
}
function plVignette(x, W, H, a){
  const v = x.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.32, W / 2, H * 0.45, Math.max(W, H) * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${a})`);
  x.fillStyle = v; x.fillRect(0, 0, W, H);
}
function plLightPaint(x, k, W, H, t, a){
  if(k === "none" || a <= 0) return;
  x.globalAlpha = a;
  if(k === "day"){ plVignette(x, W, H, 0.22); }
  else if(k === "dusk"){
    x.globalCompositeOperation = "soft-light"; x.fillStyle = "#ff9a5a"; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(255,150,70,.10)"); g.addColorStop(1, "rgba(40,16,70,.38)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    plVignette(x, W, H, 0.42);
  } else if(k === "night" || k === "dark" || k === "cold"){
    x.globalCompositeOperation = "multiply"; x.fillStyle = k === "dark" ? "#45405c" : k === "cold" ? "#7f93b6" : "#56609a"; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    plVignette(x, W, H, k === "dark" ? 0.7 : 0.5);
  } else if(k === "dim"){
    x.globalCompositeOperation = "multiply"; x.fillStyle = "#8a8aa0"; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    plVignette(x, W, H, 0.62);
  } else if(k === "warm"){
    x.globalCompositeOperation = "soft-light"; x.fillStyle = "#ffb070"; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "source-over";
    plVignette(x, W, H, 0.25);
  } else if(k === "heat"){
    x.globalCompositeOperation = "soft-light"; x.fillStyle = "#ff6a2a"; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "source-over";
    const g = x.createLinearGradient(0, 0, 0, H * 0.6);
    g.addColorStop(0, `rgba(255,120,40,${0.22 + 0.06 * Math.sin(t * 5)})`); g.addColorStop(1, "rgba(255,120,40,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    plVignette(x, W, H, 0.45);
  } else if(k === "clean"){
    x.globalCompositeOperation = "screen"; x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(0, 0, W, H); x.globalCompositeOperation = "source-over";
  } else if(k === "rift"){
    const p = 0.6 + 0.4 * Math.sin(t * 2.2);
    const g = x.createRadialGradient(W / 2, H * 0.45, H * 0.15, W / 2, H * 0.45, H * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(120,10,60,${0.55 * p})`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    plVignette(x, W, H, 0.4);
  }
  x.globalAlpha = 1;
}
function plDrawLight(c, x, W, H){
  const P = c.pl, L = P.light, k = Math.min(1, (P.t - L.t0) / L.ms);
  if(k < 1) plLightPaint(x, L.from, W, H, P.t, 1 - k);
  plLightPaint(x, L.k, W, H, P.t, k);
}
/* ---------- le souvenir : il tient mal ---------- */
function plDrawMemFx(c, x, W, H){
  const P = c.pl, calm = plCalm(), s = P.s;
  /* le bord de l'image brunit, comme une vieille photo */
  const v = x.createRadialGradient(W / 2, H * 0.44, Math.min(W, H) * 0.28, W / 2, H * 0.46, Math.max(W, H) * 0.72);
  v.addColorStop(0, "rgba(40,22,6,0)"); v.addColorStop(1, "rgba(40,22,6,.62)");
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  /* une bande qui saute, de temps en temps */
  if(!calm && P.t > P.tearT){
    P.tearT = P.t + 2.2 + Math.random() * 3.5;
    P.tearY = Math.random() * H; P.tearUntil = P.t + 0.09;
  }
  if(!calm && P.tearUntil > P.t){
    const y = Math.floor(P.tearY), h = (2 + Math.floor(Math.random() * 4)) * s;
    try { x.drawImage(P.cvW, 0, y, W, h, (Math.random() < 0.5 ? -2 : 2) * s, y, W, h); } catch(e){}
  }
  /* des blocs qui ne se chargent pas : plus le souvenir est loin, plus il en manque */
  if(P.memHoles){
    x.fillStyle = "#1a120a";
    const step = calm ? 0 : Math.floor(P.t * 2.5), gw = Math.max(1, Math.floor(W / s)), gh = Math.max(1, Math.floor(H / s));
    for(let i = 0; i < P.memHoles; i++){
      if((i + step) % 3 === 0) continue;
      const bs = (4 + ((i * 7) % 5)) * s;
      const X = ((i * 53 + step * 17 * (i % 2)) % gw) * s, Y = ((i * 97 + step * 29 * (i % 3 ? 0 : 1)) % gh) * s;
      x.fillRect(X - X % bs, Y - Y % bs, bs, bs);
    }
  }
  /* le grain : quatre toiles de bruit tirées une fois, qui se relaient (rien à recalculer à chaque image) */
  if(P.xG && (P.t - P.grainT > (calm ? 1e9 : 0.09) || !P.grainOnce)){
    P.grainT = P.t; P.grainOnce = true;
    const g = P.xG, gw = P.cvG.width, gh = P.cvG.height;
    try {
      if(!P.grainFr || P.grainFr.w !== gw || P.grainFr.h !== gh){
        P.grainFr = {w:gw, h:gh, cv:[0, 1, 2, 3].map(()=>{
          const cv = document.createElement("canvas"); cv.width = gw; cv.height = gh;
          const x2 = cv.getContext("2d"), img = x2.createImageData(gw, gh), d = img.data;
          for(let i = 0; i < d.length; i += 4){ const v2 = Math.random() * 255 | 0; d[i] = v2; d[i + 1] = v2 * 0.9 | 0; d[i + 2] = v2 * 0.75 | 0; d[i + 3] = Math.random() < 0.5 ? 46 : 0; }
          x2.putImageData(img, 0, 0); return cv; }), i:0};
      }
      const F = P.grainFr; F.i = (F.i + 1 + (Math.random() * 2 | 0)) % 4;
      g.clearRect(0, 0, gw, gh); g.drawImage(F.cv[F.i], 0, 0);
    } catch(e){}
  }
}

/* ---------- la défragmentation : la mémoire se range, bloc par bloc ----------
   Comme les vieux défragmenteurs : des rangées de petits blocs, rouges
   les fragmentés, bleus les rangés. L'écran se couvre, les blocs se
   trient, et le souvenir apparaît dessous. */
function plDrawDefrag(c, o, W, H){
  const P = c.pl, D = P.defrag, k = (P.t - D.t0) / D.ms, s = P.s;
  if(k >= 1){ P.defrag = null; return; }
  const bw = 4 * s, bh = 6 * s, gap = s, cols = Math.floor((W - 12 * s) / (bw + gap)), rows = Math.ceil(H / (bh + gap)) + 1;
  const ox = Math.floor((W - cols * (bw + gap) + gap) / 2);
  if(!D.cells || D.cols !== cols){
    const R = plRng(D.seed || 7); D.cols = cols; D.cells = [];
    /* le désordre : des fragments partout, de la mémoire en morceaux, du vide entre eux */
    for(let i = 0; i < cols * rows; i++){ const r = R(); D.cells.push(r < 0.44 ? 0 : r < 0.66 ? 1 : r < 0.95 ? 2 : 3); }
    /* rangé : tout l'utilisé d'un seul tenant (bleu), le souvenir retrouvé au bout (crème), puis le vide */
    const used = D.cells.filter(v=>v === 1 || v === 2).length, mem = D.cells.filter(v=>v === 3).length;
    D.sorted = D.cells.map((v, i)=>i < used ? 2 : i < used + mem ? 3 : 0);
  }
  const COL = ["#0a1424", "#e0325a", "#35b8e8", "#f2deb0"];
  const cover = k < 0.16 ? k / 0.16 : k > 0.8 ? Math.max(0, 1 - (k - 0.8) / 0.2) : 1;
  o.globalAlpha = cover * 0.97; o.fillStyle = "#03060c"; o.fillRect(0, 0, W, H);
  const sortK = Math.max(0, Math.min(1, (k - 0.18) / 0.56));
  const front = Math.floor(plEase(sortK) * D.cells.length);
  for(let i = 0; i < D.cells.length; i++){
    const X = ox + (i % cols) * (bw + gap), Y = Math.floor(i / cols) * (bh + gap);
    let kind = i < front ? D.sorted[i] : D.cells[i];
    o.globalAlpha = cover * (kind === 0 ? 0.7 : 0.95);
    o.fillStyle = COL[kind]; o.fillRect(X, Y, bw, bh);
    if(kind){ o.fillStyle = "rgba(255,255,255,.22)"; o.fillRect(X, Y, bw, s); }
  }
  /* la tête de lecture : quelques blocs blancs, là où l'on range */
  if(sortK > 0 && sortK < 1){
    for(let j = 0; j < 6; j++){ const i = front + j * 3; const X = ox + (i % cols) * (bw + gap), Y = Math.floor(i / cols) * (bh + gap);
      o.globalAlpha = cover * (plCalm() ? 0.75 : Math.floor(P.t * 24 + j) % 2 ? 1 : 0.5); o.fillStyle = "#ffffff"; o.fillRect(X, Y, bw, bh); }
  }
  o.globalAlpha = cover;
  const label = "DEFRAGMENTATION", sub = (D.n ? D.n + (D.n > 1 ? " BLOCS" : " BLOC") + " RECUPERE" + (D.n > 1 ? "S" : "") + "  " : "") + Math.min(100, Math.round(sortK * 100)) + "%";
  const y0 = Math.round(H * 0.3);
  o.fillStyle = "rgba(3,6,12,.94)"; o.fillRect(0, y0 - 7 * s, W, 24 * s);
  o.fillStyle = "#35f0d6"; o.fillRect(0, y0 - 7 * s, W, s); o.fillRect(0, y0 + 16 * s, W, s);
  plText(o, label, Math.round(W / 2 - plTextW(label, s) / 2), y0, "#dffcf7", s);
  plText(o, sub, Math.round(W / 2 - plTextW(sub, s) / 2), y0 + 8 * s, "#35f0d6", s);
  o.globalAlpha = 1;
}
/* ---------- l'effacement : le monde s'en va, ligne après ligne ---------- */
function plDrawErase(c, x, o, W, H){
  const P = c.pl, E = P.erase, k = Math.min(1, (P.t - E.t0) / E.ms), s = P.s;
  const rows = Math.ceil(H / s), gone = Math.floor(plEase(k) * rows);
  /* d'en bas vers le haut, une ligne de pixels à la fois */
  const yCut = H - gone * s;
  x.fillStyle = "#000"; x.fillRect(0, yCut, W, H - yCut);
  o.clearRect(0, yCut, W, H - yCut);
  if(k < 1){
    x.fillStyle = "rgba(255,246,220,.85)"; x.fillRect(0, yCut - s, W, s);
    x.fillStyle = "rgba(255,246,220,.22)"; x.fillRect(0, yCut - 4 * s, W, 3 * s);
  }
  const v = Math.round(E.from + (E.to - E.from) * plEase(k));
  const label = v + " %";
  if(!E.lbl){
    o.fillStyle = "rgba(0,0,0,.6)"; o.fillRect(W / 2 - 22 * s, 10 * s, 44 * s, 13 * s);
    plText(o, label, Math.round(W / 2 - plTextW(label, 2 * s) / 2), 12 * s, v > 0 ? "#f2deb0" : "#ff3d7f", 2 * s);
  } else plLblText(c, E.lbl, label);
}
/* ---------- des lettres qui se mélangent (le nom, que Porygon-Z ne sait pas lire) ---------- */
function plDrawLetters(c, o){
  const P = c.pl, L = P.letters, el = P.t - L.t0;
  if(L.ms && el > L.ms){ P.letters = null; return; }
  const chars = Array.from(L.text.toUpperCase()), n = chars.length;
  const GL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%?";
  const calm = plCalm(), fade = L.ms ? Math.max(0, Math.min(1, el / 0.4, (L.ms - el) / 0.5)) : Math.min(1, el / 0.4);
  for(let i = 0; i < n; i++){
    const ph = i * 1.7 + el * (calm ? 0.2 : 0.9);
    const X = Math.round(L.x - n * 4 + i * 8 + Math.cos(ph * 0.8 + i) * (L.spread || 9));
    const Y = Math.round(L.y + Math.sin(ph) * 5 + Math.sin(el * 2 + i) * 2);
    /* de loin en loin, la vraie lettre passe — à sa vraie place */
    const real = Math.sin(el * (L.clear ? 9 : 3) + i * 2.3) > (L.clear ? -0.4 : 0.86);
    const ch = real ? chars[i] : GL[Math.floor((el * 9 + i * 7)) % GL.length];
    o.globalAlpha = fade * (0.55 + 0.45 * Math.sin(el * 4 + i));
    plText(o, ch === " " ? "▒" : ch, X + 1, Y + 1, "#05020a", 2);
    plText(o, ch === " " ? "▒" : ch, X, Y, real ? "#ffffff" : (i % 2 ? "#ff3d7f" : "#35f0d6"), 2);
  }
  o.globalAlpha = 1;
}

/* ============================================================
   LES TEXTES DU MONDE (fenêtres du système, fichiers, compteurs)
   ============================================================ */
function plLblClear(c){ const P = c.pl; if(!P) return; P.lbl.clear(); const wl = document.getElementById("cn-wl"); if(wl) wl.innerHTML = ""; }
function plLblText(c, id, text){ const L = c.pl.lbl.get(id); if(L && L.el && L.last !== text){ const t = L.el.querySelector(".wl-v") || L.el; t.textContent = text; L.last = text; } }
function plLbl(c, b){
  const P = plEnsure(c), wl = document.getElementById("cn-wl"); if(!wl) return;
  const old = P.lbl.get(b.id);
  if(b.on === false){ if(old && old.el){ const el = old.el; el.classList.add("out"); setTimeout(()=>{ try { el.remove(); } catch(e){} }, 420); } P.lbl.delete(b.id); return; }
  const el = old ? old.el : document.createElement("div");
  const F = s => esc(typeof pzFmt === "function" ? pzFmt(typeof s === "function" ? s() : s) : s);
  el.className = "wl wl-" + (b.k || "win") + (b.cls ? " " + b.cls : "") + (old ? " in" : "");
  const lines = typeof b.lines === "function" ? b.lines() : (b.lines || []);
  if(b.k === "file") el.innerHTML = `<div class="wl-h">${F(b.title || "choses_formidables.txt")}</div><div class="wl-b">${lines.map((l, i)=>`<div style="--i:${i}">${F(l)}</div>`).join("")}</div>`;
  else if(b.k === "count") el.innerHTML = `${b.title ? `<small>${F(b.title)}</small>` : ""}<span class="wl-v">${F(b.text || "")}</span>`;
  else if(b.k === "sysq") el.innerHTML = `<div class="wl-q">${F(b.text || "")}</div>${(b.opts || []).map((o2, i)=>`<div class="wl-o ${b.sel === i ? "sel" : ""}">${b.sel === i ? "&gt; " : "&nbsp; "}${F(o2)}</div>`).join("")}`;
  else if(b.k === "log") el.innerHTML = (b.title ? `<div class="wl-h">${F(b.title)}</div>` : "") + lines.map((l, i)=>`<div class="${/^!/.test(l) ? "err" : ""}" style="--i:${i}">${F(l.replace(/^!/, ""))}</div>`).join("");
  else el.innerHTML = `<span class="wl-v">${F(b.text || "")}</span>`;
  if(!old){ wl.appendChild(el); requestAnimationFrame(()=>el.classList.add("in")); }
  P.lbl.set(b.id, {el, at:b.at || [0.5, 0.3], last:null, follow:b.follow || null, dy:b.dy || 0, pos:null});
}
function plDrawLabels(c, T){
  const P = c.pl; if(!P.lbl.size) return;
  const box = document.getElementById("cine"); P.bars = !!(box && box.classList.contains("bars"));
  for(const [id, L] of P.lbl){
    let wx, wy;
    if(L.follow){ const a = P.act.get(L.follow); if(!a) continue; wx = a.x; wy = plHead(a) + (L.dy || 0); }
    else { const p = plAt(c, L.at); wx = p.x; wy = p.y; }
    let px = wx * T.k + T.ox, py = wy * T.k + T.oy;
    /* une fenêtre ne sort jamais de l'image : on la rentre, sans la déformer */
    if(!L.w || L.wT !== L.el.className){ L.w = L.el.offsetWidth || 0; L.h = L.el.offsetHeight || 0; L.wT = L.el.className; }
    if(L.w){ const m = 8; px = Math.max(L.w / 2 + m, Math.min(P.cw - L.w / 2 - m, px)); }
    /* ni sous les bandes de cinéma, ni sur la boîte de dialogue */
    if(L.h){ const top = (P.bars ? P.ch * 0.08 : 0) + 10, bot = P.ch * 0.66;
      py = Math.max(L.h / 2 + top, Math.min(bot - L.h / 2, py)); }
    const sx = px / P.cw * 100, sy = py / P.ch * 100;
    const key = sx.toFixed(1) + "," + sy.toFixed(1);
    if(L.pos !== key){ L.pos = key; L.el.style.left = sx.toFixed(2) + "%"; L.el.style.top = sy.toFixed(2) + "%"; }
  }
}

/* ============================================================
   LES TEMPS DU PLATEAU
   ============================================================ */
function plGet(c, id){ return c.pl && c.pl.act.get(id); }
function plWaitUntil(c, test, maxMs){
  return new Promise((ok, ko)=>{
    const t0 = Date.now();
    const iv = setInterval(()=>{
      if(!cineAlive(c)){ clearInterval(iv); ko("stop"); return; }
      if(c.ff || test() || Date.now() - t0 > (maxMs || 8000)){ clearInterval(iv); ok(); }
    }, 30);
  });
}
/* qui parle, dans le monde : Porygon-Z remue, l'archiviste se défait, la faille tremble */
function plSpeaker(c, who){
  const P = c.pl; if(!P || !P.on) return null;
  if(who === "pz") return P.act.get("pz") || null;
  for(const a of P.act.values()){
    if(who === "past" && a.kind === "swarm" && !(a.sw && a.sw.dead)) return a;
    if(who === "bad" && a.kind === "mn") return a;
    if(who === "me" && a.kind === "mnname") return a;
    if(who === "prof" && a.kind === "prop" && a.prop === "prof") return a;
  }
  return null;
}
function plTalk(c, who, on){
  const a = plSpeaker(c, who); if(!a) return;
  a.talk = on;
  if(on && a.kind === "swarm") a.sw.speak = 1.8;
}
async function plBeat(c, b){
  const P = plEnsure(c);
  if(P.dead) return;                    /* pas de toile (tests) : le récit continue sans image */
  switch(b.t){
    case "set": return plSetBeat(c, b);
    case "plat":
      if(b.on === false){ P.set = null; P.prev = null; P.act.clear(); P.parts.length = 0; plLblClear(c); plMem(c, false); P.letters = null; P.erase = null; return; }
      if(b.st && P.set) P.set.st = Object.assign(P.set.st || {}, b.st, {t0:P.t});
      if(b.holes !== undefined) P.memHoles = b.holes;
      if(b.wait) await cineSleep(c, b.wait === true ? 700 : b.wait);
      return;
    case "put": {
      const a = plActor(c, b); if(!a) return;
      if(b.mood) plActMood(c, a, b.mood);
      if(b.emote) plEmote(c, a, b.emote);
      if(b.wait) await cineSleep(c, typeof b.wait === "number" ? b.wait : b.kind === "swarm" && b.enter !== "cut" ? 1500 : b.enter === "assemble" ? 1100 : 500);
      return; }
    case "move": {
      const a = plGet(c, b.id); if(!a) return;
      const p = plAt(c, b.to), dir = b.face !== undefined ? plDir(b.face) : undefined;
      if(a.kind === "pz" || a.kind === "mon"){ plSetAnim(a, "walk", true, P.t); a.then = null; }
      if(a.look){ a.dir = a.look.prev; a.look = null; }
      const done = new Promise(ok=>{ a.path = {x:p.x + (b.dx || 0), y:p.y + (b.dy || 0), speed:b.speed || 28, face:dir, done:ok}; });
      if(b.wait !== false) await Promise.race([done, plWaitUntil(c, ()=>!a.path, 12000)]);
      return; }
    case "face": {
      const a = plGet(c, b.id); if(!a) return;
      a.look = null; a.nextLook = P.t + 6;
      if(b.to){ const p = plAt(c, b.to); a.dir = plDirTo(a, p.x, p.y); } else a.dir = plDir(b.dir);
      return; }
    case "anim": {
      const a = plGet(c, b.id); if(!a) return;
      if(b.data) a.data = Object.assign(a.data || {}, b.data);
      if(b.holo !== undefined) a.holo = !!b.holo;
      if(b.sil !== undefined) a.sil = b.sil || null;
      if(b.eyes !== undefined) a.eyes = b.eyes || null;
      if(b.zb !== undefined) a.zb = b.zb;
      if(b.alpha !== undefined) a.fade = {from:a.alpha, to:b.alpha, t0:P.t, ms:(b.ms || 600) / 1000};
      if(b.a === "collapse"){ a.collapse = P.t; if(b.wait) await cineSleep(c, 1600); return; }
      if(!b.a) return;
      plSetAnim(a, b.a, !!b.loop, P.t); a.then = b.loop ? null : (b.then || "idle"); a.hold = b.hold || 0;
      if(b.wait){ const sh = plSheet(a.mon, b.a, a.variant); await cineSleep(c, sh && !sh.walk ? plAnimLen(sh) * 1000 + (b.hold || 0) * 1000 : 400); }
      return; }
    case "emote": { const a = plGet(c, b.id); if(a) plEmote(c, a, b.e); if(b.wait) await cineSleep(c, 900); return; }
    case "hop": { const a = plGet(c, b.id); if(a) plHop(a, b.n || 1, b.h); if(b.wait) await cineSleep(c, 380 * (b.n || 1)); return; }
    case "tremble": {
      const a = plGet(c, b.id); if(!a) return;
      if(b.flicker){ a.flick = (b.ms || 900) / 1000; a.flickTo = a.alpha || 1; }
      else a.trem = (b.ms || 500) / 1000;
      if(b.wait) await cineSleep(c, b.ms || 500);
      return; }
    case "gone": {
      const a = plGet(c, b.id); if(!a) return;
      if(b.how === "cut"){ P.act.delete(b.id); return; }
      if(b.how === "scatter" && a.kind === "swarm"){
        a.sw.dead = true;
        for(const p of a.sw.pts) if(p.st !== 1 && p.st !== 9){
          const k = p.st === 5 || p.st === 6 ? plEase(p.st === 6 ? 1 : p.k) : 0;
          p.x = p.hx + ((p.lx || p.hx) - p.hx) * k; p.y = p.hy + ((p.ly || p.hy) - p.hy) * k;
          p.st = 1; p.vx = (Math.random() - 0.5) * 34; p.vy = -(6 + Math.random() * 24); p.max = p.life = 0.5 + Math.random() * 1.3;
        }
      }
      else if(b.how === "tear"){ plTear(c, a); P.act.delete(b.id); }
      else a.fade = {from:a.alpha, to:0, t0:P.t, ms:(b.ms || 500) / 1000, kill:true};
      if(b.wait !== false) await cineSleep(c, b.how === "scatter" ? 1000 : 450);
      return; }
    case "cam": {
      if(b.follow !== undefined){ P.follow = b.follow || null; if(!b.to) return; }
      const p = b.to ? plAt(c, b.to) : {x:P.cam.x, y:P.cam.y};
      const ms = (b.ms === undefined ? 900 : b.ms) / 1000;
      if(b.shake) P.shake = b.shake;
      if(ms <= 0.01 || c.ff){ P.cam = {x:p.x + (b.dx || 0), y:p.y + (b.dy || 0), z:b.z || P.cam.z}; P.camA = null; return; }
      P.camA = {fx:P.cam.x, fy:P.cam.y, fz:P.cam.z, tx:p.x + (b.dx || 0), ty:p.y + (b.dy || 0), tz:b.z || P.cam.z, t0:P.t, ms};
      if(b.wait) await cineSleep(c, ms * 1000);
      return; }
    case "light": plLight(c, b.k, b.ms); if(b.wait) await cineSleep(c, b.ms || 800); return;
    case "swarm": {
      const a = plGet(c, b.id); if(!a || a.kind !== "swarm") return;
      if(b.do === "speak") a.sw.speak = (b.ms || 1600) / 1000;
      else if(b.do === "unstable") a.sw.unstable = (b.ms || 1500) / 1000;
      else if(b.do === "calm") a.sw.rate = 0.04;
      else if(b.do === "collapse"){ swarmCollapse(c, a); if(b.wait !== false) await cineSleep(c, 2300); }
      else if(b.do === "form"){ a.sw.dead = false; for(const p of a.sw.pts){ const ang = Math.random() * 6.28, d = 16 + Math.random() * 40; p.fx = Math.cos(ang) * d; p.fy = Math.sin(ang) * d - 14; p.fd = Math.random() * 0.7; p.st = 4; } if(b.wait) await cineSleep(c, 1700); }
      return; }
    case "ball": return plBall(c, b);
    case "wl": plLbl(c, b); if(b.wait) await cineSleep(c, b.wait === true ? 900 : b.wait); return;
    case "defrag":
      P.defrag = {t0:P.t, ms:(b.ms || 2400) / 1000, n:b.n || 0, seed:plHash((c.scene && c.scene.id) || "d")};
      try { Sfx.wobble(); } catch(e){}
      /* on rend la main quand l'écran est couvert : le décor change dessous */
      if(b.wait !== false) await cineSleep(c, (b.ms || 2400) * 0.4);
      return;
    case "erase":
      P.erase = {t0:P.t, ms:(b.ms || 4000) / 1000, from:b.from !== undefined ? b.from : 100, to:b.to || 0, lbl:b.lbl || null};
      if(b.wait !== false) await cineSleep(c, b.ms || 4000);
      return;
    case "letters":
      if(b.on === false){ P.letters = null; return; }
      { const p = plAt(c, b.at || [0.5, 0.35]);
        P.letters = {text:typeof b.text === "function" ? b.text() : (b.text || (typeof pzName === "function" ? pzName() : "?")), x:p.x, y:p.y, t0:P.t, ms:b.ms ? b.ms / 1000 : 0, clear:!!b.clear, spread:b.spread}; }
      if(b.wait) await cineSleep(c, typeof b.wait === "number" ? b.wait : 1200);
      return;
  }
}
/* un acteur arraché : ses pixels partent en tranches */
function plTear(c, a){
  const P = c.pl, R = Math.random, top = plHead(a) + 6, h = Math.max(12, a.y - top);
  for(let i = 0; i < 46; i++) P.parts.push({x:a.x + (R() - 0.5) * 18, y:top + R() * h, vx:(R() < 0.5 ? -1 : 1) * (30 + R() * 70), vy:(R() - 0.5) * 10, life:0.3 + R() * 0.35, max:0.65, c:R() < 0.5 ? "#ff3d7f" : "#35f0d6", s:1 + (R() * 2 | 0), over:true});
  try { Sfx.glitch(); } catch(e){}
}
/* une Poké Ball lancée en cloche ; « catch » : rattrapée, « miss » : elle rebondit et roule */
async function plBall(c, b){
  const P = c.pl, from = plAt(c, b.from), to = plAt(c, b.to), ms = (b.ms || 750) / 1000;
  const id = b.id || "ball" + Math.floor(P.t * 1000);
  const a = plActor(c, {id, kind:"prop", prop:"ball", at:[0, 0], enter:"cut"});
  if(!a) return;
  const tgt = P.act.get(b.to);
  a.x = from.x; a.y = from.y;
  a.data = {fx:from.x, fy:from.y - 16, tx:to.x + (b.dx || 0), ty:to.y - (b.catch ? (tgt ? Math.max(6, (tgt.y - plHead(tgt)) * 0.45) : 14) : 2), t0:P.t, ms, arc:b.arc || 30, miss:!!b.miss};
  try { Sfx.throwb && Sfx.throwb(); } catch(e){}
  await cineSleep(c, ms * 1000);
  if(b.catch){ a.data.held = b.to; try { Sfx.click(); } catch(e){} }
  if(b.miss){ a.data.bounce = P.t; try { Sfx.hit && Sfx.hit(); } catch(e){} }
  if(b.keep === false || b.miss) setTimeout(()=>{ if(P.act.get(id)) a.fade = {from:1, to:0, t0:P.t, ms:0.5, kill:true}; }, b.miss ? 1100 : 500);
}

/* ============================================================
   LA BOÎTE DE DIALOGUE : le portrait de celui qui parle
   ============================================================ */
function cineFace(c, b){
  const f = document.getElementById("cn-face"); if(!f) return;
  const w = b.who || "";
  let html = "";
  if(w === "pz") html = pzFace(c.pzMood || "Normal", 64, "cn-face-pz");
  else if(w === "prof" && typeof PROF_PORTRAIT !== "undefined") html = `<img src="${PROF_PORTRAIT}" alt="">`;
  else if(w === "bad") html = typeof mnSpriteHtml === "function" ? mnSpriteHtml("cn-face-mn") : "";
  else if(w === "me" && typeof nameSprite === "function") html = `<img src="${nameSprite(pzName())}" alt="">`;
  else if(w === "past") html = `<canvas id="cn-face-past" width="20" height="20"></canvas>`;
  const mem = !!(b.mem || c.mem);
  const key = w + "|" + (w === "pz" ? c.pzMood : "") + "|" + (mem ? 1 : 0);
  f.className = "cn-face" + (html ? " on f-" + w : "") + (mem ? " mem" : "");
  if(f.dataset.k !== key){ f.innerHTML = html; f.dataset.k = key; if(html){ f.classList.remove("pop"); void f.offsetWidth; f.classList.add("pop"); } }
  if(w === "past") plFacePast(c);
}
/* le portrait de l'archiviste d'avant : un carré de pixels qui ne se fixent jamais */
function plFacePast(c){
  const cv = document.getElementById("cn-face-past"); if(!cv || !cv.getContext) return;
  const x = cv.getContext("2d"); if(!x) return;
  const name = typeof pzName === "function" ? pzName() : "?", col = swarmColors(name);
  const R = plRng(plHash(name + Math.floor(performance.now() / 140)));
  const inside = (X, y) => y < 13 ? Math.hypot(X - 10, y - 7.5) < 5.6 : Math.abs(X - 10) < 3 + (y - 13) * 1.3;
  x.fillStyle = "#140d26"; x.fillRect(0, 0, 20, 20);
  for(let y = 0; y < 20; y++) for(let X = 0; X < 20; X++){
    if(!inside(X, y) || R() > 0.8) continue;
    x.fillStyle = !inside(X - 1, y) ? "#35f0d6" : !inside(X + 1, y) ? "#ff3d7f" : col(Math.floor(X * SW_W / 20), Math.floor(y * SW_H / 20));
    x.fillRect(X, y, 1, 1);
  }
  if(c && cineAlive(c) && !plCalm()) setTimeout(()=>{ if(cineAlive(c) && document.getElementById("cn-face-past") === cv) plFacePast(c); }, 140);
}
