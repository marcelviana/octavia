# N2-PR5 — anexos

PR: **N2 — PR-5: o modo de reordenar**. Branch `n2/pr5-reordenar`, sobre
`8bd4281` (merge da #316).

| arquivo | o que é |
| --- | --- |
| `CN-antes.txt` | os CNs do commit 1 contra a árvore de `8bd4281`: **14/14** de tela reprovam por ausência (`sem nó com testID="reordenar"`), o `ordem.test.ts` não acha o módulo, e o `gates.test.ts` reprova 2 pela poda da `alca` |
| `gates-commit1.txt` | G1 (as sete exceções declaradas e ainda não usadas), G2 63 ⊆ 63, G3 64 → 64, `gate:icones` exit 1 pela poda |
| `gates-commit2.txt` | suíte 308 ✓, G1/G2/G3, `a20`, `icones`, o CN ad hoc da regra `[legível]` do `gate:icones` (2 acusações, exit 1) e o `tsc` |
| `gates-aceite.txt` | o mesmo depois do conserto da div. 286, mais o CN dela reprovando contra o código do commit 2 |
| `dumps/` | **os 11 dumps do §4.1** e os **2 da revisão** (`12` intocada, `13` o 400 descartado), todos do mock, com `SHA256SUMS.txt` |
| `png/` | quatro recortes do mock: a linha erguida (`03`), a faixa do `N2-X-100` (`08`), a barra e o aviso da falha (`10`), a barra com `Salvar a ordem` inativo (`12`) |
| `device-prod.txt` | **§4.2**: as três escritas em prod, logcat verbatim, o corpo do `PUT` com ids mascarados e as ordens antes/depois |
| `aparato.md` | o §4 inteiro: G5/G6, as medidas contra o congelado, o defeito achado e consertado (div. 286), o aparato do Metro (div. 294), as mutações locais e, no §7, a revisão (N2-D36 revista, N2-D37, a regra do avião) |
| `CN-revisao-antes.txt` | os CNs da revisão contra `a46d8ca`: **4 de 15 reprovam**, cada um pelo motivo certo |
| `CN-revisao-depois.txt` | os mesmos com o `fix(N2-PR5)`: 15/15, suíte 309 ✓, G1/G2/G3, `a20`, `icones`, `tsc` |

## A decisão do item 1.1, e o que ela custou

`[medido]` nem `react-native-gesture-handler` nem `react-native-reanimated`
estão em `apps/native/package.json`, no `app.json` ou no `pnpm-lock.yaml`.
O arrasto é **`PanResponder`**, sem módulo nativo: **zero dependência, zero
rebuild, o dev client de sempre** nos dois aparelhos. O custo: o arrasto anda
na thread de JS (um `setState` por evento de toque), e duas coisas que uma
biblioteca daria de graça tiveram de ser escritas e medidas — a rolagem
automática a 48 dp das bordas (medida no AVD com 60 músicas, nos dois
sentidos) e a ordem de desenho da linha erguida (a div. 286, achada no §4).

## O que o §4 mudou no código

Um defeito, medido no aparelho e consertado — não é acomodação: **a linha
erguida era translúcida e o buraco tracejado aparecia através dela** (div.
286). O CN foi endurecido, com a prova de que agora ele pega.

## Glossário — as linhas em inglês destes anexos

Todo texto destes anexos está em pt-BR, **menos a saída literal de
ferramenta**, que fica como saiu: é medição, e a regra `[medido]` pede o
comando e a saída verbatim (div. 300).

| aparece | quer dizer |
| --- | --- |
| `Test Files  28 passed (28)` | arquivos de teste: 28 passaram, de 28 |
| `Tests  4 failed \| 11 passed (15)` | testes: 4 reprovaram e 11 passaram, de 15 |
| `Failed Tests 4` | os 4 testes que reprovaram vêm listados abaixo |
| `AssertionError: expected false to be true` | a asserção esperava `true` e recebeu `false` |
| `expected <div data-testid="alca-5" …> to be null` | esperava que o nó `alca-5` não existisse, e ele existe |
| `Cannot find module './ordem'` | o módulo `./ordem` não existe (o CN do commit 1, antes do código) |
| `no tests` | nenhum teste chegou a rodar no arquivo |
| `connect: Network is unreachable` | o `ping`: sem rede (a prova do avião) |
| `pass` / `fail` (`gh pr checks`) | passou / reprovou |
