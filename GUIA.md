<!--
  Auditoria 5S · Supermercados Kaizen — Guia de utilização
  Para quem audita e para quem acompanha as auditorias. O README.md é a
  documentação técnica (dados, segurança, testes, publicação).
  Escrito para a versão 3.22.0. Publicado com a app como guia.html, gerado
  por scripts/guia.mjs — depois de mudar este ficheiro: node scripts/guia.mjs É documentação: não muda com a versão do código
  a não ser que o funcionamento descrito mude.
-->

# Guia de utilização

Como usar a app no dia-a-dia: fazer uma auditoria, ler o relatório, seguir as
acções, manter os prazos e não perder dados. Este guia também está dentro da
app, em **Config → Ajuda**, e abre sem rede. Para os pormenores técnicos, ver o
[README](README.md); para o que mudou em cada versão, o [CHANGELOG](CHANGELOG.md).

- [Antes de começar](#antes-de-começar)
- [Fazer uma auditoria](#fazer-uma-auditoria)
- [O relatório](#o-relatório)
- [Plano de acção](#plano-de-acção)
- [Histórico e prazos](#histórico-e-prazos)
- [Análise](#análise)
- [Cópias de segurança](#cópias-de-segurança)
- [Configuração](#configuração)
- [Sem rede e actualizações](#sem-rede-e-actualizações)
- [Perguntas frequentes](#perguntas-frequentes)

## Antes de começar

1. No telemóvel, com a app aberta no browser, escolha *Adicionar ao ecrã
   principal*. Instalada, a app abre como as outras, funciona sem rede e o
   browser protege melhor os dados (ver [Cópias de segurança](#cópias-de-segurança)).
2. Em **Config → Serviços**, acrescente os supermercados a auditar (ou importe-os
   de um Excel em *Importar Excel*).
3. Em **Config → Frequência das auditorias**, diga de quanto em quanto tempo cada
   serviço deve ser auditado (semanal, quinzenal, mensal ou trimestral). É o que
   permite à app avisar das auditorias em atraso.

Os dados ficam **só neste dispositivo**. Não há conta nem servidor: quem tiver o
telemóvel tem as auditorias, e quem o perder perde-as — a menos que tenha uma
[cópia de segurança](#cópias-de-segurança).

## Fazer uma auditoria

No separador **Auditar**:

1. **Escolha o serviço.** Por baixo aparece a frequência, a última auditoria e o
   estado — por exemplo *Semanal · última auditoria a 25/10/26 · Em atraso há 5
   dias*.
2. **Acções em aberto neste serviço.** Se auditorias anteriores deixaram acções
   por fazer, aparecem num cartão no topo. Verifique no local e marque **Feita**
   nas que ficaram resolvidas (ver [Plano de acção](#plano-de-acção)).
3. **Responda às 19 perguntas.** A nota vai sendo calculada em *Nota (auto)*.
   Em cada pergunta que a última auditoria ao serviço não deu como Excelente,
   aparece o que lhe deu, para saber o que procurar.
4. **Evidência.** Numa pergunta classificada **Mau** ou **Oportunidade**
   aparecem um campo de nota e o botão **Foto**: escreva o que viu e fotografe.
   *Trocar foto* e *Remover foto* fazem o que dizem.
5. Carregue em **Guardar auditoria**. Abre o relatório. Se já houver uma
   auditoria ao mesmo serviço nesse dia, a app pergunta antes de gravar outra:
   se é a mesma, cancele e edite a do Histórico.

**Pode fechar a app a meio.** A auditoria por terminar — respostas, nomes, notas
e fotos — fica guardada no dispositivo a cada alteração, e volta ao reabrir. O
cartão *Auditoria por terminar* diz quando foi guardada; **Descartar e começar
de novo** apaga-a. Só entra no Histórico ao carregar em *Guardar auditoria*.

## O relatório

Abre ao gravar, ou em **Histórico → Relatório**. **Gerar PDF** imprime-o; ao
guardar, o ficheiro já vem com o nome do serviço e a data:

| Folha | Conteúdo |
| --- | --- |
| 1 | Nota, radares por pilar 5S e por responsável, histórico das últimas auditorias ao serviço |
| 2 | Pontuação e grelha completa das 19 perguntas |
| 3 | Recomendações por responsável, com texto e foto |
| Evidências | As perguntas Mau ou Oportunidade com nota ou foto — só quando há |
| Plano de acção | As acções desta auditoria e as que vinham em aberto — só quando há |

No ecrã (não vão para o PDF) há ainda:

- **Itens a melhorar** — as perguntas que não ficaram Excelentes, cada uma com
  o botão **+ Acção**.
- **Seguimento da auditoria anterior** — o que melhorou, o que se mantém por
  resolver e o que piorou face à auditoria anterior ao mesmo serviço.

O texto e as fotos das **recomendações** escrevem-se aqui e ficam gravados com a
auditoria. **Editar auditoria** reabre-a no formulário (pede o código de acesso).

## Plano de acção

As recomendações dizem o que melhorar; uma **acção** é um passo concreto, com
**responsável**, **prazo** e **estado**, que se segue até estar feito.

- **Criar.** No relatório, carregue em **+ Acção** num dos *Itens a melhorar* —
  o responsável e o número da pergunta vêm preenchidos — ou escreva-a
  directamente em *Plano de acção*, com responsável e prazo, e carregue em
  **Acrescentar acção**.
- **Seguir.** A acção fica **Aberta** até ser marcada como feita. Passado o
  prazo, passa a **Em atraso**, a vermelho. O Histórico mostra quantas acções
  cada auditoria tem em aberto.
- **Fechar.** Marque **Feita** — no relatório, ou, melhor, no formulário da
  auditoria seguinte ao mesmo serviço, quando estiver no local a confirmar.
  Fica registada a data.
- **Ver todas.** O separador **Acções** junta as acções de todos os serviços,
  com as em atraso primeiro. Filtre por estado (em aberto, em atraso, feitas,
  todas), responsável ou serviço; marque **Feita** ali mesmo, ou abra o
  **Relatório** da auditoria de onde a acção veio. O número a vermelho no
  separador diz quantas estão em atraso.

## Histórico e prazos

O separador **Histórico** mostra um número a vermelho quando há serviços por
auditar (em atraso ou nunca auditados).

- **Prazos das auditorias** — os serviços com frequência, pela urgência: *Em
  atraso*, *Nunca auditado*, *A vencer* (faltam 2 dias ou menos), *Em dia*.
  **Auditar** abre o formulário já com o serviço escolhido.
- **Filtros** — por serviço, intervalo de datas e faixa de nota (Crítico,
  Com oportunidade, Excelente). *Limpar filtros* repõe tudo.
- **Cada auditoria** mostra a nota e a variação face à anterior ao mesmo
  serviço (▲ subiu, ▼ desceu). Aparecem 50 de cada vez: **Mostrar mais** traz
  as seguintes.
- **Apagar** apaga logo, e mostra **Desfazer** no fundo do ecrã durante 10
  segundos. Passado esse tempo, a auditoria e as suas fotos saem de vez.

## Análise

Escolha o **serviço** (ou todos) e o **período** (todo o histórico, ou os
últimos 3, 6 ou 12 meses). Tudo na vista segue essa escolha:

- **Evolução da nota** — uma linha por serviço, ao longo do tempo;
- **Comparação entre serviços** — a média de cada um;
- **Pontos fracos por pilar 5S** e **Desempenho por responsável** — radares e
  barras com as médias.

**Relatório mensal.** Para a reunião com a direcção: escolha o **mês** e
carregue em **Abrir relatório mensal**. Mostra, para todos os serviços:

- a média do mês e a diferença face ao mês anterior;
- cada serviço, do pior para o melhor, com os que ficaram por auditar no fim;
- os pilares 5S e os responsáveis;
- as cinco perguntas que mais falharam, e em que serviços;
- o plano de acção (acções novas, concluídas, em aberto e em atraso);
- os serviços com a auditoria em atraso.

**Gerar PDF** imprime-o em duas folhas. No mês em curso, as acções e os prazos
contam até hoje.

## Cópias de segurança

Os dados só existem neste dispositivo. Faça cópias com regularidade e guarde-as
**noutro sítio** (computador, Drive, email).

| Botão (em Config → Dados) | O que gera | Para quê |
| --- | --- | --- |
| **Exportar histórico (JSON)** | Auditorias, serviços, pessoas, perguntas, responsáveis, frequências, acções e notas — **sem fotos** | Cópia leve, para fazer muitas vezes |
| **Exportar com fotos (JSON)** | O mesmo, **com todas as fotos** | Cópia completa: a que permite recuperar tudo |
| **Partilhar cópia com fotos** | A cópia completa, enviada pelo menu de partilha do telemóvel | Mandá-la logo para a Drive ou o email. Só aparece onde o browser o permite |
| **Exportar para Excel** | Folhas *Auditorias*, *Respostas* e *Acções* | Análise noutro programa. **Não** é uma cópia: não se importa de volta |

- **Lembrete.** A app avisa no topo quando nunca foi feita uma cópia, ou quando
  há auditorias por copiar há uma semana ou mais (ou cinco ou mais).
  *Lembrar amanhã* adia o aviso.
- **Fotos por copiar.** A cópia normal não leva fotos, por isso a app conta à
  parte as fotos novas ou trocadas desde a última cópia *com fotos*. Quando
  são cinco ou mais, ou passou uma semana, o aviso traz o botão **Exportar com
  fotos**. Uma cópia sem fotos não o faz desaparecer.
- **Recuperar.** *Importar histórico (JSON)* lê um destes ficheiros e pergunta:
  **Fundir** junta-o ao que existe, sem duplicar; **Substituir tudo** troca o
  histórico do dispositivo pelo do ficheiro (pede o código de acesso). As fotos
  de uma cópia *com fotos* vêm junto.
- **Config → Dados** mostra também o espaço ocupado — o das auditorias e o
  total da app, com as fotos — e se o browser protege os dados contra limpeza
  automática. Se disser *não concedida*, instale a app no ecrã principal.

## Configuração

- **Serviços** e **Frequência das auditorias** — ver
  [Antes de começar](#antes-de-começar). Remover um serviço ou uma pessoa
  mostra **Desfazer** no fundo do ecrã durante 10 segundos.
- **Responsáveis** — quem responde por cada pergunta; são os eixos do radar e
  os blocos de recomendações. Um responsável com perguntas, recomendações ou
  acções atribuídas não pode ser removido.
- **Editor de perguntas** — enunciados, pilares, responsáveis e limiares
  (pede o código de acesso). As auditorias já feitas mantêm as perguntas com
  que foram feitas.
- **Painel e-ink** — escolha a pasta partilhada onde a app grava o
  `5s.painel.json` (só no Chrome ou Edge de computador).

O **código de acesso** é pedido para editar auditorias, alterar os responsáveis,
abrir o editor de perguntas e substituir o histórico. Protege contra alterações
por engano — não é uma palavra-passe secreta.

O código de origem é o mesmo em todas as instalações e lê-se no código da app.
Em **Config → Código de acesso**, **Mudar código** troca-o por um só deste
dispositivo, de 4 a 8 algarismos: pede o actual e o novo duas vezes. O código
fica só no dispositivo — as cópias de segurança não o levam. **Voltar ao código
de origem** desfaz a escolha.

## Sem rede e actualizações

- **Sem rede**, a app abre e funciona por inteiro, incluindo a exportação e a
  importação de Excel, desde que tenha sido aberta uma vez com rede.
- **Quando há uma versão nova**, aparece *Nova versão disponível*. Carregue em
  **Recarregar agora**: a auditoria por terminar não se perde. (Se estiver a
  meio de editar uma auditoria já gravada, guarde-a antes.)
- A versão aparece no cabeçalho, ao lado de *Lista de verificação 5S*.

## Perguntas frequentes

**Apaguei uma auditoria por engano.** Carregue em **Desfazer** no aviso do fundo
do ecrã, nos 10 segundos seguintes. Depois disso, só uma cópia de segurança a
recupera.

**Partilhei a cópia e o ficheiro acaba em .txt.** É o Chrome, que não partilha
ficheiros .json. O conteúdo é o mesmo: importe-o tal como está.

**Mudei de telemóvel.** No antigo, *Exportar com fotos (JSON)*. No novo, abra a
app, *Importar histórico (JSON)* e escolha *Substituir tudo*.

**O telemóvel fechou a app a meio da auditoria.** Abra-a outra vez: as respostas
estão lá (cartão *Auditoria por terminar*).

**Não vejo o campo de nota e foto numa pergunta.** Só aparece quando a resposta
a classifica como Mau ou Oportunidade.

**Uma auditoria aparece em atraso, mas foi feita.** O prazo conta a partir da
última auditoria **gravada** a esse serviço. Confirme no Histórico que foi
gravada com o serviço e a data certos.

**Esqueci-me do código de acesso.** Em *Config → Dados*, *Exportar com fotos
(JSON)* (não pede código). Depois limpe os dados do site nas definições do
browser, abra a app e importe o ficheiro com *Fundir*. O código volta a ser o de
origem.

**O que significam as cores das notas?** Excelente a partir de 80, Com
oportunidade de 50 a 79, Crítico abaixo de 50.
