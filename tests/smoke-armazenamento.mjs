/* Smoke test de browser da 3.11.0: armazenamento compacto e SheetJS a pedido.

   - Auditorias gravadas por versões anteriores (cada uma com a sua cópia das
     perguntas) são regravadas no arranque no formato compacto, sem perder nada
     e com cada uma a manter AS SUAS perguntas.
   - Cabem agora 5 000 auditorias (MAX_AUDITS) no localStorage, que antes
     enchia por volta das 1 700.
   - O SheetJS não carrega no arranque; carrega ao exportar para Excel, e
     também sem rede, a partir da cache do service worker. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
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
const BENIGNO = /frame-ancestors|ERR_INTERNET_DISCONNECTED/;
pg.on("console", m => {
  if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text());
});
pg.on("dialog", d => d.accept(""));
/* Avisos e confirmações vêm na caixa da app desde 3.13.0: aceita-os todos. */
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const cru = () => pg.evaluate(() => ({
  audits: JSON.parse(localStorage.getItem("audits") || "[]"),
  sets: JSON.parse(localStorage.getItem("perguntasAud") || "{}"),
  chars: (localStorage.getItem("audits") || "").length + (localStorage.getItem("perguntasAud") || "").length
}));

/* ---- 1. Formato antigo: 300 auditorias, cada uma com a cópia das perguntas.
   Um terço tem as perguntas de origem com o enunciado da 1 mudado, para haver
   dois conjuntos diferentes e se ver que nenhum passa para a auditoria errada. */
await pg.evaluate(() => {
  const base = ITEMS.map(x => Object.assign({}, x));
  const outra = base.map((x, i) => i === 0 ? Object.assign({}, x, { c: "Pergunta mudada" }) : x);
  const L = [];
  for (let i = 0; i < 300; i++) L.push({ id: i + 1, service: "Loja " + (i % 4), date: "2025-01-01",
    scores: base.map((_, k) => (i + k) % 3), raw: base.map(() => null), tgts: base.map(() => null),
    items: i % 3 ? base : outra, note: "n" + i });
  localStorage.setItem("audits", JSON.stringify(L));
  localStorage.removeItem("perguntasAud");
});
const antes = (await pg.evaluate(() => localStorage.getItem("audits").length));
await pg.reload();
const depois = await cru();
check(depois.audits.length === 300, "a migração não pode perder auditorias");
check(depois.audits.every(a => !a.items && typeof a.q === "string"), "todas deviam ficar no formato compacto");
check(Object.keys(depois.sets).length === 2, "dois conjuntos de perguntas diferentes, gravados uma vez cada");
check(depois.chars < antes / 4, `devia ocupar muito menos: ${antes} → ${depois.chars} caracteres`);
/* Recarregar: até aqui, a memória ainda vinha do formato antigo. As verificações
   seguintes têm de ler o formato COMPACTO, que é o que fica gravado. */
await pg.reload();
const certas = await pg.evaluate(() => audits.length === 300 && audits.every((a, i) => Array.isArray(a.items) &&
  a.items.length === 19 && a.items[0].c === (i % 3 ? ITEMS[0].c : "Pergunta mudada") && a.note === "n" + i));
check(certas, "cada auditoria tem de manter as suas perguntas e os seus campos");

/* O relatório de uma auditoria do conjunto mudado mostra a pergunta mudada. */
await pg.locator("[data-v=history]").click();
await pg.locator("#hf-svc").selectOption("Loja 0");
await pg.evaluate(() => openReport(audits[0]));
check((await pg.locator("#view-report .page-2").textContent()).includes("Pergunta mudada"),
  "o relatório devia usar as perguntas gravadas com a auditoria");

/* ---- 2. Cabem 5 000 auditorias (MAX_AUDITS). ---- */
const cabe = await pg.evaluate(() => {
  const L = [];
  for (let i = 0; i < 5000; i++) L.push({ id: i + 1, service: "Loja " + (i % 8), date: "2025-02-01",
    scores: ITEMS.map((_, k) => (i + k) % 3), raw: ITEMS.map(() => 1), tgts: ITEMS.map(() => null),
    items: ITEMS.map(x => Object.assign({}, x)), verif: "Verificador", note: "observação" });
  audits = L;
  return save("audits", audits);
});
check(cabe === true, "5 000 auditorias deviam caber no armazenamento");
check((await cru()).audits.length === 5000, "as 5 000 deviam ficar gravadas");

/* 3.15.0: o Histórico desenha 50 de cada vez, e "Mostrar mais" acrescenta 50. */
await pg.evaluate(() => { Object.keys(histFiltro).forEach(k => { histFiltro[k] = ""; }); });
await pg.locator("[data-v=history]").click();
check(await pg.locator("#hist-list [data-rep]").count() === 50, "o Histórico devia desenhar só 50 cartões");
check(/Mostrar mais \(4950 restantes\)/.test(await pg.locator("#btn-hist-mais").textContent()),
  "com o botão Mostrar mais e o que falta");
await pg.locator("#btn-hist-mais").click();
check(await pg.locator("#hist-list [data-rep]").count() === 100, "Mostrar mais devia acrescentar 50");

/* ---- 3. SheetJS a pedido, também offline. ---- */
await pg.evaluate(() => { audits = audits.slice(0, 3); save("audits", audits); });
await pg.reload();
check(await pg.evaluate(() => typeof XLSX === "undefined"), "o SheetJS não devia carregar no arranque");
await pg.evaluate(async () => {
  await navigator.serviceWorker.ready;
  /* A instalação guarda em cache os ASSETS, o SheetJS incluído. */
  for (let i = 0; i < 50 && !(await caches.match("./vendor/xlsx.full.min.js")); i++)
    await new Promise(r => setTimeout(r, 100));
});
await ctx.setOffline(true);
await pg.reload();
await pg.locator("[data-v=cfg]").click();
const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 10000 }).catch(() => null),
  pg.locator("#btn-expxl").click()]);
check(dl && /\.xlsx$/.test(dl.suggestedFilename()), "sem rede, a exportação para Excel devia funcionar a partir da cache");
await ctx.setOffline(false);

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do armazenamento OK");
process.exit(erros.length || falhas.length ? 1 : 0);
