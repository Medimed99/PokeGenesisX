/* ============================================================
   script.js — exporte le script complet du récit vers SCRIPT.md

   node script.js            → écrit SCRIPT.md à la racine
   node script.js --stdout   → l'affiche sans rien écrire

   Tout est lu dans le code du jeu (src/) : scènes, cinématiques
   écrites à la main, pages de journal, arc de la faille, fichier
   de Porygon-Z. Le script reste donc toujours fidèle au jeu : on
   modifie une scène dans src/, on relance, c'est à jour.
   Valeurs d'exemple : première connexion (n° 12), nom « ‹nom› ».
   ============================================================ */
const noop = () => {};
const El = () => ({style:{setProperty:noop}, classList:{add:noop, remove:noop, toggle:noop, contains:()=>false},
  appendChild:noop, remove:noop, querySelectorAll:()=>[], querySelector:()=>null, innerHTML:"", textContent:"",
  dataset:{}, children:[], firstChild:null, scrollTop:0, scrollHeight:0, select:noop, focus:noop, addEventListener:noop,
  getContext:()=>null, toDataURL:()=>""});
global.document = {addEventListener:noop, getElementById:()=>null, createElement:El, documentElement:{style:{setProperty:noop}},
  head:{appendChild:noop}, body:El(), readyState:"loading", querySelectorAll:()=>[], querySelector:()=>null, execCommand:noop, hidden:false};
global.window = {addEventListener:noop}; global.navigator = {}; global.Image = function(){};
global.URL = {createObjectURL:()=>""}; global.Blob = function(){}; global.AudioContext = undefined;
global.setInterval = () => 0; global.requestAnimationFrame = () => 0;

const fs = require("fs");
global.SCRIPT_EXPORT = true;          /* les échos de la fin s'exportent avec toutes leurs variantes */
const ORDER = fs.readFileSync(__dirname + "/build.py", "utf8").match(/ORDER = \[([\s\S]*?)\]/)[1]
  .split(",").map(x=>x.trim().replace(/'/g, "")).filter(Boolean);
eval(ORDER.map(f=>fs.readFileSync(__dirname + "/src/" + f, "utf8")).join("\n") +
  "\n;global.G={newState,setS:v=>{S=v},STORY,STORY_ACTS,STORY_TITLES,MAIN_ARC,CINEMAS,FRAGMENTS,RIFT_ARC,PZ_FILE,PZ_FILE_OLD," +
  "ROOM_MOMENTS,pzFmt,pzName,pzMask,sagaConn,nameBytes,hex2,FN_MONTAGE_BASE,STORY_Q,STORY_Q_ORDER,ONZE,POKE,creditsRollHtml:typeof creditsRollHtml==='function'?creditsRollHtml:null};");

/* ---------- l'état d'exemple ---------- */
const S0 = G.newState(); S0.name = "‹nom›"; S0.flags.named = true; S0.flags.firstMon = 4;
/* ce que Porygon-Z a retenu, pour l'exemple : quarante et un jours, un Pikachu en compagnon */
S0.buddy = {id:25, aff:0, since:Date.now(), finds:0}; S0.stats.catches = 1840; S0.created = Date.now() - 40 * 864e5;
G.setS(S0);
const F = t => G.pzFmt(String(t || ""));

/* ---------- les voix ---------- */
const WHO = {sys:"SYSTÈME", pz:"PORYGON-Z", prof:"PROF. RACINE", bad:"MISSINGNO", past:"L'ARCHIVISTE D'AVANT", me:"MISSINGNO, AVEC TON NOM"};
const line = (w, t, mem) => {
  const txt = F(t).replace(/\n/g, " ");
  const pre = mem ? "*(souvenir)* " : "";
  if(!w) return `${pre}*${txt}*`;
  return `${pre}**${WHO[w] || w.toUpperCase()}** — ${txt}`;
};
const BG = {labo:"le laboratoire", terminal:"le terminal", faille:"la faille", void:"le noir", souvenir:"un souvenir (sépia)",
  zero:"la Couche Zéro", capture:"les hautes herbes"};
const MUSIC = {couche_zero:"Couche Zéro", verite:"La vérité", souvenir:"Souvenir", generique:"Générique"};

/* ---------- une cinématique, temps par temps ---------- */
function beats(list, out, st){
  for(const b of list || []){
    switch(b.t){
      case "par": beats(b.beats, out, st); break;
      case "say": out.push(line(b.who, b.text, b.mem || st.mem)); break;
      case "card": out.push(`> **[ ${F(b.text)} ]**${b.sub ? ` — *${F(b.sub)}*` : ""}`); break;
      case "code": {
        const L = typeof b.lines === "function" ? b.lines() : (b.lines || []);
        out.push("```\n" + L.map(F).join("\n") + "\n```"); break;
      }
      case "bg": if(BG[b.k]) out.push(`*(Décor : ${BG[b.k]}.)*`); break;
      case "music": if(MUSIC[b.k]) out.push(`*(Musique : « ${MUSIC[b.k]} ».)*`); break;
      case "mem": st.mem = b.on !== false; out.push(st.mem ? "*(Souvenir. L'image passe au sépia.)*" : "*(Retour au présent.)*"); break;
      case "montage": {
        const items = typeof b.items === "function" ? b.items() : (b.items || []);
        out.push("*(Montage — les fins des connexions passées, de plus en plus vite :)*");
        out.push(items.map(([t, s, c])=>`- ${F(t)} — ${F(s || "")}${c ? " — `" + c + "`" : ""}`).join("\n"));
        break;
      }
      case "name": {
        const n = "Sacha", bytes = G.nameBytes(n).concat([0x50]).map(G.hex2).join(" ");
        out.push(`*(Le nom de l'Archiviste s'écrit, lettre par lettre, avec ses octets — par exemple « ${n} » : \`${bytes}\` — puis il est relu comme l'espèce n° 000 : la silhouette en L de MissingNo apparaît, faite de ces octets.)*`);
        break;
      }
      case "dex": out.push(`> **[ POKÉDEX — N° 387 — PORYGON-Z ]** — *${F(b.desc || "Programme d'entretien. A tout compté, {prev} fois. Écrit avec le nom de {nom}. Se souvient de tout.")}*`); break;
      case "credits": out.push("*(Générique de fin — voir plus bas.)*"); break;
      case "ask": out.push(line(b.who, b.text) + "  \n*(Le joueur écrit son nom.)*"); break;
      case "echo": {
        const Q = G.STORY_Q[b.q];
        for(const [k, v] of Object.entries(b.map)){
          const o = Q && Q.opts.find(x=>x.k === k);
          out.push(`*(Si tu avais répondu « ${o ? o.say : k} » :)*  \n` + [].concat(v).map(t=>line("pz", t)).join("  \n"));
        }
        break;
      }
      case "choice": {
        out.push(`**CHOIX** ${b.title ? "— " + F(b.title) + " " : ""}*(${b.quick ? "toucher une réponse" : "maintenir la ligne pour la valider"})*`);
        for(const o of b.opts) out.push(`- \`> ${o.cmd}\` — ${F(o.sub || "")}${o.isNew ? " *(nouvelle ligne)*" : ""}`);
        for(const o of b.opts){
          const br = (b.branches || {})[o.k]; if(!br) continue;
          out.push(`\n**Si ${o.cmd} :**\n`);
          const sub = []; beats(br, sub, {mem:false});
          out.push(sub.map(x=>"> " + x.replace(/\n/g, "\n> ")).join("\n>\n"));
        }
        break;
      }
      default: break;
    }
  }
}
function cineText(c){
  const out = [], st = {mem:false};
  for(const shot of c.shots || []){
    if(shot.bg && BG[shot.bg]) out.push(`*(Décor : ${BG[shot.bg]}.)*`);
    beats(shot.beats, out, st);
  }
  return out;
}

/* ---------- le déclencheur d'une scène de la chaîne ---------- */
function trigger(id){
  const b = G.MAIN_ARC.find(x=>x.id === id);
  if(!b) return null;
  const src = b.ok.toString().replace(/^\(\)\s*=>\s*/, "").replace(/\s+/g, " ").trim();
  const kind = b.ev ? "événement (se joue dès que la condition est remplie)" : "palier (dans l'ordre, après une pause de 75 s depuis la scène précédente)";
  return `\`${src}\` — ${kind}${b.mem ? ` · souvenir, vers ${b.at} % d'intégrité` : ""}`;
}

/* ---------- le document ---------- */
const md = [];
md.push(`# Pokémon Code Genesis — le script complet

> Généré par \`node script.js\` à partir du code du jeu (\`src/\`). Pour corriger une réplique, on la corrige dans \`src/\`, puis on relance : ce fichier suit.
> Exemple de lecture : première connexion du joueur (n° 12), nom « ‹nom› ». Les nombres (« onze », « douze »…) suivent la connexion en cours.
> La bible du récit — ce que chaque scène révèle et pourquoi — est dans \`RECIT.md\`.
`);
md.push("## Sommaire\n");
for(const A of G.STORY_ACTS){
  const list = G.STORY.filter(sc=>A.act === null ? sc.act === undefined : sc.act === A.act);
  if(list.length) md.push(`- **${A.n} — ${A.t}** : ${list.map(sc=>G.STORY_TITLES[sc.id] || sc.id).join(" · ")}`);
}
md.push("- **Les pages de journal** · **La faille** · **choses_formidables.txt** · **Les salles** · **Le générique**\n");

for(const A of G.STORY_ACTS){
  const list = G.STORY.filter(sc=>A.act === null ? sc.act === undefined : sc.act === A.act);
  if(!list.length) continue;
  md.push(`\n---\n\n## ${A.n} — ${A.t}\n`);
  for(const sc of list){
    const title = G.STORY_TITLES[sc.id] || sc.id;
    const hand = G.CINEMAS[sc.id];
    md.push(`### ${title}  \`${sc.id}\`${hand ? " — cinématique" : sc.mem ? " — souvenir de Porygon-Z" : ""}\n`);
    const tr = trigger(sc.id);
    if(tr) md.push(`*Déclencheur :* ${tr}\n`);
    if(hand){
      const c = typeof hand === "function" ? hand() : hand;
      md.push(cineText(c).join("\n\n") + "\n");
    } else {
      let mem = false;
      const out = [];
      for(const l of sc.lines){
        if(l.q){
          const Q = G.STORY_Q[l.q];
          out.push(`**QUESTION DE PORYGON-Z** — ${F(Q.title)} *(toucher une réponse ; aucune n'est mauvaise, Porygon-Z s'en souviendra à la fin)*`);
          for(const o of Q.opts) out.push(`- \`> ${o.cmd}\` — ${F(o.sub)}`);
          for(const o of Q.opts) out.push(`\n**Si ${o.cmd} :**\n\n` + Q.then[o.k].map(x=>"> " + line(x.w || "", x.t)).join("\n>\n"));
          continue;
        }
        if(l.mem && !mem){ mem = true; out.push("*(Souvenir. L'image passe au sépia.)*"); }
        if(!l.mem && mem){ mem = false; out.push("*(Retour au présent.)*"); }
        if(l.when){
          const [q, k] = l.when.split(":"), o = G.STORY_Q[q] && G.STORY_Q[q].opts.find(x=>x.k === k);
          out.push(`*(Si tu as répondu « ${o ? o.say : k} » :)* ` + line(l.w || "", l.t, false));
          continue;
        }
        out.push(line(l.w || "", l.t, false));
      }
      md.push(out.join("\n\n") + "\n");
    }
  }
}

md.push(`\n---\n\n## Les pages de journal\n\nOnze pages, une par connexion passée. Elles se trouvent dans l'ordre, chacune là où son auteur a travaillé. La signature est illisible — autant de signes que ton nom — jusqu'à ce que MissingNo se lise. Porygon-Z ne les commente qu'une fois son premier aveu fait (\`pz_mem3\`).\n`);
for(const f of G.FRAGMENTS){
  const at = f.at.dex !== undefined ? `${f.at.dex} espèces au Pokédex` : `${f.at.integ} % d'intégrité`;
  md.push(`### ${f.n} — connexion ${String(f.conn).padStart(2, "0")} · ${f.day}\n\n*Trouvée :* ${f.place} · *à partir de :* ${at}\n\n> ${F(f.t)}\n\n**PORYGON-Z** — ${F(f.react)}\n`);
}

md.push(`\n---\n\n## Les Pokémon des onze\n\nChaque archiviste d'avant avait donné un surnom à un Pokémon. Une fois sa page trouvée (et le premier souvenir de Porygon-Z vécu), ce Pokémon finit par revenir dans une rencontre ordinaire, teinté comme un souvenir, son surnom au-dessus de lui : au moins vingt rencontres entre deux revenants, puis une chance sur dix, et forcément à la quarante-cinquième. Il ne fuit pas et se capture sans peine. Capturé, il garde son surnom au Pokédex et dans l'équipe (et à l'évolution). À la révélation, la mémoire de l'Archiviste les nomme, dans l'ordre : « Des surnoms. Vitefait. Minuit… C'est toi qui les leur avais donnés. Chaque fois. »\n`);
for(const o of G.ONZE){
  md.push(`### « ${o.nick} » — ${G.POKE[o.id].name} · connexion ${String(o.c).padStart(2, "0")}\n\n*À la rencontre :* **PORYGON-Z** — ${F(o.seen)}\n\n> ${F(o.mem)}\n\n**PORYGON-Z** — ${F(o.got)}\n`);
}

md.push(`\n---\n\n## La faille — l'arc de MissingNo\n\nSix étapes, une par rencontre marquante avec MissingNo dans les hautes herbes. Il apprend à parler ; il connaît ta main, puis ton nom.\n`);
for(const r of G.RIFT_ARC){
  md.push(`### Étape ${r.n}\n\n` + r.lines.map(l=>line(l.w || "", l.t)).join("\n\n") + "\n");
}

md.push(`\n---\n\n## choses_formidables.txt\n\nLe fichier de Porygon-Z. Il s'écrit de ce que le joueur fait réellement (une ligne par cap, une fois par connexion). Les ${"4 212"} lignes héritées des connexions passées sont illisibles jusqu'à la révélation.\n\n### Ce qu'il note\n`);
for(const [k, fn] of Object.entries(G.PZ_FILE)){
  let t = ""; try { t = fn({mon:"Salamèche", n:30, g:"Artikodin", r:"Kanto"}); } catch(e){}
  md.push(`- \`${k}\` — ${F(t)}`);
}
md.push(`\n### Les lignes héritées, lisibles après la révélation\n`);
for(const [c, d, t] of G.PZ_FILE_OLD) md.push(`- **C.${String(c).padStart(2, "0")} · jour ${d || "???"}** — ${F(t)}`);

md.push(`\n---\n\n## Les salles qui s'ouvrent\n`);
for(const [k, m] of Object.entries(G.ROOM_MOMENTS)) md.push(`- **${m.n}** — *${m.sub}*  \n  **PORYGON-Z** — ${F(m.line)}`);

if(G.creditsRollHtml){
  const html = G.creditsRollHtml();
  const txt = html.replace(/<div class="ccr-k">([^<]*)<\/div>/g, "\n**$1** — ").replace(/<small>/g, " *").replace(/<\/small>/g, "*")
    .replace(/<br>/g, " · ").replace(/<[^>]+>/g, "").replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim();
  md.push(`\n---\n\n## Le générique\n\n${txt.split("\n").map(s=>s.trim()).filter(Boolean).join("\n\n")}\n`);
}

const doc = md.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
if(process.argv.includes("--stdout")) process.stdout.write(doc);
else { fs.writeFileSync(__dirname + "/SCRIPT.md", doc); console.log("SCRIPT.md écrit — " + doc.length + " caractères, " + G.STORY.length + " scènes."); }
