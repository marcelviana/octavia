# W4B2-anexos — o bruto da W4-b2 (#322)

PR de **CI**, gate-first, sem produto e sem aparelho. Rastro: os `.txt` são saída
literal de comando; este README é o índice e o placar. A fonte do bloco W4-b será o
encerramento dele. A fonte dos números de CI, desde esta PR, é o
[`CI-FAIXA.md`](../CI-FAIXA.md).

| arquivo | o que traz |
|---|---|
| `W4B2-A-medir-antes.txt` | a §1: os dois workflows e o ruleset; a série inteira do `native.yml`, nível job (93 corridas na hora da medição); como o `gates-nativos` obtém base e head; o acesso ao corpo da PR; o grep das divergências |
| `W4B2-B-cn-antes.txt` | os CNs e CPs de H1 e H3 contra os scripts do commit 1 (já com a poda) |
| `W4B2-C-cn-depois.txt` | os mesmos contra o commit 2 |
| `W4B2-D-gates-e-suite.txt` | G1 e G2/G3 no modo do CI (com `GATES_DECL`) contra a `main`, o G1 à mão, o `cn-w4b1.sh`, a suíte |

Instrumento: `apps/native/scripts/__cn__/cn-w4b2.sh`, **de mão**, pela razão do
`cn-w4b1.sh`.

## Extras, declarados antes do commit que os usa

- **extra-1**: o `gates-nativos` sai do `ci.yml` para um workflow próprio, o
  `gates.yml`, com `edited`. Editar o corpo reroda o gate **sem** rodar o `build`.
  Um `if` que pulasse o `build` em `edited` deixaria um `build` SKIPPED no mesmo
  head, que o ruleset lê como verde. O nome do job é o mesmo; o ruleset exige
  `gates-nativos` com `integration_id` 15368, que é o GitHub Actions, de qualquer
  workflow.
- **extra-2**: o detector do H1 é um script (`mudou-nativo.sh`), e não um passo
  inline, para que o CN possa rodá-lo contra refs fabricadas.
- **extra-3**: o CN de H3 rodado **ao vivo** na própria PR, editando o corpo (§3).

## 1. H1 — o APK por push

| push | commit | o que tocou | `mudou-nativo` | `android-debug-apk` |
|---|---|---|---|---|
| abertura | `931f3e0` | `apps/native/scripts/` (native.yml velho, sem detector) | — | **10m10s** (`35884529077`) |
| `synchronize` | `34bc96a` | os três workflows, `apps/native/scripts/`, anexos | `ANTES=931f3e0` → `nativo=true` | **11m29s** (`35885921847`) |
| `synchronize` | commit 3 | só `docs/` | tem de dar `nativo=false` | tem de aparecer **skipped** — no corpo da PR e no relatório (div. 359) |

`gh pr checks 322` depois do commit 2 `[medido]`:

```
Vercel	pass	0	https://vercel.com/marcelvianas-projects/octavia/6aBwQnAGk7AJjdx5n3oGLALbHFQj	Deployment has completed
Vercel Preview Comments	pass	0	https://vercel.com/github	
android-debug-apk	pass	11m29s	https://github.com/marcelviana/octavia/actions/runs/35885921847/job/107265980145	
build	pass	3m44s	https://github.com/marcelviana/octavia/actions/runs/35885921751/job/107265901900	
gates-nativos	pass	8s	https://github.com/marcelviana/octavia/actions/runs/35886068014/job/107266404031	
mudou-nativo	pass	9s	https://github.com/marcelviana/octavia/actions/runs/35885921847/job/107265902741	
```

Do log do `mudou-nativo` (run `35885921847`): `ACAO: synchronize`,
`ANTES: 931f3e09…`, e as onze linhas de `desde o push anterior (931f3e0…..HEAD)`,
entre elas `.github/workflows/native.yml` e `apps/native/scripts/mudou-nativo.sh`.

**O risco declarado, que o prompt previa**: o último APK da PR passa a ser o do
último push que tocou o nativo. **E um risco que o prompt não previa (div. 360)**:
se o APK do push nativo **falhar** e o push seguinte for só de docs, o check do
head fica *skipped*, e o vermelho some da lista de checks da PR. Como o APK não é
exigido, isso não muda o que o merge exige, mas muda o que se vê.

## 2. H3 — o placar dos controles

| controle | commit 1 (scripts de antes) | commit 2 |
|---|---|---|
| CN-H1a só docs → `false` | detector ausente ✗ | `nativo=false` ✓ |
| CP-H1b/c/d `apps/native/src`, `native.yml`, `pnpm-workspace.yaml` → `true` | ausente ✗ | `true` ✓ |
| CP-H1e push forçado → `true` · CP-H1f `opened` → `true` | ausente ✗ | `true` ✓ |
| CN-H1g o `native.yml` usa o detector | ✗ | ✓ |
| **CP-H3a** exceção no **corpo**, e não no script, arquivo mudado → passa | reprova (o corpo é ignorado) ✗ | `exit 0` ✓ |
| **CN-H3b** nem no corpo nem no script → reprova | `DIFF NÃO VAZIO` ✓ (já reprovava) | ✓ |
| **CN-H3c** lista local não vazia com `GATES_DECL` → reprova (g1 e g2g3) | `exit 0` ✗ | `LISTA LOCAL NÃO VAZIA` · `exit 1` ✓ |
| CN-H3d exceção no corpo e não usada → reprova | reprova pelo motivo **errado** (`DIFF NÃO VAZIO`) ✗ | `NÃO USADA` ✓ |
| CP-H3e exceção + par G1b + errata G3, tudo no corpo → passa | ✗ | `exit 0` nos dois ✓ |
| CN-H3f o mesmo sem a errata → g2g3 reprova | ✓ (já reprovava) | `SEM ERRATA` ✓ |
| CP-H3g remoção do G3 no corpo → passa | ✗ | ✓ |
| CN-H3h/i/j/k extrator: chave desconhecida, dois blocos, não fechado, fora de ordem | extrator ausente ✗ | reprova, cada um com a mensagem ✓ |
| CP-H3l/m extrator: CRLF + prosa + comentário; corpo sem bloco | ausente ✗ | ✓ |
| CN-H3n o `gates.yml` lê o corpo, e o `ci.yml` perdeu o job | ✗ | ✓ |
| CP-H3o as listas locais da árvore estão vazias (a poda) | ✓ | ✓ |

`W4B2-B`: **23** controles reprovados, mais o rodapé que contém `***` (a mensagem do
commit 1 diz "24 linhas", e 24 são as linhas; controles são 23; div. 358).
`W4B2-C`: **zero**.

## 3. H3 ao vivo, na própria PR (extra-3) `[medido]`

1. **16:02:59Z**: o corpo ganhou `g1a: apps/native/src/api.ts` (um arquivo que a PR
   não toca). Evento `edited` → run `35886012518`, `gates-nativos` **failure** em
   8 s, **16 s depois do edit**:
   ```
   declarações (1 linhas):
     g1a: apps/native/src/api.ts
   declarações: do corpo da PR (GATES_DECL=/home/runner/work/_temp/decl)
     G1a: EXCEÇÃO DECLARADA E NÃO USADA ✗ — poda (divs. 141, 339):
           apps/native/src/api.ts
   ##[error]Process completed with exit code 1.
   ```
2. **16:03:29Z**: o corpo voltou → run `35886068014`, **success** em 8 s, **23 s
   depois**. O `build` e o APK não rodaram de novo.

**O bloco como ficou no corpo da PR** (sem declaração: a PR não muda arquivo de
comportamento, teste do core nem linha de log):

````
```gates
# W4-b2: nenhuma declaração — esta PR não muda arquivo de comportamento, teste do core nem linha de log.
```
````

**O custo na prática, numa frase**: declarar passou a ser editar o corpo e esperar
~20 s, sem commit nem poda, mas a declaração perdeu o histórico do git, e quem roda
à mão precisa de um `gh pr view` a mais.

## 4. A série — conferida contra o `gh` `[medido]`

As 21 do N2 (§7 do encerramento) conferem, run a run e segundo a segundo. Conferem
também a 19ª do W3 (`35096488810`, 11m47s) e as sete de `push` que o N2 listou. A de
`bc55419`, que ainda corria, deu **10m06s**. As duas diferenças estão na div. 354.
A série inteira, com as desta PR, está no [`CI-FAIXA.md`](../CI-FAIXA.md):
**n=91 · 4m42s–14m32s · mediana 11m47s · IQR 3m20s (9m24s–12m43s)** no commit 3; com as corridas das decisões de antes do merge (§7), **n=94 · mediana 11m50s · IQR 3m17s**. **Referência final** (o corte do Marcel, §10): o regime 2, desde a #284, **n=78 · 8m09s–14m32s · mediana 12m12s · IQR 1m49s (11m01s–12m50s)**.

## 5. Divergências — 352 a 360

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **352** | P | o grep do prompt (`\*?\*?3[0-9]{2}\*?\*?`) dá **399** como a maior: ele casa qualquer número de três dígitos (linhas citadas, contagens). A maior divergência na `main` é a **351** (forma `\| **351** \|`, `W4B1-anexos/README.md`) | esta PR começa na 352 |
| **353** | T | O H1 só filtra `synchronize` com `before` **ancestral** do head; o push forçado roda sempre. Dos 7 do B8.1 no N2, **3 foram forçados** (#315: `a3061e6`, `a1f3f54`, `c8db83a`, com a árvore mudando só em docs): o H1 teria poupado **4 (48m22s)** dos 83m32s. Comparar árvore com árvore (`git diff before head`, que vale sem ancestralidade) pegaria os 7, mas o `before` de um push forçado não vem no checkout e exigiria `git fetch origin <sha>` de um commit órfão, que o GitHub pode já não servir | **não** implementado: fica para o Marcel decidir. Com a queda para "roda" quando o fetch falhar, seriam umas 3 linhas a mais no `mudou-nativo.sh` |
| **354** | D | Duas afirmações do `W3-ENCERRAMENTO.md` que o `gh` e o `git` desmentem: (a) a corrida da **#304** "foi cancelada pelo `--delete-branch`"; o `gh` diz `success`, 12m46s, com todos os passos verdes (`35044913963`); (b) a **18ª** (`712f054`) foi "push só de docs"; o diff `f70d988..712f054` toca `apps/native/scripts/g2g3.sh`, `sem-comentario.awk` e `apps/native/test/gates.test.ts` | a 18ª é marcada **nativo** no `CI-FAIXA.md`, e a #304 entra com nota; o W3 ganhou uma linha apontando para cá, sem reescrever o texto dele |
| **355** | P | "a série inteira", nas estatísticas: as **4 falhas** (26 s a 1m14s) não produziram APK. Duas eram CN plantado (N0-PR2 e N0-PR3), duas o `setup-android@v3` | ficam na tabela, riscadas, e **fora** da população (`n=91`, não 95); declarado no cabeçalho do `CI-FAIXA.md` |
| **356** | P | "lista não vazia **na base** → reprova" foi implementada no **head**: no CI, o script da própria PR com lista local não vazia reprova. É a forma mais forte, porque barra a entrada em vez de acusar depois, e a base de uma PR é o head de uma PR anterior que passou por esse mesmo teste | CN-H3c |
| **357** | P | "no corpo da PR **ou** em trailers de commit": só o corpo foi implementado. Um trailer não se corrige sem reescrever a história (push forçado, que também desliga o filtro do H1, div. 353), e o gate teria de juntar duas fontes | corpo apenas; os trailers ficam de fora, e é uma linha no `gates.yml` se o Marcel quiser |
| **358** | T | a mensagem do commit 1 diz "24 linhas `***`"; são 23 controles reprovados mais o rodapé | corrigido aqui; a mensagem não foi reescrita |
| **359** | P | o prompt pede no anexo "os dois `gh pr checks`", mas o do commit 3 só existe depois do push do commit 3, e a lista de commits é fechada | o do commit 2 está aqui (§1); o do commit 3 vai no corpo da PR e no relatório |
| **360** | T | o risco do *skipped* que esconde um APK vermelho (§1) | registrado; a saída seria comparar com o último APK **verde** da branch (consulta à API), o que não cabe em 10 linhas. Decisão do Marcel |

## 6. Contabilidade

| | |
|---|---|
| requests a `/api/*` em prod | **0** |
| comandos a aparelho | **0** |
| APKs gastos | 2 (a abertura e o commit 2), e o commit 3 saiu *skipped*; nas decisões, mais 5: 3 verdes (14m31s, 13m27s, 9m45s) e 2 vermelhos plantados (59 s, 1m09s) |
| edições do corpo da PR | 2 (o CN ao vivo e o desfazer) |
| outras mudanças fora da lista | `cn-w4b1.sh`: o CN-223b procura o passo no `gates.yml` quando ele existe (3 linhas), senão reprovaria por o job ter mudado de arquivo |

## 7. Antes do merge — as decisões do Marcel (2026-09-23)

Cinco decisões depois do relatório: as divs. 353, 360 e 354, a regra do H3 e o
detector contando o próprio workflow. **Gate primeiro**: os CNs novos entraram em
`b8dcec8` e reprovaram contra o detector de então (`W4B2-E`: 5 reprovados, H1h, H1i,
H1j, H1k e H1m). Contra o detector novo (`f32a2ba`, `W4B2-F`), zero reprovados.

**Extras, declarados antes dos commits que os usam**:
- **extra-4**: o commit `test(W4-b2)` dos CNs, antes do de `ci`. Os dois subiram
  num push só, então custaram um APK.
- **extra-5**: as sondas do CN da div. 360: o vermelho plantado, o push só de docs
  e as duas reversões.
- **extra-6**: um commit que toca só o `native.yml` (o CN do item 3).
- **extra-7**: o `gates.yml` também no `paths` do `native.yml`. Sem isso, uma PR
  que só tocasse o `gates.yml` nem dispararia o workflow.

### 7.1 Os `gh pr checks` de cada push `[medido]`

A última linha de cada bloco é a do log do `mudou-nativo`.

**1. `b8dcec8` + `f32a2ba`** — CNs e o detector novo (toca o nativo):
```
Vercel	pass	0	https://vercel.com/marcelvianas-projects/octavia/FFZhHcAkvz1xdKxzAT1otSnEuQng	Deployment has completed
Vercel Preview Comments	pass	0	https://vercel.com/github	
android-debug-apk	pass	14m31s	https://github.com/marcelviana/octavia/actions/runs/35893874401/job/107292880818	
build	pass	3m48s	https://github.com/marcelviana/octavia/actions/runs/35893874062/job/107292811339	
gates-nativos	pass	10s	https://github.com/marcelviana/octavia/actions/runs/35893874274/job/107292811945	
mudou-nativo	pass	8s	https://github.com/marcelviana/octavia/actions/runs/35893874401/job/107292813082	
último APK desta PR: success. Desde o push anterior (bffe173fbd7c1c35ce2db19bc3179eab6dcc1b4c..HEAD):
  .github/workflows/native.yml
  apps/native/scripts/__cn__/cn-w4b2.sh
  apps/native/scripts/mudou-nativo.sh
  docs/native/W4B2-anexos/W4B2-E-cn-decisoes-antes.txt
  docs/native/W4B2-anexos/W4B2-F-cn-decisoes-depois.txt
mudou-nativo success 2026-09-23T17:11:16Z 2026-09-23T17:11:24Z
android-debug-apk success 2026-09-23T17:11:28Z 2026-09-23T17:25:59Z

```
**2. `56e3d04`** — o vermelho **plantado** (`app.json` com `@octavia/plugin-inexistente`):
```
android-debug-apk	fail	59s	https://github.com/marcelviana/octavia/actions/runs/35895625003/job/107298786545	
Vercel	pass	0	https://vercel.com/marcelvianas-projects/octavia/2P9r4ZVWFxp8EzZegPckPfurveY2	Deployment has completed
Vercel Preview Comments	pass	0	https://vercel.com/github	
build	pass	3m40s	https://github.com/marcelviana/octavia/actions/runs/35895624885/job/107298710942	
gates-nativos	pass	9s	https://github.com/marcelviana/octavia/actions/runs/35895624946/job/107298710723	
mudou-nativo	pass	8s	https://github.com/marcelviana/octavia/actions/runs/35895625003/job/107298711120	
último APK desta PR: success. Desde o push anterior (f32a2baa1953aa474e159096a65d3ae7f9026a00..HEAD):
  apps/native/app.json
mudou-nativo success 2026-09-23T17:26:40Z 2026-09-23T17:26:48Z
android-debug-apk failure 2026-09-23T17:26:50Z 2026-09-23T17:27:49Z

```
`--log-failed`: `Prebuild (android) … PluginError: Failed to resolve plugin for module "@octavia/plugin-inexistente"`.

**3. `c547766`** — **CN da div. 360**: push só de docs, com o último APK da PR
`failure`. **O APK rodou** e falhou de novo, porque o plantado ainda estava lá:
```
android-debug-apk	fail	1m9s	https://github.com/marcelviana/octavia/actions/runs/35899526353/job/107311922062	
Vercel	pass	0	https://vercel.com/marcelvianas-projects/octavia/7z29NwjZDjZ54Whr8i2xT36CA9M5	Deployment has completed
Vercel Preview Comments	pass	0	https://vercel.com/github	
build	pass	3m54s	https://github.com/marcelviana/octavia/actions/runs/35899526395/job/107311829222	
gates-nativos	pass	13s	https://github.com/marcelviana/octavia/actions/runs/35899526373/job/107311829225	
mudou-nativo	pass	10s	https://github.com/marcelviana/octavia/actions/runs/35899526353/job/107311828500	
último APK desta PR: 'failure', não success (div. 360): roda
mudou-nativo success 2026-09-23T18:00:48Z 2026-09-23T18:00:58Z
android-debug-apk failure 2026-09-23T18:01:01Z 2026-09-23T18:02:10Z
```
**4. `019469c` + `32bcd91`** — as duas reversões, com commits novos e sem push
forçado. O `app.json` voltou idêntico ao da `main`:
```
Vercel	pass	0	https://vercel.com/marcelvianas-projects/octavia/5uzx91nvdYvKWQWupSdwvaBJdtLY	Deployment has completed
Vercel Preview Comments	pass	0	https://vercel.com/github	
android-debug-apk	pass	13m27s	https://github.com/marcelviana/octavia/actions/runs/35900151568/job/107314006023	
build	pass	3m49s	https://github.com/marcelviana/octavia/actions/runs/35900151421/job/107313934054	
gates-nativos	pass	7s	https://github.com/marcelviana/octavia/actions/runs/35900151500/job/107313934138	
mudou-nativo	pass	9s	https://github.com/marcelviana/octavia/actions/runs/35900151568/job/107313934226	

32bcd91 mudou-nativo success 2026-09-23T18:06:12Z 2026-09-23T18:06:21Z | android-debug-apk success 2026-09-23T18:06:24Z 2026-09-23T18:19:51Z
último APK desta PR: 'failure', não success (div. 360): roda
```
**5. `3be7718`** — **CN do item 3**: o push só toca o `native.yml`, e o APK rodou:
```
Vercel	pass	0	https://vercel.com/marcelvianas-projects/octavia/6NwUHM4jaGzJSS5HF8iCkbVebsrz	Deployment has completed
Vercel Preview Comments	pass	0	https://vercel.com/github	
android-debug-apk	pass	9m45s	https://github.com/marcelviana/octavia/actions/runs/35901808803/job/107319710267	
build	pass	3m57s	https://github.com/marcelviana/octavia/actions/runs/35901808843/job/107319617576	
gates-nativos	pass	11s	https://github.com/marcelviana/octavia/actions/runs/35901808619/job/107319616519	
mudou-nativo	pass	10s	https://github.com/marcelviana/octavia/actions/runs/35901808803/job/107319617860	

3be7718 run 35901808803 mudou-nativo success 2026-09-23T18:20:50Z 2026-09-23T18:21:00Z | android-debug-apk success 2026-09-23T18:21:03Z 2026-09-23T18:30:48Z
último APK desta PR: success. Desde o push anterior (32bcd9176f19ee76b7148356a1fafe6993dc21c6..HEAD):
  .github/workflows/native.yml
```
**6. O commit de docs destas decisões** — com o último APK `success` e só docs, tem
de sair **skipped**. Os checks dele vão no corpo da PR e no relatório, pela
div. 359.

### 7.2 O `mudou-nativo.sh` final

Está em `apps/native/scripts/mudou-nativo.sh` (`f32a2ba`). Ele só filtra quando as
três condições valem: `synchronize`, `before` ancestral do head e **último APK da
PR `success`**. Em qualquer outro caso, roda. O que conta como nativo:
`apps/native/**` (o script incluído), `native.yml`, `gates.yml` e
`pnpm-workspace.yaml`. A consulta real ao `gh`, feita à mão contra esta PR, está no
`W4B2-F`. No CI, as linhas 1, 2 e 5 acima mostram a consulta funcionando com o
`GITHUB_TOKEN`.

### 7.3 As regras

As duas regras novas estão no `LOGS-OCTAVIA.md`, "Errata W4-b2": **sem push forçado
em PR** (com a hipótese de comparar árvore contra árvore e o número do N2, 3 de 7)
e **toda PR copia o seu bloco ```` ```gates ```` para o README dos anexos no
commit de docs**. A errata da div. 354 está no `W3-ENCERRAMENTO.md`, nos dois
trechos que o `gh` desmente.

## 8. O bloco ```` ```gates ```` desta PR, verbatim

Copiado do corpo da PR #322 no commit de docs, pela regra da §7.3:

````
```gates
# W4-b2: nenhuma declaração — esta PR não muda arquivo de comportamento, teste do core nem linha de log.
```
````

## 9. Divergências — 361 a 364

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **361** | T | o instrumento de espera desta sessão (um script de scratch) lia o `HEAD` do checkout principal (`5f1c226`), e não o da worktree. Na espera do push 2 ele rodou até o limite, sem achar as corridas do sha errado | os `gh pr checks` colados são os da corrida certa, conferidos pelo sha no log do `mudou-nativo`; o script ganhou `cd` na worktree |
| **362** | T | as duas reversões (`019469c`, `32bcd91`) saíram com a mensagem padrão do `git revert`, **sem** a linha `Co-Authored-By`. Pôr a linha exigia reescrever dois commits locais, ainda não enviados, e o classificador de permissão da sessão barrou a reescrita | ficaram assim, e registradas aqui. A regra nova (sem push forçado) também não deixaria corrigir depois |
| **363** | P | "reverta os dois com commits novos": as duas reversões subiram **juntas**, num push que toca o `app.json`. Por isso a reversão da sonda (só docs) não teve um *skipped* próprio | o *skipped* com o último APK verde é o do commit de docs (§7.1, item 6), e antes dele o do `bffe173` |
| **364** | P | "`mudou-nativo.sh` conta como nativo": ele já contava, porque mora em `apps/native/`. A CN-H1l passou já contra o detector velho (`W4B2-E`) | registrado; o `gates.yml` era o único dos três que faltava |

## 10. O corte da faixa — decisão do Marcel (2026-09-23)

A série inteira continua no `CI-FAIXA.md`, em ordem, agora em **dois segmentos**:
**regime 1**, antes da #284, e **regime 2**, desde a #284. O **cabeçalho de
referência** passa a ser calculado **só do regime 2**:

```
n=78   mín 8m09s   máx 14m32s   mediana 12m12s   Q1 11m01s   Q3 12m50s   IQR 1m49s
```

O regime 1 tem 18 corridas, 2 falhas (as plantadas do N0) e n=16: 4m42s–9m26s,
mediana 6m57s, IQR 0m51s. A série inteira (n=94, mediana 11m50s, IQR 3m17s) fica
como recorte descritivo. As duas plantadas da #322 seguem riscadas, no regime 2.

**A regra**, no `CI-FAIXA.md` e no `LOGS-OCTAVIA.md`: **mudança na definição do
build abre um segmento novo; mudança só no gatilho (como o H1) não abre.**

## 11. Divergências — 365 e 366

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **365** | P | "cite o commit/PR que **mudou o job**, `[medido]` por `git log -- .github/workflows/native.yml`": o `native.yml` **não mudou na #284**. O log dele pula do `6ccf644` (N0-PR3) para o `d83d94f` (N1-PR8, que só recortou o `paths`). O que mudou na #284 foi o que o job **compila**: o `9806e44` (N1-PR3a) pôs no `apps/native/package.json` os módulos nativos `react-native-screens` e `react-native-safe-area-context`, além do `@react-navigation/native-stack`, do `expo-font` e das fontes, e pôs o plugin do `expo-font` no `app.json` | o corte cita o `9806e44` e o merge `6f30f02`, com os dois comandos `[medido]`. "Definição do build" ficou escrita como **o que o job compila e como**, e não só como o texto do workflow |
| **366** | P | ~~a regra aplicada ao pé da letra **abriria mais segmentos** que o corte decidido. Entrada de módulo nativo depois da #284 `[medido: git log --first-parent 6f30f02..origin/main -- apps/native/package.json apps/native/app.json .github/workflows/native.yml]`: `expo-network` (#285), `expo-keep-awake` (#286), `react-native-svg` (#296, que o V1 §8 mediu recompilando 38 tarefas por corrida), `@react-native-community/datetimepicker` (#315, div. 234). E o `setup-android@v4` (#302, `717104e`) mudou um passo do job | **não** abri segmento para eles: o corte decidido foi um só, na #284, e os quatro somaram sem mudar o regime de ~12 min (a #284 mudou de ~6–7 para ~12). O recorte "desde o v4" está no `CI-FAIXA.md` como descritivo. Fica para o Marcel: a regra precisa de um limiar (por exemplo, "muda o regime") ou de uma lista do que conta como definição?~~ — **decidida** (§12): lista fechada + condição medida |

## 12. A regra dos segmentos — decisão do Marcel sobre a div. 366 (2026-09-23)

Verbatim, no `CI-FAIXA.md` e no `LOGS-OCTAVIA.md`, no lugar de "mudança na
definição do build abre um segmento novo; mudança só no gatilho não abre":

> **Segmentos da série.** Um segmento novo abre só quando as duas
> condições valem: (1) mudou um item da lista fechada — passos do job,
> toolchain (JDK, Gradle, `setup-android`, SDK Android), versão do Expo
> SDK ou do React Native, número de ABIs do APK —, e (2) as cinco
> corridas seguintes têm mediana fora do IQR do segmento vigente,
> `[medido]`. Módulo nativo isolado não está na lista: se mudar o
> patamar, entra pela condição (2) como divergência a investigar, não
> como segmento. Quem abre o segmento é o Marcel, com as duas medições
> ao lado. O corte na #284 foi decisão (div. 365) e é o único até aqui.

**A regra aplicada para trás** às cinco mudanças da div. 366 (também no `CI-FAIXA.md`):

| mudança | (1) na lista? | IQR do segmento vigente, antes da 1ª corrida com a mudança | as cinco corridas seguintes (# da série: job) | mediana | (2) fora do IQR? | abre? |
|---|---|---|---|---|---|---|
| `expo-network` (#285, `08b84d6`) | não — módulo nativo | 12m55s–13m46s (n=2) | 21: 11m57s, 22: 12m45s, 23: 11m22s, 24: 13m23s, 25: 11m45s | **11m57s** | **sim** — IQR de **n=2** (corridas 19 e 20), sem população. Mediana **abaixo**: o patamar não subiu | **não** |
| `expo-keep-awake` (#286, `fc079bd`) | não — módulo nativo | 12m22s–13m06s (n=4) | 23: 11m22s, 24: 13m23s, 25: 11m45s, 26: 8m56s, 27: 10m15s | **11m22s** | **sim** — IQR de **n=4**. Mediana **abaixo**, e a 26 (8m56s) puxa | **não** |
| `react-native-svg` (#296, `8444b18`) | não — módulo nativo | 11m12s–12m22s (n=16) | 35: 13m18s, 36: 12m01s, 37: 9m16s, 38: 12m21s, 39: 11m20s | **12m01s** | não — dentro | **não** |
| `setup-android@v4` (#302, `717104e`) | **sim** — toolchain (`setup-android`) | 11m20s–12m30s (n=29) | 49: 12m43s, 51: 10m27s, 52: 9m19s, 53: 12m26s, 54: 12m37s | **12m26s** | não — dentro | **não** |
| `datetimepicker` (#315, `8681b57`) | não — módulo nativo | 11m05s–12m43s (n=52) | 73: 13m28s, 74: 13m11s, 75: 12m59s, 76: 8m09s, 77: 14m02s | **13m11s** | **sim** — **acima** do Q3. Não se sustenta: da 73 à 100, mediana **12m30s** (n=26), dentro do IQR de antes (div. 368) | **não** |

Como se mediu `[medido: git log -S… -- apps/native/package.json · git merge-base --is-ancestor <commit> <head da corrida>]`:
o commit que introduziu a mudança, e as corridas do regime 2 cujo head **contém**
esse commit. "As cinco seguintes" são as cinco primeiras corridas com APK que o
contêm, em ordem. Corridas de branches paralelas que ainda não o continham ficam
fora. O "segmento vigente" são as corridas com APK do regime 2 antes da primeira
que o contém. Quartis pelo método inclusivo. **Nenhuma das cinco abre segmento**:
os quatro módulos falham a (1), e o `setup-android@v4` passa a (1) mas falha a (2).
A (2) vale para três módulos, e cada um virou divergência, como a regra manda
(divs. 367 e 368).

Os outros itens da lista, conferidos no regime 2 `[medido]`:
- **Expo SDK e React Native**: a última mudança de versão foi na #268, no regime 1 (`git log --first-parent -G'"(expo|react-native)": ' -- apps/native/package.json`).
- **JDK**: `java-version: 17` o tempo todo.
- **ABIs**: nenhuma configuração no `app.json`, então vale o padrão, que não mudou.
- **Passos do job**: só o `setup-android@v4` (#302). O `d83d94f` (N1-PR8) mexeu no `paths`, e a #322 no gatilho (`mudou-nativo`, `needs`, `if`), fora dos passos do `android-debug-apk`.

## 13. Divergências — 367 e 368

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **367** | T | ~~a condição (2) **vale** para o `expo-network` e o `expo-keep-awake`, mas por artefato: o "segmento vigente" tinha **n=2** (as duas corridas da #284) e **n=4**, e a mediana das cinco caiu **abaixo** do IQR, não acima. A regra não fixa um `n` mínimo para o IQR, nem a direção. E "as cinco corridas seguintes" precisou de uma leitura: as cinco primeiras corridas com APK cujo head **contém** o commit da mudança, fora as de branches paralelas que ainda não o continham | como a regra manda para módulo, registrado como divergência, não segmento. Fica para o Marcel: `n` mínimo e direção da (2)~~ — **fechada pela regra** (§14): n ≥ 10 e as duas direções; com n=2 e n=4, a (2) não se avalia |
| **368** | A | `datetimepicker` (#315): a mediana das cinco (13m11s) ficou **acima** do Q3 de então (12m43s, n=52). Isto é a (2) valendo para um módulo, o caso que a regra chama de "divergência a investigar". **Não se sustenta**: da corrida 73 à 100, a mediana é **12m30s** (n=26), dentro do IQR de antes. As cinco incluem a 77 (14m02s) e a 76 (8m09s, o cache da div. 253). A causa não foi medida | registrada, a investigar. Nenhum segmento aberto |

## 14. A condição (2) com n ≥ 10 e dez corridas — decisão do Marcel sobre as divs. 367 e 368 (2026-09-23)

A regra final, verbatim, no `CI-FAIXA.md` e no `LOGS-OCTAVIA.md`:

> **Segmentos da série.** Um segmento novo abre só quando as duas
> condições valem: (1) mudou um item da lista fechada — passos do job,
> toolchain (JDK, Gradle, `setup-android`, SDK Android), versão do Expo
> SDK ou do React Native, número de ABIs do APK —, e (2) as **dez**
> corridas seguintes têm mediana fora do IQR do segmento vigente, para
> cima ou para baixo, e a condição só se avalia quando o segmento vigente
> tem **n ≥ 10** — abaixo disso a série está em formação e não abre
> segmento. Módulo nativo isolado não está na lista: se mudar o
> patamar, entra pela condição (2) como divergência a investigar, não
> como segmento. Quem abre o segmento é o Marcel, com as duas medições
> ao lado. O corte na #284 foi decisão (div. 365) e é o único até aqui.

A tabela refeita, com dez corridas:

| mudança | (1) está na lista? | n do segmento vigente | IQR vigente | as dez corridas seguintes (# da série: job) | mediana das dez | (2) fora do IQR, para cima ou para baixo? | abre? |
|---|---|---|---|---|---|---|---|
| `expo-network` (#285, `08b84d6`) | não, é módulo | **2** | 12m55s–13m46s | 21: 11m57s, 22: 12m45s, 23: 11m22s, 24: 13m23s, 25: 11m45s, 26: 8m56s, 27: 10m15s, 28: 11m14s, 29: 11m39s, 30: 12m20s | **11m42s** | **não se avalia** (n<10: série em formação) | **não** |
| `expo-keep-awake` (#286, `fc079bd`) | não, é módulo | **4** | 12m22s–13m06s | 23: 11m22s, 24: 13m23s, 25: 11m45s, 26: 8m56s, 27: 10m15s, 28: 11m14s, 29: 11m39s, 30: 12m20s, 31: 11m35s, 32: 8m54s | **11m28s** | **não se avalia** (n<10: série em formação) | **não** |
| `react-native-svg` (#296, `8444b18`) | não, é módulo | **16** | 11m12s–12m22s | 35: 13m18s, 36: 12m01s, 37: 9m16s, 38: 12m21s, 39: 11m20s, 40: 11m55s, 41: 11m53s, 42: 11m52s, 43: 10m41s, 44: 12m32s | **11m54s** | não, dentro | **não** |
| `setup-android@v4` (#302, `717104e`) | **sim** (toolchain) | **29** | 11m20s–12m30s | 49: 12m43s, 51: 10m27s, 52: 9m19s, 53: 12m26s, 54: 12m37s, 55: 10m59s, 56: 12m46s, 57: 9m44s, 58: 12m53s, 59: 12m52s | **12m32s** | **sim** — por **1,5 s** (751,5 s contra Q3 = 750 s) | **as duas condições valem** — decisão do Marcel (div. 369) |
| `datetimepicker` (#315, `8681b57`) | não, é módulo | **52** | 11m05s–12m43s | 73: 13m28s, 74: 13m11s, 75: 12m59s, 76: 8m09s, 77: 14m02s, 78: 11m58s, 79: 12m29s, 80: 12m31s, 81: 13m26s, 82: 13m09s | **13m04s** | **sim** — 784 s contra Q3 = 763 s; só volta com vinte corridas (mediana 750 s) | **não** — módulo: divergência a investigar (div. 368) |

Como se mediu `[medido: git log -S… -- apps/native/package.json · git merge-base --is-ancestor <commit> <head da corrida>]`:
o commit que introduziu a mudança, e as corridas do regime 2 cujo head **contém**
esse commit. "As dez seguintes" são as dez primeiras corridas com APK que o
contêm, em ordem. Corridas de branches paralelas que ainda não o continham ficam
fora. O "segmento vigente" são as corridas com APK do regime 2 antes da primeira
que o contém, e o `n` dele está na terceira coluna. Quartis pelo método inclusivo.
**Nenhum segmento foi aberto**, porque quem abre é o Marcel. Mas a regra **não**
dá "nenhuma" para trás:
- o `setup-android@v4` passa a (1) e passa a (2) por 1,5 s (div. 369);
- o `datetimepicker` segue fora do IQR com dez corridas (div. 368, que continua
  aberta, a investigar);
- os dois primeiros não se avaliam (n=2 e n=4 < 10), o que fecha a div. 367.

## 15. Divergências — 368 (segue aberta) e 369

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **368** | A | **não fecha pela regra**, ao contrário do esperado no prompt ("o 368 volta ao IQR"). Com **dez** corridas, a mediana do `datetimepicker` é **13m04s** (784 s), acima do Q3 de então, 12m43s (763 s, n=52). Com vinte volta a 750 s, dentro, mas a regra fala em dez | **segue aberta**, como a regra manda para módulo: divergência a investigar. A causa não foi medida |
| **369** | P | o prompt esperava que nenhuma abrisse. Mas o **`setup-android@v4`** (#302, `717104e`) passa as **duas** condições: (1) é toolchain, está na lista; (2) a mediana das dez seguintes é **751,5 s** (12m31,5s) contra o Q3 do segmento vigente, **750 s** (12m30s, n=29). Fora **por 1,5 s**. A medição `[medido]` está na tabela da §14 | **nenhum segmento aberto**: quem abre é o Marcel, com as duas medições ao lado, e elas estão aqui. Registro que uma margem de 1,5 s num IQR de 70 s é ruído de corrida, mas a regra não tem tolerância. **Decisão do Marcel**: abrir o segmento "regime 3, desde a #302", ou pôr tolerância na (2)? |
