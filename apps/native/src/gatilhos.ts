/**
 * Os gatilhos do sync automático — o T1-R13 passo 4 (SY-D4): **a rede volta com o app aberto**, e **a volta do segundo
 * plano depois de 30 s**. Sem sync periódico, sem gesto manual.
 *
 * **SY-PR1: CONTRATO INERTE.** Só a assinatura e os tipos: `ligarGatilhos` não liga nada e o desligar não desliga nada
 * — nenhum gatilho dispara, e o app faz o que fazia (sincroniza na entrada da sessão e no *Tentar de novo*). O
 * `App.tsx` **não** o chama nesta PR (a ligação é da PR-4). Existe para o gate (i) (`test/sy-gatilhos.test.tsx`) ter o
 * que importar; os casos "→ 1" reprovam pela lista `test/sy-reprovados.txt`, e a **PR-4** esvazia a parte deles
 * implementando ESTE arquivo — sem mudar a assinatura, salvo errata declarada no aval.
 *
 * O que a PR-4 implementa aqui (as regras: `docs/native/SY-PRECHECK.md` A2.3 e A2.4; SY-D17, SY-D18, SY-D28):
 *   - a rede: a transição `false → true` do ouvinte do `expo-network`; nunca a primeira leitura (`null → true`);
 *   - o segundo plano: o `AppState` de `background` a `active`, com a ausência medida pelo relógio (`Date.now()`);
 *   - a rede que volta em segundo plano não dispara e deixa a MARCA; a volta antes de 30 s com a marca conta como "a
 *     rede voltou"; a marca se apaga quando qualquer sync sai à rede;
 *   - o intervalo de 30 s, contado do fim do último sync que saiu à rede, para os dois gatilhos; não vale depois de
 *     falha de rede; vale depois de falha com status;
 *   - sem sessão, nada; sem rede na volta, nada — e nenhuma chamada ao executor;
 *   - a linha `sync trigger reason=… decision=…` (SY-D28; G3 70 → 71, adição declarada na PR-4).
 */

/** O que disparou (o `reason=` da linha `sync trigger`, SY-D28). */
export type MotivoDoGatilho = 'net' | 'foreground'

/** O que o gatilho decidiu (o `decision=` da linha `sync trigger`, SY-D28). */
export type DecisaoDoGatilho =
  | 'run'
  | 'queued'
  | 'skip-interval'
  | 'skip-short'
  | 'skip-offline'
  | 'skip-background'

/** A ausência mínima do T1-R13 passo 4: a volta do segundo plano só dispara depois de 30 s fora. */
export const AUSENCIA_MINIMA_MS = 30_000

/** O intervalo mínimo da SY-D18: 30 s do fim do último sync que saiu à rede. */
export const INTERVALO_MINIMO_MS = 30_000

/** O último sync que saiu à rede (emitiu `sync start`): quando começou, quando terminou (`null` = em voo) e como. */
export interface SyncNaRede {
  inicioMs: number
  fimMs: number | null
  /** `true` quando terminou em `sync fail … code=network` — a falha sem resposta HTTP (o prazo inclusive). */
  falhaDeRede: boolean
}

/** O que a raiz entrega aos gatilhos. */
export interface LigacaoDosGatilhos {
  /** O uid da sessão de agora; `null` fora dela (S0) — sem sessão, nenhum gatilho. */
  sessao: () => string | null
  /** Pede um sync ao executor — o voo único decide se ele roda ou fica marcado "de novo" (SY-D9, PR-2). */
  pedirSync: (motivo: MotivoDoGatilho) => void
  /** O último sync que saiu à rede, de qualquer origem (a abertura, o *Tentar de novo*, o "de novo", um gatilho). */
  ultimoSyncNaRede: () => SyncNaRede | null
}

/**
 * Liga os dois gatilhos e devolve o desligar. **SY-PR1: inerte** — não assina o `AppState` nem a rede, não chama
 * nada. Implementado na PR-4.
 */
export function ligarGatilhos(_ligacao: LigacaoDosGatilhos): () => void {
  return () => undefined
}
