/* Testes da 4.2.0: escolher o serviço a auditar pela pesquisa (nome ou código,
   na lista e nas auditorias já feitas) e a listagem de serviços exportada do
   sistema (ID_SERVICO, DESCRICAO_SERVICO, LOCAL_SERVICO, SERVICO_ATIVO). */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["servicosParaAuditar", "procurarServicos", "findCols", "tipoDoExcel", "ativoDoExcel"], ["norm"]);
const { servicosParaAuditar, procurarServicos, findCols, tipoDoExcel, ativoDoExcel } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

test("serviços a auditar: os da lista, e os que só existem em auditorias, por ordem", () => {
  const r = plain(servicosParaAuditar(["Talho (101)", "Peixaria (102)", "Talho (101)"],
    [{ service: "Padaria (103)" }, { service: "Talho (101)" }, { service: "Armazém (201)" }, { service: "Padaria (103)" }, null, { service: 5 }]));
  assert.deepStrictEqual(r.lista, ["Talho (101)", "Peixaria (102)"]);
  assert.deepStrictEqual(r.anteriores, ["Armazém (201)", "Padaria (103)"]);
});

test("pesquisa pelo nome ou pelo código, sem acentos nem maiúsculas, todas as palavras", () => {
  const nomes = ["Talho (101)", "Peixaria (102)", "Armazém Central (201)", "teste 2 (teste2)"];
  assert.deepStrictEqual(plain(procurarServicos(nomes, "")), nomes);
  assert.deepStrictEqual(plain(procurarServicos(nomes, "  ")), nomes);
  assert.deepStrictEqual(plain(procurarServicos(nomes, "102")), ["Peixaria (102)"]);
  assert.deepStrictEqual(plain(procurarServicos(nomes, "ARMAZEM")), ["Armazém Central (201)"]);
  assert.deepStrictEqual(plain(procurarServicos(nomes, "central 201")), ["Armazém Central (201)"]);
  assert.deepStrictEqual(plain(procurarServicos(nomes, "teste2")), ["teste 2 (teste2)"]);
  assert.deepStrictEqual(plain(procurarServicos(nomes, "talho 999")), []);
});

test("listagem do sistema: ID_SERVICO é o código; o local e o ativo são encontrados", () => {
  const c = plain(findCols([["ID_SERVICO", "DESCRICAO_SERVICO", "LOCAL_SERVICO", "SERVICO_ATIVO"], ["teste2", "teste 2", "Interno", true]]));
  assert.deepStrictEqual(c, { head: 0, cod: 0, desc: 1, nome: -1, local: 2, ativo: 3 });
  /* Os ficheiros de antes continuam iguais, sem local nem ativo. */
  const v = plain(findCols([["Código", "Descrição"], ["1", "A"]]));
  assert.deepStrictEqual(v, { head: 0, cod: 0, desc: 1, nome: -1, local: -1, ativo: -1 });
  /* "Identificação" não é um código. */
  assert.strictEqual(findCols([["Identificação", "Descrição"]]).cod, -1);
});

test("tipo e ativo de uma célula", () => {
  assert.deepStrictEqual(["Interno", " externo ", "INT", "Ext.", "", null, "outro"].map(tipoDoExcel), ["i", "e", "i", "e", "", "", ""]);
  assert.deepStrictEqual([true, "", "Sim", "VERDADEIRO", 1, null].map(ativoDoExcel), [true, true, true, true, true, true]);
  assert.deepStrictEqual([false, 0, "Não", "nao", "N", "FALSE", "Falso", "0", "Inativo"].map(ativoDoExcel), Array(9).fill(false));
});
