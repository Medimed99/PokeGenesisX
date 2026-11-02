/* Les modèles 3D animés de la version PC : les 151 Pokémon de Kanto.
   Source : les 151 modèles de Kanto du projet 06wj/pokemon (github.com/06wj/pokemon),
   tirés de Pokémon X/Y, au format glTF binaire, avec leurs animations (idle, walk, run,
   attack, happy, sleep). Les modèles restent la propriété de Nintendo / The Pokémon Company /
   Game Freak ; ce jeu de fan ne les vend ni ne les revendique.

   Utilisation (depuis pc/) :
     git clone --depth 1 --filter=blob:none --sparse https://github.com/06wj/pokemon ../.cache/06wj
     (cd ../.cache/06wj && git sparse-checkout set --no-cone 'public/models/0*' 'public/models/1*')
     node tools/models3d.mjs ../.cache/06wj/public/models
   Chaque modèle est allégé (géométrie compressée meshopt, textures WebP 512 px, animations
   rééchantillonnées), nommé par son empreinte, et listé dans src/data/models3d.js. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

/* repères gardés pour la route (herbes, lac) et les deux sentinelles ; tous les modèles de Kanto sont produits */
export const ROUTE1 = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 29, 32, 43, 69, 83, 113, 133, 143];
export const LAKE1 = [54, 60, 61, 72, 116, 117, 118, 119, 120, 121, 129, 130, 131];
export const SENTINELS = [145, 150];
const IDS = Array.from({length:151}, (_, i)=>i + 1);

const src = process.argv[2];
if(!src || !existsSync(src)){ console.error("dossier des modèles source introuvable : node tools/models3d.mjs <…/public/models>"); process.exit(1); }
const OUT = new URL("../../web/assets/m3d/", import.meta.url).pathname;
const TMP = new URL("../../.cache/m3d-tmp/", import.meta.url).pathname;
mkdirSync(OUT, {recursive:true}); mkdirSync(TMP, {recursive:true});
for(const f of readdirSync(OUT)) if(f.endsWith(".glb")) unlinkSync(join(OUT, f));
const map = {};
let total = 0;
for(const id of IDS){
  const n = String(id).padStart(3, "0"), input = join(src, n, "model.glb"), tmp = join(TMP, n + ".glb");
  if(!existsSync(input)){ console.warn("absent :", n); continue; }
  if(!existsSync(tmp)) execFileSync("npx", ["--yes", "@gltf-transform/cli@4.5.1", "optimize", input, tmp, "--compress", "meshopt", "--texture-compress", "webp",
    "--texture-size", "512", "--simplify", "false", "--join", "false", "--flatten", "false", "--instance", "false", "--palette", "false"], {stdio:"ignore"});
  const buf = readFileSync(tmp), hash = createHash("sha1").update(buf).digest("hex").slice(0, 8);
  const name = `${n}.${hash}.glb`;
  writeFileSync(join(OUT, name), buf);
  map[id] = "assets/m3d/" + name;
  total += buf.length;
  console.log(`${n} → ${name} (${Math.round(buf.length / 1024)} Ko)`);
}
writeFileSync(new URL("../src/data/models3d.js", import.meta.url).pathname,
`/* Généré par tools/models3d.mjs : les modèles 3D animés disponibles (numéro → fichier).
   Source : 06wj/pokemon (modèles de Pokémon X/Y, avec leurs animations). */
export const M3D = ${JSON.stringify(map)};
export const ROUTE1 = ${JSON.stringify(ROUTE1)};
export const LAKE1 = ${JSON.stringify(LAKE1)};
export const SENTINELS = ${JSON.stringify(SENTINELS)};
`);
console.log(`${Object.keys(map).length} modèles, ${Math.round(total / 1024)} Ko`);
