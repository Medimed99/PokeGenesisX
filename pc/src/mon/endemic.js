/* ============================================================
   CEUX QUI NE VIVENT QUE LÀ
   Chaque biome garde quelques espèces pour lui, dans chaque région :
   on ne les croise nulle part ailleurs dans la zone de capture.
   Ailleurs, le tirage du jeu mobile qui en sort une est remplacé par
   une autre espèce de même rareté et de même région ; dans le biome,
   elles reviennent plus souvent (une fois sur trois, à rareté égale).
   La région suit le sélecteur de la grande carte (region.js) ; en
   « Mix », toutes celles qu'on a ouvertes. La pêche de chaque biome
   suit la même règle (ponds.js n'y met que ses propres résidents).
   ============================================================ */
import { activeRegions, regionOf, regionRange } from "./region.js";
const G = () => window.PCG;

export const ENDEMIC = {
  kanto:{
    foret:[123, 127, 46, 47, 48, 49, 114, 102, 103],     /* Insécateur, Scarabrute, Paras, Mimitoss, Saquedeneu, Noeunoeuf */
    eaux:[86, 87, 124, 79, 80, 131],                      /* Otaria, Lamantine, Lippoutou, Ramoloss, Lokhlass */
    grotte:[95, 104, 105, 111, 112, 50, 51],              /* Onix, Osselait, Rhinocorne, Taupiqueur */
    ruines:[92, 93, 94, 63, 64, 96, 97, 122, 137],        /* Fantominus, Abra, Soporifik, M. Mime, Porygon */
    foyer:[58, 59, 77, 78, 126, 125, 100, 101, 106, 107]  /* Caninos, Ponyta, Magmar, Élektek, Voltorbe, les Kicks */
  },
  johto:{
    foret:[165, 166, 167, 168, 193, 204, 205, 214, 187, 188],   /* Coxy, Mimigal, Yanma, Pomdepik, Scarhino, Granivol */
    eaux:[183, 184, 220, 221, 225, 226],                        /* Marill, Marcacrin, Cadoizo, Démanta */
    grotte:[185, 207, 208, 231, 232, 246, 247, 227],            /* Simularbre, Scorplane, Steelix, Phanpy, Embrylex, Airmure */
    ruines:[177, 178, 198, 200, 201, 202, 203, 215],            /* Natu, Cornèbre, Feuforêve, Zarbi, Qulbutoké, Girafarig, Farfuret */
    foyer:[179, 180, 181, 228, 229, 218, 219, 237]              /* Wattouat, Malosse, Limagma, Kapoera */
  },
  hoenn:{
    foret:[285, 286, 273, 274, 275, 315, 331, 332, 290, 291],   /* Balignon, Grainipiot, Rosélia, Cacnea, Ningale */
    eaux:[278, 279, 361, 362, 363, 364, 365, 366],              /* Goélise, Stalgamin, Obalie, Coquiperl */
    grotte:[304, 305, 306, 299, 303, 328, 337, 338],            /* Galekid, Tarinor, Mysdibule, Kraknoix, Séléroc, Solaroc */
    ruines:[353, 354, 355, 356, 302, 280, 281, 325, 326, 359],  /* Polichombr, Skelénox, Ténéfix, Tarsal, Spoink, Absol */
    foyer:[296, 297, 307, 308, 309, 310, 311, 312]              /* Makuhita, Méditikka, Dynavolt, Posipi, Négapi */
  }
};
const HOME = {};
for(const r in ENDEMIC) for(const k in ENDEMIC[r]) for(const id of ENDEMIC[r][k]) HOME[id] = k;
export const endemicHome = id => HOME[id] || null;
/* les résidents d'un biome, pour les régions actives (ou une seule) */
export function residents(k, regs = activeRegions()){ const out = []; for(const r of regs) if(ENDEMIC[r] && ENDEMIC[r][k]) out.push(...ENDEMIC[r][k]); return out; }

/* le tirage, corrigé selon l'endroit (S.habitat est déjà celui du lieu, S.region celle du tirage) */
export function placeSpecies(spec, hab){
  const g = G(); if(!g || !spec || spec.missing || !spec.id) return spec;
  const P = g.POKE, home = HOME[spec.id], reg = regionOf(spec.id);
  /* dans son biome : un résident de même rareté et de même région, une fois sur trois */
  const mine = reg && ENDEMIC[reg] && ENDEMIC[reg][hab];
  if(mine && !home && Math.random() < 0.3){
    const c = mine.filter(i=>P[i] && P[i].rar === spec.rar);
    if(c.length) return swap(spec, c[Math.floor(Math.random() * c.length)]);
  }
  if(!home || home === hab) return spec;
  /* hors de chez lui : un autre, de même rareté, d'ici */
  const pick = g.ref("speciesForRarity");
  for(let k = 0; k < 6 && pick; k++){ const id = pick(spec.rar); if(id && !HOME[id]) return swap(spec, id); }
  const isEx = g.ref("isExclusive") || (()=>false), out = [], [a, b] = regionRange(reg || "kanto");
  for(let i = a; i <= b; i++) if(P[i] && P[i].rar === spec.rar && P[i].leg === 0 && !HOME[i] && !isEx(i)) out.push(i);
  return out.length ? swap(spec, out[Math.floor(Math.random() * out.length)]) : spec;
}
function swap(spec, id){ return Object.assign({}, spec, {id, featured:false}); }

/* combien on en a déjà : pour la bannière du biome et la carte */
export function endemicCount(k){
  const L = residents(k), S = G() && G().S; if(!L.length || !S) return null;
  return {have:L.filter(i=>S.dex[i]).length, n:L.length};
}
