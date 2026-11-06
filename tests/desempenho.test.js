/* Testes do desempenho com muito histórico (3.15.0): a anterior de todas as
   auditorias numa só passagem tem de dar exactamente o mesmo que anteriorDe(),
   a descrição do gráfico resume quando há muitos pontos, e as métricas
   guardadas em memória recalculam quando deviam. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["anterioresPorId", "anteriorDe", "ordemCron", "descricaoEvolucao", "metricas", "byPillar", "byResp"],
  ["PONTOS_MAX", "memoMetricas", "ITEMS", "itemsOf"]);
const { anterioresPorId, anteriorDe, descricaoEvolucao, metricas, PONTOS_MAX } = ctx;

test("anterioresPorId dá o mesmo que anteriorDe(), para todas", () => {
  const L = [];
  /* Datas repetidas e serviços misturados, para exercitar o desempate pelo id. */
  for (let i = 0; i < 300; i++)
    L.push({ id: 1000 + ((i * 37) % 300), service: "S" + (i % 4), date: "2026-0" + (1 + (i % 9)) + "-1" + (i % 3), scores: [2] });
  const m = anterioresPorId(L);
  for (const a of L) {
    const esperado = anteriorDe(a, L);
    assert.strictEqual(m.get(a.id), esperado, "auditoria " + a.id);
  }
  assert.strictEqual(anterioresPorId([]).size, 0);
  assert.strictEqual(anterioresPorId([null, undefined]).size, 0);
});

test("descrição do gráfico: completa com poucos pontos, resumida com muitos", () => {
  const poucos = [{ service: "A", pontos: [{ date: "2026-01-01", pct: 50 }, { date: "2026-02-01", pct: 70 }] }];
  assert.strictEqual(descricaoEvolucao(poucos), "Evolução da nota: A 2026-01-01 50%, 2026-02-01 70%");
  const pts = Array.from({ length: PONTOS_MAX + 1 }, (_, i) => ({ date: "2026-01-01", pct: i % 101 }));
  pts[pts.length - 1].pct = 42;
  const d = descricaoEvolucao([{ service: "B", pontos: pts }]);
  assert.match(d, /^Evolução da nota: B: 121 auditorias, de 2026-01-01 a 2026-01-01, entre 0% e 100%, a última com 42%$/);
  assert.ok(d.length < 200, "o resumo não cresce com o número de auditorias");
  assert.strictEqual(descricaoEvolucao([]), "Sem auditorias no período.");
});

test("métricas: calculadas uma vez por auditoria, de novo se mudar a auditoria ou os responsáveis", () => {
  const its = [{ p: 0, r: "U" }, { p: 1, r: "M" }];
  const a = { id: 1, scores: [2, 0], items: its };
  const m1 = metricas(a);
  assert.strictEqual(metricas(a), m1, "a segunda vez vem da memória");
  assert.strictEqual(m1.pilar[0].pct, 100);
  assert.strictEqual(m1.pilar[1].pct, 0);
  const b = Object.assign({}, a, { scores: [0, 0] });   /* uma edição é um objecto novo */
  assert.strictEqual(metricas(b).pilar[0].pct, 0);
  ctx.RESP.Z = "Zona";                                  /* lista de responsáveis mudou */
  const m2 = metricas(a);
  assert.notStrictEqual(m2, m1, "outra lista de responsáveis, outras métricas");
  assert.strictEqual(m2.resp.length, m1.resp.length + 1);
  delete ctx.RESP.Z;
});
