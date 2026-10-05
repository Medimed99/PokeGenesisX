import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=1)
        errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html")
        # l'ecran de demarrage attend un geste : on le franchit
        await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click()
        plan = [(900,"01"),(1400,"02"),(2600,"03"),(1600,"04"),(2600,"05"),(2400,"06"),(3200,"07"),
                (1600,"08"),(1800,"09"),(1500,"10"),(1400,"11"),(1300,"12"),(1500,"13"),(1500,"14"),
                (2500,"15"),(3500,"16"),(3000,"17"),(2200,"18"),(2400,"19"),(2600,"20"),(2600,"21"),(2600,"22"),(3000,"23"),(2800,"24")]
        for ms, name in plan:
            await pg.wait_for_timeout(ms)
            await pg.screenshot(path=f"/tmp/shots/{name}.png")
            await pg.mouse.click(195, 700)
        print("erreurs de page :", errs[:5] or "aucune")
        await b.close()
asyncio.run(main())
