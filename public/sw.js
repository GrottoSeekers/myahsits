// MYAH service worker — makes "Add to Home Screen" work like an app.
//
// Pages are always fetched fresh from the network (they hold signed-in,
// personal data), with a branded offline page when there is no
// connection. Only static files are cached: Astro's hashed bundles,
// images, icons and fonts. Nothing under /api/ is ever touched.
// Bump VERSION to drop old caches after a change to this file.

const VERSION = 'myah-v2';
const STATIC = VERSION + '-static';
const RUNTIME = VERSION + '-runtime';
const OFFLINE = '/offline.html';

const PRECACHE = [
  OFFLINE,
  '/manifest.json',
  '/mobile.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/images/logo-mark.png',
  '/images/logo-mark-white.png',
  '/images/slideshow-springer-beach.jpeg',
  '/images/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Pages: network first, offline page if that fails. Never cached.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Google Fonts: keep a copy so the brand type loads instantly.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  if (!sameOrigin || url.pathname.startsWith('/api/')) return;

  // Astro bundles have a content hash in the name: safe to keep.
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Images, icons and the phone stylesheet: show the saved copy, refresh in the background.
  if (/^\/(images|icons)\//.test(url.pathname) || url.pathname === '/mobile.css' || url.pathname === '/manifest.json') {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req);
  const fresh = fetch(req)
    .then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
    .catch(() => hit);
  return hit || fresh;
}
