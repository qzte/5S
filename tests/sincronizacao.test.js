/* Testes da 3.26.0: o email de cada serviço, as fotos que já estão no PC e o
   dispositivo que finalizou cada auditoria. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["lerEmails", "sanitizeEmails", "emailDe", "enderecosMailto", "fotosNoPC",
   "sanitizeAudit", "sanitizeEnvios", "sanitizeAcoes", "recsOf", "recTexto", "normItem", "classify", "fixedKey"],
  ["EMAILS_MAX", "RE_EMAIL", "porFinalizar", "MAX_ACOES", "ITEMS", "LBL"]);
const { lerEmails, sanitizeEmails, emailDe, enderecosMailto, fotosNoPC, sanitizeAudit } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

test("lerEmails: separa por vírgula, ponto e vírgula ou espaço; sem repetidos; diz os maus", () => {
  assert.deepStrictEqual(plain(lerEmails(" loja1@kaizen.pt, gerente@kaizen.pt;loja1@kaizen.pt ")),
    { ok: "loja1@kaizen.pt; gerente@kaizen.pt", maus: [] });
  assert.deepStrictEqual(plain(lerEmails("loja1@kaizen.pt, nao-e-email, a@b, x@y.pt")),
    { ok: "loja1@kaizen.pt; x@y.pt", maus: ["nao-e-email", "a@b"] });
  assert.deepStrictEqual(plain(lerEmails("")), { ok: "", maus: [] });
  assert.deepStrictEqual(plain(lerEmails(null)), { ok: "", maus: [] });
  const muitos = lerEmails("a1@x.pt a2@x.pt a3@x.pt a4@x.pt a5@x.pt a6@x.pt");
  assert.strictEqual(muitos.ok.split("; ").length, ctx.EMAILS_MAX);
  assert.deepStrictEqual(plain(muitos.maus), ["a6@x.pt"], "o que passa do máximo fica de fora, e diz-se");
});

test("lerEmails: nada que mexa com o mailto ou com o HTML", () => {
  for (const x of ['a"b@x.pt', "a<b>@x.pt", "a@x.pt?cc=z@y.pt", "a@x.pt&bcc=z@y.pt", "mailto:a@x.pt", "a(b)@x.pt"])
    assert.strictEqual(lerEmails(x).ok.includes("?") || lerEmails(x).ok.includes("<") || lerEmails(x).ok.includes('"') ||
      lerEmails(x).ok.includes("("), false, x);
  assert.strictEqual(lerEmails("a@x.pt?cc=z@y.pt").ok, "", "um ? não é aceite (?cc= no mailto)");
  assert.strictEqual(lerEmails("a@x.pt?subject=oi").ok, "", "nem no domínio");
  assert.strictEqual(lerEmails("nome.apelido+5s@loja-1.kaizen.pt").ok, "nome.apelido+5s@loja-1.kaizen.pt");
});

test("sanitizeEmails: pares {s, e} limpos; um por serviço; sem endereço válido, fora", () => {
  assert.deepStrictEqual(plain(sanitizeEmails([{ s: "Loja A", e: "a@x.pt, lixo" }, { s: "Loja A", e: "b@x.pt" },
    { s: "Loja B", e: "lixo" }, { s: "", e: "c@x.pt" }, null, [1], "x"])), [{ s: "Loja A", e: "a@x.pt" }]);
  assert.deepStrictEqual(plain(sanitizeEmails({ "Loja A": "a@x.pt" })), [], "um objecto não é uma lista");
  assert.strictEqual(emailDe([{ s: "Loja A", e: "a@x.pt" }], "Loja A"), "a@x.pt");
  assert.strictEqual(emailDe([{ s: "Loja A", e: "a@x.pt" }], "Loja B"), "");
});

test("enderecosMailto: separados por vírgula, cada um codificado", () => {
  assert.strictEqual(enderecosMailto("a@x.pt; b.c@y.pt"), "a%40x.pt,b.c%40y.pt");
  assert.strictEqual(enderecosMailto(""), "");
});

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
