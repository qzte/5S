#!/usr/bin/env bash
# Prepara a pasta a publicar num alojamento com passo de build (3.7.0).
#
# Copia para dist/ SÓ os ficheiros da aplicação. Sem isto, o alojamento
# publicaria o repositório inteiro — testes, CHANGELOG, SECURITY.md, a CI —,
# tudo acessível pelo endereço da app.
#
# A lista é a do service worker (ASSETS em sw.js), e tests/publicacao.test.js
# verifica que as duas não divergem. (Até 3.22.0 ia também o _headers, com os
# cabeçalhos HTTP do alojamento; deixou de ser preciso.)
#
# No alojamento:  comando de build = bash scripts/publicar.sh
#                 pasta de saída   = dist
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/icons dist/vendor
cp index.html sw.js manifest.json guia.html dist/
cp icons/icon-192.png icons/icon-512.png icons/icon-512-maskable.png dist/icons/
cp vendor/xlsx.full.min.js vendor/html2canvas.min.js vendor/jspdf.umd.min.js dist/vendor/
# 3.10.0: na versão publicada, a CSP autoriza cada <script> pelo seu hash e
# deixa de ter 'unsafe-inline' (ver scripts/csp.mjs). Precisa de Node, que a
# imagem de build do alojamento traz. Sem ele, a publicação falha aqui e
# fica no ar a versão anterior — nunca uma sem a CSP apertada.
node scripts/csp.mjs dist
echo "dist/ pronta:"; (cd dist && find . -type f | sort)
