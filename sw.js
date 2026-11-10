/*
  Auditoria 5S · Supermercados Kaizen — Service Worker
  Versão: 4.2.2 (Semantic Versioning — MAJOR.MINOR.PATCH)
  Função: cache offline da aplicação. O nome da cache inclui a versão,
          por isso cada nova versão invalida automaticamente a anterior.
  Segurança (v1.4.0): a cache só aceita recursos da própria origem que
          constem da allowlist ASSETS, evitando envenenamento da cache.
          Desde 3.1.1 a allowlist vale também para as navegações, que antes
          escreviam em ./index.html sem a consultar.
*/
const APP_VERSION = "4.2.2";
const CACHE = "auditoria5s-v" + APP_VERSION;

/* v3.16.0: "./guia.html" é o guia de utilização, gerado de GUIA.md por
   scripts/guia.mjs e aberto da Configuração; fica em cache para abrir offline.
   v3.23.0: "./vendor/html2canvas.min.js" e "./vendor/jspdf.umd.min.js" criam o
   PDF do relatório, carregados só quando se pede um; em cache, para o PDF sair
   também sem rede.
   v3.11.0: "./vendor/xlsx.full.min.js" é o SheetJS, carregado só ao importar ou
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
  "./vendor/xlsx.full.min.js",
  "./vendor/html2canvas.min.js",
  "./vendor/jspdf.umd.min.js",
  "./guia.html"
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
    /* v3.16.0: cada página da allowlist fica na SUA entrada da cache. Até aqui
       havia uma só página (a raiz e ./index.html são a mesma), e toda a
       navegação permitida era escrita em ./index.html; com o guia, abri-lo
       escreveria o guia por cima da app guardada — e offline a app abria o
       guia. A raiz continua a ir para ./index.html. */
    const INDEX = new URL("./index.html", self.registration.scope).href;
    const chave = ALLOWED.has(semQuery) && semQuery !== self.registration.scope ? semQuery : INDEX;
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
            caches.open(CACHE).then(c => c.put(chave, copy));
            return r;
          }
          if (r && r.status >= 400)
            return caches.match(chave).then(hit => hit || r);
          return r;
        })
        .catch(() => caches.match(chave).then(hit => hit || caches.match(INDEX)))
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
