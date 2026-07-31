/* Testes de findCols(): identificar a linha de cabeçalho de uma folha de Excel.
   O erro que os motiva: um ficheiro com a linha de título "Relatório de
   serviços" antes do cabeçalho era importado ao contrário — "serviços" casava
   com /servic/, o título passava por cabeçalho, e a coluna dos códigos entrava
   como se fossem nomes de serviço. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["findCols"], ["norm"]);
const { findCols } = ctx;

/* Os valores vêm de sheet_to_json(..., {header:1, defval:""}): matriz de
   linhas, com as células vazias como string vazia. */
const CAB = ["Código", "Descrição"];
const DADOS = [["11120", "UCIP"], ["22450", "Talho"]];

test("cabeçalho na primeira linha", () => {
  const c = findCols([CAB].concat(DADOS));
  assert.strictEqual(c.head, 0);
  assert.strictEqual(c.cod, 0);
  assert.strictEqual(c.desc, 1);
});

test("linha de título com a palavra 'serviços' não é tomada por cabeçalho", () => {
  const c = findCols([["Relatório de serviços"], [""], CAB].concat(DADOS));
  assert.strictEqual(c.head, 2, "o cabeçalho é a linha dos rótulos, não a do título");
  assert.strictEqual(c.cod, 0);
  assert.strictEqual(c.desc, 1);
});

test("título de repositores também não engana", () => {
  const c = findCols([["Lista de repositores 2026"], ["Código", "Nome"], ["A17", "Ana Prata"]]);
  assert.strictEqual(c.head, 1);
  assert.strictEqual(c.nome, 1);
});

test("ganha a linha que identifica mais colunas", () => {
  /* A primeira casa uma; a terceira casa três. */
  const c = findCols([
    ["Serviços do mês"], [""],
    ["Código", "Designação", "Nome do responsável"],
    ["11120", "UCIP", "Ana"]
  ]);
  assert.strictEqual(c.head, 2);
  assert.strictEqual(c.cod, 0);
  assert.strictEqual(c.desc, 1);
  assert.strictEqual(c.nome, 2);
});

test("uma só coluna continua a ser reconhecida", () => {
  const c = findCols([["Nome"], ["Ana Prata"], ["Rui Melo"]]);
  assert.strictEqual(c.head, 0);
  assert.strictEqual(c.nome, 0);
  assert.strictEqual(c.cod, -1);
  assert.strictEqual(c.desc, -1);
});

test("rótulos com acentos, maiúsculas e espaços a mais", () => {
  const c = findCols([["  CÓDIGO ", " Descrição do serviço "]].concat(DADOS));
  assert.strictEqual(c.head, 0);
  assert.strictEqual(c.cod, 0);
  assert.strictEqual(c.desc, 1);
});

test("folha sem nada de reconhecível devolve null", () => {
  assert.strictEqual(findCols([["Total"], ["1234"]]), null);
  assert.strictEqual(findCols([]), null);
});

test("linhas em falta ou irregulares não rebentam", () => {
  /* Folhas reais trazem linhas curtas e buracos. */
  const c = findCols([undefined, [], CAB, ["11120"]]);
  assert.strictEqual(c.head, 2);
});

test("procura para lá das primeiras linhas de preâmbulo", () => {
  const preambulo = [["Kaizen"], [""], ["Exportação automática"], [""], [""], [""]];
  const c = findCols(preambulo.concat([CAB]).concat(DADOS));
  assert.strictEqual(c.head, 6);
});

test("sem âncora só como reserva: um cabeçalho invulgar continua a ser lido", () => {
  /* "Nº/Código" não começa por 'cod', e nenhuma outra linha casa ancorada:
     a segunda passagem, sem âncora, salva o ficheiro. */
  const c = findCols([["Nº/Código", "Designação"], ["11120", "UCIP"]]);
  assert.strictEqual(c.head, 0);
  assert.strictEqual(c.cod, 0, "encontrado na passagem sem âncora");
  assert.strictEqual(c.desc, 1);
});

test("mesmo sem âncora, o título perde para o cabeçalho verdadeiro", () => {
  /* Nenhuma linha casa ancorada (o cabeçalho usa rótulos invulgares), pelo que
     tudo se decide na segunda passagem — e aí a contagem de colunas é o que
     impede o título de ganhar. */
  const c = findCols([
    ["Mapa de serviços"],
    ["Nº/Código", "Sua designação"],
    ["11120", "UCIP"]
  ]);
  assert.strictEqual(c.head, 1);
  assert.strictEqual(c.cod, 0);
  assert.strictEqual(c.desc, 1);
});
