/**
 * Normalização de busca da tela 1 (PRD T1-R21, decisão C-D3):
 * NFD → remoção das marcas diacríticas (U+0300–U+036F) → minúsculas →
 * colapso de espaços em um → trim. Assim `aguas` casa `Águas`.
 * Lógica pura: zero dependência de react/react-native/firebase (N0-PRECHECK C1/E3).
 */
export function normalizeForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
