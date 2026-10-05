import asyncio
from playwright.async_api import async_playwright
SCENES = {"missingno_1":[3,5,8], "climax":[6,12,17,20], "epilogue":[4,7,12], "arc2_prof":[4,7], "pz_fail":[2]}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(700)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        for sid, keep in SCENES.items():
            await pg.evaluate(f"playStory('{sid}', ()=>{{}})")
            for step in range(1, max(keep)+1):
                await pg.wait_for_timeout(1500)
                if step in keep: await pg.screenshot(path=f"/tmp/shots/s_{sid}_{step:02d}.png")
                if not await pg.evaluate("document.getElementById('cine').className.includes('on')"): break
                await pg.mouse.click(195, 600)
            if await pg.evaluate("document.getElementById('cine').className.includes('on')"):
                await pg.click(".cn-skip"); await pg.wait_for_timeout(700)
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
