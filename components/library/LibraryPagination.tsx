"use client";

import React, { memo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { LibraryPaginationProps } from '@/types/library';
import { generatePaginationRange } from '@/lib/library-utils';

const LibraryPagination = memo<LibraryPaginationProps>(function LibraryPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) {
  // Don't render if there's no content or only one page
  if (totalCount === 0 || totalPages <= 1) {
    return null;
  }

  const pageRange = generatePaginationRange(currentPage, totalPages);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="mt-3 sm:mt-6 mb-4 flex justify-center">
      <Pagination>
        <PaginationContent className="flex-wrap justify-center gap-1">
          <PaginationItem>
            <PaginationPrevious
              className={cn(
                currentPage === 1 && "pointer-events-none opacity-50",
                "text-xs sm:text-sm h-8 px-2 sm:h-9 sm:px-3 cursor-pointer"
              )}
              onClick={handlePreviousPage}
            />
          </PaginationItem>
          
          {pageRange.map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                isActive={currentPage === pageNum}
                onClick={() => onPageChange(pageNum)}
                className="text-xs sm:text-sm h-8 w-8 sm:h-9 sm:w-9 cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext
              className={cn(
                currentPage === totalPages && "pointer-events-none opacity-50",
                "text-xs sm:text-sm h-8 px-2 sm:h-9 sm:px-3 cursor-pointer"
              )}
              onClick={handleNextPage}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
});

export default LibraryPagination;
