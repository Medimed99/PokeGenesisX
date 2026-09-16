/* Test de bout en bout de la couche en ligne.
   Un faux serveur reproduit les endpoints Supabase utilises : auth par code,
   upsert de sauvegarde avec garde de revision, classement, echanges. */

const noop = () => {};
function El(id){ return {id,style:{setProperty:noop,display:""},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  appendChild:noop,remove:noop,removeChild:noop,querySelectorAll:()=>[],insertBefore:noop,
  set innerHTML(v){this._h=String(v)},get innerHTML(){return this._h||""},
  textContent:"",value:(El._v&&El._v[id])||"",dataset:{},children:[],firstChild:null,scrollTop:0,scrollHeight:0,
  select:noop,focus:noop,onclick:null,className:"",disabled:false,checked:false,
  setAttribute:noop,getAttribute:()=>null,removeAttribute:noop,addEventListener:noop,offsetWidth:100,
  getBoundingClientRect:()=>({left:0,top:0,width:120,height:120,right:120,bottom:120})}; }
El._v = {};
global.document={addEventListener:noop,getElementById:id=>El(id),createElement:()=>El("x"),
  documentElement:{style:{setProperty:noop}},head:{appendChild:noop},body:El("body"),
  readyState:"complete",querySelectorAll:()=>[],querySelector:()=>null,execCommand:noop,hidden:false};
global.window={addEventListener:noop}; global.navigator={}; global.requestAnimationFrame=f=>{f();return 0};
global.URL={createObjectURL:()=>""}; global.Blob=function(){}; global.Image=function(){};
global.setTimeout=(f)=>0; global.setInterval=()=>0; global.clearInterval=noop; global.clearTimeout=noop;
global.AbortController=function(){ this.signal=null; this.abort=noop; };

/* ---------------- faux serveur ---------------- */
const SRV = {
  url:"https://demo.supabase.co", key:"anon_key_de_test_suffisamment_longue",
  users:{}, saves:{}, trades:{}, tokenSeq:0, tokens:{},
  expireNext:false, lastOtp:null,
  reset(){ this.users={}; this.saves={}; this.trades={}; this.tokenSeq=0; this.tokens={}; this.expireNext=false; }
};
function mkSession(email){
  const u = SRV.users[email] || (SRV.users[email] = {id:"uid-"+Object.keys(SRV.users).length});
  SRV.tokenSeq++;
  const at = "at-" + SRV.tokenSeq;
  SRV.tokens[at] = u.id;            /* chaque jeton designe un utilisateur precis */
  return {access_token:at, refresh_token:"rt-"+u.id, user:{id:u.id, email}};
}
function ok(body){ return {ok:true, status:200, text:async()=>JSON.stringify(body===undefined?null:body)}; }
function err(status, msg){ return {ok:false, status, text:async()=>JSON.stringify({message:msg})}; }

global.fetch = async (url, opt) => {
  const u = String(url).replace(SRV.url, "");
  const body = opt.body ? JSON.parse(opt.body) : null;
  const auth = (opt.headers && opt.headers.Authorization) || "";
  const bearer = auth.replace("Bearer ", "");


  if(u.startsWith("/auth/v1/otp")){ SRV.lastOtp = "123456"; return ok({}); }
  if(u.startsWith("/auth/v1/verify")){
    if(body.token !== SRV.lastOtp) return err(400, "Token has expired or is invalid");
    /* certains projets n'acceptent que « signup » pour une premiere connexion */
    if(SRV.requireType && body.type !== SRV.requireType)
      return err(400, "Email link is invalid or has expired");
    return ok(mkSession(body.email));
  }
  if(u.startsWith("/auth/v1/token")){
    const uid = String(body.refresh_token).replace("rt-","");
    const email = Object.keys(SRV.users).find(e=>SRV.users[e].id===uid);
    if(!email) return err(400, "refresh invalide");
    SRV.expireNext = false;
    return ok(mkSession(email));
  }

  /* toutes les routes REST exigent un jeton utilisateur valide */
  const isRest = u.startsWith("/rest/");
  if(isRest){
    if(SRV.expireNext){ return err(401, "JWT expired"); }
    if(!bearer.startsWith("at-") || !SRV.tokens[bearer]) return err(401, "no auth");
  }
  /* l'utilisateur courant se deduit du jeton, jamais d'un ordre d'insertion */
  const uid = SRV.tokens[bearer] || null;

  if(u.startsWith("/rest/v1/saves?") && (opt.method||"GET") === "GET"){
    const m = u.match(/user_id=eq\.([^&]+)/);
    const row = SRV.saves[m ? m[1] : uid];
    return ok(row ? [row] : []);
  }
  if(u.startsWith("/rest/v1/saves") && opt.method === "POST"){
    const r = body[0];
    const prev = SRV.saves[r.user_id];
    if(prev && r.rev < prev.rev) return err(400, "revision inferieure");
    SRV.saves[r.user_id] = Object.assign({}, r, {updated_at:new Date().toISOString()});
    return ok([SRV.saves[r.user_id]]);
  }
  if(u.startsWith("/rest/v1/leaderboard")){
    const metric = (u.match(/order=([a-z_]+)\.desc/) || [,"integrity"])[1];
    /* la vue SQL n'expose que les colonnes demandees : le faux serveur fait pareil */
    const cols = decodeURIComponent((u.match(/select=([^&]+)/)||[,""])[1]).split(",").filter(Boolean);
    const rows = Object.values(SRV.saves).slice()
      .sort((a,b)=>(b[metric]||0)-(a[metric]||0))
      .map(r => cols.length ? Object.fromEntries(cols.map(c=>[c, r[c]])) : r);
    return ok(rows);
  }
  if(u.startsWith("/rest/v1/rpc/offer_card")){
    /* meme contrat que la fonction SQL : cle complete, verification du doublon */
    const key = String(body.p_key || "");
    const series = key.split(":")[0], species = parseInt(key.split(":")[1], 10);
    if(!["art","g5","g3","g2","g1","mn"].includes(series) || !(species >= 1 && species <= 386))
      return err(400, "carte invalide : " + key);
    const row = SRV.saves[uid];
    const dup = row && row.payload.cards && row.payload.cards[key]
              ? (row.payload.cards[key].dup||0) : 0;
    if(dup < 1) return err(400, "aucun exemplaire supplementaire de cette illustration");
    const code = "CODE" + (Object.keys(SRV.trades).length + 1);
    SRV.trades[code] = {code, from_user:uid, card_key:key, species, series, claimed_by:null};
    row.payload.cards[key].dup = dup - 1;
    return ok([{code}]);
  }
  if(u.startsWith("/rest/v1/rpc/claim_card")){
    const t = SRV.trades[String(body.p_code).toUpperCase()];
    if(!t || t.claimed_by) return err(400, "code inconnu, deja utilise");
    if(t.from_user === uid) return err(400, "code emis par vous-meme");
    t.claimed_by = uid;
    return ok([{card_key:t.card_key, species:t.species, series:t.series}]);
  }
  if(u.startsWith("/rest/v1/trades")){
    return ok(Object.values(SRV.trades));
  }
  return err(404, "route inconnue : " + u);
};

/* ---------------- chargement du jeu ---------------- */
const fs = require("fs");
const ORDER=['_dexblob.js','_atlas.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js',
 '30-capture.js','35-modules.js','40-battle.js','50-expedition.js','60-poker.js','70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','78-milestones.js','80-guide.js','85-journal.js',
,'90-admin.js','95-online.js','99-boot.js'];
eval(ORDER.map(f=>fs.readFileSync("src/"+f,"utf8")).join("\n") +
 "\n;global.G={Net:Net,newState:newState,setS:v=>S=v,getS:()=>S,SCREENS:SCREENS,ACTIONS:ACTIONS," +
 "netCompare:netCompare,netSummary:netSummary,addToDex:addToDex,grantCardV:grantCardV,grantSecretCard:grantSecretCard,cardVariants:cardVariants,cardHas:cardHas,cardOwnedCount:cardOwnedCount,cardTotal:cardTotal,CARD_MONS:CARD_MONS,CARD_SERIES_DEF:CARD_SERIES_DEF,CARD_ORDER:CARD_ORDER,rollCardSeries:rollCardSeries,randomCard:randomCard,migrateCards:migrateCards,CARD_INDEX:CARD_INDEX," +
 "setScreen:n=>currentScreen=n,dexTotal:dexTotal,Store:Store,netStart:netStart,netAutoSync:netAutoSync,netSetBoard:netSetBoard};");

const A = G;
let pass=0, fail=0, errs=[];
const t = async (n, fn) => { try { await fn(); pass++; } catch(e){ fail++; errs.push(n+" -> "+e.message); } };
const must = (c, m) => { if(!c) throw new Error(m||"condition non remplie"); };

(async () => {
  /* --- non configuré --- */
  A.Store.del("pcg.net.cfg"); A.Store.del("pcg.net.session");
  A.Net.load();
  A.setS(A.newState());
  await t("non configuré : aucun appel possible", async ()=>{
    must(!A.Net.configured(), "devrait etre non configure");
    let threw = false;
    try { await A.Net.pull(); } catch(e){ threw = true; }
    must(threw, "un appel non configure doit echouer proprement");
  });
  await t("écran rendu dans chaque état", async ()=>{
    A.setScreen("online");
    for(const tab of ["compte","sync","board","trade"]){
      A.ACTIONS.nettab({t:tab});
      const h = A.SCREENS.online.html();
      must(typeof h === "string" && h.length > 40, "html vide pour " + tab);
      must(!/undefined|\[object Object\]/.test(h), "sortie suspecte pour " + tab);
    }
  });

  /* --- configuration et connexion --- */
  SRV.reset();
  await t("configuration enregistrée et persistante", async ()=>{
    A.Net.setCfg(SRV.url, SRV.key);
    must(A.Net.configured());
    A.Net.load();
    must(A.Net.cfg.url === SRV.url && A.Net.cfg.key === SRV.key, "configuration non relue");
  });
  await t("code refusé si incorrect", async ()=>{
    await A.Net.requestCode("joueur@test.fr");
    let threw = false;
    try { await A.Net.verifyCode("joueur@test.fr", "000000"); } catch(e){ threw = true; }
    must(threw, "un mauvais code doit etre refuse");
    must(!A.Net.signedIn(), "pas de session apres echec");
  });
  await t("connexion quand le projet exige le type « signup »", async ()=>{
    SRV.requireType = "signup";
    await A.Net.requestCode("nouveau@test.fr");
    await A.Net.verifyCode("nouveau@test.fr", SRV.lastOtp);
    must(A.Net.signedIn(), "la connexion doit aboutir malgre le type impose");
    A.Net.signOut();
    delete SRV.users["nouveau@test.fr"];
    SRV.requireType = null;
  });
  await t("connexion par code à usage unique", async ()=>{
    await A.Net.requestCode("joueur@test.fr");
    await A.Net.verifyCode("joueur@test.fr", SRV.lastOtp);
    must(A.Net.signedIn(), "session absente");
    must(A.Net.userId(), "identifiant absent");
  });
  await t("session persistée puis relue", async ()=>{
    const id = A.Net.userId();
    A.Net.load();
    must(A.Net.signedIn() && A.Net.userId() === id, "session perdue au rechargement");
  });

  /* --- sauvegarde --- */
  const S0 = A.getS();
  S0.name = "TESTEUR"; S0.level = 12; S0.integrity = 42.5;
  A.addToDex(25, 30, false); A.addToDex(6, 40, true);
  S0.stats.bestStreak = 33; S0.expedition = {bidon:true}; S0.poker = {bidon:true};

  await t("envoi : révision incrémentée", async ()=>{
    const rev = await A.Net.push();
    must(rev === 1, "revision attendue 1, obtenue " + rev);
    must(A.getS().netRev === 1, "revision locale non mise a jour");
  });
  await t("le run en cours n'est pas synchronisé", async ()=>{
    const remote = await A.Net.pull();
    must(remote, "pas de ligne distante");
    must(!remote.payload.expedition && !remote.payload.poker, "un run en cours a ete envoye");
    must(remote.payload.dex && remote.payload.dex[25], "le pokedex n'a pas ete envoye");
  });
  await t("colonnes de vitrine renseignées", async ()=>{
    const remote = await A.Net.pull();
    const row = SRV.saves[A.Net.userId()];
    must(row.name === "TESTEUR" && row.level === 12, "nom ou niveau absent");
    must(row.dex_count === 2, "nombre d'especes incorrect : " + row.dex_count);
    must(row.shinies === 1, "chromatiques distincts incorrects : " + row.shinies);
    must(row.integrity === 42.5 && row.best_streak === 33, "statistiques incorrectes");
  });
  await t("le serveur refuse une révision inférieure", async ()=>{
    const row = SRV.saves[A.Net.userId()];
    row.rev = 9;
    A.getS().netRev = 2;
    let threw = false;
    try { await A.Net.push(); } catch(e){ threw = true; }
    must(threw, "le garde de revision n'a pas joue");
    row.rev = 1; A.getS().netRev = 1;
  });

  /* --- conflit --- */
  await t("comparaison de révisions", async ()=>{
    must(A.netCompare(null) === "push", "absence de distant : envoyer");
    must(A.netCompare({rev:5}) === "pull", "distant plus recent : recuperer");
    must(A.netCompare({rev:0}) === "push", "local plus recent : envoyer");
    must(A.netCompare({rev:1}) === "same", "revisions egales");
  });
  await t("récupérer la version distante remplace l'état", async ()=>{
    const distant = A.newState();
    distant.name = "AUTRE"; distant.level = 40; distant.integrity = 88;
    SRV.saves[A.Net.userId()] = Object.assign({}, SRV.saves[A.Net.userId()], {rev:7, payload:distant});
    const remote = await A.Net.pull();
    must(A.netCompare(remote) === "pull");
    A.Net._pending = remote;
    A.ACTIONS.netkeepremote();
    must(A.getS().name === "AUTRE", "etat non remplace");
    must(A.getS().netRev === 7, "revision non reprise");
    must(A.getS().quests !== undefined, "les cles manquantes n'ont pas ete completees");
  });

  /* --- jeton expiré --- */
  await t("jeton expiré : rafraîchi puis requête rejouée", async ()=>{
    SRV.expireNext = true;
    const remote = await A.Net.pull();
    must(remote !== undefined, "la requete n'a pas abouti apres rafraichissement");
    must(A.Net.signedIn(), "session perdue apres rafraichissement");
  });

  /* --- classement --- */
  await t("classement trié sur la métrique demandée", async ()=>{
    SRV.saves["autre-1"] = {user_id:"autre-1", name:"A", level:5,  integrity:10, dex_count:9,
      shinies:0, best_streak:2, best_ante:0, cards:0, guardians:0, tested:false, payload:{}, rev:1};
    SRV.saves["autre-2"] = {user_id:"autre-2", name:"B", level:50, integrity:99, dex_count:300,
      shinies:20, best_streak:80, best_ante:8, cards:9, guardians:9, tested:true, payload:{}, rev:1};
    const rows = await A.Net.leaderboard("integrity", 25);
    must(rows.length >= 2, "classement vide");
    must(rows[0].integrity >= rows[1].integrity, "tri incorrect");
    must(rows.every(r => r.payload === undefined), "le payload ne doit jamais transiter");
    const byDex = await A.Net.leaderboard("dex_count", 25);
    must(byDex[0].dex_count >= byDex[1].dex_count, "tri par pokedex incorrect");
  });
  await t("rendu du classement", async ()=>{
    A.ACTIONS.nettab({t:"board"});
    const rows = await A.Net.leaderboard("integrity", 25);
    A.netSetBoard(rows);
    const h = A.SCREENS.online.html();
    must(h.includes("lb-rank"), "lignes de classement absentes");
  });

  /* --- échanges --- */
  await t("proposer sans doublon est refusé", async ()=>{
    A.getS().cards = {"g3:150":{t:Date.now(), dup:0}};
    await A.Net.push();
    let threw = false;
    try { await A.Net.offerCard("g3:150"); } catch(e){ threw = true; }
    must(threw, "une carte sans doublon ne doit pas etre proposable");
    threw = false;
    try { await A.Net.offerCard("zz:999"); } catch(e){ threw = true; }
    must(threw, "une cle mal formee doit etre refusee");
  });
  await t("proposer un doublon produit un code unique", async ()=>{
    A.getS().cards = {"g3:150":{t:Date.now(), dup:2}};
    await A.Net.push();
    const r1 = await A.Net.offerCard("g3:150");
    const c1 = (Array.isArray(r1) ? r1[0] : r1).code;
    must(c1 && c1.length >= 4, "code absent");
    const r2 = await A.Net.offerCard("g3:150");
    const c2 = (Array.isArray(r2) ? r2[0] : r2).code;
    must(c1 !== c2, "codes en double");
    const row = SRV.saves[A.Net.userId()];
    must(row.payload.cards["g3:150"].dup === 0, "le doublon n'a pas ete decremente cote serveur");
  });
  await t("un autre Archiviste réclame la carte, une seule fois", async ()=>{
    const code = Object.keys(SRV.trades)[0];
    const emetteur = A.Net.userId();

    /* on ne peut pas reclamer son propre code : il faut un second compte */
    let threw = false;
    try { await A.Net.claimCard(code); } catch(e){ threw = true; }
    must(threw, "un code emis par soi-meme doit etre refuse");

    await A.Net.requestCode("recepteur@test.fr");
    await A.Net.verifyCode("recepteur@test.fr", SRV.lastOtp);
    must(A.Net.userId() !== emetteur, "second compte non distinct");

    const r = await A.Net.claimCard(code);
    const row = Array.isArray(r) ? r[0] : r;
    must(row.species === 150 && row.series === "g3", "illustration incorrecte");
    must(row.card_key === "g3:150", "cle de carte incorrecte");

    threw = false;
    try { await A.Net.claimCard(code); } catch(e){ threw = true; }
    must(threw, "un code doit etre a usage unique");
  });
  await t("code inconnu refusé", async ()=>{
    let threw = false;
    try { await A.Net.claimCard("INEXISTANT"); } catch(e){ threw = true; }
    must(threw);
  });

  /* --- deconnexion --- */
  await t("déconnexion purge la session sans toucher à la partie", async ()=>{
    const nom = A.getS().name;
    A.Net.signOut();
    must(!A.Net.signedIn(), "session persistante apres deconnexion");
    must(A.getS().name === nom, "la partie locale a ete modifiee");
    must(A.Store.get("pcg.net.session") === null, "jeton encore stocke");
    must(A.Net.configured(), "la configuration ne doit pas etre effacee");
  });
  await t("synchronisation automatique inoffensive hors connexion", async ()=>{
    A.netAutoSync();
    A.netStart();
  });

  console.log(errs.map(e=>"  ECHEC: "+e).join("\n"));
  console.log(`\n${pass} verifications reussies, ${fail} echecs`);
  process.exit(fail ? 1 : 0);
})();
