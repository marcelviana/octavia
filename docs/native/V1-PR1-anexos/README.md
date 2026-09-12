# V1-PR1-anexos — o bruto da V1-PR1

> **Rastro de medição, não fonte.** A fonte da PR é o diff e as mensagens de
> commit; a fonte do bloco será o `V1-ENCERRAMENTO.md`. Isto aqui é o material
> que o aceite da **V1-PR7** vai precisar para comparar antes × depois sem
> refazer o trabalho.
>
> **Data**: 2026-09-12. **Aparato**: AVD `octavia_tab32` (API 32, 2560×1600 @
> 360 dpi = 1138×711 dp), conta de audit, **avião ON** na quase totalidade —
> **0 requests a `/api/*` em prod**. O Tab S6 `RX2N8000F3D` estava conectado à
> máquina e **não recebeu um único comando** (`-s emulator-5554` em 100% das
> chamadas `adb`).
>
> **ANTES** = `origin/main` (`45029dc`), Metro do checkout principal.
> **DEPOIS** = `v1/pr1-alvos-geometria`, Metro do worktree `octavia-v1pr1`.
> Cada par de estado foi capturado no **mesmo estado de rede** dos dois lados.

## Anexos de texto

| Arquivo | O que traz |
|---|---|
| `V1-PR1-A-alvos-antes-depois.txt` | bounds de **todos** os alvos, estado a estado, antes × depois |
| `V1-PR1-B-gates.txt` | os seis gates: script, saída antes × depois, controles negativos |
| `V1-PR1-C-geometria-e-toque.txt` | o oráculo do dump, as seis zonas mortas, os gestos do PDF e a **pinça injetada** |
| `V1-PR1-D-rotacao.txt` | rotação no S3 e no S5, o frame intermediário, e um achado herdado |
| `V1-PR1-E-capturas-diff.txt` | comparação de pixel das quatro telas tocadas |
| `V1-PR1-F-M1-M2-M3.txt` | as três medições do pre-check da PR |
| `V1-PR1-G-lint-suite-tsc.txt` | lint, tipos e suíte — **com o escopo real de cada um** |

## Dumps e capturas

`dumps-antes/` e `dumps-depois/` — um `.xml` (`uiautomator dump`) e um `.png`
(`screencap`) por estado: **20 estados** no lado ANTES e **21** no DEPOIS — o
`S3-paisagem-pre-giro` só existe no DEPOIS, como referência imediata tomada
segundos antes do giro. Todos os outros 20 casam 1:1. `SHA256SUMS.txt` em cada
diretório.

`pinca/` — as três capturas da pinça de dois dedos mais o controle, e o
`pinca.sh` que as produziu. O script fica **aqui** e não no repositório de
código: é instrumento de host específico do AVD (o Tab S6 tem outro mapa de
`/dev/input`), e exige `adb root`.

## Duas coisas que não foram pedidas e que ficam registradas

1. **O tap `(174,1240)`** — 9 px acima da barra, dentro da borda nova: emite
   `nav n=1/8`. É o controle **positivo** do conserto, o que faltava: as seis
   zonas mortas provam que nada regrediu, esta prova que a borda funciona até a
   aresta nova e não um pixel além. Anexo C.2.
2. **O recorte EM CIMA** (`song-3`/`song-4` com `y1 == y1` do `ScrollView`
   pai): a metade da regra C2 do `V1-PRECHECK` §7.2 que estava escrita sem
   nunca ter sido medida. O dump rolado do M1 a entrega. Anexo F/M1.

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR1-A-alvos-antes-depois.txt` | 368 | `780901621be1c14a156fcfa2162a7c9183624de4fd83fa27fa133ea4ad41bcd2` |
| `V1-PR1-B-gates.txt` | 339 | `521673ace1bb4d5ea17de93461d9d6d98f9a513298681ce684d6bd9bb3174079` |
| `V1-PR1-C-geometria-e-toque.txt` | 75 | `10997424f9f58fa492928f0788c592c6b8a9b6379bb9082167464147cd64adc0` |
| `V1-PR1-D-rotacao.txt` | 62 | `380b00d24c9718ceba92fb7bd4db5fd34bfb776054db9146681d2d3f35cae3c1` |
| `V1-PR1-E-capturas-diff.txt` | 45 | `f30592005b86a3abb82001785723dd7bdcf030d491052028e62efbc0bdafb7fa` |
| `V1-PR1-F-M1-M2-M3.txt` | 65 | `f7eb365eae93911873ca8ecf34fbf0a25fede2bb2d58b0d7b4b9bf1322cc7dba` |
| `V1-PR1-G-lint-suite-tsc.txt` | 33 | `32d13556238194b531abb03b065694e3562e8f4de01093b19ef59ce0bef0266e` |
| `dumps-antes/SHA256SUMS.txt` | 40 | `cfddec7fa46d0482cbdba116d80726c4cce6e474694bdc7487be5a01391bf8b3` |
| `dumps-depois/SHA256SUMS.txt` | 42 | `a9b3fab4faef93b8c03b08bd08e7d82cd7a83b64f7ebf3653cf6f09824990ef8` |
| `pinca/SHA256SUMS.txt` | 5 | `63295434c8f4707986d4454135fb661177fe67863bd7ef5bb93a64cc15e5c6c5` |
