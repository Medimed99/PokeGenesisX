import asyncio
from playwright.async_api import async_playwright
async def boot(pg, hab):
    await pg.goto("http://localhost:8765/"); await pg.get_by_text("Entrer dans l'archive").wait_for(timeout=15000)
    await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(500)
    await pg.evaluate("()=>{ tutoMaybe=()=>false; PWA.onClose=null; }")
    await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
    await pg.evaluate(f"""()=>{{ closeSheet(); const t=document.getElementById('tuto'); if(t){{t.className='';t.innerHTML='';}}
      S.level=40; for(let i=1;i<=386;i++) if(!isExclusive(i)) addToDex(i,30,false); S.stats.expWins=1; S.flags.brecheIntro=true;
      const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
      brState().starter=6; brState().hab='{hab}'; save(); go('breche'); }}""")
    await pg.wait_for_timeout(500); await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(400)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await boot(pg, "eaux")
        await pg.evaluate("""()=>{ setInterval(()=>{ if(BR){ BR.pendingLevels=0; BR.chestsPending=0; BR.need=1e9; BR.hp=BR.maxHp; if(BR.modal && !BR.over){ const m=document.getElementById('br-modal'); m.className=''; m.innerHTML=''; BR.modal=false; BR.choices=null; } } },30);
          BR.team.push({id:124,lv:6,stage:0,cd:0,orb:0},{id:25,lv:6,stage:0,cd:0,orb:0},{id:131,lv:5,stage:0,cd:0,orb:0});
          BR.t=200; brRecomputeMods(BR); brHudTeam(BR); brMapNear(BR);
          /* on se place au bord d'un etang, et la horde y patauge */
          let best=null; for(const z of BR.map.near.zones) if(z.k==='water' && (!best || z.r>best.r)) best=z;
          if(best){ BR.x=best.x-best.r-30; BR.y=best.y; }
          for(let k=0;k<26;k++){ const f=brSpawnFoe(BR, 60+k%10, k%5===0?'shooter':'n'); f.x=(best?best.x:BR.x+150)+(Math.random()-.5)*best.r*1.4; f.y=(best?best.y:BR.y)+(Math.random()-.5)*best.r*1.4; f.hp=f.max=4000; }
          brTicker(BR, "ÉLITE DÉFRAGMENTÉ", "#ff3d7f"); }""")
        for k in range(3):
            await pg.wait_for_timeout(1400); await pg.screenshot(path=f"/tmp/shots/fe_{k}.png")
        info = await pg.evaluate("""()=>({traces: (BR.decals||[]).length, glace: BR.map.near.zones.filter(z=>z.k==='ice').length,
          poses_chargées: Object.values(BR_PMDX).filter(e=>e.img.complete && e.img.naturalWidth).length, poses_échec: Object.values(BR_PMDX).filter(e=>e.bad).length,
          réactions: Object.keys(BR.reactSeen||{}).join(',')})""")
        print("Nappes :", info)
        # boss : Onix qui s'enterre, puis Artikodin et son sol gele
        await pg.evaluate("""()=>{ BR.P.foes.each(f=>{f.on=false}); const b=brSpawnFoe(BR,95,'boss'); b.x=BR.x+180; b.y=BR.y-60; BR.boss=b; BR.bossOn=true; b.max=b.hp=1e6; b.pattern=0; b.atk=0; }""")
        await pg.wait_for_timeout(1300); await pg.screenshot(path="/tmp/shots/fe_burrow.png")
        await pg.wait_for_timeout(1700); await pg.screenshot(path="/tmp/shots/fe_emerge.png")
        await pg.evaluate("""()=>{ BR.boss.on=false; const b=brSpawnFoe(BR,379,'boss'); b.x=BR.x+150; b.y=BR.y-120; BR.boss=b; b.max=b.hp=1e6; b.pattern=0; b.atk=0; }""")
        await pg.wait_for_timeout(1500); await pg.screenshot(path="/tmp/shots/fe_laser.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
