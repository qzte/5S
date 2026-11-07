/* A CI tem tempos máximos: sem eles, um job encravado fica 6 horas a
   ocupar o runner, como já aconteceu ao instalar o Chromium. Este teste falha
   se um job novo, ou um smoke test novo, ficar sem o seu. Lê o YAML como
   texto: o ci.yml é simples e não vale a pena uma dependência para o ler. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const yml = fs.readFileSync(path.join(__dirname, "..", ".github", "workflows", "ci.yml"), "utf8");
const jobsTexto = yml.slice(yml.indexOf("\njobs:\n"));
/* Cada job: "  nome:" ao nível 2, até ao seguinte. */
const jobs = jobsTexto.split(/\n(?=  [a-z][\w-]*:\n)/).slice(1)
  .map(b => ({ nome: /^  ([\w-]+):/.exec(b)[1], corpo: b }));
/* Cada passo: "      - " ao nível 6, até ao seguinte. */
const passos = corpo => corpo.split(/\n(?=      - )/).slice(1);
const minutos = t => { const m = /\n {4,8}timeout-minutes: (\d+)\n/.exec("\n" + t + "\n"); return m ? +m[1] : null; };

test("a CI tem os quatro jobs", () => {
  assert.deepStrictEqual(jobs.map(j => j.nome), ["testes", "lint", "smoke", "versao"]);
});

test("cada job tem um tempo máximo, longe das 6 horas do GitHub", () => {
  for (const j of jobs) {
    const m = /\n    timeout-minutes: (\d+)\n/.exec(j.corpo);
    assert.ok(m, "o job " + j.nome + " não tem timeout-minutes");
    assert.ok(+m[1] > 0 && +m[1] <= 30, "o job " + j.nome + " tem um tempo máximo de " + m[1] + " minutos");
  }
});

test("cada smoke test e cada instalação têm o seu tempo máximo", () => {
  const smoke = jobs.find(j => j.nome === "smoke");
  const comRun = passos(smoke.corpo).filter(p => /\n {8}run: (node tests\/smoke|npm |npx )/.test(p));
  assert.ok(comRun.filter(p => /node tests\/smoke/.test(p)).length >= 16, "devia haver um passo por smoke test");
  for (const p of comRun) {
    const nome = (/- name: ([^\n]+)/.exec(p) || [, p.slice(0, 60)])[1];
    const m = minutos(p.split("\n").filter(l => /^ {8}timeout-minutes:/.test(l)).join("\n"));
    assert.ok(m && m <= 10, "o passo «" + nome + "» não tem tempo máximo (ou tem mais de 10 minutos)");
  }
  const total = Number(/\n    timeout-minutes: (\d+)\n/.exec(smoke.corpo)[1]);
  assert.ok(total >= 15, "o job dos smoke tests precisa de folga para os 16 testes e a instalação");
});

test("todos os smoke tests do repositório correm na CI", () => {
  const ficheiros = fs.readdirSync(__dirname).filter(f => /^smoke.*\.mjs$/.test(f));
  for (const f of ficheiros) assert.ok(yml.includes("node tests/" + f), f + " não corre na CI");
});
