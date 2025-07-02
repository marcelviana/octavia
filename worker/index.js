// Custom worker to handle service worker logic without problematic precaching
console.log('Custom worker loaded');

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

const OFFLINE_CACHE = 'offline-cache';

// Cache the offline page during install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then(cache => cache.add('/_offline'))
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name =>
        name.includes('precache') ||
        name.includes('manifest')
      );
      
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );
      
      console.log('Cleaned up old caches:', oldCaches);
    })()
  );
});

// Respond with offline page on navigation failures
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (err) {
          if (err instanceof TypeError) {
            const cache = await caches.open(OFFLINE_CACHE);
            const offline = await cache.match('/_offline');
            if (offline) return offline;
          }
          throw err;
        }
      })()
    );
  }
});
