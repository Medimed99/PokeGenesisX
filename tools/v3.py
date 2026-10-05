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
          S.level=20; for(let i=1;i<=151;i++) if(!isExclusive(i)) addToDex(i,30, [6,25,94,130,143,150,149,3].includes(i));
          S.stats.expWins=1; S.flags.brecheIntro=true; S.ach=ACHIEVEMENTS.map(a=>a.id);
          const tt=document.getElementById('toasts'); if(tt) tt.style.display='none';
          brState().starter=6; save(); closeSheet(); go('dex'); }""")
        await pg.wait_for_timeout(1200); await pg.screenshot(path="/tmp/shots/f_dex.png")
        # comparaison normale / chromatique
        await pg.evaluate("""()=>{ const d=document.createElement('div'); d.id='cmp';
          d.style.cssText='position:fixed;inset:0;z-index:999;background:#0a0f18;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:60px 10px;align-content:start';
          d.innerHTML=[6,25,94,130,150,149,3,143].map(id=>`<div style="text-align:center;color:#fff;font:11px monospace">
            <span class="sprbox" style="width:72px;height:72px">${sprite(id,false,'')}</span>
            <span class="sprbox" style="width:72px;height:72px">${sprite(id,true,'')}</span><div>${POKE[id].name}</div></div>`).join('');
          document.body.appendChild(d); }""")
        await pg.wait_for_timeout(900); await pg.screenshot(path="/tmp/shots/f_cmp.png")
        await pg.evaluate("document.getElementById('cmp').remove(); go('breche')")
        await pg.wait_for_timeout(600)
        await pg.click("text=ENTRER DANS LA BRÈCHE"); await pg.wait_for_timeout(500)
        await pg.evaluate("""()=>{ BR.team.push({id:25,lv:6,stage:1,show:26,cd:0,orb:0},{id:94,lv:4,stage:0,cd:0,orb:0},{id:130,lv:8,stage:2,cd:0,orb:0});
          BR.items.cat10=2; BR.items.restes=1; BR.items.bouclier=2; BR.items.orbe=1; BR.bonusDmg=0.15; BR.revive=1;
          BR.t=200; BR.nextElite=240; BR.need=1e9; BR.xp=0; BR.pendingLevels=0; BR.chestsPending=0; brRecomputeMods(BR); brHudTeam(BR); brTrack(BR);
          for(let k=0;k<30;k++){ const f=brSpawnFoe(BR,19+k%10,'n'); const a=k/30*6.28; f.x=BR.x+Math.cos(a)*60; f.y=BR.y+Math.sin(a)*60; }
          const f=brSpawnFoe(BR,94,'elite'); f.shiny=true; f.x=BR.x+110; f.y=BR.y-60; }""")
        await pg.wait_for_timeout(1500); await pg.screenshot(path="/tmp/shots/f_hud.png")
        # pause automatique : on declenche une montee de niveau, encercle, et on mesure
        await pg.evaluate("()=>{ BR.hp=BR.maxHp; BR.inv=0; BR.pendingLevels=1; }")
        await pg.wait_for_timeout(400)
        a = await pg.evaluate("()=>({t:BR.t, hp:BR.hp, modal:BR.modal})")
        await pg.wait_for_timeout(3000)
        c = await pg.evaluate("()=>({t:BR.t, hp:BR.hp, modal:BR.modal})")
        print("pendant le choix : temps %.2f → %.2f · PV %.1f → %.1f · figé : %s" % (a['t'], c['t'], a['hp'], c['hp'], "oui" if a['t']==c['t'] and a['hp']==c['hp'] and c['modal'] else "NON"))
        await pg.click(".br-opt >> nth=0"); await pg.wait_for_timeout(100)
        d = await pg.evaluate("()=>({inv:BR.inv, modal:BR.modal})")
        print("à la reprise : invulnérabilité %.2f s · choix fermé : %s" % (d['inv'], not d['modal']))
        print("erreurs :", errs[:4] or "aucune")
        await b.close()
asyncio.run(main())
