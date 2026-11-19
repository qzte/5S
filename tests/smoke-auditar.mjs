/* Smoke test do Auditar (4.15.0):
   - os dados da auditoria num bloco que abre e fecha: aberto numa auditoria
     nova, com o que falta no título; «Feito» fecha-o e o título resume;
   - a barra de progresso presa ao topo: respondidas, a melhorar, a nota em
     directo e um botão por pilar, que fica com ✓ quando o pilar está completo;
   - cada pergunta com a risca da cor da resposta.
   Tira capturas (telemóvel) para a pasta em CAPTURAS, se indicada. */
import pw from "playwright";
import { ligarDialogos } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const CAPTURAS = process.env.CAPTURAS || "";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
const erros = [], falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);
await pg.evaluate(() => {
  localStorage.setItem("services", JSON.stringify(["Serviço K (00011)", "Serviço A (00001)"]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
});
await pg.reload();
const txt = sel => pg.locator(sel).textContent();

/* 1. Auditoria nova: dados abertos, falta o serviço; sem «Nota (auto)». */
check(await pg.locator("#aud-dados").evaluate(d => d.open), "numa auditoria nova, os dados começam abertos");
check(/falta o serviço/.test(await txt("#aud-dados-falta")), "o título diz que falta o serviço");
check(await pg.locator("#f-live").count() === 0, "o campo «Nota (auto)» saiu");
check(/0 de 19 respondidas/.test(await txt("#aud-n")) && (await txt("#aud-nota")) === "—", "a barra começa a zero");
check((await pg.locator("#aud-prog").evaluate(e => getComputedStyle(e).position)) === "sticky", "a barra fica presa ao topo");
check((await pg.locator("[data-pick='0']").getAttribute("placeholder")) === "Por responder", "as caixas vazias dizem «Por responder»");

/* 2. Serviço e verificador: o título resume e diz «completo»; Feito fecha. */
await escolherServico(pg, "Serviço K (00011)");
await pg.locator("#f-verif").fill("Ana");
check((await txt("#aud-dados-tit")) === "Serviço K (00011)", "o título passa a ser o serviço");
check(/Verif\.: Ana/.test(await txt("#aud-dados-sub")), "o resumo leva o verificador");
check(/completo/.test(await txt("#aud-dados-falta")), "com serviço, data e verificador, diz «completo»");
await pg.locator("#btn-dados-ok").click();
check(!(await pg.locator("#aud-dados").evaluate(d => d.open)), "«Feito» fecha os dados");

/* 3. Respostas: contagem, a melhorar, nota, riscas e pilares. */
const triagem = await pg.evaluate(() => fitems().map((it, i) => it.p === 0 ? i : -1).filter(i => i >= 0));
for (const [k, i] of triagem.entries()) await pg.locator(`[data-pick='${i}']`).fill(k === 0 ? "3" : "0");
check(new RegExp(triagem.length + " de 19 respondidas").test(await txt("#aud-n")), "a barra conta as respostas");
check(/a melhorar/.test(await txt("#aud-melh")), "uma resposta com falhas conta como «a melhorar»");
check(/^\d+\/100$/.test(await txt("#aud-nota")), "a nota em directo: " + await txt("#aud-nota"));
check(await pg.locator(`#it${triagem[0]}`).evaluate(e => e.classList.contains("bad") || e.classList.contains("mid")), "a risca da pergunta com falhas");
check(await pg.locator(`#it${triagem[1]}`).evaluate(e => e.classList.contains("done")), "a risca verde da pergunta sem falhas");
check(await pg.locator("[data-ir-pilar='0']").evaluate(e => e.classList.contains("ok")), "o pilar completo fica com ✓");
check(new RegExp(triagem.length + "/" + triagem.length).test(await txt("#pp0")), "o título do pilar diz quantas respondidas");
/* Apagar uma resposta: volta a «por responder». */
await pg.locator(`[data-pick='${triagem[1]}']`).fill("");
check(!(await pg.locator(`#it${triagem[1]}`).evaluate(e => e.classList.contains("done"))), "sem resposta, sem risca");
check(await pg.locator("[data-ir-pilar='0']").evaluate(e => e.classList.contains("parte")), "o pilar fica a meio");

/* 4. O botão de um pilar salta para ele. */
await pg.locator("[data-ir-pilar='3']").click();
await pg.waitForTimeout(600);
const topo = await pg.locator("#pil3").evaluate(e => e.getBoundingClientRect().top);
check(topo >= 0 && topo < 300, "o pilar 4 devia ficar à vista, por baixo da barra: " + topo);
if (CAPTURAS) await pg.screenshot({ path: CAPTURAS + "/auditar-app.png" });

/* 5. Reabrir os dados pelo título. */
await pg.locator("#aud-dados > summary").click();
check(await pg.locator("#aud-dados").evaluate(d => d.open), "tocar no título reabre os dados");
if (CAPTURAS) { await pg.evaluate(() => window.scrollTo(0, 0)); await pg.locator("#aud-dados > summary").click(); await pg.screenshot({ path: CAPTURAS + "/auditar-app-topo.png" }); }

await b.close();
if (erros.length) { console.log("ERROS DE JS:\n" + erros.join("\n")); process.exitCode = 1; }
else console.log("sem erros de JS");
if (falhas.length) { console.log("FALHAS:\n" + falhas.join("\n")); process.exitCode = 1; }
else console.log("smoke do Auditar OK");
