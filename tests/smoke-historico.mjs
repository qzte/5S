/* Smoke test de browser da 3.9.0: filtros e variação no Histórico, Análise por
   serviço e período, auditoria anterior no formulário e no relatório, fotos
   guardadas em IndexedDB, exportação para Excel, e a caixa de diálogo própria
   (código de acesso e modo de importação). */
import pw from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const PIN = "3758";
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const pg = await ctx.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
const BENIGNO = /frame-ancestors/;
pg.on("console", m => {
  if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text());
});
pg.on("dialog", d => d.accept(""));
let resposta = () => ({ campo: PIN, botao: "Confirmar" });
let vistos = [];
await ligarDialogos(pg, d => { vistos.push(d); return resposta(d); });
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const visivel = async sel => !(await pg.locator(sel).isHidden());
const nAudits = () => pg.evaluate(() => JSON.parse(localStorage.getItem("audits") || "[]").length);
/* A escrita no IndexedDB é assíncrona: espera-se até 3 s pelo número pedido. */
const fotosSao = async n => { for (let i = 0; i < 30; i++) { if (await nFotos() === n) return true; await pg.waitForTimeout(100); } return false; };
const nFotos = () => pg.evaluate(() => new Promise(res => {
  const rq = indexedDB.open("auditoria5s-fotos", 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore("fotos");
  rq.onsuccess = () => {
    const c = rq.result.transaction("fotos").objectStore("fotos").count();
    c.onsuccess = () => { rq.result.close(); res(c.result); };
  };
}));

/* Três auditorias com as perguntas de origem: Loja A a 100 e depois a 0, e
   Loja B a meio. Escritas directamente, como as deixaria uma importação. */
await pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mk = (id, service, date, s) => ({ id, service, date, verif: "V",
    scores: it.map(() => s), raw: it.map(() => null), tgts: it.map(() => null), items: it });
  localStorage.setItem("audits", JSON.stringify([
    mk(1, "Loja A", "2026-01-10", 2), mk(2, "Loja A", "2026-03-05", 0), mk(3, "Loja B", "2026-02-01", 1)]));
  localStorage.setItem("services", JSON.stringify(["Loja A", "Loja B"]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
});
await pg.reload();

/* ---- 1. Histórico: variação face à anterior e filtros. ---- */
await pg.locator("[data-v=history]").click();
check(await pg.locator("#hist-list .card").count() === 3, "o histórico devia listar as três");
const primeiro = await pg.locator("#hist-list .card").first().textContent();
check(/Loja A/.test(primeiro) && /▼ -100/.test(primeiro) && /anterior: 2026-01-10/.test(primeiro),
  "a mais recente devia mostrar a queda de 100 face à anterior: " + primeiro);
await pg.locator("#hf-svc").selectOption("Loja B");
check(await pg.locator("#hist-list .card").count() === 1, "filtrar pela Loja B devia deixar uma");
check(/1 de 3/.test(await pg.locator("#hf-conta").textContent()), "a contagem devia dizer 1 de 3");
await pg.locator("#hf-svc").selectOption("");
await pg.locator("#hf-nota").selectOption("bad");
check(await pg.locator("#hist-list .card").count() === 2, "a faixa Crítico devia deixar duas");
await pg.locator("#hf-de").fill("2026-03-01");
check(await pg.locator("#hist-list .card").count() === 1, "com data inicial devia sobrar uma");
await pg.locator("#btn-hf-limpar").click();
check(await pg.locator("#hist-list .card").count() === 3, "limpar os filtros devia repor as três");

/* ---- 2. Análise: uma linha por serviço, filtro por serviço e período. ---- */
await pg.locator("[data-v=stats]").click();
check(await pg.locator("#ch-leg span").count() === 2, "a legenda devia ter uma linha por serviço");
check(/Loja A .*Loja B/.test(await pg.locator("#ch-evo").getAttribute("aria-label")),
  "o gráfico devia ter uma descrição acessível com os dois serviços");
await pg.locator("#an-svc").selectOption("Loja A");
check(/2 de 3/.test(await pg.locator("#an-conta").textContent()), "só a Loja A devia contar 2 de 3");
check(await pg.locator("#cmp-svc .stat-row").count() === 1, "a comparação devia ficar só com a Loja A");
await pg.locator("#an-svc").selectOption("");
await pg.locator("#an-per").selectOption("3");
check(/0 de 3/.test(await pg.locator("#an-conta").textContent()),
  "nenhuma das auditorias de 2026 cabe nos últimos 3 meses de " + new Date().toISOString().slice(0, 10));
await pg.locator("#an-per").selectOption("0");

/* ---- 3. Formulário: o que a auditoria anterior deu a cada pergunta. ---- */
await pg.locator("[data-v=audit]").click();
await pg.locator("#f-svc-busca").fill("Loja B");
await pg.locator("#f-svc-busca").press("Enter");   /* 4.2.1: escolhe-se na caixa do serviço */
check(await pg.locator("[data-prev]:not(.hidden)").count() === 19, "na Loja B, todas estavam em Oportunidade");
check(/Na auditoria anterior \(2026-02-01\): Oportunidade/.test(await pg.locator("[data-prev='0']").textContent()),
  "a indicação devia dizer a data e a classificação anteriores");
await pg.locator("#f-svc-busca").fill("Loja A");
await pg.locator("#f-svc-busca").press("Enter");
check(/\(2026-03-05\): Mau/.test(await pg.locator("[data-prev='0']").textContent()),
  "mudar de serviço devia mudar a referência para a última da Loja A");

/* ---- 4. Relatório: seguimento face à anterior. ---- */
await pg.locator("[data-v=history]").click();
await pg.locator("[data-rep='0']").click();
const seg = await pg.locator("#seguimento").textContent();
check(/Face a 2026-01-10 \(100\/100\)/.test(seg) && /19 piorou/.test(seg.replace(/\s+/g, " ")),
  "o seguimento devia comparar com 2026-01-10 e contar 19 que pioraram: " + seg.slice(0, 200));
check(await pg.locator("#seguimento tr").count() === 20, "uma linha por pergunta, mais o cabeçalho");

/* ---- 5. Fotos: sobrevivem a sair do relatório e a recarregar. ---- */
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
await pg.locator("[data-file='U']").setInputFiles({ name: "f.png", mimeType: "image/png", buffer: png });
await pg.waitForSelector("[data-foto='U'] img");
check(await fotosSao(1), "a foto devia ficar gravada no IndexedDB");
await pg.locator("#btn-back").click();
await pg.locator("[data-rep='1']").click();
check(await pg.locator("[data-foto='U'] img").count() === 0, "a foto de uma auditoria não pode aparecer noutra");
await pg.locator("#btn-back").click();
await pg.reload();
await pg.locator("[data-v=history]").click();
await pg.locator("[data-rep='0']").click();
await pg.waitForSelector("[data-foto='U'] img", { timeout: 5000 }).catch(() => {});
check(await pg.locator("[data-foto='U'] img").count() === 1, "depois de recarregar, a foto devia voltar ao relatório");

/* ---- 6. Exportar para Excel. ---- */
await pg.locator("[data-v=cfg]").click();
const [dl] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expxl").click()]);
check(/^auditorias5s_\d{4}-\d{2}-\d{2}\.xlsx$/.test(dl.suggestedFilename()), "o ficheiro devia ser .xlsx");
const xl = fs.readFileSync(await dl.path());
check(xl.length > 1000 && xl.subarray(0, 2).toString() === "PK", "um .xlsx é um zip (começa por PK)");

/* ---- 7. Código de acesso na caixa própria (editar continua a pedi-lo). ---- */
vistos = [];
resposta = () => ({ campo: "0000", botao: "Confirmar" });
await pg.locator("[data-v=history]").click();
await pg.locator("[data-edit='0']").click();
await semDialogo(pg);
check(vistos.length === 1 && vistos[0].temCampo, "editar devia pedir o código na caixa própria");
check(await pg.locator("#edit-banner").isHidden(), "um código errado não pode abrir a edição");
check(await pg.locator("#dlg-campo").getAttribute("type") === "password" &&
  await pg.locator("#dlg-campo").getAttribute("inputmode") === "numeric",
  "o campo do código devia ser de palavra-passe e com teclado numérico");
resposta = () => ({ campo: PIN, botao: "Confirmar" });

/* Apagar (3.13.0): logo, com Desfazer; as fotos só saem no fim do prazo. */
await pg.locator("[data-v=history]").click();
await pg.locator("[data-del='0']").click();
check(await nAudits() === 2, "apagar devia apagar logo, sem código");
check(await nFotos() === 1, "durante o prazo de desfazer, as fotos ficam");
await pg.locator("#toast-btn").click();
check(await nAudits() === 3, "desfazer devia repor a auditoria");
await pg.locator("[data-rep='0']").click();
await pg.waitForSelector("[data-foto='U'] img", { timeout: 5000 }).catch(() => {});
check(await pg.locator("[data-foto='U'] img").count() === 1, "desfazer devia repor também a foto");
await pg.locator("#btn-back").click();
await pg.locator("[data-del='0']").click();
await pg.evaluate(() => concluirApagar());
check(await nAudits() === 2, "sem desfazer, fica apagada");
check(await fotosSao(0), "terminado o prazo, as fotos da auditoria apagada saem também");

/* ---- 8. Importar: a caixa oferece Fundir e Substituir. ---- */
const ficheiro = path.join(os.tmpdir(), "5s-import-dlg.json");
fs.writeFileSync(ficheiro, JSON.stringify({ app: "auditoria5s", version: "3.9.0",
  audits: [{ id: 5, service: "Loja C", date: "2026-04-01", scores: [2], raw: [0], tgts: [null],
    items: [{ p: 0, n: 1, t: "A", r: "U", c: "Só uma", tp: "count", t1: 4, t2: 1, t3: 0, max: 99 }] }] }));
vistos = [];
resposta = () => "Cancelar";
await pg.locator("[data-v=cfg]").click();
await pg.locator("#hist-file").setInputFiles(ficheiro);
await pg.waitForFunction(() => document.getElementById("dlg").open).catch(() => {});
await semDialogo(pg);
check(vistos.length === 1 && /Importar histórico/.test(vistos[0].titulo), "importar devia abrir a caixa de escolha");
check(await nAudits() === 2, "cancelar não importa nada");
resposta = d => d.temCampo ? { campo: PIN, botao: "Confirmar" } : "Substituir tudo";
await pg.locator("#hist-file").setInputFiles(ficheiro);
await pg.waitForFunction(() => JSON.parse(localStorage.getItem("audits") || "[]").length === 1, null, { timeout: 5000 }).catch(() => {});
check(await nAudits() === 1, "substituir, com o código, devia deixar só a do ficheiro");
fs.unlinkSync(ficheiro);

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do histórico OK");
process.exit(erros.length || falhas.length ? 1 : 0);
