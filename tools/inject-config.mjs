/* Écrit web/config.js à partir des variables d'environnement Vercel.
   Node est toujours présent dans l'image de build, contrairement à Python :
   ce script garantit l'injection même si build_web.py n'a pas pu tourner. */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";

const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const key = (process.env.SUPABASE_ANON_KEY || "").trim();

if (!existsSync("web")) mkdirSync("web", { recursive: true });

writeFileSync("web/config.js",
`/* Généré au build depuis SUPABASE_URL et SUPABASE_ANON_KEY.
   Vide, le jeu reste jouable : le joueur saisit les valeurs dans Profil > En ligne. */
window.PCG_CONFIG = { url: ${JSON.stringify(url)}, key: ${JSON.stringify(key)} };
`);

console.log(url && key
  ? `config.js écrit — service en ligne préconfiguré (${url})`
  : "config.js écrit — service en ligne non configuré, saisie manuelle dans le jeu");
