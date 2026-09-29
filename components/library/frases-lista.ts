/**
 * As frases da folha `4-content-lista` — painel e biblioteca (I1-PR-9;
 * `docs/ux/DESIGN-I1/README-design.md` §5.1 e §5.5; lista declarada da
 * I1-D10/D17, tabela chave · texto · origem em `docs/ux/I1-PR9-anexos/README.md`).
 * Frases novas aprovadas no aval do commit 1 (divs. 706–708): `lib.artista.desconhecido`,
 * os nomes acessíveis do favoritar e os 12 meses da data curta.
 * O motivo da falha sai do `status` que o erro da carga leva (o padrão da I1-PR-6).
 */
import type { NomeIcone } from "@octavia/identidade"
import { ContentType, normalizeContentType } from "@/types/content"

export const FRASES_LISTA = {
  "motivo.rede": "sem conexão",
  "motivo.auth": "o servidor não aceitou a sessão — entre de novo",
  "motivo.limite": "muitas tentativas — tente de novo em instantes",
  "motivo.servidor": "falha no servidor",
  "motivo.generico": "algo deu errado",
  "acao.tentar": "Tentar de novo",
  "acao.cancelar": "Cancelar",
  "dash.titulo": "Painel",
  "dash.adicionar": "Adicionar",
  "dash.abas.geral": "Visão geral",
  "dash.abas.recentes": "Recentes",
  "dash.abas.favoritas": "Favoritas",
  "dash.cont.conteudos": "conteúdos na biblioteca",
  "dash.cont.setlists": "setlists",
  "dash.cont.favoritas": "favoritas",
  "dash.cont.vistas": "vistas há pouco",
  "dash.cont.desconhecido": "—",
  "dash.recentes": "Recentes",
  "dash.favoritas": "Favoritas",
  "dash.vazio.recentes": "nada visto recentemente",
  "dash.vazio.favoritas": "nenhuma favorita",
  "dash.erro": "não foi possível carregar o painel — {motivo}",
  "lib.titulo": "Biblioteca",
  "lib.adicionar": "Adicionar",
  "lib.filtros": "Filtros",
  "lib.filtros.tipo": "tipo",
  "lib.filtros.dificuldade": "dificuldade",
  "lib.filtros.favoritas": "Só as favoritas",
  "lib.ordenar.recent": "Mais recentes",
  "lib.ordenar.title": "Título (A–Z)",
  "lib.ordenar.artist": "Artista (A–Z)",
  "lib.favoritar": "Favoritar",
  "lib.favorita": "Favorita",
  "lib.favoritar.nome": "Favoritar “{título}”",
  "lib.favorita.nome": "Tirar “{título}” das favoritas",
  "lib.mais": "Mais",
  "lib.mais.nome": "Mais ações para “{título}”",
  "lib.menu.abrir": "Abrir",
  "lib.menu.editar": "Editar",
  "lib.menu.apagar": "Apagar",
  "lib.paginas.anterior": "Anterior",
  "lib.paginas.proxima": "Próxima",
  "lib.carregando": "carregando a biblioteca…",
  "lib.vazio": "nenhum conteúdo ainda",
  "lib.vazio.apoio": "adicione a primeira música para começar",
  "lib.vazio.busca": "nada encontrado",
  "lib.vazio.busca.apoio": "mude a busca ou os filtros",
  "lib.erro": "não foi possível carregar a biblioteca — {motivo}",
  // I1-PR-11 (`LIB-salvo`, README-design §5.5): o sucesso de salvar do editor, dito pela biblioteca (decisão 1)
  "edit.salvo": "alterações salvas",
  "lib.apagar.titulo": "Apagar conteúdo",
  "lib.apagar.pergunta": "apagar “{título}”? não dá para desfazer",
  "lib.apagar.confirmar": "Apagar",
  "lib.artista.desconhecido": "artista desconhecido",
} as const

export type ChaveLista = keyof typeof FRASES_LISTA

export function comDado(chave: ChaveLista, dados: Record<string, string>): string {
  return Object.entries(dados).reduce<string>((t, [k, v]) => t.replace(`{${k}}`, v), FRASES_LISTA[chave])
}

/** O tipo do content: o ícone do catálogo e o rótulo pt-BR (os quatro de `lib.filtros`, div. 709). */
export const TIPOS: readonly { valor: ContentType; rotulo: string; icone: NomeIcone }[] = [
  { valor: ContentType.CHORDS, rotulo: "Cifra", icone: "cifra" },
  { valor: ContentType.LYRICS, rotulo: "Letra", icone: "letra" },
  { valor: ContentType.TAB, rotulo: "Tab", icone: "tab" },
  { valor: ContentType.SHEET, rotulo: "Partitura", icone: "partitura" },
]

export function tipoDe(contentType: string): { rotulo: string; icone: NomeIcone } {
  const t = TIPOS.find((x) => x.valor === normalizeContentType(contentType))
  return t ?? { rotulo: "", icone: "tipo-desconhecido" }
}

export const DIFICULDADES: readonly { valor: string; rotulo: string }[] = [
  { valor: "Beginner", rotulo: "Iniciante" },
  { valor: "Intermediate", rotulo: "Intermediário" },
  { valor: "Advanced", rotulo: "Avançado" },
]

/** A data curta da folha (*10 set 2026*, div. 708): dia, mês abreviado da tabela, ano. */
export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const

export function dataCurta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

/** A espécie da falha da carga, pelo `status` que o erro leva; `TypeError` do `fetch` e *timeout* são rede. */
export type EspecieFalha = "rede" | "auth" | "limite" | "servidor"

export function especieDaFalha(erro: unknown): EspecieFalha {
  const status = (erro as { status?: unknown } | null)?.status
  if (typeof status === "number") {
    if (status === 401 || status === 403) return "auth"
    if (status === 429) return "limite"
    return "servidor"
  }
  if (erro instanceof TypeError || (erro as { rede?: boolean } | null)?.rede) return "rede"
  return "servidor"
}

/** A linha da falha: tipo da `LinhaDeAviso` e se há *Tentar de novo* (README-design §3: 401/403 e 429 sem ação). */
export function linhaDaFalha(especie: EspecieFalha): { tipo: "falha" | "rede" | "limite"; motivo: string; tentar: boolean } {
  switch (especie) {
    case "rede": return { tipo: "rede", motivo: FRASES_LISTA["motivo.rede"], tentar: true }
    case "auth": return { tipo: "falha", motivo: FRASES_LISTA["motivo.auth"], tentar: false }
    case "limite": return { tipo: "limite", motivo: FRASES_LISTA["motivo.limite"], tentar: false }
    default: return { tipo: "falha", motivo: FRASES_LISTA["motivo.servidor"], tentar: true }
  }
}
