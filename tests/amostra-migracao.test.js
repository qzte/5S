/* Testes de migrarParaAmostra(): converte para amostra as perguntas gravadas
   por versões anteriores a 3.1.0, que ficaram sem o campo "Auditados". O que
   estes testes protegem é o que a migração NÃO pode fazer — mexer em perguntas
   que não são de amostra, perder o que é do utilizador, ou correr duas vezes
   com efeitos diferentes. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["migrarParaAmostra", "chaveTexto", "normItem", "classify", "fixedKey"],
  ["PILLARS", "RESP", "DIR", "TKEYS", "isResp"]
);
const { migrarParaAmostra } = ctx;

/* Os arrays devolvidos vêm do contexto `vm`, cujo Array.prototype não é o deste
   ficheiro: deepStrictEqual falha por identidade de protótipo, não por
   conteúdo. Compara-se o conteúdo. */
const nums = a => Array.from(a).map(x => x.n).join(",");
const json = a => JSON.stringify(Array.from(a));

/* As de origem que interessam: 3, 18 e 19 são de amostra; 1 é contagem. */
const PADRAO = [
  { p: 0, n: 1, t: "Arrumação", r: "U", c: "Nº de artigos fora do sítio", tp: "count", t1: 4, t2: 1, t3: 0, max: 99 },
  { p: 0, n: 3, t: "Quantidades", r: "U+R", c: "Nº de kanbans com quantidades excessivas", tp: "amostra", tgt: 10, t1: 40, t2: 10, t3: 0, max: 100 },
  { p: 4, n: 18, t: "Reposição", r: "R", c: "Norma de reposição", tp: "amostra", tgt: 10, t1: 50, t2: 10, t3: 0, max: 100 },
  { p: 4, n: 19, t: "Validades", r: "U", c: "Fora de validade", tp: "amostra", tgt: 10, t1: 20, t2: 10, t3: 0, max: 100 }
];
/* O que ficou gravado em quem usou o editor antes de 3.1.0. */
/* O enunciado de origem é o que identifica a pergunta: o editor renumera ao
   gravar, por isso o número sozinho não serve de identidade. */
const TEXTO = { 3: "Nº de kanbans com quantidades excessivas",
                18: "Norma de reposição", 19: "Fora de validade" };
const antiga = (n, extra) => Object.assign(
  { p: 0, n: n, t: "Tema", r: "U", c: TEXTO[n] || ("Pergunta " + n),
    tp: "count", t1: 4, t2: 1, t3: 0, max: 99 }, extra);

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

/* --- Numeração: o editor renumera ao gravar (edSave faz n = posição), pelo
   que quem acrescentou, removeu ou reordenou perguntas tem números que já não
   correspondem aos de origem. Emparelhar pelo número converteria a pergunta
   errada — foi o que motivou passar a emparelhar pelo enunciado. --- */

test("encontra a pergunta pelo enunciado mesmo com o número trocado", () => {
  /* A pergunta das validades ficou com o nº 12 depois de uma reordenação. */
  const r = migrarParaAmostra([antiga(12, { c: "Fora de validade" })], PADRAO);
  assert.strictEqual(nums(r.convertidas), "12");
  assert.strictEqual(r.items[0].tp, "amostra");
  assert.strictEqual(r.items[0].t1, 20, "tem de herdar os limiares das validades, não os de outra");
});

test("não converte uma pergunta alheia que calhe ter o número 18", () => {
  /* Depois de apagar perguntas, a nº 18 passou a ser uma contagem qualquer.
     Dar-lhe um alvo auditado seria pior do que não migrar nada. */
  const alheia = antiga(18, { c: "Nº de extintores obstruídos" });
  const semAmostras = PADRAO.filter(d => d.tp === "amostra" && d.n !== 18);
  const r = migrarParaAmostra([alheia], semAmostras);
  assert.strictEqual(nums(r.convertidas), "");
  assert.strictEqual(r.items[0].tp, "count");
});

test("o número serve de reserva para quem reescreveu o enunciado", () => {
  const r = migrarParaAmostra([antiga(3, { c: "Kanbans com excesso (texto meu)" })], PADRAO);
  assert.strictEqual(nums(r.convertidas), "3");
  assert.strictEqual(r.items[0].t1, 40);
  assert.strictEqual(r.items[0].c, "Kanbans com excesso (texto meu)", "o texto do utilizador fica");
});

test("acentos, maiúsculas e espaços a mais não impedem o emparelhamento", () => {
  const r = migrarParaAmostra(
    [antiga(7, { c: "  NORMA   DE  REPOSICAO " })], PADRAO);
  assert.strictEqual(nums(r.convertidas), "7");
  assert.strictEqual(r.items[0].t1, 50, "é a pergunta da norma de reposição");
});

test("cada convertida traz o enunciado, para a proposta o poder mostrar", () => {
  const r = migrarParaAmostra([antiga(3)], PADRAO);
  assert.strictEqual(r.convertidas[0].c, "Nº de kanbans com quantidades excessivas");
});
