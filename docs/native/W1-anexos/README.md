# W1-anexos — o bruto do conserto da garantia offline

> **Rastro de medição, não fonte.** A fonte do bloco é o
> [`W1-ENCERRAMENTO.md`](../W1-ENCERRAMENTO.md); a da PR são o diff e as mensagens de
> commit. Isto é o material que sustenta cada número dos dois.
>
> **Data**: 2026-09-14. **Um aparelho**: o AVD `octavia_tab32` (API 32, conta de audit),
> em avião provado por `ping` — salvo ~11 min no W1-A5, declarados no anexo E.
> **O Tab S6 apareceu em `adb devices` e não recebeu um comando.**
> **Worktree**: `../octavia-w1`, branch `w1/garantia-offline` a partir de `origin/main`
> (`f79a4b7`). O checkout principal não recebeu commit nem `checkout`.

| Arquivo | O que traz |
|---|---|
| [`W1-B-commit1-reprovacao.txt`](W1-B-commit1-reprovacao.txt) | o commit 1 reprovando contra o código de ontem — 17 de 24, duas delas por TEMPO ESGOTADO, que é a div. 104 em teste de unidade |
| [`W1-C-aceites-aparelho.txt`](W1-C-aceites-aparelho.txt) | os sete aceites no AVD, cada um rodado DUAS vezes (bundle de `f79a4b7` × bundle do W1), com logcat verbatim, curvas segundo a segundo e o veredito de cada |
| [`W1-D-gates-e-suite.txt`](W1-D-gates-e-suite.txt) | G1a, G1b, G2, G3, G4, `gate:icones`, G7 e os controles negativos; suíte, tsc e lint |
| [`W1-E-aparato-e-prod.txt`](W1-E-aparato-e-prod.txt) | contabilidade de prod e de bucket, os quatro desvios declarados, o que NÃO foi medido, e o aparelho antes × depois |

E o pre-check que originou tudo, commitado aqui pela primeira vez:
[`../W1-PRECHECK.md`](../W1-PRECHECK.md) + [`../W1-PRECHECK-anexos/`](../W1-PRECHECK-anexos/).

## A medição que vale por todas

Do anexo C §3, com o app de `f79a4b7`, depois de uma conexão que entregou 8.192 B de
242.176 e calou:

```
OCTAVIA: file src=disk name=w1-morto-1.pdf bytes=8192
cartão:  "garantida offline · todos os arquivos neste aparelho"
```

E o mesmo disco, com o app do W1:

```
OCTAVIA: file-reject name=w1-morto-1.pdf kind=malformed bytes=8192 expected=-
cartão:  "parcial · 0 de 1 arquivos baixados"
```

## Dumps

`dumps/` — 9 estados, cada um com `.xml` (`uiautomator dump`) e `.png`
(`screencap`, tirado ANTES do dump — div. 51), com `SHA256SUMS.txt`.

| prefixo | o que prova |
|---|---|
| `A6-2-cn-f79a4b7` · `A6-3-w1` | o mesmo veneno plantado, com o app de ontem e com o de hoje |
| `A2-3-mentira` · `A2-4-w1-mesmo-disco` | o fragmento de 8 KB dito "garantida offline", e o mesmo disco saneado |
| `A5-1-antes` · `A5-2-depois` | o botão "Baixar esta setlist" antes e depois do toque |
| `fila-final` · `morto-final` · `falhas-final` | os três cenários de download com o código final |
| `ZZ-estado-final` | o aparelho como ficou |

## Instrumentos

`instrumentos/` — os dois novos, **os dois de HOST**, pelo mesmo motivo do `s401.py` da
V1-PR7 (servidor de aceite não entra no bundle do app):

| instrumento | o que é | por que existe |
|---|---|---|
| `arquivos.py` | servidor de arquivos com cinco modos — `ok`, `curto`, `lento`, `morto`, `404` | **não há como pedir ao Supabase meio corpo, ou um corpo que para no meio**. E o PDF é sintético: o aceite inteiro custa zero bucket |
| `cache-w1.py` | escreve o `setlists.json` + `content.json` de cada cenário, com os `file_url` apontando para o `arquivos.py` | as 3 setlists da conta de audit têm `performance_date: null` — **o plano de 7 dias real é n=0**, e sem data não há fila para medir |

Os gates versionados vivem no repositório, não aqui: `apps/native/scripts/g1.sh`
(G1a + G1b), `apps/native/scripts/g2g3.sh` (G2 + G3 com errata) e
`apps/native/scripts/g7.sh` (G7, com o controle negativo embutido).
