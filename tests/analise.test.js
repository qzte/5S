/* Testes da Análise (4.11.0): o período anterior, o resumo em números,
   internos e externos e a variação por pilar ou responsável. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["periodoAnterior", "desdeMeses", "resumoAnalise", "internosExternos", "variacaoEixos",
  "avg", "diasEntre", "estadoAcao", "tipoDe", "auditadoNoAno", "codigoServico"], ["norm", "umaCasa"]);
const { periodoAnterior, resumoAnalise, internosExternos, variacaoEixos, total } = ctx;
const T = sc => total({ scores: sc });
const plain = o => JSON.parse(JSON.stringify(o));

const aud = (service, date, scores, acoes) => ({ id: service + date, service, date, scores, acoes });
const S100 = [2, 2, 2, 2], S50 = [1, 1, 1, 1], S0 = [0, 0, 0, 0];

test("período anterior: do mesmo tamanho, até à véspera do início do actual", () => {
  assert.deepStrictEqual(plain(periodoAnterior(3, "2026-11-19")), { de: "2026-05-19", ate: "2026-08-18" });
  assert.deepStrictEqual(plain(periodoAnterior(12, "2026-11-19")), { de: "2024-11-19", ate: "2025-11-18" });
  assert.strictEqual(periodoAnterior(0, "2026-11-19"), null);
});

test("resumo: média, variação, auditorias por semana e acções", () => {
  const atual = [aud("A", "2026-11-01", S100), aud("B", "2026-11-10", S50)];
  const anterior = [aud("A", "2026-07-01", S50)];
  const acoes = [
    aud("A", "2026-06-01", S50, [{ estado: "aberta", prazo: "2026-10-01" }, { estado: "aberta", prazo: "2026-12-30" },
      { estado: "feita", feitaEm: "2026-11-05" }, { estado: "feita", feitaEm: "2026-01-05" }, null]),
  ];
  const r = plain(resumoAnalise(atual, anterior, acoes, "2026-08-19", "2026-11-19"));
  assert.strictEqual(r.n, 2);
  assert.strictEqual(r.media, Math.round((T(S100) + T(S50)) / 2));
  assert.strictEqual(r.servicos, 2);
  assert.strictEqual(r.mediaAnt, T(S50));
  assert.strictEqual(r.variacao, r.media - T(S50));
  assert.strictEqual(r.abertas, 2);
  assert.strictEqual(r.atrasadas, 1);
  assert.strictEqual(r.feitas, 1, "só a feita dentro do período");
  assert.ok(r.porSemana > 0);
});

test("resumo: sem período anterior nem auditorias, sem variação", () => {
  const r = plain(resumoAnalise([aud("A", "2026-11-01", S100)], null, [], "", "2026-11-19"));
  assert.strictEqual(r.variacao, null);
  assert.strictEqual(r.mediaAnt, null);
  const v = plain(resumoAnalise([], [], [], "2026-08-19", "2026-11-19"));
  assert.strictEqual(v.media, null);
  assert.strictEqual(v.porSemana, null);
  assert.strictEqual(v.variacao, null);
});

test("internos e externos: médias, serviços auditados e variações", () => {
  const svcs = ["Int A (1)", "Int B (2)", "Ext C (3)", "Ext D (4)", "Sem tipo (5)"];
  const tipos = [{ s: "Int A (1)", t: "i" }, { s: "Int B (2)", t: "i" }, { s: "Ext C (3)", t: "e" }, { s: "Ext D (4)", t: "e" }];
  const atual = [aud("Int A (1)", "2026-11-01", S100), aud("Int B (2)", "2026-11-02", S50), aud("Ext C (3)", "2026-11-03", S0)];
  const anterior = [aud("Int A (1)", "2026-07-01", S50), aud("Ext C (3)", "2026-07-02", S50), aud("Ext D (4)", "2026-07-03", S50)];
  const r = plain(internosExternos(atual, anterior, svcs, tipos, ""));
  assert.strictEqual(r.interno.n, 2);
  assert.strictEqual(r.interno.media, Math.round((T(S100) + T(S50)) / 2));
  assert.strictEqual(r.interno.auditados, 2);
  assert.strictEqual(r.interno.total, 2);
  assert.strictEqual(r.interno.pct, 100);
  assert.strictEqual(r.interno.pctAnt, 50);
  assert.strictEqual(r.interno.variacaoPct, 50);
  assert.strictEqual(r.interno.variacao, r.interno.media - T(S50));
  assert.strictEqual(r.externo.media, 0);
  assert.strictEqual(r.externo.pct, 50);
  assert.deepStrictEqual(r.externo.porAuditar, ["Ext D (4)"]);
  assert.strictEqual(r.externo.variacaoPct, -50);
  assert.strictEqual(r.semTipo, 1);
  assert.strictEqual(r.diferenca, r.interno.media - T(S0));
  assert.strictEqual(r.diferencaAnt, 0);
});

test("internos e externos: com um serviço escolhido, só ele; sem anterior, sem variação", () => {
  const tipos = [{ s: "Ext C (3)", t: "e" }];
  const r = plain(internosExternos([aud("Ext C (3)", "2026-11-03", S50)], null, ["Ext C (3)", "Outro"], tipos, "Ext C (3)"));
  assert.strictEqual(r.interno.total, 0);
  assert.strictEqual(r.interno.pct, null);
  assert.strictEqual(r.externo.total, 1);
  assert.strictEqual(r.externo.pct, 100);
  assert.strictEqual(r.externo.variacao, null);
  assert.strictEqual(r.semTipo, 0);
});

test("internos e externos: um serviço auditado com outra descrição conta pelo código", () => {
  const tipos = [{ s: "Téc. Nefrol. (11B)", t: "i" }];
  const r = plain(internosExternos([aud("Téc.Nefrol (11B)", "2026-11-03", S50)], null, ["Téc. Nefrol. (11B)"], tipos, ""));
  assert.strictEqual(r.interno.auditados, 1);
});

test("variação por eixo: delta, eixo sem perguntas antes e a maior descida", () => {
  const agora = [{ name: "U", pct: 77 }, { name: "M", pct: 84 }, { name: "P", pct: 59 }, { name: "N", pct: 50 }];
  const antes = [{ name: "U", pct: 71, n: 4 }, { name: "M", pct: 83, n: 4 }, { name: "P", pct: 68, n: 4 }, { name: "N", pct: 0, n: 0 }];
  const r = plain(variacaoEixos(agora, antes));
  assert.deepStrictEqual(r.map(x => x.delta), [6, 1, -9, null]);
  assert.deepStrictEqual(r.map(x => x.pior), [false, false, true, false]);
  assert.deepStrictEqual(plain(variacaoEixos(agora, null)).map(x => x.delta), [null, null, null, null]);
  /* Uma descida de 1 ponto não é «a maior descida». */
  assert.ok(!plain(variacaoEixos([{ name: "U", pct: 70 }], [{ name: "U", pct: 71, n: 1 }]))[0].pior);
});
