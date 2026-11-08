#!/usr/bin/env bash
# Prepara a pasta que o Cloudflare Pages publica (3.7.0).
#
# Copia para dist/ SÓ os ficheiros da aplicação. Sem isto, o Cloudflare
# publicaria o repositório inteiro — testes, CHANGELOG, SECURITY.md, a CI —,
# tudo acessível pelo endereço da app.
#
# A lista é a do service worker (ASSETS em sw.js), e tests/publicacao.test.js
# verifica que as duas não divergem. (Até 3.22.0 ia também o _headers, com os
# cabeçalhos HTTP do Cloudflare Pages; deixou de ser preciso.)
#
# No Cloudflare Pages:  comando de build = bash scripts/publicar.sh
#                       pasta de saída   = dist
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/icons dist/vendor
cp index.html sw.js manifest.json guia.html dist/
cp icons/icon-192.png icons/icon-512.png icons/icon-512-maskable.png dist/icons/
cp vendor/xlsx.full.min.js dist/vendor/
# 3.10.0: na versão publicada, a CSP autoriza cada <script> pelo seu hash e
# deixa de ter 'unsafe-inline' (ver scripts/csp.mjs). Precisa de Node, que a
# imagem de build do Cloudflare Pages traz. Sem ele, a publicação falha aqui e
# fica no ar a versão anterior — nunca uma sem a CSP apertada.
node scripts/csp.mjs dist
echo "dist/ pronta:"; (cd dist && find . -type f | sort)
