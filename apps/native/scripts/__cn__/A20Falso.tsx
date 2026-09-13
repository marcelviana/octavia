/**
 * CONTROLE NEGATIVO do G4 (`gate:a20:cn`) — fora de `src/`, nunca importado
 * pelo app. Sem ele o gate é promessa, não gate. Os quatro casos do
 * V1-PRECHECK §5.3 mais o quinto da V1-PR3 (label em expressão):
 *
 *   (1) DEVE SER ACUSADO   literal em inglês num `accessibilityLabel`
 *   (2) DEVE SER ACUSADO   `accessibilityHint` em inglês
 *   (3) NÃO pode ser acusado   nome de glifo é identificador, não texto
 *   (4) NÃO pode ser acusado   pt-BR com anglicismo do produto
 *   (5) DEVE SER ACUSADO   inglês escondido num ternário de label
 *
 * Esperado: 3 acusações, exit 1. Auto-contido (o `Icon` abaixo é um stub),
 * para passar no `tsc --noEmit` do app sem importar nada que não exista.
 */
import { Pressable, Text } from 'react-native'

function Icon(_p: { name: string; size: number }): null {
  return null
}

export function Falso({ ligado }: { ligado: boolean }): React.JSX.Element {
  return (
    <>
      <Pressable accessibilityLabel="Zoom in" testID="zoom-mais">
        <Icon name="zoom-in" size={24} />
      </Pressable>
      <Pressable accessibilityHint="Go back to the previous song" testID="borda-voltar">
        <Icon name="chevron-left" size={24} />
      </Pressable>
      <Icon name="search" size={24} />
      <Icon name="pause" size={24} />
      <Pressable accessibilityLabel="Ampliar o texto" testID="zoom-mais-2">
        <Icon name="zoom-in" size={24} />
      </Pressable>
      <Pressable accessibilityLabel={ligado ? 'Rolagem automática, ligada' : 'Auto-scroll, loading'} testID="auto-scroll">
        <Icon name="auto-scroll" size={28} />
      </Pressable>
      <Text>Auto-scroll</Text>
      <Text>SETLISTS</Text>
    </>
  )
}
