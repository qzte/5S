/* Testes das correcções da 3.22.0: auditoria repetida (mesmo serviço e dia) e
   o título da página, que é o nome que o browser propõe para o PDF. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["auditoriaRepetida", "tituloPdf", "tituloMensal", "nomeMes"], ["MESES_PT"]);
const { auditoriaRepetida, tituloPdf, tituloMensal } = ctx;
const L = [{ id: 1, service: "Loja A", date: "2026-11-07" }, { id: 2, service: "Loja B", date: "2026-11-07" }, null];

test("auditoria repetida: mesmo serviço e mesmo dia", () => {
  assert.strictEqual(auditoriaRepetida(L, "Loja A", "2026-11-07", null).id, 1);
  assert.strictEqual(auditoriaRepetida(L, "Loja A", "2026-11-08", null), null, "outro dia não conta");
  assert.strictEqual(auditoriaRepetida(L, "Loja C", "2026-11-07", null), null, "outro serviço não conta");
  assert.strictEqual(auditoriaRepetida(L, "Loja A", "2026-11-07", 1), null, "a que se está a editar não conta");
  assert.strictEqual(auditoriaRepetida([], "Loja A", "2026-11-07"), null);
});

test("título do PDF: serviço e data, sem caracteres que um nome de ficheiro não aceita", () => {
  assert.strictEqual(tituloPdf({ service: "Loja A", date: "2026-10-20" }), "Auditoria 5S - Loja A - 2026-10-20");
  assert.strictEqual(tituloPdf({ service: 'Norte/Sul: "B"', date: "2026-10-20" }), "Auditoria 5S - Norte-Sul- -B- - 2026-10-20");
  assert.strictEqual(tituloMensal("2026-10"), "Relatório mensal 5S - outubro de 2026");
});
