/* Testes da Análise (4.11.0): o período anterior, o resumo em números,
   internos e externos e a variação por pilar ou responsável. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["periodoAnterior", "desdeMeses", "resumoAnalise", "internosExternos", "variacaoEixos",
  "avg", "diasEntre", "estadoAcao", "tipoDe", "auditadoNoAno", "codigoServico",
  "mesesAte", "evolucaoMensal", "comparacaoServicos", "perguntasQueFalham", "ordemCron"], ["norm", "umaCasa", "ITEMS", "itemsOf"]);
const { periodoAnterior, resumoAnalise, internosExternos, variacaoEixos, total,
  mesesAte, evolucaoMensal, comparacaoServicos, perguntasQueFalham } = ctx;
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

/* ---- 4.16.0 ---- */
test("meses até hoje: 12, do mais antigo, a passar o ano", () => {
  assert.deepStrictEqual(plain(mesesAte("2026-02-10", 4)), ["2025-11", "2025-12", "2026-01", "2026-02"]);
  assert.strictEqual(mesesAte("2026-11-19", 12).length, 12);
  assert.strictEqual(mesesAte("2026-11-19", 12)[0], "2025-12");
});

test("evolução mensal: a média de cada mês, null sem auditorias, e o filtro", () => {
  const L = [aud("A", "2026-01-05", S100), aud("B", "2026-01-20", S50), aud("A", "2026-03-01", S0), aud("A", "2025-06-01", S100)];
  const e = plain(evolucaoMensal(L, ["2026-01", "2026-02", "2026-03"]));
  assert.deepStrictEqual(e.map(x => x.n), [2, 0, 1]);
  assert.deepStrictEqual(e.map(x => x.media), [Math.round((T(S100) + T(S50)) / 2), null, T(S0)]);
  const so = plain(evolucaoMensal(L, ["2026-01"], a => a.service === "A"));
  assert.deepStrictEqual(so.map(x => x.media), [T(S100)]);
});

test("comparação entre serviços: do pior para o melhor, com auditorias e variação", () => {
  const atual = [aud("A", "2026-11-01", S100), aud("A", "2026-11-02", S50), aud("B", "2026-11-03", S0), aud("C", "2026-11-04", S50)];
  const ant = [aud("A", "2026-07-01", S50), aud("C", "2026-07-01", S100)];
  const r = plain(comparacaoServicos(atual, ant));
  assert.deepStrictEqual(r.map(x => x.service), ["B", "C", "A"]);
  assert.deepStrictEqual(r.map(x => x.n), [1, 1, 2]);
  assert.strictEqual(r[0].delta, null, "B não tinha auditorias antes");
  assert.strictEqual(r[1].delta, T(S50) - T(S100));
  assert.strictEqual(r[2].delta, Math.round((T(S100) + T(S50)) / 2) - T(S50));
  assert.ok(plain(comparacaoServicos(atual, null)).every(x => x.delta === null));
});

test("perguntas que mais falham: as piores, a variação e onde falham", () => {
  const IT = [{ n: 1, t: "Materiais", c: "Artigos extra", p: 0, r: "U" }, { n: 2, t: "Kanbans", c: "Kanbans a mais", p: 0, r: "U" },
    { n: 3, t: "Estantes", c: "Estantes", p: 1, r: "M" }];
  const a = (s, d, sc) => ({ id: s + d, service: s, date: d, scores: sc, items: IT });
  const atual = [a("A", "2026-11-01", [0, 1, 2]), a("B", "2026-11-02", [0, 2, 2]), a("C", "2026-11-03", [1, 2, 2])];
  const ant = [a("A", "2026-07-01", [2, 2, 2])];
  const r = plain(perguntasQueFalham(atual, ant, 5));
  assert.deepStrictEqual(r.map(x => x.n), [1, 2], "a nº 3 ficou sempre Excelente e não entra");
  assert.strictEqual(r[0].c, "Artigos extra");
  assert.deepStrictEqual(r[0].servicos, ["A", "B", "C"]);
  assert.deepStrictEqual(r[1].servicos, ["A"]);
  assert.ok(r[0].pct < r[1].pct);
  assert.strictEqual(r[0].delta, r[0].pct - 100);
  assert.strictEqual(plain(perguntasQueFalham(atual, null, 1)).length, 1);
  assert.strictEqual(plain(perguntasQueFalham(atual, null, 5))[0].delta, null);
});
