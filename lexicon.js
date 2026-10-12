/* Conformité au lexique. Chaque concept a UN mot ; les autres sont des fautes.
   Ce test existe parce que le vocabulaire avait dérivé sans que personne
   ne s'en aperçoive : cinq verbes se disputaient l'acte de capturer. */
const fs = require("fs");
const files = fs.readdirSync("src").filter(f=>f.endsWith(".js"));

/* mots proscrits, et ce qu'il faut écrire à la place */
const BANNED = [
  [/\bzones?\b/i,            "secteur"],
  [/\bvivier\b/i,            "réserve"],
  [/\bcache d'échange\b/i,   "archive d'échange"],
  [/\bdésindexée?s? à nouveau\b/i, "s'est enfui"],
  [/\bconteneurs?\b/i,       "Ball"],
];
/* le texte doit rester ancré : ces mots ne peuvent pas disparaître */
const REQUIRED = {
  "pokémon": 20, "pokédex": 10, "ball": 8, "chromatique": 10, "chaîne": 12
};

let text = [];
for(const f of files){
  const s = fs.readFileSync("src/"+f, "utf8");
  for(const m of s.matchAll(/["'`]([^"'`\n]{25,300})["'`]/g)){
    const t = m[1];
    if(!/[a-zéèêàçûôî]/.test(t)) continue;
    if(/^[a-z-]+:|^\d|^#|function|=>|\$\{|<\/|px|rgba|linear-gradient/.test(t)) continue;
    if(/^[a-z][\w-]*$|data-act|class=|id="/.test(t)) continue;   /* jamais un identifiant */
    if(!/ (le|la|les|de|des|du|un|une|tu|te|ton|ta|tes|est|qui|que|pas|ne) /i.test(t)) continue;
    text.push({f, t});
  }
}
const blob = text.map(x=>x.t).join(" ").toLowerCase();

let fail = 0;
console.log("MOTS PROSCRITS");
for(const [re, fix] of BANNED){
  const hits = text.filter(x=>re.test(x.t));
  if(hits.length){
    fail++;
    console.log(`  ÉCHEC  ${re} → écrire « ${fix} »`);
    for(const h of hits.slice(0,3)) console.log(`         [${h.f}] ${h.t.slice(0,80)}…`);
  }
}
if(!fail) console.log("  aucun");

console.log("\nANCRAGE MINIMAL");
for(const [w, min] of Object.entries(REQUIRED)){
  const n = (blob.match(new RegExp(w, "g")) || []).length;
  const ok = n >= min;
  if(!ok) fail++;
  console.log(`  ${ok?"ok    ":"ÉCHEC "} ${w.padEnd(13)} ${String(n).padStart(3)} / ${min} minimum`);
}

console.log(`\n${text.length} phrases, ${blob.split(/\s+/).length} mots — ${fail} manquement(s)`);
process.exit(fail ? 1 : 0);
