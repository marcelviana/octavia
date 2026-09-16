/**
 * OS GATES DEIXAM DE SÓ MEDIR — div. 129, opção (B) do pre-check da W2.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO CONSERTA
 *
 * `gate:a20` e `gate:icones` são comando de mão. Rodam quando o executor os
 * roda, e o relatório da PR diz que rodaram. A disciplina é real e está medida
 * em todas as PRs — e é **por isso** que a distinção importa: *o gate mede, o
 * gate não IMPEDE*. Nada barrava a entrada na `main` de um commit que os
 * reprovasse; o que barrava era alguém ter rodado e lido.
 *
 * O `ci.yml` roda `pnpm test:unit`, e o projeto `native` do Vitest entra nele
 * desde o W1. Um `it` daqui, portanto, roda no CI, em toda PR, sem ninguém
 * pedir — e um `it` vermelho deixa o job vermelho.
 *
 * ---------------------------------------------------------------------------
 * POR QUE EMBRULHAR E NÃO REESCREVER (opção B, decisão 5 do aval da W2)
 *
 * Nenhum dos dois scripts exporta nada: são script de topo-de-arquivo com
 * `process.exit`. Havia duas formas de trazê-los para a suíte:
 *
 *   (A) reescrevê-los como módulo importável, com um CLI fino por cima;
 *   (B) rodá-los como SUBPROCESSO e afirmar o exit code.
 *
 * (B) não perde nada do que o gate é: nem o exit code próprio, nem a saída
 * legível (capturada e impressa quando reprova), nem o controle negativo como
 * comando separado — `gate:a20:cn` e `gate:icones:cn` continuam existindo. E
 * não troca a VARREDURA DE ARQUIVO por importação, que é o que a div. 53 e a
 * div. 82 proíbem: o instrumento continua lendo arquivo.
 *
 * **O que (B) NÃO dá, e vai escrito porque o item 5 da §10 do W1 o prometia:
 * COBERTURA.** Um subprocesso não instrumenta o processo do Vitest, então
 * `a20.mjs` e `icones.mjs` continuam fora do relatório de cobertura. Quem
 * daria isso é (A) — e (A) é reescrever gate na PR em que ele muda de escopo,
 * que é o que o W1 recusou por princípio, duas vezes. Fica como dívida
 * declarada, não como metade esquecida.
 *
 * ---------------------------------------------------------------------------
 * O CONTROLE NEGATIVO É METADE DO ARQUIVO, E NÃO É ENFEITE
 *
 * Div. 127: *um controle negativo que não reprova pode ser instrumento
 * quebrado*. Cada gate embrulhado vem com o seu CN como `it` irmão — e o CN
 * não afirma só "exit ≠ 0" (um script que estoura no `import` também dá exit
 * ≠ 0): afirma **a contagem de acusações**, que é a prova de que ele reprovou
 * pelo motivo certo.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * A âncora. `apps/native/test/` → três níveis até a raiz do repositório — a
 * MESMA que o `icones.mjs` já usa (`'..','..','..'` a partir de
 * `apps/native/scripts/`). Não se deriva de `process.cwd()`: o Vitest roda da
 * raiz hoje, e um `cwd` diferente amanhã calaria o gate em vez de reprová-lo.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const NATIVO = join(RAIZ, 'apps/native')

interface Saida {
  status: number
  texto: string
}

/** Roda `node <script> <arg>` a partir de `apps/native` e devolve exit + saída. */
function rodar(script: string, arg: string): Saida {
  try {
    const texto = execFileSync(process.execPath, [script, arg], {
      cwd: NATIVO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { status: 0, texto }
  } catch (erro: unknown) {
    const e = erro as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? -1, texto: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

/** `acusações: N` da última linha do relatório do gate. */
function acusacoes(texto: string): number {
  const m = /acusa[çc][õo]es:\s*(\d+)/.exec(texto)
  return m === null ? -1 : Number(m[1])
}

/** Quando o gate reprova, a saída dele é o diagnóstico — imprime, não engole. */
function comSaida(s: Saida): string {
  return `\nexit=${s.status}\n${s.texto}`
}

describe('gate:a20 — nenhum literal de UI em inglês (G4)', () => {
  it('a árvore de trabalho PASSA — exit 0, zero acusações', () => {
    const s = rodar('scripts/a20.mjs', '.')
    expect(s.status, comSaida(s)).toBe(0)
    expect(acusacoes(s.texto), comSaida(s)).toBe(0)
  })

  it('CONTROLE NEGATIVO: o `__cn__` REPROVA — exit 1, 4 acusações', () => {
    const s = rodar('scripts/a20.mjs', 'scripts/__cn__')
    expect(s.status, comSaida(s)).toBe(1)
    expect(acusacoes(s.texto), comSaida(s)).toBe(4)
    expect(s.texto).toContain('"Zoom in"')
  })
})

describe('gate:icones — o mapa contra as duas fontes congeladas', () => {
  it('o mapa real PASSA — exit 0, zero acusações', () => {
    const s = rodar('scripts/icones.mjs', 'src/icones/dados.ts')
    expect(s.status, comSaida(s)).toBe(0)
    expect(acusacoes(s.texto), comSaida(s)).toBe(0)
  })

  it('CONTROLE NEGATIVO: o `IconesFalso` REPROVA — exit 1, 18 acusações', () => {
    const s = rodar('scripts/icones.mjs', 'scripts/__cn__/IconesFalso.ts')
    expect(s.status, comSaida(s)).toBe(1)
    expect(acusacoes(s.texto), comSaida(s)).toBe(18)
  })
})

/**
 * O coletor do G2 — div. 136 e 140.
 *
 * O gate inteiro compara dois refs git e não cabe num `it` (G1 e G2/G3 vão para
 * o CI como JOB, não como teste). O que cabe, e é o que pode apodrecer em
 * silêncio, é o FILTRO: se o `sem-comentario.awk` parar de apagar comentário, o
 * G2 volta a poder reprovar por uma edição de comentário.
 *
 * **Só o G2.** O G3 lê o texto CRU de propósito — div. 83: gate de invariância
 * erra para o lado de falar demais. A razão está no cabeçalho do `g2g3.sh`.
 */
describe('sem-comentario.awk — o filtro do coletor do G2', () => {
  function filtrar(fonte: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'w3-sc-'))
    const arq = join(dir, 'x.tsx')
    writeFileSync(arq, fonte)
    return execFileSync('awk', ['-f', join(NATIVO, 'scripts/sem-comentario.awk'), arq], {
      encoding: 'utf8',
    })
  }

  it('menção em comentário de bloco NÃO sobrevive ao filtro', () => {
    const fora = filtrar('/**\n * menciona testID="falso" e log(`falso`)\n */\nconst a = 1\n')
    expect(fora).not.toContain('testID=')
    expect(fora).not.toContain('log(')
    expect(fora).toContain('const a = 1')
  })

  it('menção em comentário de linha NÃO sobrevive ao filtro', () => {
    const fora = filtrar('// testID="falso" e log(`falso`)\nconst b = 2\n')
    expect(fora).not.toContain('testID=')
    expect(fora).not.toContain('log(')
    expect(fora).toContain('const b = 2')
  })

  it('CONTROLE NEGATIVO: o que é CÓDIGO sobrevive inteiro', () => {
    const fora = filtrar('<Text testID="pagina" /> // um comentário aqui\nlog(`x`)\n')
    expect(fora).toContain('testID="pagina"')
    expect(fora).toContain('log(`x`)')
    expect(fora).not.toContain('um comentário aqui')
  })

  it('a guarda do esquema de URI: `https://…` não é comentário', () => {
    const fora = filtrar("const u = 'https://exemplo/x' // fora\n")
    expect(fora).toContain("'https://exemplo/x'")
    expect(fora).not.toContain('fora')
  })
})
