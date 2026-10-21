/* Casa Dulce · Service Worker
   Cachea la app para que funcione offline.
   Cambia CACHE_VERSION cuando actualices el index.html para forzar refresco. */

const CACHE_VERSION = 'casa-dulce-v6';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_FILES).catch(err => {
        console.warn('No se pudieron cachear todos los archivos:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo manejar GET
  if(req.method !== 'GET') return;

  // Ignorar peticiones a otros dominios (Google Fonts, WhatsApp, etc.)
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  // Estrategia: cache-first con fallback a red
  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(response => {
        // Guardar copia en caché
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => {
        // Fallback offline: si es navegación, devolver index.html
        if(req.mode === 'navigate'){
          return caches.match('./index.html');
        }
      });
    })
  );
});