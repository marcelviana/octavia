#!/usr/bin/env node
/**
 * SY-PR3 — a ANÁLISE do custo, ANTES e DEPOIS (a cópia da `SY-PR1-anexos/instrumentos/custo-analise.mjs`, com o PISO no
 * caminho da PR-3 e as medianas e o critério da SY-D36 no fim). Lê o que o `custo-pr3.py` gravou por rodada.
 *
 * As janelas, por rodada (instantes do aparelho, ms de época; o `t_setlists` e o `t_ok` saem do logcat da rodada):
 *   - PISO: [t_rol + 3 s, t_rol + 23 s] — a rolagem ligada, nenhum sync (o da abertura já terminou; o disparo vem
 *     depois) (20 s);
 *   - SYNC: [t_ok − 5 s, t_ok + 15 s] — a resposta do content chegando, a leitura, o `reconcile`, a gravação, o
 *     `sync ok`, a troca da raiz e o render, o plano de arquivos (20 s);
 *   - CONTROLE (a), nas rodadas que o têm: o intervalo que contém o fim da tarefa de 200 ms (`travar`).
 * Um intervalo entre quadros pertence à janela do quadro que o FECHA.
 *
 * Por janela: o maior intervalo e quantos passaram de 16,7, de 50 e de 100 ms (o sensor); e o maior intervalo entre
 * dois eventos de rolagem (`uiautomator events`, o `ScrollY` da `ScrollView` do palco) — a resolução dele é a do evento
 * de acessibilidade (~100 ms), e ele vê PAUSA longa, não quadro.
 *
 * O que custou cada passo (se o instrumento separa): para cada intervalo > 50 ms da janela do sync, as linhas
 * `OCTAVIA:` saídas DENTRO dele (o JS que estava preso ali).
 *
 *   node custo-analise.mjs <dir-da-rodada> [rótulo-do-aparelho]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [dir, aparelho = 'AVD'] = process.argv.slice(2)
if (!dir) throw new Error('uso: custo-analise.mjs <dir> [aparelho]')
const rodadas = readdirSync(dir).filter((f) => /^r\d+-sensor\.json$/.test(f)).map((f) => f.slice(0, 3)).sort()

const f1 = (x) => x.toFixed(1)
function janela(ts, de, ate) {
  const ds = []
  for (let i = 1; i < ts.length; i++) if (ts[i] >= de && ts[i] <= ate) ds.push({ fim: ts[i], d: ts[i] - ts[i - 1] })
  return ds
}
function resumo(ds) {
  const max = ds.reduce((m, x) => Math.max(m, x.d), 0)
  return { n: ds.length, max, a16: ds.filter((x) => x.d > 16.7).length, a50: ds.filter((x) => x.d > 50).length, a100: ds.filter((x) => x.d > 100).length }
}
function eventos(rot) {
  const p = join(dir, `${rot}-eventos.txt`)
  if (!existsSync(p)) return []
  const bruto = readFileSync(p, 'utf8')
  const m0 = /uptime_ms=(\d+) epoca_ms=(\d+)/.exec(bruto)
  if (m0 === null) return []
  const up = Number(m0[1])
  const ep = Number(m0[2])
  const out = []
  // SY-PR3 (div. 1290): no Tab o `EventTime` (o `uptimeMillis`, sem o sono profundo) NÃO tem a base do `/proc/uptime` do
  // cabeçalho — mapeado por ele, nenhum evento caía nas janelas e a lacuna saía 0 (o critério do release passava VAZIO).
  // Quando o mapeado se afasta mais de 2 s do relógio da própria linha (`MM-DD HH:MM:SS.mmm`, o fuso do aparelho = o do
  // host, -03), vale o relógio da linha. No AVD as duas bases coincidem (os números do AVD não mudam: conferido).
  const ano = new Date(ep).getFullYear()
  const daLinha = (l) => {
    const m = /^(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)\.(\d{3}) /.exec(l)
    return m === null ? null : new Date(ano, Number(m[1]) - 1, Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])).getTime()
  }
  for (const l of bruto.split('\n')) {
    const t = /EventTime: (\d+)/.exec(l)
    const y = /ClassName: android\.widget\.ScrollView;[^\n]*?ScrollY: (-?\d+); MaxScrollX: -?\d+; MaxScrollY: (\d+)/.exec(l)
    if (!(t && y && Number(y[2]) > 0)) continue
    const mapeado = ep + (Number(t[1]) - up)
    const relogio = daLinha(l)
    out.push({ t: relogio !== null && Math.abs(relogio - mapeado) > 2000 ? relogio : mapeado, y: Number(y[1]) })
  }
  return out
}
function lacunaDeRolagem(evs, de, ate) {
  const dentro = evs.filter((e) => e.t >= de && e.t <= ate)
  let max = 0
  for (let i = 1; i < dentro.length; i++) max = Math.max(max, dentro[i].t - dentro[i - 1].t)
  const andou = dentro.length > 1 ? dentro[dentro.length - 1].y - dentro[0].y : 0
  return { n: dentro.length, max, andou }
}

const acum = []
const linhasSync = []
const linhasPiso = []
const controles = []
const passos = []
for (const rot of rodadas) {
  const s = JSON.parse(readFileSync(join(dir, `${rot}-sensor.json`), 'utf8'))
  const log = readFileSync(join(dir, `${rot}-logcat.txt`), 'utf8').split('\n')
  const cab = /t_open=(\d+) t_rol=(\d+) t_pedido=(\d+) t_ok=(\d+)/.exec(log[0])
  const [, tOpen, tRol, , tOk] = cab.map(Number)
  const tS = tRol - 7_000 // o PISO: [t_rol + 3 s, t_rol + 23 s] = [tS + 10 s, tS + 30 s]
  const linhas = log.slice(1).filter(Boolean).map((l) => ({ t: Number(l.slice(0, l.indexOf(' '))), l: l.slice(l.indexOf(' ') + 1) }))
  const ts = s.t
  const evs = eventos(rot)
  const piso = resumo(janela(ts, tS + 10_000, tS + 30_000))
  const sjan = janela(ts, tOk - 5_000, tOk + 15_000)
  const sync = resumo(sjan)
  const lp = lacunaDeRolagem(evs, tS + 10_000, tS + 30_000)
  const ls = lacunaDeRolagem(evs, tOk - 5_000, tOk + 15_000)
  // o `cache write` do sync DISPARADO (depois do `t_pedido`), não o da abertura
  const tPed = Number(/t_pedido=(\d+)/.exec(log[0])[1])
  const invalid = (linhas.find((x) => x.t >= tPed && x.l.startsWith('cache write kind=content')) ?? { l: '?' }).l.replace('cache write kind=content ', '')
  acum.push({ sMax: sync.max, s100: sync.a100, pMax: piso.max, p100: piso.a100, sLac: ls.max, pLac: lp.max })
  linhasSync.push(`| ${rot} | ${sync.n} | **${f1(sync.max)}** | ${sync.a16} | ${sync.a50} | ${sync.a100} | ${ls.n} · ${ls.max} ms · ${ls.andou} px | ${invalid} |`)
  linhasPiso.push(`| ${rot} | ${piso.n} | **${f1(piso.max)}** | ${piso.a16} | ${piso.a50} | ${piso.a100} | ${lp.n} · ${lp.max} ms · ${lp.andou} px |`)
  if (existsSync(join(dir, `${rot}-controle.json`))) {
    const c = JSON.parse(readFileSync(join(dir, `${rot}-controle.json`), 'utf8'))
    const ds = janela(ts, c.em - 50, c.em + 500)
    const m = ds.reduce((a, x) => (x.d > a.d ? x : a), { d: 0, fim: 0 })
    controles.push(`| ${rot} | ${f1(c.travou)} ms | **${f1(m.d)} ms** | ${Math.round(m.fim - c.em)} ms |`)
  }
  for (const x of sjan.filter((x) => x.d > 50)) {
    const dentro = linhas.filter((y) => y.t > x.fim - x.d && y.t <= x.fim).map((y) => y.l.replace(/ ms=\d+| t=\d+/g, ''))
    passos.push(`| ${rot} | ${f1(x.d)} | ${x.fim - tOk >= 0 ? '+' : ''}${Math.round(x.fim - tOk)} ms | ${dentro.length ? dentro.map((d) => '`' + d + '`').join(' · ') : '—'} |`)
  }
  void tOpen
}

console.log(`# o custo — ${aparelho}, ${rodadas.length} rodadas (${dir})\n`)
console.log('## SYNC — [t_ok − 5 s, t_ok + 15 s]\n')
console.log('| rodada | quadros | maior intervalo (ms) | > 16,7 ms | > 50 ms | > 100 ms | rolagem (uiautomator: eventos · maior lacuna · andou) | o `cache write` do content |')
console.log('|---|---|---|---|---|---|---|---|')
console.log(linhasSync.join('\n'))
console.log('\n## PISO — a rolagem ligada, sem sync: [t_rol + 3 s, t_rol + 23 s]\n')
console.log('| rodada | quadros | maior intervalo (ms) | > 16,7 ms | > 50 ms | > 100 ms | rolagem (uiautomator: eventos · maior lacuna · andou) |')
console.log('|---|---|---|---|---|---|---|')
console.log(linhasPiso.join('\n'))
console.log('\n## CONTROLE (a) — a tarefa plantada de 200 ms aparece no sensor?\n')
console.log('| rodada | a tarefa durou | o maior intervalo em volta | o quadro que a fechou, depois do fim dela |')
console.log('|---|---|---|---|')
console.log(controles.join('\n') || '| — | — | — | — |')
console.log('\n## O que estava no JS em cada intervalo > 50 ms da janela do sync (as linhas OCTAVIA saídas dentro dele)\n')
console.log('| rodada | intervalo (ms) | o quadro que o fechou, contra o `sync ok` | as linhas dentro |')
console.log('|---|---|---|---|')
console.log(passos.join('\n') || '| — | — | — | nenhum intervalo > 50 ms |')

const med = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const M = (k) => med(acum.map((x) => x[k]))
const lim = Math.max(2 * M('pMax'), 100)
console.log('\n## As medianas e o critério da SY-D36 (n = ' + acum.length + ')\n')
console.log(`- SYNC: maior intervalo, mediana **${f1(M('sMax'))} ms** · intervalos > 100 ms, mediana **${M('s100')}** · a maior lacuna do uiautomator, mediana **${M('sLac')} ms**`)
console.log(`- PISO: maior intervalo, mediana **${f1(M('pMax'))} ms** · intervalos > 100 ms, mediana **${M('p100')}** · a maior lacuna do uiautomator, mediana **${M('pLac')} ms**`)
console.log(`- (dev client) > 100 ms: ${M('s100')} ≤ ${M('p100')} + 1 = ${M('p100') + 1}? **${M('s100') <= M('p100') + 1 ? 'sim' : 'NÃO'}** · maior intervalo: ${f1(M('sMax'))} ≤ max(2 × ${f1(M('pMax'))}, 100) = ${f1(lim)}? **${M('sMax') <= lim ? 'sim' : 'NÃO'}** → **${M('s100') <= M('p100') + 1 && M('sMax') <= lim ? 'PASSA' : 'REPROVA'}**`)
console.log(`- (release, o uiautomator) a maior lacuna na janela do sync: mediana ${M('sLac')} ≤ ${M('pLac')} + 100 = ${M('pLac') + 100}? **${M('sLac') <= M('pLac') + 100 ? 'PASSA' : 'REPROVA'}** · rodada a rodada: ${acum.filter((x) => x.sLac <= M('pLac') + 100).length} de ${acum.length} dentro`)
