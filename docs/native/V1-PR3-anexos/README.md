# V1-PR3-anexos — o bruto da V1-PR3

> **Rastro de medição, não fonte.** A fonte da PR é o diff e as mensagens de
> commit; a fonte do bloco será o `V1-ENCERRAMENTO.md`. Isto é o material que
> o aceite da **V1-PR7** vai precisar para comparar antes × depois sem refazer
> o trabalho.
>
> **Data**: 2026-09-13. **Aparato**: AVD `octavia_tab32` (API 32, 2560×1600 @
> 360 dpi = 1138×711 dp), conta de audit, subido **sem** `-no-snapshot-save`
> (div. 42), rede cortada e **provada por `ping`** antes de abrir o app, nas
> duas rodadas. O Tab S6 `RX2N8000F3D` recebeu **uma** instalação (`install -r`)
> e as leituras do §2 do prompt — anexo E. **Prod: 0 requests a `/api/*`** nos
> dois aparelhos (`api status=` → 0 nos logcats).
>
> **ANTES** = `origin/main` (`6697285`), dev client `cb1b5fea…`, Metro do
> checkout principal. **DEPOIS** = `v1/pr3-svg-icones` em `531f17b` (commit 4),
> dev client `c0c1ab51…` (o APK do commit 1), Metro do worktree. O A17 foi
> medido nas duas pontas **na mesma sessão** (regra do pre-check §15.2).

| Arquivo | O que traz |
|---|---|
| `V1-PR3-A-a17-antes-depois.txt` | A17 — as 59 navegações, antes e depois, na mesma sessão: p95 34 → 24 ms |
| `V1-PR3-B-v1a8-barra-antes-depois.txt` | V1-A8 — bounds e `content-desc` dos sete controles, seis variantes × dois temas, antes × depois |
| `V1-PR3-C-gates.txt` | G1–G6 commit a commit, os controles negativos (a20:cn, div. 30), suíte · tsc · lint |
| `V1-PR3-D-apk-autolinking.txt` | commit 1 — autolinking 6 → 7, o APK (+16.023.885 B), as `.so` por ABI, o build |
| `V1-PR3-E-tab-s6.txt` | o Tab S6 — os quatro passos do §2, verbatim, e o estado em que ficou |
| `V1-PR3-F-contraste-icones-render.txt` | contraste dos dez tokens, a checagem dos 34 do mapa, a prova de render do R14 |
| `V1-PR3-G-aparato-avd.txt` | o AVD antes × depois (dentro do boot e depois de um ciclo), rede, Metro, três lições de instrumento |

## Dumps e capturas

`dumps-antes/` (10 estados: os seis do S3 nos dois temas — o S3-texto claro é o
`S3-claro` da PR1) e `dumps-depois/` (17: os mesmos dez, mais o auto-scroll
ligado, os três motivos ao toque, o retrato e a volta ao paisagem) — um `.xml`
(`uiautomator dump`) e um `.png` (`screencap`) por estado, `SHA256SUMS.txt` em
cada diretório. `render/` tem a prova de tela do commit 3 (o catálogo dos 34
nos dois temas com o controle negativo sem `color`) e o motivo ao toque no S3d.

`instrumentos/` — os scripts de host desta sessão, para o aceite não os
reinventar: `drive.sh` (condução do AVD), `ids.mjs` (ids + bounds de um dump),
`contraste.mjs`, `extrai-icones.py` / `gera-dados.py` / `checa-dados.mjs` (do
`icones.html` ao `dados.ts` e a checagem de volta), e o `Catalogo.tsx.txt`, o
instrumento de scratch que rendeu o catálogo (nunca esteve num commit).

## Decisões do Marcel sobre a entrega (2026-09-13) e duas regras que ficam

Q1 o commit de anexos fica · Q2 raio 12, errata **E6** · Q3 A15/A17 no Tab S6 são da
V1-PR7, com o tablet desbloqueado pelo Marcel · Q4 o Wi-Fi ele confere ao desbloquear
· Q5 `gate:icones` na PR4 · Q6 o pressionado fica, errata **E7** · Q7 zoom no placeholder
decide-se na PR4/5. Mais **E8** (div. 45) e **E9** (div. 44), todas em `DESIGN-V1/README.md` §9.

> **1. NA PR4, O GATE VEM ANTES DO QUE ELE MEDE.** Entre o commit 4 e o 5 desta PR o
> G4 leu 36 literais e 0 acusações **sem ler nenhum dos sete `accessibilityLabel`** que
> o commit 4 acabara de introduzir — o desenho A3.3 não olhava label em expressão
> (div. 53, o sétimo caso do padrão do V1-PR3-PRECHECK §9.1). Resolvido na ordem certa,
> mas houve uma janela em que o gate estava cego para o que a PR trouxe. Na PR4, o
> instrumento que mede a mudança entra (ou se estende) **antes** do commit que a faz.

> **2. NO TABLET, "AVIÃO" É SÓ O OVERRIDE DA API — NUNCA O RÁDIO.** O corte de rede
> do Tab S6 nesta sessão (`svc wifi disable` · `svc data disable` · `airplane-mode
> enable`) foi revertido, mas o Wi-Fi **não reconectou** até o fim (anexo E, div. 55).
> Para a V1-PR7: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline no Metro (o
> app faz `sync fail` e preserva o cache, A21) e nenhum comando de rádio no tablet.
> No AVD a regra do pre-check §9 continua: rádio cortado e provado por `ping`.

## Divergências — 44 em diante

*(Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** teste/instrumento.)*

| # | Origem | O que é |
|---|---|---|
| **44** | **D** | O catálogo escuro do `icones.html` renderiza os nove do palco a **24 dp / 1,75** e `letra`·`cifra`·`tab`·`partitura`·`sem conexão`·`última sincronização` também a 24, enquanto a §6.4 os declara a 28 e 20. A conta por tamanho do catálogo é 7 · 24 · 3, não os 16 · 9 · 9 do pre-check §7.2 (que somou pela §6.4). Inócuo para o mapa — o tamanho é prop do componente e o `d` é o mesmo — mas o catálogo não é a folha de tamanhos |
| **45** | **D** | A §6.4 diz que o `log-in` é o `log-out` "em rotação de 180°"; o markup do S0 no `telas.html` (`M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l4 4-4 4M15 12H4`) é a porta ESPELHADA com a seta mantendo o sentido (entrando) e a haste de 15 a 4. Transcrito verbatim do frame, não derivado da frase |
| **46** | **D** | A folha "Os quatro estados" nomeia **padrão · ativo · desabilitado · pressionado**; o README §6.2 nomeia `normal · ativo · desabilitado · inerte com motivo`. O commit 4 implementa os quatro da folha (o pressionado é moldura `muted` + fundo da tinta a 8 %, só com o dedo encostado) |
| **47** | **D** | O controle do palco tem **`border-radius: 14`** nas 42 caixas de 64 do `telas.html` e na folha de estados; o README §5.2 diz que o desenho respeita `radius` **6 · 12 · 20** e o app usa `radius.control` = 12. Mantido **12** (o README declara a regra; o desenho a contradiz) — pergunta ao Marcel |
| **48** | **D** | A moldura **S3d** do `telas.html` desenha `zoom −`/`zoom +` no estado **padrão** (moldura `#2A2836`, sinal cheio), enquanto o README §6.2 e §7 os dão como inertes no PDF. Implementado **inerte** (README + comportamento do app); o frame diverge da regra |
| **49** | **D/A** | O README §6.2 lista "S3 sem conteúdo" entre os estados com zoom inerte; o app só torna o zoom inerte quando `urlArquivo !== null` (PDF/S3e), e no placeholder sem corpo ele segue ativo. **Não mudado**: é comportamento, fora do que as erratas autorizam |
| **50** | **T** | O Metro (expo 57 / RN 0.86) servia um delta de "1 module" a cada relançamento depois de uma edição e o app abria com o **bundle anterior** (o catálogo de scratch seguiu na tela depois de removido). Só `expo start --clear` resolveu. Regra: depois de mexer em dependência ou arquivo, reiniciar o Metro com `--clear` antes de medir |
| **51** | **T** | `screencap` tirado **depois** de `uiautomator dump` devolveu o frame **anterior** ao toque (PNG byte a byte igual ao da captura precedente) enquanto o dump já trazia o texto novo. As capturas de motivo foram refeitas com screencap primeiro, dump depois |
| **52** | **T** | `vitest.config.mts` **exclui `apps/**`**: o "teste unitário" do commit 3 (34 nomes × §6.4, todo `d` × anexo D) não pode viver na suíte. Rodou como script de scratch (`checa-dados.mjs`, anexo F); versioná-lo como `gate:icones` é pergunta ao Marcel |
| **53** | **T** | O desenho A3.3 do a20 só lia `accessibilityLabel="…"`, `{`…`}` e `{'…'}`: os sete rótulos do palco, que são **ternários** sobre o estado, passavam sem ser lidos (36 literais). O `a20.mjs` versionado examina todos os literais de um `accessibilityLabel={…}` (48 literais), com o quinto caso no controle negativo. Acréscimo ao desenho, declarado no commit 5 |
| **54** | **P** | O APK do commit 1 tem o **mesmo tamanho** do DEPOIS do pre-check ao byte (231.377.892) e **sha256 diferente** (`c0c1ab51…` × `c0a3d790…`): JDK 17 aqui, 21 lá — o build não é reprodutível byte a byte entre JDKs; nenhum aceite depende disso |
| **55** | **T** | O Tab S6 está com o **keyguard bloqueado** (`deviceLocked=1`; `keyevent 82` e um swipe não o dispensam) — a credencial é do Marcel. O app rodou e logou atrás do keyguard (R15 fechado), mas **A15 e A17 no Tab S6 não puderam rodar** nesta sessão. E o Wi-Fi, religado depois do corte (airplane 0, `wifi_on` 1, duas redes salvas), **não reconectou** até o fim da sessão |
| **56** | **P** | O **n=44** do A17 apareceu pela terceira vez acima dos vizinhos no ANTES (79 ms; 197 no pre-check) e **não reapareceu no DEPOIS** (22 ms). Sem causa no logcat; registrado sem explicação. O n=2 (o PDF de 1 página) caiu de 592 para 21 ms no depois — idem |
| **57** | **T** | `adb emu kill` **sem** `-no-snapshot-save` leva ~15 s salvando o snapshot; subir o emulador antes de o qemu sumir falha com "Running multiple emulators with the same AVD". Esperar o processo |

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR3-A-a17-antes-depois.txt` | 149 | `3b61b62b18f1b3c926a7d8e01a4d124d76b80f8afd21a7f047792931a197186d` |
| `V1-PR3-B-v1a8-barra-antes-depois.txt` | 178 | `8418dfd3c8d22fe8922f40a0535f6d5f840ef41532b408b8e480998057277bc8` |
| `V1-PR3-C-gates.txt` | 130 | `aa4f79d7e5a6339b0157e9e5d3e9126ad2143bb380bfedaf363dcf6eee3ccb52` |
| `V1-PR3-D-apk-autolinking.txt` | 67 | `e58777e224c765c32e8ac10b38910a689385579fe8fc02ea787bf5420560d052` |
| `V1-PR3-E-tab-s6.txt` | 218 | `db6dfc071d56adc96fdcef21ac97fff81ff8938f4ed99a44dce74459ae04c07f` |
| `V1-PR3-F-contraste-icones-render.txt` | 33 | `1758254b92a8c81189ce4cb8d805c08d6189de356ac356e576674e35a6e204c1` |
| `V1-PR3-G-aparato-avd.txt` | 186 | `e908d7be86e3b88d083235a75b4eae37092a90f9a4c0a0bb2f9cdb920441986a` |
| `dumps-antes/SHA256SUMS.txt` | 20 | `2ceca04f05bd3caad23e3dd497319c50ae8d9883157425d2c8cd2e6afed6689f` |
| `dumps-depois/SHA256SUMS.txt` | 34 | `8f43a4eadf8d307a410bc355b3b8ebc9059fd867b266f8dd22891ac7168422a6` |
| `render/SHA256SUMS.txt` | 4 | `8769b2a1e9e256a2fa3a7e4c565c562864c6c9715963644339990be88e2e1944` |
