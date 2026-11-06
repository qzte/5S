/* Publicação no Cloudflare Pages (3.7.0), alternativa preparada ao GitHub Pages.

   Três coisas que têm de andar juntas e que nada mais obriga a andar:
   - a CSP do _headers (cabeçalho HTTP) e a do <meta> do index.html;
   - os ficheiros que scripts/publicar.sh copia e os que o service worker guarda
     em cache (ASSETS em sw.js) — um ficheiro na cache que não é publicado dá
     404 no install; um publicado fora da cache não funciona offline;
   - os cabeçalhos que a revisão de segurança conta como activos. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const ler = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const HEADERS = ler("_headers");

/* Os cabeçalhos de um bloco do _headers: linhas indentadas a seguir ao caminho. */
function bloco(caminho) {
  const linhas = HEADERS.split("\n");
  const i = linhas.findIndex(l => l.trim() === caminho && !/^\s/.test(l));
  assert.ok(i >= 0, "o _headers não tem o bloco " + caminho);
  const out = {};
  for (const l of linhas.slice(i + 1)) {
    if (!/^\s+\S/.test(l)) break;
    const m = l.trim().match(/^([^:]+):\s*(.*)$/);
    if (m) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

test("a CSP do cabeçalho HTTP é igual à do <meta>", () => {
  const meta = ler("index.html").match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.strictEqual(bloco("/*")["content-security-policy"], meta);
});

test("o cabeçalho traz a protecção contra molduras que o <meta> não conseguia dar", () => {
  const h = bloco("/*");
  assert.match(h["content-security-policy"], /frame-ancestors 'none'/);
  assert.strictEqual(h["x-frame-options"], "DENY");
  assert.strictEqual(h["x-content-type-options"], "nosniff");
  assert.strictEqual(h["referrer-policy"], "no-referrer");
});

test("o service worker não fica em cache HTTP", () => {
  assert.strictEqual(bloco("/sw.js")["cache-control"], "no-cache");
});

test("publicar.sh publica exactamente os ficheiros da cache do service worker, o sw.js e o _headers", () => {
  const assets = JSON.parse(ler("sw.js").match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"))
    .filter(a => a !== "./").map(a => a.replace(/^\.\//, ""));
  /* O sw.js não se guarda a si próprio em cache, mas tem de ser publicado. */
  const esperado = [...assets, "sw.js", "_headers"].sort();
  const dist = path.join(RAIZ, "dist");
  try {
    execFileSync("bash", [path.join(RAIZ, "scripts", "publicar.sh")], { stdio: "pipe" });
    const lista = [];
    const andar = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
      const p = path.join(d, e.name);
      e.isDirectory() ? andar(p) : lista.push(path.relative(dist, p).split(path.sep).join("/"));
    });
    andar(dist);
    assert.deepStrictEqual(lista.sort(), esperado);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});
