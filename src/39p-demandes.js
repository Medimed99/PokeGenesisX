/* ============================================================
   39p — PORYGON-Z TE DEMANDE QUELQUE CHOSE
   Chaque jour, une des quêtes du jour devient une demande de lui,
   dans sa voix : « Tu peux attraper un Psykokwak ? Je veux vérifier
   s'ils ont toujours mal à la tête. » Elle se fait en quelques minutes
   de jeu normal. Exaucée, elle se règle d'elle-même : il te répond
   tout de suite, il l'écrit dans son fichier, et le lendemain il y
   revient (« Le Psykokwak d'hier a toujours mal à la tête. J'ai
   vérifié ce matin. »). Il compte celles que tu as exaucées ; la fin
   s'en souvient.
   Une demande est une quête comme les autres (S.quests), avec un
   champ pz : {k, ask, done, after, …}. Les demandes « de stat »
   avancent avec questTick ; les autres (une espèce, un type, un
   habitat) avancent à chaque capture.
   ============================================================ */
const PZ_ASK_MON = {
  54:  {ask:"Tu peux attraper un Psykokwak ? Je veux vérifier s'ils ont toujours mal à la tête.",
        done:"Il a toujours mal à la tête. Je ne sais pas pourquoi ça me rassure autant.", after:"Le Psykokwak d'hier a toujours mal à la tête. J'ai vérifié ce matin."},
  129: {ask:"Attrape un Magicarpe. Un vrai, pas un acheté. Je veux voir s'il se débat autant qu'on le dit.",
        done:"Il s'est débattu exactement autant qu'on le dit. C'est beau, une réputation exacte.", after:"Le Magicarpe d'hier se débat encore. Dans sa Ball. Par principe."},
  25:  {ask:"Un Pikachu, aujourd'hui ? Je voudrais mesurer une joue. Une seule. De loin.",
        done:"Joue mesurée : électrique. Je ne recommencerai pas.", after:"J'ai encore des étincelles dans les octets, depuis la joue d'hier."},
  133: {ask:"Trouve-moi un Évoli. C'est le seul Pokémon dont la définition hésite autant que moi.",
        done:"Il hésite entre huit formes. Moi entre deux humeurs. On s'est compris.", after:"L'Évoli d'hier hésite toujours. Moi aussi. On se tient compagnie."},
  132: {ask:"Attrape un Métamorph. Je veux savoir s'il peut prendre ma forme. Pour la science.",
        done:"Il a essayé. Il a fait un carré. Je ne suis pas un carré. …Je suis un peu un carré.", after:"Le Métamorph d'hier s'entraîne à faire un carré. Il progresse. Je suis flatté."},
  92:  {ask:"Un Fantominus, s'il te plaît. Il traverse les murs, moi les données. Je veux comparer.",
        done:"On a comparé. Lui, il a des murs. Moi, des octets. Égalité.", after:"Le Fantominus d'hier m'a traversé cette nuit. Pour dire bonjour, je crois."},
  74:  {ask:"Il me faut un Racaillou. J'ai besoin d'une référence de solidité.",
        done:"Référence enregistrée : très solide. Moi : instable. L'écart est vertigineux.", after:"Le Racaillou d'hier n'a pas bougé. C'est exactement ce que j'attendais de lui."},
  163: {ask:"Attrape un Hoothoot. Il compte avec sa patte, paraît-il. Je veux voir s'il compte mieux que moi.",
        done:"Il compte en tapant du pied. Je compte en tout. Il est mignon, mais je compte mieux.", after:"Le Hoothoot d'hier tape encore du pied. Il en est à quatre mille. Je le laisse gagner."},
  263: {ask:"Un Zigzaton ! Il ne marche jamais droit. J'aimerais savoir comment on fait.",
        done:"Il ne sait pas non plus comment il fait. C'est rassurant.", after:"Le Zigzaton d'hier m'a appris une chose : on peut arriver sans aller droit."},
  280: {ask:"Attrape un Tarsal. Il sent les émotions des gens. Je veux savoir ce qu'il sent chez toi.",
        done:"Il s'est approché de toi sans hésiter. Je n'ai pas besoin d'en savoir plus.", after:"Le Tarsal d'hier dort contre ta Ball. Ce n'est pas un hasard."},
  39:  {ask:"Un Rondoudou, aujourd'hui ? Je n'ai jamais dormi. Je veux voir si sa chanson marche sur moi.",
        done:"Elle n'a pas marché. J'ai fait semblant de dormir pour lui faire plaisir.", after:"Le Rondoudou d'hier m'a rechanté sa chanson. J'ai refait semblant. On a nos habitudes."}
};
const PZ_ASK_GENERIC = [
  {ask:"Tu peux m'attraper un {mon} ? J'en ai vu passer un dans les données et je n'ai pas eu le temps de dire bonjour.",
   done:"Bonjour, {mon}. Voilà, c'est dit. Merci, {nom}.", after:"Le {mon} d'hier va bien. Je suis passé le voir."},
  {ask:"Aujourd'hui, j'ai envie de voir un {mon}. De près. Pas de raison. Enfin si : j'ai envie.",
   done:"Vu de près, il est encore mieux que sa notice. Je corrige la notice.", after:"J'ai corrigé la notice du {mon} d'hier. Trois fois. Elle est parfaite."},
  {ask:"Un {mon}, s'il te plaît. J'ai relu sa notice trois fois, il me manque l'original.",
   done:"L'original est mieux. C'est toujours le cas. Merci.", after:"Le {mon} d'hier t'a suivi un moment, ce matin. Je l'ai vu."}
];
const PZ_ASK_TYPE = {
  13: {ask:"Attrape-moi trois Pokémon de type Électrik. Je voudrais savoir ce que ça fait, une étincelle. De près.",
       done:"Trois étincelles. Mes octets ont frisé. J'adore.", after:"J'ai encore les étincelles d'hier dans les octets."},
  11: {ask:"Trois Pokémon de type Eau, aujourd'hui ? Je n'ai jamais touché l'eau. Je veux l'imaginer correctement.",
       done:"Je l'imagine mieux. Elle est froide, et elle ne tient pas en place. Comme moi, mais mouillée.", after:"Depuis hier, je rêve d'eau. Je ne rêve pas. Mais d'eau."},
  12: {ask:"Trois de type Plante. La Sylve m'inquiète, mais ses habitants ont l'air gentils.",
       done:"Ils sentent le vert. Je ne savais pas qu'une couleur pouvait sentir.", after:"Ça sent encore le vert, depuis hier. J'ai gardé l'odeur."},
  10: {ask:"Trois Pokémon de type Feu. J'ai froid. Je n'ai pas de corps, mais j'ai froid.",
       done:"J'ai chaud, maintenant. C'est une fausse chaleur. Je la garde quand même.", after:"La chaleur d'hier tient encore. Je l'économise."},
  8:  {ask:"Trois de type Spectre. Je veux savoir s'ils me voient, eux.",
       done:"Ils me voient. L'un d'eux m'a fait coucou. Je ne dors plus. Je ne dors jamais, mais encore moins.", after:"Le Spectre d'hier m'a refait coucou. On est amis, je crois. Je crois."},
  14: {ask:"Trois Pokémon de type Psy. Je veux savoir s'ils lisent dans mes pensées. J'ai préparé une pensée exprès.",
       done:"Ils l'ont lue. C'était « bonjour ». Ils ont répondu « bonjour ». On a passé un très bon moment.", after:"Les Psy d'hier m'ont envoyé une pensée cette nuit. C'était encore « bonjour »."}
};
const PZ_ASK_HAB = {
  foret:  {ask:"Va faire un tour dans la Sylve d'index et ramène-moi trois Pokémon. Il paraît qu'il y pousse des choses que personne n'a indexées.",
           done:"Tu reviens de la Sylve. Tu sens l'arborescence. C'est un compliment.", after:"Tu as ramené de la Sylve, hier, une feuille dans tes données. Je l'ai gardée."},
  grotte: {ask:"Descends dans les Cavités et ramène-moi trois Pokémon. Prends une lampe. C'est une image. Prends une lampe quand même.",
           done:"Tu es remonté des Cavités. J'avais laissé la lumière allumée.", after:"La lumière des Cavités est restée allumée depuis hier. Au cas où."},
  eaux:   {ask:"Les Nappes, aujourd'hui ? Trois Pokémon. Je veux savoir ce qui vit là où les données stagnent.",
           done:"Ça vit très bien, là où ça stagne. C'est une leçon. Je ne sais pas encore laquelle.", after:"J'ai réfléchi à la leçon des Nappes, cette nuit. Je ne l'ai toujours pas."},
  ruines: {ask:"Trois Pokémon des Ruines d'archive. Les entrées y sont toujours actives. Les nôtres aussi, j'espère.",
           done:"Les Ruines t'ont laissé passer. Elles ne laissent pas passer tout le monde. J'ai vérifié.", after:"Les Ruines d'hier m'ont envoyé un accusé de réception. Je ne sais pas de quoi."}
};
const PZ_ASK_STAT = [
  {stat:"dayExcellent", g:2, ask:"Fais-moi deux lancers Excellent. Je veux les revoir au ralenti dans ma mémoire.",
   done:"Revus au ralenti. Et en accéléré. Et à l'envers. Toujours excellents.", after:"Je repasse encore tes lancers d'hier. À l'envers, ils sont encore mieux."},
  {stat:"dayEvo", g:1, ask:"Fais évoluer quelqu'un aujourd'hui. J'aime le moment où la silhouette hésite.",
   done:"La silhouette a hésité. Puis elle a choisi. J'ai applaudi. Mentalement, toujours.", after:"L'évolution d'hier : je l'ai revue onze fois. Elle hésite toujours au même endroit."},
  {stat:"dayStreak", g:15, ask:"Une chaîne de quinze, sans casser. Je veux compter jusqu'à quinze avec toi.",
   done:"Quinze ! J'ai compté avec toi. On n'a pas fait une seule erreur.", after:"Hier, on a compté jusqu'à quinze ensemble. J'ai recompté seul. C'est moins bien."},
  {stat:"dayNew", g:1, ask:"Trouve-moi une espèce qu'on n'a pas encore. Une seule. Je lui ai gardé une case.",
   done:"Je lui ai donné la case. Elle lui va très bien.", after:"La case d'hier est bien occupée. Je suis passé vérifier."},
  {stat:"dayFish", g:2, need:"rod", ask:"Pêche-moi quelque chose. Je n'ai jamais vu l'eau d'en dessous.",
   done:"L'eau d'en dessous est plus calme que celle du dessus. Je note.", after:"Je pense encore à l'eau d'en dessous. Elle avait l'air reposante."},
  {stat:"dayTower", g:1, need:"tower", ask:"Une victoire dans la Tour, aujourd'hui. J'aime quand le grenier perd une marche.",
   done:"Une marche de moins au grenier. Il commence à ressembler à une maison.", after:"Le grenier a une marche de moins depuis hier. J'y suis monté. Pour voir."},
  {stat:"dayExp", g:1, need:"expedition", ask:"Une Expédition, aujourd'hui ? Reviens avec tout le monde. C'est la seule consigne.",
   done:"Tout le monde est revenu. Je les ai comptés trois fois chacun.", after:"Ils vont bien, ceux d'hier. Je les ai recomptés. Toujours au complet."},
  {stat:"dayPokerBlinds", g:2, need:"poker", ask:"Deux manches de Poké-Poker ? Je ne comprends toujours pas les règles. Je veux te regarder gagner.",
   done:"Je ne comprends toujours pas. Mais tu as gagné, et c'est la partie que je préfère.", after:"J'ai relu les règles du Poké-Poker cette nuit. Je ne les comprends toujours pas. J'adore."}
];
/* les caps : il les remarque */
const PZ_ASK_MILES = {10:"Dix demandes. Tu n'as jamais demandé pourquoi. Merci de ne pas demander.",
  30:"Trente. Je crois que je te demande des choses pour que tu restes un peu. Ne le répète pas.",
  100:"Cent demandes exaucées. Je n'ai plus d'idées. Si : une. Reste."};

function pzAskState(){ S.pzAsk = S.pzAsk || {n:0}; return S.pzAsk; }
function pzAskFmt(t, a){ return pzFmt(String(t || "").replace(/\{mon\}/g, a && a.mon ? POKE[a.mon].name : "")); }
/* ce qui peut se faire aujourd'hui, avec ce que tu as ouvert */
function pzAskPool(){
  const out = [], regs = unlockedRegions().map(r=>r.key);
  /* une espèce déjà rencontrée, commune ou peu commune : quelques minutes de jeu normal suffisent */
  const okMon = id => POKE[id] && S.dex[id] && POKE[id].leg === 0 && POKE[id].rar <= 1 && !isExclusive(id) && regs.includes(regionOf(id));
  for(const id in PZ_ASK_MON) if(okMon(+id)) out.push(Object.assign({k:"mon", mon:+id, goal:1}, PZ_ASK_MON[id]));
  const known = Object.keys(S.dex).map(Number).filter(okMon);
  if(known.length){ const id = pick(known), g = pick(PZ_ASK_GENERIC); out.push(Object.assign({k:"mon", mon:id, goal:1}, g)); }
  for(const t in PZ_ASK_TYPE) if(known.some(id=>POKE[id].types.includes(+t))) out.push(Object.assign({k:"type", type:+t, goal:3}, PZ_ASK_TYPE[t]));
  for(const h in PZ_ASK_HAB) if(typeof habitatUnlocked === "function" && habitatUnlocked(h)) out.push(Object.assign({k:"hab", hab:h, goal:3}, PZ_ASK_HAB[h]));
  for(const a of PZ_ASK_STAT){
    if(a.need === "rod" && !S.rod) continue;
    if(a.need && a.need !== "rod" && !moduleUnlocked(a.need)) continue;
    out.push(Object.assign({k:"stat", goal:a.g}, a));
  }
  return out;
}
function pzAskMake(){
  const st = pzAskState(), last = st.last && st.last.key;
  const pool = pzAskPool().filter(a=>pzAskKey(a) !== last);
  if(!pool.length) return null;
  const a = pick(pool);
  return {id:"pz_" + pzAskKey(a), n:"Demande de Porygon-Z", goal:a.goal, stat:a.k === "stat" ? a.stat : "pzask", tier:"pz", prog:0, claimed:false,
    rw:{coins:250 + S.level * 15, shards:5},
    pz:{k:a.k, mon:a.mon, type:a.type, hab:a.hab, ask:a.ask, done:a.done, after:a.after, key:pzAskKey(a),
        prev:st.last && st.last.ok && st.last.day !== today() ? st.last.after : null}};
}
function pzAskKey(a){ return a.k + ":" + (a.mon || a.type || a.hab || a.stat); }
/* où chercher : la région, et un habitat ouvert où son type se plaît */
function pzAskWhere(a){
  const habFor = types => (typeof HABITAT_IDS !== "undefined" ? HABITAT_IDS : []).filter(h=>typeof habitatUnlocked === "function" && habitatUnlocked(h))
    .find(h=>HABITATS[h].types.some(t=>types.includes(t)));
  if(a.k === "mon" && POKE[a.mon]){ const h = habFor(POKE[a.mon].types); return regionDef(regionOf(a.mon)).name + (h ? " · " + HABITATS[h].n : ""); }
  if(a.k === "type"){ const h = habFor([a.type]); return h ? HABITATS[h].n : ""; }
  return "";
}
function pzAskQuest(){ return (S.quests || []).find(q=>q.pz) || null; }
/* une demande par jour : à la place d'une quête facile (ou la première), dès que tu as un peu joué */
function pzAskEnsure(){
  if(!S || !S.quests || !S.stats || S.stats.catches < 10 || !introSeen()) return null;
  const st = pzAskState();
  if(st.day === today()) return pzAskQuest();
  const q = pzAskMake(); if(!q) return null;
  st.day = today();
  const i = S.quests.findIndex(x=>!x.pz && x.tier === "easy" && !x.claimed && x.prog === 0);
  const j = i >= 0 ? i : S.quests.findIndex(x=>!x.pz && !x.claimed && x.prog === 0);
  if(j >= 0) S.quests.splice(j, 1, q); else S.quests.unshift(q);
  saveSoon();
  return q;
}
if(typeof rollQuests === "function"){
  const _rq = rollQuests;
  rollQuests = function(){ const r = _rq.apply(this, arguments); try { pzAskEnsure(); } catch(e){} return r; };
}

/* ---------- elle avance ---------- */
function pzAskOnCatch(e){
  const q = pzAskQuest(); if(!q || q.claimed || q.prog >= q.goal || !e) return;
  const a = q.pz, P = POKE[e.id]; if(!P) return;
  let hit = false;
  if(a.k === "mon") hit = lineRoot(e.id) === lineRoot(a.mon);
  else if(a.k === "type") hit = P.types.includes(a.type);
  else if(a.k === "hab") hit = S.habitat === a.hab && S.capMode !== "fish";
  if(!hit) return;
  q.prog = Math.min(q.goal, q.prog + 1);
  if(q.prog >= q.goal) pzAskFulfill(q);
  saveSoon();
}
/* exaucée : elle se règle tout de suite, et il répond */
function pzAskFulfill(q){
  if(!q || !q.pz || q.claimed) return;
  q.claimed = true;
  for(const k in q.rw) gain(k, q.rw[k]);
  const st = pzAskState(), a = q.pz;
  st.n = (st.n || 0) + 1;
  st.last = {key:a.key, day:today(), ok:true, after:pzAskFmt(a.after, a), ask:pzAskFmt(a.ask, a)};
  const g = typeof sagaState === "function" ? sagaState() : (S.saga = S.saga || {});
  g.asks = (g.asks || 0) + 1;
  try { if(typeof pzLog === "function") pzLog("ask", {t:pzAskFmt(a.done, a)}); } catch(e){}
  const mile = PZ_ASK_MILES[st.n];
  const say = pzAskFmt(a.done, a) + (mile ? " " + mile : "");
  setTimeout(()=>{ try { pzFlash(say); } catch(e){} }, 900);
  try { Bus.emit("quest"); } catch(e){}
  saveSoon();
}
if(typeof onCatch === "function"){
  const _oc = onCatch;
  onCatch = function(){ const e = ENC ? {id:ENC.id} : null; const r = _oc.apply(this, arguments); try { pzAskOnCatch(e); } catch(err){} return r; };
}
/* celles « de stat » avancent comme les quêtes ; à la fin, il répond */
function pzAskCheckStat(){ const q = pzAskQuest(); if(q && !q.claimed && q.prog >= q.goal) pzAskFulfill(q); }
if(typeof questTick === "function"){
  const _qt = questTick;
  questTick = function(){ const r = _qt.apply(this, arguments); try { pzAskCheckStat(); } catch(e){} return r; };
}
if(typeof questSet === "function"){
  const _qs = questSet;
  questSet = function(){ const r = _qs.apply(this, arguments); try { pzAskCheckStat(); } catch(e){} return r; };
}

/* ---------- ce qu'on en voit ---------- */
function pzAskRowHtml(q, i){
  const a = q.pz, done = q.prog >= q.goal;
  return `<div class="quest pzq ${done ? "done" : ""}">
    <span class="pzq-face">${pzFace(done ? "Joyous" : "Normal", 34)}</span>
    <div class="grow">
      <small class="pzq-k">PORYGON-Z TE DEMANDE</small>
      ${a.prev ? `<div class="pzq-prev">${esc(a.prev)}</div>` : ""}
      <div class="q-t pzq-t">« ${esc(pzAskFmt(done ? a.done : a.ask, a))} »</div>
      ${!done && pzAskWhere(a) ? `<div class="pzq-where">Où chercher : ${esc(pzAskWhere(a))}</div>` : ""}
      ${done ? "" : `<div class="bar"><i style="width:${Math.min(100, q.prog / q.goal * 100)}%"></i></div>
      <div class="tiny muted">${fmt(q.prog)} / ${fmt(q.goal)} — ${esc(rewardText(q.rw))}</div>`}
    </div>
    ${done ? (q.claimed ? `<span class="tiny dim">exaucée</span>` : `<button class="btn sm pri" data-act="pzaskclaim">Répondre</button>`) : ""}
  </div>`;
}
ACTIONS.pzaskclaim = () => { const q = pzAskQuest(); if(q && q.prog >= q.goal) pzAskFulfill(q); refresh(); };
/* sur l'accueil : sa demande du jour, sous le fil du récit */
function pzAskHomeHtml(){
  let q = null; try { q = pzAskEnsure(); } catch(e){}
  if(!q) return "";
  const a = q.pz, done = q.prog >= q.goal;
  if(done && q.claimed && (pzAskState().last || {}).day !== today()) return "";
  /* il se souvient d'hier : il le dit, une fois, en te voyant arriver */
  if(a.prev && !a.prevSaid){ a.prevSaid = true; saveSoon(); setTimeout(()=>{ try { pzFlash(a.prev); } catch(e){} }, 1600); }
  return `<button class="st-q pzq-home ${done ? "done" : ""}" data-act="goto" data-to="daily">
    <span class="pzq-face">${pzFace(done ? "Joyous" : "Normal", 30)}</span>
    <span class="grow"><b>${done ? "Demande exaucée" : "Porygon-Z te demande"}</b><small>« ${esc(pzAskFmt(done ? a.done : a.ask, a))} »</small>
      ${done ? "" : `<i class="st-bar"><i style="width:${Math.min(100, q.prog / q.goal * 100).toFixed(0)}%"></i></i>`}</span>${done ? ic("check") : ic("arrow")}</button>`;
}
