/**
 * O DUPLO DE `react-native` — N2-PR3, o que torna teste de TELA possível.
 *
 * Até esta PR **nenhum teste renderizava uma tela do nativo**: os projetos
 * `native` do `vitest.config.mts` coletam só `.ts` em ambiente `node`, e o
 * `react-native` de verdade não é importável fora do Metro (o fonte é JS com
 * tipos Flow, que o esbuild do Vite não analisa). Por isso os CNs da N2-PR2
 * mediram o módulo de escrita e **não** a folha, e por isso o `PRD-TELA-2.md`
 * repete, requisito a requisito, "a parte da TELA é das PRs 3–7".
 *
 * **Nenhuma dependência nova.** O `react-dom` 19.2.3 já é devDependency de
 * `apps/native` (par do `react` 19.2.3 que o app usa) e o `jsdom` já é da
 * raiz. Os primitivos viram elementos de DOM e o `testID` vira
 * `data-testid` — é a mesma correspondência que o `uiautomator` faz no
 * aparelho (`testID` → `resource-id`), que é como o G6 lê a árvore.
 *
 * **O que este duplo NÃO é.** Ele não mede geometria: `style` é serializado
 * para `data-style` e nada o resolve em dp. Os 190 × 57,8 do botão e os 48 dp
 * da linha de aviso se medem **no aparelho**, no dump do §4 — como sempre
 * foi nesta série. O que ele mede é o que o DOM sabe dizer: qual nó existe,
 * com que id, com que texto, ativo ou inativo, e o que acontece ao toque.
 */
import { createElement, forwardRef, isValidElement, useImperativeHandle, useLayoutEffect, type ReactNode } from 'react'

/** `StyleSheet.create` é identidade; `flatten` achata arrays e nulos. */
function achatar(estilo: unknown): Record<string, unknown> {
  if (Array.isArray(estilo)) return Object.assign({}, ...estilo.map(achatar))
  if (estilo === null || estilo === undefined || typeof estilo !== 'object') return {}
  return estilo as Record<string, unknown>
}

interface PropsComuns {
  testID?: string
  style?: unknown
  children?: ReactNode
  accessibilityRole?: string
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityState?: { disabled?: boolean; selected?: boolean }
  numberOfLines?: number
  /**
   * Sem assinatura de índice (`[k: string]: unknown`), que foi a primeira
   * forma disto: ela faz a INTERSEÇÃO com `{ onPress?: () => void }` resolver
   * para `unknown`, e o `tsc --noEmit` — passo bloqueante do `native.yml` —
   * reprova com "This expression is not callable". Prop que os primitivos não
   * conhecem simplesmente não chega ao DOM, que é o certo.
   */
  placeholderTextColor?: string
  animationType?: string
  transparent?: boolean
  onRequestClose?: () => void
  mode?: string
  display?: string
  resizeMode?: string
  source?: unknown
  /** N2-PR5 — o que o `PanResponder` deste duplo põe nos `panHandlers`. */
  __pan?: ConfigDoArrasto
  /** QL-PR1 — o duplo só o chama depois de `__colunas(…)` (ver `medida`, mais abaixo). */
  onLayout?: (e: EventoDeLayout) => void
}

/**
 * N2-PR5 — o `PanResponder` do duplo. O gesto de verdade é do aparelho (§4);
 * aqui ele é um REGISTRO: o `create` devolve a própria configuração dentro
 * dos `panHandlers`, o primitivo que os recebe a guarda pelo `testID`, e o
 * teste chama `onPanResponderGrant/Move/Release` como o RN chamaria. O que
 * isto mede é a máquina de estados da tela, não o reconhecedor de toque.
 */
export interface EstadoDoGesto {
  dx: number
  dy: number
  moveY: number
  y0: number
}
export interface ConfigDoArrasto {
  onStartShouldSetPanResponder?: () => boolean
  onPanResponderGrant?: (e: unknown, g: EstadoDoGesto) => void
  onPanResponderMove?: (e: unknown, g: EstadoDoGesto) => void
  onPanResponderRelease?: (e: unknown, g: EstadoDoGesto) => void
  onPanResponderTerminate?: (e: unknown, g: EstadoDoGesto) => void
  onPanResponderTerminationRequest?: () => boolean
}
const arrastos = new Map<string, ConfigDoArrasto>()
export function __arrasto(testID: string): ConfigDoArrasto | undefined {
  return arrastos.get(testID)
}
export const PanResponder = {
  create: (c: ConfigDoArrasto): { panHandlers: { __pan: ConfigDoArrasto } } => ({ panHandlers: { __pan: c } }),
}

/** N2-PR5 — o voltar do sistema: o último ouvinte registrado é o que vale. */
let aoVoltar: (() => boolean) | null = null
export const BackHandler = {
  addEventListener: (_e: string, h: () => boolean): { remove: () => void } => {
    aoVoltar = h
    return { remove: () => { if (aoVoltar === h) aoVoltar = null } }
  },
}
export function __voltarDoSistema(): boolean {
  return aoVoltar?.() ?? false
}

/**
 * Os atributos que TODO primitivo carrega para o DOM. `data-disabled` sai do
 * `accessibilityState`, que é como o RN conta "inativo" para o leitor de tela
 * e o que o `uiautomator` grava como `enabled="false"`.
 */
function atributos(p: PropsComuns): Record<string, unknown> {
  // N4-PR8 (regra 32): o `style` de um Pressable pode ser uma FUNÇÃO do estado (`({ pressed }) => …`, a linha da L
  // tocável); o RN a chama, e o duplo também — sem o dedo encostado (`pressed: false`). Antes ela não era achatada e o
  // `data-style` sumia do nó.
  const est = achatar(typeof p.style === 'function' ? (p.style as (e: { pressed: boolean }) => unknown)({ pressed: false }) : p.style)
  const fora: Record<string, unknown> = {
    'data-testid': p.testID,
    'data-style': Object.keys(est).length > 0 ? JSON.stringify(est) : undefined,
    'data-role': p.accessibilityRole,
    'aria-label': p.accessibilityLabel,
    'data-hint': p.accessibilityHint,
    'data-disabled': p.accessibilityState?.disabled === true ? 'true' : undefined,
    'data-numberoflines': p.numberOfLines,
  }
  for (const k of Object.keys(fora)) if (fora[k] === undefined) delete fora[k]
  return fora
}

function primitivo(tag: string, nome: string) {
  const C = forwardRef<unknown, PropsComuns>((p, ref) => {
    if (p.__pan !== undefined && p.testID !== undefined) arrastos.set(p.testID, p.__pan)
    useMedida(p, nome === 'Text')
    return createElement(tag, { ...atributos(p), ref }, p.children as ReactNode)
  })
  C.displayName = nome
  return C
}

export const View = primitivo('div', 'View')
export const Text = primitivo('span', 'Text')
/**
 * `ScrollView` com os dois métodos de instância que o modo de reordenar usa
 * (N2-PR5): `scrollTo` (a rolagem automática a 48 dp das bordas) e
 * `measureInWindow` (onde a lista está na tela). Aqui não há rolagem: os dois
 * existem para que a tela não precise perguntar se existem.
 */
/**
 * QL-PR3 — a âncora (QL-D18) mexe na rolagem: o duplo REGISTRA cada `scrollTo({ y })` (`__rolagens()`) e deixa o teste
 * entregar um `onScroll` a toda rolagem que o escuta (`__rolar(y)`), como o RN entrega quando o dedo rola. Não há
 * rolagem de verdade: é o registro do que a tela PEDIU, e o que a tela ACHA que está na rolagem.
 */
interface EventoDeRolagem {
  nativeEvent: { contentOffset: { x: number; y: number } }
}
const rolagensPedidas: number[] = []
const ouvintesDeRolagem = new Set<(e: EventoDeRolagem) => void>()
export function __rolagens(): number[] {
  return [...rolagensPedidas]
}
export function __limparRolagens(): void {
  rolagensPedidas.length = 0
}
export function __rolar(y: number): void {
  for (const f of ouvintesDeRolagem) f({ nativeEvent: { contentOffset: { x: 0, y } } })
}
export const ScrollView = forwardRef<
  unknown,
  PropsComuns & { scrollEnabled?: boolean; horizontal?: boolean; onScroll?: (e: EventoDeRolagem) => void }
>((p, ref) => {
  useMedida(p, false)
  const onScroll = p.onScroll
  useLayoutEffect(() => {
    if (onScroll === undefined) return
    ouvintesDeRolagem.add(onScroll)
    return () => {
      ouvintesDeRolagem.delete(onScroll)
    }
  }, [onScroll])
  useImperativeHandle(ref, () => ({
    scrollTo: (o?: { y?: number }): void => {
      if (typeof o?.y === 'number') rolagensPedidas.push(o.y)
    },
    measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void): void => cb(0, 152, 1138, 475),
  }))
  return createElement(
    'div',
    // N4-PR8: `data-horizontal` — o leitor do palco põe o corpo numa rolagem HORIZONTAL (é o que impede a quebra de
    // linha, T1-R25); a visualização tem de pôr também (N4-R13), e o teste lê o atributo.
    {
      ...atributos(p),
      'data-scrollenabled': p.scrollEnabled === false ? 'false' : undefined,
      'data-horizontal': p.horizontal === true ? 'true' : undefined,
    },
    p.children as ReactNode,
  )
})
ScrollView.displayName = 'ScrollView'
export const Image = primitivo('img', 'Image')
export const ActivityIndicator = primitivo('div', 'ActivityIndicator')
export const SafeAreaView = primitivo('div', 'SafeAreaView')

/**
 * `Pressable` — o toque vira `click`.
 *
 * `<div role="button">` e **não** `<button>`: no RN um `Pressable` dentro de
 * outro é legítimo e o app tem um (o `Baixar esta setlist` dentro do cartão de
 * S1), mas `<button>` dentro de `<button>` é HTML inválido e o React avisa a
 * cada render. O que os CNs leem é o `data-testid` e o `data-disabled`, que
 * não dependem da tag.
 */
export const Pressable = forwardRef<unknown, PropsComuns & { onPress?: () => void; disabled?: boolean }>(
  (p, ref) =>
    createElement(
      'div',
      {
        ...atributos(p),
        role: 'button',
        // N4-PR8 (regra 32: o defeito do duplo se conserta no duplo): no RN o toque vai ao Pressable MAIS FUNDO e o de
        // fora não dispara (o sistema de responder); no DOM o `click` borbulha, e um Pressable dentro de outro (a estrela
        // e o ▶ dentro da linha da L, que passa a ser tocável) acionava os dois. O de dentro para a propagação.
        onClick: (e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          p.onPress?.()
        },
        ref,
      },
      p.children as ReactNode,
    ),
)
Pressable.displayName = 'Pressable'

export const TouchableOpacity = Pressable

/**
 * `TextInput` controlado: `value`/`onChangeText`, `editable` (que no RN é o
 * avesso de `disabled`) e `placeholder`. `autoFocus` vai para o DOM, e é ele
 * que o CN do "ao abrir, o nome já está em foco" lê.
 *
 * N4-PR7 (o CN 5 que não reprovou): o React CONSOME o `autoFocus` de um
 * `<input>` — foca na montagem e não escreve o atributo —, então
 * `el.autofocus` é sempre `false` e um teste que o lê não pode reprovar. O
 * duplo passa a escrever também `data-autofocus`, que é o que o teste da L lê.
 */
export const TextInput = forwardRef<
  unknown,
  PropsComuns & {
    value?: string
    onChangeText?: (t: string) => void
    placeholder?: string
    editable?: boolean
    autoFocus?: boolean
  }
>((p, ref) =>
  createElement('input', {
    ...atributos(p),
    value: p.value ?? '',
    placeholder: p.placeholder,
    disabled: p.editable === false,
    autoFocus: p.autoFocus,
    'data-autofocus': p.autoFocus === true ? 'true' : undefined,
    onChange: (e: { target: { value: string } }) => p.onChangeText?.(e.target.value),
    ref,
  }),
)
TextInput.displayName = 'TextInput'

/** `Modal`: some quando `visible` é falso — é o que a folha usa. */
export function Modal(p: PropsComuns & { visible?: boolean }): React.JSX.Element | null {
  if (p.visible === false) return null
  return createElement('div', { ...atributos(p), 'data-modal': 'true' }, p.children as ReactNode)
}

/**
 * `FlatList`: renderiza tudo — virtualização não é o que estes CNs medem.
 * N3-PR3: o `numColumns` vai para `data-numcolumns` — a grade de duas colunas
 * de C e a coluna única de B (moldura `N3-B-S2e`) são a mesma lista com outro
 * número, e o duplo não tem geometria para mostrar a diferença de outro jeito.
 *
 * N4-PR7 (o CN 1 que não reprovou): o `ListHeaderComponent` e o
 * `ListFooterComponent` ROLAM com a lista no RN — eles moram DENTRO dela. O
 * duplo os ignorava, e "a régua fica fora da lista" passava com a régua
 * plantada no cabeçalho. Agora o duplo os desenha dentro do contêiner, onde o
 * RN os põe.
 */
export function FlatList<T>(p: {
  data: readonly T[]
  keyExtractor?: (item: T, i: number) => string
  renderItem: (info: { item: T; index: number }) => ReactNode
  contentContainerStyle?: unknown
  numColumns?: number
  testID?: string
  ListHeaderComponent?: ReactNode
  ListFooterComponent?: ReactNode
}): React.JSX.Element {
  return createElement(
    'div',
    { 'data-testid': p.testID, 'data-flatlist': 'true', 'data-numcolumns': p.numColumns ?? 1 },
    p.ListHeaderComponent ?? null,
    p.data.map((item, index) =>
      createElement(
        'div',
        { key: p.keyExtractor?.(item, index) ?? String(index) },
        p.renderItem({ item, index }) as ReactNode,
      ),
    ),
    p.ListFooterComponent ?? null,
  )
}

export const StyleSheet = {
  create: <T,>(o: T): T => o,
  flatten: achatar,
  hairlineWidth: 1,
  absoluteFillObject: {},
}

/**
 * N4-PR7 — `KeyboardAvoidingView`: um `View` que escreve o `behavior` em `data-keyboard-behavior`. A altura que ele
 * tira com o teclado de pé é do aparelho (o dump); o duplo só prova QUE a tela o usa, e com que comportamento.
 */
export const KeyboardAvoidingView = forwardRef<unknown, PropsComuns & { behavior?: string; keyboardVerticalOffset?: number }>(
  (p, ref) =>
    createElement(
      'div',
      { ...atributos(p), 'data-keyboard-behavior': p.behavior, 'data-keyboard-offset': p.keyboardVerticalOffset, ref },
      p.children as ReactNode,
    ),
)
KeyboardAvoidingView.displayName = 'KeyboardAvoidingView'

export const Platform = { OS: 'android' as const, select: (o: Record<string, unknown>) => o.android ?? o.default }
export const Keyboard = { dismiss: (): void => undefined }
/**
 * N3-PR2 — a JANELA do duplo, que decide a faixa (T3-R1). O padrão é o canvas
 * de C (1138 × 627): todo teste de tela anterior ao N3 continua em C sem
 * mudança, e é isso que o CP da invariante em jsdom afirma. Quem quer outra
 * faixa chama `__janela(largura, altura)` antes de montar e `__janela()` no
 * fim. Nada aqui resolve geometria: só a largura que o `faixaDe()` lê.
 */
const C_PADRAO = { width: 1138, height: 627, scale: 1, fontScale: 1 }

/**
 * QL-PR1 (QL-D16, div. 1185) — o duplo RECEBE COLUNAS. A quebra (QL) vai depender de duas medidas que o app tira do
 * `onLayout`: a largura da coluna do leitor e a de um caractere da mono no zoom corrente (QL-D13). Até aqui o duplo
 * nunca chamava `onLayout`: no `jsdom` o leitor nunca teria colunas, nunca quebraria, e o G-par de V passaria **sem ver
 * a quebra** — o instrumento com escopo menor do que parece.
 *
 * `__colunas(n, zoom?)` LIGA a medida: daí em diante todo primitivo com `onLayout` o recebe uma vez, na montagem —
 *   - um `Text`: largura = colunas do texto × `caractereDoDuplo(fontSize)`, altura = linhas × entrelinha;
 *   - uma `View` ou `ScrollView`: a largura de `n` colunas no `zoom` (22 se omitido) mais o respiro do corpo de 2 × 32
 *     (`leitor.conteudoPad`) — com meia coluna de folga, para o `⌊…⌋` do app dar `n` e não `n − 1` por arredondamento;
 *     altura = a da janela.
 * `__colunas()` DESLIGA. **Desligada é o padrão**, e é o comportamento de antes: nenhum teste anterior recebe
 * `onLayout` (o palco, o fim e o reordenar têm `onLayout` e nada neles muda).
 *
 * O que isto NÃO é: geometria (o APARATO, "O que o `native-tela` prova"). O caractere do duplo é a escala linear da
 * medida do zoom 22 (13,33 dp, `N4-PR8-anexos/regua-avd.txt`) — a largura de verdade em cada zoom é a da régua no
 * aparelho (`QL-PR1-anexos`, A-QL-6). O que importa aqui é que a coluna e o caractere venham da MESMA conta: o app
 * divide um pelo outro e chega a `n`.
 */
export interface EventoDeLayout {
  nativeEvent: { layout: { x: number; y: number; width: number; height: number } }
}
export const caractereDoDuplo = (fontSize: number): number => (1333.3 / 100) * (fontSize / 22)
const RESPIRO_DO_CORPO = 2 * 32
let medida: { largura: number } | null = null
export function __colunas(n?: number, zoom = 22): void {
  medida = n === undefined ? null : { largura: (n + 0.5) * caractereDoDuplo(zoom) + RESPIRO_DO_CORPO }
}
/**
 * QL-PR3 (QL-D43) — a largura CRUA de toda `View`/`ScrollView` com `onLayout`, sem a conta das colunas: `__larguraCrua(0)`
 * é o contêiner medido com 0 (o primeiro `onLayout` de uma tela que ainda não tem largura). O `Text` continua com a
 * largura do texto. `__colunas()` desliga as duas.
 */
export function __larguraCrua(largura: number): void {
  medida = { largura }
}
function textoDe(filhos: ReactNode): string {
  if (typeof filhos === 'string' || typeof filhos === 'number') return String(filhos)
  if (Array.isArray(filhos)) return filhos.map(textoDe).join('')
  if (isValidElement(filhos)) return textoDe((filhos.props as { children?: ReactNode }).children)
  return ''
}
function useMedida(p: PropsComuns, ehTexto: boolean): void {
  const ligada = medida
  useLayoutEffect(() => {
    if (ligada === null || p.onLayout === undefined) return
    const est = achatar(p.style)
    const fonte = typeof est.fontSize === 'number' ? est.fontSize : 14
    const linhas = textoDe(p.children).split('\n')
    const width = ehTexto ? Math.max(...linhas.map((l) => l.length)) * caractereDoDuplo(fonte) : ligada.largura
    const height = ehTexto ? linhas.length * (typeof est.lineHeight === 'number' ? est.lineHeight : fonte * 1.55) : janela.height
    p.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } })
    // uma vez, na montagem — como o primeiro `onLayout` do RN
  }, [])
}
let janela = C_PADRAO
export function __janela(width?: number, height?: number): void {
  janela = width === undefined || height === undefined ? C_PADRAO : { ...C_PADRAO, width, height }
}
export const Dimensions = { get: () => janela }
export function useWindowDimensions(): typeof janela {
  return janela
}
