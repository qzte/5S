/* Testes do armazenamento compacto das auditorias (3.11.0).

   `compactarAudits` tira as perguntas (`items`) de cada auditoria e grava cada
   conjunto diferente UMA vez; `expandirAudits` repõe-nas ao ler. O que interessa
   garantir: ida e volta sem perder nada, cada auditoria fica com AS SUAS
   perguntas (nunca com as de outra), o formato antigo continua a ler-se, e o que
   vem do armazenamento não consegue apontar para fora do mapa de conjuntos. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["chaveConjunto", "compactarAudits", "expandirAudits"]);
const { compactarAudits, expandirAudits, chaveConjunto } = ctx;
const plain = o => JSON.parse(JSON.stringify(o));

const P1 = [{ n: 1, tp: "count", c: "Caixas", r: "U", p: 0 }, { n: 2, tp: "scale", c: "Limpeza", r: "M", p: 2 }];
const P2 = [{ n: 1, tp: "count", c: "Caixas no chão", r: "U", p: 0 }, { n: 2, tp: "scale", c: "Limpeza", r: "M", p: 2 }];
const aud = (id, items, extra) => Object.assign({ id, service: "A", date: "2026-01-0" + id, scores: [2, 1], items }, extra || {});

test("auditorias com as mesmas perguntas partilham um só conjunto", () => {
  const c = plain(compactarAudits([aud(1, P1), aud(2, P1), aud(3, P2), aud(4, JSON.parse(JSON.stringify(P1)))]));
  assert.strictEqual(Object.keys(c.sets).length, 2);
  assert.ok(c.lista.every(a => !("items" in a) && typeof a.q === "string"));
  assert.strictEqual(c.lista[0].q, c.lista[1].q);
  assert.strictEqual(c.lista[0].q, c.lista[3].q, "o mesmo conteúdo, noutro objecto, é o mesmo conjunto");
  assert.notStrictEqual(c.lista[0].q, c.lista[2].q);
});

test("ida e volta: cada auditoria volta com as suas perguntas e o resto intacto", () => {
  const orig = [aud(1, P1, { recs: { U: "x" }, note: "n" }), aud(2, P2), aud(3, P1)];
  const c = JSON.parse(JSON.stringify(compactarAudits(orig)));   /* como no localStorage */
  const de = plain(expandirAudits(c.lista, c.sets));
  assert.deepStrictEqual(de, plain(orig));
});

test("a chave é estável e depende do conteúdo", () => {
  const j1 = JSON.stringify(P1), j2 = JSON.stringify(P2);
  assert.strictEqual(chaveConjunto(j1), chaveConjunto(j1));
  assert.notStrictEqual(chaveConjunto(j1), chaveConjunto(j2));
  assert.match(chaveConjunto(j1), /^q[0-9a-z]+$/);
});

test("formato antigo (com items) e auditorias sem perguntas passam como estão", () => {
  const antiga = aud(1, P1);
  const semItens = { id: 2, service: "A", date: "2026-01-02", scores: [2] };
  assert.deepStrictEqual(plain(expandirAudits([antiga, semItens], {})), plain([antiga, semItens]));
  const c = plain(compactarAudits([semItens]));
  assert.deepStrictEqual(c.lista, [semItens]);
  assert.deepStrictEqual(c.sets, {});
});

test("uma chave que não existe, ou que aponta para o protótipo, não inventa perguntas", () => {
  const sets = { qabc: P1 };
  for (const q of ["qzzz", "constructor", "__proto__", "toString"]) {
    const [a] = plain(expandirAudits([{ id: 1, service: "A", date: "2026-01-01", scores: [2], q }], sets));
    assert.ok(!("items" in a), "q=" + q + " não devia dar perguntas");
    assert.ok(!("q" in a));
  }
  const [b] = plain(expandirAudits([{ id: 1, service: "A", date: "2026-01-01", scores: [2], q: "qabc" }], { qabc: "lixo" }));
  assert.ok(!("items" in b), "um conjunto que não é lista é ignorado");
});

test("registos que não são objectos passam intactos nos dois sentidos", () => {
  const lista = [null, "x", 3, [1], aud(1, P1)];
  const c = plain(compactarAudits(lista));
  assert.deepStrictEqual(c.lista.slice(0, 4), [null, "x", 3, [1]]);
  assert.deepStrictEqual(plain(expandirAudits(c.lista, c.sets)).slice(0, 4), [null, "x", 3, [1]]);
});

test("um `q` antigo em memória é ignorado: a chave sai sempre das perguntas", () => {
  const c = plain(compactarAudits([Object.assign(aud(1, P2), { q: "qdeoutroconjunto" })]));
  assert.strictEqual(c.lista[0].q, chaveConjunto(JSON.stringify(P2)));
});
