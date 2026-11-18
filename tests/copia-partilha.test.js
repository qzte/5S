/* A cópia de segurança com fotos e o menu de partilha (4.8.1). O Chrome recusa
   partilhar ficheiros com mais de 50 MiB (kMaxSharedFileBytes), com o mesmo
   NotAllowedError de quando passa tempo demais desde o toque. Acima de
   LIMITE_PARTILHA a cópia é descarregada em vez de partilhada. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["modoPartilhaCopia"], ["LIMITE_PARTILHA"]);
const { modoPartilhaCopia, LIMITE_PARTILHA } = ctx;
const MB = 1024 * 1024;

test("o limite fica abaixo dos 50 MiB do Chrome, com margem", () => {
  assert.ok(LIMITE_PARTILHA < 50 * MB && LIMITE_PARTILHA >= 40 * MB, String(LIMITE_PARTILHA));
});

test("pequena e com partilha de ficheiros: partilha", () => {
  assert.strictEqual(modoPartilhaCopia(3 * MB, true), "partilhar");
  assert.strictEqual(modoPartilhaCopia(LIMITE_PARTILHA, true), "partilhar");
});

test("acima do limite: descarrega, mesmo com partilha", () => {
  assert.strictEqual(modoPartilhaCopia(LIMITE_PARTILHA + 1, true), "descarregar");
  assert.strictEqual(modoPartilhaCopia(80 * MB, true), "descarregar");
});

test("sem partilha de ficheiros: descarrega", () => {
  assert.strictEqual(modoPartilhaCopia(1 * MB, false), "descarregar");
});
