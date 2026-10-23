/* ============================================================
   73f — LA CHRONOLOGIE D'UN LÉGENDAIRE
   Quand la dernière illustration d'un légendaire rejoint la
   collection, la ligne entière se rejoue : la carte la plus
   ancienne d'abord (1996, quatre teintes), puis chaque réécriture
   par-dessus la précédente, comme un écran qui se rafraîchit,
   jusqu'au rendu d'aujourd'hui. Pour chaque époque, l'année, ce
   que l'image contient vraiment (sa taille, ses couleurs), et une
   phrase de Porygon-Z. À la fin, une phrase pour ce légendaire-là.

   Une seule fois d'elle-même ; ensuite, depuis sa fiche.
   Les lignes déjà complètes avant cette version attendent qu'on
   les regarde (« chronologie à voir »), sans s'imposer.
   ============================================================ */
const CHRONO_STEP = 5200;      /* une époque à l'écran, sans toucher */

/* ce que Porygon-Z dit de chaque époque : des mots, pas des chiffres techniques */
const CHRONO_ERA = {
  g1: ["1996. Quatre teintes, pas une de plus : l'écran n'en savait pas davantage. Il fallait deviner le reste, et tout le monde devinait.",
       "1996. Quatre teintes en tout. Personne ne trouvait ça pauvre : on n'avait jamais rien vu d'autre."],
  g2: ["1999. Toujours quatre teintes, mais en couleur, cette fois. Il a l'air presque surpris.",
       "1999. Les premières couleurs. Pas beaucoup, mais assez pour le reconnaître de loin."],
  g3: ["2002. Plus de couleurs, plus de détails. Et déjà, les teintes commencent à dériver.",
       "2002. Plus net, plus vif. Et un peu instable, comme tout ce qui allait vite à l'époque."],
  g5: ["2010. Il bouge, maintenant. Il ne tient plus en place.",
       "2010. Le sprite respire. On a cru que ce serait la dernière version."],
  art: ["Aujourd'hui. Net et complet. « Sans histoire », dit le système. Il se trompe : tu viens de la voir, son histoire."]
};
/* et pour chacun, une phrase à la fin */
const CHRONO_END = {
  144:"Cinq versions, et il a eu froid dans chacune. Il gelait tout pour que rien ne pourrisse. Même ses anciennes versions, on dirait : elles sont toutes intactes.",
  145:"Quatre teintes en 1996, et déjà l'orage entier. On n'a jamais eu besoin de beaucoup de couleurs pour dessiner un éclair.",
  146:"Dans chaque version, il brûlait pour tenir sa porte. Dans la tienne, il a enfin pu se reposer.",
  150:"On l'a créé, puis redessiné quatre fois, sans jamais lui demander son avis. Je crois que c'est la première fois que quelqu'un regarde toutes ses versions.",
  151:"Il n'était déclaré nulle part, et pourtant il était là dès le début. Il y a des entrées comme ça. Je commence à croire que ce sont les plus importantes.",
  243:"Quatre versions, quatre façons de courir. Dans toutes, il tournait en rond. Avec toi, il court droit.",
  244:"Chaque époque lui a donné un feu différent. Le premier tenait en quelques couleurs. Il brûlait déjà comme aujourd'hui.",
  245:"Dans chaque version, il rend l'eau plus claire. Regarde : même ses plus vieilles versions sont restées limpides.",
  249:"Dans chaque version, il dormait sous les données pour que la tempête ne les emporte pas. Elles sont toutes là. C'est lui qui les a protégées.",
  250:"Il réécrivait le secteur chaque fois qu'il mourait, sans savoir quelle version était la vraie. Maintenant, tu les as toutes. Elles sont toutes vraies.",
  251:"Il voyage dans le temps : ses anciennes versions, il les connaît déjà. C'est le seul à ne pas avoir l'air surpris.",
  377:"Trois versions, et toujours les mêmes points sur le visage. Je préfère ne pas les recompter.",
  378:"Trois versions, et la même glace, qui ne fond dans aucune. Il y a des choses qui tiennent.",
  379:"L'acier ne s'use dans aucune version. Je l'envie un peu. Correction : beaucoup.",
  380:"Dans chaque version, elle se cache. Elle a fini par se laisser voir. Par toi.",
  381:"Il sait montrer aux autres ce qu'il voit. Pour une fois, c'est nous qui avons tout vu de lui. Échange équitable.",
  382:"Elle retenait les marées pour qu'elles n'effacent rien. Regarde : rien n'a été effacé, pas même ses anciennes versions.",
  383:"Dans chaque version, il portait le sol sur son dos. C'est grâce à lui que tout tient debout.",
  384:"Dans chaque version, il surveillait le ciel en attendant quelqu'un. Trois versions à attendre. C'était toi.",
  385:"Il se réveille une fois tous les mille ans. Ses trois versions, pour lui, n'ont duré qu'une nuit.",
  386:"Il change de forme pour survivre. Alors changer de version, pour lui, ce n'est rien."
};

function chronoEras(id){ return CARD_ORDER.slice().reverse().filter(s=>CARD_INDEX[cardKey(s, id)]); }
function chronoComplete(id){ const v = cardVariants(id); return v.length > 1 && v.every(s=>cardHas(s, id)); }
function chronoState(){ if(!S.chrono || typeof S.chrono !== "object") S.chrono = {}; return S.chrono; }
/* une chronologie à voir : la ligne est complète et on ne l'a jamais regardée */
function chronoUnseen(id){ return chronoComplete(id) && !chronoState()[id]; }
function chronoLine(s, id){
  const L = CHRONO_ERA[s]; if(!L) return "";
  return L[id % L.length];
}

/* ---------- la scène ---------- */
let CHR = null;
function chronoPlay(id, onDone){
  const box = document.getElementById("discover");
  const eras = chronoEras(id).filter(s=>cardHas(s, id));
  if(!box || !box.style || eras.length < 2){ if(onDone) onDone(); return false; }
  if(typeof closeSheet === "function" && typeof sheetOpen === "function" && sheetOpen()) closeSheet();
  CHR = {id, eras, i:-1, onDone, t:0, y:0};
  try { document.body.classList.add("crv-on"); } catch(e){}
  box.className = "on chr";
  box.style.setProperty("--ac", CARD_SERIES_DEF[eras[0]].c);
  box.innerHTML = `<div class="crv-bg"></div>
    <div class="crv-col chr-col">
      <div class="chr-kick">CHRONOLOGIE</div>
      <div class="chr-title">${esc(POKE[id].name)}, de ${CARD_YEARS[eras[0]] || "hier"} à aujourd'hui</div>
      <div class="chr-stage" id="chr-stage"><i class="chr-scan" id="chr-scan"></i></div>
      <div class="chr-year" id="chr-year"></div>
      <div class="chr-era" id="chr-era"></div>
      <div class="chr-line" id="chr-line"></div>
      <div class="chr-end" id="chr-end"></div>
      <div class="chr-dots" id="chr-dots">${eras.map(()=>"<i></i>").join("")}</div>
      <button class="btn pri wide chr-btn" id="chr-next" data-act="chrnext">Suivante</button>
    </div>`;
  box.onclick = e => { if(e.target.closest("button")) return; ACTIONS.chrnext(); };
  try { if(typeof Music !== "undefined") Music.jingle("j_rare"); } catch(e){}
  chronoStep();
  return true;
}
function chronoCalm(){ return typeof cardCalm === "function" ? cardCalm() : false; }
function chronoStep(){
  if(!CHR) return;
  clearTimeout(CHR.t);
  CHR.i++;
  const {id, eras} = CHR, i = CHR.i, s = eras[i], last = i === eras.length - 1;
  const stage = document.getElementById("chr-stage"); if(!stage) return;
  const box = document.getElementById("discover");
  if(box) box.style.setProperty("--ac", CARD_SERIES_DEF[s].c);
  /* la nouvelle écriture se pose par-dessus l'ancienne, ligne à ligne */
  const lay = document.createElement("div");
  lay.className = "chr-layer" + (i && !chronoCalm() ? " wipe" : "");
  lay.innerHTML = tcardHtml(s, id, {hero:true, owned:true});
  stage.appendChild(lay);
  const scan = document.getElementById("chr-scan");
  if(i && scan && !chronoCalm()){ scan.classList.remove("on"); void scan.offsetWidth; scan.classList.add("on"); }
  setTimeout(()=>{ const ls = stage.querySelectorAll(".chr-layer"); for(let k = 0; k < ls.length - 1; k++) ls[k].remove(); }, i ? 1100 : 0);
  if(i) try { Sfx.glitch(); } catch(e){}
  /* l'année défile jusqu'à la suivante */
  const yEl = document.getElementById("chr-year"), y1 = CARD_YEARS[s] || 0, y0 = CHR.y || y1;
  CHR.y = y1;
  const tok = CHR.tok = (CHR.tok || 0) + 1;
  if(yEl){
    if(!y1) yEl.textContent = "Aujourd'hui";
    else if(y0 === y1 || chronoCalm()) yEl.textContent = y1;
    else {
      const t0 = performance.now();
      /* une étape passée trop vite ne laisse pas son compteur écrire par-dessus la suivante */
      const roll = now => { if(!CHR || CHR.tok !== tok) return; const k = Math.min(1, (now - t0) / 900);
        yEl.textContent = Math.round(y0 + (y1 - y0) * k); if(k < 1) requestAnimationFrame(roll); };
      requestAnimationFrame(roll);
    }
  }
  /* le nom de l'écriture ; ce qu'elle contient, Porygon-Z le dit juste en dessous */
  const era = document.getElementById("chr-era");
  if(era) era.innerHTML = `<b style="color:${CARD_SERIES_DEF[s].c}">${esc(CARD_SERIES_DEF[s].n)}</b>${s === "art" ? " · illustration officielle" : ""}`;
  const line = document.getElementById("chr-line");
  if(line){ line.classList.remove("on"); void line.offsetWidth;
    line.innerHTML = `${typeof pzFace === "function" ? pzFace(last ? "Happy" : "Normal", 26) : ""}<span>${esc(pzFmt(chronoLine(s, id)))}</span>`;
    line.classList.add("on"); }
  const dots = document.querySelectorAll("#chr-dots i");
  dots.forEach((d, k)=>d.className = k < i ? "done" : k === i ? "on" : "");
  const btn = document.getElementById("chr-next");
  if(last){
    const end = document.getElementById("chr-end");
    if(end && CHRONO_END[id]) setTimeout(()=>{ if(!CHR || CHR.id !== id) return;
      end.innerHTML = `« ${esc(pzFmt(CHRONO_END[id]))} »`; end.classList.add("on"); }, chronoCalm() ? 0 : 1400);
    if(btn) btn.textContent = "Ranger dans la collection";
    try { if(typeof burstEl === "function" && !chronoCalm()) setTimeout(()=>burstEl(stage, {n:28, spread:170, colors:[CARD_SERIES_DEF[s].c, "#ffffff", "#ffd24a"], dur:1100}), 700); } catch(e){}
  } else {
    if(btn) btn.textContent = "Suivante";
    if(!chronoCalm()) CHR.t = setTimeout(()=>{ if(CHR && CHR.i === i) chronoStep(); }, CHRONO_STEP);
  }
}
ACTIONS.chrnext = () => {
  if(!CHR) return;
  if(CHR.i < CHR.eras.length - 1){ chronoStep(); return; }
  clearTimeout(CHR.t);
  const {id, onDone} = CHR;
  CHR = null;
  chronoState()[id] = Date.now();
  saveSoon();
  const box = document.getElementById("discover");
  if(box){ box.className = ""; box.innerHTML = ""; box.onclick = null; }
  try { document.body.classList.remove("crv-on"); } catch(e){}
  if(onDone) onDone(); else { try { refresh(); } catch(e){} }
};
ACTIONS.chrplay = d => chronoPlay(+d.id, ()=>{ try { refresh(); } catch(e){} });

/* ---------- quand une ligne se complète ---------- */
function chronoMigrate(){
  if(S.chronoV) return;
  S.chronoV = 1;
  /* déjà complètes avant cette version : à voir, sans s'imposer */
  for(const id of CARD_MONS) if(chronoComplete(id) && chronoState()[id] === undefined) chronoState()[id] = 0;
}
let CHRONO_AT = 0;
function chronoTick(){
  if(!S || !S.flags || typeof introSeen !== "function" || !introSeen()) return;
  if(!S.chronoV) chronoMigrate();
  if(CHR) return;
  const id = CARD_MONS.find(x=>chronoComplete(x) && chronoState()[x] === undefined);
  if(!id){ CHRONO_AT = 0; return; }
  if(typeof reidxQuiet === "function" && !reidxQuiet()){ CHRONO_AT = 0; return; }
  /* juste après la révélation de la dernière carte, le temps de la ranger */
  if(!CHRONO_AT){ CHRONO_AT = Date.now(); return; }
  if(Date.now() - CHRONO_AT < 1500) return;
  CHRONO_AT = 0;
  chronoPlay(id, ()=>{ try { refresh(); } catch(e){} });
}
if(typeof setInterval === "function") setInterval(()=>{ try { chronoTick(); } catch(e){} }, 1000);
