# B5-DESENHO.md

> **Data**: 2026-08-29 · Desenho do B5 (storage), para revisão e aval do Marcel antes de qualquer implementação.
> **Premissas fechadas (não reabertas aqui)**: B5-D1 (escopo = storage; busca vira bloco próprio) · B5-D2 (órfãos só via reconciliação, remoção gateada com lista nominal) · B5-D3 (bucket segue público, modelo contratado por escrito) · B5-D4 (teto único 4MB em três camadas) · B5-D5 (bypass revoga no B9) · B5-D6 (delete tooling/interno; cascata do delete de content ADIADA).
> **Base factual**: [`B5-PRECHECK.md`](B5-PRECHECK.md) (commit `60b47ee`) — referenciado por §, sem re-medição. Contrato de erro vigente: [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md) (envelope flat, 5 codes, 1:1, append-only).
> **Método herdado**: ciclo por PR (checkpoint → preview por URL de branch → aval → merge → confirmação em prod), Regra nº 7 em toda mudança, leitura-antes de toda escrita, P1-contraste para flips, saldo zero em todo probe de escrita.

---

## §0 — Âncoras do pre-check usadas pelo desenho

| Fato | Onde |
|---|---|
| Bucket `content-files` público, `file_size_limit: 1048576`, sem restrição de MIME | pre-check §2.1 |
| 94 objetos; 87 órfãos tipo A; 0 tipo B; 8 refs ↔ 7 objetos; duplicata real `97256d70`/`13303251` | §2.2, §2.4 |
| Magic bytes não verificados em camada nenhuma; P1 (texto como `image/png`) → 201 | §3.3–3.4 |
| Upload 2MB → 500 `INTERNAL_ERROR`; `MAX_FILE_SIZE` órfão; guard 1MB só JSON | §4 |
| Objeto sumido: upstream 400 `NoSuchKey` → nosso 500; ramo 404 do proxy inerte | §5 |
| Upload: 1 fluxo de UI; delete: 0 callers de app (só tooling); proxy: só o palco; viewer/offline usam URL pública direta | §6 |
| Rotulagem B4/B5 ambígua no plano | §1 |

---

## §1 — Fatiamento em PRs

Quatro PRs + uma operação gateada + um encerramento docs-only. Espinha igual à sugerida no prompt, com uma justificativa de ordem explícita:

| # | Nome | Escopo em uma linha | Depende de |
|---|---|---|---|
| **PR-0** | Docs/rotulagem | Mata a ambiguidade B4/B5 no plano; corrige CLAUDE.md (Firebase→Supabase Storage); meia-linha cosmética do contrato (pendência do aval do B3 PR-0); stub do bloco da busca | — |
| **PR-1** | Teto 4MB (B5-D4) | Schema 50MB→4MB (mata `MAX_FILE_SIZE` órfão); 400 `field:"size"` antes do Supabase; **ação de console do Marcel (bucket 1MB→4MB) sequenciada dentro do ciclo desta PR** | PR-0 (só ordem, não técnica) |
| **PR-2** | Magic bytes | Módulo `lib/file-signatures.ts` + checagem na rota de upload; 400 `field:"file"` | PR-1 (mesma rota — evita conflito e mantém um flip por PR) |
| **PR-3** | Listagem + reconciliação (modo relatório) | Rota `GET /api/storage/list`; script de reconciliação read-only; doc `docs/api/STORAGE.md` com a cláusula B5-D3; **nenhuma deleção** | PR-2 (o relatório usa o sniffer para apontar objetos mentirosos) |
| **O-1** | Limpeza gateada (não é PR) | Execução do modo delete do script sobre a lista nominal aprovada pelo Marcel (B5-D2); consome `POST /api/storage/delete` como primeiro consumidor de sistema (B5-D6) | PR-3 mergeada + aval nominal |
| **ENC** | `B5-ENCERRAMENTO.md` | Tabela re-medida + balanço + registro do B5-D5 (bypass → B9); commit docs-only direto na main com aval (mesma régua de `adab4f0`/`60b47ee`) | O-1 |

**Justificativa da ordem**:

1. **PR-0 primeiro** porque a rotulagem errada contamina todo texto subsequente (PRs, avais, encerramento citariam "B5" sobre um plano que diz B4) — custo zero, risco zero, docs-only.
2. **Teto antes de magic bytes**: os dois tocam a mesma rota; um flip observável por PR (regra do B3). O teto vem primeiro porque (a) destrava valor real imediato — a faixa 1–4MB morta abre (PDF escaneado comum volta a subir), (b) o controle do teto (replay do P2) independe do sniffer, enquanto o controle de magic bytes (replay do P1, 17 bytes) independe do teto — nenhuma dependência técnica, então desempata o valor de produto, e (c) a ação de console do Marcel fica no início do bloco, com folga para observar efeitos.
3. **Listagem/reconciliação por último**: é o maior escopo, consome o sniffer da PR-2 (relatório de objetos mentirosos) e o teto já estável evita relatório sobre um bucket em transição de config.
4. **O-1 fora de PR**: deleção de dados vivos não entra em ciclo de merge — é operação com aval próprio e lista nominal (B5-D2).

**O que cada PR NÃO toca** (explícito):

- PR-0: nenhum código, nenhum teste, nenhum schema.
- PR-1: não toca magic bytes, não toca proxy, não toca delete, não toca o guard JSON de 1MB (`parseRequestBody` fica como está), não toca o reorder-sem-guard (fora do bloco, §10).
- PR-2: não toca limites, não toca objetos já armazenados (mentirosos legados são REPORTADOS na PR-3, nunca alterados), não toca o delete.
- PR-3: não deleta nada (modo relatório apenas); não muda upload nem proxy; não decide B5-D7 (proxy × sumido — pergunta aberta, §11).

---

## §2 — PR-0: docs e rotulagem

### 2.1 Forma da correção B4/B5 no plano: **nota de equivalência, NÃO renumeração**

Renumerar as seções reescreveria dezenas de referências históricas ("B5 ✅" nas linhas da tabela-resumo, balanços do B2/B3, memórias) e recriaria a classe de drift que a nota mata. Proposta:

1. **No topo da seção `### B4 — Storage…`**, inserir:
   > **⚠️ Nota de rotulagem (B5 PR-0, 2026-08-29)**: este é o bloco executado sob o nome **B5** desde o balanço do B2 (pre-check em [`B5-PRECHECK.md`](B5-PRECHECK.md), desenho em [`B5-DESENHO.md`](B5-DESENHO.md)). O número de seção "B4" é histórico e não será reusado. Escopo fixado pela decisão **B5-D1**: storage apenas.
2. **No topo da seção `### B5 — Decisões de dados…`**, inserir:
   > **⚠️ Nota de rotulagem (B5 PR-0, 2026-08-29)**: as decisões desta seção estão encerradas desde 2026-08-10; o NOME "B5" passou a designar o bloco de storage (seção acima). A única tarefa em aberto aqui — **busca (LIB-04)** — sai para bloco próprio (ver B11), por decisão **B5-D1**.
3. **Seção nova `### B11 — Busca (LIB-04)`** (stub, sem desenho): move o texto da tarefa (`unaccent`/`pg_trgm`, `GET /api/content?search=`) para lá. *(O número B11 é proposta — pergunta B5-D8, §11.)*
4. **Tabela-resumo, linha LIB-04**: nota passa de "B5: unaccent/pg_trgm" para "**B11** (bloco próprio; era rotulado B5 — decisão B5-D1)".

### 2.2 Demais itens do PR-0

- **CLAUDE.md**: "Storage: Firebase Storage for file uploads" → "Storage: **Supabase Storage** (bucket `content-files`) for file uploads; Firebase é só Auth" (divergência nº 3 do pre-check). Varredura no arquivo por outras menções a Firebase Storage no mesmo erro.
- **CONTRATO-DE-ERRO.md**: a meia-linha cosmética pendente do aval do B3 PR-0 — na seção Envelope: "Codes podem declarar campos adicionais no envelope (ex.: `retryAfter` em `RATE_LIMITED`); o cliente os ignora se não os conhece (cláusula 2)." Adição de texto, sem mudança normativa.
- **Gate**: docs-only, CI verde basta (padrão do bloco). Sem controle negativo (nada comportamental).

---

## §3 — PR-1: teto 4MB (B5-D4)

### 3.1 Semântica de fronteira

- **Valor canônico: 4 MiB = 4 × 1024 × 1024 = 4.194.304 bytes**, nas três camadas, **inclusivo**: arquivo de exatamente 4.194.304 bytes É aceito; 4.194.305 é recusado.
- **Rota (schema)**: `size: z.number().int().min(1).max(4 * 1024 * 1024)` em `storageSchemas.upload` — o `.max()` do Zod é inclusivo, então a semântica cai naturalmente. A recusa sai do fluxo já existente (`validationError(fileValidation.error)`) como `400 VALIDATION_ERROR`, `details:[{field:"size", code:"too_big", message:<do Zod/custom "File exceeds the 4MB limit">}]` — exatamente o `field:"size"` do B5-D4, sem código novo na taxonomia. A constante órfã `MAX_FILE_SIZE` morre no mesmo diff.
- **Bucket**: `file_size_limit = 4194304` (mesmo número). Regra de nunca-ser-o-bucket: com rota e bucket no MESMO valor inclusivo, a rota recusa tudo que o bucket recusaria **antes** de tocar o Supabase — o bucket só barraria um caminho que não passe pela rota (não existe: só o service role escreve, e só via rota — pre-check §6). A igualdade exata na fronteira (4.194.304 aceito pelo bucket) é **verificada pelo probe de fronteira** (§8); se o Supabase tratar o limite como exclusivo (recusar o valor exato), o fallback declarado é subir o bucket para `4194305` — decisão operacional simples, registrada na validação, sem reabrir o desenho.
- **Interação com o 413 da plataforma (~4,5MB)**: arquivo de 4MB + overhead multipart ≈ 4,2MB < 4,5MB → **nosso 400 sempre chega primeiro** para arquivos até ~4,3MB; acima de ~4,5MB de corpo total o 413 text/plain da plataforma responde antes de a rota executar — rede de segurança já contratada (cláusula não-JSON), sem mudança.

### 3.2 Sequência segura de aplicação — **bucket PRIMEIRO, rota depois**

A mudança do bucket é global e imediata (não é por branch). As duas ordens, analisadas:

- **Rota primeiro**: entre o merge e a ação de console, a rota aceitaria 1–4MB e o bucket (ainda 1MB) recusaria → **500 na faixa nova** — reproduz exatamente o bug que o bloco mata, e o controle central (replay do P2: 2MB → 201) seria impossível de passar. Rejeitada.
- **Bucket primeiro**: entre a ação de console e o merge, prod com código velho passa a aceitar 1–4MB (rota velha permite 50MB, bucket novo permite 4MB) → **melhora estrita imediata**; a única sobra é 4–4,5MB → 500 (classe que já existia, faixa menor), que a rota nova fecha no merge. **Escolhida.**

**Sequência operacional da PR-1** (cada passo com registro):

1. PR-1 aberta, checkpoint (diff + testes) apresentado ao Marcel.
2. **Aval do checkpoint → Marcel executa a mudança do bucket** (instrução em 3.3), cola leitura-antes e leitura-depois.
3. Rodada de validação em preview (URL de branch) — inclui replay do P2, probe >4MB, fronteira exata (§8).
4. Merge → confirmação em prod.

Janela declarada do passo 2→4: prod aceita 1–4MB com código velho (benigno); 4–4,5MB segue 500 até o merge (status quo).

### 3.3 Instrução de console para o Marcel (texto exato, executar no passo 2)

SQL Editor do projeto Supabase (leitura-antes → mudança → leitura-depois; colar as três saídas no ciclo da PR):

```sql
-- leitura-antes
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'content-files';

update storage.buckets set file_size_limit = 4194304 where id = 'content-files';

-- leitura-depois (esperado: file_size_limit = 4194304; public e allowed_mime_types INALTERADOS)
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'content-files';
```

(Equivalente por Dashboard: Storage → `content-files` → Edit bucket → "Restrict file upload size" → 4194304 bytes / 4 MB. O SQL é canônico por deixar saída colável. **Só o `file_size_limit` muda** — `public: true` fica, B5-D3.)

---

## §4 — PR-2: magic bytes

### 4.1 Tabela de assinaturas (para a lista atual do `ALLOWED_UPLOADS`)

| MIME declarado | Assinatura exigida nos bytes | Notas |
|---|---|---|
| `application/pdf` | `%PDF-` (`25 50 44 46 2D`) no offset 0 | canônico da spec; os 94 objetos reais compatíveis começam assim |
| `image/png` | `89 50 4E 47 0D 0A 1A 0A` (8 bytes) no offset 0 | |
| `image/jpeg` / `image/jpg` | `FF D8 FF` no offset 0 | cobre JFIF/EXIF/raw |
| `application/vnd…wordprocessingml.document` (docx) | `PK 03 04` no offset 0 **E** a string ASCII `[Content_Types].xml` nos primeiros 4096 bytes | docx É zip — o `PK` sozinho não distingue do `.zip` renomeado (item 45b). Todo escritor OOXML real põe `[Content_Types].xml` como entrada inicial. **Limitação declarada**: um zip artesanal contendo essa entrada passa — o modelo de ameaça é consistência de dados de um app single-user, não adversário; registrado, não defendido |
| `text/plain` (txt) | **Heurística negativa**: NÃO casa com nenhuma assinatura binária da tabela **E** nenhum byte `0x00` nos primeiros 8192 bytes | txt não tem magic byte. Isso pega o caso real (binário renomeado `.txt`) e aceita qualquer texto (UTF-8, Latin-1). Fail-open declarado — pergunta **B5-D9** (§11) |

### 4.2 Onde vive

Módulo novo **`lib/file-signatures.ts`** (puro, sem I/O, ~60 linhas):

```
contentMatchesDeclaredMime(bytes: Uint8Array, declaredMime: string): { ok: true } | { ok: false; detected: string | null }
```

- Consumidor 1: **rota de upload**, imediatamente após o `mimeMatchesExtension` (checagem nº 7 da tabela do pre-check §3.1) e ANTES do upload ao Supabase — os bytes já estão em memória (`arrayBuffer`), custo zero de I/O extra.
- Consumidor 2: **reconciliação da PR-3** (relatório de mentirosos), lendo só os primeiros 8KB de cada objeto via Range GET na URL pública.
- Tabela de assinaturas no próprio módulo, ao lado de `ALLOWED_UPLOADS` conceitualmente (comentário cruzado nos dois arquivos: quem adicionar um tipo na lista DEVE adicionar assinatura — e o teste de paridade §8 trava isso mecanicamente).

### 4.3 Erro retornado (dentro da taxonomia fechada)

`400 VALIDATION_ERROR` com `details: [{ field: "file", code: "custom", message: "File content does not match declared type (<mime declarado>)" }]`.

Racional do `field:"file"`: o campo ofensor é o arquivo enviado (os bytes), não a declaração — `contentType` já é usado pelo mismatch extensão×MIME (pre-check §3.1, checagem 7) e manter os dois campos distintos deixa o cliente distinguir "renomeie o arquivo" de "esse arquivo não é o que você diz". Nenhum code novo, nenhum status novo — adição pura (§9).

### 4.4 Objetos já armazenados que mentem

**Nada é alterado nem deletado na PR-2.** O flip vale para uploads novos. Os legados são responsabilidade do **relatório da PR-3**, que anexa a cada objeto o veredito do sniffer (campo `mimeMismatch: true/false` + `detected`). Esperado conhecido: `1786295958275-ux-audit-fase-d-zip-renomeado.pdf` (zip armazenado como `application/pdf` — pre-check §2.2) — **o relatório DEVE encontrá-lo**, e isso vira controle positivo de graça do sniffer em dados reais (§8). O que mais aparecer, aparece no relatório; o destino de cada mentiroso (deletar junto com os órfãos, manter, re-tipar) entra no aval do O-1, não é decidido aqui.

---

## §5 — PR-3: listagem + reconciliação (modo relatório) + O-1

### 5.1 Contrato do endpoint de listagem

- **Rota**: `GET /api/storage/list`
- **Auth**: obrigatória, mesmo padrão das demais (Bearer verificado server-side); 401 = envelope `AUTH_REQUIRED`.
- **Rate limit**: família `storage` existente (60/h por uid) — a listagem é operação de manutenção/registro, não de palco; sem família nova.
- **Query params**: `prefix` (opcional, default `""`), `limit` (opcional, default 100, máx 1000), `offset` (opcional, default 0). Param inválido → `400 VALIDATION_ERROR` com `field` nomeando o param (schema Zod de query, mesmo padrão das rotas do B2).
- **Resposta 200**:
  ```json
  { "objects": [ { "path": "...", "size": 123, "contentType": "...", "createdAt": "...", "updatedAt": "..." } ], "count": <n desta página> }
  ```
  Paginação por página-curta (a API de list do Supabase não devolve total; o caller pagina até `count < limit` — declarado no doc).
- **Realidade do namespace, declarada por escrito**: o plano fala "prefixo do usuário", mas o bucket é FLAT (`<timestamp>-<nome>`, sem uid no caminho — pre-check §2.2). Em app single-user, a rota autenticada lista o bucket inteiro; `prefix` existe para futuro e para filtros. Namespace por usuário = redesenho de caminho, fora do B5, registrado no doc de storage como pendência do PRD nativo (§10).
- **Onde documenta**: **doc novo `docs/api/STORAGE.md`** (§6) — shapes de 2xx não pertencem ao CONTRATO-DE-ERRO.md (que rege não-2xx). Os erros da rota nova já nascem no envelope; nenhuma mudança no contrato de erro (§9).

### 5.2 Rotina de reconciliação

**Onde vive**: script no repo, `scripts/storage/reconcile.ts` (não é rota). Racional: precisa cruzar bucket × banco (service role) e produzir relatório para aval humano — superfície de API para isso seria rota de manutenção sem consumidor de produto, exatamente a classe que o B1.0 removeu. O script:

1. **Lista o bucket via `GET /api/storage/list`** (dogfooding: cada execução real exercita o endpoint novo, com auth de verdade);
2. Lê as refs do banco por PostgREST/service role (mesmas queries do pre-check §2.3 — `content.file_url`, `content.thumbnail_url`, `profiles.avatar_url`);
3. Cruza com a MESMA lógica do pre-check §2.4 (`parseRef` idêntico — portado do apêndice B, com teste unitário);
4. Para cada objeto, lê os primeiros 8KB (Range GET na URL pública) e roda o sniffer da PR-2;
5. Emite relatório: **órfãos tipo A** (com idade), **órfãos tipo B**, **casados**, **mentirosos de MIME**, totais — em JSON + resumo legível, escrito em path efêmero (padrão do guard de histórico da fase-d: nunca em `docs/`) e colado no prompt de aval.

**Critério de candidato a órfão**: objeto no bucket sem NENHUMA ref (mesma definição do pre-check) **E** `created_at` mais velho que a **idade mínima: 7 dias** (proposta; racional: um import em voo vira linha de `content` em segundos — 7 dias cobre com folga qualquer fluxo interrompido/retomado e qualquer janela de validação de PR; valor conservador para app de usuário único). Órfão mais novo que 7 dias aparece no relatório como "recente — fora da lista de remoção".

**Modos**:
- `--report` (default): **read-only estrito** — nenhum write em bucket ou banco.
- `--delete --lista <arquivo>`: recusa-se a rodar sem os DOIS argumentos. O `<arquivo>` é a lista nominal aprovada. Para cada nome: re-verifica no momento da deleção que (a) o objeto ainda existe, (b) continua sem ref (releitura do banco — guarda TOCTOU), (c) está na lista aprovada; só então chama **`POST /api/storage/delete`** (o primeiro consumidor de SISTEMA da rota — B5-D6), registrando status por arquivo. Ao final: recontagem do bucket com saldo esperado declarado antes.

### 5.3 O-1 — a limpeza gateada (B5-D2)

1. Primeira execução `--report` acontece **na validação da PR-3** e deve achar **exatamente 87 órfãos tipo A e 0 tipo B** (números registrados ANTES, no pre-check §2.4 — controle positivo de graça; qualquer outro número = investigação antes de prosseguir, porque ou o bucket mudou ou o script está errado).
2. Pós-merge da PR-3: execução `--report` fresca; a lista nominal completa (87 nomes, ou o que a execução fresca achar com a explicação de qualquer delta) + os mentirosos de MIME vão **verbatim no prompt de aval do O-1**.
3. Marcel aprova a lista (inteira ou recortada) → execução `--delete --lista` → saída por arquivo + recontagem final coladas no encerramento.
4. Sem aval, nada roda. O script não tem modo "delete tudo".

---

## §6 — Contratação por escrito do modelo de entrega (B5-D3)

**Onde vive**: `docs/api/STORAGE.md` (doc novo, criado na PR-3 — junto do contrato da listagem; assim o doc nasce completo em um commit, não em fatias). O CONTRATO-DE-ERRO.md não é tocado por isto (entrega é semântica de 2xx/arquitetura, não de erro).

**Rascunho da cláusula** (para lapidação no ciclo da PR-3):

> ## Modelo de entrega de arquivos (contratado no B5, 2026-08)
>
> 1. O bucket `content-files` é **público por contrato** (não por acidente): `content.file_url` é uma URL pública estável do Supabase Storage, servida sem autenticação. Consumidores diretos: viewer e cache offline do web.
> 2. O **proxy autenticado** (`GET /api/proxy?url=`) é o caminho do modo performance (palco): auth + rate limit (família `proxy`), resposta streamada com headers saneados.
> 3. Consequências assumidas: quem tem uma `file_url` lê o arquivo sem credencial; a URL é permanente enquanto o objeto existir; rotação de visibilidade do bucket é **mudança de contrato** — decisão reservada ao PRD do nativo (Bloco C), não a nenhum fix.
> 4. Upload: `POST /api/storage/upload`, teto **4MB** (4.194.304 bytes, inclusivo) alinhado em rota e bucket; tipos permitidos = `ALLOWED_UPLOADS` com verificação de assinatura de conteúdo (magic bytes). Delete: `POST /api/storage/delete`, interno/tooling — sem consumidor de UI, por decisão (B5-D6). Listagem: `GET /api/storage/list` (contrato acima neste doc).
> 5. Namespace do bucket é flat (`<timestamp>-<nome>`); não há prefixo por usuário — registrado como pendência de modelagem multiusuário do PRD nativo.

---

## §7 — Proxy × objeto sumido — PERGUNTA DE DECISÃO (não decidida aqui)

Ver **B5-D7** no §11. Estado medido (pre-check §5): upstream responde **400** com corpo `{"statusCode":"404","code":"NoSuchKey",…}`; nosso ramo `404→notFound()` é inerte; cliente vê **500**.

- **Custo de ENTRAR no B5**: mapear o caso exige ler o CORPO do upstream (o status não distingue) — acopla nosso proxy ao shape de erro interno do Supabase, que não é contrato deles; um shape novo do upstream silenciosamente reverte o mapeamento; e o cenário hoje é inatingível por dados (0 órfãos tipo B, §2.4) e a reconciliação do próprio bloco existe para mantê-lo assim. Custo real: parsing frágil + um flip a mais para validar num bloco já com três.
- **Custo de FICAR FORA**: se um dia um objeto sumir (deleção manual no console, por exemplo), o palco recebe 500 genérico — indistinguível de pane — até a reconciliação seguinte apontar o órfão B. O aval do B3 PR-4 já classificou a distinção como "evolução de contrato (code novo ou mapeamento por corpo), não bugfix".
- **Recomendação**: **fora do B5**, registrado no encerramento como evolução futura de contrato (candidata a nascer junto do cliente nativo, que é quem daria uso ao 404). Decisão do Marcel.

---

## §8 — Controles da Regra nº 7, por item

Convenções: preview = URL de branch (`octavia-git-b5-pr<N>-…`); prod = `octavia-git-main-…` (leitura; escrita só onde declarado, sempre restaurada com saldo zero); todo probe de escrita com leitura-antes; zero retries.

| PR | Controle | Momento | Alvo | O que registra |
|---|---|---|---|---|
| PR-0 | — (docs-only; CI verde) | merge | CI | — |
| PR-1 | **it.fails→it do guard novo**: teste de contrato "size 5MB → 400 field:'size' too_big" escrito como `it.fails` contra o schema atual (50MB aceita), vira `it` no mesmo diff do flip | unit, no checkpoint | suíte | o literal do 400 novo |
| PR-1 | **Fronteira exata**: upload de 4.194.304 bytes → 201 (e delete); upload de 4.194.305 → 400 `field:"size"` | validação, pós-mudança do bucket | preview | statuses + corpos literais; se o 4.194.304 der 500, dispara o fallback declarado (§3.1: bucket 4194305) |
| PR-1 | **Replay do P2** (pre-check §4.2): txt de 2MB → **201** (e delete, saldo zero) — prova de que a faixa morta 1–4MB abriu | validação, pós-bucket | preview E prod (a abertura da faixa é efeito do bucket, global) | corpo do 201 + prova de restauração |
| PR-1 | **P1-contraste do guard**: probe de 4,2MB no MESMO instante — branch → **400 `field:"size"`** × prod (código velho, bucket novo) → **500** | validação, pré-merge | branch × prod | os dois literais lado a lado (controle negativo AO VIVO — padrão do aval do B3 PR-3b) |
| PR-2 | **Tabela de assinaturas em unit** (positivo+negativo por tipo): pdf/png/jpg reais mínimos, `PK` sem `[Content_Types]` declarado docx → falha, zip-como-pdf → falha, binário-como-txt (com NUL) → falha, txt Latin-1 → passa | unit, no checkpoint | suíte | resultados |
| PR-2 | **Teste de paridade lista×assinaturas**: para cada MIME de `ALLOWED_UPLOAD_MIMES`, existe regra no sniffer — quebra a build se alguém adicionar tipo sem assinatura | unit, permanente | suíte | invariante travado |
| PR-2 | **Replay do P1** (pre-check §3.3): `this is not a png` declarado `image/png` → **400 `field:"file"`** | validação | preview | corpo literal |
| PR-2 | **P1-contraste**: o MESMO probe, mesmo instante — branch → 400 × **prod → 201** (restaurado na hora com delete + prova de saldo zero, como no pre-check) | validação, pré-merge | branch × prod | os dois literais; registro da restauração do 201 de prod |
| PR-2 | **Controle de não-falso-positivo**: upload de PDF real pequeno → 201 (e delete) | validação | preview | prova de que arquivo legítimo passa |
| PR-3 | **Controle negativo da rota nova**: gate da listagem rodado contra prod SEM a rota → 404 HTML do Next (padrão B1.0); contra o branch → 200 com shape | validação, pré-merge | prod × branch | statuses |
| PR-3 | **Contract tests da rota**: 401 sem auth; 400 `field:"limit"` com param inválido; shape do 200 | unit + preview | suíte + preview | literais |
| PR-3 | **Primeira reconciliação `--report`**: DEVE achar **87 tipo A, 0 tipo B** (números do pre-check §2.4, registrados antes) **E** apontar `zip-renomeado.pdf` como mentiroso de MIME (§2.2) — controle positivo duplo de graça; qualquer delta trava e vira investigação | validação | bucket vivo (read-only) | relatório íntegro colado |
| O-1 | **Gate humano**: lista nominal verbatim no prompt de aval; `--delete` re-verifica cada nome (existe + segue órfão) no instante da deleção; recontagem final com saldo esperado declarado ANTES | pós-merge, sob aval | bucket vivo | saída por arquivo + recontagem |

---

## §9 — Tabela de impacto no CONTRATO-DE-ERRO.md (append-only)

| # | Mudança | Classificação contra o contrato | Veredito |
|---|---|---|---|
| 1 | Upload >4MB → `400 VALIDATION_ERROR` `field:"size"` `code:"too_big"` | Item novo de `details` numa classe existente; nenhum code/status novo | **Adição** — permitida |
| 2 | Upload com bytes≠MIME → `400 VALIDATION_ERROR` `field:"file"` `code:"custom"` | Idem | **Adição** — permitida |
| 3 | Upload 2MB: 500 → **201** | O 500 nunca foi resposta contratada para esse input (era catch-all de dependência); caminho feliz aberto | **Correção declarada** com rito do PR-3a do B3 (`it.fails` com o literal do 500 antes do flip, onde reproduzível em unit via mock do erro do Supabase) |
| 4 | Upload 4–4,5MB: 500 → **400** | Mudança de classe para um input específico | **Mudança semântica declarada** — mesmo rito (it.fails→it + P1-contraste do §8); dentro do espírito append-only porque nenhum code muda de significado |
| 5 | Rota nova `GET /api/storage/list` | Rota nova falando o envelope em 401/400/429/500 | **Adição** — o contrato de erro não muda; a linha da rota entra na tabela re-medida do encerramento |
| 6 | Meia-linha "campos adicionais por code" na seção Envelope | Cosmética já sancionada (aval do B3 PR-0) | **Adição de texto** (PR-0) |
| 7 | `docs/api/STORAGE.md` novo (entrega, listagem, limites, delete) | Doc novo; 2xx não é regido pelo contrato de erro | **Fora do contrato de erro**; docs independentes, sem link obrigatório. |
| 8 | Proxy (objeto sumido) | **Nenhuma mudança neste bloco** (pende B5-D7) | — |

Nada no bloco remove, renomeia ou re-significa code/status existente — **zero exceções ao append-only necessárias**.

---

## §10 — Riscos e o que fica explicitamente de fora

| Item | Estado | Registro |
|---|---|---|
| **Reorder sem guard de 1MB** (pre-check, divergência 5) | **FORA do B5** | Candidato a housekeeping de rota; coberto pelo 413 da plataforma enquanto isso |
| **Delete de content → objeto órfão** (cascata) | **ADIADO (B5-D6)** | Motivo registrado: a duplicata real `97256d70`/`13303251` → mesma `file_url` (pre-check §2.4) prova que cascata ingênua deletaria o arquivo da linha sobrevivente. Encaminhamento proposto (sem decidir): o PRD nativo modela posse do arquivo (1:1 com refcount, ou tabela de arquivos própria); até lá, a reconciliação periódica é o mecanismo de higiene |
| **Bucket público × privado/URL assinada** | **Bloco C** (B5-D3) | O B5 contrata o modelo atual por escrito (§6); a revisão é decisão de PRD |
| **Busca (LIB-04)** | **Bloco próprio** (B5-D1; B11 proposto) | Stub criado no PR-0 |
| **Revogação do bypass secret** | **B9** (B5-D5) | Registrada no encerramento do B5 com ponteiro |
| **Namespace por usuário no bucket** | Fora; registrado no STORAGE.md | Bucket flat é realidade medida (§2.2); mudança é modelagem multiusuário |
| **Risco: janela bucket-first** (§3.2) | Aceito, declarado | Prod aceita 1–4MB com código velho entre console e merge — melhora estrita; 4–4,5MB segue 500 até o merge |
| **Risco: fronteira do `file_size_limit`** (inclusivo/exclusivo no Supabase) | Coberto por probe + fallback (§3.1) | Se exclusivo: bucket vai a 4194305; registrado na validação |
| **Risco: acoplamento do sniffer a tipos futuros** | Coberto pelo teste de paridade (§8) | Tipo novo sem assinatura não compila a suíte |
| **Risco: relatório ≠ 87** na primeira reconciliação | Trava declarada (§8) | Investigação antes de qualquer prosseguimento; nenhum delete automático em nenhum cenário |

---

## §11 — Perguntas de decisão (com recomendação; a decisão é do Marcel)

- **B5-D7 — Proxy × objeto sumido entra no B5?** Mapear upstream-400-com-corpo-`NoSuchKey` → nosso `404 NOT_FOUND`, ou manter 500 e registrar como evolução futura. Custos dos dois lados no §7. **Recomendação: FORA do B5** — cenário inatingível por dados hoje (0 órfãos B), a reconciliação deste bloco o mantém assim, e o mapeamento exigiria parsear corpo de erro não-contratado do Supabase. Registrar no encerramento como evolução de contrato pareada com o cliente nativo.
- **B5-D8 — Nome/número do bloco da busca**: a seção-stub criada no PR-0 precisa de número. **Recomendação: B11** (próximo livre após o B10 do plano), título "B11 — Busca (LIB-04)". Alternativa: nome sem número ("Bloco Busca") se o Marcel preferir não estender a numeração.
- **B5-D9 — Política do `text/plain`**: txt não tem assinatura; a proposta é heurística negativa (não casa com assinatura binária conhecida E sem byte `0x00` nos primeiros 8KB) — pega binário renomeado, aceita qualquer texto real (UTF-8/Latin-1), e é declaradamente fail-open para texto exótico. Alternativas: (a) exigir UTF-8 válido (rejeitaria Latin-1 legítimo), (b) nenhuma checagem para txt (mantém o furo para binários renomeados `.txt`). **Recomendação: a heurística proposta** — melhor razão custo/furo para app single-user.
