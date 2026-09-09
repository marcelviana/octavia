# Contrato de `content_data` da API Octavia (escrita)

> **Origem**: bloco B7 (2026-09; pre-check em
> [`docs/ux/B7-PRECHECK.md`](../ux/B7-PRECHECK.md) H-C2, decisão **B7-D5**
> na forma (b) "tipado-passthrough", com D5b/D5c em
> [`docs/ux/B7-D5-ADENDO.md`](../ux/B7-D5-ADENDO.md), a partir da leitura da
> conta principal em 2026-09-08 —
> [`docs/ux/B7-anexos/D5-content_data-chaves.md`](../ux/B7-anexos/D5-content_data-chaves.md)).
> Este documento contrata POR ESCRITO o que `POST /api/content` e
> `PUT /api/content` aceitam em `content_data` por `content_type`. O contrato
> de **leitura** do cliente nativo é o [`PRD-TELA-1.md`](../native/PRD-TELA-1.md)
> §4 (T1-R7) — não é duplicado aqui. Erros: envelope de
> [`CONTRATO-DE-ERRO.md`](CONTRATO-DE-ERRO.md) (`VALIDATION_ERROR` 400).
> Docs independentes, sem link normativo.

## Regra

**Nunca altera; passa ou 400 nomeando o campo.** O topo de `content_data`
é objeto ou `null` (D5 do B2: string → 400 "Expected object"). Quando é
objeto, a chave do tipo é obrigatória e string; as demais chaves passam
literalmente. Implementação: `lib/content-data-contract.ts`
(`checkContentData`), chamado pelo `superRefine` de `contentSchemas.create`
e `.update` (`lib/api-schemas.ts`) e, no `PUT` sem `content_type` no
payload, pelo handler com o tipo lido da linha (`app/api/content/route.ts`).

| `content_type` | Chave obrigatória em `content_data` (quando objeto) | Tipo da chave | `content_data: null` | Chaves extras |
|---|---|---|---|---|
| `Lyrics` | `lyrics` | string | aceito (D5c) | passam |
| `Chords` | `chords` | string | aceito (D5c) | passam |
| `Tab` | `tablature` | string | aceito (D5c) | passam |
| `Sheet` | **nenhuma** (D5b) | — | aceito | passam (`file`, `annotations`…) |

- **D5c — `null` aceito para todo tipo**: é o estado "criado sem corpo
  ainda" (14 registros em 2026-09-08). A exigência da chave vale **só**
  quando `content_data` é objeto.
- **D5b — `Sheet`**: sem chave obrigatória; `file_url` **não** é validada
  em cruzamento (item do Bloco D / tela 2).
- **Chaves extras passam** (`annotations`, `sections`, `measures`, e a
  poluição do editor do web — o registro inteiro espalhado). O nativo as
  ignora (T1-R7 (a)); a limpeza é item do Bloco D.

## Erros (envelope do contrato)

```
400 {"error":"Validation failed","code":"VALIDATION_ERROR",
     "details":[{"field":"content_data.lyrics","message":"obrigatória para Lyrics","code":"custom"}]}
400 {"error":"Validation failed","code":"VALIDATION_ERROR",
     "details":[{"field":"content_data.tablature","message":"deve ser string","code":"custom"}]}
```

`field` é `content_data.<chave>` (dot-notation, `path.join('.')`). Mensagens
(pt-BR, dado de UI): `obrigatória para <Tipo>` e `deve ser string`.

## `PUT /api/content` sem `content_type` no payload

O editor do web manda `content_data` sem `content_type`. Nesse caso o
handler lê `content_type` da linha do usuário (**uma leitura a mais, só
nesse caminho**; ownership no WHERE): linha ausente ou alheia → `404
Content not found` (D2, sem oráculo, **antes** da validação); presente →
a mesma regra acima. Com `content_type` no payload o PUT segue com uma
única ida ao banco (gate: `app/api/content/__tests__/route.test.ts`).

## Gates

`lib/__tests__/contract-content.test.ts` ("D5: content_data por tipo") e
`app/api/content/__tests__/route.test.ts` (B7-PR5). Controle negativo da
regra nº 7: o `it` antigo que aceitava `Lyrics` com `{annotations,
sections, meta}` sem `lyrics` passou a esperar 400 `content_data.lyrics`.
