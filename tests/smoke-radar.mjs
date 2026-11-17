/* Smoke test (4.6.3): nos radares do relatório, nenhum texto se sobrepõe a
   outro. A legenda «100%» da escala ficava 4px acima da percentagem do eixo do
   topo, no mesmo sítio: «Utilizadores 100%» parecia ter o valor duplicado. */
import pw from "playwright";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;

const pg = await b.newPage({ viewport: { width: 400, height: 800 } });
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
await pg.goto(URL);
await pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  localStorage.setItem("audits", JSON.stringify([{ id: 2, service: "Loja A", date: "2026-10-20", verif: "F",
    scores: it.map(() => 2), raw: it.map(() => null), tgts: it.map(() => null), items: it }]));
  localStorage.setItem("services", JSON.stringify(["Loja A"]));
});
await pg.reload();
await pg.locator("[data-v=history]").click();
await pg.locator("[data-rep='0']").click();

const r = await pg.evaluate(() => [...document.querySelectorAll("#view-report svg[aria-label^='Gráfico radar']")].map(svg => {
  const t = [...svg.querySelectorAll("text")].map(e => ({ s: e.textContent, b: e.getBBox() }));
  const sob = [];
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
    const a = t[i].b, c = t[j].b;
    if (a.x < c.x + c.width && c.x < a.x + a.width && a.y < c.y + c.height && c.y < a.y + a.height) sob.push(t[i].s + " / " + t[j].s);
  }
  return sob;
}));
check(r.length >= 2, "o relatório devia ter os dois radares (tem " + r.length + ")");
r.forEach((sob, k) => check(!sob.length, "radar " + (k + 1) + ": textos sobrepostos: " + sob.join("; ")));

await b.close();
if (erros.length) console.log("ERROS:\n" + erros.join("\n"));
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke dos radares OK");
process.exit(erros.length || falhas.length ? 1 : 0);
