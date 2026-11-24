/* Testes de «quem está presente» por responsável (4.8.0): a limpeza à entrada,
   o texto do relatório e do PDF, o rascunho e a exportação para Excel. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["sanitizePresentes", "textoPresentes", "sanitizeAudit", "sanitizeEnvios", "sanitizeTempo", "sanitizeAcoes", "recsOf", "recTexto",
   "normItem", "classify", "fixedKey", "montarRascunho", "lerRascunho", "assinItem", "inteiroOuNull",
   "linhasExcel", "ordemCron", "byPillar", "byResp"],
  ["ITEMS", "itemsOf", "LBL", "badge"]);
const { sanitizePresentes, textoPresentes, sanitizeAudit, montarRascunho, lerRascunho, linhasExcel } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const valida = extra => Object.assign({ id: 5, service: "Loja A", date: "2026-11-18", scores: [2, 1] }, extra);

test("sanitizePresentes: só responsáveis conhecidos, nomes limpos, vazios fora", () => {
  const r = plain(sanitizePresentes({ U: " Ana ", P: "", X: "Zé", M: "<b>Rui</b>" }));
  assert.deepStrictEqual(Object.keys(r).sort(), ["M", "U"]);
  assert.strictEqual(r.U, "Ana");
  assert.strictEqual(r.M, "<b>Rui</b>", "o texto é guardado como escrito; esc() trata dele ao desenhar");
  assert.strictEqual(sanitizePresentes({ U: "x".repeat(300) }).U.length, 120);
  for (const v of [{}, null, "x", [], { P: "" }, { X: "Zé" }]) assert.strictEqual(sanitizePresentes(v), undefined);
});

test("sanitizeAudit leva os presentes e mantém os nomes antigos", () => {
  assert.deepStrictEqual(plain(sanitizeAudit(valida({ presentes: { U: "Ana" } })).presentes), { U: "Ana" });
  assert.strictEqual(sanitizeAudit(valida()).presentes, undefined);
  const antiga = sanitizeAudit(valida({ pick: "Bruno", repo: "Carla" }));
  assert.strictEqual(antiga.pick, "Bruno");
  assert.strictEqual(antiga.repo, "Carla");
});

test("textoPresentes: pela ordem da lista; auditorias antigas como antes", () => {
  assert.strictEqual(textoPresentes({ presentes: { P: "Bruno", U: "Ana" } }), "Utilizadores: Ana · Picking: Bruno");
  assert.strictEqual(textoPresentes({ pick: "X", repo: "Y" }), "Picking: X · Repositor: Y");
  assert.strictEqual(textoPresentes({ pick: "X" }), "Picking: X");
  assert.strictEqual(textoPresentes({}), "");
});

test("o rascunho guarda os presentes, e um nome basta para haver rascunho", () => {
  const IT = [{ n: 1, tp: "count", c: "Caixas" }];
  const d = montarRascunho({ presentes: { U: "Ana" } }, IT, [], [], "2026-11-18T10:00:00.000Z", []);
  assert.ok(d, "um nome presente é trabalho a guardar");
  assert.deepStrictEqual(plain(lerRascunho(plain(d), IT).presentes), { U: "Ana" });
  assert.strictEqual(lerRascunho(plain(montarRascunho({ pick: "A" }, IT, [], [], "2026-11-18T10:00:00.000Z", [])), IT).presentes, undefined);
});

test("Excel: uma coluna por responsável, e as colunas antigas ficam", () => {
  const a = sanitizeAudit(valida({ presentes: { U: "Ana" }, pick: "Bruno" }));
  const o = linhasExcel([a]).auditorias[0];
  assert.strictEqual(o["Presente: Utilizadores"], "Ana");
  assert.strictEqual(o["Presente: Picking"], "");
  assert.strictEqual(o["Picking"], "Bruno");
  assert.ok("Repositor" in o);
});
