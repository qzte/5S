/* Smoke test (4.7.0; PDF da auditoria desde 4.8.0): as folhas da impressão do
   relatório e do PDF da auditoria.
   - Sem recomendações por responsável: a secção saiu do relatório.
   - A grelha de verificação, na impressão, só leva as perguntas abaixo de
     Excelente; no ecrã continua inteira. O plano vem logo a seguir.
   - 4.8.0: o PDF da auditoria (pdfDaAuditoria) tem o resumo na folha 1 e a
     grelha por responsável a partir da folha 2; nenhuma pergunta (com a
     evidência e o plano) se corta entre folhas; «Folha X de Y» em cada uma. */
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
/* O PDF da auditoria (4.8.0): os blocos desenhados, em que folha cai cada
   imagem, quantas folhas, e os textos do cabeçalho e do rodapé. */
const pdfDaApp = (id) => pg.evaluate(async (id) => {
  await carregarPdf();
  const orig = window.html2canvas, blocos = [];
  window.html2canvas = (el, o) => { blocos.push(el.className + "|" + el.textContent.replace(/\s+/g, " ").slice(0, 160)); return orig(el, o); };
  const Orig = window.jspdf.jsPDF, API = Orig.API, origAdd = API.addImage, onde = [], textos = [];
  API.addImage = function (...a) { onde.push(this.getCurrentPageInfo().pageNumber); return origAdd.apply(this, a); };
  /* text() é criado em cada documento: troca-se o construtor por um que o embrulha. */
  window.jspdf.jsPDF = function (...a) { const d = new Orig(...a), t = d.text;
    d.text = function (s, ...r) { textos.push(String(s)); return t.call(this, s, ...r); }; return d; };
  try {
    const bl = await pdfDaAuditoria(audits.find(a => a.id === id));
    const txt = new TextDecoder("latin1").decode(new Uint8Array(await bl.arrayBuffer()));
    return { blocos, onde, textos, paginas: (txt.match(/\/Type\s*\/Page[^s]/g) || []).length, vazia: !document.getElementById("view-pdf").innerHTML };
  } finally { window.html2canvas = orig; API.addImage = origAdd; window.jspdf.jsPDF = Orig; }
}, id);
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

/* ---- 2. O PDF da auditoria por responsável (4.8.0). ---- */
/* Como a maqueta: 7 perguntas a melhorar (3 Utilizadores, 1 Picking, 1
   Reposição, 1 Utilizador e Repositor, 1 Manutenção), cada uma com acção, e
   uma com foto. */
await pg.evaluate(async () => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mal = { 1: 1, 3: 1, 5: 1, 7: 0, 8: 0, 11: 1, 19: 0 };
  const sc = it.map(x => x.n in mal ? mal[x.n] : 2);
  const acoes = Object.keys(mal).map((n, k) => ({ id: k + 1, r: it.find(x => x.n === +n).r, item: +n,
    texto: "Acção da pergunta " + n, prazo: "2026-12-0" + (k + 1), estado: "aberta" }));
  localStorage.setItem("audits", JSON.stringify([{ id: 7, service: "Loja A", date: "2026-11-18", verif: "Rui",
    scores: sc, raw: it.map(() => 1), tgts: it.map(x => x.tp === "amostra" ? 10 : null), items: it,
    notas: it.map(x => x.n in mal ? "Visto na pergunta " + x.n : ""), acoes, presentes: { U: "Ana", P: "Bruno" } }]));
  const c = document.createElement("canvas"); c.width = 320; c.height = 240;
  c.getContext("2d").fillRect(0, 0, 320, 240);
  await fotosIDB("readwrite", st => st.put(c.toDataURL("image/jpeg", .7), "7#6"));
});
await pg.reload();
let r = await pdfDaApp(7);
check(r.paginas === 3, "o PDF da maqueta devia ter 3 folhas (tem " + r.paginas + "): " + r.blocos.join(" || "));
check(r.onde.length === r.blocos.length, "nenhum bloco devia ser cortado entre folhas (" + r.onde.length + " imagens para " + r.blocos.length + " blocos)");
check(/pdf-folha/.test(r.blocos[0]) && r.onde[0] === 1, "o resumo vai na folha 1");
check(r.onde[1] === 2 && /Grelha de verificação/.test(r.blocos[1]) && /Utilizadores/.test(r.blocos[1]),
  "a grelha começa na folha 2, com o grupo dos Utilizadores: " + r.blocos[1]);
const ordem = r.blocos.slice(1).map(x => (/(Utilizadores|Picking|Reposição|Utilizador e Repositor|Manutenção)/.exec(x) || [])[1]).filter((x, k, l) => x && x !== l[k - 1]);
check(JSON.stringify(ordem) === JSON.stringify(["Utilizadores", "Picking", "Reposição", "Utilizador e Repositor", "Manutenção"]),
  "os grupos pela ordem pedida: " + ordem.join(", "));
check(r.textos.includes("Folha 3 de 3") && r.textos.includes("Folha 1 de 3"), "cada folha tem «Folha X de Y»: " + r.textos.join(" | "));
check(r.vazia, "a vista do PDF fica vazia depois de o criar");

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
