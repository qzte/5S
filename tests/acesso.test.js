/* Testes da 3.19.0: o código de acesso próprio do dispositivo (resumo com sal,
   validação de um código novo) e as linhas do espaço ocupado. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["resumoPin", "pinGuardadoValido", "pinCerto", "problemaPinNovo", "fmtBytes", "linhasEspaco"],
  ["ADMIN_PIN", "LOCAL_MAX"]);
const { resumoPin, pinCerto, problemaPinNovo, fmtBytes, linhasEspaco, ADMIN_PIN, LOCAL_MAX } = ctx;
const SAL = "a1b2c3d4e5f6a7b8";
const guardado = codigo => ({ s: SAL, h: resumoPin(SAL, codigo) });

test("sem código próprio, vale o de origem", () => {
  assert.strictEqual(pinCerto(ADMIN_PIN, null), true);
  assert.strictEqual(pinCerto(" " + ADMIN_PIN + " ", undefined), true, "espaços à volta não contam");
  assert.strictEqual(pinCerto("0000", null), false);
  assert.strictEqual(pinCerto(ADMIN_PIN, { s: "curto", h: "x" }), true, "um registo estragado não tranca a app");
});

test("com código próprio, só ele abre; o de origem deixa de abrir", () => {
  const g = guardado("246813");
  assert.strictEqual(pinCerto("246813", g), true);
  assert.strictEqual(pinCerto(ADMIN_PIN, g), false);
  assert.strictEqual(pinCerto("246814", g), false);
  assert.strictEqual(pinCerto("", g), false);
});

test("o resumo depende do sal e não guarda o código à vista", () => {
  const h = resumoPin(SAL, "246813");
  assert.strictEqual(h, resumoPin(SAL, "246813"), "determinístico");
  assert.notStrictEqual(h, resumoPin("outrosal12345678", "246813"));
  assert.ok(!h.includes("246813"));
});

test("código novo: 4 a 8 algarismos, nem o de origem nem os óbvios", () => {
  assert.strictEqual(problemaPinNovo("2468"), null);
  assert.strictEqual(problemaPinNovo(" 13572468 "), null);
  assert.match(problemaPinNovo("123"), /4 a 8 algarismos/);
  assert.match(problemaPinNovo("123456789"), /4 a 8 algarismos/);
  assert.match(problemaPinNovo("12a4"), /4 a 8 algarismos/);
  assert.match(problemaPinNovo(ADMIN_PIN), /origem/);
  assert.match(problemaPinNovo("7777"), /repetido/);
  assert.match(problemaPinNovo("1234"), /sequência/);
  assert.match(problemaPinNovo("8765"), /sequência/);
});

test("tamanhos legíveis, com vírgula decimal", () => {
  assert.strictEqual(fmtBytes(500), "500 B");
  assert.strictEqual(fmtBytes(1536), "1,5 KB");
  assert.strictEqual(fmtBytes(3.4 * 1048576), "3,4 MB");
  assert.strictEqual(fmtBytes(250 * 1048576), "250 MB");
  assert.strictEqual(fmtBytes(2 * 1073741824), "2,0 GB");
  assert.strictEqual(fmtBytes(NaN), "?");
});

test("espaço: o localStorage e, quando há, o total com as fotos", () => {
  const so = linhasEspaco(LOCAL_MAX / 10, null);
  assert.strictEqual(so.length, 1, "sem estimativa, só a linha das auditorias");
  assert.match(so[0], /cerca de 10% dos ~5 MB/);
  const ambos = linhasEspaco(1024, { usage: 3 * 1048576, quota: 300 * 1048576 });
  assert.strictEqual(ambos.length, 2);
  assert.match(ambos[1], /^Total da app, com as fotos: 3,0 MB de 300 MB disponíveis \(1%\)$/);
  assert.match(linhasEspaco(LOCAL_MAX * 0.9, null)[0], /a encher/);
  assert.match(linhasEspaco(0, { usage: 90, quota: 100 })[1], /a ficar sem espaço/);
  assert.match(linhasEspaco(0, { usage: 5000 })[1], /^Total da app, com as fotos: 4,9 KB$/, "sem quota, só o ocupado");
});
