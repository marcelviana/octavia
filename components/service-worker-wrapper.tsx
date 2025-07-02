"use client"

import { useServiceWorker } from "@/hooks/use-service-worker"
import { useEffect } from 'react';

export default function ServiceWorkerWrapper() {
  // Use the existing service worker hook
  useServiceWorker()

  // Add additional error handling for precaching issues
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Remove any leftover caches from old service workers
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.includes('precache')) {
              return caches.delete(cacheName)
            }
            return Promise.resolve()
          })
        )
      })

      // Listen for unhandled service worker errors (like precaching failures)
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('bad-precaching-response')) {
          console.error('Precaching error detected:', event.reason);
          
          // Clear problematic caches
          caches.keys().then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName.includes('precache')) {
                  console.log('Clearing problematic precache:', cacheName);
                  return caches.delete(cacheName);
                }
                return Promise.resolve();
              })
            );
          }).then(() => {
            console.log('Problematic cache cleared. Reloading page...');
            // Optionally reload the page after cache cleanup
            // window.location.reload();
          });
          
          // Prevent the error from being logged to console
          event.preventDefault();
        }
      });

      // Monitor for service worker errors
      navigator.serviceWorker.addEventListener('error', (event) => {
        console.error('Service Worker runtime error:', event);
      });
    }
  }, []);

  return null;
}
