/* ============================================================
   59s — LA BRÈCHE · PARTAGER SA RUN
   Une carte-image (1080 × 1350, le format portrait des reseaux) et un
   texte court a la Wordle. Sur telephone, le partage natif envoie
   l'image telle quelle ; sinon, on l'enregistre et on copie le texte.
   ============================================================ */
function brShareText(R){
  const d = new Date(), date = String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
  const t = Math.floor(R.t / 60) + ":" + String(Math.floor(R.t % 60)).padStart(2, "0");
  const mis = (R.missions || []).filter(m=>m.done).length;
  let url = ""; try { url = location.origin + location.pathname; } catch(e){}
  return `Pokémon Code Genesis — La Brèche${R.daily ? " du jour " + date : ""}\n`
    + `${HABITATS[R.hab].n} · ⏱ ${t} · ✦ ${fmt(R.kills)} K.O.`
    + (R.depth ? ` · profondeur ${R.depth}` : "") + (R.won ? " · refermée" : "")
    + (R.daily ? ` · score ${fmt(brScore(R))}` : "")
    + `\nMissions ${"◉".repeat(mis)}${"○".repeat(Math.max(0, (R.missions || []).length - mis))}`
    + (url ? "\n" + url : "");
}
function brShareCanvas(R){
  const W = 1080, H = 1350, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = false;
  /* fond : la faille, ses scanlines */
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0c0518"); bg.addColorStop(1, "#04020a");
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const gl = x.createRadialGradient(W / 2, H * 1.05, 0, W / 2, H * 1.05, H * 0.75);
  gl.addColorStop(0, "rgba(255,61,127,.45)"); gl.addColorStop(1, "rgba(255,61,127,0)");
  x.fillStyle = gl; x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(255,255,255,.035)"; for(let y = 0; y < H; y += 6) x.fillRect(0, y, W, 2);
  x.strokeStyle = "rgba(255,61,127,.55)"; x.lineWidth = 4; x.strokeRect(28, 28, W - 56, H - 56);
  x.textAlign = "center";
  const mono = "ui-monospace,Menlo,Consolas,monospace";
  /* titre */
  x.fillStyle = "#35f0d6"; x.font = `bold 34px ${mono}`; x.fillText("POKÉMON CODE GENESIS", W / 2, 118);
  x.font = `bold 118px ${mono}`;
  x.fillStyle = "rgba(255,61,127,.85)"; x.fillText("LA BRÈCHE", W / 2 - 6, 250);
  x.fillStyle = "rgba(53,240,214,.85)"; x.fillText("LA BRÈCHE", W / 2 + 6, 250);
  x.fillStyle = "#ffffff"; x.fillText("LA BRÈCHE", W / 2, 250);
  const d = new Date();
  x.fillStyle = "#ffb3cc"; x.font = `30px ${mono}`;
  x.fillText(`${HABITATS[R.hab].n} · ${d.toLocaleDateString("fr-FR")}${R.daily ? " · Brèche du jour" : ""}`, W / 2, 310);
  /* le resultat, en grand */
  const t = Math.floor(R.t / 60) + ":" + String(Math.floor(R.t % 60)).padStart(2, "0");
  const res = R.won ? (R.endless ? "PROFONDEUR " + (R.depth || 1) : "BRÈCHE REFERMÉE") : "TOMBÉ À " + t;
  x.font = `bold 64px ${mono}`; x.fillStyle = R.won ? "#35f0d6" : "#ff5c8a";
  x.shadowColor = x.fillStyle; x.shadowBlur = 30; x.fillText(res, W / 2, 430); x.shadowBlur = 0;
  /* quatre statistiques */
  const mis = (R.missions || []).filter(m=>m.done).length;
  const stats = [["TEMPS", t], ["K.O.", fmt(R.kills)], ["NIVEAU", String(R.lv)],
                 R.daily ? ["SCORE", fmt(brScore(R))] : ["MISSIONS", mis + " / " + (R.missions || []).length]];
  stats.forEach(([k, v], i)=>{
    const bx = 80 + (i % 2) * 470, by = 490 + Math.floor(i / 2) * 170;
    x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(bx, by, 450, 150);
    x.strokeStyle = "rgba(255,255,255,.14)"; x.lineWidth = 2; x.strokeRect(bx, by, 450, 150);
    x.fillStyle = "#9fb0c8"; x.font = `26px ${mono}`; x.fillText(k, bx + 225, by + 50);
    x.fillStyle = "#ffffff"; x.font = `bold 58px ${mono}`; x.fillText(v, bx + 225, by + 118);
  });
  /* l'equipe, de face, en sprites de marche */
  x.fillStyle = "#9fb0c8"; x.font = `26px ${mono}`; x.fillText("L'ÉQUIPE", W / 2, 880);
  const n = R.team.length, slot = 150, gap = 16, total = n * slot + (n - 1) * gap, x0 = (W - total) / 2;
  R.team.forEach((w, i)=>{
    const id = brShownId(w), sx = x0 + i * (slot + gap), sy = 905;
    x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(sx, sy, slot, slot);
    x.strokeStyle = w.stage >= 2 ? "#ffd24a" : "rgba(255,255,255,.18)"; x.lineWidth = 3; x.strokeRect(sx, sy, slot, slot);
    const sheet = typeof brPmdVariant === "function" ? brPmdVariant(id, "n") : null;
    if(sheet && PMD_META[id]){
      /* on recadre sur la silhouette reelle : les images de marche ont beaucoup de marge */
      const m = PMD_META[id], b = brShareBBox(sheet, m[0], m[1]);
      const k = Math.min(slot * 0.86 / b.w, slot * 0.86 / b.h);
      x.drawImage(sheet, b.x, b.y, b.w, b.h, sx + slot / 2 - b.w * k / 2, sy + slot / 2 - b.h * k / 2, b.w * k, b.h * k);
    } else {
      const sp = brSprite(id, "n");
      if(sp) x.drawImage(sp, sx + 5, sy + 5, slot - 10, slot - 10);
    }
    x.fillStyle = "#e8eef5"; x.font = `22px ${mono}`;
    x.fillText(POKE[id].name.slice(0, 11), sx + slot / 2, sy + slot + 34);
  });
  /* signature */
  x.fillStyle = "#35f0d6"; x.font = `bold 34px ${mono}`; x.fillText((S.name || "Archiviste").toUpperCase(), W / 2, 1200);
  let url = ""; try { url = location.host || ""; } catch(e){}
  x.fillStyle = "#6b7a90"; x.font = `24px ${mono}`; x.fillText(url ? url : "jeu de fan non officiel", W / 2, 1250);
  return c;
}
/* boite englobante des pixels visibles de la premiere image (face, vers le bas) */
function brShareBBox(sheet, fw, fh){
  try {
    const d = sheet.getContext ? sheet.getContext("2d").getImageData(0, 0, fw, fh).data : null;
    if(!d) return {x:0, y:0, w:fw, h:fh};
    let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
    for(let y = 0; y < fh; y++) for(let x = 0; x < fw; x++) if(d[(y * fw + x) * 4 + 3] > 20){
      if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
    return x1 < 0 ? {x:0, y:0, w:fw, h:fh} : {x:x0, y:y0, w:x1 - x0 + 1, h:y1 - y0 + 1};
  } catch(e){ return {x:0, y:0, w:fw, h:fh}; }
}
ACTIONS.brshare = () => {
  const R = BR; if(!R) return;
  const c = brShareCanvas(R), url = c.toDataURL("image/png");
  R.shareCanvas = c;
  const m = document.getElementById("br-modal");
  m.className = "on";
  m.innerHTML = `<div class="br-card share">
    <div class="br-h" style="color:#35f0d6">PARTAGER</div>
    <img class="br-shareimg" src="${url}" alt="Carte de résultat">
    <div class="btn-grid c2" style="margin-top:10px">
      <button class="btn pri" data-act="brsharego">Partager</button>
      <button class="btn" data-act="brsharesave">Enregistrer</button>
    </div>
    <button class="btn ghost wide" style="margin-top:7px" data-act="brshareback">Retour</button>
  </div>`;
};
ACTIONS.brshareback = () => { const R = BR; if(R && R.lastResults) brShowResults(R, R.lastResults); };
ACTIONS.brsharesave = () => {
  const R = BR; if(!R || !R.shareCanvas) return;
  const a = document.createElement("a");
  a.href = R.shareCanvas.toDataURL("image/png"); a.download = "code-genesis-breche.png";
  document.body.appendChild(a); a.click(); a.remove();
  try { navigator.clipboard.writeText(brShareText(R)); toast("Image enregistrée, texte copié", "", "check"); }
  catch(e){ toast("Image enregistrée", "", "check"); }
};
ACTIONS.brsharego = () => {
  const R = BR; if(!R || !R.shareCanvas) return;
  const text = brShareText(R);
  R.shareCanvas.toBlob(async blob=>{
    try {
      const file = new File([blob], "code-genesis-breche.png", {type:"image/png"});
      if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({title:"Code Genesis — La Brèche", text, files:[file]});
      else if(navigator.share) await navigator.share({title:"Code Genesis — La Brèche", text});
      else { await navigator.clipboard.writeText(text); toast("Texte copié — l'image s'enregistre avec « Enregistrer »", "", "check"); }
    } catch(e){
      if(e && e.name === "AbortError") return;             /* le joueur a simplement ferme la feuille de partage */
      try { await navigator.clipboard.writeText(text); toast("Texte copié", "", "check"); } catch(err){ toast("Partage indisponible sur cet appareil", "bad", "cross"); }
    }
  }, "image/png");
};
