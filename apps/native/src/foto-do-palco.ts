/**
 * A foto da SETLIST pela sessão do palco (SY-D7, SY-D22; `docs/native/SY-PRECHECK.md` A4.5 (b)).
 *
 * A setlist vale pela **sessão inteira** do palco: tirada ao entrar no palco de fora (de S2, ou de S1 pelo índice sem
 * `posicaoAtual`), solta ao voltar a S1/S2. O palco, o índice do palco, o fim e a busca na setlist leem a MESMA foto —
 * ordem e número de músicas só mudam ao sair do palco. No código não há "sessão" (div. 1260: o salto pelo índice
 * desempilha o palco e cria outro), e por isso a foto mora ACIMA da instância, neste módulo, que o `native-tela`
 * consegue montar; o `navigation.tsx` só o liga (a ligação se prova no aparelho, A-SY-17).
 *
 * **SY-PR3 — a lógica** (era contrato inerte na SY-PR1): `entrar` tira a foto da setlist VIVA daquele id; a leitura
 * daquele id devolve a foto enquanto ela existir, e qualquer outro id lê a viva; `sair` solta. **A leitura nunca tira
 * foto**: se tirasse, um render do palco durante a animação de saída a refaria depois de solta. Quem chama o `entrar`
 * são as ações que abrem o palco de fora; quem chama o `sair` é o FOCO de S1 ou de S2 — pelo foco, e não pela ação de
 * sair, porque o voltar do Android também leva a S2 (`navigation.tsx`).
 *
 * **A memória**: uma setlist só, a da sessão aberta — o objeto que a raiz já tinha, guardado por referência (nenhuma
 * cópia); solta no foco de S1/S2. Uma sessão nova troca a foto, nunca soma.
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

/** Uma foto por sessão de navegação — o `navigation.tsx` cria uma e a guarda. */
export function criarFotoDaSessao(): FotoDaSessao {
  let foto: SetlistDTO | null = null
  return {
    entrar: (setlistId, achar) => {
      foto = achar(setlistId) ?? null
    },
    setlistDaSessao: (setlistId, achar) => (foto !== null && foto.id === setlistId ? foto : achar(setlistId)),
    sair: () => {
      foto = null
    },
  }
}
