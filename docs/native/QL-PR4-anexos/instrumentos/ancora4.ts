/**
 * A ÂNCORA NO APARELHO COM ALGO ACIMA DO CORPO (QL-PR4; QL-R13, QL-D49, QL-D52) — instrumento de anexo (fora de CI, lint
 * e typecheck, N4-D117). Estende o `ancora.ts` da QL-PR3 (o mesmo leitor de eventos, o mesmo critério de ±0,5 px da
 * QL-D50) com o COMEÇO DO CORPO de cada passo: as notas da música acima do corpo no palco, os *Detalhes* acima do corpo
 * de V em B. O `ql4.py` mede esse começo com a rolagem no topo (o topo do `corpo` menos o da rolagem menos 72 px) e
 * grava o plano: `<base>.plano.json` com os passos `{ rotulo, cols, zoom, inicio_px }` e os eventos em
 * `<base>-<rotulo>.txt`.
 *
 * A conta é a do `Leitor.tsx` (cópia; o teste de unidade `notas-palco.test.tsx` prova a da tela): a lógica na marca de
 * 32 é a de `y − inicio` (`logicaNoTopo`); **`null` com nada rolado (y ≤ 0,5 dp) ou com a marca acima do corpo**
 * (y + 0,5 < inicio) — e então a rolagem prevista é **0** (QL-D52); senão, `inicio_novo + yDaLogica`.
 *
 * Uso (da raiz):  pnpm exec tsx <dir>/ancora4.ts <base>     (o fator px/dp vem do plano)
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { quebrar } from '../../../../packages/core/src/quebra'

const [base] = process.argv.slice(2)
if (!base) throw new Error('uso: ancora4.ts <base>')
const plano = JSON.parse(readFileSync(`${base}.plano.json`, 'utf8')) as {
  texto: string
  fator: number
  passos: { rotulo: string; cols: number; zoom: number; o: string; inicio_px: number }[]
  auto: boolean
}
const F = plano.fator

const dir = mkdtempSync(join(tmpdir(), 'ql4-ancora-'))
execFileSync('python3', [join(__dirname, '../../QL-PR3-anexos/instrumentos/fixture-ql.py'), dir])
const content = JSON.parse(readFileSync(join(dir, 'content.json'), 'utf8')) as { title: string; content_data: { lyrics?: string } }[]
const TEXTO = content.find((c) => c.title === plano.texto)!.content_data.lyrics!

const logicasDe = (cols: number): number[] => quebrar(TEXTO, 'Lyrics', cols).map((l) => l.logica)
function logicaNoTopo(logicas: number[], y: number, entrelinha: number): number {
  const v = Math.max(0, Math.floor((y + 0.5) / entrelinha))
  return logicas[Math.min(v, logicas.length - 1)]!
}
const logicaNaMarca = (logicas: number[], y: number, lh: number, inicio: number): number | null =>
  y <= 0.5 || y + 0.5 < inicio ? null : logicaNoTopo(logicas, y - inicio, lh)
const yDaLogica = (logicas: number[], logica: number, lh: number): number => {
  const v = logicas.indexOf(logica)
  return v <= 0 ? 0 : v * lh
}

/** Os ScrollY da rolagem vertical do passo: das `android.widget.ScrollView`, a de MAIOR `MaxScrollY` (em V em C há a
 * coluna dos Detalhes e a do leitor; a que rola o corpo é a mais longa). */
function ysDe(arquivo: string): number[] {
  if (!existsSync(arquivo)) return []
  const bruto = readFileSync(arquivo, 'utf8')
  const ms = [...bruto.matchAll(/ClassName: android\.widget\.ScrollView;[^\n]*?ScrollY: (-?\d+); MaxScrollX: -?\d+; MaxScrollY: (\d+)/g)]
    .map((m) => ({ y: Number(m[1]), max: Number(m[2]) }))
    .filter((m) => m.max > 0)
  if (ms.length === 0) return []
  const maior = Math.max(...ms.map((m) => m.max))
  // o conteúdo muda de tamanho no giro: a rolagem do corpo é a dos eventos cujo máximo é o maior DESTE passo
  return ms.filter((m) => m.max === maior || m.max > maior * 0.5).map((m) => m.y)
}

console.log(`a âncora no aparelho — ${base.split('/').pop()}-<passo>.txt · fator ${F} px/dp · "${plano.texto}" (${TEXTO.split('\n').length} linhas lógicas)`)
let anterior: { y: number; logicas: number[]; lh: number; inicio: number } | null = null
let falhas = 0
for (const p of plano.passos) {
  const ys = ysDe(`${base}-${p.rotulo}.txt`)
  const logicas = logicasDe(p.cols)
  const lh = p.zoom * 1.55
  const inicio = p.inicio_px / F
  let previstoPx: number | null = null
  let nota = ''
  if (anterior !== null) {
    const l = logicaNaMarca(anterior.logicas, anterior.y, anterior.lh, anterior.inicio)
    previstoPx = l === null ? 0 : (inicio + yDaLogica(logicas, l, lh)) * F
    nota = l === null ? 'a marca acima do corpo (ou nada rolado) → o TOPO (QL-D52)' : `a lógica ${l + 1} a 32 do topo, o corpo começando ${inicio.toFixed(2)} dp abaixo do respiro`
  }
  const medido = ys.length > 0 ? ys[ys.length - 1]! : previstoPx === 0 ? 0 : null
  if (medido === null) {
    console.log(`  ${p.rotulo.padEnd(8)} ${p.o} ${String(p.cols).padStart(2)} col · zoom ${p.zoom}: NENHUM evento de rolagem no passo`)
    falhas++
    continue
  }
  const yDp = medido / F
  const lTopo = logicaNaMarca(logicas, yDp, lh, inicio)
  let linha = `  ${p.rotulo.padEnd(8)} ${p.o} ${String(p.cols).padStart(2)} col · zoom ${p.zoom} · início ${p.inicio_px} px: ScrollY ${ys.length > 0 ? `medido ${medido} px (${ys.length} eventos)` : '0 (sem evento: a rolagem não se moveu)'} · na marca: ${lTopo === null ? 'acima do corpo (o topo)' : `a lógica ${lTopo + 1}`}`
  if (previstoPx !== null) {
    const ok = Math.abs(previstoPx - medido) <= 0.5
    if (!ok) falhas++
    linha += ` · PREVISTO ${previstoPx.toFixed(1)} px (${nota}) → ${ok ? `igual (Δ ${Math.abs(previstoPx - medido).toFixed(1)})` : `DIFERENTE (Δ ${(medido - previstoPx).toFixed(1)})`}`
  }
  console.log(linha)
  anterior = { y: yDp, logicas, lh, inicio }
}
if (plano.auto) {
  const ys = ysDe(`${base}-auto.txt`)
  const ancorado = anterior === null ? NaN : anterior.y * F
  const ok = ys.length > 1 && ys[0]! >= ancorado - 1.5 && ys[0]! - ancorado < 50 && ys.every((y, i) => i === 0 || y >= ys[i - 1]!)
  if (!ok) falhas++
  console.log(`  auto     a rolagem automática: ${ys.length} eventos · de ${ys[0]} a ${ys[ys.length - 1]} px · o ponto ancorado ${ancorado.toFixed(1)} px → ${ok ? 'parte dele e só desce ✓' : 'NÃO parte do ponto ancorado ✗'}`)
}
console.log(falhas === 0 ? 'âncora: a rolagem medida é a prevista em todo passo ✓' : `âncora: ${falhas} passo(s) fora ✗`)
process.exitCode = falhas === 0 ? 0 : 1
