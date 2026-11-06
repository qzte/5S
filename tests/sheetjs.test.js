/* Integridade do SheetJS (v3.5.2; ficheiro próprio desde 3.11.0).

   O SheetJS é a única dependência de produção desta aplicação e está *vendored*:
   até 3.10.x vivia como um bloco de ~930 KB dentro do `index.html`; desde
   3.11.0 é o ficheiro `vendor/xlsx.full.min.js`, carregado só ao importar ou
   exportar Excel — byte a byte o mesmo bloco, pelo que o SHA-256 abaixo é o
   que já estava fixado. Isso tem uma consequência de cadeia de fornecimento que
   nenhuma das outras verificações apanha:

   - não há `package.json` que o declare, pelo que `npm audit` — e qualquer
     ferramenta que leia um manifesto — é CEGA a este componente;
   - o pacote `xlsx` no npm ficou congelado em 0.18.5, por isso a biblioteca só
     sai de `cdn.sheetjs.com` e não há registo público contra o qual comparar;
   - o bloco é ilegível a olho e enorme, pelo que uma alteração de uma linha no
     meio dele não se distingue de ruído numa revisão de código.

   Este teste fixa o bloco pelo seu SHA-256. Não prova a proveniência — para
   isso é preciso comparar com a distribuição oficial, o que está descrito em
   SECURITY.md e se faz à mão ao actualizar — mas prova que o bloco NÃO MUDOU
   desde que foi verificado. Qualquer alteração, deliberada ou não, faz a CI
   falhar em vez de passar despercebida.

   AO ACTUALIZAR O SHEETJS: obter a distribuição oficial de cdn.sheetjs.com,
   comparar com vendor/xlsx.full.min.js, correr `node tests/sheetjs.test.js`
   para ler o novo SHA-256 na mensagem de erro, e só então actualizar as
   constantes abaixo E o XLSX_SRI do index.html (o teste diz qual é) — no mesmo
   commit que troca a biblioteca, nunca noutro. */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { HTML } = require("./harness.js");
const FICHEIRO = path.join(__dirname, "..", "vendor", "xlsx.full.min.js");

/* Versão verificada e o seu SHA-256. Ver o cabeçalho antes de mexer. */
const VERSAO = "0.20.3";
const SHA256 = "cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41";
const BYTES = 951904;

const MARCA = "/*! xlsx.js (C) 2013-present SheetJS";

test("o SheetJS não foi alterado", () => {
  const blob = fs.readFileSync(FICHEIRO);
  assert.ok(blob.subarray(0, MARCA.length).toString() === MARCA,
    "o ficheiro devia começar pelo cabeçalho de direitos de autor do SheetJS");
  const sha = crypto.createHash("sha256").update(blob).digest("hex");
  assert.strictEqual(sha, SHA256,
    "O bloco do SheetJS mudou.\n" +
    "  esperado: " + SHA256 + " (" + BYTES + " bytes, v" + VERSAO + ")\n" +
    "  obtido:   " + sha + " (" + blob.length + " bytes)\n" +
    "Se a alteração é intencional (actualização da biblioteca), confirme a\n" +
    "proveniência contra cdn.sheetjs.com e actualize VERSAO/SHA256/BYTES neste\n" +
    "ficheiro, no MESMO commit. Se não é intencional, não a aceite.");
  assert.strictEqual(blob.length, BYTES, "o tamanho do bloco mudou");
});

test("a versão anunciada no comentário é a que está fixada aqui", () => {
  /* Guarda contra a incoerência mais fácil de deixar passar: actualizar o
     comentário do index.html e esquecer as constantes deste ficheiro, ou o
     inverso. O comentário fica junto do carregador (XLSX_SRC). */
  const i = HTML.indexOf('const XLSX_SRC=');
  assert.notStrictEqual(i, -1, "o index.html já não tem o carregador do SheetJS");
  assert.ok(HTML.slice(Math.max(0, i - 1500), i).includes("SheetJS v" + VERSAO),
    "o comentário do index.html não anuncia a versão " + VERSAO);
});

test("o integrity (SRI) do carregador é o do ficheiro", () => {
  /* Sem isto, actualizar o ficheiro e esquecer o XLSX_SRI faria o browser
     recusar o SheetJS — e a importação e a exportação de Excel deixariam de
     funcionar sem que nenhum outro teste desse por isso. */
  const sri = "sha384-" + crypto.createHash("sha384").update(fs.readFileSync(FICHEIRO)).digest("base64");
  const m = HTML.match(/const XLSX_SRI="([^"]+)";/);
  assert.ok(m, "o index.html devia declarar XLSX_SRI");
  assert.strictEqual(m[1], sri, "XLSX_SRI devia ser " + sri);
});

test("o SheetJS deixou de vir embutido no index.html", () => {
  assert.strictEqual(HTML.indexOf(MARCA), -1,
    "o SheetJS voltou a estar dentro do index.html: é lido a cada arranque");
});

test("as CVE conhecidas do SheetJS estão fechadas nesta versão", () => {
  /* CVE-2023-30533 (prototype pollution) corrigida em 0.19.3;
     CVE-2024-22363 (ReDoS) corrigida em 0.20.2. Ambas anteriores a 0.20.3.
     O teste é sobre o NÚMERO de versão, para que uma descida de versão — o
     erro plausível, não o improvável — falhe aqui. */
  const [maj, min, pat] = VERSAO.split(".").map(Number);
  const ge = (a, b, c) => maj > a || (maj === a && (min > b || (min === b && pat >= c)));
  assert.ok(ge(0, 19, 3), "CVE-2023-30533 exige >= 0.19.3");
  assert.ok(ge(0, 20, 2), "CVE-2024-22363 exige >= 0.20.2");
});
