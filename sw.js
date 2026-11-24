// Service worker sederhana: game tetap bisa dibuka offline setelah pernah dimuat sekali.
// Ubah CACHE_VERSION setiap kali Anda mengunggah versi game baru.
const CACHE_VERSION = "pe-v1";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(["./", "index.html", "style.css", "script.js", "missions.js", "runner.js", "audio.js", "manifest.webmanifest"])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  // Video dan permintaan ke situs lain (mis. repo video terpisah) dibiarkan langsung ke jaringan.
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.headers.has("range") || /\.(mp4|webm)$/i.test(url.pathname)) return;

  // Utamakan jaringan (selalu versi terbaru), cadangan dari cache bila offline.
  event.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
