import io, os
from buildver import stamp_label, source_version, version_js
SRC = 'src/'
ORDER = ['_dexblob.js','_atlas.js','_atlas_shiny.js','_pmd.js','_items.js','_pmdimg.js','_lore.js','_pzportrait.js','_chars.js','_trainers.js','_cardart.js','00-slugs.js','01-data.js','02-story.js','10-core.js','15-fx.js','20-ui.js',
         '30-capture.js','30b-stakes.js','30c-onze.js','30c-bonus.js','32-world.js','33-fishing.js','34-research.js','36-lore.js','37-cine.js','37b-moments.js','37c-stage.js','38-forage.js','38b-forge.js','38c-dig-plus.js','39-daily.js','39b-events.js','39c-session.js','39p-demandes.js','39r-rival.js','35-modules.js','40-battle.js','40b-picker.js','41-arena.js','42-team.js','50-expedition.js','51-expscene.js','51m-expmap.js','52-expgear.js','54-tower.js','55-squad.js','55b-squad-ui.js','55c-squad-fight.js','55h-histoire.js','56-breche.js','57-breche-run.js','58-breche-ui.js','59-breche-plus.js','59m-breche-map.js','59a-breche-attacks.js','59p-breche-pmd.js','59f-breche-feel.js','59g-breche-bossfight.js','59s-breche-share.js','59d-breche-depth.js','59k-breche-fx.js','59w-breche-world.js','60-poker.js','61-poker-content.js','62-poker-table.js',
         '70-collection.js','72-bag.js','73-cards.js','73b-cardpowers.js','73c-cardreveal.js','73d-reindex.js','73e-provenance.js','73f-chrono.js','73g-pzcard.js','73h-eras.js','73i-displaymodes.js','73j-cardnews.js','74-eggs.js','75-extras.js','76-items.js','77-secrets.js','78-milestones.js','79-ux.js','79b-world.js','79c-legend.js','80-guide.js','81-cosmetics.js','85-journal.js','86-saga.js','87-finale.js','88-share-mn.js','90-admin.js','95-online.js','95b-social.js','96-pwa.js','96b-music.js','99-boot.js']
# la version : datee maintenant, empreinte des sources (voir buildver.py)
label = stamp_label()
ver = source_version(SRC, ORDER, label)
js = [version_js(ver, label)]
for f in ORDER:
    js.append('/* ===== %s ===== */' % f)
    js.append(open(SRC+f, encoding='utf-8').read())
js = '\n'.join(js)
css = open(SRC+'style.css', encoding='utf-8').read()
tpl = open(SRC+'index.template.html', encoding='utf-8').read()
out = tpl.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
os.makedirs('dist', exist_ok=True)
open('dist/index.html','w',encoding='utf-8').write(out)
print('index.html', len(out), 'octets —', out.count('\n'), 'lignes — version du', label, '·', ver)
