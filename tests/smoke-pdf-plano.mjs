/* Smoke test do PDF do plano de acção (4.14.0), no separador Acções:
   - o botão gera um PDF com os filtros e o agrupamento escolhidos;
   - o resumo na folha 1 e uma linha por acção, que nunca se corta entre folhas;
   - «Folha X de Y» e o nome do ficheiro com o responsável escolhido;
   - sem acções que passem os filtros, o PDF diz que não há nenhuma. */
import pw from "playwright";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 400, height: 800 } });
/* Sem a janela «Guardar como», para o teste apanhar a transferência. */
await ctx.addInitScript(() => { delete window.showSaveFilePicker; });
const pg = await ctx.newPage();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
const paginasPdf = buf => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
await pg.goto(URL);

/* 60 acções: 20 em atraso (Manutenção), 30 abertas (Utilizadores), 10 feitas. */
await pg.evaluate(() => {
  const hoje = hojeISO(), d = n => somarDias(hoje, n), it = ITEMS.map(x => Object.assign({}, x));
  const acoes = [];
  for (let k = 0; k < 60; k++) acoes.push({ id: k + 1, r: k < 20 ? "M" : "U", item: (k % 19) + 1,
    texto: "Acção " + (k + 1) + ": retirar as caixas vazias e arrumar a zona " + (k + 1),
    prazo: k < 20 ? d(-k - 1) : d(k), estado: k >= 50 ? "feita" : "aberta", feitaEm: k >= 50 ? d(-2) : "" });
  localStorage.setItem("audits", JSON.stringify([{ id: 1, service: "Loja A (001)", date: d(-40), verif: "V",
    scores: it.map(() => 1), raw: it.map(() => null), tgts: it.map(() => null), items: it, acoes }]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
});
await pg.reload();
await pg.locator("[data-v=acoes]").click();

const gerar = async () => {
  const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 60000 }), pg.locator("#btn-ac-pdf").click()]);
  const fs = await import("fs");
  return { nome: dl.suggestedFilename(), buf: fs.readFileSync(await dl.path()) };
};

/* 1. Em aberto, agrupado por prazo: 50 acções, várias folhas. */
let r = await gerar();
check(r.buf.slice(0, 5).toString() === "%PDF-", "devia ser um PDF");
const n1 = paginasPdf(r.buf);
check(n1 >= 2, "50 acções deviam ocupar mais de uma folha: " + n1);
check(/^Plano de acao - \d{4}-\d{2}-\d{2}\.pdf$/.test(r.nome), "o nome do ficheiro: " + r.nome);
check(!(await pg.locator("#btn-ac-pdf").isDisabled()), "o botão volta a ficar activo");

/* 2. O HTML do PDF (antes de virar imagem): resumo, grupos, linhas e cortes. */
const html = await pg.evaluate(() => {
  const hoje = hojeISO(), nomeR = k => isResp(k) ? RESP[k] : k;
  const l = listaAcoes(audits, { estado: "", r: "", svc: "" }, hoje);
  const kp = { r: resumoAcoes(audits, hoje), dp: desempenhoAcoes(audits), ia: idadeAcoesAbertas(audits, hoje), ef: eficaciaAcoes(audits) };
  const box = document.createElement("div");
  box.innerHTML = planoPdfHTML(agruparAcoes(l, "prazo", hoje, nomeR), "prazo", ["Em aberto"], kp, hoje, nomeR);
  return { folhas: box.querySelectorAll(".pdf-folha").length, unidades: box.querySelectorAll(".pdf-unidade").length,
    grupos: [...box.querySelectorAll(".pdf-pgrupo b")].map(x => x.textContent), atraso: box.querySelectorAll(".pdf-pill.mau").length,
    cabecalhos: box.querySelectorAll(".pdf-plano th").length / 5, kpis: box.querySelector(".pdf-kpis").textContent };
});
check(html.folhas === 1 && html.unidades === 50, "uma folha de resumo e uma unidade por acção: " + JSON.stringify(html));
check(html.grupos[0] === "Em atraso" && html.atraso === 20, "o grupo em atraso primeiro, com 20 acções em atraso");
check(html.cabecalhos === html.grupos.length, "o cabeçalho da tabela só na primeira linha de cada grupo");
check(/50\s*em aberto/.test(html.kpis) && /20\s*em atraso/.test(html.kpis), "o resumo: " + html.kpis);

/* 3. Filtrado pela Manutenção: o nome do ficheiro diz quem. */
await pg.locator("#ac-r").selectOption("M");
await pg.locator('[data-ac-por="svc"]').click();
r = await gerar();
check(/^Plano de acao - Manutencao - \d{4}/.test(r.nome), "o nome com o responsável: " + r.nome);
check(paginasPdf(r.buf) >= 1 && paginasPdf(r.buf) < n1, "menos acções, menos folhas");

/* 4. Sem acções nos filtros: o PDF diz que não há nenhuma (uma folha). */
await pg.locator("#ac-estado").selectOption("feitas");
r = await gerar();
check(paginasPdf(r.buf) === 1, "sem acções feitas da Manutenção, uma folha só");

await b.close();
if (erros.length) { console.log("ERROS DE JS:\n" + erros.join("\n")); process.exitCode = 1; }
else console.log("sem erros de JS");
if (falhas.length) { console.log("FALHAS:\n" + falhas.join("\n")); process.exitCode = 1; }
else console.log("smoke do PDF do plano OK");
