/* Smoke test de browser do fluxo depois da auditoria (3.23.0): no relatório,
   o cartão «Depois da auditoria» com a cópia de segurança, o PDF (criado pela
   app, com html2canvas e jsPDF) e o envio por email e para o Teams, pelo menu
   de partilha (simulado) e, sem ele, descarregando o PDF e abrindo o email ou
   copiando o resumo. O Histórico mostra se a auditoria já foi enviada. */
import pw from "playwright";
import fs from "fs";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;
const paginasPdf = buf => (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

async function abrir(ctx) {
  const pg = await ctx.newPage();
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
  pg.on("dialog", d => d.accept(""));
  const vistos = [];
  await ligarDialogos(pg, d => { vistos.push(d); return undefined; });
  await pg.goto(URL);
  await pg.evaluate(() => {
    const it = ITEMS.map(x => Object.assign({}, x));
    const mk = (id, date, f, extra) => Object.assign({ id, service: "Loja A", date, verif: "Fulano",
      scores: it.map((_, i) => f(i)), raw: it.map(() => null), tgts: it.map(() => null), items: it }, extra || {});
    localStorage.setItem("audits", JSON.stringify([mk(1, "2026-10-01", () => 2),
      mk(2, "2026-10-20", i => i % 3, { recs: { U: "Arrumar o corredor 3." },
        acoes: [{ id: 1, r: "U", texto: "Retirar caixas", prazo: "2026-10-25", estado: "aberta", feitaEm: "", item: 1 }] })]));
    localStorage.setItem("services", JSON.stringify(["Loja A"]));
  });
  await pg.reload();
  await pg.locator("[data-v=history]").click();
  check(/por enviar/.test(await pg.locator("#hist-list .card").first().textContent()), "o Histórico devia dizer «por enviar»");
  await pg.locator("[data-rep='0']").click();
  return { pg, vistos };
}
const passos = pg => pg.locator("#pos-aud .passos li").allTextContents().then(l => l.map(t => t.replace(/\s+/g, " ")));
const auditoria = (pg, id) => pg.evaluate(id => audits.find(a => a.id === id), id);

/* ---------- 1. Com menu de partilha (como num telemóvel) ---------- */
{
  const ctx = await b.newContext({ acceptDownloads: true });
  /* O Chromium tem a janela «Guardar como» (showSaveFilePicker), que o
     teste não consegue usar: retira-se, para testar a transferência normal. */
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; });
  await ctx.addInitScript(() => {
    window.__partilhas = [];
    window.__resposta = "ok";
    /* Como o Chrome: partilha .pdf e .txt, não .json. */
    navigator.canShare = d => !!(d && d.files && d.files.every(f => /\.(pdf|txt)$/.test(f.name)));
    navigator.share = async d => {
      if (window.__resposta === "cancelar") throw new DOMException("fechado", "AbortError");
      const f = d.files[0];
      window.__partilhas.push({ nome: f.name, tipo: f.type, tam: f.size, titulo: d.title, texto: d.text,
        inicio: new TextDecoder().decode(new Uint8Array(await f.slice(0, 5).arrayBuffer())) });
    };
  });
  const { pg } = await abrir(ctx);
  let p = await passos(pg);
  /* 3.25.0: pela ordem do fluxo — PDF, envio, e a cópia no fim. */
  check(p.length === 3 && /PDF do relatório/.test(p[0]) && /Enviar/.test(p[1]) && /Cópia de segurança/.test(p[2]),
    "o cartão devia ter os três passos: " + p.join(" | "));
  check(!/✓/.test(p.join("")), "nada feito ainda");

  /* Passo 1 (3.24.0): a cópia com fotos vai pelo menu de partilha (no
     Chrome, como .txt), e sai logo do telemóvel. */
  await pg.locator("#pa-copia").click();
  await pg.waitForFunction(() => window.__partilhas.length === 1, null, { timeout: 30000 });
  const cp = (await pg.evaluate(() => window.__partilhas.shift()));
  check(/^auditorias5s_\d{4}-\d{2}-\d{2}_com_fotos\.txt$/.test(cp.nome) && cp.tipo === "text/plain" && cp.inicio === '{"app',
    "a cópia do passo 1 vai pelo menu de partilha: " + JSON.stringify(cp).slice(0, 160));
  check(/Importar cópia de segurança/.test(cp.texto), "o texto diz como a recuperar: " + cp.texto);
  await pg.waitForFunction(() => /✓/.test(document.querySelectorAll("#pos-aud .passos li")[2].textContent));
  check(/✓ Feita/.test((await passos(pg))[2]), "o passo da cópia devia ficar feito");

  /* Passo 2: PDF. */
  const [dp] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.locator("#pa-pdf").click()]);
  check(dp.suggestedFilename() === "Auditoria 5S - Loja A - 2026-10-20.pdf", "o nome do PDF: " + dp.suggestedFilename());
  const pdf = fs.readFileSync(await dp.path());
  check(pdf.subarray(0, 5).toString() === "%PDF-" && paginasPdf(pdf) >= 3 && pdf.length > 50000,
    `o PDF devia ser um PDF com as folhas do relatório (${paginasPdf(pdf)} páginas, ${pdf.length} bytes)`);
  await pg.waitForFunction(() => /Descarregado/.test(document.querySelector("#pos-aud").textContent));
  check(!!(await auditoria(pg, 2)).envios.pdf, "o PDF fica registado na auditoria");
  check(/✓ Feita/.test((await passos(pg))[2]), "registar o PDF não volta a pedir a cópia de segurança");

  /* Passo 3: email e Teams, pelo menu de partilha. */
  await pg.locator("#pa-email").click();
  await pg.waitForFunction(() => window.__partilhas.length === 1, null, { timeout: 30000 });
  await pg.locator("#pa-teams").click();
  await pg.waitForFunction(() => window.__partilhas.length === 2, null, { timeout: 30000 });
  const [em, tm] = await pg.evaluate(() => window.__partilhas);
  check(em.nome === "Auditoria 5S - Loja A - 2026-10-20.pdf" && em.tipo === "application/pdf" && em.inicio === "%PDF-" && em.tam > 50000,
    "o email leva o PDF: " + JSON.stringify(em).slice(0, 200));
  check(em.titulo === "Auditoria 5S - Loja A - 2026-10-20" && /^Segue em anexo/.test(em.texto) && /Nota: \d+\/100/.test(em.texto),
    "o email leva o assunto e o resumo: " + em.texto);
  check(!/^Segue/.test(tm.texto) && /Relatório completo no PDF em anexo\.$/.test(tm.texto), "o Teams leva o resumo curto: " + tm.texto);
  await pg.waitForFunction(() => /Enviada/.test(document.querySelector("#pos-aud").textContent), null, { timeout: 5000 }).catch(() => {});
  const env = (await auditoria(pg, 2)).envios;
  check(env.email && env.teams, "os dois envios ficam registados: " + JSON.stringify(env));
  /* Fechar o menu sem partilhar não conta. */
  await pg.evaluate(() => { window.__resposta = "cancelar"; const a = audits.find(x => x.id === 2); delete a.envios.email; });
  await pg.locator("#pa-email").click();
  await pg.waitForFunction(() => !document.querySelector("#pa-email").disabled, null, { timeout: 30000 });
  check(!(await auditoria(pg, 2)).envios.email, "fechar o menu de partilha não conta como enviada");
  /* O Histórico mostra-o, e o registo vai na cópia de segurança. */
  await pg.locator("#btn-back").click();
  check(/enviada \(Teams\)/.test(await pg.locator("#hist-list .card").first().textContent()), "o Histórico devia dizer «enviada (Teams)»");
  const [dj2] = await Promise.all([pg.waitForEvent("download"), pg.locator("[data-v=cfg]").click().then(() => pg.locator("#btn-expjson").click())]);
  const copia = JSON.parse(fs.readFileSync(await dj2.path(), "utf8"));
  check(copia.audits.find(a => a.id === 2).envios.teams, "o registo dos envios vai na cópia de segurança");
  await ctx.close();
}

/* ---------- 2. Sem menu de partilha (alguns browsers de computador) ---------- */
{
  const ctx = await b.newContext({ acceptDownloads: true });
  /* O Chromium tem a janela «Guardar como» (showSaveFilePicker), que o
     teste não consegue usar: retira-se, para testar a transferência normal. */
  await ctx.addInitScript(() => { delete window.showSaveFilePicker; });
  await ctx.addInitScript(() => {
    window.__links = [];
    const clicar = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (/^mailto:/.test(this.href)) { window.__links.push(this.href); return; }
      return clicar.call(this);
    };
  });
  const { pg, vistos } = await abrir(ctx);
  /* Passo 1 sem partilha: descarrega a cópia, e conta como feita. */
  const [dc] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.locator("#pa-copia").click()]);
  check(/_com_fotos\.json$/.test(dc.suggestedFilename()), "sem partilha, o passo 1 descarrega a cópia: " + dc.suggestedFilename());
  await pg.waitForFunction(() => /✓/.test(document.querySelectorAll("#pos-aud .passos li")[2].textContent), null, { timeout: 5000 }).catch(() => {});
  check(/✓ Feita/.test((await passos(pg))[2]), "sem partilha, a cópia também fica feita");
  check(!vistos.length, "sem partilha, o passo 1 não mostra avisos");
  /* O botão de importar diz que aceita os dois formatos. */
  check(/\.json ou \.txt/.test(await pg.locator("#btn-impjson").textContent()), "o botão de importar diz .json ou .txt");
  const [d1] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.locator("#pa-email").click()]);
  check(/\.pdf$/.test(d1.suggestedFilename()), "sem partilha, o email descarrega o PDF");
  await pg.waitForFunction(() => window.__links.length === 1, null, { timeout: 10000 }).catch(() => {});
  const link = (await pg.evaluate(() => window.__links))[0] || "";
  check(/^mailto:\?subject=Auditoria%205S%20-%20Loja%20A/.test(link) && /Anexe%20o%20PDF/.test(link),
    "e abre o email com o assunto, o resumo e o lembrete do anexo: " + link.slice(0, 120));
  const [d2] = await Promise.all([pg.waitForEvent("download", { timeout: 30000 }), pg.locator("#pa-teams").click()]);
  check(/\.pdf$/.test(d2.suggestedFilename()), "sem partilha, o Teams descarrega o PDF");
  await semDialogo(pg).catch(() => {});
  check(vistos.some(d => /Teams/.test(d.titulo) && /anexe o ficheiro/.test(d.texto)), "e explica como enviar pelo Teams");
  await ctx.close();
}

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do envio OK");
process.exit(erros.length || falhas.length ? 1 : 0);
