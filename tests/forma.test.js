/* Forma das auditorias lidas do localStorage (v3.6.1).

   loadArr() só garante uma LISTA. auditUsavel() garante que cada elemento tem o
   que o Histórico, a Análise e o painel e-ink leem sem verificar — sem ela, um
   `[{"service":"x"}]` escrito por outra página da origem deixava essas vistas em
   branco e o 5s.painel.json por gravar. Ver SECURITY.md, ponto 24. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const { auditUsavel } = buildContext(["auditUsavel"]);
const boa = { id: 1, service: "UCIP", date: "2026-10-01", scores: [2, 1, 0] };

test("uma auditoria normal passa, com ou sem perguntas próprias", () => {
  assert.strictEqual(auditUsavel(boa), true);
  assert.strictEqual(auditUsavel(Object.assign({}, boa, { items: [] })), true);
  assert.strictEqual(auditUsavel(Object.assign({}, boa, { items: null })), true);
});

test("registos que derrubavam total(), o sort por data ou itemsOf() são recusados", () => {
  for (const x of [null, 1, "x", [], { service: "x" },
    Object.assign({}, boa, { scores: undefined }),
    Object.assign({}, boa, { scores: "012" }),
    Object.assign({}, boa, { date: 20261001 }),
    Object.assign({}, boa, { service: null }),
    Object.assign({}, boa, { items: "abc" })])
    assert.strictEqual(auditUsavel(x), false, JSON.stringify(x));
});
