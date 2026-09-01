# B6-ENCERRAMENTO.md

> **Data**: 2026-09-01 · Bloco executado em 6 PRs (#253–#258, 2026-08-31 → 2026-09-01) + 1 migração aplicada em prod (passo do Marcel).
> Ciclo: pre-check (medição, relatório em chat com campanha L0–L5 e balanço zero) → [`B6-DESENHO.md`](B6-DESENHO.md) (5 revisões de aval; versionado no PR-0) → execução com gate-keeping total (Regra nº 7 em todo flip; it.fails→it com os dois commits na branch; P1-contraste branch × prod ao vivo; Postgres descartável antes do console; leitura-antes e saldo zero em todo probe de escrita; merge sempre do Marcel).
> Contratos tocados: [`docs/api/SETLISTS.md`](../api/SETLISTS.md) (**novo** — invariante 1..N como contrato) · [`docs/api/STORAGE.md`](../api/STORAGE.md) (naming D5′ + paridade) · [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md) (**intacto**: 5 codes, zero exceções ao append-only — os SQLSTATEs OB6xx são internos banco→rota e nunca aparecem no envelope).

---

## 1. Arco do bloco

Da eleição (2026-08-31) ao merge da PR-4 (2026-09-01):

- **Pre-check** (2026-08-31): a premissa do plano — reorder por array — foi **derrubada na primeira leitura** (o contrato vigente era move-de-uma-música, `PUT /api/setlists/songs/[songId]`); PARE acionado, plano corrigido pelo Marcel (nasceu a **Q7**). Campanha L0–L5 contra a preview da main com balanço zero (setlists 3→3, songs 69→69, bucket 7→7): gap p99 medido vivo (L1.4), 1,2MB parseado inteiro sem guard (L2.1, 956ms), 2N UPDATEs sem transação lidos no código, N+1 contado (1+2N: 7 queries para N=3), RLS sem WITH CHECK nas 4 policies ALL, assimetria de espaço upload×delete provada (L4). Sete perguntas Q1–Q7 entregues com material, sem resposta.
- **Decisões** (2026-08-31, do Marcel): D1–D7 fechadas de uma vez; D8–D11 nasceram nos avais do desenho.
- **Desenho** (PR-0, #253 → `57a0c8f`): **5 revisões de aval** — rev.1 (guards de `ROW_COUNT`, errcodes OB6xx por `error.code`, D8 decidida, D9 e D5′ emendadas), rev.2 (**D10**: addSong entra no lock — o interleaving addSong×remove produzia gap silencioso que nenhum guard via), rev.3 (inventário de escritores `[medido]` → a **brecha (e)** do delete de content aparece; double-delete declarado), rev.4 (**D11**: quarta função fecha a brecha), rev.5 (passo 0: `FOR UPDATE` na linha do content × FOR KEY SHARE da FK — o lock post-hoc morre).
- **Migração** (PR-3a, #255 → `9badcbf`): `supabase/migrations/20260901102108_b6_setlist_songs_rpc.sql` — primeira migração versionada da série (D8). Primeira tentativa de console rejeitada com `42601` (`position` sem aspas no RETURNS TABLE) → correção + **execução completa em Postgres 15 descartável** (prelúdio + dump + migração + 8 probes SQL) ANTES da reaplicação. **Aplicada em prod em 2026-09-01 pelo Marcel** (begin/commit; D7 na mesma sessão de console); dump/types regenerados como prova.
- **Rotas** (PR-3b #256 → `7d398b0`; PR-3c #257 → `8238bce`): contrato de escrita completo — reorder em lote nasce, move-one morre, addSong/remove/delete-de-content viram chamadas de RPC com tradução por `error.code` no ponto único `lib/rpc-errors.ts`.
- **N+1** (PR-4, #258 → `9ba371f`): 7→1 queries com corpo byte-idêntico (sha256 `08ebfe43…` nas três leituras: captura pré-flip, branch, prod).

| Entrega | PR | Commit na main |
|---|---|---|
| Desenho versionado (rev. final, 5 avais) | PR-0 (#253) | `57a0c8f` (2026-08-31) |
| D5′: paridade upload→delete (NFD + `[^a-zA-Z0-9._-]`→`_`, flag `u`) + teste de paridade + STORAGE.md | PR-1 (#254) | `9e7a09a` (2026-09-01) |
| Migração com as 4 RPCs sob lock + WITH CHECK (D7) + prova pós-aplicação (dump/types) + CLAUDE.md (D8) | PR-3a (#255) | `9badcbf` (2026-09-01) |
| Reorder em lote + addSong/DELETE via RPC + move-one removido + `lib/rpc-errors.ts` + SETLISTS.md | PR-3b (#256) | `7d398b0` (2026-09-01) |
| DELETE de content renumera (gate explícito + RPC; a brecha (e) fecha) | PR-3c (#257) | `8238bce` (2026-09-01) |
| N+1 do GET /api/setlists morre (7→1, byte-idêntico) | PR-4 (#258) | `9ba371f` (2026-09-01) |

## 2. Decisões B6-D1…D11 — estado final

O encadeamento **§2.3-veto → D9 → D10 → D11** é o padrão do bloco: **cada escritor puxou o próximo para dentro do lock** — o veto do remove (renumerar fora da transação viola o invariante) trouxe a D9; a D9 expôs que o addSong era o único escritor sem o lock (gap silencioso do §2.3) e virou D10; o inventário exigido no aval expôs o delete de content via cascade e virou D11.

| Decisão | Conteúdo | Material medido (uma linha) |
|---|---|---|
| **D1** | Reorder em LOTE canônico; move-one REMOVIDO | 2N+3 statements/movimento; rota morta na web (TODO `setlist-manager.tsx:279`); pós-remoção: PUT → **405 medido** na branch |
| **D2** | Atomicidade por RPC transacional | OB601 com **rollback provado por leitura** (estado antes ≡ depois); `tempOffset=10000` morto |
| **D3** | position: servidor autoritativo, invariante 1..N; addSong append-only | L1.4: prod gravava p99 verbatim (gap que se propaga); pós-flip: 99→max+1, 201 fiel |
| **D4** | Rota nova nasce com guard de corpo | L2.1: 1,2MB → `400 field:""` na rota nova (na velha: parse integral + unrecognized_keys em 956ms) |
| **D5′** | Paridade upload→delete é CONTRATO (NFD + classe→`_`, flag `u`) | 12 nomes hostis (10 paridade + 2 recusa-anterior); espaço/tab/acento/emoji provados por it.fails→it; replay com par upload→delete fechando (saldo 7 sem console) |
| **D6** | N+1 do GET /api/setlists morre | 7→1 queries (contador no handler real); sha256 idêntico `08ebfe43…` em captura/branch/prod |
| **D7** | WITH CHECK nas 4 policies ALL | pg_policies antes (4× false, console do Marcel) → dump regenerado com os 4 `WITH CHECK` espelhando o USING |
| **D8** | Migração versionada no repo; aplicação = Marcel; dump/types provam | `supabase/migrations/20260901102108_*.sql`; CLAUDE.md ganhou a seção; dump com as 4 funções |
| **D9** | Invariante estende ao DELETE (RPC irmã) | remove do MEIO → 1..N-1 contíguo (unit + preview + descartável); double-delete → OB603 → 404 |
| **D10** | addSong via RPC — TODOS os escritores sob o lock | interleaving add×remove = gap silencioso (análise do §2.3, vetada a versão sem lock); addSong×addSong virou serialização: **201+201 (N+1, N+2) medido** |
| **D11** | delete de content renumera (4ª função; brecha (e) fecha) | controle DETERMINÍSTICO: prod `[1,3]` gap garantido × branch `[1,2]` contíguo — medido nos dois lados |

## 3. O que entregou (números)

- **4 RPCs sob lock em prod** (`reorder_setlist_songs`, `remove_setlist_song`, `add_setlist_song`, `delete_content_resequence`), SECURITY INVOKER, revoke por role nomeada (`public, anon, authenticated`) — probes 0a/0b: só `postgres`+`service_role` com EXECUTE; anon → `401 42501`.
- **Invariante 1..N como contrato escrito** (SETLISTS.md, novo) com o mecanismo nomeado; revalidado 3× no bloco: **0 violações** em 8 setlists / 107 songs (todas as contas).
- **Reorder em lote** (`PUT /api/setlists/[id]/songs/order`): permutação exata, 400 mismatch byte-idênticos (anti-oráculo), 200 com a ordem canônica; **move-one removido** (−295 linhas; `grep updateSongPosition` vazio fora de `.backup`).
- **addSong append-only**: gap morto (L1.4 replay: branch 201 `position=4` × prod 99); shape do 201 byte-idêntico ao medido (6 colunas na ordem).
- **Delete de content renumerando**: o único gate do bloco com **reprodução garantida** do controle negativo — prod `[1,3]` × branch `[1,2]`.
- **D5′**: paridade upload→delete com 12 nomes; **D7**: 4 WITH CHECK.
- **N+1**: 7→1 com sha256 idêntico (49.983 bytes).
- **Suíte 607 → 649** (+42, todos de contrato/gate; 86 skipped constante).
- **CONTRATO-DE-ERRO intacto**: 5 codes, envelope flat, zero exceções ao append-only.

## 4. Controles negativos medidos (a coleção do bloco)

- **Probe 7 da PR-3b — O PRIMEIRO controle negativo MEDIDO da série**: K=6 moves concorrentes contra o move-one EM PROD → `m1,m2=200; m3–m6=500` (4/6 falharam ruidosamente; estado final da amostra contíguo, sem corrupção persistida). Contraste: contrato novo 6/6×200 com invariante exato 1..8.
- **Determinístico da PR-3c**: content no meio + DELETE → prod gap `[1,3]` **garantido** (sem timing) × branch `[1,2]`.
- **it.fails→it por PR** (dois commits na ordem, sempre): PR-1 (9), PR-3b (9 + coluna do helper por PR), PR-3c (7), PR-4 (gate de invariância por captura, 7 queries + sha256).
- **0b**: rpc com chave anon → `401 {"code":"42501"}` — nunca OB6xx.
- **"Não reproduzido", registrados como tais**: addSong×addSong em prod (201+201 — o 500 da UNIQUE não interleaveou em P1); addSong×remove em prod (janela parcial — remove do último).

## 5. Exceções e resíduos declarados

| Resíduo | Estado |
|---|---|
| Aplicação da migração em prod sem a saída literal do console | Declarado no consolidado da PR-3a e aceito pelo revisor; **prova substituta nomeada**: probes 1–8 executando as 4 funções em prod + dump regenerado com as funções verbatim |
| Deadlock `40P01` entre dois delete-de-content concorrentes | Declarado (desenho §2.6 ponto 5) → 500 honesto, rollback total; evento = mesmo usuário, dois deletes simultâneos |
| UNIQUE addSong×addSong | **Extinta como falha**: virou serialização pelo lock — flip medido 201+201 (N+1, N+2); em prod pré-D10, o 500 esperado não reproduziu em P1 (registrado) |
| Reorder de setlist >100 músicas | Fora do contrato (teto alinhado ao `songs[]` do create; sobe junto, decisão à parte) |
| `1750171474983-Easy - Guitar.pdf` | Segue indeletável pela rota (anterior à D5′); precedente de console (O-1 do B5) |
| Janela OB602 do remove (setlist deletada entre leitura e lock) | Cinto inalcançável na prática; traduzida em 404 sem oráculo |

## 6. Aprendizados (consolidação do §11 do desenho + registros dos avais)

1. **Shape assumido = medir antes**: o pre-check nasceu com a premissa do reorder-por-array; a primeira leitura do repo a derrubou. Custo: um PARE. Regra: premissa nova = medição antes de desenhar sobre ela.
2. **Invariante declarado ⇒ inventário de escritores NO PRE-CHECK**: a brecha (e) — delete de content via cascade sem renumerar — só apareceu na 3ª revisão do desenho porque o inventário não estava no plano de medição. Custo: uma decisão (Q9→D11), uma função e uma PR descobertas tarde.
3. **Migração só vai ao console depois do Postgres descartável com o dump aplicado**: o `42601` foi pego pelo console de prod, não por nós. O caminho descartável custa minutos e virou passo obrigatório do rito (desenho §3/§11).
4. **Decisão fechada com base em RÓTULO, não em classe**: a B5-D11 dizia "espaço"; a classe era **paridade upload→delete** — só o aval da D5′ a nomeou (o conjunto hostil tinha 12 nomes, não 1). Fechar decisão pela classe, não pelo exemplo que a revelou.
5. **Relatório-fora-da-sessão continua sendo o vício a cobrar**: 3 ocorrências no bloco ("está na saída acima", anexo de sessão, contagem sem reconciliar baseline) — o registro do revisor é o texto colado na resposta, verbatim, sempre.

## 7. Pendências que saem do B6

- **B9** (idempotência + revogação do bypass) — **próximo da fila natural**, com o replay offline do nativo como consumidor (ADD-14 declarou o buraco; o bypass secret está com revogação reservada ao B9 desde a B5-D5).
- **B1.5** (na fila desde o B1).
- **B11** (busca — aguarda PRD; stub desde o B5 PR-0).
- **D8 do plano** (abertura do Bloco D — morte da web).
- **Flake do performance-mode** (tooling de teste; fora de qualquer contrato).
- **Dívidas latentes restantes do B2**: `profiles.email` sem UNIQUE; os 6 índices declarados-e-não-criados.

## 8. Estado final

- Contagens (conta de audit): **setlists=3 · songs=69 · content=66 · bucket=7** — idênticas às da abertura do bloco; zero resíduo de campanha.
- Suíte: **649 passed / 86 skipped** · lint/tsc/build verdes.
- main: **`9ba371f`** (PR-4, 2026-09-01).
- Migração **`20260901102108_b6_setlist_songs_rpc.sql` aplicada em prod** (2026-09-01, Marcel); dump/types na main provam.
- `PLANO-TRANSICAO.md` atualizado neste mesmo commit (B6 ✅; fila: **B9 candidato natural** · B1.5 · B11 aguarda PRD · D8 abre o Bloco D — próximo bloco a eleger na abertura da próxima conversa).
