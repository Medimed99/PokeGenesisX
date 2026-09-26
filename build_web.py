"""Produit la version hebergee du jeu, dans web/.

Difference avec dist/index.html : les images ne sont plus encodees en base64
dans le HTML mais servies comme fichiers. Consequences directes :

  - le HTML tombe de ~1,2 Mo a ~180 Ko, donc premier affichage bien plus rapide ;
  - les images sont mises en cache par le navigateur et par le CDN, une seule
    fois, au lieu d'etre retelechargees avec chaque version du HTML ;
  - un service worker peut les mettre en cache pour un fonctionnement hors ligne
    et une installation PWA reelle.

La version embarquee reste construite par build.py : elle sert des qu'il n'y a
pas d'hebergement (fichier ouvert localement, cadre restreint).
"""
import base64, os, re, shutil, json, hashlib

SRC, OUT = "src", "web"
ASSETS = os.path.join(OUT, "assets")

# --- ordre de concatenation, partage avec build.py -------------------------
ORDER = re.search(r"ORDER = \[([\s\S]*?)\]", open("build.py", encoding="utf-8").read()).group(1)
ORDER = [x.strip().strip("'\"") for x in ORDER.split(",") if x.strip()]

os.makedirs(ASSETS, exist_ok=True)

# --- extraction des images embarquees vers de vrais fichiers ---------------
def extract(js_file, const, out_name):
    s = open(os.path.join(SRC, js_file), encoding="utf-8").read()
    m = re.search(const + r'\s*=\s*"data:image/png;base64,([A-Za-z0-9+/=]+)"', s)
    if not m:
        return None
    data = base64.b64decode(m.group(1))
    open(os.path.join(ASSETS, out_name), "wb").write(data)
    return len(data)

sizes = {
    "atlas.png":     extract("_atlas.js", "ATLAS_URL", "atlas.png"),
    "pz.png":        extract("_pzportrait.js", "PZ_STRIP", "pz.png"),
    "prof.png":      extract("_chars.js", "PROF_PORTRAIT", "prof.png"),
    "missingno.png": extract("_chars.js", "MISSING_SPRITE", "missingno.png"),
    "atlas_shiny.png": extract("_atlas_shiny.js", "ATLAS_SHINY_URL", "atlas_shiny.png"),
    "prof_full.png": extract("_chars.js", "PROF_FULL", "prof_full.png"),
    "cardart.png":   extract("_cardart.js", "CARD_ATLAS", "cardart.png"),
}

# --- empreintes : un nom de fichier change quand le contenu change ---------
def fingerprint(name):
    p = os.path.join(ASSETS, name)
    h = hashlib.sha1(open(p, "rb").read()).hexdigest()[:8]
    root, ext = os.path.splitext(name)
    new = f"{root}.{h}{ext}"
    os.replace(p, os.path.join(ASSETS, new))
    return "assets/" + new

paths = {n: fingerprint(n) for n in sizes if sizes[n]}

# --- constantes de l'atlas, relues depuis le module embarque ---------------
atlas_js = open(os.path.join(SRC, "_atlas.js"), encoding="utf-8").read()
cols, rows, n, back0 = re.search(
    r"ATLAS_COLS=(\d+), ATLAS_ROWS=(\d+), ATLAS_N=(\d+), ATLAS_BACK0=(\d+)", atlas_js).groups()
card_js = open(os.path.join(SRC, "_cardart.js"), encoding="utf-8").read()
card_cols, card_rows, card_cell = re.search(
    r"CARD_COLS=(\d+), CARD_ROWS=(\d+), CARD_CELL=(\d+)", card_js).groups()
card_series = re.search(r"const CARD_SERIES=(\[.*?\]);", card_js, re.S).group(1)
card_index  = re.search(r"const CARD_INDEX=(\{.*?\});", card_js, re.S).group(1)
pz_js = open(os.path.join(SRC, "_pzportrait.js"), encoding="utf-8").read()
pz_emos = re.search(r"const PZ_EMOS = (\[[^\]]+\]);", pz_js).group(1)
pz_w, pz_h = re.search(r"const PZ_W = (\d+), PZ_H = (\d+);", pz_js).groups()

assets_js = f"""/* Version hebergee : les images sont servies comme fichiers, pas encodees
   dans le HTML. Les noms portent une empreinte : on peut donc les mettre en
   cache indefiniment sans jamais servir une version perimee. */
const ATLAS_COLS={cols}, ATLAS_ROWS={rows}, ATLAS_N={n}, ATLAS_BACK0={back0};
const ATLAS_URL="{paths['atlas.png']}";
const ATLAS_SHINY_URL="{paths.get('atlas_shiny.png') or paths['atlas.png']}";
const PZ_EMOS = {pz_emos};
const PZ_W = {pz_w}, PZ_H = {pz_h};
const PZ_STRIP="{paths['pz.png']}";
const PROF_PORTRAIT="{paths['prof.png']}";
const MISSING_SPRITE="{paths['missingno.png']}";
const PROF_FULL="{paths.get('prof_full.png') or ''}";
const CARD_COLS={card_cols}, CARD_ROWS={card_rows}, CARD_CELL={card_cell};
const CARD_SERIES={card_series};
const CARD_INDEX={card_index};
const CARD_ATLAS="{paths['cardart.png']}";
"""

# --- configuration du service en ligne, depuis l'environnement -------------
sb_url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
sb_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
config_js = f"""/* Renseigne au moment du build depuis les variables d'environnement
   SUPABASE_URL et SUPABASE_ANON_KEY. Laisse vide, le jeu reste jouable :
   le joueur peut saisir les valeurs lui-meme dans Profil > En ligne. */
window.PCG_CONFIG = {{ url: {json.dumps(sb_url)}, key: {json.dumps(sb_key)} }};
"""

# --- assemblage du script --------------------------------------------------
parts = []
for f in ORDER:
    if f in ("_atlas.js", "_atlas_shiny.js", "_pzportrait.js", "_chars.js", "_cardart.js"):
        continue
    parts.append(f"/* ===== {f} ===== */")
    parts.append(open(os.path.join(SRC, f), encoding="utf-8").read())
js = assets_js + "\n" + "\n".join(parts)
css = open(os.path.join(SRC, "style.css"), encoding="utf-8").read()

tpl = open(os.path.join(SRC, "index.template.html"), encoding="utf-8").read()
tpl = tpl.replace("/*__CSS__*/", css).replace("/*__JS__*/", js)

# manifeste et service worker reels : l'installation PWA devient possible
tpl = tpl.replace("</head>",
    '<link rel="manifest" href="manifest.webmanifest">\n'
    f'<link rel="icon" href="{paths["pz.png"]}">\n'
    '<script src="config.js"></script>\n</head>')
tpl = tpl.replace("</body>",
    """<script>
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}
</script>
</body>""")
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(tpl)
open(os.path.join(OUT, "config.js"), "w", encoding="utf-8").write(config_js)

# --- manifeste PWA ---------------------------------------------------------
manifest = {
    "name": "Pokémon Code Genesis",
    "short_name": "Code Genesis",
    "description": "Jeu de collection fan-made. Le monde est un fichier corrompu ; vous êtes l'Archiviste.",
    "start_url": ".",
    "scope": ".",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#04060b",
    "theme_color": "#04060b",
    "icons": [
        {"src": paths["pz.png"], "sizes": "400x40", "type": "image/png"},
        {"src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable"}
    ]
}
open(os.path.join(OUT, "manifest.webmanifest"), "w", encoding="utf-8").write(
    json.dumps(manifest, ensure_ascii=False, indent=2))

open(os.path.join(OUT, "icon.svg"), "w", encoding="utf-8").write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">'
    '<rect width="192" height="192" fill="#05070c"/>'
    '<circle cx="96" cy="96" r="58" fill="none" stroke="#35f0d6" stroke-width="10"/>'
    '<path d="M38 96h116" stroke="#35f0d6" stroke-width="10"/>'
    '<circle cx="96" cy="96" r="20" fill="#ff3d7f"/></svg>')

# --- service worker --------------------------------------------------------
html_hash = hashlib.sha1(tpl.encode()).hexdigest()[:8]
precache = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"] + list(paths.values())
sw = f"""/* Service worker : les images portent une empreinte, on peut donc les garder
   indefiniment. Le HTML passe par le reseau d'abord, pour qu'une nouvelle
   version soit prise en compte des le rechargement suivant. */
const CACHE = "pcg-{html_hash}";
const PRECACHE = {json.dumps(precache, ensure_ascii=False)};

self.addEventListener("install", e => {{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
}});

self.addEventListener("activate", e => {{
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
}});

self.addEventListener("fetch", e => {{
  const url = new URL(e.request.url);
  if(e.request.method !== "GET" || url.origin !== self.location.origin) return;

  /* les appels au service en ligne ne doivent jamais etre servis depuis le cache */
  if(url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) return;

  if(url.pathname.includes("/assets/")){{
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {{
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }})));
    return;
  }}
  e.respondWith(fetch(e.request)
    .then(r => {{
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }})
    .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html"))));
}});
"""
open(os.path.join(OUT, "sw.js"), "w", encoding="utf-8").write(sw)

# --- configuration Vercel --------------------------------------------------
vercel = {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "cleanUrls": True,
    "headers": [
        {"source": "/assets/(.*)",
         "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]},
        {"source": "/sw.js",
         "headers": [{"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"}]},
        {"source": "/index.html",
         "headers": [{"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"}]},
        {"source": "/(.*)",
         "headers": [
             {"key": "X-Content-Type-Options", "value": "nosniff"},
             {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
         ]}
    ]
}
open(os.path.join(OUT, "vercel.json"), "w", encoding="utf-8").write(
    json.dumps(vercel, ensure_ascii=False, indent=2))

html_size = os.path.getsize(os.path.join(OUT, "index.html"))
total = html_size + sum(os.path.getsize(os.path.join(ASSETS, f)) for f in os.listdir(ASSETS))
print("web/index.html  %6.0f Ko" % (html_size / 1024))
for f in sorted(os.listdir(ASSETS)):
    print("web/assets/%-22s %5.0f Ko" % (f, os.path.getsize(os.path.join(ASSETS, f)) / 1024))
print("total           %6.0f Ko" % (total / 1024))
print("service en ligne : %s" % ("préconfiguré depuis l'environnement" if sb_url and sb_key
                                 else "à saisir dans le jeu (variables non fournies)"))
