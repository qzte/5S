/* Testes do relatório mensal (3.20.0): `resumoMensal` e os meses à escolha. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["resumoMensal", "mesesRelatorio", "nomeMes", "fimDoMes", "mesAnterior",
  "byPillar", "byResp", "metricas", "avg", "ordemCron", "somarDias", "diasEntre"],
  ["ITEMS", "itemsOf", "MESES_PT", "memoMetricas"]);
const { resumoMensal, mesesRelatorio, nomeMes, fimDoMes, mesAnterior } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

/* Cinco perguntas, uma por pilar. 2 = Excelente, 1 = Oportunidade, 0 = Mau. */
const IT = [0, 1, 2, 3, 4].map(p => ({ p, n: p + 1, t: "T" + p, c: "Pergunta " + p, tp: "count", r: "U" }));
const aud = (id, service, date, scores, acoes) => ({ id, service, date, scores, items: IT, acoes });

test("datas do mês", () => {
  assert.strictEqual(nomeMes("2026-11"), "novembro de 2026");
  assert.strictEqual(nomeMes("2026-03"), "março de 2026");
  assert.strictEqual(fimDoMes("2026-02"), "2026-02-28");
  assert.strictEqual(fimDoMes("2028-02"), "2028-02-29");
  assert.strictEqual(fimDoMes("2026-12"), "2026-12-31");
  assert.strictEqual(mesAnterior("2026-01"), "2025-12");
});

test("meses à escolha: o actual e os com auditorias, sem futuro, do mais recente", () => {
  const l = [aud(1, "A", "2026-09-03", [2]), aud(2, "A", "2026-07-01", [2]), aud(3, "A", "2027-01-01", [2]),
    aud(4, "A", "2026-09-20", [2]), { id: 5, date: 7 }];
  assert.deepStrictEqual(plain(mesesRelatorio(l, "2026-11-07")), ["2026-11", "2026-09", "2026-07"]);
  assert.deepStrictEqual(plain(mesesRelatorio([], "2026-11-07")), ["2026-11"]);
});

test("média do mês, face ao anterior, e cada serviço", () => {
  const l = [
    aud(1, "Loja A", "2026-09-10", [2, 2, 2, 2, 2]),   /* 100, mês anterior */
    aud(2, "Loja A", "2026-10-05", [0, 0, 0, 0, 0]),   /* 0 */
    aud(3, "Loja A", "2026-10-20", [2, 2, 2, 2, 2]),   /* 100: a última */
    aud(4, "Loja B", "2026-10-15", [1, 1, 1, 1, 1]),   /* 38 */
  ];
  const r = plain(resumoMensal(l, "2026-10", ["Loja A", "Loja B", "Loja C"], "2026-11-07"));
  assert.strictEqual(r.n, 3);
  assert.strictEqual(r.media, Math.round((0 + 100 + 38) / 3));
  assert.strictEqual(r.mediaAnt, 100);
  assert.strictEqual(r.delta, r.media - 100);
  assert.strictEqual(r.emCurso, false);
  assert.strictEqual(r.servicosAuditados, 2);
  assert.deepStrictEqual(r.porServico.map(x => [x.service, x.n, x.media, x.ultima, x.delta]),
    [["Loja B", 1, 38, 38, null], ["Loja A", 2, 50, 100, -50], ["Loja C", 0, null, null, null]],
    "do pior para o melhor; os sem auditoria no fim");
  assert.deepStrictEqual(r.faixas, { excelente: 1, oportunidade: 0, critico: 2 });
  assert.strictEqual(r.pilares.length, 5);
  assert.strictEqual(r.pilares[0].delta, r.pilares[0].pct - 100);
  assert.deepStrictEqual(r.responsaveis.map(x => x.name), ["Utilizadores"]);
});

test("perguntas que mais falharam: pela proporção, depois pelos Mau", () => {
  const l = [
    aud(1, "A", "2026-10-01", [0, 1, 2, 2, 1]),
    aud(2, "B", "2026-10-02", [0, 2, 2, 2, 1]),
  ];
  const r = plain(resumoMensal(l, "2026-10", ["A", "B"], "2026-11-07"));
  assert.deepStrictEqual(r.piores.map(x => [x.n, x.falhas, x.vezes, x.mau]), [[1, 2, 2, 2], [5, 2, 2, 0], [2, 1, 2, 0]]);
  assert.deepStrictEqual(r.piores[0].servicos, ["A", "B"]);
  assert.strictEqual(plain(resumoMensal([aud(1, "A", "2026-10-01", [2, 2, 2, 2, 2])], "2026-10", [], [], "2026-11-07")).piores.length, 0);
});

test("plano de acção: novas, concluídas no mês e em aberto no fim do mês", () => {
  const l = [
    aud(1, "A", "2026-09-10", [0, 0, 0, 0, 0], [
      { id: 1, estado: "feita", feitaEm: "2026-10-03", prazo: "2026-09-20" },   /* concluída em outubro */
      { id: 2, estado: "aberta", prazo: "2026-10-15" },                         /* aberta e atrasada no fim */
      { id: 3, estado: "feita", feitaEm: "2026-11-02", prazo: "" }]),          /* ainda aberta a 31/10 */
    aud(2, "A", "2026-10-12", [0, 0, 0, 0, 0], [
      { id: 1, estado: "aberta", prazo: "2026-11-30" }]),                       /* nova, aberta, no prazo */
    aud(3, "A", "2026-11-03", [0, 0, 0, 0, 0], [{ id: 1, estado: "aberta", prazo: "" }]),  /* depois do mês */
  ];
  const r = plain(resumoMensal(l, "2026-10", ["A"], "2026-11-07"));
  assert.deepStrictEqual(r.acoes, { novas: 1, concluidas: 1, abertas: 3, atrasadas: 1 });
});

test("mês em curso: acções até hoje, não até ao fim do mês; sem prazos (4.0.0)", () => {
  const l = [aud(1, "A", "2026-10-30", [2, 2, 2, 2, 2], [{ id: 1, estado: "aberta", prazo: "2026-11-20" }])];
  const r = plain(resumoMensal(l, "2026-11", ["A", "B"], "2026-11-07"));
  assert.strictEqual(r.emCurso, true);
  assert.strictEqual(r.ref, "2026-11-07");
  assert.strictEqual(r.n, 0);
  assert.strictEqual(r.media, null);
  assert.strictEqual(r.acoes.atrasadas, 0, "o prazo de 20/11 ainda não passou hoje");
  assert.strictEqual(r.prazos, undefined, "a frequência das auditorias saiu em 4.0.0");
});
