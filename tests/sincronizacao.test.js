/* Testes da 3.26.0: as fotos que já estão no PC e o dispositivo que finalizou
   cada auditoria. (O email de cada serviço saiu em 4.0.0.) */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["fotosNoPC",
   "sanitizeAudit", "sanitizeEnvios", "sanitizeAcoes", "recsOf", "recTexto", "normItem", "classify", "fixedKey"],
  ["porFinalizar", "MAX_ACOES", "ITEMS", "LBL"]);
const { fotosNoPC, sanitizeAudit } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

test("fotosNoPC: enviadas daqui e finalizadas noutro dispositivo", () => {
  const pc = "2026-11-09T10:00:00.000Z";
  const a = (id, extra) => Object.assign({ id, service: "S", date: "2026-11-0" + id }, extra);
  const lista = [
    a(1, { envios: { pc }, finalizada: pc, finalizadaPor: "pc0000aa" }),       // sim
    a(2, { envios: { pc }, finalizada: pc, finalizadaPor: "eu0000aa" }),       // finalizada aqui
    a(3, { finalizada: pc, finalizadaPor: "pc0000aa" }),                       // não foi enviada daqui
    a(4, { envios: { pc }, fase: "terreno" }),                                // por finalizar
    a(5, { envios: { pc }, finalizada: pc })                                  // sem dispositivo: não se sabe
  ];
  assert.deepStrictEqual(fotosNoPC(lista, "eu0000aa").map(x => x.id), [1]);
});

test("sanitizeAudit: finalizadaPor só com a forma do identificador", () => {
  const base = { id: 1, service: "S", date: "2026-01-01", scores: [2] };
  assert.strictEqual(sanitizeAudit(Object.assign({}, base, { finalizadaPor: "a1b2c3d4e5f60718" })).finalizadaPor, "a1b2c3d4e5f60718");
  for (const v of ["<x>", "ABC123", "abc", 5, "a".repeat(40)])
    assert.strictEqual(sanitizeAudit(Object.assign({}, base, { finalizadaPor: v })).finalizadaPor, undefined, String(v));
});

/* 3.27.0: «Enviar para o PC» conta como cópia de segurança quando tudo o que
   mudou neste dispositivo desde a última cópia já está no PC. */
test("tudoNoPC: só quando nada do que mudou ficou por enviar", () => {
  const { tudoNoPC } = buildContext(["tudoNoPC"], ["porFinalizar"]);
  const T = h => "2026-11-09T" + String(h).padStart(2, "0") + ":00:00.000Z";
  const enviada = { id: 1, alterada: T(10), fase: "terreno", envios: { pc: T(11) } };
  assert.strictEqual(tudoNoPC([enviada], undefined, "eu"), true, "enviada depois da última alteração");
  assert.strictEqual(tudoNoPC([enviada, { id: 2, alterada: T(12), fase: "terreno" }], undefined, "eu"), false,
    "outra auditoria por enviar: o lembrete continua");
  assert.strictEqual(tudoNoPC([{ id: 3, alterada: T(12), envios: { pc: T(11) } }], undefined, "eu"), false,
    "alterada depois de enviada");
  assert.strictEqual(tudoNoPC([{ id: 4, alterada: T(8) }], T(9), "eu"), true, "sem alterações desde a última cópia");
  assert.strictEqual(tudoNoPC([{ id: 5, alterada: T(12) }], T(9), "eu", new Set([5])), true,
    "as acções fechadas nela foram agora com o ficheiro");
  assert.strictEqual(tudoNoPC([{ id: 6, alterada: T(12), finalizada: T(12), finalizadaPor: "pc00aa" }], T(9), "eu00aa"), true,
    "veio do PC (finalizada noutro dispositivo)");
  assert.strictEqual(tudoNoPC([{ id: 7, alterada: T(12), finalizada: T(12), finalizadaPor: "eu00aa" }], T(9), "eu00aa"), false,
    "finalizada aqui e nunca enviada");
  assert.strictEqual(tudoNoPC([{ id: 8 }], undefined, "eu"), false, "anterior a 3.25.0 e nunca houve cópia");
  assert.strictEqual(tudoNoPC([{ id: 8 }], T(9), "eu"), true, "anterior a 3.25.0, já com uma cópia");
});
