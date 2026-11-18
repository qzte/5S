/* Integridade das bibliotecas do PDF (SECURITY.md, ponto 31): html2canvas 1.4.1
   e jsPDF 4.2.1, em vendor/, como o SheetJS em tests/sheetjs.test.js.

   Fixa cada ficheiro pelo SHA-256 (não mudou desde que foi verificado) e
   confirma que o `integrity` (SRI) do carregador, PDF_LIBS no index.html, é o
   SHA-384 do ficheiro. AO ACTUALIZAR: trocar o ficheiro, o SHA-256 e o tamanho
   abaixo e o `sri` de PDF_LIBS no mesmo commit. */
const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { HTML } = require("./harness.js");

const LIBS = [
  { f: "vendor/html2canvas.min.js", sha256: "e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb", bytes: 198689, versao: /html2canvas 1\.4\.1/ },
  { f: "vendor/jspdf.umd.min.js", sha256: "e3ce1e15903b08835eaa34b210a5bdabc2a3ed259f89d461f8171f9b25ee3cd2", bytes: 420094, versao: /4\.2\.1/ }];

for (const l of LIBS) {
  const buf = fs.readFileSync(path.join(__dirname, "..", l.f));
  test(l.f + ": o ficheiro é o verificado (SHA-256 e tamanho)", () => {
    assert.strictEqual(buf.length, l.bytes);
    assert.strictEqual(crypto.createHash("sha256").update(buf).digest("hex"), l.sha256);
    assert.match(buf.toString("utf8", 0, 4000) + buf.toString("utf8").slice(-4000), l.versao);
  });
  test(l.f + ": o integrity (SRI) do carregador é o do ficheiro", () => {
    const sri = "sha384-" + crypto.createHash("sha384").update(buf).digest("base64");
    const m = new RegExp('\\{src:"\\./' + l.f.replace(/[.]/g, "\\.") + '",sri:"([^"]+)"').exec(HTML);
    assert.ok(m, "PDF_LIBS devia declarar " + l.f);
    assert.strictEqual(m[1], sri);
  });
}
