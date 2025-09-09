"use client";

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const LibraryLoadingState = memo(function LibraryLoadingState() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
      <CardContent className="p-4 sm:p-8 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-t-amber-600 border-amber-200 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
          Loading your music library...
        </h3>
        <p className="text-[#A69B8E] text-sm">
          Please wait while we fetch your content
        </p>
      </CardContent>
    </Card>
  );
});

export default LibraryLoadingState;
