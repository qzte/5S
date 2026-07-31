/* Testes de sanitizeItems(): é a porta ÚNICA por onde perguntas vindas de
   ficheiro entram na aplicação — tanto pelo editor (edImport) como pelo
   itemsCfg da importação de histórico (importJson). Até 3.1.1 este segundo
   caminho gravava o ficheiro em bruto no localStorage; estes testes fecham-no. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["sanitizeItems", "normItem", "classify", "fixedKey"],
  ["PILLARS", "RESP", "DIR", "TKEYS", "isResp"]
);
const { sanitizeItems, RESP, PILLARS } = ctx;

const base = { c: "Pergunta", t: "Tema", r: "U", tp: "count", t1: 1, t2: 1, t3: 0, max: 9 };
const um = extra => sanitizeItems([Object.assign({}, base, extra)])[0];

test("entrada que não é lista devolve lista vazia", () => {
  /* strictEqual sobre o comprimento, e não deepStrictEqual sobre o array: o
     array vem do contexto `vm`, cujo Array.prototype não é o deste ficheiro. */
  [null, undefined, {}, "abc", 7].forEach(v =>
    assert.strictEqual(sanitizeItems(v).length, 0));
});

test("descarta entradas sem texto de pergunta", () => {
  assert.strictEqual(sanitizeItems([{ c: "" }, null, "x", { c: "   " }]).length, 0);
});

test("pilar fora de intervalo é saturado, não deixa o item órfão de eixo", () => {
  assert.strictEqual(um({ p: 99 }).p, PILLARS.length - 1);
  assert.strictEqual(um({ p: -4 }).p, 0);
  assert.strictEqual(um({ p: "não é número" }).p, 0);
});

test("responsável herdado do protótipo não passa a guarda", () => {
  /* `RESP[x.r]` sozinho aceitava "constructor" e "toString": o valor herdado é
     truthy, e o render (`esc(RESP[it.r])`) imprimia o código-fonte de Object.
     Além disso o item desaparecia de byResp(), falseando a nota por responsável. */
  ["constructor", "toString", "__proto__", "hasOwnProperty"].forEach(r =>
    assert.strictEqual(um({ r }).r, "U", r + " tem de cair no valor por omissão"));
  assert.ok(Object.prototype.hasOwnProperty.call(RESP, um({ r: "constructor" }).r));
});

test("responsável válido é preservado", () => {
  Object.keys(RESP).forEach(r => assert.strictEqual(um({ r }).r, r));
});

test("texto é limitado e sem caracteres de controlo", () => {
  const it = um({ c: "a\u0000b\u001Fc" + "x".repeat(900), t: "t\u007Fema" + "y".repeat(300) });
  assert.ok(!/[\u0000-\u001F\u007F]/.test(it.c), "sem caracteres de controlo em c");
  assert.ok(!/[\u0000-\u001F\u007F]/.test(it.t), "sem caracteres de controlo em t");
  assert.ok(it.c.length <= 500, "c limitado a 500");
  assert.ok(it.t.length <= 120, "t limitado a 120");
});

test("tema em falta recebe um valor por omissão em vez de 'undefined'", () => {
  assert.strictEqual(um({ t: null }).t, "Tema");
});

test("tipo de resposta desconhecido cai em 'count'", () => {
  assert.strictEqual(um({ tp: "__proto__" }).tp, "count");
  assert.strictEqual(um({ tp: { malicioso: true } }).tp, "count");
});

test("limiares de uma pergunta v3 sobrevivem à normalização", () => {
  const it = um({ tp: "count", t1: 4, t2: 1, t3: 0, max: 99 });
  assert.strictEqual(it.t1, 4);
  assert.strictEqual(it.t2, 1);
  assert.strictEqual(it.t3, 0);
});

test("alvo de uma amostra é preservado e saturado no mínimo", () => {
  assert.strictEqual(um({ tp: "amostra", tgt: 25, t1: 40, t2: 10, t3: 0 }).tgt, 25);
  /* Ausente ou 0 cai na sugestão de 10; negativo satura no mínimo utilizável,
     que é 1 — nunca num alvo <= 0, que deixaria classify() sem denominador. */
  assert.strictEqual(um({ tp: "amostra", tgt: 0 }).tgt, 10);
  assert.strictEqual(um({ tp: "amostra", tgt: undefined }).tgt, 10);
  assert.strictEqual(um({ tp: "amostra", tgt: -3 }).tgt, 1);
});

test("é idempotente: reimportar o que já foi limpo não altera nada", () => {
  const uma = sanitizeItems([Object.assign({}, base, { p: 99, r: "constructor" })]);
  assert.deepStrictEqual(sanitizeItems(uma), uma);
});
