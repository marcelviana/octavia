/**
 * As frases da folha `6-content-editor` (I1-PR-11; `docs/ux/DESIGN-I1/README-design.md` §5.7, §5.1 e as novas N2, N6,
 * N12 da §5.10; lista declarada da I1-D10 em `docs/ux/I1-PR11-anexos/README.md` §3). Frases novas aprovadas no aval do
 * commit 1 (item 12): os placeholders, a forma da prévia, *este conteúdo não existe mais*, os nomes acessíveis de
 * remover/duplicar/tag, os 16 gêneros e *Especialista*. Os VALORES gravados (afinação, gênero, dificuldade, tom) são
 * os de antes — só o rótulo muda (o corpo do `PUT` não muda, I1-D9).
 */
import { DIFICULDADES, FRASES_LISTA } from "@/components/library/frases-lista"

export const FRASES_EDIT = {
  "edit.nao-salvo": "alterações não salvas",
  "edit.salvar": "Salvar",
  "edit.salvando": "Salvando…",
  "edit.nada-mudou": "nada mudou desde que você abriu",
  "edit.voltar": "Voltar sem salvar",
  "edit.carregando": "carregando o conteúdo…",
  "edit.carregando.editor": "carregando o editor…",
  "edit.erro.carregar": "não foi possível carregar o conteúdo — {motivo}",
  "edit.nao-existe": "este conteúdo não existe",
  "edit.ir-biblioteca": "Ir para a biblioteca",
  "edit.erro.salvar": "não foi possível salvar — {motivo}",
  "edit.nao-existe-mais": "este conteúdo não existe mais",
  "digitado-fica": "o que você escreveu continua aqui",
  "edit.cifra.informacoes": "Informações",
  "edit.cifra.titulo": "Título",
  "edit.cifra.artista": "Artista",
  "edit.cifra.tom": "Tom",
  "edit.cifra.capo": "Capo",
  "edit.cifra.bpm": "BPM",
  "edit.cifra.acordes": "Acordes rápidos",
  "edit.cifra.secoes": "Seções",
  "edit.cifra.adicionar-secao": "Adicionar seção",
  "edit.cifra.remover-secao": "Remover seção",
  "edit.cifra.nome-secao": "Nome da seção",
  "edit.cifra.nome-secao.exemplo": "ex.: Verso 1, Refrão",
  "edit.cifra.progressao": "Progressão",
  "edit.cifra.letra-secao": "Letra da seção",
  "edit.cifra.previa": "Prévia",
  "edit.previa.tom": "tom: {x}",
  "edit.previa.capo": "capo: {x}",
  "edit.previa.bpm": "BPM: {x}",
  "edit.previa.afinacao": "afinação: {x}",
  "edit.capo.casa": "casa",
  "edit.tab.afinacao": "Afinação",
  "edit.tab.tablatura": "Tablatura",
  "edit.letra": "Letra",
  "edit.letra.placeholder": "escreva a letra — use [Verso 1], [Refrão]… para marcar as seções",
  "edit.meta.detalhes": "Detalhes",
  "edit.meta.basico": "Básico",
  "edit.meta.musica": "Música",
  "edit.meta.organizacao": "Organização",
  "edit.meta.titulo": "Título *",
  "edit.meta.artista": "Artista",
  "edit.meta.album": "Álbum",
  "edit.meta.album.exemplo": "álbum ou coleção",
  "edit.meta.genero": "Gênero",
  "edit.meta.genero.escolha": "escolha o gênero",
  "edit.meta.tom": "Tom",
  "edit.meta.bpm": "BPM",
  "edit.meta.compasso": "Compasso",
  "edit.meta.dificuldade": "Dificuldade",
  "edit.meta.escolha": "escolha",
  "edit.meta.tags": "Tags",
  "edit.meta.tags.exemplo": "adicionar tag",
  "edit.meta.tags.adicionar": "Adicionar tag",
  "edit.meta.tags.tirar": "Tirar a tag “{x}”",
  "edit.meta.notas": "Notas",
  "edit.meta.notas.exemplo": "notas sobre este conteúdo",
  "edit.meta.favorita": "Favorita",
  "edit.meta.publica": "Pública (dá para compartilhar)",
  "estado.carregando": "carregando…",
  "acao.voltar": "Voltar",
  "acao.tentar": FRASES_LISTA["acao.tentar"],
  "motivo.rede": FRASES_LISTA["motivo.rede"],
  // decisão 11 do aval: dentro de "não foi possível … — {motivo}" o motivo com travessão o troca por vírgula (a folha)
  "motivo.auth": "o servidor não aceitou a sessão, entre de novo",
  "motivo.limite": "muitas tentativas, tente de novo em instantes",
  "motivo.servidor": FRASES_LISTA["motivo.servidor"],
  "motivo.recusado": "o servidor recusou os dados",
} as const

export type ChaveEdit = keyof typeof FRASES_EDIT

export function fraseEdit(chave: ChaveEdit, dados: Record<string, string> = {}): string {
  return Object.entries(dados).reduce<string>((t, [k, v]) => t.replace(`{${k}}`, v), FRASES_EDIT[chave])
}

/** Opção de lista: o valor gravado (o de antes) e o rótulo pt-BR. */
export interface Opcao { valor: string; rotulo: string }

/** Os 16 gêneros de antes (`unified-metadata-editor.tsx`), valores iguais, rótulos pt-BR (div. 783). */
export const GENEROS: readonly Opcao[] = [
  { valor: "Rock", rotulo: "Rock" }, { valor: "Pop", rotulo: "Pop" }, { valor: "Jazz", rotulo: "Jazz" },
  { valor: "Classical", rotulo: "Clássica" }, { valor: "Blues", rotulo: "Blues" }, { valor: "Country", rotulo: "Country" },
  { valor: "Folk", rotulo: "Folk" }, { valor: "Metal", rotulo: "Metal" }, { valor: "Punk", rotulo: "Punk" },
  { valor: "Alternative", rotulo: "Alternativa" }, { valor: "Indie", rotulo: "Indie" }, { valor: "Electronic", rotulo: "Eletrônica" },
  { valor: "Hip Hop", rotulo: "Hip Hop" }, { valor: "R&B", rotulo: "R&B" }, { valor: "Reggae", rotulo: "Reggae" },
  { valor: "Other", rotulo: "Outro" },
]

/** As dificuldades de antes: as três da lista (PR-9) + *Especialista* (`"Expert"`, que o schema aceita). */
export const DIFICULDADES_EDIT: readonly Opcao[] = [...DIFICULDADES, { valor: "Expert", rotulo: "Especialista" }]

/** As afinações de antes (`tab-editor.tsx`), valores iguais, rótulos da §5.7. */
export const AFINACOES: readonly Opcao[] = [
  { valor: "Standard (EADGBE)", rotulo: "Padrão (EADGBE)" },
  { valor: "Drop D (DADGBE)", rotulo: "Drop D (DADGBE)" },
  { valor: "Open G (DGDGBD)", rotulo: "Sol aberto (DGDGBD)" },
  { valor: "DADGAD", rotulo: "DADGAD" },
]

const opcoes = (xs: readonly string[]): Opcao[] => xs.map((x) => ({ valor: x, rotulo: x }))

/** Os 38 tons de antes, na notação de cifra (decisão 9: o valor como é gravado). */
export const TONS: readonly Opcao[] = opcoes(["C", "Cm", "C#", "C#m", "Db", "Dbm", "D", "Dm", "D#", "D#m", "Eb", "Ebm", "E", "Em", "Fb", "Fbm",
  "F", "Fm", "F#", "F#m", "Gb", "Gbm", "G", "Gm", "G#", "G#m", "Ab", "Abm", "A", "Am", "A#", "A#m", "Bb", "Bbm", "B", "Bm", "Cb", "Cbm"])

/** Os compassos de antes. */
export const COMPASSOS: readonly Opcao[] = opcoes(["4/4", "3/4", "2/4", "6/8", "12/8"])

/**
 * Os acordes rápidos de antes (decisão 8: o CONJUNTO de hoje — C G Am F D Em A E Dm B7). A ORDEM de exibição é a da
 * folha para os seis que ela também tem (C Dm Em F G Am) e, depois, os quatro de hoje que ela não tem: é desenho — o
 * botão insere o mesmo acorde (div. 792).
 */
export const ACORDES_RAPIDOS: readonly string[] = ["C", "Dm", "Em", "F", "G", "Am", "D", "A", "E", "B7"]

export const rotuloDe = (lista: readonly Opcao[], valor: string) => lista.find((o) => o.valor === valor)?.rotulo ?? valor
