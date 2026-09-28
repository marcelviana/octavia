/**
 * `<Icone nome tamanho />` do web (I1-PR-6) — o par do `apps/native/src/icones/Icone.tsx`:
 * desenha `desenhos[nome]` de `@octavia/identidade` com o envelope da família
 * (viewBox 24, `fill none`, pontas e junções redondas, traço DERIVADO do
 * tamanho por `TRACO`: 20 → 1,5 · 24 → 1,75 · 28 → 2). A cor é a do texto
 * (`currentColor`): quem usa dá a tinta por classe de token (`text-cor-*`).
 * É desenho, não alvo: `aria-hidden`; o nome acessível é do controle que o contém.
 */
import { desenhos, TRACO, type Desenho, type NomeIcone, type Primitiva, type TamanhoIcone } from "@octavia/identidade"

export interface IconeProps {
  nome: NomeIcone
  tamanho: TamanhoIcone
  className?: string
}

function Forma({ p, traco }: { p: Primitiva; traco: number }) {
  const comum = {
    fill: p.fill ? "currentColor" : "none",
    fillOpacity: p.alfa,
    strokeWidth: p.traco ?? traco,
    strokeDasharray: p.tracejado?.join(" "),
  }
  if (p.d !== undefined) return <path d={p.d} {...comum} />
  if (p.r !== undefined) return <circle cx={p.cx} cy={p.cy} r={p.r} {...comum} />
  return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} {...comum} />
}

export function Icone({ nome, tamanho, className = "" }: IconeProps) {
  const d: Desenho = desenhos[nome]
  const formas = tamanho === 20 && d.em20 !== undefined ? d.em20 : d.normal
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {formas.map((p, i) => (
        <Forma key={i} p={p} traco={TRACO[tamanho]} />
      ))}
    </svg>
  )
}
