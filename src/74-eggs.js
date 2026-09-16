/* ============================================================
   74 — ŒUFS ET INCUBATION
   Repris de la v1, avec une différence : un œuf n'éclôt pas au
   bout d'un minuteur mais après un nombre de captures. Le module
   récompense donc le jeu, jamais l'attente.
   ============================================================ */

const EGG_TIERS = {
  e_common: {n:"Œuf Commun",     steps:12,  rar:[0,1],     shinyMul:1.5, cores:0,  c:"#5ce07a",
             d:"Une espèce commune ou peu commune de vos secteurs ouverts."},
  e_rare:   {n:"Œuf Rare",       steps:30,  rar:[1,2,3],   shinyMul:3,   cores:4,  c:"#4fb2ff",
             d:"Une espèce peu commune à très rare. Chance de chromatique triplée."},
  e_epic:   {n:"Œuf Épique",     steps:60,  rar:[2,3,4],   shinyMul:6,   cores:9,  c:"#b06bff",
             d:"Une espèce rare à corrompue. Chance de chromatique multipliée par six."},
  e_origin: {n:"Œuf Originel",   steps:120, rar:[3,4,5],   shinyMul:12,  cores:20, c:"#ffd24a",
             d:"Les signatures les plus hautes, légendaires comprises. Chromatique très probable."}
};
const EGG_SLOT_COST = [0, 0, 5, 12];       /* les deux premiers emplacements sont offerts */
const EGG_MAX_SLOTS = 4;

function eggState(){
  S.eggs = S.eggs || {slots:2, inc:[], bag:{}};
  if(!S.eggs.bag) S.eggs.bag = {};
  if(!S.eggs.inc) S.eggs.inc = [];
  return S.eggs;
}
function eggOwned(){ const e = eggState(); return Object.values(e.bag).reduce((a,b)=>a+b, 0); }
function eggSlots(){ return Math.min(EGG_MAX_SLOTS, eggState().slots || 2); }
function eggFreeSlot(){ return eggState().inc.length < eggSlots(); }

function grantEgg(tier){
  const e = eggState();
  e.bag[tier] = (e.bag[tier] || 0) + 1;
  saveSoon();
  return tier;
}
function randomEggTier(){
  const w = {e_common:60, e_rare:26, e_epic:11, e_origin:3};
  const pool = [];
  for(const k in w) for(let i=0;i<w[k];i++) pool.push(k);
  return pick(pool);
}

/* chaque capture fait progresser tous les œufs en incubation */
function eggTick(){
  const e = eggState();
  if(!e.inc.length) return;
  let ready = 0;
  for(const egg of e.inc){
    if(egg.steps < EGG_TIERS[egg.tier].steps) egg.steps++;
    if(egg.steps >= EGG_TIERS[egg.tier].steps) ready++;
  }
  if(ready && !S._eggToast){
    S._eggToast = true;
    toast(ready > 1 ? `${ready} œufs prêts à éclore` : "Un œuf est prêt à éclore", "warn", "box");
    setTimeout(()=>{ S._eggToast = false; }, 30000);
  }
  saveSoon();
}

function eggPool(tier){
  const t = EGG_TIERS[tier];
  const out = [];
  for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++){
      const p = POKE[i];
      if(!p || !t.rar.includes(p.rar)) continue;
      if(p.leg && tier !== "e_origin") continue;        /* les légendaires sont réservés */
      if(isGuardianSpecies(i) && !isReleasedGuardian(i)) continue;
      out.push(i);
    }
  if(!out.length) for(const r of unlockedRegions())
    for(let i = r.from; i <= r.to; i++) if(POKE[i] && !POKE[i].leg) out.push(i);
  return out;
}

ACTIONS.eggput = d => {
  const e = eggState();
  if(!eggFreeSlot()){ toast("Aucun incubateur libre", "bad", "cross"); return; }
  if(!(e.bag[d.t] > 0)) return;
  e.bag[d.t]--;
  e.inc.push({tier:d.t, steps:0, at:Date.now()});
  Sfx.click();
  toast(EGG_TIERS[d.t].n + " placé en incubation", "", "box");
  save(); refresh();
};
ACTIONS.eggback = d => {
  const e = eggState(), i = +d.i;
  const egg = e.inc[i];
  if(!egg || egg.steps >= EGG_TIERS[egg.tier].steps) return;
  e.inc.splice(i, 1);
  e.bag[egg.tier] = (e.bag[egg.tier] || 0) + 1;
  toast("Œuf retiré — la progression est perdue", "bad", "cross");
  save(); refresh();
};
ACTIONS.eggslot = () => {
  const e = eggState();
  const next = eggSlots();
  if(next >= EGG_MAX_SLOTS) return;
  const cost = EGG_SLOT_COST[next];
  if(!pay("cores", cost)){ toast("Noyaux insuffisants", "bad", "cross"); return; }
  e.slots = next + 1;
  Sfx.win();
  toast("Incubateur supplémentaire installé", "warn", "box");
  save(); refresh();
};

ACTIONS.egghatch = d => {
  const e = eggState(), i = +d.i;
  const egg = e.inc[i];
  if(!egg) return;
  const t = EGG_TIERS[egg.tier];
  if(egg.steps < t.steps) return;
  e.inc.splice(i, 1);

  const pool = eggPool(egg.tier);
  const id = pick(pool);
  const shiny = rng() < Math.min(0.35, shinyOdds() * t.shinyMul * 4);
  const lvl = levelFor(POKE[id].rar);
  const isNew = addToDex(id, lvl, shiny);
  addIntegrity(RARITY[POKE[id].rar].integ * (isNew ? 0.85 : 0.04));
  gain("coins", 200 + POKE[id].bst);
  addXp(60 + POKE[id].bst / 3);
  if(shiny){ S.stats.shinies++; S.stats.eggShinies = (S.stats.eggShinies||0) + 1; }
  S.stats.hatched = (S.stats.hatched||0) + 1;
  questTick("dayNew", isNew ? 1 : 0);
  save(); checkAchievements(); guideTick();

  showHatch(id, shiny, isNew, egg.tier);
};

/* ---------- éclosion : l'œuf se fend avant de révéler ---------- */
function showHatch(id, shiny, isNew, tier){
  const box = document.getElementById("discover");
  const t = EGG_TIERS[tier];
  if(!box){ toast("Éclosion : " + POKE[id].name, "warn", "box"); return; }
  box.className = "on hatch";
  box.style.setProperty("--ac", shiny ? "var(--amber)" : t.c);
  box.innerHTML = `
    <div class="dc-rays"></div>
    <div class="dc-inner">
      <div class="dc-kicker" id="hx-kick">${esc(t.n)} — ÉCLOSION</div>
      <div class="hatch-stage" id="hx-stage">
        <div class="egg" id="hx-egg" style="--ec:${t.c}">
          <i></i><i></i><i></i>
        </div>
        <div class="hatch-spr" id="hx-spr">
          <span class="sprbox" style="width:150px;height:150px">
            ${sprite(id, shiny, "", {anim:true, eager:true})}</span>
        </div>
      </div>
      <div class="dc-name" id="hx-name"></div>
      <div class="wrap dc-tags" id="hx-tags" style="justify-content:center"></div>
      <div class="dc-lore" id="hx-lore"></div>
      <button class="btn pri wide dc-ok" id="hx-ok" data-act="dcdone">Archiver</button>
    </div>`;

  const egg = document.getElementById("hx-egg");
  const shake = k => setTimeout(()=>{
    if(egg){ egg.classList.remove("crack"); void egg.offsetWidth; egg.classList.add("crack"); }
    Sfx.wobble(); buzz(14);
  }, k);
  shake(220); shake(620); shake(1020);

  setTimeout(()=>{
    if(egg) egg.classList.add("burst");
    const st = document.getElementById("hx-stage");
    if(st) burstEl(st, {n:30, spread:150, colors:[t.c, "#ffffff", shiny?"#ffc857":"#35f0d6"], dur:950});
    const sp = document.getElementById("hx-spr");
    if(sp) sp.classList.add("in");
    box.classList.add("flash");
    setTimeout(()=>box.classList.remove("flash"), 260);
    shiny ? Sfx.shiny() : Sfx.caught();
    buzz([25,40,70]);
    const k = document.getElementById("hx-kick");
    if(k){ k.textContent = isNew ? "NOUVELLE ENTRÉE D'ARCHIVE" : "ÉCLOSION"; k.classList.add("done"); }
    const n = document.getElementById("hx-name");
    if(n){ n.innerHTML = esc(POKE[id].name) + (shiny ? ' <span class="gold-t">◆</span>' : "");
           n.classList.add("in"); }
    const tg = document.getElementById("hx-tags");
    if(tg){ tg.innerHTML = typeTags(POKE[id].types) + rarTag(POKE[id].rar) +
      `<span class="tt t1">Niv.${S.dex[id].lvl}</span>` +
      (isNew ? '<span class="tt" style="color:var(--green);border-color:var(--green)">INÉDIT</span>' : "");
      tg.classList.add("in"); }
    const lo = document.getElementById("hx-lore");
    if(lo){ lo.textContent = loreOf(id); lo.classList.add("in"); }
    const ok = document.getElementById("hx-ok");
    if(ok) ok.classList.add("in");
  }, 1450);
}

/* ---------- écran ---------- */
SCREENS.eggs = {
  after(){ tutoMaybe("eggs"); },
  html(){
    const e = eggState();
    const slots = eggSlots();
    const next = slots < EGG_MAX_SLOTS ? EGG_SLOT_COST[slots] : null;
    return `
      <div class="h">${ic("box")} COUVEUSE ${infoBtn("eggs")}</div>
      <div class="sub">Un œuf n'éclôt pas avec le temps : il éclôt avec vos captures.
        Chaque restauration fait avancer tous les œufs en incubation.</div>
      ${moduleGoal("Placez un œuf dans un incubateur, puis allez capturer. Il éclôt quand le compte de captures est atteint.",
        "Des espèces rares et une chance de chromatique bien supérieure à la capture normale.")}

      <div class="h sm">INCUBATEURS — ${e.inc.length}/${slots}</div>
      <div class="list">
        ${Array.from({length:slots}, (_,i)=>{
          const egg = e.inc[i];
          if(!egg) return `<div class="incslot empty">${ic("box")}
            <span class="tiny dim">Emplacement libre</span></div>`;
          const t = EGG_TIERS[egg.tier];
          const done = egg.steps >= t.steps;
          const pct = Math.min(100, egg.steps / t.steps * 100);
          return `<div class="incslot ${done?"ready":""}" style="--ec:${t.c}">
            <div class="egg small ${done?"crack":""}"><i></i><i></i><i></i></div>
            <div class="grow">
              <div class="row between"><span class="tiny">${esc(t.n)}</span>
                <span class="tiny mono-num ${done?"ok":"dim"}">${Math.min(egg.steps,t.steps)} / ${t.steps}</span></div>
              <div class="bar thin" style="margin-top:4px"><i style="width:${pct}%"></i></div>
              <div class="tiny dim" style="margin-top:3px">
                ${done ? "Prêt à éclore" : `${t.steps - egg.steps} captures restantes`}</div>
            </div>
            ${done
              ? `<button class="btn sm pri" data-act="egghatch" data-i="${i}">Éclore</button>`
              : `<button class="btn xs ghost" data-act="eggback" data-i="${i}">Retirer</button>`}
          </div>`;
        }).join("")}
        ${next !== null ? `<button class="btn wide sm" data-act="eggslot">
          ${ic("core")} Ajouter un incubateur — ${next} Noyaux</button>` : ""}
      </div>

      <div class="h sm" style="margin-top:12px">ŒUFS EN RÉSERVE — ${eggOwned()}</div>
      ${eggOwned() ? `<div class="list">
        ${Object.keys(EGG_TIERS).filter(k=>e.bag[k] > 0).map(k=>{
          const t = EGG_TIERS[k];
          return `<div class="bagrow">
            <div class="egg tiny-egg" style="--ec:${t.c}"><i></i><i></i><i></i></div>
            <div class="grow">
              <div class="row between"><span class="bag-n">${esc(t.n)}</span>
                <span class="bag-q mono-num">×${e.bag[k]}</span></div>
              <div class="bag-d">${esc(t.d)}</div>
              <div class="tiny dim">${t.steps} captures · chromatique ×${t.shinyMul}</div>
            </div>
            <button class="btn xs ${eggFreeSlot()?"pri":""}" data-act="eggput" data-t="${k}"
              ${eggFreeSlot()?"":"disabled"}>Incuber</button>
          </div>`;}).join("")}
      </div>` : `<div class="empty">Aucun œuf. Ils ne s'obtiennent qu'en <b>terminant une expédition</b>,
          dans ses trésors, ou dans les <b>archives les plus rares</b>.
          <div style="margin-top:10px"><button class="btn sm pri" data-act="goto" data-to="expedition">
            Aller en expédition</button></div></div>`}

      <div class="h sm" style="margin-top:12px">ACHETER</div>
      <div class="list">
        ${Object.entries(EGG_TIERS).filter(([,t])=>t.cores > 0).map(([k,t])=>`
          <div class="shopitem">
            <div class="egg tiny-egg" style="--ec:${t.c}"><i></i><i></i><i></i></div>
            <div class="grow"><div>${esc(t.n)}</div><div class="tiny muted">${esc(t.d)}</div>
              <div class="price">${ic("core")} ${t.cores}</div></div>
            <button class="btn sm gold" data-act="eggbuy" data-t="${k}">Acheter</button>
          </div>`).join("")}
      </div>

      <div class="tiles" style="margin-top:11px">
        <div class="tile accent"><div class="k">Éclosions</div><div class="v">${S.stats.hatched||0}</div></div>
        <div class="tile gold"><div class="k">Chromatiques éclos</div><div class="v">${S.stats.eggShinies||0}</div></div>
      </div>
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};
ACTIONS.eggbuy = d => {
  const t = EGG_TIERS[d.t];
  if(!pay("cores", t.cores)){ toast("Noyaux insuffisants", "bad", "cross"); return; }
  grantEgg(d.t);
  Sfx.coin();
  toast(t.n + " acquis", "", "box");
  save(); refresh();
};
