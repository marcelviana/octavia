# PRD — Tela 2 do nativo: escrita de setlist

> **Bloco N2 · PR-0** (só docs). Data: 2026-09-16. Base: `origin/main` = `c33c794`, com o pre-check do N2 (#306) e o hotfix da div. 150 (#307, `e20c0a4`) mergeados.
> **Fontes de fato**: [`N2-PRECHECK.md`](N2-PRECHECK.md) (Fases A e B, decisões N2-D1…D11), [`docs/ux/HOTFIX-150.md`](../ux/HOTFIX-150.md) (N2-D12, divs. 170–176), os contratos [`docs/api/SETLISTS.md`](../api/SETLISTS.md) (com a errata desta PR) e [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md), e os handlers na `main`. **Fonte de requisitos**: [`docs/ux/JOBS.md`](../ux/JOBS.md) J3 e as decisões N2-D1…D22 (D1–D12 no pre-check e no hotfix; D13–D22 no §0).
> **Formato**: o do [`PRD-TELA-1.md`](PRD-TELA-1.md). Todo requisito `T2-Rn` cita a fonte e tem *Aceite* verificável. `[medido: …]` = comando e saída literal (no pre-check, no hotfix ou nas notas deste arquivo). `[análise]` = inferência sobre o medido. `[hipótese]` = não medido, com dono no §9.
> **Este PRD prepara, não decide.** Na revisão 0 (2026-09-16), o que as decisões vigentes não fechavam foi para o §12 como pergunta numerada, com opções e recomendação.
> **Revisão 1 (2026-09-17)**: o Marcel respondeu Q1–Q8 e decidiu duas perguntas novas (Q9, Q10). As dez decisões estão no §0 (N2-D13…D22) e entraram nos requisitos; o §12 fica como registro das opções. **Nenhum requisito depende mais de pergunta aberta.**
> **Revisão 2 (2026-09-21, N2-PR2)**: o código do core da escrita entrou, e com ele três medições que mudam texto — a **N2-D31 está medida** (o servidor manda `Retry-After`; div. 225 fecha, T2-R14 e T2-R15), o **T2-R17 não acontecia por construção** (div. 228) e o T2-R11 ganhou a razão da trava (div. 228 ao lado). Os requisitos que esta PR atende no que é de unidade ganharam a linha *Atendido na N2-PR2*; o que é de tela segue nas PRs 3–7. Divergências **226 a 233**.
> **Divergências**: de **177 a 186** (a #306 usou até 162; a #307, até 176; a 186 é da revisão 1). O desenho (#313) usou **221 a 225**; a **N2-PR2** usa **226 a 233**.

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
| **N2-D35** | nova (N2-PR4) | **prazo de rede de 20 s** na escrita e na releitura dela, espécie `rede`. `[medido: N2-PR4]` Não havia prazo nenhum — nem no `createAuthFetch` do core nem no `api.ts` —, e o `fetch` do RN no Android é OkHttp com os três tempos zerados, que é *sem limite*: um servidor que aceita a conexão e não responde deixava a folha em "Salvando no servidor…" **para sempre**, sem `Cancelar` (que some durante a escrita, de propósito). O número e o significado ficam no **core** (`PRAZO_DE_REDE_MS`); o mecanismo, no `api.ts`. As leituras do **sync** ficam de fora, declarado (div. 264). | T2-R11, T2-R12, §4 |
| **N2-D36** | nova (N2-PR5), **revista** em 2026-09-22 | **`Salvar a ordem` fica INATIVO enquanto a ordem na tela é a do servidor**, com o motivo `nada mudou desde que você abriu` escrito ao lado (a frase do formulário, T2-R3 (iii); nenhuma redação nova); ativa ao primeiro movimento e volta a inativo se o arrasto devolver a ordem. O toque no inativo não fecha o modo: deixa `write blocked op=reorder reason=nada-mudou` e zero request. *Primeira forma (commit 2 da N2-PR5, substituída): fechava o modo sem request, como o `Cancelar`* — a revista é a leitura da legenda de `N2-S2e-ordem-falhou`, "'nada mudou → não envia' vale aqui como vale no formulário" (div. 276). `[medido: N2-PR5]` CN (d) do `reordenar.test.tsx`; Tab S6, dump `12`. | T2-R3, T2-R8, N2-D23 |
| **N2-D37** | nova (N2-PR5, div. 289) | **400 de permutação inválida no reorder DESCARTA o arrasto.** O contrato não tem código próprio para isso: o `OB601` da RPC sai como `400 VALIDATION_ERROR` com `details[].field = "order"` (`SETLISTS.md` §order; `lib/rpc-errors.ts:23`), que o core classifica, no `reorder`, como `ordem-mudou` (div. 295). Nesse caso o modo mostra a ordem **relida**, o aviso diz a frase do servidor ("a setlist mudou — a ordem foi recarregada") **sem** a oração "a ordem dela não foi aplicada aqui", e **não** há `Tentar de novo` — `Sair sem salvar` e as alças continuam, e `Salvar a ordem` volta a valer pela N2-D36. Para todo outro erro, a R2·1 vale como está. `[medido: N2-PR5]` CN (e0), com um 400 real do mock (outra escrita removeu uma música depois que o modo abriu); Tab S6, dump `13`. | T2-R8, T2-R15, R2·1 |

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
*Atendido na N2-PR3 no que é de unidade* (`apps/native/test/s1-criar.test.tsx`, CN (a) e (d)): `criar-setlist` existe em S1 e em S1f com o **mesmo id**; criar produz `write op=create setlist=- items=- status=201 code=- ms=<n>` seguido de `resync kind=setlists reason=write op=create status=200 setlists=<n> ms=<n>`, a folha fecha e a setlist nova está no topo. **Uma divergência com o congelado, e o congelado vence** (div. 242): este requisito diz "abre a setlist nova em S2", e a legenda de `N2-F-salvando` diz *"Confirmado o servidor, a folha fecha e S1 **relê** a lista"* — não há navegação para S2 na folha congelada, e a implementação segue o desenho. Os "≤ 3 taps" do J3 continuam valendo por outro caminho: `Nova setlist` · digitar · `Criar`. A contagem na captura é do §4 da PR.
*Atendido na N2-PR7* — **J3 ponta a ponta no Tab S6** (mock, `N2-PR7-anexos/j3.txt`): criar vazia em **3** gestos (`Nova setlist` · digitar · `Criar`). **A hipótese dos 350 ms (`MS_FOCO_APOS_ANIMACAO`, div. 260) está fechada nos dois aparelhos**: com teclado escondido e folha fechada antes de cada toque, `mInputShown=true` 1,2 s depois em **10/10 no AVD** e **10/10 no Tab S6** (`ime-350.txt`).

**T2-R2 — A data é data-calendário local** `[C2; SETLISTS.md §POST; N5 do PRD-TELA-1; prefetch.ts:39-43]`. A data é escolhida num seletor de calendário (nunca digitada) e enviada como `YYYY-MM-DD` montado com **ano, mês e dia locais do aparelho** (o mesmo `hoje()` do prefetch, `prefetch.ts:40-43`), **sem fuso e sem `toISOString()`**: a coluna é `date` (`schema.dump.sql:385`) e timestamp dá 400 (nota N1). "Sem data" é `null` e é um estado de primeira classe (as três setlists da conta de audit não têm data, pre-check §11). Na exibição, a string do servidor é lida como data-calendário, sem conversão de fuso (a formatação é do brief, §7).
*Aceite*: teste de unidade do formatador: um `Date` local de 16/09/2026 23:30 num fuso UTC−3 vira `2026-09-16` (e não `2026-09-17`); no aparelho, datar para amanhã → o corpo do `PUT` (log do servidor de mock) traz `performance_date` igual ao `hoje()+1` do prefetch.
*Atendido na N2-PR3* (`s1-criar.test.tsx`, CN (i-bis)): o seletor devolve um `Date` local de **03/10/2026 23:30** e o corpo do `POST` que chega ao mock traz `performance_date: "2026-10-03"` — não `2026-10-04`, que é o que `toISOString()` daria a oeste de Greenwich. A conta é a do `dataCalendarioLocal` do core. O seletor é o `@react-native-community/datetimepicker` 9.1.0, **módulo nativo** que entra nesta PR (div. 234): o prompt presumia que ele já existia.

**T2-R3 — O cliente valida só o que é dele** `[N2-D21; div. 154; div. 181; C4; pre-check §7.1]`. Antes de qualquer request de criar ou editar, o cliente confere **três** coisas, e só estas:
(i) **nome vazio depois de `trim()`** → não envia; o motivo aparece junto do campo;
(ii) **data impossível** (um dia que não existe no calendário, div. 154) → não envia; o motivo aparece junto da data. O servidor não confere o calendário (nota N1: `2026-02-31` passa pelo Zod), então esta checagem é do cliente;
(iii) **nada mudou → não envia**: editar e sair sem mudar nome nem data **não** gera `PUT`. Um `PUT {}` é válido e bumpa `updated_at` (C4; `[id]/route.ts:174-176`), e editar e cancelar não pode invalidar a setlist no próprio aparelho (T1-R10, T2-R18).
**O filtro de texto do servidor não é replicado** (div. 181): nome com `data:`, `javascript:`, `vbscript:` ou `<script` segue para o servidor, e o 400 dele (`VALIDATION_ERROR`) vira a frase do conjunto fechado "o nome tem um trecho que o servidor não aceita" (T2-R15). A correção do filtro é do **Bloco D**. O limite de 255 caracteres do nome também fica com o servidor.
*Aceite*: teste de unidade do validador: `"   "` → não envia; `2026-02-31` → não envia; `2026-02-28` → envia. No aparelho: abrir a edição de uma setlist e sair sem mudar nada → **nenhuma** linha `write op=` no log (A-N2-24). Com mock devolvendo `400 VALIDATION_ERROR` para `Show — data: 12/10` → um request, `write op=create status=400 code=VALIDATION_ERROR`, e a frase "o nome tem um trecho que o servidor não aceita" na tela.
*Atendido na N2-PR2 no que é de unidade* (`packages/core/src/validacao.test.ts`, 17 testes; `apps/native/test/escrita.test.ts`, dois CNs): os três motivos, a ordem entre eles (nome acima de data, R1·7c), o `trim` **antes** da comparação (um espaço a mais não é mudança), e o "nada mudou" saindo como `write blocked op=update reason=nada-mudou` com **zero** requests e **zero** linhas `write op=`. O nome que o servidor recusa **passa** no cliente, como a N2-D21 manda.
**Errata da N2-PR4 ao item (ii)**: a validação de data impossível **não é alcançável pela UI** com o seletor do sistema (div. 244) — um calendário nativo não produz `31/02`. Ela **fica** no core como proteção da div. 154 (o servidor aceita `2026-02-31` pelo Zod: se o cliente não conferir, ninguém confere) e é exercitada por CN com um `Date` inválido, que é o que um evento de seletor mal formado daria. **O que a N2-PR4 acrescentou ao item (ii)** é o outro lado dele: o seletor também não sabe devolver *"sem data"*, e o congelado permite limpar a data na edição — daí o controle `Limpar` da **N2-E8**, sem o qual o `performance_date: null` do T2-R4 não teria como sair do aparelho.

*Atendido na N2-PR3 no que é de TELA* (`s1-criar.test.tsx`, CNs (b) e (c)): nome vazio (e `"   "`) deixa `Criar` inativo com o motivo do campo ao lado (R1·7c, o mesmo nó `form-salvar-motivo`), **zero** requests e **zero** linhas de log. **Qual linha o T2-R16 prevê para validação falha: NENHUMA** — a tabela dele tem três linhas, `write blocked` é "toque num controle de escrita que não gera request", e o `prepararCriacao` já declara que nome vazio e data impossível não a emitem (N2-D23); `nada-mudou` é do caso (iii), que é do formulário de EDITAR e não existe em criar. **`form-erro-data` é inalcançável pelo seletor do sistema** (div. 244): um calendário nativo não produz `31/02`, e o guarda do `dataExiste` fica como defesa — o CN o exercita entregando um `Date` inválido, que é o que um evento de seletor mal formado daria.

**T2-R4 — Renomear e mudar a data** `[J3; SETLISTS.md §PUT; C4]`. Editar o nome ou a data envia um `PUT /api/setlists/[id]` **só com os campos que mudaram** (ausente = não mexe). Tirar a data envia `performance_date: null`. O nome nunca é enviado como `null`. **O web regrava os cinco campos sempre** (`setlist-service.ts:187-194`, pre-check §4); o nativo não copia, porque isso apagaria em silêncio um `venue`/`notes` que o nativo não exibe. Se nada mudou, não há request (T2-R3 (iii), N2-D21). O corpo do 200 **não** é aplicado (C5; N2-D13); vale a ressincronização (T2-R9).
*Atendido na N2-PR4* (`s2-edicao.test.tsx` CNs (c) e (d); §4 no Tab S6): a folha de editar abre com os valores do servidor e `Salvar` inativo (`N2-F-editar-igual`); renomear envia só `name` e o `venue` do servidor sobrevive (medido no mock e em prod); `Limpar` + `Salvar` envia `performance_date: null` (**N2-E8** — o seletor do sistema não sabe devolver "sem data"); e datar para +5 dias dispara `prefetch plan … reason=7d` pela releitura da EDIÇÃO (T2-R17, primeira vez que essa linha sai de um `op=update`). Em prod: `write op=update setlist=286a4785 items=- status=200 code=- ms=1371`.
*Atendido na N2-PR7* — o `Limpar` da **N2-E8** remedido **nos dois aparelhos** (109,3 × 48,0 dp, igual à N2-PR4); o CN (d) passou a afirmar o corpo do `PUT` (`{ performance_date: null }` e nada mais), a releitura depois dele, e a ausência do alvo sem data (div. 319).

*Aceite*: mock que registra corpos: renomear → corpo `{"name":"…"}` e nada mais; tirar a data → `{"performance_date":null}`; uma setlist com `venue` preenchido no servidor continua com `venue` depois de renomear pelo nativo (leitura pós-resync).

**T2-R5 — Apagar setlist, com confirmação** `[J3; SETLISTS.md §DELETE; N2-D12; N2-D14; #307]`. Apagar pede confirmação num **diálogo** com o nome da setlist, a contagem de músicas, a frase de que os arquivos baixados continuam no aparelho e dois botões, **sem "desfazer"** (N2-D14; a redação é do brief, §7), e envia um `DELETE /api/setlists/[id]`. **200** → ressincroniza e volta para S1 sem a setlist. **404** → é o contrato desde a #307 (`e20c0a4`, N2-D12) para setlist inexistente, alheia **ou já apagada** em outro aparelho: o app **não** trata como erro grave; ressincroniza, volta para S1 e diz "esta setlist já tinha sido apagada". Os arquivos baixados das músicas **não** são apagados (T1-R9: limpeza é do LRU, T1-R14).
*Atendido na N2-PR4* (`s2-edicao.test.tsx` CN (i); dumps `07`–`09` e `12`): o diálogo mede **620,0 × 300,0 dp** no Tab S6 e traz os quatro itens da regra 5 na ordem — o nome, a contagem, a frase dos arquivos e os dois botões com os rótulos do congelado. `Manter a setlist` não gera request. `Apagar` → `write op=delete … status=200`, releitura, e **S1 volta sem o cartão na hora** (o conjunto da releitura chega à raiz antes de a tela sair — div. 270, um defeito que o §4 achou e consertou). Durante a escrita **os dois botões inativam e nenhum some** (div. 269, a segunda correção do §4). Em prod: `write op=delete setlist=286a4785 items=- status=200 code=- ms=340`.

*Aceite*: o diálogo mostra nome, contagem e a frase dos arquivos (captura); cancelar → nenhum request; apagar com 200 → `write op=delete … status=200`, `resync`, S1 sem o cartão; CN: mock devolve 404 → a mesma volta para S1, frase de "já apagada", **nenhum** `auth-failure`; o diretório de arquivos (`files-index.json`) é o mesmo antes e depois (`cmp`).

**T2-R6 — Adicionar música: picker sobre o cache local** `[J3 passo 2 e critério "≤ 3 taps por música, sem sair da tela"; T1-R21; T1-R22; T1-R24; C7; div. 155; N2-D15; N2-D17]`. De S2 em edição, um picker busca na **biblioteca do cache local** com o mesmo índice e a mesma normalização da busca da tela 1 (`buildIndex`/`searchIndex`, `packages/core/src/search.ts:30,53`; `normalizeForSearch`, `normalize.ts:7-14`: NFD → sem diacríticos → minúsculas → espaços colapsados). Cada toque em "adicionar" envia **um** `POST /api/setlists/[id]/songs` com `{content_id}` (a `position` não é enviada: o servidor a ignora, C7) e o picker **continua aberto** para a próxima. **Bis é permitido** (T1-R24; C7): adicionar de novo uma música que já está na setlist cria outra posição. O picker **marca** o que já está na setlist, inclusive "n×", e adicionar de novo **não pede confirmação** (N2-D15). Custo: **≤ 3 taps por música** (abrir o picker conta uma vez para a sequência; buscar e adicionar, por música). **Limite declarado** (div. 155): o addSong não tem teto, mas o reorder para em 100 (T2-R8), e **adicionar acima de 100 é permitido** (N2-D17); o picker avisa que, acima de 100, a setlist não pode ser reordenada.
*Aceite*: com a biblioteca da conta de audit em cache e o aparelho online, adicionar 10 músicas buscando `aguas`, `garota`, … → 10 linhas `write op=add … status=201`, **zero** navegação para fora de S2 (nenhum `index open`/`search close` intercalado), taps ≤ 3 por música na captura; `garôta` acha o mesmo resultado que `garota`; adicionar duas vezes a mesma música → sem diálogo, duas posições depois do resync, e a marca "2×" no picker (captura).
*Atendido na N2-PR6* (`apps/native/test/picker.test.tsx`, 20 CNs; `N2-PR6-anexos/`). **A busca é a do S4, chamada e não copiada**: o picker faz `buildIndex(estado.content)` → `searchIndex(indice, termo)` → `groupResults(hits, <content_id da setlist relida>)`, as três de `packages/core/src/search.ts` (`:30`, `:53`, `:75`), e usa a régua do próprio S4 (`Regua`, exportado); o CN (c) afirma a ordem contra o MÓDULO e contra o S4 montado com o mesmo termo, nunca contra literal, e `mãn` acha o que `man` acha. Cada `Adicionar` envia **um** `POST …/songs` com `{content_id}`; a linha vai `adicionando… → relendo… → adicionada`, e a marca `já na setlist · n×`, o total do rodapé e o "n músicas" de S2 só sobem com a releitura (N2-D30) — medido na ordem dos eventos (`linha-do-tempo.txt`) e no Tab S6 (`Relendo…` com o `k` já em 2 e o total ainda 9). Bis sem diálogo (N2-D15). Acima de 100 adicionar continua e o picker avisa (div. 305). **No aparelho**: J3 = **3 toques** de S2 até a primeira música (`Adicionar música` · digitar · `Adicionar`), **1** para a segunda; em prod, conta principal, duas escritas (`write op=add … status=201`, a segunda um bis → `2×` e `5 músicas · 2 adicionadas nesta visita`), `Concluir` sem request, S2 com 5 linhas, reabrir com `invalidated=0`. **O que fica parcial** (div. 318): as **dez** adições na conta de audit não rodaram em prod — o roteiro pediu duas; as sequências longas estão no CN e no mock.

*Atendido na N2-PR7* — **A-N2-6 em prod, conta de audit, AVD** (`N2-PR7-anexos/device-prod.txt`): uma setlist criada vazia, **10** × `write op=add … status=201`, cada uma com a sua `resync … reason=write op=add status=200` (212–589 ms), **zero 429**; 9 distintas numa visita (3 toques na primeira, 1 nas seguintes, uma rolagem) e o **bis numa segunda visita** (3 toques) → `já na setlist · 2×` e duas posições — numa setlist vazia não há bis numa visita só (div. 331). Sem sair de S2. No J3 do Tab S6 (mock): 3 toques na primeira, 1 da 2ª à 4ª, a 5ª com uma rolagem (div. 332).
*Nota ao T2-R11, medida na N2-PR6* (div. 311): no picker, "os outros controles de escrita ficam ocupados" vale durante o **request** de uma adição e **não** durante a releitura dela — é o escopo da trava (div. 232) visto da tela: com a releitura em voo as outras linhas seguem ativas (Tab S6, dump `08`); com o request em voo, ficam `enabled=false` (dump `06`), porque o toque voltaria `busy` com a frase da espécie `rede`.

**T2-R7 — Remover música por `setlist_songs.id`** `[J3 passo 4; T1-R24; C9; div. 156]`. Remover envia `DELETE /api/setlists/songs/[songId]` com o **`setlist_songs.id` da posição tocada**, **nunca** com o `content_id`. **O que não copiar do web** (div. 156): o `setlist-manager.tsx` remove procurando `s.content.id === songId` (`:207`) e filtra **todas** as ocorrências no estado local (`:214`), e depois de adicionar usa um id falso `${setlist.id}-${songId}` (`:179`) que não é uuid (→ 500, div. 153). No nativo, todo id enviado vem de uma leitura do servidor (T2-R9), nunca de um id montado no cliente.
*Atendido na N2-PR4* (`s2-edicao.test.tsx` CN (f); dumps `01`, `05` e `10`): o alvo é de **48,0 × 48,0 dp** no fim da linha, e a linha continua **536,9 × 116,0 dp** — o que ele come é a caixa do título, **336 → 272,0** (**N2-E9**: 64 dp e não os 56 anunciados, porque o vão da linha é 16). Numa setlist com **bis** (o mesmo `content_id` nas posições 1 e 4), remover a 4 tira só a 4: o request leva o `setlist_songs.id` daquela linha, nunca o `content_id` (div. 156). Sem diálogo, com `removendo…` na linha e releitura depois da confirmação (N2-D28). Em prod: `write op=remove setlist=286a4785 items=- status=200 code=- ms=1174`, com `path=/api/setlists/songs/396201cc`.

*Aceite*: setlist com o mesmo content nas posições 2 e 7; remover a 7 → o request leva o `id` da linha 7 (log do mock) e, depois do resync, a posição 2 continua lá e a setlist tem N−1 músicas contíguas 1..N−1; `grep` no código novo por `content_id` como argumento de remoção → vazio.

**T2-R8 — Reordenar: um request por gesto concluído** `[J3 passo 3 e critério "drag-and-drop … ou controles equivalentes"; C8; div. 155; N2-D17; T1-R28]`. Reordenar em S2 (arrastar, ou controles equivalentes, a decidir no brief) envia **um único** `PUT /api/setlists/[id]/songs/order` **quando o gesto termina**, com a permutação completa dos `setlist_songs.id` — nunca um request por passo do arrasto. Durante o gesto, a ordem mostrada é a do gesto; depois do 200, vale a ordem do servidor. **O arrasto não salvo é estado da tela, não do cache** (N2-D27; R2-1): depois de uma falha o modo fica aberto com o arrasto preservado, a releitura do T2-R9 acontece igual e atualiza a setlist atrás do modo, mas **não** sobrescreve a lista na tela, e "tentar de novo" reenvia **o arrasto**, não a ordem que o servidor já tem. O 200 do reorder **é** leitura da ordem (C8), mas não do `updated_at` (§4.1): a substituição segue a regra do T2-R9. **Teto de 100** (div. 155): numa setlist com mais de 100 músicas, o controle de reordenar fica **inativo com o motivo ao toque** (mesmo padrão do A15, N2-D17; ver div. 186). A correção do teto é do Bloco D. **Caso de medida**: a setlist de 60 da conta de audit (`4340bf95…`, pre-check §11).
*Aceite*: na setlist de 60, mover a 8 para a posição 2 com um gesto → **exatamente uma** linha `api … path=/api/setlists/<id8>/songs/order` e uma `write op=reorder items=60` no log; depois do resync a 8 antiga está em "2 de 60"; em mock com 101 músicas o controle de reordenar está inativo (`enabled=false` no dump), o toque mostra o motivo (captura) e nenhum request sai.
*Atendido na N2-PR5* (`reordenar.test.tsx`, 14 CNs; `N2-PR5-anexos/`). **A forma do gesto — item 1.1**: `[medido]` nem `react-native-gesture-handler` nem `react-native-reanimated` estão no app; o arrasto é **`PanResponder`**, sem módulo nativo e sem dev client novo. **O caso de medida**: na setlist de 60 da conta de audit (AVD), a 60ª para a 1ª com um gesto → **uma** `api … path=/api/setlists/4340bf95/songs/order` e **uma** `write op=reorder setlist=4340bf95 items=60 status=200 code=- ms=906`, releitura, servidor com `[60] + [1..59]`; devolvida por um segundo reorder contado (`ms=743`), e a ordem de antes voltou elemento a elemento. **O arrasto não salvo é estado da tela**: com 500 (CN) e com o prazo de 20 s (Tab S6, `status=net ms=20029`) o modo fica, o arrasto fica com `movida de 5`, a releitura (`reason=order`, div. 273) atualiza atrás, e `Tentar de novo` reenvia **o arrasto** — medido no aparelho trocando o mock para `escrita`: o servidor saiu de `01 02 03…` para `01 05 02…`. **Teto de 100**: `Reordenar` inativo com a linha `N2-X-100` (não "ao toque": a N2-D23 venceu o A15 aqui também) e o toque loga `write blocked op=reorder reason=ceiling` (A-N2-9).

**T2-R9 — A verdade é o servidor: ressincronizar depois de todo 2xx** `[§4; T1-R9; T1-R10; N2-D8; N2-D13; N2-D22]`. Depois de todo 2xx de escrita, o app faz **`GET /api/setlists`** e **substitui** o conjunto de setlists pelo 200 dele (T1-R9; N2-D13). O corpo da resposta da escrita **não é aplicado** ao cache (div. 178). Nenhuma escrita altera o cache diretamente. Enquanto a leitura não volta, a tela mostra a operação como **concluída no servidor e ainda não relida** (o texto é do brief).
**Escrita 2xx seguida de resync que falha é um estado próprio** (N2-D22): **"salvo; não foi possível recarregar"** — nunca "salvo" limpo, nunca "falhou". O cache **não** muda (T1-R9), a escrita **não** é desfeita nem repetida, o log registra `resync kind=setlists … status=<n>` (T2-R16), e o `GET` é **refeito na próxima abertura da tela**.
*Aceite*: teste de unidade: dado um cache com a setlist X de `updated_at` T0 e um 201 de addSong, o cache só muda quando a leitura pós-escrita chega, e fica igual ao 200 dela (`cmp` do `setlists.json` com o corpo sem embutido); `grep` no código de escrita por gravação de `setlists.json` fora do caminho do resync → vazio. Com a leitura pós-escrita em 500 (mock): o `setlists.json` é byte a byte o anterior, a tela mostra "salvo; não foi possível recarregar", o log tem `resync kind=setlists … status=500`, e reabrir a tela gera um novo `GET /api/setlists` (A-N2-25).
*Atendido na N2-PR2 no que é de unidade* (`apps/native/test/escrita.test.ts`): quatro CNs contra o mock — o cache igual ao 200 da releitura, o `content.json` intocado, zero gravação quando a escrita falha, e o caminho inteiro da N2-D22 (`status=500` e depois `reason=reopen`). **O `cmp` é do CONJUNTO, não do arquivo**: o `syncedAtMs` muda a cada gravação, então comparar bytes mediria o relógio. A parte da TELA ("a tela mostra…") é das PRs 3–7.
*A parte da TELA, atendida na N2-PR3* (`s1-criar.test.tsx`, CNs (d) e (f)): com a releitura em 200 a folha fecha e S1 mostra o conjunto novo; com a releitura em 500 a folha **também** fecha — o servidor confirmou — e o estado próprio da N2-D22 aparece na linha de aviso de 48 dp de S1, nomeando a setlist (*"Season 4 foi criada. Não foi possível recarregar a lista, então ela pode não aparecer abaixo ainda."*, a div. 227 montada). `Tentar recarregar` emite `resync kind=setlists reason=reopen op=- status=<n>`.

**T2-R10 — 404 numa escrita: ressincronizar e sair** `[§4.3; T1-R9; N2-D12]`. Um 404 em qualquer escrita dispara a mesma leitura do T2-R9. Se a setlist aberta não está no conjunto novo, a tela volta para S1 com uma frase curta (setlist apagada em outro lugar). Se está (por exemplo, a **música** é que sumiu), a tela fica e mostra a lista nova.
*Atendido na N2-PR4* (`s2-edicao.test.tsx` CN (j); dumps `11` e `12`), **nos dois ramos**: com a setlist ainda no conjunto relido, S2 **fica** e o aviso diz `esta música já não estava na setlist` (dump `11`); sem ela, S2 é abandonada e S1 aparece **já relida**, com *"Essa setlist não existe mais. A lista abaixo é a que o servidor tem agora."* e **sem botão** (dump `12`). Quem separa os dois é a releitura, não o `code` — os dois são `NOT_FOUND` e o campo `error` não pode ser lido (T1-R36).
*Atendido na N2-PR7* — **o 404 com a releitura falha (N2-E21)**: a tela sai para S1 (o 404 é conhecimento) com `sumiu-nao-relido` e `Tentar recarregar`, sem afirmar lista relida; relida, a frase inteira do 404 volta. Defeito da N2-PR4 achado no aceite (div. 327), consertado nos cinco caminhos de saída (div. 328); remedido nos dois aparelhos (estados `13`–`14`).

*Aceite*: mock: addSong devolve 404 `Setlist not found` e a leitura seguinte não traz a setlist → `resync reason=404`, S1 aberta, frase visível; mock: remover devolve 404 `Song not found` e a leitura traz a setlist sem aquela música → S2 continua, sem a música.

**T2-R11 — Falha aparece; nada de "salvo" antes do 2xx; "tentar de novo" só depois de reler** `[N2-D2; N2-D18; N2-D22; T1-R37; H-N2-4; C10]`. Toda escrita tem quatro estados visíveis: **salvando** (request em voo), **falhou** (não-2xx ou rede, com a frase do T2-R15), **concluída** (2xx e leitura pós-escrita ok) e **salvo; não foi possível recarregar** (2xx e leitura pós-escrita falhou, N2-D22, T2-R9). "Salvo", ou qualquer sinal equivalente, **só** depois do 2xx. **Nunca há repetição automática** (N2-D18; C10: `POST` repetido duplica). **"Tentar de novo"** só aparece **depois** de uma ressincronização que mostre o estado real; para **criar** e **adicionar**, a tela avisa que a operação pode já ter sido gravada (N2-D18). Enquanto uma escrita está em voo, os outros controles de escrita da mesma tela ficam **ocupados** (uma escrita por vez; isso não é fila: nada é guardado para depois). `[medido: N2-PR2]` A trava é do módulo, não da tela, e é tomada **antes do primeiro `await`**: a primeira forma dela marcava "em voo" depois do `estaOnline()`, e o CN mediu as duas chamadas passando — dois toques no mesmo frame escreviam os dois. Uma trava conquistada depois de um `await` não é trava.
**E há um quinto estado, que não era visível e agora é: a escrita que não termina** `[medido: N2-PR4, div. 262; N2-D35]`. Os quatro estados acima pressupõem que a request volta. Sem prazo de rede ela podia não voltar nunca, e o estado "salvando" durava até o app morrer — com a folha aberta, os campos inativos e sem `Cancelar`. O prazo de 20 s transforma esse não-estado no estado **falhou**, com a frase `sem conexão — nada foi salvo`, que é a verdade: a operação não aconteceu e o servidor não disse nada. Medido no Tab S6: `write op=remove … status=net code=net ms=20029`.

**E ela cobre o REQUEST, não a operação inteira** `[medido: N2-PR2, div. 232]`. "Uma escrita por vez" não quer dizer "uma escrita e a sua releitura por vez": o `DESIGN-N2` diz o contrário na legenda de `N2-P-relendo` — *"As outras linhas seguem ativas: a releitura de uma adição não congela o picker"* —, e o T2-R6 pede dez adições seguidas sem sair de S2. O que a trava impede é **duas escritas no servidor ao mesmo tempo**; a releitura é um `GET` de outra família (`setlist-read`), que não escreve nada e não consome a janela `setlist-mutate`. O preço disso é a ordem entre releituras sobrepostas, resolvida na div. 233.
*Aceite (o escopo da trava)*: com a releitura da primeira adição em voo (mock que atrasa a primeira resposta em 600 ms), uma segunda adição é **aceita** — zero linhas `write blocked`, duas `write op=add`; as duas releituras se sobrepõem (uma acima de 500 ms, outra abaixo); e o `setlists.json` final é igual ao **último 200**, não ao último a chegar. *Atendido na N2-PR2*: três CNs que reprovam contra `70e77be` e passam depois (`N2-PR2-anexos/trava.txt`).
*Aceite*: mock com atraso de 3 s → "salvando" visível durante o atraso e nenhum "salvo"; mock com 500 → "falhou" visível, `setlists.json` inalterado (`cmp`), **uma** linha `api` para a rota (nenhuma repetição); com uma escrita em voo, tocar em outro controle de escrita não gera request; addSong com rede cortada → "tentar de novo" só aparece depois de um `resync` no log, com o aviso de que a música pode já ter entrado (captura).
*Atendido na N2-PR7* — **N2-D32 em S2**: o `remover` que falha com a releitura da regra 3 falhando também perde a oração *"a lista abaixo é a que o servidor acabou de devolver"* e oferece `Tentar recarregar`, nunca `Tentar de novo` — defeito da N2-PR4 achado no AVD (div. 327), CN reprovando contra `ba3836c`, remedido nos dois (estado `12`). **N2-E20**: no picker, com um `POST` em voo, os outros `Adicionar` ficam inertes sem frase (exceção declarada à regra 11). Os estados *falhou* com `Tentar de novo` depois da releitura, em S2 e no picker, nos dois aparelhos (estados `10`–`11`).

**T2-R12 — Sem rede, sem escrita** `[N2-D2; T1-R18; LOGS-OCTAVIA.md regra 1]`. Offline (o `useOnline` de `net.ts:23-43`), os controles de escrita ficam **inativos com o motivo visível** e nenhum request sai. Se a rede cai com o controle ativo (o `expo-network` atrasa), o request falha por rede e vale o T2-R11. Para os aceites, **avião é o `ping` falhando, não o valor do setting** (`LOGS-OCTAVIA.md:351-362`); no Tab S6, avião é só o override da API (`:364-367`). *Revisto na N2-PR5 (div. 290)*: em aceite MANUAL, avião é permitido com o estado anterior lido, declarado e restaurado; o override continua sendo o caminho dos aceites automatizados (§8).
*Aceite*: em avião provado por `ping` (`connect: Network is unreachable`), tocar criar/adicionar/remover/apagar → **zero** linhas `api` e `write`, o motivo aparece; com rede cortada no meio de uma escrita → `write … status=net`, "falhou" visível, `setlists.json` inalterado (`cmp`), sessão mantida.
*Atendido na N2-PR3 no que é de unidade* (`s1-criar.test.tsx`, o CN da linha de aviso): offline, `Nova setlist` fica inativo (`accessibilityState.disabled`), o desenho sai **amputado** — `['M4 6.5h12M4 12h8M4 17.5h6', 'M14 17.5h7']`, a cruz sem a haste vertical, elemento a elemento como o anexo D o registra — e o motivo fica escrito na linha de 48 dp, uma vez para a tela inteira (N2-D23). Tocar no inativo não abre a folha e não gera request. A prova em **avião de verdade**, com o `ping` falhando, é do §4 da PR.
*Atendido na N2-PR7* — **sem rede nos dois aparelhos**, avião provado por `ping` (`connect: Network is unreachable`): S2 com os quatro da faixa e `remover` `enabled=false` e amputados (PNG `05`), `buscar` e tocar ativos (`index jump n=1`), o motivo `sem-rede-s2` uma vez; S1 com `criar-setlist` inerte e `sem-rede-s1`; **zero** linha de log nos seis toques em inertes (`N2-PR7-anexos/g6.md`, estados `5`–`6`).

**T2-R13 — 401 numa escrita não desloga** `[N2-D9; div. 152; H-N2-11; T1-R3]`. Numa escrita, o segundo 401 **não** chama `signOutSession()`: a operação falha com a frase genérica do T2-R15, a sessão fica, e as leituras continuam. A regra do T1-R3 se mantém: no máximo 2 requests à mesma rota (a original e uma depois de renovar). Nenhuma escrita tenta distinguir "email não verificado" de "token inválido" pelo corpo (H-N2-11).
*Aceite (controle negativo)*: mock devolve 401 duas vezes no `POST /api/setlists` → exatamente 2 linhas `api status=401 … n=` para a rota, uma `write op=create status=401`, **nenhuma** `auth-failure` e **nenhuma** `login-screen`; S1 continua com as setlists; um `GET /api/setlists` seguinte (resync manual) sai com o mesmo usuário.
*Atendido na N2-PR2*, com o **controle positivo ao lado**: no caminho de LEITURA o mesmo 401 duplo CHAMA o logout (modo `401` do mock), e na escrita não chama (modo `escrita-401`). Sem esse par, "o logout não foi chamado" também seria verdade num app que nunca desloga. A linha sai como `api status=401 path=/api/setlists n=2` — a original e uma depois de renovar, nunca uma terceira (T1-R3). A implementação é uma **segunda instância** do `authFetch` cujo `onAuthFailure` tem o corpo vazio: uma linha de log ali conteria a subcadeia `auth-failure` e o próprio aceite passaria a acusar-se.
*Atendido na N2-PR7* — **A-N2-15 por linha exata** (`grep -x`, o `exatas()` de `apps/native/test/ajuda.ts`): `OCTAVIA: auth-failure` igual, não prefixo nem subcadeia, nos CNs de escrita, S1, S2 e picker; o controle positivo no caminho de leitura acha exatamente uma. Ad hoc (`CN-controles.txt`): uma linha `auth-failure` na escrita reprova os quatro; uma `write auth-failure-guard` passa no exato e reprovaria a forma de subcadeia de antes (div. 326).

**T2-R14 — 429 numa escrita** `[T1-R4; §3; N2-D31 — **medida na N2-PR2**]`. Um 429 de `setlist-mutate` bloqueia **todas** as escritas (a família é compartilhada) até o `Retry-After`, com a mensagem pt-BR do T1-R4. As leituras não são bloqueadas (outra família).
**A N2-D31 está medida e a div. 225 fecha** `[medido: N2-PR2, `N2-PR2-anexos/retry-after.txt`]`: **o servidor manda o prazo**, nos dois funis que as seis rotas usam (o middleware da cadeia B, `api-validation-middleware.ts:123`, e o `enforceUserLimit` da cadeia A, `user-rate-limit.ts:146`) e em **dois lugares cada** — o header `Retry-After` (`user-rate-limit.ts:134`) e o campo `retryAfter` do corpo (`api-errors.ts:57`), os dois pelo mesmo `rateLimited()`. Logo **a frase com `N` do T2-R15 vale**, e é a que o músico lê.
A frase sem número **continua no conjunto fechado**, num ramo próprio: o 429 que chega **sem prazo nenhum**, que o contrato prevê pela cláusula não-JSON (um 429 que não saia dos handlers). Aí o `retryAfterFrom` devolve `null` e vale a da moldura `N2-X-limite`. Duas frases, dois ramos medidos.
Quando o prazo não vem, o gate fecha a família pelo mínimo que o servidor garante (1 s, `Math.max(1, …)` em `user-rate-limit.ts:126`): um gate que não fechasse por falta de número deixaria o app bater na porta até o servidor abrir.
*Aceite*: mock 429 `Retry-After: 30` no addSong → `ratelimit retry-after=30 family=setlist-mutate`; nenhuma escrita por 30 s (os controles ficam inativos com o motivo); o resync manual continua possível. *Atendido no CN da N2-PR2* (`apps/native/test/escrita.test.ts`, "429: o prazo fecha a família inteira"): a escrita seguinte sai como `write blocked op=create reason=ratelimit`, **zero** linhas `api`, e a leitura continua passando.
*Atendido na N2-PR7* — **nos dois aparelhos**: 429 com `Retry-After: 30` num `remover` → `ratelimit retry-after=30 family=setlist-mutate` e a linha de aviso *"muitas alterações seguidas — tente de novo em 30 s"*, sem botão (estado `15`). Em prod, 13 escritas seguidas da conta de audit sem nenhum 429.

**T2-R15 — Frases de erro: conjunto fechado, em pt-BR** `[T1-R36; errata W2 do LOGS-OCTAVIA.md (`:527-560`); CONTRATO-DE-ERRO.md:47-53]`. O que o músico lê sai de um conjunto **fechado** de frases, chaveado pelo `code` do envelope (nunca pelo campo `error`, que é inglês) e pela operação. Quem não tem frase declarada cai na genérica. **Nome da setlist, título da música e uuid nunca entram na frase de erro** (a tela já mostra o nome onde precisa); o detalhe vai **só** para o log (T2-R16). Conjunto inicial, **a revisar no brief** (a redação final é de design):

| `code` / condição | Frase |
|---|---|
| rede — **enviou e não teve resposta** (`network`, o prazo da N2-D35) — **N2-E19** | "sem resposta do servidor" |
| rede — **não enviou** (`write blocked reason=offline`) — **N2-E19** | "sem conexão — nada foi salvo" |
| `AUTH_REQUIRED` | "não foi possível salvar — confira sua conta no site" |
| `RATE_LIMITED` | "muitas alterações seguidas — tente de novo em N s" |
| `NOT_FOUND` (setlist) | "esta setlist foi apagada em outro lugar" |
| `NOT_FOUND` (música) | "esta música já não estava na setlist" |
| `VALIDATION_ERROR` no reorder | "a setlist mudou — a ordem foi recarregada" |
| `VALIDATION_ERROR` em criar ou editar (inclui o filtro de texto, div. 181; N2-D21) | "o nome tem um trecho que o servidor não aceita" |
| `VALIDATION_ERROR` (outros) | "o servidor recusou os dados" |
| `INTERNAL_ERROR` | "falha no servidor — nada foi alterado aqui" |
| corpo sem envelope / `code` desconhecido | "não foi possível salvar" |

**Implementado e fechado na N2-PR2** (`packages/core/src/frases.ts`). Quatro notas do que a implementação mediu:

1. **A linha do `RATE_LIMITED` fica com o `N`** — a div. 225 fechou pela primeira alternativa (ver T2-R14). A frase sem número não sai do conjunto: vira o ramo do 429 sem prazo.
2. **As duas linhas de `NOT_FOUND` não são chaveadas pelo `code`** — os dois casos são `NOT_FOUND`, e o campo `error` não pode ser lido (T1-R36). São chaveadas por **contexto**: o default vem da operação (`remove` fala de música, as outras cinco de setlist) e a tela pode corrigi-lo **depois da releitura**, que é quem sabe se a setlist ainda está no conjunto.
3. **O conjunto desta PR é maior do que esta tabela** — ele é `T2-R15 ∪ as fixas do desenho congelado`: as três frases de validação (`N2-F-validacao`, `N2-F-editar-igual`), as de progresso (`Criando no servidor…` e as duas irmãs), as cinco da linha de aviso de 48 dp e o `pode já ter sido gravada — confira antes de repetir`. Elas estão na mesma constante porque a folha as FIXOU: uma tela que escrevesse a sua própria redação quebraria o congelado sem que nada acusasse.
4. **Uma frase da folha entra pela metade** (div. 227): a de S1 nomeia a setlist ("Season 4 foi criada. …"), e nome de setlist é dado, não texto. O core guarda a segunda oração, verbatim; S1 monta a primeira.

*Atendido na N2-PR7* — **N2-E23** (div. 333): a chave **`apagada-nao-relida`**, metade fixa como a `salvo-nao-relido-s1` (S1 monta `<nome> foi apagada. `), para o apagar com 200 e a releitura falha; CN `s2-edicao.test.tsx` (o), aparelho nos dois (`aparelho-333.txt`). — **N2-E19** (decisão do Marcel sobre a div. 308): a linha de rede se partiu em duas, acima. A chave nova é **`sem-resposta`**; a `rede` fica só para o barrado offline, que o core passou a classificar (`classificarBarrado`: offline sem o `podeTerGravado`; `busy` na genérica, div. 323). A segunda linha *"pode já ter sido gravada…"* acompanha só a `sem-resposta`, em criar e adicionar. **N2-E21**: a chave **`sumiu-nao-relido`** (*"Essa setlist não existe mais. Não foi possível recarregar a lista."*, as duas primeiras orações de `sumiu-declarado` e de `salvo-nao-relido-s1`, teste de prefixo literal) para o 404 com a releitura falha (T2-R10). Unidade: `packages/core/src/escrita.test.ts` e `frases.test.ts`, com o **par declarado no G1b** (a única asserção do core que mudou, div. 321). Aparelho: dumps `18` e `13` nos dois (`N2-PR7-anexos/g6.md`).

*Aceite*: teste de unidade: para cada linha da tabela, a chave → a frase; um `code` inventado → a genérica; o G4 (`gate:a20`) passa com as frases novas; captura (não dump, `LOGS-OCTAVIA.md:340-349`) de cada estado de falha alcançável mostra a frase e não mostra nome, título nem uuid.
*Atendido na N2-PR2 no que é de unidade* (`packages/core/src/frases.test.ts`, 24 testes): as onze linhas verbatim; a varredura `op × status × code × releitura` (6 × 11 × 7 × 3 = 1 386 combinações + 6 de rede) afirma que **toda** saída de `classificar()` pertence ao conjunto; nenhuma frase casa uuid nem tem buraco de interpolação além do `{N}`. **O G4 não alcança o `frases.ts`** — a raiz dele é `apps/native` — e isso está registrado na div. 229; quem cobre hoje é o teste acima. A captura de cada estado é das PRs da tela.

**T2-R16 — Linhas de log novas, com formato fixado aqui** `[LOGS-OCTAVIA.md regras 1–4 (`:11-22`); G3]`. Entram no catálogo, por errata na PR de código que as emitir:

| Evento | Linha canônica | Quando |
|---|---|---|
| escrita | `write op=create\|update\|delete\|add\|remove\|reorder setlist=<id8\|-> items=<n\|-> status=<s\|net> code=<CODE\|net\|-> ms=<ms>` | fim de toda escrita (2xx, não-2xx ou rede). `setlist=-` só no `create` antes do 201; `items` = tamanho do `order` no reorder, `-` nas outras |
| ressincronização | `resync kind=setlists reason=write\|404\|order\|reopen op=<op\|-> status=<s\|net> setlists=<n\|-> ms=<ms>` | fim da leitura do T2-R9/R10. `kind` é sempre `setlists` (N2-D13; a chave fica para o formato não mudar). `status` é o da leitura: um não-2xx aqui é o estado da N2-D22. `reason=reopen` é o `GET` refeito na próxima abertura da tela (N2-D22), com `op=-` |
| escrita barrada | `write blocked op=<op> reason=offline\|ratelimit\|ceiling\|busy` | toque num controle de escrita inativo |

A linha `api` que já existe continua saindo para toda resposta de `/api/*`, **também nas escritas**, e o `path` das rotas de escrita troca cada uuid pelos seus 8 primeiros caracteres (`/api/setlists/<id8>/songs/order`, regra 3), porque a linha `api` de hoje só conheceu paths sem id (`api.ts:106`). Nada de nome, título, termo de busca ou corpo (regra 2). O `cache write kind=setlists … invalidated=<n>` do resync passa a carregar o contador **real** (N2-D8, T2-R18).
*Aceite*: G3 da PR de código lista exatamente as linhas novas desta tabela (e a mudança do `invalidated`), com errata no `LOGS-OCTAVIA.md`; `grep -E 'write op=|resync kind=' logcat` de um aceite completo não contém uuid inteiro, nome nem título (regra 4: `grep -rn eyJ` e `grep -rln <email>` com exit 1).
*Atendido na N2-PR2*: G3 **57 → 64**, sete linhas novas e lista de erratas **vazia** (`N2-PR2-anexos/G1-depois.txt`); errata no catálogo, com a quinta razão de barrar (`nada-mudou`) declarada. Um CN varre as linhas novas atrás de uuid inteiro, nome de setlist e token. **Nota de método**: a linha `write op=…` vai inteira em UMA linha de fonte — quebrada, o coletor do G3 veria só a abertura da chamada, e o formato que este requisito fixa ficaria invisível para o gate que existe para guardá-lo.

**T2-R17 — Criar ou datar para os próximos 7 dias dispara o prefetch** `[N2-D11; T1-R15; T1-R17; A10; div. 182; **div. 228**]`. Quando a leitura do T2-R9 traz uma setlist com `performance_date` entre hoje e hoje+7 (a janela de `selectPrefetch`, `core/offline.ts:90-102`), o prefetch do T1-R15 roda para ela **sem** o usuário abrir a setlist, e o indicador do T1-R17 é recalculado.
**Isto NÃO acontece por construção** `[medido: N2-PR2, div. 228]`. A revisão 1 deste requisito supôs que "a ressincronização chama o mesmo `prefetchEArrumar` que o sync completo chama (`App.tsx:159`)" — e o `sincronizar()` do `sync.ts` **nunca** chamou o prefetch: quem o chama é o `App.tsx`, nas duas saídas do `rodarSync` (`:163` e `:177`). A releitura da N2-D13 também não passa pelo `planSync` (ele pede as páginas de content, que a N2-D13 não busca). Logo o prefetch depois de uma escrita é uma **ligação a fazer**, não um efeito herdado.
A N2-PR2 deixa o gancho e o declara inerte: `aoRelerSetlists(f)` (`apps/native/src/escrita.ts`) corre a cada releitura que volta 200, com o conjunto novo. **A PR da tela liga o gancho ao `prefetchEArrumar`**, e é lá que o aceite abaixo se mede. **O que o aceite mede é o mecanismo** (N2-D11): o A10 com dado real da conta principal continua **não reproduzido** até o Marcel criar uma setlist de show de verdade (H-N2-8; decisão de 2026-09-11).
*Aceite*: fixture ou mock com um content de `file_url` válida; criar pelo nativo uma setlist com data de amanhã e essa música → `write op=create`, `write op=add`, `resync`, e em seguida `prefetch plan n=1 reason=7d` e `file src=download …`, sem abrir a setlist; o indicador passa de "◔ 0 de 1" para "✓"; datar para daqui a 8 dias → nenhum `prefetch plan … reason=7d` para ela.
*A LIGAÇÃO FOI FEITA na N2-PR3* — `apps/native/src/apos-escrita.ts`, e o `App.tsx` a registra num efeito. O gancho que a N2-PR2 deixou inerte passa a disparar o mesmo prefetch de 7 dias que o sync dispara. Módulo, e não quatro linhas dentro do `App.tsx`, por uma razão medida: o `App.tsx` não é importável por teste nenhum (Firebase, `expo-network`, navegação, safe-area), e uma ligação que não pode ser medida é exatamente o tipo de coisa que a div. 228 encontrou solta. *Atendido no que é de unidade* (`apps/native/test/apos-escrita.test.tsx`): criar pela folha com data em **+3 dias** produz `write op=create … status=201`, `resync kind=setlists reason=write`, e em seguida `prefetch plan n=<k> reason=7d`, **sem abrir a setlist**. Com o **controle positivo ao lado**: desligado o gancho, a mesma criação não produz linha nenhuma de prefetch — sem esse par, "o prefetch rodou" também seria verdade num app em que ele sempre rodou. O `file src=download …` e o indicador passando de ◔ para ✓ dependem de `file_url` real e são do §4 / do A10, que segue **não reproduzido** com dado da conta principal (H-N2-8).

**T2-R18 — Pré-requisito: o T1-R10 ligado** `[N2-D8; div. 157; div. 121]`. A tela 2 **não nasce** sobre um sync que ignora `updated_at`. A primeira PR de código do N2 liga o `diffByUpdatedAt` (`core/sync.ts:87`, hoje sem chamador), troca o `invalidated=0` literal (`store.ts:123-124`) pelo contador real e traz o controle negativo (`invalidated=1` sob mock com `updated_at` diferente) **antes** de qualquer tela de escrita. A errata do A7 no `PRD-TELA-1.md` vai nessa PR. A div. 121 (T1-R17 (i), `updated_at` de content) fecha pelo mesmo mecanismo.
*Aceite*: na PR de código, o CN com `updated_at` diferente reprova contra o código de hoje e passa depois; no aparelho, dois syncs sem mudança → `invalidated=0` lido de um contador, e uma escrita seguida de resync → `cache write kind=setlists … invalidated=1`.
*Atendido pela N2-PR1 (#309, 2026-09-16)* no que é pré-requisito: CN reprovando 5 de 6 antes e passando 6 de 6 depois (`N2-PR1-anexos/CN-t1r10.txt`, `CN-t1r10-passa.txt`); errata do A7 no `PRD-TELA-1.md`. A metade "escrita seguida de resync → `invalidated=1`" só se mede quando houver escrita (PRs da tela). **A div. 121 fecha, mas não "pelo mesmo mecanismo"** (div. 191): a condição (i) do T1-R17 vale por construção — o cache de content é sempre o do último sync completo (T1-R9, `planSync` mantém os dois conjuntos juntos) — e um arquivo trocado no web ganha `file_url` nova (`upload/route.ts:94-103`, `Date.now()` no nome e `upsert: false`), então o indicador cai para ◔ sem olhar `updated_at`; o contador desta PR garante só que o status é recalculado quando o conjunto muda. Medição em `N2-PR1-anexos/README.md`.

**T2-R19 — Edição e palco não se cruzam** `[N2-D19; H-N2-7; pre-check §8.3 item 2; T1-R24]`. O palco é endereçado por `position` (`navigation.tsx:31`), e um reorder muda a música que uma posição aponta. Por isso **S2 aberta a partir do palco não oferece edição** (N2-D19). S2 passa a ter **dois estados de entrada**, ambos alcançáveis e medidos no G6:
- **S2 com edição** — aberta a partir de S1 (ou da criação, T2-R1): criar/renomear/datar, picker, reordenar, remover e apagar disponíveis;
- **S2 sem edição** — aberta a partir do palco (o índice do T1-R28): só navegação, como hoje; nenhum controle de escrita aparece.
*Atendido na N2-PR4* (`s2-edicao.test.tsx` CN (a); dumps `01` e `02`): o discriminante é o **`posicaoAtual`** dos params, o mesmo que escolhe o nome acessível do `voltar` desde a V1-PR5 — ausente = veio de S1, presente = veio do palco. A S2 do palco é **idêntica dp a dp** à do V1 (`V1-PR7-anexos/dumps-tabs6/S2-season3.xml`): `voltar` 48,0 × 48,0 em (24,0 43,6), `buscar` 210,2 × 57,8 em (903,6 38,7), linhas 536,9 × 116,0 a partir de y=136,0 — e **nenhum** `setlist-editar`, `setlist-apagar` ou `remover-n` na árvore. A de S1 começa a lista 64 dp mais abaixo (y=200,0), que é o custo declarado da faixa (N2-D26).

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
| A-N2-27 (nova, N2-PR4) | **Releitura pós-escrita contra `GET` mudo: desiste em 20 s e cai no estado da N2-D22** — nos dois caminhos, o de `reason=write` e o do `Tentar recarregar` (`reason=reopen`) | CN com o número real + controle negativo do instrumento; **aparelho**: `resync … status=net ms=20019` e `ms=20010` (`N2-PR4-anexos/CN-prazo-releitura.txt`) | T2-R9, N2-D22, N2-D35 |
| A-N2-26 (nova, N2-PR4) | **Escrita contra servidor mudo: a tela desiste em 20 s com a frase de rede, e nada é gravado** | log `write op=… status=net … ms≈20000`; CN em Node e **medição no aparelho** (`N2-PR4-anexos/aparato.md` §3.1) | T2-R11, N2-D35 |
| A-N2-24 | **Editar uma setlist e cancelar sem mudar nada → nenhuma linha `write op=` no log** | log do trecho (`grep 'write op='` vazio); `setlists.json` inalterado (`cmp`) | T2-R3 (N2-D21) |
| A-N2-25 | **Escrita 2xx com o `GET` seguinte falhando (mock) → "salvo; não foi possível recarregar" na tela e `resync kind=setlists … status=<n>` no log**; reabrir a tela refaz o `GET`. **Estendido ao apagar (N2-PR7, N2-E23)**: `delete` 200 com o `GET` em 500 → S1 com *"<nome> foi apagada. Não foi possível recarregar a lista, então ela pode ainda aparecer abaixo."* e `Tentar recarregar`; relida, a setlist some da lista | captura; log (`write … status=201` seguido de `resync … status=500`, depois `resync reason=reopen`; no apagar, `write op=delete … status=200` seguido de `resync … reason=write op=delete status=500`) | T2-R9 (N2-D22), T2-R5 |

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
| **G2** (`g2g3.sh`) | `testID` novos: entrada de criar, formulário, modo de edição, alça ou controle de reordenar e de remover por posição, picker e seus resultados, confirmação de apagar, os estados da escrita. **Base: os `testID` sugeridos da §7 de `DESIGN-N2/README.md`** — a tabela tem **25** linhas, embora a folha se anuncie com 23 (div. 221); sugestão, não contrato, e o aceite no aparelho decide. Nenhum dos 43 atuais some (pre-check §8.2). **N2-PR2: 43 = 43** — não há tela, então não há `testID` novo, e o gate dizendo isso é a prova de que a PR não abriu superfície de UI | PRs da tela |
| **G3** | as linhas do T2-R16 e o `invalidated` real; errata no `LOGS-OCTAVIA.md` na mesma PR. Baseline 57 (pre-check §8.2). **N2-PR2: 57 → 64**, sete adições e **lista de erratas vazia** — nenhuma linha sumiu. A `cache write kind=setlists` mudou de função e **não de texto**, de propósito (errata N2-PR2 do catálogo) | N2-D8, **N2-PR2** e PRs da tela |
| **G4** (`gate:a20`) | as frases do T2-R15 e todos os rótulos novos, **inclusive** `accessibilityLabel`/`Hint` | PRs da tela |
| **G5** | todo alvo novo ≥ 48 dp (alça de arrastar, remover, adicionar no picker, datas do seletor) | aceite da tela |
| **G6** | todo estado novo alcançável por `resource-id` e todo alvo tocável com `testID` — inclusive **S2 com edição e S2 sem edição** (N2-D19), salvando, falhou, **salvo; não recarregado** (N2-D22), sem rede, limite, teto de 100, diálogo de apagar | aceite da tela |
| **G7** (`g7.sh`) | os testes de unidade do T2-R2, R3, R9, R15 e o CN do T2-R18 | cada PR |
| **`gate:icones`** | os **cinco** desenhos novos — `nova setlist`, `alça`, `renomear`, `apagar setlist` e o par `adicionar / remover` — entram no mapa contra o anexo D de `DESIGN-N2/telas.html`, levando o catálogo a **39** registros (E17, N2-D33). Não há ícone de calendário: a data usa o seletor do sistema e o `data` já existe no V1 (div. 224). **Feito no commit 1 da N2-PR2**: o gate lê o anexo D do congelado (não transcreve), imprime `34 registros (V1) + 5 (DESIGN-N2, E17) = 39`, e declara **seis nomes pendentes para cinco registros** (div. 226 — o par são duas entradas no mapa). Pendente ausente é **aviso**; pendente presente e errado é **acusação** (o CN foi de 18 para 19). **A PR que desenhar poda a lista `PENDENTES`**. **Fechado na N2-PR6**: o `adicionar` entrou e a lista ficou **vazia** — `39 registros`, `tela 2 (E17): 6/6 nomes já no mapa e cobrados · 0 declarados pendentes`, `acusações: 0 · avisos: 0`; o `IconesFalso` foi de 22 a 23 pela poda (`N2-PR6-anexos/gates-commit2.txt`) | **commit 1 da PR-2**, antes de desenhar tela — ✅ |

Regra que vale para todos: **o gate vem antes do que ele mede** (`V1-ENCERRAMENTO.md:204`).

**Aparato — rede cortada nos aceites** (div. 290, decidido pelo Marcel em 2026-09-22): *modo avião é permitido em aceite manual quando o estado anterior é lido, declarado e restaurado; o override da API (`EXPO_PUBLIC_API_BASE_URL` apontado para onde não responde) continua sendo o caminho dos aceites automatizados.* Vale para o Tab S6 e para o AVD; a prova de rede cortada continua sendo o `ping` falhando (T2-R12).

---

## 9. Hipóteses

> **O que a N2-PR2 fez com esta tabela (2026-09-21).** Uma decisão saiu de
> "por medir": a **N2-D31** (o servidor manda `Retry-After`?) está medida e a
> **div. 225** fecha — ver T2-R14. **Nenhuma das H-N2-* abaixo fecha nesta
> PR**, e dizer isso é mais útil do que forçar uma: as cinco abertas dependem
> ou do aparelho (H-N2-13), ou de rede real com dado real (H-N2-14), ou de uma
> conta que o Marcel controla (H-N2-2, H-N2-11, H-N2-15). O que mudou de
> estado é a H-N2-5, que era decidida e agora está **implementada**.

| # | Hipótese | Dono | Como fecha |
|---|---|---|---|
| **H-N2-2** (herdada) | a conta **principal** tem `emailVerified: true` | Marcel (console do Firebase) | aberta. Com `false`, criar/datar/adicionar/reordenar dão 401 e, pelo T2-R13, **não** deslogam |
| **H-N2-3** (herdada) | id de path malformado → 500 também no addSong e no reorder | executor | aberta para as duas (a removeSong foi medida, B-d). O nativo só manda ids lidos do servidor (T2-R7), então não alcança |
| **H-N2-4** (herdada) | nenhuma repetição automática; o risco de setlist ou bis duplicado sob rede instável é aceito | — | **decidida (N2-D18)**: nunca repetição automática; "tentar de novo" só depois de reler |
| **H-N2-5** (herdada) | a leitura pós-escrita é `GET /api/setlists` (opção b) | — | **decidida (N2-D13)** e **implementada (N2-PR2)**: `reler()` em `apps/native/src/escrita.ts`, com `saveSetlists()` gravando só o `setlists.json`. O custo de implementação que a §4.2 declarou está pago |
| **H-N2-6** (herdada) | `performance_date` impossível → 500 | executor | a Fase C ou um teste de rota; o nativo não gera esse valor (T2-R3) |
| **H-N2-7** (herdada) | reordenar com o palco na pilha muda a música de uma posição | — | **decidida (N2-D19)**: S2 pelo palco não edita (T2-R19) |
| **H-N2-8** (herdada) | o A10 com dado real continua não reproduzido | Marcel | decidido (N2-D11); T2-R17 mede o mecanismo |
| **H-N2-9** (herdada) | `setlist-mutate` 120/15 min basta | executor | conta do J3: criar 1 + 10 adds + 1 reorder + 1 remove + 1 PUT = **14**; montar a setlist de 60 do zero = 62 (pre-check §12). Duas montagens de 60 em 15 min estouram → T2-R14 cobre |
| **H-N2-10** (herdada) | o design cabe no `SetlistDTO` atual (`core/types.ts:58-67`) | Claude Design / executor | brief; o T2-R4 não precisa de `venue`/`notes` no DTO porque não os envia |
| **H-N2-11** (herdada) | o 401 de email não verificado é idêntico byte a byte ao de token inválido | **Marcel** (conta não verificada) | medição pendente; decide o ramo da N2-D9 (T2-R13 já cobre os dois) |
| **H-N2-12** (nova) | o "último vence" entre dois aparelhos da mesma conta é aceitável, sem pré-condição de versão | Marcel | aceito por construção (backend sem alteração); reabre se o uso real mostrar perda |
| **H-N2-13** (nova) | o `useOnline` (`expo-network`) marca offline rápido o bastante para o T2-R12 barrar a maioria das escritas antes do request | executor | aceite A-N2-14 com o tempo entre o corte (`ping`) e o `net offline` no log |
| **H-N2-14** (nova) | a leitura pós-escrita (b) cabe no orçamento de latência: ≈ 50 KB, 150–340 ms quente (`PRD-TELA-1.md:167`) por escrita, sem degradar o picker | executor | A-N2-6 com o `ms` do `resync` nas 10 adições. **Continua aberta depois da N2-PR2**: o `ms` que os CNs medem é contra um mock em `127.0.0.1`, e um número de loopback não diz nada sobre 4G — é o **trio 80 · 111 · 132** do `LOGS-OCTAVIA.md` ("o número EXISTIR foi lido como o número SERVIR"), e por isso ele não entra aqui como medição |
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

## 13. Divergências (177 a 186; 226 a 233 na N2-PR2)

### Divergências da N2-PR2 (226 a 233)

A PR-0 usou até 186; o desenho, até 225. A N2-PR2 abre em **226**. As duas últimas (232 e 233) são da segunda rodada da PR, antes do merge.

| # | Origem | Divergência | Estado |
|---|---|---|---|
| **226** | **D** | **Cinco registros, seis nomes.** O anexo D do `DESIGN-N2` traz `adicionar / remover` como **um** registro ("um par, não dois desenhos: mesmo círculo, mesma corda de 8"), e a E17 conta **39 registros**. Mas o `dados.ts` precisa de **duas** entradas — o picker adiciona e a linha de S2 remove, na mesma tela, e o `Desenho` não tem estado que comporte "o outro do par" | registrada e **decidida no gate**: 39 registros e 43 nomes esperados, os dois impressos. Não é forma nova — o V1 já tem 34 linhas da §6.4 para 33 nomes (`voltar` duas vezes); aqui é o avesso. A célula "ativo" desse registro carrega o `remover`, e não um estado, então a cobrança é contra a **união** das três células |
| **227** | **D** | **Uma frase da folha nomeia a setlist.** A moldura `N2-S1-salvo-nao-relido` diz "Season 4 foi criada. Não foi possível recarregar a lista, então ela pode não aparecer abaixo ainda." e nomeia de propósito ("em S1 o objeto da frase não está em lugar nenhum da tela"). Nome de setlist é **dado**, não texto: ele não cabe numa constante do core, e um buraco `{nome}` faria o conjunto fechado deixar de ser verificável por comparação literal | registrada. O `frases.ts` guarda a **metade fixa** (a segunda oração, verbatim) e S1 monta `<nome> foi criada. ` na frente. A regra do T2-R15 continua de pé: isto não é frase de **erro**, e nenhuma frase de erro do conjunto carrega nome |
| **228** | **P** | **O prefetch depois de uma escrita NÃO acontece por construção.** O prompt da PR-2 supôs que "se `resync()` passar pelo mesmo `planSync`, criar/datar para os próximos 7 dias dispara o prefetch por construção", e a revisão 1 do T2-R17 dizia que "a ressincronização chama o mesmo `prefetchEArrumar` que o sync completo chama (`App.tsx:159`)". **Nenhum dos dois é verdade** `[medido]`: `sincronizar()` (`apps/native/src/sync.ts`) nunca chamou o prefetch — quem chama é o `App.tsx`, nas duas saídas do `rodarSync` (`:163` e `:177`) —, e a releitura da N2-D13 não passa pelo `planSync`, que pede as páginas de content | registrada; o **T2-R17 foi corrigido**. A N2-PR2 deixa o gancho `aoRelerSetlists(f)` e o declara **inerte**: a PR da tela o liga ao `prefetchEArrumar`. Declarar a inércia é o ponto — o requisito parecia atendido por herança e não estava |
| **229** | **A** | **O `gate:a20` não alcança o `packages/core`.** A raiz dele é `apps/native` (W2, div. 123), e a partir desta PR **todo o texto de UI de falha da tela 2 mora em `packages/core/src/frases.ts`**. O aceite do T2-R15 diz "o G4 passa com as frases novas", e ele passa sem ter lido uma única delas | registrada, **não corrigida aqui**: a §8 põe o G4 nas "PRs da tela", e estender a raiz do gate é mudança de escopo de instrumento fora da lista fechada desta PR. Quem cobre hoje é o `frases.test.ts`, que afirma vocabulário em pt-BR frase a frase. **Destino: a primeira PR de tela**, que já toca o G4 — ou estende a raiz, ou declara que a asserção do core é a cobertura |
| **230** | **P** | O prompt da PR-2 resume as linhas de log como `write op=… status= code= ms=`, `resync kind=setlists status= invalidated=`, `resync reason=reopen` e `write blocked reason=…`. O **T2-R16 já fixou** formatos mais completos (com `setlist=`, `items=`, `reason=`, `op=`, `setlists=`, `ms=`), e o `invalidated` da releitura não mora no `resync`: ele é o `cache write kind=setlists … invalidated=<n>` que o próprio T2-R16 manda passar a carregar o contador real | registrada; **vale o T2-R16**, que está na `main` desde a PR-0. O prompt acrescentou uma quinta razão de barrar (`nada-mudou`), e essa **entrou**, com errata declarada no catálogo |
| **231** | **P** | O prompt cita o `save` que grava os dois arquivos juntos em `store.ts:121-122`; na `main` `becdf7e` ele está em **`:131-132`** (o texto do §4.2 do PRD tem a mesma citação, herdada do pre-check §7.2) | registrada; inofensiva — é a mesma função. Citar por seção ou por símbolo, não por linha, é a lição que a div. 184 já tinha registrado |
| **232** | **A** | **A trava de "uma escrita por vez" cobria a releitura, e o congelado diz que não pode.** A primeira forma do `escrever()` (`apps/native/src/escrita.ts:340` no commit `70e77be`) soltava a trava num `finally` cujo `try` continha o `await reler(…)` da `:328`: a operação inteira travava, request **e** releitura. O `DESIGN-N2/telas.html`, na legenda de `N2-P-relendo`, diz o contrário, verbatim: *"As outras linhas **seguem ativas**: a releitura de uma adição não congela o picker."* Com a trava longa, o T2-R6 (dez adições seguidas, picker aberto) viraria dez esperas de um `GET` de ~50 KB cada. O T2-R11 diz "uma escrita por vez", e a leitura óbvia dele é a errada: o que a trava existe para impedir é **duas escritas no servidor ao mesmo tempo**, e a releitura é um `GET` de outra família, que não escreve nada nem consome a janela `setlist-mutate` | **corrigida**: a trava passa a cobrir só o request (`enviarUm`), e o `finally` a solta antes da releitura. CN em `apps/native/test/escrita.test.ts` ("a trava cobre o request, não a releitura"), três casos, **medido nos dois estados**: contra `70e77be` os três reprovam; depois, os três passam (`N2-PR2-anexos/trava.txt`) |
| **233** | **A** | **Encurtar a trava cobra um preço, e ele foi medido.** Com duas releituras em voo, a ordem de chegada não é a de emissão — a resposta que demora 600 ms carrega a foto de 600 ms atrás — e a releitura emitida PRIMEIRO chegava por último, sobrescrevendo o cache com o estado mais VELHO. Medido no estado intermediário (trava curta, sem ordem): o terceiro CN reprova com o cache em 3 músicas e o servidor em 4 | **corrigida na mesma PR**: `reler()` guarda a ordem de emissão (`geracao`) e a da última que gravou (`ultimaAplicada`); um 200 só se aplica se nenhuma releitura mais nova já tiver gravado. Não muda quantas requests voam. Duas consequências declaradas: (a) a escrita cuja releitura foi descartada continua `ok` e **não** `ok-nao-relido` — ela foi relida, por uma foto melhor, e chamá-la de não relida seria mentir ao contrário; (b) o descarte aparece no log como **duas `resync … status=200` para uma `cache write kind=setlists`**, sem campo novo (errata do catálogo) |

### Divergências da PR-0 (177 a 186)

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
