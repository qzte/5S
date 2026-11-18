/* Smoke test (4.6.1; desde 4.8.0 com o PDF da auditoria): o PDF leva as fotos
   mesmo quando é pedido logo ao abrir o relatório. As fotos das evidências chegam do IndexedDB depois do
   relatório; o PDF tem de esperar por elas (4.7.0: as das recomendações
   saíram com elas). Antes, saía
   sem fotos (e sem a folha das evidências, quando só tinham foto) ou falhava
   com «Unable to find element in cloned iframe», porque a folha era
   substituída a meio. A leitura do disco é atrasada de propósito, para a
   corrida acontecer sempre — num telemóvel, logo depois de gravar, é assim. */
import pw from "playwright";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;

const ctx = await b.newContext({ viewport: { width: 400, height: 800 } });
const pg = await ctx.newPage();
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
await pg.goto(URL);
await pg.evaluate(async () => {
  const foto = cor => { const c = document.createElement("canvas"); c.width = 320; c.height = 240;
    const g = c.getContext("2d"); g.fillStyle = cor; g.fillRect(0, 0, 320, 240); return c.toDataURL("image/jpeg", .75); };
  const it = ITEMS.map(x => Object.assign({}, x));
  /* A pergunta 1 fica Mau, com foto de evidência e SEM nota. */
  localStorage.setItem("audits", JSON.stringify([{ id: 2, service: "Loja A", date: "2026-10-20", verif: "F",
    scores: it.map((_, i) => i === 0 ? 0 : 2), raw: it.map(() => null), tgts: it.map(() => null), items: it, recs: { U: "Arrumar." } }]));
  localStorage.setItem("services", JSON.stringify(["Loja A"]));
  await fotosIDB("readwrite", st => st.put(foto("#00c"), "2#0"));
});
await pg.reload();
await pg.evaluate(() => carregarPdf());
await pg.locator("[data-v=history]").click();

const r = await pg.evaluate(async () => {
  /* Leituras do disco lentas, como num telemóvel com muitas fotos. */
  const lento = fotosIDB;
  window.fotosIDB = (modo, fn) => modo === "readonly"
    ? new Promise(res => setTimeout(res, 400)).then(() => lento(modo, fn)) : lento(modo, fn);
  /* Conta as fotos que o html2canvas tem à frente em cada folha. */
  const orig = window.html2canvas;
  let fotos = 0;
  window.html2canvas = (el, o) => {
    fotos += el.querySelectorAll('img[src^="data:image/jpeg"]').length;
    return orig(el, o);
  };
  document.querySelector("[data-rep='0']").click();
  let erro = "";
  try { await pdfDaAuditoria(audits[0]); } catch (e) { erro = String(e && e.message || e); }
  window.html2canvas = orig; window.fotosIDB = lento;
  return { fotos, erro };
});
check(!r.erro, "o PDF pedido logo ao abrir não devia falhar: " + r.erro);
check(r.fotos === 1, "o PDF devia levar a foto da evidência (levou " + r.fotos + ")");

await b.close();
if (erros.length) console.log("ERROS:\n" + erros.join("\n"));
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do PDF com fotos OK");
process.exit(erros.length || falhas.length ? 1 : 0);
