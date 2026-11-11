/* Smoke test de browser do plano de acções (3.12.0): criar uma acção a partir
   de um item a melhorar, vê-la em atraso, encontrá-la no formulário da auditoria
   seguinte ao mesmo serviço e marcá-la como feita lá; contagem no Histórico; e o
   PDF — 3 folhas sem plano, 4 com ele, nunca uma folha em branco. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const pg = await b.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
pg.on("dialog", d => d.accept(""));
/* Avisos e confirmações vêm na caixa da app desde 3.13.0: aceita-os todos. */
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const gravadas = () => pg.evaluate(() => expandirAudits(JSON.parse(localStorage.getItem("audits") || "[]"),
  JSON.parse(localStorage.getItem("perguntasAud") || "{}")));
/* Folhas do PDF do relatório aberto. */
const folhas = async () => {
  const pdf = await pg.pdf({ format: "A4" });
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
};

/* ---- 1. Uma auditoria com tudo a 0: há itens a melhorar. Sem plano, 3 folhas. ---- */
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await escolherServico(pg); await pg.locator("#btn-save").click();
check(await pg.locator("#plano.page").count() === 0, "sem acções, o plano não é uma folha impressa");
check(await folhas() === 3, "sem plano, o relatório tem de continuar com 3 folhas");

/* ---- 2. "+ Acção" num item a melhorar prepara o formulário. ---- */
await pg.locator("[data-acao-worst='0']").click();
const texto = await pg.locator("#acao-texto").inputValue();
check(/^Nº \d+ — /.test(texto), "o texto devia começar pelo número da pergunta: " + texto);
check(await pg.locator("#acao-item").inputValue() !== "", "a acção devia ficar ligada à pergunta");
await pg.locator("#acao-texto").fill(texto + "retirar as caixas do corredor");
await pg.locator("#acao-prazo").fill("2020-01-01");
await pg.locator("#btn-acao-add").click();
check(await pg.locator("#plano table tr").count() === 2, "a acção devia aparecer no plano");
check((await pg.locator("#plano").textContent()).includes("Em atraso"), "com prazo passado, fica em atraso");
check(await pg.locator("#plano.page").count() === 1, "com acções, o plano passa a folha impressa");
check(await folhas() === 4, "com plano, o relatório tem 4 folhas");
let g = await gravadas();
check(g[0].acoes && g[0].acoes.length === 1 && g[0].acoes[0].texto.endsWith("corredor"), "a acção devia ficar gravada");

/* Uma segunda acção, sem prazo, e removê-la. */
await pg.locator("#acao-texto").fill("rever a sinalética");
await pg.locator("#btn-acao-add").click();
check((await gravadas())[0].acoes.length === 2, "a segunda acção devia ficar gravada");
await pg.locator("[data-acao-rm]").nth(1).click();
await semDialogo(pg);
check((await gravadas())[0].acoes.length === 1, "remover devia tirá-la do plano");

/* ---- 3. Histórico: contagem. ---- */
await pg.locator("[data-v=history]").click();
check(/1 acção em aberto \(1 em atraso\)/.test(await pg.locator("#hist-list").textContent()),
  "o Histórico devia contar a acção em aberto e em atraso");

/* ---- 4. Auditoria seguinte ao mesmo serviço: a acção aparece e fecha-se lá. ---- */
await pg.reload();
check(await pg.locator("#acoes-abertas").isHidden(), "4.2.6: sem serviço escolhido, ainda não há acções em aberto a mostrar");
await escolherServico(pg);
check(!(await pg.locator("#acoes-abertas").isHidden()), "o formulário devia mostrar as acções em aberto do serviço");
check((await pg.locator("#acoes-abertas").textContent()).includes("retirar as caixas"), "com o texto da acção");
await pg.locator("#acoes-abertas [data-acao-feita]").click();  /* o cartão é redesenhado: click e não check */
g = await gravadas();
check(g[0].acoes[0].estado === "feita" && /^\d{4}-\d{2}-\d{2}$/.test(g[0].acoes[0].feitaEm),
  "marcar no formulário devia gravá-la como feita, com a data");
check(await pg.locator("#acoes-abertas").isHidden(), "sem acções em aberto, o cartão desaparece");

/* ---- 5. No relatório de uma auditoria seguinte, o que vinha de trás. ---- */
await pg.evaluate(() => {   /* reabrir a acção, e gravar uma segunda auditoria ao mesmo serviço */
  marcarAcao(audits[0].id + ":" + audits[0].acoes[0].id, false);
});
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#f-date").fill("2099-01-01");
await escolherServico(pg); await pg.locator("#btn-save").click();
const plano = await pg.locator("#plano").textContent();
check(/Em aberto de auditorias anteriores \(1\)/.test(plano), "o relatório seguinte devia trazer a acção em aberto");
await pg.locator("#plano [data-acao-feita]").click();
check(!/Em aberto de auditorias anteriores/.test(await pg.locator("#plano").textContent()),
  "marcada como feita no relatório, deixa de estar em aberto");

/* ---- 6. Separador Acções (3.21.0): todas, filtros, marcar e voltar. ---- */
await pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mk = (id, service, date, acoes) => ({ id, service, date, verif: "V", scores: it.map(() => 1),
    raw: it.map(() => null), tgts: it.map(() => null), items: it, acoes });
  localStorage.setItem("audits", JSON.stringify([
    mk(1, "Loja A", "2026-10-01", [
      { id: 1, r: "U", texto: "Atrasada A", prazo: "2020-01-01", estado: "aberta", feitaEm: "", item: 3 },
      { id: 2, r: "M", texto: "Aberta A", prazo: "2099-01-01", estado: "aberta", feitaEm: "", item: null }]),
    mk(2, "Loja B", "2026-10-02", [
      { id: 1, r: "M", texto: "Atrasada B", prazo: "2021-01-01", estado: "aberta", feitaEm: "", item: null },
      { id: 2, r: "U", texto: "Feita B", prazo: "", estado: "feita", feitaEm: "2026-10-05", item: null }]),
    mk(3, "Loja C", "2026-10-03")]));
});
await pg.reload();
const badge = () => pg.locator('.tab[data-v="acoes"] .tab-badge').textContent().catch(() => "");
check(await badge() === "2", "o separador devia mostrar as 2 acções em atraso: " + await badge());
await pg.locator("[data-v=acoes]").click();
const textos = async () => (await pg.locator("#ac-tabela .ac-item").allTextContents()).map(t => t.replace(/\s+/g, " "));
let t = await textos();
check(t.length === 3 && /Atrasada A/.test(t[0]) && /Atrasada B/.test(t[1]) && /Aberta A/.test(t[2]),
  "por omissão, as em aberto, as mais atrasadas primeiro: " + t.join(" | "));
check(/3 em aberto · 2 em atraso/.test(await pg.locator("#ac-resumo").textContent()) && /3 de 4/.test(await pg.locator("#ac-conta").textContent()),
  "o resumo e a contagem: " + await pg.locator("#ac-resumo").textContent());
await pg.locator("#ac-estado").selectOption("feitas");
t = await textos();
check(t.length === 1 && /Feita B/.test(t[0]), "o filtro das feitas");
await pg.locator("#ac-estado").selectOption("");
await pg.locator("#ac-svc").selectOption("Loja A");
check((await textos()).length === 2, "o filtro do serviço");
check(!(await pg.locator("#ac-svc option").allTextContents()).includes("Loja C"), "só os serviços com acções");
await pg.locator("#ac-svc").selectOption("");
await pg.locator("#ac-r").selectOption("M");
check((await textos()).length === 2, "o filtro do responsável");
await pg.locator("#ac-r").selectOption("");
/* Marcar como feita aqui mesmo: grava, sai da lista e o número baixa. */
await pg.locator("#ac-tabela [data-ac-feita]").first().click();   /* a «Atrasada A» */
let gr = await gravadas();
check(gr.find(a => a.id === 1).acoes[0].estado === "feita", "marcar na lista devia gravar a acção como feita");
check((await textos()).length === 2, "a feita sai da lista das em aberto");
check(await badge() === "1", "o número do separador devia baixar para 1");
/* Relatório da auditoria de onde veio, e Voltar regressa às Acções. */
await pg.locator("#ac-tabela [data-ac-rep]").first().click();   /* agora a «Atrasada B» */
check(/Loja B · 2026-10-02/.test(await pg.locator("#view-report .score-hero").textContent()), "Relatório abre a auditoria da acção");
await pg.locator("#btn-back").click();
check(!(await pg.locator("#view-acoes").isHidden()), "Voltar devia regressar às Acções");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do plano de acções OK");
process.exit(erros.length || falhas.length ? 1 : 0);
