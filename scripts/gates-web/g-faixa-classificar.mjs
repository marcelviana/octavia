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
//        quando a superfície já está implementada): |Δ| > 4 px em x, y, w ou h;
//   saídas, contadas À PARTE e nunca somadas ao (e)/(b) (a N3-D29):
//        nome-acessível — o texto de 1138 sumiu na largura W mas existe lá um
//        nó cujo nome acessível (aria-label) é esse texto (rótulo curto com
//        nome longo, I1-D7 item 4);
//        rolagem — o nó está fora da área visível de um contêiner que ROLA
//        (overflow auto/scroll): não é corte, é rolagem.
// A faixa A (411) não tem requisito próprio (DESIGN-I1 §4: "o que o G-faixa
// medir em 411 é saída contada à parte"): o (e)/(b) de 411 é contado, não reprova.
//
// Nó cru (o que o medidor grava): { k, role, tag, testid, h_texto, h_nome, n,
//   x, y, w, h, sr, clip: {x,y,w,h,rolagem} | null, corta: {x,y} }
//   k = chave de identidade estável entre larguras (testid, ou papel + hash do
//   texto, com o nº da ocorrência); h_texto/h_nome = sha256 (12 hex) do texto
//   visível e do aria-label — o texto em claro não vai para o JSON de superfície
//   com conteúdo do usuário (regra "anexo não carrega texto de música").

export const TOL_CORTE = 1 // px — arredondamento de subpixel
export const TOL_FOLHA = 4 // px — I1-D13
export const REFERENCIA = "1138"
export const REPROVAM = ["1138", "711"] // C e B; A (411) é saída contada à parte

const temArea = (n) => n && n.w > 0 && n.h > 0
const dentro = (a, lo, hi) => a >= lo - TOL_CORTE && a <= hi + TOL_CORTE

/** (b) de uma medição (uma largura). */
export function cortes(medicao) {
  const out = []
  const vw = medicao.viewport.w
  if (medicao.doc.scrollWidth > medicao.doc.clientWidth + TOL_CORTE)
    out.push({ k: "(página)", tipo: "página com rolagem horizontal", de: medicao.doc.clientWidth, para: medicao.doc.scrollWidth })
  const rolagem = []
  for (const n of medicao.nos) {
    if (!temArea(n) || n.sr) continue
    if (n.x < -TOL_CORTE || n.x + n.w > vw + TOL_CORTE) { out.push({ k: n.k, tipo: "borda do viewport", x: n.x, w: n.w, vw }); continue }
    if (n.clip) {
      const c = n.clip
      const fora = !dentro(n.x, c.x, c.x + c.w) || !dentro(n.x + n.w, c.x, c.x + c.w) || !dentro(n.y, c.y, c.y + c.h) || !dentro(n.y + n.h, c.y, c.y + c.h)
      if (fora) {
        if (c.rolagem) rolagem.push({ k: n.k })
        else { out.push({ k: n.k, tipo: "borda do contêiner", no: [n.x, n.y, n.w, n.h], clip: [c.x, c.y, c.w, c.h] }); continue }
      }
    }
    if (n.corta && (n.corta.x || n.corta.y)) out.push({ k: n.k, tipo: "conteúdo cortado no próprio nó", eixo: n.corta.x ? "x" : "y" })
  }
  return { b: out, rolagem }
}

/** Classifica um estado inteiro: { larguras: { "1138": medicao, … }, folha?: { C: nos, B: nos } }. */
export function classificarEstado(estado) {
  const res = {}
  const ref = estado.larguras[REFERENCIA]
  const porK = (nos) => new Map(nos.map((n) => [n.k, n]))
  const refK = ref ? porK(ref.nos) : null
  for (const [L, med] of Object.entries(estado.larguras)) {
    const { b, rolagem } = cortes(med)
    const e = [], dl = [], nomeAcessivel = []
    if (refK && L !== REFERENCIA) {
      const aqui = porK(med.nos)
      const nomes = new Set(med.nos.filter(temArea).map((n) => n.h_nome).filter(Boolean))
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
          const p = r.h_texto && nomes.has(r.h_texto) ? null : parEstrutural(r)
          if (r.h_texto && nomes.has(r.h_texto)) nomeAcessivel.push({ k })
          else if (p && temArea(p) && p.n < r.n) e.push({ k, tipo: "texto some do nó", n: [r.n, p.n] })
          else if (p && temArea(p)) dl.push({ k, de: [r.w, r.h], para: [p.w, p.h], texto: "trocado" })
          else e.push({ k, tipo: "sem nó", ref: [r.x, r.y, r.w, r.h] })
        } else if (!temArea(n)) e.push({ k, tipo: "largura zero", w: n.w, h: n.h })
        else if (n.h > r.h * 1.4 || (n.w < r.w - 1 && n.h > r.h + 1)) dl.push({ k, de: [r.w, r.h], para: [n.w, n.h] })
      }
    }
    const faixa = L === "1138" ? "C" : L === "711" ? "B" : null
    const errata = []
    if (faixa && estado.folha?.[faixa]) {
      const f = porK(estado.folha[faixa])
      for (const n of med.nos) {
        const g = f.get(n.k)
        if (!g || !temArea(n)) continue
        const d = ["x", "y", "w", "h"].map((c) => Math.round((n[c] - g[c]) * 10) / 10)
        if (d.some((v) => Math.abs(v) > TOL_FOLHA)) errata.push({ k: n.k, delta: d })
      }
    }
    res[L] = { e, b, dl, errata, saidas: { nomeAcessivel: nomeAcessivel.length, rolagem: rolagem.length }, reprova: REPROVAM.includes(L) }
  }
  return res
}

/** Soma por largura de uma superfície inteira. */
export function resumo(superficie) {
  const tot = {}
  for (const [id, estado] of Object.entries(superficie.estados)) {
    const c = classificarEstado(estado)
    for (const [L, r] of Object.entries(c)) {
      const t = (tot[L] ??= { e: 0, b: 0, dl: 0, errata: 0, nomeAcessivel: 0, rolagem: 0, reprova: r.reprova, estados: [] })
      t.e += r.e.length; t.b += r.b.length; t.dl += r.dl.length; t.errata += r.errata.length
      t.nomeAcessivel += r.saidas.nomeAcessivel; t.rolagem += r.saidas.rolagem
      t.estados.push(id)
    }
  }
  return tot
}
