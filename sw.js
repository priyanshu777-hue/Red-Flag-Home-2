// Red Flag Homes Service Worker - Offline Core Cache
const CACHE_NAME = 'rf-core-v1';

// Core assets to pre-cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/franchise.html',
  '/manifest.json',
  '/transitions.js',
  '/form-handler.js',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  // Brand logo
  'https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/logobg.png',
  // Brand fonts (Google Fonts stylesheets)
  'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap',
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@500&family=Michroma&display=swap',
  // Libraries
  'https://cdn.jsdelivr.net/npm/d3@7',
  'https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs',
  'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm'
];

// Media URLs that should be cached dynamically (Hero Videos)
const HERO_VIDEOS = [
  'https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/hero.mp4',
  'https://cdn.jsdelivr.net/gh/priyanshu777-hue/Red-Flag-Home-@main/franchise-asset/scenes/showreel.mp4'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Precache standard core static assets
      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Could not pre-cache asset:', asset, err);
        }
      }

      // 2. Fetch and cache hero videos in the background
      for (const videoUrl of HERO_VIDEOS) {
        try {
          fetch(videoUrl, { mode: 'cors' }).then((res) => {
            if (res.ok) {
              cache.put(videoUrl, res);
            }
          }).catch((err) => {
            console.warn('[SW] Background video fetch notice:', videoUrl, err);
          });
        } catch (err) {
          console.warn('[SW] Hero video fetch error:', videoUrl, err);
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and internal browser schemes
  if (req.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Do not intercept AI or dynamic POST API endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle Range Requests (important for Safari/Chrome video playback from cache)
  const rangeHeader = req.headers.get('range');
  if (rangeHeader && (url.pathname.endsWith('.mp4') || HERO_VIDEOS.includes(req.url))) {
    event.respondWith(
      caches.match(req.url).then(async (cachedResponse) => {
        if (!cachedResponse) {
          return fetch(req);
        }

        const arrayBuffer = await cachedResponse.arrayBuffer();
        const bytes = rangeHeader.replace(/bytes=/, '').split('-');
        const total = arrayBuffer.byteLength;
        const start = parseInt(bytes[0], 10) || 0;
        const end = bytes[1] ? parseInt(bytes[1], 10) : total - 1;

        if (start >= total || end >= total) {
          return new Response('', {
            status: 416,
            headers: { 'Content-Range': `bytes */${total}` }
          });
        }

        const sliced = arrayBuffer.slice(start, end + 1);
        return new Response(sliced, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4',
            'Content-Length': String(sliced.byteLength),
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes'
          }
        });
      }).catch(() => fetch(req))
    );
    return;
  }

  // HTML Navigation requests: Network-first falling back to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          if (url.pathname.includes('franchise')) {
            return caches.match('/franchise.html');
          }
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Fonts & CDN static assets: Cache-first with network fallback
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    req.destination === 'font' ||
    req.destination === 'image' ||
    req.destination === 'style' ||
    req.destination === 'script' ||
    req.destination === 'video'
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // If cached, return it and opportunistically revalidate in background
          fetch(req).then((res) => {
            if (res && res.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, res));
            }
          }).catch(() => { /* silent offline ignore */ });
          return cached;
        }

        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkResponse;
          })
          .catch(async () => {
            // Check if full URL or pathname is in cache
            const fallback = await caches.match(url.pathname);
            if (fallback) return fallback;
            // Return empty response for non-critical assets when completely offline
            return new Response('', { status: 408, statusText: 'Request timed out / offline' });
          });
      })
    );
    return;
  }

  // Default Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
