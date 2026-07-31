/* Testes do tipo de resposta `amostra` (v3.1.0).

   Uma pergunta de amostra declara um alvo (`tgt`) de unidades a auditar e
   limiares em PERCENTAGEM desse alvo, de modo que os cortes acompanhem o alvo
   sem serem reescritos à mão. O alvo efectivo é escolhido em cada auditoria;
   o `tgt` da pergunta é apenas a sugestão que pré-preenche o formulário. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["classify", "normItem", "ruleOf", "fixedKey"],
  ["DIR", "TKEYS"]
);
const { classify, normItem, ruleOf, fixedKey, DIR } = ctx;

/* Pergunta 3 do checklist, no vocabulário novo: Mau a partir de 40% do alvo,
   Com oportunidade a partir de 10%. Com alvo 10 reproduz exactamente os
   limiares absolutos de hoje (4 e 1). */
const P3 = { tp: "amostra", tgt: 10, t1: 40, t2: 10, t3: 0, max: 100 };

test("DIR trata amostra como escala invertida: menos é melhor", () => {
  assert.strictEqual(DIR.amostra, -1);
});

test("fixedKey fixa T3 numa amostra, como em qualquer escala invertida", () => {
  assert.strictEqual(fixedKey({ tp: "amostra" }), "t3");
});

test("classify compara a percentagem do alvo, não a contagem", () => {
  /* Alvo nominal de 10: 0 → Excelente, 1..3 → Oportunidade, 4+ → Mau. */
  assert.strictEqual(classify(P3, 0, 10), 2, "0/10 = 0%");
  assert.strictEqual(classify(P3, 1, 10), 1, "1/10 = 10%");
  assert.strictEqual(classify(P3, 3, 10), 1, "3/10 = 30%");
  assert.strictEqual(classify(P3, 4, 10), 0, "4/10 = 40%");
  assert.strictEqual(classify(P3, 10, 10), 0, "10/10 = 100%");
});

test("os cortes acompanham o alvo sem alterar os limiares", () => {
  /* Duplicar o alvo duplica a contagem necessária para cada classificação. */
  assert.strictEqual(classify(P3, 4, 20), 1, "4/20 = 20% -> Oportunidade");
  assert.strictEqual(classify(P3, 8, 20), 0, "8/20 = 40% -> Mau");
  /* Alvo pequeno: 1 em 4 já são 25%. */
  assert.strictEqual(classify(P3, 1, 4), 1, "1/4 = 25%");
  assert.strictEqual(classify(P3, 2, 4), 0, "2/4 = 50%");
});

test("o limiar é inclusivo: exactamente no corte, entra na classe", () => {
  const it = { tp: "amostra", tgt: 8, t1: 50, t2: 25, t3: 0, max: 100 };
  assert.strictEqual(classify(it, 2, 8), 1, "25% entra em Oportunidade");
  assert.strictEqual(classify(it, 4, 8), 0, "50% entra em Mau");
});

test("percentagens fraccionárias comparam-se sem arredondar para unidades", () => {
  /* Alvo 3: 1/3 = 33,33%. Com corte a 35% ainda não é Mau; a 33% já é. */
  const brando = { tp: "amostra", tgt: 3, t1: 35, t2: 1, t3: 0, max: 100 };
  const severo = { tp: "amostra", tgt: 3, t1: 33, t2: 1, t3: 0, max: 100 };
  assert.strictEqual(classify(brando, 1, 3), 1);
  assert.strictEqual(classify(severo, 1, 3), 0);
});

test("resposta acima do alvo satura em 100%, nunca ultrapassa Mau", () => {
  assert.strictEqual(classify(P3, 99, 10), 0);
});

test("alvo ausente, zero ou inválido não produz classificação", () => {
  /* Sem alvo não há denominador: o item fica por responder e sai do
     denominador da nota, como já acontece com um input vazio. */
  for (const mau of [0, null, undefined, NaN, -5]) {
    assert.strictEqual(classify(P3, 2, mau), null,
      "alvo " + String(mau) + " devia devolver null");
  }
});

test("os outros tipos ignoram o terceiro argumento", () => {
  /* Retrocompatibilidade da assinatura: nenhum call site existente passa alvo. */
  const cont = normItem({ tp: "count", t1: 4, t2: 1, t3: 0, max: 99 });
  assert.strictEqual(classify(cont, 4), 0);
  assert.strictEqual(classify(cont, 4, 10), 0, "alvo não altera uma contagem");
  const esc = normItem({ tp: "scale", t1: 0, t2: 1, t3: 2, max: 2 });
  assert.strictEqual(classify(esc, 2), 2);
  assert.strictEqual(classify(esc, 2, 10), 2);
});

test("normItem aceita amostra e satura os limiares em 0..100", () => {
  const it = normItem({ tp: "amostra", tgt: 10, t1: 400, t2: -3, t3: 7 });
  assert.strictEqual(it.tp, "amostra");
  assert.strictEqual(it.max, 100, "o domínio dos limiares é a percentagem");
  assert.strictEqual(it.t1, 100);
  assert.strictEqual(it.t2, 0);
  assert.strictEqual(it.t3, 0, "T3 é sempre 0 numa escala invertida");
});

test("normItem exige um alvo utilizável e usa 10 por omissão", () => {
  assert.strictEqual(normItem({ tp: "amostra", t1: 40, t2: 10, t3: 0 }).tgt, 10);
  assert.strictEqual(normItem({ tp: "amostra", tgt: 0, t1: 40, t2: 10, t3: 0 }).tgt, 10);
  assert.strictEqual(normItem({ tp: "amostra", tgt: "25", t1: 40, t2: 10, t3: 0 }).tgt, 25);
});

test("normItem mantém T1 >= T2: nenhuma classe fica inalcançável", () => {
  const it = normItem({ tp: "amostra", tgt: 10, t1: 5, t2: 40, t3: 0 });
  assert.ok(it.t1 >= it.t2, "T1 (" + it.t1 + ") devia subir até T2 (" + it.t2 + ")");
});

test("normItem é idempotente numa amostra", () => {
  const uma = normItem(P3);
  assert.deepStrictEqual(normItem(uma), uma);
});

test("normItem não converte perguntas de contagem existentes", () => {
  /* As 16 perguntas sem alvo têm de continuar exactamente como estão. */
  const it = normItem({ tp: "count", t1: 4, t2: 1, t3: 0, max: 99 });
  assert.strictEqual(it.tp, "count");
  assert.strictEqual(it.max, 99);
  assert.strictEqual(it.tgt, undefined, "count não ganha alvo");
});

test("ruleOf descreve as faixas de uma amostra em percentagem", () => {
  const r = ruleOf(P3);
  assert.match(r.mau, /40/, "Mau começa em 40%");
  assert.match(r.opor, /10/, "Oportunidade começa em 10%");
  assert.ok(/%/.test(r.mau) && /%/.test(r.opor) && /%/.test(r.exc),
    "as faixas de uma amostra exprimem-se em %");
});

test("ruleOf de uma amostra binária não inventa meio-termo", () => {
  const bin = normItem({ tp: "amostra", tgt: 10, t1: 10, t2: 10, t3: 0 });
  assert.strictEqual(ruleOf(bin).opor, "—");
});

test("varrimento exaustivo: classify concorda com a percentagem declarada", () => {
  /* Toda a combinação alvo × resposta × limiares, verificada valor a valor
     contra a definição em percentagem. */
  for (const tgt of [1, 3, 4, 7, 10, 20, 100]) {
    for (const t1 of [0, 10, 33, 50, 100]) {
      for (const t2 of [0, 10, 33, 50, 100]) {
        const it = normItem({ tp: "amostra", tgt, t1, t2, t3: 0 });
        for (let n = 0; n <= tgt; n++) {
          const pct = (n / tgt) * 100;
          const esperado = pct >= it.t1 ? 0 : pct >= it.t2 ? 1 : 2;
          assert.strictEqual(classify(it, n, tgt), esperado,
            `tgt=${tgt} n=${n} t1=${it.t1} t2=${it.t2}`);
        }
      }
    }
  }
});
