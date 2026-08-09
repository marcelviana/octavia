# ASSESSMENT — Fase C (síntese dos findings por área)

> Insumos: exclusivamente os 7 arquivos em `docs/ux/findings/` (auth, dashboard,
> library, content-viewer, setlists, performance, add-content), produzidos a partir
> das capturas das passadas B1/B2 e da leitura do código. Régua de severidade:
> `docs/ux/JOBS.md`.
>
> Este documento **não** recomenda reformar vs. reconstruir — essa é a decisão da
> Fase E, com os dados da Fase D na mesa. Aqui estão apenas os dados consolidados.

## Números gerais

- **94 achados abertos** + 3 históricos fechados (signup 401; crash bpm do estado
  vazio, PERF-03, corrigido no commit a3114cc; Bug F1 do FileUploadZone) + 1 achado
  global registrado na síntese.
- Severidade: **14× S1** (3 provisórios, pendentes de confirmação na Fase D:
  AUTH-01, PERF-02 e ADD-02), **43× S2**, **37× S3**.
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

1. **Feature com UI presente e fio desligado** — o padrão mais relevante para a
   Fase E: reorder com handler TODO na UI e API pronta (SET-03), favorito que não
   persiste (CONT-05), toolbar vestigial desativada (CONT-08), auto-hide de
   controles pela metade (PERF-12), props de CTA nunca renderizadas no dashboard
   (DASH-01), Edit/Delete nunca ligados no viewer (CONT-04), rota de detalhe de
   setlist morta (SET-10), CompletionStep inalcançável no batch import com branch
   de save morto e divergente (ADD-02).
2. **Dupla paleta de ação primária e de estado selecionado** — azul/índigo × âmbar
   no mesmo produto (LIB-13, SET-16, AUTH-09); três cores de "selecionado" na mesma
   tela (ADD-11); três rótulos para a mesma ação de importar (DASH-10, ADD-11).
3. **Token de texto secundário sem contraste** — `#A69B8E` / `amber-600` reprovado
   pelo axe em 3 áreas (LIB-11, DASH-07, PERF-13); corrigir o token resolve as três.
4. **Icon-only sem nome acessível** — mesma causa em 7 áreas (AUTH-05, DASH-06,
   LIB-10, CONT-11, PERF-11, SET-20, ADD-10), incluindo o botão do shell repetido
   em todas.
5. **Bottom nav encobrindo conteúdo** — causa-raiz medida no dashboard
   (DASH-04: `pb-16` vs ~81px reais), com sintomas em setlists (SET-19) e library (LIB-07).
6. **Sanitização/validação de segurança aplicada a dado de domínio** — SET-01
   (Zod descarta campos), SET-02 (createSafeText zera nomes), SET-05/AUTH-01
   (rate limit disparado por uso normal).

## Tabela consolidada

Legenda: sev S1 quebra o job / S2 fricção / S3 polish · esforço P/M/G · classe
cosm(ético) / estr(utural) / conc(eitual). Detalhes e evidências nos findings de origem.

| ID | Título curto | Sev | Esf | Classe | Jobs |
|----|--------------|-----|-----|--------|------|
| AUTH-01 | Rate limit 5/15min vs POST de sessão por page load/aba | S1* | P | estr | J1, J6, J3 |
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
| ADD-01 | Falha ao salvar mostra "saved successfully" e engole o erro | S1 | M | estr | J4 |
| ADD-02 | Batch import despeja o usuário de volta na tela de upload | S1* | M | estr | J4 |
| ADD-03 | PWA sem share_target: cenário WhatsApp impossível | S2 | M | conc | J4 |
| ADD-04 | Sem defaults: título/artista do zero mesmo com filename útil | S2 | P | estr | J4 |
| ADD-05 | Tom enterrado em "Advanced Options"; álbum/ano promovidos | S2 | P | conc | J4, J3 |
| ADD-06 | Upload sem progresso real, cancelamento ou pré-validação de tamanho | S2 | M | estr | J4 |
| ADD-07 | Erros do servidor genéricos ou em jargão técnico | S2 | P | estr | J4 |
| ADD-08 | Importar 5 PDFs = wizard 5×; multi-arquivo não existe | S2 | G | conc | J4 |
| ADD-09 | Abre em "Create New/Lyrics" e o passo 1 mente "Upload" | S2 | M | conc | J4 |
| ADD-10 | 3 violações axe (button-name shell, contraste 3.29:1, sem h1) | S3 | P | cosm | — |
| ADD-11 | Três cores de "selecionado" na mesma tela | S3 | P | cosm | — |
| ADD-12 | Trocar tipo descarta silenciosamente o arquivo enviado | S3 | P | estr | J4 |
| DASH-01 | Dashboard sem nenhum caminho para o show (J1) | S2 | M | conc | J1, J2 |
| DASH-02 | Stat cards não navegam (texto morto) | S2 | P | estr | J1, J3, J5 |
| DASH-03 | Abas Recent/Favorites redundantes (mesmos 5 itens) | S2 | M | estr | J5 |
| DASH-04 | Bottom nav encobre conteúdo (pb-16 vs ~81px) | S2 | P | estr | J4, J5 |
| DASH-05 | Mobile: 4 stat cards consomem a primeira dobra | S2 | M | estr | J4, J5, J1 |
| DASH-06 | Botão de colapso da sidebar sem nome (shell) | S3 | P | cosm | — |
| DASH-07 | Contraste amber-600 insuficiente (6 elementos) | S3 | P | cosm | — |
| DASH-08 | Ícones de tipo com switch sobre strings inexistentes | S3 | P | estr | J5 |
| DASH-09 | Estrela emoji com classes CSS sem efeito | S3 | P | cosm | — |
| DASH-10 | Três rótulos para a mesma ação de importar | S3 | P | cosm | J4 |
| DASH-11 | Estado vazio sem CTA orientando o próximo passo | S3 | P | estr | J4 |
| LIB-01 | Biblioteca renderiza vazia em tablet landscape com dados | S1 | M | estr | J5, J3, J1 |
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
| SET-05 | Rate limiter por IP com TTL renovado trava setlist 50+ | S1 | P | estr | J3 |
| SET-06 | Bis impossível (unique) com 500 mudo | S2 | M | conc | J3, J1 |
| SET-07 | Reorder 2N UPDATEs sem transação; posições 10000+ | S2 | M | estr | J3, J1 |
| SET-08 | Tom (key) não aparece em lugar nenhum da área | S2 | P | estr | J3, J5 |
| SET-09 | Remover música recém-adicionada falha (IDs falsos) | S2 | P | estr | J3 |
| SET-10 | Mobile: selecionar setlist não leva ao detalhe | S2 | M | estr | J3, J1 |
| SET-11 | Títulos truncados a ~4 chars úteis no detalhe | S2 | P | estr | J3, J1, J2 |
| SET-12 | Ações hover-only com alvos de 28px em touch | S2 | P | estr | J3, J1, J2 |
| SET-13 | Duração total fabricada ((bpm/60)*3) como fato | S2 | P | conc | J3 |
| SET-14 | Cache offline gravado com estado desatualizado | S2 | P | estr | J6, J1 |
| SET-15 | Não existe "duplicar setlist" (gap previsto no J3) | S2 | M | estr | J3 |
| SET-16 | Contraste dos CTAs azuis #2E7CE4 (26 pares axe) | S2 | P | cosm | J1, J3 |
| SET-17 | Data com off-by-one de fuso (UTC parse) | S3 | P | estr | J1, J3 |
| SET-18 | Vazio mobile com painel "Select a setlist" inútil | S3 | P | cosm | — |
| SET-19 | Na setlist de 60, ações do topo somem ao rolar | S3 | P | estr | J1, J3 |
| SET-20 | Botão do shell sem nome acessível (= DASH-06) | S3 | P | cosm | — |
| SET-21 | Página sem h1 | S3 | P | cosm | — |
| SET-22 | N+1 com content_data integral + picker carrega tudo | S3 | M | estr | J3, J6 |
| PERF-01 | Setlist de 60 estoura navegação: Prev/Next fora da tela | S1 | M | estr | J1, J2 |
| PERF-02 | PDF 100% branco nas capturas, sem fallback/erro | S1* | M | estr | J1, J6 |
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

\* S1 provisório — confirmar na Fase D (AUTH-01: itens 11–12; PERF-02: item 4;
ADD-02: item 44 da lista abaixo).

Históricos fechados (rastreabilidade): signup 401 (auth.md) · PERF-03 crash bpm no
estado vazio, corrigido em a3114cc e verificado no código · Bug F1 do FileUploadZone
(add-content.md).

## Contagem por classe (insumo da decisão da Fase E)

| Classe | Qtd | % dos 94 | Leitura |
|--------|-----|----------|---------|
| Cosmético | 20 | 21% | Tokens, contraste, rótulos, ícones — corrigível em lote |
| Estrutural | 59 | 63% | Layout, fios desligados, dados descartados, componentes quebrados |
| Conceitual | 15 (+GLOB-01) | 16% | Modelo errado: sanitização sobre domínio, setlist-como-conjunto, anotação write-only, zoom por font-size, dados fabricados, import sem share/lote, idioma |

Por área — cosm/estr/conc: auth 3/7/1 · dashboard 4/6/1 · library 4/8/1 ·
content-viewer 1/8/3 · setlists 4/15/3 · performance 2/9/2 · add-content 2/6/4.

### Classe × esforço (94 achados abertos)

| | P | M | G | Total |
|---|---|---|---|-------|
| Cosmético | 20 | — | — | **20** |
| Estrutural | 36 | 23 | — | **59** |
| Conceitual | 3 | 10¹ | 2 | **15** |
| **Total** | **59** | **33¹** | **2** | **94** |

¹ LIB-04 (busca fuzzy) é M–G conforme a profundidade da solução; contado em M.
Leitura direta para a Fase E: 59 achados (63%) são esforço P, e todo o estoque
cosmético é P; o núcleo duro são os 15 conceituais — 6 deles no caminho dos jobs
de maior peso (SET-02, SET-06, CONT-03, PERF-09, PERF-10, LIB-04).

## Top 10 por impacto ponderado

Fórmula: **maior peso entre os jobs afetados × severidade ÷ esforço**, com
S1=4, S2=2, S3=1 e P=1, M=2, G=4; pesos do JOBS.md (J1 0,40 · J3/J5/J6 0,15 ·
J4 0,10 · J2 0,05). Regra de veto do JOBS.md aplicada por cima: **achado S1 em
J1/J6 entra no topo independente de esforço** (posições 1–6). Empates em 0,80
desempatados por proximidade do critério de sucesso do J1/J6.

| # | ID | Achado | Score | Nota |
|---|----|--------|-------|------|
| 1 | SET-03 | Reorder: handler da UI é TODO (API funcional) | 1,60 | veto J1; só religar o elo UI→service (P) |
| 2 | SET-01 | Venue/data/notas descartados silenciosamente | 1,60 | veto J1; perda de dados + "setlist do show de hoje" sem data |
| 3 | AUTH-01 | Rate limit de sessão vs POST por page load | 1,60* | veto J1/J6; provisório — confirmar antes de tratar |
| 4 | SET-02 | Sanitizador zera nomes de setlist reais | 0,80 | veto J1; perda silenciosa de dados |
| 5 | PERF-01 | Setlist de 60 sem Prev/Next visíveis | 0,80 | veto J1; sem navegação na última música |
| 6 | PERF-02 | PDF branco sem fallback/erro no palco | 0,80* | veto J1/J6; provisório, mas a ausência de fallback é fato de código |
| 7 | SET-14 | Cache offline gravado desatualizado | 0,80 | J6 é binário: falha só aparece no palco |
| 8 | CONT-07 | Fallback exibe acordes/tab fabricados | 0,80 | mina a confiança no que está na tela (pré-requisito do J1) |
| 9 | PERF-05 | Sem "música 4 de 12" | 0,80 | critério explícito do J1, esforço P |
| 10 | PERF-07 | Fim de setlist mudo | 0,80 | critério explícito do J1, esforço P |
| — | | *Logo abaixo do corte (mesmo score 0,80):* DASH-02, AUTH-03, SET-11, SET-12, SET-16, PERF-08. *S1s fora do top por esforço/peso:* CONT-01 e CONT-02 (0,60 — cifra/tab ilegíveis, fix P), SET-05 (0,60), CONT-03 (0,40 — esforço G), LIB-01 (0,30 — mas é a biblioteca abrindo vazia no viewport de palco; prioridade de investigação na Fase D), SET-04 (0,30). | | |

Nenhum achado de add-content pontua para o top 10: o peso 0,10 do J4 limita o teto
da área — os dois S1 (ADD-01, ADD-02, ambos M) ficam em 0,20 e o maior score é o
ADD-05 (0,30, via J3). Os S1 de add-content também não acionam veto (J4 não veta).

## Verificar na Fase D — lista fechada

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
para o usuário único). Se algum achado da Fase D apontar para elas (ex.: uma
preferência que afete o modo performance), reavaliar a exclusão.
