/* Smoke test de browser da 3.13.0: frequência das auditorias e caixas da app.

   - A frequência escolhe-se na Configuração e grava-se logo.
   - O Histórico mostra os prazos pela urgência, o separador conta os serviços
     por auditar, e o formulário avisa ao escolher um serviço.
   - "Auditar" leva ao formulário com o serviço escolhido.
   - A exportação leva as frequências, e Substituir na importação traz as do
     ficheiro.
   - Nenhum alert()/confirm() nativo: os avisos vêm na caixa da app. */
import pw from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
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
const menos = n => new Date(Date.parse(hoje + "T00:00:00Z") - n * 864e5).toISOString().slice(0, 10);

/* Loja A auditada há 10 dias, Loja B há 2, Loja C nunca. */
await pg.evaluate(([a, b]) => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mk = (id, service, date) => ({ id, service, date, scores: it.map(() => 2), raw: it.map(() => null), tgts: it.map(() => null), items: it });
  localStorage.setItem("audits", JSON.stringify([mk(1, "Loja A", a), mk(2, "Loja B", b)]));
  localStorage.setItem("services", JSON.stringify(["Loja A", "Loja B", "Loja C"]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
}, [menos(10), menos(2)]);
await pg.reload();

/* ---- 1. Sem frequências: nada de prazos. ---- */
await pg.locator("[data-v=history]").click();
check(await pg.locator("#prazos").isHidden(), "sem frequências, não há cartão de prazos");
check(await pg.locator(".tab-badge").count() === 0, "sem frequências, o separador não conta nada");

/* ---- 2. Definir a frequência na Configuração. ---- */
await pg.locator("[data-v=cfg]").click();
check(await pg.locator("[data-freq]").count() === 3, "uma linha por serviço");
await pg.locator("[data-freq='0']").selectOption("7");
await pg.locator("[data-freq='1']").selectOption("7");
await pg.locator("[data-freq='2']").selectOption("30");
const gravadas = await pg.evaluate(() => JSON.parse(localStorage.getItem("freqAud")));
check(JSON.stringify(gravadas) === JSON.stringify([{ s: "Loja A", d: 7 }, { s: "Loja B", d: 7 }, { s: "Loja C", d: 30 }]),
  "as frequências deviam ficar gravadas: " + JSON.stringify(gravadas));

/* ---- 3. Prazos no Histórico, pela urgência; contador no separador. ---- */
await pg.locator("[data-v=history]").click();
const linhas = await pg.locator("#prazos .prazo-row").allTextContents();
check(linhas.length === 3, "três serviços com frequência");
check(/Loja A/.test(linhas[0]) && /Em atraso há 3 dias/.test(linhas[0]), "primeiro o atrasado: " + linhas[0]);
check(/Loja C/.test(linhas[1]) && /Nunca auditado/.test(linhas[1]), "depois o nunca auditado: " + linhas[1]);
check(/Loja B/.test(linhas[2]) && /Em dia/.test(linhas[2]), "por fim o que está em dia: " + linhas[2]);
check((await pg.locator(".tab-badge").textContent()) === "2", "o separador devia contar 2 serviços por auditar");

/* ---- 4. "Auditar" leva ao formulário, com o serviço e o aviso. ---- */
await pg.locator("#prazos .prazo-row", { hasText: "Loja A" }).locator("[data-auditar]").click();
check(!(await pg.locator("#view-audit").isHidden()), "devia abrir o formulário");
check((await pg.locator("#f-service").inputValue()) === "Loja A", "com o serviço escolhido");
check(/Semanal .* Em atraso há 3 dias/.test(await pg.locator("#svc-prazo").textContent()),
  "o formulário devia avisar do atraso: " + await pg.locator("#svc-prazo").textContent());

/* ---- 5. Gravar uma auditoria à Loja A tira-a do atraso. ---- */
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#btn-save").click();
await pg.locator("[data-v=history]").click();
check((await pg.locator(".tab-badge").textContent()) === "1", "depois de auditar a Loja A, sobra 1 por auditar");

/* ---- 6. Os avisos vêm na caixa da app, não em alert() nativo. ---- */
await pg.locator("[data-v=audit]").click();
await pg.locator("#btn-save").click();          /* formulário vazio: "Faltam N itens" */
await semDialogo(pg);
check(caixas.some(c => /Faltam \d+ itens/.test(c.texto)), "o aviso de itens em falta devia vir na caixa da app");

/* ---- 7. Exportar leva as frequências; Substituir traz as do ficheiro. ---- */
await pg.locator("[data-v=cfg]").click();
const [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expjson").click()]);
const exp = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
check(Array.isArray(exp.freqAud) && exp.freqAud.length === 3, "a exportação devia levar as frequências");
exp.freqAud = [{ s: "Loja A", d: 14 }];
const ficheiro = path.join(os.tmpdir(), "5s-import-freq.json");
fs.writeFileSync(ficheiro, JSON.stringify(exp));
await pg.locator("#hist-file").setInputFiles(ficheiro);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("freqAud") || "[]").length === 1, null, { timeout: 5000 }).catch(() => {});
check(JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("freqAud")))) === JSON.stringify([{ s: "Loja A", d: 14 }]),
  "Substituir devia trazer as frequências do ficheiro");
fs.unlinkSync(ficheiro);
await semDialogo(pg);

check(nativos.length === 0, "nenhum diálogo nativo devia aparecer: " + nativos.join(" | "));

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke dos prazos OK");
process.exit(erros.length || falhas.length ? 1 : 0);
