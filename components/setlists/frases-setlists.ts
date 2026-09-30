/**
 * As frases da folha `8-setlists` (I1-PR-13; `docs/ux/DESIGN-I1/README-design.md` §5.1, §5.9 e §5.10 — N7, N10, N2;
 * lista declarada da I1-D10/D17, tabela chave · texto · origem em `docs/ux/I1-PR13-anexos/README.md` §4).
 * Aprovadas no aval do commit 1 (decisões 6, 9 e 13): a forma da duração, os placeholders do formulário, *Adicionar*
 * sem número, o nome acessível do picker, *Salvando…* no editar, *sem título*, e os reusos da PR-9 (*artista
 * desconhecido*, a data curta, os quatro tipos) e da PR-11 (os motivos com vírgula, a N2).
 */
import { FRASES_EDIT } from "@/components/editors/frases-editor"
import { FRASES_LISTA, MESES, tipoDe } from "@/components/library/frases-lista"
import type { ContentDaLinha, LinhaDaSetlist } from "@/components/setlists/tipos"

export const FRASES_SET = {
  "set.titulo": "Setlists",
  "set.contagem": "{n} setlists",
  "set.contagem.uma": "1 setlist",
  "set.nova": "Nova setlist",
  "set.musicas": "{n} músicas",
  "set.musicas.uma": "1 música",
  "set.duracao.horas": "{h} h {m} min",
  "set.duracao.minutos": "{m} min",
  "set.editar": "Editar",
  "set.editar.nome": "Editar a setlist {nome}",
  "set.apagar.nome": "Apagar a setlist {nome}",
  "set.adicionar": "Adicionar músicas",
  "set.adicionar.curto": "Adicionar",
  "set.adicionar.nome": "Adicionar músicas a {nome}",
  "set.remover": "Remover {título} da setlist",
  "set.carregando": "carregando as setlists…",
  "set.vazio": "nenhuma setlist ainda",
  "set.vazio.apoio": "crie a primeira para organizar as músicas do show",
  "set.vazio.acao": "Criar a primeira setlist",
  "set.erro": "não foi possível carregar as setlists — {motivo}",
  "set.nenhuma": "escolha uma setlist para ver os detalhes",
  "set.form.nova": "Nova setlist",
  "set.form.editar": "Editar setlist",
  "set.form.nome": "Nome",
  "set.form.descricao": "Descrição",
  "set.form.data": "Data do show",
  "set.form.local": "Local",
  "set.form.notas": "Notas",
  "set.form.nome.exemplo": "ex.: acústico no café",
  "set.form.descricao.exemplo": "uma linha sobre esta setlist",
  "set.form.local.exemplo": "ex.: Blue Note",
  "set.form.notas.exemplo": "outras anotações",
  "set.form.criar": "Criar",
  "set.form.criando": "Criando…",
  "set.form.salvar": "Salvar",
  "set.form.salvando": "Salvando…",
  "set.form.sem-nome": "a setlist precisa de um nome",
  "set.erro.criar": "não foi possível criar a setlist — {motivo}",
  "set.erro.salvar": "não foi possível salvar a setlist — {motivo}",
  "set.apagar.titulo": "Apagar setlist",
  "set.apagar.pergunta": "apagar “{nome}”? não dá para desfazer",
  "set.apagar.confirmar": FRASES_LISTA["lib.apagar.confirmar"],
  "set.erro.apagar": "não foi possível apagar a setlist — {motivo}",
  "set.ja-apagada": "esta setlist já foi apagada",
  "set.sem-musicas": "nenhuma música ainda",
  "set.sem-musicas.apoio": "adicione músicas da biblioteca",
  "set.picker.titulo": "Adicionar a {nome}",
  "set.picker.busca": "buscar por título, artista ou tipo",
  "set.picker.todas": "Selecionar todas ({n})",
  "set.picker.ok": "Adicionar {n}",
  "set.picker.ok.nenhuma": "Adicionar",
  "set.picker.ok.nome": "Adicionar {n} músicas a {nome}",
  "set.picker.ok.nome.uma": "Adicionar 1 música a {nome}",
  "set.picker.enviando": "Adicionando…",
  "set.picker.vazio": "nenhuma música disponível",
  "set.picker.vazio.apoio": "adicione músicas à biblioteca primeiro",
  "set.picker.todas-ja": "todas as músicas da biblioteca já estão nesta setlist",
  "set.picker.busca-vazia": "nada encontrado",
  "set.picker.busca-vazia.apoio": "mude a busca",
  "set.erro.adicionar": "não foi possível adicionar as músicas — {motivo}",
  "set.erro.remover": "não foi possível remover “{título}” — {motivo}",
  "lib.erro": FRASES_LISTA["lib.erro"],
  "sem-titulo": "sem título",
  "artista.desconhecido": FRASES_LISTA["lib.artista.desconhecido"],
  "digitado-fica": FRASES_EDIT["digitado-fica"],
  "acao.cancelar": FRASES_LISTA["acao.cancelar"],
  "acao.tentar": FRASES_LISTA["acao.tentar"],
  "motivo.rede": FRASES_EDIT["motivo.rede"],
  "motivo.auth": FRASES_EDIT["motivo.auth"],
  "motivo.limite": FRASES_EDIT["motivo.limite"],
  "motivo.servidor": FRASES_EDIT["motivo.servidor"],
  "motivo.recusado": FRASES_EDIT["motivo.recusado"],
} as const

export type ChaveSet = keyof typeof FRASES_SET

export function fraseSet(chave: ChaveSet, dados: Record<string, string | number> = {}): string {
  return Object.entries(dados).reduce<string>((t, [k, v]) => t.replace(`{${k}}`, String(v)), FRASES_SET[chave])
}

export const contagemDeSetlists = (n: number) => (n === 1 ? FRASES_SET["set.contagem.uma"] : fraseSet("set.contagem", { n }))
export const contagemDeMusicas = (n: number) => (n === 1 ? FRASES_SET["set.musicas.uma"] : fraseSet("set.musicas", { n }))

/** A duração ESTIMADA, a conta de antes: `bpm / 60 × 3` min com BPM, 4 min sem. Sem música não há duração. */
export function duracao(linhas: readonly LinhaDaSetlist[]): string {
  if (linhas.length === 0) return ""
  const minutos = linhas.reduce((t, l) => t + (l.content?.bpm ? (l.content.bpm / 60) * 3 : 4), 0)
  const h = Math.floor(minutos / 60), m = Math.round(minutos % 60)
  return h > 0 ? fraseSet("set.duracao.horas", { h, m }) : fraseSet("set.duracao.minutos", { m })
}

/**
 * A data do show na forma curta da PR-9 (*3 out 2026*). A coluna é uma DATA (`AAAA-MM-DD`), sem hora: lê-se pelo
 * texto — `new Date("2026-10-03")` é meia-noite UTC e, a oeste de Greenwich, cairia no dia anterior.
 */
export function dataDoShow(valor: string | null): string {
  const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor ?? "")
  if (!p) return ""
  const mes = MESES[Number(p[2]) - 1]
  return mes ? `${Number(p[3])} ${mes} ${p[1]}` : ""
}

/**
 * O que a linha mostra (decisão 6 do aval): a rota `GET /api/setlists` preenche o campo vazio com um sentinela em
 * inglês (*Unknown Title* · *Unknown Artist* · *Unknown Type*) — a tela o exibe como *sem título* · *artista
 * desconhecido* · (nada). Só exibição: nenhum dado muda. O content da biblioteca (o picker) traz o campo vazio mesmo.
 */
export function exibir(c: Pick<ContentDaLinha, "title" | "artist" | "content_type">): { titulo: string; artista: string; tipo: string } {
  const vazio = (v: string | null | undefined, sentinela: string) => !v || v === sentinela
  return {
    titulo: vazio(c.title, "Unknown Title") ? FRASES_SET["sem-titulo"] : (c.title as string),
    artista: vazio(c.artist, "Unknown Artist") ? FRASES_SET["artista.desconhecido"] : (c.artist as string),
    tipo: vazio(c.content_type, "Unknown Type") ? "" : tipoDe(c.content_type as string).rotulo,
  }
}
