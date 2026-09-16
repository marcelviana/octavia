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
| C6 | S3 palco com a barra, referência do A15 | S2 (C3) → toque em `song-1`, em (658, 436) | **feito**; corpo omitido no XML (div. 204) | `C6.png`, `C6.xml` |

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
f056227fc1c59e84be6ec79fd2038a83a1ad6fa0fa75cf30a71208ea74dd03e3  C6.png
203d9111149047fe6c8542764ea9930745e5c87004995827040bd3491b3a4508  C1.xml
456212fa24be58d6f7e962c67df3b57cf7f9e784ec759d9062a847306e2d59c2  C3.xml
61dcc7ad6e78abac0486552908a187ba45ebccf2da0e45b4b869b58ae8ae492b  C4.xml
a12b18efa4ebf7db0e812e9327a384b4cfa23ee1687a8bc198aa7197d6a1fed9  C5.xml
dea42fc7786be19ff587bf6d5a2e137f27fb8fbc85e94d26ebf425864fa88dc6  C6.xml
```

(`C6.xml` já com o corpo omitido; ver div. 204.)

## 4. Divergências (200–207; 187–199 ficam para a PR-1)

| div. | o que | o que foi feito |
|---|---|---|
| **200** | No início da sessão o Tab S6 não estava conectado. O emulador `octavia_tab32` estava na conta **de audit** (`[UX-AUDIT] Palco`) e em modo avião. Trocar para a principal pediria `pm clear` e a senha. | Marcel conectou o Tab S6, que já tinha a sessão da principal (`src=restored`). O emulador não foi tocado: nenhum `pm clear`, modo avião intacto. |
| **201** | O brief manda "conferir o sha no log de boot", mas **essa linha não existe**: o catálogo `LOGS-OCTAVIA.md` não tem evento com sha, e `apps/native` não registra um. | Prova do bundle usada: Metro com `cwd` em `octavia-n2-brief/apps/native` (`lsof -d cwd`), worktree em `984051d` = `origin/main` e `git status` limpo. As linhas `OCTAVIA:` do boot aparecem ecoadas na saída desse Metro, e ele registrou `Android Bundled … apps/native/index.ts`. O `.env` foi carregado **inline** do checkout principal, sem arquivo novo na worktree. Uma linha de boot com sha fica como candidata ao catálogo (destino do Marcel). |
| **202** | O Tab S6 tem bloqueio e tempo de tela de 30 s (`screen_off_timeout=30000`). A **1ª tentativa de C3** caiu na tela de bloqueio e o toque não chegou ao app. | Essa C3 foi **apagada** e refeita depois de o Marcel desbloquear. Durante as capturas rodou um keep-alive que manda `input keyevent 59` (SHIFT) a cada 10 s, **só** com `isKeyguardShowing=false`. Nenhum ajuste do aparelho mudou: sem `svc power stayon`, tempo de tela intacto. |
| **203** | C5 com o teclado aberto esconde metade dos resultados. O `uiautomator dump` não captura a janela do teclado, então os XMLs com e sem teclado saíram **byte a byte iguais** (`cmp` sem diferença). | Extra declarado: `C5b.png`, sem teclado. Ficou só `C5.xml`, que vale para as duas imagens. |
| **204** | O `C6.xml` trazia a **letra inteira** da música no `text` do `corpo` (914 caracteres), e o repositório é **público**. A letra é conteúdo de terceiro na biblioteca do Marcel; a regra 2 do `LOGS-OCTAVIA.md` já proíbe corpo de música em log. | O `text` desse nó foi trocado por `[N2-BRIEF: corpo da música omitido — 914 caracteres; bounds preservado]`. Nada mais no XML mudou, e ele continua válido. **Precedente na `main`**: `V1-PR7-anexos/dumps-tabs6/S3-palco-1de7.xml` tem a mesma letra inteira. Fica registrado, com destino do Marcel. `C6.png` mostra as primeiras estrofes, como as capturas de palco anteriores; também é decisão do Marcel. |
| **205** | O FAB do dev client aparece sobre controles da barra superior em C1, C3, C4 e C5. | Não dá para esconder sem mudar a preferência do dev client. Ficou registrado na §2.1 e no `MEDIDAS.md` como "só no build de dev". |
| **206** | Observação, sem julgamento: abrir o **índice** ou a **busca** a partir do palco gera `keepawake off`, e voltar gera `keepawake on` + `stage restore`. O catálogo descreve o evento como "entrar/sair do palco (T1-R33)". | Registrado porque o **picker** do N2 também vai empilhar sobre o palco: o brief e o PRD decidem se a tela pode apagar enquanto o picker está aberto. |
| **207** | O termo digitado em C5 (`man`) aparece na imagem e no `text` do `campo-busca`. O log só guarda o comprimento (`q=3`), como manda a regra 2. | É termo neutro, escolhido para ter resultado na setlist e na biblioteca. Nenhum dado pessoal. |
