/* Inventaire de tout le texte adressé au joueur, et repérage des dérives
   de vocabulaire : un même concept désigné par plusieurs mots. */
const fs = require("fs");
const files = fs.readdirSync("src").filter(f=>f.endsWith(".js"));
let all = [];
for(const f of files){
  const s = fs.readFileSync("src/"+f, "utf8");
  /* on ne garde que les chaînes de plus de 25 caractères contenant des espaces
     et au moins une lettre accentuée ou un mot français courant */
  for(const m of s.matchAll(/["'`]([^"'`\n]{25,300})["'`]/g)){
    const t = m[1];
    if(!/[a-zéèêàçûôî]/.test(t)) continue;
    if(/^[a-z-]+:|^\d|^#|function|=>|\$\{|<\/|px|rgba|linear-gradient/.test(t)) continue;
    if(!/ (le|la|les|de|des|du|un|une|tu|te|ton|ta|tes|est|qui|que|pas|ne) /i.test(t)) continue;
    all.push({f, t});
  }
}
console.log("phrases adressées au joueur :", all.length);
const words = all.map(x=>x.t).join(" ").toLowerCase();
const total = words.split(/\s+/).length;
console.log("mots au total                :", total);
console.log();

/* familles de synonymes : chacune devrait n'avoir qu'un seul mot dominant */
const FAM = {
  "l'acte de capturer": ["restaur", "captur", "réécri", "reindex", "réindex", "archiv"],
  "l'individu":         ["entité", "signature", "spécimen", "occurrence", "individu"],
  "l'espèce":           ["espèce", "définition", "ligne", "enregistrement"],
  "le lieu":            ["secteur", "couche", "strate", "région", "zone"],
  "l'adversaire":       ["verrou", "gardien", "noyau", "pare-feu"],
  "l'état du monde":    ["intégrité", "cohérence", "corruption", "stabilité"],
  "la réserve":         ["tampon", "rebut", "archive", "cache", "vivier"],
  "la suite":           ["chaîne", "série", "combo", "enchaînement"]
};
for(const [concept, list] of Object.entries(FAM)){
  const counts = list.map(w=>[w, (words.match(new RegExp(w,"g"))||[]).length])
                     .filter(x=>x[1] > 0).sort((a,b)=>b[1]-a[1]);
  const sum = counts.reduce((a,b)=>a+b[1], 0);
  const dom = counts[0] ? Math.round(counts[0][1]/sum*100) : 0;
  const flag = counts.length > 2 && dom < 62 ? "  ← DISPERSÉ" : "";
  console.log(`${concept.padEnd(22)} ${counts.map(c=>c[0]+":"+c[1]).join("  ")}${flag}`);
}
console.log();
/* les mots du jeu d'origine sont-ils présents ? */
const POKEWORDS = ["pokémon","pokédex","capturer","dresseur","évolu","ball","badge","chromatique"];
console.log("ancrage dans le vocabulaire Pokémon :");
for(const w of POKEWORDS){
  const n = (words.match(new RegExp(w,"g"))||[]).length;
  console.log(`  ${w.padEnd(12)} ${n}`);
}
console.log();
/* phrases les plus longues : candidates au raccourcissement */
const longest = all.slice().sort((a,b)=>b.t.length-a.t.length).slice(0,6);
console.log("phrases les plus longues :");
for(const l of longest) console.log(`  [${l.f}] ${l.t.slice(0,110)}…`);
