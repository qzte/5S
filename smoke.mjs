/* Smoke test de browser: confirma que o campo de amostra existe, que mudar o
   alvo reclassifica a resposta já dada, e que o relatório mostra a fracção. */
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
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };

/* Pergunta 3 é o índice 2 na lista de itens. */
const alvo = pg.locator("[data-tgt='2']");
const resp = pg.locator("[data-pick='2']");
check(await alvo.count() === 1, "pergunta 3 devia ter input de alvo");
check(await alvo.inputValue() === "10", "alvo devia estar pré-preenchido com 10");
check(await pg.locator("[data-tgt='0']").count() === 0,
  "pergunta 1 (contagem) não devia ter input de alvo");

/* 3 em 10 = 30% -> Com oportunidade (T1 = 40%). */
await resp.fill("3");
check((await pg.locator("[data-pctof='2']").textContent()).includes("30%"),
  "devia mostrar 30%");

/* Mesmos 3, agora em 6 auditados = 50% -> Mau. Reclassifica sem tocar na resposta. */
await alvo.fill("6");
check((await pg.locator("[data-pctof='2']").textContent()).includes("50%"),
  "mudar o alvo devia recalcular a percentagem");

/* Alvo vazio deixa o item por responder. */
await alvo.fill("");
check(!(await pg.locator("#it2").getAttribute("class")).includes("done"),
  "sem alvo, o item não pode contar como respondido");
await alvo.fill("10");

/* Preencher tudo e gravar leva ao relatório com a fracção. */
const inputs = await pg.locator("[data-pick]").all();
for (const el of inputs) await el.fill("0");
await pg.locator("#btn-save").click();
const grelha = await pg.locator("#view-report").textContent();
check(grelha.includes("0 / 10"), "o relatório devia mostrar a fracção auditada");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke OK");
process.exit(erros.length || falhas.length ? 1 : 0);
