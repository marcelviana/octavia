/**
 * SY-PR1 (SY-D13) — A LISTA DO QUE DEVE REPROVAR, no molde do gate da quebra (`tests/gates/ql-quebra.test.ts`) e do
 * G-par da N4-PR1. Os cinco gates do SY entram reprovados: cada um mede os seus casos, e o que DEVE reprovar hoje está
 * declarado em `sy-reprovados.txt`, uma checagem por linha, `<gate>:<caso>`. Reprovação fora da lista (`NÃO DECLARADA`)
 * e declaração que passa ou que não existe (`ÓRFÃ`) reprovam o gate (regra 14). Cada PR do SY esvazia a sua parte; com
 * a lista vazia, o gate exige zero reprovações sem mudar o gate.
 *
 * Cada gate imprime o TAMANHO do que mediu (regra 4): quantos casos, quantos passam, quantos reprovam, e a lista.
 */
import fs from 'node:fs'
import path from 'node:path'

export type Gate = 'i' | 'ii' | 'iii' | 'iv' | 'v'
/** `null` = passa; senão, o motivo. */
export type Veredito = string | null

const LISTA = path.resolve(__dirname, 'sy-reprovados.txt')

/** As linhas declaradas deste gate (comentário e linha em branco ignorados). */
export function declarados(gate: Gate): string[] {
  return fs
    .readFileSync(LISTA, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '' && !s.startsWith('#'))
    .filter((s) => s.startsWith(`${gate}:`))
}

export class Checagens {
  private readonly m = new Map<string, Veredito>()
  private readonly notas = new Map<string, string>()

  constructor(readonly gate: Gate, readonly nome: string) {}

  /** Roda um caso e guarda o veredito. Uma exceção do caso é reprovação, com o motivo. */
  async caso(id: string, f: () => Promise<Veredito>): Promise<Veredito> {
    const chave = `${this.gate}:${id}`
    if (this.m.has(chave)) throw new Error(`caso repetido: ${chave}`)
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
  julgar(): { texto: string; naoDeclaradas: string[]; orfas: string[]; casos: number } {
    const esperados = declarados(this.gate)
    const reprovados = [...this.m].filter(([, v]) => v !== null).map(([k]) => k)
    const naoDeclaradas = reprovados.filter((k) => !esperados.includes(k))
    const orfas = esperados.filter((k) => !this.m.has(k) || this.m.get(k) === null)
    const linhas = [...this.m].map(([k, v]) => {
      const n = this.notas.get(k)
      const marca = v === null ? 'passa  ' : esperados.includes(k) ? 'REPROVA (declarado)' : 'REPROVA'
      return `  ${marca.padEnd(19)} ${k}${n !== undefined ? ` · ${n}` : ''}${v !== null ? `\n        ${v}` : ''}`
    })
    const texto = [
      `gate ${this.gate} (${this.nome}) — casos ${this.m.size} · passam ${this.m.size - reprovados.length} · reprovam ${reprovados.length}`,
      ...linhas,
      `lista esperada (${esperados.length}) · reprovados (${reprovados.length})`,
      ...naoDeclaradas.map((k) => `  ✗ reprovação NÃO DECLARADA: ${k}`),
      ...orfas.map((k) => `  ✗ declaração ÓRFÃ: ${k} (${this.m.has(k) ? 'passa' : 'não existe no gate'})`),
      naoDeclaradas.length + orfas.length === 0
        ? `gate ${this.gate}: reprova exatamente a lista esperada (${esperados.length}) ✓`
        : `gate ${this.gate}: ✗`,
    ].join('\n')
    return { texto, naoDeclaradas, orfas, casos: this.m.size }
  }
}
