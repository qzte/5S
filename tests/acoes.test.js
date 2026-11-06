/* Testes do plano de acções (3.12.0): a porta de entrada (sanitizeAcoes), o
   estado de cada acção, as acções em aberto de um serviço, a contagem do
   Histórico, a folha do Excel e o uso de um responsável por uma acção. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["sanitizeAcoes", "estadoAcao", "acoesPendentes", "contaAcoes", "ordemCron", "linhasExcel",
   "byPillar", "byResp", "respEmUso", "recTexto", "sanitizeAudit", "recsOf", "normItem", "classify", "fixedKey"],
  ["ITEMS", "itemsOf", "LBL", "badge", "MAX_ACOES"]);
const { sanitizeAcoes, estadoAcao, acoesPendentes, contaAcoes, linhasExcel, respEmUso, sanitizeAudit, MAX_ACOES } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const HOJE = "2026-11-06";

test("sanitizeAcoes: só entra o que tem texto, com campos limpos", () => {
  const r = plain(sanitizeAcoes([
    { id: 3, r: "M", texto: "  Arrumar‮ o corredor  ", prazo: "2026-11-10", estado: "aberta", item: 4 },
    { r: "inexistente", texto: "x", prazo: "10/11/2026", estado: "talvez", item: -1 },
    { texto: "   " }, null, "lixo", [1], { texto: "feita sem data", estado: "feita", feitaEm: "ontem" },
    { id: 3, texto: "id repetido" }
  ]));
  assert.strictEqual(r.length, 4);
  assert.deepStrictEqual(r[0], { id: 3, r: "M", texto: "Arrumar o corredor", prazo: "2026-11-10",
    estado: "aberta", feitaEm: "", item: 4 });
  assert.strictEqual(r[1].r, "U", "responsável desconhecido cai no de recurso");
  assert.strictEqual(r[1].prazo, "", "uma data mal formada fica vazia");
  assert.strictEqual(r[1].estado, "aberta");
  assert.strictEqual(r[1].item, null);
  assert.strictEqual(r[2].estado, "feita");
  assert.strictEqual(r[2].feitaEm, "");
  const ids = r.map(x => x.id);
  assert.strictEqual(new Set(ids).size, ids.length, "ids únicos");
  assert.ok(ids.every(i => Number.isInteger(i) && i > 0));
});

test("sanitizeAcoes: texto limitado, número de acções limitado, não-lista vira lista vazia", () => {
  assert.strictEqual(plain(sanitizeAcoes([{ texto: "a".repeat(999) }]))[0].texto.length, 300);
  assert.strictEqual(sanitizeAcoes(Array.from({ length: 500 }, () => ({ texto: "x" }))).length, MAX_ACOES);
  for (const x of [null, undefined, "x", {}, 3]) assert.deepStrictEqual(plain(sanitizeAcoes(x)), []);
});

test("estado: feita, atrasada (prazo passado) ou aberta", () => {
  assert.strictEqual(estadoAcao({ estado: "feita", prazo: "2020-01-01" }, HOJE), "feita");
  assert.strictEqual(estadoAcao({ estado: "aberta", prazo: "2026-11-05" }, HOJE), "atrasada");
  assert.strictEqual(estadoAcao({ estado: "aberta", prazo: HOJE }, HOJE), "aberta", "no próprio dia ainda não está atrasada");
  assert.strictEqual(estadoAcao({ estado: "aberta", prazo: "" }, HOJE), "aberta");
});

const ac = (id, extra) => Object.assign({ id, r: "U", texto: "acção " + id, prazo: "", estado: "aberta", feitaEm: "", item: null }, extra || {});
const A1 = { id: 1, service: "Loja A", date: "2026-01-10", scores: [2], acoes: [ac(1, { prazo: "2026-12-01" }), ac(2, { estado: "feita" })] };
const A2 = { id: 2, service: "Loja A", date: "2026-03-05", scores: [2], acoes: [ac(1, { prazo: "2026-02-01" }), ac(2)] };
const A3 = { id: 3, service: "Loja A", date: "2026-05-01", scores: [2], acoes: [ac(1)] };
const B1 = { id: 4, service: "Loja B", date: "2026-02-01", scores: [2], acoes: [ac(1)] };
const TODAS = [A3, B1, A1, A2];

test("pendentes: só abertas, só do serviço, atrasadas primeiro, depois por prazo", () => {
  const p = plain(acoesPendentes(TODAS, "Loja A", HOJE));
  assert.deepStrictEqual(p.map(x => [x.auditId, x.acao.id, x.estado]),
    [[2, 1, "atrasada"], [1, 1, "aberta"], [2, 2, "aberta"], [3, 1, "aberta"]]);
});

test("pendentes no relatório: só das auditorias ANTERIORES a esta", () => {
  const p = plain(acoesPendentes(TODAS, "Loja A", HOJE, A2));
  assert.deepStrictEqual(p.map(x => [x.auditId, x.acao.id]), [[1, 1]]);
  assert.deepStrictEqual(plain(acoesPendentes(TODAS, "Loja A", HOJE, A1)), []);
  assert.deepStrictEqual(plain(acoesPendentes([{ id: 9, service: "Loja A", date: "2026-01-01", scores: [] }], "Loja A", HOJE)), [],
    "auditorias sem plano não dão erro");
});

test("contagem do Histórico", () => {
  assert.deepStrictEqual(plain(contaAcoes(A2, HOJE)), { abertas: 2, atrasadas: 1 });
  assert.deepStrictEqual(plain(contaAcoes(A1, HOJE)), { abertas: 1, atrasadas: 0 });
  assert.deepStrictEqual(plain(contaAcoes({ id: 1 }, HOJE)), { abertas: 0, atrasadas: 0 });
});

test("Excel: uma linha por acção, na terceira folha", () => {
  const its = [{ p: 0, n: 1, t: "T", c: "C", tp: "count", r: "U" }];
  const { acoes } = plain(linhasExcel([Object.assign({}, A1, { items: its })]));
  assert.strictEqual(acoes.length, 2);
  assert.deepStrictEqual(Object.keys(acoes[0]),
    ["ID auditoria", "Serviço", "Data da auditoria", "Responsável", "Acção", "Pergunta Nº", "Prazo", "Estado", "Concluída em"]);
  assert.strictEqual(acoes[0]["Responsável"], "Utilizadores");
  assert.strictEqual(acoes[1]["Estado"], "Feita");
});

test("uma acção conta como uso do responsável", () => {
  const u = plain(respEmUso("M", [], [{ id: 1, acoes: [ac(1, { r: "M" })] }]));
  assert.strictEqual(u.auditorias, 1);
  assert.strictEqual(plain(respEmUso("M", [], [{ id: 1, acoes: [ac(1)] }])).auditorias, 0);
});

test("a importação traz o plano, pela mesma porta", () => {
  const a = plain(sanitizeAudit({ id: 1, service: "S", date: "2026-01-01", scores: [2],
    acoes: [{ texto: "fazer", r: "R", prazo: "2026-02-01" }, { texto: "" }] }));
  assert.strictEqual(a.acoes.length, 1);
  assert.strictEqual(a.acoes[0].r, "R");
  assert.deepStrictEqual(plain(sanitizeAudit({ id: 1, service: "S", date: "2026-01-01", scores: [2] })).acoes, [],
    "uma auditoria antiga, sem plano, chega com a lista vazia");
});
