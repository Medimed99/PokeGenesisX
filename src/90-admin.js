/* ============================================================
   90 — PANNEAU DE TEST
   Tous les raccourcis passent par les fonctions normales du jeu
   (gain, addToDex, addIntegrity...) : l'etat reste coherent et
   sauvegardable. Une marque est posee dans S.flags.testUsed.
   ============================================================ */

function admOn(){ return !!(S && S.settings && S.settings.admin); }
function admMark(){ S.flags.testUsed = true; }

function renderAdmFab(){
  const f = document.getElementById("admfab");
  if(!f) return;
  f.className = admOn() ? "on" : "";
  f.innerHTML = ic("gear");
  f.setAttribute("data-act", "admopen");
  f.setAttribute("aria-label", "Panneau de test");
}

ACTIONS.admtoggle = () => {
  if(!S.settings.admin && !ADMIN_OK){ ACTIONS.adminpass(); return; }
  S.settings.admin = !S.settings.admin;
  if(S.settings.admin) toast("Outils de test activés", "warn", "gear");
  save(); refresh();
};

/* le mot de passe est demande a la premiere ouverture de chaque session :
   une sauvegarde ou le panneau etait deja actif n'y echappe donc pas */
let ADMIN_OK = false;
ACTIONS.admopen = () => {
  if(!ADMIN_OK){ ADMIN_PENDING = true; ACTIONS.adminpass(); return; }
  const beaten = S.bosses.length, totalG = 9;
  sheet(`${sheetHead("Outils de test")}
    <div class="tiny muted" style="margin-bottom:10px">
      Raccourcis de développement. Ils utilisent les mêmes fonctions que le jeu :
      la sauvegarde reste valide. Les parties ayant utilisé ces outils sont marquées.
    </div>

    <div class="adm">
      <div class="h sm">MONNAIES</div>
      <div class="admgrid">
        <button class="btn" data-act="admcur" data-c="coins" data-n="10000">+10k PokéCoins</button>
        <button class="btn" data-act="admcur" data-c="coins" data-n="250000">+250k</button>
        <button class="btn" data-act="admcur" data-c="shards" data-n="500">+500 Fragments</button>
        <button class="btn" data-act="admcur" data-c="cores" data-n="25">+25 Noyaux</button>
        <button class="btn" data-act="admcur" data-c="energy" data-n="100000">+100k Énergie</button>
        <button class="btn" data-act="admrich">Tout au maximum</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">PROGRESSION — niveau ${S.level}</div>
      <div class="admgrid">
        <button class="btn" data-act="admlvl" data-n="1">+1 niveau</button>
        <button class="btn" data-act="admlvl" data-n="5">+5</button>
        <button class="btn" data-act="admlvl" data-n="20">+20</button>
        <button class="btn" data-act="admxp" data-n="0.5">+50% XP</button>
        <button class="btn" data-act="admunlock">Débloquer modules</button>
        <button class="btn" data-act="admlvlset" data-n="1">Revenir niv.1</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">INTÉGRITÉ — ${S.integrity.toFixed(1)}%</div>
      <div class="admgrid">
        <button class="btn" data-act="admint" data-n="5">+5%</button>
        <button class="btn" data-act="admint" data-n="25">+25%</button>
        <button class="btn" data-act="admintset" data-n="99.5">Mettre à 99.5%</button>
        <button class="btn" data-act="admintset" data-n="100">Mettre à 100%</button>
        <button class="btn" data-act="admintset" data-n="0">Remettre à 0</button>
        <button class="btn" data-act="admcorrupt">Aperçu corruption</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">POKÉDEX — ${dexTotal()} / 386</div>
      <div class="admgrid">
        <button class="btn" data-act="admdex" data-n="10">+10 espèces</button>
        <button class="btn" data-act="admdex" data-n="60">+60 espèces</button>
        <button class="btn" data-act="admdexreg">Remplir ${esc(regionDef(S.region).name)}</button>
        <button class="btn" data-act="admdexall">Remplir tout</button>
        <button class="btn" data-act="admshiny">+5 chromatiques</button>
        <button class="btn" data-act="admteamlvl">Équipe niveau 70</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">OBJETS</div>
      <div class="admgrid">
        <button class="btn" data-act="admballs">+99 de chaque ball</button>
        <button class="btn" data-act="admberries">+50 baies</button>
        <button class="btn" data-act="admstones">Toutes les pierres</button>
        <button class="btn" data-act="admitems">+50 objets combat</button>
        <button class="btn" data-act="admcards">Toutes les cartes</button>
        <button class="btn" data-act="admcos">Tous cosmétiques</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">VERROUS — ${beaten} / ${totalG} gardiens</div>
      <div class="admgrid">
        <button class="btn" data-act="admboss1">Vaincre le suivant</button>
        <button class="btn" data-act="admbossall">Vaincre tous</button>
        <button class="btn" data-act="admbossreset">Réinitialiser</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">RENCONTRE</div>
      <div class="row" style="gap:6px;margin-bottom:6px">
        <input id="adm-id" type="text" inputmode="numeric" placeholder="N° 1-386" style="flex:1">
        <button class="btn sm" data-act="admspawn">Faire apparaître</button>
      </div>
      <div class="admgrid">
        <button class="btn" data-act="admspawnrand" data-s="1">Chromatique</button>
        <button class="btn" data-act="admspawnrand" data-s="0" data-r="5">Légendaire</button>
        <button class="btn" data-act="admmissing">MissingNo</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">COMPAGNON ET HEBDOMADAIRES</div>
      <div class="admgrid">
        <button class="btn" data-act="admbuddy">Compagnon aléatoire</button>
        <button class="btn" data-act="admaff" data-n="300">+300 affinité</button>
        <button class="btn" data-act="admweek">Relancer la semaine</button>
        <button class="btn" data-act="admweekdone">Compléter la semaine</button>
        <button class="btn" data-act="admchest" data-k="big">Ouvrir une archive</button>
        <button class="btn" data-act="admchest" data-k="void">Archive du Vide</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">OBJETS, JALONS ET CYCLE</div>
      <div class="admgrid">
        <button class="btn" data-act="admboost">Tous les boosts</button>
        <button class="btn" data-act="admlucky">Jour faste</button>
        <button class="btn" data-act="admtreasure">+ Trésors</button>
        <button class="btn" data-act="admheld">Tous objets tenus</button>
        <button class="btn" data-act="admradar">+5 Radars</button>
        <button class="btn" data-act="admtiers">Paliers du secteur</button>
        <button class="btn" data-act="admcontract">Remplir le contrat</button>
        <button class="btn" data-act="admzero" data-n="40">+40 Noyaux Zéro</button>
        <button class="btn" data-act="admendgame">État de fin de cycle</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">TEMPS ET ÉVÉNEMENTS</div>
      <div class="admgrid">
        <button class="btn" data-act="admday">Passer au lendemain</button>
        <button class="btn" data-act="admquests">Relancer les quêtes</button>
        <button class="btn" data-act="admevent">Lancer un événement</button>
        <button class="btn" data-act="admoffline">Simuler 8h d'absence</button>
        <button class="btn" data-act="admquestdone">Compléter les quêtes</button>
        <button class="btn" data-act="admach">Vérifier les succès</button>
      </div>
    </div>

    <div class="adm">
      <div class="h sm">RÉCIT — ${S.story.length} / ${STORY.length} scènes</div>
      <div class="wrap" style="margin-bottom:7px">
        ${STORY.map(s=>`<button class="chip ${S.story.includes(s.id)?"on":""}"
          data-act="admstory" data-id="${s.id}">${esc(s.id)}</button>`).join("")}
      </div>
      <button class="btn wide sm" data-act="admstoryreset">Oublier toutes les scènes</button>
    </div>

    <button class="btn dan wide" data-act="admtoggle">Désactiver les outils de test</button>`);
};

/* ---------- actions ---------- */
function admDone(msg){
  admMark(); save(); toast(msg || "Appliqué", "warn", "gear");
  closeSheet(); refresh();
}

ACTIONS.admcur = d => { gain(d.c, +d.n); admDone(`+${fmt(+d.n)} ${CUR_NAME[d.c]}`); };
ACTIONS.admrich = () => {
  gain("coins", 5000000); gain("shards", 50000); gain("cores", 500); gain("energy", 1000000);
  admDone("Coffres remplis");
};
ACTIONS.admlvl = d => { for(let i=0;i<+d.n;i++) addXp(xpForLevel(S.level) - S.xp); admDone(`Niveau ${S.level}`); };
ACTIONS.admxp = d => { addXp(Math.round(xpForLevel(S.level) * +d.n)); admDone("XP ajoutée"); };
ACTIONS.admlvlset = d => { S.level = +d.n; S.xp = 0; admDone(`Niveau ${S.level}`); };
ACTIONS.admunlock = () => {
  if(S.level < 15){ S.level = 15; S.xp = 0; }
  if(dexTotal() < 25) admFillDex(25);
  if(S.team.length < 3) S.team = ownedSorted().slice(0,3);
  if(!S.stats.expWins) S.stats.expWins = 1;          /* prerequis des verrous */
  if(!S.flags.eggFound){ grantEgg("e_common"); S.flags.eggReveal = null; }
  if(!S.bosses.length) admBeatNext();
  admDone("Tous les modules accessibles");
};
ACTIONS.admint = d => { addIntegrity(+d.n); admDone(`Intégrité ${S.integrity.toFixed(1)}%`); };
ACTIONS.admintset = d => {
  S.integrity = clamp(+d.n, 0, 100);
  applyCorruption(); Bus.emit("integrity", S.integrity);
  admDone(`Intégrité ${S.integrity.toFixed(1)}%`);
};
ACTIONS.admcorrupt = () => {
  closeSheet();
  let v = 0;
  const id = setInterval(()=>{
    v += 4;
    document.documentElement.style.setProperty("--corrupt", (Math.abs(Math.sin(v/40))).toFixed(3));
    if(v > 250){ clearInterval(id); applyCorruption(); }
  }, 40);
  toast("Balayage de l'effet de corruption", "warn", "eye");
};

function admFillDex(n){
  const miss = [];
  for(let i=1;i<=386;i++) if(!S.dex[i]) miss.push(i);
  for(const id of shuffle(miss).slice(0, n)) addToDex(id, Math.max(20, S.level*2), false);
}
ACTIONS.admdex = d => { admFillDex(+d.n); admDone(`${dexTotal()} espèces archivées`); };
ACTIONS.admdexreg = () => {
  const r = regionDef(S.region);
  for(let i=r.from;i<=r.to;i++) if(!S.dex[i]) addToDex(i, Math.max(20, S.level*2), false);
  admDone(`${r.name} complété`);
};
ACTIONS.admdexall = () => {
  for(let i=1;i<=386;i++) if(!S.dex[i]) addToDex(i, Math.max(30, S.level*2), false);
  admDone("Pokédex complet");
};
ACTIONS.admshiny = () => {
  const owned = Object.keys(S.dex).map(Number).filter(id=>!S.dex[id].shiny);
  for(const id of shuffle(owned).slice(0,5)){ S.dex[id].shiny = true; S.dex[id].s++; S.stats.shinies++; }
  admDone("5 chromatiques ajoutés");
};
ACTIONS.admteamlvl = () => {
  for(const id of Object.keys(S.dex)) S.dex[id].lvl = Math.max(S.dex[id].lvl, 70);
  admDone("Collection au niveau 70");
};
ACTIONS.admballs = () => { for(const k in BALLS) S.balls[k] = (S.balls[k]||0) + 99; admDone("Balls ajoutées"); };
ACTIONS.admberries = () => { for(const k in BERRIES) S.berries[k] = (S.berries[k]||0) + 50; admDone("Baies ajoutées"); };
ACTIONS.admstones = () => { for(const k in STONES) S.stones[k] = (S.stones[k]||0) + 10; admDone("Pierres ajoutées"); };
ACTIONS.admitems = () => { S.items.potion = (S.items.potion||0)+50; S.items.revive = (S.items.revive||0)+50;
  admDone("Objets de combat ajoutés"); };
ACTIONS.admcards = () => {
  for(const id of CARD_MONS) for(const s of cardVariants(id)) grantCardV(s, id);
  grantSecretCard();
  admDone("Collection de cartes complète");
};
ACTIONS.admcos = () => { for(const id in COSMETICS) if(!S.cos.owned.includes(id)) S.cos.owned.push(id);
  admDone("Cosmétiques débloqués"); };

function admBeatGuardian(r, i){
  const g = r.guardians[i];
  const key = guardianKey(r.key, g.id);
  if(S.bosses.includes(key)) return false;
  S.bosses.push(key);
  S.stats.bossWins++;
  addToDex(g.id, guardianLevel(r, i), false);
  addIntegrity(g.core ? 5 : 2.5);
  grantCardV(rollCardSeries(g.id, g.core ? 3.2 : 1.8), g.id);
  return true;
}
function admBeatNext(){
  for(const r of REGIONS)
    for(let i=0;i<r.guardians.length;i++)
      if(admBeatGuardian(r, i)) return r.guardians[i].name;
  return null;
}
ACTIONS.admboss1 = () => { const n = admBeatNext(); admDone(n ? n + " relâché" : "Tous les verrous sont déjà levés"); };
ACTIONS.admbossall = () => {
  for(const r of REGIONS) for(let i=0;i<r.guardians.length;i++) admBeatGuardian(r, i);
  admDone("Les neuf verrous sont levés");
};
ACTIONS.admbossreset = () => { S.bosses = []; admDone("Verrous réinitialisés"); };

ACTIONS.admspawn = () => {
  const v = parseInt(document.getElementById("adm-id")?.value || "", 10);
  if(!v || !POKE[v]){ toast("Numéro invalide (1-386)", "bad", "cross"); return; }
  S.region = regionOf(v);
  newEncounter({id:v, rar:POKE[v].rar});
  admMark(); closeSheet(); go("capture");
};
ACTIONS.admspawnrand = d => {
  const wantShiny = d.s === "1";
  const r = regionDef(S.region);
  let pool = [];
  for(let i=r.from;i<=r.to;i++) if(POKE[i] && (d.r ? POKE[i].rar === +d.r : true)) pool.push(i);
  if(!pool.length) for(let i=r.from;i<=r.to;i++) pool.push(i);
  const id = pick(pool);
  newEncounter({id, rar:POKE[id].rar});
  if(wantShiny && ENC){ ENC.shiny = true; Sfx.shiny(); }
  admMark(); closeSheet(); go("capture");
};
ACTIONS.admmissing = () => {
  ENC = {id:0, level:0, shiny:false, rar:5, missing:true, attempts:0};
  admMark(); closeSheet(); go("capture");
};

ACTIONS.admday = () => {
  const d = new Date(Date.now() - 864e5);
  S.daily.day = ""; S.questDay = "";
  S.login.last = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
  S.login.claimed = ""; S.pokebox.last = "";
  dailyRollover();
  admDone("Nouveau jour simulé");
};
ACTIONS.admquests = () => { rollQuests(); admDone("Quêtes relancées"); };
ACTIONS.admquestdone = () => {
  for(const q of S.quests||[]) q.prog = q.goal;
  admDone("Quêtes complétées");
};
ACTIONS.admevent = () => { rollEvent(true); admDone("Événement : " + (S.event?S.event.n:"—")); };
ACTIONS.admoffline = () => {
  S.lastSeen = Date.now() - 8*3600*1000;
  admMark(); closeSheet();
  if(!showOfflineReport()) toast("Aucune production hors ligne (achetez un générateur)", "bad", "cross");
};
ACTIONS.admach = () => { checkAchievements(); admDone("Succès vérifiés"); };
ACTIONS.admboost = () => { for(const k in BOOSTS) startBoost(k); admDone("Tous les boosts actifs"); };
ACTIONS.admlucky = () => {
  const big = LUCKY_DAYS.filter(d=>d.big);
  S.luckyDay = pick(big).id; S.luckyDayOn = today(); S.luckySeen = false;
  admMark(); closeSheet(); showLuckyDay();
};
ACTIONS.admtreasure = () => {
  S.treasures = S.treasures || {};
  for(const k in TREASURES) S.treasures[k] = (S.treasures[k]||0) + 3;
  admDone("Trésors ajoutés");
};
ACTIONS.admheld = () => { for(const k in HELD_ITEMS) grantHeld(k); admDone("Objets tenus débloqués"); };
ACTIONS.admradar = () => { S.items.radar = (S.items.radar||0) + 5; admDone("Radars ajoutés"); };
ACTIONS.admtiers = () => {
  const r = regionDef(S.region);
  for(let i=r.from;i<=r.to;i++) if(!S.dex[i]) addToDex(i, Math.max(20, S.level*2), false);
  admMark(); closeSheet();
  if(!checkRegionTiers()) toast("Paliers déjà obtenus", "bad", "cross");
};
ACTIONS.admcontract = () => {
  contractRollover();
  S.contract.prog = S.contract.goal;
  admDone("Contrat rempli");
};
ACTIONS.admzero = d => { S.zero = (S.zero||0) + (+d.n); admDone("Noyaux Zéro ajoutés"); };
ACTIONS.admendgame = () => {
  for(let i=1;i<=386;i++) if(!S.dex[i]) addToDex(i, 60, false);
  for(const r of REGIONS) for(let i=0;i<r.guardians.length;i++) admBeatGuardian(r, i);
  S.integrity = 100; applyCorruption();
  S.flags.climax = true; S.flags.zero = true;
  if(!S.story.includes("climax")) S.story.push("climax");
  if(!S.story.includes("epilogue")) S.story.push("epilogue");
  admDone("Cycle prêt à être bouclé");
};
ACTIONS.admbuddy = () => {
  const ids = ownedSorted();
  if(!ids.length){ admFillDex(5); }
  setBuddy(pick(ownedSorted()));
  admDone("Compagnon assigné");
};
ACTIONS.admaff = d => {
  if(!buddy()){ const ids = ownedSorted(); if(ids.length) setBuddy(ids[0]); }
  const b = buddy();
  if(!b){ toast("Archivez d'abord une espèce", "bad", "cross"); return; }
  for(let i=0;i<+d.n;i++) buddyTick(0);
  admDone("Affinité " + buddyTier());
};
ACTIONS.admweek = () => { rollWeekly(); admDone("Semaine relancée"); };
ACTIONS.admweekdone = () => {
  weeklyRollover();
  for(const q of S.weekly.quests) q.prog = q.goal;
  admDone("Objectifs hebdomadaires complétés");
};
ACTIONS.admchest = d => {
  admMark(); closeSheet();
  const items = openChest(d.k);
  save();
  revealSheet(CHESTS[d.k].name.toUpperCase(), items, {sub:"Ouverture forcée (test)"});
};
ACTIONS.admstory = d => {
  admMark(); closeSheet();
  playStory(d.id, ()=>{ refresh(); });
};
ACTIONS.admstoryreset = () => { S.story = []; S.flags.climax = false; S.flags.zero = false;
  admDone("Récit réinitialisé"); };
