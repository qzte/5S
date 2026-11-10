/* Smoke test de browser da 4.2.0: pesquisar o serviço a auditar e importar a
   listagem de serviços do sistema.

   - No separador Auditar, uma só caixa para o serviço (4.2.1): escreve-se o
     nome ou o código, sem acentos nem maiúsculas, e abre-se por baixo a lista
     dos que casam (os da lista e, à parte, os que só existem em auditorias);
     escolhe-se com um toque, com as setas e Enter; Esc repõe.
   - Importar Excel aceita a listagem com ID_SERVICO, DESCRICAO_SERVICO,
     LOCAL_SERVICO e SERVICO_ATIVO: o local dá o tipo, os inactivos ficam de fora.
   - Nenhum alert()/confirm() nativo. */
import pw from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const pg = await (await b.newContext()).newPage();
const erros = [], nativos = [], caixas = [];
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
pg.on("dialog", d => { nativos.push(d.type() + ": " + d.message()); d.accept(""); });
await ligarDialogos(pg, d => { caixas.push(d); });
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const valor = () => pg.locator("#f-service").inputValue();

/* Dois serviços na lista; a Padaria só existe numa auditoria antiga. */
await pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  localStorage.setItem("audits", JSON.stringify([{ id: 1, service: "Padaria (103)", date: "2026-01-05",
    scores: it.map(() => 2), raw: it.map(() => null), tgts: it.map(() => null), items: it, finalizada: "2026-01-05" }]));
  localStorage.setItem("services", JSON.stringify(["Talho (101)", "Peixaria (102)"]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
});
await pg.reload();

const busca = pg.locator("#f-svc-busca");
const itens = () => pg.locator("#f-svc-lista [data-svc]").allTextContents();
const aberta = async () => !(await pg.locator("#f-svc-lista").isHidden());

/* ---- 1. Uma só caixa, com o serviço escolhido; o <select> está escondido. ---- */
check(await pg.locator("#f-service").isHidden(), "o <select> do serviço não se vê");
check(await busca.inputValue() === "Talho (101)", "a caixa mostra o serviço escolhido: " + await busca.inputValue());
check(!(await aberta()), "a lista começa fechada");

/* ---- 2. Ao entrar na caixa, a lista: os da lista e, à parte, os das auditorias. ---- */
await busca.click();
check(await aberta(), "abre ao entrar na caixa");
check(JSON.stringify(await itens()) === JSON.stringify(["Talho (101)", "Peixaria (102)", "Padaria (103)"]),
  "os da lista e os das auditorias: " + (await itens()).join(" | "));
check(/Só em auditorias anteriores/.test(await pg.locator("#f-svc-lista .grupo").textContent()), "a Padaria num grupo à parte");
await busca.press("Escape");
check(!(await aberta()) && await busca.inputValue() === "Talho (101)", "Esc fecha e repõe");

/* ---- 3. Pelo código, com Enter. ---- */
await busca.fill("102");
check(JSON.stringify(await itens()) === JSON.stringify(["Peixaria (102)"]), "pelo código: só a Peixaria");
check(/1 de 3/.test(await pg.locator("#f-svc-conta").textContent()), "diz quantos casam");
await busca.press("Enter");
check(await valor() === "Peixaria (102)" && await busca.inputValue() === "Peixaria (102)" && !(await aberta()), "Enter escolhe e fecha");

/* ---- 4. Pelo nome sem acentos, com um toque, num serviço só das auditorias. ---- */
await busca.fill("PADARIA");
await pg.locator("#f-svc-lista [data-svc]").first().click();
check(await valor() === "Padaria (103)", "um toque escolhe");

/* ---- 5. Setas e Enter; sem resultados; sair sem escolher. ---- */
await busca.fill("a");
await busca.press("ArrowDown");
await busca.press("Enter");
check(await valor() === "Peixaria (102)", "a seta para baixo passa ao segundo: " + await valor());
await busca.fill("zzz");
check((await itens()).length === 0 && /Nenhum serviço com «zzz»/.test(await pg.locator("#f-svc-lista").textContent()), "sem resultados, diz-o");
await pg.locator("#f-date").click();
check(await valor() === "Peixaria (102)" && await busca.inputValue() === "Peixaria (102)", "sair sem escolher deixa o que estava");
await busca.fill("talho");
await pg.locator("#f-date").click();
check(await valor() === "Talho (101)", "sair com um só a casar escolhe-o");

/* ---- 3. A listagem do sistema (as colunas do Livro2.xlsx), em CSV. ---- */
await pg.locator("[data-v=cfg]").click();
const csv = path.join(os.tmpdir(), "5s-listagem-servicos.csv");
fs.writeFileSync(csv, "ID_SERVICO,DESCRICAO_SERVICO,LOCAL_SERVICO,SERVICO_ATIVO\n" +
  "teste2,teste 2,Interno,TRUE\nteste3,teste 3,Interno,TRUE\nteste4,teste 4,Externo,TRUE\nteste5,teste 5,Externo,FALSE\n");
await pg.locator("#xl-file").setInputFiles(csv);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("services") || "[]").length === 5, null, { timeout: 15000 }).catch(() => {});
await semDialogo(pg);
fs.unlinkSync(csv);
const svcs = await pg.evaluate(() => JSON.parse(localStorage.getItem("services")));
check(JSON.stringify(svcs) === JSON.stringify(["Talho (101)", "Peixaria (102)", "teste 2 (teste2)", "teste 3 (teste3)", "teste 4 (teste4)"]),
  "importa os activos como «Descrição (código)»: " + JSON.stringify(svcs));
check(caixas.some(c => /3 serviço\(s\).*tipo.*3 serviço\(s\).*1 inactivo/.test(c.texto)), "a confirmação diz os tipos e os inactivos: " + caixas.map(c => c.texto).join(" | "));
const tipos = await pg.evaluate(() => JSON.parse(localStorage.getItem("tipoSvc") || "[]"));
check(JSON.stringify(tipos) === JSON.stringify([{ s: "teste 2 (teste2)", t: "i" }, { s: "teste 3 (teste3)", t: "i" }, { s: "teste 4 (teste4)", t: "e" }]),
  "o local dá o tipo: " + JSON.stringify(tipos));

/* ---- 3b. 4.2.2: na Config, o tipo vindo do Excel lê-se, não se escolhe; e
   importar de novo actualiza-o. ---- */
check(await pg.locator("#svc-list [data-tipo-fixo]").count() === 3, "os 3 com tipo mostram-no só para ler");
check(await pg.locator("#svc-list select[data-tipo]").count() === 2, "os 2 sem tipo têm a caixa");
check(/Externo/.test(await pg.locator("[data-tipo-fixo='4']").textContent()), "teste4 é Externo");
const csv2 = path.join(os.tmpdir(), "5s-listagem-servicos-2.csv");
fs.writeFileSync(csv2, "ID_SERVICO,DESCRICAO_SERVICO,LOCAL_SERVICO,SERVICO_ATIVO\nteste4,teste 4,Interno,TRUE\n");
await pg.locator("#xl-file").setInputFiles(csv2);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("tipoSvc") || "[]").some(f => f.s === "teste 4 (teste4)" && f.t === "i"), null, { timeout: 15000 }).catch(() => {});
await semDialogo(pg);
fs.unlinkSync(csv2);
check(/Interno/.test(await pg.locator("[data-tipo-fixo='4']").textContent()), "o Excel novo muda o tipo de teste4 para Interno");
await pg.locator("[data-tipo='0']").selectOption("e");
check(await pg.locator("[data-tipo-fixo='0']").count() === 1, "escolhido à mão, passa a ler-se");

/* ---- 4. E pesquisam-se logo no Auditar. ---- */
await pg.locator("[data-v=audit]").click();
await busca.fill("teste4");
await busca.press("Enter");
check(await valor() === "teste 4 (teste4)", "o serviço importado encontra-se pelo código");

check(nativos.length === 0, "nenhum diálogo nativo: " + nativos.join(" | "));
await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da pesquisa do serviço OK");
process.exit(erros.length || falhas.length ? 1 : 0);
