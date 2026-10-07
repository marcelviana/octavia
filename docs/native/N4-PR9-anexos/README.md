# N4-PR9 — estados transversais, a troca por espécie, o aceite completo e a prova em prod

> **Bloco N4 · PR-9** (a última PR de código do N4). Data: 2026-10-07. Base: `origin/main` = `5c41c2d` (merge da #364, a
> N4-PR8). Branch `n4/pr9-aceite`, PR **#365**, sem merge.
> **Fonte do que esta PR fez**: este README. `[medido]` = comando e saída nesta sessão, no arquivo citado.
> **Commits**: `b311f50` o instrumento · `6af916d` a troca por espécie · `be9dcf2` dois defeitos do instrumento ·
> `527cf93` o conserto da div. 1063 · `6d9634e` o teto sobe o mock dele · `368c24f` a contagem de quedas nativas ·
> `f80745f` o instrumento da prova em prod · o commit de docs.
> **Divergências**: 1121 a 1135 (§11). **Decisões**: N4-D103 a N4-D106 (§0).

---

## 0. Decisões do Marcel nesta PR `[Marcel, 2026-10-07]`

- **N4-D103** — errata da N4-D84: **o release do N4 não é desta PR.** Ele se constrói da `main` depois do merge desta
  PR, na sessão do encerramento; o **A-N4-28** passa para lá. Errata no `N4-REQUISITOS.md` §3, sem renumerar.
- **N4-D104** — na troca por espécie, os **dois avisos de "a setlist sumiu"** de S1 (`SetlistsScreen.tsx`, `falha` em
  `muted`: nenhuma espécie devolve esse par) **ficam com o par à mão**; nada muda de aparência. A pergunta "o cinza ali é
  escolha ou acaso" vai ao **bloco de identidade** (§9).
- **N4-D105** — **a queda nativa** (`Fatal signal 11` em `MountingCoordinator::pullTransaction`): (a) a contagem do
  arnês passa a vê-la, com controle negativo, e a regra do `APARATO.md` muda em errata; (b) o registro das 5 quedas;
  (c) 100 aberturas frias de cada lado, no AVD — a `main` de antes da PR-6 e a ponta desta branch —, como indicação;
  (d) a condição do A-N4-28: 100 aberturas frias do release no Tab e 100 no AVD, com zero queda nativa, ou o
  encerramento para; (e) não se conserta aqui; se a rodada (c) mostrar que nasceu no N4, parar antes do commit de docs.
  O resultado de (c) está no §5.3: **não mostrou**.
- **N4-D106** — o teto do A-N4-26 (*"com o teto reduzido no mock"*) **pela fixture acima de 200 MB**, só no AVD, com o
  espaço do Mac medido antes e depois (folga mínima de 2 GB), os PDFs gerados na hora e fora do repositório (§4.4).
  *(Numeração: a N4-D105 é a do crash, pela mensagem do Marcel; esta decisão, dada antes, fica com o número seguinte.)*
- **O orçamento da prova em prod**, aprovado e depois revisto (div. 1133): `octavia_phone`, exatamente 2 escritas,
  **6 `GET`** (3 syncs), os downloads de storage da conta de audit (§6).
- **A coluna do Marcel no A-N4-26** (*o tempo até tudo baixar num sync real*) vai ao **encerramento**, no Tab, com o
  release e a conta dele; aqui só se mede o tempo na prova em prod. Errata no aceite.

---

## 1. O que as PRs 1 a 8 deixaram para a PR-9, e o que esta PR fez

Tirado dos anexos (cada linha com a origem). **Defeito** = consertado aqui; **medição** = medida e registrada;
**herança** = vai com destino (§9).

| item | origem | o que é | o que esta PR fez |
| --- | --- | --- | --- |
| as **seis espécies** do favoritar no aparelho (A-N4-8) | `N4-PR7-anexos/README.md:369`; `N4-PR8-anexos/README.md:382`; `DESIGN-N4/README.md:698` (div. 1018) | medição | **cinco no aparelho**, em L e V, C e B, AVD e Tab — *sem resposta* (mock `escrita-pendurada`: o prazo de 20 s vence, nada gravado), *sessão* (`escrita-401`), *servidor* (`escrita-500`), *genérica* (`escrita-400`), *limite* (`escrita-429`, `Retry-After: 30` → *em 30 s*). Cada uma com a linha de aviso de 1 linha (motivo 21,8 dp) — §4.1 |
| a espécie **rede** (o barrado sem rede) | `N4-PR7-anexos/README.md:414` (div. 1092) | medição | **não se alcança pelo toque**: a corrida entre o toque e o `estaOnline`, cinco atrasos (0 · 0,1 · 0,2 · 0,4 · 0,8 s) em duas orientações, nunca deu `write blocked … reason=offline` — até 0,2 s o pedido saiu e voltou 200 (o mock pelo `adb reverse` responde em avião), de 0,4 s em diante a estrela já estava inerte. Provada em teste (`favoritar.test.ts`, `biblioteca-tela.test.tsx`). Div. 1092 **fechada**; errata do A-N4-8 |
| ***baixando o arquivo…*** na LINHA da L | `N4-PR7-anexos/README.md:217`, `:417` (div. 1095); `N4-PR8-anexos/README.md:380` | medição | **capturado** em C e B, no AVD e no Tab (`dumps/N4P9T-L-linha-baixando-*`): o PDF de 24 MiB apagado por nome e o servidor lento (`arquivos-lentos.py`). Div. 1095 **fechada** |
| **div. 1063** — o 404 do download "sem o status" | `N4-PR5-anexos/README.md:386`, `:40` (N4-D92) | **defeito, consertado** (pequeno) | a premissa era falsa: o `message` traz o status **na segunda linha**, `→ Caused by: Unable to download a file: … HTTP 404` (div. 1122). O `falha()` só lia `status: NNN`. Conserto `527cf93`, teste antes (2 ✗ de 14). Agora V mostra *não consegui baixar* · ***o servidor respondeu 404***, e o log fica numa linha — §4.2 |
| **div. 1086** — o arquivo apagado por fora continua "baixado" | `N4-PR7-anexos/README.md:408`; `APARATO.md:287` | medição → **herança** | a premissa era imprecisa (div. 1121): o `listFiles()` **confere o disco**; o que fica velho é a **foto** que a raiz tira (`setFilesPresent`) na abertura, por arquivo e no fim do sync. Com o app aberto, o `rm` deixa a linha "baixada"; ao reabrir, o plano o põe de volta e o baixa. **O caso real** (a purga do sistema): o `pm trim-caches` esvazia só o `cache/`; os arquivos da biblioteca vivem no `files/` (durável, N4-R26) e não saem — §4.3. A foto: herança, destino a nomear |
| a **garantia de todos os arquivos** no aparelho (A-N4-26) | `N4-REQUISITOS.md:316-317`; `N4-PR5-anexos/README.md:365` | medição | o `files-index.json` por `run-as`, contra a fixture, **no AVD e no Tab**: 4 de 4 arquivos byte a byte; o `nao-existe.pdf` dá 404 e nunca chega ao disco. O teto: §4.4 |
| o teto com o *arquivo não baixado* | `N4-REQUISITOS.md:356` | medição | fixture de 14 × 24 MiB (N4-D106): `lru over bytes=252521727 cap=209715200 protected=19` e 5 linhas *arquivo não baixado* |
| a troca de `icone`/`cor` por espécie | `N4-REQUISITOS.md:444-446`; `N4-PR3-anexos/README.md:281`; N4-D32 | entrega | §2 — 14 de 16 usos; os 2 da N4-D104 ficam |
| "mede primeiro": as alturas da linha de aviso com o motivo em 15 (div. 1014) | `N4-REQUISITOS.md:449` | medição | a N4-PR7 já as mediu pela régua (`N4-PR7-anexos/README.md:63-65`: P-F4 em B 1 linha; pior caso C 1 · B 2 · A 3). Aqui, no aparelho, com as cinco espécies e o título da fixture: **1 linha** (21,8 dp) em C e B, nos dois aparelhos |
| A-N4-27 (a prova em prod) | `N4-REQUISITOS.md:452-456` | entrega | §6 |
| A-N4-28 (o release) | `N4-REQUISITOS.md:457-460` | **encerramento** (N4-D103) | errata, com a condição da N4-D105 d |
| o *"FATAL 0"* das PRs 2 a 8 | (achado desta PR) | **defeito do instrumento, consertado** | a contagem não via queda nativa — §5 |

Fora da lista dos anexos, achados aqui: a divergência do README da N4-PR8 sobre o 404 (div. 1123) e o `fechar-busca`
"inalcançável" do arnês de A (div. 1131).

---

## 2. A troca por espécie nas quatro telas antigas (N4-D32)

**O instrumento primeiro** (`b311f50`): `apps/native/test/linha-de-aviso-especie.test.tsx` acha cada uso pela árvore do
TypeScript (o objeto literal com `motivo` e `cor`/`especie`), com o par de hoje **fixado** uso a uso (lido da `main`
`5c41c2d`), e cobra: (1) cada uso declara a espécie da tabela e não declara mais `icone`/`cor`; (2) o mapa da espécie é o
par de hoje; (3) os usos da N4-D104 continuam com o par à mão; (4) nenhum aviso das quatro telas fica fora da tabela;
(5) o componente com a espécie desenha o mesmo ícone na mesma tinta. **Na `main`: 16 ✗ dos 20 casos** `[medido: especie-antes.txt]`;
com a troca (`6af916d`): **20 de 20**.

| espécie | (ícone, cor) — o mapa `PAR_DA_ESPECIE` | usos (arquivo:linha na `main` `5c41c2d`) |
| --- | --- | --- |
| `rede` | `sem-conexao`, `offlineInk` | `IndexScreen.tsx:569` · `ModoDeReordenar.tsx:502` · `Picker.tsx:314` · `SetlistsScreen.tsx:498` |
| `limite` | `ultima-sincronizacao`, `offlineInk` | `IndexScreen.tsx:574` · `ModoDeReordenar.tsx:504` |
| `falha` | `falha`, `errorInk` | `IndexScreen.tsx:586` · `ModoDeReordenar.tsx:511` |
| `teto` | `n-de-musicas`, `muted` | `IndexScreen.tsx:610` · `Picker.tsx:328` |
| `salvo-nao-relido` | `ultima-sincronizacao`, `muted` | `IndexScreen.tsx:614` · `Picker.tsx:317` · `SetlistsScreen.tsx:524`, `:538` |
| — (**não troca**, N4-D104) | `falha`, `muted` | `SetlistsScreen.tsx:505` (sumiu, releitura falhou) · `:517` (sumiu, declarado) |

**A forma**: `LinhaDeAviso.tsx` ganha `EspecieDoTablet` (as espécies do contrato menos `sucesso`, escrita no componente;
a igualdade com `Exclude<EspecieDeAviso, 'sucesso'>` é cobrada no `linha-de-aviso-contrato.test.ts`), o
`PAR_DA_ESPECIE` e a tinta como união (**espécie ou ícone + cor**: os dois da N4-D104 e as telas do N4, L e V, ainda
passam o par). O core não muda.

**A prova de que nada mudou de aparência**: G-inv **34/34 e 18/18**, `g-inv-par` **8/8** (§4.5) e `gate:icones` **0
acusações** antes e depois. **O controle negativo no aparelho**: a espécie `limite` plantada no aviso sem rede de S1 (o
ícone muda, a cor não) → o G-inv do AVD: `S1-aviso-sem-rede-avd-pai: DIFERENTE — base 122 nós, novo 121`; os outros dois
estados de S1, idênticos `[medido: g-inv-cn-avd.txt]`. Desfeito, o `git status` limpo.

---

## 3. Testes e controles negativos `[medido: especie-antes.txt, cn.txt, 1063-antes.txt, quedas-cn-aparelho.txt]`

| teste | antes | depois |
| --- | --- | --- |
| `linha-de-aviso-especie.test.tsx` (novo) | **16 ✗** de 20 na `main` | 20 ✓ |
| `linha-de-aviso-contrato.test.ts` (+ a espécie) | não compila na `main` (sem `EspecieDoTablet`) | ✓ |
| `files-mensagem.test.ts` (+ o 404 do Android, 3 casos) | **2 ✗** de 14 | 14 ✓ |
| a suíte do nativo | 434 ✓ | **437 ✓** |

| CN (regra 4) | o que se plantou | quem reprova |
| --- | --- | --- |
| 1 | um par trocado numa tela antiga: o teto do Picker como `salvo-nao-relido` | o teste dos pares, 1 ✗ |
| 2 | o mapa com outra cor (teto em `lineInfo`) | 2 ✗ (o mapa; o componente) |
| 3 | o mapa com outro ícone (rede com `falha`) | 2 ✗ |
| 4 | uma espécie com a frase de outra: `servidor` com a frase da genérica (core) | 4 ✗ (`favoritar.test`, `biblioteca-tela`, `visualizacao-tela`, `escrita-500 → servidor`) |
| 5 | **no aparelho**: a espécie de outro uso no aviso sem rede de S1 | **G-inv: DIFERENTE** (122 → 121 nós) |
| 6 | o conserto da 1063 desfeito (o teste antes) | 2 ✗ |
| 7 | o contador de quedas: a amostra sem a linha `Fatal signal` | `quedas.py --cn`: nativas=0 (esperado 0) |
| 8 | **no aparelho**: `kill -11` no processo do app | `quedas.py`: **nativas=1 · 1 tombstone**; o `grep -c FATAL` antigo: **0** |

Todos desfeitos; o `git status` limpo depois de cada um.

---

## 4. No aparelho, com o mock (N4-D54: o executor mede)

**O aparato** (`APARATO.md` lido inteiro): a fixture do pre-check do N3 para o G-inv (*hoje* = 2026-09-23); a **da
visualização** da N4-PR8 para os estados de L e V; o servidor de arquivos **lento** (`arquivos-lentos.py`) para o
*baixando*; um mock por aparelho (AVD 8788, Tab 8789); o Metro sem `CI=1`, `--clear`,
`EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; `apps/native/.env` por `cp -p` do checkout principal (sha256
`f2bfa179cd8e4b1f…`, nenhum valor lido), **apagado** no fim. **O bundle servido conferido** antes de cada rodada (regra 13):
`PAR_DA_ESPECIE` 6 · `bHTTP` 1 · `localhost:8788` 1 · `octavia.rocks` 0. O arnês: `instrumentos/transversais.py` (sobre o
`visualizacao.py` e o `biblioteca.py` da N4-PR8/PR7), a cópia do `roteiro.py` com a `PORTA` e a `ARVORE` do ambiente
(`instrumentos/roteiro-porta.diff`, que leva também a errata de caminho da N4-PR7; div. 1134).

### 4.1 As espécies e a corrida da rede `[medido: roteiros/avd-*.txt, roteiros/r2-*.txt, roteiros/tab-*.txt; dumps/N4P9T-*-favoritar-*]`

| espécie | a linha de aviso (o motivo) | AVD C · B | Tab C · B |
| --- | --- | --- | --- |
| sem resposta | *Favoritar “Segunda do ensaio”  ·  sem resposta do servidor* | L ✓ V ✓ · L ✓ V ✓ | L ✓ V ✓ · L ✓ V ✓ |
| sessão | *… · não foi possível salvar — confira sua conta no site* | idem | idem |
| servidor | *… · falha no servidor — nada foi alterado aqui* | idem | idem |
| genérica | *… · não foi possível salvar* | idem | idem |
| limite | *… · muitas alterações seguidas — tente de novo em 30 s* | idem | idem |
| rede | — (não alcançável pelo toque; ver §1) | 10 tentativas | — |

Todas com o motivo em **1 linha (21,8 dp)**. No AVD, a primeira passada de `especiesL` em retrato esgotou a espera no
*sem resposta* (div. 1135) e foi refeita na rodada 2, verde. A corrida da rede no AVD `[medido: roteiros/avd-pai.txt,
avd-ret.txt]`: atraso 0 e 0,1 → `write op=favorite … status=200` (o pedido saiu); 0,2 → `net offline` logado **antes** do
`api`, e o pedido ainda saiu; 0,4 e 0,8 → só `net offline` (a estrela inerte, nenhum pedido).

### 4.2 O *baixando*, o *falhou* e a div. 1063 `[medido: roteiros/*-vfalhou.txt, tab-*.txt; dumps/N4P9T-L-linha-*, N4P9T-V-arquivo-falhou-*]`

| | AVD C · B | Tab C · B |
| --- | --- | --- |
| *baixando o arquivo…* na linha da L | ✓ · ✓ | ✓ · ✓ |
| *não consegui baixar* na linha da L | ✓ · ✓ | ✓ · ✓ |
| V falhou: *não consegui baixar* + a espécie | ***o servidor respondeu 404*** · idem | idem · idem |
| o log | `download-error nao-existe.pdf: o servidor respondeu 404` | idem |

**Antes do conserto** (a 1ª passada do AVD), o logcat inteiro: `download-error nao-existe.pdf: Call to function
'FileSystemDownloadTask.start' has been rejected.` e, na linha seguinte, `→ Caused by: Unable to download a file: Unable
to download a file: HTTP 404` `[medido: roteiros/avd-pai.txt]`.

### 4.3 O arquivo apagado por fora (div. 1086) `[medido: roteiros/r2-avd-pai-arquivos.txt, tab-pai-arquivos.txt]`

| passo | AVD | Tab |
| --- | --- | --- |
| a L com a `Partitura de doze páginas` baixada | sem estado de arquivo | idem |
| `rm` por nome do `partitura-12p.pdf`, **com o app aberto** | a linha **continua** sem *arquivo não baixado* (a foto) | idem |
| reaberto | `prefetch plan n=2 reason=library` · `file src=download name=partitura-12p.pdf bytes=4198` | idem |
| `pm trim-caches 999G` (só no AVD: limpa o cache de todos os apps) | o `cache/octavia-<uid>/files` esvazia (um órfão da conta de audit); o `files/…/files` **intacto** (os da fixture) | — |

### 4.4 A garantia e o teto `[medido: roteiros/r2-avd-pai-arquivos.txt, tab-pai-arquivos.txt, r3-avd-pai-teto*.txt, teto-fixture.txt; dumps/N4P9T-L-teto-*]`

**O índice contra a fixture** (AVD e Tab, igual): `partitura-12p.pdf` 4198 · `partitura-1p.pdf` 643 ·
`partitura-escaneada.jpg` 860006 · `partitura-grande.pdf` 25165688 — **índice = disco = fixture**; `nao-existe.pdf`:
404 na fixture, nunca chega ao disco.

**O teto** (N4-D106), só no AVD:

| | |
| --- | --- |
| o espaço antes | Mac **48 GiB** livres (90 %); userdata do AVD 4,7 GB |
| n = 9 (240,8 MiB) | **todos baixaram**: o plano olha o total quando o trabalhador pega a URL, e o 8º entrou com 202,4 MB (< 209,7); o 9º já voava. `lru over bytes=252521727 cap=209715200 protected=14` — nenhum *não baixado* (div. 1128) |
| n = 14 (360,8 MiB) | `prefetch plan n=6 reason=library` · `lru over bytes=252521727 cap=209715200 protected=19` · a L (filtro "teto 1"): **as 5 do 10 ao 14 com *arquivo não baixado*** |
| a limpeza | os 9 PDFs do teto apagados do AVD **por nome** (`roteiros/r3-teto-limpeza.txt`); a fixture apagada do Mac |
| o espaço depois | Mac **48 GiB**; userdata do AVD **4,9 GB** |

### 4.5 G-inv, `g-inv-par`, G-N3 com o código final `[medido: g-inv-final-ambos-b5.txt, -b3.txt, g-inv-par-final-ambos.txt, g-n3-final-ambos.txt]`

| | AVD + Tab |
| --- | --- |
| G-inv `B5-baseline/` | **34 de 34** |
| G-inv `B3-referencia-paisagem/` | **18 de 18** |
| `g-inv-par` | **8 de 8** |
| G-N3 (a base, com os rolados) | 32 pares, **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 |

**A linha de base da `main`**: o código da `main` `5c41c2d` é o da ponta da N4-PR8 (`git diff d88679d 5c41c2d -- apps
packages` vazio), e o "depois" da N4-PR8 é 34/34 · 18/18 · 8/8 · (e)=0 (b)=0 (`N4-PR8-anexos/README.md` §5.1). **Uma
corrida intermediária** do AVD reprovou por DADO (B5 16/18, B3 1/9: o palco com o *placeholder*), porque as setlists da
fixture da visualização ficaram no cache — o sync guarda a setlist quando o `updated_at` não muda (div. 1130); num boot
limpo do snapshot, 18/18 e 9/9. *(O arquivo dessa corrida intermediária foi sobrescrito pelo da corrida limpa, com o
mesmo nome — o 16/18 · 1/9 está só na saída desta sessão; a primeira corrida, antes do conserto da 1063, está em
`g-inv-depois-avd-*.txt`: 18/18 · 9/9.)* **G5/G6**: nenhum alvo novo nesta PR (G2: nenhum `testID` novo); os de L e V são os da
N4-PR7/PR8, com `diff` vazio.

### 4.6 O Tab, do começo ao fim (autorizado `[Marcel, 2026-10-07]`) `[medido: estado/tab-*.txt]`

| | |
| --- | --- |
| lido | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, **release** de 2026-10-07 08:32:08 (sem `DEBUGGABLE`); `stay_on` a 7 logo depois |
| ida | `install -r` do dev client (`9447edc7…`): `DEBUGGABLE`; o app **não** aberto |
| a receita do cache (N4-D102) | `receita-cache.sh guardar`: **4 caminhos** (`setlists.json` `9fd3cdfd…`, `content.json` `b62f192a…`, `files-index.json` `b21cc49b…`, o PDF do Marcel `05253d42…`), md5 a md5; tirados por nome — a pasta da sessão sem dado real (os quatro `._*` onde estão) |
| antes de abrir | o mock do Tab na 8789, os túneis, o bundle conferido (`localhost:8788` 1, `octavia.rocks` 0) |
| durante | a base do G-inv (25 + 21 capturas); os estados transversais (12 + 12, V falhou, índice, apagado por fora); **0 `Fatal signal`** na sessão inteira |
| volta | `regravar`: os 4 da fixture apagados por nome; **4 de 4 md5 iguais ao manifesto**; `install -r` do release (`6eae4a8b…`, `release-31d6b3a.apk`): sem `DEBUGGABLE`, `lastUpdateTime=2026-10-07 14:15:07`; as cópias do Mac apagadas |
| N4-D56, em avião | `ping` → *Network is unreachable*; `cache hit kind=setlists n=2` · `kind=content n=63`; `sync skip reason=offline`; o S1 com o `aviso-motivo`; 0 `FATAL`, 0 `Fatal signal` |
| N4-D56, com rede | `ping` 2/2; **2 `GET`** (`/api/setlists` 200, `/api/content` 200), `invalidated=0` nos dois; **0 escritas**; `prefetch plan n=0 reason=7d`; 0 quedas |
| fim | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio — **igual ao lido**; o Tab com o release (N4-D55) |

### 4.7 O AVD e o celular `[medido: estado/avd-*.txt, estado/phone-*.txt]`

**AVD `octavia_tab32`**: lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, dev client de 2026-09-24
14:00:01; subido com `-no-snapshot-save` cinco vezes (o S0 do fim das cadeias derruba a sessão; a div. 1130); o rádio
ligado só durante as rodadas (desligar o avião não o religa, div. 418). O fim: §12.
**`octavia_phone` (faixa A)**, `-port 5556` (div. 1132), lido `stay_on=1 accel=0 user_rot=0 airplane=0 wifi=1 data=1`;
fim igual, `reverse` vazio, desligado sem salvar.

---

## 5. A queda nativa (N4-D105) `[medido: quedas-cn-aparelho.txt, quedas/*]`

### 5.1 O instrumento (a)

`instrumentos/quedas.py` (`368c24f`): a queda Java do app, **a nativa do app** (`Fatal signal … (cks.octavia.app)`) e os
tombstones do dropbox, com o topo da pilha. CN 7 e 8 no §3. **Os "FATAL 0" das N4-PR2…PR8 e do release não viam queda
nativa** — contavam `FATAL` como subcadeia (`N4-PR7-anexos/instrumentos/phone-l.py:29`, `N4-PR8-anexos/instrumentos/
prova-receita.sh:21`, `N4-RELEASE-anexos/README.md:291`, `N3-PR6-anexos/instrumentos/j3.py:109`); são **17** menções de
FATAL zero nos READMEs da N4-PR4 a PR8 e 1 no do release. **Recontar não é possível**: nenhum anexo dessas PRs guarda
logcat bruto — só as linhas `OCTAVIA:` (`grep` de linhas de `libc`/`DEBUG`/`AndroidRuntime` nos oito diretórios: 0
arquivos). Errata no `APARATO.md`, "logcat".

### 5.2 O registro das 5 (b)

| # | aparelho | hora | o passo do arnês | sinal · endereço | o topo da pilha |
| --- | --- | --- | --- | --- | --- |
| 1 | AVD `octavia_tab32` | 10:59:40 | `transversais.py baixandoLinha`, retrato: a abertura fria (`ir_s1`) depois do `force-stop` e do `rm` por nome | 11 (SIGSEGV) · `0x1e30000000a` | `#00 facebook::react::MountingCoordinator::pullTransaction(bool) const+520` · `#01 FabricUIManagerBinding::schedulerDidFinishTransaction` · `#02 Scheduler::uiManagerDidFinishTransaction` · `#03 UIManager::shadowTreeDidFinishTransaction` · `#04 ShadowTree::mount` · `#05 ShadowTree::tryCommit` |
| 2–4 | AVD | antes das 11:05:10, 11:06:26 e 11:07:41 (o fim de cada repetição) | o mesmo `baixandoLinha`, repetido 5 vezes (as 3 primeiras caíram) | 11 (contadas por `grep -c 'Fatal signal'`) | **perdido**: o logcat foi limpo às 11:19:45 (o começo da rodada 2) e o dropbox do AVD saiu no boot seguinte sem salvar — só a contagem ficou (`quedas/repete-1…3.txt`: *ESPERA ESGOTADA* / *TOQUE FALHOU*) |
| 5 | `octavia_phone` | 12:58:51 | `phone-v.py`, a abertura do estado *arquivo não baixado* | 11 (SIGSEGV) · `0x74636f2e736b636f` | `#00 MountingCoordinator::pullTransaction(bool) const+520` · `#01 FabricUIManagerBinding::schedulerDidFinishTransaction` · `#02 Scheduler::uiManagerDidFinishTransaction` · `#03 UIManager::shadowTreeDidFinishTransaction` |

O endereço da 5ª, lido como bytes, é ASCII (`ocks.oct`): um ponteiro que aponta para um pedaço de texto — compatível com
uso de memória liberada, **não provado**. Todas no processo do app, na thread `mqt_v_js`, com o processo de 0 s de vida
(a abertura).

**A janela de 10:59 a 11:10**, o que se sabe: às 10:47 o `files.ts` foi editado com o Metro de pé (o conserto da 1063), e
o Metro serviu o bundle remendado (`Android Bundled … (1 module)`); de 10:47:23 a 10:48:25 a suíte do nativo rodou no Mac;
o AVD rodava a rodada de retrato desde 10:46; o disco do Mac às 11:19 tinha 48 GiB livres (90 %). Não se mediu CPU, memória
nem a carga do AVD. **A hipótese do "Metro remendado"** (as 4 do AVD depois da edição) **caiu**: a 5ª veio no celular com
o Metro recomeçado `--clear` às 12:33 e nenhuma edição depois.

### 5.3 A comparação (c) — indicação, não prova `[medido: quedas/frias-ponta.txt, quedas/frias-d78.txt]`

O mesmo arnês (`frias.sh`: `force-stop`, o link do dev client, o S1 de pé), no AVD, **100 aberturas frias de cada lado**,
só a contagem de quedas nativas (o `grep` por abertura e os tombstones novos no dropbox):

| lado | aberturas | S1 | quedas nativas | tombstones novos |
| --- | --- | --- | --- | --- |
| a ponta desta branch (`f80745f`) | 100 | 100 | **0** | **0** |
| a `main` de antes da PR-6 (`d78ea89`, o merge da #361) | 100 | 100 | **0** | **0** |

**O que os números permitem afirmar**: no dia, ≈ 5 quedas em ≈ 500 aberturas do dev client (≈ 1 %); as duas rodadas de
100 **não as reproduziram** (0 na ponta, 0 na `d78ea89`; e, antes, 0 em 10 + 40 + 5 + 5 nos ciclos de repetição). **O que não permitem**: com uma taxa de 1 em 60, 0 em 100 acontece com
probabilidade (59/60)¹⁰⁰ ≈ 19 % — zero de um lado e zero do outro **não distingue** os dois, e zero em 45 (a amostra que eu
tinha antes) diria menos ainda. Não se pode dizer que nasceu no N4 nem que não nasceu; só que **a rodada (c) não mostrou
que nasceu** (N4-D105 e). Ele vai como **herança**, com destino a nomear no encerramento, e a **condição do A-N4-28**
(100 + 100 aberturas do release, zero queda) decide se bloqueia o release.

---

## 6. A prova do favoritar em produção (A-N4-27) `[medido: prod/prova.txt, prod/escrita-*-estrela.png, estado/phone-prod-*.txt]`

**O aparelho e o caminho**: o `octavia_phone` (a conta de audit no snapshot), subido sem salvar; o Metro recomeçado
`--clear` **sem** o `EXPO_PUBLIC_API_BASE_URL` inline (vale o do `.env`), conferido antes da primeira requisição: o host de
prod 1 · `localhost:8788` 0; túnel só da 8081; nada escutando nas portas do mock. O descartável: `4dadcb78` (criado pelo
Marcel no site; o título não entra aqui). O instrumento: `instrumentos/prova-prod.py` (`f80745f`), commitado antes.

| passo | o que se mediu |
| --- | --- |
| abertura (sync 1) | `api status=200 path=/api/setlists` · `api status=200 path=/api/content` · `sync ok setlists=3 content=68 pages=1` · `prefetch plan n=4 reason=library` · 4 × `file src=download` — **265 002 B, do plano (15:11:08.938) ao último (15:11:11.245): 2,3 s**; o descartável no cache: `is_favorite=False` |
| escrita 1 (a estrela vazada) | `api status=200 path=/api/content ms=309` · **`write op=favorite content=4dadcb78 status=200 code=- ms=313`** · `cache write kind=content n=68 invalidated=1` — **nenhum sync** entre o toque e o fim; a estrela: *Favoritar* → *Tirar* |
| a estrela em voo | a tira (`prod/escrita-1-estrela.png`, só o alvo de 48, 10 q/s): vazada → **vazada inerte com o arco** (4 quadros) → cheia — sem otimismo |
| o cache, sem sync | `is_favorite=True`, `updated_at=2026-10-07T18:11:34.589+00:00` (a linha da resposta) |
| sync 2 | 2 `GET` 200 · `cache write … invalidated=0` · **o servidor confirma `is_favorite=True`** |
| escrita 2 (a estrela cheia) | `api status=200 … ms=494` · **`write op=unfavorite content=4dadcb78 status=200 code=- ms=498`** · `cache write kind=content n=68 invalidated=1`; nenhum sync; *Tirar* → *Favoritar*; a tira: cheia → **cheia inerte com o arco** (6 quadros) → vazada |
| sync 3 | 2 `GET` 200 · `invalidated=0` · **o servidor confirma `is_favorite=False`** |

**A contabilidade, contra o orçamento**:

| | orçamento | real |
| --- | --- | --- |
| escritas (`PUT /api/content`) | 2 | **2** (200 · 200) |
| `GET` | 6 (revisto, div. 1133) | **6** (8 linhas `api` − 2 do PUT) |
| downloads de storage | os arquivos da conta de audit | **4** (265 002 B; `n=4` no plano) |
| respostas fora de 2xx | — | **0** |

**O estado de volta**: o descartável com `is_favorite=False`, como estava; o `updated_at` não volta (herança D,
N4-D39); o descartável fica para o Marcel apagar. O celular desligado sem salvar (o cache de prod da conta de audit não
fica no AVD); o Metro de prod parado e o `metro-cache` apagado; 0 quedas na prova.

---

## 7. Os 28 aceites

Onde a superfície não mudou desde a evidência citada, o `git diff d88679d HEAD` dos arquivos dela é **vazio** — L
(`LibraryScreen`, `LinhaDaBiblioteca`, `FiltrosDaBiblioteca`, `ControlesDaMusica`), V (`VisualizacaoScreen`, `Leitor`), o
palco (`StageScreen`, `SearchScreen`, `rotas-do-avulso`, `navigation`), o core, o pacote de identidade, o prefetch, o
favoritar, o sync e o store. Mudaram: `LinhaDeAviso.tsx`, as quatro telas antigas e o `files.ts` — o que passa por eles
foi medido de novo aqui.

| # | critério (resumo) | evidência | veredito |
| --- | --- | --- | --- |
| A-N4-1 | `buscar` abre L; S1 idêntico | G-inv S1 nesta PR (§4.5); L: N4-PR7 §5 (diff vazio) | ✓ |
| A-N4-2 | L sem IME; teclado | N4-PR7 §5 (diff vazio) | ✓ |
| A-N4-3 | barra, filtros, régua, linha | N4-PR7 §5 (diff vazio) | ✓ |
| A-N4-4 | a ordem pt-BR | teste do core (verde na suíte, §8); N4-PR5/PR7 | ✓ |
| A-N4-5 | as cinco contagens | teste do core; N4-PR7 (diff vazio) | ✓ |
| A-N4-6 | a linha; o toque abre V; os estados | N4-PR7/PR8 (diff vazio); **o *baixando* na linha, aqui** (§4.2); Marcel: *SIM* (N4-PR8) | ✓ |
| A-N4-7 | em voo inerte, cache sem sync, sair não cancela | N4-PR7/PR8 (mock); **em prod, aqui** (§6) | ✓ |
| A-N4-8 | as seis espécies no aparelho | **aqui** (§4.1): cinco no aparelho; a *rede* em teste (errata) | ✓ (com a errata) |
| A-N4-9 | sem rede | N4-PR7/PR8 (diff vazio nas telas); a linha de aviso do sem rede **nesta PR** pela espécie (§4.1, corrida) | ✓ |
| A-N4-10 | os quatro estados de sync de L | N4-PR7 (diff vazio em L) | ✓ |
| A-N4-11 | a busca de L | teste do core; N4-PR7 | ✓ |
| A-N4-12 | o cabeçalho de V | N4-PR8 (diff vazio) | ✓ |
| A-N4-13 | o corpo de V | N4-PR8 (diff vazio); Marcel: *sim* (N4-PR8) | ✓ |
| A-N4-14 | os campos de V | N4-PR8 (diff vazio) | ✓ |
| A-N4-15 | corpo e arquivo em V | N4-PR8; **a falha de V com a espécie, aqui** (§4.2, a 1063) | ✓ |
| A-N4-16 | o palco avulso | N4-PR6/PR7/PR8 (diff vazio no palco); G-inv 18/18 aqui | ✓ |
| A-N4-17 | a S4 do avulso | G-inv aqui (os 4 da S4 pelo caminho da N4-PR7) | ✓ |
| A-N4-18 | estrela e tocar no catálogo | `gate:icones` 0 aqui; Marcel: *bom · bom* (N4-PR7) | ✓ |
| A-N4-19 | os quatro de tipo | `gate:icones` 0 aqui; Marcel: *bom*, o *a* primeiro (N4-PR4) | ✓ |
| A-N4-20 | os tokens no pacote | teste do pacote (§8); diff vazio no pacote | ✓ |
| A-N4-21 | as frases sob gate | G-tok e `frases-n4` (§8) | ✓ |
| A-N4-22 | G2 só adição; G6 | G2 aqui: nenhum `testID` novo | ✓ |
| A-N4-23 | G-inv 34/34 e 18/18 | **aqui** (§4.5) | ✓ |
| A-N4-24 | B contra as molduras; A sem queda e a lista | B: N4-PR6/7/8; **A: aqui** (§10) — a contagem de quedas nova; 1 queda nativa no celular (§5, herança) | ✓ com a herança da N4-D105 |
| A-N4-25 | as estimadas | N4-PR7/PR8 (§1: a div. 1014) | ✓ |
| A-N4-26 | a garantia no aparelho | **aqui** (§4.3, §4.4); errata (o teto pela fixture; a coluna do Marcel → encerramento) | ✓ (Marcel: encerramento) |
| A-N4-27 | o favoritar em prod | **aqui** (§6) | ✓ |
| A-N4-28 | o release no Tab | **encerramento** (N4-D103), com a condição das 100 + 100 aberturas (N4-D105 d) | encerramento |

---

## 8. Os 26 requisitos, cada um com a PR que o fechou

| | requisito | fechado na |
| --- | --- | --- |
| N4-R1 | `Buscar música` abre L; S1 não muda | PR-7 |
| N4-R2 | L abre sem teclado | PR-7 (com a errata do mecanismo) |
| N4-R3 | a composição de L | PR-7 |
| N4-R4 | ordem alfabética | PR-5 (core) · PR-7 (tela) |
| N4-R5 | os cinco filtros | PR-3 (o nome) · PR-5 · PR-7 |
| N4-R6 | a linha | PR-7 · PR-8 (o toque) · **PR-9** (o *baixando* no aparelho) |
| N4-R7 | favoritar sem otimismo | PR-5 · PR-7/PR-8 · **PR-9** (em prod) |
| N4-R8 | a falha por espécie | PR-5 · PR-7/PR-8 · **PR-9** (as cinco no aparelho; a rede em teste) |
| N4-R9 | sem rede | PR-7 · PR-8 |
| N4-R10 | os estados de sync de L | PR-7 |
| N4-R11 | a busca de L | PR-5 · PR-7 |
| N4-R12 | o cabeçalho de V | PR-8 |
| N4-R13 | o corpo de V | PR-8 |
| N4-R14 | os campos de V | PR-8 |
| N4-R15 | corpo e arquivos em V | PR-8 · **PR-9** (o motivo do 404, div. 1063) |
| N4-R16 | o palco avulso | PR-6 |
| N4-R17 | a S4 do avulso | PR-6 |
| N4-R18 | os ícones novos | PR-4 (o julgamento na PR-7) |
| N4-R19 | os ícones de tipo | PR-4 |
| N4-R20 | os tokens | PR-4 · PR-7 · PR-8 |
| N4-R21 | as frases | PR-3 (e PR-6/7/8 movendo as linhas da tabela) |
| N4-R22 | testIDs | PR-7 · PR-8 |
| N4-R23 | invariante C | todas; **PR-9** 34/34 · 18/18 com o código final |
| N4-R24 | B por superfície; A não quebra | PR-6/7/8 · **PR-9** (a lista consolidada e a contagem nova) |
| N4-R25 | as estimadas | PR-7 · PR-8 |
| N4-R26 | todo arquivo no aparelho | PR-5 (core) · **PR-9** (aparelho) |

---

## 9. As heranças do bloco (o insumo do encerramento)

Tiradas de todos os anexos do N4 (as citações estão nos anexos de origem), mais as desta PR.

### 9.1 Com destino

| item | origem | destino |
| --- | --- | --- |
| faixa A inteira (as molduras `N4-A-*`; a lista de inalcançáveis, §10) | N4-D12; N4-R24 | **N5** |
| avulso em A: o `sair` fora da tela e a `busca` cortada; a barra de 144 | div. 1078; `N4-PR6-anexos` §5.3 | **N5** |
| o arnês do avulso que não anda em A | div. 1080 | **N5** |
| a linha da L com título em 2 linhas em A (e4); o teclado em A | `N4-PR7-anexos` | **N5** |
| o cabeçalho de V em A com título longo (304,8 × ≈ 196) | div. 1108 | **N5** |
| a quebra de linha na letra (palco e V; ≈ 55 colunas em C) | N4-D13; N4-D65; N4-D66 | **bloco próprio entre o N4 e o N5** |
| botões de palavra por ícone (o *Baixar* do palco) | N4-D71; N4-D78 | **bloco de identidade** |
| outro ícone para tocar | N4-D71 | **bloco de identidade** |
| o código de cores por tipo (P-T6…P-T9) | N4-D70; N4-D71 | **bloco de identidade** |
| os tamanhos 13 e 20 como literal | div. 1016; N4-D79 | **bloco de identidade** |
| um nome genérico para o ícone de baixar (`baixar-setlist`) | div. 1025 | **bloco de identidade** |
| o arco da estrela em voo (42 × 42, r 19, traço 2) e o `maxWidth` 560 | N4-D96; N4-D97 | **bloco de identidade** |
| a grade de *Detalhes* (`view.grade`), o rótulo em 13, o pressionado a 6 % | N4-D99; N4-D100; N4-D101 | **bloco de identidade** |
| três alfas soltos (6 % · 8 % · 12 %) | N4-D101; div. 1091 | **bloco de identidade** |
| ícones preenchidos com traço no site | div. 1046 | **bloco de identidade** |
| a barra do palco sem ícone de tipo | div. 1047; div. 1074 | **bloco de identidade** |
| **o `falha` em `muted` dos avisos de "a setlist sumiu" — escolha ou acaso** | **N4-D104** (esta PR) | **bloco de identidade** |
| os seis (e o 7º) "fora do par" do G-par | N4-D47; N4-D49; div. 991 | **Bloco D** |
| o site mostra `content_type` fora do enum como Letra | div. 1038 | **Bloco D** |
| compasso, capo e afinação | N4-D31 | **Bloco D** |
| a Tab editada no web que nenhum leitor vê; o editor da Cifra e o `chords`; o `PUT` do favorito e o `updated_at` | divs. 976, 975; N4-D39 (`I1-ENCERRAMENTO.md` §10.1, 17–19) | **Bloco D** |
| o teto de 100 do `GET /api/content`; o pedido de 1000 do picker do web | N4-D10; div. 957 | **Bloco D** |
| `vitest` dentro de `packages/core`; `packages/core/**` fora do `paths` do `native.yml` | div. 970 (N4-D37); div. 988 (N4-D52) | **W5** |
| o G-tok lê genérico TS como JSX; o G3 conta comentário | div. 1034; div. 1109 | **W5** |
| **o `fechar-busca` "inalcançável" do arnês de A do N3** (o caminho velho: `buscar` abre a L) | **div. 1131** (esta PR) | **W5** |
| **o `R.mock` do `roteiro.py` preso à 8788** (a cópia com a `PORTA` desta PR vira o instrumento) | **div. 1134** (esta PR) | **W5** |
| o rodapé do picker sob o teclado em B | div. 450; div. 1082 | **polimento do nativo, pós-N3** |
| as duas formas do motivo dentro do web | N4-D29 (`I1-ENCERRAMENTO.md` §10.5, 11) | **bloco seguinte ao I1** |
| o tema claro nas telas de lista | brief §4, regra 12 | herança do V1, **fora do N4** |
| a tabela das 39 frases (N4-R21 zerada); as 16 só de S1; as corridas no `CI-FAIXA.md` | div. 1029; div. 1040; regra 22 | **o encerramento do N4** (tarefas) |
| **o release com 100 + 100 aberturas frias e zero queda nativa** | **N4-D105 d** (esta PR) | **o encerramento do N4** (A-N4-28) |
| **o julgamento do Marcel no A-N4-26** (o tempo até tudo baixar) | esta PR (errata) | **o encerramento do N4** |

### 9.2 Sem destino (o encerramento nomeia)

1. as notas da música no palco (N4-D57: *"o encerramento do N4 nomeia o bloco"*);
2. o corte de 50 que continua na S4 e no picker (`search.ts:58`, N4-D90);
3. as demais frases do web, fora do vocabulário de content (N4-D14);
4. o vocabulário do tablet inteiro no core (as 16 de S1; div. 1040, *"bloco a definir"*);
5. a PR de instrumento do envio ao Codecov tolerante a falha (div. 1072, *"decisão do Marcel"*);
6. a §7.5 do `W4-ENCERRAMENTO`, a medição fria do release (div. 998, *"decisão do Marcel"*);
7. o `rm *.json` do `n3pr6b.py:84` (rastro; a receita do `APARATO.md` é a fonte);
8. **a queda nativa na abertura do dev client** (`Fatal signal 11`, Fabric; N4-D105 e) — o A-N4-28 decide se bloqueia o
   release (esta PR);
9. **a foto do sync que deixa um arquivo apagado como "baixado" até reabrir** (div. 1121, esta PR);
10. **a linha `download-error` em duas linhas** quando a causa não é reconhecida (só o ramo do status virou uma linha;
    a regra "um evento, uma linha" do catálogo) — esta PR.

---

## 10. A faixa A — a lista consolidada dos inalcançáveis `[medido: roteiros/phone-n3.txt, phone-l.txt, phone-v-2.txt]`

O `octavia_phone` em pé (411,4 dp), com o código final:

| superfície | inalcançável | medido |
| --- | --- | --- |
| S2e (o índice em edição) | `setlist-apagar` (sem nó no dump) | aqui; igual ao N3 (`N3-ENCERRAMENTO.md:585`) |
| o diálogo de apagar | `apagar-manter`, `apagar-confirmar` (a superfície não abre sem o `setlist-apagar`) | aqui; igual ao N3 |
| o palco (com setlist) | `busca`, `sair` (sem nó no dump) | aqui; igual ao N3 |
| o palco avulso | `sair` (fora da tela; o `BACK` do sistema cobre) · a `busca` cortada | N4-PR6 §5.3 (diff vazio no palco) |
| L | **nenhum** — voltar, campo, filtros, estrela, ▶, a linha | aqui (`phone-l.txt`); N4-PR7 |
| V | **nenhum** — voltar, estrela, ▶, o *Baixar* (4 estados) | aqui (`phone-v-2.txt`); N4-PR8 |
| S4 | o arnês do N3 dá `fechar-busca` inalcançável porque chega à S4 pelo `buscar` de S1, que desde a N4-R1 abre a L — **caminho velho do instrumento**, não a tela (div. 1131 → W5) | — |

**Quedas na faixa A**: 1 nativa (a 5ª do §5.2, na abertura de um estado do `phone-v.py`); refeito o `phone-v.py`, 0. Os
40 ciclos de abertura no celular (até a L e até V), 0.

---

## 11. Erratas e divergências

**Erratas**: no `N4-REQUISITOS.md` — o release sai desta PR (N4-D103), a condição do A-N4-28 (N4-D105 d), o A-N4-26 (o
teto pela fixture; a coluna do Marcel), o A-N4-8 (a rede em teste) e a linha das decisões; no `APARATO.md` — a queda
nativa na contagem (N4-D105 a), o celular em `-port 5556`, a ordem das fixtures, o `R.mock` na 8788; no `LOGS-OCTAVIA.md`
— o 404 do Android no ramo do status. Nenhuma errata de medida da folha (a N4-E13 segue livre).

| div. | col. | o quê | destino |
| --- | --- | --- | --- |
| **1121** | D | a div. 1086 diz que o `presentUrls` lê o `files-index.json`; o `listFiles()` confere o disco — o "baixado" velho é a foto da raiz entre uma atualização e outra | medido (§4.3); a foto é herança sem destino (§9.2) |
| **1122** | A | a div. 1063 diz que o 404 chega sem o status; ele vem na segunda linha do `message` (`→ Caused by: … HTTP 404`) | **consertado** (`527cf93`); errata no `LOGS-OCTAVIA.md` |
| **1123** | D | o `N4-PR8-anexos/README.md` §5.2 diz que V falhou mostrou *o servidor respondeu 404*; o dump dela (`N4P8V-V-arquivo-falhou-*`) só tem *não consegui baixar* (a genérica não se repete) | registro; o conserto da 1122 faz a frase aparecer (§4.2) |
| **1124** | T | a corrida da rede: o mock é `localhost` pelo `adb reverse` e responde em avião; a tentativa que perde grava o favorito, e a seguinte não achava *Favoritar* | consertado no instrumento (`be9dcf2`) |
| **1125** | T | o `falhouLinha` (e o `teto`) limpavam o logcat no meio da rodada — a cobertura de queda da 1ª rodada de paisagem do AVD recomeça às 10:44 | consertado no instrumento (`be9dcf2`) |
| **1126** | A | a queda nativa `Fatal signal 11` na abertura do dev client, invisível à contagem de `FATAL` das PRs anteriores | **N4-D105**; §5; errata no `APARATO.md`; herança |
| **1127** | P | o A-N4-26 pede *"o teto reduzido no mock"*; o teto é constante do app | **N4-D106**; errata do A-N4-26 |
| **1128** | T | a fixture do teto com n = 9 não deixou nada de fora: o estouro de até 3 arquivos da N4-D88 coube nela | n = 14; registro |
| **1129** | T | o estado `teto` sincronizava com o mock que estava de pé (o da visualização) | consertado no instrumento (`6d9634e`) |
| **1130** | A | uma corrida do G-inv do AVD reprovou por dado: as setlists da fixture da visualização ficaram no cache (o sync as guarda com o `updated_at` igual) | boot limpo → 18/18 · 9/9; errata no `APARATO.md` |
| **1131** | T | o `fechar-busca` "inalcançável" no arnês de A do N3: o `buscar` abre a L desde a N4-R1 | **W5** |
| **1132** | A | o `octavia_phone` sozinho sobe como `emulator-5554`, e os arneses o reconhecem pelo `5556` | `-port 5556`; errata no `APARATO.md` |
| **1133** | P | o orçamento da prova (4 `GET`) não cobria o sync de confirmação de cada escrita que o prompt pede (6) | revisto e **aprovado** pelo Marcel antes de qualquer requisição |
| **1134** | T | o `R.mock` do `roteiro.py` do pre-check mata e sobe sempre a 8788; o mock do Tab é a 8789 | a cópia com a `PORTA` (`roteiro-porta.diff`); errata no `APARATO.md`; **W5** |
| **1135** | T | a 1ª passada do `especiesL` em retrato no AVD esgotou a espera de 40 s no *sem resposta* | refeita na rodada 2 (verde); registro |

---

## 12. Gates, a volta e a contabilidade

### 12.1 Gates na ponta `[medido: gates.txt]`

| gate | resultado |
| --- | --- |
| G-inv · `g-inv-par` · G-N3 | §4.5: 34/34 · 18/18 · 8/8 · (e)=0 (b)=0 |
| G5/G6 | nenhum alvo novo (G2 121 = 121); os de L e V são os da N4-PR7/PR8, `diff` vazio |
| G1a / G1b | com o bloco do corpo: `G1a: DIFF VAZIO ✓ (e nenhum arquivo novo no escopo)` — 6 exceções, todas usadas · `G1b: só adição ✓` |
| G2 / G3 | `testIDs antes=121 depois=121` ✓ · `log( antes=70 depois=70`, nenhuma linha sumiu ✓ |
| `gate:a20` · `gate:icones` | 0 acusações (229 literais) · 0 acusações, 0 avisos |
| G-par (os dois) | `n4-g-par.test.tsx` 2 ✓ (a lista de reprovados; o retrato do site) · `g-par-visualizacao.test.tsx` 1 ✓ |
| o gate do corpo do favoritar | `n4-favoritar-put.test.tsx` 5 ✓ (1 pulado, como na N4-PR8) |
| igualdade das frases · G-tok | `frases-n4` (nativo 52 ✓, web 179 ✓) · **G-tok PASSA**, cobertura PASSA (nenhuma frase mudou) |
| o pacote de identidade | `igualdade.test.ts` 35 ✓ · `css.test` 4 ✓ (o pacote não muda) |
| site: G-back · G-palco · G-faixa | PASSA (`✓ nenhuma`) · PASSA (0) · PASSA — nenhum arquivo do site muda |
| `SHA256SUMS` | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · `docs/ux/DESIGN-I1` 14 · `N3-PRECHECK-anexos` 355 — todos OK; `dumps/SHA256SUMS.txt` e `dumps-g-inv/SHA256SUMS.txt` desta pasta |
| a suíte | **1669 ✓** · 59 pulados · 139 arquivos (3 pulados) |
| `tsc` | raiz 0 · core 0 · identidade 0 · nativo 0 |
| lint | *No ESLint warnings or errors* |
| CI | no `527cf93` (o último commit de código): **10 de 10 verdes** — `android-debug-apk` **13m50s** (job; run `37631556721`) · `build` 3m57s · `gates-nativos` (com as 6 exceções do corpo) · `g-back` · `g-tok` · `g-palco` · `g-faixa` · `mudou-nativo` · Vercel. No `6af916d` (a troca): `android-debug-apk` verde (run `37625875787`, 14m28s de workflow). No `6d9634e` (só instrumento): o APK pulado (`mudou-nativo`), o resto verde. O commit de docs: no corpo da PR |

### 12.2 A volta e o estado final

| | |
| --- | --- |
| o Tab | o release (`6eae4a8b…`) com as duas provas da N4-D56; o seu cache regravado md5 a md5 (4/4); os arquivos da fixture apagados por nome; as cópias do Mac apagadas; os settings iguais aos lidos (§4.6) |
| o AVD | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, `ping` → *unreachable*, `reverse` vazio — **igual ao lido**; desligado sem salvar (o `ram.bin` do `default_boot` de 2026-09-24 14:00); o dev client de 2026-09-24 14:00:01 (`estado/avd-fim.txt`) |
| o celular | igual ao lido, `reverse` vazio, desligado sem salvar (duas vezes: a faixa A e a prova em prod) |
| `.env` | apagado nas árvores (a da PR e as temporárias da `main` e da `d78ea89`; nenhum valor lido) |
| Metro e mocks | parados; `reverse` vazio nos três aparelhos |
| temporários | a fixture do teto apagada do Mac; a árvore temporária da `main` (o crash) e a da `d78ea89` removidas; o `metro-cache` apagado |

### 12.3 Contabilidade

| | |
| --- | --- |
| commits | 8 (`b311f50` · `6af916d` · `be9dcf2` · `527cf93` · `6d9634e` · `368c24f` · `f80745f` · docs) — dois de produto (a troca; a 1063), cinco de instrumento, um de docs |
| código de produto | `LinhaDeAviso.tsx`, `IndexScreen.tsx`, `ModoDeReordenar.tsx`, `Picker.tsx`, `SetlistsScreen.tsx`, `files.ts` (G1a: as seis exceções no bloco do corpo); nenhum arquivo do site, do core ou do pacote |
| testes | 1 arquivo novo (20 casos); +3 casos no `files-mensagem`; +1 igualdade de tipo no contrato |
| decisões · divergências | N4-D103…D106 · 1121…1135 (15); a próxima livre é a **1136** |
| prod | **2 escritas**, **6 `GET`**, **4 downloads de storage** (265 002 B) na prova; **2 `GET`** e 0 escritas na N4-D56 do Tab |
| aparelho | o Tab de 13:21 a 14:16; o AVD em cinco subidas sem salvar; o celular em três |

---

**A próxima PR desta lista** (N4-D72): **o encerramento do N4, com o release no Tab** — o A-N4-28 com as 100 + 100
aberturas frias da N4-D105 d, a coluna do Marcel no A-N4-26, e as heranças do §9.
