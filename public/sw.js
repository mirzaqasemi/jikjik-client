const CACHE_NAME = 'jikjik-offline-v1';
const OFFLINE_PAGE = '/offline.html';
const OFFLINE_ASSETS = [
  OFFLINE_PAGE,
  '/login-page-background.svg',
  '/inter-latin-wght-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names
        .filter((name) => name.startsWith('jikjik-offline-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_PAGE)) ?? Response.error();
      }),
    );
    return;
  }

  if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) ?? fetch(request);
    })());
  }
});