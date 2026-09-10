/**
 * Fixtures do palco — dados que **não existem** na conta de audit e que os
 * aceites exigem (divergência 6 do pre-check: a linha mais longa da audit tem
 * 58 colunas; o T1-R31 pede 120).
 *
 * Ficam versionados porque são o instrumento das provas do device (N1-PR4 e
 * o aceite da PR7), não conteúdo de produto: nenhuma tela real os importa.
 */

/** Uma linha de exatamente 120 colunas, para o T1-R31 (zoom sem re-quebra). */
export const LINHA_120 =
  'Gb7M      Fm7       Bb7       Eb7M      Abm7      Db7       Gb7M      Bb7M      Am7       D7        Gm7       C7'

/** Cifra com a linha de 120 colunas no meio de linhas curtas. */
export const CIFRA_120_COLUNAS = [
  '[Intro]  C7M   Dm7   G7   C7M',
  '',
  '         C7M              Dm7',
  'La la la, a tarde cai devagar',
  '',
  '[Refrão — linha de 120 colunas]',
  LINHA_120,
  'la la la la lá, la la la la la la lá',
].join('\n')

/** 300 linhas de texto mono — carga do spike de auto-scroll (T1-R30). */
export const TEXTO_300_LINHAS = Array.from(
  { length: 300 },
  (_, i) => `${String(i + 1).padStart(3, '0')}  la la la, a tarde cai devagar — verso ${i + 1}`,
).join('\n')
