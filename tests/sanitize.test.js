/* Testes de sanitizeAudit(): a importação de histórico tem de preservar TUDO
   o que é lido depois. Já se perdeu o `recs` uma vez (corrigido em v1.7.0);
   estes testes fecham a porta ao mesmo erro nos limiares e no alvo. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["sanitizeAudit", "normItem", "recsOf", "classify", "fixedKey"],
  ["PILLARS", "RESP", "DIR", "TKEYS", "isResp"]
);
const { sanitizeAudit } = ctx;

const base = { service: "Supermercado A", date: "2026-07-31", scores: [1] };

test("preserva T3 de uma pergunta v3 em vez de a reinterpretar como v2", () => {
  /* Sem t3, normItem() lê t1/t2 com a semântica de v2 (cortes anónimos) e
     reetiqueta-os: {t1:4,t2:1} passaria a {t1:4,t2:4}, tornando a pergunta
     binária e alterando a classificação já gravada. */
  const a = sanitizeAudit(Object.assign({}, base, {
    raw: [2],
    items: [{ p: 0, n: 3, t: "Quantidades", r: "U", c: "Contagem",
              tp: "count", t1: 4, t2: 1, t3: 0, max: 99 }]
  }));
  assert.ok(a, "auditoria válida");
  assert.strictEqual(a.items[0].t1, 4);
  assert.strictEqual(a.items[0].t2, 1, "T2 não pode ser reescrito para 4");
  assert.strictEqual(a.items[0].t3, 0);
});

test("preserva o alvo de uma pergunta de amostra", () => {
  const a = sanitizeAudit(Object.assign({}, base, {
    raw: [2], tgts: [12],
    items: [{ p: 0, n: 3, t: "Quantidades", r: "U", c: "Kanbans",
              tp: "amostra", tgt: 10, t1: 40, t2: 10, t3: 0, max: 100 }]
  }));
  assert.strictEqual(a.items[0].tp, "amostra");
  assert.strictEqual(a.items[0].tgt, 10);
  assert.strictEqual(a.items[0].t1, 40);
  assert.strictEqual(a.items[0].t2, 10);
});

test("preserva os alvos efectivos gravados na auditoria", () => {
  const a = sanitizeAudit(Object.assign({}, base, {
    scores: [1, 2], raw: [2, 0], tgts: [12, 10]
  }));
  assert.deepStrictEqual(a.tgts, [12, 10]);
});

test("alvos ausentes não quebram a importação de auditorias antigas", () => {
  const a = sanitizeAudit(Object.assign({}, base, { raw: [2] }));
  assert.ok(Array.isArray(a.tgts), "tgts é sempre um array");
  assert.strictEqual(a.tgts.length, 0);
});

test("alvos inválidos são descartados valor a valor, não em bloco", () => {
  const a = sanitizeAudit(Object.assign({}, base, {
    scores: [1, 2, 0], raw: [1, 0, 3], tgts: [10, "abc", -4]
  }));
  assert.strictEqual(a.tgts[0], 10);
  assert.strictEqual(a.tgts[1], null);
  assert.strictEqual(a.tgts[2], null);
});

test("tgts nunca é mais longo do que scores", () => {
  const a = sanitizeAudit(Object.assign({}, base, {
    scores: [1], raw: [1], tgts: [10, 10, 10, 10]
  }));
  assert.strictEqual(a.tgts.length, 1);
});
