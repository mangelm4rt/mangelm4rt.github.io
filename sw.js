const CACHE_VERSION = "cantoral-ultopt140";
const NETWORK_TIMEOUT_MS = 2500;
const PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "favicon.svg",
  "apple-touch-icon.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/icon-maskable-512.png",
  "assets/portada.png",
  "assets/titulopasta.svg",
  "assets/siluetaVM_v5.svg",
  "assets/siluetaAdviento.svg?v=4",
  "assets/siluetaNavidad.svg?v=4",
  "assets/siluetaCuaresma.svg?v=4",
  "assets/siluetaPascua.svg?v=4",
  "assets/siluetaPentecostes.svg?v=9",
  "assets/hojasdis.png",
  "cantos.json",
  "styles.css?v=212",
  "script.js?v=215",
  "assets/qr_cantoralmayo.svg?v=2",
  "assets/guia_acordes.svg?v=2",
  "assets/guia_acordes_zurdo.svg?v=1",
  "assets/luciernaga.png?v=1",
  "assets/chords/A.svg",
  "assets/chords/A7.svg",
  "assets/chords/A9.svg",
  "assets/chords/Ab.svg",
  "assets/chords/Am.svg",
  "assets/chords/Asus.svg",
  "assets/chords/B.svg",
  "assets/chords/B7.svg",
  "assets/chords/Bm.svg",
  "assets/chords/B♭.svg",
  "assets/chords/C#7.svg",
  "assets/chords/C#m.svg",
  "assets/chords/C.svg",
  "assets/chords/C7.svg",
  "assets/chords/Cm.svg",
  "assets/chords/D.svg",
  "assets/chords/D7.svg",
  "assets/chords/D9.svg",
  "assets/chords/Db.svg",
  "assets/chords/Dm.svg",
  "assets/chords/Dm7.svg",
  "assets/chords/E.svg",
  "assets/chords/E7.svg",
  "assets/chords/Eb.svg",
  "assets/chords/Em.svg",
  "assets/chords/Em7.svg",
  "assets/chords/F#.svg",
  "assets/chords/F#7.svg",
  "assets/chords/F#m.svg",
  "assets/chords/F#m7.svg",
  "assets/chords/F.svg",
  "assets/chords/Fm.svg",
  "assets/chords/Fm7.svg",
  "assets/chords/G#.svg",
  "assets/chords/G#7.svg",
  "assets/chords/G#m.svg",
  "assets/chords/G.svg",
  "assets/chords/G7.svg",
  "assets/chords/Gm.svg",
  "assets/chords/Gsus4.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(PRECACHE.map((url) =>
        cache.add(encodeURI(url).replace(/#/g, "%23")).catch(() => null)
      ))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirstWithTimeout(req, fallbackUrl) {
  const network = fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
    return res;
  });
  const timed = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
  return Promise.race([network.catch(() => null), timed]).then((res) => {
    if (res) return res;
    return caches.match(req).then((hit) =>
      hit || (fallbackUrl ? caches.match(fallbackUrl) : undefined) || network
    );
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        }).catch(() => hit)
      )
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirstWithTimeout(req, "index.html"));
    return;
  }
  if (url.pathname.endsWith("/cantos.json")) {
    event.respondWith(networkFirstWithTimeout(req));
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});