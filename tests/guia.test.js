/* Testes do guia de utilização publicado com a app (3.16.0): o conversor de
   Markdown de scripts/guia.mjs, e guia.html em dia com o GUIA.md. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const carregar = () => import(path.join(RAIZ, "scripts", "guia.mjs"));

test("guia.html está em dia com o GUIA.md", async () => {
  const { paginaGuia } = await carregar();
  const esperado = paginaGuia(fs.readFileSync(path.join(RAIZ, "GUIA.md"), "utf8"));
  assert.strictEqual(fs.readFileSync(path.join(RAIZ, "guia.html"), "utf8"), esperado,
    "guia.html desactualizado: corra  node scripts/guia.mjs");
});

test("guia.html: sem scripts, e todas as ligações internas levam a um título", () => {
  const html = fs.readFileSync(path.join(RAIZ, "guia.html"), "utf8");
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /script-src 'none'/);
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]));
  const partidas = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]).filter(a => !ids.has(a));
  assert.deepStrictEqual(partidas, []);
  assert.match(html, /href="\.\/"/, "tem de ter como voltar à app");
});

test("conversor: títulos com âncora como no GitHub, listas, tabelas e formatação", async () => {
  const { mdParaHtml, ancora } = await carregar();
  assert.strictEqual(ancora("Histórico e prazos"), "histórico-e-prazos");
  assert.strictEqual(ancora("Sem rede e actualizações"), "sem-rede-e-actualizações");
  const h = mdParaHtml([
    "<!-- comentário -->", "## Um título", "", "Texto com **negrito**, *itálico* e `código`.",
    "", "- um", "- dois", "  continua", "", "1. primeiro", "2. segundo", "",
    "| A | B |", "| --- | --- |", "| x | **y** |"
  ].join("\n"));
  assert.ok(!h.includes("comentário"));
  assert.match(h, /<h2 id="um-título">Um título<\/h2>/);
  assert.match(h, /<p>Texto com <strong>negrito<\/strong>, <em>itálico<\/em> e <code>código<\/code>\.<\/p>/);
  assert.match(h, /<ul><li>um<\/li><li>dois continua<\/li><\/ul>/);
  assert.match(h, /<ol><li>primeiro<\/li><li>segundo<\/li><\/ol>/);
  assert.match(h, /<thead><tr><th>A<\/th><th>B<\/th><\/tr><\/thead><tbody><tr><td>x<\/td><td><strong>y<\/strong><\/td><\/tr><\/tbody>/);
});

test("conversor: escapa HTML, e as ligações para o repositório ficam só texto", async () => {
  const { mdParaHtml } = await carregar();
  const h = mdParaHtml('Veja <img src=x onerror=alert(1)> e o [README](README.md), a [secção](#x) e **https://exemplo.pt/**.');
  assert.ok(!h.includes("<img"), "o HTML do texto tem de ser escapado");
  assert.match(h, /&lt;img/);
  assert.match(h, / o README, /, "uma ligação para um ficheiro do repositório fica só com o texto");
  assert.match(h, /<a href="#x">secção<\/a>/);
  assert.match(h, /<strong><a href="https:\/\/exemplo\.pt\/" rel="noopener noreferrer">https:\/\/exemplo\.pt\/<\/a><\/strong>/);
  assert.ok(!/javascript:/.test(mdParaHtml("[x](javascript:alert(1))")), "só https e âncoras viram ligação");
});
