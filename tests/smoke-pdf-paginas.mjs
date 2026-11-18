/* Smoke test (4.7.0): as folhas do PDF da auditoria.
   - Sem recomendações por responsável: a secção saiu do relatório (ecrã e PDF).
   - A grelha de verificação, no PDF e na impressão, só leva as perguntas abaixo
     de Excelente; no ecrã continua inteira.
   - O plano de acção vem logo a seguir à grelha: na folha 2, se couber; se não
     couber, começa inteiro na folha seguinte (nunca cortado a meio). */
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

/* 8 perguntas abaixo de Excelente, 3 acções novas e 2 em aberto da anterior. */
const SC = [2, 1, 2, 2, 0, 2, 1, 2, 2, 1, 2, 0, 2, 2, 1, 2, 2, 1, 0];
const carregar = (nAcoes, scores) => pg.evaluate(({ nAcoes, scores }) => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mk = (id, date, s, extra) => Object.assign({ id, service: "Loja A", date, verif: "F",
    scores: s, raw: it.map(() => null), tgts: it.map(() => null), items: it }, extra || {});
  const ac = (id, t, item) => ({ id, r: "U", texto: t, prazo: "2026-12-20", estado: "aberta", feitaEm: "", item });
  localStorage.setItem("audits", JSON.stringify([
    mk(1, "2026-10-02", it.map(() => 2), { acoes: [ac(1, "Identificar as localizações do corredor 5", 4), ac(2, "Rever o plano de limpeza", 11)] }),
    mk(2, "2026-11-17", scores, { recs: { U: "Texto antigo, gravado antes de 4.7.0." },
      acoes: Array.from({ length: nAcoes }, (_, k) => ac(10 + k, "Acção " + (k + 1) + ": retirar as caixas vazias do corredor " + (k + 1), 5)) })]));
  localStorage.setItem("services", JSON.stringify(["Loja A"]));
}, { nAcoes, scores });
const abrir = async () => {
  await pg.reload();
  await pg.locator("[data-v=history]").click();
  await pg.locator("[data-rep='0']").click();
};
/* As folhas do PDF da app: o que vai em cada uma (pelos blocos desenhados) e
   em que folha começa o plano. */
const pdfDaApp = () => pg.evaluate(async () => {
  await carregarPdf();
  const orig = window.html2canvas, blocos = [];
  window.html2canvas = (el, o) => { blocos.push(el.id || el.className); return orig(el, o); };
  const origAdd = window.jspdf.jsPDF.API.addImage, onde = [];
  window.jspdf.jsPDF.API.addImage = function (...a) { onde.push(this.getNumberOfPages()); return origAdd.apply(this, a); };
  const bl = await pdfDoRelatorio();
  window.html2canvas = orig; window.jspdf.jsPDF.API.addImage = origAdd;
  const txt = new TextDecoder("latin1").decode(new Uint8Array(await bl.arrayBuffer()));
  return { blocos, onde, paginas: (txt.match(/\/Type\s*\/Page[^s]/g) || []).length };
});
const impressao = async () => { await pg.emulateMedia({ media: "print" });
  const n = paginasPdf(await pg.pdf({ format: "A4" })); await pg.emulateMedia({ media: "screen" }); return n; };
/* Linhas da grelha visíveis com o CSS de impressão. */
const linhasImpressas = async () => { await pg.emulateMedia({ media: "print" });
  const n = await pg.evaluate(() => {
    const card = [...document.querySelectorAll("#view-report .page-2 .card")].find(c => /Grelha de verificação/.test(c.textContent));
    return [...card.querySelectorAll("tr")].slice(1).filter(tr => getComputedStyle(tr).display !== "none").map(tr => tr.cells[0].textContent.trim());
  });
  await pg.emulateMedia({ media: "screen" }); return n; };

/* ---- 1. Auditoria típica. ---- */
await carregar(3, SC);
await abrir();
check(await pg.locator("#view-report .rec-block, #view-report [data-rec], #view-report .page-3").count() === 0,
  "as recomendações por responsável deviam ter saído do relatório");
const naoExc = SC.map((s, i) => s < 2 ? String(i + 1) : null).filter(Boolean);
check(await pg.locator("#view-report .page-2 .card:has-text('Grelha de verificação') tr").count() === 20,
  "no ecrã, a grelha continua com as 19 perguntas");
const imp = await linhasImpressas();
check(JSON.stringify(imp) === JSON.stringify(naoExc), "na impressão, a grelha só devia ter as perguntas abaixo de Excelente: " + imp.join(","));
const grelhaTxt = await pg.locator("#view-report .page-2").textContent();
check(/8 de 19/.test(grelhaTxt), "o título da grelha devia dizer «8 de 19»");
check(/11 itens com Excelente/.test(grelhaTxt), "devia dizer quantos itens com Excelente ficam de fora");
/* No ecrã, o plano vem antes das evidências e logo a seguir à folha 2. */
check(await pg.evaluate(() => document.querySelector("#view-report .page-2").nextElementSibling.id === "plano"),
  "o plano de acção devia vir logo a seguir à grelha");
let r = await pdfDaApp();
check(r.paginas === 2, "com plano curto, o PDF devia ter 2 folhas (tem " + r.paginas + "): " + r.blocos.join(" | "));
const iPlano = r.blocos.indexOf("plano");
check(iPlano >= 0 && r.onde[iPlano] === 2, "o plano devia ir na folha 2 (vai na " + r.onde[iPlano] + ")");
check(await impressao() === 2, "na impressão, também 2 folhas");
/* 4.7.1: no plano, o responsável destaca-se — pelo menos do tamanho do texto
   da acção, e a negrito —, para se ver logo qual é a equipa. */
await pg.emulateMedia({ media: "print" });
const fonte = await pg.evaluate(() => { const tr = document.querySelector("#plano tr:nth-child(2)");
  /* O elemento onde está o nome: a própria célula, ou o que o envolve. */
  const r = getComputedStyle(tr.cells[0].firstElementChild || tr.cells[0]), a = getComputedStyle(tr.cells[1]);
  return { resp: parseFloat(r.fontSize), peso: +r.fontWeight, accao: parseFloat(a.fontSize) }; });
await pg.emulateMedia({ media: "screen" });
check(fonte.resp >= fonte.accao && fonte.peso >= 600,
  "no plano, o responsável devia ter pelo menos o tamanho da acção e ir a negrito: " + JSON.stringify(fonte));

/* ---- 2. Plano comprido: começa inteiro na folha 3. ---- */
await carregar(30, SC);
await abrir();
r = await pdfDaApp();
const i2 = r.blocos.indexOf("plano");
check(i2 >= 0 && r.onde[i2] === 3 && r.onde.filter(p => p === 3).length === 1 && r.paginas === 3,
  "com muitas acções, o plano devia começar inteiro na folha 3 (folhas: " + r.onde.join(",") + "; " + r.paginas + " páginas)");

/* ---- 3. Tudo Excelente: a grelha diz isso, sem linhas. ---- */
await carregar(0, SC.map(() => 2));
await abrir();
check((await linhasImpressas()).length === 0, "tudo Excelente: nenhuma linha na grelha impressa");
check(/Todos os 19 itens com Excelente/.test(await pg.locator("#view-report .page-2").textContent()),
  "tudo Excelente: a grelha devia dizê-lo");

await b.close();
if (erros.length) console.log("ERROS:\n" + erros.join("\n"));
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke das páginas do PDF OK");
process.exit(erros.length || falhas.length ? 1 : 0);
