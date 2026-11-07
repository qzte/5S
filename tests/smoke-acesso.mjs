/* Smoke test de browser da 3.19.0: código de acesso próprio do dispositivo
   (mudar, recusar códigos fracos ou trocados, o de origem deixar de abrir,
   sobreviver a recarregar, ficar fora da cópia de segurança, voltar ao de
   origem) e o espaço ocupado com o total da app, fotos incluídas. */
import pw from "playwright";
import fs from "fs";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const ORIGEM = "3758", NOVO = "2468";
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
/* Cada caixa leva a resposta seguinte da fila; sem fila, o botão por omissão. */
let fila = [];
const vistos = [];
await ligarDialogos(pg, d => { vistos.push(d); return fila.length ? fila.shift() : undefined; });
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const pin = () => pg.evaluate(() => localStorage.getItem("pinAcesso"));
const estado = () => pg.locator("#pin-estado").textContent();
const codigo = c => ({ campo: c, botao: "Confirmar" });
const abreEditor = async c => {
  await pg.evaluate(() => document.getElementById("ed-panel").classList.add("hidden"));
  fila = [codigo(c)];
  await pg.locator("#btn-askpin").click();
  await semDialogo(pg);
  return !(await pg.locator("#ed-panel").isHidden());
};

await pg.locator("[data-v=cfg]").click();

/* ---- 1. De origem: o estado di-lo, e não há «voltar ao de origem». ---- */
check(/código de origem/.test(await estado()), "sem código próprio, devia dizer que usa o de origem");
check(await pg.locator("#btn-pinrepor").isHidden(), "sem código próprio, não há para onde voltar");
check(await abreEditor(ORIGEM), "o código de origem devia abrir o editor");

/* ---- 2. Códigos fracos ou trocados não ficam. ---- */
fila = [codigo(ORIGEM), { campo: "1234", botao: "Seguinte" }];
await pg.locator("#btn-pinmudar").click();
await semDialogo(pg);
check(await pin() === null, "uma sequência não pode ficar como código");
fila = [codigo(ORIGEM), { campo: "1357", botao: "Seguinte" }, { campo: "1358", botao: "Guardar código" }];
await pg.locator("#btn-pinmudar").click();
await semDialogo(pg);
check(await pin() === null, "uma confirmação diferente não pode mudar o código");
fila = [codigo("0000")];
await pg.locator("#btn-pinmudar").click();
await semDialogo(pg);
check(await pin() === null, "sem o código actual não se muda o código");

/* ---- 3. Mudar: o novo abre, o de origem deixa de abrir. ---- */
fila = [codigo(ORIGEM), { campo: NOVO, botao: "Seguinte" }, { campo: NOVO, botao: "Guardar código" }];
await pg.locator("#btn-pinmudar").click();
await semDialogo(pg);
const guardado = await pin();
check(guardado !== null && !guardado.includes(NOVO), "o código devia ficar guardado, e não à vista: " + guardado);
check(/código próprio/.test(await estado()), "o estado devia dizer que há código próprio");
check(!(await pg.locator("#btn-pinrepor").isHidden()), "com código próprio, devia haver «voltar ao de origem»");
check(!(await abreEditor(ORIGEM)), "depois de mudar, o código de origem não pode abrir o editor");
check(await abreEditor(NOVO), "o código novo devia abrir o editor");

/* ---- 4. Sobrevive a recarregar; não vai na cópia de segurança. ---- */
await pg.reload();
await pg.locator("[data-v=cfg]").click();
check(!(await abreEditor(ORIGEM)) && await abreEditor(NOVO), "depois de recarregar, continua a valer o novo");
const [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expjson").click()]);
const copia = fs.readFileSync(await dl.path(), "utf8");
check(!/pinAcesso/.test(copia) && !copia.includes(JSON.parse(guardado).h), "a cópia de segurança não pode levar o código");

/* ---- 5. Voltar ao de origem pede o código actual. ---- */
fila = [codigo(ORIGEM)];
await pg.locator("#btn-pinrepor").click();
await semDialogo(pg);
check(await pin() !== null, "voltar ao de origem sem o código actual não pode resultar");
fila = [codigo(NOVO), "Voltar ao de origem"];
await pg.locator("#btn-pinrepor").click();
await semDialogo(pg);
check(await pin() === null, "voltar ao de origem devia apagar o código próprio");
check(/código de origem/.test(await estado()) && await abreEditor(ORIGEM), "e o de origem devia voltar a abrir");

/* ---- 6. Espaço ocupado: auditorias e o total da app. ---- */
await pg.waitForFunction(() => /Total da app, com as fotos/.test(document.getElementById("data-armaz").textContent),
  null, { timeout: 5000 }).catch(() => {});
const armaz = await pg.locator("#data-armaz").textContent();
check(/Auditorias e configuração: .*% dos ~5 MB/.test(armaz), "devia mostrar o localStorage: " + armaz);
check(/Total da app, com as fotos: [\d,]+ [KMG]?B de [\d,]+ [KMG]B disponíveis \(\d+%\)/.test(armaz),
  "devia mostrar o total da app e a quota: " + armaz);

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do código de acesso OK");
process.exit(erros.length || falhas.length ? 1 : 0);
