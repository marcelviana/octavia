// public/service-worker.js
// Custom service worker for Octavia music app

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { Queue } from 'workbox-background-sync'

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Background sync for music content uploads
const musicUploadQueue = new Queue('music-uploads', {
  onSync: async ({ queue }) => {
    let entry
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request)
        console.log('Background sync: Successfully uploaded music content')
      } catch (error) {
        console.error('Background sync: Failed to upload:', error)
        // Re-add to queue for retry
        await queue.unshiftRequest(entry)
        throw error
      }
    }
  }
})

// Cache strategies for different content types

// 1. Music files (PDFs, images) - Cache First with long expiration
registerRoute(
  ({ request, url }) => {
    return request.destination === 'document' && 
           (url.pathname.includes('/content/') || 
            url.pathname.match(/\.(pdf|png|jpg|jpeg|svg|gif|webp)$/i))
  },
  new CacheFirst({
    cacheName: 'music-files-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// 2. API calls - Network First with short cache
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// 3. Performance mode - Special caching for critical performance
registerRoute(
  ({ url }) => url.pathname.includes('/performance'),
  new CacheFirst({
    cacheName: 'performance-mode-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// 4. Supabase storage files
registerRoute(
  ({ url }) => url.hostname.includes('.supabase.co'),
  new CacheFirst({
    cacheName: 'supabase-storage-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// 5. Static assets (fonts, icons, CSS, JS)
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Navigation fallback for offline pages
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'pages-cache-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: true,
      }),
    ],
  }),
  {
    denylist: [/^\/_next\/static\/.*$/, /^\/api\/.*$/],
  }
)

registerRoute(navigationRoute)

// Handle music content uploads with background sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'QUEUE_MUSIC_UPLOAD') {
    musicUploadQueue.pushRequest({ request: event.data.request })
  }
})

// Enhanced offline functionality
self.addEventListener('fetch', (event) => {
  // Handle music content requests when offline
  if (event.request.url.includes('/api/content') && 
      event.request.method === 'GET') {
    
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // If not cached and offline, return offline content
          return caches.match('/offline-content.json')
            .then((offlineContent) => {
              if (offlineContent) {
                return offlineContent
              }
              // Fallback to basic offline response
              return new Response(
                JSON.stringify({ 
                  error: 'Content not available offline',
                  offline: true 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              )
            })
        })
    )
  }
})

// Performance mode specific handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PERFORMANCE_CONTENT') {
    const { setlistId, content } = event.data
    
    // Cache performance content for offline use
    caches.open('performance-content-v1').then((cache) => {
      cache.put(
        `/performance/${setlistId}`,
        new Response(JSON.stringify(content), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })
  }
})

// Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [
    'music-files-v1',
    'api-cache-v1',
    'performance-mode-v1',
    'performance-content-v1',
    'supabase-storage-v1',
    'static-assets-v1',
    'pages-cache-v1'
  ]
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Skip waiting and take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})