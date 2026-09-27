/**
 * Família + peso → nome do `.ttf` (I1-D31, div. 485).
 *
 * O pacote `@octavia/identidade` guarda a fonte como família + peso, que é o
 * que o CSS entende. O nativo carrega arquivo: o config plugin do `expo-font`
 * embarca os seis `.ttf` listados no `app.json` (N1-D6), e o `fontFamily` do
 * React Native é o NOME desse arquivo. Este mapa é a tradução, e só ele sabe
 * os nomes; o `packages/identidade/test/fontes.test.ts` prova que todo token de
 * fonte do pacote tem entrada aqui e que todo nome aqui é um `.ttf` do
 * `app.json`.
 */
import { font as fontesDoPacote, type Fonte, type NomeFonte } from '@octavia/identidade'

export const arquivoTtf: { readonly [F in Fonte['familia']]: Partial<Record<Fonte['peso'], string>> } = {
  Raleway: { 500: 'Raleway_500Medium', 600: 'Raleway_600SemiBold' },
  Manrope: { 400: 'Manrope_400Regular', 600: 'Manrope_600SemiBold' },
  'IBM Plex Mono': { 400: 'IBMPlexMono_400Regular', 600: 'IBMPlexMono_600SemiBold' },
}

export function ttfDe(f: Fonte): string {
  const nome = arquivoTtf[f.familia][f.peso]
  if (nome === undefined) throw new Error(`fontes.ts: sem .ttf para ${f.familia} ${f.peso}`)
  return nome
}

/** O `font` do nativo: o mesmo token do pacote, já como nome de `.ttf`. */
export const font = Object.fromEntries(
  (Object.keys(fontesDoPacote) as NomeFonte[]).map((k) => [k, ttfDe(fontesDoPacote[k])]),
) as { readonly [K in NomeFonte]: string }
