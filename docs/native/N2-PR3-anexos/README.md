# N2-PR3 — anexos

PR: **N2 — PR-3: S1 com "Nova setlist", criar, linha de aviso**.
Branch `n2/pr3-s1-criar`, sobre `fedfd24` (merge da #314).

| arquivo | o que é |
| --- | --- |
| `CN-antes.txt` | os 14 CNs contra a árvore de `fedfd24` — **12 reprovam por asserção**, e o `apos-escrita.test.tsx` reprova **por ausência do módulo** |
| `CN-antes-gates.txt` | `gate:a20` e `gate:icones` logo depois do commit 1 — o `icones` REPROVA (1 acusação), que é o commit 2 ainda não ter desenhado |
| `CN-depois.txt` | os mesmos, com o commit 2 — 260 passam, 0 falham |
| `gates-depois.txt` | `tsc --noEmit`, os dois gates e os CNs deles, G1, G2 e G3 |
| `dumps/` | **os 10 dumps do §4.1 e do §4.2**, com `SHA256SUMS.txt` — ver `aparato.md` §3 |
| `device-prod.txt` | **§4.2 FEITO**: o primeiro `POST` do nativo em prod, `201`, logcat verbatim |
| `aparato.md` | **o §4 inteiro**: dev client, G5/G6, as medidas contra o congelado (**N2-E6**), os dois defeitos achados, as divs. 250–259 |

---

## O §4 FOI EXECUTADO — em sessão própria, 2026-09-22

**Feito**, na árvore `../octavia-n2-pr3-aceite` sobre o mesmo `25c00ee`, com o
Tab S6 e o AVD `octavia_tab32`. O resultado está em
[`aparato.md`](aparato.md) e [`device-prod.txt`](device-prod.txt); o §4.2
passou (`write op=create … status=201`, **sem 401** — a H-N2-2 não se
manifestou). Fica abaixo, **sem edição**, o registro de por que a sessão que
escreveu a PR não pôde executá-lo, e o roteiro que a sessão do aceite seguiu.

Três correções que o aceite teve de fazer no roteiro abaixo, todas medidas e
registradas em `aparato.md` §9: o mock sobe na **8788** e não na 8081 (que é a
porta do Metro) `[div. 250]`; o `--device` do Expo quer **`SM_T865`**
`[div. 251]`; e o estado 7 **não é alcançável** com `escrita-corta` no Android
`[div. 257]`.

## Por que o §4 não foi executado na sessão que escreveu a PR

**A sessão não tem `adb` nem `emulator`.** Medido, literal:

```
$ which adb emulator
(nada)
$ adb devices
(eval):1: command not found: adb
$ emulator -list-avds
(eval):1: command not found: emulator
```

Não é permissão negada e não é aparelho desconectado: as ferramentas não
existem no `PATH` desta máquina de sessão. Logo **nenhum** dump, nenhuma
medição de `bounds` e nenhum logcat pôde ser produzido aqui — e, por
consequência, o primeiro `POST` do nativo em prod também não.

Decisão do Marcel (2026-09-22): a PR abre assim, com o §4 declarado
pendente, e o aceite roda em **sessão própria**, que abre esta mesma
branch numa árvore própria (`git worktree add ../octavia-n2-pr3-aceite
n2/pr3-s1-criar`) **depois que a árvore `../octavia-n2-pr3` for
removida** — duas sessões na mesma árvore já deram incidente (a regra
permanente do `CLAUDE.md`). **O merge continua sendo do Marcel, e só
depois do §4.**

---

## Roteiro do §4, para executar sem interpretar

### 4.0 — o dev client, ANTES de tudo

Esta PR traz um **módulo nativo novo**
(`@react-native-community/datetimepicker` 9.1.0, div. 234). O dev client
que está nos aparelhos hoje **não o contém**: sem rebuild, a folha de
criar estoura ao abrir o calendário.

```bash
cd apps/native && npx expo run:android
```

Nos **dois** aparelhos (AVD `octavia_tab32` e Tab S6). Registrar neste
diretório, em `dev-client.txt`: o sha do commit usado, a data e a hora do
build, e qual aparelho. É o **primeiro build com módulo nativo novo desde
o N1** — se o tempo do `android-debug-apk` sair da faixa de n=14 do CI, a
causa é esta, e a nota vai no relatório.

### 4.1 — os oito estados, com o mock

Mock e `adb reverse` como nas PRs anteriores:

```bash
python3 apps/native/src/fixtures/aceite.py servidor 8081 escrita /tmp/setlists.json /tmp/content.json
adb reverse tcp:8081 tcp:8081
```

Um `uiautomator dump` por estado, para `docs/native/N2-PR3-anexos/dumps/`:

| # | estado | como chegar | o que conferir no dump |
| --- | --- | --- | --- |
| 1 | `N2-S1-criar` | S1 com lista, online | `criar-setlist` existe; **`bounds` do botão ≈ 190 × 57,8 dp**; a caixa do título encolhe de **709,8 para 495,8**; nenhum cartão coberto |
| 2 | `N2-S1f-criar` | conta/mock sem setlists | **dois** nós `criar-setlist`; o central com `Criar a primeira setlist`; a frase do web **não** aparece |
| 3 | `N2-F-criar` | tocar `Nova setlist` | `form-nome` com foco e teclado aberto; `form-data` com `dd / mm / aaaa`; `form-salvar` e `form-cancelar` |
| 4 | `N2-F-validacao` | folha aberta, nome vazio | `form-erro-nome`; `form-salvar` com `enabled="false"`; `form-salvar-motivo` **visto inteiro** (sem ellipsis) |
| 5 | idem, com data | seletor devolvendo data inválida | `form-erro-data` — **ver a div. 244**: pelo calendário do sistema este estado pode ser inalcançável; se for, registrar "não alcançável no aparelho" e seguir, que é medição e não falha |
| 6 | `N2-F-salvando` | mock `atraso`, tocar `Criar` | `Criando no servidor…`; campos e botão `enabled="false"`; **`form-cancelar` ausente** |
| 7 | `N2-F-falhou` | mock `escrita-corta` | folha aberta, `form-falha` com as duas frases, `form-cancelar` com rótulo `Fechar`, `form-tentar` |
| 8 | `N2-S1-sem-rede` | **avião provado por `ping`** (`connect: Network is unreachable`), não o setting | `aviso-motivo` com a frase de rede; `criar-setlist` com `enabled="false"`; **sem** `aviso-acao` |
| 9 | `N2-S1-salvo-nao-relido` | mock `escrita-resync-500`, criar | `aviso-motivo` nomeando a setlist; `aviso-acao` = `Tentar recarregar` |

**G5** — todo alvo ≥ 48 dp pela regra das duas bordas, nos nove dumps.
**G6** — todo estado do congelado alcançado, cada um com o seu
`resource-id` (a tabela acima é a lista).

Regra do `CLAUDE.md`: **nenhum dump commitado carrega texto de música.**
Se algum nó trouxer corpo, o `text` dele vira
`[N2-PR3: corpo da música omitido — <n> caracteres; bounds preservado]`,
com `bounds` e estrutura intactos.

### 4.2 — prod, conta principal, Tab S6 online: o primeiro `POST` do nativo

Criar a setlist **`N2-PR3 aceite`**, com data em **+3 dias**.

Esperado no logcat, literal, em `device-prod.txt`:

```
write op=create setlist=- items=- status=201 code=- ms=<n>
resync kind=setlists reason=write op=create status=200 setlists=<n> ms=<n>
cache write kind=setlists n=<n> invalidated=1
prefetch plan n=0 reason=7d
```

O `prefetch plan n=0` é o esperado e **não é falha**: a setlist nasce
vazia, então o plano existe e não baixa nada — é o mecanismo, que é o que
a N2-D11 manda medir. A setlist tem de aparecer **no topo** de S1
(`created_at desc`).

**Um único `POST`.** Contagem de requests de escrita em prod nesta PR: **1**.

Em seguida, fechar e reabrir → `invalidated=0`.

**Não apague a setlist**: ela é o objeto do aceite de apagar da PR-4.

Regra 4 do `LOGS-OCTAVIA.md` antes de commitar o logcat:
`grep -rn eyJ` e `grep -rln <email>` têm de sair com exit 1, e
`grep -E 'write op=|resync kind=' device-prod.txt` não pode conter uuid
inteiro, nome de setlist nem título.
