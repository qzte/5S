/* Smoke test (4.8.0): o ficheiro HTML único para testar no PC com duplo clique.
   Gera teste/Auditoria5S-teste.html (scripts/teste-pc.mjs), abre-o por file://
   — como no duplo clique — e confirma que é a versão de teste, que não regista
   o service worker, que grava uma auditoria e que cria o PDF e lê o Excel sem
   rede nem ficheiros à parte. */
import pw from "playwright";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [path.join(raiz, "scripts", "teste-pc.mjs")], { cwd: raiz, stdio: "pipe" });
const URL = pathToFileURL(path.join(raiz, "teste", "Auditoria5S-teste.html")).href;

const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;
const pg = await b.newPage();
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
await pg.goto(URL);

check(/^\[TESTE\] /.test(await pg.title()), "o título devia começar por [TESTE]: " + await pg.title());
check(await pg.locator("#aviso-teste").isVisible(), "o aviso de versão de teste devia estar visível");
check(await pg.evaluate(() => !document.querySelector('link[rel="manifest"]')), "sem manifesto");
check(await pg.evaluate(() => !document.querySelector('script[src]')), "sem ficheiros de script à parte");
await pg.waitForTimeout(500);
/* Em file:// o browser nem deixa consultar os registos (lança); registar, a app
   de teste nem tenta: o código fica desligado. */
check(await pg.evaluate(async () => {
  try { return !navigator.serviceWorker || (await navigator.serviceWorker.getRegistrations()).length === 0; }
  catch (e) { return true; }
}), "não devia registar o service worker");
check(await pg.evaluate(() => [...document.scripts].some(s => s.textContent.includes('if(false&&"serviceWorker" in navigator)'))),
  "o registo do service worker devia estar desligado");

/* Uma auditoria completa, gravada pelo formulário. */
for (const el of await pg.locator("[data-pick]").all()) {
  const max = Number(await el.getAttribute("max"));
  await el.fill(max <= 4 ? String(max) : "0");
}
await escolherServico(pg);
await pg.locator("#btn-save").click();
const r = await pg.evaluate(async () => {
  const a = audits[audits.length - 1];
  const bl = await pdfDaAuditoria(a);
  let xlsx = "ok";
  try { await loadXLSX(); } catch (e) { xlsx = String(e && e.message || e); }
  return { tipo: bl.type, tam: bl.size, xlsx, n: audits.length };
});
check(r.n === 1, "a auditoria devia ficar gravada");
check(r.tipo === "application/pdf" && r.tam > 10000, "o PDF devia ser criado sem ficheiros à parte: " + JSON.stringify(r));
check(r.xlsx === "ok", "o leitor de Excel devia estar disponível: " + r.xlsx);

/* SECURITY.md, ponto 30: o aviso diz para testar com dados de exemplo, e o botão
   apaga os dados de teste (o localStorage e as fotos no IndexedDB). */
check(/dados de exemplo/.test(await pg.locator("#aviso-teste").textContent()), "o aviso devia dizer para testar com dados de exemplo");
await pg.evaluate(() => fotosIDB("readwrite", st => st.put("data:image/png;base64,AAAA", "1#0")));
let confirmou = "";
pg.once("dialog", d => { confirmou = d.message(); d.accept(); });
await Promise.all([pg.waitForEvent("load"), pg.locator("#btn-apagar-teste").click()]);
check(/Apagar todas as auditorias/.test(confirmou), "apagar devia pedir confirmação: " + confirmou);
const depois = await pg.evaluate(async () => ({
  audits: localStorage.getItem("audits"),
  fotos: await new Promise(res => { const q = indexedDB.open("auditoria5s-fotos", 1);
    q.onupgradeneeded = () => q.result.createObjectStore("fotos");
    q.onsuccess = () => { const c = q.result.transaction("fotos").objectStore("fotos").count();
      c.onsuccess = () => { q.result.close(); res(c.result); }; }; })
}));
check(!depois.audits || JSON.parse(depois.audits).length === 0, "depois de apagar não devia haver auditorias: " + depois.audits);
check(depois.fotos === 0, "depois de apagar não devia haver fotos: " + depois.fotos);

await b.close();
if (erros.length) console.log("ERROS:\n" + erros.join("\n"));
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do ficheiro de teste para o PC OK");
process.exit(erros.length || falhas.length ? 1 : 0);
