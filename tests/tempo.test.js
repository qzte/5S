/* Testes do tempo das auditorias (4.22.0): sanitizeTempo, minutosTerreno,
   fmtDur e kpisTempo (internas e externas, atípicas, trânsito por saída). */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["sanitizeTempo", "minutosTerreno", "fmtDur", "kpisTempo", "tipoDe"],
  ["umaCasa", "TERRENO_ATIPICO_MIN"]);
const { sanitizeTempo, minutosTerreno, fmtDur, kpisTempo } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

const T0 = "2026-03-10T09:00:00.000Z";
const mais = m => new Date(Date.parse(T0) + m * 6e4).toISOString();
const aud = (service, date, terreno, extra) => ({ service, date, scores: [2],
  tempo: Object.assign(terreno == null ? {} : { inicio: T0, fim: mais(terreno) }, extra || {}) });
const tipos = [{ s: "Int", t: "i" }, { s: "Ext1", t: "e" }, { s: "Ext2", t: "e" }];

test("sanitizeTempo: só o que tem a forma certa; sem nada, undefined", () => {
  assert.strictEqual(sanitizeTempo(null), undefined);
  assert.strictEqual(sanitizeTempo({}), undefined);
  assert.strictEqual(sanitizeTempo([1]), undefined);
  assert.deepStrictEqual(plain(sanitizeTempo({ inicio: T0, fim: "x", prep: 30, origem: "z", transito: -1, lixo: 1 })),
    { inicio: T0, prep: 30 });
  assert.deepStrictEqual(plain(sanitizeTempo({ prep: 0 })), { prep: 0 }, "0 = não houve preparação");
  assert.strictEqual(sanitizeTempo({ prep: 1.5 }), undefined);
  assert.strictEqual(sanitizeTempo({ prep: 2000 }), undefined);
});

test("sanitizeTempo: o regresso só com «volta à base»", () => {
  assert.deepStrictEqual(plain(sanitizeTempo({ depois: "a", regresso: 20 })), { depois: "a" });
  assert.deepStrictEqual(plain(sanitizeTempo({ depois: "b", regresso: 20 })), { depois: "b", regresso: 20 });
});

test("minutosTerreno e fmtDur", () => {
  assert.strictEqual(minutosTerreno({ inicio: T0, fim: mais(85) }), 85);
  assert.strictEqual(minutosTerreno({ inicio: T0 }), null);
  assert.strictEqual(minutosTerreno({ inicio: mais(10), fim: T0 }), null, "fim antes do início");
  assert.strictEqual(fmtDur(35), "35 min");
  assert.strictEqual(fmtDur(85), "1 h 25");
  assert.strictEqual(fmtDur(65), "1 h 05");
  assert.strictEqual(fmtDur(120), "2 h");
  assert.strictEqual(fmtDur(null), "—");
});

test("kpisTempo: internas e externas em separado, atípicas fora das médias", () => {
  const lista = [
    aud("Int", "2026-03-10", 60, { prep: 20 }),
    aud("Int", "2026-04-10", 80, { prep: 40 }),
    aud("Int", "2026-05-10", 300),                       /* atípica: mais de 4 h */
    aud("Ext1", "2026-03-11", 110, { prep: 45, origem: "b", transito: 30 }),
    aud("Ext2", "2026-03-11", 90, { prep: 45, origem: "a", transito: 10, depois: "b", regresso: 40 }),
    aud("Int", "2025-03-10", 10),                        /* outro ano */
    { service: "Int", date: "2026-06-01", scores: [2] }, /* sem tempo */
  ];
  const k = plain(kpisTempo(lista, 2026, tipos));
  assert.strictEqual(k.interno.auditorias, 3);
  assert.deepStrictEqual(k.interno.terreno, { n: 2, media: 70, mediana: 70, min: 60, max: 80, atipicas: 1, total: 140 });
  assert.deepStrictEqual(k.interno.prep, { n: 2, media: 30, total: 60 });
  assert.strictEqual(k.interno.porAuditoria, 100);
  assert.strictEqual(k.interno.total, 200);
  assert.strictEqual(k.externo.terreno.media, 100);
  assert.strictEqual(k.externo.transito.media, 20);
  assert.strictEqual(k.externo.transito.total, 80, "trânsito e regresso");
  assert.strictEqual(k.externo.porAuditoria, 45 + 100 + 20);
  assert.strictEqual(k.externo.total, 200 + 90 + 80);
  assert.strictEqual(k.todas.total, 200 + 370);
  assert.deepStrictEqual(k.saidas, { n: 1, porSaida: 2, transitoPorSaida: 80, transitoPorAuditoria: 40 });
});

test("kpisTempo: sem auditorias com tempo, tudo vazio", () => {
  const k = plain(kpisTempo([{ service: "Int", date: "2026-01-01", scores: [2] }], 2026, tipos));
  assert.strictEqual(k.todas.auditorias, 0);
  assert.strictEqual(k.todas.terreno.media, null);
  assert.strictEqual(k.todas.porAuditoria, null);
  assert.deepStrictEqual(k.saidas, { n: 0, porSaida: null, transitoPorSaida: null, transitoPorAuditoria: null });
});
