/* Smoke test de browser do painel e-ink (v3.6.0): escolher a pasta em Config grava o
   5s.painel.json no formato do painel, e gravar uma auditoria volta a gravá-lo. O browser
   não tem pasta: uma de mentira, em memória, no lugar do showDirectoryPicker. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
import { abrirGruposCfg } from "./cfg.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const pg = await b.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
const BENIGNO = /frame-ancestors/;
pg.on("console", m => {
  if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text());
});
let nativos = 0;
pg.on("dialog", d => { nativos++; d.accept(""); });
/* Avisos e confirmações vêm na caixa da app desde 3.13.0: aceita-os todos. */
/* v4.23.0: `resposta` responde à próxima caixa (o nome deste computador); undefined = botão por omissão. */
let resposta;
await ligarDialogos(pg, () => resposta);
await pg.addInitScript(() => {
  const ficheiros = {};
  window.__PASTA = { ficheiros, escritas: 0 };
  let licenca = "granted";
  window.__PASTA.licenca = v => { licenca = v; };
  window.__PASTA.pedidos = 0;
  const handle = {
    kind: "directory", name: "partilhada",
    async queryPermission() { return licenca; },
    async requestPermission() { window.__PASTA.pedidos++; licenca = "granted"; return "granted"; },
    async getFileHandle(nome) {
      if (licenca !== "granted") throw new DOMException("Sem licença", "NotAllowedError");
      return { async createWritable() {
        let t = "";
        return { async write(x) { t += x; }, async close() { ficheiros[nome] = t; window.__PASTA.escritas++; }, async abort() {} };
      } };
    },
  };
  window.showDirectoryPicker = async () => handle;
});
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const feed = () => pg.evaluate(() => {
  const t = window.__PASTA.ficheiros["5s.painel.json"];
  return t ? JSON.parse(t) : null;
});

/* ---- 1. Sem pasta, nada é gravado; o cartão diz porquê. ---- */
await pg.locator("[data-v=cfg]").click();
await abrirGruposCfg(pg);
check((await pg.locator("#painel-estado").textContent()).includes("Nenhuma pasta"), "o cartão devia dizer que não há pasta");
check(await pg.evaluate(() => window.__PASTA.escritas) === 0, "não devia gravar sem pasta");

/* ---- 2. Escolher a pasta grava o ficheiro, no formato do painel. ---- */
await pg.locator("#btn-painel").click();
await pg.waitForFunction(() => !!window.__PASTA.ficheiros["5s.painel.json"], null, { timeout: 10000 });
let f = await feed();
check(f.formato === "painel-feed" && f.versao === 1 && f.app === "5s", "formato do ficheiro errado");
check(f.dados.total === 0 && f.dados.pilares.length === 5, "sem auditorias, o resumo devia estar vazio");
/* v3.17.0: os KPIs da página do painel, com o dia da app e os 12 meses. */
check(f.dados.kpis && /^\d{4}-\d{2}-\d{2}$/.test(f.dados.kpis.hoje) && f.dados.kpis.porMes.length === 12 &&
  f.dados.kpis.media30 === null, "o ficheiro devia levar os KPIs (vazios)");
check((await pg.locator("#painel-estado").textContent()).includes("partilhada"), "o cartão devia dizer a pasta");

/* ---- 2b. (4.23.0) Quem gravou: o nome deste computador, pedido na caixa da app ao escolher a pasta.
   Sem nome (Guardar com o campo vazio), um código PC-XXXX; «Mudar nome» muda-o e regrava o ficheiro. ---- */
check(/^PC-[A-Z0-9]{4}$/.test(f.autor || ""), "sem nome, o ficheiro devia levar um código PC-XXXX (tem " + f.autor + ")");
check((await pg.locator("#painel-autor").textContent()).includes(f.autor || "?"), "o cartão devia mostrar o código");
resposta = { campo: "PC Farmácia", botao: "Guardar" };
await pg.locator("#btn-painel-autor").click();
await pg.waitForFunction(() => (window.__PASTA.ficheiros["5s.painel.json"] || "").includes("PC Farmácia"), null, { timeout: 10000 }).catch(() => {});
await semDialogo(pg);
resposta = undefined;
f = await feed();
check(f.autor === "PC Farmácia", "«Mudar nome» devia gravar o nome novo (tem " + f.autor + ")");
check((await pg.locator("#painel-autor").textContent()).includes("PC Farmácia"), "o cartão devia mostrar o nome novo");
check(nativos === 0, "o nome devia ser pedido na caixa da app, não numa caixa nativa (" + nativos + ")");

/* ---- 3. Gravar uma auditoria volta a gravar o ficheiro (~2 s depois). ---- */
await pg.locator("[data-v=audit]").click();
await pg.locator("#f-verif").fill("Sicrano");
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await escolherServico(pg); await pg.locator("#btn-save").click();
await pg.waitForFunction(() => {
  const t = window.__PASTA.ficheiros["5s.painel.json"];
  return t && JSON.parse(t).dados.total === 1;
}, null, { timeout: 10000 }).catch(() => {});
f = await feed();
check(f.dados.total === 1 && f.dados.servicos.length === 1, "a auditoria gravada devia chegar ao ficheiro do painel");
check(f.dados.kpis && f.dados.kpis.porMes.reduce((t, m) => t + m.n, 0) === 1, "a auditoria gravada devia contar nos KPIs");

/* ---- 3b. (4.24.0) Sem licença: o aviso do topo diz-o, em qualquer vista; um clique em qualquer sítio da app dá acesso e grava. ---- */
await pg.locator("[data-v=audit]").click();
check(!(await pg.locator("#aviso-painel").isVisible()), "com licença não devia haver aviso do painel");
await pg.evaluate(() => window.__PASTA.licenca("prompt"));
await pg.evaluate(() => { window.__antes = window.__PASTA.escritas; });
await pg.locator("#f-verif").fill("Beltrano");
await pg.locator("[data-v=cfg]").click(); await pg.locator("[data-v=audit]").click();
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#f-date").fill("2026-01-03");
await escolherServico(pg); await pg.locator("#btn-save").click();
await pg.locator("#aviso-painel").waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
check(await pg.locator("#aviso-painel").isVisible(), "sem licença devia aparecer o aviso do painel");
check((await pg.locator("#aviso-painel-txt").textContent()).includes("Sem acesso de gravação"), "o aviso devia dizer que falta o acesso");
await pg.mouse.click(5, 5);   /* um clique em qualquer sítio da app */
await pg.waitForFunction(() => document.getElementById("aviso-painel").classList.contains("hidden"), null, { timeout: 10000 }).catch(() => {});
check(!(await pg.locator("#aviso-painel").isVisible()), "dada a licença, o aviso devia sair");
check(await pg.evaluate(() => window.__PASTA.pedidos) === 1, "um só pedido de licença");
f = await feed();
check(f.dados.total === 2, "ao dar acesso devia gravar a auditoria que ficou por gravar (tem " + f.dados.total + ")");

/* ---- 4. «Deixar de gravar» (3.6.1) larga a pasta: nada mais é gravado. ---- */
await pg.locator("[data-v=cfg]").click();
await abrirGruposCfg(pg);
check(await pg.locator("#btn-painel-off").isVisible(), "com pasta escolhida devia haver «Deixar de gravar»");
await pg.locator("#btn-painel-off").click();
await pg.waitForFunction(() => document.getElementById("painel-estado").textContent.includes("Nenhuma pasta"), null, { timeout: 5000 }).catch(() => {});
check((await pg.locator("#painel-estado").textContent()).includes("Nenhuma pasta"), "depois de largar, o cartão devia dizer que não há pasta");
check(!(await pg.locator("#btn-painel-off").isVisible()), "sem pasta, «Deixar de gravar» devia desaparecer");
const antes = await pg.evaluate(() => window.__PASTA.escritas);
await pg.locator("[data-v=audit]").click();
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#f-date").fill("2026-01-02");
await escolherServico(pg); await pg.locator("#btn-save").click();
await pg.waitForTimeout(2600);
check(await pg.evaluate(() => window.__PASTA.escritas) === antes, "depois de largar a pasta não devia gravar mais");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do painel OK");
process.exit(erros.length || falhas.length ? 1 : 0);
