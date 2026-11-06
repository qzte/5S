/* Smoke test de acessibilidade (3.10.0): o axe-core corre sobre cada vista da
   app — Auditar, Histórico, Análise, Configuração, editor de perguntas e
   Relatório —, em modo claro e em modo escuro, e não pode encontrar nenhuma
   violação das regras WCAG 2 A e AA que verifica (contraste, rótulos dos
   campos, ordem dos títulos, nomes dos botões, ...).

   O axe-core vem de tools/lint (npm ci --prefix tools/lint), com a versão do
   lockfile. */
import pw from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const AXE = path.join(RAIZ, "tools", "lint", "node_modules", "axe-core", "axe.min.js");
if (!fs.existsSync(AXE)) {
  console.error("smoke-a11y: falta o axe-core. Corra antes: npm ci --prefix tools/lint");
  process.exit(2);
}
const axe = fs.readFileSync(AXE, "utf8");
const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];

for (const modo of ["light", "dark"]) {
  const pg = await b.newPage({ colorScheme: modo, viewport: { width: 420, height: 900 } });
  pg.on("pageerror", e => erros.push(modo + ": " + e));
  pg.on("dialog", d => d.accept(""));
  await ligarDialogos(pg, () => ({ campo: "3758", botao: "Confirmar" }));
  await pg.goto(URL);
  /* Duas auditorias, para o Histórico, a Análise e o Relatório terem conteúdo,
     e uma resposta no formulário, para os estados de seleção aparecerem. */
  await pg.evaluate(() => {
    const it = ITEMS.map(x => Object.assign({}, x));
    const mk = (id, date, f) => ({ id, service: "Loja A", date, verif: "V",
      scores: it.map((_, i) => f(i)), raw: it.map(() => null), tgts: it.map(() => null), items: it });
    /* Com plano de acções (3.12.0): uma em atraso e uma feita, para o cartão do
       formulário e a folha do relatório serem verificados também. */
    const a1 = mk(1, "2026-01-10", () => 2);
    a1.acoes = [{ id: 1, r: "U", texto: "Retirar caixas", prazo: "2020-01-01", estado: "aberta", feitaEm: "", item: 1 }];
    const a2 = mk(2, "2026-03-05", i => i % 3);
    a2.acoes = [{ id: 1, r: "M", texto: "Rever etiquetas", prazo: "", estado: "feita", feitaEm: "2026-03-06", item: null }];
    localStorage.setItem("audits", JSON.stringify([a1, a2]));
    localStorage.setItem("services", JSON.stringify(["Loja A", "Loja B"]));
    /* Frequências (3.13.0): o cartão dos prazos e o contador entram na verificação. */
    localStorage.setItem("freqAud", JSON.stringify([{ s: "Loja A", d: 7 }, { s: "Loja B", d: 30 }]));
  });
  await pg.reload();
  await pg.locator("[data-pick='0']").fill("2");

  const vistas = [
    ["Auditar", async () => pg.locator("[data-v=audit]").click()],
    ["Histórico", async () => pg.locator("[data-v=history]").click()],
    ["Análise", async () => pg.locator("[data-v=stats]").click()],
    ["Configuração", async () => pg.locator("[data-v=cfg]").click()],
    ["Editor de perguntas", async () => { await pg.locator("#btn-askpin").click(); await semDialogo(pg); }],
    ["Relatório", async () => { await pg.locator("[data-v=history]").click(); await pg.locator("[data-rep='0']").click(); }]
  ];
  for (const [nome, abrir] of vistas) {
    await abrir();
    await pg.addScriptTag({ content: axe });
    const v = await pg.evaluate(async () => (await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
      resultTypes: ["violations"]
    })).violations.map(x => x.id + " (" + x.nodes.length + "): " +
      x.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")));
    v.forEach(x => falhas.push(`[${modo}] ${nome}: ${x}`));
  }
  await pg.close();
}

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke de acessibilidade OK");
process.exit(erros.length || falhas.length ? 1 : 0);
