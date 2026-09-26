import io, os
SRC = 'src/'
ORDER = ['_dexblob.js','_atlas.js','_atlas_shiny.js','_lore.js','_pzportrait.js','_chars.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js',
         '30-capture.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','38-forage.js','39-daily.js','35-modules.js','40-battle.js','50-expedition.js','52-expgear.js','54-tower.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','60-poker.js',
         '70-collection.js','72-bag.js','73-cards.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','80-guide.js','81-cosmetics.js','85-journal.js','90-admin.js','95-online.js','99-boot.js']
js = []
for f in ORDER:
    js.append('/* ===== %s ===== */' % f)
    js.append(open(SRC+f, encoding='utf-8').read())
js = '\n'.join(js)
css = open(SRC+'style.css', encoding='utf-8').read()
tpl = open(SRC+'index.template.html', encoding='utf-8').read()
out = tpl.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
os.makedirs('dist', exist_ok=True)
open('dist/index.html','w',encoding='utf-8').write(out)
print('index.html', len(out), 'octets —', out.count('\n'), 'lignes')
