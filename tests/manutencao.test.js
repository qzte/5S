/* Testes do cartão Manutenção (4.21.0): kpisManutencao, global e do ano. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["notaDoResp", "kpisManutencao", "avg", "ordemCron", "diasEntre", "estadoAcao",
  "criadaEmDe", "idadeAcoesAbertas", "desempenhoAcoes"], ["umaCasa", "ITEMS", "itemsOf"]);
const { kpisManutencao, notaDoResp } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

/* Duas perguntas de Manutenção (1 e 3) e uma de Utilizadores (2). */
const IT = [{ p: 0, n: 1, t: "Artigos", r: "M" }, { p: 0, n: 2, t: "Outra", r: "U" }, { p: 1, n: 3, t: "Caixas", r: "M" }];
const aud = (service, date, scores, acoes) => ({ id: service + date, service, date, scores, items: IT, acoes });

test("nota do responsável: só as perguntas dele", () => {
  assert.deepStrictEqual(plain(notaDoResp(aud("A", "2026-01-01", [2, 0, 2]), "M")), { pct: 100, n: 2 });
  assert.deepStrictEqual(plain(notaDoResp(aud("A", "2026-01-01", [2, 2, null]), "M")), { pct: 100, n: 1 });
  assert.strictEqual(notaDoResp(aud("A", "2026-01-01", [null, 2, null]), "M").n, 0);
});

test("M1: média do ano, variação e n", () => {
  const lista = [
    aud("A", "2026-03-10", [2, 0, 2]), aud("B", "2026-03-20", [0, 2, 0]), aud("C", "2026-03-25", [2, 2, 2]),
    aud("A", "2026-10-05", [2, 0, 0]), aud("A", "2025-06-01", [0, 0, 0]),
    aud("D", "2026-05-01", [null, 2, null]), /* sem respostas de Manutenção: não conta */
  ];
  const k = plain(kpisManutencao(lista, 2026, "2026-11-24", "M"));
  assert.strictEqual(k.auditorias, 4);
  assert.strictEqual(k.respostas, 8);
  assert.strictEqual(k.mediaAnt, 0);
  assert.strictEqual(k.auditoriasAnt, 1);
  assert.strictEqual(k.variacao, k.media - 0);
});

test("M1: sem o ano anterior, sem variação", () => {
  const k = kpisManutencao([aud("A", "2025-06-01", [2, 2, 2])], 2025, "2026-11-24", "M");
  assert.strictEqual(k.media, 100);
  assert.strictEqual(k.variacao, null);
});

test("M3: perguntas do responsável, da pior para a melhor, com respostas e variação", () => {
  const lista = [aud("A", "2026-02-01", [2, 0, 0]), aud("B", "2026-02-02", [2, 0, 1]), aud("A", "2025-02-01", [2, 0, 2])];
  const p = plain(kpisManutencao(lista, 2026, "2026-11-24", "M").perguntas);
  assert.deepStrictEqual(p.map(x => x.n), [3, 1], "só as de Manutenção, a pior primeiro");
  assert.strictEqual(p[0].respostas, 2);
  assert.strictEqual(p[1].pct, 100, "as que estão a 100 também aparecem");
  assert.strictEqual(p[0].delta, p[0].pct - 100);
});

test("M4: acções do responsável: abertas e em atraso agora, fecho no ano", () => {
  const acoes = [
    { r: "M", estado: "aberta", prazo: "2026-11-01", criadaEm: "2026-10-01" },
    { r: "M", estado: "aberta", prazo: "2026-12-30", criadaEm: "2026-11-14" },
    { r: "M", estado: "feita", criadaEm: "2026-01-01", feitaEm: "2026-01-11", prazo: "2026-01-31" },
    { r: "M", estado: "feita", criadaEm: "2026-01-01", feitaEm: "2026-02-20", prazo: "2026-01-31" },
    { r: "M", estado: "feita", criadaEm: "2025-01-01", feitaEm: "2025-03-01" },
    { r: "U", estado: "aberta", prazo: "2026-01-01" },
  ];
  const a = plain(kpisManutencao([aud("A", "2026-01-01", [0, 0, 0], acoes)], 2026, "2026-11-24", "M").acoes);
  assert.strictEqual(a.abertas, 2);
  assert.strictEqual(a.atrasadas, 1);
  assert.strictEqual(a.fechadas, 2, "só as fechadas em 2026");
  assert.strictEqual(a.diasMedio, 30);
  assert.strictEqual(a.comPrazo, 2);
  assert.strictEqual(a.noPrazo, 1);
  assert.strictEqual(a.pctPrazo, 50);
});

test("sem auditorias: nada parte", () => {
  const k = plain(kpisManutencao([], 2026, "2026-11-24", "M"));
  assert.strictEqual(k.media, null);
  assert.strictEqual(k.auditorias, 0);
  assert.deepStrictEqual(k.perguntas, []);
  assert.strictEqual(k.acoes.abertas, 0);
  assert.strictEqual(k.acoes.pctPrazo, null);
});
