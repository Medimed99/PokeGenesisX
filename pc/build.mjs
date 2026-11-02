/* Construit le client 3D : un seul fichier JS minifié, au nom à empreinte (mis en cache
   indéfiniment, jamais périmé), dans web/pc/. build_web.py l'insère dans web/pc.html.
   node build.mjs          → version minifiée
   node build.mjs --dev    → version lisible, avec carte des sources */
import * as esbuild from "esbuild";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dev = process.argv.includes("--dev");
const outDir = path.join(here, "..", "web", "pc");
const res = await esbuild.build({
  entryPoints:[path.join(here, "src", "main.js")], bundle:true, minify:!dev, format:"iife", target:"es2020",
  write:false, legalComments:"eof", sourcemap:dev ? "inline" : false, logLevel:"warning"
});
const code = res.outputFiles[0].text;
const h = createHash("sha1").update(code).digest("hex").slice(0, 8);
fs.mkdirSync(outDir, {recursive:true});
for(const f of fs.readdirSync(outDir)) if(/^game\.[0-9a-f]{8}\.js$/.test(f)) fs.unlinkSync(path.join(outDir, f));
fs.writeFileSync(path.join(outDir, `game.${h}.js`), code);
fs.writeFileSync(path.join(outDir, "build.json"), JSON.stringify({js:`pc/game.${h}.js`, bytes:code.length}, null, 2));
console.log(`client 3D : pc/game.${h}.js (${(code.length / 1024).toFixed(0)} Ko${dev ? ", lisible" : ""})`);
