/* Smoke test de browser da 3.20.0: o relatório mensal (escolher o mês na
   Análise, conteúdo, impressão, voltar) e a partilha da cópia de segurança
   com fotos (Web Share simulado, como o do Chrome, que só partilha .txt). */
import pw from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [];
const erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;
async function pagina(ctx) {
  const pg = await ctx.newPage();
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
  pg.on("dialog", d => d.accept(""));
  await ligarDialogos(pg, () => undefined);
  return pg;
}
/* Duas lojas: em Setembro a Loja A a 100; em Outubro a Loja A a 0 e depois a
   100, a Loja B a meio, e uma acção nova. Mês actual: o do relógio. */
const semear = pg => pg.evaluate(() => {
  const it = ITEMS.map(x => Object.assign({}, x));
  const mk = (id, service, date, s, acoes) => ({ id, service, date, verif: "V",
    scores: it.map(() => s), raw: it.map(() => null), tgts: it.map(() => null), items: it, acoes });
  localStorage.setItem("audits", JSON.stringify([
    mk(1, "Loja A", "2026-09-10", 2), mk(2, "Loja A", "2026-10-05", 0, [{ id: 1, r: "U", texto: "Arrumar", prazo: "2026-10-20", estado: "aberta", feitaEm: "", item: 1 }]),
    mk(3, "Loja A", "2026-10-20", 2), mk(4, "Loja B", "2026-10-15", 1)]));
  localStorage.setItem("services", JSON.stringify(["Loja A", "Loja B", "Loja C"]));
  localStorage.setItem("backup", JSON.stringify({ at: new Date().toISOString(), pend: 0, atFotos: new Date().toISOString(), pendFotos: 0 }));
});

/* ---------- 1. Relatório mensal ---------- */
{
  const ctx = await b.newContext();
  const pg = await pagina(ctx);
  await pg.goto(URL);
  await semear(pg);
  await pg.reload();
  check(await pg.locator("#btn-partilhar").isHidden(), "sem Web Share de ficheiros, o botão de partilhar não aparece");
  await pg.locator("[data-v=stats]").click();
  const meses = await pg.locator("#an-mes option").evaluateAll(o => o.map(x => x.value));
  const atual = new Date().toISOString().slice(0, 7);
  check(meses[0] === atual && meses.includes("2026-10") && meses.includes("2026-09"),
    "os meses deviam ser o actual e os com auditorias: " + meses);
  check(await pg.locator("#an-mes").inputValue() === (atual === "2026-10" ? atual : meses.find(m => m <= "2026-10")),
    "por omissão, o mês mais recente com auditorias");
  await pg.locator("#an-mes").selectOption("2026-10");
  await pg.locator("#btn-mensal").click();
  const hero = await pg.locator("#mensal-hero").textContent();
  check(/outubro de 2026/.test(hero) && /46\/100/.test(hero) && /3 auditoria\(s\) a 2 serviço\(s\)/.test(hero),
    "o cabeçalho devia ter o mês, a média e as contagens: " + hero.replace(/\s+/g, " "));
  check(/mês anterior: 100\/100 em 1 auditoria\(s\) · -54 pontos/.test(hero.replace(/\s+/g, " ")), "a comparação com Setembro: " + hero.replace(/\s+/g, " "));
  const linhas = (await pg.locator("#mensal-svc tr").allTextContents()).map(t => t.replace(/\s+/g, " "));
  check(linhas.length === 4 && /Loja B/.test(linhas[1]) && /Loja A/.test(linhas[2]) && /▼ -50/.test(linhas[2]) && /Loja C.*Sem auditoria/.test(linhas[3]),
    "a tabela dos serviços, do pior para o melhor: " + linhas.join(" | "));
  check(await pg.locator("#mensal-piores tr").count() === 6, "as cinco perguntas que mais falharam, mais o cabeçalho");
  const acoes = (await pg.locator("#mensal-acoes td").allTextContents()).join(",");
  check(acoes === "1,0,1,1" && /no fim do mês/.test(await pg.locator("#mensal-acoes").textContent()), "o plano de acção do mês: " + acoes);
  /* Impressão: as duas folhas, sem botões. */
  await pg.emulateMedia({ media: "print" });
  check(await pg.locator("#mensal-1").isVisible() && await pg.locator("#mensal-2").isVisible(), "as duas folhas imprimem-se");
  check(await pg.locator("#btn-print").isHidden() && await pg.locator("nav").isHidden(), "os botões e a navegação não se imprimem");
  /* Ainda em «print»: com «screen» emulado, o pdf() usaria o estilo do ecrã. */
  const pdf = await pg.pdf();
  await pg.emulateMedia({ media: "screen" });
  const folhas = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  check(folhas === 2, "o relatório mensal devia caber em duas folhas, e tem " + folhas);
  await pg.locator("#btn-back").click();
  check(!(await pg.locator("#view-stats").isHidden()) && await pg.locator("#view-report").isHidden(), "Voltar devia levar à Análise");
  /* Um mês sem auditorias também abre. */
  await pg.locator("#an-mes").selectOption(atual);
  await pg.locator("#btn-mensal").click();
  if (atual !== "2026-10" && atual !== "2026-09")
    check(/Sem auditorias/.test(await pg.locator("#mensal-hero").textContent()), "um mês sem auditorias diz que não as há");
  await ctx.close();
}

/* ---------- 2. Partilhar a cópia com fotos ---------- */
{
  const ctx = await b.newContext();
  /* Como o Chrome: canShare recusa .json e aceita .txt. */
  await ctx.addInitScript(() => {
    window.__partilhas = [];
    navigator.canShare = d => !!(d && d.files && d.files.every(f => /\.txt$/.test(f.name)));
    navigator.share = async d => {
      const f = d.files[0];
      window.__partilhas.push({ nome: f.name, tipo: f.type, texto: await f.text(), titulo: d.title });
    };
  });
  const pg = await pagina(ctx);
  await pg.goto(URL);
  await semear(pg);
  await pg.evaluate(() => { const b = JSON.parse(localStorage.getItem("backup")); delete b.atFotos; b.pendFotos = 2; localStorage.setItem("backup", JSON.stringify(b)); });
  await pg.reload();
  await pg.locator("[data-v=cfg]").click();
  check(!(await pg.locator("#btn-partilhar").isHidden()), "com Web Share de ficheiros, o botão de partilhar aparece");
  await pg.locator("#btn-partilhar").click();
  await pg.waitForFunction(() => window.__partilhas.length === 1, null, { timeout: 5000 }).catch(() => {});
  const [p] = await pg.evaluate(() => window.__partilhas);
  check(p && /^auditorias5s_\d{4}-\d{2}-\d{2}_com_fotos\.txt$/.test(p.nome) && p.tipo === "text/plain",
    "no Chrome, a cópia vai como .txt: " + (p && p.nome));
  const dados = p ? JSON.parse(p.texto) : {};
  check(dados.app === "auditoria5s" && dados.audits.length === 4 && Array.isArray(dados.fotos), "o ficheiro é a cópia com fotos");
  const bk = await pg.evaluate(() => JSON.parse(localStorage.getItem("backup")));
  check(bk.pendFotos === 0 && typeof bk.atFotos === "string", "partilhar conta como cópia com fotos");
  /* Cancelar o menu de partilha não conta como cópia. */
  await pg.evaluate(() => {
    const b = JSON.parse(localStorage.getItem("backup")); b.pendFotos = 3; localStorage.setItem("backup", JSON.stringify(b));
    navigator.share = async () => { throw new DOMException("cancelado", "AbortError"); };
  });
  await pg.locator("#btn-partilhar").click();
  await pg.waitForTimeout(300);
  check(await pg.evaluate(() => JSON.parse(localStorage.getItem("backup")).pendFotos) === 3, "cancelar a partilha não conta como cópia");
  check(!(await pg.evaluate(() => document.getElementById("dlg").open)), "cancelar a partilha não mostra erro");
  /* O .txt partilhado importa-se como o .json. */
  const ficheiro = path.join(os.tmpdir(), "5s-partilha.txt");
  fs.writeFileSync(ficheiro, p.texto);
  await pg.evaluate(() => localStorage.setItem("audits", "[]"));
  await pg.reload();
  await pg.locator("[data-v=cfg]").click();
  await pg.locator("#hist-file").setInputFiles(ficheiro);
  await pg.waitForFunction(() => JSON.parse(localStorage.getItem("audits") || "[]").length === 4, null, { timeout: 5000 }).catch(() => {});
  await semDialogo(pg).catch(() => {});
  check(await pg.evaluate(() => JSON.parse(localStorage.getItem("audits") || "[]").length) === 4, "o .txt partilhado devia importar-se");
  fs.unlinkSync(ficheiro);
  await ctx.close();
}

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do relatório mensal e da partilha OK");
process.exit(erros.length || falhas.length ? 1 : 0);
