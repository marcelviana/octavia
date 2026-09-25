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
import { createElement, forwardRef, useImperativeHandle, type ReactNode } from 'react'

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
  const est = achatar(p.style)
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
export const ScrollView = forwardRef<unknown, PropsComuns & { scrollEnabled?: boolean }>((p, ref) => {
  useImperativeHandle(ref, () => ({
    scrollTo: (): void => undefined,
    measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void): void => cb(0, 152, 1138, 475),
  }))
  return createElement(
    'div',
    { ...atributos(p), 'data-scrollenabled': p.scrollEnabled === false ? 'false' : undefined },
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
        onClick: () => p.onPress?.(),
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
 */
export function FlatList<T>(p: {
  data: readonly T[]
  keyExtractor?: (item: T, i: number) => string
  renderItem: (info: { item: T; index: number }) => ReactNode
  contentContainerStyle?: unknown
  numColumns?: number
  testID?: string
}): React.JSX.Element {
  return createElement(
    'div',
    { 'data-testid': p.testID, 'data-flatlist': 'true', 'data-numcolumns': p.numColumns ?? 1 },
    p.data.map((item, index) =>
      createElement(
        'div',
        { key: p.keyExtractor?.(item, index) ?? String(index) },
        p.renderItem({ item, index }) as ReactNode,
      ),
    ),
  )
}

export const StyleSheet = {
  create: <T,>(o: T): T => o,
  flatten: achatar,
  hairlineWidth: 1,
  absoluteFillObject: {},
}

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
let janela = C_PADRAO
export function __janela(width?: number, height?: number): void {
  janela = width === undefined || height === undefined ? C_PADRAO : { ...C_PADRAO, width, height }
}
export const Dimensions = { get: () => janela }
export function useWindowDimensions(): typeof janela {
  return janela
}
