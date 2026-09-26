"use client"

/**
 * I1-PR1 — a LINHA DE AVISO do web: o motivo escrito e, se houver, UMA ação.
 * Mesmo nome e mesma forma de props do nativo
 * (`apps/native/src/screens/LinhaDeAviso.tsx`: `motivo` + `acao`), sem o
 * ícone nem os tokens — a folha do I1 a redesenha depois como uma coisa só.
 * Usada pela tela de login (falha do POST /api/auth/session) e pelo aviso de
 * renovação do provider (`AvisoDeSessao`).
 */
export interface AcaoDoAviso {
  rotulo: string
  onPress: () => void
  inativo?: boolean
}

export interface LinhaDeAvisoProps {
  motivo: string
  acao?: AcaoDoAviso
  className?: string
}

export function LinhaDeAviso({ motivo, acao, className = "" }: LinhaDeAvisoProps) {
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm ${className}`}
    >
      <span>{motivo}</span>
      {acao && (
        <button
          type="button"
          onClick={acao.onPress}
          disabled={acao.inativo}
          className="shrink-0 min-h-[44px] px-3 font-medium underline hover:text-red-900 disabled:opacity-50"
        >
          {acao.rotulo}
        </button>
      )}
    </div>
  )
}
