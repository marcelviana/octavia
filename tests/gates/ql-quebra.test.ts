/**
 * Gate da QUEBRA DE LINHA — bloco QL, PR-1 (QL-D7, QL-D19; `docs/native/QL-REQUISITOS.md` A-QL-1, A-QL-2, A-QL-3;
 * regra 30: o gate vem antes do que ele mede). Vitest sobre a função do core (`packages/core/src/quebra.ts`), no projeto
 * `web` como o G-par da N4-PR1 — o `tsconfig` do core não tem os tipos de Node (`"types": []`) para ler a fixture.
 *
 * Três gates sobre os casos de `packages/core/fixtures/ql-quebra.json` (texto do projeto, `QL-BRIEF.md` §5):
 *
 *   (i)   AS REGRAS DO CORTE (A-QL-1): as linhas visuais (o `texto` de cada uma) iguais às da moldura da folha congelada
 *         (`DESIGN-QL/telas.html`) ou, onde a folha não tem o caso, às derivadas de R1–R4 — a Letra, o par da Cifra, a
 *         progressão, a quase acorde, o par só na Cifra e a Tab intacta, em 80, 55, 48, 26 e 14 colunas;
 *   (ii)  A INVARIÂNCIA (A-QL-2), em TODO caso: o que o contrato de `quebra.ts` garante — cada linha visual é o recuo mais
 *         uma fatia da linha lógica; `continuacao` ⇔ `inicio > 0`; toda linha lógica aparece, em ordem; os pedaços não se
 *         sobrepõem e só há espaço fora deles — e então a JUNÇÃO (cada pedaço no seu `inicio`, o que falta preenchido
 *         com espaço) devolve o texto lógico byte a byte;
 *   (iii) A MEDIDA (A-QL-3, QL-D24): o `\t` até a próxima coluna múltipla de 8, o `\r` do fim e o acento combinante
 *         contando 0 — cada caso escolhido para dar um corte diferente se a medida errar; o texto não se normaliza.
 *
 * ENTRA REPROVADO, na forma do G-par da N4-PR1 (`docs/native/N4-PR1-anexos/README.md` §1.3): a lista do que DEVE
 * reprovar mora em `packages/core/fixtures/ql-quebra-reprovados.txt`; reprovação fora da lista (`NÃO DECLARADA`) e
 * declaração que passa (`ÓRFÃ`) reprovam o teste (regra 14). Na PR-1 `quebrar` é só o contrato e lança: a lista tem
 * todas as checagens. **A PR-2 esvazia a lista** — com ela vazia, o gate exige zero reprovações, sem mudar o gate.
 * LISTA VAZIA FIXA (QL-PR2, no molde do G-par, N4-D50): desde a PR-2 a lista VAZIA é condição do gate — qualquer
 * linha em `ql-quebra-reprovados.txt` reprova, mesmo a de uma checagem que de fato reprova: reprovação declarada não
 * é mais aceita. A não declarada e a órfã continuam impressas, para dizer o que a linha é. As expectativas (os casos
 * da fixture) não mudaram.
 *
 * E um gate ESTRUTURAL que já passa (QL-D13; QL-R1): a quebra não entra no `bodyOf` nem na busca — o
 * `content-contract.ts` e o `search.ts` não importam `./quebra`.
 *
 * O gate imprime o TAMANHO do que leu (regra 4): casos, checagens, quantas passam, quantas reprovam, a lista.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { quebrar, RECUO_DA_CONTINUACAO, type LinhaVisual } from '../../packages/core/src/quebra'

const CORE = path.resolve(__dirname, '../../packages/core')
interface Caso {
  id: string
  gate: 'i' | 'iii'
  regra: string
  tipo: string
  texto: string
  colunas: number
  fonte: string
  esperado: string[]
}
interface Fixture {
  textos: Record<string, string>
  casos: Caso[]
}

/** `null` = passa; senão, o motivo. */
type Veredito = string | null

function rodar(c: Caso, texto: string): LinhaVisual[] | string {
  try {
    return quebrar(texto, c.tipo, c.colunas)
  } catch (e) {
    return `lança: ${e instanceof Error ? e.message : String(e)}`
  }
}

/** (i) e (iii): as linhas visuais iguais às esperadas, uma a uma. */
function regras(c: Caso, r: LinhaVisual[] | string): Veredito {
  if (typeof r === 'string') return r
  const got = r.map((l) => l.texto)
  if (got.length !== c.esperado.length) return `${got.length} linhas visuais, esperadas ${c.esperado.length}`
  const i = got.findIndex((t, k) => t !== c.esperado[k])
  return i < 0 ? null : `linha visual ${i + 1}: ${JSON.stringify(got[i])} ≠ ${JSON.stringify(c.esperado[i])}`
}

/** (ii) A invariância — o contrato de `quebra.ts`, item a item, e a junção byte a byte. */
function invariancia(texto: string, r: LinhaVisual[] | string): Veredito {
  if (typeof r === 'string') return r
  const L = texto.split('\n')
  const recuo = ' '.repeat(RECUO_DA_CONTINUACAO)
  const porLinha = new Map<number, LinhaVisual[]>()
  const primeiras: number[] = []
  for (const [k, l] of r.entries()) {
    const linha = L[l.logica]
    if (linha === undefined) return `linha visual ${k + 1}: logica=${l.logica} fora do texto (${L.length} linhas)`
    if (!(l.inicio >= 0 && l.inicio <= l.fim && l.fim <= linha.length)) return `linha visual ${k + 1}: fatia [${l.inicio}, ${l.fim}) fora da linha lógica`
    if (l.texto !== (l.continuacao ? recuo : '') + linha.slice(l.inicio, l.fim)) return `linha visual ${k + 1}: o texto não é o recuo mais a fatia [${l.inicio}, ${l.fim})`
    if (l.continuacao !== l.inicio > 0) return `linha visual ${k + 1}: continuacao=${l.continuacao} com inicio=${l.inicio}`
    if (!porLinha.has(l.logica)) {
      porLinha.set(l.logica, [])
      primeiras.push(l.logica)
    }
    porLinha.get(l.logica)!.push(l)
  }
  if (primeiras.length !== L.length) return `${primeiras.length} linhas lógicas com linha visual, de ${L.length}`
  if (primeiras.some((v, k) => v !== k)) return `as linhas lógicas não aparecem em ordem: ${primeiras.join(',')}`
  const junta: string[] = []
  for (const [i, linha] of L.entries()) {
    let s = ''
    for (const l of porLinha.get(i)!) {
      if (l.inicio < s.length) return `linha lógica ${i + 1}: pedaços sobrepostos (inicio ${l.inicio} < ${s.length})`
      if (!/^ *$/.test(linha.slice(s.length, l.inicio))) return `linha lógica ${i + 1}: entre os pedaços há o que não é espaço: ${JSON.stringify(linha.slice(s.length, l.inicio))}`
      s += ' '.repeat(l.inicio - s.length) + linha.slice(l.inicio, l.fim)
    }
    if (!/^ *$/.test(linha.slice(s.length))) return `linha lógica ${i + 1}: depois do último pedaço há o que não é espaço`
    junta.push(s + ' '.repeat(linha.length - s.length))
  }
  return junta.join('\n') === texto ? null : 'a junção não devolve o texto byte a byte'
}

describe('gate da quebra (QL-PR1) — as regras do corte, a invariância e a medida', () => {
  it('reprova exatamente a lista de ql-quebra-reprovados.txt', () => {
    const fx = JSON.parse(fs.readFileSync(path.join(CORE, 'fixtures/ql-quebra.json'), 'utf8')) as Fixture
    const esperados = fs
      .readFileSync(path.join(CORE, 'fixtures/ql-quebra-reprovados.txt'), 'utf8')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '' && !s.startsWith('#'))

    const out: string[] = []
    const checagens = new Map<string, Veredito>()
    for (const c of fx.casos) {
      const texto = fx.textos[c.texto]
      expect(texto, `caso ${c.id}: texto "${c.texto}" não existe na fixture`).toBeTypeOf('string')
      const r = rodar(c, texto!)
      const vr = regras(c, r)
      const vi = invariancia(texto!, r)
      checagens.set(`${c.gate}:${c.id}`, vr)
      checagens.set(`ii:${c.id}`, vi)
      const est = (v: Veredito): string => (v === null ? 'passa  ' : 'REPROVA')
      out.push(`  (${c.gate.padEnd(3)}) ${est(vr)} · (ii) ${est(vi)}  ${c.id.padEnd(20)} ${c.tipo.padEnd(6)} ${String(c.colunas).padStart(2)} col · ${c.fonte}`)
      if (vr !== null) out.push(`        (${c.gate}) ${vr}`)
      if (vi !== null && vi !== vr) out.push(`        (ii) ${vi}`)
    }
    const reprovados = [...checagens].filter(([, v]) => v !== null).map(([k]) => k)
    const naoDeclaradas = reprovados.filter((k) => !esperados.includes(k))
    const orfas = esperados.filter((k) => checagens.get(k) === null || !checagens.has(k))
    const n = { i: 0, ii: 0, iii: 0 }
    for (const k of checagens.keys()) n[k.split(':')[0] as keyof typeof n]++
    console.log(
      [
        `gate da quebra — casos ${fx.casos.length} · checagens ${checagens.size} ((i) ${n.i} · (ii) ${n.ii} · (iii) ${n.iii}) · passam ${checagens.size - reprovados.length} · reprovam ${reprovados.length}`,
        ...out,
        `lista esperada (${esperados.length}) · reprovados (${reprovados.length})`,
        ...naoDeclaradas.map((k) => `  ✗ reprovação NÃO DECLARADA: ${k}`),
        ...orfas.map((k) => `  ✗ declaração ÓRFÃ: ${k} (${checagens.has(k) ? 'passa' : 'não existe na fixture'})`),
        ...(esperados.length
          ? [`  ✗ LISTA NÃO VAZIA (${esperados.length}): desde a PR-2 (a quebra no core) reprovação declarada não é mais aceita — ql-quebra-reprovados.txt tem de estar vazio`]
          : []),
        naoDeclaradas.length + orfas.length + esperados.length === 0
          ? 'gate da quebra: zero reprovações, lista vazia (QL-PR2) ✓'
          : 'gate da quebra: ✗',
      ].join('\n'),
    )

    expect(fx.casos.length, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(new Set(fx.casos.map((c) => c.id)).size, 'ids de caso repetidos').toBe(fx.casos.length)
    expect(naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(orfas, 'declaração ÓRFÃ').toEqual([])
    expect(esperados, 'lista não vazia: desde a PR-2 (a quebra no core) reprovação declarada não é mais aceita').toEqual([])
  })

  it('QL-D13: a quebra não entra no bodyOf nem na busca (content-contract.ts e search.ts não importam ./quebra)', () => {
    for (const arq of ['src/content-contract.ts', 'src/search.ts']) {
      const fonte = fs.readFileSync(path.join(CORE, arq), 'utf8')
      expect(fonte, `${arq} importa a quebra`).not.toMatch(/from\s+['"]\.\/quebra['"]/)
    }
  })
})
