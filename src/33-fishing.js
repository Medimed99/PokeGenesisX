/* ============================================================
   33 — PÊCHE ET EXCLUSIVITÉS
   La sonde etait un module a part, avec son propre mini-jeu et
   ses couts en Fragments : personne n'y revenait. La peche devient
   un MODE de l'ecran de capture — on bascule d'un geste — et elle
   gagne ce qui manquait : des especes qu'on ne trouve nulle part
   ailleurs.

   Le principe est etendu a tout le jeu. Chaque activite a ses
   exclusivites, comme dans les vrais jeux : les bebes sortent des
   oeufs, les fossiles se deterrent, Barpau se peche.
   ============================================================ */

const EXCLUSIVES = {
  /* especes qu'on ne capture qu'a la canne */
  fish:   [349, 223, 211, 369, 170, 382],
  /* les bebes des generations II et III : uniquement a l'eclosion */
  egg:    [172, 173, 174, 175, 236, 238, 239, 240, 298, 360],
  /* les fossiles, et leurs evolutions, qui n'existent pas a l'etat sauvage */
  forage: [138, 139, 140, 141, 142, 345, 346, 347, 348]
};
const EXCL_SOURCE = {};
for(const k in EXCLUSIVES) for(const id of EXCLUSIVES[k]) EXCL_SOURCE[id] = k;
/* Milobellus n'existe qu'en faisant evoluer Barpau */
EXCL_SOURCE[350] = "fish";
function isExclusive(id){ return !!EXCL_SOURCE[id]; }
function exclusiveLabel(id){
  return {fish:"Pêche uniquement", egg:"Éclosion uniquement", forage:"Forage uniquement"}[EXCL_SOURCE[id]] || "";
}

/* ============================================================
   LES CANNES
   La premiere ne s'achete pas : elle se deterre au Forage, comme
   l'oeuf ouvre la couveuse. Les suivantes allongent la touche,
   remontent plus de raretes et de chromatiques.
   (Avant, une touche ferree a temps pouvait encore lacher sur un
   tirage : 45 % de prises perdues a la Vieille Canne. Les testeurs
   croyaient que « Ferrer » ne marchait pas. Ferree a temps, une
   prise tient toujours.)
   ============================================================ */
const RODS = [
  {k:"old",   n:"Vieille Canne", window:850,  perfect:330, shiny:1.0, rare:0,   cost:0,
   d:"Déterrée au Forage. Elle tient, c'est tout ce qu'on lui demande."},
  {k:"super", n:"Super Canne",   window:1000, perfect:390, shiny:1.6, rare:0.6, cost:140,
   d:"Plus sensible : la touche dure plus longtemps, et elle remonte davantage de raretés."},
  {k:"mega",  n:"Méga Canne",    window:1150, perfect:450, shiny:2.5, rare:1.3, cost:480,
   d:"Elle atteint les nappes où dort ce qui ne remonte jamais à la surface."}
];
function rodLevel(){ return S.rod || 0; }        /* 0 = aucune canne */
function rodDef(){ return rodLevel() ? RODS[rodLevel() - 1] : null; }

/* La Vieille Canne se déterre dans l'une des trois premières fouilles du Forage (tirée au
   sort une fois pour toutes). Si la fouille s'effondre avant qu'elle soit dégagée, elle
   revient dans la suivante, jusqu'à ce qu'elle sorte. Avant, elle tombait d'une capture,
   une fois sur 90 : on recevait des quêtes de pêche bien avant de pouvoir pêcher. */
function rodWallDue(){
  if(!S || rodLevel()) return false;
  S.flags = S.flags || {};
  if(S.flags.rodAt === undefined){ S.flags.rodAt = Math.floor(rng() * 3); saveSoon(); }
  return (S.stats.walls || 0) >= S.flags.rodAt;
}
function rodWhere(){
  return moduleUnlocked("idle") ? "Le Forage en cache une dans l'une de tes premières fouilles."
    : "Le Forage (niveau 5) en cache une dans l'une de ses premières fouilles.";
}
function showRodDiscovery(){
  if(S.flags) S.flags.rodReveal = false;
  const box = document.getElementById("discover");
  if(!box){ toast("Vieille Canne déterrée : la pêche s'ouvre", "warn", "fish"); return false; }
  /* les petits bandeaux de la fouille (« Vieille Canne ! ») ne passent pas par-dessus */
  try { document.querySelectorAll("#toasts .toast").forEach(t=>t.remove()); } catch(e){}
  box.className = "on";
  box.style.setProperty("--ac", "#4fb2ff");
  box.innerHTML = `
    <div class="dc-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker done">DÉTERRÉE AU FORAGE</div>
      <div class="rodfind">${itemIcon("rod:old", 64) || ic("fish")}</div>
      <div class="dc-name in" style="font-size:12px">Vieille Canne</div>
      <div class="dc-lore in">Prise dans la roche, la ligne encore enroulée. Quelqu'un pêchait ici,
        avant que les données se figent.</div>
      <div class="panel tight" style="text-align:left;margin:0 0 10px">
        <div class="h sm">LA PÊCHE S'OUVRE</div>
        <div class="tiny muted">Capture, onglet Pêche, ou le lac sur la carte. Certains Pokémon
          ne se trouvent qu'au bout d'une ligne.</div>
      </div>
      <button class="btn pri wide dc-ok in" data-act="rodok">Pêcher tout de suite</button>
      <button class="btn ghost wide sm dc-ok in" data-act="rodlater" style="margin-top:6px">Plus tard</button>
    </div>`;
  Sfx.win(); buzz([20,40,70]);
  return true;
}
function rodBoxClose(){
  const box = document.getElementById("discover");
  if(box){ box.className = ""; box.innerHTML = ""; }
}
ACTIONS.rodok = () => {
  rodBoxClose();
  if(typeof DIG !== "undefined" && DIG && DIG.ended) DIG = null;
  fishGo();
};
ACTIONS.rodlater = () => rodBoxClose();

/* ============================================================
   LE MODE PÊCHE
   ============================================================ */
/* changer de mode, sans redessiner : le lac, une directive, un objectif de session y passent.
   Changer de mode efface la rencontre en cours ; rester dans le même mode ne la change pas
   (avant, toucher « Capture » quand on y était déjà retirait une nouvelle rencontre). */
function capModeSet(m){
  if(m === "fish" && !rodLevel()) return false;
  const stale = m === "fish" && ENC && !ENC.fished && !busy;
  if(S.capMode !== m || stale){ S.capMode = m; if(!busy) ENC = null; }
  fishReset();
  saveSoon();
  return true;
}
function setCapMode(m){
  if(!capModeSet(m)){ if(m === "fish") toast("Il te faut une canne. " + rodWhere(), "", "fish"); return; }
  refresh();
  if(m === "fish") tutoMaybe("fishing");
}
ACTIONS.capmode = d => setCapMode(d.m);
/* aller pêcher depuis ailleurs (le lac, une directive, la fin d'une fouille) */
function fishGo(toForage){
  if(!rodLevel()){
    toast("Il te faut une canne. " + rodWhere(), "", "fish");
    if(toForage && moduleUnlocked("idle")) go("idle");
    return false;
  }
  capModeSet("fish");
  go("capture");
  tutoMaybe("fishing");
  return true;
}

/* ============================================================
   L'ÉTANG
   Avant : un bouton, une attente, « FERRER ! », et l'écran entier
   redessiné à chaque étape — le toucher tombait parfois sur un
   bouton qui venait d'être remplacé, et ne comptait pas.

   On voit l'eau. Des ombres y nagent : leur taille dit la rareté,
   un reflet doré trahit un chromatique, une ombre immobile qui brille
   au fond est un trésor. On lance où l'on veut ; l'ombre la plus
   proche vient, goûte le bouchon une fois ou deux — ne pas ferrer —
   puis le « ! » : un toucher n'importe où, et ça tient. Très vite,
   c'est un ferrage parfait : la prise est sonnée, +20 % à la capture.

   Tout se joue dans une toile, au rythme de l'horloge : rien n'est
   redessiné pendant la pêche, et le toucher compte dès que le doigt
   se pose (pointerdown), sur l'eau comme sur le bouton.
   ============================================================ */
const FISH_N = 3;                       /* ombres dans l'eau */
const FISH_GRACE = 300;                 /* un toucher juste après le lancer ne compte pas */
let FISHING = {st:"idle"};
let POND = null;
let FV = null, FV_ON = false;          /* la toile de l'étang, quand elle est à l'écran */
function fsNow(){ return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now(); }
function fishRain(){ try { const w = weatherDef(); return !!(w.boost && w.boost.includes(11)); } catch(e){ return false; } }
function fishReset(){
  const raf = FISHING && FISHING.raf;
  FISHING = {st:"idle", raf, seen:FISHING && FISHING.seen, lock:0};
  if(POND) for(const s of POND.shadows) if(s.mode !== "swim" && s.mode !== "still" && s.mode !== "leave") s.mode = s.kind === "treasure" ? "still" : "swim";
}

/* ---------- ce qui mord : tiré quand l'ombre apparaît ---------- */
function fishPool(rar){
  const out = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || p.rar !== rar || p.leg) continue;
      if(!p.types.includes(11) && EXCL_SOURCE[i] !== "fish") continue;
      if(EXCL_SOURCE[i] && EXCL_SOURCE[i] !== "fish") continue;
      if(i === 350) continue;                       /* Milobellus : par evolution */
      out.push(i);
    }
  return out;
}
function rollFishSpec(){
  const rod = rodDef() || RODS[0];
  /* Kyogre : uniquement a la canne, une fois Hoenn ouvert, et jamais a la
     Vieille Canne — il faut aller le chercher assez profond */
  if(regionUnlocked("hoenn") && rodLevel() >= 2 && !S.dex[382]){
    const odds = rodLevel() >= 3 ? 0.012 : 0.004;
    if(rng() < odds) return {kind:"mon", id:382, level:70, rar:5, shiny:rng() < shinyOdds() * rod.shiny};
  }
  /* la canne pousse la rarete vers le haut */
  let rar = rollRarity();
  if(rar < 3 && rng() < rod.rare * 0.25) rar++;
  let pool = fishPool(rar);
  for(let r2 = rar; !pool.length && r2 >= 0; r2--) pool = fishPool(r2);
  /* les exclusivites de peche sont favorisees : c'est leur seul acces */
  const weighted = [];
  for(const id of pool){
    const w = EXCL_SOURCE[id] === "fish" ? 4 : 1;
    for(let k = 0; k < w; k++) weighted.push(id);
  }
  const id = weighted.length ? pick(weighted) : 129;   /* Magicarpe, toujours */
  return {kind:"mon", id, level:levelFor(POKE[id].rar), rar:POKE[id].rar, shiny:rng() < shinyOdds() * rod.shiny};
}
function newFishEncounter(spec){
  spec = spec || rollFishSpec();
  ENC = {id:spec.id, level:spec.level, rar:spec.rar, shiny:!!spec.shiny,
         attempts:0, featured:false, fleeing:false, fished:true};
  if(ENC.shiny) setTimeout(shinyEntrance, 110);
  saveSoon();
  return ENC;
}

/* ---------- les ombres ---------- */
const FISH_SIZE = [0.62, 0.74, 0.9, 1.1, 1.32, 1.7];
function pondSpawn(now, enter){
  const treasure = rng() < 0.07;
  const spec = treasure ? {kind:"treasure"} : rollFishSpec();
  const big = spec.id === 382;
  const size = treasure ? 0.62 : big ? 2.3 : FISH_SIZE[spec.rar] * (0.92 + Math.random() * 0.16);
  const s = {spec, kind:spec.kind, size, seed:Math.random(), born:now,
    until:now + (treasure ? 45000 + Math.random() * 20000 : 30000 + Math.random() * 25000),
    mode:treasure ? "still" : "swim", a:Math.random() * Math.PI * 2,
    sp:(treasure ? 0 : 0.000045 / Math.sqrt(size)), x:0.15 + Math.random() * 0.7, y:0.2 + Math.random() * 0.6};
  if(enter && !treasure){
    /* une nouvelle ombre arrive d'un bord */
    const left = Math.random() < 0.5;
    s.x = left ? -0.08 : 1.08; s.y = 0.25 + Math.random() * 0.5; s.a = left ? 0 : Math.PI;
  }
  if(enter && (spec.shiny || big) && typeof FV_ON !== "undefined" && FV_ON){
    if(big) pzFlash("Attends. Cette ombre-là… ce n'est pas un poisson. C'est la moitié d'un océan.");
    else { pzFlash("Une ombre qui brille, là. Je dis ça, je ne dis rien."); try { Sfx.shiny(); } catch(e){} }
  }
  return s;
}
function pond(now){
  now = now || fsNow();
  const key = (S.region || "") + ":" + rodLevel();
  if(!POND || POND.key !== key){
    POND = {key, shadows:[], last:now, nextSpawn:0, ripples:[], drops:[]};
    for(let i = 0; i < FISH_N; i++) POND.shadows.push(pondSpawn(now, false));
  }
  return POND;
}
function fishDist(s, p){ return Math.hypot(s.x - p.x, (s.y - p.y) * 0.62); }
function shadowMove(s, dt, now){
  const F = FISHING;
  if(s.kind === "treasure"){
    if(s.mode === "still" && now > s.until && F.target !== s) s.mode = "fade";
    if(s.mode === "fade"){ s.fade = (s.fade || 0) + dt; if(s.fade > 900) s.mode = "gone"; }
    return;
  }
  const turn = (target, k) => {
    let d = Math.atan2(target.y - s.y, target.x - s.x) - s.a;
    while(d > Math.PI) d -= Math.PI * 2; while(d < -Math.PI) d += Math.PI * 2;
    s.a += d * Math.min(1, k * dt);
  };
  if(s.mode === "swim"){
    s.a += Math.sin(now / 1300 + s.seed * 17) * 0.0011 * dt;
    if(s.x < 0.1 || s.x > 0.9 || s.y < 0.16 || s.y > 0.84) turn({x:0.5, y:0.5}, 0.004);
    s.x += Math.cos(s.a) * s.sp * dt; s.y += Math.sin(s.a) * s.sp * dt * 0.62;
    if(now > s.until && F.target !== s) s.mode = "leave";
  } else if(s.mode === "come"){
    turn(F.bob, 0.01);
    const v = s.sp * 4 * dt;
    s.x += Math.cos(s.a) * v; s.y += Math.sin(s.a) * v * 0.62;
    if(fishDist(s, F.bob) < 0.035 + s.size * 0.02){ s.mode = "nibble"; s.orb = Math.atan2(s.y - F.bob.y, s.x - F.bob.x); }
  } else if(s.mode === "nibble" || s.mode === "hooked"){
    /* elle tourne autour du bouchon, le nez dessus */
    s.orb += dt * (s.mode === "hooked" ? 0.012 : 0.0016);
    const r = 0.04 + s.size * 0.018;
    s.x = F.bob.x + Math.cos(s.orb) * r * (s.mode === "hooked" ? 0.5 : 1);
    s.y = F.bob.y + Math.sin(s.orb) * r * 0.8 * (s.mode === "hooked" ? 0.5 : 1);
    s.a = Math.atan2(F.bob.y - s.y, F.bob.x - s.x);
  } else if(s.mode === "flee" || s.mode === "leave"){
    const away = s.mode === "flee" ? {x:s.x + Math.cos(s.a) * 2, y:s.y + Math.sin(s.a) * 2}
      : {x:s.x < 0.5 ? -0.3 : 1.3, y:s.y};
    turn(away, 0.008);
    const v = s.sp * (s.mode === "flee" ? 5.5 : 1.6) * dt;
    s.x += Math.cos(s.a) * v; s.y += Math.sin(s.a) * v * 0.62;
    if(s.x < -0.2 || s.x > 1.2 || s.y < -0.2 || s.y > 1.2) s.mode = "gone";
  }
}

/* ---------- la partie : un automate, réglé sur l'horloge ---------- */
function fishSet(st, now){ FISHING.st = st; FISHING.stT = now; fishHud(); }
function fishCast(pt, now){
  const F = FISHING;
  if(F.target && F.target.mode !== "gone") F.target.mode = F.target.kind === "treasure" ? "still" : "swim";
  F.target = null; F.nibs = 0; F.quality = null; F.miss = null;
  F.to = {x:Math.max(0.06, Math.min(0.94, pt.x)), y:Math.max(0.08, Math.min(0.92, pt.y))};
  F.bob = F.to; F.castT = now; F.landT = now + 430; F.attractAt = 0;
  fishSet("cast", now);
  try { Sfx.throwb(); } catch(e){}
  if(typeof buzz === "function") buzz(6);
}
/* le bouton vise la plus grande ombre, un peu devant elle */
function fishAutoAim(){
  const P = pond();
  let best = null;
  for(const s of P.shadows) if((s.mode === "swim" || s.mode === "still") && s.x > 0.04 && s.x < 0.96 && (!best || s.size > best.size)) best = s;
  if(!best) return {x:0.5, y:0.5};
  return best.kind === "treasure" ? {x:best.x, y:best.y} : {x:best.x + Math.cos(best.a) * 0.07, y:best.y + Math.sin(best.a) * 0.05};
}
function fishTarget(s, now){
  const F = FISHING, rain = fishRain();
  F.target = s;
  if(s.kind === "treasure"){
    /* un trésor ne nage pas : la ligne s'y accroche, après un moment */
    F.nibs = 0; F.nextNib = now + (900 + Math.random() * 700) * (rain ? 0.7 : 1);
    fishSet("near", now);
    return;
  }
  s.mode = "come";
  F.nibs = Math.floor(Math.random() * 3) + (s.spec.rar >= 3 ? 1 : 0);
  fishSet("come", now);
}
function fishLanded(now){
  const F = FISHING, P = pond(now);
  fishRipple(F.bob, now, 9); fishSplash(F.bob, 8, now);
  let best = null, bd = 9;
  for(const s of P.shadows){
    if(s.mode !== "swim" && s.mode !== "still") continue;
    const d = fishDist(s, F.bob);
    const reach = s.kind === "treasure" ? 0.07 : 0.2 + s.size * 0.04;
    if(d < reach && d < bd){ bd = d; best = s; }
  }
  if(best){ fishTarget(best, now); return; }
  F.attractAt = now + (1100 + Math.random() * 1100) * (fishRain() ? 0.65 : 1);
  fishSet("wait", now);
}
function fishHookIt(now){
  const F = FISHING, rod = rodDef() || RODS[0];
  const r = now - F.biteAt;
  F.quality = r <= rod.perfect ? "perfect" : "good";
  F.hookT = now;
  if(F.target && F.target.kind !== "treasure") F.target.mode = "hooked";
  fishSet("hooked", now);
  fishSplash(F.bob, 16, now);
  try { Sfx.hit(); } catch(e){}
  if(typeof buzz === "function") buzz(F.quality === "perfect" ? [20, 30, 60] : 30);
  fishPop(F.quality === "perfect" ? "Parfait !" : "Ferré !", F.quality === "perfect" ? "gold" : "ok");
  return F.quality;
}
function fishMiss(kind, now){
  const F = FISHING;
  F.miss = kind; F.until = now + 800;
  if(F.target){
    if(F.target.kind === "treasure") F.target.mode = "still";
    else { F.target.mode = "flee"; F.target.a = Math.atan2(F.target.y - F.bob.y, F.target.x - F.bob.x); }
  }
  F.target = null;
  fishSet("miss", now);
  fishPop(kind === "early" ? "Trop tôt !" : "Trop tard…", "bad");
  try { kind === "late" ? Sfx.fail() : Sfx.wobble(); } catch(e){}
  if(typeof buzz === "function") buzz(kind === "late" ? [40, 30, 40] : 14);
}
/* un toucher : sur l'eau (nx, ny entre 0 et 1), ou sur le bouton (nx = null) */
function fishTap(nx, ny, now, btn){
  const F = FISHING; now = now || fsNow();
  if(!rodLevel()) return "norod";
  const onWater = !btn && nx != null && ny != null && ny >= -0.05 && ny <= 1.05;
  switch(F.st){
    case "idle":
      if(now < (F.lock || 0)) return "ignore";
      fishCast(onWater ? {x:nx, y:ny} : fishAutoAim(), now); return "cast";
    case "wait":
      if(now - F.landT < FISH_GRACE) return "ignore";
      if(onWater){ fishCast({x:nx, y:ny}, now); return "recast"; }
      fishSay("Rien ne mord encore. Touche l'eau ailleurs pour relancer."); return "nothing";
    case "come": case "near":
      if(now - F.landT < FISH_GRACE) return "ignore";
      fishMiss("early", now); return "early";
    case "bite":
      return fishHookIt(now);
    default: return "ignore";
  }
}
/* ce qui remonte */
function fishLand(now){
  const F = FISHING, s = F.target, spec = s && s.spec;
  if(POND && s){ POND.shadows = POND.shadows.filter(x=>x !== s); POND.nextSpawn = (now || fsNow()) + 1400; }
  const quality = F.quality;
  S.stats.fish = (S.stats.fish || 0) + 1;
  S.daily.dayFish = (S.daily.dayFish || 0) + 1;
  questTick("dayFish", 1);
  if(!spec || spec.kind === "treasure"){
    const k = typeof rollTreasure === "function" ? rollTreasure(rodLevel() - 1, true) : null;
    fishReset(); FISHING.lock = (now || fsNow()) + 500; fishHud();
    if(k && TREASURES[k]){
      const icon = {heart_scale:"heart", pearl:"pearl", stardust:"stardust", big_pearl:"bigpearl", star_piece:"starpiece", golden:"statue"}[k];
      if(typeof banner === "function") banner({kicker:"AU BOUT DE LA LIGNE", title:TREASURES[k].n, sub:`Un trésor : il se revend ${fmt(TREASURES[k].sell)} PokéCoins (Sac, onglet Trésors).`,
        item:"treasure:" + icon, c:"#ffd24a", sfx:"coin"});
      else toast("Trésor : " + TREASURES[k].n, "warn", "star");
    }
    saveSoon();
    if(typeof checkStoryTriggers === "function") setTimeout(()=>{ try { if(currentScreen === "capture") checkStoryTriggers(); } catch(e){} }, 1600);
    return null;
  }
  newFishEncounter(spec);
  ENC.hook = quality;
  if(spec.id === 382) pzFlash("Je te l'avais dit. La moitié d'un océan. Ne la rate pas.");
  fishReset();
  try { Sfx.caught(); } catch(e){}
  refresh();
  return ENC;
}
function fishUpdate(now){
  const F = FISHING, P = pond(now);
  const dt = Math.max(0, Math.min(100, now - (P.last || now))); P.last = now;
  for(const s of P.shadows) shadowMove(s, dt, now);
  P.shadows = P.shadows.filter(s=>s.mode !== "gone");
  if(P.shadows.length < FISH_N && now >= (P.nextSpawn || 0)){ P.shadows.push(pondSpawn(now, true)); P.nextSpawn = now + 1800; }
  const rain = fishRain(), rod = rodDef() || RODS[0];
  switch(F.st){
    case "cast":
      if(now >= F.landT) fishLanded(now);
      break;
    case "wait":
      if(F.attractAt && now >= F.attractAt){
        /* personne n'est venu : l'ombre la plus proche finit par s'intéresser au bouchon */
        let best = null, bd = 9;
        for(const s of P.shadows) if(s.mode === "swim" && s.x > 0 && s.x < 1){ const d = fishDist(s, F.bob); if(d < bd){ bd = d; best = s; } }
        if(best) fishTarget(best, now); else F.attractAt = now + 900;
      }
      break;
    case "come":
      if(!F.target || F.target.mode === "gone"){ F.target = null; F.attractAt = now + 600; fishSet("wait", now); break; }
      if(F.target.mode === "nibble"){ F.nextNib = now + (500 + Math.random() * 500) * (rain ? 0.75 : 1); fishSet("near", now); }
      break;
    case "near":
      if(now >= F.nextNib){
        if(F.nibs > 0){
          F.nibs--; F.dip = now; F.nextNib = now + (520 + Math.random() * 430) * (rain ? 0.8 : 1);
          fishRipple(F.bob, now, 5);
          try { Sfx.tone(700 + Math.random() * 200, .04, "sine", .025); } catch(e){}
          if(typeof buzz === "function") buzz(5);
          if(F.nibs === 0) F.nextNib = now + (380 + Math.random() * 420) * (rain ? 0.8 : 1);
        } else {
          F.biteAt = now;
          fishSet("bite", now);
          fishRipple(F.bob, now, 12); fishSplash(F.bob, 14, now);
          try { Sfx.wobble(); } catch(e){}
          if(typeof buzz === "function") buzz([30, 20, 30]);
        }
      }
      break;
    case "bite":
      if(now - F.biteAt > rod.window) fishMiss("late", now);
      break;
    case "hooked":
      if(now - F.hookT > 520){ F.leapT = now; fishSet("leap", now); fishSplash(F.bob, 18, now); }
      else if(Math.random() < dt / 70) fishSplash(F.bob, 2, now);
      break;
    case "leap":
      if(now - F.leapT > 620) fishLand(now);
      break;
    case "miss":
      if(now >= F.until){ fishReset(); FISHING.lock = now + 150; fishHud(); }
      break;
  }
  FISHING.seen = now;
}

/* ---------- l'image ---------- */
function fishRipple(p, now, r){ if(POND) POND.ripples.push({x:p.x, y:p.y, t0:now, r:r || 8}); }
function fishSplash(p, n, now){
  if(!POND) return;
  for(let i = 0; i < n; i++) POND.drops.push({x:p.x, y:p.y, vx:(Math.random() - 0.5) * 0.0006, vy:-0.0004 - Math.random() * 0.0007, t0:now, life:380 + Math.random() * 320});
}
function fishPop(txt, cls){
  const el = typeof document !== "undefined" && document.getElementById ? document.getElementById("fs-pop") : null;
  if(!el || !FV || !FISHING.bob) return;
  el.textContent = txt;
  el.className = "fs-pop " + (cls || "");
  el.style.left = Math.max(64, Math.min(FV.LW * 2 - 64, FISHING.bob.x * FV.LW * 2)) + "px";
  el.style.top = ((FV.WT + FISHING.bob.y * (FV.WB - FV.WT)) * 2 - 34) + "px";
  void el.offsetWidth; el.classList.add("on");
}
function fishSay(t){ const el = typeof document !== "undefined" && document.getElementById ? document.getElementById("fs-say") : null; if(el) el.textContent = t; }
const FISH_SAY = {
  idle:"Touche l'eau près d'une ombre pour lancer. Grande ombre, prise rare.",
  cast:"",
  wait:"Rien ne mord encore. Touche l'eau ailleurs pour relancer.",
  come:"Une ombre approche. Attends le « ! ».",
  near:"Elle goûte le bouchon… pas encore.",
  bite:"Maintenant !",
  hooked:"", leap:"", miss:""
};
function fishHud(){
  if(typeof document === "undefined" || !document.getElementById) return;
  const F = FISHING, b = document.getElementById("fs-btn");
  const st = F.st;
  if(b){
    b.textContent = st === "idle" ? "Lancer la ligne" : st === "bite" ? "FERRER !" : st === "hooked" || st === "leap" ? (F.quality === "perfect" ? "Ferrage parfait" : "Ferré !")
      : st === "miss" ? (F.miss === "early" ? "Trop tôt" : "Trop tard") : "Ferrer";
    b.className = "throwbtn fs-btn " + (st === "bite" ? "urgent" : st === "idle" ? "" : st === "hooked" || st === "leap" ? "ok" : st === "miss" ? "bad" : "dim");
  }
  let say = FISH_SAY[st] || "";
  if(st === "near" && F.target && F.target.kind === "treasure") say = "Ça accroche quelque chose, au fond…";
  if(st === "hooked" || st === "leap") say = F.quality === "perfect" ? "Ferrage parfait : elle est sonnée, +20 % à la capture." : "Ferré ! Ça tient.";
  if(st === "miss") say = F.miss === "early" ? "Trop tôt : elle a filé. Attends le « ! »." : "Trop tard : elle a décroché.";
  if(st === "idle" && POND && POND.shadows.some(s=>s.spec && s.spec.shiny)) say = "Une ombre brille dans l'eau…";
  if(say) fishSay(say);
  const pondEl = document.getElementById("fs-pond"); if(pondEl) pondEl.dataset.st = st;
}
function fishMount(){
  const cv = document.getElementById("fs-cv"); if(!cv || !cv.getContext) return;
  const host = cv.parentElement;
  const cssW = Math.max(280, Math.min(520, (host && host.clientWidth) || 340));
  const LW = Math.floor(cssW / 2), LH = Math.round(LW * 0.66);
  cv.width = LW; cv.height = LH;
  cv.style.width = LW * 2 + "px"; cv.style.height = LH * 2 + "px";
  if(host) host.style.height = LH * 2 + "px";
  FV = {cv, ctx:cv.getContext("2d"), LW, LH, WT:Math.round(LH * 0.13), WB:LH - Math.round(LH * 0.15)};
  FV_ON = true;
  const now = fsNow();
  /* revenu d'ailleurs : on repart d'une ligne au repos */
  if(FISHING.st !== "idle" && now - (FISHING.seen || 0) > 1500) fishReset();
  pond(now);
  try { if(typeof brAtlasReady === "function"){ brAtlasReady(); brShinyAtlasReady(); } } catch(e){}
  const toWater = e => {
    const r = cv.getBoundingClientRect();
    const Y = (e.clientY - r.top) / r.height * LH;
    return [(e.clientX - r.left) / r.width, (Y - FV.WT) / (FV.WB - FV.WT)];
  };
  cv.addEventListener("pointerdown", e => { e.preventDefault(); const [x, y] = toWater(e); fishTap(x, y, fsNow(), false); });
  const b = document.getElementById("fs-btn");
  if(b){
    b.addEventListener("pointerdown", e => { e.preventDefault(); FISHING.pd = fsNow(); fishTap(null, null, fsNow(), true); });
    /* le clavier (Entrée, Espace) n'a pas de pointerdown : le clic, seul, compte alors */
    b.addEventListener("click", () => { if(fsNow() - (FISHING.pd || 0) < 800) return; fishTap(null, null, fsNow(), true); });
  }
  if(FISHING.raf) cancelAnimationFrame(FISHING.raf);
  const loop = () => {
    if(!cv.isConnected){ FISHING.raf = 0; if(FV && FV.cv === cv) FV_ON = false; return; }
    FISHING.raf = requestAnimationFrame(loop);
    const n = fsNow();
    try { fishUpdate(n); fishDraw(n); } catch(e){ console.error("pêche", e); }
  };
  FISHING.raf = requestAnimationFrame(loop);
  fishHud();
}
/* la toile est dessinée à moitié de sa taille, puis agrandie sans lissage : du pixel net */
function fishDraw(now){
  const V = FV; if(!V) return;
  const x = V.ctx, LW = V.LW, LH = V.LH, WT = V.WT, WB = V.WB, WH = WB - WT, F = FISHING, P = POND;
  x.imageSmoothingEnabled = false;
  const night = typeof isNight === "function" && isNight(), rain = fishRain();
  const th = (typeof REGION_THEME !== "undefined" && REGION_THEME[S.region]) || {dot:"#35f0d6"};
  const wx = p => p.x * LW, wy = p => WT + p.y * WH;
  /* l'eau */
  const g = x.createLinearGradient(0, WT, 0, WB);
  if(night){ g.addColorStop(0, "#0e2442"); g.addColorStop(1, "#060f22"); }
  else { g.addColorStop(0, "#175168"); g.addColorStop(1, "#0a2a3e"); }
  x.fillStyle = g; x.fillRect(0, 0, LW, LH);
  /* les reflets : de courts traits qui glissent */
  x.fillStyle = th.dot;
  for(let i = 0; i < 34; i++){
    const sx = ((i * 53.7 + now * (0.004 + (i % 5) * 0.0015)) % (LW + 20)) - 10;
    const sy = WT + ((i * 37.3) % WH);
    const a = 0.08 + 0.1 * Math.max(0, Math.sin(now / 700 + i * 1.7));
    x.globalAlpha = a; x.fillRect(Math.round(sx), Math.round(sy), 2 + (i % 3), 1);
  }
  x.globalAlpha = 1;
  /* l'ombre d'un très gros : l'eau s'assombrit */
  if(P && P.shadows.some(s=>s.spec && s.spec.id === 382)){ x.fillStyle = `rgba(0,4,20,${0.16 + 0.06 * Math.sin(now / 600)})`; x.fillRect(0, WT, LW, WH); }
  /* les ombres */
  if(P) for(const s of P.shadows) fishDrawShadow(x, s, now, wx(s), wy(s), F);
  /* nénuphars */
  for(let i = 0; i < 3; i++){
    const px = Math.round(LW * (0.12 + i * 0.37) + Math.sin(now / 2400 + i) * 2), py = Math.round(WT + WH * (0.18 + (i % 2) * 0.6) + Math.cos(now / 2000 + i) * 1);
    x.fillStyle = night ? "#1d4a2a" : "#2f7a3e"; x.beginPath(); x.ellipse(px, py, 7, 3.5, 0, 0.35, Math.PI * 2); x.lineTo(px, py); x.fill();
    x.fillStyle = night ? "#2a5e36" : "#3f9a4f"; x.fillRect(px - 3, py - 1, 3, 1);
    if(i === 1){ x.fillStyle = "#ff8fb8"; x.fillRect(px + 2, py - 3, 2, 2); x.fillStyle = "#ffd1e3"; x.fillRect(px + 2, py - 3, 1, 1); }
  }
  /* les ronds dans l'eau */
  if(P){
    if(Math.random() < 0.012) P.ripples.push({x:Math.random(), y:Math.random(), t0:now, r:4});
    if(rain && Math.random() < 0.35) P.ripples.push({x:Math.random(), y:Math.random(), t0:now, r:3});
    P.ripples = P.ripples.filter(r=>now - r.t0 < 900);
    x.strokeStyle = "#cfe9ff"; x.lineWidth = 1;
    for(const r of P.ripples){
      const k = (now - r.t0) / 900;
      x.globalAlpha = 0.45 * (1 - k); x.beginPath(); x.ellipse(wx(r), wy(r), 1 + r.r * k, 0.5 + r.r * k * 0.45, 0, 0, Math.PI * 2); x.stroke();
    }
    x.globalAlpha = 1;
  }
  /* les berges */
  x.fillStyle = night ? "#081a12" : "#0f3020"; x.fillRect(0, 0, LW, WT);
  for(let i = 0; i < LW; i += 3){
    const h = 3 + ((i * 7) % 6) + Math.sin(now / 900 + i) * 0.8;
    x.fillStyle = night ? "#123321" : (i % 2 ? "#245c34" : "#1d4a2b"); x.fillRect(i, WT - h, 1, h + 1);
  }
  x.fillStyle = night ? "#1a140d" : "#2b2015"; x.fillRect(0, WB, LW, LH - WB);
  x.fillStyle = night ? "#22341c" : "#3a6a2c"; x.fillRect(0, WB, LW, 2);
  for(let i = 1; i < LW; i += 4){ x.fillStyle = night ? "#2a4022" : "#4a8a36"; x.fillRect(i, WB - 1 - (i % 3), 1, 2 + (i % 3)); }
  /* la pluie */
  if(rain){ x.fillStyle = "rgba(170,210,255,.35)"; for(let i = 0; i < 26; i++){ const rx = (i * 41 + now * 0.09) % LW, ry = (i * 29 + now * 0.18) % LH; x.fillRect(Math.round(rx), Math.round(ry), 1, 3); } }
  /* la canne, la ligne, le bouchon */
  const rod = rodDef() || RODS[0];
  const hooked = F.st === "hooked" || F.st === "leap";
  let tipX = LW * 0.8, tipY = WB - WH * 0.18;
  if(hooked && F.bob){ tipX += (wx(F.bob) - tipX) * 0.08 + (Math.random() - 0.5) * 1.5; tipY += 2 + (Math.random() - 0.5) * 1.5; }
  const hx = LW - 2, hy = LH + 2;
  x.strokeStyle = {old:"#7a5230", super:"#3d6fd6", mega:"#d6a93d"}[rod.k]; x.lineWidth = 2;
  x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo((hx + tipX) / 2 + (hooked ? -4 : 0), (hy + tipY) / 2 + (hooked ? 4 : 0), tipX, tipY); x.stroke();
  x.fillStyle = "#9aa6b8"; x.fillRect(Math.round(hx - (hx - tipX) * 0.18) - 2, Math.round(hy - (hy - tipY) * 0.18) - 2, 4, 4);
  let bob = null, bobAlpha = 1;
  if(F.st === "cast"){
    const k = Math.min(1, (now - F.castT) / (F.landT - F.castT));
    const tx = wx(F.to), ty = wy(F.to);
    bob = {X:tipX + (tx - tipX) * k, Y:tipY + (ty - tipY) * k - Math.sin(Math.PI * k) * 26};
  } else if(F.st !== "idle" && F.bob && !(F.st === "miss" && now - F.stT > 260)){
    bob = {X:wx(F.bob), Y:wy(F.bob) + Math.sin(now / 520) * 0.6};
    if(F.dip && now - F.dip < 170) bob.Y += 1.5;
    if(F.st === "bite" || hooked){ bob.Y += 2.5; bobAlpha = 0.45; }
  }
  if(bob){
    x.strokeStyle = "rgba(230,242,255,.6)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(tipX, tipY);
    /* un fil presque tendu, qui pend un peu ; tendu net quand ça a mordu */
    const sag = hooked ? 0 : F.st === "cast" ? 2 : 5;
    x.quadraticCurveTo((tipX + bob.X) / 2, (tipY + bob.Y) / 2 + sag, bob.X, bob.Y); x.stroke();
    const bx = Math.round(bob.X), by = Math.round(bob.Y);
    x.globalAlpha = bobAlpha;
    x.fillStyle = "#1a1a1a"; x.fillRect(bx - 2, by - 3, 5, 6);
    x.fillStyle = "#ff4a4a"; x.fillRect(bx - 1, by - 2, 3, 2);
    x.fillStyle = "#f4f4f4"; x.fillRect(bx - 1, by, 3, 2);
    x.fillStyle = "#1a1a1a"; x.fillRect(bx, by - 5, 1, 2);
    x.globalAlpha = 1;
    /* le « ! » des jeux d'origine */
    if(F.st === "bite"){
      const jy = by - 17 - Math.round(Math.abs(Math.sin(now / 90)) * 2);
      x.fillStyle = "#1a1a1a"; x.fillRect(bx - 4, jy - 1, 9, 12);
      x.fillStyle = "#ffffff"; x.fillRect(bx - 3, jy, 7, 10);
      x.fillStyle = "#e02828"; x.fillRect(bx, jy + 1, 1, 5); x.fillRect(bx, jy + 8, 1, 1);
      x.fillStyle = "#ffffff"; x.fillRect(bx - 1, jy + 10, 3, 2); x.fillStyle = "#1a1a1a"; x.fillRect(bx - 1, jy + 12, 1, 1);
    }
  }
  /* le saut hors de l'eau */
  if(F.st === "leap" && F.bob && F.target){
    const k = Math.min(1, (now - F.leapT) / 620);
    const X = wx(F.bob), Y = wy(F.bob) - Math.sin(Math.PI * Math.min(1, k * 1.15)) * 30 - k * 6;
    const sz = 22 + k * 10;
    const s = F.target.spec;
    let ok = false;
    if(s && s.kind !== "treasure" && typeof brSprite === "function"){
      const sp = brSprite(s.id, s.shiny ? "s" : "n");
      if(sp){ x.drawImage(sp, Math.round(X - sz / 2), Math.round(Y - sz / 2), Math.round(sz), Math.round(sz)); ok = true; }
    }
    if(!ok){
      x.fillStyle = s && s.kind === "treasure" ? "#ffd24a" : "#e8f4ff";
      x.beginPath(); x.ellipse(X, Y, sz * 0.22, sz * 0.18, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#ffffff"; x.fillRect(Math.round(X - 1), Math.round(Y - 3), 2, 2);
    }
    if(s && s.shiny && Math.sin(now / 60) > 0){ x.fillStyle = "#ffd24a"; x.fillRect(Math.round(X + sz * 0.3), Math.round(Y - sz * 0.35), 2, 2); }
  }
  /* les gouttes */
  if(P){
    P.drops = P.drops.filter(d=>now - d.t0 < d.life);
    x.fillStyle = "#dff1ff";
    for(const d of P.drops){
      const t = now - d.t0, X = wx(d) + d.vx * t * LW, Y = wy(d) + (d.vy * t + 0.0000016 * t * t) * WH;
      x.globalAlpha = 1 - t / d.life; x.fillRect(Math.round(X), Math.round(Y), 1, 1);
    }
    x.globalAlpha = 1;
  }
}
function fishDrawShadow(x, s, now, X, Y, F){
  if(s.kind === "treasure"){
    const a = s.mode === "fade" ? Math.max(0, 1 - (s.fade || 0) / 900) : Math.min(1, (now - s.born) / 800);
    x.globalAlpha = 0.5 * a; x.fillStyle = "#020a12";
    x.fillRect(Math.round(X - 3), Math.round(Y - 2), 7, 5); x.fillRect(Math.round(X - 2), Math.round(Y - 3), 5, 7);
    x.globalAlpha = a;
    if(Math.sin(now / 260 + s.seed * 9) > 0.55){ x.fillStyle = "#fff6c8"; x.fillRect(Math.round(X + 1), Math.round(Y - 2), 1, 1); x.fillRect(Math.round(X), Math.round(Y - 1), 3, 1); }
    x.globalAlpha = 1;
    return;
  }
  const fadeIn = Math.min(1, (now - s.born) / 900);
  const L = 8 * s.size, Wd = L * 0.42;
  const fast = s.mode === "flee" || s.mode === "hooked" || s.mode === "come";
  const wag = Math.sin(now / (fast ? 55 : 160) + s.seed * 10) * (fast ? 0.6 : 0.35);
  x.save(); x.translate(X, Y); x.rotate(s.a);
  x.globalAlpha = 0.56 * fadeIn; x.fillStyle = "#020b14";
  x.beginPath(); x.ellipse(0, 0, L, Wd, 0, 0, Math.PI * 2); x.fill();
  x.save(); x.translate(-L * 0.85, 0); x.rotate(wag);
  x.beginPath(); x.moveTo(0, 0); x.lineTo(-L * 0.6, -Wd * 0.95); x.lineTo(-L * 0.6, Wd * 0.95); x.closePath(); x.fill();
  x.restore();
  x.restore();
  x.globalAlpha = 1;
  /* un chromatique : un reflet doré, de temps en temps */
  if(s.spec && s.spec.shiny && ((now + s.seed * 4000) % 1500) < 380){
    const gx = Math.round(X + Math.cos(s.a) * L * 0.3), gy = Math.round(Y - Wd - 2);
    x.fillStyle = "#ffd24a"; x.fillRect(gx - 1, gy, 3, 1); x.fillRect(gx, gy - 1, 1, 3);
    x.fillStyle = "#fff6c8"; x.fillRect(gx, gy, 1, 1);
  }
}

/* ---------- l'écran ---------- */
function capModeBar(){
  if(!rodLevel()) return "";
  const m = S.capMode === "fish" ? "fish" : "classic";
  return `<div class="capmode">
    <button class="${m==="classic"?"on":""}" data-act="capmode" data-m="classic">${ic("capture")} Capture</button>
    <button class="${m==="fish"?"on":""}" data-act="capmode" data-m="fish">${ic("fish")} Pêche</button>
  </div>`;
}
function fishStage(){
  const rod = rodDef();
  if(!rod) return "";
  const nextRod = RODS[rodLevel()];
  return `<div class="fishpond" id="fs-pond" data-st="${FISHING.st}">
      <canvas id="fs-cv" aria-label="L'étang : touche l'eau pour lancer, puis touche au « ! » pour ferrer"></canvas>
      <div class="fs-pop" id="fs-pop"></div>
      <div class="fs-rodtag">${itemIcon("rod:" + rod.k, 14) || ic("fish")}<span>${esc(rod.n)}</span></div>
      <div class="fs-say" id="fs-say">${esc(FISH_SAY[FISHING.st] || FISH_SAY.idle)}</div>
    </div>
    <button class="throwbtn fs-btn" id="fs-btn" type="button">Lancer la ligne</button>
    ${nextRod ? `<div class="fs-next">
      ${itemIcon("rod:" + nextRod.k, 22) || ""}
      <div class="grow"><b>${esc(nextRod.n)}</b><span>${esc(nextRod.d)}</span></div>
      <button class="btn xs ${S.shards>=nextRod.cost?"gold":""}" data-act="buyrod"
        ${S.shards>=nextRod.cost?"":"disabled"}>${ic("shard")} ${nextRod.cost}</button>
    </div>` : ""}`;
}
ACTIONS.buyrod = () => {
  const nx = RODS[rodLevel()];
  if(!nx) return;
  if(!pay("shards", nx.cost)){ toast("Fragments insuffisants", "bad", "cross"); return; }
  S.rod = rodLevel() + 1;
  Sfx.win();
  toast(nx.n + " équipée", "warn", "fish");
  save(); refresh();
};
/* ferrée très vite, la prise est sonnée : +20 % à la capture */
if(typeof catchChance === "function"){
  const _ccf = catchChance;
  catchChance = function(){
    const c = _ccf.apply(this, arguments);
    return ENC && ENC.fished && ENC.hook === "perfect" && c < 1 ? Math.min(0.98, c * 1.2) : c;
  };
}
