"use client";

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Filter,
  Plus,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';
import { LibraryHeaderProps, LibraryFilters } from '@/types/library';
import { getContentTypeFilterOptions, getDifficultyFilterOptions } from '@/lib/library-utils';

const LibraryHeader = memo<LibraryHeaderProps>(function LibraryHeader({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
  onAddContent,
}) {
  const contentTypeOptions = getContentTypeFilterOptions();
  const difficultyOptions = getDifficultyFilterOptions();

  const handleFilterChange = (
    filterType: keyof LibraryFilters,
    value: string | boolean,
    isToggle: boolean = false
  ) => {
    if (filterType === 'favorite' && typeof value === 'boolean') {
      onFiltersChange({
        ...filters,
        favorite: value,
      });
      return;
    }

    if (typeof value === 'string' && filterType !== 'favorite') {
      const currentValues = filters[filterType] as string[];
      const newValues = isToggle
        ? currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
        : [value];

      onFiltersChange({
        ...filters,
        [filterType]: newValues,
      });
    }
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-2 md:gap-4 mb-2 sm:mb-4 md:mb-6">
      <div className="flex items-start justify-between gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[60px]">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Your Music Library
          </h1>
          <p className="text-[#A69B8E] mt-0 sm:mt-0.5 md:mt-1 text-xs sm:text-sm md:text-base">
            Manage and organize all your musical content
          </p>
        </div>
        
        <div className="flex gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-amber-200 bg-white hover:bg-amber-50 text-xs sm:text-sm flex-shrink-0 h-7 sm:h-8 md:h-9 px-1.5 sm:px-2 md:px-3"
                size="sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline ml-1 sm:ml-2">Filters</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <p className="text-sm font-medium mb-1">Content Type</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {contentTypeOptions.map((type) => (
                    <Badge
                      key={type.value}
                      variant={
                        filters.contentType.includes(type.value)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        handleFilterChange('contentType', type.value, true);
                      }}
                    >
                      {type.display}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-sm font-medium mb-1 mt-3">Difficulty</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {difficultyOptions.map((difficulty) => (
                    <Badge
                      key={difficulty.value}
                      variant={
                        filters.difficulty.includes(difficulty.value)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        handleFilterChange('difficulty', difficulty.value, true);
                      }}
                    >
                      {difficulty.display}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center mt-3">
                  <input
                    type="checkbox"
                    id="favorites"
                    checked={filters.favorite}
                    onChange={(e) => handleFilterChange('favorite', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="favorites" className="text-sm">
                    Favorites only
                  </label>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Button */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-9 sm:w-10 md:w-[120px] border-amber-200 bg-white hover:bg-amber-50 text-xs sm:text-sm flex-shrink-0 h-7 sm:h-8 md:h-9 justify-center md:justify-start px-1.5 sm:px-2 md:px-3">
              <div className="flex items-center">
                <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline md:ml-2">Sort</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="artist">Artist (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Content Button */}
          <Button
            onClick={onAddContent}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm h-7 sm:h-8 md:h-9 px-1.5 sm:px-2 md:px-3"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Content</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default LibraryHeader;
