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
let escolhaListagem = "Juntar à lista";   /* 4.2.5: a listagem do sistema pergunta Substituir ou Juntar */
await ligarDialogos(pg, d => { caixas.push(d); if (d.titulo === "Importar listagem de serviços") return escolhaListagem; });
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
check(await busca.inputValue() === "" && await valor() === "", "4.2.6: uma auditoria nova começa sem serviço: " + await busca.inputValue());
check(!(await aberta()), "a lista começa fechada");
for (const el of await pg.locator("[data-pick]").all()) await el.fill("2");
await pg.locator("#btn-save").click();
await semDialogo(pg);
check(caixas.some(c => c.titulo === "Falta o serviço"), "sem serviço, gravar pede-o");
check(await pg.evaluate(() => JSON.parse(localStorage.getItem("audits")).length) === 1, "e não grava");

/* ---- 2. Ao entrar na caixa, a lista: os da lista e, à parte, os das auditorias. ---- */
await busca.click();
check(await aberta(), "abre ao entrar na caixa");
check(JSON.stringify(await itens()) === JSON.stringify(["Talho (101)", "Peixaria (102)", "Padaria (103)"]),
  "os da lista e os das auditorias: " + (await itens()).join(" | "));
check(/Só em auditorias anteriores/.test(await pg.locator("#f-svc-lista .grupo").textContent()), "a Padaria num grupo à parte");
await busca.press("Escape");
check(!(await aberta()) && await busca.inputValue() === "", "Esc fecha e repõe (sem serviço)");

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
check(caixas.some(c => /3 serviço\(s\) activo\(s\): 2 interno\(s\), 1 externo\(s\)\. 1 inactivo/.test(c.texto)), "a pergunta diz os tipos e os inactivos: " + caixas.map(c => c.texto).join(" | "));
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

/* ---- 3c. 4.2.3: pelo código. Um serviço da lista com outra descrição e o
   mesmo código recebe o tipo e não se duplica; os que ficam sem tipo são
   ditos na confirmação. ---- */
await pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("services"));
  localStorage.setItem("services", JSON.stringify(s.concat(["Téc.Nefrol. (70EE10)", "Piso E"])));
});
await pg.reload();
await pg.locator("[data-v=cfg]").click();
caixas.length = 0;
const csv3 = path.join(os.tmpdir(), "5s-listagem-servicos-3.csv");
fs.writeFileSync(csv3, "ID_SERVICO,DESCRICAO_SERVICO,LOCAL_SERVICO,SERVICO_ATIVO\n70EE10,Téc.Nefrol,Interno,TRUE\n");
await pg.locator("#xl-file").setInputFiles(csv3);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("tipoSvc") || "[]").some(f => f.s === "Téc.Nefrol. (70EE10)"), null, { timeout: 15000 }).catch(() => {});
await semDialogo(pg);
fs.unlinkSync(csv3);
const svcs3 = await pg.evaluate(() => JSON.parse(localStorage.getItem("services")));
check(!svcs3.includes("Téc.Nefrol (70EE10)"), "o mesmo código com outra descrição não se duplica: " + JSON.stringify(svcs3));
check(await pg.evaluate(() => JSON.parse(localStorage.getItem("tipoSvc")).some(f => f.s === "Téc.Nefrol. (70EE10)" && f.t === "i")),
  "o tipo vai para o serviço da lista com o mesmo código");
check(caixas.some(c => /Juntar à lista: acrescenta 0 serviço/.test(c.texto)), "Juntar não acrescenta o do mesmo código: " + caixas.map(c => c.texto).join(" | "));
check(caixas.some(c => /Importação concluída/.test(c.texto) && /sem tipo.*Piso E/.test(c.texto)),
  "o aviso final diz os que ficam sem tipo: " + caixas.map(c => c.texto).join(" | "));

/* ---- 3d. 4.2.5: a listagem real tem HPH e ACES no local, e pode substituir
   a lista. As auditorias ficam, e os serviços delas continuam na pesquisa. ---- */
caixas.length = 0;
escolhaListagem = "Substituir a lista";
const csv4 = path.join(os.tmpdir(), "5s-listagem-servicos-4.csv");
fs.writeFileSync(csv4, "\ufeffID_SERVICO,DESCRICAO_SERVICO,LOCAL_SERVICO,SERVICO_ATIVO\n1,USF Porta Sol,ACES,TRUE\n11120,Unidade de Cuidados Intermédios Polivalente,HPH,TRUE\n");
await pg.locator("#xl-file").setInputFiles(csv4);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("services") || "[]").length === 2, null, { timeout: 15000 }).catch(() => {});
await semDialogo(pg);
fs.unlinkSync(csv4);
check(caixas.some(c => /2 serviço\(s\) activo\(s\): 1 interno\(s\), 1 externo\(s\)/.test(c.texto) && /Saem \d+ serviço/.test(c.texto)),
  "a pergunta diz os tipos HPH/ACES e quantos saem: " + caixas.map(c => c.texto).join(" | "));
check(JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("services")))) ===
  JSON.stringify(["USF Porta Sol (1)", "Unidade de Cuidados Intermédios Polivalente (11120)"]), "a lista passa a ser a do ficheiro: " + JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("services")))));
check(JSON.stringify(await pg.evaluate(() => JSON.parse(localStorage.getItem("tipoSvc")))) ===
  JSON.stringify([{ s: "USF Porta Sol (1)", t: "e" }, { s: "Unidade de Cuidados Intermédios Polivalente (11120)", t: "i" }]), "ACES é Externo, HPH é Interno");
check(await pg.evaluate(() => JSON.parse(localStorage.getItem("audits")).length) === 1, "as auditorias ficam");
await pg.locator("[data-v=audit]").click();
await busca.fill("padaria");
check(await pg.locator("#f-svc-lista [data-svc]").count() === 1, "o serviço da auditoria antiga continua na pesquisa");
await busca.press("Escape");
await pg.locator("[data-v=cfg]").click();

/* ---- 4. E pesquisam-se logo no Auditar. ---- */
await pg.locator("[data-v=audit]").click();
await busca.fill("11120");
await busca.press("Enter");
check(await valor() === "Unidade de Cuidados Intermédios Polivalente (11120)", "o serviço importado encontra-se pelo código");

check(nativos.length === 0, "nenhum diálogo nativo: " + nativos.join(" | "));
await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da pesquisa do serviço OK");
process.exit(erros.length || falhas.length ? 1 : 0);
