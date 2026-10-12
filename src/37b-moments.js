/* ============================================================
   37b — LES MOMENTS
   Entre la cinematique (longue, rare) et le toast (oubliable), il
   manquait le moment : deux secondes plein ecran qui marquent un
   cap. Une salle qui s'ouvre, une strate atteinte, une aile de la
   Tour franchie, un verrou qui cede, un Pokemon qui se reveille
   dans la roche. On peut toujours le passer d'un toucher.

   Cinq mises en scene, chacune avec son geste :
     door     deux battants s'ouvrent sur une lumiere (nouvelle salle)
     depth    les couches defilent vers le haut (nouvelle strate)
     wing     un etendard se deploie (aile de la Tour)
     release  une silhouette se colore et monte dans la lumiere (verrou)
     awake    un Pokemon endormi s'ebroue (paroi du Forage)
     page     une page de journal tombe en tournoyant (les onze)
   ============================================================ */
const MOMENT_Q = [];
let MOMENT_ON = null;

function momentBusy(){
  if(typeof CINE !== "undefined" && CINE && !CINE.dead) return true;
  const d = document.getElementById("discover");
  if(d && /\bon\b/.test(d.className || "")) return true;
  if(typeof xsOpenNow === "function" && xsOpenNow()) return true;
  const b = document.getElementById("boot");
  if(b && b.style && b.style.display === "flex") return true;
  return false;
}
/* m : {kind, kicker, title, sub, c, spr, shiny, item, line, dur, band} */
function moment(m, now){
  if(now && !MOMENT_ON && !momentBusy()) { momentShow(m); return; }
  MOMENT_Q.push(m);
  momentFlush();
}
function momentFlush(){
  if(MOMENT_ON || !MOMENT_Q.length || momentBusy()) return false;
  momentShow(MOMENT_Q.shift());
  return true;
}
function momentShow(m){
  const box = document.getElementById("moment");
  if(!box || !box.style) return;
  MOMENT_ON = m;
  const c = m.c || "#35f0d6";
  const art = m.spr ? `<span class="mo-spr">${sprite(m.spr, !!m.shiny, "", {anim:true, eager:true})}</span>`
    : m.item ? `<span class="mo-item">${itemIcon(m.item, 64) || ic(m.icon || "star")}</span>`
    : m.icon ? `<span class="mo-ic">${ic(m.icon)}</span>` : "";
  const band = m.kind === "depth" ? `<div class="mo-bands">${(m.band || [c, c, c]).concat(m.band || []).map((b, i)=>`<i style="background:${b};--i:${i}"></i>`).join("")}</div>` : "";
  const door = m.kind === "door" ? `<div class="mo-door l"></div><div class="mo-door r"></div>` : "";
  const rays = (m.kind === "release" || m.kind === "door" || m.kind === "wing") ? `<div class="mo-rays"></div>` : "";
  const page = m.kind === "page" ? `<div class="mo-paper"><i></i><i></i><i></i><i></i><i></i></div>` : "";
  const zz = m.kind === "awake" ? `<div class="mo-zz"><i>z</i><i>z</i><i>Z</i></div>` : "";
  box.className = "on k-" + m.kind;
  box.style.setProperty("--mc", c);
  box.innerHTML = `${band}${rays}<div class="mo-glow"></div>${door}
    <div class="mo-in">
      ${m.kicker ? `<div class="mo-kick">${esc(m.kicker)}</div>` : ""}
      <div class="mo-art">${page || art}${zz}</div>
      <div class="mo-title">${esc(m.title || "")}</div>
      ${m.sub ? `<div class="mo-sub">${esc(m.sub)}</div>` : ""}
      ${m.line ? `<div class="mo-line">${typeof pzFace === "function" ? pzFace(m.lineMood || "Happy", 26) : ""}<span>${esc(typeof pzFmt === "function" ? pzFmt(m.line) : m.line)}</span></div>` : ""}
      ${m.quote ? `<div class="mo-quote">« ${esc(m.quote)} »</div>` : ""}
    </div>
    <div class="mo-skip">${esc(m.tapText || "toucher pour continuer")}</div>`;
  try { ({door:()=>Sfx.win(), depth:()=>Sfx.win(), wing:()=>Sfx.win(), release:()=>Sfx.shiny(), awake:()=>Sfx.coin(), page:()=>Sfx.wobble()})[m.kind](); } catch(e){}
  if(typeof buzz === "function") buzz(m.kind === "release" ? [30, 60, 30, 60, 120] : [20, 40, 60]);
  const t0 = Date.now();
  box.onclick = () => { if(Date.now() - t0 > 700) momentEnd(true); };
  clearTimeout(momentShow._t);
  momentShow._t = setTimeout(momentEnd, m.dur || (m.quote ? 6500 : m.line ? 4200 : 2800));
}
function momentEnd(tapped){
  const box = document.getElementById("moment");
  const m = MOMENT_ON;
  /* un moment qui propose quelque chose (lire une page) ne le fait que si on touche */
  if(m && tapped && m.onTap) setTimeout(()=>{ try { m.onTap(); } catch(e){} }, 300);
  MOMENT_ON = null;
  clearTimeout(momentShow._t);
  if(box){ box.className = "off"; setTimeout(()=>{ if(!MOMENT_ON){ box.className = ""; box.innerHTML = ""; } }, 380); }
  if(m && m.then) try { m.then(); } catch(e){}
  setTimeout(momentFlush, 450);
}
setInterval(()=>{ try { momentFlush(); } catch(e){} }, 1200);

/* ---------- les salles qui s'ouvrent ----------
   Jusqu'ici, un module se debloquait en silence : un point sur
   l'onglet, et c'est tout. C'est pourtant le cap le plus net du jeu. */
const ROOM_MOMENTS = {
  pokebox:   {n:"La PokéBox",      icon:"box",   c:"#5ce07a", go:"pokebox",
              sub:"Une espèce que tu n'as pas encore, mise de côté pour toi chaque jour.",
              line:"J'ai bricolé un tampon. Ne pose pas de questions. Surtout au système."},
  idle:      {n:"Le Forage",       icon:"bolt",  c:"#c9a86a", go:"idle",
              sub:"Tes Pokémon creusent tout seuls. Toi, tu fais les fouilles qu'ils trouvent.",
              line:"Tes Pokémon savent creuser. Je leur ai trouvé un puits. Un grand. Très grand."},
  expedition:{n:"L'Expédition",    icon:"map",   c:"#35f0d6", go:"expedition",
              sub:"Une couche non cartographiée. Des routes à choisir, des Champions au bout.",
              line:"On part à trois, on revient plus forts. Enfin, eux reviennent. Moi je reste ici à m'inquiéter."},
  tower:     {n:"La Tour",         icon:"user",  c:"#9b6bff", go:"tower",
              sub:"Le grenier de l'archive : six ailes de souvenirs empilés. Combats à quatre.",
              line:"Prends quatre amis. Et des parchemins. Surtout des parchemins."},
  boss:      {n:"Les verrous légendaires", icon:"lock", c:"#ff3d7f", go:"boss",
              sub:"Au sommet des ailes 2, 4 et 6, quelque chose monte la garde.",
              line:"Je l'entends respirer d'ici. Ce n'est pas une image. Enfin, si. Mais quand même.", mood:"Worried"},
  breche:    {n:"La Brèche",       icon:"boss",  c:"#ff3d7f", go:"breche",
              sub:"La faille déborde. Tenir huit minutes, choisir, évoluer.",
              line:"Elle s'est ouverte là où se tenait le verrou. Je n'aime pas les choses qui s'ouvrent toutes seules.", mood:"Worried"},
  poker:     {n:"Le Poké-Poker",   icon:"cards", c:"#ffc857", go:"poker",
              sub:"Des mains de Pokémon, des programmes qui s'empilent.",
              line:"J'ai trouvé un jeu de cartes. Il ne contient que des Pokémon. C'est le meilleur jeu de cartes."}
};
function roomMomentsTick(){
  if(!S || !S.flags) return false;
  /* une partie plus ancienne : les salles deja ouvertes ne se rejouent pas */
  if(!S.flags.roomsSeen){ S.flags.roomsSeen = Object.keys(ROOM_MOMENTS).filter(k=>moduleUnlocked(k)); saveSoon(); return false; }
  for(const k in ROOM_MOMENTS){
    if(S.flags.roomsSeen.includes(k) || !moduleUnlocked(k)) continue;
    S.flags.roomsSeen.push(k); saveSoon();
    const R = ROOM_MOMENTS[k];
    moment({kind:"door", kicker:"NOUVELLE SALLE", title:R.n, sub:R.sub, icon:R.icon, c:R.c, line:R.line, lineMood:R.mood || "Happy"});
    return true;
  }
  return false;
}

/* ---------- les autres caps ---------- */
function momentStratum(si){
  const s = STRATA[si];
  moment({kind:"depth", kicker:`NOUVELLE COUCHE · ${fmt(s.need)} M`, title:s.n, sub:s.d, c:s.c, band:s.pal,
          line:s.good.length ? `Ici, les types ${s.good.map(t=>TYPE_NAMES[t]).join(", ").replace(/, ([^,]*)$/, " et $1")} creusent deux fois plus vite. Je dis ça, je ne dis rien.` : ""});
}
function momentWing(z, d){
  const Z = SQ_ZONES[z], next = SQ_ZONES[z + 1], D = SQ_DIFFS[d];
  const lock = typeof sqLockAt === "function" ? sqLockAt(z, d) : null;
  moment({kind:"wing", kicker:`TOUR · ${D.n.toUpperCase()}`, title:`${Z.n} franchie`, spr:Z.boss, c:Z.c,
          sub:next ? `L'aile suivante s'ouvre : ${next.n}.` : (d < SQ_DIFFS.length - 1 ? `La difficulté ${SQ_DIFFS[d + 1].n} s'ouvre pour la première aile.` : "Tu as gravi la Tour entière. Il n'y a rien au-dessus."),
          line:lock && !guardianBeaten(lock.r.key, lock.g.id) ? "Et au sommet de cette aile… quelque chose s'est réveillé. Tu l'as senti aussi ?" : ""});
}
function momentRelease(g, onDone){
  moment({kind:"release", kicker:"VERROU LEVÉ", title:g.name, sub:g.title, spr:g.id, c:"#ffd84a", quote:g.bye, then:onDone}, true);
}
function momentAwake(id){
  moment({kind:"awake", kicker:"DANS LA ROCHE", title:`${POKE[id].name} se réveille`, sub:"Il rejoint ton Pokédex.", spr:id, c:"#c9a86a", dur:2600}, true);
}
