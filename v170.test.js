/* Testes v1.7.0
   Duas funcionalidades novas:
     A) Recomendações por responsável (texto guardado, foto efémera) — folha 3.
     B) Histórico das últimas 6 auditorias ao serviço, em barras — folha 1.
   Executar: node tests/v170.test.js
*/
const assert = require("assert");
const { HTML, extractFn, buildContext } = require("./harness");

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log("  PASS  " + name); pass++; }
  catch (e) { console.log("  FAIL  " + name + "\n        " + e.message); fail++; }
}

console.log("\n--- A) Recomendações por responsável ---");

test("REC_KEYS existe e tem as 4 responsabilidades da app (U, M, R, U+R)", () => {
  assert.ok(/const REC_KEYS\s*=/.test(HTML), "REC_KEYS não está definido no index.html");
  const ctx = buildContext([], []);
  /* O array vem de outro realm (vm), logo o prototype difere: comparar por valor. */
  assert.strictEqual(JSON.stringify(ctx.REC_KEYS), JSON.stringify(["U", "M", "R", "U+R"]));
});

test("recsOf() devolve as 4 chaves vazias numa auditoria sem campo recs", () => {
  const ctx = buildContext(["recsOf"], ["REC_KEYS"]);
  assert.ok(ctx.recsOf, "recsOf não está definido");
  const r = ctx.recsOf({ id: 1, scores: [] });
  assert.deepStrictEqual(Object.keys(r).sort(), ["M", "R", "U", "U+R"]);
  assert.strictEqual(r["U"], "");
  assert.strictEqual(r["U+R"], "");
});

test("recsOf() preserva o texto guardado e ignora chaves desconhecidas", () => {
  const ctx = buildContext(["recsOf"], ["REC_KEYS"]);
  const r = ctx.recsOf({ recs: { "U": "Rever rotulagem", "XX": "lixo" } });
  assert.strictEqual(r["U"], "Rever rotulagem");
  assert.strictEqual(r["M"], "");
  assert.strictEqual(r["XX"], undefined, "chave desconhecida não deve passar");
});

test("hasRecs() é falso quando todos os textos estão vazios", () => {
  const ctx = buildContext(["recsOf", "hasRecs"], ["REC_KEYS"]);
  assert.ok(ctx.hasRecs, "hasRecs não está definido");
  assert.strictEqual(ctx.hasRecs({ recs: { "U": "", "M": "   " } }), false);
  assert.strictEqual(ctx.hasRecs({}), false);
});

test("hasRecs() é verdadeiro assim que um texto tem conteúdo", () => {
  const ctx = buildContext(["recsOf", "hasRecs"], ["REC_KEYS"]);
  assert.strictEqual(ctx.hasRecs({ recs: { "M": "Substituir prateleira" } }), true);
});

console.log("\n--- B) Histórico do serviço (últimas 6) ---");

test("svcHistory() devolve apenas auditorias do mesmo serviço", () => {
  const ctx = buildContext(["svcHistory", "pctOf", "total"], ["WEIGHTS", "W_MAX", "wOf"]);
  assert.ok(ctx.svcHistory, "svcHistory não está definido");
  const A = { id: 1, service: "UCIP", date: "2026-01-01", scores: [2, 2] };
  const B = { id: 2, service: "Outro", date: "2026-02-01", scores: [0, 0] };
  const h = ctx.svcHistory(A, [A, B]);
  assert.strictEqual(h.length, 1);
  assert.strictEqual(h[0].date, "2026-01-01");
});

test("svcHistory() limita a 6 e devolve as MAIS RECENTES por ordem crescente", () => {
  const ctx = buildContext(["svcHistory", "pctOf", "total"], ["WEIGHTS", "W_MAX", "wOf"]);
  const all = [];
  for (let i = 1; i <= 9; i++) {
    all.push({ id: i, service: "UCIP", date: "2026-01-0" + i, scores: [2, 2] });
  }
  const h = ctx.svcHistory(all[8], all);
  assert.strictEqual(h.length, 6, "deve cortar às 6");
  assert.strictEqual(h[0].date, "2026-01-04", "a mais antiga das 6 mantidas");
  assert.strictEqual(h[5].date, "2026-01-09", "a mais recente fica no fim");
});

test("svcHistory() inclui a própria auditoria e calcula a percentagem", () => {
  const ctx = buildContext(["svcHistory", "pctOf", "total"], ["WEIGHTS", "W_MAX", "wOf"]);
  const A = { id: 1, service: "UCIP", date: "2026-03-01", scores: [2, 2] };
  const h = ctx.svcHistory(A, [A]);
  assert.strictEqual(h.length, 1);
  assert.strictEqual(h[0].pct, 100, "dois itens Excelente = 100%");
});

test("barsSVG() devolve string vazia sem dados (não desenha bloco vazio)", () => {
  const ctx = buildContext(["barsSVG"], []);
  assert.ok(ctx.barsSVG, "barsSVG não está definido");
  assert.strictEqual(ctx.barsSVG([]), "");
});

test("barsSVG() desenha uma barra por auditoria com a data curta dd/mm", () => {
  const ctx = buildContext(["barsSVG"], []);
  const svg = ctx.barsSVG([
    { date: "2026-01-04", pct: 50 },
    { date: "2026-02-11", pct: 80 }
  ]);
  assert.ok(/^<svg/.test(svg), "deve devolver SVG");
  assert.strictEqual((svg.match(/<rect/g) || []).length >= 2, true, "uma barra por auditoria");
  assert.ok(svg.includes("04/01"), "data curta dd/mm em falta");
  assert.ok(svg.includes("11/02"), "data curta dd/mm em falta");
  assert.ok(svg.includes("80%"), "percentagem em falta");
});

console.log("\n--- B2) Importação preserva as recomendações ---");

test("sanitizeAudit() preserva o texto das recomendações importadas", () => {
  const ctx = buildContext(["sanitizeAudit", "recsOf"], ["PILLARS", "RESP"]);
  assert.ok(ctx.sanitizeAudit, "sanitizeAudit não está definido");
  const out = ctx.sanitizeAudit({
    service: "UCIP", date: "2026-05-05", scores: [2, 1],
    recs: { "U": "Rever picking", "M": "Substituir calha" }
  });
  assert.ok(out, "auditoria válida foi rejeitada");
  assert.ok(out.recs, "campo recs perdido na importação");
  assert.strictEqual(out.recs["U"], "Rever picking");
  assert.strictEqual(out.recs["M"], "Substituir calha");
});

test("sanitizeAudit() descarta chaves de recs desconhecidas", () => {
  const ctx = buildContext(["sanitizeAudit", "recsOf"], ["PILLARS", "RESP"]);
  const out = ctx.sanitizeAudit({
    service: "UCIP", date: "2026-05-05", scores: [2],
    recs: { "U": "ok", "HACK": "<script>" }
  });
  assert.strictEqual(out.recs["HACK"], undefined, "chave arbitrária passou na importação");
});

console.log("\n--- C) Integração / versão ---");

test("APP_VERSION do index.html é 1.7.0", () => {
  assert.ok(/const APP_VERSION\s*=\s*"1\.7\.0"/.test(HTML), "index.html não está em 1.7.0");
});

test("sw.js e manifest.json estão sincronizados em 1.7.0", () => {
  const fs = require("fs"), p = require("path");
  const sw = fs.readFileSync(p.join(__dirname, "..", "sw.js"), "utf8");
  const mf = JSON.parse(fs.readFileSync(p.join(__dirname, "..", "manifest.json"), "utf8"));
  assert.ok(/APP_VERSION\s*=\s*"1\.7\.0"/.test(sw), "sw.js desactualizado");
  assert.strictEqual(mf.version, "1.7.0", "manifest.version desactualizado");
  assert.ok(/1\.7\.0/.test(mf.description), "manifest.description desactualizada");
});

test("openReport chama recsHTML (página 3) e svcHistory (folha 1)", () => {
  const fn = extractFn(HTML, "openReport");
  assert.ok(fn, "openReport não encontrado");
  assert.ok(/recsHTML\(/.test(fn), "página 3 não é gerada pelo relatório");
  assert.ok(/svcHistory\(/.test(fn), "histórico do serviço em falta na folha 1");
  const rec = extractFn(HTML, "recsHTML");
  assert.ok(/page-3/.test(rec), "recsHTML não produz o contentor .page-3");
});

test("o texto das recomendações é escapado com esc() no render", () => {
  const fn = extractFn(HTML, "recsHTML") || "";
  assert.ok(fn, "recsHTML não encontrado");
  assert.ok(/esc\(/.test(fn), "falta escape de HTML no texto das recomendações");
});

console.log("\n" + pass + " passaram, " + fail + " falharam\n");
process.exit(fail ? 1 : 0);
