// N3 pre-check — B3/B4: defeito objetivo por dump, contra a paisagem do mesmo estado.
//
//   node inventario.mjs <xml...>            → uma linha JSON por dump (stdout)
//   node inventario.mjs --md <xml...>       → a tabela em markdown
//
// Para cada dump, quatro contagens, e cada uma TAMBÉM na referência — a paisagem
// do mesmo estado no mesmo tipo de aparelho (B5-baseline/ para as telas de lista e
// do N2, B3-referencia-paisagem/ para o palco). A paisagem é o congelado (N3-D3): o
// que ela já tem não é defeito de faixa. O que conta é o NOVO, isto é, o que aparece
// no dump e não aparece na referência (pela assinatura do nó: id, texto ou classe).
//
// (a) sobreposição: pares de folhas de CONTEÚDO visíveis cujos bounds se cruzam em
//     > 1 dp nos dois eixos. Folha = nó sem filho; um SvgView conta como uma folha só
//     (os traços de um ícone se cruzam por desenho); View/ViewGroup vazio (fundo, fio)
//     não é conteúdo; e uma caixa DENTRO da outra é contêiner e conteúdo, não par.
// (b) corte: nó que passa da janela útil (entra sob a barra de status ou a de
//     tarefas — o uiautomator só recorta na TELA) ou que encosta na borda
//     esquerda/direita da tela sem ocupar a largura inteira; ou que SOME: o
//     uiautomator omite nó inteiro fora da tela, então conta-se também o
//     `resource-id` da referência ausente no dump ("ausente").
// (c) alvo < 48 dp: nó clickable com lado menor < 48 dp, pela regra das duas
//     bordas do G5 (N2-PR7, div. 291): o que encosta na borda de um ScrollView
//     ancestral no eixo do lado menor é recorte de rolagem, não alvo pequeno.
// (d) texto truncado, LITERAL (a forma do prompt): `text` terminando em "…".
//     O RN elipsa no DESENHO e o uiautomator devolve o texto inteiro, então (d)
//     dá zero por construção (div. 384). Por isso:
// (d′) texto com MENOS espaço que no congelado: o mesmo `text` tem, na
//     referência, largura maior em > 1 dp (encolheu → o desenho corta ou
//     elipsa) ou altura menor em > 40% (quebrou linha). Confirmado no PNG.
// (e) texto AUSENTE: `text` de TextView que a referência tem e o dump não —
//     largura zero some do dump (o título do cartão no celular em retrato). Só conta o
//     que, na referência, estava numa altura que cabe na janela de agora (o resto é rolagem).
//     Textos de estado que mudam sozinhos ("sincronizado há …", "n de m arquivos
//     baixados", que depende do que o prefetch já trouxe) ficam de fora.
//
// O overlay do dev client (ComposeView: o botão "Tools") sai da conta: só existe
// no dev client (APARATO.md, "O dev client e os teclados atrapalham o arnês").
import { readFileSync, existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const PKG = 'rocks.octavia.app'

function fator(arquivo) {
  return /phone/.test(basename(arquivo)) ? 2.625 : 2.25 // 420/160 · 360/160
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
      text: (a.text ?? '').replace(/&#10;/g, '\n'),
      desc: a['content-desc'] ?? '',
      pkg: a.package ?? '',
      click: a.clickable === 'true',
      en: a.enabled === 'true',
      px: b,
      b: b.map((v) => v / F),
      filhos: [],
      pai,
    }
    no.compose = pai.compose || no.cls === 'ComposeView'
    no.svg = pai.svg || pai.cls === 'SvgView'
    pai.filhos.push(no)
    todos.push(no)
    if (m[2] !== '/') pilha.push(no)
  }
  return { todos, tela: todos[0]?.b ?? [0, 0, 0, 0], F }
}

const r1 = (v) => Math.round(v * 10) / 10
const larg = (b) => b[2] - b[0]
const alt = (b) => b[3] - b[1]
const sig = (n) => n.id || (n.text ? `"${n.text.slice(0, 40)}"` : '') || (n.desc ? `[${n.desc.slice(0, 40)}]` : '') || n.cls

function janelaUtil(todos, tela) {
  // a MAIOR ViewGroup do app com a largura inteira e o topo abaixo da barra de status
  // (a primeira da árvore pode ser a barra do S1, de 120 dp — foi o que o Tab mostrou)
  const vs = todos.filter((n) => n.pkg === PKG && !n.compose && n.cls === 'ViewGroup'
    && n.b[1] > 0.5 && n.b[3] <= tela[3] + 0.5 && Math.abs(larg(n.b) - larg(tela)) < 0.5)
  if (vs.length === 0) return tela
  return vs.reduce((m, n) => (alt(n.b) > alt(m.b) ? n : m)).b
}

function dentroDeScroll(n) {
  for (let p = n.pai; p && p.b; p = p.pai) if (p.cls === 'ScrollView' || p.cls === 'HorizontalScrollView') return p
  return null
}

export function medir(arquivo) {
  const { todos, tela } = ler(arquivo)
  const app = todos.filter((n) => n.pkg === PKG && !n.compose && larg(n.b) > 0 && alt(n.b) > 0)
  const jan = janelaUtil(todos, tela)
  // folha de CONTEÚDO: texto, ícone, imagem, ou alvo. `View`/`ViewGroup` vazio (fundo,
  // fio, moldura) cobre outros nós por desenho e não entra.
  const folhas = app.filter((n) => !n.svg && (n.filhos.length === 0 || n.cls === 'SvgView')
    && (n.text || n.desc || n.id || n.click || /Text|Svg|Image/.test(n.cls)))

  const a = []
  for (let i = 0; i < folhas.length; i++) {
    for (let j = i + 1; j < folhas.length; j++) {
      const p = folhas[i].b, q = folhas[j].b
      const w = Math.min(p[2], q[2]) - Math.max(p[0], q[0])
      const h = Math.min(p[3], q[3]) - Math.max(p[1], q[1])
      const contem = (x, y) => x[0] <= y[0] + 0.5 && x[1] <= y[1] + 0.5 && x[2] >= y[2] - 0.5 && x[3] >= y[3] - 0.5
      // uma caixa dentro da outra é contêiner e conteúdo (o Fabric achata a árvore), não sobreposição
      if (w > 1 && h > 1 && !contem(p, q) && !contem(q, p)) a.push({ par: [sig(folhas[i]), sig(folhas[j])].sort().join(' × '), w: r1(w), h: r1(h) })
    }
  }

  const b = []
  for (const n of app) {
    if (n === app[0]) continue
    const sob = n.b[1] < jan[1] - 0.5 || n.b[3] > jan[3] + 0.5
    const borda = (n.b[0] <= 0.5 || n.b[2] >= tela[2] - 0.5) && larg(n.b) < larg(tela) - 1
    if ((sob && alt(n.b) < alt(tela) - 1) || borda) {
      b.push({ no: sig(n), onde: sob ? 'sob barra' : 'borda lateral', bounds: n.b.map(r1) })
    }
  }

  const c = []
  for (const n of app) {
    if (!n.click) continue
    const menor = Math.min(larg(n.b), alt(n.b))
    if (menor >= 48 - 0.01) continue // 108 px / 2,25 = 48,0 (ponto flutuante)
    const sc = dentroDeScroll(n)
    if (sc) {
      const eixoY = alt(n.b) <= larg(n.b)
      const toca = eixoY
        ? Math.abs(n.b[1] - sc.b[1]) < 0.5 || Math.abs(n.b[3] - sc.b[3]) < 0.5
        : Math.abs(n.b[0] - sc.b[0]) < 0.5 || Math.abs(n.b[2] - sc.b[2]) < 0.5
      if (toca) continue // recorte de rolagem (regra das duas bordas)
    }
    c.push({ no: sig(n), w: r1(larg(n.b)), h: r1(alt(n.b)) })
  }

  const ids = new Set(app.map((n) => n.id).filter(Boolean))
  const d = app.filter((n) => n.text.endsWith('…')).map((n) => ({ no: sig(n) }))
  const textos = app.filter((n) => n.text && n.filhos.length === 0 && n.cls === 'TextView').map((n) => ({ text: n.text, b: n.b, s: sig(n) }))
  return { arquivo, tela: tela.map(r1), janela: jan.map(r1), a, b, c, d, textos, ids }
}

function referencia(arquivo) {
  // B2-<tela>-<estado>-<avd|tab>.xml / B4-...-phone-<ret|pai>.xml → a paisagem do tablet (avd-pai ou tab-pai)
  const nome = basename(arquivo, '.xml')
  const m = /^[A-Z0-9]+-(.+)-(avd|tab|phone-ret|phone-pai|avd-pai|tab-pai)$/.exec(nome)
  if (!m) return null
  const aparelho = m[2].startsWith('tab') ? 'tab-pai' : 'avd-pai'
  const raizAnexos = dirname(dirname(arquivo))
  for (const [dir, pref] of [['B5-baseline', 'B5'], ['B3-referencia-paisagem', 'REF']]) {
    const f = join(raizAnexos, dir, `${pref}-${m[1]}-${aparelho}.xml`)
    if (existsSync(f) && f !== arquivo) return f
  }
  return null
}

export function comparar(arquivo) {
  const agora = medir(arquivo)
  const ref = referencia(arquivo)
  if (ref === null) return { ...agora, ref: null }
  const antes = medir(ref)
  const chaves = (xs, k) => new Set(xs.map(k))
  const aRef = chaves(antes.a, (x) => x.par)
  const bRef = chaves(antes.b, (x) => x.no + x.onde)
  const cRef = chaves(antes.c, (x) => x.no)
  // (b) ausente: o uiautomator OMITE o nó inteiro fora da tela, então um controle que
  // saiu da tela não aparece como corte — some. Conta o `resource-id` da paisagem que
  // não existe no dump (song-N/remover-N/picker-*-N/resultado-* dependem de rolagem e ficam de fora).
  const variavel = /^(song|remover|alca|picker-estado|picker-adicionar|resultado|setlist|baixar)-/
  for (const id of antes.ids) {
    if (!agora.ids.has(id) && !variavel.test(id)) agora.b.push({ no: id, onde: 'ausente', bounds: [] })
  }
  const dl = []
  for (const t of agora.textos) {
    const r = antes.textos.find((u) => u.text === t.text)
    if (!r) continue
    const encolheu = larg(r.b) - larg(t.b)
    const quebrou = alt(t.b) / alt(r.b)
    if (encolheu > 1 || quebrou > 1.4) {
      dl.push({ no: t.s, larg: [r1(larg(r.b)), r1(larg(t.b))], alt: [r1(alt(r.b)), r1(alt(t.b))],
        motivo: [encolheu > 1 ? `encolheu ${r1(encolheu)} dp` : '', quebrou > 1.4 ? `altura ×${r1(quebrou)}` : ''].filter(Boolean).join(' · ') })
    }
  }
  const vivos = /sincroniz|última|agora|há \d|arquivos baixados/
  // só o texto que, na referência, estava a uma distância do topo da janela que CABE na janela
  // de agora — o resto é rolagem (o celular deitado tem 371 dp de altura), não sumiço
  const cabe = (t) => t.b[3] - antes.janela[1] <= agora.janela[3] - agora.janela[1]
  const e = antes.textos.filter((t) => cabe(t) && !vivos.test(t.text) && !agora.textos.some((u) => u.text === t.text))
    .map((t) => ({ no: t.s }))
  return {
    ...agora,
    ref: basename(ref),
    novo: {
      e,
      a: agora.a.filter((x) => !aRef.has(x.par)),
      b: agora.b.filter((x) => !bRef.has(x.no + x.onde)),
      c: agora.c.filter((x) => !cRef.has(x.no)),
      d: agora.d,
      dl,
    },
    naRef: { a: antes.a.length, b: antes.b.length, c: antes.c.length, d: antes.d.length },
  }
}

function pior(r) {
  const n = r.novo
  if (!n) return ''
  const partes = []
  if (n.a.length) { const x = n.a.reduce((m, y) => (y.w * y.h > m.w * m.h ? y : m)); partes.push(`a: ${x.par} (${x.w}×${x.h})`) }
  if (n.b.length) { const x = n.b.find((y) => y.onde === 'ausente') ?? n.b[0]; partes.push(`b: ${x.no} ${x.onde}${x.bounds.length ? ` [${x.bounds.join(',')}]` : ''}`) }
  if (n.c.length) { const x = n.c.reduce((m, y) => (Math.min(y.w, y.h) < Math.min(m.w, m.h) ? y : m)); partes.push(`c: ${x.no} ${x.w}×${x.h}`) }
  if (n.e.length) partes.push(`e: ${n.e.length} texto(s), ex. ${n.e[0].no}`)
  if (n.dl.length) { const x = n.dl.reduce((m, y) => (y.larg[0] - y.larg[1] > m.larg[0] - m.larg[1] ? y : m)); partes.push(`d′: ${x.no} ${x.larg[0]}→${x.larg[1]} dp${x.motivo.includes('altura') ? ` (${x.motivo})` : ''}`) }
  return partes.join(' · ')
}

const args = process.argv.slice(2)
const md = args[0] === '--md'
const arquivos = md ? args.slice(1) : args
const rs = arquivos.map(comparar)
if (!md) {
  for (const r of rs) {
    const { textos, ...resto } = r
    console.log(JSON.stringify(resto))
  }
} else {
  console.log('| dump | janela útil (dp) | ref. | a | b | c | d | d′ | e | pior caso (novo contra a paisagem) |')
  console.log('|---|---|---|---|---|---|---|---|---|---|')
  for (const r of rs) {
    const j = r.janela
    const n = r.novo
    const c = (k) => (n ? `${n[k].length}` : '—')
    console.log(`| ${basename(r.arquivo, '.xml')} | ${r1(j[2] - j[0])} × ${r1(j[3] - j[1])} | ${r.ref ? 'sim' : '**sem**'} | ${c('a')} | ${c('b')} | ${c('c')} | ${r.d.length} | ${c('dl')} | ${c('e')} | ${pior(r).replace(/\|/g, '\\|')} |`)
  }
}
