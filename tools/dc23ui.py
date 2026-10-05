import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e) + " @ " + (e.stack or "").split("\n")[1][:100]))
        await pg.goto("http://localhost:8765/"); await pg.get_by_text("Entrer dans l'archive").wait_for(timeout=15000)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; PWA.onClose=null; }"); await pg.click(".cn-skip"); await pg.wait_for_timeout(800)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          S.level=30; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30,false); S.stats.expWins=1; S.flags.brecheIntro=true;
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          dcState().team=[131,25,6]; brState().hab='eaux'; save(); go('breche'); ACTIONS.brtab({t:'descent'}); ACTIONS.dcgo(); }""")
        await pg.wait_for_timeout(1200)
        # l'escalier : les portes
        await pg.evaluate("()=>{ const D=DC; D.bag.push({k:'h:i_orbe'},{k:'foudre'},{k:'radar'}); D.money=340; dcStairsModal(D); }")
        await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/shots/d2_doors.png")
        await pg.evaluate("()=>{ dcCloseModal(); ACTIONS.dcbag(); }"); await pg.wait_for_timeout(400); await pg.screenshot(path="/tmp/shots/d2_bag.png")
        await pg.evaluate("()=>{ dcCloseModal(); ACTIONS.dcstairs({go:'marchand'}); dcShopModal(DC); }"); await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/shots/d2_shop.png")
        # la glace sur l'eau : on cherche un plan d'eau et on le gele
        await pg.evaluate("""()=>{ dcCloseModal(); const D=DC; let w=null;
          for(let y=0;y<DC_H&&!w;y++) for(let x=0;x<DC_W&&!w;x++) if(D.tiles[dcIdx(x,y)]===T_WATER) w=[x,y];
          if(w){ const L=dcLeader(D); const free=[[w[0]-2,w[1]],[w[0],w[1]-2],[w[0]+2,w[1]],[w[0],w[1]+2]].find(([x,y])=>dcTile(D,x,y)===T_FLOOR);
            if(free){ L.x=free[0]; L.y=free[1]; L.px=L.x; L.py=L.y; }
            for(let k=0;k<D.seen.length;k++) D.seen[k]=1; dcVision(D);
            dcReact(D, 15, [[w[0],w[1]],[w[0]+1,w[1]],[w[0]-1,w[1]]], 0); } DC_TILECACHE=null; }""")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/d2_ice.png")
        # le gardien en actes
        await pg.evaluate("""()=>{ const D=DC; for(const a of D.ents) if(a.side==='ally'){ a.lv=15; a._f=null; dcFighter(a); a.hp=a.maxHp; }
          D.floor=DC_FLOORS-1; dcDescend(D); DC_TILECACHE=null; const rm=D.rooms[1], b=D.ents.find(e=>e.uid===D.boss);
          D.ents.filter(e=>e.side==='ally').forEach((a,i)=>{ a.x=rm.x+7+i; a.y=rm.y+12; a.px=a.x; a.py=a.y; }); b.x=rm.x+9; b.y=rm.y+9; b.px=b.x; b.py=b.y;
          dcVision(D); D.scen.intro=false; dcCorrode(D,1); dcPylons(D,b); D.scen.phase=2; dcHud(D); dcCtrl(D); }""")
        await pg.wait_for_timeout(800); await pg.screenshot(path="/tmp/shots/d2_boss.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
