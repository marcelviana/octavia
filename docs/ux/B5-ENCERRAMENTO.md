# B5-ENCERRAMENTO.md

> **Data**: 2026-08-31 · Bloco executado em 5 PRs (#248–#252, 2026-08-30 → 2026-08-31) + 1 operação gateada (O-1, sem commit).
> Ciclo: [`B5-PRECHECK.md`](B5-PRECHECK.md) (medição, `60b47ee`) → [`B5-DESENHO.md`](B5-DESENHO.md) (aprovado; versionado no PR-0) → execução com gate-keeping total (Regra nº 7 em todo flip; it.fails→it com os dois commits na branch; P1-contraste branch × prod ao vivo; validação por URL de branch; confirmação em prod; leitura-antes e saldo zero em todo probe de escrita; merge sempre do Marcel).
> Contratos tocados: [`docs/api/STORAGE.md`](../api/STORAGE.md) (novo) · [`docs/api/CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md) (meia-linha cosmética; zero exceções ao append-only no bloco inteiro).

---

## 1. Sumário do bloco

**Escopo (B5-D1)**: storage apenas — a busca (LIB-04) saiu para bloco próprio (**B11**, stub no plano desde o PR-0). O bloco pegou o storage que o pre-check mediu como terra de ninguém — bucket público por acidente com limite de 1MB não registrado, 92,5% de órfãos, zero verificação de conteúdo, teto de rota que mentia 50MB, nenhuma listagem — e o entregou **contratado por escrito, verificado por assinatura, com teto único honesto, listável e reconciliado**.

**O que entrou em produção**:

| Entrega | PR / operação | Commit na main |
|---|---|---|
| Rotulagem B4/B5 resolvida por nota de equivalência; B11 criado; CLAUDE.md corrigido (Supabase Storage); meia-linha do contrato; desenho versionado | PR-0 (#248) | `9a7e792` (2026-08-30) |
| **Teto único 4MB** (4.194.304 bytes, inclusivo) em schema + bucket (`file_size_limit` 1048576→4194304, SQL de console do Marcel com leitura antes/depois validada); `MAX_FILE_SIZE` órfão morto; faixa morta 1–4MB **aberta** | PR-1 (#249) | `b690f5c` (2026-08-30) |
| **Magic bytes**: `lib/file-signatures.ts` (pdf/png/jpeg/jpg/docx/txt) + recusa `400 field:"file"` na rota de upload, antes do Supabase; paridade lista×assinaturas travada em teste | PR-2 (#250) | `9b5a4b2` (2026-08-30) |
| **`GET /api/storage/list`** (auth, família `storage`, paginação página-curta) + **`scripts/storage/reconcile.ts`** (`--report` read-only / `--delete --lista` gateado) + **`docs/api/STORAGE.md`** com a cláusula B5-D3 | PR-3 (#251) | `0f0e5b6` (2026-08-30) |
| **Fix do docx** (B5-D10): `[Content_Types].xml` buscado no arquivo inteiro — 20 docx reais deixaram de ser recusados no upload | PR-2b (#252) | `f9ebf23` (2026-08-31) |
| **O-1**: 87 órfãos removidos (85 via rota + 2 via console, exceção registrada); bucket **94 → 7**, 0 órfãos, 0 mentirosos | operação (2026-08-31) | sem commit |

---

## 2. Decisões B5-D1…D11 — estado final

| Decisão | Conteúdo | Estado final |
|---|---|---|
| **D1** | Escopo = storage; busca vira bloco próprio | ✅ Executada (PR-0: notas de rotulagem + B11 + tabela-resumo) |
| **D2** | Órfãos só via reconciliação; remoção gateada com lista nominal + aval | ✅ Executada (O-1: lista de 87 aprovada verbatim; TOCTOU por arquivo; **UMA exceção registrada** — §4) |
| **D3** | Bucket permanece PÚBLICO, modelo contratado por escrito | ✅ Executada (STORAGE.md, cláusula do modelo de entrega; revisão público×privado reservada ao PRD do Bloco C) |
| **D4** | Teto único 4MB em três camadas, bucket-first | ✅ Executada (PR-1; fronteira **inclusiva provada** — 4.194.304→201, fallback do desenho §3.1 não foi necessário) |
| **D5** | Bypass secret: revogação só no B9 | 📌 Registrada (§5; inventário de usos no pre-check §7) |
| **D6** | Delete fica tooling/interno; primeiro consumidor de sistema = reconciliação; cascata do delete de content ADIADA | ✅ Executada na parte viva (O-1: 85 deleções de sistema pela rota) · 📌 cascata registrada (§5) |
| **D7** | Proxy × objeto sumido FORA do B5 | 📌 Registrada (§5; evidência no pre-check §5 — upstream 400 `NoSuchKey` → nosso 500, ramo 404 inerte) |
| **D8** | Bloco da busca numerado B11 | ✅ Executada (PR-0) |
| **D9** | Heurística do txt (sem NUL + sem assinatura binária), limitação UTF-16 declarada | ✅ Executada (PR-2; a limitação está em comentário E em teste — UTF-16LE+BOM recusado) |
| **D10** | Regra do docx: `PK 03 04` no offset 0 E `[Content_Types].xml` em QUALQUER ponto do arquivo | ✅ Executada (PR-2b; a premissa "entrada inicial/4096 bytes" do desenho §4.1 foi derrubada por medição — §6) |
| **D11** | Assimetria de espaço upload×delete: upload passará a sanitizar espaço → `_`; delete permanece estrito | 🔜 **Direção fixada, execução FORA do B5** (housekeeping futuro, candidata a entrar com o B6). Consequência aceita e registrada: o casado `1750171474983-Easy - Guitar.pdf` permanece **indeletável pela rota**; se um dia precisar sair, o caminho é console com exceção registrada (precedente do O-1) |

---

## 3. Tabela re-medida — rota × classe × literal

Toda linha `[medido]` é saída literal de confirmação em prod pós-merge da PR indicada (nada re-medido para este documento). **Δ** marca o que MUDOU no bloco.

| Rota | Classe | Status | Literal / fonte | Δ |
|---|---|---|---|---|
| `upload POST` | 401 sem credencial · 400 sem arquivo · 400 traversal (delete) | 401/400 | Inalterados desde o B3 — tabela do [`B3-ENCERRAMENTO.md`](B3-ENCERRAMENTO.md) + rodapé (upload-400 re-medido lá) | — |
| `upload POST` | arquivo ≤4MB válido | 201 | `{"path":"1788103671954-b5-pr1-prod-p2.txt","size":2097152,…,"success":true}` [PR-1 prod, 2026-08-30] | **Δ 500→201** na faixa 1–4MB (pre-check §4.2: 2MB era 500) |
| `upload POST` | fronteira exata 4.194.304 | 201 | `{"size":4194304,…}` [PR-1, preview — único alvo; inclusividade do bucket provada aqui] | novo |
| `upload POST` | >4MB (4.404.019) | 400 | `{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"size","message":"File exceeds the 4MB limit","code":"too_big"}]}` [PR-1 prod, 2026-08-30] | **Δ 500→400** em 4–4,5MB (contraste ao vivo: prod-velho 500 no mesmo instante) |
| `upload POST` | corpo ≥~4,5MB | 413 text/plain | Plataforma — cláusula não-JSON do contrato (B3); não re-medido | — |
| `upload POST` | bytes ≠ MIME declarado | 400 | `{"…","details":[{"field":"file","message":"File content does not match declared type (image/png)","code":"custom"}]}` [PR-2 prod, 2026-08-30] | **Δ 201→400** (o P1 do pre-check §3.3 era 201; contraste ao vivo registrou o 201 de prod restaurado) |
| `upload POST` | docx-formato-batch (Content_Types no fim) | 201 | `{"path":"1788182069779-b5-pr2b-prod-replay.docx","size":9011,…}` [PR-2b prod, 2026-08-31] | **Δ 400→201** (regressão da PR-2 sobre docx não-Word, achada pela reconciliação e corrigida) |
| `upload POST` | arquivo legítimo (não-falso-positivo) | 201 | PDF real 201 [PR-2 prod] · txt UTF-8 201 [PR-2 preview] | — |
| `delete POST` | filename da convenção, objeto existente | 200 | 85× `200 {"success":true,"filename":…}` [O-1, 2026-08-31] — primeiro uso de sistema em volume | — |
| `delete POST` | filename com ESPAÇO | 400 | `{"…","details":[{"field":"filename","message":"Invalid filename format…` [O-1 lote 1] | achado → **B5-D11** |
| `list GET` (nova) | rota | 200 | `{"objects":[{"path":"1750165612008-Easy - Guitar.pdf","size":138916,"contentType":"application/pdf",…}],"count":1}` [PR-3 prod, 2026-08-31] | **Δ nova** (controle negativo pré-merge: 404 HTML do Next em prod) |
| `list GET` | 401 sem auth | 401 | `{"error":"Authentication required","code":"AUTH_REQUIRED"}` [PR-3 prod] | nova |
| `list GET` | param inválido | 400 | `{"…","details":[{"field":"limit","message":"Expected number, received nan","code":"invalid_type"}]}` [PR-3 prod] | nova |
| `list GET` | paginação | 200 | 50+44=94, página curta encerra [PR-3, preview] | nova |
| `proxy GET` | todas as classes | — | **Inalterado no bloco** (B5-D7 fora); objeto sumido segue 500 (pre-check §5, ramo 404 inerte) — registrado no §5 | — |

---

## 4. O-1 — balanço integral (2026-08-31)

- **Lista nominal**: 87 nomes, aprovada verbatim pelo Marcel na Fase A (relatório fresco pré-nomeação: 94/87A/0B/8/1/1 — zero delta contra o baseline).
- **Execução em dois lotes** (restrição operacional adicionada ao desenho pelo revisor: família `storage` é 60/h): lote 1 (45 nomes, 14:34 UTC) → **43 DELETADO / 0 PULADO / 2 FALHOU-400**; lote 2 (42 nomes, 15:41 UTC, 67min após a primeira deleção) → **42/42 DELETADO**. Saídas por arquivo íntegras nos registros do ciclo. **Zero 429** — o plano de lotes segurou. Zero guardas TOCTOU disparadas.
- **EXCEÇÃO REGISTRADA à B5-D2**: os 2 FALHOU (`1750165612008-` e `1750167601323-Easy - Guitar.pdf`, nomes com espaço) saíram pelo **console** (Dashboard, ação do Marcel), com leitura-antes (9, ambos presentes), leitura-depois (7, ambos ausentes) e HEAD público 400 ×2 colados. **Causa**: a regex da convenção em `app/api/storage/delete/route.ts:46` recusa espaço, que o upload preserva (`route.ts:56`) → **B5-D11**.
- **Aritmética**: 94 − 43 = 51 ✓ · 51 − 42 = 9 ✓ · 9 − 2 = 7 ✓. **Total: 85 via rota + 2 via console = 87.** Zero escritas em tabela.
- **Estado-baseline do bucket** (relatório final, 16:16 UTC — referência para qualquer reconciliação futura):
  ```
  { "objetos": 7, "refs": 9, "orfaosA": 0, "orfaosB": 0, "casados": 8,
    "foraDoStorage": 1, "mentirososDeMime": 0, "mimeNaoAvaliavel": 0 }
  ```
  Os 7 objetos referenciados (8 refs — a duplicata `97256d70`/`13303251` compartilha `1786295884124-ux-audit-fase-d-offline.pdf`) servem 200 no HEAD público, um a um. O mentiroso real do item 45b (`zip-renomeado.pdf`) saiu como órfão no lote 2.

---

## 5. Registros para blocos futuros

| Registro | Destino | Fonte |
|---|---|---|
| **Revogação do bypass secret** (B5-D5) | **B9** — o último bloco que o usa documenta o procedimento | Inventário de usos: pre-check §7 (`scripts/ux-audit/auth.ts`, `tests/ux-audit/auth.setup.ts`, `playwright.ux-audit.config.ts`) |
| **Proxy × objeto sumido** (B5-D7) | Evolução de contrato **pareada com o cliente nativo** (code novo ou mapeamento por corpo do upstream) — não é bugfix | Pre-check §5 (upstream 400 `NoSuchKey` → nosso 500); aval do B3 PR-4 |
| **B5-D11** (espaço: upload sanitiza → `_`, delete estrito) | Housekeeping futuro, **candidata a entrar com o B6** | O-1 (2 FALHOU-400); `delete/route.ts:46` × `upload/route.ts:56`; casado com espaço remanescente |
| **Delete de content NÃO remove o objeto** (cascata adiada, B5-D6) | Modelagem de posse do arquivo no **PRD nativo**; até lá, a **reconciliação periódica** (`--report`) é o mecanismo de higiene | Motivo: a duplicata `97256d70`/`13303251` → mesma `file_url` quebraria cascata ingênua (pre-check §2.4) |
| **Bucket público × privado / URL assinada** (B5-D3) | **PRD nativo, Bloco C** — rotação de visibilidade é mudança de contrato | STORAGE.md, cláusula 3 |
| **Busca (LIB-04)** | **B11** — stub no plano desde o PR-0; nada desenhado nem medido | Plano, seção B11 |
| **Reorder sem guard de 1MB** | Housekeeping de rota (coberto pelo 413 da plataforma enquanto isso) | Pre-check, divergência 5 |

---

## 6. Método — aprendizados do bloco

1. **Premissa de desenho derrubada por dados reais**: o §4.1 afirmava "todo escritor OOXML real põe `[Content_Types].xml` como entrada inicial" — a reconciliação da PR-3 provou o contrário em 20 arquivos reais (entrada no FIM do zip; offsets 8003/9011 e 46451/47459), revelando regressão viva da PR-2 sobre docx não-Word. O **relatório-antes-da-limpeza** pagou o bloco sozinho: sem ele, os 20 teriam sido deletados como "mentirosos" e a regressão de upload ficaria invisível.
2. **Primeiro uso em volume revela o que probe unitário não vê**: a regex do delete convivia com o bucket desde o B2; só as 87 deleções do O-1 expuseram a recusa a espaço (2/87). Corolário: consumo de sistema em escala é parte do gate, não só o probe de fumaça.
3. **Timeout é classe de robustez de script, não detalhe**: uma fetch sem timeout pendurou a primeira reconciliação por ~10min num hiccup transitório (`8b7f17b`: 15s/60s por objeto, falha → "não avaliável"/pulado, nunca veredito). Regra irmã reafirmada no ciclo: mudança extra se declara **para veto antes** de commitar.
4. **Rate limit próprio é restrição operacional de operação em massa**: 87 deleções × família 60/h → plano de lotes 45+42 com janela ≥65min, zero 429. O desenho não previu; o prompt do O-1 corrigiu antes de doer.

---

## 7. Suíte e docs

- **Suíte**: 570 passed (pós-B3) → **607 passed / 86 skipped**. Trilha: +3 (PR-1, teto) → 573 · +12 (PR-2, sniffer+rota) → 585 · +21 (PR-3, list+core da reconciliação) → 606 · +1 (PR-2b, fixture formato-batch) → 607. Gates permanentes novos: contrato do teto (fronteiras), tabela de assinaturas positivo/negativo, **paridade lista×assinaturas** (tipo novo sem assinatura quebra a build), contrato da rota list (incl. G1-list com sentinela), unit do núcleo da reconciliação (parseRef/%20, cruzamento com a duplicata real, idade mínima, guardas do CLI, TOCTOU).
- **Docs novos**: [`docs/api/STORAGE.md`](../api/STORAGE.md) (modelo de entrega B5-D3 + contrato das 3 rotas + reconciliação) · [`B5-PRECHECK.md`](B5-PRECHECK.md) (`60b47ee`) · [`B5-DESENHO.md`](B5-DESENHO.md) (versionado no PR-0) · este documento.
- **Docs tocados**: [`PLANO-TRANSICAO.md`](PLANO-TRANSICAO.md) (notas de rotulagem B4/B5 + seção B11 + tabela-resumo LIB-04) · [`CONTRATO-DE-ERRO.md`](../api/CONTRATO-DE-ERRO.md) (meia-linha "campos adicionais por code" — pendência do B3 quitada) · `CLAUDE.md` (Firebase→Supabase Storage).
- **Config viva fora do repo**: `file_size_limit` do bucket = **4194304** (SQL de console do Marcel, ciclo da PR-1, leitura antes/depois colada); `public: true` e `allowed_mime_types: null` inalterados por decisão (B5-D3).

**B5 encerrado.** Próximos do Bloco B, quando o Marcel abrir: B6 (reorder atômico, candidato a levar a B5-D11) · B9 (idempotência + revogação do bypass) · B1.5 · B11 (busca). D8 segue como abertura do Bloco D.
