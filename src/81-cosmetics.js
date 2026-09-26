/* ============================================================
   81 — COSMÉTIQUES
   Chaque piece se merite par un succes, et chaque piece doit se
   reconnaitre au premier coup d'oeil : le « Cadre dore » et le
   « Cadre tresorier » etaient deux fois le meme liseré or. Regle
   desormais : une signature visuelle unique par cosmetique —
   une matiere, une forme, un mouvement.

   Les effets les plus soignes renvoient aux moments forts du jeu :
   les grands legendaires, la faille, le titre de Champion, et les
   chromatiques.
   ============================================================ */

Object.assign(COSMETICS, {
  /* cadres — une signature chacun */
  frame_circuit:  {t:"frame", n:"Cadre circuit",        cls:"f-circuit"},
  frame_prism:    {t:"frame", n:"Cadre prismatique",    cls:"f-prism"},
  frame_origin:   {t:"frame", n:"Cadre originel",       cls:"f-origin"},
  frame_elements: {t:"frame", n:"Cadre des éléments",   cls:"f-elements"},
  frame_birds:    {t:"frame", n:"Cadre des trois ailes",cls:"f-birds"},
  frame_champion: {t:"frame", n:"Cadre du Champion",    cls:"f-champion"},
  /* fonds */
  bg_abyss: {t:"bg", n:"Fosse abyssale", css:"radial-gradient(120% 80% at 50% -25%,#1f6aa8 0%,transparent 62%),radial-gradient(60% 40% at 80% 110%,rgba(80,200,255,.18),transparent 70%),linear-gradient(180deg,#0a2a4a,#03101f)"},
  bg_magma: {t:"bg", n:"Cœur de lave",   css:"radial-gradient(90% 60% at 50% 125%,#ff6a1a 0%,#9a2006 34%,transparent 70%),linear-gradient(180deg,#160604,#2b0c04)"},
  bg_sky:   {t:"bg", n:"Voûte céleste",  css:"radial-gradient(80% 50% at 18% -5%,rgba(80,255,170,.34),transparent 60%),radial-gradient(60% 40% at 90% 20%,rgba(150,120,255,.22),transparent 70%),linear-gradient(180deg,#041a15,#0b3a2e)"},
  bg_psy:   {t:"bg", n:"Chambre psychique", css:"radial-gradient(55% 75% at 22% 50%,rgba(200,120,255,.45),transparent 70%),radial-gradient(40% 50% at 85% 30%,rgba(255,150,220,.18),transparent 70%),linear-gradient(180deg,#1a0b2e,#0b0518)"},
  bg_felt:  {t:"bg", n:"Tapis du Champion", css:"repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 8px,transparent 8px 16px),radial-gradient(80% 95% at 50% 50%,#17683f,#062416)"},
  bg_shiny: {t:"bg", n:"Poussière dorée", css:"radial-gradient(1.5px 1.5px at 18% 32%,#ffe9a8,transparent),radial-gradient(1.5px 1.5px at 68% 62%,#ffe9a8,transparent),radial-gradient(1px 1px at 44% 80%,#fff,transparent),radial-gradient(1px 1px at 86% 24%,#fff,transparent),radial-gradient(1px 1px at 30% 70%,#fff3c4,transparent),linear-gradient(180deg,#2a2008,#120c02)"},
  bg_zero:  {t:"bg", n:"Couche Zéro",    css:"linear-gradient(180deg,transparent 68%,rgba(255,61,127,.26)),repeating-linear-gradient(0deg,rgba(53,240,214,.06) 0 1px,transparent 1px 12px),#020308"},
  /* effets */
  fx_tide:     {t:"fx", n:"Marée primordiale"},
  fx_magma:    {t:"fx", n:"Éruption"},
  fx_aurora:   {t:"fx", n:"Aurore céleste"},
  fx_psy:      {t:"fx", n:"Onde psychique"},
  fx_sacred:   {t:"fx", n:"Plumes sacrées"},
  fx_shiny:    {t:"fx", n:"Pluie d'étoiles"},
  fx_champion: {t:"fx", n:"Couronne du Champion"},
  fx_zero:     {t:"fx", n:"Signal non indexé"}
});

/* ---------- les succès qui les délivrent ----------
   Ceux des legendaires sont caches : leurs noms ne doivent pas
   apparaitre avant la capture, comme dans la collection. */
const shinyN = s => Object.values(s.dex || {}).filter(e=>e.shiny).length;
ACHIEVEMENTS.push(
  {id:"c_kyogre",   n:"Maître des profondeurs", d:"Capturer Kyogre.",   hid:1,
   chk:s=>!!s.dex[382], rw:{cos:["fx_tide", "bg_abyss"]}},
  {id:"c_groudon",  n:"Cœur de la terre",       d:"Capturer Groudon.",  hid:1,
   chk:s=>!!s.dex[383], rw:{cos:["fx_magma", "bg_magma"]}},
  {id:"c_rayquaza", n:"Gardien du ciel",        d:"Capturer Rayquaza.", hid:1,
   chk:s=>!!s.dex[384], rw:{cos:["fx_aurora", "bg_sky"]}},
  {id:"c_weather",  n:"Les trois éléments",     d:"Capturer Kyogre, Groudon et Rayquaza.", hid:1,
   chk:s=>[382,383,384].every(i=>s.dex[i]), rw:{cos:"frame_elements", cores:5}},
  {id:"c_mewtwo",   n:"Né pour combattre",      d:"Capturer Mewtwo.",   hid:1,
   chk:s=>!!s.dex[150], rw:{cos:["fx_psy", "bg_psy"]}},
  {id:"c_origin",   n:"Le duo originel",        d:"Capturer Mew et Mewtwo.", hid:1,
   chk:s=>!!(s.dex[150] && s.dex[151]), rw:{cos:"frame_origin", cores:4}},
  {id:"c_hooh",     n:"Feu sacré",              d:"Capturer Ho-Oh.",    hid:1,
   chk:s=>!!s.dex[250], rw:{cos:"fx_sacred"}},
  {id:"c_shiny5",   n:"Anomalies en série",     d:"Posséder 5 Pokémon chromatiques.",
   chk:s=>shinyN(s) >= 5,  rw:{cos:"fx_shiny"}},
  {id:"c_shiny10",  n:"Chercheur d'or",         d:"Posséder 10 Pokémon chromatiques.",
   chk:s=>shinyN(s) >= 10, rw:{cos:"bg_shiny"}},
  {id:"c_shiny25",  n:"Collection prismatique", d:"Posséder 25 Pokémon chromatiques.",
   chk:s=>shinyN(s) >= 25, rw:{cos:"frame_prism", cores:6}},
  {id:"c_champion", n:"Champion de la Couche",  d:"Terminer une partie de Poké-Poker en battant le Champion.",
   chk:s=>(s.stats.pokerWins || 0) >= 1, rw:{cos:["fx_champion", "frame_champion", "bg_felt"]}},
  {id:"c_rift",     n:"Nous sommes onze",       d:"Entendre la faille jusqu'au bout.", hid:1,
   chk:s=>((s.rift && s.rift.stage) || 0) >= 6, rw:{cos:["fx_zero", "bg_zero"]}},
  {id:"c_dex100",   n:"Cent définitions",       d:"Archiver 100 espèces.",
   chk:s=>Object.keys(s.dex || {}).length >= 100, rw:{cos:"frame_circuit"}}
);
/* le trio aile delivre desormais aussi son cadre */
{ const b = ACHIEVEMENTS.find(a=>a.id === "h_birds"); if(b) b.rw = Object.assign({}, b.rw, {cos:"frame_birds"}); }

/* ============================================================
   LES EFFETS
   Chacun est une petite scene autonome, en CSS pur, qui vit aussi
   bien dans le bandeau du profil que dans l'en-tete. Les positions
   sont figees par graine : deux rendus successifs sont identiques,
   sinon l'effet « saute » a chaque rafraichissement.
   ============================================================ */
function fxSeeded(n, fn){
  let h = 7;
  return Array.from({length:n}, (_, i)=>{ h = (h * 9301 + 49297) % 233280; return fn(i, h / 233280); }).join("");
}
const FX_LAYERS = {
  fx_tide: () => `<span class="fxl fx-tide"><b></b><b></b>
    ${fxSeeded(9,(i,r)=>`<i style="--x:${(i*11+r*8).toFixed(1)}%;--d:${(r*4).toFixed(2)}s;--s:${(3.5+r*2.5).toFixed(2)}s;--z:${(3+r*5).toFixed(1)}px"></i>`)}</span>`,
  fx_magma: () => `<span class="fxl fx-magma"><b></b>
    ${fxSeeded(12,(i,r)=>`<i style="--x:${(i*8.3+r*6).toFixed(1)}%;--d:${(r*3).toFixed(2)}s;--s:${(2+r*1.8).toFixed(2)}s;--w:${((r-.5)*30).toFixed(0)}px"></i>`)}</span>`,
  fx_aurora: () => `<span class="fxl fx-aurora"><b></b><b></b><b></b>
    ${fxSeeded(8,(i,r)=>`<i style="--x:${(i*12.5+r*9).toFixed(1)}%;--y:${(r*60).toFixed(1)}%;--d:${(r*3).toFixed(2)}s"></i>`)}</span>`,
  fx_psy: () => `<span class="fxl fx-psy">
    ${[0,1,2,3].map(i=>`<i style="--d:${i*0.9}s"></i>`).join("")}
    ${fxSeeded(6,(i,r)=>`<em style="--x:${(30+i*11+r*6).toFixed(1)}%;--y:${(15+r*70).toFixed(1)}%;--d:${(r*3).toFixed(2)}s">${"◇○△◈⬡◎"[i]}</em>`)}</span>`,
  fx_sacred: () => `<span class="fxl fx-sacred">
    ${fxSeeded(10,(i,r)=>`<i style="--x:${(i*10+r*7).toFixed(1)}%;--d:${(r*5).toFixed(2)}s;--s:${(4.5+r*3).toFixed(2)}s;--h:${[42,8,140,48,0,120,36,16,150,44][i]};--r:${((r-.5)*80).toFixed(0)}deg"></i>`)}</span>`,
  fx_shiny: () => `<span class="fxl fx-shiny"><b></b>
    ${fxSeeded(11,(i,r)=>`<i style="--x:${(i*9+r*6).toFixed(1)}%;--y:${(8+r*80).toFixed(1)}%;--d:${(r*2.4).toFixed(2)}s;--z:${(7+r*7).toFixed(1)}px">✦</i>`)}</span>`,
  fx_champion: () => `<span class="fxl fx-champion">
    ${fxSeeded(8,(i,r)=>`<em style="--x:${(8+i*11.5).toFixed(1)}%;--d:${(r*4).toFixed(2)}s;--s:${(4+r*2).toFixed(2)}s;--r:${((r-.5)*60).toFixed(0)}deg">${"♠♥♦♣"[i%4]}</em>`)}
    ${fxSeeded(14,(i,r)=>`<i style="--x:${(i*7+r*5).toFixed(1)}%;--d:${(r*3).toFixed(2)}s;--s:${(2.6+r*2).toFixed(2)}s;--h:${[45,330,45,190][i%4]}"></i>`)}</span>`,
  fx_zero: () => `<span class="fxl fx-zero"><b></b><b></b><s></s></span>`
};
