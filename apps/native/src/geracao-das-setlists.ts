/**
 * **A ORDEM DE EMISSÃO do `GET /api/setlists`** — a regra da div. 232, compartilhada pelo sync e pelas releituras das
 * escritas de setlist desde a SY-PR2 (SY-D25; `docs/native/SY-PRECHECK.md` A5).
 *
 * A div. 232 (N2-PR2) nasceu no `escrita.ts`: duas releituras podem voar ao mesmo tempo, a ordem de CHEGADA não é a de
 * EMISSÃO, e a que foi emitida antes carrega a foto mais velha — ela não pode gravar por cima da mais nova. O sync tem
 * a mesma corrida com elas: o `GET /api/setlists` dele é lido no começo, e uma escrita no meio do sync relê e grava a
 * lista nova; sem a ordem, o sync terminava e gravava por cima as setlists de ANTES da escrita (`SY-PRECHECK.md` A5).
 * Com o contador num lugar só, as duas leituras disputam pela mesma regra: **um 200 só se aplica se nenhuma leitura
 * emitida depois dele já tiver aplicado**. O sync que perde aplica o CONTEÚDO e não as setlists (SY-D25); a releitura
 * que perde não grava nada (como sempre).
 *
 * Estado de MÓDULO, como era no `escrita.ts`: a ordem é do app, não de uma tela. Nenhuma linha de log mora aqui — o
 * descarte se vê pelas linhas que já existem (a errata N2-PR2 do `LOGS-OCTAVIA.md`: a leitura que perdeu não emite a
 * `cache write kind=setlists`).
 */

/** O número da última leitura emitida, e o da última que aplicou. */
let geracao = 0
let ultimaAplicada = 0

/** Antes de emitir um `GET /api/setlists`: o número desta leitura, na ordem de emissão. */
export function emitirLeituraDeSetlists(): number {
  geracao += 1
  return geracao
}

/**
 * Na hora de aplicar o 200: esta leitura ainda vale? `false` quando uma leitura emitida DEPOIS dela já aplicou (a foto
 * desta é mais velha e não vence); `true` a marca como a última aplicada. Quem chama não pode ter `await` entre esta
 * pergunta e a gravação — senão outra leitura aplicaria no meio.
 */
export function aplicarLeituraDeSetlists(minha: number): boolean {
  if (minha < ultimaAplicada) return false
  ultimaAplicada = minha
  return true
}

/** Instrumento de teste (o `limparGatesDeEscrita` o chama): o contador volta ao começo. Nenhuma UI chama. */
export function limparGeracaoDasSetlists(): void {
  geracao = 0
  ultimaAplicada = 0
}
