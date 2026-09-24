# N3-PRECHECK-anexos — o bruto do pre-check do N3 (faixas de largura)

**Rastro.** A fonte é o [`N3-PRECHECK.md`](../N3-PRECHECK.md); onde este índice e o
documento divergirem, vale o documento. Árvore `../octavia-n3-pre`, branch
`n3/precheck`, sobre `origin/main` = `aa91b5d`. Divergências **382–390**.

**Nenhum texto de música de terceiro**: todo dump e PNG é do **mock**, com a fixture
escrita por este pre-check (`instrumentos/fixture.py`: "Quando a noite chega…
(fixture do projeto)", `[Intro] C Am F G`, a tablatura `e|---0`, PDFs com "Fixture
N3 - página n de m"). Nenhum dump de prod foi tirado. A varredura da regra 4 (prefixo
base64 de JWT), de e-mail e de uid nos anexos deu vazia.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `B1-janelas.txt` | a janela útil de cada aparelho × orientação (raiz do dump do S1 e a janela medida pelo `inventario.mjs`) |
| `B2/` | **52** pares PNG + XML em **retrato**: Tab S6 (`-tab`, 25) e AVD `octavia_tab32` (`-avd`, 27, com S0) |
| `B4/` | **53** pares do celular `octavia_phone`: retrato (`-phone-ret`, 26) e paisagem (`-phone-pai`, 27) |
| `B5-baseline/` | a **linha de base da N3-D3** em paisagem: telas de lista e do N2 — AVD 18, Tab 16 (sem S0). O palco não: a linha de base dele é `../W4B3-anexos/dumps-palco/` |
| `B3-referencia-paisagem/` | o palco (S3 e S5) em paisagem **com esta fixture**, nos dois tablets — referência do inventário, não linha de base (extra, declarado antes de capturar) |
| `B6/` | o veredito do ◔: dois dumps do S1 (antes e depois do `lru over`), `B6-logcat.txt` (linhas `OCTAVIA:` sem as de `auth`) e `B6-saida.txt` |
| `inventario.mjs` | o B3: (a) sobreposição, (b) corte e ausente, (c) alvo < 48, (d) literal, (d′) menos espaço, (e) texto ausente — cada dump contra a paisagem do mesmo estado |
| `B3-tabela.md` · `B3-inventario.jsonl` | a tabela dump a dump (`--md`) e o JSON completo |
| `B3-por-superficie.md` | o resumo superfície × faixa (`instrumentos/por-superficie.mjs`) |
| `B3-controle-paisagem.jsonl` | o instrumento contra a própria paisagem: (a)=(b)=(c)=(d)=0 nas 34 telas de lista; no palco, só as zonas de 15 % |
| `instrumentos/` | `fixture.py` (mock + PDFs), `servidores.sh` (mock 8788 + arquivos 8790), `n3.py` (driver por `resource-id`), `roteiro.py` (os estados do B2/B4/B5), `cap.sh` (PNG + dump), `rot.sh` (rotação), `b6.py`, `por-superficie.mjs` |
| `roteiros/` | a saída de cada rodada do roteiro, verbatim — `roteiro-phone-pai.txt` é a rodada ruim da div. 387 (as capturas dela foram apagadas) |
| `estado/` | o estado dos aparelhos lido no começo e o do fim, e as duas conferências do bundle (regra 13 ampliada) |
| `faseA/` | A1–A4, a Fase A estática inteira, com comandos e saídas (rastro) |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |

Nomes: `B2-<tela>-<estado>-<aparelho>.{png,xml}`. **Nome de anexo é afirmação**: a
orientação do nome foi conferida pela **raiz** de cada dump (Tab retrato 1600 × 2452,
AVD retrato 1600 × 2560, celular retrato 1080 × 2400, celular paisagem 2400 × 1080,
Tab paisagem 2560 × 1492, AVD paisagem 2560 × 1600; `roteiro.py` recusa a captura
que não bate) e cada PNG foi olhado numa folha de miniaturas antes de ficar.

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3 pre-check: nenhuma declaração — só docs (N3-PRECHECK.md, os anexos e o APARATO.md).
```

## Aparato

- **Mock** `apps/native/src/fixtures/aceite.py servidor 8788 <modo>` sobre
  `fixture.py` (3 setlists, 12 contents; `--b6`: 2 setlists com 3 × 80 MiB);
  **arquivos** por `python3 -m http.server 8790` (o mock não serve arquivo, e o PDF
  que dá 404 é o do S3e). **Metro** na 8081, **sem `CI=1`**, com
  `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; os três por `adb reverse`.
- **Bundle conferido** antes de cada rodada (`estado/bundle-*.txt`): `localhost:8788`
  1 · `octavia.rocks` **0** · `lru over` 2 · `jaVoando.guaranteed` 1.
- **Modos do mock usados**: `normal`, `500-pagina-1` (S1e), setlists vazias (S1f),
  `escrita-500` (folha falhou — nenhuma escrita gravada), `401` (logout para o S0).
- **Estados de aviso sem escrita**: "S1 com aviso" e "S2 com edição com aviso" são o
  **sem rede** (avião ligado e desligado pelo roteiro).
- **S0 com erro**: avião ligado, e-mail `fixture@exemplo.invalid` e senha `fixture-n3`
  (fixture, não credencial; o `signIn` falha em `erro.sem_conexao` sem sair do aparelho).
- **Celular criado nesta sessão**: `avdmanager create avd -n octavia_phone -k
  "system-images;android-32;google_apis;arm64-v8a" -d pixel_6` (no `APARATO.md`); o
  dev client entrou por `adb install -r` do APK do build do `octavia_tab32`; o
  **login de audit nele foi feito pelo Marcel** (2026-09-24).
- **Dev client do `octavia_tab32` refeito** (div. 383): `npx expo run:android --device
  octavia_tab32 --no-bundler`, 2m12s, `lastUpdateTime` 2026-09-23 20:42:12.

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido (`estado/*-lido.txt`) | mudado, e por quê | no fim (`estado/*-restaurado.txt`, `phone-fim.txt`) |
|---|---|---|---|
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **bloqueado** (o Marcel destravou) | `stay_on` 0→7 (tela de 30 s); `accel` 1→0 e `user_rot` 0/1 (retrato/paisagem); avião ligado e desligado nos estados sem rede; `reverse` 8081/8788/8790; **cache do app trocado pelo do mock** | **igual ao lido**, campo por campo; `reverse` vazio. **O cache do app** foi guardado antes (`run-as … tar` de `files/octavia-<uid>` e `cache/octavia-<uid>`, 4 arquivos) e **restaurado** com o app parado: md5 dos 4 arquivos idêntico ao de antes. O tar (que tinha um arquivo da biblioteca do Marcel) foi **apagado** do host. Nenhum `GET` a prod para restaurar |
| **AVD `octavia_tab32`** | desligado; ligado nesta sessão; `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, conta de audit, dev client de **2026-09-13** | dev client refeito (div. 383); avião desligado + `svc wifi/data enable` para o mock; rotação; `reverse`; logout pelo `401` (S0) | settings **iguais ao lido**, `ping` → `Network is unreachable`, `reverse` vazio; **desligado** (`adb emu kill`). Subiu com `-no-snapshot-save`: o próximo boot volta ao snapshot de 2026-09-14, **com a conta de audit** e **com o dev client velho** (div. 383) |
| **`octavia_phone`** | criado nesta sessão; `stay_on=1 accel=1 user_rot=0 airplane=0 wifi=1 data=1` | rotação; avião no S0 com erro; `reverse`; login de audit (Marcel) e depois logout pelo `401` | settings iguais ao lido, `reverse` vazio, **sem sessão** (o S0 é o repouso dele); desligado |
| **host** | 8081/8788/8790 livres | Metro, mock e arquivos; `apps/native/.env` copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`, igual nos dois) só para o Metro | as três portas livres; `.env` **apagado** desta árvore |

## Extras, e quando foram declarados

Declarados **na conversa com o Marcel antes** de serem feitos:

- **extra-1**: o palco em paisagem com a fixture deste pre-check (`B3-referencia-paisagem/`),
  referência do inventário — declarado antes da captura.
- **extra-2**: no `APARATO.md`, além da linha do B1 (pedida), o registro do snapshot
  do `octavia_tab32` (div. 383) — declarado antes do commit.

Instrumentos que o prompt não nomeou e que existem porque a medição os pediu (não
são entrega fora da lista): o servidor de arquivos da 8790 (o mock não serve
arquivo), os critérios (d′) e (e) do inventário (div. 384) e a guarda de orientação
do roteiro (div. 387).

## Escritas

- **Prod**: **zero** requests (nem leitura). O bundle nunca teve a URL de prod.
- **Mock**: a única escrita tentada foi o `POST /api/setlists` da "folha falhou",
  no modo `escrita-500` (nada gravado), em cada aparelho × orientação.
