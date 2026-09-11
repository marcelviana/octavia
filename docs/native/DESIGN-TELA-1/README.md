# Design da tela 1 — congelado (2026-09-08)

Fonte: Claude Design, brief do revisor (2026-09-07) + logo do Marcel.
Artefatos: `Octavia_Tela_1.html` + `Octavia_Tela_1.pdf` (versão pós-revisão;
sha256 abaixo).
Revisão do revisor contra o PRD (`docs/native/PRD-TELA-1.md`): 4 correções
exigidas e aplicadas — (1) S3d bordas = música, página por swipe (T1-R27/A14);
(2) S4b escopo da busca inclui álbum e corpo (T1-R20); (3) S3e texto sem
promessa de download automático + nome da música (T1-R16); (4) S2 destaque
sem fundo grande de acento (token; contraste). Proposta 09 (degradê de
overflow) adicionada pelo revisor.
Cobertura: S0; S1 a–f; S2; S3 a–f + b' claro; S4 a/b; S5 — todos com IDs T1-R.
Tokens: fundo #100F16 · texto #F9F5F1 · acento #777CE8 · secundário #A9A5B5 ·
linha #2A2836 · claro #F6F1EA · erro #E5686F · offline #C9923B; Raleway 600 /
Manrope 400-600 / IBM Plex Mono 400-600 (OFL); zoom 18·22·26·32·40 dp; toque
mín 48, lista 56, palco 64; bordas 192×640; barras 64/96.
Decisões do Marcel (2026-09-08): D-1 bordas entre as barras → errata do A14
("15% laterais da área de conteúdo, entre as barras"); D-2 tagline omitida.
Propostas fora do PRD: 02 → errata (D-1); 01 → omitida (D-2); 04 → aceita
com texto corrigido; 03, 05, 06, 07, 08, 09 → "decididos no design" (§11).
Papel: insumo do pre-check do N1 ao lado do PRD. O executor do N1 lê o HTML
renderizado (ou o PDF) e este README; o PRD prevalece em caso de conflito
não listado aqui — conflito novo é divergência declarada, não acomodada.

## Errata (2026-09-10, N1-PR1 — pre-check do N1, divergências 3, 4 e 12)

- **E1 — canvas × device**: o canvas "Galaxy Tab S6, paisagem, 1280×800 dp"
  é o AVD `pixel_tablet` (2560×1600 @ 320 dpi). O Tab S6 real reporta
  `wm size` 1600×2560 e `wm density` 360 (`density=2.25`) → **1138×711 dp**
  `[medido: N1-PRECHECK A1]`. Tokens e proporções valem (bordas 15% ×
  área entre as barras, barras 64/96, toque ≥ 48); os layouts são fluidos e
  o aceite é no device. Fontes: o HTML carrega **Raleway 500 e 600**
  (`document.fonts`), não só 600 — decisão N1-D6 empacota as duas.
- **E2 — IDs por tela**: "todos com IDs T1-R" lê-se "**todas as telas com
  IDs**": as 18 telas citam 23 dos 38 requisitos; os 15 sem tela (T1-R1–R5,
  R7–R10, R9b, R12, R14, R16, R19, R37) são não-visuais (auth, sync, cache,
  rede) e estão mapeados tela × aceite × medição em `N1-PRECHECK.md` A4.
  Esclarecimento, não defeito.
- **E3 — `fitPolicy` do S3d** (2026-09-11, N1-PR8): o PDF do palco renderiza em
  **fit width** (`fitPolicy={0}`), não em página inteira. Decisão do Marcel de
  2026-09-10, depois do aceite no Tab S6: com a página inteira a A4 fica em
  ~244 dp de largura `[medido: N1-PR7 §3.6]`. Consequência declarada: virar
  página exige vários deslizes (o T1-R27 vale para a música, não para a página
  do PDF) — ver `N1-ENCERRAMENTO.md` §6.

sha256:
- Octavia_Tela_1.html: 9761e4e535fdd7b1d312c3315d0e878daa866d6c06b97cdf9d3b3311e311f20c
- Octavia_Tela_1.pdf:  b24ef2d8e6862870fe3cb14ebdc1f71f41af1b5a5a795436103ef80181a50e8c
