/* A conversão das perguntas 3, 18 e 19 para `amostra` foi feita para NÃO
   alterar a classificação no alvo nominal de 10 unidades: os limiares em
   percentagem (40/50/20 e 10) reproduzem valor a valor os cortes absolutos
   que estavam em vigor (4/5/2 e 1). Este teste fixa essa equivalência. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext, HTML } = require("./harness.js");

const ctx = buildContext(["classify", "normItem", "fixedKey"], ["DIR", "TKEYS"]);
const { classify, normItem } = ctx;

/* Lê as perguntas reais do index.html em vez de as reescrever aqui. */
const bloco = HTML.slice(HTML.indexOf("const DEFAULT_ITEMS=["));
const DEFAULT_ITEMS = JSON.parse(
  bloco.slice(bloco.indexOf("["), bloco.indexOf("];") + 1)
    .replace(/(\{|,)\s*([a-z0-9]+)\s*:/gi, '$1"$2":')
    .replace(/,(\s*[\]}])/g, "$1")
);
const porNumero = n => DEFAULT_ITEMS.find(it => it.n === n);

/* Limiares absolutos em vigor antes da v3.1.0, por número de pergunta. */
const ANTES = { 3: { t1: 4, t2: 1 }, 18: { t1: 5, t2: 1 }, 19: { t1: 2, t2: 1 } };

test("as três perguntas de kanbans são do tipo amostra, com alvo 10", () => {
  for (const n of [3, 18, 19]) {
    const it = porNumero(n);
    assert.strictEqual(it.tp, "amostra", "pergunta " + n);
    assert.strictEqual(it.tgt, 10, "pergunta " + n);
  }
});

test("as restantes 16 perguntas ficaram intactas", () => {
  const outras = DEFAULT_ITEMS.filter(it => ![3, 18, 19].includes(it.n));
  assert.strictEqual(outras.length, 16);
  assert.ok(outras.every(it => it.tp !== "amostra"), "nenhuma outra virou amostra");
  assert.ok(outras.every(it => it.tgt === undefined), "nenhuma outra ganhou alvo");
});

test("no alvo nominal de 10, a classificação é idêntica à de v3.0.0", () => {
  for (const n of [3, 18, 19]) {
    const novo = normItem(porNumero(n));
    const velho = normItem({ tp: "count", max: 99, t3: 0, ...ANTES[n] });
    for (let resp = 0; resp <= 10; resp++) {
      assert.strictEqual(
        classify(novo, resp, 10), classify(velho, resp),
        `pergunta ${n}, resposta ${resp}: a conversão alterou a classificação`
      );
    }
  }
});
