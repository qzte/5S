/* Testes do rascunho da auditoria em curso e do lembrete de cópia de segurança
   (v3.8.0).

   `montarRascunho` decide o que se grava a cada alteração do formulário, e
   `lerRascunho` o que volta ao formulário ao reabrir. O ponto delicado é o
   alinhamento: se o editor de perguntas mudar entre as duas, uma resposta só
   pode voltar à MESMA pergunta, nunca à que ficou com o mesmo índice.
   `avisoBackup` decide quando a app lembra a exportação. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["assinItem", "inteiroOuNull", "montarRascunho", "lerRascunho", "avisoBackup"],
  ["BACKUP_DIAS", "BACKUP_PEND"]);
const { montarRascunho, lerRascunho, avisoBackup, BACKUP_DIAS, BACKUP_PEND } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

const IT = [
  { n: 1, tp: "count", c: "Caixas no chão" },
  { n: 2, tp: "amostra", c: "Kanbans em falta", tgt: 10 },
  { n: 3, tp: "scale", c: "Limpeza do corredor" }
];
const CAMPOS = { service: "Serviço A (00001)", date: "2026-11-06", pick: "", repo: "", verif: "", note: "" };
const AGORA = "2026-11-06T10:00:00.000Z";

test("formulário vazio não gera rascunho (serviço e data não contam)", () => {
  assert.strictEqual(montarRascunho(CAMPOS, IT, ["", "", ""], [null, 10, null], AGORA), null);
});

test("um nome escrito, sem respostas, já gera rascunho", () => {
  const d = montarRascunho(Object.assign({}, CAMPOS, { verif: "Fulano" }), IT, ["", "", ""], [null, 10, null], AGORA);
  assert.ok(d);
  assert.strictEqual(d.verif, "Fulano");
});

test("ida e volta: o que se grava é o que se lê", () => {
  const d = montarRascunho(Object.assign({}, CAMPOS, { note: "corredor 3" }), IT, ["2", "3", ""], [null, 20, null], AGORA);
  const r = plain(lerRascunho(JSON.parse(JSON.stringify(d)), IT));
  assert.deepStrictEqual(r.raw, [2, 3, null]);
  assert.deepStrictEqual(r.tgts, [null, 20, null]);
  assert.strictEqual(r.service, "Serviço A (00001)");
  assert.strictEqual(r.date, "2026-11-06");
  assert.strictEqual(r.note, "corredor 3");
  assert.strictEqual(r.savedAt, AGORA);
  assert.strictEqual(r.perdidas, 0);
});

test("valores inválidos no formulário ficam por responder, não a zero", () => {
  const d = montarRascunho(CAMPOS, IT, ["-1", "abc", "1.5"], [null, "0", null], AGORA);
  /* nada válido e nenhum nome: não há rascunho */
  assert.strictEqual(d, null);
  const d2 = montarRascunho(CAMPOS, IT, ["-1", "4", "1.5"], [null, "0", null], AGORA);
  assert.deepStrictEqual(plain(d2.raw), [null, 4, null]);
  assert.deepStrictEqual(plain(d2.tgts), [null, null, null], "um alvo 0 não é alvo");
});

test("perguntas reordenadas: cada resposta segue a sua pergunta", () => {
  const d = montarRascunho(CAMPOS, IT, ["1", "2", "0"], [null, 10, null], AGORA);
  const novas = [IT[2], IT[0], IT[1]];
  const r = plain(lerRascunho(d, novas));
  assert.deepStrictEqual(r.raw, [0, 1, 2]);
  assert.deepStrictEqual(r.tgts, [null, null, 10]);
  assert.strictEqual(r.perdidas, 0);
});

test("pergunta alterada: a resposta não passa para a pergunta nova no mesmo índice", () => {
  const d = montarRascunho(CAMPOS, IT, ["1", "2", "0"], [null, 10, null], AGORA);
  const novas = [IT[0], { n: 2, tp: "count", c: "Outra pergunta" }, IT[2]];
  const r = plain(lerRascunho(d, novas));
  assert.deepStrictEqual(r.raw, [1, null, 0]);
  assert.strictEqual(r.perdidas, 1);
});

test("rascunho com forma errada é ignorado", () => {
  for (const x of [null, "x", [], {}, { v: 2 }, { v: 1, sig: "x", raw: [], tgts: [] }, { v: 1, sig: [], raw: {}, tgts: [] }])
    assert.strictEqual(lerRascunho(x, IT), null, JSON.stringify(x));
});

test("o que vem do armazenamento é limpo: texto, data e números", () => {
  const x = { v: 1, savedAt: "lixo", service: "S‮erviço", date: "06/11/2026",
    pick: "a".repeat(500), repo: 7, verif: null, note: "ok",
    sig: IT.map(it => [it.n, it.tp, it.c].join("|")), raw: [1e9, "2", 3], tgts: [null, -5, null] };
  const r = plain(lerRascunho(x, IT));
  assert.strictEqual(r.savedAt, null);
  assert.strictEqual(r.service, "Serviço");
  assert.strictEqual(r.date, "");
  assert.strictEqual(r.pick.length, 120);
  assert.strictEqual(r.repo, "7");
  assert.strictEqual(r.verif, "");
  assert.deepStrictEqual(r.raw, [null, 2, 3]);
  assert.deepStrictEqual(r.tgts, [null, null, null]);
});

/* ---------- Lembrete de cópia de segurança ---------- */
const DIA = 864e5;
const T0 = Date.parse("2026-11-06T10:00:00Z");

test("sem auditorias não há aviso", () => {
  assert.strictEqual(avisoBackup({}, 0, T0), null);
});

test("nunca exportou: avisa, com o número de auditorias", () => {
  assert.match(avisoBackup({}, 3, T0), /Ainda não há nenhuma cópia de segurança: as 3 auditorias/);
  assert.match(avisoBackup(null, 1, T0), /a auditoria gravada existe só neste dispositivo/);
  assert.match(avisoBackup("lixo", 1, T0), /Ainda não há/);
});

test("exportado e sem alterações desde então: sem aviso, por mais tempo que passe", () => {
  assert.strictEqual(avisoBackup({ at: new Date(T0 - 90 * DIA).toISOString(), pend: 0 }, 10, T0), null);
});

test("poucas alterações e pouco tempo: sem aviso", () => {
  const info = { at: new Date(T0 - (BACKUP_DIAS - 1) * DIA).toISOString(), pend: BACKUP_PEND - 1 };
  assert.strictEqual(avisoBackup(info, 10, T0), null);
});

test("alterações por exportar há BACKUP_DIAS dias: avisa", () => {
  const info = { at: new Date(T0 - BACKUP_DIAS * DIA).toISOString(), pend: 1 };
  assert.match(avisoBackup(info, 10, T0), new RegExp("^1 auditoria gravada ou alterada .* feita há " + BACKUP_DIAS + " dias"));
});

test("BACKUP_PEND alterações no mesmo dia: avisa", () => {
  const info = { at: new Date(T0 - 3600e3).toISOString(), pend: BACKUP_PEND };
  assert.match(avisoBackup(info, 10, T0), new RegExp("^" + BACKUP_PEND + " auditorias .* feita hoje"));
});

test("adiado: sem aviso até à hora marcada, e volta depois", () => {
  const info = { adiar: new Date(T0 + 3600e3).toISOString() };
  assert.strictEqual(avisoBackup(info, 3, T0), null);
  assert.match(avisoBackup(info, 3, T0 + 2 * 3600e3), /Ainda não há/);
});
