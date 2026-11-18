/* Testes da acção e do prazo escritos dentro da pergunta (4.8.0): a passagem do
   formulário para o plano de acção da auditoria, o preenchimento ao editar e o
   rascunho. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["acoesDoFormulario", "acaoDoItem", "sanitizeAcoes", "montarRascunho", "lerRascunho",
  "assinItem", "inteiroOuNull"], ["MAX_ACOES"]);
const { acoesDoFormulario, acaoDoItem, montarRascunho, lerRascunho } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const IT = [
  { n: 1, r: "U", tp: "count", c: "Artigos extra" },
  { n: 7, r: "R", tp: "count", c: "KB vazios" },
  { n: 8, r: "P", tp: "count", c: "Rutura" }];
const D = "2026-11-18";

test("auditoria nova: uma acção por pergunta a melhorar com texto, com o responsável e o número da pergunta", () => {
  const r = plain(acoesDoFormulario([], IT, [2, 0, 1],
    { 1: { texto: "Arrumar os KB", prazo: "2026-11-27" }, 2: { texto: "Cartão vermelho", prazo: "" } }, D));
  assert.strictEqual(r.length, 2);
  assert.deepStrictEqual([r[0].item, r[0].r, r[0].texto, r[0].prazo, r[0].estado, r[0].criadaEm],
    [7, "R", "Arrumar os KB", "2026-11-27", "aberta", D]);
  assert.deepStrictEqual([r[1].item, r[1].r, r[1].prazo], [8, "P", ""]);
  assert.notStrictEqual(r[0].id, r[1].id);
});

test("uma pergunta Excelente não cria acção, mesmo com texto escrito", () => {
  assert.deepStrictEqual(plain(acoesDoFormulario([], IT, [2, 2, 2], { 0: { texto: "x", prazo: "" } }, D)), []);
});

test("edição: escreve por cima da primeira acção da pergunta; a segunda, do relatório, fica", () => {
  const antes = [{ id: 5, r: "R", item: 7, texto: "velho", prazo: "", estado: "aberta" },
    { id: 6, r: "R", item: 7, texto: "do relatório", prazo: "2026-12-01", estado: "aberta" }];
  const r = plain(acoesDoFormulario(antes, IT, [2, 0, 2], { 1: { texto: "novo", prazo: "2026-11-30" } }, D));
  assert.deepStrictEqual(r.map(a => [a.id, a.texto, a.prazo]), [[5, "novo", "2026-11-30"], [6, "do relatório", "2026-12-01"]]);
});

test("pergunta que passa a Excelente: sai a acção aberta, fica a feita", () => {
  const antes = [{ id: 5, r: "R", item: 7, texto: "aberta", estado: "aberta" },
    { id: 6, r: "R", item: 7, texto: "feita", estado: "feita", feitaEm: "2026-11-10" }];
  const r = plain(acoesDoFormulario(antes, IT, [2, 2, 2], {}, D));
  assert.deepStrictEqual(r.map(a => a.id), [6]);
});

test("texto apagado em edição: a primeira acção aberta da pergunta sai", () => {
  const antes = [{ id: 5, r: "R", item: 7, texto: "x", estado: "aberta" }];
  assert.deepStrictEqual(plain(acoesDoFormulario(antes, IT, [2, 1, 2], { 1: { texto: "  ", prazo: "" } }, D)), []);
});

test("acções sem pergunta ficam como estão", () => {
  const antes = [{ id: 9, r: "M", texto: "Geral", estado: "aberta" }];
  assert.deepStrictEqual(plain(acoesDoFormulario(antes, IT, [2, 2, 2], {}, D)).map(a => a.id), [9]);
});

test("texto e prazo limpos: 300 caracteres, prazo inválido vazio", () => {
  const r = plain(acoesDoFormulario([], IT, [0, 2, 2], { 0: { texto: "a".repeat(400), prazo: "amanhã" } }, D));
  assert.strictEqual(r[0].texto.length, 300);
  assert.strictEqual(r[0].prazo, "");
});

test("acaoDoItem: a primeira acção com esse número, ou vazia", () => {
  const acoes = [{ id: 1, item: 7, texto: "A", prazo: "2026-12-01" }, { id: 2, item: 7, texto: "B", prazo: "" }];
  assert.deepStrictEqual(plain(acaoDoItem(acoes, 7)), { texto: "A", prazo: "2026-12-01" });
  assert.deepStrictEqual(plain(acaoDoItem(acoes, 1)), { texto: "", prazo: "" });
  assert.deepStrictEqual(plain(acaoDoItem(undefined, 1)), { texto: "", prazo: "" });
});

test("rascunho: a acção e o prazo voltam à mesma pergunta", () => {
  const d = plain(montarRascunho({}, IT, [0], [], "2026-11-18T10:00:00.000Z", [],
    [{ texto: "Arrumar", prazo: "2026-12-01" }, { texto: "", prazo: "" }, { texto: "x".repeat(400), prazo: "lixo" }]));
  assert.ok(d, "uma acção escrita é trabalho a guardar");
  const l = plain(lerRascunho(d, IT));
  assert.deepStrictEqual(l.acoes[0], { texto: "Arrumar", prazo: "2026-12-01" });
  assert.strictEqual(l.acoes[2].texto.length, 300);
  assert.strictEqual(l.acoes[2].prazo, "");
});

test("rascunho: pergunta que já não existe perde a acção sem a passar a outra", () => {
  const d = plain(montarRascunho({}, IT, [0], [], "2026-11-18T10:00:00.000Z", [], [{ texto: "Da 1", prazo: "" }]));
  const l = plain(lerRascunho(d, [IT[1], IT[2]]));
  assert.ok(l.acoes.every(a => a.texto === ""), "a acção da pergunta 1 não pode aparecer noutra");
});

test("rascunho antigo, sem acções, lê-se com acções vazias", () => {
  const d = plain(montarRascunho({}, IT, [0], [], "2026-11-18T10:00:00.000Z", []));
  delete d.acoes;
  assert.deepStrictEqual(plain(lerRascunho(d, IT)).acoes, [{ texto: "", prazo: "" }, { texto: "", prazo: "" }, { texto: "", prazo: "" }]);
});
