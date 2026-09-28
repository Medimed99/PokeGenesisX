import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(700)
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=20; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30,false);
          S.stats.expWins=1; S.ach=ACHIEVEMENTS.map(a=>a.id); save(); closeSheet();
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none'; go('breche'); }""")
        await pg.wait_for_timeout(4200); await pg.screenshot(path="/tmp/shots/d_intro.png")
        await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/shots/d_lobby.png")
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{ BR.team.push({id:25,lv:3,stage:0,cd:0,orb:0}); BR.lv=3; BR.pendingLevels=1; }")
        await pg.wait_for_timeout(800); await pg.screenshot(path="/tmp/shots/d_lvl.png")
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
