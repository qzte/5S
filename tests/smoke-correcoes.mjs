/* Smoke test de browser das correcções da 3.22.0: a data da auditoria é a
   local (em Lisboa, à meia-noite e meia de Verão, ainda era «ontem» em UTC);
   «Remover foto» só aparece com foto; o título da página (o nome do PDF)
   segue o relatório aberto; e gravar outra auditoria ao mesmo serviço no
   mesmo dia pede confirmação. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;

/* ---- 1. Data local: 2026-07-01 23:30 UTC é 2 de Julho, 00:30, em Lisboa. ---- */
{
  const ctx = await b.newContext({ timezoneId: "Europe/Lisbon" });
  const pg = await ctx.newPage();
  await pg.clock.setFixedTime(new Date("2026-07-01T23:30:00Z"));
  pg.on("pageerror", e => erros.push(String(e)));
  await pg.goto(URL);
  check(await pg.locator("#f-date").inputValue() === "2026-07-02",
    "à meia-noite e meia em Lisboa, a data devia ser a de hoje: " + await pg.locator("#f-date").inputValue());
  await ctx.close();
}

const ctx = await b.newContext();
const pg = await ctx.newPage();
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
pg.on("dialog", d => d.accept(""));
let fila = [];
const vistos = [];
await ligarDialogos(pg, d => { vistos.push(d); return fila.length ? fila.shift() : undefined; });
await pg.goto(URL);
const nAudits = () => pg.evaluate(() => JSON.parse(localStorage.getItem("audits") || "[]").length);

/* ---- 2. «Remover foto» só com foto. ---- */
await pg.locator("[data-pick='0']").fill("9");   /* Mau: aparece a evidência */
const rm = pg.locator("[data-erm='0']");
check(await rm.isHidden(), "sem foto, «Remover foto» não devia aparecer");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
await pg.locator("[data-efile='0']").setInputFiles({ name: "f.png", mimeType: "image/png", buffer: png });
await pg.waitForFunction(() => !!document.querySelector("[data-eimg='0'] img, [data-evid='0'] img"), null, { timeout: 3000 }).catch(() => {});
await pg.waitForTimeout(300);
check(await rm.isVisible(), "com foto, «Remover foto» devia aparecer");
await rm.click();
check(await rm.isHidden(), "depois de remover, volta a esconder-se");

/* ---- 3. Repetida: o mesmo serviço no mesmo dia pede confirmação. ---- */
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await escolherServico(pg); await pg.locator("#btn-save").click();
check(await nAudits() === 1, "a primeira grava-se sem perguntar");
check(vistos.length === 0, "a primeira não devia pedir confirmação");
check(await pg.title() === "Auditoria 5S - " + await pg.evaluate(() => audits[0].service) + " - " + await pg.evaluate(() => audits[0].date),
  "com o relatório aberto, o título (nome do PDF) leva o serviço e a data: " + await pg.title());
await pg.locator("#btn-back").click();
check(await pg.title() === "Auditoria 5S · Supermercados Kaizen", "ao sair do relatório, o título volta ao da app");
await pg.locator("[data-v=audit]").click();
for (const el of await pg.locator("[data-pick]").all()) await el.fill("2");
fila = ["Cancelar"];
await escolherServico(pg); await pg.locator("#btn-save").click();
await semDialogo(pg);
check(vistos.length === 1 && /Auditoria repetida/.test(vistos[0].titulo), "a segunda no mesmo dia devia pedir confirmação");
check(await nAudits() === 1, "cancelar não grava");
check(await pg.locator("[data-pick='0']").inputValue() === "2", "cancelar não limpa o formulário");
if (await nAudits() !== 1) {   /* gravou sem perguntar: o resto já não faz sentido */
  await b.close();
  console.log("FALHAS:\n" + falhas.join("\n"));
  process.exit(1);
}
fila = ["Gravar também"];
await escolherServico(pg); await pg.locator("#btn-save").click();
await semDialogo(pg);
check(await nAudits() === 2, "confirmar grava a segunda");
/* Editar a primeira sem mudar o dia não conta com ela própria. */
vistos.length = 0;
fila = [{ campo: "3758", botao: "Confirmar" }];
await pg.locator("[data-v=history]").click();
await pg.locator("[data-edit='1']").click();
await semDialogo(pg);
await escolherServico(pg); await pg.locator("#btn-save").click();
await semDialogo(pg).catch(() => {});
check(vistos.filter(d => /Auditoria repetida/.test(d.titulo)).length === 1,
  "editar uma de duas no mesmo dia avisa da outra (e só uma vez): " + vistos.map(d => d.titulo).join(", "));

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke das correcções OK");
process.exit(erros.length || falhas.length ? 1 : 0);
