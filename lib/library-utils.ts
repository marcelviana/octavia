/**
 * As contas da biblioteca que não são tela. I1-PR-9: o que era de tela saiu para
 * `components/library/frases-lista.ts` — a data curta pt-BR (`dataCurta`, no
 * lugar do `formatLibraryDate` `en-US`), os rótulos dos filtros (`TIPOS`,
 * `DIFICULDADES`) e o ícone do tipo (`tipoDe`); a cor da dificuldade saiu com o
 * selo (decisão 10 do aval).
 */

/**
 * Calculate total pages based on total count and page size
 */
export function calculateTotalPages(totalCount: number, pageSize: number): number {
  return Math.ceil(totalCount / pageSize);
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: {
  contentType: string[];
  difficulty: string[];
  key: string[];
  favorite: boolean;
}): boolean {
  return (
    filters.contentType.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.key.length > 0 ||
    filters.favorite
  );
}

/**
 * Generate pagination range for display
 */
export function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return Array.from({ length: maxVisible }, (_, i) => i + 1);
  }

  if (currentPage >= totalPages - 2) {
    return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + 1 + i);
  }

  return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
}
