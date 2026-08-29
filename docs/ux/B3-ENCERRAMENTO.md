# B3 — Encerramento: contrato de erro estruturado

> **Data**: 2026-08-29 · Bloco executado em 6 PRs (#242–#247), 2026-08-28 →
> 2026-08-29. Contrato: [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md).
> Ciclo: [`B3-PRECHECK.md`](B3-PRECHECK.md) (medição) →
> [`B3-DESENHO.md`](B3-DESENHO.md) (aprovado com emendas) → execução com
> gate-keeping total (regra nº 7 em toda mudança; validação por URL de
> branch — D0; replay verbatim dos fluxos vivos; confirmação em prod).
>
> Este documento é a **tabela re-medida** que fecha o bloco — o espelho da
> tabela-mestre do pre-check (§2), agora uniforme — e o balanço final.

---

## 1. Tabela re-medida — rota × classe × literal `[medido]`

Alvo: `octavia-git-b3-pr4-final-…vercel.app` (URL de branch, D0), medição
de 2026-08-29 na validação do PR-4. Toda linha é saída literal de
requisição real. **Fecha a lacuna do pre-check §2.5**: as classes
cross-user do add-song, não mapeadas lá, estão nas linhas do
`/api/setlists/[id]/songs` (alheio ≡ inexistente por construção — query
filtrada por `user_id`; byte-identidade em gate).

| Rota | Classe | Status | Corpo literal `[medido]` |
|---|---|---|---|
| `/api/content GET` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` |
| `/api/content POST` | 400 validação (field real) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"title","message":"Required","code":"invalid_type"}]}` |
| `/api/content POST` | 400 D7 (2 chaves) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"__b3_x__","message":"Unrecognized key: '__b3_x__'","code":"unrecognized_keys"},{"field":"__b3_y__","message":"Unrecognized key: '__b3_y__'","code":"unrecognized_keys"}]}` |
| `/api/content POST` | 400 corpo >1MB (guard, decisão B) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"","message":"Invalid request body format","code":"invalid_type"}]}` |
| `/api/content PUT` | 404 inexistente-ou-alheio | 404 | `{"error":"Content not found","code":"NOT_FOUND"}` |
| `/api/content DELETE` | 400 id malformado | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"id","message":"Invalid ID format","code":"invalid_string"}]}` |
| `/api/content/[id] GET` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` |
| `/api/content/[id] GET` | 400 id malformado | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"id","message":"Invalid ID format","code":"invalid_string"}]}` |
| `/api/content/[id] GET` | 404 inexistente-ou-alheio | 404 | `{"error":"Content not found","code":"NOT_FOUND"}` |
| `/api/setlists GET` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` |
| `/api/setlists POST` | 401 (middleware) | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` + `WWW-Authenticate: Bearer` |
| `/api/setlists POST` | 400 validação | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"name","message":"Required","code":"invalid_type"}]}` |
| `/api/setlists POST` | 400 posse de songs | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"songs","message":"One or more content_id do not exist or do not belong to the user","code":"custom"}]}` |
| `/api/setlists/[id] GET` | 400 id malformado | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"id","message":"Invalid ID format","code":"invalid_string"}]}` |
| `/api/setlists/[id] DELETE` | 400 id malformado | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"id","message":"Invalid ID format","code":"invalid_string"}]}` |
| `/api/setlists/[id] GET` | 404 inexistente-ou-alheia | 404 | `{"error":"Setlist not found","code":"NOT_FOUND"}` |
| `/api/setlists/[id] PUT` | 404 inexistente-ou-alheia | 404 | `{"error":"Setlist not found","code":"NOT_FOUND"}` |
| `/api/setlists/[id]/songs POST` | 404 setlist inexistente-ou-alheia *(era 500; lacuna §2.5)* | 404 | `{"error":"Setlist not found","code":"NOT_FOUND"}` |
| `/api/setlists/[id]/songs POST` | 404 content inexistente-ou-alheio *(era 500)* | 404 | `{"error":"Content not found","code":"NOT_FOUND"}` |
| `/api/setlists/songs/[songId] PUT` | 404 inexistente-ou-alheio | 404 | `{"error":"Song not found","code":"NOT_FOUND"}` |
| `/api/setlists/songs/[songId] PUT` | 400 validação (1-based) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"newPosition","message":"newPosition must be >= 1 (positions are 1-based)","code":"too_small"}]}` |
| `/api/setlists/songs/[songId] DELETE` | 404 inexistente-ou-alheio | 404 | `{"error":"Song not found","code":"NOT_FOUND"}` |
| `/api/profile GET` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` |
| `/api/profile PATCH` | 400 validação (website) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"website","message":"Invalid url","code":"invalid_string"}]}` *(re-medido após expirar a janela de profile queimada pelo G2b — colisão registrada abaixo)* |
| `/api/profile PATCH` | 400 D7 (1 chave) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"__b3_unknown__","message":"Unrecognized key: '__b3_unknown__'","code":"unrecognized_keys"}]}` |
| `/api/profile GET/PATCH` | 429 escopo user *(bônus: colisão com o estouro do G2b — D4 vivo)* | 429 | `{"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":806}` |
| `/api/auth/session POST` | 401 token inválido (mensagem própria, exceção §2.4) | 401 | `{"error":"Invalid or expired token","code":"AUTH_REQUIRED"}` |
| `/api/auth/session POST` | 400 validação | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"idToken","message":"Required","code":"invalid_type"}]}` |
| `/api/auth/session POST` | 400 JSON inválido (sintética, field:"") | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"","message":"Invalid request body format","code":"invalid_type"}]}` |
| `/api/auth/session DELETE` | 429 escopo ip (D4) | 429 | `{"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":834}` + `Retry-After: 834` · `X-RateLimit-Limit: 30` · `X-RateLimit-Remaining: 0` · `X-RateLimit-Reset: 1788033420083` · `X-RateLimit-Scope: ip` |
| `/api/storage/upload POST` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` |
| `/api/storage/delete POST` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` |
| `/api/storage/delete POST` | 400 traversal | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"filename","message":"Invalid filename: path traversal detected","code":"custom"}]}` |
| `/api/proxy GET` | 401 | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` + `WWW-Authenticate: Bearer` |
| `/api/proxy GET` | 400 url ausente | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"url","message":"Missing url","code":"invalid_type"}]}` |
| `/api/proxy GET` | 400 host não permitido | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"url","message":"URL not allowed. Configure ALLOWED_PROXY_HOSTS.","code":"invalid_string"}]}` |
| `/api/proxy GET` | upstream !ok≠404 normalizado (decisão A; upstream real respondeu 400) | 500 | `{"error":"Internal server error","code":"INTERNAL_ERROR"}` |
| `/api/debug/config GET` | 404 em build de produção | 404 | `{"error":"Not available in production","code":"NOT_FOUND"}` |

**Classes 429 e a G2 nova**: primeira provocação do ciclo pós-guarda,
executada pelo próprio spec do G2 — **a allowlist avaliou e ACEITOU a URL
de branch** (primeira execução da guarda no papel para o qual nasceu; a
recusa contra git-main foi provada no G0/PR-0). G2b verde com o assert
novo do D4 (`body.code === 'RATE_LIMITED'`) nos dois escopos. Família da
captura literal: `session-delete` (ip 30/15min — sem auth, sem write, a
mais barata; racional no relatório). Nenhuma provocação fora do branch.

### Linhas não-JSON — confirmadas como estão (cláusula do contrato)

Conforme a **cláusula não-JSON** do [`CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md)
("não-2xx cujo corpo não parseia como o envelope = erro genérico, sem
retry automático"), estas três respostas vêm de fora dos handlers e
**permanecem fora do envelope, por decisão (D5)**:

| Caso `[medido]` | Status | Resposta real |
|---|---|---|
| `PATCH /api/content` (método não suportado) | 405 | corpo vazio, sem content-type, sem `Allow` (default do framework) |
| `GET /api/rota-inexistente-b3` | 404 | página HTML do Next (`text/html`) |
| `POST /api/content` corpo 6MB | 413 | `text/plain`: `Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE gru1::…` (plataforma Vercel) |

---

## 2. Balanço do bloco

**De onde partiu** (pre-check, 2026-08-28): ~6 idiomas de aplicação + 2
defaults de framework construindo erro; `code` presente numa minoria das
respostas; 401 em 5 shapes; 400 de validação em 3; 429 sem `code`; 403
vazando existência; 500 em inexistente/malformado (22P02, PGRST116);
dois pontos interpolando `error.message` de dependência na resposta
(um deles não mapeado pelo pre-check — achado do PR-2); proxy em texto
puro; zero testes olhando o envelope.

**Onde chegou**: **UM ponto único** (`lib/api-errors.ts`, taxonomia
fechada de 5 codes com status derivado — par inconsistente não compila) e
**7/7 idiomas falando o contrato**; toda classe alcançável na tabela
acima com `code`; sem oráculo de existência em nenhuma rota (D2, com
byte-identidade em gate); os dois vazamentos da classe D6 mortos com
sentinela; guard de 1MB uniforme; D7 pleno (um detail por chave);
`retryAfter` + 5 headers no 429 com `code`.

**As PRs**: PR-0 #242 (contrato + G2 allowlist + emendas) · PR-1 #243
(núcleo + delegação byte-idêntica + D6) · PR-2 #244 (content/storage +
guard + morte do validation-utils + errata §2.9) · PR-3a #245 (semântica:
D2, PGRST116→404, paridade 400) · PR-3b #246 (flip do D7 + envelope
mecânico) · PR-4 #247 (D4 + proxy + add-song + mortes + este doc).

**Suíte**: 511 → **570 passed** (+59, todos de contrato de erro; 86
skipped). Mortes: `lib/validation-utils.ts` inteiro (291 linhas),
`withSecureAuth`, o flag temporário do D7, dois testes que codificavam
defeitos (assert do vazamento; nome-mentiroso do 404).

**Decisões executadas**: D0 (alias aposentado; G2 allowlist — negativo E
aceitação provados) · D1 (envelope flat) · D2 (404 em tudo) · D3
(taxonomia de 5) · D4 (429 com code) · D5 (recorte não-JSON + proxy
envelopado com details) · D6 (vazamentos ×2) · D7 (por chave, flag morto)
· D8 (fora do B3 — registrado no Bloco D).

**Método consolidado no ciclo**: regra de varredura (comando + saída
colada, senão não é medição — nascida da errata §2.9) · P1-contraste
(controle negativo AO VIVO branch × prod para flips) · leitura-antes de
toda escrita · it.fails→it como controle negativo codificado.

**Dois registros do aval de merge do PR-4**:

1. **Ramo possivelmente inerte da decisão A**: o Supabase Storage
   sinaliza objeto inexistente com **400** (medido na validação) — logo
   "objeto sumido" no proxy responde o nosso **500**, e o ramo
   `upstream 404 → NOSSO 404` pode nunca disparar com o upstream atual.
   Distinguir "sumido" de "falha de upstream" um dia é **evolução de
   contrato** (code novo ou mapeamento por corpo do upstream), não
   bugfix.
2. **Flake de tooling, fora do B3**: o teste
   `tests/performance/performance-mode-responsiveness.test.tsx > rapid
   navigation` falhou **3× no ciclo** (timing sob carga do runner; 2×
   local, 1× no CI de um commit só-markdown — prova de flake). Candidato
   a item de tooling (threshold/retry/isolamento), registrado.

**Sai do bloco / fica registrado**: **D8** (loop mudo do session) é o
item de abertura do Bloco D · consumo do contrato pela UI web (Bloco D —
a web segue lendo só `.error`, que continua string em tudo) · a camada de
rede central do NATIVO nasce consumindo este contrato (`code` para i18n
pt-BR — GLOB-01) · nota cosmética pendente de PR futuro (aval do PR-0):
meia-linha na seção Envelope do contrato sobre codes que declaram campos
adicionais (caso do `retryAfter`) · confirmação do D4 em prod é indireta
(sem provocação de 429 em prod, por guarda; o código é o mesmo do branch
e o corpo tem contract test — limitação declarada no registro).
