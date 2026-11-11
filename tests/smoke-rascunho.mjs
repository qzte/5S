/* Smoke test de browser da protecção dos dados (v3.8.0): a auditoria em curso
   sobrevive a um recarregar e a um redesenho do formulário, sai do rascunho ao
   ser gravada e pode ser descartada; o lembrete de cópia de segurança aparece
   e desaparece ao exportar; o estado do armazenamento aparece na Configuração;
   e uma mudança de service worker numa página já controlada mostra o aviso de
   nova versão. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const pg = await ctx.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
const BENIGNO = /frame-ancestors/;
pg.on("console", m => {
  if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text());
});
pg.on("dialog", d => d.accept(""));
/* Avisos e confirmações vêm na caixa da app desde 3.13.0: aceita-os todos. */
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const visivel = async sel => !(await pg.locator(sel).isHidden());
const rascunho = () => pg.evaluate(() => localStorage.getItem("rascunho"));

/* ---- 1. Sem nada escrito não há rascunho nem avisos. ---- */
check(!(await visivel("#draft-banner")), "sem respostas não devia haver aviso de rascunho");
check(!(await visivel("#aviso-backup")), "sem auditorias não devia haver lembrete de cópia");
check(await rascunho() === null, "sem respostas não devia haver rascunho gravado");

/* ---- 2. Meia auditoria sobrevive a recarregar a página. ---- */
await pg.locator("#f-verif").fill("Beltrano");
await pg.locator("[data-pick='0']").fill("1");
await pg.locator("[data-pick='1']").fill("2");
check(await rascunho() !== null, "o rascunho devia ser gravado a cada alteração");
check(await visivel("#draft-banner"), "o aviso de rascunho devia aparecer");
await pg.reload();
check(await pg.locator("#f-verif").inputValue() === "Beltrano", "o verificador devia voltar depois de recarregar");
check(await pg.locator("[data-pick='0']").inputValue() === "1", "a resposta 0 devia voltar");
check(await pg.locator("[data-pick='1']").inputValue() === "2", "a resposta 1 devia voltar");
check(/2\/19 itens/.test(await pg.locator("#f-live").inputValue()), "a nota em directo devia contar as 2 respostas");
check(await visivel("#draft-banner"), "depois de recarregar, o aviso de rascunho devia estar visível");

/* ---- 3. Redesenhar o formulário (novo serviço) não apaga as respostas. ---- */
await pg.locator("[data-v=cfg]").click();
await pg.locator("#svc-new").fill("Serviço B (00002)");
await pg.locator("#btn-addsvc").click();
await pg.locator("[data-v=audit]").click();
check(await pg.locator("[data-pick='1']").inputValue() === "2",
  "acrescentar um serviço não devia apagar as respostas já dadas");

/* ---- 4. Descartar limpa o formulário e o rascunho. ---- */
await pg.locator("#btn-descartar").click();
await semDialogo(pg);
check(await rascunho() === null, "descartar devia apagar o rascunho");
check(await pg.locator("[data-pick='0']").inputValue() === "", "descartar devia limpar as respostas");
check(!(await visivel("#draft-banner")), "descartar devia esconder o aviso");

/* ---- 5. Gravar a auditoria tira-a do rascunho. ---- */
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await escolherServico(pg); await pg.locator("#btn-save").click();
check(await rascunho() === null, "uma auditoria gravada não pode continuar no rascunho");
await pg.locator("[data-v=audit]").click();
check(await pg.locator("[data-pick='0']").inputValue() === "", "depois de gravar, o formulário devia vir vazio");
check(!(await visivel("#draft-banner")), "depois de gravar, não devia haver aviso de rascunho");

/* ---- 6. Lembrete de cópia: aparece, e exportar esconde-o. ---- */
check(await visivel("#aviso-backup"), "com uma auditoria e sem exportação, devia aparecer o lembrete");
check(/Ainda não há nenhuma cópia/.test(await pg.locator("#aviso-backup-txt").textContent()),
  "o lembrete devia dizer que não há cópia nenhuma");
const [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-backup-exp").click()]);
check(/^auditorias5s_\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), "exportar devia descarregar o JSON");
check(!(await visivel("#aviso-backup")), "depois de exportar, o lembrete devia desaparecer");
const bk = await pg.evaluate(() => JSON.parse(localStorage.getItem("backup")));
check(bk && bk.pend === 0 && typeof bk.at === "string", "exportar devia registar a data e zerar o pendente");

/* ---- 7. Estado do armazenamento na Configuração. ---- */
await pg.locator("[data-v=cfg]").click();
const armaz = await pg.locator("#data-armaz").textContent();
check(/Espaço ocupado/.test(armaz) && /Protecção contra limpeza automática/.test(armaz) &&
  /Última cópia de segurança/.test(armaz) && !/Última cópia de segurança: nunca/.test(armaz),
  "a Configuração devia mostrar ocupação, protecção e a data da última cópia: " + armaz);

/* ---- 8. Aviso de nova versão. ----
   A primeira mudança de controlador (a instalação) não avisa; uma seguinte sim.
   Simula-se a seguinte com o próprio evento, numa página já controlada. */
/* O service worker pode ficar activo sem nunca controlar esta página: se ela
   foi recarregada (passo 2) enquanto ele se instalava, o clients.claim() não
   a apanha, e o controllerchange não chega. Esperava-se por ele para sempre
   (o passo encravava até ao tempo máximo da CI). Espera-se um pouco; se não
   vier, recarrega-se: uma página aberta com o service worker activo nasce
   controlada por ele, sem mudança de controlador. */
const controlada = () => pg.evaluate(async () => {
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return true;
  return new Promise(r => {
    navigator.serviceWorker.addEventListener("controllerchange", () => r(true), { once: true });
    setTimeout(() => r(!!navigator.serviceWorker.controller), 5000);
  });
});
if (!(await controlada())) {
  await pg.reload();
  check(await controlada(), "depois de recarregar, a página devia estar controlada pelo service worker");
}
check(!(await visivel("#aviso-versao")), "a instalação inicial do service worker não devia avisar");
await pg.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event("controllerchange")));
check(await visivel("#aviso-versao"), "uma mudança de service worker devia mostrar o aviso de nova versão");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do rascunho OK");
process.exit(erros.length || falhas.length ? 1 : 0);
