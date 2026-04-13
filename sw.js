const CACHE_NAME = 'jpcanvas-v3.6.0';
const STATIC_ASSETS = [
  '/jpc/',
  '/jpc/index.html',
  '/jpc/css/jpc.css',
  '/jpc/js/app.js',
  '/jpc/js/config.js',
  '/jpc/js/preferences.js',
  '/jpc/js/state.js',
  '/jpc/js/util.js',
  '/jpc/js/color.js',
  '/jpc/js/stroke.js',
  '/jpc/js/painter.js',
  '/jpc/js/ui.js',
  '/jpc/js/urlParams.js',
  '/jpc/favicon.svg',
  '/jpc/favicon.ico',
  '/jpc/manifest.json'
];

// Google Fonts (optional - can work without them offline)
const FONT_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&family=Inter:wght@400;500&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests (like Google Fonts) - let browser handle them
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if response is not OK
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone response to cache it
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Return offline fallback if available
            if (event.request.mode === 'navigate') {
              return caches.match('/jpc/');
            }
          });
      })
  );
});
