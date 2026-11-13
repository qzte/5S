/* Testes dos indicadores de seguimento (4.4.0): a média de um eixo sem as
   auditorias que não o têm, a média e as faixas por serviço, a última auditoria
   de cada serviço, as perguntas reincidentes e o desempenho das acções. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["mediaDoEixo", "kpisAnuais", "ultimaAuditoriaPorServico", "reincidencias", "desempenhoAcoes",
  "avg", "ordemCron", "diasEntre", "byPillar", "byResp", "tipoDe", "objetivoDe", "assinItem"],
  ["ITEMS", "itemsOf", "umaCasa", "WEIGHTS", "W_MAX", "wOf", "total", "PILLARS", "RESP", "pctOf"]);
const { mediaDoEixo, kpisAnuais, ultimaAuditoriaPorServico, reincidencias, desempenhoAcoes } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

test("média de um eixo: as auditorias sem perguntas nele não contam como 0 %", () => {
  const eixos = [[{ pct: 100, n: 2 }, { pct: 50, n: 1 }], [{ pct: 80, n: 2 }, { pct: 0, n: 0 }]];
  assert.deepStrictEqual(plain(mediaDoEixo(eixos, 0)), { pct: 90, n: 4, auditorias: 2 });
  assert.deepStrictEqual(plain(mediaDoEixo(eixos, 1)), { pct: 50, n: 1, auditorias: 1 });
  assert.deepStrictEqual(plain(mediaDoEixo([], 0)), { pct: 0, n: 0, auditorias: 0 });
});

const IT = [0, 1, 2, 3, 4].map(p => ({ p, r: "U", n: p + 1, tp: "count", c: "Pergunta " + (p + 1), t: "T" + (p + 1) }));
const aud = (id, service, date, scores, extra) => Object.assign({ id, service, date, scores, items: IT }, extra || {});

test("média por serviço e serviços por faixa no ano", () => {
  const l = [aud(1, "A", "2026-01-05", [2, 2, 2, 2, 2]), aud(2, "A", "2026-02-05", [2, 2, 2, 2, 2]),
    aud(3, "A", "2026-03-05", [2, 2, 2, 2, 2]), aud(4, "B", "2026-03-06", [1, 1, 1, 1, 1]),
    aud(5, "C", "2026-03-07", [0, 0, 0, 0, 0])];
  const k = kpisAnuais(l, ["A", "B", "C"], [], [], 2026, "2026-11-13");
  assert.strictEqual(k.media, 68, "por auditoria: (3×100 + 38 + 0) ÷ 5");
  assert.strictEqual(k.mediaServicos, 46, "por serviço: (100 + 38 + 0) ÷ 3");
  assert.deepStrictEqual(plain(k.faixas), { excelente: 1, oportunidade: 0, critico: 2 });
  const vazio = kpisAnuais(l, ["A"], [], [], 2025, "2026-11-13");
  assert.strictEqual(vazio.mediaServicos, null);
  assert.deepStrictEqual(plain(vazio.faixas), { excelente: 0, oportunidade: 0, critico: 0 });
});

test("última auditoria por serviço: nunca auditados primeiro, depois os mais antigos", () => {
  const l = [aud(1, "A", "2026-11-01", [2, 2, 2, 2, 2]), aud(2, "A", "2026-11-10", [2, 2, 2, 2, 2]),
    aud(3, "B", "2026-09-13", [2, 2, 2, 2, 2]), aud(4, "Velho", "2026-11-12", [2, 2, 2, 2, 2])];
  const r = plain(ultimaAuditoriaPorServico(l, ["A", "B", "Z"], "2026-11-13"));
  assert.deepStrictEqual(r.map(x => x.service), ["Z", "B", "A", "Velho"]);
  assert.deepStrictEqual(r.map(x => x.dias), [null, 61, 3, 1]);
  assert.strictEqual(r[2].ultima, "2026-11-10", "a mais recente do serviço");
});

test("reincidência: não Excelente em auditorias seguidas ao mesmo serviço", () => {
  const l = [
    aud(1, "A", "2026-01-01", [2, 1, 0, 2, 2]),
    aud(2, "A", "2026-02-01", [2, 1, 2, 1, 2]),
    aud(3, "A", "2026-03-01", [2, 0, 2, 1, 2]),
    aud(4, "B", "2026-01-01", [1, 2, 2, 2, 2]),
    aud(5, "B", "2026-02-01", [2, 2, 2, 2, 2]),
    aud(6, "B", "2026-03-01", [1, 2, 2, 2, 2]),
  ];
  const r = plain(reincidencias(l));
  assert.deepStrictEqual(r.map(x => [x.service, x.n, x.seguidas]), [["A", 2, 3], ["A", 4, 2]],
    "a pergunta 2 falhou 3 vezes seguidas; a 4, 2; a 3 recuperou; a de B foi interrompida por um Excelente");
  assert.deepStrictEqual(plain(reincidencias([])), []);
  assert.deepStrictEqual(plain(reincidencias([aud(1, "A", "2026-01-01", [1, 1, 1, 1, 1])])), [], "uma só auditoria não é reincidência");
});

test("reincidência: a ordem das auditorias é a da data, não a da lista", () => {
  const l = [aud(3, "A", "2026-03-01", [1, 2, 2, 2, 2]), aud(1, "A", "2026-01-01", [1, 2, 2, 2, 2]),
    aud(2, "A", "2026-02-01", [2, 2, 2, 2, 2])];
  assert.deepStrictEqual(plain(reincidencias(l)), []);
});

test("desempenho das acções: tempo de fecho e cumprimento do prazo", () => {
  const ac = (estado, prazo, feitaEm) => ({ id: 1, r: "U", texto: "x", prazo, estado, feitaEm, item: null });
  const l = [
    aud(1, "A", "2026-01-01", [2, 2, 2, 2, 2], { acoes: [ac("feita", "2026-01-15", "2026-01-11"), ac("feita", "2026-01-15", "2026-01-21"), ac("aberta", "2026-01-10", "")] }),
    aud(2, "B", "2026-02-01", [2, 2, 2, 2, 2], { acoes: [ac("feita", "", "2026-02-02"), ac("feita", "2026-02-10", "")] }),
  ];
  const d = plain(desempenhoAcoes(l));
  assert.deepStrictEqual(d, { fechadas: 3, diasMedio: 10.3, comPrazo: 2, noPrazo: 1, pctPrazo: 50 });
  assert.deepStrictEqual(plain(desempenhoAcoes([])), { fechadas: 0, diasMedio: null, comPrazo: 0, noPrazo: 0, pctPrazo: null });
});
