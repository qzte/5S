/* Smoke test de browser do funcionamento offline e da actualização (3.15.0).

   Corre sobre a versão PUBLICADA — o dist/ do scripts/publicar.sh, com a CSP
   por hashes —, copiada para uma pasta temporária que o teste pode alterar e
   servida por um servidor que o teste pode desligar:

   1. a instalação guarda em cache todos os ficheiros de ASSETS;
   2. sem rede, a app abre, grava uma auditoria e mostra o relatório;
   3. com o servidor a dar 404, ou desligado, abre a cópia em cache (3.7.0);
   2b. o guia abre da Config e sem rede, e não toma o lugar da app guardada;
   4. uma actualização a sério — sw.js e index.html mudados no servidor —
      mostra o aviso "Nova versão", e Recarregar passa para a versão nova sem
      perder a auditoria por terminar; a cache antiga é apagada;
   5. depois de actualizada, sem rede, abre a versão nova. */
import pw from "playwright";
import { execFileSync, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { ligarDialogos } from "./dialogos.mjs";
const { chromium } = pw;

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = fs.mkdtempSync(path.join(os.tmpdir(), "5s-offline-"));
execFileSync("bash", [path.join(RAIZ, "scripts", "publicar.sh")], { stdio: "pipe" });
fs.cpSync(path.join(RAIZ, "dist"), PASTA, { recursive: true });
fs.rmSync(path.join(RAIZ, "dist"), { recursive: true, force: true });

const PORTA = 8767, URL = `http://127.0.0.1:${PORTA}/index.html`;
let srv = null;
const ligar = async () => {
  srv = spawn("python3", ["-m", "http.server", String(PORTA), "--bind", "127.0.0.1", "--directory", PASTA], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(URL)).ok) return; } catch (e) { /* a arrancar */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("o servidor de teste não arrancou");
};
const desligar = () => new Promise(r => { srv.once("exit", r); srv.kill(); });
await ligar();

const b = await chromium.launch();
const ctx = await b.newContext();
const pg = await ctx.newPage();
const erros = [];
/* Sem rede, os pedidos falhados aparecem na consola: são o que se está a testar. */
const ESPERADO = /frame-ancestors|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED|404 \(File not found\)|Failed to load resource/;
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !ESPERADO.test(m.text())) erros.push(m.text()); });
pg.on("dialog", d => d.accept(""));
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const abriuApp = async () => (await pg.locator("[data-pick]").count()) === 19 && /^v\d/.test(await pg.locator("#app-ver").textContent());

/* ---- 1. Instalação: controlador activo e ASSETS em cache. ---- */
await pg.evaluate(async () => {
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller)
    await new Promise(r => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
});
const assets = JSON.parse(fs.readFileSync(path.join(PASTA, "sw.js"), "utf8").match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
const emCache = await pg.evaluate(async lista => {
  const out = [];
  for (const a of lista) out.push(!!(await caches.match(new URL(a, location.href).href)));
  return out;
}, assets);
check(emCache.every(Boolean), "todos os ASSETS deviam estar em cache: " + assets.filter((_, i) => !emCache[i]).join(", "));
const versaoAntes = await pg.evaluate(() => caches.keys());

/* ---- 2. Sem rede: abre, grava, mostra o relatório. ---- */
await ctx.setOffline(true);
await pg.reload();
check(await abriuApp(), "sem rede, a app devia abrir a partir da cache");
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("#btn-save").click();
check(!(await pg.locator("#view-report").isHidden()), "sem rede, gravar devia abrir o relatório");
check(await pg.evaluate(() => audits.length) === 1, "e a auditoria devia ficar gravada");
await ctx.setOffline(false);

/* ---- 2b. O guia (3.16.0): abre da Config, volta à app; sem rede, cada página
   é a sua — abrir o guia não pode pôr o guia no lugar da app guardada. ---- */
await pg.locator("[data-v=cfg]").click();
await Promise.all([pg.waitForNavigation(), pg.locator("#lnk-guia").click()]);
check(/^Guia de utilização/.test(await pg.title()) && await pg.locator("h1").textContent() === "Guia de utilização",
  "a ligação da Config devia abrir o guia");
await Promise.all([pg.waitForNavigation(), pg.locator("header a").click()]);
check(await abriuApp(), "Voltar à aplicação devia abrir a app");
await ctx.setOffline(true);
await pg.goto(URL.replace("index.html", "guia.html"));
check(/^Guia de utilização/.test(await pg.title()), "sem rede, o guia devia abrir a partir da cache");
await pg.goto(URL.replace("index.html", ""));
check(await abriuApp(), "sem rede, a raiz tem de abrir a app, e não o guia aberto antes");
await ctx.setOffline(false);
await pg.goto(URL);

/* ---- 3. Servidor a dar 404, e servidor desligado: a cópia em cache. ---- */
fs.renameSync(path.join(PASTA, "index.html"), path.join(PASTA, "index.html.bak"));
await pg.goto(URL);
check(await abriuApp(), "com o servidor a dar 404, devia abrir a cópia em cache");
fs.renameSync(path.join(PASTA, "index.html.bak"), path.join(PASTA, "index.html"));
await desligar();
await pg.goto(URL).catch(() => {});
check(await abriuApp(), "com o servidor desligado, devia abrir a cópia em cache");
await ligar();
await pg.goto(URL);

/* ---- 4. Actualização a sério. ---- */
await pg.locator("[data-v=audit]").click();
await pg.locator("[data-pick='0']").fill("3");          /* uma auditoria por terminar */
const sw = path.join(PASTA, "sw.js"), html = path.join(PASTA, "index.html");
fs.writeFileSync(sw, fs.readFileSync(sw, "utf8").replace(/const APP_VERSION = "[^"]+";/, 'const APP_VERSION = "9.9.9-teste";'));
/* Muda-se o <title>, fora dos <script>: mexer num script invalidava o hash da CSP. */
fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace(/<title>([^<]*)<\/title>/, "<title>$1 (nova)</title>"));
check(await pg.locator("#aviso-versao").isHidden(), "antes de haver versão nova, não há aviso");
/* Pede-se a verificação até o aviso aparecer (até 15 s), em vez de uma só vez:
   um update() pedido enquanto o browser ainda tem uma verificação sua em curso
   pode juntar-se a ela, que leu o sw.js de antes da mudança. Na CI isto deixou
   o teste à espera do aviso uma vez. Um browser real volta a verificar sozinho. */
const actualizou = await pg.evaluate(async () => {
  const visivel = () => !document.getElementById("aviso-versao").classList.contains("hidden");
  const r = await navigator.serviceWorker.getRegistration();
  for (let i = 0; i < 30 && !visivel(); i++) {
    await r.update().catch(() => {});
    await new Promise(res => setTimeout(res, 500));
  }
  return visivel();
});
if (!actualizou) {
  /* Para a falha dizer porquê, e não só que esperou. */
  const estado = await pg.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    const sw = await (await fetch("./sw.js", { cache: "no-store" })).text();
    return { active: r.active && r.active.state, waiting: !!r.waiting, installing: r.installing && r.installing.state,
      caches: await caches.keys(), servido: (sw.match(/APP_VERSION = "[^"]+"/) || [""])[0] };
  });
  falhas.push("uma versão nova no servidor devia mostrar o aviso; estado: " + JSON.stringify(estado));
} else {
await Promise.all([pg.waitForNavigation(), pg.locator("#btn-recarregar").click()]);
check((await pg.title()).endsWith("(nova)"), "Recarregar devia abrir a versão nova: " + await pg.title());
check(await pg.locator("[data-pick='0']").inputValue() === "3", "a auditoria por terminar devia sobreviver à actualização");
const depois = await pg.evaluate(() => caches.keys());
check(JSON.stringify(depois) === JSON.stringify(["auditoria5s-v9.9.9-teste"]),
  `a cache antiga devia ser apagada: ${JSON.stringify(versaoAntes)} → ${JSON.stringify(depois)}`);

}

/* ---- 5. Sem rede, depois de actualizada: a versão nova. ---- */
await ctx.setOffline(true);
await pg.reload();
check((await pg.title()).endsWith("(nova)") && await abriuApp(), "sem rede, devia abrir a versão nova a partir da cache");
await ctx.setOffline(false);

await b.close();
await desligar();
fs.rmSync(PASTA, { recursive: true, force: true });
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke offline e da actualização OK");
process.exit(erros.length || falhas.length ? 1 : 0);
