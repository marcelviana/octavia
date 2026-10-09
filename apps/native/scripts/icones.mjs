#!/usr/bin/env node
/**
 * `gate:icones` — o mapa de ícones contra as duas fontes (V1-PR4, commit 1).
 *
 * Na V1-PR3 esta checagem rodou como script de scratch (`checa-dados.mjs`,
 * anexo F; div. 52: `vitest.config.mts` exclui `apps/**`, então não pode ser
 * teste da suíte). Aqui ela vira gate versionado, com exit code e controle
 * negativo — e entra ANTES do commit que põe ícone novo em tela, pela regra
 * que a PR3 deixou (anexos README, regra 1): o gate vem antes do que ele mede.
 *
 * O que confere, no mapa — desde a I1-PR-4, `packages/identidade/src/icones.ts`
 * (I1-D3); o `src/icones/dados.ts` do app só o reexporta:
 *
 *  1. NOMES — as chaves do mapa são exatamente os nomes da tabela §6.4 do
 *     `DESIGN-V1/README.md` (lida do arquivo, não copiada para cá; `voltar`
 *     aparece duas vezes na tabela e uma no mapa) mais o `log-in`, que a §6.4
 *     declara "fora do catálogo" (E8). Nem a menos, nem a mais.
 *  2. DESENHOS — todo `d`, `circle` e `rect` dos 34 registros do anexo D do
 *     V1-PR3-PRECHECK (o markup do `icones.html`, extraído por script) existe
 *     no mapa; e todo elemento `normal` do mapa está no anexo, com a única
 *     exceção do `log-in`, cujo `d` vem do `telas.html` (E8). Os estados
 *     `ativo`/`inerte`/`em20` vêm da folha de estados e do `telas.html`, não
 *     do catálogo, e por isso não são cobrados contra o anexo D.
 *  3. TINTA — nenhum hex cravado (`#rrggbb`) no mapa, e todo `tinta:` é um
 *     dos três tokens do `TintaIcone` — cor é do tema, nunca do desenho.
 *  5. FORA DO CATÁLOGO — os desenhos que existem no `telas.html` e em nenhuma
 *     tabela do README (§6.4, "Fora do catálogo"). Eram **um** — o `log-in`
 *     do S0, cujo `d` esta regra 2 exemplava por constante — e a V1-PR6 os
 *     leva a **quatro**: as molduras `S0` e `S4b` trazem `email`, `senha` e
 *     `nada-encontrado`, que nenhuma linha da §6.4 nomeia. Cada um é cobrado
 *     contra o `telas.html`, **por forma**: o conjunto de elementos do seu
 *     `normal` tem de ser EXATAMENTE o de um `<svg>` do arquivo congelado, e
 *     de um só. Achar por forma, e não por posição, é o que a regra 4 já fazia
 *     com a tab de 20 dp — e é mais forte do que a constante de antes, porque
 *     a constante era uma transcrição e o `telas.html` é o original.
 *     Acréscimo da V1-PR6, pela mesma regra que a PR3 deixou e a PR4 e a PR5
 *     repetiram — **o gate vem antes do que ele mede**: o S0 é a primeira tela
 *     a pôr desenho fora do catálogo em campo, e até aqui só o `log-in` tinha
 *     quem o cobrasse.
 *
 *  4. EM20 — a exceção da §6.3 (a tab tem QUATRO cordas em 20 dp e seis nos
 *     outros tamanhos), MEDIDA e não afirmada: o `em20` do `tab` é verbatim o
 *     `<svg width="20">` da tab no `telas.html` (o único markup congelado que
 *     tem esse desenho: o catálogo do anexo D só traz a de seis), e a
 *     contagem de cordas é 4 contra 6. Acréscimo da V1-PR5, pela regra que a
 *     PR3 deixou e a PR4 repetiu — **o gate vem antes do que ele mede**: o
 *     chip de tipo do S2 é o primeiro lugar do app que renderiza `tab` em 20
 *     dp, logo o primeiro que exercita o ramo `em20` do `Icone.tsx`, e até
 *     aqui nada cobrava esse ramo (a nota da regra 2 o diz: os estados
 *     `ativo`/`inerte`/`em20` não são cobrados contra o anexo D).
 *
 * Uso:  node scripts/icones.mjs ../../packages/identidade/src/icones.ts → exit 0
 *       node scripts/icones.mjs scripts/__cn__/IconesFalso.ts → o controle
 *                                  negativo: exit 1, 18 acusações
 * Como comando: `pnpm --filter native gate:icones` e `gate:icones:cn`.
 */
/**
 * N2-D33 / errata E17 — OS CINCO DESENHOS DA TELA 2, E A LISTA DE PENDENTES
 *
 * O catálogo vai de 34 para **39 registros** (div. 222: é esta a leitura que
 * torna o 39 verdadeiro — 34 do anexo D do V1 mais 5 do anexo D do
 * `DESIGN-N2/telas.html`; o "32 + log-in + 5" do parêntese da folha não fecha
 * e o 32 é o número do TÍTULO da §6.4 do V1, que já estava 2 abaixo das
 * linhas da própria tabela).
 *
 * Esta extensão entra no **commit 1 da PR-2**, antes de qualquer tela —
 * *o gate vem antes do que ele mede* (`V1-ENCERRAMENTO.md:204`). Mas os cinco
 * desenhos ainda **não existem** no mapa: quem os põe lá é a PR que desenhar a
 * tela. Um gate que reprovasse por isso obrigaria a inverter a ordem, que é
 * justamente o que a regra proíbe. Daí a lista `PENDENTES`:
 *
 *   • nome pendente **ausente** do mapa  → **AVISO**, nunca acusação;
 *   • nome pendente **presente** no mapa → cobrado como qualquer outro, e
 *     elemento a elemento contra o registro dele no anexo D do N2. Aparecer
 *     errado reprova.
 *
 * **A PR que desenhar os ícones poda esta lista** — é o mesmo mecanismo das
 * exceções do `g1.sh` (div. 141) e das erratas do `g2g3.sh` (div. 195): a
 * lista é estado de uma PR guardado num arquivo que sobrevive à PR, e por isso
 * o gate GRITA os pendentes em toda corrida.
 *
 * **Seis nomes, cinco registros** (div. 226). `adicionar / remover` é UM
 * registro do anexo D — "um par, não dois desenhos: mesmo círculo, mesma corda
 * de 8" — mas são DUAS entradas no mapa, porque o app renderiza as duas na
 * mesma tela (o picker adiciona, a linha de S2 remove) e o `Desenho` do
 * `dados.ts` não tem estado que comporte "o outro do par". Não é novidade de
 * forma: o V1 já tem 34 linhas de §6.4 para 33 nomes distintos (`voltar`
 * aparece duas vezes), e aqui é o avesso — um registro para dois nomes. Por
 * isso a conta do anexo (39) e a de nomes esperados (43) diferem, e as duas
 * são impressas.
 *
 * O anexo D do N2 é lido do `telas.html` congelado, não transcrito: o registro
 * tem TRÊS células (normal · ativo · inativo) e a do meio, no par, carrega o
 * `remover` em vez de um estado — por isso a cobrança é contra a UNIÃO dos
 * elementos das três células do registro, e não célula a célula.
 */
/**
 * N4-PR4 — A FOLHA DO N4 COMO FONTE DE SEIS REGISTROS, EM PAR (N4-D75)
 *
 * O `DESIGN-N4/telas.html` (seção "5 · Ícones — decididos") traz duas tabelas:
 * os quatro de tipo **substituídos** (P-I9 `letra` · P-I10 `cifra` · P-I11 `tab`
 * · P-I12 `partitura`, N4-D69) e os dois **novos** (P-I1a/P-I1b a `estrela`, um
 * registro com dois estados, N4-D76; P-I2 o `tocar`). O catálogo vai de 39 a
 * **41 registros** (43 → 45 nomes). A regra 7, abaixo, cobra os seis contra a
 * folha, ESTADO A ESTADO e TAMANHO A TAMANHO, pelo que o `Icone.tsx` desenha
 * (a geometria, o preenchimento e o traço efetivo), e não só pela forma.
 *
 * **A troca é PAR declarado** (regra 14 do `LOGS-OCTAVIA.md`): `TROCAS_N4`
 * diz, para cada um dos quatro, o desenho velho → o novo, com a razão. O
 * velho é o registro do anexo D do V1, e o gate exige que ele SAIA do mapa
 * (estado nenhum o carrega) e que o novo ENTRE igual à folha. A regra 2
 * deixa de cobrar o velho só porque o par o declara — e um par cujo velho
 * continua no mapa reprova.
 *
 * **A conversão da folha para o catálogo** (decisão do Marcel, N4-D86): os
 * quatro de tipo vêm numa grade de 20 dentro de `<g transform="scale(1.2)"
 * stroke-width="1.5">` — traço fixo de 1,8 unidades do viewBox 24 em todo
 * tamanho. A folha diz por escrito *"grade de 20 px com traço de 1,5 px; em 24
 * e 28 escalam com o traço do catálogo"*. Então: a geometria entra ×1,2 (o
 * gate faz a conta, não a transcreve); em **20** o desenho é o `em20`, igual à
 * folha com `traco: 1.8`; em **24 e 28** é o `normal`, com o traço da família
 * (`TRACO`). O 1,8 do markup em 24/28 → o `TRACO` é o segundo par
 * (`TRACO_N4D86`), e o gate o imprime.
 *
 * **A exceção `em20` da tab sai em par** (`EM20_N4`): a tab de quatro cordas
 * do `DESIGN-V1/telas.html` (§6.3) dá lugar à T1, que tem as mesmas três
 * linhas em todo tamanho; o `em20` dos quatro passa a ser só o traço da
 * N4-D86. A regra 4 cobra as duas metades: o desenho velho fora, o novo
 * dentro, e as linhas contadas (3 em todo tamanho, não mais 4 contra 6).
 *
 * **A estrela inerte tem duas formas** (decisão do Marcel, N4-D87): vazada
 * (`inerte`) e cheia (`ativoInerte`), as duas com traço 1,25 — o `Desenho`
 * ganhou o campo, e o coletor o lê. O pressionado é o desenho do normal, e o
 * "em andamento" é o inerte com o arco de 42 em volta — o arco é da tela, não
 * do ícone, e o gate o separa pela `viewBox`.
 */
/**
 * QL-PR4 — A FOLHA DO QL COMO FONTE DA DIVISA (QL-D31; catálogo 41 → 42)
 *
 * O `DESIGN-QL/telas.html` traz a amostra `QL-divisa-amostra` (seção 3): a
 * divisa ao lado da estrela e do ▶ do N4, nos dois temas, em 20, 24 e 4 ×. A
 * divisa é UM registro com dois estados, o mesmo traço espelhado — como a
 * estrela: `normal` é a ABERTA (para cima; o toque recolhe) e `ativo` a
 * RECOLHIDA (para baixo; o toque abre). A regra 8, abaixo, cobra as oito
 * células de 20 e 24 (aberta · recolhida × escuro · claro) pelo desenho
 * efetivo, como a regra 7 — a geometria, o preenchimento e o traço da família
 * em cada tamanho —, e as dezoito molduras de notas (`QL-*-S3-notas-*`): cada
 * uma desenha UMA divisa, no estado da moldura (abertas e longa → aberta;
 * recolhidas → recolhida). O 4 × é ampliação de leitura, não tamanho do
 * catálogo, e fica fora da cobrança.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const README = join(RAIZ, 'docs/native/DESIGN-V1/README.md')
const ANEXO_D = join(RAIZ, 'docs/native/V1-PR3-PRECHECK-anexos/V1-PR3-D-icones-34.txt')
const TELAS = join(RAIZ, 'docs/native/DESIGN-V1/telas.html')
const TELAS_N2 = join(RAIZ, 'docs/native/DESIGN-N2/telas.html')
const TELAS_N4 = join(RAIZ, 'docs/native/DESIGN-N4/telas.html')
const TELAS_QL = join(RAIZ, 'docs/native/DESIGN-QL/telas.html')
const MAPA = process.argv[2] ?? join(RAIZ, 'packages/identidade/src/icones.ts')

/**
 * §6.4, "Fora do catálogo": os desenhos que o `telas.html` tem e o catálogo
 * não. Era um (`log-in` do S0, E8) e a V1-PR6 o levou a quatro, com as
 * molduras `S0` (`email`, `senha`) e `S4b` (`nada-encontrado`). Lista
 * FECHADA: acrescentar um nome aqui é decisão declarada, como a de lá.
 */
const FORA_DO_CATALOGO = ['log-in', 'email', 'senha', 'nada-encontrado']
const TINTAS = ['lineInfo', 'offlineInk', 'accentInk']

/**
 * Anexo D do `DESIGN-N2` (N2-D33, E17): o nome do REGISTRO na folha → os
 * nomes que ele vale no mapa. Lista FECHADA, como a `FORA_DO_CATALOGO`.
 */
const REGISTROS_N2 = {
  'nova setlist': ['nova-setlist'],
  'alça': ['alca'],
  renomear: ['renomear'],
  'apagar setlist': ['apagar-setlist'],
  'adicionar / remover': ['adicionar', 'remover'],
}

/**
 * Os nomes que o mapa AINDA não tem, e cuja ausência é AVISO e não acusação
 * (ver o cabeçalho). **A PR que desenhar os ícones poda esta lista.**
 */
const PENDENTES = []
// N2-PR3 podou `nova-setlist`: o desenho entrou no mapa no commit 2 daquela
// PR (S1 ganhou o botão), e a partir dali ele é cobrado pela regra 6 como
// qualquer outro — elemento a elemento contra o registro dele no anexo D.
//
// **N2-PR4 poda outros TRÊS**: `renomear`, `apagar-setlist` e `remover`, que
// são os que S2 com edição desenha. Restam DOIS nomes: a `alca` é do modo de
// reordenar (PR-5) e o `adicionar` é do picker (PR-6).
//
// **Meio par, e o gate o trata sem regra nova.** `adicionar / remover` é UM
// registro do anexo D e DOIS nomes no mapa (div. 226); com o `remover`
// desenhado e o `adicionar` não, o gate faz as duas coisas ao mesmo tempo, e
// é o certo: o `remover` é COBRADO pela regra 6, elemento a elemento, contra
// a união das três células do registro (onde moram o círculo r 8,5, a corda
// de 8 e a meia corda de 4), e o `adicionar` segue AVISANDO pela regra 1. O
// par só sai da lista de pendentes quando o `+` existir — isto é, na PR-6.
//
// **N2-PR5 poda a `alca`**, no commit 1 — antes do desenho, de propósito:
// entre o commit 1 e o commit 2 o mapa real REPROVA por "falta no mapa:
// alca", que é o gate dizendo "podaram o pendente e não desenharam". Resta
// UM nome, o `adicionar`, que é do picker (PR-6).
//
// **N2-PR6 poda o ÚLTIMO**, no commit 1, pela mesma razão: entre o commit 1
// e o commit 2 o mapa real reprova por "falta no mapa: adicionar". Depois
// dele a lista fica VAZIA — os 39 registros do anexo D estão todos no mapa,
// o par `adicionar / remover` inteiro, e o aviso de "pendente" deixa de
// aparecer. A lista continua existindo (vazia) porque o mecanismo é o mesmo
// das exceções do `g1.sh` e das erratas do `g2g3.sh`: a próxima tela que
// trouxer desenho novo declara aqui antes de desenhar.

/**
 * §6.3 — cordas da tab por tamanho. Era *"quatro em 20 dp, seis nos outros"*;
 * desde a N4-PR4 é a T1 (N4-D69): três linhas em todo tamanho (o par em
 * `EM20_N4`).
 */
const CORDAS = { em20: 3, normal: 3 }

/** §5.5 — o traço da família por tamanho, o mesmo do `TRACO` do pacote. */
const TRACO_FAMILIA = { 20: 1.5, 24: 1.75, 28: 2 }

/**
 * DESIGN-N4, seção 5 (N4-D68, N4-D69, N4-D76): a linha `P-I*` da folha → o
 * nome no mapa e o estado que ela desenha. Lista FECHADA, como a
 * `REGISTROS_N2`. `novo: true` = registro que não existia (conta para os 41).
 */
const REGISTROS_N4 = {
  'P-I9': { nome: 'letra', tipo: true },
  'P-I10': { nome: 'cifra', tipo: true },
  'P-I11': { nome: 'tab', tipo: true },
  'P-I12': { nome: 'partitura', tipo: true },
  'P-I1a': { nome: 'estrela', estado: 'normal', inerte: 'inerte', novo: true },
  'P-I1b': { nome: 'estrela', estado: 'ativo', inerte: 'ativoInerte' },
  'P-I2': { nome: 'tocar', estado: 'normal', inerte: 'inerte', novo: true },
}

/**
 * O PAR da troca (regra 14): desenho velho → novo, com a razão. O velho é o
 * registro do anexo D do V1 com o mesmo nome; tem de SAIR do mapa.
 */
const TROCAS_N4 = {
  letra: { de: 'anexo D do V1 · letra (quatro linhas de texto)', para: 'P-I9', razao: 'N4-D69 — L1 · Aa' },
  cifra: { de: 'anexo D do V1 · cifra (acordes sobre a letra)', para: 'P-I10', razao: 'N4-D69 — C2 · a palheta' },
  tab: { de: 'anexo D do V1 · tab (seis cordas e três trastes)', para: 'P-I11', razao: 'N4-D69 — T1 · linhas com um 2' },
  partitura: { de: 'anexo D do V1 · partitura (pauta de cinco linhas e nota)', para: 'P-I12', razao: 'N4-D69 — P2 · a nota única' },
}

/**
 * O PAR do `em20` (regra 14): a exceção da §6.3 (a tab de quatro cordas do
 * `DESIGN-V1/telas.html`) → o `em20` dos quatro de tipo, que é o mesmo
 * desenho do `normal` com o traço da folha em 20 (N4-D86).
 */
const EM20_N4 = {
  tab: { de: 'DESIGN-V1/telas.html · tab@20 de quatro cordas (§6.3)', para: 'P-I11 em 20, traço 1,8', razao: 'N4-D69 + N4-D86' },
  letra: { de: 'sem em20', para: 'P-I9 em 20, traço 1,8', razao: 'N4-D86' },
  cifra: { de: 'sem em20', para: 'P-I10 em 20, traço 1,8', razao: 'N4-D86' },
  partitura: { de: 'sem em20', para: 'P-I12 em 20, traço 1,8', razao: 'N4-D86' },
}

/**
 * O PAR do traço em 24 e 28 (N4-D86): o markup da folha desenha 1,8 em todo
 * tamanho; o texto dela e a decisão dão o traço da família. O gate compara a
 * geometria contra a folha e o traço contra `TRACO_FAMILIA` nesses tamanhos.
 */
const TRACO_N4D86 = { de: 'markup da folha: 1,8 em 24 e 28', para: 'TRACO da família (1,75 · 2)', razao: 'N4-D86 — "em 24 e 28 escalam com o traço do catálogo"' }

/**
 * DESIGN-QL, `QL-divisa-amostra` (QL-D31): o rótulo da célula → o nome no mapa
 * e o estado que ela desenha. Lista FECHADA, como a `REGISTROS_N4`. É UM
 * registro novo (o 42º).
 */
const REGISTROS_QL = {
  'divisa · aberta': { nome: 'divisa', estado: 'normal' },
  'divisa · recolhida': { nome: 'divisa', estado: 'ativo' },
}
/** As molduras de notas (QL-D30): o estado delas → o estado da divisa que desenham. */
const DIVISA_DAS_MOLDURAS = { abertas: 'normal', longa: 'normal', recolhidas: 'ativo' }

/** "última sincronização" → `ultima-sincronizacao`; "zoom −" → `zoom-menos`; "n.º de músicas" → `n-de-musicas`. */
function chave(nomeDaTabela) {
  return nomeDaTabela
    .replace(/n\.\u00BA/g, 'n')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\u2212/g, 'menos').replace(/\+/g, 'mais')
    .replace(/\(avulsa\)/g, '').replace(/\u2026/g, '').replace(/[()]/g, '')
    .trim().replace(/\s+/g, '-')
}

/** As linhas da tabela §6.4 (entre o cabeçalho "### 6.4" e "Fora do catálogo"). */
function nomesDa64() {
  const md = readFileSync(README, 'utf8')
  const ini = md.indexOf('### 6.4')
  const fim = md.indexOf('Fora do catálogo', ini)
  const linhas = md.slice(ini, fim).split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| ícone') && !l.startsWith('| ---'))
  return linhas.map((l) => chave(l.split('|')[1].trim()))
}

/**
 * O `telas.html` é um arquivo único: as 22 molduras vivem dentro de um
 * `<script type="__bundler/template">` como STRING JSON escapada. Decodificar
 * é o único jeito de ler o markup congelado sem abrir o arquivo no navegador.
 */
function telas(arquivo = TELAS) {
  const bruto = readFileSync(arquivo, 'utf8')
  const m = /<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/.exec(bruto)
  if (m === null) throw new Error(`sem __bundler/template em ${arquivo}`)
  return JSON.parse(m[1])
}

/**
 * As cordas de um desenho de tab: as linhas HORIZONTAIS do `d`, contadas por
 * y DISTINTO — a corda partida pelo traste são dois comandos `h` no mesmo y,
 * e é uma corda só (§6.3, "traço interrompido": o vão se mede na forma).
 */
function cordas(d) {
  const ys = new Set()
  for (const m of d.matchAll(/M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)) ys.add(+m[2])
  return ys.size
}

/**
 * Os registros do anexo D do `DESIGN-N2/telas.html`, lidos do congelado.
 *
 * A seção é `<section data-screen-label="anexo D icones">`; cada registro é
 * uma linha da grade que começa com `<div style="font-size:15px;color:#F9F5F1">NOME</div>`
 * e traz três `<svg>` (normal · ativo · inativo). A cobrança é contra a UNIÃO
 * dos elementos dos três, e não célula a célula — no par `adicionar /
 * remover` a célula do meio carrega o OUTRO desenho do par, não um estado.
 */
function anexoDN2() {
  const t = telas(TELAS_N2)
  const ini = t.indexOf('data-screen-label="anexo D icones"')
  if (ini === -1) throw new Error(`sem a seção do anexo D em ${TELAS_N2}`)
  const fim = t.indexOf('<!-- ============ PROPOSTAS', ini)
  const secao = t.slice(ini, fim === -1 ? undefined : fim)
  const out = new Map()
  const linhas = [...secao.matchAll(/<div style="font-size:15px;color:#F9F5F1">([^<]+)<\/div>([\s\S]*?)(?=<div style="font-size:15px;color:#F9F5F1">|$)/g)]
  for (const [, nome, corpo] of linhas) {
    if (!(nome in REGISTROS_N2)) continue
    const ass = new Set()
    for (const m of corpo.matchAll(/<svg [\s\S]*?<\/svg>/g)) for (const a of assinaturasSvg(m[0])) ass.add(a)
    out.set(nome, ass)
  }
  return out
}

/** Assinaturas dos elementos de um trecho de markup SVG (anexo D). */
function assinaturasSvg(svg) {
  const out = new Set()
  for (const m of svg.matchAll(/ d="([^"]+)"/g)) out.add(`d ${m[1]}`)
  for (const m of svg.matchAll(/<circle ([^>]*)>/g)) {
    const a = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]))
    out.add(`circle ${+a.cx} ${+a.cy} ${+a.r}`)
  }
  for (const m of svg.matchAll(/<rect ([^>]*)>/g)) {
    const a = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]))
    out.add(`rect ${+a.x} ${+a.y} ${+a.width} ${+a.height} ${+a.rx}`)
  }
  return out
}

/** Assinaturas dos elementos de uma lista de primitivas do mapa (`[{ d: … }, { cx, cy, r }, { x, y, w, h, rx }]`). */
function assinaturasMapa(lista) {
  const out = new Set()
  for (const m of lista.matchAll(/d: '([^']+)'/g)) out.add(`d ${m[1]}`)
  for (const m of lista.matchAll(/cx: ([\d.]+), cy: ([\d.]+), r: ([\d.]+)/g)) out.add(`circle ${+m[1]} ${+m[2]} ${+m[3]}`)
  for (const m of lista.matchAll(/x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+), rx: ([\d.]+)/g))
    out.add(`rect ${+m[1]} ${+m[2]} ${+m[3]} ${+m[4]} ${+m[5]}`)
  return out
}

// ---- N4: o desenho EFETIVO (geometria · preenchimento · traço), dos dois lados

/** Números de um `d` em tokens; `k` escala tudo, menos rotação e bandeiras do arco. */
function tokensD(d, k = 1) {
  const out = []
  let cmd = ''
  let i = 0
  for (const tk of d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)/g) ?? []) {
    if (/[A-Za-z]/.test(tk)) { cmd = tk; i = 0; out.push(tk); continue }
    const fixo = cmd.toLowerCase() === 'a' && [2, 3, 4].includes(i % 7)
    out.push(fixo ? +tk : Math.round(+tk * k * 1000) / 1000)
    i++
  }
  return out.join(' ')
}

/**
 * O `<svg>` da folha do N4 em primitivas efetivas. Os quatro de tipo vêm em
 * `<g transform="scale(k)" stroke-width="s">`: a geometria escala por `k` e o
 * traço efetivo, no viewBox 24, é `s × k` (N4-D86).
 */
function efetivoDaFolha(svg) {
  const m = /<svg ([^>]*)>([\s\S]*?)<\/svg>/.exec(svg)
  const largura = +/width="([\d.]+)"/.exec(m[1])[1]
  const sw = +/stroke-width="([\d.]+)"/.exec(m[1])[1]
  const g = /<g transform="scale\(([\d.]+)\)" stroke-width="([\d.]+)">/.exec(m[2])
  const k = g === null ? 1 : +g[1]
  const traco = g === null ? sw : Math.round(+g[2] * k * 1000) / 1000
  const prims = [...m[2].matchAll(/<path d="([^"]+)"([^>]*)>/g)].map(([, d, resto]) => {
    const cheio = /fill="#/.test(resto)
    return `${cheio ? 'fill' : `traco ${traco}`} | ${tokensD(d, k)}`
  })
  return { largura, prims }
}

/** Uma lista literal do mapa (`[{ d: '…', fill: true }, …]`) em objetos. */
function primitivasDoMapa(lista) {
  return [...lista.matchAll(/\{ ([^{}]*) \}/g)].map(([, corpo]) => {
    const o = {}
    for (const [, k, v] of corpo.matchAll(/(\w+): ('[^']*'|[\w.]+)/g)) o[k] = v.startsWith("'") ? v.slice(1, -1) : v
    return o
  })
}

/** O que o `Icone.tsx` desenha para `nome` em `tamanho` e `estado` — a escolha do `elementos()`. */
function efetivoDoMapa(nome, tamanho, estado) {
  const pega = (e) => listas.get(`${nome}:${e}`)
  let lista
  if (estado !== 'normal') lista = pega(estado)
  else lista = (tamanho === 20 ? pega('em20') : undefined) ?? pega('normal')
  if (lista === undefined) return null
  return primitivasDoMapa(lista).map((p) => {
    if (p.d === undefined) return `não-path | ${JSON.stringify(p)}`
    return `${p.fill === 'true' ? 'fill' : `traco ${p.traco !== undefined ? +p.traco : TRACO_FAMILIA[tamanho]}`} | ${tokensD(p.d)}`
  })
}

/** As linhas `P-I*` da seção 5 do `DESIGN-N4/telas.html`: id → células (cada uma, os `<svg>` dela). */
function linhasN4() {
  const t = telas(TELAS_N4)
  const ini = t.indexOf('data-screen-label="5 Ícones — decididos"')
  if (ini === -1) throw new Error(`sem a seção "5 · Ícones — decididos" em ${TELAS_N4}`)
  const secao = t.slice(ini, t.indexOf('data-screen-label="5b', ini))
  const out = new Map()
  for (const [, id, corpo] of secao.matchAll(/<tr>(?:(?!<\/tr>)[\s\S])*?>(P-I(?:1a|1b|2|9|10|11|12))<\/td>([\s\S]*?)<\/tr>/g)) {
    out.set(id, [...corpo.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => [...c[1].matchAll(/<svg [\s\S]*?<\/svg>/g)].map((s) => s[0])))
  }
  return out
}

/**
 * QL-PR4 — as células da divisa na amostra `QL-divisa-amostra` do `DESIGN-QL/telas.html`: `{ rotulo, tamanho, svg }`
 * (a célula de 4 × tem outra caixa e não casa — ver o cabeçalho); e as molduras `QL-*-S3-notas-*`, cada uma com os
 * `<svg>` de divisa que desenha.
 */
function divisasQL() {
  const t = telas(TELAS_QL)
  const ini = t.indexOf('id="QL-divisa-amostra"')
  if (ini === -1) throw new Error(`sem a amostra "QL-divisa-amostra" em ${TELAS_QL}`)
  const secao = t.slice(ini, t.indexOf('id="QL-', ini + 30))
  const celulas = []
  for (const [, svg, rotulo] of secao.matchAll(/<div style="height:96px[^>]*>(<svg [\s\S]*?<\/svg>)<\/div><div [^>]*>([^<]+)<\/div>/g)) {
    const m = /^(divisa · (?:aberta|recolhida)) · (\d+)$/.exec(rotulo.trim())
    if (m !== null) celulas.push({ rotulo: m[1], tamanho: +m[2], svg })
  }
  const molduras = []
  for (const [, id, estado, corpo] of t.matchAll(/<div id="(QL-[ABC]-S3-notas-(abertas|recolhidas|longa)-(?:escuro|claro))"([\s\S]*?)(?=<div id="(?:QL|EST)-)/g)) {
    const svgs = [...corpo.matchAll(/<svg [\s\S]*?<\/svg>/g)].map((x) => x[0]).filter((x) => DIVISAS_D.some((d) => x.includes(`d="${d}"`)))
    molduras.push({ id, estado, svgs })
  }
  return { celulas, molduras }
}
/** Os dois `d` da divisa na folha (aberta, recolhida) — o que acha a divisa numa moldura. */
const DIVISAS_D = ['M5.5 15.25L12 8.75l6.5 6.5', 'M5.5 8.75L12 15.25l6.5-6.5']

const acusacoes = []
const acusar = (s) => { acusacoes.push(s); console.log(`  ACUSADO ${s}`) }
/** O pendente que ainda não existe: grita, não reprova (ver o cabeçalho). */
const avisos = []
const avisar = (s) => { avisos.push(s); console.log(`  AVISO ${s}`) }

// ---- as duas fontes (três, desde a E17: o anexo D do N2)
const tabela = nomesDa64()
const nomesN2 = Object.values(REGISTROS_N2).flat()
const nomesN4Novos = [...new Set(Object.values(REGISTROS_N4).filter((r) => !r.tipo).map((r) => r.nome))]
const nomesQL = [...new Set(Object.values(REGISTROS_QL).map((r) => r.nome))]
const esperados = new Set([...tabela, ...FORA_DO_CATALOGO, ...nomesN2, ...nomesN4Novos, ...nomesQL])
const anexo = readFileSync(ANEXO_D, 'utf8')
const registros = [...anexo.matchAll(/^### (\S+)  ·  .+?  ·  \d+ dp\n(<svg[\s\S]*?<\/svg>)/gm)]
const doAnexo = new Set(registros.flatMap(([, , svg]) => [...assinaturasSvg(svg)]))
const registrosN2 = anexoDN2()
/** `nome do mapa` → as assinaturas do registro dele no anexo D do N2. */
const anexoPorNome = new Map()
for (const [registro, nomes] of Object.entries(REGISTROS_N2)) {
  const ass = registrosN2.get(registro)
  if (ass === undefined) {
    acusar(`${TELAS_N2} [anexo-D-N2] registro ausente na folha congelada: "${registro}"`)
    continue
  }
  for (const n of nomes) anexoPorNome.set(n, ass)
}

// ---- o mapa (sem os comentários: um hex num comentário não é hex cravado)
const src = readFileSync(MAPA, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
const blocos = [...src.matchAll(/^  '([^']+)': \{\n([\s\S]*?)\n  \},$/gm)]
const nomes = blocos.map((m) => m[1])
const doMapa = new Set()
const normalDoMapa = new Map()
/** `${nome}:${estado}` → a lista literal, para a regra 4 (que compara markup, não só assinatura). */
const listas = new Map()
for (const [, nome, corpo] of blocos) {
  for (const linha of corpo.split('\n')) {
    const m = /^\s+(normal|ativo|inerte|ativoInerte|em20): (\[.*\]),?$/.exec(linha)
    if (m === null) continue
    const ass = assinaturasMapa(m[2])
    listas.set(`${nome}:${m[1]}`, m[2])
    for (const a of ass) doMapa.add(a)
    if (m[1] === 'normal') normalDoMapa.set(nome, ass)
  }
}

// ---- 1. nomes
for (const n of esperados) {
  if (nomes.includes(n)) continue
  // E17/N2-D33: o pendente ainda não desenhado GRITA e não reprova — o gate
  // vem antes da tela que ele mede. Qualquer outro nome ausente reprova.
  if (PENDENTES.includes(n)) avisar(`${MAPA} [pendente] "${n}" ainda não está no mapa (anexo D do DESIGN-N2, E17) — a PR que o desenhar poda a lista PENDENTES`)
  else acusar(`${MAPA} [nome] falta no mapa: "${n}" (§6.4)`)
}
/**
 * N2-PR5 — **nome que o gate não consegue LER é acusação**, não silêncio.
 *
 * O coletor acima lê cada estado de UMA linha (`normal: [ … ],`). Uma entrada
 * escrita em várias linhas entra em `nomes` — conta como "no mapa" e, na regra
 * 6, como "cobrada" — mas a lista dela nunca é comparada com nada. Medido
 * nesta PR: a primeira forma da `alca` passou com `acusações: 0` e o gate
 * imprimiu `4/6 cobrados` com ela já no mapa; e o `apagar-setlist` da N2-PR4
 * estava assim desde que entrou — só o `inerte` dele era lido. O desenho dele
 * estava certo (posto numa linha, zero acusações), mas quem dizia isso era a
 * sorte, não o gate.
 */
for (const [, nome, corpo] of blocos) {
  if (!/^\s+normal: \[.*\],?$/m.test(corpo)) acusar(`${MAPA} [legível] "${nome}" não tem 'normal' numa linha só — o gate não lê a lista, e o desenho passaria sem ser comparado`)
}
for (const n of nomes) if (!esperados.has(n)) acusar(`${MAPA} [nome] sobra no mapa: "${n}" (não está na §6.4)`)
const repetidos = nomes.filter((n, i) => nomes.indexOf(n) !== i)
for (const n of repetidos) acusar(`${MAPA} [nome] repetido no mapa: "${n}"`)

// ---- 2. desenhos
/**
 * N4-PR4 — o VELHO de cada par de `TROCAS_N4`: os elementos do registro do
 * anexo D com aquele nome que nenhum outro registro tem. Saem da cobrança
 * "todo elemento do anexo D está no mapa" e passam a ser cobrados AUSENTES.
 */
const velhoN4 = new Map()
for (const nome of Object.keys(TROCAS_N4)) {
  const reg = registros.find(([, n]) => n === nome)
  if (reg === undefined) { acusar(`${ANEXO_D} [troca-N4] o par de "${nome}" aponta para um registro que o anexo D do V1 não tem`); continue }
  const outros = new Set(registros.filter(([, n]) => n !== nome).flatMap(([, , svg]) => [...assinaturasSvg(svg)]))
  velhoN4.set(nome, new Set([...assinaturasSvg(reg[2])].filter((a) => !outros.has(a))))
}
const doVelhoN4 = new Set([...velhoN4.values()].flatMap((s) => [...s]))
for (const a of doAnexo) if (!doMapa.has(a) && !doVelhoN4.has(a)) acusar(`${MAPA} [desenho] do anexo D ausente do mapa: ${a}`)
for (const [nome, ass] of normalDoMapa) {
  // Fora do catálogo não tem o que estar no anexo D — quem o cobra é a regra 5.
  if (FORA_DO_CATALOGO.includes(nome)) continue
  // Os da tela 2 têm anexo PRÓPRIO (E17) e são cobrados na regra 6.
  if (anexoPorNome.has(nome)) continue
  // Os seis do DESIGN-N4 (os quatro trocados e os dois novos) são cobrados na regra 7.
  if (nome in TROCAS_N4 || nomesN4Novos.includes(nome)) continue
  // A divisa do DESIGN-QL é cobrada na regra 8.
  if (nomesQL.includes(nome)) continue
  for (const a of ass) {
    if (!doAnexo.has(a)) acusar(`${MAPA} [desenho] 'normal' de "${nome}" não está no anexo D: ${a}`)
  }
}

// ---- 3. tinta
for (const m of src.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
  const ln = src.slice(0, m.index).split('\n').length
  acusar(`${MAPA}:${ln} [tinta] hex cravado: ${m[0]}`)
}
for (const m of src.matchAll(/tinta: '([^']*)'/g)) {
  if (TINTAS.includes(m[1])) continue
  const ln = src.slice(0, m.index).split('\n').length
  acusar(`${MAPA}:${ln} [tinta] token desconhecido: '${m[1]}' (esperado: ${TINTAS.join(' | ')})`)
}

// ---- 4. em20: a exceção da §6.3 em PAR (N4-PR4, `EM20_N4`) — o velho fora, o novo dentro, contados
/**
 * O VELHO: o único `<svg width="20">` do `DESIGN-V1/telas.html` com DOIS rects
 * de rx 1.7 é a tab de quatro cordas (os trastes). Ele tem de continuar
 * achável — o par aponta para algo que existe — e nenhum elemento dele pode
 * estar no `em20` da tab. O NOVO: o `em20` de cada um dos quatro é cobrado
 * contra a folha do N4 na regra 7 (o mesmo desenho do `normal`, traço 1,8).
 */
const tabEm20 = listas.get('tab:em20')
const tabNormal = listas.get('tab:normal')
let svgTab20 = null
let n20 = 0
let n6 = 0
{
  const candidatos = [...telas().matchAll(/<svg width="20"[\s\S]*?<\/svg>/g)]
    .map((m) => m[0])
    .filter((svg) => (svg.match(/rx="1\.7"/g) ?? []).length === 2)
  const distintos = new Set(candidatos)
  if (distintos.size !== 1) {
    acusar(`${TELAS} [em20-N4] o par aponta para a tab@20 de quatro cordas, e o telas.html tem ${distintos.size} desenhos distintos dela (esperado 1)`)
  } else {
    svgTab20 = [...distintos][0]
    const velho = assinaturasSvg(svgTab20)
    for (const nome of Object.keys(EM20_N4)) {
      const lista = listas.get(`${nome}:em20`)
      if (lista === undefined) { acusar(`${MAPA} [em20-N4] "${nome}" não tem 'em20' — o par ${EM20_N4[nome].de} → ${EM20_N4[nome].para} (${EM20_N4[nome].razao})`); continue }
      for (const a of assinaturasMapa(lista)) if (velho.has(a)) acusar(`${MAPA} [em20-N4] o 'em20' de "${nome}" ainda carrega a tab de quatro cordas: ${a}`)
    }
  }
  // As linhas da tab — o que a §6.3 declarava (4 × 6), contado agora na T1:
  // só os `d` feitos de M e h (as linhas), não o "2".
  const linhas = (lista) => [...(lista ?? '').matchAll(/d: '([^']+)'/g)].filter((m) => /^[Mh\d.\s-]+$/.test(m[1])).reduce((a, m) => a + cordas(m[1]), 0)
  n20 = linhas(tabEm20)
  n6 = linhas(tabNormal)
  if (n20 !== CORDAS.em20) acusar(`${MAPA} [em20-N4] a tab de 20 dp tem ${n20} linhas, e a T1 (N4-D69) tem ${CORDAS.em20}`)
  if (n6 !== CORDAS.normal) acusar(`${MAPA} [em20-N4] a tab de 24/28 dp tem ${n6} linhas, e a T1 (N4-D69) tem ${CORDAS.normal}`)
}

// ---- 5. fora do catálogo: cada um verbatim de UM <svg> do telas.html, por forma
const porAssinatura = new Map()
for (const svg of [...telas().matchAll(/<svg [\s\S]*?<\/svg>/g)].map((m) => m[0])) {
  const k = [...assinaturasSvg(svg)].sort().join(' | ')
  porAssinatura.set(k, (porAssinatura.get(k) ?? 0) + 1)
}
let foraOk = 0
for (const nome of FORA_DO_CATALOGO) {
  const lista = listas.get(`${nome}:normal`)
  if (lista === undefined) {
    acusar(`${MAPA} [fora-do-catálogo] "${nome}" não tem 'normal' no mapa`)
    continue
  }
  const k = [...assinaturasMapa(lista)].sort().join(' | ')
  if (porAssinatura.has(k)) foraOk++
  else acusar(`${MAPA} [fora-do-catálogo] o 'normal' de "${nome}" não é, elemento a elemento, nenhum <svg> do telas.html`)
}

// ---- 6. os cinco do DESIGN-N2 (E17, N2-D33): só quem JÁ está no mapa
// O que não está é aviso da regra 1. O que está é cobrado elemento a elemento
// contra a UNIÃO das três células do registro dele — no par, a célula do meio
// carrega o outro desenho, não um estado (ver o cabeçalho).
let n2Cobrados = 0
for (const [nome, doRegistro] of anexoPorNome) {
  const temNoMapa = [...listas.keys()].some((k) => k.startsWith(`${nome}:`))
  if (!temNoMapa) continue
  n2Cobrados++
  for (const estado of ['normal', 'ativo', 'inerte', 'em20']) {
    const lista = listas.get(`${nome}:${estado}`)
    if (lista === undefined) continue
    for (const a of assinaturasMapa(lista)) {
      if (!doRegistro.has(a)) acusar(`${MAPA} [anexo-D-N2] '${estado}' de "${nome}" não está no registro do anexo D do DESIGN-N2: ${a}`)
    }
  }
}

// ---- 7. os seis do DESIGN-N4 (N4-D68, N4-D69, N4-D76, N4-D86, N4-D87): estado a estado, tamanho a tamanho
/**
 * Cada célula da linha `P-I*` contra o que o `Icone.tsx` desenha — geometria
 * (o `d`, já escalado pela folha), preenchimento e traço efetivo, NA ORDEM
 * (a estrela cheia é o preenchimento por baixo e o contorno por cima).
 *
 *  - de tipo (P-I9…P-I12): células 20·24·28 · normal·inerte em 20 · claro em
 *    20. Em 20 o mapa tem de dar o markup inteiro, traço incluído (o `em20`);
 *    em 24 e 28, a geometria da folha com o traço da família (`TRACO_N4D86`).
 *    O inerte da folha desenha igual ao normal (o `<g>` fixa o traço) e o
 *    catálogo não tem inerte de tipo: a célula se cobra contra o de 20.
 *  - de ação (P-I1a, P-I1b, P-I2): normal · pressionado · inerte · em
 *    andamento · 20·24·28. O pressionado é o desenho do estado; o em
 *    andamento é o inerte mais o arco de 42, que é da tela (viewBox 42) e
 *    fica fora da comparação.
 */
const n4 = linhasN4()
let n4Cobradas = 0
const comparar = (rotulo, nome, tamanho, estado, svg, trocaTraco, fonte = { arq: TELAS_N4, rot: 'N4' }) => {
  if (fonte.rot === 'N4') n4Cobradas++
  const folha = efetivoDaFolha(svg)
  if (folha.largura !== tamanho) acusar(`${fonte.arq} [${fonte.rot}] ${rotulo}: a célula desenha ${folha.largura} dp, esperado ${tamanho}`)
  let esperado = folha.prims
  if (trocaTraco) esperado = esperado.map((p) => p.replace(/^traco [\d.]+/, `traco ${TRACO_FAMILIA[tamanho]}`))
  const mapa = efetivoDoMapa(nome, tamanho, estado)
  if (mapa === null) { acusar(`${MAPA} [${fonte.rot}] ${rotulo}: "${nome}" não tem o estado '${estado}' que a folha desenha`); return }
  const igual = mapa.length === esperado.length && mapa.every((p, i) => p === esperado[i])
  if (!igual) acusar(`${MAPA} [${fonte.rot}] ${rotulo}: "${nome}" ${estado} @${tamanho} ≠ folha\n      folha: ${esperado.join(' ‖ ')}\n      mapa:  ${mapa.join(' ‖ ')}`)
}
for (const [id, reg] of Object.entries(REGISTROS_N4)) {
  const cel = n4.get(id)
  if (cel === undefined) { acusar(`${TELAS_N4} [N4] linha ausente na folha congelada: ${id}`); continue }
  const so24 = (svgs) => svgs.filter((x) => /viewBox="0 0 24 24"/.test(x))
  if (reg.tipo) {
    const [t20, t24, t28] = so24(cel[2])
    comparar(`${id} 20`, reg.nome, 20, 'normal', t20, false)
    comparar(`${id} 24`, reg.nome, 24, 'normal', t24, true)
    comparar(`${id} 28`, reg.nome, 28, 'normal', t28, true)
    for (const [i, svg] of [...so24(cel[3]), ...so24(cel[4])].entries()) comparar(`${id} 20 (${['normal', 'inerte', 'claro', 'claro inerte'][i]})`, reg.nome, 20, 'normal', svg, false)
    // O par: o velho fora do mapa, em estado nenhum.
    const velho = velhoN4.get(reg.nome) ?? new Set()
    for (const [k, lista] of listas) {
      if (!k.startsWith(`${reg.nome}:`)) continue
      for (const a of assinaturasMapa(lista)) if (velho.has(a)) acusar(`${MAPA} [troca-N4] "${k}" ainda carrega o desenho velho (${TROCAS_N4[reg.nome].de} → ${TROCAS_N4[reg.nome].para}, ${TROCAS_N4[reg.nome].razao}): ${a}`)
    }
  } else {
    const [normal] = so24(cel[1]); const [press] = so24(cel[2]); const [inerte] = so24(cel[3]); const [andamento] = so24(cel[4])
    comparar(`${id} normal`, reg.nome, 24, reg.estado, normal, false)
    comparar(`${id} pressionado`, reg.nome, 24, reg.estado, press, false)
    comparar(`${id} inerte`, reg.nome, 24, reg.inerte, inerte, false)
    comparar(`${id} em andamento`, reg.nome, 24, reg.inerte, andamento, false)
    const [t20, t24, t28] = so24(cel[5])
    comparar(`${id} 20`, reg.nome, 20, reg.estado, t20, false)
    comparar(`${id} 24`, reg.nome, 24, reg.estado, t24, false)
    comparar(`${id} 28`, reg.nome, 28, reg.estado, t28, false)
  }
}

// ---- 8. a divisa do DESIGN-QL (QL-D31): as oito células da amostra e as dezoito molduras de notas
/**
 * A amostra: cada célula de 20 e 24 contra o que o `Icone.tsx` desenha, pela `comparar` da regra 7 (geometria,
 * preenchimento e traço efetivo, na ordem) — a aberta é o `normal`, a recolhida o `ativo`. As molduras: cada
 * `QL-*-S3-notas-*` desenha UMA divisa, de 20, no estado dela (abertas e longa → aberta; recolhidas → recolhida).
 */
const FONTE_QL = { arq: TELAS_QL, rot: 'QL' }
const ql = divisasQL()
let qlCelulas = 0
for (const c of ql.celulas) {
  const reg = REGISTROS_QL[c.rotulo]
  qlCelulas++
  comparar(`${c.rotulo} · ${c.tamanho}`, reg.nome, c.tamanho, reg.estado, c.svg, false, FONTE_QL)
}
if (qlCelulas !== 8) acusar(`${TELAS_QL} [QL] a amostra da divisa tem ${qlCelulas} células de 20 e 24, esperado 8 (aberta · recolhida × 20 · 24 × escuro · claro)`)
let qlMolduras = 0
for (const m of ql.molduras) {
  qlMolduras++
  if (m.svgs.length !== 1) { acusar(`${TELAS_QL} [QL] ${m.id}: ${m.svgs.length} divisas, esperado 1`); continue }
  comparar(`${m.id}`, 'divisa', 20, DIVISA_DAS_MOLDURAS[m.estado], m.svgs[0], false, FONTE_QL)
}
if (qlMolduras !== 18) acusar(`${TELAS_QL} [QL] ${qlMolduras} molduras de notas, esperado 18 (abertas · recolhidas · longa × C · B · A × escuro · claro)`)

const novosN4 = Object.values(REGISTROS_N4).filter((r) => r.novo).length
const novosQL = nomesQL.length
const totalRegistros = registros.length + registrosN2.size + novosN4 + novosQL
console.log(`  §6.4: ${tabela.length} linhas → ${new Set(tabela).size} nomes distintos, + ${FORA_DO_CATALOGO.length} fora do catálogo + ${nomesN2.length} da tela 2 + ${nomesN4Novos.length} do N4 + ${nomesQL.length} do QL = ${esperados.size} esperados`)
console.log(`  anexo D: ${registros.length} registros (V1) + ${registrosN2.size} (DESIGN-N2, E17) + ${novosN4} (DESIGN-N4, N4-D76) + ${novosQL} (DESIGN-QL, QL-D31) = ${totalRegistros} registros · ${doAnexo.size} elementos distintos no do V1`)
if (totalRegistros !== 42) acusar(`[QL-D31] o catálogo tem ${totalRegistros} registros e a QL-D31 declara 42`)
console.log(`  DESIGN-N4: ${n4.size}/${Object.keys(REGISTROS_N4).length} linhas P-I achadas · ${n4Cobradas} células cobradas · trocas em par: ${Object.keys(TROCAS_N4).length} (${[...velhoN4.values()].reduce((a, s) => a + s.size, 0)} elementos velhos cobrados ausentes)`)
console.log(`  pares do N4: em20 ${Object.keys(EM20_N4).length} (${EM20_N4.tab.de} → ${EM20_N4.tab.para}) · traço em 24/28: ${TRACO_N4D86.de} → ${TRACO_N4D86.para}`)
console.log(`  DESIGN-QL (QL-D31): a divisa — ${qlCelulas} células da amostra cobradas · ${qlMolduras} molduras de notas, cada uma com a divisa no estado dela`)
console.log(`  tela 2 (E17): ${n2Cobrados}/${anexoPorNome.size} nomes já no mapa e cobrados · ${PENDENTES.length} declarados pendentes`)
console.log(`  mapa: ${nomes.length} nomes · ${doMapa.size} elementos distintos · ${normalDoMapa.size} com 'normal'`)
console.log(`  hex cravado: ${(src.match(/#[0-9A-Fa-f]{6}\b/g) ?? []).length} · tinta por token: ${(src.match(/tinta: '/g) ?? []).length}`)
console.log(`  §6.3 → T1 (N4-D69): tab em20 ${n20} linhas · normal ${n6} linhas · a tab@20 de quatro cordas do telas.html (o velho do par): ${svgTab20 === null ? 'NÃO ACHADA' : 'achada'}`)
console.log(`  fora do catálogo: ${foraOk}/${FORA_DO_CATALOGO.length} idênticos a um <svg> do telas.html (${porAssinatura.size} assinaturas distintas no arquivo)`)
if (avisos.length > 0) {
  console.log(`  PENDENTES DECLARADOS E AUSENTES — poda a lista quando desenhar (N2-D33): ${avisos.length}`)
}
console.log(`  acusações: ${acusacoes.length} · avisos: ${avisos.length}`)
process.exit(acusacoes.length > 0 ? 1 : 0)
