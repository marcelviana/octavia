"use client"

import { useServiceWorker } from "@/hooks/use-service-worker"
import { useEffect } from 'react';

export default function ServiceWorkerWrapper() {
  // Use the existing service worker hook
  useServiceWorker()

  // Add enhanced error handling and cache management for production issues
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Force clear problematic caches on load
      const clearProblematicCaches = async () => {
        try {
          const cacheNames = await caches.keys();
          const problematicCaches = cacheNames.filter(name =>
            name.includes('precache') ||
            name.includes('manifest')
          );
          
          if (problematicCaches.length > 0) {
            console.log('Clearing potentially problematic caches:', problematicCaches);
            await Promise.all(problematicCaches.map(name => caches.delete(name)));
          }
        } catch (error) {
          console.error('Error clearing caches:', error);
        }
      };

      // Listen for unhandled service worker errors (like precaching failures)
      window.addEventListener('unhandledrejection', async (event) => {
        if (event.reason?.message?.includes('bad-precaching-response')) {
          console.error('Precaching error detected:', event.reason);
          
          // Prevent the error from being logged to console
          event.preventDefault();
          
          // Clear all caches and unregister service worker
          try {
            await clearProblematicCaches();
            
            // Unregister all service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            
            console.log('Service workers unregistered due to precaching errors');
            
            // Optionally reload after a short delay to re-register with clean state
            setTimeout(() => {
              console.log('Reloading to re-register service worker...');
              window.location.reload();
            }, 1000);
          } catch (error) {
            console.error('Error during cache cleanup:', error);
          }
        }
      });

      // Monitor for service worker errors
      navigator.serviceWorker.addEventListener('error', (event) => {
        console.error('Service Worker runtime error:', event);
      });

      // Initial cache cleanup on first load
      clearProblematicCaches();
    }
  }, []);

  return null;
}
