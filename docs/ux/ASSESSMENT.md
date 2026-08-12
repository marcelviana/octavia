# ASSESSMENT — Fases C + D (síntese consolidada dos findings)

> **⛔ ASSESSMENT ENCERRADO (Fase E, 2026-08-10).** Por decisão de produto,
> não haverá reforma nem reconstrução da UI web: a direção é apps nativos
> (Android/iOS) mantendo o backend. Este documento congela como registro
> das Fases C+D. Os 96 achados foram reclassificados em quatro destinos
> (fila mínima de sobrevivência do web · contratos de API · corpus de
> requisitos do nativo · morre com a web) no
> **[`PLANO-TRANSICAO.md`](PLANO-TRANSICAO.md)** — que é o **documento
> vivo da transição** a partir de agora. Não atualizar este arquivo;
> mudanças de estado dos achados são rastreadas lá.

> Insumos: os 7 arquivos em `docs/ux/findings/` (auth, dashboard, library,
> content-viewer, setlists, performance, add-content), produzidos a partir das
> capturas B1/B2 e da leitura do código, **mais as medições ao vivo contra prod da
> Fase D** (`docs/ux/fase-d/RESULTS.md`). Régua de severidade: `docs/ux/JOBS.md`.
>
> Este documento **não** recomenda reformar vs. reconstruir — essa é a decisão da
> Fase E. Aqui estão apenas os dados consolidados.
>
> **Atualizado após a Fase D** (2026-08-10): 45 das 49 perguntas da lista fechada
> foram respondidas com medição ao vivo. Os itens tocados pela Fase D trazem a
> marca *[D]* e um ponteiro para a pergunta correspondente no RESULTS.

## Números gerais

- **95 achados abertos** + 4 históricos fechados (signup 401; crash bpm do estado
  vazio, PERF-03, corrigido no commit a3114cc; Bug F1 do FileUploadZone;
  **PERF-01, não reproduzido na Fase D**) + 1 achado global registrado na síntese.
- Severidade: **14× S1**, **43× S2**, **38× S3**.
- Os 3 S1 provisórios da Fase C foram **todos confirmados** na Fase D (AUTH-01 →
  hoje parte de RATE-01, PERF-02, ADD-02), e a fase produziu **5 achados novos**,
  4 deles S1 (RATE-01, SET-23, SET-14 reescrito, ADD-13).
- Violações axe deduplicadas por área (regra×elemento): auth 50 (45 delas de uma
  única causa: ausência de landmarks), dashboard 7, library 8, content-viewer 23,
  setlists 28 (3 causas-raiz), performance 17 (pior área, confirmado), add-content 3.

## Achado global (registrado uma vez, conforme regra da fase)

### [GLOB-01] UI integralmente em inglês para um único usuário brasileiro
- Evidência: todas as capturas de todas as áreas (rótulos, empty states, toasts,
  mensagens de erro); o balão de validação HTML5 virá em pt-BR do SO, divergindo do
  resto da UI (ver AUTH-04 e item 15 da lista da Fase D).
- Problema: o app fala uma língua diferente da do seu único usuário. No palco
  (J1), leitura de relance em segunda língua adiciona carga cognitiva; mensagens de
  erro em inglês ("Failed to add songs") são menos acionáveis no momento de estresse.
- Job afetado: transversal (J1–J6, marginal em cada um, constante em todos)
- Severidade: S2 · Esforço: G (i18n) ou M (tradução direta dos strings) · Classe: conceitual

## Padrões transversais (consolidação entre áreas — sem novos IDs)

1. **Falha silenciosa como default: não existe camada de erro→usuário** *[D]* —
   o padrão que a Fase D revelou e que passa a ser o mais relevante para a Fase E.
   Em **sete** situações medidas ao vivo, uma operação falhou (ou fez menos do que
   foi pedido) e o app **não disse absolutamente nada** — sem toast, sem realce de
   campo, sem estado de erro. Em três delas o app ainda **afirmou sucesso**:

   | # | Manifestação | O que o usuário vê | Ref. |
   |---|--------------|--------------------|------|
   | 1 | `POST /api/setlists` responde 400 (descrição vazia) | diálogo **fecha normalmente**; a setlist não existe | SET-23 · [item 16](fase-d/RESULTS.md) |
   | 2 | 429 no meio da montagem de setlist 50+ | pediu 56 músicas, entraram **38**; nenhum aviso | RATE-01 · [item 13](fase-d/RESULTS.md) |
   | 3 | Upload >50 MB rejeitado com HTTP 413 | **nada acontece**; o wizard fica parado | ADD-07 · [item 45](fase-d/RESULTS.md) |
   | 4 | `.png` com tipo "Lyrics" selecionado | arquivo descartado **sem mensagem** | ADD-12 · [item 48](fase-d/RESULTS.md) |
   | 5 | 5 PDFs soltos no drop zone | 4 ignorados **sem uma palavra**; o fluxo avança | ADD-08 · [item 49](fase-d/RESULTS.md) |
   | 6 | Favoritar no viewer | estrela muda e **reverte** no reload | CONT-05 · [item 31](fase-d/RESULTS.md) |
   | 7 | Save falhando no add-content | **"Content saved successfully!"** | ADD-01 · [item 43](fase-d/RESULTS.md) |

   A causa não é local: **não há uma camada que traduza falha em mensagem**. Cada
   chamada decide sozinha (e quase sempre decide não avisar). Isso torna o app
   *inauditável pelo próprio usuário* — no palco, ele não tem como saber se o que
   está na tela corresponde ao que existe. Para a Fase E, é o candidato mais forte
   a correção estrutural única com efeito em 7 achados.

2. **Feature com UI presente e fio desligado** — *(manifestação acrescentada em
   2026-08-12, descoberta na validação da fila A #8: **tablatura nunca renderiza
   no modo performance** — `use-content-loading`/`use-content-renderer` jamais
   leem `content_data.tablature`, e o palco cai em "No lyrics available for this
   song"; o viewer lê o mesmo campo corretamente. Destino: Bloco C, sem trabalho
   na web — ver `PLANO-TRANSICAO.md`.)* — reorder com handler TODO na UI e
   API pronta (SET-03), favorito que não persiste (CONT-05), toolbar vestigial
   desativada (CONT-08), auto-hide de controles pela metade (PERF-12), props de CTA
   nunca renderizadas no dashboard (DASH-01), Edit/Delete nunca ligados no viewer
   (CONT-04), CompletionStep inalcançável no batch import com branch de save morto e
   divergente (ADD-02). *[D]* SET-10 saiu da lista: a Fase D mostrou que o detalhe
   **abre** no mobile — o problema é ele nascer 342 px abaixo da dobra, sem
   auto-scroll ([item 19](fase-d/RESULTS.md)).
3. **Dupla paleta de ação primária e de estado selecionado** — azul/índigo × âmbar
   no mesmo produto (LIB-13, SET-16, AUTH-09); três cores de "selecionado" na mesma
   tela (ADD-11); três rótulos para a mesma ação de importar (DASH-10, ADD-11).
4. **Token de texto secundário sem contraste** — `#A69B8E` / `amber-600` reprovado
   pelo axe em 3 áreas (LIB-11, DASH-07, PERF-13); corrigir o token resolve as três.
5. **Icon-only sem nome acessível** — mesma causa em 7 áreas (AUTH-05, DASH-06,
   LIB-10, CONT-11, PERF-11, SET-20, ADD-10), incluindo o botão do shell repetido
   em todas. *[D]* Agravante medido: em touch os ícones da linha de setlist ficam
   em `opacity: 0` **antes e depois do tap** — não têm nome nem existência visível
   ([item 18](fase-d/RESULTS.md)).
6. **Bottom nav encobrindo conteúdo** — causa-raiz medida no dashboard
   (DASH-04: `pb-16` vs **81 px reais, confirmado na Fase D** — déficit de 17 px),
   com sintomas em setlists (SET-19) e library (LIB-07). *[D]* [item 22](fase-d/RESULTS.md).
7. **Segurança/validação aplicada sobre dado de domínio, quebrando o domínio** —
   SET-01 (Zod descarta `venue`/`data`/`notas`), SET-02 (createSafeText zera nomes),
   RATE-01 (rate limit disparado por uso normal). *[D]* A Fase D somou os dois
   exemplares mais graves: **SET-23** (o Zod **rejeita a requisição inteira** da
   própria UI por causa de um campo opcional) e **PERF-02** (a CSP do app proíbe o
   `<iframe>` que o modo performance usa para exibir PDF). O padrão amadureceu: não
   é só "a validação descarta dados" — é *a camada de segurança foi escrita sem
   olhar o que o produto faz*.

## Tabela consolidada

Legenda: sev S1 quebra o job / S2 fricção / S3 polish · esforço P/M/G · classe
cosm(ético) / estr(utural) / conc(eitual). Detalhes e evidências nos findings de origem.

| ID | Título curto | Sev | Esf | Classe | Jobs |
|----|--------------|-----|-----|--------|------|
| **RATE-01** *[D]* | **Dois sistemas de rate limit; o antigo no caminho crítico de toda rota autenticada** (consolida AUTH-01 + SET-05 + FASE-D-01) | S1 | M | estr | J1, J3, J6 |
| AUTH-02 | Cookie 7 dias carrega idToken de 1h | S2 | M | estr | J1, J6 |
| AUTH-03 | Logado abre `/` e cai no marketing (start_url) | S2 | P | estr | J1, J6 |
| AUTH-04 | Validação só pelo balão HTML5 nativo | S3 | M | estr | — |
| AUTH-05 | Select "Primary Instrument" sem nome acessível | S3 | P | estr | — |
| AUTH-06 | Botão "Sign In" invisível na CTA da landing | S3 | P | cosm | — |
| AUTH-07 | Campos de auth sem `autocomplete` | S3 | P | estr | J1 |
| AUTH-08 | Páginas sem landmarks (45/50 pares axe da área) | S3 | P | estr | — |
| AUTH-09 | Inconsistência visual landing × auth | S3 | P | cosm | — |
| AUTH-10 | Landing com conteúdo fictício e 7 links mortos | S3 | M | conc | — |
| AUTH-11 | Loading compartilhado entre Sign In e Google | S3 | P | cosm | — |
| ADD-01 *[D]* | Falha ao salvar mostra "saved successfully" e engole o erro — **confirmado**; e o save ainda criou 2 linhas duplicadas (ver ADD-14) | S1 | M | estr | J4 |
| ADD-02 *[D]* | **Batch import: 3× HTTP 201 mas a tela final é o passo 1, com o StepIndicator marcando "Complete"** — confirmado | S1 | M | estr | J4 |
| **ADD-13** *[D]* | **Upload descarta título/artista/tom digitados e salva o filename** | S1 | P | estr | J4, J5 |
| **ADD-14** *[D]* | **Save do add-content faz double-submit (2 linhas em 41 ms)** | S2 | P | estr | J4 |
| **ADD-15** *[D]* | **Storage sem endpoint de listagem: órfão de upload é irrecuperável** | S3 | M | estr | J4 |
| ADD-03 | PWA sem share_target: cenário WhatsApp impossível | S2 | M | conc | J4 |
| ~~ADD-04~~ *[D]* | ~~Sem defaults: título/artista do zero mesmo com filename útil~~ — **absorvido pelo ADD-13**: o problema não é a falta de default, é o valor explícito do usuário ser descartado | — | — | — | — |
| ADD-05 | Tom enterrado em "Advanced Options"; álbum/ano promovidos | S2 | P | conc | J4, J3 |
| ADD-06 | Upload sem progresso real, cancelamento ou pré-validação de tamanho | S2 | M | estr | J4 |
| ADD-07 | Erros do servidor genéricos ou em jargão técnico | S2 | P | estr | J4 |
| ADD-08 | Importar 5 PDFs = wizard 5×; multi-arquivo não existe | S2 | G | conc | J4 |
| ADD-09 | Abre em "Create New/Lyrics" e o passo 1 mente "Upload" | S2 | M | conc | J4 |
| ADD-10 | 3 violações axe (button-name shell, contraste 3.29:1, sem h1) | S3 | P | cosm | — |
| ADD-11 | Três cores de "selecionado" na mesma tela | S3 | P | cosm | — |
| ADD-12 | Trocar tipo descarta silenciosamente o arquivo enviado | S3 | P | estr | J4 |
| DASH-01 | Dashboard sem nenhum caminho para o show (J1) | S2 | M | conc | J1, J2 |
| DASH-02 *[D]* | **1 de 4 stat cards navega** (Setlists sim; Total/Favorites/Recent não), todos com aparência idêntica e `cursor: auto` — inconsistência é pior que inércia uniforme | S2 | P | estr | J1, J3, J5 |
| DASH-03 | Abas Recent/Favorites redundantes (mesmos 5 itens) | S2 | M | estr | J5 |
| DASH-04 | Bottom nav encobre conteúdo (pb-16 vs ~81px) | S2 | P | estr | J4, J5 |
| DASH-05 | Mobile: 4 stat cards consomem a primeira dobra | S2 | M | estr | J4, J5, J1 |
| DASH-06 | Botão de colapso da sidebar sem nome (shell) | S3 | P | cosm | — |
| DASH-07 | Contraste amber-600 insuficiente (6 elementos) | S3 | P | cosm | — |
| DASH-08 | Ícones de tipo com switch sobre strings inexistentes | S3 | P | estr | J5 |
| DASH-09 | Estrela emoji com classes CSS sem efeito | S3 | P | cosm | — |
| DASH-10 | Três rótulos para a mesma ação de importar | S3 | P | cosm | J4 |
| DASH-11 | Estado vazio sem CTA orientando o próximo passo | S3 | P | estr | J4 |
| LIB-01 *[D]* | **Biblioteca sem loading state por ~7 s** (não renderiza vazia: monta com os dados após ~7 s de área em branco) — *reclassificado na Fase D* | S2 | M | estr | J5, J3, J1 |
| LIB-02 | Títulos longos escondem ações de todas as linhas | S2 | P | estr | J5, J4, J3 |
| LIB-03 | Duplicados indistinguíveis na listagem | S2 | M | estr | J5, J3 |
| LIB-04 | Busca ILIKE sem tolerância a typo/acento | S2 | M–G | conc | J5, J1 |
| LIB-05 | Busca só no Enter, com navegação de página inteira | S2 | M | estr | J5 |
| LIB-06 | Filtro ativo invisível; sem chip nem "limpar" | S2 | P | estr | J5, J3 |
| LIB-07 | Scroll aninhado + paginação cortada no mobile | S2 | M | estr | J5, J3 |
| LIB-08 | Sem-resultados genérico, não ecoa a query | S3 | P | cosm | J5 |
| LIB-09 | Card role=button com interativos aninhados | S3 | M | estr | — |
| LIB-10 | Controles icon-only sem nome (5 elementos) | S3 | P | estr | — |
| LIB-11 | Artista/data com contraste 2.62:1 | S3 | P | cosm | J5, J1 |
| LIB-12 | Headings saltam h1→h3 | S3 | P | cosm | — |
| LIB-13 | CTA azul/índigo destoando da paleta âmbar | S3 | P | cosm | — |
| CONT-01 | Cifra-string vira parágrafo corrido ilegível | S1 | P | estr | J5, J2, J1 |
| CONT-02 | Tablatura-string destruída pela quebra de linha | S1 | P | estr | J5, J2, J1 |
| CONT-03 | Anotações write-only: invisíveis no viewer e no palco | S1 | G | conc | J2, J1 |
| CONT-04 | Edit/Delete inacessíveis; UI aponta botão inexistente | S2 | M | estr | J2, J3 |
| CONT-05 | Favoritar no viewer nunca persiste (TODO) | S2 | P | estr | J5, J3, J6 |
| CONT-06 | PDF mobile transborda (width 800 fixo) e toolbar não cabe | S2 | M | estr | J4, J5, J1 |
| CONT-07 | Fallbacks exibem acordes/tab fabricados como reais | S2 | P | conc | J1, J5, J4 |
| CONT-08 | Sem zoom para texto; toolbar vestigial desligada | S2 | M | conc | J2, J5 |
| CONT-09 | Duplicatas indistinguíveis dentro do viewer | S3 | P | estr | J3, J5 |
| CONT-10 | Título de 186 chars infla o header (~35% da tela) | S3 | P | cosm | J5 |
| CONT-11 | 21 botões icon-only sem nome acessível | S3 | P | estr | — |
| CONT-12 | Scroll do PDF sem foco de teclado + heading-order | S3 | P | estr | J3, J2 |
| SET-01 | Venue/data/notas descartados pelo Zod (perda silenciosa) | S1 | P | estr | J3, J1 |
| SET-02 | Nomes com ()[]&'" zerados pelo sanitizador strict | S1 | M | conc | J3, J1 |
| SET-03 | Reorder não persiste: handler da UI é TODO (API de two-phase UPDATE pronta) | S1 | P | estr | J3, J1 |
| SET-04 | Drag HTML5 puro: inoperante em touch, sem alternativa | S1 | M | estr | J3 |
| **SET-23** *[D]* | **Criar setlist falha em silêncio com a descrição vazia** (UI manda `null`, Zod aceita só `undefined`) | S1 | P | estr | J3, J1 |
| ~~SET-05~~ *[D]* | ~~Rate limiter por IP com TTL renovado trava setlist 50+~~ — **consolidado em RATE-01** (medido: pediu 56, entraram 38) | — | — | — | — |
| SET-06 | Bis impossível (unique) com 500 mudo | S2 | M | conc | J3, J1 |
| SET-07 | Reorder 2N UPDATEs sem transação; posições 10000+ | S2 | M | estr | J3, J1 |
| SET-08 | Tom (key) não aparece em lugar nenhum da área | S2 | P | estr | J3, J5 |
| SET-09 | Remover música recém-adicionada falha (IDs falsos) | S2 | P | estr | J3 |
| SET-10 | Mobile: selecionar setlist não leva ao detalhe | S2 | M | estr | J3, J1 |
| SET-11 | Títulos truncados a ~4 chars úteis no detalhe | S2 | P | estr | J3, J1, J2 |
| SET-12 | Ações hover-only com alvos de 28px em touch | S2 | P | estr | J3, J1, J2 |
| SET-13 | Duração total fabricada ((bpm/60)*3) como fato | S2 | P | conc | J3 |
| SET-14 *[D]* | **Offline, `/setlists` diz "No setlists yet"** com 4 setlists na conta — não é cache velho, é ausência de leitura de cache na listagem (o dashboard da mesma sessão diz "Setlists 3") — *reescrito na Fase D* | S1 | M | estr | J6, J1 |
| SET-15 | Não existe "duplicar setlist" (gap previsto no J3) | S2 | M | estr | J3 |
| SET-16 | Contraste dos CTAs azuis #2E7CE4 (26 pares axe) | S2 | P | cosm | J1, J3 |
| SET-17 | Data com off-by-one de fuso (UTC parse) | S3 | P | estr | J1, J3 |
| SET-18 | Vazio mobile com painel "Select a setlist" inútil | S3 | P | cosm | — |
| SET-19 | Na setlist de 60, ações do topo somem ao rolar | S3 | P | estr | J1, J3 |
| SET-20 | Botão do shell sem nome acessível (= DASH-06) | S3 | P | cosm | — |
| SET-21 | Página sem h1 | S3 | P | cosm | — |
| SET-22 | N+1 com content_data integral + picker carrega tudo | S3 | M | estr | J3, J6 |
| ~~PERF-01~~ *[D]* | ~~Setlist de 60 estoura navegação: Prev/Next fora da tela~~ — **NÃO REPRODUZIDO** a 1194×834: com 60 músicas os dots ocupam 716 px de 1194 e Prev/Next continuam na tela (81×36 px). Registro mantido; reavaliar em viewports menores | — | — | — | — |
| PERF-02 *[D]* | **PDF não renderiza no palco: a CSP do app (`frame-src 'none'`) bloqueia o `<iframe>`** — confirmado em Chrome real headed; não era artefato de captura | S1 | M | estr | J1, J6 |
| PERF-04 | Avançar música exige mirar botão de 36px | S2 | M | estr | J1 |
| PERF-05 | Sem indicação de posição ("4 de 12") | S2 | P | estr | J1 |
| PERF-06 | Pular para música: só dots anônimos de 8px | S2 | M | estr | J2, J1 |
| PERF-07 | Fim de setlist é beco sem saída mudo | S2 | P | estr | J1 |
| PERF-08 | Toast de wake lock cobre header/controles | S2 | P | estr | J1 |
| PERF-09 | Auto-scroll sem efeito em PDF/imagem (falha muda) | S2 | M | conc | J1 |
| PERF-10 | Zoom re-quebra linhas e desalinha acorde↔sílaba | S2 | M | conc | J1, J2 |
| PERF-11 | Sair/dark/play sem nome acessível (3 critical) | S3 | P | cosm | — |
| PERF-12 | Auto-hide pela metade: 170px fixos roubados do conteúdo | S3 | P | estr | J1 |
| PERF-13 | Contraste #A69B8E no header do palco | S3 | P | cosm | J1 |
| PERF-14 | Scroll principal sem foco + landmarks ausentes | S3 | P | estr | — |
| GLOB-01 | UI em inglês para usuário único brasileiro | S2 | M–G | conc | todos |

*[D]* = tocado pela Fase D (medição ao vivo). Linhas ~~riscadas~~ saíram da
contagem de abertos: absorvidas, consolidadas ou não reproduzidas.

Os três S1 provisórios da Fase C foram **todos confirmados**: AUTH-01 (hoje
RATE-01, [itens 11–12](fase-d/RESULTS.md)), PERF-02 ([item 4](fase-d/RESULTS.md))
e ADD-02 ([item 44](fase-d/RESULTS.md)).

Históricos fechados (rastreabilidade): signup 401 (auth.md) · PERF-03 crash bpm no
estado vazio, corrigido em a3114cc e verificado no código · Bug F1 do FileUploadZone
(add-content.md) · **PERF-01, não reproduzido na Fase D**.

### [RATE-01] O achado consolidado de rate limiting *[D]*

Consolida **AUTH-01** (limite de sessão), **SET-05** (429 na montagem de setlist)
e **FASE-D-01** (expulsão de qualquer rota autenticada) — os três IDs originais
permanecem como referências dos findings de origem. A Fase D mostrou que são
sintomas de **uma causa estrutural única**.

**A causa**: o app tem **dois sistemas de rate limit** coexistindo.
`lib/rate-limiter.ts` (novo: por janela, com configs por tipo de rota) e
`lib/rate-limit.ts` (antigo: contador **por IP**, TTL de 60 s **renovado a cada
request aceito**, **compartilhado entre todas as rotas** que o usam). O antigo
está no **caminho crítico da autenticação**: `/api/auth/verify` — chamado por
`getServerSideUser` em **todo server component autenticado** — usa ele.

**Os números medidos**:

| Métrica | Valor | Fonte |
|---------|-------|-------|
| Limite de `/api/auth/session` | **5 / 15 min por IP** (`X-RateLimit-Limit: 5`) | [item 11](fase-d/RESULTS.md) |
| POSTs de sessão por evento | 1 no login, **1 por volta de aba**, 1 a cada 50 min | [item 12](fase-d/RESULTS.md) |
| Bloqueio após estourar | **`Retry-After: 732 s` (12,2 min)** | [item 11](fase-d/RESULTS.md) |
| Limite compartilhado das demais rotas | 50 / 60 s por IP, entre **todas** as rotas | `lib/rate-limit.ts` |
| 429 na montagem de setlist | 38 aceitas, **429 na 39ª**; 18 nunca tentadas | [item 13](fase-d/RESULTS.md) |
| Taxa observada na fase | **234 de 371 POSTs de sessão (63%) com 429** | `fase-d/data/session-posts.jsonl` |

**O efeito no palco**: com o orçamento estourado, `/api/auth/verify` responde 429,
`getServerSideUser` devolve `null` e **qualquer rota autenticada** executa
`redirect('/login')` — o cookie ainda é válido, então o `/login` rebate para o
`/dashboard`. O músico toca em "Setlists" e cai na home, sem mensagem. Foi
observado dezenas de vezes e obrigou a instrumentar retry na própria suíte de
medição.

Severidade **S1** · Esforço **M** · Classe **estrutural** · Jobs **J1, J3, J6**
(veto por J1/J6).

## Contagem por classe (insumo da decisão da Fase E)

| Classe | Qtd | % dos 95 | Leitura |
|--------|-----|----------|---------|
| Cosmético | 20 | 21% | Tokens, contraste, rótulos, ícones — corrigível em lote |
| Estrutural | 60 | 63% | Layout, fios desligados, dados descartados, componentes quebrados, **falha sem mensagem** |
| Conceitual | 15 (+GLOB-01) | 16% | Modelo errado: sanitização sobre domínio, setlist-como-conjunto, anotação write-only, zoom por font-size, dados fabricados, import sem share/lote, idioma |

Por área — cosm/estr/conc: auth 3/6/1 · dashboard 4/6/1 · library 4/8/1 ·
content-viewer 1/8/3 · setlists 4/15/3 · performance 2/8/2 · add-content 2/8/4 ·
transversal (RATE-01) 0/1/0.

### Classe × esforço (95 achados abertos)

| | P | M | G | Total |
|---|---|---|---|-------|
| Cosmético | 20 | — | — | **20** |
| Estrutural | 35 | 25 | — | **60** |
| Conceitual | 3 | 10¹ | 2 | **15** |
| **Total** | **58** | **35¹** | **2** | **95** |

¹ LIB-04 (busca fuzzy) é M–G conforme a profundidade da solução; contado em M.

Leitura direta para a Fase E: **58 achados (61%) são esforço P**, e todo o estoque
cosmético é P; o núcleo duro segue nos 15 conceituais — 6 deles no caminho dos jobs
de maior peso (SET-02, SET-06, CONT-03, PERF-09, PERF-10, LIB-04).

*[D]* **O que a Fase D mudou nesta leitura**: os quatro S1 novos ou reescritos são
**três de esforço P e um M** — SET-23 (P: aceitar `null` no schema), ADD-13 (P: ler
`customMetadata` em vez de `metadata`), ADD-14 (P: guarda de double-submit) e
SET-14 (M: ler o cache na listagem). Somados a RATE-01 (M), são cinco correções
pequenas que destravam os dois jobs de maior peso. A Fase D **não** aumentou o
tamanho do problema: aumentou a proporção dele que é barata de resolver.

## Top 10 por impacto ponderado

Fórmula: **maior peso entre os jobs afetados × severidade ÷ esforço**, com
S1=4, S2=2, S3=1 e P=1, M=2, G=4; pesos do JOBS.md (J1 0,40 · J3/J5/J6 0,15 ·
J4 0,10 · J2 0,05). Regra de veto do JOBS.md aplicada por cima: **achado S1 em
J1/J6 entra no topo independente de esforço** (posições 1–6). Empates em 0,80
desempatados por proximidade do critério de sucesso do J1/J6.

| # | ID | Achado | Score | Nota |
|---|----|--------|-------|------|
| 1 | **SET-23** *[D]* | Criar setlist falha em silêncio com descrição vazia | 1,60 | **veto J1/J3**; o **primeiro passo do J3 é impossível** pelo caminho natural. Fix P: aceitar `null` no schema |
| 2 | SET-03 | Reorder: handler da UI é TODO (API funcional) | 1,60 | veto J1; só religar o elo UI→service (P). *[D]* O drag também não responde a toque (SET-04) — religar o handler sozinho não resolve no iPad |
| 3 | SET-01 | Venue/data/notas descartados silenciosamente | 1,60 | veto J1; perda de dados + "setlist do show de hoje" sem data |
| 4 | **RATE-01** *[D]* | Dois sistemas de rate limit; o antigo no caminho crítico de toda rota autenticada | 0,80 | veto J1/J6; **confirmado com números** (5/15min, `Retry-After` 732 s, 63% de 429) |
| 5 | PERF-02 *[D]* | CSP do app bloqueia o `<iframe>` de PDF no palco | 0,80 | veto J1/J6; **confirmado em Chrome real** — não era artefato de captura |
| 6 | **SET-14** *[D]* | Offline, `/setlists` diz "No setlists yet" com 4 setlists | 0,80 | veto J1/J6; **reescrito** — não é cache velho, é ausência de leitura de cache |
| 7 | SET-02 | Sanitizador zera nomes de setlist reais | 0,80 | veto J1; perda silenciosa de dados |
| 8 | CONT-07 | Fallback exibe acordes/tab fabricados | 0,80 | mina a confiança no que está na tela (pré-requisito do J1) |
| 9 | PERF-05 | Sem "música 4 de 12" | 0,80 | critério explícito do J1, esforço P |
| 10 | PERF-07 | Fim de setlist mudo | 0,80 | critério explícito do J1, esforço P. *[D]* Medido: com histórico vazio, o "Go back" leva a `about:blank` — **sai do app** |
| — | | *Logo abaixo do corte (0,80):* DASH-02, AUTH-03, SET-11, SET-12, SET-16, PERF-08. *S1s fora do top por esforço/peso:* CONT-01 e CONT-02 (0,60 — cifra/tab ilegíveis, fix P; *[D]* CONT-02 confirmado ao vivo: a tab é destruída por word-wrap a 390 px, não apenas cortada), **ADD-13** (0,40 — S1 mas J4 não veta), CONT-03 (0,40 — esforço G; *[D]* pior que o previsto: a anotação é **inalcançável pela UI**), SET-04 (0,30). *Saiu do top 10:* **PERF-01** (não reproduzido a 1194×834). *Reclassificado para fora:* **LIB-01** (S1→S2). | | |

*[D]* **Como a Fase D mexeu neste ranking**: entraram SET-23 (posição 1) e SET-14
reescrito (6); saiu PERF-01; AUTH-01 virou RATE-01; PERF-02 perdeu o asterisco de
provisório. As posições 1–7 são todas **veto** por J1/J6 — nenhuma delas é
questão de score. Três dos sete são esforço **P**.

Nenhum achado de add-content pontua para o top 10: o peso 0,10 do J4 limita o teto
da área — os três S1 (ADD-01, ADD-02, **ADD-13**) ficam entre 0,20 e 0,40, e o
maior score não-S1 é o ADD-05 (0,30, via J3). Os S1 de add-content também não
acionam veto (J4 não veta). *[D]* Vale registrar a tensão que a Fase D expôs:
add-content é a área com **mais falhas confirmadas ao vivo** (7 dos 8 itens do
grupo I) e a que a fórmula mais penaliza. Se a Fase E decidir por lotes de fix
baratos, ADD-13 e ADD-14 são dois P que eliminam perda de dados real.

## Medições vs. alvos do JOBS.md *[D]*

Resumo da tabela completa em [`fase-d/RESULTS.md`](fase-d/RESULTS.md). Insumo
direto para a Fase E: é aqui que se vê **quais jobs o produto já cumpre**.

| Job | Critério | Alvo | Medido | Veredito |
|-----|----------|------|--------|----------|
| **J1** | Tela inicial → 1ª música em tela cheia | ≤4 taps / 10 s | **3 taps, 5,4 s** (app já aberto) | ✅ |
| J1 | Abertura fria do PWA (landing → dashboard) | dentro dos 10 s | **10,3 s só de landing** | ❌ |
| J1 | Avançar música | 1 tap, alvo ≥48 px | 1 tap, **81×36 px** | ⚠️ |
| J1 | Play/pause | <100 ms | **41 / 57 ms** | ✅ |
| J1 | Trocar de música | <1 s | **126 / 57 / 46 ms** | ✅ |
| J1 | Dark sheet e zoom | ≤2 taps cada | **1 tap** cada | ✅ |
| J1 | Zero estados em que a música quebra | zero | **PDF nunca renderiza** (PERF-02) | ❌ |
| J1 | Rotação no meio da música | layout sobrevive | layout ok; **scroll volta a 0** | ⚠️ |
| **J2** | Anotação: intenção → salva | ≤5 taps / 20 s | **inalcançável pela UI** | ❌ |
| J2 | Anotação visível na reabertura | visível | **não aparece** em lugar nenhum | ❌ |
| **J3** | Criar setlist vazia | ≤3 taps | **7 taps** (a de 3 falha em silêncio) | ❌ |
| J3 | Adicionar cada música | ≤3 taps/música | **2,2 taps/música**, sem sair da tela | ✅ |
| J3 | Listagem com título, artista e tom | os três | **tom ausente** | ❌ |
| J3 | Reordenar | funciona em touch | **drag não responde a toque** | ❌ |
| J3 | Montar setlist 50+ | sem perda | pediu 56, entraram **38**, sem aviso | ❌ |
| **J4** | Upload completo com metadados | ≤8 taps / 60 s | **10 taps, 27 s** — e 4 taps **não têm efeito** | ❌ |
| J4 | Erro de arquivo inválido | mensagem acionável | 413 **mudo**; `.zip` como `.pdf` **aceito** | ❌ |
| J4 | Item localizável pela busca | imediato | ✅ (mas pelo filename, não pelo título) | ⚠️ |
| J4 | Upload sem congelar a UI | progresso | UI responsiva; **sem % e sem cancelar** | ⚠️ |
| **J5** | Dashboard → resultado | ≤4 taps / 10 s | **3 taps, 1,5 s** | ✅ |
| J5 | Busca por título e artista | funciona | ✅ ambas | ✅ |
| J5 | Sem-resultado com estado útil | ecoa a query | genérico, **não ecoa** | ⚠️ |
| J5 | Tolerância a acento/typo | — | `aguas` → **0** vs `Águas` → 2 | ❌ |
| J5 | Busca de dentro do palco | existe? | **não existe**; 4 taps para sair e buscar | ❌ |
| **J6** | Abrir offline e chegar ao conteúdo | funciona | dashboard offline completo | ✅ |
| J6 | Setlist cacheada offline (deep link) | completa | 3/3 músicas alcançáveis | ✅ |
| J6 | Música nunca cacheada | degrada com aviso | **renderizou a letra inteira** | ✅ |
| J6 | Chegar à setlist pela navegação, offline | lista disponível | **"No setlists yet"** com 4 setlists | ❌ |
| J6 | Partitura PDF offline | legível | branco (mesmo CSP do PERF-02) | ❌ |

**Leitura para a Fase E**: o **J5 passa quase inteiro** e o **J1 passa em tudo que
é latência** — o motor está bom. O que falha é sempre a **borda**: o que acontece
quando algo dá errado (J1 abertura fria, J3 criar, J4 erro), o que o app **não
tem** (J2 anotação, J5 busca no palco) e o **estado offline da navegação normal**
(J6). Nenhuma falha medida é de performance de renderização.

## Verificar na Fase D — lista fechada ✅ EXECUTADA

> **Status**: executada em 2026-08-09/10 contra prod. **45 das 49 respondidas**,
> 3 manual-pendentes (7, 14, 35 — exigem hardware real, ver
> [`fase-d/MANUAL-CHECKLIST.md`](fase-d/MANUAL-CHECKLIST.md)) e 1 diferida (17 —
> reorder, handler morto). Respostas item a item, com procedimento, medição,
> veredito e referência de trace: [`fase-d/RESULTS.md`](fase-d/RESULTS.md).
> A lista original fica abaixo para rastreabilidade.

Consolidada dos 7 findings; duplicatas entre áreas fundidas. A pergunta exata está
em cada item; a origem entre colchetes.

**A. Fluxo J1 completo (medições)**
1. Do tap no ícone do PWA (start_url `/`) até a primeira música em tela cheia, logado: quantos taps e segundos (alvo ≤4 taps/10s)? Quanto custa o desvio landing → "Sign In" → `/login` → redirect (AUTH-03)? Esse redirect funciona offline? [auth, dashboard, setlists]
2. Latência de troca de música no modo performance (critério <1s; pré-carregamento existe no código) e resposta do play/pause (<100ms percebido)? [performance]
3. Girar o tablet na música 4: o layout com paddings fixos e barras absolutas sobrevive? O scroll se mantém? [performance]

**B. PDF e renderização**
4. **Decide o S1 de PERF-02**: em Chrome desktop e Safari/iPadOS reais, o PDF de 12 páginas renderiza no iframe do modo performance? Com `#toolbar=0`, o scroll por touch entre as 12 páginas funciona? O dark sheet (`invert(1)`) produz partitura legível? O zoom por `transform: scale()` corta conteúdo? [performance]
5. Apertar play numa partitura PDF: o que o usuário observa? (Hipótese do código: nada acontece e o botão reverte sozinho — PERF-09.) [performance]
6. No viewer, quantos taps da página 1 à 6 de um PDF de 12 (só há prev/next)? Pinch-to-zoom funciona em touch ou só botões de 20%? [content-viewer]
7. Foto vertical de celular (JPG) como partitura: proporção e nitidez sobrevivem ao `width={800} height={600}` fixo? [content-viewer]

**C. Offline (J6)**
8. Kill + reopen em modo avião com sessão >1h: o app chega ao dashboard ou o middleware bloqueia em `/login` (AUTH-02)? O `setSessionCookie` falhando offline degrada algo visível? [auth]
9. A setlist cacheada abre completa offline, incluindo PDFs (blob via IndexedDB)? O que aparece para música cujo arquivo nunca foi cacheado? [performance, content-viewer]
10. Editar setlist → modo avião → reabrir: a versão cacheada é a anterior à edição (SET-14)? [setlists]

**D. Auth e rate limits**
11. **Decide o S1 de AUTH-01**: 5+ trocas de aba em <15min disparam 429 no `/api/auth/session`? Depois do 429 + token >1h, reload de `/dashboard` expulsa para `/login`? [auth]
12. Quantos POSTs a `/api/auth/session` um login completo dispara? Login + 3 trocas de aba já estoura o limite de 5? [auth]
13. **SET-05**: em qual adição o 429 dispara ao montar setlist de 50+? O que o usuário vê e em que estado fica a setlist (persistidas vs. estado local)? [setlists]
14. "Continue with Google" (popup) funciona no PWA instalado em tablet? [auth]
15. O balão HTML5 aparece no idioma do SO (pt-BR), divergindo da UI em inglês (GLOB-01/AUTH-04)? [auth]

**E. Setlists (J3)**
16. Adicionar 10 músicas pelo picker: quantos taps por música na prática (alvo ≤3, sem sair da tela)? [setlists]
17. Reorder pós-religação: latência de um drag na setlist de 60 (120 UPDATEs)? Interromper no meio deixa posições 10000+ no banco? [setlists]
18. Em iPad físico/simulado: o drag inicia com toque? Os ícones hover-only aparecem com um tap? Quantos taps até remover uma música? [setlists]
19. Mobile: após tocar num card, quanto scroll até a primeira música do detalhe? Existe auto-scroll invisível em screenshot? [setlists]
20. Scroll da setlist de 60 sem virtualização: jank perceptível? Tempo de load de `/setlists` com o seed completo? [setlists]
21. A constraint `(setlist_id, content_id)` já está confirmada por probe no banco vivo (500 na duplicata — SET-06). Falta só verificar se `(setlist_id, position)`, a do schema versionado, também existe no banco vivo — ela mudaria o risco do reorder (SET-07: colisão de position no meio dos 2N UPDATEs). [setlists]
22. Bottom nav: a última linha de listas fica permanentemente encoberta (DASH-04) ou o scroll a expõe? Tocar no item semi-visível funciona? [dashboard, setlists]

**F. Library e busca (J5)**
23. **Prioridade — LIB-01**: abrir `/library` a 1194×834 com IndexedDB frio: a lista monta vazia ou esvazia depois (flash)? Reload cura? Confirmar se a causa é o fallback que descarta o SSR. [library]
24. Cronometrar busca do header até resultado renderizado (dashboard→resultado ≤4 taps/10s)? O submit funciona com Enter/Go do teclado mobile? [library, dashboard]
25. "ipanma" e "aguas" (sem acento) com dados reais: algum caso é salvo pelo Postgres, ou ambos zeram? [library]
26. Existe caminho para a busca de dentro do modo performance ("toca aquela!")? Quantos taps? [library]
27. Fluxo real de adicionar 10 músicas à setlist partindo da biblioteca (menu do item não tem "Add to setlist"): ≤3 taps por música sem ida-e-volta? [library]
28. Em touch, o gesto rola a ScrollArea interna ou a página? A paginação (alvos 32px) é alcançável com a bottom nav? [library]
29. Os badges `text-xs` do dropdown de filtros são tocáveis com confiança? Seleção múltipla se comporta? [library]
30. Item recém-importado aparece na biblioteca ao voltar, sem reload manual (cache de 30s + refresh por foco)? [library]

**G. Viewer e anotações (J2)**
31. Favoritar no viewer, recarregar: a estrela volta ao estado anterior (CONT-05)? [content-viewer]
32. Partindo do viewer, criar uma anotação: quantos taps até o canvas do editor? Após salvar, confirmar que ela não aparece nem no viewer nem no modo performance (CONT-03/04). [content-viewer]
33. Tab em formato array: o `overflow-x-auto` é descobrível/operável em touch? Há affordance de conteúdo cortado? [content-viewer]
34. Botão Performance do header do viewer: latência até tela cheia (mede J5→J1). [content-viewer]

**H. Modo performance — diversos**
35. Wake lock em iPad (Safari) e Android real: tela permanece acesa 10 min? O toast do PERF-08 aparece e cobre controles? Re-request após alt-tab funciona? [performance]
36. Dots de 8px: taxa de acerto real em tablet; e na setlist de 60? [performance]
37. `/performance` por deep link direto: "Go back" do empty state sai do app (histórico vazio)? [performance]
38. Confirmar que nenhum gesto de swipe avança música (código não tem handler). [performance]
39. Tocar nos stat cards do dashboard: confirmar a falsa affordance (nada acontece). [dashboard]
40. Stat "Recent: 10" vs lista de 5: origem do número; se as abas ficarem, deveriam mostrar 10. [dashboard]
41. Recent Content → `/content/[id]`: tempo até render; o voltar preserva aba/scroll do dashboard? [dashboard]

**I. Add Content (J4)**
42. Orçamento de taps do J4 no mobile: do dashboard até "Save Content" com PDF de cifra, taps e tempo reais. Estimativa estática do fluxo atual: ~9 taps, acima da meta de 8 (inclui reselecionar tipo + "Import from File" + abrir o acordeão do tom). Confirmar. [add-content]
43. **ADD-01**: forçar falha do `POST /api/content` no passo 2 (modo avião após o upload) — o alert verde "Content saved successfully!" aparece mesmo com a falha? O que resta na tela? Os metadados digitados persistem? [add-content]
44. **Decide o S1 de ADD-02**: completar um batch import real (TXT com 3 músicas) e registrar qual tela aparece após "Import All": CompletionStep ou a tela inicial de upload? [add-content]
45. Erro de arquivo real: (a) >50MB e (b) `.zip` renomeado `.pdf` (check de MIME server-side) — mensagem exata exibida em cada caso, e algo digitado se perde? [add-content]
46. Item recém-importado aparece na busca/biblioteca sem reload manual (critério "imediatamente localizável")? [add-content; cruza com o item 30]
47. Upload de PDF de 20–40MB com throttling: a UI congela? O spinner comunica o suficiente? Dá para cancelar/navegar durante? [add-content]
48. Subir `.png` com tipo "Lyrics" selecionado: a troca automática para Sheet é comunicada ou o usuário se perde? [add-content]
49. Soltar 5 PDFs de uma vez no drop zone: confirmar que 4 são ignorados sem qualquer aviso (ADD-08). [add-content]

## Cobertura desta fase

Sete áreas analisadas (as 6 originais + add-content, incorporada nesta síntese).
As capturas de `profile`, `settings` e `setup` existem na passada B1 mas foram
**deliberadamente deixadas fora da análise**: são superfícies secundárias que não
participam de nenhum passo dos jobs J1–J6 (configuração e perfil são eventos raros
para o usuário único). *[D]* **Nenhum achado da Fase D apontou para elas** — a
exclusão se mantém.

## Registro das mudanças da Fase D *[D]*

Para rastreabilidade, o que esta atualização fez sobre o documento da Fase C:

| Mudança | Antes | Depois | Ref. |
|---------|-------|--------|------|
| **Consolidação** | AUTH-01 + SET-05 + FASE-D-01 (3 IDs) | **RATE-01** (IDs originais mantidos como referência) | [itens 11–13](fase-d/RESULTS.md) |
| **Promoção** | FASE-D-05 | **SET-23** (S1, novo) | [item 16](fase-d/RESULTS.md) |
| **Promoção** | FASE-D-02 | **ADD-13** (S1, novo) | [itens 42/30/46](fase-d/RESULTS.md) |
| **Promoção** | FASE-D-03 | **ADD-14** (S2, novo) | [item 43](fase-d/RESULTS.md) |
| **Promoção** | FASE-D-04 | **ADD-15** (S3, novo) | seção de cleanup |
| **Reescrita** | SET-14 "cache offline desatualizado" (S2) | SET-14 "offline sem leitura de cache na listagem" (**S1**) | [item 10](fase-d/RESULTS.md) |
| **Reclassificação** | LIB-01 S1 "renderiza vazia" | **S2** "sem loading state por ~7 s" | [item 23](fase-d/RESULTS.md) |
| **Não reproduzido** | PERF-01 S1 | fechado; fora do top 10 | [item 36](fase-d/RESULTS.md) |
| **Absorvido** | ADD-04 | dentro do ADD-13 | [item 42](fase-d/RESULTS.md) |
| **Descrição atualizada** | DASH-02 "não navegam" | "1 de 4 navega" | [item 39](fase-d/RESULTS.md) |
| **Confirmações** | PERF-02, ADD-02 (provisórios) | S1 definitivos, com causa-raiz nova no PERF-02 | [itens 4 e 44](fase-d/RESULTS.md) |
| **Novo padrão nº 1** | — | "falha silenciosa como default" (7 manifestações) | — |

**Achados que a Fase D mediu e que confirmam a Fase C sem alteração**: SET-04
(drag inoperante em touch), SET-12 (ações hover-only, 28 px), CONT-02 (tab
destruída no mobile), CONT-03 (anotação invisível — e inalcançável), CONT-05
(favorito não persiste), ADD-08 (drop de 5 → 1), DASH-04 (81 px de nav vs
`pb-16`), LIB-04 (busca sem tolerância a acento), LIB-06 (filtro sem chip),
LIB-07 (scroll aninhado), PERF-09 (play mudo no PDF), AUTH-03 (landing com
usuário logado), GLOB-01 (balão HTML5 em pt-BR sobre UI em inglês).
