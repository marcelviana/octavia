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
 * **SY-PR4, commit 1 — o contrato cresce, ainda inerte** (declarado; pergunta do aval): a SY-D49 (o palco aberto segura
 * os gatilhos), a SY-D56 (o avulso sem hospedeira também é palco) e a SY-D44 (o intervalo de uma sessão não segura o
 * gatilho de outra) pedem três coisas que a forma da SY-D33 não tinha: (1) `palco` na ligação — de onde os gatilhos
 * sabem que o palco está aberto e quando ele fecha (a foto da sessão, `foto-do-palco.ts`: nenhum estado duplicado);
 * (2) o `uid` no `SyncNaRede`; (3) o desligar devolvido ganha o `segurarDeNovo`, que o executor pergunta antes de rodar
 * o "de novo" do voo (SY-D49 (2)). E os valores novos da linha `sync trigger`: `reason=stage-exit|again`,
 * `decision=hold-stage` (os nomes são proposta desta PR, SY-D49 (3)).
 *
 * O que a PR-4 implementa aqui (as regras: `docs/native/SY-PRECHECK.md` A2.3 e A2.4; SY-D17, SY-D18, SY-D28, SY-D49):
 *   - a rede: a transição `false → true` do ouvinte do `expo-network`; nunca a primeira leitura (`null → true`);
 *   - o segundo plano: o `AppState` de `background` a `active`, com a ausência medida pelo relógio (`Date.now()`);
 *   - a rede que volta em segundo plano não dispara e deixa a MARCA; a volta antes de 30 s com a marca conta como "a
 *     rede voltou"; a marca se apaga quando qualquer sync sai à rede;
 *   - o intervalo de 30 s, contado do fim do último sync que saiu à rede, para os dois gatilhos; não vale depois de
 *     falha de rede; vale depois de falha com status;
 *   - sem sessão, nada; sem rede na volta, nada — e nenhuma chamada ao executor;
 *   - com o palco aberto, nenhum gatilho dispara: fica marcado e passa pelas regras ao fechar o palco (SY-D49);
 *   - a linha `sync trigger reason=… decision=…` (SY-D28; G3 70 → 71, adição declarada na PR-4).
 */

/**
 * O que disparou (o `reason=` da linha `sync trigger`, SY-D28): a rede, a volta do segundo plano, e — SY-PR4, SY-D49 —
 * o fechar do palco com um gatilho segurado (`stage-exit`) e o "de novo" do voo segurado pelo palco (`again`).
 */
export type MotivoDoGatilho = 'net' | 'foreground' | 'stage-exit' | 'again'

/** O que o gatilho decidiu (o `decision=` da linha `sync trigger`, SY-D28; `hold-stage` é da SY-D49). */
export type DecisaoDoGatilho =
  | 'run'
  | 'queued'
  | 'skip-interval'
  | 'skip-short'
  | 'skip-offline'
  | 'skip-background'
  | 'hold-stage'

/** A ausência mínima do T1-R13 passo 4: a volta do segundo plano só dispara depois de 30 s fora. */
export const AUSENCIA_MINIMA_MS = 30_000

/** O intervalo mínimo da SY-D18: 30 s do fim do último sync que saiu à rede. */
export const INTERVALO_MINIMO_MS = 30_000

/** O último sync que saiu à rede (emitiu `sync start`): de que sessão, quando começou, quando terminou (`null` = em voo) e como. */
export interface SyncNaRede {
  /** SY-PR4 (SY-D44): a sessão que pediu — o intervalo só vale contra um sync da sessão de agora. */
  uid: string
  inicioMs: number
  fimMs: number | null
  /** `true` quando terminou em `sync fail … code=network` — a falha sem resposta HTTP (o prazo inclusive). */
  falhaDeRede: boolean
}

/**
 * SY-PR4 (SY-D49, SY-D56) — o palco, como os gatilhos o leem: aberto ou não, e o aviso de quando fecha. Quem o
 * implementa é a foto da sessão (`foto-do-palco.ts`): a sessão do palco (de entrar de fora até voltar a S1/S2) ou um
 * palco avulso sem hospedeira montado.
 */
export interface PalcoDosGatilhos {
  palcoAberto(): boolean
  /** Chama `f` quando o palco passa de aberto a fechado; devolve o desligar. */
  aoFecharPalco(f: () => void): () => void
}

/** O que a raiz entrega aos gatilhos. */
export interface LigacaoDosGatilhos {
  /** O uid da sessão de agora; `null` fora dela (S0) — sem sessão, nenhum gatilho. */
  sessao: () => string | null
  /** Pede um sync ao executor — o voo único decide se ele roda ou fica marcado "de novo" (SY-D9, PR-2). */
  pedirSync: (motivo: MotivoDoGatilho) => void
  /** O último sync que saiu à rede, de qualquer origem (a abertura, o *Tentar de novo*, o "de novo", um gatilho). */
  ultimoSyncNaRede: () => SyncNaRede | null
  /** SY-PR4 (SY-D49) — o palco aberto segura os gatilhos. */
  palco: PalcoDosGatilhos
}

/**
 * O que `ligarGatilhos` devolve: o desligar (chamado como função, a forma da SY-D33) e — SY-PR4, SY-D49 (2) — o que o
 * executor pergunta antes de rodar o "de novo" do voo: `true` = o palco está aberto, o pedido ficou marcado para o
 * fechar dele, e o "de novo" não roda agora.
 */
export interface GatilhosLigados {
  (): void
  segurarDeNovo(): boolean
}

/**
 * Liga os dois gatilhos e devolve o desligar. **Inerte** (SY-PR1; o contrato estendido no commit 1 da SY-PR4) — não
 * assina o `AppState` nem a rede, não chama nada, e não segura nada. Implementado no commit 3 da PR-4.
 */
export function ligarGatilhos(_ligacao: LigacaoDosGatilhos): GatilhosLigados {
  return Object.assign(() => undefined, { segurarDeNovo: () => false })
}
