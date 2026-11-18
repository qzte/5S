<!--
  Auditoria 5S · Supermercados Kaizen — Guia de utilização
  Para quem audita e para quem acompanha as auditorias. O README.md é a
  documentação técnica (dados, segurança, testes, publicação).
  Escrito para a versão 4.8.0. Publicado com a app como guia.html, gerado
  por scripts/guia.mjs — depois de mudar este ficheiro: node scripts/guia.mjs É documentação: não muda com a versão do código
  a não ser que o funcionamento descrito mude.
-->

# Guia de utilização

Como usar a app no dia-a-dia: fazer uma auditoria, ler o relatório, seguir as
acções, acompanhar os indicadores e não perder dados. Este guia também está dentro da
app, em **Config → Ajuda**, e abre sem rede. Para os pormenores técnicos, ver o
[README](README.md); para o que mudou em cada versão, o [CHANGELOG](CHANGELOG.md).

- [Antes de começar](#antes-de-começar)
- [O fluxo de uma auditoria](#o-fluxo-de-uma-auditoria)
- [Fazer uma auditoria](#fazer-uma-auditoria)
- [Depois da auditoria](#depois-da-auditoria)
- [Quando não dá para acabar no serviço](#quando-não-dá-para-acabar-no-serviço)
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

## O fluxo de uma auditoria

A auditoria faz-se **toda no telemóvel, no serviço**. O PC só entra quando não
dá para a acabar lá.

1. **Escolher o serviço** e escrever **quem está presente** por cada
   responsável.
2. **Responder às perguntas.**
   - **Excelente**: passa à seguinte, não é preciso mais nada.
   - **Mau** ou **Com oportunidade**: tirar a **foto** (ou, sem foto, escrever
     o que se viu), escrever a **acção** e o **prazo**.
3. **Guardar auditoria.**
4. **Finalizar auditoria.** A app confirma que cada pergunta a melhorar tem
   acção com prazo e foto ou nota. Se faltar alguma coisa, diz o quê.
5. **Descarregar o PDF** — arrumado por responsável, cada pergunta com a foto
   e o plano de acção — e **enviar por email e/ou Teams**.
6. **Guardar cópia com fotos.**

Não deu para acabar no serviço? Depois de guardar, **Enviar para o PC**, e no
PC completa-se, finaliza-se e envia-se o PDF (ver
[Quando não dá para acabar no serviço](#quando-não-dá-para-acabar-no-serviço)).

## Fazer uma auditoria

No separador **Auditar**:

1. **Escolha o serviço.** Na caixa do serviço, escreva parte do nome ou o
   código: abre-se por baixo a lista dos que casam, com os serviços da lista
   (*Config → Serviços*) e, num grupo à parte, os que só existem em auditorias
   já feitas. Toque no serviço (ou use as setas e Enter). *Esc* fecha a lista
   sem mudar o serviço. A caixa começa vazia em cada auditoria nova: sem
   serviço escolhido, a app não grava.
2. **Quem está presente.** Por baixo, um campo por responsável (Utilizadores,
   Manutenção, Reposição, Utilizador e Repositor, Picking): escreva o nome de
   quem acompanha a auditoria por cada um. Vão para o relatório e para o PDF.
3. **Acções em aberto neste serviço.** Se auditorias anteriores deixaram acções
   por fazer, aparecem num cartão no topo. Verifique no local e marque **Feita**
   nas que ficaram resolvidas (ver [Plano de acção](#plano-de-acção)).
4. **Responda às 19 perguntas.** A nota vai sendo calculada em *Nota (auto)*.
   Em cada pergunta que a última auditoria ao serviço não deu como Excelente,
   aparece o que lhe deu, para saber o que procurar.
5. **Evidência e acção.** Numa pergunta classificada **Mau** ou
   **Oportunidade** aparecem a nota, a **acção**, o **prazo** e o botão
   **Foto**: escreva o que viu, o que é preciso fazer e até quando, e
   fotografe. Sem foto, a nota passa a ser obrigatória para finalizar.
   *Trocar foto* e *Remover foto* fazem o que dizem. A acção entra no plano de
   acção, com o responsável da pergunta. Numa pergunta Excelente não é preciso
   mais nada.
6. Carregue em **Guardar auditoria**. Abre o relatório, e a auditoria fica
   **por finalizar** (ver [Depois da auditoria](#depois-da-auditoria)). Gravar
   funciona sempre, mesmo que falte alguma acção, foto ou nota: o que falta só
   impede de finalizar. Se já houver uma
   auditoria ao mesmo serviço nesse dia, a app pergunta antes de gravar outra:
   se é a mesma, cancele e edite a do Histórico.

**Pode fechar a app a meio.** A auditoria por terminar — respostas, nomes,
notas, acções, prazos e fotos — fica guardada no dispositivo a cada alteração, e volta ao reabrir. O
cartão *Auditoria por terminar* diz quando foi guardada; **Descartar e começar
de novo** apaga-a. Só entra no Histórico ao carregar em *Guardar auditoria*.

## Depois da auditoria

Ao gravar, abre o relatório. No topo, o cartão **Depois da auditoria** diz o
que falta, e marca com ✓ o que já foi feito.

Enquanto a auditoria está **por finalizar**:

1. **Finalizar auditoria** — o passo normal, ali mesmo no serviço. Cada
   pergunta a melhorar precisa de acção com prazo e de foto ou nota. Se faltar
   alguma coisa, a app diz o quê («Nº 7 Caixas: sem acção») e oferece
   **Completar agora** (abre a auditoria para editar, sem código) ou **Enviar
   para o PC**. Com tudo completo, pede confirmação e finaliza.
2. **Não deu para acabar aqui? Enviar para o PC** — ver
   [Quando não dá para acabar no serviço](#quando-não-dá-para-acabar-no-serviço).

Depois de finalizada:

1. **Descarregar PDF** — o relatório num ficheiro, com o nome do serviço e da
   data, arrumado por responsável (ver [O relatório](#o-relatório)). A app
   cria-o sozinha; demora um ou dois segundos.
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

## Quando não dá para acabar no serviço

O caminho normal é finalizar no
telemóvel (ver [O fluxo de uma auditoria](#o-fluxo-de-uma-auditoria)). Se lá
não deu — faltou tempo, uma acção por decidir, uma foto —, acaba-se no
computador:

1. **No serviço, com o telemóvel**: responda às perguntas, feche as acções que
   ficaram resolvidas, tire as fotos **dentro da app** (botão **Foto** nas
   perguntas Mau ou Oportunidade) — assim vão já ligadas à pergunta — e escreva
   as acções e os prazos que já souber. Carregue em **Guardar auditoria**.
2. **Enviar para o PC**: no cartão *Depois da auditoria*, em *Não deu para
   acabar aqui?*, carregue em **Enviar para o PC** e escolha o email (também
   aparece na caixa *Falta completar* ao finalizar). Vai um ficheiro só com esta auditoria e as
   suas fotos (no Chrome termina em `.txt`; não faz mal).
3. **No PC**: guarde o anexo do email, abra a app, e em **Histórico →
   Importar ficheiro** escolha o ficheiro. Abre o relatório da auditoria, com
   as fotos, e as acções fechadas no terreno ficam fechadas também no PC.
   Em **Editar auditoria** — que não pede o código enquanto está por
   finalizar —, complete as acções e os prazos, as notas e as fotos. Carregue
   em **Finalizar auditoria**: a verificação é a mesma do telemóvel.
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

Abre ao gravar, ou em **Histórico → Relatório**.

O **PDF** (*Descarregar PDF* e os envios por email ou Teams) está arrumado por
responsável:

| Folha | Conteúdo |
| --- | --- |
| 1 | Nota, contagens, radares por pilar 5S e por responsável, a nota de cada responsável com quem esteve presente, e as acções que vinham em aberto de auditorias anteriores |
| 2 e seguintes | A grelha de verificação, por responsável (Utilizadores, Picking, Reposição, Utilizador e Repositor, Manutenção), só com as perguntas abaixo de Excelente. Cada pergunta leva a evidência (foto e nota) e o plano de acção (acção, responsável, prazo, estado), e nunca fica cortada entre folhas. As Excelentes contam-se no cabeçalho de cada responsável |

**Gerar PDF**, no fundo do relatório, imprime o relatório do ecrã como antes:
folha 1 com os radares e o histórico do serviço, folha 2 com a pontuação, a
grelha e o plano de acção, e as evidências numa folha à parte.

No ecrã (não vão para o PDF) há ainda:

- **Itens a melhorar** — as perguntas que não ficaram Excelentes, cada uma com
  o botão **+ Acção**.
- **Seguimento da auditoria anterior** — o que melhorou, o que se mantém por
  resolver e o que piorou face à auditoria anterior ao mesmo serviço.
- A **grelha de verificação** completa, com as perguntas Excelentes também.

**Editar auditoria** reabre-a no formulário (pede o código de acesso).

## Plano de acção

Uma **acção** é um passo concreto, com
**responsável**, **prazo** e **estado**, que se segue até estar feito.

- **Criar.** Na própria pergunta, ao auditar: numa pergunta Mau ou
  Oportunidade, escreva a **acção** e o **prazo**. Ao guardar, a acção entra no
  plano, com o responsável da pergunta. É esta acção que conta para
  finalizar. Para mais do que uma acção na mesma pergunta, no relatório,
  carregue em **+ Acção** num dos *Itens a melhorar* — o responsável e o
  número da pergunta vêm preenchidos. Também pode escrevê-la directamente em
  *Plano de acção* e carregar em **Acrescentar acção**, mas, sem número de
  pergunta, essa não conta para finalizar.
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

- **Gravar sozinha, na pasta partilhada** (Chrome ou Edge de computador). Em *Configuração →
  Cópia de segurança na pasta partilhada*, **Escolher pasta**, uma vez. Daí em diante, cada
  alteração é gravada em `auditoria5s_backup.json` uns segundos depois — o mesmo que *Exportar
  histórico (JSON)*, **sem fotos**. O lembrete abaixo passa a contar a pasta como cópia feita.
  Antes de substituir o ficheiro, a versão que lá estava fica em `copias-backup/` (30 dias).
- **Se outra pessoa gravou a cópia da pasta** depois da versão em que está a trabalhar, a gravação
  automática **pára** e aparece um aviso, em todos os ecrãs: **Abrir a versão da pasta…** (como
  *Importar*: **Fundir** junta, **Substituir tudo** troca) ou **Gravar por cima…** (pergunta
  primeiro; o que a outra pessoa gravou fica em `copias-backup/`). Não grave por cima sem falar com ela.
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
  A importação reconhece os serviços pelo código, mesmo com outra descrição, e
  diz no fim quais ficaram sem tipo (os que não estão no ficheiro). Só os
  serviços sem tipo mostram a caixa para o escolher. Na listagem do sistema,
  **HPH** conta como Interno e **ACES** como Externo, e a importação pergunta
  se quer **substituir a lista** pela do ficheiro (recomendado: a lista fica
  igual à listagem) ou juntar à actual. As auditorias já feitas não mudam. Remover um serviço ou uma pessoa
  mostra **Desfazer** no fundo do ecrã durante 10 segundos.
- **Objectivo anual de auditorias** — quantas auditorias fazer em cada ano, de
  todos os serviços. Escolha o ano e escreva o número; apague-o para ficar sem
  objectivo.
- **Responsáveis** — quem responde por cada pergunta; são os eixos do radar.
  Um responsável com perguntas, recomendações antigas ou acções atribuídas não
  pode ser removido.
- **Editor de perguntas** — enunciados, pilares, responsáveis e limiares
  (pede o código de acesso). As auditorias já feitas mantêm as perguntas com
  que foram feitas.
- **Cópia de segurança na pasta partilhada** — a pasta onde a app grava a cópia sozinha (ver
  [cópias de segurança](#cópias-de-segurança)); pode desligar-se, e «Gravar agora» grava já.
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

**A cópia com fotos foi descarregada em vez de partilhada.** O menu de partilha
do telemóvel não aceita ficheiros com mais de 50 MB, e a cópia com as fotos de
todas as auditorias pode passar disso. A app descarrega-a e diz porquê: envie-a
das Transferências para a Drive, o OneDrive ou o email.

**Partilhei a cópia e o ficheiro acaba em .txt.** É o Chrome, que não partilha
ficheiros .json. O conteúdo é o mesmo: importe-o tal como está.

**As acções que criei no PC não aparecem no telemóvel.** O telemóvel só as
conhece depois de importar o ficheiro *Enviar para o telemóvel* do PC. Ver
[Do telemóvel para o PC](#quando-não-dá-para-acabar-no-serviço).

**Mudei de telemóvel.** No antigo, *Exportar com fotos (JSON)*. No novo, abra a
app, *Importar cópia de segurança* e escolha *Substituir tudo*.

**O telemóvel fechou a app a meio da auditoria.** Abra-a outra vez: as respostas
estão lá (cartão *Auditoria por terminar*).

**Não vejo os campos de nota, acção, prazo e foto numa pergunta.** Só aparecem
quando a resposta a classifica como Mau ou Oportunidade.

**Ao finalizar, a app diz «Falta completar».** Em cada pergunta Mau ou
Oportunidade tem de haver uma acção com prazo e uma foto ou uma nota. A caixa
diz em que perguntas falta o quê. **Completar agora** abre a auditoria para
editar (sem código); **Enviar para o PC** manda-a para acabar no computador.

**Não consegui tirar foto.** Escreva na nota o que viu: com nota, a foto deixa
de ser precisa para finalizar.

**A acção que escrevi no plano não conta.** Uma acção escrita directamente em
*Plano de acção* não está ligada a nenhuma pergunta. Escreva-a na própria
pergunta (em *Editar auditoria*) ou use **+ Acção** em *Itens a melhorar*.

**Onde estão a frequência e os prazos das auditorias?** Saíram em 4.0.0, com o
email de cada serviço. O ritmo das auditorias segue-se agora pelo objectivo
anual, nos [indicadores do ano](#indicadores-do-ano).

**Esqueci-me do código de acesso.** Em *Config → Dados*, *Exportar com fotos
(JSON)* (não pede código). Depois limpe os dados do site nas definições do
browser, abra a app e importe o ficheiro com *Fundir*. O código volta a ser o de
origem.

**O que significam as cores das notas?** Excelente a partir de 80, Com
oportunidade de 50 a 79, Crítico abaixo de 50.
