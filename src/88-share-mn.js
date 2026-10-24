/* ============================================================
   88 — TON ENTRÉE N° 000
   Une carte-image à garder ou à montrer, après la révélation : la
   silhouette que ton nom dessine quand on le relit comme une espèce,
   tes octets, ta connexion, ta réponse. Elle ne dit rien de plus :
   celui qui la voit sans avoir joué se demande ce qu'elle raconte.
   ============================================================ */
let MN_SHARE = null;
function mnShareOpen(){ return typeof sagaKnown === "function" && sagaKnown(); }
function mnShareAnswer(){
  const g = typeof sagaState === "function" ? sagaState() : (S.saga || {});
  if(S.flags && S.flags.finalChoice === "erase") return "EFFACER";
  return g.end === "write" || g.wrote ? "ÉCRIRE" : g.end === "erase" ? "EFFACER" : "—";
}
function mnShareBytes(){ return nameBytes(pzName()).concat([0x50]).map(hex2); }
function mnShareText(){
  let url = ""; try { url = location.origin + location.pathname; } catch(e){}
  return `Pokémon Code Genesis — entrée n° 000\n${pzName().toUpperCase()} · ${mnShareBytes().join(" ")}\n`
    + `Connexion n° ${sagaConn()} · ${mnShareAnswer()}` + (url ? "\n" + url : "");
}
/* une copie de la silhouette, d'une seule couleur (pour le décalage rouge / cyan) */
function mnTint(src, col){
  const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
  const x = c.getContext("2d"); x.drawImage(src, 0, 0);
  x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
/* un texte qui tient dans sa largeur : on réduit la police plutôt que de couper */
function mnFit(x, text, max, size, weight, font){
  let s = size; x.font = `${weight} ${s}px ${font}`;
  while(s > 14 && x.measureText(text).width > max){ s -= 2; x.font = `${weight} ${s}px ${font}`; }
  return s;
}
function mnSplit(x, text, X, Y, off){
  x.fillStyle = "rgba(255,61,127,.85)"; x.fillText(text, X - off, Y);
  x.fillStyle = "rgba(53,240,214,.85)"; x.fillText(text, X + off, Y);
  x.fillStyle = "#ffffff"; x.fillText(text, X, Y);
}
function mnShareCanvas(){
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  const mono = "ui-monospace,Menlo,Consolas,monospace";
  const name = pzName(), bytes = mnShareBytes();
  /* le fond : la Couche Zéro, ses lignes de données */
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#090514"); bg.addColorStop(1, "#020106");
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const halo = x.createRadialGradient(W / 2, 600, 0, W / 2, 600, 560);
  halo.addColorStop(0, "rgba(139,92,246,.30)"); halo.addColorStop(1, "rgba(139,92,246,0)");
  x.fillStyle = halo; x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(53,240,214,.045)"; for(let y = 0; y < H; y += 22) x.fillRect(0, y, W, 2);
  x.fillStyle = "rgba(255,61,127,.035)"; for(let X = 0; X < W; X += 26) x.fillRect(X, 0, 2, H);
  x.fillStyle = "rgba(255,255,255,.028)"; for(let y = 0; y < H; y += 6) x.fillRect(0, y, W, 2);
  x.lineWidth = 4;
  x.strokeStyle = "rgba(255,61,127,.7)"; x.strokeRect(25, 28, W - 56, H - 56);
  x.strokeStyle = "rgba(53,240,214,.7)"; x.strokeRect(31, 28, W - 56, H - 56);
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  x.fillStyle = "#35f0d6"; x.font = `bold 32px ${mono}`; x.fillText("POKÉMON CODE GENESIS", W / 2, 110);
  x.fillStyle = "#8a7fb0"; x.font = `24px ${mono}`; x.fillText("> lecture de l'entrée 000", W / 2, 156);
  x.font = `bold 96px ${mono}`; mnSplit(x, "N° 000", W / 2, 262, 6);
  /* la silhouette, huit fois plus grande, ses deux ombres décalées */
  const spr = nameSpriteCanvas(name);
  if(spr){
    const k = 8, sw = spr.width * k, sx = Math.round((W - sw) / 2), sy = 318;
    x.globalAlpha = .55;
    x.drawImage(mnTint(spr, "#ff3d7f"), sx - 10, sy, sw, sw);
    x.drawImage(mnTint(spr, "#35f0d6"), sx + 10, sy, sw, sw);
    x.globalAlpha = 1;
    x.shadowColor = "rgba(255,255,255,.28)"; x.shadowBlur = 36;
    x.drawImage(spr, sx, sy, sw, sw);
    x.shadowBlur = 0;
  }
  /* ton nom, puis ce qu'il vaut en octets ; le 50 qui le termine en magenta */
  const NAME = name.toUpperCase();
  mnFit(x, NAME, 880, 84, "bold", mono); mnSplit(x, NAME, W / 2, 878, 4);
  const pre = bytes.slice(0, -1).join(" ") + " ", end = bytes[bytes.length - 1];
  mnFit(x, pre + end, 880, 44, "bold", mono);
  const full = x.measureText(pre + end).width, x0 = W / 2 - full / 2;
  x.textAlign = "left";
  x.fillStyle = "#35f0d6"; x.fillText(pre, x0, 950);
  x.fillStyle = "#ff3d7f"; x.fillText(end, x0 + x.measureText(pre).width, 950);
  x.textAlign = "center";
  x.fillStyle = "#8a7fb0"; x.font = `italic 26px ${mono}`; x.fillText("relu comme l'espèce n° 000", W / 2, 1000);
  /* trois cases : la connexion, la réponse, le Pokédex */
  const maxDex = REGIONS[REGIONS.length - 1].to;
  const tiles = [["CONNEXION", "n° " + sagaConn()], ["RÉPONSE", mnShareAnswer()], ["POKÉDEX", dexTotal() + " / " + maxDex]];
  tiles.forEach(([k, v], i)=>{
    const bw = 300, gap = 24, bx = (W - (3 * bw + 2 * gap)) / 2 + i * (bw + gap), by = 1046;
    x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(bx, by, bw, 128);
    x.strokeStyle = i === 1 ? "rgba(255,61,127,.5)" : "rgba(255,255,255,.16)"; x.lineWidth = 2; x.strokeRect(bx, by, bw, 128);
    x.fillStyle = "#9fb0c8"; x.font = `22px ${mono}`; x.fillText(k, bx + bw / 2, by + 44);
    x.fillStyle = i === 1 ? "#ffb3cc" : "#ffffff"; mnFit(x, v, bw - 30, 44, "bold", mono); x.fillText(v, bx + bw / 2, by + 102);
  });
  let host = ""; try { host = location.host || ""; } catch(e){}
  x.fillStyle = "#6b7a90"; x.font = `22px ${mono}`;
  x.fillText(new Date().toLocaleDateString("fr-FR") + " · " + (host || "jeu de fan non officiel"), W / 2, 1252);
  return c;
}
function mnShareSheet(first){
  if(!mnShareOpen()) return;
  let url = "";
  try { MN_SHARE = mnShareCanvas(); url = MN_SHARE.toDataURL("image/png"); } catch(e){ console.error(e); }
  sheet(`${sheetHead("Entrée n° 000")}
    <div class="tiny muted">${first ? "Ce que l'archive a lu de toi. Garde-le, ou montre-le à quelqu'un." : "Ce que l'archive a lu de toi."}</div>
    ${url ? `<img class="mn-shareimg" src="${url}" alt="Ton entrée n° 000">` : ""}
    <div class="tiny dim" style="text-align:center;margin-top:5px">ou maintiens l'image pour l'enregistrer</div>
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn pri" data-act="mnsharego">${ic("arrow")} Partager</button>
      <button class="btn" data-act="mnsharesave">Enregistrer</button>
    </div>
    <button class="btn ghost wide" style="margin-top:7px" data-act="closesheet">Fermer</button>`, true);
}
/* proposée une seule fois d'elle-même, juste après la réponse ; ensuite, dans le Journal */
function mnShareOffer(){
  if(!mnShareOpen() || (S.flags && S.flags.mnShareOffered)) return false;
  S.flags.mnShareOffered = true; save();
  setTimeout(()=>{ try { mnShareSheet(true); } catch(e){ console.error(e); } }, 1400);
  return true;
}
function mnShareRowHtml(){
  if(!mnShareOpen()) return "";
  return `<button class="pzf-open mn-row" data-act="mnshare">
    <span class="mn-row-ic"><img src="${nameSprite(pzName())}" alt=""></span>
    <span class="grow"><b>entree_000.png</b><small>${esc(pzName())} · ${mnShareBytes().join(" ")}</small></span>${ic("arrow")}</button>`;
}
ACTIONS.mnshare = () => mnShareSheet(false);
ACTIONS.mnsharesave = () => {
  if(!MN_SHARE) return;
  const a = document.createElement("a");
  a.href = MN_SHARE.toDataURL("image/png"); a.download = "code-genesis-entree-000.png";
  document.body.appendChild(a); a.click(); a.remove();
  try { navigator.clipboard.writeText(mnShareText()); toast("Image enregistrée, texte copié", "", "check"); }
  catch(e){ toast("Image enregistrée", "", "check"); }
};
ACTIONS.mnsharego = () => {
  if(!MN_SHARE) return;
  const text = mnShareText();
  MN_SHARE.toBlob(async blob=>{
    try {
      const file = new File([blob], "code-genesis-entree-000.png", {type:"image/png"});
      if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({title:"Code Genesis — entrée n° 000", text, files:[file]});
      else if(navigator.share) await navigator.share({title:"Code Genesis — entrée n° 000", text});
      else { await navigator.clipboard.writeText(text); toast("Texte copié — l'image s'enregistre avec « Enregistrer »", "", "check"); }
    } catch(e){
      if(e && e.name === "AbortError") return;
      try { await navigator.clipboard.writeText(text); toast("Texte copié", "", "check"); } catch(err){ toast("Partage indisponible sur cet appareil", "bad", "cross"); }
    }
  }, "image/png");
};
