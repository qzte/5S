/* Smoke test de browser da 3.18.0: o aviso de cópia de segurança conta as
   fotos, e remover um serviço ou uma pessoa tem Desfazer.

   - Uma foto nova, nunca copiada, faz aparecer o aviso com "Exportar com
     fotos"; exportar com fotos tira-o; exportar SEM fotos não o tira.
   - Quem já tinha fotos de antes desta versão é avisado no primeiro arranque.
   - As fotos de evidência de uma auditoria nova contam.
   - Remover um serviço ou uma pessoa: Desfazer repõe-no no mesmo sítio (o
     serviço com o seu tipo); sem desfazer, fica removido, e o tipo
     sai com ele. */
import pw from "playwright";
import { ligarDialogos } from "./dialogos.mjs";
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
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const imagem = { name: "f.png", mimeType: "image/png", buffer: png };
const backup = () => pg.evaluate(() => JSON.parse(localStorage.getItem("backup") || "{}"));
const esperar = async (fn, ms = 3000) => { for (let t = 0; t < ms; t += 100) { if (await fn()) return true; await pg.waitForTimeout(100); } return false; };
const aviso = () => pg.locator("#aviso-backup-txt").textContent();
const visivel = async sel => !(await pg.locator(sel).isHidden());

/* Uma auditoria, e uma cópia normal acabada de fazer: sem aviso nenhum. */
await pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  localStorage.setItem("audits", JSON.stringify([{ id: 1, service: "Loja A", date: "2026-11-01",
    scores: it.map(() => 1), raw: it.map(() => null), tgts: it.map(() => null), items: it }]));
  localStorage.setItem("services", JSON.stringify(["Loja A", "Loja B", "Loja C"]));
  localStorage.setItem("people", JSON.stringify(["Ana", "Rui"]));
  localStorage.setItem("tipoSvc", JSON.stringify([{ s: "Loja B", t: "e" }]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0, pendFotos: 0 }));
});
await pg.reload();
check(!(await visivel("#aviso-backup")), "com a cópia em dia e sem fotos, não há aviso");

/* ---- 1. Uma foto nova: aviso das fotos, e o botão exporta com fotos. ---- */
await pg.locator("[data-v=history]").click();
await pg.locator("[data-rep='0']").click();
await pg.locator("[data-file='U']").setInputFiles(imagem);
check(await esperar(async () => (await backup()).pendFotos === 1), "a foto devia contar para a cópia: " + JSON.stringify(await backup()));
check(await esperar(() => visivel("#aviso-backup")), "uma foto nunca copiada devia fazer aparecer o aviso");
check(/^Há 1 foto .* nunca entrou numa cópia/.test(await aviso()), "o aviso devia falar da foto: " + await aviso());
check(await pg.locator("#btn-backup-exp").textContent() === "Exportar com fotos", "o botão devia exportar com fotos");
const [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-backup-exp").click()]);
check(/_com_fotos\.json$/.test(dl.suggestedFilename()), "o botão do aviso devia gerar a cópia com fotos");
check(!(await visivel("#aviso-backup")), "depois da cópia com fotos, o aviso desaparece");
const b1 = await backup();
check(b1.pendFotos === 0 && b1.atFotos, "a cópia com fotos devia ficar registada: " + JSON.stringify(b1));

/* ---- 2. Uma cópia SEM fotos não tira o aviso das fotos. ---- */
await pg.evaluate(() => {
  const b = JSON.parse(localStorage.getItem("backup"));
  b.pendFotos = 6; localStorage.setItem("backup", JSON.stringify(b)); mostrarAvisoBackup();
});
check(/^6 fotos novas ou trocadas/.test(await aviso()), "6 fotos por copiar deviam dar aviso");
await pg.locator("[data-v=cfg]").click();
await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expjson").click()]);
check(await visivel("#aviso-backup") && /fotos novas/.test(await aviso()), "a cópia normal não pode tirar o aviso das fotos");
check((await backup()).pendFotos === 6, "nem zerar as fotos por copiar");
check(/com fotos: <b>/.test(await pg.locator("#data-armaz").innerHTML()), "a Config devia mostrar a última cópia com fotos");

/* ---- 3. Fotos de antes desta versão: contadas no primeiro arranque. ---- */
await pg.evaluate(() => localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 })));
await pg.reload();
check(await esperar(async () => (await backup()).pendFotos === 1), "a foto que já existia devia ser contada: " + JSON.stringify(await backup()));
check(await esperar(() => visivel("#aviso-backup")), "e o aviso aparecer");

/* ---- 4. As fotos de evidência de uma auditoria nova contam. ---- */
await pg.evaluate(() => localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0, pendFotos: 0, atFotos: new Date().toISOString() })));
await pg.reload();
await pg.locator("[data-pick='0']").fill("9");
await pg.locator("[data-efile='0']").setInputFiles(imagem);
await esperar(async () => await pg.locator("[data-efoto='0'] img").count() === 1);
for (const el of await pg.locator("[data-pick]").all()) if (!(await el.inputValue())) await el.fill("0");
await escolherServico(pg); await pg.locator("#btn-save").click();
check(await esperar(async () => (await backup()).pendFotos === 1), "a foto de evidência devia contar: " + JSON.stringify(await backup()));

/* ---- 5. Remover um serviço: Desfazer repõe-no, com o tipo. ---- */
const svcs = () => pg.evaluate(() => JSON.parse(localStorage.getItem("services")));
const tipos = () => pg.evaluate(() => JSON.parse(localStorage.getItem("tipoSvc") || "[]"));
await pg.locator("[data-v=cfg]").click();
await pg.locator("[data-rmsvc='1']").click();
check(JSON.stringify(await svcs()) === '["Loja A","Loja C"]', "o × devia remover a Loja B");
check(await visivel("#toast") && /Serviço removido: Loja B/.test(await pg.locator("#toast-txt").textContent()), "com Desfazer");
await pg.locator("#toast-btn").click();
check(JSON.stringify(await svcs()) === '["Loja A","Loja B","Loja C"]', "Desfazer devia repô-la no mesmo sítio");
check((await tipos()).some(f => f.s === "Loja B"), "com o tipo");
await pg.locator("[data-rmsvc='1']").click();
await pg.evaluate(() => concluirApagar());          /* o mesmo que esperar os 10 s */
check(JSON.stringify(await svcs()) === '["Loja A","Loja C"]', "sem desfazer, fica removida");
check(!(await tipos()).some(f => f.s === "Loja B"), "e o tipo sai com ela");

/* ---- 6. Remover uma pessoa; uma remoção nova confirma a anterior. ---- */
const ppl = () => pg.evaluate(() => JSON.parse(localStorage.getItem("people")));
await pg.locator("[data-rmppl='0']").click();
check(JSON.stringify(await ppl()) === '["Rui"]' && /Pessoa removida: Ana/.test(await pg.locator("#toast-txt").textContent()),
  "o × devia remover a Ana, com Desfazer");
await pg.locator("[data-rmsvc='0']").click();      /* outra remoção: a da Ana fica confirmada */
check(/Serviço removido: Loja A/.test(await pg.locator("#toast-txt").textContent()), "o aviso passa a ser o da remoção nova");
await pg.locator("#toast-btn").click();
check(JSON.stringify(await svcs()) === '["Loja A","Loja C"]', "Desfazer repõe a última remoção");
check(JSON.stringify(await ppl()) === '["Rui"]', "e a anterior fica confirmada");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke das cópias e do Desfazer OK");
process.exit(erros.length || falhas.length ? 1 : 0);
