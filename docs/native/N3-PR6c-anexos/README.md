# N3-PR6c-anexos — o (b) corte no G-N3 e a fileira de marcas da S5 por faixa (div. 461)

**Rastro.** A fonte é o [`N3-REQUISITOS.md`](../N3-REQUISITOS.md) §12 (a div. 461 fechada, o A-N3-3 fechado de novo) e
o [`DESIGN-N3/README.md`](../DESIGN-N3/README.md) §9 (a errata N3-E20 e as divergências 462–466). Árvore
`../octavia-n3-pr6b`, branch `n3/pr6c-s5`, nascida de `origin/main` = `73b45ea` com a #332 (N3-PR6b) **ainda aberta**
(div. 465): os anexos da 6b que os controles leem foram extraídos da branch dela para a árvore, **sem stage**, e a
branch só sobe depois do rebase sobre a `main` com a #332.

**Nenhum texto de música de terceiro**: todo dump é do mock com a fixture do pre-check. Dos **179** `text`/
`content-desc` distintos dos 68 dumps, 175 estão nos anexos anteriores do N3, e os 4 restantes são frases do app
(`18 DE 18`, `19 DE 19`, `18 músicas · Ensaio de retrato`, `19 músicas · …`). O único corpo em tela é a fixture do
projeto (palco da passada final). PNGs: os 8 de retrato da S5, sem corpo nenhum.

## Commit 1 — o (b) no G-N3, e os controles (`cn-n3pr6c-commit1.txt`)

O (b) é o do `inventario.mjs` do pre-check, a parte de `bounds`: nó que passa da janela útil (sob a barra) ou que
encosta na borda lateral sem ocupar a largura inteira, **novo contra a paisagem** do mesmo estado. Reprova, e a
linha-resumo passa a dizer `(e)=0 · (b)=0 · nome-acessível=… · rolagem=…`.

| controle | o quê | esperado | obtido |
|---|---|---|---|
| **CN-B1** | a `S5-n-grande` em retrato da N3-PR6b × a paisagem dela | exit 1, (b) > 0 | exit 1, **(b)=4 em 2 dumps** — as duas marcas das pontas em cada aparelho: `ViewGroup borda lateral [0, 438.2, 7.6, 440.9]` e `[702.2, 438.2, 711.1, 440.9]` (Tab; AVD em y 432) |
| **CP-B2** | a paisagem do mesmo estado como "faixa" | exit 0, (b)=0 | exit 0, `(e)=0 · (b)=0` |
| **CP-B3** | o consolidado da N3-PR6, 102 pares, o comando verbatim | exit 0, (b)=0 | exit 0, **`(e)=0 · (b)=0 · nome-acessível=28 · rolagem=18`** — o (b) não passava em silêncio em outra tela |
| **CN-B4** | o picker de antes do conserto da N3-E18 (`N3-PR6-anexos/dumps-defeito/`) | exit 1, (b) > 0 | exit 1, **(b)=6** — `picker-estado-1`, `picker-adicionar-1` e `"Tentar de novo"` na borda de 711,1, nos dois aparelhos: o (b) teria pegado a div. 445 também |
| **CT-B5** | o (b) do G-N3 × o (b) novo do `B3-inventario.jsonl`, sem o "ausente", dump a dump | 0 diferenças | **105 dumps, (b) somado 56, 0 diferenças** |

**O (b) da S5 é 2 por dump, não 48** (div. 462): o uiautomator recorta os `bounds` na tela e **omite** o nó que
está inteiro fora dela, e o Fabric achata a árvore (o contêiner da fileira não chega ao dump). Das 60 marcas, 12
não existem no dump e 46 estão inteiras dentro da janela; só as duas das pontas carregam a assinatura de corte.

Os controles antigos do G-N3 seguem verdes com o (b) (`cn-n3pr1-commit1.txt`: CN-N1 com `(b)=8`, CN-N2 com
`(b)=48` no celular do pre-check, CT-N3, CP-N4 com `(b)=0`; `cn-n3pr3-commit1.txt`: o CP-G1 com a linha nova). E o
CN de tela, **antes do conserto** (`CN-commit1.txt`): em B a fileira pede **895** (N = 60), **736** (19) e **697**
(18) contra 663 — reprova; o N = 8 (307) e os dois CPs de C passam.

## Commit 2 — a largura da fileira por faixa

`theme.ts` ganha `s5.fileira` (C 900 · B 663); o `EndScreen` passa a largura ao `marcas()` e à barra sólida. Nada
mais muda. `CN-commit2.txt`: o CN de tela e o `s5-faixa.test.tsx` 10/10; nativo **211/211**, core **202/202**,
`tsc` exit 0. `G1-commit2.txt` · `G2G3-commit2.txt` · `a20-commit2.txt`: exit 0 com o bloco `gates` abaixo; G2
80 → 80 `testID`, G3 68 → 68 linhas `log(`, a20 0 acusações.

## Commit 3 — o aceite

**S5 com N músicas** (`instrumentos/n3pr6c.py`: a `Ensaio de retrato` com N músicas de texto e um `updated_at`
próprio por N), Tab e AVD, paisagem e retrato — `s5-marcas.txt`, `G-N3-S5.txt`, `G5G6-S5.txt`:

| N | retrato (B), Tab = AVD: marcas no dump · x · largura | paisagem (C), Tab = AVD |
|---|---|---|
| **60** | **60 de 60** · 28,0 → 683,1 · 6 dp (655 dp) | 60 de 60 · 121,3 → 1016,4 · 10 dp — **idêntica à da N3-PR6b** (`G-inv-S5-60-pai.txt`: 100 e 101 nós; e o mesmo sha256) |
| **19** | 19 de 19 · 25,8 → 686,2 · 30 dp (660) | 19 · 200,9 → 936,9 · 34 |
| **18** | 18 de 18 · 24,9 → 685,8 · 32 dp (661) | 18 · 220,4 → 917,3 · 34 |
| **8** | 8 de 8 · 202,2 → 508,9 · 34 dp — a de antes | 8 · 415,6 → 722,2 · 34; no AVD o dump é o mesmo sha da `S5-fim` da passada final da N3-PR6 |

- **G-N3 da S5**: 8 pares, **(e)=0 · (b)=0**.
- **G5/G6 da S5**: 4 estados × quatro colunas, 16 de 16, `borda-voltar`, `voltar-inicio` e `sair` ≥ 48 com `testID`.
- **G-inv** (`G-inv-final.txt`): a passada final de paisagem no build do conserto, **34 de 34** (B5) e **18 de 18**
  (palco, que tem a S5 com 8) — na primeira passada, o S0 frio incluído.
- **FATAL**: 0 nos dois aparelhos (`estado/fatal.txt`).
- **O instrumento do G5/G6 não mudou** (os dumps da S5 não têm rolado): o `APARATO.md` não ganha a lição da div. 458
  (div. 466).

## O bloco ```` ```gates ```` desta PR, verbatim

```gates
# N3-PR6c: div. 461 — a largura da fileira de marcas da S5 é token de faixa (C 900 · B 663).
g1a: apps/native/src/screens/EndScreen.tsx
g1a: apps/native/src/theme.ts
```

## Aparato

- **Um mock por aparelho** (div. 446): AVD 8788, Tab 8789 (`adb reverse tcp:8788 tcp:8789`); arquivos 8790 e Metro
  8081 compartilhados; as duas cadeias em paralelo (`instrumentos/cadeia.sh`).
- **Metro** sem `CI=1`, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline. **Bundle conferido**
  (`estado/bundle.txt`): `localhost:8788` 1 · `octavia.rocks` **0** · `fileira: 663` 1 · `fileira: 900` 1 ·
  `s5.fileira` 2 · `N3-E18` 3.
- **Dev client** sem rebuild (nenhum módulo nativo): AVD `2026-09-24 14:00:01`, Tab `2026-09-23 19:11:34`.
- **`.env`** copiado do checkout principal (sha256 `f2bfa179cd8e4b1f…`) só para o Metro; apagado no fim.
- **Escritas**: prod zero; mock zero.
- **Cópias de arnês** (`instrumentos/copias.diff`): o `n3pr6b.py` da 6b com o laço atrás do `__main__` (o
  `n3pr6c.py` o importa), o `passada4-final.py` da N3-PR6 com o prefixo `N3P6CF`, o `roteiro.py` do pre-check com a
  porta por aparelho — nada no que eles medem.
- **O Tab**: `stay_on` a 7 logo depois de ler o estado e **antes** de pedir o destravar (a lição da div. 457) — não
  travou.

## Estado dos aparelhos: lido, declarado, restaurado

| aparelho | lido | mudado | no fim |
|---|---|---|---|
| **AVD `octavia_tab32`** | `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, audit, `ram.bin` de 2026-09-24 14:00 | `-no-snapshot-save`; avião desligado e rádio ligado (`ping` 2/2); rotação; `reverse`; a sessão derrubada pelo S0 frio | `reverse` vazio; desligado sem salvar; `ram.bin` de 2026-09-24 14:00 |
| **Tab S6** | `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, bloqueado (o Marcel destravou) | `stay_on` 0→7; rotação; `reverse`; avião (S1 da passada final); o cache trocado pelo do mock | settings iguais ao lido; `reverse` vazio; `md5` dos três JSON idêntico (`estado/tab-md5-antes.txt` × `-depois.txt`); a `partitura-1p.pdf` e a `partitura-12p.pdf` da demanda, baixadas pela fixture, apagadas — sobra `<o arquivo do Marcel>.pdf`; as cópias do host apagadas |
| **host** | 8081/8788/8789/8790 livres | Metro, dois mocks, arquivos | as quatro livres; `.env` apagado |

**Os `._*` do cache do Tab** (quatro AppleDouble de 163 B, a div. 420) **ficam onde estão**, por decisão do Marcel —
nota para o encerramento do N3.

## Índice

| arquivo / pasta | o que traz |
|---|---|
| `cn-n3pr6c-commit1.txt` · `cn-n3pr1-commit1.txt` · `cn-n3pr3-commit1.txt` | os controles do (b) e os do G-N3 de antes, com o (b) |
| `CN-commit1.txt` · `CN-commit2.txt` | o CN de tela antes (3 reprovam) e depois (10/10), a suíte, o `tsc` |
| `G1-commit2.txt` · `G2G3-commit2.txt` · `a20-commit2.txt` | os gates do conserto |
| `G-N3-S5.txt` · `G5G6-S5.txt` · `s5-marcas.txt` | a S5 com N = 60, 19, 18 e 8, nas quatro colunas |
| `G-inv-final.txt` · `G-inv-S5-60-pai.txt` | a invariante C no build do conserto; a paisagem da S5 com 60 contra a da 6b |
| `dumps-n-pai/` · `dumps-n-ret/` | os 16 dumps da S5 (8 + 8) |
| `dumps-final/` | os 52 dumps da passada final de paisagem (Tab 25, AVD 27) |
| `png/` | os 8 PNGs de retrato da S5 |
| `roteiros/` · `estado/` · `instrumentos/` | as rodadas verbatim; o estado de cada aparelho; `n3pr6c.py`, `cadeia.sh`, `copias.diff` |
| `SHA256SUMS.txt` | sha256 de todo arquivo desta pasta, menos ele mesmo |
