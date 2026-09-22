/**
 * O duplo de `@react-native-community/datetimepicker` (N2-PR3).
 *
 * O módulo real é NATIVO: não existe fora do dev client. Aqui ele vira um
 * botão que, ao ser tocado, devolve a data que o teste pediu — o suficiente
 * para os CNs medirem o que é do CLIENTE: que o valor escolhido vira
 * `YYYY-MM-DD` pelos componentes LOCAIS da data (T2-R2), sem `toISOString()`.
 *
 * `__proximaData` é o que o seletor vai devolver no próximo toque. Sem ela o
 * duplo devolveria sempre hoje, e o CN da data de +3 dias não teria o que
 * medir.
 */
import { createElement } from 'react'

let proxima: Date | null = null
export function __proximaData(d: Date | null): void {
  proxima = d
}

export interface DateTimePickerEvent {
  type: 'set' | 'dismissed'
}

export default function DateTimePicker(p: {
  value: Date
  onChange?: (e: DateTimePickerEvent, d?: Date) => void
  testID?: string
  [k: string]: unknown
}): React.JSX.Element {
  return createElement('button', {
    type: 'button',
    'data-testid': p.testID ?? 'seletor-de-data',
    onClick: () =>
      proxima === null
        ? p.onChange?.({ type: 'dismissed' }, undefined)
        : p.onChange?.({ type: 'set' }, proxima),
  })
}
