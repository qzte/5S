/* O gerador do ficheiro de teste para o PC (scripts/teste-pc.mjs) e os pontos
   30 e 31 do SECURITY.md: só embute bibliotecas cujo SHA-384 é o `integrity`
   declarado no index.html, e o ficheiro gerado avisa para testar com dados de
   exemplo e tem um botão para apagar os dados de teste. Corre o script numa
   cópia do repositório, para poder estragar uma biblioteca sem tocar na real. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const RAIZ = path.join(__dirname, "..");
function copia() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "teste-pc-"));
  fs.mkdirSync(path.join(d, "scripts")); fs.mkdirSync(path.join(d, "vendor"));
  for (const f of ["index.html", "scripts/teste-pc.mjs", "vendor/html2canvas.min.js", "vendor/jspdf.umd.min.js", "vendor/xlsx.full.min.js"])
    fs.copyFileSync(path.join(RAIZ, f), path.join(d, f));
  return d;
}
const gerar = d => spawnSync(process.execPath, [path.join(d, "scripts", "teste-pc.mjs")], { cwd: d, encoding: "utf8" });

test("gera o ficheiro quando as bibliotecas são as verificadas", () => {
  const d = copia(), r = gerar(d);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(d, "teste", "Auditoria5S-teste.html")));
});

for (const f of ["vendor/html2canvas.min.js", "vendor/jspdf.umd.min.js", "vendor/xlsx.full.min.js"]) {
  test("recusa embutir " + f + " alterado (o SRI deixa de coincidir)", () => {
    const d = copia();
    fs.appendFileSync(path.join(d, f), "\n/* alterado */");
    const r = gerar(d);
    assert.notStrictEqual(r.status, 0, "devia falhar");
    assert.match(r.stderr, new RegExp(path.basename(f).replace(/[.]/g, "\\.")));
    assert.match(r.stderr, /integrity|SRI/);
    assert.ok(!fs.existsSync(path.join(d, "teste", "Auditoria5S-teste.html")), "não devia gerar o ficheiro");
  });
}

test("o aviso diz para testar com dados de exemplo e tem o botão para os apagar", () => {
  const d = copia(), r = gerar(d);
  assert.strictEqual(r.status, 0, r.stderr);
  const h = fs.readFileSync(path.join(d, "teste", "Auditoria5S-teste.html"), "utf8");
  const aviso = (/<div id="aviso-teste"[\s\S]*?<\/div>/.exec(h) || [""])[0];
  assert.match(aviso, /dados de exemplo/);
  assert.match(aviso, /apag/i);
  assert.match(aviso, /id="btn-apagar-teste"/);
});
