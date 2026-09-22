/**
 * O mock de aceite como aparato compartilhado (N2-PR3).
 *
 * É o mesmo `src/fixtures/aceite.py` que o `escrita.test.ts` da N2-PR2 sobe,
 * com os mesmos modos — extraído para cá porque agora há um segundo cliente:
 * os CNs de TELA (`s1-criar.test.tsx`). O `escrita.test.ts` **não foi
 * tocado**: os treze CNs da PR-2 continuam com o harness deles, palavra por
 * palavra, e nada desta PR pode fazê-los mudar de resposta.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { SetlistDTO } from '@octavia/core'

const ACEITE_PY = path.resolve(__dirname, '../src/fixtures/aceite.py')

export function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const e = s.address()
      const p = typeof e === 'object' && e !== null ? e.port : 0
      s.close(() => resolve(p))
    })
  })
}

export class Mock {
  private processo: ChildProcess | null = null

  constructor(
    readonly porta: number,
    private readonly dir: string,
  ) {}

  async parar(): Promise<void> {
    const s = this.processo
    this.processo = null
    if (s === null || s.exitCode !== null) return
    await new Promise<void>((resolve) => {
      s.once('exit', () => resolve())
      s.kill('SIGTERM')
    })
  }

  /** Sobe (ou re-sobe) o mock no modo pedido, servindo estes dois conjuntos. */
  async servir(modo: string, setlists: SetlistDTO[], biblioteca: unknown[]): Promise<void> {
    await this.parar()
    const fs = path.join(this.dir, 'setlists.json')
    const fc = path.join(this.dir, 'content.json')
    writeFileSync(fs, JSON.stringify(setlists))
    writeFileSync(fc, JSON.stringify(biblioteca))
    const s = spawn('python3', [ACEITE_PY, 'servidor', String(this.porta), modo, fs, fc], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.processo = s
    await new Promise<void>((resolve, reject) => {
      let saida = ''
      const t = setTimeout(() => reject(new Error(`mock não subiu: ${saida}`)), 10_000)
      const ler = (b: Buffer): void => {
        saida += b.toString()
        if (saida.includes('fixture: servidor')) {
          clearTimeout(t)
          resolve()
        }
      }
      s.stdout?.on('data', ler)
      s.stderr?.on('data', ler)
      s.once('exit', (code) => {
        clearTimeout(t)
        reject(new Error(`mock saiu com ${code}: ${saida}`))
      })
    })
    // A linha sai ANTES do bind (`aceite.py`): pronto é RESPONDER.
    const limite = Date.now() + 10_000
    for (;;) {
      try {
        const r = await fetch(`http://127.0.0.1:${this.porta}/api/setlists`)
        if (r.status === 200 || r.status === 401 || r.status === 500) return
      } catch {
        // ainda não aceita conexão
      }
      if (s.exitCode !== null || Date.now() > limite) throw new Error('mock não aceitou conexão')
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  /** O conjunto que o servidor tem AGORA, lido fora do app. */
  async doServidor(): Promise<SetlistDTO[]> {
    const r = await fetch(`http://127.0.0.1:${this.porta}/api/setlists`)
    return (await r.json()) as SetlistDTO[]
  }
}
