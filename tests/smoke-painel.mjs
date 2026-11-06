/* Smoke test de browser do painel e-ink (v3.6.0): escolher a pasta em Config grava o
   5s.painel.json no formato do painel, e gravar uma auditoria volta a gravá-lo. O browser
   não tem pasta: uma de mentira, em memória, no lugar do showDirectoryPicker. */
import pw from "playwright";
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
pg.on("dialog", d => d.accept(""));
await pg.addInitScript(() => {
  const ficheiros = {};
  window.__PASTA = { ficheiros, escritas: 0 };
  const handle = {
    kind: "directory", name: "partilhada",
    async queryPermission() { return "granted"; },
    async requestPermission() { return "granted"; },
    async getFileHandle(nome) {
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
check((await pg.locator("#painel-estado").textContent()).includes("Nenhuma pasta"), "o cartão devia dizer que não há pasta");
check(await pg.evaluate(() => window.__PASTA.escritas) === 0, "não devia gravar sem pasta");

/* ---- 2. Escolher a pasta grava o ficheiro, no formato do painel. ---- */
await pg.locator("#btn-painel").click();
await pg.waitForFunction(() => !!window.__PASTA.ficheiros["5s.painel.json"], null, { timeout: 10000 });
let f = await feed();
check(f.formato === "painel-feed" && f.versao === 1 && f.app === "5s", "formato do ficheiro errado");
check(f.dados.total === 0 && f.dados.pilares.length === 5, "sem auditorias, o resumo devia estar vazio");
check((await pg.locator("#painel-estado").textContent()).includes("partilhada"), "o cartão devia dizer a pasta");

/* ---- 3. Gravar uma auditoria volta a gravar o ficheiro (~2 s depois). ---- */
await pg.locator("[data-v=audit]").click();
await pg.locator("#f-verif").fill("Sicrano");
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#btn-save").click();
await pg.waitForFunction(() => {
  const t = window.__PASTA.ficheiros["5s.painel.json"];
  return t && JSON.parse(t).dados.total === 1;
}, null, { timeout: 10000 }).catch(() => {});
f = await feed();
check(f.dados.total === 1 && f.dados.servicos.length === 1, "a auditoria gravada devia chegar ao ficheiro do painel");

/* ---- 4. «Deixar de gravar» (3.6.1) larga a pasta: nada mais é gravado. ---- */
await pg.locator("[data-v=cfg]").click();
check(await pg.locator("#btn-painel-off").isVisible(), "com pasta escolhida devia haver «Deixar de gravar»");
await pg.locator("#btn-painel-off").click();
await pg.waitForFunction(() => document.getElementById("painel-estado").textContent.includes("Nenhuma pasta"), null, { timeout: 5000 }).catch(() => {});
check((await pg.locator("#painel-estado").textContent()).includes("Nenhuma pasta"), "depois de largar, o cartão devia dizer que não há pasta");
check(!(await pg.locator("#btn-painel-off").isVisible()), "sem pasta, «Deixar de gravar» devia desaparecer");
const antes = await pg.evaluate(() => window.__PASTA.escritas);
await pg.locator("[data-v=audit]").click();
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#f-date").fill("2026-01-02");
await pg.locator("#btn-save").click();
await pg.waitForTimeout(2600);
check(await pg.evaluate(() => window.__PASTA.escritas) === antes, "depois de largar a pasta não devia gravar mais");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do painel OK");
process.exit(erros.length || falhas.length ? 1 : 0);
