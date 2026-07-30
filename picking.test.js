/* Testes do responsável "Picking" (v3.1.0).
   Escritos ANTES da implementação (TDD): devem falhar em v3.0.0. */
const test = require("node:test");
const assert = require("node:assert");
const vm = require("vm");
const { HTML, extractBlock, buildContext } = require("./harness.js");

function defaultItems() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(extractBlock(HTML, "DEFAULT_ITEMS") +
    "\nglobalThis.OUT=DEFAULT_ITEMS;", sandbox);
  return sandbox.OUT;
}

/* Auditoria sintética: todos os itens a Excelente (score 2), excepto os
   indicados em `maus` (nº da pergunta), que ficam a Mau (score 0). */
function auditoria(items, maus) {
  return {
    id: 1, service: "S", date: "2026-01-01",
    items: items.map(x => Object.assign({}, x)),
    scores: items.map(it => (maus || []).includes(it.n) ? 0 : 2)
  };
}

test("RESP tem cinco responsáveis, incluindo Picking", () => {
  const { RESP } = buildContext([], ["RESP"]);
  assert.strictEqual(Object.keys(RESP).length, 5);
  assert.strictEqual(RESP.P, "Picking");
  assert.deepStrictEqual(Object.values(RESP), [
    "Utilizadores", "Manutenção", "Reposição", "Utilizador e Repositor", "Picking"
  ]);
});

test("a pergunta 8 tem o responsável Picking", () => {
  const it8 = defaultItems().find(x => x.n === 8);
  assert.ok(it8, "pergunta 8 não encontrada");
  assert.strictEqual(it8.r, "P");
});

test("nenhuma outra pergunta passa a Picking", () => {
  const picking = defaultItems().filter(x => x.r === "P").map(x => x.n);
  assert.deepStrictEqual([...picking], [8]);
});

test("byResp devolve cinco eixos e isola a pergunta 8 em Picking", () => {
  const ctx = buildContext(["byResp"], ["RESP", "PILLARS", "itemsOf", "ITEMS"]);
  const items = defaultItems();
  const linhas = ctx.byResp(auditoria(items, [8]));
  assert.strictEqual(linhas.length, 5);
  const p = linhas.find(l => l.name === "Picking");
  assert.strictEqual(p.n, 1);
  assert.strictEqual(p.pct, 0, "único item de Picking está Mau → 0%");
  const r = linhas.find(l => l.name === "Reposição");
  assert.strictEqual(r.n, 2, "Reposição fica com as perguntas 7 e 18");
  assert.strictEqual(r.pct, 100);
});

test("recsOf devolve as cinco chaves de recomendação", () => {
  const ctx = buildContext(["recsOf"], ["RESP", "REC_KEYS"]);
  assert.deepStrictEqual([...ctx.REC_KEYS], ["U", "M", "R", "U+R", "P"]);
  assert.deepStrictEqual(Object.keys(ctx.recsOf({})), ["U", "M", "R", "U+R", "P"]);
});

test("medByResp ignora auditorias sem itens do responsável", () => {
  const ctx = buildContext(["medByResp", "byResp", "avg"], ["RESP", "PILLARS", "itemsOf", "ITEMS"]);
  const items = defaultItems();
  /* Auditoria antiga: pergunta 8 ainda pertence a Reposição. */
  const antigos = items.map(x => x.n === 8 ? Object.assign({}, x, { r: "R" }) : x);
  const nova = auditoria(items, [8]);          /* Picking = 0% */
  const velha = auditoria(antigos, []);        /* sem Picking */
  const med = ctx.medByResp([nova, velha]);
  assert.strictEqual(med.length, 5);
  const p = med.find(l => l.name === "Picking");
  assert.strictEqual(p.pct, 0, "média só sobre a auditoria que tem Picking");

  /* Se a única auditoria com Picking estiver a 100%, a antiga não a dilui. */
  const med2 = ctx.medByResp([auditoria(items, []), velha]);
  assert.strictEqual(med2.find(l => l.name === "Picking").pct, 100);
});

test("respAxes mantém os cinco eixos numa auditoria nova", () => {
  const ctx = buildContext(["respAxes", "byResp"], ["RESP", "itemsOf", "ITEMS"]);
  assert.strictEqual(ctx.respAxes(auditoria(defaultItems(), [])).length, 5);
});

test("respAxes descarta eixos sem itens (auditoria anterior a v3.1.0)", () => {
  const ctx = buildContext(["respAxes", "byResp"], ["RESP", "itemsOf", "ITEMS"]);
  /* Snapshot antigo: a pergunta 8 continua atribuída a Reposição. */
  const antigos = defaultItems().map(x =>
    x.n === 8 ? Object.assign({}, x, { r: "R" }) : x);
  const eixos = ctx.respAxes(auditoria(antigos, []));
  assert.strictEqual(eixos.length, 4);
  assert.ok(!eixos.some(e => e.name === "Picking"));
});

test("plItens singulariza a contagem (Picking tem exactamente 1 item)", () => {
  const ctx = buildContext(["plItens"], []);
  assert.strictEqual(ctx.plItens(1), "1 item");
  assert.strictEqual(ctx.plItens(2), "2 itens");
  assert.strictEqual(ctx.plItens(0), "0 itens");
});
