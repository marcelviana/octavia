/**
 * SY-PR1 (SY-D13) — A LISTA DO QUE DEVE REPROVAR, no molde do gate da quebra (`tests/gates/ql-quebra.test.ts`) e do
 * G-par da N4-PR1. Os cinco gates do SY entram reprovados: cada um mede os seus casos, e o que DEVE reprovar hoje está
 * declarado em `sy-reprovados.txt`, uma checagem por linha, `<gate>:<caso>`. Reprovação fora da lista (`NÃO DECLARADA`)
 * e declaração que passa ou que não existe (`ÓRFÃ`) reprovam o gate (regra 14). Cada PR do SY esvazia a sua parte; com
 * a lista vazia, o gate exige zero reprovações sem mudar o gate.
 *
 * Cada gate imprime o TAMANHO do que mediu (regra 4): quantos casos, quantos passam, quantos reprovam, e a lista.
 *
 * **LISTA VAZIA FIXA (SY-PR4, commit 5; o molde do gate da quebra, QL-PR2, e do G-par, N4-D50).** A PR-4 esvaziou a
 * lista; desde então a lista VAZIA é condição dos cinco gates — qualquer linha em `sy-reprovados.txt` reprova o gate,
 * mesmo a de uma checagem que de fato reprova: reprovação declarada não é mais aceita (`listaNaoVazia`). A não declarada
 * e a órfã continuam impressas, para dizer o que a linha é. Os casos não mudaram.
 *
 * **SY-PR4 — a família.** Um gate pode ter casos em mais de um arquivo: o gate (i) julga os gatilhos em
 * `sy-gatilhos.test.tsx` e os de TELA (S2 em edição, o banner da falha automática — SY-D52, SY-D57) em
 * `sy-gatilhos-telas.test.tsx`, que monta S1, S2 e a L com os duplos de tela. Cada arquivo julga só a sua parte: a
 * família (`tela-`) é o prefixo do caso; o arquivo sem família julga as linhas que não são de família nenhuma. Um caso
 * fora da família do seu arquivo lança — a divisão não pode esconder uma linha.
 */
import fs from 'node:fs'
import path from 'node:path'

export type Gate = 'i' | 'ii' | 'iii' | 'iv' | 'v'
/** `null` = passa; senão, o motivo. */
export type Veredito = string | null

const LISTA = path.resolve(__dirname, 'sy-reprovados.txt')

/** SY-PR4 — as famílias de casos que um arquivo à parte julga, por gate. */
const FAMILIAS: Partial<Record<Gate, string[]>> = { i: ['tela-'] }

function daFamilia(gate: Gate, caso: string, familia: string | null): boolean {
  const familias = FAMILIAS[gate] ?? []
  return familia === null ? !familias.some((f) => caso.startsWith(f)) : caso.startsWith(familia)
}

/** As linhas declaradas deste gate — desta família, ou das que não são de família nenhuma (comentário e linha em branco ignorados). */
export function declarados(gate: Gate, familia: string | null = null): string[] {
  return fs
    .readFileSync(LISTA, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '' && !s.startsWith('#'))
    .filter((s) => s.startsWith(`${gate}:`))
    .filter((s) => daFamilia(gate, s.slice(gate.length + 1), familia))
}

export class Checagens {
  private readonly m = new Map<string, Veredito>()
  private readonly notas = new Map<string, string>()

  constructor(readonly gate: Gate, readonly nome: string, readonly familia: string | null = null) {}

  /** Roda um caso e guarda o veredito. Uma exceção do caso é reprovação, com o motivo. */
  async caso(id: string, f: () => Promise<Veredito>): Promise<Veredito> {
    const chave = `${this.gate}:${id}`
    if (this.m.has(chave)) throw new Error(`caso repetido: ${chave}`)
    if (!daFamilia(this.gate, id, this.familia)) throw new Error(`caso fora da família deste arquivo: ${chave} (família ${this.familia ?? 'nenhuma'})`)
    let v: Veredito
    try {
      v = await f()
    } catch (e) {
      v = `lança: ${e instanceof Error ? e.message : String(e)}`
    }
    this.m.set(chave, v)
    return v
  }

  /** Um número que o caso mediu, para a saída (regra 4). */
  nota(id: string, texto: string): void {
    this.notas.set(`${this.gate}:${id}`, texto)
  }

  /** O veredito do gate: o texto para imprimir, as não declaradas e as órfãs. */
  julgar(): { texto: string; naoDeclaradas: string[]; orfas: string[]; listaNaoVazia: string[]; casos: number } {
    const esperados = declarados(this.gate, this.familia)
    const reprovados = [...this.m].filter(([, v]) => v !== null).map(([k]) => k)
    const naoDeclaradas = reprovados.filter((k) => !esperados.includes(k))
    const orfas = esperados.filter((k) => !this.m.has(k) || this.m.get(k) === null)
    const linhas = [...this.m].map(([k, v]) => {
      const n = this.notas.get(k)
      const marca = v === null ? 'passa  ' : esperados.includes(k) ? 'REPROVA (declarado)' : 'REPROVA'
      return `  ${marca.padEnd(19)} ${k}${n !== undefined ? ` · ${n}` : ''}${v !== null ? `\n        ${v}` : ''}`
    })
    const texto = [
      `gate ${this.gate} (${this.nome}${this.familia !== null ? `, família ${this.familia}` : ''}) — casos ${this.m.size} · passam ${this.m.size - reprovados.length} · reprovam ${reprovados.length}`,
      ...linhas,
      `lista esperada (${esperados.length}) · reprovados (${reprovados.length})`,
      ...naoDeclaradas.map((k) => `  ✗ reprovação NÃO DECLARADA: ${k}`),
      ...orfas.map((k) => `  ✗ declaração ÓRFÃ: ${k} (${this.m.has(k) ? 'passa' : 'não existe no gate'})`),
      ...(esperados.length > 0
        ? [`  ✗ LISTA NÃO VAZIA (${esperados.length}): desde a SY-PR4 (os gatilhos) reprovação declarada não é mais aceita — sy-reprovados.txt tem de estar vazio`]
        : []),
      naoDeclaradas.length + orfas.length + esperados.length === 0
        ? `gate ${this.gate}: zero reprovações, lista vazia (SY-PR4) ✓`
        : `gate ${this.gate}: ✗`,
    ].join('\n')
    return { texto, naoDeclaradas, orfas, listaNaoVazia: esperados, casos: this.m.size }
  }
}
