# N4-BRIEF — medidas por faixa (C, B, A)

> **Fonte**: os `uiautomator dump` de [`capturas/`](capturas/), tirados no Tab S6 em 2026-10-02 contra o **mock**
> (ver `README.md`), os tokens de `packages/identidade` e a folha congelada do `DESIGN-N3` (a tabela *"o sistema em
> uma tabela"* do `telas.html`). Os `bounds` brutos de todos os nós com `resource-id` estão em
> [`medidas-brutas.txt`](medidas-brutas.txt) (instrumento: [`instrumentos/medidas.py`](instrumentos/medidas.py)).
>
> **Conversão**: `dp = px ÷ 2,25` (densidade 360). Em **C** (deitado, `rotation="1"`) a janela do app é
> `[0,0][2560,1492]` = **1137,8 × 663,1 dp**; em **B** (em pé, `rotation="0"`) é `[0,0][1600,2452]` = **711,1 ×
> 1089,8 dp**. Nos dois a barra de status ocupa 0–54 px (24 dp) e o app desenha a partir de 54. Abaixo da janela fica a
> barra de tarefas da Samsung, que é do sistema.
>
> **Origem de cada medida**: `[dump]` = `bounds` lido do dump · `[derivado]` = conta sobre dois `[dump]`, com a conta ao
> lado · `[token]` = valor do pacote `packages/identidade` (o nome ao lado) · `[folha N3]` = valor desenhado na folha
> congelada do `DESIGN-N3`, que **não foi implementado** (A só é implementada no N5) · `[estimado]` = conta sem medida.
> **Nenhuma medida vem da imagem.**

## 1. Os canvas

| faixa | largura útil | canvas do desenho | o aparelho desta pasta | origem |
|---|---|---|---|---|
| **C** | > 960 dp | **1138 × 627** (o congelado V1/N2; o pior caso de C é o AVD com as duas barras) | Tab deitado: janela 1137,8 × 663,1; útil abaixo da barra de status **1137,8 × 639,1** | canvas: `APARATO.md` "Aparelhos"; janela: `[dump]` |
| **B** | 700–960 dp | **711 × 1054** (tablet em pé) | Tab em pé: janela 711,1 × 1089,8; útil **711,1 × 1065,8** | canvas: `DESIGN-N3/README.md` §1; janela: `[dump]` |
| **A** | < 700 dp | **411 × 874** (celular em pé) | **não capturada**: em A o app usa hoje os tokens de B, e a imagem não é a composição de A | `DESIGN-N3/README.md` §1; as molduras `N3-A-*` |

## 2. Barras, por superfície e faixa

| superfície · barra | C | B | A | origem |
|---|---|---|---|---|
| S1 · barra superior | **120,0** (`[0,54][2560,324]`), uma linha | **144,0** (`[0,54][1600,378]`), título em linha própria; chip e botões na 2ª | **168**: título / chip / 2 botões | C e B `[dump]` = `[token]` `faixas.C.s1.barra` 120 · `faixas.B.s1.barra` 144; A `[folha N3]` |
| S4 · barra (fechar · campo · apagar) | **88,0** (`[0,54][2560,252]`) | **88,0** (`[0,54][1600,252]`) | 88 | C e B `[dump]`; A `[folha N3]` |
| picker · barra | **88,0** | **88,0** | 88 | `[dump]`; A `[folha N3]` |
| picker · rodapé (`Concluir`) | **64,0** (`[0,1348][2560,1492]`) | **64,0** (`[0,2308][1600,2452]`) | — | `[dump]` |
| palco · barra superior | **64,0** (`[0,54][2560,198]`), uma linha | **88,0** (`[0,54][1600,252]`), duas linhas | **144**: posição + índice/busca/sair / setlist / título | C `[token]` `bar.top` 64 · B `[token]` `faixas.B.palco.barra` = `bar.top + space.xl` 88; ambos `[dump]`; A `[folha N3]` |
| palco · barra inferior | **96,0** (`[0,1276][2560,1492]`), 7 controles | **96,0** (`[0,2236][1600,2452]`), 7 controles | **96**: os 4 de leitura | `[token]` `bar.stage` 96 + `[dump]`; A `[folha N3]` |
| palco avulso · barra superior | **64,0** — igual ao palco com setlist | **88,0** — igual | — | `[dump]` (`N4BR-S3-avulso-de-S1-com-setlists-*`) |

## 3. Linhas e cartões

| elemento | C | B | A | origem |
|---|---|---|---|---|
| S1 · cartão de setlist | **1073,8 × 132,0** | **647,1 × 184,0** | 379 × conteúdo (mín. 132) | C e B `[dump]` (`setlist-00000001`) = `[token]` `faixas.*.s1.cartao`; A `[folha N3]` |
| S1 · vão entre cartões | 12,0 (`720 − 693` px) | 12,0 (`891 − 864` px) | — | `[derivado]` |
| S4 · linha de resultado (`resultado-*`) | **1089,8 × 80,0** | **663,1 × 80,0** | — | `[dump]` |
| S4 · vão entre resultados | 12,0 (`590 − 563` px) | 12,0 | — | `[derivado]` |
| S4 · título · apoio · tipo na linha | título 892,0 × 29,8 · apoio 892,0 × 19,1 · tipo 56,0 × 19,1 | título 465,3 × 29,8 · apoio 465,3 × 19,1 · tipo 56,0 × 19,1 | — | `[dump]` |
| S4 · régua (`BIBLIOTECA · 12 MÚSICAS` · `9 RESULTADOS`) | altura 18,2, y 129,8 | igual | — | `[dump]` |
| picker · passo entre linhas | **92,0** (`626 − 419` px, de um `Adicionar` ao seguinte) | **92,0** | — | `[derivado]`; a linha em si não tem nó próprio no dump |
| picker · título na linha | 726,2 × 29,8 | 299,1 × 29,8 | — | `[dump]` |
| picker · `já na setlist` (marca do estado) | 70,2 × 19,1 | 70,2 × 19,1 | — | `[dump]` |
| S2 · linha de música (referência, não capturada aqui) | 536,9 × 116 · 2 colunas | 663 × 116 · 1 coluna | 379 × 116 · tipo desce para baixo do artista | `[folha N3]` (C é o `N2-BRIEF-anexos/MEDIDAS.md` §2.3) |
| linha de aviso | 48 · 1 linha | 48 mín. · +20 por linha, até 2 | 48 mín. · até 3 linhas · ação desce | `[folha N3]` (N3-D19) |
| palco · corpo (área de leitura) | 1073,8 × 447,1 (letra) | 647,1 × 849,8 | — | `[dump]` (`corpo`) |
| palco · zonas de toque laterais (cada) | **170,7** | **106,7** | 61,7 | `[dump]` (`borda-voltar`, `borda-avancar`); A `[folha N3]` |

## 4. Alvos de toque

| alvo | medida | origem |
|---|---|---|
| mínimo de qualquer alvo | **48** | `[token]` `touch.min` |
| linha tocável de lista | **56** | `[token]` `touch.list` |
| controle do palco | **64** | `[token]` `touch.stage` |
| `fechar-busca`, `apagar` (S4 e picker) | 48,0 × 48,0, nas duas faixas | `[dump]` |
| `campo-busca` / `picker-campo` | C **900,0** × 48,0 · B **473,3** × 48,0 | `[dump]` |
| `Adicionar` do picker (`picker-adicionar-*`) | 136,0 × 48,0, nas duas faixas | `[dump]` |
| `Buscar música` (`buscar`, S1) | 171,1 × 57,8 (C) · 171,1 × 58,2 (B) | `[dump]` |
| `Nova setlist` (`criar-setlist`, S1) | 152,0 × 57,8 (C) · 152,0 × 58,2 (B) | `[dump]` |
| `Baixar esta setlist` | 193,8 × 58,2 (C) · 194,2 × 58,2 (B) | `[dump]` |
| botões da barra inferior do palco | 65,8–66,2 × 65,8, nas duas faixas | `[dump]` |

## 5. Onde o controle novo de S1 cabe (C e B), medido

| medida | C | B | origem |
|---|---|---|---|
| margem lateral da barra | 32,0 (`72` px) | 32,0 | `[derivado]` |
| vão entre `Nova setlist` e `Buscar música` | **24,0** (`2103 − 2049` px) | **16,0** (`1143 − 1107` px) | `[derivado]` = `[token]` `faixas.C.s1.vaoDaBarra` = `space.xl` · `faixas.B.s1.vaoDaBarra` = `space.lg` |
| vão entre o chip de sync e `Nova setlist` | 24,0 (`1707 − 1653` px) | — (em B o chip fica à esquerda, na mesma 2ª linha) | `[derivado]` |
| caixa do título `SETLISTS` (estica até o grupo da direita) | **534,2** (`72→1274` px) | 647,1 (linha própria) | `[dump]`; em C a caixa encolheu de 709,8 (`N2-BRIEF-anexos`, sem `Nova setlist`) para 534,2 com ela |
| o que sobra na 2ª linha de B, à esquerda dos dois botões | da borda (32,0) até `Nova setlist` (340,0): **308,0**, com o chip de 116,9 + ícone dentro | — | `[derivado]` |

**Leitura para o brief (sem decidir)**: em C a barra de S1 tem hoje, da direita para a esquerda, `Buscar música`, `Nova
setlist` e o chip; um terceiro controle tira largura da caixa do título (534,2 dp hoje), não de um vão vazio. Em B a
segunda linha da barra tem 308 dp à esquerda dos dois botões, onde mora o chip.

## 6. O que não está aqui

- **Cores, raios, espessura de borda**: os dumps não trazem; são os tokens do pacote (`packages/identidade`).
- **A faixa A medida**: em A o app hoje usa os tokens de B (o celular desenha a composição de B); as medidas de A acima são
  as **desenhadas** na folha do `DESIGN-N3`, não medidas.
- **Largura de texto que não está em tela**: a régua de desenvolvimento (`APARATO.md`, "A régua de desenvolvimento") mede
  na PR de implementação; nada desta pasta é `[estimado]`.
- **A linha do S1 que muda entre as duas capturas**: `0 de 2 arquivos baixados` em C e `1 de 2` em B no cartão da
  `Ensaio de retrato` — a captura do palco em C baixou um PDF da fixture antes da rodada de B. É dado, não geometria.
