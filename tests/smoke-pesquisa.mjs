/* Smoke test de browser da 4.2.0: pesquisar o serviço a auditar e importar a
   listagem de serviços do sistema.

   - No separador Auditar, o campo de pesquisa filtra os serviços pelo nome ou
     pelo código, sem acentos nem maiúsculas; mostra os da lista e os que só
     existem em auditorias já feitas (num grupo à parte), e escolhe o primeiro.
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
const opcoes = () => pg.locator("#f-service option").allTextContents();
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

/* ---- 1. Sem pesquisa: todos, os da lista primeiro. ---- */
check(JSON.stringify(await opcoes()) === JSON.stringify(["Talho (101)", "Peixaria (102)", "Padaria (103)"]),
  "os da lista e os das auditorias: " + (await opcoes()).join(" | "));
check(await pg.locator("#f-service optgroup[label='Só em auditorias anteriores'] option").count() === 1, "a Padaria num grupo à parte");
check(/2 na lista e 1 só em auditorias anteriores/.test(await pg.locator("#f-svc-conta").textContent()), "diz de onde vêm");

/* ---- 2. Pelo código, pelo nome sem acentos, e sem resultados. ---- */
await pg.locator("#f-svc-busca").fill("102");
check(JSON.stringify(await opcoes()) === JSON.stringify(["Peixaria (102)"]) && await valor() === "Peixaria (102)", "pelo código: só a Peixaria, escolhida");
check(/1 de 3/.test(await pg.locator("#f-svc-conta").textContent()), "diz quantos casam");
await pg.locator("#f-svc-busca").fill("PADARIA");
check(await valor() === "Padaria (103)", "pelo nome, um serviço que só existe numa auditoria");
await pg.locator("#f-svc-busca").fill("zzz");
check((await opcoes()).length === 0 && /Nenhum serviço com «zzz»/.test(await pg.locator("#f-svc-conta").textContent()), "sem resultados, diz-o");
await pg.locator("#f-svc-busca").fill("");
check((await opcoes()).length === 3, "limpar a pesquisa mostra todos");

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

/* ---- 4. E pesquisam-se logo no Auditar. ---- */
await pg.locator("[data-v=audit]").click();
await pg.locator("#f-svc-busca").fill("teste4");
check(await valor() === "teste 4 (teste4)", "o serviço importado encontra-se pelo código");

check(nativos.length === 0, "nenhum diálogo nativo: " + nativos.join(" | "));
await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da pesquisa do serviço OK");
process.exit(erros.length || falhas.length ? 1 : 0);
