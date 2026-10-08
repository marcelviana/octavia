/** Os tipos de `texto-logico.mjs` (o comparador do texto lógico dos três instrumentos, QL-PR1). */
export interface ResultadoDaQuebra {
  ok: boolean
  continuacoes: number
  linhasLogicas: number
  motivo: string | null
}
export function ehQuebraDe(desenho: string[], logico: string): ResultadoDaQuebra
