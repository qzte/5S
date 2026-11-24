/* Smoke test do tempo da auditoria (4.22.0):
   - escolhido o serviço, o tempo começa a contar e pede-se a preparação;
   - num externo, também de onde veio e o trânsito, e (antes de guardar) se
     segue para outra auditoria ou volta à base, com o tempo de regresso;
   - num interno, nada de trânsito;
   - ao guardar, o tempo vai com a auditoria e aparece no relatório;
   - a Análise mostra o cartão «Tempo de auditoria», internas e externas;
   - em Config, as horas de um dia de trabalho. */
import pw from "playwright";
import { ligarDialogos } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
const erros = [], falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
pg.on("pageerror", e => erros.push(String(e)));
pg.on("console", m => { if (m.type() === "error" && !/frame-ancestors/.test(m.text())) erros.push(m.text()); });
await ligarDialogos(pg, () => undefined);
await pg.goto(URL);
await pg.evaluate(() => {
  localStorage.setItem("services", JSON.stringify(["Serviço E (00002)", "Serviço I (00003)"]));
  localStorage.setItem("tipoSvc", JSON.stringify([{ s: "Serviço E (00002)", t: "e" }, { s: "Serviço I (00003)", t: "i" }]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0 }));
});
await pg.reload();
const txt = sel => pg.locator(sel).textContent();
const responderTudo = async () => {
  const n = await pg.evaluate(() => fitems().length);
  for (let i = 0; i < n; i++) await pg.locator(`[data-pick='${i}']`).fill("0");
};

/* 1. Sem serviço, nada se pede. */
check(await pg.locator("#tempo-pre").isHidden(), "sem serviço, não se pede a preparação");
check(await pg.locator("#tempo-pos").isHidden(), "sem serviço, nada antes de guardar");

/* 2. Externo: preparação, origem e trânsito; depois, volta à base e regresso. */
await escolherServico(pg, "Serviço E (00002)");
check(await pg.locator("#tempo-pre").isVisible(), "escolhido o serviço, pede-se a preparação");
check(/conta desde as \d{2}:\d{2}/.test(await txt("#tempo-ini")), "diz desde quando conta o tempo");
check(await pg.evaluate(() => !!JSON.parse(localStorage.getItem("tempoRasc")).inicio), "o início fica guardado");
await pg.locator('#tempo-pre [data-tq="prep"][data-v="30"]').click();
check((await pg.locator('#tempo-pre [data-tq="prep"][data-v="30"]').getAttribute("aria-pressed")) === "true", "a preparação escolhida fica marcada");
await pg.locator('#tempo-pre [data-tq="origem"][data-v="b"]').click();
await pg.locator('#tempo-pre [data-tq-outro="transito"]').fill("25");
await pg.locator('#tempo-pre [data-tq-outro="transito"]').dispatchEvent("change");
check(await pg.locator("#tempo-pos").isVisible(), "num externo, pergunta-se o que vem depois");
check(await pg.locator('#tempo-pos [data-tq="regresso"]').count() === 0, "o regresso só aparece com «Volto à base»");
await pg.locator('#tempo-pos [data-tq="depois"][data-v="b"]').click();
await pg.locator('#tempo-pos [data-tq="regresso"][data-v="20"]').click();
/* O terreno: começou há 85 minutos. */
await pg.evaluate(() => { tempoForm.inicio = new Date(Date.now() - 85 * 6e4).toISOString(); guardarTempoForm(); });
await responderTudo();
await pg.locator("#btn-save").click();
await pg.waitForSelector("#view-report .tempo-rel");
const rel = await txt("#view-report .tempo-rel");
check(/Terreno \d{2}:\d{2} → \d{2}:\d{2} · 1 h 25/.test(rel), "o relatório mostra o terreno: " + rel);
check(/Preparação 30 min/.test(rel) && /Trânsito 25 min \(da base\)/.test(rel) && /Regresso 20 min/.test(rel), "e a preparação, o trânsito e o regresso: " + rel);
const t = await pg.evaluate(() => audits[audits.length - 1].tempo);
check(t && t.prep === 30 && t.origem === "b" && t.transito === 25 && t.depois === "b" && t.regresso === 20 && !!t.fim, "o tempo fica gravado: " + JSON.stringify(t));
check(await pg.evaluate(() => localStorage.getItem("tempoRasc") === null), "o tempo em curso sai ao guardar");

/* 3. Interno: só a preparação. */
await pg.locator('.tab[data-v="audit"]').click();
await escolherServico(pg, "Serviço I (00003)");
check(await pg.locator('#tempo-pre [data-tq="prep"]').count() === 5, "num interno, pede-se a preparação");
check(await pg.locator('#tempo-pre [data-tq="origem"], #tempo-pre [data-tq="transito"]').count() === 0, "num interno, não há trânsito");
check(await pg.locator("#tempo-pos").isHidden(), "num interno, nada antes de guardar");
await pg.locator('#tempo-pre [data-tq="prep"][data-v="0"]').click();
await pg.evaluate(() => { tempoForm.inicio = new Date(Date.now() - 60 * 6e4).toISOString(); guardarTempoForm(); });
await responderTudo();
await pg.locator("#btn-save").click();
await pg.waitForSelector("#view-report .tempo-rel");
check(/Sem preparação/.test(await txt("#view-report .tempo-rel")), "«Não houve» lê-se «Sem preparação»");

/* 4. Análise: o cartão, internas e externas. */
await pg.locator('.tab[data-v="stats"]').click();
await pg.waitForSelector("#card-tempo #tempo-media");
const ordem = await pg.evaluate(() => ["card-manut", "card-tempo", "card-svc-ano"].map(id => document.getElementById(id).getBoundingClientRect().top));
check(ordem[0] < ordem[1] && ordem[1] < ordem[2], "o cartão fica entre a Manutenção e os serviços do ano");
check(/1 h 13/.test(await txt("#tempo-media b")), "a média do terreno (60 e 85 min): " + await txt("#tempo-media b"));
check((await txt("#tempo-int b")).trim() === "1 h", "internas: " + await txt("#tempo-int b"));
check(/1 h 25/.test(await txt("#tempo-ext b")), "externas: " + await txt("#tempo-ext b"));
check(/dias/.test(await txt("#tempo-equipa")), "o total da equipa em dias: " + await txt("#tempo-equipa"));
check(/Trânsito por auditoria45 min/.test((await txt("#tempo-transito")).replace(/\s+/g, "")) || /45 min/.test(await txt("#tempo-transito")), "o trânsito por auditoria, com o regresso: " + await txt("#tempo-transito"));
check(/Internas/.test(await txt("#res-card-tempo")), "o resumo do cartão: " + await txt("#res-card-tempo"));

/* 5. Config: horas por dia. */
await pg.locator('.tab[data-v="cfg"]').click();
await pg.locator("#grp-servicos").evaluate(d => { d.open = true; });
check((await pg.locator("#horas-dia").inputValue()) === "8", "8 horas por dia, por omissão");
await pg.locator("#horas-dia").fill("7");
await pg.locator("#horas-dia").dispatchEvent("change");
check(await pg.evaluate(() => horasDia() === 7), "as horas por dia ficam guardadas");

await b.close();
if (erros.length) falhas.push("erros na página: " + erros.join(" | "));
if (falhas.length) { console.error("FALHOU:\n- " + falhas.join("\n- ")); process.exit(1); }
console.log("smoke-tempo: ok");
