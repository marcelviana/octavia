/**
 * O CONTRATO DA LINHA DE AVISO — o que o site e o tablet dividem, sem dividir o componente (N4-D16;
 * `N4-PRECHECK.md` A10).
 *
 * São DUAS implementações e continuam duas: `components/identidade/linha-de-aviso.tsx` (web) e
 * `apps/native/src/screens/LinhaDeAviso.tsx` (tablet). O que vem para cá é só a forma: o motivo, a espécie e a ação.
 *
 *  - **`motivo`** — a frase inteira, que cresce e nunca elide (N3-D19).
 *  - **`especie`** — união FECHADA. As três que os dois lados têm (`falha`, `rede`, `limite`), as duas que só o
 *    tablet usa (`teto`, o teto de 100 do reordenar; `salvo-nao-relido`, a escrita que passou e a releitura não) e a
 *    que só o site usa (`sucesso`). **Cada implementação mapeia espécie → ícone e cor**: o site já faz isso no
 *    `ICONE`; o tablet ainda recebe `icone` e `cor` de quem chama, e a troca por espécie nas quatro telas é da
 *    N4-PR9, só se o mapa devolver os mesmos pares de hoje (N4-D32, N4-D72).
 *  - **`acao`** — a união das duas: `{ rotulo, onPress, inativo?, motivoInativo? }`. O `motivoInativo` é do tablet
 *    (N2-D23: inativo sempre com o motivo escrito); o site ainda não o usa.
 *
 * Fora do contrato, de propósito: `detalhe` e `className` (site), `recuo` (tablet), e o `icone`/`cor` que o tablet
 * recebe hoje. **Nenhum dos dois componentes importa este arquivo** — e quem prova que os dois seguem o contrato
 * é uma igualdade de TIPOS de cada lado: no tablet, `apps/native/test/linha-de-aviso-contrato.test.ts` (o `tsc` do
 * nativo a cobra); no site, `tests/gates-web/contrato/linha-de-aviso.tipos.ts`, compilada pelo
 * `tests/gates-web/linha-de-aviso-contrato.test.ts`. O site não adota o tipo porque o `import type` mudou o NOME
 * de um chunk do build (o conteúdo, não) — `N4-PR3-anexos/README.md`.
 */

/** As espécies, em ordem: as comuns, as do tablet, a do site. */
export const ESPECIES_DE_AVISO = ['falha', 'rede', 'limite', 'teto', 'salvo-nao-relido', 'sucesso'] as const

export type EspecieDeAviso = (typeof ESPECIES_DE_AVISO)[number]

export interface AcaoDoAviso {
  rotulo: string
  onPress: () => void
  /** Inativo com o motivo escrito ao lado (N2-D23) — nunca sem motivo, no tablet. */
  inativo?: boolean
  motivoInativo?: string
}

export interface ContratoDaLinhaDeAviso {
  motivo: string
  especie: EspecieDeAviso
  acao?: AcaoDoAviso
}
