/* ============================================================
   L'EXPÉDITION EN 3D · LE CHOIX AU MILIEU DE L'ÉCRAN
   Les scènes des nœuds gardent la logique du jeu mobile (51) : sa
   fenêtre reste dans la page, cachée, et c'est elle qui sait quoi
   proposer. Sur PC, on la relit et on la remet en scène :
     · en haut, au centre : ce qui se passe (le titre, la phrase de
       Porygon-Z qui s'écrit, ce qu'on vient de gagner) ;
     · au milieu : les choix. Les candidats d'un recrutement, les
       offres d'un échange, les objets d'un coffre se tiennent en 3D
       sur des socles (scenes.js) ; leur carte (types, niveau, forces)
       est posée juste sous chacun. Les autres choix (qui laisse sa
       place, les articles de Kecleon, les reliques, les réponses à
       Porygon-Z, le repos) s'alignent en cartes au bas de l'écran ;
     · dessous, discret : passer, revenir, repartir.
   Un clic, ou 1 à 6, choisit ; Entrée valide. Chaque bouton porte
   la même action que celui du jeu mobile (data-act) : le jeu ne voit
   aucune différence.
   ============================================================ */
import * as THREE from "three";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]));
const V1 = new THREE.Vector3();
const LISTS = ".xs-pick, .xs-shelf, .xs-relics, .btn-grid";

/* les forces d'un Pokémon, en quatre barres */
function statBars(P){
  const row = (k, v) => `<span class="pcx-st"><em>${k}</em><i><b style="width:${Math.round(Math.min(1, v / 150) * 100)}%"></b></i></span>`;
  return `<span class="pcx-stats">${row("PV", P.hp)}${row("ATQ", Math.max(P.atk, P.spa))}${row("DÉF", Math.round((P.def + P.spd) / 2))}${row("VIT", P.spe)}</span>`;
}
function copyData(from, to){
  for(const k in from.dataset) to.dataset[k] = from.dataset[k];
  if(from.disabled) to.disabled = true;
}

export class XStage {
  constructor(){
    this.el = document.createElement("div"); this.el.id = "pc-xs"; document.body.appendChild(this.el);
    this.sig = ""; this.anch = []; this.hover = -1;
    this.el.addEventListener("mouseover", e=>{ const c = e.target.closest && e.target.closest(".pcx-card"); this.hover = c ? +c.dataset.slot : -1; });
    this.el.addEventListener("mouseleave", ()=>{ this.hover = -1; });
  }
  hide(){ if(this.on){ this.el.className = ""; this.el.innerHTML = ""; this.sig = ""; this.on = false; this.anch = []; this.hover = -1; } }
  /* les choix, dans l'ordre des touches 1 à 6 */
  choices(){ return [...this.el.querySelectorAll(".pcx-ch")]; }
  primary(){ return [...this.el.querySelectorAll(".pcx-pri")].find(b=>!b.disabled) || null; }
  /* ---------- à chaque image d'une scène ---------- */
  update(xs, run, scenes, cam){
    const panel = xs && xs.querySelector(".xs-panel"), stage = xs && xs.querySelector(".xs-stage");
    if(!panel){ this.hide(); return; }
    const kind = xs.dataset.kind, p = run.pend || {};
    const acts = [...panel.querySelectorAll("[data-act]"), ...(stage ? stage.querySelectorAll(".xs-cards [data-act]") : [])];
    const title = panel.querySelector(".xs-title");
    const sig = kind + "|" + (p.step || "") + "|" + acts.map(b=>b.dataset.act + ":" + (b.dataset.i || b.dataset.id || b.dataset.k || "") + (b.disabled ? "d" : "") + (b.classList.contains("poor") ? "p" : "")).join(",")
      + "|" + (title ? title.textContent : "") + "|" + run.bits + "|" + (panel.querySelector(".xs-gains, .xs-fx, .xs-candy") ? panel.querySelector(".xs-gains, .xs-fx, .xs-candy").textContent : "");
    if(sig !== this.sig){ this.sig = sig; this.build(xs, panel, stage, kind, p, run, scenes); }
    this.on = true;
    /* la phrase de Porygon-Z s'écrit dans la fenêtre cachée : on la recopie */
    const src = document.getElementById("xs-type"), dst = this.el.querySelector(".pcx-type");
    if(src && dst && dst.textContent !== src.textContent) dst.textContent = src.textContent;
    /* les cartes posées sous leur socle */
    if(this.anch.length && scenes && cam){
      const W = innerWidth, H = innerHeight, gap = 18;
      /* sous chaque socle ; si deux cartes se chevauchent, on les écarte depuis le milieu (jamais l'une sur l'autre) */
      const P = this.anch.map((c, i)=>{
        const at = scenes.slotBase(i); if(!at) return null;
        const q = V1.copy(at).project(cam);
        return {c, w:c.offsetWidth || 212, h:c.offsetHeight || 200, cx:(q.x * 0.5 + 0.5) * W, y:(-q.y * 0.5 + 0.5) * H + 14, back:q.z > 1};
      });
      const L = P.filter(Boolean);
      if(L.length){
        const span = L.reduce((a, q)=>a + q.w, 0) + gap * (L.length - 1);
        const mid = (L[0].cx + L[L.length - 1].cx) / 2;
        let want = L[L.length - 1].cx - L[0].cx + (L[0].w + L[L.length - 1].w) / 2;
        let x0 = want < span ? mid - span / 2 : L[0].cx - L[0].w / 2;
        x0 = Math.max(8, Math.min(W - span - 8, x0));
        L.forEach((q, k)=>{
          const x = want < span ? x0 + L.slice(0, k).reduce((a, r)=>a + r.w + gap, 0) : Math.max(8, Math.min(W - q.w - 8, q.cx - q.w / 2));
          const y = Math.max(96, Math.min(H - q.h - 70, q.y));
          q.c.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`; q.c.style.visibility = q.back ? "hidden" : "";
        });
      }
    }
    if(scenes) scenes.hover = this.hover;
  }
  build(xs, panel, stage, kind, p, run, scenes){
    const el = this.el, color = xs.style.getPropertyValue("--xc") || "#35f0d6";
    el.innerHTML = ""; this.anch = [];
    el.className = "on k-" + kind; el.style.setProperty("--xc", color.trim());
    /* ---- en haut : ce qui se passe ---- */
    const head = panel.cloneNode(true);
    head.querySelectorAll(LISTS + ", button, .btn").forEach(n=>n.remove());
    head.querySelectorAll("[id]").forEach(n=>{ if(n.id === "xs-type") n.classList.add("pcx-type"); n.removeAttribute("id"); });
    head.className = "pcx-head";
    /* (sur PC, on clique) */
    const tw = document.createTreeWalker(head, NodeFilter.SHOW_TEXT);
    for(let n = tw.nextNode(); n; n = tw.nextNode()) if(/\bTouchez\b/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\bTouchez\b/g, "Cliquez sur");
    /* la fin du parcours : sa phrase (« Le noyau est atteint ») devient le titre */
    if(kind === "end"){
      const eh = stage && stage.querySelector(".xs-endhead b");
      if(eh && !head.querySelector(".xs-title")){ const tt = document.createElement("div"); tt.className = "xs-title"; tt.textContent = eh.textContent; const kk = head.querySelector(".xs-kicker"); if(kk) kk.after(tt); else head.prepend(tt); }
    }
    el.appendChild(head);
    /* ---- les choix posés en 3D : candidats, offres, objets ---- */
    const cards = stage ? [...stage.querySelectorAll(".xs-cards .xs-card")] : [];
    const picking = !!panel.querySelector(".xs-pick");
    if(cards.length && !picking && scenes && scenes.slots && scenes.slots.length === cards.length){
      cards.forEach((src, i)=>{
        const b = document.createElement("button"); b.className = "pcx-card pcx-ch"; copyData(src, b); b.dataset.slot = i;
        b.innerHTML = this.cardHtml(kind, p, i, src) ; el.appendChild(b); this.anch.push(b);
      });
    } else if(cards.length && !picking){
      /* (pas de socles : les cartes en rang, au bas de l'écran) */
      const row = document.createElement("div"); row.className = "pcx-row"; el.appendChild(row);
      cards.forEach((src, i)=>{ const b = document.createElement("button"); b.className = "pcx-card pcx-ch"; copyData(src, b); b.dataset.slot = i; b.innerHTML = this.cardHtml(kind, p, i, src); row.appendChild(b); });
    }
    /* ---- les autres choix : en rang, au bas de l'écran ---- */
    const items = [...panel.querySelectorAll(".xs-pick .xs-pm, .xs-shelf .xs-ware, .xs-relics .xs-rc, .btn-grid .btn:not(.ghost)")];
    if(items.length){
      const row = document.createElement("div"); row.className = "pcx-row" + (items.length > 4 ? " many" : ""); el.appendChild(row);
      const n0 = this.anch.length;
      items.forEach((src, i)=>{
        const b = src.cloneNode(true); b.removeAttribute("id"); b.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
        b.classList.add("pcx-opt", "pcx-ch"); b.classList.remove("btn", "pri", "sm", "wide");
        b.dataset.slot = n0 + i;
        b.insertAdjacentHTML("afterbegin", `<span class="pcx-key">${n0 + i + 1}</span>`);
        row.appendChild(b);
      });
    }
    /* ---- dessous : passer, revenir, repartir ---- */
    const sec = [...panel.querySelectorAll("button, .btn")].filter(b=>!b.closest(".xs-pick, .xs-shelf, .xs-relics") && !(b.closest(".btn-grid") && !b.classList.contains("ghost")));
    if(sec.length){
      const row = document.createElement("div"); row.className = "pcx-foot"; el.appendChild(row);
      for(const src of sec){
        const b = document.createElement("button"); copyData(src, b);
        b.className = src.classList.contains("pri") ? "pcx-pri" : "pcx-sec";
        b.innerHTML = src.innerHTML;
        row.appendChild(b);
      }
    }
    const pw = ref("pmdWake"); if(pw) try { pw(); } catch(e){}
  }
  /* une carte de choix : un candidat (types, niveau, forces) ou un objet (rareté, effet) */
  cardHtml(kind, p, i, src){
    const POKE = G().POKE, key = `<span class="pcx-key">${i + 1}</span>`;
    if(kind === "items"){
      const E = ref("EXP_ITEMS") || {}, id = p.list && p.list[i], it = E[id];
      if(it){
        const icon = (ref("itemIcon") || (()=>""))("exp:" + id, 40);
        const rar = ["", "Commun", "Peu commun", "Rare", "Légendaire"][it.rar] || "";
        return `${key}<span class="pcx-ic">${icon}</span><span class="pcx-name">${esc(it.n)}</span><span class="pcx-rar r${it.rar}">${rar}</span><span class="pcx-d">${esc(it.d)}</span>`;
      }
    }
    const c = p.list && p.list[i], P = c && POKE[c.id];
    if(P){
      const tags = (ref("typeTags") || (()=>""))(P.types);
      const lv = kind === "swap" ? "+4 niveaux" : "N." + (c.lvl || c.lv || "");
      return `${key}<span class="pcx-name">${esc(P.name)}</span><span class="pcx-types">${tags}</span><span class="pcx-lv">${lv} · total ${P.bst}</span>${statBars(P)}`;
    }
    return key + src.innerHTML;
  }
}
