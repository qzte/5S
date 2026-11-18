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
import crypto from "node:crypto";
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

/* SECURITY.md, ponto 31: na app publicada o browser só corre cada biblioteca se
   o SHA-384 for o `integrity` do carregador. Embutidas, essa verificação faz-se
   aqui: o SHA-384 de cada ficheiro tem de ser o que o index.html declara
   (XLSX_SRI e PDF_LIBS). Uma biblioteca alterada não entra no ficheiro de teste. */
const sriDeclarado = f => {
  const nome = f.replace(/[.]/g, "\\.");
  const m = new RegExp('\\{src:"\\./' + nome + '",sri:"([^"]+)"').exec(html) ||
    (f === "vendor/xlsx.full.min.js" ? /const XLSX_SRI="([^"]+)"/.exec(html) : null);
  if (!m) falhar("o index.html não declara o integrity (SRI) de " + f);
  return m[1];
};
const libs = ["vendor/html2canvas.min.js", "vendor/jspdf.umd.min.js", "vendor/xlsx.full.min.js"].map(f => {
  const buf = fs.readFileSync(path.join(raiz, f));
  const sri = "sha384-" + crypto.createHash("sha384").update(buf).digest("base64");
  if (sri !== sriDeclarado(f)) falhar(f + " não coincide com o integrity (SRI) declarado no index.html — não embuto uma biblioteca alterada");
  return "<script>\n/* " + f + " (embutido para o teste no PC; SHA-384 verificado) */\n" +
    buf.toString("utf8").replace(/<\/script/gi, "<\\/script") + "\n</script>\n";
}).join("");

trocar('<link rel="manifest" href="./manifest.json">', "", "o manifesto");
trocar("<title>Auditoria 5S · Supermercados Kaizen</title>",
  "<title>[TESTE] Auditoria 5S · Supermercados Kaizen</title>", "o título");
trocar('if("serviceWorker" in navigator){', 'if(false&&"serviceWorker" in navigator){', "o registo do service worker");
/* A etiqueta, sozinha na sua linha: o texto «<body>» também aparece num comentário. */
/* SECURITY.md, ponto 30: aberto do disco, o ficheiro guarda os dados na origem
   file://, que o browser partilha com todos os HTML abertos do disco. O aviso
   diz para testar com dados de exemplo, e o botão apaga os dados de teste
   (localStorage e as fotos no IndexedDB) quando se acaba. */
const aviso =
  '<div id="aviso-teste" role="note" style="background:#fff3c4;color:#5c4300;border-bottom:2px solid #e0b100;' +
  'padding:8px 14px;font:600 14px/1.4 system-ui,sans-serif;text-align:center">Versão de teste ' + versao +
  " — teste com dados de exemplo. Aberto do disco, o que aqui grava fica no browser ao alcance de outros " +
  "ficheiros HTML abertos do disco: no fim, apague os dados de teste. " +
  '<button type="button" id="btn-apagar-teste" style="margin-left:8px;font:inherit;padding:2px 10px;cursor:pointer">' +
  "Apagar dados de teste</button></div>\n" +
  "<script>\n" +
  'document.getElementById("btn-apagar-teste").addEventListener("click",async()=>{\n' +
  '  if(!confirm("Apagar todas as auditorias, fotos e definições deste ficheiro de teste? A app verdadeira não é tocada."))return;\n' +
  "  try{localStorage.clear();}catch(e){}\n" +
  "  try{const dbs=indexedDB.databases?await indexedDB.databases():[{name:\"auditoria5s-fotos\"}];\n" +
  "    await Promise.all(dbs.map(d=>new Promise(r=>{const q=indexedDB.deleteDatabase(d.name);q.onsuccess=q.onerror=q.onblocked=()=>r();})));}catch(e){}\n" +
  "  location.reload();\n" +
  "});\n</script>\n";
trocar("\n<body>\n", "\n<body>\n" + aviso + libs, "a linha <body>");

const destino = path.join(raiz, "teste", "Auditoria5S-teste.html");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, html);
console.log(destino + " (" + (fs.statSync(destino).size / 1048576).toFixed(1) + " MB, versão " + versao + ")");
