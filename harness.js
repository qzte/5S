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
  /* Declarações multilinha (arrays/objectos literais, como DEFAULT_ITEMS): o
     fim da linha não serve de delimitador, é preciso equilibrar os parênteses. */
  const multi = new RegExp("^(?:const|let)\\s+" + esc + "\\s*=\\s*[\\[{]", "m");
  const mm = src.match(multi);
  if (mm) {
    const ini = src.indexOf(mm[0]);
    const abre = mm[0].slice(-1), fecha = abre === "[" ? "]" : "}";
    let d = 0, i = ini + mm[0].length - 1;
    for (; i < src.length; i++) {
      if (src[i] === abre) d++;
      else if (src[i] === fecha) { d--; if (d === 0) break; }
    }
    return src.slice(ini, i + 1) + ";";
  }
  /* Até ao fim da linha: um `;` pode aparecer dentro de um literal de string
     (ex.: ESC_MAP contém "&amp;"), pelo que não serve de delimitador. */
  const re = new RegExp("^(?:const|let)\\s+" + esc + "\\s*=.*$", "m");
  const m = src.match(re);
  return m ? m[0] : null;
}

/* Dependências comuns que quase todas as funções puras usam. São sempre
   incluídas para que os testes exercitem o código REAL do index.html. */
/* Ordem importa: `total` depende de `pctOf`, que é declarada com `function`
   (hoisted), por isso a ordem de inserção é segura. */
const BASE_CONSTS = ["ESC_MAP", "esc", "clean", "WEIGHTS", "W_MAX", "wOf", "REC_KEYS", "total"];
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
