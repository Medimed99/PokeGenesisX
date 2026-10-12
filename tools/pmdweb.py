import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        bad=[]; pg.on("response", lambda r: bad.append(r.url) if r.status >= 400 else None)
        await pg.goto("http://localhost:8765/"); await pg.get_by_text("Entrer dans l'archive").wait_for(timeout=15000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; PWA.onClose=null; }")
        await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=20; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30,false);
          S.stats.expWins=1; S.flags.brecheIntro=true; brState().starter=6; save(); go('breche'); }""")
        await pg.wait_for_timeout(600); await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{ window.__pilot=setInterval(()=>{ if(!BR) return; const a=performance.now()/1400; BR.joy={dx:Math.cos(a),dy:Math.sin(a),ox:0,oy:0,id:-1};
            BR.pendingLevels=0; BR.chestsPending=0; },80); BR.team.push({id:25,lv:3,stage:0,cd:0,orb:0},{id:94,lv:3,stage:0,cd:0,orb:0}); }""")
        await pg.wait_for_timeout(5000)
        r = await pg.evaluate("""()=>({embarquées: typeof PMD_IMG !== 'undefined', base: typeof PMD_BASE !== 'undefined' ? PMD_BASE : null,
          chargées: Object.values(BR_PMD).filter(e=>e.img.complete&&e.img.naturalWidth).length,
          prêtes_à_dessiner: Object.values(BR_PMD).filter(e=>e.v.c||e.v.n).length, échecs: Object.values(BR_PMD).filter(e=>e.bad).length})""")
        await pg.screenshot(path="/tmp/shots/pmd_web.png")
        print("version en ligne :", r)
        print("réponses en erreur :", [u.split('/')[-1] for u in bad][:5] or "aucune", "· erreurs :", errs[:2] or "aucune")
        await b.close()
asyncio.run(main())
