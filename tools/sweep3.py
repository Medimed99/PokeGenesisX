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
          S.level=40; for(let i=1;i<=386;i++) if(!isExclusive(i)) addToDex(i,25,false); S.stats.expWins=1; S.flags.brecheIntro=true;
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none'; dcState().team=[6,25,94]; save(); go('descente'); }""")
        await pg.wait_for_timeout(400)
        await pg.click("text=Commencer la Descente"); await pg.wait_for_timeout(1500)
        await pg.click(".dc-menu"); await pg.wait_for_timeout(300)
        await pg.click("text=Abandonner la Descente"); await pg.wait_for_timeout(600)
        await pg.screenshot(path="/tmp/shots/s_result.png")
        await pg.click("text=Retour"); await pg.wait_for_timeout(500)
        print("écran après la Descente :", await pg.evaluate("currentScreen"))
        await pg.evaluate("()=>{ go('breche'); ACTIONS.brtab({t:'run'}); }"); await pg.wait_for_timeout(400)
        await pg.click("text=ENTRER DANS LA BRÈCHE", timeout=4000); await pg.wait_for_timeout(3000)
        print("run de Brèche lancée :", await pg.evaluate("!!BR && BR.t > 1"))
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
