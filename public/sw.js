// Custom service worker for offline support and basic caching
console.log('Custom worker loaded');

const CACHE_VERSION = 'v1';
const CACHE_NAME = `octavia-${CACHE_VERSION}`;
const STATIC_CACHE = `octavia-static-${CACHE_VERSION}`;
const PAGE_CACHE = `octavia-pages-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';
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
      const keep = [CACHE_NAME, STATIC_CACHE, PAGE_CACHE, 'octavia-pdf-cache-v1'];
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

  // Enhanced PDF handling - avoid conflicts with offline cache
  if (url.pathname.endsWith('.pdf')) {
    event.respondWith(
      (async () => {
        // Don't cache PDFs that come from our proxy API (these are handled by offline cache)
        if (url.pathname.startsWith('/api/proxy')) {
          console.log('[SW] PDF request from proxy API, passing through');
          return fetch(request);
        }

        // For direct PDF requests, use network-first with cache fallback
        const cache = await caches.open('octavia-pdf-cache-v1');
        
        try {
          console.log('[SW] Fetching PDF from network:', url.pathname);
          const networkResponse = await fetch(request);
          
          // Only cache successful responses
          if (networkResponse.ok && networkResponse.status === 200) {
            console.log('[SW] Caching successful PDF response');
            cache.put(request, networkResponse.clone());
          } else {
            console.log('[SW] PDF fetch failed, not caching:', networkResponse.status);
          }
          
          return networkResponse;
        } catch (err) {
          console.error('[SW] PDF network fetch failed:', err);
          
          // Try to serve from cache as fallback
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            console.log('[SW] Serving PDF from cache fallback');
            return cachedResponse;
          }
          
          // If no cache and network failed, return error response
          console.error('[SW] No cached PDF available, returning error');
          return new Response('PDF not available offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
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
