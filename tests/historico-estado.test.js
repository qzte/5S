/* Testes do estado de uma auditoria no Histórico (4.13.0): por finalizar, por
   enviar, enviadas, com acções em aberto e com acções em atraso. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const { estadoHist } = buildContext(["estadoHist", "contaAcoes", "estadoAcao"], []);
const HOJE = "2026-11-19";

test("por finalizar, por enviar e enviadas excluem-se", () => {
  const terreno = { fase: "terreno", envios: { pc: "2026-11-18T10:00:00Z" } };
  const porEnviar = { envios: {} };
  const enviada = { envios: { teams: "2026-11-18T10:00:00Z" } };
  const semEnvios = {};
  const tab = a => ["fin", "env", "envd"].filter(e => estadoHist(a, e, HOJE));
  assert.deepStrictEqual(tab(terreno), ["fin"]);
  assert.deepStrictEqual(tab(porEnviar), ["env"]);
  assert.deepStrictEqual(tab(enviada), ["envd"]);
  assert.deepStrictEqual(tab(semEnvios), ["env"]);
});

test("acções em aberto e em atraso; sem estado, passam todas", () => {
  const a = { acoes: [{ estado: "aberta", prazo: "2026-11-01" }, { estado: "aberta", prazo: "2027-01-01" }, null] };
  const b = { acoes: [{ estado: "aberta", prazo: "2027-01-01" }, { estado: "feita", feitaEm: "2026-11-01" }] };
  const c = { acoes: [{ estado: "feita", feitaEm: "2026-11-01" }] };
  assert.strictEqual(estadoHist(a, "ab", HOJE), true);
  assert.strictEqual(estadoHist(a, "atr", HOJE), true);
  assert.strictEqual(estadoHist(b, "ab", HOJE), true);
  assert.strictEqual(estadoHist(b, "atr", HOJE), false);
  assert.strictEqual(estadoHist(c, "ab", HOJE), false);
  assert.strictEqual(estadoHist(c, "", HOJE), true);
});
