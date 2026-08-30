/**
 * B5 PR-3 — núcleo PURO da reconciliação bucket × tabela
 * (B5-DESENHO.md §5.2). Sem I/O: o script reconcile.ts injeta os dados.
 * `parseRef` é IDÊNTICO ao do pre-check (B5-PRECHECK.md, apêndice B) —
 * a lógica que mediu 87A/0B/8 casados, agora com teste unitário próprio.
 */

export type BucketObj = {
  path: string
  size: number | null
  contentType: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type DbRef = { origem: string; id: string; url: string }

export type ParsedRef = { bucket: string; path: string }

export const IDADE_MINIMA_DIAS = 7 // §5.2: órfão mais novo fica FORA da lista de remoção

export function parseRef(u: string): ParsedRef | null {
  const m = u.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/)
  if (!m) return null
  const [, bucket, path] = m
  if (!bucket || !path) return null
  return { bucket, path: decodeURIComponent(path) }
}

export type OrfaoA = BucketObj & { idadeDias: number | null; removivel: boolean }
export type Cruzamento = {
  orfaosA: OrfaoA[]
  orfaosB: Array<DbRef & { ref: ParsedRef }>
  casados: Array<DbRef & { ref: ParsedRef }>
  foraDoStorage: DbRef[]
}

export function cruzar(
  objects: BucketObj[],
  refs: DbRef[],
  opts: { bucket: string; agora: Date; idadeMinimaDias?: number }
): Cruzamento {
  const idadeMinima = opts.idadeMinimaDias ?? IDADE_MINIMA_DIAS
  const objSet = new Set(objects.map((o) => `${opts.bucket}/${o.path}`))

  const orfaosB: Cruzamento['orfaosB'] = []
  const casados: Cruzamento['casados'] = []
  const foraDoStorage: DbRef[] = []
  for (const r of refs) {
    const ref = parseRef(r.url)
    if (!ref) {
      foraDoStorage.push(r)
      continue
    }
    if (objSet.has(`${ref.bucket}/${ref.path}`)) casados.push({ ...r, ref })
    else orfaosB.push({ ...r, ref })
  }

  const referenced = new Set(casados.concat(orfaosB).map((r) => `${r.ref.bucket}/${r.ref.path}`))
  const orfaosA: OrfaoA[] = objects
    .filter((o) => !referenced.has(`${opts.bucket}/${o.path}`))
    .map((o) => {
      const idadeDias = o.createdAt
        ? (opts.agora.getTime() - new Date(o.createdAt).getTime()) / 86_400_000
        : null
      return {
        ...o,
        idadeDias,
        // sem createdAt legível → NÃO removível (conservador)
        removivel: idadeDias !== null && idadeDias > idadeMinima,
      }
    })

  return { orfaosA, orfaosB, casados, foraDoStorage }
}

// ---------------------------------------------------------------------------
// Modos de execução (guardas do CLI) — §5.2: --report default read-only;
// --delete exige --lista; mutuamente exclusivos; SEM modo "delete tudo".
// ---------------------------------------------------------------------------

export type Modo = { modo: 'report' } | { modo: 'delete'; lista: string }

export function parseArgs(argv: string[]): Modo {
  const args = [...argv]
  const temReport = args.includes('--report')
  const temDelete = args.includes('--delete')
  const iLista = args.indexOf('--lista')
  const lista = iLista !== -1 ? args[iLista + 1] : undefined

  const conhecidos = new Set(['--report', '--delete', '--lista'])
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === undefined) continue
    if (a === '--lista') {
      i++ // valor da lista
      continue
    }
    if (!conhecidos.has(a)) {
      throw new Error(`argumento desconhecido: ${a}`)
    }
  }

  if (temReport && temDelete) {
    throw new Error('--report e --delete são mutuamente exclusivos')
  }
  if (temDelete) {
    if (!lista) {
      throw new Error('--delete exige --lista <arquivo> (lista nominal aprovada — B5-D2); recusado')
    }
    return { modo: 'delete', lista }
  }
  if (iLista !== -1 && !temDelete) {
    throw new Error('--lista só existe junto de --delete')
  }
  return { modo: 'report' }
}

// Guarda TOCTOU do modo delete (§5.2): re-verificação NO INSTANTE da
// deleção — objeto precisa existir, seguir sem ref e estar na lista.
export function podeDeletar(
  nome: string,
  listaAprovada: ReadonlySet<string>,
  existeNoBucket: boolean,
  aindaSemRef: boolean
): { ok: true } | { ok: false; motivo: string } {
  if (!listaAprovada.has(nome)) return { ok: false, motivo: 'fora da lista aprovada' }
  if (!existeNoBucket) return { ok: false, motivo: 'objeto não existe mais no bucket' }
  if (!aindaSemRef) return { ok: false, motivo: 're-referenciado no banco entre o relatório e o delete (TOCTOU)' }
  return { ok: true }
}
