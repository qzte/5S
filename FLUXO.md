<!--
  Auditoria 5S · Supermercados Kaizen — Fluxo de uma auditoria
  Fluxograma (Mermaid, que o GitHub desenha) do caminho de uma auditoria, do
  formulário no telemóvel ao PDF enviado e à cópia de segurança. Escrito para a
  versão 4.8.0. Os nomes entre parênteses são funções de index.html.
-->

# Fluxo de uma auditoria

Do formulário no telemóvel, no serviço, até ao PDF enviado e à cópia de
segurança. Para o uso no dia-a-dia, ver o [Guia](GUIA.md); para os pormenores
técnicos, o [README](README.md).

- [Estados](#estados)
- [Fluxograma](#fluxograma)
- [Pontos a rever](#pontos-a-rever)

## Estados

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Rascunho: primeira resposta
    Rascunho --> PorFinalizar: Guardar auditoria
    PorFinalizar --> PorFinalizar: Enviar para o PC (envios.pc)
    PorFinalizar --> Finalizada: Finalizar auditoria
    Finalizada --> Enviada: email ou Teams (envios.email, envios.teams)
    Rascunho --> [*]: Descartar e começar de novo

    Rascunho: Rascunho (RASCUNHO_KEY)
    PorFinalizar: Por finalizar (fase = "terreno")
    Finalizada: Finalizada (finalizada, finalizadaPor)
    Enviada: Enviada
```

As auditorias gravadas antes de 3.25.0 não têm `fase` e contam como
finalizadas.

## Fluxograma

O caminho normal (4.8.0) é fazer tudo no telemóvel, no serviço: nomes por
responsável, acção e prazo em cada pergunta a melhorar, finalizar e enviar o
PDF. O PC fica para quando não dá para acabar lá. Os nós com contorno verde
grosso são o que mudou na 4.8.0; os nós a laranja, com ⚠ e um número, são os
[pontos a rever](#pontos-a-rever). As setas a tracejado são caminhos opcionais.

```mermaid
flowchart TB
    subgraph TEL["Telemóvel · no serviço (caminho normal)"]
        direction TB
        S1(["Nova auditoria (Auditar)"])
        D1{"Há rascunho<br/>guardado?"}
        R1["Repor o rascunho<br/>respostas, nomes, acções, fotos"]
        P1["Escolher o serviço<br/>obrigatório desde 4.2.6"]
        P1b["Quem está presente<br/>um nome por responsável (4.8.0)"]
        P2["Acções em aberto do serviço<br/>marcar Feita no local"]
        P3["Responder às perguntas<br/>Excelente: passa à seguinte"]
        P4["Mau ou Oportunidade<br/>nota + foto<br/>acção e prazo"]
        DS[("Rascunho automático<br/>localStorage + IndexedDB")]
        P5["Guardar auditoria"]
        D2{"Serviço, todas as<br/>respostas e data?"}
        D3{"Já há auditoria ao<br/>serviço neste dia?"}
        Q1["Pede confirmação<br/>«Gravar também»?"]
        T2(["Cancela e edita<br/>a do Histórico"])
        P6["⚠6 Gravar: fase = terreno<br/>alterada = agora · fotos à parte<br/>(gravarEvidencias)"]
        P7["Relatório<br/>acções já no plano de acção"]
        D4{"Deu para acabar<br/>no serviço?"}
        F1[/"Enviar para o PC (enviarParaPC)<br/>.json: auditoria + fotos<br/>+ acções feitas no terreno"/]
        V1{"Acção com prazo e<br/>foto ou nota em cada<br/>pergunta a melhorar?"}
        M1["Finalizar auditoria<br/>pede confirmação"]
        U1["⚠1 Importar actualização do PC<br/>«Enviar para o telemóvel», sem fotos<br/>o mais recente ganha"]

        S1 --> D1
        D1 -- Sim --> R1 --> P1
        D1 -- Não --> P1
        P1 --> P1b --> P2 --> P3
        P3 -- Mau / Oportunidade --> P4 --> P5
        P3 -- nada a melhorar --> P5
        P3 -. a cada alteração .-> DS
        P4 -. a cada alteração .-> DS
        P5 --> D2
        D2 -- "Não: aviso, formulário intacto" --> P3
        D2 -- Sim --> D3
        D3 -- Sim --> Q1
        Q1 -- Cancelar --> T2
        Q1 -- Gravar também --> P6
        D3 -- Não --> P6
        P6 --> P7 --> D4
        D4 -- Sim --> V1
        V1 -- Sim --> M1
        V1 -- "Não: completar na pergunta (Editar)" --> P4
        V1 -- "Não: enviar para o PC" --> F1
        D4 -- Não --> F1
    end

    subgraph PC["PC · alternativa"]
        direction TB
        I1["Histórico → Importar ficheiro<br/>só funde, nunca substitui tudo"]
        I2["⚠1 ⚠2 Fundir (planoFusao)<br/>nova · actualizar se mais recente<br/>igual: fica a de casa"]
        I3["Fechar acções feitas no terreno<br/>(aplicarAcoesFeitas), nunca reabre"]
        I4["⚠5 Completar a auditoria<br/>Editar sem código: acções, prazos,<br/>notas e fotos"]
        I5["Finalizar auditoria<br/>mesma verificação e confirmação"]
        I1 --> I2 --> I3 --> I4 --> I5
    end

    subgraph FIM["Depois de finalizada"]
        direction LR
        B1["⚠4 PDF por responsável (pdfDaAuditoria)<br/>radares + grelha com evidência e plano"]
        B2["Enviar por email<br/>ou para o Teams"]
        B3["Guardar cópia<br/>com fotos"]
        B4(["Concluída"])
        B1 --> B2 --> B3 --> B4
    end

    F1 -- email --> I1
    I5 -. Enviar para o telemóvel .-> U1
    M1 --> B1
    I5 --> B1

    classDef risco fill:#fde8dc,stroke:#c2410c,stroke-width:2px,color:#1c2321
    classDef chave fill:#1d6b57,stroke:#1d6b57,color:#ffffff
    classDef auto fill:#f5f6f4,stroke:#5d6865,stroke-dasharray:4 3,color:#1c2321
    class P6,U1,I2,I4,B1 risco
    classDef novo stroke:#1d6b57,stroke-width:3px
    class P5 chave
    class DS auto
    class P1b,P4,V1,M1,I5 novo
```

## Pontos a rever

| # | O que acontece | Onde | Efeito | Sugestão | Peso |
| --- | --- | --- | --- | --- | --- |
| 1 | A fusão substitui o registo inteiro pela versão mais recente. | `planoFusao()`, importação | Se o telemóvel e o PC alteram a mesma auditoria depois do envio, uma das alterações perde-se sem aviso. | Fundir as acções por id; avisar quando as duas versões mudaram desde o envio. | Alta |
| 2 | «Mais recente» é decidido pelo relógio de cada dispositivo. | `maisRecente()`, campo `alterada` | Um telemóvel com a hora adiantada pode passar por cima de uma auditoria já finalizada no PC. | Uma auditoria finalizada nunca é substituída por uma por finalizar. | Alta |
| 3 | ~~Finalizar não pede confirmação nem verifica o plano.~~ **Resolvido em 4.8.0:** verifica acção, prazo e foto ou nota em cada pergunta a melhorar, e pede confirmação. | `finalizarAuditoria()`, `faltasParaFinalizar()` | — | — | — |
| 4 | Descarregar o PDF ou enviar muda a data de alteração. | `marcarEnvio()` → `tocar()` | Um simples PDF no PC torna essa versão «mais recente» e agrava o ponto 1. | Registar o envio sem mexer em `alterada`, como já faz `envios.pc`. | Média |
| 5 | A edição de uma auditoria gravada não tem rascunho. | `guardarRascunho()` sai se `editId` | Se o sistema fechar o separador no telemóvel, o que se editou perde-se. | Rascunho também em edição, com a chave do id. | Média |
| 6 | As fotos gravam-se depois, em segundo plano. | `gravarEvidencias()` | Se falhar, a auditoria fica sem fotos e só aparece um aviso. | Manter as fotos do rascunho até a gravação delas se confirmar. | Baixa |
