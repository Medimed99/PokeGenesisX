import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        for vw,vh in [(390,844),(375,667),(412,915)]:
            pg = await b.new_page(viewport={"width":vw,"height":vh})
            await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1000)
            await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
            await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
            await pg.evaluate("""()=>{ tutoMaybe=()=>false; S.level=20; for(let i=1;i<=151;i++) addToDex(i,30,false);
              S.bosses=['kanto:144']; save(); go('poker'); ACTIONS.pkstart(); ACTIONS.pkstartblind(); }""")
            await pg.wait_for_timeout(700)
            m = await pg.evaluate("""()=>{ const sc=document.getElementById('screen'), t=document.querySelector('.pk-table'),
              a=document.querySelector('.pk-actions').getBoundingClientRect(), h=[...document.querySelectorAll('#hand .pcard')].pop().getBoundingClientRect(),
              d=document.getElementById('dock').getBoundingClientRect();
              return {screenH:sc.clientHeight, screenScroll:sc.scrollHeight, table:Math.round(t.getBoundingClientRect().height),
                      lastCardBottom:Math.round(h.bottom), actionsTop:Math.round(a.top), dockTop:Math.round(d.top)}; }""")
            print(f"{vw}x{vh}", m)
            await pg.close()
        await b.close()
asyncio.run(main())
