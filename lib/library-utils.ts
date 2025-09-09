import { ContentType, getContentTypeIcon, getContentTypeColors } from '@/types/content';
import { ContentItem } from '@/types/library';

/**
 * Format a date string for display in the library
 */
export function formatLibraryDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get content icon component and styling classes for the library
 */
export function getLibraryContentIconData(type: string) {
  const IconComponent = getContentTypeIcon(type);
  const colors = getContentTypeColors(type);
  return {
    IconComponent,
    className: `w-5 h-5 ${colors.primary}`
  };
}

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

/**
 * Get difficulty badge styling
 */
export function getDifficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-100 text-green-800 border-green-200";
    case "Intermediate":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Advanced":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get content type filter options
 */
export function getContentTypeFilterOptions() {
  return [
    { display: "Tab", value: ContentType.TAB },
    { display: "Chords", value: ContentType.CHORDS },
    { display: "Sheet", value: ContentType.SHEET },
    { display: "Lyrics", value: ContentType.LYRICS },
  ];
}

/**
 * Get difficulty filter options
 */
export function getDifficultyFilterOptions() {
  return [
    { display: "Beginner", value: "Beginner" },
    { display: "Intermediate", value: "Intermediate" },
    { display: "Advanced", value: "Advanced" },
  ];
}
