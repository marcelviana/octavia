# DESIGN-QL-anexos — a conferência da folha antes de congelar

O bruto do `DESIGN-QL/README.md` §5. A folha (`../DESIGN-QL/telas.html`) é um pacote que se monta no navegador: toda
conferência a renderizou no Chromium do `@playwright/test` do repositório, **sem rede** (o que não é `file:`/`data:`/`blob:`
é abortado e registrado). **Nenhum anexo traz texto de música real**: as capturas são das molduras, com os textos
inventados do brief e as fixtures do projeto.

| arquivo | o quê |
| --- | --- |
| `instrumentos/conferir.mjs` | a rede e os erros da página; a seção 13 verbatim (e se *"Na tela: todas as molduras ok"* está lá); as molduras pelo ID contra o molde `QL-<faixa>-<superfície>-<estado>-<tema>` e os canvas C 1138 × 627 · B 711 × 1054 · A 411 × 874; o que o §9 do brief pede e falta; as capturas. `node docs/native/DESIGN-QL-anexos/instrumentos/conferir.mjs docs/native/DESIGN-QL/telas.html docs/native/DESIGN-QL-anexos/capturas`, da raiz |
| `conferencia.txt` | a saída do `conferir.mjs`, verbatim |
| `instrumentos/texto-renderizado.mjs` | o `document.body.innerText` da folha, sem rede — a entrada do `nomes.py` (o texto não entra no anexo: é a folha inteira) |
| `instrumentos/nomes.py` | procura no texto renderizado **todo** valor de `artist`/`title` dos arquivos que a lista do D-0 (`docs/ux/D0-PRECHECK-anexos/fixtures-nomes-reais.txt`) aponta — a lista não traz os nomes; imprime só contagens |
| `nomes.txt` | a saída do `nomes.py` (0 de 40) e o controle negativo (1) |
| `capturas/*.png` | 11 molduras-chave (a Letra em B, a Cifra em A, as notas abertas e recolhidas em C, o zoom 40 em B, a âncora antes e depois do giro e do zoom, o "nada muda", a amostra da divisa) |
| `suite-tsc-lint.txt` | `pnpm test`, os quatro `tsc` (de dentro de cada pacote), o `pnpm lint` e o `git diff --stat origin/main -- . ':!docs'` (vazio) |

Os instrumentos são **de anexo** (fora de CI, lint e typecheck — N4-D117): se um bloco seguinte os reaproveitar, saem de
`docs/`.

## O bloco ```` ```gates ```` desta PR (verbatim, regra do W4-b2)

```gates
# QL desenho: nenhuma declaração — só docs.
```

```gates-web
# só docs — QL desenho: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```
