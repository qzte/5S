<!--
  Auditoria 5S · Supermercados Kaizen — README
  Versão: 4.5.1 (Semantic Versioning — MAJOR.MINOR.PATCH)
  Repositório: https://github.com/qzte/5S
  Nota: este ficheiro é documentação. Não altera comportamento, formato de dados
        nem API, pelo que acompanha a versão do código em vez de a incrementar.
-->

# Auditoria 5S · Supermercados Kaizen

**Versão 4.5.1** · [Changelog](CHANGELOG.md) · [Semantic Versioning](https://semver.org/lang/pt-BR/)

Lista de verificação 5S para supermercados, em aplicação web de **ficheiro único**:
auditoria, histórico, análise, relatório imprimível em PDF e editor de perguntas.
Funciona **100 % offline**, instalável como PWA, e **nenhum dado sai do dispositivo**.

- **Aplicação:** https://qzte.github.io/5S/ (GitHub Pages, publicada a partir da `main`)
- **Código:** https://github.com/qzte/5S
- **Guia de utilização:** [GUIA.md](GUIA.md) — como usar a app no dia-a-dia, para quem audita.
  Também está dentro da app, em *Config → Ajuda* (3.16.0). Este README é a documentação técnica.

## Índice

- [Funcionalidades](#funcionalidades)
- [Novidades desde 3.8](#novidades-desde-38)
- [Instalação e utilização](#instalação-e-utilização)
- [Modelo de pontuação](#modelo-de-pontuação)
- [Limiares por pergunta](#limiares-por-pergunta)
- [Responsáveis](#responsáveis)
- [Editar auditorias anteriores](#editar-auditorias-anteriores)
- [Indicadores do ano](#indicadores-do-ano-400)
- [KPIs e métricas](KPIS.md) — todos os indicadores, as fórmulas e a sua avaliação
- [Caixas de diálogo](#caixas-de-diálogo)
- [Evidência por pergunta](#evidência-por-pergunta)
- [Plano de acção](#plano-de-acção)
- [Dados e privacidade](#dados-e-privacidade)
- [Depois da auditoria](#depois-da-auditoria-3230)
- [Auditar no telemóvel, finalizar no PC](#auditar-no-telemóvel-finalizar-no-pc-3250)
- [Relatório mensal](#relatório-mensal-3200)
- [Importação de Excel](#importação-de-excel)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Testes](#testes)
- [Segurança](#segurança)
- [Versionamento](#versionamento)
- [Licença](#licença)

## Funcionalidades

| Vista | O que faz |
| --- | --- |
| **Nova auditoria** | 19 itens (3 deles por amostra), nota calculada em tempo real, cabeçalho com serviço (numa só caixa onde se **pesquisa** pelo nome ou pelo código, na lista e nas auditorias já feitas, 4.2.0 e 4.2.1), data, Picking, Repositor, Verificador e observação. Em cada pergunta, o que a última auditoria ao serviço lhe deu, se não foi Excelente; nas que ficam Mau ou Oportunidade, **nota e foto de evidência**. Mostra as **acções em aberto** para fechar no terreno. Gravada a cada alteração como **rascunho**, que sobrevive a um separador fechado. Data em hora local, e aviso antes de gravar uma segunda auditoria ao mesmo serviço no mesmo dia (3.22.0). |
| **Histórico** | Todas as auditorias guardadas, filtráveis por serviço, datas e faixa de nota, com a variação face à anterior ao mesmo serviço; edição (sob PIN) e remoção (com *Desfazer*). Diz se cada auditoria já foi **enviada** ou está **por enviar** (3.23.0). |
| **Análise** | Os [indicadores do ano](#indicadores-do-ano-400): média total e serviços abaixo dela, objectivo anual e média semanal, internos e externos auditados (4.0.0). Evolução da nota (uma linha por serviço, no tempo), comparação entre serviços, radar por pilar 5S e radar por responsável — filtrável por serviço e período, em SVG nativo, sem bibliotecas de gráficos. E o **relatório mensal**, de todos os serviços, para imprimir em PDF (3.20.0). |
| **Acções** | O plano de acção de todos os serviços: resumo, filtros por estado, responsável e serviço, as em atraso primeiro; marcar como feita e abrir o relatório de origem (3.21.0). |
| **Relatório** | Três folhas imprimíveis: resumo com radares e histórico do serviço, grelha completa dos itens, e recomendações por responsável com foto e texto. Mais as **Evidências** e o **plano de acção**, cada uma numa folha, quando os há. No ecrã, também os itens a melhorar e o seguimento face à auditoria anterior, e no topo o cartão [Depois da auditoria](#depois-da-auditoria-3230): cópia de segurança pelo menu de partilha, **PDF** criado pela app (com o nome do serviço e da data) e envio **por email ou para o Teams** (3.23.0, 3.24.0). |
| **Configuração** | Serviços e o **tipo** de cada um (interno ou externo), o **objectivo anual** de auditorias, responsáveis, cópia de segurança (com ou sem fotos, descarregada ou partilhada) e importação de `.json` ou `.txt`, exportação e importação de Excel, espaço ocupado e estado do armazenamento, **código de acesso** próprio, editor de perguntas e a pasta do **painel e-ink**. |

Segue o **modo escuro** do sistema no ecrã (a impressão é sempre clara), e todas
as vistas passam as regras WCAG 2 AA que o axe-core verifica — contraste,
rótulos dos campos, títulos — nos dois modos (3.10.0).

## Novidades desde 3.8

O que mudou desde a 3.7.0, por tema. Cada
linha aponta para a secção que o explica; o pormenor de cada versão está no
[CHANGELOG](CHANGELOG.md), e o uso no dia-a-dia no [guia](GUIA.md).

| Tema | Novidade | Versão |
| --- | --- | --- |
| **Não perder dados** | Auditoria por terminar gravada a cada alteração; aviso ao sair a meio de uma edição | 3.8.0 |
| | Pedido de armazenamento persistente; lembrete de cópia de segurança | 3.8.0 |
| | Fotos das recomendações guardadas (antes perdiam-se ao sair do relatório) | 3.9.0 |
| | Perguntas gravadas uma vez por conjunto: cabem 5 000 auditorias (enchia por volta das 1 700) | 3.11.0 |
| | *Desfazer* ao apagar uma auditoria | 3.13.0 |
| | [Cópia de segurança com fotos](#dados-e-privacidade) | 3.14.0 |
| | Lembrete das fotos por copiar; *Desfazer* ao remover um serviço ou uma pessoa | 3.18.0 |
| | Código de acesso próprio do dispositivo; espaço ocupado com as fotos | 3.19.0 |
| | Partilhar a cópia com fotos pelo menu de partilha do telemóvel | 3.20.0 |
| | Cópia com fotos pelo menu de partilha no fim de cada auditoria; importar `.json` ou `.txt` | 3.24.0 |
| **Auditar** | Seguimento da auditoria anterior, no formulário e no relatório | 3.9.0 |
| | [Plano de acção](#plano-de-acção): acções com responsável, prazo e estado | 3.12.0 |
| | Frequência e prazos por serviço (retirados em 4.0.0) | 3.13.0 |
| | [Evidência por pergunta](#evidência-por-pergunta): nota e foto | 3.14.0 |
| | Data da auditoria em hora local; aviso de auditoria repetida; «Remover foto» só com foto | 3.22.0 |
| **Consultar** | Histórico com filtros e variação; Análise por serviço e período; exportação para Excel | 3.9.0 |
| | Histórico e Análise rápidos com milhares de auditorias | 3.15.0 |
| | Página de KPIs no painel e-ink | 3.17.0 |
| | [Relatório mensal](#relatório-mensal-3200) para a direcção | 3.20.0 |
| | Separador **Acções**: o plano de acção de todos os serviços | 3.21.0 |
| | PDF com o nome do serviço e da data | 3.22.0 |
| | [Depois da auditoria](#depois-da-auditoria-3230): cópia, PDF criado pela app, envio por email ou Teams | 3.23.0 |
| | [Indicadores do ano](#indicadores-do-ano-400): média total, abaixo da média, objectivo anual, internos e externos | 4.0.0 |
| **Dois dispositivos** | [Auditar no telemóvel, finalizar no PC](#auditar-no-telemóvel-finalizar-no-pc-3250): auditoria por finalizar, envio só dela para o PC, importação que actualiza | 3.25.0 |
| | Enviar para o telemóvel (dados do PC, sem fotos), libertar espaço no telemóvel | 3.26.0 |
| **Usar** | Modo escuro e acessibilidade (WCAG 2 AA) | 3.10.0 |
| | [Caixas de diálogo](#caixas-de-diálogo) da app em vez das do browser | 3.9.0, 3.13.0 |
| | Aviso de nova versão; arranque ~2,5× mais rápido (SheetJS só quando é preciso) | 3.8.0, 3.11.0 |
| **Segurança e qualidade** | CSP sem `'unsafe-inline'` em `dist/` (hashes; não no GitHub Pages) | 3.10.0 |
| | SheetJS com verificação de integridade (SRI) | 3.11.0 |
| | Lint na CI; testes de acessibilidade, de offline e de actualização | 3.10.0, 3.15.0 |
| | Código de acesso próprio do dispositivo | 3.19.0 |
| | Bibliotecas do PDF (html2canvas, jsPDF) com SRI, carregadas só quando é preciso | 3.23.0 |
| | Publicação sem `_headers`: a CSP fica só no `<meta>` | 3.23.0 |
| | Tempo máximo em cada job e passo da CI | — |

## Instalação e utilização

Não há passo de compilação nem dependências a instalar.

1. Abra https://qzte.github.io/5S/ no telemóvel ou no computador.
2. No telemóvel, use *Adicionar ao ecrã principal* para instalar como aplicação.
3. Depois da primeira visita funciona sem rede: o service worker guarda a aplicação em cache.

Como fazer uma auditoria, seguir as acções e os indicadores e fazer cópias de
segurança está no [guia de utilização](GUIA.md).

Para correr localmente basta servir a pasta por HTTP (o service worker não funciona
em `file://`):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicação (GitHub Pages)

A app é publicada no **GitHub Pages**, em `https://qzte.github.io/5S/`, a
partir da raiz do ramo `main`: cada push (ou merge) para a `main` publica
sozinho, pelo fluxo *pages build and deployment* do GitHub. Não há passo de
build: o GitHub Pages serve os ficheiros do repositório tal como estão.

De 3.7.0 até à 4.2.x a documentação dava como endereço o de outro alojamento
(construído com `bash scripts/publicar.sh` e a pasta
`dist`). O endereço em uso é o do GitHub Pages. `scripts/publicar.sh` e
`scripts/csp.mjs` continuam no repositório e são usados pelos testes
(`tests/publicacao.test.js`, `tests/smoke-csp.mjs`, `tests/smoke-offline.mjs`),
mas **não correm no GitHub Pages**. Daí três diferenças face ao que eles
garantiam:

- **A CSP publicada é a do repositório**, com `'unsafe-inline'` no
  `script-src`: a troca pelos hashes de cada `<script>` (3.10.0) só acontece em
  `dist/` (ver [Segurança](#segurança)).
- **O repositório inteiro fica acessível** pelo endereço da app (testes,
  documentação, CI), e não só os ficheiros que `publicar.sh` copiaria.
- **A origem é partilhada** com os outros projectos publicados em
  `qzte.github.io`: o `localStorage`, o IndexedDB e a licença da pasta do
  painel e-ink são da origem, não do caminho `/5S/` ([SECURITY.md](SECURITY.md),
  pontos 9 e 21).

### Dados noutro endereço

O `localStorage` é de cada endereço: auditorias gravadas noutro endereço da app
(por exemplo, o endereço usado entre 3.7.0 e 4.2.x) **não aparecem sozinhas** em
`qzte.github.io/5S/`. Nesse endereço, **Configuração → Exportar com fotos
(JSON)**; depois, em `qzte.github.io/5S/`, **Importar cópia de segurança** com
*Fundir*. A pasta do painel e-ink também tem de ser escolhida outra vez: a
licença do browser é do endereço.

## Modelo de pontuação

Cada item recebe uma classificação, e cada classificação vale pontos:

| Classificação | Pontos |
| --- | --- |
| Mau | 0 |
| Com oportunidade | 2 |
| Excelente | 5,25 |

A nota final é a percentagem entre os pontos obtidos e o máximo possível
(todos os itens Excelente). Os pilares 5S e os responsáveis são normalizados
cada um pelo seu próprio número de itens, pelo que um eixo com 3 itens não é
penalizado face a um com 6.

**As notas já gravadas nunca são recalculadas.** As classificações (`scores`)
são guardadas com a auditoria, o que garante que uma alteração posterior aos
limiares não reescreve o passado.

## Limiares por pergunta

Cada pergunta tem três limiares nomeados, editáveis no editor, que marcam o
valor **a partir do qual** cada classificação se aplica:

- `t1` — a partir daqui a resposta é **Mau**
- `t2` — a partir daqui é **Com oportunidade**
- `t3` — a partir daqui é **Excelente**

O sentido depende do tipo de resposta. Nas **contagens** e nas **amostras** menos
é melhor, logo a ordem natural é `T3 ≤ T2 ≤ T1`; em **escala** e **elementos**
mais é melhor, e a ordem é `T1 ≤ T2 ≤ T3`. Mudar o tipo de resposta recalcula os limiares em vez de
os manter, porque o mesmo trio de números lê-se ao contrário.

Três classes contíguas têm apenas duas fronteiras: um dos três limiares é sempre
`0` e não tem grau de liberdade. Aparece no editor **bloqueado e assinalado como
fixo** — deixá-lo editável daria a ilusão de um controlo sem efeito.

Todas as perguntas mostram um ícone **i** com o tipo de resposta, o intervalo
aceite (ou o alvo sugerido) e o mapeamento resposta → classificação.

## Perguntas de amostra

Nas perguntas do tipo `amostra` audita-se um número fixo de unidades e conta-se
quantas não estão conformes. Os limiares `t1`/`t2` são **percentagens do alvo**,
não contagens, e o alvo efectivo é escolhido em cada auditoria, no campo
*Auditados*. Os cortes acompanham o alvo sem serem reescritos: com `t1 = 40 %`,
auditar 10 kanbans coloca *Mau* em 4; auditar 20 coloca-o em 8.

A pergunta guarda um alvo **sugerido** (`tgt`), que apenas pré-preenche o
formulário. Sem alvo não há denominador: o item fica por responder e sai do
denominador da nota, em vez de receber um zero.

As perguntas 3, 18 e 19 usam este tipo, com alvo sugerido de 10 kanbans.

### Não vejo o campo *Auditados*

A aplicação lê sempre as perguntas guardadas no dispositivo, e só usa as de
origem quando não há nenhumas gravadas. Quem tenha aberto o editor e carregado
em *Guardar* antes da versão 3.1.0 ficou com as perguntas 3, 18 e 19 como
contagens simples — sem alvo, e por isso sem o campo. A migração de tipos **não**
é automática: reescrever o tipo em silêncio mudaria a classificação de
auditorias já feitas.

Desde 3.1.3, a aplicação propõe a conversão uma vez no arranque e, se for
adiada, deixa um cartão em *Configuração* com o botão **Converter agora**. A
conversão preserva o enunciado, o tema, o pilar e o responsável, e não toca nas
auditorias já gravadas — cada uma guarda as suas próprias perguntas. Em
alternativa, o editor permite mudar o tipo pergunta a pergunta, ou repor as
perguntas originais.

## Responsáveis

Quem responde por cada pergunta. São os eixos do radar *Por responsável* e os
blocos de recomendações do relatório, e editam-se em *Configuração →
Responsáveis* (3.5.0). De origem são cinco: Utilizadores, Manutenção, Reposição,
Utilizador e Repositor, e Picking.

| Regra | Porquê |
| --- | --- |
| O **código** fixa-se ao criar e não muda | É a chave por que cada pergunta guarda o seu responsável (`r`); mudá-lo desligaria as perguntas que o referenciam. |
| O **nome** pode ser corrigido sempre | É só o que se lê; nada o referencia. |
| Um responsável **em uso não sai** | A mensagem diz onde está o uso — perguntas do checklist, auditorias gravadas, ou uma recomendação já escrita. Reatribua primeiro, no editor de perguntas e em cada auditoria pelo botão *Editar*. |
| A lista é um **rascunho até Guardar** | E Guardar pede o código de acesso, como o editor de perguntas. |
| Acrescentar fica **no fim** | A ordem da lista é a ordem dos eixos do radar; acrescentar no meio deslocaria os que já lá estavam. |

A exportação JSON leva a lista consigo e a importação trá-la: *Substituir* fica
com a do ficheiro, *Fundir* acrescenta o que falta e mantém os nomes de casa.
Sem isto, um ficheiro de um dispositivo com responsáveis próprios era lido com
os de quem importa, e as perguntas dele mudavam de dono em silêncio.

## Editar auditorias anteriores

No Histórico, **Editar** reabre a auditoria no formulário com tudo preenchido;
Guardar substitui o registo em vez de criar um segundo. O mesmo botão existe no
fim do relatório.

Ambos **pedem o código de acesso** — o mesmo do editor de perguntas, e pedido a
cada vez. Reescrever uma auditoria gravada é uma alteração ao histórico, e a
protecção que aqui interessa é contra o toque distraído: o código é público (ver
[Segurança](#segurança)) e nunca foi um controlo de segurança.

Em edição, o responsável de cada pergunta deixa de ser texto fixo e passa a ser
um **selector** (3.4.0): é o que permite reatribuir o passado depois de
acrescentar um responsável ao modelo, em vez de deixar as auditorias antigas
presas à atribuição do dia em que foram feitas. A mudança fica **só naquela
auditoria** — o checklist em vigor não é tocado, e para o alterar continua a
haver o editor de perguntas. As classificações não mexem: muda o eixo do radar
e o bloco de recomendações a que a pergunta pertence, não o que lhe foi
respondido.

**Apagar** apaga logo e mostra **Desfazer** durante 10 segundos (3.13.0). Até
3.12.x pedia confirmação e o código de acesso (3.3.1); a protecção que interessa
é contra o toque distraído, e desfazer protege melhor: não obriga a escrever
nada, e um engano não fica sem volta. As fotos da auditoria só saem quando o
prazo de desfazer acaba, para que desfazer as traga também.

A edição corre sobre as **perguntas gravadas com essa auditoria**, não sobre as
actuais: se o editor de perguntas mudou entretanto, cada resposta continua a
pertencer à pergunta que a originou, e os limiares que reclassificam um valor
reescrito são os que a classificaram da primeira vez. As recomendações por
responsável mantêm-se.

Uma auditoria antiga que não tenha guardado as suas perguntas e cujo número de
respostas não coincida com o das perguntas actuais **não é editável** — não há
como saber a que pergunta pertence cada resposta.

## Indicadores do ano (4.0.0)

Os KPIs que as auditorias medem estão no topo da **Análise**, no cartão
*Indicadores do ano* (`kpisAnuais()`, pura e testada em
`tests/indicadores.test.js`). São de todos os serviços, no ano escolhido no
cartão — o actual, os que têm auditorias e os que têm objectivo —, e não seguem
os filtros de serviço e período da Análise. No ano em curso contam até hoje.

| Indicador | Como se calcula |
| --- | --- |
| **Média total** | A média das notas de todas as auditorias do ano |
| **Abaixo da média** | Os serviços cuja média no ano é menor do que a média total, do pior para o melhor, com a diferença e as acções em aberto. *Plano de acção* abre o relatório da última auditoria ao serviço |
| **Objectivo anual** | Auditorias feitas ÷ objectivo do ano (`objAud`), e as que faltam |
| **Média semanal** | Auditorias ÷ (dias decorridos do ano ÷ 7), com uma casa decimal; ao lado, objectivo ÷ (dias do ano ÷ 7) |
| **Face ao plano** | Feitas − esperadas, com esperadas = objectivo × dias decorridos ÷ dias do ano. *Em linha* (≥ 0), *Atrás do plano* (< 0) ou *Objectivo cumprido*. Mais a projecção ao ritmo actual e o ritmo semanal que falta |
| **Internos / externos** | Serviços da lista de cada tipo com pelo menos uma auditoria no ano ÷ todos os desse tipo, com os que faltam. Os sem tipo ficam de fora, e a app diz quantos são |
| **Média por serviço** (4.4.0) | Média das médias de cada serviço no ano; cada serviço pesa o mesmo, qualquer que seja o número de auditorias |
| **Serviços por faixa** (4.4.0) | Quantos serviços têm a média do ano em Excelente (≥ 80), Com oportunidade (50–79) e Crítico (< 50) |
| **Há mais tempo sem auditoria** (4.4.0) | Os cinco serviços com a última auditoria mais antiga, ou nunca auditados (`ultimaAuditoriaPorServico()`); até hoje, sem o filtro do ano |
| **Perguntas reincidentes** (4.4.0) | Pergunta que não ficou Excelente em duas ou mais auditorias seguidas ao mesmo serviço, até à última (`reincidencias()`) |
| **Serviços não auditados** (4.5.0) | Serviços da lista sem auditoria no ano, e a sua percentagem da lista; internos e externos mostram também a percentagem sem auditoria |
| **Dispersão** (4.5.0) | A nota mais baixa e a mais alta do ano, com o serviço e a data |

O **tipo** de cada serviço escolhe-se em *Config → Serviços* (`tipoSvc`, lista
de pares, por `sanitizeTipos()`); o **objectivo** em *Config → Objectivo anual
de auditorias* (`objAud`, um por ano, por `sanitizeObjetivos()`: inteiro de 1 a
100 000). Os dois vão na cópia de segurança e no ficheiro para o telemóvel:
*Substituir* traz os do ficheiro, *Fundir* só os que faltam, e o ficheiro do PC
manda nos serviços e nos anos que traz. Remover um serviço tira o seu tipo no
fim do prazo de *Desfazer*. O `5s.painel.json` leva-os em `kpis.anual`, com
(desde 4.1.0) o que o quadro SERVIÇOS do painel mostra: o serviço com a média do
ano mais baixa (`pior`), quantos estão abaixo da média (`nAbaixo`), quantos da
lista não têm auditoria no ano (`porAuditar`) e quantos tem a lista
(`nServicos`).
Desde 4.5.0, `kpis.anual` leva também `naoAuditados` (`n`, `total`, `pct`) e a
`pctPorAuditar` de `internos` e `externos`, e `kpis` leva `acoesMaisAntiga`
(`servico`, `dias`, ou `null`): o que a página do painel «sem auditoria» mostra.

**Retirado em 4.0.0:** a frequência das auditorias de cada serviço (3.13.0) —
com o cartão dos prazos no Histórico, o número no separador, o aviso no
formulário, os prazos no relatório mensal e os `prazos`/`urgentes` do painel —
e o email de cada serviço (3.26.0). As chaves `freqAud` e `emailsSvc` que
estejam gravadas, ou venham num ficheiro de uma versão anterior, são ignoradas.

## Caixas de diálogo

Desde 3.13.0 os avisos e as confirmações vêm na caixa da própria app, e não nas
janelas nativas do browser (`alert`/`confirm`): seguem o modo escuro, são
legíveis por leitores de ecrã e têm botões com o nome da acção (*Remover*,
*Substituir*...). Uma caixa de cada vez, pela ordem em que foram pedidas.

## Evidência por pergunta

Desde 3.14.0, cada pergunta classificada **Mau** ou **Oportunidade** ganha, no
formulário, um campo de **nota** e o botão **Foto** — é no terreno que se vê. A
nota fica com a auditoria (`notas`, alinhada com as respostas); a foto, no
IndexedDB. As duas fazem parte do rascunho, e sobrevivem a um separador fechado
como as respostas. Na edição, a foto pode ser trocada ou removida.

O relatório ganha a folha **Evidências** (só quando há alguma), com a foto, a
pergunta, a classificação e a nota de cada uma. A nota vai também para a folha
*Respostas* da exportação para Excel.

## Plano de acção

Desde 3.12.0, cada auditoria pode ter um **plano de acção**: passos concretos,
cada um com **responsável**, **prazo** e **estado** (aberta ou feita). As
recomendações por responsável (texto e foto, folha 3) continuam como estavam;
as acções são o que se pode seguir até ficar resolvido.

- **Criar.** No relatório, na secção *Plano de acção*, ou com **+ Acção** num
  dos *Itens a melhorar* — o responsável e o número da pergunta vêm
  preenchidos.
- **Seguir.** Uma acção fica **em aberto** até ser marcada como feita (com a
  data). Passado o prazo, aparece **em atraso**. O Histórico mostra quantas
  acções cada auditoria tem em aberto.
- **Fechar no terreno.** O formulário de uma auditoria nova mostra as acções em
  aberto das auditorias anteriores ao serviço escolhido: quem audita verifica
  no local e marca as que ficaram resolvidas.
- **Imprimir.** O plano é a 4.ª folha do relatório, com as acções da auditoria
  e as que vinham em aberto de antes. Sem acções, o relatório continua com 3
  folhas.

Desde 4.5.0, uma acção nova guarda a data de criação (`criadaEm`, opcional: nas
anteriores, a referência é a data da auditoria). Com ela o separador Acções mostra o
tempo médio de fecho, o cumprimento do prazo, a idade das acções em aberto e a
eficácia (`desempenhoAcoes()`, `idadeAcoesAbertas()`, `eficaciaAcoes()`).

As acções viajam com a auditoria na exportação JSON e na importação (validadas
pela mesma porta, `sanitizeAcoes()`), e têm uma folha própria, *Acções*, na
exportação para Excel. Um responsável com acções atribuídas não pode ser
removido, tal como um com perguntas ou recomendações.


### Separador Acções (3.21.0)

As acções viam-se só por serviço (no formulário) ou por auditoria (no
relatório). O separador **Acções** junta-as todas (`listaAcoes()`), com um
resumo — em aberto, em atraso, feitas nos últimos 30 dias — e filtros por
estado (por omissão, as em aberto), responsável e serviço. As em atraso vêm
primeiro, as mais antigas à frente; depois as abertas pelo prazo, e as sem
prazo no fim. Cada acção pode ser marcada como feita ali mesmo, e
*Relatório* abre a auditoria de onde veio (o *Voltar* desse relatório regressa
às Acções). O separador mostra a vermelho quantas estão em atraso. Uma acção
por bloco, e não uma tabela, para caber num telemóvel; 100 de cada vez.
## Dados e privacidade

Tudo vive em `localStorage`, apenas no dispositivo. Não há servidor, conta,
telemetria nem recursos externos.

| Chave | Conteúdo |
| --- | --- |
| `audits` | Auditorias gravadas |
| `services` | Serviços / supermercados |
| `people` | Repositores e Picking |
| `itemsCfg` | Perguntas e limiares personalizados |
| `resps` | Responsáveis (código e nome), pela ordem dos eixos do radar |
| `perguntasAud` | Perguntas com que as auditorias foram feitas, cada conjunto uma vez (3.11.0) |
| `tipoSvc` | Tipo de cada serviço, como lista de pares `{s, t}`, `t` = `"i"` (interno) ou `"e"` (externo) (4.0.0) |
| `objAud` | Objectivo anual de auditorias, como lista `{a: ano, n: auditorias}` (4.0.0) |
| `freqAud`, `emailsSvc` | Frequência (3.13.0) e email (3.26.0) de cada serviço: retirados em 4.0.0; ficam por apagar e são ignorados |
| `dispositivo` | Identificador deste dispositivo, que não vai nas cópias (3.26.0) |
| `rascunho` | Auditoria nova por terminar (3.8.0) — apagada ao gravar ou descartar |
| `backup` | Data da última exportação e alterações desde então (3.8.0) |

Desde 3.25.0 cada auditoria tem também `alterada` (quando mudou pela última
vez), `fase: "terreno"` enquanto está por finalizar e `finalizada` (quando foi
finalizada); `envios` ganha `pc`. Ver
[Auditar no telemóvel, finalizar no PC](#auditar-no-telemóvel-finalizar-no-pc-3250).

**Faça exportações regulares.** Limpar os dados do navegador apaga tudo sem
possibilidade de recuperação. A exportação JSON inclui auditorias, serviços,
pessoas e perguntas; a importação permite **Fundir** (sem duplicar, por
`id` ou serviço+data) ou **Substituir** — este último pede o código de acesso,
por apagar todo o histórico de uma vez (3.5.1).

### Protecção dos dados (3.8.0)

- **Auditoria por terminar.** A auditoria nova é gravada no dispositivo a cada
  resposta e volta sozinha ao formulário ao reabrir a app — mesmo que o sistema
  tenha fechado o separador a meio. Um cartão no topo diz quando foi guardada e
  permite *Descartar e começar de novo*. Se as perguntas mudarem entretanto, cada
  resposta só volta à mesma pergunta (número, tipo e enunciado). A **edição** de
  uma auditoria gravada não tem rascunho: o browser avisa antes de fechar a
  página com alterações por guardar.
- **Armazenamento persistente.** A app pede `navigator.storage.persist()` assim
  que há dados a proteger, para que o browser não os apague sozinho quando falta
  espaço (ou, no Safari, ao fim de 7 dias sem abrir a app). O estado aparece em
  *Configuração → Dados*, com o espaço ocupado e a data da última cópia. Desde
  3.19.0 o espaço tem duas linhas: o `localStorage` (auditorias e
  configuração, que tem limite próprio de ~5 MB) e o total da app segundo
  `navigator.storage.estimate()` — fotos, cache offline e tudo o resto — face à
  quota que o browser lhe dá. Cada uma avisa a partir de 80%.
- **Lembrete de cópia de segurança.** Um aviso no topo pede a exportação se
  nunca houve nenhuma, ou se há auditorias gravadas ou editadas por exportar há
  7 dias ou mais, ou 5 ou mais. *Lembrar amanhã* adia-o por um dia. Desde
  3.18.0 conta também as **fotos** (evidências e recomendações) novas ou
  trocadas desde a última cópia *com fotos*: a cópia normal não as leva e já
  não tira esse aviso, que traz o botão *Exportar com fotos*. Na primeira
  abertura da 3.18.0, as fotos que já existiam contam como por copiar.
- **Nova versão.** Quando o service worker de uma versão nova passa a controlar a
  página, aparece *Nova versão disponível* com o botão *Recarregar agora*. A
  auditoria por terminar sobrevive ao recarregar.

O armazenamento do navegador é finito (~5 MB por origem). Se encher, gravar
falha com um aviso explícito, o formulário **não** é limpo e nada do que já
estava guardado se perde; a saída é exportar e apagar auditorias antigas.

**Desempenho com muito histórico (3.15.0).** Medido num telemóvel médio
simulado (processador a ¼), com 5 000 auditorias: o Histórico abria em ~2,9 s e
a Análise em ~0,8 s; agora abrem em ~15 ms e ~50 ms. O Histórico desenha 50
cartões de cada vez (*Mostrar mais*) e encontra a auditoria anterior de todas
numa só passagem; as métricas de cada auditoria (pilares e responsáveis)
calculam-se uma vez e ficam em memória; o gráfico de evolução, com mais de 120
pontos, fica só com as linhas e uma descrição resumida.

**Desde 3.11.0, cada conjunto de perguntas é gravado uma vez.** Cada auditoria
guarda as perguntas com que foi feita, para o relatório e a edição de uma
auditoria antiga usarem as perguntas daquela altura. Até 3.10.x cada uma
gravava a sua cópia (~2,8 KB, quase sempre igual), e o armazenamento enchia por
volta das **1 700 auditorias**. Agora as perguntas vão para `perguntasAud`, uma
vez por conjunto diferente, e cada auditoria grava só a chave: 5 000 auditorias
(o máximo, `MAX_AUDITS`) ocupam ~1,4 M caracteres, contra ~14 M antes. As
auditorias gravadas por versões anteriores são convertidas no primeiro arranque.
Em memória e na exportação JSON nada muda: cada auditoria continua a trazer as
suas perguntas, e os ficheiros de cópia lêem-se em qualquer versão.

As fotografias são a excepção: desde 3.9.0 ficam no **IndexedDB** (base
`auditoria5s-fotos`), reduzidas a 640 px — as das recomendações (`<id>|<responsável>`)
e, desde 3.14.0, as de evidência de cada pergunta (`<id>#<pergunta>`). Não
ocupam a quota do `localStorage` e estão cobertas pelo pedido de armazenamento
persistente. A exportação JSON normal deixa-as de fora, para o ficheiro ficar
leve; **Exportar com fotos** (3.14.0) leva-as todas, e importar esse ficheiro
repõe-nas (validadas uma a uma: só imagens JPEG, PNG ou WebP em `data:`, e cada
uma acompanha a auditoria a que pertence, mesmo que esta mude de id ao fundir).
Apagar uma auditoria apaga as fotos dela no fim do prazo de *Desfazer*;
*Substituir* na importação apaga as das auditorias que deixaram de existir.

### Partilhar a cópia (3.20.0)

*Configuração → Dados → Partilhar cópia com fotos* faz a mesma cópia que
*Exportar com fotos* e entrega-a ao menu de partilha do sistema (Web Share),
para a mandar para a Drive, o email ou outra app sem passar pelas
Transferências. Só aparece onde o browser partilha ficheiros (Android, iOS,
alguns desktops). O Chrome só partilha extensões de uma lista onde `.json` não
está: nele o ficheiro vai como `.txt`, com o mesmo conteúdo, e a importação
aceita-o — o que se verifica é o conteúdo. Desde 3.24.0 o botão chama-se
*Importar cópia de segurança (.json ou .txt)*. Uma partilha concluída conta como
cópia com fotos; fechar o menu não conta. Se ler as fotos demorar mais do que o
browser deixa entre o toque e a partilha, a app pede um segundo toque, já com o
ficheiro pronto.

### Exportação para Excel (3.9.0)

*Configuração → Dados → Exportar para Excel* gera um `.xlsx` com duas folhas,
com o SheetJS que já servia para a importação:

- **Auditorias** — uma linha por auditoria: serviço, data, nota, classificação,
  nomes, observação e a percentagem por pilar e por responsável.
- **Respostas** — uma linha por resposta: pergunta, pilar, responsável, valor,
  unidades auditadas e classificação. É o formato que uma tabela dinâmica quer.
- **Acções** (3.12.0, quando há) — uma linha por acção do plano: responsável,
  texto, pergunta, prazo, estado e data de conclusão.

Serve para análise noutro programa. **Não** é uma cópia de segurança: não pode
ser importado de volta, e por isso não conta para o lembrete de exportação.

## Depois da auditoria (3.23.0)

O relatório de cada auditoria abre com o cartão **Depois da auditoria**, com os
três passos que se seguem a gravar, e diz quais já foram feitos:

1. **Cópia de segurança** — *Guardar cópia com fotos*, a mesma de *Config →
   Dados*. Desde 3.24.0 vai pelo menu de partilha (como *Partilhar cópia com
   fotos*), para sair logo do telemóvel; onde o browser não partilha ficheiros,
   descarrega-a. Fica feita enquanto não houver auditorias nem fotos por
   copiar.
2. **PDF do relatório** — criado pela própria app (`pdfDoRelatorio()`), e não
   pela janela de impressão: cada folha do relatório é desenhada numa imagem
   pelo **html2canvas** e o **jsPDF** junta-as num A4, com o nome
   «Auditoria 5S - <serviço> - <data>.pdf». Sai como a impressão (as regras de
   `@media print` passam a valer na cópia que é desenhada) e sempre em claro,
   mesmo com o modo escuro ligado. Os gráficos SVG são convertidos em imagem
   com os estilos já resolvidos, porque o html2canvas desenha-os sem o CSS da
   página. As duas bibliotecas (MIT) estão em `vendor/`, com SRI, e só se
   carregam no primeiro PDF; ficam na cache offline. Cerca de 1 s e 300 KB por
   auditoria.
3. **Enviar por email** / **Enviar para o Teams** — o PDF e um resumo
   (`resumoEnvio()`: nota e variação, contagens, pilar mais fraco, acções,
   verificador) vão para o **menu de partilha** do sistema (Web Share), onde se
   escolhe o Outlook, o Gmail ou o Teams e o destinatário. O email leva o
   assunto e uma saudação; o Teams, o resumo curto. Sem partilha de ficheiros
   (alguns browsers de computador), descarrega-se o PDF e abre-se o email já
   escrito (`mailto:`, sem anexo: a app não pode anexar) ou copia-se o resumo
   para colar no Teams.

O PDF e os envios ficam registados na auditoria (`envios: {pdf, email,
teams}`, com a data), e portanto nas cópias de segurança; o Histórico mostra
«enviada (email, Teams) a …» ou «por enviar». Registar um envio não volta a
pedir a cópia de segurança. Fechar o menu de partilha sem enviar não conta.

## Auditar no telemóvel, finalizar no PC (3.25.0)

O fluxo: no serviço, com o telemóvel, responde-se às perguntas e tiram-se as
fotos; a auditoria vai por email para o PC; no PC completa-se, gera-se o PDF,
envia-se ao serviço auditado e faz-se a cópia de segurança.

- **Por finalizar.** Uma auditoria nova grava-se com `fase: "terreno"`. O
  cartão *Depois da auditoria* tem então dois passos: **Enviar para o PC** e
  **Finalizar auditoria**. O PDF, o envio ao serviço e a cópia de segurança
  aparecem depois de finalizada, por esta ordem. As auditorias de versões
  anteriores não têm `fase` e contam como finalizadas. O Histórico diz «por
  finalizar» e se já foi enviada para o PC.
- **Enviar para o PC** (`enviarParaPC()`, `payloadTransferencia()`) partilha
  pelo menu do sistema um **ficheiro de auditoria** — «Auditoria 5S -
  <serviço> - <data>.json» (`.txt` no Chrome), com `tipo: "auditoria"` — só
  com essa auditoria e as suas fotos (algumas centenas de KB, e não a cópia
  inteira, que cresce até passar o limite do email). Leva também as acções que
  se fecharam no terreno (`acoesFeitas`), que pertencem a auditorias
  anteriores e não iriam de outro modo. Sem menu de partilha, descarrega-o.
- **Importar ficheiro**, no Histórico (é a mesma importação de *Config →
  Dados*), reconhece o ficheiro de auditoria: só funde (nunca propõe
  *Substituir tudo*), fecha as acções feitas no terreno (nunca as reabre) e
  abre logo o relatório da auditoria.
- **Finalizar no PC.** Enquanto está por finalizar, *Editar auditoria* não
  pede o código de acesso: completá-la (observação, notas, fotos) é o passo
  seguinte, e não uma alteração ao histórico. Recomendações e acções
  escrevem-se no relatório, como sempre. **Finalizar auditoria** grava
  `finalizada` e tira a `fase`.
- **Fundir actualiza.** Até 3.24.x, Fundir ignorava uma auditoria que já
  existisse (mesmo id, ou mesmo serviço e data). Com duas cópias de cada
  auditoria isso deixava o PC com a versão antiga, e as acções fechadas no
  terreno por fechar. Agora cada auditoria guarda `alterada` (a data ISO da
  última alteração: gravar, editar, recomendações, fotos das recomendações,
  acções, envios, finalizar), e a do ficheiro **substitui** a de casa quando é
  mais recente (`planoFusao()`), mantendo o id de casa. Se o ficheiro trouxer
  fotos, as dessa auditoria substituem as de casa; um ficheiro sem fotos deixa
  as de casa como estão. A mesma regra faz o caminho inverso: a cópia do PC,
  importada no telemóvel com Fundir, actualiza lá as auditorias finalizadas e
  as acções.

### Do PC para o telemóvel, email e espaço (3.26.0)

- **Enviar para o telemóvel** (*Config → Dados*, no PC) partilha a cópia
  **sem fotos**, marcada `tipo: "actualizacao"` (`enviarParaTelemovel()`).
  Importada no telemóvel, a caixa é *Actualizar com os dados do PC*, só com
  *Actualizar* (nunca *Substituir*): funde as auditorias pela regra de
  `alterada`, e para os serviços do ficheiro passa a valer o tipo do PC,
  mesmo o que o PC tirou, e o objectivo de cada ano que o PC tem (até 3.27.0,
  as frequências e os emails). As perguntas do PC aplicam-se sem
  perguntar, quando são diferentes (nas outras importações a pergunta só
  aparece se forem diferentes). Não conta como cópia de segurança.
- **Email de cada serviço** (`emailsSvc`, lista de pares `{s, e}`, até 5
  endereços por serviço) — *retirado em 4.0.0*. Estava em *Config →
  Frequência das auditorias e email*. O cartão *Depois da auditoria* mostra o
  destinatário. O menu de partilha não deixa escolher o destinatário: ao
  carregar em *Enviar por email*, o endereço é copiado para colar em «Para»;
  sem menu, o `mailto:` já o leva. Vai nas cópias de segurança (*Substituir*
  traz os do ficheiro, *Fundir* só os que faltam). Remover um serviço tira o
  seu email no fim do prazo de *Desfazer*.
- **Libertar espaço.** Finalizar regista o dispositivo (`finalizadaPor`, o
  `dispositivo` gerado uma vez em cada um, que não vai nas cópias). No
  telemóvel, as auditorias enviadas daqui para o PC e finalizadas noutro
  dispositivo (`fotosNoPC()`) têm as fotos no PC: *Config → Dados* oferece
  apagá-las deste dispositivo. As auditorias ficam, com o histórico e o
  seguimento.

### Enviar para o PC conta como cópia (3.27.0)

No telemóvel, a cópia de segurança faz-se no PC. Depois de *Enviar para o PC*,
`tudoNoPC()` verifica se todas as auditorias alteradas desde a última cópia
(`backup.at`) já estão no PC: enviadas depois da última alteração
(`envios.pc ≥ alterada`), com as acções fechadas no terreno no ficheiro agora
enviado, ou vindas do PC (finalizadas noutro dispositivo). As anteriores a
3.25.0 (sem `alterada`) só contam como seguras se já houve alguma cópia. Se
sim, o envio regista-se como cópia com fotos (`registarExportacao(true,
"pc")`, com `viaPC`), e o lembrete desaparece; se não, continua.

## Relatório mensal (3.20.0)

Na **Análise**, *Relatório mensal* resume um mês de todos os serviços, para a
direcção. Escolhe-se o mês (o actual e os que têm auditorias; por omissão, o
mais recente com auditorias) e *Gerar PDF* imprime-o em duas folhas
(`resumoMensal()`):

- **Cabeçalho** — a média do mês e a sua faixa, as auditorias e os serviços
  auditados, a média do mês anterior e a diferença, e as auditorias por faixa.
- **Por serviço** — os da lista e os que tiveram auditoria, do pior para o
  melhor: auditorias, média, última nota e a variação face ao mês anterior. Os
  que não tiveram auditoria aparecem no fim.
- **Por pilar 5S** (radar e barras, com a variação) e **por responsável**.
- **Perguntas que mais falharam** — as cinco com maior proporção de respostas
  sem Excelente, com os Mau e os serviços.
- **Plano de acção** — as acções novas (das auditorias do mês), as concluídas
  no mês, e as em aberto e em atraso no fim do mês.

No mês em curso, as acções contam até hoje, não até ao fim do mês. (Até 3.27.0
tinha também os prazos das auditorias, que saíram com a frequência.)

## Importação de Excel

O cabeçalho é procurado nas primeiras 15 linhas e é a linha que identificar
**mais** colunas — uma linha de título antes dos rótulos (`Relatório de
serviços`) não a engana, ainda que contenha a palavra "serviços".

Aceita `.xlsx`, `.xls` e `.csv`, processados localmente pelo SheetJS, que vem
com a app (`vendor/xlsx.full.min.js`) e funciona offline. Desde 3.11.0 só é
carregado quando é preciso, em vez de a cada arranque: eram 952 KB dos 1,13 MB
do `index.html`, e o arranque num telemóvel médio desceu de ~690 ms para ~290 ms:

- Folha **Serviços** — colunas `Código` e `Descrição`. Desde 4.2.0 aceita também a
  listagem de serviços exportada do sistema, com `ID_SERVICO` (o código),
  `DESCRICAO_SERVICO`, `LOCAL_SERVICO` (Interno/Externo, que dá o
  [tipo](#indicadores-do-ano-400) dos serviços e, desde 4.2.2, substitui o que lá
  estiver; na Config o tipo mostra-se só para ler, salvo nos que não o têm) e
  `SERVICO_ATIVO` (os inactivos ficam de fora), mesmo numa folha com outro nome.
  Desde 4.2.3 cada linha vai para o serviço da lista com o mesmo nome ou, senão,
  com o mesmo **código** (`planoServicosExcel()`): uma descrição diferente não
  cria um duplicado nem deixa o serviço sem tipo. Desde 4.2.4, se a lista tiver
  o mesmo código em mais de um serviço (duplicados de importações antigas),
  todos recebem o tipo, e a importação diz quais são. Diz também quais
  serviços ficam sem tipo. Desde 4.2.5, `LOCAL_SERVICO` aceita **HPH**
  (Interno) e **ACES** (Externo), e a importação pergunta se a listagem
  **substitui** a lista de serviços (`planoSubstituirServicos()`) ou se
  **junta** à actual. Substituir não toca nas auditorias já feitas.
- Folha **Repositor** ou **Picking** — coluna `Nome` (e opcionalmente `Código`).

As folhas são reconhecidas pelo nome; num ficheiro de folha única aplica-se a
deteção pelas colunas.

## Estrutura do repositório

```
index.html         Aplicação completa: HTML, CSS e JS
vendor/xlsx.full.min.js  SheetJS 0.20.3, carregado só para Excel (3.11.0)
vendor/html2canvas.min.js, vendor/jspdf.umd.min.js  html2canvas 1.4.1 e jsPDF 4.2.1 (MIT), carregados só para criar o PDF (3.23.0)
manifest.json      Manifesto PWA
sw.js              Service worker — cache offline versionada, com allowlist
scripts/publicar.sh  Prepara dist/ com só os ficheiros da app (usado pelos testes; o GitHub Pages serve a raiz)
scripts/csp.mjs    Na versão publicada, troca 'unsafe-inline' pelos hashes dos <script>
tools/lint/        Ferramentas de desenvolvimento (ESLint, axe-core), com lockfile próprio
CHANGELOG.md       Histórico de versões (Keep a Changelog)
SECURITY.md        Revisões de segurança (3.1.0, 3.5.0, 3.6.0) e notas das versões seguintes
KPIS.md            Todos os KPIs e métricas: fórmulas, leitura e avaliação
GUIA.md            Guia de utilização, para quem usa a app
guia.html          O guia, publicado com a app (Config → Ajuda) — gerado de GUIA.md
scripts/guia.mjs   Gera guia.html a partir de GUIA.md (Markdown mínimo, sem dependências)
tests/harness.js   Extrai as funções puras do index.html para teste em Node
tests/sheetjs.*    Integridade do SheetJS (SHA-256 fixado, e o SRI do carregador)
tests/*.test.js    Testes unitários (node:test)
tests/smoke*.mjs   Smoke tests de browser (Playwright)
tests/dialogos.mjs Responde à caixa de diálogo da app nos smoke tests
```

`index.html` é deliberadamente um ficheiro único: é o que permite instalar,
copiar e usar a aplicação sem infraestrutura. O custo é um ficheiro grande. O
`'unsafe-inline'` em `script-src` é o outro custo. `scripts/csp.mjs` troca-o
pelo hash de cada `<script>` na pasta `dist/` (3.10.0), mas o GitHub Pages serve
a raiz do repositório, por isso a versão em `qzte.github.io/5S/` mantém o
`'unsafe-inline'` (ver [Publicação](#publicação-github-pages)).

As ferramentas de desenvolvimento (ESLint e axe-core) vivem em `tools/lint/`,
com o seu `package.json` e lockfile. Na raiz não há `package.json`: a app não
tem dependências, e um alojamento com passo de build
instalaria as que lá estivessem em cada publicação.

## Testes

> O guia publicado (`guia.html`) é gerado de `GUIA.md`. Depois de mudar o guia,
> corra `node scripts/guia.mjs`; `tests/guia.test.js` falha se se esquecer.

`harness.js` localiza cada função pura dentro do `index.html`, avalia-a num
contexto `vm` isolado e expõe-na ao teste. Os testes exercitam assim o **código
real** em produção, sem cópia paralela e sem DOM.

```bash
node --test tests/*.test.js
```

Os smoke tests de browser correm à parte, com a aplicação servida por HTTP
(`python3 -m http.server 8765`) e o Playwright instalado:

```bash
node tests/smoke.mjs               # perguntas de amostra
node tests/smoke-edicao.mjs        # edição de auditorias anteriores
node tests/smoke-responsaveis.mjs  # responsáveis editáveis
node tests/smoke-painel.mjs        # painel e-ink
node tests/smoke-rascunho.mjs      # rascunho, cópia de segurança, nova versão
node tests/smoke-historico.mjs     # filtros, análise, seguimento, fotos, Excel, diálogo
node tests/smoke-csp.mjs           # versão publicada: CSP por hashes (serve dist/ na 8766)
node tests/smoke-a11y.mjs          # acessibilidade com o axe-core, modo claro e escuro
node tests/smoke-armazenamento.mjs # perguntas gravadas uma vez, 5 000 auditorias, Excel offline
node tests/smoke-acoes.mjs         # plano de acção: criar, atrasar, fechar no terreno, PDF
node tests/smoke-indicadores.mjs   # indicadores do ano, tipo e objectivo; nenhum diálogo nativo
node tests/smoke-pesquisa.mjs      # pesquisar o serviço a auditar; listagem de serviços do sistema
node tests/smoke-evidencias.mjs    # nota e foto por pergunta; cópia com fotos
node tests/smoke-copias.mjs        # lembrete das fotos por copiar; Desfazer ao remover
node tests/smoke-acesso.mjs        # código de acesso próprio; espaço ocupado com as fotos
node tests/smoke-mensal.mjs        # relatório mensal; partilhar a cópia (Web Share simulado)
node tests/smoke-correcoes.mjs     # data local, «Remover foto», nome do PDF, auditoria repetida
node tests/smoke-envio.mjs         # depois da auditoria: cópia, PDF, email e Teams (partilha simulada)
node tests/smoke-terreno.mjs       # auditar no telemóvel, finalizar no PC (dois dispositivos)
node tests/smoke-offline.mjs       # versão publicada: offline, 404, servidor em baixo, actualização, guia
```

O lint e o teste de acessibilidade precisam das ferramentas de `tools/lint/`:

```bash
npm ci --prefix tools/lint
node tools/lint/lint.mjs
```

O lint tira do `index.html` os `<script>` da app (as bibliotecas de `vendor/` —
SheetJS, html2canvas e jsPDF — não são lintadas: são código de terceiros,
carregado com SRI) e passa-os ao ESLint com as regras de erro do `eslint:recommended` — variáveis
por declarar, código inalcançável, chaves duplicadas —, nenhuma de estilo. As
linhas que aponta são as do `index.html`.

O ponto crítico coberto é a migração de limiares: as classificações são
verificadas valor a valor sobre a totalidade das combinações pergunta × resposta
do modelo base, nos três formatos (1.x, 2.0.0, 3.0.0).

> `harness.js` faz `require` de `../index.html`, pelo que tem de estar numa
> subpasta (`tests/`). Até 3.1.0 os ficheiros estavam na raiz e a suite não
> corria de todo; foram movidos em 3.1.1.

### Integração contínua

`.github/workflows/ci.yml` corre em cada push para `main` e em cada pull
request, com quatro verificações independentes:

| Verificação | O que corre |
| --- | --- |
| Testes unitários | `node --test tests/*.test.js` |
| Lint | `node tools/lint/lint.mjs`, com o ESLint de `tools/lint/` |
| Smoke tests de browser | Todos os `tests/smoke*.mjs`, com a aplicação servida em `127.0.0.1:8765` |
| Coerência da versão | A versão de `manifest.json`, `index.html`, `sw.js` e `README.md` tem de ser a mesma |

O Playwright está fixo em `1.56.0`: a versão do pacote e a do Chromium que
descarrega andam ao par, e uma actualização silenciosa do browser é a forma
mais comum de um smoke test passar a falhar sem que o `index.html` tenha
mudado. A verificação da versão existe porque o `sw.js` usa `APP_VERSION` como
nome da cache — uma divergência faz o browser servir a versão antiga sem
qualquer aviso.

Cada job tem um **tempo máximo** (`timeout-minutes`), e os passos que dependem
da rede ou do browser — instalar o Playwright e o Chromium, e cada smoke test —
têm o seu. Sem eles, um job encravado ficava até 6 horas (o limite do GitHub) a
ocupar o runner, como já aconteceu ao instalar o Chromium; com eles falha em
minutos e diz em que passo. Os limites têm folga de várias vezes o tempo normal
(testes e lint em segundos, smoke tests em ~2 minutos). `tests/ci.test.js`
falha se um job ou um smoke test novo ficar sem o seu, ou se um smoke test do
repositório não correr na CI.

## Segurança

Auditoria OWASP Top 10 aplicada na versão 1.4.0:

- Todo o texto do utilizador passa por `esc()` antes de ser interpolado em HTML.
- Zero handlers inline (`onclick` e afins); apenas `addEventListener` com
  `data-attributes`.
- CSP com `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`,
  `connect-src 'self'`. Em `dist/` (preparada por `scripts/publicar.sh`), desde
  3.10.0, o `script-src` não tem `'unsafe-inline'`: autoriza só os `<script>`
  embutidos, pelo hash SHA-256 de cada um (`scripts/csp.mjs`), e um `<script>`
  injectado na página não corre; `tests/smoke-csp.mjs` verifica-o num browser.
  A versão no GitHub Pages é a do repositório, com `'unsafe-inline'`.
- Service worker limitado a uma allowlist da própria origem, contra
  envenenamento da cache.
- Sem CDN: `referrer` não é enviado e a aplicação é offline de facto.
- SheetJS em **0.20.3** (`vendor/xlsx.full.min.js`, desde 3.11.0), que corrige a CVE-2023-30533 (prototype
  pollution) e a CVE-2024-22363 (ReDoS). Atenção ao actualizar: a biblioteca
  sai apenas de `cdn.sheetjs.com`, porque o pacote `xlsx` no npm ficou
  congelado em 0.18.5 (3.1.2) — o que também torna o `npm audit` cego a este
  componente. Por isso o ficheiro está **fixado pelo seu SHA-256** em
  `tests/sheetjs.test.js`: qualquer alteração faz a CI falhar (3.5.2). É
  carregado com `integrity` (SRI), pelo que o browser também o recusa se não
  for exactamente esse (3.11.0).
- Porta de entrada única para dados de ficheiro: `sanitizeAudit()` para
  auditorias, `sanitizeItems()` para perguntas e `sanitizeResps()` para
  responsáveis — usada tanto pelo editor como pela importação de histórico
  (3.1.1, 3.5.0).
- Leitura de índices de objecto sempre com `hasOwnProperty`, agora que o código
  do responsável é escrito pelo utilizador: `isResp()` para as perguntas e
  `recTexto()` para as recomendações (3.1.1, 3.5.1).
- O que vem do `localStorage` é validado na FORMA e não só no parse, e gravar
  deixou de poder falhar em silêncio quando o armazenamento enche (3.5.1).
- `clean()` remove as marcas **bidireccionais** (U+202E e afins, a técnica do
  *Trojan Source*, que inverteria o texto do relatório impresso sem deixar nada
  para ver) e é aplicado a TODO o texto — escrito à mão e importado. Os juntores
  U+200C/U+200D ficam de fora, por serem legítimos em árabe, escritas índicas e
  emoji (3.5.2).
- As *actions* da CI estão fixadas por **SHA de commit**, não por etiqueta
  móvel; o `ci.yml` documenta como actualizar (3.5.2).
- Cada auditoria lida do `localStorage` é verificada na forma (`auditUsavel()`),
  a exportação lê as perguntas pela mesma porta segura que o resto da app, e
  gravar uma auditoria exige a data que a importação exige (3.6.1).

Revisão completa em [SECURITY.md](SECURITY.md), incluindo o que **não** está
mitigado. Dois pontos a reter:

- `frame-ancestors` numa CSP em `<meta>` é **ignorado pelos browsers**: só
  funciona em cabeçalho HTTP. De 3.7.0 a 3.22.0, no alojamento de então, a CSP ia
  também em cabeçalho (`_headers`) e o browser recusava a moldura; desde 3.23.0
  o `_headers` já não existe, e a protecção é a guarda em JS no `<head>`
  (3.1.2). Quem sirva a app de um alojamento que deixe definir cabeçalhos deve
  enviar `Content-Security-Policy` com `frame-ancestors 'none'` e
  `X-Frame-Options: DENY`.
- O `localStorage` pertence à **origem**, não ao caminho. Em
  `qzte.github.io`, onde a app está publicada, qualquer outra página publicada
  na mesma conta lê e escreve os dados desta aplicação, e herda a licença da
  **pasta do painel e-ink** (3.6.1). Esse isolamento só existe num endereço
  próprio (como o usado entre 3.7.0 e 4.2.x).

**O PIN do editor — pedido também para editar uma auditoria gravada, alterar os
responsáveis e substituir todo o histórico numa importação — não é um controlo
de segurança.** O código de origem é público num
ficheiro estático; qualquer pessoa o pode ler. Protege apenas contra alterações
acidentais.

Desde 3.19.0 cada dispositivo pode ter um **código próprio** (*Configuração →
Código de acesso*), de 4 a 8 algarismos, que substitui o de origem: quem leu o
código-fonte deixa de conseguir abrir as áreas protegidas. Guarda-se só um resumo com
sal (`pinAcesso`), fora das cópias de segurança, e o «Substituir tudo» não lhe
toca. Continua a não ser uma palavra-passe: um resumo de tão poucos algarismos
adivinha-se por tentativas, e quem tem o dispositivo nas mãos pode limpar os
dados do site. Quem se esquecer do código recupera assim: exportar uma cópia
(não pede código), limpar os dados do site no browser, abrir a app e importar a
cópia com *Fundir*.

## Versionamento

O projecto segue [Semantic Versioning](https://semver.org/lang/pt-BR/). A versão
está declarada em quatro pontos, que têm de coincidir:

| Local | Campo |
| --- | --- |
| `index.html` | Cabeçalho e `APP_VERSION` |
| `sw.js` | `APP_VERSION` (dá o nome à cache) |
| `manifest.json` | `version` e `description` |
| `CHANGELOG.md` | Entrada da versão |

- **MAJOR** — altera o formato de dados de forma que uma versão anterior não
  leia (ex.: 2.0.0 e 3.0.0, ambas por mudança na semântica dos limiares).
- **MINOR** — funcionalidade nova, compatível.
- **PATCH** — correcções sem alteração de contrato.

Ficheiros exportados por uma versão MAJOR anterior continuam a importar; o
inverso não é garantido.

## Licença

Ver [LICENSE](LICENSE) no repositório.
