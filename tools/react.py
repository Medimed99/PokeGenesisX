import asyncio, importlib.util
spec = importlib.util.spec_from_file_location("feel", "/tmp/feel.py"); feel = importlib.util.module_from_spec(spec)
src = open("/tmp/feel.py").read().split("async def main")[0]; exec(src, feel.__dict__)
from playwright.async_api import async_playwright
SCENE = """(cfg)=>{ setInterval(()=>{ if(BR){ BR.pendingLevels=0; BR.chestsPending=0; BR.need=1e9; BR.hp=BR.maxHp;
      if(BR.modal && !BR.over){ const m=document.getElementById('br-modal'); m.className=''; m.innerHTML=''; BR.modal=false; BR.choices=null; } } },30);
  BR.team.length=0; BR.team.push({id:cfg.id,lv:8,stage:0,cd:0,orb:0}); brRecomputeMods(BR); brHudTeam(BR);
  BR.t=200; BR.spawnAcc=-1e9; BR.P.foes.each(f=>{f.on=false});
  brMapNear(BR); for(const ch of BR.map.chunks.values()) ch.zones=[];
  const z={k:cfg.zone, x:BR.x+150, y:BR.y-40, r:110, seed:0.4, essai:true}; brAddZone(BR,z); brMapNear(BR);
  for(let k=0;k<14;k++){ const f=brSpawnFoe(BR, 60+k%8, 'n'); f.x=z.x+(Math.random()-.5)*150; f.y=z.y+(Math.random()-.5)*150; f.hp=f.max=5000; f.spd=8; }
  window.__noSpawn=setInterval(()=>{ if(BR) BR.spawnAcc=-1e9; },50); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
        for tag, hab, cfg in [("glace", "eaux", "{id:124, zone:'water'}"), ("feu", "route", "{id:6, zone:'grass'}")]:
            pg = await b.new_page(viewport={"width":390,"height":844}, device_scale_factor=2)
            await feel.boot(pg, hab)
            await pg.evaluate(f"(()=>{{ const f={SCENE}; f({cfg}); }})()")
            await pg.wait_for_timeout(3200)
            await pg.screenshot(path=f"/tmp/shots/re_{tag}.png")
            r = await pg.evaluate("()=>({réactions:Object.keys(BR.reactSeen||{}).join(','), glace:BR.map.near.zones.filter(z=>z.k==='ice').length, feu:BR.map.near.zones.filter(z=>z.burn>0||z.k==='ash').length, traces:(BR.decals||[]).length})")
            print(tag, r)
            await pg.close()
        await b.close()
asyncio.run(main())
