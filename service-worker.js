// Service Worker for PWA with offline support
const CACHE_NAME = 'fitness-trainer-v1';
const ASSETS_TO_CACHE = [
  './',
  './AIFitnessTrainer.htm',
  './manifest.json',
  './service-worker.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  console.log('🚀 Fitness Trainer installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching app assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('⚠️ Some assets failed to cache:', err);
        // Continue even if some assets fail to cache
        return cache.addAll(ASSETS_TO_CACHE.filter(url => url !== './'));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('💪 Fitness Trainer activated!');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // For GET requests, use cache-first strategy
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('📦 Serving from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response to cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(error => {
        console.log('📱 Offline - serving from cache:', event.request.url);
        // Return a cached response if available, otherwise a fallback
        return caches.match(event.request).catch(() => {
          return new Response('Offline - page not cached', { status: 503 });
        });
      });
    })
  );
});