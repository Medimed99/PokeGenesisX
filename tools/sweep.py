import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e) + " @ " + (e.stack or "").split("\n")[1].strip()[:110]))
        await pg.goto("http://localhost:8765/"); await pg.get_by_text("Entrer dans l'archive").wait_for(timeout=15000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; PWA.onClose=null; }"); await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=40; for(let i=1;i<=386;i++) if(!isExclusive(i)) addToDex(i,25,false); S.team=[6,25,94];
          S.expedition={team:[{id:6,hp:10}]}; S.towerRun={floor:2};   /* un ancien parcours en cours */
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none'; save(); }""")
        # 1. chaque ecran
        keys = await pg.evaluate("Object.keys(SCREENS)")
        bad = []
        for k in keys:
            n0 = len(errs)
            try:
                await pg.evaluate(f"()=>{{ closeSheet(); go('{k}'); }}"); await pg.wait_for_timeout(120)
            except Exception as ex: errs.append(f"{k}: {ex}")
            if len(errs) > n0: bad.append(k)
        print(f"écrans visités : {len(keys)} · en erreur : {bad or 'aucun'}")
        await pg.evaluate("()=>{ closeSheet(); go('modules'); }"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/tmp/shots/s_hub.png")
        await pg.evaluate("()=>{ go('descente'); }"); await pg.wait_for_timeout(400); await pg.screenshot(path="/tmp/shots/s_descente.png")
        print("ancien parcours clos :", await pg.evaluate("!S.expedition && !S.towerRun && !!S.flags.dcMigrated"))
        # 2. une Descente entiere en automatique
        await pg.evaluate("""()=>{ dcState().team=[149,65,130]; brState().hab='foyer'; DC_MODE='normal'; ACTIONS.dcgo();
          setTimeout(()=>{ DC.auto=true; dcCtrl(DC); }, 300);
          window.__mod=setInterval(()=>{ const D=DC; if(!D) return;
            if(D.recruitAsk){ dcCloseModal(); dcAcceptRecruit(D, true); }
            if(D.modal && !D.over){ dcCloseModal(); } }, 120); }""")
        for k in range(6):
            await pg.wait_for_timeout(5000)
            st = await pg.evaluate("()=>DC ? ({étage:DC.floor, tours:DC.turn, fin:DC.over, porte:DC.mod, sac:DC.bag.length}) : 'terminée'")
            print("   Descente :", st)
            if k == 2: await pg.screenshot(path="/tmp/shots/s_run.png")
            if st == "terminée" or (isinstance(st, dict) and st.get("fin")): break
        # 3. une run de Breche
        await pg.evaluate("()=>{ clearInterval(window.__mod); if(DC){ DC.over='lost'; dcExit(); } S.stats.expWins=Math.max(1,S.stats.expWins); go('breche'); ACTIONS.brtab({t:'run'}); }")
        await pg.wait_for_timeout(500)
        try:
            await pg.click("text=ENTRER DANS LA BRÈCHE", timeout=3000); await pg.wait_for_timeout(4000)
        except Exception as ex: errs.append("brèche : " + str(ex)[:80])
        print("erreurs JavaScript :", len(errs))
        for e in errs[:6]: print("  ", e)
        await b.close()
asyncio.run(main())
