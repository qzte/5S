/* Smoke test do tema (4.17.0), em Config → Aspecto:
   - Automático segue o aparelho (modo escuro do browser);
   - Sempre claro fica claro com o aparelho em escuro, e Sempre escuro fica
     escuro com o aparelho em claro;
   - a escolha guarda-se neste aparelho e aplica-se antes de pintar, ao abrir;
   - a impressão e o PDF (modoImpressao) ficam sempre claros. */
import pw from "playwright";
import { ligarDialogos } from "./dialogos.mjs";
import { abrirGruposCfg } from "./cfg.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const erros = [], falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const CLARO = "rgb(244, 241, 234)", ESCURO = "rgb(16, 24, 21)";
const fundo = pg => pg.evaluate(() => getComputedStyle(document.body).backgroundColor);

for (const aparelho of ["dark", "light"]) {
  const pg = await b.newPage({ colorScheme: aparelho, viewport: { width: 400, height: 800 } });
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
  await ligarDialogos(pg, () => undefined);
  await pg.goto(URL);
  const auto = aparelho === "dark" ? ESCURO : CLARO, outro = aparelho === "dark" ? CLARO : ESCURO;
  check(await fundo(pg) === auto, aparelho + ": em Automático segue o aparelho");
  await pg.locator("[data-v=cfg]").click();
  await abrirGruposCfg(pg);
  check(/Automático/.test(await pg.locator("#res-aspecto").textContent()), aparelho + ": o resumo diz Automático");
  const escolha = aparelho === "dark" ? "claro" : "escuro";
  await pg.locator(`button[data-tema="${escolha}"]`).click();
  check(await fundo(pg) === outro, aparelho + ": escolher «" + escolha + "» muda logo o fundo");
  check((await pg.locator(`button[data-tema="${escolha}"]`).getAttribute("aria-pressed")) === "true", aparelho + ": o botão fica marcado");
  await pg.reload();
  check(await fundo(pg) === outro, aparelho + ": a escolha fica depois de recarregar");
  check(await pg.evaluate(() => document.documentElement.getAttribute("data-tema")) === escolha, aparelho + ": aplicada ao abrir");
  await pg.locator("[data-v=cfg]").click();
  await abrirGruposCfg(pg);
  await pg.locator('button[data-tema="auto"]').click();
  check(await fundo(pg) === auto && await pg.evaluate(() => localStorage.getItem("tema")) === null, aparelho + ": Automático volta a seguir o aparelho");
  /* O PDF: modoImpressao (o que se aplica à cópia que o html2canvas desenha)
     deixa a página clara, com qualquer tema. Aqui aplica-se à própria página,
     com «Sempre escuro», no fim do teste. */
  await pg.evaluate(() => document.documentElement.setAttribute("data-tema", "escuro"));
  check(await fundo(pg) === ESCURO, aparelho + ": com «Sempre escuro» o fundo é escuro");
  await pg.evaluate(() => modoImpressao(document));
  check(["rgb(255, 255, 255)", CLARO].includes(await fundo(pg)), aparelho + ": o PDF fica claro (branco do papel): " + await fundo(pg));
  await pg.close();
}
await b.close();
if (erros.length) { console.log("ERROS DE JS:\n" + erros.join("\n")); process.exitCode = 1; }
else console.log("sem erros de JS");
if (falhas.length) { console.log("FALHAS:\n" + falhas.join("\n")); process.exitCode = 1; }
else console.log("smoke do tema OK");
