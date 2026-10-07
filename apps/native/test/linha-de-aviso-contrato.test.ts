/**
 * N4-PR3 (N4-D16) — o componente do tablet segue o CONTRATO da linha de aviso do core, sem mudar.
 *
 * O `apps/native/src/screens/LinhaDeAviso.tsx` não mudou na N4-PR3; a troca de `icone`/`cor` por espécie entrou na
 * N4-PR9, e a espécie do tablet também se compara aqui. O que se afirma aqui é de TIPO, e quem cobra é o
 * `tsc --noEmit` do nativo (passo bloqueante do `native.yml`), que inclui `test/`: se a ação do componente, o motivo
 * ou a espécie deixarem de ser os do contrato, as constantes abaixo deixam de compilar. Os `it` só tornam a afirmação visível na suíte e medem a união de espécies.
 */
import { describe, expect, it } from 'vitest'
import {
  ESPECIES_DE_AVISO,
  type AcaoDoAviso as AcaoDoContrato,
  type ContratoDaLinhaDeAviso,
  type EspecieDeAviso,
} from '@octavia/core'
import type { AcaoDoAviso as AcaoDoTablet, EspecieDoTablet, LinhaDeAvisoProps } from '../src/screens/LinhaDeAviso'

/** Igualdade de tipos estrita (não só atribuível nos dois sentidos): `true` só quando A e B são o mesmo tipo. */
type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

const acaoIgual: Igual<AcaoDoTablet, AcaoDoContrato> = true
const motivoIgual: Igual<LinhaDeAvisoProps['motivo'], ContratoDaLinhaDeAviso['motivo']> = true
const acaoDaPropIgual: Igual<LinhaDeAvisoProps['acao'], ContratoDaLinhaDeAviso['acao']> = true
// N4-PR9: a espécie do tablet é a do contrato menos `sucesso` (só do site) — escrita no componente, que não importa o
// contrato; se uma das duas listas mudar sem a outra, isto deixa de compilar.
const especieIgual: Igual<EspecieDoTablet, Exclude<EspecieDeAviso, 'sucesso'>> = true

describe('a linha de aviso do tablet e o contrato do core', () => {
  it('a ação, o motivo e a prop `acao` do tablet são os tipos do contrato (o tsc do nativo cobra)', () => {
    expect([acaoIgual, motivoIgual, acaoDaPropIgual, especieIgual]).toEqual([true, true, true, true])
  })

  it('as espécies do contrato: as três comuns, as duas do tablet e a do site (N4-PRECHECK A10)', () => {
    expect(ESPECIES_DE_AVISO).toEqual(['falha', 'rede', 'limite', 'teto', 'salvo-nao-relido', 'sucesso'])
  })
})
