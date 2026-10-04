/**
 * As frases da folha `5-content-visualizacao` (I1-PR-10; `docs/ux/DESIGN-I1/README-design.md` §5.6 e §5.1; lista
 * declarada da I1-D10, tabela chave · texto · origem em `docs/ux/I1-PR10-anexos/README.md`). Frases novas aprovadas
 * no aval do commit 1 (item 13): o zoom, os valores de reserva da tab, o capo com número e os rótulos de campo.
 * `view.erro.cache` não existe (I1-E15: a cópia no navegador morreu na I1-PR-3).
 * N4-PR3 (N4-D14): o voltar, *Detalhes*, o erro de formato e os rótulos dos campos que o tablet também mostra moram
 * no core (`packages/core/src/frases-content.ts`) e vêm de lá, byte a byte (gate: `tests/gates-web/frases-n4.test.ts`).
 */
import { VOCABULARIO_DE_CONTENT as VC } from "@octavia/core/src/frases-content"
import { DIFICULDADES, FRASES_LISTA, dataCurta, tipoDe } from "@/components/library/frases-lista"

export const FRASES_VIEW = {
  "view.voltar": VC["voltar-biblioteca"],
  "view.editar": "Editar",
  "view.detalhes": VC["detalhes"],
  "view.notas": "Notas de palco",
  "view.notas.vazio": "nenhuma nota de palco — use Editar para escrever",
  "view.tab.capo": "capo: {x}",
  "view.tab.afinacao": "afinação: {x}",
  "view.tab.capo.nenhum": "nenhum",
  "view.tab.capo.casa": "{n}ª casa",
  "view.tab.afinacao.padrao": "padrão (EADGBE)",
  "view.pdf.pagina": "página {n} de {N}",
  "view.pdf.anterior": FRASES_LISTA["lib.paginas.anterior"],
  "view.pdf.proxima": FRASES_LISTA["lib.paginas.proxima"],
  "view.pdf.zoom.menos": "Diminuir o zoom",
  "view.pdf.zoom.mais": "Aumentar o zoom",
  "view.pdf.largura": "Largura",
  "view.pdf.largura.nome": "Ajustar à largura",
  "view.pdf.pagina.ajuste": "Página",
  "view.pdf.pagina.nome": "Ajustar à página",
  "view.pdf.tela-cheia": "Tela cheia",
  "view.pdf.sair": "Sair da tela cheia",
  "view.pdf.carregando": "carregando o PDF…",
  "view.vazio.partitura": "nenhuma partitura",
  "view.vazio.partitura.apoio": "envie um PDF ou uma imagem para ver a partitura",
  "view.vazio.letra": "nenhuma letra",
  "view.vazio.letra.apoio": "escreva a letra para ter no palco",
  "view.vazio.tab": "nenhuma tablatura",
  "view.vazio.cifra": "nenhuma cifra",
  "view.erro.formato": VC["erro-formato"],
  "view.erro.pdf": "não foi possível abrir o PDF — {motivo}",
  "view.erro.pdf.inacessivel": "o arquivo está corrompido ou inacessível",
  "view.erro.pdf.formato": "formato de PDF inválido",
  "view.erro.imagem": "não foi possível abrir o arquivo — {motivo}",
  "view.erro.render": "algo deu errado",
  "motivo.rede": FRASES_LISTA["motivo.rede"],
  // na forma composta (`não foi possível … — {motivo}`) o genérico é o curto, como `forgot.erro` e `lib.erro`
  "motivo.generico": FRASES_LISTA["motivo.generico"],
  "acao.tentar": FRASES_LISTA["acao.tentar"],
  "campo.album": VC["campo-album"],
  "campo.dificuldade": VC["campo-dificuldade"],
  "campo.genero": VC["campo-genero"],
  "campo.tom": VC["campo-tom"],
  "campo.compasso": "compasso",
  "campo.andamento": VC["campo-andamento"],
  "campo.andamento.bpm": VC["campo-andamento-bpm"],
  "campo.etiquetas": VC["campo-etiquetas"],
  "campo.criado": VC["campo-criado"],
  "campo.alterado": VC["campo-alterado"],
} as const

export type ChaveView = keyof typeof FRASES_VIEW

export function fraseCom(chave: ChaveView, dados: Record<string, string>): string {
  return Object.entries(dados).reduce<string>((t, [k, v]) => t.replace(`{${k}}`, v), FRASES_VIEW[chave])
}

/** O rótulo do painel e do subtítulo: o tipo em pt-BR (os quatro de `lib.filtros`, `view.painel`). */
export const rotuloDoTipo = (contentType: string) => tipoDe(contentType).rotulo

/**
 * O motivo do erro do PDF pela ESPÉCIE (I1-E15, div. 735): o pdf.js 4.8.69 a põe no `name`
 * (`docs/ux/I1-PR10-anexos/cn/pdfjs-erros-navegador.txt`). 404 e 5xx → inacessível; corpo inválido → formato;
 * rede (`UnknownErrorException` "Failed to fetch") → sem conexão; o resto → genérico.
 */
export type EspecieDoPdf = "inacessivel" | "formato" | "rede" | "generico"

export function especieDoPdf(erro: unknown): EspecieDoPdf {
  const e = erro as { name?: unknown; message?: unknown } | null
  switch (e?.name) {
    case "MissingPDFException":
    case "UnexpectedResponseException":
      return "inacessivel"
    case "InvalidPDFException":
      return "formato"
    case "UnknownErrorException":
      return /fetch|network/i.test(String(e?.message ?? "")) ? "rede" : "generico"
    default:
      return erro instanceof TypeError ? "rede" : "generico"
  }
}

const MOTIVO_DO_PDF: Record<EspecieDoPdf, string> = {
  inacessivel: FRASES_VIEW["view.erro.pdf.inacessivel"],
  formato: FRASES_VIEW["view.erro.pdf.formato"],
  rede: FRASES_VIEW["motivo.rede"],
  generico: FRASES_VIEW["motivo.generico"],
}

export const fraseDoPdf = (especie: EspecieDoPdf) => fraseCom("view.erro.pdf", { motivo: MOTIVO_DO_PDF[especie] })

/** O capo (div. 748): vazio → *nenhum*; número → *{n}ª casa*; outro texto, como veio. */
export function capoDe(capo: unknown): string {
  if (capo === null || capo === undefined || capo === "" || capo === 0 || capo === "0") return FRASES_VIEW["view.tab.capo.nenhum"]
  const n = Number(capo)
  return Number.isInteger(n) && n > 0 ? fraseCom("view.tab.capo.casa", { n: String(n) }) : String(capo)
}

/** A dificuldade em pt-BR, minúscula como a folha (*avançado*); o valor desconhecido segue como veio. */
export function dificuldadeDe(valor: string): string {
  const d = DIFICULDADES.find((x) => x.valor.toLowerCase() === valor.toLowerCase())
  return d ? d.rotulo.toLocaleLowerCase("pt-BR") : valor
}

export interface CampoDeDetalhe { chave: string; valor: string }

/** Os pares de *Detalhes* (div. 747): um por campo que existe, na ordem de hoje. */
export function camposDe(c: {
  album?: string | null; difficulty?: string | null; genre?: string | null; key?: string | null
  time_signature?: string | null; bpm?: number | null; tags?: string[] | null
  created_at?: string | null; updated_at?: string | null
}): CampoDeDetalhe[] {
  const out: CampoDeDetalhe[] = []
  const par = (chave: ChaveView, valor: string | null | undefined) => { if (valor) out.push({ chave: FRASES_VIEW[chave], valor }) }
  par("campo.album", c.album)
  par("campo.dificuldade", c.difficulty ? dificuldadeDe(c.difficulty) : null)
  par("campo.genero", c.genre)
  par("campo.tom", c.key)
  par("campo.compasso", c.time_signature)
  par("campo.andamento", c.bpm ? fraseCom("campo.andamento.bpm", { x: String(c.bpm) }) : null)
  par("campo.etiquetas", c.tags?.length ? c.tags.join(" · ") : null)
  par("campo.criado", c.created_at ? dataCurta(c.created_at) : null)
  par("campo.alterado", c.updated_at ? dataCurta(c.updated_at) : null)
  return out
}
