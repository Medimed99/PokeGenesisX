import asyncio, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(700)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        # une partie avancee : niveau 10, quelques especes, un oeuf, des cosmetiques
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; startTuto=()=>false;
          const t=document.getElementById('tuto'); if(t) t.className='';
          S.level=10; S.team=[1,4,7];
          for(let i=1;i<=60;i++) addToDex(i,20,i===25);
          grantEgg('e_common'); S.flags.eggReveal=null;
          S.cos.owned.push('fx_prism','title_titulaire'); save(); }""")
        shots = [("modules","hub"), ("profile","profil"), ("atelier","atelier_avatar"), ("dex","collection"), ("bag","sac")]
        for scr, name in shots:
            await pg.evaluate(f"go('{scr}')"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f"/tmp/shots/ui_{name}.png")
        await pg.evaluate("go('atelier'); ACTIONS.atab({t:'fx'})"); await pg.wait_for_timeout(600)
        await pg.screenshot(path="/tmp/shots/ui_atelier_fx.png")
        await pg.evaluate("go('settings')"); await pg.wait_for_timeout(500)
        await pg.evaluate("ACTIONS.toggleset({k:'admin'})"); await pg.wait_for_timeout(500)
        await pg.fill("#adm-pw", "mauvais"); await pg.click("text=Déverrouiller"); await pg.wait_for_timeout(300)
        bad = await pg.evaluate("S.settings.admin")
        await pg.fill("#adm-pw", os.environ.get("PCG_ADMIN_PW", "")); await pg.click("text=Déverrouiller"); await pg.wait_for_timeout(400)
        good = await pg.evaluate("S.settings.admin")
        print("mauvais mot de passe → panneau activé :", bad, "| bon mot de passe → activé :", good)
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
