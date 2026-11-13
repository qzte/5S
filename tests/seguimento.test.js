/* Testes dos indicadores de seguimento (4.4.0): a média de um eixo sem as
   auditorias que não o têm, a média e as faixas por serviço, a última auditoria
   de cada serviço, as perguntas reincidentes e o desempenho das acções. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["mediaDoEixo", "kpisAnuais", "ultimaAuditoriaPorServico", "reincidencias", "desempenhoAcoes",
  "criadaEmDe", "idadeAcoesAbertas", "eficaciaAcoes", "estadoAcao",
  "avg", "ordemCron", "diasEntre", "byPillar", "byResp", "tipoDe", "objetivoDe", "assinItem"],
  ["ITEMS", "itemsOf", "umaCasa", "WEIGHTS", "W_MAX", "wOf", "total", "PILLARS", "RESP", "pctOf"]);
const { mediaDoEixo, kpisAnuais, ultimaAuditoriaPorServico, reincidencias, desempenhoAcoes, idadeAcoesAbertas, eficaciaAcoes } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

test("média de um eixo: as auditorias sem perguntas nele não contam como 0 %", () => {
  const eixos = [[{ pct: 100, n: 2 }, { pct: 50, n: 1 }], [{ pct: 80, n: 2 }, { pct: 0, n: 0 }]];
  assert.deepStrictEqual(plain(mediaDoEixo(eixos, 0)), { pct: 90, n: 4, auditorias: 2 });
  assert.deepStrictEqual(plain(mediaDoEixo(eixos, 1)), { pct: 50, n: 1, auditorias: 1 });
  assert.deepStrictEqual(plain(mediaDoEixo([], 0)), { pct: 0, n: 0, auditorias: 0 });
});

const IT = [0, 1, 2, 3, 4].map(p => ({ p, r: "U", n: p + 1, tp: "count", c: "Pergunta " + (p + 1), t: "T" + (p + 1) }));
const aud = (id, service, date, scores, extra) => Object.assign({ id, service, date, scores, items: IT }, extra || {});

test("média por serviço e serviços por faixa no ano", () => {
  const l = [aud(1, "A", "2026-01-05", [2, 2, 2, 2, 2]), aud(2, "A", "2026-02-05", [2, 2, 2, 2, 2]),
    aud(3, "A", "2026-03-05", [2, 2, 2, 2, 2]), aud(4, "B", "2026-03-06", [1, 1, 1, 1, 1]),
    aud(5, "C", "2026-03-07", [0, 0, 0, 0, 0])];
  const k = kpisAnuais(l, ["A", "B", "C"], [], [], 2026, "2026-11-13");
  assert.strictEqual(k.media, 68, "por auditoria: (3×100 + 38 + 0) ÷ 5");
  assert.strictEqual(k.mediaServicos, 46, "por serviço: (100 + 38 + 0) ÷ 3");
  assert.deepStrictEqual(plain(k.faixas), { excelente: 1, oportunidade: 0, critico: 2 });
  const vazio = kpisAnuais(l, ["A"], [], [], 2025, "2026-11-13");
  assert.strictEqual(vazio.mediaServicos, null);
  assert.deepStrictEqual(plain(vazio.faixas), { excelente: 0, oportunidade: 0, critico: 0 });
});

test("última auditoria por serviço: nunca auditados primeiro, depois os mais antigos", () => {
  const l = [aud(1, "A", "2026-11-01", [2, 2, 2, 2, 2]), aud(2, "A", "2026-11-10", [2, 2, 2, 2, 2]),
    aud(3, "B", "2026-09-13", [2, 2, 2, 2, 2]), aud(4, "Velho", "2026-11-12", [2, 2, 2, 2, 2])];
  const r = plain(ultimaAuditoriaPorServico(l, ["A", "B", "Z"], "2026-11-13"));
  assert.deepStrictEqual(r.map(x => x.service), ["Z", "B", "A", "Velho"]);
  assert.deepStrictEqual(r.map(x => x.dias), [null, 61, 3, 1]);
  assert.strictEqual(r[2].ultima, "2026-11-10", "a mais recente do serviço");
});

test("reincidência: não Excelente em auditorias seguidas ao mesmo serviço", () => {
  const l = [
    aud(1, "A", "2026-01-01", [2, 1, 0, 2, 2]),
    aud(2, "A", "2026-02-01", [2, 1, 2, 1, 2]),
    aud(3, "A", "2026-03-01", [2, 0, 2, 1, 2]),
    aud(4, "B", "2026-01-01", [1, 2, 2, 2, 2]),
    aud(5, "B", "2026-02-01", [2, 2, 2, 2, 2]),
    aud(6, "B", "2026-03-01", [1, 2, 2, 2, 2]),
  ];
  const r = plain(reincidencias(l));
  assert.deepStrictEqual(r.map(x => [x.service, x.n, x.seguidas]), [["A", 2, 3], ["A", 4, 2]],
    "a pergunta 2 falhou 3 vezes seguidas; a 4, 2; a 3 recuperou; a de B foi interrompida por um Excelente");
  assert.deepStrictEqual(plain(reincidencias([])), []);
  assert.deepStrictEqual(plain(reincidencias([aud(1, "A", "2026-01-01", [1, 1, 1, 1, 1])])), [], "uma só auditoria não é reincidência");
});

test("reincidência: a ordem das auditorias é a da data, não a da lista", () => {
  const l = [aud(3, "A", "2026-03-01", [1, 2, 2, 2, 2]), aud(1, "A", "2026-01-01", [1, 2, 2, 2, 2]),
    aud(2, "A", "2026-02-01", [2, 2, 2, 2, 2])];
  assert.deepStrictEqual(plain(reincidencias(l)), []);
});

test("desempenho das acções: tempo de fecho e cumprimento do prazo", () => {
  const ac = (estado, prazo, feitaEm) => ({ id: 1, r: "U", texto: "x", prazo, estado, feitaEm, item: null });
  const l = [
    aud(1, "A", "2026-01-01", [2, 2, 2, 2, 2], { acoes: [ac("feita", "2026-01-15", "2026-01-11"), ac("feita", "2026-01-15", "2026-01-21"), ac("aberta", "2026-01-10", "")] }),
    aud(2, "B", "2026-02-01", [2, 2, 2, 2, 2], { acoes: [ac("feita", "", "2026-02-02"), ac("feita", "2026-02-10", "")] }),
  ];
  const d = plain(desempenhoAcoes(l));
  assert.deepStrictEqual(d, { fechadas: 3, diasMedio: 10.3, comPrazo: 2, noPrazo: 1, pctPrazo: 50 });
  assert.deepStrictEqual(plain(desempenhoAcoes([])), { fechadas: 0, diasMedio: null, comPrazo: 0, noPrazo: 0, pctPrazo: null });
});

/* ---- 4.5.0 ---- */
const ac = (estado, prazo, feitaEm, extra) => Object.assign({ id: 1, r: "U", texto: "x", prazo, estado, feitaEm, item: null }, extra || {});

test("tempo de fecho: conta desde a criação da acção, e da auditoria se não houver", () => {
  const l = [aud(1, "A", "2026-01-01", [2, 2, 2, 2, 2], { acoes: [
    ac("feita", "", "2026-01-21", { criadaEm: "2026-01-11" }),   // 10 dias
    ac("feita", "", "2026-01-21")] })];                          // 20 dias, da auditoria
  assert.strictEqual(plain(desempenhoAcoes(l)).diasMedio, 15);
});

test("dispersão: a nota mais baixa e a mais alta do ano, com serviço e data", () => {
  const l = [aud(1, "A", "2026-01-05", [2, 2, 2, 2, 2]), aud(2, "B", "2026-03-06", [1, 1, 1, 1, 1]), aud(3, "C", "2026-03-07", [2, 2, 2, 1, 1])];
  const k = plain(kpisAnuais(l, [], [], [], 2026, "2026-11-13"));
  assert.deepStrictEqual(k.minimo, { nota: 38, service: "B", date: "2026-03-06" });
  assert.deepStrictEqual(k.maximo, { nota: 100, service: "A", date: "2026-01-05" });
  assert.strictEqual(plain(kpisAnuais(l, [], [], [], 2025, "2026-11-13")).minimo, null);
});

test("acções em aberto: idade, atraso e a mais antiga", () => {
  const l = [
    aud(1, "A", "2026-10-01", [2, 2, 2, 2, 2], { acoes: [
      ac("aberta", "2026-11-03", ""),                                 // 43 dias (da auditoria), 10 de atraso
      ac("aberta", "2026-12-01", "", { criadaEm: "2026-11-03", texto: "nova" }),   // 10 dias
      ac("feita", "", "2026-10-05")] }),
    aud(2, "B", "2026-11-10", [2, 2, 2, 2, 2], { acoes: [ac("aberta", "", "")] }),   // 3 dias
  ];
  const r = plain(idadeAcoesAbertas(l, "2026-11-13"));
  assert.strictEqual(r.abertas, 3);
  assert.strictEqual(r.idadeMedia, 18.7);
  assert.deepStrictEqual([r.atrasadas, r.atrasoMedio], [1, 10]);
  assert.deepStrictEqual([r.maisAntiga.service, r.maisAntiga.dias], ["A", 43]);
  const v = plain(idadeAcoesAbertas([], "2026-11-13"));
  assert.deepStrictEqual([v.abertas, v.idadeMedia, v.atrasoMedio, v.maisAntiga], [0, null, null, null]);
});

test("eficácia das acções: a pergunta ficou Excelente, melhorou ou não, na auditoria seguinte", () => {
  const comAc = (item, feitaEm) => ({ acoes: [ac("feita", "", feitaEm, { item })] });
  const l = [
    aud(1, "A", "2026-01-01", [0, 0, 1, 2, 1], { acoes: [
      ac("feita", "", "2026-01-10", { item: 1, id: 1 }),     // 0 → 2: resolvida
      ac("feita", "", "2026-01-10", { item: 2, id: 2 }),     // 0 → 1: melhorou
      ac("feita", "", "2026-01-10", { item: 3, id: 3 }),     // 1 → 1: não melhorou
      ac("feita", "", "2026-01-10", { item: 4, id: 4 }),     // já Excelente: fora
      ac("feita", "", "2026-02-15", { item: 5, id: 5 }),     // feita depois da seguinte: fora
      ac("aberta", "", "", { item: 5, id: 6 }),              // aberta: fora
      ac("feita", "", "2026-01-10", { id: 7 })] }),          // sem pergunta: fora
    aud(2, "A", "2026-02-01", [2, 1, 1, 2, 2]),
    aud(3, "B", "2026-01-01", [0, 2, 2, 2, 2], comAc(1, "2026-01-10")),   // sem auditoria seguinte: fora
  ];
  const r = plain(eficaciaAcoes(l));
  assert.deepStrictEqual(r, { avaliadas: 3, resolvidas: 1, melhoraram: 1, naoMelhoraram: 1, pct: 33 });
  assert.deepStrictEqual(plain(eficaciaAcoes([])), { avaliadas: 0, resolvidas: 0, melhoraram: 0, naoMelhoraram: 0, pct: null });
});

test("eficácia das acções: uma pergunta mudada entre as auditorias não se compara", () => {
  const IT2 = IT.map((it, i) => i === 0 ? Object.assign({}, it, { c: "Outro enunciado" }) : it);
  const l = [aud(1, "A", "2026-01-01", [0, 2, 2, 2, 2], { acoes: [ac("feita", "", "2026-01-10", { item: 1 })] }),
    Object.assign(aud(2, "A", "2026-02-01", [2, 2, 2, 2, 2]), { items: IT2 })];
  assert.strictEqual(plain(eficaciaAcoes(l)).avaliadas, 0);
});
