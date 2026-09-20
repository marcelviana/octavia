# N2-BRIEF — capturas de S1, S2, S3 e S4 para o brief de design

> **Para quê**: insumo do brief do Claude Design no bloco N2. O Claude Design
> desenha a partir do brief e destas capturas e **não lê o código**. Esta
> pasta traz só o estado atual das telas, sem proposta de desenho.
> **Medidas**: [`MEDIDAS.md`](MEDIDAS.md), tiradas só dos dumps.

## 1. Aparato

| item | valor |
|---|---|
| data | 2026-09-16, das 20:04 às 20:13 (horário do aparelho) |
| aparelho | **Tab S6**, `SM-T865`, serial `RX2N8000F3D`, Android 12L (API 32), build `SP2A.220305.013.T865XXU6DXE2` |
| tela | 2560×1600 px em paisagem (`rotation="1"` nos dumps), densidade 360 → **1137,8 × 711,1 dp**; janela do app `[0,0][2560,1492]`, área útil abaixo da barra de status **1137,8 × 639,1 dp** (`N1-ENCERRAMENTO.md` §8, `DESIGN-V1/README.md` errata E1) |
| app | dev client `rocks.octavia.app` `versionName=0.0.1`, instalado em 2026-09-13 12:42:13 (o da V1-PR3) |
| bundle JS | Metro rodando na worktree `../octavia-n2-brief/apps/native`, em `984051d8dd8c489d3bdf5ed7ce58166092dcb769` (= `origin/main`, árvore limpa), via `adb reverse tcp:8081` e deep link `exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`. Saída do Metro: `Android Bundled 3062ms apps/native/index.ts (1204 modules)`. **Ver div. 201** |
| API | `EXPO_PUBLIC_API_BASE_URL=https://octavia.rocks` (prod, **só leitura**: sync e busca local; nenhuma escrita) |
| conta | **principal** (`uid=xVDJRBh1WpPOatbfWahOLttYn1E3`), sessão restaurada, **online** |
| tema | **escuro** (o padrão das listas; o palco abriu escuro, com o botão `tema` dizendo "Mudar para o tema claro") |
| captura | `adb exec-out screencap -p` (PNG 2560×1600) + `adb shell uiautomator dump` (XML), comandos com `-s RX2N8000F3D` |

Boot e sync, verbatim (`adb logcat -d -s ReactNativeJS | grep OCTAVIA:`):

```
09-16 20:03:36.558 28430  5095 I ReactNativeJS: OCTAVIA: net online
09-16 20:03:37.970 28430  5095 I ReactNativeJS: OCTAVIA: auth uid=xVDJRBh1WpPOatbfWahOLttYn1E3 src=restored
09-16 20:03:38.117 28430  5095 I ReactNativeJS: OCTAVIA: cache hit kind=setlists n=2
09-16 20:03:38.118 28430  5095 I ReactNativeJS: OCTAVIA: cache hit kind=content n=63
09-16 20:03:38.170 28430  5095 I ReactNativeJS: OCTAVIA: sync start
09-16 20:03:38.186 28430  5095 I ReactNativeJS: OCTAVIA: auth refresh=cached
09-16 20:03:41.530 28430  5095 I ReactNativeJS: OCTAVIA: api status=200 path=/api/setlists n=1 ms=3355
09-16 20:03:41.803 28430  5095 I ReactNativeJS: OCTAVIA: auth refresh=cached
09-16 20:03:42.498 28430  5095 I ReactNativeJS: OCTAVIA: api status=200 path=/api/content n=1 ms=698
09-16 20:03:43.552 28430  5095 I ReactNativeJS: OCTAVIA: cache write kind=setlists n=2 invalidated=0
09-16 20:03:43.553 28430  5095 I ReactNativeJS: OCTAVIA: cache write kind=content n=63 invalidated=0
09-16 20:03:43.553 28430  5095 I ReactNativeJS: OCTAVIA: sync ok setlists=2 content=63 pages=1 t=5384
09-16 20:03:43.575 28430  5095 I ReactNativeJS: OCTAVIA: prefetch plan n=0 reason=7d
```

## 2. Capturas

| # | tela / estado | como chegou | status | arquivos |
|---|---|---|---|---|
| C1 | S1 com setlists (estado normal) | app aberto pelo deep link | **feito** | `C1.png`, `C1.xml` |
| C2 | S1f vazio | — | **não capturado**: a conta principal tem 2 setlists (`sync ok setlists=2`); o estado não foi forçado | — |
| C3 | S2 aberta **de S1**, a setlist com mais músicas (SEASON 3, 7 contra 4 de GOOD TIMES) | toque no cartão `setlist-e39d57cf`, em (1280, 868) | **feito** (2ª tentativa, ver div. 202) | `C3.png`, `C3.xml` |
| C4 | S2 aberta **do palco**, o índice do T1-R28 | palco na 1/7 → toque em `indice`, em (2063, 1385) | **feito** | `C4.png`, `C4.xml` |
| C5 | S4 busca **com resultado**, aberta do palco | palco → toque em `busca`, em (2247, 1385) → `input text man` | **feito**, com teclado aberto | `C5.png`, `C5.xml` |
| C5b | *(extra)* o mesmo estado de C5 com o teclado fechado | `keyevent 111` (ESC) | **feito**; só PNG (div. 203) | `C5b.png` |
| C6 | S3 palco com a barra, referência do A15 | S2 (C3) → toque em `song-1`, em (658, 436) | **feito**; a imagem é **só as duas barras** e o corpo saiu do XML (div. 204) | `C6-topo.png` (2560×144, o recorte de `[0,54][2560,198]`), `C6-base.png` (2560×216, o recorte de `[0,1276][2560,1492]`), `C6.xml` |

Os toques usam coordenadas do aparelho, lidas dos dumps (`N1-ENCERRAMENTO.md` §8.2).

Log do caminho, verbatim:

```
09-16 20:11:52.345 28430  5095 I ReactNativeJS: OCTAVIA: index jump n=1
09-16 20:11:52.452 28430  5095 I ReactNativeJS: OCTAVIA: keepawake on
09-16 20:11:52.456 28430  5095 I ReactNativeJS: OCTAVIA: prefetch plan n=0 reason=demand
09-16 20:12:08.268 28430  5095 I ReactNativeJS: OCTAVIA: index open
09-16 20:12:08.269 28430  5095 I ReactNativeJS: OCTAVIA: keepawake off
09-16 20:12:20.935 28430  5095 I ReactNativeJS: OCTAVIA: keepawake on
09-16 20:12:20.935 28430  5095 I ReactNativeJS: OCTAVIA: stage restore n=1/7
09-16 20:12:23.096 28430  5095 I ReactNativeJS: OCTAVIA: keepawake off
09-16 20:12:25.256 28430  5095 I ReactNativeJS: OCTAVIA: search q=1 n=50 in-setlist=7
09-16 20:12:25.364 28430  5095 I ReactNativeJS: OCTAVIA: search q=3 n=10 in-setlist=3
09-16 20:12:50.293 28430  5095 I ReactNativeJS: OCTAVIA: search close restore n=1/7
09-16 20:12:50.342 28430  5095 I ReactNativeJS: OCTAVIA: keepawake on
09-16 20:12:50.342 28430  5095 I ReactNativeJS: OCTAVIA: stage restore n=1/7
09-16 20:12:52.506 28430  5095 I ReactNativeJS: OCTAVIA: keepawake off
```

(As três primeiras linhas são da entrada no palco por C3 → `song-1`, que o app registra como `index jump`. As duas últimas vêm da saída do palco pelo `sair`, depois das capturas. O app ficou em S1.)

### 2.1 O que o leitor da imagem precisa saber

- **FAB do dev client** (engrenagem cinza, `content-desc="Tools"`,
  `[2407,90][2524,207]`): fica sobre o canto superior direito e cobre parte de
  `Buscar música` (C1), `Buscar na biblioteca` (C3/C4) e `apagar` (C5). **Ele
  não existe no app de produção** e não é elemento do desenho.
- **Barra de tarefas da Samsung** (1492–1600 px): é do sistema e fica fora da
  janela do app.
- **Barra de status** (0–54 px): o app desenha a partir de 54 px.
- **Teclado** (C5): o teclado do sistema cobre a metade de baixo. A lista não
  encolhe, os resultados continuam atrás dele. C5b mostra a mesma tela sem
  teclado.

## 3. sha256

```
c0306d36b07d1ce7e2d642a196b6bb16012a202dfe1e2183562a7275499f0c2d  C1.png
e9b34d3074d68df2e37c9fefc4dcd09061deb2c086cd53f8c314cb8d3597199a  C3.png
17903357583b6ceacd9d7a5099203ea0c9cf5dbfb2a1e6f71de4aff5c7ddee9a  C4.png
380a0d4bcab2bbd0b287242ac87ef07afe867d8d326f41aba6f08d3352ac301b  C5.png
bf1b4ae7e5d1df25989fe2e29e24639668e5fde60a7ad66a3b00195a454991b7  C5b.png
ae15b2a80fd48f98edc84e13ac0672532edfa9c2b2db51245edbdd0a514701cf  C6-base.png
b60a8a1d6e44081ef1512eb18a87a2fa54137dbfceebb8cf52c528c3ae1ac15b  C6-topo.png
203d9111149047fe6c8542764ea9930745e5c87004995827040bd3491b3a4508  C1.xml
456212fa24be58d6f7e962c67df3b57cf7f9e784ec759d9062a847306e2d59c2  C3.xml
61dcc7ad6e78abac0486552908a187ba45ebccf2da0e45b4b869b58ae8ae492b  C4.xml
a12b18efa4ebf7db0e812e9327a384b4cfa23ee1687a8bc198aa7197d6a1fed9  C5.xml
dea42fc7786be19ff587bf6d5a2e137f27fb8fbc85e94d26ebf425864fa88dc6  C6.xml
```

(`C6.xml` já com o corpo omitido e `C6.png` já recortado nas duas barras; ver div. 204. Os cinco dumps tocados fora desta pasta, com o sha256 de cada um, estão na §5.)

## 4. Divergências (200–211; 187–199 ficam para a PR-1)

| div. | o que | o que foi feito |
|---|---|---|
| **200** | No início da sessão o Tab S6 não estava conectado. O emulador `octavia_tab32` estava na conta **de audit** (`[UX-AUDIT] Palco`) e em modo avião. Trocar para a principal pediria `pm clear` e a senha. | Marcel conectou o Tab S6, que já tinha a sessão da principal (`src=restored`). O emulador não foi tocado: nenhum `pm clear`, modo avião intacto. |
| **201** | O brief manda "conferir o sha no log de boot", mas **essa linha não existe**: o catálogo `LOGS-OCTAVIA.md` não tem evento com sha, e `apps/native` não registra um. | Prova do bundle usada: Metro com `cwd` em `octavia-n2-brief/apps/native` (`lsof -d cwd`), worktree em `984051d` = `origin/main` e `git status` limpo. As linhas `OCTAVIA:` do boot aparecem ecoadas na saída desse Metro, e ele registrou `Android Bundled … apps/native/index.ts`. O `.env` foi carregado **inline** do checkout principal, sem arquivo novo na worktree. Uma linha de boot com sha fica como candidata ao catálogo (destino do Marcel). |
| **202** | O Tab S6 tem bloqueio e tempo de tela de 30 s (`screen_off_timeout=30000`). A **1ª tentativa de C3** caiu na tela de bloqueio e o toque não chegou ao app. | Essa C3 foi **apagada** e refeita depois de o Marcel desbloquear. Durante as capturas rodou um keep-alive que manda `input keyevent 59` (SHIFT) a cada 10 s, **só** com `isKeyguardShowing=false`. Nenhum ajuste do aparelho mudou: sem `svc power stayon`, tempo de tela intacto. |
| **203** | C5 com o teclado aberto esconde metade dos resultados. O `uiautomator dump` não captura a janela do teclado, então os XMLs com e sem teclado saíram **byte a byte iguais** (`cmp` sem diferença). | Extra declarado: `C5b.png`, sem teclado. Ficou só `C5.xml`, que vale para as duas imagens. |
| **204** | O `C6.xml` trazia a **letra inteira** da música no `text` do `corpo` (914 caracteres), e o repositório é **público**. A letra é conteúdo de terceiro na biblioteca do Marcel; a regra 2 do `LOGS-OCTAVIA.md` já proíbe corpo de música em log, e o `N1-PRECHECK.md:365` já tinha deixado os corpos JSON de prod fora dos anexos pelo mesmo motivo. | **Fechada, em três frentes.** (a) **Dump**: o `text` do nó `corpo` virou `[N2-BRIEF: corpo da música omitido — <n> caracteres; bounds preservado]`, com `bounds` e estrutura intactos. (b) **Imagem**: `C6.png` saiu e deu lugar a `C6-topo.png` e `C6-base.png`, só as duas barras — nenhuma linha de letra. (c) **Regra**: `CLAUDE.md`, seção "Anexo não carrega texto de música (regra permanente)". Alcance medido e arquivos tocados na §5. |
| **205** | O FAB do dev client aparece sobre controles da barra superior em C1, C3, C4 e C5. | Não dá para esconder sem mudar a preferência do dev client. Ficou registrado na §2.1 e no `MEDIDAS.md` como "só no build de dev". |
| **206** | Observação, sem julgamento: abrir o **índice** ou a **busca** a partir do palco gera `keepawake off`, e voltar gera `keepawake on` + `stage restore`. O catálogo descreve o evento como "entrar/sair do palco (T1-R33)". | **Corrigida** (o registro anterior dizia que isto importava para o picker, e não importa): o picker só existe em **S2 com edição**, que só se abre **a partir de S1** ou da criação — S2 aberta do palco não oferece edição, logo o picker **nunca** empilha sobre o palco (`PRD-TELA-2.md` T2-R19, N2-D19). A observação fica registrada como fato do **palco**, fora do escopo do N2. |
| **207** | O termo digitado em C5 (`man`) aparece na imagem e no `text` do `campo-busca`. O log só guarda o comprimento (`q=3`), como manda a regra 2. | É termo neutro, escolhido para ter resultado na setlist e na biblioteca. Nenhum dado pessoal. |

## 5. Alcance da div. 204: o que foi tocado fora desta pasta

Tudo nesta seção é **extra declarado** — higiene, não escopo do N2.

**A varredura** (assinaturas literais das letras + chaves `lyrics`/`chords`/`tablature`, em todo `docs/`, fora PNG e PDF) achou **92 arquivos** com texto de música, em duas classes:

- **5 com letra real de terceiro**, todos dumps do Tab S6 na conta principal, em `docs/native/V1-PR7-anexos/dumps-tabs6/` — **os tocados**;
- **87 com o texto-fixture do próprio projeto** (`Quando a noite chega…`, `[Intro] C  Am  F  G`, a tablatura `e|-------0`, escritos para a audit) — **não tocados**, por decisão do Marcel (div. 208).

**Os 5 arquivos tocados**, um nó `corpo` em cada, `bounds` e estrutura intactos:

| arquivo (`docs/native/V1-PR7-anexos/dumps-tabs6/`) | corpo omitido | sha256 depois |
|---|---|---|
| `A16-palco-inicio.xml` | 914 caracteres | `e697202f5f4656322d430e4305b1cc6be5476095139c37b8116ca6a5233fb51b` |
| `A16-palco-fim.xml` | 914 caracteres | `e697202f5f4656322d430e4305b1cc6be5476095139c37b8116ca6a5233fb51b` |
| `S3-palco-1de7.xml` | 914 caracteres | `e697202f5f4656322d430e4305b1cc6be5476095139c37b8116ca6a5233fb51b` |
| `AVicones-A-texto.xml` | 1831 caracteres | `7acadfd20974af4e2a9e079ccb85ccf15847426a30e9b5d6d8305e8f2d36fa25` |
| `S3-tema-claro.xml` | 1390 caracteres | `688a08c89433bfb41fb880b9e67ab02f2105d3589e5cc5f6f198d38bcf6ef62a` |

Os três primeiros saem com o **mesmo** sha porque já eram byte a byte
idênticos antes desta entrega (`327fa19f…` no `HEAD`) — ver div. 211.

Prova de que o `diff` é só o texto: para cada arquivo, a árvore com todos os
atributos `text` mascarados é **idêntica** antes e depois, o número de
atributos `text` não mudou (72, 72, 72, 72, 71) e **um** deles difere. Os
cinco continuam válidos como XML.

### 5.1 As cinco PNGs irmãs (div. 210)

Cada imagem teve **só** a região do nó `corpo` pixelizada, com o `bounds`
lido do dump ao lado dela — o mesmo `bounds` que o marcador
`[… bounds preservado]` cita. Bloco de **40 px**: nenhum verso fica legível,
e barras, controles, cabeçalho e barra de status seguem intactos, como a
prova de cada aceite do V1-PR7 exige. O arquivo é reescrito no lugar, com as
mesmas dimensões.

O comando, verbatim (Pillow 12.3.0 num venv do scratchpad; `BLOCK = 40`):

```python
reg = im.crop((x1, y1, x2, y2))
peq = reg.resize((reg.width // BLOCK, reg.height // BLOCK), Image.NEAREST)
im.paste(peq.resize(reg.size, Image.NEAREST), (x1, y1))
```

| arquivo (`docs/native/V1-PR7-anexos/dumps-tabs6/`) | `bounds` pixelizado | região | antes | depois | sha256 depois |
|---|---|---|---|---|---|
| `A16-palco-inicio.png` | `[72,270][1302,1276]` | 1230×1006 | 2560×1600 | 2560×1600 | `f042b2c8260e4bb2cbfe02b793bd34510c0696b60f7224aa5a4d5dc419364e8f` |
| `A16-palco-fim.png` | `[72,270][1302,1276]` | 1230×1006 | 2560×1600 | 2560×1600 | `aab68070bcd75bd2dd6fb33028d7825bf00a41a9df37479f237f474839b2f2b2` |
| `S3-palco-1de7.png` | `[72,270][1302,1276]` | 1230×1006 | 2560×1600 | 2560×1600 | `1522e24bb96594c746e976419b3a205b31504e4d75fa8d772e5585910ffe474f` |
| `AVicones-A-texto.png` | `[72,270][2322,1276]` | 2250×1006 | 2560×1600 | 2560×1600 | `f451a455a9b7038d69cbdf493341ce0144de8784a3c382931609f4f6ae7bcebc` |
| `S3-tema-claro.png` | `[72,198][2488,1276]` | 2416×1078 | 2560×1600 | 2560×1600 | `11a6fc63cd9b11c344ea7ef628c8e9db1dc911a7a4479ebb3a1282b9d831b145` |

As três primeiras imagens continuam **diferentes entre si** — o relógio do
aparelho marca 10:37 em `A16-palco-inicio.png`, 11:00 em `A16-palco-fim.png`
e 10:29 em `S3-palco-1de7.png` —, embora os três XML sejam idênticos entre
si. Ver div. 211.

| div. | o que | o que foi feito |
|---|---|---|
| **208** | O alcance da div. 204 é maior do que um arquivo, e as duas classes são diferentes: letra de terceiro contra texto-fixture do projeto. Além disso, **6** dos 92 arquivos têm o sha256 registrado em docs (`C-PRECHECK-anexos/B-P2-setlists.json`, `B-P5-content.json`, `B-P6-setlist.json` em `C-PRECHECK.md`/`C-ENCERRAMENTO.md`; `V1-A1-inventario-alvos.txt` em `V1-PRECHECK.md`; `V1-PR6-A-estados-antes-depois.txt` no README do V1-PR6; `DESIGN-V1/telas.html` no `SHA256SUMS` do design congelado) — reescrever qualquer um deles quebraria o registro. | Decisão do Marcel (2026-09-20): **só as 5 letras reais**. Nenhum sha registrado mudou; o design congelado não foi tocado. A regra do `CLAUDE.md` vale **para frente**: o texto-fixture do projeto não é obra de terceiro, mas anexo novo também não precisa carregá-lo. |
| **209** | A omissão vale para o **conteúdo atual**, não para a história. O `C6.png` inteiro está no commit `34d7064` desta branch, e os cinco dumps do V1-PR7 estão na `main` desde a PR #300. | Registrado. Tirar da história exigiria reescrever a branch (`--force-with-lease`, ainda possível aqui porque a PR não foi mergeada) e, na `main`, reescrever história já publicada — **decisão do Marcel**, não feita aqui. |
| **210** | As **PNGs irmãs** dos cinco dumps (`A16-palco-inicio.png`, `A16-palco-fim.png`, `S3-palco-1de7.png`, `AVicones-A-texto.png`, `S3-tema-claro.png`) mostravam a mesma letra na tela do palco. | **Fechada**: a região do nó `corpo` de cada dump foi **pixelizada** na imagem correspondente; barras, controles, cabeçalho e o resto da tela ficaram intactos, e as dimensões não mudaram. Comando, `bounds` e sha novo de cada uma na §5.1. |
| **211** | Achado sobre prova alheia, não causado aqui: `A16-palco-inicio.xml`, `A16-palco-fim.xml` e `S3-palco-1de7.xml` do V1-PR7 já eram **byte a byte idênticos** entre si na `main` (sha `327fa19f…`), embora o A16 trate "início" e "fim" como dois estados. | Registrado; a omissão do corpo preservou a propriedade (os três seguem idênticos entre si). **Destino: W4-a, caso 23 do padrão** — não investigado aqui. |
