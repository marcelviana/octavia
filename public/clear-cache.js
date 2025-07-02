// Temporary cache clearing script for production issue
// This can be included temporarily to help clear problematic caches

(function() {
  'use strict';
  
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  console.log('Running cache cleanup script...');

  // Function to clear all problematic caches
  async function clearAllProblematicCaches() {
    try {
      // Get all cache names
      const cacheNames = await caches.keys();
      console.log('Found caches:', cacheNames);

      // Filter out caches that might contain problematic entries
      const problematicCaches = cacheNames.filter(name => 
        name.includes('precache') || 
        name.includes('workbox') ||
        name.includes('manifest') ||
        name.includes('next-pwa')
      );

      if (problematicCaches.length > 0) {
        console.log('Clearing problematic caches:', problematicCaches);
        await Promise.all(problematicCaches.map(name => caches.delete(name)));
        console.log('Problematic caches cleared successfully');
      } else {
        console.log('No problematic caches found');
      }

      // Unregister all service workers to start fresh
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        console.log('Unregistering service workers:', registrations.length);
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('All service workers unregistered');
      }

      console.log('Cache cleanup completed. Please reload the page.');
      
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  // Run the cleanup
  clearAllProblematicCaches();
})(); 