import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; }")
        await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          S.level=25; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30,false); S.stats.expWins=1; S.flags.brecheIntro=true;
          S.ach=ACHIEVEMENTS.map(a=>a.id); S.balls.poke=50; S.selBall='poke'; save(); ENC=null; go('capture'); }""")
        await pg.wait_for_timeout(1500); await pg.screenshot(path="/tmp/shots/r_ring1.png")
        await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/shots/r_ring2.png")
        # on vise le petit cercle : on attend que l'echelle passe sous 0,36
        await pg.evaluate("""()=>new Promise(res=>{ const iv=setInterval(()=>{ if(ringActive() && ringScale()<0.33){ clearInterval(iv); ACTIONS.throwsel(); res(); } },10); setTimeout(()=>{clearInterval(iv);res();},4000); })""")
        await pg.wait_for_timeout(250); await pg.screenshot(path="/tmp/shots/r_grade.png")
        print("lancers Excellent comptés :", await pg.evaluate("S.stats.excellent||0"))
        # la saison
        await pg.evaluate("()=>{ evState().pts=260; go('breche'); ACTIONS.brtab({t:'season'}); }")
        await pg.wait_for_timeout(800); await pg.screenshot(path="/tmp/shots/r_season.png", full_page=True)
        # une run, puis la carte de partage
        await pg.evaluate("()=>{ ACTIONS.brtab({t:'run'}); }"); await pg.wait_for_timeout(300)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{ BR.team.push({id:150,lv:6,stage:0,cd:0,orb:0},{id:25,lv:5,stage:1,show:26,cd:0,orb:0},{id:94,lv:4,stage:0,cd:0,orb:0});
          BR.t=412; BR.kills=3367; BR.lv=19; BR.missions.forEach((m,i)=>{ if(i<2) m.done=true; }); }""")
        await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{ BR.paused=false; brFinish(BR, false, false); }"); await pg.wait_for_timeout(600)
        await pg.screenshot(path="/tmp/shots/r_results.png")
        await pg.evaluate("ACTIONS.brshare()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path="/tmp/shots/r_share.png")
        png = await pg.evaluate("BR.shareCanvas.toDataURL('image/png')")
        import base64; open("/tmp/shots/r_card.png","wb").write(base64.b64decode(png.split(",")[1]))
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
