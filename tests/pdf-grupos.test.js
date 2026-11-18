/* Testes do PDF por responsável (4.8.0): os grupos da grelha (ordem, só as
   perguntas abaixo de Excelente, evidência e acções) e o HTML das folhas. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["gruposPdf", "pdfHTML", "textoPresentes", "byPillar", "byResp", "radarSVG", "anteriorDe", "ordemCron",
   "acoesPendentes", "estadoAcao", "obsOf", "dataCurta", "legendaPontuacao", "colTotals", "aplicarResps",
   "sanitizeResps", "normItem", "classify", "fixedKey"],
  ["ITEMS", "itemsOf", "LBL", "badge", "ORDEM_PDF", "ESTADO_ACAO"]);
const { gruposPdf, pdfHTML, byResp } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const it = (n, r, p) => ({ n, t: "Tema " + n, r, p: p || 0, c: "Pergunta " + n, tp: "count", t1: 4, t2: 1, t3: 0, max: 99 });
/* Perguntas dos cinco responsáveis de origem, em ordem «baralhada». */
const items = [it(1, "M"), it(2, "U"), it(3, "U+R"), it(4, "P"), it(5, "R"), it(6, "U"), it(7, "M")];
const aud = extra => Object.assign({ id: 10, service: "Loja A", date: "2026-11-18", items,
  scores: [2, 0, 1, 0, 2, 2, 2], raw: [0, 9, 2, 1, 0, 0, 0], notas: ["", "KB no chão", "", "", "", "", ""],
  acoes: [{ id: 1, r: "U", item: 2, texto: "Arrumar", prazo: "2026-12-01", estado: "aberta" },
    { id: 2, r: "M", texto: "Rever a estante A3", prazo: "", estado: "aberta" }],
  presentes: { U: "Ana", P: "Bruno" } }, extra);

test("ordem dos grupos: Utilizador(es), Picking, Reposição, Utilizador e Repositor, Manutenção", () => {
  assert.deepStrictEqual(plain(gruposPdf(aud()).map(g => g.r)), ["U", "P", "R", "U+R", "M"]);
});

test("só as perguntas abaixo de Excelente; as Excelentes contam-se", () => {
  const g = plain(gruposPdf(aud()));
  const u = g.find(x => x.r === "U");
  assert.deepStrictEqual(u.falhas.map(f => f.it.n), [2]);
  assert.strictEqual(u.excelentes, 1);
  assert.strictEqual(u.presente, "Ana");
  assert.strictEqual(g.find(x => x.r === "R").falhas.length, 0);
});

test("a nota de cada grupo é a do radar por responsável", () => {
  const a = aud();
  const radar = byResp(a);
  gruposPdf(a).forEach(g => assert.strictEqual(g.nota, radar.find(x => x.name === g.nome).pct, g.r));
});

test("evidência e acções: ligadas pela pergunta; sem pergunta, em «outras» do responsável", () => {
  const g = plain(gruposPdf(aud()));
  const f = g.find(x => x.r === "U").falhas[0];
  assert.strictEqual(f.nota, "KB no chão");
  assert.deepStrictEqual(f.acoes.map(x => x.id), [1]);
  assert.deepStrictEqual(g.find(x => x.r === "M").outras.map(x => x.id), [2]);
  assert.deepStrictEqual(g.find(x => x.r === "P").falhas[0].acoes, []);
});

test("um responsável acrescentado na Configuração vem no fim", () => {
  ctx.aplicarResps(Object.keys(ctx.RESP_BASE).map(k => ({ k, n: ctx.RESP_BASE[k] })).concat([{ k: "Q", n: "Qualidade" }]));
  try {
    const a = aud({ items: items.concat([it(8, "Q")]), scores: [2, 0, 1, 0, 2, 2, 2, 0], raw: [], notas: [] });
    assert.deepStrictEqual(plain(gruposPdf(a).map(g => g.r)), ["U", "P", "R", "U+R", "M", "Q"]);
  } finally {
    ctx.aplicarResps(Object.keys(ctx.RESP_BASE).map(k => ({ k, n: ctx.RESP_BASE[k] })));
  }
});

test("um responsável sem perguntas na auditoria não tem grupo", () => {
  const a = aud({ items: [it(1, "U"), it(2, "M")], scores: [0, 2], raw: [], notas: [], acoes: [] });
  assert.deepStrictEqual(plain(gruposPdf(a).map(g => g.r)), ["U", "M"]);
});

test("auditoria antiga: sem notas, sem acções, com Picking/Repositor", () => {
  const a = { id: 3, service: "Loja B", date: "2025-01-10", items, scores: [0, 0, 0, 0, 0, 0, 0], pick: "Zé", repo: "Rui" };
  const g = plain(gruposPdf(a));
  assert.ok(g.every(x => x.falhas.every(f => f.nota === "" && f.acoes.length === 0)));
  const h = pdfHTML(a, [a], new Map(), "2026-11-18");
  assert.match(h, /Picking: Zé/);
});

test("o HTML do PDF: radares, grelha só abaixo de Excelente, sem assinaturas", () => {
  const a = aud();
  const h = pdfHTML(a, [a], new Map([[1, "data:image/png;base64,AAAA"]]), "2026-11-18");
  assert.match(h, /Por pilar 5S/);
  assert.match(h, /Por responsável/);
  assert.match(h, /Utilizadores: Ana · Picking: Bruno/);
  assert.match(h, /Arrumar/);
  assert.match(h, /data:image\/png;base64,AAAA/);
  assert.doesNotMatch(h, /Tema 6/, "uma pergunta Excelente não aparece na grelha");
  assert.doesNotMatch(h, /[Aa]ssinatura/);
  const toda = aud({ scores: [2, 2, 2, 2, 2, 2, 2], acoes: [] });
  assert.match(pdfHTML(toda, [toda], new Map(), "2026-11-18"), /Todas as perguntas deste responsável ficaram Excelentes/);
});

test("o texto do utilizador é escapado no PDF", () => {
  const a = aud({ service: "<b>X</b>", notas: ["", "<img src=x>", "", "", "", "", ""] });
  const h = pdfHTML(a, [a], new Map(), "2026-11-18");
  assert.doesNotMatch(h, /<img src=x>/);
  assert.doesNotMatch(h, /<b>X<\/b>/);
});
