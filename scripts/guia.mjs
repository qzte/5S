/* Gera guia.html a partir de GUIA.md (3.16.0).

   O guia de utilização é escrito em Markdown (GUIA.md, legível no repositório),
   mas quem usa a app não tem acesso ao repositório, que é privado. Esta página
   é publicada com a app, fica na cache offline, e abre-se da Configuração.

   guia.html fica no repositório, para a app servida localmente também a ter;
   tests/guia.test.js falha se não estiver em dia com o GUIA.md. Depois de mudar
   o guia:   node scripts/guia.mjs

   Conversor mínimo, sem dependências: só o Markdown que o GUIA.md usa —
   títulos, parágrafos, listas, tabelas, **negrito**, *itálico*, `código` e
   ligações. Todo o texto é escapado antes de qualquer marcação. As ligações
   para ficheiros do repositório (README.md, CHANGELOG.md) ficam só como texto:
   não são publicadas. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Âncora de um título, como o GitHub a gera: minúsculas, sem pontuação,
   espaços trocados por hífenes. Mantém as âncoras do GUIA.md a funcionar. */
export function ancora(titulo) {
  return titulo.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
}

function inline(texto) {
  let s = esc(texto);
  const codigos = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codigos.push(c); return "\u0000" + (codigos.length - 1) + "\u0000"; });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    if (u.startsWith("#")) return `<a href="${u}">${t}</a>`;
    if (/^https:\/\//.test(u)) return `<a href="${u}" rel="noopener noreferrer">${t}</a>`;
    return t;                                   /* ficheiro do repositório: só o texto */
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  /* Depois do negrito: um endereço entre ** ** não pode levar os asteriscos. */
  s = s.replace(/(^|[^\w"/])(https:\/\/[^\s<"]+[^\s<".,;:)])/g, (m, a, u) => `${a}<a href="${u}" rel="noopener noreferrer">${u}</a>`);
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codigos[+i]}</code>`);
  return s;
}

/* Corpo HTML de um texto Markdown. */
export function mdParaHtml(md) {
  const linhas = md.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const out = [];
  let i = 0;
  const lista = (re, tag) => {
    const itens = [];
    while (i < linhas.length && (re.test(linhas[i]) || (itens.length && /^\s{2,}\S/.test(linhas[i])))) {
      if (re.test(linhas[i])) itens.push(linhas[i].replace(re, ""));
      else itens[itens.length - 1] += " " + linhas[i].trim();
      i++;
    }
    out.push(`<${tag}>` + itens.map(t => `<li>${inline(t)}</li>`).join("") + `</${tag}>`);
  };
  while (i < linhas.length) {
    const l = linhas[i];
    if (!l.trim()) { i++; continue; }
    const h = /^(#{1,4}) (.+)$/.exec(l);
    if (h) {
      const n = h[1].length;
      out.push(`<h${n} id="${esc(ancora(h[2]))}">${inline(h[2])}</h${n}>`);
      i++; continue;
    }
    if (l.startsWith("|")) {
      const linhasT = [];
      while (i < linhas.length && linhas[i].startsWith("|")) linhasT.push(linhas[i++]);
      const celulas = r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const cab = celulas(linhasT[0]);
      const corpo = linhasT.slice(2).map(celulas);
      out.push("<table><thead><tr>" + cab.map(c => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>" +
        corpo.map(r => "<tr>" + r.map(c => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table>");
      continue;
    }
    if (/^- /.test(l)) { lista(/^- /, "ul"); continue; }
    if (/^\d+\. /.test(l)) { lista(/^\d+\. /, "ol"); continue; }
    const par = [];
    while (i < linhas.length && linhas[i].trim() && !/^(#{1,4} |\||- |\d+\. )/.test(linhas[i])) par.push(linhas[i++].trim());
    out.push(`<p>${inline(par.join(" "))}</p>`);
  }
  return out.join("\n");
}

/* A página completa. Sem scripts; a CSP do <meta> proíbe-os. */
export function paginaGuia(md) {
  return `<!DOCTYPE html>
<!-- Gerado por scripts/guia.mjs a partir de GUIA.md. Não editar à mão. -->
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#12211c">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>Guia de utilização · Auditoria 5S</title>
<link rel="icon" href="./icons/icon-192.png" type="image/png">
<style>
:root{--bg:#f4f1ea;--ink:#1d2a24;--panel:#fff;--line:#d9d3c5;--muted:#5f6b64;--green:#1f6f50;--green-dk:#12211c;--accent:#e8500a;--link:#1f6f50;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101815;--ink:#e3e9e5;--panel:#18231e;--line:#33433b;--muted:#a3b0a8;--link:#7dd3ab;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 "Iowan Old Style",Georgia,"Times New Roman",serif}
header{background:var(--green-dk);color:#f4f1ea;padding:14px 20px;border-bottom:4px solid var(--accent);position:sticky;top:0}
header a{color:#f4f1ea;font:700 .8rem/1 "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;text-decoration:none}
main{max-width:760px;margin:0 auto;padding:18px 16px 60px}
h1,h2,h3,h4,th{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
h1,h2,h3,h4{scroll-margin-top:64px}
h1{font-size:1.6rem;margin:.4em 0}h2{font-size:1.25rem;margin-top:1.8em;padding-top:.6em;border-top:1px solid var(--line)}
a{color:var(--link)}
table{width:100%;border-collapse:collapse;margin:1em 0;font-size:.9rem;background:var(--panel)}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{font-size:.75rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
code{font-size:.9em;background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:0 4px}
li{margin:.25em 0}
@media print{header{display:none}}
</style>
</head>
<body>
<header><a href="./">← Voltar à aplicação</a></header>
<main>
${mdParaHtml(md)}
</main>
</body>
</html>
`;
}

/* Linha de comandos: escreve guia.html; com --verificar, só diz se está em dia. */
const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = paginaGuia(fs.readFileSync(path.join(RAIZ, "GUIA.md"), "utf8"));
  const destino = path.join(RAIZ, "guia.html");
  if (process.argv.includes("--verificar")) {
    const igual = fs.existsSync(destino) && fs.readFileSync(destino, "utf8") === html;
    console.log(igual ? "guia.html em dia." : "guia.html desactualizado: corra  node scripts/guia.mjs");
    process.exit(igual ? 0 : 1);
  }
  fs.writeFileSync(destino, html);
  console.log("guia.html gerado a partir de GUIA.md.");
}
