/* Testes do ficheiro para o painel e-ink (v3.6.0).

   `dadosPainel5s` decide o que o painel mostra das auditorias: a média por pilar e a
   última auditoria de cada serviço. Usa as funções de pontuação da própria app (pctOf,
   byPillar), por isso os números do painel são os mesmos do relatório e da Análise.
   O formato está em qzte/e-ink_panel, docs/09-formato-feed.md. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["auditadoNoAno", "codigoServico", "dadosPainel5s", "kpisPainel5s", "mediaDoEixo", "byPillar", "byResp", "avg", "ordemCron", "somarDias", "diasEntre",
  "estadoAcao", "anualPainel5s", "idadeAcoesAbertas", "criadaEmDe", "kpisAnuais", "tipoDe", "objetivoDe"],
  ["norm", "ITEMS", "itemsOf", "umaCasa"]);
const { dadosPainel5s } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

/* Cinco itens, um por pilar. 2 = Excelente (5,25 pts), 1 = Oportunidade (2), 0 = Mau (0). */
const ITENS = [0, 1, 2, 3, 4].map(p => ({ p, r: "U" }));
const aud = (id, service, date, scores) => ({ id, service, date, scores, items: ITENS });

test("sem auditorias: zeros e listas vazias, média e última a null", () => {
  const d = plain(dadosPainel5s([]));
  assert.strictEqual(d.total, 0);
  assert.strictEqual(d.media, null);
  assert.strictEqual(d.ultima, null);
  assert.deepStrictEqual(d.servicos, []);
  assert.strictEqual(d.pilares.length, 5);
  assert.ok(d.pilares.every(p => p.pct === null));
});

test("a última auditoria de cada serviço, com a % da anterior para a tendência", () => {
  const d = plain(dadosPainel5s([
    aud(1, "Serviço A", "2026-09-01", [2, 2, 2, 2, 2]),   // 100 %
    aud(2, "Serviço A", "2026-10-02", [1, 1, 1, 1, 1]),   // 38 %
    aud(3, "Serviço B", "2026-09-20", [2, 2, 2, 2, 0]),
  ]));
  assert.strictEqual(d.total, 3);
  assert.strictEqual(d.ultima, "2026-10-02");
  const ucip = d.servicos.find(s => s.nome === "Serviço A");
  assert.deepStrictEqual(ucip, { nome: "Serviço A", pct: 38, data: "2026-10-02", anterior: 100, n: 2 });
  const ped = d.servicos.find(s => s.nome === "Serviço B");
  assert.strictEqual(ped.anterior, null);
  assert.strictEqual(ped.n, 1);
  /* Do mais recente para o mais antigo. */
  assert.deepStrictEqual(d.servicos.map(s => s.nome), ["Serviço A", "Serviço B"]);
});

test("a ordem de gravação não importa: conta a data (e, no mesmo dia, o id)", () => {
  const d = plain(dadosPainel5s([
    aud(9, "Serviço A", "2026-10-02", [0, 0, 0, 0, 0]),
    aud(1, "Serviço A", "2026-09-01", [2, 2, 2, 2, 2]),
    aud(5, "Serviço A", "2026-10-02", [2, 2, 2, 2, 2]),
  ]));
  assert.strictEqual(d.servicos[0].pct, 0);         // id 9 é a última do dia 2
  assert.strictEqual(d.servicos[0].anterior, 100);  // a anterior é a id 5, do mesmo dia
});

test("média e pilares: as mesmas contas do relatório (pctOf por pilar, média arredondada)", () => {
  const d = plain(dadosPainel5s([
    aud(1, "A", "2026-10-01", [2, 2, 0, 1, 2]),
    aud(2, "B", "2026-10-02", [0, 2, 2, 1, 2]),
  ]));
  assert.deepStrictEqual(d.pilares.map(p => p.nome), ["Triagem", "Arrumação", "Limpeza", "Normalização", "Disciplina"]);
  assert.deepStrictEqual(d.pilares.map(p => p.pct), [50, 100, 50, 38, 100]);
  assert.strictEqual(d.media, Math.round((ctx.total(aud(0, "", "", [2, 2, 0, 1, 2])) + ctx.total(aud(0, "", "", [0, 2, 2, 1, 2]))) / 2));
});

/* ---- v3.17.0: os KPIs (a página do painel que substitui a das auditorias). ---- */
const HOJE = "2026-11-07";
const kpis = (lista, svcs = []) => plain(dadosPainel5s(lista, { servicos: svcs, hoje: HOJE }).kpis);

test("sem `extra` não há kpis (o painel mostra então a página das auditorias)", () => {
  assert.strictEqual(plain(dadosPainel5s([])).kpis, undefined);
});

test("KPIs sem auditorias: médias a null, contagens a zero, 12 meses vazios até ao corrente", () => {
  const k = kpis([]);
  assert.strictEqual(k.hoje, HOJE);
  assert.strictEqual(k.media30, null);
  assert.strictEqual(k.media30Ant, null);
  assert.strictEqual(k.n30, 0);
  assert.strictEqual(k.porMes.length, 12);
  assert.strictEqual(k.porMes[0].mes, "2025-12");
  assert.strictEqual(k.porMes[11].mes, "2026-11");
  assert.ok(k.porMes.every(m => m.media === null && m.n === 0));
  assert.deepStrictEqual(k.acoes, { abertas: 0, atrasadas: 0, feitas30: 0 });
  assert.deepStrictEqual(k.faixas, { excelente: 0, oportunidade: 0, critico: 0 });
  assert.deepStrictEqual(k.responsaveis, []);
});

test("últimos 30 dias (hoje incluído) e os 30 antes, e a média de cada mês", () => {
  const k = kpis([
    aud(1, "A", "2026-11-07", [2, 2, 2, 2, 2]),   // 100 %, hoje
    aud(2, "A", "2026-10-09", [0, 0, 0, 0, 0]),   // 0 %, o 30.º dia
    aud(3, "B", "2026-10-08", [2, 2, 2, 2, 2]),   // 100 %, já nos 30 antes
    aud(4, "B", "2026-09-09", [1, 1, 1, 1, 1]),   // o 60.º dia
    aud(5, "B", "2026-09-08", [1, 1, 1, 1, 1]),   // fora
    aud(6, "B", "2025-11-30", [2, 2, 2, 2, 2]),   // antes dos 12 meses
  ]);
  assert.strictEqual(k.n30, 2);
  assert.strictEqual(k.media30, 50);
  assert.strictEqual(k.n30Ant, 2);
  assert.strictEqual(k.media30Ant, Math.round((100 + ctx.total(aud(0, "", "", [1, 1, 1, 1, 1]))) / 2));
  const mes = m => k.porMes.find(x => x.mes === m);
  assert.deepStrictEqual(mes("2026-11"), { mes: "2026-11", media: 100, n: 1 });
  assert.deepStrictEqual(mes("2026-10"), { mes: "2026-10", media: 50, n: 2 });
  assert.strictEqual(mes("2026-09").n, 2);
  assert.ok(!k.porMes.some(x => x.mes === "2025-11"));
  /* A última auditoria de A é 100 % (excelente), a de B, de 10-08, também. */
  assert.deepStrictEqual(k.faixas, { excelente: 2, oportunidade: 0, critico: 0 });
});

test("sem prazos nem urgentes desde 4.0.0 (saiu a frequência das auditorias)", () => {
  const k = kpis([aud(1, "A", "2026-10-01", [2, 2, 2, 2, 2])], ["A", "B"]);
  assert.strictEqual(k.prazos, undefined);
  assert.strictEqual(k.urgentes, undefined);
});

test("acções: abertas (com as atrasadas), atrasadas e feitas nos últimos 30 dias", () => {
  const a = aud(1, "A", "2026-10-01", [2, 2, 2, 2, 2]);
  a.acoes = [
    { id: 1, estado: "aberta", prazo: "2026-11-06" },               // atrasada
    { id: 2, estado: "aberta", prazo: "2026-11-07" },               // vence hoje: ainda não
    { id: 3, estado: "aberta", prazo: "" },
    { id: 4, estado: "feita", feitaEm: "2026-10-09" },              // 30.º dia
    { id: 5, estado: "feita", feitaEm: "2026-10-08" },              // fora
  ];
  assert.deepStrictEqual(kpis([a]).acoes, { abertas: 3, atrasadas: 1, feitas30: 1 });
});

test("responsáveis: a média de cada um, só os que têm perguntas", () => {
  const IT = [{ p: 0, r: "U" }, { p: 1, r: "U" }, { p: 2, r: "M" }];
  const k = kpis([{ id: 1, service: "A", date: "2026-11-01", scores: [2, 2, 0], items: IT }]);
  const nomes = Object.keys(ctx.RESP);
  assert.ok(nomes.includes("U") && nomes.includes("M"), "os responsáveis de base mudaram");
  assert.deepStrictEqual(k.responsaveis, [{ nome: ctx.RESP.U, pct: 100 }, { nome: ctx.RESP.M, pct: 0 }]);
});

/* v4.4.0: uma auditoria sem perguntas de um responsável não puxa a média dele para 0 %. */
test("responsáveis: auditorias sem perguntas do responsável não contam como 0 %", () => {
  const A = [{ p: 0, r: "U" }, { p: 1, r: "M" }], B = [{ p: 0, r: "U" }, { p: 1, r: "U" }];
  const l = [{ id: 1, service: "A", date: "2026-11-01", scores: [2, 2], items: A },
    { id: 2, service: "A", date: "2026-11-02", scores: [2, 2], items: B }];
  const k = kpis(l);
  assert.deepStrictEqual(k.responsaveis, [{ nome: ctx.RESP.U, pct: 100 }, { nome: ctx.RESP.M, pct: 100 }]);
  const d = plain(dadosPainel5s(l));
  assert.strictEqual(d.pilares[1].pct, 100, "o pilar 1 existe nas duas auditorias");
});

/* v4.5.0: a acção em aberto há mais tempo, para a página do painel. */
test("acoesMaisAntiga: o serviço e os dias da acção em aberto mais antiga, ou null", () => {
  const ac = (estado, extra) => Object.assign({ id: 1, r: "U", texto: "x", prazo: "", estado, feitaEm: "", item: null }, extra || {});
  const l = [Object.assign(aud(1, "Loja Norte", "2026-10-01", [2, 2, 2, 2, 2]), { acoes: [ac("aberta"), ac("feita", { feitaEm: "2026-10-02" })] }),
    Object.assign(aud(2, "Loja Sul", "2026-11-05", [2, 2, 2, 2, 2]), { acoes: [ac("aberta", { criadaEm: "2026-11-06" })] })];
  const k = kpis(l);
  assert.deepStrictEqual(k.acoesMaisAntiga, { servico: "Loja Norte", dias: 37 });
  assert.strictEqual(kpis([aud(3, "A", "2026-11-01", [2, 2, 2, 2, 2])]).acoesMaisAntiga, null);
});

/* ---- v4.0.0: os indicadores do ano corrente, em `kpis.anual`. ---- */
test("kpis.anual: média do ano, abaixo da média, objectivo e internos/externos", () => {
  const d = plain(dadosPainel5s([
    aud(1, "A", "2026-03-01", [2, 2, 2, 2, 2]),   // 100
    aud(2, "B", "2026-06-01", [0, 0, 0, 0, 0]),   // 0
    aud(3, "B", "2025-06-01", [2, 2, 2, 2, 2]),   // outro ano
  ], { servicos: ["A", "B", "C"], hoje: HOJE,
    tipos: [{ s: "A", t: "i" }, { s: "B", t: "e" }, { s: "C", t: "e" }], objetivos: [{ a: 2026, n: 10 }] }).kpis.anual);
  assert.strictEqual(d.ano, 2026);
  assert.strictEqual(d.n, 2);
  assert.strictEqual(d.media, 50);
  assert.deepStrictEqual(d.abaixo, [{ nome: "B", media: 0, n: 1 }]);
  assert.strictEqual(d.objetivo, 10);
  assert.strictEqual(d.pct, 20);
  assert.deepStrictEqual(d.internos, { total: 1, auditados: 1, pctPorAuditar: 0 });
  assert.deepStrictEqual(d.externos, { total: 2, auditados: 1, pctPorAuditar: 50 });
  assert.deepStrictEqual(d.naoAuditados, { n: 1, total: 3, pct: 33 }, "serviços da lista sem auditoria no ano (4.5.0)");
  /* 4.1.0: o quadro SERVIÇOS do painel. */
  assert.deepStrictEqual(d.pior, { nome: "B", media: 0, n: 1 });
  assert.deepStrictEqual([d.nAbaixo, d.porAuditar, d.nServicos], [1, 1, 3]);
});
