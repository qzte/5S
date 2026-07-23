/*
  Auditoria 5S · Supermercados Kaizen — Service Worker
  Versão: 1.7.0 (Semantic Versioning — MAJOR.MINOR.PATCH)
  Função: cache offline da aplicação. O nome da cache inclui a versão,
          por isso cada nova versão invalida automaticamente a anterior.
  Segurança (v1.4.0): a cache só aceita recursos da própria origem que
          constem da allowlist ASSETS, evitando envenenamento da cache.
*/
const APP_VERSION = "1.7.0";
const CACHE = "auditoria5s-v" + APP_VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

/* Conjunto de URLs absolutos permitidos em cache. Qualquer resposta cujo URL
   não conste desta lista NUNCA é escrita na cache. */
const ALLOWED = new Set(ASSETS.map(a => new URL(a, self.registration.scope).href));

function isCacheable(req, res) {
  if (!res || res.status !== 200 || res.type !== "basic") return false;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return false;
  return ALLOWED.has(url.href);
}

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Navegação: rede primeiro (para apanhar novas versões), cache como reserva.
   Restantes pedidos: cache primeiro, escrita apenas se estiver na allowlist. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r && r.status === 200 && r.type === "basic") {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put("./index.html", copy));
          }
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(r => {
        if (isCacheable(req, r)) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => hit)
    )
  );
});
