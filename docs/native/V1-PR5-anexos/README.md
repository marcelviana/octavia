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

## Itens para o ACEITE VISUAL da V1-PR7, no Tab S6

A V1-PR4 abriu esta lista com **um** item (os três indicadores de garantia que
não têm moldura nenhuma: `parcial`, `nunca sincronizada` e `baixando`). A
V1-PR5 acrescenta **dois**. Os três têm a mesma forma: o gate prova o markup, o
dump prova a geometria, e **nenhum dos dois prova que se lê** — isso é do
Marcel, no painel real, e não há frame com que comparar.

| # | item | por que só o olho decide | referência de tela |
|---|---|---|---|
| **AV-1** (V1-PR4) | os indicadores `parcial` (arco proporcional a n/m), `nunca sincronizada` e `baixando`, no cartão do S1 | **não têm moldura**: foram implementados pela tabela §6.4 e pela regra §6.1, nunca desenhados. O `parcial` é o estado mais comum da conta real do Marcel | `V1-PR4-anexos/dumps-depois/S1c-indicadores.png` |
| **AV-2** (V1-PR5) | a **tab de quatro cordas** no chip de tipo do S2, em 20 dp | é a única exceção declarada da família (§6.3) e o S2 é o **único lugar do app** onde ela aparece. O `gate:icones` prova que o desenho é o do `telas.html` e que as cordas são quatro (commit 1) — mas gate mede markup, não legibilidade. A §6.3 mediu que **seis** cordas em 20 dp dariam vão de 1,85 (3,5 px no painel), "no limite do aliasing", e a exceção existe para fugir disso: quatro dão **2,9** (5,44 px). O que o olho tem de dizer é se esses 5,44 px bastam — e se a tab ainda se distingue das outras três, que é o que a §6.3 aposta ("o que distingue é o traste enfiado na corda, e isso sobrevive em quatro") | `dumps-depois/S2.png` — os itens 5, 7 e 8 |
| **AV-3** (V1-PR5) | os placeholders `sem-conteudo` e `tipo-desconhecido` a **28 dp** ao lado de rótulos de 13, na mesma coluna em que o item válido usa 20 | decisão do Marcel de 2026-09-13 (E13.b): a moldura e a legenda dela dizem 20, a §6.4 e o prompt dizem 28, e ficou 28. O efeito é **8 dp de desequilíbrio entre o ícone do inválido e o do válido**, medido e aceito — os quatro rótulos de tipo VÁLIDO seguem alinhados no mesmo x. Se o desequilíbrio incomodar no painel, voltar a 20 é uma linha | `dumps-depois/S2-invalidos-rolado.png` — os itens 9, 10 e 11 |

## Decisões do Marcel sobre a entrega (2026-09-13)

As cinco perguntas da entrega, respondidas:

1. **`buscar-musica`** no botão da barra — mesmo botão do S1, a §6.4 o nomeia
   para o S2, e o critério da E12 já estava fixado. **Errata na moldura**:
   E13.a.
2. **Pelo `reason`** do contrato, e a causa é a leitura certa: o design desenhou
   a partir de uma **captura**, e a captura mostra dois inválidos lado a lado
   sem dizer por quê. Só o contrato sabe. **Errata na moldura**: E13.c.
3. **28 dp** nos placeholders — mas vai ao **aceite visual** da V1-PR7 no Tab
   S6 como item (AV-3), não como nota. **Errata na moldura**: E13.b.
4. O item **sem content no cache** fica como está (sem ícone, "—") e se decide
   **com o S4 na V1-PR6**: o `unavailable` não é inválido (pode chegar no
   próximo sync) e o S4 tem o mesmo chip de tipo.
5. A sublinha do inválido **mantém artista e nota** — é o único lugar onde a
   `notes` da posição aparece, e a §1 diz que o V1 não muda dado.

Mais: o **extra do commit 1 está justificado** (div. 71, o oitavo caso do
§9.1), e a **div. 75 vai para o `LOGS-OCTAVIA.md`** junto com as outras regras
operacionais do bloco.

## Divergências — 71 em diante

*(Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** teste/instrumento.)*

| # | Origem | O que é |
|---|---|---|
| **71** | **T** | **O oitavo caso do padrão do §9.1** — ver abaixo, fora da tabela: é material de `LOGS-OCTAVIA.md`, não cabe numa linha |
| **72** | **D** | O botão da barra: a moldura desenha o `busca` puro (lupa), e a §6.4 dá o `buscar música` (lupa + nota) ao "S1 (todos), **S2**". Ficou o **`buscar-musica`** — o mesmo que a V1-PR4 pôs no S1, pelo critério da E12 (a regra vence a moldura). O texto "Buscar na biblioteca" **não muda** (§1). **Decidido pelo Marcel** — errata E13.a |
| **73** | **D/A** | A moldura dá `tipo-desconhecido` ao item 10, que na fixture é `[FIXTURE] Objeto sem a chave (no-key)` — e o contrato do core (`content-contract.ts`) classifica `no-key` como falta de **corpo**, regra (c), não como tipo fora do enum, que é a regra (d) e só ela vira `unknown-type`. O código decide pelo **`reason`**, então o item 10 leva `sem-conteudo` e o 11 (`Piano`) leva `tipo-desconhecido`. A moldura fica visivelmente diferente no item 10, de propósito. **Decidido pelo Marcel** — errata E13.c, com a causa: o design desenhou a partir de uma captura, e a captura mostra dois inválidos lado a lado sem dizer por quê |
| **74** | **D** | A song cujo `content_id` **não está no cache** (`loading` / `unavailable`, o caso do A8) não tem moldura: não é `invalid`, pode chegar no próximo sync, e o prompt lista só os dois inválidos. Ficou **sem ícone e com "—"** na coluna de tipo, como hoje. É o único item do S2 sem ícone nenhum. **Decidido pelo Marcel**: fica assim, e se decide **com o S4 na V1-PR6**, que tem o mesmo chip de tipo |
| **75** | **T** | **Erro meu, e achado operacional**: quem escutava a 8081 no host era o **próprio qemu**, não o Metro — `adb reverse` abre a porta do lado do host no processo do emulador. **Material de `LOGS-OCTAVIA.md`** (decisão do Marcel); por extenso abaixo, fora da tabela |
| **76** | **D** | Tamanho dos ícones de inválido: a moldura desenha **20** (e a legenda dela repete "ícone de 20"), a tabela §6.4 dá **28** aos dois (`sem conteúdo`: "placeholder · S3 sem corpo, **linha do S2 com inválidos**"), e o prompt manda 28. **Ficou 28** (decisão do Marcel, errata E13.b), pelo critério da E9 ("o tamanho é propriedade do componente; **a tabela** vence") e da E12. Efeito colateral medido: o rótulo do inválido começa 8 dp à direita do rótulo do válido, porque o ícone é 8 dp mais largo — os quatro rótulos de tipo VÁLIDO seguem no mesmo x. **Item AV-3 do aceite visual da V1-PR7** |
| **77** | **A** | Com `numColumns={2}` e contagem **ímpar**, o último item ocupa a linha inteira (`flex: 1` sem par): `song-11` mede 1089,8 dp contra 536,9 dos outros. Comportamento do `FlatList`, **idêntico no antes e no depois** (medido nos dois), não introduzido por esta PR e fora do escopo dela. A moldura `S2-invalidos` mostra só até o item 10 e não tem o que dizer sobre isso |
| **78** | **T** | O `content-desc` do item muda de forma: o chip com contorno era um nó de texto e some; entram o rótulo do tipo no fim e, nos inválidos, a frase do motivo — `"9, [FIXTURE] Sem corpo (no-body), nada para mostrar — edite na versão web  ·  Fixture A6, vazia"` contra `"9, [FIXTURE] Sem corpo (no-body), sem conteúdo  ·  Fixture A6, —"`. Esperado; registrado porque o A20/G6 da V1-PR7 vai ler o novo. O mesmo que a div. 69 registrou no S1 |
| **79** | **D/A** | A sublinha do inválido **mantém** artista e nota depois do motivo (`"nada para mostrar — edite na versão web  ·  Fixture A6"`), onde a moldura mostra só a frase. Razão: §1 ("não muda dado") — a sublinha é o único lugar do S2 onde o artista e a `notes` da posição aparecem, e um inválido pode ter nota. Decisão de código, declarada |

### Div. 71, por extenso — o oitavo caso de "instrumento com escopo menor do que parece"

> **Material de `LOGS-OCTAVIA.md`.** O padrão vive hoje na §9.1 do
> `V1-PR3-PRECHECK.md`, com a instrução de migrar no encerramento do bloco; a
> linha do oitavo caso já está lá, e este é o texto que o LOGS vai querer.

| o instrumento mede | eu li como se medisse |
|---|---|
| o `normal` dos 34 desenhos, contra o anexo D do V1-PR3-PRECHECK | o mapa de ícones inteiro |

O `gate:icones` nasceu na V1-PR4 conferindo três coisas: os **nomes** contra a
§6.4, os **desenhos** contra o anexo D, e a **tinta** por token. Passa 0
acusações desde então, e eu li esse 0 como "o mapa está provado". Não está: o
`Desenho` tem quatro campos — `normal`, `ativo`, `inerte`, `em20` — e o gate só
cobrava o primeiro, porque só o primeiro está no catálogo que ele lê.

O que separa este caso dos sete anteriores, e o que o torna o mais barato de
todos que já não tinha sido evitado: **o próprio script dizia isso por escrito**.
A nota da regra 2, no cabeçalho, em prosa, desde a V1-PR4:

> "Os estados `ativo`/`inerte`/`em20` vêm da folha de estados e do `telas.html`,
> não do catálogo, e por isso **não são cobrados contra o anexo D**."

O instrumento documentava a própria cegueira. Nos sete casos anteriores era
preciso medir para descobrir o buraco; neste bastava **ler o cabeçalho do
arquivo que se estava prestes a rodar**. Ninguém tinha lido — eu inclusive, na
primeira passada, quando rodei o gate e li o 0.

Por que doía aqui e não antes: o `em20` existe desde a V1-PR3 e **nenhuma tela o
renderizava**. A §6.3 declara a tab de quatro cordas como a única exceção da
família de ícones, e o chip de tipo do S2 é o primeiro e único lugar do app que
a põe em tela. A PR que estreia o desenho é exatamente a PR em que a ausência de
gate custa alguma coisa.

Fechado no commit 1, com duas medições e nenhuma afirmação:

1. **markup verbatim** — o `em20` do `tab` contra o `<svg width="20">` da tab no
   `telas.html`, que é o único markup congelado que tem esse desenho (o catálogo
   do anexo D só traz a de seis cordas). Achado por **forma, não por posição**:
   entre os 47 `<svg width="20">` do arquivo, a tab é o único com dois
   `<rect rx="1.7">` — os trastes;
2. **contagem de cordas**, 4 em 20 dp e 6 nos outros.

**Linhagem da contagem.** Contar cordas por `y` **distinto** dos comandos `M`, e
não por número de comandos, não é detalhe de implementação: vem direto da regra
da Fase 1 do design, §6.1, *traço interrompido* — "o vão se mede na **forma**,
não no comando". Uma corda partida pelo traste são dois `h` no mesmo `y`, e é
uma corda só, pela mesma razão pela qual o vão de 0,4 se corta em ∓ 0,4 ∓ 0,875:
o que conta é o que o olho vê, não o que o `d` escreve. Contar comandos daria 6
onde a §6.3 diz 4, e o gate acusaria o desenho certo.

Controle negativo: o sexto defeito plantado no `IconesFalso.ts` é o erro que a
§6.3 existe para impedir — esquecer a exceção e servir em 20 dp o desenho dos
outros tamanhos. Acusa oito vezes (três elementos do `telas.html` somem, quatro
entram, e a contagem dá 6 onde a §6.3 declara 4): de 9 para **17** acusações,
exit 1.

**Extra declarado** (antes de commitar, como manda o rito): estender o gate não
estava na lista fechada da PR. Entra porque a regra 1 do prompt manda confirmar
que os gates leem o que a PR introduz, e a confirmação achou o buraco — fechá-lo
é a resposta honesta à instrução. A regra 4 é aditiva: não toca nenhuma das três
existentes, e o `dados.ts` real dá 0 acusações antes e depois.

### Div. 75, por extenso — quem escuta a 8081

> **Material de `LOGS-OCTAVIA.md`**, junto com as outras regras operacionais do
> V1 (o avião provado por `ping`, o store durável medido fora do boot, o
> `screencap` depois da linha de logcat que define o estado).

No encerramento do aparato, `pkill -f "expo start"` matou o Metro, mas a porta
8081 continuou ocupada. `lsof -ti:8081 | xargs kill -9` liberou — e matou o
**emulador**. Quem escutava a 8081 **no host** não era o Metro: era o próprio
`qemu-system-aarch64`, porque **`adb reverse tcp:8081 tcp:8081` abre a porta do
lado do host no processo do emulador**. O `-9` levou o AVD sem salvar snapshot.

A regra, nos dois tempos:

1. **desfazer o `adb reverse` antes de mexer na porta** (`adb -s <serial>
   reverse --remove-all`) — sem o reverse, a 8081 fica livre sozinha;
2. **olhar QUEM escuta antes de matar** (`lsof -ti:8081 | xargs ps -o
   pid,command -p`), nunca `kill -9` num PID que veio de `lsof` sem ler o
   comando.

O custo real desta vez foi zero — o estado durável foi medido depois de um
reboot e é o da baseline (anexo C6) —, mas o mesmo descuido num AVD com dev
client recém-instalado desfaz o `install -r` e custa a reinstalação inteira,
que é o que a V1-PR3 mediu em minutos. **A correção não foi supor que estava
tudo bem: foi religar, medir os quatro sha256, e só então matar o emulador
direito** (`emu kill`, que levou ~20 s salvando o snapshot — div. 57).

## CI — `native.yml`

**A referência é 9m16s** — run `34777518972`, a V1-PR4, head `cb31a40`. Os
13m18s do run `34771766466` (V1-PR3) **não são referência**: aquele run
compilou o `react-native-svg` do zero. Esta PR não acrescenta módulo nativo
nenhum — só toca `apps/native/src/screens/IndexScreen.tsx`,
`apps/native/scripts/` e `docs/` —, então **se subir para perto de 13, é cache
frio do Gradle, não módulo novo**, e não há o que investigar.

| run | job `android-debug-apk` | Gradle `assembleDebug` | `Post cache` | tarefas |
|---|---|---|---|---|
| 34771766466 (V1-PR3, compilou o SVG do zero — **não é referência**) | 13m18s | 11m34s | **21s — SALVOU** | — |
| 34777518972 (**referência**, V1-PR4, head `cb31a40`) | **9m16s** | 7m47s | 0s — hit | 621 : 621 executed |
| 34780911672 (**esta PR**, head `4cb3b22`) | **11m55s** | **10m15s** | 1s — hit | **621 : 621 executed** |

**11m55s, contra 9m16s da referência — e não é cache frio.** O +2m39s do job está
quase todo no Gradle (+2m28s), e o Gradle fez **exatamente o mesmo trabalho**:

- **mesma chave de cache**, byte a byte — `gradle-Linux-0df0eb47967ce576…` nos
  dois runs, e os dois deram **hit** (o `Post Run actions/cache` levou 0–1 s,
  porque não havia o que salvar). O que "cache frio" parece está no run da
  V1-PR3: lá o `Post cache` levou **21 s**, salvando;
- **621 actionable tasks : 621 executed** nos dois, e 801 linhas `> Task :` nos
  dois;
- **27** tarefas de `externalNativeBuild`/CMake e **38** tarefas
  `:react-native-svg` nos dois. O SVG recompila em todo run — o cache do
  `actions/cache` guarda o `~/.gradle` baixado, não a saída compilada do
  módulo —, e recompilou igual nos dois.

Conclusão, com o número na mão: **variação de runner** num passo que é
CPU-bound (NDK/C++), não módulo novo e não cache frio. Esta PR não toca
`pnpm-lock.yaml`, não acrescenta dependência e mexe em um `.tsx`, em
`apps/native/scripts/` e em `docs/`. Nada a investigar.

Nota de precisão sobre a referência: os **13m18s** citados para a V1-PR3 são o
**job inteiro**; o `assembleDebug` de lá foi **11m34s**. O Gradle desta PR
(10m15s) está abaixo dos dois números da PR3 e acima dos 7m47s da PR4.

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR5-A-estados-antes-depois.txt` | 683 | `8fbd32df14f50b233ba385bb2cd16c99ee0ed6ea9cd724933c127efc0c0d3472` |
| `V1-PR5-B-gates.txt` | 199 | `782fba82784a73ca60cc9769cada0f0209b5e1683fe8018c064a1a91765ca403` |
| `V1-PR5-C-aparato-e-prod.txt` | 116 | `78ebd895657e8d5bf0086761458f015d7d5fd3bc71cb55c0ca878510c2d1779c` |
| `V1-PR5-D-moldura-para-token.txt` | 87 | `31708d4eeb14cfab37f8b181af68fab2b362904526574a299429ecbebd5d1dd2` |
| `dumps-antes/SHA256SUMS.txt` | 10 | `8ea140e9b63e0d85a4c3ae6acf8f3ad3ff85738b7462fe14e29e0652796ccdf6` |
| `dumps-depois/SHA256SUMS.txt` | 18 | `00846bea8f5f7c3eca0533a80624a815effd25b7d87324a7e5ae315c5e7c73eb` |
