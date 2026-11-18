#!/usr/bin/env node
/* Gera teste/Auditoria5S-teste.html: a app num só ficheiro, para testar no PC
   com duplo clique (4.8.0). Não é publicado (o scripts/publicar.sh não o
   copia) e não vai para o repositório (.gitignore).

   Aberta do disco (file://), a app normal funciona menos o PDF e o Excel: as
   bibliotecas em vendor/ têm SRI, e o browser recusa verificar a integridade
   de ficheiros locais. Aqui ficam embutidas em <script> (os carregadores já
   não as pedem quando window.html2canvas, window.jspdf e window.XLSX existem).
   Também saem o manifesto e o registo do service worker, que não funcionam a
   partir do disco, e o título e um aviso no topo dizem que é a versão de teste.
   Os dados de um ficheiro aberto do disco ficam à parte dos de qzte.github.io.

   Uso: node scripts/teste-pc.mjs */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = f => fs.readFileSync(path.join(raiz, f), "utf8");
const falhar = msg => { console.error("teste-pc: " + msg); process.exit(1); };

let html = ler("index.html");
const versao = (/const APP_VERSION="([^"]+)"/.exec(html) || [])[1];
if (!versao) falhar("não encontrei APP_VERSION no index.html");

/* Troca exactamente uma ocorrência; falha se a âncora não existir, para nunca
   gerar em silêncio um ficheiro que ainda tenta carregar o que não pode. */
const trocar = (antes, depois, nome) => {
  const i = html.indexOf(antes);
  if (i < 0) falhar("não encontrei " + nome + " no index.html");
  html = html.slice(0, i) + depois + html.slice(i + antes.length);
};

const libs = ["vendor/html2canvas.min.js", "vendor/jspdf.umd.min.js", "vendor/xlsx.full.min.js"]
  .map(f => "<script>\n/* " + f + " (embutido para o teste no PC) */\n" +
    ler(f).replace(/<\/script/gi, "<\\/script") + "\n</script>\n").join("");

trocar('<link rel="manifest" href="./manifest.json">', "", "o manifesto");
trocar("<title>Auditoria 5S · Supermercados Kaizen</title>",
  "<title>[TESTE] Auditoria 5S · Supermercados Kaizen</title>", "o título");
trocar('if("serviceWorker" in navigator){', 'if(false&&"serviceWorker" in navigator){', "o registo do service worker");
/* A etiqueta, sozinha na sua linha: o texto «<body>» também aparece num comentário. */
trocar("\n<body>\n", "\n<body>\n" +
  '<div id="aviso-teste" role="note" style="background:#fff3c4;color:#5c4300;border-bottom:2px solid #e0b100;' +
  'padding:8px 14px;font:600 14px/1.4 system-ui,sans-serif;text-align:center">Versão de teste ' + versao +
  " — os dados ficam só neste ficheiro, à parte da app verdadeira.</div>\n" + libs, "a linha <body>");

const destino = path.join(raiz, "teste", "Auditoria5S-teste.html");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, html);
console.log(destino + " (" + (fs.statSync(destino).size / 1048576).toFixed(1) + " MB, versão " + versao + ")");
