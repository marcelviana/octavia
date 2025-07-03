// Custom service worker for offline support and basic caching
console.log('Custom worker loaded');

const CACHE_VERSION = 'v1';
const CACHE_NAME = `octavia-${CACHE_VERSION}`;
const STATIC_CACHE = `octavia-static-${CACHE_VERSION}`;
const PAGE_CACHE = `octavia-pages-${CACHE_VERSION}`;
const OFFLINE_URL = '/_offline';
// Assets that should be available offline
const ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/pdf.worker.min.mjs',
  '/logos/octavia-icon.webp',
  '/logos/octavia-wordmark.webp',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Handle any errors during service worker lifecycle
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

// Handle unhandled promise rejections (like precaching errors)
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
  // Prevent the error from bubbling up
  event.preventDefault();
});

// Skip waiting for activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Pre-cache core assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const keep = [CACHE_NAME, STATIC_CACHE, PAGE_CACHE];
      const oldCaches = cacheNames.filter(name => !keep.includes(name));
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log('Cleaned up old caches:', oldCaches);
      await self.clients.claim();
    })()
  );
});

// Serve cached assets and offline page
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Cache-first for predefined assets
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(res => res || fetch(request))
    );
    return;
  }

  // Cache static resources like JS, CSS and images from Next.js
  if (url.origin === self.location.origin && (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/_next/image'))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          cache.put(request, res.clone());
          return res;
        } catch {
          return fetch(request);
        }
      })()
    );
    return;
  }

  // Network-first for navigation requests with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, res.clone());
          return res;
        } catch (err) {
          const cache = await caches.open(PAGE_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          if (event.clientId) {
            const client = await self.clients.get(event.clientId);
            client?.postMessage({ type: 'OFFLINE_FALLBACK', url: request.url });
          } else {
            const clients = await self.clients.matchAll();
            clients.forEach(c => c.postMessage({ type: 'OFFLINE_FALLBACK', url: request.url }));
          }
          return offline;
        }
      })()
    );
  }
});
