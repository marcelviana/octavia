/**
 * `gerar-css.mjs` — os tokens de `@octavia/identidade` como CSS custom
 * properties, para o web (I1-D3; esquema do aval da I1-PR-4, decisão 1).
 *
 * Uso (da raiz):  pnpm exec tsx packages/identidade/scripts/gerar-css.mjs
 *   → escreve `app/styles/identidade.css`. O arquivo é DERIVADO: não se edita
 *   à mão; o `packages/identidade/test/css.test.ts` regenera e compara, e
 *   reprova se o commitado divergir da fonte ("gerado == fonte").
 *
 * 1 dp = 1 px (I1-D3), sem conversão. Os nomes: camelCase do pacote →
 * kebab-case, sob o prefixo da família do token.
 *
 * AS FAIXAS. Cada faixa é um `@media` de INTERVALO gerado dos `limiares`
 * (C `width > 960` · B `700 <= width <= 960` · A `width < 700`), o que
 * replica o `faixaDe` inclusive na fração. A faixa C também vai num `@media`,
 * e não no `:root` puro: B e A OMITEM a propriedade cujo valor é `'empilha'`
 * (a coluna não existe naquela faixa), e um valor de C no `:root` vazaria
 * para B pela cascata (div. 605). No `:root` puro ficam só os tokens globais.
 * Do bloco da faixa, o CSS leva só `web.*` e `folha.*` — as superfícies do
 * nativo (`s1` … `s5`, `picker`, `palco`, `reordenar`) não são do web.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  bar, dark, faixas, font, INEXISTENTE, light, limiares, lineHeight, radius, size, space, touch, tracking, zoomDefault,
} from '../src/index.ts'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
export const SAIDA = join(RAIZ, 'app/styles/identidade.css')

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
const px = (n) => `${n}px`
const grupo = (prefixo, obj, fmt) => Object.entries(obj).map(([k, v]) => `  --${prefixo}-${kebab(k)}: ${fmt(v)};`)

function globais() {
  return [
    '  /* cores — o tema escuro, a paleta das folhas */',
    ...grupo('cor', dark, String),
    '  /* o claro — só o papel do PDF (DESIGN-I1, README-design, "Cores") */',
    ...grupo('cor-claro', light, String),
    '  /* fontes — família + peso (I1-D31) */',
    ...Object.entries(font).flatMap(([k, f]) => [
      `  --fonte-${kebab(k)}-familia: '${f.familia}';`,
      `  --fonte-${kebab(k)}-peso: ${f.peso};`,
    ]),
    ...grupo('tamanho', size, px),
    ...grupo('entrelinha', lineHeight, String),
    ...grupo('tracking', tracking, (v) => `${v}em`),
    `  --zoom-padrao: ${px(zoomDefault)};`,
    ...grupo('espaco', space, px),
    ...grupo('raio', radius, px),
    ...grupo('toque', touch, px),
    ...grupo('barra', bar, px),
  ]
}

/** `web.*` e `folha.*` de uma faixa; `'empilha'` e `INEXISTENTE` (N4-D64) não geram propriedade. */
function daFaixa(t) {
  const out = []
  const w = t.web
  out.push(`  --faixa-conteiner: ${w.conteiner === null ? 'none' : px(w.conteiner)};`)
  out.push(`  --faixa-margem: ${px(w.margem)};`)
  if (w.colunaLateral !== 'empilha') out.push(`  --faixa-coluna-lateral: ${px(w.colunaLateral)};`)
  if (w.razaoListaDetalhe !== 'empilha') {
    out.push(`  --faixa-razao-lista: ${w.razaoListaDetalhe[0]};`)
    out.push(`  --faixa-razao-detalhe: ${w.razaoListaDetalhe[1]};`)
  }
  out.push(`  --faixa-zona-arquivo: ${px(w.zonaArquivo)};`)
  out.push(`  --faixa-linha-lista: ${px(w.linhaLista)};`)
  out.push(`  --faixa-linha-musica: ${px(w.linhaMusica)};`)
  out.push(`  --faixa-empilha: ${w.empilha ? 1 : 0};`)
  // I1-PR-6 (decisão 2): as medidas fixas das folhas 0 e 1, com nome
  out.push(`  --faixa-marca-largura: ${px(w.marca.largura)};`)
  out.push(`  --faixa-marca-altura: ${px(w.marca.altura)};`)
  for (const k of ['colunaAuth', 'vaoAuth', 'campoAuth', 'botaoAuth', 'botaoAviso', 'entrelinhaAviso', 'limiarAviso']) {
    out.push(`  --faixa-${kebab(k)}: ${px(w[k])};`)
  }
  // I1-PR-9 (folha 4): o metadado de linha e as duas alfas, como color-mix do token de cor
  out.push(`  --faixa-metadado: ${px(w.metadado)};`)
  out.push(`  --faixa-cor-marcado: color-mix(in srgb, var(--cor-accent) ${Math.round(w.alfaMarcado * 100)}%, transparent);`)
  out.push(`  --faixa-cor-dialogo: color-mix(in srgb, var(--cor-bg) ${Math.round(w.alfaDialogo * 100)}%, transparent);`)
  for (const [k, v] of Object.entries(t.folha)) {
    if (v !== INEXISTENTE) out.push(`  --faixa-folha-${kebab(k)}: ${px(v)};`)
  }
  return out
}

export function gerarCss() {
  const media = {
    C: `(width > ${limiares.bc}px)`,
    B: `(${limiares.ab}px <= width <= ${limiares.bc}px)`,
    A: `(width < ${limiares.ab}px)`,
  }
  const linhas = [
    '/*',
    ' * GERADO por packages/identidade/scripts/gerar-css.mjs — NÃO EDITAR À MÃO.',
    ' * Fonte: packages/identidade/src (I1-D3). 1 dp = 1 px. Regenerar:',
    ' *   pnpm exec tsx packages/identidade/scripts/gerar-css.mjs',
    ' * O packages/identidade/test/css.test.ts reprova se este arquivo divergir da fonte.',
    ' */',
    ':root {',
    ...globais(),
    '}',
  ]
  for (const f of ['C', 'B', 'A']) {
    linhas.push('', `/* faixa ${f} */`, `@media ${media[f]} {`, '  :root {', ...daFaixa(faixas[f]).map((l) => `  ${l}`), '  }', '}')
  }
  return `${linhas.join('\n')}\n`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(SAIDA, gerarCss())
  console.log(`escrito: ${SAIDA}`)
}
