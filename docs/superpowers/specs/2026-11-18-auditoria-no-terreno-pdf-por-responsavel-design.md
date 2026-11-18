# Auditoria completa no telemóvel e PDF por responsável — desenho

Data: 18/11/2026 · Versão de partida: 4.7.1 · Versão prevista: 4.8.0
Maqueta aprovada do PDF: https://claude.ai/artifact/2v6e8U1Lw3VBHesQ4WCMmG (versão 3)

## Porquê

Hoje a auditoria grava-se no telemóvel «por finalizar», as acções escrevem-se
depois, no relatório, e o caminho previsto é acabá-la no PC. Quem audita quer
**fazer tudo no serviço, com o telemóvel**: responder, fotografar, escrever a
acção de cada falha, e enviar logo o PDF ao serviço por email ou Teams. O PC
fica para quando, por algum motivo, a auditoria não fica acabada no local.

O PDF actual separa a grelha, o plano de acção e as evidências em partes
diferentes. Quem o recebe quer ver, **por responsável**, cada pergunta que
falhou com a sua evidência e a sua acção, juntas.

## O fluxo pedido

1. Escolher o serviço e escrever quem está presente por cada responsável.
2. Responder às perguntas.
   - Excelente: não pede mais nada.
   - Mau ou Com oportunidade: foto, nota do que se viu, acção e prazo, ali mesmo.
3. Finalizar no telemóvel.
4. Gerar o PDF (o da maqueta) e enviar por email e/ou Teams.
5. Se não der para acabar no serviço: Enviar para o PC, completar e finalizar lá
   (o caminho que já existe).

## Objectivos

- Escrever a acção (texto e prazo) de cada pergunta Mau ou Com oportunidade
  dentro do próprio formulário.
- Pedir, no início, o nome de quem está presente por cada responsável.
- Finalizar só quando cada pergunta Mau ou Com oportunidade tem acção com
  prazo **e** foto ou nota escrita.
- Um PDF novo, igual à maqueta, com os radares e a grelha agrupada por
  responsável, só com as perguntas abaixo de Excelente.
- Pôr «Finalizar» como passo normal no telemóvel, com «Enviar para o PC» como
  alternativa.

## Fora do âmbito

- A pontuação, as perguntas, os limiares, a Análise, os indicadores, o
  relatório mensal e o painel e-ink não mudam.
- O relatório no ecrã não muda, a não ser o cartão «Depois da auditoria».
- Os outros pontos a rever do `FLUXO.md` (fusão por registo inteiro, relógio
  dos dispositivos, `tocar()` nos envios, rascunho em edição, fotos em segundo
  plano) ficam para outro trabalho. O ponto 3 (finalizar sem verificar) fica
  resolvido por este.
- Nada vai para a `main` antes de ser testado no PC (ver Teste).

## O que não pode acontecer

- Perder ou estragar auditorias já gravadas, ou deixá-las sem relatório ou PDF.
- Impedir de **gravar** uma auditoria por faltar uma foto ou uma acção: no
  serviço, gravar tem de funcionar sempre; o que falta impede só de finalizar.
- Um PDF que só funciona com rede: continua a sair offline, como hoje.

## Abordagens consideradas

| | Abordagem | Ganha | Perde |
| --- | --- | --- | --- |
| **A — escolhida** | Uma vista própria para o PDF, que não aparece no ecrã; o PDF é desenhado a partir dela | O PDF fica exactamente como a maqueta; o relatório do ecrã continua a servir para trabalhar | Duas vistas da mesma auditoria a manter |
| B | Mudar o relatório do ecrã para ficar como a maqueta | Uma só vista | O ecrã perde a grelha completa e o seguimento, ou o PDF deixa de ser a maqueta |
| C | Desenhar o PDF linha a linha (jsPDF) | Texto nítido, ficheiro leve | Muito mais trabalho; mudar a arrumação torna-se caro |

Escolhida pelo utilizador: **A**.

## Desenho

### 1. Quem está presente (formulário)

- Os campos *Picking* e *Repositor* do cabeçalho dão lugar a **um campo por
  responsável**, pela lista de *Config → Responsáveis* (de origem: Utilizadores,
  Manutenção, Reposição, Utilizador e Repositor, Picking), com a mesma lista de
  sugestões de nomes (`dl-people`).
- *Verificador* e *Nota / observação* ficam.
- Grava-se em `presentes: {<código do responsável>: "nome"}`, só com os
  preenchidos. Limpo por `clean(…,120)`, como os nomes de hoje.
- Auditorias antigas mantêm `pick` e `repo`. O relatório do ecrã e o PDF
  mostram os `presentes` quando os há; senão, «Picking: … · Repositor: …» como
  hoje. Ao editar uma auditoria antiga, os campos novos começam vazios e `pick`
  e `repo` ficam como estão.
- Os nomes preenchidos entram na lista de pessoas (`people`), como hoje.

### 2. A acção dentro da pergunta (formulário)

- Na caixa de evidência que já aparece nas perguntas Mau ou Com oportunidade
  (nota + foto), juntam-se dois campos: **Acção** (texto, até 300 caracteres) e
  **Prazo** (data).
- Uma acção por pergunta no formulário. Mais acções para a mesma pergunta
  continuam a poder ser acrescentadas no relatório (*+ Acção*).
- Ao gravar, cada acção escrita vai para `a.acoes`, com `item` = número da
  pergunta, `r` = responsável da pergunta, `estado: "aberta"`, `criadaEm` = data
  da auditoria — o mesmo formato de hoje, por `sanitizeAcoes()`. O separador
  Acções, o seguimento e o relatório mensal passam a vê-las sem mudanças.
- Ao editar: o campo mostra a primeira acção desta auditoria com esse `item`, e
  guardar escreve por cima dela (texto e prazo). Se a pergunta passar a
  Excelente, uma acção aberta ligada a ela sai; uma já feita fica.
- Uma acção só com texto grava-se (sem prazo). Faltar o prazo só impede de
  finalizar (ver 4).
- O **rascunho** guarda também a acção e o prazo de cada pergunta, pela
  assinatura da pergunta, como já faz com as notas.

### 3. Gravar

Sem mudanças nas regras: serviço, todas as respostas e data. A auditoria
grava-se «por finalizar» (`fase: "terreno"`), como hoje. Não se exige foto,
nota nem acção para gravar.

### 4. Finalizar

- Função pura `faltasParaFinalizar(a, comFoto)`: para cada pergunta Mau ou Com
  oportunidade, devolve o que falta — «sem acção», «acção sem prazo», «sem foto
  nem nota». `comFoto` é o conjunto de índices com foto gravada.
- *Finalizar auditoria*: se faltar alguma coisa, abre uma caixa com a lista
  («Nº 7 Caixas: sem acção») e dois botões: **Completar agora** (abre *Editar
  auditoria*, sem código enquanto está por finalizar) e **Enviar para o PC**.
  Sem faltas, pede confirmação e finaliza.
- Vale para qualquer auditoria por finalizar, incluindo as gravadas antes desta
  versão. As já finalizadas não são verificadas.

### 5. Cartão «Depois da auditoria» (por finalizar)

Passa a ter, por esta ordem:

1. **Finalizar auditoria** (botão principal), com a frase «Com tudo completo:
   acção com prazo e foto ou nota em cada pergunta a melhorar».
2. **Não deu para acabar aqui? Enviar para o PC** (botão secundário).

Depois de finalizada, fica como hoje: PDF, enviar por email ou Teams, cópia de
segurança.

### 6. O PDF novo

Uma vista escondida, `#view-pdf`, construída por `pdfHTML(a, fotos)` só quando
se pede o PDF, e desenhada por `pdfDoRelatorio()` com o mesmo processo de hoje
(html2canvas + jsPDF, folhas A4, offline). O relatório mensal continua a usar a
sua própria vista, sem mudanças.

**Folha 1 — resumo** (como a maqueta):

- Serviço, data, verificador e observação (se houver).
- **Nota grande** (cerca de 76 px na folha), a faixa (Crítico abaixo de 50,
  Com oportunidade de 50 a 79, Excelente 80 ou mais) e a diferença face à
  auditoria anterior ao serviço.
- Contagens: Excelente, Com oportunidade, Mau, acções novas.
- **Os dois radares**: por pilar 5S e por responsável (os mesmos cálculos de
  hoje, `byPillar` e `byResp`).
- Tabela por responsável: nome de quem esteve presente, perguntas, a melhorar,
  nota com barra.
- Acções em aberto de auditorias anteriores ao serviço (se houver).
- Linha com a legenda da pontuação.

**Folhas seguintes — grelha de verificação por responsável:**

- Um grupo por responsável que tenha perguntas na auditoria, pela ordem
  Utilizador(es), Picking, Reposição, Utilizador e Repositor, Manutenção; os
  responsáveis acrescentados na Configuração vêm depois.
- Cabeçalho do grupo: nome do responsável, quem esteve presente, nota do bloco
  (grande) e «N a melhorar · M Excelente(s)».
- **Só as perguntas Mau ou Com oportunidade.** Cada uma: número, tema,
  critério, valor observado, classificação; por baixo, a **evidência** (foto e
  nota) e o **plano de acção** (cada acção desta auditoria ligada à pergunta:
  texto, responsável, prazo, estado).
- Um grupo sem perguntas a melhorar mostra uma linha: «Todas as perguntas
  deste responsável ficaram Excelentes».
- Acções desta auditoria sem pergunta associada aparecem no fim do grupo do seu
  responsável, como «Outras acções».
- Sem assinaturas.
- Quebras de folha: cada pergunta (linha + evidência + acção) nunca se corta;
  se não couber, passa inteira para a folha seguinte, e o cabeçalho do grupo
  vai sempre com a primeira pergunta.
- O PDF sai sempre em claro; cabeçalho e rodapé com «Folha X de Y» como na
  maqueta.

### 7. Outros sítios que lêem os nomes

- **Exportação para Excel**: colunas novas, uma por responsável, com quem
  esteve presente; *Picking* e *Repositor* ficam para as auditorias antigas.
- **Importação / exportação JSON e Enviar para o PC**: `presentes` passa por
  `sanitizeAudit()` (só códigos de responsáveis conhecidos, nomes limpos).
- **Resumo do email/Teams** (`resumoEnvio`): sem mudanças.

### 8. Versão e documentação

4.8.0 em `APP_VERSION`, `sw.js` e onde a CI confere a coerência; `CHANGELOG.md`,
`GUIA.md` (e `guia.html` por `node scripts/guia.mjs`), `README.md` e
`FLUXO.md` actualizados.

## Testes

**Automáticos (correm aqui e na CI):**

- Unitários (`node --test`): `faltasParaFinalizar`; passagem das acções do
  formulário para `a.acoes` (nova, edição, pergunta que passa a Excelente);
  `presentes` em `sanitizeAudit`, rascunho e importação; ordem dos grupos do
  PDF; auditorias antigas sem `presentes` nem acções.
- Browser (Playwright): auditoria completa no formulário com acções → gravar →
  finalizar → PDF com as folhas esperadas; finalizar com faltas mostra a lista;
  rascunho repõe acções após recarregar; os smoke tests existentes de PDF,
  envio, terreno e evidências actualizados e a passar.

**No PC, pelo utilizador, antes de ir para a `main`:**

1. Descarregar o ramo do GitHub (*Code → Download ZIP*, com o ramo escolhido)
   e descompactar.
2. Na pasta, correr `python3 -m http.server 8000` (ou `py -m http.server 8000`
   no Windows) e abrir `http://localhost:8000` no Chrome ou no Edge.
3. Os dados ficam à parte da app verdadeira. Para testar com dados reais:
   exportar uma cópia em `qzte.github.io/5S/` e importá-la aqui.
4. Fazer uma auditoria completa (fotos pelo explorador de ficheiros), finalizar,
   gerar o PDF, e experimentar o caminho «Enviar para o PC».

O pull request fica em rascunho, marcado para não integrar, até o utilizador
dizer que testou.

## Decisões tomadas por mim (para confirmar)

1. «Avança para a próxima» numa resposta Excelente = não pede mais campos; o
   formulário não salta sozinho para a pergunta seguinte.
2. Verificador e Nota / observação continuam no início.
3. Uma acção por pergunta no formulário; mais no relatório.
4. A ordem dos grupos no PDF segue a que indicou, não a da Configuração.
5. O prazo não vem pré-preenchido.
6. Finalizar pede confirmação mesmo sem faltas.
7. A verificação ao finalizar aplica-se também às auditorias por finalizar
   gravadas antes desta versão.
