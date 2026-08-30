/**
 * B5 PR-3 — reconciliação bucket × tabela (B5-DESENHO.md §5.2).
 *
 * Modos:
 *   --report (default)          read-only ESTRITO: nenhum write em bucket/banco.
 *   --delete --lista <arquivo>  remoção GATEADA (B5-D2): só nomes da lista
 *                               nominal aprovada; re-verificação TOCTOU por
 *                               arquivo; delete via POST /api/storage/delete
 *                               (primeiro consumidor de sistema — B5-D6).
 *                               Primeira execução: O-1, pós-merge, sob aval.
 *
 * Env exigida: BASE_URL (app alvo), NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_FIREBASE_API_KEY, USER_AUDIT,
 * PASSWORD_AUDIT; opcional VERCEL_BYPASS (header de Deployment Protection).
 *
 * Saída do relatório: path EFÊMERO (mkdtemp — nunca em docs/, padrão do
 * guard de histórico da fase-d) + resumo no stdout.
 */
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  parseArgs, parseRef, cruzar, podeDeletar,
  IDADE_MINIMA_DIAS, type BucketObj, type DbRef,
} from './reconcile-core'
import { contentMatchesDeclaredMime } from '../../lib/file-signatures'

const BASE = process.env.BASE_URL!
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'
const SH = { apikey: SRK, Authorization: `Bearer ${SRK}` }

function exigirEnv(): void {
  const faltando = ['BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY', 'USER_AUDIT', 'PASSWORD_AUDIT']
    .filter((k) => !process.env[k])
  if (faltando.length) throw new Error(`env ausente: ${faltando.join(', ')}`)
}

async function idToken(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.USER_AUDIT,
        password: process.env.PASSWORD_AUDIT,
        returnSecureToken: true,
      }),
    }
  )
  if (!res.ok) throw new Error(`signIn falhou: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { idToken: string }).idToken
}

function authHeaders(token: string): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (process.env.VERCEL_BYPASS) h['x-vercel-protection-bypass'] = process.env.VERCEL_BYPASS
  return h
}

// (1) Lista o bucket via GET /api/storage/list — dogfooding do endpoint
// novo, com auth real; paginação por página-curta (count < limit).
async function listarViaApp(token: string): Promise<BucketObj[]> {
  const objetos: BucketObj[] = []
  const limit = 1000
  for (let offset = 0; ; offset += limit) {
    const res = await fetch(`${BASE}/api/storage/list?limit=${limit}&offset=${offset}`, {
      headers: authHeaders(token),
    })
    if (!res.ok) throw new Error(`GET /api/storage/list: ${res.status} ${await res.text()}`)
    const page = (await res.json()) as { objects: BucketObj[]; count: number }
    objetos.push(...page.objects)
    if (page.count < limit) break
  }
  return objetos
}

// (2) Refs do banco — as MESMAS queries do pre-check §2.3 (PostgREST,
// service role, leitura).
async function lerRefs(): Promise<DbRef[]> {
  const j = async (res: Response) => {
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
    return res.json()
  }
  const content = (await j(
    await fetch(`${SUPA}/rest/v1/content?select=id,file_url,thumbnail_url`, { headers: SH })
  )) as Array<{ id: string; file_url: string | null; thumbnail_url: string | null }>
  const profiles = (await j(
    await fetch(`${SUPA}/rest/v1/profiles?select=id,avatar_url`, { headers: SH })
  )) as Array<{ id: string; avatar_url: string | null }>

  const refs: DbRef[] = []
  for (const r of content) {
    if (r.file_url) refs.push({ origem: 'content.file_url', id: r.id, url: r.file_url })
    if (r.thumbnail_url) refs.push({ origem: 'content.thumbnail_url', id: r.id, url: r.thumbnail_url })
  }
  for (const p of profiles) {
    if (p.avatar_url) refs.push({ origem: 'profiles.avatar_url', id: p.id, url: p.avatar_url })
  }
  return refs
}

// (4) Primeiros 8KB por Range GET na URL pública + sniffer da PR-2.
// Timeout explícito por objeto (achado da 1ª execução na validação da
// PR-3: um hiccup de rede numa fetch SEM timeout pendurou o processo
// inteiro — "fetch failed" após ~10min); falha transitória vira
// "não avaliável" (null), nunca veredito.
async function verificarMime(obj: BucketObj): Promise<{ mimeMismatch: boolean | null; detected: string | null }> {
  if (!obj.contentType) return { mimeMismatch: null, detected: null }
  let res: Response
  try {
    res = await fetch(
      `${SUPA}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(obj.path)}`,
      { headers: { Range: 'bytes=0-8191' }, signal: AbortSignal.timeout(15_000) }
    )
  } catch {
    return { mimeMismatch: null, detected: null } // não avaliável — registrado como null
  }
  if (!res.ok) return { mimeMismatch: null, detected: null } // não avaliável — registrado como null
  const bytes = new Uint8Array(await res.arrayBuffer())
  const veredito = contentMatchesDeclaredMime(bytes, obj.contentType)
  return veredito.ok
    ? { mimeMismatch: false, detected: null }
    : { mimeMismatch: true, detected: veredito.detected }
}

async function modoReport(token: string): Promise<void> {
  const agora = new Date()
  const objetos = await listarViaApp(token)
  const refs = await lerRefs()
  const cruzamento = cruzar(objetos, refs, { bucket: BUCKET, agora })

  const mimes: Array<BucketObj & { mimeMismatch: boolean | null; detected: string | null }> = []
  for (const o of objetos) {
    const v = await verificarMime(o)
    mimes.push({ ...o, ...v })
  }
  const mentirosos = mimes.filter((m) => m.mimeMismatch === true)
  const naoAvaliaveis = mimes.filter((m) => m.mimeMismatch === null)

  const relatorio = {
    geradoEm: agora.toISOString(),
    alvo: BASE,
    bucket: BUCKET,
    totais: {
      objetos: objetos.length,
      refs: refs.length,
      orfaosA: cruzamento.orfaosA.length,
      orfaosARemoviveis: cruzamento.orfaosA.filter((o) => o.removivel).length,
      orfaosARecentes: cruzamento.orfaosA.filter((o) => !o.removivel).length,
      orfaosB: cruzamento.orfaosB.length,
      casados: cruzamento.casados.length,
      foraDoStorage: cruzamento.foraDoStorage.length,
      mentirososDeMime: mentirosos.length,
      mimeNaoAvaliavel: naoAvaliaveis.length,
    },
    idadeMinimaDias: IDADE_MINIMA_DIAS,
    orfaosA: cruzamento.orfaosA.map((o) => ({
      path: o.path,
      size: o.size,
      contentType: o.contentType,
      createdAt: o.createdAt,
      idadeDias: o.idadeDias === null ? null : Math.floor(o.idadeDias),
      marcacao: o.removivel ? `>${IDADE_MINIMA_DIAS} dias` : 'recente — fora da lista de remoção',
    })),
    orfaosB: cruzamento.orfaosB,
    casados: cruzamento.casados.map((c) => ({ origem: c.origem, id: c.id, path: c.ref.path })),
    foraDoStorage: cruzamento.foraDoStorage,
    mentirososDeMime: mentirosos.map((m) => ({
      path: m.path,
      contentTypeDeclarado: m.contentType,
      detected: m.detected,
    })),
  }

  const dir = mkdtempSync(join(tmpdir(), 'b5-reconcile-'))
  const arquivo = join(dir, 'relatorio.json')
  writeFileSync(arquivo, JSON.stringify(relatorio, null, 2))

  console.log(`== RECONCILIAÇÃO (--report, read-only) · ${agora.toISOString()} · alvo ${BASE} ==`)
  console.log(JSON.stringify(relatorio.totais, null, 2))
  console.log(`\n-- ÓRFÃOS TIPO A (${relatorio.orfaosA.length}) --`)
  for (const o of relatorio.orfaosA) console.log(JSON.stringify(o))
  console.log(`\n-- ÓRFÃOS TIPO B (${relatorio.orfaosB.length}) --`)
  for (const o of relatorio.orfaosB) console.log(JSON.stringify(o))
  console.log(`\n-- CASADOS (${relatorio.casados.length}) --`)
  for (const c of relatorio.casados) console.log(JSON.stringify(c))
  console.log(`\n-- FORA DO PADRÃO DE URL DO STORAGE (${relatorio.foraDoStorage.length}) --`)
  for (const f of relatorio.foraDoStorage) console.log(JSON.stringify(f))
  console.log(`\n-- MENTIROSOS DE MIME (${relatorio.mentirososDeMime.length}) --`)
  for (const m of relatorio.mentirososDeMime) console.log(JSON.stringify(m))
  console.log(`\nrelatório JSON: ${arquivo}`)
}

async function existeNoBucket(path: string): Promise<boolean> {
  // Falha transitória → false → podeDeletar PULA o arquivo (conservador:
  // na dúvida, nada é deletado). Mesmo timeout da verificação de MIME.
  try {
    const res = await fetch(
      `${SUPA}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path)}`,
      { method: 'HEAD', signal: AbortSignal.timeout(15_000) }
    )
    return res.ok
  } catch {
    return false
  }
}

async function modoDelete(token: string, listaArquivo: string): Promise<void> {
  const nomes = readFileSync(listaArquivo, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const listaAprovada = new Set(nomes)
  console.log(`== RECONCILIAÇÃO (--delete) · lista nominal: ${nomes.length} nomes ==`)
  console.log(`saldo esperado declarado ANTES: bucket perde ${nomes.length} objetos (menos os pulados)`)

  let deletados = 0
  let pulados = 0
  for (const nome of nomes) {
    // Guarda TOCTOU (§5.2): existência + ausência de ref RELIDAS no instante
    const existe = await existeNoBucket(nome)
    const refsAgora = await lerRefs()
    const aindaSemRef = !refsAgora.some((r) => {
      const ref = parseRef(r.url)
      return ref !== null && ref.bucket === BUCKET && ref.path === nome
    })
    const veredito = podeDeletar(nome, listaAprovada, existe, aindaSemRef)
    if (!veredito.ok) {
      console.log(`PULADO  ${nome} — ${veredito.motivo}`)
      pulados++
      continue
    }
    const res = await fetch(`${BASE}/api/storage/delete`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: nome }),
    })
    console.log(`${res.ok ? 'DELETADO' : 'FALHOU'}  ${nome} — ${res.status} ${(await res.text()).slice(0, 120)}`)
    if (res.ok) deletados++
  }
  console.log(`\nresultado: deletados=${deletados} pulados=${pulados} de ${nomes.length}`)
}

async function main(): Promise<void> {
  exigirEnv()
  const modo = parseArgs(process.argv.slice(2))
  const token = await idToken()
  if (modo.modo === 'report') await modoReport(token)
  else await modoDelete(token, modo.lista)
}

main().catch((e) => {
  console.error('ERRO:', e instanceof Error ? e.message : e)
  process.exit(1)
})
