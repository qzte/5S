/* Testes da evidência por pergunta e da cópia de segurança com fotos (3.14.0):
   as chaves das fotos, a validação das fotos importadas, as notas no rascunho,
   na importação e no Excel. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["idDaChave", "fotosParaImportar", "montarRascunho", "lerRascunho", "assinItem", "inteiroOuNull",
   "sanitizeAudit", "sanitizeEnvios", "sanitizeAcoes", "recsOf", "recTexto", "normItem", "classify", "fixedKey",
   "linhasExcel", "ordemCron", "byPillar", "byResp"],
  ["FOTOS_MAX", "FOTO_MAX_CHARS", "RE_FOTO_URL", "ITEMS", "itemsOf", "LBL", "badge"]);
const { idDaChave, fotosParaImportar, montarRascunho, lerRascunho, sanitizeAudit, linhasExcel } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const JPG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";

test("o id da auditoria sai da chave, das recomendações e das evidências; o rascunho não tem", () => {
  assert.strictEqual(idDaChave("1730000000000|U"), 1730000000000);
  assert.strictEqual(idDaChave("1730000000000#3"), 1730000000000);
  assert.strictEqual(idDaChave("12|a#b"), 12, "um código de responsável com # continua a ser recomendação");
  assert.strictEqual(idDaChave("rascunho#3|count|Pergunta"), null);
  assert.strictEqual(idDaChave("lixo"), null);
});

test("fotos importadas: só data URL de imagem, chaves válidas, com o id trocado", () => {
  const mapa = new Map([[10, 10], [20, 25]]);
  const r = plain(fotosParaImportar([
    { k: "10|U", v: JPG },
    { k: "20#4", v: JPG },
    { k: "30|U", v: JPG },                                   /* auditoria que não entrou */
    { k: "10|M", v: "javascript:alert(1)" },
    { k: "10|M", v: "data:image/svg+xml;base64,PHN2Zz4=" },  /* SVG pode trazer script */
    { k: "10|M", v: "data:image/png;base64,abc<script>" },
    { k: "10#x", v: JPG },                                   /* evidência sem número */
    { k: "10#1234", v: JPG },
    { k: "rascunho#1", v: JPG },
    { k: "10|" + "R".repeat(41), v: JPG },
    { k: 10, v: JPG }, null, "x", [1]
  ], mapa));
  assert.deepStrictEqual(r, [{ k: "10|U", v: JPG }, { k: "25#4", v: JPG }]);
});

test("fotos importadas: tamanho e número limitados; uma lista que não é lista dá nada", () => {
  const grande = "data:image/jpeg;base64," + "A".repeat(ctx.FOTO_MAX_CHARS);
  assert.deepStrictEqual(plain(fotosParaImportar([{ k: "1|U", v: grande }], new Map([[1, 1]]))), []);
  const muitas = Array.from({ length: ctx.FOTOS_MAX + 10 }, (_, i) => ({ k: "1|R" + i, v: JPG }));
  assert.strictEqual(fotosParaImportar(muitas, new Map([[1, 1]])).length, ctx.FOTOS_MAX);
  for (const x of [null, {}, "x"]) assert.deepStrictEqual(plain(fotosParaImportar(x, new Map())), []);
});

const IT = [{ n: 1, tp: "count", c: "A" }, { n: 2, tp: "count", c: "B" }];
const CAMPOS = { service: "S", date: "2026-11-06", pick: "", repo: "", verif: "", note: "" };

test("rascunho: as notas contam, ida e volta, e seguem a pergunta", () => {
  const d = montarRascunho(CAMPOS, IT, ["", ""], [null, null], "2026-11-06T10:00:00Z", ["", "caixas no chão"]);
  assert.ok(d, "só uma nota já é motivo para guardar o rascunho");
  const r = plain(lerRascunho(JSON.parse(JSON.stringify(d)), [IT[1], IT[0]]));
  assert.deepStrictEqual(r.notas, ["caixas no chão", ""]);
  assert.strictEqual(montarRascunho(CAMPOS, IT, ["", ""], [null, null], "x"), null, "sem notas nem respostas, nada");
  const antigo = Object.assign({}, d); delete antigo.notas;
  assert.deepStrictEqual(plain(lerRascunho(antigo, IT)).notas, ["", ""], "um rascunho de 3.13 lê-se sem notas");
});

test("importação: as notas viajam, limpas e alinhadas com as respostas", () => {
  const a = plain(sanitizeAudit({ id: 1, service: "S", date: "2026-01-01", scores: [0, 2],
    notas: ["  caixas‮ no chão ", "x".repeat(500), "a mais"] }));
  assert.deepStrictEqual(a.notas.map(n => n.length), ["caixas no chão".length, 300]);
  assert.strictEqual(a.notas[0], "caixas no chão");
  assert.ok(!("notas" in plain(sanitizeAudit({ id: 1, service: "S", date: "2026-01-01", scores: [2] }))));
});

test("Excel: a nota na folha das respostas", () => {
  const its = [{ p: 0, n: 1, t: "T", c: "C", tp: "count", r: "U" }];
  const { respostas } = plain(linhasExcel([{ id: 1, service: "S", date: "2026-01-01", scores: [0], items: its, notas: ["vi isto"] }]));
  assert.strictEqual(respostas[0]["Nota"], "vi isto");
});
