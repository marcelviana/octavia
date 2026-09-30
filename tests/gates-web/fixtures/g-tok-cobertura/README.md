# CN do `g-tok-cobertura.mjs` (I1-PR14)

Árvore sintética: `node scripts/gates-web/g-tok-cobertura.mjs tests/gates-web/fixtures/g-tok-cobertura/arvore` com
`G_TOK_ARQUIVOS=tests/gates-web/fixtures/g-tok-cobertura/lista.txt`. Esperado, exato:

| arquivo | de tela? | na lista? | sai |
|---|---|---|---|
| `app/a/page.tsx` | sim | sim | — |
| `app/b/page.tsx` | sim | não | **FORA** |
| `app/api/r/route.ts` | não (rota — o G-back) | — | — |
| `components/listado.tsx` | sim | sim | — |
| `components/fora.tsx` | sim | não | **FORA** |
| `components/__tests__/apoio.tsx` | não (teste) | — | — |
| `contexts/contexto.tsx` | sim | não | **FORA** |
| `hooks/use-coisa.ts` | sim (`.ts` em `hooks/` conta) | não | **FORA** |
| `lib/limite.tsx` | sim (`.tsx` em `lib/`) | não | **FORA** |
| `lib/servico.ts` | não (`.ts` em `lib/` é serviço) | sim | informa "da lista que não são de tela: 1" |

→ `arquivos de tela: 7 · na lista: 2 · FORA: 5 · da lista que não são de tela: 1`, exit 1. Nenhum destes arquivos é
importado; `tests/` está fora do `tsconfig` e nenhum tem nome de teste.
