/* ============================================================
   30c — DES BONUS LISIBLES
   Une capture était multipliée par une quinzaine de petits bonus
   que personne ne voyait : série, niveau, compagnon, objet tenu,
   boost, jour de chance, talents, Pièces Rune, faction, météo,
   événement, baies… Ils sont désormais regroupés en un seul
   endroit : quatre totaux (PokéCoins, capture, expérience,
   chromatique), et le détail de chaque source.
   ============================================================ */

function bonusSources(){
  const out = [];
  const add = (n, o) => { const k = Object.keys(o).filter(x=>Math.abs((o[x] || 1) - 1) > 0.001); if(k.length) out.push(Object.assign({n}, o)); };
  const st = S.streak || 0;
  add(`Série de ${st}`, {coin:1 + Math.min(0.6, st * 0.004), catch:1 + Math.min(0.35, st * 0.002)});
  add(`Niveau d'Archiviste ${S.level}`, {coin:1 + S.level * 0.014});
  try { const b = buddyBonus(); add("Compagnon", {coin:b.coin, catch:b.catch, xp:b.xp}); } catch(e){}
  try { add("Objet tenu", {coin:heldActive("coin") ? 1.2 : 1, catch:heldActive("catch") ? 1.12 : 1, xp:heldActive("xp") ? 1.25 : 1, shiny:heldActive("shiny") ? 1.4 : 1}); } catch(e){}
  try { add("Boost actif", {coin:boostActive("coin") ? 1.8 : 1, xp:boostActive("xp") ? 1.4 : 1, shiny:boostActive("shiny") ? 2 : 1}); } catch(e){}
  try { add("Jour de chance", {coin:luckyF("coin") || 1, xp:luckyF("xp") || 1, shiny:luckyF("shiny") || 1}); } catch(e){}
  try { add("Talents", {coin:perkMul("p_coin", 0.15), catch:perkMul("p_catch", 0.04), shiny:perkMul("p_shiny", 0.2)}); } catch(e){}
  try { add("Pièces Rune", {coin:runeMul()}); } catch(e){}
  try { add("Faction", {coin:factionMul("coins")}); } catch(e){}
  try { add("Météo", {coin:weatherDef().gain || 1}); } catch(e){}
  try { add("Cycle", {coin:cycleMod("m_econ") ? 0.5 : 1}); } catch(e){}
  try { add("Événement", {coin:eventActive("ev_coin") ? 2 : 1, xp:eventActive("ev_xp") ? 2 : 1}); } catch(e){}
  const bf = S.buffs || {};
  add("Baies du prochain lancer", {coin:bf.sitrus ? 2 : 1, catch:bf.framby ? 1.5 : 1, xp:bf.nigma ? 2 : 1});
  try { add("Charme Chroma", {shiny:charmMul()}); } catch(e){}
  return out;
}
function bonusTotals(){
  const t = {coin:1, catch:1, xp:1, shiny:1};
  for(const s of bonusSources()) for(const k in t) if(s[k]) t[k] *= s[k];
  return t;
}
const BONUS_LABELS = {coin:"PokéCoins", catch:"Capture", xp:"Expérience", shiny:"Chromatique"};
function bonusFmt(v){ return "×" + v.toFixed(2).replace(/\.?0+$/, "").replace(".", ","); }
function bonusChipHtml(){
  if(S.level < 3) return "";
  const t = bonusTotals();
  return `<button class="bonuschip" data-act="bonusinfo">${ic("star")}<span>Bonus actifs</span>
    ${["coin", "catch", "xp"].map(k=>`<b class="${t[k] > 1.001 ? "up" : t[k] < 0.999 ? "dn" : ""}">${esc(BONUS_LABELS[k])} ${bonusFmt(t[k])}</b>`).join("")}</button>`;
}
ACTIONS.bonusinfo = () => {
  const src = bonusSources(), t = bonusTotals();
  sheet(`${sheetHead("Bonus actifs")}
    <div class="bn-tot">${Object.keys(BONUS_LABELS).map(k=>`<div><small>${esc(BONUS_LABELS[k])}</small><b class="${t[k] > 1.001 ? "ok" : t[k] < 0.999 ? "bad" : ""}">${bonusFmt(t[k])}</b></div>`).join("")}</div>
    <div class="h sm" style="margin-top:10px">D'OÙ ILS VIENNENT</div>
    ${src.length ? src.map(s=>`<div class="bn-row"><b class="grow">${esc(s.n)}</b>${Object.keys(BONUS_LABELS).filter(k=>s[k] && Math.abs(s[k] - 1) > 0.001).map(k=>`<span class="${s[k] > 1 ? "ok" : "bad"}">${esc(BONUS_LABELS[k])} ${bonusFmt(s[k])}</span>`).join("")}</div>`).join("")
      : `<div class="empty">Aucun bonus pour l'instant.</div>`}
    ${typeof rstreakRow === "function" ? `<div class="h sm" style="margin-top:12px">SÉRIES PAR RARETÉ</div><div class="tiny dim" style="margin-bottom:6px">Captures d'affilée de chaque rareté ; des paliers récompensent les plus longues.</div>${rstreakRow()}` : ""}`);
};
