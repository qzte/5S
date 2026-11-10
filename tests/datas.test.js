/* Testes das contas de datas (somarDias, diasEntre), em UTC. Vinham dos testes
   da frequência das auditorias (3.13.0), que saiu em 4.0.0; os indicadores do
   ano e o painel continuam a usá-las. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const { somarDias, diasEntre } = buildContext(["somarDias", "diasEntre"]);
const HOJE = "2026-11-06";

test("datas em UTC: somar dias e diferença", () => {
  assert.strictEqual(somarDias("2026-02-25", 7), "2026-03-04");
  assert.strictEqual(diasEntre("2026-11-01", HOJE), 5);
  assert.strictEqual(diasEntre(HOJE, "2026-11-01"), -5);
  assert.strictEqual(diasEntre("2026-03-28", "2026-03-30"), 2, "a mudança de hora não conta");
});
