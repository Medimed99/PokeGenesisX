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
     ask    une question au joueur (nom)   {who, text, ph}
     choice une décision, maintenue au doigt {opts:[{k, cmd, sub}], branches:{k:[temps]}}
     mem    entrée ou sortie d'un souvenir {on}
     montage des cartons qui défilent vite  {items:[[titre, sous-titre]], ms}
     name   ton nom, lu comme un Pokémon    {}
     dex    une entrée du Pokédex s'écrit   {}
     credits le générique                   {}
     music  une ambiance pour la scène      {k}
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
     le SYSTEME (sombre, cyan), la FAILLE (magenta) — plus deux
     lieux du recit : le SOUVENIR (sepia, grain, vignette) et la
     COUCHE ZÉRO (le noir sous les trois secteurs) ;
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
  CINE = {scene, onDone, dead:false, actors:{}, waitTap:null, typing:null, rain:null, noise:null, pl:null, pzMood:"Normal"};
  box.className = "on";
  box.innerHTML = `
    <div class="cn-stage bg-void" id="cn-stage">
      <div class="cn-bg"><i class="cn-light"></i><i class="cn-floor"></i><i class="cn-motes"></i></div>
      <canvas class="cn-world" id="cn-world"></canvas>
      <canvas class="cn-grain" id="cn-grain"></canvas>
      <canvas class="cn-rain" id="cn-rain"></canvas>
      <div class="cn-actors" id="cn-actors"></div>
      <canvas class="cn-over" id="cn-over"></canvas>
      <div class="cn-wl" id="cn-wl"></div>
      <div class="cn-code" id="cn-code"></div>
      <div class="cn-flash" id="cn-flash"></div>
      <div class="cn-scan"></div>
      <canvas class="cn-noise" id="cn-noise"></canvas>
      <div class="cn-card" id="cn-card"></div>
    </div>
    <div class="cn-bar top"></div><div class="cn-bar bot"></div>
    <div class="cn-dialog" id="cn-dialog">
      <div class="cn-face" id="cn-face"></div>
      <div class="cn-who" id="cn-who"></div>
      <div class="cn-text" id="cn-text"></div>
      <i class="cn-next"></i>
    </div>
    <button class="cn-skip" data-act="cineskip">Passer ›</button>`;
  box.onclick = ev => {
    if(ev.target.closest(".cn-skip")) return;
    cineTap();
  };
  /* les planches des Pokémon de la scène se chargent tout de suite, pas à leur entrée */
  if(typeof plPreload === "function") try {
    const ids = new Set([474]);
    const scan = list => (list || []).forEach(x=>{ if(!x) return; if(x.t === "put" && x.mon) ids.add(x.mon);
      if(x.beats) scan(x.beats); if(x.branches) for(const k in x.branches) scan(x.branches[k]); });
    (scene.shots || []).forEach(sh=>scan(sh.beats));
    plPreload([...ids]);
  } catch(e){}
  runScene(CINE).catch(()=>{});
}
function cineAlive(c){ return c && !c.dead && CINE === c; }
const cineSleep = (c, ms) => new Promise((ok, ko) => {
  setTimeout(()=> cineAlive(c) ? ok() : ko("stop"), c && c.ff ? 0 : ms);
});
function cineTap(){
  const c = CINE; if(!c) return;
  /* pendant le générique, toucher accélère le défilement */
  if(c.creditsAnim){
    try { if(c.creditsAnim.playbackRate < 6){ c.creditsAnim.playbackRate = 6; const h = document.querySelector(".ccr-hint"); if(h) h.textContent = "défilement accéléré"; } } catch(e){}
    return;
  }
  if(c.choosing) return;
  if(c.typing){ c.typing.finish(); return; }
  if(c.waitTap){ const w = c.waitTap; c.waitTap = null; w(); }
}
function cineEnd(){
  const c = CINE; if(!c) return;
  c.dead = true;
  cancelAnimationFrame(c.rain); cancelAnimationFrame(c.noise);
  if(typeof plStop === "function") try { plStop(c); } catch(e){}
  const box = document.getElementById("cine");
  if(box){ box.className = "off";
    setTimeout(()=>{ if(!CINE){ box.className = ""; box.innerHTML = ""; } }, 420); }
  CINE = null;
  /* une scène qui avait imposé son ambiance la rend */
  if(c.music && typeof Music !== "undefined"){ Music.ctxOverride = null; try { Music.sync(); } catch(e){} }
  if(c.creditsAnim) try { c.creditsAnim.cancel(); } catch(e){}
  if(c.onDone) c.onDone();
  if(CINE_QUEUE.length && !CINE){
    const [sc, done] = CINE_QUEUE.shift();
    setTimeout(()=>playCine(sc, done), 460);   /* le temps du fondu de sortie */
  }
}
/* pendant une décision, « Passer » ne décide pas à ta place : il attend.
   Une scène qui contient une question encore sans réponse : « Passer » file jusqu'à elle. */
ACTIONS.cineskip = () => {
  if(CINE && CINE.choosing) return;
  if(CINE && cinePendingQuick(CINE)){ cineFastForward(CINE); return; }
  cineEnd();
};
function cinePendingQuick(c){
  const open = b => b.t === "choice" && b.quick && !(typeof b.preset === "function" ? b.preset() : b.preset);
  const scan = list => (list || []).some(b => open(b) || (b.t === "par" && scan(b.beats)));
  try { return c.scene.shots.some(s => scan(s.beats)); } catch(e){ return false; }
}
function cineFastForward(c){
  c.ff = true;
  if(c.typing) c.typing.finish();
  if(c.waitTap){ const w = c.waitTap; c.waitTap = null; w(); }
}

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
    case "seq":   for(const x of b.beats) await runBeat(c, x); return;
    case "wait":  await cineSleep(c, b.ms || CINE_T.mid); return;
    case "sfx":   try { Sfx[b.k] && Sfx[b.k](); } catch(e){} return;
    case "bg":
      setBg(b.k);
      /* un ancien décor demandé alors que le plateau joue : le lieu peint correspondant */
      if(c.pl && c.pl.on && c.pl.set){
        if(b.k === "void") await plBeat(c, {t:"plat", on:false});
        else if(typeof PL_BG !== "undefined" && PL_BG[b.k]) await plBeat(c, {t:"set", k:PL_BG[b.k][0], v:PL_BG[b.k][1], keep:true, wait:false});
      }
      return;
    case "bars":  document.getElementById("cine").classList.toggle("bars", b.on !== false); await cineSleep(c, CINE_T.mid); return;
    case "card":  await cineCard(c, b); return;
    case "actor": await cineActor(c, b); return;
    case "leave": await cineLeave(c, b); return;
    case "mood": {
      if(b.id === "pz") c.pzMood = b.mood;
      const a = c.actors[b.id];
      const slot = a && (a.el.querySelector(".cn-holo-in") || a.el);
      if(slot) slot.innerHTML = pzFace(b.mood, 132, "cn-pz");
      /* sur le plateau, l'humeur se joue avec le corps */
      const w = typeof plGet === "function" && plGet(c, b.id);
      if(w) plActMood(c, w, b.mood);
      return;
    }
    case "say":   await cineSay(c, b); return;
    case "ask":   await cineAsk(c, b); return;
    case "fx":    await cineFx(c, b, stage); return;
    case "code":  await cineCode(c, b); return;
    case "rain":  b.on ? startRain(c) : stopRain(c); return;
<<<<<<< HEAD
    case "mem":
      stage.classList.toggle("mem", b.on !== false); c.mem = b.on !== false;
      if(c.pl && c.pl.on) plMem(c, c.mem);
      return;
=======
    case "mem":   stage.classList.toggle("mem", b.on !== false); c.mem = b.on !== false; return;
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    case "music":
      if(typeof Music !== "undefined"){ Music.ctxOverride = b.k; c.music = true; try { Music.sync(); } catch(e){} }
      return;
    case "choice":  await cineChoice(c, b); return;
    case "montage": await cineMontage(c, b); return;
    case "name":    await cineName(c, b); return;
    case "dex":     await cineDex(c, b); return;
    case "credits": await cineCredits(c, b); return;
    case "call":    try { b.fn && b.fn(c); } catch(e){ console.error(e); } return;
<<<<<<< HEAD
  }
  /* le reste du vocabulaire appartient au plateau (37d) */
  if(typeof PL_BEATS !== "undefined" && PL_BEATS.includes(b.t)){
    if(b.t === "put" && b.kind === "pz" && b.mood) c.pzMood = b.mood;
    await plBeat(c, b);
=======
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
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
  const F = typeof pzFmt === "function" ? pzFmt : (t=>t);
  el.innerHTML = `<div class="cc-t">${esc(F(b.text))}</div>${b.sub ? `<div class="cc-s">${esc(F(b.sub))}</div>` : ""}`;
  el.className = "cn-card in" + (b.big ? " big" : "");
  const dlg = document.getElementById("cn-dialog"); if(dlg && /\bon\b/.test(dlg.className)) dlg.className = "cn-dialog cut";
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
<<<<<<< HEAD
  else if(b.kind === "missing") el.innerHTML = `<div class="cn-mn">${mnSpriteHtml()}</div>`;
=======
  else if(b.kind === "missing") el.innerHTML = `<div class="cn-mn"><img src="${MISSING_SPRITE}" alt=""></div>`;
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
  /* MissingNo, une fois lu : le même bloc, mais fait des octets de ton nom */
  else if(b.kind === "mnname") el.innerHTML = `<div class="cn-mn named"><img src="${nameSprite(pzName())}" alt=""><i class="cn-mn-name">${esc(pzName())}</i></div>`;
  /* l'archiviste d'une connexion passée : une silhouette, jamais un visage */
  else if(b.kind === "self") el.innerHTML = `<div class="cn-self"><img src="${selfSprite()}" alt=""><i class="cn-shadow"></i></div>`;
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
const CINE_WHO = {prof:"Prof. Racine", pz:"Porygon-Z", sys:"SYSTÈME", bad:"???", past:"", me:"", "":""};
/* l'archiviste du passé n'a pas de nom lisible — jusqu'à ce que MissingNo se lise ;
   MissingNo, lu, parle avec ton nom */
function cineWho(w){
  if(w === "past") return typeof sagaKnown === "function" && sagaKnown() ? pzName() : pzMask();
  if(w === "me") return pzName();
  return CINE_WHO[w || ""] || "";
}
async function cineSay(c, b){
  const dlg = document.getElementById("cn-dialog");
  const who = document.getElementById("cn-who");
  const txt = document.getElementById("cn-text");
  /* le systeme ne parle en rouge que lorsqu'il signale une erreur */
<<<<<<< HEAD
  /* « Aucune ligne illisible » est une bonne nouvelle : la négation ne compte pas comme une erreur */
  const sysErr = b.who === "sys" && /ERREUR|ÉCHEC|ILLISIBLE|INTROUVABLE/i.test(b.text) && !/aucune\s+\S+\s+illisible/i.test(b.text);
  dlg.className = "cn-dialog on w-" + (sysErr ? "syserr" : (b.who || "none")) + (b.corrupt > 0.3 ? " broken" : "") + (b.mem || c.mem ? " mem" : "");
  void dlg.offsetWidth;
  who.textContent = cineWho(b.who);
  if(b.mood) c.pzMood = b.mood;
  if(typeof cineFace === "function") cineFace(c, b);
  if(typeof plTalk === "function") plTalk(c, b.who, true);
  const full = corruptText(typeof pzFmt === "function" ? pzFmt(b.text) : b.text, b.corrupt || 0);
  txt.textContent = "";
  if(c.ff){ txt.textContent = full; c.typing = null; if(typeof plTalk === "function") plTalk(c, b.who, false); return; }
=======
  const sysErr = b.who === "sys" && /ERREUR|ÉCHEC|ILLISIBLE|INTROUVABLE/i.test(b.text);
  dlg.className = "cn-dialog on w-" + (sysErr ? "syserr" : (b.who || "none")) + (b.corrupt > 0.3 ? " broken" : "") + (b.mem || c.mem ? " mem" : "");
  void dlg.offsetWidth;
  who.textContent = cineWho(b.who);
  const full = corruptText(typeof pzFmt === "function" ? pzFmt(b.text) : b.text, b.corrupt || 0);
  txt.textContent = "";
  if(c.ff){ txt.textContent = full; c.typing = null; return; }
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
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
  if(typeof plTalk === "function") plTalk(c, b.who, false);
  if(!cineAlive(c)) throw "stop";
  if(b.auto){ await cineSleep(c, b.auto); return; }
  dlg.classList.add("wait");
  await new Promise(ok=>{ c.waitTap = ok; });
  dlg.classList.remove("wait");
}

/* ---------- une question : le joueur tape sa reponse (son nom) ----------
   La replique s'affiche, puis un champ dans la bulle. Rejouee depuis le
   journal, la scene reprend le nom deja donne et continue seule. */
async function cineAsk(c, b){
  await cineSay(c, Object.assign({}, b, {auto:1}));
  const dlg = document.getElementById("cn-dialog");
  const form = document.createElement("div");
  form.className = "cn-ask";
  const known = S.flags && S.flags.named;
  form.innerHTML = `<input id="cn-name" maxlength="16" autocomplete="off" spellcheck="false" placeholder="${esc(b.ph || "Ton nom")}" value="${known ? esc(S.name) : ""}">
    <button class="btn pri" id="cn-name-ok">C'est moi</button>`;
  form.onclick = e => e.stopPropagation();
  dlg.appendChild(form);
  dlg.classList.add("asking");
  const inp = form.querySelector("input");
  if(!known) setTimeout(()=>{ try { inp.focus(); } catch(e){} }, 80);
  await new Promise(ok=>{
    const done = () => {
      const v = inp.value.trim().replace(/\s+/g, " ").slice(0, 16);
      if(!v){ inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake"); return; }
      S.name = v; S.flags.named = true; saveSoon();
      form.remove(); dlg.classList.remove("asking"); ok();
    };
    form.querySelector("button").onclick = done;
    inp.onkeydown = e => { e.stopPropagation(); if(e.key === "Enter") done(); };
    if(known) setTimeout(done, 1300);
  });
  if(!cineAlive(c)) throw "stop";
}

/* ---------- effets ---------- */
async function cineFx(c, b, stage){
  const lv = b.lv || 1, ms = b.ms || CINE_T.mid;
  /* effets réduits : ni flash, ni secousse, ni décalage de couleurs ; un fondu doux à la place */
  if(typeof calmFx === "function" && calmFx() && ["flash", "shake", "rgb", "glitch"].includes(b.k)){
    if(b.k === "flash" || b.k === "glitch"){
      const f = document.getElementById("cn-flash");
      if(f){ f.className = "cn-flash on soft"; await cineSleep(c, Math.min(ms, 420)); f.className = "cn-flash"; }
    } else await cineSleep(c, Math.min(ms, 300));
    return;
  }
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
    if(typeof calmFx === "function" && calmFx()) stage.classList.add("calmoff");
    try { Sfx.glitch(); } catch(e){}
    await cineSleep(c, 900);
    document.getElementById("cn-actors").innerHTML = ""; c.actors = {};
    if(c.pl && c.pl.on) await plBeat(c, {t:"plat", on:false});
    setBg("void");
    stage.classList.remove("crtoff", "calmoff");
    return;
  }
}
/* Le glitch decoupe le plateau en tranches decalees et en separe les
   couches rouge et cyan. Tout se fait par variables CSS, sans copier le DOM. */
async function glitchBurst(c, stage, lv, ms){
  stage.classList.add("gl", "gl" + lv);
  try { Sfx.glitch(); buzz([12, 20, 12]); } catch(e){}
  const end = Date.now() + ms;
  while(Date.now() < end && cineAlive(c) && !c.ff){
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
  const lines = (typeof b.lines === "function" ? b.lines() : b.lines).map(l=>typeof pzFmt === "function" ? pzFmt(l) : l);
  for(const line of lines){
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

/* ---------- une décision ----------
   Les commandes s'affichent comme des lignes de terminal. On maintient le
   doigt pour confirmer : une décision de cette taille ne se prend pas d'un
   toucher distrait. Rejouée depuis le journal, la scène reprend la réponse
   déjà donnée et la rejoue d'elle-même. */
async function cineChoice(c, b){
  c.ff = false;                      /* « Passer » s'arrête ici : la question attend sa réponse */
  const stage = document.getElementById("cn-stage");
  const dlg = document.getElementById("cn-dialog");
  if(dlg) dlg.className = "cn-dialog cut";
  const preset = typeof b.preset === "function" ? b.preset() : b.preset;
  const box = document.createElement("div");
  box.className = "cn-choice" + (b.quick ? " quick" : "");
  box.innerHTML = `${b.title ? `<div class="cch-t">${b.quick ? "<small>PORYGON-Z</small>" : ""}${esc(pzFmt(b.title))}</div>` : ""}
    ${b.opts.map((o, i)=>`<button class="cch-o ${o.glow ? "glow" : ""} ${o.isNew ? "new" : ""}" data-k="${o.k}" style="--i:${i}">
      <span class="cch-fill"></span>
      <b>&gt; ${esc(o.cmd)}</b><small>${esc(pzFmt(o.sub || ""))}</small>
      ${o.isNew ? `<i class="cch-new">nouvelle ligne</i>` : ""}</button>`).join("")}
    <div class="cch-h">${preset ? "Réponse déjà donnée" : b.quick ? "Touche une réponse" : "Maintiens ton doigt sur une ligne pour la valider"}</div>`;
  box.onclick = e => e.stopPropagation();
  /* au-dessus de la boîte de dialogue (hors de la scène, qui a son propre empilement) */
  (document.getElementById("cine") || stage).appendChild(box);
  c.choosing = !preset;
  const k = await new Promise(ok=>{
    if(preset){ setTimeout(()=>{ const el = box.querySelector(`[data-k="${preset}"]`); if(el) el.classList.add("held"); ok(preset); }, 1700); return; }
    const HOLD = 1150;
    let done = false;
    const finish = k => { if(done) return; done = true; ok(k); };
    /* une petite question : un toucher répond */
    if(b.quick){
      box.querySelectorAll(".cch-o").forEach(btn=>btn.addEventListener("click", e=>{
        e.stopPropagation();
        if(done) return;
        btn.classList.add("held"); try { Sfx.click(); buzz(14); } catch(err){}
        finish(btn.dataset.k);
      }));
      c.chooseNow = k => finish(k);
      return;
    }
    box.querySelectorAll(".cch-o").forEach(btn=>{
      let t0 = 0, raf = 0;
      const fill = btn.querySelector(".cch-fill");
      const tick = () => {
        if(!t0) return;
        const p = Math.min(1, (performance.now() - t0) / HOLD);
        fill.style.transform = `scaleX(${p.toFixed(3)})`;
        if(p >= 1){ btn.classList.add("held"); try { Sfx.win(); buzz([30, 40, 90]); } catch(e){} finish(btn.dataset.k); return; }
        raf = requestAnimationFrame(tick);
      };
      const down = e => { if(done) return; e.preventDefault(); e.stopPropagation(); t0 = performance.now(); btn.classList.add("press"); try { Sfx.click(); buzz(8); } catch(err){} raf = requestAnimationFrame(tick); };
      const up = () => {
        if(!t0) return;
        cancelAnimationFrame(raf); t0 = 0; btn.classList.remove("press");
        if(!btn.classList.contains("held")){
          fill.style.transform = "scaleX(0)";
          const h = box.querySelector(".cch-h"); if(h){ h.classList.remove("nudge"); void h.offsetWidth; h.classList.add("nudge"); }
        }
      };
      btn.addEventListener("pointerdown", down);
      /* iPhone et Android : un appui long ne doit ouvrir ni loupe, ni menu, ni sélection */
      btn.addEventListener("contextmenu", e=>e.preventDefault());
      btn.addEventListener("touchstart", e=>{ if(e.cancelable) e.preventDefault(); }, {passive:false});
      btn.addEventListener("selectstart", e=>e.preventDefault());
      btn.addEventListener("pointerup", up); btn.addEventListener("pointerleave", up); btn.addEventListener("pointercancel", up);
      btn.addEventListener("keydown", e=>{ if(e.key === "Enter"){ btn.classList.add("held"); finish(btn.dataset.k); } });
    });
    c.chooseNow = k => finish(k);      /* pour les tests et l'outil game master */
  });
  c.choosing = false; c.chooseNow = null;
  if(!cineAlive(c)) throw "stop";
  box.classList.add("done");
  box.querySelectorAll(".cch-o").forEach(x=>x.classList.toggle("off", x.dataset.k !== k));
  c.choice = k;
  if(typeof b.on === "function" && !preset) try { b.on(k); } catch(e){ console.error(e); }
  await cineSleep(c, b.quick ? CINE_T.mid : CINE_T.long);
  box.remove();
  for(const x of ((b.branches || {})[k] || [])) await runBeat(c, x);
}

/* ---------- le montage : des cartons qui défilent, de plus en plus vite ---------- */
async function cineMontage(c, b){
  const el = document.getElementById("cn-card");
  const stage = document.getElementById("cn-stage");
  const items = typeof b.items === "function" ? b.items() : (b.items || []);
  const dlg = document.getElementById("cn-dialog"); if(dlg) dlg.className = "cn-dialog cut";
  for(let i = 0; i < items.length; i++){
    const [t, sub, cmd] = items[i];
    el.innerHTML = `<div class="cc-t">${esc(pzFmt(t))}</div>${sub ? `<div class="cc-s">${esc(pzFmt(sub))}</div>` : ""}${cmd ? `<div class="cc-c">${esc(cmd)}</div>` : ""}`;
    el.className = "cn-card mont";
    const calm = typeof calmFx === "function" && calmFx();
    if(!calm) stage.classList.add("gl", "gl1");
    try { Sfx.glitch(); } catch(e){}
    await cineSleep(c, 70);
    stage.classList.remove("gl", "gl1");
    await cineSleep(c, Math.max(260, (b.ms || 560) - i * 22));
  }
  el.className = "cn-card"; el.innerHTML = "";
}

/* ---------- ton nom, lu comme un Pokémon ----------
   Dans le jeu d'origine, le nom du joueur finissait rangé là où le jeu
   range les Pokémon sauvages, et le monde le lisait comme tel. La scène le
   montre : chaque lettre, son octet, le terminateur 50 ; puis ces octets,
   relus comme des tuiles, dessinent MissingNo. */
async function cineName(c, b){
  const stage = document.getElementById("cn-stage");
  const name = pzName(), chars = Array.from(name), bytes = nameBytes(name);
  const el = document.createElement("div");
  el.className = "cn-name";
  el.innerHTML = `<div class="cn-nm-row">${chars.map((ch, i)=>`<span style="--i:${i}"><b>${esc(ch === " " ? "·" : ch)}</b><small>${hex2(bytes[i])}</small></span>`).join("")}<span class="end" style="--i:${chars.length}"><b>⏎</b><small>50</small></span></div>
    <div class="cn-nm-arrow">relu comme l'espèce n° 000</div>
    <img class="cn-nm-spr" src="${nameSprite(name)}" alt="">`;
  stage.appendChild(el);
  c.actors["name"] = {el, size:150};
  await cineSleep(c, 500 + chars.length * 170 + 700);
  el.classList.add("read");
  try { Sfx.glitch(); buzz([20, 30, 20]); } catch(e){}
  await cineSleep(c, 1800);
}

/* ---------- une entrée du Pokédex s'écrit ---------- */
async function cineDex(c, b){
  const stage = document.getElementById("cn-stage");
  const dlg = document.getElementById("cn-dialog"); if(dlg) dlg.className = "cn-dialog cut";
  const el = document.createElement("div");
  el.className = "cn-dex";
  const desc = pzFmt(b.desc || "Programme d'entretien. A tout compté, {prev} fois. Écrit avec le nom de {nom}. Se souvient de tout.");
  el.innerHTML = `<div class="cd-top"><b>POKÉDEX</b><span>N° 387</span></div>
    <div class="cd-body"><span class="cd-spr"><span class="sprbox" style="width:92px;height:92px">${sprite(474, false, "", {anim:true, eager:true})}</span></span>
      <div class="cd-info"><b class="cd-nm">PORYGON-Z</b><span class="tt t1">Normal</span>
        <small>Pokémon Virtuel</small><small>Taille 0,9 m · Poids 34,0 kg</small></div></div>
    <div class="cd-desc" id="cd-desc"></div>`;
  stage.appendChild(el);
  c.actors["dex"] = {el, size:200};
  try { Sfx.shiny(); buzz([20, 40, 20, 40, 90]); } catch(e){}
  await cineSleep(c, 1000);
  const d = el.querySelector(".cd-desc");
  for(let i = 1; i <= desc.length; i++){
    if(c.skipType){ d.textContent = desc; break; }
    d.textContent = desc.slice(0, i);
    if(i % 3 === 0) try { Sfx.click(); } catch(e){}
    await cineSleep(c, 26);
  }
  el.classList.add("sealed");
  await cineSleep(c, CINE_T.hold);
}

/* ---------- le générique ---------- */
async function cineCredits(c, b){
  const stage = document.getElementById("cn-stage");
  const dlg = document.getElementById("cn-dialog"); if(dlg) dlg.className = "cn-dialog cut";
  const el = document.createElement("div");
  el.className = "cn-credits";
  const host = document.getElementById("cine"); if(host) host.classList.add("credits");
  el.innerHTML = `<div class="ccr-roll">${typeof creditsRollHtml === "function" ? creditsRollHtml() : ""}</div><div class="ccr-hint">toucher pour accélérer</div>`;
  stage.appendChild(el);
  await cineSleep(c, 80);
  const roll = el.firstChild, vh = el.clientHeight || 640, H = roll.scrollHeight || 2400;
  const dur = Math.max(30000, (H + vh) * 15);
  let anim = null;
  try { anim = roll.animate([{transform:`translateY(${vh}px)`}, {transform:`translateY(${Math.round(-H + vh * 0.42)}px)`}], {duration:dur, easing:"linear", fill:"forwards"}); } catch(e){}
  c.creditsAnim = anim;
  if(anim) await new Promise(ok=>{
    anim.onfinish = ok;
    const iv = setInterval(()=>{ if(!cineAlive(c)){ clearInterval(iv); ok(); } }, 300);
    anim.finished && anim.finished.then(()=>clearInterval(iv)).catch(()=>{});
  });
  else await cineSleep(c, 6000);
  c.creditsAnim = null;
  if(!cineAlive(c)) throw "stop";
  el.classList.add("end");
  await cineSleep(c, 3200);
  el.classList.add("out");
  await cineSleep(c, 900);
  el.remove();
  if(host) host.classList.remove("credits");
}

<<<<<<< HEAD
/* ---------- l'archiviste d'avant, en image fixe ----------
   La même forme de pixels que sur le plateau (SW_MAP, 37d) : quelqu'un debout, sans visage,
   fait des octets du nom, bordé de cyan et de magenta ; quelques pixels s'en détachent. */
const SELF_SPR = {};
function selfSprite(){
  const name = typeof pzName === "function" ? pzName() : "?";
  if(SELF_SPR[name]) return SELF_SPR[name];
  let url = MISSING_SPRITE;
  try {
    const W = SW_W + 8, H = SW_H + 6, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d"), col = swarmColors(name), R = plRng(plHash("self|" + name));
    const on = (X, Y) => Y >= 0 && Y < SW_H && X >= 0 && X < SW_W && SW_MAP[Y][X] === "#";
    for(let Y = 0; Y < SW_H; Y++) for(let X = 0; X < SW_W; X++){
      if(!on(X, Y)) continue;
      const lost = R() < 0.07;
      let c = col(X, Y);
      if(c[0] === "r"){ const m = c.match(/\d+/g); c = plShade(+m[0], +m[1], +m[2], 0.55); }
      c = !on(X - 1, Y) ? "#35f0d6" : !on(X + 1, Y) ? "#ff3d7f" : !on(X, Y - 1) ? "#3a3058" : c;
      /* un pixel perdu s'envole un peu plus haut, plus pâle */
      if(lost){ x.globalAlpha = 0.55; x.fillStyle = c; x.fillRect(4 + X + Math.round((R() - 0.5) * 6), 6 + Y - 2 - Math.round(R() * 6), 1, 1); x.globalAlpha = 1; continue; }
      x.fillStyle = c; x.fillRect(4 + X, 6 + Y, 1, 1);
    }
    url = cv.toDataURL();
  } catch(e){}
  return SELF_SPR[name] = url;
=======
/* ---------- l'archiviste, en silhouette ----------
   Il n'a jamais de visage : seulement une casquette, un sac, une ligne de
   lumière de chaque côté — cyan pour le système, magenta pour la faille. */
let SELF_SPRITE = null;
const SELF_MAP = [
  ".......XXXXX........", "......XXXXXXX.......", ".....XXXXXXXXX......", ".....XXXXXXXXXXXX...",
  "......XXXXXXX.......", "......XXXXXXX.......", "......XXXXXXX.......", ".......XXXXX........",
  "........XXX.........", ".....XXXXXXXXX......", "....XXXXXXXXXXX.....", "...XXXXXXXXXXXXX....",
  "...XXXXXXXXXXXXX....", "...XXX.XXXXXXX.XX...", "...XXX.XXXXXXX.XX...", "...XX..XXXXXXX..XX..",
  "...XX..XXXXXXX..XX..", "...XX..XXXXXXX..XX..", "...XX...XXXXX...XX..", ".......XXXXXXX......",
  ".......XXXXXXX......", ".......XXX.XXX......", ".......XXX.XXX......", ".......XXX.XXX......",
  ".......XXX.XXX......", ".......XXX.XXX......", ".......XXX.XXX......", ".......XX...XX......",
  "......XXX...XXX.....", "......XXXX..XXXX...."];
function selfSprite(){
  if(SELF_SPRITE) return SELF_SPRITE;
  try {
    const W = SELF_MAP[0].length, H = SELF_MAP.length, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const on = (X, Y) => Y >= 0 && Y < H && X >= 0 && X < W && SELF_MAP[Y][X] === "X";
    for(let Y = 0; Y < H; Y++) for(let X = 0; X < W; X++){
      if(!on(X, Y)) continue;
      x.fillStyle = !on(X - 1, Y) ? "#35f0d6" : !on(X + 1, Y) ? "#ff3d7f" : !on(X, Y - 1) ? "#3a3058" : "#140d26";
      x.fillRect(X, Y, 1, 1);
    }
    SELF_SPRITE = cv.toDataURL();
  } catch(e){ SELF_SPRITE = MISSING_SPRITE; }
  return SELF_SPRITE;
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
}
/* ---------- ton nom, en octets, puis en tuiles ---------- */
const GB_ACCENTS = {"é":0xBA, "è":0xBB, "ê":0xBC, "à":0xBD, "ç":0xBE, "ô":0xBF, "î":0xC0, "ù":0xC1, "û":0xC2, "ë":0xC3, "ï":0xC4, "â":0xC5};
function nameBytes(name){
  return Array.from(name || "").map(ch=>{
    if(GB_ACCENTS[ch] !== undefined) return GB_ACCENTS[ch];
    const c = ch.normalize("NFD").charCodeAt(0);
    if(c >= 65 && c <= 90) return 0x80 + c - 65;
    if(c >= 97 && c <= 122) return 0xA0 + c - 97;
    if(c >= 48 && c <= 57) return 0xF6 + c - 48;
    if(ch === " ") return 0x7F;
    if(ch === "-") return 0xE3; if(ch === ".") return 0xE8; if(ch === "'") return 0xE0;
    if(ch === "!") return 0xE7; if(ch === "?") return 0xE6;
    return 0x80 | (c & 0x7F);
  });
}
const hex2 = v => (v & 0xFF).toString(16).toUpperCase().padStart(2, "0");
const NAME_SPR = {};
function nameSprite(name){
  name = name || "?";
  if(NAME_SPR[name]) return NAME_SPR[name];
  let url = MISSING_SPRITE;
  try { const cv = nameSpriteCanvas(name); if(cv) url = cv.toDataURL(); } catch(e){}
  return NAME_SPR[name] = url;
}
/* la même silhouette, en toile (56 × 56) : pour la carte « entrée n° 000 » */
function nameSpriteCanvas(name){
  name = name || "?";
  try {
    const T = 7, cv = document.createElement("canvas");
    cv.width = T * 8; cv.height = T * 8;
    const x = cv.getContext("2d");
    const bytes = nameBytes(name).concat([0x50]);
    const PAL = [null, "#7e7a9a", "#b8346a", "#1c1830"];
    let k = 0;
    for(let ty = 0; ty < T; ty++) for(let tx = 0; tx < T; tx++){
      /* la silhouette en L du MissingNo d'origine : une colonne, et une base */
      if(!(tx < 3 || ty >= T - 2)){ k += 16; continue; }
      for(let row = 0; row < 8; row++){
        const lo = bytes[k % bytes.length] ^ ((k * 29 + tx) & 0xFF), hi = bytes[(k + 1) % bytes.length] ^ ((k * 53 + ty) & 0xFF);
        k += 2;
        for(let bit = 0; bit < 8; bit++){
          const v = (((hi >> (7 - bit)) & 1) << 1) | ((lo >> (7 - bit)) & 1);
          if(!v) continue;
          x.fillStyle = PAL[v]; x.fillRect(tx * 8 + bit, ty * 8 + row, 1, 1);
        }
      }
    }
    return cv;
  } catch(e){ return null; }
}

<<<<<<< HEAD
/* ---------- MissingNo avant son nom : une fêlure dans l'image ----------
   Ce n'est pas une créature : une fêlure verticale, dont on ne voit que les bords
   (cyan à gauche, magenta à droite, comme la silhouette de l'archiviste d'avant).
   Tout au fond, à peine, les octets de ton nom : le L qu'il devient à « Regarde mon
   nom. » est déjà derrière. Au repos, la fêlure respire (quatre images) ; au combat
   de la Couche Zéro, elle s'ouvre, et le L en sort. */
const MN_BREATH = [0, 0.15, 0.3, 0.15];
const MN_SPR = {};
function mnRand(seed){
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* la fêlure, ouverte de k (0 : au repos, 1 : grande ouverte), sur une toile de 56 × 56 */
function mnCrackCanvas(name, k){
  try {
    const W = 56, cv = document.createElement("canvas");
    if(!cv.getContext) return null;
    cv.width = W; cv.height = W;
    const x = cv.getContext("2d"); if(!x || !x.createImageData) return null;
    let back = null;
    try { const nc = nameSpriteCanvas(name); if(nc) back = nc.getContext("2d").getImageData(0, 0, W, W).data; } catch(e){}
    const mask = new Uint8Array(W * W), rnd = mnRand(387);
    const knots = [[1, 31], [7, 27], [13, 33], [21, 24], [27, 31], [33, 26], [41, 33], [48, 26], [55, 29]];
    const cxAt = y => { for(let i = 0; i < knots.length - 1; i++){ const [y0, x0] = knots[i], [y1, x1] = knots[i + 1];
      if(y >= y0 && y <= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0); } return 28; };
    for(let y = 1; y < 55; y++){
      const t = (y - 1) / 54;
      const jit = [-1, 0, 0, 1][Math.floor(rnd() * 4)] * 0.7;
      const w = (0.6 + 9.5 * Math.pow(4 * t * (1 - t), 1.1)) * (1 + 0.8 * k) + jit, c = cxAt(y);
      for(let X = Math.round(c - w); X <= Math.round(c + w); X++) if(X >= 0 && X < W) mask[y * W + X] = 1;
    }
    for(const [sx, sy, sw, sh] of [[13, 14, 2, 2], [41, 19, 3, 2], [14, 37, 2, 3], [40, 44, 2, 2]])
      for(let y = sy; y < sy + sh; y++) for(let X = sx; X < sx + sw; X++) mask[y * W + X] = 1;
    const on = (X, y) => X >= 0 && y >= 0 && X < W && y < W && mask[y * W + X] === 1;
    const img = x.createImageData(W, W), d = img.data;
    const put = (i, r, g, b) => { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; };
    const a = 0.32 + 0.5 * k;
    for(let y = 0; y < W; y++) for(let X = 0; X < W; X++){
      if(!on(X, y)) continue;
      const i = (y * W + X) * 4;
      if(!on(X - 1, y)) put(i, 0x35, 0xf0, 0xd6);
      else if(!on(X + 1, y)) put(i, 0xff, 0x3d, 0x7f);
      else if(!on(X, y - 1) || !on(X, y + 1)) put(i, 0x3a, 0x30, 0x58);
      else if(back && back[i + 3]) put(i, Math.round(0x14 * (1 - a) + back[i] * a), Math.round(0x0d * (1 - a) + back[i + 1] * a), Math.round(0x26 * (1 - a) + back[i + 2] * a));
      else if(y % 3) put(i, 0x14, 0x0d, 0x26);
      else put(i, 0x1d, 0x14, 0x35);
    }
    x.putImageData(img, 0, 0);
    return cv;
  } catch(e){ return null; }
}
function mnSprite(k){
  k = Math.round((k || 0) * 100) / 100;
  const name = pzName(), key = name + "|" + k;
  if(MN_SPR[key]) return MN_SPR[key];
  let url = MISSING_SPRITE;
  try { const cv = mnCrackCanvas(name, k); if(cv) url = cv.toDataURL(); } catch(e){}
  return MN_SPR[key] = url;
}
/* les quatre images de la respiration, côte à côte : une bande pour les éléments de page */
function mnStrip(){
  const name = pzName(), key = name + "|strip";
  if(MN_SPR[key]) return MN_SPR[key];
  let url = null;
  try {
    const cv = document.createElement("canvas");
    if(cv.getContext){
      cv.width = 56 * MN_BREATH.length; cv.height = 56;
      const x = cv.getContext("2d");
      MN_BREATH.forEach((k, i)=>{ const f = mnCrackCanvas(name, k); if(f) x.drawImage(f, i * 56, 0); });
      url = cv.toDataURL();
    }
  } catch(e){ url = null; }
  return MN_SPR[key] = url;
}
/* l'image de la respiration à l'instant t (en ms), pour les dessins sur toile */
function mnFrame(t){ return mnSprite(MN_BREATH[Math.floor((t || 0) / 420) % MN_BREATH.length]); }
/* MissingNo dans une page : la bande animée, ou l'image fixe si la toile manque */
function mnSpriteHtml(cls){
  const strip = mnStrip();
  return strip ? `<span class="mnspr ${cls || ""}" style="background-image:url('${strip}')" role="img" aria-label="MissingNo"></span>`
    : `<img class="mnspr-fix ${cls || ""}" src="${MISSING_SPRITE}" alt="MissingNo">`;
}
/* la texture des sprites « sans index » (Pokédex, rencontres) suit le nom du joueur */
let MN_VAR = "";
function mnApplyVar(){
  try {
    const strip = mnStrip();
    if(!strip || strip === MN_VAR || typeof document === "undefined" || !document.documentElement) return;
    MN_VAR = strip;
    document.documentElement.style.setProperty("--glitchtile", `url("${strip}")`);
    document.documentElement.classList.add("mn-strip");
  } catch(e){}
}

=======
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
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
    /* les signes s'effacent sans assombrir ce qu'il y a dessous (le plateau peint) */
    ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = "source-over";
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
  /* effets réduits : une neige fixe et plus légère, qui ne scintille pas */
  const calm = typeof calmFx === "function" && calmFx();
  cv.classList.add("on"); cv.style.opacity = (0.05 + lv * 0.06) * (calm ? 0.45 : 1);
  const ctx = cv.getContext("2d"); cv.width = 160; cv.height = 280;
  const tick = () => {
    if(!cineAlive(c)) return;
    const img = ctx.createImageData(cv.width, cv.height);
    for(let i = 0; i < img.data.length; i += 4){
      const v = Math.random() * 255; img.data[i] = img.data[i+1] = img.data[i+2] = v; img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if(!calm) c.noise = requestAnimationFrame(tick);
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
  /* 1 — le monde d'avant : le laboratoire de la sauvegarde d'origine, chaud, entier */
  {beats:[
    {t:"bars", on:true},
    {t:"card", text:"SAUVEGARDE D'ORIGINE", sub:"lecture du fichier…", hold:1800},
    {t:"set", k:"labo", v:"warm", light:"warm", cam:{at:"monitor", z:1.5}},
    {t:"cam", to:[0.5, 0.52], z:1, ms:2200, wait:true},
    {t:"put", id:"prof", kind:"prop", prop:"prof", at:"prof", enter:"fade", wait:true},
    {t:"say", who:"prof", text:"Ah, te voilà ! Bienvenue dans le monde des Pokémon."},
    {t:"say", who:"prof", text:"Je suis le Professeur Racine. La plupart des gens m'appellent simplement « le Professeur »."},
    {t:"par", beats:[
      {t:"put", id:"m1", kind:"mon", mon:25, at:"offL", to:"m1", speed:74, face:"down", enter:"cut"},
      {t:"put", id:"m2", kind:"mon", mon:1, at:"offL", dy:8, to:"m2", speed:52, face:"down", enter:"cut"},
      {t:"put", id:"m3", kind:"mon", mon:4, at:"offR", dy:8, to:"m3", speed:58, face:"down", enter:"cut"},
      {t:"put", id:"m4", kind:"mon", mon:7, at:"offR", to:"m4", speed:50, face:"down", enter:"cut"},
      {t:"sfx", k:"shiny"}
    ]},
    {t:"wait", ms:1500},
    {t:"hop", id:"m1", n:2, h:6},
    {t:"say", who:"prof", text:"Ce monde est peuplé de créatures extraordinaires : les Pokémon."},
    {t:"say", who:"prof", text:"Certains vivent à nos côtés. D'autres dans les hautes herbes, au fond des lacs, ou là où personne n'a encore mis les pieds."},
    {t:"say", who:"prof", text:"J'ai consacré ma vie à les étudier. Et toi, tu vas bientôt—", auto:500}
  ]},
  /* 2 — la panne : le monde se défait devant nous, le laboratoire pourrit */
  {beats:[
    {t:"anim", id:"prof", data:{glitch:0.15}},
    {t:"fx", k:"glitch", lv:1, ms:320},
    {t:"say", who:"prof", text:"tu vas bientôt— bientôt— bientôt—", corrupt:0.04, auto:700},
    {t:"par", beats:[
      {t:"fx", k:"rgb", lv:2, ms:1400},
      {t:"fx", k:"noise", lv:1},
      {t:"gone", id:"m1", how:"tear"},
      {t:"gone", id:"m3", how:"tear"},
      {t:"anim", id:"prof", data:{glitch:0.35}}
    ]},
    {t:"say", who:"prof", text:"Ce monde est peuplé de créatures qu'on appelle les—", corrupt:0.3, auto:700},
    {t:"par", beats:[
      {t:"fx", k:"glitch", lv:2, ms:900},
      {t:"fx", k:"shake", lv:2, ms:900},
      {t:"gone", id:"m2", how:"tear"},
      {t:"gone", id:"m4", how:"tear"},
      {t:"set", k:"labo", v:"now", keep:["prof"], light:"dim"}
    ]},
    {t:"fx", k:"flash", lv:2},
    {t:"say", who:"sys", text:"ERREUR 0x00 — INDEX INTROUVABLE", auto:900},
    {t:"fx", k:"noise", lv:3},
    {t:"anim", id:"prof", data:{glitch:0.8}},
    {t:"say", who:"prof", text:"Bienvenue. Bienvenue. Bienvenue. Bienvenue.", corrupt:0.75, speed:14, auto:500},
    {t:"par", beats:[
      {t:"fx", k:"glitch", lv:3, ms:1200},
      {t:"fx", k:"shake", lv:3, ms:1200}
    ]},
    {t:"gone", id:"prof", how:"tear"},
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
      "> utilisateur avec droit d'écriture : connexion n° {cx}",
      "! mémoire de l'utilisateur : vide",
      "> recherche d'un processus d'entretien",
      "✓ PORYGON-Z.sys ............. trouvé",
      "> réveil forcé"
    ]},
    {t:"rain", on:true},
    {t:"wait", ms:CINE_T.mid}
  ]},
  /* 4 — le réveil : Porygon-Z s'assemble, couché, et se lève */
  {beats:[
    {t:"set", k:"terminal", st:{integ:0}},
    {t:"put", id:"pz", kind:"pz", at:"pz", holo:true, anim:"laying", loop:true, enter:"assemble", wait:true},
    {t:"anim", id:"pz", a:"wake", wait:true},
    {t:"fx", k:"flash", lv:1},
    {t:"mood", id:"pz", mood:"Stunned"},
    {t:"say", who:"pz", text:"…", auto:900},
    {t:"mood", id:"pz", mood:"Surprised"},
    {t:"say", who:"pz", text:"Réveil forcé. Mémoire de travail : vide. Heure système : inconnue. Humeur : — erreur, champ non prévu."},
    {t:"mood", id:"pz", mood:"Joyous"},
    {t:"say", who:"pz", text:"Oh. OH. Il y a quelqu'un ! Un vrai ! Avec des doigts et tout !"},
    {t:"mood", id:"pz", mood:"Normal"},
    {t:"say", who:"pz", text:"Pardon. Je suis Porygon-Z, programme d'entretien. Version instable. « Instable » fait partie de mon nom officiel. Je n'ai pas eu mon mot à dire."},
    {t:"mood", id:"pz", mood:"Worried"},
    {t:"say", who:"pz", text:"Le Professeur ne reviendra pas. Le fichier a cédé pendant qu'il te parlait. Il lui restait trois phrases. Je les ai vues partir."},
    {t:"mood", id:"pz", mood:"Determined"},
    {t:"say", who:"pz", text:"Mais toi, tu peux encore capturer des Pokémon. Chaque capture recoud un bout du monde. Moi, je ne peux que regarder et compter. Je compte extrêmement bien."},
    {t:"mood", id:"pz", mood:"Normal"},
    {t:"par", beats:[{t:"move", id:"pz", to:[0.5, 0.7], speed:40, face:"down"}, {t:"cam", to:[0.5, 0.6], z:1.5, ms:1000}]},
    {t:"ask", who:"pz", text:"Il me faut un nom pour t'inscrire au registre. « Utilisateur non identifié », c'est triste, et ça prend toute la ligne.", ph:"Ton nom"},
    {t:"mood", id:"pz", mood:"Happy"},
    {t:"wl", id:"reg", k:"file", at:[0.5, 0.24], title:"registre.sys", lines:["utilisateur : {nom}", "utilisateur : {nom}", "utilisateur : {nom}"]},
    {t:"say", who:"pz", text:"{nom}. Enregistré. Je l'ai écrit trois fois, au cas où."},
<<<<<<< HEAD
    {t:"wl", id:"reg", on:false},
    {t:"mood", id:"pz", mood:"Surprised"},
    {t:"letters", at:[0.5, 0.44], ms:2800, spread:12},
    {t:"say", who:"pz", text:"…C'est drôle. J'ai eu l'impression de le reconnaître, ton nom. Le bruit de fond, sûrement. Ça m'arrive."},
    {t:"cam", to:[0.5, 0.55], z:1, ms:900},
=======
    {t:"mood", id:"pz", mood:"Surprised"},
    {t:"say", who:"pz", text:"…C'est drôle. J'ai eu l'impression de le reconnaître, ton nom. Le bruit de fond, sûrement. Ça m'arrive."},
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
    {t:"mood", id:"pz", mood:"Happy"},
    {t:"say", who:"pz", text:"Pour le système, tu seras l'Archiviste. Pour moi, tu seras {nom}. Le système n'a pas besoin de le savoir."},
    {t:"mood", id:"pz", mood:"Determined"},
    {t:"say", who:"pz", text:"Intégrité du monde : zéro virgule zéro. Bonne nouvelle : à partir d'ici, on ne peut que monter."},
    {t:"rain", on:false},
    {t:"gone", id:"pz", how:"fade"},
    {t:"card", text:"POKÉMON CODE GENESIS", sub:"intégrité du monde : 0,0 %", hold:2400}
  ]}
]};
const CINEMAS = {intro: CINE_INTRO};
ACTIONS.cineplay = d => { const sc = cineFor(d.k); if(sc) playCine(sc, ()=>refresh()); };

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
const MAJOR_SCENES = new Set(["missingno_1","kanto_done","johto_done","hoenn_done","finale_gate","pz_twist",
  "boss_first_done","guardian_first","pz_region_full","epilogue_write",
  "pz_mem1","pz_mem2","pz_mem3","pz_mem4","pz_mem5","pz_mem6",
  "cy_e_open","cy_e_page","cy_e_mid","cy_w_open","cy_w_prof"]);

<<<<<<< HEAD
/* la table de mise en scène (STAGE) et le metteur en scène (directStory) : 37f-mise-en-scene.js */

/* une question du récit, en temps de cinématique : les options, puis sa réaction à ta réponse */
function storyQBeat(q){
  const Q = STORY_Q[q];
  const say = list => list.flatMap(l=>(l.m ? [{t:"mood", id:"pz", mood:l.m}] : []).concat([{t:"say", who:l.w || "", text:l.t}]));
  const branches = {};
  for(const k in Q.then) branches[k] = say(Q.then[k]);
  return {t:"choice", quick:true, q, title:Q.title, preset:()=>storyAns(q), on:k=>storyAnswer(q, k),
          opts:Q.opts.map(o=>({k:o.k, cmd:o.cmd, sub:o.sub})), branches};
=======
const DIRECTION = {
  missingno_1: {
    0:   [{t:"fx", k:"noise", lv:1}],
    3:   [{t:"fx", k:"shake", lv:2, ms:450}],
    7:   [{t:"fx", k:"noise", on:false}],
    11:  [{t:"fx", k:"rgb", lv:1, ms:500}]
  },
  kanto_half: { 4: [{t:"fx", k:"rgb", lv:1, ms:420}] },
  johto_done: {
    1:   [{t:"par", beats:[{t:"fx", k:"glitch", lv:2, ms:520}, {t:"fx", k:"shake", lv:2, ms:520}]}],
    end: [{t:"fx", k:"glitch", lv:1, ms:400}]
  },
  pz_twist: {
    1:   [{t:"fx", k:"noise", lv:1}],
    6:   [{t:"par", beats:[{t:"fx", k:"glitch", lv:2, ms:700}, {t:"fx", k:"flash", lv:2}]}],
    7:   [{t:"fx", k:"noise", on:false}, {t:"wait", ms:CINE_T.mid}]
  },
  pz_mem3: { 6: [{t:"fx", k:"rgb", lv:1, ms:380}], 8: [{t:"fx", k:"rgb", lv:2, ms:520}] },
  hoenn_mid: { 3: [{t:"fx", k:"rgb", lv:1, ms:420}] },
  pz_mem5: { 4: [{t:"fx", k:"glitch", lv:1, ms:360}] },
  /* le monde enfin propre : le décor chaud de l'ouverture revient — puis la faille, dessous */
  finale_gate: {
    0:   [{t:"fx", k:"flash", lv:1}],
    2:   [{t:"bg", k:"labo"}, {t:"wait", ms:CINE_T.long}],
    5:   [{t:"bg", k:"faille"}, {t:"fx", k:"noise", lv:1}, {t:"fx", k:"glitch", lv:2, ms:600}],
    end: [{t:"fx", k:"noise", on:false}]
  },
  epilogue_write: { 0: [{t:"bg", k:"labo"}] },
  cy_e_open: { 2: [{t:"wait", ms:CINE_T.mid}] },
  cy_e_page: { 0: [{t:"bg", k:"souvenir"}, {t:"mem", on:true}], end: [{t:"mem", on:false}] }
};

function directStory(sc){
  const lines = sc.lines || [];
  const whos = new Set(lines.map(l=>l.w || ""));
  const hasProf = whos.has("prof"), hasPz = whos.has("pz"), hasBad = whos.has("bad");
  const universe = hasBad ? "faille" : hasProf ? "labo" : "terminal";
  const rift = /^rift_/.test(sc.id || "");
  const major = rift || MAJOR_SCENES.has(sc.id);
  const memScene = !!sc.mem;
  /* places fixees d'avance : personne ne doit en chevaucher un autre */
  const pos = {
    prof: hasPz ? "left" : "center",
    mn:   hasPz ? "left" : "center",
    pz:   (hasProf || hasBad || whos.has("past") || !!sc.mem) ? "right" : "center"
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
      sub: rift ? `MissingNo · étape ${sc.id.split("_")[1]} / ${RIFT_ARC.length}` : memScene ? "mémoire de Porygon-Z"
         : hasBad ? "signal non indexé" : /^cy_/.test(sc.id || "") ? "connexion n° " + (typeof sagaConn === "function" ? sagaConn() : 12) : "journal de l'Archiviste",
      hold:1600});

  let badSeen = false, sysSeen = false, memOn = false;
  lines.forEach((l, i)=>{
    if(dir[i]) track(dir[i]);
    /* une réplique réservée à une autre réponse que la tienne */
    if(l.when && typeof storyWhen === "function" && !storyWhen(l.when)) return;
    /* une question de Porygon-Z : il est déjà en scène, il attend */
    if(l.q){ if(typeof STORY_Q !== "undefined" && STORY_Q[l.q]) beats.push(storyQBeat(l.q)); return; }
    const w = l.w || "";
    /* un souvenir : le décor passe au sépia, la silhouette de l'archiviste d'alors se tient là ;
       au retour, le présent reprend sa couleur */
    if(l.mem && !memOn){
      memOn = true; beats.push({t:"mem", on:true}, {t:"bg", k:"souvenir"}, {t:"sfx", k:"wobble"});
      /* chaque souvenir est celui d'une connexion passée : l'archiviste d'alors s'y tient */
      if(!on.has("self")) track([{t:"actor", id:"self", kind:"self", pos:"left", y:66, enter:"fade"}]);
    }
    if(!l.mem && memOn){
      memOn = false; beats.push({t:"mem", on:false}, {t:"bg", k:universe});
      if(on.has("self")) track([{t:"leave", id:"self", how:"fade"}]);
    }
    if(w === "past" && !on.has("self")) track([{t:"actor", id:"self", kind:"self", pos: hasPz ? "left" : "center", y:66, enter:"fade"}]);
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
    beats.push({t:"say", who: (w in CINE_WHO) ? w : "", text:l.t, corrupt: w === "bad" ? 0.05 : 0, mem:!!l.mem});
  });
  if(memOn) beats.push({t:"mem", on:false});
  if(dir.end) track(dir.end);
  for(const id of [...on]) track([{t:"leave", id, how:"fade"}]);
  return {id:sc.id, title, shots:[{bg:universe, beats}]};
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4
}
/* une question du récit, en temps de cinématique : les options, puis sa réaction à ta réponse */
function storyQBeat(q){
  const Q = STORY_Q[q];
  const say = list => list.flatMap(l=>(l.m ? [{t:"mood", id:"pz", mood:l.m}] : []).concat([{t:"say", who:l.w || "", text:l.t}]));
  const branches = {};
  for(const k in Q.then) branches[k] = say(Q.then[k]);
  return {t:"choice", quick:true, q, title:Q.title, preset:()=>storyAns(q), on:k=>storyAnswer(q, k),
          opts:Q.opts.map(o=>({k:o.k, cmd:o.cmd, sub:o.sub})), branches};
}
/* la cinematique d'une scene : ecrite a la main si elle existe, dirigee sinon */
function cineFor(id){
  if(CINEMAS[id]) return typeof CINEMAS[id] === "function" ? CINEMAS[id]() : CINEMAS[id];
  if(id === "__dyn" && typeof STORY_DYN !== "undefined" && STORY_DYN) return directStory(STORY_DYN);
  const sc = STORY_BY_ID[id];
  return sc ? directStory(sc) : null;
}
