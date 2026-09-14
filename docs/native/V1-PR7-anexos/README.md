# V1-PR7-anexos — o bruto do aceite e do encerramento do bloco V1

> **Rastro de medição, não fonte.** A fonte do bloco é o
> [`V1-ENCERRAMENTO.md`](../V1-ENCERRAMENTO.md); a desta PR são o diff e as mensagens de
> commit. Isto é o material que sustenta cada número do encerramento.
>
> **Data**: 2026-09-14. **Dois aparelhos**: o AVD `octavia_tab32` (API 32, 2560×1600 @ 360 dpi
> = 1137,8 × 711,1 dp, conta de audit) e o **Tab S6 `RX2N8000F3D`** (SM-T865, Android 12,
> mesma densidade, conta principal). Os dois com o dev client da V1-PR3 — **nenhuma
> instalação nesta PR**.
> **A V1-PR7 não toca uma linha de `apps/native/**`**: é PR de aceite e de registro.
> **Worktree**: `../octavia-v1pr7`, branch `v1/pr7-aceite` a partir de `origin/main`
> (`72bdb38`). O checkout principal não recebeu commit nem `checkout`.

| Arquivo | O que traz |
|---|---|
| `V1-PR7-A-regressao-avd.txt` | os onze aceites do PRD rodados de novo no AVD, um a um, com logcat verbatim, bounds e o veredito de cada; e os seis dispensados pelo G1 com o argumento de cada um |
| `V1-PR7-B-aceite-tabs6.txt` | o aceite no aparelho: A2, A15, A16, A17 e o A4/A1 contra prod; o protocolo das duas paradas; o S0 lido pelo dump; o estado do tablet antes × depois |
| `V1-PR7-C-aceite-visual.txt` | os seis AV e o teste dos sete ícones a um metro, com o veredito do Marcel em cada um e a medição da barra que saiu do teste |
| `V1-PR7-D-gates-e-suite.txt` | G1–G6, `gate:a20` e `gate:icones` sobre o **bloco inteiro** (`6a9315d` → `72bdb38`), os quatro controles negativos, suíte · tsc · lint |
| `V1-PR7-E-aparato-e-prod.txt` | contabilidade de prod (**com o estouro de 2 e a causa**), contabilidade de bucket, os três desvios declarados, o estado dos dois aparelhos e o que **não** foi medido |

## Dumps e capturas

`dumps-avd/` (42 estados) e `dumps-tabs6/` (17) — um `.xml` (`uiautomator dump`) e um
`.png` (`screencap`, tirado ANTES do dump — div. 51) por estado, com `SHA256SUMS.txt` em
cada diretório. **Não há "antes × depois" nesta PR**: o código não muda, então o que existe
é o estado do bloco mergeado, medido nos dois aparelhos.

### O que cada família de dump prova

| prefixo | aceite | aparelho |
|---|---|---|
| `A3-` `A4-` `A19-` `A21-` | 429, abertura online, falha de revalidação, 500 na página 2 | AVD, contra o mock local |
| `A5-` `A6-` `A8-` `A10-` `A11-` `A12-` `A14-` `A15-` | o resto da regressão | AVD, em avião ou com fixture |
| `AV1-` | os quatro indicadores do S1, incluindo o `baixando` | AVD |
| `S0-` `S1-` `S2-` `S3-` `S4-` `S5-` `A16-` `AV5-` `AVicones-` | o aceite e o veredito visual | Tab S6 |
| `ZZ-estado-final` | o tablet como ficou | Tab S6 |

## Instrumentos

`instrumentos/` — `g1.sh`, `g5.mjs`, `g6.sh` (verbatim da V1-PR1), `ids.mjs`, `bounds.mjs`,
`estado.mjs` (V1-PR3/PR4/PR5), `marcas.mjs` e `fileira.mjs` (V1-PR6, o par previsão × medida
da fileira do S5), `env.sh` (as funções de condução dos dois aparelhos, caminhos
anonimizados) e **três novos, todos de HOST**:

| novo | o que é | por que é de host |
|---|---|---|
| `s401.py` | servidor que devolve 401 a toda request — o instrumento do A2 | o `aceite.py` não tem modo 401, e acrescentar um seria mexer em `apps/native/src/**` numa PR de aceite: dispararia o gate `native` e misturaria código com veredito |
| `fix60.py` | recompõe o `setlists.json` do Tab S6 com 60 posições, **a partir dos contents que já estão no cache** | mesmo motivo; não escreve em prod e não toca `content.json` |
| `a16.sh` | o relógio do A16 — lê o estado da tela por `dumpsys` a cada 60 s, sem tocar o aparelho | leitura pura; tocar no aparelho zeraria o aceite |

## Os vereditos do aceite visual — o placar

| item | veredito do Marcel | onde foi julgado |
|---|---|---|
| **AV-1** os quatro indicadores | "Passa — os quatro se distinguem" | monitor, capturas do AVD |
| **AV-2** a tab de 4 cordas em 20 dp | "Passa — lê como tab" | monitor (S4 do tablet + S2 com fixture) |
| **AV-3** os placeholders de 28 contra os tipos de 20 | "Passa — o desequilíbrio não incomoda" | monitor, captura do AVD |
| **AV-4** o S0 inteiro | "Passa como está" | **aparelho, no escuro** — primeira vez |
| **AV-5** a fileira de 60 marcas | "Como proporção — e está certo" | **aparelho, no escuro** |
| **AV-6** o acento nas marcas | "Um dono — o acento é das marcas" | **aparelho, no escuro** |
| os sete ícones a um metro | "a leitura e visibilidade dos ícones está ótima" / "leem como inertes — passa" | **aparelho, no escuro**, duas molduras |
| o S1 de todo dia (extra) | "Acertou — neutro é 'pode ir'" | **aparelho, no escuro** |

**E o achado que saiu do teste dos ícones** — não de legibilidade, de função: a barra mistura
quatro controles de **comportamento** e três de **navegação** com folgas iguais de 16,0 dp,
e 49% da barra fica vazia à direita. **Proposta A decidida** (navegação alinhada à direita),
**para a PR de conserto** — div. 109 do encerramento.

## Divergências — 95 a 109

Estão no [`V1-ENCERRAMENTO.md`](../V1-ENCERRAMENTO.md) §9, com origem e contagem. As três
de maior peso — **102**, **103** e **104** — encabeçam a herança (§11.1) como
**pré-requisito de palco**, por decisão do Marcel.

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR7-A-regressao-avd.txt` | 302 | `006c26f17df791d833031f37f938a7bf5ae48247331c69673e6adbe6ec7eff6d` |
| `V1-PR7-B-aceite-tabs6.txt` | 241 | `5c39c9512cc6025b26dc2238375b795bc41c825195b1a8377ddc5273880af9b5` |
| `V1-PR7-C-aceite-visual.txt` | 185 | `9e3233190e3ddbfc115315140c41a8dc5ac86dd66846b22621bbdf3bfc0ed6e0` |
| `V1-PR7-D-gates-e-suite.txt` | 196 | `91ad706fb57dde5db5ac3f447fd5a32c57e0e95089c7d44db96410bfb3720ad1` |
| `V1-PR7-E-aparato-e-prod.txt` | 162 | `dc431ea1ff3ee7027444ade99b259b9555ff3e8e51f652b1e9ca79e3e9c8f629` |
| `dumps-avd/SHA256SUMS.txt` | 83 | `c70960009b62d24b5ff02c374ee5a98e8176a11c078e4a7639b944d713a37aa9` |
| `dumps-tabs6/SHA256SUMS.txt` | 34 | `1a501e144d0d470b1146c71865949659c95384eaf0cd34026b98a43663304270` |
