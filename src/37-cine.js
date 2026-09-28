/* ============================================================
   37 — CINÉMATIQUES
   Le lecteur de dialogues sait afficher des repliques. Une scene
   importante demande davantage : un decor, des acteurs qui entrent
   et sortent, des effets, du rythme. Ce module fixe le STANDARD de
   toutes les scenes importantes du jeu.

   Une scene est une liste de PLANS ; un plan est une liste de
   TEMPS, joues dans l'ordre. Le vocabulaire est ferme :

     bars   bandes de cinema               {on}
     bg     decor                          {k: labo | void | terminal | faille}
     card   carton de titre                {text, sub, hold}
     actor  un acteur entre                {id, kind: prof|pz|mon, mon, pos, enter, mood}
     leave  un acteur sort                 {id, how: fade | tear}
     mood   humeur de Porygon-Z            {id, mood}
     say    une replique                   {who, text, corrupt, stutter, auto}
     fx     un effet                       {k: shake|flash|glitch|rgb|noise|blackout, lv, ms}
     code   des lignes de code tapees      {lines, speed}
     rain   pluie de donnees               {on}
     sfx    un son                         {k}
     wait   une pause                      {ms}
     par    plusieurs temps a la fois      {beats}

   Regles du standard :
   · toute scene se passe (bouton « Passer ») et s'avance au doigt ;
   · trois intensites d'effet, jamais davantage : lv 1, 2, 3 ;
   · trois univers de couleur : le monde d'AVANT (chaud, pastel),
     le SYSTEME (sombre, cyan), la FAILLE (magenta) ;
   · les durees viennent de CINE_T, jamais d'un chiffre isole.
   ============================================================ */

const CINE_T = {fast:180, short:350, mid:700, long:1400, hold:2200, type:26};
const GLYPHS = "█▓▒░#@%&$§¤0x?!<>/\\|";

let CINE = null;
let CINE_LAST = null;
/* deux scenes peuvent se suivre (main secrete puis badge) : la seconde attend
   la fin de la premiere au lieu de la couper */
const CINE_QUEUE = [];     /* derniere scene demandee : utile au debogage et aux tests */

function playCine(scene, onDone){
  CINE_LAST = scene && scene.id;
  const box = document.getElementById("cine");
  if(!box){ onDone && onDone(); return; }
  if(CINE && !CINE.dead){ CINE_QUEUE.push([scene, onDone]); return; }
  CINE = {scene, onDone, dead:false, actors:{}, waitTap:null, typing:null, rain:null, noise:null};
  box.className = "on";
  box.innerHTML = `
    <div class="cn-stage bg-void" id="cn-stage">
      <div class="cn-bg"><i class="cn-light"></i><i class="cn-floor"></i><i class="cn-motes"></i></div>
      <canvas class="cn-rain" id="cn-rain"></canvas>
      <div class="cn-actors" id="cn-actors"></div>
      <div class="cn-code" id="cn-code"></div>
      <div class="cn-flash" id="cn-flash"></div>
      <div class="cn-scan"></div>
      <canvas class="cn-noise" id="cn-noise"></canvas>
      <div class="cn-card" id="cn-card"></div>
    </div>
    <div class="cn-bar top"></div><div class="cn-bar bot"></div>
    <div class="cn-dialog" id="cn-dialog">
      <div class="cn-who" id="cn-who"></div>
      <div class="cn-text" id="cn-text"></div>
      <i class="cn-next"></i>
    </div>
    <button class="cn-skip" data-act="cineskip">Passer ›</button>`;
  box.onclick = ev => {
    if(ev.target.closest(".cn-skip")) return;
    cineTap();
  };
  runScene(CINE).catch(()=>{});
}
function cineAlive(c){ return c && !c.dead && CINE === c; }
const cineSleep = (c, ms) => new Promise((ok, ko) => {
  setTimeout(()=> cineAlive(c) ? ok() : ko("stop"), ms);
});
function cineTap(){
  const c = CINE; if(!c) return;
  if(c.typing){ c.typing.finish(); return; }
  if(c.waitTap){ const w = c.waitTap; c.waitTap = null; w(); }
}
function cineEnd(){
  const c = CINE; if(!c) return;
  c.dead = true;
  cancelAnimationFrame(c.rain); cancelAnimationFrame(c.noise);
  const box = document.getElementById("cine");
  if(box){ box.className = "off";
    setTimeout(()=>{ if(!CINE){ box.className = ""; box.innerHTML = ""; } }, 420); }
  CINE = null;
  if(c.onDone) c.onDone();
  if(CINE_QUEUE.length && !CINE){
    const [sc, done] = CINE_QUEUE.shift();
    setTimeout(()=>playCine(sc, done), 460);   /* le temps du fondu de sortie */
  }
}
ACTIONS.cineskip = () => cineEnd();

async function runScene(c){
  for(const shot of c.scene.shots){
    if(shot.bg) setBg(shot.bg);
    for(const b of shot.beats) await runBeat(c, b);
  }
  if(cineAlive(c)) cineEnd();
}

async function runBeat(c, b){
  if(!cineAlive(c)) throw "stop";
  const stage = document.getElementById("cn-stage");
  switch(b.t){
    case "par":   await Promise.all(b.beats.map(x=>runBeat(c, x))); return;
    case "wait":  await cineSleep(c, b.ms || CINE_T.mid); return;
    case "sfx":   try { Sfx[b.k] && Sfx[b.k](); } catch(e){} return;
    case "bg":    setBg(b.k); return;
    case "bars":  document.getElementById("cine").classList.toggle("bars", b.on !== false); await cineSleep(c, CINE_T.mid); return;
    case "card":  await cineCard(c, b); return;
    case "actor": await cineActor(c, b); return;
    case "leave": await cineLeave(c, b); return;
    case "mood": {
      const a = c.actors[b.id];
      const slot = a && (a.el.querySelector(".cn-holo-in") || a.el);
      if(slot) slot.innerHTML = pzFace(b.mood, 132, "cn-pz");
      return;
    }
    case "say":   await cineSay(c, b); return;
    case "fx":    await cineFx(c, b, stage); return;
    case "code":  await cineCode(c, b); return;
    case "rain":  b.on ? startRain(c) : stopRain(c); return;
  }
}

/* ---------- décor ---------- */
function setBg(k){
  const st = document.getElementById("cn-stage");
  if(!st) return;
  st.className = st.className.replace(/\bbg-\S+/g, "").trim() + " bg-" + k;
  const box = document.getElementById("cine"); if(box) box.dataset.bg = k;
}

/* ---------- carton ---------- */
async function cineCard(c, b){
  const el = document.getElementById("cn-card");
  el.innerHTML = `<div class="cc-t">${esc(b.text)}</div>${b.sub ? `<div class="cc-s">${esc(b.sub)}</div>` : ""}`;
  el.className = "cn-card in" + (b.big ? " big" : "");
  await cineSleep(c, b.hold || CINE_T.hold);
  el.className = "cn-card out";
  await cineSleep(c, CINE_T.mid);
  el.className = "cn-card";
}

/* ---------- acteurs ---------- */
const CINE_POS = {center:50, left:24, right:76, farleft:14, farright:86};
async function cineActor(c, b){
  const layer = document.getElementById("cn-actors");
  const el = document.createElement("div");
  const x = typeof b.pos === "number" ? b.pos : (CINE_POS[b.pos] || 50);
  const size = b.size || (b.kind === "mon" ? 84 : 150);   /* la faille et les portraits partagent la meme echelle */
  el.className = "cn-actor k-" + b.kind + " e-" + (b.enter || "fade");
  el.style.setProperty("--x", x + "%");
  el.style.setProperty("--y", (b.y !== undefined ? b.y : (b.kind === "mon" ? 50 : 30)) + "%");
  /* Le professeur apparait sur un moniteur de laboratoire : c'est un message
     enregistre, et c'est lui qui se corrompt. Porygon-Z, lui, est projete. */
  /* sprite en pied fourni (assets/prof_full.png) : le professeur se tient
     debout dans le laboratoire, comme dans l'intro des jeux de base */
  if(b.kind === "prof" && typeof PROF_FULL !== "undefined" && PROF_FULL){
    el.classList.add("full");
    el.style.setProperty("--y", (b.y !== undefined ? b.y : 64) + "%");
    el.innerHTML = `<i class="cn-shadow"></i><img class="cn-prof-full" src="${PROF_FULL}" alt="">`;
  }
  else if(b.kind === "prof") el.innerHTML = `<div class="cn-monitor"><div class="cn-screen">
      <img class="cn-prof" src="${PROF_PORTRAIT}" alt=""><i class="cn-glare"></i></div>
      <i class="cn-led"></i></div><i class="cn-stand"></i>`;
  /* un embleme : badge, sceau, objet — un glyphe dans un joyau qui tourne */
  else if(b.kind === "emblem") el.innerHTML = `<div class="cn-emblem" style="--ec:${b.color || "#35f0d6"}">
      <i></i><i></i><span>${esc(b.glyph || "◆")}</span></div>`;
  else if(b.kind === "missing") el.innerHTML = `<div class="cn-mn"><img src="${MISSING_SPRITE}" alt=""></div>`;
  else if(b.kind === "pz") el.innerHTML = `<div class="cn-holo"><b></b><b></b><b></b><b></b>
      <span class="cn-holo-in">${pzFace(b.mood || "Normal", 132, "cn-pz")}</span></div>`;
  else el.innerHTML = `<span class="sprbox" style="width:${size}px;height:${size}px">${sprite(b.mon, false, "", {anim:true, eager:true})}</span>`;
  layer.appendChild(el);
  c.actors[b.id] = {el, size};
  await cineSleep(c, b.enter === "assemble" ? CINE_T.long + CINE_T.mid : CINE_T.mid);
}
async function cineLeave(c, b){
  const a = c.actors[b.id]; if(!a) return;
  a.el.classList.add(b.how === "tear" ? "x-tear" : "x-fade");
  await cineSleep(c, b.how === "tear" ? CINE_T.mid : CINE_T.short);
  a.el.remove(); delete c.actors[b.id];
}

/* ---------- répliques ----------
   La corruption remplace une part des caracteres par des glyphes ; le
   begaiement repete la fin d'une replique. Les deux restent lisibles : on
   doit comprendre que le texte casse, pas perdre le fil. */
function corruptText(t, p){
  if(!p) return t;
  let out = "";
  for(const ch of t) out += (ch !== " " && Math.random() < p) ? GLYPHS[Math.floor(Math.random()*GLYPHS.length)] : ch;
  return out;
}
const CINE_WHO = {prof:"Prof. Racine", pz:"Porygon-Z", sys:"SYSTÈME", bad:"???", "":""};
async function cineSay(c, b){
  const dlg = document.getElementById("cn-dialog");
  const who = document.getElementById("cn-who");
  const txt = document.getElementById("cn-text");
  /* le systeme ne parle en rouge que lorsqu'il signale une erreur */
  const sysErr = b.who === "sys" && /ERREUR|ÉCHEC|ILLISIBLE|INTROUVABLE/i.test(b.text);
  dlg.className = "cn-dialog on w-" + (sysErr ? "syserr" : (b.who || "none")) + (b.corrupt > 0.3 ? " broken" : "");
  void dlg.offsetWidth;
  who.textContent = CINE_WHO[b.who || ""] || "";
  const full = corruptText(b.text, b.corrupt || 0);
  txt.textContent = "";
  /* frappe caractere par caractere, completee d'un toucher */
  await new Promise(done=>{
    let i = 0, stopped = false;
    const speed = b.speed || CINE_T.type;
    const step = () => {
      if(stopped || !cineAlive(c)) return;
      i++;
      txt.textContent = full.slice(0, i);
      if(b.corrupt && Math.random() < b.corrupt * 0.4) txt.classList.toggle("jit");
      if(i % 3 === 0) try { Sfx.click(); } catch(e){}
      if(i >= full.length){ c.typing = null; done(); return; }
      setTimeout(step, speed);
    };
    c.typing = {finish(){ stopped = true; txt.textContent = full; c.typing = null; done(); }};
    step();
  });
  if(!cineAlive(c)) throw "stop";
  if(b.auto){ await cineSleep(c, b.auto); return; }
  dlg.classList.add("wait");
  await new Promise(ok=>{ c.waitTap = ok; });
  dlg.classList.remove("wait");
}

/* ---------- effets ---------- */
async function cineFx(c, b, stage){
  const lv = b.lv || 1, ms = b.ms || CINE_T.mid;
  if(b.k === "flash"){
    const f = document.getElementById("cn-flash");
    f.className = "cn-flash on l" + lv; await cineSleep(c, CINE_T.short); f.className = "cn-flash";
    return;
  }
  if(b.k === "shake"){
    stage.classList.add("sh" + lv); try { buzz(lv * 20); } catch(e){}
    await cineSleep(c, ms); stage.classList.remove("sh" + lv); return;
  }
  if(b.k === "rgb"){
    stage.classList.add("rgb" + lv); await cineSleep(c, ms); stage.classList.remove("rgb" + lv); return;
  }
  if(b.k === "noise"){ b.on === false ? stopNoise(c) : startNoise(c, lv); return; }
  if(b.k === "glitch"){ await glitchBurst(c, stage, lv, ms); return; }
  if(b.k === "blackout"){
    /* extinction de tube cathodique : la ligne blanche, puis le point, puis le noir */
    stopNoise(c);
    /* la replique s'eteint avec l'image, d'un coup, sans fondu */
    document.getElementById("cn-dialog").className = "cn-dialog cut";
    stage.classList.add("crtoff");
    try { Sfx.glitch(); } catch(e){}
    await cineSleep(c, 900);
    document.getElementById("cn-actors").innerHTML = ""; c.actors = {};
    setBg("void");
    stage.classList.remove("crtoff");
    return;
  }
}
/* Le glitch decoupe le plateau en tranches decalees et en separe les
   couches rouge et cyan. Tout se fait par variables CSS, sans copier le DOM. */
async function glitchBurst(c, stage, lv, ms){
  stage.classList.add("gl", "gl" + lv);
  try { Sfx.glitch(); buzz([12, 20, 12]); } catch(e){}
  const end = Date.now() + ms;
  while(Date.now() < end && cineAlive(c)){
    const a = Math.random() * 100, h = 4 + Math.random() * (8 * lv);
    stage.style.setProperty("--gx", ((Math.random() - 0.5) * 14 * lv).toFixed(1) + "px");
    stage.style.setProperty("--gy", ((Math.random() - 0.5) * 4 * lv).toFixed(1) + "px");
    stage.style.setProperty("--ga", a.toFixed(1) + "%");
    stage.style.setProperty("--gb", Math.min(100, a + h).toFixed(1) + "%");
    stage.style.setProperty("--gh", (Math.random() * 60 * lv).toFixed(0) + "deg");
    await cineSleep(c, 45 + Math.random() * 70);
  }
  stage.classList.remove("gl", "gl" + lv);
}

/* ---------- code ---------- */
async function cineCode(c, b){
  const box = document.getElementById("cn-code");
  box.classList.add("on");
  for(const line of b.lines){
    const kind = line[0] === "!" ? "err" : line[0] === "✓" ? "ok" : "cmd";
    const row = document.createElement("div");
    row.className = "cl " + kind;
    box.appendChild(row);
    for(let i = 1; i <= line.length; i++){
      row.textContent = line.slice(0, i);
      await cineSleep(c, b.speed || 22);
    }
    if(kind === "err") try { Sfx.glitch(); } catch(e){}
    await cineSleep(c, CINE_T.short);
  }
  await cineSleep(c, CINE_T.mid);
  box.classList.add("fade");
  await cineSleep(c, CINE_T.mid);
  box.className = "cn-code"; box.innerHTML = "";
}

/* ---------- pluie de données et bruit (canvas) ---------- */
function startRain(c){
  const cv = document.getElementById("cn-rain"); if(!cv) return;
  cv.classList.add("on");
  const ctx = cv.getContext("2d");
  const fit = () => { cv.width = cv.clientWidth; cv.height = cv.clientHeight; };
  fit();
  const cols = Math.ceil(cv.width / 14), y = Array.from({length:cols}, ()=>Math.random()*-40);
  const tick = () => {
    if(!cineAlive(c)) return;
    ctx.fillStyle = "rgba(3,7,14,0.16)"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = "12px monospace";
    for(let i = 0; i < cols; i++){
      ctx.fillStyle = Math.random() < 0.05 ? "#dffcf7" : "rgba(53,240,214,0.55)";
      ctx.fillText("0123456789ABCDEF"[Math.floor(Math.random()*16)], i * 14, y[i] * 14);
      if(y[i] * 14 > cv.height && Math.random() > 0.975) y[i] = 0;
      y[i] += 0.5;
    }
    c.rain = requestAnimationFrame(tick);
  };
  tick();
}
function stopRain(c){ cancelAnimationFrame(c.rain); const cv = document.getElementById("cn-rain"); if(cv) cv.classList.remove("on"); }
function startNoise(c, lv){
  cancelAnimationFrame(c.noise);            /* un seul bruit a la fois */
  const cv = document.getElementById("cn-noise"); if(!cv) return;
  cv.classList.add("on"); cv.style.opacity = 0.05 + lv * 0.06;
  const ctx = cv.getContext("2d"); cv.width = 160; cv.height = 280;
  const tick = () => {
    if(!cineAlive(c)) return;
    const img = ctx.createImageData(cv.width, cv.height);
    for(let i = 0; i < img.data.length; i += 4){
      const v = Math.random() * 255; img.data[i] = img.data[i+1] = img.data[i+2] = v; img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    c.noise = requestAnimationFrame(tick);
  };
  tick();
}
function stopNoise(c){
  cancelAnimationFrame(c.noise);
  const cv = document.getElementById("cn-noise");
  /* l'opacite est posee en style direct au demarrage : il faut l'annuler ici,
     sinon la derniere image de bruit reste figee a l'ecran */
  if(cv){ cv.classList.remove("on"); cv.style.opacity = 0; }
}

/* ============================================================
   SCÈNE D'OUVERTURE — « L'ÉCRITURE INTERROMPUE »
   Quatre plans : le monde d'avant, la panne, le redemarrage, le
   reveil. Le premier plan est volontairement doux et classique :
   c'est le contraste qui fait la chute.
   ============================================================ */
const CINE_INTRO = {id:"intro", title:"L'écriture interrompue", shots:[
  /* 1 — le monde d'avant */
  {bg:"labo", beats:[
    {t:"bars", on:true},
    {t:"card", text:"SAUVEGARDE D'ORIGINE", sub:"lecture du fichier…", hold:1800},
    {t:"actor", id:"prof", kind:"prof", pos:"center", enter:"fade"},
    {t:"say", who:"prof", text:"Ah, te voilà ! Bienvenue dans le monde des Pokémon."},
    {t:"say", who:"prof", text:"Je suis le Professeur Racine. La plupart des gens m'appellent simplement « le Professeur »."},
    {t:"par", beats:[
      {t:"actor", id:"m1", kind:"mon", mon:25, pos:"farleft", y:62, enter:"pop"},
      {t:"actor", id:"m2", kind:"mon", mon:1,  pos:"left",    y:70, enter:"pop"},
      {t:"actor", id:"m3", kind:"mon", mon:4,  pos:"right",   y:70, enter:"pop"},
      {t:"actor", id:"m4", kind:"mon", mon:7,  pos:"farright",y:62, enter:"pop"},
      {t:"sfx", k:"shiny"}
    ]},
    {t:"say", who:"prof", text:"Ce monde est peuplé de créatures extraordinaires : les Pokémon."},
    {t:"say", who:"prof", text:"Certains vivent à nos côtés. D'autres dans les hautes herbes, au fond des lacs, ou là où personne n'a encore mis les pieds."},
    {t:"say", who:"prof", text:"J'ai consacré ma vie à les étudier. Et toi, tu vas bientôt—", auto:500}
  ]},
  /* 2 — la panne */
  {beats:[
    {t:"fx", k:"glitch", lv:1, ms:320},
    {t:"say", who:"prof", text:"tu vas bientôt— bientôt— bientôt—", corrupt:0.04, auto:700},
    {t:"par", beats:[
      {t:"fx", k:"rgb", lv:2, ms:1400},
      {t:"fx", k:"noise", lv:1},
      {t:"leave", id:"m1", how:"tear"},
      {t:"leave", id:"m3", how:"tear"}
    ]},
    {t:"say", who:"prof", text:"Ce monde est peuplé de créatures qu'on appelle les—", corrupt:0.3, auto:700},
    {t:"par", beats:[
      {t:"fx", k:"glitch", lv:2, ms:900},
      {t:"fx", k:"shake", lv:2, ms:900},
      {t:"leave", id:"m2", how:"tear"},
      {t:"leave", id:"m4", how:"tear"}
    ]},
    {t:"fx", k:"flash", lv:2},
    {t:"say", who:"sys", text:"ERREUR 0x00 — INDEX INTROUVABLE", auto:900},
    {t:"fx", k:"noise", lv:3},
    {t:"say", who:"prof", text:"Bienvenue. Bienvenue. Bienvenue. Bienvenue.", corrupt:0.75, speed:14, auto:500},
    {t:"par", beats:[
      {t:"fx", k:"glitch", lv:3, ms:1200},
      {t:"fx", k:"shake", lv:3, ms:1200}
    ]},
    {t:"leave", id:"prof", how:"tear"},
    {t:"fx", k:"blackout"},
    {t:"wait", ms:1500}
  ]},
  /* 3 — le redémarrage */
  {bg:"terminal", beats:[
    {t:"code", lines:[
      "> redémarrage d'urgence",
      "> lecture de l'index ........ 386 entrées",
      "! 386 entrées illisibles",
      "> intégrité du monde ........ 0,0 %",
      "> recherche d'un processus d'entretien",
      "✓ PORYGON-Z.sys ............. trouvé",
      "> réveil forcé"
    ]},
    {t:"rain", on:true},
    {t:"wait", ms:CINE_T.mid}
  ]},
  /* 4 — le réveil */
  {beats:[
    {t:"actor", id:"pz", kind:"pz", pos:"center", y:32, enter:"assemble", mood:"Stunned"},
    {t:"fx", k:"flash", lv:1},
    {t:"say", who:"pz", text:"…", auto:900},
    {t:"mood", id:"pz", mood:"Surprised"},
    {t:"say", who:"pz", text:"Réveil forcé. Mémoire de travail : vide. Heure système : inconnue."},
    {t:"mood", id:"pz", mood:"Normal"},
    {t:"say", who:"pz", text:"Ah. Il y a quelqu'un."},
    {t:"say", who:"pz", text:"Je suis Porygon-Z, un programme d'entretien. Ma version est instable, et je le sais."},
    {t:"mood", id:"pz", mood:"Worried"},
    {t:"say", who:"pz", text:"Le Professeur ne reviendra pas. Le fichier a cédé pendant qu'il te parlait."},
    {t:"mood", id:"pz", mood:"Determined"},
    {t:"say", who:"pz", text:"Mais toi, tu peux encore capturer des Pokémon. C'est la seule chose qui répare quoi que ce soit, ici."},
    {t:"say", who:"pz", text:"Je t'appellerai l'Archiviste."},
    {t:"rain", on:false},
    {t:"leave", id:"pz", how:"fade"},
    {t:"card", text:"POKÉMON CODE GENESIS", sub:"intégrité du monde : 0,0 %", hold:2400}
  ]}
]};
const CINEMAS = {intro: CINE_INTRO};
ACTIONS.cineplay = d => { const sc = CINEMAS[d.k]; if(sc) playCine(sc, ()=>refresh()); };

/* ============================================================
   LE METTEUR EN SCÈNE
   Chaque scene du recit devient une cinematique conforme au standard,
   sans etre reecrite. Il decide :
   · l'UNIVERS, d'apres les voix presentes : la faille si elle parle,
     le laboratoire si le professeur parle, le systeme sinon ;
   · les ACTEURS : chacun entre a sa premiere replique, a une place
     fixee d'avance pour que personne ne se chevauche ;
   · les EFFETS aux ruptures : premiere intervention de la faille,
     premier message systeme, repliques marquees « bad » ;
   · la SOLENNITE : bandes et carton-titre pour les scenes majeures.

   Les scenes cles recoivent en plus une PISTE DE DIRECTION : des temps
   inseres avant une replique donnee, ou a la fin (cle "end").
   ============================================================ */
const MAJOR_SCENES = new Set(["missingno_1","kanto_done","johto_done","hoenn_done","climax","epilogue",
  "boss_first_done","guardian_first","arc2_open","arc2_prof","arc2_zero","arc2_end","pz_cycle","pz_region_full"]);

const DIRECTION = {
  missingno_1: {
    0:   [{t:"fx", k:"noise", lv:1}],
    3:   [{t:"fx", k:"shake", lv:2, ms:450}],
    end: [{t:"fx", k:"noise", on:false}]
  },
  johto_done: { end: [{t:"fx", k:"glitch", lv:1, ms:400}] },
  climax: {
    0:   [{t:"fx", k:"noise", lv:1}],
    6:   [{t:"par", beats:[{t:"fx", k:"glitch", lv:2, ms:520}, {t:"fx", k:"shake", lv:2, ms:520}]}],
    10:  [{t:"fx", k:"noise", on:false}],
    13:  [{t:"par", beats:[{t:"fx", k:"glitch", lv:3, ms:1000}, {t:"fx", k:"shake", lv:3, ms:1000}]}],
    /* Porygon-Z entre dans la faille : les deux sortent ensemble, dechires */
    14:  [{t:"par", beats:[{t:"leave", id:"mn", how:"tear"}, {t:"leave", id:"pz", how:"tear"}]},
          {t:"fx", k:"flash", lv:2}],
    /* l'ecran « vraiment propre » : le decor chaud du monde d'avant revient.
       Le monde repare ressemble a l'ouverture, avant la panne. */
    16:  [{t:"bg", k:"labo"}, {t:"wait", ms:CINE_T.long}],
    17:  [{t:"wait", ms:CINE_T.mid}]
  },
  epilogue: {
    2:   [{t:"code", lines:["> ouvrir pz_journal.log", "✓ 1 fichier — auteur : inconnu"]}],
    8:   [{t:"leave", id:"pz", how:"fade"}, {t:"rain", on:true}, {t:"fx", k:"flash", lv:1}],
    end: [{t:"card", text:"COUCHE ZÉRO", sub:"déverrouillée", hold:CINE_T.hold}, {t:"rain", on:false}]
  },
  arc2_prof: { 3: [{t:"fx", k:"rgb", lv:1, ms:500}] }
};

function directStory(sc){
  const lines = sc.lines || [];
  const whos = new Set(lines.map(l=>l.w || ""));
  const hasProf = whos.has("prof"), hasPz = whos.has("pz"), hasBad = whos.has("bad");
  const universe = hasBad ? "faille" : hasProf ? "labo" : "terminal";
  const rift = /^rift_/.test(sc.id || "");
  const major = rift || MAJOR_SCENES.has(sc.id);
  /* places fixees d'avance : personne ne doit en chevaucher un autre */
  const pos = {
    prof: hasPz ? "left" : "center",
    mn:   hasPz ? "left" : "center",
    pz:   (hasProf || hasBad) ? "right" : "center"
  };
  const dir = DIRECTION[sc.id] || {};
  const beats = [], on = new Set();
  /* le suivi des presences descend dans les temps simultanes, mais n'ajoute
     que la liste de premier niveau : sinon chaque temps parallele etait joue
     deux fois — une fois dans son groupe, une fois a plat */
  const scan = list => {
    for(const b of list){
      if(b.t === "actor") on.add(b.id);
      if(b.t === "leave") on.delete(b.id);
      if(b.t === "par") scan(b.beats);
    }
  };
  const track = list => { scan(list); beats.push(...list); };
  if(major) beats.push({t:"bars", on:true});
  const title = rift ? "LA FAILLE"
    : (typeof STORY_TITLES !== "undefined" && STORY_TITLES[sc.id]) ? STORY_TITLES[sc.id].toUpperCase() : null;
  if(major && title)
    beats.push({t:"card", text:title,
      sub: rift ? `étape ${sc.id.split("_")[1]} / ${RIFT_ARC.length}` : hasBad ? "signal non indexé" : "journal de l'Archiviste",
      hold:1600});

  let badSeen = false, sysSeen = false;
  lines.forEach((l, i)=>{
    if(dir[i]) track(dir[i]);
    const w = l.w || "";
    if(w === "prof" && !on.has("prof")) track([{t:"actor", id:"prof", kind:"prof", pos:pos.prof, enter:"fade"}]);
    if(w === "pz"){
      if(!on.has("pz")) track([{t:"actor", id:"pz", kind:"pz", pos:pos.pz, y:32,
                                enter: major ? "assemble" : "fade", mood:l.m || "Normal"}]);
      else if(l.m) beats.push({t:"mood", id:"pz", mood:l.m});
    }
    if(w === "bad"){
      /* la faille prend corps a sa premiere replique */
      if(!badSeen){
        badSeen = true;
        if(!on.has("mn")) track([{t:"actor", id:"mn", kind:"missing", pos:pos.mn, y:32, enter:"assemble"}]);
        beats.push({t:"fx", k:"glitch", lv:2, ms:600});
      } else beats.push({t:"fx", k:"rgb", lv:1, ms:380});
    }
    if(w === "sys" && !sysSeen){ sysSeen = true; beats.push({t:"fx", k:"flash", lv:1}); }
    if(l.bad) beats.push({t:"fx", k:"shake", lv:1, ms:350});
    beats.push({t:"say", who: (w in CINE_WHO) ? w : "", text:l.t, corrupt: w === "bad" ? 0.05 : 0});
  });
  if(dir.end) track(dir.end);
  for(const id of [...on]) track([{t:"leave", id, how:"fade"}]);
  return {id:sc.id, title, shots:[{bg:universe, beats}]};
}
/* la cinematique d'une scene : ecrite a la main si elle existe, dirigee sinon */
function cineFor(id){
  if(CINEMAS[id]) return CINEMAS[id];
  if(id === "__dyn" && typeof STORY_DYN !== "undefined" && STORY_DYN) return directStory(STORY_DYN);
  const sc = STORY_BY_ID[id];
  return sc ? directStory(sc) : null;
}
