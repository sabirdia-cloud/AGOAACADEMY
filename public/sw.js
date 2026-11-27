// ==============================================================================
// AGOA Coach Service Worker - Progressive Web App (PWA)
// Football Academy Management System - Académie Générations Oued Athmania
// Safe, Network-First Strategy with Instant Auto-Update Delivery
// ==============================================================================

const CACHE_VERSION = 'agoa-coach-v2.1';
const STATIC_CACHE = `agoa-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `agoa-runtime-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/coach',
  '/index.html',
  '/manifest-coach.json',
  '/icons/coach-icon-192.png',
  '/icons/coach-icon-512.png',
  '/icons/coach-icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/academy-badge.png'
];

// 1. Install Event: Pre-cache essential shell and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('agoa-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((oldCache) => {
            console.log('[SW] Deleting obsolete cache:', oldCache);
            return caches.delete(oldCache);
          })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notify all open tabs that the new version is now controlling
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// 3. Message Event: Allow web clients to trigger skipWaiting or cache clears
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Strict, safe routing
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // A. Network-Only: Supabase API, Auth, Database, and external services
  // NEVER cache live database requests
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1') ||
    url.pathname.includes('/auth/v1') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gemini')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // B. Network-First for Navigation / HTML Pages (Ensures latest version is always fetched)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: serve cached index.html or root
          return caches.match(request).then((cached) => {
            return cached || caches.match('/coach') || caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // C. Stale-While-Revalidate for local static assets (JS, CSS, icons, fonts)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
