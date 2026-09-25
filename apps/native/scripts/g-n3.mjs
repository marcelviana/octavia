#!/usr/bin/env node
/**
 * G-N3 — o gate do bloco N3 contra a folha (T3-R4; N3-D9, N3-D10, N3-D23).
 * Nasceu na N3-PR1, antes de qualquer tela mudar: **o gate vem antes do que
 * ele mede** (`V1-ENCERRAMENTO.md:204`), e por isso ele REPROVA a `main` de
 * hoje em retrato.
 *
 * Para cada PAR (dump em paisagem, dump da faixa) do MESMO estado — o critério
 * é defeito NOVO em relação à paisagem (N3-D9), que é o congelado (N3-D3):
 *
 *   (e)   texto que está no dump da paisagem e SOME do dump da faixa → REPROVA.
 *   (d′)  texto com MENOS espaço que na paisagem → TRIAGEM (confirmar no PNG
 *         antes de virar defeito); não reprova.
 *   4 dp  nó que casa com uma entrada do `DESIGN-N3/medidas.json` e cuja
 *         largura difere do valor da folha em > 4 dp → ERRATA CANDIDATA do
 *         DESIGN-N3 (N3-D23); não reprova.
 *
 * (e) e (d′) são os do instrumento do pre-check
 * (`docs/native/N3-PRECHECK-anexos/inventario.mjs`), COPIADOS e não
 * importados: aquele arquivo é rastro de anexo, roda a CLI no topo e não
 * exporta de forma importável sem efeito. O controle de que a cópia mede o
 * mesmo é o CN da N3-PR1 (`__cn__/cn-n3pr1.sh`): sobre os dumps de retrato do
 * pre-check, a contagem de (e) deste gate tem de ser IGUAL, dump a dump, à do
 * `B3-inventario.jsonl`. As duas definições, verbatim do pre-check:
 *
 *   (d′) o mesmo `text` tem, na paisagem, largura maior em > 1 dp (encolheu →
 *        o desenho corta ou elipsa) ou altura maior em > 40 % na faixa (quebrou
 *        linha).
 *   (e)  `text` de TextView folha que a paisagem tem e a faixa não. Só conta o
 *        que, na paisagem, estava a uma distância do topo da janela que CABE na
 *        janela da faixa (o resto é rolagem, não sumiço); textos de estado que
 *        mudam sozinhos ("sincronizado há …", "n de m arquivos baixados") ficam
 *        de fora.
 *
 * O `(d)` literal (texto terminando em `…`) é zero por construção no RN (div.
 * 384) e não é critério.
 *
 * DUAS SAÍDAS DO (e), N3-PR3 (decisão do Marcel, 2026-09-25). Um texto da
 * paisagem que falta no dump da faixa NÃO conta como (e) em dois casos, e só
 * com a prova no próprio dump — cada um com contagem PRÓPRIA no relatório,
 * nunca somada ao zero de (e) ("(e)=0 · nome-acessível=n · rolagem=n"):
 *
 *   nome-acessível  o texto virou NOME ACESSÍVEL (N3-D17: `Adicionar música` →
 *                   `Adicionar`): o nó de MESMO `resource-id` que o continha
 *                   na paisagem existe na faixa, o `content-desc` DELE é o
 *                   texto, e ele MOSTRA outro rótulo (`rotuloVisivel`). Sem o
 *                   nó, com outro `content-desc`, ou sem rótulo visível (texto
 *                   cortado), é (e).
 *   rolagem         o texto está ABAIXO DA DOBRA no mesmo estado (a grade de
 *                   duas colunas que vira uma empurra a linha 8 para baixo): ele
 *                   está no dump ROLADO desse estado, passado explicitamente por
 *                   `--rolada <dir>` (nome `<estado>-rolada-<aparelho>-<orient>`,
 *                   pareado com o dump `<estado>-<aparelho>-<orient>` da faixa).
 *                   Sem o dump rolado, ou sem o texto nele, é (e). O filtro de
 *                   distância do topo na PAISAGEM (acima) não muda: é o critério
 *                   do pre-check, e o CT-N3 do `cn-n3pr1.sh` exige a contagem
 *                   igual à do `B3-inventario.jsonl`.
 *
 * PAREAMENTO. O nome do dump é afirmação (caso 23): `<PREFIXO>-<tela>-<estado>-
 * <aparelho>[-<orientação>].xml`. A chave do par é `<tela>-<estado>` + o tipo de
 * aparelho. O celular (`phone`) não tem paisagem de tablet própria no pre-check
 * e é pareado com a do AVD (`avd`), como o `inventario.mjs` fazia. A orientação
 * de cada lado é conferida pela RAIZ do dump, não pelo nome: paisagem tem de ser
 * mais larga que alta, e a faixa, a que o nome diz.
 *
 * Uso (da raiz do repositório):
 *   node apps/native/scripts/g-n3.mjs --pai <dir> [--pai <dir>…] --faixa <dir> [--rolada <dir>] [--medidas <json>]
 *
 *   --pai     diretório(s) com a paisagem de referência (`B5-baseline/` e, para
 *             o palco, `B3-referencia-paisagem/`)
 *   --faixa   diretório com os dumps da faixa (retrato do tablet = B, celular
 *             em retrato = A)
 *   --rolada  diretório com os dumps ROLADOS (`<estado>-rolada-…`); cada um
 *             usado é listado com o sha256 (os 12 primeiros)
 *   --medidas o `docs/native/DESIGN-N3/medidas.json` (padrão)
 *
 * Saída literal em cinco blocos, nesta ordem — (e), (d′), 4 dp, nome-acessível,
 * rolagem (os dois últimos DEPOIS do 4 dp: o CT-N3 do `cn-n3pr1.sh` lê o (e)
 * até o cabeçalho do (d′)) — e o veredito. Exit 1 se houver
 * (e); exit 2 se a chamada não mede nada (sem par, diretório vazio).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { createHash } from 'node:crypto'

const PKG = 'rocks.octavia.app'
/** As mesmas fronteiras do `apps/native/src/faixa.ts` (T3-R1): A < 700 · B 700–960 · C > 960. */
const faixaDe = (w) => (w < 700 ? 'A' : w <= 960 ? 'B' : 'C')

function uso(msg) {
  console.error(`g-n3.mjs: ${msg}`)
  console.error('uso: node apps/native/scripts/g-n3.mjs --pai <dir> [--pai <dir>…] --faixa <dir> [--rolada <dir>] [--medidas <json>]')
  console.error('     da RAIZ do repositório. Um gate de par sem par não mede nada.')
  process.exit(2)
}

const args = process.argv.slice(2)
const pais = []
let dirFaixa = null
let dirRolada = null
let arqMedidas = 'docs/native/DESIGN-N3/medidas.json'
for (let i = 0; i < args.length; i++) {
  const v = args[i + 1]
  if (args[i] === '--pai' && v) { pais.push(v); i++ }
  else if (args[i] === '--faixa' && v) { dirFaixa = v; i++ }
  else if (args[i] === '--rolada' && v) { dirRolada = v; i++ }
  else if (args[i] === '--medidas' && v) { arqMedidas = v; i++ }
  else uso(`argumento desconhecido ou sem valor: ${args[i]}`)
}
if (pais.length === 0) uso('falta --pai <dir>')
if (dirFaixa === null) uso('falta --faixa <dir>')
for (const d of [...pais, dirFaixa, ...(dirRolada ? [dirRolada] : [])]) if (!existsSync(d)) uso(`diretório não existe: ${d}`)
if (!existsSync(arqMedidas)) uso(`medidas não existe: ${arqMedidas}`)
const MEDIDAS = JSON.parse(readFileSync(arqMedidas, 'utf8'))
const TOL = MEDIDAS['tolerancia-dp']

const fator = (arquivo) => (/phone/.test(basename(arquivo)) ? 2.625 : 2.25) // 420/160 · 360/160

const ent = (t) => t.replace(/&#10;/g, '\n').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

/** O `resource-id` do próprio nó ou do ancestral mais próximo que tem um. */
function idAcima(n) {
  for (let p = n; p; p = p.pai) if (p.id) return p.id
  return ''
}

function ler(arquivo) {
  const xml = readFileSync(arquivo, 'utf8')
  const F = fator(arquivo)
  const raiz = { filhos: [], pai: null }
  const pilha = [raiz]
  const todos = []
  for (const m of xml.matchAll(/<node\b([^>]*?)(\/?)>|<\/node>/g)) {
    if (m[0] === '</node>') { pilha.pop(); continue }
    const a = {}
    for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
    const b = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(a.bounds ?? '').slice(1).map(Number)
    const pai = pilha[pilha.length - 1]
    const no = {
      cls: (a.class ?? '').split('.').pop(),
      id: (a['resource-id'] ?? '').replace(/^.*:id\//, ''),
      text: ent(a.text ?? ''),
      cd: ent(a['content-desc'] ?? ''),
      pkg: a.package ?? '',
      b: b.map((v) => v / F),
      filhos: [],
      pai,
    }
    no.compose = pai.compose || no.cls === 'ComposeView'
    pai.filhos.push(no)
    todos.push(no)
    if (m[2] !== '/') pilha.push(no)
  }
  return { todos, tela: todos[0]?.b ?? [0, 0, 0, 0] }
}

const r1 = (v) => Math.round(v * 10) / 10
const larg = (b) => b[2] - b[0]
const alt = (b) => b[3] - b[1]
const sig = (n) => n.id || (n.text ? `"${n.text.slice(0, 40)}"` : '') || n.cls

function janelaUtil(todos, tela) {
  const vs = todos.filter((n) => n.pkg === PKG && !n.compose && n.cls === 'ViewGroup'
    && n.b[1] > 0.5 && n.b[3] <= tela[3] + 0.5 && Math.abs(larg(n.b) - larg(tela)) < 0.5)
  if (vs.length === 0) return tela
  return vs.reduce((m, n) => (alt(n.b) > alt(m.b) ? n : m)).b
}

function medir(arquivo) {
  const { todos, tela } = ler(arquivo)
  const app = todos.filter((n) => n.pkg === PKG && !n.compose && larg(n.b) > 0 && alt(n.b) > 0)
  const janela = janelaUtil(todos, tela)
  const textos = app.filter((n) => n.text && n.filhos.length === 0 && n.cls === 'TextView').map((n) => ({ text: n.text, b: n.b, s: sig(n), rid: idAcima(n) }))
  return { arquivo, tela, janela, app, textos }
}

// ---- pareamento -------------------------------------------------------------
const RE = /^[A-Za-z0-9]+-(.+)-(avd|tab|phone)(?:-(pai|ret))?$/
function chave(arquivo) {
  const m = RE.exec(basename(arquivo, '.xml'))
  if (!m) return null
  return { estado: m[1], aparelho: m[2], orient: m[3] ?? null }
}
const xmls = (d) => readdirSync(d).filter((f) => f.endsWith('.xml')).sort().map((f) => join(d, f))

const refs = new Map()
for (const d of pais) {
  for (const f of xmls(d)) {
    const k = chave(f)
    if (k === null) continue
    const id = `${k.estado}|${k.aparelho}`
    if (!refs.has(id)) refs.set(id, f)
  }
}
// um dump rolado é PROVA de um estado, não um estado: fica fora dos pares
const rolada = (k) => k !== null && k.estado.endsWith('-rolada')
const faixas = xmls(dirFaixa).filter((f) => chave(f) !== null && !rolada(chave(f)))
const rolados = new Map()
if (dirRolada) {
  for (const f of xmls(dirRolada)) {
    const k = chave(f)
    if (rolada(k)) rolados.set(`${k.estado.slice(0, -'-rolada'.length)}|${k.aparelho}|${k.orient}`, f)
  }
}
if (faixas.length === 0) uso(`nenhum dump com nome no padrão em ${dirFaixa}`)

const pares = []
const semPar = []
for (const f of faixas) {
  const k = chave(f)
  const ap = k.aparelho === 'phone' ? 'avd' : k.aparelho
  const ref = refs.get(`${k.estado}|${ap}`)
  if (ref === undefined || ref === f) semPar.push(f)
  else pares.push({ ref, f })
}
if (pares.length === 0) uso('nenhum par (paisagem, faixa) — nada a medir')

// ---- 4 dp: a largura do nó que casa com uma entrada do medidas.json --------
function descendentes(n) {
  const out = []
  const pilha = [...n.filhos]
  while (pilha.length) { const x = pilha.pop(); out.push(x); pilha.push(...x.filhos) }
  return out
}
function casar(app, casa) {
  const alvos = app.filter((n) => (casa.rid ? n.id === casa.rid : casa.ridRe ? new RegExp(casa.ridRe).test(n.id) : n.cls === 'TextView'))
  return alvos.filter((n) => casa.texto === undefined || n.text === casa.texto || descendentes(n).some((d) => d.text === casa.texto))
}

// ---- o gate -----------------------------------------------------------------
/**
 * O nó MOSTRA outro rótulo: um TextView descendente com texto não vazio e
 * diferente do nome acessível. É o que separa a N3-D17 (rótulo curto na tela,
 * o longo no nome) de um texto CORTADO para fora do dump — no Android o
 * `content-desc` de um alvo sem `accessibilityLabel` é o texto dos filhos,
 * mesmo quando o filho não chega ao dump (os `B4-…-phone-ret` do pre-check).
 */
function rotuloVisivel(n, nomeAcessivel) {
  return descendentes(n).some((d) => d.cls === 'TextView' && d.text && d.text !== nomeAcessivel && larg(d.b) > 0 && alt(d.b) > 0)
}

const E = []
const NA = []
const RO = []
const roladosUsados = new Set()
const DL = []
const Q = []
const vivos = /sincroniz|última|agora|há \d|arquivos baixados/
for (const { ref, f } of pares) {
  const antes = medir(ref)
  const agora = medir(f)
  const nome = basename(f, '.xml')
  if (larg(antes.tela) <= alt(antes.tela)) { console.log(`  ✗ a referência não está em paisagem (raiz ${antes.tela.map(r1)}): ${basename(ref)}`); process.exitCode = 1 }
  const fx = faixaDe(larg(agora.tela))
  const cabe = (t) => t.b[3] - antes.janela[1] <= agora.janela[3] - agora.janela[1]
  for (const t of antes.textos) {
    if (!cabe(t) || vivos.test(t.text) || agora.textos.some((u) => u.text === t.text)) continue
    if (t.rid && agora.app.some((n) => n.id === t.rid && n.cd === t.text && rotuloVisivel(n, t.text))) { NA.push({ nome, no: t.s, rid: t.rid }); continue }
    const k = chave(f)
    const rol = rolados.get(`${k.estado}|${k.aparelho}|${k.orient}`)
    if (rol && medir(rol).textos.some((u) => u.text === t.text)) { RO.push({ nome, no: t.s, rol: basename(rol, '.xml') }); roladosUsados.add(rol); continue }
    E.push({ nome, no: t.s })
  }
  for (const t of agora.textos) {
    const r = antes.textos.find((u) => u.text === t.text)
    if (!r) continue
    const encolheu = larg(r.b) - larg(t.b)
    const quebrou = alt(t.b) / alt(r.b)
    if (encolheu > 1 || quebrou > 1.4) DL.push({ nome, no: t.s, pai: r1(larg(r.b)), faixa: r1(larg(t.b)), quebrou: quebrou > 1.4 ? r1(quebrou) : null })
  }
  // Cada medida se confere na faixa em que a folha a declara: as de C na
  // paisagem, as de B e A no dump cuja LARGURA (não o nome) cai nessa faixa.
  for (const [lado, m] of [['C', antes], [fx, agora]]) {
    for (const x of MEDIDAS.medidas) {
      if (x.valor === null || x.casa === null || x.faixa !== lado) continue
      for (const n of casar(m.app, x.casa)) {
        const w = r1(larg(n.b))
        const d = r1(w - x.valor)
        if (Math.abs(d) > TOL) Q.push({ nome: basename(m === antes ? ref : f, '.xml'), lado, id: x.id, elemento: x.elemento, folha: x.valor, dump: w, d })
      }
    }
  }
}

// uma mesma medida no mesmo dump de referência aparece uma vez só
const vistos = new Set()
const Qu = Q.filter((q) => { const k = `${q.nome}|${q.id}|${q.dump}`; if (vistos.has(k)) return false; vistos.add(k); return true })

console.log(`G-N3 — ${pares.length} par(es) (paisagem × faixa); medidas: ${arqMedidas} (tolerância ${TOL} dp)`)
if (semPar.length) console.log(`  sem paisagem de referência (fora da conta): ${semPar.map((f) => basename(f, '.xml')).join(', ')}`)
console.log('')
console.log(`(e) TEXTO QUE SOME — REPROVA: ${E.length}`)
const porDump = new Map()
for (const e of E) porDump.set(e.nome, [...(porDump.get(e.nome) ?? []), e.no])
for (const [n, nos] of porDump) console.log(`  ${n}: ${nos.length} — ${nos.join(' · ')}`)
console.log('')
console.log(`(d′) MENOS ESPAÇO QUE NA PAISAGEM — TRIAGEM (confirmar no PNG): ${DL.length}`)
for (const x of DL) console.log(`  ${x.nome}: ${x.no} ${x.pai} → ${x.faixa} dp${x.quebrou ? ` (altura ×${x.quebrou})` : ''}`)
console.log('')
console.log(`4 dp CONTRA A FOLHA — ERRATA CANDIDATA: ${Qu.length}`)
for (const q of Qu) console.log(`  ${q.nome} [${q.lado}]: ${q.id} ${q.elemento} — folha ${q.folha} · dump ${q.dump} · Δ ${q.d > 0 ? '+' : ''}${q.d}`)
console.log('')
console.log(`NOME ACESSÍVEL — o texto está no content-desc do nó de mesmo resource-id (N3-D17); não reprova, não soma ao (e): ${NA.length}`)
for (const x of NA) console.log(`  ${x.nome}: ${x.no} → content-desc de \`${x.rid}\``)
console.log('')
console.log(`ROLAGEM — o texto está no dump rolado do mesmo estado; não reprova, não soma ao (e): ${RO.length}`)
for (const x of RO) console.log(`  ${x.nome}: ${x.no} → ${x.rol}`)
if (roladosUsados.size) {
  console.log('  dumps rolados usados (sha256, 12):')
  for (const r of [...roladosUsados].sort()) console.log(`    ${createHash('sha256').update(readFileSync(r)).digest('hex').slice(0, 12)}  ${basename(r)}`)
}
console.log('')
if (E.length > 0) { console.log(`G-N3: REPROVA ✗ — (e)=${E.length} em ${porDump.size} dump(s) · nome-acessível=${NA.length} · rolagem=${RO.length}`); process.exitCode = 1 }
else if (process.exitCode !== 1) console.log(`G-N3: (e)=0 · nome-acessível=${NA.length} · rolagem=${RO.length} ✓ (d′ e 4 dp não reprovam: triagem e errata)`)
