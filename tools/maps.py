import asyncio
from playwright.async_api import async_playwright
HABS = [("route","arbre"),("foret","souche"),("eaux","remous"),("grotte","cristal"),("ruines","glyphe"),("foyer","geyser")]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.click(".cn-skip"); await pg.wait_for_timeout(700)
        await pg.evaluate("""()=>{ tutoMaybe=()=>false; const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=40; for(let i=1;i<=386;i++) if(!isExclusive(i)) addToDex(i,30,false);
          S.stats.expWins=1; S.flags.brecheIntro=true; S.ach=ACHIEVEMENTS.map(a=>a.id);
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          brState().starter=6; save(); closeSheet(); }""")
        for hab, mark in HABS:
            await pg.evaluate(f"()=>{{ brState().hab='{hab}'; go('breche'); }}")
            await pg.wait_for_timeout(400)
            await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(400)
            found = await pg.evaluate(f"""()=>{{ setInterval(()=>{{ if(BR){{ BR.pendingLevels=0; BR.chestsPending=0; BR.need=1e9; }} }},30);
              BR.t=40; BR.team.push({{id:25,lv:5,stage:1,show:26,cd:0,orb:0}},{{id:131,lv:4,stage:0,cd:0,orb:0}});
              brRecomputeMods(BR);
              /* on cherche le lieu signature le plus proche */
              for(let r=1;r<=4;r++) for(let cx=-r;cx<=r;cx++) for(let cy=-r;cy<=r;cy++){{
                const ch=brChunkAt(BR,cx,cy); const p=ch.pois.find(q=>q.k==='{mark}');
                if(p){{ BR.x=p.x+40; BR.y=p.y+90; BR.trail=[]; brMapNear(BR); return true; }} }}
              return false; }}""")
            await pg.evaluate("""()=>{ for(let k=0;k<22;k++){ const f=brSpawnFoe(BR,brSpecies(BR),'n'); const a=k/22*6.28; f.x=BR.x+Math.cos(a)*170; f.y=BR.y+Math.sin(a)*170; } }""")
            await pg.wait_for_timeout(2200)
            await pg.screenshot(path=f"/tmp/shots/m_{hab}.png")
            print(hab, "· lieu signature trouvé :", found)
            await pg.evaluate("brStop()"); await pg.wait_for_timeout(300)
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
