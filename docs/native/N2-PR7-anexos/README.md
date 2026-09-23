# N2-PR7 — anexos

Estados transversais nos dois aparelhos, a errata que ficou (N2-E19), o
conserto que o aceite achou (N2-E21) e a conta final de escritas do nativo em
prod no N2. O relato é o [`aparato.md`](aparato.md); a fonte das decisões é o
`DESIGN-N2/README.md` §9 (erratas N2-E19…E22, divergências 319–333).

| arquivo | o que é | commit |
|---|---|---|
| `g1b-cn.txt` | CN do G1b com pares: sem par reprova (CN-0, antes do mecanismo); com par passa; nova diferente, linha sem par, velha apagada, par sem razão e lista fora de triplas reprovam | `6fbf0fb` |
| `CN-antes.txt` | os CNs do commit 1 contra o código de hoje: 13 reprovam, todos da N2-E19 | `1fb5da6` |
| `CN-controles.txt` | controles ad hoc dos CNs que passam contra a `main` — (b) E20, (c) E8, (d) A-N2-15 — e o falso positivo da forma de subcadeia | `1fb5da6` |
| `gates-commit1.txt` · `gates-commit2.txt` | G1a/G1b, G2/G3, `gate:a20`, `gate:icones` (e, no 2, a suíte e o lint) | `1fb5da6` · `ba3836c` |
| `CN-defeito-antes.txt` | os 5 CNs do defeito de S2 reprovando contra `ba3836c` (e de novo, depois do ajuste do CN, com os 4 arquivos velhos no lugar) | `9268c66` · `fb9acd5` |
| `gates-conserto.txt` | suíte (1027), lint, `tsc` do core e do nativo, os quatro gates, sobre o conserto | `fb9acd5` |
| `ime-350.txt` | a hipótese dos 350 ms: 10/10 no AVD e 10/10 no Tab S6 | aceite |
| `roteiro-tab.txt` · `roteiro-avd.txt` | a saída verbatim do roteiro do §3.1 em cada aparelho | aceite |
| `g6.md` · `g6-controle.txt` | a tabela estado → `resource-id` com uma coluna por aparelho (56/56 e 56/56) e o controle contra o dump do defeito | aceite |
| `g5.txt` · `g5-recorte.txt` | alvos abaixo de 48 dp por dump, e a prova de que todos são recorte na borda da lista | aceite |
| `j3.txt` | J3 no Tab S6: gestos, relógio, custo do instrumento, listagem final | aceite |
| `device-prod.txt` | logcat de prod: §3.3 (AVD, audit, 13 escritas) e §3.4 (Tab S6, principal, 1 escrita + reabrir) | aceite |
| `dumps/` | 42 dumps (20 do roteiro por aparelho, o do J3 e o do defeito), **todos do mock**: `t-*` Tab S6, `a-*` AVD; `a-defeito-ba3836c-remove-net.xml` é o dump que mostrou o defeito | aceite |
| `CN-333-antes.txt` · `gates-333.txt` · `aparelho-333.txt` | div. 333 / N2-E23: os 2 CNs reprovando contra `f4f88db`; suíte (1029) e gates do conserto; o estado nos dois aparelhos (dumps `19` e `20`) | `da69bb2` · conserto |
| `png/` | os dois recortes da faixa sem rede (desenho amputado) | aceite |
| `instrumentos/` | os scripts do aceite, como rodaram (o caminho do rascunho da sessão aparece como `$SCR`) | aceite |

## Glossário pt-BR das saídas literais de ferramenta

As medições ficam como a ferramenta as imprimiu (regra `[medido]`); as linhas
em inglês são só estas:

| linha | quer dizer |
|---|---|
| `Test Files  … passed / failed` · `Tests … passed / failed / skipped` | arquivos e testes que passaram / reprovaram / foram pulados |
| `AssertionError: expected X to be Y` · `… to deeply equal …` · `… not to contain …` | a asserção esperava Y e recebeu X |
| `TypeError: Cannot read properties of undefined (reading 'split')` | a chave nova ainda não existia (o CN antes do código) |
| `connect: Network is unreachable` | o `ping` sem rede — o avião provado |
| `mInputShown=true / false` | o teclado do sistema de pé / escondido (`dumpsys input_method`) |
