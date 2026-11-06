/* Testes das funções puras da 3.9.0: filtros do Histórico e da Análise,
   auditoria anterior, séries da evolução, seguimento entre auditorias e as
   linhas da exportação para Excel. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["ordemCron", "faixaNota", "filtrarAudits", "anteriorDe", "ultimaDe", "desdeMeses",
   "seriesEvolucao", "seguimento", "linhasExcel", "assinItem", "byPillar", "byResp"],
  ["ITEMS", "itemsOf", "LBL", "badge"]);
const { filtrarAudits, anteriorDe, ultimaDe, desdeMeses, seriesEvolucao, seguimento, linhasExcel } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

/* Cinco perguntas, uma por pilar. 2 = Excelente, 1 = Oportunidade, 0 = Mau. */
const IT = [0, 1, 2, 3, 4].map(p => ({ p, n: p + 1, t: "T" + p, c: "Pergunta " + p, tp: "count", r: "U" }));
const aud = (id, service, date, scores, extra) =>
  Object.assign({ id, service, date, scores, items: IT }, extra || {});
const A = aud(1, "Loja A", "2026-01-10", [2, 2, 2, 2, 2]);   /* 100 */
const B = aud(2, "Loja A", "2026-03-05", [0, 0, 0, 0, 0]);   /* 0 */
const C = aud(3, "Loja B", "2026-02-01", [1, 1, 1, 1, 1]);   /* 38 */
const D = aud(4, "Loja A", "2026-03-05", [2, 1, 2, 1, 2]);   /* 75; mesmo dia que B, gravada depois */
const TODAS = [A, B, C, D];

test("filtro vazio devolve tudo", () => {
  assert.strictEqual(filtrarAudits(TODAS, {}).length, 4);
  assert.strictEqual(filtrarAudits(TODAS).length, 4);
});

test("filtro por serviço, intervalo de datas (inclusivo) e faixa de nota", () => {
  assert.deepStrictEqual(filtrarAudits(TODAS, { svc: "Loja B" }).map(a => a.id), [3]);
  assert.deepStrictEqual(filtrarAudits(TODAS, { de: "2026-02-01", ate: "2026-03-04" }).map(a => a.id), [3]);
  assert.deepStrictEqual(filtrarAudits(TODAS, { de: "2026-03-05" }).map(a => a.id), [2, 4]);
  assert.deepStrictEqual(filtrarAudits(TODAS, { nota: "ok" }).map(a => a.id), [1]);
  assert.deepStrictEqual(filtrarAudits(TODAS, { nota: "mid" }).map(a => a.id), [4]);
  assert.deepStrictEqual(filtrarAudits(TODAS, { nota: "bad" }).map(a => a.id), [2, 3]);
  assert.deepStrictEqual(filtrarAudits(TODAS, { svc: "Loja A", nota: "bad" }).map(a => a.id), [2]);
});

test("auditoria anterior: mesmo serviço, desempate pelo id no mesmo dia", () => {
  assert.strictEqual(anteriorDe(A, TODAS), null);
  assert.strictEqual(anteriorDe(B, TODAS).id, 1);
  assert.strictEqual(anteriorDe(D, TODAS).id, 2, "no mesmo dia, a gravada antes é a anterior");
  assert.strictEqual(anteriorDe(C, TODAS), null, "outro serviço não conta");
  assert.strictEqual(ultimaDe("Loja A", TODAS).id, 4);
  assert.strictEqual(ultimaDe("Loja Z", TODAS), null);
});

test("início do período em meses, sem depender do fuso", () => {
  assert.strictEqual(desdeMeses(0, "2026-11-06"), "");
  assert.strictEqual(desdeMeses(3, "2026-11-06"), "2026-08-06");
  assert.strictEqual(desdeMeses(12, "2026-02-15"), "2025-02-15");
});

test("uma série por serviço, em ordem cronológica", () => {
  const s = plain(seriesEvolucao([D, C, B, A]));
  assert.deepStrictEqual(s.map(x => x.service), ["Loja A", "Loja B"]);
  assert.deepStrictEqual(s[0].pontos.map(p => p.date), ["2026-01-10", "2026-03-05", "2026-03-05"]);
  assert.deepStrictEqual(s[0].pontos.map(p => p.pct), [100, 0, ctx.total(D)]);
  assert.deepStrictEqual(plain(seriesEvolucao([])), []);
});

test("seguimento: melhorou, piorou e mantém-se; Excelente nas duas fica de fora", () => {
  const ant = aud(10, "X", "2026-01-01", [0, 1, 2, 1, 2]);
  const agr = aud(11, "X", "2026-02-01", [2, 0, 1, 1, 2]);
  const sg = plain(seguimento(agr, ant));
  assert.strictEqual(sg.date, "2026-01-01");
  assert.deepStrictEqual(sg.linhas.map(l => [l.n, l.estado]),
    [[1, "melhorou"], [2, "piorou"], [3, "piorou"], [4, "igual"]]);
  assert.strictEqual(sg.melhoraram, 1);
  assert.strictEqual(sg.pioraram, 2);
  assert.strictEqual(sg.iguais, 1);
  assert.strictEqual(seguimento(agr, null), null);
});

test("seguimento emparelha pela pergunta, não pela posição", () => {
  const ant = aud(10, "X", "2026-01-01", [0, 1, 2, 2, 2]);
  /* As duas primeiras perguntas trocaram de lugar, e a terceira mudou de texto. */
  const novas = [IT[1], IT[0], Object.assign({}, IT[2], { c: "Outra" }), IT[3], IT[4]];
  const agr = { id: 11, service: "X", date: "2026-02-01", scores: [2, 0, 0, 2, 2], items: novas };
  const sg = plain(seguimento(agr, ant));
  assert.deepStrictEqual(sg.linhas.map(l => [l.n, l.antes, l.agora]), [[2, 1, 2], [1, 0, 0]]);
});

test("Excel: uma linha por auditoria e uma por resposta", () => {
  const { auditorias, respostas } = plain(linhasExcel([B, A]));
  assert.deepStrictEqual(auditorias.map(x => x.ID), [1, 2], "ordem cronológica");
  assert.strictEqual(auditorias[0]["Nota"], 100);
  assert.strictEqual(auditorias[0]["Classificação"], "Excelente");
  assert.strictEqual(auditorias[1]["Classificação"], "Crítico");
  assert.strictEqual(auditorias[0]["Pilar: Triagem"], 100);
  assert.strictEqual(auditorias[0]["Resp.: Utilizadores"], 100);
  assert.strictEqual(auditorias[0]["Resp.: Manutenção"], "", "responsável sem perguntas fica vazio, não a zero");
  assert.strictEqual(respostas.length, 10);
  assert.deepStrictEqual(Object.keys(respostas[0]),
    ["ID auditoria", "Serviço", "Data", "Nº", "Tema", "Pergunta", "Pilar", "Responsável", "Valor", "Auditados", "Classificação"]);
  assert.strictEqual(respostas[0]["Responsável"], "Utilizadores");
  assert.strictEqual(respostas[5]["Classificação"], "Mau");
  assert.strictEqual(respostas[0]["Valor"], "", "sem valor bruto gravado, a célula fica vazia");
});
