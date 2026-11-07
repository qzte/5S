/* Testes do separador Acções (3.21.0): `listaAcoes` (filtros e ordem) e
   `resumoAcoes` (contagens do resumo e do número no separador). */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["listaAcoes", "resumoAcoes", "estadoAcao", "somarDias"], ["ORDEM_ACAO"]);
const { listaAcoes, resumoAcoes } = ctx;
const HOJE = "2026-11-07";
const ac = (id, r, estado, prazo, feitaEm) => ({ id, r, texto: "A" + id, estado, prazo: prazo || "", feitaEm: feitaEm || "", item: null });
const L = [
  { id: 1, service: "Loja A", date: "2026-10-01", acoes: [
    ac(1, "U", "aberta", "2026-11-01"),                 /* atrasada */
    ac(2, "M", "aberta", "2026-11-20"),                 /* aberta */
    ac(3, "U", "feita", "2026-10-10", "2026-10-09")] }, /* feita há 29 dias */
  { id: 2, service: "Loja B", date: "2026-10-15", acoes: [
    ac(1, "U", "aberta", ""),                           /* aberta, sem prazo */
    ac(2, "M", "aberta", "2026-10-20"),                 /* atrasada */
    ac(3, "M", "feita", "", "2026-11-05")] },
  { id: 3, service: "Loja C", date: "2026-10-20" },     /* sem acções */
  null,
];
const ids = l => [...l].map(x => x.auditId + ":" + x.acao.id);

test("por omissão, as em aberto: atrasadas primeiro, depois pelo prazo, sem prazo no fim", () => {
  assert.deepStrictEqual(ids(listaAcoes(L, {}, HOJE)), ["2:2", "1:1", "1:2", "2:1"]);
  assert.deepStrictEqual(ids(listaAcoes(L, undefined, HOJE)), ["2:2", "1:1", "1:2", "2:1"]);
});

test("filtros por estado, responsável e serviço", () => {
  assert.deepStrictEqual(ids(listaAcoes(L, { estado: "atrasadas" }, HOJE)), ["2:2", "1:1"]);
  assert.deepStrictEqual(ids(listaAcoes(L, { estado: "feitas" }, HOJE)), ["2:3", "1:3"], "as feitas, da mais recente");
  assert.strictEqual(listaAcoes(L, { estado: "todas" }, HOJE).length, 6);
  assert.deepStrictEqual(ids(listaAcoes(L, { r: "M" }, HOJE)), ["2:2", "1:2"]);
  assert.deepStrictEqual(ids(listaAcoes(L, { svc: "Loja A", estado: "todas" }, HOJE)), ["1:1", "1:2", "1:3"]);
  assert.deepStrictEqual(ids(listaAcoes(L, { svc: "Loja C" }, HOJE)), []);
});

test("cada linha traz o serviço, a data da auditoria e o estado", () => {
  const [x] = listaAcoes(L, { estado: "atrasadas", svc: "Loja B" }, HOJE);
  assert.strictEqual(x.service, "Loja B");
  assert.strictEqual(x.date, "2026-10-15");
  assert.strictEqual(x.estado, "atrasada");
  assert.strictEqual(x.acao.texto, "A2");
});

test("resumo: em aberto, em atraso e feitas nos últimos 30 dias", () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(resumoAcoes(L, HOJE))), { abertas: 4, atrasadas: 2, feitas30: 2 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(resumoAcoes(L, "2026-11-30"))), { abertas: 4, atrasadas: 3, feitas30: 1 },
    "com o tempo, a do dia 20 passa a atrasada e a feita a 09/10 sai dos 30 dias");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(resumoAcoes([], HOJE))), { abertas: 0, atrasadas: 0, feitas30: 0 });
});
