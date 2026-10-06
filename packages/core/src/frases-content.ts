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

/**
 * P-F8 — a régua de resultados, com o singular (N4-E5). É a frase que a S4 já escreve (`SearchScreen.tsx:156`); vem
 * ao core na N4-PR5 para a régua de L, e a cópia da S4 fica até a PR da tela (a PR-7) — o
 * `apps/native/test/frases-n4.test.ts` (3) prova, lendo o fonte da S4, que as duas dão o mesmo texto.
 */
export function nResultados(n: number): string {
  return `${n} ${n === 1 ? 'resultado' : 'resultados'}`
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

/**
 * Grupo 4 — **as frases do PALCO que o avulso sem hospedeira reusa** (N4-PR6; `N4-PR3-anexos/README.md` §1.1, linhas
 * 1–3: a tabela das que ficaram fora do core). Eram literais do `StageScreen.tsx` (`:513`, `:529`, `:721` na `main`
 * `d78ea89`); vêm com o texto byte a byte (`apps/native/test/frases-n4.test.ts` (4), contra o texto da tela de
 * antes), e o palco passa a importar daqui — nenhuma cópia na tela, o molde da N4-PR3.
 */
export const FRASES_DO_PALCO = {
  avulsa: 'AVULSA', // a posição do palco avulso, no lugar do "n DE N"
  'voltar-busca': 'Voltar para a busca', // o nome acessível do voltar do avulso aberto da busca
} as const

/** A página do PDF na barra do palco (S3d): *página {n} de {N}*. */
export function paginaDe(n: number, total: number): string {
  return `página ${n} de ${total}`
}

/**
 * De onde o palco avulso SEM hospedeira foi aberto (N4-R16, N4-D63): a busca (de S1, nesta PR), a biblioteca (L, na
 * PR-7) ou a visualização (V, na PR-8). É o contrato que as duas telas que ainda não existem vão usar.
 */
export type OrigemDoAvulso = 'busca' | 'biblioteca' | 'visualizacao'

/**
 * O nome acessível do voltar do avulso, pela origem (N4-R16): *Voltar para a busca* (a do palco de hoje), *Voltar
 * para a biblioteca* (do site, `view.voltar`) e *Voltar para a visualização* (P-F6).
 */
export function nomeDoVoltarDoAvulso(origem: OrigemDoAvulso): string {
  if (origem === 'biblioteca') return VOCABULARIO_DE_CONTENT['voltar-biblioteca']
  if (origem === 'visualizacao') return FRASES_N4['voltar-visualizacao']
  return FRASES_DO_PALCO['voltar-busca']
}

/**
 * Grupo 5 — **as frases do TABLET que a biblioteca (L) reusa** (N4-PR7; `N4-PR3-anexos/README.md` §1.1, linhas 4–17:
 * a tabela das que ficaram fora do core). Eram literais das telas e do `files.ts`; vêm com o texto byte a byte
 * (`apps/native/test/frases-n4.test.ts` (5), contra o texto das telas de antes, a `main` `5c707a3`), e as telas
 * passam a importar daqui — nenhuma cópia na tela, o molde da N4-PR3. A linha de onde cada uma veio está ao lado.
 */
export const FRASES_DO_TABLET = {
  carregando: 'carregando…', // IndexScreen.tsx:202 — a música da S2 ainda sem dado; L-carregando
  'tipo-nao-reconhecido': 'tipo não reconhecido — edite na versão web', // IndexScreen.tsx:190 — o item inválido
  'nada-para-mostrar': 'nada para mostrar — edite na versão web', // IndexScreen.tsx:191 — o item sem corpo
  'arquivo-nao-baixado': 'arquivo não baixado', // StageScreen.tsx:865 — o S3e; a linha de L
  'baixando-o-arquivo': 'baixando o arquivo…', // StageScreen.tsx:853 — o S3 baixando; a linha de L
  'nao-consegui-baixar': 'não consegui baixar', // files.ts:477 (`FALHA_GENERICA`) — a falha sem status; a linha de L
  'sem-conexao': 'sem conexão', // SearchScreen.tsx:297, SetlistsScreen.tsx:184, :215, :219, :644 — L-falha-sem-cache
  'buscar-musica': 'Buscar música', // SetlistsScreen.tsx:565 — o botão de S1; o placeholder do campo de L
  'tentar-novamente': 'Tentar novamente', // SetlistsScreen.tsx:622, :652 — S1e, S1d; L-falha-com-cache e sem cache
  'voltar-setlists': 'Voltar para as setlists', // IndexScreen.tsx:693 — o voltar da S2 aberta de S1; o voltar de L
} as const

/**
 * A régua de L enquanto o número não existe (`L-carregando`, a 1ª vez, sem nada no aparelho): o rótulo sem o número e
 * o traço no lugar da contagem — o recorte de *Biblioteca · {n} músicas* que a folha desenha (N4-D79; `DESIGN-N4`
 * §5.4: *"não é frase: a régua sem o número enquanto ele não existe"*). Com número, `reguaBiblioteca` e `nResultados`.
 */
export const REGUA_SEM_NUMERO = { rotulo: 'Biblioteca', contagem: '—' } as const

/** S4b e L-busca-sem-resultado: *nada encontrado para “{termo}”* (`SearchScreen.tsx:314`). O termo entra como dado. */
export function nadaEncontradoPara(termo: string): string {
  return `nada encontrado para “${termo}”`
}

/** A frase de escopo da busca (`SearchScreen.tsx:250`) — S4a, S4b e L-busca-sem-resultado. */
export function escopoDaBusca(n: number): string {
  return `busca em título, artista, álbum e letra de toda a biblioteca (${n} ${n === 1 ? 'música' : 'músicas'})`
}

/**
 * T1-R36 — o texto da falha de sync por `messageKey` (a chave do `errorFrom`), o do S1e/S1d (`SetlistsScreen.tsx:183-191`
 * na `main` `5c707a3`). A tabela da N4-PR3 nomeia a linha 16, *falha no servidor* — o exemplo da folha em
 * `L-falha-com-cache`; vem o MAPA inteiro, porque a L mostra a falha que houver, e as sete são o mesmo mecanismo. Uma
 * chave nova do core cai no genérico.
 */
export const TEXTO_DA_FALHA_DE_SYNC = {
  'erro.sem_conexao': 'sem conexão',
  'erro.sessao_invalida': 'sua sessão expirou',
  'erro.servidor_ocupado': 'servidor ocupado · tente em instantes',
  'erro.nao_encontrado': 'não encontrado no servidor',
  'erro.requisicao_invalida': 'o servidor recusou o pedido',
  'erro.falha_do_servidor': 'falha no servidor',
  'erro.desconhecido': 'falha ao sincronizar',
} as const

export function textoDaFalhaDeSync(messageKey: string): string {
  const mapa: { readonly [k: string]: string } = TEXTO_DA_FALHA_DE_SYNC
  return mapa[messageKey] ?? TEXTO_DA_FALHA_DE_SYNC['erro.desconhecido']
}

/**
 * *"há 2 h"*, *"há 15 min"*, *"agora"*, *"nunca"* — a idade do dado, como S1 a escreve (`SetlistsScreen.tsx:128-137` na
 * `main` `5c707a3`, `haQuantoTempo`). O relógio entra como DADO (`agoraMs`): o core não lê o relógio.
 */
export function haQuantoTempo(ms: number | null, agoraMs: number): string {
  if (ms === null) return 'nunca'
  const min = Math.floor((agoraMs - ms) / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.floor(h / 24)} d`
}

/** S1e e L-falha-com-cache: a idade depois da causa — *" · mostrando dados de há 44 min"* (`SetlistsScreen.tsx:612`). */
export function mostrandoDadosDe(haQuanto: string): string {
  return ` · mostrando dados de ${haQuanto}`
}
