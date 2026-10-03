/**
 * O VOCABULÁRIO DE CONTENT do N4 — o que o tablet vai mostrar na biblioteca (L), na visualização (V) e no palco
 * avulso, e que até a N4-PR3 morava só no site (N4-D14; `N4-REQUISITOS.md` N4-R21; `DESIGN-N4/README.md` §3.1).
 *
 * **Três grupos, e a regra de cada um:**
 *
 *  1. **Do site, byte a byte** (`VOCABULARIO_DE_CONTENT`, `ROTULO_DO_TIPO`, `ROTULO_DA_DIFICULDADE`). A frase mudou
 *     de CASA, não de TEXTO: o site passa a importá-la daqui (`components/library/frases-lista.ts`,
 *     `components/content/frases-visualizacao.ts`), e o `tests/gates-web/frases-n4.test.ts` prova, frase a frase,
 *     que o site mostra o que mostrava. As chaves com `{título}` e `{x}` ficam com o buraco, porque é assim que o
 *     site as preenche (`comDado`, `fraseCom`); o tablet usa as funções abaixo. As frases do site que o tablet não
 *     usa ficam no site (N4-D14).
 *  2. **As novas do desenho** (`FRASES_N4` e as funções `nome*`) — a lista P-F aceita (N4-D67): P-F1, P-F3…P-F7,
 *     P-F9…P-F11, verbatim da folha (`DESIGN-N4/telas.html`, seção 7). A P-F8 (*1 resultado*) já existe na S4
 *     (N4-E5) e não entra aqui. Frase com parâmetro é função; o `apps/native/test/frases-n4.test.ts` compara cada
 *     uma com a lista extraída da folha.
 *  3. **O motivo isolado** (N4-D29): o motivo de uma falha mora sozinho — os da escrita estão em `FRASES`
 *     (`frases.ts`) desde o N2 — e cada lado compõe do seu jeito. O tablet junta orações com
 *     `SEPARADOR_DE_ORACOES`, o mesmo das quatro composições que as telas já fazem; o site compõe como compõe hoje
 *     (*"não foi possível … — {motivo}"*, no próprio site).
 *
 * **Quando o tablet e o site têm frase para o mesmo sentido, vale a do tablet** (o desenho; a lista dos pares está
 * em `N4-PR3-anexos/README.md` §1.2) — e a do tablet não está aqui: ela mora na tela que já a usa, e entra no core
 * pela PR da tela que a reusar.
 *
 * **Este arquivo está na lista do G-tok** (`scripts/gates-web/g-tok-arquivos.txt`, div. 977): o nome `frases-*.ts`
 * põe todo valor de chave e todo literal de template ao alcance da varredura de inglês do site.
 */
import type { ContentType } from './types'

/** Grupo 1 — do site, byte a byte. A chave do site de onde cada uma veio está ao lado. */
export const VOCABULARIO_DE_CONTENT = {
  // components/library/frases-lista.ts
  favoritas: 'Favoritas', // dash.abas.favoritas, dash.favoritas — o quinto chip de L
  'vazio-favoritas': 'nenhuma favorita', // dash.vazio.favoritas — L com Favoritas e 0
  'vazio-biblioteca': 'nenhum conteúdo ainda', // lib.vazio — L vazia
  'vazio-filtro': 'nada encontrado', // lib.vazio.busca — L com filtro sem resultado
  'vazio-filtro-apoio': 'mude a busca ou os filtros', // lib.vazio.busca.apoio
  'favoritar-nome': 'Favoritar “{título}”', // lib.favoritar.nome — o nome da estrela vazada
  'tirar-nome': 'Tirar “{título}” das favoritas', // lib.favorita.nome — o nome da estrela cheia
  // components/content/frases-visualizacao.ts
  'voltar-biblioteca': 'Voltar para a biblioteca', // view.voltar — o voltar do palco avulso aberto de L
  detalhes: 'Detalhes', // view.detalhes
  'erro-formato': 'não foi possível abrir o arquivo — confira o formato', // view.erro.formato — N4-D43
  'campo-album': 'álbum', // campo.album
  'campo-dificuldade': 'dificuldade', // campo.dificuldade
  'campo-genero': 'gênero', // campo.genero
  'campo-tom': 'tom', // campo.tom
  'campo-andamento': 'andamento', // campo.andamento
  'campo-andamento-bpm': '{x} BPM', // campo.andamento.bpm
  'campo-etiquetas': 'etiquetas', // campo.etiquetas
  'campo-criado': 'criado', // campo.criado
  'campo-alterado': 'alterado', // campo.alterado
} as const

/**
 * Os quatro tipos (`TIPOS` do site, `frases-lista.ts`). O tipo fora do enum não tem rótulo aqui. (O tipo é escrito
 * como mapa, sem `Record<…>`: o G-tok lê o que está entre `>` e `<` como texto JSX.)
 */
export const ROTULO_DO_TIPO: { readonly [T in ContentType]: string } = {
  Lyrics: 'Letra',
  Chords: 'Cifra',
  Tab: 'Tab',
  Sheet: 'Partitura',
}

/** Os valores de dificuldade que o site grava, e o rótulo de cada um (`DIFICULDADES` do site). */
export const ROTULO_DA_DIFICULDADE = {
  Beginner: 'Iniciante',
  Intermediate: 'Intermediário',
  Advanced: 'Avançado',
} as const

/** Grupo 2 — as P-F sem parâmetro, verbatim da folha. */
export const FRASES_N4 = {
  'notas-da-musica': 'notas da música', // P-F3 — o rótulo das notas do content, só em V (N4-D57, N4-D62)
  'sem-rede-favoritar':
    'Sem conexão: dá para ler e tocar, não para favoritar. O favoritar volta quando a rede voltar.', // P-F4
  'voltar-visualizacao': 'Voltar para a visualização', // P-F6 — o voltar do palco avulso aberto de V
  'biblioteca-vazia':
    'Sua conta não tem músicas. Crie na versão web — elas aparecem aqui na próxima sincronização.', // P-F10
  'biblioteca-sem-cache':
    'Nenhuma música foi salva neste aparelho ainda. Conecte-se à internet uma vez para baixar tudo — depois funciona offline.', // P-F11
} as const

/** P-F1 — o nome acessível do ▶ (só ícone, na linha de L e em V; N4-D61). */
export function nomeTocar(titulo: string): string {
  return `Tocar “${titulo}”`
}

/** P-F5 — o nome acessível da estrela em voo, favoritando. */
export function nomeFavoritando(titulo: string): string {
  return `favoritando “${titulo}”…`
}

/** P-F5 — o nome acessível da estrela em voo, tirando das favoritas. */
export function nomeTirando(titulo: string): string {
  return `tirando “${titulo}” das favoritas…`
}

/** P-F7 — o nome acessível do toque na linha de L, que visualiza (N4-D61). */
export function nomeVer(titulo: string): string {
  return `Ver “${titulo}”`
}

/** P-F9 — o nome acessível de um chip de TIPO, com a contagem fixa da biblioteca inteira (P-X2). */
export function nomeDoFiltro(tipo: string, n: number): string {
  return `Só ${tipo} (${n})`
}

/**
 * P-F9, a segunda forma — o nome acessível do quinto chip, *Favoritas* (N4-D85, `[Marcel, 2026-10-03]`; div. 1032).
 * A folha dá só *Só {tipo} ({n})* e não diz o `{tipo}` das favoritas; a decisão é esta, e não *Só Favoritas ({n})*.
 */
export function nomeDoFiltroFavoritas(n: number): string {
  return `Só as favoritas (${n})`
}

/** Do site (`favoritar-nome`), para o tablet: o nome da estrela vazada. */
export function nomeFavoritar(titulo: string): string {
  return VOCABULARIO_DE_CONTENT['favoritar-nome'].replace('{título}', () => titulo)
}

/** Do site (`tirar-nome`), para o tablet: o nome da estrela cheia. */
export function nomeTirar(titulo: string): string {
  return VOCABULARIO_DE_CONTENT['tirar-nome'].replace('{título}', () => titulo)
}

/** Do site (`campo-andamento-bpm`), para o tablet: *"92 BPM"*. */
export function andamentoEmBpm(bpm: number): string {
  return VOCABULARIO_DE_CONTENT['campo-andamento-bpm'].replace('{x}', () => String(bpm))
}

/**
 * Grupo 3 — o separador das orações de uma linha do tablet: o que não deu certo · o motivo · o que a tela mostra.
 * É o das composições que já existem (`IndexScreen.tsx`, `ModoDeReordenar.tsx`, `SearchScreen.tsx`): dois espaços
 * de cada lado do ponto. A folha do N4 o escreve com um espaço (o HTML colapsa); vale o das telas, que é o que sai
 * byte a byte igual.
 */
export const SEPARADOR_DE_ORACOES = '  ·  '

/** As orações de uma linha do tablet, na ordem, com o separador de hoje. */
export function compor(oracoes: readonly string[]): string {
  return oracoes.join(SEPARADOR_DE_ORACOES)
}
