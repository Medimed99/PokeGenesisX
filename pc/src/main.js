/* ============================================================
   POKÉMON CODE GENESIS — VERSION PC
   Le jeu mobile tourne dans la même page (pc.html) : sa partie, ses
   règles, son compte en ligne. Ce client y ajoute un monde en 3D à
   la première personne : la Route 1, ses Pokémon sauvages, la pêche
   au lac, un dresseur rémanent. Tab ouvre le terminal (l'interface
   complète du jeu mobile), Échap la pause.
   ============================================================ */
import { Game } from "./game.js";

const game = new Game(document.getElementById("pc3d"));
window.PC = game;                                  /* pour les tests et la console */
game.start().catch(e=>{ console.error(e); game.fatal(e); });
