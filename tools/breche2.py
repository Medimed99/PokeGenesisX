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
          S.stats.expWins=1; S.flags.brecheIntro=true; S.ach=ACHIEVEMENTS.map(a=>a.id);
          brState().starter=4; save(); closeSheet(); go('breche');
          window.__ft=[]; let l=performance.now(); (function f(n){ window.__ft.push(n-l); l=n; requestAnimationFrame(f); })(l); }""")
        await pg.wait_for_timeout(700)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        # pilote : se deplace en cercle, choisit en priorite un nouveau Pokemon ou une amelioration
        await pg.evaluate("""()=>{ window.__pilot=setInterval(()=>{ if(!BR) return; const a=performance.now()/900;
            BR.keys={}; BR.joy={dx:Math.cos(a),dy:Math.sin(a),ox:0,oy:0,id:-1}; },100); }""")
        marks = {60:"b60", 120:"b120", 180:"b180"}; log=[]
        for step in range(900):
            await pg.wait_for_timeout(200)
            st = await pg.evaluate("""()=>{ let n=0; BR&&BR.P.foes.each(()=>n++);
              return {t:BR?BR.t:-1, modal:document.getElementById('br-modal').className, hp:BR?Math.round(BR.hp):0, lv:BR?BR.lv:0,
                      kills:BR?BR.kills:0, team:BR?BR.team.map(w=>w.lv).join('/'):'', foes:n, over:BR?BR.over:true}; }""")
            if "lvl" in st["modal"]:
                opts = await pg.query_selector_all(".br-opt")
                pickI = 0
                for i,o in enumerate(opts):
                    cls = await o.get_attribute("class")
                    if "new" in cls: pickI = i; break
                await opts[pickI].click()
            elif "evo" in st["modal"]:
                await pg.wait_for_timeout(1300); await pg.screenshot(path="/tmp/shots/b_evo_mid.png")
                await pg.wait_for_timeout(1500); await pg.screenshot(path="/tmp/shots/b_evo_end.png"); await pg.click("#br-evok")
            elif st["modal"].startswith("on"):
                await pg.wait_for_timeout(1500)
                if await pg.query_selector("#br-chestok"): await pg.click("#br-chestok")
                else: break
            for s,name in list(marks.items()):
                if st["t"] >= s:
                    await pg.screenshot(path=f"/tmp/shots/{name}.png"); del marks[s]
                    log.append(f"t={s}s niveau {st['lv']} · équipe {st['team']} · {st['foes']} ennemis · {st['kills']} K.O. · PV {st['hp']}")
            if st["t"] >= 185 or st["over"]: break
        ft = await pg.evaluate("()=>{ const a=window.__ft.slice(-600).filter(x=>x>0&&x<1000).sort((x,y)=>x-y); return {med:a[a.length>>1], p95:a[Math.floor(a.length*.95)]}; }")
        for l in log: print(l)
        print("fin :", st)
        print("temps de trame médian %.1f ms, 95e centile %.1f ms" % (ft["med"], ft["p95"]))
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
