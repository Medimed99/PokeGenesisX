import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(700)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; startTuto=()=>false;
          const t=document.getElementById('tuto'); if(t) t.className='';
          S.level=20; for(let i=1;i<=151;i++) addToDex(i,30,false);
          S.bosses=['kanto:144']; S.team=[1,4,7]; save(); go('poker'); ACTIONS.pkstart(); }""")
        await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/shots/pk_0.png")
        await pg.get_by_text("Entrer", exact=True).click(); await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/shots/pk_1.png")
        cards = await pg.query_selector_all("#hand .pcard")
        for c in cards[:3]: await c.click(); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path="/tmp/shots/pk_2.png")
        await pg.evaluate("playCine(badgeCine(2, 3), ()=>{})")
        for k in range(12):
            await pg.wait_for_timeout(700); await pg.screenshot(path=f"/tmp/shots/bd_{k:02d}.png")
        if await pg.query_selector(".cn-skip"): await pg.click(".cn-skip")
        await pg.wait_for_timeout(700)
        await pg.evaluate("playCine(secretCine('duo_origine', [150,151]), ()=>{})")
        for k in range(11):
            await pg.wait_for_timeout(700); await pg.screenshot(path=f"/tmp/shots/sc_{k:02d}.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
