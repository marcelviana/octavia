# Contrato de storage da API Octavia

> **Origem**: bloco B5 (2026-08; pre-check em
> [`docs/ux/B5-PRECHECK.md`](../ux/B5-PRECHECK.md), desenho em
> [`docs/ux/B5-DESENHO.md`](../ux/B5-DESENHO.md)). Este documento contrata
> POR ESCRITO o modelo de entrega de arquivos (decisão **B5-D3**) e os
> shapes de 2xx das rotas de storage. Erros: toda não-2xx destas rotas
> fala o envelope de [`CONTRATO-DE-ERRO.md`](CONTRATO-DE-ERRO.md)
> (referência de conveniência — docs independentes, sem link normativo).

## Modelo de entrega de arquivos (contratado no B5, 2026-08)

1. O bucket `content-files` é **público por contrato** (não por
   acidente): `content.file_url` é uma URL pública estável do Supabase
   Storage, servida sem autenticação. Consumidores diretos: viewer e
   cache offline do web.
2. O **proxy autenticado** (`GET /api/proxy?url=`) é o caminho do modo
   performance (palco): auth + rate limit (família `proxy`), resposta
   streamada com headers saneados.
3. Consequências assumidas: quem tem uma `file_url` lê o arquivo sem
   credencial; a URL é permanente enquanto o objeto existir; rotação de
   visibilidade do bucket é **mudança de contrato** — decisão reservada
   ao PRD do nativo (Bloco C), não a nenhum fix.
4. **Namespace do bucket é flat** (`<timestamp>-<nome>`); não há prefixo
   por usuário — registrado como pendência de modelagem multiusuário do
   PRD nativo.

## Rotas

### `POST /api/storage/upload`

- Auth obrigatória (Bearer verificado server-side).
- Multipart: `file` + `filename`.
- **Teto: 4MB** (4.194.304 bytes, **inclusivo**) — alinhado em rota
  (schema) e bucket (`file_size_limit`); acima → `400` `field:"size"`.
  Rede de segurança da plataforma: corpo total ≥ ~4,5MB → `413`
  text/plain (cláusula não-JSON do contrato de erro).
- Tipos permitidos: a lista única `ALLOWED_UPLOADS`
  (pdf/txt/docx/png/jpg/jpeg) com **verificação de assinatura de
  conteúdo** (magic bytes — `lib/file-signatures.ts`): bytes que não
  são o que o MIME declara → `400` `field:"file"`.
- 201: `{ url, path, originalFilename, size, type, success }` — `url` é
  a URL pública permanente; `path` segue a convenção
  `<timestamp>-<nome-sanitizado>`.

### `POST /api/storage/delete`

- Auth obrigatória. Body: `{ "filename": "<path da convenção>" }`.
- **Interna/tooling por decisão (B5-D6)**: nenhum fluxo de UI a chama;
  o consumidor de sistema é a reconciliação
  (`scripts/storage/reconcile.ts`, modo `--delete` gateado).
- 200: `{ success: true, filename }`.

### `GET /api/storage/list`

- Auth obrigatória. Rate limit: família `storage` (60/h por uid).
- Query params: `prefix` (opcional, default `""`) · `limit` (opcional,
  default 100, máx 1000, inteiro ≥1) · `offset` (opcional, default 0,
  inteiro ≥0). Param inválido → `400` com `field` nomeando o param;
  params desconhecidos são ignorados (decisão do B2 para query).
- 200:
  ```json
  { "objects": [ { "path": "...", "size": 123, "contentType": "...",
                   "createdAt": "...", "updatedAt": "..." } ],
    "count": 1 }
  ```
- **Paginação por página-curta**: a list API do Supabase não devolve
  total; o caller pagina (`offset += limit`) até `count < limit`.
- Entradas de "pasta" virtual da list API ficam fora do shape (o bucket
  é flat por contrato).

## Reconciliação de órfãos (B5-D2)

- Ferramenta: `scripts/storage/reconcile.ts` (tooling local, service
  role + auth real contra a API).
- **`--report`** (default): read-only — cruza bucket × refs do banco
  (`content.file_url`, `content.thumbnail_url`, `profiles.avatar_url`)
  e emite: órfãos tipo A (objeto sem linha, com idade), órfãos tipo B
  (linha sem objeto), casados, e **mentirosos de MIME** (assinatura dos
  primeiros 8KB × contentType armazenado; para docx o objeto é baixado
  INTEIRO — a entrada `[Content_Types].xml` pode estar no fim do zip,
  B5-D10).
- **Idade mínima: 7 dias** — órfão mais novo aparece marcado
  "recente — fora da lista de remoção".
- **`--delete --lista <arquivo>`**: remoção SÓ da lista nominal
  aprovada pelo Marcel (gate humano), com re-verificação por arquivo no
  instante da deleção (existe + segue sem ref — guarda TOCTOU). Não
  existe modo "delete tudo".
