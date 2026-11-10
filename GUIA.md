<!--
  Auditoria 5S · Supermercados Kaizen — Guia de utilização
  Para quem audita e para quem acompanha as auditorias. O README.md é a
  documentação técnica (dados, segurança, testes, publicação).
  Escrito para a versão 3.27.0. Publicado com a app como guia.html, gerado
  por scripts/guia.mjs — depois de mudar este ficheiro: node scripts/guia.mjs É documentação: não muda com a versão do código
  a não ser que o funcionamento descrito mude.
-->

# Guia de utilização

Como usar a app no dia-a-dia: fazer uma auditoria, ler o relatório, seguir as
acções, acompanhar os indicadores e não perder dados. Este guia também está dentro da
app, em **Config → Ajuda**, e abre sem rede. Para os pormenores técnicos, ver o
[README](README.md); para o que mudou em cada versão, o [CHANGELOG](CHANGELOG.md).

- [Antes de começar](#antes-de-começar)
- [Fazer uma auditoria](#fazer-uma-auditoria)
- [Depois da auditoria](#depois-da-auditoria)
- [Do telemóvel para o PC](#do-telemóvel-para-o-pc)
- [O relatório](#o-relatório)
- [Plano de acção](#plano-de-acção)
- [Histórico](#histórico)
- [Análise](#análise)
- [Indicadores do ano](#indicadores-do-ano)
- [Cópias de segurança](#cópias-de-segurança)
- [Configuração](#configuração)
- [Sem rede e actualizações](#sem-rede-e-actualizações)
- [Perguntas frequentes](#perguntas-frequentes)

## Antes de começar

1. No telemóvel, com a app aberta no browser, escolha *Adicionar ao ecrã
   principal*. Instalada, a app abre como as outras, funciona sem rede e o
   browser protege melhor os dados (ver [Cópias de segurança](#cópias-de-segurança)).
2. Em **Config → Serviços**, acrescente os supermercados a auditar (ou importe-os
   de um Excel em *Importar Excel*, por exemplo a listagem de serviços do
   sistema, com `ID_SERVICO`, `DESCRICAO_SERVICO`, `LOCAL_SERVICO` e
   `SERVICO_ATIVO`: o local dá o tipo e os inactivos ficam de fora) e diga, para cada um, se é **Interno** ou
   **Externo**.
3. Em **Config → Objectivo anual de auditorias**, escreva quantas auditorias
   quer fazer no ano. São os dois dados de que os
   [indicadores do ano](#indicadores-do-ano) precisam.

Os dados ficam **só neste dispositivo**. Não há conta nem servidor: quem tiver o
telemóvel tem as auditorias, e quem o perder perde-as — a menos que tenha uma
[cópia de segurança](#cópias-de-segurança).

## Fazer uma auditoria

No separador **Auditar**:

1. **Escolha o serviço.** Na caixa do serviço, escreva parte do nome ou o
   código: abre-se por baixo a lista dos que casam, com os serviços da lista
   (*Config → Serviços*) e, num grupo à parte, os que só existem em auditorias
   já feitas. Toque no serviço (ou use as setas e Enter). *Esc* fecha a lista
   sem mudar o serviço.
2. **Acções em aberto neste serviço.** Se auditorias anteriores deixaram acções
   por fazer, aparecem num cartão no topo. Verifique no local e marque **Feita**
   nas que ficaram resolvidas (ver [Plano de acção](#plano-de-acção)).
3. **Responda às 19 perguntas.** A nota vai sendo calculada em *Nota (auto)*.
   Em cada pergunta que a última auditoria ao serviço não deu como Excelente,
   aparece o que lhe deu, para saber o que procurar.
4. **Evidência.** Numa pergunta classificada **Mau** ou **Oportunidade**
   aparecem um campo de nota e o botão **Foto**: escreva o que viu e fotografe.
   *Trocar foto* e *Remover foto* fazem o que dizem.
5. Carregue em **Guardar auditoria**. Abre o relatório, e a auditoria fica
   **por finalizar** (ver [Do telemóvel para o PC](#do-telemóvel-para-o-pc)). Se já houver uma
   auditoria ao mesmo serviço nesse dia, a app pergunta antes de gravar outra:
   se é a mesma, cancele e edite a do Histórico.

**Pode fechar a app a meio.** A auditoria por terminar — respostas, nomes, notas
e fotos — fica guardada no dispositivo a cada alteração, e volta ao reabrir. O
cartão *Auditoria por terminar* diz quando foi guardada; **Descartar e começar
de novo** apaga-a. Só entra no Histórico ao carregar em *Guardar auditoria*.

## Depois da auditoria

Ao gravar, abre o relatório. No topo, o cartão **Depois da auditoria** diz o
que falta, e marca com ✓ o que já foi feito.

Enquanto a auditoria está **por finalizar**:

1. **Enviar para o PC** — ver [Do telemóvel para o PC](#do-telemóvel-para-o-pc).
2. **Finalizar auditoria** — depois de completar as recomendações, o plano de
   acção e o que faltar. Se fizer tudo no mesmo dispositivo, carregue logo
   aqui.

Depois de finalizada:

1. **Descarregar PDF** — o relatório num ficheiro, com o nome do serviço e da
   data. A app cria-o sozinha; demora um ou dois segundos.
2. **Enviar por email** ou **Enviar para o Teams** — abre o menu de partilha
   com o PDF e um resumo da auditoria (nota, comparação com a anterior, pior
   pilar, acções). Escolha lá o Outlook, o Gmail ou o Teams, e a pessoa, a
   conversa ou o canal.
3. **Guardar cópia com fotos** — a cópia de segurança completa, de todas as
   auditorias. Abre o menu de partilha: mande-a para a Drive, o OneDrive, o
   email ou o Teams. Onde não há menu de partilha, descarrega o ficheiro —
   guarde-o noutro sítio.

No computador, se o browser não tiver menu de partilha, o PDF é descarregado e
abre-se o email já escrito (anexe o PDF à mão) ou o resumo fica copiado para
colar no Teams. O Histórico mostra, em cada auditoria, se está **por
finalizar**, já foi **enviada** ou está **por enviar**.

## Do telemóvel para o PC

Para auditar no serviço com o telemóvel e acabar o trabalho no computador:

1. **No serviço, com o telemóvel**: responda às perguntas, feche as acções que
   ficaram resolvidas e tire as fotos **dentro da app** (botão **Foto** nas
   perguntas Mau ou Oportunidade) — assim vão já ligadas à pergunta. Carregue
   em **Guardar auditoria**.
2. **Enviar para o PC**: no cartão *Depois da auditoria*, carregue em **Enviar
   para o PC** e escolha o email. Vai um ficheiro só com esta auditoria e as
   suas fotos (no Chrome termina em `.txt`; não faz mal).
3. **No PC**: guarde o anexo do email, abra a app, e em **Histórico →
   Importar ficheiro** escolha o ficheiro. Abre o relatório da auditoria, com
   as fotos, e as acções fechadas no terreno ficam fechadas também no PC.
   Complete as recomendações (texto e foto), o plano de acção e, em **Editar
   auditoria** — que não pede o código enquanto está por finalizar —, a
   observação, as notas e as fotos. Carregue em **Finalizar auditoria**.
4. **PDF e email ao serviço**: *Descarregar PDF* e *Enviar por email*; o
   destinatário escolhe-se no Outlook ou no Gmail.
5. **Cópia de segurança**: *Guardar cópia com fotos*, no PC.

No telemóvel, **Enviar para o PC** conta como cópia de segurança, desde que
tudo o que lá mudou já tenha ido para o PC: o lembrete de cópia desaparece. Se
ficou alguma auditoria por enviar, continua a aparecer.

Se importar o mesmo ficheiro outra vez, nada se perde: fica a versão mais
recente.

**O telemóvel a par do PC.** De vez em quando — por exemplo antes de sair para
auditar —, no PC, em **Config → Dados**, carregue em **Enviar para o
telemóvel** e mande o ficheiro para o seu email. No telemóvel, abra-o em
**Histórico → Importar ficheiro** e carregue em **Actualizar**. O telemóvel
fica com as auditorias finalizadas, as acções criadas ou fechadas no PC, as
o tipo dos serviços, o objectivo anual e as perguntas do PC. As auditorias que
ainda só estão no telemóvel ficam. O ficheiro não leva fotos: é leve.

**Libertar espaço no telemóvel.** Depois de actualizado, *Config → Dados*
oferece **Apagar fotos que já estão no PC**: as das auditorias que enviou daqui
e foram finalizadas no PC. As auditorias ficam; as fotos ficam só no PC (e na
cópia de segurança de lá).

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

## Histórico

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
- o plano de acção (acções novas, concluídas, em aberto e em atraso).

**Gerar PDF** imprime-o em duas folhas. No mês em curso, as acções contam até
hoje.

## Indicadores do ano

No topo da **Análise**, o cartão **Indicadores do ano** mede as auditorias de
todos os serviços no ano escolhido (por omissão, o actual). Não segue o serviço
nem o período escolhidos por cima.

- **Média total** — a média de todas as auditorias do ano.
- **Serviços abaixo da média — para o plano de acção** — os serviços cuja média
  no ano ficou abaixo da média total, do pior para o melhor, com quantos pontos
  estão abaixo e quantas acções têm em aberto. **Plano de acção** abre o
  relatório da última auditoria a esse serviço, onde se acrescentam acções.
- **Objectivo anual** — as auditorias feitas face ao objectivo (em
  *Config → Objectivo anual de auditorias*), em percentagem, e quantas faltam.
- **Média semanal** — as auditorias por semana desde 1 de Janeiro (ou no ano
  inteiro, num ano que já acabou), ao lado das que o objectivo pede por semana.
- **Face ao plano** — quantas auditorias estão a mais (+) ou a menos (−) face às
  que já deviam estar feitas, na proporção do ano decorrido: *Em linha com o
  plano*, *Atrás do plano* ou *Objectivo cumprido*. Por baixo, quantas se fazem
  até ao fim do ano ao ritmo actual, e quantas são precisas por semana para
  cumprir o objectivo.
- **Serviços auditados** — os serviços **internos** auditados no ano face a
  todos os internos, e o mesmo para os **externos**, com os que faltam auditar.
  Os serviços sem tipo não entram: a app diz quantos são.

## Cópias de segurança

Os dados só existem neste dispositivo. Faça cópias com regularidade e guarde-as
**noutro sítio** (computador, Drive, email).

| Botão (em Config → Dados) | O que gera | Para quê |
| --- | --- | --- |
| **Exportar histórico (JSON)** | Auditorias, serviços e o tipo de cada um, pessoas, perguntas, responsáveis, objectivo anual, acções e notas — **sem fotos** | Cópia leve, para fazer muitas vezes |
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
- **Recuperar.** *Importar cópia de segurança* lê um destes ficheiros e pergunta:
  **Fundir** junta-o ao que existe, sem duplicar; **Substituir tudo** troca o
  histórico do dispositivo pelo do ficheiro (pede o código de acesso). As fotos
  de uma cópia *com fotos* vêm junto.
- **Config → Dados** mostra também o espaço ocupado — o das auditorias e o
  total da app, com as fotos — e se o browser protege os dados contra limpeza
  automática. Se disser *não concedida*, instale a app no ecrã principal.

## Configuração

- **Serviços** — a lista, e o **tipo** de cada um (Interno ou Externo), para os
  [indicadores do ano](#indicadores-do-ano). O tipo vem do Excel (`LOCAL_SERVICO`)
  e lê-se ao lado do serviço; para o mudar, importe de novo o Excel corrigido.
  Só os serviços sem tipo mostram a caixa para o escolher. Remover um serviço ou uma pessoa
  mostra **Desfazer** no fundo do ecrã durante 10 segundos.
- **Objectivo anual de auditorias** — quantas auditorias fazer em cada ano, de
  todos os serviços. Escolha o ano e escreva o número; apague-o para ficar sem
  objectivo.
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

**As acções que criei no PC não aparecem no telemóvel.** O telemóvel só as
conhece depois de importar o ficheiro *Enviar para o telemóvel* do PC. Ver
[Do telemóvel para o PC](#do-telemóvel-para-o-pc).

**Mudei de telemóvel.** No antigo, *Exportar com fotos (JSON)*. No novo, abra a
app, *Importar cópia de segurança* e escolha *Substituir tudo*.

**O telemóvel fechou a app a meio da auditoria.** Abra-a outra vez: as respostas
estão lá (cartão *Auditoria por terminar*).

**Não vejo o campo de nota e foto numa pergunta.** Só aparece quando a resposta
a classifica como Mau ou Oportunidade.

**Onde estão a frequência e os prazos das auditorias?** Saíram em 4.0.0, com o
email de cada serviço. O ritmo das auditorias segue-se agora pelo objectivo
anual, nos [indicadores do ano](#indicadores-do-ano).

**Esqueci-me do código de acesso.** Em *Config → Dados*, *Exportar com fotos
(JSON)* (não pede código). Depois limpe os dados do site nas definições do
browser, abra a app e importe o ficheiro com *Fundir*. O código volta a ser o de
origem.

**O que significam as cores das notas?** Excelente a partir de 80, Com
oportunidade de 50 a 79, Crítico abaixo de 50.
