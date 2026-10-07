const V = 'nomoor-v7';
const TILES = 'nomoor-tiles';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== V && x !== TILES).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      try {
        const r = await fetch(e.request);
        if (r.ok || r.type === 'opaque') {
          c.put(e.request, r.clone());
          c.keys().then(k => { if (k.length > 400) c.delete(k[0]); });
        }
        return r;
      } catch (err) { return Response.error(); }
    }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok || r.type === 'opaque') caches.open(V).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
