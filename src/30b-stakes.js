/* ============================================================
   30b — LA CAPTURE AVEC ENJEU
   Trois cents captures dans la première demi-heure, toujours le
   même geste : il manquait une raison de retenir son souffle.

   · LA CAGNOTTE DE CHAÎNE — chaque capture verse une part de ses
     PokéCoins dans une cagnotte, d'autant plus grosse que la série
     dure (×1,5 dès 10, ×2 dès 25, ×3 dès 50). Encaisser la vide
     et remet son multiplicateur à zéro ; une fuite la fait perdre.
     Continuer, ou encaisser ?
   · LES HORDES — parfois, une espèce arrive en groupe : trois à
     cinq à la suite, plus faciles à capturer, et une prime si on
     les attrape toutes.
   · LA TRAQUE — chaque semaine, un légendaire erre dans une
     région. Ses traces apparaissent en capturant ; à cinq traces,
     il se montre. Une seule balle : s'il s'échappe, il faut
     retrouver sa piste.
   ============================================================ */

/* ---------- la cagnotte ---------- */
const POT_TIERS = [[50, 3], [25, 2], [10, 1.5], [0, 1]];
function potState(){ S.pot = S.pot || {v:0, n:0}; return S.pot; }
function potMul(n){ for(const [k, m] of POT_TIERS) if(n >= k) return m; return 1; }
function potAdd(coins){
  if(!(coins > 0) || S.capMode === "fish") return;
  const P = potState();
  P.n++;
  P.v += Math.round(coins * 0.35);
  const m = potMul(P.n), prev = potMul(P.n - 1);
  if(m > prev && typeof banner === "function") banner({kicker:"CAGNOTTE DE CHAÎNE", title:`Multiplicateur ×${String(m).replace(".", ",")}`, sub:`${fmt(Math.round(P.v * m))} PokéCoins à encaisser — ou continuer, au risque de tout perdre`, icon:"coin", c:"#ffd24a", sfx:"coin", dur:2600});
}
function potLose(){
  const P = potState();
  if(P.v > 0){
    const lost = Math.round(P.v * potMul(P.n));
    S.stats.potLost = (S.stats.potLost || 0) + lost;
    setTimeout(()=>toast(`Cagnotte perdue : ${fmt(lost)} PokéCoins`, "bad", "coin"), 300);
  }
  P.v = 0; P.n = 0;
}
ACTIONS.potcash = () => {
  const P = potState();
  if(!(P.v > 0)) return;
  const m = potMul(P.n), total = Math.round(P.v * m);
  gain("coins", total);
  S.stats.potCashed = (S.stats.potCashed || 0) + total;
  S.stats.potBest = Math.max(S.stats.potBest || 0, total);
  P.v = 0; P.n = 0;
  try { Sfx.coin(); setTimeout(()=>Sfx.coin(), 120); setTimeout(()=>Sfx.coin(), 240); } catch(e){}
  buzz([10, 30, 10, 30, 10]);
  if(total >= 3000 && typeof banner === "function") banner({kicker:"CAGNOTTE ENCAISSÉE", title:`+${fmt(total)} PokéCoins`, sub:m > 1 ? `Multiplicateur ×${String(m).replace(".", ",")}` : "", icon:"coin", c:"#ffd24a", sfx:"coin", dur:2400});
  else toast(`Cagnotte encaissée : +${fmt(total)} PokéCoins`, "warn", "coin");
  save(); refresh();
};
function potHtml(){
  if(S.capMode === "fish" || S.level < 3) return "";
  const P = potState(), m = potMul(P.n), nx = POT_TIERS.slice().reverse().find(([k])=>k > P.n);
  return `<div class="potbox ${P.v ? "on" : ""} m${String(m).replace(".", "")}">
    <span class="pot-ic">${ic("coin")}</span>
    <div class="grow"><small>CAGNOTTE DE CHAÎNE · ×${String(m).replace(".", ",")}</small>
      <b class="mono-num">${fmt(Math.round(P.v * m))}</b>
      <em>${nx ? `×${String(nx[1]).replace(".", ",")} dans ${nx[0] - P.n} capture${nx[0] - P.n > 1 ? "s" : ""} · une fuite et tout est perdu` : "Multiplicateur au maximum · une fuite et tout est perdu"}</em></div>
    <button class="btn sm ${P.v ? "gold" : ""}" data-act="potcash" ${P.v ? "" : "disabled"}>Encaisser</button>
  </div>`;
}

/* ---------- les hordes ---------- */
let HORDE = null;
const HORDE_CHANCE = 0.05;
/* ---------- la traque ---------- */
const ROAMERS = {kanto:[145], johto:[244, 245], hoenn:[380, 381]};
const ROAM_TRACES = 5;
function roamWeek(){ return typeof evWeekIndex === "function" ? evWeekIndex() : Math.floor(Date.now() / (7 * 86400e3)); }
function roamState(){
  S.roam = S.roam || {};
  const R = S.roam, wk = roamWeek();
  if(R.wk !== wk){
    const pool = [];
    for(const r of REGIONS) if(regionUnlocked(r.key)) for(const id of ROAMERS[r.key] || []) pool.push({id, region:r.key});
    const p = pool.length ? pool[((wk % pool.length) + pool.length) % pool.length] : {id:145, region:"kanto"};
    Object.assign(R, {wk, id:p.id, region:p.region, traces:0, caught:false, ready:false});
  }
  return R;
}
function roamTrace(){
  const R = roamState();
  if(R.caught || R.ready || S.region !== R.region || S.capMode === "fish" || S.level < 8) return;
  if(rng() >= 0.035) return;
  R.traces++;
  if(R.traces >= ROAM_TRACES){ R.ready = true; R.traces = ROAM_TRACES; }
  saveSoon();
  if(typeof banner === "function") banner(R.ready
    ? {kicker:"LA TRAQUE", title:`${POKE[R.id].name} est tout près !`, sub:"La prochaine rencontre de cette région, c'est lui. Une seule balle : vise juste.", spr:R.id, c:"#ff8a3d", dur:4200}
    : {kicker:"LA TRAQUE", title:`Une trace de ${POKE[R.id].name}`, sub:`${R.traces} / ${ROAM_TRACES} — il erre dans ${regionDef(R.region).name} cette semaine`, icon:"eye", c:"#ff8a3d", dur:2600});
}
function roamHtml(){
  if(S.capMode === "fish" || S.level < 8) return "";
  const R = roamState();
  if(R.caught) return "";
  const known = monFound(R.id);
  return `<div class="roambox ${R.ready ? "ready" : ""}" data-act="roaminfo">
    <span class="roam-spr ${R.ready ? "" : "sil"}">${sprite(R.id, false, "")}</span>
    <div class="grow"><small>LA TRAQUE · CETTE SEMAINE</small>
      <b>${known || R.ready ? esc(POKE[R.id].name) : "Un légendaire errant"} · ${esc(regionDef(R.region).name)}</b>
      <span class="roam-tr">${Array.from({length:ROAM_TRACES}, (_, i)=>`<i class="${i < R.traces ? "on" : ""}"></i>`).join("")}</span></div>
  </div>`;
}
ACTIONS.roaminfo = () => {
  const R = roamState();
  sheet(`${sheetHead("La traque")}
    <div class="tiny">Chaque semaine, un légendaire erre dans une région. En capturant dans <b>${esc(regionDef(R.region).name)}</b>, tu trouveras parfois une de ses traces.</div>
    <div class="tiny" style="margin-top:6px">À ${ROAM_TRACES} traces, il se montre : c'est la rencontre suivante. <b>Une seule balle</b> — s'il s'échappe, il reste deux traces et il faut le retrouver.</div>
    <div class="tiny dim" style="margin-top:6px">Traces : ${R.traces} / ${ROAM_TRACES}. Un autre légendaire prendra sa place lundi.</div>`);
};

/* ---------- les crochets dans la capture ---------- */
if(typeof newEncounter === "function"){
  const _ne = newEncounter;
  newEncounter = function(force){
    /* la traque d'abord : il attend dans sa région */
    const R = roamState();
    if(!force && R.ready && !R.caught && S.region === R.region && S.capMode !== "fish"){
      HORDE = null;
      ENC = {id:R.id, level:clamp(30 + regionDef(R.region).act * 12, 5, 100), shiny:rng() < shinyOdds(), rar:5, attempts:0, roam:true, featured:false, fleeing:false};
      saveSoon();
      return ENC;
    }
    if(!force && HORDE && HORDE.left > 0){
      HORDE.left--;
      const r = _ne({id:HORDE.id, rar:POKE[HORDE.id].rar});
      if(ENC) ENC.horde = {i:HORDE.total - HORDE.left, n:HORDE.total};
      return r;
    }
    HORDE = null;
    const r = _ne.apply(this, arguments);
    if(!force && ENC && !ENC.missing && !ENC.shiny && ENC.rar <= 2 && S.level >= 6 && S.capMode !== "fish" && rng() < HORDE_CHANCE){
      const n = 3 + Math.floor(rng() * 3);
      HORDE = {id:ENC.id, total:n, left:n - 1, got:0};
      ENC.horde = {i:1, n};
    }
    return r;
  };
}
if(typeof catchChance === "function"){
  const _cc = catchChance;
  catchChance = function(ballKey){
    let c = _cc.apply(this, arguments);
    if(ENC && ENC.horde) c = Math.min(0.98, c * 1.15);
    /* traqué pendant des jours : il est fatigué, mais une seule balle */
    if(ENC && ENC.roam) c = Math.min(0.9, c * 2.5);
    return c;
  };
}
if(typeof fleeChance === "function"){
  const _fc = fleeChance;
  fleeChance = function(){ return ENC && ENC.roam ? 1 : _fc.apply(this, arguments); };
}
if(typeof onCatch === "function"){
  const _oc = onCatch;
  onCatch = function(){
    const e = ENC, h = e && e.horde, roam = e && e.roam;
    const r = _oc.apply(this, arguments);
    if(roam){
      const R = roamState(); R.caught = true; R.ready = false;
      S.stats.roamCaught = (S.stats.roamCaught || 0) + 1;
      if(typeof teamCandyGain === "function") teamCandyGain(5);
      saveSoon();
    } else roamTrace();
    if(h && HORDE && HORDE.id === e.id){
      HORDE.got++;
      if(h.i >= h.n){
        const full = HORDE.got >= h.n;
        if(full){
          const bonus = 300 * h.n + S.level * 30;
          gain("coins", bonus); if(typeof teamCandyGain === "function") teamCandyGain(2);
          if(typeof banner === "function") banner({kicker:"HORDE COMPLÈTE", title:`${h.n} ${POKE[e.id].name} sur ${h.n} !`, sub:`+${fmt(bonus)} PokéCoins · +2 Bonbons d'équipe`, spr:e.id, c:"#5ce07a", sfx:"coin", dur:2600});
        }
        HORDE = null;
      }
    }
    return r;
  };
}
if(typeof onFail === "function"){
  const _of = onFail;
  onFail = function(){
    const e = ENC, roam = e && e.roam;
    const r = _of.apply(this, arguments);
    /* il s'est enfui : la horde se disperse, la traque recommence à deux traces */
    if(!ENC || ENC !== e){
      if(HORDE && e && HORDE.id === e.id){ HORDE = null; }
      if(roam){ const R = roamState(); R.ready = false; R.traces = 2; saveSoon(); setTimeout(()=>toast(`${POKE[e.id].name} s'est échappé. Il reste deux traces.`, "bad", "eye"), 500); }
    }
    return r;
  };
}
if(typeof breakStreak === "function"){
  const _bs = breakStreak;
  breakStreak = function(){ potLose(); return _bs.apply(this, arguments); };
}
/* le dessus de la scène : horde, ou légendaire errant */
function stakesTagHtml(){
  if(!ENC) return "";
  if(ENC.roam) return `<div class="stk-tag roam">LÉGENDAIRE ERRANT · UNE SEULE BALLE</div>`;
  if(ENC.horde) return `<div class="stk-tag horde">HORDE · ${ENC.horde.i} / ${ENC.horde.n} · capture facilitée</div>`;
  return "";
}
