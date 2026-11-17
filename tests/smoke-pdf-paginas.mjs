/* Smoke test (4.6.2): o PDF não leva folhas sem nada para reportar. Sem
   recomendações (texto ou foto), a folha 3 não sai — nem no PDF da app nem na
   impressão; com uma, só sai o responsável que a tem. No ecrã, os blocos
   continuam todos, para se poder escrever. */
import pw from "playwright";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;
const paginasPdf = buf => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

const ctx = await b.newContext({ viewport: { width: 400, height: 800 } });
const pg = await ctx.newPage();
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
await pg.goto(URL);
/* Uma só auditoria ao serviço e sem acções nem notas: sem plano nem evidências. */
await pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  localStorage.setItem("audits", JSON.stringify([{ id: 2, service: "Loja A", date: "2026-10-20", verif: "F",
    scores: it.map((_, i) => i % 3), raw: it.map(() => null), tgts: it.map(() => null), items: it }]));
  localStorage.setItem("services", JSON.stringify(["Loja A"]));
});
await pg.reload();
await pg.locator("[data-v=history]").click();
await pg.locator("[data-rep='0']").click();

/* Folhas que o PDF da app desenha, e o nº de páginas do ficheiro. */
const pdfDaApp = () => pg.evaluate(async () => {
  await carregarPdf();
  const orig = window.html2canvas, folhas = [];
  window.html2canvas = (el, o) => { folhas.push(el.className); return orig(el, o); };
  const bl = await pdfDoRelatorio();
  window.html2canvas = orig;
  const txt = new TextDecoder("latin1").decode(new Uint8Array(await bl.arrayBuffer()));
  return { folhas, paginas: (txt.match(/\/Type\s*\/Page[^s]/g) || []).length };
});
const impressao = async () => { await pg.emulateMedia({ media: "print" });
  const n = paginasPdf(await pg.pdf({ format: "A4" })); await pg.emulateMedia({ media: "screen" }); return n; };

/* 1. Sem recomendações: duas folhas (gráficos e grelha). */
{
  const r = await pdfDaApp();
  check(!r.folhas.some(f => /page-3/.test(f)), "sem recomendações, a folha 3 não devia ir para o PDF: " + r.folhas.join(" | "));
  check(r.paginas === 2, "sem recomendações, o PDF devia ter 2 páginas (tem " + r.paginas + ")");
  check(await impressao() === 2, "sem recomendações, a impressão devia ter 2 páginas");
  check(await pg.locator("#view-report .page-3 .rec-block").count() >= 2 &&
    await pg.locator("#view-report .page-3 textarea").first().isVisible(), "no ecrã, os blocos das recomendações ficam todos");
}

/* 2. Uma recomendação escrita: a folha 3 volta, só com esse responsável. */
{
  const t = pg.locator("#view-report .page-3 textarea").first();
  await t.fill("Arrumar o corredor 3.");
  const r = await pdfDaApp();
  check(r.folhas.some(f => /page-3/.test(f)) && r.paginas === 3, "com uma recomendação, o PDF devia ter a folha 3 (" + r.paginas + " páginas)");
  check(await impressao() === 3, "com uma recomendação, a impressão devia ter 3 páginas");
  const vis = await pg.evaluate(() => [...document.querySelectorAll("#view-report .page-3 .rec-block")].filter(x => !x.classList.contains("no-print")).length);
  check(vis === 1, "só o responsável com recomendação devia ir para o PDF (vão " + vis + ")");
  /* Apagar o texto tira a folha outra vez. */
  await t.fill("");
  check(!(await pdfDaApp()).folhas.some(f => /page-3/.test(f)), "apagada a recomendação, a folha 3 devia sair do PDF");
}

await b.close();
if (erros.length) console.log("ERROS:\n" + erros.join("\n"));
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke das páginas do PDF OK");
process.exit(erros.length || falhas.length ? 1 : 0);
