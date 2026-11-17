/* Backup automático na pasta partilhada (v4.6.0): as regras de conflito e de cópias.
   O comportamento no navegador está em tests/smoke-pasta.mjs. */
const test = require("node:test");
const assert = require("node:assert");
const { buildContext } = require("./harness.js");

const ctx = buildContext(
  ["pastaDois", "nomeDaCopia", "dataDaCopia", "copiasParaApagar", "resumoDoBackup", "haConflito", "idadeFaceAPartida", "deveCopiar"],
  ["PASTA_BASE", "PASTA_COPIAS_DIAS", "PASTA_COPIAS_MINIMO", "PASTA_COPIA_PROPRIA_MS", "PASTA_PADRAO_COPIA"]);
const { nomeDaCopia, copiasParaApagar, resumoDoBackup, haConflito, idadeFaceAPartida, deveCopiar } = ctx;

test("nomeDaCopia usa a data local da versão copiada", () => {
  assert.strictEqual(nomeDaCopia(new Date(2026, 10, 11, 21, 30, 5)), "auditoria5s_backup_2026-11-11_21-30-05.json");
});

test("copiasParaApagar: só cópias, com mais de 30 dias; as 10 mais recentes ficam sempre", () => {
  const agora = new Date(2026, 10, 17).getTime();
  const nome = d => nomeDaCopia(new Date(2026, 10, 17 - d));
  const velhas = Array.from({ length: 12 }, (_, i) => nome(40 + i));
  const apagar = copiasParaApagar([...velhas, nome(1), "auditoria5s_backup.json", "outro.json"], agora);
  assert.strictEqual(apagar.length, 3);
  assert.ok(apagar.every(n => velhas.includes(n)));
  assert.deepStrictEqual(copiasParaApagar([nome(60), nome(50)], agora), []);
});

test("resumoDoBackup lê updatedAt e a contagem de auditorias", () => {
  const r = resumoDoBackup('{"updatedAt":"2026-11-11T10:00:00.000Z","audits":[{},{}]}', 0);
  assert.strictEqual(r.updatedAt, "2026-11-11T10:00:00.000Z");
  assert.strictEqual(r.count, 2);
  const lixo = resumoDoBackup("não é json", 1000);
  assert.strictEqual(lixo.updatedAt, null);
  assert.strictEqual(lixo.count, null);
});

test("haConflito: sem ficheiro não há; sem versão de partida há sempre; senão compara o updatedAt", () => {
  assert.strictEqual(haConflito({ existe: false }, null), false);
  assert.strictEqual(haConflito({ existe: true, updatedAt: "A" }, null), true);
  assert.strictEqual(haConflito({ existe: true, updatedAt: "A" }, "A"), false);
  assert.strictEqual(haConflito({ existe: true, updatedAt: "B" }, "A"), true);
});

test("idadeFaceAPartida distingue mais recente, mais antiga e desconhecida", () => {
  assert.strictEqual(idadeFaceAPartida("2026-11-12T00:00:00Z", "2026-11-11T00:00:00Z"), "mais-recente");
  assert.strictEqual(idadeFaceAPartida("2026-11-10T00:00:00Z", "2026-11-11T00:00:00Z"), "mais-antiga");
  assert.strictEqual(idadeFaceAPartida(null, "2026-11-11T00:00:00Z"), "desconhecida");
});

test("deveCopiar: de outra origem sempre; da própria só de hora a hora", () => {
  const actual = { existe: true, updatedAt: "A" };
  assert.strictEqual(deveCopiar({ existe: false }, null, null), false);
  assert.strictEqual(deveCopiar(actual, "B", 1000, 2000), true);
  assert.strictEqual(deveCopiar(actual, "A", null, 2000), true);
  assert.strictEqual(deveCopiar(actual, "A", 1000, 2000), false);
  assert.strictEqual(deveCopiar(actual, "A", 0, 3600000), true);
});
