/* Les modèles 3D animés de la version PC : Kanto (151), Johto et Hoenn (152 à 386), et Porygon-Z (474).
   Kanto — source : les 151 modèles de Kanto du projet 06wj/pokemon (github.com/06wj/pokemon),
   tirés de Pokémon X/Y, au format glTF binaire, avec leurs animations (idle, walk, run,
   attack, happy, sleep). Les modèles restent la propriété de Nintendo / The Pokémon Company /
   Game Freak ; ce jeu de fan ne les vend ni ne les revendique.

   Johto et Hoenn — source : les modèles de Pokémon GO (paquets Unity du dépôt
   ChicoEevee/Pokemon-GO-AssetBundles), convertis par tools/go2glb.py en glTF animé (attente, marche,
   course, attaques physique et spéciale, touché, K.O., joie), avec leurs textures chromatiques.

   Utilisation (depuis pc/) :
     git clone --depth 1 --filter=blob:none --sparse https://github.com/06wj/pokemon ../.cache/06wj
     (cd ../.cache/06wj && git sparse-checkout set --no-cone 'public/models/0*' 'public/models/1*')
     # paquets GO : Pokemon/pmNNN_assets_all.bundle (+ pmNNN_shared_assets_all.bundle s'il existe ;
     # Zarbi : pm201.funown_a…, Spinda : pm327.f00…), convertis un par un :
     #   python3 -I tools/go2glb.py <paquet> ../.cache/go/NNN.glb ../.cache/go/s/NNN [<paquet _shared>]
     node tools/models3d.mjs ../.cache/06wj/public/models ../.cache/go
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
/* au-delà de Hoenn : Porygon-Z (474), le guide, qui descend vous chercher au fond de la faille */
export const EXTRA = [474];
const IDS = Array.from({length:386}, (_, i)=>i + 1).concat(EXTRA);

const src = process.argv[2], goSrc = process.argv[3];
if(!src || !existsSync(src)){ console.error("dossier des modèles source introuvable : node tools/models3d.mjs <…/public/models> [<modèles GO convertis>]"); process.exit(1); }
const OUT = new URL("../../web/assets/m3d/", import.meta.url).pathname;
const TMP = new URL("../../.cache/m3d-tmp/", import.meta.url).pathname;
mkdirSync(OUT, {recursive:true}); mkdirSync(TMP, {recursive:true});
for(const f of readdirSync(OUT)) if(f.endsWith(".glb")) unlinkSync(join(OUT, f));
mkdirSync(join(OUT, "s"), {recursive:true});
for(const f of readdirSync(join(OUT, "s"))) if(f.endsWith(".webp")) unlinkSync(join(OUT, "s", f));
const map = {}, shiny = {};
let total = 0;
for(const id of IDS){
  const n = String(id).padStart(3, "0"), go = id > 151;
  const input = go ? join(goSrc || "", id + ".glb") : join(src, n, "model.glb"), tmp = join(TMP, (go ? "go" : "") + n + ".glb");
  if(!existsSync(input)){ console.warn("absent :", n); continue; }
  if(!existsSync(tmp)) execFileSync("npx", ["--yes", "@gltf-transform/cli@4.5.1", "optimize", input, tmp, "--compress", "meshopt", "--texture-compress", "webp",
    "--texture-size", "512", "--simplify", "false", "--join", "false", "--flatten", "false", "--instance", "false", "--palette", "false"], {stdio:"ignore"});
  const buf = readFileSync(tmp), hash = createHash("sha1").update(buf).digest("hex").slice(0, 8);
  const name = `${n}.${hash}.glb`;
  writeFileSync(join(OUT, name), buf);
  map[id] = "assets/m3d/" + name;
  total += buf.length;
  console.log(`${n} → ${name} (${Math.round(buf.length / 1024)} Ko)`);
  /* les textures chromatiques de Pokémon GO : une image WebP par matériau */
  const sdir = go ? join(goSrc, "s", String(id)) : null;
  if(sdir && existsSync(sdir)){
    for(const f of readdirSync(sdir).filter(f=>f.endsWith(".png"))){
      const mat = f.replace(/\.png$/, ""), w = join(TMP, `go${n}.${mat}.webp`);
      if(!existsSync(w)) execFileSync("python3", ["-I", "-c", "import sys;from PIL import Image;im=Image.open(sys.argv[1]);im.thumbnail((512,512));im.save(sys.argv[2],'WEBP',quality=82,method=6)", join(sdir, f), w]);
      const wb = readFileSync(w), wh = createHash("sha1").update(wb).digest("hex").slice(0, 8), wn = `${n}.${mat}.${wh}.webp`;
      writeFileSync(join(OUT, "s", wn), wb);
      (shiny[id] = shiny[id] || {})[mat] = "assets/m3d/s/" + wn;
      total += wb.length;
    }
  }
}
writeFileSync(new URL("../src/data/models3d.js", import.meta.url).pathname,
`/* Généré par tools/models3d.mjs : les modèles 3D animés disponibles (numéro → fichier).
   Sources : 06wj/pokemon (Kanto, modèles de Pokémon X/Y) ; Pokémon GO (Johto, Hoenn, Porygon-Z), avec leurs animations.
   M3DS : les textures chromatiques de Pokémon GO (numéro → nom du matériau → image). */
export const M3D = ${JSON.stringify(map)};
export const M3DS = ${JSON.stringify(shiny)};
export const ROUTE1 = ${JSON.stringify(ROUTE1)};
export const LAKE1 = ${JSON.stringify(LAKE1)};
export const SENTINELS = ${JSON.stringify(SENTINELS)};
`);
console.log(`${Object.keys(map).length} modèles, ${Math.round(total / 1024)} Ko`);
