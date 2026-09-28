/**
 * Os controles da folha `1-auth` (README-design §2.4): o campo (`web.campoAuth` =
 * touch.list + 4, `radius.control`, borda `lineInfo` e `errorInk` no erro,
 * respiro `space.lg`, vão `space.md`, `size.input`), a validação sob o campo
 * (falha 20 · `errorInk` · `size.label`), o botão principal (`touch.list`, fundo
 * `text`, rótulo `bg`, `font.uiBold` · `size.button`; inativo: contorno
 * `lineInfo`, rótulo `muted`), o secundário (`web.botaoAuth` = touch.list + 2,
 * contorno `lineInfo`, `size.bodySmall`) e a marca do Google (asset de terceiro
 * 20 × 20; sem o asset, o quadrado tracejado da folha — div. 636).
 */
import { Icone } from "@/components/identidade/icone"
import { BOTAO_PRINCIPAL as PRINCIPAL, BOTAO_SECUNDARIO as SECUNDARIO } from "@/components/identidade/link-botao"
import type { NomeIcone } from "@octavia/identidade"
import { FRASES_AUTH } from "./frases-auth"

export function Validacao({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-espaco-md">
      <Icone nome="falha" tamanho={20} className="text-cor-error-ink" />
      <p className="text-tam-label leading-web-entrelinha-aviso text-cor-error-ink">{texto}</p>
    </div>
  )
}

export interface CampoAuthProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string
  rotulo: string
  testid: string
  icone?: NomeIcone
  acessorio?: React.ReactNode
  dica?: string
  erro?: string
}

export function CampoAuth({ id, rotulo, testid, icone, acessorio, dica, erro, ...input }: CampoAuthProps) {
  return (
    <div className="flex flex-col gap-espaco-sm">
      <div className="flex justify-between items-baseline gap-espaco-md">
        <label htmlFor={id} className="text-tam-label text-cor-muted">{rotulo}</label>
        {acessorio}
      </div>
      <div
        data-testid={testid}
        className={`h-web-campo-auth rounded-raio-control border-hairline flex items-center gap-espaco-md px-espaco-lg focus-within:border-cor-accent-ink ${erro ? "border-cor-error-ink" : "border-cor-line-info"}`}
      >
        {icone && <Icone nome={icone} tamanho={20} className="text-cor-line-info" />}
        <input
          id={id}
          aria-invalid={erro ? true : undefined}
          className="flex-1 min-w-0 bg-transparent text-tam-input text-cor-text placeholder:text-cor-muted outline-none"
          {...input}
        />
      </div>
      {dica && <p className="text-tam-label text-cor-muted">{dica}</p>}
      {erro && <Validacao texto={erro} />}
    </div>
  )
}

interface BotaoProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  icone?: NomeIcone
  carregando?: boolean
}

export function BotaoPrincipal({ icone, carregando, children, ...botao }: BotaoProps) {
  const ativo = !carregando
  return (
    <button {...botao} className={`${PRINCIPAL} ${ativo ? "bg-cor-text border-cor-text text-cor-bg" : "bg-transparent border-cor-line-info text-cor-muted"}`}>
      {icone && <Icone nome={icone} tamanho={24} />}
      {children}
    </button>
  )
}

export function BotaoSecundario({ icone, carregando, children, ...botao }: BotaoProps) {
  return (
    <button {...botao} className={`${SECUNDARIO} ${carregando ? "text-cor-muted" : "text-cor-text"}`}>
      {icone && <Icone nome={icone} tamanho={24} />}
      {children}
    </button>
  )
}

/** A marca do Google (20 × 20). Sem `public/marcas/google.svg`, o quadrado tracejado da folha (div. 636). */
export function MarcaGoogle() {
  return (
    <svg role="img" aria-label={FRASES_AUTH["marca.google"]} width={20} height={20} viewBox="0 0 20 20" className="shrink-0 text-cor-line-info">
      <rect x="0.5" y="0.5" width="19" height="19" rx="6" fill="none" stroke="currentColor" strokeDasharray="2 2" />
    </svg>
  )
}
