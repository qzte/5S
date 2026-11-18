/* Smoke test (4.8.1): «Partilhar cópia com fotos» quando o menu de partilha
   recusa a cópia — como o Chrome com ficheiros acima de 50 MiB, que rejeita
   com NotAllowedError mesmo depois do segundo toque. Antes, a app só dizia
   «Não foi possível partilhar a cópia» e a cópia ficava por fazer. Agora:
   - recusada pelo menu, a cópia é descarregada, e a mensagem diz porquê;
   - acima do limite, nem se tenta partilhar: descarrega-se logo, com o tamanho. */
import pw from "playwright";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;
const MB = 1024 * 1024;

async function pagina() {
  const ctx = await b.newContext({ acceptDownloads: true });
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; });
  await ctx.addInitScript(() => {
    window.__partilhas = 0;
    navigator.canShare = d => !!(d && d.files && d.files.every(f => /\.txt$/.test(f.name)));
    /* Como o Chrome acima de 50 MiB: recusa sempre, com NotAllowedError. */
    navigator.share = async () => { window.__partilhas++; throw new DOMException("Permission denied", "NotAllowedError"); };
  });
  const pg = await ctx.newPage();
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
  const vistos = [];
  await ligarDialogos(pg, d => { vistos.push(d); return undefined; });
  await pg.goto(URL);
  await pg.evaluate(async () => {
    const it = ITEMS.map(x => Object.assign({}, x));
    localStorage.setItem("audits", JSON.stringify([{ id: 5, service: "Loja A", date: "2026-11-10", verif: "F",
      scores: it.map((_, i) => i ? 2 : 0), raw: it.map(() => null), tgts: it.map(() => null), items: it }]));
    localStorage.setItem("backup", JSON.stringify({ at: "2026-11-01T10:00:00.000Z", pend: 1, pendFotos: 2 }));
    await fotosIDB("readwrite", st => st.put("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "5#0"));
  });
  await pg.reload();
  await pg.locator("[data-v=cfg]").click();
  return { ctx, pg, vistos };
}

/* ---- 1. O menu de partilha recusa a cópia: descarrega-se na mesma. ---- */
{
  const { ctx, pg, vistos } = await pagina();
  const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 15000 }).catch(() => null), pg.locator("#btn-partilhar").click()]);
  await semDialogo(pg).catch(() => {});
  check(await pg.evaluate(() => window.__partilhas) >= 1, "devia ter tentado partilhar");
  check(dl && /^auditorias5s_\d{4}-\d{2}-\d{2}_com_fotos\.json$/.test(dl.suggestedFilename()),
    "recusada a partilha, a cópia devia ser descarregada: " + (dl && dl.suggestedFilename()));
  if (dl) {
    const j = JSON.parse(await (await import("fs")).promises.readFile(await dl.path(), "utf8"));
    check(Array.isArray(j.fotos) && j.fotos.length === 1, "a cópia descarregada leva as fotos");
  }
  const msg = vistos.map(d => d.texto).join(" | ");
  check(/descarregad/.test(msg) && /NotAllowedError/.test(msg), "a mensagem devia dizer que foi descarregada e porquê: " + msg);
  check(await pg.evaluate(() => JSON.parse(localStorage.getItem("backup")).pendFotos) === 0, "descarregada, conta como cópia com fotos");
  await ctx.close();
}

/* ---- 2. Cópia acima do limite: nem tenta partilhar. ---- */
{
  const { ctx, pg, vistos } = await pagina();
  await pg.evaluate(MB => {
    const orig = window.ficheiroCopia;
    window.ficheiroCopia = async (...a) => { const c = await orig(...a); if (c) Object.defineProperty(c.blob, "size", { value: 60 * MB }); return c; };
  }, MB);
  const [dl] = await Promise.all([pg.waitForEvent("download", { timeout: 15000 }).catch(() => null), pg.locator("#btn-partilhar").click()]);
  await semDialogo(pg).catch(() => {});
  check(await pg.evaluate(() => window.__partilhas) === 0, "acima do limite não devia tentar partilhar");
  check(!!dl, "acima do limite, a cópia devia ser descarregada");
  const msg = vistos.map(d => d.texto).join(" | ");
  check(/60 MB/.test(msg) && /descarregad/.test(msg), "a mensagem devia dizer o tamanho e que foi descarregada: " + msg);
  await ctx.close();
}

/* ---- 3. Como o Chrome no Android: canShare diz que sim a tudo, mas share()
   recusa o .json (não está na lista de tipos que o Chrome partilha) e aceita o
   .txt. A cópia tem de ir como .txt à primeira, sem descarregar. ---- */
{
  const ctx = await b.newContext({ acceptDownloads: true });
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; });
  await ctx.addInitScript(() => {
    window.__partilhas = [];
    navigator.canShare = d => !!(d && d.files);
    navigator.share = async d => {
      const f = d.files[0];
      if (!/\.(txt|pdf)$/.test(f.name)) throw new DOMException("Permission denied", "NotAllowedError");
      window.__partilhas.push({ nome: f.name, tipo: f.type, fotos: (JSON.parse(await f.text()).fotos || []).length });
    };
  });
  const pg = await ctx.newPage();
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
  const vistos = [];
  await ligarDialogos(pg, d => { vistos.push(d); return undefined; });
  await pg.goto(URL);
  await pg.evaluate(async () => {
    const it = ITEMS.map(x => Object.assign({}, x));
    localStorage.setItem("audits", JSON.stringify([{ id: 5, service: "Loja A", date: "2026-11-10", verif: "F",
      scores: it.map((_, i) => i ? 2 : 0), raw: it.map(() => null), tgts: it.map(() => null), items: it }]));
    await fotosIDB("readwrite", st => st.put("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "5#0"));
  });
  await pg.reload();
  await pg.locator("[data-v=cfg]").click();
  let descarregou = false;
  pg.on("download", () => { descarregou = true; });
  await pg.locator("#btn-partilhar").click();
  await pg.waitForFunction(() => window.__partilhas.length === 1, null, { timeout: 10000 }).catch(() => {});
  await semDialogo(pg).catch(() => {});
  const p = await pg.evaluate(() => window.__partilhas[0]);
  check(p && /_com_fotos\.txt$/.test(p.nome) && p.tipo === "text/plain" && p.fotos === 1,
    "no Chrome do Android, a cópia devia ir como .txt à primeira: " + JSON.stringify(p) + " | " + vistos.map(d => d.texto).join(" | "));
  check(!descarregou, "partilhada, não devia descarregar");
  await ctx.close();
}

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da partilha da cópia com fotos OK");
process.exit(erros.length || falhas.length ? 1 : 0);
