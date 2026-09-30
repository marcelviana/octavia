// G-faixa — a classificação (I1-PR5; I1-D13, I1-D16, N3-D29). Função PURA sobre
// os nós crus que o `g-faixa-medir.ts` grava: o medidor a usa para o relatório
// e o `g-faixa-veredito.mjs` a RECALCULA do JSON commitado (não confia no que
// o medidor escreveu; se diferir, reprova).
//
// Por superfície × estado, com a faixa C (1138) como referência:
//   (e)  REPROVA — nó que existe em 1138 (visível, com área) e, na largura W,
//        não existe ou tem largura/altura zero;
//   (b)  REPROVA — nó cortado: pela borda do viewport (horizontal), pela borda
//        de um contêiner que recorta (overflow hidden/clip), ou pelo próprio
//        nó (texto que transborda com overflow escondido — elidir); e a página
//        com rolagem horizontal;
//   (d′) triagem — o resto do que difere: o nó ficou > 40 % mais alto, ou mais
//        estreito E mais alto (quebrou linha);
//   errata candidata — contra a folha (a moldura C ou B da seção do estado,
//        quando a superfície já está implementada): |Δ| > 4 px em x, y, w ou h.
//        O PAR com a folha (I1-PR6, decisão 7; div. 641) é pelo TEXTO SEM O PAPEL
//        (a folha é de `div`: "Esqueci a senha" é `texto` lá e `link` aqui) ou,
//        onde a folha escreve dado de exemplo, pelo `data-testid` da âncora
//        (`t:<testid>`); nó sem texto nem testid não tem par possível. Os nós SEM
//        PAR, dos dois lados, são LISTADOS (antes a comparação os pulava calada);
//   saídas, contadas À PARTE e nunca somadas ao (e)/(b) (a N3-D29):
//        nome-acessível — o texto de 1138 sumiu na largura W mas existe lá um
//        nó cujo nome acessível (aria-label) é esse texto (rótulo curto com
//        nome longo, I1-D7 item 4); ou — I1-PR13 (commit 2b, aval do veredito) —
//        o nó de 1138 tem o "nome longo" (`nl`: o aria-label CONTÉM o texto
//        visível) e na largura W há um nó sem par pela chave com o MESMO nome
//        acessível, também "nome longo", e o texto MAIS CURTO: é o mesmo controle
//        com o rótulo encurtado (*Adicionar* / `aria-label="Adicionar músicas a
//        X"`, nas três faixas);
//        rolagem — o nó está fora, NA VERTICAL, da área visível de um contêiner
//        que ROLA (overflow auto/scroll): não é corte, é rolagem.
//   Decisão 621 [Marcel, 2026-09-27]: fora NA HORIZONTAL de um contêiner que rola
//        é (b) "rolagem horizontal de contêiner" — salvo o contêiner marcado
//        `data-rolagem="painel"` (o corpo de conteúdo da resposta 19 da folha),
//        que conta como (d′).
//   I1-PR11 (div. 767, herança da I1-PR10): QUEBRA POR DADO, contada à parte das
//        candidatas (nunca reprova, nunca pede errata) — o nó de dado no lugar do
//        nó da folha, mesma largura, altura = k × entrelinha (k ≥ 2), e a CASCATA
//        de Δy abaixo dele (`quebrasPorDado`, `ehCascata`).
// A faixa A (411) não tem requisito próprio (DESIGN-I1 §4: "o que o G-faixa
// medir em 411 é saída contada à parte"): o (e) de 411 é contado, não reprova.
// ERRATA DA I1-D11 [Marcel, 2026-09-28] (I1-PR6, commit 4): "A só não quebra" = (b) = 0 em 411 —
//   o (b) de 411 (inclusive a página com rolagem horizontal) REPROVA; o (e) de 411 segue listado
//   (as "inalcançáveis em A", decisão 619). `reprovaB` diz em que larguras o (b) reprova.
// DIV. 677 [Marcel, 2026-09-28] (I1-PR6, commit 4b): em 411 o (e) TAMBÉM reprova — "empilha, não
//   esconde" vale em A. A lista das (e) de 411 continua saindo (é a herança), com contagem 0 como critério.
//
// Nó cru (o que o medidor grava): { k, role, tag, testid, h_texto, h_nome, n,
//   x, y, w, h, sr, clip: {x,y,w,h,rolagem,painel} | null, emPainel?: {x,y,w,h} (I1-PR10), nl?: true (I1-PR13), corta: {x,y} }
//   k = chave de identidade estável entre larguras (testid, ou papel + hash do
//   texto, com o nº da ocorrência); h_texto/h_nome = sha256 (12 hex) do texto
//   visível e do aria-label — o texto em claro não vai para o JSON de superfície
//   com conteúdo do usuário (regra "anexo não carrega texto de música").

export const TOL_CORTE = 1 // px — arredondamento de subpixel
export const TOL_FOLHA = 4 // px — I1-D13
export const REFERENCIA = "1138"
export const REPROVAM = ["1138", "711", "411"] // o (e) reprova nas três (div. 677; em A a lista também sai)
export const REPROVAM_B = ["1138", "711", "411"] // o (b) reprova nas três (errata da I1-D11)

const temArea = (n) => n && n.w > 0 && n.h > 0

/** A chave do par com a folha: testid, ou o hash do texto (ou do nome acessível) sem o papel, com a ocorrência. */
export function chavesDeFolha(nos) {
  const vistos = new Map()
  const out = []
  for (const n of nos) {
    if (!temArea(n) || n.sr) continue
    const base = n.testid ? `t:${n.testid}` : n.h_texto ? `x:${n.h_texto}` : n.h_nome ? `x:${n.h_nome}` : null
    if (!base) continue
    const i = (vistos.get(base) ?? 0) + 1
    vistos.set(base, i)
    out.push([`${base}#${i}`, n])
  }
  return new Map(out)
}
const dentro = (a, lo, hi) => a >= lo - TOL_CORTE && a <= hi + TOL_CORTE

/** (b) de uma medição (uma largura). */
export function cortes(medicao) {
  const out = []
  const vw = medicao.viewport.w
  if (medicao.doc.scrollWidth > medicao.doc.clientWidth + TOL_CORTE)
    out.push({ k: "(página)", tipo: "página com rolagem horizontal", de: medicao.doc.clientWidth, para: medicao.doc.scrollWidth })
  const rolagem = [], painel = []
  for (const n of medicao.nos) {
    if (!temArea(n) || n.sr) continue
    // I1-PR10 (div. 758): o nó que passa da borda do viewport DENTRO do painel marcado que rola na horizontal (a linha
    // longa, a página do PDF com zoom) está recortado pelo PAINEL antes do viewport — é a rolagem do painel da decisão
    // 621, (d′), não (b). Antes a borda do viewport era testada primeiro e o painel nunca chegava a valer para ele.
    // O painel é o `emPainel` que a coleta grava (o marcado acima do nó, mesmo sob outro recorte — a camada de texto
    // da página do PDF), ou o próprio recorte, quando é ele o painel.
    const P = n.emPainel ?? (n.clip?.painel && n.clip.rolagem ? n.clip : null)
    if (P && (!dentro(n.x, P.x, P.x + P.w) || !dentro(n.x + n.w, P.x, P.x + P.w))) { painel.push({ k: n.k }); continue }
    if (n.x < -TOL_CORTE || n.x + n.w > vw + TOL_CORTE) { out.push({ k: n.k, tipo: "borda do viewport", x: n.x, w: n.w, vw }); continue }
    if (n.clip) {
      const c = n.clip
      const foraX = !dentro(n.x, c.x, c.x + c.w) || !dentro(n.x + n.w, c.x, c.x + c.w)
      const foraY = !dentro(n.y, c.y, c.y + c.h) || !dentro(n.y + n.h, c.y, c.y + c.h)
      if (foraX || foraY) {
        if (!c.rolagem) { out.push({ k: n.k, tipo: "borda do contêiner", no: [n.x, n.y, n.w, n.h], clip: [c.x, c.y, c.w, c.h] }); continue }
        // decisão 621 [Marcel, 2026-09-27]: rolagem HORIZONTAL de contêiner é (b), salvo o painel
        // marcado `data-rolagem="painel"` (o corpo de conteúdo, resposta 19 da folha), que é (d′).
        // Fora só na vertical, num contêiner que rola, segue saída "rolagem" (N3-D29).
        // (Um eixo `visible` com o outro `auto` computa `auto`: fora em x num contêiner que rola = rola em x.)
        if (foraX && c.painel) painel.push({ k: n.k })
        else if (foraX) { out.push({ k: n.k, tipo: "rolagem horizontal de contêiner", no: [n.x, n.y, n.w, n.h], clip: [c.x, c.y, c.w, c.h] }); continue }
        else rolagem.push({ k: n.k })
      }
    }
    if (n.corta && (n.corta.x || n.corta.y)) out.push({ k: n.k, tipo: "conteúdo cortado no próprio nó", eixo: n.corta.x ? "x" : "y" })
  }
  return { b: out, rolagem, painel }
}

/**
 * I1-PR11 (div. 767): a QUEBRA POR DADO — o nó de dado (sem par por texto dos dois lados: o texto real não é o da
 * folha) que ocupa o MESMO lugar do nó da folha (|Δx|, |Δy|, |Δw| ≤ 4) e está mais alto por ter quebrado linha: altura
 * = k × entrelinha, k inteiro ≥ 2. A entrelinha é a altura do mesmo nó (mesma chave) na referência, 1138, onde o dado
 * cabe numa linha; sem ele na referência, a altura do nó da folha. Devolve [{ k, par, linhas, extra, y }] — `par` é a
 * chave do nó da folha, `extra` o quanto o nó cresceu contra ela, `y` o topo dele na folha.
 */
export function quebrasPorDado(semPar, a, f, refK) {
  const out = []
  const folhaSemPar = semPar.folha.map((s) => f.get(s.par)).filter(Boolean)
  for (const s of semPar.app) {
    const n = a.get(s.par)
    if (!n) continue
    const g = folhaSemPar.find((x) => Math.abs(n.x - x.x) <= TOL_FOLHA && Math.abs(n.y - x.y) <= TOL_FOLHA && Math.abs(n.w - x.w) <= TOL_FOLHA)
    if (!g || n.h <= g.h + TOL_FOLHA) continue
    const r = refK?.get(n.k)
    const L = r && temArea(r) ? r.h : g.h
    const k = Math.round(n.h / L)
    if (k >= 2 && Math.abs(n.h - k * L) <= TOL_FOLHA) out.push({ k: n.k, par: g.k, linhas: k, extra: Math.round((n.h - g.h) * 10) / 10, y: g.y })
  }
  return out
}

/**
 * A CASCATA de uma quebra por dado: a errata candidata que só DESCEU (|Δx|, |Δw|, |Δh| ≤ 4; Δy > 4), cujo topo na folha
 * está na altura da quebra ou abaixo dela, e desceu no máximo o que as quebras acima dela cresceram (Δy ≤ Σ extra + 4 —
 * o que é centrado no cabeçalho desce a metade). Sem quebra acima, ou com Δ além disso, segue errata candidata.
 */
export function ehCascata(o, g, quebras) {
  if (!g) return false
  const [dx, dy, dw, dh] = o.delta
  if (Math.abs(dx) > TOL_FOLHA || Math.abs(dw) > TOL_FOLHA || Math.abs(dh) > TOL_FOLHA || dy <= TOL_FOLHA) return false
  const acima = quebras.filter((q) => g.y >= q.y - TOL_FOLHA)
  return acima.length > 0 && dy <= acima.reduce((s, q) => s + q.extra, 0) + TOL_FOLHA
}

/** Classifica um estado inteiro: { larguras: { "1138": medicao, … }, folha?: { C: nos, B: nos } }. */
export function classificarEstado(estado) {
  const res = {}
  const ref = estado.larguras[REFERENCIA]
  const porK = (nos) => new Map(nos.map((n) => [n.k, n]))
  const refK = ref ? porK(ref.nos) : null
  for (const [L, med] of Object.entries(estado.larguras)) {
    const { b, rolagem, painel } = cortes(med)
    const e = [], dl = painel.map((o) => ({ k: o.k, painel: "rolagem horizontal do painel marcado (decisão 621)" })), nomeAcessivel = []
    if (refK && L !== REFERENCIA) {
      const aqui = porK(med.nos)
      const nomes = new Set(med.nos.filter(temArea).map((n) => n.h_nome).filter(Boolean))
      // I1-PR13 (2b; I1-D7 item 4): rótulo curto COM nome acessível longo. O nó de 1138 tem o "nome longo" (`nl`: o
      // `aria-label` contém o texto visível — a coleta o grava) e, na largura W, há um nó SEM PAR pela chave (o texto
      // mudou), com área, fora do leitor de tela, com o MESMO nome acessível, também "nome longo" e com o texto MAIS
      // CURTO: o rótulo encolheu, o nome diz o que ele dizia. Um nó de W serve a um só de 1138. NÃO vale para o nó cujo
      // nome não contém o texto — o cartão que perde um bloco de conteúdo em 711 (`cn-main/library.json`: 20 cartões,
      // o mesmo `aria-label`, 12 caracteres a menos) segue (e) "texto some do nó".
      const usados = new Set()
      const mesmoNome = (r) => {
        if (!r.nl || !r.h_nome) return false
        const n = med.nos.find((x) => !refK.has(x.k) && !usados.has(x.k) && temArea(x) && !x.sr && x.nl && x.h_nome === r.h_nome && x.n < r.n)
        if (n) usados.add(n.k)
        return !!n
      }
      // Par ESTRUTURAL (div. 630): a chave muda quando o texto do nó muda, e um controle que só
      // perdeu parte do texto (o `hidden md:flex` dentro do card) viraria "sem nó". Sem par pela
      // chave, o nó de mesmo papel+tag na mesma ordem, que também ficou sem par, é o mesmo nó.
      const grupo = (nos) => { const g = new Map(); for (const n of nos) { const t = `${n.role}|${n.tag}`; g.set(t, [...(g.get(t) ?? []), n]) } return g }
      const gRef = grupo(ref.nos), gAqui = grupo(med.nos)
      const semParAqui = new Set(med.nos.filter((n) => !refK.has(n.k)).map((n) => n.k))
      const parEstrutural = (r) => {
        const t = `${r.role}|${r.tag}`, i = gRef.get(t).indexOf(r), n = gAqui.get(t)?.[i]
        return n && semParAqui.has(n.k) ? n : null
      }
      for (const [k, r] of refK) {
        if (!temArea(r) || r.sr) continue
        const n = aqui.get(k)
        if (!n) {
          const saida = (r.h_texto && nomes.has(r.h_texto)) || mesmoNome(r)
          const p = saida ? null : parEstrutural(r)
          if (saida) nomeAcessivel.push({ k })
          else if (p && temArea(p) && p.n < r.n) e.push({ k, tipo: "texto some do nó", n: [r.n, p.n] })
          else if (p && temArea(p)) dl.push({ k, de: [r.w, r.h], para: [p.w, p.h], texto: "trocado" })
          else e.push({ k, tipo: "sem nó", ref: [r.x, r.y, r.w, r.h] })
        } else if (!temArea(n)) e.push({ k, tipo: "largura zero", w: n.w, h: n.h })
        else if (n.h > r.h * 1.4 || (n.w < r.w - 1 && n.h > r.h + 1)) dl.push({ k, de: [r.w, r.h], para: [n.w, n.h] })
      }
    }
    const faixa = L === "1138" ? "C" : L === "711" ? "B" : null
    let errata = []
    const semPar = { folha: [], app: [] }
    const quebraPorDado = { nos: [], cascata: [] }
    if (faixa && estado.folha?.[faixa]) {
      const f = chavesDeFolha(estado.folha[faixa])
      const a = chavesDeFolha(med.nos)
      const naFolha = new Map() // k do app → o nó da folha do par (para a cascata)
      for (const [ch, n] of a) {
        const g = f.get(ch)
        if (!g) { semPar.app.push({ k: n.k, par: ch }); continue }
        const d = ["x", "y", "w", "h"].map((c) => Math.round((n[c] - g[c]) * 10) / 10)
        if (d.some((v) => Math.abs(v) > TOL_FOLHA)) { errata.push({ k: n.k, delta: d }); naFolha.set(n.k, g) }
      }
      for (const [ch, g] of f) if (!a.has(ch)) semPar.folha.push({ k: g.k, par: ch, rotulo: g.rotulo })
      const q = quebrasPorDado(semPar, a, f, refK)
      if (q.length) {
        quebraPorDado.nos = q
        const resto = []
        for (const o of errata) (ehCascata(o, naFolha.get(o.k), q) ? quebraPorDado.cascata : resto).push(o)
        errata = resto
      }
    }
    res[L] = { e, b, dl, errata, quebraPorDado, semPar, saidas: { nomeAcessivel: nomeAcessivel.length, rolagem: rolagem.length }, reprova: REPROVAM.includes(L), reprovaB: REPROVAM_B.includes(L) }
  }
  return res
}

/** Soma por largura de uma superfície inteira. */
export function resumo(superficie) {
  const tot = {}
  for (const [id, estado] of Object.entries(superficie.estados)) {
    const c = classificarEstado(estado)
    for (const [L, r] of Object.entries(c)) {
      const t = (tot[L] ??= { e: 0, b: 0, dl: 0, errata: 0, quebraPorDado: 0, semParFolha: 0, semParApp: 0, nomeAcessivel: 0, rolagem: 0, reprova: r.reprova, reprovaB: r.reprovaB, estados: [] })
      t.e += r.e.length; t.b += r.b.length; t.dl += r.dl.length; t.errata += r.errata.length
      t.quebraPorDado += r.quebraPorDado.cascata.length
      t.semParFolha += r.semPar.folha.length; t.semParApp += r.semPar.app.length
      t.nomeAcessivel += r.saidas.nomeAcessivel; t.rolagem += r.saidas.rolagem
      t.estados.push(id)
    }
  }
  return tot
}
