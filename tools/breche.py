import asyncio, math
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
          S.stats.expWins=1; S.flags.brecheIntro=true; S.ach=ACHIEVEMENTS.map(a=>a.id);
          const st=brState(); st.starter=4; save(); closeSheet(); go('breche'); }""")
        await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/shots/br_lobby.png")
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(600)
        keys = ["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"]
        shots = {5:"br_05", 40:"br_40", 90:"br_90", 150:"br_150"}
        elapsed = 0; lvshot = False
        for step in range(400):
            k = keys[(step//6) % 4]
            await pg.keyboard.down(k); await pg.wait_for_timeout(250); await pg.keyboard.up(k)
            st = await pg.evaluate("()=>({t:BR?BR.t:-1, modal:document.getElementById('br-modal').className, hp:BR?BR.hp:0, lv:BR?BR.lv:0, kills:BR?BR.kills:0, team:BR?BR.team.length:0, over:BR?BR.over:true})")
            if "lvl" in st["modal"]:
                if not lvshot: await pg.screenshot(path="/tmp/shots/br_lvl.png"); lvshot=True
                await pg.click(".br-opt >> nth=0"); await pg.wait_for_timeout(150)
            elif "evo" in st["modal"]:
                await pg.wait_for_timeout(1400); await pg.screenshot(path="/tmp/shots/br_evo.png"); await pg.wait_for_timeout(1500)
                await pg.click("#br-evok")
            elif st["modal"].startswith("on"):
                await pg.wait_for_timeout(1600)
                if await pg.query_selector("#br-chestok"): await pg.screenshot(path="/tmp/shots/br_chest.png"); await pg.click("#br-chestok")
                else: break
            for s,name in list(shots.items()):
                if st["t"] >= s: await pg.screenshot(path=f"/tmp/shots/{name}.png"); del shots[s]
            if st["t"] >= 160 or st["over"]: break
        print("état à la fin :", st)
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
