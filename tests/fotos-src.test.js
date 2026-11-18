/* v3.24.1 (SECURITY.md, ponto 25): uma foto lida do IndexedDB só é verificada
   por startsWith("data:image/"). Para que um valor com aspas não feche o
   atributo, todo o src de <img> montado em HTML tem de passar por esc(). */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("todo o <img src=\"${…}\"> interpola por esc()", () => {
  const todos = HTML.match(/<img src="\$\{[^}]*\}/g) || [];
  /* 4.7.0: duas — a evidência no formulário e no relatório (a das
     recomendações saiu com elas). */
  assert.ok(todos.length >= 2, "esperavam-se as duas imagens de fotos");
  const sem = todos.filter(m => !m.startsWith('<img src="${esc('));
  assert.deepStrictEqual(sem, [], "src sem esc(): " + sem.join(", "));
});
