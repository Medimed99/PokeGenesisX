/* ============================================================
   39c — LE FIL CONDUCTEUR
   Deux réponses à la question « et maintenant ? » :

   · PROCHAINE ÉTAPE — un bandeau, au-dessus du dock, qui propose
     toujours LA meilleure chose à faire, et y emmène d'un toucher.
   · LE COFFRE DE SESSION — trois petits objectifs de quelques
     minutes. Les trois remplis, un coffre s'ouvre ; puis trois
     autres, pour un coffre plus beau. Cinq coffres par jour, de
     plus en plus riches : c'est la raison de faire « encore un ».
   ============================================================ */

/* ---------- les objectifs de session ----------
   v : la valeur suivie (on compare à celle du début de la série) ;
   abs : on regarde la valeur elle-même, pas la différence. */
const SESSION_OBJ = [
  {k:"capt",  i:"capture", go:"capture", g:[6, 10, 14, 18, 24],  n:t=>`Capturer ${t} Pokémon`, v:()=>S.stats.catches || 0},
  {k:"newsp", i:"dex",     go:"capture", g:[1, 1, 2, 2, 3],      n:t=>t > 1 ? `Découvrir ${t} nouvelles espèces` : "Découvrir une nouvelle espèce", v:()=>dexTotal()},
  {k:"exc",   i:"star",    go:"capture", g:[1, 2, 2, 3, 4],      n:t=>t > 1 ? `Réussir ${t} lancers Excellent` : "Réussir un lancer Excellent", v:()=>S.stats.excellent || 0,
   req:()=>typeof skillEnabled === "function" && skillEnabled()},
  {k:"streak",i:"bolt",    go:"capture", g:[5, 8, 10, 14, 18],   n:t=>`Atteindre une série de ${t} captures`, v:()=>S.streak || 0, abs:1},
  {k:"fish",  i:"capture", go:"capture", g:[2, 3, 4, 5, 6],      n:t=>`Pêcher ${t} Pokémon`, v:()=>S.stats.fish || 0, req:()=>S.level >= 4, set:()=>{ S.capMode = "fish"; }},
  {k:"walls", i:"bolt",    go:"idle",    g:[1, 1, 2, 2, 3],      n:t=>t > 1 ? `Faire ${t} fouilles au Forage` : "Faire une fouille au Forage", v:()=>S.stats.walls || 0,
   req:t=>moduleUnlocked("idle") && forage().walls >= t},
  {k:"tower", i:"user",    go:"tower",   g:[1, 2, 2, 3, 3],      n:t=>t > 1 ? `Gagner ${t} combats de la Tour` : "Gagner un combat de la Tour", v:()=>(typeof sqState === "function" && sqState().clears) || 0,
   req:()=>moduleUnlocked("tower")},
  {k:"exp",   i:"map",     go:"expedition", g:[1, 1, 1, 1, 1],   n:()=>"Terminer une Expédition", v:()=>S.stats.expRuns || 0,
   req:()=>moduleUnlocked("expedition"), heavy:1},
  {k:"breche",i:"boss",    go:"breche",  g:[1, 1, 1, 2, 2],      n:t=>t > 1 ? `Jouer ${t} parties de la Brèche` : "Jouer une partie de la Brèche", v:()=>(typeof brState === "function" && brState().runs) || 0,
   req:()=>moduleUnlocked("breche"), heavy:1},
  {k:"poker", i:"cards",   go:"poker",   g:[2, 3, 3, 4, 5],      n:t=>`Franchir ${t} verrous au Poké-Poker`, v:()=>S.stats.pokerBlinds || 0,
   req:()=>moduleUnlocked("poker"), heavy:1},
  {k:"hatch", i:"box",     go:"eggs",    g:[1, 1, 1, 1, 1],      n:()=>"Faire éclore un œuf", v:()=>S.stats.hatched || 0,
   req:()=>moduleUnlocked("eggs") && eggState().inc.some(x=>x && EGG_TIERS[x.tier] && (x.steps || 0) >= EGG_TIERS[x.tier].steps * 0.6)}
];
const SESSION_CHESTS = 5;
const SESSION_NAMES = ["Coffre de bronze", "Coffre d'argent", "Coffre d'or", "Coffre de cristal", "Coffre onirique"];
const SESSION_COLORS = ["#c8733a", "#d3dce7", "#ffd24a", "#7fe6ff", "#b06bff"];

function sessState(){
  S.sess = S.sess || {};
  const s = S.sess;
  if(s.day !== today()){ s.day = today(); s.tier = 0; s.obj = null; s.ready = false; }
  if(!s.obj && !s.ready && s.tier < SESSION_CHESTS) sessRoll();
  return s;
}
/* trois objectifs différents ; au plus un « long » (une partie entière d'un mode) */
function sessRoll(){
  const s = S.sess, t = Math.min(s.tier || 0, 4);
  const pool = SESSION_OBJ.filter(o=>!o.req || o.req(o.g[t]));
  const out = [];
  const cap = shuffle(pool.filter(o=>o.go === "capture"));
  const other = shuffle(pool.filter(o=>o.go !== "capture"));
  /* une part de capture, toujours : c'est le geste de base */
  if(cap.length) out.push(cap.shift());
  let heavy = 0;
  for(const o of other.concat(cap)){
    if(out.length >= 3) break;
    if(o.heavy && heavy) continue;
    if(o.heavy) heavy++;
    out.push(o);
  }
  s.obj = out.map(o=>({k:o.k, goal:o.g[t], base:o.abs ? 0 : o.v()}));
  s.ready = false;
}
function sessDef(k){ return SESSION_OBJ.find(o=>o.k === k); }
function sessProg(o){
  const d = sessDef(o.k); if(!d) return 0;
  return Math.max(0, Math.min(o.goal, d.v() - o.base));
}
function sessDone(o){ return sessProg(o) >= o.goal; }
/* surveillée régulièrement : un objectif rempli est salué, les trois ouvrent le coffre */
function sessTick(){
  if(!S || !S.flags || !introSeen()) return;
  const s = sessState();
  if(!s.obj || s.ready) return;
  s.seen = s.seen || {};
  for(const o of s.obj){
    const key = s.tier + ":" + o.k;
    if(sessDone(o) && !s.seen[key]){
      s.seen[key] = true;
      if(typeof banner === "function") banner({kicker:"OBJECTIF DE SESSION", title:sessDef(o.k).n(o.goal), sub:`${s.obj.filter(sessDone).length} / 3 · ${SESSION_NAMES[s.tier]}`, icon:"check", c:SESSION_COLORS[s.tier], sfx:"coin", dur:2400});
    }
  }
  if(s.obj.every(sessDone)){
    s.ready = true;
    saveSoon();
    if(typeof banner === "function") banner({kicker:"COFFRE DE SESSION", title:SESSION_NAMES[s.tier] + " prêt !", sub:"Touche le bandeau du bas pour l'ouvrir.", item:"chest:big", c:SESSION_COLORS[s.tier], dur:3600});
    renderNextStep();
  }
}
if(typeof setInterval === "function") setInterval(()=>{ try { sessTick(); } catch(e){} }, 1500);

/* ce que contient un coffre : de plus en plus, au fil de la journée */
function sessReward(t){
  const L = S.level || 1;
  const rw = {coins:Math.round(300 * (t + 1) * (1 + L * 0.06)), shards:6 + t * 5};
  rw.balls = {super:2 + t, hyper:t >= 2 ? t - 1 : 0};
  if(t >= 3) rw.cores = 1;
  if(t >= 4) rw.cores = 2;
  if(typeof teamCandyGain === "function") rw.candy = 2 + t * 2;
  return rw;
}
ACTIONS.sessopen = () => {
  const s = sessState();
  if(!s.ready) { ACTIONS.sessinfo(); return; }
  const t = s.tier, rw = sessReward(t);
  gain("coins", rw.coins); gain("shards", rw.shards);
  if(rw.cores) gain("cores", rw.cores);
  for(const b in rw.balls) if(rw.balls[b]) S.balls[b] = (S.balls[b] || 0) + rw.balls[b];
  if(rw.candy) teamCandyGain(rw.candy);
  s.tier = t + 1; s.ready = false; s.obj = null;
  S.stats.sessChests = (S.stats.sessChests || 0) + 1;
  if(s.tier < SESSION_CHESTS) sessRoll();
  save();
  const parts = [`+${fmt(rw.coins)} PokéCoins`, `+${rw.shards} Fragments`, `+${rw.balls.super} Super Ball`];
  if(rw.balls.hyper) parts.push(`+${rw.balls.hyper} Hyper Ball`);
  if(rw.cores) parts.push(`+${rw.cores} Noyau${rw.cores > 1 ? "x" : ""}`);
  if(rw.candy) parts.push(`+${rw.candy} Bonbons d'équipe`);
  if(typeof moment === "function") moment({kind:"release", c:SESSION_COLORS[t], item:"chest:big",
    kicker:"COFFRE DE SESSION · " + (t + 1) + " / " + SESSION_CHESTS, title:SESSION_NAMES[t], sub:parts.join(" · "),
    line:s.tier < SESSION_CHESTS ? `Trois nouveaux objectifs. Le prochain coffre est un ${SESSION_NAMES[s.tier].toLowerCase()}, {nom}. Je dis ça, je ne dis rien.`
                                 : "Cinq coffres aujourd'hui. Je n'en ai plus. Reviens demain, j'en aurai fabriqué d'autres.",
    then:()=>{ try { refresh(); } catch(e){} }}, true);
  try { Sfx.win(); } catch(e){}
  renderNextStep();
};
ACTIONS.sessinfo = () => {
  const s = sessState();
  const rows = (s.obj || []).map(o=>{ const d = sessDef(o.k), p = sessProg(o), ok = p >= o.goal;
    return `<div class="ss-row ${ok ? "ok" : ""}" data-act="sessgo" data-k="${o.k}">
      <span class="ss-ic">${ic(ok ? "check" : d.i)}</span>
      <div class="grow"><b>${esc(d.n(o.goal))}</b><div class="bar thin"><i style="width:${(p / o.goal * 100).toFixed(0)}%"></i></div></div>
      <span class="mono-num tiny">${p}/${o.goal}</span></div>`; }).join("");
  sheet(`${sheetHead("Coffres de session")}
    <div class="ss-chests">${SESSION_NAMES.map((n, i)=>`<span class="ss-chest ${i < s.tier ? "done" : i === s.tier ? "cur" : ""}" style="--cc:${SESSION_COLORS[i]}" title="${esc(n)}">${itemIcon("chest:big", 30) || ic("box")}</span>`).join("")}</div>
    ${s.tier >= SESSION_CHESTS ? `<div class="empty">Les cinq coffres du jour sont ouverts. Il y en aura cinq autres demain.</div>`
      : `<div class="tiny muted" style="margin:6px 0 8px">Trois objectifs de quelques minutes. Les trois remplis, le <b style="color:${SESSION_COLORS[s.tier]}">${esc(SESSION_NAMES[s.tier].toLowerCase())}</b> s'ouvre — et le suivant est plus riche.</div>
         ${rows}
         ${s.ready ? `<button class="btn pri wide" style="margin-top:10px" data-act="sessopen">Ouvrir le coffre</button>` : `<div class="tiny dim" style="margin-top:8px">Contenu : ${esc(sessRewardText(s.tier))}</div>`}`}`);
};
function sessRewardText(t){
  const rw = sessReward(t);
  return [`${fmt(rw.coins)} PokéCoins`, `${rw.shards} Fragments`, `${rw.balls.super} Super Ball`].concat(rw.balls.hyper ? [`${rw.balls.hyper} Hyper Ball`] : [], rw.cores ? [`${rw.cores} Noyau${rw.cores > 1 ? "x" : ""}`] : [], rw.candy ? [`${rw.candy} Bonbons d'équipe`] : []).join(" · ");
}
ACTIONS.sessgo = d => { const o = sessDef(d.k); if(!o) return; closeSheet(); if(o.set) o.set(); go(o.go); };

/* ============================================================
   PROCHAINE ÉTAPE
   Une liste de priorités : ce qui se perd si on attend d'abord,
   puis ce qui fait avancer, puis ce qui est simplement agréable.
   ============================================================ */
const NEXTSTEP_HOOKS = [];   /* d'autres modules y ajoutent leurs propositions : f() -> {p, t, go, ic} */
function nextStep(){
  const c = [];
  const add = (p, t, go, i, arg) => c.push({p, t, go, i, arg});
  const s = sessState();
  if(s.ready) add(100, `Ouvrir ton ${SESSION_NAMES[s.tier].toLowerCase()}`, "@sess", "box");
  if(moduleUnlocked("eggs")){
    const e = eggState(), ready = (e.inc || []).filter(x=>x && EGG_TIERS[x.tier] && (x.steps || 0) >= EGG_TIERS[x.tier].steps).length;
    if(ready) add(90, ready > 1 ? `${ready} œufs prêts à éclore` : "Un œuf est prêt à éclore", "eggs", "box");
  }
  if(moduleUnlocked("idle")){
    const f = forage();
    if(f.walls >= wallCap()) add(85, "Le Forage est plein : fais une fouille", "idle", "bolt");
    else if(f.walls) add(40, `${f.walls} fouille${f.walls > 1 ? "s" : ""} t'attend${f.walls > 1 ? "ent" : ""} au Forage`, "idle", "bolt");
    if(typeof botReady === "function" && botReady()) add(80, "Captures automatiques terminées", "idle", "capture");
  }
  if(typeof canOpenBox === "function" && moduleUnlocked("pokebox") && canOpenBox()) add(75, "Ton cadeau PokéBox t'attend", "pokebox", "box");
  if(typeof questsReady === "function" && (S.quests || []).some(q=>q.prog >= q.goal && !q.claimed)) add(70, "Une quête du jour est à réclamer", "daily", "quest");
  if(S.expedition) add(65, "Reprendre ton Expédition en cours", "expedition", "map");
  for(const h of NEXTSTEP_HOOKS){ try { const r = h(); if(r) [].concat(r).forEach(x=>c.push(x)); } catch(e){} }
  const d = typeof currentDirective === "function" ? currentDirective() : null;
  if(d){ const [cur, goal] = d.goal(); add(55, `${d.n} — ${fmt(Math.min(cur, goal))}/${fmt(goal)}`, d.go || "capture", "flag"); }
  if(s.obj && !s.ready){
    const o = s.obj.find(x=>!sessDone(x));
    if(o){ const def = sessDef(o.k); add(45, `${def.n(o.goal)} (${sessProg(o)}/${o.goal})`, "@obj:" + o.k, def.i); }
  }
  for(const k of ["expedition", "tower", "poker"])
    if(moduleUnlocked(k) && typeof firstWinAvailable === "function" && firstWinAvailable(k))
      add(30, `Première victoire du jour : ${{expedition:"Expédition", tower:"Tour", poker:"Poké-Poker"}[k]} ×2`, k, "star");
  add(1, "Partir capturer", "capture", "capture");
  c.sort((a, b)=>b.p - a.p);
  return c[0];
}
ACTIONS.nextstep = () => {
  const n = nextStep(); if(!n) return;
  if(n.go === "@sess") return ACTIONS.sessopen();
  if(n.go.startsWith("@obj:")) return ACTIONS.sessgo({k:n.go.slice(5)});
  go(n.go, n.arg);
};
/* le bandeau : seulement là où l'on choisit quoi faire, jamais en pleine partie */
const NEXTSTEP_SCREENS = ["capture", "modules", "dex", "bag", "profile", "today", "world", "team", "cards", "research", "shop", "daily", "pokebox"];
function renderNextStep(){
  if(typeof document === "undefined" || !document.getElementById) return;
  const dock = document.getElementById("dock");
  if(!dock || !dock.parentElement) return;
  let el = document.getElementById("nextstep");
  if(!el){ el = document.createElement("div"); el.id = "nextstep"; dock.parentElement.insertBefore(el, dock); }
  const show = S && S.flags && introSeen() && NEXTSTEP_SCREENS.includes(currentScreen) && !(S.expedition && currentScreen === "expedition");
  /* les bulles de Porygon-Z se posent au-dessus du bandeau quand il est là */
  try { const app = document.getElementById("app"); if(app && app.classList) app.classList.toggle("ns-on", !!show); } catch(e){}
  if(!show){ el.className = "off"; el.innerHTML = ""; return; }
  const n = nextStep(), s = sessState();
  const done = s.obj ? s.obj.filter(sessDone).length : 0;
  el.className = "on" + (n.p >= 70 ? " hot" : "");
  el.innerHTML = `<button class="ns-sess ${s.ready ? "ready" : ""}" data-act="${s.ready ? "sessopen" : "sessinfo"}" style="--cc:${SESSION_COLORS[Math.min(s.tier, 4)]}" aria-label="Coffre de session">
      ${itemIcon("chest:big", 22) || ic("box")}<b>${s.tier >= SESSION_CHESTS ? "5/5" : s.ready ? "!" : done + "/3"}</b></button>
    <button class="ns-go" data-act="nextstep"><small>PROCHAINE ÉTAPE</small><span>${ic(n.i || "arrow")} ${esc(n.t)}</span>${ic("arrow")}</button>`;
}
if(typeof renderDock === "function"){
  const _rd = renderDock;
  renderDock = function(){ const r = _rd.apply(this, arguments); try { renderNextStep(); } catch(e){} return r; };
}
/* le bandeau suit l'état du jeu même sans changer d'écran */
if(typeof setInterval === "function") setInterval(()=>{ try { if(document.getElementById("nextstep")) renderNextStep(); } catch(e){} }, 4000);

/* ============================================================
   LES RESSOURCES CIRCULENT
   Quand il manque quelque chose, le jeu dit où le trouver : chaque
   activité produit ce dont une autre a besoin.
   ============================================================ */
const SRC_HINTS = {
  coins:  "Captures et cagnotte de chaîne, Expédition, coffres de session",
  shards: "Tour, Brèche, captures rares, fouilles du Forage",
  cores:  "Coffres de session (cristal, onirique), un niveau d'Archiviste sur cinq, chantiers terminés",
  candy:  "Coffres de session, fouilles, victoires de la Tour, hordes, passages légendaires",
  ore:    "Forage : l'équipe en remonte en creusant, et les fouilles en cachent",
  ore_cu: "Forage : Surface et Couche molle (ou pépites des fouilles)",
  ore_fe: "Forage : Sédiment et Veine froide (ou les Ruines Oubliées)",
  ore_ag: "Forage : Socle et Nappe chaude (ou la Grotte Azurée)",
  ore_au: "Forage : Faille mineure et Substrat (ou le Cratère Ardent)",
  ore_dr: "Forage : Noyau onirique (ou le Pic Météore)",
  stone:  "Fouilles du Forage, boutique",
  stone_fire:   "Fouilles du Forage — surtout la Nappe chaude et le Cratère Ardent",
  stone_water:  "Fouilles du Forage — surtout la Veine froide et la Grotte Azurée",
  stone_thunder:"Fouilles du Forage — surtout la Faille mineure",
  stone_leaf:   "Fouilles du Forage — surtout la Couche molle",
  stone_moon:   "Fouilles du Forage — surtout le Substrat et le Pic Météore",
  stone_sun:    "Fouilles du Forage — surtout le Noyau onirique et le Pic Météore"
};
function srcHint(kind, key){ return SRC_HINTS[kind + "_" + key] || SRC_HINTS[kind] || ""; }
