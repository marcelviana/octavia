# N2-PR4 — anexos

PR: **N2 — PR-4: S2 com edição, renomear e datar, remover, apagar**.
Branch `n2/pr4-s2-edicao`, sobre `0fa1b75` (merge da #315).

| arquivo | o que é |
| --- | --- |
| `CN-s2-antes.txt` | os 14 CNs de tela contra a árvore de `0fa1b75` — **13 reprovam por ausência**; o 14º (S2 vinda do palco) **passa**, e tem de passar: é o frame de controle do `N2-S2p`, não um CN |
| `CN-prazo-antes.txt` | o CN do prazo de rede contra a mesma árvore. O 2º `it` **estoura o próprio timeout de 40 s** — é a medição da div. 262: sem prazo, a escrita não termina |
| `gates-commit1.txt` | `gate:a20` com a posição nova, o **CN ad hoc** dela (uma frase em inglês montada por template, acusada), o `gate:a20:cn` intacto e o `gate:icones` com os **cinco** pendentes, antes da poda |
| `CN-depois.txt` | os três projetos com o commit 2 — **277 passam, 0 falham** |
| `gates-commit2.txt` | G1, G2, G3, os dois gates e o `tsc --noEmit` depois do commit 2 |
| `dumps/` | **os 15 dumps do §4.1**, com `SHA256SUMS.txt` |
| `device-prod.txt` | **§4.2 FEITO**: as três escritas do nativo em prod (`update`, `remove`, `delete`), logcat verbatim |
| `aparato.md` | **o §4 inteiro**: G5/G6, as medidas contra o congelado, os **dois defeitos achados e consertados** (divs. 269 e 270), o fecho da div. 257 e as mutações locais |

---

## O §4 foi executado nesta mesma sessão

Diferente da N2-PR3, que precisou de sessão própria: aqui o `adb` existe no
`PATH` do ambiente (o gate do §0 é `ls` no SDK — `div. 250`) e os dois
aparelhos estavam ligados. O Tab S6 **estava travado** e foi destravado pelo
Marcel a pedido desta sessão; credencial não é coisa que a automação digite.

**Nenhum build nativo**: esta PR não traz módulo nativo, e o dev client da
N2-PR3 (com o `datetimepicker` 9.1.0) carregou o bundle do Metro. É a
primeira PR da série cujo §4 roda sem rebuild.

## O que o §4 mudou no código

Duas coisas, as duas medidas no aparelho e consertadas no commit 2 — não são
acomodação, são defeito:

- **div. 269** — no estado `apagando`, o `Manter a setlist` sumia; o congelado
  diz que **os dois botões inativam**;
- **div. 270** — depois de apagar, **S1 voltava mostrando a setlist apagada**.
  O log estava perfeito e a tela mentia: o cache ficava certo (quem o grava é
  o `escrita.ts`) e o estado da raiz não era avisado. O CN foi endurecido no
  mesmo commit, com a prova de que agora ele pega.

## O que o §4 provou que faltava desde a N2-PR3

A **div. 257** fecha. A espécie `rede` da N2-D18 — *"o servidor gravou e o
cliente não soube"* — nunca tinha saído de um aparelho: o modo `escrita-corta`
mandava `201` antes de cortar e o OkHttp lia sucesso limpo. Com o corte sem
status line e o prazo de rede da N2-D35, ela saiu duas vezes do Tab S6, com
`ms=20029` e `ms=20025`.
