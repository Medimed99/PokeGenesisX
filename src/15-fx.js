/* ============================================================
   15 — RETOUR SENSORIEL (particules, gains flottants, transitions)
   ============================================================ */

function fxLayer(){ return document.getElementById("fx"); }
/* selecteur tolerant : la couche d'effets ne doit jamais interrompre le jeu */
function fxQ(sel){
  try { return document.querySelector ? document.querySelector(sel) : null; }
  catch(e){ return null; }
}

/* gerbe de particules a une position absolue de l'ecran */
function burst(x, y, opts){
  const host = fxLayer(); if(!host) return;
  opts = opts || {};
  const n = opts.n || 14;
  const colors = opts.colors || ["#35f0d6", "#ffc857", "#ffffff"];
  for(let i=0;i<n;i++){
    const p = document.createElement("i");
    p.className = "pt";
    const ang = (Math.PI*2) * (i/n) + rng()*0.5;
    const dist = (opts.spread || 60) * (0.45 + rng()*0.75);
    const size = opts.size || (3 + rng()*4);
    p.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;
      background:${colors[i % colors.length]};opacity:1;
      transition:transform ${(opts.dur||700)}ms cubic-bezier(.15,.8,.3,1), opacity ${(opts.dur||700)}ms linear;`;
    host.appendChild(p);
    requestAnimationFrame(()=>{
      p.style.transform = `translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist - (opts.lift||14)}px) scale(.25)`;
      p.style.opacity = "0";
    });
    setTimeout(()=>p.remove(), (opts.dur||700) + 60);
  }
}
/* gerbe centree sur un element */
function burstEl(el, opts){
  if(!el) return;
  const host = fxLayer(); if(!host) return;
  const r = el.getBoundingClientRect(), h = host.getBoundingClientRect();
  burst(r.left - h.left + r.width/2, r.top - h.top + r.height/2, opts);
}

/* nombre flottant */
function numPop(x, y, text, color){
  const host = fxLayer(); if(!host) return;
  const d = document.createElement("div");
  d.className = "numpop";
  d.style.left = x + "px"; d.style.top = y + "px";
  d.style.color = color || "var(--amber)";
  d.textContent = text;
  host.appendChild(d);
  setTimeout(()=>d.remove(), 1050);
}
function numPopEl(el, text, color){
  const host = fxLayer(); if(!host || !el) return;
  const r = el.getBoundingClientRect(), h = host.getBoundingClientRect();
  numPop(r.left - h.left + r.width/2 - 14, r.top - h.top, text, color);
}

/* secousse de l'application entiere */
function shakeApp(){
  const a = document.getElementById("app");
  if(!a) return;
  a.classList.remove("shake"); void a.offsetWidth; a.classList.add("shake");
  setTimeout(()=>a.classList.remove("shake"), 400);
}

/* ---- gains de monnaie : pastille qui rebondit + nombre flottant ---- */
const CUR_COLOR = {coins:"var(--amber)", shards:"var(--cyan)", cores:"var(--violet)", energy:"var(--amber)"};
let fxQueue = {};
Bus.on("currency", d=>{
  if(d.n <= 0 || d.cur === "energy") return;
  fxQueue[d.cur] = (fxQueue[d.cur]||0) + d.n;
  clearTimeout(fxQueue._t);
  fxQueue._t = setTimeout(flushCurrencyFx, 140);
});
function flushCurrencyFx(){
  for(const cur in fxQueue){
    if(cur === "_t") continue;
    const el = fxQ(`.pill[data-cur="${cur}"]`);
    if(el){
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
      numPopEl(el, "+" + fmt(fxQueue[cur]), CUR_COLOR[cur]);
    }
  }
  fxQueue = {};
}

/* ---- montee de niveau ---- */
Bus.on("levelup", lv=>{
  const box = document.getElementById("levelup");
  if(!box) return;
  box.innerHTML = `<div class="lu">
      <div class="tiny cy" style="letter-spacing:2px">NIVEAU D'ARCHIVISTE</div>
      <div class="n">${lv}</div>
      <div class="tiny muted" style="margin-top:8px">Privilèges d'écriture étendus</div>
    </div>`;
  box.className = "on";
  const h = box.getBoundingClientRect();
  for(let i=0;i<3;i++) setTimeout(()=>burst(h.width/2, h.height/2, {n:18, spread:130, dur:900}), i*160);
  setTimeout(()=>{ box.className = ""; box.innerHTML = ""; }, 1700);
});

/* ---- gain d'integrite : valeur flottante sur la jauge ---- */
let integQueue = 0, integTimer = null;
Bus.on("integGain", n=>{
  integQueue += n;
  clearTimeout(integTimer);
  integTimer = setTimeout(()=>{
    const el = fxQ(".ibar");
    if(el && integQueue >= 0.005) numPopEl(el, "+" + integQueue.toFixed(2) + "%", "var(--cyan)");
    integQueue = 0;
  }, 160);
});

/* ---- barre d'integrite : impulsion a chaque reparation ---- */
Bus.on("integrity", ()=>{
  const b = fxQ(".ibar");
  if(!b) return;
  b.classList.add("gain");
  setTimeout(()=>b.classList.remove("gain"), 700);
});
