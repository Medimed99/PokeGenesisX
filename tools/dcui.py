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
          dcState().team=[6,25,94]; brState().hab='grotte'; save(); go('breche'); ACTIONS.brtab({t:'descent'}); }""")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/dc_lobby.png")
        await pg.evaluate("ACTIONS.dcgo()"); await pg.wait_for_timeout(1600); await pg.screenshot(path="/tmp/shots/dc_floor.png")
        # on amene un ennemi a portee pour voir l'apercu, puis on attaque
        await pg.evaluate("""()=>{ const D=DC, L=dcLeader(D); const f=D.ents.find(e=>e.side==='foe'); if(f){ f.x=L.x+2; f.y=L.y; f.px=f.x; f.py=f.y; f.awake=true; } dcVision(D); }""")
        await pg.wait_for_timeout(300)
        btn = pg.locator(".dc-mv").nth(1); box = await btn.bounding_box()
        await pg.mouse.move(box["x"]+20, box["y"]+20); await pg.mouse.down(); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/tmp/shots/dc_preview.png")
        await pg.mouse.up(); await pg.wait_for_timeout(330); await pg.screenshot(path="/tmp/shots/dc_attack.png")
        await pg.wait_for_timeout(900)
        # l'etage du gardien
        await pg.evaluate("""()=>{ const D=DC; for(const a of D.ents) if(a.side==='ally'){ a.lv=14; a._f=null; dcFighter(a); a.hp=a.maxHp; }
          D.floor=DC_FLOORS-1; dcDescend(D); DC_TILECACHE=null; const L=dcLeader(D), rm=D.rooms[1], b=D.ents.find(e=>e.uid===D.boss);
          D.ents.filter(e=>e.side==='ally').forEach((a,i)=>{ a.x=rm.x+4+i; a.y=rm.y+8; a.px=a.x; a.py=a.y; }); b.x=rm.x+8; b.y=rm.y+6; b.px=b.x; b.py=b.y;
          dcVision(D); D.scen.phase=2; b.hp=Math.round(b.maxHp*0.25); dcBossTurn(D,0); dcHud(D); dcCtrl(D); }""")
        await pg.wait_for_timeout(900); await pg.screenshot(path="/tmp/shots/dc_boss.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
