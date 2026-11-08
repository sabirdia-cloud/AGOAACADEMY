// ULTRA 2026 - Minimal Service Worker (Network First strategy - no cache breaking)
const CACHE_NAME = 'academy-ultra-v2';

self.addEventListener('install', (event) => {
  // Skip waiting immediately - don't block on caching
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean old caches
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (Supabase, Google Fonts, etc.)
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network first, fallback to cache for HTML
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        // If network fails, try cache
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
      )
  );
});
