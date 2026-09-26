/* ============================================================
   20 — INTERFACE : icones, routeur, modales, narration
   Aucun emoji : tout passe par des glyphes SVG dessines ici.
   ============================================================ */

const ICONS = {
  ball:   `<g><circle cx="12" cy="12" r="9" fill="#e8eef7" stroke="#0a0f1a" stroke-width="1.6"/><path d="M3 12h18" stroke="#0a0f1a" stroke-width="2"/><path d="M3 12a9 9 0 0 1 18 0z" fill="#e24b4b"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#0a0f1a" stroke-width="1.6"/></g>`,
  ball2:  `<g><circle cx="12" cy="12" r="9" fill="#e8eef7" stroke="#0a0f1a" stroke-width="1.6"/><path d="M3 12h18" stroke="#0a0f1a" stroke-width="2"/><path d="M3 12a9 9 0 0 1 18 0z" fill="#3f7fe0"/><path d="M8 6.5l1.6 2.6M16 6.5l-1.6 2.6" stroke="#e8eef7" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#0a0f1a" stroke-width="1.6"/></g>`,
  ball3:  `<g><circle cx="12" cy="12" r="9" fill="#e8eef7" stroke="#0a0f1a" stroke-width="1.6"/><path d="M3 12h18" stroke="#0a0f1a" stroke-width="2"/><path d="M3 12a9 9 0 0 1 18 0z" fill="#f2c033"/><path d="M5 9h5M14 9h5" stroke="#1a1a1a" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#0a0f1a" stroke-width="1.6"/></g>`,
  ball4:  `<g><circle cx="12" cy="12" r="9" fill="#0d1b24" stroke="#35f0d6" stroke-width="1.6"/><path d="M3 12h18" stroke="#35f0d6" stroke-width="1.6"/><path d="M6 8h3v2H6zM15 14h3v2h-3zM10 5h2v2h-2z" fill="#35f0d6" opacity=".85"/><circle cx="12" cy="12" r="3" fill="#35f0d6"/></g>`,
  ball5:  `<g><circle cx="12" cy="12" r="9" fill="#e8eef7" stroke="#0a0f1a" stroke-width="1.6"/><path d="M3 12h18" stroke="#0a0f1a" stroke-width="2"/><path d="M3 12a9 9 0 0 1 18 0z" fill="#8b5cf6"/><path d="M7 7l1.5 1.5M8.5 7L7 8.5" stroke="#fff" stroke-width="1.4"/><text x="14.5" y="9.6" font-size="6" fill="#fff" font-family="monospace">M</text><circle cx="12" cy="12" r="3" fill="#fff" stroke="#0a0f1a" stroke-width="1.6"/></g>`,
  coin:   `<g><circle cx="12" cy="12" r="8.5" fill="#ffc857" stroke="#7a5a12" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="none" stroke="#7a5a12" stroke-width="1.2"/><path d="M12 8v8M9.5 10h5" stroke="#7a5a12" stroke-width="1.4"/></g>`,
  shard:  `<g><path d="M12 2l7 6-3 13-8 1L4 9z" fill="#35f0d6" opacity=".85" stroke="#0d5d53" stroke-width="1.2"/><path d="M12 2l-2 20M4 9l15 -1" stroke="#0a2b28" stroke-width="1"/></g>`,
  core:   `<g><path d="M12 2l9 5v10l-9 5-9-5V7z" fill="#1a1230" stroke="#8b5cf6" stroke-width="1.6"/><path d="M12 7l4.5 2.5v5L12 17l-4.5-2.5v-5z" fill="#8b5cf6" opacity=".7"/><circle cx="12" cy="12" r="1.8" fill="#fff"/></g>`,
  energy: `<g><path d="M13 2L5 13h5l-1 9 9-12h-5z" fill="#ffe45e" stroke="#8a6c12" stroke-width="1.2"/></g>`,
  star:   `<g><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="#ffc857" stroke="#7a5a12" stroke-width="1.1"/></g>`,
  trophy: `<g><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#ffc857" stroke="#7a5a12" stroke-width="1.3"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" fill="none" stroke="#7a5a12" stroke-width="1.3"/><path d="M10 14h4v3h-4zM7 19h10v2H7z" fill="#ffc857" stroke="#7a5a12" stroke-width="1.2"/></g>`,
  check:  `<path d="M4 13l5 5L20 6" fill="none" stroke="#5ce07a" stroke-width="2.6"/>`,
  cross:  `<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2"/>`,
  lock:   `<g><rect x="5" y="10" width="14" height="11" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/></g>`,
  capture:`<g><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 12h16" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/></g>`,
  grid:   `<g fill="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></g>`,
  dex:    `<g><rect x="4" y="3" width="16" height="18" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="8" r="2.4" fill="currentColor"/><path d="M8 13h8M8 16h8" stroke="currentColor" stroke-width="1.6"/></g>`,
  shop:   `<g><path d="M4 8h16l-1.5 12h-13z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></g>`,
  user:   `<g><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" stroke-width="1.8"/></g>`,
  fish:   `<g><path d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M17 12l4-3v6z" fill="currentColor"/><circle cx="8" cy="11" r="1" fill="currentColor"/></g>`,
  box:    `<g><path d="M3 8l9-4 9 4v9l-9 4-9-4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 8l9 4 9-4M12 12v9" stroke="currentColor" stroke-width="1.5"/></g>`,
  map:    `<g><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 4v14M15 6v14" stroke="currentColor" stroke-width="1.4"/></g>`,
  cards:  `<g><rect x="3" y="6" width="10" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="9" y="3" width="10" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/></g>`,
  boss:   `<g><path d="M12 2l3 5 5 1-3.5 4 1 6-5.5-3-5.5 3 1-6L4 8l5-1z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="11" r="2" fill="currentColor"/></g>`,
  idle:   `<g><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5.5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.7"/></g>`,
  quest:  `<g><rect x="4" y="3" width="16" height="18" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.5"/></g>`,
  bolt:   `<path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="currentColor"/>`,
  fire:   `<path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-.5-2 2 1 3.5 3 3.5 5a6 6 0 0 1-12 0c0-5 6-6 6-12z" fill="currentColor"/>`,
  arrow:  `<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/>`,
  battle: `<g><path d="M4 20l9-9M20 4l-5 1-8 8 3 3 8-8z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M20 20l-6-6" stroke="currentColor" stroke-width="1.7"/></g>`,
  seed:   `<g><circle cx="12" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8c0-4 3-6 3-6s0 4-3 6z" fill="currentColor"/></g>`,
  stone:  `<g><path d="M12 3l7 6-3 11H8L5 9z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v17M5 9h14" stroke="currentColor" stroke-width="1.2"/></g>`,
  chest:  `<g><rect x="3" y="9" width="18" height="11" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 9a9 4 0 0 1 18 0" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="10.5" y="11" width="3" height="5" fill="currentColor"/></g>`,
  wave:   `<path d="M2 10c3-4 5 4 8 0s5 4 8 0M2 16c3-4 5 4 8 0s5 4 8 0" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
  node:   `<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/>`,
  heart:  `<path d="M12 20s-8-5-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10z" fill="currentColor"/>`,
  shard2: `<g><path d="M6 3h12l2 7-8 11-8-11z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 3l6 18 6-18M4 10h16" stroke="currentColor" stroke-width="1.2"/></g>`,
  eye:    `<g><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="currentColor"/></g>`,
  gear:   `<g><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" stroke-width="1.7"/></g>`,
  refresh:`<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="1.8"/>`
};
/* toute icone porte la classe `gi` : elle a donc une taille par defaut meme
   dans un contexte qui ne la style pas. Les regles de composant la surchargent. */
function ic(name, cls){
  const g = ICONS[name] || ICONS.node;
  return `<svg viewBox="0 0 24 24" class="gi ${cls||""}" aria-hidden="true">${g}</svg>`;
}
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* --- sprites ---------------------------------------------------------
   Base garantie : atlas PNG embarque dans le fichier (aucun reseau requis).
   Amelioration : si l'environnement autorise les requetes externes, un GIF
   anime vient se superposer. La sonde est faite une fois au demarrage.
   -------------------------------------------------------------------- */
let ANIM_OK = false;
const SPR_JSD = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/";
const SPR_ANI = "versions/generation-v/black-white/animated/";

function slugOf(id){ return id <= 386 ? SLUGS[id-1] : SLUG_EXTRA[id]; }
/* l'atlas contient d'abord toutes les faces, puis les dos */
function atlasIndex(id, back){
  if(back) return (id >= 1 && id <= 386) ? ATLAS_BACK0 + id - 1 : -1;
  if(id === 474) return 386;
  return (id >= 1 && id <= 386) ? id - 1 : -1;
}
function animUrl(id, shiny, back){
  return SPR_JSD + SPR_ANI + (back ? "back/" : "") + (shiny ? "shiny/" : "") + id + ".gif";
}
function installSpriteVars(){
  const r = document.documentElement.style;
  r.setProperty("--pzstrip", `url("${PZ_STRIP}")`);
  r.setProperty("--atlas", `url("${ATLAS_URL}")`);
  if(typeof ATLAS_SHINY_URL !== "undefined") r.setProperty("--atlas-shiny", `url("${ATLAS_SHINY_URL}")`);
  r.setProperty("--cardatlas", `url("${CARD_ATLAS}")`);
  r.setProperty("--glitchtile", `url("${MISSING_SPRITE}")`);
}
/* teste une seule image ; en cas de succes les grandes vues passent en anime */
function probeAnimated(){
  try{
    const img = new Image();
    img.onload = () => { ANIM_OK = true; refresh(); };
    img.onerror = () => { ANIM_OK = false; };
    img.src = animUrl(25, false);
  }catch(e){ ANIM_OK = false; }
}

function sprite(id, shiny, cls, opts){
  if(typeof opts === "string") opts = {attrs: opts};
  opts = opts || {};
  const idx = atlasIndex(id, opts.back);
  if(idx < 0){
    return `<span class="spr missing ${cls||""}" ${opts.attrs||""}></span>`;
  }
  const c = idx % ATLAS_COLS, r = Math.floor(idx / ATLAS_COLS);
  const wantAnim = opts.anim && ANIM_OK;
  /* la teinte porte sur l'atlas, la lueur sur l'ensemble : si le GIF echoue,
     le sprite reste visiblement chromatique. */
  const shinyCls = shiny ? "shiny shinyglow" : "";
  /* quand le GIF se charge, on efface le fond d'atlas : sinon les deux
     versions du sprite restent visibles l'une derriere l'autre */
  const over = wantAnim
    ? `<img class="sprani" src="${animUrl(id, shiny, opts.back)}" alt="" decoding="async"
         onerror="this.remove()" onload="this.classList.add('on');this.parentNode.classList.add('animon')">`
    : "";
  return `<span class="spr ${cls||""} ${shinyCls}" style="--sc:${c};--sr:${r}"
    ${opts.attrs||""}>${over}</span>`;
}
function sprBox(id, shiny, size, opts){
  opts = opts || {};
  return `<span class="sprbox" style="width:${size}px;height:${size}px">
    ${sprite(id, shiny, "", opts)}${opts.shadow ? '<i class="sprshadow"></i>' : ""}</span>`;
}
function typeTags(types){
  return types.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("");
}
function rarTag(r){
  return `<span class="tt rar r${r}" style="--rc:${RARITY[r].c}">${RARITY[r].n}</span>`;
}

/* --- visage de Porygon-Z ---
   Son humeur suit l'etat du monde : inquiet tant que l'integrite est basse,
   confiant quand elle remonte. Une ligne de dialogue peut forcer une emotion. */
function pzMood(line){
  if(line && line.m && PZ_EMOS.includes(line.m)) return line.m;
  if(S && S.flags && S.flags.climax) return "Determined";
  const i = S ? S.integrity : 0;
  if(i < 12) return "Worried";
  if(i < 40) return "Normal";
  if(i < 75) return "Determined";
  if(i < 99) return "Happy";
  return "Joyous";
}
function pzFace(mood, size, cls){
  const i = Math.max(0, PZ_EMOS.indexOf(mood || "Normal"));
  return `<span class="pzface ${cls||""}" style="--pe:${i};width:${size}px;height:${size}px"></span>`;
}

/* --- portraits de personnages (dessins originaux, aucun asset importe) --- */
const CHAR_ART = {
  /* Prof. Racine : personnage original, dessine pour ce jeu (build_chars.py),
     au meme cadrage que les portraits du guide. */
  prof: `<img class="portrait charpx" src="${PROF_PORTRAIT}" alt="">`,
  sys: `<svg viewBox="0 0 40 40" class="portrait" shape-rendering="crispEdges">
    <rect width="40" height="40" fill="#050a12"/>
    <rect x="3" y="5" width="34" height="26" fill="#050a12" stroke="#35f0d6" stroke-width="1.5"/>
    <rect x="6"  y="9"  width="3"  height="2" fill="#35f0d6"/>
    <rect x="11" y="9"  width="14" height="2" fill="#1b8f80"/>
    <rect x="6"  y="14" width="3"  height="2" fill="#35f0d6"/>
    <rect x="11" y="14" width="20" height="2" fill="#1b8f80"/>
    <rect x="6"  y="19" width="3"  height="2" fill="#35f0d6"/>
    <rect x="11" y="19" width="9"  height="2" fill="#1b8f80"/>
    <rect x="11" y="24" width="5"  height="2" fill="#35f0d6"/>
    <rect x="15" y="33" width="10" height="4" fill="#35f0d6" opacity=".45"/>
  </svg>`
};

function storyPortrait(w, sceneArt, line){
  if(w === "pz")   return `<span data-act="pzpoke">${pzFace(pzMood(line), 132, "big")}</span>`;
  if(w === "prof") return CHAR_ART.prof;
  if(w === "sys")  return CHAR_ART.sys;
  if(w === "bad")  return `<span class="spr lg missing glitchart"></span>`;
  if(sceneArt >= 0) return sprite(sceneArt, false, "lg", {anim:true, eager:true});
  return "";
}

/* --- toasts --- */
/* Un succes sans sa condition n'apprend rien : on affiche ce qui a ete fait,
   et ce que ca rapporte. */
function achToast(a){
  const box = document.getElementById("toasts");
  if(!box) return;
  const d = document.createElement("div");
  d.className = "toast warn achtoast";
  d.innerHTML = ic("trophy") +
    `<div class="grow">
      <div class="at-n">${esc(a.n)}</div>
      <div class="at-d">${esc(a.d || "")}</div>
      ${a.rw && Object.keys(a.rw).length
        ? `<div class="at-r">${esc(rewardText(a.rw))}</div>` : ""}
    </div>`;
  box.appendChild(d);
  Sfx.win();
  setTimeout(()=>{ d.style.transition = "opacity .45s"; d.style.opacity = 0;
    setTimeout(()=>d.remove(), 470); }, 5200);
  while(box.children.length > 3) box.firstChild.remove();
}

function toast(msg, kind, icon){
  const box = document.getElementById("toasts");
  if(!box) return;
  const d = document.createElement("div");
  d.className = "toast " + (kind||"");
  d.innerHTML = (icon?ic(icon):"") + `<span>${esc(msg)}</span>`;
  box.appendChild(d);
  setTimeout(()=>{ d.style.transition="opacity .45s"; d.style.opacity=0; setTimeout(()=>d.remove(),470); }, 3600);
  while(box.children.length > 3) box.firstChild.remove();
}
function pzFlash(txt){
  if(!txt) return;
  const box = document.getElementById("toasts");
  if(!box) return;
  const d = document.createElement("div");
  d.className = "toast pz";
  /* le guide reste visible pendant la partie, pas seulement dans les scenes */
  d.innerHTML = pzFace(pzMood(), 26) + `<span>${esc(txt)}</span>`;
  box.appendChild(d);
  setTimeout(()=>{ d.style.opacity=0; setTimeout(()=>d.remove(),320); }, 2400);
}
function buzz(ms){
  if(!S || !S.settings.haptics) return;
  if(navigator.vibrate) { try{ navigator.vibrate(ms||12); }catch(e){} }
}

/* --- son procedural (WebAudio, aucun fichier externe) --- */
const Sfx = (function(){
  let ctx = null;
  function ac(){ if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return ctx; }
  function beep(freq, dur, type, vol, slide){
    if(!S || !S.settings.sfx) return;
    const c = ac(); if(!c) return;
    if(c.state === "suspended") c.resume();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type||"square"; o.frequency.setValueAtTime(freq, c.currentTime);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,slide), c.currentTime+dur);
    g.gain.setValueAtTime(vol||0.05, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+dur);
  }
  return {
    click(){ beep(420, .05, "square", .035); },
    throwb(){ beep(300, .16, "triangle", .05, 720); },
    wobble(){ beep(520, .07, "square", .04); },
    caught(){ beep(660,.09,"square",.05); setTimeout(()=>beep(880,.1,"square",.05),90);
              setTimeout(()=>beep(1180,.2,"square",.05),190); },
    fail(){ beep(220, .22, "sawtooth", .05, 110); },
    shiny(){ [0,90,180,270].forEach((d,i)=>setTimeout(()=>beep(880+i*220,.12,"sine",.05),d)); },
    hit(){ beep(160,.09,"sawtooth",.05,80); },
    coin(){ beep(1050,.06,"square",.035); setTimeout(()=>beep(1400,.08,"square",.035),60); },
    glitch(){ for(let i=0;i<6;i++) setTimeout(()=>beep(80+Math.random()*900,.04,"sawtooth",.04),i*40); },
    win(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.16,"square",.05),i*110)); },
    lose(){ [400,330,260,180].forEach((f,i)=>setTimeout(()=>beep(f,.2,"triangle",.05),i*130)); }
  };
})();

/* --- routeur --- */
const SCREENS = {};
const ACTIONS = {};
let currentScreen = "capture";
let screenArg = null;

function go(name, arg){
  if(!SCREENS[name]) return;
  if(typeof stopAim === "function") stopAim();
  const changed = currentScreen !== name;
  currentScreen = name; screenArg = arg||null;
  render(changed);
  document.getElementById("screen").scrollTop = 0;
}
function render(anim){
  const host = document.getElementById("screen");
  const def = SCREENS[currentScreen];
  host.innerHTML = def.html(screenArg);
  if(anim){ host.classList.remove("swap"); void host.offsetWidth; host.classList.add("swap"); }
  if(def.after) def.after(host, screenArg);
  renderTopbar();
  renderDock();
  renderAdmFab();
}
function refresh(){ if(document.getElementById("screen")) render(); }

/* delegation d'evenements : tout element [data-act] declenche ACTIONS[act] */
document.addEventListener("click", e=>{
  const t = e.target.closest("[data-act]");
  if(!t) return;
  const fn = ACTIONS[t.dataset.act];
  if(fn){ Sfx.click(); fn(t.dataset, t, e); }
});

/* --- barre superieure ---
   Le profil y figure en miniature, avec ses cosmetiques : cadre, fond et
   effet se voient ainsi depuis tous les ecrans, pas seulement le profil. */
function topbarMe(need){
  const frame = COSMETICS[S.cos.frame] || {cls:""};
  const bg = COSMETICS[S.cos.bg] || {};
  const title = COSMETICS[S.cos.title] || {n:""};
  const pct = Math.min(100, S.xp / need * 100);
  return `<div class="tb-me ${typeof heroFxCls === "function" ? heroFxCls() : ""}"
      style="background:${bg.css || "linear-gradient(180deg,var(--s2),var(--s1))"}"
      data-act="goto" data-to="profile" title="Profil">
    ${typeof heroFxLayer === "function" ? heroFxLayer() : ""}
    <div class="avatar mini ${frame.cls || ""}">${avatarHtml(28)}</div>
    <div class="tb-id">
      <div class="tb-name">${esc(S.name)}</div>
      <div class="tb-title">${esc(title.n)} · niv.${S.level}</div>
      <div class="tb-xp"><i style="width:${pct.toFixed(1)}%"></i></div>
    </div>
  </div>`;
}
function renderTopbar(){
  const ev = currentEvent();
  const need = xpForLevel(S.level);
  const cur = [["coins","coin"],["shards","shard"],["cores","core"]];
  document.getElementById("topbar").innerHTML = `
    <div class="tb-row">
      ${topbarMe(need)}
      <div class="tb-cur">
        ${cur.map(([k,i])=>`<span class="pill" data-cur="${k}">${ic(i)}<b class="mono-num">${fmt(S[k])}</b></span>`).join("")}
      </div>
    </div>
    <div class="integrity">
      <span class="lbl" data-act="integtap">INTÉGRITÉ</span>${infoBtn("integrity")}
      <span class="ibar"><i style="width:${S.integrity.toFixed(2)}%"></i></span>
      <span class="ipct mono-num">${S.integrity.toFixed(1)}%</span>
    </div>
    ${ev?`<div class="tiny gold-t" style="margin-top:4px">${esc(ev.n)} · ${fmtTime(ev.until-Date.now())}</div>`:""}`;
}

const DOCK = [
  {k:"capture",  n:"Capture", i:"capture"},
  {k:"modules",  n:"Modules", i:"grid"},
  {k:"dex",      n:"Collection", i:"dex"},
  {k:"bag",      n:"Sac",     i:"box"},
  {k:"profile",  n:"Profil",  i:"user"}
];
function renderDock(){
  const d = document.getElementById("dock");
  const alerts = {
    modules: canOpenBox() || questsReady(),
    dex: moduleUnlocked("eggs") && eggState().inc.some(x=>x.steps >= EGG_TIERS[x.tier].steps),
    profile: false
  };
  d.innerHTML = DOCK.map(x=>`<button data-act="nav" data-to="${x.k}" class="${currentScreen===x.k?"on":""}">
      ${ic(x.i)}<span>${x.n}</span>${alerts[x.k]?'<i class="badge"></i>':""}</button>`).join("");
}
ACTIONS.nav = d => { go(d.to); if(!checkStoryTriggers()) guideTick(); };
function questsReady(){ return (S.quests||[]).some(q=>q.prog>=q.goal && !q.claimed) || S.login.claimed !== today(); }

/* bandeau d'intention : chaque module dit en une phrase a quoi il sert
   et ce qu'il rapporte au reste du jeu. */
function moduleGoal(what, gives){
  return `<div class="goalbar">
    <span class="gb-ic">${ic("eye")}</span>
    <div class="grow"><div class="gb-w">${what}</div>
      <div class="gb-g">Rapporte : ${gives}</div></div>
  </div>`;
}

/* --- feuilles modales --- */
let SHEET_OPEN = false;
function sheetOpen(){ return SHEET_OPEN; }
function sheet(html, mid){
  const root = document.getElementById("sheet-root");
  if(!root) return;
  SHEET_OPEN = true;
  root.className = "on";
  root.innerHTML = `<div class="scrim" data-act="closesheet"></div><div class="sheet ${mid?"mid":""}">${html}</div>`;
}
function closeSheet(){ SHEET_OPEN = false;
  const r = document.getElementById("sheet-root"); if(!r) return; r.className=""; r.innerHTML=""; }
ACTIONS.closesheet = closeSheet;
function sheetHead(title){
  return `<div class="sheet-h"><div class="h" style="margin:0">${esc(title)}</div>
    <button class="x" data-act="closesheet">${ic("cross")}</button></div>`;
}

/* --- lecteur narratif --- */
let storyQueue = [], storyIdx = 0, storyTyping = null, storyDone = null, storyCur = null;

function playStory(id, onDone){
  /* Une scene qui possede une cinematique la joue TOUJOURS, quel que soit le
     chemin qui la demande — ouverture, journal, outil de test. Sans ce
     renvoi, seul le tout premier demarrage montrait la cinematique : le
     journal et l'outil game master rejouaient l'ancienne scene. */
  if(typeof cineFor === "function"){
    const cine = cineFor(id);
    if(cine){
      if(id !== "__dyn" && !S.story.includes(id)) S.story.push(id);
      playCine(cine, onDone);
      return;
    }
  }
  /* une scene peut etre fournie a la volee : l'arc de la faille n'est pas
     dans le catalogue fixe, il se construit au fil des rencontres */
  const dyn = (id === "__dyn" && typeof STORY_DYN !== "undefined") ? STORY_DYN : null;
  const sc = dyn || STORY_BY_ID[id];
  if(!sc) { onDone && onDone(); return; }
  if(!dyn && !S.story.includes(id)) S.story.push(id);
  storyCur = sc; storyQueue = sc.lines; storyIdx = 0; storyDone = onDone;
  const box = document.getElementById("story");
  if(!box){ onDone && onDone(); return; }
  box.className = "on";
  box.innerHTML = `
    <div class="story-bg"></div>
    <div class="art" id="story-art"></div>
    <div class="box">
      <div class="who" id="story-who"></div>
      <div class="txt" id="story-txt"></div>
      <div class="nx" id="story-nx">toucher pour continuer</div>
      <i class="prog" id="story-prog" style="width:0%"></i>
    </div>`;
  box.onclick = storyAdvance;
  showLine();
  saveSoon();
}
function showLine(){
  const l = storyQueue[storyIdx];
  if(!l){ endStory(); return; }
  const who = document.getElementById("story-who");
  const txt = document.getElementById("story-txt");
  const art = document.getElementById("story-art");
  const box = document.getElementById("story");
  /* la teinte de la scene suit celui qui parle */
  if(box) box.setAttribute("data-who", l.w || "");
  if(art){
    const pic = storyPortrait(l.w, storyCur ? storyCur.art : -1, l);
    if(pic && pic !== art.dataset.last){
      art.dataset.last = pic;
      art.innerHTML = pic;
      art.classList.remove("swapin"); void art.offsetWidth; art.classList.add("swapin");
    }
  }
  /* la faille secoue la scene */
  if(l.w === "bad" && box){
    box.classList.remove("jolt"); void box.offsetWidth; box.classList.add("jolt");
  }
  const names = {sys:"SYSTÈME", pz:"PORYGON-Z", prof:"PROF. RACINE", bad:"?????"};
  who.className = "who " + (l.w==="sys"?"sys":l.w==="bad"?"bad":"");
  who.textContent = names[l.w] || "";
  const nx0 = document.getElementById("story-nx");
  if(nx0) nx0.classList.remove("ready");
  if(l.w === "bad") Sfx.glitch();
  else if(l.w === "pz") Sfx.click();
  const pr = document.getElementById("story-prog");
  if(pr) pr.style.width = ((storyIdx+1) / storyQueue.length * 100) + "%";
  txt.innerHTML = "";
  let i = 0;
  const full = l.t;
  clearInterval(storyTyping);
  storyTyping = setInterval(()=>{
    i += 2;
    let s = full.slice(0, i);
    if(l.g && i < full.length){
      s = s.replace(/.$/, String.fromCharCode(33+Math.floor(rng()*90)));
    }
    txt.innerHTML = esc(s) + (i<full.length?'<span class="caret">▌</span>':"");
    if(i >= full.length){
      clearInterval(storyTyping);
      const nx = document.getElementById("story-nx");
      if(nx) nx.classList.add("ready");
    }
  }, 16);
}
function storyAdvance(){
  const l = storyQueue[storyIdx];
  const txt = document.getElementById("story-txt");
  if(l && txt && txt.textContent.replace("▌","").length < l.t.length){
    clearInterval(storyTyping); txt.textContent = l.t; return;
  }
  storyIdx++;
  if(storyIdx >= storyQueue.length) endStory(); else showLine();
}
function endStory(){
  clearInterval(storyTyping);
  const box = document.getElementById("story");
  box.className = ""; box.innerHTML = ""; box.onclick = null;
  const cb = storyDone; storyDone = null; storyCur = null;
  checkAchievements();
  save();
  if(cb) cb(); else refresh();
}

/* --- declencheurs narratifs --- */
function seen(id){ return S.story.includes(id); }
function checkStoryTriggers(){
  if(document.getElementById("story").className === "on") return false;
  const K = dexCount("kanto"), J = dexCount("johto"), H = dexCount("hoenn");
  const beat = (id, cond) => (!seen(id) && cond);

  if(beat("first_catch", S.stats.catches >= 1)) return playStory("first_catch"), true;
  if(beat("beat_early", S.integrity >= 3)) return playStory("beat_early"), true;
  if(beat("pz_box", S.stats.boxOpens >= 1)) return playStory("pz_box"), true;
  if(beat("pz_shiny", S.stats.shinies >= 1)) return playStory("pz_shiny"), true;
  if(beat("pz_first_guardian_fail", S.flags.guardFail)) return playStory("pz_first_guardian_fail"), true;
  if(S.flags.rodReveal && !sheetOpen()){
    S.flags.rodReveal = false; save();
    if(showRodDiscovery()) return true;
  }
  if(S.flags.eggReveal && !sheetOpen()){
    const t = S.flags.eggReveal; S.flags.eggReveal = null; save();
    if(showEggDiscovery(t)) return true;
  }
  if(beat("pz_egg", (S.stats.hatched||0) >= 1)) return playStory("pz_egg"), true;
  if(beat("pz_treasure", (S.stats.treasures||0) >= 1)) return playStory("pz_treasure"), true;
  if(beat("pz_buddy", buddyTier() >= 2)) return playStory("pz_buddy"), true;
  if(beat("pz_region_full", REGIONS.some(r=>dexRegionPct(r.key) >= 99.9))) return playStory("pz_region_full"), true;
  if(beat("pz_cycle", cycleN() >= 1)) return playStory("pz_cycle"), true;
  /* second arc : il ne se declenche qu'a partir du deuxieme cycle */
  if(beat("arc2_open", cycleN() >= 1)) return playStory("arc2_open"), true;
  if(beat("arc2_prof", cycleN() >= 1 && S.stats.catches >= 20)) return playStory("arc2_prof"), true;
  if(beat("arc2_zero", cycleN() >= 1 && S.integrity >= 40)) return playStory("arc2_zero"), true;
  if(beat("arc2_end",  cycleN() >= 2)) return playStory("arc2_end"), true;
  if(beat("kanto_half", K >= 45)) return playStory("kanto_half"), true;
  if(beat("guardian_first", moduleUnlocked("boss"))) return playStory("guardian_first"), true;
  if(beat("boss_first_done", S.bosses.length >= 1)) return playStory("boss_first_done"), true;
  if(beat("missingno_1", S.flags.sawMissing)) return playStory("missingno_1"), true;
  if(beat("kanto_done", S.bosses.includes("kanto:150"))) return playStory("kanto_done"), true;
  if(beat("johto_mid", J >= 45)) return playStory("johto_mid"), true;
  if(beat("johto_done", S.bosses.includes("johto:249"))) return playStory("johto_done"), true;
  if(beat("hoenn_mid", H >= 60)) return playStory("hoenn_mid"), true;
  if(beat("hoenn_done", S.bosses.includes("hoenn:384"))) return playStory("hoenn_done"), true;
  if(beat("climax", S.integrity >= 100 && S.bosses.length >= 9)){
    S.flags.climax = true;
    playStory("climax", ()=>{ playStory("epilogue", ()=>{ S.flags.zero = true; refresh(); }); });
    return true;
  }
  return false;
}
