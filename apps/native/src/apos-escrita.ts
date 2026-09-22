/**
 * A LIGAÇÃO DA DIV. 228 — T2-R17, o prefetch depois de uma escrita.
 *
 * A revisão 1 do T2-R17 supôs que "a ressincronização chama o mesmo
 * `prefetchEArrumar` que o sync completo chama". **Não chama.** O
 * `sincronizar()` do `sync.ts` nunca chamou o prefetch — quem o chama é o
 * `App.tsx`, nas duas saídas do `rodarSync` —, e a releitura da N2-D13 não
 * passa pelo `planSync`, que é o caminho que o dispara. Logo o prefetch
 * depois de uma escrita é uma **ligação a fazer**, e é esta.
 *
 * A N2-PR2 deixou o gancho `aoRelerSetlists` e o declarou INERTE, em vez de o
 * T2-R17 parecer atendido por construção. Este módulo é quem o liga.
 *
 * **Por que um módulo, e não quatro linhas dentro do `App.tsx`.** O `App.tsx`
 * não é importável por teste nenhum (Firebase, `expo-network`, navegação,
 * safe-area), e uma ligação que não pode ser medida é exatamente o tipo de
 * coisa que a div. 228 achou solta. Aqui ela é um `it` do
 * `apos-escrita.test.tsx`: criar com data em +3 dias produz `prefetch plan
 * n=<k> reason=7d`, e sem o gancho não produz nada — o controle positivo ao
 * lado, que é o que separa "ligado" de "nunca esteve desligado".
 *
 * A composição é a MESMA do `prefetchEArrumar` do `App.tsx`: o prefetch de 7
 * dias e, no fim, a arrumação (o LRU mais o `presentUrls`). Repeti-la aqui é
 * deliberado — o que vem pela releitura de uma escrita tem de custar o mesmo
 * que o que vem por um sync.
 */
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { aoRelerSetlists } from './escrita'
import { prefetch7Dias } from './prefetch'

/**
 * Liga o gancho. Devolve a função que o desliga — quem a chama é o efeito do
 * `App.tsx` ao sair, para que um segundo registro não empilhe.
 *
 * `contentById` é uma FUNÇÃO, e não um valor: o índice muda a cada sync, e um
 * gancho que capturasse o mapa de hoje continuaria trabalhando sobre ele
 * depois de o conjunto ter mudado.
 */
export function ligarPrefetchAposEscrita(
  contentById: () => Map<string, ContentDTO>,
  aoMudarArquivos: () => void,
  arrumar: () => void,
): () => void {
  aoRelerSetlists((setlists: SetlistDTO[]) => {
    void prefetch7Dias(setlists, contentById(), aoMudarArquivos).then(arrumar, arrumar)
  })
  return () => aoRelerSetlists(null)
}
