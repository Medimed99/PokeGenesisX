import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("http://localhost:8765/"); await pg.get_by_text("Entrer dans l'archive").wait_for(timeout=15000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; PWA.onClose=null; }"); await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=40; for(let i=1;i<=386;i++) if(!isExclusive(i)) addToDex(i,25,false); S.stats.expWins=2; S.flags.brecheIntro=true;
          dcState().wins=1; dcState().team=[149,65,130]; towerState().points=3; towerState().best=14; S.story.push('breche_intro');
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none'; save(); go('modules'); }""")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/f_hub.png")
        await pg.evaluate("()=>{ go('descente'); DC_MODE='endless'; refresh(); }"); await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/shots/f_endless.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
