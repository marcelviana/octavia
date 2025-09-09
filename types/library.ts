import { ContentType } from './content';

// Core content item interface
export interface ContentItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  content_type: ContentType | string;
  key?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Library component props
export interface LibraryProps {
  onSelectContent: (content: ContentItem) => void;
  initialContent: ContentItem[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialSearch?: string;
}

// Filter options for library
export interface LibraryFilters {
  contentType: string[];
  difficulty: string[];
  key: string[];
  favorite: boolean;
}

// Sort options
export type SortOption = 'recent' | 'title' | 'artist';

// Library header props
export interface LibraryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: LibraryFilters;
  onFiltersChange: (filters: LibraryFilters) => void;
  onAddContent: () => void;
}

// Library pagination props
export interface LibraryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

// Content actions handlers
export interface ContentActions {
  onSelect: (content: ContentItem) => void;
  onEdit: (content: ContentItem) => void;
  onDelete: (content: ContentItem) => void;
  onToggleFavorite: (content: ContentItem) => void;
}

// Error state
export interface LibraryError {
  message: string;
  type: 'AUTH_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
}
