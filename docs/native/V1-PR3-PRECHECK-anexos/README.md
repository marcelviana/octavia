# V1-PR3-PRECHECK-anexos — o bruto do pre-check da V1-PR3

> **Rastro de medição, não fonte.** A fonte da PR será o diff e as mensagens de
> commit; a fonte do bloco será o `V1-ENCERRAMENTO.md`. Isto é o material que a
> V1-PR3 e o aceite da V1-PR7 vão precisar para não refazer o trabalho.
>
> **NÃO COMMITADO.** Vive no worktree `octavia-v1pr3` (`--detach` em `6697285`).
>
> **Data**: 2026-09-13. **Aparato**: AVD `octavia_tab32` (`emulator-5554`), conta
> de audit; scratch de build em `/tmp/v1pr3-scratch`, clone APFS do repositório
> **sem `.git`**. O Tab S6 `RX2N8000F3D` recebeu **seis comandos, todos de
> leitura** — listados no anexo C §C1.
>
> **Prod: 2 requests a `/api/*` na rodada 1**, e o alvo era 0; a rodada 2 (anexo H)
> gastou **0**, com a rede provada por `ping`. **Teto restante do bloco: 2.** Causa e
> correção no anexo G §G2. O anexo G §G3 **retrata** a declaração de que o
> `setlists.json` mudou de baseline: `-no-snapshot-save` descartou tudo.

| Arquivo | O que traz |
|---|---|
| `V1-PR3-A-prebuild-autolinking.txt` | H1 — o autolinking de 6 para 7, o prebuild que não reescreve nada, os tempos |
| `V1-PR3-B-apk-delta.txt` | H2 — os dois APKs locais, o Δ de +16.023.885 B, as `.so` por ABI |
| `V1-PR3-C-tabs6-e-install-r.txt` | H3 — os seis comandos do Tab S6 e a prova do `adb install -r` no AVD |
| `V1-PR3-D-icones-34.txt` | H4 — a varredura de atributos, os 19 arcos e o markup dos 34 |
| `V1-PR3-E-lucide.txt` | H5 — 0 de 15, e as quatro medidas de bundle |
| `V1-PR3-F-gates-e-barra.txt` | G1/G3/G4/G5, a divergência 30 com controle negativo, a barra hoje × no desenho |
| `V1-PR3-G-contraste-e-prod.txt` | contraste dos quatro tokens novos, contabilidade de prod, estado do aparato, o scratch apagado |
| `V1-PR3-H-a17-baseline.txt` | o baseline `[AVD]` do A17 — 59 navegações, p95 = 50 ms, e por que não se compara com o do N1 |

## Scripts que produziram as medições (ficaram no scratch, não no repositório)

| Script | Onde | O que faz |
|---|---|---|
| `barra.mjs` | `/tmp/v1pr3-scratch/` | os 7 controles do palco por dump: bounds, `content-desc`, ordem |
| `contraste-v1pr3.mjs` | `/tmp/v1pr3-scratch/` | WCAG 2.1 dos sete velhos e dos quatro novos, nos dois temas |
| `extrai2.py` | `/tmp/v1pr3-scratch/` | os 34 svg do `icones.html`, por unescape do bundle + casamento por assinatura de `d` |
| `cmp.mjs` | `/tmp/v1pr3-scratch/lucide/` | design × `lucide-static@1.45.0`, normalizando `d`/`circle`/`rect` |
| `a20-estendido.mjs` | `/tmp/v1pr3-scratch/a20/` | recuperado do `V1-PRECHECK-anexos/V1-A3-instrumento-a20.txt` §A3.3, sem uma vírgula de mudança |
| `g3.sh` | `/tmp/v1pr3-scratch/cn-div30/` | os dois ramos do `g2g3.sh`, para o controle negativo da divergência 30 |

Nenhum deles entra no repositório nesta sessão. O `a20` e o `g3` corrigido são
o **commit 5** da V1-PR3 (§8.3 do documento).

## sha256 dos anexos

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR3-A-prebuild-autolinking.txt` | 103 | `1c41f478a55a0e8a8a7975f1aaaead9eccdcc85e0cd8b0168e83c3f356628290` |
| `V1-PR3-B-apk-delta.txt` | 69 | `823d65be0342d3e0d79229540689c6b1893e9a430511f41bb6df0ad2784bbb40` |
| `V1-PR3-C-tabs6-e-install-r.txt` | 108 | `96428b351275e093b3d6634182a5f7cd958ef1ca7aae7aade83dcb3e38144484` |
| `V1-PR3-D-icones-34.txt` | 176 | `666651c33a2e9d4e0826200db204b22f03d0b15addc81194b8cffe92d4dba01d` |
| `V1-PR3-E-lucide.txt` | 62 | `bf45ee19ea3beb1100db1bab571caa2de99204e75d6540c672ffcaed5236d478` |
| `V1-PR3-F-gates-e-barra.txt` | 149 | `44d7ebf05993e9530fc201537314e285ae1eeeac0b8a3fb9ccef6741c649f110` |
| `V1-PR3-G-contraste-e-prod.txt` | 153 | `4eddd7aba97e1630b93b86f8f6ab17b4bbd004355ae53e66993d05c2fb36fd40` |
| `V1-PR3-H-a17-baseline.txt` | 136 | `c867f74ad7e8e5c9d2e16f8fb0601fe3c5182bcd81c498afe556ee2595122d05` |
