const CACHE_NAME = 'anv-sport-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/bg-ads-full.png',
  '/ad-leaderboard.png',
  '/ad-rectangle.png',
];

// Install Event - Pre-cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and API requests/admin dashboard
  if (request.method !== 'GET' || url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) {
    return;
  }

  // Cache First strategy for fonts and static assets
  if (
    url.pathname.startsWith('/_next/static') || 
    url.pathname.endsWith('.woff2') || 
    url.pathname.endsWith('.woff') || 
    url.pathname.endsWith('.ttf') || 
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network First with Cache Fallback strategy for pages and images
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cacheCopy);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
