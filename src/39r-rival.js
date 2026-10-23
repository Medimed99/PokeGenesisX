/* ============================================================
   39r — LES DRESSEURS RÉMANENTS
   Des dresseurs du fichier d'origine, restés dans les données quand
   tout s'est effacé. Ils ne peuvent rien écrire — seul l'Archiviste
   le peut — mais ils se souviennent d'avoir été des personnes, et ils
   se souviennent de toi d'un combat à l'autre.
   Retour de jeu : « ces rencontres ne sont pas du tout animées alors
   qu'elles le devraient, ça perd de sa superbe alors que c'est quelque
   chose de rare et de marquant ». Une rencontre se joue désormais comme
   dans les jeux d'origine :
     1. l'alerte : un « ! », l'écran qui sursaute ;
     2. la transition de combat : des bandes noires qui balaient l'écran ;
     3. l'écran VS : le rival entre par la droite, vous par la gauche,
        lignes de vitesse aux couleurs de ses types, VS qui frappe,
        son équipe en Poké Balls (l'as en doré) ;
     4. sa réplique, lettre par lettre, puis le choix ;
     5. relever le défi ferme l'écran en iris de Poké Ball ;
     6. au retour, le verdict : le rival vaincu chancelle, les gains
        défilent, le titre se dévoile.
   Chaque rival a désormais son portrait, son as, ses répliques, et il
   se souvient de vous : chaque victoire le rend plus fort, et paie plus.
   ============================================================ */
const RIVALS = [
  {k:"r_iris",   n:"Iris",   role:"gardienne des nappes",     cls:"cool_trainer_f", t:[11,15], title:"Plongeur d'index",  ace:131,
   intro:["Tu travailles sur mon secteur. Les nappes, c'est chez moi.", "Encore toi ? L'eau a de la mémoire, tu sais.", "Cette fois, je ne te laisserai pas remonter."],
   win:"Pas mal. L'eau finit toujours par revenir.", lose:"Reviens quand tu sauras nager."},
  {k:"r_moss",   n:"Moss",   role:"jardinier d'arborescence",  cls:"aroma_lady",     t:[12,7],  title:"Élagueur",          ace:3,
   intro:["Chut. Tu marches sur mes racines.", "Mon arborescence a poussé depuis la dernière fois.", "Une branche de trop, et je taille."],
   win:"Tu as élagué proprement. Je vais devoir replanter.", lose:"Tout repousse. Même toi, un jour."},
  {k:"r_volt",   n:"Volt",   role:"compilateur",               cls:"engineer",       t:[13,9],  title:"Survolté",          ace:82,
   intro:["Ton équipe tourne sur quelle version ? Laisse-moi vérifier.", "Recompilé, optimisé. On recommence ?", "Surtension garantie. Tu signes où ?"],
   win:"Erreur fatale de mon côté. Bien joué.", lose:"Mise à jour recommandée. Pour toi."},
  {k:"r_cendre", n:"Cendre", role:"fondeur",                   cls:"kindler",        t:[10,6],  title:"Porteur de braise", ace:59,
   intro:["Ça sent le roussi par ici. C'est moi.", "Le four est chaud. Toi aussi, j'espère.", "Je fonds ce qui me résiste. Résiste, pour voir."],
   win:"Les braises couvent. Elles reprendront.", lose:"Rien ne résiste longtemps à la fonte."},
  {k:"r_nox",    n:"Nox",    role:"veilleur de nuit",          cls:"channeler",      t:[17,8],  title:"Veilleur",          ace:94,
   intro:["Tu n'aurais pas dû capturer celui-là. Il était sous ma garde.", "La nuit se souvient de ton visage.", "Les ombres m'ont prévenu de ton arrivée."],
   win:"…L'aube vient toujours trop tôt.", lose:"Rentre avant la nuit. Elle est à moi."},
  {k:"r_ayla",   n:"Ayla",   role:"copiste draconique",        cls:"expert_f",       t:[16,14], title:"Draconologue",      ace:149,
   intro:["J'ai recopié chaque écaille de ce secteur. Toi, tu le salis.", "Mes dragons ont lu tes combats. Ils ne sont pas impressionnés.", "La dernière page de mon registre est pour toi."],
   win:"Je recopierai ce combat. Il le mérite.", lose:"Une ligne de plus dans mon registre. Rien d'autre."}
];
for(const r of RIVALS) COSMETICS["title_" + r.k] = {t:"title", n:r.title};
let RIVAL = null;
/* ce que le rival sait de vous */
function rivalRec(k){ S.rivals = S.rivals || {}; return S.rivals[k] = S.rivals[k] || {w:0, l:0, met:0}; }
function rivalLevel(rv, avg){ return clamp(avg + 2 + Math.min(12, 2 * rivalRec(rv.k).w), 5, 100); }
function rivalPrize(rv, avg){
  const w = rivalRec(rv.k).w;
  return {coins:1500 + avg * 40 + 400 * w, shards:20 + 5 * w, cores:w === 2 ? 1 : 0, first:!(S.cos.owned || []).includes("title_" + rv.k)};
}
function rivalColor(rv){ return typeof arCol === "function" ? arCol(rv.t[0]) : "#ff3d7f"; }
function rivalTick(){
  if(S.capMode === "fish" || S.level < 10 || S.team.length < 3) return false;
  if(rng() > 0.012) return false;
  RIVAL = pick(RIVALS);
  setTimeout(()=>{
    /* jamais par-dessus une autre fenêtre : le défi attendra une autre capture */
    const disc = document.getElementById("discover");
    if(sheetOpen() || (disc && /\bon\b/.test(disc.className || "")) || document.getElementById("rv")){ RIVAL = null; return; }
    rivalScene(RIVAL);
  }, 700);
  return true;
}

/* ---------- l'écran de rencontre ---------- */
function rivalScene(rv){
  const rec = rivalRec(rv.k);
  rec.met++;
  const allies = teamFighters(S.team);
  const avg = Math.round(allies.reduce((a, f)=>a + f.level, 0) / Math.max(1, allies.length));
  const prize = rivalPrize(rv, avg), lv = rivalLevel(rv, avg), C = rivalColor(rv);
  const line = rv.intro[Math.min(rv.intro.length - 1, rec.met - 1)] || rv.intro[0];
  const lead = S.team[0] || 25;
  const old = document.getElementById("rv"); if(old) old.remove();
  const el = document.createElement("div");
  el.id = "rv"; el.className = "rv";
  el.style.setProperty("--rc", C);
  el.style.setProperty("--rc2", typeof arCol === "function" ? arCol(rv.t[1] || rv.t[0]) : C);
  el.innerHTML = `
    <div class="rv-alert"><b>!</b></div>
    <div class="rv-bars">${Array.from({length:8}, (_, i)=>`<i style="--i:${i}"></i>`).join("")}</div>
    <div class="rv-stage">
      <div class="rv-top">
        <div class="rv-speed">${Array.from({length:14}, (_, i)=>`<i style="--i:${i};--y:${(i * 37) % 100}%"></i>`).join("")}</div>
        <div class="rv-trainer">${trainerArt(rv.cls, 172, "big")}</div>
        <div class="rv-plate">
          <small>DRESSEUR RÉMANENT${rec.met > 1 ? ` · RENCONTRE N°${rec.met}` : ""}</small>
          <b>${esc(rv.n.toUpperCase())}</b>
          <span>${esc(rv.role)}</span>
          <div class="rv-types">${rv.t.map(t=>`<span class="tt t${t}">${TYPE_NAMES[t]}</span>`).join("")}<em>N.${lv}</em></div>
        </div>
      </div>
      <div class="rv-vs"><span>V</span><span>S</span></div>
      <div class="rv-bot">
        <div class="rv-me">${typeof pmdCanvas === "function" ? pmdCanvas(lead, 3, 132, {shiny:!!(S.dex[lead] && S.dex[lead].shiny)}) : sprBox(lead, false, 110)}</div>
        <div class="rv-plate me">
          <small>VOUS</small>
          <b>${esc((S.name || "Archiviste").toUpperCase())}</b>
          <span>équipe de niveau ${avg}${rec.w || rec.l ? ` · ${rec.w} victoire${rec.w > 1 ? "s" : ""} contre ${esc(rv.n)}` : ""}</span>
        </div>
      </div>
      <div class="rv-balls">${[0, 1, 2].map(i=>`<span class="${i === 2 ? "ace" : ""}" style="--d:${1550 + i * 140}ms">${itemIcon("ball:" + (i === 2 ? "hyper" : "poke"), 30) || ic("ball")}</span>`).join("")}</div>
      <div class="rv-dlg"><div class="rv-who">${esc(rv.n)}</div><div class="rv-txt" id="rv-txt"></div></div>
      <div class="rv-acts">
        <div class="rv-prize">${ic("coin")} <b>${fmt(prize.coins)}</b> · ${ic("shard")} <b>${prize.shards}</b>${prize.cores ? ` · <b class="vi">+1 Noyau</b>` : ""}${prize.first ? ` · titre <b class="gold-t">« ${esc(rv.title)} »</b>` : ""}</div>
        <div class="btn-grid c2">
          <button class="btn ghost" data-act="rivalno">Refuser</button>
          <button class="btn pri" data-act="rivalgo">Relever le défi</button>
        </div>
      </div>
    </div>
    <div class="rv-iris"></div>`;
  document.body.appendChild(el);
  /* un appui pendant l'entrée la termine d'un coup */
  el.addEventListener("click", e=>{ if(!el.classList.contains("talk")){ el.classList.add("now"); rivalType(rv, line, true); e.stopPropagation(); } }, true);
  requestAnimationFrame(()=>el.classList.add("on"));
  try { Sfx.glitch(); buzz([30, 40, 60]); } catch(e){}
  try { Music.ctxOverride = "rival"; Music.sync(); } catch(e){}
  if(typeof pmdWake === "function") pmdWake();
  el._t1 = setTimeout(()=>{ try { Sfx.boss ? Sfx.boss() : Sfx.wobble(); buzz(40); } catch(e){} }, 1250);
  el._t2 = setTimeout(()=>rivalType(rv, line), 1850);
}
/* la réplique, lettre par lettre */
function rivalType(rv, line, now){
  const el = document.getElementById("rv"), tx = document.getElementById("rv-txt");
  if(!el || !tx) return;
  if(el.classList.contains("talk") && !now) return;
  el.classList.add("talk");
  clearTimeout(el._t1); clearTimeout(el._t2); clearTimeout(el._tw);
  const full = "« " + line + " »";
  if(now){ tx.textContent = full; el.classList.add("ask"); return; }
  let i = 0;
  const step = ()=>{
    if(!document.getElementById("rv")) return;
    i = Math.min(full.length, i + 2);
    tx.textContent = full.slice(0, i);
    if(i % 6 === 0) try { Sfx.click(); } catch(e){}
    if(i < full.length) el._tw = setTimeout(step, 28);
    else setTimeout(()=>{ const e2 = document.getElementById("rv"); if(e2) e2.classList.add("ask"); }, 250);
  };
  step();
}
function rivalClose(cb, iris){
  const el = document.getElementById("rv");
  if(!el){ if(cb) cb(); return; }
  clearTimeout(el._t1); clearTimeout(el._t2); clearTimeout(el._tw);
  el.classList.add(iris ? "go" : "bye");
  setTimeout(()=>{ el.remove(); if(cb) cb(); }, iris ? 620 : 420);
}
ACTIONS.rivalno = () => {
  const rv = RIVAL; RIVAL = null;
  const tx = document.getElementById("rv-txt");
  if(tx && rv) tx.textContent = "« Une autre fois, alors. Je ne serai pas loin. »";
  try { Music.ctxOverride = null; Music.sync(); } catch(e){}
  setTimeout(()=>rivalClose(), 700);
  closeSheet();
};
ACTIONS.rivalgo = () => {
  const rv = RIVAL; if(!rv) return;
  closeSheet();
  try { Sfx.wobble(); buzz([20, 30, 80]); } catch(e){}
  rivalClose(()=>rivalBattle(rv), true);
};
function rivalBattle(rv){
  const allies = teamFighters(S.team);
  const avg = Math.round(allies.reduce((a, f)=>a + f.level, 0) / Math.max(1, allies.length));
  const lv = rivalLevel(rv, avg), prize = rivalPrize(rv, avg);
  const foes = [];
  for(let i = 0; i < 3; i++){
    const pool = [];
    for(const r of unlockedRegions()) for(let j = r.from; j <= r.to; j++){
      const p = POKE[j];
      if(p && !p.leg && !isExclusive(j) && p.types.some(t=>rv.t.includes(t)) && p.bst >= 300) pool.push(j);
    }
    /* le troisième est son as, s'il est à portée */
    const ace = i === 2 && POKE[rv.ace] && unlockedRegions().some(r=>rv.ace >= r.from && rv.ace <= r.to) ? rv.ace : null;
    foes.push(makeFighter(ace || (pool.length ? pick(pool) : randInt(1, 151)), clamp(lv + (ace ? 2 : 0), 5, 100), {boost:1.05}));
  }
  try { Music.ctxOverride = null; } catch(e){}
  createBattle(allies, foes, {
    ai: true, speed: S.settings.battleSpeed || 1, title: rv.n.toUpperCase(), stage: "elite",
    intro: `${rv.n} envoie ${foes[0].name} !`,
    onEnd: win => {
      const rec = rivalRec(rv.k);
      S.stats.rivals = (S.stats.rivals || 0) + (win ? 1 : 0);
      if(win){
        rec.w++;
        gain("coins", prize.coins); gain("shards", prize.shards);
        if(prize.cores) gain("cores", prize.cores);
        if(prize.first) unlockCosmetic("title_" + rv.k);
      } else rec.l++;
      save(); checkAchievements();
      setTimeout(()=>rivalVerdict(rv, win, prize), 450);
    }
  });
  go("battle");
}
/* ---------- le verdict ---------- */
function rivalVerdict(rv, win, prize){
  const old = document.getElementById("rv"); if(old) old.remove();
  const C = rivalColor(rv);
  const el = document.createElement("div");
  el.id = "rv"; el.className = "rv verdict " + (win ? "won" : "lost");
  el.style.setProperty("--rc", C);
  el.innerHTML = `
    <div class="rv-stage">
      <div class="rv-top">
        <div class="rv-speed">${Array.from({length:10}, (_, i)=>`<i style="--i:${i};--y:${(i * 41) % 100}%"></i>`).join("")}</div>
        <div class="rv-trainer">${trainerArt(rv.cls, 172, "big")}</div>
        <div class="rv-plate">
          <small>${win ? "DÉFI REMPORTÉ" : "DÉFI PERDU"}</small>
          <b>${esc(rv.n.toUpperCase())}</b>
          <span>${esc(rv.role)}</span>
        </div>
      </div>
      <div class="rv-dlg"><div class="rv-who">${esc(rv.n)}</div><div class="rv-txt">« ${esc(win ? rv.win : rv.lose)} »</div></div>
      ${win ? `<div class="rv-gains">
        <div style="--d:500ms">${ic("coin")}<b class="gold-t">+${fmt(prize.coins)}</b><small>PokéCoins</small></div>
        <div style="--d:700ms">${ic("shard")}<b class="cy">+${prize.shards}</b><small>Fragments</small></div>
        ${prize.cores ? `<div style="--d:900ms">${ic("core")}<b class="vi">+1</b><small>Noyau</small></div>` : ""}
      </div>
      ${prize.first ? `<div class="rv-title" style="--d:1200ms"><small>TITRE DÉBLOQUÉ</small><b>${esc(rv.title)}</b></div>` : ""}`
      : `<div class="tiny muted center" style="margin:10px 0">Rien n'est perdu. ${esc(rv.n)} repassera — et vous serez prêt.</div>`}
      <div class="rv-acts"><button class="btn pri wide" data-act="rivalback">Reprendre</button></div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("on", "talk", "ask"));
  try { win ? Sfx.win() : Sfx.lose(); } catch(e){}
}
ACTIONS.rivalback = () => { RIVAL = null; rivalClose(()=>go("capture")); };
