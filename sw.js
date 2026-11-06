/*
  Auditoria 5S · Supermercados Kaizen — Service Worker
  Versão: 3.15.0 (Semantic Versioning — MAJOR.MINOR.PATCH)
  Função: cache offline da aplicação. O nome da cache inclui a versão,
          por isso cada nova versão invalida automaticamente a anterior.
  Segurança (v1.4.0): a cache só aceita recursos da própria origem que
          constem da allowlist ASSETS, evitando envenenamento da cache.
          Desde 3.1.1 a allowlist vale também para as navegações, que antes
          escreviam em ./index.html sem a consultar.
*/
const APP_VERSION = "3.15.0";
const CACHE = "auditoria5s-v" + APP_VERSION;

/* v3.11.0: "./vendor/xlsx.full.min.js" é o SheetJS, carregado só ao importar ou
   exportar Excel. Fica em cache na instalação para funcionar offline como até
   aqui, quando vinha embutido no index.html. (Sem comentários DENTRO da lista:
   tests/publicacao.test.js lê-a como JSON.) */
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./vendor/xlsx.full.min.js"
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
    /* A allowlist vale também aqui (v3.1.1): sem esta guarda, QUALQUER navegação
       dentro do scope (ex.: ./?utm=x ou ./qualquer-coisa que o servidor resolva
       com 200) era escrita por cima da entrada ./index.html, que é depois o que
       é servido offline. A query string é ignorada na comparação porque não
       muda o documento devolvido. */
    const semQuery = url.origin + url.pathname;
    /* v3.7.0: um ERRO do servidor (404, 5xx) passa a cair na cópia em cache,
       como já caía a falta de rede. Até aqui só a falta de rede caía: quando o
       GitHub Pages deixou de publicar a app, o service worker entregava o 404
       do servidor e a cópia guardada — com acesso às auditorias no
       localStorage, e ao botão de exportar — ficava inalcançável enquanto
       houvesse rede. Sem cópia em cache, devolve-se a resposta do servidor. */
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r && r.status === 200 && r.type === "basic" && ALLOWED.has(semQuery)) {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put("./index.html", copy));
            return r;
          }
          if (r && r.status >= 400)
            return caches.match("./index.html").then(hit => hit || r);
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
