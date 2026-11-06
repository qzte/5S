/* Testes da frequência das auditorias (3.13.0): a porta de entrada
   (sanitizeFreqs), o estado de cada serviço, a ordem por urgência e o texto. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["sanitizeFreqs", "freqDe", "nomeFreq", "somarDias", "diasEntre", "estadoServico", "prazosServicos",
   "textoPrazo", "ultimaDe", "ordemCron"],
  ["FREQ_OPCOES", "ORDEM_PRAZO"]);
const { sanitizeFreqs, estadoServico, prazosServicos, textoPrazo, nomeFreq, somarDias, diasEntre } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const HOJE = "2026-11-06";
const aud = (id, service, date) => ({ id, service, date, scores: [2] });

test("sanitizeFreqs: lista de pares, nomes limpos, dias entre 1 e 365, sem repetidos", () => {
  const r = plain(sanitizeFreqs([
    { s: "Loja A", d: 7 }, { s: "Loja A", d: 30 }, { s: " Loja‮ B ", d: "14" },
    { s: "Loja C", d: 0 }, { s: "Loja D", d: 400 }, { s: "", d: 7 }, null, "x", [1], { s: "__proto__", d: 30 }
  ]));
  assert.deepStrictEqual(r, [{ s: "Loja A", d: 7 }, { s: "Loja B", d: 14 }, { s: "__proto__", d: 30 }]);
  for (const x of [null, {}, "x", 3]) assert.deepStrictEqual(plain(sanitizeFreqs(x)), []);
});

test("datas em UTC: somar dias e diferença", () => {
  assert.strictEqual(somarDias("2026-02-25", 7), "2026-03-04");
  assert.strictEqual(diasEntre("2026-11-01", HOJE), 5);
  assert.strictEqual(diasEntre(HOJE, "2026-11-01"), -5);
  assert.strictEqual(diasEntre("2026-03-28", "2026-03-30"), 2, "a mudança de hora não conta");
});

const F = [{ s: "A", d: 7 }, { s: "B", d: 7 }, { s: "C", d: 30 }, { s: "D", d: 14 }, { s: "E", d: 7 }];
const L = [aud(1, "A", "2026-10-20"), aud(2, "A", "2026-10-25"), aud(3, "B", "2026-11-01"),
  aud(4, "C", "2026-10-10"), aud(5, "E", "2026-10-31")];

test("estado de cada serviço, a partir da ÚLTIMA auditoria", () => {
  /* Hoje 2026-11-06. A: última 25/10, semanal → prazo 01/11, 5 dias de atraso.
     B: última 01/11, semanal → prazo 08/11, faltam 2 → a vencer.
     C: última 10/10, mensal → prazo 09/11, faltam 3 → em dia. */
  const e = s => plain(estadoServico(s, L, F, HOJE));
  assert.deepStrictEqual(e("A"), { svc: "A", freq: 7, ultima: "2026-10-25", estado: "atrasado", falta: -5, proxima: "2026-11-01" });
  assert.deepStrictEqual([e("B").estado, e("B").falta], ["a-vencer", 2]);
  assert.deepStrictEqual([e("C").estado, e("C").falta, e("C").proxima], ["em-dia", 3, "2026-11-09"]);
});

test("a vencer: nos dois últimos dias; no próprio dia, vence hoje", () => {
  const e = (date, d) => plain(estadoServico("X", [aud(1, "X", date)], [{ s: "X", d }], HOJE));
  assert.strictEqual(e("2026-11-01", 7).estado, "a-vencer");   /* falta 2 */
  assert.strictEqual(e("2026-11-02", 7).estado, "em-dia");     /* falta 3 */
  assert.strictEqual(e("2026-10-30", 7).falta, 0);
  assert.strictEqual(textoPrazo(e("2026-10-30", 7)), "Vence hoje");
  assert.strictEqual(textoPrazo(e("2026-10-31", 7)), "Vence amanhã");
  assert.strictEqual(textoPrazo(e("2026-10-29", 7)), "Em atraso há 1 dia");
  assert.strictEqual(textoPrazo(e("2026-10-20", 7)), "Em atraso há 10 dias");
  assert.strictEqual(e("2026-11-05", 1).estado, "a-vencer", "frequência diária: só no próprio dia");
});

test("sem auditorias: nunca auditado; sem frequência: fica de fora", () => {
  assert.strictEqual(plain(estadoServico("D", L, F, HOJE)).estado, "nunca");
  assert.strictEqual(textoPrazo(plain(estadoServico("D", L, F, HOJE))), "Nunca auditado");
  assert.strictEqual(plain(estadoServico("Z", L, F, HOJE)).estado, "sem-freq");
  assert.ok(!plain(prazosServicos(["Z"], L, F, HOJE)).length);
});

test("ordem por urgência: atrasados, nunca, a vencer (o mais próximo primeiro), em dia", () => {
  /* E: última 31/10, semanal → prazo 07/11, falta 1. */
  const l = plain(prazosServicos(["C", "B", "Z", "E", "D", "A"], L, F, HOJE));
  assert.deepStrictEqual(l.map(e => [e.svc, e.estado]),
    [["A", "atrasado"], ["D", "nunca"], ["E", "a-vencer"], ["B", "a-vencer"], ["C", "em-dia"]]);
});

test("nome da frequência", () => {
  assert.strictEqual(nomeFreq(7), "Semanal");
  assert.strictEqual(nomeFreq(30), "Mensal");
  assert.strictEqual(nomeFreq(10), "A cada 10 dias");
});
