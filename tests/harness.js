/* Harness: extrai as funções puras do index.html (ficheiro único) para poderem
   ser testadas em Node, sem DOM. Cada função é localizada pelo seu cabeçalho e
   avaliada num contexto isolado, junto com as dependências de que precisa. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

/* Extrai o corpo de uma declaração `function nome(` equilibrando chavetas. */
function extractFn(src, name) {
  const start = src.indexOf("function " + name + "(");
  if (start === -1) return null;
  let i = src.indexOf("{", start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

/* Extrai uma declaração de uma linha do tipo `const nome=...;` */
function extractConst(src, name) {
  const esc = name.replace(/[+]/g, "\\$&");
  /* Até ao fim da linha: um `;` pode aparecer dentro de um literal de string
     (ex.: ESC_MAP contém "&amp;"), pelo que não serve de delimitador. */
  const re = new RegExp("^(?:const|let)\\s+" + esc + "\\s*=.*$", "m");
  const m = src.match(re);
  if (!m) return null;
  /* Uma declaração que continue na linha seguinte chegaria aqui truncada, e os
     testes passariam a exercitar código que NÃO é o de produção — que é pior do
     que não a testar de todo. Aconteceu com `chaveTexto` (v3.1.3), extraída sem
     o .normalize() e sem o .trim(): o teste dos acentos falhava por uma razão
     que não existia no browser. Parênteses por fechar são o sinal. */
  const abertos = (s, a, b) => s.split(a).length - s.split(b).length;
  if (abertos(m[0], "(", ")") || abertos(m[0], "[", "]") || abertos(m[0], "{", "}"))
    throw new Error(
      "harness: a declaração de `" + name + "` não cabe numa linha e seria " +
      "extraída truncada. Declare-a com `function` (extraída por chavetas) " +
      "ou mantenha-a numa só linha.");
  return m[0];
}

/* Dependências comuns que quase todas as funções puras usam. São sempre
   incluídas para que os testes exercitem o código REAL do index.html. */
/* Ordem importa: `total` depende de `pctOf`, que é declarada com `function`
   (hoisted), por isso a ordem de inserção é segura. */
/* PILLARS/RESP/isResp são base desde 3.1.1: normItem() passou a normalizar o
   pilar e o responsável, e é dependência de quase todos os testes. `isResp` tem
   de vir depois de `RESP`, de quem depende. */
/* Desde 3.5.0 a lista de responsáveis é editável: `RESP` é montado a partir de
   `RESP_BASE` (que tem de vir antes) e mutado por aplicarResps(); `respKeys` e
   `respBase` leem-no, e substituíram a constante `REC_KEYS`. */
const BASE_CONSTS = ["ESC_MAP", "esc", "clean", "PILLARS", "RESP_BASE", "RESP",
  "isResp", "respBase", "respKeys", "WEIGHTS", "W_MAX", "wOf", "total"];
const BASE_FNS = ["pctOf"];

function buildContext(fnNames, constNames) {
  const parts = [];
  const consts = [...new Set([...BASE_CONSTS, ...(constNames || [])])];
  const fns = [...new Set([...BASE_FNS, ...(fnNames || [])])];
  consts.forEach(n => {
    const c = extractConst(HTML, n);
    if (c) parts.push(c);
  });
  fns.forEach(n => {
    const f = extractFn(HTML, n);
    if (f) parts.push(f);
  });
  const sandbox = { Math, JSON, String, Number, Object, Array, Date, console };
  vm.createContext(sandbox);
  /* `const`/`let` no topo de um script não se tornam propriedades do objecto
     global, e as `function` sim. Publicamos explicitamente todos os nomes
     pedidos para que os testes lhes possam aceder. */
  const nomes = [...consts, ...fns];
  const expor = "\n;(function(){" +
    nomes.map(n => `try{globalThis[${JSON.stringify(n)}]=${n};}catch(e){}`).join("") +
    "})();";
  vm.runInContext(parts.join("\n") + expor, sandbox);
  return sandbox;
}

module.exports = { HTML, extractFn, extractConst, buildContext };
