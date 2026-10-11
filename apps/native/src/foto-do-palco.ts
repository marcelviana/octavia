/**
 * A foto da SETLIST pela sessão do palco (SY-D7, SY-D22; `docs/native/SY-PRECHECK.md` A4.5 (b)).
 *
 * A setlist vale pela **sessão inteira** do palco: tirada ao entrar no palco de fora (de S2, ou de S1 pelo índice sem
 * `posicaoAtual`), solta ao voltar a S1/S2. O palco, o índice do palco, o fim e a busca na setlist leem a MESMA foto —
 * ordem e número de músicas só mudam ao sair do palco. No código não há "sessão" (div. 1260: o salto pelo índice
 * desempilha o palco e cria outro), e por isso a foto mora ACIMA da instância, neste módulo, que o `native-tela`
 * consegue montar; o `navigation.tsx` só o liga (a ligação se prova no aparelho, A-SY-17).
 *
 * **SY-PR1: CONTRATO INERTE.** A assinatura e os tipos; a leitura devolve a setlist VIVA (o comportamento de hoje),
 * `entrar` e `sair` não guardam nada. Nenhuma tela o chama nesta PR. Existe para o gate (iii) (`test/sy-foto.test.tsx`)
 * ter o que importar; os casos da sessão reprovam pela lista, e a **PR-3** os esvazia implementando ESTE arquivo.
 *
 * A foto do CONTEÚDO (o texto da música, por abertura, no palco e em V) não mora aqui: é estado de cada tela (a PR-3,
 * no `StageScreen.tsx` e no `VisualizacaoScreen.tsx`), e a estrela de V fica viva (SY-D21).
 */
import type { SetlistDTO } from '@octavia/core'

/** A busca de hoje: a setlist viva da raiz pelo id (`acharSetlist`, `navigation.tsx`). */
export type AcharSetlist = (setlistId: string) => SetlistDTO | undefined

export interface FotoDaSessao {
  /** Entrar no palco DE FORA (de S2; de S1 pelo índice sem posição): tira a foto desta setlist. */
  entrar(setlistId: string, achar: AcharSetlist): void
  /**
   * O que o palco, o índice do palco, o fim e a busca na setlist leem: a foto, se a sessão é desta setlist; senão a
   * viva. Com a foto, uma setlist que um sync apagou continua de pé até o palco sair (SY-D23).
   */
  setlistDaSessao(setlistId: string, achar: AcharSetlist): SetlistDTO | undefined
  /** Voltar a S1/S2: solta a foto. */
  sair(): void
}

/** **SY-PR1: inerte** — a leitura é a viva; `entrar` e `sair` não guardam nada. Implementado na PR-3. */
export function criarFotoDaSessao(): FotoDaSessao {
  return {
    entrar: () => undefined,
    setlistDaSessao: (setlistId, achar) => achar(setlistId),
    sair: () => undefined,
  }
}
