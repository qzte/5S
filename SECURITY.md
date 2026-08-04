# Auditoria de segurança · Auditoria 5S

Duas revisões, por ordem inversa:

- **[Revisão de 3.5.0](#revisão-de-350-2026-08-04)** — correcções em **3.5.1**.
- **[Revisão de 3.1.0](#revisão-de-310-2026-07-31)** — correcções em 3.1.1 e 3.1.2.

Âmbito de ambas: `index.html` (aplicação e SheetJS embutido), `sw.js`,
`manifest.json`, `tests/`, a CI e a configuração do repositório.

---

# Revisão de 3.5.0 (2026-08-04)

Segunda revisão, centrada no que mudou desde a primeira: a edição de auditorias
gravadas (3.3.0), a reatribuição de responsáveis por pergunta (3.4.0) e,
sobretudo, a **lista editável de responsáveis** (3.5.0). Esta última é a
alteração com consequências de segurança, porque transforma um conjunto fechado
de cinco chaves escritas no código num conjunto **aberto, escrito pelo
utilizador e persistido** — e essas chaves são usadas como índices de objectos e
como valores de atributos HTML.

## Resumo

| # | Gravidade | Assunto | Estado |
| --- | --- | --- | --- |
| 12 | Média | Código de responsável herdado do protótipo (`constructor`) chegava ao relatório e prendia a remoção | **Corrigido em 3.5.1** |
| 13 | Média | `localStorage` com JSON válido mas de forma errada derrubava o arranque | **Corrigido em 3.5.1** |
| 14 | Baixa | `localStorage` cheio: auditoria perdida em silêncio ao Guardar | **Corrigido em 3.5.1** |
| 15 | Baixa | Listas importadas sem tecto (responsáveis, perguntas, auditorias) | **Corrigido em 3.5.1** |
| 16 | Baixa | Código de responsável `__proto__` era aceite e desaparecia | **Corrigido em 3.5.1** |
| 17 | Baixa | «Substituir tudo» na importação apagava todo o histórico sem código de acesso | **Corrigido em 3.5.1** |
| 18 | Info | SheetJS 0.20.3 continua sem CVE por corrigir (alerta do Snyk é falso positivo) | Verificado |
| 19 | Info | `clean()` não remove caracteres bidireccionais | Aceite, documentado |
| 20 | Info | *Actions* da CI fixadas por etiqueta e não por SHA | Aceite, documentado |

**Continua sem XSS explorável.** Foram revistas uma a uma as interpolações
acrescentadas desde 3.1.2 — o selector de responsável por pergunta
(`data-edresp`), o cartão de responsáveis em Configuração (`data-respn`,
`data-resprm`) e os blocos de recomendação indexados pelo código do responsável
(`data-rec`, `data-file`, `data-add`, `data-rmf`, `data-foto`). Todas passam por
`esc()`, incluindo os valores de atributo, e o único selector CSS construído a
partir de uma chave escrita pelo utilizador (`recsHTML`/`wireRecs`) usa
`CSS.escape()`. Os restantes selectores interpolam índices numéricos.

---

## 12. Código de responsável herdado do protótipo (Média)

`RESP` e `recs` são objectos literais. Até 3.5.0 as chaves eram cinco constantes
do código, pelo que ler `recs[k]` era seguro por construção. Em 3.5.0 o código
do responsável passou a ser escrito pelo utilizador em Configuração (12
caracteres, à escolha) — e `recsOf()` continuou a ler por índice directo:

```js
respKeys().forEach(k=>{out[k]=clean(src[k],600);});   // antes de 3.5.1
```

Com um responsável de código `constructor` (ou `toString`, `valueOf`,
`hasOwnProperty`) e uma auditoria **sem recomendação escrita**, `src[k]` devolve
a propriedade **herdada** do protótipo. Verificado no Chromium: o relatório
imprime, no bloco desse responsável,

```
function Object() { [native code] }
```

tanto na caixa de texto como na versão impressa — e fica **gravado** em
`localStorage` na primeira vez que alguém toque no campo, porque `wireRecs()`
grava o resultado de `recsOf()`.

O efeito de segundo grau é pior do que o texto: `respEmUso()` lia o mesmo valor
e concluía que havia uma recomendação escrita em **todas** as auditorias. Como
um responsável em uso não pode ser removido, o responsável ficava **preso para
sempre**, com uma mensagem a apontar auditorias onde ninguém escreveu nada.

Não é XSS — o valor é escapado no render — mas é leitura do protótipo a chegar
ao ecrã, a ficar persistida e a bloquear uma operação. É exactamente a classe de
defeito que a guarda `isResp()` fechou em 3.1.1 (ponto 2), reaberta por outro
caminho quando as chaves deixaram de ser fixas.

**Correcção:** função `recTexto(recs,k)`, porta única de `recsOf()` e de
`respEmUso()`, com `Object.prototype.hasOwnProperty.call()` antes de ler.
Regressões em `tests/responsaveis.test.js`.

## 13. `localStorage` com a forma errada derrubava o arranque (Média)

A correcção de 3.1.1 (ponto 7) pôs um `try` à volta do `JSON.parse`, e fechou o
caso do valor que **não faz parse**. Ficou de fora o valor que faz parse e tem a
**forma** errada:

```js
let services=load("services",["UCIP (11120)"]);   // "\"xpto\"" -> uma string
```

`services.map` deixa de existir e a excepção sobe antes do primeiro render.
Verificado no Chromium, com o `localStorage` semeado a partir de outra página:

| Chave semeada | Resultado antes de 3.5.1 |
| --- | --- |
| `services` = `"xpto"` | `TypeError: services.map is not a function` · **0 itens desenhados** |
| `itemsCfg` = `42` | `TypeError: load(...).map is not a function` · **0 itens desenhados** |
| `audits` = `{"a":1}` | arranca, mas o histórico rebenta ao abrir |

O desfecho é o mesmo que o ponto 7 foi buscar — página em branco, e o service
worker a servir essa mesma página partida offline — e é alcançável exactamente
pelo mesmo caminho: qualquer outra página em `qzte.github.io` escreve nestas
chaves (ponto 9). Não requer sequer intenção: um projecto vizinho que use a
chave `services` para outra coisa basta.

**Correcção:** `loadArr(k,d)`, que devolve o valor por omissão quando o que está
guardado não é um array. Todas as chaves desta aplicação são listas. Aplicado a
`audits`, `services`, `people` e `itemsCfg`; `resps` já estava coberto por
`sanitizeResps()`. Verificado no Chromium: as três linhas da tabela acima passam
a arrancar com os 19 itens e sem erro na consola.

## 14. `localStorage` cheio: auditoria perdida em silêncio (Baixa)

```js
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));   // antes de 3.5.1
```

`setItem` **lança** `QuotaExceededError` quando a origem enche (~5 MB,
partilhados com tudo o que esteja publicado no mesmo domínio — ponto 9). Sem
`try`, a excepção subia do `onclick` de Guardar. Verificado no Chromium com o
`localStorage` saturado a partir de outra chave: preencher a auditoria toda e
carregar em **Guardar auditoria** não grava nada, não abre o relatório e **não
mostra mensagem nenhuma** — o botão parece morto e o trabalho da auditoria
perde-se assim que a página fecha.

**Correcção:** `save()` apanha a excepção, devolve se gravou e avisa uma vez por
acção (a importação grava quatro chaves seguidas). Quem grava a auditoria
verifica o resultado: em caso de falha **o formulário não é limpo** — o que está
escrito é a única cópia que existe — e a lista em memória volta atrás, para não
mostrar no histórico um registo que o disco não tem. O aviso diz o que fazer:
exportar e apagar auditorias antigas.

## 15. Listas importadas sem tecto (Baixa)

`sanitizeResps()`, `sanitizeItems()` e o ciclo das auditorias em `importJson()`
aceitavam listas de qualquer dimensão. Um ficheiro com 10 000 responsáveis dá
10 000 eixos de radar e 10 000 blocos de recomendação a desenhar de uma vez;
10 000 perguntas dão um formulário que não termina de pintar. O ficheiro é
escolhido pelo utilizador, pelo que isto é sobretudo uma protecção contra o
engano — mas o custo de a ter é uma linha por porta.

**Correcção:** `MAX_RESPS` (60), `MAX_ITEMS` (500) e `MAX_AUDITS` (5000). Cada
um está uma ordem de grandeza acima do maior caso plausível, e o diálogo da
importação diz quantas auditorias foram ignoradas por truncatura.

## 16. Código de responsável `__proto__` (Baixa)

`sanitizeResps()` aceitava `__proto__` como código. Não há poluição de protótipo
— atribuir uma **string** a `RESP.__proto__` é ignorado em silêncio pelo motor —
mas o responsável ficava gravado em `resps` e **nunca chegava à lista**: o
utilizador via a confirmação «Responsáveis guardados: …» e a entrada desaparecia
do ecrã a seguir, e qualquer pergunta que lhe apontasse caía no responsável de
recurso sem explicação.

**Correcção:** recusado à entrada, que é onde se pode dizer porquê. Os restantes
nomes do protótipo (`constructor`, `toString`) continuam a ser códigos válidos —
depois de atribuídos são propriedades próprias, e o ponto 12 fechou a leitura.

## 17. «Substituir tudo» sem código de acesso (Baixa)

Desde 3.3.1 apagar **uma** auditoria pede o código de acesso, com a
justificação, escrita no próprio ficheiro, de que «apagar é a mais definitiva
das alterações ao histórico». A importação em modo **S** apaga-as **todas** de
uma vez, é igualmente irreversível, e era a única porta destrutiva que não o
pedia — bastava escolher um ficheiro e escrever `S`.

**Correcção:** `pedirPin()` também aí, a seguir à confirmação. Continua a não
ser um controlo de segurança (ponto 10): é a mesma protecção contra o gesto
distraído que as outras portas já tinham, agora aplicada de forma coerente.

## 18. SheetJS 0.20.3 (Info)

Confirmado em execução que a biblioteca embutida é de facto a que o comentário
diz (`XLSX.version === "0.20.3"`) e que o `Object.prototype` já não fica
congelado depois de importar. Não há CVE por corrigir nesta versão: a
CVE-2023-30533 foi corrigida em 0.19.3 e a CVE-2024-22363 em 0.20.2. O alerta
`SNYK-JS-XLSX-6252523` que ainda aparece contra `xlsx@0.20.3` refere-se à
correcção que só existe na distribuição oficial (`cdn.sheetjs.com`) e é, para
esta cópia, um falso positivo — a mesma razão pela qual o pacote `xlsx` no npm,
congelado em 0.18.5, torna qualquer auditoria por npm cega a este componente.

## 19. `clean()` não remove caracteres bidireccionais (Info)

`clean()` remove caracteres de controlo `C0`/`DEL` e limita o comprimento, mas
deixa passar as marcas bidireccionais (U+202E e afins) e os espaços de largura
zero. Um nome de serviço ou de responsável pode, com isso, aparecer no relatório
com o texto visualmente invertido. Não afecta a pontuação nem escapa ao `esc()`;
fica registado por ser um vector de **engano visual** num documento que se
imprime e se assina. Não corrigido: os nomes são escritos por quem usa a
aplicação, no próprio dispositivo, e filtrar categorias inteiras de Unicode tem
o seu próprio custo em nomes legítimos.

## 20. CI fixada por etiqueta (Info)

`.github/workflows/ci.yml` usa `actions/checkout@v4` e `actions/setup-node@v4`.
Uma etiqueta é móvel: quem controlar o repositório da acção pode mudar o que ela
aponta. O risco concreto aqui é pequeno — as permissões estão em
`contents: read`, não há segredos no fluxo de trabalho e não se usa
`pull_request_target` — mas fixar por SHA é a prática recomendada e custa uma
linha. Fica como recomendação, não como correcção: o Playwright já está fixado
em versão exacta pela mesma razão, e a incoerência é só de grau.

## O que foi verificado e continua bem

- As portas de entrada de dados de ficheiro continuam a ser três, e únicas:
  `sanitizeAudit()`, `sanitizeItems()` e, desde 3.5.0, `sanitizeResps()`.
- Nenhum `eval`, `new Function`, `document.write` ou `srcdoc`; nenhum handler
  inline acrescentado desde a revisão anterior.
- O único selector CSS construído a partir de texto do utilizador usa
  `CSS.escape()`; todos os outros interpolam índices numéricos.
- As fotografias das recomendações continuam a viver só em memória e a não
  entrar no `localStorage` nem na exportação.
- A guarda contra clickjacking e a allowlist do service worker mantêm-se como
  ficaram em 3.1.2, e a CSP não foi relaxada.
- A suite passa: 85 testes unitários e três smoke tests de browser.

---

# Revisão de 3.1.0 (2026-07-31)

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
| 3 | Média | SheetJS 0.18.5 — CVE-2024-22363 (ReDoS) | **Corrigido em 3.1.2** |
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

## 3. SheetJS 0.18.5 — CVE-2024-22363, ReDoS (Média)

A CVE-2023-30533 (prototype pollution) **está** mitigada: `importExcel()`
congela `Object.prototype` antes de `XLSX.read()`, o que faz falhar a escrita.
Confirmado no código.

Já a **CVE-2024-22363** (expressão regular com retrocesso catastrófico,
corrigida em 0.20.2) não tinha mitigação possível sem actualizar a biblioteca:
abrir um `.xlsx` preparado para o efeito bloqueava o separador.

**Corrigido em 3.1.2:** o SheetJS embutido passou a **0.20.3**, que fecha as
duas CVE. A biblioteca veio de `cdn.sheetjs.com`, hoje a única via de
distribuição — o pacote `xlsx` no npm ficou congelado em 0.18.5, o que torna
qualquer auditoria de dependências por npm cega a este componente.

Com a actualização, **a mitigação do `Object.freeze(Object.prototype)` foi
removida**: existia só para travar a CVE-2023-30533 numa versão que não podia
ser actualizada, era irreversível e global à página, e mantê-la por hábito
custaria essa restrição sem contrapartida.

Verificado no Chromium com um `.xlsx` real de duas folhas: `XLSX.version`
devolve `0.20.3`, a importação traz os serviços e as pessoas esperados, e o
`Object.prototype` já não fica congelado depois de importar.

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
