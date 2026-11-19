/* Testes da lista agrupada das Acções (4.12.0): a faixa do prazo e os grupos
   por prazo, responsável e serviço. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["faixaPrazoAcao", "agruparAcoes", "diasEntre", "somarDias", "dataCurta"], ["FAIXAS_PRAZO"]);
const { faixaPrazoAcao, agruparAcoes } = ctx;
const HOJE = "2026-11-19";
const plain = o => JSON.parse(JSON.stringify(o));
const x = (service, r, estado, prazo) => ({ service, estado, acao: { r, prazo: prazo || "" } });

test("faixa do prazo: atraso, 7 dias, 30 dias, mais tarde, sem prazo, feita", () => {
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "atrasada", "2026-11-01"), HOJE), "atrasada");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "aberta", "2026-11-19"), HOJE), "semana");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "aberta", "2026-11-26"), HOJE), "semana");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "aberta", "2026-11-27"), HOJE), "mes");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "aberta", "2026-12-19"), HOJE), "mes");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "aberta", "2026-12-20"), HOJE), "tarde");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "aberta", ""), HOJE), "sem");
  assert.strictEqual(faixaPrazoAcao(x("A", "U", "feita", "2026-11-01"), HOJE), "feita");
});

test("por prazo: os grupos pela ordem das faixas, e quais abrem", () => {
  const l = [x("A", "U", "feita"), x("B", "M", "aberta", "2027-06-01"), x("C", "U", "atrasada", "2026-11-01"),
    x("D", "U", "aberta", ""), x("E", "M", "aberta", "2026-11-20")];
  const g = agruparAcoes(l, "prazo", HOJE);
  assert.deepStrictEqual(plain(g.map(y => y.chave)), ["atrasada", "semana", "tarde", "sem", "feita"]);
  assert.deepStrictEqual(plain(g.map(y => y.titulo)), ["Em atraso", "Esta semana", "Mais tarde", "Sem prazo", "Feitas"]);
  assert.deepStrictEqual(plain(g.map((y, i) => y.abertoPorOmissao(i))), [true, true, false, true, false]);
  assert.strictEqual(g[1].sub, "até 26/11/26");
});

test("por responsável e por serviço: primeiro os com mais em atraso, depois os maiores", () => {
  const l = [x("A", "U", "aberta", "2027-01-01"), x("A", "U", "aberta", "2027-01-02"), x("B", "M", "atrasada", "2026-11-01"),
    x("C", "P", "aberta", "")];
  const nomes = { U: "Utilizadores", M: "Manutenção", P: "Picking" };
  const r = agruparAcoes(l, "resp", HOJE, k => nomes[k]);
  assert.deepStrictEqual(plain(r.map(y => y.titulo)), ["Manutenção", "Utilizadores", "Picking"]);
  assert.deepStrictEqual(plain(r.map(y => y.atrasadas)), [1, 0, 0]);
  assert.deepStrictEqual(plain(r.map((y, i) => y.abertoPorOmissao(i))), [true, true, false]);
  const s = agruparAcoes(l, "svc", HOJE);
  assert.deepStrictEqual(plain(s.map(y => y.titulo)), ["B", "A", "C"]);
  assert.strictEqual(s[1].itens.length, 2);
});
