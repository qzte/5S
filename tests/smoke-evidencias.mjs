/* Smoke test de browser da 3.14.0: evidência por pergunta e cópia de
   segurança com fotos.

   - Numa pergunta classificada Mau, escreve-se uma nota e tira-se uma foto; as
     duas sobrevivem a recarregar a página (rascunho).
   - Gravada a auditoria, o relatório ganha a folha Evidências (e o PDF uma
     folha); as fotos passam do rascunho para a auditoria.
   - Na edição, a foto pode ser removida e volta a poder ser posta.
   - "Exportar com fotos" leva as fotos (recomendações e evidências); depois de
     apagar tudo, importar esse ficheiro repõe-nas. Sem fotos, o ficheiro não
     as leva. */
import pw from "playwright";
import fs from "fs";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
/* O Chromium tem a janela «Guardar como» (showSaveFilePicker), que o
   teste não consegue usar: retira-se, para testar a transferência normal. */
await ctx.addInitScript(() => { delete window.showSaveFilePicker; });
const pg = await ctx.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
pg.on("dialog", d => d.accept(""));
await ligarDialogos(pg, d => {
  if (d.temCampo) return { campo: "3758", botao: "Confirmar" };
  if (d.titulo === "Importar histórico") return "Substituir tudo";
});
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const imagem = { name: "f.png", mimeType: "image/png", buffer: png };
const chaves = () => pg.evaluate(() => new Promise(res => {
  const rq = indexedDB.open("auditoria5s-fotos", 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore("fotos");
  rq.onsuccess = () => { const r = rq.result.transaction("fotos").objectStore("fotos").getAllKeys();
    r.onsuccess = () => { rq.result.close(); res(r.result.map(String)); }; };
}));
const esperar = async (fn, ms = 3000) => { for (let t = 0; t < ms; t += 100) { if (await fn()) return true; await pg.waitForTimeout(100); } return false; };
const folhas = async () => (((await pg.pdf({ format: "A4" })).toString("latin1")).match(/\/Type\s*\/Page[^s]/g) || []).length;

/* ---- 1. Pergunta 1 em Mau: aparece a evidência; nota e foto. ---- */
check(await pg.locator("[data-evid='0']").isHidden(), "sem resposta, não há campo de evidência");
await pg.locator("[data-pick='0']").fill("9");
check(!(await pg.locator("[data-evid='0']").isHidden()), "em Mau, aparece o campo de evidência");
await pg.locator("[data-nota='0']").fill("caixas vazias no corredor 3");
await pg.locator("[data-efile='0']").setInputFiles(imagem);
check(await esperar(async () => await pg.locator("[data-efoto='0'] img").count() === 1), "a foto devia aparecer no formulário");
check(await esperar(async () => (await chaves()).some(k => k.startsWith("rascunho#"))), "a foto devia ir para o rascunho no disco");

/* ---- 2. Recarregar: nota e foto voltam. ---- */
await pg.reload();
check(await pg.locator("[data-nota='0']").inputValue() === "caixas vazias no corredor 3", "a nota devia voltar com o rascunho");
check(await esperar(async () => await pg.locator("[data-efoto='0'] img").count() === 1), "a foto devia voltar com o rascunho");

/* ---- 3. Gravar: folha Evidências, fotos passam para a auditoria. ---- */
for (const el of await pg.locator("[data-pick]").all()) if (!(await el.inputValue())) await el.fill("0");
await escolherServico(pg); await pg.locator("#btn-save").click();
const id = await pg.evaluate(() => audits[0].id);
check(await esperar(async () => await pg.locator("#evid img").count() === 1), "o relatório devia mostrar a foto de evidência");
check((await pg.locator("#evid").textContent()).includes("caixas vazias no corredor 3"), "e a nota");
check(await esperar(async () => { const k = await chaves(); return k.includes(id + "#0") && !k.some(x => x.startsWith("rascunho#")); }),
  "a foto devia ficar em <id>#0 e sair do rascunho: " + (await chaves()).join(", "));
check(await folhas() === 4, "a folha Evidências soma-se às 3 do relatório");

/* Uma foto também na recomendação ao responsável U, para a cópia de segurança. */
await pg.locator("[data-file='U']").setInputFiles(imagem);
check(await esperar(async () => (await chaves()).includes(id + "|U")), "a foto da recomendação devia ficar gravada");

/* ---- 4. Edição: remover a foto, gravar; voltar a pô-la. ---- */
await pg.locator("#btn-edit").click();
await semDialogo(pg);
check(await pg.locator("[data-nota='0']").inputValue() === "caixas vazias no corredor 3", "em edição, a nota vem preenchida");
check(await esperar(async () => await pg.locator("[data-efoto='0'] img").count() === 1), "em edição, a foto vem do disco");
await pg.locator("[data-erm='0']").click();
await escolherServico(pg); await pg.locator("#btn-save").click();
check(await esperar(async () => !(await chaves()).includes(id + "#0")), "remover e gravar devia apagar a foto de evidência");
check(await pg.locator("#evid img").count() === 0 && (await pg.locator("#evid").textContent()).includes("corredor 3"),
  "o relatório fica com a nota, sem a foto");
await pg.locator("#btn-edit").click();
await semDialogo(pg);
await pg.locator("[data-efile='0']").setInputFiles(imagem);
await escolherServico(pg); await pg.locator("#btn-save").click();
check(await esperar(async () => (await chaves()).includes(id + "#0")), "voltar a pôr a foto e gravar devia gravá-la");

/* ---- 5. Cópias: sem fotos e com fotos. ---- */
await pg.locator("[data-v=cfg]").click();
let [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expjson").click()]);
check(!("fotos" in JSON.parse(fs.readFileSync(await dl.path(), "utf8"))), "a cópia normal não leva fotos");
[dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expfotos").click()]);
check(/_com_fotos\.json$/.test(dl.suggestedFilename()), "o ficheiro com fotos tem nome próprio");
const caminho = await dl.path();
const comFotos = JSON.parse(fs.readFileSync(caminho, "utf8"));
check(Array.isArray(comFotos.fotos) && comFotos.fotos.map(f => f.k).sort().join() === [id + "#0", id + "|U"].sort().join(),
  "a cópia com fotos devia levar as duas: " + JSON.stringify((comFotos.fotos || []).map(f => f.k)));
check(comFotos.audits[0].notas[0] === "caixas vazias no corredor 3", "e as notas, com as auditorias");

/* ---- 6. Apagar tudo e importar a cópia com fotos. ---- */
await pg.evaluate(() => new Promise(res => {
  localStorage.clear();
  const rq = indexedDB.open("auditoria5s-fotos", 1);
  rq.onsuccess = () => { const t = rq.result.transaction("fotos", "readwrite"); t.objectStore("fotos").clear();
    t.oncomplete = () => { rq.result.close(); res(); }; };
}));
await pg.reload();
check((await chaves()).length === 0 && await pg.evaluate(() => audits.length) === 0, "o dispositivo devia ficar vazio");
await pg.locator("[data-v=cfg]").click();
await pg.locator("#hist-file").setInputFiles(caminho);
check(await esperar(async () => (await chaves()).length === 2, 8000), "importar devia repor as duas fotos: " + (await chaves()).join(", "));
await semDialogo(pg);
await pg.locator("[data-v=history]").click();
await pg.locator("[data-rep='0']").click();
check(await esperar(async () => await pg.locator("#evid img").count() === 1 && await pg.locator("[data-foto='U'] img").count() === 1),
  "o relatório da auditoria importada devia ter as duas fotos");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke das evidências OK");
process.exit(erros.length || falhas.length ? 1 : 0);
