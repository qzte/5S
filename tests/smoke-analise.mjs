/* Smoke test de browser da Análise (4.11.0):
   - duas zonas: os indicadores do ano e o relatório mensal em cima; os filtros
     (presos ao topo ao deslizar) e o que lhes obedece em baixo;
   - o resumo em números (nota média, variação, auditorias, acções em aberto);
   - internos e externos (média e percentagem de serviços auditados, com a
     variação face ao período anterior);
   - a variação por pilar e por responsável, com a maior descida marcada.
   Tira capturas (PC e telemóvel) para a pasta em CAPTURAS, se indicada. */
import pw from "playwright";
import { ligarDialogos } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const CAPTURAS = process.env.CAPTURAS || "";
const b = await chromium.launch();
const erros = [], falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };

for (const [nome, viewport] of [["pc", { width: 900, height: 1000 }], ["telemovel", { width: 390, height: 844 }]]) {
  const pg = await b.newPage({ viewport });
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
  await ligarDialogos(pg, () => undefined);
  await pg.goto(URL);
  const hoje = await pg.evaluate(() => hojeISO());

  /* Dois internos e dois externos. No período actual (últimos 3 meses) o
     interno A melhora (1 → 2) e o externo C piora (2 → 0); o externo D só foi
     auditado no período anterior. Uma acção em atraso e uma feita há 10 dias. */
  await pg.evaluate((hoje) => {
    const it = ITEMS.map(x => Object.assign({}, x));
    const dia = n => { const d = new Date(hoje + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
    const mk = (id, service, date, s, acoes) => ({ id, service, date, scores: it.map(() => s), raw: it.map(() => null),
      tgts: it.map(() => null), items: it, finalizada: date, acoes: acoes || [] });
    localStorage.setItem("audits", JSON.stringify([
      mk(1, "Int A (1)", dia(10), 2, [{ id: "x1", texto: "Arrumar", prazo: dia(2), estado: "aberta", feitaEm: "", item: null },
        { id: "x2", texto: "Limpar", prazo: dia(1), estado: "feita", feitaEm: dia(10), item: null }]),
      mk(2, "Int B (2)", dia(20), 2),
      mk(3, "Ext C (3)", dia(5), 0),
      mk(4, "Int A (1)", dia(120), 1),
      mk(5, "Ext C (3)", dia(130), 2),
      mk(6, "Ext D (4)", dia(140), 2),
    ]));
    localStorage.setItem("services", JSON.stringify(["Int A (1)", "Int B (2)", "Ext C (3)", "Ext D (4)"]));
    localStorage.setItem("tipoSvc", JSON.stringify([{ s: "Int A (1)", t: "i" }, { s: "Int B (2)", t: "i" },
      { s: "Ext C (3)", t: "e" }, { s: "Ext D (4)", t: "e" }]));
    localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
  }, hoje);
  await pg.reload();
  await pg.locator("[data-v=stats]").click();

  /* 1. A ordem: indicadores e relatório mensal antes dos filtros. */
  const ordem = await pg.evaluate(() => ["card-kpis", "card-mensal", "an-filtros", "an-resumo", "card-ie"]
    .map(id => document.getElementById(id).getBoundingClientRect().top));
  check(ordem.every((y, i) => !i || y > ordem[i - 1]), nome + ": a ordem das zonas está errada: " + ordem.join(", "));
  check((await pg.locator("#an-filtros").evaluate(e => getComputedStyle(e).position)) === "sticky", nome + ": os filtros deviam ficar presos ao topo");

  /* 2. Todo o histórico: sem variação. */
  await pg.locator("#an-per").selectOption("0");
  check(/—/.test(await pg.locator("#rs-variacao b").textContent()), nome + ": sem período, a variação devia ser «—»");
  check(await pg.locator("#cmp-pilar .vr th").count() === 2, nome + ": sem período, a tabela dos pilares só tem a média");

  /* 3. Últimos 3 meses: variações. */
  await pg.locator("#an-per").selectOption("3");
  check((await pg.locator("#rs-auditorias b").textContent()) === "3", nome + ": 3 auditorias no período");
  check((await pg.locator("#rs-acoes b").textContent()) === "1", nome + ": 1 acção em aberto");
  check(/1 em atraso/.test(await pg.locator("#rs-acoes").textContent()), nome + ": a acção está em atraso");
  check(/1 feita/.test(await pg.locator("#rs-acoes").textContent()), nome + ": 1 feita no período");
  check(/[▲▼＝]/.test(await pg.locator("#rs-variacao b").textContent()), nome + ": devia haver variação face ao período anterior");
  const ie = await pg.locator("#an-ie").textContent();
  check(/Internos/.test(ie) && /Externos/.test(ie), nome + ": o cartão devia ter internos e externos");
  check(/2 de 2/.test(ie) && /1 de 2/.test(ie), nome + ": auditados: internos 2 de 2, externos 1 de 2 — " + ie);
  check(/100%/.test(ie) && /50%/.test(ie), nome + ": percentagens 100% e 50%");
  check(/▲ \+50 pp/.test(ie), nome + ": internos passaram de 50% para 100% dos serviços");
  check(/acima/.test(ie), nome + ": os internos estão acima dos externos");
  check(/Ext D \(4\)/.test(ie), nome + ": o externo por auditar devia estar na lista");
  check(await pg.locator("#cmp-pilar .vr th").count() === 4, nome + ": a tabela dos pilares tem agora, antes e variação");
  check(await pg.locator("#cmp-resp .vr tbody tr").count() >= 1, nome + ": a tabela dos responsáveis devia ter linhas");
  check(await pg.locator("#cmp-pilar .vr u").count() >= 1, nome + ": o traço do período anterior devia aparecer");

  /* 4.16.0: indicadores do ano compactos, evolução mensal, comparação e perguntas. */
  check(await pg.locator("#card-svc-ano details.kpi-det").count() >= 2, nome + ": as secções do ano abrem e fecham");
  check(!(await pg.locator("#kpi-tipos").evaluate(d => d.open)), nome + ": as secções começam fechadas");
  check(/internos 2 de 2 · externos/.test(await pg.locator("#kpi-tipos summary").textContent()), nome + ": o resumo no título da secção");
  check(await pg.locator("#ch-evo svg").count() === 1 && await pg.locator("#ch-evo svg rect").count() === 1, nome + ": a evolução com o período sombreado");
  await pg.locator("[data-evo=tipos]").click();
  check(/Internos/.test(await pg.locator("#ch-leg").textContent()) && /Externos/.test(await pg.locator("#ch-leg").textContent()), nome + ": internos e externos na evolução");
  await pg.locator("[data-evo=geral]").click();
  /* 4.18.0: sem a comparação entre serviços; todos os do ano em «Serviços em <ano>». */
  check(await pg.locator("#cmp-svc").count() === 0, nome + ": o cartão da comparação saiu");
  const todos = await pg.evaluate(() => [...document.querySelectorAll("#kpi-todos .stat-row span:last-child")].map(e => +e.textContent));
  check(todos.length === 4 && todos.every((v, i) => !i || v >= todos[i - 1]), nome + ": todos os serviços do ano, do pior para o melhor: " + todos);
  check(/Serviços em \d{4}/.test(await pg.locator("#svc-ano-tit").textContent()), nome + ": o cartão dos serviços diz o ano");
  /* Minimizar: cada cartão mostra o resumo; «Minimizar tudo» fecha todos e lembra-se. */
  check(await pg.locator("#card-mensal").evaluate(d => !d.open) && await pg.locator("#card-evo").evaluate(d => d.open), nome + ": por omissão, só o relatório mensal minimizado");
  await pg.locator("#an-min-tudo").click();
  check(await pg.evaluate(() => [...document.querySelectorAll("#view-stats details.cm")].every(d => !d.open)), nome + ": «Minimizar tudo» fecha todos");
  check((await pg.locator("#an-min-tudo").textContent()) === "Abrir tudo", nome + ": o botão passa a «Abrir tudo»");
  for (const id of ["card-kpis", "card-svc-ano", "card-ie", "card-evo", "card-pf", "card-pilar", "card-resp"])
    check((await pg.locator("#res-" + id).textContent()).trim().length > 0, nome + ": o resumo de " + id + " minimizado");
  await pg.reload(); await pg.locator("[data-v=stats]").click();
  check(await pg.evaluate(() => [...document.querySelectorAll("#view-stats details.cm")].every(d => !d.open)), nome + ": os minimizados ficam depois de recarregar");
  await pg.locator("#an-min-tudo").click();
  await pg.locator("#an-per").selectOption("3");
  check(await pg.locator("#an-pf .pf").count() >= 1 && await pg.locator("#an-pf .chip.m").count() >= 1, nome + ": perguntas que mais falham, com onde falham");
  check(/Ext C \(3\)/.test(await pg.locator("#an-pf").textContent()), nome + ": o serviço onde mais falham é o Ext C");

  /* 4. Um serviço escolhido: só o tipo dele. */
  await pg.locator("#an-svc").selectOption("Ext C (3)");
  const ie2 = await pg.locator("#an-ie").textContent();
  check(!/Internos/.test(ie2) && /Externos/.test(ie2), nome + ": com um serviço externo, só os externos");
  check(/▼/.test(await pg.locator("#rs-variacao b").textContent()), nome + ": o serviço C piorou");
  check(await pg.locator("#cmp-pilar tr.pior").count() >= 1, nome + ": a maior descida devia estar marcada");
  await pg.locator("#an-svc").selectOption("");

  if (CAPTURAS) {
    await pg.screenshot({ path: `${CAPTURAS}/analise-${nome}.png`, fullPage: true });
    await pg.evaluate(() => window.scrollTo(0, document.getElementById("card-ie").offsetTop + 200));
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: `${CAPTURAS}/analise-${nome}-deslizada.png` });
    check(await pg.locator("#an-filtros").evaluate(e => e.classList.contains("colada")), nome + ": a barra presa devia ter sombra");
  }
  await pg.close();
}
await b.close();

if (erros.length) { console.log("ERROS DE JS:\n" + erros.join("\n")); process.exitCode = 1; }
else console.log("sem erros de JS");
if (falhas.length) { console.log("FALHAS:\n" + falhas.join("\n")); process.exitCode = 1; }
else console.log("smoke da análise OK");
