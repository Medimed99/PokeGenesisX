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
          brState().starter=4; brState().region='kanto'; brState().hab='foyer'; save(); closeSheet(); go('breche'); }""")
        await pg.wait_for_timeout(600)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{ window.__pilot=setInterval(()=>{ if(!BR) return; const a=performance.now()/900;
            BR.joy={dx:Math.cos(a),dy:Math.sin(a),ox:0,oy:0,id:-1}; },100);
          BR.team.push({id:25,lv:6,stage:1,cd:0,orb:0},{id:92,lv:6,stage:0,cd:0,orb:0},{id:131,lv:5,stage:0,cd:0,orb:0});
          BR.team[0].lv=8; BR.team[0].stage=1; BR.team[0].show=5; BR.items.cat10=1; BR.items.bandeau=3; brRecomputeMods(BR); brHudTeam(BR); }""")
        await pg.wait_for_timeout(9000)
        await pg.screenshot(path="/tmp/shots/c_combat.png")
        await pg.evaluate("()=>{ BR.chestsPending=1; }")
        await pg.wait_for_timeout(1300); await pg.screenshot(path="/tmp/shots/c_evo1.png")
        await pg.wait_for_timeout(1700); await pg.screenshot(path="/tmp/shots/c_evo2.png")
        await pg.click("#br-evok"); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{ BR.t=478; BR.lv=16; BR.hp=BR.maxHp; }")
        await pg.wait_for_timeout(4200); await pg.screenshot(path="/tmp/shots/c_boss1.png")
        await pg.wait_for_timeout(3500); await pg.screenshot(path="/tmp/shots/c_boss2.png")
        await pg.evaluate("()=>{ if(BR.boss){ BR.boss.hp=5; brHit(BR, BR.boss, 999, '#fff', 0,0,0); } }")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/c_down.png")
        await pg.wait_for_timeout(2600); await pg.screenshot(path="/tmp/shots/c_victory.png")
        await pg.click("text=Encaisser la victoire"); await pg.wait_for_timeout(700)
        await pg.screenshot(path="/tmp/shots/c_results.png")
        print("verrou levé :", await pg.evaluate("S.bosses.includes('kanto:144') || S.bosses.length"))
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
