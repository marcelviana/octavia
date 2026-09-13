# V1-PR5-anexos — o bruto da V1-PR5

> **Rastro de medição, não fonte.** A fonte da PR é o diff e as mensagens de
> commit; a fonte do bloco será o `V1-ENCERRAMENTO.md`. Isto é o material que
> o aceite da **V1-PR7** vai precisar para comparar antes × depois sem refazer
> o trabalho.
>
> **Data**: 2026-09-13. **Aparato**: AVD `octavia_tab32` (API 32, 2560×1600 @
> 360 dpi = 1138×711 dp), conta de audit, subido **sem** `-no-snapshot-save`
> (div. 42), dev client da V1-PR3 (nenhuma instalação nesta PR). **As seis
> aberturas do app em avião, o corte provado por `ping` antes de cada uma** —
> ao contrário da V1-PR4 (div. 62), aqui nenhum estado exigia a rede viva: o
> S2 não tem estado de sync. O Tab S6 `RX2N8000F3D` **não recebeu um
> comando**. **Prod: 0 requests a `/api/*`** (anexo C1); o teto do bloco
> continua em 2.
>
> **ANTES** = `origin/main` (`9a7fa6e`), Metro do worktree no commit 1 — que
> só toca `scripts/`, e cujo `apps/native/src` é byte a byte o de
> `origin/main` (div. 58 explica por que não foi o Metro do checkout
> principal, e a V1-PR4 já previu que a PR5 bateria nisso).
> **DEPOIS** = `v1/pr5-s2` em `64b7890` (commit 2), Metro do mesmo worktree.

| Arquivo | O que traz |
|---|---|
| `V1-PR5-A-estados-antes-depois.txt` | bounds de **todos** os alvos, textos do dump e `content-desc` por estado, antes × depois |
| `V1-PR5-B-gates.txt` | G1–G6, `gate:a20` e `gate:icones` commit a commit, os controles negativos, suíte · tsc · lint |
| `V1-PR5-C-aparato-e-prod.txt` | contabilidade de prod, o corte de rede provado seis vezes, AVD antes × depois × durável, Metro, `.env`, store |
| `V1-PR5-D-moldura-para-token.txt` | cada número das duas molduras e o token (ou literal declarado) que o código usa — os acréscimos à **E10** |

## Dumps e capturas

`dumps-antes/` (5 estados) e `dumps-depois/` (9) — um `.xml` (`uiautomator
dump`) e um `.png` (`screencap`, tirado ANTES do dump — div. 51) por estado.
`SHA256SUMS.txt` em cada diretório.

Nomeados pelos IDs do DESIGN-V1 §7 onde há moldura, e pelo aceite onde não há:

| estado | o que é | tem moldura? |
|---|---|---|
| `S2` | índice de 8 músicas, aberto da S1 — os quatro tipos numa tela só | sim |
| `S2-invalidos` | o mesmo índice + as três fixtures do A6 (11 músicas), no topo | sim |
| `S2-invalidos-rolado` | o mesmo, rolado: é onde os itens 9, 10 e 11 têm bounds INTEIROS | — |
| `S2-atual` | índice de 60 aberto **do palco** na música 1 — o único estado com acento | não (§3.1) |
| `S2-rolado` | o mesmo, rolado até a 47: a lista rolada que o G5 pede | não |
| `A8-content-ausente` / `-rolado` | song com `content_id` fora do cache (só no DEPOIS) | não |
| `A12-bis` / `-rolado` | o mesmo content nas posições 1 e 9 (só no DEPOIS) | não |

`instrumentos/` — os scripts de host desta sessão: `g1.sh` · `g5.mjs` ·
`g6.sh` (verbatim da V1-PR1), `ids.mjs` e `bounds.mjs` (V1-PR3/PR4),
`estado.mjs` (a tabela do anexo A, nova aqui), `env.sh` (as funções de
condução do AVD, caminhos anonimizados) e as duas fixtures de inválidos
(`fixture-S2-invalidos-content.json` sha256 `81568ad6…` ·
`fixture-S2-invalidos-setlists.json` sha256 `06a5f7c4…`), geradas pelo
`aceite.py` versionado.

## Aceites do PRD que tocam o S2

| # | resultado | onde |
|---|---|---|
| **A14** | ✓ o mais importante da PR. Do palco na música 1 até a 47 de 60 em **2 toques** (índice + song-47), dentro dos 3 do T1-R28 — a rolagem é swipe, não toque. `OCTAVIA: index open` → `keepawake off` → **`index jump n=47`** → `keepawake on`, idêntico no antes e no depois | `S2-atual`, `S2-rolado` |
| **A6** | ✓ os quatro tipos numa tela só, **sem fixture**: "UX-AUDIT Show padrão" tem Sheet (1, 2), Lyrics (3, 6), Chords (4) e Tab (5, 7, 8). É o que exercita o ramo `em20` do `Icone.tsx` em tela. Item inválido com placeholder (nunca vazio): `S2-invalidos` | `S2`, `S2-invalidos-rolado` |
| **A8** | ✓ song com `content_id` ausente do cache aparece na posição 9, 536,9 × **116,0** dp, `desc="9, (sem título), indisponível, —"` — posição certa, com rótulo, sem buraco | `A8-content-ausente-rolado` |
| **A12** | ✓ bis: o mesmo content em 1 e em 9 dá **duas linhas distintas**, cada uma com a sua `notes` ("Observação da música 1: …" × "BIS: repetir so o refrao, meio tom acima"). A identidade é `setlist_songs.id` (T1-R24) | `A12-bis-rolado` |

Os demais aceites são da V1-PR7.

## Item para o ACEITE VISUAL da V1-PR7, no Tab S6

**A tab de quatro cordas (§6.3) e os dois placeholders de 28 dp.** A tab em 20
dp é a única exceção declarada da família de ícones, e o chip de tipo do S2 é
o **único lugar do app** onde ela aparece — o `gate:icones` agora prova que o
desenho é o do `telas.html` e que as cordas são quatro (commit 1), mas gate
mede markup, não legibilidade: quatro cordas com vão de 2,9 em 20 dp foi
escolhido justamente no limite do aliasing, e quem decide se lê é o olho, no
painel real. Junto, os ícones `sem-conteudo` e `tipo-desconhecido` a **28** dp
ao lado de rótulos de 13 — a moldura os desenhou em 20 e a tabela §6.4 pede 28
(div. 76): o desequilíbrio entre o ícone do inválido e o do válido, na mesma
coluna, é de olho, não de medida. Referência de tela:
`dumps-depois/S2.png` e `dumps-depois/S2-invalidos-rolado.png` (AVD).

## Divergências — 71 em diante

*(Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** teste/instrumento.)*

| # | Origem | O que é |
|---|---|---|
| **71** | **T** | O `gate:icones` **não cobria o `em20`**, e a nota da própria regra 2 dizia isso por escrito ("os estados `ativo`/`inerte`/`em20` … não são cobrados contra o anexo D"). O chip de tipo do S2 é o primeiro lugar do app que renderiza `tab` em 20 dp. Fechado no commit 1 com a regra 4 (markup verbatim do `telas.html` + contagem de cordas 4 × 6) e o sexto defeito no controle negativo (9 → **17** acusações). **Extra declarado**: estender o gate não estava na lista fechada; entra porque a regra 1 do prompt manda confirmar que os gates leem o que a PR introduz, e a confirmação achou o buraco |
| **72** | **D** | O botão da barra: a moldura desenha o `busca` puro (lupa), e a §6.4 dá o `buscar música` (lupa + nota) ao "S1 (todos), **S2**". Ficou o **`buscar-musica`** — o mesmo que a V1-PR4 pôs no S1, pelo critério da E12 (a regra vence a moldura). O texto "Buscar na biblioteca" **não muda** (§1). Pergunta ao Marcel |
| **73** | **D/A** | A moldura dá `tipo-desconhecido` ao item 10, que na fixture é `[FIXTURE] Objeto sem a chave (no-key)` — e o contrato do core (`content-contract.ts`) classifica `no-key` como falta de **corpo**, regra (c), não como tipo fora do enum, que é a regra (d) e só ela vira `unknown-type`. O código decide pelo **`reason`**, então o item 10 leva `sem-conteudo` e o 11 (`Piano`) leva `tipo-desconhecido`. A moldura fica visivelmente diferente no item 10, de propósito. Pergunta ao Marcel |
| **74** | **D** | A song cujo `content_id` **não está no cache** (`loading` / `unavailable`, o caso do A8) não tem moldura: não é `invalid`, pode chegar no próximo sync, e o prompt lista só os dois inválidos. Ficou **sem ícone e com "—"** na coluna de tipo, como hoje. É o único item do S2 sem ícone nenhum. Hipótese de desenho — pergunta ao Marcel |
| **75** | **T** | **Erro meu**: no encerramento, `lsof -ti:8081 \| xargs kill -9` para liberar a porta — e quem escutava a 8081 no host não era o Metro (já morto), era o **próprio qemu**, que é quem abre a porta do `adb reverse`. O emulador morreu de SIGKILL, sem salvar snapshot. Corrigido medindo em vez de supondo: reboot, estado durável conferido (os quatro sha256 = baseline da V1-PR4, `files-index.json` incluído), e então `emu kill` de verdade. **Regra**: antes de matar quem escuta a 8081, olhar QUEM é — e desfazer o `adb reverse` primeiro |
| **76** | **D** | Tamanho dos ícones de inválido: a moldura desenha **20** (e a legenda dela repete "ícone de 20"), a tabela §6.4 dá **28** aos dois (`sem conteúdo`: "placeholder · S3 sem corpo, **linha do S2 com inválidos**"), e o prompt manda 28. Ficou **28**, pelo critério da E9 ("o tamanho é propriedade do componente; **a tabela** vence") e da E12. Efeito colateral medido: o rótulo do inválido começa 8 dp à direita do rótulo do válido, porque o ícone é 8 dp mais largo — os quatro rótulos de tipo VÁLIDO seguem no mesmo x. Item do aceite visual da V1-PR7 |
| **77** | **A** | Com `numColumns={2}` e contagem **ímpar**, o último item ocupa a linha inteira (`flex: 1` sem par): `song-11` mede 1089,8 dp contra 536,9 dos outros. Comportamento do `FlatList`, **idêntico no antes e no depois** (medido nos dois), não introduzido por esta PR e fora do escopo dela. A moldura `S2-invalidos` mostra só até o item 10 e não tem o que dizer sobre isso |
| **78** | **T** | O `content-desc` do item muda de forma: o chip com contorno era um nó de texto e some; entram o rótulo do tipo no fim e, nos inválidos, a frase do motivo — `"9, [FIXTURE] Sem corpo (no-body), nada para mostrar — edite na versão web  ·  Fixture A6, vazia"` contra `"9, [FIXTURE] Sem corpo (no-body), sem conteúdo  ·  Fixture A6, —"`. Esperado; registrado porque o A20/G6 da V1-PR7 vai ler o novo. O mesmo que a div. 69 registrou no S1 |
| **79** | **D/A** | A sublinha do inválido **mantém** artista e nota depois do motivo (`"nada para mostrar — edite na versão web  ·  Fixture A6"`), onde a moldura mostra só a frase. Razão: §1 ("não muda dado") — a sublinha é o único lugar do S2 onde o artista e a `notes` da posição aparecem, e um inválido pode ter nota. Decisão de código, declarada |

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR5-A-estados-antes-depois.txt` | 683 | `8fbd32df14f50b233ba385bb2cd16c99ee0ed6ea9cd724933c127efc0c0d3472` |
| `V1-PR5-B-gates.txt` | 199 | `782fba82784a73ca60cc9769cada0f0209b5e1683fe8018c064a1a91765ca403` |
| `V1-PR5-C-aparato-e-prod.txt` | 116 | `78ebd895657e8d5bf0086761458f015d7d5fd3bc71cb55c0ca878510c2d1779c` |
| `V1-PR5-D-moldura-para-token.txt` | 87 | `31708d4eeb14cfab37f8b181af68fab2b362904526574a299429ecbebd5d1dd2` |
| `dumps-antes/SHA256SUMS.txt` | 10 | `8ea140e9b63e0d85a4c3ae6acf8f3ad3ff85738b7462fe14e29e0652796ccdf6` |
| `dumps-depois/SHA256SUMS.txt` | 18 | `00846bea8f5f7c3eca0533a80624a815effd25b7d87324a7e5ae315c5e7c73eb` |
