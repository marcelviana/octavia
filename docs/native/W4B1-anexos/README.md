# W4B1-anexos — o bruto do W4-b1 (#321)

PR de **instrumento**, gate-first, sem produto. Rastro: os `.txt` são saída
literal de comando; este README é o índice e o placar, não a fonte do bloco
(a fonte do W4-b será o encerramento dele).

| arquivo | o que traz |
|---|---|
| `W4B1-A-medir-antes.txt` | a §1: `g1.sh`/`g2g3.sh` contra a `main` (`f1d65d8`) na árvore limpa, o job `gates-nativos`, o `shasum -c` dos dois `SHA256SUMS`, o docstring da div. 220 e a regra do G3 |
| `W4B1-B-cn-antes.txt` | os CNs e CPs contra os scripts da `main` (commit 1) |
| `W4B1-C-cn-depois.txt` | os mesmos contra os scripts do commit 2 |
| `W4B1-D-gates-e-suite.txt` | G1/G2/G3, o passo de `shasum -c`, `gate:a20` (+CN), `gate:icones` (+CN), G7, `tsc` do core e a suíte |

O instrumento é `apps/native/scripts/__cn__/cn-w4b1.sh`, **de mão**, pela
razão do `ci.yml` e do `cn-w4a.sh`: fabrica um par de refs numa worktree
descartável e injeta as listas numa cópia dos scripts — a mesma injeção roda
contra o script de antes e o de depois.

## 1. O que a `main` tinha `[medido: W4B1-A]`

```
G1a: EXCEÇÃO DECLARADA E NÃO USADA — poda isto ANTES do merge (div. 141):
        packages/core/src/frases.ts
        packages/core/src/escrita.ts
        apps/native/src/escrita.ts
        apps/native/src/screens/Picker.tsx
        apps/native/src/screens/IndexScreen.tsx
        apps/native/src/screens/SetlistsScreen.tsx
        apps/native/src/navigation.tsx
G1b: PAR DECLARADO E NÃO USADO — poda isto ANTES do merge (div. 321):
        expect(r.frase).toBe('sem conexão — nada foi salvo')
          -> expect(r.frase).toBe('sem resposta do servidor')
exit=0
```

G3: lista de erratas vazia, `exit=0`. `shasum -c`: V1 `README.md: FAILED`
(`exit=1`), N2 `OK` (`exit=0`); **zero** ocorrências de `shasum` nos dois
workflows.

## 2. O placar dos controles

| controle | contra a `main` (commit 1) | contra esta PR (commit 2) |
|---|---|---|
| **CN-339a** G1a: exceção órfã ao lado de uma usada | aviso · `exit 0` ✗ | `EXCEÇÃO DECLARADA E NÃO USADA ✗` · `exit 1` ✓ |
| **CN-339b** G1b: par órfão ao lado de um usado | aviso · `exit 0` ✗ | `PAR DECLARADO E NÃO USADO ✗` · `exit 1` ✓ |
| **CN-339c** G3: errata órfã ao lado de uma usada | aviso · `exit 0` ✗ | `ERRATA DECLARADA E NÃO USADA ✗` · `exit 1` ✓ |
| **CP-339** (g1 e g2g3) só o que é usado | `exit 0` ✓ | `exit 0` ✓ |
| **CN-D34a** comentário com `log(` some, sem declaração | `SEM ERRATA ✗` · `exit 1` ✓ (já reprovava) | `SEM ERRATA NEM REMOÇÃO ✗` · `exit 1` ✓ |
| **CN-D34b** a mesma remoção, declarada com razão | `exit 1` — o script não conhece a forma | `exit 0` ✓ |
| **CN-D34c** remoção declarada, a linha ainda existe | `exit 0` ✗ | `REMOÇÃO DECLARADA E NÃO USADA ✗` · `exit 1` ✓ |
| **CN-D34d** remoção declarada sem razão *(extra, div. 350)* | `exit 1`, mas pelo motivo errado (SUMIU) | `REMOÇÃO SEM RAZÃO ✗` · `exit 1` ✓ |
| **CP-D34** remoção usada ao lado de errata usada | `exit 1` ✗ | `exit 0` ✓ |
| **CN-223a** um byte no `telas.html` do V1 (cópia) | `telas.html: FAILED` · `exit 1` ✓ | `telas.html: FAILED` · `exit 1` ✓ |
| **CP-223** a cópia intacta da árvore de trabalho | `README.md: FAILED` · `exit 1` ✗ | `exit 0` ✓ |
| **CN-223b** o passo no `gates-nativos`, com o texto do CN *(extra, div. 350)* | ausente ✗ | presente, contíguo ✓ |

Nenhuma linha `***` (CN ou CP reprovado) em `W4B1-C`.

## 3. `shasum -c` depois `[medido: W4B1-D]`

```
== docs/native/DESIGN-V1
telas.html: OK
icones.html: OK
telas.pdf: OK
== docs/native/DESIGN-N2
telas.html: OK
telas.pdf: OK
exit=0
```

## 4. O que ficou declarado nos gates

| lista | antes (`main`) | depois (esta PR) |
|---|---|---|
| exceções do G1a | 7 (N2-PR7), órfãs | **1**: `packages/core/src/search.ts` (div. 220), usada |
| pares do G1b | 1 (N2-E19), órfão | 0 |
| erratas do G3 | 0 | 0 |
| remoções do G3 | — (a forma não existia) | 0 |

**A lista não fica vazia na `main` depois do merge** (div. 348): a exceção do
`search.ts` é desta PR, e a PR seguinte — qualquer uma, de docs inclusive,
porque o `gates-nativos` não tem filtro de caminho — reprova até podá-la.

**A consequência declarada no `g1.sh`, medida**: o `g1.sh` novo contra o
commit 1 desta PR (`f209c2b`), que ainda não tocava o `search.ts`, reprova com
`EXCEÇÃO DECLARADA E NÃO USADA ✗` e `exit=1`; contra o head, `exit=0`.

## 5. Div. 341 — a coluna de origem

128 divergências ganharam origem, **lida do texto de cada registro** `[lido]`:
10 no `docs/ux/HOTFIX-150.md` (marca entre parênteses: é lista, não tabela),
12 no `N2-BRIEF-anexos/README.md`, 106 no `DESIGN-N2/README.md` §9. Com as 55
que já a tinham, as 183 do N2 (144–334):

| origem | antes (declaradas) | acrescentadas aqui | total |
|---|---|---|---|
| P | 24 | 26 | **50** |
| D | 10 | 50 | **60** |
| A | 13 | 21 | **34** |
| T | 5 | 29 | **34** |
| X | 0 | 2 (255, 260) | **2** |
| dupla | 3 (157 A/T, 152 A/X, 191 P/D) | 0 | **3** |

Casos de fronteira, com a letra escolhida e a alternativa: 173 P (ou X, o
filtro do Vitest) · 204 D (ou P/A) · 209 T (ou D) · 211 D (ou T) · 212 T (ou
D) · 213 A (ou X, a Vercel) · 223 D (ou T) · 239 T (ou A/T) · 260 X (ou P/X) ·
274 P (ou D) · 323 P (ou D) · 334 T (ou X). A letra é leitura, não medição;
quem discordar troca uma célula.

Extras renomeados `X<n>` → `extra-<n>`: 11 ocorrências no `DESIGN-N2/README.md`
e 4 linhas da tabela do `N2-PR6-anexos/README.md`. **Não** renomeados, e por
quê, na div. 350.

## 6. Divergências — 347 a 351

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **347** | P | o `grep -rhoE "div\. ?3[0-9]{2}"` do prompt dá **345** como a maior; a maior é a **346**, escrita `\| **346** \|` na §12 do `N2-ENCERRAMENTO.md`, que o padrão não casa | esta PR começa na 347 |
| **348** | P | o prompt espera a lista da `main` **vazia** no fim, e manda corrigir a div. 220 com exceção do G1 declarada e usada. As duas não cabem: a exceção do `search.ts` fica na `main` depois do merge, e com a órfã reprovando, a PR seguinte tem de podá-la | registrada; a lista vazia é da PR seguinte (§4) |
| **349** | P | "ao lado da div. 188" — o `g1.sh` não cita a div. 188 em lugar nenhum (ela mora no `N2-PR1-anexos/README.md`) | a consequência foi escrita no cabeçalho novo do W4-b1 no `g1.sh`, citando a 188 |
| **350** | P | (a) **dois CNs além da lista** — o CN-D34d (remoção sem razão) e o CN-223b (o passo no `ci.yml` com o texto do CN) — entraram no commit 1 sem declaração prévia: extra declarado **depois**, aqui. (b) os extras `X<n>` **não** foram renomeados em dois comentários de código (`apps/native/src/escrita.ts:429`, `screens/Picker.tsx:310`) — seria pôr dois arquivos de comportamento no G1a por um comentário — nem no bruto `N2-PR7-anexos/CN-defeito-antes.txt`, que é saída literal | (a) registrada; (b) destino: a próxima PR que tocar esses dois arquivos |
| **351** | T | a forma da remoção casa a linha **IGUAL**, e a da errata por **subcadeia**. A diferença é de propósito — a remoção não tem contrapeso (não há `nova` que tenha de aparecer) e uma subcadeia como `log(` autorizaria o contrato inteiro a sumir —, mas é assimetria entre irmãos, e fica escrita | razão no cabeçalho do W4-b1 do `g2g3.sh` |
