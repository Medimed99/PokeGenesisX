/* Service worker : les images portent une empreinte, on peut donc les garder
   indefiniment. Le HTML passe par le reseau d'abord, pour qu'une nouvelle
   version soit prise en compte des le rechargement suivant. */
<<<<<<< HEAD
const CACHE = "pcg-0759a345";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "assets/atlas.bbef68a8.png", "assets/pz.a6df0f88.png", "assets/prof.52b677ef.png", "assets/missingno.15e6b208.png", "assets/atlas_shiny.7226dda6.png", "assets/card_px.a82ac432.webp", "assets/card_hd.88ad05ca.webp"];
=======
const CACHE = "pcg-4ce56f08";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "assets/atlas.bbef68a8.png", "assets/pz.1675f4a0.png", "assets/prof.52b677ef.png", "assets/missingno.cbd9cdec.png", "assets/atlas_shiny.7226dda6.png", "assets/card_px.a82ac432.webp", "assets/card_hd.88ad05ca.webp"];
>>>>>>> 413cfb3227eb5cc2782c5abf40c2f79acee89fa4

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if(e.request.method !== "GET" || url.origin !== self.location.origin) return;

  /* les appels au service en ligne ne doivent jamais etre servis depuis le cache */
  if(url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) return;
  /* la version en ligne se lit toujours sur le serveur */
  if(url.pathname.endsWith("/version.json")) return;

  if(url.pathname.includes("/assets/")){
    /* on ne garde que les reponses valides : une erreur 404 mise en cache serait
       resservie indefiniment, meme une fois le fichier publie */
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if(r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    })));
    return;
  }
  e.respondWith(fetch(e.request)
    .then(r => {
      if(r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    })
    .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html"))));
});
