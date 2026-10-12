import asyncio
from playwright.async_api import async_playwright
FX = ["fx_tide","fx_magma","fx_aurora","fx_psy","fx_sacred","fx_shiny","fx_champion","fx_zero"]
BG = {"fx_tide":"bg_abyss","fx_magma":"bg_magma","fx_aurora":"bg_sky","fx_psy":"bg_psy","fx_sacred":"bg_johto","fx_shiny":"bg_shiny","fx_champion":"bg_felt","fx_zero":"bg_zero"}
FR = {"fx_tide":"frame_elements","fx_magma":"frame_gold","fx_aurora":"frame_birds","fx_psy":"frame_origin","fx_sacred":"frame_coin","fx_shiny":"frame_prism","fx_champion":"frame_champion","fx_zero":"frame_circuit"}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; for(let i=1;i<=151;i++) addToDex(i,30,i%9===0);
          S.cos.owned = Object.keys(COSMETICS); S.cos.avatar='shiny:6';
          S.ach = ACHIEVEMENTS.map(a=>a.id); save(); closeSheet();
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          const d=document.getElementById('discover'); if(d){ d.className=''; d.innerHTML=''; } }""")
        await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{ closeSheet(); }")
        for i,fx in enumerate(FX):
            await pg.evaluate(f"()=>{{ S.cos.fx='{fx}'; S.cos.bg='{BG[fx]}'; S.cos.frame='{FR[fx]}'; S.cos.title='title_archiviste'; save(); go('profile'); }}")
            await pg.evaluate("()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){ t.className=''; t.innerHTML=''; } }")
            await pg.wait_for_timeout(1400)
            await (await pg.query_selector(".hero")).screenshot(path=f"/tmp/shots/fx_{i}.png")
        await pg.evaluate("()=>{ go('capture'); const t=document.getElementById('tuto'); if(t){ t.className=''; t.innerHTML=''; } }"); await pg.wait_for_timeout(900)
        await (await pg.query_selector("#topbar")).screenshot(path="/tmp/shots/topbar.png")
        await pg.evaluate("()=>{ go('atelier'); ACTIONS.atab({t:'frame'}); const t=document.getElementById('tuto'); if(t){ t.className=''; t.innerHTML=''; } }"); await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/shots/atelier_frames.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
