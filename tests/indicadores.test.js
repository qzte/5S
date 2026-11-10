/* Testes dos indicadores do ano (4.0.0): `kpisAnuais`, os anos à escolha e a
   validação do tipo de cada serviço e do objectivo anual. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["kpisAnuais", "anosIndicadores", "sanitizeTipos", "tipoDe", "sanitizeObjetivos",
  "objetivoDe", "avg", "ordemCron", "diasEntre", "byPillar", "byResp"], ["ITEMS", "itemsOf", "umaCasa"]);
const { kpisAnuais, anosIndicadores, sanitizeTipos, sanitizeObjetivos, objetivoDe, tipoDe } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

const IT = [0, 1, 2, 3, 4].map(p => ({ p, r: "U" }));
const aud = (id, service, date, scores) => ({ id, service, date, scores, items: IT });
const S100 = [2, 2, 2, 2, 2], S0 = [0, 0, 0, 0, 0], S38 = [1, 1, 1, 1, 1];

test("tipo de cada serviço: só interno ou externo, um por serviço", () => {
  const t = plain(sanitizeTipos([{ s: "A", t: "i" }, { s: "B", t: "e" }, { s: "A", t: "e" }, { s: "C", t: "x" },
    { s: "", t: "i" }, null, [1], "lixo"]));
  assert.deepStrictEqual(t, [{ s: "A", t: "i" }, { s: "B", t: "e" }]);
  assert.strictEqual(tipoDe(t, "B"), "e");
  assert.strictEqual(tipoDe(t, "Z"), "");
  assert.deepStrictEqual(plain(sanitizeTipos("x")), []);
});

test("objectivo anual: inteiros, um por ano, por ordem", () => {
  const o = plain(sanitizeObjetivos([{ a: 2027, n: 100 }, { a: 2026, n: 120 }, { a: 2026, n: 5 }, { a: 2026.5, n: 1 },
    { a: 2025, n: 0 }, { a: 2025, n: 1.5 }, { a: "2024", n: "50" }, { a: 1999, n: 10 }, { a: 2028, n: 100001 }]));
  assert.deepStrictEqual(o, [{ a: 2024, n: 50 }, { a: 2026, n: 120 }, { a: 2027, n: 100 }]);
  assert.strictEqual(objetivoDe(o, 2026), 120);
  assert.strictEqual(objetivoDe(o, "2027"), 100);
  assert.strictEqual(objetivoDe(o, 2030), 0);
});

test("anos à escolha: o actual, os com auditorias e os com objectivo (até ao próximo)", () => {
  const l = [aud(1, "A", "2024-05-01", S100), aud(2, "A", "2027-01-01", S100), { id: 3, date: 7 }];
  assert.deepStrictEqual(plain(anosIndicadores(l, [{ a: 2027, n: 5 }, { a: 2030, n: 1 }], "2026-11-09")), [2027, 2026, 2024]);
  assert.deepStrictEqual(plain(anosIndicadores([], [], "2026-11-09")), [2026]);
});

test("média total do ano e os serviços abaixo dela, do pior para o melhor", () => {
  const l = [
    aud(1, "A", "2026-02-01", S100),
    aud(2, "A", "2026-03-01", S100),
    aud(3, "B", "2026-04-01", S0),
    aud(4, "C", "2026-05-01", S38),
    aud(5, "C", "2026-06-01", S100),
    aud(6, "B", "2025-12-31", S100),    /* ano anterior: fora */
    aud(7, "A", "2026-12-01", S0),      /* depois de hoje: fora */
  ];
  const k = plain(kpisAnuais(l, ["A", "B", "C"], [], [], 2026, "2026-11-09"));
  assert.strictEqual(k.n, 5);
  assert.strictEqual(k.media, Math.round((100 + 100 + 0 + 38 + 100) / 5));   /* 68 */
  assert.strictEqual(k.servicos, 3);
  /* A 100, C 69, B 0: só B fica abaixo da média (68). */
  assert.deepStrictEqual(k.abaixo.map(x => [x.service, x.media, x.n, x.diferenca]), [["B", 0, 1, -68]]);
  assert.strictEqual(k.abaixo[0].ultimaId, 3);
  assert.strictEqual(k.emCurso, true);
});

test("sem auditorias no ano: média a null e ninguém abaixo", () => {
  const k = plain(kpisAnuais([aud(1, "A", "2025-05-01", S100)], ["A"], [], [], 2026, "2026-11-09"));
  assert.strictEqual(k.n, 0);
  assert.strictEqual(k.media, null);
  assert.deepStrictEqual(k.abaixo, []);
});

test("objectivo anual: média semanal, esperado até hoje, desvio e ritmo necessário", () => {
  /* 2026-03-31 é o 90.º dia de 365: esperado = 365 × 90/365 = 90 com objectivo 365. */
  const l = Array.from({ length: 80 }, (_, i) => aud(i + 1, "A", "2026-01-0" + (1 + (i % 9)), S100));
  const k = plain(kpisAnuais(l, ["A"], [], [{ a: 2026, n: 365 }], 2026, "2026-03-31"));
  const p = k.plano;
  assert.strictEqual(p.objetivo, 365);
  assert.strictEqual(p.feitas, 80);
  assert.strictEqual(p.dias, 90);
  assert.strictEqual(p.diasAno, 365);
  assert.strictEqual(p.esperado, 90);
  assert.strictEqual(p.desvio, -10);
  assert.strictEqual(p.estado, "atrasado");
  assert.strictEqual(p.pct, 22);
  assert.strictEqual(p.mediaSemanal, Math.round(80 / (90 / 7) * 10) / 10);   /* 6,2 */
  assert.strictEqual(p.objetivoSemanal, 7);
  assert.strictEqual(p.projecao, Math.round(80 * 365 / 90));
  assert.strictEqual(p.faltam, 285);
  assert.strictEqual(p.necessarioSemanal, Math.round(285 / (275 / 7) * 10) / 10);
});

test("objectivo: em linha, cumprido, e o ano fechado conta o ano inteiro", () => {
  const l = Array.from({ length: 12 }, (_, i) => aud(i + 1, "A", "2025-0" + (1 + (i % 9)) + "-10", S100));
  const emLinha = plain(kpisAnuais(l, ["A"], [], [{ a: 2025, n: 16 }], 2025, "2025-07-01")).plano;
  assert.strictEqual(emLinha.estado, "em-linha");
  assert.ok(emLinha.desvio >= 0);
  const fechado = plain(kpisAnuais(l, ["A"], [], [{ a: 2025, n: 10 }], 2025, "2026-11-09"));
  assert.strictEqual(fechado.emCurso, false);
  assert.strictEqual(fechado.plano.dias, 365);
  assert.strictEqual(fechado.plano.esperado, 10);
  assert.strictEqual(fechado.plano.estado, "cumprido");
  assert.strictEqual(fechado.plano.faltam, 0);
  assert.strictEqual(fechado.plano.necessarioSemanal, null);
});

test("sem objectivo: só a média semanal; ano futuro sem dias decorridos", () => {
  const p = plain(kpisAnuais([aud(1, "A", "2026-01-01", S100)], ["A"], [], [], 2026, "2026-01-07")).plano;
  assert.strictEqual(p.objetivo, 0);
  assert.strictEqual(p.mediaSemanal, 1);
  assert.strictEqual(p.esperado, null);
  assert.strictEqual(p.estado, null);
  const f = plain(kpisAnuais([], ["A"], [], [{ a: 2027, n: 50 }], 2027, "2026-11-09")).plano;
  assert.strictEqual(f.dias, 0);
  assert.strictEqual(f.mediaSemanal, null);
  assert.strictEqual(f.esperado, 0);
  assert.strictEqual(f.projecao, null);
});

test("serviços internos e externos auditados no ano, face aos que existem", () => {
  const l = [aud(1, "I1", "2026-02-01", S100), aud(2, "E1", "2026-02-01", S100), aud(3, "I2", "2025-02-01", S100),
    aud(4, "Removido", "2026-02-01", S100)];
  const tipos = [{ s: "I1", t: "i" }, { s: "I2", t: "i" }, { s: "E1", t: "e" }, { s: "E2", t: "e" }, { s: "E3", t: "e" }];
  const t = plain(kpisAnuais(l, ["I1", "I2", "E1", "E2", "E3", "S"], tipos, [], 2026, "2026-11-09")).tipos;
  assert.deepStrictEqual(t.interno, { total: 2, auditados: 1, porAuditar: ["I2"] });
  assert.deepStrictEqual(t.externo, { total: 3, auditados: 1, porAuditar: ["E2", "E3"] });
  assert.deepStrictEqual(t.semTipo, { total: 1, auditados: 0, porAuditar: ["S"] });
});

test("pior serviço do ano e serviços por auditar (4.1.0)", () => {
  const l = [aud(1, "A", "2026-02-01", S100), aud(2, "B", "2026-03-01", S38), aud(3, "C", "2026-04-01", S38),
    aud(4, "D", "2025-04-01", S0)];
  const k = plain(kpisAnuais(l, ["A", "B", "C", "D", "E"], [], [], 2026, "2026-11-09"));
  assert.deepStrictEqual([k.pior.service, k.pior.media, k.pior.n], ["B", 38, 1], "empate: pelo nome");
  assert.deepStrictEqual(k.porAuditar, ["D", "E"], "D só foi auditado no ano anterior");
  const v = plain(kpisAnuais([], ["A"], [], [], 2026, "2026-11-09"));
  assert.strictEqual(v.pior, null);
  assert.deepStrictEqual(v.porAuditar, ["A"]);
});
