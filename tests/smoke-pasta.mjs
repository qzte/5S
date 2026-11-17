/* Smoke test de browser da cópia de segurança automática na pasta partilhada (v4.6.0):
   escolher a pasta grava auditoria5s_backup.json; gravar uma auditoria volta a gravá-lo;
   se outra pessoa gravou entretanto, a gravação automática pára e avisa, e «Abrir a versão
   da pasta» funde e volta a gravar. A pasta é de mentira, em memória. */
import pw from "playwright";
import { ligarDialogos } from "./dialogos.mjs";
import { escolherServico } from "./servico.mjs";
const { chromium } = pw;

const URL = "http://127.0.0.1:8765/index.html";
const FICHEIRO = "auditoria5s_backup.json";
const b = await chromium.launch();
const pg = await b.newPage();
const erros = [];
pg.on("pageerror", e => erros.push(String(e)));
const BENIGNO = /frame-ancestors/;
pg.on("console", m => { if (m.type() === "error" && !BENIGNO.test(m.text())) erros.push(m.text()); });
await ligarDialogos(pg, d => (/Importar histórico/.test(d.titulo) ? "Fundir" : undefined));
await pg.addInitScript(() => {
  const raiz = {}, copias = {};
  window.__PASTA = { raiz, copias, escritas: 0 };
  const escritor = (alvo, nome) => ({
    t: "", async write(x) { this.t += x; },
    async close() { alvo[nome] = this.t; window.__PASTA.escritas++; }, async abort() {},
  });
  const dirCopias = {
    async getFileHandle(nome) { return { async createWritable() { return escritor(copias, nome); } }; },
    async removeEntry(nome) { delete copias[nome]; },
    keys: async function* () { for (const k of Object.keys(copias)) yield k; },
  };
  const handle = {
    kind: "directory", name: "partilhada",
    async queryPermission() { return "granted"; },
    async requestPermission() { return "granted"; },
    async getFileHandle(nome, op) {
      if (!(nome in raiz) && !(op && op.create)) throw Object.assign(new Error("nao existe"), { name: "NotFoundError" });
      return {
        async getFile() { const t = raiz[nome]; return { size: t.length, lastModified: 0, async text() { return t; } }; },
        async createWritable() { return escritor(raiz, nome); },
      };
    },
    async getDirectoryHandle() { return dirCopias; },
  };
  window.showDirectoryPicker = async () => handle;
});
await pg.goto(URL);

const falhas = [];
const check = (ok, msg) => { if (!ok) falhas.push(msg); };
const cop = () => pg.evaluate(n => { const t = window.__PASTA.raiz[n]; return t ? JSON.parse(t) : null; }, FICHEIRO);
const gravarAuditoria = async data => {
  await pg.locator("[data-v=audit]").click();
  await pg.locator("#f-verif").fill("Sicrano");
  for (const el of await pg.locator("[data-pick]").all()) await el.fill("0");
  await pg.locator("#f-date").fill(data);
  await escolherServico(pg); await pg.locator("#btn-save").click();
};

/* ---- 1. Sem pasta: o cartão diz porquê. Escolher a pasta grava a cópia (vazia). ---- */
await pg.locator("[data-v=cfg]").click();
check((await pg.locator("#pasta-estado").textContent()).includes("Nenhuma pasta"), "o cartão devia dizer que não há pasta");
await pg.locator("#btn-pasta").click();
await pg.waitForFunction(n => !!window.__PASTA.raiz[n], FICHEIRO, { timeout: 10000 });
let f = await cop();
check(f.app === "auditoria5s" && Array.isArray(f.audits) && f.audits.length === 0 && typeof f.updatedAt === "string", "formato da cópia errado");
check((await pg.locator("#pasta-estado").textContent()).includes("A gravar auditoria5s_backup.json"), "o cartão devia dizer que está a gravar");

/* ---- 2. Gravar uma auditoria grava a cópia sozinha (~4 s depois). ---- */
await gravarAuditoria("2026-01-02");
await pg.waitForFunction(n => { const t = window.__PASTA.raiz[n]; return t && JSON.parse(t).audits.length === 1; }, FICHEIRO, { timeout: 15000 }).catch(() => {});
f = await cop();
check(f.audits.length === 1, "a auditoria gravada devia chegar à cópia da pasta");

/* ---- 3. Outra pessoa grava a cópia (mais uma auditoria): a gravação automática pára e avisa. ---- */
const deOutra = JSON.parse(JSON.stringify(f));
deOutra.updatedAt = deOutra.exportedAt = "2099-01-01T00:00:00.000Z";
deOutra.audits = [{ ...f.audits[0], id: 999, date: "2026-01-03" }];
await pg.evaluate(([n, t]) => { window.__PASTA.raiz[n] = t; }, [FICHEIRO, JSON.stringify(deOutra)]);
await gravarAuditoria("2026-01-04");
await pg.waitForFunction(() => !document.getElementById("aviso-pasta").classList.contains("hidden"), null, { timeout: 15000 }).catch(() => {});
check(!(await pg.locator("#aviso-pasta").evaluate(e => e.classList.contains("hidden"))), "devia avisar que a cópia da pasta mudou");
await pg.waitForTimeout(6000);
check((await cop()).updatedAt === "2099-01-01T00:00:00.000Z", "não devia gravar por cima da cópia de outra pessoa");

/* ---- 4. «Abrir a versão da pasta» funde (a de outra pessoa + as locais) e volta a gravar. ---- */
await pg.locator("#btn-pasta-abrir").click();
await pg.waitForFunction(n => { const t = window.__PASTA.raiz[n]; const j = t && JSON.parse(t); return j && j.updatedAt !== "2099-01-01T00:00:00.000Z"; }, FICHEIRO, { timeout: 20000 }).catch(() => {});
f = await cop();
check(f.updatedAt !== "2099-01-01T00:00:00.000Z" && f.audits.length === 3, "depois de fundir, devia gravar as 3 auditorias (tem " + f.audits.length + ")");
check(await pg.locator("#aviso-pasta").evaluate(e => e.classList.contains("hidden")), "o aviso devia desaparecer depois de abrir a pasta");
const copias = await pg.evaluate(() => Object.keys(window.__PASTA.copias));
check(copias.some(n => /^auditoria5s_backup_2099-01-01_/.test(n)), "a versão da outra pessoa devia ficar em copias-backup/");

/* ---- 5. «Deixar de gravar» larga a pasta. ---- */
await pg.locator("[data-v=cfg]").click();
await pg.locator("#btn-pasta-off").click();
await pg.waitForFunction(() => document.getElementById("pasta-estado").textContent.includes("Nenhuma pasta"), null, { timeout: 5000 }).catch(() => {});
check((await pg.locator("#pasta-estado").textContent()).includes("Nenhuma pasta"), "depois de largar, o cartão devia dizer que não há pasta");

await b.close();
console.log(erros.length ? "ERROS JS:\n" + erros.join("\n") : "sem erros de JS");
console.log(falhas.length ? "FALHAS:\n" + falhas.join("\n") : "smoke da pasta OK");
process.exit(erros.length || falhas.length ? 1 : 0);
