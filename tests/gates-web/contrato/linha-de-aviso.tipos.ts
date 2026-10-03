/**
 * N4-PR3 (N4-D16) — o componente do SITE segue o contrato da linha de aviso do core, sem importá-lo.
 *
 * O site não adota o tipo do core: com o `import type` no `components/identidade/linha-de-aviso.tsx`, o conteúdo
 * dos 61 chunks saiu igual, mas o NOME de um deles mudou (o hash entra no `app-build-manifest.json`) — e a regra
 * da PR-3 é não adotar se o build mudar um byte (`docs/native/N4-PR3-anexos/README.md`). No lugar, esta igualdade
 * de tipos, que o `tests/gates-web/linha-de-aviso-contrato.test.ts` compila com o `tsc` (o `tsconfig.json` da
 * raiz exclui `tests/`). Cada constante só compila se o tipo do site for o do contrato.
 */
import type { AcaoDoAviso as AcaoDoSite, LinhaDeAvisoProps, TipoDeAviso } from "@/components/identidade/linha-de-aviso"
import type { AcaoDoAviso as AcaoDoContrato, ContratoDaLinhaDeAviso, EspecieDeAviso } from "@octavia/core/src/linha-de-aviso"

type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

/** As espécies que o site desenha são as quatro do contrato que ele tem no `ICONE` — nem uma a mais. */
export const especiesDoSite: Igual<TipoDeAviso, Extract<EspecieDeAviso, "falha" | "rede" | "limite" | "sucesso">> = true
/** A ação do site é a do contrato sem o `motivoInativo` (do tablet). */
export const acaoDoSite: Igual<AcaoDoSite, Omit<AcaoDoContrato, "motivoInativo">> = true
/** O motivo é a frase inteira, nos dois. */
export const motivoDoSite: Igual<LinhaDeAvisoProps["motivo"], ContratoDaLinhaDeAviso["motivo"]> = true
