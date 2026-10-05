import csv, json, collections, io, os

D = '/home/claude/pcg/data/'
MAX = 386

def rows(f):
    with open(D+f, encoding='utf-8') as fh:
        return list(csv.DictReader(fh))

# --- french names
fr = {}
for r in rows('pokemon_species_names.csv'):
    if r['local_language_id'] == '5':
        fr[int(r['pokemon_species_id'])] = r['name']

# --- types
tn = {}
for r in rows('type_names.csv'):
    if r['local_language_id'] == '5':
        tn[int(r['type_id'])] = r['name']

ptypes = collections.defaultdict(list)
for r in rows('pokemon_types.csv'):
    pid = int(r['pokemon_id'])
    if pid <= MAX:
        ptypes[pid].append((int(r['slot']), int(r['type_id'])))

stats = collections.defaultdict(dict)
for r in rows('pokemon_stats.csv'):
    pid = int(r['pokemon_id'])
    if pid <= MAX:
        stats[pid][int(r['stat_id'])] = int(r['base_stat'])

species = {}
for r in rows('pokemon_species.csv'):
    i = int(r['id'])
    if i <= MAX:
        species[i] = r

STONES = {80:'sun',81:'moon',82:'fire',83:'thunder',84:'water',85:'leaf'}
evo = collections.defaultdict(list)  # from -> [(to, level, stone)]
seen = set()
for r in rows('pokemon_evolution.csv'):
    ev = int(r['evolved_species_id'])
    if ev > MAX or ev in seen:
        continue
    sp = species.get(ev)
    if not sp or not sp['evolves_from_species_id']:
        continue
    src = int(sp['evolves_from_species_id'])
    seen.add(ev)
    lvl = int(r['minimum_level']) if r['minimum_level'] else 0
    ti = int(r['trigger_item_id']) if r['trigger_item_id'] else 0
    stone = STONES.get(ti, 'link' if ti else '')
    trig = int(r['evolution_trigger_id'])
    if not lvl:
        lvl = 30 if stone else (36 if trig == 2 else 28)
    evo[src].append((ev, lvl, stone))

def rarity(sp, bst):
    if sp['is_mythical'] == '1':
        return 5
    if sp['is_legendary'] == '1':
        return 5
    c = int(sp['capture_rate'])
    if c >= 190: r = 0
    elif c >= 120: r = 1
    elif c >= 75: r = 2
    elif c >= 45: r = 3
    else: r = 4
    if bst >= 540 and r < 4: r = 4
    elif bst >= 480 and r < 3: r = 3
    return r

out = []
for i in range(1, MAX+1):
    sp = species[i]
    ts = [t for _, t in sorted(ptypes[i])]
    s = stats[i]
    st = [s[1], s[2], s[3], s[4], s[5], s[6]]
    bst = sum(st)
    leg = 2 if sp['is_mythical'] == '1' else (1 if sp['is_legendary'] == '1' else 0)
    ev = ';'.join('%d:%d:%s' % e for e in evo.get(i, []))
    out.append('|'.join([
        str(i), fr[i], ','.join(str(t) for t in ts), ','.join(str(x) for x in st),
        sp['capture_rate'], sp['generation_id'], str(rarity(sp, bst)), ev, str(leg)
    ]))

types_js = json.dumps({k: v for k, v in sorted(tn.items()) if k <= 18}, ensure_ascii=False)
blob = '\n'.join(out)
print('rows', len(out), 'bytes', len(blob))
with open('/home/claude/pcg/src/pokedex.blob', 'w', encoding='utf-8') as f:
    f.write(blob)
with open('/home/claude/pcg/src/types.json', 'w', encoding='utf-8') as f:
    f.write(types_js)
# sanity
legs = [o.split('|')[1] for o in out if o.split('|')[-1] != '0']
print('legendaires:', len(legs), legs[:12])
print(out[0]); print(out[24]); print(out[149]); print(out[382])
