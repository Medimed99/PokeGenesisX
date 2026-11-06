/* ============================================================
   L'ENTRÉE DANS UN MODULE
   Chaque module en 3D s'ouvre de la même façon :
     · une courte cinématique : la caméra part d'un plan à elle (le
       dessous de l'arène, le haut de la vallée, le cadenas…) et
       vient se poser là où le joueur prend la main ; bandes noires,
       le nom du module, son but en une ligne ;
     · puis le « check » des commandes : une carte à gauche, chaque
       commande s'allume quand on s'en sert ; une fois tout essayé,
       elle s'en va.
   Le module fournit tout (les plans, le texte, la liste des
   commandes) ; ici, on ne fait que jouer. Pendant la cinématique, la
   partie attend (window.PCHOLD : la Tour et la Brèche du jeu mobile
   le lisent). Espace, Entrée, Échap ou un clic : on passe.
   ============================================================ */
import * as THREE from "three";

const KEY = "pcg.pc.intro";
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const calm = () => typeof window.calmFx === "function" && window.calmFx();
const GLYPHS = "0123456789ABCDEF#%&$<>/";

function load(){ try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){ return {}; } }
function store(o){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }

/* la souris, dessinée : le bouton qui sert est allumé */
const mouse = part => `<svg class="pk-ms" viewBox="0 0 16 22" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="19" rx="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M8 1.5v7.5M1.5 9h13" stroke="currentColor" stroke-width="1.2" fill="none"/>
  ${part === "left" ? `<path d="M7.3 2.3a5.8 5.8 0 0 0-5 5.7v.3h5z" fill="currentColor"/>` : ""}
  ${part === "right" ? `<path d="M8.7 2.3a5.8 5.8 0 0 1 5 5.7v.3h-5z" fill="currentColor"/>` : ""}
  ${part === "wheel" ? `<rect x="6.6" y="3.2" width="2.8" height="4.8" rx="1.4" fill="currentColor"/>` : ""}
  ${part === "move" ? `<path d="M8 13.2l-2 2.3h4zM8 19l-2-2.3h4z" fill="currentColor" opacity=".8"/>` : ""}</svg>`;
const MOUSE_WORDS = {"souris":"move", "clic":"left", "clic gauche":"left", "clic droit":"right", "molette":"wheel"};
const capHtml = k => MOUSE_WORDS[k] ? `<span class="pk-m">${mouse(MOUSE_WORDS[k])}<small>${esc(k === "souris" ? "souris" : k === "molette" ? "molette" : k === "clic droit" ? "droit" : "clic")}</small></span>` : `<kbd>${esc(k)}</kbd>`;

export class Intro {
  constructor(game){
    this.game = game; this.def = null; this.t = 0; this.check = null;
    this.mem = load();
    this.dummy = new THREE.PerspectiveCamera();
    this.pA = new THREE.Vector3(); this.lA = new THREE.Vector3(); this.qA = new THREE.Quaternion();
    this.pB = new THREE.Vector3(); this.qB = new THREE.Quaternion();
    /* les bandes noires, le titre, le but */
    const el = this.el = document.createElement("div"); el.id = "pc-intro";
    el.innerHTML = `<div class="pi-bar top"></div><div class="pi-bar bot"><i class="pi-prog"></i><span class="pi-skip"><kbd>Espace</kbd> passer</span></div>
      <div class="pi-card"><div class="pi-k"></div><div class="pi-t"></div><div class="pi-g"></div></div>`;
    document.body.appendChild(el);
    this.$ = s => el.querySelector(s);
    /* la carte des commandes */
    const ck = this.ck = document.createElement("div"); ck.id = "pc-check";
    document.body.appendChild(ck);
    /* ce que fait le joueur : chaque commande essayée s'allume (on écoute sans rien consommer) */
    addEventListener("keydown", e=>this.tick({key:e.code, ch:e.key && e.key.length === 1 ? e.key.toLowerCase() : ""}), true);
    addEventListener("mousedown", e=>this.tick({btn:e.button}), true);
    addEventListener("wheel", ()=>this.tick({wheel:true}), {capture:true, passive:true});
    addEventListener("mousemove", e=>{
      if(!this.check || !document.pointerLockElement) return;
      this.moved = (this.moved || 0) + Math.abs(e.movementX) + Math.abs(e.movementY);
      if(this.moved > 260) this.tick({move:true});
    }, true);
  }
  get active(){ return !!this.def; }
  get holding(){ return !!(this.def && this.def.hold); }
  /* ---------- jouer une entrée ---------- */
  play(def){
    if(this.def) this.end(true);
    this.def = def; this.t0 = this.t; this.skipAt = -1; this.fromP = null;
    const shots = def.shots;
    this.curP = new THREE.CatmullRomCurve3(shots.map(s=>s.p), false, "centripetal");
    this.curL = new THREE.CatmullRomCurve3(shots.map(s=>s.l), false, "centripetal");
    this.el.style.setProperty("--ia", def.color || "#35f0d6");
    this.$(".pi-k").textContent = def.kicker || "";
    this.$(".pi-t").textContent = "";
    this.$(".pi-g").textContent = def.goal || "";
    this.$(".pi-g").style.display = def.goal ? "" : "none";
    this.$(".pi-card").classList.remove("on");
    this.el.classList.add("on");
    this.el.classList.toggle("short", !def.goal);
    document.body.classList.add("pcintro");
    this.titleT = -1; this.shown = false;
    if(def.hold) window.PCHOLD = true;
    /* la carte des commandes d'avant disparaît : on y revient après la cinématique */
    if(this.check && this.check.def !== def) this.closeCheck(true);
  }
  skip(){
    if(!this.def || this.skipAt >= 0) return;
    const cam = this.def.camera;
    this.skipAt = this.t; this.fromP = cam.position.clone(); this.fromQ = cam.quaternion.clone();
    this.$(".pi-card").classList.remove("on");
  }
  /* une touche pendant la cinématique : Espace, Entrée, Échap, E, Tab la passent ; le reste est ignoré */
  key(e){
    if(!this.def) return false;
    if(/^(Space|Enter|NumpadEnter|Escape|KeyE|Tab)$/.test(e.code)){ e.preventDefault(); this.skip(); return true; }
    return /^(Digit|Numpad)\d$/.test(e.code);           /* (pas de choix en plein vol) */
  }
  /* ---------- à chaque image, après que le module a posé sa caméra ---------- */
  update(dt, t){
    this.t = t;
    const D = this.def;
    if(D){
      if(D.alive && !D.alive()){ this.end(true); }
      else this.frame(D, dt);
    }
    this.checkFrame(dt);
  }
  frame(D, dt){
    const cam = D.camera, el = this.t - this.t0, dur = D.dur || 4;
    const k = clamp01(el / dur), e = ease(k);
    /* le plan de la cinématique */
    this.curP.getPoint(e, this.pA); this.curL.getPoint(e, this.lA);
    this.dummy.position.copy(this.pA); this.dummy.lookAt(this.lA); this.qA.copy(this.dummy.quaternion);
    /* ce que le module veut (sa caméra à lui, déjà posée pour cette image) */
    this.pB.copy(cam.position); this.qB.copy(cam.quaternion);
    if(this.skipAt >= 0){
      const w = smooth(0, 1, (this.t - this.skipAt) / 0.45);
      cam.position.lerpVectors(this.fromP, this.pB, w); cam.quaternion.slerpQuaternions(this.fromQ, this.qB, w);
      if(w >= 1) this.end(false);
    } else {
      const w = smooth(D.blend || 0.64, 1, k);
      cam.position.lerpVectors(this.pA, this.pB, w); cam.quaternion.slerpQuaternions(this.qA, this.qB, w);
      if(k >= 1) this.end(false);
    }
    cam.updateMatrixWorld();
    if(!this.def) return;
    if(D.beat) try { D.beat(k, dt, el); } catch(err){ console.warn(err); }
    /* le titre s'écrit, le but suit ; tout s'efface juste avant que la main revienne */
    const card = this.$(".pi-card");
    if(!this.shown && el > (D.titleAt === undefined ? 0.3 : D.titleAt) && this.skipAt < 0){ this.shown = true; card.classList.add("on"); this.titleT = 0; }
    if(this.shown && el > dur - 0.55) card.classList.remove("on");
    if(this.titleT >= 0) this.writeTitle(dt);
    this.$(".pi-prog").style.width = (k * 100).toFixed(1) + "%";
  }
  /* le titre se décode, lettre après lettre (d'un coup, en effets réduits) */
  writeTitle(dt){
    const full = this.def.title || "", tt = this.$(".pi-t");
    this.titleT += dt;
    if(calm()){ tt.textContent = full; this.titleT = -1; return; }
    const n = Math.floor(this.titleT / 0.035);
    if(n >= full.length + 4){ tt.textContent = full; this.titleT = -1; tt.classList.add("set"); return; }
    tt.classList.remove("set");
    let s = "";
    for(let i = 0; i < full.length; i++){
      if(i < n - 3 || full[i] === " ") s += full[i];
      else if(i < n) s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    tt.textContent = s;
  }
  end(aborted){
    const D = this.def; if(!D) return;
    this.def = null;
    this.el.classList.remove("on");
    this.$(".pi-card").classList.remove("on");
    document.body.classList.remove("pcintro");
    if(D.hold) window.PCHOLD = false;
    if(!aborted){
      if(D.onEnd) try { D.onEnd(); } catch(e){ console.warn(e); }
      if(D.controls && this.wantCheck(D)) this.openCheck(D);
    }
  }
  /* ---------- le check des commandes ---------- */
  /* on le montre tant qu'on n'a pas tout essayé une fois, et au plus quatre fois */
  wantCheck(D){
    const m = this.mem[D.id] || {};
    if((m.ver || 0) !== (D.ver || 1)) return true;
    return !m.done && (m.n || 0) < 4;
  }
  openCheck(D){
    const m = this.mem[D.id] = this.mem[D.id] && (this.mem[D.id].ver || 0) === (D.ver || 1) ? this.mem[D.id] : {ver:D.ver || 1, n:0};
    m.n = (m.n || 0) + 1; store(this.mem);
    this.check = {def:D, got:D.controls.map(()=>false), t:0, doneT:-1};
    this.moved = 0;
    const ck = this.ck;
    ck.style.setProperty("--ia", D.color || "#35f0d6");
    ck.innerHTML = `<div class="pk-h"><b>${esc(D.checkTitle || "Les commandes")}</b><span class="pk-n">0 / ${D.controls.length}</span></div>
      <ul>${D.controls.map((c, i)=>`<li data-i="${i}"><span class="pk-k">${c.k.map(capHtml).join("")}</span><span class="pk-t">${esc(c.t)}</span><i class="pk-ok"></i></li>`).join("")}</ul>
      <div class="pk-f">Essaie-les : chacune s'allume une fois faite.</div>`;
    ck.className = "";
  }
  /* un geste du joueur : la commande qui lui correspond s'allume */
  tick(ev){
    const C = this.check; if(!C || this.def || C.doneT >= 0) return;
    if(C.def.visible && !C.def.visible()) return;
    C.def.controls.forEach((c, i)=>{
      if(C.got[i]) return;
      const o = c.on || {};
      const hit = (ev.key && o.keys && o.keys.includes(ev.key)) || (ev.ch && o.chars && o.chars.includes(ev.ch))
        || (ev.btn !== undefined && o.btn === ev.btn) || (ev.wheel && o.wheel) || (ev.move && o.move);
      if(!hit) return;
      C.got[i] = true;
      const li = this.ck.querySelector(`li[data-i="${i}"]`);
      if(li){ li.classList.add("ok", "pop"); setTimeout(()=>li.classList.remove("pop"), 400); }
      const n = C.got.filter(Boolean).length;
      const nn = this.ck.querySelector(".pk-n"); if(nn) nn.textContent = n + " / " + C.got.length;
      if(n === C.got.length){
        C.doneT = 0;
        const h = this.ck.querySelector(".pk-h b"); if(h) h.textContent = "Tout est en main";
        this.ck.classList.add("done");
        const m = this.mem[C.def.id]; if(m){ m.done = true; store(this.mem); }
      }
    });
  }
  checkFrame(dt){
    const C = this.check; if(!C) return;
    const D = C.def;
    if(D.alive && !D.alive()){ this.closeCheck(true); return; }
    const vis = !this.def && (!D.visible || D.visible());
    this.ck.classList.toggle("on", vis);
    if(!vis) return;
    C.t += dt;
    if(C.doneT >= 0){ C.doneT += dt; if(C.doneT > 1.6) this.closeCheck(false); return; }
    /* on ne la laisse pas indéfiniment : passé quarante-cinq secondes, elle s'en va */
    if(C.t > 45) this.closeCheck(false);
  }
  closeCheck(){
    this.check = null;
    this.ck.classList.remove("on");
  }
  /* la carte des commandes est-elle (ou va-t-elle être) à l'écran pour ce module ? */
  checking(id){ return !!(this.check && this.check.def.id === id) || !!(this.def && this.def.id === id && this.def.controls && this.wantCheck(this.def)); }
  /* une seule fois par session (le reste du temps, une version courte) */
  first(id){ const s = this.seenS || (this.seenS = new Set()); if(s.has(id)) return false; s.add(id); return true; }
}
