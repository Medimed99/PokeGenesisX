import { Dex } from "@pkmn/sim";
import { writeFileSync } from "node:fs";
const h = new Array(387).fill(0), w = new Array(387).fill(0);
for(let n = 1; n <= 386; n++){
  const s = Dex.species.all().find(x=>x.num === n && !x.forme);
  if(s){ h[n] = s.heightm; w[n] = s.weightkg; }
}
const miss = h.map((v, i)=>i && !v ? i : 0).filter(Boolean);
writeFileSync(process.argv[2], `/* Généré depuis les données de @pkmn/sim (Pokémon Showdown) : taille (m) et poids (kg) par numéro.
   Sert à l'échelle des Pokémon dans le monde 3D : un Onix domine, un Roucool tient dans la main. */
export const HEIGHT = ${JSON.stringify(h)};
export const WEIGHT = ${JSON.stringify(w)};
`);
console.log("manquants :", miss.join(",") || "aucun", "· Onix", h[95], "· Roucool", h[16], "· Wailord", h[321], "· Pikachu", h[25]);
