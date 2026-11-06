/* Lint do JavaScript embutido no index.html (3.10.0).

   A app é um ficheiro único e o ESLint não lê HTML sem um plugin. Em vez de
   acrescentar mais uma dependência, este script tira do index.html os blocos
   <script> que são da app (o SheetJS embutido fica de fora: é código de
   terceiros, fixado pelo SHA-256 em tests/sheetjs.test.js) e passa-os ao
   ESLint pela API, cada um como um script clássico do browser.

   Cada bloco é precedido de tantas linhas em branco quantas as que o separam
   do início do ficheiro: as linhas que o ESLint aponta são as do index.html.

   Só regras de ERRO (eslint:recommended, com as excepções abaixo), nenhuma de
   estilo: o objectivo é apanhar variáveis por declarar, código inalcançável,
   chaves duplicadas e afins, sem reescrever o código compacto que existe.

   Uso:  npm ci --prefix tools/lint && node tools/lint/lint.mjs */
import { ESLint } from "eslint";
import js from "@eslint/js";
import globals from "globals";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FICHEIRO = path.join(RAIZ, "index.html");
const html = fs.readFileSync(FICHEIRO, "utf8");

/* Blocos <script> sem atributos, abertos no início de uma linha (um «<script>»
   citado num comentário não conta), com a linha onde o conteúdo começa. */
const blocos = [];
const re = /^<script>([\s\S]*?)<\/script>/gm;
let m;
while ((m = re.exec(html))) {
  const inicio = m.index + "<script>".length;
  const linha = html.slice(0, inicio).split("\n").length - 1;
  blocos.push({ codigo: m[1], linha });
}
const daApp = blocos.filter(b => !/^\/\*\s*SheetJS/.test(b.codigo.trimStart()));
if (daApp.length !== blocos.length - 1) {
  console.error(`lint: esperava exactamente um bloco do SheetJS entre ${blocos.length} <script>.`);
  process.exit(2);
}

const eslint = new ESLint({
  cwd: RAIZ,
  overrideConfigFile: true,
  overrideConfig: [
    /* O texto é passado com o caminho do index.html, para as mensagens o
       apontarem; os `files` dizem ao ESLint que a configuração vale para ele. */
    { files: ["index.html"], ...js.configs.recommended },
    {
      files: ["index.html"],
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "script",
        globals: { ...globals.browser, XLSX: "readonly" }
      },
      rules: {
        /* `catch(e){}` vazio é deliberado em vários sítios (localStorage cheio
           ou ilegível, IndexedDB indisponível) e está comentado onde o é. */
        "no-empty": ["error", { allowEmptyCatch: true }],
        /* Os parâmetros de catch e os argumentos posicionais não usados são
           comuns no código existente e não escondem erros. */
        "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }]
      }
    }
  ]
});

let erros = 0;
for (const b of daApp) {
  const [res] = await eslint.lintText("\n".repeat(b.linha) + b.codigo, { filePath: FICHEIRO });
  for (const msg of res.messages) {
    erros++;
    console.log(`index.html:${msg.line}:${msg.column}  ${msg.message}  (${msg.ruleId || "parse"})`);
  }
}
console.log(erros ? `\n${erros} problema(s).` : "lint: sem problemas.");
process.exit(erros ? 1 : 0);
