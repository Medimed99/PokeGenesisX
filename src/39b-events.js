/* ============================================================
   39b — ÉVÉNEMENTS TOURNANTS
   Des raisons de revenir, sans serveur de jeu : tout est calcule a
   partir de la date, donc identique pour tous les joueurs.
   · une SAISON de la Breche toutes les deux semaines (six themes qui
     tournent : chacun revient toutes les douze semaines) ;
   · un PARCOURS de recompenses gratuit, alimente par les points de saison ;
   · un LEGENDAIRE DE LA SEMAINE, qui surgit en echo au milieu des Breches ;
   · un OBJECTIF COLLECTIF hebdomadaire, additionne entre tous les joueurs
     (Supabase) ; hors ligne, on voit sa propre contribution.
   Rien n'est perdu pour de bon : le titre d'une saison se regagne quand
   son theme revient. Pas de FOMO, pas d'energie, pas de serie punitive.
   ============================================================ */
const EV_EPOCH = Date.UTC(2026, 0, 5);            /* un lundi */
const EV_WEEK = 7 * 86400000;
function evWeekIndex(t){ return Math.floor(((t || Date.now()) - EV_EPOCH) / EV_WEEK); }
function evWeekKey(t){ return "S" + evWeekIndex(t); }
function evWeekEnds(t){ return EV_EPOCH + (evWeekIndex(t) + 1) * EV_WEEK; }

const EV_SEASONS = [
  {k:"braise", title:"Cœur de Braise",  n:"Saison de Braise",  type:10, hab:"foyer",  c:"#ff8a3d", d:"Les attaques de type Feu frappent 25 % plus fort dans la Brèche."},
  {k:"marees", title:"Maître des Marées",  n:"Saison des Marées", type:11, hab:"eaux",   c:"#4fb2ff", d:"Les attaques de type Eau frappent 25 % plus fort dans la Brèche."},
  {k:"spores", title:"Gardien des Spores",  n:"Saison des Spores", type:12, hab:"foret",  c:"#5ce07a", d:"Les attaques de type Plante frappent 25 % plus fort dans la Brèche."},
  {k:"orage", title:"Porte-Orage",   n:"Saison de l'Orage", type:13, hab:"route",  c:"#ffe45e", d:"Les attaques de type Électrik frappent 25 % plus fort dans la Brèche."},
  {k:"vide", title:"Voix du Vide",    n:"Saison du Vide",    type:8,  hab:"grotte", c:"#9b6bff", d:"Les attaques de type Spectre frappent 25 % plus fort dans la Brèche."},
  {k:"arcanes", title:"Sage des Arcanes", n:"Saison des Arcanes",type:14, hab:"ruines", c:"#ff7ad0", d:"Les attaques de type Psy frappent 25 % plus fort dans la Brèche."}
];
function evSeasonIndex(t){ return Math.floor(evWeekIndex(t) / 2); }
function evSeason(t){ return EV_SEASONS[((evSeasonIndex(t) % 6) + 6) % 6]; }
function evSeasonKey(t){ return "SZ" + evSeasonIndex(t); }
function evSeasonEnds(t){ return EV_EPOCH + (evSeasonIndex(t) + 1) * 2 * EV_WEEK; }

/* le parcours : dix paliers, gratuits */
const EV_TRACK = [
  {pts:30,  rw:{data:60}},     {pts:70,  rw:{coins:1500}}, {pts:120, rw:{cores:2}},
  {pts:180, rw:{data:120}},    {pts:250, rw:{coins:3000}}, {pts:330, rw:{cores:3}},
  {pts:420, rw:{data:200}},    {pts:520, rw:{shards:40}},  {pts:630, rw:{cores:5}},
  {pts:750, rw:{title:true}}
];
/* le titre de chaque theme : il existe pour de bon, et se regagne a chaque retour du theme */
for(const sz of EV_SEASONS) COSMETICS["title_sz_" + sz.k] = {t:"title", n:sz.title};

function evState(){
  S.events = S.events || {};
  const E = S.events, key = evSeasonKey();
  if(E.season !== key){ E.season = key; E.pts = 0; E.claimed = []; }
  E.claimed = E.claimed || [];
  E.community = E.community || {};
  return E;
}
function evTier(){ const E = evState(); let n = 0; for(const t of EV_TRACK) if(E.pts >= t.pts) n++; return n; }
function evClaimable(){ const E = evState(); return EV_TRACK.filter((t, i)=>E.pts >= t.pts && !E.claimed.includes(i)).length; }
ACTIONS.evclaim = d => {
  const E = evState(), i = +d.i, t = EV_TRACK[i];
  if(!t || E.pts < t.pts || E.claimed.includes(i)) return;
  E.claimed.push(i);
  const rw = Object.assign({}, t.rw);
  if(rw.data){ brState().data += rw.data; toast("+" + rw.data + " Données", "", "check"); delete rw.data; }
  if(rw.title){ const k = "title_sz_" + evSeason().k; unlockCosmetic(k); toast("Titre obtenu : " + COSMETICS[k].n, "warn", "trophy"); delete rw.title; }
  if(Object.keys(rw).length) grantReward(rw);
  try { Sfx.win(); } catch(e){}
  save(); refresh();
};
/* points de saison d'une run de Breche */
function evRunPoints(R){
  const mis = (R.missions || []).filter(m=>m.done).length;
  let p = Math.floor(R.kills / 60) + (R.won ? 25 : 0) + (R.depth || 0) * 6 + mis * 10 + (R.weeklyDown ? 20 : 0);
  if(R.hab === evSeason().hab) p *= 2;               /* l'habitat de la saison paie double */
  return Math.round(p);
}
function evAddPoints(n){
  const E = evState(), before = evTier();
  E.pts += n;
  const after = evTier();
  if(after > before) toast("Palier de saison " + after + " atteint", "warn", "star");
}
/* bonus de saison dans la Breche : le type de la saison frappe plus fort */
function evTypeBonus(types){ return types.includes(evSeason().type) ? 1.25 : 1; }

/* ---------- le légendaire de la semaine ---------- */
const EV_LEGENDS = [144,145,146,243,244,245,150,249,250,377,378,379,380,381,382,383,384,151,251,385,386];
function evWeeklyLegend(t){ return EV_LEGENDS[((evWeekIndex(t) % EV_LEGENDS.length) + EV_LEGENDS.length) % EV_LEGENDS.length]; }

/* ---------- l'objectif collectif ---------- */
const EV_COMMUNITY = [
  {goal:25000,  rw:{cores:2},  n:"Premier palier"},
  {goal:100000, rw:{cores:4},  n:"Deuxième palier"},
  {goal:400000, rw:{cores:8, shards:40}, n:"Troisième palier"}
];
let EV_COMM_TOTAL = null, EV_COMM_PLAYERS = 0, EV_COMM_T = 0;
async function evCommunityRefresh(force){
  if(typeof Net === "undefined" || !Net.configured()) return;
  if(!force && Date.now() - EV_COMM_T < 60000) return;
  EV_COMM_T = Date.now();
  try {
    const r = await Net.communityTotal(evWeekKey());
    EV_COMM_TOTAL = r ? (r.total || 0) : 0; EV_COMM_PLAYERS = r ? (r.players || 0) : 0;
    if(typeof currentScreen !== "undefined" && (currentScreen === "today" || currentScreen === "breche")) refresh();
  } catch(e){}
}
function evCommunityContribute(kills){
  const E = evState(), w = evWeekKey();
  E.community[w] = (E.community[w] || 0) + kills;
  /* on ne garde que la semaine en cours */
  for(const k of Object.keys(E.community)) if(k !== w) delete E.community[k];
  if(typeof Net !== "undefined" && Net.signedIn()) Net.communityAdd(w, kills).then(()=>evCommunityRefresh(true)).catch(()=>{});
}
ACTIONS.evcommclaim = d => {
  const E = evState(), i = +d.i, w = evWeekKey(), key = w + ":" + i, t = EV_COMMUNITY[i];
  E.commClaimed = E.commClaimed || [];
  if(!t || E.commClaimed.includes(key) || !(E.community[w] > 0) || (EV_COMM_TOTAL || 0) < t.goal) return;
  E.commClaimed.push(key);
  grantReward(t.rw);
  try { Sfx.win(); } catch(e){}
  save(); refresh();
};
function evCommClaimable(){
  const E = evState(), w = evWeekKey();
  E.commClaimed = E.commClaimed || [];
  if(!(E.community[w] > 0) || EV_COMM_TOTAL === null) return 0;
  return EV_COMMUNITY.filter((t, i)=>EV_COMM_TOTAL >= t.goal && !E.commClaimed.includes(w + ":" + i)).length;
}
function evLeft(ts){
  const ms = Math.max(0, ts - Date.now()), d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000);
  return d ? `${d} j ${h} h` : `${h} h`;
}

/* ---------- les panneaux ---------- */
function evSeasonPanel(){
  const E = evState(), sz = evSeason(), tier = evTier();
  const next = EV_TRACK[tier];
  const lo = tier ? EV_TRACK[tier - 1].pts : 0, pct = next ? Math.min(100, (E.pts - lo) / (next.pts - lo) * 100) : 100;
  const rwTxt = r => r.data ? r.data + " Données" : r.coins ? fmt(r.coins) + " PokéCoins" : r.cores ? r.cores + " Noyaux"
    : r.shards ? r.shards + " Fragments" : r.title ? "Titre " + COSMETICS["title_sz_" + sz.k].n : "";
  return `<div class="ev-season" style="--sc:${sz.c}">
    <div class="row between"><div><div class="ev-kicker">SAISON · encore ${evLeft(evSeasonEnds())}</div>
      <div class="ev-title">${esc(sz.n)}</div></div><div class="ev-pts"><b>${E.pts}</b><span>points</span></div></div>
    <div class="tiny muted" style="margin:5px 0 8px">${esc(sz.d)} ${esc(HABITATS[sz.hab].n)} rapporte des points doublés.</div>
    <div class="bar"><i style="width:${pct}%;background:${sz.c}"></i></div>
    <div class="tiny dim" style="margin-top:4px">${next ? `Palier ${tier + 1} à ${next.pts} points` : "Parcours complété"}</div>
    <div class="ev-track">${EV_TRACK.map((t, i)=>{
      const got = E.pts >= t.pts, claimed = E.claimed.includes(i);
      return `<div class="ev-step ${got ? "got" : ""} ${claimed ? "done" : ""} ${t.rw.title ? "final" : ""}">
        <b>${i + 1}</b><span>${esc(rwTxt(t.rw))}</span>
        ${got && !claimed ? `<button class="btn xs pri" data-act="evclaim" data-i="${i}">Réclamer</button>` : claimed ? `<em>✓</em>` : `<em>${t.pts}</em>`}</div>`;
    }).join("")}</div>
  </div>`;
}
function evCommunityPanel(){
  const E = evState(), w = evWeekKey(), mine = E.community[w] || 0;
  E.commClaimed = E.commClaimed || [];
  const online = typeof Net !== "undefined" && Net.configured();
  if(online) evCommunityRefresh(false);
  const total = EV_COMM_TOTAL;
  const top = EV_COMMUNITY[EV_COMMUNITY.length - 1].goal;
  return `<div class="ev-comm">
    <div class="row between"><div class="ev-kicker">OBJECTIF COLLECTIF · encore ${evLeft(evWeekEnds())}</div>
      ${online && total !== null ? `<span class="tiny dim">${EV_COMM_PLAYERS} archiviste(s)</span>` : ""}</div>
    <div class="ev-title">Défragmenter la faille ensemble</div>
    <div class="tiny muted" style="margin:4px 0 8px">Chaque K.O. dans la Brèche compte pour tous. Votre part cette semaine : <b>${fmt(mine)}</b>.</div>
    ${online && total !== null ? `<div class="ev-commbar">${EV_COMMUNITY.map((t, i)=>`<b style="left:${t.goal / top * 100}%" class="${total >= t.goal ? "on" : ""}"></b>`).join("")}
        <i style="width:${Math.min(100, total / top * 100)}%"></i></div>
      <div class="tiny mono-num" style="margin-top:4px">${fmt(total)} / ${fmt(top)} K.O.</div>
      <div class="ev-commrw">${EV_COMMUNITY.map((t, i)=>{
        const ok = total >= t.goal, cl = E.commClaimed.includes(w + ":" + i);
        return `<div class="${ok ? "ok" : ""}"><span>${esc(t.n)} · ${fmt(t.goal)}</span>
          ${ok && !cl && mine > 0 ? `<button class="btn xs pri" data-act="evcommclaim" data-i="${i}">Réclamer</button>` : cl ? "<em>✓</em>" : ""}</div>`; }).join("")}</div>
      ${mine > 0 ? "" : `<div class="tiny gold-t" style="margin-top:6px">Jouez une Brèche pour participer et recevoir les paliers.</div>`}`
    : `<div class="tiny gold-t">${online ? "Chargement…" : "Service en ligne non configuré : seule votre part est comptée."}</div>`}
  </div>`;
}
function evWeeklyPanel(){
  const id = evWeeklyLegend(), known = !!S.dex[id];
  return `<div class="ev-weekly">
    <span class="${known ? "" : "guardsil"}">${sprite(id, false, "sm")}</span>
    <div class="grow"><div class="ev-kicker">LÉGENDAIRE DE LA SEMAINE · encore ${evLeft(evWeekEnds())}</div>
      <div class="ev-title" style="font-size:12px">${known ? esc(POKE[id].name) : "Signature inconnue"}</div>
      <div class="tiny muted">Il surgit en écho vers la sixième minute de chaque Brèche. Le vaincre rapporte trois coffres et des points de saison.</div></div>
  </div>`;
}
