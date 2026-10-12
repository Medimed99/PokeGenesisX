import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e) + " @ " + (e.stack or "").split("\n")[1][:120]))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; PWA.onClose=null; }"); await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=30; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30,false); S.stats.expWins=1; S.flags.brecheIntro=true;
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          brState().starter=6; brState().hab='route'; save(); go('breche'); }""")
        await pg.wait_for_timeout(500); await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(400)
        await pg.evaluate("""()=>{ setInterval(()=>{ if(BR){ BR.pendingLevels=0; BR.chestsPending=0; BR.need=1e9; if(BR.hp<BR.maxHp*0.5) BR.hp=BR.maxHp;
            if(BR.modal && !BR.over){ const m=document.getElementById('br-modal'); m.className=''; m.innerHTML=''; BR.modal=false; BR.choices=null; } } },30);
          BR.team.push({id:25,lv:6,stage:1,show:26,cd:0,orb:0},{id:94,lv:5,stage:0,cd:0,orb:0},{id:131,lv:5,stage:0,cd:0,orb:0});
          BR.guardian={id:144}; brRecomputeMods(BR); brHudTeam(BR); BR.t=BR.bossAt-0.1; }""")
        await pg.wait_for_timeout(1700); await pg.screenshot(path="/tmp/shots/bf_intro.png")
        await pg.wait_for_timeout(2600); await pg.screenshot(path="/tmp/shots/bf_arena.png")
        await pg.evaluate("()=>{ BR.boss.max=BR.boss.hp=1e6; BR.boss.hp=BR.boss.max*0.6; }")
        await pg.wait_for_timeout(1800); await pg.screenshot(path="/tmp/shots/bf_pylons.png")
        await pg.evaluate("()=>{ for(const p of (BR.scen&&BR.scen.pylons)||[]) p.hp=0; }"); await pg.wait_for_timeout(400)
        await pg.evaluate("()=>{ BR.boss.hp=BR.boss.max*0.3; }"); await pg.wait_for_timeout(1300)
        await pg.screenshot(path="/tmp/shots/bf_ult.png")
        await pg.wait_for_timeout(2400)
        await pg.evaluate("()=>{ BR.boss.hp=1; }"); await pg.wait_for_timeout(900)
        await pg.screenshot(path="/tmp/shots/bf_finale.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
