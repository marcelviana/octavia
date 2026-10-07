/**
 * N4-PR3 — as frases novas do N4 no core, contra a FOLHA, e o motivo isolado contra as TELAS de hoje.
 *
 * (1) **As P-F aceitas** (N4-D67: P-F1, P-F3…P-F7, P-F9…P-F11; a P-F8 já existe, N4-E5). A lista esperada é
 *     `n4-pf-esperado.json`, extraída da folha RENDERIZADA (o extrator é o `n4-pf-extrair.mjs`, ao lado), com o
 *     sha256 do `telas.html` de que saiu — e o teste confere esse sha contra o arquivo da árvore: a folha mudou,
 *     a lista é outra, e o teste reprova antes de comparar. Frase com parâmetro é FUNÇÃO no core; o teste a
 *     compara com o molde da folha preenchido (`{título}`, `{tipo}`, `{n}`), com as aspas tipográficas da folha.
 * (2) **O motivo isolado** (N4-D29): o core guarda cada motivo sozinho e o tablet compõe as orações com o
 *     separador das telas de hoje. As quatro composições que já existem (`IndexScreen.tsx` ×2,
 *     `ModoDeReordenar.tsx`, `SearchScreen.tsx`) são lidas do FONTE: o separador delas é o do core, e a frase
 *     composta pelo core é, byte a byte, a que cada tela monta hoje. A tabela das espécies do favoritar (a
 *     legenda de `N4-*-L-favoritar-falhou`) sai do core com o separador do tablet — a folha o escreve com um
 *     espaço de cada lado, e o HTML o colapsa (`N4-PR3-anexos/README.md`, divergências).
 *
 * Sobre a `main` de antes da PR-3, o arquivo inteiro reprova: `frases-content` não existe no core.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { frase, FRASES, type ChaveDeFrase } from '@octavia/core'
import * as conteudo from '@octavia/core'
import esperado from './n4-pf-esperado.json'

const RAIZ = resolve(__dirname, '../../..')
const ler = (rel: string): string => readFileSync(resolve(RAIZ, rel), 'utf8')

describe('(1) as P-F aceitas — contra a lista extraída da folha', () => {
  it(`a lista saiu do telas.html da árvore (sha256 ${esperado.sha256.slice(0, 12)}…)`, () => {
    const sha = createHash('sha256').update(readFileSync(resolve(RAIZ, esperado.origem))).digest('hex')
    expect(sha).toBe(esperado.sha256)
  })

  it(`são ${esperado.pf.length} P-F, as da N4-D67 menos a P-F8`, () => {
    expect(esperado.pf.map((p) => p.id)).toEqual(['P-F1', 'P-F3', 'P-F4', 'P-F5', 'P-F6', 'P-F7', 'P-F9', 'P-F10', 'P-F11'])
  })

  /** N4-D85 `[Marcel, 2026-10-03]` — a forma da P-F9 para o chip Favoritas; vem da decisão, não da folha. */
  const P_F9_FAVORITAS = 'Só as favoritas ({n})'

  /** O que o core dá para cada P-F, com o molde da folha preenchido pelos mesmos valores. */
  const TITULOS = ['Manhã de ensaio', 'Uma música de título bem comprido, para medir a quebra', '{título}']
  const CASOS: Record<string, (molde: string[]) => [obtido: string, esperado: string][]> = {
    'P-F1': ([m]) => TITULOS.map((t) => [conteudo.nomeTocar(t), m!.replace('{título}', t)]),
    'P-F3': ([m]) => [[conteudo.FRASES_N4['notas-da-musica'], m!]],
    'P-F4': ([m]) => [[conteudo.FRASES_N4['sem-rede-favoritar'], m!]],
    'P-F5': ([favoritando, tirando]) =>
      TITULOS.flatMap((t): [string, string][] => [
        [conteudo.nomeFavoritando(t), favoritando!.replace('{título}', t)],
        [conteudo.nomeTirando(t), tirando!.replace('{título}', t)],
      ]),
    'P-F6': ([m]) => [[conteudo.FRASES_N4['voltar-visualizacao'], m!]],
    'P-F7': ([m]) => TITULOS.map((t) => [conteudo.nomeVer(t), m!.replace('{título}', t)]),
    // Sem plural: o {n} é a contagem entre parênteses, a mesma forma para 0, 1 e muitos.
    // N4-D85 (div. 1032): duas formas — o molde da folha para os quatro tipos, e a das favoritas, que a folha não dá.
    'P-F9': ([m]) => [
      ...(['Letra', 'Cifra', 'Tab', 'Partitura'] as const).flatMap((tipo) =>
        [0, 1, 57].map((n): [string, string] => [conteudo.nomeDoFiltro(tipo, n), m!.replace('{tipo}', tipo).replace('{n}', String(n))]),
      ),
      ...[0, 1, 6].map((n): [string, string] => [conteudo.nomeDoFiltroFavoritas(n), P_F9_FAVORITAS.replace('{n}', String(n))]),
    ],
    'P-F10': ([m]) => [[conteudo.FRASES_N4['biblioteca-vazia'], m!]],
    'P-F11': ([m]) => [[conteudo.FRASES_N4['biblioteca-sem-cache'], m!]],
  }

  it.each(esperado.pf.map((p) => [p.id, p.frases] as const))('%s', (id, frases) => {
    const caso = CASOS[id]
    expect(caso, `${id} sem caso no teste`).toBeDefined()
    for (const [obtido, daFolha] of caso!(frases)) expect(obtido).toBe(daFolha)
  })

  it('as aspas são as tipográficas da folha (“ ”), nunca a reta', () => {
    for (const f of [conteudo.nomeTocar('x'), conteudo.nomeVer('x'), conteudo.nomeFavoritando('x'), conteudo.nomeTirando('x')]) {
      expect(f).toMatch(/“x”/)
      expect(f).not.toMatch(/"/)
    }
  })

  it('o título entra como dado: "$&" e "$1" no título não viram padrão de substituição', () => {
    for (const t of ['Tom $& Jerry', 'Faixa $1', '$$']) {
      expect(conteudo.nomeFavoritar(t)).toBe(`Favoritar “${t}”`)
      expect(conteudo.nomeTirar(t)).toBe(`Tirar “${t}” das favoritas`)
      expect(conteudo.nomeTocar(t)).toBe(`Tocar “${t}”`)
    }
    expect(conteudo.andamentoEmBpm(92)).toBe('92 BPM')
  })

  it('as cinco constantes P-F do core são estas, e só estas', () => {
    expect(Object.keys(conteudo.FRASES_N4).sort()).toEqual(
      ['biblioteca-sem-cache', 'biblioteca-vazia', 'notas-da-musica', 'sem-rede-favoritar', 'voltar-visualizacao'],
    )
  })
})

describe('(2) o motivo isolado — o core compõe como as telas de hoje', () => {
  /** As composições de hoje: `.join('<separador>')` com `·`, lidas do fonte (comentário fora). */
  const TELAS = [
    'apps/native/src/screens/IndexScreen.tsx',
    'apps/native/src/screens/ModoDeReordenar.tsx',
    'apps/native/src/screens/SearchScreen.tsx',
  ]
  const JUNCOES = TELAS.flatMap((f) =>
    [...ler(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').matchAll(/\.join\('([^']*·[^']*)'\)/g)].map((m) => ({ f, sep: m[1]! })),
  )

  it(`as ${JUNCOES.length} junções com "·" das telas usam o separador do core`, () => {
    expect(JUNCOES.length).toBe(4)
    for (const { f, sep } of JUNCOES) expect(sep, f).toBe(conteudo.SEPARADOR_DE_ORACOES)
  })

  /** Os seis motivos da escrita (N2): cada um sozinho, sem separador de oração dentro. */
  const MOTIVOS: [ChaveDeFrase, string][] = [
    ['rede', frase('rede')],
    ['sem-resposta', frase('sem-resposta')],
    ['auth', frase('auth')],
    ['limite-com-prazo', frase('limite-com-prazo', 12)],
    ['servidor', frase('servidor')],
    ['generica', frase('generica')],
  ]

  it.each(MOTIVOS)('o motivo %s é isolado (sem separador de oração dentro)', (_, m) => {
    expect(m.includes('·')).toBe(false)
  })

  it.each(MOTIVOS)('S2 e o reordenar: com o motivo %s, o core monta byte a byte a frase da tela', (_, m) => {
    const sepDaTela = JUNCOES.find((j) => j.f.endsWith('IndexScreen.tsx'))!.sep
    for (const [abre, fecha] of [
      [FRASES['falhou-salvar'], FRASES['lista-relida']],
      [FRASES['falhou-ordem'], FRASES['ordem-relida']],
    ] as const) {
      expect(conteudo.compor([abre, m])).toBe([abre, m].join(sepDaTela))
      expect(conteudo.compor([abre, m, fecha])).toBe([abre, m, fecha].join(sepDaTela))
    }
  })

  const ESPECIE: Record<string, string> = {
    'sem rede': frase('rede'),
    'sem resposta': frase('sem-resposta'),
    sessão: frase('auth'),
    limite: frase('limite-com-prazo', 12),
    servidor: frase('servidor'),
    genérica: frase('generica'),
  }

  it.each(esperado.especies.linhas.map((l) => [l.especie, l.linha] as const))(
    'o favoritar com falha, %s: o nome do controle · o motivo (a tabela da folha)',
    (especie, linha) => {
      const titulo = /“([^”]*)”/.exec(linha)![1]!
      const nome = linha.startsWith('Tirar') ? conteudo.nomeTirar(titulo) : conteudo.nomeFavoritar(titulo)
      const composta = conteudo.compor([nome, ESPECIE[especie]!])
      // O separador do tablet tem dois espaços de cada lado; a folha, um (o HTML colapsa) — o resto, byte a byte.
      expect(composta.replace(/ {2}· {2}/g, ' · ')).toBe(linha)
    },
  )
})

/**
 * (3) **N4-PR5 — a P-F8 no core, sob o mesmo gate de igualdade** (`N4-PR3-anexos/README.md` §1.1, linha 10; N4-E5).
 * A régua de L (*{n} resultado(s)*) é a frase que a S4 já escreve (`SearchScreen.tsx:156`). Ela passa ao core
 * (`nResultados`) nesta PR, que não muda tela nenhuma: a cópia da S4 FICA, e este teste lê o template literal do
 * FONTE da S4 e prova que ele e o core dão o mesmo texto, byte a byte. A PR da tela que reusar a frase (a PR-7) troca
 * a cópia pela importação — e aí este teste muda para "nenhuma cópia na tela", como o molde do site.
 */
describe('(3) a P-F8 no core, igual à da S4 — e, desde a N4-PR7, sem cópia na S4', () => {
  const FONTE = ler('apps/native/src/screens/SearchScreen.tsx')
  const MOLDE = '`${n} ${n === 1 ? \'resultado\' : \'resultados\'}`'

  // EM PAR (N4-PR7): era "a S4 escreve a régua com o template de sempre (uma ocorrência: a `Regua` exportada)" —
  // `expect(FONTE.split(MOLDE).length - 1).toBe(1)`. A PR-7 é a PR da tela que reusa a frase (a régua de L), e troca a
  // cópia pela importação, como o comentário acima previa: agora o fonte da S4 não tem o template, e importa do core.
  it('a S4 não tem mais a cópia: a régua importa `nResultados` do core', () => {
    expect(FONTE.split(MOLDE).length - 1).toBe(0)
    expect(FONTE).toContain('{nResultados(n)}')
  })

  it('o core e o template da S4 de antes dão o mesmo texto para 0, 1, 2 e 57', () => {
    const daTela = new Function('n', `return ${MOLDE}`) as (n: number) => string
    for (const n of [0, 1, 2, 57]) expect(conteudo.nResultados(n)).toBe(daTela(n))
  })
})

/**
 * (4) **N4-PR6 — as frases do palco avulso no core, sem cópia na tela** (`N4-PR3-anexos/README.md` §1.1, linhas 1–3;
 * o molde da N4-PR3: *"a base da tela antes, a frase no core depois, nenhuma cópia na tela"*). A PR-6 muda o palco,
 * então a tela passa a importar. **A base da tela** é o texto que o `StageScreen.tsx` escrevia na `main` de antes
 * desta PR (`d78ea89`: `:513` `'AVULSA'`, `:529` o template da página, `:721` `'Voltar para a busca'`), copiado
 * aqui verbatim — o core tem de dar o MESMO texto, e o fonte do palco não pode ter mais a cópia.
 * E as duas outras origens do voltar do avulso (N4-R16), que já estão no core: *Voltar para a biblioteca* (do site,
 * `view.voltar`) e *Voltar para a visualização* (P-F6).
 */
describe('(4) as frases do palco avulso no core, sem cópia no palco', () => {
  const FONTE = ler('apps/native/src/screens/StageScreen.tsx')
  const BASE = { avulsa: 'AVULSA', voltarBusca: 'Voltar para a busca' }
  const paginaDaBase = (n: number, total: number): string => `página ${n} de ${total}`

  it('o core dá o texto que o palco escrevia', () => {
    expect(conteudo.FRASES_DO_PALCO.avulsa).toBe(BASE.avulsa)
    expect(conteudo.FRASES_DO_PALCO['voltar-busca']).toBe(BASE.voltarBusca)
    for (const [n, t] of [[1, 12], [12, 12], [1, 1]] as const) expect(conteudo.paginaDe(n, t)).toBe(paginaDaBase(n, t))
  })

  it('o voltar do avulso pela origem (N4-R16): busca · biblioteca · visualização', () => {
    expect(conteudo.nomeDoVoltarDoAvulso('busca')).toBe('Voltar para a busca')
    expect(conteudo.nomeDoVoltarDoAvulso('biblioteca')).toBe(conteudo.VOCABULARIO_DE_CONTENT['voltar-biblioteca'])
    expect(conteudo.nomeDoVoltarDoAvulso('biblioteca')).toBe('Voltar para a biblioteca')
    expect(conteudo.nomeDoVoltarDoAvulso('visualizacao')).toBe(conteudo.FRASES_N4['voltar-visualizacao'])
  })

  it('nenhuma cópia no palco: as três frases saem do core', () => {
    expect(FONTE).not.toContain(`'${BASE.avulsa}'`)
    expect(FONTE).not.toContain(`'${BASE.voltarBusca}'`)
    expect(FONTE).not.toContain('`página ${')
  })
})

/**
 * (5) **N4-PR7 — as frases do tablet que a biblioteca (L) reusa, no core, sem cópia nas telas** (`N4-PR3-anexos/
 * README.md` §1.1, linhas 4–17; o molde da (4)). **A base das telas** é o texto que elas escreviam na `main` de antes
 * desta PR (`5c707a3`), copiado aqui verbatim com o arquivo:linha de cada uma — o core tem de dar o MESMO texto, e o
 * fonte de cada tela não pode ter mais a cópia. Duas a mais que a tabela, declaradas: o MAPA inteiro da falha de sync
 * (a linha 16 é um valor dele; a L mostra a falha que houver) com a idade do dado (`haQuantoTempo`), e o *Voltar para
 * as setlists* (`IndexScreen.tsx:693`), o nome do voltar de L.
 */
describe('(5) as frases do tablet que a L reusa, no core, sem cópia nas telas', () => {
  const BASE = {
    carregando: 'carregando…', // IndexScreen.tsx:202
    'tipo-nao-reconhecido': 'tipo não reconhecido — edite na versão web', // IndexScreen.tsx:190
    'nada-para-mostrar': 'nada para mostrar — edite na versão web', // IndexScreen.tsx:191
    'arquivo-nao-baixado': 'arquivo não baixado', // StageScreen.tsx:865
    'baixando-o-arquivo': 'baixando o arquivo…', // StageScreen.tsx:853
    'nao-consegui-baixar': 'não consegui baixar', // files.ts:477
    'sem-conexao': 'sem conexão', // SearchScreen.tsx:297; SetlistsScreen.tsx:184, :215, :219, :644
    'buscar-musica': 'Buscar música', // SetlistsScreen.tsx:565
    'tentar-novamente': 'Tentar novamente', // SetlistsScreen.tsx:622, :652
    'voltar-setlists': 'Voltar para as setlists', // IndexScreen.tsx:693
  } as const
  /** `SetlistsScreen.tsx:183-191` (o `TEXTO_DE_ERRO`). */
  const ERRO = {
    'erro.sem_conexao': 'sem conexão',
    'erro.sessao_invalida': 'sua sessão expirou',
    'erro.servidor_ocupado': 'servidor ocupado · tente em instantes',
    'erro.nao_encontrado': 'não encontrado no servidor',
    'erro.requisicao_invalida': 'o servidor recusou o pedido',
    'erro.falha_do_servidor': 'falha no servidor',
    'erro.desconhecido': 'falha ao sincronizar',
  } as const
  /** `SetlistsScreen.tsx:128-137` (o `haQuantoTempo`), com o relógio como dado. */
  const idadeDaBase = (ms: number | null, agora: number): string => {
    if (ms === null) return 'nunca'
    const min = Math.floor((agora - ms) / 60_000)
    if (min < 1) return 'agora'
    if (min < 60) return `há ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `há ${h} h`
    return `há ${Math.floor(h / 24)} d`
  }
  const escopoDaBase = (n: number): string =>
    `busca em título, artista, álbum e letra de toda a biblioteca (${n} ${n === 1 ? 'música' : 'músicas'})`

  it('o core dá o texto que as telas escreviam', () => {
    expect(conteudo.FRASES_DO_TABLET).toStrictEqual(BASE)
    expect(conteudo.TEXTO_DA_FALHA_DE_SYNC).toStrictEqual(ERRO)
    for (const k of Object.keys(ERRO) as (keyof typeof ERRO)[]) expect(conteudo.textoDaFalhaDeSync(k)).toBe(ERRO[k])
    expect(conteudo.textoDaFalhaDeSync('erro.que-nao-existe')).toBe('falha ao sincronizar')
    expect(conteudo.nadaEncontradoPara('xablau')).toBe('nada encontrado para “xablau”')
    for (const n of [0, 1, 2, 63]) expect(conteudo.escopoDaBusca(n)).toBe(escopoDaBase(n))
    const agora = Date.UTC(2026, 9, 6, 12)
    for (const atras of [null, 0, 30_000, 60_000, 44 * 60_000, 3 * 3_600_000, 50 * 3_600_000]) {
      const ms = atras === null ? null : agora - atras
      expect(conteudo.haQuantoTempo(ms, agora)).toBe(idadeDaBase(ms, agora))
    }
    expect(conteudo.mostrandoDadosDe('há 44 min')).toBe(' · mostrando dados de há 44 min')
    expect(conteudo.REGUA_SEM_NUMERO).toStrictEqual({ rotulo: 'Biblioteca', contagem: '—' })
  })

  const COPIAS: [string, string[]][] = [
    ['apps/native/src/screens/IndexScreen.tsx', ["'carregando…'", "'tipo não reconhecido — edite na versão web'", "'nada para mostrar — edite na versão web'", "'Voltar para as setlists'"]],
    ['apps/native/src/screens/StageScreen.tsx', ['>baixando o arquivo…<', '>arquivo não baixado<']],
    ['apps/native/src/files.ts', ["'não consegui baixar'"]],
    ['apps/native/src/screens/SearchScreen.tsx', ['>sem conexão<', '`nada encontrado para', '`busca em título, artista']],
    // (os comentários de S1 citam *'sem conexão'* entre aspas — por isso as três formas de CÓDIGO, e não a palavra)
    ['apps/native/src/screens/SetlistsScreen.tsx', ["texto: 'sem conexão'", "? 'sem conexão' :", "'erro.sem_conexao': 'sem conexão'", '>Buscar música<', '>Tentar novamente<', '` · mostrando dados de', "'falha no servidor'", "return 'nunca'"]],
    ['apps/native/src/screens/LibraryScreen.tsx', ["'Buscar música'", "'Tentar novamente'", "'carregando…'", "'Biblioteca'"]],
  ]

  it.each(COPIAS)('nenhuma cópia em %s: as frases saem do core', (arquivo, copias) => {
    const fonte = ler(arquivo)
    for (const c of copias) expect(fonte, c).not.toContain(c)
  })

  // Em par (N4-PR8): o S3e passou do `StageScreen.tsx` para o leitor compartilhado (`Leitor.tsx`, o que o palco e a
  // visualização desenham) — o *arquivo não baixado* continua vindo do core, agora daquele arquivo.
  it('as telas importam do core o que escreviam (o controle do "nenhuma cópia": o texto continua lá, por outro caminho)', () => {
    expect(ler('apps/native/src/screens/SetlistsScreen.tsx')).toContain("{FRASES_DO_TABLET['buscar-musica']}")
    expect(ler('apps/native/src/screens/Leitor.tsx')).toContain("{FRASES_DO_TABLET['arquivo-nao-baixado']}")
    expect(ler('apps/native/src/files.ts')).toContain("FRASES_DO_TABLET['nao-consegui-baixar']")
  })
})

/**
 * (6) **N4-PR8 — as frases do LEITOR que a visualização (V) reusa, no core, sem cópia no palco nem no `files.ts`**
 * (`N4-PR3-anexos/README.md` §1.1, linhas 18–23; o molde da (4) e da (5)). **A base** é o texto que o
 * `StageScreen.tsx` e o `files.ts` escreviam na `main` de antes desta PR (`836d5e6`), copiado aqui verbatim com o
 * arquivo:linha — o core tem de dar o MESMO texto (o palco não muda), e os fontes não podem ter mais a cópia. Duas a
 * mais que a tabela, declaradas: a segunda frase do S3e sem rede (`:862`; o N4-R15 a cita: *"sem rede, a segunda frase
 * troca para a existente"*) e o conjunto FECHADO inteiro das espécies da falha de download (a linha 23 é uma delas:
 * V mostra a que houver, e as quatro são o mesmo mecanismo da W2 — o molde do mapa da falha de sync da (5)).
 */
describe('(6) as frases do leitor que a visualização reusa, no core, sem cópia no palco nem no files.ts', () => {
  const BASE = {
    'tipo-desconhecido': 'tipo desconhecido', // StageScreen.tsx:151 — o MOTIVO['unknown-type']
    'sem-conteudo': 'este item não tem conteúdo', // StageScreen.tsx:136, :141, :146 — no-body, no-key, not-string
    'toque-em-baixar': 'Toque em Baixar para trazê-lo para este aparelho.', // StageScreen.tsx:861
    'baixar-sem-rede': 'Sem conexão agora — toque em Baixar quando a rede voltar.', // StageScreen.tsx:862
    baixar: 'Baixar', // StageScreen.tsx:881 — a palavra do palco; em V, o nome acessível do ícone (N4-E8)
  } as const
  /** `StageScreen.tsx:859-868`: o tamanho já formatado (`' (2,1 MB)'` ou `''`) e a segunda frase pela rede. */
  const apoioDaBase = (titulo: string, tipo: string, tamanho: string, online: boolean): string =>
    `${titulo} · ${tipo}${tamanho} não está neste aparelho. ${online ? BASE['toque-em-baixar'] : BASE['baixar-sem-rede']}`
  /** `files.ts:487-489` (o `motivo`) e `:607` (o `falha`). */
  const vazioDaBase = 'o arquivo chegou vazio'
  const corrompidoDaBase = 'o arquivo chegou corrompido'
  const incompletoDaBase = (bytes: number, esperado: number | null): string => `arquivo incompleto: ${bytes} de ${esperado ?? '?'} bytes`
  const servidorDaBase = (status: string): string => `o servidor respondeu ${status}`

  it('o core dá o texto que o palco e o files.ts escreviam', () => {
    expect(conteudo.FRASES_DO_LEITOR).toStrictEqual(BASE)
    for (const online of [true, false]) {
      for (const tamanho of ['', ' (2,1 MB)', ' (840 KB)']) {
        expect(conteudo.naoEstaNesteAparelho('Partitura de doze páginas', 'partitura', tamanho, online)).toBe(
          apoioDaBase('Partitura de doze páginas', 'partitura', tamanho, online),
        )
      }
    }
    expect(conteudo.FRASES_DA_FALHA_DE_ARQUIVO).toStrictEqual({ vazio: vazioDaBase, corrompido: corrompidoDaBase })
    for (const [b, e] of [[1048576, 2202009], [0, null], [10, 0]] as const) expect(conteudo.arquivoIncompleto(b, e)).toBe(incompletoDaBase(b, e))
    for (const st of ['404', '500', '403']) expect(conteudo.servidorRespondeu(st)).toBe(servidorDaBase(st))
  })

  const COPIAS: [string, string[]][] = [
    ['apps/native/src/screens/StageScreen.tsx', ["titulo: 'este item não tem conteúdo'", "titulo: 'tipo desconhecido'", "'Toque em Baixar para", "'Sem conexão agora", '>Baixar<', 'não está neste aparelho']],
    ['apps/native/src/files.ts', ["'o arquivo chegou vazio'", '`arquivo incompleto:', "'o arquivo chegou corrompido'", '`o servidor respondeu', ': o servidor respondeu ${']],
    ['apps/native/src/screens/Leitor.tsx', ['não está neste aparelho', "'Toque em Baixar", '>baixando o arquivo…<', '>arquivo não baixado<']],
    ['apps/native/src/screens/VisualizacaoScreen.tsx', ["'este item não tem conteúdo'", "'tipo desconhecido'", "'Baixar'", "'não consegui baixar'", "'notas da música'", "'Detalhes'"]],
  ]

  it.each(COPIAS)('nenhuma cópia em %s: as frases saem do core', (arquivo, copias) => {
    const fonte = ler(arquivo)
    for (const c of copias) expect(fonte, c).not.toContain(c)
  })

  it('o palco, o leitor e o files.ts importam do core o que escreviam (o controle do "nenhuma cópia")', () => {
    expect(ler('apps/native/src/screens/StageScreen.tsx')).toContain('FRASES_DO_LEITOR.baixar')
    expect(ler('apps/native/src/screens/StageScreen.tsx')).toContain("FRASES_DO_LEITOR['tipo-desconhecido']")
    expect(ler('apps/native/src/screens/Leitor.tsx')).toContain('naoEstaNesteAparelho(')
    expect(ler('apps/native/src/files.ts')).toContain('arquivoIncompleto(')
    expect(ler('apps/native/src/files.ts')).toContain('servidorRespondeu(')
  })
})
