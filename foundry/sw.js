// Service worker for The Foundry.
// Caches the app shell so the home-screen app opens instantly and keeps
// working with no signal. Only same-origin GETs are touched — AI calls go to
// Ollama on the local network or to the Claude API, and those always go live.

const VERSION = 'foundry-v1';
const SHELL = [
  './',
  './index.html',
  './mobile.css',
  './mobile.js',
  './manifest.webmanifest',
  './assets/index-BRjvsnOY.js',
  './assets/index-BCyzrvd1.css',
  './assets/node.browser-DsOcQ74s.js',
  './assets/__vite-browser-external-BIHI7g3E.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll is all-or-nothing, so add one by one and tolerate a miss.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first so a fresh deploy is picked up, cache as backup.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // Everything else: cache first. Vite filenames carry a content hash, so a
  // cached asset is never stale.
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
