/* Smoke test de browser das alterações ao histórico (v3.3.0 / v3.3.1 / v3.4.0):
   o formulário reabre preenchido, guardar SUBSTITUI o registo em vez de criar
   um segundo, as recomendações por responsável sobrevivem, e cancelar devolve
   o formulário ao estado de auditoria nova. Editar e apagar exigem o código de
   acesso, e um código errado não deixa passar nenhuma das duas. Em edição, o
   responsável de cada pergunta é reatribuível, e a mudança fica só naquela
   auditoria — o checklist em vigor não é tocado. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
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
/* Nenhum diálogo pode ficar pendurado num teste sem interface. As confirmações
   são nativas; o código de acesso, exigido para editar e apagar, vem na caixa
   própria da app desde 3.9.0 (ver dialogos.mjs). */
const PIN = "3758";
let pinAtual = PIN;
pg.on("dialog", d => d.accept(""));
await ligarDialogos(pg, () => ({ campo: pinAtual, botao: "Confirmar" }));
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const nAudits = () => pg.evaluate(() => JSON.parse(localStorage.getItem("audits") || "[]").length);
/* Desde 3.11.0 as perguntas de cada auditoria gravam-se à parte (perguntasAud):
   lê-se o que está GRAVADO, expandido pela mesma função que a app usa. */
const audit0 = () => pg.evaluate(() => expandirAudits(JSON.parse(localStorage.getItem("audits") || "[]"),
  JSON.parse(localStorage.getItem("perguntasAud") || "{}"))[0]);

/* ---- 1. Gravar uma auditoria com todas as respostas a zero. ---- */
check(await pg.locator("[data-edresp]").count() === 0,
  "fora da edição, o responsável não é alterável no formulário");
await pg.locator("#f-verif").fill("Sicrano");
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

/* ---- 2. Editar a partir do relatório (pede o código de acesso). ---- */
await pg.locator("#btn-edit").click();
await semDialogo(pg);
check(!(await pg.locator("#edit-banner").isHidden()), "o aviso de edição devia estar visível");
check(await pg.locator("#btn-save").textContent() === "Guardar alterações",
  "o botão devia passar a Guardar alterações");
check(await pg.locator("#f-verif").inputValue() === "Sicrano", "o verificador devia vir preenchido");
check(await pg.locator("#f-note").inputValue() === "primeira", "a observação devia vir preenchida");
check(await pg.locator("[data-pick='0']").inputValue() === "0", "a resposta devia vir preenchida");
check(await pg.locator("[data-edresp]").count() === 19,
  "em edição, cada pergunta devia ter selector de responsável");
check(await pg.locator("[data-edresp='0']").inputValue() === "U",
  "o selector devia vir no responsável gravado com a auditoria");
check((await pg.locator("#f-live").inputValue()).startsWith(notaOriginal.replace("/100", " / 100")),
  "a nota em directo devia estar recalculada a partir das respostas repostas");

/* ---- 3. Alterar e guardar: substitui, não duplica. ---- */
await pg.locator("#f-note").fill("corrigida");
/* Pergunta 1 é uma contagem com T1 = 4: 5 artigos a mais é Mau. */
await pg.locator("[data-pick='0']").fill("5");
/* Reatribuir a pergunta 1 ao Picking, o caso que motivou a funcionalidade:
   acrescentou-se um responsável e o passado tem de poder acompanhá-lo. */
await pg.locator("[data-edresp='0']").selectOption("P");
await pg.locator("#btn-save").click();
check(await nAudits() === 1, "editar não pode criar uma segunda auditoria");
const dep = await audit0();
check(dep.id === idOriginal, "o id tem de se manter");
check(dep.note === "corrigida", "a observação editada devia ficar gravada");
check(dep.scores[0] === 0, "5 artigos a mais deviam classificar como Mau");
check(dep.raw[0] === 5, "o valor bruto editado devia ficar gravado");
check(dep.recs && dep.recs.U === "arrumar o corredor 3",
  "a recomendação por responsável tem de sobreviver à edição");
check(dep.items[0].r === "P", "o responsável reatribuído devia ficar gravado na auditoria");
check(dep.items[1].r === "M", "reatribuir uma pergunta não pode mexer nas outras");
check(await pg.evaluate(() => localStorage.getItem("itemsCfg")) === null,
  "reatribuir dentro de uma auditoria não pode reescrever o checklist em vigor");
check((await pg.locator("#view-report .page-1 .card").nth(1).textContent()).includes("Picking"),
  "o radar por responsável devia passar a contar com o Picking");
check(await pg.locator("#edit-banner").isHidden(),
  "depois de guardar, o formulário devia sair do modo de edição");

/* ---- 4. Editar pelo Histórico e cancelar. ---- */
await pg.locator("[data-v=history]").click();
check(await pg.locator("[data-edit]").count() === 1, "o histórico devia ter um botão Editar");
await pg.locator("[data-edit='0']").click();
await semDialogo(pg);
check(await pg.locator("#f-note").inputValue() === "corrigida",
  "a edição pelo histórico devia repor a auditoria gravada");
await pg.locator("#btn-canceledit").click();
await semDialogo(pg);
check(await pg.locator("#edit-banner").isHidden(), "cancelar devia esconder o aviso");
check(await pg.locator("#btn-save").textContent() === "Guardar auditoria",
  "cancelar devia repor o botão de auditoria nova");
check(await pg.locator("#f-note").inputValue() === "", "cancelar devia limpar o formulário");
check(await nAudits() === 1, "cancelar não altera o histórico");

/* ---- 5. Código errado não abre a edição. ---- */
pinAtual = "0000";
await pg.locator("[data-v=history]").click();
await pg.locator("[data-edit='0']").click();
await semDialogo(pg);
check(await pg.locator("#edit-banner").isHidden(),
  "um código errado não pode abrir o modo de edição");

/* ---- 6. Apagar (3.13.0): sem confirmação nem código, com Desfazer. ---- */
pinAtual = PIN;
const pedidosAntes = await pg.evaluate(() => +document.getElementById("dlg").dataset.seq || 0);
await pg.locator("[data-del='0']").click();
check(await nAudits() === 0, "apagar devia apagar logo");
check(await pg.evaluate(() => +document.getElementById("dlg").dataset.seq || 0) === pedidosAntes,
  "apagar já não abre caixa nenhuma (nem confirmação, nem código)");
check(!(await pg.locator("#toast").isHidden()) && (await pg.locator("#toast-btn").textContent()) === "Desfazer",
  "devia aparecer o aviso com Desfazer");

/* ---- 7. Desfazer repõe a auditoria tal como estava. ---- */
await pg.locator("#toast-btn").click();
check(await nAudits() === 1, "desfazer devia repor a auditoria");
check((await audit0()).id === idOriginal && (await audit0()).note === "corrigida",
  "a auditoria reposta tem de ser a mesma, com o mesmo id e os mesmos dados");
check(await pg.locator("#toast").isHidden(), "depois de desfazer, o aviso desaparece");
check(await pg.locator("#hist-list [data-del]").count() === 1, "o histórico devia voltar a mostrá-la");

/* ---- 8. Apagar e deixar passar o prazo: fica apagada. ---- */
await pg.locator("[data-del='0']").click();
await pg.evaluate(() => concluirApagar());   /* o mesmo que esperar os 10 s */
check(await nAudits() === 0, "sem desfazer, fica apagada");
check(await pg.locator("#toast").isHidden(), "terminado o prazo, o aviso desaparece");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da edição OK");
process.exit(erros.length || falhas.length ? 1 : 0);
