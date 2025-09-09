import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('@/hooks/use-library-data');
vi.mock('@/hooks/use-content-actions');
vi.mock('@/hooks/use-navigation-actions');
vi.mock('@/contexts/firebase-auth-context');

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

import { LibraryProps } from '@/types/library';
import LibraryHeader from '@/components/library/LibraryHeader';
import LibraryPagination from '@/components/library/LibraryPagination';
import LibraryEmptyState from '@/components/library/LibraryEmptyState';
import LibraryLoadingState from '@/components/library/LibraryLoadingState';
import LibraryErrorBoundary from '@/components/library/LibraryErrorBoundary';

// Mock content item for testing
const mockContentItem = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  content_type: 'Chords',
  key: 'G',
  difficulty: 'Beginner' as const,
  is_favorite: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user123',
};

describe('LibraryHeader', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    sortBy: 'recent' as const,
    onSortChange: vi.fn(),
    filters: {
      contentType: [],
      difficulty: [],
      key: [],
      favorite: false,
    },
    onFiltersChange: vi.fn(),
    onAddContent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header title and description', () => {
    render(<LibraryHeader {...defaultProps} />);
    
    expect(screen.getByText('Your Music Library')).toBeInTheDocument();
    expect(screen.getByText('Manage and organize all your musical content')).toBeInTheDocument();
  });

  it('calls onAddContent when add button is clicked', () => {
    render(<LibraryHeader {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add content/i });
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddContent).toHaveBeenCalledTimes(1);
  });

  it('updates sort when select changes', async () => {
    render(<LibraryHeader {...defaultProps} />);
    
    // Find and click the sort trigger
    const sortTrigger = screen.getByRole('combobox');
    fireEvent.click(sortTrigger);
    
    // Wait for the dropdown to appear and click title option
    await waitFor(() => {
      const titleOption = screen.getByText('Title (A-Z)');
      fireEvent.click(titleOption);
    });
    
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('title');
  });
});

describe('LibraryPagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalCount: 100,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pagination controls', () => {
    render(<LibraryPagination {...defaultProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onPageChange when page is clicked', () => {
    render(<LibraryPagination {...defaultProps} />);
    
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not render when totalCount is 0', () => {
    render(<LibraryPagination {...defaultProps} totalCount={0} />);
    
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('does not render when totalPages is 1', () => {
    render(<LibraryPagination {...defaultProps} totalPages={1} />);
    
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});

describe('LibraryEmptyState', () => {
  const defaultProps = {
    searchQuery: '',
    filters: {
      contentType: [],
      difficulty: [],
      key: [],
      favorite: false,
    },
    onAddContent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state message', () => {
    render(<LibraryEmptyState {...defaultProps} />);
    
    expect(screen.getByText('No content found')).toBeInTheDocument();
    expect(screen.getByText('Add your first piece of music content to get started')).toBeInTheDocument();
  });

  it('shows different message when filters are active', () => {
    const propsWithFilters = {
      ...defaultProps,
      filters: {
        ...defaultProps.filters,
        contentType: ['Chords'],
      },
    };
    
    render(<LibraryEmptyState {...propsWithFilters} />);
    
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('shows different message when search query exists', () => {
    render(<LibraryEmptyState {...defaultProps} searchQuery="test" />);
    
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('calls onAddContent when add button is clicked', () => {
    render(<LibraryEmptyState {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add content/i });
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddContent).toHaveBeenCalledTimes(1);
  });
});

describe('LibraryLoadingState', () => {
  it('renders loading message and spinner', () => {
    render(<LibraryLoadingState />);
    
    expect(screen.getByText('Loading your music library...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we fetch your content')).toBeInTheDocument();
  });
});

describe('LibraryErrorBoundary', () => {
  // Suppress console.error during error boundary tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('renders children when there is no error', () => {
    render(
      <LibraryErrorBoundary>
        <ThrowError shouldThrow={false} />
      </LibraryErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error message when there is an error', () => {
    render(
      <LibraryErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LibraryErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('There was an error loading your music library. Please try again.')).toBeInTheDocument();
  });

  it('shows retry button and allows retry', () => {
    render(
      <LibraryErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LibraryErrorBoundary>
    );
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    // Clicking retry should clear the error state
    fireEvent.click(retryButton);
    
    // After retry, it should try to render children again
    // Since our ThrowError component will throw again, it will show error again
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
