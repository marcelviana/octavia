/**
 * A QUEBRA DE LINHA DO CORPO — o CONTRATO (bloco QL, PR-1). Só o tipo e a assinatura: a lógica é da PR-2
 * (`docs/native/QL-REQUISITOS.md` §3). Até lá `quebrar` LANÇA, e nenhuma tela a chama — o leitor continua desenhando o
 * corpo inteiro numa rolagem horizontal (`apps/native/src/screens/Leitor.tsx`).
 *
 * O que ela faz (QL-D13; QL-R2): recebe o texto do corpo como o `bodyOf` o devolve, o tipo e o número de COLUNAS que
 * cabem na coluna do leitor — o app mede a largura da coluna e a de um caractere da mono no zoom corrente e divide
 * (QL-R21) — e devolve as LINHAS VISUAIS, na ordem em que se desenham. **Só exibição** (QL-D2; QL-R1): o texto não muda,
 * e esta função **não entra no `bodyOf`** — a busca segue indexando o texto lógico (`search.ts`, QL-D13; o gate
 * estrutural está em `quebra.test.ts`).
 *
 * As regras do corte são as da folha congelada (`docs/native/DESIGN-QL/README.md` §3.1, QL-D28/D29; QL-D22/D23):
 *
 *   R1 · Letra — corta no último espaço que cabe; o espaço do corte não aparece em nenhum dos dois pedaços; só parte uma
 *        palavra se ela sozinha for maior que a coluna, e aí na última coluna.
 *   R2 · o par da Cifra — a linha de acordes e a de letra logo abaixo cortam na MESMA coluna; o corte recua até o
 *        primeiro ponto que não parte nem um acorde nem uma palavra, nas duas linhas; sem esse ponto, a palavra pode
 *        partir, o acorde nunca (o corte vai para a última coluna fora de acorde).
 *   R3 · continuação — cada pedaço depois do primeiro começa com `RECUO_DA_CONTINUACAO` (2) colunas de recuo, nas duas
 *        linhas do par; a coluna útil da continuação é colunas − 2; os espaços que sobram no começo do resto saem na mesma
 *        quantidade das duas linhas (o acorde continua sobre a mesma sílaba); um pedaço de acordes vazio não ocupa linha.
 *   R4 · fora do par — a linha quase acorde (*Intro: Am  E*) quebra como letra (a reserva é por linha); a progressão de
 *        uma seção (*Am  F  C  G*) faz par com a linha de baixo; o par só existe na Cifra — a Letra quebra sempre como
 *        letra; a **Tab não quebra**.
 *
 * A MEDIDA (QL-D24; QL-R9) — a função mede sem normalizar o texto: o `\t` avança até a próxima coluna múltipla de 8; o
 * `\r` do fim da linha conta 0; o acento combinante conta 0; todo outro caractere conta 1.
 *
 * O que `quebrar` GARANTE (a invariância, QL-R1 / A-QL-2; o gate (ii) de `quebra.test.ts` a confere caso a caso). Com
 * `L = texto.split('\n')`:
 *
 *   1. toda linha visual é `(continuacao ? '  ' : '') + L[logica].slice(inicio, fim)` — nenhum caractere trocado, nenhum
 *      acrescentado além do recuo;
 *   2. `continuacao` ⇔ `inicio > 0`;
 *   3. toda linha lógica tem ao menos uma linha visual (a linha vazia tem uma, `''`), e a primeira linha visual de cada
 *      linha lógica sai depois da primeira da anterior — no par, os pedaços das duas linhas se intercalam, acordes antes
 *      da letra;
 *   4. os pedaços de uma linha lógica não se sobrepõem, em ordem de `inicio`, e **tudo o que fica fora deles é espaço**
 *      (U+0020): o espaço do corte (R1), os espaços do fim de um pedaço e do começo do resto (R3), e o pedaço de acordes
 *      só de espaço que não ocupa linha (R3).
 *
 * Logo, **juntar as linhas visuais tirando o recuo das continuações, cada pedaço no seu `inicio` e o que falta entre
 * eles preenchido com espaço, devolve o texto lógico byte a byte.** A junção precisa do `inicio`: a concatenação
 * simples perde o espaço do corte da R1 e os espaços que a R3 tira, e o par intercala duas linhas lógicas (div. 1199).
 *
 * `inicio` e `fim` são posições do `String.prototype.slice` (unidades UTF-16), não colunas: com `\t`, `\r` e acento
 * combinante as duas contas divergem, e é a posição que devolve o texto.
 */

/** As colunas de recuo de cada continuação (R3; QL-D29: o recuo de 2, sem glifo). */
export const RECUO_DA_CONTINUACAO = 2

/** Uma linha como se desenha no leitor — um pedaço de uma linha lógica do corpo. */
export interface LinhaVisual {
  /** O que se desenha: o recuo (nas continuações) e o pedaço. Nunca termina em espaço, salvo o fim da linha lógica. */
  texto: string
  /** O índice da linha lógica de onde o pedaço veio (`texto.split('\n')`). */
  logica: number
  /** O pedaço não é o primeiro da linha lógica: começa com o recuo de 2 colunas (R3). */
  continuacao: boolean
  /** Onde o pedaço começa na linha lógica (posição de `slice`, sem o recuo). */
  inicio: number
  /** Onde o pedaço termina na linha lógica (posição de `slice`, exclusiva). */
  fim: number
}

/**
 * As linhas visuais do corpo em `colunas` colunas (R1–R4, a medida do QL-D24, a invariância acima).
 *
 * @param texto   o corpo de texto, como o `bodyOf` o devolve (não normalizado).
 * @param tipo    o `content_type`: `'Chords'` forma o par; `'Tab'` não quebra; qualquer outro quebra como Letra.
 * @param colunas inteiro, maior que `RECUO_DA_CONTINUACAO` — a continuação precisa de ao menos uma coluna útil.
 */
export function quebrar(texto: string, tipo: string, colunas: number): LinhaVisual[] {
  void texto
  void tipo
  void colunas
  throw new Error('quebrar: só o contrato na PR-1 do QL — a lógica é da PR-2')
}

/**
 * A linha é de acordes (a heurística da Fase B, `QL-PRECHECK-anexos/fase-b/q2-cifra-pares.sql`) — QL-PR2, commit 1: só a
 * assinatura, para os testes de borda (`quebra.test.ts`) entrarem reprovados. A lógica vem com a de `quebrar`.
 */
export function ehLinhaDeAcordes(linha: string): boolean {
  void linha
  throw new Error('ehLinhaDeAcordes: só a assinatura no commit 1 da QL-PR2 — a lógica vem com a de quebrar')
}
