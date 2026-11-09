/* Testes de «auditar no telemóvel, finalizar no PC» (3.25.0): a fusão que
   actualiza pela data de alteração, as acções fechadas no terreno, o ficheiro
   de auditoria e os campos novos na porta de entrada (sanitizeAudit). */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["maisRecente", "acoesFeitasDe", "sanitizeFeitas", "aplicarAcoesFeitas", "tocar", "planoFusao",
   "payloadTransferencia", "idDaChave", "sanitizeAudit", "sanitizeEnvios", "sanitizeAcoes", "recsOf", "recTexto",
   "normItem", "classify", "fixedKey", "textoEnviada", "dataLocal", "dataCurta"],
  ["MAX_FEITAS", "MAX_ACOES", "porFinalizar", "ITEMS", "LBL"]);
const { maisRecente, acoesFeitasDe, sanitizeFeitas, aplicarAcoesFeitas, planoFusao, payloadTransferencia,
  sanitizeAudit, sanitizeEnvios, textoEnviada, porFinalizar } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

const ac = (id, texto, estado, feitaEm) => ({ id, r: "U", texto, prazo: "", estado: estado || "aberta", feitaEm: feitaEm || "", item: null });
const aud = (id, service, date, extra) => Object.assign({ id, service, date, scores: [2] }, extra || {});

test("maisRecente: pela data de alteração; sem ela, a mais antiga; iguais não contam", () => {
  assert.strictEqual(maisRecente({ alterada: "2026-11-09T10:00:00.000Z" }, { alterada: "2026-11-09T09:00:00.000Z" }), true);
  assert.strictEqual(maisRecente({ alterada: "2026-11-09T09:00:00.000Z" }, { alterada: "2026-11-09T10:00:00.000Z" }), false);
  assert.strictEqual(maisRecente({ alterada: "2026-11-09T09:00:00.000Z" }, {}), true, "sem alterada (antes de 3.25.0) é a mais antiga");
  assert.strictEqual(maisRecente({}, {}), false);
  assert.strictEqual(maisRecente({ alterada: "x" }, { alterada: "x" }), false, "iguais");
});

test("planoFusao: nova, actualizar (do ficheiro mais recente) ou igual", () => {
  const casa = [aud(1, "A", "2026-11-01", { alterada: "2026-11-01T10:00:00.000Z" }),
    aud(2, "B", "2026-11-02", { alterada: "2026-11-05T10:00:00.000Z" })];
  const p = planoFusao(casa, [
    aud(1, "A", "2026-11-01", { alterada: "2026-11-02T10:00:00.000Z" }),   // mais recente
    aud(9, "B", "2026-11-02", { alterada: "2026-11-03T10:00:00.000Z" }),   // mesmo serviço e data, mais antiga
    aud(3, "C", "2026-11-03"),                                            // nova
    aud(4, "C", "2026-11-03")                                             // repetida no ficheiro
  ]);
  assert.deepStrictEqual(p.map(x => x.accao), ["actualizar", "igual", "nova", "igual"]);
  assert.strictEqual(p[0].local, casa[0]);
  assert.strictEqual(p[1].local, casa[1], "pelo serviço e data, quando o id é outro");
  assert.strictEqual(p[2].local, null);
});

test("acoesFeitasDe: as feitas das outras auditorias ao mesmo serviço", () => {
  const a = aud(3, "A", "2026-11-09", { acoes: [ac(1, "nesta", "feita", "2026-11-09")] });
  const lista = [aud(1, "A", "2026-10-01", { acoes: [ac(1, "Arrumar", "feita", "2026-11-09"), ac(2, "Limpar")] }),
    aud(2, "B", "2026-10-02", { acoes: [ac(1, "Outro serviço", "feita", "2026-11-09")] }), a];
  assert.deepStrictEqual(plain(acoesFeitasDe(lista, a)),
    [{ service: "A", date: "2026-10-01", id: 1, texto: "Arrumar", feitaEm: "2026-11-09" }]);
});

test("sanitizeFeitas: só entradas completas, limpas", () => {
  const r = plain(sanitizeFeitas([{ service: "A", date: "2026-10-01", id: 1, texto: "Arrumar", feitaEm: "ontem" },
    { service: "", date: "2026-10-01", id: 1, texto: "x" }, { service: "A", date: "01/10/2026", id: 1, texto: "x" },
    { service: "A", date: "2026-10-01", id: 1.5, texto: "x" }, { service: "A", date: "2026-10-01", id: 2, texto: "" },
    null, [1], "lixo"]));
  assert.deepStrictEqual(r, [{ service: "A", date: "2026-10-01", id: 1, texto: "Arrumar", feitaEm: "" }]);
  assert.deepStrictEqual(plain(sanitizeFeitas("lixo")), []);
  assert.strictEqual(sanitizeFeitas(new Array(2000).fill({ service: "A", date: "2026-10-01", id: 1, texto: "x" })).length, ctx.MAX_FEITAS);
});

test("aplicarAcoesFeitas: fecha as abertas que batem (auditoria, id e texto) e marca a auditoria", () => {
  const lista = [aud(1, "A", "2026-10-01", { acoes: [ac(1, "Arrumar"), ac(2, "Limpar"), ac(3, "Já feita", "feita", "2026-10-05")] })];
  const n = aplicarAcoesFeitas(lista, [
    { service: "A", date: "2026-10-01", id: 1, texto: "Arrumar", feitaEm: "2026-11-09" },
    { service: "A", date: "2026-10-01", id: 2, texto: "Outro texto", feitaEm: "2026-11-09" },   // texto não bate
    { service: "A", date: "2026-10-01", id: 3, texto: "Já feita", feitaEm: "2026-11-09" },      // já feita
    { service: "A", date: "2026-10-02", id: 1, texto: "Arrumar", feitaEm: "2026-11-09" }]);     // outra auditoria
  assert.strictEqual(n, 1);
  assert.deepStrictEqual(lista[0].acoes.map(x => [x.estado, x.feitaEm]),
    [["feita", "2026-11-09"], ["aberta", ""], ["feita", "2026-10-05"]]);
  assert.ok(lista[0].alterada, "a auditoria fica marcada como alterada");
});

test("ficheiro de auditoria: só ela, com o envio registado, as suas fotos e as acções feitas", () => {
  const a = aud(5, "A", "2026-11-09", { fase: "terreno" });
  const lista = [aud(1, "A", "2026-10-01", { acoes: [ac(1, "Arrumar", "feita", "2026-11-09")] }), a];
  const fotos = [{ k: "5#2", v: "data:image/jpeg;base64,AA" }, { k: "5|U", v: "data:image/jpeg;base64,AB" },
    { k: "1#1", v: "data:image/jpeg;base64,AC" }];
  const p = plain(payloadTransferencia(a, lista, fotos, { version: "3.25.0", people: ["Ana"], resps: [] }, "2026-11-09T10:00:00.000Z"));
  assert.strictEqual(p.tipo, "auditoria");
  assert.strictEqual(p.app, "auditoria5s");
  assert.strictEqual(p.audits.length, 1);
  assert.strictEqual(p.audits[0].envios.pc, "2026-11-09T10:00:00.000Z");
  assert.strictEqual(a.envios, undefined, "a auditoria em memória não muda");
  assert.deepStrictEqual(p.fotos.map(f => f.k), ["5#2", "5|U"]);
  assert.deepStrictEqual(p.services, ["A"]);
  assert.strictEqual(p.acoesFeitas.length, 1);
});

test("sanitizeAudit: fase, finalizada e alterada; o resto cai", () => {
  const base = { id: 1, service: "S", date: "2026-01-01", scores: [2] };
  const a = plain(sanitizeAudit(Object.assign({}, base, { fase: "terreno", alterada: "2026-11-09T10:00:00.000Z",
    finalizada: "2026-11-09T11:00:00.000Z", envios: { pc: "2026-11-09T10:00:00.000Z" } })));
  assert.strictEqual(a.fase, "terreno");
  assert.strictEqual(a.alterada, "2026-11-09T10:00:00.000Z");
  assert.strictEqual(a.finalizada, "2026-11-09T11:00:00.000Z");
  assert.strictEqual(a.envios.pc, "2026-11-09T10:00:00.000Z");
  const b = plain(sanitizeAudit(Object.assign({}, base, { fase: "outra", alterada: "ontem", finalizada: 5 })));
  assert.ok(!("fase" in b) && !("alterada" in b) && !("finalizada" in b), JSON.stringify(b));
  assert.deepStrictEqual(plain(sanitizeEnvios({ pc: "2026-11-09T10:00:00.000Z" })), { pc: "2026-11-09T10:00:00.000Z" });
});

test("Histórico: por finalizar, e se já foi enviada para o PC", () => {
  assert.strictEqual(porFinalizar({ fase: "terreno" }), true);
  assert.strictEqual(porFinalizar({}), false, "as de antes de 3.25.0 contam como finalizadas");
  assert.match(textoEnviada({ fase: "terreno" }), /por finalizar<\/span>$/);
  assert.match(textoEnviada({ fase: "terreno", envios: { pc: "2026-11-09T10:00:00.000Z" } }),
    /por finalizar \(enviada para o PC a \d\d\/\d\d\/\d\d\)/);
  assert.match(textoEnviada({}), /por enviar/);
});
