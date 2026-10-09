/**
 * A ÂNCORA NO APARELHO, MEDIDA (QL-PR3; QL-D18, QL-D37; QL-R13; A-QL-12) — instrumento de anexo (fora de CI, lint e
 * typecheck, N4-D117).
 *
 * Lê o que o `ql.py ancora` gravou: o `uiautomator events` de cada passo, um arquivo por passo (os eventos de
 * acessibilidade da rolagem trazem o `ScrollY` dela em px). Para cada
 * passo — o giro B → C, o zoom 22 → 26 em C, o giro de volta C → B — a rolagem MEDIDA (o último `ScrollY` vertical do
 * passo) contra a PREVISTA: a conta da âncora sobre a Letra longa da fixture, a partir da rolagem medida no passo
 * anterior. A conta é a do `Leitor.tsx` (`logicaNoTopo`, `inicioDoBloco`, `yDaLogica`), copiada abaixo — o `Leitor.tsx`
 * importa `react-native` e não roda no Node; o teste de unidade (`leitor-quebra.test.tsx`) é quem prova que a cópia e a
 * tela fazem a mesma conta.
 *
 * As colunas de cada estado são as da medida (o Tab e o AVD, QL-E2): B 48 no 22 e 41 no 26; C 80 no 22 e 68 no 26. O
 * texto da fixture vem do `fixture-ql.py` (gerado de novo aqui pelo `python3 fixture-ql.py`, num diretório temporário).
 *
 * Uso (da raiz):  pnpm exec tsx docs/native/QL-PR3-anexos/instrumentos/ancora.ts <saida>/<PREFIXO>-ancora-<ap> <fator px/dp>
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { quebrar } from '../../../../packages/core/src/quebra'

const [baseEventos, fatorTxt] = process.argv.slice(2)
if (!baseEventos || !fatorTxt) throw new Error('uso: ancora.ts <base dos arquivos de eventos> <fator px/dp>')
const F = Number(fatorTxt)

// a Letra longa da fixture (o mesmo gerador que o mock serviu)
const dir = mkdtempSync(join(tmpdir(), 'ql3-ancora-'))
execFileSync('python3', [join(__dirname, 'fixture-ql.py'), dir])
const content = JSON.parse(readFileSync(join(dir, 'content.json'), 'utf8')) as { title: string; content_data: { lyrics?: string } }[]
const TEXTO = content.find((c) => c.title === 'Letra longa da fixture')!.content_data.lyrics!

// a conta do Leitor.tsx (cópia; ver o cabeçalho)
const logicasDe = (cols: number): number[] => quebrar(TEXTO, 'Lyrics', cols).map((l) => l.logica)
function logicaNoTopo(logicas: number[], y: number, entrelinha: number): number {
  const v = Math.max(0, Math.floor((y + 0.5) / entrelinha))
  return logicas[Math.min(v, logicas.length - 1)]!
}
const yDaLogica = (logicas: number[], logica: number, entrelinha: number): number => {
  const v = logicas.indexOf(logica)
  return v <= 0 ? 0 : v * entrelinha
}

// os eventos, um arquivo por passo (`<base>-<rotulo>.txt`): o último `ScrollY` da rolagem VERTICAL do palco (a
// `android.widget.ScrollView` com `MaxScrollY` > 0), em qualquer evento que o traga (o `TYPE_VIEW_SCROLLED` e o
// `TYPE_WINDOW_CONTENT_CHANGED` levam os dois a rolagem do nó)
function ultimoY(arquivo: string): { y: number; n: number } | null {
  const bruto = readFileSync(arquivo, 'utf8')
  const ys = [...bruto.matchAll(/ClassName: android\.widget\.ScrollView;[^\n]*?ScrollY: (-?\d+); MaxScrollX: -?\d+; MaxScrollY: (\d+)/g)]
    .filter((m) => Number(m[2]) > 0)
    .map((m) => Number(m[1]))
  return ys.length === 0 ? null : { y: ys[ys.length - 1]!, n: ys.length }
}

const passos = [
  { rotulo: 'antes', cols: 48, zoom: 22, o: 'B' },
  { rotulo: 'giro-C', cols: 80, zoom: 22, o: 'C' },
  { rotulo: 'zoom-26', cols: 68, zoom: 26, o: 'C' },
  { rotulo: 'volta-B', cols: 41, zoom: 26, o: 'B' },
]
console.log(`a âncora no aparelho — ${baseEventos.split('/').pop()}-<passo>.txt · fator ${F} px/dp · a Letra longa (${TEXTO.split('\n').length} linhas lógicas)`)
let anterior: { y: number; logicas: number[]; lh: number } | null = null
let falhas = 0
for (const p of passos) {
  const medido = ultimoY(`${baseEventos}-${p.rotulo}.txt`)
  const logicas = logicasDe(p.cols)
  const lh = p.zoom * 1.55
  if (medido === null) {
    console.log(`  ${p.rotulo.padEnd(8)} ${p.o} ${p.cols} col · zoom ${p.zoom}: NENHUM evento de rolagem no passo`)
    falhas++
    continue
  }
  const yDp = medido.y / F
  const topo = logicaNoTopo(logicas, yDp, lh)
  const v = Math.max(0, Math.floor((yDp + 0.5) / lh)) // a linha na marca de 32 (o respiro acima dela mostra a anterior)
  let linha = `  ${p.rotulo.padEnd(8)} ${p.o} ${String(p.cols).padStart(2)} col · zoom ${p.zoom}: ScrollY medido ${medido.y} px (${yDp.toFixed(1)} dp; ${medido.n} eventos) · no topo: a linha visual ${v + 1}, da lógica ${topo + 1}`
  if (anterior !== null) {
    const logica = logicaNoTopo(anterior.logicas, anterior.y, anterior.lh)
    const previsto = yDaLogica(logicas, logica, lh)
    const prevPx = previsto * F
    const ok = Math.abs(prevPx - medido.y) <= 1.5
    const inicio = logicas.indexOf(logica) === v
    if (!ok || !inicio) falhas++
    linha += ` · PREVISTO ${prevPx.toFixed(1)} px (a lógica ${logica + 1} a 32 do topo) → ${ok ? 'igual' : 'DIFERENTE'}${inicio ? ' · a 1ª linha visual do topo é o COMEÇO da lógica ✓' : ' · o topo NÃO é o começo da lógica ✗'}`
  }
  console.log(linha)
  anterior = { y: yDp, logicas, lh }
}
// a rolagem automática depois da volta: os ScrollY do passo `auto`, do primeiro ao último — tem de partir do ponto
// ancorado (o `y` da rolagem automática é o da âncora, não o de antes do giro) e só descer
{
  const bruto = readFileSync(`${baseEventos}-auto.txt`, 'utf8')
  const ys = [...bruto.matchAll(/ClassName: android\.widget\.ScrollView;[^\n]*?ScrollY: (-?\d+); MaxScrollX: -?\d+; MaxScrollY: (\d+)/g)]
    .filter((m) => Number(m[2]) > 0)
    .map((m) => Number(m[1]))
  const ancorado = anterior === null ? NaN : anterior.y * F
  const ok = ys.length > 1 && ys[0]! >= ancorado - 1.5 && ys[0]! - ancorado < 50 && ys.every((y, i) => i === 0 || y >= ys[i - 1]!)
  if (!ok) falhas++
  console.log(`  auto     a rolagem automática: ${ys.length} eventos · de ${ys[0]} a ${ys[ys.length - 1]} px · o ponto ancorado ${ancorado.toFixed(1)} px → ${ok ? 'parte dele e só desce ✓' : 'NÃO parte do ponto ancorado ✗'}`)
}
console.log(falhas === 0 ? 'âncora: a rolagem medida é a prevista em todo passo ✓' : `âncora: ${falhas} passo(s) fora ✗`)
process.exitCode = falhas === 0 ? 0 : 1
