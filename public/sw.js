// Custom service worker for offline support and basic caching
console.log('Custom worker loaded');

const CACHE_VERSION = 'v1';
const CACHE_NAME = `octavia-${CACHE_VERSION}`;
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
  '/placeholder-logo.png',
  '/placeholder-user.jpg',
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
      const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
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

  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(res => res || fetch(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
