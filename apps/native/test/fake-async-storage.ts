/**
 * Duplo do `@react-native-async-storage/async-storage` para o projeto `native-tela` (QL-PR4, QL-D39). O de verdade fala
 * com o módulo nativo (no Android, o banco `RKStorage` do app), que não existe no `jsdom`.
 *
 * O que ele guarda mora no `globalThis`, e não no módulo: um `vi.resetModules()` recria o `preferencias.ts` (a memória
 * do app some, como num `force-stop`), e o que foi gravado continua aqui — como o disco do aparelho. É isso que faz o
 * teste "gravar, reabrir, ler" medir a gravação, e não a memória.
 *
 * `__armazem()` devolve o conteúdo (o teste confere a chave e o valor); `__limparArmazem()` é o aparelho novo;
 * `__falharArmazem(true)` faz toda operação rejeitar (o armazenamento que falha não pode derrubar o palco).
 */
interface Estado {
  dados: Map<string, string>
  falhar: boolean
}
const g = globalThis as { __octaviaArmazem?: Estado }
const estado = (): Estado => (g.__octaviaArmazem ??= { dados: new Map(), falhar: false })

const falha = (): Promise<never> => Promise.reject(new Error('armazenamento indisponível (duplo)'))

const AsyncStorage = {
  getItem: (k: string): Promise<string | null> => (estado().falhar ? falha() : Promise.resolve(estado().dados.get(k) ?? null)),
  setItem: (k: string, v: string): Promise<void> => {
    if (estado().falhar) return falha()
    estado().dados.set(k, v)
    return Promise.resolve()
  },
  removeItem: (k: string): Promise<void> => {
    if (estado().falhar) return falha()
    estado().dados.delete(k)
    return Promise.resolve()
  },
}
export default AsyncStorage

export function __armazem(): ReadonlyMap<string, string> {
  return new Map(estado().dados)
}
export function __limparArmazem(): void {
  estado().dados.clear()
  estado().falhar = false
}
export function __falharArmazem(sim: boolean): void {
  estado().falhar = sim
}
