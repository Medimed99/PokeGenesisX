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
          brState().starter=6; save(); closeSheet(); go('breche'); }""")
        await pg.wait_for_timeout(600)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{ window.__pilot=setInterval(()=>{ if(!BR) return; const a=performance.now()/900; BR.joy={dx:Math.cos(a),dy:Math.sin(a),ox:0,oy:0,id:-1}; },100);
          BR.team.push({id:130,lv:5,stage:1,cd:0,orb:0},{id:6,lv:6,stage:0,cd:0,orb:0},{id:142,lv:4,stage:0,cd:0,orb:0},{id:149,lv:5,stage:0,cd:0,orb:0});
          BR.team[0].lv=8; BR.team[0].stage=2; BR.t=300; BR.need=1e9; BR.pendingLevels=0; BR.xp=0; brRecomputeMods(BR); brHudTeam(BR);
          for(const k of ['shooter','rusher','armored','splitter','shooter','armored']){ const f=brSpawnFoe(BR, 74+Math.floor(Math.random()*20), k); f.x=BR.x+(Math.random()-.5)*300; f.y=BR.y-160-Math.random()*160; }
          for(const k of ['turbo','magnet','berry']){ const p=BR.P.picks.get(); p.x=BR.x+60+Math.random()*50; p.y=BR.y+70; p.k=k; p.t=0; } }""")
        await pg.wait_for_timeout(2500); await pg.screenshot(path="/tmp/shots/e_threats.png")
        await pg.evaluate("()=>{ BR.turbo=5; }")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/e_turbo.png")
        await pg.evaluate("()=>{ BR.lv=8; const ch=brChoices(BR); BR.choices=null; BR.pendingLevels=0; BR.modal=true; BR.choices=[{k:'gold',g:BR_GOLD[0]}].concat(ch.filter(o=>o.k!=='gold').slice(0,2)); const m=document.getElementById('br-modal'); m.className='on lvl'; m.innerHTML=`<div class=br-lvup><div class=br-lvt>NIVEAU 9</div><div class=br-opts>${BR.choices.map((o,i)=>brChoiceHtml(BR,o,i)).join('')}</div></div>`; }")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/e_gold.png")
        await pg.click(".br-opt >> nth=0"); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{ const m=document.getElementById('br-modal'); m.className=''; m.innerHTML=''; BR.modal=false; BR.choices=null; BR.need=1e9; BR.pendingLevels=0; BR.chestsPending=0; }")
        await pg.evaluate("()=>{ BR.endless=true; BR.won=true; BR.bossOn=true; BR.t=BR.bossAt+11*60+58; BR.depth=11; BR.hp=BR.maxHp; }")
        await pg.wait_for_timeout(2600)
        await pg.evaluate("()=>{ const m=document.getElementById('br-modal'); m.className=''; m.innerHTML=''; BR.modal=false; BR.chestsPending=0; BR.pendingLevels=0; if(BR.reaper){ BR.reaper.x=BR.x+60; BR.reaper.y=BR.y-170; } }")
        await pg.wait_for_timeout(250); await pg.screenshot(path="/tmp/shots/e_reaper.png")
        print("faucheuse présente :", await pg.evaluate("!!(BR.reaper && BR.reaper.on)"), "· profondeur :", await pg.evaluate("BR.depth"))
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
