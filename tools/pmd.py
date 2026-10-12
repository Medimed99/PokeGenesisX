import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(700)
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          closeSheet(); S.level=40; for(let i=1;i<=386;i++) if(!isExclusive(i)) addToDex(i,30,false);
          S.stats.expWins=1; S.flags.brecheIntro=true; S.ach=ACHIEVEMENTS.map(a=>a.id);
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          brState().starter=6; brState().hab='route'; save(); go('breche'); }""")
        await pg.wait_for_timeout(500)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(400)
        await pg.evaluate("""()=>{ setInterval(()=>{ if(BR){ BR.pendingLevels=0; BR.chestsPending=0; BR.need=1e9; } },30);
          BR.team.push({id:150,lv:4,stage:0,cd:0,orb:0},{id:384,lv:4,stage:0,cd:0,orb:0},{id:25,lv:3,stage:0,cd:0,orb:0},{id:94,lv:3,stage:0,cd:0,orb:0},{id:131,lv:3,stage:0,cd:0,orb:0});
          BR.t=120; brRecomputeMods(BR); brHudTeam(BR);
          window.__pilot=setInterval(()=>{ if(!BR) return; const a=performance.now()/1400; BR.joy={dx:Math.cos(a),dy:Math.sin(a),ox:0,oy:0,id:-1}; },80); }""")
        for k in range(4):
            await pg.wait_for_timeout(1600)
            await pg.screenshot(path=f"/tmp/shots/pm_{k}.png")
        info = await pg.evaluate("""()=>({pmdPrêtes:Object.values(BR_PMD).filter(e=>e.img.complete&&e.img.naturalWidth).length,
            ennemis:(()=>{let n=0;BR.P.foes.each(()=>n++);return n})(), attaques:BR.team.map(w=>brArch(brShownId(w)).n).join(' · ')})""")
        print(info)
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
