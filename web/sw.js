/* Service worker : les images portent une empreinte, on peut donc les garder
   indefiniment. Le HTML passe par le reseau d'abord, pour qu'une nouvelle
   version soit prise en compte des le rechargement suivant. */
const CACHE = "pcg-2fca98d7";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "assets/atlas.bbef68a8.png", "assets/pz.1675f4a0.png", "assets/prof.52b677ef.png", "assets/missingno.cbd9cdec.png", "assets/atlas_shiny.7226dda6.png", "assets/cardart.028415fa.png"];

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

  if(url.pathname.includes("/assets/")){
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    })));
    return;
  }
  e.respondWith(fetch(e.request)
    .then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    })
    .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html"))));
});
