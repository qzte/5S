/* Smoke test de browser de «auditar no telemóvel, finalizar no PC» (3.25.0).
   Dois contextos do browser fazem de dois dispositivos, com os mesmos dados de
   partida (uma auditoria anterior com uma acção em aberto):
   - no telemóvel (com menu de partilha), a auditoria nova fecha a acção no
     terreno, leva uma foto de evidência, grava-se «por finalizar» e vai para o
     PC pelo menu de partilha, num ficheiro só com ela;
   - no PC (sem menu de partilha), «Importar auditoria» abre-a, com a foto e a
     acção fechada; edita-se sem código, finaliza-se, e o cartão passa ao PDF,
     ao envio e à cópia; reimportar o mesmo ficheiro não estraga o que se fez;
   - a cópia do PC, importada no telemóvel com Fundir, actualiza lá a
     auditoria (a mais recente ganha). */
import pw from "playwright";
import fs from "fs";
import os from "os";
import path from "path";
import { ligarDialogos, semDialogo } from "./dialogos.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const b = await chromium.launch();
const falhas = [], erros = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const BENIGNO = /frame-ancestors/;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "terreno-"));

async function dispositivo(comPartilha) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (comPartilha) await ctx.addInitScript(() => {
    window.__partilhas = [];
    /* Como o Chrome: partilha .pdf e .txt, não .json. */
    navigator.canShare = d => !!(d && d.files && d.files.every(f => /\.(pdf|txt)$/.test(f.name)));
    navigator.share = async d => {
      const f = d.files[0];
      window.__partilhas.push({ nome: f.name, tipo: f.type, titulo: d.title, texto: d.text, conteudo: await f.text() });
    };
  });
  const pg = await ctx.newPage();
  pg.on("pageerror", e => erros.push(String(e)));
  pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
  const vistos = [];
  await ligarDialogos(pg, d => { vistos.push(d); return undefined; });
  await pg.goto(URL);
  await pg.evaluate(() => {
    const it = ITEMS.map(x => Object.assign({}, x));
    localStorage.setItem("audits", JSON.stringify([{ id: 1, service: "Loja A", date: "2026-10-01", verif: "Fulano",
      scores: it.map(() => 1), raw: it.map(() => null), tgts: it.map(() => null), items: it,
      alterada: "2026-10-01T10:00:00.000Z",
      acoes: [{ id: 1, r: "U", texto: "Retirar caixas", prazo: "2026-10-25", estado: "aberta", feitaEm: "", item: 1 }] }]));
    localStorage.setItem("services", JSON.stringify(["Loja A"]));
  });
  await pg.reload();
  return { ctx, pg, vistos };
}
const esperar = async (pg, fn, ms = 5000) => { for (let t = 0; t < ms; t += 100) { if (await fn()) return true; await pg.waitForTimeout(100); } return false; };
const chavesFotos = pg => pg.evaluate(() => new Promise(res => {
  const rq = indexedDB.open("auditoria5s-fotos", 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore("fotos");
  rq.onsuccess = () => { const r = rq.result.transaction("fotos").objectStore("fotos").getAllKeys();
    r.onsuccess = () => { rq.result.close(); res(r.result.map(String)); }; };
}));
const passos = pg => pg.locator("#pos-aud .passos li").allTextContents().then(l => l.map(t => t.replace(/\s+/g, " ")));

/* ---------- 1. No telemóvel ---------- */
const tel = await dispositivo(true);
let pg = tel.pg;
check(!(await pg.locator("#acoes-abertas").isHidden()), "o formulário mostra a acção em aberto do serviço");
await pg.locator("#acoes-abertas [data-acao-feita]").click();
check(await pg.evaluate(() => audits[0].acoes[0].estado) === "feita", "a acção fica feita no terreno");
for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
await pg.locator("[data-pick='0']").fill("9");  /* contagem: 9 a mais é Mau */
await pg.locator("[data-nota='0']").fill("caixas no corredor");
await pg.locator("[data-efile='0']").setInputFiles({ name: "f.png", mimeType: "image/png", buffer: png });
check(await esperar(pg, async () => await pg.locator("[data-efoto='0'] img").count() === 1), "a foto aparece no formulário");
await pg.locator("#btn-save").click();
await semDialogo(pg);
const nova = await pg.evaluate(() => audits[audits.length - 1]);
check(nova.fase === "terreno" && !!nova.alterada, "a auditoria nova fica por finalizar, com a data de alteração");
let p = await passos(pg);
check(p.length === 2 && /Enviar para o PC/.test(p[0]) && /Finalizar/.test(p[1]), "por finalizar, os passos são enviar e finalizar: " + p.join(" | "));
check(await pg.locator("#pa-pdf").count() === 0, "o PDF só depois de finalizada");
check(await esperar(pg, async () => (await chavesFotos(pg)).includes(nova.id + "#0")), "a foto fica gravada com a auditoria");
await pg.locator("#pa-pc").click();
await pg.waitForFunction(() => window.__partilhas.length === 1, null, { timeout: 30000 });
const env = await pg.evaluate(() => window.__partilhas[0]);
check(/^Auditoria 5S - Loja A - \d{4}-\d{2}-\d{2}\.txt$/.test(env.nome), "o ficheiro tem o nome da auditoria: " + env.nome);
check(/Importar auditoria/.test(env.texto), "o texto diz como a abrir no PC: " + env.texto);
const fich = JSON.parse(env.conteudo);
check(fich.tipo === "auditoria" && fich.audits.length === 1 && fich.audits[0].id === nova.id, "só esta auditoria vai no ficheiro");
check(fich.fotos.length === 1 && fich.fotos[0].k === nova.id + "#0", "com a foto dela: " + JSON.stringify(fich.fotos.map(f => f.k)));
check(fich.acoesFeitas.length === 1 && fich.acoesFeitas[0].texto === "Retirar caixas", "e a acção fechada no terreno");
await pg.waitForFunction(() => /✓ Enviada/.test(document.querySelector("#pos-aud").textContent), null, { timeout: 5000 }).catch(() => {});
check(/✓ Enviada/.test((await passos(pg))[0]), "o passo de enviar fica feito");
await pg.locator("#btn-back").click();
check(/por finalizar \(enviada para o PC/.test(await pg.locator("#hist-list").textContent()), "o Histórico diz por finalizar e enviada para o PC");

/* ---------- 2. No PC ---------- */
const pc = await dispositivo(false);
pg = pc.pg;
const caminho = path.join(tmp, env.nome);
fs.writeFileSync(caminho, env.conteudo);
await pg.locator("[data-v=history]").click();
check(await pg.locator("#btn-hist-importar").isVisible(), "o Histórico tem o botão Importar auditoria");
await pg.locator("#hist-file").setInputFiles(caminho);
await semDialogo(pg);
const caixaImp = pc.vistos.find(d => d.titulo === "Importar auditoria");
check(caixaImp && /Loja A/.test(caixaImp.texto) && /1 foto/.test(caixaImp.texto) && /acções feitas no terreno/.test(caixaImp.texto),
  "a caixa descreve a auditoria do ficheiro: " + (caixaImp && caixaImp.texto));
check(!pc.vistos.some(d => /Substituir/.test(d.texto)), "um ficheiro de auditoria nunca propõe substituir o histórico");
check(await pg.locator("#view-report").isVisible() && /Loja A/.test(await pg.locator("#view-report .score-hero").textContent()),
  "importada, abre o relatório dela");
let estado = await pg.evaluate(() => ({ n: audits.length, acao: audits[0].acoes[0].estado, ult: audits[audits.length - 1] }));
check(estado.n === 2, "fica com as duas auditorias: " + estado.n);
check(estado.acao === "feita", "a acção fechada no terreno fica fechada no PC");
check(estado.ult.fase === "terreno" && estado.ult.envios && estado.ult.envios.pc, "por finalizar, com o envio registado");
check(await esperar(pg, async () => await pg.locator("#evid img").count() === 1), "a foto de evidência veio com ela");
p = await passos(pg);
check(/✓ Enviada/.test(p[0]) && /Finalizar/.test(p[1]), "no PC, o cartão mostra o envio feito e o passo de finalizar: " + p.join(" | "));

/* Completar: editar sem código, uma recomendação, e finalizar. */
const antesPin = pc.vistos.length;
await pg.locator("#btn-edit").click();
check(!(await pg.locator("#edit-banner").isHidden()), "por finalizar, edita-se sem código");
check(!pc.vistos.slice(antesPin).some(d => d.temCampo), "sem pedir o código");
await pg.locator("#f-note").fill("completada no PC");
await pg.locator("#btn-save").click();
await semDialogo(pg);
await pg.locator("[data-rec='U']").fill("Arrumar o corredor 3.");
await pg.locator("#pa-fim").click();
p = await passos(pg);
check(p.length === 3 && /PDF do relatório/.test(p[0]) && /Enviar/.test(p[1]) && /Cópia de segurança/.test(p[2]),
  "finalizada, o cartão passa ao PDF, ao envio e à cópia: " + p.join(" | "));
check(/✓ Finalizada/.test(await pg.locator("#pos-aud").textContent()), "e diz que foi finalizada");
estado = await pg.evaluate(() => audits[audits.length - 1]);
check(!estado.fase && estado.finalizada && estado.note === "completada no PC" && estado.recs.U === "Arrumar o corredor 3.",
  "finalizada, com o que se acrescentou no PC");
await pg.locator("#btn-back").click();
check(!/por finalizar/.test(await pg.locator("#hist-list .card").first().textContent()), "o Histórico deixa de dizer por finalizar");

/* Reimportar o mesmo ficheiro (mais antigo) não desfaz o trabalho do PC. */
await pg.locator("#hist-file").setInputFiles(caminho);
await semDialogo(pg);
check(pc.vistos.some(d => /igual ou mais recente/.test(d.texto)), "reimportar avisa que a deste dispositivo é mais recente");
estado = await pg.evaluate(() => ({ n: audits.length, ult: audits[audits.length - 1] }));
check(estado.n === 2 && estado.ult.note === "completada no PC" && !estado.ult.fase, "e fica a do PC");

/* ---------- 3. Do PC para o telemóvel: Fundir actualiza ---------- */
await pg.locator("[data-v=cfg]").click();
const [dj] = await Promise.all([pg.waitForEvent("download"), pg.locator("#btn-expjson").click()]);
const copia = path.join(tmp, "copia.json");
fs.writeFileSync(copia, fs.readFileSync(await dj.path()));
pg = tel.pg;
await pg.locator("#hist-file").setInputFiles(copia);
await semDialogo(pg);
const caixaFundir = tel.vistos.find(d => d.titulo === "Importar histórico");
/* As duas: a nova, finalizada no PC, e a anterior, onde o PC fechou a acção
   (depois de o telemóvel a fechar: a do PC é a mais recente). */
check(caixaFundir && /actualiza 2/.test(caixaFundir.texto), "a caixa diz quantas o ficheiro actualiza: " + (caixaFundir && caixaFundir.texto));
estado = await pg.evaluate(() => ({ n: audits.length, ult: audits[audits.length - 1] }));
check(estado.n === 2 && estado.ult.note === "completada no PC" && !estado.ult.fase && estado.ult.finalizada,
  "no telemóvel, a auditoria passa a ser a finalizada no PC");
check((await chavesFotos(pg)).includes(estado.ult.id + "#0"), "uma cópia sem fotos deixa as do telemóvel como estão");

await tel.ctx.close();
await pc.ctx.close();
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke do terreno OK");
process.exit(erros.length || falhas.length ? 1 : 0);
