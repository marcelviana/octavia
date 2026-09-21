# PRD — Tela 2 do nativo: escrita de setlist

> **Bloco N2 · PR-0** (só docs). Data: 2026-09-16. Base: `origin/main` = `c33c794`, com o pre-check do N2 (#306) e o hotfix da div. 150 (#307, `e20c0a4`) mergeados.
> **Fontes de fato**: [`N2-PRECHECK.md`](N2-PRECHECK.md) (Fases A e B, decisões N2-D1…D11), [`docs/ux/HOTFIX-150.md`](../ux/HOTFIX-150.md) (N2-D12, divs. 170–176), os contratos [`docs/api/SETLISTS.md`](../api/SETLISTS.md) (com a errata desta PR) e [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md), e os handlers na `main`. **Fonte de requisitos**: [`docs/ux/JOBS.md`](../ux/JOBS.md) J3 e as decisões N2-D1…D22 (D1–D12 no pre-check e no hotfix; D13–D22 no §0).
> **Formato**: o do [`PRD-TELA-1.md`](PRD-TELA-1.md). Todo requisito `T2-Rn` cita a fonte e tem *Aceite* verificável. `[medido: …]` = comando e saída literal (no pre-check, no hotfix ou nas notas deste arquivo). `[análise]` = inferência sobre o medido. `[hipótese]` = não medido, com dono no §9.
> **Este PRD prepara, não decide.** Na revisão 0 (2026-09-16), o que as decisões vigentes não fechavam foi para o §12 como pergunta numerada, com opções e recomendação.
> **Revisão 1 (2026-09-17)**: o Marcel respondeu Q1–Q8 e decidiu duas perguntas novas (Q9, Q10). As dez decisões estão no §0 (N2-D13…D22) e entraram nos requisitos; o §12 fica como registro das opções. **Nenhum requisito depende mais de pergunta aberta.**
> **Divergências**: de **177 a 186** (a #306 usou até 162; a #307, até 176; a 186 é da revisão 1).

---

## 0. Decisões do Marcel (2026-09-17)

Respostas às perguntas do §12 (Q1–Q8) e a duas perguntas novas (Q9, Q10). O texto é o da decisão; os requisitos que cada uma muda estão na última coluna.

> **Continuação, no desenho (2026-09-21)**: as decisões **N2-D23…D34** estão na §2 de [`DESIGN-N2/README.md`](DESIGN-N2/README.md), e fecham o que este PRD deixou para o brief — a entrada de criar (N2-D16 → N2-D23/D26), a §8.3 do V1 (N2-D24), o modo de reordenar (N2-D27), remover sem diálogo (N2-D28) e os estados da escrita. O desenho está congelado em [`docs/native/DESIGN-N2/`](DESIGN-N2/) e apontado do V1 pela **errata E17**.

| # | Pergunta | Decisão | Onde entra |
|---|---|---|---|
| **N2-D13** | Q1 | opção (b). Depois de todo 2xx de escrita, `GET /api/setlists` e substituição do conjunto de setlists (T1-R9). O corpo da resposta da escrita não é aplicado ao cache (div. 178). | §4.2, T2-R9, T2-R16, T2-R17 |
| **N2-D14** | Q2 | opção (a). Diálogo com o nome da setlist, a contagem de músicas, a frase de que os arquivos baixados continuam no aparelho, e dois botões. Sem "desfazer". | T2-R5, §7 |
| **N2-D15** | Q3 | opção (a). O picker marca o que já está na setlist (inclusive "n×"); adicionar de novo continua permitido sem confirmação. | T2-R6, §7 |
| **N2-D16** | Q4 | opção (a) como **recomendação para o brief de design**, com a medida (barra de 120 dp de S1, `DESIGN-V1/README.md:209`, sem cobrir cartões). O Claude Design pode contrapropor com justificativa; a decisão final é do aval do desenho. | T2-R1, §7 |
| **N2-D17** | Q5 | opção (a). Adicionar acima de 100 é permitido; reordenar fica inativo com o motivo ao toque (mesmo padrão A15). Correção do teto → Bloco D. | T2-R6, T2-R8, §7 (div. 186) |
| **N2-D18** | Q6 | opção (a). "Tentar de novo" só depois de uma ressincronização que mostre o estado real; para criar e adicionar, a tela avisa que a operação pode já ter sido gravada. Nunca repetição automática. | §4.3, T2-R11, §7 |
| **N2-D19** | Q7 | opção (a). S2 aberta a partir do palco não oferece edição. S2 passa a ter dois estados de entrada, ambos no G6. | T2-R19, §7, §8 |
| **N2-D20** | Q8 | opção (a). Criar só com nome e data; músicas pelo picker, um request cada. `songs[]` do POST fica fora do N2 (base de um "duplicar" futuro, §10). | T2-R1, §10 |
| **N2-D21** | Q9 (nova) | o cliente valida **só o que é dele**: nome vazio após `trim`, data impossível (div. 154), e **"nada mudou → não envia"** (um `PUT {}` é válido e bumpa `updated_at` — editar e cancelar não pode invalidar a setlist no próprio aparelho). O filtro de texto do servidor (div. 181) **não é replicado** no cliente: o 400 dele vira uma frase do conjunto fechado ("o nome tem um trecho que o servidor não aceita"). Correção do filtro → Bloco D, como já está. | T2-R3, T2-R4, T2-R15, A-N2-3, A-N2-24 |
| **N2-D22** | Q10 (nova) | escrita 2xx seguida de resync que falha é um **estado próprio** — "salvo; não foi possível recarregar" — com log `resync kind=setlists status=<n>` e o `GET` refeito na próxima abertura da tela. Nunca "salvo" limpo, nunca "falhou". | T2-R9, T2-R11, T2-R16, §7, §8, A-N2-25 |

---

## 1. Escopo

**A tela 2 é a escrita de setlist no nativo** (N2-D1): criar uma setlist com nome e data, renomear, mudar a data, apagar, adicionar e remover músicas, e reordenar. Tudo sobre o backend atual, **sem alteração** (`N2-PRECHECK.md:3-5`), e como extensão de S1 (lista de setlists) e S2 (índice) (N2-D4).

**Job**: J3, "Preparar repertório: montar setlist nova" (`JOBS.md:79-106`). Passos 1–5: criar com nome e data, adicionar ~10 músicas buscando por nome, mover a 8 para a posição 2, remover uma, revisar a ordem. Critérios de sucesso do J3, verbatim (`JOBS.md:94-98`):

> - Criar setlist vazia: ⚠️ **≤ 3 taps**
> - Adicionar cada música: ⚠️ **≤ 3 taps por música** (buscar → resultado → adicionar), sem sair da tela da setlist a cada adição
> - Reordenar: drag-and-drop funcional em touch **e** mouse, ou controles equivalentes
> - A listagem da setlist mostra título, artista e tom sem precisar abrir cada item

Pontos de observação herdados (`JOBS.md:100-105`): picker fluido ou ida e volta biblioteca ↔ setlist; reorder na setlist de 60; estado vazio da setlist recém-criada orienta o próximo passo.

**O que a tela 2 não é**:
- **não é J2** (`JOBS.md:53-77`): anotação, transposição e "pular para a música 7" no ensaio. O salto já existe (T1-R28); anotar e transpor ficam fora (§11);
- **não escreve content** (N2-D1): criar, editar e apagar content é o N3, com o B9 antes;
- **não tem fila offline** (N2-D2): sem rede, a escrita não acontece e a tela diz isso.

---

## 2. O contrato consumido

O contrato das seis escritas está em [`docs/api/SETLISTS.md`](../api/SETLISTS.md), completado por esta PR (N2-D7, div. 145): seções `POST /api/setlists`, `PUT /api/setlists/[id]` e `DELETE /api/setlists/[id]`, a tabela "Posse e autenticação por rota" e a "regra 9". **O PRD não repete o contrato**; lista só o que o nativo usa dele.

| # | O nativo depende de | Onde no `SETLISTS.md` | Handler |
|---|---|---|---|
| C1 | `POST /api/setlists` aceita `{name, performance_date?}` e devolve **201** com a linha inteira (inclui `id`, `updated_at`) e `setlist_songs: []` | §`POST /api/setlists` | `route.ts:126-141`, `:209-210` |
| C2 | `name` passa por `trim()` e depois 1..255; `performance_date` é `YYYY-MM-DD` ou `null`; `.strict()` | idem | `api-schemas.ts:318-350` |
| C3 | o `refine` de texto recusa `data:`, `javascript:`, `vbscript:`, `<script` (e `on<palavra>=` em `description`/`notes`) sem diferenciar maiúsculas | idem | `api-schemas.ts:60-81` |
| C4 | `PUT /api/setlists/[id]`: **ausente = não mexe**, `null` = limpa, `name` não aceita `null` | §`PUT /api/setlists/[id]` | `[id]/route.ts:171-192` |
| C5 | o 200 do `PUT` **não é leitura confiável das músicas** (pode vir `setlist_songs: []` depois de um UPDATE bem-sucedido) | idem | `[id]/route.ts:228-233` (div. 178) |
| C6 | `DELETE /api/setlists/[id]`: 200 `{success:true}`; inexistente, alheia ou **já apagada** → 404 (N2-D12, #307) | §`DELETE /api/setlists/[id]` | `[id]/route.ts:343-360` |
| C7 | addSong sempre anexa no fim; o 201 traz a `position` real; bis permitido | §addSong (G2, G3 do pre-check §2.1) | `songs/route.ts:66-80` |
| C8 | reorder: **permutação exata** de 1..100 ids de `setlist_songs`; 200 `{songs:[{id,position}]}`; falta, sobra ou corrida → `400 field:"order"` com corpo único | §reorder (G4–G6) | `order/route.ts:45-56`; `rpc-errors.ts:22-33` |
| C9 | remover é por `setlist_songs.id`; duplo delete → 404 | §remove (G7) | `[songId]/route.ts:41-79` |
| C10 | **nenhuma escrita é idempotente e nenhuma tem pré-condição de versão** (último vence) | §Posse e autenticação | pre-check §2.2 L4, L6 |
| C11 | **RLS não protege estas rotas; posse é do handler** | idem | pre-check §1.1 |
| C12 | toda não-2xx usa o envelope; **não existe 409** — os erros das RPCs saem como 400/404/500 (div. 177) | `CONTRATO-DE-ERRO.md:47-53` | `rpc-errors.ts:21-48` |

**Não existe rota de duplicar setlist** (J3 passo 6): `git ls-tree -r --name-only HEAD app/api | grep -iE "duplic|copy|clone"` → vazio; `grep -rni "duplicat\|clone" app/api/setlists lib/setlist-service.ts components/setlist-manager.tsx` (fora de testes) → vazio `[medido: nesta PR]`. Gap declarado no §10.

---

## 3. Auth para escrita

| Operação | Rota | Cadeia | Email verificado | Família |
|---|---|---|---|---|
| criar | `POST /api/setlists` | **B** (`withBodyValidation` → `requireAuthServerSecure`, `api-validation-middleware.ts:101`) | **exige** (`secure-auth-utils.ts:307-310`) | `setlist-mutate` (`route.ts:92`) |
| renomear / datar | `PUT /api/setlists/[id]` | **B** | **exige** | `setlist-mutate` (`[id]/route.ts:148`) |
| apagar | `DELETE /api/setlists/[id]` | **A** (`requireAuthServer`, `[id]/route.ts:320`) | não | `setlist-mutate` via `enforceUserLimit` (`:325`) |
| adicionar | `POST /api/setlists/[id]/songs` | **B** | **exige** | `setlist-mutate` (`songs/route.ts:14`) |
| reordenar | `PUT /api/setlists/[id]/songs/order` | **B** | **exige** | `setlist-mutate` (`order/route.ts:18`) |
| remover | `DELETE /api/setlists/songs/[songId]` | **A** (`[songId]/route.ts:27`) | não | `setlist-mutate` (`:32`) |

- **Transporte**: o mesmo do T1-R1. A cadeia B aceita `Bearer` por regex sem diferenciar maiúsculas (`secure-auth-utils.ts:268`) e a A exige `Bearer ` literal (`firebase-server-utils.ts:154`); o `authFetch` manda o literal (`core/auth-fetch.ts:44`), que as duas aceitam. O cookie só é lido quando falta o header (pre-check §1.2 item 1).
- **Duas políticas de email na mesma tela** (div. 152): com email não verificado, criar, datar, adicionar e reordenar dão 401; apagar e remover funcionam.
- **Rate limit** `[medido: lib/user-rate-limit.ts:52]`: `MUTATE: { windowMs: 15 * 60_000, max: 120 }`, **por uid e compartilhado pelas seis rotas**. Na cadeia B, o limite conta **antes** da validação do corpo (`api-validation-middleware.ts:114-125` < `:151-164`), então um 400 também consome. O comentário do código dimensiona: "montagem de setlist de 56 canções cabe 2×" (`:51`). A leitura de ressincronização (§4) é de outra família (`setlist-read`, 300/min, `:50`) e não consome esta.
- **N2-D9 — 401 numa escrita não desloga.** O `authFetch` de hoje, no segundo 401, chama `onAuthFailure` (`core/auth-fetch.ts:55-64`), e no app isso é `signOutSession()` (`api.ts:83-86`). Numa escrita, esse caminho **não** pode rodar: o 401 vira falha da operação, a sessão continua, e as leituras (cadeia A) seguem funcionando. A política do T1-R3 (renovar uma vez, repetir uma vez, nunca uma terceira) continua valendo, porque ela protege a janela `authfail` por IP. Isso não duplica escrita: nas seis rotas o 401 sai antes de qualquer comando no banco (pre-check §7.1).
- **H-N2-11 declarada**: pela leitura do código, o 401 de email não verificado sai do mesmo `authRequired()` sem argumento (`api-validation-middleware.ts:111`) e deve ser idêntico byte a byte ao de token inválido. Se for, o nativo **não consegue** distinguir os dois e mostra uma frase genérica (N2-D9); distinguir no backend é item do Bloco D. A medição depende de uma conta com email não verificado (dono: Marcel).

---

## 4. Modelo local depois da escrita

**Regra: a verdade é o servidor.** Depois de qualquer 2xx de escrita, o app **ressincroniza** e **substitui** o cache pelo que o servidor devolveu numa leitura. O app **nunca** aplica a mutação localmente como se fosse a verdade. Isso é o T1-R9 ("Nada é mesclado", `PRD-TELA-1.md:130`) estendido à escrita, e o T1-R10 ligado (N2-D8) decide o que é invalidado.

### 4.1 O que cada 2xx devolve `[medido: handlers na main c33c794]`

| Operação | Status | Corpo | Serve como leitura do conjunto? |
|---|---|---|---|
| criar | 201 | a linha de `setlists` inteira + `setlist_songs` (`route.ts:209-210`) | só da setlist nova; não do conjunto |
| renomear / datar | 200 | a linha inteira + `setlist_songs` com content embutido (`[id]/route.ts:286`) | **não**: pode vir `setlist_songs: []` depois de um UPDATE bem-sucedido (`:228-233`, div. 178) |
| apagar | 200 | `{success:true}` (`[id]/route.ts:360`) | não |
| adicionar | 201 | a linha de `setlist_songs` (6 colunas) (`songs/route.ts:79-80`) | não; **sem** o `updated_at` novo da setlist, que a RPC mudou (`dump:67`) |
| reordenar | 200 | `{songs:[{id,position}]}` (`order/route.ts:56`) | só da ordem; **sem** o `updated_at` novo (`dump:337`) |
| remover | 200 | `{success:true}` (`[songId]/route.ts`, após a RPC de `:79`) | não; sem `updated_at` (`dump:265`) |

`[análise]` Só o 201 de criar e o 200 do reorder são leituras verdadeiras do que mudaram, e nenhum dos seis é leitura do **conjunto**. Aplicar o corpo exigiria um merge por operação e deixaria no cache um `updated_at` que não existe no servidor em quatro das seis (pre-check §6.1 item 4-b).

### 4.2 As opções (Q1 do §12 — **decidida: N2-D13, opção (b)**)

| Opção | O que faz | Custo por escrita | Compatível com T1-R9/R10? |
|---|---|---|---|
| **(a) corpo da resposta como substituição** | aplica o corpo do 2xx no cache | 0 request | **não**: é merge; o `PUT` pode mentir sobre as músicas (C5); quatro rotas não devolvem `updated_at` |
| **(b) `GET /api/setlists` depois da escrita** (pre-check §6.1-c, H-N2-5) | troca **só** o conjunto setlist+song pelo 200 da leitura; content fica como está | 1 `setlist-read` (≈ 50 KB na conta de audit, `N2-PRECHECK.md:511`) | **sim**: é o T1-R9 literal para o conjunto de setlists |
| **(c) sync completo** (`sincronizar`) | setlists + todas as páginas de content + `prefetchEArrumar` | 1 + ⌈N/100⌉ requests (`apps/native/src/sync.ts:59-60`; `App.tsx:159`) | sim, mas refaz content que a escrita não mudou (N2-D1) |

`GET /api/setlists/[id]` (uma setlist só) existe, mas trocar um item do conjunto **é** merge, e ele não vê uma setlist apagada por outro aparelho. Fica fora das opções.

**Custo de implementação da (b)** `[medido: pre-check §7.2]`: `save()` grava os dois arquivos juntos (`store.ts:121-122`). A (b) precisa de um `save` só de `setlists.json`, ou de regravar o `content.json` anterior sem mudança.

### 4.3 Casos de erro

- **404 numa escrita** (setlist ou song sumiu, por exemplo apagada em outro aparelho, ou já apagada — C6): a operação falhou; o app ressincroniza (mesma leitura do §4.2) e, se a setlist aberta não está mais no conjunto novo, **sai da tela** para S1 com a frase da §5 (T2-R10). Com o N2-D12, isso vale também para "apaguei algo que já não existia".
- **400 `field:"order"` do reorder** (falta, sobra ou corrida — C8): a setlist mudou entre a leitura e o gesto. O app ressincroniza e mostra a ordem do servidor; o gesto do usuário se perde e a tela diz isso. **Não existe 409** (div. 177).
- **500** (inclusive a falha do INSERT de `songs[]`, `route.ts:182`, e erro da RPC fora do mapa, `rpc-errors.ts`): estado de falha, cache intacto, sem nova tentativa automática.
- **Falha de rede** (N2-D2): estado explícito de falha, **sem fila**, e **nunca** "salvo" antes do 2xx. O cache não muda. `[análise]` Rede que cai **depois** de o servidor gravar e **antes** da resposta chegar deixa o app sem saber se gravou (pre-check §7.1): repetir `POST` cria outra setlist ou outro bis (C10). Por isso a política é: nenhuma repetição automática; a tela oferece "tentar de novo" só depois de uma ressincronização que mostre o estado real (H-N2-4, **N2-D18**).
- **Mesmo usuário em dois aparelhos** `[hipótese H-N2-12]`: a posse das rotas de RPC é checada **na rota, fora da transação** (pre-check §1.1), e as RPCs travam só a linha-pai. Entre dois aparelhos da mesma conta a posse não muda (nenhum writer muda `setlist_id`, `C-posse.txt`), então a lacuna não é de segurança. O que falta é **coordenação**: renomear no tablet e no web ao mesmo tempo → vence o último (C10), sem aviso; apagar num aparelho enquanto o outro edita → 404 no outro (§4.3, primeiro item). O PRD aceita o "último vence" e não pede pré-condição, porque isso exigiria mudar o backend. Dono: Marcel.

---

## 5. Requisitos

**T2-R1 — Criar setlist** `[J3 passo 1 e critério "≤ 3 taps"; N2-D1; N2-D20; N2-D16; SETLISTS.md §POST]`. De S1 (a entrada é recomendação medida para o brief, **N2-D16**: barra de 120 dp de S1, sem cobrir cartões), criar uma setlist pede **nome** (obrigatório) e **data** (opcional) e envia um `POST /api/setlists` com `{name}` ou `{name, performance_date}`, **sem `songs[]`** (as músicas entram pelo picker, T2-R6; **N2-D20**). Os campos `description`, `venue` e `notes` não são enviados (ausente grava `null`, `route.ts:127-131`). Com o 201, o app ressincroniza (T2-R9) e abre a setlist nova em S2, no estado vazio que orienta o próximo passo (J3, ponto de observação). Da lista S1 até a setlist criada, **≤ 3 taps**, sem contar a digitação do nome.
*Aceite*: em S1 online, criar "Show de sábado" sem data → `write op=create … status=201` no log, seguido de `resync … status=200`; S2 abre vazia com o nome; depois do resync a setlist está no topo de S1 (a API ordena por `created_at desc`, `route.ts:38`); taps contados na captura ≤ 3.

**T2-R2 — A data é data-calendário local** `[C2; SETLISTS.md §POST; N5 do PRD-TELA-1; prefetch.ts:39-43]`. A data é escolhida num seletor de calendário (nunca digitada) e enviada como `YYYY-MM-DD` montado com **ano, mês e dia locais do aparelho** (o mesmo `hoje()` do prefetch, `prefetch.ts:40-43`), **sem fuso e sem `toISOString()`**: a coluna é `date` (`schema.dump.sql:385`) e timestamp dá 400 (nota N1). "Sem data" é `null` e é um estado de primeira classe (as três setlists da conta de audit não têm data, pre-check §11). Na exibição, a string do servidor é lida como data-calendário, sem conversão de fuso (a formatação é do brief, §7).
*Aceite*: teste de unidade do formatador: um `Date` local de 16/09/2026 23:30 num fuso UTC−3 vira `2026-09-16` (e não `2026-09-17`); no aparelho, datar para amanhã → o corpo do `PUT` (log do servidor de mock) traz `performance_date` igual ao `hoje()+1` do prefetch.

**T2-R3 — O cliente valida só o que é dele** `[N2-D21; div. 154; div. 181; C4; pre-check §7.1]`. Antes de qualquer request de criar ou editar, o cliente confere **três** coisas, e só estas:
(i) **nome vazio depois de `trim()`** → não envia; o motivo aparece junto do campo;
(ii) **data impossível** (um dia que não existe no calendário, div. 154) → não envia; o motivo aparece junto da data. O servidor não confere o calendário (nota N1: `2026-02-31` passa pelo Zod), então esta checagem é do cliente;
(iii) **nada mudou → não envia**: editar e sair sem mudar nome nem data **não** gera `PUT`. Um `PUT {}` é válido e bumpa `updated_at` (C4; `[id]/route.ts:174-176`), e editar e cancelar não pode invalidar a setlist no próprio aparelho (T1-R10, T2-R18).
**O filtro de texto do servidor não é replicado** (div. 181): nome com `data:`, `javascript:`, `vbscript:` ou `<script` segue para o servidor, e o 400 dele (`VALIDATION_ERROR`) vira a frase do conjunto fechado "o nome tem um trecho que o servidor não aceita" (T2-R15). A correção do filtro é do **Bloco D**. O limite de 255 caracteres do nome também fica com o servidor.
*Aceite*: teste de unidade do validador: `"   "` → não envia; `2026-02-31` → não envia; `2026-02-28` → envia. No aparelho: abrir a edição de uma setlist e sair sem mudar nada → **nenhuma** linha `write op=` no log (A-N2-24). Com mock devolvendo `400 VALIDATION_ERROR` para `Show — data: 12/10` → um request, `write op=create status=400 code=VALIDATION_ERROR`, e a frase "o nome tem um trecho que o servidor não aceita" na tela.

**T2-R4 — Renomear e mudar a data** `[J3; SETLISTS.md §PUT; C4]`. Editar o nome ou a data envia um `PUT /api/setlists/[id]` **só com os campos que mudaram** (ausente = não mexe). Tirar a data envia `performance_date: null`. O nome nunca é enviado como `null`. **O web regrava os cinco campos sempre** (`setlist-service.ts:187-194`, pre-check §4); o nativo não copia, porque isso apagaria em silêncio um `venue`/`notes` que o nativo não exibe. Se nada mudou, não há request (T2-R3 (iii), N2-D21). O corpo do 200 **não** é aplicado (C5; N2-D13); vale a ressincronização (T2-R9).
*Aceite*: mock que registra corpos: renomear → corpo `{"name":"…"}` e nada mais; tirar a data → `{"performance_date":null}`; uma setlist com `venue` preenchido no servidor continua com `venue` depois de renomear pelo nativo (leitura pós-resync).

**T2-R5 — Apagar setlist, com confirmação** `[J3; SETLISTS.md §DELETE; N2-D12; N2-D14; #307]`. Apagar pede confirmação num **diálogo** com o nome da setlist, a contagem de músicas, a frase de que os arquivos baixados continuam no aparelho e dois botões, **sem "desfazer"** (N2-D14; a redação é do brief, §7), e envia um `DELETE /api/setlists/[id]`. **200** → ressincroniza e volta para S1 sem a setlist. **404** → é o contrato desde a #307 (`e20c0a4`, N2-D12) para setlist inexistente, alheia **ou já apagada** em outro aparelho: o app **não** trata como erro grave; ressincroniza, volta para S1 e diz "esta setlist já tinha sido apagada". Os arquivos baixados das músicas **não** são apagados (T1-R9: limpeza é do LRU, T1-R14).
*Aceite*: o diálogo mostra nome, contagem e a frase dos arquivos (captura); cancelar → nenhum request; apagar com 200 → `write op=delete … status=200`, `resync`, S1 sem o cartão; CN: mock devolve 404 → a mesma volta para S1, frase de "já apagada", **nenhum** `auth-failure`; o diretório de arquivos (`files-index.json`) é o mesmo antes e depois (`cmp`).

**T2-R6 — Adicionar música: picker sobre o cache local** `[J3 passo 2 e critério "≤ 3 taps por música, sem sair da tela"; T1-R21; T1-R22; T1-R24; C7; div. 155; N2-D15; N2-D17]`. De S2 em edição, um picker busca na **biblioteca do cache local** com o mesmo índice e a mesma normalização da busca da tela 1 (`buildIndex`/`searchIndex`, `packages/core/src/search.ts:30,53`; `normalizeForSearch`, `normalize.ts:7-14`: NFD → sem diacríticos → minúsculas → espaços colapsados). Cada toque em "adicionar" envia **um** `POST /api/setlists/[id]/songs` com `{content_id}` (a `position` não é enviada: o servidor a ignora, C7) e o picker **continua aberto** para a próxima. **Bis é permitido** (T1-R24; C7): adicionar de novo uma música que já está na setlist cria outra posição. O picker **marca** o que já está na setlist, inclusive "n×", e adicionar de novo **não pede confirmação** (N2-D15). Custo: **≤ 3 taps por música** (abrir o picker conta uma vez para a sequência; buscar e adicionar, por música). **Limite declarado** (div. 155): o addSong não tem teto, mas o reorder para em 100 (T2-R8), e **adicionar acima de 100 é permitido** (N2-D17); o picker avisa que, acima de 100, a setlist não pode ser reordenada.
*Aceite*: com a biblioteca da conta de audit em cache e o aparelho online, adicionar 10 músicas buscando `aguas`, `garota`, … → 10 linhas `write op=add … status=201`, **zero** navegação para fora de S2 (nenhum `index open`/`search close` intercalado), taps ≤ 3 por música na captura; `garôta` acha o mesmo resultado que `garota`; adicionar duas vezes a mesma música → sem diálogo, duas posições depois do resync, e a marca "2×" no picker (captura).

**T2-R7 — Remover música por `setlist_songs.id`** `[J3 passo 4; T1-R24; C9; div. 156]`. Remover envia `DELETE /api/setlists/songs/[songId]` com o **`setlist_songs.id` da posição tocada**, **nunca** com o `content_id`. **O que não copiar do web** (div. 156): o `setlist-manager.tsx` remove procurando `s.content.id === songId` (`:207`) e filtra **todas** as ocorrências no estado local (`:214`), e depois de adicionar usa um id falso `${setlist.id}-${songId}` (`:179`) que não é uuid (→ 500, div. 153). No nativo, todo id enviado vem de uma leitura do servidor (T2-R9), nunca de um id montado no cliente.
*Aceite*: setlist com o mesmo content nas posições 2 e 7; remover a 7 → o request leva o `id` da linha 7 (log do mock) e, depois do resync, a posição 2 continua lá e a setlist tem N−1 músicas contíguas 1..N−1; `grep` no código novo por `content_id` como argumento de remoção → vazio.

**T2-R8 — Reordenar: um request por gesto concluído** `[J3 passo 3 e critério "drag-and-drop … ou controles equivalentes"; C8; div. 155; N2-D17; T1-R28]`. Reordenar em S2 (arrastar, ou controles equivalentes, a decidir no brief) envia **um único** `PUT /api/setlists/[id]/songs/order` **quando o gesto termina**, com a permutação completa dos `setlist_songs.id` — nunca um request por passo do arrasto. Durante o gesto, a ordem mostrada é a do gesto; depois do 200, vale a ordem do servidor. **O arrasto não salvo é estado da tela, não do cache** (N2-D27; R2-1): depois de uma falha o modo fica aberto com o arrasto preservado, a releitura do T2-R9 acontece igual e atualiza a setlist atrás do modo, mas **não** sobrescreve a lista na tela, e "tentar de novo" reenvia **o arrasto**, não a ordem que o servidor já tem. O 200 do reorder **é** leitura da ordem (C8), mas não do `updated_at` (§4.1): a substituição segue a regra do T2-R9. **Teto de 100** (div. 155): numa setlist com mais de 100 músicas, o controle de reordenar fica **inativo com o motivo ao toque** (mesmo padrão do A15, N2-D17; ver div. 186). A correção do teto é do Bloco D. **Caso de medida**: a setlist de 60 da conta de audit (`4340bf95…`, pre-check §11).
*Aceite*: na setlist de 60, mover a 8 para a posição 2 com um gesto → **exatamente uma** linha `api … path=/api/setlists/<id8>/songs/order` e uma `write op=reorder items=60` no log; depois do resync a 8 antiga está em "2 de 60"; em mock com 101 músicas o controle de reordenar está inativo (`enabled=false` no dump), o toque mostra o motivo (captura) e nenhum request sai.

**T2-R9 — A verdade é o servidor: ressincronizar depois de todo 2xx** `[§4; T1-R9; T1-R10; N2-D8; N2-D13; N2-D22]`. Depois de todo 2xx de escrita, o app faz **`GET /api/setlists`** e **substitui** o conjunto de setlists pelo 200 dele (T1-R9; N2-D13). O corpo da resposta da escrita **não é aplicado** ao cache (div. 178). Nenhuma escrita altera o cache diretamente. Enquanto a leitura não volta, a tela mostra a operação como **concluída no servidor e ainda não relida** (o texto é do brief).
**Escrita 2xx seguida de resync que falha é um estado próprio** (N2-D22): **"salvo; não foi possível recarregar"** — nunca "salvo" limpo, nunca "falhou". O cache **não** muda (T1-R9), a escrita **não** é desfeita nem repetida, o log registra `resync kind=setlists … status=<n>` (T2-R16), e o `GET` é **refeito na próxima abertura da tela**.
*Aceite*: teste de unidade: dado um cache com a setlist X de `updated_at` T0 e um 201 de addSong, o cache só muda quando a leitura pós-escrita chega, e fica igual ao 200 dela (`cmp` do `setlists.json` com o corpo sem embutido); `grep` no código de escrita por gravação de `setlists.json` fora do caminho do resync → vazio. Com a leitura pós-escrita em 500 (mock): o `setlists.json` é byte a byte o anterior, a tela mostra "salvo; não foi possível recarregar", o log tem `resync kind=setlists … status=500`, e reabrir a tela gera um novo `GET /api/setlists` (A-N2-25).

**T2-R10 — 404 numa escrita: ressincronizar e sair** `[§4.3; T1-R9; N2-D12]`. Um 404 em qualquer escrita dispara a mesma leitura do T2-R9. Se a setlist aberta não está no conjunto novo, a tela volta para S1 com uma frase curta (setlist apagada em outro lugar). Se está (por exemplo, a **música** é que sumiu), a tela fica e mostra a lista nova.
*Aceite*: mock: addSong devolve 404 `Setlist not found` e a leitura seguinte não traz a setlist → `resync reason=404`, S1 aberta, frase visível; mock: remover devolve 404 `Song not found` e a leitura traz a setlist sem aquela música → S2 continua, sem a música.

**T2-R11 — Falha aparece; nada de "salvo" antes do 2xx; "tentar de novo" só depois de reler** `[N2-D2; N2-D18; N2-D22; T1-R37; H-N2-4; C10]`. Toda escrita tem quatro estados visíveis: **salvando** (request em voo), **falhou** (não-2xx ou rede, com a frase do T2-R15), **concluída** (2xx e leitura pós-escrita ok) e **salvo; não foi possível recarregar** (2xx e leitura pós-escrita falhou, N2-D22, T2-R9). "Salvo", ou qualquer sinal equivalente, **só** depois do 2xx. **Nunca há repetição automática** (N2-D18; C10: `POST` repetido duplica). **"Tentar de novo"** só aparece **depois** de uma ressincronização que mostre o estado real; para **criar** e **adicionar**, a tela avisa que a operação pode já ter sido gravada (N2-D18). Enquanto uma escrita está em voo, os outros controles de escrita da mesma tela ficam **ocupados** (uma escrita por vez; isso não é fila: nada é guardado para depois).
*Aceite*: mock com atraso de 3 s → "salvando" visível durante o atraso e nenhum "salvo"; mock com 500 → "falhou" visível, `setlists.json` inalterado (`cmp`), **uma** linha `api` para a rota (nenhuma repetição); com uma escrita em voo, tocar em outro controle de escrita não gera request; addSong com rede cortada → "tentar de novo" só aparece depois de um `resync` no log, com o aviso de que a música pode já ter entrado (captura).

**T2-R12 — Sem rede, sem escrita** `[N2-D2; T1-R18; LOGS-OCTAVIA.md regra 1]`. Offline (o `useOnline` de `net.ts:23-43`), os controles de escrita ficam **inativos com o motivo visível** e nenhum request sai. Se a rede cai com o controle ativo (o `expo-network` atrasa), o request falha por rede e vale o T2-R11. Para os aceites, **avião é o `ping` falhando, não o valor do setting** (`LOGS-OCTAVIA.md:351-362`); no Tab S6, avião é só o override da API (`:364-367`).
*Aceite*: em avião provado por `ping` (`connect: Network is unreachable`), tocar criar/adicionar/remover/apagar → **zero** linhas `api` e `write`, o motivo aparece; com rede cortada no meio de uma escrita → `write … status=net`, "falhou" visível, `setlists.json` inalterado (`cmp`), sessão mantida.

**T2-R13 — 401 numa escrita não desloga** `[N2-D9; div. 152; H-N2-11; T1-R3]`. Numa escrita, o segundo 401 **não** chama `signOutSession()`: a operação falha com a frase genérica do T2-R15, a sessão fica, e as leituras continuam. A regra do T1-R3 se mantém: no máximo 2 requests à mesma rota (a original e uma depois de renovar). Nenhuma escrita tenta distinguir "email não verificado" de "token inválido" pelo corpo (H-N2-11).
*Aceite (controle negativo)*: mock devolve 401 duas vezes no `POST /api/setlists` → exatamente 2 linhas `api status=401 … n=` para a rota, uma `write op=create status=401`, **nenhuma** `auth-failure` e **nenhuma** `login-screen`; S1 continua com as setlists; um `GET /api/setlists` seguinte (resync manual) sai com o mesmo usuário.

**T2-R14 — 429 numa escrita** `[T1-R4; §3; N2-D31]`. Um 429 de `setlist-mutate` bloqueia **todas** as escritas (a família é compartilhada) até o `Retry-After`, com a mensagem pt-BR do T1-R4. As leituras não são bloqueadas (outra família). **A frase que o músico lê vai sem número** (N2-D31): a PR-2 mede se o servidor manda mesmo o `Retry-After` e, só se mandar, a frase com `N` do T2-R15 fica no conjunto fechado; sem ele, vale a da moldura `N2-X-limite` (div. 225).
*Aceite*: mock 429 `Retry-After: 30` no addSong → `ratelimit retry-after=30 family=setlist-mutate`; nenhuma escrita por 30 s (os controles ficam inativos com o motivo); o resync manual continua possível.

**T2-R15 — Frases de erro: conjunto fechado, em pt-BR** `[T1-R36; errata W2 do LOGS-OCTAVIA.md (`:527-560`); CONTRATO-DE-ERRO.md:47-53]`. O que o músico lê sai de um conjunto **fechado** de frases, chaveado pelo `code` do envelope (nunca pelo campo `error`, que é inglês) e pela operação. Quem não tem frase declarada cai na genérica. **Nome da setlist, título da música e uuid nunca entram na frase de erro** (a tela já mostra o nome onde precisa); o detalhe vai **só** para o log (T2-R16). Conjunto inicial, **a revisar no brief** (a redação final é de design):

| `code` / condição | Frase |
|---|---|
| rede (`network`) | "sem conexão — nada foi salvo" |
| `AUTH_REQUIRED` | "não foi possível salvar — confira sua conta no site" |
| `RATE_LIMITED` | "muitas alterações seguidas — tente de novo em N s" |
| `NOT_FOUND` (setlist) | "esta setlist foi apagada em outro lugar" |
| `NOT_FOUND` (música) | "esta música já não estava na setlist" |
| `VALIDATION_ERROR` no reorder | "a setlist mudou — a ordem foi recarregada" |
| `VALIDATION_ERROR` em criar ou editar (inclui o filtro de texto, div. 181; N2-D21) | "o nome tem um trecho que o servidor não aceita" |
| `VALIDATION_ERROR` (outros) | "o servidor recusou os dados" |
| `INTERNAL_ERROR` | "falha no servidor — nada foi alterado aqui" |
| corpo sem envelope / `code` desconhecido | "não foi possível salvar" |

*Aceite*: teste de unidade: para cada linha da tabela, a chave → a frase; um `code` inventado → a genérica; o G4 (`gate:a20`) passa com as frases novas; captura (não dump, `LOGS-OCTAVIA.md:340-349`) de cada estado de falha alcançável mostra a frase e não mostra nome, título nem uuid.

**T2-R16 — Linhas de log novas, com formato fixado aqui** `[LOGS-OCTAVIA.md regras 1–4 (`:11-22`); G3]`. Entram no catálogo, por errata na PR de código que as emitir:

| Evento | Linha canônica | Quando |
|---|---|---|
| escrita | `write op=create\|update\|delete\|add\|remove\|reorder setlist=<id8\|-> items=<n\|-> status=<s\|net> code=<CODE\|net\|-> ms=<ms>` | fim de toda escrita (2xx, não-2xx ou rede). `setlist=-` só no `create` antes do 201; `items` = tamanho do `order` no reorder, `-` nas outras |
| ressincronização | `resync kind=setlists reason=write\|404\|order\|reopen op=<op\|-> status=<s\|net> setlists=<n\|-> ms=<ms>` | fim da leitura do T2-R9/R10. `kind` é sempre `setlists` (N2-D13; a chave fica para o formato não mudar). `status` é o da leitura: um não-2xx aqui é o estado da N2-D22. `reason=reopen` é o `GET` refeito na próxima abertura da tela (N2-D22), com `op=-` |
| escrita barrada | `write blocked op=<op> reason=offline\|ratelimit\|ceiling\|busy` | toque num controle de escrita inativo |

A linha `api` que já existe continua saindo para toda resposta de `/api/*`, **também nas escritas**, e o `path` das rotas de escrita troca cada uuid pelos seus 8 primeiros caracteres (`/api/setlists/<id8>/songs/order`, regra 3), porque a linha `api` de hoje só conheceu paths sem id (`api.ts:106`). Nada de nome, título, termo de busca ou corpo (regra 2). O `cache write kind=setlists … invalidated=<n>` do resync passa a carregar o contador **real** (N2-D8, T2-R18).
*Aceite*: G3 da PR de código lista exatamente as linhas novas desta tabela (e a mudança do `invalidated`), com errata no `LOGS-OCTAVIA.md`; `grep -E 'write op=|resync kind=' logcat` de um aceite completo não contém uuid inteiro, nome nem título (regra 4: `grep -rn eyJ` e `grep -rln <email>` com exit 1).

**T2-R17 — Criar ou datar para os próximos 7 dias dispara o prefetch** `[N2-D11; T1-R15; T1-R17; A10; div. 182]`. Quando a leitura do T2-R9 traz uma setlist com `performance_date` entre hoje e hoje+7 (a janela de `selectPrefetch`, `core/offline.ts:90-102`), o prefetch do T1-R15 roda para ela **sem** o usuário abrir a setlist, e o indicador do T1-R17 é recalculado. Com a leitura da N2-D13 (só setlists), a ressincronização chama o mesmo `prefetchEArrumar` que o sync completo chama (`App.tsx:159`). **O que o aceite mede é o mecanismo** (N2-D11): o A10 com dado real da conta principal continua **não reproduzido** até o Marcel criar uma setlist de show de verdade (H-N2-8; decisão de 2026-09-11).
*Aceite*: fixture ou mock com um content de `file_url` válida; criar pelo nativo uma setlist com data de amanhã e essa música → `write op=create`, `write op=add`, `resync`, e em seguida `prefetch plan n=1 reason=7d` e `file src=download …`, sem abrir a setlist; o indicador passa de "◔ 0 de 1" para "✓"; datar para daqui a 8 dias → nenhum `prefetch plan … reason=7d` para ela.

**T2-R18 — Pré-requisito: o T1-R10 ligado** `[N2-D8; div. 157; div. 121]`. A tela 2 **não nasce** sobre um sync que ignora `updated_at`. A primeira PR de código do N2 liga o `diffByUpdatedAt` (`core/sync.ts:87`, hoje sem chamador), troca o `invalidated=0` literal (`store.ts:123-124`) pelo contador real e traz o controle negativo (`invalidated=1` sob mock com `updated_at` diferente) **antes** de qualquer tela de escrita. A errata do A7 no `PRD-TELA-1.md` vai nessa PR. A div. 121 (T1-R17 (i), `updated_at` de content) fecha pelo mesmo mecanismo.
*Aceite*: na PR de código, o CN com `updated_at` diferente reprova contra o código de hoje e passa depois; no aparelho, dois syncs sem mudança → `invalidated=0` lido de um contador, e uma escrita seguida de resync → `cache write kind=setlists … invalidated=1`.
*Atendido pela N2-PR1 (#309, 2026-09-16)* no que é pré-requisito: CN reprovando 5 de 6 antes e passando 6 de 6 depois (`N2-PR1-anexos/CN-t1r10.txt`, `CN-t1r10-passa.txt`); errata do A7 no `PRD-TELA-1.md`. A metade "escrita seguida de resync → `invalidated=1`" só se mede quando houver escrita (PRs da tela). **A div. 121 fecha, mas não "pelo mesmo mecanismo"** (div. 191): a condição (i) do T1-R17 vale por construção — o cache de content é sempre o do último sync completo (T1-R9, `planSync` mantém os dois conjuntos juntos) — e um arquivo trocado no web ganha `file_url` nova (`upload/route.ts:94-103`, `Date.now()` no nome e `upsert: false`), então o indicador cai para ◔ sem olhar `updated_at`; o contador desta PR garante só que o status é recalculado quando o conjunto muda. Medição em `N2-PR1-anexos/README.md`.

**T2-R19 — Edição e palco não se cruzam** `[N2-D19; H-N2-7; pre-check §8.3 item 2; T1-R24]`. O palco é endereçado por `position` (`navigation.tsx:31`), e um reorder muda a música que uma posição aponta. Por isso **S2 aberta a partir do palco não oferece edição** (N2-D19). S2 passa a ter **dois estados de entrada**, ambos alcançáveis e medidos no G6:
- **S2 com edição** — aberta a partir de S1 (ou da criação, T2-R1): criar/renomear/datar, picker, reordenar, remover e apagar disponíveis;
- **S2 sem edição** — aberta a partir do palco (o índice do T1-R28): só navegação, como hoje; nenhum controle de escrita aparece.
*Aceite*: palco na música 4, abrir o índice pelo palco → S2 sem edição, nenhum controle de escrita na árvore (dump); voltar ao palco → "4 de N" com a mesma música (`stage restore n=4/N`); S2 aberta de S1 → controles de edição presentes; os dois estados com `resource-id` próprio no G6.

---

## 6. Aceites da tela 2

A tela 2 está pronta quando **todos** abaixo passam, no AVD `octavia_tab32` e no Tab S6 (onde o critério pede aparelho), com a **conta de audit** (H-N2-1: email verificado) e o mock onde indicado. Evidência nomeada em cada linha.

| # | Critério | Evidência | Rastreio |
|---|---|---|---|
| A-N2-1 | Criar sem data em ≤ 3 taps; setlist no topo de S1 depois do resync; S2 vazia orienta | log `write op=create status=201` + `resync`; captura; contagem de taps | T2-R1 |
| A-N2-2 | Data local, sem fuso: 23:30 em UTC−3 vira o mesmo dia; o `PUT` leva o `hoje()+1` | teste de unidade; corpo no mock | T2-R2 |
| A-N2-3 | Nome vazio e data impossível não geram request; o 400 do filtro do servidor vira "o nome tem um trecho que o servidor não aceita" | teste de unidade; log com um `write … status=400`; captura | T2-R3, T2-R15 |
| A-N2-4 | `PUT` só com o campo mudado; `venue` do servidor sobrevive ao renomear | corpo no mock; leitura pós-resync | T2-R4 |
| A-N2-5 | Apagar com o diálogo da N2-D14 (nome, contagem, frase dos arquivos); 404 (já apagada) volta a S1 sem `auth-failure`; arquivos intactos | log; `cmp files-index.json` | T2-R5 |
| A-N2-6 | 10 músicas adicionadas pelo picker, ≤ 3 taps cada, sem sair de S2; bis gera duas posições | log (10 × `write op=add`); captura | T2-R6 |
| A-N2-7 | Remover a posição 7 de um bis 2/7 mantém a 2; o request leva o `setlist_songs.id` | corpo/URL no mock; leitura pós-resync | T2-R7 |
| A-N2-8 | **Setlist de 60: mover a 8 para a 2 = um request** | log: **uma** `api … /songs/order` e **uma** `write op=reorder items=60` | T2-R8 |
| A-N2-9 | Setlist de 101 (mock): adicionar permitido; reordenar inativo com o motivo ao toque, zero request | dump (`enabled=false`); captura; log `write blocked … reason=ceiling` | T2-R6, T2-R8 |
| A-N2-10 | Cache só muda pela leitura pós-escrita; leitura em 500 deixa o cache byte a byte | teste de unidade; `cmp setlists.json` | T2-R9 |
| A-N2-11 | 404 numa escrita: resync e volta a S1 quando a setlist sumiu; fica em S2 quando só a música sumiu | log `resync reason=404`; captura | T2-R10 |
| A-N2-12 | **Escrita com rede cortada: estado de falha visível, cache inalterado, sessão mantida** | avião provado por `ping` no meio da escrita; `write … status=net`; `cmp setlists.json` | T2-R11, T2-R12 |
| A-N2-13 | 500 → "falhou", uma única request, nenhum "salvo"; atraso de 3 s → "salvando" | log (uma `api`); captura | T2-R11 |
| A-N2-14 | Offline por `ping`: controles inativos com motivo, zero `api`/`write` | log; captura | T2-R12 |
| A-N2-15 | **CN: 401 duplo numa escrita não desloga** — 2 requests, nenhuma `auth-failure`/`login-screen`, leitura seguinte com o mesmo usuário | log | T2-R13 |
| A-N2-16 | 429 no addSong bloqueia escritas por `Retry-After`; leitura continua | log `ratelimit … family=setlist-mutate` | T2-R14 |
| A-N2-17 | Frases de erro do conjunto fechado; `code` desconhecido → genérica; nada de nome/título/uuid na tela | teste de unidade; G4; captura | T2-R15 |
| A-N2-18 | Linhas novas no formato do T2-R16, sem uuid inteiro, nome ou título | G3 com errata; `grep` sobre o anexo | T2-R16 |
| A-N2-19 | **Datar para amanhã dispara o prefetch sem abrir a setlist**; indicador ◔ → ✓; 8 dias → nada | log `prefetch plan … reason=7d` + `file src=download`; captura | T2-R17 |
| A-N2-20 | T1-R10 ligado: CN `invalidated=1` reprova antes e passa depois; resync pós-escrita conta 1 | CI (G7) e log | T2-R18 |
| A-N2-21 | S2 pelo palco: sem edição; S2 por S1: com edição; volta ao palco na mesma música | dump dos dois estados (G6); log `stage restore n=4/N` | T2-R19 |
| A-N2-22 | J3 inteiro na conta de audit (criar com data, 10 músicas, 8→2, remover uma, revisar) sem sair do app e sem erro | anexo com o log do fluxo e as capturas | J3 |
| A-N2-23 | Contabilidade de prod: requests por família dentro de `setlist-mutate` 120/15 min, e o estado da conta de audit restaurado ao da Fase B (`N2-PRECHECK.md:526-532`) | `B-c` repetido e comparado | §3 |
| A-N2-24 | **Editar uma setlist e cancelar sem mudar nada → nenhuma linha `write op=` no log** | log do trecho (`grep 'write op='` vazio); `setlists.json` inalterado (`cmp`) | T2-R3 (N2-D21) |
| A-N2-25 | **Escrita 2xx com o `GET` seguinte falhando (mock) → "salvo; não foi possível recarregar" na tela e `resync kind=setlists … status=<n>` no log**; reabrir a tela refaz o `GET` | captura; log (`write … status=201` seguido de `resync … status=500`, depois `resync reason=reopen`) | T2-R9 (N2-D22) |

Baselines a **não regredir**: A4, A5, A14, A17 da tela 1 (a escrita não pode tornar a abertura mais lenta nem o palco menos rápido); G5/G6 do V1 (`V1-ENCERRAMENTO.md:200-201`).

---

## 7. Superfícies para o brief de design (não é design)

> **Atendido e congelado (2026-09-21).** As nove superfícies abaixo foram desenhadas e estão em [`docs/native/DESIGN-N2/`](DESIGN-N2/) — 18 molduras, 5 estados da linha de aviso, o anexo D dos cinco ícones. **A partir daqui, o desenho congelado é a fonte**, e esta seção fica como o pedido que o originou. O item **8** (a §8.3 do V1) foi decidido em **não**, com gatilho medido (N2-D24); o item **1** confirmou a recomendação medida, e a barra de 120 dp não cobre cartão.

O Claude Design desenha, como extensão de S1/S2 (N2-D4):

1. **Entrada de "criar" em S1** — **recomendação medida (N2-D16)**: botão fixo na barra superior de 120 dp de S1 (`DESIGN-V1/README.md:209`), ao lado de "buscar", sem cobrir cartões. O Claude Design pode contrapropor com justificativa; a decisão final é do aval do desenho. O brief também resolve como a entrada ela aparece no estado vazio **S1f**, cujo texto hoje diz para criar "na versão web" (`SetlistsScreen.tsx:359-361`) e passa a ser falso com o N2 (pre-check §8.3 item 1).
2. **Formulário de nome e data** — criar e editar; o seletor de calendário; "sem data"; o motivo quando o nome não passa (T2-R3).
3. **S2 com e sem edição** (N2-D19, T2-R19) — os dois estados de entrada (a partir de S1 e a partir do palco); na S2 com edição: entrar e sair do modo, reordenar (arrastar ou controles equivalentes, J3), remover por posição, e o reordenar inativo acima de 100 com o motivo ao toque (N2-D17, div. 186).
4. **O picker** — busca na biblioteca local, "adicionar" repetível sem fechar, a marca do que já está na setlist, inclusive "n×", sem confirmação para repetir (N2-D15), e o aviso de que acima de 100 não se reordena (N2-D17).
5. **Diálogo de apagar** (N2-D14) — nome da setlist, contagem de músicas, a frase de que os arquivos baixados continuam no aparelho, dois botões, sem "desfazer".
6. **Estados da escrita** — salvando; concluída e ainda não relida; **"salvo; não foi possível recarregar"** (N2-D22, distinto de "salvo" e de "falhou"); falhou (com as frases do T2-R15); sem rede; limite de taxa; e "tentar de novo" só depois de reler, com o aviso de que criar/adicionar pode já ter sido gravado (N2-D18).
7. **A data na tela** — hoje crua, `YYYY-MM-DD` (`SetlistsScreen.tsx:214`, `IndexScreen.tsx:213`); formatar é do brief.
8. **A §8.3 do `DESIGN-V1`** (ordenar S1 pela data do show, `DESIGN-V1/README.md:390-396`) **se decide no brief** (N2-D4). O próprio §8.3 registra que, com os dados de hoje, a ordenação quase não aparece; o N2 é o que pode mudar isso, porque passa a criar setlists datadas.
9. **Tom na listagem de S2** — o critério 4 do J3 pede título, artista e **tom** sem abrir o item; o brief confere se S2 mostra o `key`.

Restrições que o brief herda: alvos ≥ 48 dp (`touch.min`, `DESIGN-V1/README.md:189-195`); todo inativo com o motivo legível sem toque (`DESIGN-V1/README.md:374`); a data do cartão cabe no layout atual ou no da §8.3; nenhum texto em inglês (G4).

---

## 8. Gates

| Gate | O que muda | Em qual PR |
|---|---|---|
| **G1** (`apps/native/scripts/g1.sh`) | **commit 1 da primeira PR de código (N2-D8)**: esvaziar a lista de exceções herdada da W3 (`files.ts`, `prefetch.ts`, hoje "declarada e não usada", div. 141, pre-check §10) e declarar os arquivos que a PR toca (`apps/native/src/store.ts`, `apps/native/src/sync.ts`, e o que mais o desenho da PR pedir). Nas PRs da tela: `apps/native/src/api.ts` (as escritas), `navigation.tsx`, `screens/SetlistsScreen.tsx`, `screens/IndexScreen.tsx`, o picker e o que ele reusar de `SearchScreen.tsx`, `App.tsx` (resync). Arquivo novo no escopo também se declara. **G1b**: só adição nos testes do core | cada PR, no commit 1 |
| **G2** (`g2g3.sh`) | `testID` novos: entrada de criar, formulário, modo de edição, alça ou controle de reordenar e de remover por posição, picker e seus resultados, confirmação de apagar, os estados da escrita. **Base: os `testID` sugeridos da §7 de `DESIGN-N2/README.md`** — a tabela tem **25** linhas, embora a folha se anuncie com 23 (div. 221); sugestão, não contrato, e o aceite no aparelho decide. Nenhum dos 43 atuais some (pre-check §8.2) | PRs da tela |
| **G3** | as linhas do T2-R16 e o `invalidated` real; errata no `LOGS-OCTAVIA.md` na mesma PR. Baseline 57 (pre-check §8.2) | N2-D8 e PRs da tela |
| **G4** (`gate:a20`) | as frases do T2-R15 e todos os rótulos novos, **inclusive** `accessibilityLabel`/`Hint` | PRs da tela |
| **G5** | todo alvo novo ≥ 48 dp (alça de arrastar, remover, adicionar no picker, datas do seletor) | aceite da tela |
| **G6** | todo estado novo alcançável por `resource-id` e todo alvo tocável com `testID` — inclusive **S2 com edição e S2 sem edição** (N2-D19), salvando, falhou, **salvo; não recarregado** (N2-D22), sem rede, limite, teto de 100, diálogo de apagar | aceite da tela |
| **G7** (`g7.sh`) | os testes de unidade do T2-R2, R3, R9, R15 e o CN do T2-R18 | cada PR |
| **`gate:icones`** | os **cinco** desenhos novos — `nova setlist`, `alça`, `renomear`, `apagar setlist` e o par `adicionar / remover` — entram no mapa contra o anexo D de `DESIGN-N2/telas.html`, levando o catálogo a **39** registros (E17, N2-D33). Não há ícone de calendário: a data usa o seletor do sistema e o `data` já existe no V1 (div. 224) | **commit 1 da PR-2**, antes de desenhar tela |

Regra que vale para todos: **o gate vem antes do que ele mede** (`V1-ENCERRAMENTO.md:204`).

---

## 9. Hipóteses

| # | Hipótese | Dono | Como fecha |
|---|---|---|---|
| **H-N2-2** (herdada) | a conta **principal** tem `emailVerified: true` | Marcel (console do Firebase) | aberta. Com `false`, criar/datar/adicionar/reordenar dão 401 e, pelo T2-R13, **não** deslogam |
| **H-N2-3** (herdada) | id de path malformado → 500 também no addSong e no reorder | executor | aberta para as duas (a removeSong foi medida, B-d). O nativo só manda ids lidos do servidor (T2-R7), então não alcança |
| **H-N2-4** (herdada) | nenhuma repetição automática; o risco de setlist ou bis duplicado sob rede instável é aceito | — | **decidida (N2-D18)**: nunca repetição automática; "tentar de novo" só depois de reler |
| **H-N2-5** (herdada) | a leitura pós-escrita é `GET /api/setlists` (opção b) | — | **decidida (N2-D13)** |
| **H-N2-6** (herdada) | `performance_date` impossível → 500 | executor | a Fase C ou um teste de rota; o nativo não gera esse valor (T2-R3) |
| **H-N2-7** (herdada) | reordenar com o palco na pilha muda a música de uma posição | — | **decidida (N2-D19)**: S2 pelo palco não edita (T2-R19) |
| **H-N2-8** (herdada) | o A10 com dado real continua não reproduzido | Marcel | decidido (N2-D11); T2-R17 mede o mecanismo |
| **H-N2-9** (herdada) | `setlist-mutate` 120/15 min basta | executor | conta do J3: criar 1 + 10 adds + 1 reorder + 1 remove + 1 PUT = **14**; montar a setlist de 60 do zero = 62 (pre-check §12). Duas montagens de 60 em 15 min estouram → T2-R14 cobre |
| **H-N2-10** (herdada) | o design cabe no `SetlistDTO` atual (`core/types.ts:58-67`) | Claude Design / executor | brief; o T2-R4 não precisa de `venue`/`notes` no DTO porque não os envia |
| **H-N2-11** (herdada) | o 401 de email não verificado é idêntico byte a byte ao de token inválido | **Marcel** (conta não verificada) | medição pendente; decide o ramo da N2-D9 (T2-R13 já cobre os dois) |
| **H-N2-12** (nova) | o "último vence" entre dois aparelhos da mesma conta é aceitável, sem pré-condição de versão | Marcel | aceito por construção (backend sem alteração); reabre se o uso real mostrar perda |
| **H-N2-13** (nova) | o `useOnline` (`expo-network`) marca offline rápido o bastante para o T2-R12 barrar a maioria das escritas antes do request | executor | aceite A-N2-14 com o tempo entre o corte (`ping`) e o `net offline` no log |
| **H-N2-14** (nova) | a leitura pós-escrita (b) cabe no orçamento de latência: ≈ 50 KB, 150–340 ms quente (`PRD-TELA-1.md:167`) por escrita, sem degradar o picker | executor | A-N2-6 com o `ms` do `resync` nas 10 adições |
| **H-N2-15** (nova) | nenhum nome de setlist real do Marcel contém `data:` ou `on<palavra>=` em `notes`/`description` (o web já os recusaria) | Marcel | pela N2-D21 o nativo **não** replica o filtro: um nome assim chega ao servidor e volta como a frase do T2-R15; a correção do refine é do Bloco D (div. 181) |

---

## 10. Herança e backlog, com destino

| Item | Origem | Destino |
|---|---|---|
| Div. 152 — duas políticas de email verificado na mesma tela (B1.5) | pre-check | **Bloco D** (o nativo convive: T2-R13) |
| Div. 153 — três rotas sem validação de id de path → 500 | pre-check | **Bloco D** |
| Div. 154 — `performance_date` sem checagem de calendário | pre-check | **Bloco D** (o cliente confere a data, T2-R3, N2-D21) |
| Div. 155 — reorder com teto de 100, addSong sem teto | pre-check | **Bloco D** (o nativo declara o teto, T2-R8, N2-D17) |
| Div. 156 — remove por `content.id` e id local falso no web | pre-check | **Bloco D** (o nativo não copia, T2-R7) |
| Div. 172 — web mostra erro ao apagar setlist já apagada | hotfix #307 | **Bloco D** |
| Div. 174 — `DELETE /api/content/[id]` segue 200 idempotente | hotfix #307 | **pre-check do N3**, junto do B9 |
| Divs. 178, 179, 180, 181 — os achados de handler desta PR | §13 | **Bloco D** |
| Div. 119, estouro do `lruEvict`, build de release | N2-D3 | **W4** |
| `DESIGN-V1` §8.1, §8.2, §8.4 | V1 | fora do N2; §8.3 entra no brief (N2-D4) |
| **J3 passo 6 — duplicar setlist** | `JOBS.md:90-91` | **gap declarado**: não existe rota (§2). Com o backend como está, duplicar no cliente custaria 1 `POST` com `songs[]` (até 100; C2) — mas **sem** as `notes` por posição se o cliente não as tiver, e com um `content_id` repetido proibido no `songs[]` (bis vira 400). Destino: **pós-N2** (N2-D20: o `songs[]` do POST fica fora do N2 e é a base desse "duplicar"); se entrar, pede rota ou regra para bis |
| Idempotência de escrita / fila offline | N2-D2; B9 | bloco próprio de fila offline (depois do N3) |
| Pré-condição de versão (`If-Match`) em metadados | pre-check §2.2 L4 | **Bloco D**, se o uso real pedir (H-N2-12) |
| `description`, `venue` e `notes` da setlist no nativo | H-N2-10 | pós-N2 (o web continua editando) |

---

## 11. O que a tela 2 NÃO faz

| Exclusão | Destino |
|---|---|
| Criar, editar, apagar **content**; upload; import (J4) | **N3** (com o B9 antes; N2-D1) |
| Anotações (criar ou renderizar; J2, CONT-03) | pós-N3, com modelo de dados decidido lá (C-D7) |
| `notes` por posição (`setlist_songs.notes`): escrever | fora do N2 (a leitura já existe, T1-R35); o addSong do nativo não envia `notes` |
| Transposição de tom (J2) | posterior |
| Favoritar (CONT-05) | posterior |
| Fila de escrita offline; repetição automática; idempotência | bloco próprio (N2-D2) |
| **Duplicar setlist** (J3 passo 6) | gap declarado (§10) |
| Editar `description`, `venue`, `notes` da setlist | pós-N2 (§10) |
| Multiusuário, compartilhamento, `is_public` | **nunca** (anti-jobs do `JOBS.md`) |
| Resolver conflito entre aparelhos (merge, aviso de versão) | **nunca** no N2 (H-N2-12) |
| Mudar o backend | **nunca** no N2 (`N2-PRECHECK.md:3-5`); os achados vão ao Bloco D |

---

## 12. Perguntas para o Marcel — todas decididas (registro)

As opções e as recomendações da revisão 0 ficam como estavam, para o registro. A decisão de cada uma está na linha **Decidida** e no §0.

**Q1 — Como o app relê depois de uma escrita?** (§4.2; H-N2-5; T2-R9)
- (a) aplicar o corpo da resposta no cache;
- (b) `GET /api/setlists` depois de cada 2xx, trocando só o conjunto de setlists;
- (c) sync completo (setlists + content + prefetch).
- **Recomendação: (b).** É o T1-R9 literal para o conjunto de setlists, custa uma leitura de outra família (`setlist-read`, 300/min), pega apagamentos feitos em outro aparelho, e não confia no 200 do `PUT`, que pode vir com `setlist_songs: []` depois de gravar (div. 178). A (a) é merge e deixaria um `updated_at` inexistente em quatro das seis rotas. A (c) refaz o content, que a escrita não muda. Custo da (b): um `save` só de `setlists.json` (`store.ts:121-122` hoje grava os dois arquivos).
- **Decidida: N2-D13** — opção (b).

**Q2 — Como é a confirmação de apagar?** (T2-R5)
- (a) diálogo com o nome da setlist e dois botões ("apagar" e "cancelar");
- (b) desfazer por alguns segundos, sem diálogo;
- (c) digitar o nome para confirmar.
- **Recomendação: (a).** A (b) exige segurar o `DELETE` no cliente, o que é uma fila disfarçada (N2-D2) e mente "apagado" antes do 200. A (c) é pesada para o sofá do J3. O diálogo diz quantas músicas a setlist tem e que os arquivos baixados continuam no aparelho.
- **Decidida: N2-D14** — opção (a).

**Q3 — O picker marca as músicas que já estão na setlist?** (T2-R6; bis)
- (a) sim, com uma marca ("já na setlist" ou "2×"), e adicionar continua permitido;
- (b) não marca;
- (c) marca e pede confirmação para adicionar de novo.
- **Recomendação: (a).** O bis é contrato (C7) e acontece (69 songs, 60 content distintos na conta de audit), então bloquear ou confirmar custa um toque que o J3 não tem (≤ 3). Sem marca, o músico adiciona duas vezes sem querer. Os resultados da setlist atual continuam agrupados primeiro, como no T1-R22.
- **Decidida: N2-D15** — opção (a).

**Q4 — Onde entra "criar"?** (T2-R1; §7 item 1)
- (a) botão fixo na barra superior de S1, ao lado de "buscar";
- (b) botão flutuante em S1;
- (c) só no estado vazio S1f e num menu.
- **Recomendação: (a).** Cabe na barra de 120 dp de S1 (`DESIGN-V1/README.md:209`), mantém o ≤ 3 taps e não cobre cartões. O S1f ganha o mesmo botão no lugar do texto que manda ir ao web. A decisão final é do brief.
- **Decidida: N2-D16** — opção (a) como recomendação para o brief de design, com a medida; o aval do desenho decide.

**Q5 — O que fazer com setlist acima de 100 músicas?** (T2-R6, T2-R8; div. 155)
- (a) permitir adicionar acima de 100, e o reordenar fica inativo com o motivo;
- (b) bloquear o picker em 100;
- (c) reordenar só um trecho (não existe rota: exigiria backend).
- **Recomendação: (a).** É o que o backend faz hoje, sem esconder o limite. A maior setlist medida tem 60 (pre-check §11). A (b) inventa um teto que o servidor não tem; a (c) contraria o "backend sem alteração". A correção (teto único ou reorder parcial) vai para o Bloco D.
- **Decidida: N2-D17** — opção (a); o motivo aparece **ao toque** (padrão A15), ver div. 186.

**Q6 — Existe "tentar de novo" numa escrita que falhou?** (T2-R11; H-N2-4; C10)
- (a) sim, mas só **depois** de uma ressincronização que mostre o estado real; para criar e adicionar, a tela avisa que a operação pode já ter sido gravada;
- (b) não: a falha aparece e o usuário refaz o gesto;
- (c) repetição automática uma vez.
- **Recomendação: (a).** A (c) duplica setlist ou bis quando a rede cai depois da gravação (C10). A (b) é segura, mas o usuário não sabe se precisa refazer. A (a) resolve com a leitura que o T2-R9 já faz.
- **Decidida: N2-D18** — opção (a).

**Q7 — Editar com o palco na pilha?** (T2-R19; H-N2-7)
- (a) S2 aberta a partir do palco não oferece edição;
- (b) o palco passa a ser endereçado por `setlist_songs.id` e se ajusta depois do resync;
- (c) nada muda.
- **Recomendação: (a).** J3 é preparação, não palco (J1/J2). A (b) mexe na navegação do palco, que é a parte mais medida do app (A14, A17), por um caso que o J3 não pede. A (c) deixa o palco apontar para outra música depois de um reorder.
- **Decidida: N2-D19** — opção (a).

**Q8 — Criar já com músicas, num request só?** (T2-R1; C2)
- (a) não: criar só com nome e data; as músicas entram pelo picker, uma por request;
- (b) sim: o fluxo de criar escolhe as músicas antes e manda `songs[]` (até 100) no `POST`.
- **Recomendação: (a) no N2.** A (b) economiza requests (1 contra 1 + N), mas o `songs[]` recusa `content_id` repetido (bis vira 400), a falha do INSERT tem o pior caso de setlist vazia órfã (`route.ts:156-159`), e o critério do J3 é "criar setlist **vazia** ≤ 3 taps". A (b) é a base natural de um "duplicar" futuro (§10).
- **Decidida: N2-D20** — opção (a).

**Q9 — O que o cliente valida antes de enviar?** (T2-R3; divs. 154, 181) *(nova, revisão 1)*
- (a) espelhar as regras do servidor, inclusive o filtro de texto;
- (b) validar só o que é do cliente e deixar o filtro com o servidor.
- **Decidida: N2-D21** — nome vazio após `trim`, data impossível e "nada mudou → não envia"; o filtro do servidor não é replicado, e o 400 dele vira a frase "o nome tem um trecho que o servidor não aceita". *(A revisão 0 do T2-R3 tinha seguido a (a).)*

**Q10 — O que a tela mostra quando a escrita deu 2xx e a releitura falhou?** (T2-R9, T2-R11) *(nova, revisão 1)*
- (a) "salvo";
- (b) "falhou";
- (c) um estado próprio.
- **Decidida: N2-D22** — estado próprio "salvo; não foi possível recarregar", log `resync kind=setlists status=<n>`, e o `GET` refeito na próxima abertura da tela.

---

## 13. Divergências (177 a 186)

| # | Origem | Divergência | Estado |
|---|---|---|---|
| **177** | **P** | O prompt fala em "409/erro da RPC". **Não existe 409** nem na taxonomia (`CONTRATO-DE-ERRO.md:47-53`, cinco códigos) nem nos handlers: os erros das RPCs saem por `rpc-errors.ts:21-48` como 400 (`OB601`, reorder), 404 (`OB602`, `OB603`, `OB604`) ou 500 (qualquer outro). "Conflito" no reorder é um **400 `field:"order"`** | registrada; §4.3 e T2-R15 usam os códigos reais |
| **178** | **A** | **`PUT /api/setlists/[id]` responde 200 com `setlist_songs: []` quando a leitura das músicas falha depois do UPDATE** (`[id]/route.ts:228-233`), e segue com fallbacks quando a leitura do content falha (`:251-253`). Um 2xx que diz uma coisa falsa sobre as músicas | registrada; contratada no `SETLISTS.md`; o nativo não usa o corpo (T2-R4, T2-R9). **Bloco D** |
| **179** | **A** | O content embutido tem fallbacks diferentes por rota: `POST` usa `??` e `artist: null` (`route.ts:195-202`); `PUT` usa `\|\|` e `artist: "Unknown Artist"` (`[id]/route.ts:274-281`), o que também troca `bpm: 0` e string vazia por `null`/fallback | registrada; inofensiva para o nativo (T1-R8). **Bloco D** |
| **180** | **A** | O 500 da falha do INSERT de `songs[]` leva `error: "Failed to create setlist songs"` (`route.ts:182`), não o `"Internal server error"` dos outros 500. Não é mensagem de dependência (o `CONTRATO-DE-ERRO.md:53` proíbe essa), mas o corpo não é o do exemplo normativo (`:98`) | registrada; o nativo chaveia por `code`. **Bloco D** |
| **181** | **A** | **O `refine` de texto recusa português comum.** `/data:/i` (`api-schemas.ts:61`, `:71`, `:79`) recusa um nome `Show — data: 12/10` ou um `venue` `Bar Data: centro`; o `/on\w+\s*=/i` do `safeHtml` (`:79`) recusa `notes: "dois tons = abaixo"`. `[medido: nota N1]` | registrada; pela **N2-D21** o nativo **não** replica o filtro: o 400 vira frase do T2-R15 (revisão 1; a revisão 0 dizia "o nativo valida antes"); corrigir o refine é **Bloco D**; H-N2-15 |
| **182** | **P** | O prompt diz que criar ou datar "dispara o **T1-R17**". O prefetch é o **T1-R15** (`PRD-TELA-1.md:173`); o T1-R17 é o indicador (`:179`); o A10 cobre os dois (`:286`). É a mesma troca da div. 146 do pre-check | registrada; o T2-R17 cita os dois |
| **183** | **P** | O prompt pede corrigir, no `PRD-TELA-1.md`, "a referência à #307 no requisito que fala de apagar". **O `PRD-TELA-1.md` não tem requisito de apagar** (a tela 1 é só leitura; `grep -n "#307\|N2-D12\|apag" docs/native/PRD-TELA-1.md` só acha o escopo `:11`, o T1-R9 `:130`, o aceite do T1-R17 `:180`, o T1-R33 `:236` ("nunca apaga"), o backlog `:321` e as exclusões `:360-361` — nenhum é requisito de apagar setlist). A referência à #307 vive no **T2-R5** deste PRD e no `SETLISTS.md`; no `PRD-TELA-1.md` só muda a linha `:314` (lista fechada, item 3) | registrada |
| **184** | **D** | O T1-R11 do `PRD-TELA-1.md:139` cita `docs/api/SETLISTS.md:41-43` para o texto "Gates na rota: setlist inexistente-ou-alheia → 404…". O texto estava em `:78-80` antes da #307 (div. 171) e, com esta errata, mudou de linha outra vez: está na seção `POST /api/setlists/[id]/songs` | registrada; **não** corrigida (lista fechada); vai na PR da N2-D8, que já toca o `PRD-TELA-1.md` para a errata do A7. Citar por seção, não por linha |
| **185** | **D** | As linhas do `DELETE /api/setlists/[id]` citadas no pre-check (`[id]/route.ts:340-343`, `:351-355`, `:357-362`, wrapper `:370-381`) são **anteriores à #307**. Na `main` `c33c794`: handler `:315-365`, DELETE único `:343-348`, 404 `:356-358`, wrapper `:368-379`. Este PRD e o `SETLISTS.md` citam as linhas novas | registrada; o pre-check fica como está (é foto da `9e14042`) |
| **186** | **P** | **A N2-D17 diz "motivo ao toque (mesmo padrão A15)"; o `DESIGN-V1` diz que o motivo de um desabilitado "tem que ser legível sem toque"** (`DESIGN-V1/README.md:374`), e a revisão 0 deste PRD seguia o `DESIGN-V1` ("motivo visível", no T2-R3, T2-R8, T2-R12, T2-R14 e nas restrições do §7). O padrão A15 real é o do palco: tinta de inativo e `enabled=false` permanentes, motivo por `MOTIVO_MS` ao toque, e o `accessibilityLabel` com o motivo o tempo todo (`PRD-TELA-1.md:291-293`) | registrada. O T2-R8 segue a N2-D17 (ao toque). Os outros inativos (sem rede, limite, ocupado) **não** foram tocados pela decisão e ficam como estavam; a regra única para todos os inativos da tela 2 é do **brief/aval do desenho** |

---

## 14. Correções em outros documentos (nesta PR)

1. **`docs/native/PRD-TELA-1.md:314`** (div. 149): a linha do backlog que apontava `types/setlist.ts:40 event_date` como dead code foi riscada e marcada **fechada (B7-PR2)**. `wc -l types/setlist.ts` → `37`; `grep -n event_date types/setlist.ts` → `36:// zero consumidores e drift contra o banco (\`event_date\` não existe; a coluna` `[medido: nesta PR]`.
2. **`docs/api/SETLISTS.md`** (div. 145, N2-D7): seções `POST /api/setlists` e `PUT /api/setlists/[id]` novas; `DELETE /api/setlists/[id]` completo (deixa de ser "parcial"); tabela "Posse e autenticação por rota" com a frase "RLS não protege estas rotas; posse é do handler"; N2-D12 e a assimetria com content (div. 174); "Onde o contrato vive (regra 9)" (div. 176); cabeçalho com a errata.
3. **A #307 no requisito de apagar**: vive no T2-R5 (div. 183).
4. **Revisão 1 (2026-09-17)**: `SETLISTS.md` **não muda** — as N2-D13…D22 são decisões do cliente, não do contrato.

---

## Notas — medições desta PR

**N1 — o schema de criar e editar, contra entradas reais** (T2-R3; divs. 154, 181). Script no scratchpad da sessão, importando o `lib/api-schemas.ts` da `main` (inalterado entre `cbff070` e `c33c794`: `git diff --stat cbff070 origin/main -- lib/api-schemas.ts` → vazio). Nenhum request.

```
$ cat probe-schema.ts
import { setlistSchemas } from '/Users/marcelviana/projects/octavia/lib/api-schemas'
const casos: unknown[] = [
  { name: 'Show — data: 12/10' },
  { name: 'Show de sábado' },
  { name: '   ' },
  { name: 'x', performance_date: '2026-02-31' },
  { name: 'x', performance_date: '2026-09-16T00:00:00Z' },
]
for (const c of casos) {
  const r = setlistSchemas.create.safeParse(c)
  console.log(JSON.stringify(c), '->', r.success ? 'OK' : JSON.stringify(r.error.issues.map(i => ({ path: i.path, code: i.code, message: i.message }))))
}
const u = setlistSchemas.update.safeParse({ name: null })
console.log('{"name":null} (update) ->', u.success ? 'OK' : JSON.stringify(u.error.issues.map(i => ({ path: i.path, code: i.code }))))
console.log('{} (update) ->', setlistSchemas.update.safeParse({}).success ? 'OK' : 'FAIL')
for (const c of [{ name: 'x', notes: 'dois tons = abaixo' }, { name: 'x', venue: 'Bar Data: centro' }, { name: 'Datas de outubro' }]) {
  const r = setlistSchemas.create.safeParse(c)
  console.log(JSON.stringify(c), '->', r.success ? 'OK' : JSON.stringify(r.error.issues.map(i => ({ path: i.path, code: i.code, message: i.message }))))
}
$ pnpm exec tsx --tsconfig tsconfig.json probe-schema.ts
{"name":"Show — data: 12/10"} -> [{"path":["name"],"code":"custom","message":"Potentially unsafe content detected"}]
{"name":"Show de sábado"} -> OK
{"name":"   "} -> [{"path":["name"],"code":"too_small","message":"String must contain at least 1 character(s)"}]
{"name":"x","performance_date":"2026-02-31"} -> OK
{"name":"x","performance_date":"2026-09-16T00:00:00Z"} -> [{"path":["performance_date"],"code":"invalid_string","message":"performance_date must be date-only (YYYY-MM-DD)"}]
{"name":null} (update) -> [{"path":["name"],"code":"invalid_type"}]
{} (update) -> OK
{"name":"x","notes":"dois tons = abaixo"} -> [{"path":["notes"],"code":"custom","message":"Potentially unsafe HTML content detected"}]
{"name":"x","venue":"Bar Data: centro"} -> [{"path":["venue"],"code":"custom","message":"Potentially unsafe content detected"}]
{"name":"Datas de outubro"} -> OK
[exit 0]
```

O `2026-02-31` **passa** pelo Zod (div. 154 confirmada no lado do schema; o que o Postgres faz com ele continua sendo H-N2-6).

**N2 — o `refine` que produz a div. 181**

```
$ sed -n 60,63p lib/api-schemas.ts
  safeText: z.string().trim().max(1000).refine(
    (text) => !/<script|javascript:|data:|vbscript:/i.test(text),
    'Potentially unsafe content detected'
  ),
$ sed -n 78,81p lib/api-schemas.ts
  safeHtml: z.string().trim().max(50000).refine(
    (html) => !/<script|javascript:|data:|vbscript:|on\w+\s*=/i.test(html),
    'Potentially unsafe HTML content detected'
  )
```

**N3 — o 200 do `PUT` sem músicas** (div. 178)

```
$ sed -n 228,233p 'app/api/setlists/[id]/route.ts'
      if (songsError) {
        logger.error(`Error fetching songs for setlist ${setlistId}:`, songsError)
        return new Response(JSON.stringify({ ...setlistData, setlist_songs: [] }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
```

---

## Apêndice — rastreabilidade

- Pre-check: §0.1 (N2-D1…D11), §1.1–1.2, §2.1–2.2, §3, §4, §6.1, §7.1–7.2, §8.2–8.3, §9, §10, §11, §12, §13.
- Hotfix: §1.1 (N2-D12), §2.5, §3.1, §5 (divs. 172, 174, 176).
- `PRD-TELA-1.md`: T1-R1, R3, R4, R9, R9b, R10, R13, R15, R17, R18, R21, R22, R24, R28, R35, R36, R37; A4, A5, A10, A14, A17.
- `JOBS.md`: J3 (`:79-106`); J2 (`:53-77`, excluído).
- `DESIGN-V1/README.md`: §5.2, §5.3, §8 (8.3 no brief).
- `LOGS-OCTAVIA.md`: regras 1–4 (`:11-22`), regra 0 e 1 do padrão (`:340-367`), errata W2 (`:527-560`).
