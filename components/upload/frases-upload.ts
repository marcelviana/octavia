/**
 * As frases da folha `7-upload` (I1-PR-12; `docs/ux/DESIGN-I1/README-design.md` §5.8, §5.1 e as novas N8 e N2 da
 * §5.10; lista declarada da I1-D10 em `docs/ux/I1-PR12-anexos/README.md` §3). Frases novas aprovadas no aval do commit
 * 1 (item 15): o apoio do importar, *{n} músicas encontradas em {arquivo}*, a forma *{nome} · {tamanho}*, os
 * placeholders, a lista com *ou*, os nomes acessíveis do lote. Os VALORES gravados (tom, dificuldade) são os de antes
 * — só o rótulo muda (o `POST` não muda, I1-D9).
 *
 * O limite (I1-D29): `LIMITE_MIB` é o número que o TEXTO cita; quem cobra é o servidor (`lib/api-schemas.ts`,
 * `storageSchemas.upload.size`). O `components/upload/__tests__/limite.test.ts` lê o máximo do schema e reprova se os
 * dois divergirem — o texto não mente de novo.
 */
import { FRASES_EDIT, type Opcao } from "@/components/editors/frases-editor"
import { FRASES_CASCA } from "@/components/identidade/frases-casca"

export const LIMITE_MIB = 4

export const FRASES_UP = {
  "up.titulo": FRASES_CASCA["casca.adicionar"],
  "up.passo.como": "como",
  "up.passo.detalhes": "detalhes",
  "up.passo.pronto": "pronto",
  "up.passo.nome": "passo {n} de 3",
  "up.como": "como você quer adicionar?",
  "up.criar": "Criar do zero",
  "up.criar.apoio": "escreva no editor",
  "up.importar": "Importar de arquivo",
  "up.importar.apoio": "PDF, DOCX, TXT ou imagem",
  "up.tipo": "tipo de conteúdo",
  "up.importar.tipo": "importar",
  "up.importar.um": "Um arquivo",
  "up.importar.varias": "Várias músicas num arquivo",
  "up.zona": "arraste o arquivo para cá",
  "up.escolher": "Escolher arquivo",
  "up.escolher.nome": "Escolher o arquivo de música",
  "up.formatos": "formatos: {lista} · até {n} MiB",
  "up.enviando": "enviando o arquivo…",
  "up.arquivo": "{nome} · {tamanho}",
  "up.extensao": "tipo de arquivo não aceito: {nome} — use {lista}",
  "up.limite": "o arquivo passa de {n} MiB — escolha um menor",
  "up.erro.envio": "o arquivo não foi enviado — {motivo}",
  "up.meta.titulo": "Título *",
  "up.meta.titulo.exemplo": "título da música",
  "up.meta.artista": "Artista *",
  "up.meta.artista.exemplo": "nome do artista",
  "up.meta.album": "Álbum",
  "up.meta.album.exemplo": "nome do álbum",
  "up.meta.genero": "Gênero",
  "up.meta.genero.exemplo": "gênero",
  "up.meta.ano": "Ano",
  "up.meta.ano.exemplo": "ano",
  "up.meta.notas": "Notas",
  "up.meta.notas.exemplo": "notas ou comentários",
  "up.meta.avancadas": "Opções avançadas",
  "up.meta.salvar": "Salvar",
  "up.meta.salvando": "Salvando…",
  "up.meta.obrigatorios": "título e artista são obrigatórios",
  "up.erro.salvar": "não foi possível salvar — {motivo}",
  "up.criar.titulo": "Título",
  "up.proximo": "Próximo",
  "up.titulo-obrigatorio": "o título é obrigatório",
  "up.lote.encontradas": "{n} músicas encontradas em {arquivo}",
  "up.lote.encontrada": "1 música encontrada em {arquivo}",
  "up.lote.artista.exemplo": "artista",
  "up.lote.incluir": "Incluir “{titulo}”",
  "up.lote.titulo": "título da música {n}",
  "up.lote.artista": "artista de “{titulo}”",
  "up.lote.corpo": "corpo de “{titulo}”",
  "up.lote.importar": "Importar todas",
  "up.lote.importando": "Importando…",
  "up.lote.erro": "não foi possível importar as músicas — {motivo}",
  "up.lote.vazio": "nenhuma música encontrada no arquivo",
  "up.lote.ler": "não foi possível ler o arquivo",
  "up.lote.ok": "{n} músicas importadas",
  "up.lote.ok.uma": "1 música importada",
  "up.pronto": "pronto",
  "up.pronto.apoio": "“{titulo}”, de {artista}, está na biblioteca",
  "up.ir-biblioteca": "Ir para a biblioteca",
  // as Opções avançadas abertas (sem desenho na folha): os rótulos da §5.7, aprovados na I1-PR-11
  "up.av.tom": FRASES_EDIT["edit.meta.tom"],
  "up.av.bpm": FRASES_EDIT["edit.meta.bpm"],
  "up.av.dificuldade": FRASES_EDIT["edit.meta.dificuldade"],
  "up.av.capo": FRASES_EDIT["edit.cifra.capo"],
  "up.av.capo.exemplo": FRASES_EDIT["edit.capo.casa"],
  "up.av.afinacao": FRASES_EDIT["edit.tab.afinacao"],
  "up.av.compasso": FRASES_EDIT["edit.meta.compasso"],
  "up.av.favorita": FRASES_EDIT["edit.meta.favorita"],
  "up.av.escolha": FRASES_EDIT["edit.meta.escolha"],
  "digitado-fica": FRASES_EDIT["digitado-fica"],
  "estado.carregando": FRASES_EDIT["estado.carregando"],
  "acao.voltar": FRASES_EDIT["acao.voltar"],
  "acao.cancelar": "Cancelar",
  "acao.tentar": FRASES_EDIT["acao.tentar"],
  "motivo.rede": FRASES_EDIT["motivo.rede"],
  "motivo.auth": FRASES_EDIT["motivo.auth"],
  "motivo.limite": FRASES_EDIT["motivo.limite"],
  "motivo.servidor": FRASES_EDIT["motivo.servidor"],
  "motivo.recusado": FRASES_EDIT["motivo.recusado"],
} as const

export type ChaveUp = keyof typeof FRASES_UP

export function fraseUp(chave: ChaveUp, dados: Record<string, string | number> = {}): string {
  return Object.entries(dados).reduce<string>((t, [k, v]) => t.replace(`{${k}}`, String(v)), FRASES_UP[chave])
}

/** As extensões que o CLIENTE aceita — as de antes (`FileUploadZone.tsx`): a partitura, PDF ou imagem; o resto, texto. */
export const EXTENSOES_PARTITURA: readonly string[] = [".pdf", ".png", ".jpg", ".jpeg"]
export const EXTENSOES_TEXTO: readonly string[] = [".pdf", ".docx", ".txt"]

/** *.pdf, .docx, .txt* (a linha dos formatos) ou *.pdf, .docx ou .txt* (o *use …* da extensão recusada). */
export function listaDeExtensoes(extensoes: readonly string[], comOu = false): string {
  if (!comOu || extensoes.length < 2) return extensoes.join(", ")
  return `${extensoes.slice(0, -1).join(", ")} ou ${extensoes[extensoes.length - 1]}`
}

const UM_KIB = 1024
const UM_MIB = 1024 * 1024
const comVirgula = (n: number) => n.toFixed(1).replace(".", ",")
/** O tamanho como a folha o escreve (*1,8 MiB*: uma casa, vírgula); abaixo de 0,1 MiB, em KiB; abaixo de 1 KiB, em B. */
export function tamanhoDoArquivo(bytes: number): string {
  if (bytes < UM_KIB) return `${bytes} B`
  if (bytes < UM_MIB / 10) return `${comVirgula(bytes / UM_KIB)} KiB`
  return `${comVirgula(bytes / UM_MIB)} MiB`
}

export const linhaDoArquivo = (nome: string, bytes: number) => fraseUp("up.arquivo", { nome, tamanho: tamanhoDoArquivo(bytes) })
export const musicasEncontradas = (n: number, arquivo: string) => fraseUp(n === 1 ? "up.lote.encontrada" : "up.lote.encontradas", { n, arquivo })
export const musicasImportadas = (n: number) => fraseUp(n === 1 ? "up.lote.ok.uma" : "up.lote.ok", { n })

/** Os 12 tons de antes (`AdvancedMetadataFields.tsx`), na notação de cifra (I1-E20): valor = rótulo. */
export const TONS_UP: readonly Opcao[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((x) => ({ valor: x, rotulo: x }))
