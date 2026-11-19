/* Smoke test de browser da Configuração em grupos (v4.9.0): «Dados» abre sempre ao
   entrar na Config, os outros grupos começam fechados e mostram um resumo, e
   «Abrir tudo» / «Fechar tudo» abre e fecha todos. Tira também capturas (PC e
   telemóvel) para a pasta indicada em CAPTURAS, se existir.
   v4.10.0: Dados → Importar → Perguntas pede o código, abre o editor (no grupo
   das perguntas, fechado) e a escolha do ficheiro; importa como o editor. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const CAPTURAS = process.env.CAPTURAS || "";
const b = await chromium.launch();
const erros = [];
const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const aberto = (pg, id) => pg.locator("#" + id).evaluate(d => d.open);

for (const [nome, viewport] of [["pc", { width: 900, height: 1000 }], ["telemovel", { width: 390, height: 844 }]]) {
  const pg = await b.newPage({ viewport });
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
  await ligarDialogos(pg, ({ temCampo }) => (temCampo ? { campo: "3758", botao: "Confirmar" } : undefined));
  await pg.goto(URL);
  await pg.locator("[data-v=cfg]").click();

  /* 1. Dados aberto, os outros fechados e com resumo. */
  check(await aberto(pg, "grp-dados"), nome + ": Dados devia abrir sozinho");
  for (const g of ["grp-servicos", "grp-perguntas", "grp-pin"])
    check(!(await aberto(pg, g)), nome + ": " + g + " devia começar fechado");
  check(await pg.locator("#btn-expjson").isVisible(), nome + ": Exportar devia estar à vista");
  check(await pg.locator("#btn-impxl").isVisible(), nome + ": Importar Excel devia estar em Dados");
  check(!(await pg.locator("#btn-addsvc").isVisible()), nome + ": Serviços devia estar fechado");
  check(/serviço/.test(await pg.locator("#res-servicos").textContent()), nome + ": resumo dos serviços em falta");
  check(/pergunta/.test(await pg.locator("#res-perguntas").textContent()), nome + ": resumo das perguntas em falta");
  check(/código/.test(await pg.locator("#res-pin").textContent()), nome + ": resumo do código em falta");
  check(/auditoria/.test(await pg.locator("#res-dados").textContent()), nome + ": resumo dos dados em falta");
  if (CAPTURAS) await pg.screenshot({ path: `${CAPTURAS}/config-${nome}.png`, fullPage: true });

  /* 2. Abrir um grupo pelo título (toque ou teclado). */
  await pg.locator("#grp-servicos > summary").click();
  check(await pg.locator("#btn-addsvc").isVisible(), nome + ": abrir Serviços devia mostrar o botão Adicionar");

  /* 3. Abrir tudo / Fechar tudo. */
  await pg.locator("#cfg-tudo").click();
  for (const g of ["grp-dados", "grp-servicos", "grp-perguntas", "grp-pin"])
    check(await aberto(pg, g), nome + ": «Abrir tudo» devia abrir " + g);
  check((await pg.locator("#cfg-tudo").textContent()) === "Fechar tudo", nome + ": o botão devia passar a «Fechar tudo»");
  await pg.locator("#cfg-tudo").click();
  check(!(await aberto(pg, "grp-dados")), nome + ": «Fechar tudo» devia fechar Dados");

  /* 4. Voltar à Config abre Dados outra vez. */
  await pg.locator("[data-v=history]").click();
  await pg.locator("[data-v=cfg]").click();
  check(await aberto(pg, "grp-dados"), nome + ": ao voltar à Config, Dados devia abrir");

  /* 5. Importar perguntas a partir de Dados (só no PC: basta uma vez). */
  if (nome === "pc") {
    check(!(await aberto(pg, "grp-perguntas")), "pc: Perguntas devia estar fechado antes do atalho");
    const perguntas = [{ n: 1, p: "Seiri", c: "Pergunta importada A", r: "U", t: "count", l: 3 },
      { n: 2, p: "Seiton", c: "Pergunta importada B", r: "U", t: "count", l: 3 }];
    const [escolha] = await Promise.all([
      pg.waitForEvent("filechooser"),
      pg.locator("#btn-impperg").click(),
    ]);
    check(await aberto(pg, "grp-perguntas"), "pc: o atalho devia abrir o grupo das perguntas");
    check(await pg.locator("#ed-panel").isVisible(), "pc: o atalho devia abrir o editor");
    await escolha.setFiles({ name: "perguntas.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(perguntas)) });
    await pg.waitForFunction(() => document.querySelectorAll("#ed-list .ed-item").length === 2);
    await semDialogo(pg);
    check(/Pergunta importada A/.test(await pg.locator("#ed-list").innerHTML()), "pc: o editor devia ter as perguntas do ficheiro");
  }
  await pg.close();
}
await b.close();

if (erros.length) { console.log("ERROS DE JS:\n" + erros.join("\n")); process.exitCode = 1; }
else console.log("sem erros de JS");
if (falhas.length) { console.log("FALHAS:\n" + falhas.join("\n")); process.exitCode = 1; }
else console.log("smoke da configuração OK");
