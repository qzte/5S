/* Testes de migrarParaAmostra(): converte para amostra as perguntas gravadas
   por versões anteriores a 3.1.0, que ficaram sem o campo "Auditados". O que
   estes testes protegem é o que a migração NÃO pode fazer — mexer em perguntas
   que não são de amostra, perder o que é do utilizador, ou correr duas vezes
   com efeitos diferentes. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["migrarParaAmostra", "normItem", "classify", "fixedKey"],
  ["PILLARS", "RESP", "DIR", "TKEYS", "isResp"]
);
const { migrarParaAmostra } = ctx;

/* Os arrays devolvidos vêm do contexto `vm`, cujo Array.prototype não é o deste
   ficheiro: deepStrictEqual falha por identidade de protótipo, não por
   conteúdo. Compara-se o conteúdo. */
const nums = a => Array.from(a).join(",");
const json = a => JSON.stringify(Array.from(a));

/* As de origem que interessam: 3, 18 e 19 são de amostra; 1 é contagem. */
const PADRAO = [
  { p: 0, n: 1, t: "Arrumação", r: "U", c: "Nº de artigos fora do sítio", tp: "count", t1: 4, t2: 1, t3: 0, max: 99 },
  { p: 0, n: 3, t: "Quantidades", r: "U+R", c: "Nº de kanbans com quantidades excessivas", tp: "amostra", tgt: 10, t1: 40, t2: 10, t3: 0, max: 100 },
  { p: 4, n: 18, t: "Reposição", r: "R", c: "Norma de reposição", tp: "amostra", tgt: 10, t1: 50, t2: 10, t3: 0, max: 100 },
  { p: 4, n: 19, t: "Validades", r: "U", c: "Fora de validade", tp: "amostra", tgt: 10, t1: 20, t2: 10, t3: 0, max: 100 }
];
/* O que ficou gravado em quem usou o editor antes de 3.1.0. */
const antiga = (n, extra) => Object.assign(
  { p: 0, n: n, t: "Tema", r: "U", c: "Pergunta " + n, tp: "count", t1: 4, t2: 1, t3: 0, max: 99 }, extra);

test("converte as perguntas de amostra e devolve os números afectados", () => {
  const r = migrarParaAmostra([antiga(3), antiga(18), antiga(19)], PADRAO);
  assert.strictEqual(nums(r.convertidas), "3,18,19");
  r.items.forEach(it => assert.strictEqual(it.tp, "amostra"));
  assert.strictEqual(r.items[0].tgt, 10);
});

test("os limiares vêm dos de origem, em percentagem", () => {
  /* Os antigos eram contagens absolutas: 4 kanbans, não 4%. Trazê-los seria
     inventar uma regra que ninguém definiu. */
  const r = migrarParaAmostra([antiga(3), antiga(18), antiga(19)], PADRAO);
  assert.strictEqual(json(r.items.map(it => [it.t1, it.t2])), "[[40,10],[50,10],[20,10]]");
  r.items.forEach(it => assert.strictEqual(it.max, 100, "o domínio de uma amostra é 0..100"));
});

test("preserva o que é do utilizador", () => {
  const minha = antiga(3, { c: "O meu enunciado próprio", t: "O meu tema", r: "M", p: 2 });
  const it = migrarParaAmostra([minha], PADRAO).items[0];
  assert.strictEqual(it.c, "O meu enunciado próprio");
  assert.strictEqual(it.t, "O meu tema");
  assert.strictEqual(it.r, "M");
  assert.strictEqual(it.p, 2);
});

test("não toca em perguntas que não são de amostra na origem", () => {
  const r = migrarParaAmostra([antiga(1), antiga(7)], PADRAO);
  assert.strictEqual(nums(r.convertidas), "");
  assert.strictEqual(r.items[0].tp, "count");
  assert.strictEqual(r.items[0].t1, 4, "os limiares de uma contagem ficam como estavam");
});

test("não reconverte o que já é amostra: correr duas vezes não muda nada", () => {
  const uma = migrarParaAmostra([antiga(3), antiga(1)], PADRAO);
  const duas = migrarParaAmostra(uma.items, PADRAO);
  assert.strictEqual(nums(duas.convertidas), "", "a segunda passagem não tem nada a fazer");
  assert.strictEqual(json(duas.items), json(uma.items));
});

test("um alvo já personalizado não sobrevive a uma conversão de tipo", () => {
  /* Vinha de uma contagem: qualquer tgt que lá estivesse não tinha significado
     de alvo auditado. Assume-se o sugerido de origem. */
  const it = migrarParaAmostra([antiga(3, { tgt: 999 })], PADRAO).items[0];
  assert.strictEqual(it.tgt, 10);
});

test("lista vazia ou ausente não rebenta", () => {
  assert.strictEqual(migrarParaAmostra([], PADRAO).convertidas.length, 0);
  assert.strictEqual(migrarParaAmostra(null, PADRAO).items.length, 0);
  assert.strictEqual(migrarParaAmostra([antiga(3)], null).convertidas.length, 0);
});

test("entradas nulas na lista guardada são atravessadas sem erro", () => {
  const r = migrarParaAmostra([null, antiga(3)], PADRAO);
  assert.strictEqual(nums(r.convertidas), "3");
  assert.strictEqual(r.items.length, 2);
});
