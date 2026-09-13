/**
 * `<Icone nome tamanho cor />` — o único componente de ícone do app (V1-PR3,
 * D-V1-1: `react-native-svg`, desenhos próprios do DESIGN-V1 §6).
 *
 * O envelope da família (§6.1) vive aqui, uma vez: viewBox 24, `fill none`,
 * pontas e junções redondas, e o traço DERIVADO do tamanho (20 → 1,5 ·
 * 24 → 1,75 · 28 → 2,0, §5.5) — o traço não é parâmetro.
 *
 * `cor` vai para a prop **`color`** do `<Svg>`, não para `stroke`: é contra
 * ela que o `currentColor` do traço E dos preenchimentos se resolve (R14 /
 * div. 40). Sem `color` o ícone inteiro sai preto — o controle negativo é
 * este mesmo componente sem a prop, e a prova é de tela (pre-check §7.1).
 *
 * O `<Svg>` é desenho, não alvo: quem recebe o toque é o `Pressable` de 64
 * (ou 48) dp que o embrulha — pôr o toque no `<Svg>` de 28 é o modo de
 * reprovar o G5.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { colors, type ThemeName } from '../theme'
import { desenhos, type Desenho, type NomeIcone, type Primitiva } from './dados'

export type TamanhoIcone = 20 | 24 | 28
export type EstadoIcone = 'normal' | 'ativo' | 'inerte'

export interface IconeProps {
  nome: NomeIcone
  tamanho: TamanhoIcone
  /** A tinta do desenho — `text`, `accent`, `lineInfo`… já resolvida pelo tema. */
  cor: string
  estado?: EstadoIcone
  /** Só os dois de duas cores (`parcial`, `baixando`) leem tokens daqui. */
  tema?: ThemeName
}

/** §5.5 — o traço é função do tamanho. */
const TRACO: Record<TamanhoIcone, number> = { 20: 1.5, 24: 1.75, 28: 2 }

function elementos(nome: NomeIcone, tamanho: TamanhoIcone, estado: EstadoIcone): readonly Primitiva[] {
  const d: Desenho = desenhos[nome]
  if (estado === 'ativo' && d.ativo !== undefined) return d.ativo
  if (estado === 'inerte' && d.inerte !== undefined) return d.inerte
  if (tamanho === 20 && d.em20 !== undefined) return d.em20
  return d.normal
}

export function Icone({ nome, tamanho, cor, estado = 'normal', tema = 'dark' }: IconeProps): React.JSX.Element {
  const paleta = colors[tema]
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      color={cor}
      fill="none"
      stroke="currentColor"
      strokeWidth={TRACO[tamanho]}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {elementos(nome, tamanho, estado).map((p, i) => {
        const tinta = p.tinta !== undefined ? paleta[p.tinta] : 'currentColor'
        const pintura =
          p.fill === true
            ? { fill: tinta, fillOpacity: p.alfa, stroke: 'none' as const }
            : { stroke: tinta, strokeWidth: p.traco, strokeDasharray: p.tracejado as number[] | undefined }
        if (p.d !== undefined) return <Path key={i} d={p.d} {...pintura} />
        if (p.r !== undefined) return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} {...pintura} />
        return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} {...pintura} />
      })}
    </Svg>
  )
}
