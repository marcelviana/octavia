/**
 * N4-PR3 (N4-D16) — o componente do tablet segue o CONTRATO da linha de aviso do core, sem mudar.
 *
 * O `apps/native/src/screens/LinhaDeAviso.tsx` não muda nesta PR (a troca de `icone`/`cor` por espécie é da
 * N4-PR9). O que se afirma aqui é de TIPO, e quem cobra é o `tsc --noEmit` do nativo (passo bloqueante do
 * `native.yml`), que inclui `test/`: se a ação do componente ou o motivo deixarem de ser os do contrato, as
 * constantes abaixo deixam de compilar. Os `it` só tornam a afirmação visível na suíte e medem a união de espécies.
 */
import { describe, expect, it } from 'vitest'
import { ESPECIES_DE_AVISO, type AcaoDoAviso as AcaoDoContrato, type ContratoDaLinhaDeAviso } from '@octavia/core'
import type { AcaoDoAviso as AcaoDoTablet, LinhaDeAvisoProps } from '../src/screens/LinhaDeAviso'

/** Igualdade de tipos estrita (não só atribuível nos dois sentidos): `true` só quando A e B são o mesmo tipo. */
type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

const acaoIgual: Igual<AcaoDoTablet, AcaoDoContrato> = true
const motivoIgual: Igual<LinhaDeAvisoProps['motivo'], ContratoDaLinhaDeAviso['motivo']> = true
const acaoDaPropIgual: Igual<LinhaDeAvisoProps['acao'], ContratoDaLinhaDeAviso['acao']> = true

describe('a linha de aviso do tablet e o contrato do core', () => {
  it('a ação, o motivo e a prop `acao` do tablet são os tipos do contrato (o tsc do nativo cobra)', () => {
    expect([acaoIgual, motivoIgual, acaoDaPropIgual]).toEqual([true, true, true])
  })

  it('as espécies do contrato: as três comuns, as duas do tablet e a do site (N4-PRECHECK A10)', () => {
    expect(ESPECIES_DE_AVISO).toEqual(['falha', 'rede', 'limite', 'teto', 'salvo-nao-relido', 'sucesso'])
  })
})
