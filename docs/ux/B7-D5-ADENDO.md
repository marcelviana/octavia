# B7-D5 — Adendo: forma final do contrato de `content_data` na escrita

> **Data**: decisões de 2026-09-08 (Marcel), a partir da leitura da conta
> principal ([`B7-anexos/D5-content_data-chaves.md`](B7-anexos/D5-content_data-chaves.md));
> executado na **B7-PR5** (2026-09-09). Complementa a **B7-D5** do
> [`B7-PRECHECK.md`](B7-PRECHECK.md) §0 (forma (b) tipado-passthrough) — o
> pre-check não é editado. Contrato resultante:
> [`docs/api/CONTENT-DATA.md`](../api/CONTENT-DATA.md).

## Decisões adicionais

- **D5b — Sheet**: sem chave obrigatória em `content_data` (nula ou
  objeto); `file_url` **não** é validada em cruzamento nesta PR.
- **D5c — `null` aceito para todo tipo na escrita**: é o estado "criado sem
  corpo ainda" (14 registros em 2026-09-08: Chords 5, Sheet 4, Tab 5). A
  exigência da chave do tipo vale **só quando `content_data` é objeto**.
  Chaves extras passam (o editor do web polui; T1-R7 ignora no nativo).
  Nunca altera: passa ou 400 nomeando `content_data.<chave>`.
- **Item 3 da PR5 (2026-09-09), opção (a)**: o `PUT` não carregava a linha
  (ownership no WHERE do UPDATE) e o editor do web manda `content_data`
  **sem** `content_type` → SELECT condicional de `content_type` só nesse
  caminho (ausente → 404 do D2 antes da validação); nos demais, uma ida ao
  banco (afirmado em teste).

## Fatos derivados da leitura (revisor)

- **Lyrics** 147/147 com a chave (146 `lyrics` + 1 dos 6 poluídos que a
  carrega aninhada — ver "poluição").
- **Tab** 10 válidos + 5 nulos.
- **Chords** 18 com `chords`, **2 objetos sem `chords`** (→ 400 no próximo
  PUT, nomeando `content_data.chords`), 5 nulos.
- **Sheet** 3 com `file` em `content_data` **e** `file_url` na coluna (o
  nativo não perde nada), 2 só `file_url`, 2 sem nada.
- **~11 registros no estado "inválido" do T1-R7** (≥4 Chords, 2 Sheet, 5
  Tab: `content_data` nulo **e** `file_url` nulo, ou objeto sem a chave) →
  **errata do PRD §4 no pre-check do N1**: o "não existe em item nenhum"
  do C valia para a conta de audit (66 itens semeados pela API), não para
  a conta principal.
- **Poluição recursiva** (`content_data` dentro de `content_data`) em **9
  registros** (Chords 3, Lyrics 6) — origem medida no pre-check do B7
  (div. 3: `content-type-editor.tsx` espalha o registro inteiro).

## Destinos

| Item | Destino |
|---|---|
| Errata do PRD §4 (inválidos existem na conta principal; ~11) | pre-check do **N1** |
| Poluição do editor do web (`content-type-editor.tsx` + `content-editor.tsx`) | **Bloco D** |
| Limpeza dos 9 registros recursivos (script de leitura + lista nominal + gate humano, padrão B5-D2) | **Bloco D** |
| Cruzamento `Sheet` × `file_url` (2 registros sem nada) | tela 2 / Bloco D |
| Os 2 Chords sem `chords` (400 no próximo PUT) | comportamento contratado; corrigir pelo editor quando o Bloco D o consertar |
