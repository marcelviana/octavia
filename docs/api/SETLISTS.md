# Contrato de setlists da API Octavia

> **Origem**: bloco B6 (2026-09; pre-check e desenho em
> [`docs/ux/B6-DESENHO.md`](../ux/B6-DESENHO.md), decisões B6-D1 a D11).
> Este documento contrata POR ESCRITO o invariante de `position` e os
> shapes de escrita de `setlist_songs`. Erros: toda não-2xx destas rotas
> fala o envelope de [`CONTRATO-DE-ERRO.md`](CONTRATO-DE-ERRO.md)
> (referência de conveniência — docs independentes, sem link normativo).

## Invariante contíguo 1..N (contrato da tabela)

Em toda setlist, as `position` de `setlist_songs` são **exatamente
1..N contíguas** (N = contagem de músicas), sem gap e sem duplicata.

**Mecanismo (B6-D10/D11)**: os quatro escritores de produção
pós-criação — addSong, remoção de música, reorder e delete de content —
escrevem via funções RPC transacionais
(`supabase/migrations/20260901102108_b6_setlist_songs_rpc.sql`) que
serializam no lock `FOR UPDATE` da linha-pai (`setlists`); o delete de
content trava antes a linha de `content` (conflita com o FOR KEY SHARE
da FK do addSong). Demais classes do inventário (B6-DESENHO.md §0.1):
o create com `songs[]` inline é seguro por construção (setlist recém-
criada, positions 1..N atribuídas pelo servidor); os deletes em massa
por cascade são vácuos (a setlist morre junto). A rota de content migra
para a RPC na PR-3c; até lá vale a janela declarada no §0.1.

Posições são **1-based**. Erros das RPCs saem por SQLSTATE custom
(OB6xx) e são traduzidos POR `error.code` no ponto único
`lib/rpc-errors.ts` — mensagem de dependência nunca navega ao envelope.

## Rotas

### `POST /api/setlists/[id]/songs` — addSong

- Auth obrigatória; família `setlist-mutate` (120/15min por uid).
- Body: `{ content_id, position?, notes? }` (strict).
- **`position` é aceita por compatibilidade e SEMPRE recalculada para
  max+1** (B6-D3: append-only; gap impossível por construção — o
  pre-check mediu o gap p99 do contrato antigo). O max é lido DENTRO da
  transação da RPC, sob o lock.
- Gates na rota: setlist inexistente-ou-alheia → `404 Setlist not
  found`; content inexistente-ou-alheio → `404 Content not found`
  (sem oráculo, byte-idênticos por construção).
- 201: a linha inserida, colunas na ordem da tabela —
  `{ id, setlist_id, content_id, position, notes, created_at }` — com a
  `position` REAL. `updated_at` da setlist bumpa na mesma transação.
- Bis (mesmo content de novo) é permitido — cada add é uma linha nova
  no fim.

### `PUT /api/setlists/[id]/songs/order` — reorder em lote (B6-D1)

- Auth obrigatória; família `setlist-mutate`. Guard de corpo de 1MB
  (middleware — B6-D4).
- Body: `{ "order": [<setlist_song.id>…] }` (strict, 1..100 itens,
  uuids, sem duplicata).
- **`order` deve ser permutação EXATA** do conjunto de músicas da
  setlist: mesmos IDs, sem falta, sem sobra. A checagem roda DENTRO da
  transação (TOCTOU fechado); a renumeração 1..N pela ordem do array é
  atômica.
- Erros: duplicata → `400 field:"order"` (`Duplicate song id in
  order`); falta/sobra/ID alheio/corrida → `400 field:"order"`
  (`order must contain exactly the songs of the setlist`) —
  byte-idênticos entre si (sem oráculo); setlist inexistente-ou-alheia
  → `404 Setlist not found` byte-idêntico ao do addSong; corpo >1MB →
  `400 field:""`.
- 200: `{ "songs": [ { "id", "position" }… ] }` — a ordem canônica
  renumerada; a resposta É a leitura (o cliente nativo reconcilia o
  drag-and-drop sem GET).
- Consumidor: cliente nativo (a web não a chama — TODO histórico do
  setlist-manager permanece).

### `DELETE /api/setlists/songs/[songId]`

- Auth obrigatória; família `setlist-mutate`.
- Gate na rota: song inexistente OU de outro usuário → `404 Song not
  found` byte-idênticos (D2 do B3).
- A remoção + renumeração 1..N-1 + bump de `updated_at` são UMA
  transação (RPC `remove_setlist_song` — B6-D9); o double-delete
  concorrente vira `404` (nunca um 200 mentiroso).
- 200: `{ "success": true }`.

### Rota REMOVIDA: `PUT /api/setlists/songs/[songId]` (move-one)

Removida na B6 PR-3b (B6-D1): zero consumidores vivos (a UI web nunca a
chamou), custo de 2N UPDATEs não-atômicos por movimento (pre-check §2).
O contrato canônico de reorder é o lote acima.

## Nota de concorrência (medida no ciclo do B6)

Corridas addSong×reorder, addSong×remove e reorder×remove serializam no
lock da linha-pai; addSong×addSong serializa e produz N+1, N+2 (no
contrato antigo, colidia na UNIQUE → 500). Resíduos declarados no
desenho §2.2/§2.6.
