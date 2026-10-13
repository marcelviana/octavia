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
import type { PalcoDosGatilhos } from './gatilhos'

/** A busca de hoje: a setlist viva da raiz pelo id (`acharSetlist`, `navigation.tsx`). */
export type AcharSetlist = (setlistId: string) => SetlistDTO | undefined

/**
 * SY-PR4 (SY-D49, SY-D56) — a foto é também o que os gatilhos leem para saber se o PALCO está aberto (o
 * `PalcoDosGatilhos`): **a sessão do palco** (de `entrar` a `sair` — com o índice ou a busca por cima, que não a soltam)
 * **ou um palco avulso sem hospedeira montado** (`abrirAvulso`, até o desligar dele). Um estado só, aqui, sem cópia na
 * raiz nem nos gatilhos. Quem quer saber quando o palco FECHA assina `aoFecharPalco`: o aviso sai uma vez, na passagem
 * de aberto a fechado, depois de o estado já ser o novo. V não conta: ela não entra aqui.
 */
export interface FotoDaSessao extends PalcoDosGatilhos {
  /** Entrar no palco DE FORA (de S2; de S1 pelo índice sem posição): tira a foto desta setlist. */
  entrar(setlistId: string, achar: AcharSetlist): void
  /**
   * O que o palco, o índice do palco, o fim e a busca na setlist leem: a foto, se a sessão é desta setlist; senão a
   * viva. Com a foto, uma setlist que um sync apagou continua de pé até o palco sair (SY-D23).
   */
  setlistDaSessao(setlistId: string, achar: AcharSetlist): SetlistDTO | undefined
  /** Voltar a S1/S2: solta a foto. */
  sair(): void
  /**
   * O foco do `Index`: sem `posicaoAtual` é S2 (sai da sessão); com ela é o índice DO PALCO (a mesma sessão, E6). A
   * regra que o `navigation.tsx` tinha no próprio ouvinte (SY-PR3), num lugar que o gate monta.
   */
  focoDoIndice(posicaoAtual: number | undefined): void
  /** SY-D56 — um palco avulso sem hospedeira montou: o palco está aberto até o desligar devolvido. */
  abrirAvulso(): () => void
}

/** Uma foto por sessão de navegação — o `navigation.tsx` cria uma e a guarda. */
export function criarFotoDaSessao(): FotoDaSessao {
  let foto: SetlistDTO | null = null
  /** Entre `entrar` e `sair`: a sessão do palco (a foto pode ser `null`, se a setlist não estava no cache). */
  let emSessao = false
  /** Quantos palcos avulsos sem hospedeira estão montados (SY-D56). */
  let avulsos = 0
  const aoFechar = new Set<() => void>()
  const aberto = (): boolean => emSessao || avulsos > 0
  /** Muda o estado e, se o palco passou de aberto a fechado, avisa quem assinou. */
  const mudar = (f: () => void): void => {
    const antes = aberto()
    f()
    if (antes && !aberto()) for (const g of [...aoFechar]) g()
  }
  const sair = (): void =>
    mudar(() => {
      foto = null
      emSessao = false
    })
  return {
    entrar: (setlistId, achar) =>
      mudar(() => {
        foto = achar(setlistId) ?? null
        emSessao = true
      }),
    setlistDaSessao: (setlistId, achar) => (foto !== null && foto.id === setlistId ? foto : achar(setlistId)),
    sair,
    focoDoIndice: (posicaoAtual) => {
      if (posicaoAtual === undefined) sair()
    },
    abrirAvulso: () => {
      mudar(() => {
        avulsos++
      })
      let solto = false
      return () => {
        if (solto) return
        solto = true
        mudar(() => {
          avulsos--
        })
      }
    },
    palcoAberto: aberto,
    aoFecharPalco: (f) => {
      aoFechar.add(f)
      return () => {
        aoFechar.delete(f)
      }
    },
  }
}
