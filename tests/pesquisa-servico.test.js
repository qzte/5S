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

/* ---- 4.2.3: a listagem associa-se pelo nome ou, senão, pelo código. ---- */
const p = buildContext(["planoServicosExcel", "codigoServico", "tipoDe", "tipoDoExcel"], ["norm"]);

test("código de um serviço: entre parênteses no fim do nome", () => {
  assert.deepStrictEqual(["Talho (101)", "Téc.Nefrol. (70EE10) ", "UCIP", "A (x) B", "[UROLOGIA - BLOCO]"].map(p.codigoServico),
    ["101", "70ee10", "", "", ""]);
});

test("o mesmo código com outra descrição não duplica: o tipo vai para o serviço da lista", () => {
  const svcs = ["Téc.Nefrol. (70EE10)", "UCIP (11120)", "Piso E", "Farmácia (52)"];
  const linhas = [
    { nome: "Téc.Nefrol (70EE10)", cod: "70EE10", t: "i" },   /* outra descrição, mesmo código */
    { nome: "UCIP (11120)", cod: "11120", t: "i" },            /* o mesmo nome */
    { nome: "Farmácia (52)", cod: "52", t: "" },               /* o ficheiro não diz o tipo */
    { nome: "Pediatria (15A)", cod: "15A", t: "e" },           /* novo */
    { nome: "Pediatria B (15A)", cod: "15a", t: "i" },         /* mesmo código que o novo: vai para ele */
  ];
  const r = plain(p.planoServicosExcel(svcs, linhas, [{ s: "UCIP (11120)", t: "e" }]));
  assert.deepStrictEqual(r.novos, ["Pediatria (15A)"]);
  assert.strictEqual(r.mesmoCodigo, 2);
  assert.deepStrictEqual(r.tipos, [{ s: "Téc.Nefrol. (70EE10)", t: "i" }, { s: "UCIP (11120)", t: "i" }, { s: "Pediatria (15A)", t: "i" }],
    "o tipo do ficheiro substitui o que lá estava; a última linha do mesmo serviço ganha");
  assert.deepStrictEqual(r.semTipo, ["Piso E", "Farmácia (52)"], "sem código no ficheiro, ou sem tipo no ficheiro");
});

test("tipo de uma letra, I ou E", () => {
  assert.deepStrictEqual(["I", "e", "Ie"].map(p.tipoDoExcel), ["i", "e", ""], "uma letra a mais já não é um tipo");
});

test("4.2.4: o mesmo código em dois serviços da lista: os dois recebem o tipo, e são ditos duplicados", () => {
  const svcs = ["Téc.Nefrol. (70EE10)", "Téc.Nefrol (70EE10)", "UCIP (11120)"];
  const r = plain(p.planoServicosExcel(svcs, [
    { nome: "Téc.Nefrol (70EE10)", cod: "70EE10", t: "i" },
    { nome: "UCIP (11120)", cod: "11120", t: "e" },
  ], [{ s: "Téc.Nefrol (70EE10)", t: "i" }, { s: "UCIP (11120)", t: "e" }]));
  assert.deepStrictEqual(r.novos, []);
  assert.deepStrictEqual(r.tipos, [{ s: "Téc.Nefrol. (70EE10)", t: "i" }], "o duplicado sem tipo recebe-o; os outros já o tinham");
  assert.deepStrictEqual(r.semTipo, []);
  assert.deepStrictEqual(r.duplicados, [["Téc.Nefrol. (70EE10)", "Téc.Nefrol (70EE10)"]]);
});
