# D-0 — M2, a prova em prod (2026-10-08)

> **Rastro**, não fonte: a fonte é o [`../../D0-ENCERRAMENTO.md`](../../D0-ENCERRAMENTO.md). Os quatro arquivos ao lado
> foram copiados **sem alterar** de `../octavia-d0-pr1/docs/ux/D0-ENCERRAMENTO-anexos/m2/` (sha256 conferido, cópia
> idêntica). Nenhum texto de obra: a Tab descartável tem título e tablatura **fabricados** (`D0 descartável`; as quatro
> linhas abaixo, escritas pelo executor para o roteiro); o logcat traz o uid (público, regra 3 do `LOGS-OCTAVIA.md`) e os
> nomes de três PDFs da semente do ux-audit (obra do projeto). Nenhum valor de `.env*`.

## O roteiro, depois do merge da #368 (`9c1f23c`) e do deploy de produção (Vercel `success`)

O Marcel, na conta de audit, em octavia.rocks: (i) criou a Tab `D0 descartável` sem dificuldade e, no painel *Tablatura*,
digitou o texto fabricado — `e|--0--2--3--|` · `B|--1--3--1--|` · `G|--2--2--0--|` · `D|--2--0--2--|`, **59 caracteres,
`sha256[:12]` = `9b51694daeac`** (calculados pelo executor antes do roteiro); (ii) abriu uma música sem dificuldade, mudou
*Notas* e salvou. **Respostas: (i) salvou · (ii) salvou.**

## O AVD `octavia_tab32` (conta de audit)

| arquivo | o quê |
|---|---|
| [`avd-estado-antes.txt`](avd-estado-antes.txt) | o estado lido antes: `airplane=1 wifi=0 data=0`, sem túneis, `ping` → `Network is unreachable`; o dev client de 2026-09-24 (`DEBUGGABLE`) |
| [`avd-logcat-completo.txt`](avd-logcat-completo.txt) | as linhas `OCTAVIA:` da abertura: `sync ok setlists=3 content=70`, as duas `api status=200`, os dois `file src=download`, a abertura do palco (`keepawake on`) |
| [`avd-palco-d0.png`](avd-palco-d0.png) | o palco avulso com a Tab: `D0 descartável · Teste · Tab` e as quatro linhas |
| [`avd-estado-depois.txt`](avd-estado-depois.txt) | o estado restaurado: `airplane=1 wifi=0 data=0`, túneis removidos, `ping` → `Network is unreachable` |

O emulador subiu com `-no-snapshot-save`. O Metro serviu o bundle da árvore da D-0 (o código do app igual ao da `main`),
com o `apps/native/.env` copiado sem abrir (sha `f2bfa179cd8e`, igual ao original) e **apagado no fim**; antes de abrir o
app, o bundle servido tinha `octavia.rocks` 1 vez e `localhost:8788` 0 (regra 13).

## As duas medições que a sessão imprimiu e não gravou em arquivo — transcritas

**O cache que o sync gravou** — `adb exec-out run-as rocks.octavia.app cat files/octavia-<uid>/content.json` para o
scratchpad (apagado no fim; não entra no anexo: é a biblioteca da audit), lido por um script que imprime só id, chaves,
comprimento e `sha12`:

```
list 70
itens com o título: 1
id8 f9b78d0e · tipo Tab · dificuldade None · chaves ['album', 'annotations', 'artist', 'bpm', 'capo', 'content_data', 'content_type', 'created_at', 'difficulty', 'file_url', 'genre', 'id', 'is_favorite', 'is_public', 'key', 'notes', 'tablature', 'tags', 'thumbnail_url', 'time_signature', 'title', 'tuning', 'updated_at', 'user_id'] · updated_at 2026-10-08T14:01:41.986+00:00
tablature: tipo str · len 59 · sha12 9b51694daeac
```

**O palco** — o `uiautomator dump` do palco avulso aberto pela biblioteca (busca `D0` → *Tocar “D0 descartável”*), com o
texto do nó `corpo` trocado por comprimento e `sha12` na impressão:

```
'AVULSA'  '' [54,90][291,159]
'D0 descartável · Teste · Tab'  '' [327,92][2507,156]
<texto len 59 sha12 9b51694daeac> corpo '' [72,270][492,558]
```

**Bate nos dois lados**: 59 caracteres, `9b51694daeac`. As requisições a prod: `GET /api/setlists`, `GET /api/content` e
dois PDFs da biblioteca da audit (`file src=download`) — leitura; nenhuma escrita (`grep -c 'OCTAVIA: write'` → 0).
