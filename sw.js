// Service Worker - Consolidación de Agave (formularios de campo)
// Guarda una copia local de la página para que abra sin conexión a internet,
// incluso si la conexión está presente pero muy lenta o intermitente.

const CACHE_NAME = 'agave-reporte-cache-v2';
const ARCHIVOS_A_GUARDAR = [
  './',
  './index.html',
  './reporte_fertilizante.html'
];
const TIEMPO_LIMITE_RED_MS = 4000; // si la red tarda más que esto, se usa la copia guardada

// Al instalar: guarda una copia de la(s) página(s) del formulario
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ARCHIVOS_A_GUARDAR.map((archivo) =>
          cache.add(archivo).catch(() => { /* si un archivo no existe en este repositorio, se ignora */ })
        )
      );
    })
  );
  self.skipWaiting();
});

// Al activarse: limpia copias viejas de versiones anteriores y toma control inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

function conTiempoLimite(promesa, ms) {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error('tiempo agotado')), ms);
    promesa.then((valor) => { clearTimeout(temporizador); resolve(valor); },
                 (err) => { clearTimeout(temporizador); reject(err); });
  });
}

// Al pedir cualquier archivo de la página: intenta la red (con límite de tiempo),
// y si falla o tarda demasiado, usa la copia guardada localmente.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    conTiempoLimite(fetch(event.request), TIEMPO_LIMITE_RED_MS)
      .then((respuestaRed) => {
        const copia = respuestaRed.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return respuestaRed;
      })
      .catch(() =>
        caches.match(event.request).then((coincidencia) => {
          if (coincidencia) return coincidencia;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
