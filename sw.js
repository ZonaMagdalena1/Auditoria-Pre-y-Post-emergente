// Service Worker - Reporte de Aplicación · Consolidación de Agave
// Guarda una copia local del formulario para que abra sin conexión a internet.

const CACHE_NAME = 'agave-reporte-cache-v1';
const ARCHIVOS_A_GUARDAR = [
  './',
  './index.html'
];

// Al instalar: guarda una copia del formulario
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS_A_GUARDAR).catch(()=>{ /* si falla algún archivo, no rompe la instalación */ });
    })
  );
  self.skipWaiting();
});

// Al activarse: limpia copias viejas de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Al pedir la página: si hay internet, trae la versión más reciente y la guarda;
// si no hay internet, usa la copia guardada.
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((respuestaRed) => {
        const copia = respuestaRed.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return respuestaRed;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
  );
});
