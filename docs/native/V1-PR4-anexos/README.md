# V1-PR4-anexos — o bruto da V1-PR4

> **Rastro de medição, não fonte.** A fonte da PR é o diff e as mensagens de
> commit; a fonte do bloco será o `V1-ENCERRAMENTO.md`. Isto é o material que
> o aceite da **V1-PR7** vai precisar para comparar antes × depois sem refazer
> o trabalho.
>
> **Data**: 2026-09-13. **Aparato**: AVD `octavia_tab32` (API 32, 2560×1600 @
> 360 dpi = 1138×711 dp), conta de audit, subido **sem** `-no-snapshot-save`
> (div. 42), dev client `c0c1ab51…` da V1-PR3 (nenhuma instalação nesta PR).
> Os estados offline em avião **provado por `ping`** antes de abrir o app, nas
> duas rodadas; os estados de sync contra o mock local (`aceite.py`, base
> inline). O Tab S6 `RX2N8000F3D` **não recebeu um comando**. **Prod: 0
> requests a `/api/*`** (anexo C1).
>
> **ANTES** = `origin/main` (`2db81ce`), Metro do worktree em `82bfc3e` — o
> commit 1 só toca scripts, e `apps/native/src` é byte a byte o de
> `origin/main` (div. 58 explica por que não foi o Metro do checkout principal).
> **DEPOIS** = `v1/pr4-s1` em `5f7d5c4` (commit 2), Metro do mesmo worktree; `S1c-e3` em cima do commit 4, `S1c-e12` em cima do commit 6.

| Arquivo | O que traz |
|---|---|
| `V1-PR4-A-estados-antes-depois.txt` | bounds de **todos** os alvos, textos do dump, content-desc e logcat por estado, antes × depois |
| `V1-PR4-B-gates.txt` | G1–G6 e `gate:icones` commit a commit, os controles negativos, suíte · tsc · lint |
| `V1-PR4-C-aparato-e-prod.txt` | contabilidade de prod, o corte de rede provado, AVD antes × depois × durável, Metro, `.env`, store |
| `V1-PR4-D-moldura-para-token.txt` | cada número das seis molduras e o token (ou literal declarado) que o código usa — div. 61 |

## Dumps e capturas

`dumps-antes/` (9 estados) e `dumps-depois/` (12) — um `.xml` (`uiautomator
dump`) e um `.png` (`screencap`, tirado ANTES do dump — div. 51) por estado,
nomeados pelo ID do DESIGN-V1 §7: `S1a` · `S1b` · `S1c` · `S1d` · `S1e` ·
`S1f`, mais `S1e-429` (A3), `S1d-falha` (falha sem cache, sem moldura),
`S1c-indicadores` (◔ e ✗ por fixture, A10) e, só no depois, `S1e-a21` (500 na
página 2, A21) `S1c-e3` (o `Baixar` inativo pela E3, commit 4) e `S1c-e12` (`garantida` neutra, commit 6). `SHA256SUMS.txt` em cada diretório.

`instrumentos/` — os scripts de host desta sessão: `g1.sh` · `g5.mjs` ·
`g6.sh` (verbatim da V1-PR1), `ids.mjs` (V1-PR3), `bounds.mjs` (a tabela do
anexo A1), `env.sh` (as funções de condução do AVD, caminhos anonimizados) e
`fixture-S1c-indicadores.json` (o `setlists.json` que produz parcial 2 de 3 e
nunca sincronizada — sha256 `a9668065…`).

## Aceites do PRD que tocam o S1

| # | resultado | onde |
|---|---|---|
| **A3** | ✓ 429 com `Retry-After: 30` → `ratelimit retry-after=30`, banner "servidor ocupado · tente em instantes" | `S1e-429`, anexo A4 |
| **A4** | ✓ lista do cache: `auth uid` → `cache hit` em 145 ms (antes 171); "visível" é hipótese — o logcat mede o cache, não o frame | anexo A4 |
| **A5** | parcial: kill + reopen em avião sem login (`src=restored`, `cache hit n=3`); abrir a setlist de 60 é S2, fora desta PR | `S1c` |
| **A10** | ✓ ✓/◔/✗ corretos por fixture (garantida · parcial 2 de 3 com arco de 2/3 · nunca sincronizada); "recalculado" após download não medido (div. 66) | `S1c-indicadores` |
| **A19** | ✓ com cache: banner + lista permanece (`S1e`); sem cache: erro acionável (`S1d`, `S1d-falha`) | anexo A |
| **A21** | ✓ 500 na página 2 → os 3 JSON do store byte a byte iguais + banner de falha | `S1e-a21`, anexo A4 |
| A17 | não se aplica; nenhum custo de render visível registrado (o S1b abriu em `sync ok t=242` contra 92 no antes — é o mock, não o render: `ms` das requests 28/31 → 28/88) | — |

## Item para o ACEITE VISUAL da V1-PR7, no Tab S6 (div. 59)

Três dos quatro indicadores do cartão — **`parcial`** (arco proporcional a n/m), **`nunca
sincronizada`** e **`baixando`** — não têm moldura no `telas.html`: foram implementados pela
tabela §6.4 e pela regra §6.1, nunca desenhados. O **parcial** é o estado mais comum da conta
real do Marcel (setlists com arquivos que ainda não desceram). A V1-PR7 tem de **olhar** os
três no Tab S6 com a conta principal — não só medir bounds e `content-desc` — e o aceite deles
é do Marcel, porque não há frame para comparar. Referência de tela: `dumps-depois/S1c-indicadores.png`
(AVD, fixture: parcial 2 de 3 e nunca sincronizada).

## Decisões do Marcel sobre a entrega (2026-09-13)

Q1 o indicador em download mostra `baixando` + "Baixando…" (mantido) · Q2 o `Baixar` inativo
recebe a **E3 aqui** (tinta `lineInfo` na moldura, no ícone e no rótulo, sem opacidade — commit 4;
`dumps-depois/S1c-e3.png`) · Q3 a marca do S1f com o rótulo "Octavia", errata **E11** · Q4 código
como está e a regra dos dezessete números vira errata **E10** agora, para a PR5 e a PR6 · Q5 caixa
alta mantida (div. 63) · Q6 `errorInk` na falha sem cache (div. 65) · Q7 o commit de anexos fica.
Div. 58: a limitação passa a ser declarada nos termos de ambiente, não de código. Div. 60: **§6.1 vence**, `garantida` neutra (ícone `text`, rótulo `muted`), errata **E12** — commit 6.

## Divergências — 58 em diante

*(Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** teste/instrumento.)*

| # | Origem | O que é |
|---|---|---|
| **58** | **T** | O `node_modules` do checkout principal é de 10/09, anterior à #296: o Metro de lá **não resolve `react-native-svg`** ("Unable to resolve … from Icone.tsx", bundling failed, dev client em erro). Nada foi instalado no checkout principal (não é o desta sessão); o ANTES rodou do worktree em `82bfc3e`. **Limitação, nos termos certos**: o diff vazio de `apps/native/src`, `App.tsx`, `index.ts` e `app.json` contra `origin/main` prova que o **código** do antes é o de `origin/main` — **não** prova que o **ambiente** foi o mesmo: antes e depois renderizaram com o mesmo dev client `c0c1ab51…` e um bundle que já têm o `react-native-svg` da #296, coisa que o `origin/main` de fato tinha, mas que o checkout principal não conseguiria servir. Risco baixo (mesmo worktree, mesmo APK, minutos de diferença), declarado. **Depois do merge, `pnpm install` no checkout principal é passo do Marcel — a PR5 bate no mesmo problema** |
| **59** | **D** | As seis molduras do S1 desenham **só** o indicador `garantida` nos três cartões (a lista `setlists` do `telas.html` é a mesma nos três frames): `parcial`, `nunca sincronizada` e `baixando` (cartão e botão) **não têm moldura nenhuma**. Implementados pela §6.4 (nome, tamanho, cores) e §6.1 (âmbar = não está pronta) — anexo D3. **O tamanho dela**: três dos quatro indicadores nunca foram desenhados por ninguém, e o estado mais comum da conta real do Marcel — *parcial*, com o arco proporcional — é um deles. Vira item do **aceite visual da V1-PR7**, abaixo |
| **60** | **D** | A §6.1 diz "garantida em **tinta neutra**"; a moldura S1b pinta o ícone e o rótulo em `#777CE8` e a legenda diz "*garantida* de 28 em accentInk — mesma cor de antes". O commit 2 seguiu a moldura. **Decisão do Marcel (2026-09-13): a §6.1 vence** — ícone em `text`, rótulo em `muted`; o acento fica com um significado só (ativo, atual, foco, §3.1) e a semântica fecha: neutro é "pode ir", âmbar é "não está pronta". Errata **E12** na moldura S1b e na legenda; código no commit 6, capturado em `dumps-depois/S1c-e12` |
| **61** | **D** | As molduras usam **17 números fora das escalas** do `theme.ts` que a §5.2 diz que o desenho respeita (gaps 10 · 14 · 22 · 26 · 28, paddings 14 · 18 · 22, raios 8 · 10, tracking .09, 14,5 px, banner 66). Entrou o degrau mais próximo, pelo critério da E6; tabela completa no anexo D2 — pergunta ao Marcel |
| **62** | **P** | O prompt manda provar o `ping` falhando "antes de abrir o app, **toda vez**"; quatro dos seis estados (S1a, S1b, S1e, S1f) **só existem com o sync rodando** — `estaOnline()` pula o sync em avião. Eles rodaram com a rede viva e a base inline no mock (o protocolo do V1-PRECHECK §4.3 e da V1-PR1); o ping foi provado antes de S1c, S1d e S1c-indicadores nas duas rodadas. Prod: 0 pelos dois lados (logcat × `REQ` do mock) |
| **63** | **A** | `textTransform: 'uppercase'` no título dos blocos S1d/S1f (como a moldura, Raleway 22 com tracking): o dump devolve **"SEM CONEXÃO" / "NENHUMA SETLIST"** — o mesmo mecanismo do nome do cartão desde o N1; a string em código não muda |
| **64** | **T** | `gate:a20:cn` passou a varrer **2** arquivos (o `IconesFalso.ts` vive em `scripts/__cn__`), com as mesmas 3 acusações |
| **65** | **D/A** | Falha **sem cache** (chip do cabeçalho e bloco central) não tem moldura — o S1d desenhado é o offline. Implementado `falha` em `errorInk` (20 no chip, 28 no bloco), por paralelo com o `sem-conexao` em `offlineInk` do S1d. Hipótese de desenho — pergunta ao Marcel |
| **66** | **T** | O estado **baixando** (indicador `baixando` 28 + "Baixando…", botão `baixando-acao`) **não foi medido**: com o store completo o "Baixar" é inativo, e provocá-lo pela fixture parcial faria download real do bucket de prod. Só `tsc` |
| **67** | **A** | A marca no S1f leva `accessibilityLabel="Octavia"`, como no S0 — a §8.4 dizia que o do login "continua sendo o único do app"; agora são dois. É o 49.º literal que o a20 examina |
| **68** | **T** | O FAB do dev client do Expo mostrou o tooltip "Tools" nas capturas `S1a`, `S1c`, `S1c-indicadores` e `S1d` do DEPOIS (canto superior direito, fora do app). Artefato do dev client; não está no dump do app |
| **69** | **T** | O `content-desc` dos cartões muda de forma: o glifo (era nó de texto) e o separador "  ·  " saem — "UX-AUDIT ESTRESSE, sem data, 60 músicas, garantida offline, …". Esperado pelo design (SVG não é texto; o ícone substitui o separador); registrado porque o A20/G6 da V1-PR7 vai ler o novo |
| **70** | **T** | A primeira captura do `S1c-e3` (commit 4) saiu com o `screencap` **antes** de o cache carregar — frame transitório "sincronizando…" sem lista — enquanto o `uiautomator dump`, tirado depois, já trazia os três cartões. O inverso da div. 51 da PR3: com `--clear` e boot de snapshot, 12 s não bastam. Descartada; refeita esperando o `sync skip` no logcat antes de capturar. Regra: **capturar só depois da linha de logcat que define o estado** |

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR4-A-estados-antes-depois.txt` | 154 | `f3430dc28b37d5f1dc1238748beca0800d862f596cdee12634b39e6582db5a1a` |
| `V1-PR4-B-gates.txt` | 132 | `e4e4c155148b2de2440cfe03d4c9a83f5df93af31733d7acbf019dcb5e922304` |
| `V1-PR4-C-aparato-e-prod.txt` | 188 | `2b9ffde8a3a08380d7b104519b8a05c37f763e2272cb2aa24aaa17e87ca6ca7f` |
| `V1-PR4-D-moldura-para-token.txt` | 65 | `2a9cd03ade888990621587e8c1e030e4b7ed93925d817ca85d8bb726fa1040f3` |
| `dumps-antes/SHA256SUMS.txt` | 18 | `8900ba2d0c37a4bd0ff17e131d10963513bc60c8e43e0f36043e690db9f067c6` |
| `dumps-depois/SHA256SUMS.txt` | 24 | `82c8f399cede6e858d078926981b8dec877fbcbc8bc0d951a3267cddcf096095` |
