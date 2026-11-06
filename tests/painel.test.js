/* Testes do ficheiro para o painel e-ink (v3.6.0).

   `dadosPainel5s` decide o que o painel mostra das auditorias: a média por pilar e a
   última auditoria de cada serviço. Usa as funções de pontuação da própria app (pctOf,
   byPillar), por isso os números do painel são os mesmos do relatório e da Análise.
   O formato está em qzte/e-ink_panel, docs/09-formato-feed.md. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["dadosPainel5s", "byPillar", "avg"], ["ITEMS", "itemsOf"]);
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
