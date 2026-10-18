/* ============================================================
   38c — CE QUE CACHENT LES FOUILLES
   Plus de matériaux, et plus de surprises. Inspirations : le
   Souterrain de Diamant et Perle (la variété des trouvailles),
   Terraria et Deep Rock Galactic (les caisses, les filons),
   Mr. Mine (les géodes et les météorites).

   · FILON — une veine de minerai : 5 à 9 du minerai de la couche.
   · GÉODE — des cristaux : des Fragments, parfois un minerai rare.
   · SACHET DE BONBONS, POKÉ BALLS ENFOUIES, BAIES FOSSILISÉES —
     de quoi nourrir l'équipe, capturer, préparer un lancer.
   · CARTOUCHE FÊLÉE — un morceau d'archive : de l'Intégrité.
   · MÉTÉORITE — dans les couches profondes et au Pic Météore :
     de la Rêvite.
   · TROIS CAISSES, rares, qui s'ouvrent en grand : en bois, en
     fer, et la caisse d'archiviste — Noyaux, Bonbons, et parfois
     une carte légendaire ou une Master Ball.
   ============================================================ */

/* ---------- les dessins, en pixels ---------- */
const DIG_ART = {
  vein:{g:["RRRRRRRRRRRR", "RRHRRRRRRHRR", "ROOHRRRRROHR", "RROOOHRROORR", "RRRROOOOORRR", "RHRRRROOHRRR", "RRRRRRRHRRRR", "RRRRRRRRRRRR"]},
  geode:{g:["..RRRR..", ".RPPPPR.", "RPLQQLPR", "RPQLLQPR", "RPQLLQPR", "RPLQQLPR", ".RPPPPR.", "..RRRR.."],
         p:{R:"#5a4a40", P:"#8a5ad0", L:"#f0d8ff", Q:"#b06bff"}},
  candy:{g:["........", "PP....PP", "PPPCCPPP", "PPCWCCPP", "PPCCCCPP", "PPPCCPPP", "PP....PP", "........"],
         p:{P:"#ff9ad8", C:"#ff4fa8", W:"#ffffff"}},
  balls:{g:["............", ".KKKK..KKKK.", "KRRRRKKBBBBK", "KRWRRKKBWBBK", "KKKWKKKKKWKK", "KWWWWKKWWWWK", ".KKKK..KKKK.", "............"],
         p:{K:"#1a1a22", R:"#e04040", B:"#3a78e0", W:"#f4f4f4"}},
  berries:{g:["...G....", "..GG..G.", ".BBB.GG.", "BBWBBBB.", "BBBBBBWB", ".BB.BBBB", "....BBB.", "........"],
         p:{B:"#5a6ad8", W:"#c8d0ff", G:"#3a8a3a"}},
  cartridge:{g:["..KKKKKKKK..", ".KGGGGGGGGK.", ".KGWWWWWWGK.", ".KGWCCCCWGK.", ".KGWWWWWWGK.", ".KGGGGGGGGK.", ".KGKGKGKGGK.", "..KKKKKKKK.."],
         p:{K:"#2a2a32", G:"#a8a8b0", W:"#e8e8e0", C:"#ff3d7f"}},
  meteor:{g:["..KKKK..", ".KDDVDK.", "KDVLVDDK", "KDDVDDVK", "KVDDDVDK", "KDDLVDDK", ".KDDDDK.", "..KKKK.."],
         p:{K:"#120c1c", D:"#2a2038", V:"#b06bff", L:"#f0d0ff"}},
  crate:{g:["KKKKKKKKKKKK", "KLLLLLLLLLLK", "KMDMMMMMMDMK", "KLLDLLLLDLLK", "KMMMDMMDMMMK", "KLLLLDDLLLLK",
            "KMMMMDDMMMMK", "KLLLDLLDLLLK", "KMMDMMMMDMMK", "KLDLLLLLLDLK", "KMMMMMMMMMMK", "KKKKKKKKKKKK"]}
};
const CRATE_PAL = [
  {K:"#3a2210", L:"#c8884a", M:"#a86a34", D:"#6a4020"},
  {K:"#22262e", L:"#b8c0ca", M:"#8a939e", D:"#4a525c"},
  {K:"#0a0614", L:"#3a1f66", M:"#2b1650", D:"#35f0d6"}
];
const CRATE_NAMES = ["Caisse en bois", "Caisse de fer", "Caisse d'archiviste"];
const CRATE_COLORS = ["#c8884a", "#b8c0ca", "#35f0d6"];
function digArtOf(k, si){
  if(k === "vein"){ const o = oreDef(oreOf(si)); return {g:DIG_ART.vein.g, p:{R:"#6a5a48", O:o.pal[1], H:o.pal[0]}}; }
  if(k === "crate0" || k === "crate1" || k === "crate2") return {g:DIG_ART.crate.g, p:CRATE_PAL[+k.slice(5)]};
  return DIG_ART[k] || null;
}
/* le même dessin, sur le canvas de la fouille ou en image dans les résultats */
function digArtDraw(x, art, X, Y, w, h){
  const rows = art.g, H = rows.length, W = rows[0].length, cw = w / W, ch = h / H;
  for(let r = 0; r < H; r++) for(let c = 0; c < W; c++){
    const col = art.p[rows[r][c]]; if(!col) continue;
    x.fillStyle = col; x.fillRect(Math.floor(X + c * cw), Math.floor(Y + r * ch), Math.ceil(cw), Math.ceil(ch));
  }
}
function digArtSvg(art, size){ return typeof pixSvg === "function" ? pixSvg(art.g, art.p, size) : ""; }

/* ---------- les nouvelles trouvailles ---------- */
const DIG_PLUS = [
  {k:"vein",      w:3, h:2, n:"Filon",                  wt:si=>9,  give:si=>({ores:{[oreOf(si)]:5 + Math.floor(rng() * 5)}})},
  {k:"geode",     w:2, h:2, n:"Géode",                  wt:si=>3.5, give:si=>{ const g = {shards:12 + si * 4}; if(rng() < 0.3){ const i = Math.min(4, ORE_IDS.indexOf(oreOf(si)) + 1); g.ores = {[ORE_IDS[i]]:2}; } return g; }},
  {k:"candy",     w:2, h:2, n:"Sachet de Bonbons",      wt:si=>3,  give:si=>({candy:2 + Math.floor(rng() * 3)})},
  {k:"balls",     w:3, h:2, n:"Poké Balls enfouies",    wt:si=>3,  give:si=>({balls:si >= 3 ? {super:2 + Math.floor(rng() * 2), hyper:1 + Math.floor(rng() * 2)} : {poke:3, super:1 + Math.floor(rng() * 2)}})},
  {k:"berries",   w:2, h:2, n:"Baies fossilisées",      wt:si=>3,  give:si=>({berries:{[pick(["framby", "nanab", "sitrus", "nigma"])]:1, [pick(["framby", "nanab", "sitrus"])]:1}})},
  {k:"cartridge", w:3, h:2, n:"Cartouche fêlée",        wt:si=>1.2, rare:1, give:si=>({integ:0.25, shards:25})},
  {k:"meteor",    w:2, h:2, n:"Météorite",              wt:si=>si >= 6 ? 1.5 : 0.25, rare:1, give:si=>({ores:{dr:2 + Math.floor(rng() * 3)}, shards:20})},
  {k:"crate0",    w:3, h:3, n:CRATE_NAMES[0],           wt:si=>1.4, rare:1, give:()=>({crate:0})},
  {k:"crate1",    w:3, h:3, n:CRATE_NAMES[1],           wt:si=>si >= 2 ? 0.5 : 0.1, rare:1, give:()=>({crate:1})},
  {k:"crate2",    w:3, h:3, n:CRATE_NAMES[2],           wt:si=>si >= 4 ? 0.14 : 0.05, rare:1, give:()=>({crate:2})}
];
for(const d of DIG_PLUS){ d.ic = null; d.art = 1; DIG_LOOT.push(d); }
/* le Pic Météore en cache davantage, le Cratère a ses filons */
try {
  const pic = FOR_SITES.find(s=>s.id === "pic"); if(pic) pic.loot.meteor = 5;
  const ar = FOR_SITES.find(s=>s.id === "ardent"); if(ar) ar.loot.vein = 1.6;
  const ru = FOR_SITES.find(s=>s.id === "ruines"); if(ru){ ru.loot.cartridge = 3; ru.loot.crate1 = 2; }
} catch(e){}

/* ---------- ouvrir une caisse ---------- */
function crateRoll(tier, si){
  const out = [];
  const add = (txt, fn) => { fn(); out.push(txt); };
  if(tier === 0){
    const c = 800 + si * 300; add(`${fmt(c)} PokéCoins`, ()=>gain("coins", c));
    add("3 Super Ball", ()=>{ S.balls.super = (S.balls.super || 0) + 3; });
    const b = pick(["framby", "nanab", "sitrus"]); add("une Baie " + b.charAt(0).toUpperCase() + b.slice(1), ()=>{ S.berries[b] = (S.berries[b] || 0) + 1; });
    if(rng() < 0.5 && typeof teamCandyGain === "function") add("2 Bonbons d'équipe", ()=>teamCandyGain(2));
  } else if(tier === 1){
    const c = 2500 + si * 600; add(`${fmt(c)} PokéCoins`, ()=>gain("coins", c));
    const hy = 2 + Math.floor(rng() * 2); add(`${hy} Hyper Ball`, ()=>{ S.balls.hyper = (S.balls.hyper || 0) + hy; });
    if(typeof teamCandyGain === "function") add("4 Bonbons d'équipe", ()=>teamCandyGain(4));
    const o = oreOf(si); add(`6 ${oreDef(o).n.toLowerCase()}`, ()=>oreGain(o, 6));
    if(rng() < 0.4 && typeof randomHeld === "function"){ const h = randomHeld(); if(h && grantHeld(h)) out.push("objet tenu : " + HELD_ITEMS[h].n); }
  } else {
    add("2 Noyaux", ()=>gain("cores", 2));
    add("60 Fragments", ()=>gain("shards", 60));
    if(typeof teamCandyGain === "function") add("8 Bonbons d'équipe", ()=>teamCandyGain(8));
    add("une Baie Micle", ()=>{ S.berries.micle = (S.berries.micle || 0) + 1; });
    const r = rng();
    if(r < 0.3 && typeof randomCard === "function"){
      const c = randomCard(1.5);
      if(typeof cardRevealExpect === "function") cardRevealExpect();
      CRATE_CARDS.push({s:c.s, id:c.id, fresh:grantCardV(c.s, c.id)});
      out.push("une carte de " + POKE[c.id].name + " !");
    }
    else if(r < 0.4) add("une Master Ball !", ()=>{ S.balls.master = (S.balls.master || 0) + 1; });
  }
  S.stats.crates = (S.stats.crates || 0) + 1;
  return out;
}
/* une carte trouvée dans une caisse : la caisse s'ouvre, puis la carte a sa scène */
const CRATE_CARDS = [];
function crateCardsReveal(){
  const cs = CRATE_CARDS.splice(0);
  if(!cs.length) return;
  if(!(typeof cardReveal === "function" && cardReveal(cs, {kicker:"CAISSE D'ARCHIVISTE", onDone:()=>{}})) && typeof cardPowersFlush === "function") cardPowersFlush();
}
function crateShow(tier, list){
  if(typeof moment !== "function"){ crateCardsReveal(); return; }
  const withCard = tier === 2 && CRATE_CARDS.length;
  moment({kind:"release", c:CRATE_COLORS[tier], html:digArtSvg(digArtOf("crate" + tier), 84),
    kicker:"FOUILLE · CAISSE", title:CRATE_NAMES[tier], sub:list.join(" · "), dur:withCard ? 6000 : 4600,
    tapText: withCard ? "toucher pour révéler la carte" : "",
    then: withCard ? ()=>setTimeout(crateCardsReveal, 420) : null});
}
