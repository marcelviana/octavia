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

sha256:
- Octavia_Tela_1.html: 9761e4e535fdd7b1d312c3315d0e878daa866d6c06b97cdf9d3b3311e311f20c
- Octavia_Tela_1.pdf:  b24ef2d8e6862870fe3cb14ebdc1f71f41af1b5a5a795436103ef80181a50e8c
