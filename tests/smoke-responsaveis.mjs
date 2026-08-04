/* Smoke test de browser da lista editável de responsáveis (v3.5.0):
   acrescentar um responsável, guardá-lo com o código de acesso, vê-lo chegar ao
   selector da edição e ao radar, e não conseguir removê-lo enquanto estiver em
   uso. A segunda metade cobre a importação: um ficheiro com um responsável que
   este dispositivo não conhece tem de o trazer consigo, senão as perguntas dele
   chegavam atribuídas ao responsável de recurso. */
import pw from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const pg = await b.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
/* Ruído conhecido e pré-existente: frame-ancestors não é aplicável via <meta>. */
const BENIGNO = /frame-ancestors/;
pg.on("console", m => {
  if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text());
});

const PIN = "3758";
/* Os prompt() são de dois tipos: o código de acesso e o modo de importação.
   Distinguem-se pelo texto, e o último diálogo fica guardado para ser inspeccionado. */
let modoImport = "F";
let ultimo = "";
pg.on("dialog", d => {
  ultimo = d.message();
  if (d.type() !== "prompt") return d.accept("");
  d.accept(/Escreva:/.test(d.message()) ? modoImport : PIN);
});
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const resps = () => pg.evaluate(() => JSON.parse(localStorage.getItem("resps") || "null"));

/* ---- 1. A lista de origem aparece na Configuração. ---- */
await pg.locator("[data-v=cfg]").click();
check(await pg.locator("[data-respn]").count() === 5,
  "a Configuração devia listar os cinco responsáveis de origem");

/* ---- 2. Um responsável em uso não pode ser removido. ---- */
await pg.locator("[data-resprm='0']").click();
check(/não pode ser removido/.test(ultimo) && /pergunta/.test(ultimo),
  "remover um responsável em uso tem de ser recusado, dizendo onde está o uso");
check(await pg.locator("[data-respn]").count() === 5, "a lista não pode encolher");

/* ---- 3. Acrescentar um responsável e guardar (pede o código). ---- */
await pg.locator("#resp-newk").fill("L");
await pg.locator("#resp-newn").fill("Logística");
await pg.locator("#btn-addresp").click();
check(await pg.locator("[data-respn]").count() === 6, "o rascunho devia ganhar a linha nova");
check(await resps() === null, "acrescentar ao rascunho não pode gravar nada");
await pg.locator("#btn-saveresp").click();
const guardados = await resps();
check(Array.isArray(guardados) && guardados.length === 6, "guardar devia persistir os seis");
check(guardados[5].k === "L" && guardados[5].n === "Logística",
  "o responsável novo devia ficar no fim, para não trocar a ordem dos eixos");

/* ---- 4. Chega ao editor de perguntas e à edição de uma auditoria. ---- */
await pg.locator("[data-v=audit]").click();
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#btn-save").click();
check(await pg.locator("[data-rec]").count() === 6,
  "o relatório devia ter um bloco de recomendações por responsável");
await pg.locator("#btn-edit").click();
const opcoes = await pg.locator("[data-edresp='0'] option").allTextContents();
check(opcoes.includes("Logística"), "o selector da edição devia oferecer o responsável novo");
await pg.locator("[data-edresp='0']").selectOption("L");
await pg.locator("#btn-save").click();
const a = await pg.evaluate(() => JSON.parse(localStorage.getItem("audits"))[0]);
check(a.items[0].r === "L", "a atribuição nova devia ficar gravada na auditoria");
check((await pg.locator("#view-report .page-1 .card").nth(1).textContent()).includes("Logística"),
  "o radar por responsável devia ganhar o eixo novo");

/* ---- 5. Agora está em uso numa auditoria: também não sai. ---- */
await pg.locator("[data-v=cfg]").click();
await pg.locator("[data-resprm='5']").click();
check(/não pode ser removido/.test(ultimo) && /auditoria/.test(ultimo),
  "um responsável usado por uma auditoria gravada não pode ser removido");

/* ---- 6. Importar um ficheiro com um responsável desconhecido. ---- */
const ficheiro = path.join(os.tmpdir(), "5s-import-resps.json");
fs.writeFileSync(ficheiro, JSON.stringify({
  app: "auditoria5s", version: "3.5.0",
  resps: [{ k: "Z", n: "Zona Fria" }],
  services: ["Outro (99999)"],
  audits: [{
    id: 987654, service: "Outro (99999)", date: "2026-01-15",
    scores: [2, 1], raw: [0, 1], tgts: [null, null],
    items: [
      { p: 0, n: 1, t: "A", r: "Z", c: "Pergunta da zona fria", tp: "count", t1: 4, t2: 1, t3: 0, max: 99 },
      { p: 1, n: 2, t: "B", r: "U", c: "Outra pergunta", tp: "count", t1: 3, t2: 1, t3: 0, max: 99 }
    ]
  }]
}));
await pg.locator("#hist-file").setInputFiles(ficheiro);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("audits") || "[]").length === 2);
const depois = await resps();
check(depois.some(r => r.k === "Z"),
  "o responsável que só existe no ficheiro tem de ser trazido com ele");
check(depois.length === 7 && depois[0].k === "U",
  "fundir acrescenta no fim e mantém os de casa");
const imp = await pg.evaluate(() =>
  JSON.parse(localStorage.getItem("audits")).find(x => x.id === 987654));
check(imp.items[0].r === "Z",
  "sem a lista do ficheiro, esta pergunta chegaria atribuída ao responsável de recurso");
fs.unlinkSync(ficheiro);

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke dos responsáveis OK");
process.exit(erros.length || falhas.length ? 1 : 0);
