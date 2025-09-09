"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseNavigationActionsResult {
  navigateToAddContent: () => void;
  navigateToEditContent: (contentId: string) => void;
  navigateToContent: (contentId: string) => void;
}

export function useNavigationActions(): UseNavigationActionsResult {
  const router = useRouter();

  const navigateToAddContent = useCallback(() => {
    router.push('/add-content');
  }, [router]);

  const navigateToEditContent = useCallback((contentId: string) => {
    router.push(`/content/${contentId}/edit`);
  }, [router]);

  const navigateToContent = useCallback((contentId: string) => {
    router.push(`/content/${contentId}`);
  }, [router]);

  return {
    navigateToAddContent,
    navigateToEditContent,
    navigateToContent,
  };
}
