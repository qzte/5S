/* Testes do fluxo depois da auditoria (3.23.0): o resumo que vai no email ou
   no Teams, a validação do registo de envios e o estado dos três passos. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["resumoEnvio", "sanitizeEnvios", "estadoPassos", "textoEnviada", "dataLocal", "tituloPdf", "nomePdf",
   "ordemCron", "anteriorDe", "colTotals", "byPillar", "byResp", "acoesPendentes", "estadoAcao", "dataCurta", "esc", "pctOf"],
  ["ITEMS", "itemsOf", "LBL", "badge", "total", "WEIGHTS", "W_MAX", "PILLARS"]);
const { resumoEnvio, sanitizeEnvios, estadoPassos, textoEnviada, nomePdf } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

/* Cinco perguntas, uma por pilar. 2 = Excelente, 1 = Oportunidade, 0 = Mau. */
const IT = [0, 1, 2, 3, 4].map(p => ({ p, n: p + 1, t: "T" + p, c: "Pergunta " + p, tp: "count", r: "U" }));
const aud = (id, date, scores, extra) => Object.assign({ id, service: "Loja A", date, scores, items: IT }, extra || {});
const A = aud(1, "2026-10-01", [2, 2, 2, 2, 2]);
const B = aud(2, "2026-10-20", [0, 1, 2, 2, 0], { verif: "Fulano",
  acoes: [{ id: 1, r: "U", texto: "x", prazo: "2026-10-25", estado: "aberta", feitaEm: "" }] });

test("resumo para o email: saudação, nota, comparação, contagens, pilar mais fraco, acções", () => {
  const t = resumoEnvio(B, [A, B], "2026-11-08", "email").split("\n");
  assert.strictEqual(t[0], "Segue em anexo o relatório da auditoria 5S.");
  assert.strictEqual(t[2], "Auditoria 5S · Loja A · 20/10/2026");
  assert.match(t[3], /^Nota: \d+\/100 \((Crítico|Com oportunidade|Excelente)\) · -\d+ face a 01\/10\/26$/);
  assert.strictEqual(t[4], "Mau: 2 · Com oportunidade: 1 · Excelente: 2");
  assert.match(t[5], /^Pilar mais fraco: (Triagem|Disciplina) \(0%\)$/);
  assert.strictEqual(t[6], "Acções: 1 nesta auditoria · 1 em atraso neste serviço");
  assert.strictEqual(t[7], "Verificador: Fulano");
  assert.strictEqual(t.length, 8);
});

test("resumo para o Teams: sem saudação, com a nota do anexo no fim; sem anterior nem acções", () => {
  const t = resumoEnvio(A, [A, B], "2026-11-08", "teams").split("\n");
  assert.strictEqual(t[0], "Auditoria 5S · Loja A · 01/10/2026");
  assert.strictEqual(t[1], "Nota: 100/100 (Excelente)");
  assert.ok(!t.some(l => /Pilar mais fraco|Acções|Verificador/.test(l)), "sem o que não se aplica: " + t.join(" | "));
  assert.strictEqual(t[t.length - 1], "Relatório completo no PDF em anexo.");
});

test("envios: só datas válidas nas três chaves; vazio fica de fora", () => {
  assert.deepStrictEqual(plain(sanitizeEnvios({ pdf: "2026-11-08T10:00:00.000Z", email: "ontem", teams: 5, x: "2026-11-08" })),
    { pdf: "2026-11-08T10:00:00.000Z" });
  assert.strictEqual(sanitizeEnvios({}), undefined);
  assert.strictEqual(sanitizeEnvios(null), undefined);
  assert.strictEqual(sanitizeEnvios(["2026-11-08"]), undefined);
  assert.strictEqual(sanitizeEnvios({ pdf: "2026-11-08".repeat(10) }), undefined, "texto comprido demais");
});

test("estado dos passos: cópia feita só sem nada por copiar", () => {
  const at = "2026-11-08T10:00:00.000Z";
  assert.strictEqual(estadoPassos(A, { atFotos: at, pend: 0, pendFotos: 0 }).copia, true);
  assert.strictEqual(estadoPassos(A, { atFotos: at, pend: 1, pendFotos: 0 }).copia, false, "auditoria por copiar");
  assert.strictEqual(estadoPassos(A, { atFotos: at, pend: 0, pendFotos: 2 }).copia, false, "fotos por copiar");
  assert.strictEqual(estadoPassos(A, { at, pend: 0 }).copia, false, "só a cópia sem fotos não chega");
  const e = estadoPassos(Object.assign({}, A, { envios: { pdf: at, teams: at } }), {});
  assert.deepStrictEqual([e.pdf, e.email, e.teams], [at, "", at]);
});

test("Histórico: enviada (por onde e quando) ou por enviar; nome do PDF", () => {
  assert.match(textoEnviada(A), /por enviar/);
  const t = textoEnviada(Object.assign({}, A, { envios: { email: "2026-11-01T10:00:00.000Z", teams: "2026-11-05T10:00:00.000Z" } }));
  assert.match(t, /enviada \(Teams, email\) a 05\/11\/26/);
  assert.strictEqual(nomePdf(B), "Auditoria 5S - Loja A - 2026-10-20.pdf");
});
