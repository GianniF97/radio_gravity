/**
 * RADIO GRAVITY — PROGRESSIVE WEB APP SERVICE WORKER
 * Cache-First / Stale-While-Revalidate for app shell and core assets.
 * Live audio streaming (onlyhitsradio.net, surfernetwork.com) is EXCLUSIVELY bypassed.
 */

const CACHE_NAME = 'radio-gravity-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/logo.png',
  '/logo.webp',
  '/logo.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

/**
 * Identify if a request is for live streaming audio or external live media
 * IMPORTANT: NEVER CACHE LIVE AUDIO STREAMING
 */
function isStreamOrExcluded(url, request) {
  try {
    const urlObj = new URL(url);

    // Live audio CDNs and streaming relays
    if (
      urlObj.hostname.includes('onlyhitsradio.net') ||
      urlObj.hostname.includes('surfernetwork.com') ||
      urlObj.pathname.includes('/tophits')
    ) {
      return true;
    }

    // Media and range requests
    if (request.destination === 'audio' || request.destination === 'video') {
      return true;
    }

    if (request.headers && request.headers.has('range')) {
      return true;
    }

    // Non-GET requests
    if (request.method !== 'GET') {
      return true;
    }

    // Browser extensions or chrome-extension URLs
    if (!url.startsWith('http')) {
      return true;
    }

    return false;
  } catch (e) {
    return true;
  }
}

// 1. Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Precache partial error:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Service Worker Activation & Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Strict bypass for streaming audio — passes directly to live socket
  if (isStreamOrExcluded(url, request)) {
    return;
  }

  // Navigation requests (HTML document): Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || (await caches.match('/'));
        })
    );
    return;
  }

  // Same-origin static assets: Stale-While-Revalidate
  const requestUrl = new URL(url);
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // External static assets (CDNs, Google Fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => null);
    })
  );
});

