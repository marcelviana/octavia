# V1-ENCERRAMENTO.md — encerramento do bloco V1 (iconografia + redesenho das seis telas)

> **Data**: 2026-09-14. **Fonte do bloco.** Este arquivo é o que se cita sobre o V1; onde
> ele divergir de qualquer rastro de sessão, ele vence (regra permanente do `CLAUDE.md`).
> **Base**: `6a9315d` (merge da #290, último commit antes do bloco). **Topo**: `72bdb38`
> (merge da #299). **Sete PRs mergeadas** — #293 a #299 — mais esta.
> **Árvore de trabalho desta PR**: `git worktree add ../octavia-v1pr7 -b v1/pr7-aceite origin/main`.
> **Todo número aqui é `[medido]`** salvo marcação `[hipótese]`.
> **A V1-PR7 não toca uma linha de `apps/native/**`**: é PR de aceite e de registro.

---

## 1. Pergunta do bloco e resposta

**Pergunta**: *a tela 1 do Octavia nativo pode sair do estado "funciona" para o estado
"tem forma" — iconografia própria, seis telas redesenhadas — sem perder nenhum dos 22
critérios de aceite do PRD, e sem tocar o comportamento?*

**Resposta: sim, e está medido.** As seis telas (S0 login, S1 setlists, S2 índice, S3
palco, S4 busca, S5 fim de setlist) foram redesenhadas contra 22 molduras congeladas, com
**37 ícones SVG próprios**, e o **G1 fechou com diff vazio** nos nove módulos não-visuais
do app e nos 25 arquivos de `packages/core/src`, do primeiro commit do bloco ao último.
Dos 22 aceites do PRD, **16 rodaram de novo** (11 no AVD, 5 no Tab S6) e **6 foram
dispensados** pelo G1, com o argumento de cada um escrito na §4.

**A ressalva que a resposta exige, e que é o achado mais grave do bloco**: o aceite
encontrou que a promessa *"garantida offline · todos os arquivos neste aparelho"* **pode
ser falsa** — e falsa na direção perigosa. Nenhuma das duas causas é do V1 (as duas vivem
em módulos que o G1 protegeu com diff vazio o bloco inteiro), mas **o V1 aumentou a
aposta**: deu à promessa ícone próprio e a frase "todos os arquivos neste aparelho".
É o **bloqueante** da §11.

---

## 2. Arco — PR × escopo × merge × prova principal × controle negativo

| PR | escopo | merge | prova principal | controle negativo |
|---|---|---|---|---|
| **#293** V1-PR0 | o pre-check do bloco entra no repositório, com as 26 divergências e as quatro decisões do Marcel | `45029dc` (squash) | o `V1-PRECHECK.md` inteiro; a **D-V1-1** contraria a recomendação do próprio pre-check e o eixo está registrado | — (PR de documento) |
| **#294** V1-PR1 | os cinco alvos < 48 dp, os três `testID` do S1, a geometria das bordas do palco, o mock do aceite | `26452f9` | G5 de 5 reprovações → 0; a borda deixa de cobrir o `auto-scroll` | os dumps ANTES, com os cinco alvos e a borda transbordando 84,0 dp |
| **#295** V1-PR2 | congelar o `DESIGN-V1`: 22 molduras, 32 ícones, tokens conferidos | `6697285` | o `SHA256SUMS` do design congelado | — (PR de documento) |
| **#296** V1-PR3 | `react-native-svg`, os 34 desenhos, o componente `Icone`, a barra do palco só ícone | `2db81ce` | os sete controles com `content-desc` e sem `<Text>`; APK com o `.so` do SVG | `unzip -l` do APK ANTES: 0 ocorrências de svg |
| **#297** V1-PR4 | o S1 nos seis estados do design | `9a7fa6e` | os seis estados capturados; a E12 (garantida em tinta neutra) | os dumps ANTES dos seis |
| **#298** V1-PR5 | o S2 nas duas molduras — índice e inválidos | `1ba1557` | o chip de tipo, os placeholders de 28, a régua | o `gate:icones` estendido ao `em20`, que reprovava antes |
| **#299** V1-PR6 | S0, S4 e S5 pelas seis molduras restantes | `72bdb38` | o display de 52 do S5, as marcas, a regra de N grande | os dois gates estendidos, com CN de 17→18 e 3→4 |
| **V1-PR7** | **este encerramento**: regressão, aceite nos dois aparelhos, veredito visual, migração da §9.1 | — | os 22 aceites, §4 | os controles negativos dos sete gates, §6 |

**O bloco teve três documentos de entrada**, não um: o `V1-PRECHECK.md` (#293), o
`DESIGN-V1/README.md` congelado (#295) e o `V1-PR3-PRECHECK.md` (dentro da #296). O
terceiro existiu porque a decisão de biblioteca (D-V1-1) mudou a técnica depois do
pre-check do bloco.

---

## 3. O que o bloco entregou — tela a tela

| tela | o que era | o que ficou | onde |
|---|---|---|---|
| **S0** login | marca em PNG com retângulo, campos sem ícone, botão inativo por `opacity: 0.4` | marca de 340 dp, ícones de 20 nos dois campos, rótulos "Email"/"Senha" virando `accessibilityLabel`, botão inativo em tinta `lineInfo` (E3) e `enabled=false` na árvore | V1-PR6 |
| **S1** setlists | lista sem `testID`, indicador ✓ ◔ ✗ em texto, "Baixar" por opacidade | os três cartões com `testID`, indicadores `garantida` (arco neutro) · `parcial` (arco proporcional) · `nunca-sincronizada` · `baixando` (acento), banner de falha com alvo de 48 dp | V1-PR1 + V1-PR4 |
| **S2** índice | itens sem chip de tipo, inválidos sem desenho | chip de tipo nos quatro tipos do enum (Letra · Cifra · Tab · Partitura), placeholders de 28 dp para `sem-conteudo` e `tipo-desconhecido`, régua de seção | V1-PR5 |
| **S3** palco | sete controles com rótulo `<Text>`, seis deles andando 28,4 dp entre texto e PDF, bordas cobrindo o `auto-scroll` | sete controles **só ícone** de 66 × 66 dp, largura fixa, `content-desc` nos sete, motivo do inerte revelado **ao toque** por 2500 ms na linha acima da barra | V1-PR1 + V1-PR3 |
| **S4** busca | `fechar-busca` e `apagar` abaixo de 48 dp, corpo vazio com o campo em branco | os dois alvos em 48 dp, corpo com `buscar música` de 28 e a frase de escopo, chip de rede, régua de resultados, `nada-encontrado` | V1-PR1 + V1-PR6 |
| **S5** fim | tela de texto | display de 52, fileira de marcas proporcional (34 dp em N=8, 10 dp em N=60, com piso de 6 e folga que encolhe até 1), acento nas marcas | V1-PR6 |

**O que ficou de fora, e por quê**

1. **A barra SUPERIOR do S3 e do S5.** A §1 do design congela a de cima ("no S3 mexe só na
   barra inferior"). As molduras as desenham em 88 dp e mono; o app as tem em 64 e Raleway,
   **iguais entre si**. Mudar só a do S5 abriria 24 dp e uma troca de família entre duas
   telas que o músico atravessa deslizando. **Errata E14.e** — as duas mudam juntas, ou não
   mudam.
2. **As quatro propostas da §8 do design** — chevrons das zonas de toque, os cinco
   desabilitados, ordenação do S1 por data, marca em SVG. Nenhuma foi decidida. §11, item 4.
3. **O tema claro das telas de lista.** O V1 tematizou o palco; S1, S2, S4 e S5 continuam
   desenhadas no escuro. E as três reprovações de contraste do tema claro (`accent`,
   `error`, `offline`) são **herdadas e não corrigidas** — o design as declara na §3.
4. **O `cor.offline` continua com ZERO usos**: o ponto de offline do palco é
   `backgroundColor: dark.offline` estático, que no tema claro dá 2,44:1. Achado do
   pre-check (div. 8), não corrigido.
5. **Texto.** A §1 do design proíbe mudar texto, e nenhuma string de UI mudou por decisão
   de forma. As que mudaram foram por decisão explícita (o corpo do `S4a-vazio`, que
   reaproveita a string que o `S4b` já mostrava).

---

## 4. Os 22 aceites do PRD — quais rodaram de novo, onde, e o resultado

Instrumento, aparelhos e verbatim: `V1-PR7-anexos/V1-PR7-A-regressao-avd.txt` (AVD) e
`…-B-aceite-tabs6.txt` (Tab S6).

### Os 16 que rodaram de novo

| # | onde | resultado | prova em uma linha |
|---|---|---|---|
| **A2** | Tab S6 | ✓ | `api status=401 path=/api/setlists n=2` → `auth-failure` → `login-screen`; o servidor 401 viu **duas** requests e nunca uma terceira |
| **A3** | AVD (mock 429) | ✓ | `ratelimit retry-after=30 family=setlist-read`; **35 s, uma request**; "servidor ocupado · tente em instantes" |
| **A4** | AVD (mock) + **Tab S6 (prod)** | ✓ **com errata** | prod, N=63: exatamente **2**. Mock, N=0: **2**, contra **1** que a fórmula do PRD prevê — §5 |
| **A5** | AVD | ✓ | avião provado por `ping`, `sync skip reason=offline`, `song-60` alcançada, **0** requests |
| **A6** | AVD (fixture) | ✓ | os quatro placeholders no palco, nunca vazio; chips "vazia", "?" e "—" no índice |
| **A8** | AVD (fixture) | ✓ | `song-12 "(sem título), indisponível, —"` na posição 12, com rótulo, sem buraco |
| **A10** | AVD (fixture) | ✓ **parcial declarado** | indicador recalculado nos três estados; **`prefetch promote n=1`** medido vivo. A metade "download em background" **não** foi reverificada — §4 (dispensa) |
| **A11** | AVD | ✓ | `search q=5 n=2` acha "Águas" por "aguas"; "nada encontrado para “aguasxablau”"; `search close restore n=1/8` → `stage restore n=1/8` |
| **A12** | AVD (fixture) | ✓ | mesmo content em 1 e 9, cada um com a sua `Nota:` |
| **A14** | AVD | ✓ | borda avança e volta; salto 1→47 em **2 toques**; `end-of-setlist n=9`; rotação preserva "47 DE 60" |
| **A15** | AVD + **Tab S6** | ✓ | no device: `autoscroll on t=36 36 39 41 37` (n=5, < 100 ms), zoom 18→40 sem re-quebra, `theme=light` em 1 toque, os três inertes com motivo ao toque |
| **A16** | **Tab S6** | ✓ | **22m48s** de `SCREEN_BRIGHT_WAKE_LOCK ws=WorkSource{10292}` contra um `screen_off_timeout` de 30 s |
| **A17** | **Tab S6** | ✓ | setlist de 60: n=59, p50=74, **p95=81 ms**, max=87, zero acima de 100 |
| **A19** | AVD (mock) | ✓ | com cache: banner + lista permanece. Sem cache: "FALHA NO SERVIDOR" + botão de 222,2 × 56,0 dp |
| **A20** | gate | ✓ | `gate:a20` 72 literais, 0 acusações; CN 4 acusações, exit 1 |
| **A21** | AVD (mock) | ✓ | `sync fail stage=content page=2 code=INTERNAL_ERROR status=500`, e **os cinco arquivos do store idênticos byte a byte** |

### Os 6 dispensados pelo G1 — com o argumento de cada um

O **G1 fechou com diff vazio** de `6a9315d` a `72bdb38` sobre `api.ts`, `store.ts`,
`sync.ts`, `net.ts`, `files.ts`, `prefetch.ts`, `session.ts`, `firebase.ts`, `log.ts` e os
**25 arquivos** de `packages/core/src`. Os seis abaixo vivem inteiros ali dentro.

| # | argumento | e o que o aceite viu de raspão |
|---|---|---|
| **A1** | auth e rede: `session.ts`, `firebase.ts`, `api.ts` | medido de graça no sync de prod do Tab S6: **0** chamadas a `/api/auth/session`, `/api/proxy`, `/api/profile` |
| **A7** | sync e cache: `sync.ts`, `store.ts` | `cache write kind=setlists n=2 invalidated=0` no device |
| **A9** | arquivo: `files.ts` | o download do AV-1 devolveu `ad2eae09…`, **idêntico** ao arquivo que estava em disco |
| **A13** | pdf: `files.ts` + `react-native-pdf` | `pdf-render pages=12 src=disk` no AVD em avião, e `pages=5` no device |
| **A18** | `notes` da song | visto vivo no A12: `"Nota: BIS: repetir so o refrao, meio tom acima"` |
| **A22** | `sortBy=recent` | visto vivo no A4: `sortBy=recent` nas duas páginas de content do mock |

**O A2 NÃO está nesta lista, e a ressalva do pre-check procede**: o G1 dispensa a *lógica*,
não a *tela* — e a tela em que o A2 termina é o **S0, que a V1-PR6 redesenhou**. Ele rodou
no Tab S6.

**O que NÃO foi reverificado, declarado**: a metade "arquivos baixados em background sem
abrir" do A10 (é `prefetch.ts`, e o N1 a mediu no device) e o `placeholder kind=not-string`
(a fixture do A6 cobre as regras (b), (c)-sem-chave e (d), não (c)-chave-não-string).

---

## 5. As duas erratas do PRD que o bloco produziu

### 5.1 A4 no conjunto vazio — `1 + max(1, ⌈N/100⌉)`

O A4 diz verbatim: *"Abertura online: exatamente **1 + ⌈N/100⌉** requests a `/api/*`"*.
Com `N = 0` a fórmula dá **1**; o app faz **2**, e está certo — **descobrir que `N = 0`
custa a request que devolve `N`**. Levantada no `V1-PRECHECK.md` §7.4 (div. 25); **medida
nesta PR**, contra o mock com biblioteca vazia:

```
OCTAVIA: api status=200 path=/api/setlists n=1 ms=435
OCTAVIA: api status=200 path=/api/content  n=1 ms=65
OCTAVIA: sync ok setlists=0 content=0 pages=1 t=584
total de requests no mock = 2
```

| | fórmula do A4 | o que o app faz | certo |
|---|---|---|---|
| N = 0 | **1** | **2** | o app |
| N = 63 (principal) | 2 | 2 | ambos |
| N = 67 (audit) | 2 | 2 | ambos |
| N = 140 | 3 | 3 | ambos |

Leitura correta: **`1 + max(1, ⌈N/100⌉)`** — "uma de setlists mais **pelo menos uma** de
content".

### 5.2 A15 — o motivo do controle inerte aparece AO TOQUE

O A15 diz *"auto-scroll … desabilitado com motivo em PDF"*. A V1-PR3 tirou a palavra de
dentro do controle: a forma permanente do inerte é a do **ícone** (tinta `lineInfo` e
desenho amputado, §6.2 + E3), e o motivo é revelado **ao toque**, por `MOTIVO_MS = 2500`,
na linha acima da barra. Medido nesta PR, com o dump tirado sem `sleep`:

```
$ tap no auto-scroll inerte
OCTAVIA: autoscroll disabled kind=pdf
a linha de gesto ("pinça para zoom · arraste para mover · deslize para virar a página")
é substituída por "auto-scroll só em texto", e volta em 2500 ms
```

O `accessibilityLabel` carrega o motivo **o tempo todo** ("Rolagem automática,
indisponível: só em texto"), então o leitor de tela nunca depende do toque.

### 5.3 O `PRD-TELA-1.md` deve ser editado?

**Sim, e não nesta PR.** As duas erratas mudam o texto de dois critérios de aceite, e o PRD
é o documento que a tela 2 vai herdar como contrato. Editá-lo aqui misturaria o veredito do
V1 com a redação do contrato da tela 1 — e o encerramento é o lugar de registrar, não de
reescrever. **§11, item 2 — e com data: entra junto com a PR de conserto da garantia
offline, no mesmo trabalho.** O `PRD-TELA-1.md` não foi tocado por nenhuma das oito PRs
do bloco, e enquanto não for editado ele afirma duas coisas falsas.

---

## 6. Os gates — os seis mais o `gate:icones`

| gate | o que mede | onde nasceu | onde vive | resultado no bloco |
|---|---|---|---|---|
| **G1** | diff **vazio** nos nove módulos não-visuais do app e em `packages/core/src` | `V1-PRECHECK.md` §7.2 | `V1-PR7-anexos/instrumentos/g1.sh` | **✓ vazio** de `6a9315d` a `72bdb38` |
| **G2** | `testID`: **antes ⊆ depois** | idem | `apps/native/scripts/g2g3.sh` (versionado na V1-PR3) | **✓ 40 → 43**, nenhum sumiu; os três novos: `s4a-vazio`, `setlist-<id8>`, `linha-motivo` |
| **G3** | as linhas `log(` **idênticas**, arquivo a arquivo | idem | idem | **✓ 50 → 50** |
| **G4** = `gate:a20` | nenhum literal de UI em inglês, **incluindo `accessibilityLabel`/`Hint`** | o A20 do N1; estendido em `V1-PRECHECK.md` §5.3, na V1-PR3 (labels em expressão) e na V1-PR6 (chave de objeto) | `apps/native/scripts/a20.mjs` | **✓ 72 literais, 0 acusações**; CN: **4**, exit 1 |
| **G5** | todo alvo tocável ≥ 48 dp, **descartando nós recortados pelas DUAS bordas** do `ScrollView` pai | `V1-PRECHECK.md` §7.2 + div. 21 / C2 | `V1-PR7-anexos/instrumentos/g5.mjs` | **✓ 0 abaixo de 48** em 459 alvos / 59 estados (345 no AVD, 114 no Tab S6); 17 descartados por recorte |
| **G6** | todo estado é alcançável por `resource-id` e **todo alvo tocável TEM `resource-id`** | idem | `…/instrumentos/g6.sh` | **✓ 59 estados, 0 falhas, 0 alvos sem `testID`** |
| **`gate:icones`** | o mapa de ícones contra o `telas.html` congelado: desenho, tinta por token, o `em20` da tab, e a categoria "fora do catálogo" por forma | V1-PR4 (regras 1–4), V1-PR5 (o `em20`), V1-PR6 (regra 5, a categoria inteira) | `apps/native/scripts/icones.mjs` | **✓ 37 nomes, 0 acusações**; CN: **18**, exit ≠ 0 |

**A regra que os sete produziram, e que vale mais que qualquer um deles**: *o gate vem
antes do que ele mede*. Ela pagou dois buracos em PRs consecutivas (div. 71 e 82, casos 8 e
10 do padrão — hoje em `LOGS-OCTAVIA.md`).

**Suíte, tipos e lint**, sobre `origin/main`:

```
pnpm test   →  88 passed | 4 skipped (92 arquivos)  ·  768 passed | 85 skipped (853 testes)
tsc --noEmit (apps/native)  →  limpo
pnpm lint   →  ✔ No ESLint warnings or errors
```

O `768 / 85 (853)` é exatamente a baseline do **V1-A12**: a suíte da raiz não regrediu.

---

## 7. As erratas do `DESIGN-V1` — E1 a E15

O prompt desta PR pede "as 14 erratas (E1–E14)". **São quinze**: a V1-PR6 acrescentou a
**E15** no mesmo commit em que fechou a E14, e o prompt herdou a contagem de antes (div.
106). O que cada uma significa **para quem ler o design congelado depois**:

| # | em uma linha | o que muda para quem lê o congelado |
|---|---|---|
| **E1** | a §4.1 registrava um achado que não existe | não procure o achado; ele foi medido e não está lá |
| **E2** | a moldura do controle do palco não podia ficar em `line` | a cor do contorno do controle vem do token, não da moldura |
| **E3** | a §6.2 proíbe opacidade em estado e não disse que o app a usava | **opacidade nunca é estado**: inativo é tinta (`lineInfo`) e, na árvore, `enabled=false` |
| **E4** | "origem · lucide · `<nome>`" descreve a **inspiração**, não o arquivo | nenhum `path` foi copiado do Lucide; a coluna é procedência de ideia |
| **E5** | o `accentInk` claro mede 5,89:1, não 5,90 | um dígito; o número do documento é o errado |
| **E6** | o controle do palco tem raio 14 no desenho e o token é 12 | o token vence |
| **E7** | o quarto estado chama-se "pressionado", não "inerte com motivo" | há quatro estados, e o motivo não é um deles |
| **E8** | o `log-in` do S0 não é o `log-out` "em rotação de 180°" | são dois desenhos, não um espelhado |
| **E9** | o catálogo renderiza os nove do palco a 24 dp, não aos 28 da tabela | **a tabela vence o catálogo** no tamanho |
| **E10** | as molduras usam **dezessete** números fora das escalas que a §5.2 declara respeitar | ao ler uma moldura, confira o número contra a escala; o acréscimo da V1-PR5 e o da V1-PR6 alargaram a lista |
| **E11** | o `accessibilityLabel="Octavia"` não é mais "o único do app" | são **dois** (S0 e S1f), e a V1-PR7 leu os dois no dump — o do S0 mede **340,0 dp** exatos |
| **E12** | a moldura S1b pinta `garantida` em `accentInk`; a §6.1 manda tinta neutra | **a regra vence a moldura**, e o acento fica com um significado só |
| **E13** (a·b·c) | no S2, três discordâncias entre moldura e regra | o ícone do Buscar é `buscar música`; os placeholders de inválido são **28**, não 20; **quem escolhe o desenho do inválido é o `reason` do core**, não a ordem em que a fixture os põe |
| **E14** (a…f) | no S0, S4 e S5, seis lugares em que a regra vence | "fora do catálogo" tem **cinco** habitantes; o campo do S0 é **60**; o `falha` do S0 é **20**; o título do S4b **não** leva uppercase; a barra superior do S5 fica em 64 e Raleway; e a regra de N grande tem **dois trechos**, não um |
| **E15** (a·b) | dois lugares em que o congelado **cala**, não discorda | o acento das marcas do S5 fica (**moldura que argumenta não é moldura que herda**); e o chip do S4 responde *que tipo é*, não *se está íntegro* |

**As três de maior alcance**, para quem for desenhar a tela 2: a **E3** (opacidade nunca é
estado), a **E12 + E15.a** juntas (o acento tem um dono, e a exceção precisa de argumento
escrito) e a **E13.c** (quando o desenho e o contrato discordam sobre *por que* um item é
inválido, o contrato decide). A E13.c é a única com causa nomeada: *o desenho foi feito a
partir de uma captura, e a captura mostra dois inválidos lado a lado sem dizer por quê* —
é o padrão do `LOGS-OCTAVIA.md` aplicado a uma captura de tela.

**As seis erratas confirmadas no aparelho, nesta PR**: E3 (o inerte lê como inerte no
escuro), E11 (340,0 dp), E12 (o arco neutro é "pode ir"), E13.b (os 8 dp não incomodam),
E14.b (58,2 no dump = 60 no estilo menos a borda) e E15.a (um dono só).

---

## 8. A referência de CI — faixa, não ponto

A regra é da div. 80 (V1-PR5): **uma medição não vira referência sem `n`**.

**`native` · `android-debug-apk`, o gate inteiro: 9m16s – 14m11s, mediana 11m49s, n = 12.**
O critério de alarme é **sair da faixa**, não passar de um número. A última medição do
bloco, a da #299, deu **12m32s** — dentro, a 47 s da mediana.

**O passo `Gradle assembleDebug`: 7m48s – 11m11s, n = 5** — e **n = 5 é pouco**. A faixa é
registrada para não se perder, com a ressalva explícita de que cinco pontos mal são uma
população: os 11m11s da #299 ficaram 8 s acima do teto de n=4 e isso **não é sinal de
nada**. A medição fria da V1-PR3 (11m34s) fica fora da comparação.

**O que o trabalho é, em regime**, nos runs quentes: cache com HIT na mesma chave
(`gradle-Linux-0df0eb47…`), **621 actionable tasks : 621 executed**, 38 tarefas
`:react-native-svg` e 15 de `externalNativeBuild`/CMake. O SVG recompila em todo run — o
`actions/cache` guarda o `~/.gradle` baixado, não a saída compilada do módulo.

**Esta PR não mede o CI**: ela não toca `apps/native/**`, `.github/workflows/native.yml`
nem `pnpm-workspace.yaml`, então o gate `native` **não deve disparar**. Se disparasse, seria
o achado do B8 (§11, item 3) se manifestando — o `paths` avaliado contra o diff acumulado do
PR.

**Previsão conferida, na #300**: o `native` **não disparou**. Os únicos checks foram
`CI · build` (**success, 2m25s**, run `34881780359`) e o Vercel. Isto delimita o B8 com
precisão: o gate re-roda por commit de `docs/` **só quando o PR já tocou `apps/native/**`
em algum commit** — numa PR de documento de ponta a ponta, o `paths` filtra como deveria.
A faixa do `native` fica onde estava, **n = 12**, sem medição nova.

---

## 9. Divergências do bloco — 95 a 109, numeradas nesta PR

As 1–26 estão no `V1-PRECHECK.md`; as 27–94, nos `README.md` dos anexos das PRs 1 a 6.
Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** instrumento.

| # | origem | o que é |
|---|---|---|
| **95** | **A** | **O índice EMPILHA um palco novo a cada salto, e os palcos anteriores continuam montados** — cada um emite a sua linha `rotation=`. Caracterizado do zero: 1 palco → 1 linha por giro; após 1 salto → 2 (`n=1/8` e `n=3/8`); após 2 → 3; um `back` derruba uma. **Corrige o MECANISMO da errata E6** do `LOGS-OCTAVIA.md` ("o índice desempilha o palco"): o efeito que ela descreve — não sair `stage restore` — é verdadeiro, a explicação não. Consequência de palco: cada instância retida segura o render do seu PDF |
| **96** | **D** | `placeholder kind=…`: o catálogo prometia `invalid`; o app emite `no-body`, `no-key`, `not-string`, `unknown-type`, `content-missing`, e `name=<seg>` só no `file-missing`. **Errata E8(1) do `LOGS-OCTAVIA.md`, aplicada nesta PR** |
| **97** | **D** | **`cache miss kind=…` nunca foi implementado** (`grep` → 0). Especificado no N1-D5 como parte do tripé `hit\|miss\|write`, e o tripé saiu pela metade. **Errata E8(2), aplicada — e a pergunta de produto fica aberta** (§11, item 1) |
| **98** | **A** | O `files-index.json` guarda entradas de arquivos que já não estão no disco (4 entradas, 2 arquivos). **Não mente no indicador** — o `listFiles` confere o disco pelo `localizar()` e descarta —, mas o índice cresce sem limpeza |
| **99** | **T** | **O `store()` do aparato lê metade do armazenamento**: varre `files/octavia-<uid>/files/`, o durável, e não `cache/octavia-<uid>/files/`, o purgável. O PDF de 1 página vivia lá e a baseline do bloco nunca o viu. **12º caso do padrão** |
| **100** | **P** | **Cai a premissa de que o A2 e o S0 exigem `pm clear`.** `signOutSession()` é `signOut(auth)` e não toca o store; com `EXPO_PUBLIC_DEV_FORGE_401=1` mais um servidor 401 de host, o S0 se alcança com **zero** request a prod e **zero** destruição — os quatro sha256 do store da conta principal ficaram idênticos |
| **101** | **P** | **O Tab S6 não está "com Wi-Fi desconectado" (div. 55): está online.** `ping -c 2 8.8.8.8` → `2 received, rtt avg 27,997 ms`. O que estava travado era o keyguard |
| **102** | **A** | **"Baixar esta setlist" grava no diretório PURGÁVEL.** `baixarSetlist()` chama `baixar(urls, false)` (`prefetch.ts:156`): o arquivo vai para `cache/`, que o Android apaga quando quiser e que o LRU não protege (ele protege só os `guaranteed`). A garantia durável vem só da janela de 7 dias |
| **103** | **A** | **Um arquivo de 0 byte conta como baixado, e o cartão diz "garantida offline".** `localizar()` (`files.ts:126`) pergunta se o arquivo **existe**, nunca o tamanho. Medido de ponta a ponta: download travado → arquivo de 0 B (`sha e3b0c442…`, o da string vazia) → os três cartões em "garantida offline · todos os arquivos neste aparelho" → abrir a música dá `file src=disk … bytes=0` e `pdf-error File is empty` |
| **104** | **A** | **O download trava em silêncio: sete minutos sem `download-error`, sem timeout e sem retentativa.** É a **causa** das duas anteriores; as duas são o sintoma. A causa do travamento em si **não foi medida** — aponta para `prefetch.ts` (`baixar`) e `files.ts` (`ensureFile`) |
| **105** | — | **RETIRADA.** Eu havia registrado que o `auth-failure` não derrubava a sessão de forma durável, porque uma reabertura trouxe `src=restored`. **O Marcel corrigiu: ele tinha logado antes do restart do Metro.** O `signOut` funciona. O número fica reservado para que ninguém o reaproveite, e a retirada registrada porque ela custou duas requests de prod para ser esclarecida |
| **106** | **P** | O prompt desta PR pede "as 14 erratas do DESIGN-V1 (E1–E14)". **São quinze**: a E15 entrou no mesmo commit da V1-PR6 que fechou a E14 |
| **107** | **D** | `sync fail … code=<code\|net\|nojson>`: `nojson` não existe no código; `net` sai num ramo só; a falha de rede real emite o **kind** do core, `network`, com `status=-`. **Errata E8(3), aplicada** |
| **108** | **T** | **O G1 cobre nove módulos, e o `StageScreen.tsx` não está entre eles.** Dispensar um aceite "porque está sob o G1" é ler o gate como se ele cobrisse a categoria. A V1-PR3 reescreveu o `StageScreen.tsx` inteiro, e é lá que vivem o `useKeepAwake` (A16), a rotação (A14) e o `requestAnimationFrame` do auto-scroll (A15). **Nomeada pelo Marcel ao recusar a dispensa do A16 — 11º caso do padrão** |
| **109** | **D** | **A barra do palco não marca a fronteira entre as duas famílias de controle.** Os quatro primeiros são **comportamento da tela** (auto-scroll, zoom−, zoom+, tema) e os três últimos são **navegação** (índice, busca, sair); as sete folgas são 16,0 dp iguais e os controles ocupam 582,2 dp de uma barra de 1137,8 — **49% dela fica vazia à direita**. O design **já tinha devolvido** essa metade (§5.4: "devolve 222 dp") e não lhe deu significado. Achado do aceite visual; a fronteira por função é também a **fronteira por estado** (os três que podem ficar inertes são todos do grupo da esquerda) |

**Contagem por origem**, das 15: **P** 3 (100, 101, 106) · **D** 4 (96, 97, 107, 109) ·
**A** 5 (95, 98, 102, 103, 104) · **T** 3 (99, 108, e o caso dos 58,2 dp, registrado como
instância no `LOGS-OCTAVIA.md`) · **retirada** 1 (105).

### Desvios do prompt — declarados, fora da taxonomia

| # | desvio | por quê |
|---|---|---|
| **d1** | **O Metro subiu do checkout principal, não do worktree** | a PR não toca `apps/native/**`, e a identidade foi provada por sha256 da árvore inteira antes do primeiro comando. O worktree existe e é onde a PR foi escrita; só não tem `node_modules` |
| **d2** | **O servidor 401 do A2 é script de host novo** (`instrumentos/s401.py`), não um modo novo no `aceite.py` | o `aceite.py` mora em `apps/native/src/fixtures/`, e mexer nele numa PR de aceite dispararia o gate `native` e misturaria código com veredito |
| **d3** | **A fixture de 60 posições do Tab S6 é script de host** (`instrumentos/fix60.py`) | mesmo motivo; ela recompõe **só** o `setlists.json`, a partir dos contents que já estavam no cache |
| **d4** | **O `parcial` e o `baixando` do AV-1 foram produzidos no AVD, não no tablet** | medido: na conta principal **nenhuma setlist está `parcial`** (as duas têm `need = 0`), e o único content com `file_url` já está em disco. Sem `parcial` real, não havia caminho não destrutivo no tablet — decisão do Marcel |
| **d5** | **O AV-2 e o AV-3 foram julgados por captura**, não no aparelho | o critério dos dois é **geométrico** (contagem de cordas e vão de 5,44 px; 8 dp de desequilíbrio de coluna) e o AVD tem a mesma densidade de 2,25 e o mesmo canvas — decisão do Marcel |

---

## 10. Lições do bloco

1. **O gate vem antes do que ele mede.** Pagou dois buracos em PRs consecutivas, e nas duas
   vezes o buraco estava na forma que a PR **anterior** tinha acabado de introduzir.
2. **Uma medição não vira referência sem `n`.** Os 9m16s do CI eram "o melhor de onze", não
   "o regime". O A17 desta PR obedeceu: três leituras, cada uma com o seu `n`, e nenhuma
   promovida a referência.
3. **A regra vence a moldura — mas moldura que ARGUMENTA não é moldura que herda.** A E12
   nasceu de uma legenda que dizia só "mesma cor de antes"; a E15.a sobreviveu porque a
   legenda dela dava três razões. O critério não é a autoridade do documento, é se ele
   pensou.
4. **Não apagar estado que o aparelho legitimamente tem, só para alcançar um estado de
   teste.** Vale para o `pm clear` que não foi feito (div. 100), para o PDF que não foi
   apagado do tablet, e para o `files-index.json` que guarda o que guarda. Frase do Marcel,
   2026-09-14.
5. **Instrumento com escopo menor do que parece** — treze casos, agora em
   `LOGS-OCTAVIA.md`. O bloco descobriu que o padrão vale para scripts, para capturas de
   tela e para a própria leitura de quem mede; e que a defesa não é desconfiar de tudo, é
   **escrever o escopo do instrumento ao lado do resultado**.
6. **Um gate de invariância deve errar para o lado de falar demais.** O G3 acusou uma frase
   em comentário e isso está certo: ele afirma que *nada mudou*, e mandar o autor olhar o
   diff é barato e sempre correto. Grito **sistemático** desliga um gate (div. 80); grito
   **eventual e autoexplicativo** custa trinta segundos (div. 83).
7. **Redesenhar aumenta a aposta em promessas que o código faz.** O `parcial → garantida`
   virou arco e frase; a frase é falsa em dois caminhos que o V1 não causou e não tocou.
   Dar forma a uma promessa é assumi-la.

---

## 11. Herança — o que o V1 deixou aberto

> **A numeração esconderia a prioridade, então a prioridade sai da numeração.** O que vem
> abaixo em primeiro lugar **não é o item 1 de uma lista**: é uma coisa de outra ordem de
> grandeza que as quatro divergências dizem juntas, e que bloqueia o palco. Os seis itens
> numerados que vêm depois são housekeeping, perguntas e decisões adiadas.

---

### ⛔ BLOQUEANTE — A GARANTIA OFFLINE NÃO É VERDADEIRA

**Isto não é herança: é o próximo trabalho.** PR própria, **imediatamente depois do V1 e
antes do N2** — decisão do Marcel, 2026-09-14. Fora desta PR pelo motivo que o bloco
defendeu sete vezes: é **comportamento**, em dois módulos que o G1 protege, e misturá-lo
com um aceite contaminaria o aceite.

> *"As duas são a mesma coisa por dois lados: 'garantida offline' é FALSO, e falso na
> direção perigosa — diz pronto quando não está, no único momento em que não dá para
> conferir."*

**O V1 não causou nenhuma das quatro** — `prefetch.ts` e `files.ts` fecharam o bloco inteiro
com diff vazio sob o G1. **Mas o V1 aumentou a aposta**: deu à promessa ícone próprio e a
frase "todos os arquivos neste aparelho". Dar forma a uma promessa é assumi-la.

| # | o que é | o que a PR de conserto precisa saber ANTES de começar |
|---|---|---|
| **div. 103** | um arquivo de **0 byte** conta como baixado, e o cartão diz "garantida offline" | **`size > 0` é o PISO, não o conserto.** Um download que parou em 100 KB de um arquivo de 242 KB também é corrupto e passa no `> 0`. O `files-index.json` **já guarda `bytes` por URL** (é o que o `knownBytes` lê): a checagem real é o **tamanho em disco contra o esperado no índice** |
| **div. 102** | "Baixar esta setlist" grava no diretório **purgável** | trocar o `false` do `baixar(urls, false)` é uma linha, **mas há decisão de produto atrás**: o botão manual DEVE gravar durável? Se sim, o LRU passa a proteger o que o usuário pediu explicitamente, e isso muda a política de purga. **Abrir como pergunta, não como conserto óbvio** |
| **div. 104** | o download **trava em silêncio** — sete minutos sem `download-error`, sem timeout, sem retentativa | **é a CAUSA; as outras duas são o sintoma.** Medir: há timeout configurado? há caminho de erro que o `prefetch` não alcança? Se não der para medir, declarar aberta e apontar o arquivo |
| **div. 109** | a barra do palco não marca a fronteira entre comportamento e navegação | **Proposta A, decidida pelo Marcel**: navegação alinhada à direita com a mesma margem de 24,0 dp (`indice` x1 de 792 → 1987 px, vão de 547,1 dp). Não quebra V1-A8, V1-A14 nem as bordas do A14 — conferido em `V1-PR7-anexos/V1-PR7-C-aceite-visual.txt` |

> ### ⚠ Errata W1 (2026-09-14) — as duas prescrições desta tabela estavam erradas, e o pre-check do W1 mediu por quê.
>
> 1. **"o tamanho em disco contra o esperado no índice" não funciona.** O `bytes` do
>    `files-index.json` é escrito **a partir do disco**, no `touch()` (`files.ts:236`,
>    `const bytes = localizar(url)?.file.size ?? …`), que corre logo depois do download
>    (`:197`) e **sobrescreve** o valor bom de uma passagem anterior. O índice não é
>    oráculo: comparar disco contra índice é comparar um número com ele mesmo.
>    **`W1-PRECHECK.md` div. 111.** E não há terceira fonte — a tabela `content` não tem
>    coluna de tamanho e o `ContentDTO` não tem campo (**div. 112**).
> 2. **"`size > 0` é o PISO" também está errado — não é nem o piso.** No Android o
>    `expo-file-system` abre `FileOutputStream(destination)` **antes do primeiro byte do
>    corpo** e escreve em cima do alvo; a doc da própria biblioteca o diz no comentário da
>    função que o app chama. Logo **um download EM VOO já conta como baixado**, e a
>    checagem de tamanho não alcança a corrida. **div. 113.** Medido no aparelho pelo W1:
>    o arquivo cresce com o NOME FINAL, de 30.273 a 211.911 B, por 19 segundos
>    (`W1-anexos/W1-C-aceites-aparelho.txt` §2).
>
> **O conserto é de outra natureza**: baixar para um nome temporário e renomear para o
> lugar só quando o download terminar — o `.tmp` + rename que o `store.ts:42` e o
> `files.ts:107` já usam, e que o arquivo baixado foi o único a não receber. Com ele,
> *existir é estar completo*, e a pergunta do tamanho desaparece.
>
> **E a div. 104 não era um travamento**: 14.400 bit/s = 1,8 KB/s, **~37 h** para
> 242.176 B. *"Não estava travado, estava chegando devagar demais"* (Marcel,
> 2026-09-14). O silêncio veio do `Promise.allSettled` cujo resultado o `baixar()`
> descarta (**div. 114**), não do OkHttp.
>
> **E o item 1 da herança (`cache miss`) fica respondido aqui**: as duas coisas **não se
> tocam** — um `miss` dispara quando algo não é achado, e o arquivo de 0 byte **foi
> achado**. A linha que falaria já existia e falou (`file src=disk … bytes=0`). O que
> faltou não foi log, foi checagem. **div. 120**, e a Q4 do pre-check do W1.
>
> *Esta nota não reescreve o registro do bloco V1: anota por cima dele. A PR do conserto
> é a W1 (`docs/native/W1-ENCERRAMENTO.md`).*

**Duas coisas que entram no mesmo trabalho, e não em outro:**

- **a pergunta que liga as três primeiras**: se o `cache miss` do item 1 abaixo existisse,
  o arquivo de 0 byte **talvez tivesse aparecido em log**. *Vale checar se as duas coisas
  se tocam* — e o lugar de checar é aqui, não numa PR de catálogo;
- **a edição do `PRD-TELA-1.md`** com as duas erratas da §5. Ver o item 2 abaixo: é
  trabalho de minutos, e enquanto não for feito **o PRD afirma duas coisas falsas**.

---

### O resto da herança — outra ordem de grandeza

#### 1. A pergunta do `cache miss`

O `cache miss kind=…` está no catálogo desde o N1-D5, foi especificado como parte do tripé
`hit | miss | write` e **nunca foi implementado**. A errata E8(2) corrigiu o catálogo para
descrever o app; **a pergunta de produto continua aberta**: *ele deve existir?* Corrigir o
catálogo sem abrir a pergunta apagaria a pergunta junto com a discrepância. **A resposta
pertence à PR bloqueante acima**, pelo motivo já dito: ele teria falado no caso da div. 103.

#### 2. Editar o `PRD-TELA-1.md` — e quando

As duas erratas da §5 (o **A4** no conjunto vazio, `1 + max(1, ⌈N/100⌉)`, e o **A15**, motivo
ao toque) estão **registradas e não aplicadas**. O `PRD-TELA-1.md` não foi tocado por
nenhuma das oito PRs do bloco, e **enquanto não for editado ele afirma duas coisas falsas**
— num documento que é o contrato que a tela 2 vai herdar.

**Proposta explícita, para que o item não suma por ser pequeno: entra junto com a PR de
conserto da garantia offline, no mesmo trabalho.** São minutos de edição, o PR já vai estar
aberto, e as duas erratas já têm o texto pronto na §5 deste documento — basta transportá-lo.
Não entrou nesta PR porque o encerramento é o lugar de **registrar** o veredito do bloco,
não de reescrever o contrato da tela; mas adiá-lo para "o N2 decide" seria deixar um PRD
falso de pé por um bloco inteiro.

#### 3. B8 — housekeeping de pipeline (herdado do N1, ainda aberto)

1. **O `paths` do `native.yml` re-roda o gate por commit de `docs/`.** Numa PR que já tocou
   `apps/native/**`, o GitHub avalia o `paths` contra o **diff acumulado do PR**, e um
   commit só de documento faz o APK inteiro compilar de novo. *O rito paga 12 minutos para
   registrar 12 minutos* (frase do Marcel).
2. **O `CI` conclui `success` com anotação de nível `failure`.**
3. **O G3 conta comentário** (div. 83). **Não é para consertar** — a decisão do Marcel foi
   deixá-lo errar para o lado de falar demais, e a razão está escrita no próprio comentário
   do `g2g3.sh`. Entra aqui para que ninguém "conserte" sem ler a razão.

#### 4. O que o design deixou decidido pela metade

| item | onde | estado |
|---|---|---|
| chevrons das zonas de toque do S3 | `DESIGN-V1` §8.1 | **não decidido** — a alternativa proposta é revelar por 1,2 s na primeira abertura de cada sessão |
| os cinco desabilitados | §8.2 | **não decidido** — o mais forte é o "Baixar esta setlist" offline, que hoje aceita o toque e falha em silêncio |
| ordenação do S1 por data do show | §8.3 | **não decidido**, e a própria proposta mede que ela *quase desaparece* com o dado de hoje — só compensa se as setlists passarem a ter `performance_date` |
| a marca em SVG | §8.4 | **não decidido**; a div. 22 (o retângulo do PNG) está resolvida, então é economia, não urgência |
| tema claro nas telas de lista | §3 | **aberto**: o V1 tematizou o palco; S1, S2, S4 e S5 continuam desenhadas no escuro, e `accent`, `error` e `offline` reprovam contraste no claro |
| `cor.offline` com zero usos | div. 8 do pre-check | **aberto**: o ponto do palco é `dark.offline` estático — 2,44:1 no tema claro |

#### 5. Achados menores, sem dono

| item | onde |
|---|---|
| **div. 95** — o índice empilha palcos; cada rotação emite uma linha por palco montado, e cada instância retida segura o render do seu PDF | `navigation.tsx` + `StageScreen.tsx` |
| **div. 98** — o `files-index.json` cresce com entradas de arquivos que já não existem | `files.ts` |
| **o `n=44` do A17** — a anomalia que o AVD mostrou nos dois lados da V1-PR3 (79 ms com vizinhos de 26 e 29) **continua sem causa**. No Tab S6, com 59 trocas, ela **não reapareceu** | — |
| **`placeholder kind=not-string`** — o único dos cinco que nenhum aceite jamais viu sair | a fixture do A6 não cobre (c)-chave-não-string |
| **o `zoom dp=` sai ao toque, não à mudança** — três `dp=18` seguidos com o zoom já no piso. O catálogo não promete "só na mudança" para o `zoom` (promete para o `rotation`), então não é errata | `StageScreen.tsx` |

#### 6. Para a tela 2 (N2) — o que o V1 entrega PRONTO

Ao contrário de tudo o que veio acima, isto não é dívida: é ferramenta.

1. **O sistema de ícones**: 37 desenhos SVG, três tamanhos (20/24/28) com traço próprio por
   tamanho, tinta por token, e um gate que os cobra contra o `telas.html` congelado.
2. **Os sete gates**, todos versionados ou anexados, com controle negativo cada um.
3. **O método de alcançar o S0** sem `pm clear` — abaixo.
4. **O padrão "instrumento com escopo menor do que parece"**, com treze casos e três
   regras, em `LOGS-OCTAVIA.md` — fora de um pre-check de PR, onde qualquer bloco o acha.
5. **A faixa de custo do CI**, com `n`, para que ninguém volte a chamar o melhor de doze de
   "regime".

---

### O método padrão para alcançar o S0 — registrado para não se perder

**Decisão do Marcel, 2026-09-14: "registre o caminho como o método padrão de alcançar o S0
daqui em diante, para que nenhum bloco futuro use `pm clear` por não saber que existe
alternativa."**

```
Metro:   EXPO_PUBLIC_DEV_FORGE_401=1  EXPO_PUBLIC_API_BASE_URL=http://localhost:8401  npx expo start
host:    python3 s401.py 8401          # devolve 401 a toda request
device:  adb -s <id> reverse tcp:8401 tcp:8401
→ api status=401 path=/api/setlists n=2 → auth-failure → login-screen → S0
custo:   0 request a prod · 0 byte de bucket · store intacto byte a byte
depois:  o login é do dono do app; a automação nunca digita senha
```

**O limite deste método, declarado**: ele exercita o S0 do **RE-login**, não a primeira
abertura de um app recém-instalado. Esse estado continua sem ter sido visto no device, e
nem o `pm clear` chegaria perto dele inteiro — não é o suficiente para pagar o cache.

---

## 12. Números

| | |
|---|---|
| PRs mergeadas | **7** (#293–#299) + esta |
| commits que tocam `apps/native` ou `packages` | **19** |
| telas redesenhadas | **6** de 6 |
| molduras do design | 22 (20 estados + 2 propostas) |
| ícones no mapa | **37** (33 do catálogo + 4 fora dele) |
| aceites do PRD reverificados | **16** de 22 · dispensados pelo G1: **6** |
| aceites do V1 (V1-A1…A14) | 13 vivos (o V1-A13 foi removido na V1-PR0, perdeu o objeto com a D-V1-1) |
| gates | **7**, todos com controle negativo |
| estados capturados nesta PR | **59** — 42 no AVD, 17 no Tab S6 |
| alvos tocáveis medidos nesta PR | **459**, **zero** abaixo de 48 dp, **zero** sem `testID` |
| divergências do bloco | **109** (26 no pre-check, 68 nas PRs 1–6, 15 nesta, das quais 1 retirada) |
| erratas do `DESIGN-V1` | **15** (E1–E15, com 11 subitens) |
| erratas do `PRD-TELA-1.md` | **2** (A4 e A15), registradas, **não aplicadas ao PRD** |
| erratas do `LOGS-OCTAVIA.md` | **1 nova** (E8, com três itens), aplicada nesta PR |
| suíte da raiz | 768 passed / 85 skipped (853) — a baseline do V1-A12, sem regressão |
| CI `native` | faixa **9m16s – 14m11s**, mediana **11m49s**, **n = 12** |
| CI, passo Gradle | faixa **7m48s – 11m11s**, **n = 5** — e n=5 é pouco |

### Contabilidade de prod do bloco inteiro

**Teto do bloco (`V1-PRECHECK.md` §8): 6 requests a `/api/*`. Gasto: 8. ESTOURO DE 2.**

| sessão | requests | onde está escrito |
|---|---|---|
| V1-PRECHECK (3 rodadas) | 2 | `V1-PRECHECK.md` §8 |
| V1-PR0 · V1-PR1 · V1-PR2 | 0 | — · `V1-PR1-anexos/README.md` · — |
| V1-PR3-PRECHECK | 2 | `V1-PR3-PRECHECK.md` §9 (o alvo era 0) |
| V1-PR3 · V1-PR4 · V1-PR5 · V1-PR6 | 0 | os `README.md` dos anexos |
| **V1-PR7** | **4** | `V1-PR7-anexos/V1-PR7-E-aparato-e-prod.txt` §1 |
| **TOTAL** | **8** | contra um teto de **6** |

**A causa do estouro, declarada e não escondida.** O Metro rodava com
`EXPO_PUBLIC_DEV_FORGE_401=1` para o A2. Ao trocá-lo pelo Metro limpo eu avisei o Marcel e,
**sem checar se ele já tinha logado**, rodei um `am force-stop` + abertura para "preparar o
estado limpo" — e **toda abertura online sincroniza**. O login dele já tinha gasto 2; a
minha abertura gastou outros 2. O que teria evitado: perguntar "você já logou?" antes do
`force-stop`, ou manter a base da API desviada para a porta morta até ter a resposta — que
é exatamente o que passei a fazer depois, para a fixture de 60 (0 requests, provado no
anexo E).

**Bucket**: 1 arquivo, **242.176 B**, na conta de audit, no emulador — o primeiro gasto de
bucket do bloco inteiro, autorizado pelo Marcel para produzir o estado `baixando` do AV-1.
Uma segunda tentativa travou em 0 B (div. 104) e o restauro veio da cópia local, sem
bucket. **Escrita pela API: 0 em todo o bloco. Acesso ao console Supabase/Firebase: 0.**

---

## 13. Estado final

**Repositório**: `origin/main` em `72bdb38`, mais esta PR. `apps/native/**` **inalterado**
por ela.

**AVD `octavia_tab32`** (conta de audit): `content.json`, `setlists.json` e os dois PDFs
**byte a byte** como no início do dia; `files-index.json` mudou só no `lastUsedMs` (div.
22); o PDF de 1 página foi promovido ao durável pelo app durante o A10 e **devolvido** ao
purgável no restauro, para a baseline do bloco ficar como estava. **Em avião, provado por
`ping`.**

E o estado **durável** foi conferido, e não suposto — que é o caso 5 do padrão
(`LOGS-OCTAVIA.md`): *o filesystem vivo dentro do boot* lido como *o estado durável do
AVD*. O emulador foi fechado com `adb emu kill` (ele subiu **sem** `-no-snapshot-save`,
div. 42), reaberto, e o store conferido de novo:

```
VIVO, antes de fechar                          DURÁVEL, depois de reabrir
d27e6d84…  content.json                        d27e6d84…  content.json
0a3a0638…  setlists.json                       0a3a0638…  setlists.json
cce7936f…  files-index.json                    cce7936f…  files-index.json
ad2eae09…  files/…-12p.pdf   (durável)         ad2eae09…  files/…-12p.pdf   (durável)
3d42199b…  cache/…-1p.pdf    (purgável)        3d42199b…  cache/…-1p.pdf    (purgável)
airplane_mode_on=1, ping falhando              airplane_mode_on=1, ping falhando
```

**Tab S6 `RX2N8000F3D`** (conta principal): sessão **viva**, keyguard aberto, rádio ligado.
`content.json` e o PDF idênticos aos encontrados; `setlists.json` é o **pós-sync de prod**
(`5f128c74…`), que é melhor que o de antes; `files-index.json` mudou no `lastUsedMs`. A
fixture de 60 foi escrita duas vezes e restaurada duas vezes, com sha provado nos quatro
momentos.

**O que o Marcel precisa fazer depois desta PR**: nada nos aparelhos. O Wi-Fi do tablet não
ficou pendente (está ligado e respondendo), a sessão não precisa de outro login, e os dois
stores estão nos estados registrados acima. O que fica para ele é **decisão**: o merge desta
PR, e a abertura da PR de conserto do **bloqueante da §11**, que ele já decidiu ser o
próximo trabalho.

**O Metro fica desligado ao fim da sessão**, como em todas as PRs do bloco: o dev client dos
dois aparelhos aponta para `localhost:8081`, e sem Metro o app não carrega bundle — é o
estado normal entre sessões, não um defeito.
