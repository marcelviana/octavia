/**
 * O VOO ÚNICO do sync (SY-D9, SY-D25, SY-D35; `docs/native/SY-PRECHECK.md` A5): **um sync por vez**; o pedido que
 * chega durante um sync marca "de novo", e o "de novo" roda **uma** vez, quando o sync em curso termina.
 *
 * Puro, como todo o core: aqui não há request, relógio, sessão nem promessa. Quem pede é o executor
 * (`apps/native/src/sincronizador.ts`) — a cada pedido de sync, venha de onde vier (a abertura da sessão, o *Tentar de
 * novo* e, na PR-4, os gatilhos) — e quem diz se aquele pedido roda agora, fica marcado ou não muda nada é esta
 * máquina. Três estados:
 *
 *     ocioso ──pedir: rodar──▶ em-voo ──pedir: marcar──▶ em-voo-de-novo ──pedir: nada──▶ (o mesmo)
 *       ▲                        │                            │
 *       └──────terminou: nada────┘                            └──terminou: rodar──▶ em-voo (o "de novo" é o voo novo)
 *
 * **Por que o "de novo" é um só**, por mais pedidos que cheguem: o pedido que chegou durante o voo aconteceu DEPOIS da
 * leitura do servidor que o sync em curso fez; um sync que comece depois do fim dele lê o servidor de agora, e com isso
 * atende a todos os que chegaram — dois "de novo" seguidos leriam a mesma coisa duas vezes.
 *
 * **O cancelamento** (SY-D17, o logout no meio): o sync que termina com a sessão mudada solta o "de novo" —
 * `terminou` com `cancelarDeNovo` volta a `ocioso` e não roda nada. Quem sabe da sessão é o executor; aqui só a decisão.
 *
 * O que a máquina NÃO decide: o intervalo de 30 s e os gatilhos (SY-D18, PR-4 — o "de novo" fica fora do intervalo,
 * e é por isso que ele não passa por lá); o prazo de rede de cada leitura (SY-D19, o `PRAZO_DE_REDE_MS` do
 * `escrita.ts`, que é o que garante que todo voo termina); e as releituras das escritas de setlist, que não entram no
 * voo (SY-D25: a ordem entre elas e o sync é a geração de emissão da div. 232, no app).
 */

/** Onde o voo está. `em-voo-de-novo` = um sync em curso e um "de novo" marcado para quando ele terminar. */
export type EstadoDoVoo = 'ocioso' | 'em-voo' | 'em-voo-de-novo'

/** O estado de quem ainda não pediu nada. */
export const VOO_OCIOSO: EstadoDoVoo = 'ocioso'

/**
 * O que fazer com um pedido: `rodar` (o voo estava ocioso: este pedido É o sync), `marcar` (há um sync em curso: este
 * pedido vira o "de novo") ou `nada` (já há um "de novo" marcado, e ele atende este pedido também).
 */
export type AcaoDoPedido = 'rodar' | 'marcar' | 'nada'

/** O que fazer quando o sync em curso termina: `rodar` o "de novo" (que passa a ser o voo) ou `nada` (o voo acabou). */
export type AcaoDoFim = 'rodar' | 'nada'

/** Um pedido de sync chegou. */
export function pedirVoo(estado: EstadoDoVoo): { estado: EstadoDoVoo; acao: AcaoDoPedido } {
  switch (estado) {
    case 'ocioso':
      return { estado: 'em-voo', acao: 'rodar' }
    case 'em-voo':
      return { estado: 'em-voo-de-novo', acao: 'marcar' }
    case 'em-voo-de-novo':
      return { estado: 'em-voo-de-novo', acao: 'nada' }
  }
}

/**
 * O sync em curso terminou — com sucesso, com falha ou pulado, tanto faz: o voo se libera do mesmo jeito.
 *
 * `cancelarDeNovo` (SY-D17): a sessão que pediu o "de novo" já não é a de agora — ele se solta e não roda. Sem "de
 * novo" marcado, a opção não muda nada.
 *
 * Terminar sem voo em curso é defeito de quem chama (um `terminou` a mais), e a máquina recusa em vez de seguir: um
 * `ocioso` que aceitasse `terminou` esconderia o par desfeito até o dia em que ele deixasse dois syncs em curso.
 */
export function terminouVoo(
  estado: EstadoDoVoo,
  opcoes: { cancelarDeNovo?: boolean } = {},
): { estado: EstadoDoVoo; acao: AcaoDoFim } {
  switch (estado) {
    case 'ocioso':
      throw new Error('terminouVoo: nenhum sync em curso — um terminou sem o pedir que o abriu')
    case 'em-voo':
      return { estado: 'ocioso', acao: 'nada' }
    case 'em-voo-de-novo':
      return opcoes.cancelarDeNovo === true ? { estado: 'ocioso', acao: 'nada' } : { estado: 'em-voo', acao: 'rodar' }
  }
}
