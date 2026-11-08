/* Publicação (3.7.0; sem o _headers desde 3.23.0).

   Duas coisas que têm de andar juntas e que nada mais obriga a andar:
   - os ficheiros que scripts/publicar.sh copia e os que o service worker guarda
     em cache (ASSETS em sw.js) — um ficheiro na cache que não é publicado dá
     404 no install; um publicado fora da cache não funciona offline;
   - a CSP publicada, com um hash por <script> embutido. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const ler = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
test("publicar.sh publica exactamente os ficheiros da cache do service worker e o sw.js", () => {
  const assets = JSON.parse(ler("sw.js").match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"))
    .filter(a => a !== "./").map(a => a.replace(/^\.\//, ""));
  /* O sw.js não se guarda a si próprio em cache, mas tem de ser publicado. */
  const esperado = [...assets, "sw.js"].sort();
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

/* 3.10.0: na versão publicada, scripts/csp.mjs troca o 'unsafe-inline' do
   script-src pelo hash de cada <script> embutido. */
test("a versão publicada autoriza cada <script> pelo seu hash, sem 'unsafe-inline'", () => {
  const crypto = require("crypto");
  const dist = path.join(RAIZ, "dist");
  try {
    execFileSync("bash", [path.join(RAIZ, "scripts", "publicar.sh")], { stdio: "pipe" });
    const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
    const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    const scriptSrc = meta.match(/script-src ([^;]+)/)[1];
    assert.doesNotMatch(scriptSrc, /unsafe-inline/);
    const esperados = [...html.matchAll(/^<script>([\s\S]*?)<\/script>/gm)]
      .map(m => "'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'");
    assert.strictEqual(esperados.length, 2, "a guarda de molduras e a app (o SheetJS é um ficheiro, desde 3.11.0)");
    assert.deepStrictEqual(scriptSrc.split(" ").filter(x => x.startsWith("'sha256-")), esperados);
    /* O resto da CSP não muda: só o script-src. */
    assert.strictEqual(meta.replace(/script-src [^;]+/, "script-src 'self' 'unsafe-inline'"),
      ler("index.html").match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});
