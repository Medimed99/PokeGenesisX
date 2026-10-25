/* ============================================================
   52 — ÉQUIPEMENT ET MODES D'EXPÉDITION
   Les reliques valent pour toute l'équipe : elles ne posent aucune
   question. Un objet équipé sur UN Pokémon en pose une à chaque
   fois — lequel mérite l'Orbe Vie ? C'est cette décision-là qui
   manquait au parcours.
   ============================================================ */

const EXP_ITEMS = {
  i_orbe:  {n:"Orbe Vie",        rar:3, spr:150,
            d:"+30% de dégâts. Le porteur perd 8% de ses PV max à chaque attaque.",
            atk:1.30, recoil:0.08},
  i_queue: {n:"Queue Pesante",   rar:3, spr:208,
            d:"Attaque toujours en dernier, mais double ses dégâts.",
            atk:2.00, slow:1},
  i_relief:{n:"Reliefs",         rar:2, spr:143,
            d:"Rend 9% des PV max du porteur à la fin de chaque tour.",
            regen:0.09},
  i_bande: {n:"Bandeau Choix",   rar:2, spr:68,
            d:"+35% de dégâts, mais Défense réduite de 20%.",
            atk:1.35, def:0.80},
  i_foulard:{n:"Foulard Choix",  rar:2, spr:135,
            d:"+50% de Vitesse. Attaque presque toujours en premier.",
            spe:1.50},
  i_lentille:{n:"Lentille",      rar:2, spr:123,
            d:"Taux de coup critique porté à 20%.",
            crit:0.20},
  i_ceinture:{n:"Ceinture Pro",  rar:2, spr:65,
            d:"Double les dégâts sur une attaque super efficace.",
            superx:2.00},
  i_veste: {n:"Veste de Combat", rar:1, spr:143,
            d:"+45% de Défense Spéciale.",
            spd:1.45},
  i_evolite:{n:"Évolipierre",    rar:3, spr:113,
            d:"+50% dans les deux Défenses, à condition que le porteur puisse encore évoluer.",
            nfeDef:1.50},
  i_casque:{n:"Casque Brut",     rar:1, spr:95,
            d:"L'assaillant perd 11% de ses PV max à chaque coup porté.",
            thorns:0.11},
  i_grelot:{n:"Grelot Coque",    rar:1, spr:121,
            d:"Rend au porteur 14% des dégâts qu'il inflige.",
            drain:0.14},
  i_ceinture_f:{n:"Ceinture Force",rar:1, spr:66,
            d:"Survit à un coup fatal avec 1 PV, une fois par combat, si les PV étaient pleins.",
            sash:1},
  i_griffe:{n:"Vive Griffe",     rar:1, spr:104,
            d:"45% de chances d'agir en premier, quelle que soit la Vitesse.",
            quick:0.45},
  i_loupe: {n:"Loupe",           rar:0, spr:63,
            d:"+18% de dégâts, sans contrepartie.",
            atk:1.18},
  i_roche: {n:"Roche Lente",     rar:0, spr:74,
            d:"+25% de PV maximum.",
            hp:1.25},
  i_ct:    {n:"Capsule Technique",rar:1, spr:100,
            d:"Améliore d'un palier l'attaque du porteur. Cumulable jusqu'au palier maximal.",
            tm:1}
};
const EXP_ITEM_IDS = Object.keys(EXP_ITEMS);

/* un objet n'apparait qu'a partir d'un certain etage : sans ce garde-fou,
   l'Orbe Vie tombe au premier noeud et le parcours n'a plus de courbe */
/* seuils choisis pour qu'un tirage a trois ait toujours au moins trois
   candidats distincts, des le premier noeud d'equipement */
function itemMinFloor(id){ return [0, 1, 4, 7][EXP_ITEMS[id].rar] || 0; }
function rollExpItem(floor, n){
  const pool = EXP_ITEM_IDS.filter(id=>itemMinFloor(id) <= floor);
  const out = [], seen = new Set();
  let guard = 0;
  while(out.length < n && guard++ < 50){
    /* pondere par rarete : le commun sort plus souvent */
    const w = [];
    for(const id of pool){
      const k = 5 - EXP_ITEMS[id].rar * 1.3;
      for(let i = 0; i < Math.max(1, Math.round(k)); i++) w.push(id);
    }
    const id = pick(w);
    if(seen.has(id)) continue;
    seen.add(id); out.push(id);
  }
  return out;
}

function itemOf(m){ return m && m.item ? EXP_ITEMS[m.item] : null; }
/* effet cumule d'un objet sur les statistiques de combat */
function applyExpItem(m, f){
  const it = itemOf(m);
  if(!it) return;
  if(it.atk)    f.itemAtk  = (f.itemAtk || 1) * it.atk;
  if(it.def)    f.def      = Math.round(f.def * it.def);
  if(it.spd)    f.spd      = Math.round(f.spd * it.spd);
  if(it.spe)    f.spe      = Math.round(f.spe * it.spe);
  if(it.hp){    f.maxHp    = Math.round(f.maxHp * it.hp); f.hp = Math.min(f.hp, f.maxHp); }
  /* Capsule Technique : le palier est porte par le Pokemon, pas par l'objet,
     pour qu'il reste acquis meme si l'objet change de main */
  if(it.tm && (m.tier || 0) < 3){ m.tier = (m.tier || 0) + 1; m.item = null; }
  if(m.tier) f.sig = signatureMove(POKE[m.id], m.level || f.level, m.tier);
  if(it.nfeDef && POKE[m.id].evo && POKE[m.id].evo.length){
    f.def = Math.round(f.def * it.nfeDef);
    f.spd = Math.round(f.spd * it.nfeDef);
  }
  f.item = m.item;
  f._fullAtStart = f.hp >= f.maxHp;
}

/* ---------- le sac d'expédition ----------
   Avant, un objet se donnait sur-le-champ ou se perdait ; on ne pouvait ni le reprendre
   ni le passer à un autre, et « Objets » montrait seulement qui portait quoi. Le sac
   garde ce qu'on ne donne pas tout de suite, et ce qu'on retire à un Pokémon. Seul
   l'objet porté compte au combat. */
const EXP_BAG_MAX = 8;
function expBag(run){
  run = run || S.expedition;
  if(!run) return [];
  if(!Array.isArray(run.bag)) run.bag = [];
  return run.bag;
}
function expBagAdd(run, id){
  if(!run || !EXP_ITEMS[id]) return false;
  const b = expBag(run);
  if(b.length >= EXP_BAG_MAX){ run.bits += 40; toast("Sac plein : l'objet est revendu (+40 Bits)", "warn", "coin"); return false; }
  b.push(id);
  return true;
}
function expBagTake(run, id){ const b = expBag(run), k = b.indexOf(id); if(k < 0) return false; b.splice(k, 1); return true; }
/* donner un objet au Pokémon n° i : celui qu'il portait rejoint le sac */
function expEquip(run, i, id){
  const m = run && run.team[i];
  if(!m || !EXP_ITEMS[id]) return null;
  const old = m.item && EXP_ITEMS[m.item] ? m.item : null;
  m.item = id;
  if(old) expBagAdd(run, old);
  return old;
}
function expEquipLine(m, id, old){
  return `${POKE[m.id].name} porte ${EXP_ITEMS[id].n}` + (old ? ` · ${EXP_ITEMS[old].n} rangé dans le sac` : "");
}

/* « Qui le porte ? » : depuis le sac (from = "bag") ou un objet tout juste trouvé */
ACTIONS.expitempick = d => {
  const run = S.expedition, id = d.id, it = EXP_ITEMS[id];
  if(!run || !it) return;
  const fromBag = d.from === "bag";
  sheet(`${sheetHead("Qui le porte ?")}
    <div class="tiny muted" style="margin-bottom:9px"><b>${esc(it.n)}</b> — ${esc(it.d)}</div>
    <div class="tp-sel">
      ${run.team.map((m,i)=>{
        const cur = itemOf(m);
        return `<div class="tp-row">
          <span class="sprbox" style="width:38px;height:38px">${sprite(m.id, runShiny(m), "", {skin:true})}</span>
          <div class="grow"><div class="tiny">${esc(POKE[m.id].name)}
            <span class="dim">N.${m.level}</span></div>
            <div class="tiny ${cur?"vi":"dim"}">${cur ? "porte " + esc(cur.n) + " (ira dans le sac)" : "aucun objet"}</div></div>
          <button class="btn xs ${cur?"":"pri"}" data-act="expitemgive" data-i="${i}" data-id="${id}" data-from="${fromBag ? "bag" : ""}">
            ${cur?"Échanger":"Donner"}</button>
        </div>`;}).join("")}
    </div>
    <button class="btn ghost wide" style="margin-top:10px" data-act="${fromBag ? "expgear" : "expitembag"}" data-id="${id}">${fromBag ? "Retour au sac" : "Le garder dans le sac"}</button>`);
};
ACTIONS.expitemgive = d => {
  const run = S.expedition, m = run && run.team[+d.i];
  if(!m || !EXP_ITEMS[d.id]) return;
  if(d.from === "bag" && !expBagTake(run, d.id)) return;
  const old = expEquip(run, +d.i, d.id);
  run.itemDraft = null;
  toast(expEquipLine(m, d.id, old), "", "check");
  save();
  if(d.from === "bag"){ ACTIONS.expgear(); refresh(); return; }
  closeSheet(); go("expedition");
};
ACTIONS.expitembag = d => {
  const run = S.expedition; if(!run) return;
  if(expBagAdd(run, d.id)) toast(`${EXP_ITEMS[d.id].n} rangé dans le sac`, "", "box");
  run.itemDraft = null;
  save(); closeSheet(); go("expedition");
};
/* reprendre l'objet d'un Pokémon : il retourne dans le sac */
ACTIONS.expbagtake = d => {
  const run = S.expedition, m = run && run.team[+d.i];
  if(!m || !m.item) return;
  const id = m.item;
  if(!expBagAdd(run, id)) return;
  m.item = null;
  save();
  toast(`${EXP_ITEMS[id].n} rangé dans le sac`, "", "box");
  ACTIONS.expgear(); refresh();
};

/* le sac, ouvert depuis la carte : qui porte quoi, et ce qui attend dans le sac */
ACTIONS.expgear = () => {
  const run = teamRun();
  if(!run){ closeSheet(); return; }
  const bag = expBag(run);
  const icon = (id, n) => itemIcon("exp:" + id, n) || `<span class="sprbox" style="width:${n}px;height:${n}px">${sprite(EXP_ITEMS[id].spr, false, "")}</span>`;
  sheet(`${sheetHead("Sac d'expédition")}
    <div class="tiny muted" style="margin-bottom:10px">Chaque Pokémon tient un objet, qui agit pendant ses combats.
      Touche « Donner » pour équiper un objet du sac, « Reprendre » pour le ranger.</div>
    <div class="h sm">PORTÉS PAR L'ÉQUIPE</div>
    <div class="tp-sel">
      ${run.team.map((m, i)=>{
        const it = itemOf(m);
        return `<div class="tp-row ${m.hp<=0?"ghost":""}">
          <span class="sprbox" style="width:36px;height:36px">${sprite(m.id, runShiny(m), "", {skin:true})}</span>
          <div class="grow"><div class="tiny">${esc(POKE[m.id].name)} <span class="dim">N.${m.level}</span></div>
            ${it ? `<div class="tiny vi">${esc(it.n)}</div><div class="tiny muted">${esc(it.d)}</div>`
                 : `<div class="tiny dim">aucun objet</div>`}</div>
          ${it ? `${icon(m.item, 24)}<button class="btn xs" data-act="expbagtake" data-i="${i}">Reprendre</button>` : ""}
        </div>`;}).join("")}
    </div>
    <div class="h sm" style="margin-top:12px">DANS LE SAC · ${bag.length}/${EXP_BAG_MAX}</div>
    ${bag.length ? `<div class="tp-sel">${bag.map(id=>{ const it = EXP_ITEMS[id]; return `<div class="tp-row">
        ${icon(id, 30)}
        <div class="grow"><div class="tiny">${esc(it.n)}</div><div class="tiny muted">${esc(it.d)}</div></div>
        <button class="btn xs pri" data-act="expitempick" data-id="${id}" data-from="bag">Donner</button>
      </div>`; }).join("")}</div>`
      : `<div class="empty" style="padding:12px">Le sac est vide. Les objets se trouvent dans les coffres et à la boutique Kecleon.</div>`}
    ${run.relics.length ? `<button class="btn ghost wide sm" style="margin-top:10px" data-act="exprelics">${ic("shard2")} Reliques (${run.relics.length}) : elles valent pour toute l'équipe</button>` : ""}
    <button class="btn pri wide" style="margin-top:10px" data-act="closeandrefresh">Fermer</button>`);
};

/* ============================================================
   MODES DE PARCOURS
   ============================================================ */
/* Trois facons de descendre, dans un seul module. Multiplier les modules
   perd le joueur : ce sont des variantes d'une meme chose, elles restent
   donc au meme endroit. */
const EXP_MODES = {
  classic: {n:"Classique",
            d:"Un Pokémon K.O. revient au combat suivant, à 25 % de ses PV.",
            c:"var(--cyan)", mult:1},
  nuzlocke:{n:"Nuzlocke",
            d:"Un Pokémon K.O. ne revient pas de tout le parcours. Ni recrue, ni échange.",
            c:"var(--magenta)", mult:1.8},
  tower:   {n:"La Tour",
            d:"Combats d'équipe à quatre, six ailes de paliers, et les verrous légendaires.",
            c:"var(--violet)", mult:1, go:"tower"}
};
/* la Tour n'est pas un mode de parcours : c'est une destination */
function expRunModes(){ return ["classic", "nuzlocke"]; }
function expMode(){
  const m = (S.expedition && S.expedition.mode) || S.expMode || "classic";
  return EXP_MODES[m] && !EXP_MODES[m].go ? m : "classic";
}
function expModeDef(){ return EXP_MODES[expMode()] || EXP_MODES.classic; }
/* en Classique, un membre tombe repart au combat suivant a 25% */
function classicRecover(run){
  if(expMode() !== "classic") return 0;
  let n = 0;
  for(const m of run.team){
    if(m.hp <= 0){ m.hp = Math.max(1, Math.floor(m.maxHp * 0.25)); n++; }
  }
  return n;
}
ACTIONS.expsetmode = d => {
  const md = EXP_MODES[d.m];
  if(md && md.go){ go(md.go); return; }
  S.expMode = d.m;
  Sfx.click();
  saveSoon(); refresh();
};

/* ============================================================
   HALL DES ARCHIVISTES
   Un parcours termine doit laisser une trace : sans registre, la
   reussite s'efface au retour a l'ecran precedent.
   ============================================================ */
function hallRecord(run, win){
  S.hall = S.hall || [];
  S.hall.unshift({
    t: Date.now(), win, mode: expMode(), floor: run.floor + 1,
    corruption: run.corruption, lost: (run.lost || 0),
    team: run.team.slice(0, 6).map(m=>({id:m.id, lvl:m.level, alive:m.hp > 0, item:m.item || null}))
  });
  if(S.hall.length > 40) S.hall.length = 40;
  S.stats.hallBest = Math.max(S.stats.hallBest || 0, run.floor + 1);
  saveSoon();
}
SCREENS.hall = {
  html(){
    const h = S.hall || [];
    const wins = h.filter(r=>r.win).length;
    return `
      <div class="h">${ic("trophy")} HALL DES ARCHIVISTES</div>
      <div class="sub">Les quarante derniers parcours. Ce qui est écrit ici ne s'efface pas.</div>
      <div class="tiles">
        <div class="tile accent"><div class="k">Parcours</div><div class="v">${h.length}</div></div>
        <div class="tile gold"><div class="k">Bouclés</div><div class="v">${wins}</div></div>
        <div class="tile"><div class="k">Meilleur étage</div><div class="v">${S.stats.hallBest||0}</div></div>
      </div>
      ${h.length ? `<div class="list">
        ${h.map(r=>`<div class="hallrow ${r.win?"win":""}">
          <div class="hl-mark">${r.win?"◆":"·"}</div>
          <div class="grow">
            <div class="row between">
              <span class="tiny">${r.win?"Noyau atteint":"Étage " + r.floor}</span>
              <span class="tiny" style="color:${EXP_MODES[r.mode]?EXP_MODES[r.mode].c:"var(--ink3)"}">
                ${esc(EXP_MODES[r.mode]?EXP_MODES[r.mode].n:"—")}</span>
            </div>
            <div class="hl-team">
              ${r.team.map(m=>`<span class="sprbox ${m.alive?"":"ghosted"}" style="width:26px;height:26px"
                title="${esc(POKE[m.id].name)} N.${m.lvl}">${sprite(m.id,false,m.alive?"":"ghosted",{skin:true})}</span>`).join("")}
            </div>
            <div class="tiny dim">${r.corruption?`corruption ${r.corruption} · `:""}${r.lost?`${r.lost} perdu(s) · `:""}${fmtTime(Date.now()-r.t)}</div>
          </div>
        </div>`).join("")}
      </div>` : `<div class="empty">Aucun parcours enregistré. Le premier y figurera, qu'il aille au bout ou non.</div>`}
      <button class="btn ghost wide" style="margin-top:10px" data-act="goto" data-to="expedition">Retour</button>`;
  }
};
