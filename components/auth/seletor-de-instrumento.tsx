/**
 * "Instrumento principal" do `/signup` (folha `1-auth`, `AUTH-signup`): o campo
 * de 60 com o valor e o "▾" em `font.mono` · `size.labelSmall` · `muted`. É um
 * `<select>` nativo — o `Select` do shadcn saiu (decisão 3: arquivo redesenhado
 * não importa `@/components/ui/*`). Os VALORES são os de hoje (`guitar` …
 * `other`: é o que vai para o perfil, I1-D9); os rótulos, os da §5.2. Começa vazio,
 * como o Radix de antes (sem instrumento escolhido o cadastro segue igual).
 */
import { FRASES_AUTH } from "./frases-auth"

const INSTRUMENTOS = [
  ["guitar", "Violão/Guitarra"],
  ["piano", "Piano"],
  ["violin", "Violino"],
  ["drums", "Bateria"],
  ["vocals", "Voz"],
  ["bass", "Baixo"],
  ["other", "Outro"],
] as const

export function SeletorDeInstrumento({ valor, onMudar }: { valor: string; onMudar: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-espaco-sm">
      <div className="flex justify-between items-baseline gap-espaco-md">
        <label htmlFor="primaryInstrument" className="text-tam-label text-cor-muted">{FRASES_AUTH["signup.instrumento"]}</label>
      </div>
      <div
        data-testid="campo-instrumento"
        className="relative h-web-campo-auth rounded-raio-control border-hairline border-cor-line-info flex items-center gap-espaco-md px-espaco-lg focus-within:border-cor-accent-ink"
      >
        <select
          id="primaryInstrument"
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          className="flex-1 min-w-0 appearance-none bg-transparent text-tam-input text-cor-text outline-none"
        >
          <option value="" />
          {INSTRUMENTOS.map(([v, rotulo]) => (
            <option key={v} value={v} className="bg-cor-bg">{rotulo}</option>
          ))}
        </select>
        <span aria-hidden="true" className="font-fam-mono font-peso-mono text-tam-label-small text-cor-muted">▾</span>
      </div>
    </div>
  )
}
