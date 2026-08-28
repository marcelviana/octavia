# Contrato de erro da API Octavia

> **Vigência**: integral ao fim do B3; por rota, conforme a PR que a migra
> (sequência e estado em [`docs/ux/B3-DESENHO.md`](../ux/B3-DESENHO.md) §3).
> Origem: ciclo B3 ([`B3-PRECHECK.md`](../ux/B3-PRECHECK.md) mediu os
> shapes reais; o desenho aprovado fixou este contrato). O shape estende a
> **semente do B2** (`VALIDATION_ERROR` + `details[{field,message,code}]`)
> a toda classe de erro.

Válido para **toda** resposta não-2xx emitida pelos handlers de
`app/api/*`. O cliente nativo nasce com a regra inversa da web: **toda
não-2xx aparece para o usuário por default**; silenciar é opt-out
consciente.

## Envelope

```json
{
  "error":   "mensagem humana exibível (en; dado de UI, não parsear)",
  "code":    "CHAVE_ESTAVEL_DE_MAQUINA",
  "details": [ { "field": "…", "message": "…", "code": "…" } ]
}
```

- `error` — **string, sempre presente**. Mensagem legível. O cliente PODE
  exibi-la como fallback, NUNCA fazer lógica sobre ela.
- `code` — **string, sempre presente**, da taxonomia abaixo. É a chave de
  lógica e de i18n (pt-BR no nativo — GLOB-01).
- `details` — **presente apenas em `VALIDATION_ERROR`**. Cada item:
  - `field`: path do campo em dot-notation. **`""` é RESERVADO para "o
    corpo como um todo"** (JSON malformado, corpo acima do limite de
    1MB) — nenhum outro caso o usa. Id de path malformado (ex.:
    `/api/content/not-a-uuid`) usa `field: "id"`. Chave desconhecida no
    body gera **um item por chave**, com `field` = o nome da chave
    ofensora.
  - `message`: humana, específica do item.
  - `code`: código de issue do Zod (ex.: `invalid_type`, `too_small`,
    `invalid_string`, `unrecognized_keys`).

## Taxonomia (fechada, append-only)

| `code` | HTTP | Semântica |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Credencial ausente, inválida ou expirada (indistinguíveis por decisão — sem oráculo de motivo). Header `WWW-Authenticate: Bearer` presente. |
| `VALIDATION_ERROR` | 400 | Entrada recusada: body, query, id de path malformado, JSON inválido, corpo acima do limite de 1MB. Carrega `details`. |
| `NOT_FOUND` | 404 | Recurso inexistente **ou de outro usuário** — indistinguíveis por decisão (sem oráculo de existência). |
| `RATE_LIMITED` | 429 | Janela estourada. Corpo carrega também `retryAfter` (segundos, inteiro). Headers autoritativos: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Scope` (`user`\|`ip`). |
| `INTERNAL_ERROR` | 500 | Falha do servidor. `error` é sempre genérica — nenhuma mensagem interna de dependência (Supabase/Firebase/Postgres) atravessa. |

Mapeamento `code`↔status é **1:1 nas duas direções** — o cliente pode
chavear por qualquer um.

**Compatibilidade (as duas cláusulas de evolução):**

1. **`code` é append-only**: códigos nunca mudam de significado nem
   somem; o cliente trata `code` desconhecido como erro genérico (exibe
   `error`).
2. **O cliente ignora campos que não conhece no envelope** — campos novos
   podem ser adicionados sem quebrar cliente nativo shipado.

## Cláusula não-JSON (fora do envelope, por decisão)

Três respostas vêm de fora dos handlers e **não** carregam o envelope:

| Caso | Resposta real (medida) |
|---|---|
| **405** método não suportado | corpo vazio, sem `Allow` (default do framework) |
| **404** rota inexistente | página HTML do Next |
| **413** corpo >4,5MB | `text/plain`: `Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE …` (limite da plataforma Vercel) |

Regra do cliente: **não-2xx cujo corpo não parseia como o envelope =
erro genérico**, sem retry automático.

## Exemplos normativos (medidos)

```
401  {"error":"Authentication required","code":"AUTH_REQUIRED"}
400  {"error":"Validation failed","code":"VALIDATION_ERROR",
      "details":[{"field":"newPosition","message":"newPosition must be >= 1 (positions are 1-based)","code":"too_small"}]}
400  {"error":"Validation failed","code":"VALIDATION_ERROR",
      "details":[{"field":"extra1","message":"Unrecognized key: 'extra1'","code":"unrecognized_keys"},
                 {"field":"extra2","message":"Unrecognized key: 'extra2'","code":"unrecognized_keys"}]}
400  {"error":"Validation failed","code":"VALIDATION_ERROR",
      "details":[{"field":"id","message":"Invalid ID format","code":"invalid_string"}]}
404  {"error":"Setlist not found","code":"NOT_FOUND"}
429  {"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":868}
500  {"error":"Internal server error","code":"INTERNAL_ERROR"}
```
