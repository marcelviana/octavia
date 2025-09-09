"use client";

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import { hasActiveFilters } from '@/lib/library-utils';

interface LibraryEmptyStateProps {
  searchQuery: string;
  filters: {
    contentType: string[];
    difficulty: string[];
    key: string[];
    favorite: boolean;
  };
  onAddContent: () => void;
}

const LibraryEmptyState = memo<LibraryEmptyStateProps>(function LibraryEmptyState({
  searchQuery,
  filters,
  onAddContent,
}) {
  const hasFiltersActive = hasActiveFilters(filters);
  const hasSearchOrFilters = searchQuery || hasFiltersActive;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
      <CardContent className="p-4 sm:p-8 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
          No content found
        </h3>
        <p className="text-[#A69B8E] mb-3 sm:mb-4 text-sm">
          {hasSearchOrFilters
            ? "Try adjusting your search or filters"
            : "Add your first piece of music content to get started"}
        </p>
        <Button
          onClick={onAddContent}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </CardContent>
    </Card>
  );
});

export default LibraryEmptyState;
