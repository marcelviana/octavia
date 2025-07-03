// Custom service worker for offline support and basic caching
console.log('Custom worker loaded');

const CACHE_VERSION = 'v1';
const CACHE_NAME = `octavia-${CACHE_VERSION}`;
const STATIC_CACHE = `octavia-static-${CACHE_VERSION}`;
const PAGE_CACHE = `octavia-pages-${CACHE_VERSION}`;
const OFFLINE_URL = '/_offline';
// Assets that should be available offline (excluding dynamic routes)
const ASSETS = [
  '/',
  '/manifest.json',
  '/pdf.worker.min.mjs',
  '/logos/octavia-icon.webp',
  '/logos/octavia-wordmark.webp',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Helper function to check if an asset exists
async function assetExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Helper function to cache the offline page when needed
async function cacheOfflinePage() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const offlineRequest = new Request(OFFLINE_URL);
    const existing = await cache.match(offlineRequest);
    
    if (!existing) {
      const response = await fetch(OFFLINE_URL);
      if (response.ok) {
        await cache.put(offlineRequest, response.clone());
        console.log('Offline page cached successfully');
        return response;
      }
    }
    return existing;
  } catch (error) {
    console.warn('Failed to cache offline page:', error);
    return null;
  }
}

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
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // Cache assets individually to handle failures gracefully
        const cachePromises = ASSETS.map(async (asset) => {
          try {
            // Skip checking for root path as it's handled differently
            if (asset === '/') {
              await cache.add(asset);
              console.log(`Cached: ${asset}`);
              return;
            }
            
            // Check if asset exists before caching
            const exists = await assetExists(asset);
            if (exists) {
              await cache.add(asset);
              console.log(`Cached: ${asset}`);
            } else {
              console.warn(`Asset not found, skipping: ${asset}`);
            }
          } catch (error) {
            console.warn(`Failed to cache ${asset}:`, error);
            // Continue with other assets even if one fails
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('Service worker installation completed');
      } catch (error) {
        console.error('Service worker installation failed:', error);
      }
    })()
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');

  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const keep = [CACHE_NAME, STATIC_CACHE, PAGE_CACHE];
        const oldCaches = cacheNames.filter(name => !keep.includes(name));
        await Promise.all(oldCaches.map(name => caches.delete(name)));
        console.log('Cleaned up old caches:', oldCaches);
        
        // Cache the offline page after activation
        await cacheOfflinePage();
        
        await self.clients.claim();
      } catch (error) {
        console.error('Service worker activation failed:', error);
      }
    })()
  );
});

// Serve cached assets and offline page
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Handle offline page requests specifically
  if (url.pathname === OFFLINE_URL) {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // Try to fetch and cache the offline page
          const response = await cacheOfflinePage();
          if (response) return response;
          
          // Fallback to network request
          return await fetch(request);
        } catch (error) {
          console.warn(`Failed to serve offline page:`, error);
          return new Response(
            '<html><body><h1>Offline</h1><p>No internet connection available.</p></body></html>',
            { 
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
      })()
    );
    return;
  }

  // Cache-first for predefined assets
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match(request);
          if (cached) return cached;
          return await fetch(request);
        } catch (error) {
          console.warn(`Failed to fetch ${request.url}:`, error);
          return new Response('Not found', { status: 404 });
        }
      })()
    );
    return;
  }

  // Cache static resources like JS, CSS and images from Next.js
  if (url.origin === self.location.origin && (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/_next/image'))) {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
          }
          return res;
        } catch (error) {
          console.warn(`Failed to fetch static resource ${request.url}:`, error);
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
          if (res.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch (err) {
          console.warn(`Navigation request failed for ${request.url}:`, err);
          try {
            const cache = await caches.open(PAGE_CACHE);
            const cached = await cache.match(request);
            if (cached) return cached;
            
            // Try to get the offline page
            const offline = await cacheOfflinePage();
            if (offline) {
              // Notify clients about offline fallback
              if (event.clientId) {
                const client = await self.clients.get(event.clientId);
                client?.postMessage({ type: 'OFFLINE_FALLBACK', url: request.url });
              } else {
                const clients = await self.clients.matchAll();
                clients.forEach(c => c.postMessage({ type: 'OFFLINE_FALLBACK', url: request.url }));
              }
              return offline;
            }
          } catch (cacheError) {
            console.error('Failed to serve offline fallback:', cacheError);
          }
          
          // Last resort: return a basic offline response
          return new Response(
            '<html><body><h1>Offline</h1><p>No internet connection available.</p></body></html>',
            { 
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
      })()
    );
  }
});
