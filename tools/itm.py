import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/pcg/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.get_by_text("Entrer dans l'archive").click(); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{ tutoMaybe=()=>false; }"); await pg.click(".cn-skip"); await pg.wait_for_timeout(900)
        await pg.evaluate("""()=>{ closeSheet(); const t=document.getElementById('tuto'); if(t){t.className='';t.innerHTML='';}
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          S.level=25; S.balls={poke:40,super:12,hyper:5,data:8,master:1,safari:0}; S.berries={framby:3,nanab:2,nigma:1,sitrus:4,micle:1};
          S.stones={fire:1,water:2,thunder:1,moon:1}; S.items.potion=3; S.items.revive=2; S.items.radar=1; save(); go('bag'); }""")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/shots/i_bag.png")
        await pg.evaluate("go('shop')"); await pg.wait_for_timeout(600); await pg.screenshot(path="/tmp/shots/i_shop.png")
        await pg.evaluate("()=>{ SHOP_CAT='chests'; refresh(); }"); await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/shots/i_chests.png")
        await pg.evaluate("()=>{ ENC=null; go('capture'); }"); await pg.wait_for_timeout(900); await pg.screenshot(path="/tmp/shots/i_capture.png")
        await pg.evaluate("()=>revealSheet('ARCHIVE SCELLÉE', rewardItems({balls:{super:3}, berries:{sitrus:2}, cos:'frame_prism', coins:500}), {item:'chest:big'})")
        await pg.wait_for_timeout(2600); await pg.screenshot(path="/tmp/shots/i_reveal.png")
        print("erreurs :", errs[:3] or "aucune")
        await b.close()
asyncio.run(main())
