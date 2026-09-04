# C-ENCERRAMENTO.md

> **Data**: 2026-09-04 · Bloco executado em uma sessão, docs-only: pre-check (Fases A e B) commitado direto na main (`bba5b2e`, decisão C-D8) → PRD da tela 1 em PR (#260, 2 commits `ca9121a` + `bc6af3b`, merge `922469e`, 2026-09-04T21:42Z) → este encerramento (PR-1). **Nenhum código, nenhum scaffold, nenhuma escolha de biblioteca nativa; zero mudança de backend; zero escrita em prod.**
> Ciclo: pre-check com escopo confirmado por escrito antes de medir → aval com 3 correções e 4 ajustes → Fase B (11 probes de leitura em prod, conta de audit, orçamento aprovado probe a probe) → aval → PRD (PR-0) → 1 revisão (notas verbatim N1–N6) → merge do Marcel.
> Contratos tocados: **nenhum** (SETLISTS.md, STORAGE.md, CONTRATO-DE-ERRO.md intactos). Artefatos novos: [`docs/ux/C-PRECHECK.md`](C-PRECHECK.md) + [`docs/ux/C-PRECHECK-anexos/`](C-PRECHECK-anexos/) (A1–A8, B0-*, B-P2/P5/P6/P7) · [`docs/native/PRD-TELA-1.md`](../native/PRD-TELA-1.md).

---

## 1. Arco do bloco

- **Abertura (2026-09-04)**: tela 1 definida pelo Marcel — modo performance + setlists, somente leitura; criação/edição fica no web. Pergunta central do pre-check: "um cliente Expo com `Authorization: Bearer <idToken>` e sem cookie passa nas rotas de leitura?"
- **Fase A (estática)**: inventário de 15 rotas / 26 handlers × mecanismo de auth (20 `ambos`, 1 `bearer-only`, 5 `nenhum`, **zero `cookie-only`**); duas cadeias de verificação (A: `firebase-server-utils`, B: `secure-auth-utils`) e três extratores; o "cookie de sessão" É o idToken de 1h (único `verifyIdToken` do repo); shapes das 4 leituras; caminho de dados do palco web (server component + `localforage`, sem leitura de API); storage sem `createSignedUrl`; 12 famílias de rate limit; M5 preparado. **Oito divergências declaradas**, a primeira delas sobre a premissa do próprio prompt (§6-a).
- **Aval da Fase A**: três correções (contagem do §1.3; §2.6 novo com o Zod de `content_data`; vida efetiva do token ~2h) + C-D4 revisada pelo revisor (corpo sempre do cache de content) + hipótese 11 (referrer da API key) + quatro ajustes na Fase B (P6 obrigatório, P7 novo, P5 ampliado, headers em todo probe).
- **Fase B (prod, leitura)**: 11/11 probes OK — **bearer sem cookie → 200**, byte-idêntico ao cookie (sha `08ebfe43…`, 49.983 B = B6); 401 byte-idêntico para "sem" e "inválido"; bucket público hoje; biblioteca 66 itens / 19.481 B de corpos / 465 B máximo; chaves reais de `content_data` = `lyrics`/`chords`/`tablature` (strings) + `annotations` (array) — `sections`/`file`, que o palco web lê, **não existem**. Cruzamento offline 69/69 byte-idênticos entre setlists e content. Custo = orçamento aprovado; zero escrita.
- **Decisões (Marcel, 2026-09-04)**: C-D1…C-D8 (§2).
- **PRD (PR-0, #260)**: 37 requisitos `T1-R1…R37` (+ `T1-R9b` na revisão), 22 critérios de aceite `A1–A22`, hipóteses `H8–H18` com dono, backlog classificado (§11), divergências plano × pre-check × PRD (§12), exclusões com destino (§13). Revisão 1: seis trechos (cinco pontos da revisão 1) fora do pre-check viraram notas verbatim N1–N6; H14 reescrita (~128 itens, 2 páginas); T1-R9 atômico + T1-R9b (paginação estável, corrida declarada, dedupe por `id`).

| Entrega | Commit / PR | Tamanho e sha |
|---|---|---|
| Pre-check Fases A+B + anexos (C-D8, direto na main) | `bba5b2e` (15 arquivos, +3777) | `C-PRECHECK.md` 1163 linhas · sha256 `d72bd8ef0c32bae84384484d89b9f332199654fe5ba9c696a003984ae55008c2` |
| PRD da tela 1 (PR-0) | #260 → `ca9121a`, rev.1 `bc6af3b`, merge `922469e` | `PRD-TELA-1.md` 484 linhas · sha256 `9718d9b068dc8c6703c9738b3aee4c1d57fd0c48a6975298e944e0511f70d3e6` |
| Encerramento + plano (PR-1) | esta PR | — |

## 2. Decisões C-D1…C-D8 — estado final

| Decisão | Uma linha | Fundamento (C-PRECHECK) |
|---|---|---|
| **C-D1** | Bearer direto pelo SDK Firebase, exclusivo; o nativo nunca chama `/api/auth/session`; B1.5 desejável, fila da tela 2; pendência do Marcel: restrição de referrer da web API key | §1.3–1.6; B.2 P2/P2b/P3×P2/P3b |
| **C-D2** | Bucket público mantido; nativo baixa `file_url` direto, sem proxy; URL imutável = chave de cache | §3; B.2 P4/P4b |
| **C-D3** | Busca client-side sobre o cache local, acentos normalizados no cliente; B11 (servidor) sai do caminho do nativo | §2.3; B.3 |
| **C-D4** | Setlists só para ordem/ids/metadados; corpo sempre do cache de content por `content_id`, versionado por `content.updated_at`; substituição sem merge; cache-first com revalidação atrás; B9 não bloqueia a tela 1 | §2.1, §2.5; B.4 |
| **C-D5** | Cascata content×storage fora da tela 1; reabre na tela 2 | §3.3; B.6 |
| **C-D6** | Sync completo de metadados ao abrir + prefetch dos arquivos das setlists com `performance_date` nos próximos 7 dias + resto sob demanda; zero retry com token que recebeu 401; renovação pelo SDK com buffer < 5 min | §4.2–4.3; B.2 |
| **C-D7** | Contrato de `content_data` por `content_type` escrito a partir do medido; `annotations` é não-contrato (a tabela `public.annotations` é a casa do conceito); chaves desconhecidas ignoradas; `content_data null` sem `file_url` é estado inválido a reportar; Zod por tipo na escrita = mini-item futuro do B | §2.6; B.3 |
| **C-D8** | Pre-check commitado docs-only direto na main | `bba5b2e` |

## 3. O que entregou (números)

- **Resposta à pergunta do bloco, medida em prod**: `GET /api/setlists` com bearer e sem cookie → **200**, corpo byte-idêntico ao do cookie e ao do encerramento do B6 (`08ebfe437cd81e52edd494bb037cc242f4c590ba9612da2bb87c1a1504e8cb01`, 49.983 B). Controle negativo: bearer inválido → 401 byte-idêntico ao "sem credencial" (sha `3c1c84e3…`).
- **Zero mudança de backend necessária para a tela 1** — todas as 4 leituras + proxy estão na cadeia A (bearer, sem exigir email verificado).
- **Biblioteca dimensionada**: 66 content (38 Lyrics / 18 Chords / 8 Tab / 2 Sheet), 5 com `file_url` (todos `content_data null`), corpos somam 19.481 B, maior 465 B, payload 52.941 B; tabela inteira 194 linhas (B2, 2026-08-24) → ~128 no repertório principal → 2 páginas de `GET /api/content`.
- **Contrato de `content_data` nasce escrito** (C-D7, PRD §4) — e o achado de que ele não existia (o Zod é `z.record(jsonValueSchema).nullish()`) só apareceu na revisão do aval (§6-c).
- **Cache-Control de `/api/*` medido**: `public, max-age=0, must-revalidate` em 10/10 respostas — o `no-store` do `security-headers` não chega (middleware exclui `/api`). Classificado para o Bloco B.
- **PRD**: 38 requisitos com aceite verificável, 22 critérios fechados, 11 hipóteses com dono, 6 notas verbatim.
- **Suíte, lint, build**: intocados (docs-only; nenhum arquivo de código tocado em nenhuma PR do bloco).

## 4. Medições em prod (a campanha do bloco)

| Probe | Resultado |
|---|---|
| P1 sem credencial | 401 `AUTH_REQUIRED` + `WWW-Authenticate: Bearer` |
| **P2 bearer sem cookie** | **200**, 49.983 B, sha `08ebfe43…`, 3 setlists / 69 songs, invariante 1..N sem violação |
| P2b bearer inválido | 401 byte-idêntico ao P1 |
| P3 cookie sem bearer | 200, sha `08ebfe43…` = B6 |
| P3×P2 `Promise.all` | shas iguais |
| P3b `/api/profile` bearer (cadeia B) | 200 ⇒ conta de audit com email verificado |
| P4 objeto público sem header | 200, `application/pdf`, 20.821 B |
| P4b proxy com bearer | 200, sha = P4 |
| P5 `/api/content?pageSize=100` | 200, `total: 66`, 52.941 B |
| P6 detalhe da setlist de 60 | 200, `setlist_songs` idêntico ao item do P2 |
| P7 content unitário | 200, `content_data` idêntico ao P5 (`null` — evidência fraca, fechada pelo cruzamento offline 69/69) |

Custo: `session` 1 · `setlist-read` 5 · `content-read` 2 · `proxy` 1 · `profile` 1 · `authfail` (ip) 1 · Supabase direto 1 — igual ao orçamento aprovado. Saldo: setlists 3→3 · songs 69→69 · content 66→66 (nenhum probe escreve). Instrumento e log verbatim em `C-PRECHECK-anexos/B0-*`.

## 5. Hipóteses remanescentes (PRD §9) — com dono

| # | Hipótese | Dono | Medição que fecha |
|---|---|---|---|
| H8 | Mecanismo do item 9 (setlist nunca visitada offline no web) | aceito (web) | não fechar |
| H9 | Teto de rate limit = limite × instâncias | aceito | não fechar |
| H10 | `authfail` sob CGNAT | tela 1 (T1-R3 elimina o loop por construção) | — |
| H11 | Web API key sem restrição de HTTP referrer | **Marcel / console** — antes da primeira build | checagem no Google Cloud |
| H12 | Cold start explica 1,5–2 s dos primeiros hits | aceito | 10 aberturas na 1ª semana |
| H13 | Origem do `Cache-Control: public, max-age=0` (Next × Vercel) | Bloco B | ler config quando o item abrir |
| H14 | Repertório principal ~128 itens (194 − 66, B2 2026-08-24); não passou de 200 | Marcel | `total` de `GET /api/content` com a conta principal |
| H15 | SDK Firebase no runtime nativo persiste sessão e opera offline | 1ª semana do nativo | kill + reopen em modo avião |
| H16 | Tamanho real dos PDFs (teto de 200 MB do LRU) | 1ª semana | soma de `Content-Length` das `file_url` |
| H17 | `performance_date` preenchida no uso real (prefetch de 7 dias depende) | Marcel | contar não-nulos na conta principal |
| H18 | Provedores de login da conta principal (email/senha, Google) | Marcel | console do Firebase Auth |

## 6. Aprendizados (lições do bloco)

**(a) Premissa errada no prompt do revisor — o dump não tem storage.** O M3 mandava ler as policies de `storage.objects`/`storage.buckets` "no `schema.dump.sql`"; o dump é `supabase db dump -s public` (`package.json:20`) e não contém nada de `storage` (`grep -i storage` → exit 1). A regra "divergência é declarada, nunca acomodada" funcionou: a divergência nº 1 abriu o relatório, o M3 foi respondido por código + referência ao B5, e a prova de runtime veio pelo P4. **Regra que fica**: toda premissa de prompt sobre onde um fato vive é ela mesma uma hipótese a medir antes de medir o fato; e o `db:dump` só prova o schema `public` — as policies do bucket continuam sem versão no repo (item para o B, se um dia o storage mudar de contrato).

**(b) Citação a linha fora do pre-check só entra com o trecho colado.** O PRD original citou, sem trecho colado, seis trechos fora do pre-check (`route.ts:255`, `advanced-content-cache.ts:158`, `use-setlist-data.ts:172`, `user-rate-limit.ts:125-137`, o "194" do B2 e o "contrato B5" do `performance_date`) — cinco pontos da revisão 1; o revisor cobrou e seis trechos (cinco pontos da revisão 1) viraram notas verbatim N1–N6 (comando + saída). Duas delas mudaram substância: o `updated_at` de `content` só bumpa no handler (sem trigger, `DEFAULT now()` só no INSERT → edição por console é invisível ao cliente), e o "B5" do `performance_date` era a seção **"B5 — Decisões de dados"** do plano, não o bloco de storage homônimo. **Regra que fica**: um `[medido]` no PRD tem o mesmo padrão de forma do pre-check — arquivo:linha **e** trecho verbatim; "citado em §x" só vale se o §x tiver colado a linha.

**(c) O contrato interno de colunas JSON entra no pre-check por padrão.** O achado de que `content_data` não tinha contrato (Zod = objeto qualquer ou null; o consumidor do palco lê 4 chaves das quais 2 não existem em nenhum item, e ignora `tablature`) só apareceu porque o revisor cobrou o Zod no aval da Fase A (§2.6 novo) e ampliou o P5 com o inventário de chaves reais. Sem isso, o PRD teria herdado o shape do consumidor web — que é o fio desligado do TAB. **Regra que fica**: pre-check de shape inclui, para toda coluna `jsonb`, (i) o schema de escrita verbatim, (ii) o consumidor de referência verbatim e (iii) o inventário de chaves reais no banco (`jq ... keys | group_by`), antes de qualquer decisão de renderização.

**(d) Bearer já era o transporte do web.** O plano (B7) tratava bearer como "contrato a documentar"; o grep mostrou 18 fetches do próprio web com `Authorization: Bearer` e a Fase B provou 200 sem cookie. O pre-check trocou uma "prova" por uma "confirmação" — barato, mas o plano carregava a premissa invertida desde agosto. **Regra que fica**: antes de planejar uma "prova de viabilidade", grep pelo que o cliente atual já faz.

**(e) O P7 provou `null = null`.** A "1ª música da 1ª setlist" era um Sheet sem `content_data`; a byte-identidade unitário × listagem ficou fraca e foi fechada sem rede pelo cruzamento dos anexos (69/69). **Regra que fica**: probe que compara corpos escolhe o alvo pelo conteúdo, não pela posição; e todo cruzamento que possa ser feito offline sobre corpos já colhidos é feito antes de gastar orçamento.

**(f) Um relatório com a data do HEAD, não da sessão.** A primeira gravação do pre-check trazia "2026-09-01" (data de `9dea9a6`); corrigido como errata declarada na revisão. Miúdo, mas é a classe "número copiado de outro lugar" — a mesma da B6 §6-4.

## 7. Pendências que saem do Bloco C

Classificadas, não agendadas — transpostas para o [`PLANO-TRANSICAO.md`](PLANO-TRANSICAO.md) nas seções certas (Bloco B: herança do C; B1.5; B9; B11; Sequência):

- **Bloco B (mini-itens)**: `Cache-Control: private`/`no-store` nas rotas de `/api/*`; Zod de `content_data` por `content_type` na escrita (C-D7); remoção de `GET /api/debug/config`; correção do STORAGE.md (upload aceita bearer OU cookie e exige email verificado); dead code (`types/setlist.ts:40 event_date`, `commonSchemas.contentType`, comentário stale em `scripts/ux-audit/auth.ts:109`); contrato escrito de auth do cliente (B7 — o §3 do PRD é a base); **novo**: desempate por `id` no `order` do `GET /api/content` (PRD nota N6 — dois `created_at` iguais têm ordem não garantida entre páginas); shape enxuto de listagem de setlists (SET-22) como otimização.
- **Fila da tela 2**: B1.5 (fusão das cadeias; cache respeitar `exp` do JWT), B9 (idempotência — pré-requisito do primeiro POST do nativo), B5-D6 (cascata content×storage + reconciliação).
- **Web**: B11 (busca no servidor com `unaccent`/`pg_trgm`) — o nativo busca local.
- **B-final**: revogação do bypass secret da Vercel (B5-D5).
- **Marcel / console**: H11 (referrer da web API key), H14/H16/H17 (contagens da conta principal), H18 (provedores).
- **Próximo bloco**: a eleger — candidatos: **bloco de stack do nativo** (scaffold do monorepo, escolha de runtime, prova de H15/H16 na primeira semana) × **mini-itens do Bloco B**.

## 8. Estado final

- main: `922469e` (merge da #260) + esta PR-1 quando mergeada.
- Contagens em prod (conta de audit): setlists 3 · songs 69 · content 66 · bucket 7 (referência) — idênticas às da abertura; **zero escrita** no bloco.
- Contratos de API: intactos. Código: intocado. Suíte: intocada.
- Decisões C-D1…C-D8 registradas no PRD §1 e aqui; não reabrir sem novo pre-check.
