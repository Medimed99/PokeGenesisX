/* ============================================================
   LA RÉGION DE LA ZONE : KANTO, JOHTO, HOENN, OU LE MÉLANGE
   Sur mobile, l'onglet de la capture change les Pokémon qui
   apparaissent ; ici, c'est la grande carte (M, puis 1 à 4). La zone
   garde son décor : ce sont ses habitants qui changent — les sauvages,
   les poissons du lac et des eaux des biomes, ceux qui ne vivent que
   dans un biome. « Mix » tire une région au hasard à chaque apparition,
   parmi celles qu'on a ouvertes (le verrou est celui du jeu mobile :
   le gardien du cœur de la région d'avant).
   Le choix est gardé dans la partie (S.flags.pcRegion) : il ne touche
   pas à l'onglet du jeu mobile.
   ============================================================ */
const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };

export const PC_REGIONS = [
  {k:"kanto", n:"Kanto"},
  {k:"johto", n:"Johto"},
  {k:"hoenn", n:"Hoenn"},
  {k:"mix", n:"Mix"}
];

/* les régions ouvertes, dans l'ordre */
export function openRegions(){
  const R = ref("REGIONS") || [], ok = ref("regionUnlocked");
  return R.filter(r=>{ try { return !ok || ok(r.key); } catch(e){ return r.key === "kanto"; } }).map(r=>r.key);
}
export function regionOpen(k){
  const open = openRegions();
  return k === "mix" ? open.length > 1 : open.includes(k);
}
/* la position du sélecteur (une région fermée depuis — partie restaurée — ramène à Kanto) */
export function pcRegion(){
  const S = G() && G().S, k = S && S.flags && S.flags.pcRegion;
  return k && regionOpen(k) ? k : "kanto";
}
export function setPcRegion(k){
  const S = G() && G().S; if(!S || !regionOpen(k)) return false;
  if(pcRegion() === k) return false;
  S.flags.pcRegion = k; if(window.saveSoon) window.saveSoon();
  return true;
}
/* la région d'une apparition : la position du sélecteur, ou une au hasard pour le mélange */
export function rollRegion(){
  const k = pcRegion(); if(k !== "mix") return k;
  const open = openRegions();
  return open[Math.floor(Math.random() * open.length)] || "kanto";
}
/* les régions actives (une seule, ou toutes celles ouvertes) */
export function activeRegions(){ const k = pcRegion(); return k === "mix" ? openRegions() : [k]; }
/* à quelle région appartient un numéro du Pokédex */
export function regionOf(id){
  const R = ref("REGIONS") || [];
  const r = R.find(r=>id >= r.from && id <= r.to);
  return r ? r.key : null;
}
export function regionRange(k){ const r = (ref("REGIONS") || []).find(r=>r.key === k); return r ? [r.from, r.to] : [1, 151]; }
export const regionName = k => (PC_REGIONS.find(r=>r.k === k) || PC_REGIONS[0]).n;
