/**
 * As frases da CASCA (I1-PR-9; `docs/ux/DESIGN-I1/README-design.md` §5.5,
 * "Casca"; lista declarada da I1-D10/D17 — a tabela chave · texto · origem está
 * em `docs/ux/I1-PR9-anexos/README.md`). O menu da conta é só *Sair*: *Perfil*
 * saiu com a página (I1-D19) — errata I1-E13.
 */
export const FRASES_CASCA = {
  "casca.marca": "OCTAVIA",
  "casca.marca.nome": "Octavia",
  "casca.painel": "Painel",
  "casca.biblioteca": "Biblioteca",
  "casca.setlists": "Setlists",
  "casca.adicionar": "Adicionar",
  "casca.navegacao": "Navegação",
  "casca.buscar": "Buscar…",
  "casca.conta": "Conta de {nome}",
  "casca.sair": "Sair",
} as const

export type ChaveCasca = keyof typeof FRASES_CASCA

/** As iniciais da conta — a regra do `user-header.tsx` de antes, sem mudança: as de cada palavra do nome, senão a 1ª letra do e-mail. */
export function iniciais(nome: string | null | undefined, email: string | null | undefined): string {
  if (nome) return nome.split(" ").map((n) => n[0]).join("").toUpperCase()
  return email?.charAt(0).toUpperCase() || "U"
}
