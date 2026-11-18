/* Testes da verificação ao finalizar (4.8.0): cada pergunta Mau ou Com
   oportunidade precisa de acção com prazo e de foto ou nota. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["faltasParaFinalizar"], ["ITEMS", "itemsOf"]);
const { faltasParaFinalizar } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));
const items = [{ n: 1, t: "Materiais", r: "U" }, { n: 7, t: "Caixas", r: "R" }, { n: 8, t: "Rutura", r: "P" }];
const acao = (item, prazo) => ({ id: item, r: "U", item, texto: "Fazer", prazo, estado: "aberta" });
const aud = extra => Object.assign({ items, scores: [2, 0, 1], notas: ["", "", ""], acoes: [] }, extra);

test("completa: nada falta", () => {
  const a = aud({ notas: ["", "KB no chão", ""], acoes: [acao(7, "2026-12-01"), acao(8, "2026-12-02")] });
  assert.deepStrictEqual(plain(faltasParaFinalizar(a, new Set([2]))), []);
});

test("as Excelentes não são verificadas", () => {
  assert.deepStrictEqual(plain(faltasParaFinalizar(aud({ scores: [2, 2, 2] }), new Set())), []);
});

test("foto sem nota chega; nota sem foto também", () => {
  const a = aud({ notas: ["", "", "Sem cartão"], acoes: [acao(7, "2026-12-01"), acao(8, "2026-12-01")] });
  assert.deepStrictEqual(plain(faltasParaFinalizar(a, new Set([1]))), []);
});

test("sem foto nem nota", () => {
  const a = aud({ scores: [2, 0, 2], acoes: [acao(7, "2026-12-01")] });
  assert.deepStrictEqual(plain(faltasParaFinalizar(a, new Set())), [{ n: 7, t: "Caixas", faltas: ["sem foto nem nota"] }]);
});

test("acção sem prazo", () => {
  const a = aud({ scores: [2, 0, 2], notas: ["", "x", ""], acoes: [acao(7, "")] });
  assert.deepStrictEqual(plain(faltasParaFinalizar(a, new Set())), [{ n: 7, t: "Caixas", faltas: ["acção sem prazo"] }]);
});

test("uma das acções da pergunta com prazo chega", () => {
  const a = aud({ scores: [2, 0, 2], notas: ["", "x", ""], acoes: [acao(7, ""), Object.assign(acao(7, "2026-12-01"), { id: 99 })] });
  assert.deepStrictEqual(plain(faltasParaFinalizar(a, new Set())), []);
});

test("falta tudo: sem acção e sem foto nem nota, por esta ordem", () => {
  assert.deepStrictEqual(plain(faltasParaFinalizar(aud({ scores: [2, 1, 2] }), new Set())),
    [{ n: 7, t: "Caixas", faltas: ["sem acção", "sem foto nem nota"] }]);
});

test("auditoria antiga sem notas nem acções: lista as que falham, sem rebentar", () => {
  const r = plain(faltasParaFinalizar({ items, scores: [0, 2, 1] }, undefined));
  assert.deepStrictEqual(r.map(x => [x.n, x.faltas]), [[1, ["sem acção", "sem foto nem nota"]], [8, ["sem acção", "sem foto nem nota"]]]);
});
