/* Smoke test de browser da edição de auditorias anteriores (v3.3.0):
   o formulário reabre preenchido, guardar SUBSTITUI o registo em vez de criar
   um segundo, as recomendações por responsável sobrevivem, e cancelar devolve
   o formulário ao estado de auditoria nova. */
import pw from "playwright";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const pg = await b.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
/* Ruído conhecido e pré-existente: frame-ancestors não é aplicável via <meta>,
   mas a directiva fica na CSP para quando for servida por cabeçalho. */
const BENIGNO = /frame-ancestors/;
pg.on("console", m => {
  if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text());
});
/* Nenhum confirm() pode ficar pendurado num teste sem interface. */
pg.on("dialog", d => d.accept());
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const nAudits = () => pg.evaluate(() => JSON.parse(localStorage.getItem("audits") || "[]").length);
const audit0 = () => pg.evaluate(() => JSON.parse(localStorage.getItem("audits") || "[]")[0]);

/* ---- 1. Gravar uma auditoria com todas as respostas a zero. ---- */
await pg.locator("#f-verif").fill("Zé");
await pg.locator("#f-note").fill("primeira");
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#btn-save").click();
/* Zero em todas as respostas não é 100: nas perguntas de escala e de elementos
   mais é melhor, e um zero aí é Mau. O valor exacto não interessa ao teste —
   interessa que a edição o reproduza e depois o altere. */
const notaOriginal = await pg.locator("#view-report .big").textContent();
check(/^\d+\/100$/.test(notaOriginal), "o relatório devia mostrar a nota sobre 100");

/* Uma recomendação, para confirmar que a edição não a leva. */
await pg.locator("[data-rec='U']").fill("arrumar o corredor 3");
const idOriginal = (await audit0()).id;

/* ---- 2. Editar a partir do relatório. ---- */
await pg.locator("#btn-edit").click();
check(!(await pg.locator("#edit-banner").isHidden()), "o aviso de edição devia estar visível");
check(await pg.locator("#btn-save").textContent() === "Guardar alterações",
  "o botão devia passar a Guardar alterações");
check(await pg.locator("#f-verif").inputValue() === "Zé", "o verificador devia vir preenchido");
check(await pg.locator("#f-note").inputValue() === "primeira", "a observação devia vir preenchida");
check(await pg.locator("[data-pick='0']").inputValue() === "0", "a resposta devia vir preenchida");
check((await pg.locator("#f-live").inputValue()).startsWith(notaOriginal.replace("/100", " / 100")),
  "a nota em directo devia estar recalculada a partir das respostas repostas");

/* ---- 3. Alterar e guardar: substitui, não duplica. ---- */
await pg.locator("#f-note").fill("corrigida");
/* Pergunta 1 é uma contagem com T1 = 4: 5 artigos a mais é Mau. */
await pg.locator("[data-pick='0']").fill("5");
await pg.locator("#btn-save").click();
check(await nAudits() === 1, "editar não pode criar uma segunda auditoria");
const dep = await audit0();
check(dep.id === idOriginal, "o id tem de se manter");
check(dep.note === "corrigida", "a observação editada devia ficar gravada");
check(dep.scores[0] === 0, "5 artigos a mais deviam classificar como Mau");
check(dep.raw[0] === 5, "o valor bruto editado devia ficar gravado");
check(dep.recs && dep.recs.U === "arrumar o corredor 3",
  "a recomendação por responsável tem de sobreviver à edição");
check(await pg.locator("#edit-banner").isHidden(),
  "depois de guardar, o formulário devia sair do modo de edição");

/* ---- 4. Editar pelo Histórico e cancelar. ---- */
await pg.locator("[data-v=history]").click();
check(await pg.locator("[data-edit]").count() === 1, "o histórico devia ter um botão Editar");
await pg.locator("[data-edit='0']").click();
check(await pg.locator("#f-note").inputValue() === "corrigida",
  "a edição pelo histórico devia repor a auditoria gravada");
await pg.locator("#btn-canceledit").click();
check(await pg.locator("#edit-banner").isHidden(), "cancelar devia esconder o aviso");
check(await pg.locator("#btn-save").textContent() === "Guardar auditoria",
  "cancelar devia repor o botão de auditoria nova");
check(await pg.locator("#f-note").inputValue() === "", "cancelar devia limpar o formulário");
check(await nAudits() === 1, "cancelar não altera o histórico");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da edição OK");
process.exit(erros.length || falhas.length ? 1 : 0);
