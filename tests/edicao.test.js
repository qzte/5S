/* Testes da edição de auditorias anteriores (v3.3.0).

   `aplicarEdicao` é a única parte da edição que não depende do DOM, e é onde
   está o que pode partir dados: substituir o registo certo, preservar os campos
   que o formulário não recolhe (as recomendações por responsável) e não deixar
   o `id` mudar — é por ele que o histórico, a análise e a fusão da importação
   encontram a auditoria. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["aplicarEdicao"], []);
const { aplicarEdicao } = ctx;

const A = {
  id: 100, service: "UCIP (11120)", date: "2026-01-10",
  pick: "Ana", repo: "Rui", verif: "Zé", note: "primeira",
  scores: [2, 1], raw: [0, 3], tgts: [null, null],
  recs: { U: "arrumar", M: "", R: "", "U+R": "", P: "" },
  items: [{ n: 1 }, { n: 2 }]
};
const B = { id: 200, service: "Outro", date: "2026-02-10", scores: [0], raw: [9] };

const DADOS = {
  service: "UCIP (11120)", date: "2026-01-11",
  pick: "Ana", repo: "Rui", verif: "Maria", note: "corrigida",
  scores: [2, 2], raw: [0, 0], tgts: [null, null], items: [{ n: 1 }, { n: 2 }]
};

test("substitui a auditoria com o id indicado e deixa as outras intactas", () => {
  const out = aplicarEdicao([A, B], 100, DADOS);
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].note, "corrigida");
  assert.strictEqual(out[0].verif, "Maria");
  assert.deepStrictEqual(out[0].scores, [2, 2]);
  assert.strictEqual(out[1], B, "a outra auditoria não é sequer copiada");
});

test("preserva os campos que o formulário não recolhe (recs)", () => {
  const out = aplicarEdicao([A, B], 100, DADOS);
  assert.strictEqual(out[0].recs.U, "arrumar",
    "as recomendações por responsável têm de sobreviver à edição");
});

test("o id não muda, mesmo que os dados tragam um", () => {
  const out = aplicarEdicao([A, B], 100, Object.assign({ id: 999 }, DADOS));
  assert.strictEqual(out[0].id, 100);
});

test("não altera a lista recebida", () => {
  const lista = [A, B];
  const out = aplicarEdicao(lista, 100, DADOS);
  assert.notStrictEqual(out, lista);
  assert.strictEqual(lista[0], A, "o registo original fica como estava");
  assert.strictEqual(A.note, "primeira");
});

test("devolve null quando o id já não existe", () => {
  assert.strictEqual(aplicarEdicao([A, B], 404, DADOS), null,
    "apagada noutro separador: não há o que substituir");
  assert.strictEqual(aplicarEdicao([], 100, DADOS), null);
  assert.strictEqual(aplicarEdicao(null, 100, DADOS), null);
});

test("uma entrada nula na lista não derruba a procura", () => {
  const out = aplicarEdicao([null, A], 100, DADOS);
  assert.strictEqual(out[1].note, "corrigida");
});
