/* Testes do aviso de cópia de segurança das fotos (3.18.0): `avisoFotos`
   decide quando lembrar a cópia COM fotos, que a cópia normal não substitui. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(["avisoFotos", "avisoBackup"], ["BACKUP_DIAS", "BACKUP_PEND"]);
const { avisoFotos, avisoBackup, BACKUP_DIAS, BACKUP_PEND } = ctx;
const DIA = 864e5, T0 = Date.parse("2026-11-07T10:00:00Z");
const iso = t => new Date(t).toISOString();

test("sem fotos por copiar, nada", () => {
  assert.strictEqual(avisoFotos({}, T0), null);
  assert.strictEqual(avisoFotos({ pendFotos: 0 }, T0), null);
  assert.strictEqual(avisoFotos(null, T0), null);
});

test("fotos que nunca entraram numa cópia: avisa logo", () => {
  assert.match(avisoFotos({ pendFotos: 1 }, T0), /^Há 1 foto .* nunca entrou numa cópia/);
  assert.match(avisoFotos({ pendFotos: 3, at: iso(T0) }, T0), /^Há 3 fotos .* nunca entraram/,
    "uma cópia normal recente não conta para as fotos");
});

test("depois de uma cópia com fotos: só com BACKUP_PEND fotos ou BACKUP_DIAS dias", () => {
  assert.strictEqual(avisoFotos({ pendFotos: BACKUP_PEND - 1, atFotos: iso(T0 - DIA) }, T0), null);
  assert.match(avisoFotos({ pendFotos: BACKUP_PEND, atFotos: iso(T0 - 3600e3) }, T0),
    new RegExp("^" + BACKUP_PEND + " fotos novas ou trocadas .* feita hoje"));
  assert.match(avisoFotos({ pendFotos: 1, atFotos: iso(T0 - BACKUP_DIAS * DIA) }, T0),
    new RegExp("^1 foto nova ou trocada .* feita há " + BACKUP_DIAS + " dias"));
});

test("Lembrar amanhã vale também para as fotos", () => {
  const info = { pendFotos: 2, adiar: iso(T0 + 3600e3) };
  assert.strictEqual(avisoFotos(info, T0), null);
  assert.match(avisoFotos(info, T0 + 2 * 3600e3), /^Há 2 fotos/);
});

test("o aviso das auditorias não muda", () => {
  assert.strictEqual(avisoBackup({ at: iso(T0), pend: 0, pendFotos: 9 }, 5, T0), null);
});
