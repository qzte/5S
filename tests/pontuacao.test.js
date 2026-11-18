/* Tabela «Pontuação» do relatório: pontos por coluna na escala de 0 a 100.
   Com 19 itens o máximo bruto é 19 × 5,25 = 99,75; o total mostrado tem de ser
   a nota (sobre 100), e uma auditoria toda Excelente tem de dar 100. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["colTotals", "pctOf"], []);
const { colTotals, pctOf } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

test("19 itens todos Excelente: 100 / 100", () => {
  const t = plain(colTotals({ scores: Array(19).fill(2) }));
  assert.strictEqual(t.pts, 100);
  assert.strictEqual(t.max, 100);
  assert.strictEqual(t.ptsExc, 100);
  assert.strictEqual(t.brutoMax, 99.75);
});

test("1 Mau, 1 Oportunidade, 17 Excelente: 91,48 / 100 (bruto 91,25 / 99,75)", () => {
  const scores = [0, 1, ...Array(17).fill(2)];
  const t = plain(colTotals({ scores }));
  assert.deepStrictEqual([t.mau, t.opor, t.exc], [1, 1, 17]);
  assert.strictEqual(t.ptsMau, 0);
  assert.strictEqual(t.ptsOpor, 2.01);
  assert.strictEqual(t.ptsExc, 89.47);
  assert.strictEqual(t.pts, 91.48);
  assert.strictEqual(t.max, 100);
  assert.strictEqual(t.brutoPts, 91.25);
  assert.strictEqual(Math.round(t.pts), pctOf(scores));
});

test("auditoria sem itens não divide por zero", () => {
  const t = plain(colTotals({ scores: [] }));
  assert.strictEqual(t.pts, 0);
  assert.strictEqual(t.max, 0);
});

/* 4.7.1: a legenda da tabela usa a mesma escala que os pontos — o valor de cada
   item sobre 100 e o total máximo 100 —, e não o máximo bruto (99,75). */
test("legenda da pontuação na escala de 0 a 100", () => {
  const { legendaPontuacao } = buildContext(["colTotals", "legendaPontuacao"], []);
  const l = legendaPontuacao({ scores: Array(19).fill(2) });
  assert.doesNotMatch(l, /99[.,]75|5[.,]25|bruto/);
  assert.match(l, /Mau = 0/);
  assert.match(l, /Com oportunidade ≈ 2\.01/);
  assert.match(l, /Excelente ≈ 5\.26/);
  assert.match(l, /19 itens/);
  assert.match(l, /máximo: 100/);
  /* Com 20 itens, Excelente vale exactamente 5 — sem «≈». */
  assert.match(legendaPontuacao({ scores: Array(20).fill(2) }), /Excelente = 5 /);
});
