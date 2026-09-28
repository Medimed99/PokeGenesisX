import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(700)
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=20; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30,false);
          S.stats.expWins=1; S.flags.brecheIntro=true; S.ach=ACHIEVEMENTS.map(a=>a.id);
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          brState().starter=6; save(); closeSheet(); go('breche'); }""")
        await pg.wait_for_timeout(600)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{ setInterval(()=>{ if(BR){ BR.pendingLevels=0; BR.chestsPending=0; BR.need=1e9; } },30);
          BR.team.push({id:25,lv:6,stage:1,show:26,cd:0,orb:0},{id:94,lv:4,stage:0,cd:0,orb:0},{id:130,lv:8,stage:2,cd:0,orb:0});
          BR.team[0].lv=5; BR.team[0].stage=1; BR.team[0].show=5;
          BR.items.cat10=2; BR.items.restes=1; BR.items.bouclier=2; BR.items.orbe=1; BR.bonusDmg=0.15; BR.revive=1;
          BR.t=200; BR.lv=11; BR.xp=0; BR.hp=BR.maxHp*0.72; brRecomputeMods(BR); brHudTeam(BR); brTrack(BR); }""")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path="/tmp/shots/g_hud.png")
        await b.close()
asyncio.run(main())
