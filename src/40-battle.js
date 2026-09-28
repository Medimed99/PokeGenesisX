/* ============================================================
   40 — MOTEUR DE COMBAT (partage : Data Guardians + Expedition)
   ============================================================ */

let BATTLE = null;

function createBattle(allies, foes, opts){
  opts = opts || {};
  BATTLE = {
    allies, foes, ai: !!opts.ai, speed: opts.speed || 1,
    a: 0, f: 0, log: [], over: false, result: null,
    onEnd: opts.onEnd || null, title: opts.title || "COMBAT",
    phase: 1, boss: opts.boss || null, busy: false, turn: 0
  };
  blog(opts.intro || `${foes[0].name} entre dans l'arène.`);
  return BATTLE;
}
function blog(t){
  if(!BATTLE) return;
  BATTLE.log.push(t);
  const el = document.getElementById("log");
  if(el){
    const d = document.createElement("div");
    d.innerHTML = t;
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }
}
function activeAlly(){ return BATTLE.allies[BATTLE.a]; }
function activeFoe(){ return BATTLE.foes[BATTLE.f]; }
function aliveIdx(arr){ return arr.findIndex(x=>x.hp > 0); }

function bestMove(att, def){
  /* combat automatique : une seule attaque, celle du type dominant.
     C'est ce qui rend l'echange lisible — on suit ce qui se passe. */
  if(BATTLE && BATTLE.ai && att.sig) return att.sig;
  /* une manœuvre au premier tour si elle apporte quelque chose, sinon la frappe la plus rentable */
  const util = att.moves.find(m=>m.util);
  if(util && !att._used){
    const useful = (util.st && !def.status && typeMult(util.type, def.types) > 0)
                || (util.buff && att.buff.atk < 1.3)
                || (util.heal && att.hp < att.maxHp*0.55);
    if(useful && rng() < 0.55){ att._used = true; return util; }
  }
  let best = null, score = -1;
  for(const m of att.moves){
    if(m.util) continue;
    const e = typeMult(m.type, def.types);
    const stab = att.types.includes(m.type) ? 1.5 : 1;
    const s = m.pw * e * stab * m.acc;
    if(s > score){ score = s; best = m; }
  }
  return best || att.moves[0];
}

/* ---------- altérations d'état ---------- */
function setStatus(f, k){
  if(f.status || f.hp <= 0) return false;
  f.status = {k, turns: k === "slp" ? randInt(1,3) : 0, stack: 0};
  return true;
}
function canAct(f){
  if(!f.status) return {ok:true};
  const st = f.status;
  if(st.k === "slp"){
    if(st.turns > 0){ st.turns--; return {ok:false, msg:`${esc(f.name)} est inactif.`}; }
    f.status = null;
    return {ok:true, msg:`<span class="ok">${esc(f.name)} se réactive.</span>`};
  }
  if(st.k === "par" && rng() < 0.25)
    return {ok:false, msg:`${esc(f.name)} est figé par la paralysie.`};
  return {ok:true};
}
function endOfTurnStatus(f, side){
  if(!f.status || f.hp <= 0) return;
  const st = f.status;
  let dmg = 0;
  if(st.k === "brn") dmg = Math.max(1, Math.floor(f.maxHp/16));
  if(st.k === "psn"){ st.stack = Math.min(6, (st.stack||0)+1); dmg = Math.max(1, Math.floor(f.maxHp*st.stack/24)); }
  if(!dmg) return;
  f.hp = Math.max(0, f.hp - dmg);
  blog(`<span style="color:${STATUS[st.k].c}">${esc(f.name)} subit ${dmg} — ${STATUS[st.k].n}.</span>`);
  popDamage(side, dmg, 1, STATUS[st.k].c);
  if(f.hp <= 0){
    blog(`<span class="bad">${esc(f.name)} est désindexé.</span>`);
    handleKO(side);
  }
}

/* ---------- tour de jeu ---------- */
function doTurn(moveIdx, forcedSwitch){
  if(!BATTLE || BATTLE.over || BATTLE.busy) return;
  BATTLE.busy = true;
  BATTLE.turn++;
  const A = activeAlly(), F = activeFoe();
  const mA = forcedSwitch ? null : (BATTLE.ai ? bestMove(A, F) : A.moves[moveIdx]);
  const mF = bestMove(F, A);
  /* un changement d'équipe consomme le tour : l'adversaire frappe en premier */
  /* l'ordre tient compte des objets : Vive Griffe passe devant, Queue Pesante passe derriere */
  const spdOf = f => {
    const it = f.item ? EXP_ITEMS[f.item] : null;
    let v = f.spe * f.buff.spe * (f.status && f.status.k === "par" ? .5 : 1);
    if(it && it.slow) v = -1;
    if(it && it.quick && rng() < it.quick) v = 1e9;
    return v;
  };
  const allyFirst = !forcedSwitch && spdOf(A) >= spdOf(F);
  const seq = [];
  if(allyFirst) seq.push(["a", A, F, mA], ["f", F, A, mF]);
  else          seq.push(["f", F, A, mF], ["a", A, F, mA]);

  let step = 0;
  const run = () => {
    if(BATTLE.over){ BATTLE.busy = false; return; }
    if(step >= seq.length){ resolveEndOfTurn(); return; }
    const [side, att, def, mv] = seq[step++];
    if(att.hp <= 0 || !mv){ run(); return; }
    const act = canAct(att);
    if(act.msg) blog(act.msg);
    if(!act.ok){ renderArena(); setTimeout(run, 480 / BATTLE.speed); return; }
    applyMove(side, att, def, mv);
    setTimeout(run, 640 / BATTLE.speed);
  };
  run();
}
function resolveEndOfTurn(){
  const A = activeAlly(), F = activeFoe();
  /* Reliefs : regeneration de fin de tour */
  for(const [f, side] of [[A,"ally"],[F,"foe"]]){
    const it = f.item ? EXP_ITEMS[f.item] : null;
    if(it && it.regen && f.hp > 0 && f.hp < f.maxHp){
      const h = Math.max(1, Math.round(f.maxHp * it.regen));
      f.hp = Math.min(f.maxHp, f.hp + h);
      popDamage(side, -h, 1, "var(--green)");
    }
  }
  endOfTurnStatus(F, "foe");
  if(!BATTLE.over) endOfTurnStatus(A, "ally");
  endTurn();
}

function applyMove(side, att, def, mv){
  const target = side === "a" ? "foe" : "ally";
  lungeSprite(side);

  if(rng() > mv.acc){
    blog(`<span class="muted">${esc(att.name)} tente ${esc(mv.name)} — échec de l'écriture.</span>`);
    renderArena(); return;
  }

  /* manœuvres : montée de statistique, soin, ou altération infligée */
  if(mv.util){
    if(mv.buff){
      for(const k in mv.buff) att.buff[k] = Math.min(2.6, att.buff[k] * mv.buff[k]);
      blog(`<b class="cy">${esc(att.name)}</b> utilise ${esc(mv.name)} — statistiques renforcées.`);
      flashSprite(side === "a" ? "ally" : "foe", "var(--cyan)");
    } else if(mv.heal){
      const h = Math.floor(att.maxHp * mv.heal);
      att.hp = Math.min(att.maxHp, att.hp + h);
      blog(`<span class="ok">${esc(att.name)} récupère ${h} points.</span>`);
      popDamage(side === "a" ? "ally" : "foe", -h, 1, "var(--green)");
    } else if(mv.st){
      if(typeMult(mv.type, def.types) === 0){
        blog(`<span class="muted">${esc(mv.name)} n'a aucun effet sur ${esc(def.name)}.</span>`);
      } else if(setStatus(def, mv.st)){
        blog(`${esc(att.name)} inflige <b style="color:${STATUS[mv.st].c}">${STATUS[mv.st].n}</b> à ${esc(def.name)}.`);
        flashSprite(target, STATUS[mv.st].c);
        Sfx.glitch();
      } else {
        blog(`<span class="muted">${esc(def.name)} est déjà affecté.</span>`);
      }
    }
    renderArena(); return;
  }

  const itA = att.item ? EXP_ITEMS[att.item] : null;
  const crit = rng() < ((itA && itA.crit) ? itA.crit : 0.0625);
  /* Lévitation : immunité au type Sol */
  if(def.talent && def.talent.n === "Lévitation" && mv.type === 5){
    blog(`<span class="muted">${esc(def.name)} lévite : l'attaque ne l'atteint pas.</span>`);
    renderArena(); return;
  }
  /* Sable Volant et Estompe : esquive */
  if(def.talent && def.talent.n === "Sable Volant" && rng() < 0.15){
    blog(`<span class="muted">${esc(def.name)} esquive.</span>`);
    renderArena(); return;
  }
  let {dmg, eff} = damageCalc(att, def, mv, crit);
  /* Robustesse : survivre a un coup porte depuis des PV pleins */
  if(def.talent && def.talent.n === "Robustesse" && def.hp >= def.maxHp && dmg >= def.hp){
    dmg = def.hp - 1;
    blog(`<span class="ok">${esc(def.name)} encaisse grâce à Robustesse.</span>`);
  }
  def.hp = Math.max(0, def.hp - dmg);
  /* contact : les talents defensifs repliquent */
  if(def.talent && dmg > 0){
    const tn = def.talent.n;
    if(tn === "Corps Maudit"){
      const back = Math.max(1, Math.round(dmg * 0.10));
      att.hp = Math.max(0, att.hp - back);
      popDamage(side === "a" ? "ally" : "foe", back, 1, "var(--violet)");
    }
    if(tn === "Statik"   && rng() < 0.25 && setStatus(att, "par"))
      blog(`<span style="color:${STATUS.par.c}">Statik paralyse ${esc(att.name)}.</span>`);
    if(tn === "Point Poison" && rng() < 0.25 && setStatus(att, "psn"))
      blog(`<span style="color:${STATUS.psn.c}">Point Poison empoisonne ${esc(att.name)}.</span>`);
    if(tn === "Corps Givré" && rng() < 0.25) att.buff.spe *= 0.7;
  }
  /* effets d'objets declenches par le coup */
  const itD = def.item ? EXP_ITEMS[def.item] : null;
  if(itA && itA.drain){
    const h = Math.max(1, Math.round(dmg * itA.drain));
    att.hp = Math.min(att.maxHp, att.hp + h);
    popDamage(side === "a" ? "ally" : "foe", -h, 1, "var(--green)");
  }
  if(itA && itA.recoil && def.hp >= 0){
    const r = Math.max(1, Math.round(att.maxHp * itA.recoil));
    att.hp = Math.max(1, att.hp - r);
    popDamage(side === "a" ? "ally" : "foe", r, 1, "var(--magenta)");
  }
  if(itD && itD.thorns && dmg > 0){
    const t = Math.max(1, Math.round(att.maxHp * itD.thorns));
    att.hp = Math.max(0, att.hp - t);
    popDamage(side === "a" ? "ally" : "foe", t, 1, "var(--amber)");
  }
  /* Ceinture Force : survivre a un coup fatal depuis des PV pleins */
  if(def.hp <= 0 && itD && itD.sash && !def._sash && def._fullAtStart !== false){
    def._sash = true; def.hp = 1;
    blog(`<span class="ok">${esc(def.name)} tient sur ${esc(itD.n)}.</span>`);
  }
  Sfx.hit(); if(side === "f") buzz(14);
  blog(`${esc(att.name)} utilise <b class="cy">${esc(mv.name)}</b>${mv.signature && mv.tier ? ` <span class="mvtier">${moveTierName(mv.tier)}</span>` : ""} — <b>${dmg}</b>
    ${crit?'<span class="gold-t">coup critique !</span>':""} <span class="muted">${effLabel(eff)}</span>`);
  popDamage(target, dmg, eff);
  if(eff >= 2 || crit) flashArena(eff >= 2 ? "var(--amber)" : "var(--magenta)");
  renderArena();

  if(def.hp <= 0){
    blog(`<span class="bad">${esc(def.name)} est désindexé.</span>`);
    if(target === "foe" && def.id) researchTick(def.id, "battle", 1);
    handleKO(target);
  } else if(BATTLE.boss && side === "a" && BATTLE.phase === 1 && def.hp / def.maxHp <= 0.5){
    bossPhaseTwo(def);
  }
}

function bossPhaseTwo(f){
  BATTLE.phase = 2;
  f.buff.atk *= 1.45; f.buff.spe *= 1.3;
  f.hp = Math.min(f.maxHp, f.hp + Math.floor(f.maxHp*0.12));
  f.status = null;
  Sfx.glitch(); buzz([40,30,60,30,80]);
  shakeApp();
  flashArena("var(--magenta)", 420);
  const ar = document.getElementById("arena");
  if(ar){
    const b = document.createElement("div");
    b.className = "phase-banner";
    b.textContent = "RECONFIGURATION";
    ar.appendChild(b);
    setTimeout(()=>b.remove(), 1400);
  }
  blog(`<span class="bad">Le verrou se reconfigure. Sa signature change.</span>`);
  renderArena();
}

/* ---------- issue d'un échange ---------- */
function handleKO(who){
  if(who === "foe"){
    const n = BATTLE.foes.findIndex((x,i)=>i > BATTLE.f && x.hp > 0);
    if(n === -1){ finishBattle(true); return; }
    BATTLE.f = n;
    blog(`Signature suivante : <b>${esc(BATTLE.foes[n].name)}</b>.`);
  } else {
    const n = BATTLE.allies.findIndex(x=>x.hp > 0);
    if(n === -1){ finishBattle(false); return; }
    BATTLE.a = n;
    blog(`<b class="cy">${esc(BATTLE.allies[n].name)}</b> prend le relais.`);
  }
  renderArena();
}
function endTurn(){
  BATTLE.busy = false;
  renderArena();
  if(!BATTLE.over && BATTLE.ai) setTimeout(()=>doTurn(0), 420 / BATTLE.speed);
}
function finishBattle(win){
  BATTLE.over = true; BATTLE.result = win; BATTLE.busy = false;
  blog(win ? `<b class="ok">Combat remporté.</b>` : `<b class="bad">Votre équipe ne répond plus.</b>`);
  win ? Sfx.win() : Sfx.lose();
  const ar = document.getElementById("arena");
  if(ar){
    const b = document.createElement("div");
    b.className = "phase-banner";
    b.style.color = win ? "var(--cyan)" : "var(--magenta)";
    b.style.textShadow = `0 0 18px ${win ? "var(--cyan)" : "var(--magenta)"},0 3px 0 #000`;
    b.textContent = win ? "VICTOIRE" : "ÉCHEC";
    ar.appendChild(b);
    if(win) burstEl(ar, {n:26, spread:140, colors:["#35f0d6","#ffc857","#ffffff"], dur:900});
    setTimeout(()=>b.remove(), 1400);
  }
  renderArena();
  const cb = BATTLE.onEnd;
  setTimeout(()=>{ if(cb) cb(win); }, 900);
}

/* ---------- retours visuels ---------- */
function popDamage(target, dmg, eff, color){
  const host = document.getElementById("arena"); if(!host) return;
  const heal = dmg < 0;
  const d = document.createElement("div");
  d.className = "dmgpop" + (eff >= 2 ? " big" : "");
  d.textContent = (heal ? "+" : "-") + Math.abs(dmg);
  d.style.color = color || (heal ? "var(--green)" : eff >= 2 ? "var(--amber)"
                  : eff < 1 ? "var(--ink3)" : "var(--magenta)");
  if(target === "foe"){ d.style.right = "46px"; d.style.top = "52px"; }
  else { d.style.left = "46px"; d.style.bottom = "86px"; }
  host.appendChild(d);
  if(!heal){
    const sp = document.getElementById(target === "foe" ? "spr-foe" : "spr-ally");
    if(sp){ sp.classList.add("hit"); setTimeout(()=>sp.classList.remove("hit"), 320); }
  }
  setTimeout(()=>d.remove(), 860);
}
function lungeSprite(side){
  const sp = document.getElementById(side === "a" ? "spr-ally" : "spr-foe");
  if(!sp) return;
  sp.classList.add(side === "a" ? "lunge-up" : "lunge-down");
  setTimeout(()=>sp.classList.remove("lunge-up","lunge-down"), 300);
}
function flashSprite(target, color){
  const sp = document.getElementById(target === "foe" ? "spr-foe" : "spr-ally");
  if(!sp) return;
  sp.style.filter = `drop-shadow(0 0 14px ${color})`;
  setTimeout(()=>{ sp.style.filter = ""; }, 420);
}
function flashArena(color, dur){
  const host = document.getElementById("arena"); if(!host) return;
  const f = document.createElement("div");
  f.className = "arena-flash";
  f.style.background = `radial-gradient(closest-side, ${color}, transparent 72%)`;
  host.appendChild(f);
  setTimeout(()=>f.remove(), dur || 300);
}

/* ---------- changement d'équipier ---------- */
function doSwitch(i){
  if(!BATTLE || BATTLE.over || BATTLE.busy || BATTLE.ai) return;
  const n = BATTLE.allies[i];
  if(!n || n.hp <= 0 || i === BATTLE.a) return;
  closeSheet();
  blog(`<b class="cy">${esc(n.name)}</b> prend le relais.`);
  BATTLE.a = i;
  renderArena();
  setTimeout(()=>doTurn(0, true), 260);
}
ACTIONS.bswitch = () => {
  if(!BATTLE || BATTLE.over || BATTLE.busy) return;
  sheet(`${sheetHead("Changer d'équipier")}
    <div class="tiny muted" style="margin-bottom:9px">Le changement consomme votre tour :
      l'adversaire agira avant votre nouveau Pokémon.</div>
    <div class="list">
      ${BATTLE.allies.map((f,i)=>`
        <div class="item ${i===BATTLE.a?"on":""}" ${f.hp>0&&i!==BATTLE.a?`data-act="bswitchdo" data-i="${i}"`:""}
          style="${f.hp<=0?"opacity:.4":""}">
          <span class="sprbox" style="width:40px;height:40px">${sprite(f.id, f.shiny, "")}</span>
          <div class="grow"><div class="t">${esc(f.name)} <span class="dim tiny">N.${f.level}</span>
            ${f.status?`<span class="stbadge" style="--sc:${STATUS[f.status.k].c}">${STATUS[f.status.k].ab}</span>`:""}</div>
            <div class="bar hp ${hpCls(f)}" style="margin-top:4px"><i style="width:${f.hp/f.maxHp*100}%"></i></div>
            <div class="tiny dim mono-num">${f.hp} / ${f.maxHp}</div></div>
          ${i===BATTLE.a?'<span class="tiny cy">en jeu</span>':f.hp<=0?'<span class="tiny bad">hors ligne</span>':ic("arrow")}
        </div>`).join("")}
    </div>`);
};
ACTIONS.bswitchdo = d => doSwitch(+d.i);

function hpCls(f){ const r = f.hp/f.maxHp; return r > .5 ? "" : r > .2 ? "mid" : "low"; }

function statusBadge(f){
  if(!f.status) return "";
  const st = STATUS[f.status.k];
  return `<span class="stbadge" style="--sc:${st.c}" title="${esc(st.d)}">${st.ab}</span>`;
}
function talentMark(f){
  return f.talent ? `<span class="talmark" title="${esc(f.talent.d)}">${esc(f.talent.n)}</span>` : "";
}
function buffMarks(f){
  const up = [];
  if(f.buff.atk > 1.05) up.push("ATQ");
  if(f.buff.def > 1.05) up.push("DEF");
  if(f.buff.spe > 1.05) up.push("VIT");
  return up.length ? `<span class="buffmark">${up.join(" ")}</span>` : "";
}
function renderArena(){
  const host = document.getElementById("arena");
  if(!host || !BATTLE) return;
  const A = activeAlly(), F = activeFoe();
  const foesLeft = BATTLE.foes.filter(x=>x.hp>0).length;
  host.innerHTML = `
    <div class="arena-bg"></div>
    <div class="arena-pad foe-pad"></div>
    <div class="arena-pad ally-pad"></div>

    <div class="side foe">
      <div class="nmplate">
        <div class="row between">
          <span>${esc(F.name)} ${statusBadge(F)}</span>
          <span class="dim">N.${F.level}</span>${talentMark(F)}
        </div>
        <div class="bar hp ${hpCls(F)}"><i style="width:${F.hp/F.maxHp*100}%"></i></div>
        <div class="row between tiny dim mono-num">
          <span>${buffMarks(F)}</span>
          <span>${F.hp} / ${F.maxHp}</span>
        </div>
      </div>
      <div id="spr-foe" class="combatant">${sprite(F.id, F.shiny, "", {anim:true, eager:true})}</div>
      ${BATTLE.foes.length>1?`<div class="foecount">${foesLeft} / ${BATTLE.foes.length}</div>`:""}
    </div>

    <div class="side ally">
      <div id="spr-ally" class="combatant back">${sprite(A.id, A.shiny, "", {anim:true, eager:true, back:true})}</div>
      <div class="nmplate">
        <div class="row between">
          <span>${esc(A.name)} ${statusBadge(A)}</span>
          <span class="dim">N.${A.level}</span>${talentMark(A)}
        </div>
        <div class="bar hp ${hpCls(A)}"><i style="width:${A.hp/A.maxHp*100}%"></i></div>
        <div class="row between tiny dim mono-num">
          <span>${buffMarks(A)}</span>
          <span>${A.hp} / ${A.maxHp}</span>
        </div>
      </div>
    </div>

    ${BATTLE.over ? `<div class="turnflag done">COMBAT TERMINÉ</div>` : `<div class="turnflag ${BATTLE.busy?"wait":""}">
      ${BATTLE.ai ? "COMBAT AUTOMATIQUE" : (BATTLE.busy ? "RÉSOLUTION" : "À VOUS")}</div>`}
    ${BATTLE.phase===2?`<div class="phasetag">PHASE 2</div>`:""}`;

  const ctl = document.getElementById("moves");
  if(ctl && !BATTLE.ai){
    ctl.innerHTML = BATTLE.over ? "" : A.moves.map((m,i)=>{
      if(m.util){
        const what = m.st ? STATUS[m.st].n : m.heal ? "Soin" : "Renfort";
        return `<button class="btn sm mv util" data-act="move" data-i="${i}" ${BATTLE.busy?"disabled":""}>
          <span class="tt t${m.type}">${TYPE_NAMES[m.type]}</span>
          <span class="mv-n">${esc(m.name)}</span>
          <span class="mv-x dim">${what}</span></button>`;
      }
      const e = typeMult(m.type, F.types);
      const cls = e >= 2 ? "sup" : e === 0 ? "nul" : e < 1 ? "weak" : "";
      const tag = e >= 2 ? "×"+e : e === 0 ? "×0" : e < 1 ? "×"+e : "";
      return `<button class="btn sm mv ${cls}" data-act="move" data-i="${i}" ${BATTLE.busy?"disabled":""}>
        <span class="tt t${m.type}">${TYPE_NAMES[m.type]}</span>
        <span class="mv-n">${esc(m.name)}</span>
        <span class="mv-x">${tag}</span></button>`;
    }).join("");
  }
  const team = document.getElementById("battle-team");
  if(team) team.innerHTML = teamStrip(BATTLE.allies);
}
function teamStrip(list){
  return list.map((f,i)=>`<div class="tmem ${f.hp<=0?"ko":""} ${BATTLE&&i===BATTLE.a?"active":""}">
    <span class="lv">${f.level}</span>
    <span class="sprbox" style="width:40px;height:40px">${sprite(f.id, f.shiny, "")}</span>
    <div class="nm">${esc(f.name)}</div>
    <div class="bar hp ${hpCls(f)}"><i style="width:${Math.max(0,f.hp/f.maxHp*100)}%"></i></div>
    ${f.status?`<span class="stbadge tiny" style="--sc:${STATUS[f.status.k].c}">${STATUS[f.status.k].ab}</span>`:""}
  </div>`).join("");
}
ACTIONS.move = d => doTurn(+d.i);

/* ============================================================
   SELECTION D'EQUIPE
   ============================================================ */
function ownedSorted(){
  return Object.keys(S.dex).map(Number).sort((a,b)=>{
    const ea = S.dex[a], eb = S.dex[b];
    return (POKE[b].bst * (1+eb.lvl/100)) - (POKE[a].bst * (1+ea.lvl/100));
  });
}
function teamFighters(ids, boost){
  return ids.filter(id=>S.dex[id]).map(id=>makeFighter(id, S.dex[id].lvl, {shiny:S.dex[id].shiny, boost:boost||1}));
}
/* ---------- sélecteur d'équipe ----------
   Recherche par nom, ordre explicite, retrait d'un geste. L'ordre compte :
   le premier de la liste entre en jeu, les suivants prennent le relais. */
let TP = null;
function teamPicker(title, max, onConfirm, preset){
  TP = {
    sel: (preset || S.team.slice(0, max)).filter(id=>S.dex[id]),
    max, title, onConfirm, q: "", sort: "power"
  };
  drawTeamPicker();
}
function tpPool(){
  const q = TP.q.trim().toLowerCase();
  let ids = Object.keys(S.dex).map(Number);
  if(q) ids = ids.filter(id=>POKE[id].name.toLowerCase().includes(q)
                          || String(id).padStart(3,"0").includes(q));
  const sorters = {
    power: (a,b)=>(POKE[b].bst*(1+S.dex[b].lvl/100)) - (POKE[a].bst*(1+S.dex[a].lvl/100)),
    level: (a,b)=>S.dex[b].lvl - S.dex[a].lvl,
    num:   (a,b)=>a-b,
    name:  (a,b)=>POKE[a].name.localeCompare(POKE[b].name)
  };
  return ids.sort(sorters[TP.sort] || sorters.power);
}
function drawTeamPicker(){
  const pool = tpPool();
  const full = TP.sel.length >= TP.max;
  sheet(`${sheetHead(TP.title)}
    <div class="tiny muted" style="margin-bottom:8px">
      L'ordre compte : le premier entre en jeu, les autres prennent le relais.
      Touchez une flèche pour le déplacer.</div>

    <div class="tp-sel">
      ${TP.sel.length ? TP.sel.map((id,i)=>`
        <div class="tp-row">
          <span class="tp-pos">${i+1}</span>
          <span class="sprbox" style="width:38px;height:38px">${sprite(id, S.dex[id].shiny, "")}</span>
          <div class="grow">
            <div class="tiny">${esc(POKE[id].name)}</div>
            <div class="wrap" style="gap:3px;margin-top:2px">${typeTags(POKE[id].types)}
              <span class="tt t1">N.${S.dex[id].lvl}</span></div>
          </div>
          <div class="tp-ord">
            <button class="tp-b" data-act="tpmove" data-i="${i}" data-d="-1" ${i===0?"disabled":""}>▲</button>
            <button class="tp-b" data-act="tpmove" data-i="${i}" data-d="1" ${i===TP.sel.length-1?"disabled":""}>▼</button>
          </div>
          <button class="tp-x" data-act="tpdel" data-i="${i}" aria-label="Retirer">${ic("cross")}</button>
        </div>`).join("")
        : `<div class="empty" style="padding:16px">Aucun Pokémon sélectionné.</div>`}
      ${Array.from({length: Math.max(0, TP.max - TP.sel.length)}, ()=>
        `<div class="tp-row ghost"><span class="tp-pos">—</span>
          <div class="grow tiny dim">emplacement libre</div></div>`).join("")}
    </div>

    <button class="btn pri wide" style="margin:9px 0" data-act="tconfirm"
      ${TP.sel.length?"":"disabled"}>Valider (${TP.sel.length}/${TP.max})</button>

    <div class="row" style="gap:6px;margin-bottom:7px">
      <input id="tp-q" type="text" placeholder="Rechercher un Pokémon…" value="${esc(TP.q)}"
        oninput="tpSearch(this.value)" style="flex:1">
    </div>
    <div class="chipbar">
      ${[["power","Puissance"],["level","Niveau"],["num","Numéro"],["name","Nom"]].map(([k,n])=>
        `<button class="chip ${TP.sort===k?"on":""}" data-act="tpsort" data-s="${k}">${n}</button>`).join("")}
    </div>

    ${pool.length ? `<div class="dexgrid">
      ${pool.slice(0,80).map(id=>{
        const on = TP.sel.includes(id);
        return `<div class="dexcell owned r${POKE[id].rar} ${on?"picked":""} ${(!on&&full)?"muted-cell":""}"
            data-act="tptoggle" data-id="${id}">
          <span class="no">${S.dex[id].lvl}</span>
          ${on?`<span class="cnt">${TP.sel.indexOf(id)+1}</span>`:""}
          ${sprite(id, S.dex[id].shiny, "")}
          <span class="nm">${esc(POKE[id].name)}</span>
        </div>`;}).join("")}
      </div>`
      : `<div class="empty">Aucun Pokémon ne correspond.</div>`}`);
  const inp = document.getElementById("tp-q");
  if(inp && TP.q){ try { inp.focus(); inp.setSelectionRange(TP.q.length, TP.q.length); } catch(e){} }
}
/* la recherche ne doit pas redessiner la feuille a chaque frappe */
function tpSearch(v){
  if(!TP) return;
  TP.q = v;
  clearTimeout(TP._t);
  TP._t = setTimeout(()=>drawTeamPicker(), 180);
}
ACTIONS.tptoggle = d => {
  const id = +d.id;
  const i = TP.sel.indexOf(id);
  if(i >= 0) TP.sel.splice(i, 1);
  else if(TP.sel.length < TP.max) TP.sel.push(id);
  else { toast("Équipe complète — retirez-en un d'abord", "bad", "cross"); return; }
  drawTeamPicker();
};
ACTIONS.tpdel  = d => { TP.sel.splice(+d.i, 1); drawTeamPicker(); };
ACTIONS.tpmove = d => {
  const i = +d.i, j = i + (+d.d);
  if(j < 0 || j >= TP.sel.length) return;
  [TP.sel[i], TP.sel[j]] = [TP.sel[j], TP.sel[i]];
  drawTeamPicker();
};
ACTIONS.tpsort = d => { TP.sort = d.s; drawTeamPicker(); };
ACTIONS.tconfirm = () => {
  const sel = TP.sel.slice();
  const cb = TP.onConfirm;
  TP = null;
  closeSheet();
  S.team = sel.slice();
  saveSoon();
  cb(sel);
};

/* ============================================================
   DATA GUARDIANS
   ============================================================ */
function guardianKey(rk, id){ return rk + ":" + id; }
function guardianBeaten(rk, id){ return S.bosses.includes(guardianKey(rk, id)); }
function guardianAvailable(r, g, idx){
  if(dexCount(r.key) < g.need) return false;
  if(idx > 0 && !guardianBeaten(r.key, r.guardians[idx-1].id)) return false;
  return true;
}
function guardianLevel(r, idx){ return [30, 44, 58][idx] + (r.act-1)*18; }
function guardianBoost(r, idx){
  return (1.18 + idx*0.1 + (r.act-1)*0.06) * (cycleMod("m_tough") ? 1.3 : 1);
}
/* le bandeau tactique renforce l'equipe, pas l'adversaire */
function allyBoost(){ return heldActive("boss") ? 1.12 : 1; }

SCREENS.boss = {
  after(){ tutoMaybe("boss"); },
  html(){
    return `
      <div class="h">${ic("boss")} DATA GUARDIANS ${infoBtn("boss")}</div>
      <div class="sub">Des légendaires promus pare-feu. Ils ne peuvent pas être capturés — seulement relâchés.</div>
      ${moduleGoal("Combat tactique au tour par tour. Composez une équipe qui a l'avantage de type, et surveillez la reconfiguration à mi-vie.",
        "De gros blocs d'intégrité, une carte légendaire, et l'espèce elle-même dans votre archive.")}
      ${REGIONS.filter(r=>regionUnlocked(r.key)).map(r=>`
        <div class="panel">
          <div class="row between"><div class="h sm" style="margin:0">${esc(r.name.toUpperCase())}</div>
            <span class="tiny muted">${dexCount(r.key)} espèces archivées</span></div>
          <div class="list" style="margin-top:7px">
            ${r.guardians.map((g,i)=>{
              const beaten = guardianBeaten(r.key, g.id);
              const av = guardianAvailable(r, g, i);
              return `<div class="item ${beaten?"":""}" style="${beaten?"border-color:var(--green)":av?"border-color:var(--magenta)":""}">
                ${beaten ? sprite(g.id, false, "sm")
                  : av ? `<span class="guardsil">${sprite(g.id, false, "sm")}</span>`
                  : `<span class="guardunknown">?</span>`}
                <div class="grow">
                  <div class="t">${beaten ? esc(g.name)
                    : av ? "Signature détectée" : "Signature non détectée"}</div>
                  <div class="d">${beaten ? esc(g.title) + " · Niv." + guardianLevel(r,i)
                    : av ? "Identité inconnue · Niv." + guardianLevel(r,i)
                    : "Restaurez davantage d'espèces pour la détecter"}</div>
                  ${beaten?`<div class="tiny ok">Verrou levé</div>`
                    : av?`<div class="tiny bad">Verrou actif</div>`
                    : `<div class="tiny muted">Requiert ${g.need} espèces de ${r.name}</div>`}
                </div>
                <button class="btn sm ${av&&!beaten?"dan":""}" data-act="bossgo" data-r="${r.key}" data-i="${i}"
                  ${av?"":"disabled"}>${beaten?"Rejouer":"Affronter"}</button>
              </div>`;}).join("")}
          </div>
        </div>`).join("")}
      <div class="panel">
        <div class="h sm">OBJETS DE COMBAT</div>
        <div class="row between tiny"><span>Restauration (soigne 55%)</span><b>${S.items.potion||0}</b></div>
        <div class="row between tiny"><span>Réindexation (réanime)</span><b>${S.items.revive||0}</b></div>
        <div class="tiny muted" style="margin-top:4px">Disponibles en boutique, catégorie Objets.</div>
      </div>
      <button class="btn ghost wide" data-act="goto" data-to="modules">Retour aux modules</button>`;
  }
};
ACTIONS.bossgo = d => {
  const r = regionDef(d.r), i = +d.i, g = r.guardians[i];
  if(!guardianAvailable(r, g, i)) return;
  pzFlash(pzLine("boss"));
  teamPicker(`Équipe contre ${g.name}`, 3, ids=>{
    if(!ids.length) return;
    startGuardian(r, i, ids);
  });
};

function startGuardian(r, i, ids){
  const g = r.guardians[i];
  const allies = teamFighters(ids, allyBoost());
  const foe = makeFighter(g.id, guardianLevel(r, i), {boost: guardianBoost(r, i)});
  foe.name = g.name;
  S.daily.dayBoss++; questTick("dayBoss",1);
  createBattle(allies, [foe], {
    title: g.title,
    intro: `<span class="bad">${esc(g.name)}</span> maintient le verrou du secteur ${esc(r.name)}.`,
    boss: g,
    onEnd: win => onGuardianEnd(r, i, win)
  });
  go("battle", {mode:"boss", region:r.key, idx:i});
}

function onGuardianEnd(r, i, win){
  const g = r.guardians[i];
  if(win){
    const first = !guardianBeaten(r.key, g.id);
    if(first){ S.bosses.push(guardianKey(r.key, g.id)); factionPts(50); }
    S.stats.bossWins++;
    const lvl = guardianLevel(r, i);
    if(first){
      addToDex(g.id, lvl, false);
      addIntegrity(g.core ? 5 : 2.5);
      /* un noyau emet une illustration ancienne : c'est la recompense de prestige */
      const cs = rollCardSeries(g.id, g.core ? 3.2 : 1.8);
      const cNew = grantCardV(cs, g.id);
      gain("cores", g.core ? 4 : 2);
    } else addIntegrity(0.4);
    const fw = consumeFirstWin("boss");
    gain("coins", Math.round((900 + lvl*30) * fw));
    gain("shards", Math.round((40 + i*20) * fw));
    addXp(Math.round((400 + lvl*10) * fw));
    save();
    sheet(`<div class="center">
      <div class="h">VERROU LEVÉ</div>
      <span class="sprbox" style="width:132px;height:132px;margin:0 auto">${sprite(g.id, false, "", {anim:true, eager:true})}<i class="sprshadow"></i></span>
      <div style="font-size:15px">${esc(g.name)}</div>
      <div class="tiny muted" style="margin-bottom:7px">${esc(g.title)}</div>
      ${first?`<div class="panel" style="text-align:left">
        <div class="tiny ok">Entité restaurée et ajoutée à votre archive.</div>
        <div class="tiny">Carte émise : <b style="color:${CARD_SERIES_DEF[cs].c}">${esc(seriesName(cs))}</b>
          ${cNew?"":' <span class="dim">(doublon)</span>'}</div>
        <div class="tiny">Intégrité : <b class="ok">+${g.core?5:2.5}%</b></div>
      </div>`:`<div class="tiny muted">Verrou déjà levé — récompenses réduites.</div>`}
      <button class="btn pri wide" data-act="bossdone">Continuer</button></div>`, true);
    checkAchievements();
    guideTick();
  } else {
    if(!S.story.includes("pz_first_guardian_fail")) S.flags.guardFail = true;
    sheet(`<div class="center"><div class="h" style="color:var(--magenta)">ÉCHEC DE L'ASSAUT</div>
      <div class="tiny muted" style="margin:8px 0">Le verrou tient. Votre équipe est renvoyée au tampon.</div>
      <div class="tiny">Montez le niveau de vos Pokémon en expédition, ou ramenez une équipe
        avec un meilleur avantage de type.</div>
      <button class="btn wide" style="margin-top:9px" data-act="bossdone">Retour</button></div>`, true);
  }
}
ACTIONS.bossdone = () => { closeSheet(); BATTLE = null; if(!checkStoryTriggers()) go("boss"); };

/* ecran de combat generique */
SCREENS.battle = {
  html(arg){
    if(!BATTLE) return `<div class="panel">Aucun combat en cours.</div>`;
    return `
      <div class="row between" style="margin-bottom:6px">
        <div class="h" style="margin:0">${esc(BATTLE.title)} ${infoBtn("combat")}</div>
        ${BATTLE.ai?`<button class="btn sm ${BATTLE.speed<=1?"pri":"ghost"}" data-act="bspeed">
          ${ic("idle")} Vitesse ×${BATTLE.speed}</button>`:""}
      </div>
      <div id="arena"></div>
      <div id="moves" class="btn-grid c2" style="margin-top:8px"></div>
      ${BATTLE.ai?"":`<div class="btn-grid c3" style="margin-top:7px">
        <button class="btn sm" data-act="useitem" data-k="potion">Restauration ${S.items.potion||0}</button>
        <button class="btn sm" data-act="useitem" data-k="revive">Réindexation ${S.items.revive||0}</button>
        <button class="btn sm" data-act="bswitch">Changer</button>
      </div>`}
      <div class="team-strip" id="battle-team" style="margin-top:8px"></div>
      <div id="log"></div>
      ${BATTLE && BATTLE.over ? `<button class="btn pri wide" style="margin-top:9px"
        data-act="battleout">Quitter le combat</button>` : ""}`;
  },
  after(){
    renderArena();
    const el = document.getElementById("log");
    if(el && BATTLE) el.innerHTML = BATTLE.log.map(t=>`<div>${t}</div>`).join("");
    if(BATTLE && BATTLE.ai && !BATTLE.over && !BATTLE.busy) setTimeout(()=>doTurn(0), 500);
  }
};
/* sortie de secours : si la feuille de fin a ete fermee ou remplacee,
   le joueur doit pouvoir quitter l'ecran sans recharger la page. */
ACTIONS.battleout = () => {
  const b = BATTLE;
  BATTLE = null;
  closeSheet();
  go(b && b.expedition ? "expedition" : "boss");
};
ACTIONS.bspeed = () => {
  const order = [0.5, 1, 2, 4];
  const i = order.indexOf(BATTLE.speed);
  BATTLE.speed = order[(i + 1) % order.length];
  S.settings.battleSpeed = BATTLE.speed;
  saveSoon(); renderArena(); refresh();
};
ACTIONS.useitem = d => {
  if(!BATTLE || BATTLE.over || BATTLE.busy) return;
  const k = d.k;
  if((S.items[k]||0) <= 0){ toast("Aucun objet de ce type", "bad", "cross"); return; }
  if(k === "potion"){
    const A = activeAlly();
    if(A.hp >= A.maxHp){ toast("Déjà au maximum", "bad", "cross"); return; }
    S.items.potion--;
    A.hp = Math.min(A.maxHp, A.hp + Math.floor(A.maxHp*0.55));
    blog(`<span class="ok">${esc(A.name)} est restauré.</span>`);
  } else {
    const ko = BATTLE.allies.find(x=>x.hp <= 0);
    if(!ko){ toast("Aucun Pokémon désindexé", "bad", "cross"); return; }
    S.items.revive--;
    ko.hp = Math.floor(ko.maxHp*0.5);
    blog(`<span class="ok">${esc(ko.name)} est réindexé.</span>`);
  }
  saveSoon(); renderArena(); refresh();
  setTimeout(()=>doTurn(0), 300);
};
