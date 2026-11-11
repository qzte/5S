/* Smoke test de browser da CSP publicada (3.10.0): a pasta dist/ que o
   scripts/publicar.sh prepara é servida tal como um alojamento a serve, e a app
   tem de arrancar e funcionar sem nenhuma violação da CSP — os <script>
   embutidos são autorizados pelo hash, e o SheetJS, ficheiro da própria origem,
   pelo 'self'. Um <script> injectado depois não corre.

   Vale a CSP do <meta>, a única desde que o _headers deixou de existir (3.23.0). */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
import { execFileSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const { chromium } = pw;

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(RAIZ, "dist");
const PORTA = 8766;
execFileSync("bash", [path.join(RAIZ, "scripts", "publicar.sh")], { stdio: "pipe" });
const srv = spawn("python3", ["-m", "http.server", String(PORTA), "--bind", "127.0.0.1", "--directory", DIST],
  { stdio: "ignore" });
const URL = `http://127.0.0.1:${PORTA}/index.html`;
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(URL)).ok) break; } catch (e) { /* ainda a arrancar */ }
  await new Promise(r => setTimeout(r, 100));
}

const b = await chromium.launch();
const pg = await b.newPage();
const erros = [], violacoes = [];
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => {
  if (m.type() !== "error") return;
  if (/Content Security Policy/i.test(m.text())) violacoes.push(m.text());
  else erros.push(m.text());
});
pg.on("dialog", d => d.accept(""));
/* Avisos e confirmações vêm na caixa da app desde 3.13.0: aceita-os todos. */
await ligarDialogos(pg, () => undefined);
await pg.addInitScript(() => {
  window.__violacoes = [];
  document.addEventListener("securitypolicyviolation", e =>
    window.__violacoes.push(e.violatedDirective + " " + (e.blockedURI || "inline")));
});
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };

const csp = await pg.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
check(!/script-src[^;]*unsafe-inline/.test(csp), "a CSP publicada não pode ter 'unsafe-inline' no script-src");
check(/^v\d+\.\d+\.\d+$/.test(await pg.locator("#app-ver").textContent()), "o script da app devia ter corrido");
check(await pg.locator("[data-pick]").count() === 19, "o formulário devia ter os 19 itens");
/* O SheetJS (3.11.0) não carrega no arranque: só quando é preciso, como ficheiro
   da própria origem (script-src 'self') e com o integrity verificado. */
check(await pg.evaluate(() => typeof XLSX === "undefined"), "o SheetJS não devia carregar no arranque");
await pg.evaluate(() => loadXLSX());
check(await pg.evaluate(() => typeof XLSX === "object" && typeof XLSX.utils === "object"),
  "o SheetJS devia carregar a pedido, com a CSP publicada e o integrity");
await pg.locator("[data-v=stats]").click();
await pg.locator("[data-v=cfg]").click();

/* Um <script> acrescentado à página já não corre. */
await pg.evaluate(() => {
  const s = document.createElement("script");
  s.textContent = "window.__injectado = true";
  document.body.appendChild(s);
});
await pg.waitForTimeout(100);
check(await pg.evaluate(() => window.__injectado !== true), "um <script> injectado não pode correr");
const v = await pg.evaluate(() => window.__violacoes);
check(v.length === 1 && /script-src/.test(v[0]),
  "a única violação devia ser a do <script> injectado: " + JSON.stringify(v));

await b.close();
srv.kill();
fs.rmSync(DIST, { recursive: true, force: true });
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da CSP OK");
process.exit(erros.length || falhas.length ? 1 : 0);
