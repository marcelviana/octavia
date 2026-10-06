/**
 * N4-PR6 — para onde vai cada toque que abre o palco avulso ou a busca dele (N4-R16, N4-R17). Uma FUNÇÃO e não um
 * trecho do `navigation.tsx` porque a `Navigation` real não roda no duplo de teste (div. 334): o destino se prova no
 * `palco-avulso.test.tsx`, e a ligação no aparelho.
 *
 * **O palco avulso SEM HOSPEDEIRA** (`{ avulsa, origem }`, sem `setlistId`): aberto de fora de uma setlist, ele não
 * tem setlist. Até a N4-PR6 a busca aberta de S1 pegava emprestada a primeira setlist da lista
 * (`setlistId: setlist?.id ?? dados.lista[0]?.id ?? ''`): a barra mostrava o nome dela, o índice abria o dela, o
 * prefetch baixava os arquivos dela (div. 964), e com zero setlists o `''` caía no placeholder sem controle nenhum
 * (div. 1001). Agora o avulso EMPILHA (`push`) sobre a origem: o voltar é o `goBack`, e a origem volta na mesma
 * posição — a busca com o mesmo termo e a mesma rolagem, porque o native-stack não desmonta a tela de baixo.
 *
 * **A origem** dá o nome ao voltar (`nomeDoVoltarDoAvulso`, no core): `busca` nesta PR; `biblioteca` e
 * `visualizacao` são o contrato que a PR-7 (L) e a PR-8 (V) usam — as duas telas ainda não existem.
 *
 * **O que fica como está** (N4-D30): o avulso aberto pela busca DE DENTRO de uma setlist — a música de fora entra no
 * lugar da busca (`replace`) com a setlist de onde a busca partiu, e o `goBack` devolve o palco dela na posição; e o
 * salto para uma música da própria setlist.
 */
import type { OrigemDoAvulso, SetlistDTO } from '@octavia/core'

/** Os params do palco: o de uma setlist (com a música avulsa da busca dela, ou não), ou o avulso sem hospedeira. */
export type ParamsDoPalco =
  | { setlistId: string; position: number; avulsa?: string }
  | { avulsa: string; origem: OrigemDoAvulso }

/** `posicao` é a do palco na abertura; ausente quando a busca vem da S1, da S2 ou do avulso sem hospedeira. */
export type ParamsDaBusca = { setlistId?: string; posicao?: number }

export type Destino =
  | { acao: 'push' | 'navigate' | 'replace'; rota: 'Stage'; params: ParamsDoPalco }
  | { acao: 'push' | 'navigate'; rota: 'Search'; params: ParamsDaBusca }

/**
 * O toque num resultado da S4. `setlist` é a da busca (`null` quando ela foi aberta de S1 ou do avulso sem
 * hospedeira); `posicaoDaBusca`, a do palco de onde ela partiu; `posicaoNaSetlist`, a da música na setlist da busca.
 */
export function destinoDoResultado(
  setlist: SetlistDTO | null,
  posicaoDaBusca: number | null,
  contentId: string,
  posicaoNaSetlist: number | null,
): Destino {
  if (setlist === null) return { acao: 'push', rota: 'Stage', params: { avulsa: contentId, origem: 'busca' } }
  if (posicaoNaSetlist !== null) {
    return { acao: 'navigate', rota: 'Stage', params: { setlistId: setlist.id, position: posicaoNaSetlist } }
  }
  return {
    acao: 'replace',
    rota: 'Stage',
    params: { setlistId: setlist.id, position: posicaoDaBusca ?? 1, avulsa: contentId },
  }
}

/**
 * O toque na busca do palco. Sem setlist (o avulso sem hospedeira, N4-R17): uma S4 NOVA, sem setlist — portanto sem
 * a seção *Nesta setlist* —, empilhada sobre o palco. Com setlist: a de hoje.
 */
export function destinoDaBuscaDoPalco(setlistId: string | null, posicao: number): Destino {
  if (setlistId === null) return { acao: 'push', rota: 'Search', params: {} }
  return { acao: 'navigate', rota: 'Search', params: { setlistId, posicao } }
}
