"use client"

/**
 * Os passos (I1-PR-12; folha `7-upload`, README-design §2.4 "passos"): três chips — `radius.chip`, 13 (o metadado), o
 * número em `font.mono`; o atual com contorno `accentInk` e `accent` a 12 %. O nome acessível do grupo é
 * *passo {n} de 3*. Eram três círculos com ícone e *Upload · Add Details · Complete*.
 */
import { FRASES_UP, fraseUp, type ChaveUp } from "@/components/upload/frases-upload"

const PASSOS: readonly ChaveUp[] = ["up.passo.como", "up.passo.detalhes", "up.passo.pronto"]

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div aria-label={fraseUp("up.passo.nome", { n: currentStep })} className="flex flex-wrap gap-espaco-sm">
      {PASSOS.map((chave, i) => (
        <div key={chave} aria-current={currentStep === i + 1 ? "step" : undefined}
          className={`h-espaco-xxl rounded-raio-chip border-hairline flex items-center gap-espaco-sm px-espaco-md text-tam-web-metadado ${currentStep === i + 1 ? "border-cor-accent-ink bg-cor-marcado text-cor-text" : "border-cor-line text-cor-muted"}`}>
          <div className="font-fam-mono font-peso-mono">{i + 1}</div>
          {FRASES_UP[chave]}
        </div>
      ))}
    </div>
  )
}
