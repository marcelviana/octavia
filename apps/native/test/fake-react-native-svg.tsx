/**
 * O duplo de `react-native-svg` (N2-PR3), par do `fake-react-native.tsx`.
 *
 * O `Icone.tsx` é o único cliente: ele monta `<Svg>` com `<Path>`, `<Circle>`
 * e `<Rect>`. Aqui viram elementos de DOM com os mesmos atributos, para que um
 * CN possa afirmar QUAL desenho saiu — é como o CN do ícone amputado do `Nova
 * setlist` inativo lê o `d` que foi para a tela, sem depender do aparelho.
 */
import { createElement, type ReactNode } from 'react'

interface P {
  children?: ReactNode
  [k: string]: unknown
}

function el(tag: string, nome: string) {
  const C = (p: P): React.JSX.Element => {
    const attrs: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(p)) {
      if (k === 'children' || v === undefined) continue
      // Os nomes passam INTACTOS: `viewBox`, `strokeWidth`, `strokeLinecap` e
      // `strokeLinejoin` são camelCase no DOM de SVG, e baixá-los faz o React
      // avisar "Invalid DOM property" a cada render (medido na primeira forma
      // disto). O único ajuste é o `strokeDasharray`, que o RN passa como
      // array de números e o DOM quer como string.
      attrs[k] = Array.isArray(v) ? v.join(' ') : v
    }
    return createElement(tag, attrs, p.children)
  }
  C.displayName = nome
  return C
}

export const Path = el('path', 'Path')
export const Circle = el('circle', 'Circle')
export const Rect = el('rect', 'Rect')
export const G = el('g', 'G')
const Svg = el('svg', 'Svg')
export default Svg
