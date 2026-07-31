# Auditoria de segurança · Auditoria 5S

Revisão da versão **3.1.0**, correcções aplicadas em **3.1.1** e **3.1.2**
(2026-07-31).
Âmbito: `index.html` (aplicação e SheetJS embutido), `sw.js`, `manifest.json`
e a configuração do repositório.

## Modelo de ameaça

A aplicação é estática, sem servidor e sem rede: não há autenticação, sessões,
nem dados em trânsito. Isso elimina de partida a maior parte do OWASP Top 10
(injecção SQL, SSRF, controlo de acessos, falhas criptográficas em trânsito).
O que resta são três superfícies reais:

1. **Ficheiros importados** — JSON de histórico, JSON de perguntas e Excel.
   São a única entrada de dados não escritos pelo próprio utilizador e o único
   vector plausível de XSS ou corrupção de estado.
2. **A origem partilhada** — em `qzte.github.io`, o `localStorage` e o âmbito
   de cookies pertencem ao domínio inteiro, não a `/5S/`.
3. **O service worker** — o que entra em cache é servido a partir daí
   indefinidamente, incluindo offline.

## Resumo

| # | Gravidade | Assunto | Estado |
| --- | --- | --- | --- |
| 1 | Média | `itemsCfg` importado era gravado sem validação | **Corrigido em 3.1.1** |
| 2 | Média | Guarda de responsável aceitava chaves do protótipo | **Corrigido em 3.1.1** |
| 3 | Média | SheetJS 0.18.5 — CVE-2024-22363 (ReDoS) | Aceite, ver nota |
| 4 | Baixa | `frame-ancestors` em `<meta>` não é aplicado | **Mitigado em 3.1.2** |
| 5 | Baixa | `gitignore` sem ponto — regras nunca aplicadas | **Corrigido em 3.1.1** |
| 6 | Baixa | Suite de testes não corria (ficheiros na raiz) | **Corrigido em 3.1.1** |
| 7 | Baixa | `localStorage` corrompido derrubava o arranque | **Corrigido em 3.1.1** |
| 8 | Baixa | SW: allowlist não se aplicava às navegações | **Corrigido em 3.1.1** |
| 9 | Info | `localStorage` é partilhado por toda a origem | Aceite, documentado |
| 10 | Info | PIN do editor no código público | Aceite, já documentado |
| 11 | Info | `'unsafe-inline'` em `script-src` | Aceite (ficheiro único) |

**Não foi encontrado nenhum XSS explorável.** Todas as interpolações em
`innerHTML` que envolvem dados do utilizador passam por `esc()`, não há
handlers inline, e a única `src` de imagem não escapada (`REC_FOTOS`) é um data
URI produzido localmente por `<canvas>`, nunca texto vindo de ficheiro.

---

## 1. `itemsCfg` importado era gravado sem validação (Média)

`importJson()` gravava as perguntas do ficheiro directamente:

```js
save("itemsCfg", data.itemsCfg);   // antes de 3.1.1
```

Era o **único** caminho de entrada que contornava a normalização: `edImport()`
limpava `p`, `r`, `t` e `c`, e `sanitizeAudit()` também, mas este não. Os
valores ficavam persistidos em bruto — `normItem()`, aplicado em `loadItems()`,
só toca no tipo, nos limiares e no máximo, e nunca valida pilar, responsável
nem texto.

Não dá XSS, porque o render escapa tudo. Dá corrupção do modelo de pontuação,
que num instrumento de auditoria é o que interessa:

- `p` fora de intervalo → o item não aparece em nenhum eixo de `byPillar()`, e
  o radar por pilar passa a descrever uma auditoria que não é a que foi feita;
- `r` desconhecido → o item desaparece de `byResp()`, falseando a nota por
  responsável sem qualquer aviso;
- `c`/`t` sem limite de comprimento → enche o `localStorage` da origem.

**Correcção:** extraída a função `sanitizeItems()`, agora porta única partilhada
por `edImport()` e por `importJson()`. Testes em `tests/perguntas.test.js`.

## 2. A guarda de responsável aceitava chaves herdadas do protótipo (Média)

Em `edImport()` e em `sanitizeAudit()`:

```js
r: RESP[x.r] ? x.r : "U"
```

`RESP` é um objecto literal, portanto `RESP["constructor"]`, `RESP["toString"]`
e `RESP["valueOf"]` são todos *truthy* — a guarda deixava-os passar. Verificado
no browser: com `r: "constructor"`, o formulário renderizava

```
Resp.: function Object() { [native code] }
```

Escapado, logo sem XSS, mas é leitura do protótipo a chegar ao ecrã, e o item
ficava fora de `byResp()` (o mesmo efeito do ponto 1).

**Correcção:** guarda `isResp()` com `Object.prototype.hasOwnProperty.call()`,
usada nos dois sítios. Como o `localStorage` pode já ter sido contaminado por
uma importação anterior a 3.1.1, `normItem()` — passagem obrigatória de
`loadItems()` — passou também a normalizar `p` e `r`, pelo que o estado se
repara sozinho no arranque seguinte. Verificado no browser com um `itemsCfg`
contaminado escrito directamente no `localStorage`.

## 3. SheetJS 0.18.5 — CVE-2024-22363, ReDoS (Média, aceite)

A CVE-2023-30533 (prototype pollution) **está** mitigada: `importExcel()`
congela `Object.prototype` antes de `XLSX.read()`, o que faz falhar a escrita.
Confirmado no código.

Já a **CVE-2024-22363** (expressão regular com retrocesso catastrófico,
corrigida em 0.20.2) não tem mitigação possível sem actualizar a biblioteca:
abrir um `.xlsx` preparado para o efeito bloqueia o separador. O impacto é
local e requer que o utilizador escolha o ficheiro — nenhum dado sai do
dispositivo e nada é executado. Não justifica alterar o modelo de distribuição,
mas **fica em aberto**: a resolução é actualizar o SheetJS embutido para ≥ 0.20.2.

Nota sobre a mitigação existente: `Object.freeze(Object.prototype)` é
irreversível e global à página. É aceitável nesta aplicação, que não estende o
protótipo nem carrega código de terceiros, mas é uma restrição a lembrar antes
de acrescentar qualquer biblioteca.

## 4. `frame-ancestors` numa CSP em `<meta>` não é aplicado (Baixa)

Os browsers ignoram `frame-ancestors`, `report-uri` e `sandbox` quando a CSP
vem por `<meta http-equiv>` — só valem em cabeçalho HTTP. O README listava-a
como controlo activo; na prática **não há proteção contra clickjacking**. O
GitHub Pages não permite definir cabeçalhos, pelo que a directiva se mantém
(útil se algum dia for servida de outro lado) e o README passa a dizer o que
ela é. As restantes directivas (`object-src`, `base-uri`, `connect-src`,
`form-action`) funcionam por `<meta>` e continuam a valer.

**Mitigado em 3.1.2** com uma guarda em JS no `<head>`, que corre antes de o
`<body>` existir: se `window.top !== window.self`, o documento é esvaziado e
substituído por uma linha de texto e uma ligação para abrir a aplicação em
janela própria. Não se tenta `top.location` — entre origens o browser bloqueia
a escrita, e a tentativa falharia em silêncio, dando a ilusão de defesa.

Não substitui o cabeçalho: quem controla a moldura pode servir a app a partir
de uma cópia sua, sem a guarda. O que esta impede é o cenário real — enganar o
utilizador a clicar em controlos da instalação legítima. Verificado no
Chromium: sem moldura a app arranca com os 19 itens; dentro de um `iframe` não
fica visível um único elemento da aplicação.

## 5. `gitignore` sem ponto (Baixa)

O ficheiro estava commitado como `gitignore`, não `.gitignore`, pelo que **nenhuma
das regras estava a ser aplicada** — incluindo as que existem precisamente para
impedir que dados exportados entrem no repositório:

```
auditorias5s_*.json
perguntas5s_*.json
*.xlsx
```

Esses ficheiros contêm nomes de colaboradores (Picking, Repositor, Verificador),
isto é, dados pessoais num repositório público. Nada foi commitado até hoje; a
protecção é que não existia. **Corrigido:** renomeado para `.gitignore`.

## 6. A suite de testes não corria (Baixa)

`harness.js` faz `require` de `../index.html`, mas os ficheiros de teste estavam
na raiz — `node --test tests/` não encontrava nada e correr os testes na raiz
falhava com `ENOENT`. Na prática, **as regressões que protegem `sanitizeAudit()`
não estavam a ser executadas**, e são elas que garantem que a importação não
volta a perder campos. **Corrigido:** ficheiros movidos para `tests/`, suite a
passar (37 testes).

## 7. `localStorage` corrompido derrubava o arranque (Baixa)

```js
const load = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
```

Sem `try`, qualquer valor não-JSON numa das chaves lançava antes do primeiro
render: página em branco, e o service worker a servir a mesma página partida
offline. Combinado com o ponto 9 (origem partilhada), bastava outra página em
`qzte.github.io` escrever numa chave com o mesmo nome. **Corrigido:** `load()`
recai no valor por omissão em vez de lançar.

## 8. Service worker: a allowlist não se aplicava às navegações (Baixa)

O ramo `req.mode === "navigate"` gravava em `./index.html` qualquer resposta
200 da própria origem, sem consultar `ALLOWED` — ao contrário do que o
comentário do ficheiro afirmava. Dentro do scope `/5S/` o risco é pequeno, mas
qualquer URL que o servidor resolvesse com 200 passava a ser o documento
servido offline. **Corrigido:** a allowlist passa a valer também aí, comparando
sem query string.

## 9. `localStorage` é partilhado por toda a origem (Info)

`qzte.github.io/5S/` partilha origem com **todos** os outros projectos
publicados na mesma conta GitHub. O `localStorage` é por origem, não por
caminho: qualquer outra página em `qzte.github.io` lê e escreve as auditorias,
os serviços e as pessoas guardadas por esta aplicação.

A afirmação do README de que "nenhum dado sai do dispositivo" continua correcta.
A que precisa de ressalva é o isolamento: dentro do dispositivo, os dados não
estão isolados de outro código da mesma conta. Se isso importar, a solução é um
domínio próprio.

## 10. PIN do editor (Info)

`ADMIN_PIN = "3758"` está no código público, e o próprio ficheiro já o diz com
todas as letras: serve contra alterações acidentais, não é um controlo de
segurança. Concordo com a análise e com a decisão. A única recomendação é
prática: não reutilizar este PIN em mais lado nenhum, por estar publicado.

## 11. `'unsafe-inline'` em `script-src` (Info)

Inerente à decisão de ficheiro único, e o custo está assumido no README. Vale a
pena registar o que o torna aceitável: não há um único sink por onde injectar
script (zero handlers inline, `esc()` em toda a interpolação, nenhum
`document.write`, `eval` ou `new Function`), e `connect-src 'self'` impede
exfiltração mesmo que houvesse. Se um dia se quiser fechar, o caminho é hashes
`sha256` dos blocos, recalculados a cada alteração.

## Nota de empacotamento (fora do âmbito da segurança)

`manifest.json` referenciava `./icons/icon-192.png`, `icon-512.png` e
`icon-512-maskable.png`, que não existiam no repositório: o smoke test
registava 404 e o `install` do service worker falhava nesses recursos (sem
consequências, graças ao `allSettled`). Não era um problema de segurança, mas
afectava a instalação como PWA. **Resolvido em 3.1.2**: os três ícones foram
gerados e acrescentados, e o smoke test deixou de registar 404.

## O que foi verificado e está bem

- Todas as 18 utilizações de `innerHTML` e as 2 de `insertAdjacentHTML` foram
  revistas uma a uma: os dados do utilizador passam sempre por `esc()`.
- Nenhum `eval`, `new Function`, `document.write` ou `srcdoc`.
- Nenhum recurso externo, CDN ou fonte remota; `referrer` a `no-referrer`.
- Nenhum objecto do utilizador serializado para dentro de atributos HTML — o
  histórico e o editor ligam por índice e `addEventListener`.
- As fotos das recomendações vivem só em memória e não entram no `localStorage`
  nem na exportação JSON, tal como documentado.
- `sanitizeAudit()` valida a data por regex, satura `scores`, descarta `tgts`
  inválidos valor a valor e normaliza `recs` para as quatro chaves conhecidas.
- O `manifest.json` não pede permissões e o SW não regista `push` nem `sync`.
