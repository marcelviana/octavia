# N2-PR1 — anexos

> **Rastro, não fonte.** A fonte do bloco é o `N2-ENCERRAMENTO.md` quando
> existir; até lá, o código, os testes e as erratas desta PR (`PRD-TELA-1.md`,
> `LOGS-OCTAVIA.md`, `PRD-TELA-2.md` T2-R18).

| arquivo | o quê |
|---|---|
| `CN-t1r10.txt` | CN do T1-R10 contra o código de ANTES (commit 1): **5 de 6 reprovam**; só passa o caso que lê o `0` literal |
| `CN-t1r10-passa.txt` | o mesmo CN depois do commit 2: 6 de 6 |
| `g1-antes-depois.txt` | G1 na árvore limpa (aviso da div. 141 literal) e depois da poda |
| `gates-commit2.txt` | suíte, lint, tsc, `gate:a20`, `gate:icones`, G1, G2/G3 do commit 2, e o controle do G3 com errata (div. 189) |
| `div121-medicao.ts.txt` | o script da medição da div. 121 (rodado com `pnpm exec tsx`) |
| `device-t1r10.txt` | **item 4, feito** (2026-09-20, Tab S6, conta principal): quatro aberturas, S1 com a setlist nova, S4 com o título novo |

## O contador (decisão a avalizar)

`invalidated` = itens do conjunto **alterados** (`updated_at` diferente) +
**novos** + **removidos** em relação ao cache anterior. Sync sem mudança → 0;
primeiro sync sem cache → `n`. Quando o contador é 0 **e** a ordem é a mesma,
o sync devolve o **mesmo** conjunto (referência), e os derivados memoizados por
referência (índice da S4, status da S1) não se recriam; qualquer outra coisa
devolve o conjunto novo inteiro (T1-R9, sem merge item a item).

## Div. 121 — veredito: **fechada**, mas não pelo contador

Saída de `pnpm exec tsx div121-medicao.ts`:

```
1. sync 0, arquivo U0 no disco: {"kind":"guaranteed","have":1,"need":1}
2a. arquivo trocado no web: invalidated=1 status={"kind":"partial","have":0,"need":1}
2b. letra editada no web: invalidated=1 status={"kind":"guaranteed","have":1,"need":1} corpo={"lyrics":"nova"}
2c. sync falho: action=keep-previous content===anterior=true status={"kind":"guaranteed","have":1,"need":1}
```

- (i) do T1-R17 ("`updated_at` igual ao do último sync") vale **por
  construção**: o `planSync` aplica ou mantém os dois conjuntos juntos (2c), então
  todo content do cache é o do último sync completo. Um `offlineStatus` que
  conferisse `updated_at` compararia o cache com ele mesmo.
- O risco que a div. aponta — ✓ sobre um corpo velho — não acontece: arquivo
  trocado no web ganha `file_url` nova (`app/api/storage/upload/route.ts:94-103`:
  `${Date.now()}-nome`, `upsert: false`) e o indicador cai para ◔ (2a); texto
  editado vive no próprio cache e chega com o sync (2b).
- O que esta PR acrescenta: o status é recalculado quando o conjunto muda
  (`contentById` novo sse `invalidated > 0` ou ordem diferente).
- Sobra o limite já declarado no T1-R10: edição fora da API não bumpa
  `updated_at` e não é vista.

## Item 4 (aparelho) — **feito** (2026-09-20, Tab S6 `RX2N8000F3D`, conta principal)

`device-t1r10.txt` tem o verbatim. Resumo:

| abertura | `kind=setlists` | `kind=content` | o que havia mudado no web |
|---|---|---|---|
| 1 | `n=3 invalidated=1` | `n=63 invalidated=1` | setlist nova `DESCARTÁVEL N2` **e** o content 69735e94 renomeado |
| 2 | `n=3 invalidated=0` | `n=63 invalidated=0` | nada |
| 3 | `n=3 invalidated=0` | `n=63 invalidated=0` | nada (aparelho **travado**: abre, sincroniza e grava atrás do keyguard) |
| 4 | `n=3 invalidated=0` | `n=63 invalidated=0` | nada — a abertura da tela: S1 mostra `setlist-b100382e` 'DESCARTÁVEL N2'; S4 com `colors 2` → `search q=8 n=1`, `resultado-69735e94` 'Colors 2' |

O contador é real no aparelho, não só no CN: com o servidor mudado, as duas
linhas saíram `1` — contra o código de antes elas sairiam `0`, que é a div. 157
inteira. Nada foi baixado (`prefetch plan n=0` nas quatro), o único arquivo do
store continua o mesmo, e o tablet ficou online o tempo todo (nenhum comando de
rádio, regra da V1-PR3).

## Divergências (187–198)

| # | origem | o quê | destino |
|---|---|---|---|
| **187** | P | `sh apps/native/scripts/g1.sh` **sem argumentos** (§2.3 do prompt) roda com BASE e HEAD vazios: `fatal: Not a valid object name`, o uso do `git diff` impresso duas vezes, e ainda assim "DIFF VAZIO ✓" e exit 0 — o gate aceita chamada sem par e passa sem medir. Medi com o par do CI (`merge-base`, `WORKTREE`) | registrada; o G1 devia recusar chamada sem os dois argumentos — PR de instrumento |
| **188** | P | o prompt pede "o `g1.sh` de novo, sem o aviso" no commit 1 **e** declarar ali as exceções que só o commit 2 usa. As duas coisas não cabem juntas: pelo desenho da W3, o aviso sai no commit 1 para as quatro novas. Sem aviso só a partir do commit 2 (`gates-commit2.txt`) | registrada |
| **189** | T | **o G3 com errata não exige substituta**: apagar a linha nova `cache write kind=content …` do `store.ts` → o G3 lista a velha em SUMIRAM, acha a errata, **exit 0**. A errata do W1 autoriza sumir sem exigir a forma nova. Nesta PR quem pega é o CN do vitest (afirma as duas linhas) | registrada; não corrigida (fora da lista fechada). Proposta: errata como par velha→nova, com a nova obrigatória |
| **190** | P | `PRD-TELA-1.md:139` → `:78-80` (§0 e §3 do prompt) é falsa: o texto está em `SETLISTS.md:253-255`; o `:78-80` hoje é o parágrafo de contrato de mudança. A própria div. 184 manda citar por seção — foi o que a errata fez | corrigida (cita a seção) |
| **191** | P/D | N2-D8 e T2-R18: "a div. 121 se resolve pelo mesmo mecanismo". Fecha, mas pela construção do T1-R9 e pela imutabilidade da `file_url`, não pelo `diffByUpdatedAt` (ver acima) | registrada; veredito no T2-R18 |
| **192** | P | item 4.2 do prompt: "a busca (S4) acha o nome novo" da setlist. A S4 só indexa **content** (`buildIndex(contents)`, `SearchScreen.tsx:172`; `core/search.ts:30`) — nome de setlist nunca é achado por ela | registrada; protocolo acima corrigido |
| **193** | D | o A7 do `PRD-TELA-1.md` nunca rastreou o T1-R10 (rastreio "T1-R8, T1-R9"); o T1-R10 ficou pendurado nele só em `N1-PRECHECK.md:193` ("(A7)") e daí no `V1-ENCERRAMENTO.md:122` | corrigida (errata do A7 inclui o T1-R10) |
| **194** | D | T1-R20 diz "índice reconstruído **por item** a cada invalidação"; o app reconstrói o índice **inteiro** quando qualquer item invalida (`buildIndex` sobre o conjunto). Esta PR só poupa o caso "nada mudou" | registrada; custo medido do índice é pequeno (19.481 B de corpo, T1-R20); mexer é tela (S4), fora desta PR |
| **197** | P | as duas edições do web precederam a primeira abertura, então chegaram JUNTAS (uma linha por conjunto, cada uma com o seu `1`); o protocolo previa três eventos separados | registrada; sem prejuízo — o caso "um conjunto invalida, o outro não" está no CN |
| **198** | P | o content **não** teve o nome revertido ('Colors' → 'Colors 2', e assim ficou) — foi o que tornou a S4 mensurável. Estado do web deixado assim, declarado | registrada; o Marcel decide se volta |
| **196** | T | **o CN passou na máquina e reprovou no CI** (4 de 6, `sync não fechou ok: … erro.sem_conexao`, só nos testes que re-sobem o mock). O `aceite.py` imprime `fixture: servidor` (`:272`) **antes** de construir o `HTTPServer` (`:275`), e o CN usava a linha como sinal de pronto. Na máquina o bind ganhava a corrida; no runner, não. Commit 4: o CN só segue quando o mock **responde** a `/api/setlists`. Reprovação contra o código de antes reconferida (5 de 6, todas `AssertionError`) | corrigida no teste; o `aceite.py` não mudou (a mesma corrida existe nos protocolos de device, mas lá há um humano esperando) |
| **195** | T | a lista de erratas do G3 ainda carrega a do W1 (`file src=download …`), mergeada há três PRs — a mesma forma da div. 141, agora no G3 (lá não há aviso de "não usada") | registrada; não podada (fora da lista fechada) |

## Extra declarado antes de commitar

- `apps/native/App.tsx` (4 linhas no `rodarSync`): declarado no commit 1, no
  `g1.sh`, antes do commit 2. É caminho do sync (T1-R13 passo 2), não tela: sem
  ele o `contentById` era recriado em todo sync e o `invalidated=0` seria de novo
  uma frase que o app desmente.
- `apps/native/scripts/g2g3.sh`: a errata do G3, como o prompt previa.
- **Commit 4** (`test(N2-PR1): o CN espera o mock responder`), depois da PR aberta:
  só o teste e os dois anexos do CN — é o conserto da div. 196, que o CI achou.
