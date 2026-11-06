/* CSP por hashes na versão publicada (3.10.0).

   No repositório, a CSP do index.html e a do _headers trazem
   script-src 'self' 'unsafe-inline': toda a app vive em <script> embutidos, e
   assim pode ser editada e servida localmente sem passo nenhum.

   Na versão publicada, este script troca o 'unsafe-inline' pelo hash SHA-256
   de cada <script> embutido, no <meta> do dist/index.html e no dist/_headers.
   O browser passa a executar SÓ esses blocos, exactamente como estão: um
   <script> injectado na página (por uma falha de escape, por exemplo) já não
   corre. Os hashes são do conteúdo de cada bloco, pelo que mudar o <meta> não
   os altera.

   Chamado por scripts/publicar.sh, sobre a pasta dist/. Verificado por
   tests/publicacao.test.js e, num browser, por tests/smoke-csp.mjs.

   Uso:  node scripts/csp.mjs <pasta>   (por omissão, dist) */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const pasta = path.resolve(process.argv[2] || "dist");
const fHtml = path.join(pasta, "index.html");
const fHeaders = path.join(pasta, "_headers");
let html = fs.readFileSync(fHtml, "utf8");
let headers = fs.readFileSync(fHeaders, "utf8");

/* Todos os <script> embutidos (sem src), abertos no início de uma linha. */
const hashes = [];
for (const m of html.matchAll(/^<script>([\s\S]*?)<\/script>/gm))
  hashes.push("'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'");
const total = (html.match(/<script\b/g) || []).length;
/* Um <script> que este padrão não apanhe (com atributos, ou a meio de uma
   linha) ficaria sem hash e deixaria de correr na versão publicada: falha já,
   em vez de publicar uma app partida. Os «<script>» citados em comentários
   HTML não são tags, mas contam aqui; descontam-se os que estão em comentários. */
const emComentarios = [...html.matchAll(/<!--[\s\S]*?-->/g)]
  .reduce((n, c) => n + (c[0].match(/<script\b/g) || []).length, 0);
if (!hashes.length || hashes.length !== total - emComentarios) {
  console.error(`csp: ${total - emComentarios} <script> no index.html, ${hashes.length} com hash. ` +
    "Todos os <script> embutidos têm de abrir no início de uma linha e sem atributos.");
  process.exit(1);
}

const ANTES = "script-src 'self' 'unsafe-inline'";
const DEPOIS = "script-src 'self' " + hashes.join(" ");
for (const [nome, texto] of [["index.html", html], ["_headers", headers]]) {
  if (texto.split(ANTES).length !== 2) {
    console.error(`csp: o ${nome} devia ter exactamente uma vez «${ANTES}».`);
    process.exit(1);
  }
}
html = html.replace(ANTES, DEPOIS);
headers = headers.replace(ANTES, DEPOIS);
fs.writeFileSync(fHtml, html);
fs.writeFileSync(fHeaders, headers);
console.log(`csp: ${hashes.length} <script> autorizados por hash; 'unsafe-inline' retirado do script-src.`);
