/* Smoke test de browser da 4.0.0: indicadores do ano e caixas da app.
   (Substitui o da frequência das auditorias, 3.13.0, que saiu.)

   - O tipo de cada serviço (interno ou externo) escolhe-se em Config →
     Serviços, e o objectivo anual no seu cartão; gravam-se logo.
   - Já não há frequência, prazos nem email de cada serviço.
   - A Análise mostra a média total, os serviços abaixo dela (com o botão que
     abre o plano de acção), o objectivo e a média semanal, e os internos e
     externos auditados face aos que existem.
   - A exportação leva o tipo e o objectivo, e Substituir traz os do ficheiro.
   - Nenhum alert()/confirm() nativo: os avisos vêm na caixa da app. */
import pw from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
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
const erros = [], nativos = [], caixas = [];
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
pg.on("dialog", d => { nativos.push(d.type() + ": " + d.message()); d.accept(""); });
await ligarDialogos(pg, d => {
  caixas.push(d);
  if (d.temCampo) return { campo: "3758", botao: "Confirmar" };
  if (d.titulo === "Importar histórico") return "Substituir tudo";
});
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const hoje = await pg.evaluate(() => hojeISO());
const ano = Number(hoje.slice(0, 4));

/* Loja A: 100; Loja B: 0; Loja C (externa): 100; Loja D nunca auditada.
   Uma auditoria do ano anterior, que não conta. */
await pg.evaluate(([ano, hoje]) => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mk = (id, service, date, s) => ({ id, service, date, scores: it.map(() => s), raw: it.map(() => null), tgts: it.map(() => null), items: it, finalizada: date });
  localStorage.setItem("audits", JSON.stringify([mk(1, "Loja A", ano + "-01-02", 2), mk(2, "Loja B", ano + "-01-03", 0),
    mk(3, "Loja C", hoje, 2), mk(4, "Loja D", (ano - 1) + "-06-01", 2)]));
  localStorage.setItem("services", JSON.stringify(["Loja A", "Loja B", "Loja C", "Loja D"]));
  localStorage.setItem("freqAud", JSON.stringify([{ s: "Loja A", d: 7 }]));     /* de uma versão anterior: ignorada */
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
}, [ano, hoje]);
await pg.reload();

/* ---- 1. Sem frequência nem prazos. ---- */
await pg.locator("[data-v=history]").click();
check(await pg.locator("#prazos").count() === 0, "o cartão dos prazos saiu");
check(await pg.locator(".tab-badge").count() === 0, "o Histórico não conta serviços por auditar");
await pg.locator("[data-v=cfg]").click();
check(await pg.locator("#card-freq, [data-freq], [data-email]").count() === 0, "a frequência e o email saíram da Config");

/* ---- 2. Tipo de cada serviço e objectivo anual. ---- */
check(await pg.locator("#svc-list [data-tipo]").count() === 4, "um tipo por serviço");
await pg.locator("[data-tipo='0']").selectOption("i");
await pg.locator("[data-tipo='1']").selectOption("i");
await pg.locator("[data-tipo='2']").selectOption("e");
await pg.locator("[data-tipo='3']").selectOption("e");
const tipos = await pg.evaluate(() => JSON.parse(localStorage.getItem("tipoSvc")));
check(JSON.stringify(tipos) === JSON.stringify([{ s: "Loja A", t: "i" }, { s: "Loja B", t: "i" }, { s: "Loja C", t: "e" }, { s: "Loja D", t: "e" }]),
  "os tipos deviam ficar gravados: " + JSON.stringify(tipos));
check(await pg.locator("#obj-ano").inputValue() === String(ano), "o objectivo abre no ano corrente");
await pg.locator("#obj-n").fill("0");
await pg.locator("#obj-n").press("Tab");
await semDialogo(pg);
check(!(await pg.evaluate(() => localStorage.getItem("objAud"))), "um objectivo de 0 não se grava");
await pg.locator("#obj-n").fill("52");
await pg.locator("#obj-n").press("Tab");
check(JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("objAud")))) === JSON.stringify([{ a: ano, n: 52 }]),
  "o objectivo fica gravado");
check(/1 auditorias por semana/.test(await pg.locator("#obj-info").textContent()), "diz quantas por semana: " + await pg.locator("#obj-info").textContent());

/* ---- 3. Os indicadores na Análise. ---- */
await pg.locator("[data-v=stats]").click();
check(await pg.locator("#an-ano").inputValue() === String(ano), "os indicadores abrem no ano corrente");
check(/67\/100/.test(await pg.locator("#kpi-media").textContent()), "média total do ano (100, 0, 100): " + await pg.locator("#kpi-media").textContent());
check(/3 de 52/.test(await pg.locator("#kpi-objetivo").textContent()), "auditorias face ao objectivo: " + await pg.locator("#kpi-objetivo").textContent());
check(await pg.locator("#kpi-semanal").count() === 1 && await pg.locator("#kpi-plano").count() === 1, "média semanal e face ao plano");
const abaixo = await pg.locator("#kpi-abaixo .kpi-linha").allTextContents();
check(abaixo.length === 1 && /Loja B/.test(abaixo[0]), "só a Loja B está abaixo da média: " + abaixo.join(" | "));
check(/Internos: 2 de 2/.test(await pg.locator("#kpi-int").textContent()), "internos: " + await pg.locator("#kpi-int").textContent());
check(/Externos: 1 de 2/.test(await pg.locator("#kpi-ext").textContent()) && /Por auditar: Loja D/.test(await pg.locator("#kpi-ext").textContent()),
  "externos: " + await pg.locator("#kpi-ext").textContent());
/* O ano anterior: só a Loja D, sem objectivo. */
await pg.locator("#an-ano").selectOption(String(ano - 1));
check(/100\/100/.test(await pg.locator("#kpi-media").textContent()), "no ano anterior, só a auditoria desse ano");
check(/Defina-o/.test(await pg.locator("#kpi-objetivo").textContent()), "sem objectivo nesse ano");
await pg.locator("#an-ano").selectOption(String(ano));
/* «Plano de acção» abre o relatório da última auditoria ao serviço. */
await pg.locator("[data-kpi-plano='0']").click();
check(await pg.locator("#view-report").isVisible() && /Loja B/.test(await pg.locator("#plano").textContent()),
  "o botão abre o plano de acção da Loja B");

/* ---- 4. Os avisos vêm na caixa da app, não em alert() nativo. ---- */
await pg.locator("[data-v=audit]").click();
await escolherServico(pg); await pg.locator("#btn-save").click();          /* formulário vazio: "Faltam N itens" */
await semDialogo(pg);
check(caixas.some(c => /Faltam \d+ itens/.test(c.texto)), "o aviso de itens em falta devia vir na caixa da app");

/* ---- 5. Exportar leva o tipo e o objectivo; Substituir traz os do ficheiro. ---- */
await pg.locator("[data-v=cfg]").click();
const [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expjson").click()]);
const exp = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
check(Array.isArray(exp.tipoSvc) && exp.tipoSvc.length === 4, "a exportação devia levar os tipos");
check(Array.isArray(exp.objAud) && exp.objAud.length === 1, "e o objectivo");
check(!("freqAud" in exp) && !("emailsSvc" in exp), "e já não leva frequências nem emails");
exp.tipoSvc = [{ s: "Loja A", t: "e" }];
exp.objAud = [{ a: ano, n: 10 }];
const ficheiro = path.join(os.tmpdir(), "5s-import-indicadores.json");
fs.writeFileSync(ficheiro, JSON.stringify(exp));
await pg.locator("#hist-file").setInputFiles(ficheiro);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("tipoSvc") || "[]").length === 1, null, { timeout: 5000 }).catch(() => {});
check(JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("tipoSvc")))) === JSON.stringify([{ s: "Loja A", t: "e" }]),
  "Substituir devia trazer os tipos do ficheiro");
check(JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("objAud")))) === JSON.stringify([{ a: ano, n: 10 }]),
  "e o objectivo do ficheiro");
fs.unlinkSync(ficheiro);
await semDialogo(pg);

check(nativos.length === 0, "nenhum diálogo nativo devia aparecer: " + nativos.join(" | "));

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke dos indicadores OK");
process.exit(erros.length || falhas.length ? 1 : 0);
